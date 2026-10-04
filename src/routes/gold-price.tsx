import { createFileRoute, Link } from "@tanstack/react-router";

import { intlLocale, useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { LiveTicker } from "@/components/LiveTicker";
import { PriceBoard } from "@/components/PriceBoard";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/gold-price")({
  head: () => ({
    meta: [
      { title: tr("سعر الذهب اليوم لحظة بلحظة في مصر | زاد جولد") },
      {
        name: "description",
        content: tr(
          "سعر الذهب اليوم في مصر لحظيًا لعيار 24 و21 والأوقية، بتحديث مباشر كل ثوانٍ.",
        ),
      },
      { property: "og:title", content: tr("سعر الذهب اليوم لحظة بلحظة | زاد جولد") },
      {
        property: "og:description",
        content: tr("أسعار الذهب اللحظية بالجنيه المصري مع بث مباشر للتحديثات."),
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: GoldPricePage,
});

function GoldPricePage() {
  const { data, isFetching, dataUpdatedAt, live, pushedAt, history } = useLivePrices();
  const t = useT();

  const updated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString(intlLocale(), {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <PageShell
      title="سعر الذهب اليوم"
      subtitle="سعر الجرام كما ينشره مكتب التسعير بالجنيه المصري، لعيار 21 وعيار 24، ويصلك لحظة تغيّره."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2 text-primary">
          <span
            key={pushedAt}
            className={`h-2 w-2 rounded-full bg-gold-deep ${live || isFetching ? "animate-pulse" : ""}`}
          />
          {t("آخر تحديث")} {updated}
        </span>
        <span>{live ? t("بث مباشر متصل · تحديث فوري") : t("جاري الاتصال بالبث المباشر…")}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <PriceBoard metal="gold" gram={data?.gram} halted={data?.halted["gold"]} />
        <LiveTicker history={history} series="k24" label={t("عيار 24")} />
      </div>

      <div className="mt-6">
        <PriceHistoryChart metal="gold" />
      </div>

      <div className="mt-6 rounded-2xl bg-cream p-5 text-center">
        <p className="text-xs text-muted-foreground">{t("أوقية الذهب (عيار 24)")}</p>
        <p className="mt-1 font-display text-2xl text-primary">
          {data?.gram.k24 ? egp(data.gram.k24 * 31.1035) : "—"}
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/collection"
          search={{ metal: "gold", cat: "gold-bars" }}
          className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {t("تصفح سبائك الذهب")}
        </Link>
      </div>
    </PageShell>
  );
}
