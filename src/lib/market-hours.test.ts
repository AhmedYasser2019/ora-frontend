import assert from "node:assert";
import { marketStatus, splitDuration } from "./market-hours";

// Cairo is UTC+2 in winter. 2026-01-04 is a Sunday.
const cairo = (iso: string) => new Date(`${iso}+02:00`);

assert.equal(marketStatus(cairo("2026-01-04T12:00:00")).openNow, true);
assert.equal(marketStatus(cairo("2026-01-04T09:59:59")).openNow, false);
assert.equal(marketStatus(cairo("2026-01-04T17:00:00")).openNow, false);
assert.equal(marketStatus(cairo("2026-01-09T12:00:00")).openNow, false); // Friday

// Friday noon → Sunday 10:00 = 1 day 22 hours.
assert.deepEqual(splitDuration(marketStatus(cairo("2026-01-09T12:00:00")).secondsToOpen), {
  days: 1,
  hours: 22,
  minutes: 0,
  seconds: 0,
});
// Sunday 09:00 → opens in an hour.
assert.equal(marketStatus(cairo("2026-01-04T09:00:00")).secondsToOpen, 3600);
