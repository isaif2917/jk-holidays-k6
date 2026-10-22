import { Link } from "@tanstack/react-router";
import { ChevronDown, Phone, Menu, MessageCircle } from "lucide-react";
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
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-green-600"
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
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
        <nav className="hidden items-center gap-7 text-sm font-semibold tracking-wide lg:flex">
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
