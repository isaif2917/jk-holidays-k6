import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { offers } from "@/data/mock";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/offers")({
  head: () => ({ meta: [{ title: "Offers — JK Holidays" }, { name: "description", content: "Latest holiday offers and discounts for members." }] }),
  component: () => (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="font-serif text-4xl font-bold text-navy">Latest Holiday Offers</h1>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {offers.map((o) => (
            <div key={o.title} className={`rounded-xl bg-gradient-to-br ${o.tone} p-6 text-white shadow-lg`}>
              <div className="text-xs font-bold tracking-widest">{o.title.toUpperCase()}</div>
              <div className="mt-2 font-serif text-4xl font-bold">Flat {o.pct}</div>
              <div className="mt-1 text-sm">{o.desc}</div>
              <Button className="mt-4 bg-gold-gradient font-bold text-navy-deep">BOOK NOW</Button>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
});
