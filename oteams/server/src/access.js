// Authorisation helpers. Every route funnels through these so membership is
// checked in exactly one place.
import { one, many } from "./db.js";

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const notFound = m => new HttpError(404, m || "not_found");
export const forbidden = m => new HttpError(403, m || "forbidden");
export const badRequest = m => new HttpError(400, m || "bad_request");

/** Throws unless the user belongs to the workspace. Returns the membership row. */
export async function requireWorkspaceMember(userId, workspaceId) {
  const row = await one(
    `SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, userId]
  );
  if (!row) throw forbidden("not_a_workspace_member");
  return row;
}

/**
 * Throws unless the user can read the channel.
 * Public channels are readable by any workspace member; private channels and
 * DMs require explicit channel membership.
 */
export async function requireChannelAccess(userId, channelId) {
  const ch = await one(`SELECT * FROM channels WHERE id = $1`, [channelId]);
  if (!ch) throw notFound("channel_not_found");

  const membership = await one(
    `SELECT * FROM channel_members WHERE channel_id = $1 AND user_id = $2`,
    [channelId, userId]
  );

  if (ch.is_private || ch.is_dm) {
    if (!membership) throw forbidden("not_a_channel_member");
  } else {
    await requireWorkspaceMember(userId, ch.workspace_id);
  }
  return { channel: ch, membership };
}

/** Channel access + guaranteed membership row (auto-joins public channels). */
export async function requireChannelMembership(userId, channelId) {
  const { channel, membership } = await requireChannelAccess(userId, channelId);
  if (membership) return { channel, membership };
  const joined = await one(
    `INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)
     ON CONFLICT (channel_id, user_id) DO UPDATE SET channel_id = EXCLUDED.channel_id
     RETURNING *`,
    [channelId, userId]
  );
  return { channel, membership: joined };
}

/** Every user id that should receive realtime events for a channel. */
export async function channelAudience(channelId) {
  const ch = await one(`SELECT * FROM channels WHERE id = $1`, [channelId]);
  if (!ch) return [];
  if (ch.is_private || ch.is_dm) {
    const rows = await many(`SELECT user_id FROM channel_members WHERE channel_id = $1`, [channelId]);
    return rows.map(r => r.user_id);
  }
  const rows = await many(`SELECT user_id FROM workspace_members WHERE workspace_id = $1`, [ch.workspace_id]);
  return rows.map(r => r.user_id);
}

/** Deterministic key so a DM between the same people is always the same channel. */
export function dmKey(userIds) {
  return [...new Set(userIds)].sort().join(":");
}
