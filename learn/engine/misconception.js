/* ==========================================================================
   OEdu learning engine — misconceptions and representation switching.

   Two things in this file, because they are the same thing seen from two
   sides: what a wrong answer *means*, and what to do about it.

   **Misconceptions are hypotheses, not labels.** An incorrect answer
   updates a distribution over named misconceptions, each with a signature
   the engine can test against what the student actually did — the value
   they typed, the step they got wrong, whether they were fast and sure. A
   student who writes `4 + 5` for `4n` at `n = 5` is not "wrong"; the
   evidence points hard at *coefficients as digits*, a specific belief about
   what a letter next to a number means. Once that belief is named, the
   repair is targeted — and the next question is chosen to *discriminate*
   between the surviving hypotheses, not to give more of the same practice.

   This is also the difference between a hint and a repair. A hint says
   "look again". A repair says "you read `4n` as the two-digit number 45;
   here is what a number in front of a letter does" and then asks something
   that the belief would get wrong.

   **Representation switching** is the second half. When evidence says a
   student cannot do this, the engine's first move is to change how the
   concept is being shown, not to make the same question easier. Difficulty
   reduction is what a system does when it has no other idea; representation
   change is what a teacher does. The `pickRep` below ranks representations
   by what has worked for *this* student on *this* concept, never repeating a
   representation that has just failed.
   ========================================================================== */
