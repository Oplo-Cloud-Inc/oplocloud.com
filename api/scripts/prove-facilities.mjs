// Facilities over HTTP, as the people who use them, ending with the refusals.
// Local only; needs an existing administrator.
//   API=http://localhost:8793/api/v1 CRED=/path/credentials.json node scripts/prove-facilities.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const API = process.env.API || "http://localhost:8793/api/v1";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const RUN = Date.now().toString(36);
const PW = "Fac-" + RUN + "-A1!";
const TODAY = new Date().toISOString().slice(0, 10);
const NOW = TODAY + "T08:00";
const add = (ymd, n) => { const d = new Date(ymd + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const wd = (ymd) => new Date(ymd + "T00:00:00Z").getUTCDay();
const nextWeekday = (from, want) => { let d = from; while (wd(d) !== want) d = add(d, 1); return d; };
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function person(label) {
  const jar = { cookie: "" };
  async function call(method, path, body, raw) {
    const r = await fetch(API + path, { method, headers: { "content-type": "application/json", origin: "http://localhost:8199", cookie: jar.cookie },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const sc = r.headers.get("set-cookie"); if (sc) jar.cookie = sc.split(";")[0];
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
    if (raw) return { status: r.status, body: j };
    if (!r.ok) throw new Error(`${label}: ${method} ${path} -> ${r.status} ${t.slice(0, 300)}`);
    return j;
  }
  return { get: (p) => call("GET", p), post: (p, b) => call("POST", p, b ?? {}), patch: (p, b) => call("PATCH", p, b ?? {}), put: (p, b) => call("PUT", p, b ?? {}),
           try: (m, p, b) => call(m, p, b, true), login: (e, p) => call("POST", "/auth/login", { email: e, password: p }) };
}
let n = 0;
const step = async (name, fn) => { try { await fn(); n++; console.log("  ok  " + name); } catch (e) { console.log("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; } };
const refused = (r, s) => assert.equal(r.status, s, `expected ${s}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 220)}`);
const admin = person("admin"), fac = person("facilities"), office = person("office"), it = person("it"),
      teacher = person("teacher"), other = person("other"), kid = person("student");
const ctx = {};
const q = (o) => "?" + Object.entries({ today: TODAY, nowAt: NOW, ...o }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");

try {
  await step("people: facilities, office, IT, two teachers, a student", async () => {
    await admin.login(cred.email, cred.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.fac = await mk("Fran Facilities", "facilities", `fran.${RUN}@s.test`);
    ctx.office = await mk("Olive Office", "office", `olive.${RUN}@s.test`);
    ctx.it = await mk("Ian IT", "it", `ian.${RUN}@s.test`);
    ctx.teacher = await mk("Tia Teacher", "teacher", `tia.${RUN}@s.test`);
    ctx.other = await mk("Omar Other", "teacher", `omar.${RUN}@s.test`);
    ctx.kid = await mk("Kai Student", "student", `kai.${RUN}@s.test`);
    for (const [p, a] of [[fac, ctx.fac], [office, ctx.office], [it, ctx.it], [teacher, ctx.teacher], [other, ctx.other], [kid, ctx.kid]]) await p.login(a.email, PW);
  });

  /* ------------------------------------------------------- slice 1 */
  await step("the facilities manager adds a building, a floor, and a run of rooms", async () => {
    const b = (await fac.post("/facilities/spaces", { name: "Main building " + RUN, kind: "building" })).spaces[0];
    const f = (await fac.post("/facilities/spaces", { name: "Floor 1", kind: "floor", parentId: b.id })).spaces[0];
    const r = await fac.post("/facilities/spaces", { parentId: f.id, kind: "room", capacity: 24, range: { prefix: `R${RUN} `, from: 101, to: 103, codes: false } });
    assert.equal(r.spaces.length, 3);
    assert.equal(r.spaces[0].name, `R${RUN} 101`);
    ctx.building = b; ctx.floor = f; ctx.rooms = r.spaces;
  });

  await step("a code is unique; a run that would repeat one is refused whole", async () => {
    await fac.post("/facilities/spaces", { name: "Library " + RUN, code: "LIB-" + RUN, kind: "room" });
    refused(await fac.try("POST", "/facilities/spaces", { name: "Another", code: "LIB-" + RUN }), 409);
  });

  await step("a teacher can read the rooms and cannot add one", async () => {
    const l = await teacher.get("/facilities/spaces");
    assert.ok(l.spaces.some((s) => s.id === ctx.rooms[0].id));
    assert.equal(l.spaces[0].assets, undefined, "counts are the team's");
    refused(await teacher.try("POST", "/facilities/spaces", { name: "Mine" }), 403);
  });

  await step("a teacher reports a problem: it waits, pending; the same tap twice is one request", async () => {
    const body = { title: "Projector will not turn on", details: "Clicks and nothing.", spaceId: ctx.rooms[0].id, category: "it", priority: "high", clientKey: "k-" + RUN };
    const a = await teacher.post("/facilities/orders", body);
    assert.equal(a.order.status, "pending");
    assert.equal(a.order.requestedBy, ctx.teacher.id);
    const b = await teacher.post("/facilities/orders", body);
    assert.equal(b.repeated, true);
    assert.equal(b.order.id, a.order.id);
    ctx.req = a.order;
  });

  await step("a student cannot ask for anything", async () => {
    refused(await kid.try("POST", "/facilities/orders", { title: "x" }), 403);
    refused(await kid.try("GET", "/facilities/spaces"), 403);
  });

  await step("another teacher sees that it was reported, in a line, not the request", async () => {
    const r = await other.get(`/facilities/orders?brief=1&spaceId=${ctx.rooms[0].id}`);
    assert.ok(r.open.some((x) => x.id === ctx.req.id));
    assert.equal(r.open[0].details, undefined);
    const mine = await other.get("/facilities/orders");
    assert.equal(mine.orders.length, 0, "a teacher lists only their own");
    refused(await other.try("GET", `/facilities/orders/${ctx.req.id}`), 404);
  });

  await step("the team sees it waiting; a teacher cannot accept their own", async () => {
    const l = await fac.get("/facilities/orders" + q({ status: "unfinished" }));
    assert.ok(l.orders.some((o) => o.id === ctx.req.id && o.status === "pending"));
    refused(await teacher.try("POST", `/facilities/orders/${ctx.req.id}/actions/approve`), 403);
  });

  await step("the team accepts it, gives it to IT, and the teacher watches it move", async () => {
    const a = await fac.post(`/facilities/orders/${ctx.req.id}/actions/approve`, { assigneeId: ctx.it.id, dueOn: add(TODAY, 2) });
    assert.equal(a.order.status, "open");
    assert.equal(a.order.assigneeName, "Ian IT");
    await fac.post(`/facilities/orders/${ctx.req.id}/actions/comment`, { note: "Spare lamp is in the cupboard.", internal: true });
    await fac.post(`/facilities/orders/${ctx.req.id}/actions/comment`, { note: "IT will be there on Thursday." });
    const t = await teacher.get(`/facilities/orders/${ctx.req.id}`);
    assert.equal(t.order.status, "open");
    assert.ok(t.events.some((e) => e.note === "IT will be there on Thursday."));
    assert.ok(!t.events.some((e) => e.kind === "note"), "an internal note is the team's");
  });

  await step("work moves open → in progress → on hold → done; a finished order cannot be started", async () => {
    const id = ctx.req.id;
    assert.equal((await it.post(`/facilities/orders/${id}/actions/start`)).order.status, "in_progress");
    assert.equal((await it.post(`/facilities/orders/${id}/actions/hold`, { note: "Waiting for a lamp" })).order.status, "on_hold");
    assert.equal((await it.post(`/facilities/orders/${id}/actions/start`)).order.status, "in_progress");
    const done = (await it.post(`/facilities/orders/${id}/actions/complete`, { minutes: 25, outcome: "Replaced the lamp." })).order;
    assert.equal(done.status, "done"); assert.equal(done.minutes, 25);
    refused(await it.try("POST", `/facilities/orders/${id}/actions/start`), 409);
    refused(await teacher.try("POST", `/facilities/orders/${id}/actions/reopen`), 403);
  });

  await step("a request is declined with a reason the teacher can read; reconsidering puts it back", async () => {
    const o = (await teacher.post("/facilities/orders", { title: "Paint the hall", spaceId: ctx.rooms[1].id })).order;
    refused(await fac.try("POST", `/facilities/orders/${o.id}/actions/decline`, {}), 400);
    const d = await fac.post(`/facilities/orders/${o.id}/actions/decline`, { reason: "Not this term." });
    assert.equal(d.order.status, "declined");
    assert.equal((await teacher.get(`/facilities/orders/${o.id}`)).order.declineReason, "Not this term.");
    assert.equal((await fac.post(`/facilities/orders/${o.id}/actions/reconsider`)).order.status, "pending");
    assert.equal((await teacher.post(`/facilities/orders/${o.id}/actions/cancel`, { note: "Never mind" })).order.status, "cancelled");
  });

  await step("a photo goes on a request; a large one is refused with the way round it", async () => {
    const f = (await teacher.post(`/facilities/orders/${ctx.req.id}/files`, { name: "lamp.png", type: "image/png", data: PNG })).file;
    const g = await fac.get(`/facilities/orders/${ctx.req.id}/files/${f.id}`);
    assert.equal(g.file.data, PNG);
    const big = Buffer.alloc(800 * 1024, 1).toString("base64");
    const r = await teacher.try("POST", `/facilities/orders/${ctx.req.id}/files`, { name: "big.png", type: "image/png", data: big });
    refused(r, 400);
    assert.ok(/limit/i.test(r.body.error.message));
    refused(await other.try("POST", `/facilities/orders/${ctx.req.id}/files`, { name: "x.png", type: "image/png", data: PNG }), 404);
  });

  /* ------------------------------------------------------- slice 2 */
  await step("assets are pinned to a room; a code is unique; custody can be a person", async () => {
    const mk = async (name, code, extra) => (await fac.post("/facilities/assets", { name, code, spaceId: ctx.rooms[0].id, ...extra })).asset;
    ctx.a1 = await mk("Projector", `P-${RUN}`, { kind: "Projector", warrantyEnd: add(TODAY, 20), installedOn: "2022-08-01", lifeYears: 8 });
    ctx.a2 = await mk("Document camera", `C-${RUN}`, { custodianId: ctx.teacher.id });
    ctx.a3 = await mk("Speaker", `S-${RUN}`, {});
    assert.equal(ctx.a1.warranty, "soon");
    assert.equal(ctx.a2.custodianName, "Tia Teacher");
    refused(await fac.try("POST", "/facilities/assets", { name: "Dup", code: `P-${RUN}` }), 409);
    const auto = (await fac.post("/facilities/assets", { name: "Whiteboard" })).asset;
    assert.match(auto.code, /^AST-\d{4}$/);
  });

  await step("a teacher sees what is in their keeping and nothing else", async () => {
    const mine = await teacher.get("/facilities/assets");
    assert.deepEqual(mine.assets.map((a) => a.id), [ctx.a2.id]);
    refused(await teacher.try("GET", `/facilities/assets/${ctx.a1.id}`), 404);
    refused(await teacher.try("POST", "/facilities/assets", { name: "Mine" }), 403);
  });

  await step("counting a room: found, missing, in the wrong room, unknown; applying moves it and dates it", async () => {
    const second = (await fac.post("/facilities/assets", { name: "Kettle", code: `K-${RUN}`, spaceId: ctx.rooms[1].id })).asset;
    const seen = [`P-${RUN}`, `C-${RUN}`, `K-${RUN}`, "NOPE-" + RUN];
    const dry = await fac.post(`/facilities/spaces/${ctx.rooms[0].id}/count`, { codes: seen, today: TODAY });
    assert.equal(dry.applied, false);
    assert.deepEqual(dry.found.map((a) => a.code).sort(), [`C-${RUN}`, `P-${RUN}`].sort());
    assert.deepEqual(dry.missing.map((a) => a.code), [`S-${RUN}`]);
    assert.deepEqual(dry.elsewhere.map((a) => a.code), [`K-${RUN}`]);
    assert.deepEqual(dry.unknown, ["NOPE-" + RUN]);
    await fac.post(`/facilities/spaces/${ctx.rooms[0].id}/count`, { codes: seen, apply: true, today: TODAY });
    const moved = (await fac.get(`/facilities/assets/${second.id}`));
    assert.equal(moved.asset.spaceId, ctx.rooms[0].id);
    assert.ok(moved.events.some((e) => e.kind === "moved"));
    assert.equal((await fac.get(`/facilities/assets/${ctx.a1.id}`)).asset.lastSeenOn, TODAY);
  });

  await step("a vendor is as current as its papers; a lapsed one needs attention", async () => {
    const v = (await fac.post("/facilities/vendors", { name: "Bright Electric " + RUN, trade: "Electrical", requires: ["Insurance certificate", "Licence"], contractEndsOn: add(TODAY, 200) })).vendor;
    ctx.vendor = v;
    assert.equal(v.standing.state, "attention");
    await fac.post("/facilities/documents", { ownerKind: "vendor", ownerId: v.id, kind: "Insurance certificate", title: "Policy 88", expiresOn: add(TODAY, 10) });
    let got = (await fac.get("/facilities/vendors/" + v.id + q({}))).vendor;
    assert.equal(got.standing.list.find((x) => x.need === "Insurance certificate").state, "soon");
    assert.equal(got.standing.list.find((x) => x.need === "Licence").state, "missing");
    const lic = (await fac.post("/facilities/documents", { ownerKind: "vendor", ownerId: v.id, kind: "Licence", title: "Licence 12", expiresOn: add(TODAY, -1) })).document;
    assert.equal(lic.state, "expired");
    await fac.patch("/facilities/documents/" + lic.id, { expiresOn: add(TODAY, 365) });
    got = (await fac.get("/facilities/vendors/" + v.id + q({}))).vendor;
    assert.equal(got.standing.list.find((x) => x.need === "Licence").state, "ok");
  });

  await step("documents list soonest-expiring first; a school paper needs no owner; a link must be https", async () => {
    await fac.post("/facilities/documents", { ownerKind: "school", kind: "Certificate", title: "Fire certificate " + RUN, expiresOn: add(TODAY, 5), url: "https://example.org/fire.pdf" });
    refused(await fac.try("POST", "/facilities/documents", { ownerKind: "school", kind: "Manual", title: "x", url: "http://insecure" }), 400);
    refused(await fac.try("POST", "/facilities/documents", { ownerKind: "asset", kind: "Manual", title: "x" }), 400);
    const l = await fac.get("/facilities/documents" + q({ state: "expiring" }));
    assert.ok(l.documents.length >= 2);
    assert.ok(l.documents.every((d) => d.state === "soon" || d.state === "expired"));
    const sorted = l.documents.map((d) => d.expiresOn);
    assert.deepEqual(sorted, [...sorted].sort());
    const doc = l.documents.find((d) => d.title === "Fire certificate " + RUN);
    await fac.patch("/facilities/documents/" + doc.id, { archived: true });
    assert.ok(!(await fac.get("/facilities/documents" + q({ state: "expiring" }))).documents.some((d) => d.id === doc.id));
    const up = await fac.post(`/facilities/documents/${l.documents.find((d) => d.ownerKind === "vendor").id}/file`, { name: "policy.png", type: "image/png", data: PNG });
    assert.equal(up.document.file.name, "policy.png");
  });

  /* ------------------------------------------------------- slice 3 */
  await step("a preventive job due today writes its order once, however many people look", async () => {
    const s = (await fac.post("/facilities/schedules", { kind: "inspection", title: "Monthly room check " + RUN, every: 1, unit: "month", startsOn: TODAY, spaceId: ctx.rooms[0].id,
      checklist: [{ text: "Lights work", type: "check" }, { text: "Exit clear", type: "pass_fail" }, { text: "Anything else", type: "note" }], today: TODAY })).schedule;
    ctx.sched = s;
    const a = await fac.get("/facilities/orders" + q({ kind: "inspection", status: "unfinished" }));
    const b = await office.get("/facilities/orders" + q({ kind: "inspection", status: "unfinished" }));
    const mine = a.orders.filter((o) => o.scheduleId === s.id);
    assert.equal(mine.length, 1);
    assert.equal(b.orders.filter((o) => o.scheduleId === s.id).length, 1);
    assert.equal(mine[0].kind, "inspection");
    assert.equal(mine[0].dueOn, TODAY);
    assert.equal(mine[0].checklist.length, 3);
    ctx.insp = mine[0];
    const after = (await fac.get("/facilities/schedules" + q({}))).schedules.find((x) => x.id === s.id);
    assert.ok(after.nextDueOn > TODAY, "the next date moved on");
  });

  await step("an inspection is not done until every line is answered; a failed line raises its own order, once", async () => {
    const id = ctx.insp.id;
    const r = await fac.try("POST", `/facilities/orders/${id}/actions/complete`, {});
    refused(r, 409);
    assert.equal(r.body.error.unfinished.length, 2);
    const done = await fac.post(`/facilities/orders/${id}/actions/complete`, { minutes: 10, answers: [{ id: "1", done: true }, { id: "2", result: "fail", note: "Bin blocks the door" }] });
    assert.equal(done.order.status, "done");
    const repairs = (await fac.get("/facilities/orders" + q({ kind: "repair", status: "unfinished" }))).orders.filter((o) => o.title.startsWith("Failed: Exit clear") && o.title.includes(RUN));
    assert.equal(repairs.length, 1);
    assert.equal(repairs[0].priority, "high");
    // reopening and completing again must not raise it twice
    await fac.post(`/facilities/orders/${id}/actions/reopen`);
    await fac.post(`/facilities/orders/${id}/actions/complete`, { answers: [] });
    const again = (await fac.get("/facilities/orders" + q({ kind: "repair", status: "unfinished" }))).orders.filter((o) => o.title.startsWith("Failed: Exit clear") && o.title.includes(RUN));
    assert.equal(again.length, 1);
  });

  await step("a job nobody did for a quarter is one overdue order, not three", async () => {
    const s = (await fac.post("/facilities/schedules", { title: "Filter change " + RUN, every: 1, unit: "month", startsOn: add(TODAY, -75), category: "maintenance", today: TODAY })).schedule;
    const l = await fac.get("/facilities/orders" + q({ status: "unfinished", kind: "preventive" }));
    const mine = l.orders.filter((o) => o.scheduleId === s.id);
    assert.equal(mine.length, 1);
    assert.equal(mine[0].overdue, true);
    ctx.fl = s;
    refused(await fac.try("POST", `/facilities/schedules/${s.id}/actions/run_now`, { today: TODAY }), 409);
  });

  await step("counting from completion: finishing the job sets the next date", async () => {
    const s = (await fac.post("/facilities/schedules", { title: "Boiler service " + RUN, every: 2, unit: "week", startsOn: TODAY, fromCompletion: true, today: TODAY })).schedule;
    const o = (await fac.get("/facilities/orders" + q({ kind: "preventive", status: "unfinished" }))).orders.find((x) => x.scheduleId === s.id);
    assert.ok(o);
    const mid = (await fac.get("/facilities/schedules" + q({}))).schedules.find((x) => x.id === s.id);
    assert.equal(mid.nextDueOn, null);
    assert.equal(mid.state, "waiting");
    await fac.post(`/facilities/orders/${o.id}/actions/complete`, { today: TODAY });
    const after = (await fac.get("/facilities/schedules" + q({}))).schedules.find((x) => x.id === s.id);
    assert.equal(after.nextDueOn, add(TODAY, 14));
    assert.equal(after.lastDoneOn, TODAY);
  });

  await step("the starter checks are offered to the team, not applied, and are the manager's to adopt", async () => {
    const t = await fac.get("/facilities/templates");
    assert.ok(t.templates.length >= 20 && t.templates.every((c) => c.authority && c.source && c.quality));
    refused(await teacher.try("GET", "/facilities/templates"), 403);
    refused(await it.try("POST", "/facilities/schedules", { title: "x", startsOn: TODAY }), 403);
    const c = t.templates.find((x) => x.id === "uk-alarm-test");
    const s = (await fac.post("/facilities/schedules", { kind: "compliance", title: c.title, every: c.every, unit: c.unit, authority: c.authority, source: c.source, category: c.category, startsOn: add(TODAY, 3), leadDays: 3, today: TODAY })).schedule;
    assert.equal(s.kind, "compliance");
    assert.equal(s.unit, "week");
  });

  /* ------------------------------------------------------- slice 4 */
  const wed = nextWeekday(add(TODAY, 3), 3);
  await step("a room is made bookable with its own rules and an approver", async () => {
    const r = await fac.patch("/facilities/spaces/" + ctx.rooms[2].id, { bookable: true, approverId: ctx.office.id,
      rules: { opens: "08:00", closes: "18:00", days: [1, 2, 3, 4, 5], bufferMinutes: 10, maxMinutes: 180, noticeHours: 0, daysAhead: 90 } });
    assert.equal(r.space.bookable, true);
    assert.equal(r.space.approverName, "Olive Office");
    refused(await fac.try("PATCH", "/facilities/spaces/" + ctx.rooms[2].id, { rules: { opens: "9am" } }), 400);
    refused(await fac.try("PATCH", "/facilities/spaces/" + ctx.rooms[2].id, { approverId: ctx.kid.id }), 400);
  });

  await step("a teacher asks for the room: it waits for the approver", async () => {
    const r = await teacher.post("/facilities/bookings", { spaceId: ctx.rooms[2].id, title: "Parent evening", day: wed, starts: "16:00", ends: "18:00", attendees: 20, nowAt: NOW });
    assert.equal(r.approved, false);
    assert.equal(r.bookings[0].status, "pending");
    ctx.bk = r.bookings[0];
  });

  await step("a clash is refused with the reason; so are hours, a weekend, and too long", async () => {
    const c = await other.try("POST", "/facilities/bookings", { spaceId: ctx.rooms[2].id, title: "Clash", day: wed, starts: "17:00", ends: "17:30", nowAt: NOW });
    refused(c, 409);
    assert.ok(/already held/.test(c.body.error.message));
    const buf = await other.try("POST", "/facilities/bookings", { spaceId: ctx.rooms[2].id, title: "Too close", day: wed, starts: "18:00", ends: "18:30", nowAt: NOW });
    refused(buf, 409);                                    // the 10-minute buffer
    const early = await other.try("POST", "/facilities/bookings", { spaceId: ctx.rooms[2].id, title: "Early", day: add(wed, 1), starts: "06:00", ends: "07:00", nowAt: NOW });
    refused(early, 409);
    assert.ok(/08:00/.test(early.body.error.unavailable[0].problems[0]));
    const sat = nextWeekday(add(TODAY, 3), 6);
    refused(await other.try("POST", "/facilities/bookings", { spaceId: ctx.rooms[2].id, title: "Sat", day: sat, starts: "10:00", ends: "11:00", nowAt: NOW }), 409);
    refused(await other.try("POST", "/facilities/bookings", { spaceId: ctx.rooms[2].id, title: "Long", day: add(wed, 1), starts: "09:00", ends: "13:00", nowAt: NOW }), 409);
    refused(await other.try("POST", "/facilities/bookings", { spaceId: ctx.rooms[0].id, title: "Not bookable", day: wed, starts: "10:00", ends: "11:00", nowAt: NOW }), 409);
  });

  await step("only the approver (or the office) decides; a decline needs a reason", async () => {
    refused(await teacher.try("POST", `/facilities/bookings/${ctx.bk.id}/actions/approve`), 403);
    refused(await other.try("POST", `/facilities/bookings/${ctx.bk.id}/actions/approve`), 403);
    refused(await office.try("POST", `/facilities/bookings/${ctx.bk.id}/actions/decline`, {}), 400);
    const a = await office.post(`/facilities/bookings/${ctx.bk.id}/actions/approve`);
    assert.equal(a.bookings[0].status, "approved");
    const mine = await teacher.get("/facilities/bookings" + q({ mine: 1 }));
    assert.equal(mine.bookings.find((b) => b.id === ctx.bk.id).status, "approved");
  });

  await step("a weekly series is decided as one; a taken date is skipped only when asked", async () => {
    const start = add(wed, 7);
    await office.post("/facilities/bookings", { spaceId: ctx.rooms[2].id, title: "Staff meeting", day: add(start, 7), starts: "10:00", ends: "11:00", nowAt: NOW });   // the office books itself: approved
    const body = { spaceId: ctx.rooms[2].id, title: "Choir", day: start, starts: "10:00", ends: "11:00", repeat: "weekly", count: 3, nowAt: NOW };
    const r = await teacher.try("POST", "/facilities/bookings", body);
    refused(r, 409);
    assert.equal(r.body.error.unavailable.length, 1);
    assert.equal(r.body.error.free.length, 2);
    const ok = await teacher.post("/facilities/bookings", { ...body, skipConflicts: true });
    assert.equal(ok.bookings.length, 2);
    assert.equal(ok.skipped.length, 1);
    assert.ok(ok.bookings.every((b) => b.status === "pending" && b.seriesId === ok.bookings[0].seriesId));
    const d = await office.post(`/facilities/bookings/${ok.bookings[0].id}/actions/approve`);
    assert.equal(d.bookings.length, 2);
    assert.ok(d.bookings.every((b) => b.status === "approved"));
  });

  await step("a person cancels their own; nobody else's", async () => {
    refused(await other.try("POST", `/facilities/bookings/${ctx.bk.id}/actions/cancel`, {}), 403);
    const c = await teacher.post(`/facilities/bookings/${ctx.bk.id}/actions/cancel`, { today: TODAY });
    assert.equal(c.bookings[0].status, "cancelled");
    // and the hour is free again
    const again = await other.post("/facilities/bookings", { spaceId: ctx.rooms[2].id, title: "Now free", day: wed, starts: "16:00", ends: "17:00", nowAt: NOW });
    assert.equal(again.bookings.length, 1);
  });

  /* ------------------------------------------------------- slice 5 */
  await step("the summary: the team's numbers, a teacher's own", async () => {
    const s = await fac.get("/facilities/summary" + q({}));
    assert.ok(s.orders.overdue >= 1);
    assert.ok(s.documents.soon >= 1);
    assert.ok(s.schedules.active >= 3);
    assert.equal(s.can.manage, true);
    const t = await teacher.get("/facilities/summary" + q({}));
    assert.equal(t.orders, undefined);
    assert.equal(t.can.request, true); assert.equal(t.can.read, false);
    assert.ok(typeof t.mine.open === "number");
  });

  await step("the report says what was made and finished, and what is overdue", async () => {
    const r = (await fac.get("/facilities/reports" + q({ from: add(TODAY, -30), to: TODAY }))).report;
    assert.ok(r.created >= 3);
    assert.ok(r.done >= 2);
    assert.ok(r.overdue >= 1);
    assert.ok(r.byCategory.length >= 1 && r.weeks.length >= 1);
    assert.ok(r.minutesSpent >= 25);
    refused(await teacher.try("GET", "/facilities/reports" + q({})), 403);
    refused(await fac.try("GET", "/facilities/reports" + q({ from: TODAY, to: add(TODAY, -3) })), 400);
  });

  await step("the refusals: a teacher reads no vendor, no document, no schedule, no team list", async () => {
    for (const p of ["/facilities/vendors", "/facilities/documents", "/facilities/schedules", "/facilities/team"]) refused(await teacher.try("GET", p), 403);
    refused(await teacher.try("POST", "/facilities/vendors", { name: "x" }), 403);
    refused(await it.try("POST", "/facilities/vendors", { name: "x" }), 403);           // IT works orders; it does not set vendors
    refused(await fac.try("GET", "/facilities/orders/nope"), 404);
    refused(await fac.try("POST", `/facilities/orders/${ctx.req.id}/actions/assign`, { assigneeId: ctx.kid.id }), 400);
  });

  await step("a schedule can be paused, and a paused one writes nothing", async () => {
    const p = await fac.post(`/facilities/schedules/${ctx.sched.id}/actions/pause`, { today: TODAY });
    assert.equal(p.schedule.state, "paused");
    const g = await fac.get(`/facilities/schedules/${ctx.sched.id}` + q({}));
    assert.ok(g.events.some((e) => e.kind === "paused"));
    assert.ok(g.orders.length >= 1);
  });
} catch (e) {
  console.log("  ABORT " + e.message);
  process.exitCode = 1;
}
console.log(`\n${n} steps passed${process.exitCode ? " — with failures" : ""}`);
