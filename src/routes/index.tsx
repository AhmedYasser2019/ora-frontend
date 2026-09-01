import { createFileRoute, Link } from "@tanstack/react-router";

import {
  Coins,
  Gem,
  Calculator,
  ShieldCheck,
  Truck,
  BadgeCheck,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";

import heroGold from "@/assets/hero-gold.jpg";
import { livePricesQuery, egp } from "@/lib/prices.queries";
import { productBySlug } from "@/lib/site";
import { useLivePrices } from "@/lib/use-live-prices";
import { LiveTicker } from "@/components/LiveTicker";
import { MarketCountdown } from "@/components/MarketCountdown";
import { FinancialNews } from "@/components/FinancialNews";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "أورا | شراء سبائك وعملات الذهب في مصر" },
      {
        name: "description",
        content:
          "أورا للذهب: سبائك وعملات ذهبية معتمدة، أسعار الذهب اللحظية، حساب الزكاة وتوصيل آمن داخل مصر.",
      },
      { property: "og:title", content: "أورا | شراء سبائك وعملات الذهب في مصر" },
      {
        property: "og:description",
        content: "استثمر في الذهب والفضة بثقة مع أورا. سبائك وعملات وأسعار لحظية.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: Home,

});


const featured = ["gold-bar-10g", "gold-sovereign-coin", "classic-gold-set", "silver-bar-100g"];
const products = featured.flatMap((slug) => productBySlug(slug) ?? []);


const services = [
  { icon: TrendingUp, t: "سعر الذهب اللحظي", d: "تابع تحديث الأسعار لحظة بلحظة.", to: "/gold-price" as const },
  { icon: Calculator, t: "حساب الزكاة", d: "احسب زكاة ذهبك بدقة في ثوانٍ.", to: "/zakat" as const },
  { icon: Coins, t: "إعادة البيع", d: "نشتري منك ذهبك بأفضل سعر في السوق.", to: "/branches" as const },
  { icon: Gem, t: "شهادة أصل", d: "كل سبيكة معتمدة بشهادة ضمان.", to: "/about" as const },
];

function Home() {
  const { data, isFetching, dataUpdatedAt, live, pushedAt, history } = useLivePrices();

  const gramRows = [
    { k: "عيار 24", v: data?.gram.k24, u: "جنيه / جرام" },
    { k: "عيار 21", v: data?.gram.k21, u: "جنيه / جرام" },
    { k: "عيار 18", v: data?.gram.k18, u: "جنيه / جرام" },
    { k: "الفضة", v: data?.gram.silver, u: "جنيه / جرام" },
  ];

  const updatedLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-green shadow-soft">
          <img
            src={heroGold}
            alt="سبائك وعملات ذهب على قماش أخضر"
            width={1408}
            height={1008}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="relative bg-gradient-to-l from-transparent via-primary/70 to-primary p-8 sm:p-14">
            <p className="text-xs tracking-[0.3em] text-gold">استثمار موثوق</p>
            <h1 className="mt-4 max-w-md text-4xl leading-tight text-primary-foreground sm:text-5xl">
              الذهب اللي
              <span className="block text-gradient-gold">يحفظ قيمته</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm text-primary-foreground/80">
              سبائك وعملات ذهبية معتمدة بشهادات أصل، وأسعار لحظية شفافة، وتسليم آمن في أي وقت.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/collection"
                className="rounded-full px-7 py-3 text-sm font-semibold text-accent-foreground shadow-soft"
                style={{ background: "var(--gradient-gold)" }}
              >
                ابدأ الاستثمار
              </Link>
              <Link
                to="/gold-price"
                className="rounded-full border border-gold/60 px-7 py-3 text-sm font-semibold text-gold"
              >
                سعر الذهب اليوم
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Prices */}
      <section id="prices" className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2 text-primary">
            <span
              className={`h-2 w-2 rounded-full bg-gold-deep ${live || isFetching ? "animate-pulse" : ""}`}
              key={pushedAt}
            />
            أسعار لحظية · آخر تحديث {updatedLabel}
          </span>
          <span>{live ? "بث مباشر متصل · تحديث فوري" : "جاري الاتصال بالبث المباشر…"}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-cream p-4 sm:grid-cols-4">
            {gramRows.map((p) => (
              <div key={p.k} className="rounded-xl bg-card px-4 py-4 text-center">
                <p className="text-xs text-muted-foreground">{p.k}</p>
                <p className="mt-1 font-display text-2xl text-primary">
                  {p.v ? egp(p.v) : "—"}
                </p>
                <p className="text-[11px] text-gold-deep">{p.u}</p>
              </div>
            ))}
          </div>
          <LiveTicker history={history} />
        </div>
      </section>


      <MarketCountdown />

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Coins, t: "سبائك ذهب", to: "/collection" as const },
            { icon: BadgeCheck, t: "عملات ذهبية", to: "/collection" as const },
            { icon: Gem, t: "مشغولات", to: "/collection" as const },
            { icon: ShieldCheck, t: "سبائك فضة", to: "/silver" as const },
          ].map(({ icon: Icon, t, to }) => (
            <Link
              key={t}
              to={to}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-6 transition-colors hover:border-gold"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-primary">{t}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl text-primary">مجموعتنا</h2>
          <Link to="/collection" className="flex items-center gap-1 text-sm text-gold-deep">
            عرض الكل <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.t} p={p} price={data?.items[p.key]} />
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-cream py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl text-primary">خدماتنا</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ icon: Icon, t, d, to }) => (
              <Link
                key={t}
                to={to}
                className="rounded-2xl bg-card p-6 text-center transition-shadow hover:shadow-soft"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base text-primary">{t}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Financial news */}
      <FinancialNews />


      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 rounded-2xl bg-secondary p-6 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, t: "ذهب أصلي 100%" },
            { icon: ShieldCheck, t: "جودة معتمدة" },
            { icon: Truck, t: "توصيل آمن وسريع" },
          ].map(({ icon: Icon, t }) => (
            <div key={t} className="flex items-center justify-center gap-3 text-primary">
              <Icon className="h-6 w-6 text-gold-deep" />
              <span className="text-sm font-semibold">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
