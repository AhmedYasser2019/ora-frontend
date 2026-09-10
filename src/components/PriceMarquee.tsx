import { WifiOff, Radio } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { productsQuery } from "@/lib/catalog.queries";
import { intlLocale, useT } from "@/lib/i18n";
import { egp } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";

const time = (ts: number) =>
  ts ? new Intl.DateTimeFormat(intlLocale(), { timeStyle: "medium" }).format(new Date(ts)) : "—";

export function PriceMarquee() {
  const { data, live, dataUpdatedAt } = useLivePrices();
  const { data: catalog } = useQuery(productsQuery);
  const t = useT();

  const perGram = `${t("ج.م")} / ${t("جرام")}`;

  // المعدن الموقوف تداوله لا يصل بسعر، فيسقط من الشريط بدل أن يُعرض بسعر قديم.
  const gramRows = data
    ? (
        [
          [t("ذهب عيار 24"), data.gram.k24],
          [t("ذهب عيار 21"), data.gram.k21],
          [t("الفضة"), data.gram.silver],
        ] as const
      )
        .filter(([, v]) => v !== undefined)
        .map(([label, v]) => ({ label, value: `${egp(v as number)} ${perGram}` }))
    : [];

  const productRows = (catalog ?? [])
    .filter((p) => p.price !== undefined)
    .slice(0, 2)
    .map((p) => ({ label: t(p.t), value: `${egp(p.price as number)} ${t("ج.م")}` }));

  const priceItems = gramRows.length
    ? [...gramRows, ...productRows]
    : [{ label: t("جارٍ تحميل الأسعار"), value: "..." }];

  const statusItem = {
    label: live ? t("بث مباشر") : t("الاتصال متعذر"),
    value: live ? t("متصل") : t("غير متصل"),
    status: live ? ("live" as const) : ("offline" as const),
  };

  const items = [statusItem, ...priceItems];
  const track = [...items, ...items];

  return (
    <div className="border-b border-gold/20 bg-primary text-primary-foreground">
      {!live && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-destructive/15 px-4 py-1.5 text-center text-[11px] text-gold">
          <WifiOff className="h-3.5 w-3.5" />
          <span className="font-semibold">{t("انقطع الاتصال بالبث اللحظي")}</span>
          <span className="text-primary-foreground/70">
            {data
              ? `${t("الأسعار المعروضة هي آخر أسعار معروفة — آخر تحديث")} ${time(dataUpdatedAt)}`
              : t("جارٍ إعادة المحاولة...")}
          </span>
        </div>
      )}
      <div className="overflow-hidden py-2">
        <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-8 whitespace-nowrap hover:[animation-play-state:paused]">
          {track.map((it, i) =>
            "status" in it ? (
              <span
                key={`status-${i}`}
                className={`flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  it.status === "live"
                    ? "bg-gold/15 text-gold"
                    : "bg-destructive/20 text-destructive"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      it.status === "live" ? "bg-gold" : "bg-destructive"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      it.status === "live" ? "bg-gold" : "bg-destructive"
                    }`}
                  />
                </span>
                <Radio className="h-3 w-3" />
                {it.label}
              </span>
            ) : (
              <span key={`${it.label}-${i}`} className="flex items-center gap-2 text-xs">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${live ? "bg-gold" : "bg-muted-foreground"}`}
                />
                <span className="text-primary-foreground/70">{it.label}</span>
                <span className={`font-semibold ${live ? "text-gold" : "text-gold/60"}`}>
                  {it.value}
                </span>
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
