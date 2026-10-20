import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Clock, TrendingUp, Users, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, inr, useProfilesMap, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/wallet")({ head: () => createRouteHead("Wallet & Payments — JK Holidays Admin", "Review member wallet transactions and manage withdrawal payouts."), component: AdminWallet });

const fmt = (d: string) => new Date(d);

function AdminWallet() {
  const tx = useRows<any>("wallet_transactions", () => db.from("wallet_transactions").select("*").order("created_at", { ascending: false }));
  const wd = useRows<any>("withdrawals", () => db.from("withdrawals").select("*").order("created_at", { ascending: false }));
  const { map, list: members } = useProfilesMap();
  const refresh = useRefresh();
  const [all, setAll] = useState(false);
  const [manage, setManage] = useState(false);
  const [f, setF] = useState({ user_id: "", type: "Credit", amount: "", description: "Manual wallet credit" });

  const t = tx.data ?? [];
  const w = wd.data ?? [];
  const bal: Record<string, number> = {};
  t.forEach((x) => (bal[x.user_id] = (bal[x.user_id] ?? 0) + (x.type === "Credit" ? x.amount : -x.amount)));
  const liquidity = Object.values(bal).reduce((s, v) => s + v, 0);
  const paidOut = w.filter((x) => x.status === "Approved" || x.status === "Paid").reduce((s, x) => s + x.amount, 0);
  const pending = w.filter((x) => x.status === "Pending");
  const pendingAmt = pending.reduce((s, x) => s + x.amount, 0);
  const active = Object.values(bal).filter((v) => v > 0).length;

  const act = async (id: string, status: string) => {
    const { error } = await db.from("withdrawals").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Withdrawal ${status.toLowerCase()}`); refresh("withdrawals", "wallet_transactions");
  };
  const saveAdj = async () => {
    const amount = Math.round(Number(f.amount));
    if (!f.user_id || !amount || amount <= 0) return toast.error("Choose a member and a valid amount");
    if (!f.description.trim()) return toast.error("Description required");
    const { error } = await db.from("wallet_transactions").insert({ user_id: f.user_id, type: f.type, amount, description: f.description.trim().slice(0, 200) });
    if (error) return toast.error(error.message);
    toast.success("Wallet updated"); setManage(false); setF({ user_id: "", type: "Credit", amount: "", description: "Manual wallet credit" }); refresh("wallet_transactions");
  };

  const shown = all ? t : t.slice(0, 8);
  return (
    <div className="space-y-6">
      <div><h1 className="font-serif text-3xl font-bold text-navy">Wallet & Payments</h1><div className="text-sm text-muted-foreground">Dashboard › System wallet & payouts</div></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-navy-gradient p-5 text-primary-foreground">
          <div className="text-sm opacity-80">Total System Liquidity</div>
          <div className="mt-2 font-serif text-3xl font-bold text-gold">{inr(liquidity)}</div>
          <div className="text-xs opacity-70">Points held across member wallets</div>
          <Button className="mt-4 w-full bg-gold-gradient font-bold text-navy-deep" onClick={() => setManage(true)}>MANAGE BALANCES</Button>
        </Card>
        <Stat icon={TrendingUp} label="Total Paid Out" value={inr(paidOut)} sub="Approved + paid withdrawals" link="View History" onClick={() => setAll(true)} />
        <Stat icon={Clock} label="Payouts Pending" value={inr(pendingAmt)} sub={`${pending.length} under process`} link="Review Queue" to="/admin/withdrawals" />
        <Stat icon={Users} label="Active Wallets" value={String(active)} sub="Members with balance > 0" link="View Members" to="/admin/members" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <div className="flex items-center justify-between"><h3 className="font-serif text-lg font-bold text-navy">Recent Transactions</h3><button className="text-sm font-semibold text-primary" onClick={() => setAll(!all)}>{all ? "Show less" : "View All"}</button></div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2">Date</th><th>Member</th><th>Description</th><th>Type</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {shown.map((x) => (
                  <tr key={x.id} className="border-b">
                    <td className="py-3"><div>{fmt(x.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div><div className="text-xs text-muted-foreground">{fmt(x.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div></td>
                    <td><div>{map[x.user_id]?.full_name || "—"}</div><div className="text-xs text-muted-foreground">{map[x.user_id]?.email}</div></td>
                    <td>{x.description}</td>
                    <td><Badge variant="outline" className={x.type === "Credit" ? "border-emerald-500 text-emerald-600" : "border-rose-500 text-rose-600"}>{x.type}</Badge></td>
                    <td className={`text-right font-semibold ${x.type === "Credit" ? "text-emerald-600" : "text-rose-600"}`}>{x.type === "Credit" ? "+" : "-"} {inr(x.amount)}</td>
                  </tr>
                ))}
                {!t.length && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No transactions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between"><h3 className="font-serif text-lg font-bold text-navy">Payout Management</h3><Wallet className="h-5 w-5 text-gold" /></div>
          <div className="mt-3 text-xs text-muted-foreground">Pending withdrawal amount</div>
          <div className="font-serif text-2xl font-bold text-gold">{inr(pendingAmt)}</div>
          <div className="mt-4 space-y-3">
            {pending.map((x) => (
              <div key={x.id} className="rounded-md border p-3 text-sm">
                <div className="flex justify-between"><span className="font-medium text-navy">{map[x.user_id]?.full_name || "Member"}</span><span className="font-semibold">{inr(x.amount)}</span></div>
                <div className="text-xs text-muted-foreground">{x.method} · {fmt(x.created_at).toLocaleDateString("en-IN")}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button size="sm" className="bg-emerald-600 text-primary-foreground hover:bg-emerald-700" onClick={() => act(x.id, "Approved")}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => act(x.id, "Rejected")}>Reject</Button>
                </div>
              </div>
            ))}
            {!pending.length && <p className="py-6 text-center text-sm text-muted-foreground">No pending payouts.</p>}
          </div>
          <Button asChild variant="outline" className="mt-4 w-full font-semibold"><Link to="/admin/withdrawals">OPEN FULL WITHDRAWALS <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </Card>
      </div>

      <Dialog open={manage} onOpenChange={setManage}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Manage member balance</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.user_id} onChange={(e) => setF({ ...f, user_id: e.target.value })}>
              <option value="">Select member</option>
              {members.map((m: any) => <option key={m.id} value={m.id}>{m.full_name || m.email} · {m.member_code} · {inr(bal[m.id] ?? 0)}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              {["Credit", "Debit"].map((ty) => <Button key={ty} variant={f.type === ty ? "default" : "outline"} onClick={() => setF({ ...f, type: ty, description: ty === "Credit" ? "Manual wallet credit" : "Manual wallet debit" })}>{ty}</Button>)}
            </div>
            <Input type="number" min="1" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
            <Input placeholder="Description" maxLength={200} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            <Button className="w-full bg-navy text-primary-foreground" onClick={saveAdj}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, link, to, onClick }: { icon: any; label: string; value: string; sub: string; link: string; to?: "/admin/withdrawals" | "/admin/members"; onClick?: () => void }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between"><div className="text-sm text-muted-foreground">{label}</div><div className="grid h-11 w-11 place-items-center rounded-full bg-muted"><Icon className="h-5 w-5 text-gold" /></div></div>
      <div className="font-serif text-2xl font-bold text-navy">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
      {to ? <Link to={to} className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{link} <ArrowRight className="ml-1 h-3 w-3" /></Link>
        : <button onClick={onClick} className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{link} <ArrowRight className="ml-1 h-3 w-3" /></button>}
    </Card>
  );
}
