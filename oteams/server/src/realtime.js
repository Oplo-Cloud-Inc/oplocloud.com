// Realtime hub: one WebSocket per browser tab, fanned out per user id.
// Carries messages, typing, presence, read receipts — and relays WebRTC
// signaling for huddles (this server never touches media, only SDP/ICE).
import { WebSocketServer } from "ws";
import { authenticateSocket } from "./auth.js";
import { channelAudience, requireChannelAccess } from "./access.js";
import { one, many } from "./db.js";

/** userId -> Set<ws> */
const sockets = new Map();

function add(userId, ws) {
  let set = sockets.get(userId);
  if (!set) { set = new Set(); sockets.set(userId, set); }
  set.add(ws);
  return set.size === 1; // first connection for this user
}
function remove(userId, ws) {
  const set = sockets.get(userId);
  if (!set) return false;
  set.delete(ws);
  if (set.size === 0) { sockets.delete(userId); return true; } // last one gone
  return false;
}

function send(ws, type, payload) {
  if (ws.readyState !== ws.OPEN) return;
  try { ws.send(JSON.stringify({ type, ...payload })); } catch {}
}

export const hub = {
  /** Send to every socket of every listed user. */
  toUsers(userIds, type, payload) {
    for (const id of new Set(userIds)) {
      const set = sockets.get(id);
      if (!set) continue;
      for (const ws of set) send(ws, type, payload);
    }
  },
  /** Send to everyone who can see the channel. */
  async toChannel(channelId, type, payload) {
    const audience = await channelAudience(channelId);
    this.toUsers(audience, type, payload);
  },
  isOnline(userId) { return sockets.has(userId); },
  onlineUserIds() { return [...sockets.keys()]; },
};

async function setPresence(userId, presence) {
  const u = await one(
    `UPDATE users SET presence = $2, last_seen_at = now() WHERE id = $1 RETURNING id, presence`,
    [userId, presence]
  );
  if (!u) return;
  // Tell every workspace-mate.
  const mates = await many(
    `SELECT DISTINCT m2.user_id FROM workspace_members m1
       JOIN workspace_members m2 ON m2.workspace_id = m1.workspace_id
      WHERE m1.user_id = $1`,
    [userId]
  );
  hub.toUsers(mates.map(r => r.user_id), "presence", { userId, presence: u.presence });
}

