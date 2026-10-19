import assert from "node:assert";
import { validityMessage } from "./form-validity";

const t = (ar: string) => ar;
const field = (broken: string, extra = {}) =>
  ({
    type: "text",
    minLength: 8,
    maxLength: 20,
    min: "1",
    max: "9",
    title: "",
    validity: { [broken]: true },
    ...extra,
  }) as never;

assert.equal(validityMessage(field("valueMissing"), t), "هذا الحقل مطلوب");
assert.equal(validityMessage(field("tooShort"), t), "الحد الأدنى 8 أحرف");
assert.equal(validityMessage(field("rangeUnderflow"), t), "أقل قيمة مسموحة 1");
assert.equal(
  validityMessage(field("typeMismatch", { type: "email" }), t),
  "بريد إلكتروني غير صحيح",
);
assert.equal(validityMessage(field("patternMismatch", { title: "01xxxxxxxxx" }), t), "01xxxxxxxxx");
assert.equal(validityMessage(field("stepMismatch"), t), "قيمة غير صحيحة");
// الترجمة تمر على القالب قبل التعويض.
assert.equal(
  validityMessage(field("tooShort"), () => "At least {n} characters"),
  "At least 8 characters",
);
