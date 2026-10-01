/* ==========================================================================
   OEdu learning engine — the knowledge graph.

   A subject is not a list of chapters. It is a graph of concepts, each one
   held up by the concepts before it, and that graph is what the engine
   reasons over. This file holds the graph and the four questions about it
   that everything else asks:

     closure(id)      what must be understood before this
     descendants(id)  what this is holding up
     gaps(state)      where the student is missing something they need
     next(state)      what is teachable right now, in dependency order

   Two properties matter more than anything else here.

   **Curriculum independence.** A school assigns Algebra 1 as
   Units 1, 2, 3, 4, 5. The graph knows that negative coefficients are
   discovered in Unit 1 and needed again in Unit 4. Those are different
   facts and the engine keeps them apart: `unit` says where a school meets
   it, `prereq` says what it actually depends on. When the assigned order
   and the dependency order disagree, the assigned order still governs what
   a student is *asked* to do, and the dependency order governs what the
   engine is willing to assume they have. A gap is repaired inside whatever
   unit is open, not by jumping the student forward into a unit they have
   not been taught.

   **No prerequisites are declared as authoritative.** A concept's `prereq`
   is an authored claim, and authored claims are wrong. `audit()` reports
   cycles, dangling references, and concepts reachable only through another
   concept's prereq — the three ways a hand-built graph quietly lies.
   ========================================================================== */
