import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/PageShell";
import { Policy } from "@/components/Policy";
import { loadPage } from "@/lib/pages.queries";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: tr("الشروط والأحكام | أورا للذهب") },
      {
        name: "description",
        content: tr("الشروط والأحكام الخاصة باستخدام موقع أورا للذهب وشراء وبيع السبائك والعملات."),
      },
      { property: "og:title", content: tr("الشروط والأحكام | أورا للذهب") },
      {
        property: "og:description",
        content: tr("الشروط والأحكام الخاصة باستخدام موقع أورا للذهب وشراء وبيع السبائك والعملات."),
      },
    ],
  }),
  loader: ({ context }) => loadPage(context.queryClient, "terms"),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell
      title="الشروط والأحكام"
      subtitle="اقرأ الشروط بعناية قبل استخدام الموقع أو تنفيذ أي عملية شراء أو بيع."
    >
      <Policy slug="terms" />
    </PageShell>
  );
}
