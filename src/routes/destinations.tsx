import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { HolidayPackageCard } from "@/components/HolidayPackageCard";
import { destinations, holidayPackages } from "@/data/mock";
import { useSiteDestinations } from "@/lib/catalog";

export const Route = createFileRoute("/destinations")({
  head: () => ({
    meta: [
      { title: "Destinations — JK Holidays" },
      {
        name: "description",
        content: "Explore premium holiday packages across India and internationally with JK Holidays.",
      },
      { property: "og:title", content: "Destinations — JK Holidays" },
      {
        property: "og:description",
        content: "Maldives, Bali, Dubai, Thailand, Kashmir and Goa holiday packages for members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DestinationsPage,
});

function DestinationsPage() {
  const liveDestinations = useSiteDestinations();
  const popularDestinations = liveDestinations.length ? liveDestinations : destinations;
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="font-serif text-3xl font-bold text-navy sm:text-4xl">Popular Holiday Packages</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Photos, ratings, and enquiry options — pricing shared after callback.
        </p>

        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible lg:grid-cols-3">
          {holidayPackages.map((p) => (
            <div key={p.slug} className="w-[85vw] max-w-xs shrink-0 snap-start sm:w-auto sm:max-w-none">
              <HolidayPackageCard pkg={p} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy-gradient py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">Where members travel</h2>
          <p className="mt-1 text-sm text-white/75">
            Over 500 partner resorts across India and 25+ countries.
          </p>
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-6">
            {popularDestinations.map((d) => (
              <div key={d.name} className="group relative aspect-square w-40 shrink-0 snap-start overflow-hidden rounded-xl sm:w-48 md:w-auto">
                <img
                  src={d.image}
                  alt={d.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <div className="font-serif text-lg font-bold">{d.name}</div>
                  <div className="text-xs text-white/80">{d.country}</div>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/packages"
            search={{}}
            className="mt-8 inline-block text-xs font-bold uppercase tracking-widest text-gold hover:underline"
          >
            View membership packages →
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
