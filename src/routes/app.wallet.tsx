import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Building2, Clock, ArrowRight, Shield, Zap, IndianRupee, Headphones } from "lucide-react";
import { transactions } from "@/data/mock";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/app/wallet")({ component: WalletPage });

function WalletPage() {
  const [method, setMethod] = useState<"bank" | "upi">("bank");
  const [amount, setAmount] = useState("");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">My Wallet</h1>
        <div className="text-sm text-muted-foreground">Home › My Wallet & Withdrawal</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-navy-gradient p-5 text-white">
          <div className="text-sm text-white/80">Total Wallet Balance</div>
          <div className="mt-2 font-serif text-3xl font-bold text-gold">₹ 25,630.00</div>
          <div className="mt-1 text-xs text-white/70">Total Available Balance</div>
          <div className="mt-1 text-sm text-emerald-300">₹ 25,630.00</div>
          <Button className="mt-4 w-full bg-gold-gradient font-bold text-navy-deep">WITHDRAW NOW</Button>
        </Card>
        <WalletStat icon={TrendingUp} tone="emerald" label="Total Earnings" value="₹ 1,25,630.00" sub="All Time" link />
        <WalletStat icon={Building2} tone="blue" label="Total Withdrawn" value="₹ 1,00,000.00" sub="All Time" link linkText="View History" />
        <WalletStat icon={Clock} tone="amber" label="Pending Amount" value="₹ 5,000.00" sub="Under Process" link />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-navy">Recent Transactions</h3>
            <a className="text-xs font-semibold text-blue-600">View All</a>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b"><th className="py-2">Date</th><th>Description</th><th>Type</th><th className="text-right">Amount</th><th className="text-right">Balance</th></tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3"><div>{t.date}</div><div className="text-xs text-muted-foreground">{t.time}</div></td>
                    <td><div className="font-medium text-navy">{t.desc}</div><div className="text-xs text-muted-foreground">{t.sub}</div></td>
                    <td><Badge variant="outline" className={t.type === "Credit" ? "border-emerald-500 text-emerald-600" : "border-rose-500 text-rose-600"}>{t.type}</Badge></td>
                    <td className={`text-right font-semibold ${t.type === "Credit" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "Credit" ? "+" : "-"} ₹ {t.amount.toLocaleString()}</td>
                    <td className="text-right text-navy">₹ {t.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="outline" className="mt-4 w-full">VIEW ALL TRANSACTIONS</Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-navy">Withdraw Money</h3>
            <Wallet className="h-6 w-6 text-gold" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Available Balance</div>
          <div className="font-serif text-2xl font-bold text-emerald-600">₹ 25,630.00</div>
          <div className="mt-4 text-sm font-semibold text-navy">Select Withdrawal Method</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["bank", "upi"] as const).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`rounded-md border p-2.5 text-sm ${method === m ? "border-gold bg-gold-soft/30 font-semibold" : ""}`}>
                {m === "bank" ? "🏦 Bank Transfer" : "📱 UPI Transfer"}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold">{method === "bank" ? "Bank Details" : "UPI ID"}</label>
              <Input className="mt-1" placeholder={method === "bank" ? "Select Bank Account" : "yourid@upi"} />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Withdrawal Amount</span><span className="text-muted-foreground">Min. ₹500</span>
              </div>
              <Input className="mt-1" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <div className="mt-2 flex gap-2">
                {[1000, 2000, 5000, 10000].map((a) => (
                  <button key={a} onClick={() => setAmount(String(a))} className="flex-1 rounded-md border px-2 py-1 text-xs hover:border-gold">₹{a.toLocaleString()}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold">Remarks (Optional)</label>
              <Textarea className="mt-1" placeholder="Enter remarks" rows={2} />
            </div>
            <Button className="w-full bg-gold-gradient font-bold text-navy-deep">SUBMIT WITHDRAWAL REQUEST</Button>
            <p className="text-center text-[10px] text-muted-foreground">✓ Withdrawals are processed within 24–48 working hours.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 rounded-2xl bg-navy-gradient p-6 text-white md:grid-cols-4">
        {[
          { i: Shield, t: "100% Secure", d: "Your transactions are fully secure" },
          { i: Zap, t: "Quick Processing", d: "Withdrawals processed within 24–48 hours" },
          { i: IndianRupee, t: "No Hidden Charges", d: "Zero deduction on withdrawal" },
          { i: Headphones, t: "24/7 Support", d: "We are here to help you" },
        ].map(({ i: Icon, t, d }) => (
          <div key={t} className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/50 text-gold"><Icon className="h-5 w-5" /></div>
            <div><div className="font-semibold">{t}</div><div className="text-xs text-white/70">{d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletStat({ icon: Icon, tone, label, value, sub, link, linkText }: any) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 font-serif text-2xl font-bold text-navy">{value}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-full ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
      </div>
      {link && <a className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">{linkText || "View Details"} <ArrowRight className="h-3 w-3" /></a>}
    </Card>
  );
}
