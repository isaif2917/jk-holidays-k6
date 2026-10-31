import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Globe, Mail, Phone, MapPin, Save, ImagePlus, Trash2, Link2, FileText, Upload, Plus, Pencil, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FeaturedPackage } from "@/lib/catalog";
import { db, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/settings")({ head: () => createRouteHead("Settings — JK Holidays Admin", "Edit the website name, contact details and homepage hero images."), component: AdminSettings });

const KEYS = [
  { key: "site_name", label: "Site / Company Name", icon: Globe, placeholder: "JK Holidays Pvt. Ltd.", multiline: false },
  { key: "site_email", label: "Website Email", icon: Mail, placeholder: "jkholiday27@gmail.com", multiline: false },
  { key: "site_phone", label: "Website Phone Number", icon: Phone, placeholder: "9019663540", multiline: false },
  { key: "site_address", label: "Website Address", icon: MapPin, placeholder: "#769, 1st Main, 1st Cross, Ring Road,\nKengeri Satellite Town, Bangalore – 560060", multiline: true },
];

function AdminSettings() {
  const refresh = useRefresh();
  const settings = useRows("admin_settings", () => db.from("admin_settings").select("*"));
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [heroes, setHeroes] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!values.site_email && settings.data?.length) {
      const map: Record<string, string> = {};
      settings.data.forEach((r: any) => (map[r.key] = r.value ?? ""));
      setValues(map);
      try { setHeroes(JSON.parse(map.hero_images || "[]")); } catch { setHeroes([]); }
    }
  }, [settings.data]);

  const saveHeroList = async (list: string[]) => {
    const { error } = await db.from("admin_settings").upsert({ key: "hero_images", value: JSON.stringify(list), updated_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    setHeroes(list);
    refresh("admin_settings", "site-settings");
  };

  const uploadHero = async (file: File) => {
    const s: Record<string, string> = {};
    (settings.data ?? []).forEach((r: any) => (s[r.key] = r.value));
    const cloud = s.cloudinary_cloud_name, preset = s.cloudinary_upload_preset;
    if (!cloud || !preset) return toast.error("Set up Cloudinary in Membership Plans → Cloudinary first, then upload hero images here.");
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", preset); fd.append("folder", "jk-hero");
      const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Upload failed");
      await saveHeroList([...heroes, j.secure_url]);
      toast.success("Hero image added — the homepage carousel updates automatically.");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const save = async () => {
    setBusy(true);
    const updates = KEYS.map(({ key }) => ({ key, value: (values[key] ?? "").trim() }));
    for (const u of updates) {
      const { error } = await db.from("admin_settings").upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() });
      if (error) { setBusy(false); return toast.error(`${u.key}: ${error.message}`); }
    }
    setBusy(false);
    toast.success("Website details saved — the footer and contact page update right away.");
    refresh("admin_settings", "site-settings");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">Settings</h1>
        <div className="text-sm text-muted-foreground">Edit the contact details shown on the website footer and Contact Us page.</div>
      </div>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {KEYS.map(({ key, label, icon: Icon, placeholder, multiline }) => (
            <div key={key} className={multiline ? "md:col-span-2" : ""}>
              <label className="flex items-center gap-2 text-sm font-semibold text-navy"><Icon className="h-4 w-4 text-gold" />{label}</label>
              {multiline
                ? <Textarea className="mt-1" rows={3} placeholder={placeholder} value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                : <Input className="mt-1" placeholder={placeholder} value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />}
            </div>
          ))}
        </div>
        <Button disabled={busy} onClick={save} className="mt-6 bg-gold-gradient font-bold text-navy-deep"><Save className="mr-2 h-4 w-4" />{busy ? "SAVING…" : "SAVE SETTINGS"}</Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-navy">Homepage Hero Images</h2>
            <p className="text-xs text-muted-foreground">These images rotate in the website's top hero carousel. Add several to create a slideshow.</p>
          </div>
          <input ref={heroFileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadHero(e.target.files[0])} />
          <Button disabled={uploading} className="bg-navy text-white" onClick={() => heroFileRef.current?.click()}><ImagePlus className="mr-1 h-4 w-4" />{uploading ? "Uploading…" : "Upload image"}</Button>
        </div>
        <div className="mt-4 flex gap-2">
          <Input placeholder="…or paste an image URL (https://…)" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
          <Button variant="outline" onClick={async () => {
            const url = newUrl.trim();
            if (!/^https:\/\//.test(url)) return toast.error("Enter a valid https image URL");
            await saveHeroList([...heroes, url]); setNewUrl(""); toast.success("Hero image added");
          }}><Link2 className="mr-1 h-4 w-4" /> Add URL</Button>
        </div>
        {heroes.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {heroes.map((url, i) => (
              <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-lg border">
                <img src={url} alt={`Hero ${i + 1}`} className="h-32 w-full object-cover" />
                <button aria-label={`Remove hero ${i + 1}`} onClick={() => saveHeroList(heroes.filter((_, j) => j !== i))}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-rose-600 shadow hover:bg-white"><Trash2 className="h-4 w-4" /></button>
                <span className="absolute bottom-2 left-2 rounded bg-navy-deep/80 px-2 py-0.5 text-[10px] font-bold text-white">#{i + 1}</span>
              </div>
            ))}
          </div>
        ) : <p className="mt-4 text-sm text-muted-foreground">No custom hero images yet — the homepage uses its default image until you add one.</p>}
      </Card>
      <DestinationChipsCard />
      <FeaturedPackagesCard />
      <TourDocCard kind="educational" />
      <TourDocCard kind="corporate" />
      <p className="text-xs text-muted-foreground">Changes appear on the public website footer, header phone number, Contact Us page, hero carousel, search-bar destinations and the tour pages shortly after saving.</p>
    </div>
  );
}

