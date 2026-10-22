import assert from "node:assert";
import { goldNisabGrams, zakat } from "./zakat";

const k21 = 4000; // ج.م للجرام → نصاب الذهب 97.14 × 4000 = 388,571
const k24 = 4571; // ج.م للجرام → نصاب الذهب 85 × 4571 = 388,535
const silver = 50; // ج.م للجرام → نصاب الفضة 29,750

// النصاب 85 جرامًا من عيار 24، وبعيار 21 يساوي 97.14 جرامًا.
assert.equal(goldNisabGrams(24), 85);
assert.equal(goldNisabGrams(21).toFixed(2), "97.14");
assert.equal(goldNisabGrams(18).toFixed(2), "113.33");
// 85 جرامًا من عيار 21 دون النصاب، و98 جرامًا فوقه.
assert.equal(zakat(85 * k21, 0, k21, 21, silver).due, 0);
assert.equal(zakat(98 * k21, 0, k21, 21, silver).due, 9800);
// 85 جرامًا من عيار 24 تبلغه.
assert.equal(zakat(85 * k24, 0, k24, 24, silver).due, 85 * k24 * 0.025);
assert.equal(zakat(84 * k24, 0, k24, 24, silver).due, 0);
// الفضة وحدها تُقوَّم بنصاب 595 جرامًا.
assert.equal(zakat(0, 600 * silver, k21, 21, silver).nisab, 29750);
assert.equal(zakat(0, 600 * silver, k21, 21, silver).due, 750);
assert.equal(zakat(0, 500 * silver, k21, 21, silver).due, 0);
// وجود ذهب يعني الاحتكام لنصاب الذهب، والقيمتان تُضمّان.
assert.equal(zakat(10 * k21, 600 * silver, k21, 21, silver).due, 0);
assert.equal(zakat(90 * k21, 600 * silver, k21, 21, silver).due, 390000 * 0.025);
