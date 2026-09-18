/* ==========================================================================
   Oplo Identity — auth.oplocloud.com

   The authentication portal. This Worker does three things:

      1. Serves the sign-in page at / and its variants (sign-in, register,
         recovery, callback) — all one page that switches by path.

      2. Forwards API calls to api.oplocloud.com, attaching the
         session cookie so the API can resolve the session itself.

      3. Serves the OIDC discovery document at /.well-known/openid-configuration
         so Oplo products can discover the identity endpoints.

   It is deliberately thin: all identity logic lives on api.oplocloud.com.
   This is the front door, not the vault.
   ========================================================================== */

   /* The platform API endpoint. Auth proxies calls here; the API
      resolves sessions and sets cookies on the oplocloud.com domain. */

  const API_BASE = "https://api.oplocloud.com";

  /* ------------------------------------------------------------- Pages
     The sign-in page is a single HTML document that switches its view
     based on the path. The same file serves /, /sign-in, /register,
     /recovery, and /callback. This is why it works without a build step
     and survives on a Worker that has no filesystem. */

  const SIGN_IN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title id="pageTitle">Sign in — Oplo</title>
<meta name="description" content="Sign in to your Oplo account.">
<meta name="theme-color" content="#ffffff">
<link rel="canonical" id="canonical" href="">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Oplo">
<meta property="og:title" content="Sign in — Oplo">
<meta property="og:description" content="Sign in to your Oplo account.">
<meta property="og:url" content="">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='84.13 107.80 206.73 194.91'%3E%3Cg transform='translate(73.919875, 252.710833)'%3E%3Cpath fill='%23000' d='M 77.929688 -144.414062 C 39.890625 -144.414062 10.710938 -112.648438 10.710938 -76.824219 C 10.710938 -43.953125 34.71875 -14.40625 71.652344 -10.339844 C 69.066406 -19.207031 68.699219 -23.269531 68.699219 -30.285156 C 68.699219 -66.851562 98.246094 -98.246094 135.179688 -98.246094 C 137.027344 -98.246094 139.613281 -98.246094 142.199219 -97.875 C 131.855469 -127.421875 106.371094 -144.414062 77.929688 -144.414062 Z M 130.378906 -138.132812 C 149.214844 -120.777344 158.449219 -101.199219 158.449219 -77.5625 C 158.449219 -32.503906 121.515625 3.324219 78.671875 3.324219 C 61.3125 3.324219 45.058594 -2.214844 29.917969 -12.558594 L 88.273438 33.609375 C 98.246094 41.367188 119.296875 49.492188 135.917969 49.492188 C 180.980469 49.492188 216.4375 12.925781 216.4375 -31.023438 C 216.4375 -56.140625 205.355469 -78.671875 185.78125 -94.183594 Z M 130.378906 -138.132812'/%3E%3C/g%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/oplo-design.css">
<link rel="stylesheet" href="/auth/auth.css">
<script>
  (function (r) {
    r.classList.add("oplo-motion");
    setTimeout(function () { if (!window.__oploMotion) r.classList.remove("oplo-motion"); }, 4000);
  })(document.documentElement);
