import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

import { useT } from "@/lib/i18n";
import { helpLinks, navLinks } from "@/lib/site";

export function SiteFooter() {
  const t = useT();

  return (
    <footer className="bg-gradient-green text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-3xl tracking-[0.25em] text-gold">ORA</p>
          <p className="mt-1 text-[10px] tracking-[0.35em] text-gold/70">GOLD JEWELRY</p>
          <p className="mt-4 text-sm text-primary-foreground/75">
            {t("أورا للذهب والسبائك — استثمار واضح وآمن في المعادن النفيسة.")}
          </p>
        </div>
        <div>
          <h3 className="text-base text-gold">{t("روابط سريعة")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
            {navLinks.slice(1).map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-gold">
                  {t(n.label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-base text-gold">{t("مركز المساعدة")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
            {helpLinks.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-gold">
                  {t(n.label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-base text-gold">{t("تواصل معنا")}</h3>
          <ul className="mt-3 space-y-3 text-sm text-primary-foreground/75">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" /> 17608
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" /> support@ora-gold.com
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-gold" /> {t("سموحة، الإسكندرية، مصر")}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60">
        {t("جميع الحقوق محفوظة © أورا للذهب 2026")}
      </div>
    </footer>
  );
}
