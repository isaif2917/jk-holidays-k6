import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export const Route = createFileRoute("/admin/tickets")({ component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">Support Tickets</h1>
    <Card className="p-5"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2">Ticket ID</th><th>Member</th><th>Subject</th><th>Priority</th><th>Status</th></tr></thead><tbody>{[
      { id: "TCK1024", m: "Rahul Sharma", s: "Booking modification", p: "High", st: "Open" },
      { id: "TCK1023", m: "Neha Verma", s: "Payment issue", p: "Medium", st: "In Progress" },
      { id: "TCK1022", m: "Amit Kumar", s: "Cancellation", p: "Low", st: "Resolved" },
    ].map((t) => (
      <tr key={t.id} className="border-b"><td className="py-3 font-mono">{t.id}</td><td>{t.m}</td><td>{t.s}</td><td><Badge className={t.p === "High" ? "bg-rose-100 text-rose-700" : t.p === "Medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}>{t.p}</Badge></td><td>{t.st}</td></tr>
    ))}</tbody></table></Card>
  </div>
)});
