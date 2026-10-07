import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { bySlug, productsQuery } from "@/lib/catalog.queries";
import { useSiteSettings } from "@/lib/settings.queries";
import { deliveryFee, shortLines, shortMessage, useCart } from "@/lib/cart";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";
import { productImage } from "@/lib/product-image";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: tr("سلة الشراء | زاد جولد") },
      {
        name: "description",
        content: tr("راجع سبائك وعملات الذهب في سلتك بأسعار لحظية قبل إتمام الطلب مع زاد جولد."),
      },
      { property: "og:title", content: tr("سلة الشراء | زاد جولد") },
      { property: "og:description", content: tr("مراجعة السلة بأسعار الذهب اللحظية قبل الشراء.") },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(livePricesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]),
  component: CartPage,
});

function CartPage() {
  const { data: catalog } = useQuery(productsQuery);
  const { items, setQty, remove, clear, ready } = useCart();
  const t = useT();

  // سعر الخادم فقط. القطعة التي لا سعر لها الآن (معدن موقوف) تُحتسب بصفر ولا تُخترع لها قيمة.
  const priceOf = (slug: string) => bySlug(catalog, slug)?.price ?? 0;
  const subtotal = items.reduce((s, i) => s + priceOf(i.slug) * i.qty, 0);
  // التوصيل للمنزل هو اختيار الإتمام الافتراضي؛ الاستلام من الفرع هناك يُسقطه.
  const delivery = deliveryFee(subtotal, useSiteSettings()?.delivery);
  const short = shortLines(items, catalog);

  return (
    <PageShell
      title="سلة الشراء"
      subtitle="الأسعار في السلة محدثة لحظيًا مع سعر الذهب، ويتم تثبيت السعر النهائي عند تأكيد الطلب."
    >
      {!ready ? (
        <p className="text-sm text-muted-foreground">{t("جاري تحميل السلة…")}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-gold-deep" />
          <p className="mt-4 text-lg text-primary">{t("سلتك فارغة")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("ابدأ من مجموعتنا واختار السبيكة أو العملة المناسبة لك.")}
          </p>
          <Link
            to="/collection"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("تصفح المجموعة")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((i) => {
              // الخادم يُسقط القطعة المشطوبة من السلة، فغيابها من الكتالوج حالة سباق عابرة.
              const p = bySlug(catalog, i.slug);
              if (!p) return null;
              const unit = p.price ?? 0;
              return (
                <div
                  key={i.slug}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-4"
                >
                  <img
                    src={productImage(p)}
                    alt={t(p.t)}
                    width={200}
                    height={200}
                    className="h-24 w-24 shrink-0 rounded-xl bg-cream object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base text-primary">{t(p.t)}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{t(p.s)}</p>
                      </div>
                      <button
                        onClick={() => remove(i.slug)}
                        aria-label={`${t("حذف")} ${t(p.t)}`}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-1 rounded-full border border-border">
                        <button
                          // سطر نفد مخزونه بعد إضافته ينزل للمتاح مباشرة (صفر = حذف) بضغطة واحدة.
                          onClick={() => setQty(i.slug, Math.min(i.qty - 1, p.stock))}
                          aria-label={t("إنقاص الكمية")}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-primary">
                          {i.qty}
                        </span>
                        <button
                          onClick={() => setQty(i.slug, i.qty + 1)}
                          disabled={i.qty >= p.stock}
                          aria-label={t("زيادة الكمية")}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-display text-lg text-gold-deep">
                        {egp(unit * i.qty)} {t("ج.م")}
                      </span>
                    </div>
                    {i.qty > p.stock && (
                      <p role="alert" className="mt-2 text-xs text-destructive">
                        {shortMessage(t, p)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={clear}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
            >
              {t("إفراغ السلة")}
            </button>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-cream p-6">
            <h2 className="font-display text-xl text-primary">{t("ملخص الطلب")}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("إجمالي المنتجات")}</dt>
                <dd className="text-primary">
                  {egp(subtotal)} {t("ج.م")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("الشحن المؤمّن")}</dt>
                <dd className="text-primary">
                  {delivery === 0 ? t("مجاني") : `${egp(delivery)} ${t("ج.م")}`}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-semibold text-primary">{t("الإجمالي")}</dt>
                <dd className="font-display text-xl text-gold-deep">
                  {egp(subtotal + delivery)} {t("ج.م")}
                </dd>
              </div>
            </dl>
            {short.length > 0 ? (
              <p className="mt-6 rounded-full bg-secondary py-3 text-center text-sm font-semibold text-destructive">
                {t("عدّل الكميات قبل إتمام الطلب")}
              </p>
            ) : (
              <Link
                to="/checkout"
                className="mt-6 block rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                {t("إتمام الطلب")}
              </Link>
            )}
            <Link to="/collection" className="mt-3 block text-center text-xs text-gold-deep">
              {t("متابعة التسوق")}
            </Link>
          </aside>
        </div>
      )}
    </PageShell>
  );
}
