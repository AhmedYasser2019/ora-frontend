/**
 * مواعيد السوق من الباك إند (`GET /v1/market`، انظر MarketController و config/market.php).
 * الأيام والساعات تُضبط هناك فقط — الموقع لا يعرفها، يعدّ تنازليًا للحظة التي أعطاها الخادم.
 */

const DAY = 86400;

/** ما يعيده MarketController::show — واحد فقط من `opens_at` / `closes_at` له قيمة. */
export type Market = {
  open: boolean;
  server_time: string;
  opens_at: string | null;
  closes_at: string | null;
};

/**
 * الثواني الباقية حتى يُفتح السوق أو يُغلق، بساعة الخادم لا بساعة الجهاز.
 * `skew` = ساعة الخادم − ساعة الجهاز لحظة وصول الرد، فجهاز ساعته غلط يعدّ صح.
 */
export function secondsToNext(m: Market, skew: number, now = Date.now()) {
  const target = Date.parse((m.open ? m.closes_at : m.opens_at) ?? m.server_time);
  return Math.max(0, Math.ceil((target - now - skew) / 1000));
}

export function splitDuration(total: number) {
  return {
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
