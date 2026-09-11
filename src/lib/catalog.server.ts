/**
 * الكتالوج من الباك إند.
 *
 * لا سعر يُحسب هنا. `GET /api/v1/products` يعيد سعر كل قطعة بالقروش محسوبًا على السعر
 * الحيّ لحظة القراءة — قيمة المعدن بعياره زائد المصنعية — وهذه الوحدة تترجم الحقول إلى
 * الأسماء التي تستعملها الواجهة، لا أكثر.
 */

import { readLang } from "./i18n";

const API_URL = process.env["API_URL"] ?? "http://localhost:8000";

/** ما يعيده الباك إند لكل قطعة. */
type ApiProduct = {
  sku: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  category: "bar" | "coin";
  metal: "gold" | "silver";
  karat: number;
  purity: string;
  provider: string | null;
  weight_grams: string;
  stock: number;
  image_url: string | null;
  available: boolean;
  reason?: string;
  reason_key?: string;
  price_piasters?: number;
  sell_price_piasters?: number;
  cashback_bps?: number;
  premium_piasters?: number;
  unit_price_piasters_per_gram?: number;
};

export type Category = "سبائك ذهب" | "عملات ذهبية" | "سبائك فضة";

export type Product = {
  /** الـ sku هو المعرّف العام في الباك إند، ومسار المنتج على الموقع. */
  slug: string;
  img: string | null;
  /** الاسم */
  t: string;
  /** السطر الفرعي */
  s: string;
  desc: string;
  metal: "gold" | "silver";
  cat: Category;
  weightG: number;
  karat: number;
  purity: string;
  provider: string;
  stock: number;
  available: boolean;
  /** سبب عدم الإتاحة كما صاغه الخادم — معدن موقوف، عيار غير مدرج، أو مخزون فارغ. */
  reason: string | null;
  /** سعر الشراء بالجنيه. غائب حين يكون المعدن موقوفًا: لا سعر نعرضه ولا نخترعه. */
  price: number | undefined;
  /** ما ندفعه لو أعاد العميل بيع القطعة لنا. */
  resale: number | undefined;
  /** المصنعية بالجنيه. */
  premium: number | undefined;
  /** سعر جرام المعدن بعيار القطعة، كما سعّره الخادم. */
  gramPrice: number | undefined;
  /** نسبة المصنعية المستردّة عند إعادة البيع، بنقاط الأساس. صفر = المصنعية غير مستردّة. */
  cashbackBps: number;
};

const egpOf = (piasters: number | undefined) =>
  piasters === undefined ? undefined : piasters / 100;

const categoryOf = (p: ApiProduct): Category =>
  p.metal === "silver" ? "سبائك فضة" : p.category === "coin" ? "عملات ذهبية" : "سبائك ذهب";

function toProduct(p: ApiProduct): Product {
  return {
    slug: p.sku,
    img: p.image_url,
    t: p.name,
    s: p.subtitle ?? `${p.metal === "silver" ? "نقاء" : "عيار"} ${p.karat} – ${p.purity}`,
    desc: p.description ?? "",
    metal: p.metal,
    cat: categoryOf(p),
    weightG: Number(p.weight_grams),
    karat: p.karat,
    purity: p.purity,
    provider: p.provider ?? "",
    stock: p.stock,
    available: p.available,
    reason: p.reason ?? null,
    price: egpOf(p.price_piasters),
    resale: egpOf(p.sell_price_piasters),
    premium: egpOf(p.premium_piasters),
    gramPrice: egpOf(p.unit_price_piasters_per_gram),
    cashbackBps: p.cashback_bps ?? 0,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  // اسم القطعة وسطرها الفرعي يترجمهما الخادم من Accept-Language، فنمرّر لغة الزائر.
  const res = await fetch(`${API_URL}/api/v1/products`, {
    headers: { accept: "application/json", "accept-language": readLang() },
  });

  if (!res.ok) throw new Error(`products fetch failed: ${res.status}`);

  const body = (await res.json()) as { data: { data: ApiProduct[] } };

  return body.data.data.map(toProduct);
}

export type Metal = "gold" | "silver";

export const CATEGORIES: Category[] = ["سبائك ذهب", "عملات ذهبية", "سبائك فضة"];

/** المورّدون الموجودون فعلًا في الكتالوج — قائمة التاجر، لا قائمة ثابتة في الكود. */
export const providersOf = (products: Product[]) =>
  [...new Set(products.map((p) => p.provider).filter(Boolean))].sort();
