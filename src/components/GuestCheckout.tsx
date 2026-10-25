import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, LoaderCircle, Store } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { bySlug, productsQuery } from "@/lib/catalog.queries";
import { gaItem, track } from "@/lib/analytics";
import { useT } from "@/lib/i18n";
import { egp } from "@/lib/prices.queries";
import { useSiteSettings } from "@/lib/settings.queries";

/**
 * إتمام الطلب في وضع الزائر: القطع والاسم والموبايل، زي ما العميل يكلّم الفرع ويقول «أنا جاي
 * آخد كذا». لا دفع ولا سعر مثبّت ولا حجز — الفرع يتصل، والبيع يتم هناك بسعر اللحظة.
 */
export function GuestCheckout() {
  const { data: catalog } = useQuery(productsQuery);
  const { items, clear } = useCart();
  const settings = useSiteSettings();
  const t = useT();
  const [form, setForm] = useState({ name: "", phone: "", branch: "", note: "" });
  const [sent, setSent] = useState<{ reference: string; estimate: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const priceOf = (slug: string) => bySlug(catalog, slug)?.price ?? 0;
  const estimate = items.reduce((s, i) => s + priceOf(i.slug) * i.qty, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^01[0125]\d{8}$/.test(form.phone.trim())) {
      toast.error(t("راجع البيانات"), {
        description: t("أدخل رقم موبايل مصري صحيح (01xxxxxxxxx)."),
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api<{ reference: string; estimate: string }>("/web-requests", {
        method: "POST",
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          branch: form.branch || null,
          note: form.note.trim() || null,
          items: items.map((i) => ({ sku: i.slug, quantity: i.qty })),
        },
      });
      setSent(res);
      track("generate_lead", {
        currency: "EGP",
        value: Number(res.estimate),
        items: items.map((i) => gaItem(i.slug, bySlug(catalog, i.slug), i.qty)),
      });
      clear();
    } catch (err) {
      toast.error(err instanceof ApiError ? t(err.firstMessage) : t("حدث خطأ، حاول مرة أخرى."));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <PageShell title="تم استلام طلبك" subtitle="شكرًا لثقتك في زاد جولد.">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gold-deep" />
          <p className="mt-4 text-xl text-primary">{t("طلبك رقم")}</p>
          <p dir="ltr" className="mt-1 font-display text-2xl text-gold-deep">
            {sent.reference}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t(
              "سيتصل بك فريقنا لتحديد موعد زيارة الفرع. السعر النهائي هو سعر لحظة الشراء في الفرع، والدفع هناك.",
            )}
          </p>
          <Link
            to="/collection"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("تصفح المجموعة")}
          </Link>
        </div>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell title="إتمام الطلب">
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-lg text-primary">{t("سلتك فارغة")}</p>
          <Link
            to="/collection"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("تصفح المجموعة")}
          </Link>
        </div>
      </PageShell>
    );
  }

  const input =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-gold";

  return (
    <PageShell
      title="إتمام الطلب"
      subtitle="اترك بياناتك وسيتصل بك فريقنا لتحديد موعد في الفرع. الدفع والاستلام في الفرع بسعر لحظة الشراء."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-6">
          <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <legend className="px-2 font-display text-base text-primary">{t("بياناتك")}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-semibold text-primary">
                  {t("الاسم بالكامل")}
                </label>
                <input
                  id="name"
                  className={input}
                  value={form.name}
                  autoComplete="name"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("مثال: أحمد محمد")}
                  minLength={2}
                  maxLength={120}
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-primary">
                  {t("رقم الموبايل")}
                </label>
                <input
                  id="phone"
                  dir="ltr"
                  className={input}
                  value={form.phone}
                  autoComplete="tel"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="branch" className="mb-1 block text-xs font-semibold text-primary">
                {t("الفرع")} ({t("اختياري")})
              </label>
              <select
                id="branch"
                className={input}
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              >
                <option value="">{t("أي فرع — نتفق على الهاتف")}</option>
                {(settings?.branches ?? []).map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="note" className="mb-1 block text-xs font-semibold text-primary">
                {t("ملاحظات")} ({t("اختياري")})
              </label>
              <textarea
                id="note"
                className={input}
                rows={3}
                maxLength={500}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder={t("مثال: أفضّل الاتصال بعد الخامسة مساءً")}
              />
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Store className="h-4 w-4" />
            )}
            {t("أرسل الطلب")}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg text-primary">{t("ملخص الطلب")}</h2>
          <ul className="mt-4 space-y-3 border-b border-border pb-4">
            {items.map((i) => (
              <li key={i.slug} className="flex justify-between gap-3 text-xs">
                <span className="text-primary">
                  {t(bySlug(catalog, i.slug)?.t ?? i.slug)}{" "}
                  <span className="text-muted-foreground">× {i.qty}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {egp(priceOf(i.slug) * i.qty)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 text-sm">
            <div className="flex justify-between font-display text-lg">
              <dt className="text-primary">{t("الإجمالي التقديري")}</dt>
              <dd className="text-gold-deep">
                {egp(estimate)} {t("ج.م")}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {t("بسعر اليوم للعرض فقط. القطع غير محجوزة، والتوافر والسعر النهائي يتأكدان في الفرع.")}
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
