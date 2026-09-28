/* ==========================================================================
   OC EFM's Worker — efm.oplocloud.com.

   The app is the `efm/` directory, served as static assets. This code runs
   only for requests no file answered, and does two things:

     · An address that looks like a page (/home, /payables/AP-0123 …) gets
       the app's index.html, so every screen can be linked to and reloaded.
       Anything that looks like a file and is missing is a real 404.
     · The old path on the apex (oplocloud.com/efm/…), which GitHub Pages
       would otherwise serve as a second copy, is sent here.
   ========================================================================== */

const HOST = "efm.oplocloud.com";

const SECURITY = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  // no-transform: Cloudflare mustn't inject its beacon into the page (the CSP
  // would block it and log an error).
  "cache-control": "no-cache, no-transform"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (url.hostname !== HOST && (p === "/efm" || p.startsWith("/efm/"))) {
      return Response.redirect("https://" + HOST + (p.slice(4) || "/") + url.search, 301);
    }
    if (p === "/efm" || p.startsWith("/efm/")) {
      return Response.redirect("https://" + url.host + (p.slice(4) || "/") + url.search, 301);
    }

    // A page address: no file extension in the last segment.
    const last = p.split("/").pop();
    if ((request.method === "GET" || request.method === "HEAD") && !last.includes(".")) {
      const page = await env.ASSETS.fetch(new Request(new URL("/", url), { method: request.method, headers: request.headers }));
      const headers = new Headers(page.headers);
      for (const [k, v] of Object.entries(SECURITY)) headers.set(k, v);
      return new Response(page.body, { status: page.status === 304 ? 304 : 200, headers });
    }
    return env.ASSETS.fetch(request);
  }
};
