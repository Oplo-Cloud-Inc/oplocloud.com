-- ===========================================================================
-- Enrollment: from "I would like a place" to a student sitting in a course.
--
-- Admission is not enrollment, and a person is not a year of schooling. Three
-- things are kept apart, because each changes at its own pace:
--
--   the person        accounts, profiles, account_contacts, learn_guardians
--                     — permanent, one row per human, already here
--   the application   learn_applications — the workflow: one attempt to be
--                     admitted for one school year, with its documents, its
--                     review, its decision and a history nobody can rewrite
--   the enrollment    learn_enrollments — one school year of a student's
--                     life at the school, with effective dates, that exists
--                     only once an application was approved AND activated
--
-- A returning student has one account and a row here per year. An application
-- that is rejected leaves no enrollment behind and no half-made student.
--
-- Nothing here is finance. Fees, tuition and payment are not part of OEdu.
--
-- Timestamps are epoch milliseconds, as everywhere else. Calendar facts that
-- a person writes down — a date of birth, a joining date — are YYYY-MM-DD
-- text, as the person gave them, so no time zone can move them a day.
-- ===========================================================================

-- What a school asks for, per organization: its years and grades, which
-- documents are required for whom, the review checklist, the policy a family
-- consents to. JSON because it is configuration the school edits, read whole;
-- the rules that act on it live in services/enrollment.js. Defaults apply
-- when the row is absent, so a new school can start without setting anything.
CREATE TABLE learn_enrollment_settings (
  org_id         TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  body_json      TEXT NOT NULL,
  -- The next admission number. Taken with UPDATE … RETURNING so two
  -- administrators admitting at once never receive the same one.
  admission_next INTEGER NOT NULL DEFAULT 1,
  updated_by     TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at     INTEGER NOT NULL
);

CREATE TABLE learn_applications (
  id              TEXT PRIMARY KEY,
  org_id          TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  seq             INTEGER NOT NULL,             -- ENR-0001, per organization
  -- The permanent identity, once it is known: an existing student, or the
  -- account made at activation. Null for a new applicant until then.
  student_id      TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  school_year     TEXT NOT NULL,                -- 2026-2027
  entry_grade     TEXT NOT NULL,
  enrollment_type TEXT NOT NULL DEFAULT 'new',  -- new | returning | transfer
  -- Application status: draft | submitted | incomplete | under_review |
  -- changes_requested | awaiting_decision | waitlisted | admitted | rejected |
  -- withdrawn. Never mixed up with an enrollment's lifecycle, below.
  status          TEXT NOT NULL DEFAULT 'draft',
  -- Who the applicant is, as columns, because the queue searches and sorts on
  -- them. Everything else on the form is in body_json.
  legal_first     TEXT,
  legal_last      TEXT,
  preferred_name  TEXT,
  dob             TEXT,
  admission_no    TEXT,
  body_json       TEXT NOT NULL DEFAULT '{}',   -- guardians, contact, previous school, consents, restricted
  -- The reviewer's working papers: checklist, correction requests, how each
  -- possible duplicate was settled, overrides and why.
  review_json     TEXT NOT NULL DEFAULT '{}',
  assigned_to     TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  due_on          TEXT,
  intended_start  TEXT,
  decision        TEXT,                         -- admitted | rejected | waitlisted
  decision_reason TEXT,
  decision_note   TEXT,
  decided_by      TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  decided_at      INTEGER,
  -- Acceptance of an offer is its own fact, separate from the decision.
  offer_until     TEXT,
  acceptance      TEXT NOT NULL DEFAULT 'not_required',  -- not_required | pending | accepted | declined
  accepted_at     INTEGER,
  waitlisted_at   INTEGER,
  enrollment_id   TEXT,                         -- set when activated
  source          TEXT NOT NULL DEFAULT 'staff', -- staff | family
  -- A key the client makes once per "create", so a retried request finds the
  -- application it already made instead of making a second.
  client_key      TEXT,
  created_by      TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  submitted_at    INTEGER,
  closed_at       INTEGER,
  UNIQUE (org_id, seq)
);
CREATE INDEX idx_applications_year    ON learn_applications(org_id, school_year, status);
CREATE INDEX idx_applications_student ON learn_applications(student_id);
CREATE INDEX idx_applications_name    ON learn_applications(legal_last, legal_first);
CREATE INDEX idx_applications_dob     ON learn_applications(dob);
CREATE INDEX idx_applications_owner   ON learn_applications(created_by);
CREATE UNIQUE INDEX uq_applications_key ON learn_applications(created_by, client_key)
  WHERE client_key IS NOT NULL;

