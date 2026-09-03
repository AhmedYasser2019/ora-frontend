import { Link } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { egp } from "@/lib/prices.queries";
import type { Product } from "@/lib/site";

export function ProductCard({ p, price }: { p: Product; price?: number | undefined }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const t = useT();

  const onAdd = () => {
    if (!p.available) return;
    const ok = add({
      id: p.t,
      slug: p.slug,
      title: p.t,
      sub: p.s,
      img: p.img,
      lastPrice: price ?? 0,
    });
    if (!ok) return;
    setAdded(true);
    toast.success(t("تمت الإضافة للسلة"), { description: t(p.t) });
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-soft">
      <Link
        to="/products/$slug"
        params={{ slug: p.slug }}
        aria-label={t(p.t)}
        className="relative block"
      >
        {!p.available && (
          <span className="absolute end-2 top-2 z-10 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-semibold text-destructive-foreground">
            {t("غير متوفر")}
          </span>
        )}
        <img
          src={p.img}
          alt={t(p.t)}
          loading="lazy"
          width={800}
          height={800}
          className="aspect-square w-full bg-cream object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base text-primary">
          <Link to="/products/$slug" params={{ slug: p.slug }} className="hover:text-gold-deep">
            {t(p.t)}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{t(p.s)}</p>
        <p className="mt-1 text-[11px] text-gold-deep">{t(p.provider)}</p>
        <div className="mt-3 flex flex-1 items-end justify-between gap-2">
          <span className="font-display text-lg text-gold-deep">
            {price ? `${egp(price)} ${t("ج.م")}` : t("جاري التحديث…")}
          </span>
          <button
            onClick={onAdd}
            disabled={!p.available}
            aria-label={`${t("أضف للسلة")} — ${t(p.t)}`}
            className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {added ? t("تمت الإضافة") : p.available ? t("أضف للسلة") : t("غير متوفر")}
          </button>
        </div>
      </div>
    </article>
  );
}
