import { queryOptions } from "@tanstack/react-query";

import { getProducts } from "./catalog.functions";
import type { Category, Product } from "./catalog.server";

export const CATEGORIES: Category[] = ["سبائك ذهب", "عملات ذهبية", "سبائك فضة"];

/** أسماء الفئات في رابط /collection?cat=… — لاتينية حتى لا يصير الرابط حروفًا مُرمَّزة. */
export const CATEGORY_SLUGS = {
  "gold-bars": "سبائك ذهب",
  "gold-coins": "عملات ذهبية",
  "silver-bars": "سبائك فضة",
} as const satisfies Record<string, Category>;

/** المورّدون الموجودون فعلًا في الكتالوج — قائمة التاجر، لا قائمة ثابتة في الكود. */
export const providersOf = (products: Product[]) =>
  [...new Set(products.map((p) => p.provider).filter(Boolean))].sort();

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
