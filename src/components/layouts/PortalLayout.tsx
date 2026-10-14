import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid, User, Crown, CalendarCheck, Plane, Building2, Wallet,
  Users, Gift, Tag, Headphones, FileText, Bell, Settings, LogOut, Phone, Menu, Home,
} from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/brand/Logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { db, signOut, useMe, useRows } from "@/lib/data";
import { CONTACT } from "@/data/mock";

const memberNav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/app/profile", label: "My Profile", icon: User },
  { to: "/app/membership", label: "My Membership", icon: Crown },
  { to: "/app/bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/app/request", label: "Request Holiday", icon: Plane },
  { to: "/app/holidays", label: "Available Holidays", icon: Plane },
  { to: "/app/resorts", label: "Resorts Directory", icon: Building2 },
  { to: "/app/wallet", label: "My Wallet", icon: Wallet },
  { to: "/app/refer", label: "Refer & Earn", icon: Users },
  { to: "/app/rewards", label: "My Rewards", icon: Gift },
  { to: "/app/offers", label: "Offers & Discounts", icon: Tag },
  { to: "/app/support", label: "Travel Support", icon: Headphones },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/notifications", label: "Notifications", icon: Bell, badge: true },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function PortalLayout() {
  const { data: me, isLoading } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const unread = useRows(["notifications", me?.user.id], () => db.from("notifications").select("id").eq("user_id", me!.user.id).eq("read", false), !!me);

  useEffect(() => {
    if (!isLoading && !me) navigate({ to: "/auth/login" });
  }, [isLoading, me, navigate]);

  if (!me) return <div className="grid min-h-screen place-items-center bg-navy-deep text-gold">Loading…</div>;

  const logout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    navigate({ to: "/auth/login", replace: true });
  };
  const count = unread.data?.length ?? 0;
  const name = me.profile.full_name || me.user.email || "Member";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 bg-navy-deep text-white/85 lg:block">
        <SidebarInner name={name} code={me.profile.member_code} count={count} isAdmin={me.isAdmin} onLogout={logout} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 bg-navy-gradient px-4 text-white md:px-6">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger className="lg:hidden" aria-label="Menu"><Menu className="h-5 w-5" /></SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto bg-navy-deep p-0 text-white">
                <SidebarInner name={name} code={me.profile.member_code} count={count} isAdmin={me.isAdmin} onLogout={logout} />
              </SheetContent>
            </Sheet>
            <div className="lg:hidden"><Logo className="h-10" /></div>
          </div>
          <div className="ml-auto flex items-center gap-3 md:gap-5">
            <Link to="/" className="hidden md:block" title="Website home"><Home className="h-5 w-5" /></Link>
            <a href={CONTACT.phoneHref} className="hidden items-center gap-2 text-sm md:flex"><Phone className="h-4 w-4 text-gold" /> {CONTACT.phone}</a>
            <Link to="/app/notifications" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {count > 0 && <Badge className="absolute -right-2 -top-2 h-5 min-w-5 justify-center rounded-full bg-red-500 p-0 text-[10px]">{count}</Badge>}
            </Link>
            <Link to="/app/profile" className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gold font-bold text-navy-deep">{name[0]?.toUpperCase()}</div>
              <div className="hidden text-xs leading-tight sm:block">
                <div className="font-semibold">{name}</div>
                <div className="text-white/60">Member ID: {me.profile.member_code}</div>
              </div>
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 bg-[oklch(0.97_0.01_260)] p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarInner({ name, code, count, isAdmin, onLogout }: { name: string; code: string; count: number; isAdmin: boolean; onLogout: () => void }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 bg-navy-gradient px-5 py-3"><Link to="/"><Logo /></Link></div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {isAdmin && (
          <Link to="/admin/dashboard" className="mb-2 flex items-center gap-3 rounded-lg border border-gold/40 px-3 py-2.5 text-sm text-gold">
            <Crown className="h-4 w-4" /> Open Admin CRM
          </Link>
        )}
        {memberNav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-gold-gradient font-semibold text-navy-deep" : "hover:bg-white/5 hover:text-gold"}`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {"badge" in item && count > 0 ? (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{count}</span>
              ) : null}
            </Link>
          );
        })}
        <button onClick={onLogout} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/5 hover:text-gold">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </nav>
      <div className="m-3 rounded-xl border border-gold/40 bg-white/5 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold text-gold"><Gift className="h-4 w-4" /> Refer & Earn</div>
        <p className="mt-1 text-xs text-white/70">Invite your friends and earn exciting rewards.</p>
        <Link to="/app/refer" className="mt-3 block w-full rounded-md bg-gold-gradient py-1.5 text-center text-xs font-bold text-navy-deep">REFER NOW</Link>
      </div>
      <div className="border-t border-white/10 p-3 text-xs text-white/50">{name} · {code}</div>
    </div>
  );
}
