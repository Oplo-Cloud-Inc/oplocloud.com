// REST API. Every handler is membership-checked via ./access.js.
import { Router } from "express";
import { z } from "zod";
import { one, many, tx } from "./db.js";
import { requireAuth } from "./auth.js";
import {
  HttpError, badRequest, notFound, forbidden,
  requireWorkspaceMember, requireChannelAccess, requireChannelMembership, dmKey,
} from "./access.js";
import { hub } from "./realtime.js";
import { buildKey, presignUpload, presignDownload, deleteObject } from "./storage.js";
import { joinDefaultWorkspace } from "./bootstrap.js";
import { config } from "./config.js";

const r = Router();
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const slugify = s => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/* ============================================================ shapes */
const MESSAGE_SELECT = `
  m.id, m.channel_id, m.user_id, m.parent_id, m.kind, m.body, m.meta,
  m.reply_to_id, m.edited_at, m.deleted_at, m.created_at,
  u.name AS author_name, u.avatar_url AS author_avatar, u.title AS author_title, u.is_bot AS author_is_bot`;

async function decorate(rows) {
  if (!rows.length) return [];
  const ids = rows.map(m => m.id);
  const reactions = await many(
    `SELECT message_id, emoji, array_agg(user_id::text) AS user_ids
       FROM reactions WHERE message_id = ANY($1::uuid[]) GROUP BY message_id, emoji`, [ids]);
  const attachments = await many(
    `SELECT id, message_id, filename, mime, size_bytes, width, height, duration_ms
       FROM attachments WHERE message_id = ANY($1::uuid[])`, [ids]);
  const replies = await many(
    `SELECT parent_id, count(*)::int AS n, max(created_at) AS last_at
       FROM messages WHERE parent_id = ANY($1::uuid[]) AND deleted_at IS NULL
      GROUP BY parent_id`, [ids]);

  const byMsg = (list, key = "message_id") =>
    list.reduce((acc, x) => ((acc[x[key]] = acc[x[key]] || []).push(x), acc), {});
  const rx = byMsg(reactions), at = byMsg(attachments);
  const rp = replies.reduce((a, x) => (a[x.parent_id] = x, a), {});

  return rows.map(m => ({
    id: m.id,
    channelId: m.channel_id,
    parentId: m.parent_id,
    replyToId: m.reply_to_id,
    kind: m.kind,
    body: m.deleted_at ? "" : m.body,
    meta: m.meta,
    deleted: !!m.deleted_at,
    editedAt: m.edited_at,
    createdAt: m.created_at,
    author: m.user_id ? {
      id: m.user_id, name: m.author_name, avatarUrl: m.author_avatar,
      title: m.author_title, isBot: m.author_is_bot,
    } : null,
    reactions: (rx[m.id] || []).map(x => ({ emoji: x.emoji, userIds: x.user_ids })),
    attachments: (at[m.id] || []).map(a => ({
      id: a.id, filename: a.filename, mime: a.mime, size: a.size_bytes,
      width: a.width, height: a.height, durationMs: a.duration_ms,
    })),
    replyCount: rp[m.id]?.n || 0,
    lastReplyAt: rp[m.id]?.last_at || null,
  }));
}

async function loadMessage(id) {
  const row = await one(`SELECT ${MESSAGE_SELECT} FROM messages m LEFT JOIN users u ON u.id = m.user_id WHERE m.id = $1`, [id]);
  if (!row) throw notFound("message_not_found");
  return (await decorate([row]))[0];
}

/* ============================================================ health + config */
r.get("/healthz", wrap(async (_req, res) => {
  await one("SELECT 1 AS ok");
  res.json({ ok: true, service: "oteams-server", time: new Date().toISOString() });
}));

r.get("/api/config", (_req, res) => {
  const ice = [];
  if (config.webrtc.stunUrl) ice.push({ urls: config.webrtc.stunUrl });
  if (config.webrtc.turnUrl) ice.push({
    urls: config.webrtc.turnUrl, username: config.webrtc.turnUser, credential: config.webrtc.turnPassword,
  });
  res.json({ iceServers: ice, maxUploadBytes: config.s3.maxUploadBytes });
});

/* Everything below requires a valid Oplo Accounts token. */
r.use("/api", requireAuth);

