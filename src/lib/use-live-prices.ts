import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
 * الاستعلام في prices.queries يظل يعمل كشبكة أمان لو كان السوكت محجوبًا.
 */
export function useLivePrices() {
  const queryClient = useQueryClient();
  const query = useQuery(livePricesQuery);
  const [live, setLive] = useState(false);
  const [pushedAt, setPushedAt] = useState(0);
  const [history, setHistory] = useState<PriceTick[]>([]);

  useEffect(() => {
    const key = import.meta.env["VITE_REVERB_APP_KEY"];
    if (!key) return;

    // pusher-js عبر متغيّر عام هو ما يتوقعه laravel-echo.
    (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

    const echo = new Echo({
      broadcaster: "reverb",
      key,
      wsHost: import.meta.env["VITE_REVERB_HOST"],
      wsPort: Number(import.meta.env["VITE_REVERB_PORT"] ?? 8080),
      wssPort: Number(import.meta.env["VITE_REVERB_PORT"] ?? 443),
      forceTLS: (import.meta.env["VITE_REVERB_SCHEME"] ?? "https") === "https",
      enabledTransports: ["ws", "wss"],
    });

    const connection = echo.connector.pusher.connection;
    connection.bind("connected", () => setLive(true));
    connection.bind("unavailable", () => setLive(false));
    connection.bind("disconnected", () => setLive(false));
    connection.bind("failed", () => setLive(false));

    echo.channel("prices").listen(".board.updated", (payload: { snapshot: LivePrices }) => {
      const data = payload.snapshot;
      if (!data) return;

      queryClient.setQueryData(livePricesQuery.queryKey, data);
      setLive(true);

      // أسعار المنتجات محسوبة على الخادم من نفس السعر، فهي تتغيّر مع كل بثّ. نطلبها
      // من جديد بدل حسابها هنا — الحساب في الواجهة نسخة ثانية من قواعد التسعير.
      // وكذلك قيمة ما اشتراه العميل اليوم — ممتلكاته وطلباته.
      for (const key of ["products", "holdings", "orders"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }

      const at = Date.now();
      setPushedAt(at);

      // المعدن الموقوف لا يرسل سعرًا، فلا نضيف نقطة للرسم البياني عنه.
      const { k24, k21, silver } = data.gram;
      if (k24 === undefined && k21 === undefined && silver === undefined) return;

      setHistory((prev) =>
        [...prev, { at, k24: k24 ?? 0, k21: k21 ?? 0, silver: silver ?? 0 }].filter(
          (tick) => at - tick.at <= WINDOW_MS,
        ),
      );
    });

    return () => {
      echo.leave("prices");
      echo.disconnect();
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
  }, [queryClient, hasData]);

  return {
    data: query.data,
    isFetching: query.isFetching,
    dataUpdatedAt: Math.max(query.dataUpdatedAt, pushedAt),
    live,
    pushedAt,
    history,
  };
}
