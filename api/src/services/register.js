/* ==========================================================================
   The class register and the 75% rule.

   A board bars a child under 75% attendance from its exams, counted over the
   school year to a cutoff day. So the number that matters is not "what is the
   percentage" but "can this child still reach it": a child on 78% with ten
   days to go and a 40-day year has more to lose than one on 76% in March.
   `standing` answers both, from counts alone.

   Pure: no database, no clock. api/scripts/test-register.mjs checks it.
   ========================================================================== */

export const REASONS = [["sick", "Sick"], ["family", "Family event"], ["travel", "Travel"], ["religious", "Festival or religious"], ["other", "Other"]];
export const REASON_KEYS = REASONS.map((r) => r[0]);

/* What a mark says in an Indian school's morning register. Present, absent, late,
   and leave (the family sent a written application; a board counts it as an
   absence unless it is condoned). The first is the default for every child. */
export const IN_CODES = [
  { key: "present", label: "Present", mark: "P", kind: "present", adminOnly: false, retired: false },
  { key: "absent", label: "Absent", mark: "A", kind: "absent", adminOnly: false, retired: false },
  { key: "late", label: "Late", mark: "Lt", kind: "tardy", adminOnly: false, retired: false },
  { key: "leave", label: "On leave (application sent)", mark: "Lv", kind: "excused", adminOnly: false, retired: false }
];

export const THRESHOLD = 75;       // percent a board asks for
export const WATCH_MARGIN = 5;     // days a child can still miss before they are "on watch"

const round1 = (n) => Math.round(n * 10) / 10;

/* Counts to a standing. `c` is { attended, excused, absent } for the days the
   child was marked; `remaining` the school days left until the cutoff. */
export function standing(c, threshold = THRESHOLD, remaining = 0, margin = WATCH_MARGIN) {
  const attended = c.attended || 0, excused = c.excused || 0, absent = c.absent || 0;
  const total = attended + excused + absent;
  if (!total) return { total: 0, attended: 0, excused: 0, absent: 0, percent: null, status: "none", canMiss: null, mustAttend: null, condonable: false };
  const percent = round1((attended / total) * 100);
  const finalTotal = total + Math.max(0, remaining);
  const need = Math.ceil((threshold / 100) * finalTotal - 1e-9);
  const canMiss = attended + Math.max(0, remaining) - need;
  const status = percent < threshold ? "below" : canMiss <= margin ? "watch" : "ok";
  const withLeave = round1(((attended + excused) / total) * 100);
  return {
    total, attended, excused, absent, percent, percentWithLeave: withLeave, status,
    canMiss,                                           // school days they can still miss and finish at the threshold; negative: they cannot
    mustAttend: Math.max(0, need - attended),          // of the days left, how many they must be there for
    recoverable: canMiss >= 0,
    condonable: percent < threshold && withLeave >= threshold   // leave days condoned would bring them back
  };
}

/* The first and last day of the school year a day falls in, for a year that starts in `startMonth`. */
export function yearSpan(ymd, startMonth) {
  const y = +ymd.slice(0, 4), m = +ymd.slice(5, 7);
  const sy = m >= startMonth ? y : y - 1;
  const p = (n) => String(n).padStart(2, "0");
  const from = `${sy}-${p(startMonth)}-01`;
  const end = new Date(Date.UTC(sy + 1, startMonth - 1, 1) - 86400000).toISOString().slice(0, 10);
  return { from, to: end };
}

/* A status key to the kind it counts as, with the school's own codes. */
export function tally(rows, codes) {
  const kind = new Map(codes.map((c) => [c.key, c.kind]));
  const by = new Map();
  for (const r of rows) {
    const c = by.get(r.account_id) || { attended: 0, excused: 0, absent: 0 };
    const k = kind.get(r.status) || "absent";
    if (k === "present" || k === "tardy") c.attended += r.n;
    else if (k === "excused") c.excused += r.n;
    else if (k === "absent") c.absent += r.n;
    by.set(r.account_id, c);
  }
  return by;
}

/* Does a span touch a locked span? Returns the first lock it touches, or null. */
export function lockedBy(locks, day) {
  return locks.find((l) => day >= l.from_day && day <= l.to_day) || null;
}
