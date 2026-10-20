import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db, fmtDate, inr, useRefresh, useRows } from "@/lib/data";
import { StatusBadge } from "@/components/ui/status-badge";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/payments")({ head: () => createRouteHead("Payments — JK Holidays Admin", "Review membership payments and update their verification status."), component: Payments });

function Payments() {
  const refresh = useRefresh();
  const q = useRows("payments", () => db.from("payments").select("*").order("created_at", { ascending: false }));
  const setStatus = async (id: string, status: string) => {
    const { error } = await db.from("payments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Payment ${status.toLowerCase()}`);
    refresh("payments", "profiles");
  };
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Payments</h1>
      <Card className="overflow-x-auto p-5">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2">Date</th><th>Plan</th><th>Amount</th><th>Reference</th><th>Payer</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {(q.data ?? []).map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-3">{fmtDate(p.created_at)}</td><td>{p.plan_slug}</td><td>{inr(p.amount)}</td><td className="font-mono">{p.reference}</td>
                <td>{p.name ?? "Member"}{p.phone ? ` · ${p.phone}` : ""}</td><td><StatusBadge s={p.status} /></td>
                <td>{p.status === "Pending" && (
                  <div className="flex gap-1">
                    <Button size="sm" className="bg-emerald-600 text-white" onClick={() => setStatus(p.id, "Verified")}>Verify</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "Rejected")}>Reject</Button>
                  </div>
                )}</td>
              </tr>
            ))}
            {!q.data?.length && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No payments yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
