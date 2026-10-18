-- ===========================================================================
-- Competencies and the Holistic Progress Card.
--
-- The government's direction is from marks to competencies: what a child can
-- do, in each subject, at their stage, and a report card made of the teacher's
-- observations AND the child's own, a classmate's and a parent's.
--
-- A COMPETENCY is a skill the school states for a subject (and, optionally, the
-- stage it belongs to). The school writes its own list, or loads the learning
-- outcomes of its board; OEdu does not ship one it could get wrong. A LEVEL is
-- where a child is on it in a term: 1 beginning, 2 developing, 3 proficient,
-- 4 advanced; "at grade level" is proficient or more. A NOTE is a few words from
-- the teacher, the child, a classmate or a parent.
-- ===========================================================================

CREATE TABLE learn_competencies (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stage      TEXT,                                -- foundational | preparatory | middle | secondary; null: any
  subject    TEXT NOT NULL,
  name       TEXT NOT NULL,
  code       TEXT,                                -- the board's or the school's own reference
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (org_id, subject, name)
);
CREATE INDEX idx_comp_org ON learn_competencies(org_id, subject);

CREATE TABLE learn_comp_levels (
  account_id     TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  competency_id  TEXT NOT NULL REFERENCES learn_competencies(id) ON DELETE CASCADE,
  school_year    TEXT NOT NULL,
  term           TEXT NOT NULL,                   -- 1 | 2 | the school's own name
  level          INTEGER NOT NULL,                -- 1..4
  note           TEXT,
  set_by         TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  set_at         INTEGER NOT NULL,
  PRIMARY KEY (account_id, competency_id, school_year, term)
);
CREATE INDEX idx_complevels_comp ON learn_comp_levels(competency_id, school_year, term);

CREATE TABLE learn_hpc_notes (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,   -- the child the card is about
  school_year TEXT NOT NULL,
  term        TEXT NOT NULL,
  source      TEXT NOT NULL,                      -- teacher | self | peer | parent
  area        TEXT,                               -- "Things I enjoy", "How I work with others" ...
  body        TEXT NOT NULL,
  by_id       TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  at          INTEGER NOT NULL
);
CREATE INDEX idx_hpc_child ON learn_hpc_notes(account_id, school_year, term);
