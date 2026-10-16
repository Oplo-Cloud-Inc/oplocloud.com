/* ==========================================================================
   OEdu — Attendance, for the people who run the school day.

   A teacher takes a register for a course. This is where the school checks
   them and mends them:

     Main        which registers were taken on a chosen date, and which were
                 not; open any course to see and correct its register
     Student     one student's marks, course by course and day by day: click a
                 mark to change it, pick a code and click marks or a date to
                 apply it, and read the absences and lates for a marking period
     Bulk edit   excuse a whole group — a course, a grade level or a program —
                 for a date or a run of dates
     Audit log   every change to a mark: who, when, from what to what
     Find errors registers nobody took, and marks that look wrong, each with
                 a way to put it right
     Settings    whether students and families see attendance online, and the
                 days there is no school

   A mark is one student, one course, one day: present, late, absent, excused
   or cut. Late counts as in the room. Absent, excused and cut count as away —
   the "Abs" totals include excused and unexcused alike. A comment travels
   with the mark and is shown to families when attendance is online.

   Whether somebody may read or change any of it is decided on the server.
   This file draws what it was given and says so when it was refused.

   Mounted by app.js with the console kit: OPLO_ATTEND(kit) → { tab, student }.
   ========================================================================== */
window.OPLO_ATTEND = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, AT = API.attendance, toast = K.toast;

  /* What a mark can say is the school's own list (Settings › Codes), read with
     the first screen and used everywhere after. Every total is by a code's
     *kind*, never by its name, so "Illness" can count as excused and "Field
     trip" as absent without this file knowing either word. */
  var DEFAULTS = [
    { key: "present", label: "Present", mark: "P", kind: "present" },
    { key: "absent", label: "Absent", mark: "A", kind: "absent" },
    { key: "late", label: "Late", mark: "L", kind: "tardy" },
    { key: "excused", label: "Excused", mark: "E", kind: "excused" },
    { key: "cut", label: "Cut", mark: "C", kind: "absent" }
  ];
  var KIND_NAME = { present: "Present", tardy: "Tardy", absent: "Absent", excused: "Excused", norecord: "No record" };
  var ALL = [], CODES = [], CODE = {}, FIRST = "present";
  function useCodes(list) {
    ALL = (list && list.length ? list : DEFAULTS).map(function (c) {
      return { k: c.key, name: c.label, ch: c.mark, kind: c.kind, adminOnly: !!c.adminOnly, retired: !!c.retired };
    });
    CODES = ALL.filter(function (c) { return !c.retired; });
    CODE = {};
    ALL.forEach(function (c) { CODE[c.k] = c; });
    FIRST = (CODES[0] || ALL[0]).k;
  }
  useCodes(null);
  function kindOf(key) { return CODE[key] ? CODE[key].kind : "absent"; }
  function isAway(key) { var k = kindOf(key); return k === "absent" || k === "excused"; }
  function isLate(key) { return kindOf(key) === "tardy"; }
  function nameOf(key) { return CODE[key] ? CODE[key].name : String(key); }
  function firstOfKind(kind) { return (CODES.filter(function (c) { return c.kind === kind; })[0] || CODES[0]).k; }
  // Click on a mark: the school's first three codes in turn (present, absent, late by default).
  function cycle(key) {
    var three = CODES.slice(0, 3).map(function (c) { return c.k; }), i = three.indexOf(key);
    return three[i < 0 ? 1 % three.length : (i + 1) % three.length];
  }
  var VIA = { register: "Register", student: "Student record", bulk: "Bulk edit", fix: "Correction", remove: "Removed" };

  /* ------------------------------------------------------------ Dates
     Everything here is a calendar day in the school's own time, as text. */
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function add(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function dow(s) { return parse(s).getDay(); }
  function weekend(s) { var w = dow(s); return w === 0 || w === 6; }
  function today() { return iso(new Date()); }
  function label(s) { var d = parse(s); return DOW[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()]; }
  function longLabel(s) { return parse(s).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  function mondayOf(s) { var w = dow(s); return add(s, w === 0 ? -6 : 1 - w); }
  function lastSchoolDay(s) { var d = s || today(); while (weekend(d)) d = add(d, -1); return d; }
  function nextWeekday(s, step) { var d = add(s, step); while (weekend(d)) d = add(d, step); return d; }
  function clock(ms) { return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
  function stamp(ms) { return label(iso(new Date(ms))) + ", " + clock(ms); }
  function eachDay(from, to) {
    var out = [];
    for (var d = from; d <= to && out.length < 400; d = add(d, 1)) out.push(d);
    return out;
  }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }
  // Who should have a mark in this course on this day: the students already in it by the end of that day.
  function expected(c, day) {
    var j = c.joined;
    if (!j) return c.students;
    var end = parse(add(day, 1)).getTime(), n = 0;
    Object.keys(j).forEach(function (id) { if (!j[id] || j[id] < end) n++; });
    return n;
  }
  function names(list) { return list.map(function (x) { return x.name; }).join(", "); }

  /* ----------------------------------------------------------- School
     No school: weekends, and the closures the school has entered. */
  var NOSET = { online: false, closed: [], lockDays: null };
  // The school's calendar, day by day (kind, label, the periods that run), and which periods each section meets in.
  var CAL = {}, SECT = {};
  var KIND_OFF = { holiday: "Holiday", staff: "Staff day", canceled: "Canceled", none: "No school" };
  var LOCKDAYS = null;   // how many days a teacher may still change a register; null: no limit
  // The school's office reads the whole settings; a teacher is given what they need to take a register.
  function loadSettings() {
    var cal = API.schedule.calendar(add(today(), -200), add(today(), 190)).then(function (r) { takeCalendar(r.days); }, function () { /* the weekdays are the fallback */ });
    return cal.then(function () { return loadSettingsOnly(); });
  }
  function loadSettingsOnly() {
    return AT.settings().then(function (s) { useCodes(s.codes); LOCKDAYS = s.lockDays == null ? null : s.lockDays; return s; }, function () {
      return AT.codes().then(function (s) {
        useCodes(s.codes);
        LOCKDAYS = s.lockDays == null ? null : s.lockDays;
        return Object.assign({}, NOSET, s);
      }, function () { return NOSET; });
    });
  }
  function closedName(day, set) {
    var e = CAL[day];
    if (e && e.kind !== "school") return e.label || (e.kind === "none" ? (weekend(day) ? "A weekend" : KIND_OFF.none) : KIND_OFF[e.kind]);
    for (var i = 0; i < set.closed.length; i++) {
      var c = set.closed[i];
      if (day >= c.from && day <= c.to) return c.label || "No school";
    }
    return null;
  }
  function schoolDay(day, set) { return (CAL[day] ? CAL[day].kind === "school" : !weekend(day)) && !closedName(day, set); }
  // A section with periods meets only when the day's bell schedule has one of them.
  function meetsOn(courseId, day) {
    var p = SECT[courseId], e = CAL[day];
    if (!p || !p.length || !e || !e.periods || !e.periods.length) return true;
    return p.some(function (x) { return e.periods.indexOf(x) > -1; });
  }
  function takeCalendar(days) { (days || []).forEach(function (e) { CAL[e.day] = e; }); }

  var PERIODS = null;
  function loadPeriods() {
    if (PERIODS) return Promise.resolve(PERIODS);
    return API.periods.list().then(function (l) { PERIODS = l || []; return PERIODS; }, function () { return []; });
  }

  /* ------------------------------------------------------------ State */
  var ST = { day: null, view: "main", studentId: null, weeks: 2, period: "auto", filter: "all",
             bulk: null, logMode: "day", logAll: true, logDay: null, logStudent: null, range: 14 };
  var RUN = 0;       // a view that finished after you left it does not draw
  var STALE = false; // the dashboards elsewhere in the console re-read after a change

  /* ------------------------------------------------------------ Pieces */
  function pill(tone, text) { return "<span class='cx-pill " + tone + "'>" + esc(text) + "</span>"; }
  function button(text, cls, go) {
    var b = el("button", cls || "at-btn", esc(text));
    b.type = "button";
    if (go) b.addEventListener("click", go);
    return b;
  }
  function field(labelText, node, note) {
    var w = el("label", "admin-field at-f");
    w.appendChild(el("span", null, esc(labelText)));
    w.appendChild(node);
    if (note) w.appendChild(el("small", "at-fnote", esc(note)));
    return w;
  }
  function dateInput(value, change) {
    var i = el("input", "at-dateinput");
    i.type = "date"; i.value = value;
    i.addEventListener("change", function () { if (/^\d{4}-\d{2}-\d{2}$/.test(i.value)) change(i.value); });
    return i;
  }
  function seg(options, current, pick) {
    var s = el("div", "cn-seg");
    options.forEach(function (o) {
      var b = el("button", "cn-segb" + (String(o[0]) === String(current) ? " on" : ""), esc(o[1]));
      b.type = "button";
      b.addEventListener("click", function () {
        [].forEach.call(s.children, function (x) { x.classList.toggle("on", x === b); });
        pick(o[0]);
      });
      s.appendChild(b);
    });
    return s;
  }
  function schoolOf(d, id) { return d.students.filter(function (s) { return s.id === id; })[0] || null; }
  function courseOf(d, id) { return d.courses.filter(function (c) { return c.id === id; })[0] || null; }

  /* Find student: a few letters become a short list. */
  function finder(d, pick) {
    var wrap = el("div", "at-find");
    var inp = el("input", "cn-search");
    inp.type = "search"; inp.placeholder = "Find student"; inp.setAttribute("aria-label", "Find student");
    var list = el("div", "at-find-list");
    list.hidden = true;
    function paint() {
      var t = inp.value.trim().toLowerCase();
      list.innerHTML = "";
      if (t.length < 1) { list.hidden = true; return; }
      var hits = d.students.filter(function (s) {
        return String(s.name || "").toLowerCase().indexOf(t) > -1 || String(s.email || "").toLowerCase().indexOf(t) > -1;
      }).slice(0, 8);
      if (!hits.length) list.appendChild(el("p", "at-find-none", "Nobody by that name."));
      hits.forEach(function (s) {
        var b = el("button", "at-find-i");
        b.type = "button";
        b.appendChild(K.cxWho(s));
        b.addEventListener("click", function () { list.hidden = true; inp.value = ""; pick(s); });
        list.appendChild(b);
      });
      list.hidden = false;
    }
    inp.addEventListener("input", paint);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { list.hidden = true; inp.value = ""; }
      if (e.key === "Enter") { var f = list.querySelector(".at-find-i"); if (f) f.click(); }
    });
    wrap.appendChild(inp);
    wrap.appendChild(list);
    return wrap;
  }

  /* ============================================================ The page */
  function tab(v) {
    if (!ST.day) ST.day = lastSchoolDay();
    // Coming back to Attendance lands on the main view, unless a student was
    // asked for by name (student() below).
    if (!ST.deep) ST.view = "main";
    ST.deep = false;
    var P = K.cxPage(v, null, "Attendance",
      "Which registers were taken, who was in the room, and every correction. A teacher takes a register; this is where the school checks it and mends it.");
    var slot = el("div", "at-slot");
    v.appendChild(slot);
    var pg = { P: P, slot: slot };
    pg.go = function (view) { ST.view = view; render(pg); };
    render(pg);
  }

  function render(pg) {
    RUN++;
    ({ main: drawMain, student: drawStudent, bulk: drawBulk, log: drawLog, errors: drawErrors, settings: drawSettings, ada: drawAda }[ST.view] || drawMain)(pg);
  }

  function tools(pg, items) {
    pg.P.tools.innerHTML = "";
    items.forEach(function (b) { pg.P.tools.appendChild(b); });
  }
  function mainTools(pg) {
    tools(pg, [
      K.cnAction("Bulk edit", function () { pg.go("bulk"); }),
      K.cnAction("Audit log", function () { pg.go("log"); }),
      K.cnAction("Find errors", function () { pg.go("errors"); }),
      K.cnAction("Daily attendance", function () { pg.go("ada"); }),
      K.cnAction("Settings", function () { pg.go("settings"); })
    ]);
  }
  function doneTools(pg) { tools(pg, [K.cnAction("Done", function () { pg.go("main"); }, true)]); }

  function heading(slot, title, sub) {
    var h = el("div", "at-h");
    h.appendChild(el("h2", null, esc(title)));
    if (sub) h.appendChild(el("p", "cx-note", esc(sub)));
    slot.appendChild(h);
    return h;
  }

  function dateNav(change) {
    var nav = el("div", "at-date");
    var prev = el("button", "at-nb", "‹"), next = el("button", "at-nb", "›");
    prev.type = next.type = "button";
    prev.setAttribute("aria-label", "Previous school day");
    next.setAttribute("aria-label", "Next school day");
    var inp = dateInput(ST.day, function (d) { ST.day = d; change(); });
    prev.addEventListener("click", function () { ST.day = nextWeekday(ST.day, -1); change(); });
    next.addEventListener("click", function () { ST.day = nextWeekday(ST.day, 1); change(); });
    var tdy = button("Today", "at-link", function () { ST.day = lastSchoolDay(); change(); });
    nav.appendChild(prev); nav.appendChild(inp); nav.appendChild(next); nav.appendChild(tdy);
    return nav;
  }

  /* ============================================================== Main */
  function drawMain(pg) {
    var run = RUN, slot = pg.slot;
    slot.innerHTML = "";
    mainTools(pg);
    var bar = el("div", "at-bar");
    slot.appendChild(bar);
    var again = function () { render(pg); };
    bar.appendChild(dateNav(again));
    var body = el("div");
    slot.appendChild(body);
    var node = K.loading(body, "registers");

    Promise.all([K.loadSchool(), AT.review(ST.day, ST.day), loadSettings()]).then(function (r) {
      if (run !== RUN) return;
      node.remove();
      var d = r[0], rev = r[1], set = r[2];
      takeCalendar(rev.calendar); SECT = rev.sections || {};
      bar.appendChild(finder(d, function (s) { ST.studentId = s.id; pg.go("student"); }));

      var closed = closedName(ST.day, set), future = ST.day > today();
      var expectedDay = !weekend(ST.day) && !closed && !future;
      var title = el("div", "at-day");
      title.innerHTML = "<b>" + esc(longLabel(ST.day)) + "</b>" +
        (closed ? "<span>" + esc(closed) + " — no school</span>" : weekend(ST.day) ? "<span>No school — a weekend</span>" :
         future ? "<span>This day has not come yet</span>" : "");
      body.appendChild(title);

      var cov = {};
      rev.coverage.forEach(function (c) { cov[c.courseId] = c; });
      var rows = d.courses.filter(function (c) { return c.students > 0 || cov[c.id]; })
        .map(function (c) {
          var cv = cov[c.id] || null, want = expected(c, ST.day);
          return { c: c, cv: cv, want: want, part: !!cv && cv.n < want, meet: meetsOn(c.id, ST.day) };
        })
        .sort(function (a, b) {
          return (a.cv && !a.part ? 1 : 0) - (b.cv && !b.part ? 1 : 0) || String(a.c.title).localeCompare(String(b.c.title));
        });

      var sum = { n: 0, away: 0, late: 0 };
      rows.forEach(function (x) {
        if (!x.cv) return;
        sum.n += x.cv.n; sum.late += x.cv.late; sum.away += x.cv.away;
      });
      var owed = rows.filter(function (x) { return x.meet || x.cv; });   // a register nobody owes today is not counted against anyone
      var taken = owed.filter(function (x) { return x.cv && !x.part; }).length;
      var open = expectedDay ? owed.length - taken : 0;
      var pct = sum.n ? Math.round((sum.n - sum.away) / sum.n * 100) : null;
      var metrics = K.cxMetrics(body, [
        { label: "In class", value: pct, unit: "%", line: pct },
        { label: "Away", value: taken ? sum.away : null, note: taken ? "absent, excused or cut" : "no register taken" },
        { label: "Late", value: taken ? sum.late : null },
        { label: "Registers taken", value: taken, unit: " of " + owed.length, line: owed.length ? taken / owed.length * 100 : 0,
          note: expectedDay ? (open ? open + (ST.day < today() ? " not taken" : " still to take") : owed.length ? "all taken" : "") : "" },
        { label: "Often away", value: null, note: "reading…" }
      ]);

      // The register list, with the three views of it.
      var filters = [{ k: "all", name: "All", n: rows.length }, { k: "open", name: "Not taken", n: open }, { k: "done", name: "Taken", n: taken }];
      var chips = K.cnFilters(filters, ST.filter, function (k) { ST.filter = k; chips.mark(k); paint(); });
      var fbar = el("div", "cx-bar");
      fbar.appendChild(chips);
      body.appendChild(fbar);
      var listSlot = el("div");
      body.appendChild(listSlot);

      function paint() {
        listSlot.innerHTML = "";
        var shown = rows.filter(function (x) {
          return ST.filter === "open" ? (!x.cv || x.part) && expectedDay && x.meet : ST.filter === "done" ? !!x.cv && !x.part : true;
        });
        if (!rows.length) { listSlot.appendChild(K.cnEmpty("No courses with students yet.", "A register is taken for a course. Enrol students in a course and it appears here.")); return; }
        if (!shown.length) { listSlot.appendChild(K.cnEmpty(ST.filter === "open" ? "Every register is taken." : "No register has been taken yet.", "")); return; }
        var t = K.cnTable([{ label: "Course", w: "minmax(180px, 1.5fr)" }, { label: "Teacher", w: "minmax(140px, 1.2fr)" },
          { label: "Here", w: "70px", align: "right" }, { label: "Away", w: "70px", align: "right" }, { label: "Late", w: "70px", align: "right" },
          { label: "Register", w: "minmax(170px, 1fr)" }]);
        shown.forEach(function (x) {
          var cv = x.cv, c = x.c;
          t.row(["<b>" + esc(c.title) + "</b><span class='cn-sub2'>" + plural(c.students, "student") + "</span>",
                 c.teachers.length ? esc(names(c.teachers)) : K.cxNone("No teacher assigned"),
                 cv ? String(cv.here) : K.cxNone(),
                 cv ? (cv.away ? "<b class='cn-mk'>" + cv.away + "</b>" : "0") : K.cxNone(),
                 cv ? String(cv.late) : K.cxNone(),
                 cv && x.part ? pill("orange", "Marked " + cv.n + " of " + x.want) + (cv.byName ? "<span class='cn-sub2'>" + esc(cv.byName) + "</span>" : "")
                 : cv ? "Taken " + esc(clock(cv.at)) + (cv.byName ? "<span class='cn-sub2'>" + esc(cv.byName) + "</span>" : "")
                    : !x.meet && expectedDay ? K.cxNone("Does not meet") : expectedDay ? pill("orange", "Not taken") : K.cxNone(future ? "Not yet" : "No school")],
            function () { openRegister(c, ST.day, function () { render(pg); }); }, c.id);
        });
        listSlot.appendChild(t);
        listSlot.appendChild(el("p", "cx-note", "Open a course to see its register and correct it."));
      }
      paint();
      secondary(pg, body, metrics, d, run);
    }, function (e) { if (run === RUN) K.failed(node, e, function () { render(pg); }); });
  }

  /* The last four weeks, and who is away the most — read once the page is up. */
  function secondary(pg, body, metrics, d, run) {
    K.loadAttendance(STALE).then(function (A) {
      STALE = false;
      if (run !== RUN) return;
      var often = d.students.filter(function (s) { return K.awayFlag(A.byStudent[s.id]); }).length;
      K.cxSetMetric(metrics, 4, { label: "Often away", value: often, bad: true, note: "a tenth of classes or more",
        go: function () { K.S.watch = "away"; K.openAdmin(false, "support"); } });
      var grid = el("div", "cx-grid");
      body.appendChild(grid);
      var ch = K.cxSection(grid, "cx-s12", "Classes missed", "the last " + A.days.length + " school days");
      var perDay = A.days.map(function (x) {
        var b = A.byDay[x];
        return { label: String(parse(x).getDate()), n: b.away, title: label(x) + " — " + b.away + " of " + b.rows, color: "var(--cx-bar)" };
      });
      var away = perDay.reduce(function (a, b) { return a + b.n; }, 0), rowsN = A.days.reduce(function (a, x) { return a + A.byDay[x].rows; }, 0);
      ch.appendChild(el("div", "cx-big", "<b>" + away + "</b><span>" + (rowsN ? "of " + rowsN + " class entries (" + Math.round(away / rowsN * 100) + "%)" : "no registers yet") + "</span>"));
      ch.appendChild(K.barChart(perDay, { wide: true }));

      var most = d.students.map(function (s) { return { s: s, a: A.byStudent[s.id] }; })
        .filter(function (x) { return x.a && (x.a.away || x.a.late); })
        .sort(function (p, q) { return q.a.away - p.a.away || q.a.late - p.a.late; }).slice(0, 10);
      var mo = K.cxSection(grid, "cx-s12", "Away the most", "classes missed over " + A.days.length + " school days");
      if (!most.length) mo.appendChild(el("p", "cx-note", "Nobody has missed a class."));
      else {
        var tb = K.cnTable([{ label: "Student", w: "minmax(160px, 1.4fr)" }, { label: "Missed", w: "80px", align: "right" }, { label: "Late", w: "70px", align: "right" },
                            { label: "Rate", w: "70px", align: "right" }, { label: "Last away", w: "minmax(110px, 1fr)" }]);
        most.forEach(function (x) {
          var rate = x.a.n ? Math.round(x.a.away / x.a.n * 100) : 0;
          tb.row([K.cxWho(x.s), "<b class='cn-mk" + (K.awayFlag(x.a) ? " bad" : "") + "'>" + x.a.away + "</b>", String(x.a.late), rate + "%",
                  x.a.lastAway ? esc(label(x.a.lastAway)) : K.cxNone()],
            function () { ST.studentId = x.s.id; pg.go("student"); }, x.s.id);
        });
        mo.appendChild(tb);
      }
      [].forEach.call(grid.children, function (c, k) { c.style.setProperty("--i", k); });
    }, function () {
      if (run === RUN) K.cxSetMetric(metrics, 4, { label: "Often away", value: null, note: "not readable" });
    });
  }

  /* ========================================================== A register
     One course on one date. Everyone starts present; mark who isn't, and
     leave a comment where it helps ("sick", "field trip"). */
  function openRegister(c, day, done) {
    var roster = (c.book && c.book.students) || [];
    var box = el("div", "as-sheet");
    box.appendChild(el("h2", "as-h", esc(c.title)));
    var sub = el("p", "cx-note", esc(longLabel(day)) + " · reading the register…");
    box.appendChild(sub);
    var list = el("div", "cx-reg at-reg");
    box.appendChild(list);
    var foot = el("div", "cx-regfoot");
    box.appendChild(foot);
    var sheet = K.cxSheet(box);

    AT.list({ courseId: c.id, day: day }).then(function (rows) {
      var have = {}, st = {}, nt = {};
      rows.forEach(function (r) { have[r.accountId] = r; });
      roster.forEach(function (s) {
        var h = have[s.id];
        st[s.id] = h ? h.status : FIRST;
        nt[s.id] = h && h.note ? h.note : "";
      });
      var staff = K.isAdmin(), held = {};
      // A mark the office set stays the office's: a teacher can read it, not change it.
      if (!staff) roster.forEach(function (s) { if (CODE[st[s.id]] && CODE[st[s.id]].adminOnly) held[s.id] = true; });
      var future = day > today();
      var closed = !staff && LOCKDAYS != null && (future || day < add(today(), -LOCKDAYS));
      sub.innerHTML = esc(longLabel(day)) + " · " + (future ? "This day has not come yet, so a register cannot be taken."
        : closed ? "The office has closed this day to teachers. Ask them to correct it."
        : rows.length ? "Correcting a register that was already taken." : "Everyone starts " + esc(nameOf(FIRST).toLowerCase()) + ". Mark who isn’t.");
      var tally = el("span", "cx-note");
      function count() {
        var n = {};
        ALL.forEach(function (x) { n[x.k] = 0; });
        roster.forEach(function (s) { n[st[s.id]] = (n[st[s.id]] || 0) + 1; });
        tally.textContent = ALL.filter(function (x) { return n[x.k]; }).map(function (x) { return n[x.k] + " " + x.name.toLowerCase(); }).join(" · ");
      }
      roster.forEach(function (s) {
        var row = el("div", "at-regrow");
        var top = el("div", "cx-regrow");
        top.appendChild(K.cxWho(s));
        var right = el("div", "at-regright");
        var sg = el("div", "cn-seg");
        var choices = CODES.slice();
        if (CODE[st[s.id]] && CODE[st[s.id]].retired) choices.push(CODE[st[s.id]]);   // a code since retired still shows on the marks that have it
        choices.forEach(function (m) {
          var b = el("button", "cn-segb" + (st[s.id] === m.k ? " on" : ""), esc(m.name));
          b.type = "button";
          if (held[s.id] || (!staff && m.adminOnly && st[s.id] !== m.k)) { b.disabled = true; b.title = "Set by the office"; }
          b.addEventListener("click", function () {
            st[s.id] = m.k;
            [].forEach.call(sg.children, function (x) { x.classList.toggle("on", x === b); });
            count();
          });
          sg.appendChild(b);
        });
        right.appendChild(sg);
        var nb = el("button", "at-notebtn" + (nt[s.id] ? " has" : ""), "Note");
        nb.type = "button";
        nb.title = "A comment shown to families when attendance is online";
        var ni = el("input", "at-noteinput");
        ni.type = "text"; ni.maxLength = 300; ni.value = nt[s.id]; ni.hidden = !nt[s.id];
        ni.placeholder = "Comment: sick, field trip, bereavement…";
        ni.addEventListener("input", function () { nt[s.id] = ni.value; nb.classList.toggle("has", !!ni.value.trim()); });
        nb.addEventListener("click", function () { ni.hidden = !ni.hidden; if (!ni.hidden) ni.focus(); });
        right.appendChild(nb);
        top.appendChild(right);
        row.appendChild(top);
        row.appendChild(ni);
        list.appendChild(row);
      });
      if (!roster.length) list.appendChild(el("p", "cx-note", "Nobody is enrolled in this course yet."));

      foot.appendChild(tally);
      var acts = el("div", "at-acts");
      var all = button("Everyone " + nameOf(FIRST).toLowerCase(), "en-btn quiet", function () {
        roster.forEach(function (s) { if (!held[s.id]) st[s.id] = FIRST; });
        [].forEach.call(list.querySelectorAll(".cn-seg"), function (g) {
          [].forEach.call(g.children, function (b, k) { b.classList.toggle("on", k === 0); });
        });
        count();
      });
      var save = button("Save register", "en-btn strong", function () {
        save.disabled = true;
        AT.put(day, c.id, roster.map(function (s) { var n = nt[s.id].trim(); return { accountId: s.id, status: st[s.id], note: n || null }; }), "register")
          .then(function () { toast("Register saved"); STALE = true; sheet.close(); if (done) done(); },
                function (e) { save.disabled = false; toast(e && e.message ? e.message : "The register could not be saved."); });
      });
      save.disabled = !roster.length || future || closed;
      acts.appendChild(all); acts.appendChild(save);
      foot.appendChild(acts);
      count();
    }, function (e) { sub.textContent = e && e.message ? e.message : "The register could not be read."; });
  }

  /* ========================================================= One student
     Courses down, days across. A mark is a button: click it to go present →
     absent → late; pick a code in the legend and every mark or date you click
     takes it; click a date and then a code to set the whole day. A mark with
     a comment never changes on a plain click, so reading it cannot alter it. */
  function drawStudent(pg) {
    var run = RUN, slot = pg.slot;
    slot.innerHTML = "";
    doneTools(pg);
    var bar = el("div", "at-bar");
    slot.appendChild(bar);
    var body = el("div");
    slot.appendChild(body);
    var node = K.loading(body, "attendance");

    Promise.all([K.loadSchool(), loadSettings(), loadPeriods()]).then(function (r) {
      if (run !== RUN) return;
      var d = r[0], set = r[1], periods = r[2];
      var s = schoolOf(d, ST.studentId);
      bar.appendChild(finder(d, function (x) { ST.studentId = x.id; render(pg); }));
      if (!s) { node.remove(); body.appendChild(K.cnEmpty("Choose a student.", "Search above, or open one from the main view.")); return; }

      // The weeks on screen, and the marking period the totals are read over.
      var weeks = ST.weeks, start = add(mondayOf(ST.day), -7 * (weeks - 1)), days = [];
      for (var w = 0; w < weeks; w++) for (var k = 0; k < 5; k++) days.push(add(start, w * 7 + k));
      var per = totalsPeriod(periods, ST.day);
      var from = days[0] < per.from ? days[0] : per.from, to = days[days.length - 1] > per.to ? days[days.length - 1] : per.to;

      AT.list({ accountId: s.id, from: from, to: to }).then(function (rows) {
        if (run !== RUN) return;
        node.remove();
        var M = {};
        rows.forEach(function (x) { if (x.courseId) M[x.courseId + "|" + x.day] = { status: x.status, note: x.note || "" }; });
        var courses = (s.courses || []).map(function (c) { return { id: c.courseId, title: c.title }; });
        rows.forEach(function (x) {
          if (x.courseId && !courses.some(function (c) { return c.id === x.courseId; })) {
            var cc = courseOf(d, x.courseId);
            courses.push({ id: x.courseId, title: cc ? cc.title : "A course the student left" });
          }
        });
        courses.sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
        studentGrid(pg, body, { d: d, s: s, set: set, M: M, courses: courses, days: days, per: per, periods: periods, run: run });
      }, function (e) { if (run === RUN) K.failed(node, e, function () { render(pg); }); });
    }, function (e) { if (run === RUN) K.failed(node, e, function () { render(pg); }); });
  }

  /* The period the totals cover: the one chosen, else the one the date is in,
     else the school year. */
  function totalsPeriod(periods, day) {
    var y = +day.slice(0, 4), m = +day.slice(5, 7), sy = m >= 8 ? y : y - 1;
    var year = { id: "year", name: "School year", from: sy + "-08-01", to: (sy + 1) + "-07-31" };
    var list = periods.map(function (p) { return { id: p.id, name: p.name, from: p.startsOn, to: p.endsOn }; });
    var pick = ST.period === "year" ? year : list.filter(function (p) { return p.id === ST.period; })[0];
    if (!pick && ST.period === "auto") pick = list.filter(function (p) { return day >= p.from && day <= p.to; })[0];
    pick = pick || year;
    pick.options = list.concat([year]);
    return pick;
  }

  function studentGrid(pg, body, X) {
    var s = X.s, M = X.M, set = X.set, brush = { code: null, note: "" }, SEL = {};
    var head = el("div", "at-who");
    head.appendChild(K.cxWho(s));
    var meta = el("div", "at-meta");
    var perSel = el("select", "cx-select");
    perSel.setAttribute("aria-label", "Totals for");
    X.per.options.forEach(function (p) {
      var o = el("option");
      o.value = p.id; o.textContent = p.name + " · " + label(p.from) + " – " + label(p.to);
      if (p.id === X.per.id) o.selected = true;
      perSel.appendChild(o);
    });
    perSel.addEventListener("change", function () { ST.period = perSel.value; render(pg); });
    var wk = seg([[1, "1 week"], [2, "2 weeks"], [4, "4 weeks"], [8, "8 weeks"]], ST.weeks, function (n) { ST.weeks = +n; render(pg); });
    var back = button("‹", "at-nb", function () { ST.day = add(ST.day, -7); render(pg); });
    var fwd = button("›", "at-nb", function () { ST.day = add(ST.day, 7); render(pg); });
    back.setAttribute("aria-label", "Earlier week"); fwd.setAttribute("aria-label", "Later week");
    meta.appendChild(back); meta.appendChild(wk); meta.appendChild(fwd);
    meta.appendChild(el("span", "at-metalab", "Totals for"));
    meta.appendChild(perSel);
    head.appendChild(meta);
    body.appendChild(head);

    var wrap = el("div", "at-wrap");
    body.appendChild(wrap);
    var main = el("div", "at-main");
    wrap.appendChild(main);
    var legend = el("aside", "at-legend");
    wrap.appendChild(legend);

    /* ---- the grid */
    var tbl = el("table", "at-grid");
    var thead = el("thead"), hw = el("tr"), hd = el("tr");
    hw.appendChild(el("th"));
    hd.appendChild(el("th", "at-course"));
    var cellsByDay = {};
    X.days.forEach(function (day, i) {
      if (i % 5 === 0) {
        var wl = el("th", "at-wk", "Week of " + parse(day).getDate() + " " + MON[parse(day).getMonth()]);
        wl.colSpan = 5;
        hw.appendChild(wl);
      }
      var th = el("th", i % 5 === 0 ? "at-wk0" : "");
      var off = !schoolDay(day, set);
      var hb = el("button", "at-dayh" + (day === today() ? " today" : "") + (off ? " off" : ""));
      hb.type = "button";
      hb.innerHTML = "<span>" + DOW[dow(day)].slice(0, 2) + "</span><b>" + parse(day).getDate() + "</b>";
      hb.title = off ? (closedName(day, set) || "A weekend") : label(day);
      hb.dataset.day = day;
      hb.addEventListener("click", function () {
        if (brush.code) { setDay(day, brush.code, brush.note); return; }
        SEL[day] = !SEL[day];
        hb.classList.toggle("on", !!SEL[day]);
        (cellsByDay[day] || []).forEach(function (c) { c.classList.toggle("sel", !!SEL[day]); });
      });
      th.appendChild(hb);
      hd.appendChild(th);
    });
    var thT = el("th", "at-wk", esc(X.per.name));
    thT.colSpan = 2;
    hw.appendChild(thT);
    var thA = el("th", "at-n", "Abs"), thL = el("th", "at-n", "Late");
    thA.title = thL.title = "Over " + X.per.name + " — excused and unexcused alike";
    hd.appendChild(thA); hd.appendChild(thL);
    thead.appendChild(hw);
    thead.appendChild(hd);
    tbl.appendChild(thead);

    var tbody = el("tbody");
    var cellOf = {}, totA = {}, totL = {};
    X.courses.forEach(function (c) {
      var tr = el("tr");
      var cn = el("th", "at-course");
      var cc = courseOf(X.d, c.id);
      cn.innerHTML = "<b>" + esc(c.title) + "</b>" + (cc && cc.teachers.length ? "<span>" + esc(names(cc.teachers)) + "</span>" : "");
      tr.appendChild(cn);
      X.days.forEach(function (day, i) {
        var td = el("td", i % 5 === 0 ? "at-wk0" : "");
        var b = el("button", "at-cell");
        b.type = "button";
        b.dataset.course = c.id; b.dataset.day = day;
        if (!schoolDay(day, set)) { b.disabled = true; b.classList.add("off"); }
        b.addEventListener("click", function () { onCell(c.id, day); });
        cellOf[c.id + "|" + day] = b;
        (cellsByDay[day] = cellsByDay[day] || []).push(b);
        paint(c.id, day);
        td.appendChild(b);
        tr.appendChild(td);
      });
      totA[c.id] = el("td", "at-n"); totL[c.id] = el("td", "at-n");
      tr.appendChild(totA[c.id]); tr.appendChild(totL[c.id]);
      tbody.appendChild(tr);
    });
    var allRow = el("tr", "at-all");
    var allName = el("th", "at-course", "<b>All courses</b>");
    allRow.appendChild(allName);
    var allCell = el("td", "at-allnote");
    allCell.colSpan = X.days.length;
    allRow.appendChild(allCell);
    var allA = el("td", "at-n"), allL = el("td", "at-n");
    allRow.appendChild(allA); allRow.appendChild(allL);
    tbody.appendChild(allRow);
    tbl.appendChild(tbody);
    if (!X.courses.length) main.appendChild(K.cnEmpty("Not in any course.", "A register is taken for a course. Enrol " + (s.firstName || s.name) + " in one and their marks appear here."));
    else main.appendChild(tbl);
    main.appendChild(el("p", "cx-note", "Totals are over " + esc(X.per.name) + " (" + esc(label(X.per.from)) + " – " + esc(label(X.per.to)) +
      "), which is not the same as the weeks on screen. Abs counts excused and unexcused alike."));

    function paint(courseId, day) {
      var b = cellOf[courseId + "|" + day];
      if (!b) return;
      var m = M[courseId + "|" + day];
      b.className = "at-cell" + (m ? " s-" + kindOf(m.status) : " s-none") + (m && m.note ? " has-note" : "") + (b.disabled ? " off" : "") + (SEL[day] ? " sel" : "");
      b.textContent = m ? (CODE[m.status] ? CODE[m.status].ch : "?") : "·";
      b.title = (m ? nameOf(m.status) : "No register") + (m && m.note ? " — " + m.note : "");
      b.setAttribute("aria-label", label(day) + ", " + b.title);
    }
    function totals() {
      var A = 0, L = 0;
      X.courses.forEach(function (c) {
        var a = 0, l = 0;
        Object.keys(M).forEach(function (key) {
          var p = key.split("|");
          if (p[0] !== c.id || p[1] < X.per.from || p[1] > X.per.to) return;
          if (isAway(M[key].status)) a++;
          if (isLate(M[key].status)) l++;
        });
        A += a; L += l;
        totA[c.id].innerHTML = a ? "<b class='cn-mk'>" + a + "</b>" : "0";
        totL[c.id].textContent = String(l);
      });
      allA.innerHTML = A ? "<b class='cn-mk'>" + A + "</b>" : "0";
      allL.textContent = String(L);
    }
    totals();

    /* ---- changing marks */
    function save(courseId, day, status, note) {
      var key = courseId + "|" + day, before = M[key];
      var keep = note || (before && before.note) || "";
      M[key] = { status: status, note: keep };
      paint(courseId, day); totals();
      return AT.put(day, courseId, [{ accountId: s.id, status: status, note: keep || null }], "student").then(function () {
        STALE = true;
      }, function (e) {
        if (before) M[key] = before; else delete M[key];
        paint(courseId, day); totals();
        toast(e && e.message ? e.message : "That change was not saved.");
      });
    }
    function onCell(courseId, day) {
      var cur = M[courseId + "|" + day];
      if (brush.code) { save(courseId, day, brush.code, brush.note.trim()); return; }
      if (cur && cur.note) { openNote(courseId, day, cur); return; }
      save(courseId, day, cycle(cur ? cur.status : FIRST), "");
    }
    function setDay(day, status, note) {
      Promise.all(X.courses.map(function (c) { return save(c.id, day, status, (note || "").trim()); })).then(function () {
        toast(label(day) + ": " + nameOf(status).toLowerCase() + " in " + plural(X.courses.length, "course"));
      });
    }
    function openNote(courseId, day, cur) {
      var c = X.courses.filter(function (x) { return x.id === courseId; })[0];
      var box = el("div", "as-sheet");
      box.appendChild(el("h2", "as-h", esc(c ? c.title : "Course")));
      box.appendChild(el("p", "cx-note", esc(longLabel(day)) + " · " + esc(nameOf(cur.status))));
      var inp = el("textarea", "at-notearea");
      inp.rows = 3; inp.maxLength = 300; inp.value = cur.note;
      box.appendChild(inp);
      var codes = el("div", "at-notecodes");
      var chosen = cur.status;
      CODES.concat(CODE[cur.status] && CODE[cur.status].retired ? [CODE[cur.status]] : []).forEach(function (m) {
        if (!K.isAdmin() && m.adminOnly && m.k !== cur.status) return;
        var b = el("button", "at-code" + (chosen === m.k ? " on" : ""), "<i class='s-" + m.kind + "'>" + esc(m.ch) + "</i>" + esc(m.name));
        b.type = "button";
        b.addEventListener("click", function () {
          chosen = m.k;
          [].forEach.call(codes.children, function (x) { x.classList.toggle("on", x === b); });
        });
        codes.appendChild(b);
      });
      box.appendChild(codes);
      var acts = el("div", "at-acts");
      var sheet;
      acts.appendChild(button("Remove comment", "en-btn quiet", function () { M[courseId + "|" + day] = { status: chosen, note: "" }; commit(""); }));
      acts.appendChild(button("Save", "en-btn strong", function () { commit(inp.value.trim()); }));
      function commit(text) {
        sheet.close();
        var key = courseId + "|" + day, before = M[key];
        M[key] = { status: chosen, note: text };
        paint(courseId, day); totals();
        AT.put(day, courseId, [{ accountId: s.id, status: chosen, note: text || null }], "student").then(function () { STALE = true; toast("Saved"); },
          function (e) { M[key] = before || { status: cur.status, note: cur.note }; paint(courseId, day); totals(); toast(e && e.message ? e.message : "That change was not saved."); });
      }
      box.appendChild(acts);
      sheet = K.cxSheet(box);
      inp.focus();
    }

    /* ---- the legend */
    legend.appendChild(el("h3", null, "Marks"));
    var codeBtns = {};
    CODES.forEach(function (m) {
      var b = el("button", "at-code", "<i class='s-" + m.kind + "'>" + esc(m.ch) + "</i>" + esc(m.name));
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      if (!K.isAdmin() && m.adminOnly) { b.disabled = true; b.title = "Set by the office"; }
      b.addEventListener("click", function () { pickCode(m.k); });
      codeBtns[m.k] = b;
      legend.appendChild(b);
    });
    var cin = el("input", "at-noteinput");
    cin.type = "text"; cin.maxLength = 300;
    cin.placeholder = "Comment for the marks you set";
    cin.addEventListener("input", function () { brush.note = cin.value; });
    legend.appendChild(field("Comment", cin, "Shown to families when attendance is online."));
    var how = el("ul", "at-how");
    how.innerHTML = "<li>Click a mark to switch it: present, absent, late.</li><li>Pick a mark here, then click marks or a date to set it.</li>" +
      "<li>Click a date, then a mark here, to set the whole day.</li><li>A mark with a comment opens the comment instead of changing.</li>";
    legend.appendChild(how);
    function pickCode(k) {
      var picked = Object.keys(SEL).filter(function (x) { return SEL[x]; });
      if (picked.length) {
        picked.forEach(function (day) { setDay(day, k, brush.note); });
        SEL = {};
        [].forEach.call(tbl.querySelectorAll(".sel, .at-dayh.on"), function (n) { n.classList.remove("sel", "on"); });
        brush.note = cin.value = "";   // a comment belongs to the marks it was set with, not the next ones
        return;
      }
      brush.code = brush.code === k ? null : k;
      if (!brush.code) brush.note = cin.value = "";
      CODES.forEach(function (m) {
        codeBtns[m.k].classList.toggle("on", brush.code === m.k);
        codeBtns[m.k].setAttribute("aria-pressed", brush.code === m.k ? "true" : "false");
      });
      tbl.classList.toggle("armed", !!brush.code);
    }

    /* ---- the tools */
    var acts = el("div", "at-who-acts");
    acts.appendChild(K.cnAction("Print report", function () { printReport(); }));
    acts.appendChild(K.cnAction("Student 360", function () { K.openStudent360(s, "attendance"); }));
    head.appendChild(acts);

    function printReport() {
      var rows = [], a = 0, l = 0;
      X.courses.forEach(function (c) {
        var ca = 0, cl = 0;
        Object.keys(M).forEach(function (key) {
          var p = key.split("|");
          if (p[0] !== c.id || p[1] < X.per.from || p[1] > X.per.to) return;
          if (isAway(M[key].status)) ca++;
          if (isLate(M[key].status)) cl++;
        });
        a += ca; l += cl;
        rows.push([c.title, String(ca), String(cl)]);
      });
      var marks = [];
      Object.keys(M).forEach(function (key) {
        var p = key.split("|"), m = M[key];
        if (p[1] < X.per.from || p[1] > X.per.to || kindOf(m.status) === "present") return;
        var c = X.courses.filter(function (x) { return x.id === p[0]; })[0];
        marks.push([p[1], label(p[1]), c ? c.title : "", nameOf(m.status), m.note]);
      });
      marks.sort(function (x, y) { return x[0] < y[0] ? -1 : 1; });
      K.cxPrint("Attendance — " + s.name,
        "<section class='page'>" + K.printHead("Individual attendance report", s.name + " · " + X.per.name + " (" + label(X.per.from) + " – " + label(X.per.to) + ")") +
        K.printTable([{ t: "Course" }, { t: "Absent", r: 1 }, { t: "Late", r: 1 }], rows.concat([["All courses", String(a), String(l)]])) +
        "<h2>Absences and lates</h2>" +
        (marks.length ? K.printTable([{ t: "Date" }, { t: "Course" }, { t: "Mark" }, { t: "Comment" }], marks.map(function (m) { return m.slice(1); }))
                      : "<p class='muted'>None in this period.</p>") +
        "<p class='foot'>Absent counts excused and unexcused alike.</p></section>");
    }
  }

  /* ========================================================== Bulk edit
     Excuse a group for a date or a run of dates: a course, a grade level or a
     program, for the courses ticked, with one code and one comment. Only
     students who are in a course get a mark for it. */
  var PROGRAMS = [["iep", "IEP"], ["supports", "Supports"], ["pathways", "Pathways"]];

  function drawBulk(pg) {
    var run = RUN, slot = pg.slot;
    slot.innerHTML = "";
    doneTools(pg);
    heading(slot, "Bulk edit", "Set one mark for a whole group on a date — a planned trip, a closure for one grade, an assembly. Existing marks for those students are replaced, and each change is kept in the audit log.");
    var body = el("div");
    slot.appendChild(body);
    var node = K.loading(body, "students and courses");
    Promise.all([K.loadSchool(), loadSettings()]).then(function (r) {
      if (run !== RUN) return;
      node.remove();
      var d = r[0], set = r[1];
      var B = ST.bulk = ST.bulk || { kind: "course", key: null, from: ST.day, to: ST.day, off: {}, code: firstOfKind("excused"), note: "" };
      var recs = null, fams = null;
      var form = el("div", "at-form");
      body.appendChild(form);

      function groupOptions() {
        if (B.kind === "course") return d.courses.filter(function (c) { return c.students; })
          .map(function (c) { return [c.id, c.title + " · " + c.students]; });
        if (B.kind === "grade") {
          var g = {};
          d.students.forEach(function (s) { var gl = recs && recs[s.id] && recs[s.id].program && recs[s.id].program.gradeLevel; if (gl) g[gl] = (g[gl] || 0) + 1; });
          return Object.keys(g).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); })
            .map(function (k) { return [k, k + " · " + g[k]]; });
        }
        return PROGRAMS.map(function (p) {
          var n = fams ? d.students.filter(function (s) { return fams[s.id] && fams[s.id].records && fams[s.id].records[p[0]]; }).length : 0;
          return [p[0], p[1] + (fams ? " · " + n : "")];
        });
      }
      function groupStudents() {
        if (!B.key) return [];
        if (B.kind === "course") { var c = courseOf(d, B.key); return c && c.book ? c.book.students || [] : []; }
        if (B.kind === "grade") return d.students.filter(function (s) { return recs && recs[s.id] && recs[s.id].program && recs[s.id].program.gradeLevel === B.key; });
        return d.students.filter(function (s) { return fams && fams[s.id] && fams[s.id].records && fams[s.id].records[B.key]; });
      }
      function datesChosen() {
        if (B.to < B.from) return [];
        return eachDay(B.from, B.to).filter(function (x) { return schoolDay(x, set); }).slice(0, 31);
      }
      /* The marks this would write: for each chosen day and ticked course,
         the group's students who are enrolled in it. */
      function plan() {
        var group = groupStudents(), ids = {};
        group.forEach(function (s) { ids[s.id] = s; });
        var out = [], courseCount = {};
        d.courses.forEach(function (c) {
          var inGroup = ((c.book && c.book.students) || []).filter(function (s) { return ids[s.id]; });
          if (inGroup.length) courseCount[c.id] = { c: c, students: inGroup };
        });
        return { group: group, courses: Object.keys(courseCount).map(function (k) { return courseCount[k]; })
          .sort(function (a, b) { return String(a.c.title).localeCompare(String(b.c.title)); }) };
      }

      function draw() {
        form.innerHTML = "";
        var P = plan(), days = datesChosen();

        // 1 · who
        var s1 = el("section", "at-step");
        s1.appendChild(el("h3", null, "<i>1</i>Who"));
        s1.appendChild(seg([["course", "A course"], ["grade", "A grade level"], ["program", "A program"]], B.kind, function (k) {
          B.kind = k; B.key = null; B.off = {};
          if (k === "grade" && !recs) { loadRecs(); return; }
          if (k === "program" && !fams) { loadFams(); return; }
          draw();
        }));
        var sel = el("select", "cx-select at-select");
        sel.setAttribute("aria-label", "Group");
        var ph = el("option"); ph.value = ""; ph.textContent = B.kind === "course" ? "Choose a course" : B.kind === "grade" ? "Choose a grade level" : "Choose a program";
        sel.appendChild(ph);
        groupOptions().forEach(function (o) {
          var op = el("option"); op.value = o[0]; op.textContent = o[1];
          if (o[0] === B.key) op.selected = true;
          sel.appendChild(op);
        });
        sel.addEventListener("change", function () { B.key = sel.value || null; B.off = {}; draw(); });
        s1.appendChild(sel);
        s1.appendChild(el("p", "cx-note", B.key ? "<b>" + plural(P.group.length, "student") + "</b> in this group." +
          (B.kind === "program" ? " Programs are read from the records the school has entered; a student with none on file is not in the group." : "")
          : B.kind === "grade" ? "Grade levels come from each student’s diploma record." : ""));
        form.appendChild(s1);

        // 2 · when
        var s2 = el("section", "at-step");
        s2.appendChild(el("h3", null, "<i>2</i>When"));
        var wr = el("div", "at-row");
        wr.appendChild(field("From", dateInput(B.from, function (v) { B.from = v; if (B.to < v) B.to = v; draw(); })));
        wr.appendChild(field("To", dateInput(B.to, function (v) { B.to = v; draw(); })));
        s2.appendChild(wr);
        s2.appendChild(el("p", "cx-note", days.length
          ? "<b>" + plural(days.length, "school day") + "</b>: " + esc(days.length > 4 ? label(days[0]) + " – " + label(days[days.length - 1]) : days.map(label).join(", ")) + "."
          : "There is no school day in that range."));
        form.appendChild(s2);

        // 3 · which courses
        var s3 = el("section", "at-step");
        s3.appendChild(el("h3", null, "<i>3</i>Which courses"));
        if (!B.key) s3.appendChild(el("p", "cx-note", "Choose who first."));
        else if (!P.courses.length) s3.appendChild(el("p", "cx-note", "None of these students is enrolled in a course, so there is nothing to mark."));
        else {
          var all = el("div", "at-checks");
          P.courses.forEach(function (x) {
            var l = el("label", "at-check");
            var cb = el("input"); cb.type = "checkbox"; cb.checked = !B.off[x.c.id];
            cb.addEventListener("change", function () { if (cb.checked) delete B.off[x.c.id]; else B.off[x.c.id] = true; draw(); });
            l.appendChild(cb);
            l.appendChild(el("span", null, esc(x.c.title) + "<small>" + plural(x.students.length, "student") + "</small>"));
            all.appendChild(l);
          });
          s3.appendChild(all);
          var every = el("div", "at-linkrow");
          every.appendChild(button("All", "at-link", function () { B.off = {}; draw(); }));
          every.appendChild(button("None", "at-link", function () { P.courses.forEach(function (x) { B.off[x.c.id] = true; }); draw(); }));
          s3.appendChild(every);
        }
        form.appendChild(s3);

        // 4 · the mark
        var s4 = el("section", "at-step");
        s4.appendChild(el("h3", null, "<i>4</i>Mark them"));
        var codes = el("div", "at-notecodes");
        CODES.forEach(function (m) {
          var b = el("button", "at-code" + (B.code === m.k ? " on" : ""), "<i class='s-" + m.kind + "'>" + esc(m.ch) + "</i>" + esc(m.name));
          b.type = "button";
          b.addEventListener("click", function () { B.code = m.k; draw(); });
          codes.appendChild(b);
        });
        s4.appendChild(codes);
        var note = el("input", "at-noteinput");
        note.type = "text"; note.maxLength = 300; note.value = B.note;
        note.placeholder = "Comment: band trip, closure, assembly…";
        note.addEventListener("input", function () { B.note = note.value; });
        s4.appendChild(field("Comment", note, "Shown to families when attendance is online. Left empty, a mark that already has a comment keeps it."));
        form.appendChild(s4);

        // go
        var chosen = P.courses.filter(function (x) { return !B.off[x.c.id]; });
        var marks = chosen.reduce(function (n, x) { return n + x.students.length; }, 0) * days.length;
        var foot = el("div", "at-go");
        var msg = el("span", "cx-note");
        var go = button("Apply " + nameOf(B.code) + " to " + plural(marks, "mark"), "en-btn strong");
        go.disabled = !marks;
        var armed = false;
        msg.innerHTML = marks ? "<b>" + plural(marks, "mark") + "</b> across " + plural(chosen.length, "course") + " and " + plural(days.length, "day") + "." : "";
        go.addEventListener("click", function () {
          if (!armed) { armed = true; go.textContent = "Confirm: " + nameOf(B.code) + " for " + plural(marks, "mark"); return; }
          go.disabled = true;
          msg.textContent = "Saving…";
          applyBulk(chosen, days, function (n, total) { msg.textContent = "Saving " + n + " of " + total + "…"; }).then(function (res) {
            STALE = true;
            ST.day = days[0]; ST.logMode = "day"; ST.logDay = days[0];
            form.innerHTML = "";
            form.appendChild(el("div", "at-done", "<b>" + plural(res.saved, "mark") + " set to " + esc(nameOf(B.code).toLowerCase()) + ".</b>" +
              "<p class='cx-note'>Each is in the audit log with your name and the time.</p>"));
            var a = el("div", "at-acts");
            a.appendChild(button("See the audit log", "en-btn quiet", function () { pg.go("log"); }));
            a.appendChild(button("Another bulk edit", "en-btn strong", function () { ST.bulk = null; render(pg); }));
            form.appendChild(a);
          }, function (e) {
            go.disabled = false; armed = false;
            msg.textContent = (e && e.message) || "Some marks were not saved.";
          });
        });
        foot.appendChild(msg);
        foot.appendChild(go);
        form.appendChild(foot);
      }

      /* Marks are written a course and a day at a time, keeping any comment
         already on a mark when this one carries none. */
      function applyBulk(chosen, days, tick) {
        var jobs = [];
        chosen.forEach(function (x) { days.forEach(function (day) { jobs.push({ x: x, day: day }); }); });
        var from = days[0], to = days[days.length - 1], done = 0, saved = 0;
        return Promise.all(chosen.map(function (x) { return AT.list({ courseId: x.c.id, from: from, to: to }).catch(function () { return []; }); })).then(function (lists) {
          var had = {};
          chosen.forEach(function (x, i) { lists[i].forEach(function (m) { had[x.c.id + "|" + m.day + "|" + m.accountId] = m.note || ""; }); });
          var i = 0, fail = null;
          function next() {
            if (fail) return Promise.reject(fail);
            if (i >= jobs.length) return Promise.resolve({ saved: saved });
            var j = jobs[i++], note = B.note.trim();
            var marks = j.x.students.map(function (s) {
              return { accountId: s.id, status: B.code, note: note || had[j.x.c.id + "|" + j.day + "|" + s.id] || null };
            });
            return AT.put(j.day, j.x.c.id, marks, "bulk").then(function () {
              saved += marks.length; done++; tick(done, jobs.length);
              return next();
            }, function (e) { fail = e; return Promise.reject(e); });
          }
          return next();
        });
      }

      function loadRecs() {
        var tick = K.readingNote(body, "diploma records");
        K.readRecords(d.students, tick).then(function (r) { if (run === RUN) { recs = r; draw(); } });
      }
      function loadFams() {
        var tick = K.readingNote(body, "student records");
        K.readFamilies(d.students, tick).then(function (r) { if (run === RUN) { fams = r; draw(); } });
      }
      if (B.kind === "grade") loadRecs(); else if (B.kind === "program") loadFams(); else draw();
    }, function (e) { if (run === RUN) K.failed(node, e, function () { render(pg); }); });
  }

  /* ========================================================== Audit log */
  function drawLog(pg) {
    var run = RUN, slot = pg.slot;
    slot.innerHTML = "";
    doneTools(pg);
    heading(slot, "Audit log", "Every change to attendance: who made it, when, and what it was before. Look at one date for everybody, or one student for every date.");
    var bar = el("div", "at-bar");
    slot.appendChild(bar);
    var body = el("div");
    slot.appendChild(body);
    if (!ST.logDay) ST.logDay = ST.day;
    var node = K.loading(body, "students");
    K.loadSchool().then(function (d) {
      if (run !== RUN) return;
      node.remove();
      var left = el("div", "at-date");
      left.appendChild(seg([["day", "One date"], ["student", "One student"]], ST.logMode, function (m) { ST.logMode = m; drawLog(pg); }));
      bar.appendChild(left);
      var right = el("div", "at-date");
      var who = ST.logStudent ? schoolOf(d, ST.logStudent) : null;
      if (ST.logMode === "day") {
        right.appendChild(dateInput(ST.logDay, function (v) { ST.logDay = v; load(); }));
      } else {
        right.appendChild(finder(d, function (s) { ST.logStudent = s.id; drawLog(pg); }));
        if (who) right.appendChild(el("span", "at-metalab", esc(who.name)));
        var all = el("label", "at-check");
        var cb = el("input"); cb.type = "checkbox"; cb.checked = ST.logAll;
        cb.addEventListener("change", function () { ST.logAll = cb.checked; drawLog(pg); });
        all.appendChild(cb); all.appendChild(el("span", null, "All dates"));
        right.appendChild(all);
        if (!ST.logAll) right.appendChild(dateInput(ST.logDay, function (v) { ST.logDay = v; load(); }));
      }
      bar.appendChild(right);
      var out = el("div");
      body.appendChild(out);

      function load() {
        out.innerHTML = "";
        if (ST.logMode === "student" && !who) { out.appendChild(K.cnEmpty("Choose a student.", "Search above for the student whose history you want.")); return; }
        var n = K.loading(out, "the log");
        var q = ST.logMode === "day" ? { day: ST.logDay } : ST.logAll ? { accountId: who.id } : { accountId: who.id, day: ST.logDay };
        AT.log(q).then(function (r) {
          if (run !== RUN) return;
          n.remove();
          if (!r.log.length) { out.appendChild(K.cnEmpty("Nothing was changed.", ST.logMode === "day" ? "No mark for " + longLabel(ST.logDay) + " has been written or changed." : "No mark for this student has been written or changed.")); return; }
          var t = K.cnTable([{ label: "Changed", w: "134px" }, { label: "For", w: "76px" }, { label: "Student", w: "minmax(100px, 1fr)" }, { label: "Course", w: "minmax(90px, 1fr)" },
            { label: "Change", w: "minmax(110px, 1fr)" }, { label: "Comment", w: "minmax(90px, 1fr)" }, { label: "By", w: "minmax(80px, 0.8fr)" }, { label: "How", w: "104px" }]);
          r.log.forEach(function (x) {
            var change = x.from == null ? "Marked " + nameOf(x.to)
              : x.to == null ? "Removed (was " + nameOf(x.from) + ")"
              : x.from === x.to ? "Comment changed"
              : nameOf(x.from) + " → " + nameOf(x.to);
            t.row([esc(stamp(x.at)), esc(label(x.day)), "<b>" + esc(x.studentName || "A student") + "</b>", x.courseTitle ? esc(x.courseTitle) : K.cxNone("A course since removed"),
                   esc(change), x.toNote || x.fromNote ? esc(x.toNote || x.fromNote) : K.cxNone(), x.byName ? esc(x.byName) : K.cxNone("Unknown"),
                   esc(VIA[x.via] || x.via)]);
          });
          out.appendChild(t);
          out.appendChild(el("p", "cx-note", r.capped ? "Showing the latest 500 changes. Narrow it to one date to see the rest." : plural(r.log.length, "change") + "."));
        }, function (e) { if (run === RUN) K.failed(n, e, load); });
      }
      load();
    }, function (e) { if (run === RUN) K.failed(node, e, function () { drawLog(pg); }); });
  }

  /* ========================================================= Find errors */
  function drawErrors(pg) {
    var run = RUN, slot = pg.slot;
    slot.innerHTML = "";
    doneTools(pg);
    heading(slot, "Find errors", "Registers nobody took, and marks that look wrong. A flag can be wrong if rosters or dates were changed after the register was taken; where the data looks right, ignore it.");
    var bar = el("div", "at-bar");
    slot.appendChild(bar);
    bar.appendChild(seg([[14, "Last 2 weeks"], [28, "Last 4 weeks"], [56, "Last 8 weeks"]], ST.range, function (n) { ST.range = +n; drawErrors(pg); }));
    var body = el("div");
    slot.appendChild(body);
    var node = K.loading(body, "registers");
    var yesterday = add(today(), -1), from = add(today(), -ST.range);
    Promise.all([K.loadSchool(), AT.review(from, today()), loadSettings()]).then(function (r) {
      if (run !== RUN) return;
      node.remove();
      var d = r[0], rev = r[1], set = r[2];
      takeCalendar(rev.calendar); SECT = rev.sections || {};
      var covered = {};
      rev.coverage.forEach(function (c) { covered[c.courseId + "|" + c.day] = c.n; });

      // Registers not taken, by the teacher whose course it is.
      var byTeacher = {}, totalMissing = 0;
      d.courses.forEach(function (c) {
        if (!c.students || c.status === "archived") return;
        var created = c.raw && c.raw.createdAt ? iso(new Date(c.raw.createdAt)) : from;
        var dates = eachDay(created > from ? created : from, yesterday).filter(function (x) {
          return schoolDay(x, set) && meetsOn(c.id, x) && (covered[c.id + "|" + x] || 0) < expected(c, x);
        });
        if (!dates.length) return;
        totalMissing += dates.length;
        var who = c.teachers.length ? c.teachers : [{ id: "none", name: "No teacher assigned" }];
        who.forEach(function (t) {
          var g = byTeacher[t.id] || (byTeacher[t.id] = { t: t, items: [], n: 0 });
          g.items.push({ c: c, dates: dates }); g.n += dates.length;
        });
      });
      var teachers = Object.keys(byTeacher).map(function (k) { return byTeacher[k]; }).sort(function (a, b) { return b.n - a.n; });

      var problems = rev.problems;
      var notIn = problems.filter(function (p) { return p.kind === "not-enrolled"; });
      var noSchool = problems.filter(function (p) { return p.kind === "no-school"; });
      var disagree = problems.filter(function (p) { return p.kind === "disagree"; });

      K.cxMetrics(body, [
        { label: "Registers not taken", value: totalMissing, bad: true, note: plural(teachers.length, "teacher") },
        { label: "Not in the course", value: notIn.length, bad: true },
        { label: "No school that day", value: noSchool.length, bad: true },
        { label: "Absent here, present there", value: disagree.length, bad: true }
      ]);

      var out = el("div");
      body.appendChild(out);
      var tb = el("div", "at-bar");
      tb.appendChild(button("Print", "en-btn quiet", function () { printErrors(); }));
      tb.appendChild(button("Download CSV", "en-btn quiet", function () { csvErrors(); }));
      out.appendChild(tb);

      var s1 = K.cxSection(out, "cx-s12", "Registers not taken", label(from) + " – " + label(yesterday));
      if (!teachers.length) s1.appendChild(el("p", "cx-note", "Every register was taken on every school day in this span."));
      else s1.appendChild(el("p", "cx-note", "A date with “n of m” has a register with some students unmarked."));
      teachers.forEach(function (g) {
        var blk = el("div", "at-tg");
        blk.appendChild(el("h4", null, esc(g.t.name) + "<small>" + plural(g.n, "register") + " not taken</small>"));
        g.items.forEach(function (it) {
          var row = el("div", "at-tgrow");
          row.appendChild(el("span", "at-tgc", esc(it.c.title)));
          var ds = el("span", "at-tgd");
          it.dates.slice(-12).forEach(function (day) {
            var got = covered[it.c.id + "|" + day];
            ds.appendChild(button(label(day) + (got ? " · " + got + " of " + expected(it.c, day) : ""), "at-chip", function () { openRegister(it.c, day, function () { drawErrors(pg); }); }));
          });
          if (it.dates.length > 12) ds.appendChild(el("span", "cx-note", "and " + (it.dates.length - 12) + " earlier"));
          row.appendChild(ds);
          blk.appendChild(row);
        });
        s1.appendChild(blk);
      });

      var s2 = K.cxSection(out, "cx-s12", "Marks to check", rev.capped ? "the first 200 of each kind" : "");
      if (!problems.length) s2.appendChild(el("p", "cx-note", "No mark looks wrong: every one is for a student in the course, on a school day."));

      function group(title, sub, list, rowFn, bulkLabel, bulkFn) {
        if (!list.length) return;
        var h = el("div", "at-ph");
        h.appendChild(el("h4", null, esc(title) + "<small>" + plural(list.length, "mark") + "</small>"));
        if (bulkFn) h.appendChild(button(bulkLabel, "en-btn quiet", bulkFn));
        s2.appendChild(h);
        s2.appendChild(el("p", "cx-note", esc(sub)));
        var t = K.cnTable([{ label: "Student", w: "minmax(150px, 1.1fr)" }, { label: "Course", w: "minmax(150px, 1.2fr)" }, { label: "Day", w: "100px" },
          { label: "Mark", w: "90px" }, { label: "", w: "minmax(150px, auto)", align: "right" }]);
        list.forEach(function (p) { rowFn(t, p); });
        s2.appendChild(t);
      }
      function removeIds(ids, again) {
        AT.remove(ids).then(function (res) { STALE = true; toast(plural(res.removed, "mark") + " removed. Kept in the audit log."); again(); },
          function (e) { toast(e && e.message ? e.message : "Those marks were not removed."); });
      }
      var rm = function (p) {
        return button("Remove", "en-btn quiet", function () { removeIds([p.id], function () { drawErrors(pg); }); });
      };
      group("Not in the course", "The student is no longer, or was never, enrolled in this course.", notIn, function (t, p) {
        var act = el("span"); act.appendChild(rm(p));
        t.row(["<b>" + esc(p.studentName || "A student") + "</b>", esc(p.courseTitle), esc(label(p.day)), esc(nameOf(p.status)), act]);
      }, "Remove all " + notIn.length, function () { removeIds(notIn.map(function (p) { return p.id; }), function () { drawErrors(pg); }); });

      group("No school that day", "A register was taken on a weekend, a closure or a day that has not come.", noSchool, function (t, p) {
        var act = el("span"); act.appendChild(rm(p));
        t.row(["<b>" + esc(p.studentName || "A student") + "</b>", esc(p.courseTitle) + "<span class='cn-sub2'>" + esc(p.reason) + "</span>", esc(label(p.day)),
               esc(nameOf(p.status)), act]);
      }, "Remove all " + noSchool.length, function () { removeIds(noSchool.map(function (p) { return p.id; }), function () { drawErrors(pg); }); });

      group("Absent in one course, in the room for another", "Marked absent in one course and present or late in another on the same day. Mark the whole day one way, or open the record.", disagree, function (t, p) {
        var act = el("span", "at-acts");
        act.appendChild(button(nameOf(firstOfKind("absent")) + " all day", "en-btn quiet", function () { wholeDay(p, firstOfKind("absent"), function () { drawErrors(pg); }); }));
        act.appendChild(button(nameOf(FIRST) + " all day", "en-btn quiet", function () { wholeDay(p, FIRST, function () { drawErrors(pg); }); }));
        act.appendChild(button("Open", "en-btn quiet", function () { ST.studentId = p.accountId; ST.day = p.day; pg.go("student"); }));
        t.row(["<b>" + esc(p.studentName || "A student") + "</b>",
               "Absent: " + esc(p.absentCourseTitle) + "<span class='cn-sub2'>" + esc(nameOf(p.hereStatus)) + ": " + esc(p.hereCourseTitle) + "</span>",
               esc(label(p.day)), K.cxNone(), act]);
      }, null, null);

      function printErrors() {
        var html = "<section class='page'>" + K.printHead("Attendance errors", label(from) + " – " + label(yesterday));
        html += "<h2>Registers not taken</h2>" + (teachers.length ? K.printTable([{ t: "Teacher" }, { t: "Course" }, { t: "Dates" }],
          teachers.reduce(function (rows, g) {
            g.items.forEach(function (it) { rows.push([g.t.name, it.c.title, it.dates.map(label).join(", ")]); });
            return rows;
          }, [])) : "<p class='muted'>None.</p>");
        html += "<h2>Marks to check</h2>" + (problems.length ? K.printTable([{ t: "What" }, { t: "Student" }, { t: "Course" }, { t: "Day" }],
          problems.map(function (p) {
            return [p.kind === "not-enrolled" ? "Not in the course" : p.kind === "no-school" ? "No school: " + p.reason : "Absent here, present there",
                    p.studentName || "", p.courseTitle || p.absentCourseTitle || "", label(p.day)];
          })) : "<p class='muted'>None.</p>");
        K.cxPrint("Attendance errors", html + "</section>");
      }
      function csvErrors() {
        var rows = [["What", "Teacher", "Student", "Course", "Day"]];
        teachers.forEach(function (g) { g.items.forEach(function (it) { it.dates.forEach(function (day) { rows.push(["Register not taken", g.t.name, "", it.c.title, day]); }); }); });
        problems.forEach(function (p) {
          rows.push([p.kind === "not-enrolled" ? "Not in the course" : p.kind === "no-school" ? "No school: " + p.reason : "Absent here, present there",
                     "", p.studentName || "", p.courseTitle || p.absentCourseTitle || "", p.day]);
        });
        K.csvDownload("attendance-errors.csv", rows);
      }
    }, function (e) { if (run === RUN) K.failed(node, e, function () { drawErrors(pg); }); });
  }

  /* A student's whole day one way, in every course they have a mark in that
     day, keeping each comment. */
  function wholeDay(p, status, done) {
    AT.list({ accountId: p.accountId, day: p.day }).then(function (rows) {
      var by = {};
      rows.forEach(function (r) { if (r.courseId) (by[r.courseId] = by[r.courseId] || []).push(r); });
      return Promise.all(Object.keys(by).map(function (cid) {
        return AT.put(p.day, cid, by[cid].map(function (r) { return { accountId: r.accountId, status: status, note: r.note || null }; }), "fix");
      }));
    }).then(function () { STALE = true; toast("Set to " + nameOf(status).toLowerCase() + " for the whole day"); done(); },
            function (e) { toast(e && e.message ? e.message : "That was not saved."); });
  }

  /* ============================================ Average daily attendance */
  function drawAda(pg) {
    var run = RUN, slot = pg.slot;
    slot.innerHTML = "";
    doneTools(pg);
    heading(slot, "Average daily attendance",
      "What share of the students who should be in school were, school day by school day. A student counts for a whole day, a half or nothing, by the minutes they were in the room.");
    if (!ST.adaFrom) { ST.adaTo = lastSchoolDay(); ST.adaFrom = add(ST.adaTo, -27); }
    var bar = el("div", "at-bar");
    slot.appendChild(bar);
    var inputs = el("div", "at-row");
    var f = dateInput(ST.adaFrom, function (d) { ST.adaFrom = d; render(pg); }), t = dateInput(ST.adaTo, function (d) { ST.adaTo = d; render(pg); });
    inputs.appendChild(field("From", f)); inputs.appendChild(field("To", t));
    bar.appendChild(inputs);
    var body = el("div");
    slot.appendChild(body);
    var node = K.loading(body, "attendance");
    AT.ada(ST.adaFrom, ST.adaTo).then(function (r) {
      if (run !== RUN) return;
      node.remove();
      K.cxMetrics(body, [{ label: "Average daily attendance", value: r.total.ada == null ? "—" : r.total.ada + "%" },
        { label: "School days", value: r.total.schoolDays }, { label: "Counted as present", value: r.total.present }]);
      body.appendChild(el("p", "cx-note", r.byMinutes
        ? "By minutes: " + r.fullDayMinutes + " in the room is a whole day" + (r.halfDayMinutes != null ? ", " + r.halfDayMinutes + " a half" : "") + ". Marks that count as in the room: present, tardy and excused."
        : "By marks: a day is whole when a student was marked in any course. Set the minutes for a whole day in Settings to count by period time."));
      body.appendChild(el("p", "cx-note", "A day nobody took a register for counts as nobody present, so a low rate on a recent day may only be registers not yet taken."));
      if (!r.days.length) { body.appendChild(el("p", "cx-note", "No school days in this span.")); return; }
      var rows = r.days.map(function (d) {
        return "<tr><td>" + esc(longLabel(d.day)) + (d.minimum ? " <span class='cx-pill'>minimum day</span>" : "") + "</td><td class='n'>" + d.enrolled + "</td><td class='n'>" + d.present +
               "</td><td class='n'><b>" + (d.ada == null ? "—" : d.ada + "%") + "</b></td></tr>";
      }).join("");
      var tb = el("table", "at-how-kinds at-ada");
      tb.innerHTML = "<thead><tr><th>Day</th><th class='n'>Should be in</th><th class='n'>Counted present</th><th class='n'>Rate</th></tr></thead><tbody>" + rows + "</tbody>";
      body.appendChild(tb);
    }, function (e) {
      if (run !== RUN) return;
      node.remove();
      body.appendChild(el("p", "cx-note", esc(e && e.message ? e.message : "That could not be worked out.")));
    });
  }

  /* ============================================================ Settings */
  function drawSettings(pg) {
    var run = RUN, slot = pg.slot;
    slot.innerHTML = "";
    doneTools(pg);
    heading(slot, "Settings", "What a mark can say, what teachers may change, whether students and families see attendance, and the days there is no school.");
    var body = el("div", "at-settings");
    slot.appendChild(body);
    var node = K.loading(body, "settings");
    AT.settings().then(function (set) {
      if (run !== RUN) return;
      node.remove();
      useCodes(set.codes);
      var state = { online: !!set.online, closed: (set.closed || []).slice(), lockDays: set.lockDays == null ? null : set.lockDays,
                    full: set.fullDayMinutes == null ? null : set.fullDayMinutes, half: set.halfDayMinutes == null ? null : set.halfDayMinutes,
                    codes: (set.codes || []).map(function (c) { return Object.assign({}, c); }) };
      var writing = false;
      function save(then) {
        if (writing) return;
        writing = true;
        AT.putSettings({ online: state.online, closed: state.closed, codes: state.codes.map(function (c) {
          return { key: c.key, label: c.label, mark: c.mark, kind: c.kind, adminOnly: !!c.adminOnly, retired: !!c.retired };
        }), lockDays: state.lockDays, fullDayMinutes: state.full, halfDayMinutes: state.half }).then(function (s) {
          writing = false;
          useCodes(s.codes); LOCKDAYS = s.lockDays == null ? null : s.lockDays;
          state = { online: !!s.online, closed: (s.closed || []).slice(), lockDays: s.lockDays == null ? null : s.lockDays,
                    full: s.fullDayMinutes == null ? null : s.fullDayMinutes, half: s.halfDayMinutes == null ? null : s.halfDayMinutes,
                    codes: (s.codes || []).map(function (c) { return Object.assign({}, c); }) };
          toast("Saved"); if (then) then();
        }, function (e) { writing = false; toast(e && e.message ? e.message : "That was not saved."); });
      }
      function slugKey(text) {
        var taken = {};
        state.codes.forEach(function (c) { taken[c.key] = 1; });
        var base = String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 18) || "code";
        if (!/^[a-z]/.test(base)) base = "c-" + base;
        var k = base, i = 2;
        while (taken[k]) k = base + "-" + (i++);
        return k;
      }
      function draw() {
        body.innerHTML = "";

        /* ---- codes */
        var cs = el("section", "at-step");
        cs.appendChild(el("h3", null, "Attendance codes"));
        cs.appendChild(el("p", "cx-note", "What a mark can say. The first code in use is what every register starts as, and it must be Present. " +
          "Clicking a mark moves through the first three. A code is retired, never deleted, so the marks that carry it keep their meaning."));
        var list = el("div", "at-codes");
        state.codes.forEach(function (c, i) {
          var row = el("div", "at-crow" + (c.retired ? " off" : ""));
          var mk = el("input", "at-noteinput at-cmark");
          mk.type = "text"; mk.maxLength = 3; mk.value = c.mark; mk.setAttribute("aria-label", "Letter shown on a mark");
          mk.addEventListener("input", function () { c.mark = mk.value.trim(); });
          var lb = el("input", "at-noteinput");
          lb.type = "text"; lb.maxLength = 40; lb.value = c.label; lb.setAttribute("aria-label", "Name of the code");
          lb.addEventListener("input", function () { c.label = lb.value.trim(); });
          var kd = el("select", "cx-select at-ckind");
          kd.setAttribute("aria-label", "How it counts");
          Object.keys(KIND_NAME).forEach(function (k) {
            var o = el("option"); o.value = k; o.textContent = KIND_NAME[k];
            if (k === c.kind) o.selected = true;
            kd.appendChild(o);
          });
          kd.addEventListener("change", function () { c.kind = kd.value; });
          var ao = el("label", "at-check at-cadmin");
          var ac = el("input"); ac.type = "checkbox"; ac.checked = !!c.adminOnly;
          ac.addEventListener("change", function () { c.adminOnly = ac.checked; });
          ao.appendChild(ac); ao.appendChild(el("span", null, "Office only"));
          var mv = el("span", "at-cmove");
          var up = button("↑", "at-nb", function () { if (i > 0) { state.codes.splice(i - 1, 0, state.codes.splice(i, 1)[0]); draw(); } });
          var dn = button("↓", "at-nb", function () { if (i < state.codes.length - 1) { state.codes.splice(i + 1, 0, state.codes.splice(i, 1)[0]); draw(); } });
          up.setAttribute("aria-label", "Move up"); dn.setAttribute("aria-label", "Move down");
          mv.appendChild(up); mv.appendChild(dn);
          var rt = button(c.retired ? "Use again" : "Retire", "en-btn quiet", function () { c.retired = !c.retired; draw(); });
          [mk, lb, kd, ao, mv, rt].forEach(function (n) { row.appendChild(n); });
          list.appendChild(row);
        });
        cs.appendChild(list);
        var acts = el("div", "at-acts at-cactions");
        acts.appendChild(button("Add a code", "en-btn quiet", function () {
          state.codes.push({ key: "", label: "", mark: "", kind: "absent", adminOnly: false, retired: false, fresh: true });
          draw();
        }));
        acts.appendChild(button("Save codes", "en-btn strong", function () {
          var bad = state.codes.filter(function (c) { return !c.label || !c.mark; })[0];
          if (bad) { toast("Every code needs a letter and a name."); return; }
          state.codes.forEach(function (c) { if (!c.key) c.key = slugKey(c.label); delete c.fresh; });
          var first = state.codes.filter(function (c) { return !c.retired; })[0];
          if (!first || first.kind !== "present") { toast("The first code in use must be of kind Present: it is what a register starts as."); return; }
          save(draw);
        }));
        cs.appendChild(acts);
        var how = el("table", "at-how-kinds");
        how.innerHTML = "<thead><tr><th>Kind</th><th>On a report card</th><th>In an attendance rate</th><th>In state reporting</th></tr></thead><tbody>" +
          "<tr><td>Present</td><td>present</td><td>present</td><td>present</td></tr>" +
          "<tr><td>Tardy</td><td>tardy</td><td>present</td><td>present</td></tr>" +
          "<tr><td>Excused</td><td>absent</td><td>present</td><td>the state decides</td></tr>" +
          "<tr><td>Absent</td><td>absent</td><td>absent</td><td>absent</td></tr>" +
          "<tr><td>No record</td><td>not enrolled</td><td>not enrolled</td><td>not enrolled</td></tr></tbody>";
        cs.appendChild(how);
        cs.appendChild(el("p", "cx-note", "Tardy is unexcused. For an excused tardy, give it the kind Present."));
        body.appendChild(cs);

        /* ---- teachers */
        var tc = el("section", "at-step");
        tc.appendChild(el("h3", null, "What teachers may change"));
        var wsel = el("select", "cx-select");
        wsel.setAttribute("aria-label", "Edit window");
        [[null, "any day"], [0, "the same day only"], [1, "up to 1 day after"], [2, "up to 2 days after"], [3, "up to 3 days after"],
         [7, "up to 1 week after"], [14, "up to 2 weeks after"], [30, "up to 1 month after"]].forEach(function (o) {
          var op = el("option"); op.value = o[0] == null ? "" : String(o[0]); op.textContent = o[1];
          if (o[0] === state.lockDays) op.selected = true;
          wsel.appendChild(op);
        });
        wsel.addEventListener("change", function () { state.lockDays = wsel.value === "" ? null : +wsel.value; save(draw); });
        var wl = el("label", "at-f");
        wl.appendChild(el("span", null, "A teacher may take or change a register for"));
        wl.appendChild(wsel);
        tc.appendChild(wl);
        tc.appendChild(el("p", "cx-note", "A teacher cannot take a register for a day that has not come, and cannot set a code marked Office only or change a mark the office set. " +
          "The office can correct any day."));
        body.appendChild(tc);

        /* ---- whole days and half days */
        var wd = el("section", "at-step");
        wd.appendChild(el("h3", null, "Whole days and half days"));
        wd.appendChild(el("p", "cx-note", "How many minutes in the room make a day count for average daily attendance. Leave both empty and a day counts " +
          "as a whole day when a student was marked in any course. A minimum day needs no rule of its own: a student there for all of it is given a half day."));
        var fi = el("input", "at-noteinput"), hi = el("input", "at-noteinput");
        fi.type = hi.type = "number"; fi.min = hi.min = "1"; fi.max = hi.max = "1440";
        fi.value = state.full == null ? "" : state.full; hi.value = state.half == null ? "" : state.half;
        fi.placeholder = "e.g. 240"; hi.placeholder = "e.g. 120";
        var wr = el("div", "at-row");
        wr.appendChild(field("A whole day needs", fi, "minutes in the room"));
        wr.appendChild(field("A half day needs", hi, "minutes in the room, empty for none"));
        wr.appendChild(button("Save", "en-btn strong", function () {
          var full = fi.value === "" ? null : +fi.value, half = hi.value === "" ? null : +hi.value;
          if (full == null && half != null) { toast("Give the minutes for a whole day too."); return; }
          if (full != null && half != null && half > full) { toast("A half day cannot need more minutes than a whole day."); return; }
          state.full = full; state.half = half;
          save(draw);
        }));
        wd.appendChild(wr);
        body.appendChild(wd);

        /* ---- online */
        var on = el("section", "at-step");
        on.appendChild(el("h3", null, "Online access"));
        var l = el("label", "at-check at-switch");
        var cb = el("input"); cb.type = "checkbox"; cb.checked = state.online;
        cb.addEventListener("change", function () { state.online = cb.checked; save(draw); });
        l.appendChild(cb);
        l.appendChild(el("span", null, "Students and families can see attendance online"));
        on.appendChild(l);
        on.appendChild(el("p", "cx-note", state.online
          ? "Every absence, late and cut for every course appears in the family view, with any comment you wrote. Present is not listed. Turn this off to take it offline."
          : "Offline. Only the school and a student’s teachers see attendance. Turn this on and families see absences, lates and comments in the family view."));
        body.appendChild(on);

        /* ---- days with no school */
        var cl = el("section", "at-step");
        cl.appendChild(el("h3", null, "Days with no school"));
        cl.appendChild(el("p", "cx-note", "Weekends are never school days. Add the days the school is closed so a register is not expected on them."));
        if (!state.closed.length) cl.appendChild(el("p", "cx-note", "No closures entered."));
        state.closed.forEach(function (c, i) {
          var row = el("div", "at-closed");
          row.appendChild(el("span", null, "<b>" + esc(c.from === c.to ? label(c.from) : label(c.from) + " – " + label(c.to)) + "</b>" + (c.label ? " · " + esc(c.label) : "")));
          row.appendChild(button("Remove", "en-btn quiet", function () { state.closed.splice(i, 1); save(draw); }));
          cl.appendChild(row);
        });
        var add1 = el("div", "at-row");
        var f = el("input", "at-dateinput"), t = el("input", "at-dateinput"), n = el("input", "at-noteinput");
        f.type = t.type = "date"; n.type = "text"; n.maxLength = 80; n.placeholder = "Fall break, snow day…";
        f.value = ST.day; t.value = ST.day;
        add1.appendChild(field("From", f)); add1.appendChild(field("To", t)); add1.appendChild(field("Reason", n));
        add1.appendChild(button("Add", "en-btn strong", function () {
          if (!f.value || !t.value || t.value < f.value) { toast("Choose the first and last day."); return; }
          state.closed.push({ from: f.value, to: t.value, label: n.value.trim() });
          state.closed.sort(function (a, b) { return a.from < b.from ? -1 : 1; });
          save(draw);
        }));
        cl.appendChild(add1);
        body.appendChild(cl);
        if (set.updatedAt) body.appendChild(el("p", "cx-note", "Last changed " + esc(stamp(set.updatedAt)) + "."));
      }
      draw();
    }, function (e) { if (run === RUN) K.failed(node, e, function () { drawSettings(pg); }); });
  }

  /* ================================================= Grade attendance
     A teacher's penalties for absences and tardies, turned into a mark in the
     gradebook: one piece of work, "Attendance", per course. It is a snapshot
     of the span chosen. Run it again and the same work is rewritten. */
  var GA_KEY = "oplo.att.grade";
  function openGradeAttendance(courses) {
    var last = {};
    try { last = JSON.parse(localStorage.getItem(GA_KEY) || "{}") || {}; } catch (e) { last = {}; }
    var R = Object.assign({ mode: "start", start: 20, perAbsence: 2, perTardy: 1, perPresent: 1, waiveAbsences: 0, waiveTardies: 0 }, last);
    var box = el("div", "as-sheet at-ga");
    box.appendChild(el("h2", "as-h", "Grade attendance"));
    box.appendChild(el("p", "cx-note", "Turns the attendance you have taken into a mark in each course’s gradebook, named “Attendance”. " +
      "It is a snapshot: attendance changed later does not move it. Run it again to refresh it. A mark you typed over by hand is rewritten with it."));
    var form = el("div", "at-form");
    box.appendChild(form);
    var sheet = K.cxSheet(box);

    loadPeriods().then(function (periods) {
      var t = today();
      var cur = periods.filter(function (p) { return t >= p.startsOn && t <= p.endsOn; })[0];
      var from = R.from && R.to ? R.from : cur ? cur.startsOn : add(t, -30), to = R.from && R.to ? R.to : cur ? (cur.endsOn < t ? cur.endsOn : t) : t;
      var picked = {};
      courses.forEach(function (c) { picked[c.id] = true; });

      function num(value, change, min) {
        var i = el("input", "at-noteinput at-num");
        i.type = "number"; i.min = String(min || 0); i.step = "any"; i.value = String(value);
        i.addEventListener("input", function () { change(i.value === "" ? 0 : +i.value); });
        return i;
      }
      // 1 · when
      var s1 = el("section", "at-step");
      s1.appendChild(el("h3", null, "<i>1</i>The span"));
      if (periods.length) {
        var ps = el("select", "cx-select");
        var custom = el("option"); custom.value = ""; custom.textContent = "Choose dates";
        ps.appendChild(custom);
        periods.forEach(function (p) {
          var o = el("option"); o.value = p.id; o.textContent = p.name + " · " + label(p.startsOn) + " – " + label(p.endsOn);
          if (cur && p.id === cur.id && !R.from) o.selected = true;
          ps.appendChild(o);
        });
        ps.addEventListener("change", function () {
          var p = periods.filter(function (x) { return x.id === ps.value; })[0];
          if (p) { from = p.startsOn; to = p.endsOn < today() ? p.endsOn : today(); fi.value = from; ti.value = to; }
        });
        s1.appendChild(ps);
      }
      var wr = el("div", "at-row");
      var fi = dateInput(from, function (v) { from = v; }), ti = dateInput(to, function (v) { to = v; });
      wr.appendChild(field("From", fi)); wr.appendChild(field("To", ti));
      s1.appendChild(wr);
      form.appendChild(s1);

      // 2 · the rule
      var s2 = el("section", "at-step");
      s2.appendChild(el("h3", null, "<i>2</i>The rule"));
      var rules = el("div"), modeNote = el("p", "cx-note");
      function drawRules() {
        rules.innerHTML = "";
        var r1 = el("div", "at-row");
        if (R.mode === "start") r1.appendChild(field("Start with (points)", num(R.start, function (v) { R.start = v; }, 1)));
        if (R.mode === "add") r1.appendChild(field("Points per day present", num(R.perPresent, function (v) { R.perPresent = v; })));
        if (R.mode !== "add") {
          r1.appendChild(field("Take off per absence", num(R.perAbsence, function (v) { R.perAbsence = v; })));
          r1.appendChild(field("Take off per tardy", num(R.perTardy, function (v) { R.perTardy = v; })));
          rules.appendChild(r1);
          var r2 = el("div", "at-row");
          r2.appendChild(field("Absences waived", num(R.waiveAbsences, function (v) { R.waiveAbsences = Math.floor(v); })));
          r2.appendChild(field("Tardies waived", num(R.waiveTardies, function (v) { R.waiveTardies = Math.floor(v); })));
          rules.appendChild(r2);
        } else rules.appendChild(r1);
        modeNote.textContent = R.mode === "start"
          ? "Everyone starts with " + R.start + " points. The work is worth " + R.start + "."
          : R.mode === "subtract" ? "Everyone starts at nothing and points come off the course total. It can lower a grade and cannot raise one."
          : "Everyone starts at nothing and earns points for each day they were present. It is extra credit.";
      }
      s2.appendChild(seg([["start", "Start with points"], ["subtract", "Take points off the total"], ["add", "Earn points for days present"]], R.mode,
        function (m) { R.mode = m; drawRules(); }));
      s2.appendChild(rules);
      s2.appendChild(modeNote);
      drawRules();
      form.appendChild(s2);

      // 3 · which codes are absences
      var away = CODES.filter(function (c) { return c.kind === "absent" || c.kind === "excused"; });
      var off = {};
      (R.skipCodes || []).forEach(function (k) { off[k] = true; });
      var s3 = el("section", "at-step");
      s3.appendChild(el("h3", null, "<i>3</i>What counts as an absence"));
      var cl = el("div", "at-checks");
      away.forEach(function (c) {
        var l = el("label", "at-check"), cb = el("input");
        cb.type = "checkbox"; cb.checked = !off[c.k];
        cb.addEventListener("change", function () { if (cb.checked) delete off[c.k]; else off[c.k] = true; });
        l.appendChild(cb); l.appendChild(el("span", null, esc(c.name) + "<small>" + esc(KIND_NAME[c.kind]) + "</small>"));
        cl.appendChild(l);
      });
      s3.appendChild(cl);
      s3.appendChild(el("p", "cx-note", "Untick a code to leave it unpenalised: for example, penalise only unexcused absences by unticking Excused."));
      form.appendChild(s3);

      // 4 · which courses
      var s4 = el("section", "at-step");
      s4.appendChild(el("h3", null, "<i>4</i>Which courses"));
      var cc = el("div", "at-checks");
      courses.forEach(function (c) {
        var l = el("label", "at-check"), cb = el("input");
        cb.type = "checkbox"; cb.checked = true;
        cb.addEventListener("change", function () { picked[c.id] = cb.checked; });
        l.appendChild(cb); l.appendChild(el("span", null, esc(c.title) + "<small>" + plural(c.students, "student") + "</small>"));
        cc.appendChild(l);
      });
      s4.appendChild(cc);
      form.appendChild(s4);

      var foot = el("div", "at-go");
      var msg = el("span", "cx-note");
      var go = button("Create or update “Attendance”", "en-btn strong", function () {
        var chosen = courses.filter(function (c) { return picked[c.id]; });
        if (!chosen.length) { msg.textContent = "Choose a course."; return; }
        if (!from || !to || to < from) { msg.textContent = "Choose the first and last day."; return; }
        go.disabled = true; msg.textContent = "Grading…";
        var skip = Object.keys(off);
        var rule = { from: from, to: to, mode: R.mode, start: R.start, perAbsence: R.perAbsence, perTardy: R.perTardy, perPresent: R.perPresent,
                     waiveAbsences: R.waiveAbsences, waiveTardies: R.waiveTardies,
                     absenceCodes: away.map(function (c) { return c.k; }).filter(function (k) { return !off[k]; }) };
        try { localStorage.setItem(GA_KEY, JSON.stringify(Object.assign({}, R, { from: from, to: to, skipCodes: skip }))); } catch (e) { /* the rules are just not remembered */ }
        var done = [], i = 0;
        (function next() {
          if (i >= chosen.length) {
            form.innerHTML = "";
            form.appendChild(el("div", "at-done", "<b>Attendance is in the gradebook.</b><p class='cx-note'>" +
              done.map(function (d) { return esc(d.title) + ": " + plural(d.res.students, "student") + ", " + d.res.penalised + " with points taken off" + (d.res.assignment.created ? " (new)" : " (updated)"); }).join("<br>") + "</p>"));
            var a = el("div", "at-acts");
            a.appendChild(button("Close", "en-btn strong", function () { sheet.close(); }));
            form.appendChild(a);
            return;
          }
          var c = chosen[i++];
          AT.grade(c.id, rule).then(function (res) { done.push({ title: c.title, res: res }); next(); },
            function (e) { go.disabled = false; msg.textContent = c.title + ": " + ((e && e.message) || "That did not work."); });
        })();
      });
      foot.appendChild(msg); foot.appendChild(go);
      form.appendChild(foot);
    });
  }

  /* ====================================================== A teacher's roll
     The teacher's own page: each course they teach, for the day chosen, and
     the register one click away. Everything a teacher may not do — a code the
     office keeps, a mark the office set, a day outside the school's window —
     is decided on the server and said here when it is refused. */
  function teach(v) {
    if (!ST.day) ST.day = lastSchoolDay();
    var P = K.cxPage(v, "Students", "Attendance",
      "Take the register for each of your courses. Everyone starts present; mark who isn’t, and leave a comment where it helps.");
    var bar = el("div", "at-bar");
    v.appendChild(bar);
    var body = el("div");
    v.appendChild(body);
    var run = ++RUN;

    function draw() {
      body.innerHTML = "";
      bar.innerHTML = "";
      bar.appendChild(dateNav(draw));
      var node = K.loading(body, "your courses");
      Promise.all([K.loadSchool(), loadSettings(), API.schedule.mine(ST.day).catch(function () { return null; })]).then(function (r) {
        if (run !== RUN) return;
        var d = r[0], set = r[1], placed = {};
        ((r[2] && r[2].items) || []).forEach(function (i) { placed[i.courseId] = i; });
        var courses = d.courses.filter(function (c) { return c.students > 0; });
        if (!P.tools.children.length && courses.length) {
          P.tools.appendChild(K.cnAction("Grade attendance", function () { openGradeAttendance(courses); }));
        }
        var closed = closedName(ST.day, set), future = ST.day > today();
        return Promise.all(courses.map(function (c) {
          return AT.list({ courseId: c.id, day: ST.day }).then(function (rows) { return rows.length; }, function () { return null; });
        })).then(function (counts) {
          if (run !== RUN) return;
          node.remove();
          var title = el("div", "at-day");
          title.innerHTML = "<b>" + esc(longLabel(ST.day)) + "</b>" +
            (closed ? "<span>" + esc(closed) + " — no school</span>" : weekend(ST.day) ? "<span>No school — a weekend</span>" :
             future ? "<span>This day has not come yet</span>" : "");
          body.appendChild(title);
          if (!courses.length) { body.appendChild(K.cnEmpty("No courses with students yet.", "When students are enrolled in a course you teach, its register appears here.")); return; }
          var t = K.cnTable([{ label: "Course", w: "minmax(200px, 2fr)" }, { label: "Period", w: "minmax(110px, 1fr)" },
            { label: "Students", w: "90px", align: "right" }, { label: "Register", w: "minmax(180px, 1.4fr)" }]);
          courses.forEach(function (c, i) {
            var n = counts[i], want = expected(c, ST.day), pl = placed[c.id];
            var offToday = pl && !pl.meets;
            var state = n == null ? K.cxNone("Could not be read") : n >= want && n > 0 ? "Taken" : n > 0 ? pill("orange", "Marked " + n + " of " + want)
              : closed || weekend(ST.day) ? K.cxNone("No school") : future ? K.cxNone("Not yet") : offToday ? K.cxNone("Does not meet") : pill("orange", "Not taken");
            var when = pl && pl.periods.length ? esc(pl.periods.join(", ")) + (pl.startsAt ? "<span class='cn-sub2'>" + esc(pl.startsAt + (pl.endsAt ? "–" + pl.endsAt : "")) + (pl.room ? " · Room " + esc(pl.room) : "") + "</span>"
              : pl.room ? "<span class='cn-sub2'>Room " + esc(pl.room) + "</span>" : "") : K.cxNone();
            t.row(["<b>" + esc(c.title) + "</b>", when, String(c.students), state], function () { openRegister(c, ST.day, draw); }, c.id);
          });
          body.appendChild(t);
          body.appendChild(el("p", "cx-note", LOCKDAYS == null
            ? "Open a course to take or correct its register."
            : "Open a course to take or correct its register. The office lets you change a register " + (LOCKDAYS === 0 ? "on the same day only." : "for up to " + plural(LOCKDAYS, "day") + " after it.")));
        });
      }).then(null, function (e) { if (run === RUN) K.failed(node, e, draw); });
    }
    draw();
  }

  return {
    tab: tab,
    teach: teach,
    // Open one student's record, from Student 360 or anywhere else.
    student: function (s) { ST.studentId = s.id; ST.view = "student"; ST.deep = true; K.openAdmin(false, "attendance"); }
  };
};
