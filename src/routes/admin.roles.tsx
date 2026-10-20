import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { db, useMe, useProfilesMap, useRefresh, useRows } from "@/lib/data";
import { createAdmin, removeAdmin } from "@/lib/admin.functions";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/roles")({ head: () => createRouteHead("Admins & Roles — JK Holidays", "Manage administrator accounts and access for JK Holidays."), component: Roles });

function Roles() {
  const refresh = useRefresh();
  const { data: me } = useMe();
  const { map } = useProfilesMap();
  const roles = useRows("user_roles", () => db.from("user_roles").select("user_id, role").eq("role", "admin"));
  const create = useServerFn(createAdmin);
  const remove = useServerFn(removeAdmin);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ full_name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await create({ data: f });
      toast.success(`Admin created. They can now sign in at Admin Login with ${f.email}`);
      setOpen(false); setF({ full_name: "", email: "", password: "" });
      refresh("user_roles"); refresh("profiles");
    } catch (e: any) { toast.error(e?.message ?? "Could not create admin"); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><h1 className="font-serif text-3xl font-bold text-navy">Admins & Roles</h1><Button className="bg-navy text-white" onClick={() => setOpen(true)}>+ Add Admin</Button></div>
      <Card className="overflow-x-auto p-5"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2">Admin</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody>
        {(roles.data ?? []).map((r: any) => {
          const p = map[r.user_id];
          return (
            <tr key={r.user_id} className="border-b"><td className="py-3 font-medium text-navy">{p?.full_name || "Admin"}</td><td>{p?.email}</td><td><Badge>Admin</Badge></td>
              <td className="text-right">{r.user_id !== me?.user.id && <Button size="sm" variant="outline" onClick={async () => {
                try { await remove({ data: { userId: r.user_id } }); toast.success("Admin access removed"); refresh("user_roles"); } catch (e: any) { toast.error(e?.message); }
              }}>Remove</Button>}</td></tr>
          );
        })}
      </tbody></table></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add new admin</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
            <Input placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <Input placeholder="Password (min 6 characters)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <p className="text-xs text-muted-foreground">The new admin signs in at Admin Login with this email and password.</p>
          </div>
          <DialogFooter><Button disabled={busy} className="bg-navy text-white" onClick={submit}>{busy ? "Creating…" : "Create admin"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
