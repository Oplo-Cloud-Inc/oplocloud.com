-- ===========================================================================
-- Planning a term or a year before it exists: drafts, and what students ask for.
--
--   learn_schedule_drafts   a named plan. "term" is a change to the live
--                           schedule, merged into it on publishing; "year" is
--                           next year's sections, which replace this year's.
--   learn_draft_sections    a section inside a plan. Kept apart from
--                           learn_courses on purpose: a draft section has no
--                           gradebook and no roster of record, so it cannot
--                           show in a teacher's list or a student's day, and
--                           nothing that reads courses has to know drafts exist.
--                           Its teachers and students are lists until publish.
--   learn_course_requests   what each student asked for, or must take, for the
--                           term being planned. Rank 0 is required, 1 is a
--                           first choice, 2 and 3 are alternates.
-- ===========================================================================

CREATE TABLE learn_schedule_drafts (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'term',       -- term | year
  with_rosters INTEGER NOT NULL DEFAULT 0,         -- the plan carries who is in each section; publishing syncs rosters to match
  created_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at   INTEGER NOT NULL,
  published_at INTEGER,
  UNIQUE (org_id, name)
);

CREATE TABLE learn_draft_sections (
  id               TEXT PRIMARY KEY,
  draft_id         TEXT NOT NULL REFERENCES learn_schedule_drafts(id) ON DELETE CASCADE,
  source_course_id TEXT REFERENCES learn_courses(id) ON DELETE SET NULL,   -- the live section this is a copy of, if any
  subject_id       TEXT REFERENCES learn_subjects(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  code             TEXT,
  area             TEXT,
  section_no       TEXT,
  tab              TEXT,
  room             TEXT,
  capacity         INTEGER,
  periods_json     TEXT NOT NULL DEFAULT '[]',
  teachers_json    TEXT NOT NULL DEFAULT '[]',     -- [{ id, role }]
  students_json    TEXT NOT NULL DEFAULT '[]',     -- [accountId]
  position         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_draftsec_draft ON learn_draft_sections(draft_id);

CREATE TABLE learn_course_requests (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES learn_subjects(id) ON DELETE CASCADE,
  rank       INTEGER NOT NULL DEFAULT 1,           -- 0 required, 1 first choice, 2-3 alternates
  set_by     TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (account_id, subject_id)
);
CREATE INDEX idx_requests_subject ON learn_course_requests(subject_id, rank);
