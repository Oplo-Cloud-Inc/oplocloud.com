/* ==========================================================================
   OEdu learning engine — the loop.

   Model the student → choose the experience → observe evidence → update the
   model → repair → increase complexity → test transfer → verify retention.
   One loop, and everything in the other files serves it.

   The engine's job is to answer four questions, continuously and
   defensibly, and `report()` is where it does so:

     What does this student understand?   per concept, the rung claimed,
                                          the posterior behind it, and the
                                          evidence lines that produced it
     What evidence supports that belief? the ledger, with scaffold level and
                                          whether the form was fresh
     What are they missing?               the weakest dimension per concept,
                                          and the gaps in the dependency
                                          graph the assigned work rests on
     What next?                           the action, with its reasons

   Nothing in the engine invents curriculum. Every concept, prerequisite,
   misconception, representation and item is authored (see alg1u1.js); the
   engine decides *which* of them to show and *how much help* to give. If it
   has no content for a concept it says the concept is untaught rather than
   generating a plausible-looking question about it.

   Storage is local-first with merge-never-replace, matching sync.js: the
   record is written locally on every observation, merged per concept, and
   pushed under a progress scope so it follows the student between devices.
   ========================================================================== */
(function (root) {
  "use strict";

  var E = (root.OPLO_ENGINE = root.OPLO_ENGINE || {});

  function Engine(opts) {
    opts = opts || {};
    this.scope = opts.scope || "alg1:u1";
    this.key = "oplo.engine." + (opts.person || "anon") + "." + this.scope;
    this.state = {};
    this.load();
  }

  Engine.prototype.load = function () {
    try {
      var raw = root.localStorage && root.localStorage.getItem(this.key);
      this.state = raw ? JSON.parse(raw) : {};
    } catch (e) { this.state = {}; }
    if (!this.state || typeof this.state !== "object") this.state = {};
  };
  Engine.prototype.save = function () {
    var self = this;
    try { root.localStorage && root.localStorage.setItem(this.key, JSON.stringify(this.state)); }
    catch (e) { /* private or full: the session works, it just forgets */ }
    if (Engine.changed) { try { Engine.changed(this.scope, this.state); } catch (e) { /* listener's problem */ } }
  };

  Engine.prototype.s = function (id) {
    if (!this.state[id]) this.state[id] = E.State.fresh(id);
    return this.state[id];
  };
  Engine.prototype.has = function (id) { return !!this.state[id] && !!this.state[id].seen; };

  /* Merge another device's record in. Per concept, whole-state, most
     observations wins — see State.merge for why a state is never mixed. */
  Engine.prototype.adopt = function (other) {
    other = other || {};
    Object.keys(other).forEach(function (id) {
      if (!other[id] || !other[id].seen) return;
      self_merge(this, id, other[id]);
    }.bind(this));
    this.save();
    return this;
  };
  function self_merge(self, id, incoming) {
    self.state[id] = E.State.merge(self.state[id] || E.State.fresh(id), incoming);
  }
  Engine.prototype.mergeIn = self_merge;

  Engine.prototype.level = function (id, now) {
    return E.State.level(this.has(id) ? this.state[id] : null, now || Date.now());
  };

  /* ============================================================ Observing

     One student action. This is the only way the model changes, which is
     what makes the report defensible: every number in it is downstream of a
     call to this function and nothing else.

     `ev` is the observation as the UI saw it:
       { concept, item, kind, dimension, scaffold, rep, believed, ms, at }

     The engine fills in what it can know for itself — whether the form was
     fresh, whether this was a retrieval after a gap — because those are
     model facts and asking the caller would let a bug in the caller quietly
     inflate a student's independence score. */
  Engine.prototype.observe = function (ev) {
    var now = ev.at || Date.now();
    var s = this.s(ev.concept);
    var e = {
      concept: ev.concept, task: ev.item || null,
      kind: ev.kind || "wrong",
      dimension: ev.dimension || null,
      scaffold: ev.scaffold || "none",
      rep: ev.rep || "symbolic",
      believed: ev.believed == null ? null : ev.believed,
      ms: ev.ms == null ? null : ev.ms,
      at: now,
      fresh: this.wasFresh(ev),
      gap: s.last ? (now - s.last) / 864e5 : 0,
      retrieval: !!ev.retrieval,
      transfer: !!ev.transfer
    };
    /* Whatever the item said the engine should look at, passed straight
       through. A misconception signature matches on the value the student
       actually produced — the digit-concatenation, the sign that came out
       wrong, the value that was right for a different x — and dropping these
       on the floor silently turns every diagnosed error into an unexplained
       one, which is the failure mode the whole file exists to prevent. Items
       may also add their own signature fields; nothing is filtered. */
    Object.keys(ev).forEach(function (k) {
      if (k in e) return;
      e[k] = ev[k];
    });
    /* The engine reads the item's own kind, and the action it itself issued,
       rather than trusting the caller to describe either. A probe asked under
       any other label would escape the probe cooldown and be asked forever;
       a repair the caller forgot to flag would be delivered every step of a
       session. Both are engine facts, so the engine keeps them. */
    var item = E.Content.get(ev.item);
    e.probe = !!(item && item.kind === "probe");

    /* `repair` is an explicit event attribute, and it is the difference
       between student evidence and an engine decision. The caller is
       authoritative: `true` is an engine-issued repair, `false` is explicitly
       not one, and only `undefined` — a caller that has never heard of the
       flag — falls back to inferring it from the previous action.

       Inferring when the caller has already answered is how one repair becomes
       an infinite loop: the observation after a repair is itself tagged a
       repair, which re-arms the cooldown, which delays the very evidence that
       would have retired the belief. And the fallback stays narrow on purpose
       — same item, same concept — so a legacy caller that never sets the flag
       still paces repairs rather than repeating one forever. */
    var last = this.last;
    e.repair = typeof ev.repair === "boolean"
      ? ev.repair
      : !!(last && last.repair && last.itemId === ev.item && last.concept.id === ev.concept);

    /* The action the caller was answering, kept on the record so a report can
       say what the engine was doing when the evidence arrived, and so the
       per-action pacing clock in State.evidence is written from the action
       actually issued rather than from a label the caller chose. */
    e.action = typeof ev.action === "string" ? ev.action
      : (last && last.concept && last.concept.id === ev.concept && last.action) || null;

    E.State.evidence(s, e, now);
    E.Misconception.diagnose(s, e, now);
    this.save();
    return s;
  };

  /* Freshness is about whether the *form* was new, not whether the numbers
     were. Ten different problems in one shape is one piece of evidence about
     procedure and none about transfer, and the engine has to know that
     difference or the transfer rung will be granted on repetition. */
  Engine.prototype.wasFresh = function (ev) {
    var s = this.state[ev.concept];
    if (!s || !s.seen) return true;
    var n = 0;
    s.ledger.forEach(function (l) { if (l.rep === (ev.rep || "symbolic")) n++; });
    return !(n && n >= 3);
  };

  /* ============================================================= Deciding */
  Engine.prototype.next = function (opts) {
    opts = opts || {};
    this.last = E.Policy.nextAction({
      state: this.state, now: opts.now || Date.now(),
      unit: opts.unit, goal: opts.goal, openAll: opts.openAll,
      recent: opts.recent || [], usedReps: this.usedReps || (this.usedReps = {}),
      seed: opts.seed
    });
    return this.last;
  };

  /* ============================================================= Hinting
     A hint is an intervention with a cost, so taking one is itself evidence:
     it lowers what the eventual correct answer is allowed to prove. The UI
     asks for the next rung rather than the whole ladder at once, so the
     model records exactly how much help was consumed. */
  Engine.prototype.hint = function (action) {
    if (!action || !action.item) return null;
    var i = E.Policy.LADDER.indexOf(action.scaffold);
    var next = E.Policy.ladderAt(i + 1);
    if (next === action.scaffold) return null;              // ladder already spent
    var d = E.Policy.SCAFFOLDS[next];
    return {
      scaffold: next,
      name: d.name,
      terminal: !!d.terminal,
      say: typeof d.say === "function" ? d.say(action.item) : (d.say || "")
    };
  };

  /* ============================================================= Reporting
     The four questions, answered from the model and nothing else. */
  Engine.prototype.report = function (opts) {
    opts = opts || {};
    var now = opts.now || Date.now();
    var K = E.KG;
    var concepts = K.all().filter(function (c) { return opts.unit == null || c.unit === opts.unit; });

    var rows = concepts.map(function (c) {
      var s = this.has(c.id) ? this.state[c.id] : null;
      var lv = E.State.level(s, now);
      return {
        id: c.id, name: c.name, blurb: c.blurb,
        rung: lv.name, rank: lv.rank, p: lv.p, say: lv.say,
        why: lv.reasons,
        weakest: s ? E.State.weakest(s, now).slice(0, 2) : [],
        uncertainty: s ? E.State.uncertainty(s) : null,
        /* How much evidence there is, as distinct from how good it looks.
           These are different questions and the report used to conflate them:
           a rung says what the engine believes, this says how much it has
           grounds to believe it, and a teacher asking "how much of this do
           you actually know?" is asking the second. */
        evidenceState: E.State.evidenceState(s, now).k,
        evidenceN: E.State.evidenceState(s, now).n,
        informationGain: s ? E.State.informationGain(s, now) : 1,
        /* Repair is history, not capability — reported so a teacher can see
           how many times something has been re-explained, and separately
           whether the student has since answered it correctly. */
        repairs: s ? (s.repairs || 0) : 0,
        repairsResolved: s ? (s.repairResolved || 0) : 0,
        evidence: s ? s.ledger.slice(-5).reverse() : [],
        seen: s ? s.seen : 0, right: s ? s.right : 0, wrong: s ? s.wrong : 0,
        misconception: s && s.misconception ? this.misconceptionLine(s) : null,
        transfer: s ? E.State.mean(E.State.dim(s, "transfer")) : 0,
        independence: s ? E.State.mean(E.State.dim(s, "independence")) : 0,
        retention: s ? E.State.mean(E.State.fadedRetention(s, now)) : 0,
        reps: s ? s.reps : {},
        due: s ? s.due : null,
        blocking: Object.keys(K.descendants(c.id)).length
      };
    }.bind(this));

    var gaps = K.gaps(this.state, function (id) { return this.has(id) ? E.State.level(this.state[id], now) : null; }.bind(this));

    var ranked = rows.slice().sort(function (a, b) { return b.rank - a.rank || b.p - a.p; });
    var understood = ranked.filter(function (r) { return r.rank >= 3; });
    var shaky = ranked.filter(function (r) { return r.rank >= 1 && r.rank < 3; });
    var untaught = ranked.filter(function (r) { return r.rank === 0; });
    var beliefs = rows.filter(function (r) { return r.misconception; });
    var undecided = rows.filter(function (r) { return r.uncertainty != null && r.uncertainty > 0.34 && r.seen > 0; });

    return {
      at: now,
      understood: understood, shaky: shaky, untaught: untaught,
      beliefs: beliefs, undecided: undecided, rows: rows, gaps: gaps,
      counts: {
        concepts: rows.length,
        understood: understood.length,
        shaky: shaky.length,
        untaught: untaught.length,
        beliefs: beliefs.length,
        evidence: rows.reduce(function (a, r) { return a + r.seen; }, 0),
        scaffolded: rows.reduce(function (a, r) {
          return a + r.evidence.filter(function (l) { return l.scaffold && l.scaffold !== "none"; }).length;
        }, 0)
      },
      transferGaps: rows.filter(function (r) { return r.rank >= 3 && r.transfer < 0.5; })
    };
  };

  /* A belief in words a person can act on: what they think, how sure we are,
     and what would correct it. */
  Engine.prototype.misconceptionLine = function (s) {
    var m = s.misconception;
    if (!m) return null;
    var def = E.Misconception.all().filter(function (x) { return x.id === m.id; })[0];
    return {
      id: m.id,
      name: def ? def.name : "unexplained error",
      belief: def ? def.belief : null,
      repair: def && def.repair ? def.repair.say : null,
      p: m.p,
      named: !!s.misconceptionNamed,
      suspect: !!s.misconceptionSuspect
    };
  };

  /* A short, honest paragraph. Used by the console and by anyone who asks
     what the system believes, in the system's own words. */
  Engine.prototype.explain = function (id, now) {
    now = now || Date.now();
    var s = this.has(id) ? this.state[id] : null;
    var c = E.KG.get(id);
    if (!c) return "No such concept: " + id;
    var lv = E.State.level(s, now);
    if (!s || !s.seen) return c.name + ": nothing observed yet. Nothing is claimed about it.";
    var w = E.State.weakest(s, now)[0];
    var lines = [
      c.name + " is judged " + lv.name.toLowerCase() + ", with " + Math.round(lv.p * 100) +
        "% confidence on that rung (" + lv.reasons.join("; ") + ").",
      "It rests on " + s.seen + " observation" + (s.seen === 1 ? "" : "s") + ": " +
        s.right + " right, " + s.wrong + " wrong, of which " +
        s.ledger.filter(function (l) { return l.scaffold && l.scaffold !== "none"; }).length +
        " taken with help.",
      "Weakest dimension is " + w.dim + " at " + Math.round(w.mean * 100) + "% (" +
        s.wrong + " failures contribute to it).",
      "Holds up in " + Object.keys(s.reps).filter(function (r) {
        var h = s.reps[r];
        return h.right + h.wrong >= 2 && h.right / (h.right + h.wrong) > 0.7;
      }).join(", ") + "."
    ];
    if (s.misconception) lines.push(this.misconceptionLine(s).belief
      ? "Belief under test: " + this.misconceptionLine(s).belief
      : "An error is unexplained — the engine will probe rather than guess.");
    if (s.repairs) {
      lines.push("Repaired " + s.repairs + " time" + (s.repairs === 1 ? "" : "s") +
        (s.repairResolved
          ? ", and answered correctly " + s.repairResolved + " of those since."
          : ", none of which has yet been answered correctly."));
    }
    var es = E.State.evidenceState(s, now);
    lines.push("Evidence is " + es.k.replace("_", " ") + " (" + es.n +
      " weighted observations) — one more answer would narrow this by " +
      Math.round(E.State.informationGain(s, now) * 100) + "%.");
    return lines.join(" ");
  };

  /* Merge two records without either being authoritative — what sync does. */
  Engine.merge = function (a, b) {
    var out = {};
    var ids = Object.keys(a || {}).concat(Object.keys(b || {}));
    ids.forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(out, id)) return;
      var x = a && a[id], y = b && b[id];
      out[id] = x && y ? E.State.merge(x, y) : (x || y);
    });
    return out;
  };

  function reset() { E.KG.reset(); E.Content.reset(); }
  Engine.reset = reset;
  Engine.changed = null;                 // set by the host to push to the server

  E.Engine = Engine;
})(typeof window !== "undefined" ? window : globalThis);
