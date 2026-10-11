-- ===========================================================================
-- Behavior and discipline, and health records.
--
-- Two different kinds of sensitive, kept in two different places.
--
--   learn_conduct  an entry about conduct: an incident, a merit, a counseling
--                  note. It can be shown to the student's family — a decision
--                  the school makes entry by entry (`family_sees`), never by
--                  default. Teachers record what they saw and read what they
--                  recorded; the people who run discipline read and settle all
--                  of it.
--
--   learn_health   an entry about health: an allergy, a condition, a
--                  vaccination, a medication, a screening, a visit, an
--                  insurance policy. Restricted to the office and the nurse.
--                  A teacher is never given the record — only the flags the
--                  school chose to raise (`flag`), which say what to know and
--                  do, not why.
--
-- Both keep an insert-only history of what changed, by whom, and when.
-- ===========================================================================

CREATE TABLE learn_conduct (
  id           TEXT PRIMARY KEY,
  org_id       TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  student_id   TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,                  -- incident | merit | counseling
  category     TEXT,                           -- as the school names them: Tardiness, Respect…
  severity     TEXT,                           -- minor | moderate | serious (incidents)
  title        TEXT NOT NULL,
  details      TEXT,
  occurred_on  TEXT NOT NULL,                  -- YYYY-MM-DD
  location     TEXT,
  course_id    TEXT REFERENCES learn_courses(id) ON DELETE SET NULL,
  people       TEXT,                           -- others involved, as written
  action_taken TEXT,
  follow_up_on TEXT,                           -- YYYY-MM-DD, when somebody should look again
  status       TEXT NOT NULL DEFAULT 'open',   -- open | resolved
  family_sees  INTEGER NOT NULL DEFAULT 0,
  reported_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  resolved_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  resolved_at  INTEGER,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX idx_conduct_student ON learn_conduct(student_id, occurred_on);
CREATE INDEX idx_conduct_org     ON learn_conduct(org_id, occurred_on);
CREATE INDEX idx_conduct_follow  ON learn_conduct(org_id, status, follow_up_on);

CREATE TABLE learn_conduct_events (
  id         TEXT PRIMARY KEY,
  conduct_id TEXT NOT NULL REFERENCES learn_conduct(id) ON DELETE CASCADE,
  at         INTEGER NOT NULL,
  actor_id   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  actor_name TEXT,
  kind       TEXT NOT NULL,                    -- created | updated | resolved | reopened | shown | hidden
  note       TEXT
);
CREATE INDEX idx_conductev ON learn_conduct_events(conduct_id, at);

CREATE TABLE learn_health (
  id         TEXT PRIMARY KEY,
  org_id     TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,                    -- allergy | condition | immunization | medication | screening | visit | insurance
  title      TEXT NOT NULL,                    -- Peanuts · MMR · Asthma inhaler · Hearing
  detail     TEXT,                             -- reaction, dose, result, policy number…
  severity   TEXT,                             -- mild | moderate | severe (allergy, condition)
  on_date    TEXT,                             -- the day it happened: dose given, visit, screening
  due_on     TEXT,                             -- the day the next one is due
  status     TEXT NOT NULL DEFAULT 'active',   -- active | resolved
  flag       TEXT,                             -- what a teacher is told, if anything: "Peanut allergy — EpiPen in the office"
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_health_student ON learn_health(student_id, kind);
CREATE INDEX idx_health_due     ON learn_health(org_id, kind, due_on);

CREATE TABLE learn_health_events (
  id         TEXT PRIMARY KEY,
  health_id  TEXT NOT NULL REFERENCES learn_health(id) ON DELETE CASCADE,
  at         INTEGER NOT NULL,
  actor_id   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  actor_name TEXT,
  kind       TEXT NOT NULL,                    -- created | updated | resolved | reopened
  note       TEXT
);
CREATE INDEX idx_healthev ON learn_health_events(health_id, at);
