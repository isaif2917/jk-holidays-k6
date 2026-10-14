import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Plus, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, inr, useRefresh, useRows } from "@/lib/data";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({ meta: [{ title: "Membership Plans — JK Holidays Admin" }, { name: "description", content: "Create and edit membership plans." }] }),
  component: Plans,
});

const IMG = (slug: string) => `plan_image:${slug}`;
const empty = { slug: "", name: "", price: 0, original_price: 0, nights: 0, validity_years: 1, features: [] as string[], sort: 0, active: true, image: "" };

function Plans() {
  const refresh = useRefresh();
  const plans = useRows("membership_plans", () => db.from("membership_plans").select("*").order("sort"));
  const settings = useRows("admin_settings", () => db.from("admin_settings").select("*"));
  const s: Record<string, string> = {};
  (settings.data ?? []).forEach((r: any) => (s[r.key] = r.value));
  const [edit, setEdit] = useState<any>(null);
  const [cfg, setCfg] = useState<{ cloud: string; preset: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const setSetting = (key: string, value: string) => db.from("admin_settings").upsert({ key, value, updated_at: new Date().toISOString() });

  const upload = async (file: File) => {
    const cloud = s.cloudinary_cloud_name, preset = s.cloudinary_upload_preset;
    if (!cloud || !preset) { toast.error("Set up Cloudinary first"); setCfg({ cloud: cloud ?? "", preset: preset ?? "" }); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", preset); fd.append("folder", "jk-plans");
      const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Upload failed");
      setEdit((e: any) => ({ ...e, image: j.secure_url })); toast.success("Photo uploaded");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const save = async () => {
    const { image, id, ...p } = edit;
    p.slug = (p.slug || p.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    if (!p.name) return toast.error("Name required");
    const res = id ? await db.from("membership_plans").update(p).eq("id", id) : await db.from("membership_plans").insert(p);
    if (res.error) return toast.error(res.error.message);
    await setSetting(IMG(p.slug), image ?? "");
    toast.success("Plan saved"); setEdit(null); refresh("membership_plans", "admin_settings");
  };

  const toggle = async (p: any) => {
    const { error } = await db.from("membership_plans").update({ active: !p.active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh("membership_plans");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-2">
        <h1 className="font-serif text-3xl font-bold text-navy">Membership Plans</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCfg({ cloud: s.cloudinary_cloud_name ?? "", preset: s.cloudinary_upload_preset ?? "" })}><Settings2 className="mr-1 h-4 w-4" /> Cloudinary</Button>
          <Button className="bg-navy text-white" onClick={() => setEdit({ ...empty, sort: (plans.data?.length ?? 0) + 1 })}><Plus className="mr-1 h-4 w-4" /> Add Plan</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(plans.data ?? []).map((p: any) => (
          <Card key={p.id} className={`overflow-hidden ${p.active ? "" : "opacity-60"}`}>
            {s[IMG(p.slug)] ? <img src={s[IMG(p.slug)]} alt={p.name} className="h-36 w-full object-cover" /> : <div className="grid h-36 place-items-center bg-muted text-xs text-muted-foreground">No photo</div>}
            <div className="p-5">
              <div className="flex items-center justify-between"><div className="font-serif text-xl font-bold text-navy">{p.name}</div>{!p.active && <span className="text-xs text-rose-600">Disabled</span>}</div>
              <div className="mt-2 font-serif text-2xl font-bold text-gold">{inr(p.price)} <span className="text-sm text-muted-foreground line-through">{inr(p.original_price)}</span></div>
              <div className="text-xs text-muted-foreground">{p.nights} nights · {p.validity_years} years</div>
              <ul className="mt-2 list-disc pl-4 text-xs">{(p.features ?? []).slice(0, 4).map((f: string) => <li key={f}>{f}</li>)}</ul>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEdit({ ...p, image: s[IMG(p.slug)] ?? "" })}>Edit</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toggle(p)}>{p.active ? "Disable" : "Enable"}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{edit?.id ? "Edit plan" : "New plan"}</DialogTitle></DialogHeader>
          {edit && <div className="grid gap-3">
            <label className="text-xs">Name<Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-2">
              {([["price", "Price (₹)"], ["original_price", "Original price (₹)"], ["nights", "Nights"], ["validity_years", "Validity (years)"], ["sort", "Display order"]] as const).map(([k, l]) => (
                <label key={k} className="text-xs">{l}<Input type="number" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: +e.target.value })} /></label>))}
            </div>
            <label className="text-xs">Features (one per line)<Textarea rows={5} value={(edit.features ?? []).join("\n")} onChange={(e) => setEdit({ ...edit, features: e.target.value.split("\n").filter(Boolean) })} /></label>
            <div className="text-xs">Photo
              {edit.image && <img src={edit.image} alt="" className="mt-1 h-32 w-full rounded object-cover" />}
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed p-3 text-sm hover:bg-muted">
                <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload photo (Cloudinary)"}
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
              <Input className="mt-1" placeholder="…or paste image URL" value={edit.image} onChange={(e) => setEdit({ ...edit, image: e.target.value })} />
            </div>
          </div>}
          <DialogFooter><Button disabled={uploading} className="bg-navy text-white" onClick={save}>Save plan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cfg} onOpenChange={(o) => !o && setCfg(null)}>
        <DialogContent><DialogHeader><DialogTitle>Cloudinary setup</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">In Cloudinary go to Settings → Upload → Upload presets, create an <b>Unsigned</b> preset, then enter your cloud name and preset name here.</p>
          {cfg && <div className="grid gap-2">
            <Input placeholder="Cloud name" value={cfg.cloud} onChange={(e) => setCfg({ ...cfg, cloud: e.target.value.trim() })} />
            <Input placeholder="Unsigned upload preset" value={cfg.preset} onChange={(e) => setCfg({ ...cfg, preset: e.target.value.trim() })} />
          </div>}
          <DialogFooter><Button className="bg-navy text-white" onClick={async () => {
            await setSetting("cloudinary_cloud_name", cfg!.cloud); await setSetting("cloudinary_upload_preset", cfg!.preset);
            toast.success("Cloudinary saved"); setCfg(null); refresh("admin_settings");
          }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
