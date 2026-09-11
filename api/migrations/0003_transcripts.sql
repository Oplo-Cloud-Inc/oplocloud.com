-- ===========================================================================
-- Diploma programs and transfer credit.
--
-- A student arriving from another school brings a record, and that record is
-- the most sensitive thing this database holds: marks, failures, exam scores,
-- a minor's academic history. So it lives here, behind sign-in, and nowhere
-- else — never in the site's files, never in the repository.
--
-- The tables keep only what a graduation dashboard and a registrar need. They
-- deliberately have no columns for a state student ID, a home address, a date
-- of birth, or special-education status. A column that does not exist is a
-- column that cannot leak.
--
-- Transferred credit is stored twice, on purpose: as the sending school
-- recorded it (`earned`, in that school's units) and as it counts here
-- (`ehs_credits`). The conversion is a judgement, and a judgement a registrar
-- must be able to see, check and override course by course.
-- ===========================================================================

CREATE TABLE learn_student_programs (
  id            TEXT PRIMARY KEY,
  account_id    TEXT NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  org_id        TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  program       TEXT,                          -- "High School Silver Program"
  track         TEXT NOT NULL DEFAULT '21.5',  -- a key into the graduation service's TRACKS
  grade_level   INTEGER,
  enrolled_at   INTEGER,
  expected_grad TEXT,                          -- YYYY-MM, as the school states it
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE learn_transfer_records (
  id            TEXT PRIMARY KEY,
  account_id    TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  org_id        TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  school        TEXT NOT NULL,
  authority     TEXT,                          -- "NYC Department of Education"
  school_code   TEXT,
  -- unofficial: a copy the family supplied. Useful for an estimate, and
  --             explicitly not accepted by the school for credit.
  -- official:   sent directly by the sending school.
  kind          TEXT NOT NULL DEFAULT 'unofficial',
  -- estimate → requested → received → evaluated
  status        TEXT NOT NULL DEFAULT 'estimate',
  credit_system TEXT NOT NULL,                 -- how the sending school counts credit
  printed_on    TEXT,
  summary_json  TEXT,                          -- attempted, earned, average, term averages
  created_by    TEXT REFERENCES accounts(id),
  evaluated_by  TEXT REFERENCES accounts(id),
  evaluated_at  INTEGER,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX idx_transfer_account ON learn_transfer_records(account_id);

CREATE TABLE learn_transfer_courses (
  id            TEXT PRIMARY KEY,
  record_id     TEXT NOT NULL REFERENCES learn_transfer_records(id) ON DELETE CASCADE,
  account_id    TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  school_year   TEXT,
  grade_level   INTEGER,
  term          TEXT,
  code          TEXT,
  title         TEXT NOT NULL,
  mark          TEXT,                          -- verbatim: "86", "P", "NC", "MP 65"
  mark_numeric  REAL,
  attempted     REAL NOT NULL DEFAULT 0,       -- in the sending school's units
  earned        REAL NOT NULL DEFAULT 0,
  area          TEXT,                          -- the requirement area it is proposed against
  flags         TEXT,                          -- comma-separated: weighted, not_averaged, recovered
  ehs_credits   REAL NOT NULL DEFAULT 0,       -- as it counts here
  decision      TEXT NOT NULL DEFAULT 'proposed', -- proposed | accepted | declined | review
  note          TEXT
);
CREATE INDEX idx_tcourses_record  ON learn_transfer_courses(record_id, position);
CREATE INDEX idx_tcourses_account ON learn_transfer_courses(account_id);

CREATE TABLE learn_transfer_exams (
  id         TEXT PRIMARY KEY,
  record_id  TEXT NOT NULL REFERENCES learn_transfer_records(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  sitting    TEXT,                             -- YYYY-MM
  score      REAL,
  status     TEXT                              -- passed | not_passed | below_65 | superseded
);
CREATE INDEX idx_texams_account ON learn_transfer_exams(account_id);
