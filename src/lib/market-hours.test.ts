import assert from "node:assert";
import { marketStatus, splitDuration } from "./market-hours";

// Cairo is UTC+2 in winter. 2026-01-04 is a Sunday, 2026-01-05 a Monday.
const cairo = (iso: string) => new Date(`${iso}+02:00`);

assert.equal(marketStatus(cairo("2026-01-05T12:00:00")).openNow, true);
assert.equal(marketStatus(cairo("2026-01-05T09:59:59")).openNow, false);
assert.equal(marketStatus(cairo("2026-01-05T21:59:59")).openNow, true);
assert.equal(marketStatus(cairo("2026-01-05T22:00:00")).openNow, false);
assert.equal(marketStatus(cairo("2026-01-10T12:00:00")).openNow, true); // Saturday
assert.equal(marketStatus(cairo("2026-01-04T12:00:00")).openNow, false); // Sunday

// Sunday noon → Monday 10:00 = 22 hours.
assert.deepEqual(splitDuration(marketStatus(cairo("2026-01-04T12:00:00")).secondsToNext), {
  days: 0,
  hours: 22,
  minutes: 0,
  seconds: 0,
});
// Monday 09:00 → opens in an hour.
assert.equal(marketStatus(cairo("2026-01-05T09:00:00")).secondsToNext, 3600);
// Monday 21:00 → open, closes in an hour.
assert.equal(marketStatus(cairo("2026-01-05T21:00:00")).secondsToNext, 3600);
