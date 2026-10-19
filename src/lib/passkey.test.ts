import assert from "node:assert";
import { toB64u, toBytes } from "./passkey";

// user.id يصل من الخادم نصًّا hex ويعود من الجهاز كـ userHandle — لازم يرجع كما هو بالضبط.
const handle = "7f1c0a4e2b9d4c6e8a3f5b1d9e0c2a47";
assert.equal(toB64u(toBytes(handle).buffer), handle);

// كل البايتات، بما فيها ما يصير `-` و`_` في base64url، وبطول يحتاج حشوًا.
const bytes = Uint8Array.from({ length: 257 }, (_, i) => i % 256);
assert.deepEqual(toBytes(toB64u(bytes.buffer)), bytes);
