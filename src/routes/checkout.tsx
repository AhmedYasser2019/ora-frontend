import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2,
  Banknote,
  CheckCircle2,
  LoaderCircle,
  Smartphone,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { shortLines, shortMessage, useCart } from "@/lib/cart";
import { bySlug, productsQuery } from "@/lib/catalog.queries";
import { orderErrorMessage, placeOrder } from "@/lib/orders";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useAuth } from "@/lib/use-auth";
import { GOVERNORATES } from "@/lib/site";
import { marketQuery } from "@/lib/market-hours";
import { useSiteSettings } from "@/lib/settings.queries";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: tr("إتمام الطلب | زاد جولد") },
      { name: "description", content: tr("أكد طلبك لشراء الذهب بسعر لحظي مثبت مع زاد جولد.") },
      { property: "og:title", content: tr("إتمام الطلب | زاد جولد") },
      { property: "og:description", content: tr("تأكيد طلب شراء الذهب بأسعار لحظية.") },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(livePricesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]),
  component: CheckoutPage,
});

const PAYMENTS = [
  { key: "instapay", label: "InstaPay", icon: Smartphone },
  { key: "bank", label: "تحويل بنكي", icon: Building2 },
  { key: "wallet", label: "رصيد المحفظة", icon: Wallet },
  { key: "cash", label: "نقدًا في الفرع", icon: Banknote },
] as const;

