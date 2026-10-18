/* ==========================================================================
   The early-warning list: which children are drifting out of school, and why.

   A child who leaves school does not do it in a day. Attendance thins, marks
   fall, they are older than their class, they are a migrant family; and the
   risk is sharpest where children change school or stage (after Class V,
   VIII and X). This reads what the school already holds and says, for each
   child, which signals are on and what they add up to. It names its reasons:
   a list that says "high" without saying why is a list nobody trusts.

   It does not use fees. The school keeps none here, and a child is never
   flagged for what a family owes.

   Pure: no database, no clock. api/scripts/test-early.mjs checks it.
   ========================================================================== */

import { GRADES } from "./india.js";

const FIRST = GRADES.indexOf("I");

/* "VIII" → 8; a class below Class I (KG, Nursery…) → 0; anything else → null. */
export function classNumber(grade) {
  const i = GRADES.indexOf(String(grade || "").toUpperCase() === "KG" ? "KG" : grade);
  if (i < 0) return null;
  return i >= FIRST ? i - FIRST + 1 : 0;
}

/* Whole years on a day. */
export function ageOn(dob, ymd) {
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob || ""), b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
  if (!a || !b) return null;
  let age = +b[1] - +a[1];
  if (+b[2] < +a[2] || (+b[2] === +a[2] && +b[3] < +a[3])) age--;
  return age;
}

/* Where a child stands against their class: a Class VIII child is usually 13 on 31 March of the year the session starts. */
export function overAgeBy(dob, grade, sessionStartYear) {
  const n = classNumber(grade);
  if (n == null || n < 1) return 0;
  const age = ageOn(dob, `${sessionStartYear}-03-31`);
  return age == null ? 0 : Math.max(0, age - (n + 5));
}

/* The classes at the edge of a stage: the next class is where children change school. */
export const TRANSITIONS = { 5: "5→6", 8: "8→9", 10: "10→11" };
export const transitionOf = (grade) => TRANSITIONS[classNumber(grade)] || null;

const LEVELS = [["high", 6], ["medium", 3], ["low", 1]];

/* One child: their signals and what they add up to.
     standing   from services/register.js standing(): { status, percent, canMiss, recoverable }
     exams      published results, oldest first: [{ name, percent, passLine }]
     facts      { dob, grade, migrant, cwsn }    year: the session's first calendar year
     minDays    attendance says nothing until a child has this many marked days */
export const MIN_DAYS = 10;      // fewer marked days than this and a percentage is noise: a child absent on day one is not at 0%

export function assess({ standing, exams, facts, year, threshold = 75, minDays = MIN_DAYS }) {
  const signals = [];
  const add = (key, weight, text) => signals.push({ key, weight, text });
  if (standing && standing.total < minDays) standing = null;
  if (standing && standing.status === "below") {
    add("attendance", standing.recoverable === false ? 4 : 3, `Attendance ${standing.percent}%, under ${threshold}%` + (standing.recoverable === false ? "; cannot reach it even if present every day left" : ""));
  } else if (standing && standing.status === "watch") add("attendance", 1, `Attendance ${standing.percent}%, only ${Math.max(0, standing.canMiss)} days to spare`);

  const list = (exams || []).filter((e) => e.percent != null);
  const last = list[list.length - 1], prev = list[list.length - 2];
  if (last && last.percent + 1e-9 < (last.passLine == null ? 33 : last.passLine)) add("marks", 3, `${last.percent}% in ${last.name}, under the pass mark`);
  else if (last && prev && prev.percent - last.percent >= 15) add("marks-fall", 2, `Marks fell ${Math.round((prev.percent - last.percent) * 10) / 10} points, ${prev.name} to ${last.name}`);

  const over = facts ? overAgeBy(facts.dob, facts.grade, year) : 0;
  if (over >= 2) add("over-age", 2, `${over} years older than is usual for the class`);
  if (facts && facts.migrant === 1) add("migrant", 1, "Migrant family");
  if (facts && facts.cwsn === 1) add("cwsn", 1, "Child with special needs");

  const tr = facts ? transitionOf(facts.grade) : null;
  let score = signals.reduce((a, s) => a + s.weight, 0);
  if (tr && score > 0) { score += 1; signals.push({ key: "transition", weight: 1, text: `Moves up to a new stage next year (${tr}), where children are lost` }); }
  const level = (LEVELS.find(([, min]) => score >= min) || ["none"])[0];
  return { signals, score, level, transition: tr };
}
