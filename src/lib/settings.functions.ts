import { createServerFn } from "@tanstack/react-start";

import { fetchSettings } from "./settings.server";

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  return fetchSettings();
});
