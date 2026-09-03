import assert from "node:assert";
import { zakat } from "./zakat";

const k21 = 4000; // ج.م للجرام → نصاب الذهب 340,000
const silver = 50; // ج.م للجرام → نصاب الفضة 29,750

// النصاب على عيار 21 لا عيار 24: 90 جرامًا من عيار 21 تبلغ النصاب.
assert.equal(zakat(90 * k21, 0, k21, silver).due, 9000);
// دون النصاب فلا زكاة.
assert.equal(zakat(80 * k21, 0, k21, silver).due, 0);
// الفضة وحدها تُقوَّم بنصاب 595 جرامًا.
assert.equal(zakat(0, 600 * silver, k21, silver).nisab, 29750);
assert.equal(zakat(0, 600 * silver, k21, silver).due, 750);
assert.equal(zakat(0, 500 * silver, k21, silver).due, 0);
// وجود ذهب يعني الاحتكام لنصاب الذهب، والقيمتان تُضمّان.
assert.equal(zakat(10 * k21, 600 * silver, k21, silver).nisab, 340000);
assert.equal(zakat(10 * k21, 600 * silver, k21, silver).due, 0);
assert.equal(zakat(80 * k21, 600 * silver, k21, silver).due, 350000 * 0.025); // 8750
