import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { intlLocale, useT } from "@/lib/i18n";
import { egp, priceHistoryQuery } from "@/lib/prices.queries";
import type { HistoryRange } from "@/lib/prices.server";

const RANGES: [HistoryRange, string][] = [
  ["1d", "24 ساعة"],
  ["1w", "أسبوع"],
  ["1m", "شهر"],
  ["3m", "3 شهور"],
  ["1y", "سنة"],
  ["10y", "10 سنين"],
];

const FORMAT: Record<HistoryRange, Intl.DateTimeFormatOptions> = {
  "1d": { hour: "2-digit", minute: "2-digit" },
  "1w": { weekday: "short", hour: "2-digit" },
  "1m": { day: "numeric", month: "short" },
  "3m": { day: "numeric", month: "short" },
  "1y": { month: "short", year: "2-digit" },
  "10y": { year: "numeric" },
};

/**
 * تاريخ سعر الجرام: 24 ساعة، أسبوع، شهر، سنة، و10 سنين في رسم واحد بفلتر.
 * خط درجات لأن السعر بين نشرين كان السعر الأقدم فعلًا، لا شيء بينهما.
 */
export function PriceHistoryChart({ metal }: { metal: "gold" | "silver" }) {
  const t = useT();
  const [range, setRange] = useState<HistoryRange>("1d");
  const { data, isFetching } = useQuery({
    ...priceHistoryQuery(metal, range),
    placeholderData: keepPreviousData,
  });

  const points = (data?.points ?? []).map(([at, price]) => ({ at: at * 1000, price }));
  const first = points[0]?.price;
  const last = points[points.length - 1]?.price;
  const change = first && last ? ((last - first) / first) * 100 : null;
  const when = (at: number, options = FORMAT[range]) =>
    new Date(at).toLocaleString(intlLocale(), { timeZone: "Africa/Cairo", ...options });

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-primary">
            {t("تاريخ السعر")} · {t("عيار")} {data?.karat ?? ""}
          </h3>
          {change !== null && (
            <p
              className={`text-xs ${change >= 0 ? "text-emerald-600" : "text-destructive"}`}
              dir="ltr"
            >
              {change >= 0 ? "+" : "−"}
              {Math.abs(change).toFixed(2)}%
            </p>
          )}
        </div>

        <div
          role="group"
          aria-label={t("الفترة")}
          className="flex rounded-full bg-cream p-1 text-xs"
        >
          {RANGES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={`rounded-full px-3 py-1 transition ${
                range === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      {points.length < 2 ? (
        <p className="py-24 text-center text-xs text-muted-foreground">
          {isFetching ? t("جاري التحميل…") : t("لا توجد بيانات لهذه الفترة بعد.")}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={260} className={isFetching ? "opacity-60" : ""}>
          <AreaChart data={points} margin={{ top: 6, right: 2, bottom: 0, left: 2 }}>
            <defs>
              <linearGradient id="fill-history" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold-deep)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--gold-deep)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="at"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(at: number) => when(at)}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={["auto", "auto"]}
              width={56}
              tickCount={4}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => egp(v)}
              orientation="right"
            />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              labelFormatter={(at: number) =>
                when(at, {
                  dateStyle: "medium",
                  timeStyle: range === "1d" || range === "1w" ? "short" : undefined,
                })
              }
              formatter={(v: number) => [`${egp(v)} ${t("ج.م")}`, t("سعر الجرام")]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            <Area
              type="stepAfter"
              dataKey="price"
              stroke="var(--gold-deep)"
              strokeWidth={2}
              fill="url(#fill-history)"
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
