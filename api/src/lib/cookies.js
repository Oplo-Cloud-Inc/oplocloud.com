/* ==========================================================================
   The session cookie.

   Kept in one file because the flags are the security, and flags scattered
   across handlers drift. Every one of them below is load-bearing:

     HttpOnly   script cannot read it, so an XSS bug does not become a
                stolen session
     Secure     never sent over plain HTTP
     SameSite   Lax, so it survives a normal top-level navigation back to the
                site but is not attached to a cross-site form post
     Path=/     one session for the whole platform, which is the point of a
                platform account
   ========================================================================== */

export const SESSION_COOKIE = "oplo_session";

export function sessionCookie(token, { maxAge, env } = {}) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax"
  ];
  // Secure is mandatory in production. On localhost over http it would stop
  // the cookie being set at all, which would make local development
  // impossible rather than secure.
  if (!env || env.ENVIRONMENT === "production") parts.push("Secure");
  if (env && env.COOKIE_DOMAIN) parts.push(`Domain=${env.COOKIE_DOMAIN}`);
  parts.push(`Max-Age=${Math.floor((maxAge ?? 0) / 1000)}`);
  return parts.join("; ");
}

export function clearCookie(env) {
  return sessionCookie("", { maxAge: 0, env });
}

export function readCookie(request, name) {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const bit of raw.split(";")) {
    const eq = bit.indexOf("=");
    if (eq < 0) continue;
    if (bit.slice(0, eq).trim() === name) return bit.slice(eq + 1).trim();
  }
  return null;
}
