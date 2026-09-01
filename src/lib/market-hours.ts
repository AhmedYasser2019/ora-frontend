// سوق الذهب المصري: الأحد–الخميس، 10 ص – 5 م بتوقيت القاهرة.
const TZ = "Africa/Cairo";
const OPEN_HOUR = 10;
const CLOSE_HOUR = 17;
const OPEN_DAYS = [0, 1, 2, 3, 4]; // Sun–Thu
const DAY = 86400;
const WEEK = 7 * DAY;

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour12: false,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Seconds since Sunday 00:00 in Cairo local time. */
function secondsOfWeek(at: Date) {
  const p = new Map(fmt.formatToParts(at).map((x) => [x.type, x.value]));
  return (
    DAYS.indexOf(p.get("weekday") ?? "") * DAY +
    (Number(p.get("hour")) % 24) * 3600 +
    Number(p.get("minute")) * 60 +
    Number(p.get("second"))
  );
}

/**
 * ponytail: DST-naive — the countdown can be off by an hour for the few days
 * around a Cairo DST switch. Swap in a tz-aware date lib if that matters.
 */
export function marketStatus(at: Date = new Date()) {
  const now = secondsOfWeek(at);
  const opens = OPEN_DAYS.map((d) => d * DAY + OPEN_HOUR * 3600);

  const openNow = opens.some((o) => now >= o && now < o + (CLOSE_HOUR - OPEN_HOUR) * 3600);
  const secondsToOpen = Math.min(...opens.map((o) => (o - now + WEEK) % WEEK));

  return { openNow, secondsToOpen };
}

export function splitDuration(total: number) {
  return {
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
