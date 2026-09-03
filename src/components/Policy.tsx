import { useT } from "@/lib/i18n";

export type PolicySection = { h: string; p: string[] };

/** تخطيط موحّد لصفحات السياسات: عنوان قسم + فقرات. */
export function Policy({ sections, updated }: { sections: PolicySection[]; updated: string }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-8 text-xs text-muted-foreground">
        {t("آخر تحديث")}: {t(updated)}
      </p>
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-xl text-primary">{t(s.h)}</h2>
            <div className="mt-3 space-y-3">
              {s.p.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {t(line)}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
