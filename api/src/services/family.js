/* ==========================================================================
   A student's family, and the school record beyond marks.

   What a guardian is to a student, and which parts of a school record are
   kept as the school enters them rather than computed. Nothing in this file
   derives a fact about a child: the sections below hold what the school
   stated, and a section nobody has written is empty, not estimated.
   ========================================================================== */

export const RELATIONSHIPS = ["parent", "guardian", "grandparent", "foster_parent", "relative", "other"];

/* Every section of the family view that the school can keep a record for.
   Guardians is not one: who a family is lives in learn_guardians, and a
   second copy of it in a free-text record would disagree with the first. */
export const RECORD_SECTIONS = [
  "grades", "assignments", "assessments", "reading_math",
  "promotion", "graduation", "pathways",
  "iep", "supports", "wellness", "attendance",
  "schedule", "transportation", "enrollment", "documents",
  "student", "emergency"
];

/* The shape of an entered record: a summary, labelled facts, one table and
   notes. Bounded so a record stays something a family reads on a phone. */
export const RECORD_LIMITS = {
  summary: 2000, notes: 4000,
  facts: 24, label: 80, value: 240,
  columns: 8, column: 40, rows: 200, cell: 240
};
