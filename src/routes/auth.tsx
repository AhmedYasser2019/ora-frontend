import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  FlaskConical,
  IdCard,
  Image as ImageIcon,
  KeyRound,
  LoaderCircle,
  Lock,
  LogIn,
  Mail,
  Phone,
  TrendingUp,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PageShell } from "@/components/PageShell";
import { api, ApiError, setToken, upload } from "@/lib/api";
import { latin, schemas, type Errors } from "@/lib/auth-validation";
import { safeNext, useAuth } from "@/lib/use-auth";

const searchSchema = z.object({
  next: z.string().optional(),
});

import { tr, useT } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: tr("تسجيل الدخول | زاد جولد") },
      {
        name: "description",
        content: tr("سجّل الدخول أو أنشئ حسابك في زاد جولد لمتابعة طلباتك وحفظ بياناتك."),
      },
      { property: "og:title", content: tr("تسجيل الدخول | زاد جولد") },
      { property: "og:description", content: tr("حسابك في زاد جولد للذهب والسبائك.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

/** يتحقق قبل الإرسال: يرجع البيانات منظَّفة، أو يعرض أخطاء الحقول ويرجع null. */
function check<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  data: unknown,
  setErrors: (e: Errors) => void,
): T | null {
  const r = schema.safeParse(data);
  setErrors(r.success ? {} : (r.error.flatten().fieldErrors as Errors));
  return r.success ? r.data : null;
}

/** أخطاء الخادم على حقول الشاشة. الاسم حقل واحد هنا وحقلان هناك. */
function fromServer(err: unknown): Errors {
  if (!(err instanceof ApiError)) return {};
  const { first_name, last_name, ...rest } = err.errors;
  const name = first_name ?? last_name;
  return name ? { ...rest, name } : rest;
}

/** الباك إند يطلب اسمًا أخيرًا؛ اسم من كلمة واحدة يكرّرها بدل أن يُرفض التسجيل. */
function nameParts(name: string) {
  const [first = "", ...rest] = name.split(/\s+/);
  return { first_name: first, last_name: rest.join(" ") || first };
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  ...props
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  error?: string[] | undefined;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const t = useT();

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-primary">
        {t(label)}
      </label>
      <div className="relative">
        <Icon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
          className={`w-full rounded-xl border bg-background py-2.5 pe-3 ps-10 text-sm outline-none transition-colors focus:ring-1 ${
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive"
              : "border-input focus:border-gold focus:ring-gold"
          }`}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          {t(error[0] ?? "")}
        </p>
      )}
    </div>
  );
}

