-- ===========================================================================
-- The section is the roster.
--
-- An Indian school seats a child in a section (X-C) and keeps them there all
-- year: that is where the register is taken, where the roll number lives (a
-- number within the section, reshuffled every year), where the report card
-- and the parent meeting are by. 0024 made the class and put a child in one;
-- this keeps the child's PLACE IN EACH YEAR, so last year's X-C is still
-- known after the child moves up to XI-A, and adds what the office writes
-- down about a child that 0024 left out: special needs, migrant status, the
-- guardian when it is not a parent, the board roll number.
-- ===========================================================================

ALTER TABLE learn_student_india ADD COLUMN cwsn              INTEGER;   -- child with special needs: 1 yes, 0 no, null not asked
ALTER TABLE learn_student_india ADD COLUMN disability        TEXT;      -- the kind, as the family's certificate says it
ALTER TABLE learn_student_india ADD COLUMN udid              TEXT;      -- disability ID, when the family has one
ALTER TABLE learn_student_india ADD COLUMN migrant           INTEGER;   -- 1 a migrant family, 0 not, null not asked
ALTER TABLE learn_student_india ADD COLUMN mother_tongue     TEXT;
ALTER TABLE learn_student_india ADD COLUMN guardian_name     TEXT;      -- when the guardian is neither parent
ALTER TABLE learn_student_india ADD COLUMN guardian_phone    TEXT;
ALTER TABLE learn_student_india ADD COLUMN guardian_relation TEXT;
ALTER TABLE learn_student_india ADD COLUMN board_roll_no     TEXT;      -- the board's number for Class X / XII, not the school's roll
ALTER TABLE learn_student_india ADD COLUMN previous_school   TEXT;
ALTER TABLE learn_student_india ADD COLUMN left_on           TEXT;      -- YYYY-MM-DD the child left the school
ALTER TABLE learn_student_india ADD COLUMN left_reason       TEXT;

-- Two children cannot hold the same roll number in a section. A duplicate that
-- got in before this existed keeps its place and loses its number.
UPDATE learn_student_india SET roll_no = NULL
 WHERE roll_no IS NOT NULL AND class_id IS NOT NULL
   AND rowid NOT IN (SELECT MIN(rowid) FROM learn_student_india WHERE roll_no IS NOT NULL AND class_id IS NOT NULL GROUP BY class_id, roll_no);
CREATE UNIQUE INDEX uq_india_class_roll ON learn_student_india(class_id, roll_no) WHERE class_id IS NOT NULL AND roll_no IS NOT NULL;

-- Where each child sat, year by year. The current row of learn_student_india is
-- the open one here (left_on null); moving a child closes it and opens another.
CREATE TABLE learn_class_students (
  class_id   TEXT NOT NULL REFERENCES learn_classes(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  roll_no    INTEGER,
  joined_on  TEXT NOT NULL,                       -- YYYY-MM-DD
  left_on    TEXT,                                -- null while the child is in the section
  PRIMARY KEY (class_id, account_id)
);
CREATE INDEX idx_class_students_acct ON learn_class_students(account_id, joined_on);

INSERT INTO learn_class_students (class_id, account_id, roll_no, joined_on)
SELECT class_id, account_id, roll_no, COALESCE(admitted_on, date(created_at / 1000, 'unixepoch'))
  FROM learn_student_india WHERE class_id IS NOT NULL;
