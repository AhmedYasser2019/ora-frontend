const GOLD_URL = "https://api.gold-api.com/price/XAU";
const SILVER_URL = "https://api.gold-api.com/price/XAG";
const FX_URL = "https://open.er-api.com/v6/latest/USD";

const OZ_TO_GRAM = 31.1034768;

export type LivePrices = {
  updatedAt: string;
  usdEgp: number;
  gram: { k24: number; k22: number; k21: number; k18: number; silver: number };
  items: Record<string, number>;
};

async function getJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`fetch failed ${url}: ${res.status}`);
  return res.json() as Promise<any>;
}

export async function fetchLivePrices(): Promise<LivePrices> {
  const [gold, silver, fx] = await Promise.all([
    getJson(GOLD_URL),
    getJson(SILVER_URL),
    getJson(FX_URL),
  ]);

  const usdEgp = Number(fx?.rates?.EGP) || 48.5;
  const goldGramUsd = Number(gold?.price) / OZ_TO_GRAM;
  const silverGramUsd = Number(silver?.price) / OZ_TO_GRAM;

  // Local retail gram prices (spot + typical Egyptian market premium).
  const premium = 1.05;
  const k24 = goldGramUsd * usdEgp * premium;
  const gram = {
    k24,
    k22: k24 * (22 / 24),
    k21: k24 * (21 / 24),
    k18: k24 * (18 / 24),
    silver: silverGramUsd * usdEgp * 1.15,
  };

  // Product catalogue priced from the live gram rate + fabrication fee.
  const items = {
    "bar-10g": gram.k24 * 10 * 1.03,
    "coin-8g": gram.k22 * 8 * 1.06,
    "set-12g": gram.k21 * 12 * 1.09,
    "silver-100g": gram.silver * 100 * 1.04,
  };

  return {
    updatedAt: String(gold?.updatedAt ?? new Date().toISOString()),
    usdEgp,
    gram,
    items,
  };
}