/** صندوق رفع صورة مع معاينة */
function ImageDrop({
  label,
  file,
  onPick,
  error,
}: {
  label: string;
  file: File | null;
  onPick: (f: File | null) => void;
  error?: string[] | undefined;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-gold-deep">{t(label)}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-cream/40 transition-colors ${
          error ? "border-destructive" : "border-gold/60 hover:border-gold"
        }`}
      >
        {preview ? (
          <img src={preview} alt={t(label)} className="h-full w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="h-6 w-6 text-gold" />
            {t("اختر صورة")}
          </span>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{t(error[0] ?? "")}</p>}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

const STEPS = [
  { n: 1, title: "بيانات الحساب", icon: User },
  { n: 2, title: "توثيق الهوية", icon: IdCard },
  { n: 3, title: "خبرة الاستثمار", icon: TrendingUp },
] as const;

const EXPERIENCE = [
  "مبتدئ — أول مرة أستثمر في الذهب",
  "متوسط — عندي خبرة سنة إلى ثلاث سنوات",
  "متقدم — أتعامل في الذهب والسبائك بانتظام",
] as const;

function StepRail({ step }: { step: number }) {
  const t = useT();

  return (
    <ol className="grid gap-5">
      {STEPS.map((s) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <li key={s.n} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                done
                  ? "border-gold bg-gold text-primary"
                  : active
                    ? "border-gold text-gold"
                    : "border-border text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : s.n}
            </span>
            <div>
              <p className={`text-xs ${active ? "text-gold" : "text-muted-foreground"}`}>
                {t("الخطوة")} {s.n}
              </p>
              <p
                className={`text-sm font-semibold ${
                  active || done ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t(s.title)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * نسيت كلمة المرور: رقم الموبايل ← الرمز ← كلمة مرور جديدة. ولحد ما بوابة SMS تتظبط الرمز
 * في لوج الخادم فقط.
 */
function ForgotPassword({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [step, setStep] = useState<"phone" | "code" | "password">("phone");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [phoneNo, setPhoneNo] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const edit =
    (set: (v: string) => void, key: keyof Errors) => (e: React.ChangeEvent<HTMLInputElement>) => {
      set(e.target.value);
      setErrors((x) => ({ ...x, [key]: undefined }));
    };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setErrors(fromServer(err));
      if (err instanceof ApiError && err.errors["reset_token"]) setStep("phone");
      toast.error(err instanceof ApiError ? err.firstMessage : t("حاول مرة أخرى"));
    } finally {
      setBusy(false);
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const v = check(schemas.resetPhone, { phone: phoneNo }, setErrors);
    if (!v) return;
    setPhoneNo(v.phone);
    run(async () => {
      // `code` بيرجع من الخادم في وضع debug بس — للتجربة.
      const res = await api<{ code?: string }>("/auth/otp", {
        method: "POST",
        body: { phone: v.phone },
      });
      setCode(res.code ?? "");
      setStep("code");
      toast.success(t("لو الرقم مسجَّل هيوصلك رمز التحقق"));
    });
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    const v = check(schemas.resetCode, { code }, setErrors);
    if (!v) return;
    run(async () => {
      const { reset_token } = await api<{ reset_token: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: phoneNo, code: v.code },
      });
      setResetToken(reset_token);
      setStep("password");
    });
  };

  const reset = (e: React.FormEvent) => {
    e.preventDefault();
    const v = check(schemas.resetPassword, { password, confirm }, setErrors);
    if (!v) return;
    run(async () => {
      await api("/auth/password", {
        method: "POST",
        body: {
          phone: phoneNo,
          reset_token: resetToken,
          password: v.password,
          password_confirmation: v.confirm,
        },
      });
      toast.success(t("تم تغيير كلمة المرور"), {
        description: t("سجّل الدخول بكلمة المرور الجديدة."),
      });
      onDone();
    });
  };

  const submitBtn = (label: string) => (
    <button
      type="submit"
      disabled={busy}
      className="mt-1 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {t(label)}
    </button>
  );

  return (
    <div className="grid gap-4">
      <h3 className="border-b border-border pb-3 text-center font-display text-xl text-gold-deep">
        {t("نسيت كلمة المرور")}
      </h3>

      {step === "phone" && (
        <form onSubmit={send} noValidate className="grid gap-4">
          <p className="text-xs text-muted-foreground">
            {t("اكتب رقم الموبايل المسجَّل في حسابك وهنبعتلك رمز تحقق.")}
          </p>
          <Field
            id="reset-phone"
            label="رقم الموبايل"
            icon={Phone}
            type="tel"
            dir="ltr"
            required
            autoComplete="tel"
            value={phoneNo}
            onChange={edit(setPhoneNo, "phone")}
            error={errors.phone}
            placeholder="01xxxxxxxxx"
          />
          {submitBtn("إرسال الرمز")}
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verify} noValidate className="grid gap-4">
          <Field
            id="reset-code"
            label="رمز التحقق"
            icon={KeyRound}
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            required
            value={code}
            onChange={edit(setCode, "code")}
            error={errors.code}
            placeholder="••••"
          />
          {submitBtn("تأكيد")}
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="text-xs font-semibold text-muted-foreground underline"
          >
            {t("إعادة إرسال الرمز")}
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={reset} noValidate className="grid gap-4">
          <Field
            id="reset-password"
            label="كلمة المرور الجديدة"
            icon={Lock}
            type="password"
            dir="ltr"
            required
            autoComplete="new-password"
            value={password}
            onChange={edit(setPassword, "password")}
            error={errors.password}
            placeholder="••••••••"
          />
          <Field
            id="reset-confirm"
            label="تأكيد كلمة المرور"
            icon={Lock}
            type="password"
            dir="ltr"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={edit(setConfirm, "confirm")}
            error={errors.confirm}
            placeholder="••••••••"
          />
          <p className="text-xs text-muted-foreground">{t("هيتم تسجيل خروجك من كل الأجهزة.")}</p>
          {submitBtn("حفظ كلمة المرور")}
        </form>
      )}

      <button
        type="button"
        onClick={onDone}
        className="text-xs font-semibold text-muted-foreground underline"
      >
        {t("رجوع لتسجيل الدخول")}
      </button>
    </div>
  );
}

