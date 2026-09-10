import barImg from "@/assets/bar.jpg";
import coinsImg from "@/assets/coins.jpg";
import silverImg from "@/assets/silver.jpg";

import type { Product } from "./catalog.server";

/** صورة القطعة كما رفعها التاجر، وإلا صورة عامة حسب نوعها. */
export const productImage = (p: Product) =>
  p.img ?? (p.metal === "silver" ? silverImg : p.cat === "عملات ذهبية" ? coinsImg : barImg);
