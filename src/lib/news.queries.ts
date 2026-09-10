import { queryOptions } from "@tanstack/react-query";

import { intlLocale } from "./i18n";
import { getNews } from "./news.functions";

/** الأخبار تتغيّر بوتيرة التحرير لا بوتيرة السعر، فالفاصل هنا أطول كثيرًا من الأسعار. */
export const newsQuery = queryOptions({
  queryKey: ["news"],
  queryFn: () => getNews(),
  staleTime: 300_000,
});

/** تاريخ النشر بصيغة يقرأها الزائر بلغته. */
export const newsDate = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: "long" }).format(new Date(iso));
