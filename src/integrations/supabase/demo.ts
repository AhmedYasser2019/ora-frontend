/**
 * وضع الديمو: أي بيانات تُدخلها تعدّي، بدون Supabase.
 * فعّله بـ VITE_DEMO=1 في .env ثم أعد تشغيل الخادم.
 *
 * ponytail: نسخة مبسّطة من دوال SQL (place_order / wallet_transact / cancel_order)
 * تكفي للعرض فقط — الباك إند الحقيقي يظل هو المرجع. لو الديمو اتحول لمنتج، احذف الملف.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- داتا ديمو حرة الشكل
type Row = Record<string, any>;

export const DEMO = import.meta.env["VITE_DEMO"] === "1";

const KEY = "ora-demo-v1";
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const fail = (code: string) => ({ data: null, error: { code, message: code } });
const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

type State = {
  seeded: boolean;
  user: Row | null;
  profile: Row;
  wallet: Row;
  txns: Row[];
  orders: Row[];
};

const blank = (): State => ({
  seeded: false,
  user: null,
  profile: { full_name: "", phone: "" },
  wallet: { cash_balance: 0, gold_grams: 0 },
  txns: [],
  orders: [],
});

let state: State = blank();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = JSON.parse(raw) as State;
} catch {
  /* SSR أو تخزين مقفول */
}

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* تجاهل */
  }
};

const listeners = new Set<(event: string, session: Row | null) => void>();
const session = () => (state.user ? { user: state.user } : null);
const emit = () => listeners.forEach((f) => f(state.user ? "SIGNED_IN" : "SIGNED_OUT", session()));

const txn = (kind: string, cash = 0, grams = 0, gram_price: number | null = null) =>
  state.txns.unshift({
    id: uid(),
    kind,
    cash_delta: cash,
    grams_delta: grams,
    gram_price,
    created_at: now(),
  });

/** أول دخول يفتح محفظة وطلبًا سابقًا عشان الشاشات تبان مليانة في العرض. */
function seedOnce(name: string, phone: string) {
  if (state.seeded) return;
  state.seeded = true;
  state.profile = { full_name: name, phone };
  state.wallet = { cash_balance: 150_000, gold_grams: 5 };
  state.txns = [
    {
      id: uid(),
      kind: "buy_gold",
      cash_delta: -25_000,
      grams_delta: 5,
      gram_price: 5000,
      created_at: ago(30),
    },
    {
      id: uid(),
      kind: "deposit",
      cash_delta: 175_000,
      grams_delta: 0,
      gram_price: null,
      created_at: ago(48),
    },
  ];
  state.orders = [
    {
      id: uid(),
      ref: "ORA-DEMO01",
      status: "shipped",
      full_name: name,
      phone,
      fulfilment: "delivery",
      governorate: "القاهرة",
      address: "٢٥ شارع طلعت حرب، وسط البلد",
      branch: null,
      payment_method: "instapay",
      subtotal: 48_500,
      delivery_fee: 150,
      total: 48_650,
      created_at: ago(72),
      order_items: [{ id: uid(), title: "سبيكة ذهب ١٠ جرام", qty: 1, unit_price: 48_500 }],
    },
  ];
}

function signIn(email: string, meta: Row = {}) {
  const name = (meta["full_name"] as string) || state.profile["full_name"] || "عميل التجربة";
  const phone = (meta["phone"] as string) || state.profile["phone"] || "01000000000";
  seedOnce(name, phone);
  state.user = {
    id: state.user?.["id"] ?? uid(),
    email,
    user_metadata: { full_name: name, phone, ...meta },
  };
  save();
  emit();
  return { data: { user: state.user, session: session() }, error: null };
}

function rowsOf(table: string): Row[] {
  if (table === "profiles") return [state.profile];
  if (table === "wallets") return [state.wallet];
  if (table === "wallet_transactions") return state.txns;
  if (table === "orders") return state.orders;
  return [];
}

