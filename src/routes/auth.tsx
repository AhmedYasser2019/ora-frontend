import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  IdCard,
  Image as ImageIcon,
  LoaderCircle,
  Lock,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  TrendingUp,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { safeNext, useAuth } from "@/lib/use-auth";

const searchSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | أورا للذهب" },
      {
        name: "description",
        content: "سجّل الدخول أو أنشئ حسابك في أورا للذهب لمتابعة طلباتك وحفظ بياناتك.",
      },
      { property: "og:title", content: "تسجيل الدخول | أورا للذهب" },
      { property: "og:description", content: "حسابك في أورا للذهب والسبائك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function Field({
  id,
  label,
  icon: Icon,
  ...props
}: {
  id: string;
  label: string;
  icon: typeof Mail;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-primary">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          {...props}
          className="w-full rounded-xl border border-input bg-background py-2.5 pl-3 pr-10 text-sm outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
    </div>
  );
}

/** صندوق رفع صورة مع معاينة */
function ImageDrop({
  label,
  file,
  onPick,
}: {
  label: string;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-gold-deep">{label}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gold/60 bg-cream/40 transition-colors hover:border-gold"
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="h-6 w-6 text-gold" />
            اختر صورة
          </span>
        )}
      </button>
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
  { n: 3, title: "تأكيد الحساب (OTP)", icon: ShieldCheck },
  { n: 4, title: "خبرة الاستثمار", icon: TrendingUp },
] as const;

const EXPERIENCE = [
  "مبتدئ — أول مرة أستثمر في الذهب",
  "متوسط — عندي خبرة سنة إلى ثلاث سنوات",
  "متقدم — أتعامل في الذهب والسبائك بانتظام",
] as const;

