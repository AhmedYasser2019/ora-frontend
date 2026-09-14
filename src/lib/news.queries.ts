import { queryOptions } from "@tanstack/react-query";

import newsGlobal from "@/assets/news-global.jpg";
import newsLocal from "@/assets/news-local.jpg";

import { intlLocale } from "./i18n";
import { getNews } from "./news.functions";

/** صورة القسم حين لا يرفع المحرّر صورة للمقال. */
export const newsFallbackImage = { global: newsGlobal, local: newsLocal } as const;

export const newsCategoryLabel = { global: "عالمي", local: "محلي" } as const;

/** الأخبار تتغيّر بوتيرة التحرير لا بوتيرة السعر، فالفاصل هنا أطول كثيرًا من الأسعار. */
export const newsQuery = queryOptions({
  queryKey: ["news"],
  queryFn: () => getNews(),
  staleTime: 300_000,
});

/** تاريخ النشر بصيغة يقرأها الزائر بلغته. */
export const newsDate = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: "long" }).format(new Date(iso));
