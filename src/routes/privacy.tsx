import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/PageShell";
import { Policy } from "@/components/Policy";
import { loadPage } from "@/lib/pages.queries";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: tr("سياسة الخصوصية | زاد جولد") },
      {
        name: "description",
        content: tr("كيف تجمع زاد جولد بياناتك الشخصية وتستخدمها وتحميها."),
      },
      { property: "og:title", content: tr("سياسة الخصوصية | زاد جولد") },
      {
        property: "og:description",
        content: tr("كيف تجمع زاد جولد بياناتك الشخصية وتستخدمها وتحميها."),
      },
    ],
  }),
  loader: ({ context }) => loadPage(context.queryClient, "privacy"),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell
      title="سياسة الخصوصية"
      subtitle="نوضح هنا البيانات التي نجمعها، وسبب جمعها، وكيف نحميها."
    >
      <Policy slug="privacy" />
    </PageShell>
  );
}
