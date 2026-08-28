import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/PageShell";
import newsGlobal from "@/assets/news-global.jpg";
import newsLocal from "@/assets/news-local.jpg";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "الأخبار المالية وتحليلات سوق الذهب | أورا" },
      {
        name: "description",
        content:
          "تحليلات وأخبار عالمية ومحلية عن سوق الذهب والفضة في مصر والعالم، وتأثير السياسات النقدية على أسعار المعادن الثمينة.",
      },
      { property: "og:title", content: "الأخبار المالية | أورا للذهب" },
      {
        property: "og:description",
        content: "آخر أخبار وتحليلات سوق الذهب والفضة عالميًا ومحليًا.",
      },
    ],
  }),
  component: NewsPage,
});

const articles = [
  {
    img: newsGlobal,
    kind: "عالمي",
    t: "المشهد النقدي العالمي وآفاق الذهب والمعادن الثمينة — 2026",
    d: "يدخل العالم عام 2026 في مرحلة نقدية ومالية غير مسبوقة، تتسم بارتفاع قياسي في مستويات الدين وهشاشة متزايدة في أسواق السندات، ما يدفع البنوك المركزية لزيادة حيازاتها من الذهب.",
    date: "24 أغسطس 2026",
  },
  {
    img: newsLocal,
    kind: "محلي",
    t: "المشهد المحلي لسوق الذهب في مصر",
    d: "يشهد سوق الذهب في مصر تفاعلًا مباشرًا مع التحولات النقدية العالمية، مع طلب قوي على السبائك والعملات كوسيلة للحفاظ على القيمة أمام تحركات سعر الصرف.",
    date: "22 أغسطس 2026",
  },
  {
    img: newsLocal,
    kind: "محلي",
    t: "نظرة على الذهب والفضة في مصر | مارس 2026",
    d: "يواصل سوق المعادن الثمينة في مصر التأثر بمزيج من الاتجاهات العالمية والعوامل المحلية، وما يزال الذهب مدعومًا بالطلب الاستثماري ومشتريات الأفراد.",
    date: "12 مارس 2026",
  },
  {
    img: newsGlobal,
    kind: "عالمي",
    t: "الرؤية العالمية للذهب والفضة | مارس 2026",
    d: "يظل الذهب والفضة في دائرة الاهتمام العالمي مع استمرار المستثمرين في الموازنة بين الاستقرار والمخاطر والتمركز طويل الأجل.",
    date: "05 مارس 2026",
  },
  {
    img: newsGlobal,
    kind: "عالمي",
    t: "الفضة: معدن صناعي واستثماري في وقت واحد",
    d: "الطلب الصناعي على الفضة من الطاقة الشمسية والإلكترونيات يضيف بعدًا جديدًا لتحركات سعرها إلى جانب دورها كملاذ آمن.",
    date: "18 يناير 2026",
  },
  {
    img: newsLocal,
    kind: "محلي",
    t: "دليل المستثمر المبتدئ في سبائك الذهب بمصر",
    d: "الفرق بين السبائك والعملات والمشغولات، ومصاريف المصنعية، وكيف تختار الوزن المناسب لبدء استثمارك بأمان.",
    date: "02 يناير 2026",
  },
];

function NewsPage() {
  return (
    <PageShell
      title="الأخبار المالية"
      subtitle="ابقَ على اطلاع بآخر الأخبار المالية وأخبار سوق الذهب، مع تحليلات وتحديثات تساعدك على اتخاذ قرارات أذكى."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <article
            key={a.t}
            className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-soft"
          >
            <img
              src={a.img}
              alt={a.t}
              loading="lazy"
              width={800}
              height={500}
              className="aspect-[16/10] w-full object-cover"
            />
            <div className="p-5">
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-primary">
                {a.kind}
              </span>
              <h2 className="mt-3 text-base leading-snug text-primary">{a.t}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.d}</p>
              <p className="mt-4 text-[11px] text-gold-deep">{a.date}</p>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
