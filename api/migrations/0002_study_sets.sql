-- ===========================================================================
-- Study sets.
--
-- The last part of Oplo Learn that lived only in the browser. A teacher who
-- wrote a set could not give it to a class, and the console had to say so on
-- the screen where sets were written. This is the table that makes the
-- labelling unnecessary.
--
-- Terms are a table rather than a JSON blob on the set, and that is a
-- deliberate bet. A set is always read and written whole, so JSON would be
-- simpler today — but the questions this platform will be asked next are
-- "which term is the class worst at" and "which definition do students keep
-- confusing", and those are queries against terms, not against sets. A blob
-- would answer them by loading every set in the school and unpacking it in
-- application code.
-- ===========================================================================

CREATE TABLE learn_study_sets (
  id          TEXT PRIMARY KEY,
  org_id      TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  -- A set may belong to a course, or stand alone. Standing alone is what a
  -- teacher's personal vocabulary list is, and forcing it into a course would
  -- make people invent courses.
  course_id   TEXT REFERENCES learn_courses(id) ON DELETE SET NULL,
  code        TEXT NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT,
  -- course:  whoever is in the course it belongs to
  -- org:     anybody in the organization
  -- private: the author alone, until they are ready
  visibility  TEXT NOT NULL DEFAULT 'course',
  status      TEXT NOT NULL DEFAULT 'draft',      -- draft | published | archived
  created_by  TEXT REFERENCES accounts(id),
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE (org_id, code)
);
CREATE INDEX idx_sets_course ON learn_study_sets(course_id);
CREATE INDEX idx_sets_author ON learn_study_sets(created_by);

CREATE TABLE learn_study_terms (
  id         TEXT PRIMARY KEY,
  set_id     TEXT NOT NULL REFERENCES learn_study_sets(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  term       TEXT NOT NULL,
  definition TEXT NOT NULL,
  -- The fields that decide how hard a question can be asked about this term.
  -- A term with only a definition honestly caps at recognise/recall/explain;
  -- one with `why` and `example` supports more. They are optional because
  -- demanding them would mean nobody writes a set at all.
  why        TEXT,
  example    TEXT,
  hint       TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_terms_set ON learn_study_terms(set_id, position);
