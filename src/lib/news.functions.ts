import { createServerFn } from "@tanstack/react-start";

import { fetchNews } from "./news.server";

export const getNews = createServerFn({ method: "GET" }).handler(async () => {
  return fetchNews();
});
