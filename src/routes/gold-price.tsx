import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/PageShell";
import { LiveTicker } from "@/components/LiveTicker";
import { PriceBoard } from "@/components/PriceBoard";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";

export const Route = createFileRoute("/gold-price")({
  head: () => ({
    meta: [
      { title: "سعر الذهب اليوم لحظة بلحظة في مصر | أورا" },
      {
        name: "description",
        content:
          "سعر الذهب اليوم في مصر لحظيًا لعيار 24 و22 و21 و18 وسعر الفضة والأوقية والدولار، بتحديث مباشر كل ثوانٍ.",
      },
      { property: "og:title", content: "سعر الذهب اليوم لحظة بلحظة | أورا" },
      {
        property: "og:description",
        content: "أسعار الذهب والفضة اللحظية بالجنيه المصري مع بث مباشر للتحديثات.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: GoldPricePage,
});

function GoldPricePage() {
  const { data, isFetching, dataUpdatedAt, live, pushedAt, history } = useLivePrices();

  const updated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <PageShell
      title="سعر الذهب اليوم"
      subtitle="أسعار مباشرة مرتبطة بسعر الأوقية العالمي وسعر الدولار مقابل الجنيه، محدثة تلقائيًا كل ثوانٍ."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2 text-primary">
          <span
            key={pushedAt}
            className={`h-2 w-2 rounded-full bg-gold-deep ${live || isFetching ? "animate-pulse" : ""}`}
          />
          آخر تحديث {updated}
        </span>
        <span>{live ? "بث مباشر متصل · تحديث فوري" : "جاري الاتصال بالبث المباشر…"}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <PriceBoard metal="gold" gram={data?.gram} sell={data?.sell} spreadPct={data?.spreadPct} />
        <LiveTicker history={history} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-cream p-5 text-center">
          <p className="text-xs text-muted-foreground">الدولار / الجنيه</p>
          <p className="mt-1 font-display text-2xl text-primary">
            {data ? data.usdEgp.toFixed(2) : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-cream p-5 text-center">
          <p className="text-xs text-muted-foreground">أوقية الذهب (عيار 24)</p>
          <p className="mt-1 font-display text-2xl text-primary">
            {data ? egp(data.gram.k24 * 31.1035) : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-cream p-5 text-center">
          <p className="text-xs text-muted-foreground">أوقية الفضة</p>
          <p className="mt-1 font-display text-2xl text-primary">
            {data ? egp(data.gram.silver * 31.1035) : "—"}
          </p>
        </div>
      </div>
    </PageShell>
  );
}
