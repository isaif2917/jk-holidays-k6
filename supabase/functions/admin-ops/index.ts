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
// STAGE 1: Admins & Roles actions — createAdmin, createStaff, removeRole, updateRoleAccount.
// STAGE 2: referral actions — settleReferral, rejectReferral, createCustomReward.
// STAGE 3: member actions — createMember, saveMemberDetails, setMemberPassword, deleteMember.
// After this stage src/lib/admin.functions.ts holds only thin wrappers; no admin action there
// uses the service role key any more (only src/routes/api/public/tour-doc.ts still does).
import { preflight } from "../_shared/cors.ts";
import { HttpError, fail, json } from "../_shared/http.ts";
import { requireAdmin, type Ctx } from "../_shared/auth.ts";
import {
  ValidationError,
  validateCreateAdmin,
  validateCreateCustomReward,
  validateCreateMember,
  validateCreateStaff,
  validateDeleteMember,
  validateSaveMemberDetails,
  validateSetMemberPassword,
  validateRejectReferral,
  validateSettleReferral,
  validateRemoveRole,
  validateUpdateRoleAccount,
} from "../_shared/validate.ts";
import { createAdmin, createStaff, removeRole, updateRoleAccount } from "./roles.ts";
import { createCustomReward, rejectReferral, settleReferral } from "./referrals.ts";
import { createMember, deleteMember, saveMemberDetails, setMemberPassword } from "./members.ts";

type Handler = (req: Request, payload: unknown) => Promise<unknown>;

/**
 * Wraps a privileged action: admin check FIRST (so an unauthenticated or non-admin
 * caller learns nothing about the payload rules), then validation, then the work.
 */
function adminAction<T>(validate: (payload: unknown) => T, run: (input: T, ctx: Ctx) => Promise<unknown>): Handler {
  return async (req, payload) => {
    const ctx = await requireAdmin(req);
    return await run(validate(payload), ctx);
  };
}

const HANDLERS: Record<string, Handler> = {
  createAdmin: adminAction(validateCreateAdmin, createAdmin),
  createStaff: adminAction(validateCreateStaff, createStaff),
  removeRole: adminAction(validateRemoveRole, removeRole),
  updateRoleAccount: adminAction(validateUpdateRoleAccount, updateRoleAccount),
  settleReferral: adminAction(validateSettleReferral, settleReferral),
  rejectReferral: adminAction(validateRejectReferral, rejectReferral),
  createCustomReward: adminAction(validateCreateCustomReward, createCustomReward),
  createMember: adminAction(validateCreateMember, createMember),
  saveMemberDetails: adminAction(validateSaveMemberDetails, saveMemberDetails),
  setMemberPassword: adminAction(validateSetMemberPassword, setMemberPassword),
  deleteMember: adminAction(validateDeleteMember, deleteMember),
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
    // ValidationError messages are written for the admin who typed the input, so they pass through.
    const known = e instanceof HttpError || e instanceof ValidationError;
    const status = e instanceof HttpError ? e.status : e instanceof ValidationError ? 400 : 500;
    const message = known ? (e as Error).message : "Something went wrong on the server";
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
