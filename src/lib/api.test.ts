import assert from "node:assert";
import { fieldErrors } from "./api";

// الغلاف يضع أخطاء التحقق في `data` لا في `errors` — انظر ApiEnvelope::failure.
assert.deepEqual(fieldErrors({ msg: "…", data: { phone: ["رقم غير صحيح"] } }), {
  phone: ["رقم غير صحيح"],
});

// رفض تجاري: `data` فيه سبب نصّي لا خريطة حقول، فلا يُقرأ كخطأ حقل.
assert.deepEqual(fieldErrors({ msg: "مرفوض", data: { reason: "ora.order.rejected.halted" } }), {});

// `errors` لو عاد الغلاف يومًا لوضعها هناك.
assert.deepEqual(fieldErrors({ msg: "", errors: { email: ["مستخدم"] } }), { email: ["مستخدم"] });

// لا شيء يُقرأ: نجاح، أو جسم فارغ، أو data ليست كائنًا.
assert.deepEqual(fieldErrors(null), {});
assert.deepEqual(fieldErrors({ data: null }), {});
assert.deepEqual(fieldErrors({ data: "نص" as unknown as Record<string, string[]> }), {});
