export type PolicySection = { h: string; p: string[] };

/** تخطيط موحّد لصفحات السياسات: عنوان قسم + فقرات. */
export function Policy({ sections, updated }: { sections: PolicySection[]; updated: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-8 text-xs text-muted-foreground">آخر تحديث: {updated}</p>
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-xl text-primary">{s.h}</h2>
            <div className="mt-3 space-y-3">
              {s.p.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
