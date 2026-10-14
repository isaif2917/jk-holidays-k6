import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
export const Route = createFileRoute("/admin/reports")({ component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">Reports</h1>
    <div className="grid gap-4 md:grid-cols-3">
      {["Membership Report", "Bookings Report", "Financial Report", "Referral Report", "Support Report", "Activity Report"].map((r) => (
        <Card key={r} className="p-5"><div className="font-serif text-lg font-bold text-navy">{r}</div><div className="mt-1 text-xs text-muted-foreground">Download comprehensive report</div><button className="mt-3 text-sm font-semibold text-blue-600">Download →</button></Card>
      ))}
    </div>
  </div>
)});
