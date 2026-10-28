-- ===========================================================================
-- 0060  Search that finds people, not just pages.
--
-- The top bar's field used to match menu items only. This keeps one small
-- table of everything a person can be looked for by — students, staff, classes,
-- subjects, circulars — and an FTS5 index over it, both kept fresh by triggers
-- on the tables the facts live in, so no route has to remember to re-index.
--
--   learn_search_docs   one row per thing: kind, the id of the thing, the words
--                       it is found by, and the JSON the result row is drawn from.
--   learn_search        FTS5 over title and body, external-content (it holds the
--                       index, not a second copy of the text).
--
-- Phone numbers are stored as their last ten digits, and the last four of a
-- phone or an APAAR number also as a token "tz1234", so "the number ending 4821"
-- is a search a front desk can make. Nothing is shown from an index row that
-- the person asking could not read on the record itself: the route filters by
-- school and by role before it answers.
--
-- Numbered 0060 so it cannot meet another change's migration on its way in.
-- ===========================================================================

CREATE TABLE learn_search_docs (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id  TEXT NOT NULL,
  kind    TEXT NOT NULL,                  -- student | staff | class | subject | circular
  ref     TEXT NOT NULL,                  -- the id of the account, class, subject or item
  title   TEXT NOT NULL,
  body    TEXT NOT NULL DEFAULT '',
  meta    TEXT NOT NULL DEFAULT '{}',     -- JSON the result row is drawn from
  UNIQUE (kind, ref)
);
CREATE INDEX idx_search_docs_org ON learn_search_docs(org_id, kind);

CREATE VIRTUAL TABLE learn_search USING fts5(
  title, body,
  content = 'learn_search_docs', content_rowid = 'id',
  tokenize = 'unicode61 remove_diacritics 2', prefix = '2 3'
);

CREATE TRIGGER learn_search_docs_ai AFTER INSERT ON learn_search_docs BEGIN
  INSERT INTO learn_search(rowid, title, body) VALUES (new.id, new.title, new.body);
END;
CREATE TRIGGER learn_search_docs_ad AFTER DELETE ON learn_search_docs BEGIN
  INSERT INTO learn_search(learn_search, rowid, title, body) VALUES ('delete', old.id, old.title, old.body);
END;
CREATE TRIGGER learn_search_docs_au AFTER UPDATE ON learn_search_docs BEGIN
  INSERT INTO learn_search(learn_search, rowid, title, body) VALUES ('delete', old.id, old.title, old.body);
  INSERT INTO learn_search(rowid, title, body) VALUES (new.id, new.title, new.body);
END;

-- ------------------------------------------------------------------ Students
-- Anyone seated in a class or holding the student role in a school.
CREATE VIEW learn_search_student AS
SELECT a.id AS ref,
       COALESCE(i.org_id, (SELECT r.org_id FROM account_roles r
                            WHERE r.account_id = a.id AND r.product = 'learn' AND r.role = 'student' AND r.org_id IS NOT NULL LIMIT 1)) AS org_id,
       COALESCE(p.name, a.email) AS title,
       TRIM(COALESCE(i.admission_no, '') || ' ' || COALESCE(i.roll_no, '') || ' '
         || COALESCE(c.grade || '-' || c.section || ' ' || c.grade || ' ' || c.section, '') || ' '
         || COALESCE(i.apaar, '') || ' ' || CASE WHEN i.apaar GLOB '[0-9]*' THEN 'tz' || substr(i.apaar, -4) ELSE '' END || ' '
         || COALESCE(substr(REPLACE(REPLACE(REPLACE(REPLACE(i.father_phone, ' ', ''), '-', ''), '+', ''), '(', ''), -10) || ' tz' || substr(REPLACE(REPLACE(REPLACE(REPLACE(i.father_phone, ' ', ''), '-', ''), '+', ''), '(', ''), -4), '') || ' '
         || COALESCE(substr(REPLACE(REPLACE(REPLACE(REPLACE(i.mother_phone, ' ', ''), '-', ''), '+', ''), '(', ''), -10) || ' tz' || substr(REPLACE(REPLACE(REPLACE(REPLACE(i.mother_phone, ' ', ''), '-', ''), '+', ''), '(', ''), -4), '') || ' '
         || COALESCE(substr(REPLACE(REPLACE(REPLACE(REPLACE(i.guardian_phone, ' ', ''), '-', ''), '+', ''), '(', ''), -10) || ' tz' || substr(REPLACE(REPLACE(REPLACE(REPLACE(i.guardian_phone, ' ', ''), '-', ''), '+', ''), '(', ''), -4), '') || ' '
         || COALESCE(substr(REPLACE(REPLACE(REPLACE(REPLACE(k.cell_phone, ' ', ''), '-', ''), '+', ''), '(', ''), -10), '') || ' '
         || COALESCE(i.father_name, '') || ' ' || COALESCE(i.mother_name, '') || ' ' || COALESCE(i.guardian_name, '')) AS body,
       json_object('class', CASE WHEN c.id IS NULL THEN NULL ELSE c.grade || '-' || c.section END, 'classId', i.class_id,
                   'roll', i.roll_no, 'admissionNo', i.admission_no,
                   'apaar4', CASE WHEN i.apaar GLOB '[0-9]*' THEN substr(i.apaar, -4) ELSE NULL END) AS meta
  FROM accounts a
  LEFT JOIN profiles p ON p.account_id = a.id
  LEFT JOIN learn_student_india i ON i.account_id = a.id
  LEFT JOIN learn_classes c ON c.id = i.class_id
  LEFT JOIN account_contacts k ON k.account_id = a.id
 WHERE i.account_id IS NOT NULL
    OR EXISTS (SELECT 1 FROM account_roles r WHERE r.account_id = a.id AND r.product = 'learn' AND r.role = 'student' AND r.org_id IS NOT NULL);

