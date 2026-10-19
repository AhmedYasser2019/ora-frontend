/**
 * Google Analytics 4 — نفس الـ Property التي يرسل لها التطبيق عبر Firebase، فأسماء الأحداث
 * هي أسماء GA الموصى بها (view_item، add_to_cart، …) ليجتمع الويب والتطبيق في تقرير واحد.
 *
 * بلا VITE_GA_MEASUREMENT_ID لا يُحمَّل شيء ولا يُرسل شيء. لا بيانات شخصية هنا أبدًا — سياسة
 * Google تمنعها: المستخدم يُعرَّف برقمه الداخلي فقط، لا باسم ولا بريد ولا موبايل.
 */

import type { Product } from "./catalog.server";

const id = import.meta.env["VITE_GA_MEASUREMENT_ID"] as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// gtag.js يقرأ كائن `arguments` نفسه لا مصفوفة، فلا تصلح هنا `...args`.
function gtag(..._: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
}

/** يُنادى مرة في المتصفح. صفحات التنقّل يسجّلها GA بنفسه (Enhanced measurement). */
export function initAnalytics() {
  if (!id || typeof window === "undefined" || window.dataLayer) return;
  window.dataLayer = [];
  gtag("js", new Date());
  gtag("config", id);

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

/** يربط زيارات نفس العميل عبر أجهزته. null عند الخروج. */
export const setAnalyticsUser = (userId: number | null) =>
  gtag("set", { user_id: userId === null ? null : String(userId) });

export const track = (event: string, params?: Record<string, unknown>) =>
  gtag("event", event, params);

/** سطر منتج بصيغة GA. المنتج قد يغيب لو لم يُحمَّل الكتالوج بعد، فيبقى الـ sku وحده. */
export const gaItem = (slug: string, p: Product | undefined, quantity = 1) => ({
  item_id: slug,
  item_name: p?.t,
  item_category: p?.cat,
  item_brand: p?.provider,
  price: p?.price,
  quantity,
});
