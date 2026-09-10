import { queryOptions } from "@tanstack/react-query";

import { api } from "./api";

/**
 * ممتلكاتي من الخادم: القطع التي اشتُريت فعلًا وسُوِّيت أوامرها، بتكلفتها وقيمتها اليوم.
 *
 * لا حساب هنا. التقييم بسعر إعادة البيع — ما يدفعه المكتب لو بعتَ الآن — ويحسبه
 * `GET /holdings` بنفس المعادلة التي يُعرض بها `sell_price_piasters` في الكتالوج.
 * القطعة التي لا يعرف المكتب سعرها الآن (معدن موقوف أو عيار غير مدرج) تصل بلا قيمة
 * ومعها `reason`، ولا تدخل أي مجموع.
 */

export type HoldingProduct = {
  sku: string;
  name: string;
  subtitle: string | null;
  metal: "gold" | "silver";
  karat: number;
  purity: string;
  weight_grams: string;
  image_url: string | null;
};

export type HoldingLine = {
  product: HoldingProduct;
  quantity: number;
  cost_piasters: number;
  value_piasters: number | null;
  gain_piasters: number | null;
  gain_pct: number | null;
  /** سبب تعذّر التسعير، حين تكون القيمة غائبة. */
  reason?: string;
};

export type MetalTotals = {
  metal: "gold" | "silver";
  items: number;
  lines: number;
  cost_piasters: number;
  value_piasters: number;
  gain_piasters: number;
  gain_pct: number | null;
};

export type HoldingsTotals = {
  items: number;
  lines: number;
  /** أسطر تعذّر تسعيرها — المجاميع أدناه لا تشملها. */
  unpriced: number;
  cost_piasters: number;
  value_piasters: number;
  gain_piasters: number;
  gain_pct: number | null;
  by_metal: MetalTotals[];
};

export type Holdings = { as_of: string; totals: HoldingsTotals; items: HoldingLine[] };

export const holdingsQuery = queryOptions({
  queryKey: ["holdings"],
  queryFn: () => api<Holdings>("/holdings"),
  staleTime: 30_000,
});

export const egpOf = (piasters: number | null | undefined) =>
  piasters == null ? null : piasters / 100;
