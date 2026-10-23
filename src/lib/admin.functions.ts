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
    if (error) {
      // Existing account: promote it and set the new password.
      const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
      if (!prof) throw new Error(error.message);
      id = prof.id;
      await supabaseAdmin.auth.admin.updateUserById(id, { password: data.password, email_confirm: true });
    } else id = created.user!.id;
    const { error: rErr } = await supabaseAdmin.from("user_roles").upsert({ user_id: id, role: "admin" }, { onConflict: "user_id,role" });
    if (rErr) throw new Error(rErr.message);
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
    if (error) {
      // Existing account: reuse it and set the password.
      const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
      if (!prof) throw new Error(error.message);
      id = prof.id;
      await supabaseAdmin.auth.admin.updateUserById(id, { password: data.password, email_confirm: true });
    } else id = created.user!.id;
    const { error: rErr } = await supabaseAdmin.from("user_roles").upsert(
      { user_id: id, role: data.role, role_label: data.role === "other" ? data.roleLabel!.trim() : null },
      { onConflict: "user_id,role" },
    );
    if (rErr) throw new Error(rErr.message);
    return { id };
  });

