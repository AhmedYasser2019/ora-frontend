import { useQuery } from "@tanstack/react-query";

import { egp, livePricesQuery } from "@/lib/prices.queries";

export function PriceMarquee() {
  const { data } = useQuery(livePricesQuery);

  const items = data
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

  const track = [...items, ...items];

  return (
    <div className="overflow-hidden border-b border-gold/20 bg-primary py-2 text-primary-foreground">
      <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-8 whitespace-nowrap hover:[animation-play-state:paused]">
        {track.map((it, i) => (
          <span key={`${it.label}-${i}`} className="flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-primary-foreground/70">{it.label}</span>
            <span className="font-semibold text-gold">{it.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
