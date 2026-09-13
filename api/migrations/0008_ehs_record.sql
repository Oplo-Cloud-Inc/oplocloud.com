-- ===========================================================================
-- Credit earned at Excel High School.
--
-- Until now a record held two things: a previous school's transcript, and the
-- marks OEdu's own gradebook computes. A student who was already enrolled at
-- EHS before OEdu existed had nowhere to keep the courses they finished there,
-- so their dashboard counted every transferred credit and none of the EHS
-- ones — and showed a student with 19 credits as having 14.
--
-- These rows are the registrar's record of EHS coursework, entered from EHS's
-- own academic record. They are separate from transfer credit on purpose:
-- EHS caps what may transfer and asks for a minimum to be earned with it, and
-- a credit can only be tested against either rule if the database knows which
-- side of the line it sits on.
--
-- `course_id` links a row to an OEdu course when the coursework was taught
-- here, and is empty for coursework that predates OEdu.
--
-- The program row gains the two facts an enrolled student's record carries
-- and an applicant's does not: their standing, and what EHS itself issued
-- (GPA, credits, the date the record was printed), kept verbatim so the
-- dashboard can check its own arithmetic against the school's.
-- ===========================================================================

CREATE TABLE learn_ehs_courses (
  id            TEXT PRIMARY KEY,
  account_id    TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  org_id        TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  course_id     TEXT REFERENCES learn_courses(id) ON DELETE SET NULL,
  position      INTEGER NOT NULL,
  school_year   TEXT,                          -- "2025-2026"
  term          TEXT,
  code          TEXT,                          -- EHS's own code: "EHS-MAGEOv2"
  title         TEXT NOT NULL,
  mark          TEXT,                          -- verbatim: "90.0", "P"
  mark_numeric  REAL,
  credits       REAL NOT NULL DEFAULT 0,       -- EHS credits, no conversion
  area          TEXT,                          -- the requirement area EHS files it under
  status        TEXT NOT NULL DEFAULT 'completed', -- completed | in_progress | withdrawn
  created_by    TEXT REFERENCES accounts(id),
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX idx_ehscourses_account ON learn_ehs_courses(account_id, position);

ALTER TABLE learn_student_programs ADD COLUMN status TEXT;        -- active | withdrawn | graduated
ALTER TABLE learn_student_programs ADD COLUMN issued_json TEXT;   -- what EHS issued: gpa, credits, printed on
