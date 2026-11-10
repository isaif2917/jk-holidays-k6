// admin-ops — privileged admin operations, run inside Lovable Cloud.
//
// WHY THIS EXISTS: these operations need the Supabase service role key. Lovable Cloud
// injects SUPABASE_SERVICE_ROLE_KEY only into its own runtimes, and Cloud secrets are
// write-only (reserved SUPABASE_* names can never be read back), so a server running on
// Vercel or a laptop cannot have it. Running the work here means no host outside Lovable
// Cloud ever needs the secret. See src/lib/admin.functions.ts for the browser wrapper.
//
// DEPLOYING: a git push does NOT deploy this. Ask Lovable in the project chat to deploy
// the edge function, then confirm the version under More -> Database -> Manage -> Edge functions.
//
// STAGE 0 (current): only the `ping` diagnostic, to prove deployment, proxy routing,
// env vars, _shared/ bundling, JWT delivery and has_role before any behaviour moves here.
import { preflight } from "../_shared/cors.ts";
import { HttpError, fail, json } from "../_shared/http.ts";
import {
  callerClient,
  publishableKey,
  serviceClient,
  serviceRoleKey,
  supabaseUrl,
} from "../_shared/clients.ts";

function bearer(req: Request): string {
  return (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

/**
 * Diagnostic. Reports names and booleans only — never key material.
 * Unlike the real handlers it REPORTS the admin verdict instead of enforcing it, so a
 * non-admin token still returns 200 with isAdmin:false. That is the point: it tells you
 * which link in the chain is broken. Remove these fields once Stage 1 begins.
 */
async function ping(req: Request): Promise<Record<string, unknown>> {
  const token = bearer(req);
  const serviceKey = serviceRoleKey();
  const anonKey = publishableKey();
  const url = supabaseUrl();

  const result: Record<string, unknown> = {
    ok: true,
    stage: "0-ping",
    env: {
      names: Object.keys(Deno.env.toObject())
        .filter((k) => k.startsWith("SUPABASE_") || k.startsWith("ADMIN_OPS_"))
        .sort(),
      urlHost: url ? new URL(url).host : null,
      hasServiceKey: !!serviceKey,
      hasPublishableKey: !!anonKey,
      serviceKeyIsOpaque: serviceKey.startsWith("sb_"),
    },
    sharedImportOk: true,
    sawOrigin: req.headers.get("origin"),
  };

  if (!url || !serviceKey) {
    result.serviceProbeError = "Missing SUPABASE_URL or service role key in this runtime";
    return result;
  }

  const svc = serviceClient();

  // Proves the key actually WORKS. A non-empty string proves nothing: it could be
  // stale, rotated, or only valid through the Lovable proxy.
  const probe = await svc.from("admin_known_passwords").select("user_id").limit(1);
  result.serviceProbeError = probe.error?.message ?? null;

  if (!token) {
    result.jwt = { present: false, actorId: null, claimsError: "No Authorization header" };
    return result;
  }

  const claims = await callerClient(token).auth.getClaims(token);
  const actorId = (claims.data?.claims?.sub as string | undefined) ?? null;
  result.jwt = { present: true, actorId, claimsError: claims.error?.message ?? null };

  if (actorId) {
    const role = await svc.rpc("has_role", { _user_id: actorId, _role: "admin" });
    result.hasRole = { isAdmin: role.data ?? null, error: role.error?.message ?? null };
  }

  return result;
}

const HANDLERS: Record<string, (req: Request, payload: unknown) => Promise<unknown>> = {
  ping: (req) => ping(req),
};

Deno.serve(async (req: Request): Promise<Response> => {
  const pre = preflight(req);
  if (pre) return pre;

  const started = Date.now();
  let action = "(none)";
  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST");

    const body = (await req.json().catch(() => {
      throw new HttpError(400, "Invalid request body");
    })) as { action?: unknown; payload?: unknown };

    action = typeof body?.action === "string" ? body.action : "(none)";

    // hasOwnProperty, not HANDLERS[action]: a bare lookup lets {"action":"constructor"}
    // reach a function off the prototype chain.
    if (!Object.prototype.hasOwnProperty.call(HANDLERS, action)) {
      throw new HttpError(400, `Unknown action: ${action}`);
    }

    const result = await HANDLERS[action](req, body?.payload);

    // Structured, redacted. NEVER log the request body: createAdmin, createStaff and
    // updateRoleAccount payloads all carry plaintext passwords.
    console.log(JSON.stringify({ fn: "admin-ops", action, ok: true, ms: Date.now() - started }));
    return json(req, 200, result);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    const message = e instanceof HttpError ? e.message : "Something went wrong on the server";
    console.error(
      JSON.stringify({
        fn: "admin-ops",
        action,
        ok: false,
        status,
        message,
        detail: status === 500 ? String(e) : undefined,
        ms: Date.now() - started,
      }),
    );
    return fail(req, status, message);
  }
});
