-- ===========================================================================
-- OploCloud's books, kept as the list of what was done to them.
--
-- OC EFM used to run on generated sample books held in the browser. Real books
-- cannot live in a browser, so they live here — and not as balances that get
-- overwritten, but as an append-only list of commands: each thing that was
-- done, by whom, and when. The books at any moment are what that list adds up
-- to when the accounting engine runs it from the start (efm/js/engine.js and
-- efm/js/books.js, which the browser and this API share byte for byte). A
-- mistake is never edited out: it is corrected by another command, so the
-- history is the record.
--
-- WHY A CHAIN. Every command carries the hash of the one before it, over its
-- own content, so a command that is changed or removed afterwards breaks every
-- hash that follows. The API checks the chain before it appends anything, and
-- the Audit screen shows the person the result. And the table cannot be
-- rewritten through ordinary SQL: the triggers below refuse UPDATE and DELETE.
-- (Repairing a genuinely broken log is a deliberate act — drop the triggers,
-- fix it, put them back — which is the point of making it one.)
--
-- WHO MAY WRITE. Not a column: an account with OC EFM assigned, asked about on
-- every request (core/guard.js, "efm.write"). The actor recorded is the
-- signed-in account, taken from the session, never from the request.
--
-- efm_datasets, from the migration before, held the Claude Code invoices as
-- data merged in when the app started. They are commands in the list now
-- (card.record), permanent and chained like everything else, so the table
-- goes.
-- ===========================================================================
CREATE TABLE efm_books (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  config     TEXT NOT NULL,          -- JSON: the fiscal year and the legal entities
  created_at INTEGER NOT NULL
);

CREATE TABLE efm_commands (
  book_id    TEXT NOT NULL REFERENCES efm_books(id),
  seq        INTEGER NOT NULL,       -- 1, 2, 3 … with no gaps
  type       TEXT NOT NULL,
  payload    TEXT NOT NULL,          -- JSON
  actor_id   TEXT NOT NULL,          -- an account id, or 'system' for an import
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,          -- member | system
  at         TEXT NOT NULL,          -- the instant it was done, ISO 8601
  prev_hash  TEXT NOT NULL,
  hash       TEXT NOT NULL,
  PRIMARY KEY (book_id, seq)
);

CREATE TRIGGER efm_commands_no_update BEFORE UPDATE ON efm_commands
BEGIN SELECT RAISE(ABORT, 'efm_commands is append-only'); END;

CREATE TRIGGER efm_commands_no_delete BEFORE DELETE ON efm_commands
BEGIN SELECT RAISE(ABORT, 'efm_commands is append-only'); END;

DROP TABLE efm_datasets;