/* ============================================================ me */
r.get("/api/me", wrap(async (req, res) => {
  // First sight of this user? Put them in the default workspace.
  const mine = await one(`SELECT 1 FROM workspace_members WHERE user_id = $1`, [req.user.id]);
  if (!mine) await joinDefaultWorkspace(req.user.id);

  const workspaces = await many(
    `SELECT w.id, w.slug, w.name, w.icon_url, wm.role
       FROM workspaces w JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = $1 ORDER BY w.name`, [req.user.id]);
  res.json({ user: publicUser(req.user), workspaces });
}));

const patchMe = z.object({
  name: z.string().min(1).max(80).optional(),
  title: z.string().max(80).nullable().optional(),
  presence: z.enum(["active", "away", "dnd", "offline"]).optional(),
  statusEmoji: z.string().max(16).nullable().optional(),
  statusText: z.string().max(120).nullable().optional(),
});
r.patch("/api/me", wrap(async (req, res) => {
  const b = patchMe.parse(req.body ?? {});
  const u = await one(
    `UPDATE users SET
       name = COALESCE($2, name), title = COALESCE($3, title),
       presence = COALESCE($4, presence),
       status_emoji = COALESCE($5, status_emoji), status_text = COALESCE($6, status_text)
     WHERE id = $1 RETURNING *`,
    [req.user.id, b.name ?? null, b.title ?? null, b.presence ?? null, b.statusEmoji ?? null, b.statusText ?? null]);
  const mates = await many(
    `SELECT DISTINCT m2.user_id FROM workspace_members m1
       JOIN workspace_members m2 ON m2.workspace_id = m1.workspace_id WHERE m1.user_id = $1`, [u.id]);
  hub.toUsers(mates.map(m => m.user_id), "user:updated", { user: publicUser(u) });
  res.json({ user: publicUser(u) });
}));

const publicUser = u => ({
  id: u.id, name: u.name, email: u.email, avatarUrl: u.avatar_url, title: u.title,
  presence: u.presence, statusEmoji: u.status_emoji, statusText: u.status_text, isBot: u.is_bot,
});

/* ============================================================ workspaces */
r.post("/api/workspaces", wrap(async (req, res) => {
  const b = z.object({ name: z.string().min(1).max(60) }).parse(req.body ?? {});
  const slug = slugify(b.name) || `ws-${Date.now()}`;
  const ws = await tx(async c => {
    const w = (await c.query(
      `INSERT INTO workspaces (slug, name, created_by) VALUES ($1,$2,$3) RETURNING *`,
      [slug, b.name, req.user.id])).rows[0];
    await c.query(`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1,$2,'owner')`, [w.id, req.user.id]);
    const gen = (await c.query(
      `INSERT INTO channels (workspace_id, slug, name, topic, created_by)
       VALUES ($1,'general','general','Company-wide announcements and general chatter',$2) RETURNING *`,
      [w.id, req.user.id])).rows[0];
    await c.query(`INSERT INTO channel_members (channel_id, user_id, role) VALUES ($1,$2,'owner')`, [gen.id, req.user.id]);
    return w;
  });
  res.status(201).json({ workspace: ws });
}));

r.get("/api/workspaces/:id/members", wrap(async (req, res) => {
  await requireWorkspaceMember(req.user.id, req.params.id);
  const rows = await many(
    `SELECT u.*, wm.role FROM users u JOIN workspace_members wm ON wm.user_id = u.id
      WHERE wm.workspace_id = $1 ORDER BY u.name`, [req.params.id]);
  res.json({ members: rows.map(u => ({ ...publicUser(u), role: u.role })) });
}));

