-- ==========================================================================
-- Work set on OEdu itself.
--
-- A teacher sets most work as a title, a category and a due date, and the
-- student does it somewhere else — on paper, in a notebook, in class. When a
-- school has put a student in a course on OEdu, the work is usually a lesson
-- or an activity on OEdu: Unit 2, Lesson 3; the unit test; a study set. The
-- assignment now says which, so the student is sent straight to it and the
-- teacher can see it was done.
--
--   activity_json  { kind, course, unit, lesson, set, title }
--                  kind: lesson | test | unit | set — done on OEdu
--                        offline — done elsewhere, about this unit
--                  NULL for work that names nothing on OEdu.
--
-- Handing it in uses learn_submissions (0001), which has waited for a route:
-- one row per student per assignment, `content` holding what OEdu measured
-- (lesson finished, test score, mastery) as JSON. A hand-in is not a mark. The
-- teacher marks it, as they mark everything, and the mark is what counts —
-- a score a browser reports is a score the browser controls.
--
-- Nothing a student learns on their own, outside the courses their school
-- put them in, creates a submission. Self-learning is never graded.
-- ==========================================================================

ALTER TABLE learn_assignments ADD COLUMN activity_json TEXT;

CREATE INDEX IF NOT EXISTS idx_submissions_account ON learn_submissions(account_id);
