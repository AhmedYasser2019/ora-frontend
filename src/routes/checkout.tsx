import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { DELIVERY_FEE, FREE_DELIVERY_OVER, useCart } from "@/lib/cart";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";
import { branches } from "@/lib/site";

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

function CheckoutPage() {
  const { data } = useLivePrices();
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", city: "القاهرة", branch: branches[0]!.name });
  const [orderId, setOrderId] = useState<string | null>(null);

  const priceOf = (key: string, fallback: number) => data?.items[key] ?? fallback;
  const subtotal = items.reduce((s, i) => s + priceOf(i.key, i.lastPrice) * i.qty, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^01\d{9}$/.test(form.phone.trim())) {
      toast.error("راجع البيانات", { description: "أدخل الاسم ورقم موبايل مصري صحيح (01xxxxxxxxx)." });
      return;
    }
    if (items.length === 0) return;
    const id = `ORA-${Date.now().toString(36).toUpperCase()}`;
    setOrderId(id);
    clear();
  };

  if (orderId) {
    return (
      <PageShell title="تم استلام طلبك" subtitle="شكرًا لثقتك في أورا.">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gold-deep" />
          <p className="mt-4 text-xl text-primary">طلبك رقم {orderId}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            سيتصل بك فريقنا خلال ساعات العمل لتأكيد السعر النهائي وتفاصيل الاستلام أو التوصيل
            المؤمّن.
          </p>
          <Link
            to="/collection"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            متابعة التسوق
          </Link>
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
      subtitle="أدخل بياناتك وسيثبّت فريقنا سعر الذهب اللحظي لحظة تأكيد الطلب هاتفيًا."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="mb-1 block text-xs font-semibold text-primary">
                المحافظة
              </label>
              <select
                id="city"
                className={input}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                {["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "أخرى"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="branch" className="mb-1 block text-xs font-semibold text-primary">
                فرع الاستلام (اختياري)
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
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            تأكيد الطلب — {egp(total)} ج.م
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-cream p-6">
          <h2 className="font-display text-xl text-primary">طلبك</h2>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <img
                  src={i.img}
                  alt={i.title}
                  width={100}
                  height={100}
                  className="h-12 w-12 rounded-lg bg-background object-cover"
                />
                <div className="flex-1">
                  <p className="text-primary">{i.title}</p>
                  <p className="text-xs text-muted-foreground">الكمية: {i.qty}</p>
                </div>
                <span className="font-display text-sm text-gold-deep">
                  {egp(priceOf(i.key, i.lastPrice) * i.qty)} ج.م
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">الشحن</span>
            <span className="text-primary">{delivery === 0 ? "مجاني" : `${egp(delivery)} ج.م`}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="font-semibold text-primary">الإجمالي</span>
            <span className="font-display text-xl text-gold-deep">{egp(total)} ج.م</span>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
