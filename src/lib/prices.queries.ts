import { queryOptions } from "@tanstack/react-query";

import { intlLocale } from "./i18n";
import { getLivePrices } from "./prices.functions";

export const livePricesQuery = queryOptions({
  queryKey: ["live-prices"],
  queryFn: () => getLivePrices(),
  refetchInterval: 120_000,
  refetchOnWindowFocus: true,
  staleTime: 30_000,
});

export const egp = (n: number) =>
  new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 0 }).format(Math.round(n));
