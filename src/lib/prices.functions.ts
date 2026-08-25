import { createServerFn } from "@tanstack/react-start";

import { fetchLivePrices } from "./prices.server";

export const getLivePrices = createServerFn({ method: "GET" }).handler(async () => {
  return fetchLivePrices();
});
