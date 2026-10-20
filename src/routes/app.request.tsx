import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Plus, Trash2, Eye } from "lucide-react";
import { requests } from "@/data/mock";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/request")({ head: () => createRouteHead("Request a Holiday — JK Holidays", "Submit and track a holiday request with JK Holidays."), component: RequestFlow });

const steps = ["Travel Details", "Traveller Details", "Additional Info", "Review & Submit", "Request Status"];

function RequestFlow() {
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const filtered = tab === "All" ? requests : requests.filter((r) => r.status === tab);

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
          {step === 0 && <TravelDetails onNext={() => setStep(1)} />}
          {step === 1 && <TravellerDetails onBack={() => setStep(0)} onNext={() => setStep(2)} />}
          {step === 2 && <AdditionalInfo onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <ReviewSubmit onBack={() => setStep(2)} onSubmit={() => setStep(4)} />}
          {step === 4 && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-navy">My Requests</h2>
                <Button size="sm" className="bg-gold-gradient font-bold text-navy-deep" onClick={() => setStep(0)}>REQUEST HOLIDAY</Button>
              </div>
              <div className="mt-4 flex gap-2 border-b">
                {(["All", "Pending", "Approved", "Rejected"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-gold font-semibold text-navy" : "text-muted-foreground"}`}>{t}</button>
                ))}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b"><th className="py-2">Request ID</th><th>Destination</th><th>Travel Dates</th><th>Nights</th><th>Status</th><th>Requested On</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-3 font-medium text-navy">{r.id}</td>
                        <td>{r.dest}</td>
                        <td>{r.dates}</td>
                        <td>{r.nights}</td>
                        <td><StatusBadge s={r.status} /></td>
                        <td>{r.requested}</td>
                        <td><button className="text-blue-600"><Eye className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function StatusBadge({ s }: { s: "Pending" | "Approved" | "Rejected" | "Completed" }) {
  const map = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    Completed: "bg-blue-100 text-blue-700",
  } as const;
  return <Badge className={`${map[s]} hover:${map[s]}`}>{s === "Pending" ? "● " : ""}{s}</Badge>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-semibold text-navy">{label}</label><div className="mt-1">{children}</div></div>;
}

function TravelDetails({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-navy">Travel Details</h2>
        <Badge className="bg-gold-soft/60 text-navy">4N / 5D Remaining</Badge>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Preferred Destination *"><Input defaultValue="Goa" /></Field>
        <Field label="Preferred Resort *"><Input defaultValue="Taj Holiday Resort, Goa" /></Field>
        <Field label="Check-in Date *"><Input type="date" defaultValue="2026-06-15" /></Field>
        <Field label="Check-out Date *"><Input type="date" defaultValue="2026-06-19" /></Field>
        <Field label="Total Nights"><Input defaultValue="4 Nights / 5 Days" /></Field>
        <Field label="Number of Rooms"><Input defaultValue="1 Room" /></Field>
        <Field label="Arrival Time"><Input defaultValue="10:00 AM" /></Field>
        <Field label="Departure Time"><Input defaultValue="09:00 AM" /></Field>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <YesNo label="Airport Pickup" />
        <YesNo label="Local Sightseeing" />
      </div>
      <div className="mt-6 flex justify-end"><Button className="bg-gold-gradient font-bold text-navy-deep" onClick={onNext}>NEXT</Button></div>
    </div>
  );
}

function YesNo({ label }: { label: string }) {
  const [v, setV] = useState<"Yes" | "No">("No");
  return (
    <div>
      <label className="text-sm font-semibold text-navy">{label}</label>
      <div className="mt-1 flex gap-4">
        {(["Yes", "No"] as const).map((o) => (
          <label key={o} className="flex items-center gap-1 text-sm"><input type="radio" checked={v === o} onChange={() => setV(o)} /> {o}</label>
        ))}
      </div>
    </div>
  );
}

function TravellerDetails({ onBack, onNext }: any) {
  const [rows, setRows] = useState([
    { name: "Rahul Sharma", age: 35, gender: "Male", mobile: "9876543210", id: "Aadhar", num: "1234 5678 9012" },
    { name: "Neha Sharma", age: 32, gender: "Female", mobile: "9876543211", id: "Aadhar", num: "2345 6789 0123" },
  ]);
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
            {rows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="py-2 font-semibold">{i + 1} Member</td>
                <td><Input defaultValue={r.name} className="h-9" /></td>
                <td><Input defaultValue={String(r.age)} className="h-9 w-16" /></td>
                <td><Input defaultValue={r.gender} className="h-9 w-24" /></td>
                <td><Input defaultValue={r.mobile} className="h-9" /></td>
                <td><Input defaultValue={r.id} className="h-9 w-24" /></td>
                <td><Input defaultValue={r.num} className="h-9" /></td>
                <td><button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-rose-500"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length < 4 && (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setRows([...rows, { name: "", age: 0, gender: "", mobile: "", id: "Aadhar", num: "" }])}>
          <Plus className="mr-1 h-4 w-4" /> Add Traveller
        </Button>
      )}
      <div className="mt-3 rounded-md bg-emerald-50 p-3 text-xs text-emerald-700">{rows.length} of 4 Guest Slots Used</div>
      <div className="mt-6 flex justify-between"><Button variant="outline" onClick={onBack}>BACK</Button><Button className="bg-gold-gradient font-bold text-navy-deep" onClick={onNext}>NEXT</Button></div>
    </div>
  );
}

