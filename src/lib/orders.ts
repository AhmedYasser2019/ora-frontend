import { api, ApiError } from "./api";
import type { CartItem } from "./cart";

/**
 * تنفيذ طلب من السلة.
 *
 * خطوتان لكل قطعة: عرض سعر مثبَّت من الخادم (`POST /products/{sku}/quote` بلا جسم — لا شيء
 * يرسله المتصفح يُصدَّق كسعر)، ثم أمر يحمل رقم العرض فقط. السعر الذي يُنفَّذ عليه هو الذي
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
  product?: { sku: string; name: string };
};

type Quote = { quote_id: string; amount_piasters: number; expires_at: string };

export async function placeOrder(
  items: CartItem[],
  destination: Destination,
  receipt?: File | null,
): Promise<PlacedOrder> {
  const quoteIds: string[] = [];

  for (const item of items) {
    for (let n = 0; n < item.qty; n++) {
      const quote = await api<Quote>(`/products/${encodeURIComponent(item.slug)}/quote`, {
        method: "POST",
      });
      quoteIds.push(quote.quote_id);
    }
  }

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
