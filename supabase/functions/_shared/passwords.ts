// Keeps the last password an admin set through the panel so admins can view it in the
// member details. Passwords set by members themselves stay hidden.
//
// KNOWN ISSUE (carried over, not introduced here): this stores plaintext passwords.
// It is ported unchanged so behaviour matches the old server functions. Never log the
// password itself.
import type { Ctx } from "./auth.ts";

export async function rememberPassword(svc: Ctx["svc"], userId: string, password: string): Promise<void> {
  const { error } = await svc
    .from("admin_known_passwords")
    .upsert({ user_id: userId, password, updated_at: new Date().toISOString() });
  if (error) {
    console.error(JSON.stringify({ fn: "admin-ops", step: "rememberPassword", message: error.message }));
  }
}
