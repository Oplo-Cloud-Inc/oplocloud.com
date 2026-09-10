/* ==========================================================================
   Study sets.

   Two rules, and both exist because of what happens downstream rather than
   because of anything about the data.

   The first is the minimum: four complete terms. Every game and every
   question type in Learn needs distractors — three wrong answers drawn from
   the same set — and a set of two cannot supply them. Accepting a set of two
   would mean accepting a set that silently breaks half the app the first time
   a student opens it.

   The second is what a term supports. A term with a definition can be asked
   at recognise, recall and explain. Apply and transfer need a worked case,
   and a set without them is honestly capped rather than quietly asked
   questions it cannot answer. `levelsFor` says which, and it is returned to
   the client so the authoring screen can tell somebody what they have made
   instead of leaving them to discover the ceiling.
   ========================================================================== */

import { ApiError, check } from "../lib/http.js";

export const MIN_TERMS = 4;
export const MAX_TERMS = 300;

export function normaliseTerms(input) {
  if (!Array.isArray(input)) {
    throw ApiError.badRequest("terms must be a list.", "terms");
  }
  if (input.length > MAX_TERMS) {
    throw ApiError.badRequest(`A set may hold at most ${MAX_TERMS} terms.`, "terms");
  }

  const out = [];
  const seen = new Set();
  input.forEach((row, i) => {
    if (!row || typeof row !== "object") {
      throw ApiError.badRequest(`Term ${i + 1} is not an object.`, "terms");
    }
    const term = check.string(row.term, `terms[${i}].term`, { max: 200 });
    const definition = check.string(row.definition, `terms[${i}].definition`, { max: 2000 });

    // Two terms with the same word make an unanswerable question: the student
    // is shown a definition and two correct options.
    const key = term.toLowerCase();
    if (seen.has(key)) {
      throw ApiError.conflict(`“${term}” appears twice. Each term must be distinct.`, "terms");
    }
    seen.add(key);

    out.push({
      term,
      definition,
      why: row.why ? check.string(row.why, `terms[${i}].why`, { min: 0, max: 1000 }) : null,
      example: row.example ? check.string(row.example, `terms[${i}].example`, { min: 0, max: 1000 }) : null,
      hint: row.hint ? check.string(row.hint, `terms[${i}].hint`, { min: 0, max: 500 }) : null
    });
  });

  if (out.length < MIN_TERMS) {
    throw ApiError.badRequest(
      `A set needs at least ${MIN_TERMS} complete terms — the games need something to ` +
      `choose between.`, "terms");
  }
  return out;
}

/* What can honestly be asked about this term. Returned rather than inferred
   on the client, so the authoring screen and the question builder cannot
   disagree about what a set supports. */
export function levelsFor(term) {
  const levels = ["recognise", "recall", "explain"];
  if (term.example && term.why) levels.push("apply");
  return levels;
}

export function setDepth(terms) {
  if (!terms.length) return { deepest: "recognise", full: 0, thin: terms.length };
  let full = 0;
  for (const t of terms) if (levelsFor(t).includes("apply")) full++;
  return {
    deepest: full === terms.length ? "apply" : full ? "apply" : "explain",
    full,
    thin: terms.length - full
  };
}

/* A sentence for the authoring screen. Saying "12 terms saved" tells an
   author nothing about what they have built; saying which of them can carry a
   hard question tells them what to do next. */
export function describe(terms) {
  const d = setDepth(terms);
  if (!terms.length) return "Empty.";
  if (d.full === terms.length) {
    return `${terms.length} terms, every one with a worked case — this set can be asked ` +
           `at every level up to apply.`;
  }
  if (d.full === 0) {
    return `${terms.length} terms. Recognition, recall and explanation only: adding a ` +
           `reason and an example to a term lets Learn ask it as a case to work through.`;
  }
  return `${terms.length} terms, ${d.full} with a worked case. The other ${d.thin} are ` +
         `capped at explanation until they get a reason and an example.`;
}
