-- ===========================================================================
-- Certificates with their own numbers, and the school's public disclosure.
--
-- A transfer certificate, a bonafide or a character certificate carries a number
-- the school can never repeat or skip: TC/2026-27/0007. `learn_numbers` hands out
-- the next one atomically, per school, per series, per school year.
--
-- A school that follows a board must also publish certain facts and, for some
-- boards, every transfer certificate it issues, on its own website.
-- `disclosure_json` is what the school says about itself (affiliation number,
-- address, principal, the facts it states); the enrolment, the staff and the
-- certificates are counted from what OEdu already holds. Publishing the
-- certificates is the school's switch, off until it is turned on, and a child's
-- certificate is shown only if the office ticked it.
--
-- NOTHING HERE READS ANYTHING ABOUT MONEY. A certificate is never held back for
-- an amount owed: the courts have said a school may not, and the number and the
-- page are issued from the child's record alone.
-- ===========================================================================

CREATE TABLE learn_numbers (
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  series TEXT NOT NULL,                           -- TC | BF | CH | MG
  year   TEXT NOT NULL,                           -- 2026-27
  last   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id, series, year)
);

ALTER TABLE organizations ADD COLUMN disclosure_json TEXT;    -- { general:{...}, facts:[{label,value}], publishTc: bool }
