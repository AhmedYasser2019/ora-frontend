import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useT } from "@/lib/i18n";
import { egp } from "@/lib/prices.queries";
import type { PriceTick, TickKey } from "@/lib/use-live-prices";

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

/**
 * رسم بياني لحظي لسعر الجرام خلال آخر 60 ثانية.
 * المحور الأفقي بالثواني الماضية (−60ث … الآن) لأن النافذة دقيقة واحدة.
 */
export function PriceChart({
  history,
  series,
  label,
  compact = false,
}: {
  history: PriceTick[];
  series: TickKey;
  label: string;
  compact?: boolean;
}) {
  const t = useT();
  const now = history[history.length - 1]?.at ?? Date.now();
  const ago = (at: number) => `${Math.round((at - now) / 1000)}${t("ث")}`;

  if (history.length < 2)
    return (
      <p
        className={`text-center text-xs text-muted-foreground ${compact ? "py-6" : "py-16"}`}
        style={compact ? { height: 92 } : undefined}
      >
        {t("جاري تجميع التحديثات اللحظية…")}
      </p>
    );

  return (
    <ResponsiveContainer width="100%" height={compact ? 92 : 200}>
      <AreaChart data={history} margin={{ top: 6, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id={`fill-${series}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold-deep)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--gold-deep)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="at"
          hide={compact}
          tickFormatter={ago}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={40}
          reversed
        />
        <YAxis
          domain={["dataMin - 2", "dataMax + 2"]}
          width={compact ? 46 : 56}
          tickCount={compact ? 2 : 4}
          tick={{ fontSize: compact ? 9 : 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => egp(v)}
          orientation="right"
        />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          labelFormatter={ago}
          formatter={(v: number) => [`${egp(v)} ${t("ج.م")}`, label]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--card)",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey={series}
          stroke="var(--gold-deep)"
          strokeWidth={2}
          fill={`url(#fill-${series})`}
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** لوحة السجل اللحظي: الفرق خلال الدقيقة الأخيرة + الرسم البياني. */
export function LiveTicker({
  history,
  series,
  label,
}: {
  history: PriceTick[];
  series: TickKey;
  label: string;
}) {
  const t = useT();
  const first = history[0]?.[series] ?? 0;
  const last = history[history.length - 1]?.[series] ?? 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg text-primary">{t("سجل آخر 60 ثانية")}</h3>
        <span className="text-xs text-muted-foreground">
          {history.length} {t("تحديث")}
        </span>
      </div>

      {history.length >= 2 && (
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {t("جرام")} {label}
          </span>
          <Delta diff={last - first} />
        </div>
      )}

      <PriceChart history={history} series={series} label={label} />
    </div>
  );
}
