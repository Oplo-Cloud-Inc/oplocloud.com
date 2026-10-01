/* ==========================================================================
   OEdu learning engine — the content store.

   Content is not pages. A page is a container somebody drew once, and it is
   the reason a student's understanding gets described in the vocabulary of
   whoever wrote the page. Here every piece of instructional material is an
   atomic object with an address:

     { id, kind, concept, dimension, reps, variants, hints, tell, ... }

   and every one of them can be handed to a student on its own, without the
   page it was written on. That is what makes the engine adaptive: it can
   show a single concept explanation, one worked example, one misconception
   repair, or one assessment item, and none of those needs the others to be
   sensible.

   The kinds:
     explain     names the idea, in the representation asked for
     example     a worked instance, step by step
     interact    an executable interaction — the primitive everything else
                 is built around (see docs/OEDU_LEARN_BY_DOING_BENCHMARK.md)
     task        a problem with a checkable answer
     probe       a question designed to discriminate between hypotheses
     repair      what to say to a named misconception
     retrieve    a delayed re-surface after a gap
     assess      an independent-production item

   Items carry `variants`: generators, not instances. A skill with one hard-
   coded example teaches one example. Every `gen(R)` receives a seeded
   random source and returns a fresh item each time, which is what makes
   "five problems a sitting" mean five different problems.

   `tell` on a task is what the misconception engine matches against: the
   student's actual wrong value, so a signature can be a real pattern in what
   they typed rather than a guess.
   ========================================================================== */
(function (root) {
  "use strict";

  var E = (root.OPLO_ENGINE = root.OPLO_ENGINE || {});

  var KINDS = ["explain", "example", "interact", "task", "probe", "repair", "retrieve", "assess"];

  /* Seeded random, so a variant can be regenerated identically on another
     device and two students can be given the same problem on purpose. */
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return {
      seed: s,
      next: function () {
        s ^= s << 13; s >>>= 0;
        s ^= s >> 17;
        s ^= s << 5; s >>>= 0;
        return s / 4294967296;
      },
      int: function (lo, hi) { return lo + Math.floor(this.next() * (hi - lo + 1)); },
      nz: function (lo, hi) { var v; do { v = this.int(lo, hi); } while (v === 0); return v; },
      sign: function () { return this.next() < 0.5 ? -1 : 1; },
      pick: function (a) { return a[Math.floor(this.next() * a.length)]; },
      chance: function (p) { return this.next() < p; },
      shuffle: function (a) {
        var b = a.slice();
        for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(this.next() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
        return b;
      }
    };
  }

  var ITEMS = {};

  function define(items) {
    (Array.isArray(items) ? items : [items]).forEach(function (it) {
      if (!it || !it.id) throw new Error("content: an item needs an id");
      if (KINDS.indexOf(it.kind) === -1) it.kind = "task";
      if (!it.reps || !it.reps.length) it.reps = ["symbolic"];
      if (it.discriminates) it.discriminates = asArray(it.discriminates);
      it.variants = asArray(it.variants);
      it.hints = asArray(it.hints);
      ITEMS[it.id] = it;
    });
    return ITEMS;
  }
  function asArray(x) {
    if (x == null) return [];
    return Array.isArray(x) ? x.filter(Boolean) : [x];
  }

  function get(id) { return ITEMS[id] || null; }
  function all() { return Object.keys(ITEMS).map(function (k) { return ITEMS[k]; }); }
  function where(q) {
    return all().filter(function (it) {
      for (var k in q) {
        var want = q[k], got = it[k];
        if (Array.isArray(want)) { if (want.indexOf(got) === -1 && (!got || want.indexOf(got) === -1)) return false; }
        else if (got !== want) return false;
      }
      return true;
    });
  }
  function forConcept(id, kind) {
    return all().filter(function (it) {
      return it.concept === id && (!kind || it.kind === kind);
    });
  }

  /* ------------------------------------------------------- Materialising

     An item is a template; a *delivery* is one instance of it with a
     concrete representation, a concrete variant, and the scaffolding the
     policy has decided is allowed. Keeping the two apart is what lets the
     same item be shown three times in three forms without being three
     authored objects.

     `variant` is the seeded draw, kept on the delivery so a hint, a
     "show me", and a re-ask after a hint all refer to the same numbers
     rather than to three different problems. */
  function make(id, opts) {
    opts = opts || {};
    var it = get(id);
    if (!it) return null;
    var seed = opts.seed != null ? opts.seed : (Math.floor(Math.random() * 0xffffffff) >>> 0);
    var R = rng(seed);
    var rep = opts.rep || it.reps[0];
    var v = null;
    if (it.variants.length) {
      var which = Math.floor(R.next() * it.variants.length);
      try { v = it.variants[which](R); } catch (e) { v = null; }
    }
    return {
      item: it, id: id, seed: seed, rep: rep, variant: v,
      concept: it.concept, kind: it.kind, dimension: it.dimension || "compute",
      scaffold: opts.scaffold || "none",
      maxHint: it.hints.length,
      variantKey: it.variants.length + ":" + seed
    };
  }

  /* A delivery is decided-useless if the policy could not find a variant
     that works for the representation asked for. Reported rather than
     hidden: a representation gap is a content gap, and saying so is more
     useful than quietly serving the symbolic one. */
  function serves(d) {
    return !!(d && d.item && d.item.reps.indexOf(d.rep) !== -1);
  }

  function reset() { ITEMS = {}; }

  E.Content = {
    KINDS: KINDS, rng: rng,
    define: define, get: get, all: all, where: where, forConcept: forConcept,
    make: make, serves: serves, reset: reset
  };
})(typeof window !== "undefined" ? window : globalThis);
