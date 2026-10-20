import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { plans, planSlug } from "@/data/mock";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/membership")({
  head: () => createRouteHead("Holiday Membership Plans — JK Holidays", "Compare Silver, Gold and Platinum JK Holidays memberships and choose the travel benefits that suit you."),
  component: () => (
    <PublicLayout>
      <section className="bg-navy-gradient py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-center font-serif text-4xl font-bold">Our Membership Plans</h1>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={`overflow-hidden rounded-xl bg-white text-navy-deep shadow-xl ${p.highlight ? "ring-4 ring-gold" : ""}`}>
                <div className={`px-6 py-4 text-center font-serif text-xl font-bold ${p.highlight ? "bg-gold-gradient text-navy-deep" : "bg-slate-100"}`}>{p.name.toUpperCase()}</div>
                <div className="p-6 text-center">
                  <div className="text-sm text-muted-foreground line-through">₹{p.original.toLocaleString()}</div>
                  <div className="mt-1 font-serif text-4xl font-bold">₹ {p.price.toLocaleString()}</div>
                  <div className="mt-2 text-xs font-semibold text-muted-foreground">{p.nights} · {p.validity}</div>
                  <ul className="mt-5 space-y-2 text-left text-sm">
                    {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-gold" />{f}</li>)}
                  </ul>
                  <div className="mt-6 flex gap-2">
                    <Button asChild className="flex-1 bg-gold-gradient font-bold text-navy-deep hover:opacity-90">
                      <Link to="/packages/$slug" params={{ slug: planSlug[p.name] }} search={{ request: 1 }}>JOIN NOW</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 font-bold">
                      <Link to="/packages/$slug" params={{ slug: planSlug[p.name] }} search={{}}>KNOW MORE <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  )
});
