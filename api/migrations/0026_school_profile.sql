-- ===========================================================================
-- A school's profile: where it is and what it follows, said once.
--
-- `organizations.region` (0024) has been the country. Everything else a school
-- in that country has in common (its time zone, how it writes a date and a
-- sum of money, the month its year starts, the boards it follows, its state,
-- the languages its families read) was either hard-coded to a US school or
-- left out. They live here, on the organization, so the console and the API
-- read ONE place, and a school never sees a menu "for" its country: the
-- ordinary menu simply speaks that country.
--
-- Every column is nullable: a null means "what the country says" (see
-- api/src/services/profile.js), so a school that has never been touched
-- behaves exactly as it did.
-- ===========================================================================

ALTER TABLE organizations ADD COLUMN boards           TEXT;      -- JSON list: ["CBSE","CISCE"]; a campus may run several
ALTER TABLE organizations ADD COLUMN state_code       TEXT;      -- ISO 3166-2 subdivision without the country: PB, CH, MH
ALTER TABLE organizations ADD COLUMN timezone         TEXT;      -- IANA zone; null = the country's
ALTER TABLE organizations ADD COLUMN locale           TEXT;      -- BCP 47; null = the country's
ALTER TABLE organizations ADD COLUMN year_start_month INTEGER;   -- 1..12; null = the country's (April in India)
ALTER TABLE organizations ADD COLUMN languages        TEXT;      -- JSON list of the families' languages: ["en","hi","pa"]
ALTER TABLE organizations ADD COLUMN profile_set_at   INTEGER;   -- when an administrator last said this on purpose
ALTER TABLE organizations ADD COLUMN profile_set_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL;
