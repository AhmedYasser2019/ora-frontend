import { createServerFn } from "@tanstack/react-start";

import { fetchPage, PAGE_SLUGS, type PageSlug } from "./pages.server";

export const getPage = createServerFn({ method: "GET" })
  // الـ slug يدخل مسار الطلب للباك إند، فلا يمرّ إلا واحد من المعروفين.
  .validator((slug: PageSlug) => {
    if (!PAGE_SLUGS.includes(slug)) throw new Error("unknown page");
    return slug;
  })
  .handler(({ data }) => fetchPage(data));
