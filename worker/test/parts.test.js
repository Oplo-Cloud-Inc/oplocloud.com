/* The parts of the agent with no model in them: time, rules, web pages, the bar
   for speaking first, sign-in, and the shape of what is kept. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as sched from "../agent/schedule.js";
import { decide } from "../agent/policy.js";
import * as web from "../agent/web.js";
import * as gate from "../agent/notify.js";
import * as auth from "../agent/auth.js";
import { NORM, settings, slim } from "../agent/kinds.js";
import { Invalid, cardish } from "../agent/util.js";
import { Store } from "../agent/db.js";
import { sqlite, page } from "./helpers.js";

const NY = "America/New_York";

/* ---------------------------------------------------------------- schedule */

test("schedule: a wall-clock time stays the same across a clock change", () => {
  const before = sched.nextRun({ kind: "daily", time: "08:00" }, Date.UTC(2026, 2, 6, 20, 0), NY);   // Fri 6 Mar 15:00 New York; the clocks go forward in the early hours of Sunday
  const after = sched.nextRun({ kind: "daily", time: "08:00" }, before, NY);
  assert.equal(sched.parts(before, NY).h, 8);
  assert.equal(sched.parts(after, NY).h, 8);
  assert.equal(after - before, 23 * 3_600_000, "the day the clocks go forward has 23 hours");
});

test("schedule: daily on chosen days skips the others, and every counts from now", () => {
  const sun = Date.UTC(2026, 10, 1, 12, 0);                                      // Sunday noon UTC
  const mon = sched.nextRun({ kind: "daily", time: "09:00", days: [1, 3] }, sun, "UTC");
  assert.equal(new Date(mon).getUTCDay(), 1);
  assert.equal(sched.nextRun({ kind: "every", hours: 6 }, sun, "UTC"), sun + 6 * 3_600_000);
  assert.equal(sched.nextRun({ kind: "once", at: sun - 1 }, sun, "UTC"), null);
});

test("schedule: what cannot be scheduled says why", () => {
  const now = Date.UTC(2026, 10, 1, 9, 0);
  assert.throws(() => sched.validate({ kind: "once", at: "2026-11-01T09:00" }, "UTC", now), /future/);
  assert.throws(() => sched.validate({ kind: "every", hours: 0 }, "UTC", now), /1 to 168/);
  assert.throws(() => sched.validate({ kind: "daily", time: "25:00" }, "UTC", now), /HH:MM/);
  assert.throws(() => sched.validate(null, "UTC", now), Invalid);
  assert.deepEqual(sched.validate({ kind: "once", at: "2026-11-02T09:00" }, NY, now), { kind: "once", at: Date.UTC(2026, 10, 2, 14, 0) });
  assert.deepEqual(sched.validate({ kind: "daily", time: "08:00", days: [1, 2, 3, 4, 5, 6, 0] }, "UTC", now), { kind: "daily", time: "08:00" });
  assert.equal(sched.describe({ kind: "daily", time: "08:00", days: [1, 2, 3, 4, 5] }), "Weekdays at 08:00");
  assert.equal(sched.describe({ kind: "every", hours: 6 }), "Every 6 hours");
});

/* ------------------------------------------------------------------ policy */

test("policy: defaults allow the harmless, ask before what lasts, and never run an unknown tool", () => {
  assert.equal(decide("goal", {}, {}).effect, "allow");
  assert.equal(decide("schedule", { mode: "remind" }, {}).effect, "allow");
  assert.equal(decide("schedule", { mode: "run" }, {}).effect, "ask");
  assert.equal(decide("handoff", {}, {}).effect, "ask");
  assert.equal(decide("remember", {}, { learning: true }).effect, "allow");
  assert.equal(decide("remember", {}, { learning: false }).effect, "ask");
  assert.equal(decide("remember", {}, { learning: true, background: true }).effect, "ask");
  assert.equal(decide("ask", {}, {}).effect, "allow");
  assert.equal(decide("rm_rf", {}, {}).effect, "block");
});

