import { useState } from "react";
import { ArrowLeftRight, TrendingDown, TrendingUp } from "lucide-react";

import { egp } from "@/lib/prices.queries";
import type { GramPrices } from "@/lib/prices.server";

const GOLD_ROWS: { key: keyof GramPrices; label: string }[] = [
  { key: "k24", label: "عيار 24" },
  { key: "k22", label: "عيار 22" },
  { key: "k21", label: "عيار 21" },
  { key: "k18", label: "عيار 18" },
  { key: "k14", label: "عيار 14" },
  { key: "k12", label: "عيار 12" },
];

const SILVER_ROWS: { key: keyof GramPrices; label: string }[] = [
  { key: "silver", label: "فضة 999" },
];

/**
 * لوحة الأسعار: سعر الشراء وسعر البيع والفرق بينهما لكل عيار.
 * سعر الشراء هو ما يدفعه العميل، وسعر البيع هو ما ندفعه له عند إعادة الشراء.
 */
export function PriceBoard({
  metal,
  gram,
  sell,
  spreadPct,
}: {
  metal: "gold" | "silver";
  gram?: GramPrices | undefined;
  sell?: GramPrices | undefined;
  spreadPct?: number | undefined;
}) {
  const rows = metal === "gold" ? GOLD_ROWS : SILVER_ROWS;
  const [active, setActive] = useState<keyof GramPrices>(rows[0]!.key);

  const buyValue = gram?.[active];
  const sellValue = sell?.[active];
  const diff = buyValue !== undefined && sellValue !== undefined ? buyValue - sellValue : undefined;

  return (
    <div className="space-y-4">
      {rows.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {rows.map((r) => (
            <button
              key={r.key}
              onClick={() => setActive(r.key)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                active === r.key
                  ? "border-gold bg-primary text-primary-foreground"
                  : "border-border bg-card text-primary hover:border-gold"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-gold/40 bg-gradient-green p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg text-gold">
            {rows.find((r) => r.key === active)?.label}
          </p>
          <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold text-gold">
            السعر الرئيسي
          </span>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
              <TrendingUp className="h-3.5 w-3.5 text-gold" /> سعر الشراء
            </dt>
            <dd className="mt-1 font-display text-2xl text-gold">
              {buyValue ? egp(buyValue) : "—"} <span className="text-sm">ج.م</span>
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
              <TrendingDown className="h-3.5 w-3.5 text-gold" /> سعر البيع
            </dt>
            <dd className="mt-1 font-display text-2xl text-gold">
              {sellValue ? egp(sellValue) : "—"} <span className="text-sm">ج.م</span>
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
              <ArrowLeftRight className="h-3.5 w-3.5 text-gold" /> فرق السعر
            </dt>
            <dd className="mt-1 font-display text-2xl text-gold">
              {diff !== undefined ? egp(diff) : "—"} <span className="text-sm">ج.م</span>
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-[11px] leading-relaxed text-primary-foreground/70">
          سعر الشراء هو ما تدفعه عند الشراء، وسعر البيع هو ما ندفعه لك عند إعادة الشراء منك. الفرق
          بينهما {spreadPct ? (spreadPct * 100).toFixed(1) : "—"}% ويمثل هامش التشغيل، وهو ثابت
          ومعلن.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="bg-cream text-primary">
            <tr>
              <th className="px-4 py-3 text-right font-semibold">العيار</th>
              <th className="px-4 py-3 text-right font-semibold">سعر الشراء</th>
              <th className="px-4 py-3 text-right font-semibold">سعر البيع</th>
              <th className="px-4 py-3 text-right font-semibold">الفرق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const b = gram?.[r.key];
              const s = sell?.[r.key];
              return (
                <tr
                  key={r.key}
                  onClick={() => setActive(r.key)}
                  className={`cursor-pointer transition-colors hover:bg-secondary/40 ${
                    active === r.key ? "bg-gold/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-primary">{r.label}</td>
                  <td className="px-4 py-3 font-display text-base text-gold-deep">
                    {b ? egp(b) : "—"}
                  </td>
                  <td className="px-4 py-3 font-display text-base text-primary">
                    {s ? egp(s) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {b && s ? egp(b - s) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
