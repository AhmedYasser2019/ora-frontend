import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle, MapPin, Package, Store, XCircle } from "lucide-react";
import { toast } from "sonner";

import { intlLocale, useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { egp } from "@/lib/prices.queries";
import { pct } from "@/lib/holdings";
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

/** دورة حياة الطلب في الباك إند — انظر OrderStatus. */
type Status = "pending" | "approved" | "ready" | "delivered" | "completed" | "cancelled";

type Order = {
  order_id: string;
  status: Status;
  /** النص مترجم من الخادم، فلا تُكرَّر أسماء الحالات هنا. */
  status_label: string;
  grams: string;
  gross_piasters: number;
  executed_at: string;
  /** قيمة القطعة اليوم بسعر إعادة البيع — للطلب القائم فقط، ولا قيمة حين يتعذّر التسعير. */
  current_value_piasters?: number | null;
  gain_piasters?: number | null;
  gain_pct?: number | null;
  product?: { sku: string; name: string };
  delivery?: {
    fulfilment: string | null;
    governorate: string | null;
    address: string | null;
    branch: string | null;
    payment_method: string | null;
  };
};

const STATUS_CLASS: Record<Status, string> = {
  pending: "bg-gold/15 text-gold-deep",
  approved: "bg-gold/25 text-gold-deep",
  ready: "bg-secondary text-primary",
  delivered: "bg-primary text-primary-foreground",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

/** ما دام لم يُسلَّم بعد، يمكن للعميل التراجع. */
const CANCELLABLE: Status[] = ["pending", "approved", "ready"];

const PAYMENT: Record<string, string> = {
  instapay: "InstaPay",
  bank: "تحويل بنكي",
  wallet: "رصيد المحفظة",
  cash: "نقدًا في الفرع",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const qc = useQueryClient();
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/orders" } });
  }, [loading, user, navigate]);

  // مُصفَّح من الخادم؛ الصفحة الأولى هي أحدث الطلبات. البثّ الحيّ يُبطله مع كل سعر جديد
  // فتتحدّث قيمة القطع المشتراة — انظر use-live-prices.
  const { data: orders = [], isPending: fetching } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api<{ data: Order[] }>("/orders").then((page) => page.data),
    enabled: !!user,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["orders"] });

  const cancel = async (id: string) => {
    if (!user) return;
    setBusy(id);
    try {
      await api(`/orders/${id}/cancel`, { method: "POST" });
      toast.success(t("تم إلغاء الطلب"));
      void refresh();
    } catch (e) {
      toast.error(t(e instanceof ApiError ? e.firstMessage : "تعذر إلغاء الطلب"));
    } finally {
      setBusy("");
    }
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
            const cancellable = CANCELLABLE.includes(o.status);
            const d = o.delivery;
            return (
              <article key={o.order_id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p dir="ltr" className="font-display text-sm text-primary">
                      {o.order_id}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{when(o.executed_at)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_CLASS[o.status]}`}
                  >
                    {o.status_label}
                  </span>
                </div>

                <ul className="mt-5 space-y-2 border-y border-border py-4">
                  <li className="flex justify-between gap-3 text-sm">
                    <span className="text-primary">
                      {t(o.product?.name ?? "")}{" "}
                      <span className="text-muted-foreground">
                        {o.grams} {t("جرام")}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {t("سعر الشراء")}: {egp(o.gross_piasters / 100)} {t("ج.م")}
                    </span>
                  </li>
                  {o.current_value_piasters != null && o.gain_pct != null && (
                    <li className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {t("السعر الحالي")}: {egp(o.current_value_piasters / 100)} {t("ج.م")}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          (o.gain_piasters ?? 0) < 0
                            ? "bg-destructive/10 text-destructive"
                            : "bg-gold/15 text-gold-deep"
                        }`}
                      >
                        {pct(o.gain_pct)} · {egp((o.gain_piasters ?? 0) / 100)} {t("ج.م")}
                      </span>
                    </li>
                  )}
                </ul>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {d && (
                      <p className="flex items-center gap-1.5">
                        {d.fulfilment === "pickup" ? (
                          <>
                            <Store className="h-3.5 w-3.5 text-gold-deep" /> {t("استلام من")}{" "}
                            {t(d.branch ?? "")}
                          </>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5 text-gold-deep" />{" "}
                            {t(d.governorate ?? "")} — {d.address}
                          </>
                        )}
                      </p>
                    )}
                    {d?.payment_method && (
                      <p>
                        {t("طريقة الدفع")}: {t(PAYMENT[d.payment_method] ?? d.payment_method)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="font-display text-2xl text-gold-deep">
                      {egp(o.gross_piasters / 100)} {t("ج.م")}
                    </p>
                    {cancellable && (
                      <button
                        onClick={() => cancel(o.order_id)}
                        disabled={busy === o.order_id}
                        className="flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
                      >
                        {busy === o.order_id ? (
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
