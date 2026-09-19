-- ===========================================================================
-- Assessments, held where only the people they are set for can read them.
--
-- An exam's questions were a static file in the app, which meant anybody who
-- knew the address could read them before the sitting — and, because the
-- repository is published, anybody who read the repository. The questions are
-- the part of an assessment that has to stay private until it opens, so they
-- live here and leave only through GET /api/v1/assessments/:id, to a signed-in
-- student it was set for, once it has opened.
--
-- WHAT IS STORED. The spec a student is shown — stages, tasks, the policy that
-- governs the sitting — and nothing that could say whether a response is
-- right. The API refuses a spec carrying an answer, a key or a hint (see
-- services/assessments.js), so an answer cannot reach a browser by being
-- stored here by mistake. Scoring, when it exists, gets its own table that no
-- student route reads.
--
-- WHO IT IS FOR. One row per person, rather than a course, because the first
-- assessments are set for particular students — a make-up, an accommodation, a
-- student who joined late — and a course-wide audience is a list of rows like
-- any other.
--
-- A sitting itself — answers, timings, submission — is not here. It is the
-- student's own progress scope `exam:<id>`, which only they can write and
-- their teachers can read.
-- ===========================================================================

CREATE TABLE learn_assessments (
  id           TEXT PRIMARY KEY,                    -- a slug, and the sitting's scope name: exam:<id>
  org_id       TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  course_code  TEXT,
  title        TEXT NOT NULL,
  version      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',       -- draft | published | archived
  opens_at     INTEGER,                             -- null: open once published
  closes_at    INTEGER,                             -- null: no end to when it may be started
  spec_json    TEXT NOT NULL,                       -- what a student is shown; never an answer
  created_by   TEXT REFERENCES accounts(id),
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE TABLE learn_assessment_assignees (
  assessment_id  TEXT NOT NULL REFERENCES learn_assessments(id) ON DELETE CASCADE,
  account_id     TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  assigned_by    TEXT REFERENCES accounts(id),
  assigned_at    INTEGER NOT NULL,
  PRIMARY KEY (assessment_id, account_id)
);
CREATE INDEX idx_assessment_assignees_account ON learn_assessment_assignees(account_id);
