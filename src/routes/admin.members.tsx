import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Search, Download, Upload, Plus, Eye, Edit, MoreVertical, CalendarIcon, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, downloadCsv, fmtDate, inr, useRefresh, useRows } from "@/lib/data";
import { createMember, deleteMember, saveMemberDetails, setMemberPassword } from "@/lib/admin.functions";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/members")({
  head: () => createRouteHead("Members — JK Holidays Admin", "Manage member profiles, account access, plans, referrals and wallet history."),
  component: Members,
});

const planColor: Record<string, string> = {
  Silver: "bg-slate-200 text-slate-700", Gold: "bg-amber-100 text-amber-700", Platinum: "bg-violet-100 text-violet-700",
};
const STATUSES = ["Active", "Inactive", "Pending", "Suspended"];
const PAGE = 10;

function Members() {
  const refresh = useRefresh();
  const saveMember = saveMemberDetails;
  const deleteMemberAccount = deleteMember;
  const profiles = useRows("profiles", () => db.from("profiles").select("*").order("created_at", { ascending: false }));
  const plans = useRows("membership_plans", () => db.from("membership_plans").select("name").order("sort"));
  const referralRows = useRows("member-referral-summary", () => db.from("referrals").select("user_id"));
  const referrerRows = useRows("member-referrer-of", () => db.from("referrals").select("referred_user_id,user_id").not("referred_user_id", "is", null));
  const walletRows = useRows("member-wallet-summary", () => db.from("wallet_transactions").select("user_id,type,amount"));
  const withdrawalRows = useRows("member-withdrawal-summary", () => db.from("withdrawals").select("user_id,amount,status"));
  const [q, setQ] = useState(""); const [plan, setPlan] = useState("all"); const [status, setStatus] = useState("all");
  const [range, setRange] = useState<DateRange | undefined>(); const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const [view, setView] = useState<any>(null); const [edit, setEdit] = useState<any>(null); const [adding, setAdding] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => (profiles.data ?? []).filter((m: any) => {
    const s = q.toLowerCase();
    if (s && ![m.full_name, m.email, m.phone, m.member_code].some((v) => String(v ?? "").toLowerCase().includes(s))) return false;
    if (plan !== "all" && (m.plan ?? "None") !== plan) return false;
    if (status !== "all" && m.status !== status) return false;
    const d = new Date(m.created_at);
    if (range?.from && d < new Date(range.from.setHours(0, 0, 0, 0))) return false;
    if (range?.to && d > new Date(new Date(range.to).setHours(23, 59, 59, 999))) return false;
    return true;
  }), [profiles.data, q, plan, status, range]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice((page - 1) * PAGE, page * PAGE);
  const summaries = useMemo(() => {
    const result: Record<string, { referrals: number; earned: number; withdrawn: number; pending: number }> = {};
    const ensure = (id: string) => result[id] ??= { referrals: 0, earned: 0, withdrawn: 0, pending: 0 };
    (referralRows.data ?? []).forEach((r: any) => { ensure(r.user_id).referrals += 1; });
    (walletRows.data ?? []).forEach((r: any) => { if (String(r.type).toLowerCase() === "credit") ensure(r.user_id).earned += Number(r.amount ?? 0); });
    (withdrawalRows.data ?? []).forEach((r: any) => {
      if (r.status === "Paid" || r.status === "Approved") ensure(r.user_id).withdrawn += Number(r.amount ?? 0);
      if (r.status === "Pending") ensure(r.user_id).pending += Number(r.amount ?? 0);
    });
    return result;
  }, [referralRows.data, walletRows.data, withdrawalRows.data]);
  const profilesById = useMemo(() => Object.fromEntries((profiles.data ?? []).map((p: any) => [p.id, p])), [profiles.data]);
  const referrerOf = useMemo(() => Object.fromEntries((referrerRows.data ?? []).map((r: any) => [r.referred_user_id, r.user_id])), [referrerRows.data]);
  const referrerLabel = (id: string) => {
    const rid = referrerOf[id];
    if (!rid) return null;
    const p = profilesById[rid];
    return p ? `${p.full_name || p.email || "Member"}${p.member_code ? ` (${p.member_code})` : ""}` : null;
  };

  const update = async (ids: string[], patch: any, msg = "Updated") => {
    const { error } = await db.from("profiles").update(patch).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(msg); refresh("profiles"); setSel([]);
  };
  const reset = () => { setQ(""); setPlan("all"); setStatus("all"); setRange(undefined); setPage(1); };
  const exportRows = (list: any[]) => downloadCsv("members.csv", list.map((m) => ({
    member_id: m.member_code, name: m.full_name, mobile: m.phone, email: m.email, city: m.city, plan: m.plan, status: m.status, joined: fmtDate(m.created_at),
  })));
  const importCsv = async (f: File) => {
    const lines = (await f.text()).trim().split(/\r?\n/); const head = lines.shift()!.split(",").map((h) => h.trim().toLowerCase());
    let ok = 0;
    for (const l of lines) {
      const c = l.split(","); const g = (k: string) => c[head.indexOf(k)]?.trim();
      const email = g("email"); if (!email) continue;
      try { await createMember({ data: { full_name: g("name") || email, email, phone: g("mobile") || g("phone"), city: g("city"), plan: g("plan"), password: `Jk@${Math.random().toString(36).slice(2, 10)}` } }); ok++; }
      catch (e: any) { toast.error(`${email}: ${e.message}`); }
    }
    toast.success(`Imported ${ok} member(s)`); refresh("profiles");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-serif text-3xl font-bold text-navy">Members</h1><div className="text-sm text-muted-foreground">Dashboard › Members</div></div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} title="CSV columns: name,email,mobile,city,plan"><Upload className="mr-1 h-4 w-4" /> Import Members</Button>
          <Button className="bg-navy text-white" onClick={() => setAdding(true)}><Plus className="mr-1 h-4 w-4" /> Add New Member</Button>
        </div>
      </div>

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2"><label className="text-xs font-semibold">Search Member</label>
            <div className="relative mt-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" placeholder="Search by name, mobile, email or member ID..." /></div></div>
          <div><label className="text-xs font-semibold">Membership Plan</label>
            <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Plans</SelectItem>{(plans.data ?? []).map((p: any) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}<SelectItem value="None">No plan</SelectItem></SelectContent></Select></div>
          <div><label className="text-xs font-semibold">Status</label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div><label className="text-xs font-semibold">Join Date</label>
            <Popover><PopoverTrigger asChild>
              <Button variant="outline" className="mt-1 w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />
                {range?.from ? `${fmtDate(range.from.toISOString())}${range.to ? " – " + fmtDate(range.to.toISOString()) : ""}` : <span className="text-muted-foreground">Any date</span>}</Button>
            </PopoverTrigger><PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={range} onSelect={(r) => { setRange(r); setPage(1); }} numberOfMonths={2} className="pointer-events-auto p-3" />
            </PopoverContent></Popover></div>
        </div>
        <div className="mt-3 flex gap-2"><Button variant="ghost" size="sm" className="text-blue-600" onClick={reset}>Reset</Button></div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm"><span className="font-semibold text-blue-600">Total Members:</span> {rows.length}</div>
          <div className="flex gap-2">
            {sel.length > 0 && <>
              <Button size="sm" variant="outline" onClick={() => update(sel, { status: "Active" }, "Activated")}>Activate ({sel.length})</Button>
              <Button size="sm" variant="outline" onClick={() => update(sel, { status: "Inactive" }, "Deactivated")}>Deactivate</Button>
            </>}
            <Button variant="outline" size="sm" onClick={() => exportRows(sel.length ? rows.filter((r: any) => sel.includes(r.id)) : rows)}><Download className="mr-1 h-4 w-4" /> Export</Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1500px] text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr className="border-b">
              <th className="py-2 pr-3"><input type="checkbox" checked={shown.length > 0 && shown.every((m: any) => sel.includes(m.id))} onChange={(e) => setSel(e.target.checked ? shown.map((m: any) => m.id) : [])} /></th>
              <th className="py-2 pr-4">Member ID</th><th className="pr-4">Member Name</th><th className="pr-4">Mobile Number</th><th className="pr-4">Email / Status</th><th className="pr-4">Referred By</th><th className="pr-4">City</th><th className="pr-4">Plan</th><th className="pr-4">Referrals</th><th className="pr-4">Earned</th><th className="pr-4">Withdrawals</th><th className="pr-4">Join Date</th><th className="pr-4">Action</th></tr></thead>
            <tbody>
              {profiles.isLoading && <tr><td colSpan={13} className="py-6 text-center text-muted-foreground">Loading…</td></tr>}
              {!profiles.isLoading && !shown.length && <tr><td colSpan={13} className="py-6 text-center text-muted-foreground">No members found</td></tr>}
              {shown.map((m: any) => {
                const active = m.status === "Active";
                return (
                <tr key={m.id} className="whitespace-nowrap border-b hover:bg-muted/30">
                  <td className="py-4 pr-3"><input type="checkbox" checked={sel.includes(m.id)} onChange={(e) => setSel(e.target.checked ? [...sel, m.id] : sel.filter((x) => x !== m.id))} /></td>
                  <td className="font-mono text-xs">{m.member_code}</td>
                  <td><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-bold text-white">{(m.full_name || m.email || "?")[0].toUpperCase()}</div><span className="font-medium text-navy">{m.full_name || "—"}</span></div></td>
                  <td>{m.phone || "—"}</td>
                  <td className="pr-4">
                    <div className="flex items-center gap-2">
                      <span>{m.email}</span>
                      <button onClick={() => update([m.id], { status: active ? "Inactive" : "Active" }, active ? "Deactivated" : "Activated")} title="Click to toggle"
                        className={active ? "text-emerald-600" : "text-rose-600"}>● {m.status}</button>
                    </div>
                  </td><td>{referrerLabel(m.id) || <span className="text-muted-foreground">—</span>}</td><td>{m.city || "—"}</td>
                  <td>{m.plan ? <Badge className={planColor[m.plan] ?? "bg-muted text-foreground"}>{m.plan}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                  <td>{summaries[m.id]?.referrals ?? 0}</td><td>{inr(summaries[m.id]?.earned ?? 0)}</td>
                  <td><div>{inr(summaries[m.id]?.withdrawn ?? 0)}</div>{(summaries[m.id]?.pending ?? 0) > 0 && <div className="text-xs text-muted-foreground">{inr(summaries[m.id]?.pending)} pending</div>}</td>
                  <td>{fmtDate(m.created_at)}</td>
                  <td><div className="flex gap-2">
                    <button className="text-blue-600" onClick={() => setView(m)} aria-label="View"><Eye className="h-4 w-4" /></button>
                    <button className="text-amber-600" onClick={() => setEdit({ ...m })} aria-label="Edit"><Edit className="h-4 w-4" /></button>
                    <DropdownMenu><DropdownMenuTrigger className="text-muted-foreground" aria-label="More"><MoreVertical className="h-4 w-4" /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setView(m)}>View details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEdit({ ...m })}>Edit member</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={async () => {
                          if (!confirm(`Delete ${m.full_name || m.email}? This permanently removes the account and its saved records.`)) return;
                          try {
                            await deleteMemberAccount({ data: { userId: m.id } });
                            toast.success("Member and associated records deleted");
                            refresh("profiles", "user_roles", "payments", "wallet_transactions", "withdrawals", "referrals", "bookings", "documents", "holiday_requests", "notifications", "support_tickets");
                          } catch (e: any) { toast.error(e?.message ?? "Could not delete member"); }
                        }}>Delete member</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {STATUSES.filter((s) => s !== m.status).map((s) => <DropdownMenuItem key={s} onClick={() => update([m.id], { status: s }, `Marked ${s}`)}>Mark {s}</DropdownMenuItem>)}
                        <DropdownMenuSeparator />
                        {(plans.data ?? []).filter((p: any) => p.name !== m.plan).map((p: any) => <DropdownMenuItem key={p.name} onClick={() => update([m.id], { plan: p.name }, `Plan set to ${p.name}`)}>Change plan to {p.name}</DropdownMenuItem>)}
                        <DropdownMenuSeparator />
                        {m.email && <DropdownMenuItem onClick={() => (window.location.href = `mailto:${m.email}`)}>Send email</DropdownMenuItem>}
                        {m.phone && <DropdownMenuItem onClick={() => window.open(`https://wa.me/${String(m.phone).replace(/\D/g, "")}`, "_blank")}>WhatsApp</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => exportRows([m])}>Export row</DropdownMenuItem>
                      </DropdownMenuContent></DropdownMenu>
                  </div></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">Showing {rows.length ? (page - 1) * PAGE + 1 : 0} to {Math.min(page * PAGE, rows.length)} of {rows.length} entries</div>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="grid h-8 w-8 place-items-center rounded border text-xs disabled:opacity-40">‹</button>
            {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`grid h-8 w-8 place-items-center rounded border text-xs ${p === page ? "bg-navy text-white" : ""}`}>{p}</button>))}
            <button disabled={page === pages} onClick={() => setPage(page + 1)} className="grid h-8 w-8 place-items-center rounded border text-xs disabled:opacity-40">›</button>
          </div>
        </div>
      </Card>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{view?.full_name}</DialogTitle></DialogHeader>
          {view && <dl className="grid grid-cols-2 gap-2 text-sm">
            {[["Member ID", view.member_code], ["Email", view.email], ["Mobile", view.phone], ["City", view.city], ["Plan", view.plan], ["Status", view.status],
              ["Referred By", referrerLabel(view.id)], ["Joined", fmtDate(view.created_at)], ["Membership", `${fmtDate(view.membership_start)} – ${fmtDate(view.membership_end)}`], ["Nights", `${view.nights_used} used / ${view.nights_total}`]]
              .map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>)}
          </dl>}
          {view && <MemberHistory userId={view.id} profilesById={profilesById} />}
          {view && <PasswordBox userId={view.id} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit member</DialogTitle></DialogHeader>
          {edit && <div className="grid gap-3">
            <Input placeholder="Full name" value={edit.full_name ?? ""} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} />
            <Input type="email" placeholder="Email address" value={edit.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            <Input placeholder="Mobile" value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
            <Input placeholder="City" value={edit.city ?? ""} onChange={(e) => setEdit({ ...edit, city: e.target.value })} />
            <Select value={edit.plan ?? "none"} onValueChange={(v) => setEdit({ ...edit, plan: v === "none" ? null : v })}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">No plan</SelectItem>{(plans.data ?? []).map((p: any) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select>
            <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v })}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Start<Input type="date" value={edit.membership_start ?? ""} onChange={(e) => setEdit({ ...edit, membership_start: e.target.value || null })} /></label>
              <label className="text-xs">End<Input type="date" value={edit.membership_end ?? ""} onChange={(e) => setEdit({ ...edit, membership_end: e.target.value || null })} /></label>
              <label className="text-xs">Nights total<Input type="number" value={edit.nights_total} onChange={(e) => setEdit({ ...edit, nights_total: +e.target.value })} /></label>
              <label className="text-xs">Nights used<Input type="number" value={edit.nights_used} onChange={(e) => setEdit({ ...edit, nights_used: +e.target.value })} /></label>
            </div>
          </div>}
          <DialogFooter><Button className="bg-navy text-white" disabled={editBusy} onClick={async () => {
            if (!edit) return;
            setEditBusy(true);
            try {
              await saveMember({ data: {
                userId: edit.id, full_name: edit.full_name, email: edit.email, phone: edit.phone || null, city: edit.city || null,
                plan: edit.plan || null, status: edit.status, membership_start: edit.membership_start || null,
                membership_end: edit.membership_end || null, nights_total: Number(edit.nights_total), nights_used: Number(edit.nights_used),
              } });
              toast.success("Member saved"); setEdit(null); refresh("profiles");
            } catch (e: any) { toast.error(e?.message ?? "Could not save member"); }
            finally { setEditBusy(false); }
          }}>{editBusy ? "Saving…" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AddMember open={adding} onClose={() => setAdding(false)} plans={(plans.data ?? []).map((p: any) => p.name)} onDone={() => refresh("profiles")} />
    </div>
  );
}

