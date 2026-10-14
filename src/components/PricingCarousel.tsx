import { useCallback, useEffect, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { CaretLeft, CaretRight, CheckCircle, Crown, Diamond, Medal } from "@phosphor-icons/react";
import { plans } from "@/data/mock";

type Plan = (typeof plans)[number];

// Header colour per tier (Silver, Gold, Platinum) — built from theme tokens.
const tierStyle = [
  { Icon: Medal, header: "linear-gradient(135deg, var(--navy-soft), color-mix(in oklab, var(--navy-soft) 55%, var(--muted)))" },
  { Icon: Crown, header: "linear-gradient(135deg, var(--gold), var(--gold-dark))" },
  { Icon: Diamond, header: "linear-gradient(135deg, var(--navy-deep), var(--navy))" },
];

export function PricingCard({ plan, index, active }: { plan: Plan; index: number; active: boolean }) {
  const { Icon, header } = tierStyle[index % tierStyle.length]!;
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-[28px] bg-card text-navy-deep shadow-[0_30px_60px_-25px_color-mix(in_oklab,var(--navy-deep)_55%,transparent)] ring-1 ring-border/60 transition-shadow ${active ? "hover:shadow-[0_40px_70px_-25px_color-mix(in_oklab,var(--navy-deep)_65%,transparent)]" : ""}`}>
      <div className="relative px-6 pb-12 pt-6 text-white" style={{ background: header }}>
        <div className="flex items-center justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Icon size={22} weight="duotone" /></span>
          {plan.badge && <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold tracking-widest backdrop-blur">{plan.badge}</span>}
        </div>
        <h3 className="mt-4 font-display text-3xl font-bold">{plan.name}</h3>
        <p className="text-sm text-white/80">{plan.nights}</p>
        {/* Wavy transition into the white body */}
        <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-8 w-full text-card" aria-hidden>
          <path d="M0,22 C70,44 140,0 210,18 C280,36 340,10 400,20 L400,40 L0,40 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col px-6 pb-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold">₹{plan.price.toLocaleString("en-IN")}</span>
          <span className="text-sm text-muted-foreground line-through">₹{plan.original.toLocaleString("en-IN")}</span>
        </div>
        <p className="text-xs text-muted-foreground">{plan.validity}</p>
        <ul className="mt-5 flex-1 space-y-2.5 text-sm">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-gold-dark" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/auth/register"
          tabIndex={active ? 0 : -1}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-navy-deep text-sm font-semibold text-white transition hover:opacity-90"
        >
          {plan.highlight ? "Upgrade now" : "Join now"}
        </Link>
      </div>
    </article>
  );
}

/** Layered 3D pricing carousel: centre card in front, neighbours tucked behind. Swipe, drag, arrows, dots or keyboard. */
export function PricingCarousel() {
  const total = plans.length;
  const start = Math.max(0, plans.findIndex((p) => p.highlight));
  const [active, setActive] = useState(start);
  const go = useCallback((d: number) => setActive((i) => (i + d + total) % total), [total]);

  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 50 || info.velocity.x > 400) go(-1);
  };

  return (
    <div
      className="relative mx-auto max-w-5xl outline-none"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Membership plans"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      <div className="relative mx-auto h-[540px] w-full overflow-hidden sm:h-[580px]">
        {plans.map((p, i) => {
          let rel = (i - active + total) % total;
          if (rel > total / 2) rel -= total;
          const isActive = rel === 0;
          return (
            <motion.div
              key={p.name}
              className="absolute left-1/2 top-6 w-[76%] max-w-[300px] cursor-grab active:cursor-grabbing sm:max-w-[330px]"
              style={{ zIndex: isActive ? 30 : 20 - Math.abs(rel) }}
              initial={false}
              animate={{
                x: `calc(-50% + ${rel * (wide ? 72 : 58)}%)`,
                scale: isActive ? 1 : wide ? 0.86 : 0.8,
                opacity: isActive ? 1 : 0.7,
                rotateY: rel * -8,
                filter: isActive ? "blur(0px)" : "blur(0.5px)",
                y: isActive ? 0 : 24,
              }}
              whileHover={isActive ? { y: -6 } : undefined}
              transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={onDragEnd}
              onClick={() => !isActive && setActive(i)}
              aria-hidden={!isActive}
            >
              <PricingCard plan={p} index={i} active={isActive} />
            </motion.div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-5">
        <button type="button" onClick={() => go(-1)} aria-label="Previous plan" className="grid h-11 w-11 place-items-center rounded-full bg-card text-navy-deep shadow-md ring-1 ring-border transition hover:scale-105">
          <CaretLeft size={20} weight="bold" />
        </button>
        <div className="flex gap-2">
          {plans.map((p, i) => (
            <button key={p.name} type="button" aria-label={`Show ${p.name} plan`} aria-current={i === active} onClick={() => setActive(i)} className={`h-2 rounded-full transition-all ${i === active ? "w-7 bg-gold" : "w-2 bg-navy/20"}`} />
          ))}
        </div>
        <button type="button" onClick={() => go(1)} aria-label="Next plan" className="grid h-11 w-11 place-items-center rounded-full bg-card text-navy-deep shadow-md ring-1 ring-border transition hover:scale-105">
          <CaretRight size={20} weight="bold" />
        </button>
      </div>
    </div>
  );
}
