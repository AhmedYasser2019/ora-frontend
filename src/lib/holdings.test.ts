import assert from "node:assert";
import { holdingValue, totals, type Holding } from "./holdings";

const sell = { k24: 5000, k21: 4375, silver: 60 };
const h = (over: Partial<Holding>): Holding => ({
  id: "1",
  name: "س",
  karat: "k24",
  grams: 10,
  qty: 1,
  ...over,
});

// الكمية تُضرب في الوزن.
assert.equal(holdingValue(h({ qty: 2 }), sell), 100_000);
assert.equal(holdingValue(h({ karat: "silver", grams: 100 }), sell), 6000);

// الذهب والفضة يُفصلان، والإجمالي يجمعهما.
const t = totals([h({}), h({ id: "2", karat: "silver", grams: 100 })], sell);
assert.equal(t.gold, 50_000);
assert.equal(t.silver, 6000);
assert.equal(t.total, 56_000);
assert.equal(t.count, 2);

// بلا تكلفة مسجّلة لا ربح ولا نسبة.
assert.equal(t.gain, 0);
assert.equal(t.gainPct, 0);

// الربح ونسبته على المسجَّل فقط: العنصر بلا تكلفة لا يدخل البسط ولا المقام.
const t2 = totals([h({ cost: 40_000 }), h({ id: "2", grams: 5 })], sell);
assert.equal(t2.total, 75_000);
assert.equal(t2.cost, 40_000);
assert.equal(t2.gain, 10_000);
assert.equal(t2.gainPct, 0.25);
