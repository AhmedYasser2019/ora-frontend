import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, MapPin, Package, Store, XCircle } from "lucide-react";
import { toast } from "sonner";

import { intlLocale, useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { egp } from "@/lib/prices.queries";
import { useAuth } from "@/lib/use-auth";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: tr("طلباتي | أورا للذهب") },
      { name: "description", content: tr("تابع حالة طلباتك في أورا للذهب وتفاصيل كل طلب.") },
      { property: "og:title", content: tr("طلباتي | أورا للذهب") },
      { property: "og:description", content: tr("متابعة حالة الطلبات.") },
    ],
  }),
  component: OrdersPage,
});

type Status = "pending" | "confirmed" | "shipped" | "completed" | "cancelled";

type OrderItem = { id: string; title: string; qty: number; unit_price: number };

type Order = {
  id: string;
  ref: string;
  status: Status;
  fulfilment: string;
  governorate: string | null;
  address: string | null;
  branch: string | null;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

const STATUS: Record<Status, { label: string; className: string }> = {
  pending: { label: "قيد التنفيذ", className: "bg-gold/15 text-gold-deep" },
  confirmed: { label: "تم التأكيد", className: "bg-gold/25 text-gold-deep" },
  shipped: { label: "تم الشحن", className: "bg-secondary text-primary" },
  completed: { label: "مكتمل", className: "bg-primary text-primary-foreground" },
  cancelled: { label: "ملغي", className: "bg-destructive/15 text-destructive" },
};

const PAYMENT: Record<string, string> = {
  instapay: "InstaPay",
  bank: "تحويل بنكي",
  wallet: "رصيد المحفظة",
  cash: "نقدًا في الفرع",
};

const CANCEL_ERRORS: Record<string, string> = {
  ORD04: "لم يتم العثور على الطلب",
  ORD05: "لا يمكن إلغاء الطلب بعد شحنه",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/orders" } });
  }, [loading, user, navigate]);

  const refresh = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("orders")
      .select(
        "id, ref, status, fulfilment, governorate, address, branch, payment_method, subtotal, delivery_fee, total, created_at, order_items(id, title, qty, unit_price)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setOrders((data as Order[] | null) ?? []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (user) void refresh(user.id);
  }, [user, refresh]);

  const cancel = async (id: string) => {
    if (!user) return;
    setBusy(id);
    const { error } = await supabase.rpc("cancel_order", { p_order_id: id });
    setBusy("");
    if (error) {
      toast.error(t(CANCEL_ERRORS[error.code ?? ""] ?? "تعذر إلغاء الطلب"));
      return;
    }
    toast.success(t("تم إلغاء الطلب"));
    void refresh(user.id);
  };

  if (loading || !user || fetching) {
    return (
      <PageShell title="طلباتي">
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-gold-deep" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="طلباتي"
      subtitle="كل طلباتك وحالتها الحالية. يمكنك إلغاء أي طلب ما دام لم يُشحن بعد."
    >
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-gold-deep" />
          <p className="mt-4 text-lg text-primary">{t("لا توجد طلبات بعد")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("ابدأ من مجموعتنا واختر السبيكة أو العملة المناسبة لك.")}
          </p>
          <Link
            to="/collection"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("تصفح المجموعة")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const status = STATUS[o.status];
            const cancellable = o.status === "pending" || o.status === "confirmed";
            return (
              <article key={o.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p dir="ltr" className="font-display text-lg text-primary">
                      {o.ref}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{when(o.created_at)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${status.className}`}
                  >
                    {t(status.label)}
                  </span>
                </div>

                <ul className="mt-5 space-y-2 border-y border-border py-4">
                  {o.order_items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 text-sm">
                      <span className="text-primary">
                        {t(i.title)} <span className="text-muted-foreground">× {i.qty}</span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {egp(Number(i.unit_price) * i.qty)} {t("ج.م")}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      {o.fulfilment === "pickup" ? (
                        <>
                          <Store className="h-3.5 w-3.5 text-gold-deep" /> {t("استلام من")}{" "}
                          {t(o.branch ?? "")}
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3.5 w-3.5 text-gold-deep" /> {t(o.governorate ?? "")}{" "}
                          — {o.address}
                        </>
                      )}
                    </p>
                    <p>
                      {t("طريقة الدفع")}: {t(PAYMENT[o.payment_method] ?? o.payment_method)}
                    </p>
                    <p>
                      {t("الإجمالي الفرعي")} {egp(Number(o.subtotal))} {t("ج.م")} · {t("التوصيل")}{" "}
                      {Number(o.delivery_fee) === 0
                        ? t("مجاني")
                        : `${egp(Number(o.delivery_fee))} ${t("ج.م")}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="font-display text-2xl text-gold-deep">
                      {egp(Number(o.total))} {t("ج.م")}
                    </p>
                    {cancellable && (
                      <button
                        onClick={() => cancel(o.id)}
                        disabled={busy === o.id}
                        className="flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
                      >
                        {busy === o.id ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {t("إلغاء الطلب")}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
