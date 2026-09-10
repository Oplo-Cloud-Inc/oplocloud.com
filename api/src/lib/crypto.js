/* ==========================================================================
   Passwords, tokens and ids.

   The rule this file exists to enforce: a database dump must not be a set of
   usable credentials. So passwords are stored as PBKDF2-SHA256 derivations
   over a per-account random salt, and session tokens are stored as SHA-256
   hashes — the token itself is shown to the browser once and never written
   down anywhere we control.

   Why PBKDF2 rather than Argon2id, which is the better answer in general:
   Workers give us WebCrypto and no native modules, and a WebAssembly Argon2
   would have to run inside a CPU-time budget measured in milliseconds. PBKDF2
   at a high iteration count is what this platform can honestly afford today.
   The iteration count is stored per account so it can be raised later and old
   passwords rehash themselves on next sign-in, and `verifyPassword` reports
   when a row is due for that — which is the part most implementations forget
   and the part that makes the number changeable at all.
   ========================================================================== */

const enc = new TextEncoder();

/* Deliberately below what a server with a dedicated CPU would use. A Worker
   invocation has a CPU budget, and a login that exceeds it fails closed for
   everybody — which is a worse security outcome than a slightly cheaper KDF. */
export const PBKDF2_ITERATIONS = 210000;

export function id(prefix) {
  // UUIDv4 without the hyphens, prefixed so an id is self-describing in a log
  // and cannot be pasted into the wrong table by accident.
  const raw = crypto.randomUUID().replace(/-/g, "");
  return prefix ? `${prefix}_${raw}` : raw;
}

export function randomToken(bytes = 32) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return base64url(buf);
}

export function base64url(buf) {
  const bin = String.fromCharCode(...new Uint8Array(buf));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function unb64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256
  );
}

export async function hashPassword(password, iterations = PBKDF2_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(password, salt, iterations);
  return { hash: b64(bits), salt: b64(salt), iterations };
}

/* Returns whether the password is right, and separately whether the stored
   row is weaker than what we now use. The caller rehashes on the second,
   which is how an iteration count gets raised across a live user base without
   anybody being locked out. */
export async function verifyPassword(password, account) {
  if (!account || !account.pw_hash || !account.pw_salt) {
    // Still spend the time. An account with no password set must not be
    // distinguishable by response time from one with a wrong password.
    await derive(password, crypto.getRandomValues(new Uint8Array(16)), PBKDF2_ITERATIONS);
    return { ok: false, needsRehash: false };
  }
  const iterations = account.pw_iterations || PBKDF2_ITERATIONS;
  const bits = await derive(password, unb64(account.pw_salt), iterations);
  const ok = timingSafeEqual(new Uint8Array(bits), unb64(account.pw_hash));
  return { ok, needsRehash: ok && iterations < PBKDF2_ITERATIONS };
}

/* Compared to the end regardless of where it diverges. Returning early on the
   first mismatch leaks, through timing, how much of a guess was correct. */
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* Session tokens are hashed with a server-side pepper before storage, so a
   leaked database still cannot be turned into live sessions without also
   holding a secret that never leaves Cloudflare's secret store. */
export async function hashToken(token, pepper) {
  const bits = await crypto.subtle.digest("SHA-256", enc.encode(`${pepper || ""}:${token}`));
  return b64(bits);
}
