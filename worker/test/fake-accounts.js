/* A stand-in for the Oplo Accounts service (api.oplocloud.com), for trying Roxan's sign-in locally with no real
   account. It answers the calls the Oplo sign-in page and Roxan's bridge make:

     POST /api/v1/auth/login    {email, password}: the account, and the session as an HttpOnly cookie, as the real one does
     GET  /api/v1/me            who the session (cookie or Bearer) belongs to. A session older than FAKE_ROTATE_MS is
                                swapped for a new one, as the real service does after a week, and the old one stops working
     POST /api/v1/auth/logout   ends the session

   There is one made-up account, below. Nothing here is real, and nothing outlives the process.

   node worker/test/fake-accounts.js 8787   starts one by hand (FAKE_ROTATE_MS=1 swaps the session on every call). */
import http from "node:http";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

export const ACCOUNT = { id: "acc_fake_ada", email: "ada@example.test", name: "Ada Fake" };
export const PASSWORD = "fake-accounts-local-only";
const PAGES = ["http://127.0.0.1:8788", "http://localhost:8788"];          // the sign-in page, as auth/wrangler.toml runs it
const SESSION = /(?:^|;\s*)oplo_session=([^;]+)/;

export function start(port = 8787, rotateMs = Number(process.env.FAKE_ROTATE_MS) || 7 * 86_400_000) {
  const sessions = new Map();                                              // session → when it was made
  const make = () => { const t = randomBytes(32).toString("base64url"); sessions.set(t, Date.now()); return t; };
  const cookie = (t, age = 2_592_000) => `oplo_session=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}`;

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const cors = PAGES.includes(origin) ? { "access-control-allow-origin": origin, "access-control-allow-credentials": "true", "access-control-allow-headers": "content-type, authorization", "access-control-allow-methods": "GET, POST, OPTIONS", vary: "origin" } : {};
    const send = (status, body, extra = {}) => {
      console.log(req.method, req.url, status, extra["set-cookie"] ? "(sets a session)" : "");
      res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store", ...cors, ...extra });
      res.end(body === undefined ? undefined : JSON.stringify(body));
    };
    const no = (status, code, message) => send(status, { error: { code, message } });
    const path = new URL(req.url, "http://x").pathname;
    const bearer = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
    const session = SESSION.exec(req.headers.cookie || "")?.[1] || bearer;

    if (req.method === "OPTIONS") return send(204);
    if (path === "/api/v1/auth/login" && req.method === "POST") {
      let body = {};
      try { body = JSON.parse(await new Promise(ok => { let s = ""; req.on("data", c => (s += c)).on("end", () => ok(s || "{}")); })); } catch { /* not JSON: no match below */ }
      return body.email === ACCOUNT.email && body.password === PASSWORD
        ? send(200, { account: ACCOUNT }, { "set-cookie": cookie(make()) })
        : no(401, "invalid_credentials", "That email and password don't match an Oplo Account.");
    }
    if (path === "/api/v1/me" && req.method === "GET") {
      if (!sessions.has(session)) return no(401, "unauthenticated", "Sign in.");
      if (Date.now() - sessions.get(session) <= rotateMs) return send(200, { account: ACCOUNT });
      sessions.delete(session);
      return send(200, { account: ACCOUNT }, { "set-cookie": cookie(make()) });
    }
    if (path === "/api/v1/auth/logout" && req.method === "POST") {
      sessions.delete(session);
      return send(200, { ok: true }, { "set-cookie": cookie("", 0) });
    }
    return no(404, "not_found", "No such route.");
  });
  return new Promise(resolve => server.listen(port, "127.0.0.1", () => resolve({ port: server.address().port, sessions, close: () => server.close() })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { port } = await start(Number(process.argv[2]) || 8787);
  console.log(`fake Oplo Accounts on http://127.0.0.1:${port}`);
}