-- ------------------------------------------------------------------- Staff
-- Anyone with a school role that is not a student's, a family's or an author's.
CREATE VIEW learn_search_staff AS
SELECT a.id AS ref,
       (SELECT r.org_id FROM account_roles r WHERE r.account_id = a.id AND r.product = 'learn' AND r.org_id IS NOT NULL
           AND r.role NOT IN ('student', 'guardian', 'author') LIMIT 1) AS org_id,
       COALESCE(p.name, a.email) AS title,
       TRIM(a.email || ' ' || COALESCE(p.title, '') || ' '
         || COALESCE((SELECT group_concat(r.role, ' ') FROM account_roles r WHERE r.account_id = a.id AND r.product = 'learn' AND r.org_id IS NOT NULL
              AND r.role NOT IN ('student', 'guardian', 'author')), '') || ' '
         || COALESCE(substr(REPLACE(REPLACE(REPLACE(REPLACE(k.cell_phone, ' ', ''), '-', ''), '+', ''), '(', ''), -10), '')) AS body,
       json_object('roles', (SELECT group_concat(r.role, ',') FROM account_roles r WHERE r.account_id = a.id AND r.product = 'learn' AND r.org_id IS NOT NULL
              AND r.role NOT IN ('student', 'guardian', 'author')), 'jobTitle', p.title) AS meta
  FROM accounts a
  LEFT JOIN profiles p ON p.account_id = a.id
  LEFT JOIN account_contacts k ON k.account_id = a.id
 WHERE EXISTS (SELECT 1 FROM account_roles r WHERE r.account_id = a.id AND r.product = 'learn' AND r.org_id IS NOT NULL
                AND r.role NOT IN ('student', 'guardian', 'author'));

-- ---------------------------------------------------------------- Classes
CREATE VIEW learn_search_class AS
SELECT c.id AS ref, c.org_id AS org_id,
       c.grade || '-' || c.section AS title,
       TRIM('class ' || c.grade || ' ' || c.section || ' ' || COALESCE(c.programme, '') || ' ' || COALESCE(c.stream, '') || ' '
         || COALESCE(c.room, '') || ' ' || COALESCE(p.name, '')) AS body,
       json_object('grade', c.grade, 'section', c.section, 'year', c.school_year, 'teacher', p.name, 'teacherId', c.class_teacher_id) AS meta
  FROM learn_classes c
  LEFT JOIN profiles p ON p.account_id = c.class_teacher_id;

-- --------------------------------------------------------------- Subjects
CREATE VIEW learn_search_subject AS
SELECT s.id AS ref, s.org_id AS org_id, s.title AS title,
       TRIM(s.number || ' ' || COALESCE(s.catalog_code, '')) AS body,
       json_object('number', s.number) AS meta
  FROM learn_subjects s;

-- -------------------------------------------------------------- Circulars
-- A circular is a form-kind item that has not been archived.
CREATE VIEW learn_search_circular AS
SELECT t.id AS ref, t.org_id AS org_id, t.title AS title,
       TRIM(COALESCE(json_extract(t.data_json, '$.classes'), '') || ' ' || COALESCE(json_extract(t.data_json, '$.audience'), '')) AS body,
       json_object('status', t.status, 'dueOn', t.due_on, 'classes', json_extract(t.data_json, '$.classes')) AS meta
  FROM learn_items t
 WHERE t.kind = 'form' AND t.archived_at IS NULL;

-- ---------------------------------------------------------------- Backfill
INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta) SELECT org_id, 'student',  ref, title, body, meta FROM learn_search_student  WHERE org_id IS NOT NULL;
INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta) SELECT org_id, 'staff',    ref, title, body, meta FROM learn_search_staff    WHERE org_id IS NOT NULL;
INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta) SELECT org_id, 'class',    ref, title, body, meta FROM learn_search_class;
INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta) SELECT org_id, 'subject',  ref, title, body, meta FROM learn_search_subject;
INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta) SELECT org_id, 'circular', ref, title, body, meta FROM learn_search_circular;

