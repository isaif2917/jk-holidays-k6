import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — JK Holidays" },
      { name: "description", content: "Set a new password for your JK Holidays account." },
      { property: "og:title", content: "Reset Password — JK Holidays" },
      { property: "og:description", content: "Set a new password for your JK Holidays account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/app/dashboard" });
  };
  return (
    <div className="grid min-h-screen place-items-center bg-navy-deep px-4">
      <form onSubmit={save} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="font-serif text-2xl font-bold text-navy">Set a new password</h1>
        <Input required minLength={6} type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-4 h-11" />
        <Button type="submit" className="mt-4 w-full bg-gold-gradient font-bold text-navy-deep">SAVE PASSWORD</Button>
      </form>
    </div>
  );
}
