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
  Smartphone,
} from "lucide-react";

import heroGold from "@/assets/hero-gold.jpg";
import { intlLocale, tr, useT } from "@/lib/i18n";
import { livePricesQuery, egp } from "@/lib/prices.queries";
import { buyPrice, productBySlug } from "@/lib/site";
import { useLivePrices } from "@/lib/use-live-prices";
import { LiveTicker } from "@/components/LiveTicker";
import { MarketCountdown } from "@/components/MarketCountdown";
import { FinancialNews } from "@/components/FinancialNews";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => {
    const title = tr("أورا | شراء سبائك وعملات الذهب في مصر");

    return {
      meta: [
        { title },
        {
          name: "description",
          content: tr(
            "أورا للذهب: سبائك وعملات ذهبية معتمدة، أسعار الذهب اللحظية، حساب الزكاة وتوصيل آمن داخل مصر.",
          ),
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: tr("استثمر في الذهب والفضة بثقة مع أورا. سبائك وعملات وأسعار لحظية."),
        },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: Home,
});

const featured = ["gold-bar-10g", "gold-sovereign-coin", "classic-gold-set", "silver-bar-100g"];
const products = featured.flatMap((slug) => productBySlug(slug) ?? []);

const services = [
  {
    icon: TrendingUp,
    title: "سعر الذهب اللحظي",
    d: "تابع تحديث الأسعار لحظة بلحظة.",
    to: "/gold-price" as const,
  },
  {
    icon: Calculator,
    title: "حساب الزكاة",
    d: "احسب زكاة ذهبك بدقة في ثوانٍ.",
    to: "/zakat" as const,
  },
  {
    icon: Coins,
    title: "إعادة البيع",
    d: "نشتري منك ذهبك بأفضل سعر في السوق.",
    to: "/branches" as const,
  },
  { icon: Gem, title: "شهادة أصل", d: "كل سبيكة معتمدة بشهادة ضمان.", to: "/about" as const },
];

function Home() {
  const { data, isFetching, dataUpdatedAt, live, pushedAt, history } = useLivePrices();
  const t = useT();

  const gramRows = [
    { k: t("عيار 24"), v: data?.gram.k24, u: t("جنيه / جرام") },
    { k: t("عيار 21"), v: data?.gram.k21, u: t("جنيه / جرام") },
    { k: t("عيار 18"), v: data?.gram.k18, u: t("جنيه / جرام") },
    { k: t("الفضة"), v: data?.gram.silver, u: t("جنيه / جرام") },
  ];

  const updatedLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString(intlLocale(), {
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
            alt={t("سبائك وعملات ذهب على قماش أخضر")}
            width={1408}
            height={1008}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="relative bg-gradient-to-l from-transparent via-primary/70 to-primary p-8 sm:p-14">
            <p className="text-xs tracking-[0.3em] text-gold">{t("استثمار موثوق")}</p>
            <h1 className="mt-4 max-w-md text-4xl leading-tight text-primary-foreground sm:text-5xl">
              {t("الذهب اللي")}
              <span className="block text-gradient-gold">{t("يحفظ قيمته")}</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm text-primary-foreground/80">
              {t(
                "سبائك وعملات ذهبية معتمدة بشهادات أصل، وأسعار لحظية شفافة، وتسليم آمن في أي وقت.",
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/collection"
                className="rounded-full px-7 py-3 text-sm font-semibold text-accent-foreground shadow-soft"
                style={{ background: "var(--gradient-gold)" }}
              >
                {t("ابدأ الاستثمار")}
              </Link>
              <Link
                to="/gold-price"
                className="rounded-full border border-gold/60 px-7 py-3 text-sm font-semibold text-gold"
              >
                {t("سعر الذهب اليوم")}
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
            {t("أسعار لحظية · آخر تحديث")} {updatedLabel}
          </span>
          <span>{live ? t("بث مباشر متصل · تحديث فوري") : t("جاري الاتصال بالبث المباشر…")}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-cream p-4 sm:grid-cols-4">
            {gramRows.map((p) => (
              <div key={p.k} className="rounded-xl bg-card px-4 py-4 text-center">
                <p className="text-xs text-muted-foreground">{p.k}</p>
                <p className="mt-1 font-display text-2xl text-primary">{p.v ? egp(p.v) : "—"}</p>
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
            { icon: Coins, label: "سبائك ذهب", to: "/collection" as const },
            { icon: BadgeCheck, label: "عملات ذهبية", to: "/collection" as const },
            { icon: Gem, label: "مشغولات", to: "/collection" as const },
            { icon: ShieldCheck, label: "سبائك فضة", to: "/silver" as const },
          ].map(({ icon: Icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-6 transition-colors hover:border-gold"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-primary">{t(label)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl text-primary">{t("مجموعتنا")}</h2>
          <Link to="/collection" className="flex items-center gap-1 text-sm text-gold-deep">
            {t("عرض الكل")} <ArrowLeft className="h-4 w-4 ltr:rotate-180" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} p={p} price={buyPrice(p, data?.gram)} />
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-cream py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl text-primary">{t("خدماتنا")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ icon: Icon, title, d, to }) => (
              <Link
                key={title}
                to={to}
                className="rounded-2xl bg-card p-6 text-center transition-shadow hover:shadow-soft"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base text-primary">{t(title)}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(d)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Financial news */}
      <FinancialNews />

      {/* App */}
      <section className="bg-gradient-green py-14 text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm text-gold">{t("حمّل تطبيق أورا")}</p>
            <h2 className="mt-2 font-display text-3xl text-gold">
              {t("استثمارك في الذهب من جيبك")}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/75">
              {t(
                "اشترِ الذهب وبِعه وتابع أسعاره لحظة بلحظة، واستعرض المنتجات وأدر محفظتك من أي مكان — بنفس الأسعار والحسابات الموجودة على الموقع.",
              )}
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-primary-foreground/75">
              {["تنبيهات تغير السعر", "محفظة وادخار بالجرام", "تتبع الطلبات"].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-gold" /> {t(f)}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <span className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-gold/40 bg-primary-foreground/5 px-6 py-3">
              <Smartphone className="h-6 w-6 text-gold" />
              <span>
                <span className="block text-[10px] text-primary-foreground/60">
                  {t("قريبًا على")}
                </span>
                <span className="block text-sm font-semibold text-gold">Google Play</span>
              </span>
            </span>
            <span className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-gold/40 bg-primary-foreground/5 px-6 py-3">
              <Smartphone className="h-6 w-6 text-gold" />
              <span>
                <span className="block text-[10px] text-primary-foreground/60">
                  {t("قريبًا على")}
                </span>
                <span className="block text-sm font-semibold text-gold">App Store</span>
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 rounded-2xl bg-secondary p-6 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, label: "ذهب أصلي 100%" },
            { icon: ShieldCheck, label: "جودة معتمدة" },
            { icon: Truck, label: "توصيل آمن وسريع" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-3 text-primary">
              <Icon className="h-6 w-6 text-gold-deep" />
              <span className="text-sm font-semibold">{t(label)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
