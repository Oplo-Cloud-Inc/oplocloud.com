/* ==========================================================================
   Roxan's Worker — roxan.oplocloud.com.

   The site is the `roxan/` directory, served as static assets. This code only
   runs for requests no file answered. It does three jobs:

     /api/health    is Roxan open? Public, and the status page reads it.
     /api/session   trades an invite code for a signed cookie (POST) or clears
                    it (DELETE). The code is typed once and not kept.
     /api/*         everything else belongs to one person. The cookie names
                    their account and the request goes to that account's
                    Durable Object (worker/agent/), which keeps their data,
                    runs their work and answers.

   Roxan used to live at oplocloud.com/roxan/, and GitHub Pages still
   publishes that directory there, because Pages publishes the whole
   repository. Two routes on the apex put this Worker in front of that path,
   the way the developer site does for /dev (worker/dev.js). Unlike /dev, the
   path is kept: oplocloud.com/roxan/mof/ is a real page, and it lands on
   roxan.oplocloud.com/mof/ rather than on the front door.

   The same rule covers /roxan/… on this hostname, which is what an old
   root-relative link inside the site would ask for.
   ========================================================================== */

import { accountFor, codes, cookie, token, who } from "./agent/auth.js";

export { Agent } from "./agent/do.js";

const HOST = "roxan.oplocloud.com";
const RATE = { windowMs: 60_000, health: 60, session: 10, api: 900 };
const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };
const json = (o, status = 200, headers) => new Response(JSON.stringify(o), { status, headers: { ...HEADERS, ...headers } });
const fail = (status, code, message) => json({ error: { code, message } }, status);

// Best effort: one counter per isolate, so it slows a loop, it does not bound a botnet.
const hits = new Map();
function limited(who, kind) {
  const key = kind + who, now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < RATE.windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > RATE.windowMs) hits.delete(k);
  return recent.length > RATE[kind];
}
const ip = request => request.headers.get("cf-connecting-ip") || "local";
const sameOrigin = (request, url) => request.headers.get("origin") === url.origin;

const isOpen = env => Boolean(env.ROXAN_MODEL_KEY && codes(env).length);

async function health(request, env) {
  if (limited(ip(request), "health")) return fail(429, "busy", "Too many requests. Try again in a minute.");
  const out = { ok: true, gateway: isOpen(env) ? "open" : "closed" };
  if (request.headers.get("cookie")?.includes("rx_s=")) out.access = Boolean(await who(request, env));
  return json(out);
}

async function session(request, env, url) {
  if (request.method === "DELETE") return json({ ok: true }, 200, { "set-cookie": cookie("", request) });
  if (request.method !== "POST") return fail(405, "method", "That route does not take this method.");
  if (!sameOrigin(request, url)) return fail(403, "origin", "This address only answers Roxan.");
  // Counted before the code is checked, so guessing codes is as slow as signing in.
  if (limited(ip(request), "session")) return fail(429, "busy", "That is a lot of tries. Wait a minute.");
  if (!codes(env).length) return fail(503, "closed", "Roxan is not open yet.");
  let code;
  try { code = (await request.json())?.code; } catch { return fail(400, "request", "That was not valid JSON."); }
  const acct = typeof code === "string" ? await accountFor(code, env) : null;
  if (!acct) return fail(401, "invite", "That invite code was not recognised.");
  return json({ ok: true }, 200, { "set-cookie": cookie(await token(acct, env), request) });
}

async function api(request, env, url) {
  const live = url.pathname === "/api/live";
  if ((live || (request.method !== "GET" && request.method !== "HEAD")) && !sameOrigin(request, url)) return fail(403, "origin", "This address only answers Roxan.");
  const acct = await who(request, env);
  if (!acct) return fail(401, "signin", "Sign in with your invite code.");
  if (limited(acct, "api")) return fail(429, "busy", "That is a lot of requests. Try again in a minute.");
  return env.AGENT.get(env.AGENT.idFromName(acct)).fetch(request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === "/roxan" || p.startsWith("/roxan/")) {
      // 301: the move is permanent, so bookmarks and search results learn it once.
      return Response.redirect("https://" + HOST + (p.slice(6) || "/") + url.search, 301);
    }

    if (p === "/api/health") return request.method === "GET" ? health(request, env) : fail(405, "method", "That route does not take this method.");
    if (p === "/api/session") return session(request, env, url);
    if (p.startsWith("/api/")) return api(request, env, url);

    // Anything else matched no file; the asset server's 404 page answers it.
    return env.ASSETS.fetch(request);
  }
};
