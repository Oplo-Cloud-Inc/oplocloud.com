/* The edge in front of every Roxan (the Worker, worker/roxan.js, is this and the Durable Object class). It is kept apart
   so it can be tested without the platform. Requests no file answered come here, and it does four jobs:

     /api/health        is Roxan open? Public, and the status page reads it.
     /api/session       trades a ticket from an Oplo Account (or an invite code) for a signed cookie (POST), or clears
                        it (DELETE). Nothing the person typed is kept.
     /api/*             everything else belongs to one person. The cookie names their account and the request goes to
                        that account's Durable Object (worker/agent/), which keeps their data, runs their work and
                        answers.
     /connect/roxan     where an Oplo session is turned into a ticket (worker/agent/connect.js). It is reached on
                        api.oplocloud.com, the only host that is sent that session.

   Roxan used to live at oplocloud.com/roxan/, and GitHub Pages still publishes that directory there, because Pages
   publishes the whole repository. Two routes on the apex put this Worker in front of that path, the way the developer
   site does for /dev (worker/dev.js). Unlike /dev, the path is kept: oplocloud.com/roxan/mof/ is a real page, and it
   lands on roxan.oplocloud.com/mof/ rather than on the front door.

   The same rule covers /roxan/… on this hostname, which is what an old root-relative link inside the site would ask for. */
import { accountFor, blocked, codes, cookie, maxAge, oploAccount, oploOn, redeem, token, who } from "./auth.js";
import { connect } from "./connect.js";

const HOST = "roxan.oplocloud.com";
const RATE = { windowMs: 60_000, health: 60, session: 10, exchange: 30, connect: 30, api: 900 };
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

// Open means it can answer (a model key) and somebody can come in: an Oplo Account, or the owner's invite.
const isOpen = env => Boolean(env.ROXAN_MODEL_KEY && (oploOn(env) || codes(env).length));

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
  let body;
  try { body = await request.json(); } catch { return fail(400, "request", "That was not valid JSON."); }
  const oplo = typeof body?.ticket === "string";
  // Counted before anything is checked, so guessing is as slow as signing in.
  if (limited(ip(request), oplo ? "exchange" : "session")) return fail(429, "busy", "That is a lot of tries. Wait a minute.");

  let acct = null;
  if (oplo) {
    if (!oploOn(env)) return fail(503, "closed", "Roxan is not open yet.");
    const sub = await redeem(body.ticket, body.nonce, env);
    acct = sub ? await oploAccount(sub) : null;
    if (!acct) return fail(401, "oplo", "That sign-in did not check out. Try signing in again.");
    if (await blocked(acct, env)) return fail(403, "blocked", "This account cannot use Roxan.");
  } else {
    if (!codes(env).length) return fail(503, "closed", "Roxan is not open yet.");
    acct = typeof body?.code === "string" ? await accountFor(body.code, env) : null;
    if (!acct) return fail(401, "invite", "That invite code was not recognised.");
  }
  return json({ ok: true }, 200, { "set-cookie": cookie(await token(acct, env), request, maxAge(acct)) });
}

async function api(request, env, url) {
  const live = url.pathname === "/api/live";
  if ((live || (request.method !== "GET" && request.method !== "HEAD")) && !sameOrigin(request, url)) return fail(403, "origin", "This address only answers Roxan.");
  const acct = await who(request, env);
  if (!acct) return fail(401, "signin", "Sign in with your Oplo Account.");
  if (limited(acct, "api")) return fail(429, "busy", "That is a lot of requests. Try again in a minute.");
  return env.AGENT.get(env.AGENT.idFromName(acct)).fetch(request);
}

export async function gateway(request, env) {
  const url = new URL(request.url);
  const p = url.pathname;

  if (p === "/connect/roxan") return limited(ip(request), "connect") ? fail(429, "busy", "That is a lot of tries. Wait a minute.") : connect(request, env);

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
