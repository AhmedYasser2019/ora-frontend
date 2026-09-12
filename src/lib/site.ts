import { lang } from "./i18n";

export const navLinks = [
  { label: "الرئيسية", to: "/" },
  { label: "مجموعتنا", to: "/collection" },
  { label: "سعر الذهب", to: "/gold-price" },
  { label: "سعر الفضة", to: "/silver-price" },
  { label: "حاسبة الميزانية", to: "/budget-calculator" },
  { label: "حساب الزكاة", to: "/zakat" },
  { label: "ممتلكاتي", to: "/holdings" },
  { label: "الأخبار", to: "/news" },
  { label: "التقارير", to: "/reports" },
  { label: "فروعنا", to: "/branches" },
] as const;

/** روابط "مركز المساعدة" في الفوتر. */
export const helpLinks = [
  { label: "من نحن", to: "/about" },
  { label: "إتصل بنا", to: "/contact" },
  { label: "الأسئلة الشائعة", to: "/faq" },
  { label: "طرق الدفع", to: "/payment-methods" },
  { label: "الشروط والأحكام", to: "/terms" },
  { label: "سياسة الخصوصية", to: "/privacy" },
  { label: "سياسة الشحن والتوصيل", to: "/shipping-policy" },
  { label: "سياسة الاسترجاع واسترداد الأموال", to: "/refund-policy" },
] as const;

export const weightLabel = (g: number) =>
  g >= 1000
    ? `${g / 1000} ${lang() === "en" ? "kg" : "كيلو"}`
    : `${g} ${lang() === "en" ? "g" : "جرام"}`;

export const GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "القليوبية",
  "الدقهلية",
  "الشرقية",
  "الغربية",
  "المنوفية",
  "البحيرة",
  "كفر الشيخ",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "شمال سيناء",
  "جنوب سيناء",
  "بني سويف",
  "الفيوم",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "الوادي الجديد",
  "مطروح",
] as const;
