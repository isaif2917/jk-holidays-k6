import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db, downloadCsv, inr, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/reports")({ head: () => createRouteHead("Reports — JK Holidays Admin", "Animated membership, bookings, financial, referral and support reports."), component: AdminReports });

const monthsBack = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
  return { key: d.toISOString().slice(0, 7), label: d.toLocaleString("en-IN", { month: "short" }) };
});

function AdminReports() {
  const profiles = useRows("profiles", () => db.from("profiles").select("id,created_at,plan").order("created_at", { ascending: false }));
  const bookings = useRows("bookings", () => db.from("bookings").select("id,created_at,nights").order("created_at", { ascending: false }));
  const payments = useRows("payments", () => db.from("payments").select("id,created_at,amount,status").order("created_at", { ascending: false }));
  const referrals = useRows("referrals", () => db.from("referrals").select("id,created_at").order("created_at", { ascending: false }));
  const tickets = useRows("support_tickets", () => db.from("support_tickets").select("id,created_at,status").order("created_at", { ascending: false }));
  const requests = useRows("holiday_requests", () => db.from("holiday_requests").select("id,created_at,nights").order("created_at", { ascending: false }));

  const inMonth = (rows: any[], key: string) => rows.filter((r) => r.created_at?.startsWith(key));
  const perMonth = (rows: any[]) => monthsBack.map((m) => ({ m: m.label, v: inMonth(rows, m.key).length }));
  const moneyPerMonth = (rows: any[]) => monthsBack.map((m) => ({ m: m.label, v: inMonth(rows, m.key).filter((r) => r.status === "Approved").reduce((s, r) => s + Number(r.amount || 0), 0) }));
  const cumulative = (rows: any[]) => { let c = 0; return monthsBack.map((m) => { c += inMonth(rows, m.key).length; return { m: m.label, v: c }; }); };

  const approved = (payments.data ?? []).filter((p: any) => p.status === "Approved");
  const active = (profiles.data ?? []).filter((p: any) => p.status === "Active").length;
  const reports = [
    { key: "membership", title: "Membership Report", sub: `${profiles.data?.length ?? 0} members · ${active} active`, color: "var(--navy)", data: cumulative(profiles.data ?? []), rows: profiles.data ?? [], money: false },
    { key: "bookings", title: "Bookings Report", sub: `${bookings.data?.length ?? 0} bookings saved`, color: "var(--gold)", data: perMonth(bookings.data ?? []), rows: bookings.data ?? [], money: false },
    { key: "financial", title: "Financial Report", sub: `${inr(approved.reduce((s: number, p: any) => s + Number(p.amount || 0), 0))} approved revenue`, color: "oklch(0.65 0.15 160)", data: moneyPerMonth(payments.data ?? []), rows: payments.data ?? [], money: true },
    { key: "referral", title: "Referral Report", sub: `${referrals.data?.length ?? 0} referrals recorded`, color: "oklch(0.65 0.18 25)", data: perMonth(referrals.data ?? []), rows: referrals.data ?? [], money: false },
    { key: "support", title: "Support Report", sub: `${tickets.data?.length ?? 0} tickets raised`, color: "oklch(0.6 0.15 280)", data: perMonth(tickets.data ?? []), rows: tickets.data ?? [], money: false },
    { key: "activity", title: "Activity Report", sub: `${requests.data?.length ?? 0} holiday requests`, color: "var(--navy)", data: perMonth(requests.data ?? []), rows: requests.data ?? [], money: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">Reports</h1>
        <div className="text-sm text-muted-foreground">Live animated trends across every report topic — last 6 months.</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r, i) => (
          <motion.div key={r.key} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.45 }}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div><div className="font-serif text-lg font-bold text-navy">{r.title}</div><div className="text-xs text-muted-foreground">{r.sub}</div></div>
                <Button variant="outline" size="sm" onClick={() => downloadCsv(`report-${r.key}.csv`, r.rows)}><Download className="mr-1 h-3.5 w-3.5" /> Export</Button>
              </div>
              <div className="mt-4 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={r.data} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`fill-${r.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={r.color} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={r.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => (r.money ? inr(v) : `${v}`)} />
                    <Area type="monotone" dataKey="v" name={r.title} stroke={r.color} strokeWidth={2.5} fill={`url(#fill-${r.key})`} dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={1400} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
