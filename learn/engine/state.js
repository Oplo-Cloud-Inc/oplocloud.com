/* ==========================================================================
   OEdu learning engine — the student state.

   A boolean called `mastered` is a bad model of a person, and it is worse
   for a school because it cannot be argued with. So there is no boolean here.
   Every concept carries, for each of six dimensions of mastery, a *posterior
   distribution* over "how well do they do this", built by counting evidence
   as fractional successes and failures. A level is then claimed only where
   the posterior says so, and it is claimed with the probability attached.

   The six dimensions, which are deliberately not the five in learn.js —
   that file asks how hard a question felt, this one asks what the student
   did:

     conceptual   can they state what the thing means and why it holds
     procedural   can they carry out the procedure accurately and fluently
     reasoning    can they justify a step, spot a flaw, choose a method
     transfer     can they use it where it was not taught, in a form they
                  have not seen
     independence can they do it with no scaffold at all
     retention    does it survive time and come back after a gap

   Independence is separate from the rest on purpose. A student who solves
   twenty problems with three hints each has excellent procedural evidence and
   no independence evidence whatsoever, and averaging those together is how a
   study app reports a student as 80% on something they cannot do.

   Every number here is a real posterior. The incomplete beta function is
   implemented below rather than approximated, because the whole point of the
   file is that the confidence attached to a belief about a student is
   correct rather than plausible-looking.

   The ladder, and the posterior mean each rung needs:

     unknown       nothing observed
     emerging      P(competent) above chance — they have been in contact
     functional    they can produce it, and use it, on a familiar form
     proficient    they can justify it and choose their own method
     transferable  they have used it somewhere it was not taught
     retained      they have got it back after a gap

   Rungs are ordered and each implies the ones below it, which is what lets
   `level()` be a floor over the dimensions rather than an average.
   ========================================================================== */
