import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, useProfilesMap, useRefresh, useRows } from "@/lib/data";

export const Route = createFileRoute("/admin/bookings")({ component: Bookings });

const tones: Record<string, string> = { Confirmed: "bg-emerald-500", Pending: "bg-amber-500", "Check-out": "bg-blue-500", Blocked: "bg-rose-500" };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
type Form = { id?: string; client_name: string; client_email: string; client_mobile: string; destination: string; resort: string; check_in: string; check_out: string; status: string; notes: string };

function Bookings() {
  const q = useRows<any>("bookings", () => db.from("bookings").select("*").order("check_in"));
  const { map } = useProfilesMap();
  const refresh = useRefresh();
  const [cur, setCur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [resort, setResort] = useState("All");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const rows = q.data ?? [];
  const resorts = Array.from(new Set(rows.map((b) => b.resort || b.destination).filter(Boolean)));
  const visible = rows.filter((b) => resort === "All" || (b.resort || b.destination) === resort);
  const startDay = cur.getDay();
  const days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startDay + days) / 7) * 7 });

  const openNew = (date: string) => setForm({ client_name: "", client_email: "", client_mobile: "", destination: "", resort: "", check_in: date, check_out: date, status: "Pending", notes: "" });
  const openEdit = (b: any) => setForm({ id: b.id, client_name: b.client_name ?? map[b.user_id]?.full_name ?? "", client_email: b.client_email ?? "", client_mobile: b.client_mobile ?? "", destination: b.destination, resort: b.resort ?? "", check_in: b.check_in, check_out: b.check_out, status: b.status, notes: b.notes ?? "" });

  const save = async () => {
    if (!form) return;
    if (!form.client_name.trim() || !form.destination.trim()) return toast.error("Client name and destination are required");
    if (form.check_out < form.check_in) return toast.error("End date must be after start date");
    const nights = Math.max(1, Math.round((+new Date(form.check_out) - +new Date(form.check_in)) / 86400000));
    const payload = { client_name: form.client_name.trim(), client_email: form.client_email.trim() || null, client_mobile: form.client_mobile.trim() || null, destination: form.destination.trim(), resort: form.resort.trim() || null, check_in: form.check_in, check_out: form.check_out, status: form.status, notes: form.notes.trim() || null, nights };
    setSaving(true);
    const { error } = form.id ? await db.from("bookings").update(payload).eq("id", form.id) : await db.from("bookings").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Booking saved"); setForm(null); refresh("bookings");
  };
  const remove = async () => {
    if (!form?.id || !confirm("Delete this booking?")) return;
    const { error } = await db.from("bookings").delete().eq("id", form.id);
    if (error) return toast.error(error.message);
    toast.success("Booking deleted"); setForm(null); refresh("bookings");
  };
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => f && { ...f, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-serif text-3xl font-bold text-navy">Calendar View</h1><p className="text-sm text-muted-foreground">Schedule bookings, add client details and track status. Click any date to add a booking.</p></div>
        <Button className="bg-navy text-primary-foreground" onClick={() => openNew(iso(new Date()))}><Plus className="mr-1 h-4 w-4" /> New booking</Button>
      </div>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="w-40 text-center font-serif text-lg font-bold text-navy">{cur.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
            <Button variant="outline" size="icon" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <select value={resort} onChange={(e) => setResort(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="All">All Resorts</option>
            {resorts.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="mt-5 grid grid-cols-7 gap-1 text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="p-2 text-center font-semibold text-muted-foreground">{d}</div>)}
          {cells.map((_, i) => {
            const day = i - startDay + 1;
            if (day < 1 || day > days) return <div key={i} className="min-h-24 rounded border bg-muted/30" />;
            const date = iso(new Date(cur.getFullYear(), cur.getMonth(), day));
            const items = visible.filter((b) => b.check_in <= date && b.check_out >= date);
            return (
              <div key={i} onClick={() => openNew(date)} className="min-h-24 cursor-pointer rounded border bg-card p-1.5 hover:border-gold">
                <div className="font-semibold text-navy">{day}</div>
                {items.slice(0, 3).map((b) => (
                  <div key={b.id} onClick={(e) => { e.stopPropagation(); openEdit(b); }}
                    className={`mt-1 truncate rounded px-1 py-0.5 text-[10px] text-primary-foreground ${tones[b.status] ?? "bg-slate-500"}`}>
                    {(b.client_name || map[b.user_id]?.full_name || "Guest")} – {b.resort || b.destination}
                  </div>
                ))}
                {items.length > 3 && <div className="mt-1 text-[10px] text-muted-foreground">+{items.length - 3} more</div>}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          {Object.entries(tones).map(([l, t]) => <div key={l} className="flex items-center gap-1"><span className={`h-3 w-3 rounded-full ${t}`} />{l}</div>)}
        </div>
      </Card>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{form?.id ? "Edit booking" : "Schedule booking"}</DialogTitle><DialogDescription>Enter client details and set status.</DialogDescription></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div><Label>Client name *</Label><Input value={form.client_name} onChange={set("client_name")} maxLength={100} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={form.client_email} onChange={set("client_email")} maxLength={255} /></div>
                <div><Label>Mobile</Label><Input value={form.client_mobile} onChange={set("client_mobile")} maxLength={20} /></div>
                <div><Label>Destination *</Label><Input value={form.destination} onChange={set("destination")} maxLength={100} /></div>
                <div><Label>Resort</Label><Input value={form.resort} onChange={set("resort")} maxLength={100} /></div>
                <div><Label>Start date *</Label><Input type="date" value={form.check_in} onChange={set("check_in")} /></div>
                <div><Label>End date *</Label><Input type="date" value={form.check_out} onChange={set("check_out")} /></div>
              </div>
              <div><Label>Status</Label>
                <select value={form.status} onChange={set("status")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {Object.keys(tones).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={set("notes")} maxLength={1000} /></div>
              <div className="flex justify-end gap-2 pt-2">
                {form.id && <Button variant="destructive" className="mr-auto" onClick={remove}>Delete</Button>}
                <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
                <Button className="bg-navy text-primary-foreground" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save booking"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
