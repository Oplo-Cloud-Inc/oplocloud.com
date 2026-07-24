# OTeams Server

The real backend behind OTeams — messaging, huddles, and files for the Oplo ecosystem.
Self-hosted, no third-party SaaS: **Node + Postgres + WebSocket + MinIO + coturn**, with
sign-in delegated to **Oplo Accounts (ZITADEL)**.

---

## What it does

| Capability | How |
|---|---|
| Sign-in | Oplo Accounts (ZITADEL) over OIDC. The API validates the access token — JWT via JWKS, or opaque via `/userinfo`. No passwords are ever stored here. |
| Workspaces, channels, DMs | Postgres. DMs are channels with a deterministic `dm_key`, so "DM Ada" is idempotent. |
| Messages, threads, edits, deletes | `messages` table; a reply is a message with `parent_id`. Soft-deleted so threads don't tear. |
| Reactions, pins, read state, stars | Dedicated tables, all workspace-scoped. |
| Realtime | One WebSocket per tab at `/ws`, fanned out per user id: new/edited/deleted messages, reactions, typing, presence, pins, read state. |
| Huddles | WebRTC. This server only relays SDP/ICE — media flows peer-to-peer, with coturn for NAT traversal. |
| Files | Presigned S3 PUT/GET against MinIO, so bytes never pass through the API. |
| Search | Postgres full-text (`tsvector` + GIN) with a trigram fallback for partial words. |

Security posture: every route is membership-checked in one place (`src/access.js`).
Public channels are readable by workspace members; private channels and DMs require
explicit channel membership.

---

## Quick start (local)

You need Docker and a running Oplo Accounts (ZITADEL) instance.

```bash
cd oteams/server
cp .env.example .env
# edit .env — at minimum set:
#   OIDC_ISSUER=http://localhost:8080
#   S3_SECRET_KEY=<something 8+ chars>
#   TURN_PASSWORD=<something long>
docker compose up -d
docker compose logs -f api
```

Check it:

```bash
curl -s http://localhost:8787/healthz
# {"ok":true,"service":"oteams-server", ...}
```

Migrations run automatically on boot and are idempotent. The first boot also creates a
default **Northwind** workspace with `#general`, `#random`, `#engineering`, `#design`;
whoever signs in first becomes its owner (or set `BOOTSTRAP_OWNER_EMAIL`).

### Register OTeams in ZITADEL

1. Open the console: `http://localhost:8080/ui/console`
2. Create (or reuse) a **Project**, then add an **Application** → type **User Agent** → **PKCE**.
3. Redirect URI: `https://oplocloud.com/oteams/signin/callback.html`
   (local: `http://localhost:4173/oteams/signin/callback.html`)
4. Post-logout URI: `https://oplocloud.com/oteams/`
5. Copy the **Client ID** — the browser needs it.
6. *(Recommended)* Set the app's **Auth Token Type** to **JWT** so the API can verify tokens
   locally without a round-trip. If you leave it opaque, the API falls back to `/userinfo`
   automatically — it just costs one call per token per `AUTH_CACHE_TTL` window.

---

## Connecting the front-end

`oteams/app/api.js` ships with the app and is inert until you point it at a backend.
In the browser console (or from your sign-in code):

```js
OTeams.configure({ apiBase: "http://localhost:8787" });
OTeams.setToken(accessTokenFromZitadel);   // from oidc-client-ts
await OTeams.start();                      // -> "live" or "demo"
```

If no backend is configured **or** the API is unreachable, `start()` returns `"demo"` and
the app keeps running on its local seed data — the public demo at oplocloud.com never breaks.

Wire real sign-in by replacing the demo gate in `oteams/signin/index.html` with the same
`oidc-client-ts` flow already used by `oplo-accounts/demo/app.js`, then handing the access
token to `OTeams.setToken()`.

---

## Production

1. **DNS** → point `api.oteams.oplocloud.com` (and `files.oteams.oplocloud.com`) at the host.
2. **TLS** → run Caddy with the included `Caddyfile`; certificates are automatic.
   ```bash
   docker run -d --name caddy --network host \
     -v $PWD/Caddyfile:/etc/caddy/Caddyfile -v caddy_data:/data caddy:2
   ```
