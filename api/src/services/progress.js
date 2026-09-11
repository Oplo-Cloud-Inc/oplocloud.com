/* ==========================================================================
   Progress, experience and streaks.

   The client may report what happened. It may not report what that was worth.

   That division is the whole file. A browser saying "the student answered a
   transfer question correctly with no hints" is a fact about an interaction,
   and the server can check it is well-formed and then price it. A browser
   saying "give me 5,000 XP" is a claim about a reward, and is refused — not
   because students are assumed to be cheating, but because a number anybody
   can set is a number that means nothing to everybody.

   So the award table lives here, on the server, and the client's copy in
   game.js is a preview of what it expects the server to say. When they
   disagree, the server is right.
   ========================================================================== */

import { ApiError } from "../lib/http.js";

/* Difficulty survived, not activity done — the same schedule the client
   previews, kept here as the authority. */
const BASE = { recognise: 6, recall: 10, explain: 16, apply: 20, transfer: 26 };

const RUN_CAPS = { match: 90, hunt: 90, hangman: 40, cardmatch: 70, test: 90, cards: 30 };

export function priceAnswer({ level, right, hints = 0, mastery = 0, gapDays = 0,
                              confidence = null, skipped = false }) {
  if (!BASE[level]) throw ApiError.badRequest("Unknown question level.", "level");
  if (!right) return skipped ? 2 : 0;

  let xp = BASE[level];
  const h = Math.max(0, Math.min(3, Number(hints) || 0));
  if (h >= 3) xp *= 0.2;
  else if (h === 2) xp *= 0.35;
  else if (h === 1) xp *= 0.6;

  // Re-proving something already known pays almost nothing. This is the
  // clause that makes farming an easy set pointless.
  const m = Math.max(0, Math.min(1, Number(mastery) || 0));
  if (m >= 0.9) xp *= 0.15;
  else if (m >= 0.72) xp *= 0.5;

  // Retention is the only thing here that cannot be faked in one sitting, so
  // it is the only real bonus. Capped, because a client controls the clock.
  const gap = Math.max(0, Math.min(30, Number(gapDays) || 0));
  if (gap >= 1) xp *= 1.5;

  if (confidence != null && Number(confidence) >= 2) xp *= 1.1;

  return Math.max(1, Math.round(xp));
}

export function priceRun(kind, stats = {}) {
  const cap = RUN_CAPS[kind];
  if (!cap) throw ApiError.badRequest("Unknown activity.", "kind");
  const total = Math.max(0, Number(stats.total) || 0);
  const right = Math.max(0, Math.min(total, Number(stats.right) || 0));
  const acc = total ? right / total : 0;

  let xp;
  switch (kind) {
    case "match":
      xp = 30 + Math.max(0, 60 - Math.max(0, Number(stats.seconds) || 60)) * 0.8;
      break;
    case "hunt":
      xp = 20 + Math.min(12, Math.max(0, Number(stats.found) || 0)) * 6;
      break;
    case "hangman":
      xp = stats.won ? 14 + Math.min(7, Math.max(0, Number(stats.lives) || 0)) * 4 : 3;
      break;
    case "cardmatch": xp = 25 + acc * 45; break;
    case "test":      xp = 20 + acc * 70; break;
    case "cards":     xp = 6 + Math.min(40, Math.max(0, Number(stats.known) || 0)) * 2; break;
    default:          xp = 0;
  }
  // Every activity is capped. Without this, a client reporting a Match run in
  // negative time would mint experience, and the shape of that bug is not one
  // to discover in production.
  return Math.max(0, Math.min(cap, Math.round(xp)));
}

/* The day an event belongs to, in the student's own timezone. A student in
   Los Angeles finishing at 11pm has studied today, and a streak computed in
   UTC would disagree with them — so the client sends its offset, and the
   server bounds it to the range real timezones occupy. */
export function localDay(at, offsetMinutes = 0) {
  const off = Math.max(-14 * 60, Math.min(14 * 60, Number(offsetMinutes) || 0));
  const d = new Date(at - off * 60000);
  return d.toISOString().slice(0, 10);
}

/* Computed from the ledger, never stored. A counter and a ledger can drift
   apart, and when they do only one of them can be recomputed from evidence. */
export function streakFrom(days, today) {
  if (!days || !days.length) return { current: 0, longest: 0 };

  const set = new Set(days);
  const step = (iso, by) => {
    const d = new Date(iso + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + by);
    return d.toISOString().slice(0, 10);
  };

  // A streak survives today being empty — the day is not over yet. It ends
  // when yesterday is also empty.
  let cursor = set.has(today) ? today : step(today, -1);
  let current = 0;
  while (set.has(cursor)) { current++; cursor = step(cursor, -1); }

  const sorted = [...set].sort();
  let longest = 0, run = 0, prev = null;
  for (const day of sorted) {
    run = (prev && step(prev, 1) === day) ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = day;
  }
  return { current, longest };
}

export const RANKS = [
  { at: 0,     name: "Beginner" },
  { at: 250,   name: "Student" },
  { at: 700,   name: "Apprentice" },
  { at: 1500,  name: "Journeyman" },
  { at: 3000,  name: "Practitioner" },
  { at: 5500,  name: "Scholar" },
  { at: 9000,  name: "Adept" },
  { at: 14000, name: "Master" }
];

export function rankFor(xp) {
  let at = RANKS[0], next = RANKS[1] || null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].at) { at = RANKS[i]; next = RANKS[i + 1] || null; }
  }
  const span = next ? next.at - at.at : 1;
  return {
    name: at.name, at: at.at, next: next ? next.name : null,
    toGo: next ? next.at - xp : 0,
    percent: next ? Math.min(100, Math.round(((xp - at.at) / span) * 100)) : 100
  };
}
