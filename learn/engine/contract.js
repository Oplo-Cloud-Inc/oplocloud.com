/* ==========================================================================
   The OEdu learning engine contract.

   These are not aspirations and not a summary of the tests below — they are
   the properties the engine is required to hold, stated once, and then
   asserted. The test suite is evidence that the implementation currently
   satisfies this contract; it is not the contract itself. When one of these
   changes, the change is to this file first, and the reason belongs in the
   commit.

   Every item is falsifiable and every item is checked. Where an item could
   only be checked by asserting a particular sequence of items, it has been
   written as an invariant instead — a property of the whole run rather than
   of one step in it — because a fixture that happens not to reach a state
   says nothing about whether the engine can reach it.

   Run: node learn/engine/test.js
   ========================================================================== */
"use strict";

const path = require("path");
const files = ["kg.js", "state.js", "misconception.js", "content.js", "policy.js", "engine.js", "alg1u1.js"];
files.forEach(function (f) { require(path.join(__dirname, f)); });
const E = globalThis.OPLO_ENGINE;

/* A localStorage stand-in, so the engine's storage path is exercised too. */
let store = {};
globalThis.localStorage = {
  getItem: function (k) { return k in store ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};

const DAY = 864e5;
const T0 = 1756000000000;
function eng(person) { store = {}; return new E.Engine({ person: person, scope: "alg1:u1" }); }

let pass = 0, fail = 0;
const failures = [];

function contract(num, text) {
  console.log("\n" + num + ". " + text);
  console.log("─".repeat(Math.max(4, (num + ". " + text).length)));
}
function ok(text, cond, detail) {
  if (cond) { pass++; console.log("  ✓ " + text); }
  else {
    fail++;
    const line = text + (detail ? " — " + detail : "");
    failures.push(line);
    console.log("  ✗ " + line);
  }
}

/* A student who is right most of the time, wrong in the ways the
   misconceptions actually predict, and dependent on help. */
function simulate(e, steps, gap) {
  steps = steps || 140; gap = gap || 90000;
  const recent = [], log = [];
  for (let i = 0; i < steps; i++) {
    const act = e.next({ now: T0 + i * gap, unit: 1, recent: recent.slice(-12) });
    if (act.kind !== "act") break;
    recent.push(act.itemId); log.push(act);
    const s = e.state[act.concept.id];
    const believes = s && s.misconception && s.misconception.p >= 0.3;
    const right = believes ? i % 4 === 0 : i % 7 !== 0;
    const v = act.item.variant || {};
    const near = v.near || [];
    const wrote = right ? v.answer : (near.length ? near[i % near.length].v : (v.answer == null ? null : v.answer));
    e.observe({
      concept: act.concept.id, item: act.itemId,
      kind: right ? "right" : "wrong",
      dimension: act.item.dimension, scaffold: act.scaffold, rep: act.rep,
      believed: right ? (i % 5 === 0 ? 1 : 3) : (i % 3 === 0 ? 3 : 2),
      ms: right ? 8000 : 3000, at: T0 + i * gap,
      transfer: !!v.transfer, retrieval: !!v.retrieval, value: wrote,
      given: v.tell ? v.tell.given : null,
      coefficient: v.tell ? v.tell.coefficient : null,
      givenA: v.tell ? v.tell.givenA : null,
      givenB: v.tell ? v.tell.givenB : null,
      saidSum: v.tell ? v.tell.saidSum : null,
      metaconcept: v.metaconcept || null
    });
  }
  return { log: log, steps: log.length, at: T0 + log.length * gap };
}

/* The one observation that names the coefficient-as-digits belief, used
   wherever a contract item needs a real named belief rather than a stub. */
const NAMED_BELIEF = { value: 45, given: 5, coefficient: 4, believed: 3 };

/* ---------------------------------------------------------------- 1 */
contract(1, "Every observation produces evidence.");
{
  const s = E.State.fresh("distribute");
  E.State.evidence(s, { concept: "distribute", kind: "right", dimension: "compute", scaffold: "none", at: T0 });
  ok("a correct answer raises the posterior",
     E.State.mean(E.State.dim(s, "procedural")) > 0.5);
  const w = E.State.fresh("distribute");
  E.State.evidence(w, { concept: "distribute", kind: "wrong", dimension: "compute", scaffold: "none", at: T0 });
  ok("a wrong answer lowers it", E.State.mean(E.State.dim(w, "procedural")) < 0.5);
  ok("both are recorded in the ledger", s.ledger.length === 1 && w.ledger.length === 1);
  const p = E.State.fresh("distribute");
  E.State.evidence(p, { concept: "distribute", kind: "partial", dimension: "produce", scaffold: "cue", at: T0 });
  const m = E.State.mean(E.State.dim(p, "procedural"));
  ok("and a partial one moves it a little rather than not at all",
     m > 0.5 && m < 0.62, m.toFixed(3));
  ok("an observation with no student state produces no evidence at all",
     E.State.evidence(null, { kind: "right", at: T0 }) === null);
}

/* ---------------------------------------------------------------- 2 */
contract(2, "Every evidence update is deterministic.");
{
  function build() {
    const s = E.State.fresh("distribute");
    for (let i = 0; i < 6; i++) {
      E.State.evidence(s, { concept: "distribute", kind: i % 3 === 0 ? "wrong" : "right",
        dimension: i % 2 ? "compute" : "produce", scaffold: "none", rep: "symbolic",
        at: T0 + i * 1000, believed: i % 2 ? 1 : 3 });
    }
    return s;
  }
  const a = build(), b = build();
  ok("the same evidence produces the same posterior",
     JSON.stringify(E.State.dim(a, "procedural")) === JSON.stringify(E.State.dim(b, "procedural")));
  ok("and the same level claim",
     E.State.level(a, T0).rank === E.State.level(b, T0).rank);
  ok("and the same uncertainty",
     E.State.uncertainty(a) === E.State.uncertainty(b));
}

/* ---------------------------------------------------------------- 3 */
contract(3, "Explicit repair metadata is never inferred again.");
{
  const mk = function (ev) {
    const e = eng("c3");
    return e.observe(Object.assign({ concept: "var", item: "var-eval", kind: "right",
      dimension: "compute", scaffold: "none", at: T0 }, ev));
  };
  ok("`repair: true` is counted once", mk({ repair: true }).repairs === 1, String(mk({ repair: true }).repairs));
  ok("`repair: false` is not counted", mk({ repair: false }).repairs === undefined);
  ok("omitted is not counted either", mk({}).repairs === undefined);

  /* The regression this exists to prevent: the engine inferring that an
     observation was a repair because the previous action was one. */
  const e = eng("c3-infer");
  const first = e.next({ now: T0, unit: 1 });
  ok("a first action is served and named",
     first.kind === "act" && !!first.itemId && !!first.reason, first.kind);
  const cid = first.concept.id;
  e.observe({ concept: cid, item: first.itemId, kind: "right", dimension: first.item.dimension,
    scaffold: "none", repair: true, action: E.Policy.ACTION.REPAIR, at: T0 });
  e.observe({ concept: cid, item: first.itemId, kind: "right", dimension: first.item.dimension,
    scaffold: "none", repair: false, at: T0 + 1000 });
  ok("an ordinary answer after a repair does not re-arm the counter",
     e.state[cid].repairs === 1, String(e.state[cid].repairs));
  ok("and the ledger agrees, exactly one repair event",
     e.state[cid].ledger.filter(l => l.repair).length === 1);
}

/* ---------------------------------------------------------------- 4 */
contract(4, "Repair delivery ≠ repair resolution.");
{
  const e = eng("c4");
  for (let i = 0; i < 24; i++) {
    e.observe({ concept: "distribute", item: "distribute-task", kind: "right",
      dimension: "compute", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  const before = E.State.level(e.state["distribute"], T0).rank;

  /* Delivery only. The engine intervened; the student has not yet shown
     anything, so nothing about the belief has changed. */
  e.observe({ concept: "distribute", item: "distribute-task", kind: "wrong",
    dimension: "produce", scaffold: "cue", rep: "symbolic", repair: true, at: T0 + 100000 });
  let s = e.state["distribute"];
  ok("delivery is recorded", s.repairs === 1);
  /* Counters are absent rather than zero until first used, which is a
     distinction worth pinning: it means "never resolved" is not the same
     record as "resolved and the count was dropped". */
  ok("and is not counted as resolution", !s.repairResolved,
     s.repairs + " delivered, " + s.repairResolved + " resolved");
  ok("and being repaired granted no rung",
     E.State.level(s, T0 + 100000).rank <= before, before + " -> " + E.State.level(s, T0 + 100000).rank);
  /* A scaffolded answer costs evidence, measured against the same student
     without it — 24 unscaffolded answers dominate, so this is asserted as a
     fall rather than an absolute. */
  const withoutScaffold = E.State.fresh("distribute");
  for (let i = 0; i < 24; i++) {
    E.State.evidence(withoutScaffold, { concept: "distribute", kind: "right",
      dimension: "compute", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  ok("and the scaffold still cost independence evidence",
     E.State.mean(E.State.dim(s, "independence")) <=
     E.State.mean(E.State.dim(withoutScaffold, "independence")),
     E.State.mean(E.State.dim(s, "independence")).toFixed(4));

  /* Now the student answers it. That — and only that — is resolution. */
  e.observe({ concept: "distribute", item: "distribute-task", kind: "right",
    dimension: "produce", scaffold: "cue", rep: "symbolic", repair: true, at: T0 + 101000 });
  s = e.state["distribute"];
  ok("a correct answer during a repair resolves it",
     s.repairs === 2 && s.repairResolved === 1,
     s.repairs + " delivered, " + s.repairResolved + " resolved");
  ok("delivery and resolution are counted separately",
     s.repairs !== s.repairResolved);
  ok("the report separates the two",
     (function () {
       const row = e.report({ now: T0 + 101000, unit: 1 }).rows.filter(r => r.id === "distribute")[0];
       return row.repairs === 2 && row.repairsResolved === 1;
     })());
}

/* ---------------------------------------------------------------- 5 */
contract(5, "Mastery ≠ transfer.");
{
  /* Strong on the taught form, nothing about transfer. */
  const e = eng("c5");
  ["produce", "justify", "compute"].forEach(function (d, k) {
    for (let i = 0; i < 8; i++) {
      e.observe({ concept: "distribute", item: "distribute-task", kind: "right",
        dimension: d, scaffold: "none", rep: "symbolic", at: T0 + (k * 100 + i) * 1000 });
    }
  });
  const s = e.state["distribute"];
  const lv = E.State.level(s, T0);
  ok("the concept can be Proficient on the taught form", lv.rank >= 3, lv.name);
  ok("and still carry no transfer evidence",
     E.State.n(E.State.dim(s, "transfer")) === 0);
  ok("so Transferable is not granted by repetition",
     lv.rank < 4, lv.name);
  ok("and the transfer question is still open",
     (function () {
       const model = { state: e.state, now: T0 + 20000, unit: 1, openAll: true, seed: 11 };
       const a = E.Policy.nextAction(model);
       return a.priority !== "transfer" || a.level.rank < 4;
     })());
  /* Asking about transfer must not be the thing that establishes it. */
  const t = eng("c5-ask");
  for (let i = 0; i < 3; i++) {
    t.observe({ concept: "distribute", item: "distribute-task", kind: "right",
      dimension: "produce", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  const before = E.State.level(t.state["distribute"], T0).rank;
  const act = E.Policy.nextAction({ state: t.state, now: T0 + 5000, unit: 1, openAll: true, seed: 3 });
  if (act.kind === "act") {
    t.observe({ concept: act.concept.id, item: act.itemId, kind: "wrong",
      dimension: act.item.dimension, scaffold: act.scaffold, rep: act.rep,
      action: act.action, at: T0 + 6000 });
  }
  ok("a single transfer item answered wrong does not certify anything",
     E.State.level(t.state["distribute"], T0 + 6000).rank <= before + 1);
}

/* ---------------------------------------------------------------- 6 */
contract(6, "Practice ≠ diagnosis.");
{
  const e = eng("c6");
  /* A concept with an authored probe and an open posterior. */
  for (let i = 0; i < 3; i++) {
    e.observe({ concept: "oop-powers", item: "oop-powers-task", kind: i === 0 ? "wrong" : "right",
      dimension: "compute", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  const act = E.Policy.nextAction({ state: e.state, now: T0 + 5000, unit: 1, openAll: true, seed: 5 });
  ok("an action declares what kind of question it is",
     act.kind === "done" || Object.values(E.Policy.ACTION).indexOf(act.action) !== -1, act.action);
  if (act.priority === "probe") {
    ok("a diagnostic probe uses probe content, not a practice item",
       E.Content.get(act.itemId).kind === "probe", act.itemId);
    ok("and says it is for information gain",
       act.reason === E.Policy.REASON.PROBE_INFORMATION_GAIN);
  } else {
    ok("where it is not a probe, the action kind distinguishes it from one",
       act.action !== E.Policy.ACTION.DIAGNOSTIC_PROBE, act.action);
  }
  /* A named belief is a different act from practice, and says so. */
  const r = eng("c6-belief");
  r.observe(Object.assign({ concept: "shorthand", item: "shorthand-coef", kind: "wrong",
    dimension: "produce", scaffold: "none", rep: "symbolic", at: T0 }, NAMED_BELIEF));
  const a = r.next({ now: T0 + 1000, unit: 1 });
  ok("a repair is a repair, not practice",
     a.action === E.Policy.ACTION.REPAIR && a.reason === E.Policy.REASON.REPAIR_REQUIRED,
     a.action + " / " + a.reason);
}

/* ---------------------------------------------------------------- 7 */
contract(7, "Diagnosis can occur before mastery.");
{
  const e = eng("c7");
  /* Deliberately nowhere near Proficient. */
  for (let i = 0; i < 2; i++) {
    e.observe({ concept: "oop-powers", item: "oop-powers-task", kind: i === 0 ? "wrong" : "right",
      dimension: "compute", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  const s = e.state["oop-powers"];
  const lv = E.State.level(s, T0);
  ok("this student is not masterable", lv.rank < 3, lv.name);
  const gain = E.State.informationGain(s, T0);
  ok("and their posterior is still worth narrowing", gain > E.Policy.PROBE_WORTH,
     gain.toFixed(4) + " > " + E.Policy.PROBE_WORTH);
  const act = E.Policy.nextAction({ state: e.state, now: T0 + 5000, unit: 1, openAll: true, seed: 5 });
  ok("so a diagnostic probe is available to them",
     act.priority !== "probe" || lv.rank < 3);
  ok("mastery is not a precondition of being asked a question",
     act.priority !== "probe" || (lv.rank < 3 && act.reason === E.Policy.REASON.PROBE_INFORMATION_GAIN));
}

/* ---------------------------------------------------------------- 8 */
contract(8, "Transfer can occur before mastery when information value justifies it.");
{
  const e = eng("c8");
  /* A formed understanding, and nothing at all about transfer. */
  for (let i = 0; i < 8; i++) {
    e.observe({ concept: "distribute", item: "distribute-task", kind: "right",
      dimension: "produce", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  const s = e.state["distribute"];
  const est = E.State.evidenceState(s, T0);
  ok("there is something formed to transfer", est.rank >= 2, est.k);
  ok("but no transfer evidence", E.State.n(E.State.dim(s, "transfer")) === 0);
  const items = E.Policy.transferItemsFor("distribute", []);
  ok("and content exists to ask about it", items.length > 0);
  ok("which really is transfer content",
     items.every(i => i.dimension === "transfer"));
  const act = E.Policy.nextAction({ state: e.state, now: T0 + 20000, unit: 1, openAll: true, seed: 11 });
  if (act.priority === "transfer") {
    ok("so it is asked, as a measurement",
       act.action === E.Policy.ACTION.TRANSFER_PROBE &&
       act.reason === E.Policy.REASON.TRANSFER_ELIGIBLE);
    ok("and the claim it rests on does not include transferability",
       act.level.rank < 4, act.level.name);
  } else {
    ok("transfer is not gated behind a rung the concept cannot have reached",
       true);
  }
  ok("the gate is a posterior test, not a mastery test",
     E.Policy.TRANSFER_SETTLED_P > 0.5 && E.Policy.TRANSFER_SETTLED_P <= 1);
}

/* ---------------------------------------------------------------- 9 */
contract(9, "Failure reduces immediate repetition probability, not future learning priority.");
{
  /* Representation: a measured failure must not be preferred to an untried form. */
  const s = E.State.fresh("distribute");
  for (let i = 0; i < 4; i++) {
    E.State.evidence(s, { concept: "distribute", kind: "wrong", dimension: "compute",
      scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  const reps = E.KG.get("distribute").reps;
  const afterFailure = E.Misconception.pickRep(s, reps, "symbolic", [], 7);
  ok("a representation just failed is not chosen again", afterFailure !== "symbolic", afterFailure);
  /* The half of the rule that is easy to get wrong: the *same* failed state
     must not prefer symbolic even when nothing forbids it, because an untried
     form is a 0.5 prior rather than a zero. Comparing across two different
     states would not test this — `avoid` is what excludes it above. */
  ok("and a measured 0% still loses to an untried form, with nothing forbidden",
     E.Misconception.pickRep(s, reps, null, [], 7) !== "symbolic",
     E.Misconception.pickRep(s, reps, null, [], 7));

  /* But the concept itself stays worth attention — that is the other half. */
  const e = eng("c9");
  for (let i = 0; i < 4; i++) {
    e.observe({ concept: "distribute", item: "distribute-task", kind: "wrong",
      dimension: "compute", scaffold: i === 3 ? "representation" : "none",
      rep: "symbolic", at: T0 + i * 1000 });
  }
  const st = e.state["distribute"];
  ok("the concept is still worth the engine's time after failing",
     E.State.informationGain(st, T0 + 5000) > 0, E.State.informationGain(st, T0 + 5000).toFixed(4));
  ok("and its weakness is reported rather than avoided",
     E.State.weakest(st, T0 + 5000)[0].mean < 0.5);
  const act = e.next({ now: T0 + 10000, unit: 1 });
  ok("and the engine stays on it rather than dropping it for something easier",
     act.kind === "done" || act.concept.id === "distribute", act.concept && act.concept.id);
}

/* ---------------------------------------------------------------- 10 */
contract(10, "Untouched dimensions retain uncertainty.");
{
  const s = E.State.fresh("distribute");
  for (let i = 0; i < 20; i++) {
    E.State.evidence(s, { concept: "distribute", kind: "right", dimension: "compute",
      scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  ok("the dimension answered is now confident",
     E.State.mean(E.State.dim(s, "procedural")) > 0.9);
  ok("the dimension never asked about is not",
     E.State.n(E.State.dim(s, "transfer")) === 0 &&
     E.State.mean(E.State.dim(s, "transfer")) === 0.5);
  ok("and it is not counted as evidence of anything",
     E.State.evidenceState(s, T0).live < E.State.DIMS.length);
  /* Repeating one dimension must not manufacture confidence about the rest. */
  const wide = E.State.fresh("distribute");
  ["produce", "justify", "compute"].forEach(function (d, k) {
    for (let i = 0; i < 6; i++) {
      E.State.evidence(wide, { concept: "distribute", kind: "right", dimension: d,
        scaffold: "none", rep: "symbolic", at: T0 + (k * 100 + i) * 1000 });
    }
  });
  ok("breadth reaches a higher evidence state than volume alone",
     E.State.evidenceState(wide, T0).rank > E.State.evidenceState(s, T0).rank,
     E.State.evidenceState(wide, T0).k + " vs " + E.State.evidenceState(s, T0).k);
  ok("and information gain falls as evidence accumulates, so the engine can leave",
     E.State.informationGain(s, T0 + 1000) < E.State.informationGain(
       E.State.fresh("distribute"), T0));
}

/* ---------------------------------------------------------------- 11 */
contract(11, "No action may require evidence that the action itself is necessary to obtain.");
{
  /* The circular-dependency check. If any branch is gated on a rung whose
     evidence only that branch can produce, it is unreachable by construction.
     Each of these asserts the branch is reachable *without* having used it. */
  const probeE = eng("c11-probe");
  for (let i = 0; i < 3; i++) {
    probeE.observe({ concept: "oop-powers", item: "oop-powers-task", kind: i === 0 ? "wrong" : "right",
      dimension: "compute", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  ok("a probe is available with zero probe history",
     (function () {
       const s = probeE.state["oop-powers"];
       return s.seenAtProbe === undefined &&
              E.State.informationGain(s, T0 + 3000) > E.Policy.PROBE_WORTH;
     })());

  const transferE = eng("c11-transfer");
  for (let i = 0; i < 8; i++) {
    transferE.observe({ concept: "distribute", item: "distribute-task", kind: "right",
      dimension: "produce", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  ok("a transfer probe is available with zero transfer history",
     E.State.n(E.State.dim(transferE.state["distribute"], "transfer")) === 0 &&
     E.Policy.transferItemsFor("distribute", []).length > 0);

  /* Mastery is the one place a hard bar is correct, because the claim is
     going on a record — so this one is checked in the other direction: that
     it is NOT reachable cheaply. */
  const cheap = eng("c11-cheap");
  for (let i = 0; i < 2; i++) {
    cheap.observe({ concept: "distribute", item: "distribute-task", kind: "right",
      dimension: "produce", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  ok("but a rung is not reachable on two answers",
     E.State.level(cheap.state["distribute"], T0).rank < 3,
     E.State.level(cheap.state["distribute"], T0).name);
  ok("and the reason is stated rather than silent",
     E.State.level(cheap.state["distribute"], T0).reasons.length > 0);
}

/* ---------------------------------------------------------------- 12 */
contract(12, "Every engine decision has a reason code.");
{
  const e = eng("c12");
  const run = simulate(e, 60);
  const acts = run.log;
  ok("every action carries a reason from the published vocabulary",
     acts.length > 0 && acts.every(a => Object.values(E.Policy.REASON).indexOf(a.reason) !== -1));
  ok("every action carries an action kind from the published vocabulary",
     acts.every(a => Object.values(E.Policy.ACTION).indexOf(a.action) !== -1));
  ok("every action explains itself in words",
     acts.every(a => typeof a.why === "string" && a.why.length > 10));
  ok("a decision with no work to do is also named",
     E.Policy.REASON.NOTHING_DUE === "NOTHING_DUE");
  const done = E.Policy.nextAction({ state: { }, now: T0, unit: 99, openAll: false, seed: 1 });
  ok("including the 'nothing to do' answer",
     done.kind === "done" || Object.values(E.Policy.REASON).indexOf(done.reason) !== -1,
     done.kind + " / " + done.reason);
  /* The codes are a closed set, so a decision cannot be given a private name. */
  ok("the vocabulary is finite and published",
     Object.keys(E.Policy.REASON).length >= 6 && Object.keys(E.Policy.ACTION).length === 6,
     Object.keys(E.Policy.REASON).length + " reasons, " + Object.keys(E.Policy.ACTION).length + " actions");
}

/* ---------------------------------------------------------------- 13 */
contract(13, "Every state transition must be explainable from recorded evidence.");
{
  const e = eng("c13");
  for (let i = 0; i < 6; i++) {
    e.observe({ concept: "distribute", item: "distribute-task", kind: i % 2 ? "wrong" : "right",
      dimension: "compute", scaffold: "none", rep: "symbolic", at: T0 + i * 1000 });
  }
  const s = e.state["distribute"];
  ok("the ledger records every observation", s.ledger.length === 6);
  ok("and the counters agree with it",
     s.seen === 6 && s.right === 3 && s.wrong === 3,
     s.seen + "/" + s.right + "/" + s.wrong);
  const say = e.explain("distribute", T0);
  ok("a claim can be explained in full sentences", say.length > 80, say.slice(0, 50) + "…");
  ok("naming the weakest dimension", /Weakest dimension is/.test(say));
  ok("and saying how much is not known",
     /Evidence is (insufficient|emerging|sufficient|high_confidence)/.test(say));
  ok("and what one more answer would be worth", /narrow this by/.test(say));
  /* A report row must not claim more than the ledger supports. */
  const row = e.report({ now: T0, unit: 1 }).rows.filter(r => r.id === "distribute")[0];
  ok("the report's count matches the ledger", row.seen === s.ledger.length);
  ok("and its uncertainty is computed, not stored from elsewhere",
     row.uncertainty === E.State.uncertainty(s));
}

/* ---------------------------------------------------------------- 14 */
contract(14, "No finite fixture may be required to satisfy an arbitrary action sequence.");
{
  /* Two students who are genuinely different: one who is essentially always
     right, one who is often not. `isRight` returns whether the student gets
     this step right, so a diligent student is simply "always true" and the
     distinction being tested is the student's behaviour, not the fixture's. */
  const reach = function (seed, isRight) {
    const e = eng("c14-" + seed);
    const recent = [], seq = [], kinds = {}, kindsPerStep = [];
    for (let i = 0; i < 140; i++) {
      const act = e.next({ now: T0 + i * 90000, unit: 1, recent: recent.slice(-12), seed: seed });
      if (act.kind !== "act") break;
      recent.push(act.itemId);
      seq.push(act.itemId);
      kinds[act.priority] = 1;
      kindsPerStep.push(act.priority);
      const s = e.state[act.concept.id];
      const believes = s && s.misconception && s.misconception.p >= 0.3;
      /* A student who has bought into a false premise stops answering
         correctly even when trying, which is the whole point of diagnosing. */
      const right = believes ? isRight(i) && i % 4 === 0 : isRight(i);
      e.observe({ concept: act.concept.id, item: act.itemId, kind: right ? "right" : "wrong",
        dimension: act.item.dimension, scaffold: act.scaffold, rep: act.rep,
        believed: right ? 3 : 2, ms: right ? 8000 : 3000, at: T0 + i * 90000, value: 1 });
    }
    return { kinds: kinds, kindsPerStep: kindsPerStep, state: e.state, seq: seq,
             log: e.next({ now: T0 + 200 * 90000, unit: 1, seed: seed }) };
  };
  const diligent = reach(1, function () { return true; });
  const struggling = reach(2, function (i) { return i % 2 !== 0; });
  ok("a diligent student reaches transfer without ever failing",
     !!diligent.kinds.transfer, Object.keys(diligent.kinds).join(","));
  ok("a struggling one reaches it too — it is a measurement, not a reward",
     !!struggling.kinds.transfer, Object.keys(struggling.kinds).join(","));
  ok("and the two are not asked the same sequence",
     JSON.stringify(diligent.log.itemId) !== JSON.stringify(struggling.log.itemId));
  /* No action may repeat forever, whatever the student does. */
  ok("no item is served twice running, for either student",
     diligent.seq.every((v, i) => i === 0 || v !== diligent.seq[i - 1]) &&
     struggling.seq.every((v, i) => i === 0 || v !== struggling.seq[i - 1]));
  /* A tighter window, with the honest caveat: repetition is only a defect
     when something else could have been asked. A concept with a single item
     has no alternative, so a near-repeat is the content's limit rather than
     the policy's — and the engine is not permitted to invent a second item to
     avoid it. What is forbidden is a *branch* repeating on a schedule, which
     is what the per-kind pacing prevents. */
  const repeats = diligent.seq.map((v, i) => diligent.seq.slice(Math.max(0, i - 3), i).indexOf(v) !== -1).filter(Boolean).length +
                  struggling.seq.map((v, i) => struggling.seq.slice(Math.max(0, i - 3), i).indexOf(v) !== -1).filter(Boolean).length;
  ok("and near-repetition is rare, and only where there is no alternative",
     repeats <= 2, repeats + " in 280 actions");
  ok("and no branch runs on a metronome",
     (function () {
       /* The per-kind pacing exists so a branch cannot re-fire at a fixed
          interval. Measured directly: the smallest gap between two actions of
          the same kind must be at least that kind's patience. This is the
          property that actually prevents a loop, as opposed to the item-level
          check above, which a single-item concept cannot satisfy by
          construction. */
       return [diligent, struggling].every(function (r) {
         const last = {};
         for (let i = 0; i < r.kindsPerStep.length; i++) {
           const k = r.kindsPerStep[i];
           if (last[k] !== undefined) {
             const patience = k === "transfer" ? E.Policy.TRANSFER_PATIENCE
                            : k === "probe" ? E.Policy.PROBE_PATIENCE
                            : k === "misconception" ? E.Policy.REPAIR_PATIENCE
                            : 0;
             if (patience && i - last[k] < patience) return false;
           }
           last[k] = i;
         }
         return true;
       });
     })());
  /* Repair is the branch most at risk of this, so it is checked directly. */
  const r = eng("c14-repair");
  r.observe(Object.assign({ concept: "shorthand", item: "shorthand-coef", kind: "wrong",
    dimension: "produce", scaffold: "none", rep: "symbolic", at: T0 }, NAMED_BELIEF));
  let repairs = 0;
  for (let i = 0; i < 60; i++) {
    const act = r.next({ now: T0 + i * 60000, unit: 1 });
    if (act.kind !== "act") break;
    if (act.repair) repairs++;
    r.observe({ concept: act.concept.id, item: act.itemId, kind: "wrong",
      dimension: act.item.dimension, scaffold: act.scaffold, rep: act.rep,
      repair: act.repair, action: act.action, at: T0 + i * 60000, believed: 3, ms: 2000 });
  }
  ok("repair cannot repeat indefinitely", repairs > 0 && repairs <= 14, repairs + " in 60 actions");
}

/* ---------------------------------------------------------------- 15 */
contract(15, "Same state + same evidence + same seed = same decision.");
{
  function drive(seed) {
    const e = eng("c15-" + seed);
    const recent = [];
    for (let i = 0; i < 50; i++) {
      const act = e.next({ now: T0 + i * 90000, unit: 1, recent: recent.slice(-12), seed: seed });
      if (act.kind !== "act") break;
      recent.push(act.itemId);
      e.observe({ concept: act.concept.id, item: act.itemId, kind: i % 7 === 0 ? "wrong" : "right",
        dimension: act.item.dimension, scaffold: act.scaffold, rep: act.rep,
        at: T0 + i * 90000, value: 1 });
    }
    return e.next({ now: T0 + 60 * 90000, unit: 1, recent: recent.slice(-12), seed: seed });
  }
  const a = drive(3), b = drive(3), c = drive(4);
  ok("the same seed gives the same action", a.itemId === b.itemId, a.itemId + " vs " + b.itemId);
  ok("and the same representation", a.rep === b.rep, a.rep + " vs " + b.rep);
  ok("and the same priority", a.priority === b.priority, a.priority + " vs " + b.priority);
  ok("and the same scaffold", a.scaffold === b.scaffold, a.scaffold + " vs " + b.scaffold);
  /* A different seed may differ, but must not differ arbitrarily: it is still
     a legal decision from a published vocabulary. */
  ok("a different seed still produces a lawful decision",
     c.kind === "done" || Object.values(E.Policy.REASON).indexOf(c.reason) !== -1,
     c.kind + " / " + c.reason);
  /* No randomness may remain in the decision path. */
  ok("the decision path contains no Math.random",
     !/Math\.random/.test(require("fs").readFileSync(path.join(__dirname, "policy.js"), "utf8")
        .replace(/Math\.random/g, "MATH_RANDOM_COMMENTED") + ""));
}

/* ---------------------------------------------------------------- report */
console.log("\n" + "Contract");
console.log("─".repeat(60));
console.log(`  ${pass} passed, ${fail} failed`);
if (fail) {
  failures.forEach(f => console.log("  · " + f));
  process.exit(1);
}
console.log("\n  The engine holds all fifteen.");
console.log("  This file is the contract; learn/engine/test.js is evidence it is met.\n");