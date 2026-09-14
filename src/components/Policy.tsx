import { useQuery } from "@tanstack/react-query";

import { intlLocale, useLang, useT } from "@/lib/i18n";
import { pageQuery } from "@/lib/pages.queries";
import type { PageSlug } from "@/lib/pages.server";

/** نص صفحة من الداشبورد. الـ loader سبق وجلبها (`loadPage`)، فلا انتظار هنا. */
export function PageBody({ slug }: { slug: PageSlug }) {
  const { data: page } = useQuery(pageQuery(slug, useLang().lang));

  return (
    <div
      className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-gold-deep [&_a]:underline [&_h2:not(:first-child)]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-primary [&_h3]:mt-6 [&_h3]:text-base [&_h3]:text-primary [&_li]:ms-5 [&_ol]:list-decimal [&_ul]:list-disc"
      // منظّف على الباك إند (PageController::show) قبل أن يصل هنا.
      dangerouslySetInnerHTML={{ __html: page?.body ?? "" }}
    />
  );
}

/** تخطيط موحّد لصفحات السياسات: تاريخ آخر تعديل + النص. */
export function Policy({ slug }: { slug: PageSlug }) {
  const t = useT();
  const { data: page } = useQuery(pageQuery(slug, useLang().lang));

  return (
    <div className="mx-auto max-w-3xl">
      {page && (
        <p className="mb-8 text-xs text-muted-foreground">
          {t("آخر تحديث")}:{" "}
          {new Intl.DateTimeFormat(intlLocale(), { dateStyle: "long" }).format(
            new Date(page.updatedAt),
          )}
        </p>
      )}
      <PageBody slug={slug} />
    </div>
  );
}
