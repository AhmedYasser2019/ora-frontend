import barImg from "@/assets/bar.jpg";
import coinsImg from "@/assets/coins.jpg";
import silverImg from "@/assets/silver.jpg";
import jewelryImg from "@/assets/jewelry.jpg";

export const navLinks = [
  { label: "الرئيسية", to: "/" },
  { label: "مجموعتنا", to: "/collection" },
  { label: "الفضة", to: "/silver" },
  { label: "سعر الذهب", to: "/gold-price" },
  { label: "حساب الزكاة", to: "/zakat" },
  { label: "الأخبار", to: "/news" },
  { label: "فروعنا", to: "/branches" },
  { label: "من نحن", to: "/about" },
] as const;

export type PriceKey = "bar-10g" | "coin-8g" | "set-12g" | "silver-100g";

export type Product = {
  key: PriceKey;
  slug: string;
  img: string;
  t: string;
  s: string;
  cat: "سبائك ذهب" | "عملات ذهبية" | "مشغولات" | "سبائك فضة";
  weight: string;
  karat: string;
  purity: string;
  brand: string;
  desc: string;
};

export const allProducts: Product[] = [
  { key: "bar-10g", slug: "gold-bar-10g", img: barImg, t: "سبيكة ذهب 10 جرام", s: "عيار 24 – 999.9", cat: "سبائك ذهب", weight: "10 جرام", karat: "24", purity: "999.9", brand: "أورا", desc: "سبيكة ذهب خالص عيار 24 بوزن 10 جرام، مختومة بشهادة أصل ومغلفة بغلاف مؤمّن ضد العبث. الخيار الأنسب لبداية ادخار الذهب بسعر قريب من سعر السوق." },
  { key: "bar-10g", slug: "gold-bar-5g", img: barImg, t: "سبيكة ذهب 5 جرام", s: "عيار 24 – 999.9", cat: "سبائك ذهب", weight: "5 جرام", karat: "24", purity: "999.9", brand: "أورا", desc: "سبيكة ذهب خالص عيار 24 بوزن 5 جرام، بمصنعية منخفضة وسهولة في إعادة البيع في أي فرع من فروعنا." },
  { key: "coin-8g", slug: "gold-sovereign-coin", img: coinsImg, t: "جنيه ذهب إنجليزي", s: "عيار 22 – 8 جرام", cat: "عملات ذهبية", weight: "8 جرام", karat: "22", purity: "916.7", brand: "أورا", desc: "الجنيه الذهب الإنجليزي عيار 22، من أكثر العملات الذهبية تداولًا في السوق المصري وأسرعها في إعادة البيع." },
  { key: "coin-8g", slug: "ora-gold-coin", img: coinsImg, t: "عملة ذهب أورا", s: "عيار 24 – 8 جرام", cat: "عملات ذهبية", weight: "8 جرام", karat: "24", purity: "999.9", brand: "أورا", desc: "عملة ذهب أورا عيار 24 بوزن 8 جرام، بتصميم مميز وشهادة أصل مرفقة داخل العبوة." },
  { key: "set-12g", slug: "classic-gold-set", img: jewelryImg, t: "طقم ذهب كلاسيك", s: "عيار 21 – 12 جرام", cat: "مشغولات", weight: "12 جرام", karat: "21", purity: "875", brand: "أورا", desc: "طقم ذهب عيار 21 بتصميم كلاسيكي، مدموغ بمصلحة الدمغة والموازين ومرفق معه فاتورة ضريبية معتمدة." },
  { key: "set-12g", slug: "egyptian-gold-bangle", img: jewelryImg, t: "غويشة ذهب مصرية", s: "عيار 21 – 12 جرام", cat: "مشغولات", weight: "12 جرام", karat: "21", purity: "875", brand: "أورا", desc: "غويشة ذهب عيار 21 بنقش مصري تقليدي، وزن 12 جرام، مدموغة ومرفق معها شهادة ضمان." },
  { key: "silver-100g", slug: "silver-bar-100g", img: silverImg, t: "سبيكة فضة 100 جرام", s: "فضة 999", cat: "سبائك فضة", weight: "100 جرام", karat: "—", purity: "999", brand: "أورا", desc: "سبيكة فضة نقية 999 بوزن 100 جرام، بديل اقتصادي لبدء الادخار في المعادن النفيسة." },
  { key: "silver-100g", slug: "silver-bar-50g", img: silverImg, t: "سبيكة فضة 50 جرام", s: "فضة 999", cat: "سبائك فضة", weight: "50 جرام", karat: "—", purity: "999", brand: "أورا", desc: "سبيكة فضة نقية 999 بوزن 50 جرام، مغلفة بغلاف مؤمّن ومناسبة للإهداء." },
];

export const productBySlug = (slug: string) => allProducts.find((p) => p.slug === slug);

export const branches = [
  {
    city: "الإسكندرية",
    name: "فرع سموحة",
    address: "14 شارع فيكتور عمانويل، سموحة، الإسكندرية",
    phone: "17608",
    hours: "يوميًا 10 ص – 10 م",
  },
  {
    city: "القاهرة",
    name: "فرع مدينة نصر",
    address: "22 شارع عباس العقاد، مدينة نصر، القاهرة",
    phone: "17608",
    hours: "يوميًا 10 ص – 11 م",
  },
  {
    city: "الجيزة",
    name: "فرع المهندسين",
    address: "8 شارع جامعة الدول العربية، المهندسين، الجيزة",
    phone: "17608",
    hours: "يوميًا 11 ص – 10 م",
  },
  {
    city: "المنصورة",
    name: "فرع المنصورة",
    address: "5 شارع الجمهورية، المنصورة، الدقهلية",
    phone: "17608",
    hours: "السبت – الخميس 10 ص – 9 م",
  },
];
