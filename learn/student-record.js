/* ==========================================================================
   OEdu — the student's record pages.

   Grades, Attendance, Transcript, Graduation, Profile and Requests: the part
   of the student portal that is the school's record of the student rather than
   the day's timetable. They add to the surface student.js builds
   (OPLO_STUDENT_RECORD(X)), and read nothing the server would not give the
   student about themselves.
   ========================================================================== */
window.OPLO_STUDENT_RECORD = function (X) {
  "use strict";

  var K = X.K, el = X.el, esc = X.esc, API = K.API, SC = API.schedule, toast = K.toast, D = X.D;
  var plural = X.plural, num = X.num, short = X.short, longDay = X.longDay, settle = X.settle;

  function slot(v) { var s = el("div", "sx-slot"); v.appendChild(s); return s; }
  function openCourse(sec, id) { K.open("courses", X.slugOf(sec, id)); }

  /* ============================================================== Grades */
  X.pages.grades = function (v) {
    var P = X.page(v, "Academics", "Grades", "Your grade in each course as your teachers have marked it. The server works each one out from the marks and the way the course weights them.");
    var s = slot(v);
    var n = X.waiting(s, "your grades");
    Promise.all([D.report(), D.sections(), settle(D.work()), settle(D.periods())]).then(function (r) {
      n.remove();
      var rep = r[0], secs = r[1], w = r[2].ok ? r[2].v.work : [], periods = r[3].ok ? r[3].v : [];
      var secBy = X.byCourse(secs);
      var now = Date.now();
      var graded = rep.courses.filter(function (c) { return c.grade && c.grade.percent != null; });
      var low = graded.slice().sort(function (a, b) { return a.grade.percent - b.grade.percent; })[0];
      var missing = w.filter(function (x) { var st = X.stateOf(x, now); return st === "missing" || st === "late"; }).length;
      K.cxMetrics(s, [
        { label: "Average", value: rep.standing, unit: "%", note: rep.standing == null ? "No marks yet" : "of " + plural(graded.length, "course") + " with marks" },
        { label: "Courses", value: rep.courseCount },
        { label: "Lowest", value: low ? low.grade.percent : null, unit: "%", note: low ? low.title : "" },
        { label: "Past due or missing", value: w.length ? missing : null, bad: true, go: function () { K.open("assignments", "late"); } }
      ]);
      if (!rep.courses.length) { s.appendChild(K.cnEmpty("No courses yet.", "Your grades appear here once the school puts you in a section.")); return; }
      P.tools.appendChild(K.cnAction("Print", function () {
        K.cxPrint("Grades", K.printHead("Grades", X.me().name + " · " + new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })) +
          K.printTable([{ t: "Course" }, { t: "Teacher" }, { t: "Grade" }, { t: "Percent", r: true }, { t: "Marked", r: true }, { t: "Missing", r: true }],
            rep.courses.map(function (c) {
              var sec = secBy[c.courseId], g = c.grade;
              return [c.title, sec ? X.teacherNames(sec) : "", g && g.letter ? g.letter : "", g && g.percent != null ? num(g.percent) + "%" : "", g ? String(g.itemCount || 0) : "0", g ? String(g.missingCount || 0) : "0"];
            })) + "<p class='foot'>Current grades as marked by your teachers on this date. They change when a mark does; this is not a report card issued by the school.</p>");
      }));

      s.appendChild(el("h3", "sx-h3", "Current"));
      var t = K.cnTable([{ label: "Course", w: "minmax(170px, 1.5fr)" }, { label: "Teacher", w: "minmax(140px, 1.1fr)" }, { label: "Grade", w: "130px" },
        { label: "Trend", w: "110px" }, { label: "Marked", w: "78px", align: "right" }, { label: "Missing", w: "78px", align: "right" }]);
      rep.courses.forEach(function (c) {
        var sec = secBy[c.courseId], g = c.grade;
        var tr = c.trend ? (c.trend.change > 0 ? "▲ " : c.trend.change < 0 ? "▼ " : "– ") + Math.abs(c.trend.change) + " pts" : "";
        t.row(["<b>" + esc(c.title) + "</b>" + (c.subject ? "<span class='cn-sub2'>" + esc(c.subject) + "</span>" : ""),
               sec && X.teacherNames(sec) ? esc(X.teacherNames(sec)) : X.none(), X.gradeHtml(g),
               c.trend ? "<span class='sx-trend " + (c.trend.change > 0 ? "up" : c.trend.change < 0 ? "down" : "") + "'>" + esc(tr) + "</span>" : X.none(),
               g ? String(g.itemCount || 0) : "0", g && g.missingCount ? "<b class='cn-mk bad'>" + g.missingCount + "</b>" : "0"],
          function () { openCourse(sec, c.courseId); });
      });
      s.appendChild(t);
      X.note(s, "Select a course to see every mark, how its grade is made, and what a goal needs.");

      // Marking periods, as the school has posted them
      var closed = periods.filter(function (p) { return p.state === "posted" || p.state === "locked"; });
      var openP = periods.filter(function (p) { return p.state === "open" || p.state === "grading"; });
      if (periods.length) {
        s.appendChild(el("h3", "sx-h3", "Marking periods"));
        var host = el("div");
        s.appendChild(host);
        if (openP.length) X.note(host, openP.map(function (p) { return p.name; }).join(", ") + (openP.length === 1 ? " is" : " are") + " still open: the grade above is the running grade, not a posted one.");
        closed.sort(function (a, b) { return String(a.startsOn || "") < String(b.startsOn || "") ? 1 : -1; });
        Promise.all(closed.map(function (p) { return settle(API.periods.posted(p.id, { accountId: X.me().id })); })).then(function (res) {
          var any = false;
          res.forEach(function (x, i) {
            if (!x.ok || !x.v || !x.v.length) return;
            any = true;
            var p = closed[i];
            host.appendChild(el("h4", "sx-h4", esc(p.name) + (p.postedAt ? "<small>Posted " + esc(X.relDay(p.postedAt)) + "</small>" : "")));
            var pt = K.cnTable([{ label: "Course", w: "minmax(180px, 1.6fr)" }, { label: "Grade", w: "130px" }, { label: "Result", w: "110px" }]);
            x.v.forEach(function (g) {
              pt.row(["<b>" + esc(g.courseTitle) + "</b>", X.gradeHtml({ percent: g.percent, letter: g.letter }), g.passing == null ? X.none() : X.pill(g.passing ? "Passing" : "Below a pass", g.passing ? "ok" : "red")]);
            });
            host.appendChild(pt);
          });
          if (!any && !openP.length) X.note(host, "No marking period has been posted yet.");
        });
      }
    }).catch(function (e) { n.remove(); X.failedAt(s, e, function () { K.open("grades"); }); });
  };

  /* What a goal needs: the server's own what-if, searched for the lowest
     average on the work left that reaches the goal. Nine questions at most. */
  var GOALS = [["A", 93], ["B", 83], ["C", 73], ["D", 63]];
  X.goalBox = function (card, sec, work) {
    var rest = work.filter(function (w) { return !w.status && w.outOf > 0 && !w.extraCredit; });
    if (!rest.length) {
      card.appendChild(el("p", "sx-quiet", "Everything in this course has been marked, so the grade changes only if a mark does."));
      return;
    }
    var pts = rest.reduce(function (a, w) { return a + Number(w.outOf); }, 0);
    X.note(card, plural(rest.length, "piece") + " of work left, worth " + plural(num(pts), "point") + ". Choose the grade you want.");
    var pick = el("div", "sx-goals");
    var out = el("div", "sx-answer");
    out.setAttribute("aria-live", "polite");
    var cache = {};
    function whatAt(pct) {
      return API.grades.whatif(sec.courseId, X.me().id, rest.map(function (w) {
        return { assignmentId: w.assignmentId, score: Math.round(pct * w.outOf) / 100, status: "marked" };
      })).then(function (r) { return r && r.then; });
    }
    function solve(min) {
      if (cache[min]) return cache[min];
      var p = whatAt(100).then(function (top) {
        if (!top) throw new Error("no answer");
        if (top.percent < min) return { kind: "out", best: top };
        return whatAt(0).then(function (floor) {
          if (floor && floor.percent >= min) return { kind: "safe" };
          var lo = 0, hi = 100;
          function step() {
            if (hi - lo <= 1) return { kind: "need", pct: hi };
            var mid = Math.round((lo + hi) / 2);
            return whatAt(mid).then(function (x) { if (x && x.percent >= min) hi = mid; else lo = mid; return step(); });
          }
          return step();
        });
      });
      cache[min] = p;
      p.catch(function () { delete cache[min]; });
      return p;
    }
    GOALS.forEach(function (g) {
      var b = el("button", "sx-goal", "<b>" + g[0] + "</b><small>" + g[1] + "%+</small>");
      b.type = "button";
      b.addEventListener("click", function () {
        [].forEach.call(pick.children, function (x) { x.classList.toggle("on", x === b); });
        out.innerHTML = "<p class='sx-quiet'>Working it out…</p>";
        solve(g[1]).then(function (r) {
          var where = rest.length === 1 ? "on the last piece of work" : "on average across the " + rest.length + " pieces left";
          var an = g[0] === "A" ? "an A" : "a " + g[0];
          if (r.kind === "out") out.innerHTML = "<p class='res red'>Getting " + an + " is not possible now.</p><p>Full marks " + where + " reaches " + esc(r.best.letter) + " (" + num(r.best.percent) + "%).</p>";
          else if (r.kind === "safe") out.innerHTML = "<p class='res ok'>" + (g[0] === "A" ? "An A" : "A " + g[0]) + " or better is already secured.</p><p>Your marks so far keep you there whatever the rest scores.</p>";
          else out.innerHTML = "<p class='res'>To get " + an + " you need about <b>" + r.pct + "%</b> " + where + ".</p>";
        }, function () { out.innerHTML = "<p class='sx-quiet'>That could not be worked out just now.</p>"; });
      });
      pick.appendChild(b);
    });
    card.appendChild(pick);
    card.appendChild(out);
  };

  /* ========================================================== Attendance */
  var AT = { range: "year", kind: "all", course: "", month: null };
  X.pages.attendance = function (v) {
    X.page(v, "Record", "Attendance", "Registers your teachers took, with the school’s own codes. A day is the school’s count of your classes that day.");
    var s = slot(v);
    var n = X.waiting(s, "your attendance");
    Promise.all([D.register(), D.codes(), D.sections()]).then(function (r) {
      n.remove();
      var codes = r[1], secs = r[2];
      var all = X.regModel(r[0], codes);
      if (!all.online) {
        s.appendChild(K.cnEmpty("Your school has not put attendance online.", "Registers are kept by your teachers and the office. Ask the office if you want to see yours."));
        return;
      }
      var t0 = X.todayIso();
      var yr = X.yearOf(t0);
      var from = AT.range === "30" ? X.addDays(t0, -29) : yr.from;
      var model = X.regModel({ online: true, attendance: r[0].attendance.filter(function (x) { return x.day >= from && x.day <= t0; }) }, codes);
      var tot = model.totals;
      var host = el("div");

      var bar0 = el("div", "cx-bar sx-bar0");
      bar0.appendChild(K.cnFilters([{ k: "year", name: "This school year" }, { k: "30", name: "Last 30 days" }], AT.range, function (k) { AT.range = k; K.open("attendance"); }));
      s.appendChild(bar0);

      K.cxMetrics(s, [
        { label: "Attendance rate", value: model.rate, unit: "%", note: tot.marks ? "of " + plural(tot.marks, "class register") : "No registers yet" },
        { label: "Full days absent", value: tot.marks ? model.daysAbsent : null, bad: true },
        { label: "Class absences", value: tot.marks ? tot.absent : null, note: tot.excused ? plural(tot.excused, "excused") + " besides" : "" },
        { label: "Late", value: tot.marks ? tot.tardy : null }
      ]);
      s.appendChild(host);

      // The month, day by day
      if (!AT.month) AT.month = t0.slice(0, 7) + "-01";
      var cal = el("section", "sx-card");
      host.appendChild(cal);
      function drawMonth() {
        cal.innerHTML = "";
        var head = el("div", "sx-calhead");
        head.appendChild(el("b", null, esc(X.monthName(AT.month))));
        var prev = X.button("‹", "cn-btn small", function () { var d = X.parse(AT.month); d.setMonth(d.getMonth() - 1); AT.month = X.iso(d); drawMonth(); });
        var next = X.button("›", "cn-btn small", function () { var d = X.parse(AT.month); d.setMonth(d.getMonth() + 1); AT.month = X.iso(d); drawMonth(); });
        prev.setAttribute("aria-label", "Earlier month"); next.setAttribute("aria-label", "Later month");
        head.appendChild(prev); head.appendChild(next);
        cal.appendChild(head);
        var first = X.parse(AT.month), start = X.addDays(AT.month, -((first.getDay() + 6) % 7));
        var last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
        var end = X.addDays(X.iso(last), (7 - ((last.getDay() + 6) % 7) - 1) % 7);
        var g = el("div", "sx-cal sx-attcal");
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(function (d) { g.appendChild(el("div", "dow", d)); });
        for (var d = start; d <= end; d = X.addDays(d, 1)) {
          var inMonth = d.slice(0, 7) === AT.month.slice(0, 7);
          var rec = all.days[d];
          var st = rec ? rec.state : "";
          var c = el("div", "cell att " + st + (inMonth ? "" : " out") + (d === t0 ? " today" : ""));
          var label = !rec ? "" : st === "present" ? "P" : st === "absent" ? "A" : st === "partial" ? rec.away + "/" + rec.n : st === "tardy" ? "L" : "";
          c.innerHTML = "<b>" + X.parse(d).getDate() + "</b>" + (label ? "<span>" + esc(label) + "</span>" : "");
          if (rec) c.title = longDay(d) + "\n" + rec.rows.map(function (q) { return q.courseTitle + ": " + q.label; }).join("\n");
          g.appendChild(c);
        }
        cal.appendChild(g);
        var key = el("div", "sx-key");
        key.innerHTML = "<span class='present'>Present</span><span class='tardy'>Late</span><span class='partial'>Some classes missed</span><span class='absent'>Absent</span>";
        cal.appendChild(key);
      }
      drawMonth();

      // By course
      host.appendChild(el("h3", "sx-h3", "By course"));
      var byC = {};
      model.rows.forEach(function (q) {
        var c = byC[q.courseId] || (byC[q.courseId] = { id: q.courseId, title: q.courseTitle, present: 0, tardy: 0, absent: 0, excused: 0, n: 0 });
        if (q.kind === "norecord") return;
        c[q.kind] = (c[q.kind] || 0) + 1; c.n++;
      });
      var ct = K.cnTable([{ label: "Course", w: "minmax(170px, 1.5fr)" }, { label: "Present", w: "80px", align: "right" }, { label: "Late", w: "70px", align: "right" },
        { label: "Absent", w: "76px", align: "right" }, { label: "Excused", w: "80px", align: "right" }, { label: "Rate", w: "80px", align: "right" }]);
      var list = Object.keys(byC).map(function (k) { return byC[k]; }).sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
      if (!list.length) host.appendChild(el("p", "sx-quiet", "No registers in this range."));
      list.forEach(function (c) {
        var rate = X.pctOf(c.present + c.tardy + c.excused, c.n);
        ct.row(["<b>" + esc(c.title) + "</b>", String(c.present), String(c.tardy), c.absent ? "<b class='cn-mk bad'>" + c.absent + "</b>" : "0", String(c.excused), rate == null ? X.none() : num(rate) + "%"]);
      });
      if (list.length) host.appendChild(ct);

      // Every mark that is not present
      host.appendChild(el("h3", "sx-h3", "Absences and lates"));
      var fbar = el("div", "cx-bar sx-bar0");
      var kinds = K.cnFilters([{ k: "all", name: "All" }, { k: "absent", name: "Absent" }, { k: "tardy", name: "Late" }, { k: "excused", name: "Excused" }], AT.kind, function (k) { AT.kind = k; drawList(); });
      fbar.appendChild(kinds);
      var sel = el("select", "cx-select sx-sel");
      var o0 = el("option"); o0.value = ""; o0.textContent = "All courses"; sel.appendChild(o0);
      secs.forEach(function (sec) { var o = el("option"); o.value = sec.courseId; o.textContent = sec.title; if (AT.course === sec.courseId) o.selected = true; sel.appendChild(o); });
      sel.addEventListener("change", function () { AT.course = sel.value; drawList(); });
      fbar.appendChild(sel);
      host.appendChild(fbar);
      var listHost = el("div");
      host.appendChild(listHost);
      function drawList() {
        kinds.mark(AT.kind);
        listHost.innerHTML = "";
        var rows = model.rows.filter(function (q) {
          return q.kind !== "present" && q.kind !== "norecord" && (AT.kind === "all" || q.kind === AT.kind) && (!AT.course || q.courseId === AT.course);
        });
        if (!rows.length) { listHost.appendChild(el("p", "sx-quiet", "Nothing to show.")); return; }
        var t = K.cnTable([{ label: "Date", w: "130px" }, { label: "Course", w: "minmax(160px, 1.3fr)" }, { label: "Mark", w: "130px" }, { label: "Comment", w: "minmax(160px, 1.5fr)" }]);
        rows.slice(0, 120).forEach(function (q) {
          t.row([esc(longDay(q.day)), esc(q.courseTitle || ""), "<span class='sx-mk " + esc(q.kind) + "'>" + esc(q.mark) + "</span> " + esc(q.label), q.note ? esc(q.note) : X.none()]);
        });
        listHost.appendChild(t);
        if (rows.length > 120) X.note(listHost, "The 120 most recent are shown.");
      }
      drawList();

      // What each code means
      host.appendChild(el("h3", "sx-h3", "What the codes mean"));
      var kindsText = { present: "counts as present", tardy: "counts as present, and as late", absent: "counts as absent", excused: "counts as present for the rate, and as an absence", norecord: "not counted" };
      var ul = el("div", "sx-codes");
      (codes.codes || []).filter(function (c) { return !c.retired; }).forEach(function (c) {
        ul.appendChild(el("div", "sx-code", "<span class='sx-mk " + esc(c.kind) + "'>" + esc(c.mark) + "</span><b>" + esc(c.label) + "</b><small>" + esc(kindsText[c.kind] || "") + "</small>"));
      });
      host.appendChild(ul);
    }).catch(function (e) { n.remove(); X.failedAt(s, e, function () { K.open("attendance"); }); });
  };

  /* =========================================================== Transcript */
  X.pages.transcript = function (v) {
    var P = X.page(v, "Record", "Transcript", "Every course on your record, by year, with credits and marks. The averages are worked out from the courses listed.");
    var s = slot(v);
    var n = X.waiting(s, "your record");
    D.grad().then(function (g) {
      n.remove();
      var marks = g.marks || [], cur = (g.current || []);
      if (!marks.length && !cur.length && !(g.ehsCourses || []).length && !(g.courses || []).length) {
        s.appendChild(K.cnEmpty("Nothing is on your record yet.", "When the school adds a previous transcript, or finishes a course, it appears here."));
        return;
      }
      P.tools.appendChild(K.cnAction("Print", function () { printTranscript(g); }));
      K.cxMetrics(s, [
        { label: "Grade-point average", value: g.gpa && g.gpa.value != null ? g.gpa.value.toFixed(2) : null, note: g.gpa && g.gpa.value != null ? "on a 4.0 scale · " + plural(g.gpa.courses, "course") : "" },
        { label: "Credits earned", value: g.totals ? num(g.totals.earned) : null, note: g.track ? "of " + g.track.total + " for a diploma" : "" },
        { label: "Courses", value: marks.length },
        { label: "Years", value: (g.years || []).filter(function (y) { return !y.gap; }).length }
      ]);
      // Group the lettered courses by school year
      var by = {}, order = [];
      marks.forEach(function (m) {
        var k = m.year || "Undated";
        if (!by[k]) { by[k] = []; order.push(k); }
        by[k].push(m);
      });
      order.sort(function (a, b) { return a < b ? 1 : -1; });
      var yearInfo = {};
      (g.years || []).forEach(function (y) { yearInfo[y.year] = y; });
      if (cur.length) {
        var cs = K.cxSection(s, "sx-sec", "This year", "In progress");
        var ct = K.cnTable([{ label: "Course", w: "minmax(180px, 1.6fr)" }, { label: "Area", w: "130px" }, { label: "Grade so far", w: "130px" }, { label: "Credits", w: "80px", align: "right" }]);
        cur.forEach(function (c) { ct.row(["<b>" + esc(c.title) + "</b>", c.area ? esc(areaName(c.area)) : X.none(), X.gradeHtml(c), c.credits ? esc(num(c.credits)) : X.none()]); });
        cs.appendChild(ct);
      }
      order.forEach(function (k) {
        var yi = yearInfo[k];
        var card = K.cxSection(s, "sx-sec", yearName(k), yi ? [plural(num(yi.credits), "credit"), yi.average != null ? num(yi.average) + "% average" : ""].filter(Boolean).join(" · ") : "");
        var t = K.cnTable([{ label: "Course", w: "minmax(180px, 1.6fr)" }, { label: "Area", w: "130px" }, { label: "Mark", w: "100px" }, { label: "Credits", w: "80px", align: "right" }, { label: "Where", w: "110px" }]);
        by[k].forEach(function (m) {
          t.row(["<b>" + esc(m.title) + "</b>", m.area ? esc(areaName(m.area)) : X.none(), "<b class='cn-mk'>" + esc(m.letter || "") + "</b> <span class='cn-pc'>" + esc(m.mark == null ? "" : String(m.mark)) + "</span>",
                 esc(num(m.credits)), m.source === "ehs" ? "This school" : "Transferred"]);
        });
        card.appendChild(t);
      });
      if (g.transfer) {
        var tr = K.cxSection(s, "sx-sec", "Transfer record", "");
        tr.appendChild(X.dl([
          ["School", g.transfer.school], ["Kind", g.transfer.kind === "official" ? "Official, sent by the school" : "Copy supplied by the family"],
          ["Printed", g.transfer.printedOn], ["Status", (g.transfer.statusSteps || [])[g.transfer.statusAt] || g.transfer.status],
          ["Credits", g.transfer.creditsEarned != null ? num(g.transfer.creditsEarned) + " earned of " + num(g.transfer.creditsAttempted) + " attempted" : null],
          ["Cumulative average", g.transfer.cumulativeAverage != null ? g.transfer.cumulativeAverage + "%" : null]
        ]));
      }
      if (g.assumptions && g.assumptions.length) X.note(s, g.assumptions.join(" "));
    }).catch(function (e) { n.remove(); X.failedAt(s, e, function () { K.open("transcript"); }); });
  };
  var AREAS = { english: "English", math: "Mathematics", science: "Science", social_studies: "Social Studies", health: "Health", pe: "Physical Education",
                fine_art: "Fine Art", world_language: "World Language", elective: "Elective" };
  function areaName(a) { return AREAS[a] || a; }
  function yearName(y) {
    var m = String(y || "").match(/^(\d{4})\D+(\d{2,4})$/);
    return m ? m[1] + "–" + m[2].slice(-2) : String(y || "Undated");
  }
  function printTranscript(g) {
    var rows = (g.marks || []).slice().sort(function (a, b) { return String(a.year || "") < String(b.year || "") ? -1 : 1; });
    var body = K.printHead("Transcript", X.me().name + " · unofficial copy") +
      K.printTable([{ t: "Year" }, { t: "Course" }, { t: "Area" }, { t: "Mark" }, { t: "Credits", r: true }],
        rows.map(function (m) { return [yearName(m.year), m.title, m.area ? areaName(m.area) : "", (m.letter || "") + (m.mark != null ? " (" + m.mark + ")" : ""), num(m.credits)]; })) +
      "<p class='foot'>Credits earned " + num(g.totals && g.totals.earned) + (g.gpa && g.gpa.value != null ? " · Grade-point average " + g.gpa.value.toFixed(2) : "") +
      ". This copy is for your own use; the school issues the official transcript.</p>";
    K.cxPrint("Transcript", body);
  }

  /* =========================================================== Graduation */
  X.pages.graduation = function (v) {
    var P = X.page(v, "Record", "Graduation", "What a diploma needs, and where each requirement stands. Credits count in the requirement they were earned in.");
    var s = slot(v);
    var n = X.waiting(s, "your requirements");
    D.grad().then(function (g) {
      n.remove();
      if (!g || !g.totals) { s.appendChild(K.cnEmpty("Nothing is on your record yet.", "Your requirements appear here once the school has a program and a record for you.")); return; }
      var pe = g.pace || {}, t = g.totals;
      var sub = [g.track ? g.track.name + " · " + g.track.total + " credits" : "", g.program && g.program.expectedGrad ? "Expected " + g.program.expectedGrad : ""].filter(Boolean).join(" · ");
      var sbar = P.head.querySelector(".cn-sub");
      if (sub) { if (sbar) sbar.textContent = sub; else P.head.appendChild(el("p", "cn-sub", esc(sub))); }
      K.cxMetrics(s, [
        { label: "Credits earned", value: num(t.earned), note: "of " + num(g.track ? g.track.total : 0), line: t.percent },
        { label: "Remaining", value: num(t.remaining) },
        { label: "At this school", value: g.residency ? num(g.residency.earnedAtEhs) : null, note: g.residency ? "of " + num(g.residency.minAtEhs) + " required here" : "" },
        { label: "At this pace", value: pe.finishBy ? pe.finishBy : null, note: pe.perYear ? num(pe.perYear) + " credits a year" : "" }
      ]);
      s.appendChild(el("h3", "sx-h3", "Requirements"));
      var groups = el("div", "sx-reqs");
      (g.groups || []).forEach(function (grp) {
        var row = el("div", "sx-req");
        var p = grp.required > 0 ? Math.min(100, grp.earned / grp.required * 100) : 100;
        row.innerHTML = "<span class='t'><b>" + esc(grp.name) + "</b><small>" + (grp.left > 0 ? num(grp.left) + " still needed" : "Complete") + "</small></span>" +
          "<span class='v'>" + esc(num(grp.earned)) + "<small> / " + esc(num(grp.required)) + "</small></span>" + X.bar(p, p >= 100 ? "ok" : "");
        groups.appendChild(row);
        var areas = (g.areas || []).filter(function (a) { return a.group === grp.key && (grp.areas || []).length > 1; });
        areas.forEach(function (a) {
          var r2 = el("div", "sx-req sub");
          var p2 = a.required > 0 ? Math.min(100, a.earned / a.required * 100) : 100;
          r2.innerHTML = "<span class='t'><b>" + esc(a.name) + "</b></span><span class='v'>" + esc(num(a.earned)) + "<small> / " + esc(num(a.required)) + "</small></span>" + X.bar(p2, p2 >= 100 ? "ok" : "");
          groups.appendChild(r2);
        });
      });
      s.appendChild(groups);
      if (g.exams && g.exams.length) {
        s.appendChild(el("h3", "sx-h3", "Required exams"));
        var et = K.cnTable([{ label: "Exam", w: "minmax(180px, 1.5fr)" }, { label: "Sitting", w: "120px" }, { label: "Score", w: "90px", align: "right" }, { label: "Result", w: "120px" }]);
        g.exams.forEach(function (e) { et.row(["<b>" + esc(e.name) + "</b>", esc(e.sitting || ""), e.score != null ? esc(String(e.score)) : X.none(), X.pill(e.passed ? "Passed" : e.status || "Not passed", e.passed ? "ok" : "orange")]); });
        s.appendChild(et);
      }
      [["check", "To confirm with the school"], ["info", "Notes"]].forEach(function (lv) {
        var list = (g.checks || []).filter(function (c) { return (c.level || "info") === lv[0]; });
        if (!list.length) return;
        s.appendChild(el("h3", "sx-h3", lv[1]));
        list.forEach(function (c) { s.appendChild(el("div", "sx-post", "<b>" + esc(c.title) + "</b><p>" + esc(c.detail) + "</p>")); });
      });
      if (g.assumptions && g.assumptions.length) X.note(s, g.assumptions.join(" "));
    }).catch(function (e) { n.remove(); X.failedAt(s, e, function () { K.open("graduation"); }); });
  };

  /* ============================================================== Profile */
  function recordBlock(rec) {
    var box = el("div");
    if (rec.summary) box.appendChild(el("p", "sx-prose", esc(rec.summary)));
    if (rec.facts && rec.facts.length) box.appendChild(X.dl(rec.facts.map(function (f) { return [f.label, f.value]; })));
    if (rec.columns && rec.rows && rec.rows.length) {
      var t = K.cnTable(rec.columns.map(function (c) { return { label: c, w: "minmax(90px, 1fr)" }; }));
      rec.rows.forEach(function (r) { t.row(r.map(function (c) { return esc(c); })); });
      box.appendChild(t);
    }
    if (rec.notes) box.appendChild(el("p", "cx-note", esc(rec.notes)));
    return box;
  }
  X.pages.profile = function (v) {
    var me = X.me();
    var P = X.page(v, "Me", me.name, esc(K.schoolName()));
    var s = slot(v);
    var n = X.waiting(s, "your profile");
    Promise.all([settle(D.grad()), settle(D.contact()), settle(D.guardians()), settle(D.records())]).then(function (r) {
      n.remove();
      var g = r[0].ok ? r[0].v : null, contact = r[1].ok ? r[1].v : null, guardians = r[2].ok ? r[2].v : [], records = r[3].ok ? r[3].v : {};
      var grid = el("div", "cx-grid");
      s.appendChild(grid);

      var st = K.cxSection(grid, "cx-s6", "Student", "");
      st.appendChild(X.dl([
        ["Name", me.name],
        ["Sign-in", me.email],
        ["Date of birth", contact && contact.dateOfBirth ? longDayYear(contact.dateOfBirth) : null],
        ["Grade", g && g.program && g.program.gradeLevel ? "Grade " + g.program.gradeLevel : null],
        ["Program", g && g.program ? g.program.name : null],
        ["Enrolled", g && g.enrollment && g.enrollment.enrolledOn ? longDayYear(g.enrollment.enrolledOn) : null],
        ["Expected graduation", g && g.program ? g.program.expectedGrad : null],
        ["School", K.schoolName()]
      ]));

      var ct = K.cxSection(grid, "cx-s6", "Contact", "", { label: "Edit", go: function () { editContact(contact); } });
      ct.appendChild(X.dl([
        ["Mailing address", contact && contact.mailingAddress],
        ["Cell phone", contact && contact.cellPhone],
        ["Other phone", contact && contact.altPhone]
      ]));
      if (!contact || (!contact.mailingAddress && !contact.cellPhone && !contact.altPhone)) ct.appendChild(el("p", "sx-quiet", "No contact details are on file. Add them so the school can reach you."));
      else if (contact.updatedAt) X.note(ct, "Last changed " + X.relDay(contact.updatedAt) + ".");

      var fam = K.cxSection(grid, "cx-s12", "Family", guardians.length ? plural(guardians.length, "guardian") : "");
      if (!guardians.length) fam.appendChild(el("p", "sx-quiet", "No guardian is linked to your record. The office adds them."));
      else {
        var t = K.cnTable([{ label: "Name", w: "minmax(150px, 1.2fr)" }, { label: "Relationship", w: "130px" }, { label: "Phone", w: "150px" }, { label: "Email", w: "minmax(180px, 1.2fr)" }]);
        guardians.forEach(function (gd) {
          t.row(["<b>" + esc(gd.name) + "</b>" + (gd.primary ? "<span class='cn-sub2'>Primary contact</span>" : ""), esc(gd.relationship || ""),
                 gd.contact && gd.contact.cellPhone ? esc(gd.contact.cellPhone) : X.none(), gd.email ? esc(gd.email) : X.none()]);
        });
        fam.appendChild(t);
      }

      // What the school has written down, section by section
      var NAMES = { student: "About the student", emergency: "Emergency contact", enrollment: "Enrollment", documents: "Documents on file", transportation: "Transportation", schedule: "Timetable notes" };
      Object.keys(NAMES).forEach(function (k) {
        var rec = records[k];
        if (!rec || (!rec.summary && !(rec.facts && rec.facts.length) && !(rec.rows && rec.rows.length) && !rec.notes)) return;
        var c = K.cxSection(grid, "cx-s12", NAMES[k], rec.updatedAt ? "Updated " + X.relDay(rec.updatedAt) : "");
        c.appendChild(recordBlock(rec));
      });
      if (g && g.transfer) {
        var dc = K.cxSection(grid, "cx-s12", "Documents on file", "");
        dc.appendChild(X.dl([
          ["Transcript", g.transfer.school + (g.transfer.authority ? " · " + g.transfer.authority : "")],
          ["Kind", g.transfer.kind === "official" ? "Official, sent by the school" : "Copy supplied by the family"],
          ["Printed", g.transfer.printedOn], ["Status", (g.transfer.statusSteps || [])[g.transfer.statusAt] || g.transfer.status]
        ]));
        X.note(dc, "The files themselves are kept by the school. Ask the registrar for a copy.");
      }

      // What the school has in place for them
      Promise.all([settle(API.items.list({ kind: "senplan", subjectId: me.id })), settle(API.items.list({ kind: "accommodation", subjectId: me.id }))]).then(function (r) {
        var plans = r[0].ok ? r[0].v.filter(function (x) { return x.status !== "draft" && x.status !== "ended"; }) : [];
        var acc = r[1].ok ? r[1].v.filter(function (x) { return x.status === "active"; }) : [];
        if (!plans.length && !acc.length) return;
        var c = K.cxSection(grid, "cx-s12", "Support in place", "");
        plans.forEach(function (x) {
          c.appendChild(X.dl([[x.data.type || "Plan", x.title], ["Goals", x.data.goals], ["Services", x.data.services],
            ["Next review", x.data.reviewOn ? longDayYear(x.data.reviewOn) : null]]));
        });
        acc.forEach(function (x) {
          c.appendChild(X.dl([["Accommodation", x.title], ["Extra time", x.data.extraTime ? x.data.extraTime + "%" : null], ["Tools", x.data.tools],
            ["Setting", x.data.setting], ["Applies to", x.data.appliesTo]]));
        });
      });

      // How this page looks on this device
      var ap = K.cxSection(grid, "cx-s12", "On this device", "");
      var sel = el("select", "cx-select sx-sel");
      [["light", "Light"], ["dark", "Dark"], ["auto", "Match this computer"]].forEach(function (o) {
        var op = el("option"); op.value = o[0]; op.textContent = o[1]; if (K.appearance() === o[0]) op.selected = true; sel.appendChild(op);
      });
      sel.addEventListener("change", function () { K.setAppearance(sel.value); });
      var row = el("label", "sx-field");
      row.appendChild(el("span", null, "Appearance"));
      row.appendChild(sel);
      ap.appendChild(row);
      var acts = el("div", "sx-acts");
      acts.appendChild(X.button("Password and sessions", "cn-btn", function () { K.open("account"); }));
      acts.appendChild(X.button("Sign out", "cn-btn", function () { K.signOut(); }));
      ap.appendChild(acts);
    }).catch(function (e) { n.remove(); X.failedAt(s, e, function () { K.open("profile"); }); });
  };
  function longDayYear(s) { var d = X.parse(s); return X.DOWL[d.getDay()] + ", " + X.MON[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }

  function editContact(c) {
    c = c || {};
    var addr = el("textarea", "sx-in"); addr.rows = 3; addr.maxLength = 400; addr.value = c.mailingAddress || "";
    function inp(v, ph) { var i = el("input", "sx-in"); i.type = "text"; i.maxLength = 40; i.value = v || ""; if (ph) i.placeholder = ph; return i; }
    var cell = inp(c.cellPhone, "(555) 555-0100"), alt = inp(c.altPhone);
    function field(label, node) { var l = el("label", "sx-field"); l.appendChild(el("span", null, esc(label))); l.appendChild(node); return l; }
    X.dialog({ title: "Edit contact", sub: "The school uses these to reach you. Your date of birth and your family’s details are changed by the office.",
      body: function (host) { host.appendChild(field("Mailing address", addr)); host.appendChild(field("Cell phone", cell)); host.appendChild(field("Other phone", alt)); },
      action: "Save",
      onSubmit: function () {
        return API.family.contact(X.me().id, { mailingAddress: addr.value.trim() || null, cellPhone: cell.value.trim() || null, altPhone: alt.value.trim() || null,
          dateOfBirth: c.dateOfBirth || null }).then(function () { X.bust("contact"); toast("Saved"); K.open("profile"); });
      } });
  }

  /* ======================================================= Forms and fees */
  X.pages.forms = function (v) {
    X.page(v, "School", "Forms and fees", "Forms the school asks you to read and sign, and what is owed.");
    var s = slot(v);
    var n = X.waiting(s, "your forms");
    var me = X.me();
    Promise.all([API.items.list({ kind: "form" }), API.items.list({ kind: "signature", subjectId: me.id }),
                 settle(API.items.list({ kind: "invoice", subjectId: me.id })), settle(API.items.list({ kind: "payment", subjectId: me.id }))]).then(function (r) {
      n.remove();
      var forms = r[0].filter(function (f) { return f.status === "open" || f.data.audience !== "staff"; }), sigs = r[1];
      var signed = {};
      sigs.forEach(function (x) { signed[x.data.formId] = x; });
      s.appendChild(el("h3", "sx-h3", "Forms"));
      if (!forms.length) s.appendChild(el("p", "sx-quiet", "No forms."));
      else {
        var t = K.cnTable([{ label: "Form", w: "minmax(200px, 1.6fr)" }, { label: "Posted", w: "110px" }, { label: "", w: "120px" }]);
        forms.forEach(function (f) {
          var sg = signed[f.id];
          t.row(["<b>" + esc(f.title) + "</b>", esc(f.dueOn || X.relDay(f.createdAt)), sg ? X.pill(sg.status === "signed" ? "Signed" : "Declined", sg.status === "signed" ? "ok" : "") : X.pill(f.status === "open" ? "To sign" : "Closed", f.status === "open" ? "orange" : "")],
            function () { openForm(f, sg); });
        });
        s.appendChild(t);
      }
      s.appendChild(el("h3", "sx-h3", "Fees"));
      var inv = r[2].ok ? r[2].v : [], pay = r[3].ok ? r[3].v : [];
      if (!inv.length) s.appendChild(el("p", "sx-quiet", "Nothing is owed and nothing has been invoiced."));
      else {
        var paid = {};
        pay.forEach(function (p) { if (p.status !== "refunded") paid[p.data.invoiceId] = (paid[p.data.invoiceId] || 0) + Number(p.data.amount || 0); });
        var it = K.cnTable([{ label: "Invoice", w: "minmax(180px, 1.4fr)" }, { label: "Due", w: "110px" }, { label: "Total", w: "90px", align: "right" }, { label: "Paid", w: "90px", align: "right" }, { label: "", w: "100px" }]);
        inv.forEach(function (x) {
          var p = paid[x.id] || 0;
          it.row(["<b>" + esc(x.title) + "</b>", esc(x.dueOn || ""), esc(num(x.data.total)), esc(num(p)), X.pill(x.status, x.status === "paid" ? "ok" : x.status === "issued" ? "orange" : "")],
            function () { X.dialog({ title: x.title, sub: "Due " + (x.dueOn || "—"), body: function (h) { h.appendChild(el("pre", "sx-prose", esc(x.data.lines || ""))); } }); });
        });
        s.appendChild(it);
        X.note(s, "Payments are recorded by the office. Ask them how to pay.");
      }
    }).catch(function (e) { n.remove(); X.failedAt(s, e, function () { K.open("forms"); }); });
  };
  function openForm(f, sg) {
    var name = el("input", "sx-in");
    name.type = "text"; name.placeholder = "Type your full name"; name.value = sg ? sg.data.typedName : "";
    X.dialog({ title: f.title, sub: "Read it, then sign by typing your name.", wide: true,
      body: function (h) {
        h.appendChild(el("p", "sx-prose", esc(f.data.body || "")));
        if (sg) h.appendChild(el("p", "cx-note", esc((sg.status === "signed" ? "Signed" : "Declined") + " as " + sg.data.typedName + ".")));
        else if (f.status === "open") { var l = el("label", "sx-field"); l.appendChild(el("span", null, "Your name")); l.appendChild(name); h.appendChild(l); }
      },
      action: !sg && f.status === "open" ? "Sign" : null,
      onSubmit: function () {
        if (name.value.trim().length < 2) throw new Error("Type your name to sign.");
        return API.items.create({ kind: "signature", title: "Signed: " + f.title, subjectId: X.me().id, status: "signed", data: { formId: f.id, typedName: name.value.trim() } })
          .then(function () { toast("Signed"); K.open("forms"); });
      } });
  }

  /* ============================================================= Account */
  function uaName(ua) {
    ua = String(ua || "");
    var b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "A browser";
    var o = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Mac OS X|Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /CrOS/.test(ua) ? "Chromebook" : /Linux/.test(ua) ? "Linux" : "";
    return b + (o ? " on " + o : "");
  }
  X.pages.account = function (v) {
    var me = X.me();
    X.page(v, "Me", "Account", "How you sign in, and where you are signed in.");
    var s = slot(v);
    var grid = el("div", "cx-grid");
    s.appendChild(grid);

    var who = K.cxSection(grid, "cx-s6", "Sign-in", "");
    who.appendChild(X.dl([["Name", me.name], ["Email", me.email], ["School", K.schoolName()]]));
    X.note(who, "This is your Oplo Account. Your password is typed only on the Oplo sign-in page and is never kept in this browser.");

    var pw = K.cxSection(grid, "cx-s6", "Password", "");
    function field(label, auto) {
      var l = el("label", "sx-field"), i = el("input", "sx-in");
      i.type = "password"; i.autocomplete = auto;
      l.appendChild(el("span", null, esc(label))); l.appendChild(i);
      pw.appendChild(l);
      return i;
    }
    var cur = field("Current password", "current-password"), nxt = field("New password", "new-password");
    var go = X.button("Change password", "cn-btn strong", function () {
      if (!cur.value || !nxt.value) { toast("Both fields, please."); return; }
      go.disabled = true;
      API.changePassword(cur.value, nxt.value).then(function () {
        go.disabled = false; cur.value = ""; nxt.value = "";
        toast("Changed. Every other session has been signed out.");
      }, function (e) { go.disabled = false; toast(e && e.message ? e.message : "That did not work."); });
    });
    pw.appendChild(go);
    X.note(pw, "Changing it signs you out everywhere else.");

    var dev = K.cxSection(grid, "cx-s12", "Where you are signed in", "");
    var box = el("div");
    dev.appendChild(box);
    function draw() {
      box.innerHTML = "";
      var n = X.waiting(box, "your sessions");
      API.sessions().then(function (list) {
        n.remove();
        list.sort(function (a, b) { return (b.current ? 1 : 0) - (a.current ? 1 : 0) || (b.lastSeenAt || 0) - (a.lastSeenAt || 0); });
        var t = K.cnTable([{ label: "Device", w: "minmax(180px, 1.4fr)" }, { label: "Signed in", w: "140px" }, { label: "Last used", w: "140px" }, { label: "", w: "110px" }]);
        list.forEach(function (x) {
          t.row(["<b>" + esc(uaName(x.userAgent)) + "</b>", esc(X.relDay(x.createdAt)), esc(x.current ? "Now" : X.relDay(x.lastSeenAt || x.createdAt)), x.current ? X.pill("This one", "blue") : ""]);
        });
        box.appendChild(t);
        var others = list.filter(function (x) { return !x.current; }).length;
        var acts = el("div", "sx-acts");
        var out = X.button("Sign out everywhere else", "cn-btn", function () {
          out.disabled = true;
          API.revokeSessions().then(function () { toast("Signed out everywhere else."); draw(); }, function (e) { out.disabled = false; toast(e && e.message ? e.message : "That did not work."); });
        });
        out.disabled = !others;
        acts.appendChild(out);
        acts.appendChild(X.button("Sign out of this browser", "cn-btn", function () { K.signOut(); }));
        box.appendChild(acts);
      }).catch(function () { n.remove(); box.appendChild(el("p", "sx-quiet", "Your sessions could not be read from the server.")); });
    }
    draw();
  };

  /* ============================================================= Requests */
  var RANK = { 0: "Required by the school", 1: "First choice", 2: "Second choice", 3: "Third choice" };
  X.pages.requests = function (v) {
    X.page(v, "Me", "Requests", "The courses you would like to take next year. The school builds the schedule from what students ask for.");
    var s = slot(v);
    var n = X.waiting(s, "your requests");
    Promise.all([D.requests(), D.subjects(), D.sections(), settle(API.items.list({ kind: "prereq" }))]).then(function (r) {
      n.remove();
      var list = r[0].map(function (x) { return { subjectId: x.subjectId, rank: x.rank, title: x.title, number: x.number }; });
      var subjects = r[1].filter(function (x) { return !x.retired && x.requestable; });
      var now = r[2];
      var title = {};
      r[1].forEach(function (x) { title[x.id] = x.number + " · " + x.title; });
      var needs = {};
      (r[3].ok ? r[3].v : []).forEach(function (p) { (needs[p.data.subjectId] = needs[p.data.subjectId] || []).push((p.status === "recommended" ? "recommended: " : "") + (title[p.data.requires] || "another course")); });
      var box = el("div", "sx-reqbox");
      s.appendChild(box);
      function draw() {
        box.innerHTML = "";
        var req = list.filter(function (x) { return x.rank === 0; });
        var mine = list.filter(function (x) { return x.rank !== 0; });
        if (req.length) {
          box.appendChild(el("h3", "sx-h3", "Required"));
          req.forEach(function (x) { box.appendChild(el("div", "sx-askrow", "<b>" + esc(x.number ? x.number + " · " + x.title : x.title) + "</b><span class='sx-pill'>Set by the school</span>")); });
        }
        box.appendChild(el("h3", "sx-h3", "Your choices"));
        if (!mine.length) box.appendChild(el("p", "sx-quiet", "You have not asked for any course yet."));
        mine.forEach(function (x) {
          var row = el("div", "sx-askrow");
          row.appendChild(el("b", null, esc(x.number ? x.number + " · " + x.title : x.title)));
          var sel = el("select", "cx-select sx-sel");
          [1, 2, 3].forEach(function (k) { var o = el("option"); o.value = k; o.textContent = RANK[k]; if (x.rank === k) o.selected = true; sel.appendChild(o); });
          sel.addEventListener("change", function () { x.rank = +sel.value; });
          row.appendChild(sel);
          var rm = X.button("×", "sx-rm", function () { list.splice(list.indexOf(x), 1); draw(); });
          rm.setAttribute("aria-label", "Remove");
          row.appendChild(rm);
          box.appendChild(row);
        });
        var have = {};
        list.forEach(function (x) { have[x.subjectId] = true; });
        var takingNow = {};
        now.forEach(function (sec) { if (sec.subjectId) takingNow[sec.subjectId] = true; });
        var offer = subjects.filter(function (x) { return !have[x.id]; });
        var foot = el("div", "sx-askfoot");
        if (offer.length) {
          var pick = el("select", "cx-select sx-sel");
          var o0 = el("option"); o0.value = ""; o0.textContent = "Add a course"; pick.appendChild(o0);
          offer.forEach(function (x) { var o = el("option"); o.value = x.id; o.textContent = x.number + " · " + x.title + (takingNow[x.id] ? " (you take this now)" : "") + (x.approval ? " — needs a teacher’s recommendation" : "") + (needs[x.id] ? " — requires " + needs[x.id].join(", ") : ""); pick.appendChild(o); });
          pick.addEventListener("change", function () {
            if (!pick.value) return;
            var sub = offer.filter(function (x) { return x.id === pick.value; })[0];
            list.push({ subjectId: sub.id, rank: Math.min(3, mine.length + 1), title: sub.title, number: sub.number });
            draw();
          });
          foot.appendChild(pick);
        } else foot.appendChild(el("p", "sx-quiet", "The school has not opened any course for requests."));
        var save = X.button("Save my choices", "cn-btn strong", function () {
          save.disabled = true;
          SC.putRequests(X.me().id, list.filter(function (x) { return x.rank !== 0; }).map(function (x) { return { subjectId: x.subjectId, rank: x.rank }; })).then(function () {
            X.bust("requests"); toast("Saved"); save.disabled = false;
          }, function (e) { save.disabled = false; toast(e && e.message ? e.message : "That was not saved."); });
        });
        foot.appendChild(save);
        box.appendChild(foot);
        X.note(box, "A second or third choice is used only when a first choice cannot be placed. Asking is not a promise of a seat.");
      }
      draw();
    }).catch(function (e) { n.remove(); X.failedAt(s, e, function () { K.open("requests"); }); });
  };

  Object.keys(X.pages).forEach(function (k) { X.api[k] = X.pages[k]; });
};
