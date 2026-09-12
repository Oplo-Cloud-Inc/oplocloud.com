-- ===========================================================================
-- Marks.
--
-- A mark is what a student leaves behind in the text: this is the claim, this
-- is what holds it up, here is where I stopped believing it. Until now they
-- lived in localStorage, which annotate.js says out loud at the top of the
-- file, and that single fact is what blocks everything downstream of reading.
--
-- Three things need marks to be on a server, and none of them are possible
-- while they are in one browser:
--
--   RETRIEVAL   a question cued by what this student actually marked, asked
--               at the section boundary rather than from a generic bank
--   THE COHORT  a margin that fills with other people's reading, after you
--               have done your own
--   TEACHING    a teacher seeing that nobody in the class marked the one
--               sentence the whole unit rests on
--
-- ------------------------------------------------------------------ Anchors
--
-- A mark is stored as a quotation with its surroundings, not as a pointer into
-- a DOM that will not exist after the next render. `exact` is the quoted text,
-- `prefix` and `suffix` are what sat either side of it, and `char_offset` is a
-- tie-breaker used only when the same sentence appears twice. This is the W3C
-- text-quote shape annotate.js already writes locally, moved across unchanged
-- so a mark made before this migration still resolves after it.
--
-- ------------------------------------------------------------- Visibility
--
-- Private by default, and the default is load-bearing rather than cautious. A
-- Question mark is a written record of not understanding something, which is
-- exactly what a student hides. Publish one without being asked and they never
-- write an honest one again — in this course or any other. The cohort setting
-- is the teacher's to turn on, and a student can still withhold one mark.
--
-- `reply_to` is here now and unused. Threads are phase five; the column costs
-- nothing today and retrofitting a parent onto rows written without one means
-- guessing which mark each reply meant.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS learn_marks (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  course_id   TEXT REFERENCES learn_courses(id) ON DELETE CASCADE,
  scope       TEXT NOT NULL,                      -- 'media:6', the unit read
  section     TEXT NOT NULL,                      -- '6.1', the section inside it
  pass        INTEGER NOT NULL,                   -- 1..6, the taxonomy
  text        TEXT NOT NULL,                      -- what was marked, as shown
  exact       TEXT NOT NULL,                      -- anchor: the quotation
  prefix      TEXT,                               -- anchor: what preceded it
  suffix      TEXT,                               -- anchor: what followed it
  char_offset INTEGER,                            -- anchor: tie-breaker only
  note        TEXT,                               -- the student's own words
  reply_to    TEXT REFERENCES learn_marks(id) ON DELETE CASCADE,
  visibility  TEXT NOT NULL DEFAULT 'private',    -- private | cohort
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Reading a unit asks for one student's marks in one scope, every time.
CREATE INDEX IF NOT EXISTS idx_marks_own
  ON learn_marks (account_id, scope);

-- The cohort margin asks the other question: everyone's marks on one section.
-- Written now because adding it later means an index build on a live table.
CREATE INDEX IF NOT EXISTS idx_marks_section
  ON learn_marks (course_id, section, visibility);
