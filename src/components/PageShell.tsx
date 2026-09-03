import type { ReactNode } from "react";

import { useT } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const t = useT();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-gradient-green text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h1 className="font-display text-4xl text-gold">{t(title)}</h1>
          {subtitle && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/75">
              {t(subtitle)}
            </p>
          )}
        </div>
      </section>
      <main className="mx-auto max-w-6xl px-4 py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
