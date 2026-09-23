/* ==========================================================================
   The record.

   Until now this app remembered nothing. Learn kept a real student model in
   localStorage — five dimensions per concept, decaying retention, review
   dates — and then the rest of the app threw away everything around it the
   moment the tab closed: which terms were starred, which mistakes had been
   made, how far through the reading you were, what you did yesterday.

   That combination is worse than either extreme. A student model that knows
   you are due to review Cochlea on Thursday is useless if the app has
   forgotten by Thursday that you have ever opened the set.

   So there is one record per person, and it holds everything that is true
   about them between visits:

     m          unit mastery, four dimensions per unit
     sets       per study set: what is learned, what is starred, best times
     mistakes   every wrong answer, deduplicated and counted
     read       where you are in the reading and what you have finished
     pre        what was predicted about a unit before reading it
     rt         a section boundary still in progress
     day        what has been done today, and on which days you showed up
     game       experience, rank, streak, badges
     resume     a session you walked out of, so you can walk back into it

   Two rules govern this file.

   The first is that writing must never lose data. Every write is a
   read-modify-write of one key, debounced, and guarded — a full disk or a
   private window degrades to forgetting, never to corruption.

   The second is that this copy is written first and never waits on a
   network. It lives in this browser, under this profile, and sync.js keeps it
   in step with the student's Oplo Account — merging, never replacing — so the
   same progress is there on every device they sign in on. `merge` at the
   bottom is the whole rule for how two copies of one record become one.
   ========================================================================== */
