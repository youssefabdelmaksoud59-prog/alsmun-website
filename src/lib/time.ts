export const DEFAULT_TZ = process.env.CONFERENCE_TIMEZONE || "Africa/Cairo";

function tzOffsetMs(tz: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Convert "YYYY-MM-DDTHH:mm" wall-clock time in `tz` to a UTC Date. */
export function zonedToUtc(local: string, tz = DEFAULT_TZ): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let result = guess - tzOffsetMs(tz, new Date(guess));
  // Re-check once in case the guess landed on the other side of a DST change.
  result = guess - tzOffsetMs(tz, new Date(result));
  return new Date(result);
}

/** Convert a UTC Date to "YYYY-MM-DDTHH:mm" in `tz` (for datetime-local inputs). */
export function utcToZonedInput(date: Date, tz = DEFAULT_TZ): string {
  const local = new Date(date.getTime() + tzOffsetMs(tz, date));
  return local.toISOString().slice(0, 16);
}

export function formatTime(date: Date, tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatDay(date: Date, tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(date);
}

export function formatDateTime(date: Date, tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function dayKey(date: Date, tz = DEFAULT_TZ) {
  return utcToZonedInput(date, tz).slice(0, 10);
}
