import { Star, Quote } from "lucide-react";
import { testimonials } from "@/data/mock";

/** Glass testimonial cards drifting slowly left → right in an endless loop. */
export function TestimonialsCarousel() {
  // Repeat enough to fill wide screens, then duplicate for a seamless loop.
  const base = [...testimonials, ...testimonials];
  const loop = [...base, ...base];
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-marquee-right gap-6 py-4 group-hover:[animation-play-state:paused]">
        {loop.map((t, i) => (
          <figure key={i} className="glass-card relative w-[320px] shrink-0 rounded-3xl p-6 text-white sm:w-[360px]">
            <Quote className="absolute right-5 top-5 h-10 w-10 text-gold/30" />
            <div className="flex text-gold">
              {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
            </div>
            <blockquote className="mt-3 text-sm italic leading-relaxed text-white/85">"{t.quote}"</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-white/15 pt-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gold-gradient font-bold text-navy-deep">{t.name[0]}</div>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-gold">{t.plan}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
