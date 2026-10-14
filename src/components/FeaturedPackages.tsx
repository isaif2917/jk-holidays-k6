import { Link } from "@tanstack/react-router";
import { holidayPackages } from "@/data/mock";
import { HolidayPackageCard } from "@/components/HolidayPackageCard";

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
  const items = limit ? holidayPackages.slice(0, limit) : holidayPackages;
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4">
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
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <HolidayPackageCard key={p.slug} pkg={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
