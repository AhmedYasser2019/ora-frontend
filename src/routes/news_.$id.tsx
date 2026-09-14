import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { readLang, tr, useLang } from "@/lib/i18n";
import { Post, PostNotFound } from "@/components/Post";
import { articleQuery, newsCategoryLabel, newsFallbackImage, parseId } from "@/lib/news.queries";

const back = { to: "/news", label: "كل الأخبار" } as const;

export const Route = createFileRoute("/news_/$id")({
  // تُقرأ على الخادم لمحرّكات البحث، والمقال غير المنشور 404.
  loader: async ({ context, params }) => {
    const id = parseId(params.id);
    const article = id && (await context.queryClient.ensureQueryData(articleQuery(id, readLang())));
    if (!id || !article) throw notFound();
    return { id, article };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    if (!a) return {};
    const title = `${a.title} | ${tr("أورا للذهب")}`;
    return {
      meta: [
        { title },
        { name: "description", content: a.excerpt },
        { property: "og:title", content: title },
        { property: "og:description", content: a.excerpt },
        ...(a.img ? [{ property: "og:image", content: a.img }] : []),
      ],
    };
  },
  notFoundComponent: () => <PostNotFound back={back} />,
  component: ArticlePage,
});

function ArticlePage() {
  const { id, article: loaded } = Route.useLoaderData();
  const { data } = useQuery(articleQuery(id, useLang().lang));
  const a = data ?? loaded;

  return (
    <Post
      post={a}
      img={a.img ?? newsFallbackImage[a.category]}
      label={newsCategoryLabel[a.category]}
      back={back}
    />
  );
}
