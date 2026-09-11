/* ==========================================================================
   Local content.

   This file used to be called "the school", and it used to hold grades,
   people, roles and enrolment in localStorage. That was wrong, and it is
   worth saying why rather than quietly deleting it: a grade kept in a browser
   is a grade that exists for exactly one person on exactly one machine. A
   teacher who changed a mark here changed nothing a student would ever see,
   and the screen showed no sign of it. A convincing lie is worse than a
   missing feature.

   All of that now lives in the platform database and reaches the frontend
   through api.js. Identity, roles, enrolment, work and grades are the
   server's, decided by the server, and this file no longer has an opinion
   about any of them.

   What is left is genuinely local: study-set content authored on this device.
   There is no `learn_study_sets` table yet, so a set written here reaches
   nobody else — and the console says so on the screen where they are written,
   rather than letting somebody discover it later.

   It stays an overlay on data.js rather than a replacement, so nothing that
   ships can be destroyed by an edit, and the whole of a device's divergence
   from what shipped is one readable object.
   ========================================================================== */
window.OPLO_SCHOOL = (function () {
  "use strict";

  var D = window.OPLO;
  var KEY = "oplo.learn.school";
  var VERSION = 1;

  function blank() {
    return {
      v: VERSION,
      sets: {},                 // setId -> a full set, or a patch over a shipped one
      hidden: { sets: [] },
      at: null
    };
  }

  var d = blank();
  var subs = [];

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (!raw) return;
    try {
      var p = JSON.parse(raw);
      if (!p || typeof p !== "object") return;
      d = blank();
      if (p.sets && typeof p.sets === "object") d.sets = p.sets;
      if (p.hidden && Array.isArray(p.hidden.sets)) d.hidden.sets = p.hidden.sets;
      d.at = p.at || null;
    } catch (e) { d = blank(); }
  }

  var t = null;
  function save() {
    clearTimeout(t);
    t = setTimeout(flush, 200);
  }
  function flush() {
    clearTimeout(t);
    d.at = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* full */ }
    subs.forEach(function (fn) { try { fn(); } catch (e) { /* not our problem */ } });
  }
  function subscribe(fn) { subs.push(fn); }

  /* ------------------------------------------------------------- Merging
     A shipped record patched by an overlay. Deliberately shallow with two
     named exceptions: `units` and `cards` are arrays that are replaced whole
     when present, because a half-merged list of units is not a thing anybody
     can reason about. */
  function merge(base, patch) {
    if (!patch) return base;
    if (!base) return patch;
    var out = {};
    var k;
    for (k in base) out[k] = base[k];
    for (k in patch) out[k] = patch[k];
    return out;
  }

  function hidden(kind, id) { return d.hidden[kind].indexOf(id) > -1; }

  /* ----------------------------------------------------------- Reading
     Every one of these returns the same shape data.js returns, so the app
     above cannot tell whether a course shipped or was written this morning.
     That is the whole design goal: no screen should have to care. */

  function shippedCourses() {
    return D.SUBJECTS.reduce(function (a, s) { return a.concat(s.courses); }, []);
  }

  function courses() {
    // The shipped catalogue only. Courses that carry enrolment, work and
    // grades are database rows and arrive through api.js — mixing the two
    // here is what made the old version dishonest.
    return shippedCourses();
  }

  function course(id) {
    return courses().filter(function (c) { return c.id === id; })[0] || null;
  }

  /* Subjects are derived rather than stored, so a course added to a new
     subject creates the subject, and a subject emptied of courses stops
     appearing. A stored list would need reconciling on every edit. */
  function subjects() {
    var all = courses(), out = [], byName = {};
    D.SUBJECTS.forEach(function (s) {
      var row = { n: s.n, hue: s.hue, d: s.d, courses: [] };
      byName[s.n] = row;
      out.push(row);
    });
    all.forEach(function (c) {
      var name = c.subject || "Other";
      if (!byName[name]) {
        byName[name] = { n: name, hue: c.hue || "#6e6e73",
                         d: "Courses added to this school.", courses: [] };
        out.push(byName[name]);
      }
      byName[name].courses.push(c);
    });
    return out.filter(function (s) { return s.courses.length; });
  }

  function sets() {
    var out = {}, id;
    for (id in D.SETS) {
      if (hidden("sets", id)) continue;
      out[id] = merge(D.SETS[id], d.sets[id]);
    }
    for (id in d.sets) {
      if (out[id] || hidden("sets", id)) continue;
      if (d.sets[id] && d.sets[id].cards) out[id] = d.sets[id];
    }
    return out;
  }

  function set(id) { return sets()[id] || null; }

  function saveSet(actor, id, patch) {
    var was = d.sets[id] || {};
    d.sets[id] = merge(was, patch);
    d.sets[id].added = !D.SETS[id];
    d.sets[id].by = actor && actor.id;
    save();
    return d.sets[id];
  }

  /* Hiding a shipped study set. Hidden rather than deleted: nothing that
     ships with the site can be destroyed from a browser. */
  function hide(actor, kind, id) {
    if (!d.hidden[kind]) d.hidden[kind] = [];
    if (d.hidden[kind].indexOf(id) < 0) d.hidden[kind].push(id);
    save();
  }
  function unhide(actor, kind, id) {
    if (!d.hidden[kind]) return;
    d.hidden[kind] = d.hidden[kind].filter(function (x) { return x !== id; });
    save();
  }

  function reset() {
    d = blank();
    flush();
  }

  load();

  return {
    VERSION: VERSION,
    /* The shipped catalogue, unchanged. Courses that carry enrolment and
       grades come from the API, not from here — these are published content
       for browsing and studying. */
    subjects: subjects, courses: courses, course: course,
    sets: sets, set: set,
    saveSet: saveSet, hide: hide, unhide: unhide,
    reset: reset, subscribe: subscribe, save: save, flush: flush,
    raw: function () { return d; }
  };
})();
