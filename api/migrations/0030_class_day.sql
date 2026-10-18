-- ===========================================================================
-- The class teacher's day: the diary and how long the day took.
--
-- In an Indian school the diary is how the school talks to a family every day:
-- today's homework, a note, a circular. Until now it was paper. A diary entry
-- belongs to a section and a day; the families of the section read it.
-- `client_key` is what makes an entry sent from a phone with no signal safe to
-- send twice: the second send finds the first.
--
-- learn_teacher_day is the number the school puts in its pitch: how many
-- seconds a class teacher spent on the section's day (register, diary, notes to
-- families) between opening it and saying they were done.
-- ===========================================================================

CREATE TABLE learn_diary (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id   TEXT NOT NULL REFERENCES learn_classes(id) ON DELETE CASCADE,
  day        TEXT NOT NULL,                       -- YYYY-MM-DD the entry is for
  kind       TEXT NOT NULL DEFAULT 'homework',    -- homework | note | circular
  subject    TEXT,
  body       TEXT NOT NULL,
  client_key TEXT,
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_diary_class ON learn_diary(class_id, day);
CREATE UNIQUE INDEX uq_diary_key ON learn_diary(class_id, client_key) WHERE client_key IS NOT NULL;

CREATE TABLE learn_teacher_day (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id   TEXT NOT NULL REFERENCES learn_classes(id) ON DELETE CASCADE,
  day        TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  seconds    INTEGER NOT NULL,
  steps_json TEXT NOT NULL DEFAULT '[]',          -- what was done: ["register","diary","message"]
  offline    INTEGER NOT NULL DEFAULT 0,          -- 1: some of it was done with no signal
  created_at INTEGER NOT NULL,
  UNIQUE (class_id, day, teacher_id)
);
CREATE INDEX idx_teacherday_org ON learn_teacher_day(org_id, day);
