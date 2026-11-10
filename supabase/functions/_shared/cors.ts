// CORS for the admin-ops edge function.
//
// IMPORTANT: this is hygiene, not a security control. Any HTTP client (curl, Postman,
// a script) can call the function with any Origin it likes, because Origin is only
// enforced by browsers. Authorisation rests ENTIRELY on the verified JWT plus the
// has_role check in _shared/auth.ts. Never "secure" an action by trusting the origin.

const ALLOWED: RegExp[] = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.dev$/,
  /^https:\/\/([a-z0-9-]+\.)*jkholidays\.org$/,
];

// Deliberately NOT prefixed with SUPABASE_, so it can be set from the Lovable Secrets
// UI (reserved SUPABASE_* names cannot). Comma-separated exact origins.
function extraOrigins(): string[] {
  return (Deno.env.get("ADMIN_OPS_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED.some((r) => r.test(origin)) || extraOrigins().includes(origin);
  return {
    // Echo the specific origin, never "*" — credentials/Authorization are in play.
    ...(allowed && origin ? { "access-control-allow-origin": origin } : {}),
    "access-control-allow-headers": "authorization, apikey, x-client-info, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

/** Answer the preflight before any auth work. Returns null for non-OPTIONS requests. */
export function preflight(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response(null, { status: 204, headers: cors(req) }) : null;
}
