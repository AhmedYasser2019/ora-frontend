import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Banknote, Building2, Check, Copy, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/payment-methods")({
  head: () => ({
    meta: [
      { title: tr("طرق الدفع | أورا للذهب") },
      {
        name: "description",
        content: tr(
          "ادفع عبر InstaPay أو التحويل البنكي أو رصيد المحفظة أو نقدًا في الفرع — بدون رسوم خدمة.",
        ),
      },
      { property: "og:title", content: tr("طرق الدفع | أورا للذهب") },
      { property: "og:description", content: tr("طرق الدفع المتاحة في أورا للذهب.") },
    ],
  }),
  component: PaymentMethodsPage,
});

const IBAN = "EG380003004567890123456789012";
const ACCOUNT = "0123456789012345";

const METHODS = [
  {
    icon: Smartphone,
    name: "InstaPay",
    fee: "بدون رسوم",
    time: "فوري",
    desc: "حوّل من تطبيق بنكك مباشرة إلى عنوان الدفع الخاص بنا. أسرع وسيلة لتأكيد الطلب.",
    detail: { label: "عنوان الدفع", value: "oragold@instapay" },
  },
  {
    icon: Building2,
    name: "تحويل بنكي",
    fee: "بدون رسوم من جانبنا",
    time: "من ساعة إلى يوم عمل",
    desc: "حوّل إلى حسابنا البنكي باسم شركة أورا للذهب والسبائك، ثم أرسل صورة الإيصال لخدمة العملاء.",
    detail: { label: "IBAN", value: IBAN },
  },
  {
    icon: Wallet,
    name: "رصيد المحفظة",
    fee: "بدون رسوم",
    time: "فوري",
    desc: "اشحن محفظتك مرة واحدة واشترِ منها في أي وقت دون انتظار تحويل جديد مع كل طلب.",
    detail: { label: "الصفحة", value: "/wallet" as const },
  },
  {
    icon: Banknote,
    name: "نقدًا في الفرع",
    fee: "بدون رسوم",
    time: "فوري",
    desc: "ادفع واستلم في نفس اللحظة من أي فرع من فروعنا خلال ساعات العمل.",
    detail: { label: "الفروع", value: "/branches" as const },
  },
];

function PaymentMethodsPage() {
  const t = useT();
  const [copied, setCopied] = useState("");

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      toast.success(t("تم النسخ"));
      setTimeout(() => setCopied(""), 1500);
    } catch {
      toast.error(t("تعذر النسخ، انسخه يدويًا"));
    }
  };

  return (
    <PageShell
      title="طرق الدفع"
      subtitle="اختر الطريقة المناسبة لك وأكمل معاملتك بأمان. لا نفرض أي رسوم خدمة على أي وسيلة دفع."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {METHODS.map((m) => {
          const isLink = m.detail.value === "/wallet" || m.detail.value === "/branches";
          return (
            <article key={m.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-green text-gold">
                  <m.icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg text-primary">{t(m.name)}</h2>
                  <p className="text-[11px] text-gold-deep">
                    {t(m.fee)} · {t(m.time)}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t(m.desc)}</p>

              <div className="mt-5 rounded-xl bg-secondary/60 p-3">
                <p className="text-[11px] text-muted-foreground">{t(m.detail.label)}</p>
                {isLink ? (
                  <Link
                    to={m.detail.value as "/wallet" | "/branches"}
                    className="mt-1 inline-block text-sm font-semibold text-gold-deep hover:underline"
                  >
                    {t("افتح الصفحة")}
                  </Link>
                ) : (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <code dir="ltr" className="truncate text-xs font-semibold text-primary">
                      {m.detail.value}
                    </code>
                    <button
                      onClick={() => copy(m.detail.value)}
                      aria-label={`${t("نسخ")} ${t(m.detail.label)}`}
                      className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
                    >
                      {copied === m.detail.value ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {t("نسخ")}
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg text-primary">{t("بيانات الحساب البنكي")}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            [t("اسم المستفيد"), t("شركة أورا للذهب والسبائك")],
            [t("رقم الحساب"), ACCOUNT],
            ["IBAN", IBAN],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-secondary/60 p-3">
              <dt className="text-[11px] text-muted-foreground">{k}</dt>
              <dd dir="ltr" className="mt-1 break-all text-xs font-semibold text-primary">
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-6 flex items-start gap-2 rounded-2xl border border-gold/40 bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
        <span>
          {t(
            "حوّل فقط إلى الحساب المعلن على هذه الصفحة. لن يطلب منك أي موظف التحويل إلى حساب شخصي، ولن يطلب منك رمز التحقق OTP أو كلمة المرور. راجع",
          )}{" "}
          <Link to="/faq" className="font-semibold text-gold-deep hover:underline">
            {t("الأسئلة الشائعة")}
          </Link>{" "}
          {t("عند الشك.")}
        </span>
      </p>
    </PageShell>
  );
}
