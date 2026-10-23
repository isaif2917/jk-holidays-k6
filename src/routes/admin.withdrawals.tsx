import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, downloadCsv, inr, useProfilesMap, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";
import { calculateAvailableWalletBalance } from "@/lib/wallet-balance";

export const Route = createFileRoute("/admin/withdrawals")({ head: () => createRouteHead("Withdrawal Requests — JK Holidays Admin", "Review member withdrawal requests and update payout status."), component: Withdrawals });

const tabs = ["All", "Pending", "Approved", "Rejected", "Paid"];
const fmtDT = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Withdrawals() {
  const q = useRows<any>("withdrawals", () => db.from("withdrawals").select("*").order("created_at", { ascending: false }));
  const tx = useRows<any>("wallet_transactions", () => db.from("wallet_transactions").select("user_id,type,amount"));
  const { map } = useProfilesMap();
  const refresh = useRefresh();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [review, setReview] = useState<any | null>(null);
  const [remarks, setRemarks] = useState("");
  const [dlOpen, setDlOpen] = useState(false);
  const [cols, setCols] = useState<Record<string, boolean>>({});

  const rows = q.data ?? [];
  const balance = (uid: string) => calculateAvailableWalletBalance(
    (tx.data ?? []).filter((transaction) => transaction.user_id === uid),
    rows.filter((withdrawal) => withdrawal.user_id === uid),
  );
  const list = useMemo(() => rows.filter((w) => (tab === "All" || w.status === tab) && (!search || [w.id, map[w.user_id]?.full_name, map[w.user_id]?.member_code, w.details?.account_number, w.details?.upi_id].some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase())))), [rows, tab, search, map]);
  const shortId = (id: string) => "WD" + id.slice(0, 5).toUpperCase();

  const setStatus = async (ids: string[], status: string) => {
    if (!ids.length) return;
    const { error } = await db.from("withdrawals").update({ status, ...(remarks.trim() && review ? { remarks: remarks.trim() } : {}) }).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} withdrawal(s) marked ${status}`);
    setPicked([]); setReview(null); setRemarks("");
    refresh("withdrawals", "wallet_transactions");
  };

  const COLS: { key: string; get: (w: any) => unknown }[] = [
    { key: "ID", get: (w) => shortId(w.id) },
    { key: "Name", get: (w) => map[w.user_id]?.full_name ?? "" },
    { key: "Member ID", get: (w) => map[w.user_id]?.member_code ?? "" },
    { key: "Email", get: (w) => map[w.user_id]?.email ?? "" },
    { key: "Mobile", get: (w) => map[w.user_id]?.phone ?? "" },
    { key: "Amount", get: (w) => w.amount },
    { key: "Status", get: (w) => w.status },
    { key: "Balance", get: (w) => balance(w.user_id) },
    { key: "DateTime", get: (w) => fmtDT(w.created_at) },
    { key: "Method", get: (w) => w.method },
    { key: "Account Number", get: (w) => w.details?.account_number ?? "" },
    { key: "Holder Name", get: (w) => w.details?.holder_name ?? "" },
    { key: "Bank", get: (w) => w.details?.bank ?? "" },
    { key: "Branch", get: (w) => w.details?.branch ?? "" },
    { key: "IFSC", get: (w) => w.details?.ifsc ?? "" },
    { key: "UPI", get: (w) => w.details?.upi_id ?? "" },
    { key: "Remarks", get: (w) => w.remarks ?? "" },
  ];
  const colsOn = COLS.every((c) => cols[c.key] !== false) ? {} : cols;
  const exportExcel = () => {
    if (!list.length) return toast.error("Nothing to export");
    const chosen = COLS.filter((c) => colsOn[c.key] !== false);
    if (!chosen.length) return toast.error("Select at least one column");
    downloadCsv("withdrawals.csv", list.map((w) => Object.fromEntries(chosen.map((c) => [c.key, c.get(w)]))));
    setDlOpen(false);
  };

  const allChecked = list.length > 0 && list.every((w) => picked.includes(w.id));
  const d = (w: any, k: string) => w.details?.[k] || "—";

  return (
    <div className="space-y-6">
      <div><h1 className="font-serif text-3xl font-bold text-navy">Withdrawals</h1><div className="text-sm text-muted-foreground">Dashboard › Withdrawals</div></div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const n = t === "All" ? rows.length : rows.filter((w) => w.status === t).length;
          return <button key={t} onClick={() => { setTab(t); setPicked([]); }} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${tab === t ? "bg-navy text-primary-foreground" : "bg-card text-navy"}`}>{t}<span className="rounded-full bg-muted px-2 text-xs text-navy">{n}</span></button>;
        })}
      </div>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button size="sm" disabled={!picked.length} className="bg-emerald-600 text-primary-foreground hover:bg-emerald-700" onClick={() => setStatus(picked, "Approved")}>Approve</Button>
            <Button size="sm" disabled={!picked.length} className="bg-blue-600 text-primary-foreground hover:bg-blue-700" onClick={() => setStatus(picked, "Paid")}>Mark Paid</Button>
            <Button size="sm" disabled={!picked.length} variant="destructive" onClick={() => setStatus(picked, "Rejected")}>Reject</Button>
          </div>
          <div className="flex gap-2">
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="w-60 pl-9" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <Button variant="outline" onClick={() => { setCols({}); setDlOpen(true); }}><Download className="mr-1 h-4 w-4" /> Select & Download</Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b"><th className="py-2"><input type="checkbox" checked={allChecked} onChange={() => setPicked(allChecked ? [] : list.map((w) => w.id))} /></th><th>ID</th><th>Name</th><th>Amount</th><th>Status</th><th>Balance</th><th>Date Time</th><th>Account Number</th><th>Holder Name</th><th>Bank</th><th>Branch</th><th>IFSC</th><th>Action</th></tr>
            </thead>
            <tbody>
              {list.map((w) => (
                <tr key={w.id} className="border-b">
                  <td className="py-3"><input type="checkbox" checked={picked.includes(w.id)} onChange={() => setPicked((p) => p.includes(w.id) ? p.filter((x) => x !== w.id) : [...p, w.id])} /></td>
                  <td className="font-mono">{shortId(w.id)}</td>
                  <td><div className="font-medium text-navy">{map[w.user_id]?.full_name || "—"}</div><div className="text-xs text-muted-foreground">{map[w.user_id]?.member_code}</div></td>
                  <td className="font-semibold">{inr(w.amount)}</td>
                  <td><StatusBadge s={w.status} /></td>
                  <td>{inr(balance(w.user_id))}</td>
                  <td className="text-muted-foreground">{fmtDT(w.created_at)}</td>
                  <td>{w.method === "UPI" ? d(w, "upi_id") : d(w, "account_number")}</td>
                  <td>{d(w, "holder_name")}</td><td>{d(w, "bank")}</td><td>{d(w, "branch")}</td><td>{d(w, "ifsc")}</td>
                  <td><Button variant="outline" size="sm" onClick={() => { setReview(w); setRemarks(w.remarks ?? ""); }}>Review</Button></td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={13} className="py-8 text-center text-muted-foreground">{q.isLoading ? "Loading…" : "No withdrawals found."}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!review} onOpenChange={(o) => !o && setReview(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Review {review && shortId(review.id)}</DialogTitle></DialogHeader>
          {review && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-3">
                <div>Member</div><div className="font-medium">{map[review.user_id]?.full_name} ({map[review.user_id]?.member_code})</div>
                <div>Amount</div><div className="font-semibold">{inr(review.amount)}</div>
                <div>Wallet balance</div><div>{inr(balance(review.user_id))}</div>
                <div>Method</div><div>{review.method}</div>
                {Object.entries(review.details ?? {}).map(([k, v]) => [<div key={k} className="capitalize">{k.replace(/_/g, " ")}</div>, <div key={k + "v"}>{String(v)}</div>])}
                <div>Status</div><div><StatusBadge s={review.status} /></div>
              </div>
              <Textarea placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              <div className="grid grid-cols-3 gap-2">
                <Button className="bg-emerald-600 text-primary-foreground hover:bg-emerald-700" disabled={review.status !== "Pending"} onClick={() => setStatus([review.id], "Approved")}>Approve</Button>
                <Button className="bg-blue-600 text-primary-foreground hover:bg-blue-700" disabled={review.status !== "Approved"} onClick={() => setStatus([review.id], "Paid")}>Mark Paid</Button>
                <Button variant="destructive" disabled={review.status !== "Pending"} onClick={() => setStatus([review.id], "Rejected")}>Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dlOpen} onOpenChange={setDlOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Choose columns to download</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">The file includes the {list.length} withdrawal(s) currently filtered on this page ({tab === "All" ? "all statuses" : tab}).</p>
          <div className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
            {COLS.map((c) => (
              <label key={c.key} className="flex items-center gap-2">
                <input type="checkbox" checked={colsOn[c.key] !== false} onChange={(e) => setCols({ ...cols, [c.key]: e.target.checked })} /> {c.key}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDlOpen(false)}>Cancel</Button>
            <Button className="bg-navy text-white" onClick={exportExcel}><Download className="mr-1 h-4 w-4" /> Download CSV</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
