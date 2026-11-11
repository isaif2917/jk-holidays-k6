import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";

/*
 * Admins & Roles actions (createAdmin, createStaff, removeRole, updateRoleAccount) run in the
 * `admin-ops` Supabase Edge Function (supabase/functions/admin-ops), NOT as TanStack server
 * functions. Reason: they need the service role key, which Lovable Cloud only injects into its
 * own runtimes, so server functions on Vercel/localhost fail with "Missing Supabase environment
 * variable(s): SUPABASE_SERVICE_ROLE_KEY". Inside the edge function the key is always present.
 *
 * These exports keep the old names and the `fn({ data })` call shape, so routes need no changes
 * beyond dropping useServerFn. The remaining handlers below are still server functions.
 * Do not convert the four back into createServerFn.
 */

const ADMIN_OPS = "admin-ops";

// functions.invoke wraps a non-2xx in a FunctionsHttpError whose `message` is generic; the
// server's message sits in the unread Response on `error.context`.
async function adminOpsErrorMessage(error: unknown): Promise<string> {
  const res = (error as { context?: unknown })?.context;
  if (typeof Response !== "undefined" && res instanceof Response) {
    const body = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed?.error === "string") return parsed.error;
    } catch {
      /* not JSON */
    }
    if (res.status === 404) return "This admin action isn't available yet — it hasn't been deployed.";
    if (res.status === 401) return "Your session expired — please sign in again.";
    return body.slice(0, 300) || `Request failed (${res.status})`;
  }
  return (error as Error)?.message || "Could not reach the server";
}

