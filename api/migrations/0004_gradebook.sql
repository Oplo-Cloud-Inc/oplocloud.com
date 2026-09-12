-- ===========================================================================
-- The gradebook.
--
-- Two things a teacher does every day that this database could not express.
--
-- The first is the distinction between work that has not been marked yet and
-- work that was never handed in. Both were a NULL score, so the gradebook had
-- to guess, and every gradebook that guesses guesses the same way: it counts
-- the blank as nothing and quietly fails a student who is merely waiting on
-- their teacher. A status column ends the guessing.
--
--     marked    a mark, or a row waiting for one
--     missing   not handed in — counts as zero, because it is a zero
--     excused   left out of the divisor entirely, because it does not apply
--
-- "Excused" is the one that cannot be faked with a score. A student who was
-- ill for the test has not scored zero on it and has not scored full marks on
-- it either; the test simply is not part of their grade. Typing a number —
-- any number — says something false.
--
-- The second is history. A grade is the most consequential number a school
-- writes about a person, and until now it could be changed by anyone who
-- could write it, with no record that it had been. `learn_grade_events` makes
-- every change to every mark permanent and attributable: what it was, what it
-- became, who did it, and when. Nothing deletes from this table.
-- ===========================================================================

ALTER TABLE learn_grades ADD COLUMN status TEXT NOT NULL DEFAULT 'marked';

-- Every mark already in the table was entered as a mark, so 'marked' is the
-- correct backfill and the DEFAULT above has already applied it.

CREATE TABLE learn_grade_events (
  id            TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES learn_assignments(id) ON DELETE CASCADE,
  account_id    TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  -- Both sides of the change. Storing the old value rather than only the new
  -- one is what makes this an audit trail instead of a list of edits: the
  -- question asked after a dispute is "what was it before", and answering it
  -- by replaying the whole table from the beginning is not answering it.
  from_score    REAL,
  from_status   TEXT,
  to_score      REAL,
  to_status     TEXT,
  -- Why, when a teacher says why. A waived late penalty or a re-marked essay
  -- is a judgement, and a judgement without its reason is indistinguishable
  -- from a mistake six months later.
  note          TEXT,
  actor_id      TEXT REFERENCES accounts(id),
  at            INTEGER NOT NULL
);
CREATE INDEX idx_gradeev_pair ON learn_grade_events(assignment_id, account_id, at);
CREATE INDEX idx_gradeev_account ON learn_grade_events(account_id, at);