(function (root) {
  "use strict";

  var E = (root.OPLO_ENGINE = root.OPLO_ENGINE || {});

  /* ================================================== Incomplete beta ===
     betainc(a, b, x) = the regularised incomplete beta function, i.e.
     P(X <= x) for X ~ Beta(a, b). Continued fraction after Lentz, standard
     Numerical Recipes formulation, ~30 digits of headroom at a=1,b=1. Used
     for a student model this is not exotic: it is the whole difference
     between "we think they are functional" and "there is a 0.81 posterior
     probability they are functional", and the second one can be checked. */
  function betacf(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= 200; m++) {
      var m2 = 2 * m;
      var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-12) break;
    }
    return h;
  }

  function betainc(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var lb = (function (n) {                    // ln Γ(n), Lanczos
      var g = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
               -176.61502916214059, 12.507343278686905, -0.13857109526572012,
               9.9843695780195716e-6, 1.5056327351493116e-7];
      if (n < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * n)) - lgamma(1 - n);
      var z = n - 1, x2 = 0.99999999999980993, t = z + 7.5;
      for (var i = 0; i < 8; i++) x2 += g[i] / (z + i + 1);
      return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x2);
    })(a + b);
    var front = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? front * betacf(a, b, x) / a
                                     : 1 - front * betacf(b, a, 1 - x) / b;
  }
  function lgamma(n) {
    var g = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
             -176.61502916214059, 12.507343278686905, -0.13857109526572012,
             9.9843695780195716e-6, 1.5056327351493116e-7];
    var z = n - 1, x = 0.99999999999980993, t = z + 7.5;
    for (var i = 0; i < 8; i++) x += g[i] / (z + i + 1);
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  /* ============================================================= Rungs === */
  var RUNGS = [
    { k: "unknown", name: "Unknown", at: 0.00, needs: [],            say: "Nothing observed yet." },
    { k: "emerging", name: "Emerging", at: 0.34, needs: [],           say: "In contact with it; not yet reliable." },
    { k: "functional", name: "Functional", at: 0.62,
      needs: ["procedural", "conceptual"], say: "Can do it, and use it, in a familiar form." },
    { k: "proficient", name: "Proficient", at: 0.72,
      needs: ["procedural", "conceptual", "reasoning"], say: "Can justify it and choose their own method." },
    { k: "transferable", name: "Transferable", at: 0.76,
      needs: ["procedural", "conceptual", "reasoning", "transfer"], say: "Has used it where it was not taught." },
    { k: "retained", name: "Retained", at: 0.74,
      needs: ["procedural", "conceptual", "reasoning", "transfer", "independence", "retention"],
      say: "Gets it back after a gap, unassisted." }
  ];
  RUNGS.forEach(function (r, i) { r.rank = i; });
  function rung(k) { for (var i = 0; i < RUNGS.length; i++) if (RUNGS[i].k === k) return RUNGS[i]; return RUNGS[0]; }

  var DIMS = ["conceptual", "procedural", "reasoning", "transfer", "independence", "retention"];

  /* ==================================================== Evidence weights

     One answer is worth a fraction of a success, and the fraction is where
     most of the honesty lives. These are the multiplicative factors applied
     to an observation before it is counted:

       independence   how much scaffolding was standing there
       novelty        has this exact form been seen before
       load           how many dimensions this particular item can speak to

     A worked example revealed to the student is positive evidence about
     almost nothing — it moves `procedural` by 0.12 and nothing else. A
     correct answer, unassisted, to a form never seen before, speaks to four
     dimensions at close to full weight. */
  var SCAFFOLD_WEIGHT = {
    none: 1.0,        // no hint taken, nothing shown
    peeked: 0.45,     // looked at a hint, then answered
    cued: 0.28,       // hint before the first attempt
    partial: 0.16,    // given the next step, then answered
    worked: 0.07,     // shown the reasoning, then answered
    told: 0.03        // the answer was revealed outright
  };
  function scaffoldWeight(kind) {
    var v = SCAFFOLD_WEIGHT[kind];
    return v == null ? 1 : v;
  }

  /* How much one dimension of a task is entitled to claim. A multiple-choice
     recognition item cannot produce procedural evidence no matter how it is
     answered — claiming otherwise is how a system ends up telling a school
     a student is fluent on the basis of some picking. */
  function dimensionLoad(d) {
    switch (d) {
      case "identify":   return { conceptual: 0.35, independence: 0.3 };
      case "recall":     return { conceptual: 0.6, independence: 0.7, retention: 0.2 };
      case "compute":    return { procedural: 1.0, independence: 0.5 };
      case "produce":    return { procedural: 0.85, conceptual: 0.5, independence: 0.75 };
      case "explain":    return { conceptual: 1.0, reasoning: 0.7, independence: 0.7 };
      case "justify":    return { reasoning: 1.0, conceptual: 0.6, independence: 0.8 };
      case "diagnose":   return { reasoning: 1.0, conceptual: 0.7, independence: 0.6 };
      case "transfer":   return { transfer: 1.0, procedural: 0.6, reasoning: 0.5, independence: 0.8, conceptual: 0.4 };
      case "retrieve":   return { retention: 1.0, procedural: 0.7, conceptual: 0.6, independence: 0.9 };
      default:           return { conceptual: 0.5, procedural: 0.5 };
    }
  }

  /* ============================================================== State === */
  function fresh(id) {
    var dims = {};
    DIMS.forEach(function (d) { dims[d] = { a: 1, b: 1 }; });   // Beta(1,1) = prior ignorance
    return {
      id: id,
      dims: dims,
      seen: 0, right: 0, wrong: 0,
      first: null, last: null,
      gaps: {},                    // days of the largest gap survived
      lastGap: 0,
      ledger: [],                  // the evidence, newest last, capped
      misconceptions: {},          // id -> posterior weight, held by the diagnosis engine
      reps: {},                    // representation -> {right, wrong}
      due: null,
      v: 1
    };
  }

  function dim(s, d) {
    if (!s.dims[d]) s.dims[d] = { a: 1, b: 1 };
    return s.dims[d];
  }

  /* Posterior mean — the best single guess at "how well do they do this". */
  function mean(d) { return d.a / (d.a + d.b); }

  /* Posterior probability that the true value is at least t. This is the
     number that goes next to a claim about a student. */
  function pAtLeast(d, t) {
    if (t <= 0) return 1;
    if (t >= 1) return 0;
    return 1 - betainc(d.a, d.b, t);
  }

  /* Effective sample size. Beta(1,1) has n=2, which is why an unobserved
     concept has a posterior spread almost flat across the interval: the
     engine is honest about not knowing, and says so by proposing a probe
     rather than a lesson. */
  function n(d) { return d.a + d.b - 2; }

  function level(s, now) {
    now = now || Date.now();
    if (!s || !s.seen) return { k: "unknown", rank: 0, p: 0, reasons: [] };
    var reasons = [], best = rung("emerging");
    for (var i = 2; i < RUNGS.length; i++) {
      var r = RUNGS[i], worst = 1, weakDim = null;
      r.needs.forEach(function (d) {
        /* Retention is the one dimension the clock acts on directly: a rung
           that requires retention is not reachable while the concept is
           faded, however good the last sitting was. */
        var dd = dim(s, d);
        if (d === "retention") dd = fadedRetention(s, now);
        var p = pAtLeast(dd, r.at);
        if (p < worst) { worst = p; weakDim = d; }
      });
      if (worst < 0.5) { reasons.push("needs " + weakDim + " (" + Math.round(worst * 100) + "% ≥ " + Math.round(r.at * 100) + "%)"); break; }
      reasons.push(r.k + " at " + Math.round(worst * 100) + "%");
      best = r;
    }
    /* A concept with no independence evidence can still be functional — but
       not proficient. The scaffold requirement is a floor, not a ceiling, so
       that a heavily scaffolded student is never recorded as more than
       functional however good their procedural run was. */
    if (best.rank > rung("functional").rank && !s.seenUnscaffolded) {
      best = rung("functional");
      reasons.push("no unscaffolded success yet");
    }
    return { k: best.k, name: best.name, rank: best.rank, rung: best, p: rungProbability(s, best, now), reasons: reasons, say: best.say };
  }

  /* The confidence attached to a claimed rung: the probability that *every*
     dimension it requires clears its threshold. Dimensions are treated as
     conditionally independent given the task, which is an approximation —
     but it is the conservative direction when it is wrong, because a
     correlation between, say, procedural and independence evidence makes
     the true conjunction no smaller than the product. */
  function rungProbability(s, r, now) {
    now = now || Date.now();
    if (r.rank === 0) return 0;
    var p = 1;
    r.needs.forEach(function (d) {
      var dd = d === "retention" ? fadedRetention(s, now) : dim(s, d);
      p *= pAtLeast(dd, r.at);
    });
    return p;
  }

  /* Retention as a posterior the clock updates. It rises on a correct answer
     after a gap, which is the one thing that cannot be faked in a sitting,
     and it decays on its own so that "retained" expires. */
  function fadedRetention(s, now) {
    var base = dim(s, "retention");
    if (!s.last || !base.a + base.b > 2) return { a: 1, b: 1, faded: true };
    var days = (now - s.last) / 864e5;
    if (days < 1) return base;
    /* Days of fade move mass toward "not retained" without pretending to be
       a fitted forgetting curve for this particular student. */
    var lost = Math.min(1, days / 30);
    var a = base.a * (1 - lost), b = base.b + base.a * lost;
    return { a: Math.max(0.05, a), b: Math.max(0.05, b), faded: true };
  }

  /* What the student can do that they could not do at the last check —
     the report's "you are missing" list, computed rather than remembered. */
  function weakest(s, now) {
    now = now || Date.now();
    var out = DIMS.map(function (d) {
      var dd = d === "retention" ? fadedRetention(s, now) : dim(s, d);
      return { dim: d, mean: mean(dd), p: pAtLeast(dd, 0.62), n: n(dd), a: dd.a, b: dd.b };
    });
    return out.sort(function (x, y) { return x.mean - y.mean; });
  }

  function uncertainty(s) {
    /* Variance of a Beta is ab / (n²(n+1)); summed over the dimensions a rung
       needs. This is the quantity the policy probes on: a concept with a
       confident low score is not worth interrupting for, a concept with a
       50/50 posterior is worth everything. */
    var v = 0, k = 0;
    DIMS.forEach(function (d) {
      var dd = dim(s, d), nn = dd.a + dd.b;
      v += (dd.a * dd.b) / (nn * nn * (nn + 1));
      k++;
    });
    return Math.sqrt(v / Math.max(1, k));
  }

  /* ===================================================== Evidence state ===

     A single number was being asked to do two incompatible jobs. It gated
     *certifying* a rung — where a hard bar is right, because the claim is
     going on a record — and it also gated whether the engine was *allowed to
     find out* anything. Those are different questions, and coupling them is
     why an undecided concept could never be probed into a decided one: the
     engine refused to act precisely when it knew least.

     So evidence carries its own stage, and it is about volume and
     concentration rather than about any particular rung:

       insufficient     nothing observed; every posterior is the flat prior
       emerging         real evidence, but the answer still depends on luck
       sufficient       enough independent dimensions to act on the claim
       high_confidence  more evidence would not meaningfully change it

     `n` is effective sample size (a + b - 2) and `live` counts dimensions
     carrying evidence of their own. Both are used, because eight answers to
     one question is one dimension of knowledge, not eight. */
  var EVIDENCE = ["insufficient", "emerging", "sufficient", "high_confidence"];
  function evidenceState(s, now) {
    now = now || Date.now();
    if (!s || !s.seen) return { k: "insufficient", rank: 0, n: 0, live: 0, why: "nothing observed" };
    var total = 0, live = 0;
    DIMS.forEach(function (d) {
      var dd = dim(s, d), nn = n(dd);
      total += nn;
      if (nn >= 2) live++;
    });
    if (total < 3 || live < 1) return { k: "insufficient", rank: 0, n: total, live: live, why: "too little evidence to act on" };
    if (total >= 12 && live >= 3) return { k: "high_confidence", rank: 3, n: total, live: live, why: "more evidence would not change the reading" };
    if (total >= 6 && live >= 2) return { k: "sufficient", rank: 2, n: total, live: live, why: "enough independent evidence to act on" };
    return { k: "emerging", rank: 1, n: total, live: live, why: "in contact, but the answer still turns on luck" };
  }

  /* What one more piece of evidence would be worth, in the only units that
     mean anything: how much it would narrow the posterior. This is what a
     diagnostic probe is for, so it is what the policy asks — not whether a
     rung threshold has been crossed.

     Only dimensions that have actually been *touched* contribute, and that
     restriction is load-bearing rather than tidy. A dimension no authored item
     speaks to stays at Beta(1,1), whose variance is the maximum available, so
     including it makes every concept look maximally uncertain forever — the
     engine would probe a student it has already understood perfectly, on and
     on, because a dimension nothing has ever asked about never resolves.
     That is not uncertainty, it is a content gap, and Teacher.plan already
     reports it as one.

     What remains is genuine decision-relevant uncertainty: dimensions the
     student has met, spread out enough that the answer is not yet known. */
  function informationGain(s, now) {
    now = now || Date.now();
    if (!s || !s.seen) return 1;                       // nothing known: everything is worth learning
    var v = 0, touched = 0;
    DIMS.forEach(function (d) {
      if (n(dim(s, d)) < 1) return;                    // never asked about: not uncertainty, a gap
      var dd = d === "retention" ? fadedRetention(s, now) : dim(s, d);
      var nn = dd.a + dd.b;
      v += (dd.a * dd.b) / (nn * nn * (nn + 1));
      touched++;
    });
    if (!touched) return 0;
    /* Scaled by how little is known overall. The exponent matters: variance
       decays only as 1/n even when the posterior mean is decided, so a
       linear discount would still leave a thoroughly-measured concept looking
       "uncertain" forever and the engine would never leave it. Discounting by
       the square of how much has been observed drives the value to zero as
       evidence accumulates, which is the honest shape — the tenth identical
       answer tells you almost nothing about a student you have nine of. */
    var nov = Math.min(1, totalN(s) / 12);
    return Math.sqrt(v / touched) * Math.pow(1 - nov, 2);
  }
  function totalN(s) {
    var t = 0;
    DIMS.forEach(function (d) { t += n(dim(s, d)); });
    return t;
  }

  /* ============================================================= Grading

     `ev` is one observation:
       { concept, task, kind: right|wrong|partial, dimension, scaffold,
         rep, fresh: bool, transfer: bool, retrieval: bool, gap: days,
         told: bool, at: ms }

     Fractional counting is deliberate. Half credit for a partial answer, a
     quarter for a right answer with a cue, and so on, means the posterior
     moves by an amount that reflects how much the observation was worth —
     and one careless answer can never blow a belief up on its own. */
  function evidence(s, ev, now) {
    now = now || Date.now();
    ev = ev || {};
    if (!s) return null;
    var at = ev.at || now;
    var load = dimensionLoad(ev.dimension);
    var sw = scaffoldWeight(ev.scaffold);
    var kind = ev.kind || "wrong";
    var weight = kind === "right" ? 1 : kind === "partial" ? 0.4 : 1;

    if (s.first == null) s.first = at;
    s.seen++;
    if (kind === "right") s.right++; else s.wrong++;

    if (ev.gap && ev.gap > (s.lastGap || 0)) { s.gaps[Math.round(ev.gap)] = 1; s.lastGap = ev.gap; }
    if (ev.retrieval && kind === "right" && (ev.gap || 0) >= 1) s.survivedGap = true;

    /* Unscaffolded evidence, and the count the level floor reads. */
    if (kind === "right" && (ev.scaffold === "none" || ev.scaffold == null)) {
      s.unscaffolded = (s.unscaffolded || 0) + 1;
      s.seenUnscaffolded = true;
    }
    /* How the last few went, which is what the scaffolding choice reads. A
       count of wrong answers, not a flag: one miss earns a cue, two earn a
       change of representation, and that is a different intervention. */
    s.recentWrong = ((s.recentWrong || 0) + (kind === "right" ? 0 : 1)) - (ev.resetWrong || 0);
    if (s.recentWrong < 0) s.recentWrong = 0;

    var rep = ev.rep || "symbolic";
    if (!s.reps[rep]) s.reps[rep] = { right: 0, wrong: 0 };
    if (kind === "right") s.reps[rep].right++; else s.reps[rep].wrong++;

    /* The counting. Each dimension the task can speak to gets the outcome,
       weighted by how much that task actually says about it, by how much
       scaffolding was standing there, and by whether this exact form has
       been seen before. */
    Object.keys(load).forEach(function (d) {
      var dd = dim(s, d);
      var w = load[d] * sw * weight * (ev.fresh === false ? 0.6 : 1);
      /* Independence is the one dimension a hint cannot contribute to at all,
         however small the hint. "They could do it with no scaffold" is a
         factual claim, and once a cue is on the screen the observation stops
         bearing on it — a nudge that still leaves it to the student is a
         nudge that costs independence, not one that halves it. Letting it
         contribute 3% is how a student ends up recorded as independent after
         a session of worked solutions. */
      if (d === "independence" && (ev.scaffold && ev.scaffold !== "none")) return;
      if (kind === "right") dd.a += w;
      else if (kind === "partial") { dd.a += w; dd.b += w * 0.5; }   // net positive
      else dd.b += w;
    });

    /* Retention is only ever moved by a retrieval after a gap, and only in
       the direction the evidence runs. A correct answer in the same sitting
       cannot be evidence that something is remembered. */
    if (ev.retrieval && (ev.gap || 0) >= 1) {
      var rr = dim(s, "retention");
      if (kind === "right") rr.a += 1.1 * sw; else rr.b += 1.3;
    }

    s.last = at;
    s.ledger.push({
      at: at, task: ev.task || null, dimension: ev.dimension || null,
      kind: kind, scaffold: ev.scaffold || "none", rep: rep,
      transfer: !!ev.transfer, retrieval: !!ev.retrieval,
      probe: !!ev.probe, repair: ev.repair === true,
      fresh: ev.fresh !== false, gap: ev.gap || 0,
      believed: ev.believed || null
    });
    if (ev.probe) { s.probes = (s.probes || 0) + 1; s.atProbe = at; s.seenAtProbe = s.seen; }

    /* --------------------------------------------- Per-action-kind pacing

       Every kind of question gets its own "asked at" clock, for the same
       reason the repair branch has one: an engine that re-asks without
       waiting is not measuring anything, it is repeating itself. The bug this
       replaces was specific and visible — the transfer probe was served 42
       times in a row on one item, because answering it correctly did not move
       the transfer posterior above the gate that had selected it. The gate
       asked "is transfer open?" and the answer stayed "yes" for the whole
       session, so the branch re-selected the same item forever.

       A cooldown is the honest fix for that: it bounds repetition without
       asserting anything about what the student knows. Paced per action kind,
       because asking the same *question* again is only redundant for the
       purpose it was asked for. */
    if (ev.action) {
      var clk = s.askedAt || (s.askedAt = {});
      clk[ev.action] = at;
      clk[ev.action + ":seen"] = s.seen;
    }

    /* ---------------------------------------------------- Repair accounting

       This is the only place a repair is ever counted, and counting is not
       grading. Three separations matter, and each was previously blurred:

       1. `ev.repair` is an *event attribute*. `true` means this observation
          was produced as part of an engine-issued repair. It is not inferred
          here and not inferred from the previous action: an ordinary answer
          that happens to follow a repair is ordinary evidence, and inferring
          otherwise is what turns one repair into an endless repair loop.

       2. A repair is *history*, not mastery. What the student did while the
          explanation was on the screen is counted above by the ordinary
          grading path, weighted by however much scaffolding was standing
          there. Nothing below grants capability for having been repaired at.

       3. `atRepair` / `seenAtRepair` are a *clock*, used to pace re-repair. A
          belief the student has not yet had a chance to act on is not a belief
          that has survived its repair, so the engine waits — but the wait ends
          on observation count, not on the belief being disproven, because
          deciding that is the student's next answer's job, not the timer's. */
    if (ev.repair === true) {
      s.repairs = (s.repairs || 0) + 1;
      s.atRepair = at;
      s.seenAtRepair = s.seen;
      /* When the last repair was *survived*, which is a different question
         from when it was delivered and the only thing that should retire a
         belief. An unchallenged repair is not a refuted one. */
      if (kind === "right") { s.repairResolved = (s.repairResolved || 0) + 1; s.atRepairResolved = at; }
    }
    if (s.ledger.length > 60) s.ledger.splice(0, s.ledger.length - 60);
    s.due = dueAt(s, now);
    return s;
  }

  /* Retrieval schedule. Not a queue: a time, because forgetting happens on a
     clock. The interval grows with the lowest dimension rather than the
     average, so a concept held up by one weak dimension comes back sooner. */
  function dueAt(s, now) {
    now = now || Date.now();
    if (!s.seen) return 0;
    var w = weakest(s, now)[0];
    var days = Math.round(1 + (1 - Math.min(1, w.mean)) * 21 * (1 / Math.max(1, w.n)));
    if (s.misconceptions && Object.keys(s.misconceptions).length) days = Math.min(days, 1);
    return now + Math.max(0.5, days) * 864e5;
  }
  function isDue(s, now) { return !s.seen || (s.due || 0) <= (now || Date.now()); }

  /* ============================================================== Merging
     Two devices, one student. A concept state is whole — six posteriors,
     counters and a ledger computed together — so it merges as a whole: the
     copy with more observations wins. Taking a dimension from one device and
     a due date from the other would describe a student who never existed. */
  function merge(a, b) {
    a = a || {}; b = b || {};
    var out = fresh(a.id || b.id);
    var ka = key(a), kb = key(b);
    var win = ka >= kb ? a : b, lose = win === a ? b : a;
    if (!lose || (lose.seen || 0) === 0) return Object.assign(out, clone(win || {}));
    if ((lose.seen || 0) > (win.seen || 0)) { var t = win; win = lose; lose = t; }
    var merged = clone(win);
    /* Counter-based evidence adds across devices — twenty answers here and
       twenty there are forty answers, and that is real. */
    ["seen", "right", "wrong", "unscaffolded"].forEach(function (k) {
      merged[k] = (win[k] || 0) + (lose[k] || 0);
    });
    var dims = {};
    DIMS.forEach(function (d) {
      var x = dim(win, d), y = dim(lose, d);
      dims[d] = { a: x.a + y.a - 1, b: x.b + y.b - 1 };
    });
    merged.dims = dims;
    merged.reps = Object.assign({}, win.reps || {}, lose.reps || {});
    merged.ledger = (win.ledger || []).concat(lose.ledger || [])
      .sort(function (p, q) { return p.at - q.at; })
      .slice(-60);
    merged.misconceptions = Object.assign({}, lose.misconceptions || {}, win.misconceptions || {});
    /* Repair history merges by the larger count, and the *later* clock, because
       the pacing question is "how long since the last one", and that is a fact
       about the most recent event rather than about whichever device happened
       to record more of them. Counters about capability are never summed here —
       the posteriors above already are. */
    merged.repairs = Math.max(win.repairs || 0, lose.repairs || 0);
    merged.repairResolved = Math.max(win.repairResolved || 0, lose.repairResolved || 0);
    merged.atRepair = Math.max(win.atRepair || 0, lose.atRepair || 0) || null;
    merged.atRepairResolved = Math.max(win.atRepairResolved || 0, lose.atRepairResolved || 0) || null;
    merged.seenAtRepair = Math.max(win.seenAtRepair || 0, lose.seenAtRepair || 0) || null;
    merged.first = Math.min(win.first || Infinity, lose.first || Infinity);
    if (!isFinite(merged.first)) merged.first = null;
    merged.last = Math.max(win.last || 0, lose.last || 0) || null;
    merged.lastGap = Math.max(win.lastGap || 0, lose.lastGap || 0);
    merged.survivedGap = !!(win.survivedGap || lose.survivedGap);
    merged.due = Math.max(win.due || 0, lose.due || 0) || null;
    return merged;
  }
  function key(s) { return (s.seen || 0) * 1e6 + (s.ledger ? s.ledger.length : 0); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  E.State = {
    DIMS: DIMS, RUNGS: RUNGS, SCAFFOLD_WEIGHT: SCAFFOLD_WEIGHT, EVIDENCE: EVIDENCE,
    rung: rung, dimensionLoad: dimensionLoad, scaffoldWeight: scaffoldWeight,
    fresh: fresh, dim: dim, mean: mean, pAtLeast: pAtLeast, n: n,
    level: level, rungProbability: rungProbability, weakest: weakest,
    uncertainty: uncertainty, fadedRetention: fadedRetention,
    evidenceState: evidenceState, informationGain: informationGain, totalN: totalN,
    evidence: evidence, dueAt: dueAt, isDue: isDue, merge: merge,
    betainc: betainc
  };
})(typeof window !== "undefined" ? window : globalThis);
