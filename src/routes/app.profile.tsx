import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db, useMe, useRefresh } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/profile")({ head: () => createRouteHead("My Profile — JK Holidays", "Review and update your JK Holidays contact details."), component: Profile });

function Profile() {
  const { data: me } = useMe();
  const refresh = useRefresh();
  const [f, setF] = useState({ full_name: "", phone: "", city: "" });
  useEffect(() => {
    if (me) setF({ full_name: me.profile.full_name ?? "", phone: me.profile.phone ?? "", city: me.profile.city ?? "" });
  }, [me]);
  if (!me) return null;
  const save = async () => {
    const { error } = await db.from("profiles").update(f).eq("id", me.user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    refresh("me", "profiles");
  };
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">My Profile</h1>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="text-sm font-semibold text-navy">Full Name</label><Input className="mt-1" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><label className="text-sm font-semibold text-navy">Mobile</label><Input className="mt-1" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><label className="text-sm font-semibold text-navy">City</label><Input className="mt-1" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
          <div><label className="text-sm font-semibold text-navy">Email</label><Input className="mt-1" value={me.user.email ?? ""} disabled /></div>
          <div><label className="text-sm font-semibold text-navy">Member ID</label><Input className="mt-1" value={me.profile.member_code ?? ""} disabled /></div>
          <div><label className="text-sm font-semibold text-navy">Plan</label><Input className="mt-1" value={me.profile.plan ?? "—"} disabled /></div>
        </div>
        <Button onClick={save} className="mt-6 bg-gold-gradient font-bold text-navy-deep">SAVE CHANGES</Button>
      </Card>
    </div>
  );
}
