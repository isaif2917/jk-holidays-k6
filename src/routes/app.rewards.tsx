import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Gift, Users, Wallet, BadgeCheck } from "lucide-react";
import { db, fmtDate, inr, useMe, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/rewards")({ head: () => createRouteHead("My Rewards — JK Holidays", "Review the rewards you have earned through your JK Holidays membership."), component: Rewards });

function Rewards() {
  const { data: me } = useMe();
  const referrals = useRows("my-referrals", () => db.from("referrals").select("id,status,referred_user_id,friend_name,reward_amount,created_at").eq("user_id", me?.user.id).order("created_at", { ascending: false }), !!me?.user.id);
  const wallet = useRows("my-referral-wallet", () => db.from("wallet_transactions").select("type,amount,description,created_at").eq("user_id", me?.user.id), !!me?.user.id);
  const rows = referrals.data ?? [];
  const rewards = rows.filter((r: any) => r.reward_amount != null);
  const earned = (wallet.data ?? []).filter((r: any) => String(r.type).toLowerCase() === "credit" && /referral reward/i.test(r.description ?? ""))
    .reduce((total: number, r: any) => total + Number(r.amount ?? 0), 0);
  const successfulJoins = rows.filter((r: any) => !!r.referred_user_id).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">My Rewards</h1>
        <div className="text-sm text-muted-foreground">Referral rewards you have earned from friends who joined through your link.</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-navy-gradient p-5 text-white">
          <Gift className="h-7 w-7 text-gold" />
          <div className="mt-2 text-sm text-white/80">Total Referral Earnings</div>
          <div className="font-serif text-3xl font-bold text-gold">{inr(earned)}</div>
          <Link to="/app/wallet" className="mt-2 inline-block text-xs font-semibold text-gold">Open my wallet →</Link>
        </Card>
        <Card className="p-5"><Users className="h-7 w-7 text-gold" /><div className="mt-2 text-sm text-muted-foreground">Total Referrals</div><div className="font-serif text-3xl font-bold text-navy">{rows.length}</div></Card>
        <Card className="p-5"><BadgeCheck className="h-7 w-7 text-gold" /><div className="mt-2 text-sm text-muted-foreground">Successful Joins</div><div className="font-serif text-3xl font-bold text-navy">{successfulJoins}</div></Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-gold" /><h3 className="font-serif text-lg font-bold text-navy">Reward History</h3></div>
        <div className="mt-4 divide-y">
          {rewards.map((r: any) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div><div className="font-medium text-navy">{r.friend_name}</div><div className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</div></div>
              <div className="flex items-center gap-3"><StatusBadge s={r.status} /><span className="font-semibold text-emerald-600">{inr(r.reward_amount)}</span></div>
            </div>
          ))}
          {!rewards.length && <p className="py-4 text-sm text-muted-foreground">No rewards credited yet. Share your invite link from Refer &amp; Earn to start earning.</p>}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">The reward depends on the membership plan your friend chooses — see Refer &amp; Earn for your invite link.</div>
      </Card>
    </div>
  );
}
