import { useEffect, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

import { livePricesQuery } from "./prices.queries";
import type { LivePrices } from "./prices.server";

export type PriceTick = { at: number; k24: number; k21: number; silver: number };
export type TickKey = "k24" | "k21" | "silver";

const WINDOW_MS = 60_000;
const SAMPLE_MS = 5_000;

/**
 * الأسعار الحيّة عبر Reverb.
 *
 * الباك إند يحسب اللوحة كل ثانية ويبثّها على قناة `prices` العامة، ويرسل معها نسخة
 * بشكل الواجهة (`snapshot`) فنضعها في الكاش كما هي — الواجهة لا تحسب سعرًا أبدًا.
 * البثّ لا يخرج إلا حين يتغيّر شيء فعلًا، فالسوق الهادئ لا يوقظ كل جهاز كل ثانية.
 *
 * اتصال واحد للصفحة كلها: الهيدر والصفحة يستدعيان هذا الـ hook معًا، فالسوكت يعيش على
 * مستوى الوحدة ويُغلق حين يخرج آخر مستخدم له.
 *
 * الاستعلام في prices.queries يظل يعمل كشبكة أمان لو كان السوكت محجوبًا.
 */
type Status = { live: boolean; pushedAt: number };

let status: Status = { live: false, pushedAt: 0 };
const listeners = new Set<() => void>();
let echo: Echo<"reverb"> | null = null;
let users = 0;

const setStatus = (patch: Partial<Status>) => {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function connect(queryClient: QueryClient) {
  const key = import.meta.env["VITE_REVERB_APP_KEY"];
  if (!key) return;

  // pusher-js عبر متغيّر عام هو ما يتوقعه laravel-echo.
  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  echo = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: import.meta.env["VITE_REVERB_HOST"],
    wsPort: Number(import.meta.env["VITE_REVERB_PORT"] ?? 8080),
    wssPort: Number(import.meta.env["VITE_REVERB_PORT"] ?? 443),
    forceTLS: (import.meta.env["VITE_REVERB_SCHEME"] ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
  });

  const connection = echo.connector.pusher.connection;
  connection.bind("connected", () => setStatus({ live: true }));
  for (const state of ["unavailable", "disconnected", "failed"]) {
    connection.bind(state, () => setStatus({ live: false }));
  }

  echo.channel("prices").listen(".board.updated", (payload: { snapshot: LivePrices }) => {
    if (!payload.snapshot) return;

    queryClient.setQueryData(livePricesQuery.queryKey, payload.snapshot);

    // أسعار المنتجات محسوبة على الخادم من نفس السعر، فهي تتغيّر مع كل بثّ. نطلبها
    // من جديد بدل حسابها هنا — الحساب في الواجهة نسخة ثانية من قواعد التسعير.
    // وكذلك قيمة ما اشتراه العميل اليوم — ممتلكاته وطلباته.
    for (const key of ["products", "holdings", "orders"]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }

    setStatus({ live: true, pushedAt: Date.now() });
  });
}

export function useLivePrices() {
  const queryClient = useQueryClient();
  const query = useQuery(livePricesQuery);
  const { live, pushedAt } = useSyncExternalStore(
    subscribe,
    () => status,
    () => status,
  );
  const [history, setHistory] = useState<PriceTick[]>([]);

  useEffect(() => {
    if (users++ === 0) connect(queryClient);

    return () => {
      if (--users > 0 || !echo) return;
      echo.leave("prices");
      echo.disconnect();
      echo = null;
      setStatus({ live: false });
    };
  }, [queryClient]);

  const hasData = query.data !== undefined;

  // السعر ينشره المكتب يدويًا والبثّ لا يخرج إلا عند التغيير، فبدون عيّنة دورية لا تمتلئ
  // النافذة أبدًا ويظل الرسم فارغًا. نأخذ السعر الحالي من الكاش كل بضع ثوانٍ: خط ثابت
  // يقفز لحظة ينشر المكتب سعرًا جديدًا — وهذا ما حدث فعلًا للسعر.
  useEffect(() => {
    const sample = () => {
      const data = queryClient.getQueryData<LivePrices>(livePricesQuery.queryKey);
      const now = Date.now();
      setHistory((prev) => {
        const kept = prev.filter((tick) => now - tick.at <= WINDOW_MS);
        if (!data) return kept;
        const { k24, k21, silver } = data.gram;
        if (k24 === undefined && k21 === undefined && silver === undefined) return kept;
        return [...kept, { at: now, k24: k24 ?? 0, k21: k21 ?? 0, silver: silver ?? 0 }];
      });
    };
    sample();
    const interval = setInterval(sample, SAMPLE_MS);
    return () => clearInterval(interval);
  }, [queryClient, hasData, pushedAt]);

  return {
    data: query.data,
    isFetching: query.isFetching,
    dataUpdatedAt: Math.max(query.dataUpdatedAt, pushedAt),
    live,
    pushedAt,
    history,
  };
}
