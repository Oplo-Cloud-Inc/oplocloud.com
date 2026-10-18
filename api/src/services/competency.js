/* ==========================================================================
   Competencies: what a child can do, term by term.

   A level is 1 to 4 (beginning, developing, proficient, advanced) and "at grade
   level" is proficient or more. The list of competencies is the school's own;
   this file only does the sums that turn many ratings into "how many children
   are at grade level in each skill", which is the question a teacher needs
   answered and a mark out of a hundred cannot.

   Pure: no database, no clock. api/scripts/test-competency.mjs checks it.
   ========================================================================== */

import { GRADES } from "./india.js";

export const LEVELS = [[1, "Beginning"], [2, "Developing"], [3, "Proficient"], [4, "Advanced"]];
export const AT_LEVEL = 3;
export const levelName = (n) => (LEVELS.find((l) => l[0] === n) || [0, ""])[1];

export const STAGES = ["foundational", "preparatory", "middle", "secondary"];
/* NEP 2020's 5+3+3+4: foundational is the three years before Class I and Classes I and II; preparatory III to V; middle VI to VIII; secondary IX to XII. */
export function stageOf(grade) {
  const i = GRADES.indexOf(String(grade || "").toUpperCase() === "KG" ? "KG" : grade);
  if (i < 0) return null;
  const n = i - GRADES.indexOf("I") + 1;
  return n <= 2 ? "foundational" : n <= 5 ? "preparatory" : n <= 8 ? "middle" : "secondary";
}

/* Ratings for one competency: how many at each level, how many rated, and the share at grade level. */
export function summarise(levels, atLevel = AT_LEVEL) {
  const by = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let rated = 0;
  for (const l of levels) if (by[l] !== undefined) { by[l]++; rated++; }
  const at = Object.entries(by).filter(([k]) => +k >= atLevel).reduce((a, [, v]) => a + v, 0);
  return { rated, by, atLevel: at, percent: rated ? Math.round((at / rated) * 1000) / 10 : null };
}

/* Which of a child's competencies are still below grade level, at their latest rating: what the next teacher is handed. */
export function carryOver(rows, atLevel = AT_LEVEL) {
  const latest = new Map();
  for (const r of rows) {
    const k = r.competency_id, cur = latest.get(k);
    if (!cur || String(r.term) > String(cur.term)) latest.set(k, r);
  }
  return [...latest.values()].filter((r) => r.level < atLevel);
}

export function cleanLevel(v, fail) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 4) fail("A level is 1 (beginning) to 4 (advanced).", "level");
  return n;
}
