import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/PageShell";
import { LiveTicker } from "@/components/LiveTicker";
import { PriceBoard } from "@/components/PriceBoard";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";

export const Route = createFileRoute("/silver-price")({
  head: () => ({
    meta: [
      { title: "سعر الفضة اليوم لحظة بلحظة في مصر | أورا" },
      {
        name: "description",
        content:
          "سعر الفضة اليوم في مصر لحظيًا للجرام والأوقية، بسعر شراء وسعر بيع معلنين وتحديث مباشر كل ثوانٍ.",
      },
      { property: "og:title", content: "سعر الفضة اليوم لحظة بلحظة | أورا" },
      {
        property: "og:description",
        content: "أسعار الفضة اللحظية بالجنيه المصري مع بث مباشر للتحديثات.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: SilverPricePage,
});

const OZ = 31.1035;

function SilverPricePage() {
  const { data, isFetching, dataUpdatedAt, live, pushedAt, history } = useLivePrices();

  const updated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  const gold = data?.gram.k24;
  const silver = data?.gram.silver;
  const ratio = gold && silver ? gold / silver : undefined;

  return (
    <PageShell
      title="سعر الفضة اليوم"
      subtitle="سعر الفضة النقية 999 بالجنيه المصري، مرتبط بسعر الأوقية العالمي وسعر الدولار، ومحدَّث تلقائيًا كل ثوانٍ."
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
        <PriceBoard
          metal="silver"
          gram={data?.gram}
          sell={data?.sell}
          spreadPct={data?.spreadPct}
        />
        <LiveTicker history={history} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-cream p-5 text-center">
          <p className="text-xs text-muted-foreground">أوقية الفضة</p>
          <p className="mt-1 font-display text-2xl text-primary">
            {silver ? egp(silver * OZ) : "—"}
          </p>
          <p className="text-[11px] text-gold-deep">جنيه / أونصة</p>
        </div>
        <div className="rounded-2xl bg-cream p-5 text-center">
          <p className="text-xs text-muted-foreground">الدولار / الجنيه</p>
          <p className="mt-1 font-display text-2xl text-primary">
            {data ? data.usdEgp.toFixed(2) : "—"}
          </p>
          <p className="text-[11px] text-gold-deep">سعر الصرف</p>
        </div>
        <div className="rounded-2xl bg-cream p-5 text-center">
          <p className="text-xs text-muted-foreground">نسبة الذهب للفضة</p>
          <p className="mt-1 font-display text-2xl text-primary">
            {ratio ? `1 : ${ratio.toFixed(0)}` : "—"}
          </p>
          <p className="text-[11px] text-gold-deep">جرام ذهب 24 مقابل الفضة</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg text-primary">لماذا الفضة؟</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          الفضة مدخل منخفض التكلفة للاستثمار في المعادن النفيسة: سعر الجرام أقل بكثير من الذهب، مما
          يتيح بدء الادخار بمبالغ صغيرة وتنويع المحفظة. في المقابل تكون تقلباتها السعرية أعلى من
          الذهب، ونسبة المصنعية على السبائك الصغيرة أكبر — لذلك تكون السبائك الأثقل أفضل من حيث
          التكلفة لكل جرام.
        </p>
        <Link
          to="/silver"
          className="mt-4 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          تصفح سبائك الفضة
        </Link>
      </div>
    </PageShell>
  );
}