</script>
<style>body { padding-top: 44px; }</style>
</head>
<body>
<nav class="nav" id="nav" aria-label="Oplo">
  <div class="nav-in">
    <a class="nav-brand" href="/" aria-label="Oplo home">
      <svg class="mark" viewBox="84.13 107.80 206.73 194.91" aria-hidden="true" focusable="false"><g transform="translate(73.919875, 252.710833)"><path fill="currentColor" d="M 77.929688 -144.414062 C 39.890625 -144.414062 10.710938 -112.648438 10.710938 -76.824219 C 10.710938 -43.953125 34.71875 -14.40625 71.652344 -10.339844 C 69.066406 -19.207031 68.699219 -23.269531 68.699219 -30.285156 C 68.699219 -66.851562 98.246094 -98.246094 135.179688 -98.246094 C 137.027344 -98.246094 139.613281 -98.246094 142.199219 -97.875 C 131.855469 -127.421875 106.371094 -144.414062 77.929688 -144.414062 Z M 130.378906 -138.132812 C 149.214844 -120.777344 158.449219 -101.199219 158.449219 -77.5625 C 158.449219 -32.503906 121.515625 3.324219 78.671875 3.324219 C 61.3125 3.324219 45.058594 -2.214844 29.917969 -12.558594 L 88.273438 33.609375 C 98.246094 41.367188 119.296875 49.492188 135.917969 49.492188 C 180.980469 49.492188 216.4375 12.925781 216.4375 -31.023438 C 216.4375 -56.140625 205.355469 -78.671875 185.78125 -94.183594 Z M 130.378906 -138.132812"/></g></svg>
    </a>
    <ul class="nav-links" id="navLinks">
      <li><a href="/products/">Products</a><button class="nav-more" type="button" aria-label="Products menu" aria-expanded="false" aria-controls="navMenu0"><svg viewBox="0 0 8 5" aria-hidden="true" focusable="false"><path d="M1 1l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></li>
      <li><a href="/solutions/">Solutions</a><button class="nav-more" type="button" aria-label="Solutions menu" aria-expanded="false" aria-controls="navMenu1"><svg viewBox="0 0 8 5" aria-hidden="true" focusable="false"><path d="M1 1l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></li>
      <li><a href="/resources/">Resources</a><button class="nav-more" type="button" aria-label="Resources menu" aria-expanded="false" aria-controls="navMenu2"><svg viewBox="0 0 8 5" aria-hidden="true" focusable="false"><path d="M1 1l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></li>
      <li><a href="/company/">Company</a><button class="nav-more" type="button" aria-label="Company menu" aria-expanded="false" aria-controls="navMenu3"><svg viewBox="0 0 8 5" aria-hidden="true" focusable="false"><path d="M1 1l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></li>
      <li><a href="/support/">Support</a><button class="nav-more" type="button" aria-label="Support menu" aria-expanded="false" aria-controls="navMenu4"><svg viewBox="0 0 8 5" aria-hidden="true" focusable="false"><path d="M1 1l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></li>
    </ul>
    <div class="nav-end"><button class="nav-search" id="navSearch" type="button" aria-label="Search oplocloud.com" aria-expanded="false" aria-controls="navFind"><svg viewBox="0 0 15 15" aria-hidden="true" focusable="false"><circle cx="6.3" cy="6.3" r="5.3" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="m10.2 10.2 4 4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></button></div>
    <button class="nav-toggle" id="navToggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<main class="authMain" id="authMain"></main>
