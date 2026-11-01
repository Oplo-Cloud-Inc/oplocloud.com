/* When a routine runs. A schedule is one of

     { kind: "once",  at }                     an instant
     { kind: "every", hours }                  every few hours, counted from the last run
     { kind: "daily", time: "HH:MM", days? }   at a wall-clock time in the person's time zone,
                                               on some days (0 = Sunday) or all of them

   Wall-clock times are turned into instants with the zone's own rules, so
   "08:00" stays 08:00 across a clock change. */
import { Invalid } from "./util.js";
import { WD, describe } from "../../roxan/chat/when.js";

export { describe };      // the page words a schedule the same way, from the same file
const formats = new Map();
const fmt = tz => {
  let f = formats.get(tz);
  if (!f) formats.set(tz, f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", weekday: "short", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }));
  return f;
};
export const zoneOk = tz => { try { fmt(tz); return typeof tz === "string" && tz.length < 64; } catch { return false; } };

export function parts(epoch, tz) {
  const o = {};
  for (const p of fmt(tz).formatToParts(new Date(epoch))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: WD.indexOf(o.weekday) };
}
const offset = (epoch, tz) => { const p = parts(epoch, tz); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(epoch / 1000) * 1000; };

// A wall-clock time in a zone, as an instant. Two passes settle it on either side of a clock change.
export function zoned(y, m, d, h, mi, tz) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - offset(guess, tz);
  return guess - offset(first, tz);
}

export function validate(raw, tz, now = Date.now()) {
  if (!raw || typeof raw !== "object") throw new Invalid("Say when it should run.");
  if (raw.kind === "once") {
    let at = raw.at;
    if (typeof at === "string") {
      const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(at);
      if (!m) throw new Invalid("Give the time as YYYY-MM-DDTHH:MM.");
      at = zoned(+m[1], +m[2], +m[3], +m[4], +m[5], tz);
    }
    if (!Number.isFinite(at)) throw new Invalid("Choose a date and time.");
    if (at < now + 30_000) throw new Invalid("Choose a time in the future.");
    return { kind: "once", at };
  }
  if (raw.kind === "every") {
    const hours = Math.round(Number(raw.hours));
    if (!(hours >= 1 && hours <= 168)) throw new Invalid("Repeat every 1 to 168 hours.");
    return { kind: "every", hours };
  }
  if (raw.kind === "daily") {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(raw.time));
    if (!m) throw new Invalid("Give the time as HH:MM.");
    const days = [...new Set((Array.isArray(raw.days) ? raw.days : []).map(Number).filter(d => d >= 0 && d <= 6))].sort();
    return days.length && days.length < 7 ? { kind: "daily", time: m[0], days } : { kind: "daily", time: m[0] };
  }
  throw new Invalid("Choose once, daily or every few hours.");
}

// The first run after `after`, or null when there is none (a once that has passed).
export function nextRun(s, after, tz) {
  if (s.kind === "once") return s.at > after ? s.at : null;
  if (s.kind === "every") return after + s.hours * 3_600_000;
  const [hh, mm] = s.time.split(":").map(Number), start = parts(after, tz);
  for (let i = 0; i < 9; i++) {
    const day = new Date(Date.UTC(start.y, start.m - 1, start.d + i));      // the calendar day i days on; its weekday is the same in any zone
    const at = zoned(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hh, mm, tz);
    if (at > after && (!s.days || s.days.includes(day.getUTCDay()))) return at;
  }
  return null;
}
