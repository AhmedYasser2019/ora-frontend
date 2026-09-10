import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { productsQuery } from "@/lib/catalog.queries";
import { CATEGORIES, providersOf, type Category, type Metal } from "@/lib/catalog.server";
import { weightLabel } from "@/lib/site";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: tr("مجموعتنا | سبائك وعملات الذهب — أورا") },
      {
        name: "description",
        content: tr(
          "تصفح مجموعة أورا من سبائك الذهب والعملات الذهبية وسبائك الفضة بأسعار لحظية، مع فلاتر بالمعدن والفئة والوزن والمورّد.",
        ),
      },
      { property: "og:title", content: tr("مجموعتنا | أورا للذهب") },
      {
        property: "og:description",
        content: tr("سبائك ذهب وعملات ذهبية وسبائك فضة بأسعار لحظية."),
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(livePricesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]),
  component: CollectionPage,
});

const SORTS = [
  { key: "featured", label: "الأكثر رواجًا" },
  { key: "price-asc", label: "السعر: من الأقل" },
  { key: "price-desc", label: "السعر: من الأعلى" },
  { key: "weight-asc", label: "الوزن: من الأقل" },
  { key: "weight-desc", label: "الوزن: من الأعلى" },
  { key: "premium-asc", label: "المصنعية: من الأقل" },
] as const;

type Sort = (typeof SORTS)[number]["key"];

