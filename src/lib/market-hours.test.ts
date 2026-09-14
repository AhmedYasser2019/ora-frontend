import assert from "node:assert";
import { secondsToNext, splitDuration, type Market } from "./market-hours";

const closed: Market = {
  open: false,
  server_time: "2026-01-09T12:00:00+02:00", // Friday
  opens_at: "2026-01-10T10:00:00+02:00",
  closes_at: null,
};
const now = Date.parse(closed.server_time);

// Friday noon → Saturday 10:00 = 22 hours.
assert.equal(secondsToNext(closed, 0, now), 22 * 3600);
// Device clock five minutes behind the server: still counts against the server's clock.
assert.equal(secondsToNext(closed, 300_000, now - 300_000), 22 * 3600);
// Open → counts to closes_at.
assert.equal(
  secondsToNext(
    {
      open: true,
      server_time: "2026-01-10T21:00:00+02:00",
      opens_at: null,
      closes_at: "2026-01-10T22:00:00+02:00",
    },
    0,
    Date.parse("2026-01-10T21:00:00+02:00"),
  ),
  3600,
);
// Past the target never goes negative.
assert.equal(secondsToNext(closed, 0, now + 23 * 3600_000), 0);

assert.deepEqual(splitDuration(22 * 3600 + 61), { days: 0, hours: 22, minutes: 1, seconds: 1 });
