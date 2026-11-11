// Member actions, ported from src/lib/admin.functions.ts (createMember, saveMemberDetails,
// setMemberPassword, deleteMember). Behaviour and user-facing messages are intentionally
// identical to the old server functions.
//
// By the time these run, requireAdmin() has verified the caller is an admin and the input
// has been validated by _shared/validate.ts.
import { HttpError } from "../_shared/http.ts";
import type { Ctx } from "../_shared/auth.ts";
import { rememberPassword } from "../_shared/passwords.ts";
import type {
  CreateMemberInput,
  DeleteMemberInput,
  SaveMemberDetailsInput,
  SetMemberPasswordInput,
} from "../_shared/validate.ts";

export async function createMember(input: CreateMemberInput, { svc }: Ctx) {
  // The old code passed the email through untouched here (unlike saveMemberDetails); kept.
  const { data: created, error } = await svc.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  });
  if (error || !created?.user) throw new HttpError(400, error?.message ?? "Could not create the account");
  const id = created.user.id;

  const { error: profileError } = await svc.from("profiles").upsert({
    id,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone || null,
    city: input.city || null,
    plan: input.plan || null,
    status: input.plan ? "Active" : "Pending",
  });
  // The old code ignored this error silently. Still not fatal (the login exists), but log it.
  if (profileError) {
    console.error(JSON.stringify({ fn: "admin-ops", step: "createMember.profile", message: profileError.message }));
  }
  await rememberPassword(svc, id, input.password);
  return { id };
}

export async function setMemberPassword(input: SetMemberPasswordInput, { svc }: Ctx) {
  const { error } = await svc.auth.admin.updateUserById(input.userId, { password: input.password });
  if (error) throw new HttpError(400, error.message);
  await rememberPassword(svc, input.userId, input.password);
  return { ok: true };
}

export async function saveMemberDetails(input: SaveMemberDetailsInput, { svc }: Ctx) {
  const email = input.email.trim().toLowerCase();

  const { data: current, error: readError } = await svc.auth.admin.getUserById(input.userId);
  if (readError || !current?.user) throw new HttpError(404, "Could not find this member account");
  const previousEmail = current.user.email ?? null;
  const emailChanged = previousEmail?.toLowerCase() !== email;

  if (emailChanged) {
    const { error } = await svc.auth.admin.updateUserById(input.userId, { email, email_confirm: true });
    if (error) throw new HttpError(400, error.message);
  }

  const { error } = await svc
    .from("profiles")
    .update({
      full_name: input.full_name.trim(),
      email,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      plan: input.plan,
      status: input.status,
      membership_start: input.membership_start,
      membership_end: input.membership_end,
      nights_total: input.nights_total,
      nights_used: input.nights_used,
    })
    .eq("id", input.userId);
  if (error) {
    // Roll the login email back so the auth user and the profile do not disagree.
    if (previousEmail && emailChanged) {
      await svc.auth.admin.updateUserById(input.userId, { email: previousEmail, email_confirm: true });
    }
    throw new HttpError(500, error.message);
  }
  return { ok: true };
}

export async function deleteMember(input: DeleteMemberInput, { svc }: Ctx) {
  // Refuse to delete an account that still holds the admin role (this also covers deleting yourself).
  const { data: targetIsAdmin, error: roleError } = await svc.rpc("has_role", {
    _user_id: input.userId,
    _role: "admin",
  });
  if (roleError) throw new HttpError(500, "Could not verify the account role");
  if (targetIsAdmin) throw new HttpError(400, "Remove admin access before deleting this account");

  const { error: referralError } = await svc
    .from("referrals")
    .update({ referred_user_id: null })
    .eq("referred_user_id", input.userId);
  if (referralError) throw new HttpError(500, referralError.message);

  const tables = [
    "bookings",
    "documents",
    "admin_known_passwords",
    "holiday_requests",
    "notifications",
    "payments",
    "referrals",
    "support_tickets",
    "wallet_transactions",
    "withdrawals",
    "user_roles",
  ];
  const results = await Promise.all(tables.map((t) => svc.from(t).delete().eq("user_id", input.userId)));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new HttpError(500, failed.error.message);

  const { error } = await svc.auth.admin.deleteUser(input.userId);
  if (error) throw new HttpError(500, error.message);
  return { ok: true };
}
