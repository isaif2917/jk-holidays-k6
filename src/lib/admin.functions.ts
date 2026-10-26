import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { full_name: string; email: string; password: string }) => {
    if (!d?.email || !/^\S+@\S+\.\S+$/.test(d.email)) throw new Error("Valid email required");
    if (!d.full_name || d.full_name.length > 100) throw new Error("Name required");
    if (!d.password || d.password.length < 6) throw new Error("Password must be at least 6 characters");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    let id: string | undefined;
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: data.password, email_confirm: true, user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error("An account with this email already exists. Open the member's details to change its password instead.");
    id = created.user!.id;
    const { error: rErr } = await supabaseAdmin.from("user_roles").upsert({ user_id: id, role: "admin" }, { onConflict: "user_id,role" });
    if (rErr) throw new Error(rErr.message);
    await rememberPassword(supabaseAdmin, id, data.password);
    return { id };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => { if (!d?.userId) throw new Error("Admin required"); return d; })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");
    if (data.userId === context.userId) throw new Error("You can't remove your own admin access");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

type StaffInput = {
  full_name: string;
  email: string;
  password: string;
  role: "manager" | "supervisor" | "operations_manager" | "other";
  roleLabel?: string;
};

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: StaffInput) => {
    if (!d?.email || !/^\S+@\S+\.\S+$/.test(d.email)) throw new Error("Valid email required");
    if (!d.full_name || d.full_name.length > 100) throw new Error("Name required");
    if (!d.password || d.password.length < 6) throw new Error("Password must be at least 6 characters");
    if (!["manager", "supervisor", "operations_manager", "other"].includes(d.role)) throw new Error("Choose a role");
    if (d.role === "other" && (!d.roleLabel || d.roleLabel.trim().length > 60)) throw new Error("Type the staff role (60 characters max)");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    let id: string | undefined;
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: data.password, email_confirm: true, user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error("An account with this email already exists. Open the member's details to change its password instead.");
    id = created.user!.id;
    const { error: rErr } = await supabaseAdmin.from("user_roles").upsert(
      { user_id: id, role: data.role, role_label: data.role === "other" ? data.roleLabel!.trim() : null },
      { onConflict: "user_id,role" },
    );
    if (rErr) throw new Error(rErr.message);
    await rememberPassword(supabaseAdmin, id, data.password);
    return { id };
  });

export const removeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.userId ?? "")) throw new Error("Valid account required");
    if (!["admin", "manager", "supervisor", "operations_manager", "other"].includes(d.role)) throw new Error("Invalid role");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");
    if (data.userId === context.userId && data.role === "admin") throw new Error("You can't remove your own admin access");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const settleReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { referralId: string; amount: number }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.referralId ?? "")) throw new Error("Valid referral required");
    if (!Number.isFinite(d.amount) || d.amount <= 0) throw new Error("Enter the reward amount to settle");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ref, error } = await supabaseAdmin.from("referrals").select("*").eq("id", data.referralId).maybeSingle();
    if (error || !ref) throw new Error("Could not find this referral");
    if (ref.status === "Rewarded") throw new Error("This referral is already settled");
    if (ref.status === "Rejected") throw new Error("This referral was rejected");
    const { error: wErr } = await supabaseAdmin.from("wallet_transactions").insert({
      user_id: ref.user_id,
      type: "credit",
      amount: data.amount,
      description: "Referral settlement: " + (ref.friend_name || "referred member"),
    });
    if (wErr) throw new Error(wErr.message);
    const { error: uErr } = await supabaseAdmin.from("referrals").update({ status: "Rewarded", reward_amount: data.amount }).eq("id", data.referralId);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

export const rejectReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { referralId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.referralId ?? "")) throw new Error("Valid referral required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ref, error } = await supabaseAdmin.from("referrals").select("status").eq("id", data.referralId).maybeSingle();
    if (error || !ref) throw new Error("Could not find this referral");
    if (ref.status === "Rewarded") throw new Error("This referral is already settled and can't be rejected");
    const { error: uErr } = await supabaseAdmin.from("referrals").update({ status: "Rejected" }).eq("id", data.referralId);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

// Manually credit a referral reward to a member chosen by the admin,
// and record it in the custom-reward history shown on the referral settings page.
export const createCustomReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; amount: number; note?: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.userId ?? "")) throw new Error("Choose a member first");
    if (!Number.isFinite(d.amount) || d.amount <= 0) throw new Error("Enter a reward amount greater than zero");
    if ((d.note ?? "").length > 200) throw new Error("Note is limited to 200 characters");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: pErr } = await supabaseAdmin.from("profiles").select("full_name, member_code").eq("id", data.userId).maybeSingle();
    if (pErr || !profile) throw new Error("Could not find this member");
    const { error: wErr } = await supabaseAdmin.from("wallet_transactions").insert({
      user_id: data.userId,
      type: "credit",
      amount: data.amount,
      description: `Custom referral reward${data.note ? ": " + data.note.trim() : ""}`,
    });
    if (wErr) throw new Error(wErr.message);
    const { error: hErr } = await supabaseAdmin.from("custom_referral_rewards").insert({
      user_id: data.userId,
      amount: data.amount,
      note: data.note?.trim() ?? "",
      created_by: context.userId,
    });
    if (hErr) throw new Error(hErr.message);
    return { ok: true, name: profile.full_name };
  });

type RoleAccountInput = {
  userId: string;
  oldRole: string;
  role: "admin" | "manager" | "supervisor" | "operations_manager" | "other";
  roleLabel?: string;
  full_name: string;
  email: string;
  password?: string;
};

// Edit an admin/staff account: name, email, role and password.
export const updateRoleAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: RoleAccountInput) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.userId ?? "")) throw new Error("Valid account required");
    if (!["admin", "manager", "supervisor", "operations_manager", "other"].includes(d.oldRole)) throw new Error("Invalid current role");
    if (!["admin", "manager", "supervisor", "operations_manager", "other"].includes(d.role)) throw new Error("Choose a valid role");
    if (d.role === "other" && (!d.roleLabel || d.roleLabel.trim().length > 60)) throw new Error("Type the role (60 characters max)");
    if (!d.full_name?.trim() || d.full_name.length > 100) throw new Error("Name is required (100 characters max)");
    if (!/^\S+@\S+\.\S+$/.test(d.email ?? "") || d.email.length > 255) throw new Error("Valid email required");
    if (d.password && d.password.length < 6) throw new Error("Password must be at least 6 characters");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.oldRole === "admin" && data.role !== "admin") {
      throw new Error("You can't change your own admin role");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const { data: current, error: readError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (readError || !current.user) throw new Error("Could not find this account");
    if (current.user.email?.toLowerCase() !== email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email, email_confirm: true });
      if (error) throw new Error(error.message);
    }
    if (data.password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
      if (error) throw new Error(error.message);
      await rememberPassword(supabaseAdmin, data.userId, data.password);
    }
    const { error: pErr } = await supabaseAdmin.from("profiles").update({
      full_name: data.full_name.trim(), email,
    }).eq("id", data.userId);
    if (pErr) {
      if (current.user.email && current.user.email.toLowerCase() !== email) {
        await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: current.user.email, email_confirm: true });
      }
      throw new Error(pErr.message);
    }
    const { error: rErr } = await supabaseAdmin.from("user_roles").update({
      role: data.role,
      role_label: data.role === "other" ? data.roleLabel!.trim() : null,
    }).eq("user_id", data.userId).eq("role", data.oldRole as any);
    if (rErr) throw new Error(rErr.message);
    return { ok: true };
  });

