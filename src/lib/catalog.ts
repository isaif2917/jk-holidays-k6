import { db, useRows } from "@/lib/data";
import { plans as mockPlans, offers as mockOffers, CONTACT } from "@/data/mock";


export type SitePlan = (typeof mockPlans)[number] & { slug: string };
export type SiteOffer = { title: string; pct: string; desc: string; tone: string };
export type SiteDestination = { name: string; country: string; image: string };

const tones = ["from-rose-500 to-rose-700", "from-indigo-600 to-purple-700", "from-teal-500 to-cyan-700", "from-amber-500 to-orange-700"];

/** Membership plans managed in Admin → Membership Plans (active only). */
export function useSitePlans(): SitePlan[] {
  const q = useRows("membership_plans", () => db.from("membership_plans").select("*").eq("active", true).order("sort"));
  if (!q.data?.length) return mockPlans.map((p) => ({ ...p, slug: p.name.toLowerCase() }));
  const mid = Math.floor(q.data.length / 2);
  return q.data.map((p: any, i: number) => ({
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    original: Number(p.original_price),
    nights: `${p.nights} Nights / ${p.nights + 1} Days`,
    validity: `${p.validity_years} ${p.validity_years === 1 ? "Year" : "Years"} Validity`,
    features: p.features ?? [],
    highlight: i === mid,
    badge: i === mid ? "MOST POPULAR" : i === q.data!.length - 1 && i !== mid ? "BEST VALUE" : undefined,
  }));
}

/** Offers managed in Admin → Offers (active, not expired). */
export function useSiteOffers(): SiteOffer[] {
  const q = useRows("offers", () => db.from("offers").select("*").eq("active", true).order("created_at"));
  if (!q.data) return mockOffers;
  const today = new Date().toISOString().slice(0, 10);
  return q.data
    .filter((o: any) => !o.valid_till || o.valid_till >= today)
    .map((o: any, i: number) => ({ title: o.title, pct: o.discount ?? "", desc: o.description ?? "", tone: tones[i % tones.length]! }));
}

/** Destinations published from Admin → Destinations, with bundled defaults until properties are added. */
export function useSiteDestinations(): SiteDestination[] {
  const q = useRows("published-destinations", () => db.from("resorts").select("id,name,location,image_url,status,created_at")
    .in("status", ["Published", "Active"]).order("created_at", { ascending: false }));
  if (!q.data?.length) return [];
  return q.data.map((r: any) => ({ name: r.name, country: r.location, image: r.image_url ?? "" }));
}

/** Site contact details managed in Admin → Settings, falling back to bundled defaults. */
export function useSiteContact() {
  const q = useRows("site-settings", () => db.from("admin_settings").select("key,value").in("key", ["site_name", "site_email", "site_phone", "site_address"]));
  const map: Record<string, string> = {};
  (q.data ?? []).forEach((r: any) => { if (r.value) map[r.key] = r.value; });
  const phone = map.site_phone || CONTACT.phone;
  const digits = phone.replace(/\D/g, "");
  return {
    company: map.site_name || CONTACT.company,
    email: map.site_email || CONTACT.email,
    phone,
    phoneHref: `tel:${digits}`,
    whatsapp: `https://wa.me/${digits.length >= 10 ? "91" + digits.slice(-10) : CONTACT.whatsapp.split("/").pop()}`,
    address: map.site_address || CONTACT.address,
  };
}

