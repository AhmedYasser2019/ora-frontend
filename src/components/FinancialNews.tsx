import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { useT } from "@/lib/i18n";
import { newsCategoryLabel, newsDate, newsFallbackImage, newsQuery } from "@/lib/news.queries";

/** أحدث المقالات فقط؛ الباقي في صفحة الأخبار. */
const HOME_COUNT = 6;

export function FinancialNews() {
  const scroller = useRef<HTMLDivElement>(null);
  const t = useT();
  const { data } = useQuery(newsQuery);
  const articles = data?.slice(0, HOME_COUNT);

  // لا قسم فارغ في الصفحة الرئيسية؛ صفحة /news تعرض رسالة "لا توجد أخبار".
  if (!articles?.length) return null;

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  return (
    <section id="news" className="bg-gradient-green py-14 text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-gold">
              {t("الأخبار المالية")}
              <span className="mt-2 block h-0.5 w-32 rounded-full bg-gold/70" />
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/70">
              {t(
                "ابقَ على اطلاع بآخر الأخبار المالية وأخبار سوق الذهب، مع تحليلات وتحديثات تساعدك على اتخاذ قرارات أذكى وفهم أفضل لحركة السوق.",
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              aria-label={t("السابق")}
              onClick={() => scrollBy(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold/10"
            >
              <ChevronRight className="h-5 w-5 ltr:rotate-180" />
            </button>
            <button
              type="button"
              aria-label={t("التالي")}
              onClick={() => scrollBy(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold/10"
            >
              <ChevronLeft className="h-5 w-5 ltr:rotate-180" />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {articles.map((a) => (
            <article
              key={a.id}
              className="w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gold/15 bg-primary-foreground/5 transition-colors hover:border-gold/50 sm:w-[300px]"
            >
              <img
                src={a.img ?? newsFallbackImage[a.category]}
                alt={a.title}
                loading="lazy"
                width={1088}
                height={608}
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between text-[11px] text-gold/80">
                  <span className="rounded-full border border-gold/30 px-2 py-0.5">
                    {t(newsCategoryLabel[a.category])}
                  </span>
                  <span>{newsDate(a.publishedAt)}</span>
                </div>
                {/* العنوان والمقتطف يصلان مترجمين من الخادم، فلا يمرّان على t(). */}
                <h3 className="mt-3 text-base leading-snug text-primary-foreground">{a.title}</h3>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-primary-foreground/60">
                  {a.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>

        <Link
          to="/news"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-deep"
        >
          {t("مشاهدة الكل")} <ArrowLeft className="h-4 w-4 ltr:rotate-180" />
        </Link>
      </div>
    </section>
  );
}
