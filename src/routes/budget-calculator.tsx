import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, Coins, Radio, Sparkles, TrendingDown } from "lucide-react";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";
import { allProducts, buyPrice, gramKeyOf, weightLabel, type Metal } from "@/lib/site";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/budget-calculator")({
  head: () => ({
    meta: [
      { title: tr("حاسبة الميزانية | كم ذهب تشتري بميزانيتك؟ — أورا") },
      {
        name: "description",
        content: tr(
          "أدخل ميزانيتك واختر المعدن والعيار، وسنعرض لك بالسعر اللحظي كم جرامًا تشتري وأفضل المنتجات في حدود ميزانيتك.",
        ),
      },
      { property: "og:title", content: tr("حاسبة الميزانية | أورا للذهب") },
      {
        property: "og:description",
        content: tr("احسب كم ذهبًا أو فضة تشتري بميزانيتك بالسعر اللحظي."),
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: BudgetCalculatorPage,
});

const GOLD_KARATS = [24, 22, 21, 18] as const;

function BudgetCalculatorPage() {
  const { data, live } = useLivePrices();
  const t = useT();
  const [metal, setMetal] = useState<Metal>("gold");
  const [karat, setKarat] = useState<(typeof GOLD_KARATS)[number]>(24);
  const [budget, setBudget] = useState("");
  const [submitted, setSubmitted] = useState(0);

  const amount = Number(budget);
  const valid = Number.isFinite(amount) && amount > 0;
  const gramKey = metal === "silver" ? "silver" : (`k${karat}` as const);
  const gramPrice = data?.gram[gramKey] ?? 0;

  /** أفضل الخيارات: المنتجات التي تدخل في الميزانية، مرتبة بالأقل مصنعية لكل جرام. */
  const options = useMemo(() => {
    if (!submitted || !valid || !data) return [];
    return (
      allProducts
        .filter((p) => p.metal === metal && p.available)
        .filter((p) => metal === "silver" || gramKeyOf(p) === gramKey)
        .map((p) => {
          const unit = buyPrice(p, data.gram) ?? 0;
          const qty = unit > 0 ? Math.floor(amount / unit) : 0;
          return { p, unit, qty, totalG: qty * p.weightG, spent: qty * unit };
        })
        .filter((o) => o.qty > 0)
        // الأفضل = أكبر وزن معدن مقابل الميزانية، ثم الأقل مصنعية.
        .sort((a, b) => b.totalG - a.totalG || a.p.fabrication - b.p.fabrication)
        .slice(0, 8)
    );
  }, [submitted, valid, data, metal, gramKey, amount]);

  const grossGrams = valid && gramPrice > 0 ? amount / gramPrice : 0;
  const best = options[0];

  const input =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-gold";

  return (
    <PageShell
      title="حاسبة الميزانية"
      subtitle="أدخل ميزانيتك واختر المعدن والعيار، وسنستخدم السعر المباشر المطابق لنعرض لك أفضل ما يمكنك شراؤه ضمن ميزانيتك."
    >
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted((n) => n + 1);
            }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg text-primary">{t("اختر المعدن")}</h2>
              <span
                className={`flex items-center gap-1 text-[11px] font-semibold ${
                  live ? "text-gold-deep" : "text-muted-foreground"
                }`}
              >
                <Radio className="h-3 w-3" />
                {live ? t("أسعار مباشرة") : t("غير متصل")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["gold", "silver"] as Metal[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetal(m)}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                    metal === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-primary hover:bg-secondary/70"
                  }`}
                >
                  {m === "gold" ? t("الذهب") : t("الفضة")}
                </button>
              ))}
            </div>

            {metal === "gold" && (
              <>
                <h2 className="mb-2 mt-6 font-display text-lg text-primary">{t("اختر العيار")}</h2>
                <div className="grid grid-cols-4 gap-2">
                  {GOLD_KARATS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKarat(k)}
                      className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors ${
                        karat === k
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-primary hover:bg-secondary/70"
                      }`}
                    >
                      {t("عيار")} {k}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label htmlFor="budget" className="mb-1 mt-6 block text-xs font-semibold text-primary">
              {t("ميزانيتك (ج.م)")}
            </label>
            <input
              id="budget"
              dir="ltr"
              type="number"
              min="0"
              step="100"
              inputMode="numeric"
              className={input}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="50000"
              required
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {[10_000, 25_000, 50_000, 100_000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBudget(String(v))}
                  className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-primary hover:border-gold"
                >
                  {egp(v)}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!valid}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Calculator className="h-4 w-4" />
              {t("احسب أفضل الخيارات")}
            </button>
          </form>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base text-primary">{t("كيف تعمل الحاسبة؟")}</h2>
            <ol className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <li>
                <span className="font-semibold text-primary">{t("1. أدخل ميزانيتك")}</span>{" "}
                {t("— حدد المبلغ الذي ترغب في إنفاقه.")}
              </li>
              <li>
                <span className="font-semibold text-primary">
                  {t("2. نتحقق من الأسعار المباشرة")}
                </span>{" "}
                {t("— نحسب ميزانيتك وفق أحدث سعر متاح للمعدن والعيار الذي اخترته.")}
              </li>
              <li>
                <span className="font-semibold text-primary">{t("3. احصل على أفضل الخيارات")}</span>{" "}
                {t("— نرتّب المنتجات بالأكثر وزنًا للمعدن مقابل ميزانيتك، ثم بالأقل مصنعية.")}
              </li>
            </ol>
          </div>
        </div>

        <div>
          {!submitted ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Coins className="h-10 w-10 text-gold-deep" />
              <p className="mt-4 text-lg text-primary">{t("أدخل ميزانيتك لنبدأ")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("سنعرض لك كم جرامًا تشتري وأفضل المنتجات المتاحة في حدود المبلغ.")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("سعر الجرام")} {metal === "gold" ? `${t("عيار")} ${karat}` : t("فضة 999")}
                  </p>
                  <p className="mt-2 font-display text-2xl text-primary">
                    {egp(gramPrice)} {t("ج.م")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground">{t("ميزانيتك تعادل")}</p>
                  <p className="mt-2 font-display text-2xl text-primary">
                    {grossGrams.toFixed(2)} {t("جرام")}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t("قيمة المعدن بدون مصنعية")}
                  </p>
                </div>
                <div className="rounded-2xl border border-gold/40 bg-gradient-green p-5 text-primary-foreground">
                  <p className="text-xs text-primary-foreground/70">{t("أفضل خيار فعلي")}</p>
                  <p className="mt-2 font-display text-2xl text-gold">
                    {best ? `${best.totalG.toFixed(2)} ${t("جرام")}` : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-primary-foreground/70">
                    {best
                      ? `${best.qty} × ${weightLabel(best.p.weightG)}`
                      : t("لا يوجد منتج مناسب")}
                  </p>
                </div>
              </div>

              {options.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                  <TrendingDown className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 text-lg text-primary">{t("لا يوجد منتج ضمن هذه الميزانية")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      "أصغر منتج متاح في هذا التصنيف يتجاوز المبلغ المدخل. جرّب مبلغًا أكبر أو عيارًا آخر.",
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead className="bg-secondary/60 text-xs text-primary">
                        <tr>
                          <th className="px-4 py-3 text-start font-semibold">{t("المنتج")}</th>
                          <th className="px-4 py-3 text-start font-semibold">{t("سعر القطعة")}</th>
                          <th className="px-4 py-3 text-start font-semibold">{t("الكمية")}</th>
                          <th className="px-4 py-3 text-start font-semibold">
                            {t("إجمالي الوزن")}
                          </th>
                          <th className="px-4 py-3 text-start font-semibold">{t("الإجمالي")}</th>
                          <th className="px-4 py-3 text-start font-semibold">{t("المتبقي")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {options.map((o, i) => (
                          <tr key={o.p.slug} className={i === 0 ? "bg-gold/5" : undefined}>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5 font-semibold text-primary">
                                {i === 0 && <Sparkles className="h-3.5 w-3.5 text-gold-deep" />}
                                {t(o.p.t)}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {t(o.p.provider)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{egp(o.unit)}</td>
                            <td className="px-4 py-3 text-primary">{o.qty}</td>
                            <td className="px-4 py-3 text-primary">
                              {o.totalG.toFixed(2)} {t("جم")}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gold-deep">
                              {egp(o.spent)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {egp(amount - o.spent)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h2 className="mb-4 font-display text-lg text-primary">{t("أفضل 4 خيارات")}</h2>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                      {options.slice(0, 4).map((o) => (
                        <ProductCard key={o.p.slug} p={o.p} price={o.unit} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(
                  "تُحسب الأسعار المعروضة باستخدام أسعار المعادن المباشرة، وقد تتغير مع تحديثات السوق. قد يختلف السعر النهائي أيضًا حسب المنتج والمورّد والنقاء والرسوم المطبقة.",
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
