-- OTeams — initial schema
-- Postgres 15+. Every table is workspace-scoped so one deployment can host many orgs.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy search

-- ============================================================ users
-- One row per human. "sub" is the stable subject claim from Oplo Accounts (ZITADEL).
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub           text UNIQUE NOT NULL,
  email         citext UNIQUE,
  name          text NOT NULL DEFAULT 'Oplo user',
  avatar_url    text,
  title         text,
  presence      text NOT NULL DEFAULT 'offline'
                CHECK (presence IN ('active','away','dnd','offline')),
  status_emoji  text,
  status_text   text,
  is_bot        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz
);

-- ============================================================ workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text UNIQUE NOT NULL,
  name       text NOT NULL,
  icon_url   text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','guest')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS workspace_members_user_idx ON workspace_members(user_id);

-- ============================================================ channels
-- DMs and group DMs are channels with is_dm = true. dm_key makes them unique
-- per participant set so "open a DM with Ada" is idempotent.
CREATE TABLE IF NOT EXISTS channels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug         text,
  name         text,
  topic        text NOT NULL DEFAULT '',
  purpose      text NOT NULL DEFAULT '',
  is_private   boolean NOT NULL DEFAULT false,
  is_dm        boolean NOT NULL DEFAULT false,
  dm_key       text,
  is_archived  boolean NOT NULL DEFAULT false,
  created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
-- Named channels are unique per workspace; DMs are unique per participant set.
CREATE UNIQUE INDEX IF NOT EXISTS channels_ws_slug_idx
  ON channels(workspace_id, slug) WHERE is_dm = false;
CREATE UNIQUE INDEX IF NOT EXISTS channels_dm_key_idx
  ON channels(workspace_id, dm_key) WHERE is_dm = true;
CREATE INDEX IF NOT EXISTS channels_ws_idx ON channels(workspace_id);

CREATE TABLE IF NOT EXISTS channel_members (
  channel_id           uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                 text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  last_read_message_id uuid,
  last_read_at         timestamptz,
  muted                boolean NOT NULL DEFAULT false,
  starred              boolean NOT NULL DEFAULT false,
  joined_at            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);
CREATE INDEX IF NOT EXISTS channel_members_user_idx ON channel_members(user_id);

-- ============================================================ messages
-- parent_id != NULL  => the message is a threaded reply.
CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  parent_id   uuid REFERENCES messages(id) ON DELETE CASCADE,
  kind        text NOT NULL DEFAULT 'text' CHECK (kind IN ('text','voice','system')),
  body        text NOT NULL DEFAULT '',
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,   -- voice duration, waveform, reply_to, …
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,  -- WhatsApp-style quote
  edited_at   timestamptz,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  search_tsv  tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(body,''))) STORED
);
CREATE INDEX IF NOT EXISTS messages_channel_created_idx ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_parent_idx ON messages(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_search_idx ON messages USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS messages_trgm_idx ON messages USING GIN (body gin_trgm_ops);
CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id);

-- ============================================================ attachments
CREATE TABLE IF NOT EXISTS attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  uuid REFERENCES messages(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploader_id uuid REFERENCES users(id) ON DELETE SET NULL,
  object_key  text NOT NULL,
  filename    text NOT NULL,
  mime        text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes  bigint NOT NULL DEFAULT 0,
  width       int,
  height      int,
  duration_ms int,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attachments_message_idx ON attachments(message_id);

-- ============================================================ reactions
CREATE TABLE IF NOT EXISTS reactions (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS reactions_message_idx ON reactions(message_id);

-- ============================================================ pins
CREATE TABLE IF NOT EXISTS pins (
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, message_id)
);

-- ============================================================ huddles
CREATE TABLE IF NOT EXISTS huddles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  started_by uuid REFERENCES users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at   timestamptz
);
-- At most one live huddle per channel.
CREATE UNIQUE INDEX IF NOT EXISTS huddles_live_idx
  ON huddles(channel_id) WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS huddle_participants (
  huddle_id uuid NOT NULL REFERENCES huddles(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at   timestamptz,
  mic       boolean NOT NULL DEFAULT true,
  camera    boolean NOT NULL DEFAULT false,
  screen    boolean NOT NULL DEFAULT false,
  PRIMARY KEY (huddle_id, user_id)
);

-- ============================================================ helpers
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_touch ON users;
CREATE TRIGGER users_touch BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
