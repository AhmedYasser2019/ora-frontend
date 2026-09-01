import { useEffect, useState } from "react";

import { marketStatus, splitDuration } from "@/lib/market-hours";

export function MarketCountdown() {
  const [status, setStatus] = useState(() => marketStatus());

  useEffect(() => {
    const id = setInterval(() => setStatus(marketStatus()), 1000);
    return () => clearInterval(id);
  }, []);

  const { days, hours, minutes, seconds } = splitDuration(status.secondsToOpen);
  const boxes = [
    { v: seconds, l: "ثانية" },
    { v: minutes, l: "دقيقة" },
    { v: hours, l: "ساعة" },
    { v: days, l: "يوم" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <span
            className={`h-5 w-5 shrink-0 rounded-full ${
              status.openNow ? "bg-primary" : "animate-pulse bg-destructive"
            }`}
          />
          <div className="text-right">
            <p
              className={`text-lg font-semibold ${
                status.openNow ? "text-primary" : "text-destructive"
              }`}
            >
              {status.openNow ? "السوق مفتوح الآن" : "السوق مغلق الآن"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {status.openNow
                ? "التداول متاح · الأحد إلى الخميس من 10 ص حتى 5 م"
                : "برجاء الانتظار، سيفتح السوق بعد"}
            </p>
          </div>
        </div>

        {!status.openNow && (
          <div className="mt-5 grid grid-cols-4 gap-3">
            {boxes.map((b) => (
              <div key={b.l} className="rounded-xl bg-cream px-2 py-4 text-center">
                <p suppressHydrationWarning className="font-display text-2xl text-primary">
                  {String(b.v).padStart(2, "0")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{b.l}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
