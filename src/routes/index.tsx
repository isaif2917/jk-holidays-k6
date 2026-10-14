import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { PricingCarousel } from "@/components/PricingCarousel";
import { HeartStraight, Diamond, Crown, CreditCard, Headset, GlobeHemisphereEast, UserPlus as PUserPlus, CalendarCheck as PCalendarCheck, Medal, AirplaneTilt } from "@phosphor-icons/react";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { FeaturedPackages } from "@/components/FeaturedPackages";

import { Button } from "@/components/ui/button";
import { plans, whyUs, destinations, howItWorks, stats, offers, testimonials } from "@/data/mock";
import heroImg from "@/assets/hero-explore-world.webp.asset.json";
import iconFamilies from "@/assets/icons/families.svg";
import iconResorts from "@/assets/icons/resorts.svg";
import iconCountries from "@/assets/icons/countries.svg";
import iconRating from "@/assets/icons/rating.svg";
import upgradeBanner from "@/assets/upgrade-banner.webp";
import goaImg from "@/assets/dest-goa.webp";
import baliImg from "@/assets/dest-bali.webp";
import maldivesImg from "@/assets/dest-maldives.webp";
import thailandImg from "@/assets/dest-thailand.webp";
import dubaiImg from "@/assets/dest-dubai.webp";
import { CountUp } from "@/components/CountUp";
import {
  Check, Sparkles, Wallet, Shield, Headphones, Globe, Heart, ArrowRight,
  Play, Star, UserPlus, Users, Building2, Award, CalendarCheck, MapPin, Search, BadgeCheck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

const whyIcons = [HeartStraight, Diamond, Crown, Headset, GlobeHemisphereEast];

// Photo + tier-coloured gradient for each membership card (Silver, Gold, Platinum).
const planArt = [
  { img: goaImg, gradient: "linear-gradient(135deg, color-mix(in oklab, var(--navy-soft) 70%, transparent), color-mix(in oklab, var(--muted) 30%, transparent))" },
  { img: baliImg, gradient: "linear-gradient(135deg, color-mix(in oklab, var(--gold-dark) 75%, transparent), color-mix(in oklab, var(--gold) 25%, transparent))" },
  { img: maldivesImg, gradient: "linear-gradient(135deg, color-mix(in oklab, var(--navy-deep) 80%, transparent), color-mix(in oklab, var(--gold) 30%, transparent))" },
];
const offerImages = [goaImg, thailandImg, baliImg, dubaiImg];

function Home() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative bg-background text-white">
        <div className="relative h-[520px] overflow-hidden md:h-[560px]">
          <img src={heroImg.url} alt="Infinity pool at a tropical beach resort at sunset" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/90 via-navy-deep/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
          <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-16 md:pt-24">
            <div className="max-w-xl">
              <h1 className="font-serif text-4xl font-bold leading-tight md:text-6xl">
                Travel More.<br />Spend Less.<br /><span className="text-gold">Live Better.</span>
              </h1>
              <p className="mt-4 text-base text-white/85 md:text-lg">
                Exclusive Holiday Membership with Premium Resorts Across India & International Destinations.
              </p>
            </div>
          </div>
        </div>
        <HeroSearch />
      </section>

      {/* Why Us */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-16">
        <SectionHeading eyebrow="WHY JK HOLIDAYS?" />
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {whyUs.map((w, i) => {
            const Icon = whyIcons[i];
            return (
              <div key={w.title} className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-gold-soft to-card text-gold-dark shadow-[0_12px_24px_-12px_color-mix(in_oklab,var(--gold-dark)_60%,transparent)] ring-1 ring-gold/30 transition-transform duration-300 hover:-translate-y-1 hover:rotate-3">
                  <Icon size={30} weight="duotone" />
                </div>
                <h3 className="mt-3 font-serif text-base font-bold text-navy">{w.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{w.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Plans */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <SectionHeading eyebrow="OUR MEMBERSHIP PLANS" />
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">Swipe, drag or tap the arrows to compare plans.</p>
          <div className="mt-6">
            <PricingCarousel />
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3 text-gold" /> All plans come with exciting referral benefits & reward points
          </p>
        </div>
      </section>

      {/* Destinations */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-16">
        <div className="flex items-center justify-between">
          <SectionHeading eyebrow="POPULAR DESTINATIONS" align="left" />
          <Link to="/destinations" className="text-xs font-bold tracking-widest text-gold hover:underline">VIEW ALL DESTINATIONS →</Link>
        </div>
        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-6">
          {destinations.map((d) => (
            <div key={d.name} className="group relative aspect-square w-40 shrink-0 snap-start overflow-hidden rounded-xl sm:w-48 md:w-auto">
              <img src={d.image} alt={d.name} loading="lazy" width={800} height={800} className="h-full w-full object-cover transition group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <div className="font-serif text-lg font-bold">{d.name}</div>
                <div className="text-xs text-white/80">{d.country}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="text-center">
            <div className="text-xs font-semibold tracking-widest text-gold">— JK Holidays —</div>
            <h2 className="mt-2 font-serif text-4xl font-bold text-navy">How It Works<span className="text-gold">.</span></h2>
          </div>
          {/* Desktop wave */}
          <div className="relative mt-10 hidden h-[340px] md:block">
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <path d="M0,230 C60,230 80,210 125,210 C220,210 280,90 375,90 C470,90 530,210 625,210 C720,210 780,90 875,90 C930,90 960,100 1000,110" fill="none" stroke="var(--gold)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
            {howItWorks.map((s, i) => {
              const Icon = [PUserPlus, PCalendarCheck, Medal, AirplaneTilt][i % 4]!;
              const low = i % 2 === 0;
              const left = 12.5 + i * 25;
              return (
                <div key={s.step}>
                  <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: low ? "70%" : "30%" }}>
                    <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-gold/30 blur-xl" />
                    <div className="grid h-14 w-14 place-items-center bg-card text-navy shadow-lg" style={{ clipPath: "polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)" }}>
                      <Icon size={26} weight="duotone" />
                    </div>
                  </div>
                  <div className="absolute w-[22%] -translate-x-1/2" style={{ left: `${left}%`, ...(low ? { top: "0%" } : { top: "48%" }) }}>
                    <div className="relative">
                      <span className="absolute -top-6 right-0 select-none font-sans text-8xl font-bold text-foreground/5">{s.step}</span>
                      <h3 className="relative text-lg font-semibold text-navy">{s.title}</h3>
                      <p className="relative mt-2 text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Mobile vertical */}
          <div className="relative mt-8 space-y-8 border-l-2 border-gold pl-8 md:hidden">
            {howItWorks.map((s, i) => {
              const Icon = [PUserPlus, PCalendarCheck, Medal, AirplaneTilt][i % 4]!;
              return (
                <div key={s.step} className="relative">
                  <div className="absolute -left-[3.05rem] top-0 grid h-10 w-10 place-items-center bg-card text-navy shadow-md" style={{ clipPath: "polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)" }}>
                    <Icon size={20} weight="duotone" />
                  </div>
                  <span className="absolute right-0 -top-4 text-6xl font-bold text-foreground/5">{s.step}</span>
                  <h3 className="font-semibold text-navy">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-12">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 gap-6 rounded-3xl border border-border bg-card p-8 shadow-sm md:grid-cols-4">
            {[
              { icon: iconFamilies, to: 10000, suffix: "+", decimals: 0, label: "Happy Families" },
              { icon: iconResorts, to: 500, suffix: "+", decimals: 0, label: "Premium Resorts" },
              { icon: iconCountries, to: 25, suffix: "+", decimals: 0, label: "Countries" },
              { icon: iconRating, to: 4.9, suffix: " ★", decimals: 1, label: "Customer Rating" },
            ].map((s) => {
              return (
                <div key={s.label} className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold-soft text-gold-dark">
                    <img src={s.icon} alt="" className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="font-display text-3xl font-bold tabular-nums text-navy md:text-4xl">
                      <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} />
                    </div>
                    <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <SectionHeading eyebrow="WHY MEMBERS LOVE JK HOLIDAYS" />
        </div>
        <div className="mt-4">
          <TestimonialsCarousel />
        </div>
      </section>

      {/* Featured Holiday Packages */}
      <FeaturedPackages limit={3} />



      {/* Refer & Earn */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 pb-16">
        <div className="flex flex-col gap-8 rounded-2xl bg-navy-gradient p-6 text-center text-white sm:p-8 md:flex-row md:items-center md:justify-between md:text-left">
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-widest text-gold">REFER & EARN BIG</div>
            <h3 className="mt-2 font-serif text-xl font-bold sm:text-2xl">Invite your friends to join JK Holidays and earn exciting rewards.</h3>
          </div>
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-3 text-center text-xs sm:gap-4">
              {[{i:UserPlus,l:"Invite Friends"},{i:Users,l:"They Join"},{i:Award,l:"Earn Rewards"}].map(({i:Icon,l},idx)=>(
                <div key={l} className="flex items-center gap-2 sm:gap-3">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/50 text-gold"><Icon className="h-5 w-5" /></div>
                    <div className="max-w-20 leading-tight">{l}</div>
                  </div>
                  {idx<2 && <ArrowRight className="h-4 w-4 shrink-0 text-gold" />}
                </div>
              ))}
            </div>
            <Button className="bg-gold-gradient font-bold text-navy-deep">KNOW MORE</Button>
          </div>
        </div>
      </section>

      {/* Offers */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 pb-16">
        <div className="flex items-center justify-between">
          <SectionHeading eyebrow="LATEST HOLIDAY OFFERS" align="left" />
          <Link to="/offers" className="text-xs font-bold tracking-widest text-gold hover:underline">VIEW ALL OFFERS →</Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
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
                <Link to="/offers">BOOK NOW</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

function SectionHeading({ eyebrow, light, align = "center" }: { eyebrow: string; light?: boolean; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <div className={`text-xs font-bold tracking-[0.3em] ${light ? "text-gold" : "text-navy"}`}>
        ━━ {eyebrow} ━━
      </div>
    </div>
  );
}

function HeroSearch() {
  const navigate = useNavigate();
  const [where, setWhere] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("2 Adults");
  const cities = destinations.map((d) => d.name);
  return (
    <div className="relative z-10 mx-auto -mt-24 max-w-5xl px-4 pb-6">
      <form
        onSubmit={(e) => { e.preventDefault(); navigate({ to: "/destinations" }); }}
        className="grid gap-2 rounded-3xl border border-white/40 bg-white/25 p-3 text-navy-deep shadow-2xl backdrop-blur-xl md:grid-cols-[1.4fr_1fr_1fr_auto] md:rounded-full md:p-2"
      >
        <label className="flex items-center gap-3 rounded-full px-4 py-2 hover:bg-white/40">
          <MapPin className="h-5 w-5 shrink-0 text-gold-dark" />
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold">Where</span>
            <input value={where} onChange={(e) => setWhere(e.target.value)} list="hero-cities" placeholder="Search destinations" className="bg-transparent text-sm outline-none placeholder:text-navy-deep/60" />
          </span>
        </label>
        <label className="flex items-center gap-3 rounded-full px-4 py-2 hover:bg-white/40 md:border-l md:border-white/40">
          <CalendarCheck className="h-5 w-5 shrink-0 text-gold-dark" />
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold">Check-in</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-sm outline-none" />
          </span>
        </label>
        <label className="flex items-center gap-3 rounded-full px-4 py-2 hover:bg-white/40 md:border-l md:border-white/40">
          <Users className="h-5 w-5 shrink-0 text-gold-dark" />
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold">Guests</span>
            <select value={guests} onChange={(e) => setGuests(e.target.value)} className="bg-transparent text-sm outline-none">
              {["1 Adult", "2 Adults", "2 Adults, 1 Child", "Family (4)", "Group (6+)"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </span>
        </label>
        <button type="submit" aria-label="Search" className="flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-6 py-3 font-bold text-navy-deep">
          <Search className="h-5 w-5" /> <span className="md:hidden">Search</span>
        </button>
        <datalist id="hero-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
      </form>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {cities.map((c) => (
          <Link key={c} to="/auth/login" className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-navy transition hover:border-gold hover:text-gold-dark">
            {c}
          </Link>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:mx-auto sm:flex sm:max-w-md sm:justify-center">
        <Button asChild className="h-11 rounded-full bg-gold-gradient px-8 font-bold text-navy-deep shadow-lg hover:opacity-90">
          <Link to="/auth/register">Register</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-full border-navy px-8 font-bold text-navy hover:bg-navy hover:text-white">
          <Link to="/auth/login">Login</Link>
        </Button>
      </div>
    </div>
  );
}
