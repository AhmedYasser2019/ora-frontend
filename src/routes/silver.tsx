import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";
import { allProducts } from "@/lib/site";

export const Route = createFileRoute("/silver")({
  head: () => ({
    meta: [
      { title: "سبائك الفضة وسعر الفضة اليوم | أورا" },
      {
        name: "description",
        content:
          "سبائك فضة 999 بأوزان مختلفة مع سعر الفضة اللحظي للجرام في مصر وشهادة أصل لكل سبيكة.",
      },
      { property: "og:title", content: "سبائك الفضة | أورا" },
      { property: "og:description", content: "سعر الفضة اللحظي وسبائك فضة 999 معتمدة." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: SilverPage,
});

function SilverPage() {
  const { data } = useLivePrices();
  const items = allProducts.filter((p) => p.cat === "سبائك فضة");

  return (
    <PageShell
      title="الفضة"
      subtitle="سبائك فضة نقية 999 بأوزان متعددة، بسعر مرتبط بسعر الفضة العالمي لحظة بلحظة."
    >
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-cream p-6 text-center">
          <p className="text-xs text-muted-foreground">سعر جرام الفضة</p>
          <p className="mt-1 font-display text-3xl text-primary">
            {data ? egp(data.gram.silver) : "—"}
          </p>
          <p className="text-[11px] text-gold-deep">جنيه / جرام</p>
        </div>
        <div className="rounded-2xl bg-cream p-6 text-center">
          <p className="text-xs text-muted-foreground">النقاء</p>
          <p className="mt-1 font-display text-3xl text-primary">999</p>
          <p className="text-[11px] text-gold-deep">فضة نقية</p>
        </div>
        <div className="rounded-2xl bg-cream p-6 text-center">
          <p className="text-xs text-muted-foreground">إعادة البيع</p>
          <p className="mt-1 font-display text-3xl text-primary">متاح</p>
          <p className="text-[11px] text-gold-deep">نشتري منك في أي وقت</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard key={`${p.t}-${i}`} p={p} price={data?.items[p.key]} />
        ))}
      </div>
    </PageShell>
  );
}
