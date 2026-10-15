import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { Check, ArrowLeft, Building2, Smartphone, Copy } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONTACT, membershipPackages } from "@/data/mock";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ request: z.coerce.number().optional() });

export const Route = createFileRoute("/packages/$slug")({
  validateSearch: searchSchema,
  loader: ({ params }) => {
    const pkg = membershipPackages.find((p) => p.slug === params.slug);
    if (!pkg) throw notFound();
    return { pkg };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Package not found — JK Holidays" }, { name: "robots", content: "noindex" }] };
    }
    const { pkg } = loaderData;
    return {
      meta: [
        { title: `${pkg.title} — JK Holidays` },
        { name: "description", content: pkg.tagline },
        { property: "og:title", content: `${pkg.title} — JK Holidays` },
        { property: "og:description", content: pkg.tagline },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: PackageNotFound,
  component: PackageDetail,
});

function PackageNotFound() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold text-navy">Package not found</h1>
        <p className="mt-2 text-muted-foreground">That membership package does not exist.</p>
        <Button asChild className="mt-6 bg-gold-gradient font-bold text-navy-deep">
          <Link to="/packages" search={{}}>View all packages</Link>
        </Button>
      </div>
    </PublicLayout>
  );
}

function PackageDetail() {
  const { pkg } = Route.useLoaderData();
  const search = Route.useSearch();
  const [open, setOpen] = useState(search.request === 1);


  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-navy-deep text-white">
        <img src={pkg.image} alt={pkg.title} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/95 via-navy-deep/70 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20">
          <Link to="/packages" search={{}} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-gold hover:underline">
            <ArrowLeft className="h-3 w-3" /> All packages
          </Link>
          {pkg.badge && (
            <div className="mt-4 inline-block rounded-md bg-gold px-3 py-1 text-xs font-bold text-navy-deep">
              {pkg.badge}
            </div>
          )}
          <h1 className="mt-3 font-serif text-4xl font-bold md:text-5xl">{pkg.title}</h1>
          <p className="mt-3 max-w-xl text-white/85">{pkg.tagline}</p>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-lg text-white/60 line-through">₹{pkg.original.toLocaleString("en-IN")}</span>
            <span className="font-serif text-4xl font-bold text-gold">₹{pkg.price.toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-1 text-sm text-white/80">{pkg.nights} · {pkg.validity}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-bold text-navy">What's included</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {pkg.included.map((f) => (
                <li key={f} className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {f}
                </li>
              ))}
            </ul>
            <h3 className="mt-10 font-serif text-xl font-bold text-navy">About this membership</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pkg.about}</p>
          </div>

          <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-gold">Join this plan</div>
            <div className="mt-3 font-serif text-3xl font-bold text-navy">
              ₹{pkg.price.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground">{pkg.nights} · {pkg.validity}</div>
            <Button
              className="mt-5 w-full bg-gold-gradient font-bold text-navy-deep hover:opacity-90"
              onClick={() => setOpen(true)}
            >
              REQUEST PURCHASE
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full font-bold">
              <Link to="/auth/register">Create Account</Link>
            </Button>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              After you request, pay via UPI QR or bank transfer. Our team reviews the payment and
              activates your membership.
            </p>
          </aside>
        </div>
      </section>

      <PurchaseDialog open={open} setOpen={setOpen} title={pkg.title} amount={pkg.price} planSlug={pkg.slug.split("-")[0]} />
    </PublicLayout>
  );
}

function PurchaseDialog({
  open,
  setOpen,
  title,
  amount,
  planSlug,
}: {
  planSlug: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  title: string;
  amount: number;
}) {
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState("UPI");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async () => {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setBusy(false);
      toast.error("Please log in first", { description: "Sign in or create an account to send your membership request." });
      navigate({ to: "/auth/login" });
      return;
    }
    const { data: prof } = await (supabase as any).from("profiles").select("full_name,email,phone").eq("id", u.user.id).maybeSingle();
    const { error } = await (supabase as any).from("payments").insert({
      user_id: u.user.id, name: prof?.full_name ?? null, email: prof?.email ?? u.user.email, phone: prof?.phone ?? null,
      plan_slug: planSlug, amount, method, reference: reference.trim(), status: "Pending",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Request submitted", { description: `We'll verify your payment for ${title} and activate your membership shortly.` });
    setReference("");
    setOpen(false);
  };
  const upiId = "jkholidays@ybl";
  const upiLink = `upi://pay?pa=${upiId}&pn=JK%20Holidays&am=${amount}&cu=INR`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  const copy = (text: string, label: string) => {
    void navigator.clipboard?.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-navy">Request {title}</DialogTitle>
          <DialogDescription>
            Pay ₹{amount.toLocaleString("en-IN")} via UPI or bank transfer, then submit your payment
            reference. Our team verifies and activates your membership.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upi" onValueChange={(v) => setMethod(v === "bank" ? "Bank Transfer" : "UPI")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upi"><Smartphone className="mr-1 h-4 w-4" /> UPI QR</TabsTrigger>
            <TabsTrigger value="bank"><Building2 className="mr-1 h-4 w-4" /> Bank Transfer</TabsTrigger>
          </TabsList>

          <TabsContent value="upi" className="space-y-3 pt-4 text-center">
            <img src={qr} alt="UPI payment QR code" className="mx-auto rounded-lg border border-border" />
            <button
              type="button"
              onClick={() => copy(upiId, "UPI ID")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold"
            >
              {upiId} <Copy className="h-3.5 w-3.5" />
            </button>
          </TabsContent>

          <TabsContent value="bank" className="space-y-2 pt-4 text-sm">
            <Row label="Account Name" value="JK Holidays Pvt. Ltd." onCopy={copy} />
            <Row label="Account Number" value="502000123456789" onCopy={copy} />
            <Row label="IFSC" value="HDFC0001234" onCopy={copy} />
            <Row label="Bank" value="HDFC Bank, Sector 63 Noida" onCopy={copy} />
          </TabsContent>
        </Tabs>

        <div className="mt-2">
          <label className="text-sm font-semibold">Payment reference / UTR</label>
          <Input
            className="mt-1"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. 4281900233"
          />
        </div>

        <Button
          className="w-full bg-gold-gradient font-bold text-navy-deep hover:opacity-90"
          disabled={busy || reference.trim().length < 4}
          onClick={submit}
        >
          SUBMIT REQUEST
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Need help? Call {CONTACT.phone}
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (v: string, l: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onCopy(value, label)}
        className="inline-flex items-center gap-1.5 text-right text-sm font-semibold text-navy hover:text-gold"
      >
        {value} <Copy className="h-3 w-3 shrink-0" />
      </button>
    </div>
  );
}
