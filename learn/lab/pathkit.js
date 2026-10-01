/* ==========================================================================
   OEdu Lab — Pathway, the engine. See lab/pathui.js for the pages and
   path/<course>.js for a course's topics.

   A course on Pathway is not a list of lessons. It is a map of small topics
   — Solving two-step equations, Slope from two points, Factoring x² + bx + c —
   each resting on the topics beneath it. Knowing a topic implies knowing what
   it rests on; missing one implies missing what rests on it. That one idea is
   enough to find out, in about twenty questions, which of seventy topics a
   student already knows, and to name the ones they are ready to learn next.

   THE MAP        P.define(courseId, { title, cats, topics }).
                  A topic is { id, cat, name, pre: [ids], idea, gen }. `gen`
                  makes a question from a seed at one of three difficulties.
                  The map is checked when it is defined: a prerequisite that
                  doesn't exist, or a loop, throws.

   THE CHECK      P.assess(courseId, opts). A belief between 0 and 1 for every
                  topic. The next question is the topic whose answer would
                  settle the most: its own doubt, plus the doubt about
                  everything beneath it (if it is answered right) or above it
                  (if it is answered wrong). Right raises what is beneath;
                  wrong lowers what is above; "I haven't learned this" lowers
                  it without a guess. It stops when nothing is left in
                  doubt, or at the cap. Nothing is shown as right or wrong
                  while it runs — a check measures, it does not teach.

   THE RING       Every topic is one of three things: mastered (confirmed by a
                  check), learned (practised successfully, not yet confirmed),
                  or not yet. Learning a topic is three right answers with
                  the explanation there whenever it's wanted; a miss shows the
                  whole worked solution. Only a check turns "learned" into
                  "mastered", and a check that finds something forgotten
                  returns it — the ring is honest in both directions.

   THE RECORD     Kept on the device at once and on the account as the
                  progress scope "path", merged the way the SAT kit's is:
                  the newer entry for each topic wins, nothing is lost.
                  Private to the student, like all self-paced progress.

   Nothing here is locked. "Ready" is advice — a topic whose foundations hold
   up — and every topic opens whenever the student wants it.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_LAB) return;
  var LAB = window.OPLO_LAB;
  var P = LAB.PATH = LAB.PATH || {};
  var DAY = 86400000;

  /* ============================================================== The map */
  var COURSES = {};
  P.courses = COURSES;

  P.define = function (id, def) {
    var idx = {};
    def.id = id;
    def.topics.forEach(function (t) {
      if (idx[t.id]) throw new Error("Pathway " + id + ": topic " + t.id + " is defined twice.");
      t.pre = t.pre || [];
      idx[t.id] = t;
    });
    var catIdx = {};
    def.cats.forEach(function (c) { catIdx[c.id] = c; c.topics = []; });
    def.topics.forEach(function (t) {
      if (!catIdx[t.cat]) throw new Error("Pathway " + id + ": " + t.id + " is in no category.");
      catIdx[t.cat].topics.push(t);
      t.pre.forEach(function (p) {
        if (!idx[p]) throw new Error("Pathway " + id + ": " + t.id + " rests on " + p + ", which doesn't exist.");
      });
    });
    // depth, and every topic beneath / above each one (transitive)
    var depth = {}, visiting = {};
    function d(t) {
      if (depth[t.id] != null) return depth[t.id];
      if (visiting[t.id]) throw new Error("Pathway " + id + ": " + t.id + " rests on itself.");
      visiting[t.id] = true;
      var m = 0;
      t.pre.forEach(function (p) { m = Math.max(m, d(idx[p]) + 1); });
      visiting[t.id] = false;
      return (depth[t.id] = m);
    }
    def.topics.forEach(function (t) { t.depth = d(t); t.anc = []; t.desc = []; t.post = []; });
    def.topics.forEach(function (t) {
      var seen = {}, stack = t.pre.slice();
      while (stack.length) {
        var k = stack.pop();
        if (seen[k]) continue;
        seen[k] = true;
        t.anc.push(k);
        idx[k].pre.forEach(function (q) { stack.push(q); });
      }
      t.pre.forEach(function (k) { idx[k].post.push(t.id); });
    });
    def.topics.forEach(function (t) { t.anc.forEach(function (k) { idx[k].desc.push(t.id); }); });
    def.idx = idx;
    def.byDepth = def.topics.slice().sort(function (a, b) { return a.depth - b.depth; });
    COURSES[id] = def;
    return def;
  };
  P.get = function (id) { return COURSES[id] || null; };

  /* ============================================================== Record
     Per course:
       t     topic id -> { s: "m" | "l", at, iv, n, ok }   (absent = not yet)
       chk   every check taken: { at, kind, n, m, l, back, ms }
       days  day -> { q: answers, l: topics learned }
       log   the last answers: { at, t, d, ok, ms, mode }
       since topics learned since the last check
       ring  snapshots of the ring after each session, for the trend line */
  var API = window.OPLO_API;
  var ME = null, REC = null, BASE = null, pushT = null, pulled = {}, LISTENERS = [];
  var LOG_MAX = 300;
  function blank() { return { v: 1, at: 0, c: {} }; }
  function blankCourse() { return { t: {}, chk: [], days: {}, log: [], since: 0, ring: [], prefs: {} }; }
  function localKey() { return "oplo.path." + (ME ? ME.id : "anon"); }
  function readLocal() { try { return JSON.parse(localStorage.getItem(localKey()) || "null"); } catch (e) { return null; } }
  function writeLocal() { try { localStorage.setItem(localKey(), JSON.stringify(REC)); } catch (e) { /* full or blocked */ } }
  function mergeCourse(a, b) {
    a = a || blankCourse(); b = b || blankCourse();
    var out = blankCourse();
    [a.t || {}, b.t || {}].forEach(function (src) {
      Object.keys(src).forEach(function (id) {
        var x = src[id], y = out.t[id];
        if (!y || (x.at || 0) > (y.at || 0)) out.t[id] = Object.assign({}, x);
      });
    });
    // A topic dropped from the ring on one device (forgotten in a check) must
    // stay dropped on the other: the entry carries s:"" and a time, and the
    // newer one wins like any other.
    var seen = {};
    (a.chk || []).concat(b.chk || []).forEach(function (c) { if (!seen[c.at]) { seen[c.at] = 1; out.chk.push(c); } });
    out.chk.sort(function (p, q) { return p.at - q.at; });
    [a.days || {}, b.days || {}].forEach(function (src) {
      Object.keys(src).forEach(function (d) {
        var x = src[d], y = out.days[d] || { q: 0, l: 0 };
        out.days[d] = { q: Math.max(x.q || 0, y.q || 0), l: Math.max(x.l || 0, y.l || 0) };
      });
    });
    var ls = {};
    (a.log || []).concat(b.log || []).forEach(function (x) { var k = x.at + ":" + x.t; if (!ls[k]) { ls[k] = 1; out.log.push(x); } });
    out.log.sort(function (p, q) { return p.at - q.at; });
    if (out.log.length > LOG_MAX) out.log = out.log.slice(-LOG_MAX);
    var rs = {};
    (a.ring || []).concat(b.ring || []).forEach(function (x) { if (!rs[x.at]) { rs[x.at] = 1; out.ring.push(x); } });
    out.ring.sort(function (p, q) { return p.at - q.at; });
    if (out.ring.length > 120) out.ring = out.ring.slice(-120);
    // "since the last check" is whichever copy is newer about the last check
    var lastA = (a.chk || []).length ? a.chk[a.chk.length - 1].at : 0, lastB = (b.chk || []).length ? b.chk[b.chk.length - 1].at : 0;
    out.since = lastA === lastB ? Math.max(a.since || 0, b.since || 0) : lastA > lastB ? a.since || 0 : b.since || 0;
    out.prefs = Object.assign({}, b.prefs || {}, a.prefs || {});
    return out;
  }
  function merge(a, b) {
    a = a || blank(); b = b || blank();
    var out = blank();
    out.at = Math.max(a.at || 0, b.at || 0);
    var ids = {};
    Object.keys(a.c || {}).concat(Object.keys(b.c || {})).forEach(function (k) { ids[k] = 1; });
    Object.keys(ids).forEach(function (k) { out.c[k] = mergeCourse((a.c || {})[k], (b.c || {})[k]); });
    return out;
  }
  function useAccount(me) {
    if (REC && ((ME && me && ME.id === me.id) || (!ME && !me))) return;
    ME = me || null;
    REC = readLocal() || blank();
    BASE = null;
    if (!ME || !API || !API.progress || pulled[ME.id]) return;
    pulled[ME.id] = true;
    API.progress.one("path").then(function (row) {
      BASE = row ? row.updatedAt : 0;
      if (row && row.state) {
        REC = merge(REC, row.state);
        writeLocal();
        if (JSON.stringify(REC) !== JSON.stringify(row.state)) push();
        LISTENERS.forEach(function (f) { try { f(); } catch (e) { /* a page since left */ } });
      } else if (Object.keys(REC.c).length) push();
    }, function () { pulled[ME.id] = false; });
  }
  function changed() {
    REC.at = Date.now();
    writeLocal();
    clearTimeout(pushT);
    pushT = setTimeout(push, 1500);
  }
  function push(tries) {
    if (!ME || !API || !API.progress) return;
    tries = tries || 0;
    function send() {
      API.progress.put("path", REC, null, BASE).then(function (res) { BASE = res.updatedAt; }, function (e) {
        if (e && e.status === 409 && tries < 3) {
          API.progress.one("path").then(function (row) {
            BASE = row ? row.updatedAt : 0;
            if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
            push(tries + 1);
          });
        }
      });
    }
    if (BASE == null) {
      API.progress.one("path").then(function (row) {
        BASE = row ? row.updatedAt : 0;
        if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
        send();
      }, function () { /* offline: kept on the device */ });
    } else send();
  }
  P.useAccount = useAccount;
  P.onSync = function (f) { LISTENERS = LISTENERS.filter(function (x) { return x.__host !== f.__host; }); LISTENERS.push(f); };
  P._merge = merge;

  function rc(cid) {
    if (!REC) useAccount(null);
    return REC.c[cid] || (REC.c[cid] = blankCourse());
  }
  P.rec = rc;
  P.save = function () { changed(); };
  function dayKey(t) {
    var d = new Date(t == null ? Date.now() : t);
    return d.getFullYear() + "-" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate();
  }
  P.dayKey = dayKey;
  function today(r) { var k = dayKey(); return r.days[k] || (r.days[k] = { q: 0, l: 0 }); }

  /* ========================================================= Reading state */
  /* "m" mastered, "l" learned, "" not yet. */
  P.status = function (cid, tid) { var x = rc(cid).t[tid]; return x && x.s ? x.s : ""; };
  function known(cid, tid) { return !!P.status(cid, tid); }
  P.known = known;

  P.counts = function (cid) {
    var def = COURSES[cid], r = rc(cid), m = 0, l = 0;
    def.topics.forEach(function (t) { var s = r.t[t.id] && r.t[t.id].s; if (s === "m") m++; else if (s === "l") l++; });
    return { m: m, l: l, n: def.topics.length, todo: def.topics.length - m - l };
  };
  P.catCounts = function (cid) {
    var def = COURSES[cid], r = rc(cid);
    return def.cats.map(function (c) {
      var m = 0, l = 0;
      c.topics.forEach(function (t) { var s = r.t[t.id] && r.t[t.id].s; if (s === "m") m++; else if (s === "l") l++; });
      return { cat: c, m: m, l: l, n: c.topics.length };
    });
  };
  /* Ready: not yet known, and every topic it rests on is known. The outer
     fringe of what the student knows — the things to learn next. */
  P.ready = function (cid) {
    var def = COURSES[cid];
    return def.byDepth.filter(function (t) {
      return !known(cid, t.id) && t.pre.every(function (p) { return known(cid, p); });
    });
  };
  /* Due: mastered topics past their review date, and learned-but-unconfirmed
     ones that have waited three days. */
  P.due = function (cid, now) {
    now = now || Date.now();
    var def = COURSES[cid], r = rc(cid);
    return def.topics.filter(function (t) {
      var x = r.t[t.id];
      if (!x || !x.s) return false;
      return x.s === "l" ? now - (x.at || 0) > 3 * DAY : now > (x.at || 0) + (x.iv || 7) * DAY;
    });
  };
  P.lastCheck = function (cid) { var c = rc(cid).chk; return c.length ? c[c.length - 1] : null; };
  /* A check is worth suggesting after ten new topics, or after two weeks. */
  P.checkDue = function (cid, now) {
    now = now || Date.now();
    var r = rc(cid), last = P.lastCheck(cid);
    if (!last) return "first";
    if (r.since >= 10) return "topics";
    if (now - last.at > 14 * DAY && P.counts(cid).m + P.counts(cid).l > 0) return "time";
    return "";
  };

  /* Writing state ---------------------------------------------------------- */
  function setTopic(cid, tid, s, extra) {
    var r = rc(cid), x = r.t[tid] || (r.t[tid] = { s: "", at: 0, iv: 0, n: 0, ok: 0 });
    var was = x.s;
    x.s = s;
    x.at = Date.now();
    if (extra) Object.keys(extra).forEach(function (k) { x[k] = extra[k]; });
    return was;
  }
  function snapshot(cid) {
    var r = rc(cid), c = P.counts(cid), last = r.ring[r.ring.length - 1];
    if (last && last.m === c.m && last.l === c.l) return;
    r.ring.push({ at: Date.now(), m: c.m, l: c.l });
    if (r.ring.length > 120) r.ring.shift();
  }
  /* One answer in learning or review — keeps the small record honest. */
  P.noteAnswer = function (cid, tid, d, ok, ms, mode) {
    var r = rc(cid), x = r.t[tid] || (r.t[tid] = { s: "", at: 0, iv: 0, n: 0, ok: 0 });
    x.n = (x.n || 0) + 1;
    if (ok) x.ok = (x.ok || 0) + 1;
    r.log.push({ at: Date.now(), t: tid, d: d, ok: ok ? 1 : 0, ms: Math.round(ms || 0), mode: mode || "learn" });
    if (r.log.length > LOG_MAX) r.log.shift();
    today(r).q++;
    changed();
  };
  /* Three right answers: learned. Not yet confirmed — that is a check's job. */
  P.learned = function (cid, tid) {
    var r = rc(cid), was = r.t[tid] && r.t[tid].s;
    if (was === "m") { today(r); changed(); return { was: was, gain: false }; }
    setTopic(cid, tid, "l", { iv: 7 });
    if (was !== "l") { r.since = (r.since || 0) + 1; today(r).l++; }
    snapshot(cid);
    changed();
    return { was: was, gain: was !== "l" };
  };
  /* A review question answered: the interval doubles on a right answer; a
     wrong one comes back once at an easier level before the topic is dropped
     (P.slipped). */
  P.reviewed = function (cid, tid, ok) {
    var r = rc(cid), x = r.t[tid];
    if (!x) return;
    if (ok) { x.at = Date.now(); x.iv = Math.min(120, Math.max(7, (x.iv || 7) * 2)); if (x.s === "l") x.s = "m"; }
    changed();
  };
  P.slipped = function (cid, tid) {
    setTopic(cid, tid, "", { iv: 0 });
    snapshot(cid);
    changed();
  };
  /* Take a topic out of the ring by hand ("I want to learn this again"). */
  P.forget = P.slipped;

  /* ================================================================ Check
     What the student knows is one of a very large number of knowledge
     states: sets of topics closed under "rests on" (if a topic is in, so is
     everything beneath it). A check keeps a few thousand of those states
     alive at once — a particle for each — and lets every answer reweight
     them: a right answer favours the states that contain the topic, a wrong
     one the states that don't, allowing for a slip and for a lucky guess.
     The next question is the topic whose answer is expected to tell us the
     most. When the states that survive agree about almost everything, it
     stops; a topic is known when nearly all of them contain it.

        var A = P.assess("alp");
        var q = A.next();               // { topic, item, n, of } or null when done
        A.answer(true | false | null)   // right, wrong, "haven't learned it"
        var res = A.finish();           // applies it to the record, returns a summary
  */
  var KNOWN_AT = 0.62, DROP_AT = 0.32;
  var SLIP = 0.05, GUESS_NUM = 0.04, GUESS_CHOICE = 0.25, DONT = 0.02;
  var NPART = 6000;
  function H2(p) { return p <= 0 || p >= 1 ? 0 : -(p * Math.log(p) + (1 - p) * Math.log(1 - p)) / Math.LN2; }

  P.assess = function (cid, opts) {
    opts = opts || {};
    var def = COURSES[cid], r = rc(cid);
    var first = opts.kind !== "review" && !r.chk.length;
    var kind = first ? "first" : "review";
    var max = opts.max || (first ? 28 : 20), min = opts.min || (first ? 16 : 10);
    var seed = opts.seed || (Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36));
    var R = LAB.rng("pathcheck:" + seed);
    var ord = def.byDepth, n = ord.length, pos = {};
    ord.forEach(function (t, i) { pos[t.id] = i; });
    var pre = ord.map(function (t) { return t.pre.map(function (k) { return pos[k]; }); });
    var post = ord.map(function (t) { return t.post.map(function (k) { return pos[k]; }); });
    var catOf = ord.map(function (t) { return t.cat; }), cats = def.cats.map(function (c) { return c.id; });
    var before = ord.map(function (t) { return (r.t[t.id] && r.t[t.id].s) || ""; });
    var maxDepth = ord[n - 1].depth;

    /* Which topics to expect the student to know, before any answers: a
       global level and an offset per slice (people are uneven), a soft
       cut-off by depth, and what the record already says. */
    var below = ord.map(function () { return false; });   // a recorded-known topic implies what's beneath it
    ord.forEach(function (t, i) { if (before[i]) t.anc.forEach(function (k) { below[pos[k]] = true; }); });
    function sample() {
      var x = new Uint8Array(n), lvl, offs = {};
      lvl = first ? R.next() * (maxDepth + 3) - 1.2 : R.next() * (maxDepth + 1) - 0.5;
      cats.forEach(function (c) { offs[c] = (R.next() + R.next() + R.next() - 1.5) * 2.0; });
      for (var i = 0; i < n; i++) {
        var p = 1 / (1 + Math.exp(-(lvl + offs[catOf[i]] - ord[i].depth) / 0.85));
        if (before[i] === "m") p = Math.max(p, 0.93); else if (before[i] === "l") p = Math.max(p, 0.72);
        else if (below[i]) p = Math.max(p, 0.85);
        if (!first && !before[i] && !below[i]) p *= 0.55;
        var ok = R.next() < p;
        if (ok) for (var j = 0; j < pre[i].length; j++) if (!x[pre[i][j]]) { ok = false; break; }
        x[i] = ok ? 1 : 0;
      }
      return x;
    }
    var parts = [], w = new Float64Array(NPART), i0, prior = new Float64Array(n);
    for (i0 = 0; i0 < NPART; i0++) { var s0 = sample(); parts.push(s0); w[i0] = 1; for (var k0 = 0; k0 < n; k0++) prior[k0] += s0[k0]; }
    for (i0 = 0; i0 < n; i0++) prior[i0] = Math.min(0.97, Math.max(0.03, prior[i0] / NPART));

    var answers = [], asked = {}, evKnown = {}, evUnknown = {}, order = [], lastCat = null, cur = null, t0 = Date.now();
    var marg = new Float64Array(n);
    function marginals() {
      var tot = 0, i, k;
      for (k = 0; k < n; k++) marg[k] = 0;
      for (i = 0; i < NPART; i++) { tot += w[i]; if (w[i] === 0) continue; var x = parts[i]; for (k = 0; k < n; k++) if (x[k]) marg[k] += w[i]; }
      for (k = 0; k < n; k++) marg[k] = tot > 0 ? marg[k] / tot : prior[k];
      return marg;
    }
    marginals();
    function like(known, res, g) {   // res: 1 right, 0 wrong, 2 "haven't learned it"
      if (res === 2) return known ? DONT : 1 - DONT;
      if (known) return res === 1 ? 1 - SLIP : SLIP;
      return res === 1 ? g : 1 - g;
    }
    function ess() { var s = 0, s2 = 0; for (var i = 0; i < NPART; i++) { s += w[i]; s2 += w[i] * w[i]; } return s2 > 0 ? s * s / s2 : 0; }
    /* Resample by weight, then move each particle a few steps through the
       space of states so the copies don't all stay identical. */
    function rejuvenate() {
      var tot = 0, i; for (i = 0; i < NPART; i++) tot += w[i];
      if (!(tot > 0)) { for (i = 0; i < NPART; i++) { parts[i] = sample(); w[i] = 1; } return; }
      var cum = 0, next = [], u = R.next() / NPART, j = 0, step = tot / NPART, target = u * tot;
      var acc = w[0];
      for (i = 0; i < NPART; i++) {
        while (acc < target && j < NPART - 1) { j++; acc += w[j]; }
        next.push(new Uint8Array(parts[j]));
        target += step;
      }
      parts = next; w = new Float64Array(NPART); for (i = 0; i < NPART; i++) w[i] = 1;
      var sweeps = 6 * n;
      for (i = 0; i < NPART; i++) {
        var x = parts[i];
        for (var m = 0; m < sweeps; m++) {
          var j2 = Math.floor(R.next() * n), k;
          if (x[j2]) {
            var can = true; for (k = 0; k < post[j2].length; k++) if (x[post[j2][k]]) { can = false; break; }
            if (!can) continue;
            var a = asked[j2];
            var ratio = (1 - prior[j2]) / prior[j2];
            if (a) ratio *= like(false, a.res, a.g) / like(true, a.res, a.g);
            if (R.next() < Math.min(1, ratio)) x[j2] = 0;
          } else {
            var can2 = true; for (k = 0; k < pre[j2].length; k++) if (!x[pre[j2][k]]) { can2 = false; break; }
            if (!can2) continue;
            var a2 = asked[j2];
            var ratio2 = prior[j2] / (1 - prior[j2]);
            if (a2) ratio2 *= like(true, a2.res, a2.g) / like(false, a2.res, a2.g);
            if (R.next() < Math.min(1, ratio2)) x[j2] = 1;
          }
        }
      }
    }

    function bestGain() {
      var best = null, bg = -1;
      for (var i = 0; i < n; i++) {
        if (asked[i]) continue;
        var m = marg[i], g = GUESS_NUM;
        var pc = m * (1 - SLIP) + (1 - m) * g;
        var gain = H2(pc) - m * H2(SLIP) - (1 - m) * H2(g);
        if (before[i] === "l") gain *= 1.25;
        if (lastCat && catOf[i] === lastCat) gain *= 0.85;
        if (order.length < 2 && ord[i].depth > 6) gain *= 0.6;   // don't open on the hardest thing
        gain *= 1 + 0.08 * R.next();
        if (gain > bg) { bg = gain; best = i; }
      }
      return { i: best, gain: bg };
    }

    var A = {
      kind: kind, first: first, max: max, min: min, seed: seed,
      asked: function () { return order.length; },
      progress: function () { return Math.min(1, order.length / max); },
      next: function () {
        if (cur) return cur;
        if (order.length >= max) return null;
        var b = bestGain();
        if (b.i == null) return null;
        if (order.length >= min && b.gain < 0.10) return null;
        var t = ord[b.i];
        var qseed = seed + ":" + t.id + ":" + order.length;
        var item = t.gen(LAB.rng(qseed), 2);
        cur = { topic: t, ix: b.i, item: item, seed: qseed, n: order.length + 1, of: max, at: Date.now() };
        return cur;
      },
      /* ok: true right · false wrong · null "I haven't learned this yet" */
      answer: function (ok) {
        if (!cur) return;
        var t = cur.topic, ix = cur.ix;
        var res = ok === true ? 1 : ok === null ? 2 : 0;
        var g = cur.item && cur.item.a && cur.item.a.k === "choice" ? Math.min(0.33, 1 / Math.max(2, cur.item.a.opts.length)) : GUESS_NUM;
        asked[ix] = { res: res, g: g };
        lastCat = t.cat;
        order.push({ t: t.id, ok: res === 1, skipped: res === 2, ms: Date.now() - cur.at });
        if (res === 1) { evKnown[ix] = 1; t.anc.forEach(function (k) { evKnown[pos[k]] = 1; }); }
        else { evUnknown[ix] = 1; t.desc.forEach(function (k) { evUnknown[pos[k]] = 1; }); }
        // reweight
        for (var i = 0; i < NPART; i++) { if (w[i] === 0) continue; w[i] *= like(!!parts[i][ix], res, g); }
        if (ess() < NPART * 0.3) rejuvenate();
        marginals();
        cur = null;
      },
      belief: function () { var o = {}; ord.forEach(function (t, i) { o[t.id] = marg[i]; }); return o; },
      /* Apply the outcome to the record. */
      finish: function () {
        var now = Date.now(), gained = [], back = [], confirmed = [];
        ord.forEach(function (t, i) {
          var was = before[i], m = marg[i];
          var evidenced = asked[i] ? asked[i].res === 1 : !!evKnown[i];
          if (m >= KNOWN_AT && (evidenced || was)) {
            if (was !== "m") {
              setTopic(cid, t.id, "m", { iv: was === "l" ? 14 : 7 });
              (was === "l" ? confirmed : gained).push(t.id);
            } else if (asked[i] && asked[i].res === 1) {
              var x = rc(cid).t[t.id];
              x.at = now; x.iv = Math.min(120, Math.max(7, (x.iv || 7) * 2));
            }
          } else if (was && m < DROP_AT && (asked[i] || evUnknown[i])) {
            setTopic(cid, t.id, "", { iv: 0 });
            back.push(t.id);
          }
        });
        var rr = rc(cid), c = P.counts(cid);
        rr.chk.push({ at: now, kind: kind, n: order.length, m: c.m, l: c.l, back: back.length, ms: now - t0 });
        rr.since = 0;
        today(rr).q += order.length;
        snapshot(cid);
        changed();
        return { kind: kind, first: first, n: order.length, gained: gained, confirmed: confirmed, back: back, order: order.slice(), counts: c, ms: now - t0 };
      }
    };
    return A;
  };

  /* A question for the learning loop, review, or a single topic: a fresh one
     from a seed, at a difficulty. */
  P.item = function (cid, tid, d, seed) {
    var t = COURSES[cid].idx[tid];
    seed = seed || (Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36));
    var s = "pathq:" + tid + ":" + d + ":" + seed;
    return { topic: t, item: t.gen(LAB.rng(s), d), seed: s, d: d };
  };

  /* ========================================================= Answer checking
     What the student types is read the way a teacher reads it: 3/4 and .75
     are the same number, 3x+2 and 2+3x are the same expression, and an answer
     that was asked "in lowest terms" or "fully factored" has to be. */
  function close(a, b, tol, abs) { return Math.abs(a - b) <= (tol || 1e-6) * (abs ? 1 : Math.max(1, Math.abs(a), Math.abs(b))); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }

  function readNum(s) {
    s = String(s).trim().replace(/[−–]/g, "-").replace(/^\$\s*/, "").replace(/\s*[%°]$/, "").replace(/(\d),(?=\d{3}(\D|$))/g, "$1");
    var mm = /^(-?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s);
    if (mm) { var whole = +mm[2], nn = +mm[3], dd = +mm[4]; if (!dd) return null; return (mm[1] ? -1 : 1) * (whole + nn / dd); }
    mm = /^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/.exec(s);
    if (mm) { var q = +mm[2]; return q === 0 ? null : (+mm[1]) / q; }
    if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return parseFloat(s);
    try {
      var t = LAB.parse(s);
      if (Object.keys(LAB.varsOf(t)).length) return null;
      var v = LAB.evalTree(t, {});
      return isFinite(v) ? v : null;
    } catch (e) { return null; }
  }
  P.readNum = readNum;

  function readList(raw) {
    var s = String(raw).replace(/[−–]/g, "-").replace(/[()\[\]{}]/g, " ");
    var parts = s.split(/\s*(?:,|;|\bor\b|\band\b)\s*|\s{2,}/i).filter(function (x) { return x.trim(); });
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var q = parts[i].replace(/^\s*[a-zA-Z]\s*=\s*/, "");
      var v = readNum(q);
      if (v == null) return null;
      out.push(v);
    }
    return out;
  }

  function walkNodes(n, fn) {
    if (!n) return;
    fn(n);
    if (n.a) walkNodes(n.a, fn);
    if (n.b) walkNodes(n.b, fn);
  }
  function hasVar(n) { return Object.keys(LAB.varsOf(n)).length > 0; }
  /* The factors of a product, powers counted with multiplicity. */
  function factorsOf(n, out) {
    out = out || [];
    if (n.t === "par") return factorsOf(n.a, out);
    if (n.t === "neg") return factorsOf(n.a, out);
    if (n.t === "mul") { factorsOf(n.a, out); factorsOf(n.b, out); return out; }
    if (n.t === "pow" && n.b.t === "num" && n.b.v >= 1 && n.b.v === Math.round(n.b.v)) {
      for (var i = 0; i < n.b.v; i++) factorsOf(n.a, out);
      return out;
    }
    out.push(n);
    return out;
  }
  function squarefree(k) {
    for (var f = 2; f * f <= k; f++) if (k % (f * f) === 0) return false;
    return true;
  }
  /* A monomial in its simplest form: one number in front, each letter once,
     each with a plain exponent. 6x³y — not (2x)(3x²y), not (x³)². */
  function monoSimple(tree) {
    var atoms = [], ok = true;
    (function walk(n) {
      if (!ok) return;
      if (n.t === "par" || n.t === "neg") return walk(n.a);
      if (n.t === "mul") { walk(n.a); walk(n.b); return; }
      if (n.t === "num") { atoms.push({ k: "num" }); return; }
      if (n.t === "var") { atoms.push({ k: "var", v: n.n }); return; }
      if (n.t === "pow") {
        var b = n.a; while (b.t === "par") b = b.a;
        var e = n.b; while (e.t === "par") e = e.a;
        if (b.t === "var" && (e.t === "num" || (e.t === "neg" && e.a.t === "num"))) { atoms.push({ k: "var", v: b.n }); return; }
        ok = false; return;
      }
      ok = false;
    })(tree);
    if (!ok) return false;
    var nums = 0, seen = {};
    atoms.forEach(function (x) {
      if (x.k === "num") nums++;
      else { if (seen[x.v]) ok = false; seen[x.v] = true; }
    });
    return ok && nums <= 1;
  }
  function posExp(tree) {
    var ok = true;
    walkNodes(tree, function (n) {
      if (n.t === "pow") {
        var e = n.b; while (e.t === "par") e = e.a;
        if (e.t === "neg" || (e.t === "num" && e.v < 0)) ok = false;
      }
    });
    return ok;
  }

  /* A polynomial read off a tree: { "x2y1": coefficient } — or null when the
     expression is something else (a root, a quotient by a letter…). */
  function polyOf(n) {
    function key(o) { return Object.keys(o).sort().map(function (k) { return k + o[k]; }).join(""); }
    function mk(terms) { return terms; }            // terms: [{ c, e: { x: 2 } }]
    function add(A, B, sgn) {
      var out = A.slice();
      B.forEach(function (t) { out.push({ c: sgn * t.c, e: t.e }); });
      return norm(out);
    }
    function norm(T) {
      var m = {};
      T.forEach(function (t) { var k = key(t.e); if (m[k]) m[k].c += t.c; else m[k] = { c: t.c, e: t.e }; });
      return Object.keys(m).map(function (k) { return m[k]; }).filter(function (t) { return Math.abs(t.c) > 1e-12; });
    }
    function mul(A, B) {
      var out = [];
      A.forEach(function (x) { B.forEach(function (y) { var e = Object.assign({}, x.e); Object.keys(y.e).forEach(function (k) { e[k] = (e[k] || 0) + y.e[k]; }); out.push({ c: x.c * y.c, e: e }); }); });
      return norm(out);
    }
    function go(n) {
      switch (n.t) {
        case "num": return [{ c: n.v, e: {} }];
        case "var": var e = {}; e[n.n] = 1; return [{ c: 1, e: e }];
        case "par": return go(n.a);
        case "neg": var a = go(n.a); return a && a.map(function (t) { return { c: -t.c, e: t.e }; });
        case "add": { var l = go(n.a), r = go(n.b); return l && r && add(l, r, 1); }
        case "sub": { var l2 = go(n.a), r2 = go(n.b); return l2 && r2 && add(l2, r2, -1); }
        case "mul": { var l3 = go(n.a), r3 = go(n.b); return l3 && r3 && mul(l3, r3); }
        case "pow": {
          var ex = n.b; while (ex.t === "par") ex = ex.a;
          if (ex.t !== "num" || ex.v < 0 || ex.v !== Math.round(ex.v) || ex.v > 6) return null;
          var base = go(n.a); if (!base) return null;
          var out = [{ c: 1, e: {} }];
          for (var i = 0; i < ex.v; i++) out = mul(out, base);
          return out;
        }
      }
      return null;
    }
    return go(n);
  }
  /* Has the greatest common factor been taken out? Every bracketed sum in the
     product must have no letter and no whole number left that divides all of
     it — read from its coefficients, not sampled. */
  function gcfOut(tree) {
    var ok = true;
    function check(sum) {
      var pl = polyOf(sum);
      if (!pl || !pl.length) return;
      var g = 0, minE = null;
      pl.forEach(function (t) {
        if (Math.abs(t.c - Math.round(t.c)) > 1e-9) { g = 1; } else g = gcd(g, Math.round(t.c));
        var ks = Object.keys(t.e);
        if (minE == null) { minE = {}; ks.forEach(function (k) { minE[k] = t.e[k]; }); }
        Object.keys(minE).forEach(function (k) { minE[k] = Math.min(minE[k], t.e[k] || 0); });
      });
      if (g > 1) ok = false;
      if (minE) Object.keys(minE).forEach(function (k) { if (minE[k] > 0) ok = false; });
    }
    (function walk(n) {
      if (!ok) return;
      if (n.t === "par") { var inner = n.a; if (inner.t === "add" || inner.t === "sub") { check(inner); return; } return walk(inner); }
      if (n.t === "neg") return walk(n.a);
      if (n.t === "mul") { walk(n.a); walk(n.b); return; }
      if (n.t === "pow") { walk(n.a); return; }
    })(tree);
    return ok;
  }

  /* A radical in simplest form: nothing under a root has a square factor, and
     no root is left in a denominator. */
  function radSimple(tree) {
    var ok = true;
    walkNodes(tree, function (n) {
      if (n.t === "fn" && n.f === "sqrt") {
        if (hasVar(n.a)) return;
        var v = LAB.evalTree(n.a, {});
        if (!(v >= 0) || Math.abs(v - Math.round(v)) > 1e-9 || !squarefree(Math.round(v))) ok = false;
      }
      if (n.t === "div") walkNodes(n.b, function (m) { if (m.t === "fn" && m.f === "sqrt") ok = false; });
      if (n.t === "pow" && n.b.t === "div") ok = false;
    });
    return ok;
  }

  /* -> { empty } | { bad: "why it can't be read" } | { ok, why? } */
  P.judge = function (a, raw) {
    raw = String(raw == null ? "" : raw).trim();
    if (!raw) return { empty: true };
    var v, t;
    try {
      switch (a.k) {
        case "num":
          v = readNum(raw);
          if (v == null) return { bad: "That isn't a number I can read. Try 3/4 or 0.75." };
          if (!close(v, a.v, a.tol, a.abs)) return { ok: false };
          if (a.lowest && /^-?\s*\d+\s*\/\s*\d+$/.test(raw)) {
            var pq = raw.replace(/[^\d/]/g, "").split("/");
            if (gcd(+pq[0], +pq[1]) !== 1) return { ok: false, why: "That's the right value. Now write the fraction in lowest terms." };
          }
          if (a.lowest && /^-?\s*\d+\s+\d+\s*\/\s*\d+$/.test(raw) === false && /\./.test(raw) && a.noDec) return { ok: false, why: "That's the right value. Write it as a fraction." };
          return { ok: true };
        case "list": {
          var vs = readList(raw);
          if (!vs) return { bad: "I couldn't read that. Separate answers with commas, like 2, -3." };
          var want = a.v.slice();
          if (a.ordered) return { ok: vs.length === want.length && vs.every(function (x, i) { return close(x, want[i], a.tol, a.abs); }) };
          function uniq(arr) { var s = arr.slice().sort(function (x, y) { return x - y; }), o = []; s.forEach(function (x) { if (!o.length || !close(x, o[o.length - 1], a.tol, a.abs)) o.push(x); }); return o; }
          var u1 = uniq(vs), u2 = uniq(want);
          return { ok: u1.length === u2.length && u1.every(function (x, i) { return close(x, u2[i], a.tol, a.abs); }) };
        }
        case "expr": {
          raw = raw.replace(/^\s*[a-zA-Z]\s*=\s*(?=[^=<>]*$)/, "");   // "w = A/l" is read as A/l
          t = LAB.parse(raw);
          var want2 = LAB.parse(a.v);
          if (!LAB.equivalent(t, want2)) return { ok: false };
          if (a.form === "simp" && !LAB.isSimplified(t)) return { ok: false, why: "That equals the answer, but it isn't fully simplified yet." };
          if (a.form === "fac") {
            if (!LAB.isFactored(t)) return { ok: false, why: "That equals the expression, but it isn't factored — it should be a product." };
            var nf = factorsOf(t).filter(hasVar).length;
            if (a.nf != null && nf !== a.nf) return { ok: false, why: "Nearly: it's a product, but not factored completely. Can any factor be factored again?" };
          }
          if (a.form === "gcf") {
            if (!LAB.isFactored(t)) return { ok: false, why: "That equals the expression, but it isn't factored — the common factor should be outside a bracket." };
            if (!gcfOut(t)) return { ok: false, why: "You've started right, but a common factor is still inside the brackets. Take out the greatest one." };
          }
          if (a.form === "mono" && !monoSimple(t)) return { ok: false, why: "That equals the answer, but it isn't in simplest form yet — one number in front, each letter once." };
          if (a.form === "posexp" && !posExp(t)) return { ok: false, why: "That equals the answer, but write it with positive exponents only." };
          if (a.form === "rad" && !radSimple(t)) return { ok: false, why: "That equals the answer, but the radical isn't in simplest form." };
          if (a.form === "expanded" && LAB.isFactored(t) && !LAB.isSimplified(t)) return { ok: false, why: "That equals the answer, but it still has brackets to multiply out." };
          return { ok: true };
        }
        case "eq": {
          var rel = LAB.parseRel(raw);
          if (rel.rels.length !== 1 || rel.rels[0] !== "=") return { bad: "Write an equation with one = sign, like y = 2x + 3." };
          if (!LAB.sameEquation(rel, LAB.parseRel(a.v))) return { ok: false };
          if (a.form === "slope") {
            var y = a.y || "y", lhs = rel.sides[0];
            while (lhs.t === "par") lhs = lhs.a;
            var iso = lhs.t === "var" && lhs.n === y && !LAB.varsOf(rel.sides[1])[y];
            if (!iso) return { ok: false, why: "That's the right line. Now write it as " + y + " = mx + b." };
          }
          if (a.form === "std") {
            var okStd = true;
            try {
              var Lh = rel.sides[0], Rh = rel.sides[1];
              if (LAB.varsOf(Rh).x || LAB.varsOf(Rh).y) okStd = false;
              // integers, no fractions
              walkNodes(rel.sides[0], function (n) { if (n.t === "div") okStd = false; if (n.t === "num" && Math.abs(n.v - Math.round(n.v)) > 1e-9) okStd = false; });
              walkNodes(rel.sides[1], function (n) { if (n.t === "div") okStd = false; if (n.t === "num" && Math.abs(n.v - Math.round(n.v)) > 1e-9) okStd = false; });
            } catch (e) { okStd = false; }
            if (!okStd) return { ok: false, why: "That's the right line. Standard form is Ax + By = C with whole numbers." };
          }
          return { ok: true };
        }
        case "rel": {
          var rr = LAB.parseRel(raw);
          if (!rr.rels.length) return { bad: "Write an inequality, like x > 3." };
          return { ok: LAB.sameRelation(rr, LAB.parseRel(a.v), a.x || "x") };
        }
        case "pt": {
          var pv = readList(raw);
          if (!pv || pv.length !== 2) return { bad: "Write the point as two numbers, like (2, -3)." };
          return { ok: close(pv[0], a.v[0], a.tol, a.abs) && close(pv[1], a.v[1], a.tol, a.abs) };
        }
      }
    } catch (e) {
      return { bad: "I couldn't read that. " + (e && e.message ? e.message : "") };
    }
    return { ok: false };
  };


  /* ============================================== The same topics, as a unit
     The rest of OEdu knows courses as units of lessons and skills, and a
     teacher can set a unit or a lesson as work. So each slice of a Pathway is
     also a lab unit: one lesson per topic (the idea, then three questions
     made by the topic's own generator), one skill per topic, and the unit
     test the lab builds from the skills. Same questions, same answers; the
     ring and the check are the adaptive way in, the unit is the ordinary one. */
  function walkHTML(walk) {
    return '<ol class="pw-walk">' + walk.map(function (w) {
      return '<li><div class="pw-wm">' + LAB.m(w[0]) + '</div><div class="pw-wy">' + LAB.fmt(w[1]) + "</div></li>";
    }).join("") + "</ol>";
  }
  P.toLabStep = function (it, kicker) {
    var a = it.a, st;
    var prompt = it.q + (it.fig ? '<div class="pw-fig">' + it.fig + "</div>" : "");
    function near(list) {
      return (list || []).filter(function (f) { return typeof f.v === "number"; }).map(function (f) { return { v: f.v, fb: f.say, tol: 1e-9 }; });
    }
    switch (a.k) {
      case "choice":
        st = { type: "choice", prompt: prompt, keep: true, answer: a.ok, options: a.opts.map(function (o, i) { return { t: o.t, fb: i === a.ok ? null : o.why || null }; }) };
        break;
      case "num": st = { type: "num", prompt: prompt, answer: a.v, tol: a.abs ? a.tol || 0.005 : Math.abs(a.v - Math.round(a.v)) < 1e-9 ? 1e-9 : 1e-6, shown: String(Math.round(a.v * 1e6) / 1e6), pre: null, post: it.unit || null, near: near(it.fb) }; break;
      case "list": st = { type: "numbers", prompt: prompt, answer: a.abs ? a.v.map(function (v) { return Math.round(v * 100) / 100; }) : a.v }; break;
      case "pt": st = { type: "pair", prompt: prompt, answer: a.v, near: (it.fb || []).filter(function (f) { return Array.isArray(f.v); }).map(function (f) { return { v: f.v, fb: f.say }; }) }; break;
      case "expr": st = { type: "expr", prompt: prompt, answer: a.v, form: a.form === "simp" ? "simplified" : a.form === "fac" || a.form === "gcf" ? "factored" : undefined }; break;
      case "eq": st = { type: "equation", prompt: prompt, answer: a.v, form: a.form === "slope" ? "slope-intercept" : undefined }; break;
      case "rel": st = { type: "ineq", prompt: prompt, answer: a.v, variable: a.x || "x" }; break;
      default: st = { type: "learn", prompt: prompt };
    }
    st.hints = it.hint ? [it.hint] : [];
    st.why = it.walk ? walkHTML(it.walk) : "";
    if (kicker) st.kicker = kicker;
    return st;
  };
  /* Register slice n (1-based) of a course as the lab unit courseId:n. */
  P.labUnit = function (cid, n) {
    var def = COURSES[cid], cat = def && def.cats[n - 1];
    if (!cat) return;
    var topics = cat.topics.slice().sort(function (x, y) { return x.depth - y.depth; });
    function plain(t) { return String(t || "").replace(/\$([^$]+)\$/g, "$1"); }
    LAB.unit(cid, n, {
      title: cat.name,
      lessons: topics.map(function (t) {
        var steps = [{ type: "learn", prompt: "<b>" + LAB.esc(t.name) + ".</b> " + LAB.fmt(t.idea || "") }];
        [1, 2, 2].forEach(function (d, i) { steps.push(P.toLabStep(t.gen(LAB.rng("lesson:" + t.id + ":" + i), d), i === 0 ? "Try it" : null)); });
        return { title: t.name, blurb: plain(t.idea).split(/\.\s/)[0].replace(/\.?$/, "."), mins: 6, steps: steps };
      }),
      skills: topics.map(function (t, i) {
        return { id: cid + "." + t.id, title: t.name, lesson: i + 1, gen: function (R, j) { return P.toLabStep(t.gen(R, 1 + (j % 3))); } };
      }),
      quizzes: []
    });
  };

  P.util = { close: close, gcd: gcd, dayKey: dayKey, DAY: DAY };
})();
