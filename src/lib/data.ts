import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const db = supabase as any;

export type Me = {
  user: { id: string; email?: string };
  profile: any;
  isAdmin: boolean;
};

export function useMe() {
  return useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const [p, r] = await Promise.all([
        db.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        db.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      return {
        user: { id: user.id, email: user.email },
        profile: p.data ?? { full_name: user.email, member_code: "", nights_total: 0, nights_used: 0 },
        isAdmin: !!r.data?.some((x: any) => x.role === "admin"),
      };
    },
    staleTime: 30_000,
  });
}

/** Run a Supabase query and return rows; key is used for invalidation. */
export function useRows<T = any>(key: string | (string | undefined)[], run: () => PromiseLike<{ data: any; error: any }>, enabled = true) {
  const queryKey = Array.isArray(key) ? key : [key];
  return useQuery<T[]>({
    queryKey,
    enabled,
    queryFn: async () => {
      const { data, error } = await run();
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useRefresh() {
  const qc = useQueryClient();
  return (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

/**
 * Watches the browser session while a portal is open. If it disappears
 * (expiry, cleared storage, failed refresh) the cached screens would keep
 * failing with "Unauthorized", so clear everything and return to sign-in.
 */
export function useSessionGuard(active: boolean, loginPath: "/admin-login" | "/auth/login") {
  const qc = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const check = async () => {
      const { data } = await db.auth.getSession();
      if (!cancelled && !data.session) {
        cancelled = true;
        qc.clear();
        toast.info("Your session expired — please sign in again.");
        navigate({ to: loginPath, replace: true });
      }
    };
    check();
    const timer = setInterval(check, 30_000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [active, loginPath, navigate, qc]);
}

/** Map of user_id -> profile, for admin screens. */
export function useProfilesMap() {
  const q = useRows("profiles", () => db.from("profiles").select("*").order("created_at", { ascending: false }));
  const map: Record<string, any> = {};
  (q.data ?? []).forEach((p: any) => (map[p.id] = p));
  return { map, list: q.data ?? [], isLoading: q.isLoading };
}

export const inr = (n: number | null | undefined) => "₹ " + Number(n ?? 0).toLocaleString("en-IN");
export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "—";

export async function signOut() {
  await supabase.auth.signOut();
}

export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
}
