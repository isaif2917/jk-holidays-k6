import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Users, Crown, Plane, Wallet, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDash });

function AdminDash() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">Welcome back, Admin</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { i: Users, l: "Total Members", v: "12,548", tone: "blue" },
          { i: Crown, l: "Active Memberships", v: "10,842", tone: "amber" },
          { i: Plane, l: "Pending Requests", v: "23", tone: "rose" },
          { i: Wallet, l: "Total Revenue", v: "₹ 4.2 Cr", tone: "emerald" },
        ].map(({ i: Icon, l, v, tone }) => (
          <Card key={l} className="p-5">
            <div className="flex items-center justify-between">
              <div><div className="text-sm text-muted-foreground">{l}</div><div className="mt-2 font-serif text-3xl font-bold text-navy">{v}</div></div>
              <div className={`grid h-12 w-12 place-items-center rounded-full bg-${tone}-100 text-${tone}-600`}><Icon className="h-6 w-6" /></div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600"><TrendingUp className="h-3 w-3" /> +12.5% this month</div>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h3 className="font-serif text-lg font-bold text-navy">Recent Activity</h3>
        <div className="mt-4 space-y-3 text-sm">
          {[
            "New member registered: Rahul Sharma (JKM10001)",
            "Holiday request JK10254 pending approval",
            "Withdrawal request of ₹10,000 processed",
            "Gold membership upgraded to Platinum for member JKM10023",
          ].map((n, i) => (
            <div key={i} className="flex justify-between border-b pb-2 last:border-0"><span className="text-navy">{n}</span><span className="text-muted-foreground">2h ago</span></div>
          ))}
        </div>
      </Card>
    </div>
  );
}
