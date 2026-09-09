import type { GramPrices } from "./prices.server";

/** عيارات الذهب المتاحة في أسعار الجرام + الفضة. */
export type Karat = keyof GramPrices;

export type Holding = {
  id: string;
  name: string;
  karat: Karat;
  grams: number;
  qty: number;
  /** إجمالي ما دُفع عند الشراء — اختياري، وبدونه لا يُحسب ربح لهذا العنصر. */
  cost?: number;
};

export const KARATS: { key: Karat; label: string }[] = [
  { key: "k24", label: "عيار 24" },
  { key: "k22", label: "عيار 22" },
  { key: "k21", label: "عيار 21" },
  { key: "silver", label: "فضة 999" },
];

/** القيمة الحالية بسعر إعادة البيع: هو ما ستقبضه فعليًا لو بعت الآن. */
export const holdingValue = (h: Holding, sell: GramPrices) => sell[h.karat] * h.grams * h.qty;

export function totals(items: Holding[], sell: GramPrices) {
  let gold = 0;
  let silver = 0;
  let cost = 0;
  // الربح يُقاس على العناصر المسجَّل سعر شرائها فقط، وإلا ظهرت كل حيازة بلا تكلفة كربح كامل.
  let costedValue = 0;

  for (const h of items) {
    const v = holdingValue(h, sell);
    if (h.karat === "silver") silver += v;
    else gold += v;
    if (h.cost != null) {
      cost += h.cost;
      costedValue += v;
    }
  }

  const gain = costedValue - cost;
  return {
    total: gold + silver,
    gold,
    silver,
    cost,
    gain,
    gainPct: cost > 0 ? gain / cost : 0,
    count: items.length,
  };
}
