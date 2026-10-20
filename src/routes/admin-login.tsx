import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-resort.webp";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, Users, CalendarCheck, Wallet, BarChart3 } from "lucide-react";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin-login")({
  head: () => createRouteHead("Admin Login — JK Holidays", "Secure staff sign-in for managing JK Holidays members, bookings and payments."),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("admin@jkholidays.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) return toast.error(error?.message ?? "Login failed");
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      await supabase.auth.signOut();
      return toast.error("This account does not have admin access.");
    }
    await qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Welcome to the admin CRM");
    navigate({ to: "/admin/dashboard" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await login(); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-navy-deep">
      <header className="bg-navy-gradient px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/auth/login" className="text-sm font-semibold text-gold hover:underline">Member Login</Link>
        </div>
      </header>
      <div className="relative min-h-[calc(100vh-72px)]">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-navy-deep/80" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-2">
          <div className="hidden text-white lg:block">
            <h1 className="font-serif text-4xl font-bold md:text-5xl">JK Holidays<br /><span className="text-gold">Admin CRM</span></h1>
            <p className="mt-3 max-w-md text-white/80">Secure staff access to run memberships, holidays and payments.</p>
            <div className="mt-8 max-w-md space-y-4">
              {[
                { i: Users, t: "Members & Plans", d: "Add, edit and manage every member and plan." },
                { i: CalendarCheck, t: "Holiday Requests", d: "Approve, reject or suggest alternate dates." },
                { i: Wallet, t: "Payments & Withdrawals", d: "Verify UPI/bank payments and payouts." },
                { i: BarChart3, t: "Reports & Leads", d: "Track enquiries, bookings and revenue." },
              ].map(({ i: Icon, t, d }) => (
                <div key={t} className="flex gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/60 bg-navy text-gold"><Icon className="h-5 w-5" /></div>
                  <div><div className="font-semibold">{t}</div><div className="text-sm text-white/70">{d}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-center lg:pt-6">
            <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl sm:p-8">
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-gold text-gold"><ShieldCheck className="h-6 w-6" /></div>
                <h2 className="mt-4 font-serif text-2xl font-bold text-navy">ADMIN LOGIN</h2>
                <p className="mt-1 text-sm text-muted-foreground">Authorised staff only</p>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-navy">Email</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-9" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-navy">Password</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input required type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-9 pr-9" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Show password">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={busy} className="h-12 w-full bg-gold-gradient font-bold text-navy-deep hover:opacity-90">
                  {busy ? "PLEASE WAIT..." : "LOGIN TO CRM"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
