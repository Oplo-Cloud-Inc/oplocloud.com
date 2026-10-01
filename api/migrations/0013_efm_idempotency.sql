-- A command may carry a client-chosen key. Sending the same key twice records the
-- command once and answers the second time with the first: a retried request after
-- a dropped connection can never enter the books twice.
ALTER TABLE efm_commands ADD COLUMN idem_key TEXT;
CREATE UNIQUE INDEX efm_commands_idem ON efm_commands (book_id, idem_key) WHERE idem_key IS NOT NULL;
