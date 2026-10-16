-- ===========================================================================
-- Marking periods, posted grades, grade-change requests, attendance.
--
-- Until now every grade in this database was live: the number a student saw
-- today could differ from the one on last month's report card, because
-- nothing ever said "this one is the official one". A school's record is not
-- the running total, it is the number somebody posted at the end of the
-- period and somebody else locked.
--
--   learn_periods           a marking period: Q1, S1, Year. It moves one way,
--                           open -> grading -> posted -> locked.
--   learn_posted_grades     the official grade of one student in one course
--                           for one period, frozen with the parts that made
--                           it. Recomputing later never changes it.
--   learn_grade_changes     a request to change a posted grade. Once a period
--                           is posted the live marks can still move, but the
--                           record moves only when somebody with the
--                           authority approves it, and the decision is kept.
--   learn_attendance        one row per student, day, and course (or the
--                           whole day when course_id is null).
--
-- Defaults follow NYC public schools: percent scale, pass at 65. The passing
-- mark lives on the period so a school can change it without a deploy.
-- ===========================================================================

CREATE TABLE learn_periods (
  id         TEXT PRIMARY KEY,
  org_id     TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,                       -- Q1, Fall 2026, Year
  kind       TEXT NOT NULL DEFAULT 'quarter',     -- quarter | semester | year
  starts_on  TEXT NOT NULL,                       -- YYYY-MM-DD
  ends_on    TEXT NOT NULL,
  pass_mark  INTEGER NOT NULL DEFAULT 65,
  state      TEXT NOT NULL DEFAULT 'open',        -- open | grading | posted | locked
  posted_at  INTEGER,
  posted_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  locked_at  INTEGER,
  locked_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (org_id, name)
);

CREATE TABLE learn_posted_grades (
  id         TEXT PRIMARY KEY,
  period_id  TEXT NOT NULL REFERENCES learn_periods(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES learn_courses(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  percent    INTEGER,                             -- null: nothing to grade yet
  letter     TEXT,
  passing    INTEGER,                             -- 1 / 0, null with percent
  parts_json TEXT,                                -- the engine's breakdown
  posted_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  posted_at  INTEGER NOT NULL,
  UNIQUE (period_id, course_id, account_id)
);
CREATE INDEX idx_posted_account ON learn_posted_grades(account_id);
CREATE INDEX idx_posted_course ON learn_posted_grades(course_id, period_id);

CREATE TABLE learn_grade_changes (
  id            TEXT PRIMARY KEY,
  posted_id     TEXT NOT NULL REFERENCES learn_posted_grades(id) ON DELETE CASCADE,
  from_percent  INTEGER,
  to_percent    INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | denied
  requested_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  requested_at  INTEGER NOT NULL,
  decided_by    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  decided_at    INTEGER,
  decision_note TEXT
);
CREATE INDEX idx_gchange_status ON learn_grade_changes(status, requested_at);
CREATE INDEX idx_gchange_posted ON learn_grade_changes(posted_id);

CREATE TABLE learn_attendance (
  id         TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  course_id  TEXT REFERENCES learn_courses(id) ON DELETE CASCADE,  -- null: whole day
  day        TEXT NOT NULL,                       -- YYYY-MM-DD
  status     TEXT NOT NULL,                       -- present | absent | late | excused | cut
  note       TEXT,
  marked_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  marked_at  INTEGER NOT NULL
);
-- One answer per student, day and course. A null course is its own slot,
-- which a plain UNIQUE would not enforce (nulls never collide), so the two
-- cases are separate indexes.
CREATE UNIQUE INDEX uq_attendance_course ON learn_attendance(account_id, day, course_id)
  WHERE course_id IS NOT NULL;
CREATE UNIQUE INDEX uq_attendance_day ON learn_attendance(account_id, day)
  WHERE course_id IS NULL;
CREATE INDEX idx_attendance_day ON learn_attendance(day, status);
