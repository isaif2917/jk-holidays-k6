import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { plans } from "@/data/mock";
import resortImg from "@/assets/hero-resort.webp";

export function MembershipCarousel() {
  // Start at "Gold" (highlight) if present
  const initial = Math.max(0, plans.findIndex((p) => p.highlight));
  const [index, setIndex] = useState(initial === -1 ? 0 : initial);
  const total = plans.length;

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  // touch swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    if (dx > 40) prev();
    else if (dx < -40) next();
    setTouchStart(null);
  };

  return (
    <div className="relative mx-auto w-full max-w-sm select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="relative h-[560px] overflow-x-clip">
        {plans.map((p, i) => {
          const offset = ((i - index + total) % total);
          const rel = offset > total / 2 ? offset - total : offset; // -1, 0, 1
          const isActive = rel === 0;
          const translate = rel * 78; // percent
          const scale = isActive ? 1 : 0.85;
          const opacity = isActive ? 1 : 0.35;
          const z = isActive ? 20 : 10;

          return (
            <button
              type="button"
              key={p.name}
              onClick={() => !isActive && setIndex(i)}
              aria-label={`Show ${p.name} plan`}
              className="absolute inset-0 mx-auto block transition-all duration-500 ease-out"
              style={{
                transform: `translateX(${translate}%) scale(${scale})`,
                opacity,
                zIndex: z,
                pointerEvents: Math.abs(rel) > 1 ? "none" : "auto",
              }}
            >
              <div
                className={`relative mx-3 overflow-hidden rounded-3xl bg-white text-left text-navy-deep shadow-2xl ring-1 ring-gold/20 ${
                  isActive ? "shadow-gold/30" : ""
                }`}
              >
                {p.badge && (
                  <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-gold-gradient px-4 py-1 text-[10px] font-bold tracking-widest text-navy-deep shadow-lg">
                    {p.badge}
                  </div>
                )}

                <div className="relative m-3 mt-10 h-40 overflow-hidden rounded-2xl">
                  <img src={resortImg} alt={p.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-navy-deep/25" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="font-serif text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg">
                      {p.name}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 text-center">
                  <div className="text-xs font-semibold text-muted-foreground">{p.nights}</div>

                  <ul className="mt-3 space-y-1.5 text-left text-[13px]">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-baseline justify-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{p.original.toLocaleString()}
                    </span>
                    <span className="font-serif text-2xl font-bold text-gold">
                      ₹{p.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">/{p.validity.split(" ")[0].toLowerCase()}</span>
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-gold">
                    Limited-time member pricing
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm" className="flex-1 bg-gold-gradient font-bold text-navy-deep hover:opacity-90">
                      <Link to="/auth/register">
                        <ArrowRight className="mr-1 h-3.5 w-3.5" /> Join Now
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1 border-gold/50 text-navy hover:bg-gold-soft">
                      <Link to="/membership">Know More</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous plan"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-navy shadow-md ring-1 ring-gold/40 transition hover:bg-gold-soft"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {plans.map((p, i) => (
            <button
              key={p.name}
              type="button"
              aria-label={`Go to ${p.name}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-gold" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Next plan"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-navy shadow-md ring-1 ring-gold/40 transition hover:bg-gold-soft"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
