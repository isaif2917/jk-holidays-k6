import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSiteOffers } from "@/lib/catalog";
import goaImg from "@/assets/dest-goa.webp";
import baliImg from "@/assets/dest-bali.webp";
import thailandImg from "@/assets/dest-thailand.webp";
import dubaiImg from "@/assets/dest-dubai.webp";

const offerImages = [goaImg, thailandImg, baliImg, dubaiImg];

/** Capsule offer cards — shared by the home page and the member Offers page. */
export function OfferCards({ bookTo = "/offers" }: { bookTo?: "/offers" | "/app/request" }) {
  const offers = useSiteOffers();
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
      {offers.map((o, i) => (
        <div
          key={o.title}
          className={`flex flex-col items-center rounded-[999px] bg-card p-3 pb-8 text-center shadow-[0_25px_50px_-20px_color-mix(in_oklab,var(--navy-deep)_45%,transparent)] ring-1 ring-border transition-transform hover:-translate-y-2 ${i % 2 === 1 ? "lg:mt-16" : ""}`}
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[999px]">
            <img src={offerImages[i % offerImages.length]} alt={o.title} loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-gold-gradient px-3 py-1 text-[10px] font-bold tracking-widest text-navy-deep shadow">{o.pct}</span>
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-navy sm:text-xl">{o.title}</h3>
          <p className="mt-1 font-condensed text-sm text-muted-foreground">{o.desc}</p>
          <div className="mt-2 font-condensed text-navy">
            <span className="text-xs">Flat - </span>
            <span className="text-2xl sm:text-3xl">{o.pct}</span>
          </div>
          <p className="font-condensed text-[11px] text-muted-foreground">*Conditions Apply</p>
          <Button asChild size="sm" className="mt-3 rounded-full bg-gold-gradient px-5 font-bold text-navy-deep">
            <Link to={bookTo}>BOOK NOW</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