async function callAdminOps<T>(action: string, payload: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your session expired — please sign in again.");
  const { data, error } = await supabase.functions.invoke(ADMIN_OPS, {
    body: { action, payload },
    // Set explicitly: the generated client's fetch drops an Authorization equal to the
    // publishable key, which is what supabase-js falls back to without a session.
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw new Error(await adminOpsErrorMessage(error));
  return data as T;
}

type CreateAdminData = { full_name: string; email: string; password: string };
type CreateStaffData = CreateAdminData & {
  role: "manager" | "supervisor" | "operations_manager" | "other";
  roleLabel?: string;
};
type RemoveRoleData = { userId: string; role: string };
type UpdateRoleAccountData = {
  userId: string;
  oldRole: string;
  role: "admin" | "manager" | "supervisor" | "operations_manager" | "other";
  roleLabel?: string;
  full_name: string;
  email: string;
  password?: string;
};

export const createAdmin = ({ data }: { data: CreateAdminData }) =>
  callAdminOps<{ id: string }>("createAdmin", data);
export const createStaff = ({ data }: { data: CreateStaffData }) =>
  callAdminOps<{ id: string }>("createStaff", data);
export const removeRole = ({ data }: { data: RemoveRoleData }) => callAdminOps<{ ok: true }>("removeRole", data);
export const updateRoleAccount = ({ data }: { data: UpdateRoleAccountData }) =>
  callAdminOps<{ ok: true }>("updateRoleAccount", data);

// Referral actions also run in the admin-ops edge function.
export const settleReferral = ({ data }: { data: { referralId: string; amount: number } }) =>
  callAdminOps<{ ok: true }>("settleReferral", data);
export const rejectReferral = ({ data }: { data: { referralId: string } }) =>
  callAdminOps<{ ok: true }>("rejectReferral", data);
export const createCustomReward = ({ data }: { data: { userId: string; amount: number; note?: string } }) =>
  callAdminOps<{ ok: true; name: string }>("createCustomReward", data);

type NewMember = { full_name: string; email: string; phone?: string; city?: string; password: string; plan?: string };

type MemberDetails = {
  userId: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  plan: string | null;
  status: string;
  membership_start: string | null;
  membership_end: string | null;
  nights_total: number;
  nights_used: number;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !isAdmin) throw new Error("Admins only");
}

// Keeps the last password an admin set through the panel so admins can view it
// in the member details. Passwords set by members themselves stay hidden.
async function rememberPassword(supabaseAdmin: any, userId: string, password: string) {
  const { error } = await supabaseAdmin
    .from("admin_known_passwords")
    .upsert({ user_id: userId, password, updated_at: new Date().toISOString() });
  if (error) console.error("Could not record the password for the admin view:", error.message);
}

export const saveMemberDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: MemberDetails) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.userId ?? "")) throw new Error("Valid member required");
    if (!d.full_name?.trim() || d.full_name.length > 100) throw new Error("Name is required (100 characters max)");
    if (!/^\S+@\S+\.\S+$/.test(d.email ?? "") || d.email.length > 255) throw new Error("Valid email required");
    if (d.phone && d.phone.length > 40) throw new Error("Mobile number is too long");
    if (d.city && d.city.length > 100) throw new Error("City is too long");
    if (!["Active", "Inactive", "Pending", "Suspended"].includes(d.status)) throw new Error("Invalid member status");
    if (!Number.isInteger(d.nights_total) || d.nights_total < 0 || !Number.isInteger(d.nights_used) || d.nights_used < 0) {
      throw new Error("Nights must be zero or greater");
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const { data: current, error: readError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (readError || !current.user) throw new Error("Could not find this member account");
    if (current.user.email?.toLowerCase() !== email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email, email_confirm: true });
      if (error) throw new Error(error.message);
    }
    const { error } = await supabaseAdmin.from("profiles").update({
      full_name: data.full_name.trim(), email, phone: data.phone?.trim() || null, city: data.city?.trim() || null,
      plan: data.plan, status: data.status, membership_start: data.membership_start,
      membership_end: data.membership_end, nights_total: data.nights_total, nights_used: data.nights_used,
    }).eq("id", data.userId);
    if (error) {
      if (current.user.email && current.user.email.toLowerCase() !== email) {
        await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: current.user.email, email_confirm: true });
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.userId ?? "")) throw new Error("Valid member required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: data.userId, _role: "admin" });
    if (roleError) throw new Error("Could not verify the account role");
    if (isAdmin) throw new Error("Remove admin access before deleting this account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: referralError } = await supabaseAdmin.from("referrals").update({ referred_user_id: null }).eq("referred_user_id", data.userId);
    if (referralError) throw new Error(referralError.message);
    const deletions = await Promise.all([
      supabaseAdmin.from("bookings").delete().eq("user_id", data.userId),
      supabaseAdmin.from("documents").delete().eq("user_id", data.userId),
      supabaseAdmin.from("admin_known_passwords").delete().eq("user_id", data.userId),
      supabaseAdmin.from("holiday_requests").delete().eq("user_id", data.userId),
      supabaseAdmin.from("notifications").delete().eq("user_id", data.userId),
      supabaseAdmin.from("payments").delete().eq("user_id", data.userId),
      supabaseAdmin.from("referrals").delete().eq("user_id", data.userId),
      supabaseAdmin.from("support_tickets").delete().eq("user_id", data.userId),
      supabaseAdmin.from("wallet_transactions").delete().eq("user_id", data.userId),
      supabaseAdmin.from("withdrawals").delete().eq("user_id", data.userId),
      supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId),
    ]);
    const failed = deletions.find((result) => result.error);
    if (failed?.error) throw new Error(failed.error.message);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: NewMember) => {
    if (!d?.email || !/^\S+@\S+\.\S+$/.test(d.email)) throw new Error("Valid email required");
    if (!d.full_name || d.full_name.length > 100) throw new Error("Name required");
    if (!d.password || d.password.length < 6) throw new Error("Password must be at least 6 characters");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const id = created.user!.id;
    await supabaseAdmin.from("profiles").upsert({
      id, full_name: data.full_name, email: data.email, phone: data.phone || null, city: data.city || null,
      plan: data.plan || null, status: data.plan ? "Active" : "Pending",
    });
    await rememberPassword(supabaseAdmin, id, data.password);
    return { id };
  });

export const setMemberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; password: string }) => {
    if (!d?.userId) throw new Error("Member required");
    if (!d.password || d.password.length < 6) throw new Error("Password must be at least 6 characters");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    await rememberPassword(supabaseAdmin, data.userId, data.password);
    return { ok: true };
  });
