import assert from "node:assert";
import { upsert, type Line } from "./cart";

const line = (sku: string, quantity: number): Line => ({ product: { sku }, quantity });

// سطر جديد يتصدّر القائمة، والقديم يبقى.
assert.deepEqual(upsert([line("A", 1)], "B", 2), [line("B", 2), line("A", 1)]);

// سطر موجود تُضبط كميته ولا يُكرَّر ولا يتحرك مكانه.
assert.deepEqual(upsert([line("A", 1), line("B", 3)], "A", 7), [line("A", 7), line("B", 3)]);

// لا تعديل على المصفوفة الأصلية — react-query تقارن بالمرجع.
const before = [line("A", 1)];
upsert(before, "A", 9);
assert.deepEqual(before, [line("A", 1)]);
