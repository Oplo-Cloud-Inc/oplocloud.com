-- ===========================================================================
-- Facilities: the places a school keeps, what is in them, what needs doing to
-- them, and who may use them when.
--
--   learn_spaces      building -> floor -> room. A room can be booked; its
--                     booking rules live on it, so a gym and a library can
--                     differ without a settings screen for each.
--   learn_assets      a thing in a room: a projector, a boiler, a cart of
--                     laptops. It has a code to scan, a custodian (a person,
--                     or a room or cart written as text), and dates that are
--                     plain facts — installed, warranty end, expected life.
--                     There is no cost here: OEdu does not do finance.
--   learn_work_orders one table for everything somebody has to do: a request
--                     from a teacher, a repair, a preventive job, an
--                     inspection, a compliance check, a plain task. A request
--                     from someone outside the team waits as `pending` until a
--                     person on the team accepts or declines it.
--   learn_schedules   what recurs: a preventive job, an inspection, a check a
--                     school must be able to show it did. It writes work
--                     orders when they fall due (see services/facilities.js).
--   learn_bookings    a room held for a time. A weekly series shares a
--                     `series_id` and is decided as one.
--   learn_vendors     the outside people who do work, and the papers they must
--                     hold (`requires_json`) — insurance, a licence.
--   learn_documents   a paper with an expiry: a certificate, a manual, a
--                     contract, a floor plan. It belongs to a space, an asset,
--                     a vendor, a work order, or the school.
--   learn_facility_files   the bytes of a photo or a scan, kept in the
--                     database like enrollment's, under the same size limit.
--   learn_facility_events  what happened to any of the above, by whom, and
--                     when. Insert-only.
-- ===========================================================================

