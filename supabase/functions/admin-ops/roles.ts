// Admins & Roles actions, ported from src/lib/admin.functions.ts (createAdmin, createStaff,
// removeRole, updateRoleAccount). Behaviour and user-facing messages are intentionally
// identical to the old server functions.
//
// By the time these run, requireAdmin() has already verified the caller is an admin and
// the input has been validated by _shared/validate.ts.
import { HttpError } from "../_shared/http.ts";
import type { Ctx } from "../_shared/auth.ts";
import { rememberPassword } from "../_shared/passwords.ts";
import type {
  CreateAdminInput,
  CreateStaffInput,
  RemoveRoleInput,
  UpdateRoleAccountInput,
} from "../_shared/validate.ts";

const DUPLICATE_ACCOUNT =
  "An account with this email already exists. Open the member's details to change its password instead.";

async function createLoginUser(svc: Ctx["svc"], input: CreateAdminInput): Promise<string> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  });
  if (error || !data?.user) {
    // The old code reported every createUser failure as "already exists". Kept for the
    // user-facing message, but the real reason goes to the log (never the password).
    console.error(JSON.stringify({ fn: "admin-ops", step: "createUser", message: error?.message }));
    throw new HttpError(409, DUPLICATE_ACCOUNT);
  }
  return data.user.id;
}

export async function createAdmin(input: CreateAdminInput, { svc }: Ctx) {
  const id = await createLoginUser(svc, input);
  const { error } = await svc.from("user_roles").upsert({ user_id: id, role: "admin" }, { onConflict: "user_id,role" });
  if (error) throw new HttpError(500, error.message);
  await rememberPassword(svc, id, input.password);
  return { id };
}

export async function createStaff(input: CreateStaffInput, { svc }: Ctx) {
  const id = await createLoginUser(svc, input);
  const { error } = await svc.from("user_roles").upsert(
    { user_id: id, role: input.role, role_label: input.role === "other" ? input.roleLabel!.trim() : null },
    { onConflict: "user_id,role" },
  );
  if (error) throw new HttpError(500, error.message);
  await rememberPassword(svc, id, input.password);
  return { id };
}

export async function removeRole(input: RemoveRoleInput, { svc, actorId }: Ctx) {
  if (input.userId === actorId && input.role === "admin") {
    throw new HttpError(400, "You can't remove your own admin access");
  }
  const { error } = await svc.from("user_roles").delete().eq("user_id", input.userId).eq("role", input.role);
  if (error) throw new HttpError(500, error.message);
  return { ok: true };
}

export async function updateRoleAccount(input: UpdateRoleAccountInput, { svc, actorId }: Ctx) {
  if (input.userId === actorId && input.oldRole === "admin" && input.role !== "admin") {
    throw new HttpError(400, "You can't change your own admin role");
  }
  const email = input.email.trim().toLowerCase();

  const { data: current, error: readError } = await svc.auth.admin.getUserById(input.userId);
  if (readError || !current?.user) throw new HttpError(404, "Could not find this account");
  const previousEmail = current.user.email ?? null;
  const emailChanged = previousEmail?.toLowerCase() !== email;

  if (emailChanged) {
    const { error } = await svc.auth.admin.updateUserById(input.userId, { email, email_confirm: true });
    if (error) throw new HttpError(400, error.message);
  }
  if (input.password) {
    const { error } = await svc.auth.admin.updateUserById(input.userId, { password: input.password });
    if (error) throw new HttpError(400, error.message);
    await rememberPassword(svc, input.userId, input.password);
  }

  const { error: profileError } = await svc
    .from("profiles")
    .update({ full_name: input.full_name.trim(), email })
    .eq("id", input.userId);
  if (profileError) {
    // Roll the login email back so the auth user and the profile do not disagree.
    if (previousEmail && emailChanged) {
      await svc.auth.admin.updateUserById(input.userId, { email: previousEmail, email_confirm: true });
    }
    throw new HttpError(500, profileError.message);
  }

  const { error: roleError } = await svc
    .from("user_roles")
    .update({ role: input.role, role_label: input.role === "other" ? input.roleLabel!.trim() : null })
    .eq("user_id", input.userId)
    .eq("role", input.oldRole);
  if (roleError) throw new HttpError(500, roleError.message);

  return { ok: true };
}
