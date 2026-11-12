-- ===========================================================================
-- 0071  A school's own switches (O8).
--
-- Five modules a school may turn on (Family, Fees, Homework, Lesson plans,
-- Messages), all off until it does, and the new console frame, on until it is
-- turned off, live on the organization as one JSON object:
--
--   {"family": true, "fees": false, "homework": false, "lessonPlans": false, "messages": false, "frame": true}
--
-- Null, and any key left out, means the default: every module off, the frame on.
-- The route flags in learn/shell/routes.js stay the hard off-switch, so a module
-- that is not built cannot be turned on from here. Each change is written to the
-- audit log in the same batch (services/profile.js, routes/school.js).
--
-- Additive only: the previous API ignores the column (migrate first, deploy second).
-- ===========================================================================

ALTER TABLE organizations ADD COLUMN modules TEXT;
