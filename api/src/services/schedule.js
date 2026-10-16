/* ==========================================================================
   The school's calendar, as rules.

   Which bell schedule a date runs, and whether it is a school day at all, is
   answered here and nowhere else, so attendance, the timetable and the
   calendar screen cannot disagree about what Tuesday was.

   A date is decided in this order:
     1. a row in learn_school_days: a holiday, a staff day, a snow day, or a
        day set to a particular bell schedule (a Friday run as a minimum day,
        a Saturday that is a school day)
     2. outside the school year, when the school has set one: no school
     3. the weekday pattern: each weekday names the bell schedule it runs, or
        none, which is a day off

   With nothing set, Monday to Friday run the first bell schedule the school
   made, and the weekend is off.
   ========================================================================== */

export const DAY_KINDS = ["school", "holiday", "staff", "canceled"];

const weekdayOf = (day) => new Date(day + "T00:00:00Z").getUTCDay();   // 0 Sunday … 6 Saturday

export function defaultPattern(schedules) {
  const first = schedules.length ? schedules[0].id : "";
  return { "0": null, "1": first, "2": first, "3": first, "4": first, "5": first, "6": null };
}

/* The weekday pattern as stored, over the default so a missing weekday is the
   default's and never an error. */
export function patternOf(row, schedules) {
  const base = defaultPattern(schedules);
  if (!row || !row.pattern_json) return base;
  try {
    const stored = JSON.parse(row.pattern_json);
    for (const k of Object.keys(base)) if (k in stored) base[k] = stored[k];
  } catch { /* a pattern nobody can read is the default */ }
  return base;
}

/* What a date is. `overrides` is a Map of day → learn_school_days row. */
export function effectiveDay(day, pattern, overrides, year) {
  const o = overrides.get(day);
  if (o) {
    return { day, weekday: weekdayOf(day), kind: o.kind, scheduleId: o.kind === "school" ? (o.schedule_id || null) : null,
             label: o.label || null, source: "day" };
  }
  if (year && ((year.start && day < year.start) || (year.end && day > year.end))) {
    return { day, weekday: weekdayOf(day), kind: "none", scheduleId: null, label: "Outside the school year", source: "year" };
  }
  const sid = pattern[String(weekdayOf(day))];
  if (sid === null || sid === undefined) {
    return { day, weekday: weekdayOf(day), kind: "none", scheduleId: null, label: null, source: "pattern" };
  }
  return { day, weekday: weekdayOf(day), kind: "school", scheduleId: sid || null, label: null, source: "pattern" };
}

export const isSchoolDay = (e) => e.kind === "school";

/* The dates of a span, as text. Capped, because a span is a request. */
export function eachDate(from, to, cap = 400) {
  const out = [];
  for (let t = Date.parse(from + "T00:00:00Z"); t <= Date.parse(to + "T00:00:00Z") && out.length < cap; t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/* Periods of a schedule by label, for matching a section's periods to a day. */
export function labelsOf(periods) {
  return periods.filter((p) => p.kind !== "other").map((p) => p.label);
}

/* Does a section meet on a day? A section with no periods meets every school
   day; one with periods meets when the day's bell schedule has one of them.
   A school day with no bell schedule is a day nothing is known about, and
   sections are taken to meet. */
export function meets(sectionPeriods, dayEntry, scheduleLabels) {
  if (!dayEntry || dayEntry.kind !== "school") return false;
  if (!sectionPeriods || !sectionPeriods.length) return true;
  if (!dayEntry.scheduleId) return true;
  const labels = scheduleLabels.get(dayEntry.scheduleId) || [];
  return sectionPeriods.some((p) => labels.includes(p));
}

/* The five weekday copies of a schedule, the way a school with different
   periods on different days makes them: numbered periods take the day's
   letter (1 becomes M1, T1, W1, R1, F1); a period with a word for a name
   (Lunch) stays as it is. */
export const WEEKDAYS = [["Monday", "M", 1], ["Tuesday", "T", 2], ["Wednesday", "W", 3], ["Thursday", "R", 4], ["Friday", "F", 5]];
export function weekdayCopy(periods, letter) {
  return periods.map((p) => ({ ...p, label: /^\d+$/.test(p.label) ? letter + p.label : p.label }));
}
