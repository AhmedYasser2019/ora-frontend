import { Link } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/lib/cart";
import { egp } from "@/lib/prices.queries";
import type { PriceKey } from "@/lib/site";

export type CardProduct = {
  key: PriceKey;
  slug: string;
  img: string;
  t: string;
  s: string;
};

export function ProductCard({ p, price }: { p: CardProduct; price?: number | undefined }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    const ok = add({
      id: p.t,
      key: p.key,
      title: p.t,
      sub: p.s,
      img: p.img,
      lastPrice: price ?? 0,
    });
    if (!ok) return;
    setAdded(true);
    toast.success("تمت الإضافة للسلة", { description: p.t });
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-soft">
      <Link to="/products/$slug" params={{ slug: p.slug }} aria-label={p.t}>
        <img
          src={p.img}
          alt={p.t}
          loading="lazy"
          width={800}
          height={800}
          className="aspect-square w-full bg-cream object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base text-primary">
          <Link to="/products/$slug" params={{ slug: p.slug }} className="hover:text-gold-deep">
            {p.t}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{p.s}</p>
        <div className="mt-3 flex flex-1 items-end justify-between gap-2">
          <span className="font-display text-lg text-gold-deep">
            {price ? `${egp(price)} ج.م` : "جاري التحديث…"}
          </span>
          <button
            onClick={onAdd}
            aria-label={`أضف ${p.t} للسلة`}
            className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {added ? "تمت الإضافة" : "أضف للسلة"}
          </button>
        </div>
      </div>
    </article>
  );
}