function CheckoutPage() {
  const { data: catalog } = useQuery(productsQuery);
  const { items, clear } = useCart();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const branches = useSiteSettings()?.branches ?? [];
  // الخادم يرفض الطلب والسوق مغلق على أي حال؛ هنا يُعرف ذلك قبل ملء النموذج. كل دقيقة،
  // فصفحة مفتوحة وقت الافتتاح لا تبقى مقفولة.
  const closed = useQuery({ ...marketQuery, refetchInterval: 60_000 }).data?.open === false;
  // والخادم يرفض الشراء قبل اعتماد الهوية؛ الحساب التجريبي لا يُسأل.
  const kycWait = user?.is_demo
    ? null
    : user?.kyc_status === "pending"
      ? "حسابك قيد المراجعة. يرجى انتظار الموافقة لإتمام عمليات الشراء."
      : user?.kyc_status === "unverified"
        ? "وثّق هويتك أولًا لإتمام عمليات الشراء."
        : null;

  // null = لم يلمسه الزائر بعد، فيُعرض ما في حسابه. تفريغ الحقل عمدًا يبقى فارغًا.
  const [form, setForm] = useState({
    name: null as string | null,
    phone: null as string | null,
    fulfilment: "delivery" as "delivery" | "pickup",
    governorate: GOVERNORATES[0] as string,
    address: "",
    branch: "",
    payment: "instapay" as (typeof PAYMENTS)[number]["key"],
  });
  const [placed, setPlaced] = useState<{ ref: string; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/checkout" } });
  }, [loading, user, navigate]);

  // لا فرع افتراضي: الاستلام اختيار صريح من الزائر، ومن لا يريده يختار التوصيل.
  const branch = form.branch;
  const name = form.name ?? user?.name ?? "";
  const phone = form.phone ?? user?.phone ?? "";

  // سعر الخادم فقط، وهو تقديري للعرض: السعر المُلزِم هو الذي يثبّته العرض عند التأكيد.
  const priceOf = (slug: string) => bySlug(catalog, slug)?.price ?? 0;
  const subtotal = items.reduce((s, i) => s + priceOf(i.slug) * i.qty, 0);
  // ponytail: التوصيل مجاني حتى يقرّر التاجر رسمًا ويصير له سطر في الدفتر — رسم لا يمرّ
  // بالقيد المزدوج رقم لا تستطيع الدفاتر تفسيره. انظر migration add_delivery_to_orders.
  const delivery = 0;
  const total = subtotal + delivery;
  // كمية تتجاوز المخزون تُوقف الطلب هنا، قبل أي خطوة — لا عند التأكيد بعد اختيار الدفع.
  const short = shortLines(items, catalog);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // نفس قاعدة الخادم: حروف بأي لغة ومسافات و . ' - فقط
    if (!/^\p{L}[\p{L}\p{M} .'-]+$/u.test(name.trim())) {
      toast.error(t("راجع الاسم"), {
        description: t("الاسم يجب أن يحتوي على حروف فقط، بدون أرقام أو رموز."),
      });
      return;
    }
    if (!/^01[0125]\d{8}$/.test(phone.trim())) {
      toast.error(t("راجع البيانات"), {
        description: t("أدخل رقم موبايل مصري صحيح (01xxxxxxxxx)."),
      });
      return;
    }
    if (form.fulfilment === "delivery" && form.address.trim().length < 10) {
      toast.error(t("أدخل عنوان التوصيل بالتفصيل"), {
        description: t("الشارع ورقم العقار والدور — 10 أحرف على الأقل."),
      });
      return;
    }
    if (form.fulfilment === "pickup" && !branch) {
      toast.error(t("اختر فرع الاستلام"), {
        description: t("اختر الفرع الذي ستستلم منه، أو اختر التوصيل."),
      });
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      // المخزون لحظة التأكيد لا لحظة فتح الصفحة — رسالة مبكرة فقط؛ الخادم يرفض السلة كاملة
      // إن نقصت قطعة بين هذا الفحص والتنفيذ.
      const fresh = await qc.fetchQuery({ ...productsQuery, staleTime: 0 });
      const gone = shortLines(items, fresh);
      if (gone.length > 0) {
        gone.forEach((l) => toast.error(shortMessage(t, l.product)));
        return;
      }

      const order = await placeOrder(items, {
        fulfilment: form.fulfilment,
        contact_name: name.trim(),
        contact_phone: phone.trim(),
        payment_method: form.payment,
        // المفاتيح غير المعنيّة تُحذف ولا تُرسل فارغة — الخادم يتحقق من وجودها لا من قيمتها.
        ...(form.fulfilment === "delivery"
          ? { governorate: form.governorate, address: form.address.trim() }
          : { branch }),
      });

      // المجموع من الخادم: ما خُصم فعلًا، لا ما عرضته الشاشة قبل تثبيت السعر.
      setPlaced({ ref: order.order_id, total: order.gross_piasters / 100 });
      clear();
    } catch (e) {
      toast.error(t(orderErrorMessage(e)));
      // لم يُنفَّذ شيء؛ المخزون الحالي يُظهر أيّ سطر يحتاج تعديل الكمية.
      qc.invalidateQueries({ queryKey: productsQuery.queryKey });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <PageShell title="إتمام الطلب">
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-gold-deep" />
        </div>
      </PageShell>
    );
  }

  if (placed) {
    return (
      <PageShell title="تم استلام طلبك" subtitle="شكرًا لثقتك في زاد جولد.">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gold-deep" />
          <p className="mt-4 text-xl text-primary">{t("طلبك رقم")}</p>
          <p dir="ltr" className="mt-1 text-xs text-muted-foreground">
            {placed.ref}
          </p>
          <p className="mt-1 font-display text-2xl text-gold-deep">
            {egp(placed.total)} {t("ج.م")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {form.payment === "wallet"
              ? t("تم خصم المبلغ من محفظتك وتأكيد الطلب. سيتواصل معك فريقنا لترتيب التسليم.")
              : t(
                  "طلبك في حالة (قيد التنفيذ). حوّل المبلغ بالطريقة التي اخترتها وسيؤكده فريقنا خلال ساعات العمل.",
                )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/orders"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              {t("تابع طلباتك")}
            </Link>
            <Link
              to="/payment-methods"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-primary"
            >
              {t("بيانات الدفع")}
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  // الخادم يرفض الشراء على أي حال؛ هنا لا تُعرض الخطوات أصلًا بدل رفض بعد ملئها.
  if (user.kyc_status === "rejected") {
    return (
      <PageShell title="إتمام الطلب">
        <div
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/5 p-12 text-center"
        >
          <p className="text-lg text-destructive">
            {t("حسابك مرفوض. لا يمكنك إتمام عملية الشراء. يرجى التواصل مع الدعم.")}
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("تواصل معنا")}
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
          <button
            onClick={() => navigate({ to: "/collection" })}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("تصفح المجموعة")}
          </button>
        </div>
      </PageShell>
    );
  }

  const input =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-gold";

  return (
    <PageShell
      title="إتمام الطلب"
      subtitle="أدخل بياناتك واختر طريقة الاستلام والدفع. يُثبَّت السعر النهائي لحظة تأكيد الطلب."
    >
      {closed && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive"
        >
          {t("السوق مغلق حاليًا. لا يمكن إتمام الطلبات.")}
        </div>
      )}
      {kycWait && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive"
        >
          {t(kycWait)}
        </div>
      )}
      {short.length > 0 && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive"
        >
          <ul className="space-y-1">
            {short.map((l) => (
              <li key={l.slug}>{shortMessage(t, l.product)}</li>
            ))}
          </ul>
          <Link to="/cart" className="mt-3 inline-block font-semibold underline underline-offset-4">
            {t("عدّل الكميات قبل إتمام الطلب")}
          </Link>
        </div>
      )}
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
                  value={name}
                  autoComplete="name"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("مثال: أحمد محمد")}
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
                  value={phone}
                  autoComplete="tel"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <legend className="px-2 font-display text-base text-primary">
              {t("طريقة الاستلام")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["delivery", "توصيل للمنزل"],
                  ["pickup", "استلام من الفرع"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm({ ...form, fulfilment: k })}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                    form.fulfilment === k
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-primary hover:bg-secondary/70"
                  }`}
                >
                  {t(label)}
                </button>
              ))}
            </div>

            {form.fulfilment === "delivery" ? (
              <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                <div>
                  <label htmlFor="gov" className="mb-1 block text-xs font-semibold text-primary">
                    {t("المحافظة")}
                  </label>
                  <select
                    id="gov"
                    className={input}
                    value={form.governorate}
                    onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                    required
                  >
                    {GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {t(g)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="addr" className="mb-1 block text-xs font-semibold text-primary">
                    {t("العنوان بالتفصيل")}
                  </label>
                  <input
                    id="addr"
                    className={input}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder={t("الشارع، رقم العقار، الدور، الشقة، علامة مميزة")}
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="branch" className="mb-1 block text-xs font-semibold text-primary">
                  {t("الفرع")}
                </label>
                <select
                  id="branch"
                  className={input}
                  value={branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    {t("اختر الفرع")}
                  </option>
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {t(b.name)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <legend className="px-2 font-display text-base text-primary">{t("طريقة الدفع")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENTS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setForm({ ...form, payment: p.key })}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    form.payment === p.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-primary hover:bg-secondary/70"
                  }`}
                >
                  <p.icon className="h-4 w-4" />
                  {t(p.label)}
                </button>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {form.payment === "wallet"
                ? t("سيُخصم المبلغ من رصيد محفظتك فورًا ويتأكد الطلب مباشرة.")
                : t("ستجد بيانات التحويل في صفحة طرق الدفع بعد تأكيد الطلب.")}
            </p>
          </fieldset>

          <button
            type="submit"
            disabled={submitting || closed || !!kycWait || short.length > 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            {t("تأكيد الطلب")} · {egp(total)} {t("ج.م")}
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
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("الإجمالي الفرعي")}</dt>
              <dd className="text-primary">
                {egp(subtotal)} {t("ج.م")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("التوصيل")}</dt>
              <dd className="text-primary">
                {delivery === 0 ? t("مجاني") : `${egp(delivery)} ${t("ج.م")}`}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg">
              <dt className="text-primary">{t("الإجمالي")}</dt>
              <dd className="text-gold-deep">
                {egp(total)} {t("ج.م")}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </PageShell>
  );
}
