import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { createRouteHead } from "@/lib/route-meta";
export const Route = createFileRoute("/about")({
  head: () => createRouteHead("About JK Holidays — Premium Holiday Membership", "Learn about JK Holidays, our premium holiday memberships and approach to travel experiences."),
  component: () => (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="font-serif text-4xl font-bold text-navy">About JK Holidays</h1>
        <p className="mt-4 text-muted-foreground">JK Holidays is a premium holiday membership brand offering affordable luxury holidays across India and international destinations. With over 10,000 happy families and 500+ premium resorts, we deliver unforgettable experiences with 24/7 dedicated support.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["Our Mission", "Make luxury travel affordable and accessible to every family."],
            ["Our Vision", "Be the most trusted holiday membership brand in South Asia."],
            ["Our Values", "Trust, transparency, and unforgettable member experiences."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border bg-white p-6"><div className="font-serif text-xl font-bold text-navy">{t}</div><p className="mt-2 text-sm text-muted-foreground">{d}</p></div>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
});
