import { lang } from "./i18n";

/**
 * الموقع كزائر: لا تسجيل دخول ولا محفظة ولا ذهب رقمي — العميل يترك القطع ورقمه، والفرع
 * يكمل معه (POST /web-requests). `false` يرجّع الموقع زي التطبيق كما كان؛ ونسخته الكاملة
 * قبل التغيير في الـ tag `web-like-app-2026-10-25`.
 */
export const GUEST_MODE = true;

/** صفحات تحتاج حسابًا، فتُحوَّل للرئيسية في وضع الزائر. `/orders` تغطي `/orders/{id}`. */
export const ACCOUNT_PAGES = ["/auth", "/account", "/wallet", "/orders", "/holdings", "/favorites"];

export const navLinks = [
  { label: "الرئيسية", to: "/" },
  { label: "مجموعتنا", to: "/collection" },
  { label: "سعر الذهب", to: "/gold-price" },
  { label: "سعر الفضة", to: "/silver-price" },
  { label: "حاسبة الميزانية", to: "/budget-calculator" },
  { label: "حساب الزكاة", to: "/zakat" },
  ...(GUEST_MODE ? [] : ([{ label: "ممتلكاتي", to: "/holdings" }] as const)),
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
