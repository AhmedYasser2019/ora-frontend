import { WifiOff, Radio } from "lucide-react";

import { egp } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";

const time = (ts: number) =>
  ts ? new Intl.DateTimeFormat("ar-EG", { timeStyle: "medium" }).format(new Date(ts)) : "—";

export function PriceMarquee() {
  const { data, live, dataUpdatedAt } = useLivePrices();

  const priceItems = data
    ? [
        { label: "ذهب عيار 24", value: `${egp(data.gram.k24)} ج.م / جرام` },
        { label: "ذهب عيار 22", value: `${egp(data.gram.k22)} ج.م / جرام` },
        { label: "ذهب عيار 21", value: `${egp(data.gram.k21)} ج.م / جرام` },
        { label: "ذهب عيار 18", value: `${egp(data.gram.k18)} ج.م / جرام` },
        { label: "الفضة", value: `${egp(data.gram.silver)} ج.م / جرام` },
        { label: "الدولار", value: `${data.usdEgp.toFixed(2)} ج.م` },
        { label: "سبيكة 10 جرام", value: `${egp(data.items["bar-10g"] ?? 0)} ج.م` },
        { label: "جنيه ذهب 8 جرام", value: `${egp(data.items["coin-8g"] ?? 0)} ج.م` },
      ]
    : [{ label: "جارٍ تحميل الأسعار", value: "..." }];

  const statusItem = {
    label: live ? "بث مباشر" : "الاتصال متعذر",
    value: live ? "متصل" : "غير متصل",
    status: live ? ("live" as const) : ("offline" as const),
  };

  const items = [statusItem, ...priceItems];
  const track = [...items, ...items];

  return (
    <div className="border-b border-gold/20 bg-primary text-primary-foreground">
      {!live && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-destructive/15 px-4 py-1.5 text-center text-[11px] text-gold">
          <WifiOff className="h-3.5 w-3.5" />
          <span className="font-semibold">انقطع الاتصال بالبث اللحظي</span>
          <span className="text-primary-foreground/70">
            {data
              ? `الأسعار المعروضة هي آخر أسعار معروفة — آخر تحديث ${time(dataUpdatedAt)}`
              : "جارٍ إعادة المحاولة..."}
          </span>
        </div>
      )}
      <div className="overflow-hidden py-2">
        <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-8 whitespace-nowrap hover:[animation-play-state:paused]">
          {track.map((it, i) => (
            <span key={`${it.label}-${i}`} className="flex items-center gap-2 text-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-gold" : "bg-muted-foreground"}`} />
              <span className="text-primary-foreground/70">{it.label}</span>
              <span className={`font-semibold ${live ? "text-gold" : "text-gold/60"}`}>
                {it.value}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
