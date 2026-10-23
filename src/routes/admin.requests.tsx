import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MessageSquare, Check, X, CalendarClock, Download } from "lucide-react";
import { db, downloadCsv, fmtDate, useProfilesMap, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/requests")({ head: () => createRouteHead("Holiday Requests — JK Holidays Admin", "Review member holiday requests, travel details and status."), component: AdminRequests });

/** alt_dates is stored as "YYYY-MM-DD|YYYY-MM-DD" when set from the calendar; free text is shown as-is. */
export const altRange = (alt: string | null): DateRange | undefined => {
  const m = /^(\d{4}-\d{2}-\d{2})\|(\d{4}-\d{2}-\d{2})$/.exec(alt ?? "");
  if (!m) return undefined;
  return { from: new Date(m[1]), to: new Date(m[2]) };
};
const altLabel = (alt: string | null) => {
  const m = /^(\d{4}-\d{2}-\d{2})\|(\d{4}-\d{2}-\d{2})$/.exec(alt ?? "");
  if (!m) return alt ?? "";
  return `${fmtDate(m[1])} – ${fmtDate(m[2])}`;
};
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function AdminRequests() {
  const q = useRows<any>("holiday_requests", () => db.from("holiday_requests").select("*").order("created_at", { ascending: false }));
  const { map } = useProfilesMap();
  const refresh = useRefresh();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [sel, setSel] = useState<string | null>(null);
  const [mode, setMode] = useState<null | "alt" | "msg" | "reject">(null);
  const [altRangePick, setAltRangePick] = useState<DateRange | undefined>();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const rows = q.data ?? [];
  const detail = rows.find((r) => r.id === sel) ?? null;
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const list = useMemo(() => {
    const filtered = rows.filter((r) => {
      if (tab !== "All" && r.status !== tab) return false;
      const s = search.toLowerCase();
      const name = map[r.user_id]?.full_name ?? "";
      return !s || [r.code, r.destination, name, map[r.user_id]?.member_code].some((v) => String(v ?? "").toLowerCase().includes(s));
    });
    const key = (r: any) => sort === "travel" ? r.check_in : r.created_at;
    return [...filtered].sort((a, b) => {
      if (sort === "oldest") return new Date(key(a)).getTime() - new Date(key(b)).getTime();
      if (sort === "travel") return new Date(key(a)).getTime() - new Date(key(b)).getTime();
      return new Date(key(b)).getTime() - new Date(key(a)).getTime();
    });
  }, [rows, tab, search, map, sort]);

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
    if (!detail) return;
    if (mode === "alt") {
      if (!altRangePick?.from || !altRangePick?.to) return toast.error("Pick the alternate check-in and check-out dates.");
      if (new Date(altRangePick.to) <= new Date(altRangePick.from)) return toast.error("Check-out must be after check-in.");
      return update({ alt_dates: `${iso(altRangePick.from)}|${iso(altRangePick.to)}` }, "Alternate dates sent");
    }
    if (!text.trim()) return toast.error("Please enter some text");
    if (mode === "msg") update({ admin_note: text.trim() }, "Message sent to member");
    if (mode === "reject") update({ status: "Rejected", admin_note: text.trim() }, "Request rejected");
  };

  const exportCsv = () => {
    if (!list.length) return toast.error("Nothing to export");
    downloadCsv("holiday-requests.csv", list.map((r) => ({
      request_id: r.code, member: map[r.user_id]?.full_name ?? "", member_id: map[r.user_id]?.member_code ?? "",
      destination: r.destination, resort: r.resort ?? "", check_in: r.check_in, check_out: r.check_out, nights: r.nights, rooms: r.rooms,
      alt_dates: altLabel(r.alt_dates), status: r.status, admin_note: r.admin_note ?? "", requested_on: fmtDate(r.created_at),
    })));
  };

  const m = detail ? map[detail.user_id] : null;
  const travellers: any[] = Array.isArray(detail?.travellers) ? detail.travellers : [];
  const approvedAlt = detail?.status === "Approved" && !!detail?.alt_dates;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold text-navy">Holiday Requests</h1>
        <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> Download CSV</Button>
      </div>
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
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search by Member / Request ID / Destination" value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-56 flex-1" />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Requested: newest first</SelectItem>
                <SelectItem value="oldest">Requested: oldest first</SelectItem>
                <SelectItem value="travel">Travel date</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  {approvedAlt ? (
                    <>
                      <div className="mt-1 font-semibold text-rose-600">Approved dates: {altLabel(detail.alt_dates)}</div>
                      <div className="text-xs text-muted-foreground line-through">{fmtDate(detail.check_in)} – {fmtDate(detail.check_out)} (originally requested)</div>
                    </>
                  ) : (
                    <div className="mt-1 text-muted-foreground">Dates: {fmtDate(detail.check_in)} – {fmtDate(detail.check_out)}</div>
                  )}
                  <div className="text-muted-foreground">Nights: {detail.nights} · Rooms: {detail.rooms}</div>
                  <div className="text-muted-foreground">Destination: {detail.destination}{detail.resort ? ` · ${detail.resort}` : ""}</div>
                  {detail.special_requests && <div className="text-muted-foreground">Special: {detail.special_requests}</div>}
                  {detail.alt_dates && !approvedAlt && (
                    <div className="mt-1 font-semibold text-rose-600">Alternate dates proposed: {altLabel(detail.alt_dates)}</div>
                  )}
                  {detail.admin_note && <div className="text-muted-foreground">Note: {detail.admin_note}</div>}
                </div>
                {approvedAlt && (
                  <div className="blink-alert rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-600">
                    Please discuss with customer support to verify the dates
                  </div>
                )}
                <div className="rounded-md bg-muted p-3">
                  <div className="font-semibold text-navy">Travellers ({travellers.length})</div>
                  {travellers.map((t, i) => <div key={i} className="text-muted-foreground">{t.name || "Guest"}{t.age ? `, ${t.age}` : ""}{t.gender ? ` · ${t.gender}` : ""}</div>)}
                </div>
              </div>
              {detail.status === "Pending" ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => update({ status: "Approved" }, "Request approved — booking created")}><Check className="mr-1 h-4 w-4" /> Approve</Button>
                  <Button disabled={busy} variant="destructive" onClick={() => { setMode("reject"); setText(""); }}><X className="mr-1 h-4 w-4" /> Reject</Button>
                  <Button variant="outline" onClick={() => { setAltRangePick(altRange(detail.alt_dates)); setMode("alt"); }}><CalendarClock className="mr-1 h-4 w-4" /> Alt Dates</Button>
                  <Button variant="outline" onClick={() => { setMode("msg"); setText(""); }}><MessageSquare className="mr-1 h-4 w-4" /> Send Msg</Button>
                </div>
              ) : (
                <Button variant="outline" className="mt-4 w-full" onClick={() => { setMode("msg"); setText(""); }}><MessageSquare className="mr-1 h-4 w-4" /> Send Message</Button>
              )}
              {mode === "alt" && (
                <Dialog open onOpenChange={(o) => !o && setMode(null)}>
                  <DialogContent className="w-auto max-w-none">
                    <DialogHeader><DialogTitle>Pick alternate dates</DialogTitle></DialogHeader>
                    <Calendar mode="range" selected={altRangePick} onSelect={setAltRangePick} numberOfMonths={2} className="pointer-events-auto p-3" />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                      <Button className="bg-navy text-primary-foreground" disabled={busy} onClick={submitMode}>Send</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {mode && mode !== "alt" && (
                <div className="mt-3 space-y-2">
                  <Textarea placeholder={mode === "reject" ? "Reason for rejection" : "Message to member"} value={text} onChange={(e) => setText(e.target.value)} />
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
