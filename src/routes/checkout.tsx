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

import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useAuth } from "@/lib/use-auth";
import { useLivePrices } from "@/lib/use-live-prices";
import { GOVERNORATES, branches, buyPrice, productBySlug } from "@/lib/site";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "إتمام الطلب | أورا للذهب" },
      { name: "description", content: "أكد طلبك لشراء الذهب بسعر لحظي مثبت مع أورا." },
      { property: "og:title", content: "إتمام الطلب | أورا للذهب" },
      { property: "og:description", content: "تأكيد طلب شراء الذهب بأسعار لحظية." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: CheckoutPage,
});

const PAYMENTS = [
  { key: "instapay", label: "InstaPay", icon: Smartphone },
  { key: "bank", label: "تحويل بنكي", icon: Building2 },
  { key: "wallet", label: "رصيد المحفظة", icon: Wallet },
  { key: "cash", label: "نقدًا في الفرع", icon: Banknote },
] as const;

/** رسائل أخطاء place_order كما ترفعها قاعدة البيانات. */
const RPC_ERRORS: Record<string, string> = {
  ORD01: "سلتك فاضية",
  ORD02: "أدخل عنوان التوصيل",
  ORD03: "قيمة الطلب غير صحيحة",
  WLT01: "رصيد محفظتك لا يكفي لإتمام الطلب",
};

function CheckoutPage() {
  const { data } = useLivePrices();
  const { items, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    fulfilment: "delivery" as "delivery" | "pickup",
    governorate: GOVERNORATES[0] as string,
    address: "",
    branch: branches[0]!.name,
    payment: "instapay" as (typeof PAYMENTS)[number]["key"],
  });
  const [placed, setPlaced] = useState<{ ref: string; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/checkout" } });
  }, [loading, user, navigate]);

  const priceOf = (slug: string, fallback: number) => {
    const p = productBySlug(slug);
    return (p && buyPrice(p, data?.gram)) ?? fallback;
  };
  const subtotal = items.reduce((s, i) => s + priceOf(i.slug, i.lastPrice) * i.qty, 0);
  // نفس قاعدة delivery_fee_for في قاعدة البيانات — السيرفر هو المرجع النهائي.
  const delivery = form.fulfilment === "pickup" || subtotal >= 50_000 ? 0 : 150;
  const total = subtotal + delivery;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !/^01\d{9}$/.test(form.phone.trim())) {
      toast.error("راجع البيانات", {
        description: "أدخل الاسم ورقم موبايل مصري صحيح (01xxxxxxxxx).",
      });
      return;
    }
    if (form.fulfilment === "delivery" && form.address.trim().length < 10) {
      toast.error("أدخل عنوان التوصيل بالتفصيل");
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    const { data: order, error } = await supabase.rpc("place_order", {
      p_full_name: form.name.trim(),
      p_phone: form.phone.trim(),
      p_fulfilment: form.fulfilment,
      p_payment_method: form.payment,
      p_governorate: form.fulfilment === "delivery" ? form.governorate : null,
      p_address: form.fulfilment === "delivery" ? form.address.trim() : null,
      p_branch: form.fulfilment === "pickup" ? form.branch : null,
      p_items: items.map((i) => {
        const p = productBySlug(i.slug);
        return {
          slug: i.slug,
          title: i.title,
          qty: i.qty,
          unit_price: Number(priceOf(i.slug, i.lastPrice).toFixed(2)),
          weight_g: p?.weightG ?? 0,
        };
      }),
    });
    setSubmitting(false);

    if (error || !order) {
      toast.error(RPC_ERRORS[error?.code ?? ""] ?? "تعذر إتمام الطلب");
      return;
    }
    setPlaced({ ref: order.ref, total: Number(order.total) });
    clear();
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
      <PageShell title="تم استلام طلبك" subtitle="شكرًا لثقتك في أورا.">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gold-deep" />
          <p className="mt-4 text-xl text-primary">طلبك رقم {placed.ref}</p>
          <p className="mt-1 font-display text-2xl text-gold-deep">{egp(placed.total)} ج.م</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {form.payment === "wallet"
              ? "تم خصم المبلغ من محفظتك وتأكيد الطلب. سيتواصل معك فريقنا لترتيب التسليم."
              : "طلبك في حالة (قيد التنفيذ). حوّل المبلغ بالطريقة التي اخترتها وسيؤكده فريقنا خلال ساعات العمل."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/orders"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              تابع طلباتك
            </Link>
            <Link
              to="/payment-methods"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-primary"
            >
              بيانات الدفع
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell title="إتمام الطلب">
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-lg text-primary">سلتك فاضية</p>
          <button
            onClick={() => navigate({ to: "/collection" })}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            تصفح المجموعة
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
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-6">
          <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <legend className="px-2 font-display text-base text-primary">بياناتك</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-semibold text-primary">
                  الاسم بالكامل
                </label>
                <input
                  id="name"
                  className={input}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: أحمد محمد"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-primary">
                  رقم الموبايل
                </label>
                <input
                  id="phone"
                  dir="ltr"
                  className={input}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <legend className="px-2 font-display text-base text-primary">طريقة الاستلام</legend>
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
                  {label}
                </button>
              ))}
            </div>

            {form.fulfilment === "delivery" ? (
              <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                <div>
                  <label htmlFor="gov" className="mb-1 block text-xs font-semibold text-primary">
                    المحافظة
                  </label>
                  <select
                    id="gov"
                    className={input}
                    value={form.governorate}
                    onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                  >
                    {GOVERNORATES.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="addr" className="mb-1 block text-xs font-semibold text-primary">
                    العنوان بالتفصيل
                  </label>
                  <input
                    id="addr"
                    className={input}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="الشارع، رقم العقار، الدور، الشقة، علامة مميزة"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="branch" className="mb-1 block text-xs font-semibold text-primary">
                  الفرع
                </label>
                <select
                  id="branch"
                  className={input}
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                >
                  {branches.map((b) => (
                    <option key={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <legend className="px-2 font-display text-base text-primary">طريقة الدفع</legend>
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
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {form.payment === "wallet"
                ? "سيُخصم المبلغ من رصيد محفظتك فورًا ويتأكد الطلب مباشرة."
                : "ستجد بيانات التحويل في صفحة طرق الدفع بعد تأكيد الطلب."}
            </p>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            تأكيد الطلب · {egp(total)} ج.م
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg text-primary">ملخص الطلب</h2>
          <ul className="mt-4 space-y-3 border-b border-border pb-4">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 text-xs">
                <span className="text-primary">
                  {i.title} <span className="text-muted-foreground">× {i.qty}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {egp(priceOf(i.slug, i.lastPrice) * i.qty)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">الإجمالي الفرعي</dt>
              <dd className="text-primary">{egp(subtotal)} ج.م</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">التوصيل</dt>
              <dd className="text-primary">{delivery === 0 ? "مجاني" : `${egp(delivery)} ج.م`}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg">
              <dt className="text-primary">الإجمالي</dt>
              <dd className="text-gold-deep">{egp(total)} ج.م</dd>
            </div>
          </dl>
        </aside>
      </div>
    </PageShell>
  );
}
