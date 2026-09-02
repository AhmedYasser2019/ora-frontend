const GOLD_URL = "https://api.gold-api.com/price/XAU";
const SILVER_URL = "https://api.gold-api.com/price/XAG";
const FX_URL = "https://open.er-api.com/v6/latest/USD";

const OZ_TO_GRAM = 31.1034768;

/** الفرق بين سعر الشراء وسعر إعادة البيع (هامش التاجر). */
export const SPREAD_PCT = 0.008;

export type GramPrices = {
  k24: number;
  k22: number;
  k21: number;
  k18: number;
  k14: number;
  k12: number;
  silver: number;
};

export type LivePrices = {
  updatedAt: string;
  usdEgp: number;
  spreadPct: number;
  /** سعر الشراء: ما يدفعه العميل. */
  gram: GramPrices;
  /** سعر إعادة البيع: ما نشتري به من العميل. */
  sell: GramPrices;
};

async function getJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`fetch failed ${url}: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

const applySpread = (g: GramPrices): GramPrices =>
  Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v * (1 - SPREAD_PCT)])) as GramPrices;

export async function fetchLivePrices(): Promise<LivePrices> {
  const [gold, silver, fx] = await Promise.all([
    getJson(GOLD_URL),
    getJson(SILVER_URL),
    getJson(FX_URL),
  ]);

  const rates = fx["rates"] as Record<string, number> | undefined;
  const usdEgp = Number(rates?.["EGP"]) || 48.5;
  const goldGramUsd = Number(gold["price"]) / OZ_TO_GRAM;
  const silverGramUsd = Number(silver["price"]) / OZ_TO_GRAM;

  // Local retail gram prices (spot + typical Egyptian market premium).
  const premium = 1.05;
  const k24 = goldGramUsd * usdEgp * premium;
  const gram: GramPrices = {
    k24,
    k22: k24 * (22 / 24),
    k21: k24 * (21 / 24),
    k18: k24 * (18 / 24),
    k14: k24 * (14 / 24),
    k12: k24 * (12 / 24),
    silver: silverGramUsd * usdEgp * 1.15,
  };

  // أسعار المنتجات تُشتق من سعر الجرام + مصنعية كل منتج (انظر buyPrice/sellPrice في site.ts).
  const sell = applySpread(gram);

  return {
    updatedAt: String(gold["updatedAt"] ?? new Date().toISOString()),
    usdEgp,
    spreadPct: SPREAD_PCT,
    gram,
    sell,
  };
}
