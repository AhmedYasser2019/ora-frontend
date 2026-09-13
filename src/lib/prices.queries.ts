import { queryOptions } from "@tanstack/react-query";

import { intlLocale } from "./i18n";
import { getLivePrices, getPriceHistory } from "./prices.functions";
import type { HistoryRange } from "./prices.server";

export const livePricesQuery = queryOptions({
  queryKey: ["live-prices"],
  queryFn: () => getLivePrices(),
  refetchInterval: 120_000,
  refetchOnWindowFocus: true,
  staleTime: 30_000,
});

export const priceHistoryQuery = (metal: "gold" | "silver", range: HistoryRange) =>
  queryOptions({
    queryKey: ["price-history", metal, range],
    queryFn: () => getPriceHistory({ data: { metal, range } }),
    staleTime: 60_000,
  });

export const egp = (n: number) =>
  new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 0 }).format(Math.round(n));
