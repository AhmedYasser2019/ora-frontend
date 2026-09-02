import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock, Instagram, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { branches } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "إتصل بنا | أورا للذهب" },
      {
        name: "description",
        content:
          "تواصل مع خدمة عملاء أورا للذهب على الرقم الموحد 17608 أو عبر البريد الإلكتروني أو نموذج التواصل.",
      },
      { property: "og:title", content: "إتصل بنا | أورا للذهب" },
      { property: "og:description", content: "خدمة عملاء أورا للذهب." },
    ],
  }),
  component: ContactPage,
});

const TOPICS = ["استفسار عن منتج", "مشكلة في طلب", "المحفظة والأرصدة", "شكوى", "أخرى"] as const;

function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    topic: TOPICS[0] as string,
    orderId: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !/^01\d{9}$/.test(form.phone.trim()) ||
      form.message.trim().length < 10
    ) {
      toast.error("راجع البيانات", {
        description: "الاسم ورقم موبايل مصري صحيح ورسالة لا تقل عن 10 أحرف.",
      });
      return;
    }
    // ponytail: النموذج لا يُرسل بعد — يحتاج جدول تذاكر أو خدمة بريد.
    setSent(true);
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
              <p className="mt-4 font-display text-xl text-primary">وصلتنا رسالتك</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                سيتواصل معك فريقنا على الرقم {form.phone} خلال ساعات العمل.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", phone: "", topic: TOPICS[0], orderId: "", message: "" });
                }}
                className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="font-display text-lg text-primary">أرسل لنا رسالة</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1 block text-xs font-semibold text-primary">
                    الاسم بالكامل
                  </label>
                  <input
                    id="c-name"
                    className={input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="مثال: أحمد محمد"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="c-phone"
                    className="mb-1 block text-xs font-semibold text-primary"
                  >
                    رقم الموبايل
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
                    موضوع الرسالة
                  </label>
                  <select
                    id="c-topic"
                    className={input}
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  >
                    {TOPICS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="c-order"
                    className="mb-1 block text-xs font-semibold text-primary"
                  >
                    رقم الطلب <span className="text-muted-foreground">(اختياري)</span>
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
                  رسالتك
                </label>
                <textarea
                  id="c-msg"
                  rows={6}
                  className={input}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="اكتب تفاصيل استفسارك…"
                  required
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
                إرسال
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg text-primary">قنوات التواصل</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-primary">الرقم الموحد</p>
                  <p dir="ltr" className="text-xs text-muted-foreground">
                    17608
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-primary">البريد الإلكتروني</p>
                  <p dir="ltr" className="text-xs text-muted-foreground">
                    support@ora-gold.com
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-primary">ساعات العمل</p>
                  <p className="text-xs text-muted-foreground">يوميًا من 10 صباحًا حتى 10 مساءً</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-primary">وسائل التواصل</p>
                  <p className="text-xs text-muted-foreground">@oragold.eg</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-primary">
              <MapPin className="h-4 w-4 text-gold-deep" /> المقر الرئيسي
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {branches[0]?.address}
            </p>
            <Link
              to="/branches"
              className="mt-3 inline-block text-xs font-semibold text-gold-deep hover:underline"
            >
              شاهد كل الفروع ({branches.length})
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
