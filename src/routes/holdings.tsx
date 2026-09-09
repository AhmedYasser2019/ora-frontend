import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, Eye, EyeOff, Gem, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";

import { intlLocale, tr, useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";
import { holdingValue, totals, KARATS, type Holding, type Karat } from "@/lib/holdings";

export const Route = createFileRoute("/holdings")({
  head: () => ({
    meta: [
      { title: tr("ممتلكاتي | أورا للذهب") },
      {
        name: "description",
        content: tr("سجّل ما تملكه من ذهب وفضة وتابع قيمته الحالية وأرباحه بالسعر اللحظي."),
      },
      { property: "og:title", content: tr("ممتلكاتي | أورا للذهب") },
      { property: "og:description", content: tr("تقييم لحظي لما تملكه من ذهب وفضة.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: HoldingsPage,
});

const STORAGE_KEY = "ora-holdings-v1";

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "gold", label: "ذهب" },
  { key: "silver", label: "فضة" },
] as const;

const grams = (n: number) =>
  new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 3 }).format(n);

const pct = (n: number) =>
  new Intl.NumberFormat(intlLocale(), {
    style: "percent",
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(n);

const karatLabel = (k: Karat) => KARATS.find((o) => o.key === k)!.label;

const emptyForm = { name: "", karat: "k24" as Karat, grams: "", qty: "1", cost: "" };

function HoldingsPage() {
  const t = useT();
  const { data: prices } = useLivePrices();
  const [items, setItems] = useState<Holding[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [hidden, setHidden] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as Holding[]);
    } catch {
      /* تجاهل */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* تجاهل */
    }
  }, [items, ready]);

  // التقييم بسعر إعادة البيع، مثل رصيد الذهب في المحفظة.
  const sell = prices?.sell ?? { k24: 0, k22: 0, k21: 0, silver: 0 };
  const sum = totals(items, sell);
  const goldCount = items.filter((h) => h.karat !== "silver").length;
  const shown = items.filter((h) =>
    filter === "all" ? true : filter === "silver" ? h.karat === "silver" : h.karat !== "silver",
  );

  const money = (n: number) => (hidden ? "••••••" : `${egp(n)} ${t("ج.م")}`);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const g = Number(form.grams);
    const qty = Number(form.qty);
    const cost = Number(form.cost);
    if (!Number.isFinite(g) || g <= 0 || !Number.isFinite(qty) || qty <= 0) return;
    setItems((prev) => [
      {
        id: crypto.randomUUID(),
        name: form.name.trim() || t(karatLabel(form.karat)),
        karat: form.karat,
        grams: g,
        qty,
        ...(form.cost && Number.isFinite(cost) && cost > 0 ? { cost } : {}),
      },
      ...prev,
    ]);
    setForm({ ...emptyForm, karat: form.karat });
  };

  const input =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-gold";
  const Trend = sum.gain < 0 ? TrendingDown : TrendingUp;

  return (
    <PageShell
      title="ممتلكاتي"
      subtitle="سجّل ما تملكه من ذهب وفضة، وتابع قيمته الحالية بسعر البيع اللحظي وأرباحه عن سعر الشراء. البيانات محفوظة على جهازك وحده."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gold/40 bg-gradient-green p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs text-primary-foreground/80">
                {t("إجمالي قيمة الممتلكات")}
              </span>
              <button
                type="button"
                onClick={() => setHidden((v) => !v)}
                aria-label={t(hidden ? "إظهار القيم" : "إخفاء القيم")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20"
              >
                {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <p className="mt-5 font-display text-4xl text-gold">{money(sum.total)}</p>
            {sum.cost > 0 && (
              <span
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  sum.gain < 0
                    ? "bg-destructive/20 text-destructive-foreground"
                    : "bg-gold/20 text-gold"
                }`}
              >
                <Trend className="h-3.5 w-3.5" />
                {pct(sum.gainPct)} · {hidden ? "••••" : `${egp(sum.gain)} ${t("ج.م")}`}
              </span>
            )}

            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-5 text-center">
              <div>
                <dt className="flex items-center justify-center gap-1.5 text-xs text-primary-foreground/70">
                  <Gem className="h-3.5 w-3.5 text-gold" /> {t("ذهب")}
                </dt>
                <dd className="mt-2 text-sm font-semibold">{money(sum.gold)}</dd>
              </div>
              <div>
                <dt className="flex items-center justify-center gap-1.5 text-xs text-primary-foreground/70">
                  <Coins className="h-3.5 w-3.5 text-gold" /> {t("فضة")}
                </dt>
                <dd className="mt-2 text-sm font-semibold">{money(sum.silver)}</dd>
              </div>
              <div>
                <dt className="text-xs text-primary-foreground/70">{t("عناصر")}</dt>
                <dd className="mt-2 text-sm font-semibold">{sum.count}</dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-primary hover:bg-secondary/70"
                }`}
              >
                {t(f.label)}
                <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">
                  {f.key === "all"
                    ? sum.count
                    : f.key === "gold"
                      ? goldCount
                      : sum.count - goldCount}
                </span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card px-5 py-16 text-center text-sm text-muted-foreground">
              {t(
                items.length === 0
                  ? "لم تسجّل أي ممتلكات بعد — أضف أول قطعة من النموذج."
                  : "لا عناصر في هذا التصنيف.",
              )}
            </p>
          ) : (
            <ul className="space-y-3">
              {shown.map((h) => {
                const v = holdingValue(h, sell);
                const gain = h.cost != null ? v - h.cost : null;
                return (
                  <li
                    key={h.id}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                      {h.karat === "silver" ? (
                        <Coins className="h-5 w-5" />
                      ) : (
                        <Gem className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary">{h.name}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                        <span className="rounded-md bg-secondary px-2 py-0.5">
                          {t(karatLabel(h.karat))}
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-0.5">
                          {grams(h.grams)} {t("جرام")}
                        </span>
                        {h.qty > 1 && (
                          <span className="rounded-md bg-secondary px-2 py-0.5">×{h.qty}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-muted-foreground">{t("القيمة الحالية")}</p>
                      <p className="mt-1 font-display text-lg text-primary">{money(v)}</p>
                      {gain !== null && (
                        <span
                          className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            gain < 0
                              ? "bg-destructive/10 text-destructive"
                              : "bg-gold/15 text-gold-deep"
                          }`}
                        >
                          {pct(gain / h.cost!)} · {hidden ? "••••" : egp(gain)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== h.id))}
                      aria-label={t("حذف")}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <form onSubmit={add} className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg text-primary">{t("إضافة قطعة")}</h2>

            <div>
              <label htmlFor="h-name" className="mb-1 block text-xs font-semibold text-primary">
                {t("الاسم")} <span className="text-muted-foreground">({t("اختياري")})</span>
              </label>
              <input
                id="h-name"
                className={input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("سبيكة ذهب 10 جرام")}
              />
            </div>

            <div>
              <label htmlFor="h-karat" className="mb-1 block text-xs font-semibold text-primary">
                {t("النوع والعيار")}
              </label>
              <select
                id="h-karat"
                className={input}
                value={form.karat}
                onChange={(e) => setForm({ ...form, karat: e.target.value as Karat })}
              >
                {KARATS.map((k) => (
                  <option key={k.key} value={k.key}>
                    {t(k.label)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="h-grams" className="mb-1 block text-xs font-semibold text-primary">
                  {t("الوزن (جرام)")}
                </label>
                <input
                  id="h-grams"
                  dir="ltr"
                  className={input}
                  type="number"
                  min="0"
                  step="0.001"
                  inputMode="decimal"
                  value={form.grams}
                  onChange={(e) => setForm({ ...form, grams: e.target.value })}
                  placeholder="10"
                  required
                />
              </div>
              <div>
                <label htmlFor="h-qty" className="mb-1 block text-xs font-semibold text-primary">
                  {t("العدد")}
                </label>
                <input
                  id="h-qty"
                  dir="ltr"
                  className={input}
                  type="number"
                  min="1"
                  step="1"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="h-cost" className="mb-1 block text-xs font-semibold text-primary">
                {t("سعر الشراء الإجمالي")}{" "}
                <span className="text-muted-foreground">({t("اختياري")})</span>
              </label>
              <input
                id="h-cost"
                dir="ltr"
                className={input}
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="72000"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("سجّله ليُحسب الربح أو الخسارة.")}
              </p>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> {t("أضف إلى ممتلكاتي")}
            </button>
          </form>

          <p className="rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            {t(
              "التقييم بسعر إعادة البيع اللحظي — أي ما ستقبضه لو بعت الآن، دون خصم المصنعية. بياناتك محفوظة على هذا المتصفح ولا تُرسل لأي خادم.",
            )}
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
