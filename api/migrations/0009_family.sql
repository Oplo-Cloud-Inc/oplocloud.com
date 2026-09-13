-- ===========================================================================
-- A student's family, and the school record beyond marks.
--
-- Three things a family portal needs that this database could not say.
--
-- WHO THE FAMILY IS. A guardian is an Oplo Account like anybody else — one
-- person, one sign-in, whatever else they are in Oplo — and what makes them a
-- student's guardian is a row here, not a role. The role (`learn.guardian`)
-- only tells the product which front door to show them. The row is what the
-- guard asks about on every request, so a link an administrator removes stops
-- working on the next request rather than when a session happens to expire.
--
-- HOW TO REACH THEM. A phone number and a mailing address belong to the
-- person, not to the product and not to one child, which is why
-- `account_contacts` is a platform table. A parent of two students has one
-- phone number.
--
-- WHAT THE SCHOOL KEEPS THAT IS NOT A MARK. Attendance, a schedule, supports,
-- transportation, an emergency contact. None of these is computed; each is
-- entered by the school, section by section, and shown to a family exactly as
-- entered. One row per section rather than a table per section, because the
-- school decides what an attendance record looks like and a schema that
-- decides it for them is a schema that is wrong in the first district it
-- meets. The shape is fixed — a summary, labelled facts, one table, notes —
-- and the content is theirs.
--
-- A contact card is kept for anybody the school has to reach — a family, and
-- the student too — and it is kept here, beside the person, never beside a
-- mark: migration 0003's transcript tables still have no column for a date of
-- birth or an address. The card is shown whole to the person, to their family
-- and to administrators; a teacher sees the phone numbers and nothing else.
-- ===========================================================================

CREATE TABLE learn_guardians (
  id            TEXT PRIMARY KEY,
  guardian_id   TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  student_id    TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  org_id        TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  relationship  TEXT NOT NULL DEFAULT 'parent',   -- parent | guardian | grandparent | foster_parent | relative | other
  label         TEXT,                             -- as the family says it: "Father"
  is_primary    INTEGER NOT NULL DEFAULT 0,
  created_by    TEXT REFERENCES accounts(id),
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  UNIQUE (guardian_id, student_id)
);
CREATE INDEX idx_guardians_student ON learn_guardians(student_id);

CREATE TABLE account_contacts (
  account_id      TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  mailing_address TEXT,
  cell_phone      TEXT,
  alt_phone       TEXT,
  date_of_birth   TEXT,                           -- YYYY-MM-DD, as the person gave it
  updated_by      TEXT REFERENCES accounts(id),
  updated_at      INTEGER NOT NULL
);

CREATE TABLE learn_student_records (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  org_id      TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  section     TEXT NOT NULL,                      -- attendance | schedule | iep | ...
  body_json   TEXT NOT NULL,                      -- { summary, facts, rows, notes }
  updated_by  TEXT REFERENCES accounts(id),
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE (account_id, section)
);
CREATE INDEX idx_studentrecords_account ON learn_student_records(account_id);
