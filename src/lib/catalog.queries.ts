import { queryOptions } from "@tanstack/react-query";

import { getProducts } from "./catalog.functions";
import type { Product } from "./catalog.server";

/**
 * أسعار المنتجات تتحرك مع كل سعر ينشره المكتب، فالبثّ الحيّ هو ما يُبطل هذا الاستعلام —
 * انظر use-live-prices. الفاصل الزمني هنا شبكة أمان لو كان السوكت محجوبًا.
 */
export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => getProducts(),
  refetchInterval: 120_000,
  staleTime: 30_000,
});

export const bySlug = (products: Product[] | undefined, slug: string) =>
  products?.find((p) => p.slug === slug);
