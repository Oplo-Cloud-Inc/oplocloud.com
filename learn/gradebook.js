/* ==========================================================================
   OEdu — the student's gradebook.

   /student/Grades. Built for the three questions a student actually brings
   to it, in the order they ask them, and nothing else on the screen:

     What are my grades?   One page: the numbers that matter, every class
                           with its grade, the years before this one, and
                           what needs doing.
     Why?                  Tap a class: its grade in a sentence, every
                           assignment in plain words, and how the grade is
                           made. Tap an assignment for the teacher's
                           feedback and any change to the mark.
     What do I need?       On the class page: pick a letter, and it says the
                           score needed on what's left.

   Each place is an address — /student/Grades/Algebra-2, /Grades/2025-26,
   /Grades/Plan — so Back works, a refresh stays put, and a link can be
   shared. app.js owns the browser history; this file asks it to record a
   step (opts.go) and to take one back (opts.back).

   Every grade is computed by the server — the weighting, the dropped marks,
   the late rules, and the "what do I need" answer, which is the server's
   what-if searched for the target. This file never adds up a column itself,
   so it can never disagree with what a teacher sees.

   Mounted by app.js: OPLO_GRADEBOOK.mount(host, { me, at, go, back,
   graduation, toast }); OPLO_GRADEBOOK.view(segments) redraws a place.
   ========================================================================== */
