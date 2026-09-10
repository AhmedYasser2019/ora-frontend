import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { api } from "./api";
import { useAuth } from "./use-auth";

/**
 * المفضلة تعيش في الحساب: `GET/POST/DELETE /favorites`، وكل ردّ هو القائمة كاملة فنستبدل
 * ما عندنا بدل التوفيق بين تخمين محلي وما يحفظه الخادم. الخادم يُسقط القطع المشطوبة من
 * القائمة، فالعدّاد لا يعدّ ما لا تعرضه الصفحة.
 *
 * الزائر غير المسجَّل يحفظ على جهازه، وعند أول دخول تُدمج قائمته في الحساب ثم تُمسح.
 */

type FavoritesContextValue = {
  /** أكواد المنتجات المفضّلة (sku) */
  slugs: string[];
  count: number;
  ready: boolean;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  clear: () => void;
  /** يُسقط من قائمة الزائر ما لم يعد في الكتالوج. للحساب: الخادم فعلها. */
  prune: (known: string[]) => void;
};

const STORAGE_KEY = "ora-favorites-v1";
const KEY = ["favorites"];

const readLocal = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
};

const writeLocal = (slugs: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    /* متصفح يمنع التخزين */
  }
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const cached = (qc: QueryClient) => qc.getQueryData<string[]>(KEY) ?? [];

/**
 * هذا المسار وحده يردّ `{data: [...]}` داخل الغلاف العام، فالقائمة تحت طبقتين — مثل
 * `/products`. انظر ApiEnvelope في الباك إند.
 */
const favorites = (path: string, options?: Parameters<typeof api>[1]) =>
  api<{ data: string[] }>(path, options).then((r) => r.data);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [guest, setGuest] = useState<string[]>([]);
  const [guestReady, setGuestReady] = useState(false);
  const merged = useRef<number | null>(null);

  useEffect(() => {
    setGuest(readLocal());
    setGuestReady(true);
  }, []);

  useEffect(() => {
    if (guestReady && !user) writeLocal(guest);
  }, [guest, guestReady, user]);

  const { data: server, isPending } = useQuery({
    queryKey: KEY,
    queryFn: () => favorites("/favorites"),
    enabled: !!user,
  });

  // الدمج مرة واحدة لكل حساب. كود مشطوب في القائمة المحلية يتجاهله الخادم ولا يُفشل الباقي.
  useEffect(() => {
    if (!user || !guestReady || merged.current === user.id) return;
    merged.current = user.id;

    const local = readLocal();
    if (local.length === 0) return;

    favorites("/favorites/merge", { method: "POST", body: { skus: local } })
      .then((list) => {
        writeLocal([]);
        setGuest([]);
        qc.setQueryData(KEY, list);
      })
      .catch(() => {
        /* تبقى محليًا وتُدمج في الدخول التالي */
        merged.current = null;
      });
  }, [user, guestReady, qc]);

  const slugs = useMemo(() => (user ? (server ?? []) : guest), [user, server, guest]);

  const toggle = useCallback(
    (slug: string) => {
      if (!user) {
        setGuest((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [slug, ...p]));
        return;
      }

      const on = cached(qc).includes(slug);
      // القلب يقلب فورًا، ثم يحلّ ردّ الخادم محلّ التخمين.
      qc.setQueryData<string[]>(KEY, (p = []) => (on ? p.filter((s) => s !== slug) : [slug, ...p]));

      const sku = encodeURIComponent(slug);
      (on
        ? favorites(`/favorites/${sku}`, { method: "DELETE" })
        : favorites("/favorites", { method: "POST", body: { sku: slug } })
      )
        .then((list) => qc.setQueryData(KEY, list))
        .catch(() => qc.invalidateQueries({ queryKey: KEY }));
    },
    [user, qc],
  );

  const clear = useCallback(() => {
    if (!user) {
      setGuest([]);
      return;
    }

    const prev = cached(qc);
    qc.setQueryData<string[]>(KEY, []);
    // ponytail: لا مسار جماعي للحذف في الباك إند، وقائمة المفضلة قصيرة. أضف DELETE /favorites
    // لو صارت القوائم بمئات القطع.
    Promise.allSettled(
      prev.map((s) => favorites(`/favorites/${encodeURIComponent(s)}`, { method: "DELETE" })),
    ).then(() => qc.invalidateQueries({ queryKey: KEY }));
  }, [user, qc]);

  const prune = useCallback(
    (known: string[]) => {
      if (user) return;
      setGuest((p) => (p.every((s) => known.includes(s)) ? p : p.filter((s) => known.includes(s))));
    },
    [user],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      slugs,
      count: slugs.length,
      ready: !loading && (user ? !isPending : guestReady),
      has: (slug: string) => slugs.includes(slug),
      toggle,
      clear,
      prune,
    }),
    [slugs, loading, user, isPending, guestReady, toggle, clear, prune],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
}
