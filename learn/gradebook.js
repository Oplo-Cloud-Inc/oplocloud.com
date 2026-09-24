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

  var TABS = [
    { key: "book", label: "Gradebook" },
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
    [["J"], "Next class"],
    [["K"], "Previous class"],
    [["/"], "Search assignments"],
    [["W"], "Turn the what-if calculator on or off"],
    [["E"], "Export this class as a spreadsheet"],
    [["P"], "Print the report card"],
    [["1", "2", "3", "4"], "Gradebook, Report card, Standards, Graduation"],
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
      tab: opts.tab || "book",
      prefs: loadPrefs(),
      classes: [], byId: {}, sel: null,
      filter: { q: "", cat: "", status: "all" },
      sort: { key: "due", dir: 1 },
      whatif: false, hypo: {}, wiResult: null, wiSeq: 0,
      open: {}
    };
    bindKeys();
    host.innerHTML = "";
    host.classList.add("sgb");
    host.classList.toggle("dense", !!G.prefs.dense);

    var top = el("div", "sgb-top");
    var titles = el("div", "sgb-titles");
    titles.appendChild(el("p", "lx-eyebrow", "Grades" + (G.me.name ? " · " + esc(G.me.name) : "")));
    titles.appendChild(el("h1", "lx-h1", "Gradebook"));
    top.appendChild(titles);
    var help = btn("sgb-icon-btn", "?", "Keyboard shortcuts");
    help.addEventListener("click", shortcuts);
    top.appendChild(help);
    host.appendChild(top);

    G.kpis = el("div", "sgb-kpis");
    host.appendChild(G.kpis);

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
      API.reporting.report(me.id).catch(function () { return null; })
    ]).then(function (out) {
      build(out[0] || {}, out[1] || {}, out[2]);
      paintKpis();
      paint();
    }, function (e) {
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
  function build(cw, gl, report) {
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
    G.classes = Object.keys(byId).map(function (k) { return byId[k]; })
      .sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
    var want = G.prefs.sel && byId[G.prefs.sel] ? G.prefs.sel : null;
    G.sel = want || (G.classes[0] && G.classes[0].id) || null;
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

  function paintKpis() {
    var k = G.kpis;
    k.innerHTML = "";
    if (!G.classes.length) return;
    var g = gpa();
    var now = Date.now();
    var missing = 0, pastdue = 0, soon = 0;
    G.classes.forEach(function (c) {
      missing += c.missing; pastdue += c.pastdue;
      c.work.forEach(function (w) {
        if (w.state === "upcoming" && w.dueMs != null && w.dueMs - now < 7 * DAY) soon++;
      });
    });
    function tile(label, value, sub, tone) {
      var t = el("div", "sgb-kpi" + (tone ? " " + tone : ""));
      t.appendChild(el("span", "l", esc(label)));
      t.appendChild(el("b", null, value));
      t.appendChild(el("span", "s", sub));
      k.appendChild(t);
    }
    tile("GPA (estimate)", g ? g.gpa.toFixed(2) : "—",
         g ? "Unweighted, 4.0 scale, " + g.n + (g.n === 1 ? " class" : " classes") : "No graded classes yet");
    tile("Average", g ? (Math.round(g.avg * 10) / 10) + "%" : "—",
         g ? esc(letterFor(g.avg)) + " across your classes" : "Nothing marked yet");
    tile("Missing", String(missing), missing ? "Counted as zero until handed in" : "Nothing missing",
         missing ? "bad" : "good");
    tile("Past due", String(pastdue), pastdue ? "Due date passed, not marked yet" : "All caught up",
         pastdue ? "warn" : "");
    tile("Due this week", String(soon), "Across every class", "");
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
    if (!G.classes.length) {
      G.body.appendChild(el("div", "lx-empty",
        "No classes with grades yet. When a teacher enrols you and sets work, every class and " +
        "every mark appears here — on this device and on every other one you sign in on."));
      return;
    }
    if (G.tab === "book") paintBook();
    else if (G.tab === "report") paintReport();
    else if (G.tab === "standards") paintStandards();
  }

  /* ================================================================ Gradebook */
  function current() { return G.byId[G.sel] || G.classes[0]; }

  function select(id) {
    if (!G.byId[id] || G.sel === id) return;
    G.sel = id;
    G.prefs.sel = id; savePrefs();
    G.whatif = false; G.hypo = {}; G.wiResult = null; G.open = {};
    G.filter.cat = "";
    if (G.tab !== "book") { G.tab = "book"; paintTabs(); }
    paint();
  }

  function step(d) {
    if (!G.classes.length) return;
    var i = G.classes.indexOf(current());
    var j = Math.max(0, Math.min(G.classes.length - 1, i + d));
    if (j !== i) {
      select(G.classes[j].id);
      var b = G.body.querySelector('.sgb-class[data-id="' + G.classes[j].id + '"]');
      if (b) b.focus();
    }
  }

  function paintBook() {
    var grid = el("div", "sgb-grid");
    grid.appendChild(classList());
    G.panel = el("section", "sgb-panel");
    grid.appendChild(G.panel);
    G.body.appendChild(grid);
    paintPanel();
  }

  function classList() {
    var nav = el("nav", "sgb-classes");
    nav.setAttribute("aria-label", "Your classes");
    G.classes.forEach(function (c) {
      var s = c.summary;
      var b = btn("sgb-class" + (c.id === current().id ? " on" : ""));
      b.dataset.id = c.id;
      b.setAttribute("aria-current", String(c.id === current().id));
      var flags = "";
      if (c.missing) flags += '<em class="sgb-pill bad">' + c.missing + " missing</em>";
      if (c.pastdue) flags += '<em class="sgb-pill warn">' + c.pastdue + " past due</em>";
      b.innerHTML =
        '<span class="t"><b>' + esc(c.title) + "</b>" +
        '<span class="sub">' + (c.code ? esc(c.code) + " · " : "") + c.graded + " of " +
        c.work.length + " graded</span>" + (flags ? '<span class="fl">' + flags + "</span>" : "") +
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
    wrap.appendChild(tw);

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
      "GPA is an estimate on an unweighted 4.0 scale from each class's current letter. Your school's " +
      "official transcript is on the Graduation tab."));
    G.body.appendChild(wrap);
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
      return [c.title, w.title, w.category || "", w.dueMs != null ? new Date(w.dueMs).toISOString().slice(0, 10) : "",
              w.state === "graded" ? w.score : w.state === "missing" ? 0 : "", w.outOf,
              w.state === "graded" ? w.pct : w.state === "missing" ? 0 : "",
              { graded: "Graded", missing: "Missing", excused: "Excused", pastdue: "Past due", upcoming: "Not graded" }[w.state],
              w.late ? "Yes" : "", w.extraCredit ? "Yes" : "", w.dropped ? "Yes" : "", w.feedback || ""]
        .map(csvCell).join(",");
    });
  }
  var HEAD = ["Class", "Assignment", "Category", "Due", "Score", "Out of", "Percent", "Status",
              "Late", "Extra credit", "Dropped", "Feedback"].join(",");
  function exportClass(c) {
    if (!c) return;
    download("Grades - " + c.title.replace(/[\\/:*?"<>|]/g, "") + " - " + stamp() + ".csv",
             [HEAD].concat(workRows(c)).join("\n"));
    toast("Downloaded " + c.title + " as a spreadsheet.");
  }
  function exportAll() {
    var lines = [HEAD];
    G.classes.forEach(function (c) { lines = lines.concat(workRows(c)); });
    download("Grades - all classes - " + stamp() + ".csv", lines.join("\n"));
    toast("Downloaded every class as one spreadsheet.");
  }

  /* A printed report card is its own page, written for paper — light, plain,
     one table — rather than the dark screen with its chrome hidden. */
  function printReport() {
    if (!G.classes.length) return;
    var g = gpa();
    var rowsHtml = G.classes.map(function (c) {
      var s = c.summary;
      return "<tr><td><b>" + esc(c.title) + "</b>" + (c.code ? "<br><small>" + esc(c.code) + "</small>" : "") + "</td><td>" +
        (s && s.parts ? s.parts.map(function (x) { return esc(x.category) + " " + x.percent + "%"; }).join("<br>") : "—") +
        "</td><td>" + c.missing + "</td><td>" + (s ? s.percent + "%" : "—") + "</td><td><b>" + (s ? esc(s.letter) : "—") +
        "</b></td></tr>" + (c.comment ? '<tr class="cm"><td colspan="5"><i>' + esc(c.comment.body) + "</i> — " +
        esc(c.comment.author || "Teacher") + "</td></tr>" : "");
    }).join("");
    var html = "<!doctype html><html><head><meta charset=\"utf-8\"><title>Report card — " + esc(G.me.name || "") +
      "</title><style>body{font:13px/1.45 -apple-system,BlinkMacSystemFont,Inter,Helvetica,Arial,sans-serif;color:#111;margin:32px}" +
      "h1{font-size:22px;margin:0 0 4px}p{margin:0 0 18px;color:#555}table{width:100%;border-collapse:collapse}" +
      "th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #ddd;vertical-align:top}th{font-size:11px;" +
      "text-transform:uppercase;letter-spacing:.06em;color:#555}tr.cm td{color:#333;border-bottom:1px solid #bbb}" +
      "tfoot td{font-weight:600;border-top:2px solid #111}small{color:#666}</style></head><body>" +
      "<h1>Report card</h1><p>" + esc(G.me.name || "") + " · " + esc(dayLong(Date.now())) + " · OEdu</p>" +
      "<table><thead><tr><th>Class</th><th>Categories</th><th>Missing</th><th>Percent</th><th>Grade</th></tr></thead><tbody>" +
      rowsHtml + "</tbody><tfoot><tr><td colspan=\"3\">GPA (unweighted estimate)</td><td>" +
      (g ? Math.round(g.avg * 10) / 10 + "%" : "—") + "</td><td>" + (g ? g.gpa.toFixed(2) : "—") +
      "</td></tr></tfoot></table></body></html>";
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
      if (k >= "1" && k <= "4") { setTab(TABS[+k - 1].key); e.preventDefault(); return; }
      if (k === "p" || k === "P") { printReport(); e.preventDefault(); return; }
      if (G.tab !== "book" || !G.classes.length) return;
      if (k === "j" || k === "J") { step(1); e.preventDefault(); }
      else if (k === "k" || k === "K") { step(-1); e.preventDefault(); }
      else if (k === "/") {
        var q = G.panel && G.panel.querySelector(".sgb-search");
        if (q) { q.focus(); e.preventDefault(); }
      }
      else if (k === "w" || k === "W") { toggleWhatif(); e.preventDefault(); }
      else if (k === "e" || k === "E") { exportClass(current()); e.preventDefault(); }
    });
  }

  function toast(msg) {
    if (G && G.opts.toast) G.opts.toast(msg);
  }

  return { mount: mount };
})();