function StepRail({ step }: { step: number }) {
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
                الخطوة {s.n}
              </p>
              <p
                className={`text-sm font-semibold ${
                  active || done ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {s.title}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [kyc, setKyc] = useState({ docType: "id", docNumber: "" });
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [otp, setOtp] = useState("");
  const [experience, setExperience] = useState<string>(EXPERIENCE[0]);

  const target = safeNext(next);
  const wizard = mode === "signup" && step > 1;

  // لو المستخدم مسجّل بالفعل ومش وسط خطوات التسجيل → نوجهه لوجهته
  useEffect(() => {
    if (!loading && user && !wizard) navigate({ to: target });
  }, [loading, user, wizard, navigate, target]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      toast.success("مرحبًا بعودتك");
      navigate({ to: target });
    } catch (err) {
      toast.error("تعذر تسجيل الدخول", {
        description: err instanceof Error ? err.message : "حاول مرة أخرى",
      });
    } finally {
      setBusy(false);
    }
  };

  const submitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("كلمة المرور يجب ألا تقل عن 6 أحرف");
      return;
    }
    if (!/^01[0-9]{9}$/.test(form.phone.trim())) {
      toast.error("رقم موبايل غير صحيح", { description: "مثال: 01012345678" });
      return;
    }
    setStep(2);
  };

  // ponytail: التوثيق و OTP بيانات محلية فقط لحد ما نربط الباك إند — التحقق كله في الواجهة
  const submitKyc = (e: React.FormEvent) => {
    e.preventDefault();
    const num = kyc.docNumber.trim();
    if (kyc.docType === "id" ? !/^[0-9]{14}$/.test(num) : num.length < 6) {
      toast.error(kyc.docType === "id" ? "الرقم القومي 14 رقمًا" : "رقم جواز غير صحيح");
      return;
    }
    if (!docFront) {
      toast.error("ارفع صورة الوجه الأمامي للهوية");
      return;
    }
    if (kyc.docType === "id" && !docBack) {
      toast.error("ارفع صورة الوجه الخلفي للهوية");
      return;
    }
    setStep(3);
  };

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(otp.trim())) {
      toast.error("الكود 6 أرقام");
      return;
    }
    setStep(4);
  };

  /** آخر خطوة: ننشئ الحساب فعليًا بالبريد وكلمة المرور، وباقي البيانات تتخزن كـ metadata */
  const finish = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const email = form.email.trim();
      const { error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            phone: form.phone.trim(),
            doc_type: kyc.docType,
            doc_number: kyc.docNumber.trim(),
            experience,
          },
          emailRedirectTo: window.location.origin + target,
        },
      });
      if (error) throw error;
      // لو تأكيد البريد مقفول في Supabase هيدخل على طول، غير كده نطلب منه التأكيد
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });
      if (signInErr) {
        toast.success("تم إنشاء حسابك", { description: "أكد بريدك الإلكتروني ثم سجّل الدخول." });
        setMode("login");
        setStep(1);
        return;
      }
      toast.success("تم إنشاء حسابك");
      navigate({ to: target });
    } catch (err) {
      toast.error("تعذر إنشاء الحساب", {
        description: err instanceof Error ? err.message : "حاول مرة أخرى",
      });
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
      {label}
    </button>
  );

  /** رجوع + التالي (+ تخطي مؤقت لحد ما نربط الباك إند) */
  const stepNav = (back: number, label: string, skipTo?: number) => (
    <>
      <div className="mt-1 flex gap-3">
        <button
          type="button"
          onClick={() => setStep(back)}
          className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-primary"
        >
          رجوع
        </button>
        <div className="grid flex-1">{submitBtn(label)}</div>
      </div>
      {skipTo !== undefined && (
        <button
          type="button"
          onClick={() => setStep(skipTo)}
          className="text-xs font-semibold text-muted-foreground underline"
        >
          تخطي هذه الخطوة (وضع التجربة)
        </button>
      )}
    </>
  );

  return (
    <PageShell
      title="حسابك في أورا"
      subtitle="سجّل الدخول أو أنشئ حسابك خطوة بخطوة لمتابعة طلباتك وحفظ بياناتك بأمان."
    >
      <div className={`mx-auto ${mode === "signup" ? "max-w-5xl" : "max-w-md"}`}>
        <div className="mb-6 grid grid-cols-2 rounded-full bg-secondary p-1 text-sm font-semibold sm:mx-auto sm:max-w-md">
          {(
            [
              ["login", "تسجيل الدخول"],
              ["signup", "حساب جديد"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setStep(1);
              }}
              className={`rounded-full py-2 transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-primary/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
            <form onSubmit={login} className="grid gap-4">
              <Field
                id="email"
                label="البريد الإلكتروني"
                icon={Mail}
                type="email"
                dir="ltr"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
              <Field
                id="password"
                label="كلمة المرور"
                icon={Lock}
                type="password"
                dir="ltr"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
              {submitBtn("دخول")}
            </form>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-xl text-primary">أنشئ حسابك الآن</h2>
              <p className="mb-6 mt-1 text-xs text-muted-foreground">
                وابدأ أول عملية شراء أو استثمار في الذهب.
              </p>
              <StepRail step={step} />
            </aside>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
              <h3 className="mb-6 border-b border-border pb-3 text-center font-display text-xl text-gold-deep">
                {STEPS[step - 1]?.title}
              </h3>

              {step === 1 && (
                <form onSubmit={submitAccount} className="grid gap-4">
                  <Field
                    id="name"
                    label="الاسم الكامل"
                    icon={User}
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="أحمد الباز"
                  />
                  <Field
                    id="phone"
                    label="رقم الموبايل"
                    icon={Phone}
                    type="tel"
                    dir="ltr"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                  />
                  <Field
                    id="email"
                    label="البريد الإلكتروني"
                    icon={Mail}
                    type="email"
                    dir="ltr"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                  <Field
                    id="password"
                    label="كلمة المرور"
                    icon={Lock}
                    type="password"
                    dir="ltr"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  {submitBtn("التالي")}
                </form>
              )}

              {step === 2 && (
                <form onSubmit={submitKyc} className="grid gap-4">
                  <p className="text-xs text-muted-foreground">
                    لتأكيد هويتك، صوّر أو ارفع أحد المستندات التالية:
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
                          onChange={() => setKyc({ ...kyc, docType: v })}
                          className="accent-gold"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <Field
                    id="docNumber"
                    label="رقم البطاقة / جواز السفر"
                    icon={BadgeCheck}
                    dir="ltr"
                    required
                    value={kyc.docNumber}
                    onChange={(e) => setKyc({ ...kyc, docNumber: e.target.value })}
                    placeholder="اكتب رقم البطاقة أو جواز السفر"
                  />
                  <p className="text-xs text-muted-foreground">
                    التعليمات تتطلب رفع صورة المستند. بياناتك تبقى آمنة وخاصة.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ImageDrop
                      label={kyc.docType === "id" ? "الوجه الأمامي للبطاقة" : "صفحة بيانات الجواز"}
                      file={docFront}
                      onPick={setDocFront}
                    />
                    {kyc.docType === "id" && (
                      <ImageDrop label="الوجه الخلفي للبطاقة" file={docBack} onPick={setDocBack} />
                    )}
                  </div>
                  {stepNav(1, "التالي", 3)}
                </form>
              )}

              {step === 3 && (
                <form onSubmit={submitOtp} className="grid gap-4">
                  <p className="text-xs text-muted-foreground">
                    اكتب كود التأكيد المرسل إلى <span dir="ltr">{form.email}</span> (أي 6 أرقام
                    أثناء التجربة).
                  </p>
                  <Field
                    id="otp"
                    label="كود التأكيد"
                    icon={ShieldCheck}
                    dir="ltr"
                    inputMode="numeric"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                  />
                  {stepNav(2, "تأكيد", 4)}
                </form>
              )}

              {step === 4 && (
                <form onSubmit={finish} className="grid gap-4">
                  <p className="text-xs text-muted-foreground">
                    اختر ما يصف خبرتك، عشان نرشّح لك المنتجات المناسبة.
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
                      {x}
                    </label>
                  ))}
                  {stepNav(3, "إنهاء التسجيل")}
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
