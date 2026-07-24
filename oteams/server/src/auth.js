// Authentication against Oplo Accounts (ZITADEL), speaking plain OIDC.
//
// ZITADEL can issue either JWT access tokens (when the app's "Auth Token Type"
// is JWT) or opaque ones. We support both:
//   • JWT   -> verified locally against the issuer's JWKS (fast, no round-trip)
//   • opaque-> exchanged at the issuer's /userinfo endpoint (the standard way)
// Results are cached briefly so a chatty client doesn't hammer the IdP.

import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose";
import { config } from "./config.js";
import { one } from "./db.js";

let jwks = null;
let discovery = null;

async function discover() {
  if (discovery) return discovery;
  const url = `${config.oidc.issuer}/.well-known/openid-configuration`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OIDC discovery failed (${res.status}) at ${url}`);
  discovery = await res.json();
  return discovery;
}

async function getJwks() {
  if (jwks) return jwks;
  const d = await discover();
  jwks = createRemoteJWKSet(new URL(d.jwks_uri));
  return jwks;
}

// token -> { sub, email, name, picture }
const cache = new Map(); // token -> { identity, expires }
function cacheGet(token) {
  const hit = cache.get(token);
  if (!hit) return null;
  if (hit.expires < Date.now()) { cache.delete(token); return null; }
  return hit.identity;
}
function cacheSet(token, identity) {
  cache.set(token, { identity, expires: Date.now() + config.oidc.cacheTtl * 1000 });
  if (cache.size > 5000) cache.delete(cache.keys().next().value);
}

function looksLikeJwt(token) {
  return token.split(".").length === 3;
}

async function identityFromUserinfo(token) {
  const d = await discover();
  const res = await fetch(d.userinfo_endpoint, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw Object.assign(new Error("invalid_token"), { status: 401 });
  const u = await res.json();
  return {
    sub: u.sub,
    email: u.email || null,
    name: u.name || u.preferred_username || u.given_name || "Oplo user",
    picture: u.picture || null,
  };
}

async function identityFromJwt(token) {
  const keys = await getJwks();
  const opts = { issuer: config.oidc.issuer };
  if (config.oidc.audience) opts.audience = config.oidc.audience;
  const { payload } = await jwtVerify(token, keys, opts);
  // ZITADEL puts profile claims in the ID token; access tokens may only carry `sub`.
  // Fall back to /userinfo when we don't have a name/email yet.
  if (!payload.email && !payload.name) {
    try { return await identityFromUserinfo(token); } catch { /* fall through */ }
  }
  return {
    sub: payload.sub,
    email: payload.email || null,
    name: payload.name || payload.preferred_username || "Oplo user",
    picture: payload.picture || null,
  };
}

/** Validate a bearer token and return the caller's identity. Throws 401 on failure. */
export async function verifyToken(token) {
  if (!token) throw Object.assign(new Error("missing_token"), { status: 401 });
  if (!config.oidc.issuer) throw Object.assign(new Error("oidc_not_configured"), { status: 503 });

  const cached = cacheGet(token);
  if (cached) return cached;

  let identity;
  if (looksLikeJwt(token)) {
    try {
      identity = await identityFromJwt(token);
    } catch (err) {
      // A JWT from another issuer, or an opaque token that happens to have dots.
      if (err?.status === 401) throw err;
      identity = await identityFromUserinfo(token);
    }
  } else {
    identity = await identityFromUserinfo(token);
  }

  if (!identity?.sub) throw Object.assign(new Error("invalid_token"), { status: 401 });
  cacheSet(token, identity);
  return identity;
}

/** Upsert the local user row for an OIDC identity and return it. */
export async function upsertUser(identity) {
  return one(
    `INSERT INTO users (sub, email, name, avatar_url, last_seen_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (sub) DO UPDATE
       SET email        = COALESCE(EXCLUDED.email, users.email),
           name         = EXCLUDED.name,
           avatar_url   = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
           last_seen_at = now()
     RETURNING *`,
    [identity.sub, identity.email, identity.name, identity.picture]
  );
}

function bearerFrom(req) {
  const h = req.headers.authorization || "";
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim();
  return null;
}

/** Express middleware — attaches req.user (the local users row). */
export async function requireAuth(req, res, next) {
  try {
    const identity = await verifyToken(bearerFrom(req));
    req.identity = identity;
    req.user = await upsertUser(identity);
    next();
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message || "unauthorized" });
  }
}

/** Same check, for the WebSocket handshake. Returns the local user row. */
export async function authenticateSocket(token) {
  const identity = await verifyToken(token);
  return upsertUser(identity);
}
