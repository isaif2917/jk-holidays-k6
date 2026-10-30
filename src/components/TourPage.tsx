import { Link } from "@tanstack/react-router";
import { Briefcase, Download, FileText, GraduationCap, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { useSiteContact, useTourDoc } from "@/lib/catalog";

type Kind = "educational" | "corporate";

/** Shared page for the public Educational / Corporate tour pages; the brochure is managed in Admin → Settings. */
export function TourPage({ kind, title, intro, bullets }: { kind: Kind; title: string; intro: string; bullets: string[] }) {
  const doc = useTourDoc(kind);
  const c = useSiteContact();
  const Icon = kind === "educational" ? GraduationCap : Briefcase;

  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex items-center gap-3 text-gold">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/60 bg-navy-deep/60"><Icon className="h-6 w-6" /></span>
            <span className="text-xs font-bold uppercase tracking-[0.3em]">JK Holidays</span>
          </div>
          <h1 className="mt-4 font-serif text-4xl font-bold md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {bullets.map((b, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="font-serif text-lg font-bold text-navy">{String(i + 1).padStart(2, "0")}</div>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-soft/60 text-navy"><FileText className="h-5 w-5" /></span>
            <div>
              <h2 className="font-serif text-xl font-bold text-navy">Tour Document</h2>
              <p className="text-sm text-muted-foreground">The detailed itinerary, inclusions and pricing shared by our team.</p>
            </div>
          </div>
          {doc ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-4">
              <span className="truncate text-sm font-semibold text-navy">{doc.name}</span>
              <Button asChild className="bg-navy text-primary-foreground">
                <a href={`/api/public/tour-doc?key=${kind}`} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Open document</a>
              </Button>
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              Our team is preparing the document — it will appear here as soon as it is published. Meanwhile, reach out and we will share the details personally.
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-navy-gradient p-8 text-center text-white">
          <p className="w-full font-serif text-2xl font-bold">Plan a {kind === "educational" ? "Educational" : "Corporate"} Tour with us</p>
          <Button asChild className="bg-gold-gradient font-bold text-navy-deep"><Link to="/contact">Contact Us</Link></Button>
          <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold hover:text-navy-deep">
            <a href={c.phoneHref}><Phone className="mr-2 h-4 w-4" />{c.phone}</a>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
