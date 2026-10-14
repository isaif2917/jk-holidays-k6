import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { testimonials } from "@/data/mock";

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);
  const total = testimonials.length;
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

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
      <div className="relative h-[280px] overflow-x-clip">
        {testimonials.map((t, i) => {
          const offset = (i - index + total) % total;
          const rel = offset > total / 2 ? offset - total : offset;
          const isActive = rel === 0;
          return (
            <div
              key={t.name}
              className="absolute inset-0 mx-3 transition-all duration-500 ease-out"
              style={{
                transform: `translateX(${rel * 80}%) scale(${isActive ? 1 : 0.88})`,
                opacity: isActive ? 1 : 0.3,
                zIndex: isActive ? 20 : 10,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <div className="relative h-full rounded-3xl border border-gold/20 bg-white p-6 shadow-2xl">
                <Quote className="absolute right-5 top-5 h-10 w-10 text-gold/20" />
                <div className="flex text-gold">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-sm italic leading-relaxed text-muted-foreground">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3 border-t pt-4">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-gold-gradient font-bold text-navy-deep">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-navy">{t.name}</div>
                    <div className="text-xs text-gold">{t.plan}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous testimonial"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow ring-1 ring-gold/40 hover:bg-gold-soft"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {testimonials.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-label={`Testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-gold" : "w-1.5 bg-navy/20"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          aria-label="Next testimonial"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow ring-1 ring-gold/40 hover:bg-gold-soft"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