function AddMember({ open, onClose, plans, onDone }: { open: boolean; onClose: () => void; plans: string[]; onDone: () => void }) {
  const [f, setF] = useState({ full_name: "", email: "", phone: "", city: "", password: "", plan: "" });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await createMember({ data: f }); toast.success("Member added — they can sign in with this email and password"); onDone(); onClose(); setF({ full_name: "", email: "", phone: "", city: "", password: "", plan: "" }); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent><DialogHeader><DialogTitle>Add new member</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
          <Input placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Input placeholder="Mobile" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          <Input placeholder="Temporary password (8+ chars)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <Select value={f.plan || "none"} onValueChange={(v) => setF({ ...f, plan: v === "none" ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">No plan yet</SelectItem>{plans.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
        </div>
        <DialogFooter><Button disabled={busy} className="bg-navy text-white" onClick={submit}>{busy ? "Adding…" : "Add member"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordBox({ userId }: { userId: string }) {
  const changePassword = setMemberPassword;
  const refresh = useRefresh();
  const known = useRows(["admin-known-password", userId], () => db.from("admin_known_passwords").select("password, updated_at").eq("user_id", userId).maybeSingle());
  const current = (known.data as any)?.password as string | null | undefined;
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await changePassword({ data: { userId, password: pw } }); toast.success("Password changed"); setPw(""); refresh("admin-known-password"); }
    catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };
  return (
    <div className="mt-2 rounded-lg border p-3">
      <div className="text-xs font-semibold text-navy">Password</div>
      {known.isLoading ? (
        <p className="text-[11px] text-muted-foreground">Checking saved password…</p>
      ) : current ? (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-xs font-semibold">{show ? current : "•".repeat(Math.max(current.length, 8))}</code>
          <Button type="button" variant="outline" size="sm" onClick={() => setShow(!show)}>{show ? "Hide" : "Show password"}</Button>
          <span className="text-[11px] text-muted-foreground">Last password set from the admin panel{(known.data as any)?.updated_at ? ` on ${fmtDate((known.data as any).updated_at)}` : ""}.</span>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">No recorded password yet — passwords members choose themselves stay private. Set one below and it will show here.</p>
      )}
      <div className="mt-2 flex gap-2">
        <Input type={show ? "text" : "password"} placeholder="New password (min 6)" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button disabled={busy || pw.length < 6} size="sm" className="bg-navy text-white" onClick={save}>{busy ? "Saving…" : "Change"}</Button>
      </div>
    </div>
  );
}

function MemberHistory({ userId, profilesById }: { userId: string; profilesById: Record<string, any> }) {
  const refresh = useRefresh();
  const pay = useRows(["payments", userId], () => db.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }));
  const tx = useRows(["wallet_transactions", userId], () => db.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }));
  const bk = useRows(["bookings", userId], () => db.from("bookings").select("*").eq("user_id", userId).order("check_in", { ascending: false }));
  const refs = useRows(["member-referrals", userId], () => db.from("referrals").select("*").eq("user_id", userId).order("created_at", { ascending: false }));
  const withdrawals = useRows(["member-withdrawals", userId], () => db.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }));
  const [edit, setEdit] = useState<{ table: "referrals" | "wallet_transactions" | "withdrawals"; row: any } | null>(null);
  const [busy, setBusy] = useState(false);

  const saveEdit = async (patch: Record<string, unknown>) => {
    if (!edit) return;
    setBusy(true);
    const { error } = await db.from(edit.table).update(patch).eq("id", edit.row.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Record updated");
    setEdit(null);
    refresh("referrals", "member-referrals", "member-referral-summary", "wallet_transactions", "member-wallet-summary", "withdrawals", "member-withdrawals", "member-withdrawal-summary");
  };

  const removeRow = async () => {
    if (!edit) return;
    setBusy(true);
    const { error } = await db.from(edit.table).delete().eq("id", edit.row.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Record deleted");
    setEdit(null);
    refresh("referrals", "member-referrals", "member-referral-summary", "wallet_transactions", "member-wallet-summary", "withdrawals", "member-withdrawals", "member-withdrawal-summary");
  };

  const Section = ({ title, rows, table, render }: { title: string; rows: any[]; table?: "referrals" | "wallet_transactions" | "withdrawals"; render: (r: any) => React.ReactNode }) => (
    <div className="mt-4">
      <div className="text-xs font-semibold text-navy">{title} ({rows.length})</div>
      {rows.length === 0 ? <div className="mt-1 text-xs text-muted-foreground">None yet</div> :
        <div className="mt-1 divide-y rounded-md border text-xs">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-2">
              {render(r)}
              {table && <span className="ml-auto flex shrink-0 gap-1">
                <button className="text-amber-600" aria-label={`Edit ${title}`} onClick={() => setEdit({ table, row: { ...r } })}><Edit className="h-3.5 w-3.5" /></button>
              </span>}
            </div>
          ))}
        </div>}
    </div>
  );
  return (
    <div>
      <Section title="Referrals" table="referrals" rows={refs.data ?? []} render={(r) => <><span>{r.friend_name} · {r.referred_user_id ? `Member ${profilesById[r.referred_user_id]?.member_code ?? r.referred_user_id.slice(0, 8)}` : r.friend_phone}</span><span className="font-semibold">{r.status}{r.reward_amount != null ? ` · ${inr(r.reward_amount)}` : ""}</span></>} />
      <Section title="Wallet transactions (editable)" table="wallet_transactions" rows={tx.data ?? []} render={(r) => <><span>{fmtDate(r.created_at)} · {r.description}</span><span className="font-semibold">{r.type} {inr(r.amount)}</span></>} />
      <Section title="Withdrawals (editable)" table="withdrawals" rows={withdrawals.data ?? []} render={(r) => <><span>{fmtDate(r.created_at)} · {r.method} · {inr(r.amount)}</span><span className="font-semibold">{r.status}{r.remarks ? ` · ${r.remarks}` : ""}</span></>} />
      <Section title="Payments & membership requests" rows={pay.data ?? []} render={(r) => <><span>{fmtDate(r.created_at)} · {r.plan_slug} · {r.method}{r.reference ? ` · Ref ${r.reference}` : ""}</span><span className="font-semibold">{inr(r.amount)} · {r.status}</span></>} />
      <Section title="Bookings" rows={bk.data ?? []} render={(r) => <><span>{r.destination} · {fmtDate(r.check_in)} – {fmtDate(r.check_out)}</span><span className="font-semibold">{r.nights} nights · {r.status}</span></>} />

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit record</DialogTitle></DialogHeader>
          {edit?.table === "referrals" && <ReferralForm row={edit.row} busy={busy} onSave={saveEdit} />}
          {edit?.table === "wallet_transactions" && <WalletForm row={edit.row} busy={busy} onSave={saveEdit} />}
          {edit?.table === "withdrawals" && <WithdrawalForm row={edit.row} busy={busy} onSave={saveEdit} />}
          <DialogFooter className="flex-row justify-between">
            <Button variant="outline" className="text-destructive" disabled={busy} onClick={removeRow}><Trash2 className="mr-1 h-4 w-4" /> Delete record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const REFERRAL_STATUSES = ["Pending", "Approved", "Rewarded", "Rejected"];
function ReferralForm({ row, busy, onSave }: { row: any; busy: boolean; onSave: (patch: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ friend_name: row.friend_name ?? "", friend_phone: row.friend_phone ?? "", status: row.status ?? "Pending", reward: row.reward_amount != null ? String(row.reward_amount) : "" });
  return <div className="grid gap-2">
    <Input placeholder="Friend name" value={f.friend_name} onChange={(e) => setF({ ...f, friend_name: e.target.value })} />
    <Input placeholder="Friend phone" value={f.friend_phone} onChange={(e) => setF({ ...f, friend_phone: e.target.value })} />
    <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{REFERRAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
    <Input type="number" placeholder="Reward amount (blank = none)" value={f.reward} onChange={(e) => setF({ ...f, reward: e.target.value })} />
    <Button disabled={busy} className="bg-navy text-white" onClick={() => onSave({ friend_name: f.friend_name.trim(), friend_phone: f.friend_phone.trim(), status: f.status, reward_amount: f.reward === "" ? null : Number(f.reward) })}>{busy ? "Saving…" : "Save referral"}</Button>
  </div>;
}

function WalletForm({ row, busy, onSave }: { row: any; busy: boolean; onSave: (patch: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ type: /^debit$/i.test(row.type) ? "Debit" : "Credit", amount: String(row.amount ?? ""), description: row.description ?? "" });
  return <div className="grid gap-2">
    <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}><SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="Credit">Credit (adds to wallet)</SelectItem><SelectItem value="Debit">Debit (deducts from wallet)</SelectItem></SelectContent></Select>
    <Input type="number" min="0" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
    <Input placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
    <Button disabled={busy || !(Number(f.amount) > 0)} className="bg-navy text-white" onClick={() => onSave({ type: f.type, amount: Number(f.amount), description: f.description.trim() })}>{busy ? "Saving…" : "Save transaction"}</Button>
  </div>;
}

const WITHDRAWAL_STATUSES = ["Pending", "Approved", "Rejected", "Paid"];
function WithdrawalForm({ row, busy, onSave }: { row: any; busy: boolean; onSave: (patch: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ amount: String(row.amount ?? ""), status: WITHDRAWAL_STATUSES.includes(row.status) ? row.status : "Pending", remarks: row.remarks ?? "" });
  return <div className="grid gap-2">
    <Input type="number" min="0" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
    <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{WITHDRAWAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
    <Input placeholder="Remarks" value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} />
    <Button disabled={busy || !(Number(f.amount) > 0)} className="bg-navy text-white" onClick={() => onSave({ amount: Number(f.amount), status: f.status, remarks: f.remarks.trim() || null })}>{busy ? "Saving…" : "Save withdrawal"}</Button>
  </div>;
}
