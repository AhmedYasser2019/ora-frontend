import assert from "node:assert";
import { latin, schemas } from "./auth-validation";

// أرقام عربية تُقبل وتُرسل لاتينية.
assert.equal(latin(" ٠١٠١٢٣٤٥٦٧٨ "), "01012345678");

const ok = {
  name: "أحمد",
  phone: "01012345678",
  email: "a@b.co",
  password: "12345678",
  confirm: "12345678",
};
assert.equal(schemas.signup.parse({ ...ok, phone: "٠١٠١٢٣٤٥٦٧٨" }).phone, "01012345678");
assert.equal(schemas.signup.safeParse({ ...ok, phone: "0101234567" }).success, false);
assert.deepEqual(schemas.resetEmail.parse({ email: " a@b.co " }), { email: "a@b.co" });
assert.equal(schemas.resetEmail.safeParse({ email: "a@" }).success, false);
assert.equal(schemas.signup.safeParse(ok).success, true);
assert.equal(schemas.demo.safeParse({ ...ok, phone: undefined }).success, true);

// عدم التطابق يظهر مع باقي الأخطاء، مش بعد ما تتصلح.
const bad = schemas.signup.safeParse({ ...ok, email: "x", confirm: "nope" });
assert.equal(bad.success, false);
const fields = bad.success ? {} : bad.error.flatten().fieldErrors;
assert.ok(fields.email && fields.confirm, JSON.stringify(fields));

assert.equal(
  schemas.signup.safeParse({ ...ok, password: "1234567", confirm: "1234567" }).success,
  false,
);
assert.equal(schemas.resetCode.safeParse({ code: "١٢٣٤" }).success, true);
assert.equal(schemas.resetCode.safeParse({ code: "123" }).success, false);
console.log("auth-validation ok");
