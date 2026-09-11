import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { newsDate } from "@/lib/news.queries";
import { getReports } from "@/lib/reports.functions";
import newsGlobal from "@/assets/news-global.jpg";

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
  // تُقرأ على الخادم مثل الأخبار، لمحرّكات البحث.
  loader: ({ context }) => context.queryClient.ensureQueryData(reportsQuery),
  component: ReportsPage,
});

const reportsQuery = queryOptions({
  queryKey: ["reports"],
  queryFn: () => getReports(),
  staleTime: 300_000,
});

const kindLabel = {
  weekly: "أسبوعي",
  monthly: "شهري",
  quarterly: "ربع سنوي",
  annual: "سنوي",
} as const;

function ReportsPage() {
  const t = useT();
  const { data: reports } = useQuery(reportsQuery);

  return (
    <PageShell
      title="التقارير"
      subtitle="تقارير دورية عن أداء سوق الذهب والفضة محليًا وعالميًا، بأرقام ومؤشرات تساعدك على قراءة السوق قبل قرار الشراء أو البيع."
    >
      {reports?.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <article
              key={r.id}
              className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-soft"
            >
              <img
                src={r.img ?? newsGlobal}
                alt={r.title}
                loading="lazy"
                width={800}
                height={500}
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-5">
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-primary">
                  {t(kindLabel[r.kind])}
                </span>
                {/* العنوان والمقتطف يصلان مترجمين من الخادم، فلا يمرّان على t(). */}
                <h2 className="mt-3 text-base leading-snug text-primary">{r.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.excerpt}</p>
                <p className="mt-4 text-[11px] text-gold-deep">{newsDate(r.publishedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {t("لا توجد تقارير منشورة حاليًا. تابعنا قريبًا.")}
        </p>
      )}
    </PageShell>
  );
}
