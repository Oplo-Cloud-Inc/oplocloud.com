-- ===========================================================================
-- The schedule: courses, sections, bell schedules, and the school's calendar.
--
-- A school thinks in two layers. A COURSE is a subject, "World History",
-- with a course number, credits, a GPA scale and a few flags about how it
-- appears on report cards and transcripts. A SECTION is one instance of it:
-- "period 3 World History by Ms. Ladas in room 17 with 27 students".
--
-- A section is the row OEdu has always kept in learn_courses: the roster,
-- the gradebook and the registers all hang from it, and none of them move.
-- What a section adds is kept beside it in learn_sections. A new layer above
-- it, learn_subjects, is the school's list of courses.
--
--   learn_subjects         the school's courses (Jupiter: "Courses")
--   learn_sections         a course row's schedule facts: which course it is
--                          an instance of, its number, room, capacity, and
--                          the periods it meets in
--   learn_bell_schedules   named days: Regular, Minimum day, A-day, Monday...
--   learn_bell_periods     the periods of a bell schedule, with optional times
--   learn_calendar         which bell schedule each weekday uses by default
--   learn_school_days      the dates that differ: a holiday, a staff day, a
--                          snow day, a Friday that runs the minimum schedule
--
-- Fees do not appear: OEdu does not do money.
-- ===========================================================================

CREATE TABLE learn_subjects (
  id               TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  number           TEXT NOT NULL,                  -- course number; never reused for another course
  title            TEXT NOT NULL,
  catalog_code     TEXT,                           -- the written curriculum it teaches from, if there is one
  extracurricular  INTEGER NOT NULL DEFAULT 0,
  show_online      INTEGER NOT NULL DEFAULT 1,     -- students and families see it
  count_attendance INTEGER NOT NULL DEFAULT 1,     -- off for clubs and sports
  on_report_cards  INTEGER NOT NULL DEFAULT 1,
  on_transcripts   INTEGER NOT NULL DEFAULT 1,
  college_credit   INTEGER NOT NULL DEFAULT 1,     -- counts in the unweighted GPA and credits for admissions
  requestable      INTEGER NOT NULL DEFAULT 0,     -- students may request it
  standards        TEXT,                           -- the set of objectives, for standards-based grading
  duration         TEXT NOT NULL DEFAULT 'year',   -- quarter | trimester | semester | year
  credits          REAL NOT NULL DEFAULT 0,
  max_credits      REAL,                           -- the most a student may earn by repeating it
  gpa              TEXT NOT NULL DEFAULT 'regular',-- regular | honors | ap
  position         INTEGER,                        -- order on report cards; 1 first, 100 last
  grad_req         TEXT,                           -- the graduation area it satisfies
  grades_json      TEXT,                           -- which grade levels may take it
  gender           TEXT,                           -- for the courses that are split by it
  capacity         INTEGER,                        -- default for its sections
  approval         INTEGER NOT NULL DEFAULT 0,     -- a staff member must recommend the student
  description      TEXT,
  retired          INTEGER NOT NULL DEFAULT 0,
  created_by       TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  UNIQUE (org_id, number)
);
CREATE INDEX idx_subjects_org ON learn_subjects(org_id, retired);

CREATE TABLE learn_sections (
  course_id    TEXT PRIMARY KEY REFERENCES learn_courses(id) ON DELETE CASCADE,
  subject_id   TEXT REFERENCES learn_subjects(id) ON DELETE SET NULL,
  section_no   TEXT,
  tab          TEXT,                               -- the short label in a teacher's gradebook
  room         TEXT,
  capacity     INTEGER,                            -- overrides the course's
  periods_json TEXT NOT NULL DEFAULT '[]',         -- ["3"], or ["M1","T5"]: empty means not placed in a period
  updated_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX idx_sections_subject ON learn_sections(subject_id);

CREATE TABLE learn_bell_schedules (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  minimum_day INTEGER NOT NULL DEFAULT 0,          -- a short day: counts as a half day when there are not enough minutes
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  UNIQUE (org_id, name)
);

CREATE TABLE learn_bell_periods (
  id          TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES learn_bell_schedules(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,                       -- "1", "A3", "8:30-9:30", "Lunch"
  starts_at   TEXT,                                -- "08:30", optional
  ends_at     TEXT,
  kind        TEXT NOT NULL DEFAULT 'class',       -- class | other (lunch, advisory, recess)
  position    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_bellperiods_schedule ON learn_bell_periods(schedule_id, position);

CREATE TABLE learn_calendar (
  org_id       TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  pattern_json TEXT NOT NULL,                      -- { "1": scheduleId, "6": null }: weekday 0 (Sunday) to 6
  year_start   TEXT,
  year_end     TEXT,
  updated_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at   INTEGER NOT NULL
);

CREATE TABLE learn_school_days (
  org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,                       -- YYYY-MM-DD
  kind        TEXT NOT NULL,                       -- school | holiday | staff | canceled
  schedule_id TEXT REFERENCES learn_bell_schedules(id) ON DELETE SET NULL,
  label       TEXT,
  PRIMARY KEY (org_id, day)
);
