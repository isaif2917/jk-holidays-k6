import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { MapPin, Phone, Mail, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CONTACT, holidayPackages } from "@/data/mock";

const searchSchema = z.object({ interest: z.string().optional() });

export const Route = createFileRoute("/contact")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Contact Us — JK Holidays" },
      { name: "description", content: "Get in touch with JK Holidays. Book a free presentation today." },
      { property: "og:title", content: "Contact Us — JK Holidays" },
      { property: "og:description", content: "Book a free JK Holidays presentation or request a callback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { interest } = Route.useSearch();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    interest: interest ?? "",
    message: interest ? `I'd like to know more about the ${interest}.` : "",
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.phone.trim().length < 10) {
      toast.error("Please add your name and a valid mobile number.");
      return;
    }
    toast.success("Thank you!", {
      description: "Our travel advisor will call you back shortly.",
    });
    setForm({ name: "", phone: "", email: "", interest: "", message: "" });
  };

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="font-serif text-4xl font-bold text-navy">Book Free Presentation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {interest
            ? `You're enquiring about the ${interest}. Leave your details and we'll call you back.`
            : "Tell us how you like to travel and we'll design the right membership for you."}
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl font-bold text-navy">Get in Touch</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div className="whitespace-pre-line">
                  {CONTACT.company}
                  {"\n"}
                  {CONTACT.address}
                </div>
              </div>
              <a href={CONTACT.phoneHref} className="flex gap-3 hover:text-gold">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-gold" />
                {CONTACT.phone}
              </a>
              <a href={`mailto:${CONTACT.email}`} className="flex gap-3 hover:text-gold">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-gold" />
                {CONTACT.email}
              </a>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="flex gap-3 hover:text-green-600"
              >
                <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-green-600" />
                Chat on WhatsApp
              </a>
              <div className="flex gap-3">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div>Mon – Sat, 10:00 AM – 7:00 PM</div>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Name</label>
                <Input className="mt-1" value={form.name} onChange={set("name")} />
              </div>
              <div>
                <label className="text-sm font-semibold">Mobile</label>
                <Input className="mt-1" value={form.phone} onChange={set("phone")} />
              </div>
              <div>
                <label className="text-sm font-semibold">Email</label>
                <Input type="email" className="mt-1" value={form.email} onChange={set("email")} />
              </div>
              <div>
                <label className="text-sm font-semibold">Interested in</label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.interest}
                  onChange={set("interest")}
                >
                  <option value="">Membership plans</option>
                  {holidayPackages.map((p) => (
                    <option key={p.slug} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Message</label>
                <Textarea rows={4} className="mt-1" value={form.message} onChange={set("message")} />
              </div>
              <Button type="submit" className="w-full bg-gold-gradient font-bold text-navy-deep hover:opacity-90">
                BOOK PRESENTATION
              </Button>
            </div>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
