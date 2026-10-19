type Field = Pick<
  HTMLInputElement,
  "validity" | "type" | "minLength" | "maxLength" | "min" | "max" | "title"
>;

/** رسالة أول قيد مكسور في الحقل، بلغة الموقع لا بلغة المتصفح. */
export function validityMessage(el: Field, t: (ar: string) => string): string {
  const v = el.validity;
  const n = (ar: string, x: string | number) => t(ar).replace("{n}", String(x));
  if (v.valueMissing) return t("هذا الحقل مطلوب");
  if (v.badInput) return t("اكتب رقمًا صحيحًا");
  if (v.typeMismatch && el.type === "email") return t("بريد إلكتروني غير صحيح");
  if (v.tooShort) return n("الحد الأدنى {n} أحرف", el.minLength);
  if (v.tooLong) return n("الحد الأقصى {n} حرفًا", el.maxLength);
  if (v.rangeUnderflow) return n("أقل قيمة مسموحة {n}", el.min);
  if (v.rangeOverflow) return n("أكبر قيمة مسموحة {n}", el.max);
  if (v.patternMismatch && el.title) return el.title;
  return t("قيمة غير صحيحة");
}

/**
 * فقاعة التحقق الأصلية (required وأخواتها) تكتب رسالتها بلغة نظام المستخدم، فتظهر
 * "Please fill out this field." على صفحة عربية. نستبدل الرسالة لحظة الـ invalid لكل
 * النماذج مرة واحدة، ونمسحها مع أول تعديل وإلا يبقى الحقل مرفوضًا بعد تصحيحه.
 */
export function localizeValidity(t: (ar: string) => string) {
  const ours = new WeakSet<EventTarget>();
  const onInvalid = (e: Event) => {
    const el = e.target as HTMLInputElement;
    if (el.validity.customError && !ours.has(el)) return; // رسالة وضعها الكود نفسه
    el.setCustomValidity("");
    if (el.validity.valid) {
      ours.delete(el); // صُحّح برمجيًا بلا input
      return;
    }
    el.setCustomValidity(validityMessage(el, t));
    ours.add(el);
  };
  const onEdit = (e: Event) => {
    if (!ours.delete(e.target!)) return;
    (e.target as HTMLInputElement).setCustomValidity("");
  };
  document.addEventListener("invalid", onInvalid, true);
  document.addEventListener("input", onEdit, true);
  document.addEventListener("change", onEdit, true);
  return () => {
    document.removeEventListener("invalid", onInvalid, true);
    document.removeEventListener("input", onEdit, true);
    document.removeEventListener("change", onEdit, true);
  };
}
