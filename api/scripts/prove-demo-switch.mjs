// The demo switch over HTTP: a demo school's mail never leaves (even with a mail service connected),
// another school's still does, and the bulk demo password reaches only the invited people of a listed
// demo school. Local only. Run it twice, against a Worker started by api's own wrangler:
//   cd api && node_modules/.bin/wrangler dev --port 8794 --var DEMO_ORGS:org_oplo \
//        --var MAIL_ENDPOINT:http://127.0.0.1:8899/ --var MAIL_KEY:proof          # org_oplo is the demo
//   API=http://localhost:8794/api/v1 CRED=/path/credentials.json MODE=demo node scripts/prove-demo-switch.mjs
// and again with DEMO_ORGS left out (MODE=normal), to show the same mail does leave a school that is not a demo, and a third time
// with --var DEMO_MAIL_DOMAINS:s.test (MODE=domain): not a demo school, but the address is at a held domain, so it is held anyway.
// It listens on 8899 as the "mail service", reads the database through the same wrangler, and passes the
// demo password to scripts/set-demo-passwords.sh on stdin; it is made now and shown nowhere.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const API = process.env.API || "http://localhost:8794/api/v1";
const MODE = ["normal", "domain"].includes(process.env.MODE) ? process.env.MODE : "demo";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const HERE = path.dirname(fileURLToPath(import.meta.url)), API_DIR = path.join(HERE, "..");
const WRANGLER = path.join(API_DIR, "node_modules/.bin/wrangler");
const ENV = { ...process.env, PATH: path.join(API_DIR, "node_modules/.bin") + ":" + process.env.PATH };
const RUN = Date.now().toString(36);
const PW = crypto.randomBytes(12).toString("base64url") + "-A1!";
const DEMO_PW = crypto.randomBytes(15).toString("base64url") + "-9Q";

const caught = [];
const catcher = http.createServer((q, r) => { let b = ""; q.on("data", (d) => b += d).on("end", () => { caught.push(JSON.parse(b || "{}")); r.writeHead(200).end("{}"); }); });
await new Promise((ok) => catcher.listen(8899, "127.0.0.1", ok));

