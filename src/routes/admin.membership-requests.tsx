import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { db, fmtDate, inr, useProfilesMap, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/membership-requests")({
  head: () => createRouteHead("Membership Requests — JK Holidays Admin", "Review member payment details and approve or reject holiday membership requests."),
  component: Requests,
});

function Requests() {
  const refresh = useRefresh();
  const [tab, setTab] = useState("Pending");
  const q = useRows("payments", () => db.from("payments").select("*").order("created_at", { ascending: false }));
  const plans = useRows("membership_plans", () => db.from("membership_plans").select("*").order("sort"));
  const { map } = useProfilesMap();
  const rows = (q.data ?? []).filter((r: any) => tab === "All" || r.status === tab);

  const decide = async (r: any, status: "Approved" | "Rejected") => {
    const { error } = await db.from("payments").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    if (status === "Approved" && r.user_id) {
      const plan = (plans.data ?? []).find((p: any) => p.slug === r.plan_slug);
      const start = new Date();
      const end = new Date(start); end.setFullYear(end.getFullYear() + (plan?.validity_years ?? 1));
      const { error: e2 } = await db.from("profiles").update({
        plan: plan?.name ?? r.plan_slug, status: "Active", nights_total: plan?.nights ?? 0, nights_used: 0,
        membership_start: start.toISOString().slice(0, 10), membership_end: end.toISOString().slice(0, 10),
      }).eq("id", r.user_id);
      if (e2) return toast.error(e2.message);
      await db.from("notifications").insert({ user_id: r.user_id, title: "Membership approved", body: `Your ${plan?.name ?? r.plan_slug} membership is now active.` });
    } else if (r.user_id) {
      await db.from("notifications").insert({ user_id: r.user_id, title: "Membership request rejected", body: `Your request for ${r.plan_slug} was not approved. Please contact support.` });
    }
    toast.success(`Request ${status.toLowerCase()}`);
    refresh("payments", "profiles");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Membership Requests</h1>
      <div className="flex flex-wrap gap-2">
        {["Pending", "Approved", "Rejected", "All"].map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} className={tab === t ? "bg-navy text-white" : ""} onClick={() => setTab(t)}>
            {t} ({(q.data ?? []).filter((r: any) => t === "All" || r.status === t).length})
          </Button>
        ))}
      </div>
      <Card className="overflow-x-auto p-5">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b"><th className="py-2">Date</th><th>Member</th><th>Member ID</th><th>Contact</th><th>Requested plan</th><th>Amount</th><th>Payment</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {rows.map((r: any) => {
              const p = map[r.user_id] ?? {};
              return (
                <tr key={r.id} className="border-b align-top">
                  <td className="py-3">{fmtDate(r.created_at)}</td>
                  <td><div className="font-medium text-navy">{p.full_name || r.name || "—"}</div><div className="text-xs text-muted-foreground">{p.city ?? ""}</div></td>
                  <td><div className="font-mono text-xs">{p.member_code ?? "—"}</div><div className="font-mono text-[10px] text-muted-foreground">{r.user_id?.slice(0, 8)}</div></td>
                  <td className="text-xs"><div>{p.email || r.email || "—"}</div><div>{p.phone || r.phone || ""}</div></td>
                  <td className="font-semibold capitalize">{r.plan_slug}</td>
                  <td>{inr(r.amount)}</td>
                  <td className="text-xs"><div>{r.method}</div><div className="font-mono">Ref: {r.reference || "—"}</div></td>
                  <td><StatusBadge s={r.status} /></td>
                  <td>
                    {r.status === "Pending" ? (
                      <div className="flex gap-1">
                        <Button size="sm" className="bg-emerald-600 text-white" onClick={() => decide(r, "Approved")}>Approve</Button>
                        <Button size="sm" variant="outline" className="text-rose-600" onClick={() => decide(r, "Rejected")}>Reject</Button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No requests</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
