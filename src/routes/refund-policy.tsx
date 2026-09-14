import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/PageShell";
import { Policy } from "@/components/Policy";
import { loadPage } from "@/lib/pages.queries";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: tr("سياسة الاسترجاع واسترداد الأموال | أورا للذهب") },
      {
        name: "description",
        content: tr("شروط ومدد استرجاع سبائك وعملات الذهب واسترداد الأموال من أورا للذهب."),
      },
      { property: "og:title", content: tr("سياسة الاسترجاع واسترداد الأموال | أورا للذهب") },
      {
        property: "og:description",
        content: tr("شروط ومدد استرجاع سبائك وعملات الذهب واسترداد الأموال من أورا للذهب."),
      },
    ],
  }),
  loader: ({ context }) => loadPage(context.queryClient, "refund"),
  component: RefundPage,
});

function RefundPage() {
  return (
    <PageShell
      title="سياسة الاسترجاع واسترداد الأموال"
      subtitle="نشتري منك ذهبك في أي وقت، وهذه هي شروط الاسترجاع والاسترداد."
    >
      <Policy slug="refund" />
    </PageShell>
  );
}
