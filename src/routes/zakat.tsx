import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";
import { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS, zakat } from "@/lib/zakat";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/zakat")({
  head: () => ({
    meta: [
      { title: tr("حساب زكاة الذهب والفضة | أورا") },
      {
        name: "description",
        content: tr(
          "احسب زكاة الذهب والفضة بدقة بناءً على أسعار السوق اللحظية في مصر مع نصاب الزكاة ونسبة 2.5%.",
        ),
      },
      { property: "og:title", content: tr("حساب زكاة الذهب | أورا") },
      { property: "og:description", content: tr("حاسبة زكاة الذهب والفضة بأسعار لحظية.") },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: ZakatPage,
});

const karats = [
  { label: "عيار 24", key: "k24" },
  { label: "عيار 22", key: "k22" },
  { label: "عيار 21", key: "k21" },
  { label: "عيار 18", key: "k18" },
] as const;

function ZakatPage() {
  const { data } = useLivePrices();
  const t = useT();
  const [grams, setGrams] = useState(100);
  const [karat, setKarat] = useState(2); // عيار 21
  const [silverGrams, setSilverGrams] = useState(0);

  const gram = data?.gram;
  const goldValue = (gram?.[karats[karat]!.key] ?? 0) * grams;
  const silverValue = (gram?.silver ?? 0) * silverGrams;
  const { total, nisab, due } = zakat(goldValue, silverValue, gram?.k21 ?? 0, gram?.silver ?? 0);
  const nisabLabel =
    goldValue > 0
      ? `النصاب (${GOLD_NISAB_GRAMS} جرام ذهب عيار 21)`
      : `النصاب (${SILVER_NISAB_GRAMS} جرام فضة)`;

  return (
    <PageShell
      title="حساب الزكاة"
      subtitle="نصاب الزكاة 85 جرامًا من الذهب عيار 21، أو 595 جرامًا من الفضة لمن يملك فضة وحدها، ونسبتها 2.5% بعد مرور حَوْل هجري كامل — وفق ما تعتمده دار الإفتاء المصرية."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <label className="block text-sm text-primary">{t("وزن الذهب (جرام)")}</label>
          <input
            type="number"
            min={0}
            value={grams}
            onChange={(e) => setGrams(Math.max(0, Number(e.target.value)))}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-primary outline-none focus:border-gold"
          />

          <p className="mt-5 text-sm text-primary">{t("العيار")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {karats.map((k, i) => (
              <button
                key={k.label}
                onClick={() => setKarat(i)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  karat === i
                    ? "border-gold bg-primary text-primary-foreground"
                    : "border-border bg-card text-primary hover:border-gold"
                }`}
              >
                {t(k.label)}
              </button>
            ))}
          </div>

          <label className="mt-5 block text-sm text-primary">{t("وزن الفضة (جرام)")}</label>
          <input
            type="number"
            min={0}
            value={silverGrams}
            onChange={(e) => setSilverGrams(Math.max(0, Number(e.target.value)))}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-primary outline-none focus:border-gold"
          />
        </div>

        <div className="rounded-2xl bg-gradient-green p-6 text-primary-foreground">
          <p className="text-xs tracking-[0.2em] text-gold">{t("النتيجة")}</p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-3">
              <dt className="text-primary-foreground/75">{t("قيمة الذهب")}</dt>
              <dd className="font-display text-lg text-gold">
                {egp(goldValue)} {t("ج.م")}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-3">
              <dt className="text-primary-foreground/75">{t("قيمة الفضة")}</dt>
              <dd className="font-display text-lg text-gold">
                {egp(silverValue)} {t("ج.م")}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-3">
              <dt className="text-primary-foreground/75">{t("إجمالي القيمة")}</dt>
              <dd className="font-display text-lg text-gold">
                {egp(total)} {t("ج.م")}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-3">
              <dt className="text-primary-foreground/75">{t(nisabLabel)}</dt>
              <dd className="font-display text-lg text-gold">
                {egp(nisab)} {t("ج.م")}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-primary-foreground">{t("الزكاة المستحقة (2.5%)")}</dt>
              <dd className="font-display text-2xl text-gradient-gold">
                {egp(due)} {t("ج.م")}
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-primary-foreground/60">
            {total >= nisab
              ? t("بلغت ممتلكاتك النصاب، والزكاة واجبة بعد حَوْل كامل.")
              : t("لم تبلغ ممتلكاتك النصاب، فلا زكاة واجبة عليها حاليًا.")}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-primary-foreground/60">
            {t(
              "ذهب الزينة المستعمل بالقدر المعتاد دون إسراف لا زكاة فيه، وإنما تجب في المدَّخر والمُقتنى. النتيجة استرشادية وفق فتاوى دار الإفتاء المصرية.",
            )}
          </p>
        </div>
      </div>
    </PageShell>
  );
}
