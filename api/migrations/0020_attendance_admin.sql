-- ===========================================================================
-- Attendance, for the people who run the school day.
--
-- learn_attendance holds the mark as it stands. Two things were missing
-- around it:
--
--   learn_attendance_log       every change to a mark: who, when, from what
--                              to what, and by which route (a register, a
--                              student's own record, a bulk edit, a
--                              correction). A mark moves; its history does
--                              not. Rows already on file are carried in as
--                              the first line of their own history.
--   learn_attendance_settings  per school: whether students and families see
--                              attendance online, and the days there is no
--                              school (so a closed day is never a register
--                              somebody forgot).
-- ===========================================================================

CREATE TABLE learn_attendance_log (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  course_id   TEXT REFERENCES learn_courses(id) ON DELETE SET NULL,
  day         TEXT NOT NULL,                      -- the day the mark is for
  from_status TEXT,                               -- null: there was no mark
  to_status   TEXT,                               -- null: the mark was removed
  from_note   TEXT,
  to_note     TEXT,
  via         TEXT NOT NULL,                      -- register | student | bulk | fix | remove
  by_id       TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  at          INTEGER NOT NULL
);
CREATE INDEX idx_attlog_day     ON learn_attendance_log(day, at);
CREATE INDEX idx_attlog_account ON learn_attendance_log(account_id, day);

INSERT INTO learn_attendance_log (id, account_id, course_id, day, from_status, to_status, from_note, to_note, via, by_id, at)
SELECT 'attlog_' || lower(hex(randomblob(8))), account_id, course_id, day, NULL, status, NULL, note, 'register', marked_by, marked_at
  FROM learn_attendance;

CREATE TABLE learn_attendance_settings (
  org_id     TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  body_json  TEXT NOT NULL,                       -- { online, closed: [{from, to, label}] }
  updated_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at INTEGER NOT NULL
);
