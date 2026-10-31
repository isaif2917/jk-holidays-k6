import { useCallback, useEffect, useState } from "react";
import { motion, type PanInfo, type Variants } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { CaretLeft, CaretRight, CheckCircle, Crown, Diamond, Medal } from "@phosphor-icons/react";
import { useSitePlans, type SitePlan } from "@/lib/catalog";

type Plan = SitePlan;

// Header colour per tier (Silver, Gold, Platinum) — built from theme tokens.
const tierStyle = [
  { Icon: Medal, header: "linear-gradient(135deg, var(--navy-soft), color-mix(in oklab, var(--navy-soft) 55%, var(--muted)))" },
  { Icon: Crown, header: "linear-gradient(135deg, var(--gold), var(--gold-dark))" },
  { Icon: Diamond, header: "linear-gradient(135deg, var(--navy-deep), var(--navy))" },
];

// Staggered reveal for the feature list — replays each time a card comes to front.
const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -16, filter: "blur(2px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 340, damping: 26 } },
};

export function PricingCard({ plan, index, active }: { plan: Plan; index: number; active: boolean }) {
  const { Icon, header } = tierStyle[index % tierStyle.length]!;
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-[28px] bg-card text-navy-deep shadow-[0_30px_60px_-25px_color-mix(in_oklab,var(--navy-deep)_55%,transparent)] ring-1 ring-border/60 transition-shadow ${active ? "hover:shadow-[0_40px_70px_-25px_color-mix(in_oklab,var(--navy-deep)_65%,transparent)]" : ""}`}>
      <div className="relative overflow-hidden px-6 pb-12 pt-6 text-white" style={{ background: header }}>
        {/* Diagonal light sweep across the coloured header of the front card */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-12 bg-white/15"
          animate={active ? { x: ["0%", "420%"] } : { x: "0%" }}
          transition={active ? { duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 } : { duration: 0.3 }}
        />
        <div className="relative flex items-center justify-between">
          <motion.span
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur"
            animate={active ? { y: [0, -5, 0] } : { y: 0 }}
            transition={active ? { duration: 2.6, ease: "easeInOut", repeat: Infinity } : { duration: 0.3 }}
          >
            <Icon size={22} weight="duotone" />
          </motion.span>
          {plan.badge && (
            <motion.span
              className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold tracking-widest backdrop-blur"
              animate={active ? { scale: 1 } : { scale: 0.92 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              {plan.badge}
            </motion.span>
          )}
        </div>
        <motion.h3
          className="mt-4 font-display text-3xl font-bold"
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0.9, y: 4 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          {plan.name}
        </motion.h3>
        <p className="text-sm text-white/80">{plan.nights}</p>
        {/* Wavy transition into the white body */}
        <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-8 w-full text-card" aria-hidden>
          <path d="M0,22 C70,44 140,0 210,18 C280,36 340,10 400,20 L400,40 L0,40 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col px-6 pb-6">
        <motion.div
          className="flex items-baseline gap-2"
          animate={active ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0.8 }}
          style={{ transformOrigin: "left center" }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
        >
          <span className="font-display text-4xl font-bold">₹{plan.price.toLocaleString("en-IN")}</span>
          <span className="text-sm text-muted-foreground line-through">₹{plan.original.toLocaleString("en-IN")}</span>
        </motion.div>
        <p className="text-xs text-muted-foreground">{plan.validity}</p>
        <motion.ul
          className="mt-5 flex-1 space-y-2.5 text-sm"
          variants={listVariants}
          initial="hidden"
          animate={active ? "show" : "hidden"}
        >
          {plan.features.map((f) => (
            <motion.li key={f} variants={itemVariants} className="flex items-start gap-2.5">
              <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-gold-dark" />
              <span>{f}</span>
            </motion.li>
          ))}
        </motion.ul>
        <motion.div
          className="mt-6"
          whileHover={active ? { scale: 1.03, y: -2 } : undefined}
          whileTap={active ? { scale: 0.97 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <Link
            to="/auth/register"
            tabIndex={active ? 0 : -1}
            className="flex h-12 items-center justify-center rounded-full bg-navy-deep text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            {plan.highlight ? "Upgrade now" : "Join now"}
          </Link>
        </motion.div>
      </div>
    </article>
  );
}

/** Layered 3D pricing carousel: centre card in front, neighbours tucked behind. Swipe, drag, arrows, dots or keyboard. */
export function PricingCarousel() {
  const plans = useSitePlans();
  const total = plans.length;
  const start = Math.max(0, plans.findIndex((p) => p.highlight));
  const [active, setActive] = useState(start);
  useEffect(() => { setActive(start); }, [start]);
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
      className="relative mx-auto max-w-7xl outline-none"
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
              className="absolute left-1/2 top-6 w-[80%] max-w-[340px] cursor-grab active:cursor-grabbing sm:max-w-[400px] lg:max-w-[440px]"
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
