// What is said with no signal: node scripts/test-offline.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../../learn/offline.js", import.meta.url), "utf8");
const win = {};
new Function("window", src)(win);
const Q = win.OPLO_QUEUE;
let n = 0;
const t = async (name, fn) => { await fn(); n++; console.log("  ok  " + name); };
const mem = () => { const m = {}; return { getItem: (k) => m[k] || null, setItem: (k, v) => { m[k] = v; }, m }; };
const gone = () => Object.assign(new Error("offline"), { status: 0, code: "offline" });
const refuse = (s = 403, m = "No") => Object.assign(new Error(m), { status: s });
function rig(extra = {}) {
  const store = mem(), sent = [], state = { up: true, fail: null, who: "acc_a" };
  const q = Q.make({ storage: store, noTimer: true, who: () => state.who, online: () => state.up,
    send: async (method, path, body) => { if (state.fail) throw state.fail; sent.push([method, path, body]); return { ok: true }; }, ...extra });
  return { q, store, sent, state };
}

await t("with a signal an item goes straight through and nothing is kept", async () => {
  const r = rig();
  const out = await r.q.submit({ label: "Register", method: "PUT", path: "/register", body: { a: 1 } });
  assert.equal(out.sent, true); assert.equal(r.sent.length, 1); assert.equal(r.q.pending().length, 0);
});
await t("with no signal the item is kept, and the page is told", async () => {
  const r = rig(); r.state.fail = gone();
  const out = await r.q.submit({ label: "Register X-C", method: "PUT", path: "/register", body: { a: 1 } });
  assert.equal(out.queued, true); assert.equal(r.q.pending().length, 1); assert.match(r.store.m["oplo.queue.v1"], /Register X-C/);
});
await t("the phone knows it is offline before it tries", async () => {
  const r = rig(); r.state.up = false;
  const out = await r.q.submit({ method: "POST", path: "/diary", body: { body: "x" } });
  assert.equal(out.queued, true); assert.equal(r.sent.length, 0);
});
await t("back online, what was kept is sent in order and the queue empties", async () => {
  const r = rig(); r.state.up = false;
  await r.q.submit({ method: "PUT", path: "/register", body: { n: 1 } }); await r.q.submit({ method: "POST", path: "/diary", body: { n: 2 } });
  r.state.up = true;
  const f = await r.q.flush();
  assert.equal(f.sent, 2); assert.equal(f.left, 0); assert.deepEqual(r.sent.map((s) => s[2].n), [1, 2]);
});
await t("a later save of the same register replaces the earlier one still waiting", async () => {
  const r = rig(); r.state.up = false;
  await r.q.submit({ method: "PUT", path: "/register", body: { v: 1 }, merge: "reg:c1:d1" });
  await r.q.submit({ method: "PUT", path: "/register", body: { v: 2 }, merge: "reg:c1:d1" });
  await r.q.submit({ method: "PUT", path: "/register", body: { v: 3 }, merge: "reg:c2:d1" });
  assert.equal(r.q.pending().length, 2); r.state.up = true; await r.q.flush();
  assert.deepEqual(r.sent.map((s) => s[2].v), [2, 3]);
});
await t("nothing overtakes what is already waiting", async () => {
  const r = rig(); r.state.fail = gone();
  await r.q.submit({ method: "POST", path: "/a", body: { n: 1 } });
  r.state.fail = null;                                           // the signal is back, but the first is still queued
  const out = await r.q.submit({ method: "POST", path: "/b", body: { n: 2 } });
  await new Promise((res) => setTimeout(res, 10));
  assert.equal(out.queued, true); assert.deepEqual(r.sent.map((s) => s[2].n), [1, 2]);
});
await t("a refusal is given back and not kept; one found while flushing is listed, not lost", async () => {
  const r = rig(); r.state.fail = refuse(400, "Say why");
  await assert.rejects(r.q.submit({ method: "PUT", path: "/register", body: {} }), (e) => e.status === 400);
  assert.equal(r.q.pending().length, 0);
  r.state.fail = gone(); await r.q.submit({ label: "Register X-C", method: "PUT", path: "/register", body: {} });
  r.state.fail = refuse(403, "This day is locked"); const f = await r.q.flush();
  assert.equal(f.left, 0); assert.equal(r.q.failed().length, 1); assert.equal(r.q.failed()[0].message, "This day is locked");
  r.q.dismiss(r.q.failed()[0].id); assert.equal(r.q.failed().length, 0);
});
await t("a bad moment at the server is tried again, not dropped", async () => {
  const r = rig(); r.state.fail = gone(); await r.q.submit({ method: "POST", path: "/x", body: {} });
  r.state.fail = refuse(500, "Oops"); let f = await r.q.flush(); assert.equal(f.left, 1); assert.equal(r.q.failed().length, 0);
  r.state.fail = null; f = await r.q.flush(); assert.equal(f.sent, 1); assert.equal(f.left, 0);
});
await t("what one person kept is sent only while they are signed in", async () => {
  const r = rig(); r.state.fail = gone(); await r.q.submit({ method: "POST", path: "/mine", body: {} });
  r.state.fail = null; r.state.who = "acc_b";
  assert.equal(r.q.pending().length, 0); assert.equal((await r.q.flush()).sent, 0); assert.equal(r.sent.length, 0);
  r.state.who = "acc_a"; assert.equal((await r.q.flush()).sent, 1);
});
await t("it survives the page being closed", async () => {
  const r = rig(); r.state.up = false; await r.q.submit({ method: "POST", path: "/x", body: { k: 1 } });
  const again = Q.make({ storage: r.store, noTimer: true, who: () => "acc_a", online: () => true, send: async () => ({}) });
  assert.equal(again.pending().length, 1);
});
console.log(n + " checks");
