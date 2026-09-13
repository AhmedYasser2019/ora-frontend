import { createServerFn } from "@tanstack/react-start";

import { fetchLivePrices, fetchPriceHistory, type HistoryRange } from "./prices.server";

export const getLivePrices = createServerFn({ method: "GET" }).handler(async () => {
  return fetchLivePrices();
});

export const getPriceHistory = createServerFn({ method: "GET" })
  .validator((input: { metal: "gold" | "silver"; range: HistoryRange }) => input)
  .handler(async ({ data }) => fetchPriceHistory(data.metal, data.range));
