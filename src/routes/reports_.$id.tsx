import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import newsGlobal from "@/assets/news-global.jpg";
import { readLang, tr, useLang } from "@/lib/i18n";
import { Post, PostNotFound } from "@/components/Post";
import { parseId } from "@/lib/news.queries";
import { reportKindLabel, reportQuery } from "@/lib/reports.queries";

const back = { to: "/reports", label: "كل التقارير" } as const;

export const Route = createFileRoute("/reports_/$id")({
  // تُقرأ على الخادم لمحرّكات البحث، والتقرير غير المنشور 404.
  loader: async ({ context, params }) => {
    const id = parseId(params.id);
    const report = id && (await context.queryClient.ensureQueryData(reportQuery(id, readLang())));
    if (!id || !report) throw notFound();
    return { id, report };
  },
  head: ({ loaderData }) => {
    const r = loaderData?.report;
    if (!r) return {};
    const title = `${r.title} | ${tr("أورا للذهب")}`;
    return {
      meta: [
        { title },
        { name: "description", content: r.excerpt },
        { property: "og:title", content: title },
        { property: "og:description", content: r.excerpt },
        ...(r.img ? [{ property: "og:image", content: r.img }] : []),
      ],
    };
  },
  notFoundComponent: () => <PostNotFound back={back} />,
  component: ReportPage,
});

function ReportPage() {
  const { id, report: loaded } = Route.useLoaderData();
  const { data } = useQuery(reportQuery(id, useLang().lang));
  const r = data ?? loaded;

  return <Post post={r} img={r.img ?? newsGlobal} label={reportKindLabel[r.kind]} back={back} />;
}
