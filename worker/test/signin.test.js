/* Signing in: the tickets and cookies (auth.js), the bridge to Oplo Accounts (connect.js), and the edge that ties them
   together (gateway.js). The accounts service is a stand-in that records what it was asked. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { accountFor, maxAge, oploAccount, redeem, ticket, token, who } from "../agent/auth.js";
import { connect } from "../agent/connect.js";
import { gateway } from "../agent/gateway.js";

const SECRET = "s".repeat(40), ORIGIN = "https://roxan.oplocloud.com", NONCE = "n0nce-n0nce-n0nce-n0nce";
const env = (more = {}) => ({ ROXAN_SECRET: SECRET, ROXAN_MODEL_KEY: "key", ...more });
const flip = s => (s[0] === "A" ? "B" : "A") + s.slice(1);
const cookieOf = value => new Request(ORIGIN + "/api/x", { headers: { cookie: "rx_s=" + value } });

test("tickets: good for a minute, for one nonce and one secret, and tamper-proof", async () => {
  const e = env(), now = 1_700_000_000_000, t = await ticket("acc_1", NONCE, e, now);
  assert.equal(await redeem(t, NONCE, e, now + 59_000), "acc_1");
  assert.equal(await redeem(t, NONCE, e, now + 61_000), null, "after the minute");
  assert.equal(await redeem(t, "other-nonce-other-nonce", e, now), null, "another page's nonce");
  assert.equal(await redeem(t, "short", e, now), null, "a nonce that is not one");
  assert.equal(await redeem(t, NONCE, env({ ROXAN_SECRET: "x".repeat(40) }), now), null, "another secret");
  const [body, sig] = t.split(".");
  assert.equal(await redeem(flip(body) + "." + sig, NONCE, e, now), null, "body changed");
  assert.equal(await redeem(body + "." + flip(sig), NONCE, e, now), null, "signature changed");
  for (const junk of ["nonsense", ".", "a.b", "", undefined, 7]) assert.equal(await redeem(junk, NONCE, e, now), null);
  await assert.rejects(ticket("acc_1", NONCE, {}, now), /needs the secret/);
  await assert.rejects(ticket("acc_1", NONCE, env({ ROXAN_SECRET: "too short" }), now), /needs the secret/);
  assert.equal(await redeem(t, NONCE, {}, now), null, "no secret at all");
});

test("cookies: an Oplo account is let in by its signature until it is denied, for a week", async () => {
  const e = env(), acct = await oploAccount("acc_1"), t = await token(acct, e);
  assert.match(acct, /^u[0-9a-f]{31}$/);
  assert.equal(await who(cookieOf(t), e), acct);
  assert.equal(await who(cookieOf(t), env({ ROXAN_SECRET: "y".repeat(40) })), null, "another secret");
  assert.equal(await who(cookieOf(t), { ROXAN_MODEL_KEY: "key" }), null, "no secret: a forged cookie is never checked against nothing");
  assert.equal(await who(cookieOf(t), env({ ROXAN_DENY: "acc_9, acc_1" })), null, "denied");
  assert.equal(await who(cookieOf(t), env({ ROXAN_DENY: "acc_9" })), acct);
  assert.equal(await who(cookieOf(t), e, Date.now() + 8 * 86_400_000), null, "after a week");
  assert.equal(maxAge(acct), 7 * 86_400);
  assert.equal(await who(cookieOf(flip(t)), e), null, "a cookie that is not ours");
});

test("cookies: an invite code still opens its own account, and taking the code out closes it", async () => {
  const e = { ROXAN_INVITE: "rx-aaaa, rx-bbbb" }, acct = await accountFor("rx-bbbb", e);
  assert.match(acct, /^[0-9a-f]{32}$/);
  assert.equal(await accountFor("rx-cccc", e), null);
  assert.equal(await accountFor("  ", e), null);
  const t = await token(acct, e);
  assert.equal(await who(cookieOf(t), e), acct);
  assert.equal(await who(cookieOf(t), { ROXAN_INVITE: "rx-aaaa" }), null, "the code was removed");
  assert.equal(maxAge(acct), 28 * 86_400);
});

// The accounts service, as a stand-in: it records what it was asked and answers as told.
const accounts = answer => {
  const calls = [];
  return { calls, fetch: async (url, init) => { calls.push({ url: String(url), auth: init.headers.authorization }); if (answer instanceof Error) throw answer; return answer(); } };
};
const me = (id, headers) => () => new Response(JSON.stringify({ account: { id, email: "a@b.c", name: "A B" } }), { status: 200, headers });
const ask = (e, { origin = ORIGIN, method = "POST", cookie = "oplo_session=tok123", nonce = NONCE } = {}) =>
  connect(new Request("https://api.oplocloud.com/connect/roxan", { method, headers: { ...(origin ? { origin } : {}), ...(cookie ? { cookie } : {}), ...(nonce ? { "x-roxan-nonce": nonce } : {}) } }), e);
const said = async r => (await r.json()).error?.code;

test("connect: asks the accounts service who the session belongs to and answers with a ticket for that person", async () => {
  const a = accounts(me("acc_1")), r = await ask(env({ ACCOUNTS: a })), text = await r.clone().text(), body = await r.json();
  assert.equal(r.status, 200);
  assert.equal(body.expires, 60);
  assert.equal(await redeem(body.ticket, NONCE, env()), "acc_1");
  assert.deepEqual(a.calls, [{ url: "https://api.oplocloud.com/api/v1/me", auth: "Bearer tok123" }]);
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN, "the page's own origin, never *");
  assert.equal(r.headers.get("access-control-allow-credentials"), "true");
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.doesNotMatch(text, /tok123|a@b\.c|A B/, "nothing of the session or the person is in the answer");
});

test("connect: the accounts service's fresh session cookie reaches the browser, so asking who it is does not sign anyone out", async () => {
  const rotated = "oplo_session=fresh; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000";
  const r = await ask(env({ ACCOUNTS: accounts(me("acc_1", { "set-cookie": rotated })) }));
  assert.deepEqual(r.headers.getSetCookie(), [rotated]);
});

test("connect: only Roxan's own page may ask, and a preflight is answered without asking anyone", async () => {
  const a = accounts(me("acc_1"));
  for (const origin of ["https://evil.example", "http://roxan.oplocloud.com", "", null]) {
    const r = await ask(env({ ACCOUNTS: a }), { origin });
    assert.equal(r.status, 403);
    assert.equal(r.headers.get("access-control-allow-origin"), null);
  }
  const pre = await ask(env({ ACCOUNTS: a }), { method: "OPTIONS" });
  assert.equal(pre.status, 204);
  assert.match(pre.headers.get("access-control-allow-headers"), /x-roxan-nonce/);
  assert.equal((await ask(env({ ACCOUNTS: a }), { method: "GET" })).status, 405);
  assert.equal(a.calls.length, 0);
  assert.equal((await ask(env({ ACCOUNTS: a, ROXAN_CONNECT_ORIGINS: "http://localhost:8130" }), { origin: "http://localhost:8130" })).status, 200, "a local page when the environment names it");
});

test("connect: no session, a bad nonce, a refused session, a broken answer and a service that is down each end plainly", async () => {
  const a = accounts(me("acc_1"));
  assert.equal(await said(await ask(env({ ACCOUNTS: a }), { cookie: "" })), "oplo");
  assert.equal(await said(await ask(env({ ACCOUNTS: a }), { cookie: "other=1; oplo_sessions=x" })), "oplo", "only the one cookie counts");
  assert.equal(await said(await ask(env({ ACCOUNTS: a }), { nonce: "" })), "request");
  assert.equal(await said(await ask(env({ ACCOUNTS: a }), { nonce: "has spaces and is long enough" })), "request");
  assert.equal(a.calls.length, 0, "none of that reached the accounts service");
  const code = async (answer, kind = 503) => { const r = await ask(env({ ACCOUNTS: accounts(answer) })); assert.equal(r.status, kind); return said(r); };
  assert.equal(await code(() => new Response("{}", { status: 401 }), 401), "oplo");
  assert.equal(await code(() => new Response("{}", { status: 500 })), "accounts");
  assert.equal(await code(() => new Response("{}", { status: 200 })), "accounts", "an answer with no account in it");
  assert.equal(await code(() => new Response("<html>", { status: 200 })), "accounts");
  assert.equal(await code(new Error("down")), "accounts");
  assert.equal(await said(await ask({ ROXAN_MODEL_KEY: "key", ACCOUNTS: a })), "closed", "without the secret");
});

const gate = (e, path, init = {}, ip = "9.9.9.1") => gateway(new Request("https://roxan.oplocloud.com" + path, { ...init, headers: { "cf-connecting-ip": ip, ...init.headers } }), e);
const post = (e, body, { ip, origin = ORIGIN } = {}) => gate(e, "/api/session", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) }, ip);
const agent = { idFromName: n => n, get: id => ({ fetch: async () => new Response(JSON.stringify({ account: id })) }) };

test("gateway: Roxan is open when it can answer and somebody can come in", async () => {
  const state = async e => (await (await gate(e, "/api/health", {}, "9.9.9.2")).json()).gateway;
  assert.equal(await state({}), "closed");
  assert.equal(await state({ ROXAN_MODEL_KEY: "key" }), "closed", "a model and nobody who may come in");
  assert.equal(await state({ ROXAN_SECRET: SECRET }), "closed", "a way in and nothing to answer with");
  assert.equal(await state(env()), "open");
  assert.equal(await state({ ROXAN_MODEL_KEY: "key", ROXAN_INVITE: "rx-aaaa" }), "open");
});

test("gateway: a ticket becomes Roxan's own cookie, and the cookie reaches only that person's object", async () => {
  const e = env({ AGENT: agent }), t = await ticket("acc_1", NONCE, e);
  const r = await post(e, { ticket: t, nonce: NONCE });
  assert.equal(r.status, 200);
  const set = r.headers.get("set-cookie"), acct = await oploAccount("acc_1");
  assert.match(set, /^rx_s=u[0-9a-f]{31}\.\d+\.[\w-]+; Path=\/api; HttpOnly; SameSite=Strict; Max-Age=604800; Secure$/);
  const jar = { cookie: set.split(";")[0] };
  assert.equal((await (await gate(e, "/api/health", { headers: jar }, "9.9.9.3")).json()).access, true);
  assert.equal((await (await gate(e, "/api/threads", { headers: jar }, "9.9.9.3")).json()).account, acct, "their own object, by name");
  assert.equal((await gate(e, "/api/threads", {}, "9.9.9.3")).status, 401);
  assert.equal((await (await gate(e, "/api/health", { headers: { cookie: "rx_s=u.1.x" } }, "9.9.9.3")).json()).access, false);
});

test("gateway: a ticket that is wrong, old, borrowed, from another page or for a denied account does not sign anyone in", async () => {
  const e = env({ AGENT: agent });
  const fresh = await ticket("acc_1", NONCE, e), old = await ticket("acc_1", NONCE, e, Date.now() - 120_000);
  const no = async (body, status, code, opts, more = e) => { const r = await post(more, body, opts); assert.equal(r.status, status, JSON.stringify(body)); assert.equal(r.headers.get("set-cookie"), null); assert.equal(await said(r), code); };
  await no({ ticket: fresh, nonce: "another-nonce-another-n" }, 401, "oplo");
  await no({ ticket: old, nonce: NONCE }, 401, "oplo");
  await no({ ticket: flip(fresh), nonce: NONCE }, 401, "oplo");
  await no({ ticket: fresh }, 401, "oplo");
  await no({ ticket: fresh, nonce: NONCE }, 403, "origin", { origin: "https://evil.example" });
  await no({ ticket: fresh, nonce: NONCE }, 403, "blocked", {}, env({ AGENT: agent, ROXAN_DENY: "acc_1" }));
  await no({ ticket: fresh, nonce: NONCE }, 503, "closed", {}, { ROXAN_MODEL_KEY: "key", ROXAN_INVITE: "rx-aaaa" });
  assert.equal((await post(e, { ticket: fresh, nonce: NONCE })).status, 200, "the same ticket still works for the page that asked, inside the minute");
});

test("gateway: the owner's invite code still works, and guessing is slowed", async () => {
  const e = { ROXAN_MODEL_KEY: "key", ROXAN_INVITE: "rx-aaaa" };
  const ok = await post(e, { code: "rx-aaaa" }, { ip: "9.9.9.4" });
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get("set-cookie"), /Max-Age=2419200/);
  assert.equal(await said(await post(e, { code: "rx-zzzz" }, { ip: "9.9.9.4" })), "invite");
  assert.equal((await post(env(), { code: "rx-aaaa" }, { ip: "9.9.9.4" })).status, 503, "no invites configured");
  for (let i = 0; i < 10; i++) await post(e, { code: "no" + i }, { ip: "9.9.9.5" });
  assert.equal((await post(e, { code: "rx-aaaa" }, { ip: "9.9.9.5" })).status, 429);
  const s = await post(e, { ticket: "x" }, { ip: "9.9.9.6" });
  assert.equal(s.status, 503, "a ticket when Oplo sign-in is off");
});

test("gateway: the bridge is reached at its own address, and the old address still moves", async () => {
  const r = await gate(env(), "/connect/roxan", { method: "OPTIONS", headers: { origin: ORIGIN } }, "9.9.9.7");
  assert.equal(r.status, 204);
  const old = await gate(env(), "/roxan/mof/?a=1", {}, "9.9.9.7");
  assert.equal(old.status, 301);
  assert.equal(old.headers.get("location"), "https://roxan.oplocloud.com/mof/?a=1");
});
