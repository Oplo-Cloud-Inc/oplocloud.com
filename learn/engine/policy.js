/* ==========================================================================
   OEdu learning engine — the policy.

   One function decides what happens next, and it is the whole product:

     nextAction(model) -> { concept, item, rep, scaffold, why }

   Everything above it is bookkeeping and everything below it is content.
   What makes this defensible rather than a heuristic is that the decision
   carries its own reasons: every action comes back with the evidence and
   the priority that produced it, so a teacher asking "why is my son being
   asked this" gets an answer from the model, not a justification written
   afterwards.

   The priorities, in order. The first that applies wins, which means the
   list is an argument about what a child's time is for and can be argued
   with:

     1. A belief held wrong. A named misconception outranks everything,
        because a student reasoning from a false premise will get every
        subsequent practice item wrong for the same reason, and no amount
        of practice fixes it.
     2. An uncertainty worth resolving. The value of the next observation is
        highest where the posterior is still wide, and the item chosen is a
        discriminating one, so the evidence actually separates hypotheses.
        This is a question about *information*, not about a rung: a probe is
        most needed precisely when the engine does not yet know, so it cannot
        be gated on knowing enough already.
     3. An entry point on an unmet dependency chain. A concept that is
        blocking work assigned now.
     4. Retrieval. Something thought-known that has not been checked after a
        gap. Cheapest possible evidence per unit of knowledge, so it goes
        early rather than last.
     5. Transfer. Not a reward for mastery but a measurement of it — asked
        when there is a formed understanding and no evidence about whether it
        travels. Gating this on "already proficient" makes it unaskable of
        exactly the students who need it, because the transfer dimension is
        what would *establish* the rung above.
     6. The next rung. Ordinary forward motion: whatever is closest to
        being functional and is not yet.

   Every decision carries an `action` (what kind of question this is) and a
   `reason` (which evidence condition produced it), from the vocabulary in
   REASON below. A decision that cannot be named cannot be argued with, and
   "why was my son not asked the question that would have settled this?" is
   the only question this engine is regularly required to answer.

   Scaffold depth is chosen per action, never fixed by the author:
     none → cue → representation → partial → explanation → worked
   The first four are legitimate teaching. `worked` is a last resort that
   stops the ladder, and reaching it costs independence evidence, so the
   model records a rescue rather than a success.

   Two failure modes this file is written against, both found by running it:

   **Livelock.** A concept whose posteriors sit in the ambiguous band stays
   in that band for many observations, so an "is it undecided?" test alone
   will re-ask the same question all session. Every branch therefore has a
   memory of what it just did — a probe cooldown, a recent-item list — and
   yields rather than repeating itself.

   **Unteachable chains.** The obvious way to answer "what is blocking this?"
   is to name the top of the chain, which is the wrong answer: repairing
   "solving a two-step equation" is meaningless while "solving a one-step
   equation" under it is unknown. `entryPoint` walks to the bottom of the
   chain instead. And a prerequisite nobody has authored content for is
   assumed rather than blocking, because otherwise one missing tier-0
   concept silently freezes an entire unit.
   ========================================================================== */
