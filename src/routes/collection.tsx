import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";
import { allProducts } from "@/lib/site";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "مجموعتنا | سبائك وعملات ومشغولات الذهب — أورا" },
      {
        name: "description",
        content:
          "تصفح مجموعة أورا من سبائك الذهب والعملات الذهبية والمشغولات وسبائك الفضة بأسعار لحظية محدثة.",
      },
      { property: "og:title", content: "مجموعتنا | أورا للذهب" },
      {
        property: "og:description",
        content: "سبائك ذهب وعملات ذهبية ومشغولات وسبائك فضة بأسعار لحظية.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: CollectionPage,
});

const cats = ["الكل", "سبائك ذهب", "عملات ذهبية", "مشغولات", "سبائك فضة"] as const;

function CollectionPage() {
  const { data } = useLivePrices();
  const [cat, setCat] = useState<(typeof cats)[number]>("الكل");

  const list = cat === "الكل" ? allProducts : allProducts.filter((p) => p.cat === cat);

  return (
    <PageShell
      title="مجموعتنا"
      subtitle="سبائك وعملات ومشغولات ذهبية معتمدة بشهادات أصل، وأسعار محدثة لحظيًا حسب سعر السوق."
    >
      <div className="mb-8 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
              cat === c
                ? "border-gold bg-primary text-primary-foreground"
                : "border-border bg-card text-primary hover:border-gold"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {list.map((p, i) => (
          <ProductCard key={`${p.t}-${i}`} p={p} price={data?.items[p.key]} />
        ))}
      </div>
    </PageShell>
  );
}
