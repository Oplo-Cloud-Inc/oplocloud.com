-- ==========================================================================
-- What a teacher's own tools need kept.
--
-- The gradebook could already weight categories, drop the lowest, take a late
-- penalty and count extra credit. What it could not do is the rest of what a
-- teacher customises: say how a piece of work is marked (a rubric), who it is
-- for (some students, not all), what it is about (their own objectives); put
-- a mark of their own in a cell (INC, W) and say how it was arrived at; and
-- keep the things that are theirs and not a grade at all — a seating chart, a
-- lesson plan, the comments they write most often, an announcement.
--
--   learn_assignments.details_json
--       { rubric: [{ name, points }], standards: [code], assignees: [accountId],
--         about, link }       — every field optional; NULL for plain work.
--
--   learn_grades.mark         the code of a special mark the teacher gave
--                             (INC, W, ABS …). A label only: what it counts
--                             as is already said by `status` and `score`, so
--                             the arithmetic of a grade has one source still.
--   learn_grades.detail_json  { rubric: [points per requirement], as: "25+2",
--                               sticker } — how the score was arrived at.
--
--   learn_course_docs         small documents that belong to a course and are
--                             kept by its teachers, one row each:
--       seating/chart         where each student sits
--       plan/<id>             a lesson plan, and the day it is taught
--       bank/comments         the comments a teacher inserts with two clicks
--       standards/list        the course's own learning objectives
--       override/<accountId>  a grade set by hand: a percent, a mark, or a
--                             fixed raise or lowering — read by the grade
--                             engine, never by the student it is about
--       announce/<id>         an announcement; the one kind students read
--
-- A document store rather than six tables because these are six shapes of
-- "something a teacher wrote down about a course", read whole and written
-- whole, and none of them is joined to anything.
-- ==========================================================================

ALTER TABLE learn_assignments ADD COLUMN details_json TEXT;

ALTER TABLE learn_grades ADD COLUMN mark TEXT;
ALTER TABLE learn_grades ADD COLUMN detail_json TEXT;

CREATE TABLE IF NOT EXISTS learn_course_docs (
  course_id  TEXT NOT NULL REFERENCES learn_courses(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  doc_id     TEXT NOT NULL,
  body_json  TEXT NOT NULL,
  updated_by TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (course_id, kind, doc_id)
);
