import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { buyPrice, productBySlug } from "@/lib/site";
import { DELIVERY_FEE, FREE_DELIVERY_OVER, useCart } from "@/lib/cart";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سلة الشراء | أورا للذهب" },
      {
        name: "description",
        content: "راجع سبائك وعملات الذهب في سلتك بأسعار لحظية قبل إتمام الطلب مع أورا.",
      },
      { property: "og:title", content: "سلة الشراء | أورا للذهب" },
      { property: "og:description", content: "مراجعة السلة بأسعار الذهب اللحظية قبل الشراء." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: CartPage,
});

function CartPage() {
  const { data } = useLivePrices();
  const { items, setQty, remove, clear, ready } = useCart();

  const priceOf = (slug: string, fallback: number) => {
    const p = productBySlug(slug);
    return (p && buyPrice(p, data?.gram)) ?? fallback;
  };
  const subtotal = items.reduce((s, i) => s + priceOf(i.slug, i.lastPrice) * i.qty, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;

  return (
    <PageShell
      title="سلة الشراء"
      subtitle="الأسعار في السلة محدثة لحظيًا مع سعر الذهب، ويتم تثبيت السعر النهائي عند تأكيد الطلب."
    >
      {!ready ? (
        <p className="text-sm text-muted-foreground">جاري تحميل السلة…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-gold-deep" />
          <p className="mt-4 text-lg text-primary">سلتك فاضية</p>
          <p className="mt-1 text-sm text-muted-foreground">
            ابدأ من مجموعتنا واختار السبيكة أو العملة المناسبة لك.
          </p>
          <Link
            to="/collection"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            تصفح المجموعة
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((i) => {
              const unit = priceOf(i.slug, i.lastPrice);
              return (
                <div key={i.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                  <img
                    src={i.img}
                    alt={i.title}
                    width={200}
                    height={200}
                    className="h-24 w-24 shrink-0 rounded-xl bg-cream object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base text-primary">{i.title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{i.sub}</p>
                      </div>
                      <button
                        onClick={() => remove(i.id)}
                        aria-label={`حذف ${i.title}`}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-1 rounded-full border border-border">
                        <button
                          onClick={() => setQty(i.id, i.qty - 1)}
                          aria-label="إنقاص الكمية"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-primary">
                          {i.qty}
                        </span>
                        <button
                          onClick={() => setQty(i.id, i.qty + 1)}
                          aria-label="زيادة الكمية"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-display text-lg text-gold-deep">
                        {egp(unit * i.qty)} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={clear}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
            >
              إفراغ السلة
            </button>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-cream p-6">
            <h2 className="font-display text-xl text-primary">ملخص الطلب</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">إجمالي المنتجات</dt>
                <dd className="text-primary">{egp(subtotal)} ج.م</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">الشحن المؤمّن</dt>
                <dd className="text-primary">
                  {delivery === 0 ? "مجاني" : `${egp(delivery)} ج.م`}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-semibold text-primary">الإجمالي</dt>
                <dd className="font-display text-xl text-gold-deep">
                  {egp(subtotal + delivery)} ج.م
                </dd>
              </div>
            </dl>
            <Link
              to="/checkout"
              className="mt-6 block rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              إتمام الطلب
            </Link>
            <Link to="/collection" className="mt-3 block text-center text-xs text-gold-deep">
              متابعة التسوق
            </Link>
          </aside>
        </div>
      )}
    </PageShell>
  );
}
