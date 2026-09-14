import { createServerFn } from "@tanstack/react-start";

import { fetchReport, fetchReports } from "./reports.server";

export const getReports = createServerFn({ method: "GET" }).handler(async () => {
  return fetchReports();
});

export const getReport = createServerFn({ method: "GET" })
  // الرقم يدخل مسار الطلب للباك إند.
  .validator((id: number) => {
    if (!Number.isSafeInteger(id) || id < 1) throw new Error("bad id");
    return id;
  })
  .handler(({ data }) => fetchReport(data));
