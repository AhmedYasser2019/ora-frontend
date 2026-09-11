import { createServerFn } from "@tanstack/react-start";

import { fetchReports } from "./reports.server";

export const getReports = createServerFn({ method: "GET" }).handler(async () => {
  return fetchReports();
});
