import { Link } from "@tanstack/react-router";
import { Menu, Package, Phone, ShoppingBag, User, Wallet, X } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { navLinks } from "@/lib/site";

import { PriceMarquee } from "./PriceMarquee";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count, ready } = useCart();
  const { lang, setLang, t } = useLang();

  return (
    <>
      <PriceMarquee />
      {/* Top bar */}
      <div className="bg-gradient-green text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs">
          <span className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gold" /> 17608
          </span>
          <span className="hidden text-gold sm:inline">
            {t("توصيل آمن ومؤمّن لكل محافظات مصر")}
          </span>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            aria-label={t("تغيير اللغة")}
            className="rounded-full border border-gold/40 px-2.5 py-0.5 font-semibold text-gold transition-colors hover:bg-gold/15"
          >
            {lang === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            aria-label={t("القائمة")}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="text-center">
            <p className="font-display text-3xl leading-none tracking-[0.25em] text-primary">ORA</p>
            <p className="mt-1 text-[10px] tracking-[0.35em] text-gold-deep">GOLD JEWELRY</p>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/orders"
              aria-label={t("طلباتي")}
              className="hidden h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary sm:flex"
            >
              <Package className="h-5 w-5" />
            </Link>
            <Link
              to="/account"
              aria-label={t("حسابي")}
              className="hidden h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary sm:flex"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              to="/wallet"
              aria-label={t("محفظتي")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary"
            >
              <Wallet className="h-5 w-5" />
            </Link>
            <Link
              to="/cart"
              aria-label={t("سلة الشراء")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <ShoppingBag className="h-5 w-5" />
              {ready && count > 0 && (
                <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary">
                  {count}
                </span>
              )}
            </Link>
          </div>
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
                  {t(n.label)}
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
                    {t(n.label)}
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
