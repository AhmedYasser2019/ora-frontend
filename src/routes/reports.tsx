import { createFileRoute } from "@tanstack/react-router";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import newsGlobal from "@/assets/news-global.jpg";
import newsLocal from "@/assets/news-local.jpg";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: tr("تقارير سوق الذهب والفضة | أورا") },
      {
        name: "description",
        content: tr(
          "تقارير دورية أسبوعية وشهرية وسنوية عن أداء الذهب والفضة في مصر والعالم، مع أرقام الطلب والعرض وحركة الأسعار.",
        ),
      },
      { property: "og:title", content: tr("التقارير | أورا للذهب") },
      {
        property: "og:description",
        content: tr("تقارير دورية عن أداء سوق الذهب والفضة محليًا وعالميًا."),
      },
    ],
  }),
  component: ReportsPage,
});

const reports = [
  {
    img: newsGlobal,
    kind: "شهري",
    t: "تقرير أداء الذهب العالمي | أغسطس 2026",
    d: "ملخّص شهري لحركة أونصة الذهب عالميًا، ومشتريات البنوك المركزية، وتدفقات صناديق المؤشرات المدعومة بالذهب.",
    date: "31 أغسطس 2026",
  },
  {
    img: newsLocal,
    kind: "شهري",
    t: "تقرير سوق الذهب المصري | أغسطس 2026",
    d: "متوسط أسعار عيار 21 و24 خلال الشهر، وحجم الطلب على السبائك والعملات، وأثر سعر الصرف على أسعار المحلات.",
    date: "31 أغسطس 2026",
  },
  {
    img: newsGlobal,
    kind: "أسبوعي",
    t: "التقرير الأسبوعي للمعادن الثمينة",
    d: "أهم تحركات الذهب والفضة خلال الأسبوع، ومستويات الدعم والمقاومة، وأبرز البيانات الاقتصادية المؤثرة.",
    date: "24 أغسطس 2026",
  },
  {
    img: newsGlobal,
    kind: "ربع سنوي",
    t: "تقرير الطلب على الذهب | الربع الثاني 2026",
    d: "توزيع الطلب العالمي بين المشغولات والسبائك والعملات والاستخدامات الصناعية، ومقارنة بالربع المماثل من العام السابق.",
    date: "15 يوليو 2026",
  },
  {
    img: newsLocal,
    kind: "ربع سنوي",
    t: "تقرير الفضة في مصر | الربع الثاني 2026",
    d: "أداء سعر جرام الفضة محليًا، ونمو الطلب على سبائك الفضة، ونسبة الذهب إلى الفضة خلال الربع.",
    date: "12 يوليو 2026",
  },
  {
    img: newsGlobal,
    kind: "سنوي",
    t: "التقرير السنوي لسوق الذهب | 2025",
    d: "مراجعة كاملة لعام 2025: أعلى وأدنى سعر، عوائد الاستثمار في السبائك والعملات، وتوقعات 2026.",
    date: "10 يناير 2026",
  },
];

function ReportsPage() {
  const t = useT();

  return (
    <PageShell
      title="التقارير"
      subtitle="تقارير دورية عن أداء سوق الذهب والفضة محليًا وعالميًا، بأرقام ومؤشرات تساعدك على قراءة السوق قبل قرار الشراء أو البيع."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <article
            key={r.t}
            className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-soft"
          >
            <img
              src={r.img}
              alt={t(r.t)}
              loading="lazy"
              width={800}
              height={500}
              className="aspect-[16/10] w-full object-cover"
            />
            <div className="p-5">
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-primary">
                {t(r.kind)}
              </span>
              <h2 className="mt-3 text-base leading-snug text-primary">{t(r.t)}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(r.d)}</p>
              <p className="mt-4 text-[11px] text-gold-deep">{t(r.date)}</p>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
