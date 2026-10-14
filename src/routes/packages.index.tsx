import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { membershipPackages } from "@/data/mock";

export const Route = createFileRoute("/packages/")({
  head: () => ({
    meta: [
      { title: "Membership Packages — JK Holidays" },
      {
        name: "description",
        content:
          "Silver Escape, Gold Horizon and Platinum Voyage — membership plans built around real travel benefits.",
      },
      { property: "og:title", content: "Membership Packages — JK Holidays" },
      {
        property: "og:description",
        content: "Compare Silver Escape, Gold Horizon and Platinum Voyage holiday memberships.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PackagesIndex,
});

function PackagesIndex() {
  return (
    <PublicLayout>
      <section className="bg-navy-gradient py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-center font-serif text-3xl font-bold sm:text-4xl">
            Membership plans built around real travel benefits
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/80">
            Pick the plan that fits how your family travels. Request a purchase and our team
            activates your membership after payment confirmation.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {membershipPackages.map((p) => (
              <div
                key={p.slug}
                className={`flex flex-col overflow-hidden rounded-xl bg-card text-navy-deep shadow-xl ${
                  p.badge === "MOST POPULAR" ? "ring-4 ring-gold" : ""
                }`}
              >
                <div
                  className={`px-6 py-4 text-center font-serif text-xl font-bold ${
                    p.badge === "MOST POPULAR" ? "bg-gold-gradient text-navy-deep" : "bg-muted text-navy"
                  }`}
                >
                  {p.title}
                </div>
                <div className="flex flex-1 flex-col p-6 text-center">
                  {p.badge && (
                    <div className="mx-auto mb-3 rounded-md bg-gold-soft px-3 py-1 text-xs font-bold text-navy">
                      {p.badge}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground line-through">
                    ₹{p.original.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-1 font-serif text-4xl font-bold text-navy">
                    ₹{p.price.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-muted-foreground">
                    {p.nights} · {p.validity}
                  </div>
                  <ul className="mt-5 flex-1 space-y-2 text-left text-sm">
                    {p.included.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex gap-2">
                    <Button asChild className="flex-1 bg-gold-gradient font-bold text-navy-deep hover:opacity-90">
                      <Link to="/packages/$slug" params={{ slug: p.slug }} search={{ request: 1 }}>
                        JOIN NOW
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 font-bold">
                      <Link to="/packages/$slug" params={{ slug: p.slug }} search={{}}>
                        KNOW MORE
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-white/70">
            <Sparkles className="mr-1 inline h-3 w-3 text-gold" />
            Not sure which plan suits you?{" "}
            <Link to="/contact" search={{}} className="font-bold text-gold hover:underline">
              Book a free presentation <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