type Mode = "login" | "signup" | "demo" | "forgot";

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const t = useT();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const [kyc, setKyc] = useState({ docType: "id", docNumber: "" });
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [experience, setExperience] = useState<string>(EXPERIENCE[0]);

  const target = safeNext(next);
  const wizard = mode === "signup" && step > 1;

  // لو المستخدم مسجّل بالفعل ومش وسط خطوات التسجيل → نوجهه لوجهته
  useEffect(() => {
    if (!loading && user && !wizard) navigate({ to: target });
  }, [loading, user, wizard, navigate, target]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep(1);
    setErrors({});
  };

  /** الكتابة في حقل تمسح خطأه — الرسالة تخص القيمة القديمة. */
  const clear = (key: keyof Errors) => setErrors((x) => ({ ...x, [key]: undefined }));
  const edit = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [key]: e.target.value });
    clear(key);
  };

  const fail = (err: unknown, title: string) => {
    setErrors(fromServer(err));
    toast.error(t(title), {
      description: err instanceof ApiError ? err.firstMessage : t("حاول مرة أخرى"),
    });
  };

  const login = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const v = check(schemas.login, form, setErrors);
    if (!v) return;
    setBusy(true);
    try {
      const res = await api<{ token: string }>("/auth/token", {
        method: "POST",
        // الباك إند يقبل بريدًا أو هاتفًا؛ الموقع يجمع بريدًا والتطبيق يجمع هاتفًا.
        body: { email: v.email, password: v.password, device_name: "web" },
      });

      setToken(res.token);
      toast.success(t("مرحبًا بعودتك"));
      navigate({ to: target });
    } catch (err) {
      fail(err, "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  /**
   * حساب ديمو مستقل: فلوس تجريبية بلا موبايل ولا توثيق. غير «جرّب وضع الديمو» في صفحة
   * الحساب، الذي يفتح ديمو مربوطًا بحساب حقيقي قائم.
   */
  const registerDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = check(schemas.demo, form, setErrors);
    if (!v) return;
    setBusy(true);
    try {
      const { token } = await api<{ token: string }>("/auth/register/demo", {
        method: "POST",
        body: {
          ...nameParts(v.name),
          email: v.email,
          password: v.password,
          password_confirmation: v.confirm,
          device_name: "web",
        },
      });

      setToken(token);
      toast.success(t("تم إنشاء حساب الديمو"), {
        description: t("اشحن رصيد تجريبي من صفحة حسابك وابدأ."),
      });
      navigate({ to: target });
    } catch (err) {
      fail(err, "تعذر إنشاء الحساب");
    } finally {
      setBusy(false);
    }
  };

  const submitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (check(schemas.signup, form, setErrors)) setStep(2);
  };

  // ponytail: صور الهوية تُرفع فعلًا إلى /kyc/documents عند إنهاء التسجيل، لكن رقم الوثيقة
  // ونوعها لا يوجد لهما حقل في الباك إند بعد، فيبقيان تحققًا في الواجهة فقط.
  const submitKyc = (e: React.FormEvent) => {
    e.preventDefault();
    const num = latin(kyc.docNumber);
    const errs: Errors = {};
    if (kyc.docType === "id" ? !/^[23][0-9]{13}$/.test(num) : !/^[A-Z0-9]{6,12}$/i.test(num)) {
      errs.docNumber = [kyc.docType === "id" ? "الرقم القومي 14 رقمًا" : "رقم جواز غير صحيح"];
    }
    if (!docFront) errs.docFront = ["ارفع صورة الوجه الأمامي للهوية"];
    if (kyc.docType === "id" && !docBack) errs.docBack = ["ارفع صورة الوجه الخلفي للهوية"];
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(3);
  };

  /**
   * آخر خطوة: إنشاء الحساب فعليًا، ثم رفع وثائق الهوية.
   *
   * الحساب يُنشأ أولًا لأن الرفع يحتاج رمز الجلسة الذي يعيده التسجيل. فشل رفع صورة بعد
   * إنشاء الحساب لا يُلغي الحساب — المستخدم مسجَّل، ويعيد الرفع من شاشة حسابه.
   */
  const finish = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = check(schemas.signup, form, setErrors);
    if (!v) return setStep(1);
    setBusy(true);
    try {
      const { token } = await api<{ token: string }>("/auth/register", {
        method: "POST",
        body: {
          ...nameParts(v.name),
          phone: v.phone,
          email: v.email,
          password: v.password,
          password_confirmation: v.confirm,
          accepted_terms: true,
          device_name: "web",
        },
      });

      setToken(token);

      const sides: [File | null, string][] = [
        [docFront, "national_id_front"],
        [docBack, "national_id_back"],
      ];

      for (const [file, type] of sides) {
        if (!file) continue;
        const body = new FormData();
        body.append("type", type);
        body.append("file", file);
        try {
          await upload("/kyc/documents", body);
        } catch {
          toast.warning(t("تم إنشاء حسابك، لكن تعذر رفع صورة الهوية"), {
            description: t("أعد المحاولة من صفحة حسابك."),
          });
        }
      }

      toast.success(t("تم إنشاء حسابك"));
      navigate({ to: target });
    } catch (err) {
      fail(err, "تعذر إنشاء الحساب");
      // بريد أو موبايل مستعمل مثلًا: الحقل في الخطوة الأولى، فنرجع له.
      const errs = fromServer(err);
      if (errs.name || errs.phone || errs.email || errs.password) setStep(1);
    } finally {
      setBusy(false);
    }
  };

  const submitBtn = (label: string) => (
    <button
      type="submit"
      disabled={busy}
      className="mt-1 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
      {t(label)}
    </button>
  );

  /** رجوع + التالي (+ تخطي: التوثيق يكمل بعدين من صفحة الحساب) */
  const stepNav = (back: number, label: string, skipTo?: number) => (
    <>
      <div className="mt-1 flex gap-3">
        <button
          type="button"
          onClick={() => {
            setStep(back);
            setErrors({});
          }}
          className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-primary"
        >
          {t("رجوع")}
        </button>
        <div className="grid flex-1">{submitBtn(label)}</div>
      </div>
      {skipTo !== undefined && (
        <button
          type="button"
          onClick={() => {
            setStep(skipTo);
            setErrors({});
          }}
          className="text-xs font-semibold text-muted-foreground underline"
        >
          {t("تخطي الآن وأكمل التوثيق من حسابي")}
        </button>
      )}
    </>
  );

  /** بيانات الحساب: خطوة التسجيل الأولى، وحساب الديمو نفسه بلا موبايل. */
  const accountFields = (withPhone: boolean) => (
    <>
      <Field
        id="name"
        label="الاسم الكامل"
        icon={User}
        required
        autoComplete="name"
        value={form.name}
        onChange={edit("name")}
        error={errors.name}
        placeholder={t("أحمد الباز")}
      />
      {withPhone && (
        <Field
          id="phone"
          label="رقم الموبايل"
          icon={Phone}
          type="tel"
          dir="ltr"
          required
          autoComplete="tel"
          value={form.phone}
          onChange={edit("phone")}
          error={errors.phone}
          placeholder="01xxxxxxxxx"
        />
      )}
      <Field
        id="email"
        label="البريد الإلكتروني"
        icon={Mail}
        type="email"
        dir="ltr"
        required
        autoComplete="email"
        value={form.email}
        onChange={edit("email")}
        error={errors.email}
        placeholder="you@example.com"
      />
      <Field
        id="password"
        label="كلمة المرور"
        icon={Lock}
        type="password"
        dir="ltr"
        required
        autoComplete="new-password"
        value={form.password}
        onChange={edit("password")}
        error={errors.password}
        placeholder="••••••••"
      />
      <Field
        id="confirm"
        label="تأكيد كلمة المرور"
        icon={Lock}
        type="password"
        dir="ltr"
        required
        autoComplete="new-password"
        value={form.confirm}
        onChange={edit("confirm")}
        error={errors.confirm}
        placeholder="••••••••"
      />
    </>
  );

  return (
    <PageShell
      title="حسابك في زاد جولد"
      subtitle="سجّل الدخول أو أنشئ حسابك خطوة بخطوة لمتابعة طلباتك وحفظ بياناتك بأمان."
    >
      <div className={`mx-auto ${mode === "signup" ? "max-w-5xl" : "max-w-md"}`}>
        <div className="mb-6 grid grid-cols-3 rounded-full bg-secondary p-1 text-sm font-semibold sm:mx-auto sm:max-w-md">
          {(
            [
              ["login", "تسجيل الدخول"],
              ["signup", "حساب جديد"],
              ["demo", "حساب ديمو"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-full py-2 transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-primary/70"
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
            <form onSubmit={login} noValidate className="grid gap-4">
              <Field
                id="email"
                label="البريد الإلكتروني"
                icon={Mail}
                type="email"
                dir="ltr"
                required
                autoComplete="email"
                value={form.email}
                onChange={edit("email")}
                error={errors.email}
                placeholder="you@example.com"
              />
              <Field
                id="password"
                label="كلمة المرور"
                icon={Lock}
                type="password"
                dir="ltr"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={edit("password")}
                error={errors.password}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="-mt-2 justify-self-end text-xs font-semibold text-primary underline"
              >
                {t("نسيت كلمة المرور؟")}
              </button>
              {submitBtn("دخول")}
            </form>
          </div>
        ) : mode === "forgot" ? (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
            <ForgotPassword onDone={() => switchMode("login")} />
          </div>
        ) : mode === "demo" ? (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
            <form onSubmit={registerDemo} noValidate className="grid gap-4">
              <p className="flex items-start gap-2 rounded-2xl bg-cream/50 p-3 text-xs text-primary">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {t(
                  "حساب بفلوس تجريبية: جرّب الشراء والبيع بأسعار السوق الحقيقية من غير ما تدفع حاجة. مش محتاج رقم موبايل ولا توثيق هوية.",
                )}
              </p>
              {accountFields(false)}
              {submitBtn("إنشاء حساب ديمو")}
            </form>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-xl text-primary">{t("أنشئ حسابك الآن")}</h2>
              <p className="mb-6 mt-1 text-xs text-muted-foreground">
                {t("وابدأ أول عملية شراء أو استثمار في الذهب.")}
              </p>
              <StepRail step={step} />
            </aside>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
              <h3 className="mb-6 border-b border-border pb-3 text-center font-display text-xl text-gold-deep">
                {t(STEPS[step - 1]?.title ?? "")}
              </h3>

              {step === 1 && (
                <form onSubmit={submitAccount} noValidate className="grid gap-4">
                  {accountFields(true)}
                  {submitBtn("التالي")}
                </form>
              )}

              {step === 2 && (
                <form onSubmit={submitKyc} noValidate className="grid gap-4">
                  <p className="text-xs text-muted-foreground">
                    {t("لتأكيد هويتك، صوّر أو ارفع أحد المستندات التالية:")}
                  </p>
                  <div className="flex flex-wrap gap-6 text-sm text-primary">
                    {(
                      [
                        ["id", "بطاقة الرقم القومي"],
                        ["passport", "جواز السفر"],
                      ] as const
                    ).map(([v, label]) => (
                      <label key={v} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="docType"
                          value={v}
                          checked={kyc.docType === v}
                          onChange={() => {
                            setKyc({ ...kyc, docType: v });
                            setErrors({});
                          }}
                          className="accent-gold"
                        />
                        {t(label)}
                      </label>
                    ))}
                  </div>
                  <Field
                    id="docNumber"
                    label="رقم البطاقة / جواز السفر"
                    icon={BadgeCheck}
                    dir="ltr"
                    required
                    inputMode={kyc.docType === "id" ? "numeric" : "text"}
                    value={kyc.docNumber}
                    onChange={(e) => {
                      setKyc({ ...kyc, docNumber: e.target.value });
                      clear("docNumber");
                    }}
                    error={errors.docNumber}
                    placeholder={t("اكتب رقم البطاقة أو جواز السفر")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("التعليمات تتطلب رفع صورة المستند. بياناتك تبقى آمنة وخاصة.")}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ImageDrop
                      label={kyc.docType === "id" ? "الوجه الأمامي للبطاقة" : "صفحة بيانات الجواز"}
                      file={docFront}
                      onPick={(f) => {
                        setDocFront(f);
                        clear("docFront");
                      }}
                      error={errors.docFront}
                    />
                    {kyc.docType === "id" && (
                      <ImageDrop
                        label="الوجه الخلفي للبطاقة"
                        file={docBack}
                        onPick={(f) => {
                          setDocBack(f);
                          clear("docBack");
                        }}
                        error={errors.docBack}
                      />
                    )}
                  </div>
                  {stepNav(1, "التالي", 3)}
                </form>
              )}

              {step === 3 && (
                <form onSubmit={finish} className="grid gap-4">
                  <p className="text-xs text-muted-foreground">
                    {t("اختر ما يصف خبرتك، عشان نرشّح لك المنتجات المناسبة.")}
                  </p>
                  {EXPERIENCE.map((x) => (
                    <label
                      key={x}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm transition-colors ${
                        experience === x ? "border-gold bg-cream/50 text-primary" : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="experience"
                        checked={experience === x}
                        onChange={() => setExperience(x)}
                        className="accent-gold"
                      />
                      {t(x)}
                    </label>
                  ))}
                  {stepNav(2, "إنهاء التسجيل")}
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
