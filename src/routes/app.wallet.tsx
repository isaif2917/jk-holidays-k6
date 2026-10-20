import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Building2, Clock, Shield, Zap, IndianRupee, Headphones } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db, fmtDate, inr, useMe, useRefresh, useRows } from "@/lib/data";
import { validateWithdrawalAmount } from "@/lib/wallet-validation";
import { calculateAvailableWalletBalance } from "@/lib/wallet-balance";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({ meta: [{ title: "My Wallet — JK Holidays" }, { name: "description", content: "Review your wallet activity and request a withdrawal." }, { property: "og:title", content: "My Wallet — JK Holidays" }, { property: "og:description", content: "Review your JK Holidays wallet activity and withdrawal requests." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { data: me } = useMe();
  const refresh = useRefresh();
  const [method, setMethod] = useState<"bank" | "upi">("bank");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [holderName, setHolderName] = useState("");
  const [bank, setBank] = useState("");
  const [branch, setBranch] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const tx = useRows("my-wallet-transactions", () => db.from("wallet_transactions").select("*").eq("user_id", me?.user.id).order("created_at", { ascending: false }), !!me?.user.id);
  const withdrawals = useRows("my-withdrawals", () => db.from("withdrawals").select("*").eq("user_id", me?.user.id).order("created_at", { ascending: false }), !!me?.user.id);
  const earned = (tx.data ?? []).filter((r: any) => String(r.type).toLowerCase() === "credit").reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
  const paidOut = (withdrawals.data ?? []).filter((r: any) => r.status === "Paid").reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
  const pending = (withdrawals.data ?? []).filter((r: any) => r.status === "Pending" || r.status === "Approved").reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
  const balance = calculateAvailableWalletBalance(tx.data ?? [], withdrawals.data ?? []);
  const submitWithdrawal = async () => {
    if (!me?.user.id) return toast.error("Sign in to request a withdrawal.");
    const amountResult = validateWithdrawalAmount(amount, balance);
    if (!amountResult.valid) return toast.error(amountResult.message);
    const parsedAmount = amountResult.amount;
    if (method === "upi" && !/^\S+@\S+$/.test(account.trim())) return toast.error("Enter a valid UPI ID.");
    if (method === "bank" && (!account.trim() || !holderName.trim() || !bank.trim() || !ifsc.trim())) return toast.error("Enter your account number, account holder, bank and IFSC.");
    if ([account, holderName, bank, branch, ifsc, remarks].some((value) => value.length > 200)) return toast.error("Please shorten the payment details and try again.");
    setBusy(true);
    const details = method === "upi"
      ? { upi_id: account.trim() }
      : { account_number: account.trim(), holder_name: holderName.trim(), bank: bank.trim(), branch: branch.trim(), ifsc: ifsc.trim() };
    const { error } = await db.from("withdrawals").insert({ amount: parsedAmount, method: method === "upi" ? "UPI" : "Bank", details, remarks: remarks.trim() || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Withdrawal request submitted");
    setAmount(""); setAccount(""); setHolderName(""); setBank(""); setBranch(""); setIfsc(""); setRemarks("");
    refresh("my-withdrawals");
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">My Wallet</h1>
        <div className="text-sm text-muted-foreground">Home › My Wallet & Withdrawal</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-navy-gradient p-5 text-white">
          <div className="text-sm text-white/80">Total Wallet Balance</div>
          <div className="mt-2 font-serif text-3xl font-bold text-gold">{inr(balance)}</div>
          <div className="mt-1 text-xs text-white/70">Available after pending requests</div>
          <Button onClick={() => document.getElementById("withdrawal-form")?.scrollIntoView({ behavior: "smooth" })} className="mt-4 w-full bg-gold-gradient font-bold text-navy-deep">WITHDRAW NOW</Button>
        </Card>
        <WalletStat icon={TrendingUp} tone="emerald" label="Total Earnings" value={inr(earned)} sub="Wallet credits" />
        <WalletStat icon={Building2} tone="blue" label="Total Withdrawn" value={inr(paidOut)} sub="Paid requests" />
        <WalletStat icon={Clock} tone="amber" label="Pending Amount" value={inr(pending)} sub="Under process" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-navy">Recent Transactions</h3>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b"><th className="py-2">Date</th><th>Description</th><th>Type</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody>
                {(tx.data ?? []).map((t: any) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-3">{fmtDate(t.created_at)}</td>
                    <td><div className="font-medium text-navy">{t.description}</div></td>
                    <td><Badge variant="outline" className={String(t.type).toLowerCase() === "credit" ? "border-emerald-500 text-emerald-600" : "border-rose-500 text-rose-600"}>{t.type}</Badge></td>
                    <td className={`text-right font-semibold ${String(t.type).toLowerCase() === "credit" ? "text-emerald-600" : "text-rose-600"}`}>{String(t.type).toLowerCase() === "credit" ? "+" : "-"} {inr(t.amount)}</td>
                  </tr>
                ))}
                {!tx.data?.length && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">{tx.isLoading ? "Loading wallet activity…" : "No wallet transactions yet."}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Your wallet activity is shown from your saved account records.</div>
        </Card>

        <Card id="withdrawal-form" className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-navy">Withdraw Money</h3>
            <Wallet className="h-6 w-6 text-gold" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Available Balance</div>
          <div className="font-serif text-2xl font-bold text-emerald-600">{inr(balance)}</div>
          <div className="mt-4 text-sm font-semibold text-navy">Select Withdrawal Method</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["bank", "upi"] as const).map((m) => (
              <Button key={m} type="button" variant={method === m ? "default" : "outline"} onClick={() => setMethod(m)}
                className={`h-auto p-2.5 text-sm ${method === m ? "bg-navy text-white" : ""}`}>
                {m === "bank" ? "Bank Transfer" : "UPI Transfer"}
              </Button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold">{method === "bank" ? "Account number" : "UPI ID"}</label>
              <Input className="mt-1" maxLength={200} value={account} onChange={(e) => setAccount(e.target.value)} placeholder={method === "bank" ? "Enter account number" : "yourid@upi"} />
            </div>
            {method === "bank" && <>
              <label className="block text-xs font-semibold">Account holder name<Input className="mt-1" placeholder="Name as on account" maxLength={200} value={holderName} onChange={(e) => setHolderName(e.target.value)} /></label>
              <label className="block text-xs font-semibold">Bank name<Input className="mt-1" placeholder="Bank name" maxLength={200} value={bank} onChange={(e) => setBank(e.target.value)} /></label>
              <label className="block text-xs font-semibold">Branch (optional)<Input className="mt-1" placeholder="Branch" maxLength={200} value={branch} onChange={(e) => setBranch(e.target.value)} /></label>
              <label className="block text-xs font-semibold">IFSC<Input className="mt-1" placeholder="IFSC" maxLength={11} value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} /></label>
            </>}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Withdrawal Amount</span><span className="text-muted-foreground">Min. ₹500</span>
              </div>
              <Input className="mt-1" type="number" min="500" max={balance} step="1" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <div className="mt-2 flex gap-2">
                {[1000, 2000, 5000, 10000].map((a) => (
                  <Button key={a} type="button" size="sm" variant="outline" onClick={() => setAmount(String(a))} className="h-auto flex-1 px-2 py-1 text-xs">₹{a.toLocaleString()}</Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold">Remarks (Optional)</label>
              <Textarea className="mt-1" placeholder="Enter remarks" rows={2} maxLength={200} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
            <Button disabled={busy || balance < 500} onClick={submitWithdrawal} className="w-full bg-gold-gradient font-bold text-navy-deep">{busy ? "SUBMITTING…" : "SUBMIT WITHDRAWAL REQUEST"}</Button>
            <p className="text-center text-[10px] text-muted-foreground">✓ Withdrawals are processed within 24–48 working hours.</p>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-serif text-lg font-bold text-navy">Withdrawal requests</h3>
        <div className="mt-3 divide-y">
          {(withdrawals.data ?? []).map((r: any) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span>{fmtDate(r.created_at)} · {r.method}</span><span className="font-semibold">{inr(r.amount)} · {r.status}</span></div>)}
          {!withdrawals.data?.length && <p className="py-4 text-sm text-muted-foreground">{withdrawals.isLoading ? "Loading requests…" : "No withdrawal requests yet."}</p>}
        </div>
      </Card>

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

function WalletStat({ icon: Icon, tone, label, value, sub }: any) {
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
    </Card>
  );
}
