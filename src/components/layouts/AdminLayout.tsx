import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid, Users, Crown, Plane, CalendarCheck, Building2, Wallet, CreditCard,
  ArrowDownToLine, BarChart3, Bell, ShieldCheck, LifeBuoy, Settings, LogOut, Menu, Home, Inbox,
} from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/brand/Logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { db, signOut, useMe, useRows } from "@/lib/data";

type Counts = Record<string, number>;

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/plans", label: "Membership Plans", icon: Crown },
  { to: "/admin/requests", label: "Holiday Requests", icon: Plane, key: "requests" },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/resorts", label: "Destinations", icon: Building2 },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, key: "payments" },
  { to: "/admin/wallet", label: "Wallet & Transactions", icon: Wallet },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: ArrowDownToLine, key: "withdrawals" },
  { to: "/admin/leads", label: "Leads & Enquiries", icon: Inbox, key: "leads" },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/roles", label: "Admins & Roles", icon: ShieldCheck },
  { to: "/admin/tickets", label: "Support Tickets", icon: LifeBuoy, key: "tickets" },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminLayout() {
  const { data: me, isLoading } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ok = !!me?.isAdmin;
  const req = useRows("holiday_requests", () => db.from("holiday_requests").select("*").order("created_at", { ascending: false }), ok);
  const pay = useRows("payments", () => db.from("payments").select("*").order("created_at", { ascending: false }), ok);
  const wd = useRows("withdrawals", () => db.from("withdrawals").select("*").order("created_at", { ascending: false }), ok);
  const tk = useRows("support_tickets", () => db.from("support_tickets").select("*").order("created_at", { ascending: false }), ok);
  const ld = useRows("leads", () => db.from("leads").select("*").order("created_at", { ascending: false }), ok);

  useEffect(() => {
    if (isLoading) return;
    if (!me) navigate({ to: "/admin-login" });
    else if (!me.isAdmin) navigate({ to: "/app/dashboard" });
  }, [isLoading, me, navigate]);

  if (!ok) return <div className="grid min-h-screen place-items-center bg-navy-deep text-gold">Loading…</div>;

  const counts: Counts = {
    requests: (req.data ?? []).filter((r) => r.status === "Pending").length,
    payments: (pay.data ?? []).filter((r) => r.status === "Pending").length,
    withdrawals: (wd.data ?? []).filter((r) => r.status === "Pending").length,
    tickets: (tk.data ?? []).filter((r) => r.status === "Open").length,
    leads: (ld.data ?? []).filter((r) => r.status === "New").length,
  };
  const logout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    navigate({ to: "/admin-login", replace: true });
  };
  const name = me!.profile.full_name || me!.user.email || "Admin";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 bg-navy-deep text-white/85 lg:block"><SidebarInner counts={counts} onLogout={logout} /></aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-white px-4 md:px-6">
          <Sheet>
            <SheetTrigger className="lg:hidden" aria-label="Menu"><Menu className="h-5 w-5" /></SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-navy-deep p-0 text-white"><SidebarInner counts={counts} onLogout={logout} /></SheetContent>
          </Sheet>
          <div className="font-serif text-lg font-bold text-navy">Admin CRM</div>
          <div className="ml-auto flex items-center gap-4">
            <Link to="/" className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted" title="Go to website home"><Home className="h-5 w-5 text-navy" /></Link>
            <Link to="/app/dashboard" className="hidden text-xs font-semibold text-blue-600 sm:block">Member view</Link>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-navy font-bold text-white">{name[0]?.toUpperCase()}</div>
              <div className="hidden text-xs leading-tight md:block">
                <div className="font-semibold text-navy">{name}</div>
                <div className="text-muted-foreground">Admin</div>
              </div>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 bg-[oklch(0.97_0.01_260)] p-3 sm:p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

function SidebarInner({ counts, onLogout }: { counts: Counts; onLogout: () => void }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 bg-navy-gradient px-5 py-3">
        <Link to="/"><Logo /></Link>
        <div className="mt-1 text-[10px] font-bold tracking-widest text-gold">ADMIN PANEL</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {adminNav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          const n = "key" in item ? counts[item.key] : 0;
          return (
            <Link key={item.to} to={item.to}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-gold-gradient font-semibold text-navy-deep" : "hover:bg-white/5 hover:text-gold"}`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {n ? <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{n}</span> : null}
            </Link>
          );
        })}
        <button onClick={onLogout} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/5 hover:text-gold">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </nav>
    </div>
  );
}
