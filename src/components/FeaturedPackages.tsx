import { Link } from "@tanstack/react-router";
import { holidayPackages } from "@/data/mock";
import { HolidayPackageCard } from "@/components/HolidayPackageCard";
import { useFeaturedPackages } from "@/lib/catalog";

export function FeaturedPackages({
  title = "Featured Holiday Packages",
  subtitle = "Photos, ratings, and enquiry options — pricing shared after callback.",
  limit,
  showViewAll = true,
}: {
  title?: string;
  subtitle?: string;
  limit?: number;
  showViewAll?: boolean;
}) {
  const managed = useFeaturedPackages();
  /** Packages published from Admin → Settings take over; bundled defaults fill in until then. */
  const source = managed.length ? managed : holidayPackages.map((p) => ({ ...p, photos: [...p.photos] }));
  const items = limit ? source.slice(0, limit) : source;
  return (
    <section className="bg-background py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-navy sm:text-3xl">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {showViewAll && (
            <Link
              to="/destinations"
              className="shrink-0 text-xs font-bold uppercase tracking-widest text-gold hover:underline"
            >
              View All →
            </Link>
          )}
        </div>
        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.slug} className="w-[85vw] max-w-xs shrink-0 snap-start sm:w-auto sm:max-w-none">
              <HolidayPackageCard pkg={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