test("policy: a rule overrides the default, the strictest rule wins, and a website narrows it", () => {
  const rules = [{ capability: "routine.create", effect: "allow" }];
  assert.equal(decide("schedule", { mode: "run" }, { rules }).effect, "allow");
  assert.equal(decide("schedule", { mode: "run" }, { rules: [...rules, { capability: "routine.create", effect: "block" }] }).effect, "block");
  const site = [{ capability: "web.read", effect: "block", domain: "example.com" }];
  assert.equal(decide("read_page", { url: "https://www.example.com/a" }, { rules: site }).effect, "block");
  assert.equal(decide("read_page", { url: "https://notexample.com/a" }, { rules: site }).effect, "allow");
  assert.equal(decide("read_page", { url: "https://example.com" }, { rules: [{ capability: "web.read", effect: "block", domain: "example.com", state: "removed" }] }).effect, "allow");
});

test("policy: a run that read something it did not write cannot start or keep anything without a yes, whatever the rules say", () => {
  const rules = [{ capability: "routine.create", effect: "allow" }, { capability: "memory.write", effect: "allow" }];
  for (const [tool, input] of [["schedule", { mode: "run" }], ["remember", {}], ["handoff", {}], ["specialty", {}], ["routine", {}]]) {
    assert.equal(decide(tool, input, { rules, tainted: true }).effect, "ask", tool);
  }
  assert.equal(decide("goal", {}, { tainted: true }).effect, "allow", "keeping a goal changes nothing that lasts on its own");
});

/* --------------------------------------------------------------------- web */

test("web: only public http(s) sites are read", () => {
  for (const bad of ["http://localhost/", "http://127.0.0.1/", "https://10.0.0.1/x", "https://intranet/", "https://router.local/", "https://user:pw@example.com/", "https://example.com:8080/", "ftp://example.com/", "https://[::1]/", "file:///etc/passwd", "nonsense"]) {
    assert.throws(() => web.check(bad), Invalid, bad);
  }
  assert.equal(web.check("https://Example.com/a?b=1").hostname, "example.com");
  assert.equal(web.check("http://example.com:80/").port, "");
});

test("web: a page comes back as the text a person would read", () => {
  const { title, text } = web.readable(`<html><head><title>A &amp; B</title><style>p{}</style></head><body><script>alert(1)</script><h1>Hello</h1><p>One<br>two &nbsp;three</p><ul><li>a</li><li>b</li></ul><!-- hidden --></body></html>`);
  assert.equal(title, "A & B");
  assert.ok(!/alert|hidden|p\{\}/.test(text), text);
  assert.match(text, /Hello\n+One\ntwo three/);
  assert.match(text, /- a\n- b/);
});

test("web: a redirect to a private address is refused, and so are non-text files and failures", async () => {
  const redirect = async () => new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest" } });
  await assert.rejects(web.fetchPage("https://example.com/", { fetcher: redirect }), /public websites/);
  await assert.rejects(web.fetchPage("https://example.com/", { fetcher: async () => page("%PDF", { type: "application/pdf" }) }), /pages of text/);
  await assert.rejects(web.fetchPage("https://example.com/", { fetcher: async () => page("no", { status: 404 }) }), /404/);
  await assert.rejects(web.fetchPage("https://example.com/", { fetcher: async () => { throw new Error("down"); } }), /could not be reached/);
  const ok = await web.fetchPage("https://example.com/", { fetcher: async () => page(`<title>T</title><p>${"word ".repeat(5000)}</p>`) });
  assert.equal(ok.title, "T");
  assert.equal(ok.text.length, 12_000);
  assert.ok(ok.truncated);
  assert.match(ok.hash, /^[0-9a-f]{64}$/);
});

/* ------------------------------------------------------------------ notify */

test("notify: the bar is the person's setting, a repeat is held, and a reason is always given", async () => {
  const base = { text: "The price dropped.", level: "balanced" };
  assert.equal((await gate.decide({ ...base, importance: 1 })).post, false);
  const ok = await gate.decide({ ...base, importance: 2 });
  assert.equal(ok.post, true);
  assert.equal((await gate.decide({ ...base, importance: 2, recent: [ok.hash] })).post, false);
  assert.equal((await gate.decide({ ...base, importance: 2, today: 5 })).post, false, "five a day is the most at Balanced");
  assert.equal((await gate.decide({ ...base, importance: 3, today: 5 })).post, true, "what needs you always gets through");
  assert.equal((await gate.decide({ ...base, importance: 1, level: "active" })).post, true);
  assert.match((await gate.decide({ ...base, importance: 1 })).why, /Balanced/);
});

