/* The bar for speaking first.

   When work finishes on its own, Roxan may have something to say. The model says
   how much it matters (1 nice to know, 2 worth knowing, 3 needs you), and this
   decides whether it is posted in the conversation and whether it pops up. The
   decision, and the reason for a "no", go in the activity log: a person can
   always see what was held back.

   Reminders and questions are not held to this bar. The person asked for the
   first and the second cannot go on without them. */
import { sha256 } from "./util.js";

// How many messages a day, and the lowest importance, for each setting.
export const LEVELS = {
  quiet: { min: 3, perDay: 2, label: "Quiet", hint: "Only what needs you." },
  balanced: { min: 2, perDay: 5, label: "Balanced", hint: "What is new and worth knowing." },
  active: { min: 1, perDay: 10, label: "Active", hint: "Everything useful it finds." },
};

const minutes = hhmm => { const [h, m] = String(hhmm).split(":").map(Number); return h * 60 + m; };
// Is this local time of day inside the quiet hours (which may cross midnight)?
export function inQuiet(quiet, hour, minute) {
  if (!quiet?.from || !quiet?.to) return false;
  const now = hour * 60 + minute, from = minutes(quiet.from), to = minutes(quiet.to);
  return from === to ? false : from < to ? now >= from && now < to : now >= from || now < to;
}

const norm = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/g, " ").trim();

// { post, toast, why }. `today` is how many unprompted messages went out since local midnight; `recent` the hashes of the last day's.
export async function decide({ importance, text, level = "balanced", quiet = false, today = 0, recent = [] }) {
  const rule = LEVELS[level] || LEVELS.balanced, imp = Math.min(3, Math.max(1, Math.round(Number(importance) || 1)));
  const h = await sha256(norm(text));
  if (recent.includes(h)) return { post: false, toast: false, why: "It said the same thing in the last day.", hash: h };
  if (imp < rule.min) return { post: false, toast: false, why: `It matters ${imp} of 3, and your setting (${rule.label}) wants ${rule.min}.`, hash: h };
  if (today >= rule.perDay && imp < 3) return { post: false, toast: false, why: `It has already told you ${today} times today, the most your setting (${rule.label}) allows.`, hash: h };
  return { post: true, toast: !quiet || imp === 3, why: quiet && imp < 3 ? "Posted without a pop-up, because it is quiet hours." : "New and worth telling.", hash: h };
}
