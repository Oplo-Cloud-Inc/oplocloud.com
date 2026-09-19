/* ==========================================================================
   Assessments — what a spec may contain, and the part of it a list shows.

   The standard these serve is docs/OEDU_ASSESSMENT_EXPERIENCE_SYSTEM.md. Two
   rules from it are enforced here rather than trusted to whoever publishes:

     §36  Nothing that could say whether a response is right is stored. A
          spec with an answer or a key in it — or, outside practice, a hint —
          is refused outright, so no route can ever hand one to a browser.
     §50  A spec is structured — stages of tasks, each with a response type —
          so the runtime can render it without knowing what it is about.
   ========================================================================== */

import { ApiError } from "../lib/http.js";

/* Field names that carry an answer in the formats teachers' tools export.
   Matched anywhere in the spec, at any depth, case-insensitively. */
const FORBIDDEN = /^(answer|answers|answerkey|answer_key|correct|correctanswer|correct_answer|correctindex|key|solution|solutions|rubric|markscheme|mark_scheme)$/i;
/* Hints help a student learn and are allowed where learning is the point
   (§24). Where performance is being measured (§25, §26) they are refused like
   an answer, because a hint is part of one. */
const HINTS = /^(hint|hints)$/i;
const LEARNING_MODES = ["FORMATIVE", "PRACTICE"];

const RESPONSE_TYPES = ["choice", "constructed"];
const MAX_TASKS = 200;

function findForbidden(value, path, hintsAllowed) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findForbidden(value[i], `${path}[${i}]`, hintsAllowed);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const k of Object.keys(value)) {
      if (FORBIDDEN.test(k) || (!hintsAllowed && HINTS.test(k))) return `${path}.${k}`;
      const hit = findForbidden(value[k], `${path}.${k}`, hintsAllowed);
      if (hit) return hit;
    }
  }
  return null;
}

/* Validate a spec for publishing under `id`, and return it as stored. */
export function normaliseSpec(spec, id) {
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
    throw ApiError.badRequest("spec must be an object.", "spec");
  }
  const mode = String((spec.policy && spec.policy.mode) || "CONTROLLED").toUpperCase();
  const hit = findForbidden(spec, "spec", LEARNING_MODES.includes(mode));
  if (hit) {
    throw ApiError.badRequest(
      `A published assessment never carries answers. Remove ${hit} — answers and keys ` +
      "are kept out of anything a student's browser can receive.", "spec");
  }
  if (spec.id !== undefined && spec.id !== id) {
    throw ApiError.badRequest("spec.id must match the assessment's id.", "spec");
  }
  if (typeof spec.title !== "string" || !spec.title.trim()) {
    throw ApiError.badRequest("spec.title is required.", "spec");
  }
  if (!spec.assessment_goal || typeof spec.assessment_goal !== "string") {
    // §3: no assessment without an identifiable purpose.
    throw ApiError.badRequest("spec.assessment_goal is required — what is this assessment for?", "spec");
  }
  if (!Array.isArray(spec.stages) || !spec.stages.length) {
    throw ApiError.badRequest("spec.stages must list at least one stage.", "spec");
  }
  const ids = new Set();
  let count = 0;
  spec.stages.forEach((stage, si) => {
    if (!Array.isArray(stage.tasks) || !stage.tasks.length) {
      throw ApiError.badRequest(`spec.stages[${si}] has no tasks.`, "spec");
    }
    stage.tasks.forEach((t, ti) => {
      const where = `spec.stages[${si}].tasks[${ti}]`;
      if (!t.id || typeof t.id !== "string") throw ApiError.badRequest(`${where}.id is required.`, "spec");
      if (ids.has(t.id)) throw ApiError.badRequest(`${where}.id "${t.id}" is used twice.`, "spec");
      ids.add(t.id);
      if (!Array.isArray(t.prompt) || !t.prompt.length) {
        throw ApiError.badRequest(`${where}.prompt is required.`, "spec");
      }
      const type = t.response && t.response.type;
      if (!RESPONSE_TYPES.includes(type)) {
        throw ApiError.badRequest(`${where}.response.type must be one of: ${RESPONSE_TYPES.join(", ")}.`, "spec");
      }
      if (type === "choice" && (!Array.isArray(t.response.options) || t.response.options.length < 2)) {
        throw ApiError.badRequest(`${where} needs at least two options.`, "spec");
      }
      count++;
    });
  });
  if (count > MAX_TASKS) throw ApiError.badRequest("That assessment has too many tasks.", "spec");
  return { ...spec, id };
}

export function taskCount(spec) {
  return (spec.stages || []).reduce((n, s) => n + ((s.tasks || []).length), 0);
}

/* What a list shows: everything a student needs to decide whether to begin —
   the rules included — and not one question. */
export function card(row) {
  let spec = {};
  try { spec = JSON.parse(row.spec_json); } catch { spec = {}; }
  return {
    id: row.id,
    version: row.version,
    title: row.title,
    course: spec.course || (row.course_code ? { code: row.course_code, name: row.course_code } : null),
    kind: spec.kind || "Assessment",
    summary: spec.summary || "",
    level: spec.level || null,
    policy: spec.policy || {},
    taskCount: taskCount(spec),
    status: row.status,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    updatedAt: row.updated_at
  };
}
