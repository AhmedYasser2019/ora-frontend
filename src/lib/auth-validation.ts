import { z } from "zod";

/** حقل ← رسائله، بنفس شكل أخطاء التحقق التي يعيدها الخادم. الرسائل عربية وتُترجم عند العرض. */
export type Errors = Partial<Record<FieldName, string[] | undefined>>;
type FieldName =
  | "name"
  | "phone"
  | "email"
  | "password"
  | "confirm"
  | "code"
  | "docNumber"
  | "docFront"
  | "docBack";

/** أرقام عربية ← لاتينية: لوحة المفاتيح العربية تكتب ٠١٠ والخادم يتحقق من 010. */
export const latin = (s: string) =>
  s.trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));

// نفس قواعد الباك إند (AuthController) — الواجهة تسبقه برسالة تحت الحقل، وهو يبقى الحَكَم.
const phone = z
  .string()
  .transform(latin)
  .pipe(
    z
      .string()
      .regex(
        /^01[0125][0-9]{8}$/,
        "رقم الموبايل غير صحيح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015",
      ),
  );
const email = z.string().trim().min(1, "اكتب البريد الإلكتروني").email("بريد إلكتروني غير صحيح");
const weak = "كلمة المرور ضعيفة. يجب أن تحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص";
// نفس Password::defaults في AppServiceProvider.
const newPassword = z
  .string()
  .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
  .regex(/\p{Lu}/u, weak)
  .regex(/\p{Ll}/u, weak)
  .regex(/\p{N}/u, weak)
  .regex(/[\p{P}\p{S}]/u, weak);
const same = (d: { password: string; confirm: string }) => d.password === d.confirm;
const mismatch = { message: "كلمتا المرور غير متطابقتين", path: ["confirm"] };

const account = z.object({
  name: z.string().trim().min(2, "اكتب اسمك").max(60, "الاسم طويل جدًا"),
  phone,
  email,
  password: newPassword,
  confirm: z.string(),
});

export const schemas = {
  login: z.object({ email, password: z.string().min(1, "اكتب كلمة المرور") }),
  signup: account.refine(same, mismatch),
  demo: account.omit({ phone: true }).refine(same, mismatch),
  resetEmail: z.object({ email }),
  resetCode: z.object({
    code: z
      .string()
      .transform(latin)
      .pipe(z.string().regex(/^[0-9]{4}$/, "الرمز 4 أرقام")),
  }),
  resetPassword: z.object({ password: newPassword, confirm: z.string() }).refine(same, mismatch),
};
