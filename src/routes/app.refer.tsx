import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Copy } from "lucide-react";
import { toast } from "sonner";
import { useMe } from "@/lib/data";

export const Route = createFileRoute("/app/refer")({ component: Refer });

function Refer() {
  const { data: me } = useMe();
  const code = `JKREF-${me?.profile?.member_code || "MEMBER"}`;
  const link = typeof window !== "undefined" ? `${window.location.origin}/auth/register?ref=${code}` : code;
  const copy = async () => { await navigator.clipboard.writeText(link); toast.success("Invite link copied"); };
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Refer & Earn</h1>
      <Card className="bg-navy-gradient p-8 text-white">
        <div className="flex flex-col items-center gap-3 text-center">
          <Gift className="h-14 w-14 text-gold" />
          <h2 className="font-serif text-2xl font-bold">Invite friends. Earn ₹2,500 for every signup.</h2>
          <div className="mt-4 flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <input readOnly value={link} className="h-10 min-w-0 flex-1 rounded-md border border-white/30 bg-white/10 px-3 text-sm text-white outline-none" />
            <Button onClick={copy} className="bg-gold-gradient font-bold text-navy-deep"><Copy className="mr-1 h-4 w-4" /> Copy</Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { l: "Total Referrals", v: "0" },
          { l: "Successful Joins", v: "0" },
          { l: "Total Earned", v: "₹ 0" },
        ].map((s) => (
          <Card key={s.l} className="p-5"><div className="text-sm text-muted-foreground">{s.l}</div><div className="mt-2 font-serif text-3xl font-bold text-navy">{s.v}</div></Card>
        ))}
      </div>
    </div>
  );
}
