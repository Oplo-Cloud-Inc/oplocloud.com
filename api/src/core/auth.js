/* ==========================================================================
   Authentication — "who are you?"

   The one rule: the client never tells us who it is. It presents a session
   token, and this file turns that token into an account by looking it up.
   There is no code path anywhere in this API where an account id arrives in a
   request body or header and is believed.

   Sign-in also has to fail identically whether the email is unknown or the
   password is wrong. Otherwise the login form becomes an oracle for which
   addresses hold accounts, which is a privacy leak before it is a security
   one — it tells an attacker who is a customer.
   ========================================================================== */

import { ApiError } from "../lib/http.js";
import { hashPassword, verifyPassword, randomToken, hashToken } from "../lib/crypto.js";
import { SESSION_COOKIE, readCookie } from "../lib/cookies.js";

export const SESSION_LIFETIME = 30 * 24 * 60 * 60 * 1000;   // 30 days
const RENEW_AFTER = 24 * 60 * 60 * 1000;                    // slide once a day

/* A session token is replaced once a week even while it is in constant use.

   The reason is containment, not paranoia. A token that leaks — copied off a
   shared machine, pulled from a proxy log — is otherwise good for its full
   thirty days. Rotation puts a ceiling on that: the stolen token stops
   working the next time the real user's browser rotates, and because the old
   row is revoked rather than deleted, a token used after its rotation is a
   signal that something is wrong rather than silence.

   The window matters. Rotating on every request is the textbook answer and it
   is wrong here: two requests in flight at once would race, one would present
   the token the other just replaced, and the user would be signed out by
   their own app. A week is long enough that the race effectively never
   happens and short enough to matter. */
const ROTATE_AFTER = 7 * 24 * 60 * 60 * 1000;

export async function signIn(ctx, { email, password, userAgent }) {
  const account = await ctx.repo.findAccountByEmail(email);

  // Verify either way. A missing account must cost the same wall-clock time
  // as a wrong password, or the timing tells the attacker which it was.
  const { ok, needsRehash } = await verifyPassword(password, account);

  if (!account || !ok) {
    throw new ApiError(401, "invalid_credentials",
      "That email and password do not match an account.");
  }
  if (account.status === "suspended") {
    throw ApiError.forbidden("This account has been suspended.");
  }

  if (needsRehash) {
    const fresh = await hashPassword(password);
    await ctx.repo.updatePassword(account.id, fresh);
  }

  return issueSession(ctx, account, userAgent);
}

export async function issueSession(ctx, account, userAgent) {
  const token = randomToken(32);
  const tokenHash = await hashToken(token, ctx.env.SESSION_PEPPER);
  const expiresAt = Date.now() + SESSION_LIFETIME;
  await ctx.repo.createSession({
    accountId: account.id, tokenHash, expiresAt, userAgent
  });
  return { token, expiresAt, account };
}

/* Resolves the caller. Returns null rather than throwing, because plenty of
   endpoints are legitimately reachable signed out — deciding that anonymous
   is an error is the route's business, not this function's. */
export async function currentActor(ctx) {
  const token = bearerOrCookie(ctx.request);
  if (!token) return null;

  const tokenHash = await hashToken(token, ctx.env.SESSION_PEPPER);
  const session = await ctx.repo.findSession(tokenHash);
  if (!session) return null;

  const account = await ctx.repo.findAccountById(session.account_id);
  if (!account || account.status === "suspended") return null;

  // Touched at most once a day. Writing on every request would turn a read
  // endpoint into a write endpoint and burn the D1 write budget for nothing.
  if (Date.now() - session.last_seen_at > RENEW_AFTER) {
    ctx.waitUntil(ctx.repo.touchSession(session.id));
  }

  /* Due for rotation. The new token is handed back on this response, which
     the router turns into a Set-Cookie — so the swap is invisible unless
     somebody is holding a copy of the old one. */
  if (Date.now() - session.created_at > ROTATE_AFTER) {
    ctx.rotate = session;
  }

  const [roles, orgs] = await Promise.all([
    ctx.repo.rolesFor(account.id),
    ctx.repo.membershipsFor(account.id)
  ]);

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    firstName: account.first_name,
    initials: account.initials,
    hue: account.avatar_hue,
    title: account.title,
    emailVerified: !!account.email_verified,
    sessionId: session.id,
    roles,
    orgs
  };
}

/* A bearer token is accepted as well as the cookie so that non-browser
   clients — a script, a native app, a test — do not need cookie handling. The
   browser path stays cookie-only, because a token in JavaScript is a token
   that an XSS bug can steal. */
function bearerOrCookie(request) {
  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return readCookie(request, SESSION_COOKIE);
}

export function requireActor(ctx) {
  if (!ctx.actor) throw ApiError.unauthorized();
  return ctx.actor;
}

export async function signOut(ctx) {
  if (ctx.actor) await ctx.repo.revokeSession(ctx.actor.sessionId);
}

/* Issues a replacement and revokes the old one. Called by the router when
   `currentActor` flagged a session as due, so no route has to remember. */
export async function rotateSession(ctx, old) {
  const account = await ctx.repo.findAccountById(old.account_id);
  if (!account) return null;
  const issued = await issueSession(ctx, account,
    ctx.request.headers.get("user-agent"));
  await ctx.repo.revokeSession(old.id);
  return issued;
}

/* ------------------------------------------------------------ Rate limiting
   Login is the endpoint worth slowing down. It is slowed on two different
   keys because they are defending against two different things, and — this is
   the part that is easy to get wrong — they need very different numbers.

     per account   a few attempts. This protects one person's password from
                   being guessed, and a real user who has forgotten theirs
                   does not need forty tries.

     per address   generously high. This only blunts a spray across many
                   accounts, and the addresses it sees are shared: a school
                   sits behind one NAT, so a tight per-address limit locks out
                   a classroom the moment the ninth student signs in. That is
                   not a security control, it is an outage — and it would
                   arrive during a lesson.

   In-memory and therefore per-isolate: a speed bump, not a wall. Calling it
   anything else would be a lie. A limiter that actually holds needs Durable
   Objects or KV, and that is a real Phase 2 item rather than something
   quietly missing here. */
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
const LIMITS = { pw: 8, ip: 120 };

export function rateLimit(key) {
  const kind = key.split(":")[0];
  const max = LIMITS[kind] || 60;
  const now = Date.now();

  // The map is bounded. An unbounded counter keyed on attacker-supplied input
  // is a memory leak with a nice name.
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) {
      if (now - v.start > WINDOW) attempts.delete(k);
    }
  }

  const row = attempts.get(key);
  if (!row || now - row.start > WINDOW) {
    attempts.set(key, { start: now, n: 1 });
    return;
  }
  row.n++;
  if (row.n > max) {
    const retry = Math.ceil((row.start + WINDOW - now) / 1000);
    const mins = Math.ceil(retry / 60);
    throw ApiError.tooMany(
      kind === "pw"
        ? `Too many attempts on this account. Try again in ${mins} ${mins === 1 ? "minute" : "minutes"}.`
        : `Too many sign-in attempts from this network. Try again in ${mins} ${mins === 1 ? "minute" : "minutes"}.`,
      retry);
  }
}

export function rateLimitClear(key) { attempts.delete(key); }
