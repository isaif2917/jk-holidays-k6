import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, fmtDate, useRefresh, useRows } from "@/lib/data";

export const Route = createFileRoute("/admin/offers")({
  head: () => ({ meta: [{ title: "Offers — JK Holidays Admin" }, { name: "description", content: "Manage the holiday offers shown on the website." }] }),
  component: Offers,
});

const empty = { title: "", description: "", discount: "", valid_till: "", active: true };

function Offers() {
  const refresh = useRefresh();
  const q = useRows("offers", () => db.from("offers").select("*").order("created_at"));
  const [edit, setEdit] = useState<any>(null);

  const save = async () => {
    if (!edit.title.trim()) return toast.error("Title required");
    const { id, created_at, ...o } = edit;
    o.valid_till = o.valid_till || null;
    const res = id ? await db.from("offers").update(o).eq("id", id) : await db.from("offers").insert(o);
    if (res.error) return toast.error(res.error.message);
    toast.success("Offer saved"); setEdit(null); refresh("offers");
  };
  const toggle = async (o: any) => {
    const { error } = await db.from("offers").update({ active: !o.active }).eq("id", o.id);
    if (error) return toast.error(error.message);
    refresh("offers");
  };
  const remove = async (o: any) => {
    if (!confirm(`Delete "${o.title}"?`)) return;
    const { error } = await db.from("offers").delete().eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Offer deleted"); refresh("offers");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy">Offers</h1>
          <p className="text-sm text-muted-foreground">Active offers appear in "Latest Holiday Offers" on the homepage.</p>
        </div>
        <Button className="bg-navy text-white" onClick={() => setEdit({ ...empty })}><Plus className="mr-1 h-4 w-4" /> Add Offer</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(q.data ?? []).map((o: any) => (
          <Card key={o.id} className={`p-5 ${o.active ? "" : "opacity-60"}`}>
            <div className="flex justify-between text-xs font-bold tracking-widest text-gold">{o.title.toUpperCase()}{!o.active && <span className="text-rose-600">HIDDEN</span>}</div>
            <div className="mt-2 font-serif text-3xl font-bold text-navy">{o.discount}</div>
            <div className="text-sm text-muted-foreground">{o.description}</div>
            <div className="mt-1 text-xs text-muted-foreground">Valid till: {fmtDate(o.valid_till)}</div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setEdit({ ...o, valid_till: o.valid_till ?? "" })}>Edit</Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => toggle(o)}>{o.active ? "Hide" : "Show"}</Button>
              <Button size="sm" variant="outline" className="text-rose-600" onClick={() => remove(o)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent><DialogHeader><DialogTitle>{edit?.id ? "Edit offer" : "New offer"}</DialogTitle></DialogHeader>
          {edit && <div className="grid gap-3">
            <label className="text-xs">Title<Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="Early Bird Offer" /></label>
            <label className="text-xs">Discount<Input value={edit.discount ?? ""} onChange={(e) => setEdit({ ...edit, discount: e.target.value })} placeholder="50% OFF" /></label>
            <label className="text-xs">Description<Input value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="On Domestic Holidays" /></label>
            <label className="text-xs">Valid till (optional)<Input type="date" value={edit.valid_till} onChange={(e) => setEdit({ ...edit, valid_till: e.target.value })} /></label>
          </div>}
          <DialogFooter><Button className="bg-navy text-white" onClick={save}>Save offer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