<script src="/assets/js/oplo-motion.js"></script>
<script src="/assets/js/oplo-menu.js"></script>
<script src="/assets/js/oplo-search.js"></script>
<script src="/auth/app.js"></script>
</body>
</html>`;

  /* ------------------------------------------------------------- Routing
     Every path that is not a known API route or a static asset request
     serves the sign-in document. The page itself reads the URL and
     switches between sign-in, register, recovery, and callback views. */

  function isApiPath(pathname) {
    return pathname.startsWith("/api/");
  }

  function isAuthAsset(pathname) {
    return pathname.startsWith("/auth/") ||
           pathname.startsWith("/assets/");
  }

  function viewFromPath(pathname) {
    if (pathname === "/" || pathname === "/sign-in" || pathname === "/sign-in/") return "signin";
    if (pathname === "/register" || pathname === "/register/") return "register";
    if (pathname === "/recovery" || pathname === "/recovery/") return "recovery";
    if (pathname === "/callback") return "callback";
    return "signin";
  }

  function buildCanonical(view) {
    return "https://auth.oplocloud.com/" + (view === "signin" ? "" : view);
  }

  function buildTitle(view) {
    const titles = {
      signin: "Sign in — Oplo",
      register: "Create an account — Oplo",
      recovery: "Can't sign in? — Oplo",
      callback: "Signing in… — Oplo"
    };
    return titles[view] || "Oplo";
  }

  function injectPage(html, view) {
    return html
      .replace(`<title id="pageTitle">Sign in — Oplo</title>`, `<title id="pageTitle">${buildTitle(view)}</title>`)
      .replace(`<meta name="description" content="Sign in to your Oplo account.">`, view === "register"
        ? `<meta name="description" content="Create your Oplo account.">`
        : view === "recovery"
        ? `<meta name="description" content="Recover your Oplo account.">`
        : `<meta name="description" content="Sign in to your Oplo account.">`)
      .replace(`<meta property="og:title" content="Sign in — Oplo">`, `<meta property="og:title" content="${buildTitle(view)}">`)
      .replace(`href="https://oplocloud.com/sign-in/"`, `href="${buildCanonical(view)}"`)
      .replace(`content="https://oplocloud.com/sign-in/"`, `content="${buildCanonical(view)}"`);
  }

  /* ------------------------------------------------------------- API proxy
     Requests to /api/* on this Worker are forwarded to api.oplocloud.com
     with the browser cookie attached, so the API resolves the session
     the same way it would on any Oplo product page. The response comes
     back with any Set-Cookie headers preserved. */

  async function proxyApi(request, env, url) {
    const target = API_BASE + url.pathname + (url.search || "");
    const headers = new Headers();
    for (const [k, v] of request.headers.entries()) {
      if (k.toLowerCase() === "host") continue;
      if (k.toLowerCase() === "cookie") {
        /* Pass all cookies — the session cookie lives on oplocloud.com
           and is readable here. */
        headers.set(k, v);
        continue;
      }
      headers.set(k, v);
    }

    const proxy = new Request(target, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual"
    });

    let response;
    try {
      response = await fetch(proxy, { redirect: "manual" });
    } catch {
      return new Response(JSON.stringify({ error: { code: "service_unavailable", message: "The platform API is unavailable." } }), {
        status: 503,
        headers: { "content-type": "application/json" }
      });
    }

    /* Forward the response, preserving Set-Cookie so the API can
       set the session cookie on the oplocloud.com domain. */
    const outHeaders = new Headers();
    for (const [k, v] of response.headers.entries()) {
      outHeaders.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outHeaders
    });
  }

  /* ------------------------------------------------------------- OIDC discovery
     The OIDC discovery document tells Oplo products where to find the
     authorization, token, and userinfo endpoints. Today those all live
     on api.oplocloud.com, which already implements the session routes.
     This document makes auth.oplocloud.com a real identity provider
     discovery point, ready for when the full IdP surface is built. */

  function oidcDiscovery(url) {
    const base = url.origin;
    return {
      issuer: base,
      authorization_endpoint: `${base}/oauth2/authorize`,
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

  /* ------------------------------------------------------------- Worker entry
   */

  export default {
    async fetch(request, env, executionCtx) {
      const url = new URL(request.url);

      /* HTTPS-only in production. */
      if (url.protocol === "http:" && env.ENVIRONMENT === "production") {
        url.protocol = "https:";
        return Response.redirect(url.toString(), 308);
      }

      /* API calls are proxied to the platform API. */
      if (isApiPath(url.pathname)) {
        return proxyApi(request, env, url);
      }

      /* Static assets (shared CSS/JS/images) are served from the
         public origin — they are identical to what the marketing site
         serves, so no build step is needed and shared styles stay in
         one place. */
      if (isAuthAsset(url.pathname)) {
        const publicUrl = new URL(url.href.replace(/^https:\/\/auth\.oplocloud\.com/, "https://oplocloud.com"));
        return fetch(new Request(publicUrl, request));
      }

      /* The OIDC discovery document. */
      if (url.pathname === "/.well-known/openid-configuration" ||
          url.pathname.startsWith("/.well-known/")) {
        return new Response(JSON.stringify(oidcDiscovery(url)), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=3600"
          }
        });
      }

      /* Everything else is the sign-in page, which switches view by path. */
      const view = viewFromPath(url.pathname);
      const html = injectPage(SIGN_IN_HTML, view);
      return new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache"
        }
      });
    }
  };
