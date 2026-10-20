import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { db, fmtDate, useRows } from "@/lib/data";
import { StatusBadge } from "@/components/ui/status-badge";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/leads")({ head: () => createRouteHead("Enquiries — JK Holidays Admin", "Review holiday enquiries submitted to JK Holidays."), component: Leads });

function Leads() {
  const q = useRows("leads", () => db.from("leads").select("*").order("created_at", { ascending: false }));
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Leads & Enquiries</h1>
      <Card className="overflow-x-auto p-5">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2">Name</th><th>Phone</th><th>Interest</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {(q.data ?? []).map((l) => (
              <tr key={l.id} className="border-b"><td className="py-3 font-medium text-navy">{l.name}</td><td>{l.phone}</td><td>{l.interest ?? "—"}</td><td>{fmtDate(l.created_at)}</td><td><StatusBadge s={l.status} /></td></tr>
            ))}
            {!q.data?.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No enquiries yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
