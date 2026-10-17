// A whole school's people, loaded from one file, over HTTP: 1,875 rows in chunks the way the
// console sends them, a check that writes nothing, bad rows skipped by line while the good ones
// load, accounts that are `invited` with no password, guardians linked to children, the same
// file run twice, the roles only an administrator may give, and the refusals. Local only.
//   cd api && node_modules/.bin/wrangler d1 migrations apply oplo-platform-db --local
//   API=http://localhost:8794/api/v1 CRED=/path/credentials.json node scripts/prove-people-import.mjs
// (run it from api/, with the Worker started by api's own wrangler: node_modules/.bin/wrangler dev --port 8794).
// It reads the database it proves through that same wrangler, and sets one password through
// scripts/set-password.sh to show an invited person can sign in afterwards. PEOPLE_CSV=/path/file.csv
// also runs a real roster through the same road.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const API = process.env.API || "http://localhost:8794/api/v1";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const HERE = path.dirname(fileURLToPath(import.meta.url)), API_DIR = path.join(HERE, "..");
const WRANGLER = path.join(API_DIR, "node_modules/.bin/wrangler");
const RUN = Date.now().toString(36);
const PW = crypto.randomBytes(12).toString("base64url") + "-A1!";   // made now, used now, shown nowhere
const CHUNK = 200;

