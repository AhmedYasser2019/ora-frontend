import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useFavorites } from "@/lib/favorites";
import { tr, useT } from "@/lib/i18n";
import { livePricesQuery } from "@/lib/prices.queries";
import { buyPrice, productBySlug } from "@/lib/site";
import { useLivePrices } from "@/lib/use-live-prices";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: tr("المفضلة | أورا للذهب") },
      {
        name: "description",
        content: tr("المنتجات اللي حفظتها في المفضلة بأسعار الذهب اللحظية من أورا."),
      },
      { property: "og:title", content: tr("المفضلة | أورا للذهب") },
      { property: "og:description", content: tr("منتجاتك المحفوظة بأسعار لحظية.") },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { data } = useLivePrices();
  const { slugs, ready, clear } = useFavorites();
  const t = useT();

  const products = slugs.map(productBySlug).filter((p) => p !== undefined);

  return (
    <PageShell
      title="المفضلة"
      subtitle="المنتجات اللي حفظتها للرجوع ليها، بأسعار محدثة لحظيًا مع سعر الذهب."
    >
      {!ready ? (
        <p className="text-sm text-muted-foreground">{t("جاري تحميل المفضلة…")}</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-gold-deep" />
          <p className="mt-4 text-lg text-primary">{t("مفيش منتجات في المفضلة")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("اضغط على القلب في أي منتج عشان تحفظه هنا.")}
          </p>
          <Link
            to="/collection"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("تصفح المجموعة")}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.slug} p={p} price={buyPrice(p, data?.gram)} />
            ))}
          </div>
          <button
            onClick={clear}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
          >
            {t("إفراغ المفضلة")}
          </button>
        </div>
      )}
    </PageShell>
  );
}
