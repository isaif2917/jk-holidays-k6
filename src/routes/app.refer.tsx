import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Gift, Copy, Users, Wallet, BadgeCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { db, fmtDate, inr, useMe, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/refer")({ head: () => createRouteHead("Refer & Earn — JK Holidays", "Share your member referral link and track successful sign-ups and rewards."), component: Refer });

function Refer() {
  const { data: me } = useMe();
  const code = `JKREF-${me?.profile?.member_code || "MEMBER"}`;
  const link = typeof window !== "undefined" ? `${window.location.origin}/auth/register?ref=${code}` : code;
  const copy = async () => { await navigator.clipboard.writeText(link); toast.success("Invite link copied"); };
  const referrals = useRows("my-referrals", () => db.from("referrals").select("id,status,referred_user_id,friend_name,friend_phone,reward_amount,created_at").eq("user_id", me?.user.id).order("created_at", { ascending: false }), !!me?.user.id);
  const wallet = useRows("my-referral-wallet", () => db.from("wallet_transactions").select("type,amount,description").eq("user_id", me?.user.id), !!me?.user.id);
  const rows = referrals.data ?? [];
  const successfulJoins = rows.filter((r: any) => !!r.referred_user_id).length;
  const rewarded = rows.filter((r: any) => r.reward_amount != null);
  const pendingReward = successfulJoins - rewarded.length;
  const earned = (wallet.data ?? []).filter((r: any) => String(r.type).toLowerCase() === "credit" && /referral reward/i.test(r.description ?? ""))
    .reduce((total: number, r: any) => total + Number(r.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Refer & Earn</h1>
      <Card className="bg-navy-gradient p-8 text-white">
        <div className="flex flex-col items-center gap-3 text-center">
          <Gift className="h-14 w-14 text-gold" />
          <h2 className="font-serif text-2xl font-bold">Invite friends and earn rewards for successful signups.</h2>
          <p className="text-sm text-white/80">Your friend picks a membership plan through your link — when we approve their membership, that plan's referral reward is credited to your wallet.</p>
          <div className="mt-4 flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <input readOnly value={link} className="h-10 min-w-0 flex-1 rounded-md border border-white/30 bg-white/10 px-3 text-sm text-white outline-none" />
            <Button onClick={copy} className="bg-gold-gradient font-bold text-navy-deep"><Copy className="mr-1 h-4 w-4" /> Copy</Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Users, l: "Total Referrals", v: String(rows.length) },
          { icon: BadgeCheck, l: "Successful Joins", v: String(successfulJoins) },
          { icon: Wallet, l: "Referral Earnings", v: inr(earned) },
        ].map(({ icon: Icon, l, v }) => (
          <Card key={l} className="p-5"><Icon className="h-6 w-6 text-gold" /><div className="mt-2 text-sm text-muted-foreground">{l}</div><div className="mt-1 font-serif text-3xl font-bold text-navy">{v}</div></Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-serif text-lg font-bold text-navy">My Referrals</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b"><th className="py-2">Friend</th><th>Joined On</th><th>Status</th><th className="text-right">Reward</th></tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-3 font-medium text-navy">{r.friend_name}{r.friend_phone ? <span className="block text-xs text-muted-foreground">{r.friend_phone}</span> : null}</td>
                  <td className="text-muted-foreground">{fmtDate(r.created_at)}</td>
                  <td><StatusBadge s={r.status === "Pending" && r.referred_user_id ? "Joined" : r.status} /></td>
                  <td className="text-right font-semibold">{r.reward_amount != null ? <span className="text-emerald-600">{inr(r.reward_amount)}</span> : <span className="text-muted-foreground">Awaiting plan approval</span>}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No referrals yet. Share your invite link above.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex items-start gap-3 p-5">
          <Clock className="mt-1 h-5 w-5 shrink-0 text-gold" />
          <div><div className="font-semibold text-navy">{pendingReward > 0 ? `${pendingReward} reward${pendingReward === 1 ? "" : "s"} in progress` : "No rewards in progress"}</div>
          <div className="text-xs text-muted-foreground">A reward is credited once your referred friend's membership payment is approved by our team.</div></div>
        </Card>
        <Card className="flex items-start gap-3 p-5">
          <Wallet className="mt-1 h-5 w-5 shrink-0 text-gold" />
          <div><div className="font-semibold text-navy">Rewards land in your wallet</div>
          <div className="text-xs text-muted-foreground">Track them under My Wallet → Recent Transactions and withdraw anytime from ₹500.</div></div>
        </Card>
      </div>
    </div>
  );
}