function person(label) {
  const jar = { cookie: "" };
  async function call(method, p, body, raw) {
    const go = () => fetch(API + p, { method, headers: { "content-type": "application/json", origin: "http://localhost:8123", cookie: jar.cookie },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const r = await go().catch(go);   // a socket left idle while the proof reads the database is closed under it: once more
    const sc = r.headers.get("set-cookie"); if (sc) jar.cookie = sc.split(";")[0];
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
    if (raw) return { status: r.status, body: j };
    if (!r.ok) throw new Error(`${label}: ${method} ${p} -> ${r.status} ${t.slice(0, 250)}`);
    return j;
  }
  return { get: (p) => call("GET", p), post: (p, b) => call("POST", p, b ?? {}), try: (m, p, b) => call(m, p, b, true), login: (e, p) => call("POST", "/auth/login", { email: e, password: p }) };
}
let n = 0;
const step = async (name, fn) => { try { await fn(); n++; console.log("  ok  " + name); } catch (e) { console.log("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; throw e; } };
const refused = (r, s) => assert.equal(r.status, s, `expected ${s}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
const admin = person("admin"), registrar = person("registrar"), teacher = person("teacher"), pupil = person("pupil"), anon = person("anon");
const ctx = {};

// The database, read the way the Worker reads it: this wrangler, the same local state.
function sql(query) {
  const out = execFileSync(WRANGLER, ["d1", "execute", "oplo-platform-db", "--local", "--json", "--command", query], { cwd: API_DIR, encoding: "utf8", maxBuffer: 64 << 20 });
  return JSON.parse(out.slice(out.indexOf("[")))[0].results;
}
const one = (query) => Object.values(sql(query)[0])[0];

// What the console does: CHUNK rows at a time, the answers added up.
async function load(who, rows, dry) {
  const t = { rows: 0, invited: 0, matched: 0, rolesGiven: 0, guardiansLinked: 0, skipped: 0, problemCount: 0, problems: [], fresh: new Set(), known: new Set(), raw: [], status: [] };
  for (let off = 0; off < rows.length; off += CHUNK) {
    const r = await who.try("POST", "/exchange/import", { set: "users", rows: rows.slice(off, off + CHUNK), dry, offset: off });
    assert.ok(r.status === 200 || r.status === 201, `chunk at ${off}: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
    t.raw.push(r.body); t.status.push(r.status);
    for (const k of ["rows", "invited", "matched", "rolesGiven", "guardiansLinked", "skipped", "problemCount"]) t[k] += r.body[k];
    t.problems.push(...r.body.problems);
    r.body.invitedEmails.forEach((e) => t.fresh.add(e.toLowerCase())); r.body.matchedEmails.forEach((e) => t.known.add(e.toLowerCase()));
  }
  t.people = t.fresh.size; t.already = [...t.known].filter((e) => !t.fresh.has(e)).length;   // each person once, as the console counts
  return t;
}

// The school: 15 administrators, 59 teachers, 1,801 students — the shape of the SFHS roster — each
// child with a guardian, two children to a guardian, so some pairs fall across a chunk boundary.
const dom = `.${RUN}@sfhs.test`, gdom = `.${RUN}@family.test`;
const file = [];
for (let i = 0; i < 15; i++) file.push({ name: `Office Person ${i + 1}`, email: `office${i + 1}${dom}`, role: "admin" });
for (let i = 0; i < 59; i++) file.push({ name: `Teacher Person ${i + 1}`, email: `teacher${i + 1}${dom}`, role: "teacher" });
for (let k = 0; k < 1801; k++) {
  file.push({ name: `Student Person ${k + 1}`, email: `student${k + 1}${dom}`, role: "student",
    guardian_email: `family${Math.floor((k + 1) / 2)}${gdom}`, guardian_name: `Family Person ${Math.floor((k + 1) / 2)}`,
    relationship: k % 2 ? "mother" : "father" });
}
const rowOf = (k) => 15 + 59 + k + 1;                  // 1-based row in the file of student k (0-based)
const BAD = {                                          // row in the file → the field that is wrong
  [rowOf(4)]: "email", [rowOf(224)]: "role", [rowOf(574)]: "name", [rowOf(924)]: "guardianEmail", [rowOf(1424)]: "relationship", [rowOf(1624)]: "guardianName"
};
Object.assign(file[rowOf(4) - 1], { email: "not-an-email" });
Object.assign(file[rowOf(224) - 1], { role: "wizard" });
Object.assign(file[rowOf(574) - 1], { name: "A" });
Object.assign(file[rowOf(924) - 1], { guardian_email: file[rowOf(924) - 1].email });
Object.assign(file[rowOf(1424) - 1], { relationship: "uncle-ish" });
Object.assign(file[rowOf(1624) - 1], { guardian_email: `lonely${gdom}`, guardian_name: "" });
// Who should exist once the good rows are in: simulated here, independently of the Worker.
const goodRows = file.filter((_, i) => !BAD[i + 1]);
const WANT = new Set(goodRows.flatMap((r) => [r.email.toLowerCase(), r.guardian_email && r.guardian_email.toLowerCase()]).filter(Boolean));
const goodStudents = goodRows.filter((r) => r.role === "student");
const mineOf = (a = "") => `(${a}email_lower LIKE '%${dom}' OR ${a}email_lower LIKE '%${gdom}')`;   // this run's people, not the three made by hand
const mine = mineOf();

try {
  await step("people: a registrar, a teacher and a pupil, who may not import", async () => {
    await admin.login(cred.email, cred.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.registrar = await mk("Rita Registrar", "teacher", `rita.pi${RUN}@s.test`);
    await admin.post(`/accounts/${ctx.registrar.id}/roles`, { product: "learn", role: "registrar", orgId: ctx.org });
    ctx.teacher = await mk("Tia Teacher", "teacher", `tia.pi${RUN}@s.test`);
    ctx.pupil = await mk("Pip Pupil", "student", `pip.pi${RUN}@s.test`);
    await registrar.login(ctx.registrar.email, PW); await teacher.login(ctx.teacher.email, PW); await pupil.login(ctx.pupil.email, PW);
    ctx.before = (await admin.get("/exchange/export?set=users")).rows.length;
  });

  await step("a check reads all 1,875 rows in chunks, names every bad row by line, and writes nothing", async () => {
    assert.equal(file.length, 1875);
    const t0 = Date.now();
    const t = await load(admin, file, true);
    ctx.checkMs = Date.now() - t0;
    assert.equal(t.rows, 1875); assert.equal(t.skipped, 6, JSON.stringify(t.problems)); assert.equal(t.problemCount, 6, JSON.stringify(t.problems));
    assert.deepEqual(t.problems.map((p) => `${p.row}:${p.field}`), Object.entries(BAD).map(([row, f]) => `${row}:${f}`), "each bad row by its place in the file");
    assert.equal(t.people, WANT.size, "each person to be invited counted once, though a guardian turns up in two chunks"); assert.equal(t.already, 0);
    assert.ok(t.invited > t.people, "…which adding up the chunks would not give");
    assert.ok(t.raw.every((b) => b.applied === false) && t.status.every((s) => s === 200));
    assert.equal((await admin.get("/exchange/export?set=users")).rows.length, ctx.before, "a check wrote nothing");
    assert.equal(one(`SELECT COUNT(*) FROM accounts WHERE ${mine}`), 0);
  });

  await step("the import loads the good rows past the bad ones, and invites everybody", async () => {
    const t0 = Date.now();
    const t = await load(admin, file, false);
    ctx.loadMs = Date.now() - t0;
    assert.equal(t.rows, 1875); assert.equal(t.skipped, 6);
    assert.deepEqual(t.problems.map((p) => p.row), Object.keys(BAD).map(Number));
    assert.equal(t.invited, WANT.size, "every person once"); assert.equal(t.people, WANT.size);
    assert.ok(t.matched > 0 && t.already === 0, "a guardian made in one chunk is matched, not made again, in the next: not 'already had an account'");
    assert.equal(one(`SELECT COUNT(*) FROM accounts WHERE ${mine}`), WANT.size);
    ctx.invited = t.invited; ctx.links = t.guardiansLinked;
  });

  await step("nobody has a password: nothing secret came back and nothing was hashed", async () => {
    assert.equal(one(`SELECT COUNT(*) FROM accounts WHERE ${mine} AND status = 'invited' AND pw_hash IS NULL AND pw_salt IS NULL AND pw_iterations IS NULL`), WANT.size);
    assert.equal(one(`SELECT COUNT(*) FROM accounts WHERE ${mine} AND pw_hash IS NOT NULL`), 0);
    const real = await load(admin, file.slice(0, 20), false);
    for (const b of real.raw) {
      const text = JSON.stringify(b);
      assert.ok(!/"credentials"|"pw_|"hash"|"salt"/.test(text), "no credentials in the answer");
      assert.ok(/set-password\.sh/.test(b.note), "the answer says who sets the password and how");
    }
    refused(await anon.try("POST", "/auth/login", { email: file[80].email, password: PW }), 401);
  });

  await step("roles, membership and profiles are the school's own", async () => {
    const roles = Object.fromEntries(sql(`SELECT r.role, COUNT(*) AS n FROM account_roles r JOIN accounts a ON a.id = r.account_id WHERE ${mineOf('a.')} AND r.org_id = '${ctx.org}' AND r.product = 'learn' GROUP BY r.role`).map((r) => [r.role, r.n]));
    assert.deepEqual(roles, { admin: 15, teacher: 59, student: goodStudents.length, guardian: new Set(goodStudents.map((s) => s.guardian_email)).size });
    assert.equal(one(`SELECT COUNT(*) FROM organization_memberships m JOIN accounts a ON a.id = m.account_id WHERE ${mineOf('a.')} AND m.org_id = '${ctx.org}'`), WANT.size);
    assert.equal(one(`SELECT COUNT(*) FROM organization_memberships m JOIN accounts a ON a.id = m.account_id WHERE ${mineOf('a.')} AND m.role = 'admin'`), 15, "an administrator is an admin member");
    assert.equal(one(`SELECT COUNT(*) FROM accounts a JOIN profiles p ON p.account_id = a.id WHERE ${mineOf('a.')}`), WANT.size);
    assert.equal(sql(`SELECT p.name, p.first_name, p.initials FROM accounts a JOIN profiles p ON p.account_id = a.id WHERE a.email_lower = '${file[80].email}'`)[0].initials, "SP");
  });

  await step("a guardian is linked to each child, the first one primary, and a family reads as a family", async () => {
    assert.equal(ctx.links, goodStudents.length);
    assert.equal(one(`SELECT COUNT(*) FROM learn_guardians l JOIN accounts s ON s.id = l.student_id WHERE ${mineOf('s.')}`), goodStudents.length);
    assert.equal(one(`SELECT COUNT(*) FROM (SELECT l.student_id FROM learn_guardians l JOIN accounts s ON s.id = l.student_id WHERE ${mineOf('s.')} GROUP BY l.student_id HAVING SUM(l.is_primary) = 1)`), goodStudents.length, "exactly one primary guardian each");
    const id = (e) => sql(`SELECT id FROM accounts WHERE email_lower = '${e.toLowerCase()}'`)[0].id;
    ctx.s0 = id(goodStudents[0].email);
    const one0 = (await admin.get(`/students/${ctx.s0}/guardians`)).guardians;
    assert.equal(one0.length, 1); assert.equal(one0[0].relationship, "parent"); assert.equal(one0[0].label, "Father"); assert.equal(one0[0].primary, true);
    const [a, b] = [goodStudents[1], goodStudents[2]].map((s) => id(s.email));   // two children of one family
    const ga = (await admin.get(`/students/${a}/guardians`)).guardians[0], gb = (await admin.get(`/students/${b}/guardians`)).guardians[0];
    assert.equal(ga.id, gb.id, "two children, one guardian account");
    assert.deepEqual([ga.label, gb.label], ["Mother", "Father"], "each link keeps what its own row said");
    assert.ok(ga.primary && gb.primary, "the first guardian a child has is the primary one");
  });

  await step("running the same file again changes nothing", async () => {
    const count = () => ["accounts", "profiles", "account_roles", "organization_memberships", "learn_guardians"].map((t) => one(`SELECT COUNT(*) FROM ${t}`));
    const before = count();
    const t = await load(admin, file, false);
    assert.equal(t.invited, 0, "nobody is made twice");
    assert.equal(t.already, WANT.size, "everybody is matched"); assert.equal(t.people, 0);
    assert.equal(t.rolesGiven, 0); assert.equal(t.skipped, 6, "the six bad rows are still bad");
    assert.deepEqual(count(), before);
    assert.equal((await load(admin, file, true)).people, 0, "and a check says there is nothing to invite");
  });

  await step("a guardian row states the link and keeps what it leaves out", async () => {
    const s = goodStudents[0], g = s.guardian_email;
    const link = () => sql(`SELECT l.relationship, l.label, l.is_primary FROM learn_guardians l WHERE l.student_id = '${ctx.s0}' AND l.guardian_id = (SELECT id FROM accounts WHERE email_lower = '${g.toLowerCase()}')`)[0];
    await admin.post("/exchange/import", { set: "users", rows: [{ name: s.name, email: s.email, guardian_email: g }] });
    assert.deepEqual(link(), { relationship: "parent", label: "Father", is_primary: 1 }, "a row that names only the guardian changes nothing");
    await admin.post("/exchange/import", { set: "users", rows: [{ name: s.name, email: s.email, guardian_email: g, relationship: "grandparent" }] });
    assert.equal(link().relationship, "grandparent"); assert.equal(link().is_primary, 1, "still primary");
    // A second guardian takes the primary only when the row says so.
    const second = (primary) => ({ name: s.name, email: s.email, guardian_email: `second${primary || "x"}${gdom}`, guardian_name: "Second Guardian", relationship: "relative", primary });
    const a = await admin.post("/exchange/import", { set: "users", rows: [second("")] });
    assert.equal(a.invited, 1); assert.equal(a.guardiansLinked, 1);
    assert.equal(sql(`SELECT is_primary FROM learn_guardians WHERE student_id = '${ctx.s0}' AND is_primary = 1`).length, 1);
    assert.equal(link().is_primary, 1, "a later guardian does not take the place");
    await admin.post("/exchange/import", { set: "users", rows: [second("yes")] });
    const prim = sql(`SELECT a.email_lower FROM learn_guardians l JOIN accounts a ON a.id = l.guardian_id WHERE l.student_id = '${ctx.s0}' AND l.is_primary = 1`);
    assert.equal(prim.length, 1, "one primary, always"); assert.ok(prim[0].email_lower.startsWith("secondyes"));
    assert.equal(link().is_primary, 0);
  });

  await step("one person on two rows has two roles, and one account", async () => {
    const t = file[20];                                      // a teacher
    const r = await admin.post("/exchange/import", { set: "users", rows: [{ name: t.name, email: t.email, role: "principal" }, { name: t.name, email: t.email.toUpperCase(), role: "admin" }] });
    assert.equal(r.invited, 0); assert.equal(r.matched, 1); assert.equal(r.rolesGiven, 2);
    const roles = sql(`SELECT r.role FROM account_roles r JOIN accounts a ON a.id = r.account_id WHERE a.email_lower = '${t.email}' ORDER BY r.role`).map((x) => x.role);
    assert.deepEqual(roles, ["admin", "principal", "teacher"]);
    assert.equal(one(`SELECT COUNT(*) FROM accounts WHERE email_lower = '${t.email}'`), 1);
    // The same address, offered in two chunks of one request, is still made once.
    const dup = [{ name: "Dup Person", email: `dup${dom}`, role: "student" }, { name: "Dup Person", email: `DUP${dom}`, role: "student" }];
    assert.equal((await admin.post("/exchange/import", { set: "users", rows: dup })).invited, 1);
  });

  await step("an office role is given only by someone who may give roles", async () => {
    const rows = [
      { name: "Sam Student", email: `sam${dom}`, role: "student" },
      { name: "Tess Teacher", email: `tess${dom}`, role: "teacher" },
      { name: "Adam Admin", email: `adam${dom}`, role: "admin" },
      { name: "Pru Principal", email: `pru${dom}`, role: "principal" }
    ];
    const r = await registrar.post("/exchange/import", { set: "users", rows });
    assert.equal(r.invited, 2, "the student and the teacher");
    assert.deepEqual(r.problems.map((p) => `${p.row}:${p.field}`), ["3:role", "4:role"]);
    assert.ok(/administrator/.test(r.problems[0].message));
    assert.equal(one(`SELECT COUNT(*) FROM accounts WHERE email_lower IN ('adam${dom}', 'pru${dom}')`), 0, "the skipped rows made nobody");
    const a = await admin.post("/exchange/import", { set: "users", rows: rows.slice(2) });
    assert.equal(a.invited, 2); assert.equal(a.problemCount, 0);
    assert.equal(one(`SELECT COUNT(*) FROM account_roles WHERE role = 'principal' AND account_id = (SELECT id FROM accounts WHERE email_lower = 'pru${dom}')`), 1);
  });

  await step("an invited person sets a password themself, and then signs in", async () => {
    const who = file[80], roleOf = who.role;                // a student
    refused(await anon.try("POST", "/auth/login", { email: who.email, password: PW }), 401);
    const secret = crypto.randomBytes(15).toString("base64url") + "-9Q";
    execFileSync(path.join(HERE, "set-password.sh"), [who.email], { cwd: API_DIR, input: `${secret}\n${secret}\n`, env: { ...process.env, PATH: path.join(API_DIR, "node_modules/.bin") + ":" + process.env.PATH }, stdio: ["pipe", "ignore", "ignore"] });
    assert.equal(one(`SELECT status FROM accounts WHERE email_lower = '${who.email}'`), "active");
    const me = person("student");
    await me.login(who.email, secret);
    assert.ok((await me.get("/me")).account.roles.some((r) => r.product === "learn" && r.role === roleOf));
    // …and a guardian is the same.
    const gmail = file[80].guardian_email, gsecret = crypto.randomBytes(15).toString("base64url") + "-9Q";
    execFileSync(path.join(HERE, "set-password.sh"), [gmail], { cwd: API_DIR, input: `${gsecret}\n${gsecret}\n`, env: { ...process.env, PATH: path.join(API_DIR, "node_modules/.bin") + ":" + process.env.PATH }, stdio: ["pipe", "ignore", "ignore"] });
    const gp = person("guardian");
    await gp.login(gmail, gsecret);
    assert.ok((await gp.get("/me")).account.roles.some((r) => r.product === "learn" && r.role === "guardian"));
    refused(await anon.try("POST", "/auth/login", { email: file[81].email, password: secret }), 401);   // another invited person: no
  });

  await step("a bad request is refused, and a bad row is not a bad request", async () => {
    const row = { name: "Ok Person", email: `ok${dom}`, role: "student" };
    refused(await admin.try("POST", "/exchange/import", { set: "users", rows: [] }), 400);
    refused(await admin.try("POST", "/exchange/import", { set: "users" }), 400);
    refused(await admin.try("POST", "/exchange/import", { set: "users", rows: Array(CHUNK + 1).fill(row) }), 400);
    refused(await admin.try("POST", "/exchange/import", { set: "nobody", rows: [row] }), 400);
    const odd = await admin.try("POST", "/exchange/import", { set: "users", rows: [null, "text", 7, [], row] });
    assert.equal(odd.status, 201); assert.equal(odd.body.invited, 1); assert.equal(odd.body.skipped, 4);
    const em = { name: "Em Person", email: `em${dom}`, role: "student", guardian_email: `fam${gdom}` };
    assert.deepEqual((await admin.post("/exchange/import", { set: "users", rows: [{ ...em, primary: "maybe", guardian_name: "Fam Person" }] })).problems.map((p) => p.field), ["primary"]);
    assert.deepEqual((await admin.post("/exchange/import", { set: "users", rows: [em] })).problems.map((p) => p.field), ["guardianName"], "a guardian nobody has an account for needs a name");
    assert.equal(one(`SELECT COUNT(*) FROM accounts WHERE email_lower IN ('em${dom}', 'fam${gdom}')`), 0);
  });

  await step("only the office imports", async () => {
    const body = { set: "users", rows: [{ name: "Nope Person", email: `nope${dom}`, role: "student" }] };
    refused(await teacher.try("POST", "/exchange/import", body), 403);
    refused(await pupil.try("POST", "/exchange/import", body), 403);
    refused(await anon.try("POST", "/exchange/import", body), 401);
    assert.equal(one(`SELECT COUNT(*) FROM accounts WHERE email_lower = 'nope${dom}'`), 0);
  });

  if (process.env.PEOPLE_CSV) {
    await step("a real roster: the file the school sent, loaded whole", async () => {
      const lines = fs.readFileSync(process.env.PEOPLE_CSV, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
      const head = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((l) => Object.fromEntries(l.split(",").map((v, i) => [head[i], v.trim()])));
      const by = (role) => rows.filter((r) => r.role === role).length;
      const was = one("SELECT COUNT(*) FROM accounts");
      const t = await load(admin, rows, true);
      assert.equal(t.problemCount, 0, JSON.stringify(t.problems.slice(0, 3))); assert.equal(one("SELECT COUNT(*) FROM accounts"), was, "the check wrote nothing");
      const w = await load(admin, rows, false);
      assert.equal(w.rows, rows.length); assert.equal(w.skipped, 0); assert.equal(w.invited, new Set(rows.map((r) => r.email.toLowerCase())).size);
      assert.equal(one(`SELECT COUNT(DISTINCT account_id) FROM account_roles WHERE org_id = '${ctx.org}' AND role = 'admin' AND account_id IN (SELECT id FROM accounts WHERE email_lower LIKE '%@sfhs.in' AND status = 'invited' AND pw_hash IS NULL)`), by("admin"));
      // The India details file matches children by email: every one of them is now a person the school has.
      const kids = rows.filter((r) => r.role === "student");
      let matched = 0, unmatched = 0;
      for (let off = 0; off < kids.length; off += CHUNK) {
        const r = await admin.post("/india/import", { check: true, rows: kids.slice(off, off + CHUNK).map((k) => ({ email: k.email })) });
        matched += r.matched; unmatched += r.unmatchedCount;
      }
      assert.equal(matched, kids.length); assert.equal(unmatched, 0);
      console.log(`       ${rows.length} rows: ${by("student")} students, ${by("teacher")} teachers, ${by("admin")} administrators — all invited, none with a password; the India details file finds all ${matched} children`);
    });
  }

  console.log(`\n${n} steps passed. (check ${ctx.checkMs} ms, load ${ctx.loadMs} ms, ${ctx.invited} people invited, ${CHUNK} rows a request)`);
} catch (e) { console.log("\nstopped: " + e.message); process.exitCode = 1; }
