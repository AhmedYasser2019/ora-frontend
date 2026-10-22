import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, LoaderCircle, MapPin, Package, Store, XCircle } from "lucide-react";
import { toast } from "sonner";

import { intlLocale, useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { egp } from "@/lib/prices.queries";
import { pct } from "@/lib/holdings";
import { useAuth } from "@/lib/use-auth";
import { PaymentReference } from "@/components/PaymentReference";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: tr("طلباتي | زاد جولد") },
      { name: "description", content: tr("تابع حالة طلباتك في زاد جولد وتفاصيل كل طلب.") },
      { property: "og:title", content: tr("طلباتي | زاد جولد") },
      { property: "og:description", content: tr("متابعة حالة الطلبات.") },
    ],
  }),
  component: () => <OrdersPage />,
});

/** دورة حياة الطلب في الباك إند — انظر OrderStatus. */
type Status =
  "pending" | "repriced" | "approved" | "ready" | "delivered" | "completed" | "cancelled";

/** ما ينتظره الطلب قبل موافقة المكتب — انظر OrderChecks في docs/openapi.json. */
type Check = "pending" | "done" | "not_required";

type Order = {
  order_id: string;
  status: Status;
  /** النص مترجم من الخادم، فلا تُكرَّر أسماء الحالات هنا. */
  status_label: string;
  grams: string;
  gross_piasters: number;
  /** رسم التوصيل فوق سعر القطع، وصفر حين لا يُحتسب. */
  delivery_fee_piasters?: number;
  executed_at: string;
  /** قيمة القطعة اليوم بسعر إعادة البيع — للطلب القائم فقط، ولا قيمة حين يتعذّر التسعير. */
  current_value_piasters?: number | null;
  gain_piasters?: number | null;
  gain_pct?: number | null;
  product?: { sku: string; name: string };
  /** سطور الطلب: سلة من ست قطع طلب واحد بسطر كميته 6. */
  items?: { product: { sku: string; name: string }; quantity: number; gross_piasters: number }[];
  delivery?: {
    fulfilment: string | null;
    governorate: string | null;
    address: string | null;
    branch: string | null;
    payment_method: string | null;
    /** رقم التحويل الذي أرسله العميل — انظر PaymentReference. */
    payment_reference: string | null;
  };
  /** طلب دُفع بجرامات المحفظة: ما خرج فعلًا من الرصيدين. */
  paid_from_balance?: { grams: string; piasters: number };
  /** للطلب المفتوح فقط: الدفع، تأكيد التاجر، وموافقة الإدارة على الطلب الكبير. */
  checks?: { payment: Check; dealer: Check; ceo: Check };
  /** السعر الجديد المعروض حين تحرّك سعر التاجر قبل تثبيت الطلب (`repriced`). */
  proposed_price?: {
    unit_price_piasters_per_gram: number;
    gross_piasters: number;
    difference_piasters: number;
    needs_payment_reference: boolean;
  };
};

const CHECKS: [keyof NonNullable<Order["checks"]>, string][] = [
  ["payment", "التحقق من الدفع"],
  ["dealer", "تأكيد السعر مع التاجر"],
  ["ceo", "موافقة الإدارة"],
];

