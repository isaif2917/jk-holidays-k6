import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Edit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, useMe, useProfilesMap, useRefresh, useRows } from "@/lib/data";
import { createAdmin, createStaff, removeRole, updateRoleAccount } from "@/lib/admin.functions";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/roles")({ head: () => createRouteHead("Admins & Roles — JK Holidays", "Manage administrators and staff roles for JK Holidays."), component: Roles });

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operations_manager", label: "Operations Manager" },
  { value: "other", label: "Others (type the role)" },
] as const;
const roleTitle = (role: string, label: string | null) =>
  label ?? (ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

function Roles() {
  const refresh = useRefresh();
  const { data: me } = useMe();
  const { map } = useProfilesMap();
  const roles = useRows("user_roles", () => db.from("user_roles").select("user_id, role, role_label"));
  const create = useServerFn(createAdmin);
  const staff = useServerFn(createStaff);
  const remove = useServerFn(removeRole);
  const updateAcct = useServerFn(updateRoleAccount);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ full_name: "", email: "", password: "", role: "admin", roleLabel: "" });
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [editBusy, setEditBusy] = useState(false);
  const rows = (roles.data ?? []).filter((r: any) => r.role !== "member");

  const submit = async () => {
    setBusy(true);
    try {
      if (f.role === "admin") {
        await create({ data: { full_name: f.full_name, email: f.email, password: f.password } });
        toast.success(`Admin created. They can now sign in at Admin Login with ${f.email}`);
      } else {
        await staff({ data: { full_name: f.full_name, email: f.email, password: f.password, role: f.role as any, roleLabel: f.roleLabel } });
        toast.success(`Staff account created (${roleTitle(f.role, f.role === "other" ? f.roleLabel : null)}).`);
      }
      setOpen(false); setF({ full_name: "", email: "", password: "", role: "admin", roleLabel: "" });
      refresh("user_roles"); refresh("profiles");
    } catch (e: any) { toast.error(e?.message ?? "Could not create the account"); }
      setBusy(false);
  };

  const submitEdit = async () => {
    if (!edit) return;
    setEditBusy(true);
    try {
      await updateAcct({ data: {
        userId: edit.userId, oldRole: edit.oldRole, role: edit.role, roleLabel: edit.roleLabel || undefined,
        full_name: edit.full_name, email: edit.email, password: edit.password || undefined,
      } });
      toast.success("Account updated");
      setEdit(null);
      refresh("user_roles", "profiles");
    } catch (e: any) { toast.error(e?.message ?? "Could not update the account"); }
    setEditBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><h1 className="font-serif text-3xl font-bold text-navy">Admins & Roles</h1><Button className="bg-navy text-white" onClick={() => setOpen(true)}>+ Add Admin / Staff</Button></div>
      <Card className="overflow-x-auto p-5"><table className="w-full min-w-[560px] text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2">Name</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody>
        {rows.map((r: any) => {
          const p = map[r.user_id];
          return (
            <tr key={`${r.user_id}-${r.role}`} className="whitespace-nowrap border-b"><td className="py-3 font-medium text-navy">{p?.full_name || "—"}</td><td>{p?.email}</td><td><Badge>{roleTitle(r.role, r.role_label)}</Badge></td>
              <td className="text-right"><div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setEdit({
                  userId: r.user_id, oldRole: r.role, role: r.role, roleLabel: r.role_label ?? "",
                  full_name: p?.full_name ?? "", email: p?.email ?? "", password: "",
                })}><Edit className="mr-1 h-4 w-4" />Edit</Button>
                {r.user_id !== me?.user.id && <Button size="sm" variant="outline" onClick={async () => {
                  try { await remove({ data: { userId: r.user_id, role: r.role } }); toast.success("Role removed"); refresh("user_roles"); } catch (e: any) { toast.error(e?.message); }
                }}>Remove</Button>}
              </div></td></tr>
          );
        })}
        {!rows.length && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">{roles.isLoading ? "Loading…" : "No accounts yet."}</td></tr>}
      </tbody></table></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add admin or staff member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
            <Input placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <Input placeholder="Password (min 6 characters)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select>
            {f.role === "other" && <Input placeholder="Type the role (e.g. Field Executive)" maxLength={60} value={f.roleLabel} onChange={(e) => setF({ ...f, roleLabel: e.target.value })} />}
            <p className="text-xs text-muted-foreground">Admins sign in at Admin Login. Staff roles are recorded here for your team directory.</p>
          </div>
          <DialogFooter><Button disabled={busy} className="bg-navy text-white" onClick={submit}>{busy ? "Creating…" : "Create account"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
