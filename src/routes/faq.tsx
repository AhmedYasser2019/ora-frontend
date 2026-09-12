import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, LifeBuoy, Search } from "lucide-react";

import { useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { faqQuery } from "@/lib/faq.queries";
import type { Faq } from "@/lib/faq.server";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: tr("الأسئلة الشائعة | مركز المساعدة — أورا للذهب") },
      {
        name: "description",
        content: tr(
          "إجابات على أكثر الأسئلة شيوعًا عن شراء الذهب، الأسعار، المحفظة، الإيداع، الطلبات وأمان الحساب.",
        ),
      },
      { property: "og:title", content: tr("الأسئلة الشائعة | أورا للذهب") },
      { property: "og:description", content: tr("مركز المساعدة وإجابات أسئلتك.") },
    ],
  }),
  // تُقرأ على الخادم: محرّكات البحث تقرأ هذه الصفحة، ولا تنتظر استعلامًا في المتصفح.
  loader: ({ context }) => context.queryClient.ensureQueryData(faqQuery),
  component: FaqPage,
});

/** الأقسام بترتيب ظهورها الأول في القائمة — الترتيب الذي رتّبته لوحة التحكم. */
function byGroup(faqs: Faq[]): [string, Faq[]][] {
  const groups = new Map<string, Faq[]>();

  for (const faq of faqs) {
    const group = groups.get(faq.group);
    if (group) group.push(faq);
    else groups.set(faq.group, [faq]);
  }

  return [...groups];
}

function FaqPage() {
  const t = useT();
  const { data: faqs } = useQuery(faqQuery);
  const [q, setQ] = useState("");
  const needle = q.trim();

  const groups = byGroup(
    needle
      ? (faqs ?? []).filter((f) => f.question.includes(needle) || f.answer.includes(needle))
      : (faqs ?? []),
  );

  return (
    <PageShell
      title="الأسئلة الشائعة"
      subtitle="مركز المساعدة — إجابات مباشرة عن الأسعار والشراء والمحفظة والطلبات وأمان الحساب."
    >
      <div className="mx-auto max-w-3xl">
        <div className="relative mb-8">
          <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("ابحث في الأسئلة…")}
            aria-label={t("ابحث في الأسئلة الشائعة")}
            className="w-full rounded-full border border-border bg-card py-3 pe-4 ps-11 text-sm text-primary outline-none focus:border-gold"
          />
        </div>

        {groups.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {t("لا توجد نتائج لبحثك. جرّب كلمة أخرى أو تواصل معنا مباشرة.")}
          </p>
        ) : (
          <div className="space-y-10">
            {groups.map(([group, items]) => (
              <section key={group}>
                <h2 className="mb-3 font-display text-xl text-primary">{group}</h2>
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {items.map((faq) => (
                    <details key={faq.id} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-primary hover:bg-secondary/40">
                        {faq.question}
                        <ChevronDown className="h-4 w-4 shrink-0 text-gold-deep transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-gold/40 bg-gradient-green p-8 text-center text-primary-foreground">
          <LifeBuoy className="h-8 w-8 text-gold" />
          <p className="font-display text-lg text-gold">{t("لم تجد إجابة سؤالك؟")}</p>
          <p className="text-sm text-primary-foreground/75">
            {t("فريق خدمة العملاء متاح يوميًا خلال ساعات العمل على الرقم الموحد 17608.")}
          </p>
          <Link
            to="/contact"
            className="mt-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-primary"
          >
            {t("تواصل معنا")}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
