import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { readLang, type Lang } from "./i18n";
import { getPage } from "./pages.functions";
import type { PageSlug } from "./pages.server";

/** اللغة في المفتاح لنفس سبب settingsQuery: تبديل اللغة لا يعيد تحميل الصفحة. */
export const pageQuery = (slug: PageSlug, lang: Lang) =>
  queryOptions({
    queryKey: ["page", slug, lang],
    queryFn: () => getPage({ data: slug }),
    staleTime: 600_000,
  });

/** للـ loader: تُقرأ على الخادم لمحرّكات البحث، والصفحة التي لم تُكتب بعد تصبح 404. */
export async function loadPage(queryClient: QueryClient, slug: PageSlug) {
  if (!(await queryClient.ensureQueryData(pageQuery(slug, readLang())))) throw notFound();
}
