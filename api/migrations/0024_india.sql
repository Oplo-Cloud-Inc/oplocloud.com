-- ===========================================================================
-- India: the classes and student details an Indian school's office keeps.
--
-- THE REGION. A school says where it is with `organizations.region`. 'US' is
-- what every school was until now; 'IN' turns on the India places in the
-- administrator's console. Nothing else about a school changes with it.
--
-- A CLASS is the Indian school's unit: Class X-C, a grade and a section, with
-- a class teacher and a room, in a school year. It is not a course section
-- (learn_sections): a class is where a child sits all day and is marked in a
-- register; a course section is one subject taught to some of them.
--
-- WHAT THE OFFICE KEEPS about a child beyond the account, on one row, typed:
-- the numbers boards and the state ask for (APAAR, PEN), the consent the law
-- asks for, the family as the school writes it down (both parents), the house,
-- the category. Date of birth and address stay where they already are, in
-- account_contacts, so a child has one of each.
--
-- AADHAAR is never stored. A number typed in is reduced to its last four
-- digits before it is written, and a family that declines is recorded as
-- REFUSED: a school may not make it a condition of admission.
-- ===========================================================================

ALTER TABLE organizations ADD COLUMN region TEXT NOT NULL DEFAULT 'US';   -- US | IN

CREATE TABLE learn_classes (
  id               TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  school_year      TEXT NOT NULL,                  -- 2026-2027
  grade            TEXT NOT NULL,                  -- KG, I ... XII, as the school writes it
  section          TEXT NOT NULL,                  -- A, B, C
  programme        TEXT,                           -- ICSE, ISC / IB Diploma ...
  stream           TEXT,                           -- Science (PCM), Commerce ...
  class_teacher_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  room             TEXT,
  capacity         INTEGER,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  UNIQUE (org_id, school_year, grade, section)
);
CREATE INDEX idx_classes_org ON learn_classes(org_id, school_year);

CREATE TABLE learn_student_india (
  account_id       TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  org_id           TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id         TEXT REFERENCES learn_classes(id) ON DELETE SET NULL,
  admission_no     TEXT,
  admitted_on      TEXT,                           -- YYYY-MM-DD
  roll_no          INTEGER,
  gender           TEXT,                           -- M | F | O
  house            TEXT,
  category         TEXT,                           -- General | EWS/DG | SC | ST | OBC
  second_language  TEXT,
  blood_group      TEXT,
  apaar            TEXT,                           -- 12 digits, REFUSED or NOGEN; null while pending
  pen              TEXT,                           -- 11 digits
  aadhaar          TEXT,                           -- XXXX-XXXX-1234 or REFUSED; never the number
  consent_status   TEXT NOT NULL DEFAULT 'pending',-- verified | pending | withdrawn
  consent_method   TEXT,                           -- signed_form | digilocker | other
  consent_on       TEXT,
  consent_note     TEXT,
  transport        TEXT,                           -- Own / pickup, or a route
  pin              TEXT,                           -- 6 digits
  district         TEXT,
  state            TEXT,
  father_name      TEXT,
  father_phone     TEXT,
  mother_name      TEXT,
  mother_phone     TEXT,
  primary_contact  TEXT,                           -- Father | Mother | Guardian
  whatsapp         INTEGER,                        -- 1 opted in, 0 not, null not asked
  language         TEXT,                           -- the family's preferred language
  guardian_email   TEXT,
  updated_by       TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);
CREATE INDEX idx_india_org_class ON learn_student_india(org_id, class_id);
CREATE UNIQUE INDEX uq_india_admission ON learn_student_india(org_id, admission_no) WHERE admission_no IS NOT NULL;
CREATE UNIQUE INDEX uq_india_apaar ON learn_student_india(org_id, apaar) WHERE apaar GLOB '[0-9]*';
CREATE UNIQUE INDEX uq_india_pen ON learn_student_india(org_id, pen) WHERE pen IS NOT NULL;
