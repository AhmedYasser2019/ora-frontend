import { createFileRoute } from "@tanstack/react-router";

import { fetchLivePrices } from "@/lib/prices.server";

export const Route = createFileRoute("/api/public/prices-stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            let closed = false;
            const send = (data: unknown) => {
              if (closed) return;
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
              } catch {
                closed = true;
              }
            };

            const tick = async () => {
              try {
                send(await fetchLivePrices());
              } catch {
                if (!closed) controller.enqueue(encoder.encode(": error\n\n"));
              }
            };

            await tick();
            const interval = setInterval(tick, 5_000);

            const stop = () => {
              if (closed) return;
              closed = true;
              clearInterval(interval);
              try {
                controller.close();
              } catch {
                /* already closed */
              }
            };

            request.signal.addEventListener("abort", stop);
            // Safety stop after 10 minutes; the client reconnects automatically.
            setTimeout(stop, 10 * 60_000);
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-store, no-transform",
            connection: "keep-alive",
            "x-accel-buffering": "no",
          },
        });
      },
    },
  },
});