/** Homepage destination chips under the hero search bar, editable from Admin → Settings. */
function DestinationChipsCard() {
  const refresh = useRefresh();
  const q = useRows("admin_settings", () => db.from("admin_settings").select("*"));
  const [chips, setChips] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loaded && q.data?.length) {
      const row = q.data.find((r: any) => r.key === "destination_chips");
      try {
        const list = JSON.parse(row?.value || "[]");
        setChips(Array.isArray(list) ? list : []);
      } catch { setChips([]); }
      setLoaded(true);
    }
  }, [q.data, loaded]);

  const save = async (list: string[]) => {
    setBusy(true);
    const { error } = await db.from("admin_settings").upsert({ key: "destination_chips", value: JSON.stringify(list), updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return toast.error(error.message);
    setChips(list);
    refresh("admin_settings", "site-settings", "destination-chips");
  };

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (chips.includes(name)) return toast.error("That place is already in the list.");
    setDraft("");
    save([...chips, name]);
    toast.success("Destination added");
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-navy">Homepage Destination Chips</h2>
          <p className="text-xs text-muted-foreground">The place names shown under the homepage search bar. Add, remove or reorder them here.</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="e.g. Goa"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button disabled={busy} className="bg-navy text-primary-foreground" onClick={add}><Plus className="mr-1 h-4 w-4" />Add place</Button>
      </div>
      {chips.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip, i) => (
            <span key={`${chip}-${i}`} className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1.5 text-sm font-semibold text-navy">
              {chip}
              <button
                aria-label={`Remove ${chip}`}
                disabled={busy}
                onClick={() => save(chips.filter((_, j) => j !== i))}
                className="text-rose-500 hover:text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : <p className="mt-4 text-sm text-muted-foreground">No custom places yet — the homepage shows its default list until you add some.</p>}
    </Card>
  );
}

/** Tour brochure shown on the public Educational / Corporate tour pages. */
function TourDocCard({ kind }: { kind: "educational" | "corporate" }) {
  const refresh = useRefresh();
  const q = useRows("admin_settings", () => db.from("admin_settings").select("*"));
  const [doc, setDoc] = useState<{ name: string; path: string } | null | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const settingsKey = kind === "educational" ? "educational_tour_doc" : "corporate_tour_doc";
  const title = kind === "educational" ? "Educational Tour Document" : "Corporate Tour Document";

  useEffect(() => {
    if (doc === undefined && q.data?.length) {
      const row = q.data.find((r: any) => r.key === settingsKey);
      try {
        const d = JSON.parse(row?.value || "null");
        setDoc(d && typeof d.path === "string" && d.path ? { name: typeof d.name === "string" && d.name ? d.name : "Tour document", path: d.path } : null);
      } catch { setDoc(null); }
    }
  }, [q.data, doc, settingsKey]);

  const save = async (d: { name: string; path: string } | null) => {
    const { error } = await db.from("admin_settings").upsert({ key: settingsKey, value: JSON.stringify(d), updated_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    setDoc(d);
    refresh("admin_settings", `tour-doc-${kind}`);
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const path = `tour-docs/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "-")}`;
      const { error: upErr } = await db.storage.from("documents").upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (upErr) throw new Error(upErr.message);
      await save({ name: file.name, path });
      toast.success(`${title} published — it now appears on the public tour page.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-soft/60 text-navy"><FileText className="h-5 w-5" /></span>
          <div>
            <h2 className="font-serif text-xl font-bold text-navy">{title}</h2>
            <p className="text-xs text-muted-foreground">Shown as a downloadable document on the public {kind === "educational" ? "Educational" : "Corporate"} Tour page.</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" hidden onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ""; }} />
        <Button disabled={uploading} className="bg-navy text-primary-foreground" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-1 h-4 w-4" />{uploading ? "Uploading…" : "Upload document"}
        </Button>
      </div>
      {doc ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-4">
          <span className="truncate text-sm font-semibold text-navy">{doc.name}</span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/api/public/tour-doc?key=${kind}`} target="_blank" rel="noreferrer">Preview</a>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => { save(null); toast.success(`${title} removed.`); }}>
              <Trash2 className="mr-1 h-4 w-4" />Remove
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No document published yet — the tour page shows a "coming soon" note until you upload one.</p>
      )}
    </Card>
  );
}