CREATE TABLE learn_spaces (
  id          TEXT PRIMARY KEY,
  org_id      TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id   TEXT REFERENCES learn_spaces(id) ON DELETE SET NULL,
  kind        TEXT NOT NULL DEFAULT 'room',      -- building | floor | room | area
  name        TEXT NOT NULL,
  code        TEXT,                              -- the number on the door
  capacity    INTEGER,
  bookable    INTEGER NOT NULL DEFAULT 0,
  rules_json  TEXT,                              -- hours, days, notice, length, buffer, who may book, blocked dates
  approver_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,   -- none: a booking is approved on the spot
  notes       TEXT,
  archived    INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX idx_spaces_org ON learn_spaces(org_id, parent_id);
CREATE UNIQUE INDEX uq_space_code ON learn_spaces(org_id, code) WHERE code IS NOT NULL AND archived = 0;

CREATE TABLE learn_assets (
  id              TEXT PRIMARY KEY,
  org_id          TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  seq             INTEGER NOT NULL,
  space_id        TEXT REFERENCES learn_spaces(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  kind            TEXT,                          -- Projector, Boiler, Laptop cart…
  code            TEXT,                          -- what is printed on its label
  serial          TEXT,
  custodian_id    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  custodian_label TEXT,                          -- "Cart 3", "Science office"
  status          TEXT NOT NULL DEFAULT 'in_service',  -- in_service | repair | storage | retired | lost
  condition       TEXT,                          -- good | fair | poor
  installed_on    TEXT,
  warranty_end    TEXT,
  life_years      INTEGER,
  last_seen_on    TEXT,                          -- the last room count that found it
  notes           TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE UNIQUE INDEX uq_asset_seq  ON learn_assets(org_id, seq);
CREATE UNIQUE INDEX uq_asset_code ON learn_assets(org_id, code) WHERE code IS NOT NULL;
CREATE INDEX idx_assets_space ON learn_assets(space_id, status);
CREATE INDEX idx_assets_cust  ON learn_assets(custodian_id);

CREATE TABLE learn_vendors (
  id               TEXT PRIMARY KEY,
  org_id           TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  trade            TEXT,                         -- Electrical, Pest control, Lift…
  contact_name     TEXT,
  phone            TEXT,
  email            TEXT,
  notes            TEXT,
  contract_ends_on TEXT,
  requires_json    TEXT,                         -- ["Insurance certificate", "Licence"]
  active           INTEGER NOT NULL DEFAULT 1,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);
CREATE INDEX idx_vendors_org ON learn_vendors(org_id, active);

CREATE TABLE learn_schedules (
  id               TEXT PRIMARY KEY,
  org_id           TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  kind             TEXT NOT NULL DEFAULT 'preventive',   -- preventive | inspection | compliance
  title            TEXT NOT NULL,
  details          TEXT,
  category         TEXT NOT NULL DEFAULT 'maintenance',
  priority         TEXT NOT NULL DEFAULT 'normal',
  space_id         TEXT REFERENCES learn_spaces(id) ON DELETE SET NULL,
  asset_id         TEXT REFERENCES learn_assets(id) ON DELETE SET NULL,
  vendor_id        TEXT REFERENCES learn_vendors(id) ON DELETE SET NULL,
  assignee_id      TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  every            INTEGER NOT NULL DEFAULT 1,
  unit             TEXT NOT NULL DEFAULT 'month',        -- day | week | month | year
  starts_on        TEXT NOT NULL,
  ends_on          TEXT,
  lead_days        INTEGER NOT NULL DEFAULT 0,           -- the order appears this many days before it is due
  from_completion  INTEGER NOT NULL DEFAULT 0,           -- the next one counts from when this one was finished
  skip_if_open     INTEGER NOT NULL DEFAULT 1,           -- no second order while the last is unfinished
  skip_breaks      INTEGER NOT NULL DEFAULT 0,           -- a date outside every marking period moves to the next term's start
  checklist_json   TEXT,
  authority        TEXT,                                 -- compliance: who requires it
  source           TEXT,                                 -- compliance: where that is written
  active           INTEGER NOT NULL DEFAULT 1,
  next_due_on      TEXT,                                 -- null: waiting for a completion, or finished
  last_done_on     TEXT,
  last_generated_on TEXT,
  created_by       TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);
CREATE INDEX idx_sched_due ON learn_schedules(org_id, active, next_due_on);

CREATE TABLE learn_work_orders (
  id             TEXT PRIMARY KEY,
  org_id         TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  seq            INTEGER NOT NULL,
  kind           TEXT NOT NULL DEFAULT 'request',        -- request | repair | preventive | inspection | compliance | task
  title          TEXT NOT NULL,
  details        TEXT,
  category       TEXT NOT NULL DEFAULT 'maintenance',    -- maintenance | custodial | it | safety | grounds | other
  priority       TEXT NOT NULL DEFAULT 'normal',         -- low | normal | high | urgent
  status         TEXT NOT NULL DEFAULT 'open',           -- pending | open | in_progress | on_hold | done | declined | cancelled
  space_id       TEXT REFERENCES learn_spaces(id) ON DELETE SET NULL,
  asset_id       TEXT REFERENCES learn_assets(id) ON DELETE SET NULL,
  vendor_id      TEXT REFERENCES learn_vendors(id) ON DELETE SET NULL,
  schedule_id    TEXT REFERENCES learn_schedules(id) ON DELETE SET NULL,
  requested_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  assignee_id    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  due_on         TEXT,
  due_key        TEXT,                                   -- the schedule's due date this order answers
  started_at     INTEGER,
  completed_at   INTEGER,
  completed_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  minutes        INTEGER,
  checklist_json TEXT,
  outcome        TEXT,                                   -- what was found or done, in a line
  decline_reason TEXT,
  client_key     TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);
CREATE UNIQUE INDEX uq_wo_seq ON learn_work_orders(org_id, seq);
CREATE UNIQUE INDEX uq_wo_key ON learn_work_orders(org_id, client_key) WHERE client_key IS NOT NULL;
CREATE UNIQUE INDEX uq_wo_due ON learn_work_orders(schedule_id, due_key) WHERE schedule_id IS NOT NULL AND due_key IS NOT NULL;
CREATE INDEX idx_wo_status   ON learn_work_orders(org_id, status, due_on);
CREATE INDEX idx_wo_space    ON learn_work_orders(space_id, status);
CREATE INDEX idx_wo_assignee ON learn_work_orders(assignee_id, status);
CREATE INDEX idx_wo_req      ON learn_work_orders(requested_by);

CREATE TABLE learn_bookings (
  id            TEXT PRIMARY KEY,
  org_id        TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  space_id      TEXT NOT NULL REFERENCES learn_spaces(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  notes         TEXT,
  attendees     INTEGER,
  day           TEXT NOT NULL,                           -- YYYY-MM-DD, the school's own calendar
  starts        TEXT NOT NULL,                           -- HH:MM
  ends          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',         -- pending | approved | declined | cancelled
  series_id     TEXT,
  booked_by     TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  decided_by    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  decided_at    INTEGER,
  decision_note TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX idx_book_space  ON learn_bookings(space_id, day);
CREATE INDEX idx_book_org    ON learn_bookings(org_id, status, day);
CREATE INDEX idx_book_by     ON learn_bookings(booked_by, day);
CREATE INDEX idx_book_series ON learn_bookings(series_id);

CREATE TABLE learn_facility_files (
  id          TEXT PRIMARY KEY,
  org_id      TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  owner_kind  TEXT NOT NULL,                             -- work_order | document | asset | space
  owner_id    TEXT NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  data        TEXT NOT NULL,                             -- base64
  uploaded_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  uploaded_at INTEGER NOT NULL
);
CREATE INDEX idx_ffiles_owner ON learn_facility_files(owner_kind, owner_id);

CREATE TABLE learn_documents (
  id          TEXT PRIMARY KEY,
  org_id      TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  owner_kind  TEXT NOT NULL DEFAULT 'school',            -- school | space | asset | vendor | work_order
  owner_id    TEXT,
  kind        TEXT NOT NULL,                             -- Certificate, Manual, Contract, Floor plan, Insurance, Licence…
  title       TEXT NOT NULL,
  issued_on   TEXT,
  expires_on  TEXT,
  url         TEXT,
  file_id     TEXT REFERENCES learn_facility_files(id) ON DELETE SET NULL,
  note        TEXT,
  created_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at  INTEGER NOT NULL,
  archived_at INTEGER
);
CREATE INDEX idx_docs_owner   ON learn_documents(org_id, owner_kind, owner_id);
CREATE INDEX idx_docs_expires ON learn_documents(org_id, expires_on);

CREATE TABLE learn_facility_events (
  id         TEXT PRIMARY KEY,
  org_id     TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  owner_kind TEXT NOT NULL,                              -- work_order | asset | space | booking | schedule | vendor | document
  owner_id   TEXT NOT NULL,
  at         INTEGER NOT NULL,
  actor_id   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  actor_name TEXT,
  kind       TEXT NOT NULL,                              -- created | status | assigned | comment | moved | counted | decided | …
  note       TEXT
);
CREATE INDEX idx_fev_owner ON learn_facility_events(owner_kind, owner_id, at);
