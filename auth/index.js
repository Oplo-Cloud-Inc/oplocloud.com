/* ==========================================================================
   Oplo Account — auth.oplocloud.com

   The Worker in front of the sign-in page. It does three small things:

      1. Answers every page address (/, /sign-in, /recovery, /register) with
         the one page, public/index.html, which switches view by path.

      2. Serves the page's own files and connect.js, the script every Oplo
         service loads to open this host in a tab of its own.

      3. Serves the OIDC discovery document at
         /.well-known/openid-configuration.

   and puts the same security headers on all of it. Identity itself is
   api.oplocloud.com's: the page posts to the API directly, so no password
   and no session ever passes through here.

   This used to proxy /api/* to the API as well. It is gone on purpose: a
   session cookie set through a proxy lands on auth.oplocloud.com, where no
   service can use it, instead of on api.oplocloud.com, where every service
   already sends it.
   ========================================================================== */

const API_BASE = "https://api.oplocloud.com";

/* The page addresses, all one segment deep, so the page's relative links
   (auth.css, app.js) resolve to the root from every one of them. A trailing
   slash is taken off and any other address goes to sign-in, keeping the
   query — it is a sign-in page, and a mistyped path should land on sign-in.
   Anything that looks like a file is looked up as a file, so a mistyped
   script src is a 404 rather than HTML with a 200. */
const PAGES = new Set(["/", "/sign-in", "/recovery", "/register"]);

function isFile(pathname) {
  return /\.[A-Za-z0-9]{1,8}$/.test(pathname);
}

/* The page may not be framed — a sign-in page inside somebody else's frame is
   how a password is collected under false pretences — and it only talks to
   the API. The opener is deliberately left alone (no COOP): the tab has to be
   able to tell the service that opened it that it is done. */
function pageHeaders(env) {
  const local = env.ENVIRONMENT !== "production";
  const api = local ? "http://localhost:8787 http://127.0.0.1:8787" : API_BASE;
  return {
    "content-security-policy": [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      `connect-src 'self' ${api}`,
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; "),
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()"
  };
}

function withHeaders(response, extra) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(response.body, {
    status: response.status, statusText: response.statusText, headers
  });
}

/* ---------------------------------------------------------- OIDC discovery
   Where the identity endpoints are, for when Oplo products speak OIDC. Today
   the session routes live on api.oplocloud.com and this document points at
   them. */
function oidcDiscovery(url) {
  const base = url.origin;
  return {
    issuer: base,
    authorization_endpoint: `${base}/`,
    token_endpoint: `${API_BASE}/api/v1/auth/token`,
    userinfo_endpoint: `${API_BASE}/api/v1/me`,
    jwks_uri: `${API_BASE}/api/v1/auth/jwks`,
    scopes_supported: ["openid", "profile", "email"],
    response_types_supported: ["code", "id_token"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    code_challenge_methods_supported: ["S256"]
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.protocol === "http:" && env.ENVIRONMENT === "production") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }

    if (url.pathname === "/.well-known/openid-configuration") {
      return new Response(JSON.stringify(oidcDiscovery(url)), {
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=3600",
          "access-control-allow-origin": "*"
        }
      });
    }

    /* connect.js is loaded by every service's pages, so it is cached — but
       briefly, so a change to how sign-in works reaches them within minutes. */
    if (url.pathname === "/connect.js") {
      const res = await env.ASSETS.fetch(request);
      return withHeaders(res, {
        "cache-control": "public, max-age=300",
        "x-content-type-options": "nosniff"
      });
    }

    if (isFile(url.pathname)) {
      const res = await env.ASSETS.fetch(request);
      return withHeaders(res, { ...pageHeaders(env), "cache-control": "no-cache" });
    }

    if (!PAGES.has(url.pathname)) {
      const bare = url.pathname.replace(/\/+$/, "");
      const to = new URL(PAGES.has(bare) ? bare : "/", url);
      to.search = url.search;
      return Response.redirect(to.toString(), PAGES.has(bare) ? 308 : 302);
    }

    /* Every page address is the one page; app.js reads the path.
       no-transform keeps Cloudflare from injecting its analytics beacon into
       the page: a third-party script has no place on a password page, and the
       CSP would only block it with an error in the console. */
    const page = new URL("/", url);
    const res = await env.ASSETS.fetch(new Request(page, request));
    return withHeaders(res, { ...pageHeaders(env), "cache-control": "no-store, no-transform" });
  }
};
