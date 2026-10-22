import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Globe, Mail, Phone, MapPin, Save } from "lucide-react";
import { db, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/settings")({ head: () => createRouteHead("Settings — JK Holidays Admin", "Edit the website name, contact email, phone number and address."), component: AdminSettings });

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

  useEffect(() => {
    if (!values.site_email && settings.data?.length) {
      const map: Record<string, string> = {};
      settings.data.forEach((r: any) => (map[r.key] = r.value ?? ""));
      setValues(map);
    }
  }, [settings.data]);

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
      <p className="text-xs text-muted-foreground">Changes appear on the public website footer, header phone number and Contact Us page shortly after saving.</p>
    </div>
  );
}
