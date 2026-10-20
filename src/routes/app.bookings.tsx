import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { db, fmtDate, useMe, useRows } from "@/lib/data";
import { StatusBadge } from "@/components/ui/status-badge";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/bookings")({ head: () => createRouteHead("My Bookings — JK Holidays", "Review your confirmed bookings and holiday requests."), component: Bookings });

function Bookings() {
  const { data: me } = useMe();
  const uid = me?.user.id;
  const b = useRows(["bookings", uid], () => db.from("bookings").select("*").eq("user_id", uid).order("check_in", { ascending: false }), !!uid);
  const r = useRows(["holiday_requests", uid], () => db.from("holiday_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false }), !!uid);
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">My Bookings & Requests</h1>
      <Card className="overflow-x-auto p-5">
        <h2 className="font-serif text-lg font-bold text-navy">Confirmed Bookings</h2>
        <table className="mt-3 w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2">Destination</th><th>Resort</th><th>Nights</th><th>Dates</th><th>Status</th></tr></thead>
          <tbody>
            {(b.data ?? []).map((x) => (
              <tr key={x.id} className="border-b"><td className="py-3 font-semibold text-navy">{x.destination}</td><td>{x.resort ?? "—"}</td><td>{x.nights}</td><td>{fmtDate(x.check_in)} – {fmtDate(x.check_out)}</td><td><StatusBadge s={x.status} /></td></tr>
            ))}
            {!b.data?.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No confirmed bookings yet.</td></tr>}
          </tbody>
        </table>
      </Card>
      <Card className="overflow-x-auto p-5">
        <div className="flex items-center justify-between"><h2 className="font-serif text-lg font-bold text-navy">Holiday Requests</h2><Link to="/app/request" className="text-sm font-semibold text-blue-600">+ New request</Link></div>
        <table className="mt-3 w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2">ID</th><th>Destination</th><th>Dates</th><th>Status</th><th>Note from team</th></tr></thead>
          <tbody>
            {(r.data ?? []).map((x) => (
              <tr key={x.id} className="border-b"><td className="py-3 font-mono">{x.code}</td><td>{x.destination}</td><td>{fmtDate(x.check_in)} – {fmtDate(x.check_out)}</td><td><StatusBadge s={x.status} /></td><td className="text-xs text-muted-foreground">{x.alt_dates ? `Alt dates: ${x.alt_dates}. ` : ""}{x.admin_note ?? ""}</td></tr>
            ))}
            {!r.data?.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No requests yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
