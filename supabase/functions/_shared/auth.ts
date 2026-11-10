// The one admin check for every privileged action.
//
// Runs BEFORE payload validation and BEFORE dispatch, so a new action cannot forget it.
// Identity comes only from the verified JWT (auth.getClaims), never from the request body.
// The gateway's verify_jwt is NOT relied on: if it is off, or Lovable flips it, this still
// rejects unauthenticated callers.
import { HttpError } from "./http.ts";
import { callerClient, serviceClient } from "./clients.ts";

export type Ctx = { actorId: string; svc: ReturnType<typeof serviceClient> };

const SESSION_EXPIRED = "Your session expired — please sign in again.";

export async function requireAdmin(req: Request): Promise<Ctx> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token || token.split(".").length !== 3) throw new HttpError(401, SESSION_EXPIRED);

  const { data, error } = await callerClient(token).auth.getClaims(token);
  const actorId = data?.claims?.sub;
  if (error || typeof actorId !== "string" || !actorId) throw new HttpError(401, SESSION_EXPIRED);

  // Only now is the service-role client created.
  const svc = serviceClient();
  const { data: isAdmin, error: roleError } = await svc.rpc("has_role", { _user_id: actorId, _role: "admin" });

  // Fail closed, with a message that tells "could not check" apart from "not an admin".
  if (roleError) {
    console.error(JSON.stringify({ fn: "admin-ops", step: "has_role", message: roleError.message }));
    throw new HttpError(403, "Could not verify your admin access");
  }
  if (!isAdmin) throw new HttpError(403, "Admins only");

  return { actorId, svc };
}
