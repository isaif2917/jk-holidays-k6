import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Briefcase, Wallet, Crown, MapPin, Users, Gift, Tag, Headphones } from "lucide-react";
import { destinations } from "@/data/mock";
import { db, fmtDate, inr, useMe, useRows } from "@/lib/data";
import { StatusBadge } from "@/components/ui/status-badge";
import nextHoliday from "@/assets/next-holiday.webp";
import upgradeBanner from "@/assets/upgrade-banner.webp";
import heroImg from "@/assets/hero-resort.webp";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/dashboard")({ head: () => createRouteHead("Member Dashboard — JK Holidays", "View your holiday membership, wallet, bookings and travel requests."), component: Dashboard });

function Dashboard() {
  const { data: me } = useMe();
  const uid = me?.user.id;
  const p = me?.profile ?? {};
  const bookings = useRows(["bookings", uid], () => db.from("bookings").select("*").eq("user_id", uid).order("check_in", { ascending: false }).limit(4), !!uid);
  const requests = useRows(["holiday_requests", uid], () => db.from("holiday_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false }), !!uid);
  const tx = useRows(["wallet_transactions", uid], () => db.from("wallet_transactions").select("*").eq("user_id", uid), !!uid);
  const balance = (tx.data ?? []).reduce((s, t) => s + (String(t.type).toLowerCase() === "credit" ? t.amount : -t.amount), 0);
  const daysLeft = p.membership_end ? Math.max(0, Math.ceil((new Date(p.membership_end).getTime() - Date.now()) / 86400000)) : 0;
  const nightsLeft = (p.nights_total ?? 0) - (p.nights_used ?? 0);
  const recent = [
    ...(bookings.data ?? []).map((b) => ({ id: b.id, dest: b.destination, nights: b.nights, dates: `${fmtDate(b.check_in)} – ${fmtDate(b.check_out)}`, status: b.status })),
    ...(requests.data ?? []).filter((r) => r.status !== "Approved").map((r) => ({ id: r.id, dest: r.destination, nights: r.nights, dates: `${fmtDate(r.check_in)} – ${fmtDate(r.check_out)}`, status: r.status })),
  ].slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <img src={heroImg} alt="" className="h-32 w-full object-cover sm:h-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-5 text-white sm:px-8">
          <div className="text-sm">Welcome Back,</div>
          <div className="font-serif text-2xl font-bold sm:text-3xl">{p.full_name || "Member"} 👋</div>
          <div className="mt-1 text-sm text-white/80">Let's plan your next perfect holiday!</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="col-span-2 rounded-xl bg-navy-gradient p-5 text-white lg:col-span-1">
          <div className="text-sm text-white/80">My Membership</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="font-serif text-2xl font-bold">{p.plan || "No plan yet"}</div>
              <Badge className={`mt-1 ${p.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>● {p.status || "Pending"}</Badge>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-gold text-gold"><Crown className="h-6 w-6" /></div>
          </div>
          <div className="mt-4 text-xs text-white/70">Valid Till<br /><span className="text-white">{fmtDate(p.membership_end)}</span></div>
          <Button asChild size="sm" className="mt-3 w-full bg-white/10 text-xs hover:bg-white/20">
            <Link to={p.plan ? "/app/membership" : "/packages"} search={{}}>{p.plan ? "VIEW DETAILS" : "BUY MEMBERSHIP"}</Link>
          </Button>
        </div>
        <StatCard icon={Calendar} tone="blue" title="Validity" value={String(daysLeft)} sub="Days Left" foot={`Till ${fmtDate(p.membership_end)}`} />
        <StatCard icon={Briefcase} tone="emerald" title="Holiday Nights" value={String(nightsLeft)} sub="Nights Left" cta="BOOK NOW" to="/app/request" />
        <StatCard icon={Wallet} tone="violet" title="My Wallet" value={inr(balance)} sub="Available" cta="OPEN WALLET" to="/app/wallet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-navy-deep text-white">
          <img src={nextHoliday} alt="" className="h-48 w-full object-cover opacity-90 sm:h-56" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/40 to-transparent" />
          <div className="absolute inset-x-0 top-4 px-5 font-serif text-xl font-bold">Next Eligible Holiday</div>
          <div className="p-5">
            <div className="flex items-center gap-1 text-sm"><MapPin className="h-4 w-4 text-gold" /> {nightsLeft > 0 ? `${nightsLeft} nights available` : "Activate a membership to start"}</div>
            <div className="mt-1 text-xs text-white/80">Valid Till: {fmtDate(p.membership_end)}</div>
            <Button asChild className="mt-4 bg-gold-gradient font-bold text-navy-deep"><Link to="/app/resorts">EXPLORE RESORTS</Link></Button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-navy">Recent Bookings</h3>
            <Link to="/app/bookings" className="text-xs font-semibold text-blue-600">View All</Link>
          </div>
          <div className="mt-4 space-y-4">
            {recent.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No bookings yet. <Link to="/app/request" className="text-blue-600">Request a holiday</Link></div>}
            {recent.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 border-b pb-3 last:border-0">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-navy">{b.dest}</div>
                  <div className="text-xs text-muted-foreground">{b.nights} Nights · {b.dates}</div>
                </div>
                <StatusBadge s={b.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-navy-gradient text-white">
        <img src={upgradeBanner} alt="" className="absolute right-0 top-0 h-full w-2/3 object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/70 to-transparent" />
        <div className="relative flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-serif text-2xl font-bold">Upgrade to Platinum Membership</h3>
            <p className="mt-1 text-sm text-white/80">More nights, longer validity and international holidays.</p>
            <Button asChild className="mt-4 bg-gold-gradient font-bold text-navy-deep"><Link to="/packages/$slug" params={{ slug: "platinum-voyage" }} search={{}}>UPGRADE NOW</Link></Button>
          </div>
          <div className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold">BEST VALUE</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {([
          { i: Users, t: "Refer & Earn", d: "Invite friends and earn rewards.", cta: "VIEW DETAILS", to: "/app/refer", c: "text-blue-500" },
          { i: Gift, t: "My Rewards", d: "See rewards you've earned.", cta: "VIEW", to: "/app/rewards", c: "text-rose-500" },
          { i: Tag, t: "Exclusive Offers", d: "Latest member offers.", cta: "VIEW OFFERS", to: "/app/offers", c: "text-amber-500" },
          { i: Headphones, t: "Travel Support", d: "We're here 24/7.", cta: "CONTACT NOW", to: "/app/support", c: "text-cyan-500" },
        ] as const).map(({ i: Icon, t, d, cta, to, c }) => (
          <Card key={t} className="p-4 sm:p-5">
            <Icon className={`h-8 w-8 ${c}`} />
            <h4 className="mt-3 font-serif text-base font-bold text-navy">{t}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{d}</p>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full text-xs"><Link to={to}>{cta}</Link></Button>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-navy">Popular Destinations</h3>
          <Link to="/app/holidays" className="text-xs font-semibold text-blue-600">View All</Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-6">
          {destinations.map((d) => (
            <Link to="/app/request" key={d.name} className="relative aspect-square overflow-hidden rounded-lg">
              <img src={d.image} alt={d.name} loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 to-transparent" />
              <div className="absolute bottom-2 left-2 text-white">
                <div className="text-xs font-bold">{d.name}</div>
                <div className="text-[10px]">{d.country}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, tone, title, value, sub, foot, cta, to }: {
  icon: React.ComponentType<{ className?: string }>; tone: "blue" | "emerald" | "violet"; title: string; value: string; sub: string;
  foot?: string; cta?: string; to?: "/app/request" | "/app/wallet";
}) {
  const tones = { blue: "bg-blue-100 text-blue-600", emerald: "bg-emerald-100 text-emerald-600", violet: "bg-violet-100 text-violet-600" };
  return (
    <Card className="p-4 sm:p-5">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-serif text-2xl font-bold text-navy sm:text-3xl">{value}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
        <div className={`hidden h-12 w-12 shrink-0 place-items-center rounded-full sm:grid ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
      </div>
      {foot && <div className="mt-2 text-xs text-muted-foreground">{foot}</div>}
      {cta && to && <Button asChild size="sm" className="mt-3 w-full bg-navy text-xs text-white"><Link to={to}>{cta}</Link></Button>}
    </Card>
  );
}
