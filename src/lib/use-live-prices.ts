import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { livePricesQuery } from "./prices.queries";
import type { LivePrices } from "./prices.server";

export type PriceTick = { at: number; k24: number; silver: number };

const WINDOW_MS = 60_000;

/**
 * Live prices with an SSE push feed: initial data comes from the SSR loader /
 * query cache, then the stream pushes updates every few seconds.
 * Also keeps a rolling 60-second history of pushed ticks.
 */
export function useLivePrices() {
  const queryClient = useQueryClient();
  const query = useQuery(livePricesQuery);
  const [live, setLive] = useState(false);
  const [pushedAt, setPushedAt] = useState(0);
  const [history, setHistory] = useState<PriceTick[]>([]);

  useEffect(() => {
    const source = new EventSource("/api/public/prices-stream");

    source.onopen = () => setLive(true);
    source.onerror = () => setLive(false);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as LivePrices;
        queryClient.setQueryData(livePricesQuery.queryKey, data);
        setLive(true);
        const at = Date.now();
        setPushedAt(at);
        setHistory((prev) =>
          [...prev, { at, k24: data.gram.k24, silver: data.gram.silver }].filter(
            (tick) => at - tick.at <= WINDOW_MS,
          ),
        );
      } catch {
        /* ignore malformed frame */
      }
    };

    return () => source.close();
  }, [queryClient]);

  // Drop ticks that fall out of the 60s window even when no push arrives.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setHistory((prev) => {
        const next = prev.filter((tick) => now - tick.at <= WINDOW_MS);
        return next.length === prev.length ? prev : next;
      });
    }, 5_000);
    return () => clearInterval(interval);
  }, []);

  return {
    data: query.data,
    isFetching: query.isFetching,
    dataUpdatedAt: Math.max(query.dataUpdatedAt, pushedAt),
    live,
    pushedAt,
    history,
  };
}
