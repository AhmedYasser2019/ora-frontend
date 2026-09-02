import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";
import {
  CATEGORIES,
  PROVIDERS,
  allProducts,
  buyPrice,
  type Category,
  type Metal,
  type Provider,
} from "@/lib/site";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "مجموعتنا | سبائك وعملات ومشغولات الذهب — أورا" },
      {
        name: "description",
        content:
          "تصفح مجموعة أورا من سبائك الذهب والعملات الذهبية والمشغولات وسبائك الفضة بأسعار لحظية، مع فلاتر بالمعدن والفئة والوزن والمورّد.",
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

const SORTS = [
  { key: "featured", label: "الأكثر رواجًا" },
  { key: "price-asc", label: "السعر: من الأقل" },
  { key: "price-desc", label: "السعر: من الأعلى" },
  { key: "weight-asc", label: "الوزن: من الأقل" },
  { key: "weight-desc", label: "الوزن: من الأعلى" },
] as const;

type Sort = (typeof SORTS)[number]["key"];

const WEIGHTS = allProducts.map((p) => p.weightG);
const MIN_W = Math.min(...WEIGHTS);
const MAX_W = Math.max(...WEIGHTS);

function CollectionPage() {
  const { data } = useLivePrices();
  const [open, setOpen] = useState(false);
  const [metal, setMetal] = useState<Metal | "all">("all");
  const [cats, setCats] = useState<Category[]>([]);
  const [provs, setProvs] = useState<Provider[]>([]);
  const [maxW, setMaxW] = useState(MAX_W);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const reset = () => {
    setMetal("all");
    setCats([]);
    setProvs([]);
    setMaxW(MAX_W);
    setInStock(false);
    setSort("featured");
  };

  // الفئات المعروضة تتبع المعدن المختار.
  const visibleCats = CATEGORIES.filter(
    (c) => metal === "all" || (metal === "silver" ? c === "سبائك فضة" : c !== "سبائك فضة"),
  );

  const list = useMemo(() => {
    const out = allProducts
      .filter((p) => metal === "all" || p.metal === metal)
      .filter((p) => cats.length === 0 || cats.includes(p.cat))
      .filter((p) => provs.length === 0 || provs.includes(p.provider))
      .filter((p) => p.weightG <= maxW)
      .filter((p) => !inStock || p.available);

    const priceOf = (p: (typeof allProducts)[number]) => buyPrice(p, data?.gram) ?? 0;

    switch (sort) {
      case "price-asc":
        return [...out].sort((a, b) => priceOf(a) - priceOf(b));
      case "price-desc":
        return [...out].sort((a, b) => priceOf(b) - priceOf(a));
      case "weight-asc":
        return [...out].sort((a, b) => a.weightG - b.weightG);
      case "weight-desc":
        return [...out].sort((a, b) => b.weightG - a.weightG);
      default:
        return out;
    }
  }, [metal, cats, provs, maxW, inStock, sort, data]);

  const active =
    (metal !== "all" ? 1 : 0) +
    cats.length +
    provs.length +
    (maxW !== MAX_W ? 1 : 0) +
    (inStock ? 1 : 0);

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      on
        ? "border-gold bg-primary text-primary-foreground"
        : "border-border bg-card text-primary hover:border-gold"
    }`;

  return (
    <PageShell
      title="مجموعتنا"
      subtitle="سبائك وعملات ومشغولات ذهبية معتمدة بشهادات أصل، وأسعار محدثة لحظيًا حسب سعر السوق."
    >
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={`${open ? "block" : "hidden"} lg:block`}>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base text-primary">تصفية المنتجات</h2>
              {active > 0 && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
                >
                  <X className="h-3 w-3" /> مسح
                </button>
              )}
            </div>

            <p className="mb-2 text-xs font-semibold text-primary">نوع المعدن</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {(
                [
                  ["all", "جميع المعادن"],
                  ["gold", "ذهب"],
                  ["silver", "فضة"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => {
                    setMetal(k);
                    setCats([]);
                  }}
                  className={chip(metal === k)}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="mb-2 text-xs font-semibold text-primary">الفئة</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {visibleCats.map((c) => (
                <button
                  key={c}
                  onClick={() => toggle(cats, c, setCats)}
                  className={chip(cats.includes(c))}
                >
                  {c}
                </button>
              ))}
            </div>

            <p className="mb-2 text-xs font-semibold text-primary">
              نطاق الوزن — حتى {maxW >= 1000 ? `${maxW / 1000} كيلو` : `${maxW} جرام`}
            </p>
            <input
              type="range"
              min={MIN_W}
              max={MAX_W}
              step="0.25"
              value={maxW}
              onChange={(e) => setMaxW(Number(e.target.value))}
              aria-label="الحد الأقصى للوزن بالجرام"
              className="mb-1 w-full accent-[var(--color-gold-deep,#b8860b)]"
            />
            <div dir="ltr" className="mb-5 flex justify-between text-[11px] text-muted-foreground">
              <span>{MIN_W} جم</span>
              <span>{MAX_W} جم</span>
            </div>

            <p className="mb-2 text-xs font-semibold text-primary">المورّد</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {PROVIDERS.map((pr) => (
                <button
                  key={pr}
                  onClick={() => toggle(provs, pr, setProvs)}
                  className={chip(provs.includes(pr))}
                >
                  {pr}
                </button>
              ))}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-gold-deep,#b8860b)]"
              />
              المتوفر فقط
            </label>
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-primary lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              الفلاتر {active > 0 && `(${active})`}
            </button>

            <p className="text-xs text-muted-foreground">
              {list.length} من {allProducts.length} منتج
            </p>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              ترتيب حسب:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="ترتيب المنتجات"
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-primary outline-none focus:border-gold"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="text-lg text-primary">لا توجد منتجات مطابقة</p>
              <button
                onClick={reset}
                className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                مسح الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.slug} p={p} price={buyPrice(p, data?.gram)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
