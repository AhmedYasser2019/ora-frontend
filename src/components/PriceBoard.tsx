import { useState } from "react";
import { TrendingUp } from "lucide-react";

import { useT } from "@/lib/i18n";
import { egp } from "@/lib/prices.queries";
import type { GramPrices } from "@/lib/prices.server";

const GOLD_ROWS: { key: keyof GramPrices; label: string }[] = [
  { key: "k24", label: "عيار 24" },
  { key: "k21", label: "عيار 21" },
];

const SILVER_ROWS: { key: keyof GramPrices; label: string }[] = [
  { key: "silver", label: "فضة 999" },
];

/**
 * لوحة الأسعار: سعر واحد لكل عيار — سعر الشراء، وهو ما يدفعه العميل.
 * العملاء على الموقع يشترون فقط، فلا نعرض سعر بيع لا يستطيعون التنفيذ عليه.
 */
export function PriceBoard({
  metal,
  gram,
  halted,
}: {
  metal: "gold" | "silver";
  gram?: Partial<GramPrices> | undefined;
  /** سبب إيقاف التداول من الخادم، إن وُجد. */
  halted?: string | undefined;
}) {
  const t = useT();
  const rows = metal === "gold" ? GOLD_ROWS : SILVER_ROWS;
  const [active, setActive] = useState<keyof GramPrices>(rows[0]!.key);

  const buyValue = gram?.[active];

  if (halted) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
        <p className="font-display text-lg text-primary">{t("التداول متوقف")}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{halted}</p>
      </div>
    );
  }

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
              {t(r.label)}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-gold/40 bg-gradient-green p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg text-gold">
            {t(rows.find((r) => r.key === active)?.label ?? "")}
          </p>
          <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold text-gold">
            {t("السعر الرئيسي")}
          </span>
        </div>

        <dl className="mt-5">
          <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
            <TrendingUp className="h-3.5 w-3.5 text-gold" /> {t("سعر الجرام")}
          </dt>
          <dd className="mt-1 font-display text-3xl text-gold">
            {buyValue ? egp(buyValue) : "—"} <span className="text-sm">{t("ج.م")}</span>
          </dd>
        </dl>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-cream text-primary">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{t("العيار")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("سعر الجرام")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const b = gram?.[r.key];
              return (
                <tr
                  key={r.key}
                  onClick={() => setActive(r.key)}
                  className={`cursor-pointer transition-colors hover:bg-secondary/40 ${
                    active === r.key ? "bg-gold/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-primary">{t(r.label)}</td>
                  <td className="px-4 py-3 font-display text-base text-gold-deep">
                    {b ? egp(b) : "—"}
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
