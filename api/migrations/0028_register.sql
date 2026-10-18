-- ===========================================================================
-- The class register, and the lock on it.
--
-- An Indian school's morning register is one mark per child per day (a row of
-- learn_attendance with no course), taken by the class teacher. This adds what
-- such a register carries (why a child was away) and what the law asks of it:
--
--   * a child under 75% cannot sit a board exam, so the attendance behind that
--     list is a legal record. Once the school has SENT a list it LOCKS the days
--     it covered (learn_attendance_locks). After that nobody edits a mark in
--     them without saying why, only the office may, and every such edit is
--     marked in the history as made after the lock, because an edit after a
--     shortfall is reported is how manipulation is found.
-- ===========================================================================

ALTER TABLE learn_attendance ADD COLUMN reason TEXT;              -- sick | family | travel | religious | other; for a mark that says away

ALTER TABLE learn_attendance_log ADD COLUMN from_reason TEXT;
ALTER TABLE learn_attendance_log ADD COLUMN to_reason   TEXT;
ALTER TABLE learn_attendance_log ADD COLUMN after_lock  INTEGER NOT NULL DEFAULT 0;   -- 1: made inside a locked span
ALTER TABLE learn_attendance_log ADD COLUMN why         TEXT;                         -- what the editor said, when the span was locked

CREATE TABLE learn_attendance_locks (
  id        TEXT PRIMARY KEY,
  org_id    TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_day  TEXT NOT NULL,                        -- YYYY-MM-DD, inclusive
  to_day    TEXT NOT NULL,
  label     TEXT NOT NULL,                        -- "Board eligibility list, 1 January 2027"
  locked_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  locked_at INTEGER NOT NULL
);
CREATE INDEX idx_attlocks_org ON learn_attendance_locks(org_id, from_day, to_day);

-- Whole-day register reads: a child's whole-day marks over a span.
CREATE INDEX idx_attendance_wholeday ON learn_attendance(account_id, day) WHERE course_id IS NULL;
