-- ===========================================================================
-- Reporting.
--
-- A report card is not a document this database needs to learn how to make.
-- Every number on one is already here: the marks, the weighting, the status of
-- work nobody handed in, and the history of every change. Assembling those on
-- request is a query, and a query does not need a table.
--
-- Exactly one thing on a report card is not in the database yet, and it is the
-- only part a teacher actually writes: the sentence about the student. Not
-- about one piece of work — `learn_grades.feedback` already carries that — but
-- about the term. That is what this table is for, and it is deliberately the
-- whole of what reporting adds to the schema.
--
-- ------------------------------------------------------------------- Terms
--
-- There is no marking-period model in this platform yet, so `term` is a plain
-- label a school chooses ("Q1", "Fall 2026") and `current` is what everything
-- writes until there is one. The column exists now because retrofitting a term
-- onto comments that were written without one means guessing which term each
-- belonged to, and a guess about which quarter a teacher meant is not a thing
-- anybody can check afterwards.
--
-- Publishing and locking a term need that model. This table is what they will
-- hang off when it arrives; it is not a substitute for it.
-- ===========================================================================

CREATE TABLE learn_report_comments (
  id         TEXT PRIMARY KEY,
  course_id  TEXT NOT NULL REFERENCES learn_courses(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  term       TEXT NOT NULL DEFAULT 'current',
  body       TEXT,
  -- The teacher who wrote it, kept separately from whoever edits it later, so
  -- a head of department fixing a typo does not become the author of somebody
  -- else's judgement about a child.
  author_id  TEXT REFERENCES accounts(id),
  updated_by TEXT REFERENCES accounts(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (course_id, account_id, term)
);
CREATE INDEX idx_reportcomment_account ON learn_report_comments(account_id, term);