// المصنعية مبلغ ثابت للقطعة في الباك إند، لا نسبة — فالفلتر بالجنيه.
function CollectionPage() {
  const { data: catalog } = useQuery(productsQuery);
  const t = useT();

  const all = catalog ?? [];
  const PROVIDERS = useMemo(() => providersOf(all), [catalog]);

  const { MIN_W, MAX_W, MIN_F, MAX_F } = useMemo(() => {
    const weights = all.map((p) => p.weightG);
    const premiums = all.map((p) => p.premium ?? 0);
    return {
      MIN_W: weights.length ? Math.min(...weights) : 0,
      MAX_W: weights.length ? Math.max(...weights) : 0,
      MIN_F: premiums.length ? Math.floor(Math.min(...premiums)) : 0,
      MAX_F: premiums.length ? Math.ceil(Math.max(...premiums)) : 0,
    };
  }, [catalog]);
  const [open, setOpen] = useState(false);
  const [metal, setMetal] = useState<Metal | "all">("all");
  const [cats, setCats] = useState<Category[]>([]);
  const [provs, setProvs] = useState<string[]>([]);
  // undefined = لم يلمس المستخدم الشريط بعد، فالحدّ هو أقصى ما في الكتالوج مهما تغيّر.
  const [maxW, setMaxWState] = useState<number | undefined>(undefined);
  const [maxF, setMaxFState] = useState<number | undefined>(undefined);
  const setMaxW = (v: number) => setMaxWState(v);
  const setMaxF = (v: number) => setMaxFState(v);
  const wCap = maxW ?? MAX_W;
  const fCap = maxF ?? MAX_F;
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const reset = () => {
    setMetal("all");
    setCats([]);
    setProvs([]);
    setMaxWState(undefined);
    setMaxFState(undefined);
    setInStock(false);
    setSort("featured");
  };

  // الفئات المعروضة تتبع المعدن المختار.
  const visibleCats = CATEGORIES.filter(
    (c) => metal === "all" || (metal === "silver" ? c === "سبائك فضة" : c !== "سبائك فضة"),
  );

  const list = useMemo(() => {
    const out = all
      .filter((p) => metal === "all" || p.metal === metal)
      .filter((p) => cats.length === 0 || cats.includes(p.cat))
      .filter((p) => provs.length === 0 || provs.includes(p.provider))
      .filter((p) => p.weightG <= wCap)
      .filter((p) => (p.premium ?? 0) <= fCap)
      .filter((p) => !inStock || p.available);

    // السعر من الخادم. القطعة بلا سعر (معدن موقوف) تُرتَّب أخيرًا بدل أن تبدو الأرخص.
    const priceOf = (p: (typeof all)[number]) => p.price ?? Infinity;

    switch (sort) {
      case "price-asc":
        return [...out].sort((a, b) => priceOf(a) - priceOf(b));
      case "price-desc":
        return [...out].sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
      case "weight-asc":
        return [...out].sort((a, b) => a.weightG - b.weightG);
      case "weight-desc":
        return [...out].sort((a, b) => b.weightG - a.weightG);
      case "premium-asc":
        return [...out].sort((a, b) => (a.premium ?? 0) - (b.premium ?? 0));
      default:
        return out;
    }
  }, [catalog, metal, cats, provs, wCap, fCap, inStock, sort]);

  const active =
    (metal !== "all" ? 1 : 0) +
    cats.length +
    provs.length +
    (maxW !== undefined ? 1 : 0) +
    (maxF !== undefined ? 1 : 0) +
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
      subtitle="سبائك وعملات ذهبية معتمدة بشهادات أصل، وأسعار محدثة لحظيًا حسب سعر السوق."
    >
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={`${open ? "block" : "hidden"} lg:block`}>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base text-primary">{t("تصفية المنتجات")}</h2>
              {active > 0 && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
                >
                  <X className="h-3 w-3" /> {t("مسح")}
                </button>
              )}
            </div>

            <p className="mb-2 text-xs font-semibold text-primary">{t("نوع المعدن")}</p>
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
                  {t(label)}
                </button>
              ))}
            </div>

            <p className="mb-2 text-xs font-semibold text-primary">{t("الفئة")}</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {visibleCats.map((c) => (
                <button
                  key={c}
                  onClick={() => toggle(cats, c, setCats)}
                  className={chip(cats.includes(c))}
                >
                  {t(c)}
                </button>
              ))}
            </div>

            <p className="mb-2 text-xs font-semibold text-primary">
              {t("نطاق الوزن — حتى")} {weightLabel(wCap)}
            </p>
            <input
              type="range"
              min={MIN_W}
              max={MAX_W}
              step="0.25"
              value={wCap}
              onChange={(e) => setMaxW(Number(e.target.value))}
              aria-label={t("الحد الأقصى للوزن بالجرام")}
              className="mb-1 w-full accent-[var(--color-gold-deep,#b8860b)]"
            />
            <div dir="ltr" className="mb-5 flex justify-between text-[11px] text-muted-foreground">
              <span>
                {MIN_W} {t("جم")}
              </span>
              <span>
                {MAX_W} {t("جم")}
              </span>
            </div>

            <p className="mb-2 text-xs font-semibold text-primary">
              {t("المصنعية — حتى")} {egp(fCap)} {t("ج.م")}
            </p>
            <input
              type="range"
              min={MIN_F}
              max={MAX_F}
              step="1"
              value={fCap}
              onChange={(e) => setMaxF(Number(e.target.value))}
              aria-label={t("الحد الأقصى للمصنعية")}
              className="mb-1 w-full accent-[var(--color-gold-deep,#b8860b)]"
            />
            <div dir="ltr" className="mb-5 flex justify-between text-[11px] text-muted-foreground">
              <span>{egp(MIN_F)}</span>
              <span>{egp(MAX_F)}</span>
            </div>

            <p className="mb-2 text-xs font-semibold text-primary">{t("المورّد")}</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {PROVIDERS.map((pr) => (
                <button
                  key={pr}
                  onClick={() => toggle(provs, pr, setProvs)}
                  className={chip(provs.includes(pr))}
                >
                  {t(pr)}
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
              {t("المتوفر فقط")}
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
              {t("الفلاتر")} {active > 0 && `(${active})`}
            </button>

            <p className="text-xs text-muted-foreground">
              {list.length} {t("من")} {all.length} {t("منتج")}
            </p>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {t("ترتيب حسب")}:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label={t("ترتيب المنتجات")}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-primary outline-none focus:border-gold"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {t(s.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="text-lg text-primary">{t("لا توجد منتجات مطابقة")}</p>
              <button
                onClick={reset}
                className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                {t("مسح الفلاتر")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
