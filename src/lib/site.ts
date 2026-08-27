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
  img: string;
  t: string;
  s: string;
  cat: "سبائك ذهب" | "عملات ذهبية" | "مشغولات" | "سبائك فضة";
  weight: string;
};

export const allProducts: Product[] = [
  { key: "bar-10g", img: barImg, t: "سبيكة ذهب 10 جرام", s: "عيار 24 – 999.9", cat: "سبائك ذهب", weight: "10 جرام" },
  { key: "bar-10g", img: barImg, t: "سبيكة ذهب 5 جرام", s: "عيار 24 – 999.9", cat: "سبائك ذهب", weight: "5 جرام" },
  { key: "coin-8g", img: coinsImg, t: "جنيه ذهب إنجليزي", s: "عيار 22 – 8 جرام", cat: "عملات ذهبية", weight: "8 جرام" },
  { key: "coin-8g", img: coinsImg, t: "عملة ذهب أورا", s: "عيار 24 – 8 جرام", cat: "عملات ذهبية", weight: "8 جرام" },
  { key: "set-12g", img: jewelryImg, t: "طقم ذهب كلاسيك", s: "عيار 21 – 12 جرام", cat: "مشغولات", weight: "12 جرام" },
  { key: "set-12g", img: jewelryImg, t: "غويشة ذهب مصرية", s: "عيار 21 – 12 جرام", cat: "مشغولات", weight: "12 جرام" },
  { key: "silver-100g", img: silverImg, t: "سبيكة فضة 100 جرام", s: "فضة 999", cat: "سبائك فضة", weight: "100 جرام" },
  { key: "silver-100g", img: silverImg, t: "سبيكة فضة 50 جرام", s: "فضة 999", cat: "سبائك فضة", weight: "50 جرام" },
];

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
