-- ===========================================================================
-- The exam cycle: a board's grading, marks entered by the subject teacher,
-- checked, approved and published, a report card per child, and the parent
-- meeting that follows.
--
-- GRADING IS THE SCHOOL'S TO SAY. A board's bands and pass marks change (CBSE
-- announced a new scale; sources disagree on CISCE's pass marks), so a scale is
-- a row a school keeps, starting from a template and checked against its
-- board's current circular, not a rule written into this code. A scale with no
-- bands shows marks and percentage only.
--
-- A PAPER is one subject in one section for one exam: the unit a teacher enters
-- marks for and the unit that moves through the approvals. Once approved the
-- teacher can no longer change it; after it is published only the office can,
-- must say why, and the change is marked as made after publication, the way a
-- locked attendance span is.
-- ===========================================================================

CREATE TABLE learn_grading_scales (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  board        TEXT,                              -- CBSE | CISCE | STATE | IB | CAIE ...
  kind         TEXT NOT NULL DEFAULT 'scholastic',-- scholastic: bands by percent. coscholastic: grades given directly
  bands_json   TEXT NOT NULL DEFAULT '[]',        -- scholastic: [{min, grade, point?}] highest first. coscholastic: [{grade, label}]
  pass_percent REAL,                              -- per subject; null: the scale draws no pass line
  note         TEXT,                              -- where the bands come from and what the school checked them against
  created_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  UNIQUE (org_id, name)
);

CREATE TABLE learn_exams (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  school_year TEXT NOT NULL,                      -- 2026-2027
  name        TEXT NOT NULL,                      -- Term 1, Half-yearly, Annual
  kind        TEXT NOT NULL DEFAULT 'term',       -- term | periodic | annual | improvement
  scale_id    TEXT REFERENCES learn_grading_scales(id) ON DELETE SET NULL,
  coscale_id  TEXT REFERENCES learn_grading_scales(id) ON DELETE SET NULL,
  starts_on   TEXT,                               -- the span the card counts attendance over
  ends_on     TEXT,
  created_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at  INTEGER NOT NULL,
  UNIQUE (org_id, school_year, name)
);

CREATE TABLE learn_exam_papers (
  id            TEXT PRIMARY KEY,
  exam_id       TEXT NOT NULL REFERENCES learn_exams(id) ON DELETE CASCADE,
  class_id      TEXT NOT NULL REFERENCES learn_classes(id) ON DELETE CASCADE,
  subject       TEXT NOT NULL,
  teacher_id    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  max_theory    REAL NOT NULL DEFAULT 80,
  max_internal  REAL NOT NULL DEFAULT 20,
  max_practical REAL NOT NULL DEFAULT 0,
  state         TEXT NOT NULL DEFAULT 'entry',    -- entry | submitted | checked | approved | published
  submitted_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL, submitted_at INTEGER,
  checked_by    TEXT REFERENCES accounts(id) ON DELETE SET NULL, checked_at   INTEGER,
  approved_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL, approved_at  INTEGER,
  published_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL, published_at INTEGER,
  returned_note TEXT,                             -- why it was last sent back for another look
  created_at    INTEGER NOT NULL,
  UNIQUE (exam_id, class_id, subject)
);
CREATE INDEX idx_papers_class ON learn_exam_papers(class_id, exam_id);
CREATE INDEX idx_papers_teacher ON learn_exam_papers(teacher_id, state);

CREATE TABLE learn_exam_marks (
  paper_id   TEXT NOT NULL REFERENCES learn_exam_papers(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  theory     REAL,
  internal   REAL,
  practical  REAL,
  absent     INTEGER NOT NULL DEFAULT 0,          -- AB: did not sit it
  updated_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (paper_id, account_id)
);

-- Every change to a mark: what it was, what it became, who, in which state, and whether it was after approval.
CREATE TABLE learn_exam_mark_log (
  id         TEXT PRIMARY KEY,
  paper_id   TEXT NOT NULL REFERENCES learn_exam_papers(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  field      TEXT NOT NULL,                       -- theory | internal | practical | absent
  from_value TEXT,
  to_value   TEXT,
  by_id      TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  at         INTEGER NOT NULL,
  state      TEXT NOT NULL,                       -- the paper's state when it changed
  after_lock INTEGER NOT NULL DEFAULT 0,          -- 1: changed once approved
  why        TEXT
);
CREATE INDEX idx_markslog_paper ON learn_exam_mark_log(paper_id, at);
CREATE INDEX idx_markslog_lock ON learn_exam_mark_log(after_lock, at);

-- What the class teacher adds to a child's card: a remark and the result.
CREATE TABLE learn_exam_cards (
  exam_id    TEXT NOT NULL REFERENCES learn_exams(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  remark     TEXT,
  result     TEXT,                                -- promoted | detained | passed out | null: not decided
  updated_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (exam_id, account_id)
);

-- Co-scholastic grades (art, health and sport, discipline ...).
CREATE TABLE learn_exam_cos (
  exam_id    TEXT NOT NULL REFERENCES learn_exams(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  area       TEXT NOT NULL,
  grade      TEXT NOT NULL,
  PRIMARY KEY (exam_id, account_id, area)
);

-- The parent meeting that follows an exam: slots, booked by roll range or chosen by the family.
CREATE TABLE learn_ptm (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id     TEXT NOT NULL REFERENCES learn_classes(id) ON DELETE CASCADE,
  exam_id      TEXT REFERENCES learn_exams(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  day          TEXT NOT NULL,                     -- YYYY-MM-DD
  start_time   TEXT NOT NULL,                     -- HH:MM
  slot_minutes INTEGER NOT NULL,
  mode         TEXT NOT NULL DEFAULT 'roll',      -- roll: a slot per child in roll order. open: families choose
  created_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at   INTEGER NOT NULL
);
CREATE INDEX idx_ptm_class ON learn_ptm(class_id, day);

CREATE TABLE learn_ptm_slots (
  ptm_id     TEXT NOT NULL REFERENCES learn_ptm(id) ON DELETE CASCADE,
  slot_no    INTEGER NOT NULL,
  starts     TEXT NOT NULL,                       -- HH:MM
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,   -- the child the slot is for; null: free
  booked_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  booked_at  INTEGER,
  PRIMARY KEY (ptm_id, slot_no)
);
CREATE UNIQUE INDEX uq_ptm_child ON learn_ptm_slots(ptm_id, account_id) WHERE account_id IS NOT NULL;
