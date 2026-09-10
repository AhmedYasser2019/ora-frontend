import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";
import { productsQuery } from "@/lib/catalog.queries";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/silver")({
  head: () => ({
    meta: [
      { title: tr("سبائك الفضة وسعر الفضة اليوم | أورا") },
      {
        name: "description",
        content: tr(
          "سبائك فضة 999 بأوزان مختلفة مع سعر الفضة اللحظي للجرام في مصر وشهادة أصل لكل سبيكة.",
        ),
      },
      { property: "og:title", content: tr("سبائك الفضة | أورا") },
      { property: "og:description", content: tr("سعر الفضة اللحظي وسبائك فضة 999 معتمدة.") },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(livePricesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]),
  component: SilverPage,
});

function SilverPage() {
  const { data } = useLivePrices();
  const { data: products } = useQuery(productsQuery);
  const t = useT();
  const items = (products ?? []).filter((p) => p.cat === "سبائك فضة");

  return (
    <PageShell
      title="الفضة"
      subtitle="سبائك فضة نقية 999 بأوزان متعددة، بسعر الجرام المنشور لحظة بلحظة."
    >
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-cream p-6 text-center">
          <p className="text-xs text-muted-foreground">{t("سعر جرام الفضة")}</p>
          <p className="mt-1 font-display text-3xl text-primary">
            {data?.gram.silver ? egp(data.gram.silver) : "—"}
          </p>
          <p className="text-[11px] text-gold-deep">{t("جنيه / جرام")}</p>
        </div>
        <div className="rounded-2xl bg-cream p-6 text-center">
          <p className="text-xs text-muted-foreground">{t("النقاء")}</p>
          <p className="mt-1 font-display text-3xl text-primary">999</p>
          <p className="text-[11px] text-gold-deep">{t("فضة نقية")}</p>
        </div>
        <div className="rounded-2xl bg-cream p-6 text-center">
          <p className="text-xs text-muted-foreground">{t("إعادة البيع")}</p>
          <p className="mt-1 font-display text-3xl text-primary">{t("متاح")}</p>
          <p className="text-[11px] text-gold-deep">{t("نشتري منك في أي وقت")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.slug} p={p} />
        ))}
      </div>
    </PageShell>
  );
}
