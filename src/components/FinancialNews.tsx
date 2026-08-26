import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import newsGlobal from "@/assets/news-global.jpg";
import newsLocal from "@/assets/news-local.jpg";

const articles = [
  {
    img: newsGlobal,
    kind: "عالمي",
    t: "المشهد النقدي العالمي وآفاق الذهب والمعادن الثمينة — 2026",
    d: "يدخل العالم عام 2026 في مرحلة نقدية ومالية غير مسبوقة تاريخيًا، تتسم بارتفاع قياسي في مستويات الدين وهشاشة متزايدة في أسواق السندات.",
    date: "24 أغسطس 2026",
  },
  {
    img: newsLocal,
    kind: "محلي",
    t: "المشهد المحلي لسوق الذهب في مصر",
    d: "آفاق الذهب والمعادن الثمينة — يشهد سوق الذهب في مصر تفاعلًا مباشرًا مع التحولات النقدية والاقتصادية العالمية.",
    date: "22 أغسطس 2026",
  },
  {
    img: newsLocal,
    kind: "محلي",
    t: "نظرة على الذهب والفضة في مصر | مارس 2026",
    d: "يواصل سوق المعادن الثمينة في مصر التأثر بمزيج من الاتجاهات العالمية والعوامل المحلية، وحتى مارس 2026 ما يزال الذهب مدعومًا.",
    date: "12 مارس 2026",
  },
  {
    img: newsGlobal,
    kind: "عالمي",
    t: "الرؤية العالمية للذهب والفضة | مارس 2026",
    d: "يظل الذهب والفضة في دائرة الاهتمام العالمي مع استمرار المستثمرين في الموازنة بين الاستقرار والمخاطر والتمركز طويل الأجل.",
    date: "05 مارس 2026",
  },
];

export function FinancialNews() {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  return (
    <section id="news" className="bg-gradient-green py-14 text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-gold">
              الأخبار المالية
              <span className="mt-2 block h-0.5 w-32 rounded-full bg-gold/70" />
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/70">
              ابقَ على اطلاع بآخر الأخبار المالية وأخبار سوق الذهب، مع تحليلات وتحديثات تساعدك على
              اتخاذ قرارات أذكى وفهم أفضل لحركة السوق.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="السابق"
              onClick={() => scrollBy(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold/10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="التالي"
              onClick={() => scrollBy(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {articles.map((a) => (
            <article
              key={a.t}
              className="w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gold/15 bg-primary-foreground/5 transition-colors hover:border-gold/50 sm:w-[300px]"
            >
              <img
                src={a.img}
                alt={a.t}
                loading="lazy"
                width={1088}
                height={608}
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between text-[11px] text-gold/80">
                  <span className="rounded-full border border-gold/30 px-2 py-0.5">{a.kind}</span>
                  <span>{a.date}</span>
                </div>
                <h3 className="mt-3 text-base leading-snug text-primary-foreground">{a.t}</h3>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-primary-foreground/60">
                  {a.d}
                </p>
              </div>
            </article>
          ))}
        </div>

        <a
          href="#news"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-deep"
        >
          مشاهدة الكل <ArrowLeft className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