function AdditionalInfo({ onBack, onNext }: any) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-navy">Additional Requirements</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { l: "Airport Pickup", v: "Yes" }, { l: "Sightseeing Package", v: "Yes" }, { l: "Meal Preference", v: "Vegetarian" },
          { l: "Celebration / Anniversary", v: "No" }, { l: "Wheelchair Assistance", v: "No" },
        ].map((f) => (
          <div key={f.l} className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">{f.l}</div>
            <div className="mt-1 font-semibold text-navy">{f.v}</div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <label className="text-sm font-semibold text-navy">Special Requests (Optional)</label>
        <Textarea className="mt-1" rows={3} placeholder="Room on higher floor, near to lift if possible." />
      </div>
      <div className="mt-6 flex justify-between"><Button variant="outline" onClick={onBack}>BACK</Button><Button className="bg-gold-gradient font-bold text-navy-deep" onClick={onNext}>NEXT</Button></div>
    </div>
  );
}

function ReviewSubmit({ onBack, onSubmit }: any) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-navy">Review Your Request</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ReviewBlock title="Travel Details" rows={[
          ["Destination", "Goa"], ["Resort", "Taj Holiday Resort, Goa"],
          ["Check-in Date", "15 Jun 2026 (10:00 AM)"], ["Check-out Date", "19 Jun 2026 (09:00 AM)"],
          ["Total Nights", "4 Nights / 5 Days"], ["Rooms", "1 Room"],
          ["Airport Pickup", "Yes"], ["Sightseeing Package", "Yes"], ["Meal Preference", "Vegetarian"],
        ]} />
        <ReviewBlock title="Traveller Details" rows={[
          ["1. Rahul Sharma", "35 Y, Male | Aadhar: 1234 5678 9012"],
          ["2. Neha Sharma", "32 Y, Female | Aadhar: 2345 6789 0123"],
        ]} />
      </div>
      <div className="mt-4">
        <div className="text-sm font-semibold text-navy">Special Requests</div>
        <div className="text-sm text-muted-foreground">Room on higher floor, near to lift if possible.</div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> I confirm that all traveller details are accurate.</label>
      <div className="mt-6 flex justify-between"><Button variant="outline" onClick={onBack}>BACK</Button><Button className="bg-gold-gradient font-bold text-navy-deep" onClick={onSubmit}>SUBMIT HOLIDAY REQUEST <Check className="ml-2 h-4 w-4" /></Button></div>
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
