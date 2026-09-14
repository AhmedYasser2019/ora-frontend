import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/PageShell";
import { Policy } from "@/components/Policy";
import { loadPage } from "@/lib/pages.queries";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({
    meta: [
      { title: tr("سياسة الشحن والتوصيل | أورا للذهب") },
      {
        name: "description",
        content: tr("مواعيد ورسوم وشروط شحن وتوصيل سبائك وعملات الذهب من أورا لكل محافظات مصر."),
      },
      { property: "og:title", content: tr("سياسة الشحن والتوصيل | أورا للذهب") },
      {
        property: "og:description",
        content: tr("مواعيد ورسوم وشروط شحن وتوصيل سبائك وعملات الذهب من أورا لكل محافظات مصر."),
      },
    ],
  }),
  loader: ({ context }) => loadPage(context.queryClient, "shipping"),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <PageShell
      title="سياسة الشحن والتوصيل"
      subtitle="توصيل مؤمّن بالكامل لكل محافظات مصر، أو استلام من أي فرع."
    >
      <Policy slug="shipping" />
    </PageShell>
  );
}
