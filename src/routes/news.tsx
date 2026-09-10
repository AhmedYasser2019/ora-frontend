import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { newsDate, newsQuery } from "@/lib/news.queries";
import newsGlobal from "@/assets/news-global.jpg";
import newsLocal from "@/assets/news-local.jpg";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: tr("الأخبار المالية وتحليلات سوق الذهب | أورا") },
      {
        name: "description",
        content: tr(
          "تحليلات وأخبار عالمية ومحلية عن سوق الذهب والفضة في مصر والعالم، وتأثير السياسات النقدية على أسعار المعادن الثمينة.",
        ),
      },
      { property: "og:title", content: tr("الأخبار المالية | أورا للذهب") },
      {
        property: "og:description",
        content: tr("آخر أخبار وتحليلات سوق الذهب والفضة عالميًا ومحليًا."),
      },
    ],
  }),
  // تُقرأ على الخادم: محرّكات البحث تقرأ هذه الصفحة، ولا تنتظر استعلامًا في المتصفح.
  loader: ({ context }) => context.queryClient.ensureQueryData(newsQuery),
  component: NewsPage,
});

/** صورة القسم حين لا يرفع المحرّر صورة للمقال. */
const fallbackImage = { global: newsGlobal, local: newsLocal } as const;

const categoryLabel = { global: "عالمي", local: "محلي" } as const;

function NewsPage() {
  const t = useT();
  const { data: articles } = useQuery(newsQuery);

  return (
    <PageShell
      title="الأخبار المالية"
      subtitle="ابقَ على اطلاع بآخر الأخبار المالية وأخبار سوق الذهب، مع تحليلات وتحديثات تساعدك على اتخاذ قرارات أذكى."
    >
      {articles?.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <article
              key={a.id}
              className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-soft"
            >
              <img
                src={a.img ?? fallbackImage[a.category]}
                alt={a.title}
                loading="lazy"
                width={800}
                height={500}
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-5">
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-primary">
                  {t(categoryLabel[a.category])}
                </span>
                {/* العنوان والمقتطف يصلان مترجمين من الخادم، فلا يمرّان على t(). */}
                <h2 className="mt-3 text-base leading-snug text-primary">{a.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.excerpt}</p>
                <p className="mt-4 text-[11px] text-gold-deep">{newsDate(a.publishedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {t("لا توجد أخبار منشورة حاليًا. تابعنا قريبًا.")}
        </p>
      )}
    </PageShell>
  );
}