window.OPLO_STORE = (function () {
  "use strict";

  var VERSION = 2;
  var PREFIX = "oplo.learn.rec.";

  /* Everything a person has, with every field present from the start. A
     shape that is always complete is a shape nothing has to defend against
     downstream — no field in this app is ever tested for existence. */
  function blank() {
    return {
      v: VERSION,
      m: {},                 // "courseId:unit" -> { u, p, r, a } percentages
      sets: {},              // setId -> { level, star, best, runs, seen }
      mistakes: [],
      readIx: 0,
      readUnit: "media:5",   // which unit's reader readIx points into
      readDone: {},
      // What a student predicted about a unit before reading any of it, kept
      // so the same three questions can be put back in front of them at the
      // end. The gain is the point: a prediction nobody ever returns to is a
      // quiz that wasted three questions.
      pre: {},               // "media:6" -> { right, of, at, asked: [concept] }
      // A section boundary still in progress. Without it, leaving the
      // retrieval screen and coming back rebuilt the questions and graded
      // every answer a second time — after the student had been free to
      // reread the passage in between.
      rt: {},                // "media:6:6.1" -> { ids, cards, check }, or { done, at } once closed
      doneToday: {},
      citeStyle: "mla",
      game: {
        xp: 0,               // all time
        today: 0,            // reset when the day turns
        day: null,           // the day `today` belongs to, as YYYY-MM-DD
        streak: 0,
        best: 0,             // longest streak ever run
        days: {},            // YYYY-MM-DD -> xp earned, for the calendar
        badges: {},          // key -> when it was earned
        goal: 60             // xp a day, changeable
      },
      resume: {},            // setId -> a Learn session walked out of
      epoch: 0,              // when this record was last reset; a newer reset wins a merge outright
      first: null,           // when this record was created
      last: null             // when it was last written
    };
  }

  /* Days are local, not UTC. A student in Los Angeles finishing at 11pm has
     studied today, and a streak that disagrees is a streak nobody trusts. */
  function today(now) {
    var d = new Date(now || Date.now());
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }
  function daysBetween(a, b) {
    if (!a || !b) return null;
    var pa = a.split("-").map(Number), pb = b.split("-").map(Number);
    var da = new Date(pa[0], pa[1] - 1, pa[2]);
    var db = new Date(pb[0], pb[1] - 1, pb[2]);
    return Math.round((db - da) / 864e5);
  }

  /* ------------------------------------------------------------- Migration
     An older record is upgraded rather than discarded. Throwing away a
     student's history because a field was added is not a thing this app is
     allowed to do, so every version knows how to become the next one. */
  function migrate(d) {
    if (!d || typeof d !== "object") return blank();
    var out = blank();
    // Copy across anything recognised, leaving the defaults where a field is
    // missing. This is deliberately field-by-field rather than a merge: an
    // unknown key from a future version should not survive a downgrade.
    if (d.m && typeof d.m === "object") out.m = d.m;
    if (d.sets && typeof d.sets === "object") out.sets = d.sets;
    if (Array.isArray(d.mistakes)) out.mistakes = d.mistakes;
    if (typeof d.readIx === "number") out.readIx = d.readIx;
    if (typeof d.readUnit === "string") out.readUnit = d.readUnit;
    if (d.readDone && typeof d.readDone === "object") out.readDone = d.readDone;
    if (d.pre && typeof d.pre === "object") out.pre = d.pre;
    if (d.rt && typeof d.rt === "object") out.rt = d.rt;
    if (d.doneToday && typeof d.doneToday === "object") out.doneToday = d.doneToday;
    if (typeof d.citeStyle === "string") out.citeStyle = d.citeStyle;
    if (d.resume && typeof d.resume === "object") out.resume = d.resume;
    if (d.first) out.first = d.first;
    if (typeof d.epoch === "number") out.epoch = d.epoch;
    if (d.last) out.last = d.last;
    if (d.game && typeof d.game === "object") {
      var g = out.game, s = d.game;
      if (typeof s.xp === "number") g.xp = s.xp;
      if (typeof s.today === "number") g.today = s.today;
      if (typeof s.day === "string") g.day = s.day;
      if (typeof s.streak === "number") g.streak = s.streak;
      if (typeof s.best === "number") g.best = s.best;
      if (s.days && typeof s.days === "object") g.days = s.days;
      if (s.badges && typeof s.badges === "object") g.badges = s.badges;
      if (typeof s.goal === "number") g.goal = s.goal;
    }
    return out;
  }

  /* ---------------------------------------------------------------- Record */
  function Record(personId) {
    this.id = personId || "anon";
    this.key = PREFIX + this.id;
    this.subs = [];
    this.load();
  }

  Record.prototype.load = function () {
    var raw = null;
    try { raw = localStorage.getItem(this.key); } catch (e) { /* private mode */ }
    var parsed = null;
    if (raw) { try { parsed = JSON.parse(raw); } catch (e) { parsed = null; } }
    this.d = parsed ? migrate(parsed) : blank();
    if (!this.d.first) this.d.first = Date.now();
    this.rollDay(Date.now());
  };

  /* Writes are debounced because the app touches this on every keystroke in
     a match and every answer in a session. Two hundred milliseconds is below
     the threshold where a closed tab loses anything a student would notice,
     and far above the rate at which JSON.stringify starts to cost. */
  Record.prototype.save = function () {
    var self = this;
    clearTimeout(this._t);
    this._t = setTimeout(function () { self.flush(); }, 200);
  };

  Record.prototype.flush = function () {
    clearTimeout(this._t);
    this.d.last = Date.now();
    try {
      localStorage.setItem(this.key, JSON.stringify(this.d));
    } catch (e) {
      // Quota, or a private window. The session still works; it just stops
      // being remembered, and the app is told so it can say so.
      this.broken = true;
    }
    this.subs.forEach(function (fn) { try { fn(); } catch (e) { /* a listener's problem */ } });
  };

  Record.prototype.subscribe = function (fn) { this.subs.push(fn); };

  /* ------------------------------------------------------------ The day
     Called on load and before anything is earned. It is what makes a streak
     honest: the day only turns over here, from the clock, and never from a
     student having opened the app. */
  Record.prototype.rollDay = function (now) {
    var g = this.d.game, t = today(now);
    if (g.day === t) return false;
    if (g.day) {
      var gap = daysBetween(g.day, t);
      // A day missed ends the run. A day with nothing earned is a day missed,
      // which is the whole point of a streak.
      if (gap == null || gap > 1 || !g.days[g.day]) g.streak = 0;
    }
    g.day = t;
    g.today = 0;
    return true;
  };

  /* Experience earned. Everything that awards it comes through here, so the
     streak, the day ledger and the all-time total can never disagree. */
  Record.prototype.earn = function (xp, now) {
    now = now || Date.now();
    this.rollDay(now);
    var g = this.d.game, t = today(now);
    xp = Math.max(0, Math.round(xp));
    if (!xp) return { xp: 0, streak: g.streak, levelled: false };

    var before = g.xp;
    var had = g.days[t] || 0;
    g.xp += xp;
    g.today += xp;
    g.days[t] = had + xp;

    // The streak advances on the first experience of a new day, not on
    // opening the app. Showing up and doing nothing is not a day.
    if (!had) {
      var prev = null;
      for (var k in g.days) {
        if (k === t || !g.days[k]) continue;
        if (!prev || k > prev) prev = k;
      }
      var gap = prev ? daysBetween(prev, t) : null;
      g.streak = gap === 1 ? g.streak + 1 : 1;
      if (g.streak > g.best) g.best = g.streak;
    }
    this.save();
    return { xp: xp, streak: g.streak, before: before, after: g.xp };
  };

  Record.prototype.badge = function (key, now) {
    var g = this.d.game;
    if (g.badges[key]) return false;
    g.badges[key] = now || Date.now();
    this.save();
    return true;
  };

  /* ----------------------------------------------------------- Set state */
  Record.prototype.set = function (id) {
    var s = this.d.sets[id];
    if (!s) s = this.d.sets[id] = { level: {}, star: {}, best: null, runs: 0, seen: 0 };
    if (!s.level) s.level = {};
    if (!s.star) s.star = {};
    return s;
  };

  Record.prototype.unit = function (courseId, n) {
    var k = courseId + ":" + n;
    if (!this.d.m[k]) this.d.m[k] = { u: 0, p: 0, r: 0, a: 0 };
    return this.d.m[k];
  };

  /* ------------------------------------------------------------- Resume
     A session walked out of. Kept small and kept keyed by set, because two
     half-finished sessions on two sets are two things a student may
     reasonably have, and one clobbering the other would be a bug they could
     not explain. Anything older than a day is not offered — coming back to
     Tuesday's half-session on Friday is not resuming, it is confusion. */
  var RESUME_LIFE = 864e5;

  Record.prototype.park = function (setId, state) {
    if (!setId || !state) return;
    state.at = Date.now();
    this.d.resume[setId] = state;
    this.flush();                        // leaving is exactly when not to debounce
  };
  Record.prototype.parked = function (setId) {
    var r = this.d.resume[setId];
    if (!r || r.gone) return null;
    if (Date.now() - (r.at || 0) > RESUME_LIFE) { delete this.d.resume[setId]; this.save(); return null; }
    return r;
  };
  /* Cleared, not deleted. A deleted entry is indistinguishable from one this
     device never had, so the next merge would take the other device's copy
     of the finished session and offer it again. A dated marker says it ended. */
  Record.prototype.clearPark = function (setId) {
    var r = this.d.resume[setId];
    if (r && !r.gone) { this.d.resume[setId] = { gone: true, at: Date.now() }; this.save(); }
  };

  /* --------------------------------------------------------- Mistake book */
  Record.prototype.slip = function (kind, key, title, note, extra) {
    var hit = null;
    this.d.mistakes.forEach(function (m) { if (m.key === key) hit = m; });
    if (hit) {
      hit.n++;
      hit.at = Date.now();
      if (extra) for (var k in extra) hit[k] = extra[k];
    } else {
      var row = { kind: kind, key: key, title: title, note: note, n: 1, at: Date.now() };
      if (extra) for (var j in extra) row[j] = extra[j];
      this.d.mistakes.push(row);
    }
    // Newest and most-missed first, and bounded: a mistake book nobody can
    // reach the end of is a list, not a book.
    this.d.mistakes.sort(function (a, b) { return (b.n - a.n) || (b.at - a.at); });
    if (this.d.mistakes.length > 60) this.d.mistakes.length = 60;
    this.save();
  };

  Record.prototype.forget = function (key) {
    this.d.mistakes = this.d.mistakes.filter(function (m) { return m.key !== key; });
    this.save();
  };

  /* --------------------------------------------------------------- Export
     A record a person can take with them. It is the honest answer to "this
     lives in one browser": you can carry it to another one, and a teacher can
     be handed it. It is also what makes the local store testable — a bug in
     a student's progress can be reproduced from a file rather than guessed
     at from a description. */
  Record.prototype.export = function () {
    return JSON.stringify({ oplo: "learn-record", v: VERSION, id: this.id,
                            at: Date.now(), d: this.d }, null, 2);
  };

  Record.prototype.import = function (text) {
    var parsed = JSON.parse(text);
    if (!parsed || parsed.oplo !== "learn-record") throw new Error("Not an OEdu record.");
    this.d = migrate(parsed.d);
    // An import replaces everything, so it is a reset as far as merging is
    // concerned: nothing a device held from before it may come back.
    this.d.epoch = Date.now();
    this.rollDay(Date.now());
    this.flush();
    return true;
  };

  Record.prototype.wipe = function () {
    this.d = blank();
    this.d.first = Date.now();
    this.d.epoch = Date.now();
    this.flush();
  };

  /* ---------------------------------------------------------------- Merge
     Two copies of one person's record — this browser's and the account's —
     made into one without losing the work in either.

     Last-write-wins on the whole record is the easy rule and the wrong one: a
     phone that saves a minute after a laptop erases the laptop's morning. So
     every field merges by what it means, and most fields only move one way,
     which is what makes the result the same whichever copy arrives first:

       m          unit mastery never falls (raise() only raises)   max
       readDone   a checked section stays checked                  union
       pre        a baseline is the first prediction made          earliest
       sets       stars and levels are choices                     newest device
                  best time is the lowest, run counts the highest
       mistakes   one row per mistake, the larger count            by key
       resume     newest per set; cleared stays cleared            by stamp
       rt         each card only moves forward; a closed boundary
                  beats an open one started before it closed       by progress
       position   where you are reading, and how you cite          newest device
       game       the server's ledger, not this merge's business   kept local

     `epoch` sits above all of it. A reset or an import stamps one, and a
     newer epoch wins outright: data from before a reset has nothing to merge
     with. `local` and `remote` are never modified. */
  var TOMB_LIFE = 30 * 864e5;
  function mnum(x) { return typeof x === "number" && isFinite(x) ? x : 0; }
  function mobj(x) { return x && typeof x === "object" && !Array.isArray(x) ? x : {}; }
  function mclone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function mkeys(x, y) {
    var out = [], seen = {};
    Object.keys(mobj(x)).concat(Object.keys(mobj(y))).forEach(function (k) {
      if (!seen[k]) { seen[k] = true; out.push(k); }
    });
    return out;
  }

  function cardRank(c) {
    if (!c) return 0;
    return c.closed ? 4 : c.second ? 3 : c.first ? 2 : c.text ? 1 : 0;
  }

  function mergeBoundary(x, y) {
    if (!x || !y) return mclone(x || y);
    if (x.done || y.done) {
      if (x.done && y.done) return mclone(mnum(x.at) >= mnum(y.at) ? x : y);
      var closed = x.done ? x : y, open = x.done ? y : x;
      // Started after it closed: a new attempt, not the old one coming back
      // from a device that had not heard.
      return mclone(mnum(open.at) > mnum(closed.at) ? open : closed);
    }
    var earlier = mnum(x.at) <= mnum(y.at) ? x : y, later = earlier === x ? y : x;
    var out = {
      at: mnum(earlier.at) || mnum(later.at),
      // The questions asked are the ones frozen first.
      ids: (earlier.ids && earlier.ids.length ? earlier.ids : later.ids) || undefined,
      cards: {},
      check: null
    };
    mkeys(x.cards, y.cards).forEach(function (id) {
      var a = mobj(x.cards)[id], b = mobj(y.cards)[id];
      out.cards[id] = mclone(cardRank(b) > cardRank(a) ? b : a);
    });
    var p = x.check, q = y.check;
    out.check = mclone(!p ? q : !q ? p : (q.closed && !p.closed ? q : p));
    return out;
  }

  function merge(local, remote, now) {
    now = now || Date.now();
    if (!remote) return migrate(mclone(local));
    if (!local) return migrate(mclone(remote));
    var a = migrate(mclone(local)), b = migrate(mclone(remote));

    if (mnum(a.epoch) !== mnum(b.epoch)) return mnum(a.epoch) > mnum(b.epoch) ? a : b;

    var newer = mnum(a.last) >= mnum(b.last) ? a : b;
    var out = blank();
    out.epoch = mnum(a.epoch);
    var firsts = [a.first, b.first].filter(function (x) { return mnum(x) > 0; });
    out.first = firsts.length ? Math.min.apply(null, firsts) : null;
    out.last = Math.max(mnum(a.last), mnum(b.last)) || null;

    out.readIx = newer.readIx;
    out.readUnit = newer.readUnit;
    out.citeStyle = newer.citeStyle;

    mkeys(a.m, b.m).forEach(function (k) {
      var x = mobj(a.m[k]), y = mobj(b.m[k]), row = {};
      mkeys(x, y).forEach(function (dim) { row[dim] = Math.max(mnum(x[dim]), mnum(y[dim])); });
      out.m[k] = row;
    });

    mkeys(a.readDone, b.readDone).forEach(function (k) {
      if (a.readDone[k] || b.readDone[k]) out.readDone[k] = true;
    });
    out.doneToday = Object.assign({}, mobj(b.doneToday), mobj(a.doneToday));

    mkeys(a.pre, b.pre).forEach(function (k) {
      var x = a.pre[k], y = b.pre[k];
      out.pre[k] = mclone(!x ? y : !y ? x : (mnum(x.at) <= mnum(y.at) ? x : y));
    });

    mkeys(a.sets, b.sets).forEach(function (id) {
      var x = a.sets[id], y = b.sets[id];
      if (!x || !y) { out.sets[id] = mclone(x || y); return; }
      var pick = newer === a ? x : y, other = pick === x ? y : x;
      var s = Object.assign({}, mclone(other), mclone(pick));
      s.level = Object.assign({}, mobj(other.level), mobj(pick.level));
      s.star = Object.assign({}, mobj(other.star), mobj(pick.star));
      s.best = x.best == null ? y.best : y.best == null ? x.best : Math.min(x.best, y.best);
      s.runs = Math.max(mnum(x.runs), mnum(y.runs));
      s.seen = Math.max(mnum(x.seen), mnum(y.seen));
      out.sets[id] = s;
    });

    var byKey = {};
    a.mistakes.concat(b.mistakes).forEach(function (m) {
      if (!m || !m.key) return;
      var h = byKey[m.key];
      if (!h) { byKey[m.key] = mclone(m); return; }
      var later = mnum(m.at) >= mnum(h.at) ? m : h, earlier = later === m ? h : m;
      var row = Object.assign({}, mclone(earlier), mclone(later));
      row.n = Math.max(mnum(h.n), mnum(m.n));
      row.at = Math.max(mnum(h.at), mnum(m.at));
      byKey[m.key] = row;
    });
    out.mistakes = Object.keys(byKey).map(function (k) { return byKey[k]; })
      .sort(function (p, q) { return (q.n - p.n) || (q.at - p.at); }).slice(0, 60);

    mkeys(a.resume, b.resume).forEach(function (id) {
      var x = a.resume[id], y = b.resume[id];
      var w = !x ? y : !y ? x : (mnum(x.at) >= mnum(y.at) ? x : y);
      if (w && !(w.gone && now - mnum(w.at) > TOMB_LIFE)) out.resume[id] = mclone(w);
    });

    mkeys(a.rt, b.rt).forEach(function (k) {
      var w = mergeBoundary(a.rt[k], b.rt[k]);
      if (w && !(w.done && now - mnum(w.at) > TOMB_LIFE)) out.rt[k] = w;
    });

    // Experience comes from the server's ledger through its own endpoint.
    // Only the daily goal is the student's choice, and it follows them.
    out.game = mclone(a.game);
    if (newer.game && newer.game.goal != null) out.game.goal = newer.game.goal;
    return out;
  }

  /* ----------------------------------------------------------------- Sync
     Kept for anything that still reaches for it. Synchronisation lives in
     sync.js, which uses `merge` above. */
  var Sync = {
    online: false,
    pull: function () { return Promise.resolve(null); },
    push: function () { return Promise.resolve(false); }
  };

  return {
    VERSION: VERSION, Record: Record, Sync: Sync, merge: merge,
    today: today, daysBetween: daysBetween, blank: blank
  };
})();
