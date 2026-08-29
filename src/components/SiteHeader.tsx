import { Link } from "@tanstack/react-router";
import { Menu, Phone, ShoppingBag, X } from "lucide-react";
import { useState } from "react";

import { navLinks } from "@/lib/site";

import { PriceMarquee } from "./PriceMarquee";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PriceMarquee />
      {/* Top bar */}
      <div className="bg-gradient-green text-primary-foreground">

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs">
          <span className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gold" /> 17608
          </span>
          <span className="hidden text-gold sm:inline">توصيل آمن ومؤمّن لكل محافظات مصر</span>
          <span>AR | EN</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            aria-label="القائمة"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="text-center">
            <p className="font-display text-3xl leading-none tracking-[0.25em] text-primary">ORA</p>
            <p className="mt-1 text-[10px] tracking-[0.35em] text-gold-deep">GOLD JEWELRY</p>
          </Link>
          <Link
            to="/collection"
            aria-label="حقيبة الشراء"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>

        <nav className="hidden border-t border-border/60 md:block">
          <ul className="mx-auto flex max-w-6xl items-center justify-center gap-7 px-4 py-3 text-sm text-primary">
            {navLinks.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  activeProps={{ className: "text-gold-deep font-semibold" }}
                  className="transition-colors hover:text-gold-deep"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {open && (
          <nav className="border-t border-border/60 md:hidden">
            <ul className="grid gap-1 px-4 py-3 text-sm text-primary">
              {navLinks.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: n.to === "/" }}
                    activeProps={{ className: "text-gold-deep font-semibold" }}
                    className="block rounded-lg px-2 py-2 hover:bg-secondary"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}
