import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useT } from "./i18n";
import { useAuth } from "./use-auth";

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  sub: string;
  img: string;
  qty: number;
  /** آخر سعر معروف وقت الإضافة، يُستخدم كاحتياطي لو البث متوقف */
  lastPrice: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  ready: boolean;
  /** ترجع false لو المستخدم غير مسجّل الدخول (ويتم تحويله لصفحة الدخول) */
  add: (item: Omit<CartItem, "qty">, qty?: number) => boolean;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "ora-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* تجاهل */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* تجاهل */
    }
  }, [items, ready]);

  const add = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      if (loading) return false;
      if (!user) {
        toast.error(t("سجّل الدخول أولاً"), {
          description: t("لازم تسجّل الدخول قبل الإضافة للسلة"),
        });
        navigate({ to: "/auth", search: { next: window.location.pathname } });
        return false;
      }
      setItems((prev) => {
        const found = prev.find((p) => p.id === item.id);
        if (found) {
          return prev.map((p) =>
            p.id === item.id
              ? { ...p, qty: p.qty + qty, lastPrice: item.lastPrice || p.lastPrice }
              : p,
          );
        }
        return [...prev, { ...item, qty }];
      });
      return true;
    },
    [loading, user, navigate, t],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.id !== id)
        : prev.map((p) => (p.id === id ? { ...p, qty: Math.min(qty, 99) } : p)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      ready,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, ready, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const DELIVERY_FEE = 150;
export const FREE_DELIVERY_OVER = 50_000;
