import { queryOptions } from "@tanstack/react-query";

import type { Lang } from "./i18n";
import { getReport, getReports } from "./reports.functions";

export const reportsQuery = queryOptions({
  queryKey: ["reports"],
  queryFn: () => getReports(),
  staleTime: 300_000,
});

/** تقرير واحد بنصّه الكامل. اللغة في المفتاح لنفس سبب settingsQuery. */
export const reportQuery = (id: number, lang: Lang) =>
  queryOptions({
    queryKey: ["reports", id, lang],
    queryFn: () => getReport({ data: id }),
    staleTime: 300_000,
  });

export const reportKindLabel = {
  weekly: "أسبوعي",
  monthly: "شهري",
  quarterly: "ربع سنوي",
  annual: "سنوي",
} as const;
