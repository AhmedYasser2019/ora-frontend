import { createServerFn } from "@tanstack/react-start";

import { fetchArticle, fetchNews } from "./news.server";

export const getNews = createServerFn({ method: "GET" }).handler(async () => {
  return fetchNews();
});

export const getArticle = createServerFn({ method: "GET" })
  // الرقم يدخل مسار الطلب للباك إند.
  .validator((id: number) => {
    if (!Number.isSafeInteger(id) || id < 1) throw new Error("bad id");
    return id;
  })
  .handler(({ data }) => fetchArticle(data));
