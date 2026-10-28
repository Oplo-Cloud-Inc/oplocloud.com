/* ==========================================================================
   Entity search — what the top bar's field asks.

   The index is learn_search_docs / learn_search (migration 0060), kept by
   triggers. This turns what a person typed into an FTS5 expression made only
   of letters and digits (so nothing typed can be an operator), asks for the
   best few of each kind, and reads a class code like "X-C" as a class.

   Who sees what is decided here, once: school staff search the whole school; a
   teacher finds the children of the sections they are class teacher of, and
   classes, subjects and circulars; nobody else searches.
   ========================================================================== */

export const KINDS = ["student", "staff", "class", "subject", "circular"];
const PER_KIND = 5;
const MAX_TOKENS = 6;

/* "ya sh", "9876 54", "x-c" → '"ya"* "sh"*' ; null when there is nothing to look for. */
export function matchOf(raw) {
  // A phone number typed the way people write one ("+91 98765 43210") is one word in the index: its last ten digits.
  if (/^[\d\s+()\-]{7,}$/.test(String(raw || ""))) {
    const digits = String(raw).replace(/\D/g, "");
    if (digits.length >= 7) return `"${digits.slice(-10)}"*`;
  }
  const tokens = String(raw || "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, MAX_TOKENS);
  if (!tokens.length) return null;
  // Four digits may be the end of a phone or an APAAR number: the index holds those as "tz1234".
  const q = tokens.map((t) => `"${t}"*`);
  if (tokens.length === 1 && /^\d{4}$/.test(tokens[0])) return `${q[0]} OR "tz${tokens[0]}"`;
  return q.join(" ");
}

/* "X-C", "x c", "10b", "VIII-A", "KG A" → { grade: "X", section: "C" } ; null otherwise. */
export function classCode(raw) {
  const m = /^\s*(KG|LKG|UKG|NURSERY|[IVX]{1,5}|\d{1,2})\s*[-\s]?\s*([A-Za-z])\s*$/i.exec(String(raw || ""));
  return m ? { grade: m[1].toUpperCase(), section: m[2].toUpperCase() } : null;
}

const shape = (r) => {
  let meta = {};
  try { meta = JSON.parse(r.meta || "{}"); } catch { meta = {}; }
  return { id: r.ref, kind: r.kind, title: r.title, meta };
};

/* The person has already been shown to be allowed to search at all (the route did that). */
export async function search(ctx, { orgId, actorId, staff }, raw, wanted) {
  const kinds = (wanted && wanted.length ? KINDS.filter((k) => wanted.includes(k)) : KINDS);
  const match = matchOf(raw);
  const out = { q: String(raw || "").trim(), groups: [], class: null };
  if (!match) return out;

  const rows = await ctx.repo.searchDocs(orgId, kinds, match, PER_KIND, staff ? null : actorId);
  const byKind = Object.fromEntries(KINDS.map((k) => [k, []]));
  rows.forEach((r) => byKind[r.kind].push(shape(r)));

  // A class code opens the class: the class first, then the children seated in it.
  const code = kinds.includes("class") ? classCode(raw) : null;
  if (code) {
    const c = await ctx.repo.classByCode(orgId, code.grade, code.section);
    if (c) {
      const label = `${c.grade}-${c.section}`;
      const hit = { id: c.id, kind: "class", title: label, meta: { grade: c.grade, section: c.section, year: c.school_year, teacher: c.teacher || null } };
      byKind.class = [hit].concat(byKind.class.filter((x) => x.id !== c.id));
      out.class = { id: c.id, title: label };
      // A teacher's students stay the ones the match above already scoped to their own sections.
      if (staff && kinds.includes("student")) byKind.student = (await ctx.repo.studentsSeatedIn(c.id, PER_KIND)).map(shape);
    }
  }

  const classIds = byKind.class.map((x) => x.id);
  const seats = await ctx.repo.classSeatCounts(classIds);
  byKind.class.forEach((x) => { x.meta.students = seats[x.id] || 0; });

  out.groups = kinds.map((k) => ({ kind: k, items: byKind[k].slice(0, PER_KIND) })).filter((g) => g.items.length);
  return out;
}
