import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Eye, MessageSquare, Check, X, CalendarClock } from "lucide-react";
import { db, fmtDate, useProfilesMap, useRefresh, useRows } from "@/lib/data";

export const Route = createFileRoute("/admin/requests")({ component: AdminRequests });

function AdminRequests() {
  const q = useRows<any>("holiday_requests", () => db.from("holiday_requests").select("*").order("created_at", { ascending: false }));
  const { map } = useProfilesMap();
  const refresh = useRefresh();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [mode, setMode] = useState<null | "alt" | "msg" | "reject">(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const rows = q.data ?? [];
  const detail = rows.find((r) => r.id === sel) ?? null;
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const list = useMemo(() => rows.filter((r) => {
    if (tab !== "All" && r.status !== tab) return false;
    const s = search.toLowerCase();
    const name = map[r.user_id]?.full_name ?? "";
    return !s || [r.code, r.destination, name, map[r.user_id]?.member_code].some((v) => String(v ?? "").toLowerCase().includes(s));
  }), [rows, tab, search, map]);

  const update = async (patch: Record<string, unknown>, ok: string) => {
    if (!detail) return;
    setBusy(true);
    const { error } = await db.from("holiday_requests").update(patch).eq("id", detail.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(ok); setMode(null); setText("");
    refresh("holiday_requests", "bookings", "profiles");
  };

  const submitMode = () => {
    if (!text.trim()) return toast.error("Please enter some text");
    if (mode === "alt") update({ alt_dates: text.trim() }, "Alternate dates sent");
    if (mode === "msg") update({ admin_note: text.trim() }, "Message sent to member");
    if (mode === "reject") update({ status: "Rejected", admin_note: text.trim() }, "Request rejected");
  };

  const m = detail ? map[detail.user_id] : null;
  const travellers: any[] = Array.isArray(detail?.travellers) ? detail.travellers : [];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Holiday Requests</h1>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[["All", rows.length], ["Pending", count("Pending")], ["Approved", count("Approved")], ["Rejected", count("Rejected")]].map(([l, v]) => (
          <button key={l as string} onClick={() => setTab(l as string)} className="text-left">
            <Card className={`p-4 ${tab === l ? "ring-2 ring-gold" : ""}`}>
              <div className="text-xs font-semibold uppercase text-muted-foreground">{l === "All" ? "Total Requests" : l}</div>
              <div className="mt-1 font-serif text-3xl font-bold text-navy">{v}</div>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card className="p-5">
          <Input placeholder="Search by Member / Request ID / Destination" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b"><th className="py-2">Request ID</th><th>Member</th><th>Destination</th><th>Travel Dates</th><th>Nights</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className={`cursor-pointer border-b hover:bg-muted/40 ${sel === r.id ? "bg-muted/60" : ""}`} onClick={() => { setSel(r.id); setMode(null); }}>
                    <td className="py-3 font-mono">{r.code}</td>
                    <td className="font-medium text-navy">{map[r.user_id]?.full_name || "—"}</td>
                    <td>{r.destination}</td>
                    <td>{fmtDate(r.check_in)} – {fmtDate(r.check_out)}</td>
                    <td>{r.nights}</td>
                    <td><StatusBadge s={r.status} /></td>
                    <td><Eye className="h-4 w-4 text-primary" /></td>
                  </tr>
                ))}
                {!list.length && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">{q.isLoading ? "Loading…" : "No requests found."}</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          {detail ? (
            <>
              <div className="flex items-center justify-between">
                <div><div className="text-xs text-muted-foreground">Request Details</div><h3 className="font-serif text-xl font-bold text-navy">{detail.code}</h3></div>
                <StatusBadge s={detail.status} />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="rounded-md bg-muted p-3">
                  <div className="font-semibold text-navy">Member Information</div>
                  <div className="mt-1 text-muted-foreground">{m?.full_name || "—"} · {m?.plan ?? "No plan"} · {m?.member_code}</div>
                  <div className="text-muted-foreground">{m?.phone ?? "—"} · {m?.email ?? "—"}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="font-semibold text-navy">Request Information</div>
                  <div className="mt-1 text-muted-foreground">Destination: {detail.destination}{detail.resort ? ` · ${detail.resort}` : ""}</div>
                  <div className="text-muted-foreground">Dates: {fmtDate(detail.check_in)} – {fmtDate(detail.check_out)}</div>
                  <div className="text-muted-foreground">Nights: {detail.nights} · Rooms: {detail.rooms}</div>
                  {detail.special_requests && <div className="text-muted-foreground">Special: {detail.special_requests}</div>}
                  {detail.alt_dates && <div className="text-muted-foreground">Alt dates: {detail.alt_dates}</div>}
                  {detail.admin_note && <div className="text-muted-foreground">Note: {detail.admin_note}</div>}
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="font-semibold text-navy">Travellers ({travellers.length})</div>
                  {travellers.map((t, i) => <div key={i} className="text-muted-foreground">{t.name || "Guest"}{t.age ? `, ${t.age}` : ""}{t.gender ? ` · ${t.gender}` : ""}</div>)}
                </div>
              </div>
              {detail.status === "Pending" ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => update({ status: "Approved" }, "Request approved — booking created")}><Check className="mr-1 h-4 w-4" /> Approve</Button>
                  <Button disabled={busy} variant="destructive" onClick={() => { setMode("reject"); setText(""); }}><X className="mr-1 h-4 w-4" /> Reject</Button>
                  <Button variant="outline" onClick={() => { setMode("alt"); setText(detail.alt_dates ?? ""); }}><CalendarClock className="mr-1 h-4 w-4" /> Alt Dates</Button>
                  <Button variant="outline" onClick={() => { setMode("msg"); setText(""); }}><MessageSquare className="mr-1 h-4 w-4" /> Send Msg</Button>
                </div>
              ) : (
                <Button variant="outline" className="mt-4 w-full" onClick={() => { setMode("msg"); setText(""); }}><MessageSquare className="mr-1 h-4 w-4" /> Send Message</Button>
              )}
              {mode && (
                <div className="mt-3 space-y-2">
                  <Textarea placeholder={mode === "alt" ? "e.g. 12 Nov – 15 Nov 2026" : mode === "reject" ? "Reason for rejection" : "Message to member"} value={text} onChange={(e) => setText(e.target.value)} />
                  <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setMode(null)}>Cancel</Button><Button className="flex-1 bg-navy text-primary-foreground" disabled={busy} onClick={submitMode}>Send</Button></div>
                </div>
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center py-10 text-center text-sm text-muted-foreground">Select a request to view details</div>
          )}
        </Card>
      </div>
    </div>
  );
}
