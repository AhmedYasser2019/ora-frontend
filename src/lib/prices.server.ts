/**
 * الأسعار الحيّة من الباك إند.
 *
 * كل رقم هنا يأتي من `GET /api/v1/prices` — السعر الذي نشره مكتب التسعير، بعد الهامش
 * والتقريب اللذين يسعّر بهما الخادم فعلًا. لا حساب هنا ولا اشتقاق: أي عملية حسابية في
 * الواجهة هي نسخة ثانية من قواعد التسعير، وأول مرة تختلف النسختان يرى العميل سعرًا
 * لا ننفّذ عليه.
 */

const API_URL = process.env["API_URL"] ?? "http://localhost:8000";

export type GramPrices = {
  k24: number;
  k21: number;
  silver: number;
};

export type LivePrices = {
  updatedAt: string;
  /** الخادم يسعّر بالجنيه مباشرة، فلا يوجد سعر دولار نُسعِّر منه. */
  usdEgp: number | null;
  spreadPct: number | null;
  /** سعر الشراء: ما يدفعه العميل. */
  gram: Partial<GramPrices>;
  /** سعر إعادة البيع: ما نشتري به من العميل. */
  sell: Partial<GramPrices>;
  /** المعادن الموقوف تداولها، والسبب. المفتاح موجود = لا يوجد سعر لعرضه. */
  halted: Record<string, string>;
};

/**
 * كل ردود الـ API ملفوفة في `{status, msg, data}` — انظر ApiEnvelope في الباك إند.
 */
export async function fetchLivePrices(): Promise<LivePrices> {
  const res = await fetch(`${API_URL}/api/v1/prices`, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) throw new Error(`prices fetch failed: ${res.status}`);

  const body = (await res.json()) as { data: LivePrices };

  return body.data;
}
