import { Link } from "@tanstack/react-router";
import { ChevronDown, Phone, Menu } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { membershipPackages } from "@/data/mock";
import { useSiteContact } from "@/lib/catalog";

import type { ReactNode } from "react";
import { useMe } from "@/lib/data";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/educational-tour", label: "Educational Tour" },
  { to: "/corporate-tour", label: "Corporate Tour" },
  { to: "/destinations", label: "Destinations" },
  { to: "/offers", label: "Offers" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function PublicLayout({ children }: { children: ReactNode }) {
  const c = useSiteContact();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <a
        href={c.whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#1EBE5A]"
      >
        <WhatsAppLogo className="h-6 w-6 shrink-0" />
        <span className="hidden sm:inline">Chat on WhatsApp</span>
      </a>
    </div>
  );
}

function AccountLink({ mobile }: { mobile?: boolean }) {
  const { data: me } = useMe();
  if (!me) return <Link to="/auth/login" className={mobile ? "hover:text-gold" : "text-sm font-semibold uppercase tracking-wide hover:text-gold"}>{mobile ? "Member Login" : "Login"}</Link>;
  const name = me.profile?.full_name || me.user.email || "Me";
  const to = me.isAdmin && !mobile ? "/admin/dashboard" : "/app/dashboard";
  return (
    <Link to={to} title="Go to my dashboard" className="flex items-center gap-2 hover:text-gold">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-gold font-bold text-navy-deep ring-2 ring-white/30">{name[0]?.toUpperCase()}</span>
      <span className={mobile ? "" : "hidden text-xs font-semibold xl:inline"}>{mobile ? "My Dashboard" : "My Account"}</span>
    </Link>
  );
}

function AccountIcon() {
  const { data: me } = useMe();
  if (!me) return null;
  const name = me.profile?.full_name || me.user.email || "Me";
  return <Link to="/app/dashboard" aria-label="My dashboard" className="grid h-9 w-9 place-items-center rounded-full bg-gold font-bold text-navy-deep">{name[0]?.toUpperCase()}</Link>;
}

function Navbar() {
  const c = useSiteContact();
  return (
    <header className="sticky top-0 z-40 bg-navy-gradient text-white shadow-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/"><Logo /></Link>
        <nav className="hidden items-center gap-4 text-sm font-semibold tracking-wide lg:flex xl:gap-6">
          {links.slice(0, 2).map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-gold" activeProps={{ className: "text-gold" }} activeOptions={{ exact: true }}>
              {l.label.toUpperCase()}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-gold">
              MEMBERSHIP <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild><Link to="/packages" search={{}}>All Packages</Link></DropdownMenuItem>
              {membershipPackages.map((p) => (
                <DropdownMenuItem key={p.slug} asChild>
                  <Link to="/packages/$slug" params={{ slug: p.slug }} search={{}}>{p.title}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild><Link to="/membership">Compare Plans</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {links.slice(2).map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-gold" activeProps={{ className: "text-gold" }}>
              {l.label.toUpperCase()}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a href={c.phoneHref} className="hidden items-center gap-2 text-sm xl:flex">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-gold text-gold"><Phone className="h-4 w-4" /></span>
            {c.phone}
          </a>
          <AccountLink />
        </div>
        <div className="ml-auto md:hidden"><AccountIcon /></div>
        <Sheet>
          <SheetTrigger className="lg:hidden" aria-label="Toggle menu"><Menu className="h-6 w-6" /></SheetTrigger>
          <SheetContent side="right" className="bg-navy text-white">
            <nav className="mt-8 flex flex-col gap-4 text-sm font-semibold">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="hover:text-gold">{l.label}</Link>
              ))}
              <Link to="/packages" search={{}} className="hover:text-gold">Membership Packages</Link>
              <AccountLink mobile />
              <a href={c.phoneHref} className="text-gold">{c.phone}</a>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function Footer() {
  const c = useSiteContact();
  return (
    <footer className="bg-navy-gradient text-white/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Logo />
          <p className="mt-4 text-sm">
            Travel More. Spend Less. Live Better. JK Holidays offers premium holiday memberships with
            luxury resorts across India and international destinations.
          </p>
          <div className="mt-4 flex gap-2">
            {[
              { label: "f", href: "https://facebook.com" },
              { label: "i", href: "https://instagram.com" },
              { label: "y", href: "https://youtube.com" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-xs hover:border-gold hover:text-gold"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-gold">About Us</Link></li>
            <li><Link to="/packages" search={{}} className="hover:text-gold">Membership Plans</Link></li>
            <li><Link to="/educational-tour" className="hover:text-gold">Educational Tour</Link></li>
            <li><Link to="/corporate-tour" className="hover:text-gold">Corporate Tour</Link></li>
            <li><Link to="/destinations" className="hover:text-gold">Destinations</Link></li>
            <li><Link to="/offers" className="hover:text-gold">Offers</Link></li>
            <li><Link to="/contact" search={{}} className="hover:text-gold">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg text-white">Member Services</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/auth/login" className="hover:text-gold">Membership Login</Link></li>
            <li><Link to="/auth/register" className="hover:text-gold">Join Membership</Link></li>
            <li><Link to="/app/dashboard" className="hover:text-gold">My Account</Link></li>
            <li><Link to="/packages" search={{}} className="hover:text-gold">Browse Plans</Link></li>
            <li><Link to="/admin-login" className="hover:text-gold">Admin Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg text-white">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contact" search={{}} className="hover:text-gold">Book Presentation</Link></li>
            <li><Link to="/app/support" className="hover:text-gold">Help & Support</Link></li>
            <li><a href={c.whatsapp} target="_blank" rel="noreferrer" className="hover:text-gold">WhatsApp Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg text-white">Contact Us</h4>
          <p className="whitespace-pre-line text-sm">
            {c.company}
            {"\n"}
            {c.address}
          </p>
          <p className="mt-3 text-sm">
            <a href={c.phoneHref} className="hover:text-gold">{c.phone}</a>
            <br />
            <a href={`mailto:${c.email}`} className="hover:text-gold">{c.email}</a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © 2026 JK Holidays Pvt. Ltd. All Rights Reserved.
      </div>
    </footer>
  );
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
