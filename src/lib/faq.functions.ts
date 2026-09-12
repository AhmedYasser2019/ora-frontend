import { createServerFn } from "@tanstack/react-start";

import { fetchFaqs } from "./faq.server";

export const getFaqs = createServerFn({ method: "GET" }).handler(async () => {
  return fetchFaqs();
});