(function (root) {
  "use strict";

  var E = (root.OPLO_ENGINE = root.OPLO_ENGINE || {});

  /* ------------------------------------------------------------- Concepts

     id       stable key, survives re-authoring; never reuse one
     name     shown to a student
     tier     0 = arithmetic the student arrived with, 1 = core,
              2 = depends on a core concept, 3 = synthesis
     unit     where a school assigns it — presentation, not dependency
     prereq   ids that must be at least `functional` before this can be
              attempted. Deliberately the low bar: `emerging` is enough to
              teach against, `transferable` is not needed to use.
     blurb    one line, used in the report and in misconception messages
     reps     representations this concept has content for. The engine
              reads this to know whether it may switch representation rather
              than lower difficulty; a concept with one representation can
              only be retaught harder or re-explained.
     needs    the mastery dimensions this concept is actually assessed on.
              A concept with `needs: ["procedural"]` can be proficient
              without any conceptual evidence, and the report must say so
              rather than quietly averaging it away. */
  var C = {};

  function define(defs) {
    (Array.isArray(defs) ? defs : [defs]).forEach(function (d) {
      if (!d || !d.id) throw new Error("kg: a concept needs an id");
      if (C[d.id] && C[d.id].__locked) return;         // first definition wins
      d.prereq = d.prereq || [];
      d.reps = d.reps || ["symbolic"];
      d.tier = d.tier == null ? 1 : d.tier;
      d.unit = d.unit == null ? 1 : d.unit;
      d.needs = d.needs && d.needs.length ? d.needs : ["conceptual", "procedural"];
      d.__locked = true;
      C[d.id] = d;
    });
    return C;
  }

  function get(id) { return C[id] || null; }
  function all() { return Object.keys(C).map(function (k) { return C[k]; }); }
  function inUnit(n) { return all().filter(function (c) { return c.unit === n; }); }

  /* ------------------------------------------------- Closure and descent
     Memoised per graph shape, because the policy asks for these on every
     step of every session and the graph does not change within a session.
     The cache is dropped by audit(), which is only run by the checker. */
  var _anc = {}, _desc = {};

  function dropCache() { _anc = {}; _desc = {}; }

  function ancestors(id, acc) {
    if (_anc[id]) return _anc[id];
    acc = acc || {};
    var out = {};
    (get(id) || { prereq: [] }).prereq.forEach(function (p) {
      if (acc[p]) return;                              // cycle guard
      acc[p] = 1;
      out[p] = 1;
      Object.keys(ancestors(p, acc)).forEach(function (k) { out[k] = 1; });
    });
    _anc[id] = out;
    return out;
  }

  function descendants(id, acc) {
    if (_desc[id]) return _desc[id];
    acc = acc || {};
    var out = {};
    all().forEach(function (c) {
      if (acc[c.id]) return;
      if (c.prereq.indexOf(id) !== -1) {
        acc[c.id] = 1;
        out[c.id] = 1;
        Object.keys(descendants(c.id, acc)).forEach(function (k) { out[k] = 1; });
      }
    });
    _desc[id] = out;
    return out;
  }

  /* Depth in the graph, used only for ordering a report. Longest path down
     from a root, so a concept never appears before something it needs. */
  function depth(id, memo) {
    memo = memo || {};
    if (memo[id] != null) return memo[id];
    var c = get(id);
    if (!c || !c.prereq.length) return (memo[id] = 0);
    var d = 0;
    c.prereq.forEach(function (p) { d = Math.max(d, depth(p, memo) + 1); });
    return (memo[id] = d);
  }

  function ordered() {
    return all().sort(function (a, b) {
      return depth(a.id) - depth(b.id) || a.unit - b.unit || (a.id < b.id ? -1 : 1);
    });
  }

  /* ---------------------------------------------------------------- Gaps

     A gap is not "this concept is weak". It is "this concept is weak *and*
     something the student is about to attempt needs it". A concept nothing
     depends on and that is not assigned is allowed to stay unknown; a
     concept four others stand on is not.

     `blocking` is how many concepts downstream are held up by it, which is
     what makes repair worth interrupting a session for. */
  function gaps(state, levelAt) {
    var out = [];
    all().forEach(function (c) {
      var own = levelAt(c.id);
      var weak = !own || own.rank < 1;                  // unknown or emerging
      if (!weak) return;
      var blockers = [];
      c.prereq.forEach(function (p) {
        var pv = levelAt(p);
        if (!pv || pv.rank < 1) blockers.push(p);
      });
      var holding = Object.keys(descendants(c.id)).length;
      if (!blockers.length && !holding) return;         // nobody needs it
      out.push({ id: c.id, concept: c, own: own, blockers: blockers, holding: holding });
    });
    return out.sort(function (a, b) {
      return (b.blockers.length - a.blockers.length) || (b.holding - a.holding);
    });
  }

  /* ------------------------------------------------------------ Ordering

     What may be attempted right now: a concept is open when every concept it
     depends on is at least `emerging`, or when the engine has decided to
     repair the missing one instead. Ordering inside the open set is by tier
     then unit, so a student meets the low arithmetic first even though the
     assigned unit says otherwise. */
  function next(state, levelAt, openRank) {
    openRank = openRank == null ? 1 : openRank;
    var best = null, top = -Infinity;
    all().forEach(function (c) {
      var ok = c.prereq.every(function (p) {
        var v = levelAt(p);
        return v && v.rank >= openRank;
      });
      if (!ok) return;
      var v = levelAt(c.id);
      var score = (6 - c.tier) * 10 + (10 - (c.unit || 1));
      if (!v || v.rank === 0) score += 40;              // never met
      else if (v.rank < 3) score += 18;                 // known but not usable
      if (score > top) { top = score; best = c; }
    });
    return best;
  }

  /* --------------------------------------------------------------- Audit

     Not a type checker. These are the three failures that make an engine
     quietly teach the wrong thing, so they are worth a loud error:
       cycle      a concept that requires itself, directly or through others
       dangling   a prereq id no concept defines — a typo that silently
                  makes the concept teachable with no foundation
       orphan     a concept that declares no prerequisites at all, which for
                  anything above arithmetic tier almost always means the
                  author forgot to write them down

     A concept nothing depends on is *not* an error: a synthesis idea at the
     top of a unit is legitimately a leaf, and reporting it as a problem
     trains an author to ignore the report. `unused()` returns those
     separately, for a teacher rather than for the checker. */
  function audit() {
    var problems = [];
    all().forEach(function (c) {
      c.prereq.forEach(function (p) {
        if (!get(p)) problems.push({ kind: "dangling", id: c.id, ref: p });
      });
    });
    var colour = {};
    function visit(id, stack) {
      colour[id] = 1;
      (get(id) || { prereq: [] }).prereq.forEach(function (p) {
        if (colour[p] === 1) problems.push({ kind: "cycle", id: p, path: stack.concat([id, p]) });
        else if (!colour[p]) visit(p, stack.concat([id]));
      });
      colour[id] = 2;
    }
    all().forEach(function (c) { if (!colour[c.id]) visit(c.id, []); });
    all().forEach(function (c) {
      if (c.tier > 0 && !c.prereq.length) problems.push({ kind: "orphan", id: c.id });
    });
    dropCache();
    return problems;
  }

  /* Concepts nothing descends from — a teacher's prompt to look at them, and
     a hint that something was authored but never wired in. */
  function unused() {
    return all().filter(function (c) { return !Object.keys(descendants(c.id)).length; })
                .map(function (c) { return { id: c.id, name: c.name, tier: c.tier, unit: c.unit }; });
  }

  /* Dependencies the engine is *assuming* rather than teaching: the tier-0
     arithmetic a student supposedly arrived with. These are the places a
     curriculum independence gap actually bites, because the school has not
     assigned them and the engine is relying on them anyway. */
  function assumed() {
    var out = [];
    all().forEach(function (c) {
      c.prereq.forEach(function (p) {
        var gp = get(p);
        if (gp && gp.tier === 0) out.push({ concept: c.id, name: c.name, assumes: p, assumesName: gp.name });
      });
    });
    return out;
  }

  function reset() { C = {}; dropCache(); }

  E.KG = {
    define: define, get: get, all: all, inUnit: inUnit,
    ancestors: ancestors, descendants: descendants, depth: depth, ordered: ordered,
    gaps: gaps, next: next, audit: audit, unused: unused, assumed: assumed,
    reset: reset, dropCache: dropCache
  };
})(typeof window !== "undefined" ? window : globalThis);
