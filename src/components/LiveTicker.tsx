import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { intlLocale, useT } from "@/lib/i18n";
import { egp } from "@/lib/prices.queries";
import type { PriceTick } from "@/lib/use-live-prices";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-8" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 28 - ((v - min) / span) * 24 - 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-8 w-full">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className="text-gold-deep"
      />
    </svg>
  );
}

function Delta({ diff }: { diff: number }) {
  const t = useT();
  const rounded = Math.round(diff);
  if (rounded === 0)
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" /> {t("ثابت")}
      </span>
    );
  const up = rounded > 0;
  return (
    <span className={`flex items-center gap-1 ${up ? "text-emerald-600" : "text-destructive"}`}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {up ? "+" : "−"}
      {egp(Math.abs(rounded))}
    </span>
  );
}

const time = (at: number) =>
  new Date(at).toLocaleTimeString(intlLocale(), { minute: "2-digit", second: "2-digit" });

export function LiveTicker({ history }: { history: PriceTick[] }) {
  const t = useT();
  const rows = [...history].reverse().slice(0, 8);
  const first = history[0];
  const last = history[history.length - 1];

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg text-primary">{t("سجل آخر 60 ثانية")}</h3>
        <span className="text-xs text-muted-foreground">
          {history.length} {t("تحديث")}
        </span>
      </div>

      {history.length < 2 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t("جاري تجميع التحديثات اللحظية…")}
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("جرام عيار 24")}</span>
            <Delta diff={(last?.k24 ?? 0) - (first?.k24 ?? 0)} />
          </div>
          <Sparkline values={history.map((h) => h.k24)} />

          <ul className="mt-3 divide-y divide-border text-xs">
            {rows.map((tick, i) => {
              const prev = rows[i + 1];
              return (
                <li key={tick.at} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="text-muted-foreground">{time(tick.at)}</span>
                  <span className="font-display text-sm text-primary">{egp(tick.k24)}</span>
                  <Delta diff={prev ? tick.k24 - prev.k24 : 0} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
