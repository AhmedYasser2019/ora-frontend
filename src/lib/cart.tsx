import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { api, ApiError } from "./api";
import { bySlug, productsQuery } from "./catalog.queries";
import type { Product } from "./catalog.server";
import { useT } from "./i18n";
import type { SiteSettings } from "./settings.server";
import { useAuth } from "./use-auth";

/**
 * السلة تعيش في الحساب: `GET/POST/DELETE /cart`، وكل ردّ هو السلة كاملة. الإضافة كانت
 * تتطلب تسجيل الدخول أصلًا، فلا سلة زائر تُدمج — وسلة قديمة على الجهاز قد تخصّ حسابًا آخر
 * سجّل من نفس المتصفح، فتُمسح ولا تُرفع.
 *
 * السطر هنا كود وكمية فقط: الاسم والصورة والسعر تأتي من الكتالوج بمفتاح الـ sku، فلا نسخة
 * ثانية من القطعة تتقادم في السلة.
 */

export type CartItem = { slug: string; qty: number };

export type Line = { product: { sku: string }; quantity: number };
type ServerCart = { as_of: string; items: Line[]; count: number; subtotal_piasters: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  ready: boolean;
  /** ترجع false لو المستخدم غير مسجّل الدخول (ويتم تحويله لصفحة الدخول) أو تتخطى الكمية المتاح */
  add: (slug: string, qty?: number) => boolean;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const LEGACY_KEY = "ora-cart-v1";
const KEY = ["cart"];
const MAX_QTY = 99;

const CartContext = createContext<CartContextValue | null>(null);

/** إدراج السطر أو ضبط كميته — التخمين المتفائل قبل ردّ الخادم. */
export const upsert = (prev: Line[], slug: string, qty: number): Line[] =>
  prev.some((l) => l.product.sku === slug)
    ? prev.map((l) => (l.product.sku === slug ? { ...l, quantity: qty } : l))
    : [{ product: { sku: slug }, quantity: qty }, ...prev];

/**
 * الأسطر التي تطلب أكثر مما على الرف الآن. الخادم يرفض الكمية الزائدة عند الإضافة، لكن سلة
 * قديمة قد تسبق نفاد المخزون — فتُعرض هنا قبل الدفع لا عند آخر خطوة.
 */
export const shortLines = (items: CartItem[], catalog: Product[] | undefined) =>
  items.flatMap((i) => {
    const p = bySlug(catalog, i.slug);
    return p && i.qty > p.stock ? [{ ...i, product: p }] : [];
  });

/** كم قطعة أخرى تقبلها السلة من هذا المنتج: المخزون ناقص ما فيها، وبحد السلة الأقصى. */
export const room = (stock: number, inCart: number) =>
  Math.max(0, Math.min(stock, MAX_QTY) - inCart);

/** نفس صياغة الخادم: أيّ قطعة، وكم المتاح منها. */
export const shortMessage = (t: (s: string) => string, p: Product) =>
  `${t(p.t)} ${t("غير متوفرة بالكمية المطلوبة")} (${t("المتاح")}: ${p.stock})`;

const lines = (qc: QueryClient) => qc.getQueryData<ServerCart>(KEY)?.items ?? [];

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* لا شيء نفعله */
    }
  }, []);

  const { data, isPending } = useQuery({
    queryKey: KEY,
    queryFn: () => api<ServerCart>("/cart"),
    enabled: !!user,
  });

  const items = useMemo<CartItem[]>(
    () => (user ? (data?.items ?? []).map((l) => ({ slug: l.product.sku, qty: l.quantity })) : []),
    [user, data],
  );

  /** تحديث متفائل للأسطر، ثم يحلّ ردّ الخادم محلّه. */
  const patch = useCallback(
    (fn: (prev: Line[]) => Line[]) =>
      qc.setQueryData<ServerCart>(KEY, (c) => (c ? { ...c, items: fn(c.items) } : c)),
    [qc],
  );

  const settle = useCallback(
    (p: Promise<ServerCart>) =>
      p
        .then((cart) => qc.setQueryData(KEY, cart))
        .catch((e) => {
          // الكمية الزائدة عن المخزون تُرفض هنا، والرسالة تسمّي القطعة والمتاح منها.
          if (e instanceof ApiError) toast.error(t(e.firstMessage));
          return qc.invalidateQueries({ queryKey: KEY });
        }),
    [qc, t],
  );

  // POST يضبط الكمية ولا يزيدها، فسطر الزيادة يحسب الكمية الجديدة هنا.
  const put = useCallback(
    (slug: string, qty: number) => {
      patch((prev) => upsert(prev, slug, qty));
      settle(api<ServerCart>("/cart", { method: "POST", body: { sku: slug, quantity: qty } }));
    },
    [patch, settle],
  );

  const add = useCallback(
    (slug: string, qty = 1) => {
      if (loading) return false;
      if (!user) {
        toast.error(t("سجّل الدخول أولاً"), {
          description: t("لازم تسجّل الدخول قبل الإضافة للسلة"),
        });
        navigate({ to: "/auth", search: { next: window.location.pathname } });
        return false;
      }

      const current = lines(qc).find((l) => l.product.sku === slug)?.quantity ?? 0;
      // يُرفض هنا قبل الطلب، فلا يقفز السطر للكمية الزائدة ثم يرتدّ بعد رفض الخادم.
      const p = bySlug(qc.getQueryData(productsQuery.queryKey), slug);
      if (p && qty > room(p.stock, current)) {
        toast.error(shortMessage(t, p));
        return false;
      }
      put(slug, Math.min(current + qty, MAX_QTY));
      return true;
    },
    [loading, user, navigate, t, qc, put],
  );

  const remove = useCallback(
    (slug: string) => {
      patch((prev) => prev.filter((l) => l.product.sku !== slug));
      settle(api<ServerCart>(`/cart/${encodeURIComponent(slug)}`, { method: "DELETE" }));
    },
    [patch, settle],
  );

  const setQty = useCallback(
    (slug: string, qty: number) => {
      if (qty <= 0) return remove(slug);
      put(slug, Math.min(qty, MAX_QTY));
    },
    [remove, put],
  );

  const clear = useCallback(() => {
    patch(() => []);
    settle(api<ServerCart>("/cart", { method: "DELETE" }));
  }, [patch, settle]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      ready: !loading && (!user || !isPending),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, loading, user, isPending, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * رسم التوصيل للمنزل بالجنيه، بقاعدة الخادم نفسها (GET /settings → delivery): مجاني حين تبلغ
 * القطع حدّ الإعفاء. تقدير للعرض — الطلب هو ما يحتسبه فعلًا، على سعر القطع المثبّت.
 */
export function deliveryFee(subtotal: number, rule?: SiteSettings["delivery"]) {
  if (!rule || subtotal === 0 || subtotal * 100 >= rule.free_over_piasters) return 0;
  return rule.fee_piasters / 100;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
