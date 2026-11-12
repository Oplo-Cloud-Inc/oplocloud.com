-- ===========================================================================
-- 0070  Who changed what, and when.
--
-- Every screen in the rebuilt console writes one row here for each change it
-- makes, each export and each time a private number is shown. Admin › Audit log
-- reads it back. Append only: a row is never updated or deleted by the app, and
-- putting a value back is a new row ("restored"), not an edit of the old one.
--
--   action   students.directory.exported · students.guardian.phone_revealed ·
--            students.record.changed · …   (module.area.verb, lower case)
--   verb     created | changed | deleted | published | exported | revealed |
--            signed_in | sign_in_failed | role_changed | restored
--   before / after   the value as text, for a one-field change; a change to
--            several fields writes one row per field and the same `request`.
--
-- Numbered 0070 so it cannot meet another change's migration on its way in; its
-- indexes carry the table's name for the same reason.
-- ===========================================================================

CREATE TABLE learn_audit (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  at           INTEGER NOT NULL,
  actor_id     TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  actor_name   TEXT,                       -- kept as written: the name on the day, not the name now
  module       TEXT NOT NULL,              -- students | attendance | exams | staff | campus | admin | …
  action       TEXT NOT NULL,
  verb         TEXT NOT NULL,
  record_kind  TEXT,                       -- student | staff | class | …
  record_id    TEXT,
  record_label TEXT,                       -- "Aashi Bhatia · X-C"
  field        TEXT,
  before       TEXT,
  after        TEXT,
  detail_json  TEXT NOT NULL DEFAULT '{}', -- a filter, a count, a reason
  request      TEXT                        -- the rows of one request share this
);
CREATE INDEX idx_learn_audit_org_at   ON learn_audit(org_id, at DESC);
CREATE INDEX idx_learn_audit_record   ON learn_audit(org_id, record_id, at DESC);
CREATE INDEX idx_learn_audit_actor    ON learn_audit(org_id, actor_id, at DESC);
CREATE INDEX idx_learn_audit_action   ON learn_audit(org_id, module, action, at DESC);