function person(label) {
  const jar = { cookie: "" };
  async function call(method, p, body, raw) {
    const go = () => fetch(API + p, { method, headers: { "content-type": "application/json", origin: "http://localhost:8123", cookie: jar.cookie },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const r = await go().catch(go);
    const sc = r.headers.get("set-cookie"); if (sc) jar.cookie = sc.split(";")[0];
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
    if (raw) return { status: r.status, body: j };
    if (!r.ok) throw new Error(`${label}: ${method} ${p} -> ${r.status} ${t.slice(0, 250)}`);
    return j;
  }
  return { get: (p) => call("GET", p), put: (p, b) => call("PUT", p, b ?? {}), post: (p, b) => call("POST", p, b ?? {}),
           try: (m, p, b) => call(m, p, b, true), login: (e, p) => call("POST", "/auth/login", { email: e, password: p }) };
}
let n = 0;
const step = async (name, fn) => { try { await fn(); n++; console.log("  ok  " + name); } catch (e) { console.log("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; throw e; } };
const refused = (r, s) => assert.equal(r.status, s, `expected ${s}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
const sql = (query) => { const o = execFileSync(WRANGLER, ["d1", "execute", "oplo-platform-db", "--local", "--json", "--command", query], { cwd: API_DIR, encoding: "utf8", maxBuffer: 1 << 26 }); return JSON.parse(o.slice(o.indexOf("[")))[0].results; };
const one = (query) => Object.values(sql(query)[0])[0];
const demoPw = (org, input) => spawnSync(path.join(HERE, "set-demo-passwords.sh"), [org], { cwd: API_DIR, input, env: ENV, encoding: "utf8" });
const admin = person("admin"), teacher = person("teacher"), anon = person("anon");
const ctx = {};

try {
  await step(`mail: a school that is ${MODE === "demo" ? "a demo" : "not a demo"} queues a message for someone who wants email`, async () => {
    await admin.login(cred.email, cred.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    ctx.teacher = (await admin.post("/accounts", { email: `tia.ds${RUN}@s.test`, name: "Tia Teacher", password: PW, role: "teacher", orgId: ctx.org })).account;
    await teacher.login(ctx.teacher.email, PW);
    await teacher.put("/inbox/prefs", { prefs: [{ kind: "announcement", inApp: true, email: true }] });
    await admin.post("/messages", { audience: { kind: "staff" }, title: "Welcome to the school", body: "Your timetable is ready." });
    const box = await admin.get("/outbox");
    assert.equal(box.configured, true, "a mail service is connected, so only the switch can hold this back");
    assert.equal(box.demo, MODE === "demo");   // (the domain hold is by address, not by school)
    assert.ok(box.mail.some((m) => m.to === ctx.teacher.email && m.status === "queued"));
  });

  if (MODE === "demo") {
    await step("a demo school's mail is held, not sent, though a mail service is connected", async () => {
      const f = await admin.post("/outbox/flush");
      assert.equal(f.sent, 0); assert.equal(f.suppressed, 1); assert.equal(f.demo, true);
      assert.equal(caught.length, 0, "nothing reached the mail service");
      const mail = (await admin.get("/outbox")).mail.filter((m) => m.to === ctx.teacher.email);
      assert.deepEqual(mail.map((m) => m.status), ["suppressed"]);
      assert.match(mail[0].error, /Demo school/);
      const again = await admin.post("/outbox/flush");
      assert.equal(again.suppressed, 0, "held mail is not held twice");
      assert.equal(caught.length, 0);
    });
    await step("only the office reads the queue or flushes it", async () => {
      refused(await teacher.try("GET", "/outbox"), 403);
      refused(await teacher.try("POST", "/outbox/flush"), 403);
      refused(await anon.try("POST", "/outbox/flush"), 401);
    });

    await step("the bulk demo password: refused for a school that is not a listed demo", async () => {
      execFileSync("node", ["scripts/seed-demo-school.mjs"], { cwd: API_DIR, stdio: "ignore" });   // org_sfhs: four invited people
      const r = demoPw("org_oplo", `${DEMO_PW}\n${DEMO_PW}\n`);
      assert.equal(r.status, 1); assert.match(r.stderr, /not a demo school/);
      assert.equal(one("SELECT COUNT(*) FROM accounts WHERE id LIKE 'acc_sfhs_%' AND status = 'invited'"), 4);
    });
    await step("…and refused for a bad password, with nothing changed", async () => {
      assert.equal(demoPw("org_sfhs", `${DEMO_PW}\nsomething else entirely\n`).status, 1, "two that differ");
      assert.equal(demoPw("org_sfhs", "short\nshort\n").status, 1, "under 12 characters");
      assert.equal(demoPw("org_sfhs; DROP TABLE accounts", `${DEMO_PW}\n${DEMO_PW}\n`).status, 2, "not an organization id");
      assert.equal(one("SELECT COUNT(*) FROM accounts WHERE id LIKE 'acc_sfhs_%' AND status = 'invited'"), 4);
    });
    await step("…and for a listed demo it activates the invited people who belong only there", async () => {
      // Ritika also belongs to another school; Myra already chose a password of her own.
      sql(`INSERT INTO organization_memberships (id, org_id, account_id, role, created_at) VALUES ('mem_ds${RUN}', '${ctx.org}', 'acc_sfhs_admin', 'member', 1)`);
      const own = crypto.randomBytes(12).toString("base64url") + "-Z9";
      execFileSync(path.join(HERE, "set-password.sh"), ["myra.malhotra@sfhs.in"], { cwd: API_DIR, input: `${own}\n${own}\n`, env: ENV, stdio: ["pipe", "ignore", "ignore"] });
      const hadMyra = one("SELECT pw_hash FROM accounts WHERE id = 'acc_sfhs_teacher'");
      const r = demoPw("org_sfhs", `${DEMO_PW}\n${DEMO_PW}\n`);
      assert.equal(r.status, 0, r.stderr);
      assert.ok(!r.stdout.includes(DEMO_PW) && !r.stderr.includes(DEMO_PW), "the password is not echoed");
      assert.match(r.stdout, /2 people in org_sfhs now share the demo password/);
      assert.equal(one("SELECT pw_hash FROM accounts WHERE id = 'acc_sfhs_teacher'"), hadMyra, "someone who chose their own keeps it");
      assert.equal(one("SELECT status FROM accounts WHERE id = 'acc_sfhs_admin'"), "invited", "someone in two schools is left for their own password");
      for (const who of ["student", "guardian"]) assert.equal(one(`SELECT status FROM accounts WHERE id = 'acc_sfhs_${who}'`), "active");
    });
    await step("the demo password signs people in, and signs nobody else in", async () => {
      const tanvi = person("tanvi"), tarun = person("tarun");
      await tanvi.login("tanvi.jindal@sfhs.in", DEMO_PW);
      assert.ok((await tanvi.get("/me")).account.roles.some((x) => x.role === "student"));
      await tarun.login("tarun.jindal2@gmail.example", DEMO_PW);
      refused(await anon.try("POST", "/auth/login", { email: "ritika.sood@sfhs.in", password: DEMO_PW }), 401);
      refused(await anon.try("POST", "/auth/login", { email: ctx.teacher.email, password: DEMO_PW }), 401);
      refused(await anon.try("POST", "/auth/login", { email: "myra.malhotra@sfhs.in", password: DEMO_PW }), 401);
    });
  } else if (MODE === "domain") {
    await step("an address at a held demo domain is never mailed, even from a school that is not a demo", async () => {
      assert.equal((await admin.get("/outbox")).demo, false);
      const f = await admin.post("/outbox/flush");
      assert.equal(f.sent, 0); assert.equal(f.suppressed, 1);
      assert.equal(caught.length, 0);
      const mail = (await admin.get("/outbox")).mail.filter((m) => m.to === ctx.teacher.email);
      assert.deepEqual(mail.map((m) => m.status), ["suppressed"]); assert.match(mail[0].error, /Demo address/);
    });
  } else {
    await step("a school that is not a demo still has its mail sent", async () => {
      const f = await admin.post("/outbox/flush");
      assert.equal(f.sent, 1); assert.equal(f.demo, undefined); assert.equal(f.suppressed, undefined);
      assert.equal(caught.length, 1);
      assert.equal(caught[0].to, ctx.teacher.email); assert.equal(caught[0].subject, "Welcome to the school");
      assert.deepEqual((await admin.get("/outbox")).mail.filter((m) => m.to === ctx.teacher.email).map((m) => m.status), ["sent"]);
    });
  }
  console.log(`\n${n} steps passed (${MODE}).`);
} catch (e) { console.log("\nstopped: " + e.message); process.exitCode = 1; }
catcher.close();