/* Channels + DMs the caller can see, with unread counts. */
r.get("/api/workspaces/:id/channels", wrap(async (req, res) => {
  const wsId = req.params.id;
  await requireWorkspaceMember(req.user.id, wsId);
  const rows = await many(
    `SELECT c.*,
            cm.user_id IS NOT NULL AS joined, cm.starred, cm.muted, cm.last_read_message_id,
            (SELECT count(*) FROM messages m
              WHERE m.channel_id = c.id AND m.deleted_at IS NULL AND m.parent_id IS NULL
                AND m.created_at > COALESCE(cm.last_read_at, '-infinity'::timestamptz)
                AND m.user_id IS DISTINCT FROM $2)::int AS unread,
            (SELECT max(created_at) FROM messages m WHERE m.channel_id = c.id AND m.deleted_at IS NULL) AS last_at
       FROM channels c
       LEFT JOIN channel_members cm ON cm.channel_id = c.id AND cm.user_id = $2
      WHERE c.workspace_id = $1 AND c.is_archived = false
        AND (c.is_private = false AND c.is_dm = false OR cm.user_id IS NOT NULL)
      ORDER BY c.is_dm, c.slug NULLS LAST, last_at DESC NULLS LAST`, [wsId, req.user.id]);

  // Attach DM participants so the client can label them.
  const dmIds = rows.filter(c => c.is_dm).map(c => c.id);
  let members = [];
  if (dmIds.length) {
    members = await many(
      `SELECT cm.channel_id, u.id, u.name, u.avatar_url, u.presence, u.title
         FROM channel_members cm JOIN users u ON u.id = cm.user_id
        WHERE cm.channel_id = ANY($1::uuid[])`, [dmIds]);
  }
  const byChannel = members.reduce((a, m) => ((a[m.channel_id] = a[m.channel_id] || []).push(m), a), {});

  res.json({
    channels: rows.map(c => ({
      id: c.id, workspaceId: c.workspace_id, slug: c.slug, name: c.name, topic: c.topic,
      isPrivate: c.is_private, isDm: c.is_dm, joined: c.joined, starred: !!c.starred,
      muted: !!c.muted, unread: c.unread, lastAt: c.last_at,
      participants: (byChannel[c.id] || []).map(m => ({
        id: m.id, name: m.name, avatarUrl: m.avatar_url, presence: m.presence, title: m.title,
      })),
    })),
  });
}));

const newChannel = z.object({
  name: z.string().min(1).max(40),
  topic: z.string().max(250).optional(),
  isPrivate: z.boolean().optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});
r.post("/api/workspaces/:id/channels", wrap(async (req, res) => {
  const wsId = req.params.id;
  await requireWorkspaceMember(req.user.id, wsId);
  const b = newChannel.parse(req.body ?? {});
  const slug = slugify(b.name);
  if (!slug) throw badRequest("invalid_channel_name");
  if (await one(`SELECT 1 FROM channels WHERE workspace_id=$1 AND slug=$2 AND is_dm=false`, [wsId, slug]))
    throw new HttpError(409, "channel_exists");

  const channel = await tx(async c => {
    const ch = (await c.query(
      `INSERT INTO channels (workspace_id, slug, name, topic, is_private, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [wsId, slug, slug, b.topic || "", !!b.isPrivate, req.user.id])).rows[0];
    const ids = new Set([req.user.id, ...(b.memberIds || [])]);
    for (const uid of ids) {
      await c.query(
        `INSERT INTO channel_members (channel_id, user_id, role) VALUES ($1,$2,$3)
         ON CONFLICT DO NOTHING`,
        [ch.id, uid, uid === req.user.id ? "owner" : "member"]);
    }
    return ch;
  });
  hub.toChannel(channel.id, "channel:created", { channel });
  res.status(201).json({ channel });
}));

/* Open (or reuse) a DM with one or more people. */
r.post("/api/workspaces/:id/dms", wrap(async (req, res) => {
  const wsId = req.params.id;
  await requireWorkspaceMember(req.user.id, wsId);
  const b = z.object({ userIds: z.array(z.string().uuid()).min(1).max(8) }).parse(req.body ?? {});
  const ids = [...new Set([req.user.id, ...b.userIds])];
  for (const uid of ids) await requireWorkspaceMember(uid, wsId);
  const key = dmKey(ids);

  let ch = await one(`SELECT * FROM channels WHERE workspace_id=$1 AND dm_key=$2`, [wsId, key]);
  if (!ch) {
    ch = await tx(async c => {
      const created = (await c.query(
        `INSERT INTO channels (workspace_id, is_dm, dm_key, is_private, created_by)
         VALUES ($1,true,$2,true,$3) RETURNING *`, [wsId, key, req.user.id])).rows[0];
      for (const uid of ids) {
        await c.query(`INSERT INTO channel_members (channel_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [created.id, uid]);
      }
      return created;
    });
  }
  res.json({ channel: ch });
}));