const STATUS_CLASS: Record<Status, string> = {
  pending: "bg-gold/15 text-gold-deep",
  repriced: "bg-destructive/15 text-destructive",
  approved: "bg-gold/25 text-gold-deep",
  ready: "bg-secondary text-primary",
  delivered: "bg-primary text-primary-foreground",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

/** ما دام لم يُسلَّم بعد، يمكن للعميل التراجع. */
const CANCELLABLE: Status[] = ["pending", "repriced", "approved", "ready"];

const PAYMENT: Record<string, string> = {
  instapay: "InstaPay",
  bank: "تحويل بنكي",
  wallet: "رصيد المحفظة",
  metal: "من رصيد الذهب/الفضة",
  cash: "نقدًا في الفرع",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

/** `id` من /orders/$id: رابط تنبيه أو إشعار يفتح الطلب نفسه، لا القائمة. */
export function OrdersPage({ id }: { id?: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const qc = useQueryClient();
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!loading && !user)
      navigate({ to: "/auth", search: { next: id ? `/orders/${id}` : "/orders" } });
  }, [loading, user, navigate, id]);

  // مُصفَّح من الخادم؛ الصفحة الأولى هي أحدث الطلبات. البثّ الحيّ يُبطله مع كل سعر جديد
  // فتتحدّث قيمة القطع المشتراة — انظر use-live-prices.
  const {
    data: orders = [],
    isPending: fetching,
    isError,
  } = useQuery({
    queryKey: id ? ["orders", id] : ["orders"],
    queryFn: () =>
      id
        ? api<Order>(`/orders/${encodeURIComponent(id)}`).then((order) => [order])
        : api<{ data: Order[] }>("/orders").then((page) => page.data),
    enabled: !!user,
    retry: false,
  });

  // طلب غير موجود أو لعميل آخر (404 من الخادم): رسالة، ثم قائمة الطلبات بدل صفحة مكسورة.
  useEffect(() => {
    if (!id || !isError) return;
    toast.error(t("لم نعثر على هذا الطلب في حسابك"));
    navigate({ to: "/orders", replace: true });
  }, [id, isError, navigate, t]);
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

  if (loading || !user || fetching || (id && isError)) {
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
      {id && (
        <Link to="/orders" className="mb-4 inline-block text-sm font-semibold text-gold-deep">
          {t("كل الطلبات")}
        </Link>
      )}
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
                  {(
                    o.items ?? [
                      { product: o.product, quantity: 1, gross_piasters: o.gross_piasters },
                    ]
                  ).map((line) => (
                    <li
                      key={line.product?.sku ?? o.order_id}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="flex flex-col items-start gap-1">
                        <span className="text-primary">{t(line.product?.name ?? "")}</span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {t("الكمية")}: {line.quantity}
                        </span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {t("سعر الشراء")}: {egp(line.gross_piasters / 100)} {t("ج.م")}
                      </span>
                    </li>
                  ))}
                  {!!o.delivery_fee_piasters && (
                    <li className="flex justify-between gap-3 text-sm text-muted-foreground">
                      <span>{t("التوصيل")}</span>
                      <span>
                        {egp(o.delivery_fee_piasters / 100)} {t("ج.م")}
                      </span>
                    </li>
                  )}
                  <li className="text-xs text-muted-foreground">
                    {o.grams} {t("جرام")}
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
                    {o.paid_from_balance && (
                      <p>
                        {t("خُصم من رصيدك")}: {o.paid_from_balance.grams} {t("جرام")} +{" "}
                        {egp(o.paid_from_balance.piasters / 100)} {t("ج.م")} {t("مصنعية")}
                      </p>
                    )}
                    {d?.payment_reference && o.status !== "pending" && (
                      <p>
                        {t("رقم التحويل")}: <span dir="ltr">{d.payment_reference}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="font-display text-2xl text-gold-deep">
                      {egp((o.gross_piasters + (o.delivery_fee_piasters ?? 0)) / 100)} {t("ج.م")}
                    </p>
                    {cancellable && (
                      // الإلغاء لا رجعة فيه، فلا يُنفَّذ من نقرة واحدة.
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
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
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("إلغاء هذا الطلب؟")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(
                                "هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.",
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("الإبقاء على الطلب")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancel(o.order_id)}
                              className={buttonVariants({ variant: "destructive" })}
                            >
                              {t("تأكيد الإلغاء")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {o.status === "pending" && o.checks && (
                  <ul className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 text-[11px]">
                    {CHECKS.filter(([key]) => o.checks![key] !== "not_required").map(
                      ([key, label]) => (
                        <li
                          key={key}
                          className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground"
                        >
                          {o.checks![key] === "done" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-gold-deep" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {t(label)}
                        </li>
                      ),
                    )}
                  </ul>
                )}

                {o.status === "repriced" && o.proposed_price && (
                  <PriceOffer orderId={o.order_id} offer={o.proposed_price} onAccepted={refresh} />
                )}

                {o.status === "pending" &&
                  o.checks?.payment === "pending" &&
                  (d?.payment_method === "instapay" || d?.payment_method === "bank") && (
                    <div className="mt-4 border-t border-border pt-4">
                      <PaymentReference
                        orderId={o.order_id}
                        initial={d.payment_reference}
                        onSaved={refresh}
                      />
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

/**
 * سعر التاجر تحرّك بعد الدفع وقبل تثبيت الطلب، فعرض المكتب سعرًا جديدًا. العميل يقبله — والفرق
 * يُخصم من المحفظة أو يُرد إليها، أو في طلب InstaPay/تحويل يُرسل رقم تحويل الفرق — أو يلغي
 * الطلب بزر الإلغاء فيعود له كل شيء.
 */
function PriceOffer({
  orderId,
  offer,
  onAccepted,
}: {
  orderId: string;
  offer: NonNullable<Order["proposed_price"]>;
  onAccepted: () => void;
}) {
  const t = useT();
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const up = offer.difference_piasters > 0;

  const accept = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/orders/${orderId}/accept-price`, {
        method: "POST",
        body: offer.needs_payment_reference ? { payment_reference: reference.trim() } : {},
      });
      toast.success(t("تم قبول السعر الجديد"));
      onAccepted();
    } catch (e) {
      toast.error(t(e instanceof ApiError ? e.firstMessage : "تعذر قبول السعر"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={accept}
      className="mt-4 space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-4"
    >
      <p className="text-sm font-semibold text-primary">{t("تغيّر سعر التاجر قبل تثبيت طلبك")}</p>
      <p className="text-xs text-muted-foreground">
        {t("السعر الجديد للجرام")}: {egp(offer.unit_price_piasters_per_gram / 100)} {t("ج.م")} ·{" "}
        {t("الإجمالي الجديد")}: {egp(offer.gross_piasters / 100)} {t("ج.م")} ·{" "}
        {up ? t("عليك فرق") : t("لك فرق")}: {egp(Math.abs(offer.difference_piasters) / 100)}{" "}
        {t("ج.م")}
      </p>
      {offer.needs_payment_reference && (
        <input
          dir="ltr"
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-primary outline-none focus:border-gold"
          placeholder={t("رقم تحويل الفرق")}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          maxLength={64}
          required
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
          {t("قبول السعر الجديد")}
        </button>
        <span className="text-[11px] text-muted-foreground">
          {t("أو ألغِ الطلب ويعود لك المبلغ كاملًا.")}
        </span>
      </div>
    </form>
  );
}
