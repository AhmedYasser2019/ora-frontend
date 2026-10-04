import assert from "node:assert";
import { room, shortLines, upsert, type Line } from "./cart";
import type { Product } from "./catalog.server";

const line = (sku: string, quantity: number): Line => ({ product: { sku }, quantity });

// سطر جديد يتصدّر القائمة، والقديم يبقى.
assert.deepEqual(upsert([line("A", 1)], "B", 2), [line("B", 2), line("A", 1)]);

// سطر موجود تُضبط كميته ولا يُكرَّر ولا يتحرك مكانه.
assert.deepEqual(upsert([line("A", 1), line("B", 3)], "A", 7), [line("A", 7), line("B", 3)]);

// لا تعديل على المصفوفة الأصلية — react-query تقارن بالمرجع.
const before = [line("A", 1)];
upsert(before, "A", 9);
assert.deepEqual(before, [line("A", 1)]);

// سطر يطلب أكثر من المتاح يُعلَّم، وما يساويه لا يُعلَّم، والقطعة الغائبة من الكتالوج تُترك.
const shelf = [
  { slug: "A", stock: 10 },
  { slug: "B", stock: 3 },
] as Product[];
assert.deepEqual(
  shortLines(
    [
      { slug: "A", qty: 40 },
      { slug: "B", qty: 3 },
      { slug: "C", qty: 5 },
    ],
    shelf,
  ).map((l) => [l.slug, l.product.stock]),
  [["A", 10]],
);

// ما تقبله السلة بعد ما فيها: 30 على الرف و7 في السلة تترك 23، ولا سالب، وحد السلة 99.
assert.equal(room(30, 7), 23);
assert.equal(room(30, 30), 0);
assert.equal(room(5, 9), 0);
assert.equal(room(500, 0), 99);
