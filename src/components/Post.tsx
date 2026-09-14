import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { useT } from "@/lib/i18n";
import { newsDate } from "@/lib/news.queries";
import { PageShell } from "@/components/PageShell";
import { Prose } from "@/components/Policy";

/** صفحة مقال أو تقرير واحد: الصورة والتصنيف والتاريخ ثم النص الكامل من الداشبورد. */
export function Post({
  post,
  img,
  label,
  back,
}: {
  post: { title: string; body: string; publishedAt: string };
  img: string;
  label: string;
  back: { to: "/news" | "/reports"; label: string };
}) {
  const t = useT();

  return (
    <PageShell title={post.title}>
      <article className="mx-auto max-w-3xl">
        <Link
          to={back.to}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gold-deep hover:text-primary"
        >
          <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {t(back.label)}
        </Link>
        <div className="mt-6 flex items-center gap-3 text-xs">
          <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary">
            {t(label)}
          </span>
          <span className="text-gold-deep">{newsDate(post.publishedAt)}</span>
        </div>
        <img
          src={img}
          alt={post.title}
          width={800}
          height={500}
          className="mt-6 aspect-[16/10] w-full rounded-2xl object-cover"
        />
        <div className="mt-8">
          <Prose html={post.body} />
        </div>
      </article>
    </PageShell>
  );
}

export function PostNotFound({ back }: { back: { to: "/news" | "/reports"; label: string } }) {
  const t = useT();

  return (
    <PageShell title="غير موجود" subtitle="الرابط اللي فتحته مش موجود أو اتشال.">
      <Link
        to={back.to}
        className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        {t(back.label)}
      </Link>
    </PageShell>
  );
}
