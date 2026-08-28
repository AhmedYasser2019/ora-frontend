import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageShell } from "@/components/PageShell";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";

export const Route = createFileRoute("/zakat")({
  head: () => ({
    meta: [
      { title: "حساب زكاة الذهب والفضة | أورا" },
      {
        name: "description",
        content:
          "احسب زكاة الذهب والفضة بدقة بناءً على أسعار السوق اللحظية في مصر مع نصاب الزكاة ونسبة 2.5%.",
      },
      { property: "og:title", content: "حساب زكاة الذهب | أورا" },
      { property: "og:description", content: "حاسبة زكاة الذهب والفضة بأسعار لحظية." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: ZakatPage,
});

const karats = [
  { k: "عيار 24", f: (g: { k24: number; k22: number; k21: number; k18: number }) => g.k24 },
  { k: "عيار 22", f: (g: { k22: number }) => g.k22 },
  { k: "عيار 21", f: (g: { k21: number }) => g.k21 },
  { k: "عيار 18", f: (g: { k18: number }) => g.k18 },
];

function ZakatPage() {
  const { data } = useLivePrices();
  const [grams, setGrams] = useState(100);
  const [karat, setKarat] = useState(2); // عيار 21
  const [silverGrams, setSilverGrams] = useState(0);

  const gram = data?.gram;
  const goldRate = gram ? (karats[karat]!.f(gram as never) as number) : 0;
  const goldValue = goldRate * grams;
  const silverValue = (gram?.silver ?? 0) * silverGrams;
  const total = goldValue + silverValue;
  const nisab = (gram?.k24 ?? 0) * 85; // 85 جرام ذهب
  const due = total >= nisab ? total * 0.025 : 0;

  return (
    <PageShell
      title="حساب الزكاة"
      subtitle="نصاب زكاة الذهب 85 جرامًا من عيار 24، ونسبة الزكاة 2.5% من قيمة ما تملكه بعد مرور عام هجري."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <label className="block text-sm text-primary">وزن الذهب (جرام)</label>
          <input
            type="number"
            min={0}
            value={grams}
            onChange={(e) => setGrams(Math.max(0, Number(e.target.value)))}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-primary outline-none focus:border-gold"
          />

          <p className="mt-5 text-sm text-primary">العيار</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {karats.map((k, i) => (
              <button
                key={k.k}
                onClick={() => setKarat(i)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  karat === i
                    ? "border-gold bg-primary text-primary-foreground"
                    : "border-border bg-card text-primary hover:border-gold"
                }`}
              >
                {k.k}
              </button>
            ))}
          </div>

          <label className="mt-5 block text-sm text-primary">وزن الفضة (جرام)</label>
          <input
            type="number"
            min={0}
            value={silverGrams}
            onChange={(e) => setSilverGrams(Math.max(0, Number(e.target.value)))}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-primary outline-none focus:border-gold"
          />
        </div>

        <div className="rounded-2xl bg-gradient-green p-6 text-primary-foreground">
          <p className="text-xs tracking-[0.2em] text-gold">النتيجة</p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-3">
              <dt className="text-primary-foreground/75">قيمة الذهب</dt>
              <dd className="font-display text-lg text-gold">{egp(goldValue)} ج.م</dd>
            </div>
            <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-3">
              <dt className="text-primary-foreground/75">قيمة الفضة</dt>
              <dd className="font-display text-lg text-gold">{egp(silverValue)} ج.م</dd>
            </div>
            <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-3">
              <dt className="text-primary-foreground/75">إجمالي القيمة</dt>
              <dd className="font-display text-lg text-gold">{egp(total)} ج.م</dd>
            </div>
            <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-3">
              <dt className="text-primary-foreground/75">النصاب (85 جرام ذهب)</dt>
              <dd className="font-display text-lg text-gold">{egp(nisab)} ج.م</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-primary-foreground">الزكاة المستحقة (2.5%)</dt>
              <dd className="font-display text-2xl text-gradient-gold">{egp(due)} ج.م</dd>
            </div>
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-primary-foreground/60">
            {total >= nisab
              ? "بلغت ممتلكاتك النصاب، والزكاة واجبة بعد حَوْل كامل."
              : "لم تبلغ ممتلكاتك النصاب، فلا زكاة واجبة عليها حاليًا."}
          </p>
        </div>
      </div>
    </PageShell>
  );
}
