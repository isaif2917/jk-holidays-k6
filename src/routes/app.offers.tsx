import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useSiteOffers } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/app/offers")({ component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">Offers & Discounts</h1>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {useSiteOffers().map((o) => (
        <div key={o.title} className={`rounded-xl bg-gradient-to-br ${o.tone} p-5 text-white`}>
          <div className="text-xs font-bold">{o.title}</div>
          <div className="mt-2 font-serif text-3xl font-bold">Flat {o.pct}</div>
          <div className="text-sm">{o.desc}</div>
          <Button size="sm" className="mt-3 bg-gold-gradient text-navy-deep">BOOK NOW</Button>
        </div>
      ))}
    </div>
  </div>
)});
