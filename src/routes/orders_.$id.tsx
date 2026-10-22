import { createFileRoute } from "@tanstack/react-router";

import { tr } from "@/lib/i18n";
import { OrdersPage } from "./orders";

/** طلب واحد بتفاصيله — ما يفتحه إشعار الطلب. */
export const Route = createFileRoute("/orders_/$id")({
  head: () => ({ meta: [{ title: tr("تفاصيل الطلب | زاد جولد") }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  return <OrdersPage id={id} />;
}
