import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Crown, CalendarCheck, CreditCard, MapPin, ArrowRight } from "lucide-react";
import { destinations } from "@/data/mock";
import { useSiteDestinations } from "@/lib/catalog";
import { db, fmtDate, inr, useMe, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/holidays")({ head: () => createRouteHead("Available Holidays — JK Holidays", "Explore holiday destinations available to JK Holidays members."), component: Holidays });

function Holidays() {
  const { data: me } = useMe();
  const p = me?.profile ?? {};
  const pays = useRows(["payments", me?.user.id], () => db.from("payments").select("*").eq("user_id", me!.user.id).order("created_at", { ascending: false }), !!me?.user.id);
  const live = useSiteDestinations();
  const list = live.length ? live : destinations.map((d) => ({ name: d.name, country: d.country, image: d.image }));
  const nightsLeft = Math.max(0, (p.nights_total ?? 0) - (p.nights_used ?? 0));
  const latest = (pays.data ?? [])[0] as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">Available Holidays</h1>
        <div className="text-sm text-muted-foreground">Destinations included with your membership — pick one and raise a request.</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-navy-gradient p-5 text-white">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-gold" />
            <div>
              <div className="text-xs text-white/80">Membership</div>
              <div className="font-serif text-xl font-bold text-gold">{p.plan ? `${p.plan} · ${p.status}` : "No active plan"}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-white/80">Valid till {fmtDate(p.membership_end)}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-gold" />
            <div>
              <div className="text-xs text-muted-foreground">Holiday Nights Available</div>
              <div className="font-serif text-2xl font-bold text-navy">{nightsLeft} nights left</div>
              <div className="text-xs text-muted-foreground">{p.nights_used ?? 0} of {p.nights_total ?? 0} used</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <CreditCard className="h-8 w-8 text-gold" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Membership Payment</div>
              {latest ? (
                <>
                  <div className="mt-1 flex items-center gap-2"><span className="font-serif text-xl font-bold text-navy">{inr(latest.amount)}</span><StatusBadge s={latest.status} /></div>
                  <div className="truncate text-xs text-muted-foreground">{latest.plan_slug} · Ref {latest.reference || "—"} · {fmtDate(latest.created_at)}</div>
                </>
              ) : <div className="mt-1 font-serif text-xl font-bold text-navy">No payments yet</div>}
              <Link to="/app/membership" className="mt-1 inline-block text-xs font-semibold text-blue-600">View all payments & plan →</Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <Card key={d.name} className="overflow-hidden p-0">
            <img src={d.image} alt={d.name} className="h-48 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-serif text-lg font-bold text-navy">{d.name}</div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{d.country}</span>
              </div>
              <Button asChild className="mt-3 w-full bg-navy text-white hover:bg-navy/90">
                <Link to="/app/request">Book Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
