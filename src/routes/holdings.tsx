import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, Eye, EyeOff, Gem, LoaderCircle, TrendingDown, TrendingUp } from "lucide-react";

import { tr, useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { egp } from "@/lib/prices.queries";
import { holdingsQuery, egpOf, pct, type HoldingLine } from "@/lib/holdings";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/holdings")({
  head: () => ({
    meta: [
      { title: tr("ممتلكاتي | أورا للذهب") },
      {
        name: "description",
        content: tr("القطع التي اشتريتها من أورا، بتكلفتها وقيمتها الحالية بسعر البيع اللحظي."),
      },
      { property: "og:title", content: tr("ممتلكاتي | أورا للذهب") },
      { property: "og:description", content: tr("تقييم لحظي لما تملكه من ذهب وفضة.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HoldingsPage,
});

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "gold", label: "ذهب" },
  { key: "silver", label: "فضة" },
] as const;

function HoldingsPage() {
  const t = useT();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [hidden, setHidden] = useState(false);

  // ممتلكاتك مرتبطة بحسابك: بلا جلسة لا شيء نعرضه.
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/holdings" } });
  }, [loading, user, navigate]);

  const { data, isPending } = useQuery({ ...holdingsQuery, enabled: !!user });

  const money = (n: number | null) =>
    hidden ? "••••••" : n == null ? "—" : `${egp(n)} ${t("ج.م")}`;

  if (loading || !user || isPending || !data) {
    return (
      <PageShell title="ممتلكاتي">
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-gold-deep" />
        </div>
      </PageShell>
    );
  }

  const { totals, items } = data;
  const byMetal = (metal: "gold" | "silver") => totals.by_metal.find((m) => m.metal === metal);
  const goldCount = items.filter((h) => h.product.metal === "gold").length;
  const shown = items.filter((h) => filter === "all" || h.product.metal === filter);
  const Trend = totals.gain_piasters < 0 ? TrendingDown : TrendingUp;

  return (
    <PageShell
      title="ممتلكاتي"
      subtitle="القطع التي اشتريتها من أورا ولم تُلغَ أوامرها، بسعر شرائها وسعرها الحالي بسعر إعادة البيع اللحظي."
    >
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

          <p className="mt-5 font-display text-4xl text-gold">
            {money(egpOf(totals.value_piasters))}
          </p>
          {totals.cost_piasters > 0 && totals.gain_pct !== null && (
            <span
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                totals.gain_piasters < 0
                  ? "bg-destructive/20 text-destructive-foreground"
                  : "bg-gold/20 text-gold"
              }`}
            >
              <Trend className="h-3.5 w-3.5" />
              {pct(totals.gain_pct)} ·{" "}
              {hidden ? "••••" : `${egp(totals.gain_piasters / 100)} ${t("ج.م")}`}
            </span>
          )}

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-5 text-center">
            <div>
              <dt className="flex items-center justify-center gap-1.5 text-xs text-primary-foreground/70">
                <Gem className="h-3.5 w-3.5 text-gold" /> {t("ذهب")}
              </dt>
              <dd className="mt-2 text-sm font-semibold">
                {money(egpOf(byMetal("gold")?.value_piasters ?? 0))}
              </dd>
            </div>
            <div>
              <dt className="flex items-center justify-center gap-1.5 text-xs text-primary-foreground/70">
                <Coins className="h-3.5 w-3.5 text-gold" /> {t("فضة")}
              </dt>
              <dd className="mt-2 text-sm font-semibold">
                {money(egpOf(byMetal("silver")?.value_piasters ?? 0))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-primary-foreground/70">{t("قطع")}</dt>
              <dd className="mt-2 text-sm font-semibold">{totals.items}</dd>
            </div>
          </dl>

          {totals.unpriced > 0 && (
            <p className="mt-4 rounded-xl bg-primary-foreground/10 px-3 py-2 text-[11px] text-primary-foreground/80">
              {t("المجاميع لا تشمل أسطرًا تعذّر تسعيرها الآن")} ({totals.unpriced})
            </p>
          )}
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
                  ? items.length
                  : f.key === "gold"
                    ? goldCount
                    : items.length - goldCount}
              </span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center">
            <Gem className="mx-auto h-10 w-10 text-gold-deep" />
            <p className="mt-4 text-sm text-muted-foreground">
              {t(
                items.length === 0
                  ? "لا تملك قطعًا بعد — كل قطعة تشتريها من أورا تظهر هنا فور تأكيد طلبها."
                  : "لا عناصر في هذا التصنيف.",
              )}
            </p>
            {items.length === 0 && (
              <Link
                to="/collection"
                className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                {t("تصفح المجموعة")}
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((h) => (
              <HoldingRow key={h.product.sku} h={h} hidden={hidden} money={money} />
            ))}
          </ul>
        )}

        <p className="rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          {t(
            "التقييم بسعر إعادة البيع اللحظي — أي ما يدفعه المكتب لو بعت الآن. رصيد الذهب في المحفظة له شاشته الخاصة ولا يُحتسب هنا.",
          )}
        </p>
      </div>
    </PageShell>
  );
}

function HoldingRow({
  h,
  hidden,
  money,
}: {
  h: HoldingLine;
  hidden: boolean;
  money: (n: number | null) => string;
}) {
  const t = useT();
  const gain = h.gain_piasters;

  return (
    <li className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
        {h.product.metal === "silver" ? <Coins className="h-5 w-5" /> : <Gem className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-primary">{t(h.product.name)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-md bg-secondary px-2 py-0.5">
            {h.product.metal === "silver" ? t("نقاء") : t("عيار")} {h.product.karat}
          </span>
          <span className="rounded-md bg-secondary px-2 py-0.5">
            {h.product.weight_grams} {t("جرام")}
          </span>
          {h.quantity > 1 && (
            <span className="rounded-md bg-secondary px-2 py-0.5">×{h.quantity}</span>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("سعر الشراء")}: {money(egpOf(h.cost_piasters))}
        </p>
        {h.reason && <p className="mt-2 text-[11px] text-destructive">{h.reason}</p>}
      </div>
      <div className="text-end">
        <p className="text-xs text-muted-foreground">{t("السعر الحالي")}</p>
        <p className="mt-1 font-display text-lg text-primary">{money(egpOf(h.value_piasters))}</p>
        {gain !== null && h.gain_pct !== null && (
          <span
            className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${
              gain < 0 ? "bg-destructive/10 text-destructive" : "bg-gold/15 text-gold-deep"
            }`}
          >
            {pct(h.gain_pct)} · {hidden ? "••••" : egp(gain / 100)}
          </span>
        )}
      </div>
    </li>
  );
}