3. **.env** for production:
   ```
   NODE_ENV=production
   OIDC_ISSUER=https://accounts.oplo.com
   CORS_ORIGINS=https://oplocloud.com
   S3_PUBLIC_ENDPOINT=https://files.oteams.oplocloud.com
   TURN_URL=turn:api.oteams.oplocloud.com:3478
   ```
   Generate real secrets:
   ```bash
   openssl rand -base64 32   # POSTGRES_PASSWORD, S3_SECRET_KEY, TURN_PASSWORD
   ```
4. **Backups** — the only stateful pieces are the `oteams-db` and `oteams-files` volumes:
   ```bash
   docker compose exec -T db pg_dump -U oteams oteams | gzip > oteams-$(date +%F).sql.gz
   ```
5. **Upgrades** — `docker compose pull && docker compose up -d --build`. Migrations are
   applied on boot inside a transaction; a failed migration aborts startup rather than
   half-applying.

### Scaling note

Realtime fan-out is currently in-process, so run **one** API replica. To run several,
put a Postgres `LISTEN/NOTIFY` (or Redis) pub/sub behind `hub.toUsers()` in
`src/realtime.js` — that's the only change needed; everything else is already stateless.

---

## API surface

All routes below `/api` require `Authorization: Bearer <access token>`.

```
GET    /healthz
GET    /api/config                       ICE servers, upload limit
GET    /api/me                           profile + workspaces (auto-joins default ws)
PATCH  /api/me                           name, title, presence, status

GET    /api/workspaces/:id/members
GET    /api/workspaces/:id/channels      channels + DMs, with unread counts
POST   /api/workspaces/:id/channels      create a channel
POST   /api/workspaces/:id/dms           open/reuse a DM
GET    /api/workspaces/:id/search?q=
GET    /api/workspaces/:id/activity      mentions + reactions to me
GET    /api/workspaces/:id/threads
POST   /api/workspaces/:id/uploads       presign an upload

GET    /api/channels/:id                 channel + members
PATCH  /api/channels/:id                 topic / purpose
POST   /api/channels/:id/join|leave|star
GET    /api/channels/:id/messages?before=&limit=
POST   /api/channels/:id/messages
GET    /api/channels/:id/pins
POST   /api/channels/:id/pins/:messageId
DELETE /api/channels/:id/pins/:messageId
POST   /api/channels/:id/read
GET    /api/channels/:id/huddle

PATCH  /api/messages/:id                 edit (author only)
DELETE /api/messages/:id                 delete (author or channel owner)
GET    /api/messages/:id/thread
POST   /api/messages/:id/reactions
DELETE /api/messages/:id/reactions/:emoji

GET    /api/attachments/:id/url          presigned download
DELETE /api/attachments/:id
```

### WebSocket `/ws`

Connect with `?token=<access token>` (or send `{"type":"auth","token":"…"}` first).

**Client → server:** `auth`, `ping`, `typing`, `presence`, `huddle:join`, `huddle:leave`,
`huddle:state`, `huddle:signal`

**Server → client:** `ready`, `message:new`, `message:updated`, `message:deleted`,
`channel:created`, `channel:updated`, `pin:changed`, `typing`, `presence`, `read`,
`user:updated`, `huddle:joined`, `huddle:participant`, `huddle:state`, `huddle:signal`,
`huddle:ended`, `error`, `pong`

Huddles are peer-to-peer: `huddle:join` returns the current peers, then each pair exchanges
offer/answer/ICE through `huddle:signal`. The server never sees audio or video.

---

## Layout

```
server/
  docker-compose.yml   api + postgres + minio + coturn
  Dockerfile           production image (non-root, tini, healthcheck)
  Caddyfile            TLS reverse proxy
  migrations/          versioned SQL, applied once, in order
  src/
    index.js           bootstrap: migrate → ensure bucket → listen
    config.js          env
    db.js              pg pool + tx helper
    auth.js            ZITADEL token verification + user upsert
    access.js          membership checks (the only place authz lives)
    routes.js          the REST API
    realtime.js        WebSocket hub, presence, typing, huddle signaling
    storage.js         presigned S3/MinIO uploads
    bootstrap.js       default workspace + auto-join
```
