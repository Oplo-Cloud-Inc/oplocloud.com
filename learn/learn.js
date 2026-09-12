/* ==========================================================================
   The learning engine.

   A quiz engine knows whether you answered correctly. A learning engine knows
   something harder and more useful: whether you understand it, whether you
   will still understand it next week, and whether you got there yourself.

   Those are different questions, and the difference is the whole file. A
   student who scores 90% with no help has not done the same thing as a
   student who scores 90% after three hints, and a system that records both as
   0.9 has thrown away the only interesting part.

   So every concept carries a state with five dimensions, not one number:

     RECOGNISE  can you pick it out of four
     RECALL     can you produce it from nothing
     EXPLAIN    can you say it in your own words
     APPLY      can you use it on a case you have not seen
     TRANSFER   can you predict something the text never mentioned

   Mastery is the weighted floor of those, not their average — because an
   average lets a student who recognises perfectly and can apply nothing call
   itself 70% done. Retention is separate again: it decays with time and is
   only repaired by answering correctly after a gap, which is the one thing
   that cannot be faked in a single sitting.

                        answer
                          |
                    ┌─────┴─────┐
                 correct      wrong
                    |           |
              raise the     find the
              dimension   misconception
                    |           |
                    └─────┬─────┘
                          |
                   update the state
                          |
                  ┌───────┴───────┐
              schedule         choose the
              next review      next question
   ========================================================================== */
