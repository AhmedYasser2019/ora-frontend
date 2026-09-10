import { createServerFn } from "@tanstack/react-start";

import { fetchProducts } from "./catalog.server";

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  return fetchProducts();
});