/* ============================================================ channels */
r.get("/api/channels/:id", wrap(async (req, res) => {
  const { channel } = await requireChannelAccess(req.user.id, req.params.id);
  const members = await many(
    `SELECT u.* FROM users u JOIN channel_members cm ON cm.user_id=u.id WHERE cm.channel_id=$1 ORDER BY u.name`,
    [channel.id]);
  res.json({ channel, members: members.map(publicUser) });
}));

r.patch("/api/channels/:id", wrap(async (req, res) => {
  const { channel } = await requireChannelMembership(req.user.id, req.params.id);
  const b = z.object({ topic: z.string().max(250).optional(), purpose: z.string().max(250).optional() }).parse(req.body ?? {});
  const ch = await one(
    `UPDATE channels SET topic=COALESCE($2,topic), purpose=COALESCE($3,purpose) WHERE id=$1 RETURNING *`,
    [channel.id, b.topic ?? null, b.purpose ?? null]);
  hub.toChannel(ch.id, "channel:updated", { channel: ch });
  res.json({ channel: ch });
}));

r.post("/api/channels/:id/join", wrap(async (req, res) => {
  const { membership } = await requireChannelMembership(req.user.id, req.params.id);
  res.json({ membership });
}));

r.post("/api/channels/:id/leave", wrap(async (req, res) => {
  await one(`DELETE FROM channel_members WHERE channel_id=$1 AND user_id=$2 RETURNING channel_id`, [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

r.post("/api/channels/:id/star", wrap(async (req, res) => {
  const b = z.object({ starred: z.boolean() }).parse(req.body ?? {});
  await requireChannelMembership(req.user.id, req.params.id);
  await one(`UPDATE channel_members SET starred=$3 WHERE channel_id=$1 AND user_id=$2 RETURNING channel_id`,
    [req.params.id, req.user.id, b.starred]);
  res.json({ ok: true, starred: b.starred });
}));

/* ============================================================ messages */
r.get("/api/channels/:id/messages", wrap(async (req, res) => {
  const { channel } = await requireChannelAccess(req.user.id, req.params.id);
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const before = req.query.before || null;
  const rows = await many(
    `SELECT ${MESSAGE_SELECT} FROM messages m LEFT JOIN users u ON u.id = m.user_id
      WHERE m.channel_id = $1 AND m.parent_id IS NULL
        AND ($2::timestamptz IS NULL OR m.created_at < $2::timestamptz)
      ORDER BY m.created_at DESC LIMIT $3`, [channel.id, before, limit]);
  const messages = (await decorate(rows)).reverse();
  res.json({ messages, hasMore: rows.length === limit });
}));

const newMessage = z.object({
  body: z.string().max(8000).optional().default(""),
  kind: z.enum(["text", "voice"]).optional().default("text"),
  parentId: z.string().uuid().nullable().optional(),
  replyToId: z.string().uuid().nullable().optional(),
  meta: z.record(z.any()).optional().default({}),
  attachmentIds: z.array(z.string().uuid()).optional().default([]),
});
r.post("/api/channels/:id/messages", wrap(async (req, res) => {
  const { channel } = await requireChannelMembership(req.user.id, req.params.id);
  const b = newMessage.parse(req.body ?? {});
  if (!b.body.trim() && !b.attachmentIds.length && b.kind !== "voice") throw badRequest("empty_message");

  const msg = await tx(async c => {
    const m = (await c.query(
      `INSERT INTO messages (channel_id, user_id, parent_id, reply_to_id, kind, body, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [channel.id, req.user.id, b.parentId || null, b.replyToId || null, b.kind, b.body, b.meta])).rows[0];
    if (b.attachmentIds.length) {
      await c.query(
        `UPDATE attachments SET message_id=$1 WHERE id = ANY($2::uuid[]) AND uploader_id=$3 AND message_id IS NULL`,
        [m.id, b.attachmentIds, req.user.id]);
    }
    await c.query(
      `UPDATE channel_members SET last_read_message_id=$3, last_read_at=now() WHERE channel_id=$1 AND user_id=$2`,
      [channel.id, req.user.id, m.id]);
    return m;
  });

  const full = await loadMessage(msg.id);
  hub.toChannel(channel.id, "message:new", { message: full });
  res.status(201).json({ message: full });
}));

r.patch("/api/messages/:id", wrap(async (req, res) => {
  const b = z.object({ body: z.string().max(8000) }).parse(req.body ?? {});
  const m = await one(`SELECT * FROM messages WHERE id=$1`, [req.params.id]);
  if (!m) throw notFound("message_not_found");
  if (m.user_id !== req.user.id) throw forbidden("not_your_message");
  await requireChannelAccess(req.user.id, m.channel_id);
  await one(`UPDATE messages SET body=$2, edited_at=now() WHERE id=$1 RETURNING id`, [m.id, b.body]);
  const full = await loadMessage(m.id);
  hub.toChannel(m.channel_id, "message:updated", { message: full });
  res.json({ message: full });
}));

r.delete("/api/messages/:id", wrap(async (req, res) => {
  const m = await one(`SELECT * FROM messages WHERE id=$1`, [req.params.id]);
  if (!m) throw notFound("message_not_found");
  const { channel } = await requireChannelAccess(req.user.id, m.channel_id);
  const owner = await one(`SELECT role FROM channel_members WHERE channel_id=$1 AND user_id=$2`, [channel.id, req.user.id]);
  if (m.user_id !== req.user.id && owner?.role !== "owner") throw forbidden("not_your_message");
  await one(`UPDATE messages SET deleted_at=now(), body='' WHERE id=$1 RETURNING id`, [m.id]);
  await one(`DELETE FROM pins WHERE message_id=$1 RETURNING message_id`, [m.id]);
  hub.toChannel(m.channel_id, "message:deleted", { messageId: m.id, channelId: m.channel_id });
  res.json({ ok: true });
}));

/* Thread = parent + its replies. */
r.get("/api/messages/:id/thread", wrap(async (req, res) => {
  const parent = await one(`SELECT * FROM messages WHERE id=$1`, [req.params.id]);
  if (!parent) throw notFound("message_not_found");
  await requireChannelAccess(req.user.id, parent.channel_id);
  const rows = await many(
    `SELECT ${MESSAGE_SELECT} FROM messages m LEFT JOIN users u ON u.id=m.user_id
      WHERE m.id=$1 OR m.parent_id=$1 ORDER BY m.created_at ASC`, [parent.id]);
  const all = await decorate(rows);
  res.json({ parent: all[0], replies: all.slice(1) });
}));

/* ============================================================ reactions */
r.post("/api/messages/:id/reactions", wrap(async (req, res) => {
  const b = z.object({ emoji: z.string().min(1).max(32) }).parse(req.body ?? {});
  const m = await one(`SELECT * FROM messages WHERE id=$1`, [req.params.id]);
  if (!m) throw notFound("message_not_found");
  await requireChannelAccess(req.user.id, m.channel_id);
  await one(
    `INSERT INTO reactions (message_id,user_id,emoji) VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING RETURNING message_id`, [m.id, req.user.id, b.emoji]);
  const full = await loadMessage(m.id);
  hub.toChannel(m.channel_id, "message:updated", { message: full });
  res.json({ message: full });
}));

r.delete("/api/messages/:id/reactions/:emoji", wrap(async (req, res) => {
  const m = await one(`SELECT * FROM messages WHERE id=$1`, [req.params.id]);
  if (!m) throw notFound("message_not_found");
  await requireChannelAccess(req.user.id, m.channel_id);
  await one(`DELETE FROM reactions WHERE message_id=$1 AND user_id=$2 AND emoji=$3 RETURNING message_id`,
    [m.id, req.user.id, decodeURIComponent(req.params.emoji)]);
  const full = await loadMessage(m.id);
  hub.toChannel(m.channel_id, "message:updated", { message: full });
  res.json({ message: full });
}));

/* ============================================================ pins */
r.get("/api/channels/:id/pins", wrap(async (req, res) => {
  await requireChannelAccess(req.user.id, req.params.id);
  const rows = await many(
    `SELECT ${MESSAGE_SELECT} FROM pins p JOIN messages m ON m.id=p.message_id
       LEFT JOIN users u ON u.id=m.user_id
      WHERE p.channel_id=$1 AND m.deleted_at IS NULL ORDER BY p.created_at DESC`, [req.params.id]);
  res.json({ messages: await decorate(rows) });
}));

r.post("/api/channels/:id/pins/:messageId", wrap(async (req, res) => {
  await requireChannelMembership(req.user.id, req.params.id);
  await one(`INSERT INTO pins (channel_id,message_id,pinned_by) VALUES ($1,$2,$3)
             ON CONFLICT DO NOTHING RETURNING channel_id`, [req.params.id, req.params.messageId, req.user.id]);
  hub.toChannel(req.params.id, "pin:changed", { channelId: req.params.id, messageId: req.params.messageId, pinned: true });
  res.json({ ok: true, pinned: true });
}));

r.delete("/api/channels/:id/pins/:messageId", wrap(async (req, res) => {
  await requireChannelMembership(req.user.id, req.params.id);
  await one(`DELETE FROM pins WHERE channel_id=$1 AND message_id=$2 RETURNING channel_id`, [req.params.id, req.params.messageId]);
  hub.toChannel(req.params.id, "pin:changed", { channelId: req.params.id, messageId: req.params.messageId, pinned: false });
  res.json({ ok: true, pinned: false });
}));

/* ============================================================ read state */
r.post("/api/channels/:id/read", wrap(async (req, res) => {
  const b = z.object({ messageId: z.string().uuid().nullable().optional() }).parse(req.body ?? {});
  await requireChannelMembership(req.user.id, req.params.id);
  await one(
    `UPDATE channel_members SET last_read_message_id=COALESCE($3,last_read_message_id), last_read_at=now()
      WHERE channel_id=$1 AND user_id=$2 RETURNING channel_id`,
    [req.params.id, req.user.id, b.messageId ?? null]);
  hub.toUsers([req.user.id], "read", { channelId: req.params.id, messageId: b.messageId ?? null });
  res.json({ ok: true });
}));

/* ============================================================ search + activity */
r.get("/api/workspaces/:id/search", wrap(async (req, res) => {
  await requireWorkspaceMember(req.user.id, req.params.id);
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json({ messages: [] });
  const rows = await many(
    `SELECT ${MESSAGE_SELECT}, c.slug AS channel_slug, c.is_dm
       FROM messages m
       JOIN channels c ON c.id = m.channel_id
       LEFT JOIN users u ON u.id = m.user_id
       LEFT JOIN channel_members cm ON cm.channel_id = c.id AND cm.user_id = $2
      WHERE c.workspace_id = $1 AND m.deleted_at IS NULL
        AND (c.is_private = false AND c.is_dm = false OR cm.user_id IS NOT NULL)
        AND (m.search_tsv @@ websearch_to_tsquery('english', $3) OR m.body ILIKE '%'||$3||'%')
      ORDER BY m.created_at DESC LIMIT 40`, [req.params.id, req.user.id, q]);
  const messages = await decorate(rows);
  res.json({ messages: messages.map((m, i) => ({ ...m, channelSlug: rows[i].channel_slug, isDm: rows[i].is_dm })) });
}));

/* Mentions of me + reactions to my messages + replies in my threads. */
r.get("/api/workspaces/:id/activity", wrap(async (req, res) => {
  await requireWorkspaceMember(req.user.id, req.params.id);
  const me = req.user.id;
  const mentions = await many(
    `SELECT ${MESSAGE_SELECT}, 'mention' AS kind_of
       FROM messages m JOIN channels c ON c.id=m.channel_id
       LEFT JOIN users u ON u.id=m.user_id
       LEFT JOIN channel_members cm ON cm.channel_id=c.id AND cm.user_id=$2
      WHERE c.workspace_id=$1 AND m.deleted_at IS NULL AND m.user_id <> $2
        AND (c.is_private=false AND c.is_dm=false OR cm.user_id IS NOT NULL)
        AND m.body ILIKE '%<@'||$2||'>%'
      ORDER BY m.created_at DESC LIMIT 30`, [req.params.id, me]);
  const reacted = await many(
    `SELECT DISTINCT ON (m.id) ${MESSAGE_SELECT}, 'reaction' AS kind_of
       FROM reactions rx JOIN messages m ON m.id=rx.message_id
       JOIN channels c ON c.id=m.channel_id LEFT JOIN users u ON u.id=m.user_id
      WHERE c.workspace_id=$1 AND m.user_id=$2 AND rx.user_id<>$2 AND m.deleted_at IS NULL
      ORDER BY m.id, m.created_at DESC LIMIT 30`, [req.params.id, me]);
  const items = await decorate([...mentions, ...reacted]);
  const kinds = [...mentions, ...reacted].map(r => r.kind_of);
  res.json({ items: items.map((m, i) => ({ ...m, activity: kinds[i] })) });
}));

/* Threads I participate in. */
r.get("/api/workspaces/:id/threads", wrap(async (req, res) => {
  await requireWorkspaceMember(req.user.id, req.params.id);
  const rows = await many(
    `SELECT ${MESSAGE_SELECT} FROM messages m
       JOIN channels c ON c.id=m.channel_id LEFT JOIN users u ON u.id=m.user_id
       LEFT JOIN channel_members cm ON cm.channel_id=c.id AND cm.user_id=$2
      WHERE c.workspace_id=$1 AND m.parent_id IS NULL AND m.deleted_at IS NULL
        AND (c.is_private=false AND c.is_dm=false OR cm.user_id IS NOT NULL)
        AND EXISTS (SELECT 1 FROM messages rp WHERE rp.parent_id=m.id AND rp.deleted_at IS NULL)
      ORDER BY m.created_at DESC LIMIT 40`, [req.params.id, req.user.id]);
  res.json({ threads: await decorate(rows) });
}));

/* ============================================================ files */
r.post("/api/workspaces/:id/uploads", wrap(async (req, res) => {
  await requireWorkspaceMember(req.user.id, req.params.id);
  const b = z.object({
    filename: z.string().min(1).max(200),
    mime: z.string().max(120).optional().default("application/octet-stream"),
    size: z.number().int().positive().max(config.s3.maxUploadBytes),
    width: z.number().int().optional(), height: z.number().int().optional(),
    durationMs: z.number().int().optional(),
  }).parse(req.body ?? {});

  const key = buildKey(req.params.id, b.filename);
  const uploadUrl = await presignUpload(key, b.mime);
  const att = await one(
    `INSERT INTO attachments (workspace_id, uploader_id, object_key, filename, mime, size_bytes, width, height, duration_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.params.id, req.user.id, key, b.filename, b.mime, b.size, b.width ?? null, b.height ?? null, b.durationMs ?? null]);
  res.status(201).json({ attachmentId: att.id, uploadUrl, method: "PUT", headers: { "Content-Type": b.mime } });
}));

r.get("/api/attachments/:id/url", wrap(async (req, res) => {
  const att = await one(`SELECT * FROM attachments WHERE id=$1`, [req.params.id]);
  if (!att) throw notFound("attachment_not_found");
  if (att.message_id) {
    const m = await one(`SELECT channel_id FROM messages WHERE id=$1`, [att.message_id]);
    if (m) await requireChannelAccess(req.user.id, m.channel_id);
  } else {
    await requireWorkspaceMember(req.user.id, att.workspace_id);
  }
  res.json({ url: await presignDownload(att.object_key, att.filename), filename: att.filename, mime: att.mime });
}));

r.delete("/api/attachments/:id", wrap(async (req, res) => {
  const att = await one(`SELECT * FROM attachments WHERE id=$1`, [req.params.id]);
  if (!att) throw notFound("attachment_not_found");
  if (att.uploader_id !== req.user.id) throw forbidden("not_your_upload");
  await one(`DELETE FROM attachments WHERE id=$1 RETURNING id`, [att.id]);
  await deleteObject(att.object_key);
  res.json({ ok: true });
}));

/* ============================================================ huddles */
r.get("/api/channels/:id/huddle", wrap(async (req, res) => {
  await requireChannelAccess(req.user.id, req.params.id);
  const h = await one(`SELECT * FROM huddles WHERE channel_id=$1 AND ended_at IS NULL`, [req.params.id]);
  if (!h) return res.json({ huddle: null });
  const peers = await many(
    `SELECT hp.user_id, hp.mic, hp.camera, hp.screen, u.name, u.avatar_url
       FROM huddle_participants hp JOIN users u ON u.id=hp.user_id
      WHERE hp.huddle_id=$1 AND hp.left_at IS NULL`, [h.id]);
  res.json({ huddle: { id: h.id, channelId: h.channel_id, startedAt: h.started_at, peers } });
}));

export default r;