test("notify: quiet hours remove the pop-up but not the message, unless it needs you", async () => {
  assert.ok(gate.inQuiet({ from: "22:00", to: "08:00" }, 23, 0));
  assert.ok(gate.inQuiet({ from: "22:00", to: "08:00" }, 7, 59));
  assert.ok(!gate.inQuiet({ from: "22:00", to: "08:00" }, 8, 0));
  assert.ok(!gate.inQuiet(null, 3, 0));
  const q = await gate.decide({ importance: 2, text: "Fine.", quiet: true });
  assert.deepEqual([q.post, q.toast], [true, false]);
  assert.equal((await gate.decide({ importance: 3, text: "Urgent.", quiet: true })).toast, true);
});

/* -------------------------------------------------------------------- auth */

test("auth: a code names an account, the cookie proves it, and removing the code locks it out", async () => {
  const env = { ROXAN_INVITE: "alpha, beta" };
  const acct = await auth.accountFor("beta", env);
  assert.match(acct, /^[0-9a-f]{32}$/);
  assert.equal(await auth.accountFor("gamma", env), null);
  assert.equal(await auth.accountFor("", env), null);
  assert.notEqual(acct, await auth.accountFor("alpha", env));

  const req = c => new Request("https://roxan.oplocloud.com/api/state", { headers: { cookie: c } });
  const value = await auth.token(acct, env);
  assert.equal(await auth.who(req(`${auth.COOKIE}=${value}`), env), acct);
  assert.equal(await auth.who(req(`x=1; ${auth.COOKIE}=${value}`), env), acct);
  assert.equal(await auth.who(req(`${auth.COOKIE}=${value.slice(0, -2)}xx`), env), null, "tampered");
  assert.equal(await auth.who(req(`${auth.COOKIE}=${value}`), env, Date.now() + 29 * 86_400_000), null, "expired after four weeks");
  assert.equal(await auth.who(req(`${auth.COOKIE}=${value}`), { ROXAN_INVITE: "alpha" }), null, "its code was removed");
  assert.equal(await auth.who(new Request("https://x.test/api"), env), null);

  const c = auth.cookie("v", new Request("https://roxan.oplocloud.com/"));
  assert.match(c, /HttpOnly/); assert.match(c, /SameSite=Strict/); assert.match(c, /Secure/); assert.match(c, /Path=\/api/);
  assert.doesNotMatch(auth.cookie("v", new Request("http://127.0.0.1:8130/")), /Secure/);
  assert.match(auth.cookie("", new Request("https://x.test/")), /Max-Age=0/);
});

/* ------------------------------------------------------------------- kinds */

const x = () => ({ store: new Store(sqlite()), tz: "UTC", now: Date.UTC(2026, 10, 1, 9, 0) });

test("kinds: a plan keeps what is done, and a step number marks one done", () => {
  const first = NORM.goal({ title: "Run 5k", steps: ["Buy shoes", "Run twice"], done: [1] }, null, x());
  assert.deepEqual(first.data.steps, [{ text: "Buy shoes", done: true }, { text: "Run twice", done: false }]);
  const cur = { ...first, steps: first.data.steps, state: "active" };
  const next = NORM.goal({ steps: ["Buy shoes", "Run twice", "Run a 5k"] }, cur, x());
  assert.deepEqual(next.data.steps.map(s => s.done), [true, false, false]);
  assert.throws(() => NORM.goal({}, null, x()), /title/i);
});

test("kinds: nothing that looks like a card number is kept, anywhere", () => {
  for (const [kind, input] of [["memory", { text: "My card is 4242 4242 4242 4242" }], ["goal", { title: "Pay with 4242424242424242" }], ["handoff", { title: "Buy", task: "use 4242 4242 4242 4242" }], ["panel", { title: "x", text: "4242 4242 4242 4242" }]]) {
    assert.throws(() => NORM[kind](input, null, x()), /card number/, kind);
  }
  assert.ok(cardish("4242 4242 4242 4242"));
});