-- ---------------------------------------------------------------- Triggers
-- A student's row is refreshed when anything it is built from changes. Each
-- trigger is the same two statements: drop the row if the person is no longer
-- a student, then write the row the view now describes.

-- learn_student_india
CREATE TRIGGER learn_search_si_ai AFTER INSERT ON learn_student_india BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'student', ref, title, body, meta FROM learn_search_student WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_si_au AFTER UPDATE ON learn_student_india BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'student', ref, title, body, meta FROM learn_search_student WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_si_ad AFTER DELETE ON learn_student_india BEGIN
  DELETE FROM learn_search_docs WHERE kind = 'student' AND ref = old.account_id
     AND NOT EXISTS (SELECT 1 FROM learn_search_student v WHERE v.ref = old.account_id);
END;

-- profiles: a name changes a student, a member of staff, and the classes they teach
CREATE TRIGGER learn_search_pr_ai AFTER INSERT ON profiles BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'student', ref, title, body, meta FROM learn_search_student WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'staff', ref, title, body, meta FROM learn_search_staff WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_pr_au AFTER UPDATE OF name, title ON profiles BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'student', ref, title, body, meta FROM learn_search_student WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'staff', ref, title, body, meta FROM learn_search_staff WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'class', ref, title, body, meta FROM learn_search_class WHERE ref IN (SELECT id FROM learn_classes WHERE class_teacher_id = new.account_id)
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;

-- account_roles: becoming (or ceasing to be) a student or a member of staff
CREATE TRIGGER learn_search_ro_ai AFTER INSERT ON account_roles BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'student', ref, title, body, meta FROM learn_search_student WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'staff', ref, title, body, meta FROM learn_search_staff WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_ro_ad AFTER DELETE ON account_roles BEGIN
  DELETE FROM learn_search_docs WHERE kind = 'student' AND ref = old.account_id
     AND NOT EXISTS (SELECT 1 FROM learn_search_student v WHERE v.ref = old.account_id);
  DELETE FROM learn_search_docs WHERE kind = 'staff' AND ref = old.account_id
     AND NOT EXISTS (SELECT 1 FROM learn_search_staff v WHERE v.ref = old.account_id);
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'staff', ref, title, body, meta FROM learn_search_staff WHERE ref = old.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;

-- account_contacts: the phone
CREATE TRIGGER learn_search_ac_ai AFTER INSERT ON account_contacts BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'student', ref, title, body, meta FROM learn_search_student WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'staff', ref, title, body, meta FROM learn_search_staff WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_ac_au AFTER UPDATE OF cell_phone ON account_contacts BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'student', ref, title, body, meta FROM learn_search_student WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'staff', ref, title, body, meta FROM learn_search_staff WHERE ref = new.account_id AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;

-- learn_classes: a class is a result, and renaming one renames its children's label
CREATE TRIGGER learn_search_cl_ai AFTER INSERT ON learn_classes BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'class', ref, title, body, meta FROM learn_search_class WHERE ref = new.id
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_cl_au AFTER UPDATE ON learn_classes BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'class', ref, title, body, meta FROM learn_search_class WHERE ref = new.id
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'student', ref, title, body, meta FROM learn_search_student
   WHERE ref IN (SELECT account_id FROM learn_student_india WHERE class_id = new.id) AND org_id IS NOT NULL
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_cl_ad AFTER DELETE ON learn_classes BEGIN
  DELETE FROM learn_search_docs WHERE kind = 'class' AND ref = old.id;
END;

-- learn_subjects
CREATE TRIGGER learn_search_su_ai AFTER INSERT ON learn_subjects BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'subject', ref, title, body, meta FROM learn_search_subject WHERE ref = new.id
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_su_au AFTER UPDATE ON learn_subjects BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'subject', ref, title, body, meta FROM learn_search_subject WHERE ref = new.id
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_su_ad AFTER DELETE ON learn_subjects BEGIN
  DELETE FROM learn_search_docs WHERE kind = 'subject' AND ref = old.id;
END;

-- learn_items, circulars only: archiving one takes it out
CREATE TRIGGER learn_search_it_ai AFTER INSERT ON learn_items WHEN new.kind = 'form' BEGIN
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'circular', ref, title, body, meta FROM learn_search_circular WHERE ref = new.id
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_it_au AFTER UPDATE ON learn_items WHEN new.kind = 'form' BEGIN
  DELETE FROM learn_search_docs WHERE kind = 'circular' AND ref = new.id AND new.archived_at IS NOT NULL;
  INSERT INTO learn_search_docs (org_id, kind, ref, title, body, meta)
  SELECT org_id, 'circular', ref, title, body, meta FROM learn_search_circular WHERE ref = new.id
  ON CONFLICT (kind, ref) DO UPDATE SET org_id = excluded.org_id, title = excluded.title, body = excluded.body, meta = excluded.meta;
END;
CREATE TRIGGER learn_search_it_ad AFTER DELETE ON learn_items WHEN old.kind = 'form' BEGIN
  DELETE FROM learn_search_docs WHERE kind = 'circular' AND ref = old.id;
END;
