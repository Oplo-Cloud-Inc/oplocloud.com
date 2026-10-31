/* Notes Roxan keeps, and the web they form.

   A note can say who or what it is about ("Priya is my manager" is about You and
   Priya). Names that share a note are joined, and the joined names are the web:
   what the Memory page draws, and what decides which notes Roxan is shown first
   when there are more than it can be shown at once.

   No model is involved here: this is plain matching, so it can be explained
   and tested. */

export const YOU = "You";
const SELF = new Set(["you", "me", "i", "myself", "user", "the user", "self"]);
const keyOf = n => String(n).trim().toLowerCase();

export const words = s => String(s).toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)
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

/* ------------------------------------------------------------ Names */

// The names a note is about, spelled the way the web already spells them: "me" is You, and "priya" joins "Priya".
export function aboutNames(list, memories = []) {
  const known = new Map();
  for (const m of live(memories)) for (const n of m.about || []) known.set(keyOf(n), n);
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const t = String(raw).replace(/\s+/g, " ").trim().slice(0, 40);
    if (!t) continue;
    const name = SELF.has(keyOf(t)) ? YOU : known.get(keyOf(t)) || t;
    if (!out.some(x => keyOf(x) === keyOf(name))) out.push(name);
    if (out.length === 6) break;
  }
  return out;
}

const literal = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Does the text mention this name as a word of its own?
export const mentions = (text, name) => new RegExp(`(^|[^\\p{L}\\p{N}])${literal(String(name).trim())}($|[^\\p{L}\\p{N}])`, "iu").test(text);

/* ------------------------------------------------------------ The web */

// A dot for each name notes are about, a line where two names share a note. Notes about no one are "loose".
export function web(memories) {
  const nodes = new Map(), edges = new Map(), loose = [];
  for (const m of live(memories)) {
    const names = m.about || [];
    if (!names.length) { loose.push(m); continue; }
    for (const n of names) {
      const k = keyOf(n);
      if (!nodes.has(k)) nodes.set(k, { key: k, name: n, notes: [], links: new Set() });
      nodes.get(k).notes.push(m);
    }
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      const a = keyOf(names[i]), b = keyOf(names[j]);
      if (a === b) continue;
      const e = [a, b].sort().join("\u0000");
      edges.set(e, (edges.get(e) || 0) + 1);
      nodes.get(a).links.add(b);
      nodes.get(b).links.add(a);
    }
  }
  return { nodes: [...nodes.values()], edges: [...edges].map(([k, w]) => { const [a, b] = k.split("\u0000"); return { a, b, w }; }), loose };
}

// Where each dot goes: the best-connected name (You, if there is one) in the middle, what it is joined to around it, and so on outward.
// Fixed arithmetic, no physics, so the same notes always draw the same picture.
export function layout(w, width = 720, height = 520) {
  const at = new Map();
  if (!w.nodes.length) return at;
  const byKey = new Map(w.nodes.map(n => [n.key, n]));
  const first = [...w.nodes].sort((a, b) => (b.key === keyOf(YOU)) - (a.key === keyOf(YOU)) || b.links.size - a.links.size || b.notes.length - a.notes.length || a.name.localeCompare(b.name))[0];
  const cx = width / 2, cy = height / 2, TAU = Math.PI * 2;
  const depth = new Map([[first.key, 0]]);
  for (const queue = [first.key]; queue.length;) {
    const k = queue.shift();
    for (const n of byKey.get(k).links) if (!depth.has(n)) { depth.set(n, depth.get(k) + 1); queue.push(n); }
  }
  const apart = Math.max(0, ...depth.values()) + 1;                       // names joined to nothing here sit on the outer ring
  for (const n of w.nodes) if (!depth.has(n.key)) depth.set(n.key, apart);
  const rings = new Map();
  for (const n of w.nodes) rings.set(depth.get(n.key), [...(rings.get(depth.get(n.key)) || []), n]);

  const angle = new Map();
  const ringCount = Math.max(...rings.keys());
  for (const d of [...rings.keys()].sort((a, b) => a - b)) {
    const ring = rings.get(d);
    if (d === 0) { at.set(ring[0].key, { x: cx, y: cy }); continue; }
    const want = n => {                                                       // aim for the middle of the parents' angles
      const parents = [...n.links].filter(k => depth.get(k) === d - 1 && angle.has(k));
      if (!parents.length) return NaN;
      return Math.atan2(parents.reduce((s, k) => s + Math.sin(angle.get(k)), 0), parents.reduce((s, k) => s + Math.cos(angle.get(k)), 0));
    };
    const sorted = ring.map(n => ({ n, a: want(n) })).sort((p, q) => (Number.isNaN(p.a) - Number.isNaN(q.a)) || p.a - q.a || q.n.notes.length - p.n.notes.length || p.n.name.localeCompare(q.n.name));
    const gap = TAU / Math.max(sorted.length, 6);
    const start = -Math.PI / 2;
    let prev = -Infinity;
    sorted.forEach((s, i) => {
      const even = start + (TAU * i) / sorted.length;                         // evenly spaced unless a parent pulls it elsewhere
      let a = Number.isNaN(s.a) ? even : Math.min(Math.max(s.a, even - gap), even + gap);
      a = Math.max(a, prev + gap * 0.9);
      prev = a;
      s.n.angle = a;
    });
    const r = ringCount === 1 ? 0.74 : 0.34 + (0.66 * d) / ringCount;
    for (const { n } of sorted) {
      angle.set(n.key, n.angle);
      at.set(n.key, { x: cx + Math.cos(n.angle) * r * (width / 2 - 70), y: cy + Math.sin(n.angle) * r * (height / 2 - 40) });
    }
  }
  return at;
}

/* ------------------------------------------------------------ Choosing what Roxan is shown */

// Up to `max` notes: pinned first, then notes about names the message mentions, then notes about what those names are joined to,
// then notes that share words with it. With few notes, all of them, newest first.
export function pick(memories, query, max = 20) {
  const notes = live(memories);
  if (notes.length <= max) return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  const q = new Set(words(query));
  const named = new Set();
  for (const m of notes) for (const n of m.about || []) if (keyOf(n) !== keyOf(YOU) && mentions(query, n)) named.add(keyOf(n));
  const joined = new Set();
  for (const m of notes) {
    const names = (m.about || []).map(keyOf);
    if (names.some(k => named.has(k))) for (const k of names) if (!named.has(k) && k !== keyOf(YOU)) joined.add(k);
  }
  const score = m => {
    const names = (m.about || []).map(keyOf);
    return (m.pinned ? 1000 : 0) + (names.some(k => named.has(k)) ? 40 : names.some(k => joined.has(k)) ? 12 : 0) + words(m.text).filter(x => q.has(x)).length * 10;
  };
  return notes.sort((a, b) => score(b) - score(a) || b.updatedAt - a.updatedAt).slice(0, max);
}

// "known" when the note is already kept, "refused" when it was removed or dismissed before.
export function status(text, memories) {
  if (live(memories).some(m => similar(m.text, text))) return "known";
  if (memories.some(m => m.deleted && similar(m.text, text))) return "refused";
  return null;
}

// True when a new note rests on what the user wrote themself: it shares a real word with it, or is about someone they named.
export function grounded(note, said) {
  const s = new Set(words(said));
  return words(note.text).some(w => w.length > 3 && s.has(w)) || (note.about || []).some(n => keyOf(n) !== keyOf(YOU) && mentions(said, n));
}
