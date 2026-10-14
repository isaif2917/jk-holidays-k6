import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { testimonials } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Review = { name: string; role: string; quote: string; rating: number };

function Stars({ n, size = 18, onPick }: { n: number; size?: number; onPick?: (v: number) => void }) {
  return (
    <div className="flex gap-1 text-gold-dark">
      {Array.from({ length: 5 }).map((_, k) =>
        onPick ? (
          <button key={k} type="button" aria-label={`${k + 1} star${k ? "s" : ""}`} onClick={() => onPick(k + 1)} className="transition hover:scale-110">
            <Star size={size} weight={k < n ? "fill" : "regular"} />
          </button>
        ) : (
          <Star key={k} size={size} weight={k < n ? "fill" : "regular"} />
        ),
      )}
    </div>
  );
}

/** White testimonial cards drifting slowly left → right, plus an "Add your review" form. */
export function TestimonialsCarousel() {
  const qc = useQueryClient();
  const approved = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("name,location,message,rating").eq("approved", true).order("created_at", { ascending: false }).limit(12);
      return (data ?? []).map((r) => ({ name: r.name, role: r.location ?? "JK Holidays Member", quote: r.message, rating: r.rating }));
    },
  });
  const all: Review[] = [...(approved.data ?? []), ...testimonials.map((t) => ({ name: t.name, role: t.plan, quote: t.quote, rating: 5 }))];
  const base = all.length < 6 ? [...all, ...all] : all;
  const loop = [...base, ...base];

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 1 || message.trim().length < 5) return toast.error("Please add your name and a short review.");
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({ name: name.trim().slice(0, 80), message: message.trim().slice(0, 600), rating });
    setBusy(false);
    if (error) return toast.error("Couldn't send your review. Please try again.");
    toast.success("Thank you! Your review will appear once approved.");
    setName(""); setMessage(""); setRating(5); setOpen(false);
    qc.invalidateQueries({ queryKey: ["reviews"] });
  };

  return (
    <div>
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="flex w-max animate-marquee-right gap-5 px-2 py-8 group-hover:[animation-play-state:paused] sm:gap-7">
          {loop.map((t, i) => (
            <figure
              key={i}
              className="flex w-[280px] shrink-0 flex-col rounded-[28px] border border-border/60 bg-card p-6 shadow-[0_18px_40px_-18px_color-mix(in_oklab,var(--navy-deep)_35%,transparent)] sm:w-[400px] sm:p-8"
            >
              <Stars n={t.rating} />
              <blockquote className="mt-4 flex-1 text-base leading-relaxed text-navy-deep sm:text-lg">“{t.quote}”</blockquote>
              <figcaption className="mt-6 border-t border-border pt-5">
                <div className="font-medium text-navy-deep">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl border-t border-border px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold tracking-[0.25em] text-muted-foreground">ADD YOUR REVIEW</div>
          {!open && (
            <Button type="button" onClick={() => setOpen(true)} className="rounded-full bg-navy-deep px-6 text-white hover:opacity-90">
              Write a review
            </Button>
          )}
        </div>
        {open && (
          <form onSubmit={submit} className="mt-4 grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">Your rating</span>
              <Stars n={rating} size={22} onPick={setRating} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} className="h-12 rounded-2xl bg-card" />
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How was your JK Holidays experience?" maxLength={600} className="h-12 rounded-2xl bg-card" />
              <Button type="submit" disabled={busy} className="h-12 rounded-2xl bg-navy-deep px-7 text-white hover:opacity-90">
                {busy ? "Sending…" : "Submit"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
