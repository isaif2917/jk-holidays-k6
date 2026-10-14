import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
export const Route = createFileRoute("/admin/notifications")({ component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">Notifications</h1>
    <Card className="p-5">{["New holiday request received", "Withdrawal request pending", "New member signup"].map((n, i) => (
      <div key={i} className="flex justify-between border-b py-3 last:border-0"><span className="text-navy">{n}</span><span className="text-xs text-muted-foreground">1h ago</span></div>
    ))}</Card>
  </div>
)});
