import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Users, Crown, Plane, Wallet, ArrowUpRight, LifeBuoy, CreditCard } from "lucide-react";
import { db, inr, useMe, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/dashboard")({ head: () => createRouteHead("Admin Dashboard — JK Holidays", "View JK Holidays membership, booking, payment and support activity."), component: AdminDash });

const COLORS = ["var(--navy)", "var(--gold)", "oklch(0.65 0.15 160)", "oklch(0.65 0.18 25)", "oklch(0.6 0.15 280)"];

function Ring({ value, label, sub, color, delay = 0 }: { value: number; label: string; sub: string; color: string; delay?: number }) {
  const r = 42, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
          <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (pct / 100) * c }}
            transition={{ duration: 1.4, delay, ease: "easeOut" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center font-serif text-2xl font-bold text-navy">{Math.round(pct)}%</div>
      </div>
      <div className="mt-2 text-sm font-semibold text-navy">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function AdminDash() {
  const { data: me } = useMe();
  const profiles = useRows("profiles", () => db.from("profiles").select("*").order("created_at", { ascending: false }));
  const req = useRows("holiday_requests", () => db.from("holiday_requests").select("*").order("created_at", { ascending: false }));
  const pay = useRows("payments", () => db.from("payments").select("*").order("created_at", { ascending: false }));
  const tk = useRows("support_tickets", () => db.from("support_tickets").select("*").order("created_at", { ascending: false }));
  const notes = useRows("admin_notifications_all", () => db.from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(200));

  const P = profiles.data ?? [], R = req.data ?? [], Pay = pay.data ?? [], T = tk.data ?? [];
  const active = P.filter((p: any) => p.status === "Active").length;
  const pendingReq = R.filter((r: any) => r.status === "Pending").length;
  const approved = Pay.filter((p: any) => p.status === "Approved");
  const revenue = approved.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const nightsT = P.reduce((s: number, p: any) => s + (p.nights_total || 0), 0);
  const nightsU = P.reduce((s: number, p: any) => s + (p.nights_used || 0), 0);
  const closedT = T.filter((t: any) => t.status !== "Open").length;

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
    const key = d.toISOString().slice(0, 7);
    return { m: d.toLocaleString("en-IN", { month: "short" }), members: P.filter((p: any) => p.created_at?.startsWith(key)).length,
      revenue: approved.filter((p: any) => p.created_at?.startsWith(key)).reduce((s: number, p: any) => s + Number(p.amount || 0), 0) };
  });
  const byPlan = Object.entries(P.reduce((a: Record<string, number>, p: any) => { const k = p.plan || "No plan"; a[k] = (a[k] || 0) + 1; return a; }, {}))
    .map(([name, value]) => ({ name, value }));

  const stats = [
    { i: Users, l: "Total Members", v: String(P.length), to: "/admin/members" },
    { i: Crown, l: "Active Memberships", v: String(active), to: "/admin/members" },
    { i: Plane, l: "Pending Requests", v: String(pendingReq), to: "/admin/requests" },
    { i: Wallet, l: "Total Revenue", v: inr(revenue), to: "/admin/payments" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">Hello, {me?.profile?.full_name || "Admin"} 👋</h1>
        <div className="text-sm text-muted-foreground">Here's what's happening with JK Holidays.</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ i: Icon, l, v, to }, idx) => (
          <motion.div key={l} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
            <Card className={`relative h-full p-5 ${idx === 0 ? "bg-navy-gradient text-white" : ""}`}>
              <Link to={to} className={`absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full ${idx === 0 ? "bg-gold text-navy-deep" : "bg-muted text-navy"}`}><ArrowUpRight className="h-4 w-4" /></Link>
              <Icon className={`h-5 w-5 ${idx === 0 ? "text-gold" : "text-navy"}`} />
              <div className={`mt-3 text-sm ${idx === 0 ? "text-white/80" : "text-muted-foreground"}`}>{l}</div>
              <div className={`mt-1 font-serif text-3xl font-bold ${idx === 0 ? "" : "text-navy"}`}>{v}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-navy">New members — last 6 months</h3>
          <span className="rounded-full bg-gold-soft/60 px-3 py-1 text-xs font-semibold text-navy">{P.length} total members</span>
        </div>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={months} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="memberGrowthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--navy)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--navy)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="members" name="New members" stroke="var(--navy)" strokeWidth={2.5} fill="url(#memberGrowthFill)" dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={1400} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-serif text-lg font-bold text-navy">Revenue — last 6 months</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={60} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Bar dataKey="revenue" fill="var(--navy)" radius={[8, 8, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-serif text-lg font-bold text-navy">Members by plan</h3>
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byPlan.length ? byPlan : [{ name: "None", value: 1 }]} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3} animationDuration={1200}>
                  {(byPlan.length ? byPlan : [{ name: "None" }]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {byPlan.map((b, i) => <div key={b.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{b.name}<span className="ml-auto font-semibold">{b.value}</span></div>)}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-serif text-lg font-bold text-navy">Performance</h3>
        <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-4">
          <Ring value={P.length ? (active / P.length) * 100 : 0} label="Active members" sub={`${active} of ${P.length}`} color="var(--navy)" />
          <Ring value={nightsT ? (nightsU / nightsT) * 100 : 0} label="Nights used" sub={`${nightsU} of ${nightsT}`} color="var(--gold)" delay={0.15} />
          <Ring value={Pay.length ? (approved.length / Pay.length) * 100 : 0} label="Requests approved" sub={`${approved.length} of ${Pay.length}`} color="oklch(0.65 0.15 160)" delay={0.3} />
          <Ring value={T.length ? (closedT / T.length) * 100 : 0} label="Tickets handled" sub={`${closedT} of ${T.length}`} color="oklch(0.65 0.18 25)" delay={0.45} />
        </div>
      </Card>

      <Card className="p-5">

          <div className="flex items-center justify-between"><h3 className="font-serif text-lg font-bold text-navy">Recent Activity</h3><Link to="/admin/notifications" className="text-xs font-semibold text-blue-600">View all</Link></div>
          <div className="mt-4 space-y-3 text-sm">
            {(notes.data ?? []).slice(0, 6).map((n: any) => {
              const Icon = n.kind === "ticket" ? LifeBuoy : n.kind === "membership" ? CreditCard : Users;
              return <div key={n.id} className="flex items-start gap-3 border-b pb-2 last:border-0"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><div className="min-w-0"><div className="font-medium text-navy">{n.title}</div><div className="truncate text-xs text-muted-foreground">{n.body}</div></div></div>;
            })}
            {(notes.data ?? []).length === 0 && <div className="py-6 text-center text-muted-foreground">No activity yet.</div>}
          </div>
        </Card>
    </div>
  );

}
