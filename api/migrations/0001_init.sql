-- ===========================================================================
-- Oplo platform — initial schema.
--
-- This is a PLATFORM database, not a Learn database. The distinction shows up
-- in one place and it is the important one: every product table references
-- `account_id`, never a product-local user id. An Oplo Account is the
-- universal identity key, so a person who is a teacher in Learn and a seller
-- in OShopping is one row in `accounts` with two rows in `account_roles`,
-- not two accounts that happen to share an email address.
--
-- Identity and org tables are unprefixed because they belong to the platform.
-- Product tables carry their product's prefix (`learn_`) so a second product
-- adds tables rather than negotiating for space in these ones.
--
-- Timestamps are epoch milliseconds as INTEGER. D1 is SQLite, so this is
-- cheaper to compare and sort than ISO text, and it survives a move to
-- Postgres as a bigint without a data migration.
-- ===========================================================================

-- --------------------------------------------------------------- Identity

CREATE TABLE accounts (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  email_lower   TEXT NOT NULL UNIQUE,     -- the uniqueness key; email keeps the casing typed
  email_verified INTEGER NOT NULL DEFAULT 0,
  -- Password material. The hash is PBKDF2-SHA256 over a per-account random
  -- salt; the iteration count is stored per row so it can be raised later
  -- without invalidating existing passwords.
  pw_hash       TEXT,
  pw_salt       TEXT,
  pw_iterations INTEGER,
  status        TEXT NOT NULL DEFAULT 'active',   -- active | suspended | invited
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE profiles (
  account_id  TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  first_name  TEXT,
  initials    TEXT,
  avatar_hue  TEXT,
  title       TEXT,
  locale      TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Sessions store a hash of the token, never the token. A database dump is
-- then not a set of usable credentials.
CREATE TABLE sessions (
  id           TEXT PRIMARY KEY,
  account_id   TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  user_agent   TEXT,
  revoked_at   INTEGER
);
CREATE INDEX idx_sessions_account ON sessions(account_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ---------------------------------------------------------- Organizations

CREATE TABLE organizations (
  id         TEXT PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'school',   -- school | tutoring | personal
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE organization_memberships (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,                    -- member | admin | owner
  created_at INTEGER NOT NULL,
  UNIQUE (org_id, account_id)
);
CREATE INDEX idx_orgmem_account ON organization_memberships(account_id);

-- Product permissions. One account can hold different roles in different
-- products, and in different organizations, which is why this is a table and
-- not a column on `accounts`.
CREATE TABLE account_roles (
  id         TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product    TEXT NOT NULL,                    -- learn | maps | shopping | platform
  role       TEXT NOT NULL,                    -- student | teacher | author | admin
  org_id     TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  UNIQUE (account_id, product, role, org_id)
);
CREATE INDEX idx_roles_account ON account_roles(account_id);

-- ------------------------------------------------------------ Oplo Learn

CREATE TABLE learn_courses (
  id          TEXT PRIMARY KEY,
  org_id      TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,                   -- the slug the frontend routes on
  title       TEXT NOT NULL,
  subject     TEXT,
  level       TEXT,
  summary     TEXT,
  -- Units, grading weights and the rest of the shape the UI already renders.
  -- JSON because this is authored content whose shape belongs to the product,
  -- not a set of fields the database should be enforcing joins across.
  body_json   TEXT,
  status      TEXT NOT NULL DEFAULT 'draft',   -- draft | published | archived
  created_by  TEXT REFERENCES accounts(id),
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE (org_id, code)
);

CREATE TABLE learn_course_memberships (
  id         TEXT PRIMARY KEY,
  course_id  TEXT NOT NULL REFERENCES learn_courses(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,                    -- student | teacher | assistant
  created_at INTEGER NOT NULL,
  UNIQUE (course_id, account_id, role)
);
CREATE INDEX idx_coursemem_account ON learn_course_memberships(account_id);
CREATE INDEX idx_coursemem_course  ON learn_course_memberships(course_id);

CREATE TABLE learn_assignments (
  id         TEXT PRIMARY KEY,
  course_id  TEXT NOT NULL REFERENCES learn_courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  category   TEXT,                             -- matches a course grading weight
  out_of     REAL NOT NULL DEFAULT 100,
  due_at     INTEGER,
  status     TEXT NOT NULL DEFAULT 'open',
  created_by TEXT REFERENCES accounts(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_assign_course ON learn_assignments(course_id);

CREATE TABLE learn_submissions (
  id            TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES learn_assignments(id) ON DELETE CASCADE,
  account_id    TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  content       TEXT,
  submitted_at  INTEGER NOT NULL,
  UNIQUE (assignment_id, account_id)
);

-- The table the whole architecture is being proved against: a teacher writes
-- here on one device and a student reads it on another.
CREATE TABLE learn_grades (
  id            TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES learn_assignments(id) ON DELETE CASCADE,
  account_id    TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  score         REAL,
  out_of        REAL NOT NULL DEFAULT 100,
  feedback      TEXT,
  graded_by     TEXT REFERENCES accounts(id),
  graded_at     INTEGER NOT NULL,
  UNIQUE (assignment_id, account_id)
);
CREATE INDEX idx_grades_account ON learn_grades(account_id);

CREATE TABLE learn_progress (
  id         TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  course_id  TEXT REFERENCES learn_courses(id) ON DELETE CASCADE,
  scope      TEXT NOT NULL,                    -- 'unit:5', 'set:media-1', 'concept:Cochlea'
  state_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (account_id, scope)
);
CREATE INDEX idx_progress_account ON learn_progress(account_id);

CREATE TABLE learn_achievements (
  id         TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  earned_at  INTEGER NOT NULL,
  UNIQUE (account_id, key)
);

-- XP is an append-only ledger rather than a counter, because a counter the
-- client can increment is a counter the client controls. The total is a SUM
-- the server computes, and every point in it can be traced to what earned it.
CREATE TABLE learn_xp_events (
  id         TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source     TEXT NOT NULL,                    -- learn.answer | game.match | ...
  amount     INTEGER NOT NULL,
  day        TEXT NOT NULL,                    -- YYYY-MM-DD in the account's local day
  meta_json  TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_xp_account_day ON learn_xp_events(account_id, day);
