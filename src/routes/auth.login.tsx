import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-resort.webp";
import { User, Lock, Eye, EyeOff, ArrowRight, Briefcase, Tag, Layout, Headphones, Gift } from "lucide-react";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Member Login — JK Holidays" },
      { name: "description", content: "Log in to your JK Holidays membership account." },
      { property: "og:title", content: "Member Login — JK Holidays" },
      { property: "og:description", content: "Manage bookings, wallet and holiday requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: me } = useMe();
  useEffect(() => { if (me) navigate({ to: "/app/dashboard", replace: true }); }, [me, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      setBusy(false);
      toast.error(error?.message ?? "Login failed");
      return;
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (roles?.some((r) => r.role === "admin") && !roles?.some((r) => r.role === "member")) {
      await supabase.auth.signOut();
      setBusy(false);
      toast.error("Admin accounts must use the Admin Login page.");
      navigate({ to: "/admin-login" });
      return;
    }
    await qc.invalidateQueries({ queryKey: ["me"] });
    setBusy(false);
    navigate({ to: "/app/dashboard" });
  };

  const forgot = async () => {
    if (!email.includes("@")) return toast.error("Enter your email above first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message);
    else toast.success("Check your email for a password reset link.");
  };

  return (
    <div className="min-h-screen bg-navy-deep">
      <header className="bg-navy-gradient px-4 py-2"><div className="mx-auto max-w-7xl"><Link to="/"><Logo /></Link></div></header>
      <div className="relative min-h-[calc(100vh-72px)]">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-navy-deep/70" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-2">
          <div className="hidden text-white lg:block">
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Welcome Back,<br /><span className="text-gold">Valued Member!</span></h1>
            <p className="mt-3 max-w-md text-white/80">Login to your account and explore a world of exclusive holiday benefits.</p>
            <div className="mt-8 max-w-md space-y-4">
              {[
                { i: Briefcase, t: "Manage Your Bookings", d: "View and manage your holiday bookings easily." },
                { i: Tag, t: "Exclusive Member Offers", d: "Access special discounts and member-only offers." },
                { i: Layout, t: "Personalized Dashboard", d: "Track your membership, referrals and rewards." },
                { i: Headphones, t: "24/7 Member Support", d: "We are here to help you anytime, anywhere." },
              ].map(({ i: Icon, t, d }) => (
                <div key={t} className="flex gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/60 bg-navy text-gold"><Icon className="h-5 w-5" /></div>
                  <div><div className="font-semibold">{t}</div><div className="text-sm text-white/70">{d}</div></div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex max-w-md items-center gap-3 rounded-xl border border-gold/40 bg-white/5 p-4">
              <Gift className="h-8 w-8 text-gold" />
              <div className="flex-1">
                <div className="font-semibold">Not a Member Yet?</div>
                <div className="text-xs text-white/70">Join JK Holidays and unlock amazing travel experiences.</div>
              </div>
              <Button asChild size="sm" className="bg-gold-gradient font-bold text-navy-deep"><Link to="/packages" search={{}}>EXPLORE</Link></Button>
            </div>
          </div>

          <div className="flex items-start justify-center lg:pt-6">
            <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-gold text-gold"><User className="h-6 w-6" /></div>
                <h2 className="mt-4 font-serif text-2xl font-bold text-navy">MEMBERSHIP LOGIN</h2>
                <p className="mt-1 text-sm text-muted-foreground">Login to access your account</p>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-navy">Email ID</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="h-11 pl-9" />
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
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2"><Checkbox defaultChecked /> Remember Me</label>
                  <button type="button" onClick={forgot} className="text-blue-600 hover:underline">Forgot Password?</button>
                </div>
                <Button type="submit" disabled={busy} className="h-12 w-full bg-gold-gradient font-bold text-navy-deep hover:opacity-90">
                  {busy ? "SIGNING IN..." : "LOGIN"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account? <Link to="/auth/register" className="font-semibold text-blue-600 hover:underline">Register Now</Link><br /><Link to="/admin-login" className="mt-2 inline-block text-xs font-semibold text-navy hover:underline">Staff? Admin Login →</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
