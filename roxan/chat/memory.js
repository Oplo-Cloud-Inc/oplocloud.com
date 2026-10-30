/* Which remembered notes Roxan is shown with a message, and whether a new
   suggestion is something already known or already refused.

   No model is involved: a note is chosen when it is pinned, or shares words
   with what was just said, or was touched recently. */

const words = s => String(s).toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)
  .filter(w => w.length > 2).map(w => w.replace(/(ing|ed|es|s)$/, ""));

// True when two notes say about the same thing.
export function similar(a, b) {
  const A = new Set(words(a)), B = new Set(words(b));
  if (!A.size || !B.size) return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / (A.size + B.size - n) >= 0.75;
}

export const live = (memories, now = Date.now()) => memories.filter(m => !m.deleted && !(m.expiresAt && m.expiresAt <= now));

export function pick(memories, query, max = 20) {
  const notes = live(memories);
  if (notes.length <= max) return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  const q = new Set(words(query));
  const score = m => (m.pinned ? 1000 : 0) + words(m.text).filter(w => q.has(w)).length * 10;
  return notes.sort((a, b) => score(b) - score(a) || b.updatedAt - a.updatedAt).slice(0, max);
}

// "known" when the note is already kept, "refused" when it was removed or dismissed before.
export function status(text, memories) {
  if (live(memories).some(m => similar(m.text, text))) return "known";
  if (memories.some(m => m.deleted && similar(m.text, text))) return "refused";
  return null;
}
