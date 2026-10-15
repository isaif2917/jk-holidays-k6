import { db, useRows } from "@/lib/data";
import { plans as mockPlans, offers as mockOffers } from "@/data/mock";

export type SitePlan = (typeof mockPlans)[number] & { slug: string };
export type SiteOffer = { title: string; pct: string; desc: string; tone: string };

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
