import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, Eye, EyeOff } from "lucide-react";
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
      <PasswordCard />
    </div>
  );
}

function PasswordCard() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const change = async () => {
    if (pw.length < 6) return toast.error("Password must be at least 6 characters.");
    if (pw !== confirm) return toast.error("Passwords don't match.");
    setBusy(true);
    const { error } = await db.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated — use it on your next sign-in.");
    setPw(""); setConfirm("");
  };
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-soft/60 text-navy"><KeyRound className="h-5 w-5" /></span>
        <div>
          <h2 className="font-serif text-lg font-bold text-navy">Password</h2>
          <p className="text-xs text-muted-foreground">For security your current password is stored scrambled and can't be displayed. Set a new one below.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold text-navy">New password
          <div className="relative mt-1">
            <Input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" className="pr-10" />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="text-xs font-semibold text-navy">Confirm new password<Input className="mt-1" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat the password" /></label>
      </div>
      <Button disabled={busy || pw.length < 6} onClick={change} className="mt-4 bg-navy text-white">{busy ? "UPDATING…" : "CHANGE PASSWORD"}</Button>
    </Card>
  );
}

function DangerZone() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const deleteAccount = useServerFn(deleteOwnAccount);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const del = async () => {
    if (confirmText !== "DELETE") return toast.error('Type DELETE in the box to confirm.');
    setBusy(true);
    try {
      await deleteAccount({ data: { userId: me!.user.id } });
      await db.auth.signOut();
      toast.success("Your account and its saved records were deleted.");
      navigate({ to: "/", replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete the account");
      setBusy(false);
    }
  };
  return (
    <Card className="border-rose-200 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-600"><ShieldCheck className="h-5 w-5" /></span>
        <div>
          <h2 className="font-serif text-lg font-bold text-navy">Delete my account</h2>
          <p className="text-xs text-muted-foreground">Permanently removes your account, bookings, payments, wallet history and requests. This cannot be undone.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-navy">Type DELETE to confirm<Input className="mt-1 w-40" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" /></label>
        <Button disabled={busy} variant="destructive" onClick={del}><Trash2 className="mr-1 h-4 w-4" />{busy ? "DELETING…" : "DELETE MY ACCOUNT"}</Button>
      </div>
    </Card>
  );
}
