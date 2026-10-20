import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";
import { db, fmtDate, inr, useMe, useRows } from "@/lib/data";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/membership")({ head: () => createRouteHead("My Membership — JK Holidays", "Review your current holiday membership and membership requests."), component: Membership });

function Membership() {
  const { data: me } = useMe();
  const p = me?.profile ?? {};
  const plans = useRows("membership_plans", () => db.from("membership_plans").select("*").order("sort"));
  const pays = useRows(["payments", me?.user.id], () => db.from("payments").select("*").eq("user_id", me!.user.id).order("created_at", { ascending: false }), !!me);
  const qc = useQueryClient();
  const [req, setReq] = useState<any>(null);
  const [method, setMethod] = useState("UPI");
  const [ref, setRef] = useState("");
  const pending = (pays.data ?? []).find((x: any) => x.status === "Pending");
  const submit = async () => {
    if (!ref.trim()) return toast.error("Enter your payment reference / transaction ID");
    const { error } = await db.from("payments").insert({
      user_id: me!.user.id, name: p.full_name, email: p.email ?? me!.user.email, phone: p.phone,
      plan_slug: req.slug, amount: req.price, method, reference: ref.trim(), status: "Pending",
    });
    if (error) return toast.error(error.message);
    toast.success("Request sent. Our team will verify and activate your plan.");
    setReq(null); setRef(""); qc.invalidateQueries({ queryKey: ["payments"] });
  };
  const days = p.membership_end ? Math.max(0, Math.ceil((new Date(p.membership_end).getTime() - Date.now()) / 86400000)) : 0;
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">My Membership</h1>
      <Card className="bg-navy-gradient p-6 text-white">
        <div className="flex items-center gap-4">
          <Crown className="h-12 w-12 text-gold" />
          <div>
            <div className="text-sm text-white/80">Current Plan · {p.status ?? "Pending"}</div>
            <div className="font-serif text-3xl font-bold text-gold">{p.plan ? `${p.plan} Membership` : "No active plan"}</div>
            <div className="text-sm">Valid Till: {fmtDate(p.membership_end)} · {days} Days Remaining · {(p.nights_total ?? 0) - (p.nights_used ?? 0)} nights left</div>
          </div>
        </div>
      </Card>

      {(pays.data?.length ?? 0) > 0 && (
        <Card className="p-5">
          <h2 className="font-serif text-lg font-bold text-navy">My Payments</h2>
          <div className="mt-3 space-y-2 text-sm">
            {pays.data!.map((x) => (
              <div key={x.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div><div className="font-medium text-navy">{x.plan_slug} · {inr(x.amount)}</div><div className="text-xs text-muted-foreground">Ref {x.reference} · {fmtDate(x.created_at)}</div></div>
                <StatusBadge s={x.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <h2 className="font-serif text-2xl font-bold text-navy">{p.plan ? "Upgrade Options" : "Choose a Plan"}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {(plans.data ?? []).map((pl) => (
          <Card key={pl.id} className="p-5">
            <div className="font-serif text-xl font-bold text-navy">{pl.name}</div>
            <div className="mt-2 font-serif text-2xl font-bold text-gold">{inr(pl.price)}</div>
            <div className="text-xs text-muted-foreground">{pl.nights} Nights · {pl.validity_years} Years</div>
            <ul className="mt-3 space-y-1 text-sm">
              {(pl.features ?? []).map((f: string) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-gold" /> {f}</li>)}
            </ul>
            {p.plan === pl.name ? (
              <Button disabled className="mt-4 w-full bg-navy text-white">Current Plan</Button>
            ) : (
              <Button disabled={!!pending} className="mt-4 w-full bg-navy text-white" onClick={() => setReq(pl)}>{pending ? "Request pending" : p.plan ? "Request Upgrade" : "Request Membership"}</Button>
            )}
          </Card>
        ))}
      </div>
      <Dialog open={!!req} onOpenChange={(o) => !o && setReq(null)}>
        <DialogContent><DialogHeader><DialogTitle>Request {req?.name} membership</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Pay {inr(req?.price)} and enter the payment details below. Admin will approve your plan after verifying.</p>
          <label className="text-xs">Payment method
            <select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
              {["UPI", "Bank Transfer", "Card", "Cash"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
          <label className="text-xs">Transaction ID / reference<Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. UPI ref number" /></label>
          <DialogFooter><Button className="bg-navy text-white" onClick={submit}>Send request</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
