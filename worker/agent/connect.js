/* The bridge to Oplo Accounts.

   An Oplo Account's session is an HttpOnly cookie on api.oplocloud.com, and no other host is sent it, so Roxan's own host
   never sees who is signed in. This Worker therefore also answers one address on that host, api.oplocloud.com/connect/roxan
   (a route in wrangler.roxan.toml: the accounts service's own route is api.oplocloud.com/*, and the longer pattern wins).
   The browser sends the session there. This asks the accounts service who it belongs to and hands the page a ticket for
   that person, good for a minute and for that page's nonce alone. The page gives the ticket to roxan.oplocloud.com
   (/api/session), which makes Roxan's own cookie from it. The session is used once, to ask, and is kept nowhere.

   Only Roxan's own page may ask, and only the page can read the answer: the origin is checked and echoed back, never "*". */
import { nonceOk, oploOn, ticket } from "./auth.js";

const ORIGIN = "https://roxan.oplocloud.com", API = "https://api.oplocloud.com";
const SESSION = /(?:^|;\s*)oplo_session=([^;]+)/;

const origins = env => [ORIGIN, ...String(env.ROXAN_CONNECT_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean)];
const no = (code, message) => ({ error: { code, message } });
const reply = (status, body, headers = new Headers()) => {
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(body), { status, headers });
};

export async function connect(request, env) {
  const origin = request.headers.get("origin") || "";
  if (!origins(env).includes(origin)) return reply(403, no("origin", "This address only answers Roxan."));
  const h = new Headers({ "access-control-allow-origin": origin, "access-control-allow-credentials": "true", vary: "origin" });
  if (request.method === "OPTIONS") {
    h.set("access-control-allow-headers", "x-roxan-nonce");
    h.set("access-control-allow-methods", "POST");
    h.set("access-control-max-age", "600");
    return new Response(null, { status: 204, headers: h });
  }
  // POST, because a browser names the page's origin on every POST, even to its own host, and that name is checked above.
  if (request.method !== "POST") return reply(405, no("method", "That route does not take this method."), h);
  if (!oploOn(env)) return reply(503, no("closed", "Roxan is not open yet."), h);
  const nonce = request.headers.get("x-roxan-nonce");
  if (!nonceOk(nonce)) return reply(400, no("request", "That request was not valid."), h);
  const session = SESSION.exec(request.headers.get("cookie") || "")?.[1];
  if (!session) return reply(401, no("oplo", "Sign in with your Oplo Account."), h);

  const down = () => reply(503, no("accounts", "Oplo Accounts could not be reached. Try again in a moment."), h);
  const init = { headers: { authorization: `Bearer ${session}` }, signal: AbortSignal.timeout(8000) };
  let res;
  try { res = env.ACCOUNTS ? await env.ACCOUNTS.fetch(`${API}/api/v1/me`, init) : await fetch(`${env.OPLO_API_URL || API}/api/v1/me`, init); }
  catch { return down(); }
  if (res.status === 401 || res.status === 403) { res.body?.cancel?.(); return reply(401, no("oplo", "Sign in with your Oplo Account."), h); }
  if (!res.ok) { res.body?.cancel?.(); return down(); }
  const sub = (await res.json().catch(() => null))?.account?.id;
  if (!sub) return down();

  // The accounts service swaps a week-old session for a fresh one on any call that uses it, and says so in a Set-Cookie.
  // That cookie belongs to this browser: pass it on, or asking who this is would sign the person out everywhere.
  for (const c of res.headers.getSetCookie?.() ?? []) h.append("set-cookie", c);
  return reply(200, { ticket: await ticket(sub, nonce, env), expires: 60 }, h);
}
