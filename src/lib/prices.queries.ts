import { queryOptions } from "@tanstack/react-query";

import { getLivePrices } from "./prices.functions";

export const livePricesQuery = queryOptions({
  queryKey: ["live-prices"],
  queryFn: () => getLivePrices(),
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
  staleTime: 30_000,
});

export const egp = (n: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(Math.round(n));
