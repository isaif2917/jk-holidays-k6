import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { createRouteHead } from "@/lib/route-meta";
export const Route = createFileRoute("/app/rewards")({ head: () => createRouteHead("My Rewards — JK Holidays", "Review the reward points available through your JK Holidays membership."), component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">My Rewards</h1>
    <Card className="p-8 text-center">
      <Gift className="mx-auto h-14 w-14 text-gold" />
      <div className="mt-4 font-serif text-3xl font-bold text-navy">12,500 Points</div>
      <div className="text-sm text-muted-foreground">Available reward points to redeem</div>
    </Card>
  </div>
)});