window.OPLO_GRADEBOOK = (function () {
  "use strict";

  var API = window.OPLO_API;
  var DAY = 86400000;
  var FRESH = 2 * 60 * 1000;      // how long a read is reused when coming back

  var POINTS = { "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2,
                 "C-": 1.7, "D+": 1.3, "D": 1, "D-": 0.7, "F": 0 };
  var AREA_NAMES = { english: "English", math: "Math", science: "Science",
                     social_studies: "Social Studies", health: "Health", pe: "Physical Education",
                     fine_art: "Fine Art", world_language: "World Language", elective: "Electives" };
  var AREA_ORDER = ["english", "math", "science", "social_studies", "world_language",
                    "fine_art", "health", "pe", "elective"];
  // The goals a student can pick, with the percentage each one starts at on
  // the server's scale — shown on the button, so "B" is never a guess.
  var GOALS = [["A", 93], ["B", 83], ["C", 73], ["D", 63]];

  /* ------------------------------------------------------------ Helpers */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function btn(cls, html, label) {
    var b = el("button", cls, html);
    b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    return b;
  }
  function ms(x) {
    if (x == null || x === "") return null;
    if (typeof x === "number") return x;
    var n = Number(x);
    if (isFinite(n)) return n;
    var t = Date.parse(x);
    return isFinite(t) ? t : null;
  }
  function day(x) {
    var t = ms(x);
    return t == null ? "" : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function dayLong(x) {
    var t = ms(x);
    return t == null ? "" : new Date(t).toLocaleDateString(undefined,
      { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }
  function when(t) {
    var d0 = new Date(); d0.setHours(0, 0, 0, 0);
    var d = new Date(t); d.setHours(0, 0, 0, 0);
    var n = Math.round((d - d0) / DAY);
    if (n === 0) return "today";
    if (n === 1) return "tomorrow";
    if (n === -1) return "yesterday";
    if (n > 1 && n < 7) return new Date(t).toLocaleDateString(undefined, { weekday: "long" });
    return day(t);
  }
  function num(x) { return String(Math.round(Number(x) * 100) / 100); }
  function plural(n, one, many) { return n + " " + (Number(n) === 1 ? one : (many || one + "s")); }
  function band(p) {
    if (p == null) return "none";
    return p >= 90 ? "a" : p >= 80 ? "b" : p >= 70 ? "c" : p >= 60 ? "d" : "f";
  }
  function letterFor(p) {
    return p >= 93 ? "A" : p >= 90 ? "A-" : p >= 87 ? "B+" : p >= 83 ? "B"
         : p >= 80 ? "B-" : p >= 77 ? "C+" : p >= 73 ? "C" : p >= 70 ? "C-"
         : p >= 67 ? "D+" : p >= 63 ? "D" : p >= 60 ? "D-" : "F";
  }
  // Excel High School's scale, which a transcript is on: A to F, no signs.
  function ehsLetter(p) { return p >= 90 ? "A" : p >= 80 ? "B" : p >= 70 ? "C" : p >= 60 ? "D" : "F"; }
  function slug(s) { return String(s || "").trim().replace(/\s+/g, "-"); }
  function same(a, b) { return String(a || "").toLowerCase() === String(b || "").toLowerCase(); }
  function yearName(y) {
    var m = String(y || "").match(/^(\d{4})\D+(\d{2,4})$/);
    return m ? m[1] + "–" + m[2].slice(-2) : String(y || "Undated");
  }
  function thisYear() {
    var d = new Date(), y = d.getFullYear();
    return d.getMonth() >= 6 ? y + "–" + String(y + 1).slice(-2) : (y - 1) + "–" + String(y).slice(-2);
  }
  function chev() {
    return '<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* ------------------------------------------------------------ State */
  var G = null;
  var CACHE = null;

  function mount(host, opts) {
    opts = opts || {};
    G = { host: host, me: opts.me || {}, opts: opts, classes: [], byId: {}, years: [], record: null,
          goalCache: {}, loaded: false };
    host.innerHTML = "";
    host.classList.add("sg");
    var fresh = CACHE && CACHE.meId === G.me.id && Date.now() - CACHE.at < FRESH;
    if (fresh) {
      build(CACHE.data);
      render(opts.at);
      return;
    }
    host.appendChild(el("p", "lx-eyebrow", "Grades"));
    host.appendChild(el("h1", "lx-h1", "My grades"));
    host.appendChild(el("div", "sg-wait", "Getting your grades…"));
    load(opts.at);
  }

  function load(at) {
    var me = G.me, mine = G;
    Promise.all([
      API.reporting.coursework(me.id),
      API.grades.list(),
      API.reporting.report(me.id).catch(function () { return null; }),
      // The record — earlier schools and EHS's own — adds to this year's
      // grades; a record that cannot be read leaves them standing.
      API.graduation.get().catch(function () { return null; })
    ]).then(function (out) {
      var data = { cw: out[0] || {}, gl: out[1] || {}, report: out[2], record: out[3] };
      CACHE = { meId: me.id, at: Date.now(), data: data };
      if (G !== mine) return;                     // the page was left and reopened meanwhile
      build(data);
      render(at);
    }, function (e) {
      if (G !== mine) return;
      var h = G.host;
      h.innerHTML = "";
      h.appendChild(el("p", "lx-eyebrow", "Grades"));
      h.appendChild(el("h1", "lx-h1", "My grades"));
      var box = el("div", "sg-box sg-failed");
      box.appendChild(el("b", null, e && e.code === "offline" ? "Can't reach OEdu right now" : "Your grades didn't load"));
      box.appendChild(el("p", null, "Check your connection and try again. Your grades are safe — they're kept on the " +
        "server, not in this browser."));
      var again = btn("sg-btn", "Try again");
      again.addEventListener("click", function () { mount(G.host, G.opts); });
      box.appendChild(again);
      h.appendChild(box);
    });
  }

  /* ------------------------------------------------------------ The data
     One object per class — the server's computed grade, every assignment
     with the student's mark on it, the teacher's comment — and the record
     laid out as past years. */
  function build(data) {
    var cw = data.cw, gl = data.gl, report = data.report;
    var byId = {};
    function cls(id, title, code) {
      if (!byId[id]) byId[id] = { id: id, title: title || "Class", code: code || "", work: [], summary: null, comment: null };
      if (title && byId[id].title === "Class") byId[id].title = title;
      if (code && !byId[id].code) byId[id].code = code;
      return byId[id];
    }
    (cw.work || []).forEach(function (w) { cls(w.courseId, w.courseTitle, w.courseCode).work.push(Object.assign({}, w)); });
    (gl.summaries || []).forEach(function (s) { cls(s.courseId, s.courseTitle).summary = s; });
    (gl.grades || []).forEach(function (g) {
      var c = cls(g.courseId, null);
      if (c.work.some(function (w) { return w.assignmentId === g.assignmentId; })) return;
      c.work.push({ courseId: g.courseId, assignmentId: g.assignmentId, title: g.title, category: g.category,
                    outOf: g.outOf, dueAt: null, extraCredit: g.extraCredit, status: g.status, score: g.score,
                    late: g.late, feedback: g.feedback, gradedAt: g.gradedAt });
    });
    ((report && report.courses) || []).forEach(function (rc) {
      if (byId[rc.courseId] && rc.comment && String(rc.comment.body || "").trim()) byId[rc.courseId].comment = rc.comment;
    });
    var now = Date.now();
    Object.keys(byId).forEach(function (id) {
      var c = byId[id];
      var dropped = {};
      ((c.summary && c.summary.dropped) || []).forEach(function (d) { dropped[d.assignmentId] = true; });
      c.work.forEach(function (w) {
        w.dropped = !!dropped[w.assignmentId];
        w.pct = w.score != null && w.outOf > 0 ? Math.round(w.score / w.outOf * 1000) / 10 : null;
        w.dueMs = ms(w.dueAt);
        w.state = w.status === "missing" ? "missing"
          : w.status === "excused" ? "excused"
          : (w.status === "marked" && w.score != null) ? "graded"
          : (w.dueMs != null && w.dueMs < now - DAY) ? "late"
          : "coming";
      });
      c.missing = c.work.filter(function (w) { return w.state === "missing"; }).length;
      c.late = c.work.filter(function (w) { return w.state === "late"; }).length;
      c.graded = c.work.filter(function (w) { return w.state === "graded"; }).length;
    });
    G.byId = byId;
    buildRecord(data.record, byId);
    G.classes = Object.keys(byId).map(function (k) { return byId[k]; })
      .sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
    G.loaded = true;
  }

  function buildRecord(g, byId) {
    G.record = g && g.totals ? g : null;
    G.years = [];
    if (!G.record) return;
    var names = {};
    (g.areas || []).forEach(function (a) { names[a.key] = a.name; });
    function area(k) { return names[k] || AREA_NAMES[k] || (k ? String(k).replace(/_/g, " ") : ""); }
    function rank(k) { var i = AREA_ORDER.indexOf(k); return i < 0 ? AREA_ORDER.length : i; }
    var school = (g.transfer && g.transfer.school) || "Previous school";
    var byYear = {};
    function put(item) { var k = item.year || "Undated"; (byYear[k] = byYear[k] || []).push(item); }
    (g.courses || []).forEach(function (c) {
      put({ id: "t:" + c.id, school: school, title: c.title, year: c.year, pct: c.markNumeric, mark: c.mark,
            letter: c.letter || (c.mark && !/\d/.test(c.mark) ? c.mark : null),
            credits: c.decision === "declined" ? 0 : Number(c.ehsCredits || 0),
            area: area(c.area), areaKey: c.area });
    });
    (g.ehsCourses || []).forEach(function (c) {
      if (c.courseId && byId[c.courseId]) return;                // already a live class
      if (c.status === "in_progress") {
        var id = "rec:" + c.id;
        byId[id] = { id: id, title: c.title, code: c.code || "", work: [], summary: null, comment: null,
                     recordOnly: true, school: "Excel High School", credits: Number(c.credits || 0),
                     missing: 0, late: 0, graded: 0 };
        return;
      }
      put({ id: "e:" + c.id, school: "Excel High School", title: c.title, year: c.year, pct: c.markNumeric,
            mark: c.mark, letter: c.letter, credits: c.status === "completed" ? Number(c.credits || 0) : 0,
            area: area(c.area), areaKey: c.area });
    });
    var meta = {};
    (g.years || []).forEach(function (y) { meta[y.year] = y; });
    G.years = Object.keys(byYear).sort(function (a, b) {
      if (a === "Undated") return 1;
      if (b === "Undated") return -1;
      return a < b ? 1 : -1;
    }).map(function (k) {
      var list = byYear[k].sort(function (a, b) {
        return rank(a.areaKey) - rank(b.areaKey) || String(a.title).localeCompare(String(b.title));
      });
      var schools = [];
      list.forEach(function (c) { if (schools.indexOf(c.school) < 0) schools.push(c.school); });
      var m = meta[k] || {};
      var credits = list.reduce(function (s, c) { return s + c.credits; }, 0);
      var label = yearName(k);
      return { key: k, label: label, seg: label.replace(/–/g, "-"), school: schools.join(" & "), courses: list,
               credits: Math.round((m.credits != null ? m.credits : credits) * 1000) / 1000,
               average: m.average != null ? m.average : null };
    });
  }

  function gpaNow() {
    var pts = [], pcts = [];
    G.classes.forEach(function (c) {
      if (!c.summary) return;
      pts.push(POINTS[c.summary.letter] != null ? POINTS[c.summary.letter] : 0);
      pcts.push(c.summary.percent);
    });
    if (!pts.length) return null;
    var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
    return { gpa: sum(pts) / pts.length, avg: sum(pcts) / pcts.length, n: pts.length };
  }

  /* What needs doing, most urgent first: missing, then late, then due soon. */
  function todo() {
    var now = Date.now(), out = [];
    G.classes.forEach(function (c) {
      c.work.forEach(function (w) {
        var kind = w.state === "missing" ? 0 : w.state === "late" ? 1
          : (w.state === "coming" && w.dueMs != null && w.dueMs - now < 7 * DAY) ? 2 : -1;
        if (kind >= 0) out.push({ c: c, w: w, kind: kind });
      });
    });
    return out.sort(function (a, b) { return a.kind - b.kind || (a.w.dueMs || 0) - (b.w.dueMs || 0); });
  }

  /* ================================================================ Places */
  function find(s0) {
    if (!s0) return null;
    if (same(s0, "Plan") && G.opts.graduation && G.record) {
      return { segs: ["Plan"], label: "Graduation plan", draw: drawPlan };
    }
    var c = G.classes.filter(function (x) { return same(slug(x.title), s0); })[0];
    if (c) return { segs: [slug(c.title)], label: c.title, draw: function () { drawClass(c); } };
    var y = G.years.filter(function (x) { return same(x.seg, s0); })[0];
    if (y) return { segs: [y.seg], label: y.label, draw: function () { drawYear(y); } };
    return null;
  }

  /* The page was opened at an address: draw it, and let the history entry
     the address already has stand for it. */
  function render(at) {
    var p = find((at || [])[0]);
    if (!p) { drawHome(); return; }
    if (G.opts.go) G.opts.go(p.segs, p.label, true);
    p.draw();
  }

  /* Going somewhere new is a step Back can undo. */
  function goTo(segs, label, draw) {
    if (G.opts.go) G.opts.go(segs, label, false);
    draw();
    window.scrollTo(0, 0);
  }
  function back() {
    if (G.opts.back) G.opts.back(); else drawHome();
  }

  function clear() { G.host.innerHTML = ""; }
  function backButton() {
    var b = btn("sg-back", '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8 10 12.5" fill="none" ' +
      'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>My grades');
    b.addEventListener("click", back);
    return b;
  }

  /* ================================================================ Home */
  function drawHome() {
    clear();
    var h = G.host;
    var first = G.me.firstName || String(G.me.name || "").split(" ")[0];
    h.appendChild(el("p", "lx-eyebrow", "Grades"));
    h.appendChild(el("h1", "lx-h1", first ? esc(first) + "’s grades" : "My grades"));

    if (!G.classes.length && !G.years.length) {
      h.appendChild(el("div", "sg-box sg-empty", "<b>No grades yet</b><p>When a teacher adds you to a class and grades " +
        "your work, it shows up here — on this device and any other you sign in on.</p>"));
      return;
    }

    /* ---- The numbers that matter, at most three */
    var r = G.record, g = gpaNow(), jobs = todo();
    var stats = el("div", "sg-stats");
    var rg = r && r.gpa ? (r.gpa.issued != null ? r.gpa.issued : r.gpa.value) : null;
    if (rg != null) {
      stats.appendChild(stat("GPA", Number(rg).toFixed(2), "From your transcript", "b-" + gpaBand(rg)));
    } else if (g) {
      stats.appendChild(stat("Average this year", Math.round(g.avg) + "%",
        letterFor(g.avg) + " across " + plural(g.n, "class", "classes"), "b-" + band(g.avg)));
    }
    if (r && r.track) {
      var s = stat("Credits", num(r.totals.earned) + "<small> of " + num(r.track.total) + "</small>",
        r.totals.remaining > 0 ? num(r.totals.remaining) + " more to graduate" : "Enough to graduate", "b-credit");
      var bar = el("div", "sg-bar");
      bar.innerHTML = '<i style="width:' + Math.min(100, r.totals.applied / r.track.total * 100) + '%"></i>';
      s.appendChild(bar);
      stats.appendChild(s);
    }
    var urgent = jobs.filter(function (j) { return j.kind < 2; }).length;
    stats.appendChild(stat("Missing or late", String(urgent),
      urgent ? "Hand " + (urgent === 1 ? "it" : "these") + " in soon" : "You’re all caught up", urgent ? "b-f" : "b-a"));
    h.appendChild(stats);

    var grid = el("div", "sg-home");
    var main = el("div", "sg-main");
    var side = el("div", "sg-side");

    /* ---- This year's classes */
    var sec = el("section", "sg-sec");
    sec.appendChild(el("h2", null, "This year’s classes"));
    if (!G.classes.length) {
      sec.appendChild(el("p", "sg-muted", "No classes yet this year. When a teacher adds you to one, it shows up here."));
    } else {
      var list = el("div", "sg-list");
      G.classes.forEach(function (c) { list.appendChild(classRow(c)); });
      sec.appendChild(list);
    }
    main.appendChild(sec);

    /* ---- Past years */
    if (G.years.length) {
      var ps = el("section", "sg-sec");
      ps.appendChild(el("h2", null, "Past years"));
      var pl = el("div", "sg-list");
      G.years.forEach(function (y) { pl.appendChild(yearRow(y)); });
      ps.appendChild(pl);
      main.appendChild(ps);
    }

    /* ---- To do */
    var td = el("section", "sg-box sg-todo");
    td.appendChild(el("h2", null, "To do"));
    if (!jobs.length) {
      td.appendChild(el("p", "sg-done", '<span aria-hidden="true">✓</span> You’re all caught up. Nothing is missing, ' +
        "late or due this week."));
    } else {
      var tl = el("div", "sg-todo-list");
      jobs.slice(0, 6).forEach(function (j) {
        var tag = ["Missing", "Late", "Due " + when(j.w.dueMs)][j.kind];
        var b = btn("sg-todo-item k" + j.kind, '<span class="tag">' + esc(tag) + "</span><b>" + esc(j.w.title) +
          "</b><small>" + esc(j.c.title) + " · " + plural(num(j.w.outOf), "point") + "</small>");
        b.addEventListener("click", function () { openClass(j.c, j.w.assignmentId); });
        tl.appendChild(b);
      });
      td.appendChild(tl);
      if (jobs.length > 6) td.appendChild(el("p", "sg-muted", "…and " + (jobs.length - 6) + " more in your classes."));
    }
    side.appendChild(td);

    /* ---- More, out of the way */
    var more = el("section", "sg-box sg-more");
    more.appendChild(el("h2", null, "More"));
    if (G.opts.graduation && r) {
      more.appendChild(moreBtn("Graduation plan", "What you still need to graduate", function () {
        goTo(["Plan"], "Graduation plan", drawPlan);
      }));
    }
    more.appendChild(moreBtn("Print report card", "A clean page for paper", printReport));
    more.appendChild(moreBtn("Download my grades", "A spreadsheet of every class and year", exportAll));
    side.appendChild(more);

    grid.appendChild(main);
    grid.appendChild(side);
    h.appendChild(grid);
  }

  function gpaBand(v) { return v >= 3.5 ? "a" : v >= 2.5 ? "b" : v >= 1.5 ? "c" : "f"; }

  function stat(label, value, sub, tone) {
    var s = el("div", "sg-stat " + (tone || ""));
    s.appendChild(el("span", "l", esc(label)));
    s.appendChild(el("b", null, value));
    s.appendChild(el("span", "s", esc(sub)));
    return s;
  }

  function moreBtn(title, sub, go) {
    var b = btn("sg-more-btn", '<span class="t"><b>' + esc(title) + "</b><small>" + esc(sub) + "</small></span>" + chev());
    b.addEventListener("click", go);
    return b;
  }

  function classRow(c) {
    var s = c.summary;
    var notes = [];
    if (c.recordOnly) notes.push(esc(c.school) + " · in progress");
    else notes.push(c.graded + " of " + plural(c.work.length, "assignment") + " graded");
    if (c.missing) notes.push('<em class="bad">' + c.missing + " missing</em>");
    if (c.late) notes.push('<em class="warn">' + c.late + " late</em>");
    var b = btn("sg-row", '<span class="t"><b>' + esc(c.title) + "</b><small>" + notes.join(" · ") + "</small></span>" +
      '<span class="g b-' + (s ? band(s.percent) : "none") + '"><b>' + (s ? esc(s.letter) : "—") + "</b><small>" +
      (s ? s.percent + "%" : c.recordOnly ? "In progress" : "Not graded yet") + "</small></span>" + chev());
    b.addEventListener("click", function () { openClass(c); });
    return b;
  }

  function yearRow(y) {
    var b = btn("sg-row", '<span class="t"><b>' + esc(y.label) + "</b><small>" + esc(y.school) + " · " +
      plural(y.courses.length, "course") + " · " + plural(num(y.credits), "credit") + "</small></span>" +
      '<span class="g b-' + band(y.average) + '"><b>' + (y.average != null ? ehsLetter(y.average) : "—") + "</b><small>" +
      (y.average != null ? num(y.average) + "% average" : "Final grades") + "</small></span>" + chev());
    b.addEventListener("click", function () { goTo([y.seg], y.label, function () { drawYear(y); }); });
    return b;
  }

  function openClass(c, assignmentId) {
    goTo([slug(c.title)], c.title, function () { drawClass(c, assignmentId); });
  }

  /* ================================================================ A class */
  function drawClass(c, focus) {
    clear();
    var h = G.host, s = c.summary;
    h.appendChild(backButton());

    var head = el("header", "sg-head");
    var t = el("div", "t");
    if (c.code || c.school) t.appendChild(el("p", "lx-eyebrow", esc(c.recordOnly ? c.school : c.code)));
    t.appendChild(el("h1", "lx-h1", esc(c.title)));
    var say;
    if (c.recordOnly) say = "This class is in progress. Grades show up here as your teacher marks your work.";
    else if (!s) say = "Nothing has been graded yet. Your grade shows up after the first mark.";
    else {
      say = "You have " + (/^[AF]/.test(s.letter) ? "an" : "a") + " <b class=\"b-" + band(s.percent) + "\">" +
        esc(s.letter) + " (" + s.percent + "%)</b>. " +
        c.graded + " of " + plural(c.work.length, "assignment") + " " + (c.graded === 1 ? "is" : "are") + " graded.";
      if (s.totalWeight && s.countedWeight < s.totalWeight) {
        say += " Parts of the class with no grades yet don’t count, so this can still change a lot.";
      }
    }
    t.appendChild(el("p", "sg-say", say));
    head.appendChild(t);
    var big = el("div", "sg-big b-" + (s ? band(s.percent) : "none"));
    big.innerHTML = s ? "<b>" + esc(s.letter) + "</b><span>" + s.percent + "%</span>"
      : "<span>" + (c.recordOnly ? "In progress" : "No grade yet") + "</span>";
    head.appendChild(big);
    h.appendChild(head);

    if (c.recordOnly) return;

    /* ---- Needs attention */
    var urgent = c.work.filter(function (w) { return w.state === "missing" || w.state === "late"; });
    if (urgent.length) {
      var box = el("section", "sg-box sg-alert");
      box.appendChild(el("h2", null, urgent.length === 1 ? "1 thing needs your attention"
                                                        : urgent.length + " things need your attention"));
      urgent.forEach(function (w) {
        box.appendChild(el("p", null, "<b>" + esc(w.title) + "</b> — " + (w.state === "missing"
          ? "missing. It counts as 0 until you hand it in."
          : "was due " + esc(when(w.dueMs)) + " and hasn’t been graded. Hand it in if you haven’t.")));
      });
      h.appendChild(box);
    }

    /* ---- Assignments */
    var sec = el("section", "sg-sec");
    sec.appendChild(el("h2", null, "Assignments"));
    if (!c.work.length) {
      sec.appendChild(el("p", "sg-muted", "No assignments yet."));
    } else {
      var list = el("div", "sg-list");
      var order = { missing: 0, late: 1, coming: 2, graded: 3, excused: 4 };
      c.work.slice().sort(function (a, b) {
        var ka = order[a.state], kb = order[b.state];
        if (ka !== kb) return ka - kb;
        var ta = a.dueMs || ms(a.gradedAt) || 0, tb = b.dueMs || ms(b.gradedAt) || 0;
        return a.state === "coming" ? ta - tb : tb - ta;       // soonest first; newest graded first
      }).forEach(function (w) { list.appendChild(assignment(w)); });
      sec.appendChild(list);
    }
    h.appendChild(sec);

    /* ---- How the grade is made, and what's needed */
    var two = el("div", "sg-two");
    two.appendChild(howMade(c));
    two.appendChild(goalBox(c));
    h.appendChild(two);

    if (c.comment) {
      var said = el("section", "sg-box sg-said");
      said.appendChild(el("h2", null, "From your teacher"));
      said.appendChild(el("p", null, esc(c.comment.body)));
      said.appendChild(el("small", null, esc(c.comment.author || "Your teacher") +
        (c.comment.updatedAt ? " · " + esc(dayLong(c.comment.updatedAt)) : "")));
      h.appendChild(said);
    }

    if (focus) {
      var row = G.host.querySelector('[data-id="' + focus + '"]');
      if (row) {
        row.click();
        setTimeout(function () { if (row.scrollIntoView) row.scrollIntoView({ block: "center" }); }, 30);
      }
    }
  }

  /* One assignment: what it is, what it got, in words. Tap for the rest. */
  function assignment(w) {
    var wrap = el("div", "sg-a s-" + w.state);
    var right;
    if (w.state === "graded") {
      right = '<span class="sc b-' + band(w.pct) + '"><b>' + num(w.score) + " / " + num(w.outOf) + "</b><small>" +
        w.pct + "%</small></span>";
    } else {
      right = '<span class="tag ' + w.state + '">' +
        ({ missing: "Missing", late: "Late", coming: "Not graded yet", excused: "Excused" }[w.state]) + "</span>";
    }
    var sub = [];
    if (w.category) sub.push(esc(w.category));
    if (w.dueMs != null) sub.push((w.state === "coming" ? "Due " : "Was due ") + esc(when(w.dueMs)));
    if (w.late && w.state === "graded") sub.push("Handed in late");
    if (w.extraCredit) sub.push("Extra credit");
    if (w.dropped) sub.push("Dropped — doesn’t count");
    if (w.feedback) sub.push('<em class="sg-fbtag">Teacher feedback</em>');
    var b = btn("sg-arow", '<span class="t"><b>' + esc(w.title) + "</b><small>" + sub.join(" · ") + "</small></span>" +
      right + chev());
    b.dataset.id = w.assignmentId;
    b.setAttribute("aria-expanded", "false");
    var more = el("div", "sg-amore");
    more.hidden = true;
    b.addEventListener("click", function () {
      var open = more.hidden;
      more.hidden = !open;
      b.setAttribute("aria-expanded", String(open));
      wrap.classList.toggle("open", open);
      if (open && !more.dataset.done) { more.dataset.done = "1"; fillDetail(more, w); }
    });
    wrap.appendChild(b);
    wrap.appendChild(more);
    return wrap;
  }

  function fillDetail(box, w) {
    var lines = [];
    if (w.state === "graded") lines.push("You got <b>" + num(w.score) + " out of " + num(w.outOf) + "</b> (" + w.pct + "%).");
    else if (w.state === "missing") lines.push("This is marked missing, so it counts as <b>0 out of " + num(w.outOf) +
      "</b> until you hand it in.");
    else if (w.state === "excused") lines.push("You were excused from this. It doesn’t count toward your grade.");
    else lines.push("Not graded yet. It’s out of " + num(w.outOf) + " points.");
    if (w.dueMs != null) lines.push("Due " + esc(dayLong(w.dueMs)) + ".");
    if (w.gradedAt) lines.push("Graded " + esc(dayLong(w.gradedAt)) + ".");
    if (w.dropped) lines.push("Your teacher’s rules drop this mark, so it doesn’t count.");
    if (w.extraCredit) lines.push("Extra credit can only raise your grade.");
    box.appendChild(el("p", null, lines.join(" ")));
    if (w.feedback) {
      var fb = el("div", "sg-fb");
      fb.appendChild(el("small", null, "Feedback from your teacher"));
      fb.appendChild(el("p", null, esc(w.feedback)));
      box.appendChild(fb);
    }
    var hist = el("p", "sg-muted", "Checking for changes to this mark…");
    box.appendChild(hist);
    API.grades.history({ assignmentId: w.assignmentId, accountId: G.me.id }).then(function (events) {
      if (!events || !events.length) { hist.textContent = "This mark hasn’t been changed since it was entered."; return; }
      function said(score, status) {
        if (status === "missing") return "missing";
        if (status === "excused") return "excused";
        return score == null ? "blank" : num(score);
      }
      hist.className = "sg-hist";
      hist.innerHTML = "<small>Changes to this mark</small>" + events.map(function (ev) {
        return "<span>" + esc(said(ev.fromScore, ev.fromStatus)) + " → <b>" + esc(said(ev.toScore, ev.toStatus)) +
          "</b> by " + esc(ev.actorName || "your teacher") + ", " + esc(day(ev.at)) +
          (ev.note ? " — “" + esc(ev.note) + "”" : "") + "</span>";
      }).join("");
    }, function () { hist.textContent = ""; });
  }

  function howMade(c) {
    var sec = el("section", "sg-box sg-how");
    sec.appendChild(el("h2", null, "How your grade is made"));
    var parts = (c.summary && c.summary.parts) || [];
    if (!parts.length) {
      sec.appendChild(el("p", "sg-muted", "This shows up after the first grade."));
      return sec;
    }
    parts.forEach(function (x) {
      var r = el("div", "sg-part");
      r.innerHTML = '<span class="t"><b>' + esc(x.category) + "</b><small>Counts for " + x.weight +
        "% of your grade</small></span>" + '<span class="v b-' + band(x.percent) + '">' + x.percent + "%</span>" +
        '<span class="sg-bar"><i class="b-' + band(x.percent) + '" style="width:' +
        Math.max(0, Math.min(100, x.percent)) + '%"></i></span>';
      sec.appendChild(r);
    });
    var s = c.summary, notes = [];
    if (s.dropped && s.dropped.length) notes.push("Dropped: " + s.dropped.map(function (d) { return esc(d.title); }).join(", ") + ".");
    if (s.lateCount) notes.push("Late work cost " + num(s.latePenalty) + (s.latePenalty === 1 ? " point." : " points."));
    if (s.extraCredit) notes.push(num(s.extraCredit) + " points of extra credit are included.");
    if (notes.length) sec.appendChild(el("p", "sg-muted", notes.join(" ")));
    return sec;
  }

  /* ---- What do I need?
     Asked of the server: its what-if, searched for the lowest average on the
     assignments left that reaches the goal — nine questions at most. */
  function remainingOf(c) {
    return c.work.filter(function (w) {
      return (w.state === "coming" || w.state === "late") && w.outOf > 0 && !w.extraCredit;
    });
  }
  function whatAt(c, rest, pct) {
    return API.grades.whatif(c.id, G.me.id, rest.map(function (w) {
      return { assignmentId: w.assignmentId, score: Math.round(pct * w.outOf) / 100, status: "marked" };
    })).then(function (r) { return r && r.then; });
  }
  function solve(c, min) {
    var key = c.id + ":" + min;
    if (G.goalCache[key]) return G.goalCache[key];
    var rest = remainingOf(c);
    var p = whatAt(c, rest, 100).then(function (top) {
      if (!top) throw new Error("no answer");
      if (top.percent < min) return { kind: "out", best: top };
      return whatAt(c, rest, 0).then(function (floor) {
        if (floor && floor.percent >= min) return { kind: "safe" };
        var lo = 0, hi = 100, at = top;
        function step() {
          if (hi - lo <= 1) return { kind: "need", pct: hi, at: at };
          var mid = Math.round((lo + hi) / 2);
          return whatAt(c, rest, mid).then(function (r) {
            if (r && r.percent >= min) { hi = mid; at = r; } else lo = mid;
            return step();
          });
        }
        return step();
      });
    });
    G.goalCache[key] = p;
    p.catch(function () { delete G.goalCache[key]; });
    return p;
  }

  function goalBox(c) {
    var sec = el("section", "sg-box sg-goal");
    sec.appendChild(el("h2", null, "What do I need?"));
    var rest = remainingOf(c);
    if (!rest.length) {
      sec.appendChild(el("p", "sg-muted", "Everything in this class has been graded, so your grade only changes if a mark does."));
      return sec;
    }
    var pts = rest.reduce(function (a, w) { return a + Number(w.outOf); }, 0);
    sec.appendChild(el("p", "sg-muted", plural(rest.length, "assignment") + " left, worth " + plural(num(pts), "point") +
      ". Tap the grade you want:"));
    var pick = el("div", "sg-pick");
    var out = el("div", "sg-answer");
    out.setAttribute("aria-live", "polite");
    GOALS.forEach(function (g) {
      var b = btn("", "<b>" + g[0] + "</b><small>" + g[1] + "% or more</small>", "I want " + (g[0] === "A" ? "an A" : "a " + g[0]));
      b.addEventListener("click", function () {
        [].forEach.call(pick.children, function (x) { x.classList.toggle("on", x === b); });
        answer(g);
      });
      pick.appendChild(b);
    });
    sec.appendChild(pick);
    sec.appendChild(out);

    function answer(g) {
      var an = g[0] === "A" ? "an A" : "a " + g[0];
      out.innerHTML = '<p class="sg-muted">Working it out…</p>';
      solve(c, g[1]).then(function (r) {
        var what = rest.length === 1 ? "on the last assignment" : "on average on the " + rest.length + " assignments left";
        if (r.kind === "out") {
          out.innerHTML = '<p class="res hard">Getting ' + an + " isn’t possible now.</p><p>Even 100% " + what +
            " gets you to <b>" + esc(r.best.letter) + " (" + r.best.percent + "%)</b>.</p>";
        } else if (r.kind === "safe") {
          out.innerHTML = '<p class="res ok">You’ll get at least ' + an + " whatever happens.</p>" +
            "<p>Your grades so far keep you there even if the rest goes badly.</p>";
        } else {
          var now = c.summary ? c.summary.percent : null;
          var tone = now == null || r.pct <= now ? "ok" : r.pct - now <= 8 ? "mid" : "hard";
          out.innerHTML = '<p class="res ' + tone + '">You need about <b>' + r.pct + "%</b> " + what + ".</p><p>" +
            (tone === "ok" ? "That’s no higher than you’re scoring now. Keep it up."
              : tone === "mid" ? "That’s a little higher than your " + now + "% now. Doable."
              : "That’s a lot higher than your " + now + "% now, so every point counts.") + "</p>";
        }
      }, function () {
        out.innerHTML = '<p class="sg-muted">Couldn’t work that out right now. Try again in a moment.</p>';
      });
    }
    return sec;
  }

  /* ================================================================ A past year */
  function drawYear(y) {
    clear();
    var h = G.host;
    h.appendChild(backButton());
    var head = el("header", "sg-head");
    var t = el("div", "t");
    t.appendChild(el("p", "lx-eyebrow", esc(y.school)));
    t.appendChild(el("h1", "lx-h1", esc(y.label)));
    t.appendChild(el("p", "sg-say", plural(y.courses.length, "course") + " · " + plural(num(y.credits), "credit") +
      " earned" + (y.average != null ? " · <b class=\"b-" + band(y.average) + "\">" + num(y.average) + "% average (" +
      ehsLetter(y.average) + ")</b>" : "") + "."));
    head.appendChild(t);
    h.appendChild(head);

    var sec = el("section", "sg-sec");
    sec.appendChild(el("h2", null, "Final grades"));
    var list = el("div", "sg-list");
    y.courses.forEach(function (c) {
      var r = el("div", "sg-row static");
      r.innerHTML = '<span class="t"><b>' + esc(c.title) + "</b><small>" + esc(c.area) + " · " + plural(num(c.credits), "credit") +
        (y.school.indexOf("&") > -1 ? " · " + esc(c.school) : "") + "</small></span>" +
        '<span class="g b-' + band(c.pct) + '"><b>' + esc(c.letter || "—") + "</b><small>" +
        (c.pct != null ? num(c.pct) + "%" : c.letter === "P" ? "Pass" : esc(c.mark || "")) + "</small></span>";
      list.appendChild(r);
    });
    sec.appendChild(list);
    h.appendChild(sec);
    h.appendChild(el("p", "sg-muted sg-note", "These are the final grades on your record. A transcript only carries " +
      "final grades, so the assignments behind them aren’t here."));
  }

  /* ================================================================ Graduation plan */
  function drawPlan() {
    clear();
    G.host.appendChild(backButton());
    G.host.appendChild(el("h1", "lx-h1", "Graduation plan"));
    var box = el("div", "sg-plan");
    G.host.appendChild(box);
    G.opts.graduation(box);
  }

  /* ================================================================ Files */
  function csvCell(v) {
    var s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function exportAll() {
    var rows = [["Year", "School", "Class", "Assignment", "Category", "Due", "Score", "Out of", "Percent", "Grade",
                 "Status", "Credits", "Feedback"]];
    G.classes.forEach(function (c) {
      c.work.forEach(function (w) {
        rows.push([thisYear(), c.school || "", c.title, w.title, w.category || "",
          w.dueMs != null ? new Date(w.dueMs).toISOString().slice(0, 10) : "",
          w.state === "graded" ? w.score : w.state === "missing" ? 0 : "", w.outOf,
          w.state === "graded" ? w.pct : w.state === "missing" ? 0 : "", "",
          { graded: "Graded", missing: "Missing", excused: "Excused", late: "Late", coming: "Not graded yet" }[w.state],
          "", w.feedback || ""]);
      });
    });
    G.years.forEach(function (y) {
      y.courses.forEach(function (c) {
        rows.push([y.label, c.school, c.title, "Final grade", c.area, "", c.pct != null ? c.pct : (c.mark || ""),
          c.pct != null ? 100 : "", c.pct != null ? c.pct : "", c.letter || "", "Final", c.credits, ""]);
      });
    });
    var blob = new Blob(["﻿" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\n")],
                        { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "My grades - " + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    if (G.opts.toast) G.opts.toast("Downloaded your grades as a spreadsheet.");
  }

  /* A report card is its own page, written for paper. */
  function printReport() {
    var g = gpaNow(), r = G.record;
    var rg = r && r.gpa ? (r.gpa.issued != null ? r.gpa.issued : r.gpa.value) : null;
    var html = "<!doctype html><html><head><meta charset=\"utf-8\"><title>Report card — " + esc(G.me.name || "") +
      "</title><style>body{font:13px/1.45 -apple-system,BlinkMacSystemFont,Inter,Helvetica,Arial,sans-serif;color:#111;margin:32px}" +
      "h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:26px 0 8px}p{margin:0 0 14px;color:#555}" +
      "table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #ddd}" +
      "th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#555}td.n,th.n{text-align:right}" +
      "tr.cm td{color:#333;font-style:italic}</style></head><body><h1>Report card</h1><p>" + esc(G.me.name || "") +
      " · " + esc(dayLong(Date.now())) + (rg != null ? " · GPA " + Number(rg).toFixed(2) : "") +
      (r && r.track ? " · " + num(r.totals.earned) + " of " + num(r.track.total) + " credits" : "") + "</p>";
    if (G.classes.length) {
      html += "<h2>" + esc(thisYear()) + " · This year</h2><table><thead><tr><th>Class</th><th class=n>Percent</th>" +
        "<th class=n>Grade</th></tr></thead><tbody>" +
        G.classes.map(function (c) {
          var s = c.summary;
          return "<tr><td>" + esc(c.title) + '</td><td class="n">' + (s ? s.percent + "%" : "—") + '</td><td class="n"><b>' +
            (s ? esc(s.letter) : "—") + "</b></td></tr>" +
            (c.comment ? '<tr class="cm"><td colspan="3">' + esc(c.comment.body) + " — " +
              esc(c.comment.author || "Teacher") + "</td></tr>" : "");
        }).join("") + "</tbody></table>" +
        (g ? "<p style=\"margin-top:8px\">Average this year: " + Math.round(g.avg * 10) / 10 + "% (" + letterFor(g.avg) + ")</p>" : "");
    }
    G.years.forEach(function (y) {
      html += "<h2>" + esc(y.label) + " · " + esc(y.school) + "</h2><table><thead><tr><th>Course</th><th>Subject</th>" +
        "<th class=n>Final</th><th class=n>Grade</th><th class=n>Credits</th></tr></thead><tbody>" +
        y.courses.map(function (c) {
          return "<tr><td>" + esc(c.title) + "</td><td>" + esc(c.area) + '</td><td class="n">' +
            (c.pct != null ? num(c.pct) + "%" : esc(c.mark || "—")) + '</td><td class="n"><b>' + esc(c.letter || "—") +
            '</b></td><td class="n">' + num(c.credits) + "</td></tr>";
        }).join("") + "</tbody></table>";
    });
    html += "</body></html>";
    var w = window.open("", "_blank");
    if (!w) {
      if (G.opts.toast) G.opts.toast("Your browser blocked the print window. Allow pop-ups for this site and try again.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 250);
  }

  /* ================================================================ Outside */
  /* Redraw a place — what Back and Forward land on. */
  function view(segs) {
    if (!G || !G.loaded || !G.host.isConnected) return false;
    var p = find((segs || [])[0]);
    if (p) p.draw(); else drawHome();
    return true;
  }

  return { mount: mount, view: view };
})();
