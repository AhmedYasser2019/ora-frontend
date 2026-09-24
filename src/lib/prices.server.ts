/**
 * الأسعار الحيّة من الباك إند.
 *
 * كل رقم هنا يأتي من `GET /api/v1/prices` — السعر الذي نشره مكتب التسعير، بعد الهامش
 * والتقريب اللذين يسعّر بهما الخادم فعلًا. لا حساب هنا ولا اشتقاق: أي عملية حسابية في
 * الواجهة هي نسخة ثانية من قواعد التسعير، وأول مرة تختلف النسختان يرى العميل سعرًا
 * لا ننفّذ عليه.
 */

import { readLang } from "./i18n";

import { API_URL, backend } from "./backend.server";

export type GramPrices = {
  k24: number;
  k21: number;
  silver: number;
};

export type LivePrices = {
  /** سعر الشراء: ما يدفعه العميل. */
  gram: Partial<GramPrices>;
  /** المعادن الموقوف تداولها، والسبب. المفتاح موجود = لا يوجد سعر لعرضه. */
  halted: Record<string, string>;
};

/**
 * كل ردود الـ API ملفوفة في `{status, msg, data}` — انظر ApiEnvelope في الباك إند.
 */
export async function fetchLivePrices(): Promise<LivePrices> {
  const res = await fetch(`${API_URL}/api/v1/prices`, {
    headers: backend({ accept: "application/json", "accept-language": readLang() }),
  });

  if (!res.ok) throw new Error(`prices fetch failed: ${res.status}`);

  const body = (await res.json()) as { data: LivePrices };

  return body.data;
}

export type HistoryRange = "1d" | "1w" | "1m" | "3m" | "1y" | "10y";

/** `[ثواني يونكس, جنيه للجرام]` بسعر الشراء لعيار المعدن الأساسي (21 للذهب)، نفس رقم `gram` — انظر PriceHistory في الباك إند. */
export type PriceHistory = { karat: number; points: [number, number][] };

export async function fetchPriceHistory(metal: string, range: HistoryRange): Promise<PriceHistory> {
  const res = await fetch(
    `${API_URL}/api/v1/prices/history?${new URLSearchParams({ metal, range })}`,
    {
      headers: backend({ accept: "application/json" }),
    },
  );

  if (!res.ok) throw new Error(`price history fetch failed: ${res.status}`);

  const body = (await res.json()) as { data: PriceHistory };

  return body.data;
}
