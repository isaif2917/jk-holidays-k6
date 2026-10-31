import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { AlertTriangle, Check, Plus, Trash2, Eye, CalendarCheck, CalendarX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RequestThread } from "@/components/RequestThread";
import { useSiteDestinations } from "@/lib/catalog";
import { db, fmtDate, fmtDateTime, useMe, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/request")({ head: () => createRouteHead("Request a Holiday — JK Holidays", "Submit and track a holiday request with JK Holidays."), component: RequestFlow });

const steps = ["Travel Details", "Traveller Details", "Additional Info", "Review & Submit", "Request Status"];

type Traveller = { name: string; age: string; gender: string; mobile: string; idType: string; idNumber: string };
const emptyTraveller = (): Traveller => ({ name: "", age: "", gender: "Male", mobile: "", idType: "Aadhar", idNumber: "" });

/** alt_dates is stored as "YYYY-MM-DD|YYYY-MM-DD" when the admin proposes alternate dates. */
const altLabel = (alt: string | null) => {
  const m = /^(\d{4}-\d{2}-\d{2})\|(\d{4}-\d{2}-\d{2})$/.exec(alt ?? "");
  if (!m) return alt ?? "";
  return `${fmtDate(m[1])} – ${fmtDate(m[2])}`;
};

function RequestFlow() {
  const { data: me } = useMe();
  const p = me?.profile ?? {};
  /** Holiday requests require an active (paid) membership plan. */
  const activeMember = !!(p.status === "Active" && p.plan);
  const refresh = useRefresh();
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<"All" | "Pending" | "Accepted" | "Rejected">("All");
  const [travel, setTravel] = useState({ destination: "", resort: "", checkIn: "", checkOut: "", rooms: "1", arrival: "", departure: "" });
  const [travellers, setTravellers] = useState<Traveller[]>([emptyTraveller()]);
  const [extras, setExtras] = useState({ airportPickup: "No", sightseeing: "No", mealPreference: "Vegetarian", special: "" });
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const requests = useRows("holiday_requests", () => db.from("holiday_requests").select("*").eq("user_id", me!.user.id).order("created_at", { ascending: false }), !!me?.user.id);

  const nights = useMemo(() => {
    if (!travel.checkIn || !travel.checkOut) return 0;
    const d = Math.round((new Date(travel.checkOut).getTime() - new Date(travel.checkIn).getTime()) / 86400000);
    return d > 0 ? d : 0;
  }, [travel.checkIn, travel.checkOut]);

  const setT = (i: number, patch: Partial<Traveller>) => setTravellers((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  /** Member decides on the alternate dates proposed by the admin team. */
  const decideAlt = async (decision: "Accepted" | "Rejected") => {
    if (!detail) return;
    const at = new Date().toISOString();
    const { error } = await db.from("holiday_requests").update({ alt_decision: decision, alt_decided_at: at }).eq("id", detail.id);
    if (error) return toast.error(error.message);
    setDetail({ ...detail, alt_decision: decision, alt_decided_at: at });
    refresh("holiday_requests");
    toast.success(decision === "Accepted" ? "Thank you — our team will confirm the new dates." : "Noted — we will keep your original dates.");
  };

  const validate = () => {
    if (!travel.destination.trim()) return "Please enter your preferred destination.";
    if (!travel.checkIn || !travel.checkOut) return "Please choose check-in and check-out dates.";
    if (nights < 1) return "Check-out must be after check-in.";
    if (!travellers[0]?.name.trim()) return "Please add at least one traveller name.";
    return null;
  };

  const submit = async () => {
    if (!me?.user.id) return toast.error("Sign in to submit a request.");
    const problem = validate();
    if (problem) return toast.error(problem);
    setSubmitting(true);
    const { error } = await db.from("holiday_requests").insert({
      user_id: me.user.id,
      destination: travel.destination.trim(),
      resort: travel.resort.trim() || null,
      check_in: travel.checkIn,
      check_out: travel.checkOut,
      nights,
      rooms: Math.max(1, parseInt(travel.rooms || "1", 10) || 1),
      travellers: travellers.filter((t) => t.name.trim()).map((t) => ({ name: t.name.trim(), age: parseInt(t.age, 10) || null, gender: t.gender, mobile: t.mobile.trim(), id_type: t.idType, id_number: t.idNumber.trim() })),
      extras: { arrival_time: travel.arrival, departure_time: travel.departure, airport_pickup: extras.airportPickup, sightseeing: extras.sightseeing, meal_preference: extras.mealPreference },
      special_requests: extras.special.trim() || null,
      status: "Pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Request submitted — our team will confirm shortly.");
    refresh("holiday_requests");
    setStep(4);
  };

  const rows = (requests.data ?? []);
  const filtered = tab === "All" ? rows : rows.filter((r: any) => r.status === (tab === "Accepted" ? "Approved" : tab));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">Request Holiday</h1>
        <div className="text-sm text-muted-foreground">Book your next getaway in a few simple steps.</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="p-4">
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={s}>
                <button onClick={() => setStep(i)} className={`flex w-full items-center gap-3 rounded-md p-2 text-left text-sm ${step === i ? "bg-navy text-white" : "hover:bg-muted"}`}>
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${step === i ? "bg-gold text-navy" : step > i ? "bg-emerald-500 text-white" : "bg-muted"}`}>
                    {step > i ? "✓" : i + 1}
                  </span>
                  <span className="truncate">{s}</span>
                </button>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          {step === 0 && <TravelDetails travel={travel} setTravel={setTravel} nights={nights} onNext={() => { const p = !travel.destination.trim() ? "Please enter your preferred destination." : !travel.checkIn || !travel.checkOut || nights < 1 ? "Please choose valid check-in and check-out dates." : null; if (p) return toast.error(p); setStep(1); }} />}
          {step === 1 && <TravellerDetails travellers={travellers} setTravellers={setTravellers} setT={setT} onBack={() => setStep(0)} onNext={() => { if (!travellers.some((t) => t.name.trim())) return toast.error("Add at least one traveller name."); setStep(2); }} />}
          {step === 2 && <AdditionalInfo extras={extras} setExtras={setExtras} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <ReviewSubmit travel={travel} travellers={travellers} extras={extras} nights={nights} onBack={() => setStep(2)} submitting={submitting} onSubmit={submit} />}
          {step === 4 && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-navy">My Requests</h2>
                <Button size="sm" className="bg-gold-gradient font-bold text-navy-deep" onClick={() => setStep(0)}>REQUEST HOLIDAY</Button>
              </div>
              <div className="mt-4 flex gap-2 border-b">
                {(["All", "Pending", "Accepted", "Rejected"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-gold font-semibold text-navy" : "text-muted-foreground"}`}>{t}</button>
                ))}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b"><th className="py-2">Request ID</th><th>Destination</th><th>Travel Dates</th><th>Nights</th><th>Status</th><th>Requested On</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((r: any) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-3 font-medium text-navy">{r.code}</td>
                        <td>{r.destination}</td>
                        <td>{fmtDate(r.check_in)} – {fmtDate(r.check_out)}</td>
                        <td>{r.nights}</td>
                        <td><StatusBadge s={r.status} /></td>
                        <td>{fmtDate(r.created_at)}</td>
                        <td><button onClick={() => setDetail(r)} aria-label={`View request ${r.code}`} className="text-blue-600"><Eye className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                    {!filtered.length && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">{requests.isLoading ? "Loading…" : "No requests yet. Submit your first holiday request."}</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">Every request you submit appears instantly in the admin team's Holiday Requests queue.</div>
              {detail && (
                <Dialog open onOpenChange={(o) => { if (!o) setDetail(null); }}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-navy">Request {detail.code}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-md bg-muted p-3">
                        <span className="font-semibold text-navy">Status</span>
                        <span className={detail.status === "Approved" ? "font-bold text-emerald-600" : detail.status === "Rejected" ? "font-bold text-rose-600" : "font-bold text-amber-600"}>
                          {detail.status === "Approved" ? "Accepted" : detail.status === "Rejected" ? "Rejected" : "Pending review"}
                        </span>
                      </div>
                      {detail.admin_action_at && (
                        <div className="text-xs text-muted-foreground">
                          Our team {detail.status === "Approved" ? "accepted" : "rejected"} this request on {fmtDateTime(detail.admin_action_at)}
                        </div>
                      )}
                      <div className="rounded-md bg-muted p-3">
                        <div className="font-semibold text-navy">Dates</div>
                        {detail.status === "Approved" && detail.alt_dates ? (
                          <>
                            <div className="mt-1 font-semibold text-rose-600">Approved dates: {altLabel(detail.alt_dates)}</div>
                            <div className="text-xs text-muted-foreground line-through">{fmtDate(detail.check_in)} – {fmtDate(detail.check_out)} (originally requested)</div>
                          </>
                        ) : (
                          <div className="mt-1 text-muted-foreground">{fmtDate(detail.check_in)} – {fmtDate(detail.check_out)}</div>
                        )}
                        {detail.alt_dates && detail.status !== "Approved" && (
                          <div className="mt-1 font-semibold text-rose-600">Alternate dates proposed: {altLabel(detail.alt_dates)}</div>
                        )}
                      </div>
                      <div className="rounded-md bg-muted p-3">
                        <div className="font-semibold text-navy">Request</div>
                        <div className="mt-1 text-muted-foreground">{detail.destination}{detail.resort ? ` · ${detail.resort}` : ""} · {detail.nights} night(s) · {detail.rooms} room(s)</div>
                        {detail.special_requests && <div className="text-muted-foreground">Special: {detail.special_requests}</div>}
                        <div className="mt-1 text-muted-foreground">Requested on: {fmtDateTime(detail.created_at)}</div>
                        {detail.admin_note && <div className="text-muted-foreground">Note from our team: {detail.admin_note}</div>}
                      </div>
                      {detail.alt_dates && (
                        !detail.alt_decision ? (
                          <div className="rounded-md border border-gold bg-gold-soft/40 p-3 text-sm">
                            <div className="font-semibold text-navy">Our team proposed alternate dates</div>
                            <div className="mt-1 font-semibold text-rose-600">{altLabel(detail.alt_dates)}</div>
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" disabled={submitting} className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => decideAlt("Accepted")}><CalendarCheck className="mr-1 h-4 w-4" /> Accept new dates</Button>
                              <Button size="sm" disabled={submitting} variant="outline" onClick={() => decideAlt("Rejected")}><CalendarX className="mr-1 h-4 w-4" /> Keep original dates</Button>
                            </div>
                          </div>
                        ) : (
                          <div className={`rounded-md p-3 text-sm font-semibold ${detail.alt_decision === "Accepted" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                            You {detail.alt_decision === "Accepted" ? "accepted" : "declined"} the proposed dates{detail.alt_decided_at ? ` on ${fmtDateTime(detail.alt_decided_at)}` : ""}
                          </div>
                        )
                      )}
                      {detail.status === "Approved" && !!detail.alt_dates && !detail.alt_decision && (
                        <div className="blink-alert rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-600">
                          Please discuss with customer support to verify the altered date
                        </div>
                      )}
                      <RequestThread requestId={detail.id} sender="member" className="rounded-md bg-muted p-3" />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-semibold text-navy">{label}</label><div className="mt-1">{children}</div></div>;
}

function TravelDetails({ travel, setTravel, nights, onNext }: { travel: any; setTravel: (t: any) => void; nights: number; onNext: () => void }) {
  return (

    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-navy">Travel Details</h2>
        <Badge className="bg-gold-soft/60 text-navy">{nights ? `${nights}N Stay` : "Pick your dates"}</Badge>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Preferred Destination *"><Input value={travel.destination} onChange={(e) => setTravel({ ...travel, destination: e.target.value })} placeholder="e.g. Goa" /></Field>
        <Field label="Preferred Resort (optional)"><Input value={travel.resort} onChange={(e) => setTravel({ ...travel, resort: e.target.value })} placeholder="e.g. Taj Holiday Resort, Goa" /></Field>
        <Field label="Check-in Date *"><Input type="date" value={travel.checkIn} onChange={(e) => setTravel({ ...travel, checkIn: e.target.value })} /></Field>
        <Field label="Check-out Date *"><Input type="date" value={travel.checkOut} onChange={(e) => setTravel({ ...travel, checkOut: e.target.value })} /></Field>
        <Field label="Number of Rooms"><Input type="number" min="1" value={travel.rooms} onChange={(e) => setTravel({ ...travel, rooms: e.target.value })} /></Field>
        <Field label="Arrival Time"><Input value={travel.arrival} onChange={(e) => setTravel({ ...travel, arrival: e.target.value })} placeholder="e.g. 10:00 AM" /></Field>
        <Field label="Departure Time"><Input value={travel.departure} onChange={(e) => setTravel({ ...travel, departure: e.target.value })} placeholder="e.g. 09:00 AM" /></Field>
      </div>
      <div className="mt-6 flex justify-end"><Button className="bg-gold-gradient font-bold text-navy-deep" onClick={onNext}>NEXT</Button></div>
    </div>
  );
}

function TravellerDetails({ travellers, setTravellers, setT, onBack, onNext }: any) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-navy">Traveller Details (Up to 4 Persons)</h2>
        <Badge className="bg-gold-soft/60 text-navy">Up to 4 Guests</Badge>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b"><th className="py-2">Person</th><th>Full Name</th><th>Age</th><th>Gender</th><th>Mobile</th><th>ID Type</th><th>ID Number</th><th></th></tr>
          </thead>
          <tbody>
            {travellers.map((r: Traveller, i: number) => (
              <tr key={i} className="border-b">
                <td className="py-2 font-semibold">{i + 1} Member</td>
                <td><Input value={r.name} onChange={(e) => setT(i, { name: e.target.value })} className="h-9" /></td>
                <td><Input value={r.age} onChange={(e) => setT(i, { age: e.target.value })} className="h-9 w-16" /></td>
                <td><Input value={r.gender} onChange={(e) => setT(i, { gender: e.target.value })} className="h-9 w-24" /></td>
                <td><Input value={r.mobile} onChange={(e) => setT(i, { mobile: e.target.value })} className="h-9" /></td>
                <td><Input value={r.idType} onChange={(e) => setT(i, { idType: e.target.value })} className="h-9 w-24" /></td>
                <td><Input value={r.idNumber} onChange={(e) => setT(i, { idNumber: e.target.value })} className="h-9" /></td>
                <td><button onClick={() => setTravellers(travellers.filter((_: Traveller, j: number) => j !== i))} className="text-rose-500"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {travellers.length < 4 && (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setTravellers([...travellers, emptyTraveller()])}>
          <Plus className="mr-1 h-4 w-4" /> Add Traveller
        </Button>
      )}
      <div className="mt-3 rounded-md bg-emerald-50 p-3 text-xs text-emerald-700">{travellers.filter((t: Traveller) => t.name.trim()).length} of 4 Guest Slots Used</div>
      <div className="mt-6 flex justify-between"><Button variant="outline" onClick={onBack}>BACK</Button><Button className="bg-gold-gradient font-bold text-navy-deep" onClick={onNext}>NEXT</Button></div>
    </div>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold text-navy">{label}</label>
      <div className="mt-1 flex gap-4">
        {(["Yes", "No"] as const).map((o) => (
          <label key={o} className="flex items-center gap-1 text-sm"><input type="radio" checked={value === o} onChange={() => onChange(o)} /> {o}</label>
        ))}
      </div>
    </div>
  );
}

function AdditionalInfo({ extras, setExtras, onBack, onNext }: any) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-navy">Additional Requirements</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <YesNo label="Airport Pickup" value={extras.airportPickup} onChange={(v) => setExtras({ ...extras, airportPickup: v })} />
        <YesNo label="Local Sightseeing" value={extras.sightseeing} onChange={(v) => setExtras({ ...extras, sightseeing: v })} />
      </div>
      <div className="mt-4">
        <label className="text-sm font-semibold text-navy">Meal Preference</label>
        <select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={extras.mealPreference} onChange={(e) => setExtras({ ...extras, mealPreference: e.target.value })}>
          {["Vegetarian", "Non-Vegetarian", "Jain", "No preference"].map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="mt-4">
        <label className="text-sm font-semibold text-navy">Special Requests (Optional)</label>
        <Textarea className="mt-1" rows={3} placeholder="Room on higher floor, near to lift if possible." value={extras.special} onChange={(e) => setExtras({ ...extras, special: e.target.value })} />
      </div>
      <div className="mt-6 flex justify-between"><Button variant="outline" onClick={onBack}>BACK</Button><Button className="bg-gold-gradient font-bold text-navy-deep" onClick={onNext}>NEXT</Button></div>
    </div>
  );
}

function ReviewSubmit({ travel, travellers, extras, nights, onBack, onSubmit, submitting }: any) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-navy">Review Your Request</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ReviewBlock title="Travel Details" rows={[
          ["Destination", travel.destination || "—"],
          ["Resort", travel.resort || "—"],
          ["Check-in Date", travel.checkIn ? `${fmtDate(travel.checkIn)}${travel.arrival ? ` (${travel.arrival})` : ""}` : "—"],
          ["Check-out Date", travel.checkOut ? `${fmtDate(travel.checkOut)}${travel.departure ? ` (${travel.departure})` : ""}` : "—"],
          ["Total Nights", `${nights} Night${nights === 1 ? "" : "s"}`], ["Rooms", travel.rooms || "1"],
          ["Airport Pickup", extras.airportPickup], ["Sightseeing", extras.sightseeing], ["Meal Preference", extras.mealPreference],
        ]} />
        <ReviewBlock title="Traveller Details" rows={travellers.filter((t: Traveller) => t.name.trim()).map((t: Traveller, i: number) => [`${i + 1}. ${t.name}`, `${t.age || "?"} Y, ${t.gender} | ${t.idType}: ${t.idNumber || "—"}`])} />
      </div>
      <div className="mt-4">
        <div className="text-sm font-semibold text-navy">Special Requests</div>
        <div className="text-sm text-muted-foreground">{extras.special || "—"}</div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> I confirm that all traveller details are accurate.</label>
      <div className="mt-6 flex justify-between"><Button variant="outline" onClick={onBack}>BACK</Button><Button disabled={submitting} className="bg-gold-gradient font-bold text-navy-deep" onClick={onSubmit}>{submitting ? "SUBMITTING…" : "SUBMIT HOLIDAY REQUEST"} <Check className="ml-2 h-4 w-4" /></Button></div>
    </div>
  );
}

function ReviewBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="font-semibold text-navy">{title}</div>
      <div className="mt-3 space-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium text-navy">{v}</span></div>
        ))}
      </div>
    </div>
  );
}
