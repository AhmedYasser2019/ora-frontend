import { queryOptions } from "@tanstack/react-query";

import { getFaqs } from "./faq.functions";

/** محرَّرة باليد من لوحة التحكم، فالتحديث نادر — نفس فاصل الأخبار. */
export const faqQuery = queryOptions({
  queryKey: ["faqs"],
  queryFn: () => getFaqs(),
  staleTime: 300_000,
});
