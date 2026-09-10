import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  LoaderCircle,
  ShieldCheck,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";

import { intlLocale, useT } from "@/lib/i18n";
import { PageShell } from "@/components/PageShell";
import { api, ApiError } from "@/lib/api";
import { egp, livePricesQuery } from "@/lib/prices.queries";
import { useAuth } from "@/lib/use-auth";
import { useLivePrices } from "@/lib/use-live-prices";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: tr("محفظتي | أورا للذهب") },
      {
        name: "description",
        content: tr("رصيدك النقدي ورصيد الذهب بالجرام، مع شحن الرصيد والشراء بالسعر اللحظي."),
      },
      { property: "og:title", content: tr("محفظتي | أورا للذهب") },
      { property: "og:description", content: tr("محفظة أورا للادخار في الذهب.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(livePricesQuery),
  component: WalletPage,
});

/** رصيد واحد لكل أصل، كما يعيده GET /wallet. */
type Balance = {
  asset: "EGP" | "GOLD" | "SILVER";
  piasters?: number;
  micrograms?: number;
  grams?: string;
};

/** سطر من الدفتر — الحركة كما سُجّلت، لا كما وصفتها الشاشة. */
type Txn = {
  id: number;
  type: string;
  asset: "EGP" | "GOLD" | "SILVER";
  amount: number;
  grams: string | null;
  recorded_at: string;
};

type Action = "deposit" | "buy_gold";

// الشحن يتم بتحويل يعتمده مكتب الحسابات — لا توجد بوابة دفع بعد، فلا endpoint له.
// البيع والسحب موقوفان بطلب الإدارة.
const ACTIONS: { key: Action; label: string; unit: string; cta: string }[] = [
  { key: "deposit", label: "شحن رصيد", unit: "جنيه", cta: "اشحن الرصيد" },
  { key: "buy_gold", label: "شراء ذهب", unit: "جرام", cta: "اشترِ الذهب" },
];

/** أنواع القيود في الدفتر — انظر JournalEntryType. */
const TXN_LABEL: Record<string, string> = {
  buy: "شراء",
  sell: "بيع",
  adjustment: "تسوية",
  reversal: "قيد عكسي",
};

const ASSET_LABEL: Record<string, string> = {
  EGP: "ج.م",
  GOLD: "ذهب",
  SILVER: "فضة",
};

const grams = (n: number) =>
  new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 3 }).format(n);

const txnDate = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

function WalletPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: prices } = useLivePrices();
  const t = useT();

  const [wallet, setWallet] = useState<Balance[] | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [fetching, setFetching] = useState(true);
  const [action, setAction] = useState<Action>("deposit");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // الشراء بسعر الشراء، وإعادة البيع بسعر البيع الأقل (هامش التاجر).
  const buyGram = prices?.gram.k24 ?? 0;
  const sellGram = prices?.sell.k24 ?? 0;
  const active = ACTIONS.find((a) => a.key === action)!;
  const isGold = action === "buy_gold";
  const gramPrice = buyGram;
  const parsed = Number(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { next: "/wallet" } });
    }
  }, [loading, user, navigate]);

  const refresh = useCallback(async () => {
    try {
      const [balances, lines] = await Promise.all([
        api<Balance[]>("/wallet"),
        api<{ data: Txn[] }>("/wallet/transactions"),
      ]);
      setWallet(balances);
      setTxns(lines.data);
    } catch {
      setWallet([]);
      setTxns([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !valid) return;
    if (isGold && gramPrice <= 0) {
      toast.error(t("سعر الجرام غير متاح الآن"), { description: t("حاول بعد لحظات.") });
      return;
    }

    setSubmitting(true);
    try {
      // عرض سعر مثبَّت ثم أمر يحمل رقمه. لا سعر يغادر المتصفح: الخادم يسعّر ويكتب الصفّ.
      const quote = await api<{ quote_id: string }>("/quotes", {
        method: "POST",
        body: { metal: "gold", karat: 21, side: "buy", grams: parsed.toFixed(6) },
      });

      await api("/orders", {
        method: "POST",
        body: { quote_id: quote.quote_id },
        idempotencyKey: crypto.randomUUID(),
      });

      setAmount("");
      toast.success(t("تمت العملية بنجاح"));
      void refresh();
    } catch (e) {
      toast.error(t(e instanceof ApiError ? e.firstMessage : "تعذر تنفيذ العملية"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <PageShell title="محفظتي">
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-gold-deep" />
        </div>
      </PageShell>
    );
  }

  const cash = (wallet?.find((b) => b.asset === "EGP")?.piasters ?? 0) / 100;
  const gold = Number(wallet?.find((b) => b.asset === "GOLD")?.grams ?? 0);
  // تُقيَّم الحيازة بسعر البيع: هو ما ستقبضه فعليًا لو بعت الآن.
  const goldValue = gold * sellGram;
  const cost = isGold && valid ? parsed * gramPrice : 0;

  const input =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-gold";

  return (
    <PageShell
      title="محفظتي"
      subtitle="اشحن رصيدك واشترِ الذهب بالجرام بسعر السوق اللحظي، ويُحفظ باسمك في خزائن مؤمّنة."
    >
      {fetching ? (
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-gold-deep" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <WalletIcon className="h-4 w-4 text-gold-deep" /> {t("الرصيد النقدي")}
                </span>
                <p className="mt-3 font-display text-2xl text-primary">
                  {egp(cash)} {t("ج.م")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Coins className="h-4 w-4 text-gold-deep" /> {t("رصيد الذهب")}
                </span>
                <p className="mt-3 font-display text-2xl text-primary">
                  {grams(gold)} {t("جرام")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ≈ {egp(goldValue)} {t("ج.م")} {t("بسعر البيع")}
                </p>
              </div>
              <div className="rounded-2xl border border-gold/40 bg-gradient-green p-5 text-primary-foreground">
                <span className="flex items-center gap-2 text-xs text-primary-foreground/70">
                  <ShieldCheck className="h-4 w-4 text-gold" /> {t("إجمالي المحفظة")}
                </span>
                <p className="mt-3 font-display text-2xl text-gold">
                  {egp(cash + goldValue)} {t("ج.م")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="font-display text-lg text-primary">{t("آخر الحركات")}</h2>
                <span className="text-xs text-muted-foreground">{t("آخر 20 عملية")}</span>
              </div>
              {txns.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {t("لا توجد حركات بعد — ابدأ بشحن رصيدك.")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {txns.map((txn) => {
                    // إشارة السطر هي الاتجاه: موجب دخل للحساب، سالب خرج منه.
                    const incoming = txn.amount > 0;
                    const isMetal = txn.asset !== "EGP";
                    return (
                      <li key={txn.id} className="flex items-center gap-4 px-5 py-4">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            incoming ? "bg-gold/15 text-gold-deep" : "bg-secondary text-primary"
                          }`}
                        >
                          {incoming ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-primary">
                            {t(TXN_LABEL[txn.type] ?? txn.type)}{" "}
                            <span className="text-muted-foreground">
                              {t(ASSET_LABEL[txn.asset] ?? txn.asset)}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {txnDate(txn.recorded_at)}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-semibold text-primary">
                            {incoming ? "+" : ""}
                            {isMetal
                              ? `${grams(Number(txn.grams ?? 0))} ${t("جرام")}`
                              : `${egp(txn.amount / 100)} ${t("ج.م")}`}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => {
                      setAction(a.key);
                      setAmount("");
                    }}
                    className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                      action === a.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-primary hover:bg-secondary/70"
                    }`}
                  >
                    {t(a.label)}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="amount" className="mb-1 block text-xs font-semibold text-primary">
                    {t("المبلغ")} ({t(active.unit)})
                  </label>
                  <input
                    id="amount"
                    dir="ltr"
                    className={input}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step={isGold ? "0.001" : "1"}
                    placeholder={isGold ? "1.5" : "5000"}
                    required
                  />
                </div>

                {action === "deposit" && (
                  <p className="text-[11px] text-muted-foreground">
                    {t("الحد الأدنى للشحن 100 ج.م · التنفيذ فوري")}
                  </p>
                )}

                {isGold && (
                  <dl className="space-y-2 rounded-xl bg-secondary/60 p-3 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t("سعر الشراء / جرام 24")}</dt>
                      <dd className="font-semibold text-primary">
                        {egp(buyGram)} {t("ج.م")}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t("سعر البيع / جرام 24")}</dt>
                      <dd className="font-semibold text-primary">
                        {egp(sellGram)} {t("ج.م")}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t("سيُخصم من رصيدك")}</dt>
                      <dd className="font-semibold text-gold-deep">
                        {egp(cost)} {t("ج.م")}
                      </dd>
                    </div>
                  </dl>
                )}

                <button
                  type="submit"
                  disabled={submitting || !valid}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : action === "buy_gold" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <WalletIcon className="h-4 w-4" />
                  )}
                  {t(active.cta)}
                </button>
              </form>
            </div>

            <p className="rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
              {t("الذهب المشترى من المحفظة محفوظ باسمك في خزائن مؤمّنة، ويمكنك استلامه سبائك من")}{" "}
              <Link to="/branches" className="font-semibold text-gold-deep hover:underline">
                {t("أي فرع")}
              </Link>
              .
            </p>
          </aside>
        </div>
      )}
    </PageShell>
  );
}
