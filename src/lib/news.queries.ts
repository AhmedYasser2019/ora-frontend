import { queryOptions } from "@tanstack/react-query";

import newsGlobal from "@/assets/news-global.jpg";
import newsLocal from "@/assets/news-local.jpg";

import { intlLocale, type Lang } from "./i18n";
import { getArticle, getNews } from "./news.functions";

/** صورة القسم حين لا يرفع المحرّر صورة للمقال. */
export const newsFallbackImage = { global: newsGlobal, local: newsLocal } as const;

export const newsCategoryLabel = { global: "عالمي", local: "محلي" } as const;

/** الأخبار تتغيّر بوتيرة التحرير لا بوتيرة السعر، فالفاصل هنا أطول كثيرًا من الأسعار. */
export const newsQuery = queryOptions({
  queryKey: ["news"],
  queryFn: () => getNews(),
  staleTime: 300_000,
});

/** مقال واحد بنصّه الكامل. اللغة في المفتاح لنفس سبب settingsQuery. */
export const articleQuery = (id: number, lang: Lang) =>
  queryOptions({
    queryKey: ["news", id, lang],
    queryFn: () => getArticle({ data: id }),
    staleTime: 300_000,
  });

/** رقم المقال/التقرير من الرابط؛ null لأي شيء غير رقم صحيح. */
export const parseId = (raw: string) => (/^[1-9]\d{0,9}$/.test(raw) ? Number(raw) : null);

/** تاريخ النشر بصيغة يقرأها الزائر بلغته. */
export const newsDate = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: "long" }).format(new Date(iso));
