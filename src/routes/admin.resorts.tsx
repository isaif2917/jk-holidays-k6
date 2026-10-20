import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, useRefresh, useRows } from "@/lib/data";
import { StatusBadge } from "@/components/ui/status-badge";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/resorts")({ head: () => createRouteHead("Destinations — JK Holidays Admin", "Add, edit and publish the destinations displayed on JK Holidays."), component: AdminResorts });

type Resort = { id?: string; name: string; location: string; image_url: string; rating: number; description: string; status: string };
const empty: Resort = { name: "", location: "", image_url: "", rating: 4.5, description: "", status: "Published" };

function AdminResorts() {
  const q = useRows<Resort>("resorts", () => db.from("resorts").select("*").order("created_at", { ascending: false }));
  const refresh = useRefresh();
  const [form, setForm] = useState<Resort | null>(null);
  const [imgOk, setImgOk] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<Resort | null>(null);

  const open = (r: Resort) => { setImgOk(true); setForm({ ...empty, ...r, image_url: r.image_url ?? "", description: r.description ?? "" }); };

  const save = async () => {
    if (!form) return;
    if (!form.name.trim() || !form.location.trim()) return toast.error("Name and location are required");
    setSaving(true);
    const payload = { name: form.name.trim(), location: form.location.trim(), image_url: form.image_url.trim() || null, rating: Number(form.rating) || 4.5, description: form.description || null, status: form.status };
    const { error } = form.id ? await db.from("resorts").update(payload).eq("id", form.id) : await db.from("resorts").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Property updated" : "Property added");
    setForm(null);
    refresh("resorts");
  };

  const remove = async (r: Resort) => {
    if (!confirm(`Delete ${r.name}?`)) return;
    const { error } = await db.from("resorts").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Property deleted");
    refresh("resorts");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-bold text-navy">Destinations</h1>
        <Button className="bg-navy text-white" onClick={() => open(empty)}>+ Add Property</Button>
      </div>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !q.data?.length ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No destinations yet. Click "Add Property".</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {q.data.map((r) => (
            <Card key={r.id} className="overflow-hidden rounded-2xl p-0">
              <div className="relative">{r.image_url ? <img src={r.image_url} alt={r.name} className="h-52 w-full object-cover" /> : <div className="grid h-52 place-items-center bg-muted text-xs text-muted-foreground">No image</div>}<span className="absolute right-3 top-3"><StatusBadge s={r.status ?? "Published"} /></span></div>
              <div className="p-4">
                <div className="font-serif text-lg font-bold text-navy">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.location} · ★ {r.rating}</div>
                {r.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => open(r)}>Edit</Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setView(r)}>View</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Edit Property" : "Add Property"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <Input placeholder="Resort name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Location (e.g. Goa, India)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Input placeholder="Image URL (e.g. https://res.cloudinary.com/...)" value={form.image_url}
                onChange={(e) => { setImgOk(true); setForm({ ...form, image_url: e.target.value }); }} />
              {form.image_url.trim() && (imgOk
                ? <img src={form.image_url.trim()} alt="Preview" onError={() => setImgOk(false)} className="h-40 w-full rounded-md object-cover" />
                : <p className="text-xs text-destructive">Image could not load — check the URL.</p>)}
              <Input type="number" step="0.1" min="0" max="5" placeholder="Rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Published</option><option>Draft</option></select>
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button className="w-full bg-navy text-white" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</Button>
              {form.id && <Button variant="destructive" className="w-full" onClick={() => { remove(form); setForm(null); }}>Delete</Button>}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent>
          {view && (<>
            <DialogHeader><DialogTitle className="font-serif">{view.name}</DialogTitle></DialogHeader>
            {view.image_url && <img src={view.image_url} alt={view.name} className="h-56 w-full rounded-md object-cover" />}
            <div className="text-sm text-muted-foreground">{view.location} · ★ {view.rating} · <StatusBadge s={view.status ?? "Published"} /></div>
            {view.description && <p className="text-sm">{view.description}</p>}
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
