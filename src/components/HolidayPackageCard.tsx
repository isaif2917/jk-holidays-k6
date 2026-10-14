import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Share2, Star, Clock, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT, holidayPackages } from "@/data/mock";

type Pkg = (typeof holidayPackages)[number];

export function HolidayPackageCard({ pkg }: { pkg: Pkg }) {
  const [photo, setPhoto] = useState(0);
  const total = pkg.photos.length;

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.origin + "/destinations" : "";
    const data = { title: pkg.name, text: `Check out the ${pkg.name} from JK Holidays`, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* user dismissed */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${data.text} — ${url}`);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-md ring-1 ring-border transition hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={pkg.photos[photo]}
          alt={`${pkg.name} photo ${photo + 1}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500"
        />
        <span className="absolute left-0 top-3 rounded-r-md bg-gold px-2.5 py-1 text-xs font-bold text-navy-deep shadow">
          {pkg.tag}
        </span>
        <button
          type="button"
          aria-label={`Previous photo of ${pkg.name}`}
          onClick={() => setPhoto((p) => (p - 1 + total) % total)}
          className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-navy shadow hover:bg-background"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Next photo of ${pkg.name}`}
          onClick={() => setPhoto((p) => (p + 1) % total)}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-navy shadow hover:bg-background"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {pkg.photos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === photo ? "w-5 bg-gold" : "w-1.5 bg-white/60"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            {pkg.location}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
            <Star className="h-3.5 w-3.5 fill-current" />
            {pkg.rating} ({pkg.reviews})
          </span>
        </div>

        <h3 className="mt-2 font-serif text-lg font-bold text-navy">{pkg.name}</h3>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {pkg.duration}
        </p>

        <ul className="mt-3 flex-1 space-y-1 text-xs text-muted-foreground">
          {pkg.highlights.map((h) => (
            <li key={h} className="flex gap-1.5">
              <span className="text-gold">•</span>
              {h}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs font-semibold text-navy/70">
          Pricing shared after a quick callback.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Button asChild className="flex-1 bg-gold-gradient text-xs font-bold text-navy-deep hover:opacity-90">
            <Link to="/contact" search={{ interest: pkg.name }}>
              REQUEST CALLBACK
            </Link>
          </Button>
          <a
            href={`${CONTACT.whatsapp}?text=${encodeURIComponent(`Hi JK Holidays, I'm interested in the ${pkg.name}.`)}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp about ${pkg.name}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border text-green-600 hover:bg-green-50"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={share}
            aria-label={`Share ${pkg.name}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border text-navy hover:bg-muted"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
