// What the HTTP proofs of the India playbook share: a person with a cookie, and steps that name what failed.
import fs from "node:fs";
import assert from "node:assert/strict";
export { assert };
export const API = process.env.API || "http://localhost:8787/api/v1";
export const ORIGIN = process.env.ORIGIN || "http://localhost:8123";
export const cred = () => JSON.parse(fs.readFileSync(process.env.CRED));
export const RUN = Date.now().toString(36);
export const PW = "Pb-" + RUN + "-A1!";

export function person(label) {
  const jar = { cookie: "" };
  async function call(method, path, body, raw) {
    const r = await fetch(API + path, { method, headers: { "content-type": "application/json", origin: ORIGIN, cookie: jar.cookie },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const sc = r.headers.get("set-cookie"); if (sc) jar.cookie = sc.split(";")[0];
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
    if (raw) return { status: r.status, body: j, text: t, headers: r.headers };
    if (!r.ok) throw new Error(`${label}: ${method} ${path} -> ${r.status} ${t.slice(0, 250)}`);
    return j;
  }
  return { get: (p) => call("GET", p), put: (p, b) => call("PUT", p, b ?? {}), post: (p, b) => call("POST", p, b ?? {}), patch: (p, b) => call("PATCH", p, b ?? {}), del: (p) => call("DELETE", p),
           try: (m, p, b) => call(m, p, b, true), login: (e, p) => call("POST", "/auth/login", { email: e, password: p }) };
}

let n = 0;
export const steps = () => n;
export async function step(name, fn) {
  try { await fn(); n++; console.log("  ok  " + name); }
  catch (e) { console.log("  FAIL " + name + "\n       " + (e && e.message)); process.exitCode = 1; throw e; }
}
export const refused = (r, s) => assert.equal(r.status, s, `expected ${s}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
