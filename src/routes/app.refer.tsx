import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Gift, Copy } from "lucide-react";

export const Route = createFileRoute("/app/refer")({ component: Refer });

function Refer() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Refer & Earn</h1>
      <Card className="bg-navy-gradient p-8 text-white">
        <div className="flex flex-col items-center gap-3 text-center">
          <Gift className="h-14 w-14 text-gold" />
          <h2 className="font-serif text-2xl font-bold">Invite friends. Earn ₹2,500 for every signup.</h2>
          <div className="mt-4 flex w-full max-w-md gap-2">
            <Input defaultValue="JKREF-RAHUL784561" className="text-navy" />
            <Button className="bg-gold-gradient font-bold text-navy-deep"><Copy className="mr-1 h-4 w-4" /> Copy</Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { l: "Total Referrals", v: "24" },
          { l: "Successful Joins", v: "18" },
          { l: "Total Earned", v: "₹ 45,000" },
        ].map((s) => (
          <Card key={s.l} className="p-5"><div className="text-sm text-muted-foreground">{s.l}</div><div className="mt-2 font-serif text-3xl font-bold text-navy">{s.v}</div></Card>
        ))}
      </div>
    </div>
  );
}
