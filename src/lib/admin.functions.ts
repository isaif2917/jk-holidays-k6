import { supabase } from "@/integrations/supabase/client";

/*
 * Every privileged admin action (Admins & Roles, referrals, members) runs in the `admin-ops`
 * Supabase Edge Function (supabase/functions/admin-ops), NOT as a TanStack server function.
 * Reason: these need the service role key, which Lovable Cloud only injects into its own
 * runtimes, so server functions on Vercel/localhost fail with "Missing Supabase environment
 * variable(s): SUPABASE_SERVICE_ROLE_KEY". Inside the edge function the key is always present.
 *
 * The exports below keep the old names and the `fn({ data })` call shape, so routes only call
 * them directly (no useServerFn). Validation and the admin check live in the edge function.
 * Do not convert these back into createServerFn.
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

// Member actions.
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

export const createMember = ({ data }: { data: NewMember }) => callAdminOps<{ id: string }>("createMember", data);
export const saveMemberDetails = ({ data }: { data: MemberDetails }) =>
  callAdminOps<{ ok: true }>("saveMemberDetails", data);
export const setMemberPassword = ({ data }: { data: { userId: string; password: string } }) =>
  callAdminOps<{ ok: true }>("setMemberPassword", data);
export const deleteMember = ({ data }: { data: { userId: string } }) =>
  callAdminOps<{ ok: true }>("deleteMember", data);
