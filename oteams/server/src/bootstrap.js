// Creates the default workspace on first boot so a fresh deployment isn't empty.
// Anyone who signs in is auto-joined to it (see joinDefaultWorkspace).
import { one, many, tx } from "./db.js";
import { config } from "./config.js";

const STARTER_CHANNELS = [
  ["general",   "Company-wide announcements and general chatter"],
  ["random",    "Non-work banter"],
  ["engineering", "Shipping, incidents, and code review"],
  ["design",    "Design crits, specs, and the OTeams system"],
];

export async function bootstrapWorkspace() {
  const { workspaceSlug, workspaceName } = config.bootstrap;
  const existing = await one(`SELECT * FROM workspaces WHERE slug = $1`, [workspaceSlug]);
  if (existing) return existing;

  const ws = await tx(async c => {
    const w = (await c.query(
      `INSERT INTO workspaces (slug, name) VALUES ($1,$2) RETURNING *`,
      [workspaceSlug, workspaceName])).rows[0];
    for (const [slug, topic] of STARTER_CHANNELS) {
      await c.query(
        `INSERT INTO channels (workspace_id, slug, name, topic) VALUES ($1,$2,$2,$3)`,
        [w.id, slug, topic]);
    }
    return w;
  });
  console.log(`[bootstrap] created workspace "${workspaceName}" (${ws.id})`);
  return ws;
}

/**
 * Put a freshly-signed-in user into the default workspace (and its public
 * channels) so they land somewhere useful instead of an empty shell.
 * Called from the /api/me route on first sight of a user.
 */
export async function joinDefaultWorkspace(userId) {
  const ws = await one(`SELECT * FROM workspaces WHERE slug = $1`, [config.bootstrap.workspaceSlug]);
  if (!ws) return null;

  const already = await one(
    `SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2`, [ws.id, userId]);
  if (already) return ws;

  const isOwner = config.bootstrap.ownerEmail
    ? !!(await one(`SELECT 1 FROM users WHERE id=$1 AND lower(email)=$2`, [userId, config.bootstrap.ownerEmail]))
    : false;
  const anyOwner = await one(`SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND role='owner'`, [ws.id]);
  const role = isOwner || !anyOwner ? "owner" : "member";

  await one(
    `INSERT INTO workspace_members (workspace_id,user_id,role) VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING RETURNING workspace_id`, [ws.id, userId, role]);

  const publicChannels = await many(
    `SELECT id FROM channels WHERE workspace_id=$1 AND is_private=false AND is_dm=false`, [ws.id]);
  for (const ch of publicChannels) {
    await one(
      `INSERT INTO channel_members (channel_id,user_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING RETURNING channel_id`, [ch.id, userId]);
  }
  console.log(`[bootstrap] joined user ${userId} to ${ws.slug} as ${role}`);
  return ws;
}
