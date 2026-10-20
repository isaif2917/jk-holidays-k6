import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { createRouteHead } from "@/lib/route-meta";
export const Route = createFileRoute("/app/notifications")({ head: () => createRouteHead("My Notifications — JK Holidays", "View updates about your JK Holidays account and travel requests."), component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">Notifications</h1>
    <Card className="p-5">
      {[
        "Your holiday request for Goa has been received.",
        "Referral bonus of ₹2,500 credited to your wallet.",
        "New offer: 40% OFF on International bookings.",
      ].map((n, i) => (
        <div key={i} className="flex items-start gap-3 border-b py-3 last:border-0">
          <Bell className="mt-1 h-4 w-4 text-gold" />
          <div><div className="text-sm text-navy">{n}</div><div className="text-xs text-muted-foreground">Just now</div></div>
        </div>
      ))}
    </Card>
  </div>
)});
