import { api, ApiError } from "./api";
import type { CartItem } from "./cart";

/**
 * تنفيذ طلب من السلة.
 *
 * خطوتان: عرض سعر مثبَّت لكل قطعة من الخادم — كلها في طلب واحد (`POST /cart/quote` بالرمز
 * والعدد فقط، لا شيء يرسله المتصفح يُصدَّق كسعر) — ثم أمر يحمل أرقام العروض فقط. السعر الذي يُنفَّذ عليه هو الذي
 * كتبه الخادم في صفّ العرض، لا الذي عرضته الشاشة.
 *
 * لكل قطعة عرضها وسعرها المثبَّت وقيدها في الدفتر، لكن السلة كلها **طلب واحد**: رقم واحد
 * وحالة واحدة، يُوافَق عليه ويُسلَّم ويُلغى كاملًا. `items` يحمل سطور الطلب.
 *
 * والسلة كلها تُرسل في طلب واحد (`POST /checkout`) وتُنفَّذ كلها أو لا شيء: قطعة زائدة
 * عن المخزون أو رصيد لا يكفي يرفض السلة كاملة، فلا يبقى طلب وحجوزات خلف رسالة خطأ.
 * مفتاح تكرار واحد للسلة، والخادم يشتق منه مفتاح كل قطعة.
 */

export type Destination = {
  fulfilment: "pickup" | "delivery";
  contact_name: string;
  contact_phone: string;
  payment_method: string;
  /** إلزامي لـ InstaPay والتحويل البنكي: الطلب يُنشأ بتحويله، فلا يحجز قطعة لتحويل لم يأتِ. */
  payment_reference?: string;
  governorate?: string;
  address?: string;
  branch?: string;
};

export type PlacedOrder = {
  order_id: string;
  status: string;
  status_label: string;
  gross_piasters: number;
  /** رسم التوصيل فوق سعر القطع، وصفر حين لا يُحتسب. */
  delivery_fee_piasters?: number;
  /** طلب دُفع بجرامات المحفظة (`metal`): ما خرج فعلًا من الرصيدين. */
  paid_from_balance?: { grams: string; piasters: number };
  product?: { sku: string; name: string };
};

type Quote = { quote_id: string; amount_piasters: number; expires_at: string };

export async function placeOrder(
  items: CartItem[],
  destination: Destination,
  receipt?: File | null,
): Promise<PlacedOrder> {
  // طلب واحد للسلة كلها، لا طلب لكل قطعة: أربعون سبيكة كانت تستنفد حد الطلبات قبل التأكيد.
  const { quotes } = await api<{ quotes: Quote[] }>("/cart/quote", {
    method: "POST",
    body: { items: items.map((i) => ({ sku: i.slug, qty: i.qty })) },
  });
  const quoteIds = quotes.map((q) => q.quote_id);

  let body: unknown = { quote_ids: quoteIds, ...destination };
  // صورة الإيصال ملف، فالطلب كله multipart حين تُرفق.
  if (receipt) {
    const form = new FormData();
    quoteIds.forEach((id) => form.append("quote_ids[]", id));
    Object.entries(destination).forEach(([k, v]) => v !== undefined && form.append(k, v));
    form.append("payment_receipt", receipt);
    body = form;
  }

  return api<PlacedOrder>("/checkout", {
    method: "POST",
    body,
    idempotencyKey: crypto.randomUUID(),
  });
}

/** رسالة يفهمها العميل من رفض الخادم. */
export const orderErrorMessage = (e: unknown) =>
  e instanceof ApiError ? e.firstMessage : "تعذر إتمام الطلب";
