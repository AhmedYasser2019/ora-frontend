import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  Menu,
  ShoppingBag,
  Coins,
  Gem,
  Calculator,
  ShieldCheck,
  Truck,
  BadgeCheck,
  TrendingUp,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

import heroGold from "@/assets/hero-gold.jpg";
import barImg from "@/assets/bar.jpg";
import coinsImg from "@/assets/coins.jpg";
import silverImg from "@/assets/silver.jpg";
import jewelryImg from "@/assets/jewelry.jpg";
import { livePricesQuery, egp } from "@/lib/prices.queries";
import { useLivePrices } from "@/lib/use-live-prices";


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

const nav = [
  "الرئيسية",
  "مجموعتنا",
  "الفضة",
  "سعر الذهب",
  "حساب الزكاة",
  "فروعنا",
  "من نحن",
];

const products = [
  { key: "bar-10g", img: barImg, t: "سبيكة ذهب 10 جرام", s: "عيار 24 – 999.9" },
  { key: "coin-8g", img: coinsImg, t: "جنيه ذهب إنجليزي", s: "عيار 22 – 8 جرام" },
  { key: "set-12g", img: jewelryImg, t: "طقم ذهب كلاسيك", s: "عيار 21 – 12 جرام" },
  { key: "silver-100g", img: silverImg, t: "سبيكة فضة 100 جرام", s: "فضة 999" },
] as const;


const services = [
  { icon: TrendingUp, t: "سعر الذهب اللحظي", d: "تابع تحديث الأسعار لحظة بلحظة." },
  { icon: Calculator, t: "حساب الزكاة", d: "احسب زكاة ذهبك بدقة في ثوانٍ." },
  { icon: Coins, t: "إعادة البيع", d: "نشتري منك ذهبك بأفضل سعر في السوق." },
  { icon: Gem, t: "شهادة أصل", d: "كل سبيكة معتمدة بشهادة ضمان." },
];

function Home() {
  const { data, isFetching, dataUpdatedAt, live, pushedAt } = useLivePrices();

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
      {/* Top bar */}
      <div className="bg-gradient-green text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs">
          <span className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gold" /> 17608
          </span>
          <span className="hidden sm:inline text-gold">توصيل آمن ومؤمّن لكل محافظات مصر</span>
          <span>AR | EN</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            aria-label="القائمة"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="font-display text-3xl leading-none tracking-[0.25em] text-primary">ORA</p>
            <p className="mt-1 text-[10px] tracking-[0.35em] text-gold-deep">GOLD JEWELRY</p>
          </div>
          <button
            aria-label="حقيبة الشراء"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-semibold text-accent-foreground">
              2
            </span>
          </button>
        </div>
        <nav className="hidden border-t border-border/60 md:block">
          <ul className="mx-auto flex max-w-6xl items-center justify-center gap-8 px-4 py-3 text-sm text-primary">
            {nav.map((n) => (
              <li key={n}>
                <a href="#" className="transition-colors hover:text-gold-deep">
                  {n}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

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
              <a
                href="#products"
                className="rounded-full px-7 py-3 text-sm font-semibold text-accent-foreground shadow-soft"
                style={{ background: "var(--gradient-gold)" }}
              >
                ابدأ الاستثمار
              </a>
              <a
                href="#prices"
                className="rounded-full border border-gold/60 px-7 py-3 text-sm font-semibold text-gold"
              >
                سعر الذهب اليوم
              </a>
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
      </section>


      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Coins, t: "سبائك ذهب" },
            { icon: BadgeCheck, t: "عملات ذهبية" },
            { icon: Gem, t: "مشغولات" },
            { icon: ShieldCheck, t: "سبائك فضة" },
          ].map(({ icon: Icon, t }) => (
            <a
              key={t}
              href="#products"
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-6 transition-colors hover:border-gold"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-primary">{t}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl text-primary">مجموعتنا</h2>
          <a href="#" className="flex items-center gap-1 text-sm text-gold-deep">
            عرض الكل <ArrowLeft className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <article
              key={p.t}
              className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-soft"
            >
              <img
                src={p.img}
                alt={p.t}
                loading="lazy"
                width={800}
                height={800}
                className="aspect-square w-full bg-cream object-cover"
              />
              <div className="p-4">
                <h3 className="text-base text-primary">{p.t}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.s}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-lg text-gold-deep">
                    {data ? `${egp(data.items[p.key] ?? 0)} ج.م` : "جاري التحديث…"}
                  </span>

                  <button className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                    أضف للسلة
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-cream py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl text-primary">خدماتنا</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl bg-card p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base text-primary">{t}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
      <footer className="bg-gradient-green text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div>
            <p className="font-display text-3xl tracking-[0.25em] text-gold">ORA</p>
            <p className="mt-1 text-[10px] tracking-[0.35em] text-gold/70">GOLD JEWELRY</p>
            <p className="mt-4 text-sm text-primary-foreground/75">
              أورا للذهب والسبائك — استثمار واضح وآمن في المعادن النفيسة.
            </p>
          </div>
          <div>
            <h3 className="text-base text-gold">روابط سريعة</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
              {nav.slice(1).map((n) => (
                <li key={n}>
                  <a href="#" className="hover:text-gold">
                    {n}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-base text-gold">تواصل معنا</h3>
            <ul className="mt-3 space-y-3 text-sm text-primary-foreground/75">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" /> 17608
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" /> support@ora-gold.com
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-gold" /> سموحة، الإسكندرية، مصر
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60">
          جميع الحقوق محفوظة © أورا للذهب 2026
        </div>
      </footer>
    </div>
  );
}
