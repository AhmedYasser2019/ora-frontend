import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, ChevronLeft, Minus, Plus, Recycle, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/lib/cart";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { allProducts, buyPrice, productBySlug, sellPrice, weightLabel } from "@/lib/site";
import { useLivePrices } from "@/lib/use-live-prices";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const product = productBySlug(params.slug);
    if (!product) throw notFound();
    await context.queryClient.ensureQueryData(livePricesQuery);
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return {};
    const title = `${p.t} | أورا للذهب`;
    return {
      meta: [
        { title },
        { name: "description", content: p.desc },
        { property: "og:title", content: title },
        { property: "og:description", content: p.desc },
        { property: "og:image", content: p.img },
      ],
    };
  },
  notFoundComponent: () => (
    <PageShell title="المنتج غير موجود" subtitle="الرابط اللي فتحته مش موجود أو المنتج اتشال.">
      <Link
        to="/collection"
        className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        تصفح المجموعة
      </Link>
    </PageShell>
  ),
  component: ProductPage,
});

const trust = [
  { icon: BadgeCheck, t: "شهادة أصل", s: "مرفقة مع كل قطعة" },
  { icon: ShieldCheck, t: "إعادة شراء", s: "في أي فرع من فروعنا" },
  { icon: Truck, t: "شحن مؤمّن", s: "لكل محافظات مصر" },
];

function ProductPage() {
  const { product: p } = Route.useLoaderData();
  const { data } = useLivePrices();
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);

  const price = buyPrice(p, data?.gram);
  const resale = sellPrice(p, data?.sell);
  const related = allProducts.filter((x) => x.cat === p.cat && x.slug !== p.slug).slice(0, 4);

  const addToCart = () => {
    const ok = add(
      { id: p.t, slug: p.slug, title: p.t, sub: p.s, img: p.img, lastPrice: price ?? 0 },
      qty,
    );
    if (ok) toast.success("تمت الإضافة للسلة", { description: `${p.t} × ${qty}` });
    return ok;
  };

  const specs = [
    ["العلامة التجارية", p.provider],
    ["الفئة", p.cat],
    ["المعدن", p.cat === "سبائك فضة" ? "فضة" : "ذهب"],
    ["العيار", p.karat ? String(p.karat) : "—"],
    ["النقاء", p.purity],
    ["الوزن", weightLabel(p.weightG)],
    ["المصنعية", `${(p.fabrication * 100).toFixed(1)}%`],
    ["التوفر", p.available ? "متوفر" : "غير متوفر"],
    ["كود المنتج", `ORA-${p.slug.toUpperCase()}`],
  ];

  return (
    <PageShell title={p.t} subtitle={p.s}>
      <nav
        aria-label="مسار التنقل"
        className="mb-8 flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link to="/" className="hover:text-gold-deep">
          الرئيسية
        </Link>
        <ChevronLeft className="h-3 w-3" />
        <Link to="/collection" className="hover:text-gold-deep">
          مجموعتنا
        </Link>
        <ChevronLeft className="h-3 w-3" />
        <span className="text-primary">{p.t}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-cream">
          <img
            src={p.img}
            alt={p.t}
            width={1000}
            height={1000}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
              {p.cat}
            </span>
            <span className="rounded-full border border-gold px-3 py-1 text-[11px] font-semibold text-gold-deep">
              النقاء: {p.purity}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-primary">
              {weightLabel(p.weightG)}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">السعر الحالي (محدَّث لحظيًا)</p>
            <p className="mt-1 font-display text-3xl text-gold-deep">
              {price ? `${egp(price)} ج.م` : "جاري التحديث…"}
            </p>
            {price && qty > 1 && (
              <p className="mt-1 text-xs text-muted-foreground">
                الإجمالي لـ {qty} قطعة: {egp(price * qty)} ج.م
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-full border border-border px-3 py-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="تقليل الكمية"
                  className="text-primary disabled:opacity-40"
                  disabled={qty <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-primary">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label="زيادة الكمية"
                  className="text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={addToCart}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                أضف للسلة
              </button>
              <button
                onClick={() => addToCart() && navigate({ to: "/checkout" })}
                className="rounded-full border border-gold px-6 py-3 text-sm font-semibold text-gold-deep transition-colors hover:bg-cream"
              >
                اشترِ الآن
              </button>
            </div>
          </div>

          {p.cashbackPct > 0 && (
            <div className="mt-4 rounded-2xl border border-gold/40 bg-secondary/40 p-5">
              <div className="flex items-center gap-2">
                <Recycle className="h-4 w-4 text-gold-deep" />
                <h2 className="text-sm font-semibold text-primary">إعادة البيع والكاش باك</h2>
              </div>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">سعر إعادة البيع الآن</dt>
                  <dd className="mt-1 font-display text-xl text-primary">
                    {resale ? `${egp(resale)} ج.م` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">المصنعية المستردّة</dt>
                  <dd className="mt-1 font-display text-xl text-gold-deep">
                    حتى {Math.round(p.cashbackPct * 100)}%
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                نشتري منك هذا المنتج في أي وقت بسعر البيع اللحظي، ونرد لك جزءًا من المصنعية بشرط
                بقاء العبوة الأصلية سليمة وغير مفتوحة.{" "}
                <Link to="/refund-policy" className="font-semibold text-gold-deep hover:underline">
                  اقرأ الشروط
                </Link>
              </p>
            </div>
          )}

          <dl className="mt-6 overflow-hidden rounded-2xl border border-border">
            {specs.map(([k, v], i) => (
              <div
                key={k}
                className={`flex justify-between gap-4 px-5 py-3 text-sm ${i % 2 ? "bg-card" : "bg-background"}`}
              >
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-semibold text-primary">{v}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {trust.map(({ icon: Icon, t, s }) => (
              <li key={t} className="rounded-2xl border border-border bg-card p-4">
                <Icon className="h-5 w-5 text-gold-deep" />
                <p className="mt-2 text-sm font-semibold text-primary">{t}</p>
                <p className="text-xs text-muted-foreground">{s}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-primary">منتجات ذات صلة</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.slug} p={r} price={buyPrice(r, data?.gram)} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
