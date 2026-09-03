import assert from "node:assert";
import { demoClient as db } from "./demo";

const rpc = (fn: string, args: Record<string, unknown>) => db.rpc(fn, args);

await db.auth.signInWithPassword({ email: "demo@ora.test", password: "x" });
const { data: sess } = await db.auth.getSession();
assert.ok(sess.session, "أي إيميل/باسورد يدخّل");

// الطلبات: البذرة + طلب جديد يتحسب بنفس قواعد السيرفر (رسوم توصيل 150 تحت 50 ألف).
const order = {
  p_full_name: "عميل",
  p_phone: "01000000000",
  p_fulfilment: "delivery",
  p_address: "٢٥ شارع طلعت حرب",
  p_payment_method: "wallet",
  p_items: [{ slug: "b10", title: "سبيكة", qty: 2, unit_price: 1000 }],
};
const cashBefore = (await db.from("wallets").select().eq().maybeSingle()).data.cash_balance;
const placed = (await rpc("place_order", order)).data!;
assert.equal(placed["total"], 2150);
assert.equal(placed["status"], "confirmed");
assert.equal(
  (await db.from("wallets").select().eq().maybeSingle()).data.cash_balance,
  cashBefore - 2150,
);

// الإلغاء يرد الفلوس، والتكرار مرفوض.
await rpc("cancel_order", { p_order_id: placed["id"] });
assert.equal((await db.from("wallets").select().eq().maybeSingle()).data.cash_balance, cashBefore);
assert.equal((await rpc("cancel_order", { p_order_id: placed["id"] })).error?.code, "ORD05");
assert.equal((await rpc("place_order", { ...order, p_items: [] })).error?.code, "ORD01");

// المحفظة: نفس حدود wallet_transact في SQL.
assert.equal(
  (await rpc("wallet_transact", { p_kind: "deposit", p_amount: 50 })).error?.code,
  "WLT03",
);
assert.equal(
  (await rpc("wallet_transact", { p_kind: "withdraw", p_amount: 1000 })).error?.code,
  "WLT06",
);
assert.equal(
  (await rpc("wallet_transact", { p_kind: "sell_gold", p_amount: 1, p_gram_price: 5000 })).error
    ?.code,
  "WLT06",
);
const w = (await rpc("wallet_transact", { p_kind: "buy_gold", p_amount: 2, p_gram_price: 5000 }))
  .data!;
assert.equal(w["gold_grams"], 7);
assert.equal(w["cash_balance"], cashBefore - 10_000);

db.__reset();
console.log("demo mode ok");