test("kinds: a routine says what it needs, watching repeats, and a resumed routine is due again", () => {
  assert.throws(() => NORM.routine({ title: "x", mode: "run", when: { kind: "daily", time: "08:00" } }, null, x()), /instruction/);
  assert.throws(() => NORM.routine({ title: "x", mode: "watch", instruction: "tell me", url: "https://example.com", when: { kind: "once", at: Date.UTC(2026, 10, 3) } }, null, x()), /repeats/);
  assert.throws(() => NORM.routine({ title: "x", mode: "watch", instruction: "tell me", url: "http://localhost", when: { kind: "every", hours: 6 } }, null, x()), /public websites/);
  const n = NORM.routine({ title: "Morning", mode: "run", instruction: "check", when: { kind: "daily", time: "08:00" } }, null, x());
  assert.equal(n.due, Date.UTC(2026, 10, 2, 8, 0));
  const paused = NORM.routine({ state: "paused" }, { ...n, ...n.data, id: "r1" }, x());
  assert.equal(paused.due, null);
  const back = NORM.routine({ state: "active" }, { ...n, ...n.data, id: "r1", state: "paused", due: null }, x());
  assert.equal(back.due, Date.UTC(2026, 10, 2, 8, 0));
});

test("kinds: a table is cleaned to its columns, a rule can be narrowed only where it makes sense", () => {
  const t = NORM.panel({ title: "T", type: "table", columns: ["A", "B"], rows: [["1", "2", "3"], ["4"], "bad"] }, null, x());
  assert.deepEqual(t.data.rows, [["1", "2"], ["4", ""], ["", ""]]);
  assert.deepEqual(NORM.rule({ capability: "web.read", effect: "block", domain: "https://www.Example.com/path" }, null, x()).data, { capability: "web.read", effect: "block", domain: "www.example.com" });
  assert.throws(() => NORM.rule({ capability: "goal.write", effect: "block", domain: "example.com" }, null, x()), /web pages/);
  assert.throws(() => NORM.rule({ capability: "nope", effect: "block" }, null, x()), Invalid);
  assert.equal(slim({ kind: "panel", type: "document", body: "abc", id: "p" }).size, 3);
});

test("kinds: settings are checked one at a time", () => {
  const cur = { name: "Roxan", tone: "direct", tz: "UTC" };
  assert.equal(settings({ name: "  Juno  " }, cur).name, "Juno");
  assert.throws(() => settings({ tone: "rude" }, cur), /direct, warm or formal/);
  assert.throws(() => settings({ tz: "Mars/Base" }, cur), /time zone/);
  assert.throws(() => settings({ quiet: { from: "22", to: "08:00" } }, cur), /HH:MM/);
  assert.equal(settings({ quiet: null }, { ...cur, quiet: { from: "22:00", to: "08:00" } }).quiet, null);
});

/* ------------------------------------------------------------------- store */

test("store: items merge their data, messages read oldest first, and the log keeps what happened", () => {
  let now = 1000;
  const s = new Store(sqlite(), () => ++now);
  const g = s.add("goal", { title: "G", data: { steps: [1], a: 1 } });
  assert.match(g.id, /^g_/);
  const p = s.patch(g.id, { data: { b: 2 }, state: "done" });
  assert.deepEqual([p.a, p.b, p.state, p.title], [1, 2, "done", "G"]);
  assert.equal(s.patch(g.id, { due: 5 }).due, 5);
  assert.equal(s.patch(g.id, { due: null }).due, null);
  for (const t of ["one", "two", "three"]) s.say({ thread: "t", role: "user", text: t });
  assert.deepEqual(s.messages("t", { limit: 2 }).map(m => m.text), ["two", "three"]);
  assert.deepEqual(s.messages("t", { before: s.messages("t").at(-1).id }).map(m => m.text), ["one", "two"]);
  s.add("routine", { title: "R", state: "active", due: 50 });
  s.add("approval", { title: "A", state: "awaiting", due: 20 });
  assert.equal(s.nextDue(), 20);
  assert.equal(s.nextDue(false), 20);
  s.log("run", "did a thing", { ref: "x" });
  assert.equal(s.events()[0].text, "did a thing");
  s.wipe();
  assert.equal(s.list("goal").length + s.events().length, 0);
});
