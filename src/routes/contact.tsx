import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock, Instagram, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { branches } from "@/lib/site";
import { api, ApiError } from "@/lib/api";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: tr("إتصل بنا | أورا للذهب") },
      {
        name: "description",
        content: tr(
          "تواصل مع خدمة عملاء أورا للذهب على الرقم الموحد 17608 أو عبر البريد الإلكتروني أو نموذج التواصل.",
        ),
      },
      { property: "og:title", content: tr("إتصل بنا | أورا للذهب") },
      { property: "og:description", content: tr("خدمة عملاء أورا للذهب.") },
    ],
  }),
  component: ContactPage,
});

/**
 * الموضوعات كما يقبلها الخادم — انظر TicketTopic في الباك إند. المفتاح هو ما يُرسل،
 * والقيمة هي ما يقرأه الزائر، فتغيير الصياغة لا يكسر التحقق على الخادم.
 */
const TOPICS = {
  product: "استفسار عن منتج",
  order: "مشكلة في طلب",
  wallet: "المحفظة والأرصدة",
  complaint: "شكوى",
  other: "أخرى",
} as const;

type Topic = keyof typeof TOPICS;

function ContactPage() {
  const t = useT();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    topic: "product" as Topic,
    orderId: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  /**
   * `POST /tickets` مفتوح بلا تسجيل دخول — من لا يستطيع الوصول لحسابه هو أكثر من يحتاج
   * النموذج. والخادم يعيد التحقق من كل حقل، والتحقق هنا فقط ليوفّر على الزائر رحلة للشبكة.
   */
  const send = useMutation({
    mutationFn: (body: {
      name: string;
      phone: string;
      topic: Topic;
      order_ref?: string;
      message: string;
    }) => api<{ received: boolean }>("/tickets", { method: "POST", body }),
    onSuccess: () => setSent(true),
    onError: (e) =>
      toast.error(t("تعذّر إرسال الرسالة"), {
        description: e instanceof ApiError ? e.firstMessage : t("راجع اتصالك وحاول مرة أخرى."),
      }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !/^01\d{9}$/.test(form.phone.trim()) ||
      form.message.trim().length < 10
    ) {
      toast.error(t("راجع البيانات"), {
        description: t("الاسم ورقم موبايل مصري صحيح ورسالة لا تقل عن 10 أحرف."),
      });
      return;
    }

    send.mutate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      topic: form.topic,
      // حقل اختياري: نرسله فقط حين يكتبه الزائر بدل سلسلة فارغة.
      ...(form.orderId.trim() ? { order_ref: form.orderId.trim() } : {}),
      message: form.message.trim(),
    });
  };

  const input =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-gold";

  return (
    <PageShell
      title="إتصل بنا"
      subtitle="فريق خدمة العملاء متاح يوميًا خلال ساعات العمل. متوسط زمن الرد أقل من ساعتين."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-border bg-card p-6">
          {sent ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-gold-deep" />
              <p className="mt-4 font-display text-xl text-primary">{t("وصلتنا رسالتك")}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("سيتواصل معك فريقنا على الرقم")} {form.phone} {t("خلال ساعات العمل.")}
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", phone: "", topic: "product", orderId: "", message: "" });
                }}
                className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                {t("إرسال رسالة أخرى")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="font-display text-lg text-primary">{t("أرسل لنا رسالة")}</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1 block text-xs font-semibold text-primary">
                    {t("الاسم بالكامل")}
                  </label>
                  <input
                    id="c-name"
                    className={input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t("مثال: أحمد محمد")}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="c-phone"
                    className="mb-1 block text-xs font-semibold text-primary"
                  >
                    {t("رقم الموبايل")}
                  </label>
                  <input
                    id="c-phone"
                    dir="ltr"
                    inputMode="numeric"
                    className={input}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="c-topic"
                    className="mb-1 block text-xs font-semibold text-primary"
                  >
                    {t("موضوع الرسالة")}
                  </label>
                  <select
                    id="c-topic"
                    className={input}
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value as Topic })}
                  >
                    {Object.entries(TOPICS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {t(label)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="c-order"
                    className="mb-1 block text-xs font-semibold text-primary"
                  >
                    {t("رقم الطلب")} <span className="text-muted-foreground">({t("اختياري")})</span>
                  </label>
                  <input
                    id="c-order"
                    dir="ltr"
                    className={input}
                    value={form.orderId}
                    onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                    placeholder="ORA-XXXXXX"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="c-msg" className="mb-1 block text-xs font-semibold text-primary">
                  {t("رسالتك")}
                </label>
                <textarea
                  id="c-msg"
                  rows={6}
                  className={input}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={t("اكتب تفاصيل استفسارك…")}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={send.isPending}
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {t(send.isPending ? "جارٍ الإرسال…" : "إرسال")}
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg text-primary">{t("قنوات التواصل")}</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-primary">{t("الرقم الموحد")}</p>
                  <p dir="ltr" className="text-xs text-muted-foreground">
                    17608
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-primary">{t("البريد الإلكتروني")}</p>
                  <p dir="ltr" className="text-xs text-muted-foreground">
                    support@ora-gold.com
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-primary">{t("ساعات العمل")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("يوميًا من 10 صباحًا حتى 10 مساءً")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-primary">{t("وسائل التواصل")}</p>
                  <p className="text-xs text-muted-foreground">@oragold.eg</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-primary">
              <MapPin className="h-4 w-4 text-gold-deep" /> {t("المقر الرئيسي")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t(branches[0]?.address ?? "")}
            </p>
            <Link
              to="/branches"
              className="mt-3 inline-block text-xs font-semibold text-gold-deep hover:underline"
            >
              {t("شاهد كل الفروع")} ({branches.length})
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
