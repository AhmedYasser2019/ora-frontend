import { api, ApiError } from "./api";
import type { CartItem } from "./cart";

/**
 * تنفيذ طلب من السلة.
 *
 * خطوتان لكل قطعة: عرض سعر مثبَّت من الخادم (`POST /products/{sku}/quote` بلا جسم — لا شيء
 * يرسله المتصفح يُصدَّق كسعر)، ثم أمر يحمل رقم العرض فقط. السعر الذي يُنفَّذ عليه هو الذي
 * كتبه الخادم في صفّ العرض، لا الذي عرضته الشاشة.
 *
 * **الأمر الواحد قطعة واحدة، عن قصد.** فسطر بكمية 3 يصير ثلاثة أوامر، لكل واحد سعره
 * المثبَّت وقيده في الدفتر وحالته الخاصة — يُوافَق عليه ويُسلَّم ويُلغى وحده. هذا ليس نقصًا
 * يُستكمل لاحقًا: القطعة المادية تخرج من الخزنة كشيء واحد، وربط ثلاث قطع بقيد واحد يجعل
 * إلغاء واحدة منها قيدًا عكسيًا جزئيًا.
 *
 * لكل أمر مفتاح تكرار خاص به، وإلا عُدّ الثاني إعادة إرسال للأول وأُعيد نفس الأمر.
 */

export type Destination = {
  fulfilment: "pickup" | "delivery";
  contact_name: string;
  contact_phone: string;
  payment_method: string;
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
): Promise<PlacedOrder[]> {
  const placed: PlacedOrder[] = [];

  for (const item of items) {
    for (let n = 0; n < item.qty; n++) {
      const quote = await api<Quote>(`/products/${encodeURIComponent(item.slug)}/quote`, {
        method: "POST",
      });

      placed.push(
        await api<PlacedOrder>("/orders", {
          method: "POST",
          body: { quote_id: quote.quote_id, ...destination },
          idempotencyKey: crypto.randomUUID(),
        }),
      );
    }
  }

  return placed;
}

/** رسالة يفهمها العميل من رفض الخادم. */
export const orderErrorMessage = (e: unknown) =>
  e instanceof ApiError ? e.firstMessage : "تعذر إتمام الطلب";
