-- ===========================================================================
-- OC EFM's own data, held where only the people it is assigned to can read it.
--
-- OC EFM (efm.oplocloud.com) is OploCloud's financial management system. Its
-- sample books are generated in the browser and are the same for everyone, but
-- some of what it shows is actual — the company's real vendor invoices — and
-- that has to stay private. A static file in the app is public to anybody who
-- knows the address, and the repository is published as well, so the actual
-- data lives here and leaves only through GET /api/v1/efm/datasets/:name, to a
-- signed-in account that has been assigned OC EFM (or a platform administrator).
--
-- WHAT IS STORED. One row per dataset: a name, the JSON the app reads, where it
-- came from, and who loaded it last. Loading is an out-of-band administrator's
-- act (wrangler d1 execute), like the first administrator; there is no route
-- that writes here, so a compromised session cannot rewrite the books.
--
-- WHO MAY READ IT. Not a column: the `efm` product role, asked about on every
-- request in core/guard.js ("efm.read"). Assigning OC EFM to somebody is a row
-- in account_roles like any other — product `efm`, role `user`.
-- ===========================================================================
CREATE TABLE efm_datasets (
  name       TEXT PRIMARY KEY,
  body       TEXT NOT NULL,
  source     TEXT,
  updated_by TEXT REFERENCES accounts(id),
  updated_at INTEGER NOT NULL
);
