import assert from "node:assert";
import { safeNext } from "./use-auth";

// مسارات داخلية تمرّ كما هي.
for (const ok of ["/", "/wallet", "/orders/abc-123", "/collection?cat=bars"])
  assert.equal(safeNext(ok), ok, ok);

// كل ما قد يقرؤه المتصفح كعنوان موقع آخر يرجع للرئيسية.
for (const bad of [
  "//evil.com",
  "/\\evil.com",
  "/\\/evil.com",
  "/\t/evil.com",
  "/\n/evil.com",
  "https://evil.com",
  "javascript:alert(1)",
  "",
  undefined,
  42,
])
  assert.equal(safeNext(bad), "/", JSON.stringify(bad));

console.log("safe-next ok");
