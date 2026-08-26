import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { livePricesQuery } from "./prices.queries";
import type { LivePrices } from "./prices.server";

/**
 * Live prices with an SSE push feed: initial data comes from the SSR loader /
 * query cache, then the stream pushes updates every few seconds.
 */
export function useLivePrices() {
  const queryClient = useQueryClient();
  const query = useQuery(livePricesQuery);
  const [live, setLive] = useState(false);
  const [pushedAt, setPushedAt] = useState(0);

  useEffect(() => {
    const source = new EventSource("/api/public/prices-stream");

    source.onopen = () => setLive(true);
    source.onerror = () => setLive(false);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as LivePrices;
        queryClient.setQueryData(livePricesQuery.queryKey, data);
        setLive(true);
        setPushedAt(Date.now());
      } catch {
        /* ignore malformed frame */
      }
    };

    return () => source.close();
  }, [queryClient]);

  return {
    data: query.data,
    isFetching: query.isFetching,
    dataUpdatedAt: Math.max(query.dataUpdatedAt, pushedAt),
    live,
    pushedAt,
  };
}