-- The checklist of one application. A file being attached is not the same as
-- the document being verified: `status` is the registrar's word, the file is
-- only what the family sent.
CREATE TABLE learn_application_documents (
  application_id TEXT NOT NULL REFERENCES learn_applications(id) ON DELETE CASCADE,
  key            TEXT NOT NULL,
  label          TEXT NOT NULL,
  required       INTEGER NOT NULL DEFAULT 1,
  sensitive      INTEGER NOT NULL DEFAULT 0,    -- readable by administrators only
  status         TEXT NOT NULL DEFAULT 'missing', -- missing | received | verified | returned | waived
  note           TEXT,
  file_id        TEXT,
  file_name      TEXT,
  file_type      TEXT,
  file_size      INTEGER,
  received_at    INTEGER,
  reviewed_by    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  reviewed_at    INTEGER,
  updated_at     INTEGER NOT NULL,
  PRIMARY KEY (application_id, key)
);

-- The files themselves, apart from the checklist so that listing an
-- application never carries a scan with it. Held as base64 text with a cap
-- the API enforces (D1 rows top out at 2 MB); a school that wants larger
-- scans needs object storage, which is a platform decision, not this table's.
CREATE TABLE learn_application_files (
  id             TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES learn_applications(id) ON DELETE CASCADE,
  doc_key        TEXT NOT NULL,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL,
  size           INTEGER NOT NULL,
  data           TEXT NOT NULL,
  uploaded_by    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  uploaded_at    INTEGER NOT NULL
);
CREATE INDEX idx_appfiles_app ON learn_application_files(application_id, doc_key);

-- The history. Insert-only: there is no route that updates or deletes a row,
-- and rows go only when their application goes. `internal` rows (notes, a
-- reviewer's reasoning) are never shown to a family.
CREATE TABLE learn_application_events (
  id             TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES learn_applications(id) ON DELETE CASCADE,
  at             INTEGER NOT NULL,
  actor_id       TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  actor_name     TEXT,                          -- as it was then
  kind           TEXT NOT NULL,                 -- status | field | document | note | assign | decision | check | duplicate | enrollment | sync
  from_value     TEXT,
  to_value       TEXT,
  field          TEXT,
  note           TEXT,
  internal       INTEGER NOT NULL DEFAULT 1,
  meta_json      TEXT
);
CREATE INDEX idx_appevents_app ON learn_application_events(application_id, at);

-- One school year of one student at the school.
--
--   state      what was decided: enrolled | suspended | transferred |
--              withdrawn | completed
--   starts_on  the day it takes effect — the status a person sees is derived
--   ends_on    from this and the state, so next month's student is not
--              "currently attending", and last year's is not "active"
--
-- `placements_json` and `sync_json` record what activation did downstream
-- (courses joined, family linked, records written) and what could not be
-- done yet. A failed step leaves a visible exception; it never un-enrols
-- anybody.
CREATE TABLE learn_enrollments (
  id              TEXT PRIMARY KEY,
  org_id          TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  student_id      TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  application_id  TEXT REFERENCES learn_applications(id) ON DELETE SET NULL,
  school_year     TEXT NOT NULL,
  grade           TEXT NOT NULL,
  enrollment_type TEXT NOT NULL DEFAULT 'new',
  state           TEXT NOT NULL DEFAULT 'enrolled',
  starts_on       TEXT NOT NULL,
  ends_on         TEXT,
  exit_reason     TEXT,
  exit_note       TEXT,
  previous_school TEXT,
  admission_no    TEXT,
  placements_json TEXT NOT NULL DEFAULT '[]',
  sync_json       TEXT NOT NULL DEFAULT '[]',
  sync_state      TEXT NOT NULL DEFAULT 'pending',  -- pending | done | exception
  created_by      TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE INDEX idx_enrollments_year    ON learn_enrollments(org_id, school_year, state);
CREATE INDEX idx_enrollments_student ON learn_enrollments(student_id, school_year);
-- One live enrollment per student per school year. A withdrawn or
-- transferred one does not count, so a student can come back.
CREATE UNIQUE INDEX uq_enrollment_live ON learn_enrollments(student_id, school_year)
  WHERE state IN ('enrolled', 'suspended');
