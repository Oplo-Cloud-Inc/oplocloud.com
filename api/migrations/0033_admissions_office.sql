-- ===========================================================================
-- The admissions office: what comes before an application, what happens
-- between "documents verified" and "decision", and the paper that goes to the
-- family at each step.
--
-- 0017 made the application, its review and its decision. A school that runs
-- admissions formally also keeps three things 0017 did not:
--
--   ENQUIRIES    a parent who has asked, before anyone has applied: who they
--                are, how they heard of the school, when to ring them back.
--                An enquiry that becomes an application points at it, so the
--                office can say where its applications come from.
--   SESSIONS     an entrance assessment, an interaction or an interview for
--                one application: when and where it is, who sat it, how it
--                went. A session is a row, so a day's test can be listed
--                across every application, which a note on a record cannot.
--   LETTERS      what the school wrote to the family and when: the
--                acknowledgement, the call for assessment, the offer, the
--                regret. Insert-only, with a reference number, so the school
--                can show later exactly what it said and that it said it.
--
-- Nothing here is finance, and nothing here sends anything: a letter is
-- written, numbered and kept; handing it over (print, copy, email) is the
-- office's act and is recorded as `channel`.
--
-- Timestamps are epoch milliseconds. A calendar day somebody wrote down is
-- YYYY-MM-DD text and a clock time HH:MM text, as written, so no time zone can
-- move either.
-- ===========================================================================

CREATE TABLE learn_enquiries (
  id             TEXT PRIMARY KEY,
  org_id         TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  seq            INTEGER NOT NULL,              -- ENQ-0001, per organization
  school_year    TEXT NOT NULL,                 -- the year the family asks about
  grade          TEXT,                          -- the class they ask about, if they know
  child_first    TEXT NOT NULL,
  child_last     TEXT,
  dob            TEXT,
  guardian_name  TEXT,
  phone          TEXT,
  email          TEXT,
  -- walk_in | phone | website | referral | school_event | advertisement | other
  source         TEXT NOT NULL DEFAULT 'walk_in',
  referred_by    TEXT,
  -- new | contacted | visit_booked | visited | applied | not_proceeding
  status         TEXT NOT NULL DEFAULT 'new',
  follow_up_on   TEXT,                          -- the day somebody is to ring back
  visit_on       TEXT,                          -- the campus visit, if one is booked
  note           TEXT,
  lost_reason    TEXT,
  assigned_to    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  application_id TEXT REFERENCES learn_applications(id) ON DELETE SET NULL,
  client_key     TEXT,
  created_by     TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  closed_at      INTEGER,
  UNIQUE (org_id, seq)
);
CREATE INDEX idx_enquiries_year   ON learn_enquiries(org_id, school_year, status);
CREATE INDEX idx_enquiries_follow ON learn_enquiries(org_id, follow_up_on);
CREATE INDEX idx_enquiries_phone  ON learn_enquiries(phone);
CREATE UNIQUE INDEX uq_enquiries_key ON learn_enquiries(created_by, client_key) WHERE client_key IS NOT NULL;

-- What was said and done about an enquiry. Insert-only, like an application's.
CREATE TABLE learn_enquiry_log (
  id          TEXT PRIMARY KEY,
  enquiry_id  TEXT NOT NULL REFERENCES learn_enquiries(id) ON DELETE CASCADE,
  at          INTEGER NOT NULL,
  actor_id    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  actor_name  TEXT,
  kind        TEXT NOT NULL,                    -- created | note | status | call | visit | assign | application
  from_value  TEXT,
  to_value    TEXT,
  note        TEXT
);
CREATE INDEX idx_enqlog_enq ON learn_enquiry_log(enquiry_id, at);

-- One assessment, interaction or interview of one application. `kind` is the
-- key of what the school configured (entrance test, interaction ...), so a
-- school that renames one does not orphan the rows.
CREATE TABLE learn_application_sessions (
  id             TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES learn_applications(id) ON DELETE CASCADE,
  org_id         TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL,
  label          TEXT NOT NULL,                 -- as it was called when it was set
  on_date        TEXT NOT NULL,
  at_time        TEXT,
  venue          TEXT,
  panel          TEXT,                          -- who conducts it, as written
  -- scheduled | completed | absent | cancelled
  status         TEXT NOT NULL DEFAULT 'scheduled',
  score          REAL,
  max_score      REAL,
  -- qualified | not_qualified | deferred; present only once it was taken
  result         TEXT,
  remarks        TEXT,
  recorded_by    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  recorded_at    INTEGER,
  created_by     TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);
CREATE INDEX idx_sessions_app ON learn_application_sessions(application_id, on_date);
CREATE INDEX idx_sessions_day ON learn_application_sessions(org_id, on_date, at_time);

-- A letter the school issued. The body is the exact text as it stood, kept
-- whole (JSON blocks), so a later change to a template or a setting cannot
-- rewrite what a family was told.
CREATE TABLE learn_application_letters (
  id             TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES learn_applications(id) ON DELETE CASCADE,
  org_id         TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  -- acknowledgement | deficiency | call | offer | waitlist | regret | confirmation
  kind           TEXT NOT NULL,
  ref_no         TEXT NOT NULL,
  subject        TEXT NOT NULL,
  body_json      TEXT NOT NULL,
  channel        TEXT NOT NULL DEFAULT 'printed',  -- printed | handed | inbox (in the app) | whatsapp | email | post
  issued_by      TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  issued_name    TEXT,
  issued_at      INTEGER NOT NULL
);
CREATE INDEX idx_letters_app ON learn_application_letters(application_id, issued_at);
CREATE UNIQUE INDEX uq_letters_ref ON learn_application_letters(org_id, ref_no);
