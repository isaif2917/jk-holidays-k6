import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Create Account — JK Holidays" },
      { name: "description", content: "Register for a JK Holidays member account." },
      { property: "og:title", content: "Create Account — JK Holidays" },
      { property: "og:description", content: "Join JK Holidays and start travelling more for less." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password.length < 6) return toast.error("Password must be at least 6 characters.");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app/dashboard`,
        data: {
          full_name: f.name,
          phone: f.phone,
          city: f.city,
          referral_code: new URLSearchParams(window.location.search).get("ref")?.trim().slice(0, 64) || null,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-navy-deep text-white">
      <header className="bg-navy-gradient px-4 py-2"><div className="mx-auto max-w-7xl"><Link to="/"><Logo /></Link></div></header>
      <div className="mx-auto grid max-w-md gap-4 px-4 py-12">
        {sent ? (
          <div className="rounded-2xl bg-white p-8 text-center text-navy shadow-2xl">
            <h2 className="font-serif text-2xl font-bold">Your account is ready</h2>
            <p className="mt-2 text-sm text-muted-foreground">You can now sign in with {f.email} and the password you created.</p>
            <Button asChild className="mt-6 bg-gold-gradient font-bold text-navy-deep"><Link to="/auth/login">SIGN IN</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl bg-white p-6 text-navy shadow-2xl sm:p-8">
            <h2 className="text-center font-serif text-2xl font-bold">Create Your Account</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">Join JK Holidays today</p>
            <div className="mt-6 space-y-4">
              <div><label className="text-sm font-semibold">Full Name</label><Input required value={f.name} onChange={set("name")} className="mt-1 h-11" placeholder="Your name" /></div>
              <div><label className="text-sm font-semibold">Mobile Number</label><Input required value={f.phone} onChange={set("phone")} className="mt-1 h-11" placeholder="+91" /></div>
              <div><label className="text-sm font-semibold">City</label><Input value={f.city} onChange={set("city")} className="mt-1 h-11" /></div>
              <div><label className="text-sm font-semibold">Email</label><Input required type="email" value={f.email} onChange={set("email")} className="mt-1 h-11" /></div>
              <div><label className="text-sm font-semibold">Password</label><Input required type="password" value={f.password} onChange={set("password")} className="mt-1 h-11" /></div>
              <Button type="submit" disabled={busy} className="h-12 w-full bg-gold-gradient font-bold text-navy-deep">{busy ? "CREATING..." : "CREATE ACCOUNT"}</Button>
              <p className="text-center text-sm text-muted-foreground">Already a member? <Link to="/auth/login" className="font-semibold text-blue-600">Login</Link></p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