window.OPLO_LEARN = (function () {
  "use strict";

  /* --------------------------------------------------------------- Levels
     The order is a ladder of cognitive demand, not of difficulty. A hard
     recognition question is still recognition. */
  var LEVELS = [
    { k: "recognise", n: 0, name: "Recognise", verb: "Pick it out",
      say: "You can find it among things that look like it.", weight: 1 },
    { k: "recall", n: 1, name: "Recall", verb: "Produce it",
      say: "You can produce it with nothing to choose from.", weight: 1.4 },
    { k: "explain", n: 2, name: "Explain", verb: "Say it yourself",
      say: "You can put it in your own words.", weight: 1.8 },
    { k: "apply", n: 3, name: "Apply", verb: "Use it",
      say: "You can use it on a case you have not seen.", weight: 2.2 },
    { k: "transfer", n: 4, name: "Transfer", verb: "Predict with it",
      say: "You can reason about something the text never mentioned.", weight: 2.6 }
  ];
  var BY_K = {};
  LEVELS.forEach(function (l) { BY_K[l.k] = l; });
  function level(k) { return BY_K[k] || LEVELS[0]; }

  /* ---------------------------------------------------------------- Bands
     Six states rather than mastered/not, because "you are getting there" is
     a true and useful thing to be told, and a binary cannot say it. */
  var BANDS = [
    { k: "new", name: "New", at: 0, hue: "#c7c7cc",
      say: "Not started." },
    { k: "exposed", name: "Exposed", at: 0.08, hue: "#a1a1a6",
      say: "Seen once. Nothing has stuck yet." },
    { k: "familiar", name: "Familiar", at: 0.3, hue: "#4da3ff",
      say: "You recognise it. You could not yet produce it." },
    { k: "developing", name: "Developing", at: 0.5, hue: "#ff9f0a",
      say: "You can produce it. Using it is the next step." },
    { k: "strong", name: "Strong", at: 0.72, hue: "#34c759",
      say: "You can use it. Retention is what is left." },
    { k: "mastered", name: "Mastered", at: 0.88, hue: "#12915a",
      say: "Recalled, applied, explained, and it held after a gap." }
  ];
  function band(m) {
    var out = BANDS[0];
    BANDS.forEach(function (b) { if (m >= b.at) out = b; });
    return out;
  }

  /* ------------------------------------------------------------ The state
     One of these per concept. Everything the engine decides is decided from
     here, and it is small enough to print, which matters — a student model
     nobody can read is a student model nobody can check. */
  function fresh(key) {
    return {
      key: key,
      recognise: 0, recall: 0, explain: 0, apply: 0, transfer: 0,
      seen: 0, right: 0, wrong: 0,
      asks: {},              // how many times asked at each level, for phrasing
      recent: [],            // the last six outcomes, newest last
      hints: 0,              // hints taken, all time
      hinted: 0,             // questions where at least one hint was taken
      confident: [],         // [wasRight, howConfident] pairs
      streak: 0, miss: 0,
      first: null, last: null,
      due: null,             // when it should come round again
      gap: 0,                // the interval that produced the last success, in days
      flagged: false         // a confident wrong answer: a real misconception
    };
  }

  /* Retention decays. Not knowing that is how a study app tells you on Friday
     that you mastered something on Monday which you have in fact lost.

     The curve is deliberately gentle and deliberately not pretending to be
     Ebbinghaus fitted to this student — it is a half-life proportional to how
     well the thing was known when it was last seen. Something strong fades
     slowly; something barely learned fades in a day. */
  function retention(s, now) {
    if (!s.last) return 0;
    var base = strength(s);
    if (base <= 0) return 0;
    var days = (now - s.last) / 864e5;
    var half = 0.6 + base * 9;            // 0.6 days at nothing, ~9.6 at full
    return base * Math.pow(0.5, days / half);
  }

  /* How well it was known at the moment it was last answered — the floor of
     the dimensions, weighted, so a gap anywhere holds the number down. */
  function strength(s) {
    var total = 0, got = 0;
    LEVELS.forEach(function (l) {
      total += l.weight;
      got += l.weight * Math.min(1, s[l.k]);
    });
    return total ? got / total : 0;
  }

  /* Mastery is strength, corrected downwards for help taken and for a gap
     that has not yet been survived. Both corrections are the point: they are
     what stops a session of hint-assisted answers reading as understanding. */
  function mastery(s, now) {
    var base = strength(s);
    if (!base) return 0;
    var lean = s.seen ? s.hinted / s.seen : 0;        // hint dependency
    var held = s.gap >= 1 ? 1 : 0.9;                  // has it survived a night
    return Math.max(0, Math.min(1, base * (1 - lean * 0.3) * held));
  }

  function asked(s, lv) { return (s && s.asks && s.asks[lv]) || 0; }
  function accuracy(s) { return s.seen ? s.right / s.seen : 0; }
  function recentAccuracy(s) {
    if (!s.recent.length) return 0;
    var n = 0;
    s.recent.forEach(function (r) { if (r) n++; });
    return n / s.recent.length;
  }
  function hintDependency(s) { return s.seen ? s.hinted / s.seen : 0; }

  /* Confidence, as the student reported it, against whether they were right.
     The interesting cell is confident-and-wrong: that is not a gap, it is a
     belief, and beliefs need a different lesson from gaps. */
  function calibration(s) {
    if (!s.confident.length) return null;
    var overs = 0, unders = 0;
    s.confident.forEach(function (c) {
      if (!c[0] && c[1] >= 3) overs++;
      if (c[0] && c[1] <= 1) unders++;
    });
    return { over: overs, under: unders, n: s.confident.length };
  }

  /* ------------------------------------------------------------- Grading
     What one answer does to the model. The size of the move depends on how
     much the answer was worth: a level you have not touched moves further
     than one you have already half-proved, and help taken shrinks the move
     rather than cancelling it. */
  /* `o` is { level, right, hints, confidence, pre }.

     `pre` marks an answer given before the material was read. A correct one
     is graded normally — they knew it already, and that is worth recording —
     while a wrong one is not held against them. Everything else is the same
     answer it would otherwise be. */
  function grade(s, o, now) {
    now = now || Date.now();
    var lv = o.level || "recognise";
    var gapDays = s.last ? (now - s.last) / 864e5 : 0;

    s.seen++;
    if (s.first == null) s.first = now;
    // Counted per level, because the question builder walks its list of
    // phrasings by this number. A concept missed four times should get four
    // different questions, not four rolls of the same die.
    if (!s.asks) s.asks = {};
    s.asks[lv] = (s.asks[lv] || 0) + 1;
    s.recent.push(!!o.right);
    if (s.recent.length > 6) s.recent.shift();
    if (o.hints) { s.hints += o.hints; s.hinted++; }
    if (o.confidence != null) {
      s.confident.push([!!o.right, o.confidence]);
      if (s.confident.length > 8) s.confident.shift();
    }

    if (o.right) {
      s.right++;
      s.streak++;
      s.miss = 0;
      // Help taken caps what an answer can prove. Three hints and a correct
      // answer is a demonstration that you can follow instructions.
      var earned = o.hints >= 3 ? 0.18 : o.hints === 2 ? 0.34 : o.hints === 1 ? 0.6 : 1;
      var room = 1 - s[lv];
      s[lv] = Math.min(1, s[lv] + room * (0.55 * earned) + 0.08 * earned);
      // Getting a hard level right implies the easy ones. Not the reverse.
      var n = level(lv).n;
      LEVELS.forEach(function (l) {
        if (l.n < n) s[l.k] = Math.max(s[l.k], Math.min(1, s[lv] * 0.92));
      });
      if (gapDays >= 1) s.gap = Math.max(s.gap, gapDays);
      s.flagged = false;
    } else if (o.pre) {
      /* A prediction made before the material was taught. Getting it wrong is
         the mechanism, not a result — it is what makes the reading afterwards
         land on a question the student has already felt. So a miss here costs
         nothing: no wrong, no streak break, no dimension knocked down.

         What it does do is bring the concept forward. `miss` shortens the
         interval, which is exactly right: something you could not predict is
         something to come back to. And a confident wrong prediction is still
         a misconception — arguably the most valuable one this app can catch,
         because it was believed before anybody taught it. */
      s.miss++;
      if (o.confidence != null && o.confidence >= 3) s.flagged = true;
    } else {
      s.wrong++;
      s.streak = 0;
      s.miss++;
      s[lv] = Math.max(0, s[lv] * 0.45);
      // A wrong answer at a hard level does not erase the easy ones, but it
      // does put a ceiling on them: you cannot be said to recall something you
      // have just failed to use.
      var m = level(lv).n;
      LEVELS.forEach(function (l) {
        if (l.n < m) s[l.k] = Math.min(s[l.k], 0.82);
      });
      // Confident and wrong is a misconception, and gets said out loud.
      if (o.confidence != null && o.confidence >= 3) s.flagged = true;
    }

    s.last = now;
    s.due = nextReview(s, now);
    return s;
  }

  /* ---------------------------------------------------- Spaced repetition
     Interval grows with how well it is known and shrinks the moment it is
     missed. Deliberately simple, and deliberately anchored to real days
     rather than to positions in a queue: the thing being modelled is
     forgetting, and forgetting happens on a clock. */
  var STEPS = [0.007, 1, 2, 4, 8, 16, 30];   // ~10 minutes, then days
  function nextReview(s, now) {
    var m = mastery(s, now);
    var i = Math.round(m * (STEPS.length - 1));
    if (s.miss >= 2) i = 0;
    else if (s.miss === 1) i = Math.max(0, i - 2);
    if (s.streak >= 3) i = Math.min(STEPS.length - 1, i + 1);
    // A confident wrong answer is a belief, not a blank, and a belief left
    // alone overnight is a belief rehearsed. It comes back at the first step
    // however well the rest of the concept is known. Last, so nothing above
    // can lengthen it again.
    if (s.flagged) i = 0;
    return now + STEPS[i] * 864e5;
  }

  function due(s, now) {
    if (!s.last) return true;
    return (s.due || 0) <= (now || Date.now());
  }

  /* ------------------------------------------------------ What comes next
     The selection rule, in one place so it can be argued with.

     Priorities, in order:
       1. Anything flagged as a misconception. A wrong belief held with
          confidence costs more than a gap and is worth interrupting for.
       2. Anything overdue, worst-retention first.
       3. Anything unseen, so the session keeps opening ground.
       4. The weakest thing that is not already mastered.

     What is deliberately never chosen: something answered correctly minutes
     ago at a level already proved. A student's time is the scarce resource
     here, and asking a question whose answer is already known spends it for
     nothing. */
  function next(states, concepts, now, justSeen) {
    now = now || Date.now();
    var pool = concepts.filter(function (c) {
      var s = states[c.k];
      if (!s) return true;
      if (c.k === justSeen && concepts.length > 2) return false;
      return mastery(s, now) < 0.95 || due(s, now);
    });
    if (!pool.length) return null;

    function score(c) {
      var s = states[c.k];
      if (!s || !s.seen) return 60;                       // unseen: worth opening
      var v = 0;
      if (s.flagged) v += 100;                            // a belief to correct
      if (due(s, now)) v += 40;
      v += (1 - mastery(s, now)) * 45;
      v += (1 - retention(s, now)) * 20;
      v += s.miss * 12;
      v -= recentAccuracy(s) * 10;
      return v;
    }

    var best = null, top = -1e9;
    pool.forEach(function (c) {
      var v = score(c) + Math.random() * 6;               // a little air
      if (v > top) { top = v; best = c; }
    });
    return best;
  }

  /* The level to ask this concept at. Move up when the current one is proved;
     drop back when it is missed. Never ask a level the concept cannot
     support — a thin concept honestly stops at recall. */
  function levelFor(s, allowed, mode) {
    var can = allowed && allowed.length ? allowed : ["recognise", "recall"];
    if (!s || !s.seen) return can[0];
    if (s.miss >= 2) return can[0];
    if (s.miss === 1) {
      // Step back one from wherever they were, rather than to the floor.
      for (var d = can.length - 1; d >= 0; d--) {
        if (s[can[d]] >= 0.5) return can[Math.max(0, d - 1)];
      }
      return can[0];
    }
    // The first level not yet proved.
    for (var i = 0; i < can.length; i++) {
      if (s[can[i]] < (mode === "quick" ? 0.55 : 0.7)) return can[i];
    }
    return can[can.length - 1];
  }

  /* --------------------------------------------------------------- Goals
     What a student says they are here for changes what the session is, not
     just what it says on the first screen. */
  var GOALS = [
    { k: "test", name: "Prepare for a test", glyph: "test",
      say: "Breadth first, then the weak spots, with a timed feel.",
      mode: "test", target: 0.75, rounds: 7, ceiling: "apply" },
    { k: "understand", name: "Actually understand this", glyph: "learn",
      say: "Slower, harder questions, and you will be asked to explain yourself.",
      mode: "deep", target: 0.85, rounds: 6, ceiling: "transfer" },
    { k: "review", name: "Review what I forgot", glyph: "read",
      say: "Only what is due or shaky. Nothing you already have cold.",
      mode: "review", target: 0.8, rounds: 5, ceiling: "apply" },
    { k: "quick", name: "Learn it quickly", glyph: "star",
      say: "Recognition and recall, moving fast. Shallow on purpose.",
      mode: "quick", target: 0.55, rounds: 5, ceiling: "recall" },
    { k: "master", name: "Master this topic", glyph: "tick",
      say: "Every level, including transfer, and a teach-it-back at the end.",
      mode: "deep", target: 0.9, rounds: 8, ceiling: "transfer" },
    { k: "unsure", name: "I am not sure", glyph: "chev",
      say: "Then the diagnostic decides. That is what it is for.",
      mode: "auto", target: 0.75, rounds: 6, ceiling: "apply" }
  ];

  /* When the goal is "I am not sure", the diagnostic answers for them. The
     rule is the one a tutor would use: if almost nothing is there, start at
     the beginning; if most of it is there, this is a review. */
  function decideGoal(states, concepts, now) {
    var seen = 0, m = 0;
    concepts.forEach(function (c) {
      var s = states[c.k];
      if (s && s.seen) { seen++; m += mastery(s, now); }
    });
    if (!seen) return GOALS[3];                                  // nothing known: quick pass
    var avg = m / seen;
    if (seen < concepts.length * 0.5) return GOALS[1];           // half untouched: understand
    if (avg > 0.7) return GOALS[2];                              // mostly there: review
    return GOALS[1];
  }

  function ceilingLevels(goal, allowed) {
    var cap = level(goal.ceiling).n;
    return allowed.filter(function (k) { return level(k).n <= cap; });
  }

  /* -------------------------------------------------------------- Storage */
  function Store(personId, setId) {
    this.key = "oplo.learn." + (personId || "anon") + "." + (setId || "set");
    this.states = {};
    this.load();
  }
  Store.prototype.load = function () {
    try {
      var raw = localStorage.getItem(this.key);
      this.states = raw ? JSON.parse(raw) : {};
    } catch (e) { this.states = {}; }
    if (!this.states || typeof this.states !== "object") this.states = {};
  };
  Store.prototype.save = function () {
    var self = this;
    clearTimeout(this._t);
    this._t = setTimeout(function () {
      try { localStorage.setItem(self.key, JSON.stringify(self.states)); }
      catch (e) { /* full or private; the session still works, it just forgets */ }
    }, 150);
  };
  Store.prototype.get = function (key) {
    if (!this.states[key]) this.states[key] = fresh(key);
    return this.states[key];
  };
  Store.prototype.all = function () { return this.states; };
  Store.prototype.grade = function (key, o, now) {
    var s = grade(this.get(key), o, now);
    this.save();
    return s;
  };
  Store.prototype.wipe = function () {
    this.states = {};
    this.save();
  };

  /* ------------------------------------------------------------- Summary
     What to say at the end of a session, and on the set page before one. */
  function summary(states, concepts, now) {
    now = now || Date.now();
    var out = { mastered: [], strong: [], developing: [], weak: [], untouched: [],
                dueSoon: [], flagged: [], mastery: 0, retention: 0 };
    var m = 0, r = 0;
    concepts.forEach(function (c) {
      var s = states[c.k];
      if (!s || !s.seen) { out.untouched.push(c); return; }
      var mv = mastery(s, now);
      m += mv; r += retention(s, now);
      var b = band(mv);
      if (b.k === "mastered") out.mastered.push(c);
      else if (b.k === "strong") out.strong.push(c);
      else if (b.k === "developing") out.developing.push(c);
      else out.weak.push(c);
      if (s.flagged) out.flagged.push(c);
      if (due(s, now + 864e5)) out.dueSoon.push(c);
    });
    var n = concepts.length || 1;
    out.mastery = m / n;
    out.retention = r / n;
    return out;
  }

  /* When a concept is next worth seeing, in words a person uses. */
  function when(s, now) {
    if (!s || !s.due) return "now";
    var ms = s.due - (now || Date.now());
    if (ms <= 0) return "now";
    var mins = ms / 6e4;
    if (mins < 60) return "in " + Math.max(1, Math.round(mins)) + " min";
    var hours = mins / 60;
    if (hours < 24) return "in " + Math.round(hours) + "h";
    var days = Math.round(hours / 24);
    return days === 1 ? "tomorrow" : "in " + days + " days";
  }

  return {
    LEVELS: LEVELS, BANDS: BANDS, GOALS: GOALS,
    level: level, band: band, fresh: fresh,
    mastery: mastery, retention: retention, strength: strength,
    accuracy: accuracy, recentAccuracy: recentAccuracy, asked: asked,
    hintDependency: hintDependency, calibration: calibration,
    grade: grade, nextReview: nextReview, due: due,
    next: next, levelFor: levelFor, decideGoal: decideGoal,
    ceilingLevels: ceilingLevels, Store: Store, summary: summary, when: when
  };
})();
