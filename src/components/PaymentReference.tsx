import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n";

/**
 * رقم التحويل لطلب InstaPay أو تحويل بنكي. يُدفع الطلب بعد تأكيده بالسعر المثبَّت، فهنا يخبر
 * العميل مكتب الحسابات أيّ تحويل وارد هو تحويله. يُعدَّل ما دام الطلب قيد التنفيذ — انظر
 * PUT /orders/{id}/payment-reference.
 */
export function PaymentReference({
  orderId,
  initial,
  onSaved,
}: {
  orderId: string;
  initial: string | null;
  onSaved?: () => void;
}) {
  const t = useT();
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const id = `ref-${orderId}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/orders/${orderId}/payment-reference`, {
        method: "PUT",
        body: { payment_reference: value.trim() },
      });
      setSaved(value.trim());
      toast.success(t("تم حفظ رقم التحويل"));
      onSaved?.();
    } catch (e) {
      toast.error(t(e instanceof ApiError ? e.firstMessage : "تعذر حفظ رقم التحويل"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-1 text-start">
      <label htmlFor={id} className="block text-xs font-semibold text-primary">
        {t("رقم التحويل")}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          dir="ltr"
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-primary outline-none focus:border-gold"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={64}
          required
        />
        <button
          type="submit"
          disabled={busy || !value.trim() || value.trim() === saved}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
          {t(saved ? "تعديل الرقم" : "إرسال")}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {t("بعد التحويل أدخل رقم العملية كما يظهر في الإيصال، ليطابقه فريقنا مع طلبك.")}
      </p>
    </form>
  );
}