(function (root) {
  "use strict";

  var E = (root.OPLO_ENGINE = root.OPLO_ENGINE || {});

  /* Representations, in the order an engine reaches for them when it has no
     evidence at all. `cost` is how much scaffolding the representation
     carries: a number line hands over more than an empty prompt, and the
     engine should pay that cost only when it has to. */
  var REPS = [
    { k: "concrete",  name: "Concrete",   say: "Something you can count or hold.", cost: 0.55 },
    { k: "visual",    name: "Visual",     say: "A picture of the situation.",    cost: 0.5 },
    { k: "manipulative", name: "Manipulative", say: "Move it and watch what happens.", cost: 0.45 },
    { k: "verbal",    name: "Verbal",     say: "In words, before any symbols.",  cost: 0.4 },
    { k: "procedural",name: "Procedural", say: "Do it step by step.",           cost: 0.35 },
    { k: "quantitative", name: "Quantitative", say: "Numbers and quantities.",   cost: 0.15 },
    { k: "symbolic",  name: "Symbolic",   say: "In notation.",                  cost: 0.1 },
    { k: "realworld", name: "Real world", say: "A situation with a real answer.", cost: 0.2 }
  ];
  var REP = {};
  REPS.forEach(function (r, i) { r.n = i; REP[r.k] = r; });
  function rep(k) { return REP[k] || null; }

  /* ======================================================== Misconceptions

     A misconception is:
       id, concept, name, belief   what the student thinks
       tell   how the belief shows up in an answer — a matcher
       repair what to say to it, and what to make them do next
       prior  how common it is, before any evidence (0..1)

     `tell` is a function of the observation, returning 0..1 — how strongly
     this observation is evidence of this belief. It is deliberately allowed
     to return a low number: a signature that fires on every wrong answer is
     not a signature. */
  var M = {};
  function defineMisconceptions(list) {
    list.forEach(function (m) {
      m.prior = m.prior == null ? 0.2 : m.prior;
      m.id = m.id || (m.concept + ":" + m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      M[m.id] = m;
    });
    return M;
  }
  function allMisconceptions() { return Object.keys(M).map(function (k) { return M[k]; }); }
  function forConcept(id) { return allMisconceptions().filter(function (m) { return m.concept === id; }); }

  /* ============================================================ Diagnosis

     One observation in, a posterior over this concept's misconceptions out.
     No correct answer clears the hypothesis — a student can hold a wrong
     belief and get lucky — but it decays every misconception's weight, and
     decisively when they were *sure*. A confident right answer is evidence
     against the belief in a way a hesitant one is not.

     Wrong answers do the opposite: each signature is scored, the scores
     become likelihood ratios, and the winner gains weight only as much as
     the signatures distinguish it. Two hypotheses that both fit the answer
     stay both alive, because pretending to know which one it was is how an
     engine ends up teaching the wrong repair. */
  function diagnose(s, ev, now) {
    now = now || Date.now();
    var post = s.misconceptions || (s.misconceptions = {});
    var wrong = ev.kind === "wrong";
    var sure = ev.believed != null && ev.believed >= 3;      // self-reported confidence
    var fast = ev.ms != null && ev.ms < 4000 && sure;
    var cands = forConcept(ev.concept);

    /* A fast, sure error is worth keeping even when no belief has been
       authored for this concept and nothing can be named. "They believe
       something, and I cannot say what" is itself the most actionable fact
       available — it is what makes the engine probe instead of simply
       serving more practice, and it must not be swallowed by the absence of
       an authored signature. */
    s.misconceptionSuspect = (wrong && (sure || fast)) ? (cands.length ? "unnamed" : "unknown") : null;
    if (!cands.length) return post;

    /* Every candidate starts from its prior each time, then gets this one
       observation's likelihood ratio. Sequential updating would let a
       hundred weak signals compound into certainty, which is exactly the
       overconfidence a heuristic eventually produces. */
    var next = {}, best = null, topP = 0, tellBest = 0;
    var right = ev.kind === "right" || ev.kind === "partial";
    cands.forEach(function (m) {
      var p = Math.max(1e-4, m.prior);
      var lr = 1, tell = safe(m.tell, ev, m) || 0;
      if (right) {
        /* A right answer is evidence against the belief — stronger when the
           student was sure, because a sure right answer is a considered one.
           A partial answer counts less: the student may simply have avoided
           the part that would have exposed the belief. */
        var relief = sure ? 0.35 : 0.12;
        if (ev.kind === "partial") relief *= 0.4;
        lr = 1 / (1 + relief * 8);
      } else if (wrong) {
        lr = 1 + tell * 22;
      }
      p = clamp01(p * lr);
      next[m.id] = p;
      if (!best || p > topP) { best = m; topP = p; tellBest = tell; }
    });

    var total = Object.keys(next).reduce(function (a, k) { return a + next[k]; }, 0);
    var norm = {};
    Object.keys(next).forEach(function (k) { norm[k] = total ? next[k] / total : next[k]; });

    /* Spread is the decisive test. If the evidence points the same way for
       every hypothesis, it says nothing about which one it is — so no
       misconception is recorded, and the report says the error is
       unexplained rather than inventing a belief the evidence cannot carry. */
    var conf = 0;
    if (wrong && best) {
      conf = norm[best.id] * tellBest;
      if (conf < 0.22) { best = null; conf = 0; }
      else if (conf < 0.4) conf = conf * 0.6;             // say it as a suspicion
    }
    s.misconception = best ? { id: best.id, p: norm[best.id], conf: conf } : null;
    s.misconceptions = norm;
    s.misconceptionNamed = s.misconception && s.misconception.conf >= 0.4 ? s.misconception.id : null;
    if (wrong && (sure || fast)) s.misconceptionSuspect = best ? best.id : (cands.length ? "unnamed" : "unknown");
    else s.misconceptionSuspect = null;
    s.due = E.State.dueAt(s, now);
    return norm;
  }

  function safe(fn, ev, m) { try { return fn ? fn(ev, m) : 0; } catch (e) { return 0; } }

  /* What to do about a belief. Repairs are content objects the author wrote,
     so the engine never invents a correction — it can only choose among
     repairs that exist for the belief it has evidence for. */
  function repairFor(s) {
    if (!s.misconception) return null;
    var m = M[s.misconception.id];
    if (!m) return null;
    return { misconception: m, say: m.repair.say, do: m.repair.do, probe: m.repair.probe, p: s.misconception.p };
  }

  /* The next question after a named belief is a *discriminating* one: an item
     the belief gets wrong and the correct understanding gets right. This is
     the step most adaptive systems skip — they go straight back to practice,
     which cannot tell a repaired belief from a lucky guess. */
  function discriminating(m, catalogue, seed) {
    if (!m || !m.repair || !m.repair.probe) return null;
    var want = Array.isArray(m.repair.probe) ? m.repair.probe : [m.repair.probe];
    var pool = (catalogue || []).filter(function (t) {
      /* An item may list the beliefs it separates, or may simply *be* the
         probe. Both spellings are in use and checking only one silently
         returns nothing for every author who used the other. */
      var tags = t.discriminates || [];
      if (!Array.isArray(tags)) tags = [tags];
      return want.indexOf(t.id) !== -1 || tags.some(function (g) { return want.indexOf(g) !== -1; });
    });
    if (!pool.length) return null;
    /* Deterministic choice. A probe is chosen for its ability to separate two
       hypotheses, so which one of several equally-separating probes comes up
       is not a fact about the student — and if it varies, two devices with the
       same record ask different questions and the engine looks random. Seeded
       from the belief id, so it is stable per belief and spreads across them. */
    return pool[Math.floor(tiebreak(seed, m.id + ":" + pool.length) * pool.length)];
  }

  /* ==================================================== Representation pick

     Given the student's history on this concept, which representation next?
     The rules, in order, because each one is a real reason:
1. never repeat the representation that just failed
        2. never use a representation twice in a row on the same concept
        3. prefer the representation that has worked most for them here,
           measured against a 0.5 prior for the untried — an unmeasured form
           is not a worse bet than a measured failure
        4. among equals, prefer the one that costs less scaffolding
        5. with no evidence at all, begin concrete and descend

     `avoid` is what just failed. `used` is what has been tried, so a student
     is not shown three number lines in three consecutive questions and told
     each time that the representation changed. */
  function pickRep(s, allowed, avoid, used, seed) {
    allowed = (allowed || []).filter(function (k) { return REP[k]; });
    if (!allowed.length) allowed = ["symbolic"];
    var hist = (s && s.reps) || {};
    var justUsed = used && used.length ? used[used.length - 1] : null;

    var scored = allowed.map(function (k) {
      var h = hist[k] || { right: 0, wrong: 0 };
      var n = h.right + h.wrong;
      var rate = n ? h.right / n : null;
      var v = 0;
      if (k === avoid) v -= 1000;                                  // 1
      if (k === justUsed) v -= 60;                                 // 2
      /* 3. Prefer the representation that has worked for them here — scored
         against a 0.5 prior for the untried, not against zero. This was the
         bug that made the engine serve symbolic again after four symbolic
         failures: a measured 0% contributed nothing while an untried form was
         docked up to 12 points for being untried, so *failing* scored higher
         than *not knowing*, and the one representation the student had proven
         they could not do won the argument every time. An untried form is
         not worse than a measured failure; it is merely unknown. */
      v += (rate == null ? 0.5 : rate) * 50;
      v += (1 - REP[k].cost) * 10 * (n ? 1 : 0.4);                 // 4
      /* The tie-break is folded into the score rather than added to the
         comparator, so it can only decide between genuinely equal
         representations and can never overturn a rule above. */
      v += tiebreak(seed, k) * 1e-6;
      return { k: k, v: v };
    });
    scored.sort(function (a, b) { return b.v - a.v; });
    return scored[0].k;
  }

  /* A stable per-(seed, key) number in [0,1). Used only to break exact ties. */
  function tiebreak(seed, key) {
    var h = 2166136261 >>> 0, t = String(seed == null ? 0 : seed) + ":" + key;
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return ((h >>> 0) % 1000) / 1000;
  }

  /* Did the representation change actually help? If a student failed in one
     representation and then succeeded in another, that is evidence the
     failure was representational — which is worth recording, because it
     justifies switching again next time instead of grinding. */
  function repIsBlame(conceptId, s) {
    var hist = (s && s.reps) || {};
    var ks = Object.keys(hist);
    if (ks.length < 2) return null;
    var best = null;
    ks.forEach(function (k) {
      var h = hist[k], n = h.right + h.wrong;
      if (n < 2) return;
      var rate = h.right / n;
      if (!best || rate > best.rate) best = { rep: k, rate: rate, n: n };
    });
    var worst = null;
    ks.forEach(function (k) {
      var h = hist[k], n = h.right + h.wrong;
      if (n < 2) return;
      var rate = h.right / n;
      if (!worst || rate < worst.rate) worst = { rep: k, rate: rate, n: n };
    });
    if (best && worst && best.rep !== worst.rep && worst.rate < 0.4 && best.rate > 0.7) {
      return { from: worst.rep, to: best.rep, blaming: worst.rep };
    }
    return null;
  }

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  E.Misconception = {
    REPS: REPS, rep: rep,
    define: defineMisconceptions, defineMisconceptions: defineMisconceptions,
    all: allMisconceptions, forConcept: forConcept,
    diagnose: diagnose, repairFor: repairFor, discriminating: discriminating,
    pickRep: pickRep, repIsBlame: repIsBlame
  };
})(typeof window !== "undefined" ? window : globalThis);
