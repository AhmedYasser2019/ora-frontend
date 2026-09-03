import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { branches } from "@/lib/site";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/branches")({
  head: () => ({
    meta: [
      { title: tr("فروع أورا للذهب في مصر | العناوين ومواعيد العمل") },
      {
        name: "description",
        content: tr(
          "عناوين فروع أورا للذهب في الإسكندرية والقاهرة والجيزة والمنصورة، مع أرقام التواصل ومواعيد العمل.",
        ),
      },
      { property: "og:title", content: tr("فروعنا | أورا للذهب") },
      {
        property: "og:description",
        content: tr("فروع أورا في مصر: العناوين والمواعيد وأرقام التواصل."),
      },
    ],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  const t = useT();

  return (
    <PageShell
      title="فروعنا"
      subtitle="زور أقرب فرع لك لشراء أو بيع الذهب والفضة، مع فحص فوري وشهادة أصل لكل قطعة."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {branches.map((b) => (
          <div key={b.name} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs tracking-[0.2em] text-gold-deep">{t(b.city)}</p>
            <h2 className="mt-2 text-xl text-primary">{t(b.name)}</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-gold-deep" /> {t(b.address)}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold-deep" /> {b.phone}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold-deep" /> {t(b.hours)}
              </li>
            </ul>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(b.address)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground"
            >
              {t("الاتجاهات على الخريطة")}
            </a>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