/** بديل مبسّط لـ PostgREST: يتجاهل الفلاتر ويرد داتا الديمو كما هي. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- بديل مبسّط لـ query builder
function from(table: string): any {
  let single = false;
  let lim = 0;
  let patch: Row | null = null;
  const run = async () => {
    if (patch) {
      Object.assign(rowsOf(table)[0] ?? {}, patch);
      save();
      return { data: null, error: null };
    }
    const list = lim ? rowsOf(table).slice(0, lim) : rowsOf(table);
    return { data: single ? (list[0] ?? null) : list, error: null };
  };
  const b: Row = {
    select: () => b,
    eq: () => b,
    order: () => b,
    limit: (n: number) => ((lim = n), b),
    maybeSingle: () => ((single = true), b),
    single: () => ((single = true), b),
    update: (v: Row) => ((patch = v), b),
    then: (ok: (v: unknown) => unknown, no: (e: unknown) => unknown) => run().then(ok, no),
  };
  return b;
}

async function rpc(fn: string, args: Row = {}) {
  if (!state.user) return fail("28000");

  if (fn === "place_order") {
    const items = (args["p_items"] as Row[]) ?? [];
    if (items.length === 0) return fail("ORD01");
    if (args["p_fulfilment"] === "delivery" && !String(args["p_address"] ?? "").trim())
      return fail("ORD02");
    const subtotal = +items
      .reduce((s, i) => s + Number(i["unit_price"]) * Number(i["qty"]), 0)
      .toFixed(2);
    if (!(subtotal > 0)) return fail("ORD03");
    const fee = args["p_fulfilment"] === "pickup" || subtotal >= 50_000 ? 0 : 150;
    const total = subtotal + fee;
    const byWallet = args["p_payment_method"] === "wallet";
    if (byWallet && state.wallet["cash_balance"] < total) return fail("WLT01");

    const order: Row = {
      id: uid(),
      ref: "ORA-" + uid().slice(0, 6).toUpperCase(),
      status: byWallet ? "confirmed" : "pending",
      full_name: args["p_full_name"],
      phone: args["p_phone"],
      fulfilment: args["p_fulfilment"],
      governorate: args["p_governorate"] ?? null,
      address: args["p_address"] ?? null,
      branch: args["p_branch"] ?? null,
      payment_method: args["p_payment_method"],
      subtotal,
      delivery_fee: fee,
      total,
      created_at: now(),
      order_items: items.map((i) => ({
        id: uid(),
        title: i["title"],
        qty: i["qty"],
        unit_price: i["unit_price"],
      })),
    };
    state.orders.unshift(order);
    if (byWallet) {
      state.wallet["cash_balance"] -= total;
      txn("order_payment", -total);
    }
    save();
    return { data: order, error: null };
  }

  if (fn === "cancel_order") {
    const order = state.orders.find((o) => o["id"] === args["p_order_id"]);
    if (!order) return fail("ORD04");
    if (!["pending", "confirmed"].includes(order["status"] as string)) return fail("ORD05");
    if (order["payment_method"] === "wallet") {
      state.wallet["cash_balance"] += order["total"];
      txn("order_refund", order["total"]);
    }
    order["status"] = "cancelled";
    save();
    return { data: order, error: null };
  }

  if (fn === "wallet_transact") {
    const kind = args["p_kind"] as string;
    const amount = Number(args["p_amount"]);
    const price = Number(args["p_gram_price"] ?? 0);
    if (!(amount > 0)) return fail("22023");
    if (kind === "withdraw" || kind === "sell_gold") return fail("WLT06");
    if (kind === "deposit" && amount < 100) return fail("WLT03");
    if (kind === "withdraw") {
      if (amount < 500) return fail("WLT04");
      const last24h = state.txns
        .filter(
          (t) =>
            t["kind"] === "withdraw" &&
            Date.now() - Date.parse(t["created_at"] as string) < 86_400_000,
        )
        .reduce((s, t) => s - Number(t["cash_delta"]), 0);
      if (last24h + amount > 200_000) return fail("WLT05");
    }
    const isGold = kind === "buy_gold" || kind === "sell_gold";
    if (isGold && !(price > 0)) return fail("22023");
    const cash =
      kind === "deposit"
        ? amount
        : kind === "withdraw"
          ? -amount
          : kind === "buy_gold"
            ? -+(amount * price).toFixed(2)
            : +(amount * price).toFixed(2);
    const grams = kind === "buy_gold" ? amount : kind === "sell_gold" ? -amount : 0;
    if (state.wallet["cash_balance"] + cash < 0) return fail("WLT01");
    if (state.wallet["gold_grams"] + grams < 0) return fail("WLT02");
    state.wallet["cash_balance"] = +(state.wallet["cash_balance"] + cash).toFixed(2);
    state.wallet["gold_grams"] = +(state.wallet["gold_grams"] + grams).toFixed(3);
    txn(kind, cash, grams, isGold ? price : null);
    save();
    return { data: state.wallet, error: null };
  }

  return fail("42883");
}

export const demoClient = {
  auth: {
    getSession: async () => ({ data: { session: session() }, error: null }),
    getUser: async () => ({ data: { user: state.user }, error: null }),
    onAuthStateChange: (cb: (event: string, session: Row | null) => void) => {
      listeners.add(cb);
      queueMicrotask(() => cb(state.user ? "SIGNED_IN" : "INITIAL_SESSION", session()));
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
    signInWithPassword: async ({ email }: { email: string; password: string }) => signIn(email),
    signUp: async ({
      email,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: Row };
    }) => signIn(email, options?.data ?? {}),
    signOut: async () => {
      state.user = null;
      save();
      emit();
      return { error: null };
    },
  },
  from,
  rpc,
  /** للاختبار فقط: يمسح داتا الديمو. */
  __reset: () => {
    state = blank();
    save();
  },
};