(function (root) {
  "use strict";

  var E = (root.OPLO_ENGINE = root.OPLO_ENGINE || {});

  /* The ladder, and what each rung costs the model. A correct answer after a
     cue is partial credit; a correct answer after the working is shown is
     almost none, because the thing being measured did not happen. */
  var LADDER = ["none", "cue", "representation", "partial", "explanation", "worked"];
  function ladderAt(n) { return LADDER[Math.max(0, Math.min(LADDER.length - 1, n))]; }

  /* ============================================================= Reason codes

     Every decision this file makes is attributable to a name, and every
     *rejection* is too. A boolean test that quietly fails leaves nobody able
     to say why the student was not asked the question that would have settled
     it — which is the only interesting question a learning system is ever
     asked about itself.

     These are not decoration on the happy path. They are the vocabulary the
     engine reasons in, and each is produced from the state that caused it, so
     that "why not a probe?" is answerable with a state rather than a shrug. */
  var REASON = {
    REPAIR_REQUIRED: "REPAIR_REQUIRED",
    REPAIR_COOLDOWN: "REPAIR_COOLDOWN",
    INSUFFICIENT_MASTERY_EVIDENCE: "INSUFFICIENT_MASTERY_EVIDENCE",
    PROBE_INFORMATION_GAIN: "PROBE_INFORMATION_GAIN",
    TRANSFER_ELIGIBLE: "TRANSFER_ELIGIBLE",
    MASTERY_CONFIRMED: "MASTERY_CONFIRMED",
    DEPENDENCY_ENTRY: "DEPENDENCY_ENTRY",
    RETENTION_DUE: "RETENTION_DUE",
    NOTHING_DUE: "NOTHING_DUE"
  };

  /* The kinds of thing a student can be asked, kept apart because they carry
     different evidence and are justified by different things.

       practice           ordinary forward motion on the taught form
       diagnostic_probe   asked *because* the answer would narrow the posterior
       repair             asked to overturn a named belief
       transfer_probe     asked to find out whether understanding travels —
                          explicitly NOT a reward for having mastered it
       mastery_check      asked to confirm a rung before it goes on a record
       retention_check    asked after a gap

     The separation is the whole point of this file. "Transfer" and "mastery"
     were one gate, so a transfer probe could only ever be asked of a student
     who had already proved they did not need it. */
  var ACTION = {
    PRACTICE: "practice",
    DIAGNOSTIC_PROBE: "diagnostic_probe",
    REPAIR: "repair",
    TRANSFER_PROBE: "transfer_probe",
    MASTERY_CHECK: "mastery_check",
    RETENTION_CHECK: "retention_check"
  };

  /* Deterministic tie-break. Identical evidence must produce an identical
     decision, or a teacher comparing two devices sees a difference that is
     only the clock's. */
  function jitter(seed, key) {
    var h = 2166136261 >>> 0, s = String(seed == null ? 0 : seed) + ":" + key;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return (h % 1000) / 1000;
  }

  /* ============================================================== Policy

     `model` is:
       { state, now, unit, goal, openAll, recent: [itemIds], usedReps, seed }

     `goal` is what the student said they are here for, and it moves the
     ceiling rather than the floor: "learn it fast" lowers the rung it aims
     for, "understand it" raises it. It never suppresses retrieval or a
     misconception repair — those are not optional difficulty. */
  function nextAction(model) {
    var now = model.now || Date.now();
    var S = E.State, K = E.KG, C = E.Content, M = E.Misconception;
    var goal = model.goal || {};
    var recent = model.recent || [];
    var state = model.state;
    var scope = K.all().filter(function (c) { return c.unit === model.unit || model.openAll; });
    if (!scope.length) scope = K.all();

    var scored = scope.map(function (c) {
      var s = state[c.id];
      var lv = s ? S.level(s, now) : null;
      return { concept: c, s: s, lv: lv };
    });

    /* 1. A belief held wrong. Interrupts whatever else was planned.

        With a cooldown, for the same reason as the probe branch: a belief the
        student keeps failing does not stop being a belief, so without one the
        engine would deliver the same repair for the whole session and never
        let them try anything. The repair is delivered once; the next two
        observations are ordinary evidence about whether it took.

        The cooldown paces *re-delivery*. It is deliberately not a claim that
        the belief is gone — see State.evidence, which is the only place a
        repair is recorded, and which records it as history rather than as
        capability. A belief that was repaired and never challenged stays a
        belief; a belief that was repaired and then answered correctly retires
        on the evidence, not on the clock. */
    /* Repair is only for a belief that has been *named*: one the evidence
       points to more strongly than to anything else. A wrong answer to a
       concept whose engine has authored hypotheses will, by construction,
       make the winning hypothesis "most likely" even when it is really just
       the least wrong of the lot — and repairing on that is how an engine
       ends up narrating a belief the student never held. An *unexplained*
       error is not repaired here; it goes to the probe branch below, which is
       what it is for. */
    var mis = scored.filter(function (x) { return !!(x.s && x.s.misconceptionNamed); })
      .filter(function (x) { return !recentlyAsked(x.s, ACTION.REPAIR, REPAIR_PATIENCE); });
    if (mis.length) {
      mis.sort(function (a, b) {
        return (b.s.misconception.p - a.s.misconception.p) ||
               (E.State.informationGain(b.s, now) - E.State.informationGain(a.s, now));
      });
      var m0 = mis[0];
      var rep = M.repairFor(m0.s);
      if (rep) {
        /* Filter the discriminating pool against what was just served, so a
           belief that has two candidate probes alternates between them rather
           than re-serving the one that was on the screen a moment ago. */
        var probePool = C.all().filter(function (i) { return recent.indexOf(i.id) === -1; });
        var probe = M.discriminating(rep.misconception, probePool, model.seed);
        var tasks = unseen(C.forConcept(m0.concept.id, "task"), recent);
        var want = probe ? probe.id : (tasks[0] || {}).id;
        if (want) {
          /* A repair the student has already survived twice is not a repair
             any more — it is a sign the explanation was not the thing they
             needed. The ladder deepens instead, and says why, because
             repeating the same words at the same volume is the standard way a
             system loses a student who was about to get it. */
          var tried = m0.s.repairs || 0;
          var scaffold = tried >= 2 ? "explanation" : tried === 1 ? "partial" : "cue";
          return finish(model, {
            action: ACTION.REPAIR,
            concept: m0.concept, itemId: want, rep: "symbolic", scaffold: scaffold,
            priority: "misconception", repair: true,
            reason: REASON.REPAIR_REQUIRED,
            why: "Named belief: " + rep.misconception.belief + " (evidence weight " +
                 Math.round(m0.s.misconception.p * 100) + "%)" +
                 (tried ? "; the " + (tried === 1 ? "first repair has not" : tried + " repairs have not") + " taken, so the help is going deeper" : ""),
            say: rep.say, do: rep.do, level: m0.lv
          });
        }
      }
    }

    /* 2. An uncertainty worth resolving.

        This branch used to ask whether some rung's probability sat inside the
        band 0.18–0.86, which is a threshold wearing the costume of a
        criterion. It failed in the direction that matters: a concept the
        engine knew *nothing* about was excluded outright (`x.s.seen`), and a
        concept whose posterior was genuinely undecided was excluded whenever
        its probability happened to land outside a band chosen before any
        student existed. So in practice this branch almost never fired, and
        the engine went straight to practising the thing it had not measured.

        What a probe is for is narrowing a posterior. So the question is what
        one more observation would be *worth*, which `informationGain` answers
        in units of variance rather than units of pass/fail. Nothing here
        requires a rung, and nothing here rewards one. */
    var unsure = scored.filter(function (x) {
      if (!x.s || !x.s.seen) return false;
      if (recentlyAsked(x.s, ACTION.DIAGNOSTIC_PROBE, PROBE_PATIENCE)) return false;
      return E.State.informationGain(x.s, now) > PROBE_WORTH;
    });
    if (unsure.length) {
      /* Uncertainty is worth most where the answer matters most: a concept
         many others rest on beats a leaf, even at slightly lower uncertainty. */
      unsure.sort(function (a, b) {
        return probeWorth(b) - probeWorth(a);
      });
      var u = unsure[0];
      /* A diagnostic probe has to actually be a probe.

         This used to fall back to the concept's first task item, so a concept
         with no authored probe was "resolving uncertainty" by serving ordinary
         practice — the same question the branch had just served, which is why
         the engine kept putting the identical item on screen twice running.
         Serving practice is what branch 6 is for. A concept the engine cannot
         ask a discriminating question of is not probe-eligible, and that is a
         content gap for Teacher.plan to report rather than something to paper
         over with a question that was never going to settle anything.

         Filtered strictly, not through `unseen`, whose "never return nothing"
         fallback hands back the full list when every probe was just served.
         For a concept with one authored probe that meant the probe a repair
         had put on screen a moment ago was served again as a diagnosis — the
         same item twice in three steps, in about 1 run in 50 of test.js. A
         probe the student has just seen settles nothing new, so the branch
         yields instead. */
      var probes = C.forConcept(u.concept.id, "probe").filter(function (i) { return fresh(recent, i.id); });
      var probeIt = probes[0];
      if (probeIt) {
        var uRep = chosenRep(u, model);
        var gain = E.State.informationGain(u.s, now);
        return finish(model, {
          action: ACTION.DIAGNOSTIC_PROBE,
          concept: u.concept, itemId: probeIt.id, rep: uRep,
          scaffold: "none", priority: "probe",
          reason: REASON.PROBE_INFORMATION_GAIN,
          why: "One more answer would narrow this by " + Math.round(gain * 100) +
               "% — " + u.concept.name + " is at " + (u.lv ? u.lv.name : "no level") +
               " and the engine does not yet know which way",
          level: u.lv
        });
      }
    }

    /* 3. An entry point on an unmet dependency chain. */
    var entry = entryPoint(state, K, scope, now, goal);
    /* A concept the student is *already failing at* outranks the dependency
       walk, even though its own prerequisites are unmet. The walk exists to
       find the bottom of an untaught chain, not to abandon a concept someone
       has already started: sending a student who has just got `distribute`
       wrong four times back to `var` is how a system loses them, and it
       contradicts the representation-switching rule the whole file argues for
       — the right response to failing here is a different way of showing
       *this*, not a detour to somewhere easier. */
    var stuckHere = scored.filter(function (x) {
      return x.s && x.s.seen && !E.Policy.met(state, x.concept, now) &&
             (x.s.recentWrong || 0) >= 1;
    });
    var rescue = null;
    if (stuckHere.length) {
      stuckHere.sort(function (a, b) {
        return (b.s.recentWrong - a.s.recentWrong) ||
               candRank(b.concept, b.s, b.lv, now, goal, model.seed) -
               candRank(a.concept, a.s, a.lv, now, goal, model.seed);
      });
      rescue = stuckHere[0];
    }
    var target = rescue || entry;
    if (target) {
      var eItems = unseen(C.forConcept(target.concept.id, "task"), recent)
        .concat(C.forConcept(target.concept.id, "interact")).filter(Boolean);
      var eIt = eItems[0];
      if (eIt) {
        var eRep = chosenRep(target, model);
        return finish(model, {
          action: ACTION.PRACTICE,
          concept: target.concept, itemId: eIt.id, rep: eRep,
          scaffold: rescue ? scaffoldFor(rescue) : (entry.s && entry.s.seen ? "cue" : "none"),
          priority: "gap",
          reason: REASON.DEPENDENCY_ENTRY,
          why: rescue
            ? "Still wrong on " + rescue.concept.name + " (" + rescue.s.recentWrong +
              " in a row) — changing how it is shown rather than dropping it for something easier"
            : entry.blocking.length
              ? "Blocking " + entry.blocking.join(" and ") + ", which the assigned work rests on"
              : "First thing in the dependency order: " + entry.concept.name,
          level: target.s ? S.level(target.s, now) : null
        });
      }
    }

    /* 4. Retrieval. Overdue, worst-affected first. Independent of the goal: a
          forgotten thing is worth checking whatever the student came for. */
    var due = scored.filter(function (x) { return x.s && x.s.seen && S.isDue(x.s, now); });
    if (due.length) {
      due.sort(function (a, b) { return daysSince(b.s, now) - daysSince(a.s, now); });
      var d = due[0];
      var dRep = chosenRep(d, model);
      var dItems = unseen(C.forConcept(d.concept.id, "retrieve"), recent)
        .concat(C.forConcept(d.concept.id, "task"));
      if (dItems[0]) {
        return finish(model, {
          action: ACTION.RETENTION_CHECK,
          concept: d.concept, itemId: dItems[0].id, rep: dRep,
          scaffold: "none", priority: "retrieval",
          reason: REASON.RETENTION_DUE,
          gapDays: daysSince(d.s, now),
          why: "Last seen " + daysSince(d.s, now) + " days ago at " +
               (d.lv ? d.lv.name : "some level") + " — checking it survived",
          level: d.lv
        });
      }
    }

    /* 5. Transfer. Not a reward for mastery — a measurement of it.

          This branch had two defects, and they compounded.

          The first was the gate. It required `lv.rank >= 3`, so a transfer
          probe could only ever be asked of a student who had already reached
          Proficient — and since Proficient is the rung *below* Transferable,
          and the transfer dimension is what carries Transferable evidence, the
          branch was unreachable in principle for anyone the engine was still
          unsure about. It could only fire on a student it already understood.
          That inverts the purpose: the question "does this travel?" is
          precisely the question you ask when you are not yet sure.

          The second was the lookup. It searched for items whose *variants*
          were flagged `transfer`, and no item in the catalogue flags a variant
          that way — transfer is declared on the item's `dimension`. So even
          with the gate open, the branch found nothing and fell through. A
          learner is not helped by an engine that has written the question and
          then looks for it in the wrong field.

          What replaces the gate is a positive reason to ask: the concept has
          enough evidence to have a formed understanding, and no evidence yet
          about whether that understanding travels. */
    var transferable = scored.filter(function (x) {
      if (!x.s || !x.s.seen) return false;
      if (recentlyAsked(x.s, ACTION.TRANSFER_PROBE, TRANSFER_PATIENCE)) return false;
      if (x.lv && x.lv.rank >= 4) return false;                    // already known to travel
      var est = S.evidenceState(x.s, now);
      if (est.k === "insufficient") return false;                  // nothing to transfer yet
      /* "Transfer is open" means the transfer dimension has not been
         *settled*, not that its mean is below one number.

         The earlier test was `mean < 0.5`, which reads "below half" as
         "unknown" — and so treats a dimension carrying two correct novel
         applications (mean 0.76) as though it had never been asked, while
         treating a dimension nobody has touched (mean exactly 0.5) as
         maximally urgent. Both are wrong, and between them they made the
         branch unreachable: the concepts with transfer content were either
         already above the line or never had enough evidence to be considered
         at all. What the engine needs to know is whether the posterior has
         *moved* — a confident wrong answer is a settled question about
         transfer and must be answered, while an untouched dimension is the
         most urgent case there is. */
      return transferOpen(x.s);
    });
    if (transferable.length) {
      transferable.sort(function (a, b) {
        return transferWorth(b, now) - transferWorth(a, now);
      });
      /* Content is part of eligibility, checked *before* choosing. The
         branch used to pick the best candidate and then look for an item for
         it, so a concept with no transfer content — which is most of them —
         absorbed the branch and fell through to forward motion. Transfer then
         looked unreachable whenever the concept that happened to rank highest
         had nothing to ask with, which made a content gap look like a policy
         decision.

         It is also the honest thing to report. A concept the engine cannot ask
         about transfer is a gap in the authored material, and Teacher.plan is
         where that belongs; silently practising instead hides it. */
      var withContent = transferable.filter(function (x) {
        return transferItemsFor(x.concept.id, recent).length > 0;
      });
      var t = withContent.length ? withContent[0] : null;
      if (t) {
        var tIt = transferItemsFor(t.concept.id, recent)[0];
        /* The cooldown is a floor, not the whole rule. A concept with one
           transfer item would otherwise be asked about it on a fixed metronome
           — every fifth action, for the length of the session — because the
           patience window expires and the same item is the only one there is.
           Repetition on a schedule is not measurement; it is a loop with extra
           steps. So when there is genuinely nothing else to ask, the engine
           stops asking rather than returning the same question. */
        if (tIt && (recent.indexOf(tIt.id) === -1 || !onlyItemFor(t.concept.id, tIt.id))) {
        var tRep = chosenRep(t, model);
        return finish(model, {
          action: ACTION.TRANSFER_PROBE,
          concept: t.concept, itemId: tIt.id, rep: tRep,
          scaffold: "none", priority: "transfer",
          reason: REASON.TRANSFER_ELIGIBLE,
          why: t.concept.name + " is at " + (t.lv ? t.lv.name : "some level") +
               ", and nothing yet says whether that survives outside where it was taught",
          level: t.lv
        });
        }
      }
    }

    /* 6. Forward motion: the lowest un-proved rung on a concept whose
          prerequisites are met. */
    var forward = scored.filter(function (x) {
      return met(state, x.concept, now) && (!x.lv || x.lv.rank < goalCeiling(goal));
    });
    forward.sort(function (a, b) {
      return candRank(b.concept, b.s, b.lv, now, goal, model.seed) -
             candRank(a.concept, a.s, a.lv, now, goal, model.seed);
    });
    var f = null;
    /* Two passes. The first takes the best concept that also has something
       the student has not just been asked; the second relaxes that, because a
       session that opened fresh ground still has to come back and consolidate
       it. Without the split the policy either loops on one concept or refuses
       to consolidate at all. */
    for (var pass = 0; pass < 2 && !f; pass++) {
      for (var i = 0; i < forward.length && !f; i++) {
        var c = forward[i];
        var items = orderedItems(c.concept);
        var hit = items.filter(function (it) { return pass === 1 || fresh(recent, it.id); })[0];
        if (hit) f = { c: c, it: hit };
      }
    }
    if (f) {
      var fRep = chosenRep(f.c, model);
      return finish(model, {
        action: ACTION.PRACTICE,
        concept: f.c.concept, itemId: f.it.id, rep: fRep,
        scaffold: scaffoldFor(f.c),
        priority: f.c.s && f.c.s.seen ? "deepen" : "teach",
        reason: REASON.INSUFFICIENT_MASTERY_EVIDENCE,
        why: f.c.s && f.c.s.seen
          ? "Moving " + f.c.concept.name + " from " + f.c.lv.name + " towards " +
            S.RUNGS[Math.min(S.RUNGS.length - 1, f.c.lv.rank + 1)].name +
            " — the rung above this one is not yet earned by evidence"
          : "New ground: " + f.c.concept.name,
        level: f.c.lv
      });
    }

    /* Nothing to advance: the ceiling is met and nothing is due. Say so
       rather than serving filler. */
    return {
      kind: "done", priority: "satisfied", action: null,
      reason: REASON.NOTHING_DUE, at: now,
      why: "Nothing due, nothing broken, nothing unproved in this unit"
    };
  }

  /* Uncertainty is worth most where the answer matters most: a concept many
       others rest on beats a leaf, even at slightly lower uncertainty. The
       second term is what keeps a probe from monopolising a session — a
       concept nothing else depends on has to justify itself on information
       alone. */
  function probeWorth(x, now) {
    return E.State.informationGain(x.s, now) * 10 +
           Object.keys(E.KG.descendants(x.concept.id)).length;
  }

  /* How much a concept's understanding might be worth elsewhere: strong on
       the taught form, spread across more than one dimension, and resting
       under other work. A student who is only good at one thing is exactly
       the one whose understanding may not travel. */
  function transferWorth(x, now) {
    return E.State.mean(E.State.dim(x.s, "procedural")) * 2 +
           E.State.mean(E.State.dim(x.s, "conceptual")) * 2 +
           Math.min(1, E.State.totalN(x.s) / 10) +
           Object.keys(E.KG.descendants(x.concept.id)).length * 0.5;
  }

  /* ------------------------------------------------------------ Helpers

     Pacing, not policy. These are how long the engine waits before asking the
     same kind of question again, counted in observations rather than in
     minutes so that they behave identically in a session and across a gap.
     They exist to stop the engine repeating itself while it waits for
     evidence — never to decide that evidence is unnecessary. */

  /* Observations the student gets to produce between two repairs of the same
     belief. Three is the smallest number that can distinguish "the repair
     worked" from "they got lucky once": one answer is indistinguishable from
     a coin. */
  var REPAIR_PATIENCE = 3;
  /* The same, for probes. */
  var PROBE_PATIENCE = 3;
  /* And for transfer probes, which need more: transfer is the question the
     engine is least able to answer from one sitting, because a single correct
     novel application is exactly what a lucky guess also looks like. */
  var TRANSFER_PATIENCE = 4;
  /* Below this mean transfer posterior, transfer is an open question worth
     asking about. At 0.5 the dimension is exactly untouched, which is the
     normal state for a student who has only ever met the taught form. */
  var TRANSFER_MEAN_OPEN = 0.5;
  /* How sure the engine must be that transfer holds before it stops asking.
     A posterior probability rather than a mean, so one lucky answer cannot
     close the question — with n=1 the posterior is nearly flat and this stays
     far below 1 however high the mean went. */
  var TRANSFER_SETTLED_P = 0.8;
  /* Minimum information gain, in posterior-variance units, before a probe is
     worth interrupting for. Chosen to sit above the noise floor of a
     well-practised concept and below the value of a genuinely undecided one. */
  var PROBE_WORTH = 0.055;

  /* Has this concept been asked this kind of question recently enough that
     asking again would be repetition rather than measurement? Read from the
     per-action clock that State.evidence writes, so the pacing is a fact about
     the record rather than a guess reconstructed by the policy. */
  function recentlyAsked(s, action, patience) {
    var clk = s && s.askedAt;
    if (!clk) return false;
    var at = clk[action + ":seen"];
    return at != null && (s.seen - at) < patience;
  }

  /* Is this the only question of its kind for this concept? Where it is, a
     cooldown cannot prevent repetition, because there is nothing to rotate to
     — so the caller must decide whether asking again is measurement or a loop. */
  function onlyItemFor(conceptId, itemId) {
    var all = E.Policy.transferItemsFor(conceptId, []);
    return all.length <= 1 && (!itemId || all[0] && all[0].id === itemId);
  }

  /* Posterior mean on the transfer dimension. Retention is not faded here
     because transfer is not a memory claim — it is a "does it work elsewhere"
     question, and the clock has no opinion about it. */
  function transferMean(s) { return E.State.mean(E.State.dim(s, "transfer")); }

  /* Is the transfer question still open? Two distinct cases, and conflating
     them is what made this branch dead:

       never asked   n is 0 — the dimension sits at its flat prior and says
                     nothing. This is the most urgent case, not the least.
       asked, shaky  the posterior has moved but not far enough to trust.

     Settled means the posterior is both off-centre *and* concentrated, which
     is a claim about evidence volume as well as direction. A single correct
     novel application moves the mean to 0.76 while the posterior is still
     almost flat, and treating that as "transfer is fine" is exactly the
     reasoning error that lets a student pass a unit they cannot use. */
  function transferOpen(s) {
    var d = E.State.dim(s, "transfer");
    if (E.State.n(d) < 1) return true;                             // never measured
    return E.State.pAtLeast(d, TRANSFER_MEAN_OPEN) < TRANSFER_SETTLED_P;
  }

  /* Items that can actually speak to transfer for this concept.

     Transfer is declared two ways in the content, and this reads both: an item
     whose `dimension` is transfer, or an item with a variant flagged
     `transfer`. Reading only the second is what made this branch dead — it
     looked for a spelling the catalogue does not use.

     `variants` is a list of generators rather than of variants, so it is
     length-checked rather than iterated: materialising every variant of every
     item to ask a yes/no question about it would be the expensive way to learn
     something the item already states in its `dimension`. */
  function transferItemsFor(conceptId, recent) {
    var pool = E.Content.forConcept(conceptId).filter(function (i) {
      if (i.dimension === "transfer") return true;
      /* Only items that declare a transfer variant *at all* can be asked in a
         transfer context; which concrete variant gets drawn is decided later,
         by Content.make, and the observation records `transfer` from it. */
      return !!(i.transferVariants || i.hasTransferVariant);
    });
    return unseen(pool, recent);
  }

  /* What was just served. A session that asks the same concept the same way
     five times running is not adaptive, it is stuck — and a policy that
     recomputes from scratch each step will do exactly that, because the same
     weakest concept is the same weakest concept every time. */
  function fresh(recent, id) { return recent.indexOf(id) === -1; }
  function unseen(items, recent) {
    var out = items.filter(function (i) { return fresh(recent, i.id); });
    return out.length ? out : items;                    // never return nothing
  }

  /* Is a prerequisite satisfied? "Met" means the student has been seen doing
     something with it, at emerging or better. A prerequisite nobody has
     written content for is assumed rather than blocking — see KG.assumed. */
  function met(state, concept, now) {
    return concept.prereq.every(function (p) {
      var ps = state[p];
      if (ps && ps.seen && E.State.level(ps, now).rank >= 1) return true;
      return !E.Content.forConcept(p).length;              // assumed, not taught
    });
  }

  /* The first concept on an unmet chain that can actually be taught now, with
     the concepts it is blocking so the action can say why. Walks down the
     chain rather than naming its top, and stops at the first rung whose own
     foundations are already met. */
  function entryPoint(state, K, scope, now, goal) {
    var S = E.State, best = null;
    var seen = {};
    function walk(id, blocking) {
      if (seen[id]) return;
      seen[id] = 1;
      var c = K.get(id);
      if (!c) return;
      var ps = state[id];
      if (ps && ps.seen && S.level(ps, now).rank >= 1) return;      // already fine
      if (!E.Content.forConcept(id).length) return;                   // unteachable
      if (met(state, c, now)) {                                       // entry point
        var hold = Object.keys(K.descendants(id)).length;
        if (!best || hold > best.hold) best = { concept: c, s: ps, blocking: blocking, hold: hold };
        return;
      }
      c.prereq.forEach(function (p) { walk(p, blocking.concat([c.name])); });
    }
    scope.forEach(function (c) {
      if (met(state, c, now)) return;
      if (state[c.id] && S.level(state[c.id], now).rank >= goalCeiling(goal || {})) return;
      walk(c.id, []);
    });
    /* Nothing unmet in the scope: start a fresh student at the lowest rung
       that has content and rests on nothing, so the engine still moves. */
    if (!best) {
      scope.slice().sort(function (a, b) { return a.tier - b.tier || a.unit - b.unit; })
        .forEach(function (c) {
          if (best || c.prereq.length || !E.Content.forConcept(c.id).length) return;
          best = { concept: c, s: state[c.id], blocking: [], hold: 0 };
        });
    }
    return best;
  }

  function dim(s, d, now) {
    var dd = d === "retention" ? E.State.fadedRetention(s, now) : E.State.dim(s, d);
    return E.State.mean(dd);
  }
  function daysSince(s, now) { return s && s.last ? Math.round((now - s.last) / 864e5) : 0; }

  function goalCeiling(goal) { return goal.ceiling == null ? 4 : goal.ceiling; }

  function chosenRep(x, model) {
    var used = model.usedReps && model.usedReps[x.concept.id];
    var avoid = used && used.length ? used[used.length - 1] : null;
    return E.Misconception.pickRep(x.s, x.concept.reps, avoid, used, model.seed);
  }

  /* Scaffolding is a function of how stuck they are, not an author setting.
     Never met → nothing offered. Missed once → a cue. Missed again → change
     the representation, which is a different intervention entirely. */
  function scaffoldFor(x) {
    if (!x.s || !x.s.seen) return "none";
    var recentBad = x.s.recentWrong || 0;
    if (recentBad === 0) return "none";
    if (recentBad === 1) return "cue";
    return "representation";
  }

  /* Forward motion prefers an interaction, then a task, then an example. The
     interaction is the primitive; a task is the fallback for a concept whose
     executable form has not been written yet. Interactives come first within
     each kind, because a concept with three interactions and one task should
     be entered through the one you can move. */
  function orderedItems(concept) {
    return E.Content.forConcept(concept.id, "interact")
      .concat(E.Content.forConcept(concept.id, "task"))
      .concat(E.Content.forConcept(concept.id, "example"));
  }

/* How much a concept wants attention, used only to order *within* a
      priority class — never to overtake one. */
  function candRank(c, s, lv, now, goal, seed) {
    var v = (6 - c.tier) * 6 + (8 - (c.unit || 1));
    if (!s || !s.seen) v += 30;
    else {
      var w = E.State.weakest(s, now)[0];
      v += (1 - w.mean) * 20;
      v -= E.State.mean(E.State.dim(s, "independence")) * 6;
    }
    if (lv && lv.rank >= goalCeiling(goal)) v -= 40;
    /* Deterministic spread, not `Math.random()`. Two devices holding the same
       record must choose the same question, or "the engine is adaptive" is
       indistinguishable from "the engine is random". Derived from the seed and
       the concept id, so it varies between concepts but never between runs
       of the same state. */
    return v + jitter(seed, c.id);
  }

  /* Assembles the action, refusing to emit one whose representation the item
     cannot actually serve. Falls back through the item's own representations
     rather than silently showing the symbolic one and calling it a change. */
  function finish(model, a) {
    var R = model.usedReps || (model.usedReps = {});
    var item = E.Content.get(a.itemId);
    if (!item) return { kind: "none", priority: a.priority, why: a.why };
    var d = E.Content.make(a.itemId, { rep: a.rep, seed: model.seed });
    if (!d) return { kind: "none", priority: a.priority, why: a.why };
    if (!E.Content.serves(d)) {
      var want = a.rep;
      var alt = item.reps.filter(function (r) { return r !== want; });
      a.rep = alt.length ? alt[0] : item.reps[0];
      d = E.Content.make(a.itemId, { rep: a.rep, seed: model.seed });
      a.repNote = "this item has no " + want + " form, so it was shown as " + a.rep;
    }
    (R[a.concept.id] || (R[a.concept.id] = [])).push(a.rep);
    if (R[a.concept.id].length > 6) R[a.concept.id].shift();
    /* `action` and `reason` are not optional. A decision that cannot be named
       is a decision that cannot be argued with, and this file's whole claim is
       that the engine's choices are arguable. `reason` defaults to the rung
       test rather than to nothing, so an action always carries the evidence
       condition that produced it. */
    return {
      kind: "act", concept: a.concept, item: d, itemId: d.id,
      rep: a.rep, repNote: a.repNote || null,
      scaffold: a.scaffold, priority: a.priority, why: a.why,
      action: a.action || ACTION.PRACTICE,
      reason: a.reason || REASON.INSUFFICIENT_MASTERY_EVIDENCE,
      repair: !!a.repair,
      say: a.say || null, do: a.do || null, level: a.level || null,
      gapDays: a.gapDays || 0, at: model.now || Date.now()
    };
  }

  /* ============================================================== Scaffolds

     The six rungs, as promises. `cue` exposes the minimum missing reasoning
     step — never the answer. `worked` exists, is reachable, and stops the
     ladder: it is the end of help, not a step further into it. */
  var SCAFFOLDS = {
    none: { name: "Nothing", say: "" },
    cue: {
      name: "A cue",
      say: function (d) {
        return "Here is the step you skipped: " + (cueFor(d) || "name what comes next before you compute.");
      },
      cost: 0.28
    },
    representation: {
      name: "A different representation",
      say: function (d) {
        var r = E.Misconception.rep(d.rep) || { say: "try it a different way" };
        return "Same idea, shown another way — " + r.say + ".";
      },
      cost: 0.16
    },
    partial: {
      name: "Partial structure",
      say: function (d) {
        return "Set out like this: " + ((d.variant && d.variant.scaffold) || "first step, then the second, then check it.");
      },
      cost: 0.16
    },
    explanation: {
      name: "The idea",
      say: function (d) { return d.item.explain || "Read this, then try the next one yourself."; },
      cost: 0.07
    },
    worked: {
      name: "The whole thing",
      say: function (d) {
        return "Here it is fully worked: " + ((d.variant && d.variant.why) || d.item.why || "(no worked solution written)");
      },
      cost: 0.03, terminal: true
    }
  };
  function cueFor(d) {
    if (d.item.cue) return typeof d.item.cue === "function" ? d.item.cue(d.variant) : d.item.cue;
    return (d.variant && d.variant.hints && d.variant.hints[0]) || null;
  }
  /* Ask for one more rung. Returns null when the ladder is exhausted, and
     the caller records that reaching here cost independence evidence. */
  function escalate(scaffold) {
    var i = LADDER.indexOf(scaffold);
    if (i < 0 || i >= LADDER.length - 1) return null;
    return LADDER[i + 1];
  }

  E.Policy = {
    LADDER: LADDER, SCAFFOLDS: SCAFFOLDS, goalCeiling: goalCeiling,
    REASON: REASON, ACTION: ACTION,
    REPAIR_PATIENCE: REPAIR_PATIENCE, PROBE_PATIENCE: PROBE_PATIENCE,
    TRANSFER_PATIENCE: TRANSFER_PATIENCE, TRANSFER_MEAN_OPEN: TRANSFER_MEAN_OPEN,
    TRANSFER_SETTLED_P: TRANSFER_SETTLED_P, PROBE_WORTH: PROBE_WORTH,
    transferItemsFor: transferItemsFor, transferOpen: transferOpen,
    nextAction: nextAction, escalate: escalate, ladderAt: ladderAt,
    cueFor: cueFor, met: met, entryPoint: entryPoint
  };
})(typeof window !== "undefined" ? window : globalThis);