export function attachRealtime(server) {
  const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 1024 * 256 });

  wss.on("connection", async (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });

    // Token may ride in the query string (?token=) or the first "auth" frame.
    const url = new URL(req.url, "http://localhost");
    let token = url.searchParams.get("token");

    const authenticate = async tok => {
      try {
        const user = await authenticateSocket(tok);
        ws.userId = user.id;
        const first = add(user.id, ws);
        send(ws, "ready", { userId: user.id, name: user.name });
        if (first) {
          // Respect a sticky away/dnd choice; otherwise mark active.
          const cur = await one(`SELECT presence FROM users WHERE id = $1`, [user.id]);
          if (!cur || cur.presence === "offline") await setPresence(user.id, "active");
          else await setPresence(user.id, cur.presence);
        }
      } catch (err) {
        send(ws, "error", { error: err.message || "unauthorized" });
        ws.close(4401, "unauthorized");
      }
    };

    if (token) await authenticate(token);

    ws.on("message", async raw => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      if (msg.type === "auth") return authenticate(msg.token);
      if (!ws.userId) return send(ws, "error", { error: "unauthenticated" });
      const me = ws.userId;

      try {
        switch (msg.type) {
          case "ping":
            return send(ws, "pong", { t: Date.now() });

          case "typing": {
            if (!msg.channelId) return;
            await requireChannelAccess(me, msg.channelId);
            const audience = (await channelAudience(msg.channelId)).filter(id => id !== me);
            return hub.toUsers(audience, "typing", { channelId: msg.channelId, userId: me });
          }

          case "presence": {
            const p = ["active", "away", "dnd"].includes(msg.presence) ? msg.presence : "active";
            return setPresence(me, p);
          }

          // ---------- Huddles (WebRTC signaling) ----------
          case "huddle:join": {
            const { channel } = await requireChannelAccess(me, msg.channelId);
            const huddle = await one(
              `INSERT INTO huddles (channel_id, started_by)
               SELECT $1, $2
               WHERE NOT EXISTS (SELECT 1 FROM huddles WHERE channel_id = $1 AND ended_at IS NULL)
               RETURNING *`,
              [channel.id, me]
            ) || await one(`SELECT * FROM huddles WHERE channel_id = $1 AND ended_at IS NULL`, [channel.id]);

            await one(
              `INSERT INTO huddle_participants (huddle_id, user_id, left_at)
               VALUES ($1, $2, NULL)
               ON CONFLICT (huddle_id, user_id) DO UPDATE SET left_at = NULL, joined_at = now()
               RETURNING *`,
              [huddle.id, me]
            );
            ws.huddleId = huddle.id;

            const peers = await many(
              `SELECT hp.user_id, hp.mic, hp.camera, hp.screen, u.name, u.avatar_url
                 FROM huddle_participants hp JOIN users u ON u.id = hp.user_id
                WHERE hp.huddle_id = $1 AND hp.left_at IS NULL`,
              [huddle.id]
            );
            send(ws, "huddle:joined", { huddleId: huddle.id, channelId: channel.id, peers });
            return hub.toChannel(channel.id, "huddle:participant", {
              huddleId: huddle.id, channelId: channel.id, userId: me, joined: true, peers,
            });
          }

          case "huddle:leave": {
            const huddleId = msg.huddleId || ws.huddleId;
            if (!huddleId) return;
            await leaveHuddle(me, huddleId);
            ws.huddleId = null;
            return;
          }

          case "huddle:state": {
            const huddleId = msg.huddleId || ws.huddleId;
            if (!huddleId) return;
            const p = await one(
              `UPDATE huddle_participants
                  SET mic = COALESCE($3, mic), camera = COALESCE($4, camera), screen = COALESCE($5, screen)
                WHERE huddle_id = $1 AND user_id = $2 RETURNING *`,
              [huddleId, me, msg.mic ?? null, msg.camera ?? null, msg.screen ?? null]
            );
            if (!p) return;
            const h = await one(`SELECT channel_id FROM huddles WHERE id = $1`, [huddleId]);
            return hub.toChannel(h.channel_id, "huddle:state", {
              huddleId, userId: me, mic: p.mic, camera: p.camera, screen: p.screen,
            });
          }

          // Relay an SDP offer/answer or ICE candidate to one specific peer.
          case "huddle:signal": {
            if (!msg.to || !msg.data) return;
            const huddleId = msg.huddleId || ws.huddleId;
            const peer = await one(
              `SELECT 1 FROM huddle_participants WHERE huddle_id = $1 AND user_id = $2 AND left_at IS NULL`,
              [huddleId, msg.to]
            );
            if (!peer) return;
            return hub.toUsers([msg.to], "huddle:signal", { huddleId, from: me, data: msg.data });
          }

          default:
            return;
        }
      } catch (err) {
        send(ws, "error", { error: err.message || "server_error" });
      }
    });

    ws.on("close", async () => {
      if (!ws.userId) return;
      if (ws.huddleId) { try { await leaveHuddle(ws.userId, ws.huddleId); } catch {} }
      const last = remove(ws.userId, ws);
      if (last) { try { await setPresence(ws.userId, "offline"); } catch {} }
    });
  });

  // Drop sockets that stopped responding.
  const beat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) { ws.terminate(); continue; }
      ws.isAlive = false;
      try { ws.ping(); } catch {}
    }
  }, 30_000);
  wss.on("close", () => clearInterval(beat));

  return wss;
}

async function leaveHuddle(userId, huddleId) {
  await one(
    `UPDATE huddle_participants SET left_at = now()
      WHERE huddle_id = $1 AND user_id = $2 AND left_at IS NULL RETURNING *`,
    [huddleId, userId]
  );
  const h = await one(`SELECT * FROM huddles WHERE id = $1`, [huddleId]);
  if (!h) return;

  const remaining = await many(
    `SELECT user_id FROM huddle_participants WHERE huddle_id = $1 AND left_at IS NULL`,
    [huddleId]
  );
  await hub.toChannel(h.channel_id, "huddle:participant", {
    huddleId, channelId: h.channel_id, userId, joined: false, remaining: remaining.length,
  });

  if (remaining.length === 0) {
    await one(`UPDATE huddles SET ended_at = now() WHERE id = $1 AND ended_at IS NULL RETURNING id`, [huddleId]);
    await hub.toChannel(h.channel_id, "huddle:ended", { huddleId, channelId: h.channel_id });
  }
}
