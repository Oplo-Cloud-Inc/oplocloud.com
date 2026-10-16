-- ===========================================================================
-- What every console shares: a way to tell somebody something, a place for the
-- school's smaller records, files, and a school that belongs to a district.
--
--   learn_notices       one row per person per item in their inbox. A message
--                       to thirty people is thirty rows with one thread id, so
--                       reading, archiving and deleting are each person's own.
--   learn_notice_prefs  what a person wants to hear about, and by which road.
--   learn_outbox        email waiting for a provider. Nothing leaves without
--                       one; the queue is the honest state of it.
--   learn_items         the school's smaller records (an event, a referral, a
--                       detention, a plan, a leave request, an invoice). One
--                       table and a kind, so a new kind is a registry entry in
--                       services/items.js and not a migration.
--   learn_files         a file attached to an account or an item.
-- ===========================================================================

CREATE TABLE learn_notices (
  id         TEXT PRIMARY KEY,
  org_id     TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,   -- whose inbox
  thread_id  TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'message',   -- message | announcement | reminder | alert | report
  from_id    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,                              -- a place inside the app: "assignments/late"
  dedupe     TEXT,                              -- a reminder is made once per person per key
  box        TEXT NOT NULL DEFAULT 'inbox',     -- inbox | sent
  created_at INTEGER NOT NULL,
  read_at    INTEGER,
  archived_at INTEGER
);
CREATE INDEX idx_notices_acct ON learn_notices(account_id, box, archived_at, created_at);
CREATE INDEX idx_notices_thread ON learn_notices(thread_id, created_at);
CREATE UNIQUE INDEX idx_notices_dedupe ON learn_notices(account_id, dedupe) WHERE dedupe IS NOT NULL;

CREATE TABLE learn_notice_prefs (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,                     -- alert | reminder | announcement | message
  in_app     INTEGER NOT NULL DEFAULT 1,
  email      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, kind)
);

CREATE TABLE learn_outbox (
  id         TEXT PRIMARY KEY,
  org_id     TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  to_email   TEXT NOT NULL,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  subject    TEXT NOT NULL,
  body       TEXT,
  status     TEXT NOT NULL DEFAULT 'queued',    -- queued | sent | failed
  error      TEXT,
  created_at INTEGER NOT NULL,
  sent_at    INTEGER
);
CREATE INDEX idx_outbox_status ON learn_outbox(status, created_at);

CREATE TABLE learn_items (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  title      TEXT NOT NULL,
  status     TEXT,
  subject_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,          -- who it is about
  course_id  TEXT REFERENCES learn_courses(id) ON DELETE SET NULL,
  starts_at  INTEGER,
  ends_at    INTEGER,
  due_on     TEXT,
  data_json  TEXT NOT NULL DEFAULT '{}',
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER
);
CREATE INDEX idx_items_kind ON learn_items(org_id, kind, archived_at);
CREATE INDEX idx_items_subject ON learn_items(subject_id, kind);
CREATE INDEX idx_items_course ON learn_items(course_id, kind);

CREATE TABLE learn_files (
  id         TEXT PRIMARY KEY,
  org_id     TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  owner_kind TEXT NOT NULL,                     -- item | account
  owner_id   TEXT NOT NULL,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL,
  size       INTEGER NOT NULL,
  data       TEXT NOT NULL,                     -- base64
  uploaded_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  uploaded_at INTEGER NOT NULL
);
CREATE INDEX idx_files_owner ON learn_files(owner_kind, owner_id);

-- A school may belong to a district; a district's administrators read across its schools.
ALTER TABLE organizations ADD COLUMN parent_id TEXT REFERENCES organizations(id) ON DELETE SET NULL;
