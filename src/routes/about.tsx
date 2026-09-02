import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Coins, ShieldCheck, Truck } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import heroGold from "@/assets/hero-gold.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | أورا للذهب والسبائك في مصر" },
      {
        name: "description",
        content:
          "تعرّف على أورا للذهب: شركة متخصصة في بيع وشراء سبائك وعملات الذهب والفضة في مصر بشهادات أصل وأسعار شفافة.",
      },
      { property: "og:title", content: "من نحن | أورا للذهب" },
      {
        property: "og:description",
        content: "قصة أورا وقيمنا في الاستثمار الآمن في المعادن النفيسة.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: BadgeCheck, t: "ذهب أصلي 100%", d: "كل قطعة مصحوبة بشهادة أصل ووزن معتمد." },
  { icon: ShieldCheck, t: "شفافية السعر", d: "أسعارنا مرتبطة بسعر السوق اللحظي بدون مبالغة." },
  { icon: Coins, t: "إعادة شراء مضمونة", d: "نشتري منك ما اشتريته بأفضل سعر في السوق." },
  { icon: Truck, t: "توصيل مؤمّن", d: "شحن آمن ومؤمّن لكل محافظات مصر." },
];

function AboutPage() {
  return (
    <PageShell
      title="من نحن"
      subtitle="أورا للذهب والسبائك — بيت خبرة في المعادن النفيسة يجمع بين الأمان والشفافية وسهولة الاستثمار."
    >
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <img
          src={heroGold}
          alt="سبائك وعملات ذهب أورا"
          loading="lazy"
          width={1408}
          height={1008}
          className="rounded-3xl object-cover shadow-soft"
        />
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            بدأت أورا برؤية بسيطة: أن يكون شراء الذهب في مصر تجربة واضحة وآمنة، بعيدًا عن غموض
            الأسعار والمصاريف المخفية. لذلك نعرض سعر السوق لحظة بلحظة، ونوضح المصنعية قبل الشراء.
          </p>
          <p>
            نقدم سبائك ذهب وعملات ذهبية بأوزان متعددة تناسب المستثمر المبتدئ والمحترف، إلى جانب
            سبائك الفضة والمشغولات، مع خدمة إعادة شراء تضمن لك سيولة في أي وقت.
          </p>
          <p>
            فريقنا موجود في فروعنا بالإسكندرية والقاهرة والجيزة والمنصورة لمساعدتك في اختيار الأنسب
            لهدفك الاستثماري.
          </p>
          <Link
            to="/collection"
            className="inline-flex rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground"
          >
            تصفح مجموعتنا
          </Link>
        </div>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {values.map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-2xl bg-cream p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-base text-primary">{t}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
