/* ==========================================================================
   OEdu — the student's gradebook.

   /student/Grades. What a student opens to answer the questions they actually
   have about their marks: what is my grade in each class, which piece of work
   is holding it down, what is missing, what do I need on the next one, and
   has anything been changed.

   Every grade on this screen is computed by the server — the weighting, the
   drop rule, the late penalty, the what-if. This file lays the answers out and
   never re-adds a column itself, so it can never disagree with what a teacher
   sees in their own gradebook.

     Gradebook      one class at a time: the grade, its categories, every
                    assignment with its flags, feedback and change history,
                    and a what-if calculator over the real marks
     Report card    every class on one page, printable, with the teacher's
                    comments and an estimated GPA
     Standards      each category read as a mastery level
     Graduation     the path-to-diploma dashboard, drawn by app.js

   Mounted by app.js: OPLO_GRADEBOOK.mount(host, { me, graduation, toast }).
   ========================================================================== */
window.OPLO_GRADEBOOK = (function () {
  "use strict";

  var API = window.OPLO_API;
  var PREF_KEY = "oplo.gradebook.v1";
  var NS = "http://www.w3.org/2000/svg";
  var DAY = 86400000;
  var CALM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");

  var TABS = [
    { key: "overview", label: "Overview" },
    { key: "book", label: "Classes" },
    { key: "goals", label: "Goals" },
    { key: "report", label: "Report card" },
    { key: "standards", label: "Standards" },
    { key: "grad", label: "Graduation" }
  ];

  var POINTS = { "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2,
                 "C-": 1.7, "D+": 1.3, "D": 1, "D-": 0.7, "F": 0 };

  var LEVELS = [
    { n: 4, name: "Exceeds", min: 90 },
    { n: 3, name: "Meets", min: 80 },
    { n: 2, name: "Approaching", min: 70 },
    { n: 1, name: "Beginning", min: 0 }
  ];

  var SHORTCUTS = [
    [["J"], "Next class or course"],
    [["K"], "Previous class or course"],
    [["/"], "Search assignments"],
    [["W"], "Turn the what-if calculator on or off"],
    [["E"], "Export this class as a spreadsheet"],
    [["P"], "Print the report card"],
    [[MAC ? "⌘" : "Ctrl", "K"], "Search or jump to anything"],
    [["1", "–", "6"], "Overview, Classes, Goals, Report card, Standards, Graduation"],
    [["?"], "Show these shortcuts"],
    [["Esc"], "Close a panel, or leave what-if"]
  ];

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
  function btn(cls, html, title) {
    var b = el("button", cls, html);
    b.type = "button";
    if (title) { b.title = title; b.setAttribute("aria-label", title); }
    return b;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
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
    if (t == null) return "—";
    return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function dayLong(x) {
    var t = ms(x);
    if (t == null) return "";
    return new Date(t).toLocaleDateString(undefined,
      { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }
  function num(x) { return String(Math.round(Number(x) * 100) / 100); }
  function pctOf(w) {
    if (w.score == null || !(w.outOf > 0)) return null;
    return Math.round(w.score / w.outOf * 1000) / 10;
  }
  function band(p) {
    if (p == null) return "none";
    return p >= 90 ? "a" : p >= 80 ? "b" : p >= 70 ? "c" : p >= 60 ? "d" : "f";
  }
  function letterFor(p) {
    return p >= 93 ? "A" : p >= 90 ? "A-" : p >= 87 ? "B+" : p >= 83 ? "B"
         : p >= 80 ? "B-" : p >= 77 ? "C+" : p >= 73 ? "C" : p >= 70 ? "C-"
         : p >= 67 ? "D+" : p >= 63 ? "D" : p >= 60 ? "D-" : "F";
  }
  /* Excel High School's scale, which a transcript's letters are on: A to F,
     no plus or minus. This year's live classes use the finer scale above,
     because that is what the server gives them. */
  function ehsLetter(p) {
    return p >= 90 ? "A" : p >= 80 ? "B" : p >= 70 ? "C" : p >= 60 ? "D" : "F";
  }
  function level(p) {
    for (var i = 0; i < LEVELS.length; i++) if (p >= LEVELS[i].min) return LEVELS[i];
    return LEVELS[LEVELS.length - 1];
  }
  function typing(e) {
    var t = e.target;
    return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" ||
                 t.isContentEditable);
  }

  /* ------------------------------------------------------------ Prefs
     How this student likes the table laid out. Kept in this browser only:
     it is a convenience, and losing it costs nothing but a click. */
  function defaults() {
    return { cols: { due: true, category: true, pct: true, feedback: true },
             score: "both", dense: false, hideExcused: false, sel: null };
  }
  function loadPrefs() {
    var p = defaults();
    try {
      var raw = JSON.parse(localStorage.getItem(PREF_KEY) || "null");
      if (raw && typeof raw === "object") {
        for (var k in raw) if (k !== "cols") p[k] = raw[k];
        if (raw.cols) for (var c in raw.cols) p.cols[c] = !!raw.cols[c];
      }
    } catch (e) { /* private window: defaults are fine */ }
    return p;
  }
  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(G.prefs)); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------ State */
  var G = null;
  var keysBound = false;

  function mount(host, opts) {
    opts = opts || {};
    G = {
      host: host, me: opts.me || {}, opts: opts,
      tab: opts.tab || "overview",
      prefs: loadPrefs(),
      classes: [], byId: {}, sel: null,
      filter: { q: "", cat: "", status: "all" },
      sort: { key: "due", dir: 1 },
      whatif: false, hypo: {}, wiResult: null, wiSeq: 0,
      open: {},
      record: null, years: [], year: "current", pastSel: null
    };
    bindKeys();
    host.innerHTML = "";
    host.classList.add("sgb");
    host.classList.toggle("dense", !!G.prefs.dense);

    G.hero = el("section", "sgb-hero");
    host.appendChild(G.hero);
    paintHero();

    G.tabs = el("div", "sgb-tabs");
    G.tabs.setAttribute("role", "tablist");
    TABS.forEach(function (t, i) {
      var b = btn("sgb-tab", esc(t.label));
      b.setAttribute("role", "tab");
      b.dataset.tab = t.key;
      b.title = t.label + " (" + (i + 1) + ")";
      b.addEventListener("click", function () { setTab(t.key); });
      G.tabs.appendChild(b);
    });
    host.appendChild(G.tabs);

    G.body = el("div", "sgb-body");
    host.appendChild(G.body);
    G.body.appendChild(el("div", "sgb-loading", "Reading your grades…"));
    paintTabs();

    load();
  }

  function load() {
    var me = G.me;
    Promise.all([
      API.reporting.coursework(me.id),
      API.grades.list(),
      API.reporting.report(me.id).catch(function () { return null; }),
      // The record — previous schools and EHS's own — is an addition here, so
      // a record that cannot be read leaves this year's gradebook standing.
      API.graduation.get().catch(function () { return null; })
    ]).then(function (out) {
      G.loaded = true;
      build(out[0] || {}, out[1] || {}, out[2], out[3]);
      paintHero();
      paint();
    }, function (e) {
      G.failed = true;
      paintHero();
      G.body.innerHTML = "";
      var box = el("div", "sgb-failed");
      box.appendChild(el("b", null, e && e.code === "offline"
        ? "Cannot reach the Oplo API" : "Your grades did not load"));
      box.appendChild(el("p", null, esc(e && e.code === "offline"
        ? "Grades live on the server, not in this browser, so they cannot be shown until it answers."
        : (e && e.message) || "The server refused that request.")));
      var again = btn("lx-btn quiet", "Try again");
      again.addEventListener("click", function () { mount(G.host, G.opts); });
      box.appendChild(again);
      G.body.appendChild(box);
      if (G.tab === "grad") paint();
    });
  }

  /* One object per class, holding everything the screens need: the server's
     computed grade, every assignment with the student's mark on it, and what
     the teacher wrote on the report. */
  function build(cw, gl, report, record) {
    var byId = {};
    function cls(id, title, code) {
      if (!byId[id]) {
        byId[id] = { id: id, title: title || "Class", code: code || "", work: [],
                     summary: null, comment: null, gradeRow: {} };
      }
      if (title && byId[id].title === "Class") byId[id].title = title;
      if (code && !byId[id].code) byId[id].code = code;
      return byId[id];
    }
    (cw.work || []).forEach(function (w) {
      cls(w.courseId, w.courseTitle, w.courseCode).work.push(w);
    });
    (gl.summaries || []).forEach(function (s) { cls(s.courseId, s.courseTitle).summary = s; });
    (gl.grades || []).forEach(function (g) {
      var c = cls(g.courseId, null);
      c.gradeRow[g.assignmentId] = g;
      // A mark on work the coursework list did not carry still belongs here.
      var known = c.work.some(function (w) { return w.assignmentId === g.assignmentId; });
      if (!known) {
        c.work.push({ courseId: g.courseId, assignmentId: g.assignmentId, title: g.title,
                      category: g.category, outOf: g.outOf, dueAt: null,
                      extraCredit: g.extraCredit, status: g.status, score: g.score,
                      late: g.late, feedback: g.feedback, gradedAt: g.gradedAt });
      }
    });
    if (report && report.courses) {
      report.courses.forEach(function (rc) {
        if (byId[rc.courseId] && rc.comment && String(rc.comment.body || "").trim()) {
          byId[rc.courseId].comment = rc.comment;
        }
      });
    }
    var now = Date.now();
    Object.keys(byId).forEach(function (id) {
      var c = byId[id];
      var dropped = {};
      ((c.summary && c.summary.dropped) || []).forEach(function (d) { dropped[d.assignmentId] = true; });
      c.work.forEach(function (w) {
        w.dropped = !!dropped[w.assignmentId];
        w.pct = pctOf(w);
        var due = ms(w.dueAt);
        w.dueMs = due;
        w.state = w.status === "missing" ? "missing"
          : w.status === "excused" ? "excused"
          : (w.status === "marked" && w.score != null) ? "graded"
          : (due != null && due < now) ? "pastdue"
          : "upcoming";
      });
      c.missing = c.work.filter(function (w) { return w.state === "missing"; }).length;
      c.pastdue = c.work.filter(function (w) { return w.state === "pastdue"; }).length;
      c.graded = c.work.filter(function (w) { return w.state === "graded"; }).length;
      c.late = c.work.filter(function (w) { return w.late; }).length;
      c.cats = [];
      c.work.forEach(function (w) {
        var k = w.category || "Uncategorised";
        if (c.cats.indexOf(k) < 0) c.cats.push(k);
      });
    });
    G.byId = byId;
    buildRecord(record, byId);
    G.classes = Object.keys(byId).map(function (k) { return byId[k]; })
      .sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
    var nowMs = Date.now();
    G.classes.forEach(function (c, i) {
      c.slot = (i % 8) + 1;
      c.points = c.work.filter(function (w) { return w.state === "graded" && w.pct != null && !w.extraCredit; })
        .map(function (w) { return { w: w, t: ms(w.gradedAt) || w.dueMs || 0 }; })
        .sort(function (a, b) { return a.t - b.t; });
      c.trend = trendOf(c.points);
      c.next = c.work.filter(function (w) { return w.state === "upcoming" && w.dueMs != null && w.dueMs >= nowMs - DAY; })
        .sort(function (a, b) { return a.dueMs - b.dueMs; })[0] || null;
    });
    var want = G.prefs.sel && byId[G.prefs.sel] ? G.prefs.sel : null;
    G.sel = want || (G.classes[0] && G.classes[0].id) || null;
    G.year = G.classes.length || !G.years.length ? "current" : G.years[0].key;
    G.pastSel = null;
  }

  /* ------------------------------------------------------------ Previous years
     The record the Graduation tab draws — courses from a previous school, and
     EHS's own — laid out as past years of the gradebook. A transfer record
     carries final grades only, so a past year is a list of courses, each with
     its final mark and the credit it earned; the assignments behind them stay
     with the school that set them. An EHS course still in progress belongs to
     this year, so it joins this year's classes instead. */
  var AREA_NAMES = { english: "English", math: "Math", science: "Science",
                     social_studies: "Social Studies", health: "Health", pe: "Physical Education",
                     fine_art: "Fine Art", world_language: "World Language", elective: "Electives" };

  var AREA_ORDER = ["english", "math", "science", "social_studies", "world_language",
                    "fine_art", "health", "pe", "elective"];
  function areaRank(k) { var i = AREA_ORDER.indexOf(k); return i < 0 ? AREA_ORDER.length : i; }

  function yearName(y) {
    var m = String(y || "").match(/^(\d{4})\D+(\d{2,4})$/);
    return m ? m[1] + "–" + m[2].slice(-2) : String(y || "Undated");
  }
  function thisYear() {
    var d = new Date(), y = d.getFullYear();
    return d.getMonth() >= 6 ? y + "–" + String(y + 1).slice(-2) : (y - 1) + "–" + String(y).slice(-2);
  }

  function buildRecord(g, byId) {
    G.record = g && g.totals ? g : null;
    G.years = [];
    if (!G.record) return;
    var names = {};
    (g.areas || []).forEach(function (a) { names[a.key] = a.name; });
    function area(k) { return names[k] || AREA_NAMES[k] || (k ? String(k).replace(/_/g, " ") : "—"); }
    var school = (g.transfer && g.transfer.school) || "Previous school";
    var accepted = !!(g.transfer && g.transfer.status === "evaluated");
    var byYear = {};
    function put(item) {
      var k = item.year || "Undated";
      (byYear[k] = byYear[k] || []).push(item);
    }
    (g.courses || []).forEach(function (c) {
      put({ id: "t:" + c.id, source: "transfer", school: school, title: c.title,
            code: c.code && c.code !== "TR" ? c.code : "", year: c.year, term: c.term,
            pct: c.markNumeric, mark: c.mark,
            letter: c.letter || (c.mark && !/\d/.test(c.mark) ? c.mark : null),
            attempted: Number(c.attempted || 0),
            credits: c.decision === "declined" ? 0 : Number(c.ehsCredits || 0),
            area: area(c.area), areaKey: c.area, decision: c.decision, accepted: accepted,
            flags: c.flags || [], note: c.note || null });
    });
    (g.ehsCourses || []).forEach(function (c) {
      // Already here as a live OEdu class, with its assignments.
      if (c.courseId && byId[c.courseId]) return;
      if (c.status === "in_progress") {
        var id = "rec:" + c.id;
        byId[id] = { id: id, title: c.title, code: c.code || "", work: [], summary: null,
                     comment: null, gradeRow: {}, recordOnly: true, school: "Excel High School",
                     credits: Number(c.credits || 0), area: area(c.area),
                     missing: 0, pastdue: 0, graded: 0, late: 0, cats: [] };
        return;
      }
      put({ id: "e:" + c.id, source: "ehs", school: "Excel High School", title: c.title,
            code: c.code || "", year: c.year, term: c.term, pct: c.markNumeric, mark: c.mark,
            letter: c.letter, attempted: Number(c.credits || 0),
            credits: c.status === "completed" ? Number(c.credits || 0) : 0,
            area: area(c.area), areaKey: c.area, status: c.status, flags: [] });
    });
    var meta = {};
    (g.years || []).forEach(function (y) { meta[y.year] = y; });
    G.years = Object.keys(byYear).sort(function (a, b) {
      if (a === "Undated") return 1;
      if (b === "Undated") return -1;
      return a < b ? 1 : -1;
    }).map(function (k) {
      var list = byYear[k].sort(function (a, b) {
        return areaRank(a.areaKey) - areaRank(b.areaKey) || String(a.title).localeCompare(String(b.title));
      });
      var schools = [];
      list.forEach(function (c) { if (schools.indexOf(c.school) < 0) schools.push(c.school); });
      var m = meta[k] || {};
      var credits = list.reduce(function (s, c) { return s + c.credits; }, 0);
      return { key: k, label: yearName(k), school: schools.join(" & "), courses: list,
               credits: Math.round((m.credits != null ? m.credits : credits) * 1000) / 1000,
               average: m.average != null ? m.average : null };
    });
  }

  function yearOf(key) {
    for (var i = 0; i < G.years.length; i++) if (G.years[i].key === key) return G.years[i];
    return null;
  }
  function pastCurrent() {
    var y = yearOf(G.year);
    if (!y) return null;
    for (var i = 0; i < y.courses.length; i++) if (y.courses[i].id === G.pastSel) return y.courses[i];
    return y.courses[0] || null;
  }
  function setYear(key, courseId) {
    var jump = !courseId || G.tab !== "book" || G.year !== key;
    G.year = yearOf(key) ? key : "current";
    G.pastSel = courseId || null;
    if (G.tab !== "book") { G.tab = "book"; paintTabs(); }
    paint();
    if (jump && G.tabs.getBoundingClientRect().top < 0 && G.tabs.scrollIntoView) {
      G.tabs.scrollIntoView({ block: "start" });
    }
  }

  /* ------------------------------------------------------------ Top strip */
  function gpa() {
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

  /* ------------------------------------------------------------ The hero
     Where a student stands, in one look: three rings — GPA, credits toward the
     diploma, this year's average — one sentence that says it in words, and
     the three counts that need doing something about. Every number is one the
     server already gave; the rings only draw them. */
  function standing() {
    var g = gpa(), r = G.record, now = Date.now();
    var missing = 0, pastdue = 0, soon = 0;
    G.classes.forEach(function (c) {
      missing += c.missing; pastdue += c.pastdue;
      c.work.forEach(function (w) {
        if (w.state === "upcoming" && w.dueMs != null && w.dueMs >= now - DAY && w.dueMs - now < 7 * DAY) soon++;
      });
    });
    var rg = r && r.gpa ? (r.gpa.issued != null ? r.gpa.issued : r.gpa.value) : null;
    return { g: g, r: r, rg: rg, missing: missing, pastdue: pastdue, soon: soon };
  }

  function gpaBand(v) { return v >= 3.5 ? "a" : v >= 2.5 ? "b" : v >= 1.5 ? "c" : "f"; }

  function ring(label, value, max, text, sub, bandCls) {
    var R = 44, C = 2 * Math.PI * R;
    var f = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    var wrap = el("div", "sgb-ring " + (bandCls || ""));
    var s = svg("svg", { viewBox: "0 0 100 100", "aria-hidden": "true" });
    s.appendChild(svg("circle", { cx: 50, cy: 50, r: R, class: "trk" }));
    var arc = svg("circle", { cx: 50, cy: 50, r: R, class: "arc",
      "stroke-dasharray": C.toFixed(2), "stroke-dashoffset": C.toFixed(2), transform: "rotate(-90 50 50)" });
    s.appendChild(arc);
    wrap.appendChild(s);
    var mid = el("div", "mid");
    var big = el("b");
    mid.appendChild(big);
    mid.appendChild(el("span", null, esc(sub)));
    wrap.appendChild(mid);
    wrap.appendChild(el("p", "lbl", esc(label)));
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", label + ": " + text.replace(/<[^>]+>/g, "") + ", " + sub);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { arc.setAttribute("stroke-dashoffset", (C * (1 - f)).toFixed(2)); });
    });
    countUp(big, text);
    return wrap;
  }

  /* A number arrives already right, and then — if the tab is being painted
     and nobody asked for less motion — counts up into place. */
  function countUp(node, text) {
    node.innerHTML = text;
    var m = String(text).match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!m || CALM || document.hidden) return;
    var to = Number(m[1]), dec = (m[1].split(".")[1] || "").length, rest = m[2], t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 900);
      p = 1 - Math.pow(1 - p, 3);
      node.innerHTML = (to * p).toFixed(dec) + rest;
      if (p < 1) requestAnimationFrame(step); else node.innerHTML = text;
    }
    requestAnimationFrame(step);
  }

  function greeting() {
    var h = new Date().getHours();
    var first = G.me.firstName || String(G.me.name || "").split(" ")[0];
    return (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + (first ? ", " + first : "");
  }

  function paintHero() {
    var h = G.hero;
    if (!h) return;
    h.innerHTML = "";
    var loaded = !!(G.classes.length || G.record || G.loaded);
    var left = el("div", "sgb-hero-l");
    left.appendChild(el("p", "lx-eyebrow", "Grades" + (G.me.name ? " · " + esc(G.me.name) : "")));
    left.appendChild(el("h1", "lx-h1", "Gradebook"));
    var st = standing();
    if (loaded) {
      var bits = [];
      if (st.g) bits.push("you're averaging <b>" + num(Math.round(st.g.avg * 10) / 10) + "%</b> (" +
        esc(letterFor(st.g.avg)) + ") across " + st.g.n + (st.g.n === 1 ? " class" : " classes") + " this year");
      if (st.r && st.r.track) bits.push("you've earned <b>" + num(st.r.totals.earned) + " of " +
        num(st.r.track.total) + "</b> diploma credits");
      var say = greeting() + (bits.length ? " — " + bits.join(", and ") + "." : ".");
      say += " " + (st.missing
        ? "<b class=\"bad\">" + st.missing + (st.missing === 1 ? " assignment is" : " assignments are") + " missing.</b>"
        : "Nothing is missing.");
      if (st.soon) say += " " + st.soon + (st.soon === 1 ? " thing is" : " things are") + " due in the next 7 days.";
      left.appendChild(el("p", "sgb-hero-say", say));

      var chips = el("div", "sgb-chips");
      function chip(n, label, tone, go) {
        var b = btn("sgb-chip " + (n ? tone : "ok"), "<b>" + n + "</b> " + esc(label));
        b.addEventListener("click", go);
        chips.appendChild(b);
      }
      chip(st.missing, "missing", "bad", function () { jumpTo("missing"); });
      chip(st.pastdue, "past due", "warn", function () { jumpTo("todo"); });
      chip(st.soon, "due this week", "info", function () { setTab("overview"); });
      left.appendChild(chips);
    } else {
      left.appendChild(el("p", "sgb-hero-say", G.failed ? "Your grades could not be read just now." : "Reading your grades…"));
    }
    var tools = el("div", "sgb-hero-tools");
    var k = btn("sgb-kbtn", '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="none" ' +
      'stroke="currentColor" stroke-width="1.7"/><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round"/></svg><span>Search or jump</span><kbd>' + (MAC ? "⌘" : "Ctrl") + "</kbd><kbd>K</kbd>",
      "Search or jump to anything");
    k.addEventListener("click", palette);
    tools.appendChild(k);
    var help = btn("sgb-icon-btn", "?", "Keyboard shortcuts");
    help.addEventListener("click", shortcuts);
    tools.appendChild(help);
    left.appendChild(tools);
    h.appendChild(left);

    if (!loaded) return;
    var rings = el("div", "sgb-rings");
    var gv = st.rg != null ? Number(st.rg) : st.g ? st.g.gpa : null;
    if (gv != null) {
      rings.appendChild(ring("GPA", gv, 4, gv.toFixed(2), st.rg != null ? "cumulative" : "estimate", "b-" + gpaBand(gv)));
    }
    if (st.r && st.r.track) {
      rings.appendChild(ring("Credits", st.r.totals.earned, st.r.track.total, num(st.r.totals.earned),
        "of " + num(st.r.track.total), "b-credit"));
    }
    if (st.g) {
      rings.appendChild(ring("This year", st.g.avg, 100, num(Math.round(st.g.avg)) + "%",
        letterFor(st.g.avg), "b-" + band(st.g.avg)));
    }
    if (rings.children.length) h.appendChild(rings);
  }

  /* From a chip to the work it counts: the first class that has some, with
     the table filtered to it. */
  function jumpTo(status) {
    var key = status === "missing" ? "missing" : "pastdue";
    var c = G.classes.filter(function (x) { return x[key]; })[0];
    if (!c) { setTab("overview"); return; }
    G.filter = { q: "", cat: "", status: status };
    G.year = "current";
    G.sel = c.id;
    G.open = {};
    if (G.tab !== "book") { G.tab = "book"; paintTabs(); }
    paint();
  }

  function paintTabs() {
    [].forEach.call(G.tabs.children, function (b) {
      var on = b.dataset.tab === G.tab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  function setTab(key) {
    if (G.tab === key) return;
    G.tab = key;
    paintTabs();
    paint();
  }

  function paint() {
    closePop();
    G.body.innerHTML = "";
    if (G.tab === "grad") {
      var h = el("div", "sgb-grad");
      G.body.appendChild(h);
      if (G.opts.graduation) G.opts.graduation(h);
      return;
    }
    if (!G.classes.length && !G.years.length) {
      G.body.appendChild(el("div", "lx-empty",
        "No classes with grades yet. When a teacher enrols you and sets work, every class and " +
        "every mark appears here — on this device and on every other one you sign in on."));
      return;
    }
    if (G.tab === "overview") paintOverview();
    else if (G.tab === "goals") paintGoals();
    else if (G.tab === "book") paintBook();
    else if (G.tab === "report") paintReport();
    else if (G.tab === "standards") {
      if (G.classes.length) paintStandards();
      else G.body.appendChild(el("div", "lx-empty",
        "Mastery levels are read from this year's classes, and you have none yet. Your earlier " +
        "years are on the Gradebook and Report card tabs."));
    }
  }

  /* ================================================================ Gradebook */
  function current() { return G.byId[G.sel] || G.classes[0]; }

  function select(id) {
    if (!G.byId[id] || (G.sel === id && G.year === "current" && G.tab === "book")) return;
    G.year = "current";
    G.sel = id;
    G.prefs.sel = id; savePrefs();
    G.whatif = false; G.hypo = {}; G.wiResult = null; G.open = {};
    G.filter.cat = "";
    if (G.tab !== "book") { G.tab = "book"; paintTabs(); }
    paint();
  }

  function step(d) {
    var y = G.year !== "current" && yearOf(G.year);
    var list = y ? y.courses : G.classes;
    if (!list.length) return;
    var i = list.indexOf(y ? pastCurrent() : current());
    var j = Math.max(0, Math.min(list.length - 1, i + d));
    if (j === i) return;
    if (y) setYear(y.key, list[j].id);
    else select(list[j].id);
    var b = G.body.querySelector('.sgb-class[data-id="' + list[j].id + '"]');
    if (b) b.focus();
  }

  function paintBook() {
    var grid = el("div", "sgb-grid");
    var side = el("div", "sgb-side");
    if (G.years.length) side.appendChild(yearPicker());
    var y = G.year !== "current" && yearOf(G.year);
    side.appendChild(y ? pastList(y) : classList());
    if (!y && G.years.length) side.appendChild(earlierYears());
    grid.appendChild(side);
    G.panel = el("section", "sgb-panel");
    grid.appendChild(G.panel);
    G.body.appendChild(grid);
    if (y) paintPast(y, pastCurrent());
    else if (!G.classes.length) {
      G.panel.appendChild(el("div", "lx-empty",
        "No classes this year yet. When a teacher enrols you and sets work, it appears here. " +
        "Your earlier years are in the list on the left."));
    }
    else if (current().recordOnly) paintRecordOnly(current());
    else paintPanel();
  }

  function yearPicker() {
    var wrap = el("label", "sgb-yearpick");
    wrap.appendChild(el("span", null, "School year"));
    var sel = el("select", "sgb-select");
    sel.appendChild(new Option(thisYear() + " · This year", "current"));
    G.years.forEach(function (y) {
      sel.appendChild(new Option(y.label + " · " + y.school, y.key));
    });
    sel.value = G.year;
    sel.addEventListener("change", function () { setYear(sel.value); });
    wrap.appendChild(sel);
    return wrap;
  }

  /* The way into earlier years from this year's list, so a student who never
     opens the picker still sees that their record goes back further. */
  function earlierYears() {
    var box = el("div", "sgb-earlier");
    box.appendChild(el("p", "sgb-side-h", "Earlier years"));
    G.years.forEach(function (y) {
      var b = btn("sgb-yearbtn");
      b.innerHTML = "<b>" + esc(y.label) + "</b><span>" + esc(y.school) + " · " + y.courses.length +
        (y.courses.length === 1 ? " course" : " courses") + " · " + num(y.credits) +
        (y.credits === 1 ? " credit" : " credits") + "</span>";
      b.addEventListener("click", function () { setYear(y.key); });
      box.appendChild(b);
    });
    return box;
  }

  function pastList(y) {
    var nav = el("nav", "sgb-classes");
    nav.setAttribute("aria-label", "Courses in " + y.label);
    var sel = pastCurrent();
    y.courses.forEach(function (c) {
      var on = sel && c.id === sel.id;
      var b = btn("sgb-class" + (on ? " on" : ""));
      b.dataset.id = c.id;
      b.setAttribute("aria-current", String(!!on));
      var p = c.pct;
      b.innerHTML =
        '<span class="t"><b>' + esc(c.title) + "</b>" +
        '<span class="sub">' + esc(c.area) + " · " + num(c.credits) + (c.credits === 1 ? " credit" : " credits") +
        "</span></span>" +
        '<span class="g b-' + band(p) + '"><b>' + esc(c.letter || "—") + "</b><span>" +
        (p != null ? num(p) + "%" : esc(c.mark || "—")) + "</span></span>" +
        '<span class="bar"><i class="b-' + band(p) + '" style="width:' +
        (p != null ? Math.max(0, Math.min(100, p)) : 0) + '%"></i></span>';
      b.addEventListener("click", function () { setYear(y.key, c.id); });
      nav.appendChild(b);
    });
    return nav;
  }

  function decisionSays(c) {
    if (c.source === "ehs") {
      return c.status === "withdrawn" ? "Withdrawn at Excel High School" : "Completed at Excel High School";
    }
    if (c.decision === "declined") return "Not accepted by Excel High School";
    if (c.accepted || c.decision === "accepted") return "Transferred and accepted by Excel High School";
    return "Transferred · awaiting Excel High School's evaluation";
  }

  /* One past course, and the rest of its year around it. */
  function paintPast(y, c) {
    var p = G.panel;
    p.innerHTML = "";
    if (!c) { p.appendChild(el("div", "lx-empty", "No courses on the record for this year.")); return; }
    var head = el("header", "sgb-head");
    var name = el("div", "sgb-name");
    name.appendChild(el("p", "sgb-code", esc(y.label + " · " + c.school + (c.code ? " · " + c.code : ""))));
    name.appendChild(el("h2", null, esc(c.title)));
    name.appendChild(el("p", "sgb-facts", esc(c.area) + " · " + num(c.credits) +
      (c.credits === 1 ? " credit earned" : " credits earned") +
      (c.attempted && c.attempted !== c.credits ? " of " + num(c.attempted) + " attempted" : "")));
    head.appendChild(name);
    var grade = el("div", "sgb-grade b-" + band(c.pct));
    grade.innerHTML = "<b>" + esc(c.letter || "—") + "</b><span>" +
      (c.pct != null ? num(c.pct) + "%" : esc(c.mark || "No mark")) + "</span><em>Final grade</em>";
    head.appendChild(grade);
    p.appendChild(head);

    var row = el("div", "sgb-row");
    var about = el("div", "sgb-card");
    about.appendChild(el("h3", null, "On your record"));
    var dl = el("dl", "sgb-dl");
    function fact(k, v) { dl.appendChild(el("dt", null, esc(k))); dl.appendChild(el("dd", null, v)); }
    fact("School", esc(c.school));
    var term = c.term && yearName(c.term) !== y.label && c.term !== c.year ? c.term : null;
    fact("School year", esc(y.label) + (term ? " · " + esc(term) : ""));
    fact("Subject area", esc(c.area));
    fact("Final mark", c.pct != null ? num(c.pct) + "% · " + esc(c.letter || "") : esc(c.mark || "—"));
    fact("Credits", num(c.credits) + " earned" + (c.attempted ? " · " + num(c.attempted) + " attempted" : ""));
    fact("Status", esc(decisionSays(c)));
    if (c.flags && c.flags.length) fact("Notes", esc(c.flags.join(", ").replace(/_/g, " ")));
    if (c.note) fact("Note", esc(c.note));
    about.appendChild(dl);
    row.appendChild(about);

    var yr = el("div", "sgb-card");
    yr.appendChild(el("h3", null, "The year"));
    var stats = el("div", "sgb-ystats");
    stats.innerHTML =
      "<div><b>" + y.courses.length + "</b><span>" + (y.courses.length === 1 ? "course" : "courses") + "</span></div>" +
      "<div><b>" + num(y.credits) + "</b><span>credits earned</span></div>" +
      "<div><b>" + (y.average != null ? num(y.average) + "%" : "—") + "</b><span>average" +
      (y.average != null ? " · " + esc(ehsLetter(y.average)) : "") + "</span></div>";
    yr.appendChild(stats);
    yr.appendChild(el("p", "sgb-muted", "The average is weighted by credit, over the courses with a numeric mark."));
    row.appendChild(yr);
    p.appendChild(row);

    var wrap = el("div", "sgb-table-wrap");
    var t = el("table", "sgb-table sgb-rtable");
    t.innerHTML = "<thead><tr><th>Course</th><th>Subject</th><th class=\"num\">Final</th>" +
      "<th class=\"num\">Grade</th><th class=\"num\">Credits</th></tr></thead>";
    var tb = el("tbody");
    y.courses.forEach(function (x) {
      var tr = el("tr", "sgb-tr" + (x.id === c.id ? " open" : ""));
      tr.innerHTML = "<td><b>" + esc(x.title) + "</b>" +
        (y.school.indexOf("&") > -1 ? '<span class="sgb-fbp">' + esc(x.school) + "</span>" : "") + "</td>" +
        "<td>" + esc(x.area) + '</td><td class="num">' +
        (x.pct != null ? '<span class="sgb-pct b-' + band(x.pct) + '">' + num(x.pct) + "%</span>" : esc(x.mark || "—")) +
        '</td><td class="num">' + (x.letter ? '<span class="sgb-letter b-' + band(x.pct) + '">' + esc(x.letter) + "</span>" : "—") +
        '</td><td class="num">' + num(x.credits) + "</td>";
      tr.addEventListener("click", function () { setYear(y.key, x.id); });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    var tf = el("tfoot");
    tf.innerHTML = "<tr><td colspan=\"2\"><b>" + esc(y.label) + "</b> <span class=\"sgb-muted\">" + esc(y.school) +
      '</span></td><td class="num">' + (y.average != null ? num(y.average) + "%" : "—") + '</td><td class="num">' +
      (y.average != null ? esc(ehsLetter(y.average)) : "—") + '</td><td class="num"><b>' + num(y.credits) + "</b></td></tr>";
    t.appendChild(tf);
    wrap.appendChild(t);
    p.appendChild(wrap);

    p.appendChild(el("p", "sgb-lock",
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/>' +
      '<path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span>' +
      (c.source === "transfer"
        ? "A transcript carries final grades only, so the assignments behind these marks stay with " +
          esc(c.school) + ". The Graduation tab shows how each credit counts toward your diploma."
        : "Final grades from your Excel High School record. The Graduation tab shows how each credit " +
          "counts toward your diploma.") + "</span>"));
  }

  /* An Excel High School course still in progress that has no OEdu class
     behind it yet: on the record, with nothing to mark until work is set. */
  function paintRecordOnly(c) {
    var p = G.panel;
    p.innerHTML = "";
    var head = el("header", "sgb-head");
    var name = el("div", "sgb-name");
    name.appendChild(el("p", "sgb-code", esc(c.school + (c.code ? " · " + c.code : ""))));
    name.appendChild(el("h2", null, esc(c.title)));
    name.appendChild(el("p", "sgb-facts", esc(c.area) + " · " + num(c.credits) +
      (c.credits === 1 ? " credit" : " credits") + " · in progress"));
    head.appendChild(name);
    var grade = el("div", "sgb-grade b-none");
    grade.innerHTML = "<span>In progress</span><em>No marks yet</em>";
    head.appendChild(grade);
    p.appendChild(head);
    var note = el("div", "sgb-note");
    note.appendChild(el("b", null, "On your record"));
    note.appendChild(el("p", null, "This course is on your Excel High School record as in progress. " +
      "Marks appear here as your teacher grades work, and the final grade is added to your record " +
      "when you finish it."));
    p.appendChild(note);
  }

  function classList() {
    var nav = el("nav", "sgb-classes");
    nav.setAttribute("aria-label", "Your classes");
    var cur = current(), curId = cur && cur.id;
    G.classes.forEach(function (c) {
      var s = c.summary;
      var b = btn("sgb-class" + (c.id === curId ? " on" : ""));
      b.dataset.id = c.id;
      b.setAttribute("aria-current", String(c.id === curId));
      var flags = "";
      if (c.missing) flags += '<em class="sgb-pill bad">' + c.missing + " missing</em>";
      if (c.pastdue) flags += '<em class="sgb-pill warn">' + c.pastdue + " past due</em>";
      if (c.recordOnly) flags += '<em class="sgb-pill">In progress</em>';
      b.innerHTML =
        '<span class="t"><b>' + esc(c.title) + "</b>" +
        '<span class="sub">' + (c.code ? esc(c.code) + " · " : "") +
        (c.recordOnly ? esc(c.school) + " · " + num(c.credits) + (c.credits === 1 ? " credit" : " credits")
                      : c.graded + " of " + c.work.length + " graded") +
        "</span>" + (flags ? '<span class="fl">' + flags + "</span>" : "") +
        "</span>" +
        '<span class="g ' + (s ? "b-" + band(s.percent) : "b-none") + '">' +
        "<b>" + (s ? esc(s.letter) : "—") + "</b><span>" + (s ? s.percent + "%" : "No grade") +
        "</span></span>" +
        '<span class="bar"><i class="b-' + (s ? band(s.percent) : "none") + '" style="width:' +
        (s ? Math.max(0, Math.min(100, s.percent)) : 0) + '%"></i></span>';
      b.addEventListener("click", function () { select(c.id); });
      nav.appendChild(b);
    });
    return nav;
  }

  function paintPanel() {
    var p = G.panel, c = current(), s = c.summary;
    p.innerHTML = "";

    /* ---- Head: the class and its grade */
    var head = el("header", "sgb-head");
    var name = el("div", "sgb-name");
    if (c.code) name.appendChild(el("p", "sgb-code", esc(c.code)));
    name.appendChild(el("h2", null, esc(c.title)));
    var facts = [];
    facts.push(c.graded + " graded");
    if (c.missing) facts.push('<span class="bad">' + c.missing + " missing</span>");
    if (c.pastdue) facts.push('<span class="warn">' + c.pastdue + " past due</span>");
    if (c.late) facts.push(c.late + " late");
    facts.push(c.work.length + " assignments");
    name.appendChild(el("p", "sgb-facts", facts.join(" · ")));
    head.appendChild(name);

    var grade = el("div", "sgb-grade " + (s ? "b-" + band(s.percent) : "b-none"));
    grade.innerHTML = s
      ? "<b>" + esc(s.letter) + "</b><span>" + s.percent + "%</span>" +
        '<em title="The share of the final grade that has marks in it so far.">Over ' +
        s.countedWeight + "% of the grade</em>"
      : "<b>—</b><span>No grade yet</span><em>Nothing marked in this class</em>";
    head.appendChild(grade);
    p.appendChild(head);

    /* ---- What-if banner */
    G.wiBar = el("div", "sgb-wi");
    p.appendChild(G.wiBar);
    paintWhatif();

    /* ---- Insight row: categories + the score chart */
    var row = el("div", "sgb-row");
    row.appendChild(categoryCard(c));
    row.appendChild(chartCard(c));
    p.appendChild(row);

    /* ---- Toolbar */
    p.appendChild(toolbar(c));

    /* ---- The table */
    G.tableHost = el("div", "sgb-table-wrap");
    p.appendChild(G.tableHost);
    paintTable();

    /* ---- What the rules did, and what the teacher said */
    var notes = policyNotes(s);
    if (notes.length) {
      var pol = el("div", "sgb-note");
      pol.appendChild(el("b", null, "How this grade was worked out"));
      var ul = el("ul");
      notes.forEach(function (n) { ul.appendChild(el("li", null, n)); });
      pol.appendChild(ul);
      p.appendChild(pol);
    }
    if (c.comment) {
      var said = el("div", "sgb-said");
      said.appendChild(el("b", null, "Teacher comment"));
      said.appendChild(el("p", null, esc(c.comment.body)));
      said.appendChild(el("span", null, esc(c.comment.author || "Your teacher") +
        (c.comment.updatedAt ? " · " + esc(dayLong(c.comment.updatedAt)) : "")));
      p.appendChild(said);
    }
    p.appendChild(el("p", "sgb-lock",
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" ' +
      'width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' +
      "<span>Read-only and tamper-evident. Only your teachers can enter marks, and every change " +
      "to one is logged with who made it and when — open any assignment to see its history. " +
      "What-if scores are never saved.</span>"));
  }

  function policyNotes(s) {
    var out = [];
    if (!s) return out;
    if (s.dropped && s.dropped.length) {
      out.push("Dropped under this class's rules: " +
        s.dropped.map(function (d) { return esc(d.title); }).join(", ") + ".");
    }
    if (s.lateCount) {
      out.push(s.lateCount + (s.lateCount === 1 ? " assignment" : " assignments") +
        " came in late, costing " + num(s.latePenalty) +
        (s.latePenalty === 1 ? " point." : " points."));
    }
    if (s.extraCredit) out.push(num(s.extraCredit) + " points of extra credit are included.");
    if (s.missingCount) {
      out.push(s.missingCount + (s.missingCount === 1 ? " assignment is" : " assignments are") +
        " marked missing and counted as zero until your teacher marks it.");
    }
    if (s.totalWeight && s.countedWeight < s.totalWeight) {
      out.push("Categories with nothing marked yet are left out rather than counted as zero, " +
        "so this grade is over " + s.countedWeight + "% of the class and will move as more is marked.");
    }
    return out;
  }

  /* ---- Categories: weight, grade, bar */
  function categoryCard(c) {
    var card = el("div", "sgb-card");
    card.appendChild(el("h3", null, "Categories"));
    var parts = (c.summary && c.summary.parts) || [];
    if (!parts.length) {
      card.appendChild(el("p", "sgb-muted", "No category has a mark in it yet."));
      return card;
    }
    var list = el("div", "sgb-cats");
    parts.forEach(function (x) {
      var r = el("button", "sgb-cat");
      r.type = "button";
      r.title = "Show only " + x.category;
      r.innerHTML = '<span class="n"><b>' + esc(x.category) + "</b><span>" + x.weight +
        "% of grade · " + x.items + (x.items === 1 ? " item" : " items") + "</span></span>" +
        '<span class="v">' + x.percent + "%</span>" +
        '<span class="trk"><i class="b-' + band(x.percent) + '" style="width:' +
        Math.max(0, Math.min(100, x.percent)) + '%"></i></span>';
      r.addEventListener("click", function () {
        G.filter.cat = G.filter.cat === x.category ? "" : x.category;
        var sel = G.panel.querySelector(".sgb-catsel");
        if (sel) sel.value = G.filter.cat;
        paintTable();
      });
      list.appendChild(r);
    });
    card.appendChild(list);
    return card;
  }

  /* ---- Every graded score in date order, with the class grade as a line.
     One series, so no legend: the title names it, the line is labelled on
     itself, and each dot says its own value on hover. */
  function chartCard(c) {
    var card = el("div", "sgb-card");
    card.appendChild(el("h3", null, "Scores over time"));
    var pts = c.work.filter(function (w) { return w.state === "graded" && w.pct != null; })
      .map(function (w) { return { w: w, t: ms(w.gradedAt) || w.dueMs || 0 }; })
      .sort(function (a, b) { return a.t - b.t; });
    if (pts.length < 2) {
      card.appendChild(el("p", "sgb-muted",
        pts.length ? "One mark so far. The chart appears after the second."
                   : "Nothing marked yet."));
      return card;
    }
    var W = 460, H = 180, L = 30, R = 12, T = 10, B = 22;
    var top = Math.max(100, Math.ceil(Math.max.apply(null, pts.map(function (p) { return p.w.pct; })) / 10) * 10);
    var lo = Math.min(50, Math.floor(Math.min.apply(null, pts.map(function (p) { return p.w.pct; })) / 10) * 10);
    function y(v) { return T + (H - T - B) * (1 - (v - lo) / (top - lo)); }
    function x(i) { return L + (W - L - R) * (pts.length === 1 ? .5 : i / (pts.length - 1)); }
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sgb-chart", role: "img",
      "aria-label": "Your score on each graded assignment in " + c.title + ", in the order they were marked." });
    for (var v = lo; v <= top; v += 10) {
      s.appendChild(svg("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: "grid" }));
      var tl = svg("text", { x: L - 6, y: y(v) + 3.5, class: "ax", "text-anchor": "end" });
      tl.textContent = v;
      s.appendChild(tl);
    }
    var path = pts.map(function (p, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.w.pct).toFixed(1); }).join(" ");
    s.appendChild(svg("path", { d: path, class: "ln" }));
    if (c.summary) {
      var gy = y(Math.max(lo, Math.min(top, c.summary.percent)));
      s.appendChild(svg("line", { x1: L, x2: W - R, y1: gy, y2: gy, class: "ref" }));
      var gl = svg("text", { x: W - R, y: gy - 5, class: "reft", "text-anchor": "end" });
      gl.textContent = "Class grade " + c.summary.percent + "%";
      s.appendChild(gl);
    }
    var first = svg("text", { x: L, y: H - 5, class: "ax" });
    first.textContent = day(pts[0].t);
    s.appendChild(first);
    var last = svg("text", { x: W - R, y: H - 5, class: "ax", "text-anchor": "end" });
    last.textContent = day(pts[pts.length - 1].t);
    s.appendChild(last);
    pts.forEach(function (p, i) {
      var g = svg("g", { class: "pt", tabindex: "0" });
      var tip = svg("title", {});
      tip.textContent = p.w.title + ": " + num(p.w.score) + " / " + num(p.w.outOf) + " (" + p.w.pct + "%)";
      g.appendChild(tip);
      g.appendChild(svg("circle", { cx: x(i), cy: y(p.w.pct), r: 11, class: "hit" }));
      g.appendChild(svg("circle", { cx: x(i), cy: y(p.w.pct), r: 4.5, class: "dot b-" + band(p.w.pct) }));
      g.addEventListener("click", function () { openRow(p.w.assignmentId); });
      s.appendChild(g);
    });
    card.appendChild(s);
    return card;
  }

  /* ---- Toolbar: search, filters, what-if, files, view */
  function toolbar(c) {
    var bar = el("div", "sgb-tools");
    var q = el("input", "sgb-search");
    q.type = "search";
    q.placeholder = "Search assignments  ( / )";
    q.setAttribute("aria-label", "Search assignments");
    q.value = G.filter.q;
    q.addEventListener("input", function () { G.filter.q = q.value; paintTable(); });
    bar.appendChild(q);

    var cat = el("select", "sgb-select sgb-catsel");
    cat.setAttribute("aria-label", "Category");
    cat.appendChild(new Option("All categories", ""));
    c.cats.forEach(function (k) { cat.appendChild(new Option(k, k)); });
    cat.value = G.filter.cat;
    cat.addEventListener("change", function () { G.filter.cat = cat.value; paintTable(); });
    bar.appendChild(cat);

    var seg = el("div", "sgb-seg");
    [["all", "All"], ["graded", "Graded"], ["missing", "Missing"], ["todo", "To do"]].forEach(function (o) {
      var b = btn(G.filter.status === o[0] ? "on" : "", o[1]);
      b.addEventListener("click", function () {
        G.filter.status = o[0];
        [].forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); });
        paintTable();
      });
      seg.appendChild(b);
    });
    bar.appendChild(seg);

    var sp = el("span", "sgb-sp");
    bar.appendChild(sp);

    var wi = btn("sgb-tbtn" + (G.whatif ? " on" : ""), "What-if", "What-if calculator (W)");
    wi.addEventListener("click", toggleWhatif);
    G.wiBtn = wi;
    bar.appendChild(wi);

    var exp = btn("sgb-tbtn", "Export", "Download this class as a spreadsheet (E)");
    exp.addEventListener("click", function () { exportClass(current()); });
    bar.appendChild(exp);

    var pr = btn("sgb-tbtn", "Print", "Print the report card (P)");
    pr.addEventListener("click", printReport);
    bar.appendChild(pr);

    var view = btn("sgb-tbtn", "View", "Customize the table");
    view.addEventListener("click", function (e) { e.stopPropagation(); customize(view); });
    bar.appendChild(view);
    return bar;
  }

  /* ---- The assignment table */
  var COLS = [
    { key: "due", label: "Due", pref: "due" },
    { key: "title", label: "Assignment" },
    { key: "category", label: "Category", pref: "category" },
    { key: "score", label: "Score" },
    { key: "pct", label: "%", pref: "pct" },
    { key: "flags", label: "Status", nosort: true }
  ];

  function visibleCols() {
    return COLS.filter(function (col) { return !col.pref || G.prefs.cols[col.pref]; });
  }

  function rows(c) {
    var q = G.filter.q.trim().toLowerCase();
    var list = c.work.filter(function (w) {
      if (G.prefs.hideExcused && w.state === "excused") return false;
      if (G.filter.cat && (w.category || "Uncategorised") !== G.filter.cat) return false;
      var st = G.filter.status;
      if (st === "graded" && w.state !== "graded") return false;
      if (st === "missing" && w.state !== "missing") return false;
      if (st === "todo" && w.state !== "upcoming" && w.state !== "pastdue") return false;
      if (q && (String(w.title) + " " + (w.category || "") + " " + (w.feedback || ""))
                 .toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var k = G.sort.key, d = G.sort.dir;
    function val(w) {
      if (k === "due") return w.dueMs != null ? w.dueMs : (ms(w.gradedAt) || Infinity);
      if (k === "title") return String(w.title || "").toLowerCase();
      if (k === "category") return String(w.category || "").toLowerCase();
      if (k === "score") return w.score != null ? Number(w.score) : -Infinity;
      if (k === "pct") return w.pct != null ? w.pct : -Infinity;
      return 0;
    }
    list.sort(function (a, b) {
      var x = val(a), y = val(b);
      if (x < y) return -d;
      if (x > y) return d;
      return String(a.title).localeCompare(String(b.title));
    });
    return list;
  }

  function flagsHtml(w) {
    var f = [];
    if (w.state === "missing") f.push('<em class="sgb-pill bad">Missing</em>');
    if (w.state === "pastdue") f.push('<em class="sgb-pill warn">Past due</em>');
    if (w.state === "upcoming") f.push('<em class="sgb-pill">' + (w.dueMs != null ? "Upcoming" : "Not graded") + "</em>");
    if (w.state === "excused") f.push('<em class="sgb-pill">Excused</em>');
    if (w.late) f.push('<em class="sgb-pill warn">Late</em>');
    if (w.extraCredit) f.push('<em class="sgb-pill info">Extra credit</em>');
    if (w.dropped) f.push('<em class="sgb-pill">Dropped</em>');
    if (w.feedback) f.push('<em class="sgb-pill info" title="Your teacher left feedback">Feedback</em>');
    return f.join("");
  }

  function scoreHtml(w) {
    if (w.state === "missing") return '<span class="sgb-zero">0</span><span class="of"> / ' + num(w.outOf) + "</span>";
    if (w.state === "excused") return '<span class="sgb-dim">EX</span>';
    if (w.state !== "graded") return '<span class="sgb-dim">—</span><span class="of"> / ' + num(w.outOf) + "</span>";
    var mode = G.prefs.score;
    if (mode === "pct") return "<b>" + w.pct + "%</b>";
    return "<b>" + num(w.score) + '</b><span class="of"> / ' + num(w.outOf) + "</span>";
  }

  function paintTable() {
    var host = G.tableHost, c = current();
    if (!host) return;
    host.innerHTML = "";
    var list = rows(c);
    var cols = visibleCols();
    var t = el("table", "sgb-table");
    var thead = el("thead"), hr = el("tr");
    cols.forEach(function (col) {
      var th = el("th", "c-" + col.key);
      th.scope = "col";
      if (col.nosort) {
        th.textContent = col.label;
      } else {
        var sb = btn("sgb-sort", esc(col.label) +
          (G.sort.key === col.key ? '<i aria-hidden="true">' + (G.sort.dir > 0 ? "▲" : "▼") + "</i>" : ""));
        sb.setAttribute("aria-label", "Sort by " + col.label);
        th.setAttribute("aria-sort", G.sort.key === col.key ? (G.sort.dir > 0 ? "ascending" : "descending") : "none");
        sb.addEventListener("click", function () {
          if (G.sort.key === col.key) G.sort.dir = -G.sort.dir;
          else { G.sort.key = col.key; G.sort.dir = col.key === "pct" || col.key === "score" ? -1 : 1; }
          paintTable();
        });
        th.appendChild(sb);
      }
      hr.appendChild(th);
    });
    hr.appendChild(el("th", "c-more", '<span class="sgb-sr">Details</span>'));
    thead.appendChild(hr);
    t.appendChild(thead);

    var tb = el("tbody");
    if (!list.length) {
      var er = el("tr"), ed = el("td", "sgb-none", "Nothing matches. Clear the search or the filters to see every assignment.");
      ed.colSpan = cols.length + 1;
      er.appendChild(ed);
      tb.appendChild(er);
    }
    list.forEach(function (w) {
      var tr = el("tr", "sgb-tr s-" + w.state + (w.dropped ? " dropped" : "") +
                        (G.open[w.assignmentId] ? " open" : ""));
      tr.dataset.id = w.assignmentId;
      cols.forEach(function (col) {
        var td = el("td", "c-" + col.key);
        if (col.key === "due") {
          td.textContent = w.dueMs != null ? day(w.dueMs) : "—";
          if (w.dueMs != null) td.title = dayLong(w.dueMs);
        } else if (col.key === "title") {
          td.innerHTML = "<b>" + esc(w.title) + "</b>" +
            (G.prefs.cols.feedback && w.feedback
              ? '<span class="sgb-fbp">' + esc(String(w.feedback).slice(0, 140)) +
                (String(w.feedback).length > 140 ? "…" : "") + "</span>" : "");
        } else if (col.key === "category") {
          td.textContent = w.category || "—";
        } else if (col.key === "score") {
          if (G.whatif && w.state !== "excused" && w.outOf > 0) {
            td.appendChild(whatifInput(w));
          } else {
            td.innerHTML = scoreHtml(w);
          }
        } else if (col.key === "pct") {
          var p = w.state === "missing" ? 0 : w.pct;
          td.innerHTML = p != null && w.state !== "excused"
            ? '<span class="sgb-pct b-' + band(p) + '">' + p + "%</span>" : '<span class="sgb-dim">—</span>';
        } else if (col.key === "flags") {
          td.innerHTML = flagsHtml(w);
        }
        tr.appendChild(td);
      });
      var more = el("td", "c-more");
      var mb = btn("sgb-more", '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" ' +
        'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        "Details for " + w.title);
      mb.setAttribute("aria-expanded", String(!!G.open[w.assignmentId]));
      more.appendChild(mb);
      tr.appendChild(more);
      tr.addEventListener("click", function (e) {
        if (e.target.closest("input")) return;
        toggleRow(w.assignmentId);
      });
      tb.appendChild(tr);
      if (G.open[w.assignmentId]) tb.appendChild(detailRow(w, cols.length + 1));
    });
    t.appendChild(tb);
    host.appendChild(t);

    var shown = list.length, all = c.work.length;
    host.appendChild(el("p", "sgb-count", shown === all
      ? all + (all === 1 ? " assignment" : " assignments")
      : shown + " of " + all + " assignments shown"));
  }

  function toggleRow(id) {
    G.open[id] = !G.open[id];
    paintTable();
  }
  function openRow(id) {
    G.open[id] = true;
    G.filter = { q: "", cat: "", status: "all" };
    var panel = G.panel;
    var q = panel.querySelector(".sgb-search"); if (q) q.value = "";
    var cs = panel.querySelector(".sgb-catsel"); if (cs) cs.value = "";
    var seg = panel.querySelector(".sgb-seg");
    if (seg) [].forEach.call(seg.children, function (x, i) { x.classList.toggle("on", i === 0); });
    paintTable();
    var tr = G.tableHost.querySelector('tr[data-id="' + id + '"]');
    if (tr && tr.scrollIntoView) tr.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  /* ---- One assignment, opened: feedback, dates, and the change log */
  function detailRow(w, span) {
    var tr = el("tr", "sgb-detail");
    var td = el("td");
    td.colSpan = span;
    var box = el("div", "sgb-det");
    var facts = el("dl", "sgb-dl");
    function fact(k, v) { facts.appendChild(el("dt", null, esc(k))); facts.appendChild(el("dd", null, v)); }
    fact("Score", w.state === "graded" ? num(w.score) + " / " + num(w.outOf) + " (" + w.pct + "%)"
      : w.state === "missing" ? "Missing — counts as 0 / " + num(w.outOf)
      : w.state === "excused" ? "Excused — not part of your grade"
      : "Not graded yet · out of " + num(w.outOf));
    fact("Category", esc(w.category || "—"));
    fact("Due", w.dueMs != null ? esc(dayLong(w.dueMs)) : "No due date");
    if (w.gradedAt) fact("Graded", esc(dayLong(w.gradedAt)));
    var notes = [];
    if (w.late) notes.push("Handed in late");
    if (w.extraCredit) notes.push("Extra credit — can raise your grade, never lower it");
    if (w.dropped) notes.push("Dropped under this class's rules — not counted");
    if (notes.length) fact("Notes", esc(notes.join(" · ")));
    box.appendChild(facts);

    if (w.feedback) {
      var fb = el("div", "sgb-fb");
      fb.appendChild(el("b", null, "Feedback from your teacher"));
      fb.appendChild(el("p", null, esc(w.feedback)));
      box.appendChild(fb);
    }

    var hist = el("div", "sgb-hist");
    hist.appendChild(el("b", null, "Change history"));
    var hl = el("div", "sgb-hl", '<span class="sgb-muted">Reading the log…</span>');
    hist.appendChild(hl);
    box.appendChild(hist);
    API.grades.history({ assignmentId: w.assignmentId, accountId: G.me.id }).then(function (events) {
      hl.innerHTML = "";
      if (!events || !events.length) {
        hl.appendChild(el("span", "sgb-muted", "No changes recorded. " +
          (w.state === "graded" ? "This mark is as it was first entered." : "Nothing has been entered yet.")));
        return;
      }
      var ol = el("ol");
      events.forEach(function (ev) {
        function said(score, status) {
          if (status === "missing") return "Missing";
          if (status === "excused") return "Excused";
          if (score == null) return "blank";
          return num(score) + (ev.outOf ? " / " + num(ev.outOf) : "");
        }
        var li = el("li");
        li.innerHTML = "<span>" + esc(said(ev.fromScore, ev.fromStatus)) + " → <b>" +
          esc(said(ev.toScore, ev.toStatus)) + "</b></span><em>" + esc(ev.actorName || "A teacher") +
          " · " + esc(dayLong(ev.at)) + "</em>" + (ev.note ? '<q>' + esc(ev.note) + "</q>" : "");
        ol.appendChild(li);
      });
      hl.appendChild(ol);
    }, function () {
      hl.innerHTML = "";
      hl.appendChild(el("span", "sgb-muted", "The history could not be read just now."));
    });
    td.appendChild(box);
    tr.appendChild(td);
    return tr;
  }

  /* ================================================================ What-if
     "What do I need on the final?" answered by the server over the real
     marks. Nothing typed here is ever written anywhere. */
  function toggleWhatif() {
    G.whatif = !G.whatif;
    if (!G.whatif) { G.hypo = {}; G.wiResult = null; }
    if (G.wiBtn) G.wiBtn.classList.toggle("on", G.whatif);
    paintWhatif();
    paintTable();
    if (G.whatif) {
      var first = G.tableHost.querySelector(".sgb-wi-in");
      if (first) first.focus();
    }
  }

  function whatifInput(w) {
    var wrap = el("span", "sgb-wi-cell");
    var inp = el("input", "sgb-wi-in");
    inp.type = "number";
    inp.min = "0";
    inp.step = "any";
    inp.inputMode = "decimal";
    inp.setAttribute("aria-label", "What-if score for " + w.title);
    var h = G.hypo[w.assignmentId];
    inp.value = h != null ? h : (w.state === "graded" ? num(w.score) : "");
    inp.placeholder = "—";
    if (h != null) wrap.classList.add("changed");
    inp.addEventListener("click", function (e) { e.stopPropagation(); });
    inp.addEventListener("input", function () {
      var v = inp.value.trim();
      var orig = w.state === "graded" ? num(w.score) : "";
      if (v === "" || v === orig) delete G.hypo[w.assignmentId];
      else G.hypo[w.assignmentId] = Number(v);
      wrap.classList.toggle("changed", G.hypo[w.assignmentId] != null);
      askWhatif();
    });
    wrap.appendChild(inp);
    wrap.appendChild(el("span", "of", " / " + num(w.outOf)));
    return wrap;
  }

  var wiTimer = null;
  function askWhatif() {
    clearTimeout(wiTimer);
    wiTimer = setTimeout(function () {
      var c = current();
      var changes = Object.keys(G.hypo).filter(function (id) { return isFinite(G.hypo[id]); })
        .map(function (id) { return { assignmentId: id, score: G.hypo[id], status: "marked" }; });
      if (!changes.length) { G.wiResult = null; paintWhatif(); return; }
      var seq = ++G.wiSeq;
      G.wiResult = { busy: true };
      paintWhatif();
      API.grades.whatif(c.id, G.me.id, changes).then(function (r) {
        if (seq !== G.wiSeq) return;
        G.wiResult = r;
        paintWhatif();
      }, function (e) {
        if (seq !== G.wiSeq) return;
        G.wiResult = { error: (e && e.message) || "The calculator could not answer just now." };
        paintWhatif();
      });
    }, 320);
  }

  function paintWhatif() {
    var b = G.wiBar;
    if (!b) return;
    b.innerHTML = "";
    b.hidden = !G.whatif;
    if (!G.whatif) return;
    var c = current();
    var n = Object.keys(G.hypo).length;
    var left = el("div", "t");
    left.appendChild(el("b", null, "What-if calculator"));
    var r = G.wiResult;
    if (!n) {
      left.appendChild(el("span", null, "Type a score into any assignment — graded or not — to see what " +
        "your grade would become. Nothing you type here is saved."));
    } else if (r && r.busy) {
      left.appendChild(el("span", null, "Working it out…"));
    } else if (r && r.error) {
      left.appendChild(el("span", "bad", esc(r.error)));
    } else if (r && r.then) {
      var now = r.now || c.summary;
      var d = now ? Math.round((r.then.percent - now.percent) * 10) / 10 : null;
      left.appendChild(el("span", null,
        "With " + n + (n === 1 ? " change" : " changes") + ": <strong class=\"b-" + band(r.then.percent) + "\">" +
        esc(r.then.letter) + " · " + r.then.percent + "%</strong>" +
        (now ? " — now " + esc(now.letter) + " · " + now.percent + "%" +
          (d ? ' <em class="' + (d > 0 ? "up" : "down") + '">' + (d > 0 ? "+" : "") + d + "</em>" : " (no change)") : "")));
    }
    b.appendChild(left);
    var acts = el("div", "a");
    if (n) {
      var reset = btn("sgb-tbtn", "Reset");
      reset.addEventListener("click", function () {
        G.hypo = {}; G.wiResult = null; G.wiSeq++;
        paintWhatif(); paintTable();
      });
      acts.appendChild(reset);
    }
    var done = btn("sgb-tbtn", "Done");
    done.addEventListener("click", toggleWhatif);
    acts.appendChild(done);
    b.appendChild(acts);
  }

  /* ================================================================ Report card */
  function paintReport() {
    var wrap = el("div", "sgb-report");
    var head = el("div", "sgb-rhead");
    var t = el("div");
    t.appendChild(el("h2", null, "Report card"));
    t.appendChild(el("p", "sgb-muted", esc(G.me.name || "") + " · as of " + esc(dayLong(Date.now())) +
      " · live from your teachers' gradebooks"));
    head.appendChild(t);
    var acts = el("div", "sgb-ractions");
    var ex = btn("sgb-tbtn", "Export all");
    ex.addEventListener("click", exportAll);
    acts.appendChild(ex);
    var pr = btn("sgb-tbtn", "Print");
    pr.addEventListener("click", printReport);
    acts.appendChild(pr);
    head.appendChild(acts);
    wrap.appendChild(head);

    if (G.record) wrap.appendChild(recordStrip());
    wrap.appendChild(el("h3", "sgb-h3", esc(thisYear()) + " · This year"));
    if (G.classes.length) wrap.appendChild(thisYearTable());
    else wrap.appendChild(el("p", "sgb-muted", "No classes this year yet."));

    G.years.forEach(function (y) { wrap.appendChild(yearBlock(y)); });

    var said = G.classes.filter(function (c) { return c.comment; });
    wrap.appendChild(el("h3", "sgb-h3", "Teacher comments"));
    if (!said.length) {
      wrap.appendChild(el("p", "sgb-muted", "No comments on this term's report yet."));
    } else {
      said.forEach(function (c) {
        var box = el("div", "sgb-said");
        box.appendChild(el("b", null, esc(c.title)));
        box.appendChild(el("p", null, esc(c.comment.body)));
        box.appendChild(el("span", null, esc(c.comment.author || "Your teacher") +
          (c.comment.updatedAt ? " · " + esc(dayLong(c.comment.updatedAt)) : "")));
        wrap.appendChild(box);
      });
    }
    wrap.appendChild(el("p", "sgb-muted sgb-foot",
      "This year's GPA is an estimate on an unweighted 4.0 scale from each class's current letter. " +
      (G.record ? "Cumulative GPA and credits come from your record; the Graduation tab shows how each " +
                  "credit counts toward your diploma."
                : "Your school's official transcript is on the Graduation tab.")));
    G.body.appendChild(wrap);
  }

  /* The record's totals, as the school prints them. */
  function recordStrip() {
    var r = G.record;
    var rg = r.gpa ? (r.gpa.issued != null ? r.gpa.issued : r.gpa.value) : null;
    var s = el("div", "sgb-ystats sgb-card");
    s.innerHTML =
      "<div><b>" + (rg != null ? Number(rg).toFixed(2) : "—") + "</b><span>cumulative GPA</span></div>" +
      "<div><b>" + num(r.totals.earned) + '<span class="of"> / ' + num(r.track.total) +
      "</span></b><span>credits · " + esc(r.track.name) + "</span></div>" +
      "<div><b>" + num(r.totals.remaining) + "</b><span>credits to go</span></div>" +
      "<div><b>" + G.years.reduce(function (n, y) { return n + y.courses.length; }, 0) +
      "</b><span>courses on record</span></div>";
    return s;
  }

  function yearBlock(y) {
    var box = el("div");
    var h = el("h3", "sgb-h3 sgb-yearh", esc(y.label) + " · " + esc(y.school));
    box.appendChild(h);
    var tw = el("div", "sgb-table-wrap");
    var t = el("table", "sgb-table sgb-rtable");
    t.innerHTML = "<thead><tr><th>Course</th><th>Subject</th><th class=\"num\">Final</th>" +
      "<th class=\"num\">Grade</th><th class=\"num\">Credits</th></tr></thead>";
    var tb = el("tbody");
    y.courses.forEach(function (c) {
      var tr = el("tr", "sgb-tr");
      tr.innerHTML = "<td><b>" + esc(c.title) + "</b></td><td>" + esc(c.area) + '</td><td class="num">' +
        (c.pct != null ? num(c.pct) + "%" : esc(c.mark || "—")) + '</td><td class="num">' +
        (c.letter ? '<span class="sgb-letter b-' + band(c.pct) + '">' + esc(c.letter) + "</span>" : "—") +
        '</td><td class="num">' + num(c.credits) + "</td>";
      tr.title = "Open " + c.title;
      tr.addEventListener("click", function () { setYear(y.key, c.id); });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    var tf = el("tfoot");
    tf.innerHTML = "<tr><td colspan=\"2\"><b>Year</b></td><td class=\"num\">" +
      (y.average != null ? num(y.average) + "%" : "—") + '</td><td class="num">' +
      (y.average != null ? esc(ehsLetter(y.average)) : "—") + '</td><td class="num"><b>' + num(y.credits) +
      "</b></td></tr>";
    t.appendChild(tf);
    tw.appendChild(t);
    box.appendChild(tw);
    return box;
  }

  function thisYearTable() {
    var tw = el("div", "sgb-table-wrap");
    var table = el("table", "sgb-table sgb-rtable");
    table.innerHTML = "<thead><tr><th>Class</th><th>Categories</th><th class=\"num\">Missing</th>" +
      "<th class=\"num\">Percent</th><th class=\"num\">Grade</th><th class=\"num\">Points</th></tr></thead>";
    var tb = el("tbody");
    G.classes.forEach(function (c) {
      var s = c.summary;
      var tr = el("tr", "sgb-tr");
      var cats = s && s.parts && s.parts.length
        ? s.parts.map(function (x) {
            return '<span class="sgb-mini"><span>' + esc(x.category) + "</span><b>" + x.percent + "%</b></span>";
          }).join("")
        : '<span class="sgb-dim">—</span>';
      tr.innerHTML = "<td><b>" + esc(c.title) + "</b>" + (c.code ? '<span class="sgb-fbp">' + esc(c.code) + "</span>" : "") +
        "</td><td>" + cats + '</td><td class="num">' + (c.missing ? '<span class="sgb-pill bad">' + c.missing + "</span>" : "0") +
        '</td><td class="num">' + (s ? s.percent + "%" : "—") + '</td><td class="num">' +
        (s ? '<span class="sgb-letter b-' + band(s.percent) + '">' + esc(s.letter) + "</span>" : "—") +
        '</td><td class="num">' + (s && POINTS[s.letter] != null ? POINTS[s.letter].toFixed(1) : "—") + "</td>";
      tr.addEventListener("click", function () { select(c.id); });
      tr.title = "Open " + c.title + " in the gradebook";
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    var g = gpa();
    var tf = el("tfoot");
    tf.innerHTML = "<tr><td colspan=\"3\"><b>Overall</b> <span class=\"sgb-muted\">unweighted estimate</span></td>" +
      '<td class="num">' + (g ? Math.round(g.avg * 10) / 10 + "%" : "—") + '</td><td class="num">' +
      (g ? esc(letterFor(g.avg)) : "—") + '</td><td class="num"><b>' + (g ? g.gpa.toFixed(2) : "—") + "</b></td></tr>";
    table.appendChild(tf);
    tw.appendChild(table);
    return tw;
  }

  /* ================================================================ Standards
     Each category, read as a level on a four-step mastery scale. Said plainly
     that it is read from the category percentage, because it is. */
  function paintStandards() {
    var wrap = el("div", "sgb-std");
    var key = el("div", "sgb-std-key");
    key.innerHTML = LEVELS.map(function (l) {
      return '<span><i class="lv lv' + l.n + '">' + l.n + "</i>" + esc(l.name) +
        (l.min ? " · " + l.min + "%+" : " · below 70%") + "</span>";
    }).join("");
    wrap.appendChild(key);
    wrap.appendChild(el("p", "sgb-muted",
      "Mastery levels are read from your percentage in each category of each class. They move as new work is marked."));
    G.classes.forEach(function (c) {
      var card = el("div", "sgb-card sgb-std-card");
      var h = el("div", "sgb-std-h");
      h.appendChild(el("h3", null, esc(c.title)));
      if (c.summary) {
        var lv = level(c.summary.percent);
        h.appendChild(el("span", "sgb-lv lv" + lv.n, "Overall: " + lv.n + " · " + esc(lv.name)));
      }
      card.appendChild(h);
      var parts = (c.summary && c.summary.parts) || [];
      if (!parts.length) {
        card.appendChild(el("p", "sgb-muted", "Nothing assessed yet."));
      } else {
        var list = el("div", "sgb-std-list");
        parts.forEach(function (x) {
          var l = level(x.percent);
          var r = el("div", "sgb-std-row");
          var steps = "";
          for (var i = 1; i <= 4; i++) steps += '<i class="' + (i <= l.n ? "lv" + l.n : "") + '"></i>';
          r.innerHTML = '<span class="n"><b>' + esc(x.category) + "</b><span>" + x.items +
            (x.items === 1 ? " assessment" : " assessments") + " · " + x.percent + "%</span></span>" +
            '<span class="steps" aria-hidden="true">' + steps + "</span>" +
            '<span class="sgb-lv lv' + l.n + '">' + l.n + " · " + esc(l.name) + "</span>";
          list.appendChild(r);
        });
        card.appendChild(list);
      }
      wrap.appendChild(card);
    });
    G.body.appendChild(wrap);
  }

  /* ================================================================ Overview
     Every class at once, and what the whole of it says: the tiles, what is
     coming, what the marks point to, the semester as a calendar, the mix of
     grades, and — when there is a record — the years behind this one.

     Nothing here re-adds a grade. A class's grade is the server's; a trend is
     the plain mean of the student's own recent marks against all of them,
     labelled as that; and anything that answers "what would happen if" is
     asked of the server's what-if, which writes nothing. */
  function trendOf(points) {
    if (points.length < 4) return null;
    var mean = function (a) { return a.reduce(function (s, p) { return s + p.w.pct; }, 0) / a.length; };
    var d = Math.round((mean(points.slice(-3)) - mean(points)) * 10) / 10;
    return { delta: d, dir: d >= 1.5 ? "up" : d <= -1.5 ? "down" : "flat" };
  }
  function initials(t) {
    var w = String(t || "").replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
    if (!w.length) return "·";
    return (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + (/^\d/.test(w[1]) ? w[1] : w[1][0])).toUpperCase().slice(0, 3);
  }
  function spark(points, w, h) {
    w = w || 132; h = h || 34;
    var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "sgb-spark", "aria-hidden": "true" });
    if (points.length < 2) return s;
    var vals = points.map(function (p) { return p.w.pct; });
    var lo = Math.min(60, Math.min.apply(null, vals)), hi = Math.max(100, Math.max.apply(null, vals));
    function x(i) { return 3 + (w - 6) * i / (vals.length - 1); }
    function y(v) { return 3 + (h - 6) * (1 - (v - lo) / (hi - lo)); }
    var d = vals.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ");
    s.appendChild(svg("path", { d: d + " L" + x(vals.length - 1).toFixed(1) + " " + h + " L3 " + h + " Z", class: "fill" }));
    s.appendChild(svg("path", { d: d, class: "ln" }));
    var last = vals[vals.length - 1];
    s.appendChild(svg("circle", { cx: x(vals.length - 1), cy: y(last), r: 3, class: "dot b-" + band(last) }));
    return s;
  }
  function trendHtml(t) {
    if (!t) return '<span class="sgb-trend flat" title="Trends appear after four marks">—</span>';
    var arrow = t.dir === "up" ? "▲" : t.dir === "down" ? "▼" : "▬";
    return '<span class="sgb-trend ' + t.dir + '" title="Your last three marks against your average in this class">' +
      arrow + " " + (t.delta > 0 ? "+" : "") + num(t.delta) + "</span>";
  }

  function section(title, aside, cls) {
    var sec = el("section", "sgb-sec" + (cls ? " " + cls : ""));
    var h = el("header", "sgb-sec-h");
    h.appendChild(el("h2", null, esc(title)));
    if (aside) h.appendChild(el("span", null, aside));
    sec.appendChild(h);
    return sec;
  }

  function paintOverview() {
    var wrap = el("div", "sgb-ov");
    var i = 0;
    function rise(n) {
      if (CALM || document.hidden) return n;
      n.classList.add("sgb-rise");
      n.style.setProperty("--i", Math.min(i++, 8));
      return n;
    }

    if (G.classes.length) {
      var sec = section("Your classes", G.classes.length + (G.classes.length === 1 ? " class" : " classes") + " this year");
      var grid = el("div", "sgb-tiles");
      G.classes.forEach(function (c) { grid.appendChild(rise(tile(c))); });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    } else {
      wrap.appendChild(el("div", "lx-empty", "No classes this year yet. When a teacher enrols you and sets " +
        "work, each class appears here as a card. Your earlier years are below."));
    }

    var row = el("div", "sgb-ov-row");
    row.appendChild(rise(comingUp()));
    row.appendChild(rise(insightsCard()));
    wrap.appendChild(row);

    if (G.classes.some(function (c) { return c.work.length; })) {
      var row2 = el("div", "sgb-ov-row wide-l");
      row2.appendChild(rise(heatmap()));
      row2.appendChild(rise(gradeMix()));
      wrap.appendChild(row2);
    } else if (G.record && G.record.gpa && G.record.gpa.distribution) {
      wrap.appendChild(rise(recordMix()));
    }
    if (G.years.length) wrap.appendChild(rise(journey()));
    G.body.appendChild(wrap);
  }

  function tile(c) {
    var s = c.summary;
    var t = btn("sgb-tile slot" + c.slot);
    t.title = "Open " + c.title;
    var head = el("div", "hd");
    head.appendChild(el("span", "mono", esc(initials(c.title))));
    var nm = el("div", "nm");
    nm.appendChild(el("b", null, esc(c.title)));
    nm.appendChild(el("span", null, c.recordOnly
      ? esc(c.school) + " · in progress"
      : (c.code ? esc(c.code) + " · " : "") + c.graded + " of " + c.work.length + " graded"));
    head.appendChild(nm);
    var med = el("div", "med " + (s ? "b-" + band(s.percent) : "b-none"));
    med.innerHTML = "<b>" + (s ? esc(s.letter) : "—") + "</b><span>" + (s ? s.percent + "%" : c.recordOnly ? "In progress" : "No grade") + "</span>";
    head.appendChild(med);
    t.appendChild(head);

    var mid = el("div", "sp");
    mid.appendChild(spark(c.points));
    mid.appendChild(el("div", "tr", trendHtml(c.trend) + '<span class="lb">recent vs average</span>'));
    t.appendChild(mid);

    var parts = (s && s.parts) || [];
    if (parts.length) {
      var cats = el("div", "cats");
      parts.slice(0, 4).forEach(function (x) {
        cats.appendChild(el("div", "cat", '<span class="n">' + esc(x.category) + '</span><span class="trk"><i class="b-' +
          band(x.percent) + '" style="width:' + Math.max(0, Math.min(100, x.percent)) + '%"></i></span><span class="v">' +
          x.percent + "%</span>"));
      });
      t.appendChild(cats);
    }
    var foot = el("div", "ft");
    var fl = "";
    if (c.missing) fl += '<em class="sgb-pill bad">' + c.missing + " missing</em>";
    if (c.pastdue) fl += '<em class="sgb-pill warn">' + c.pastdue + " past due</em>";
    foot.innerHTML = (c.next
      ? '<span class="nx">Next: <b>' + esc(c.next.title) + "</b> · " + esc(dueWord(c.next.dueMs)) + "</span>"
      : '<span class="nx dim">' + (c.recordOnly ? "Marks appear as work is graded" : "Nothing scheduled") + "</span>") + fl;
    t.appendChild(foot);
    t.addEventListener("click", function () { select(c.id); });
    return t;
  }

  function dueWord(t) {
    var d0 = new Date(); d0.setHours(0, 0, 0, 0);
    var d = new Date(t); d.setHours(0, 0, 0, 0);
    var n = Math.round((d - d0) / DAY);
    if (n === 0) return "today";
    if (n === 1) return "tomorrow";
    if (n === -1) return "yesterday";
    if (n > 1 && n < 7) return new Date(t).toLocaleDateString(undefined, { weekday: "long" });
    return day(t);
  }

  /* ---- Coming up: the next fourteen days, across every class, by day */
  function comingUp() {
    var sec = section("Coming up", "Next 14 days", "sgb-card");
    var now = Date.now();
    var items = [];
    G.classes.forEach(function (c) {
      c.work.forEach(function (w) {
        if ((w.state === "upcoming" || w.state === "pastdue") && w.dueMs != null &&
            w.dueMs >= now - 7 * DAY && w.dueMs <= now + 14 * DAY) items.push({ c: c, w: w });
      });
    });
    items.sort(function (a, b) { return a.w.dueMs - b.w.dueMs; });
    if (!items.length) {
      sec.appendChild(el("p", "sgb-muted", "Nothing due in the next two weeks. When teachers set work with a due date, it lines up here."));
      return sec;
    }
    var list = el("ol", "sgb-agenda");
    var lastDay = null;
    items.slice(0, 12).forEach(function (it) {
      var key = new Date(it.w.dueMs).toDateString();
      if (key !== lastDay) {
        lastDay = key;
        var word = it.w.state === "pastdue" ? "Past due" : dueWord(it.w.dueMs);
        list.appendChild(el("li", "day", esc(word) +
          (it.w.state === "pastdue" || word === day(it.w.dueMs) ? "" : " <span>" + esc(day(it.w.dueMs)) + "</span>")));
      }
      var li = el("li", "it slot" + it.c.slot + (it.w.state === "pastdue" ? " late" : ""));
      var b = btn("", '<i class="sw"></i><span class="t"><b>' + esc(it.w.title) + "</b><span>" + esc(it.c.title) +
        (it.w.category ? " · " + esc(it.w.category) : "") + '</span></span><span class="pts">' + num(it.w.outOf) + " pts</span>");
      b.addEventListener("click", function () { select(it.c.id); openRow(it.w.assignmentId); });
      li.appendChild(b);
      list.appendChild(li);
    });
    sec.appendChild(list);
    return sec;
  }

  /* ---- Insights: what the marks point to, said in a sentence each */
  function insightsCard() {
    var sec = section("Insights", "From your marks", "sgb-card");
    var list = el("div", "sgb-ins");
    var n = 0;
    function card(tone, icon, title, body, action) {
      if (n >= 6) return null;
      n++;
      var d = el("div", "in " + tone);
      d.appendChild(el("span", "ic", icon));
      var t = el("div", "tx");
      t.appendChild(el("b", null, title));
      var p = el("p", null, body);
      t.appendChild(p);
      if (action) {
        var a = btn("sgb-link", esc(action.label));
        a.addEventListener("click", action.go);
        t.appendChild(a);
      }
      d.appendChild(t);
      list.appendChild(d);
      return p;
    }
    function ic(d) {
      return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" ' +
        'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    var ICON = {
      miss: ic("M10 5v6M10 14.5v.5"),
      up: ic("M3 14l5-5 3 3 6-6M12 6h5v5"),
      down: ic("M3 6l5 5 3-3 6 6M12 14h5V9"),
      star: ic("M10 3l2.1 4.4 4.9.6-3.6 3.3.9 4.8L10 13.8 5.7 16.1l.9-4.8L3 8l4.9-.6z"),
      weak: ic("M10 3a7 7 0 1 0 0 14a7 7 0 1 0 0-14M10 7a3 3 0 1 0 0 6a3 3 0 1 0 0-6"),
      big: ic("M5 17V3M5 4h10l-2 3.5L15 11H5"),
      cap: ic("M2 8l8-4 8 4-8 4zM5.5 9.8V14c1.4 1.3 3 2 4.5 2s3.1-.7 4.5-2V9.8")
    };

    // Missing work, with what handing it in would do — asked of the server.
    var asked = 0;
    G.classes.forEach(function (c) {
      c.work.filter(function (w) { return w.state === "missing"; }).forEach(function (w) {
        var p = card("bad", ICON.miss, esc(w.title) + " is missing",
          "In " + esc(c.title) + " it counts as 0 of " + num(w.outOf) + " until it is handed in.",
          { label: "Open it", go: function () { select(c.id); openRow(w.assignmentId); } });
        if (p && c.summary && asked < 3) {
          asked++;
          var at = Math.max(60, Math.min(100, c.summary.percent));
          API.grades.whatif(c.id, G.me.id, [{ assignmentId: w.assignmentId, score: Math.round(at * w.outOf) / 100, status: "marked" }])
            .then(function (r) {
              if (!r || !r.then || !r.now) return;
              var d = r.then.percent - r.now.percent;
              if (d <= 0) return;
              p.innerHTML = "In " + esc(c.title) + " it counts as 0 of " + num(w.outOf) + ". Handed in at your usual " +
                num(at) + "%, your grade would go from <b>" + esc(r.now.letter) + " · " + r.now.percent + "%</b> to <b class=\"b-" +
                band(r.then.percent) + '">' + esc(r.then.letter) + " · " + r.then.percent + "%</b> (+" + num(d) + ").";
            }, function () { /* the plain sentence stands */ });
        }
      });
    });
    // Trends
    G.classes.forEach(function (c) {
      if (c.trend && c.trend.dir === "up") {
        card("good", ICON.up, "Climbing in " + esc(c.title),
          "Your last three marks average " + num(Math.abs(c.trend.delta)) + " points above your usual in this class.");
      } else if (c.trend && c.trend.dir === "down") {
        card("warn", ICON.down, "Slipping in " + esc(c.title),
          "Your last three marks are " + num(Math.abs(c.trend.delta)) + " points below your usual here — worth a look before it moves the grade.",
          { label: "See the marks", go: function () { select(c.id); } });
      }
    });
    // The category holding a class down
    G.classes.forEach(function (c) {
      var s = c.summary;
      if (!s || !s.parts || s.parts.length < 2) return;
      var low = s.parts.slice().sort(function (a, b) { return a.percent - b.percent; })[0];
      if (s.percent - low.percent >= 6) {
        card("warn", ICON.weak, "Lowest area in " + esc(c.title) + ": " + esc(low.category),
          "You're at " + low.percent + "% there against " + s.percent + "% overall, and it's " + low.weight +
          "% of the grade.", { label: "Show " + low.category, go: function () {
            G.filter = { q: "", cat: low.category, status: "all" }; G.year = "current"; G.sel = c.id;
            if (G.tab !== "book") { G.tab = "book"; paintTabs(); } paint();
          } });
      }
    });
    // A run of strong marks
    G.classes.forEach(function (c) {
      var run = 0;
      for (var i = c.points.length - 1; i >= 0 && c.points[i].w.pct >= 90; i--) run++;
      if (run >= 3) card("good", ICON.star, run + " in a row at 90%+ in " + esc(c.title), "Your last " + run + " marks here are all A-range.");
    });
    // The biggest thing left
    var big = null;
    G.classes.forEach(function (c) {
      if (c.recordOnly) return;
      var total = c.work.reduce(function (s2, w) { return s2 + (w.extraCredit ? 0 : Number(w.outOf || 0)); }, 0);
      c.work.forEach(function (w) {
        if (w.state !== "upcoming" || !total) return;
        var share = w.outOf / total;
        if (!big || share > big.share) big = { c: c, w: w, share: share };
      });
    });
    if (big && big.share >= 0.15) {
      card("info", ICON.big, esc(big.w.title) + " is the biggest thing left",
        "It's " + num(big.w.outOf) + " points in " + esc(big.c.title) + (big.w.dueMs ? ", due " + esc(dueWord(big.w.dueMs)) : "") +
        ". Set a goal to see what you need on it.", { label: "Set a goal", go: function () { setTab("goals"); } });
    }
    if (G.record && G.record.track) {
      var r = G.record;
      var extra = Math.round((r.totals.earned - r.totals.applied) * 1000) / 1000;
      card("info", ICON.cap, Math.round(r.totals.applied / r.track.total * 100) + "% of the way to your diploma",
        num(r.totals.earned) + " credits earned; " + num(r.totals.remaining) + " still to go." +
        (extra > 0 ? " " + num(extra) + (extra === 1 ? " credit is" : " credits are") + " extra in areas you've " +
                     "already finished, so " + (extra === 1 ? "it doesn't" : "they don't") + " count toward the others." : ""),
        { label: "See the plan", go: function () { setTab("grad"); } });
    }
    if (!n) sec.appendChild(el("p", "sgb-muted", "Insights appear as marks come in: trends, what's missing, and what's worth your next hour."));
    sec.appendChild(list);
    return sec;
  }

  /* ---- The semester as a calendar: every assignment on its due date, the
     colour its mark earned. One mark per cell carries the value in its
     tooltip; the colour is the band, and the band has a key. */
  function heatmap() {
    var sec = section("Semester at a glance", "Every assignment, on its due date", "sgb-card");
    var now = Date.now();
    var byDay = {};
    var first = null, last = now + 21 * DAY;
    G.classes.forEach(function (c) {
      c.work.forEach(function (w) {
        if (w.dueMs == null) return;
        var d = new Date(w.dueMs); d.setHours(0, 0, 0, 0);
        var k = d.getTime();
        (byDay[k] = byDay[k] || []).push({ c: c, w: w });
        if (first == null || k < first) first = k;
        if (k > last) last = k;
      });
    });
    if (first == null) { sec.appendChild(el("p", "sgb-muted", "No due dates yet.")); return sec; }
    var start = new Date(Math.max(first, now - 26 * 7 * DAY)); start.setHours(0, 0, 0, 0);
    start = new Date(start.getTime() - ((start.getDay() + 6) % 7) * DAY);      // back to Monday
    var weeks = Math.ceil((last - start.getTime()) / (7 * DAY)) + 1;
    if (weeks < 26) {                                   // a semester's worth, at least
      start = new Date(start.getTime() - (26 - weeks) * 7 * DAY);
      weeks = 26;
    }
    weeks = Math.min(44, weeks);
    var CELL = 15, GAP = 3, L = 26, T = 18;
    var W = L + weeks * (CELL + GAP), H = T + 7 * (CELL + GAP);
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sgb-heat", role: "img",
      "aria-label": "Calendar of assignments by due date, coloured by the mark each earned." });
    // Cells stay cells: the calendar fills its card up to half again its
    // drawn size, and scrolls rather than squashing on a phone.
    s.style.maxWidth = Math.round(W * 1.5) + "px";
    ["Mon", "", "Wed", "", "Fri", "", ""].forEach(function (lab, r) {
      if (!lab) return;
      var t = svg("text", { x: 0, y: T + r * (CELL + GAP) + CELL - 3, class: "ax" });
      t.textContent = lab;
      s.appendChild(t);
    });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var lastMonth = -1;
    for (var wk = 0; wk < weeks; wk++) {
      for (var r = 0; r < 7; r++) {
        var dt = new Date(start.getTime() + (wk * 7 + r) * DAY);
        var k = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
        if (r === 0 && dt.getMonth() !== lastMonth) {
          lastMonth = dt.getMonth();
          var mt = svg("text", { x: L + wk * (CELL + GAP), y: 11, class: "ax" });
          mt.textContent = dt.toLocaleDateString(undefined, { month: "short" });
          s.appendChild(mt);
        }
        var items = byDay[k] || [];
        var graded = items.filter(function (x) { return x.w.state === "graded" && x.w.pct != null; });
        var cls = "cell";
        if (graded.length) {
          var avg = graded.reduce(function (a, x) { return a + x.w.pct; }, 0) / graded.length;
          cls += " b-" + band(avg) + " has";
        } else if (items.some(function (x) { return x.w.state === "missing"; })) cls += " miss";
        else if (items.length) cls += k < today.getTime() ? " late" : " due";
        if (k === today.getTime()) cls += " today";
        var g = svg("g", {});
        var tip = svg("title", {});
        tip.textContent = dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
          (items.length ? "\n" + items.map(function (x) {
            return x.w.title + " (" + x.c.title + "): " + (x.w.state === "graded" ? x.w.pct + "%" :
              x.w.state === "missing" ? "missing" : x.w.state === "excused" ? "excused" : "not graded");
          }).join("\n") : "");
        g.appendChild(tip);
        g.appendChild(svg("rect", { x: L + wk * (CELL + GAP), y: T + r * (CELL + GAP), width: CELL, height: CELL, rx: 3, class: cls }));
        s.appendChild(g);
      }
    }
    var box = el("div", "sgb-heat-wrap");
    box.appendChild(s);
    sec.appendChild(box);
    var key = el("div", "sgb-key");
    key.innerHTML = '<span><i class="b-a"></i>90+</span><span><i class="b-b"></i>80s</span><span><i class="b-c"></i>70s</span>' +
      '<span><i class="b-f"></i>below 70</span><span><i class="miss"></i>missing</span><span><i class="due"></i>not graded</span>';
    sec.appendChild(key);
    return sec;
  }

  /* ---- Grade mix: every graded assignment, by the band its mark is in */
  function gradeMix() {
    var sec = section("Grade mix", "Every graded assignment", "sgb-card");
    var bands = [["a", "A", "90–100"], ["b", "B", "80–89"], ["c", "C", "70–79"], ["d", "D", "60–69"], ["f", "F", "below 60"]];
    var count = { a: 0, b: 0, c: 0, d: 0, f: 0 }, total = 0;
    G.classes.forEach(function (c) {
      c.work.forEach(function (w) {
        if (w.state === "graded" && w.pct != null) { count[band(w.pct)]++; total++; }
        else if (w.state === "missing") { count.f++; total++; }
      });
    });
    if (!total) { sec.appendChild(el("p", "sgb-muted", "Nothing graded yet.")); return sec; }
    var max = Math.max.apply(null, bands.map(function (b) { return count[b[0]]; }));
    var list = el("div", "sgb-mix");
    bands.forEach(function (b) {
      var n = count[b[0]];
      var row = el("div", "mx b-" + b[0]);
      row.innerHTML = '<span class="l"><b>' + b[1] + "</b><span>" + b[2] + '</span></span><span class="trk"><i style="width:' +
        (max ? n / max * 100 : 0) + '%"></i></span><span class="v"><b>' + n + "</b> · " + Math.round(n / total * 100) + "%</span>";
      list.appendChild(row);
    });
    sec.appendChild(list);
    sec.appendChild(el("p", "sgb-muted", "Missing work counts in F, because it counts as zero."));
    return sec;
  }

  /* ---- The record's grades by letter, for a student with no live classes
     yet: every lettered course on the transcript, as the server counted
     them for the GPA. A pass carries credit and no letter, so it is not here. */
  function recordMix() {
    var gp = G.record.gpa;
    var sec = section("Your record by letter", (gp.courses || 0) + " lettered courses · " + esc(gp.scale || ""), "sgb-card");
    var dist = gp.distribution || {}, cred = gp.distributionCredits || {};
    var letters = ["A", "B", "C", "D", "F"];
    var total = letters.reduce(function (a, l) { return a + (dist[l] || 0); }, 0);
    var max = Math.max.apply(null, letters.map(function (l) { return dist[l] || 0; }));
    var list = el("div", "sgb-mix");
    letters.forEach(function (l) {
      var n = dist[l] || 0;
      var row = el("div", "mx b-" + l.toLowerCase());
      row.innerHTML = '<span class="l"><b>' + l + "</b><span>" + num(cred[l] || 0) + ' cr</span></span><span class="trk"><i style="width:' +
        (max ? n / max * 100 : 0) + '%"></i></span><span class="v"><b>' + n + "</b> · " + (total ? Math.round(n / total * 100) : 0) + "%</span>";
      list.appendChild(row);
    });
    sec.appendChild(list);
    sec.appendChild(el("p", "sgb-muted", "GPA " + (gp.value != null ? Number(gp.value).toFixed(2) : "—") + " over " +
      num(gp.credits || 0) + " lettered credits" + (gp.matchesIssued ? ", the same as your school issued." : ".")));
    return sec;
  }

  /* ---- The years behind this one */
  function journey() {
    var sec = section("Your journey", G.record && G.record.track
      ? num(G.record.totals.earned) + " of " + num(G.record.track.total) + " credits" : "", "sgb-card");
    var line = el("div", "sgb-journey");
    var yrs = G.years.slice().reverse();
    var g = gpa();
    yrs.forEach(function (y) {
      var b = btn("node");
      var avg = y.average;
      b.innerHTML = '<i class="pip b-' + (avg != null ? band(avg) : "none") + '"></i><b>' + esc(y.label) + "</b><span>" + esc(y.school) +
        "</span><span class=\"st\">" + num(y.credits) + (y.credits === 1 ? " credit" : " credits") +
        (avg != null ? " · " + num(avg) + "% · " + esc(ehsLetter(avg)) : "") + "</span>";
      b.addEventListener("click", function () { setYear(y.key); });
      line.appendChild(b);
    });
    var now = btn("node now");
    now.innerHTML = '<i class="pip ' + (g ? "b-" + band(g.avg) : "b-none") + '"></i><b>' + esc(thisYear()) + "</b><span>This year</span>" +
      '<span class="st">' + (g ? num(Math.round(g.avg * 10) / 10) + "% · " + esc(letterFor(g.avg)) : "In progress") + "</span>";
    now.addEventListener("click", function () { setYear("current"); });
    line.appendChild(now);
    if (G.record && G.record.track) {
      var end = el("div", "node goal");
      end.innerHTML = '<i class="pip goal"></i><b>Diploma</b><span>' + esc(G.record.track.name) + '</span><span class="st">' +
        num(G.record.totals.remaining) + " credits to go</span>";
      line.appendChild(end);
    }
    sec.appendChild(line);
    return sec;
  }

  /* ================================================================ Goals
     "What do I need on the rest to get an A?" — the question every student
     does on the back of an envelope, and gets wrong, because the weighting,
     the drops and the late rules are not on the envelope. So it is asked of
     the server: the same what-if the calculator uses, searched for the
     average on the remaining work that reaches the target. Nothing is
     written, and every number shown is one the server computed. */
  var TARGETS = [["A", 93], ["A-", 90], ["B+", 87], ["B", 83], ["B-", 80], ["C+", 77], ["C", 73], ["C-", 70], ["D", 63], ["D-", 60]];

  function remainingOf(c) {
    return c.work.filter(function (w) {
      return (w.state === "upcoming" || w.state === "pastdue") && w.outOf > 0 && !w.extraCredit;
    });
  }
  function whatAt(c, rest, pct) {
    return API.grades.whatif(c.id, G.me.id, rest.map(function (w) {
      return { assignmentId: w.assignmentId, score: Math.round(pct * w.outOf) / 100, status: "marked" };
    })).then(function (r) { return r && r.then; });
  }
  /* The lowest average on what is left that reaches `min`, to the nearest
     point: the ends first, then halving — nine questions at most. */
  function solve(c, min) {
    var key = c.id + ":" + min;
    G.goalCache = G.goalCache || {};
    if (G.goalCache[key]) return G.goalCache[key];
    var rest = remainingOf(c);
    var p = whatAt(c, rest, 100).then(function (top) {
      if (!top) throw new Error("no answer");
      if (top.percent < min) return { kind: "out", best: top };
      return whatAt(c, rest, 0).then(function (floor) {
        if (floor && floor.percent >= min) return { kind: "safe", floor: floor };
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

  function paintGoals() {
    var wrap = el("div", "sgb-goals");
    wrap.appendChild(el("p", "sgb-lede", "Pick the grade you're aiming for in each class. OEdu asks your teacher's own " +
      "grading rules what you need on everything that's left — weights, drops and all — and nothing you try here is saved."));
    var list = G.classes.filter(function (c) { return !c.recordOnly; });
    if (!list.length) {
      wrap.appendChild(el("div", "lx-empty", "Goals work on this year's classes, and you have none with work set yet."));
      G.body.appendChild(wrap);
      return;
    }
    var grid = el("div", "sgb-goal-grid");
    list.forEach(function (c, i) {
      var card = goalCard(c);
      if (!CALM && !document.hidden) {
        card.classList.add("sgb-rise");
        card.style.setProperty("--i", Math.min(i, 8));
      }
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    G.body.appendChild(wrap);
  }

  function goalCard(c) {
    var s = c.summary;
    var rest = remainingOf(c);
    var card = el("div", "sgb-goal slot" + c.slot);
    var head = el("div", "hd");
    head.appendChild(el("span", "mono", esc(initials(c.title))));
    var nm = el("div", "nm");
    nm.appendChild(el("b", null, esc(c.title)));
    nm.appendChild(el("span", null, s ? "Now " + esc(s.letter) + " · " + s.percent + "%" : "No grade yet"));
    head.appendChild(nm);
    card.appendChild(head);

    if (!rest.length) {
      card.appendChild(el("p", "sgb-muted", "Nothing left to grade here, so the grade moves only if a mark changes."));
      return card;
    }
    var pts = rest.reduce(function (a, w) { return a + Number(w.outOf); }, 0);
    card.appendChild(el("p", "left", rest.length + (rest.length === 1 ? " assignment" : " assignments") + " left · " +
      num(pts) + " points"));

    var pick = el("div", "pick");
    pick.appendChild(el("span", null, "I'm aiming for"));
    var seg = el("div", "sgb-seg targets");
    G.prefs.targets = G.prefs.targets || {};
    var want = G.prefs.targets[c.id];
    if (!want) {
      // One step up from where they are, which is the goal most people set.
      var cur = s ? s.percent : 0;
      var up = TARGETS.slice().reverse().filter(function (t) { return t[1] > cur; })[0];
      want = (up || TARGETS[0])[0];
    }
    var out = el("div", "res");
    TARGETS.forEach(function (t) {
      var b = btn(t[0] === want ? "on" : "", esc(t[0]));
      b.title = t[1] + "% or above";
      b.addEventListener("click", function () {
        G.prefs.targets[c.id] = t[0]; savePrefs();
        [].forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); });
        answer(t);
      });
      seg.appendChild(b);
    });
    pick.appendChild(seg);
    card.appendChild(pick);
    card.appendChild(out);

    function answer(t) {
      out.className = "res busy";
      out.innerHTML = '<span class="sgb-muted">Asking your teacher’s grading rules…</span>';
      solve(c, t[1]).then(function (r) {
        if (r.kind === "out") {
          out.className = "res out";
          out.innerHTML = "<b>Out of reach this term</b><p>Even 100% on everything left reaches <b>" + esc(r.best.letter) +
            " · " + r.best.percent + "%</b>. That's the ceiling — and still worth chasing.</p>";
        } else if (r.kind === "safe") {
          out.className = "res safe";
          out.innerHTML = "<b>Already secured</b><p>Your marks so far keep you at " + esc(t[0]) +
            " or above whatever happens on the rest (" + esc(r.floor.letter) + " · " + r.floor.percent + "% at worst).</p>";
        } else {
          var mine = s ? s.percent : null;
          var tone = mine == null ? "need" : r.pct <= mine ? "ok" : r.pct - mine <= 8 ? "stretch" : "hard";
          out.className = "res " + tone;
          out.innerHTML = '<div class="big"><b>' + r.pct + "%</b><span>average needed on what's left</span></div>" +
            '<div class="meter"><i class="need" style="left:' + r.pct + '%"></i>' +
            (mine != null ? '<i class="mine" style="left:' + Math.min(100, mine) + '%"></i>' : "") + "</div>" +
            '<p class="legend"><span><i class="need"></i>needed</span>' +
            (mine != null ? '<span><i class="mine"></i>your ' + mine + "% now</span>" : "") + "</p>" +
            '<p class="why">' + (tone === "ok" ? "Right on track — that's at or below the " + mine + "% you're averaging now."
              : tone === "stretch" ? "A stretch — about " + (r.pct - mine) + " points above your current " + mine + "%."
              : tone === "hard" ? "A big climb — " + (r.pct - mine) + " points above your current " + mine + "%. Every point on the biggest assignment counts most."
              : "") + " That would land you at <b>" + esc(r.at.letter) + " · " + r.at.percent + "%</b>.</p>";
        }
      }, function () {
        out.className = "res";
        out.innerHTML = '<span class="sgb-muted">The calculator could not answer just now.</span>';
      });
    }
    answer(TARGETS.filter(function (t) { return t[0] === want; })[0] || TARGETS[0]);

    // And the slider: "if I average this much on the rest".
    var sl = el("div", "slide");
    var lab = el("label");
    lab.appendChild(el("span", null, "If I average"));
    var r = el("input");
    r.type = "range"; r.min = "0"; r.max = "100"; r.step = "1";
    r.value = String(s ? Math.max(0, Math.min(100, Math.round(s.percent))) : 80);
    r.setAttribute("aria-label", "Average on the remaining work in " + c.title);
    var val = el("b", null, r.value + "%");
    lab.appendChild(r);
    lab.appendChild(val);
    sl.appendChild(lab);
    var res = el("p", "sres", "&nbsp;");
    sl.appendChild(res);
    card.appendChild(sl);
    var seq = 0, timer = null;
    function run() {
      var my = ++seq, pct = Number(r.value);
      val.textContent = pct + "%";
      clearTimeout(timer);
      timer = setTimeout(function () {
        res.innerHTML = '<span class="sgb-muted">…</span>';
        whatAt(c, rest, pct).then(function (t) {
          if (my !== seq || !t) return;
          res.innerHTML = "on the rest → <b class=\"b-" + band(t.percent) + '">' + esc(t.letter) + " · " + t.percent + "%</b>";
        }, function () { if (my === seq) res.textContent = "Could not work that out just now."; });
      }, 220);
    }
    r.addEventListener("input", run);
    run();
    return card;
  }

  /* ================================================================ Palette
     ⌘K. Every class, every assignment, every past course and every action,
     one search box away. */
  var pal = null;
  function palette() {
    if (pal) { closePalette(); return; }
    if (sheet) shortcuts();
    closePop();
    var items = [];
    TABS.forEach(function (t, i) {
      items.push({ k: "Go to", t: t.label, s: "Tab " + (i + 1), go: function () { setTab(t.key); } });
    });
    G.classes.forEach(function (c) {
      items.push({ k: "Class", t: c.title, s: c.summary ? c.summary.letter + " · " + c.summary.percent + "%" : "No grade yet",
                   slot: c.slot, go: function () { select(c.id); } });
      c.work.forEach(function (w) {
        items.push({ k: "Assignment", t: w.title, s: c.title + " · " + (w.state === "graded" ? num(w.score) + "/" + num(w.outOf)
          : { missing: "missing", excused: "excused", pastdue: "past due", upcoming: w.dueMs ? "due " + day(w.dueMs) : "not graded" }[w.state]),
          slot: c.slot, go: function () { select(c.id); openRow(w.assignmentId); } });
      });
    });
    G.years.forEach(function (y) {
      y.courses.forEach(function (x) {
        items.push({ k: y.label, t: x.title, s: x.school + " · " + (x.letter || "—") + (x.pct != null ? " · " + num(x.pct) + "%" : ""),
                     go: function () { setYear(y.key, x.id); } });
      });
    });
    items.push({ k: "Action", t: "Set a goal", s: "What do I need on the rest?", go: function () { setTab("goals"); } });
    items.push({ k: "Action", t: "What-if calculator", s: "Try scores on the open class", go: function () {
      if (!G.classes.length) return;
      if (G.tab !== "book" || G.year !== "current") { G.year = "current"; G.tab = "book"; paintTabs(); paint(); }
      if (!G.whatif && !current().recordOnly) toggleWhatif();
    } });
    items.push({ k: "Action", t: "Export everything as a spreadsheet", s: "Every class and year", go: exportAll });
    items.push({ k: "Action", t: "Print the report card", s: "A clean page for paper", go: printReport });
    items.push({ k: "Action", t: (G.prefs.dense ? "Comfortable" : "Compact") + " rows", s: "Table density", go: function () {
      G.prefs.dense = !G.prefs.dense; savePrefs(); G.host.classList.toggle("dense", G.prefs.dense); paint();
    } });
    items.push({ k: "Action", t: "Keyboard shortcuts", s: "Everything the keys do", go: shortcuts });

    pal = el("div", "sgb-pal");
    pal.setAttribute("role", "dialog");
    pal.setAttribute("aria-modal", "true");
    pal.setAttribute("aria-label", "Search or jump");
    var box = el("div", "sgb-pal-box");
    var inp = el("input");
    inp.type = "text";
    inp.placeholder = "Search classes, assignments, past courses, actions…";
    inp.setAttribute("aria-label", "Search");
    inp.setAttribute("role", "combobox");
    inp.setAttribute("aria-expanded", "true");
    box.appendChild(inp);
    var ul = el("ul", "list");
    ul.setAttribute("role", "listbox");
    ul.id = "sgbPalList";
    inp.setAttribute("aria-controls", ul.id);
    box.appendChild(ul);
    box.appendChild(el("p", "hint", "<kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close"));
    pal.appendChild(box);
    document.body.appendChild(pal);
    var shown = [], at = 0;
    function draw() {
      var q = inp.value.trim().toLowerCase();
      var words = q.split(/\s+/).filter(Boolean);
      shown = items.map(function (it, i) {
        var title = it.t.toLowerCase(), hay = (it.t + " " + it.s + " " + it.k).toLowerCase();
        if (!words.every(function (w) { return hay.indexOf(w) > -1; })) return null;
        var rank = !q ? 0 : title.indexOf(q) === 0 ? 0 : title.indexOf(q) > -1 ? 1
          : words.every(function (w) { return title.indexOf(w) > -1; }) ? 2 : 3;
        return { it: it, rank: rank, i: i };
      }).filter(Boolean).sort(function (a, b) { return a.rank - b.rank || a.i - b.i; })
        .map(function (x) { return x.it; });
      if (!q) shown = shown.filter(function (it) { return it.k !== "Assignment" && !/^\d{4}/.test(it.k); });
      shown = shown.slice(0, 50);
      at = Math.min(at, Math.max(0, shown.length - 1));
      ul.innerHTML = "";
      if (!shown.length) ul.appendChild(el("li", "none", "Nothing matches “" + esc(inp.value) + "”."));
      shown.forEach(function (it, i) {
        var li = el("li", "opt" + (i === at ? " on" : "") + (it.slot ? " slot" + it.slot : ""));
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(i === at));
        li.id = "sgbPal" + i;
        li.innerHTML = '<span class="k">' + esc(it.k) + '</span><span class="t"><b>' + esc(it.t) + "</b><span>" + esc(it.s) + "</span></span>";
        li.addEventListener("mousemove", function () { if (at !== i) { at = i; mark(); } });
        li.addEventListener("click", function () { choose(i); });
        ul.appendChild(li);
      });
      if (shown.length) inp.setAttribute("aria-activedescendant", "sgbPal" + at);
    }
    function mark() {
      [].forEach.call(ul.children, function (li, i) {
        li.classList.toggle("on", i === at);
        li.setAttribute("aria-selected", String(i === at));
      });
      var on = ul.children[at];
      if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
      inp.setAttribute("aria-activedescendant", "sgbPal" + at);
    }
    function choose(i) {
      var it = shown[i];
      closePalette();
      if (it) it.go();
    }
    inp.addEventListener("input", function () { at = 0; draw(); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { at = Math.min(shown.length - 1, at + 1); mark(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { at = Math.max(0, at - 1); mark(); e.preventDefault(); }
      else if (e.key === "Enter") { choose(at); e.preventDefault(); }
      else if (e.key === "Escape") { closePalette(); e.preventDefault(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { closePalette(); e.preventDefault(); }
    });
    pal.addEventListener("mousedown", function (e) { if (e.target === pal) closePalette(); });
    draw();
    inp.focus();
  }
  function closePalette() {
    if (!pal) return;
    pal.remove();
    pal = null;
  }

  /* ================================================================ Files */
  function csvCell(v) {
    var s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function download(name, text) {
    var blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  function stamp() { return new Date().toISOString().slice(0, 10); }
  function workRows(c) {
    return c.work.map(function (w) {
      return [thisYear(), c.school || "", c.title, w.title, w.category || "",
              w.dueMs != null ? new Date(w.dueMs).toISOString().slice(0, 10) : "",
              w.state === "graded" ? w.score : w.state === "missing" ? 0 : "", w.outOf,
              w.state === "graded" ? w.pct : w.state === "missing" ? 0 : "", "",
              { graded: "Graded", missing: "Missing", excused: "Excused", pastdue: "Past due", upcoming: "Not graded" }[w.state],
              "", w.late ? "Yes" : "", w.extraCredit ? "Yes" : "", w.dropped ? "Yes" : "", w.feedback || ""]
        .map(csvCell).join(",");
    });
  }
  /* A past course is one row: its final grade, as the record carries it. */
  function yearRows(y) {
    return y.courses.map(function (c) {
      return [y.label, c.school, c.title, "Final grade", c.area, "", c.pct != null ? c.pct : (c.mark || ""),
              c.pct != null ? 100 : "", c.pct != null ? c.pct : "", c.letter || "", decisionSays(c),
              c.credits, "", "", "", ""]
        .map(csvCell).join(",");
    });
  }
  var HEAD = ["Year", "School", "Class", "Assignment", "Category", "Due", "Score", "Out of", "Percent",
              "Grade", "Status", "Credits", "Late", "Extra credit", "Dropped", "Feedback"].join(",");
  function exportClass(c) {
    if (!c) return;
    download("Grades - " + c.title.replace(/[\\/:*?"<>|]/g, "").replace(/[\u2010-\u2015]/g, "-") + " - " +
             stamp() + ".csv",
             [HEAD].concat(workRows(c)).join("\n"));
    toast("Downloaded " + c.title + " as a spreadsheet.");
  }
  function exportYear(y) {
    // Plain hyphens: a browser drops the name of a download that carries an en dash.
    download("Grades - " + y.label.replace(/[\u2010-\u2015]/g, "-") + " - " + stamp() + ".csv",
             [HEAD].concat(yearRows(y)).join("\n"));
    toast("Downloaded " + y.label + " as a spreadsheet.");
  }
  function exportAll() {
    var lines = [HEAD];
    G.classes.forEach(function (c) { lines = lines.concat(workRows(c)); });
    G.years.forEach(function (y) { lines = lines.concat(yearRows(y)); });
    download("Grades - all years - " + stamp() + ".csv", lines.join("\n"));
    toast(G.years.length ? "Downloaded every class and every earlier year as one spreadsheet."
                         : "Downloaded every class as one spreadsheet.");
  }

  /* A printed report card is its own page, written for paper — light, plain,
     one table — rather than the dark screen with its chrome hidden. */
  function printReport() {
    if (!G.classes.length && !G.years.length) return;
    var g = gpa();
    var rowsHtml = G.classes.map(function (c) {
      var s = c.summary;
      return "<tr><td><b>" + esc(c.title) + "</b>" + (c.code ? "<br><small>" + esc(c.code) + "</small>" : "") + "</td><td>" +
        (s && s.parts ? s.parts.map(function (x) { return esc(x.category) + " " + x.percent + "%"; }).join("<br>") : "—") +
        "</td><td>" + c.missing + "</td><td>" + (s ? s.percent + "%" : "—") + "</td><td><b>" + (s ? esc(s.letter) : "—") +
        "</b></td></tr>" + (c.comment ? '<tr class="cm"><td colspan="5"><i>' + esc(c.comment.body) + "</i> — " +
        esc(c.comment.author || "Teacher") + "</td></tr>" : "");
    }).join("");
    var r = G.record;
    var rg = r && r.gpa ? (r.gpa.issued != null ? r.gpa.issued : r.gpa.value) : null;
    var summaryHtml = r
      ? "<p class=\"sum\"><b>Cumulative GPA " + (rg != null ? Number(rg).toFixed(2) : "—") + "</b> · " +
        num(r.totals.earned) + " of " + num(r.track.total) + " credits (" + esc(r.track.name) + ") · " +
        num(r.totals.remaining) + " to go</p>"
      : "";
    var html = "<!doctype html><html><head><meta charset=\"utf-8\"><title>Report card — " + esc(G.me.name || "") +
      "</title><style>body{font:13px/1.45 -apple-system,BlinkMacSystemFont,Inter,Helvetica,Arial,sans-serif;color:#111;margin:32px}" +
      "h1{font-size:22px;margin:0 0 4px}p{margin:0 0 18px;color:#555}table{width:100%;border-collapse:collapse}" +
      "th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #ddd;vertical-align:top}th{font-size:11px;" +
      "text-transform:uppercase;letter-spacing:.06em;color:#555}tr.cm td{color:#333;border-bottom:1px solid #bbb}" +
      "tfoot td{font-weight:600;border-top:2px solid #111}small{color:#666}h2{font-size:15px;margin:26px 0 8px}" +
      "p.sum{color:#111;font-size:14px}</style></head><body>" +
      "<h1>Report card</h1><p>" + esc(G.me.name || "") + " · " + esc(dayLong(Date.now())) + " · OEdu</p>" +
      summaryHtml +
      (G.classes.length
        ? "<h2>" + esc(thisYear()) + " · This year</h2>" +
          "<table><thead><tr><th>Class</th><th>Categories</th><th>Missing</th><th>Percent</th><th>Grade</th></tr></thead><tbody>" +
          rowsHtml + "</tbody><tfoot><tr><td colspan=\"3\">GPA (unweighted estimate)</td><td>" +
          (g ? Math.round(g.avg * 10) / 10 + "%" : "—") + "</td><td>" + (g ? g.gpa.toFixed(2) : "—") +
          "</td></tr></tfoot></table>"
        : "") +
      G.years.map(function (y) {
        return "<h2>" + esc(y.label) + " · " + esc(y.school) + "</h2><table><thead><tr><th>Course</th>" +
          "<th>Subject</th><th>Final</th><th>Grade</th><th>Credits</th></tr></thead><tbody>" +
          y.courses.map(function (c) {
            return "<tr><td>" + esc(c.title) + "</td><td>" + esc(c.area) + "</td><td>" +
              (c.pct != null ? num(c.pct) + "%" : esc(c.mark || "—")) + "</td><td><b>" + esc(c.letter || "—") +
              "</b></td><td>" + num(c.credits) + "</td></tr>";
          }).join("") + "</tbody><tfoot><tr><td colspan=\"2\">Year</td><td>" +
          (y.average != null ? num(y.average) + "%" : "—") + "</td><td>" +
          (y.average != null ? esc(ehsLetter(y.average)) : "—") + "</td><td>" + num(y.credits) +
          "</td></tr></tfoot></table>";
      }).join("") + "</body></html>";
    var w = window.open("", "_blank");
    if (!w) { toast("Your browser blocked the print window. Allow pop-ups for this site and try again."); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 250);
  }

  /* ================================================================ Customize */
  var pop = null;
  function closePop() {
    if (pop) { pop.remove(); pop = null; document.removeEventListener("click", outside, true); }
  }
  function outside(e) { if (pop && !pop.contains(e.target)) closePop(); }

  function customize(anchor) {
    if (pop) { closePop(); return; }
    pop = el("div", "sgb-pop");
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Customize the gradebook");
    pop.appendChild(el("b", null, "Columns"));
    [["due", "Due date"], ["category", "Category"], ["pct", "Percent"], ["feedback", "Feedback preview"]].forEach(function (o) {
      pop.appendChild(check(o[1], G.prefs.cols[o[0]], function (v) { G.prefs.cols[o[0]] = v; }));
    });
    pop.appendChild(el("b", null, "Show scores as"));
    var seg = el("div", "sgb-seg");
    [["both", "Points"], ["pct", "Percent"]].forEach(function (o) {
      var b = btn(G.prefs.score === o[0] ? "on" : "", o[1]);
      b.addEventListener("click", function () {
        G.prefs.score = o[0]; savePrefs();
        [].forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); });
        paintTable();
      });
      seg.appendChild(b);
    });
    pop.appendChild(seg);
    pop.appendChild(el("b", null, "Layout"));
    pop.appendChild(check("Compact rows", G.prefs.dense, function (v) {
      G.prefs.dense = v; G.host.classList.toggle("dense", v);
    }));
    pop.appendChild(check("Hide excused work", G.prefs.hideExcused, function (v) { G.prefs.hideExcused = v; }));
    var reset = btn("sgb-link", "Reset to defaults");
    reset.addEventListener("click", function () {
      var sel = G.prefs.sel;
      G.prefs = defaults(); G.prefs.sel = sel; savePrefs();
      G.host.classList.toggle("dense", false);
      closePop(); paintTable();
    });
    pop.appendChild(reset);
    anchor.parentNode.appendChild(pop);
    setTimeout(function () { document.addEventListener("click", outside, true); }, 0);
  }
  function check(label, on, set) {
    var l = el("label", "sgb-check");
    var i = el("input");
    i.type = "checkbox";
    i.checked = !!on;
    i.addEventListener("change", function () { set(i.checked); savePrefs(); paintTable(); });
    l.appendChild(i);
    l.appendChild(el("span", null, esc(label)));
    return l;
  }

  /* ================================================================ Shortcuts */
  var sheet = null;
  function shortcuts() {
    if (sheet) { sheet.remove(); sheet = null; return; }
    sheet = el("div", "sgb-sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "Keyboard shortcuts");
    var card = el("div", "sgb-sheet-card");
    card.appendChild(el("h3", null, "Keyboard shortcuts"));
    var dl = el("dl");
    SHORTCUTS.forEach(function (s) {
      dl.appendChild(el("dt", null, s[0].map(function (k) { return "<kbd>" + esc(k) + "</kbd>"; }).join(" ")));
      dl.appendChild(el("dd", null, esc(s[1])));
    });
    card.appendChild(dl);
    var close = btn("lx-btn quiet", "Close");
    close.addEventListener("click", shortcuts);
    card.appendChild(close);
    sheet.appendChild(card);
    sheet.addEventListener("click", function (e) { if (e.target === sheet) shortcuts(); });
    document.body.appendChild(sheet);
    close.focus();
  }

  function live() {
    return G && G.host && G.host.isConnected && G.host.offsetParent !== null;
  }

  function bindKeys() {
    if (keysBound) return;
    keysBound = true;
    document.addEventListener("keydown", function (e) {
      if (!live()) return;
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === "k" || e.key === "K")) {
        palette(); e.preventDefault(); return;
      }
      if (pal) return;          // the palette owns the keyboard while it is open
      if (e.key === "Escape") {
        if (sheet) { shortcuts(); e.preventDefault(); return; }
        if (pop) { closePop(); e.preventDefault(); return; }
        if (G.whatif && G.tab === "book") { toggleWhatif(); e.preventDefault(); return; }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
      var k = e.key;
      if (k === "?") { shortcuts(); e.preventDefault(); return; }
      if (sheet) return;
      if (k >= "1" && k <= String(TABS.length)) { setTab(TABS[+k - 1].key); e.preventDefault(); return; }
      if (k === "p" || k === "P") { printReport(); e.preventDefault(); return; }
      if (G.tab !== "book" || (!G.classes.length && !G.years.length)) return;
      if (k === "j" || k === "J") { step(1); e.preventDefault(); }
      else if (k === "k" || k === "K") { step(-1); e.preventDefault(); }
      else if (k === "/") {
        var q = G.panel && G.panel.querySelector(".sgb-search");
        if (q) { q.focus(); e.preventDefault(); }
      }
      else if (k === "w" || k === "W") {
        // What-if belongs to a live class; a past year's grades are final.
        if (G.year === "current" && current() && !current().recordOnly) toggleWhatif();
        e.preventDefault();
      }
      else if (k === "e" || k === "E") {
        var py = G.year !== "current" && yearOf(G.year);
        if (py) exportYear(py); else if (current()) exportClass(current());
        e.preventDefault();
      }
    });
  }

  function toast(msg) {
    if (G && G.opts.toast) G.opts.toast(msg);
  }

  return { mount: mount };
})();
