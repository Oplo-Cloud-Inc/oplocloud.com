/* ==========================================================================
   OEdu — the student's view of the school's record.

   This is not a place to learn. Learning is Kern's. This is where a student
   reads what the school holds about them and what the school expects of them,
   the way a family reads it and a registrar keeps it: the day's timetable,
   what is due, the grades as marked, whether a register has them present, the
   credits toward a diploma, the contact card, the courses they have asked for.

   Nothing here is a score for being here. There is no streak, no rank, no
   badge, no tutor and no next lesson. A number on this page is a fact the
   school entered or a sum the server made of facts the school entered, and
   every one says where it came from.

     Overview     today, what is due, what needs attention
     Schedule     the week and the month, as the school set them
     Courses      each section: teachers, period, room, grade, attendance
     Assignments  every piece of work set, and where each stands
     Grades       current marks, how each is made, what a goal needs
     Attendance   registers, by day and by course, with the school's own codes
     Transcript   the record by year, with credits and the grade-point average
     Graduation   the requirements, credit by credit
     Profile      the student, contact, family, documents
     Requests     the courses asked for next year

   Mounted by app.js with the console kit: OPLO_STUDENT(kit) →
   { today, schedule, courses, assignments, grades, attendance, transcript,
     graduation, profile, requests, find }. The server decides what each
   request may read; a page shown to the wrong person is refused every row.
   ========================================================================== */
window.OPLO_STUDENT = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast, SC = API.schedule;
  var X = { K: K, pages: {}, api: {} };

  /* ------------------------------------------------------------- Dates */
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DOWL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function todayIso() { return iso(new Date()); }
  function short(s) { var d = parse(s); return DOWS[d.getDay()] + " " + MONS[d.getMonth()] + " " + d.getDate(); }
  function longDay(s) { var d = parse(s); return DOWL[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate(); }
  function monthName(s) { var d = parse(s); return MON[d.getMonth()] + " " + d.getFullYear(); }
  function mondayOf(s) { var d = parse(s), k = (d.getDay() + 6) % 7; return addDays(s, -k); }
  function relDay(ms) {
    if (ms == null) return "";
    var d = iso(new Date(ms)), t = todayIso();
    if (d === t) return "Today";
    if (d === addDays(t, 1)) return "Tomorrow";
    if (d === addDays(t, -1)) return "Yesterday";
    return short(d);
  }
  function clock(t) {
    if (!t) return "";
    var h = +String(t).slice(0, 2);
    return (h % 12 || 12) + ":" + String(t).slice(3, 5) + (h < 12 ? " AM" : " PM");
  }
  function span(a, b) {
    if (!a) return "";
    if (!b) return clock(a);
    // Both in the morning or both in the afternoon: say AM or PM once.
    var same = (+a.slice(0, 2) < 12) === (+b.slice(0, 2) < 12);
    return same ? clock(a).replace(/ [AP]M$/, "") + " – " + clock(b) : clock(a) + " – " + clock(b);
  }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }
  function num(n) { return n == null ? "" : String(Math.round(Number(n) * 100) / 100); }
  function pctOf(a, b) { return b > 0 ? Math.round(a / b * 1000) / 10 : null; }
  function settle(p) { return Promise.resolve(p).then(function (v) { return { ok: true, v: v }; }, function (e) { return { ok: false, e: e }; }); }
  function me() { return K.S.me; }

  /* The school year this date is in: July to June. */
  function yearOf(s) {
    var d = parse(s || todayIso()), y = d.getFullYear();
    return d.getMonth() >= 6 ? { from: y + "-07-01", to: (y + 1) + "-06-30" } : { from: (y - 1) + "-07-01", to: y + "-06-30" };
  }

  /* ------------------------------------------------------------ Pieces */
  function pill(text, tone) { return "<span class='sx-pill" + (tone ? " " + tone : "") + "'>" + esc(text) + "</span>"; }
  function none(t) { return "<span class='cn-none'>" + esc(t || "—") + "</span>"; }
  function button(text, cls, go) {
    var b = el("button", cls || "en-btn", esc(text));
    b.type = "button";
    if (go) b.addEventListener("click", go);
    return b;
  }
  function backLink(text, go) {
    var b = el("button", "sx-back", "<span aria-hidden='true'>‹</span> " + esc(text));
    b.type = "button";
    b.addEventListener("click", go);
    return b;
  }
  function note(host, text) { host.appendChild(el("p", "cx-note", esc(text))); }
  function waiting(host, what) { return K.loading(host, what); }
  function bar(p, tone) {
    return "<span class='sx-bar" + (tone ? " " + tone : "") + "'><i style='width:" + Math.max(0, Math.min(100, p || 0)) + "%'></i></span>";
  }
  function tone(p) { return p == null ? "" : p >= 80 ? "ok" : p >= 70 ? "" : p >= 60 ? "orange" : "red"; }
  function gradeHtml(g) {
    if (!g || g.percent == null) return none("No marks yet");
    return "<b class='sx-gr " + tone(g.percent) + "'>" + esc(g.letter || "") + "</b><span class='sx-pc'>" + num(g.percent) + "%</span>";
  }
  function dl(rows) {
    var d = el("dl", "sx-dl");
    rows.forEach(function (r) {
      if (r[1] == null || r[1] === "") return;
      d.appendChild(el("dt", null, esc(r[0])));
      var dd = el("dd");
      if (r[1] && r[1].nodeType) dd.appendChild(r[1]); else dd.innerHTML = esc(r[1]);
      d.appendChild(dd);
    });
    return d;
  }
  /* A sheet with a body and one decision. Buttons are .en-btn because the
     console's sheet closes on any .cn-btn pressed inside it. */
  function dialog(o) {
    var box = el("div", "en-dlg" + (o.wide ? " en-wide" : ""));
    box.appendChild(el("h2", "en-dlg-h", esc(o.title)));
    if (o.sub) box.appendChild(el("p", "en-dlg-sub", esc(o.sub)));
    var host = el("div", "en-dlg-body");
    box.appendChild(host);
    var err = el("div", "en-dlg-err");
    err.hidden = true;
    box.appendChild(err);
    var acts = el("div", "en-dlg-acts en-wrap");
    var sheet = null;
    var ctl = { close: function () { if (sheet) sheet.close(); }, error: function (m) { err.hidden = !m; err.textContent = m || ""; } };
    acts.appendChild(button(o.action ? "Cancel" : "Close", "en-btn quiet", ctl.close));
    if (o.action) {
      var go = button(o.action, "en-btn strong", function () {
        ctl.error("");
        go.disabled = true;
        var out;
        try { out = o.onSubmit(ctl); } catch (e) { go.disabled = false; ctl.error(e.message); return; }
        Promise.resolve(out).then(function () { ctl.close(); }, function (e) { go.disabled = false; ctl.error(e && e.message ? e.message : "That did not work."); });
      });
      acts.appendChild(go);
    }
    box.appendChild(acts);
    sheet = K.cxSheet(box);
    if (o.body) o.body(host, ctl);
    return ctl;
  }
  function page(v, eyebrow, title, sub) { return K.cxPage(v, eyebrow, title, sub); }
  function failedAt(host, e, retry) { K.failed(waiting(host, ""), e, retry); }

  /* -------------------------------------------------------------- Data
     Each read is kept for under a minute, so moving between pages does not
     read the record again, and is dropped when this student changes anything. */
  var CACHE = {};
  function cached(key, ttl, fn) {
    var h = CACHE[key];
    if (h && Date.now() - h.at < ttl) return h.p;
    var p = Promise.resolve().then(fn);
    CACHE[key] = { at: Date.now(), p: p };
    p.catch(function () { delete CACHE[key]; });
    return p;
  }
  var D = {
    sections: function () { return cached("sections", 60000, function () { return SC.studentSections(me().id); }); },
    work: function () { return cached("work", 30000, function () { return API.reporting.coursework(); }); },
    report: function () { return cached("report", 30000, function () { return API.reporting.report(me().id); }); },
    register: function () { return cached("register", 30000, function () { return API.attendance.family(me().id); }); },
    codes: function () { return cached("codes", 120000, function () { return API.attendance.codes(); }); },
    grad: function () { return cached("grad", 60000, function () { return API.graduation.get(me().id); }); },
    contact: function () { return cached("contact", 60000, function () { return API.family.getContact(me().id); }); },
    guardians: function () { return cached("guardians", 60000, function () { return API.family.guardians(me().id); }); },
    records: function () { return cached("records", 60000, function () { return API.family.records(me().id); }); },
    subjects: function () { return cached("subjects", 120000, function () { return SC.subjects(); }); },
    requests: function () { return cached("requests", 20000, function () { return SC.requests({ accountId: me().id }); }); },
    periods: function () { return cached("periods", 60000, function () { return API.periods.list(); }); },
    calendar: function (from, to) { return cached("cal:" + from + ":" + to, 60000, function () { return SC.calendar(from, to); }); },
    day: function (date) { return cached("day:" + date, 45000, function () { return SC.mine(date); }); },
    announce: function (courseId) { return cached("ann:" + courseId, 60000, function () { return API.courses.docs(courseId, "announce"); }); },
    assessments: function () { return cached("assess", 30000, function () { return API.assessments.mine(); }); }
  };
  X.D = D;
  X.bust = function (prefix) {
    Object.keys(CACHE).forEach(function (k) { if (!prefix || k.indexOf(prefix) === 0) delete CACHE[k]; });
  };

  /* ---------------------------------------------------------- Derived */
  function teacherNames(sec) {
    return (sec && sec.teachers || []).map(function (t) { return t.name; }).join(", ");
  }
  /* A section's periods said once: a course that meets in M3, T3, W3, R3 and F3
     is in period 3, not in five periods. */
  function periodName(periods) {
    var p = periods || [];
    if (p.length < 2) return p.join("");
    var tails = p.map(function (x) { return String(x).replace(/^[A-Za-z]+/, ""); });
    var same = tails.every(function (t) { return t && t === tails[0]; });
    return same ? tails[0] : p.join(", ");
  }
  /* The first teacher, and how many more: a schedule block has room for one name. */
  function teacherShort(sec) {
    var t = (sec && sec.teachers || []).map(function (x) { return x.name; });
    return !t.length ? "" : t.length === 1 ? t[0] : t[0] + " +" + (t.length - 1);
  }
  /* The labels of a section's periods that run on this day: M1 on a Monday,
     not M1, T1, W1, R1 and F1. */
  function periodsToday(x, entry) {
    var run = entry && entry.periods;
    var mine = (x.periods || []).filter(function (p) { return !run || run.indexOf(p) > -1; });
    return mine.length ? mine : (x.periods || []);
  }
  function byCourse(list) {
    var m = {};
    (list || []).forEach(function (s) { m[s.courseId] = s; });
    return m;
  }
  /* The one place a piece of work is put in a state, so every page says the
     same thing about it. */
  function stateOf(w, now) {
    now = now || Date.now();
    if (w.status === "marked" && w.score != null) return "graded";
    if (w.status === "excused") return "excused";
    if (w.status === "missing") return "missing";
    if (w.submittedAt) return "handed";
    if (w.dueAt && w.dueAt < now) return "late";
    return "todo";
  }
  var STATE_TEXT = { graded: "Graded", excused: "Excused", missing: "Missing", handed: "Handed in", late: "Past due", todo: "To do" };
  var STATE_TONE = { graded: "", excused: "", missing: "red", handed: "blue", late: "orange", todo: "" };
  function statePill(s) { return pill(STATE_TEXT[s], STATE_TONE[s]); }
  function scoreText(w) {
    if (w.status === "marked" && w.score != null) return num(w.score) + " / " + num(w.outOf);
    return num(w.outOf) + " pts";
  }
  function dueText(w) {
    if (!w.dueAt) return "No due date";
    return relDay(w.dueAt);
  }

  /* A student's registers, read with the school's own codes: what each mark
     means, and how it counts. Present, tardy and excused are in the room for
     a rate; absent is not. */
  function regModel(reg, codesRes) {
    var online = !reg || reg.online !== false;
    var byKey = {};
    ((codesRes && codesRes.codes) || []).forEach(function (c) { byKey[c.key] = c; });
    function info(status) {
      var c = byKey[status];
      return c || { key: status, label: String(status || ""), mark: String(status || "?").slice(0, 1).toUpperCase(), kind: "present" };
    }
    var rows = ((reg && reg.attendance) || []).slice().sort(function (a, b) { return a.day < b.day ? 1 : a.day > b.day ? -1 : 0; });
    var tot = { present: 0, tardy: 0, absent: 0, excused: 0, marks: 0 };
    var days = {};
    rows.forEach(function (r) {
      var c = info(r.status);
      r.kind = c.kind; r.label = c.label; r.mark = c.mark;
      if (c.kind === "norecord") return;
      tot[c.kind] = (tot[c.kind] || 0) + 1;
      tot.marks++;
      var d = days[r.day] || (days[r.day] = { day: r.day, n: 0, away: 0, tardy: 0, rows: [] });
      d.n++;
      if (c.kind === "absent" || c.kind === "excused") d.away++;
      if (c.kind === "tardy") d.tardy++;
      d.rows.push(r);
    });
    var inRoom = tot.present + tot.tardy + tot.excused;
    var list = Object.keys(days).map(function (k) { return days[k]; });
    var dayState = function (d) { return d.away >= d.n ? "absent" : d.away > 0 ? "partial" : d.tardy > 0 ? "tardy" : "present"; };
    list.forEach(function (d) { d.state = dayState(d); });
    return {
      online: online, rows: rows, totals: tot, days: days, dayList: list,
      rate: pctOf(inRoom, tot.marks), info: info,
      daysAbsent: list.filter(function (d) { return d.state === "absent"; }).length,
      daysPartial: list.filter(function (d) { return d.state === "partial"; }).length,
      daysTardy: list.filter(function (d) { return d.state === "tardy"; }).length
    };
  }
  X.regModel = regModel;

  /* What a student should look at, in the order the school would raise it.
     Plain statements of record, each with where to look. */
  function noticesFor(o) {
    var out = [], now = Date.now();
    var work = o.work || [];
    var missing = work.filter(function (w) { return stateOf(w, now) === "missing"; });
    var late = work.filter(function (w) { return stateOf(w, now) === "late"; });
    if (missing.length) out.push({ tone: "red", text: plural(missing.length, "piece of work is", "pieces of work are") + " marked missing" +
      (missing.length <= 2 ? ": " + missing.map(function (w) { return w.title + " (" + w.courseTitle + ")"; }).join("; ") : "."), go: ["assignments", "late"] });
    if (late.length) out.push({ tone: "orange", text: plural(late.length, "piece of work is", "pieces of work are") + " past due and not handed in.", go: ["assignments", "late"] });
    var rep = o.report;
    if (rep) {
      rep.courses.forEach(function (c) {
        if (c.grade && c.grade.percent != null && c.grade.percent < 70) {
          out.push({ tone: c.grade.percent < 60 ? "red" : "orange", text: c.title + " is " + num(c.grade.percent) + "% (" + (c.grade.letter || "") + "), below a pass of 70%.", go: ["courses", c.courseId] });
        }
      });
    }
    var reg = o.reg;
    if (reg && reg.online) {
      if (reg.daysAbsent >= 3) out.push({ tone: "orange", text: plural(reg.daysAbsent, "full day") + " absent so far this year.", go: ["attendance"] });
      var unexcused = reg.rows.filter(function (r) { return r.kind === "absent"; });
      if (unexcused.length >= 3) out.push({ tone: "", text: plural(unexcused.length, "class absence") + " not excused this year.", go: ["attendance"] });
    }
    (o.off || []).slice(0, 2).forEach(function (d) {
      out.push({ tone: "", text: "No school " + short(d.day) + (d.label ? " — " + d.label : "") + ".", go: ["schedule"] });
    });
    return out;
  }

  /* ============================================================ Overview */
  X.pages.today = function (v) {
    var t0 = todayIso();
    var school = K.schoolName();
    var P = page(v, longDay(t0), "Overview", esc(school));
    var subEl = P.head.querySelector(".cn-sub");
    var metrics = K.cxMetrics(v, [{ label: "Attendance" }, { label: "Average" }, { label: "Due this week" }, { label: "Past due or missing" }]);
    var grid = el("div", "cx-grid");
    v.appendChild(grid);
    var secToday = K.cxSection(grid, "cx-s7", "Today", "");
    var secAttn = K.cxSection(grid, "cx-s5", "Needs attention", "");
    var secDue = K.cxSection(grid, "cx-s7", "Due soon", "", { label: "All assignments", go: function () { K.open("assignments"); } });
    var secMarks = K.cxSection(grid, "cx-s5", "Recent marks", "", { label: "Grades", go: function () { K.open("grades"); } });
    var secNews = K.cxSection(grid, "cx-s7", "Announcements", "");
    var secSoon = K.cxSection(grid, "cx-s5", "Coming up", "", { label: "Schedule", go: function () { K.open("schedule"); } });
    [[secToday, "today"], [secAttn, "notices"], [secDue, "work"], [secMarks, "marks"], [secNews, "announcements"], [secSoon, "the calendar"]]
      .forEach(function (x) { waiting(x[0], x[1]); });

    var year = yearOf(t0);
    Promise.all([
      settle(D.day(t0)), settle(D.work()), settle(D.report()), settle(D.register()), settle(D.codes()),
      settle(D.sections()), settle(D.calendar(t0, addDays(t0, 13))), settle(D.grad())
    ]).then(function (r) {
      var day = r[0], work = r[1], rep = r[2], regRaw = r[3], codes = r[4], secs = r[5], cal = r[6], grad = r[7];
      var secById = secs.ok ? byCourse(secs.v) : {};
      var w = work.ok ? work.v.work : [];
      var now = Date.now();

      // The line under the title: who, and where in the school.
      var g = grad.ok ? grad.v : null;
      var bits = [];
      if (g && g.program && g.program.gradeLevel) bits.push("Grade " + g.program.gradeLevel);
      if (g && g.program && g.program.name) bits.push(g.program.name);
      if (g && g.program && g.program.expectedGrad) bits.push("Class of " + String(g.program.expectedGrad).slice(0, 4));
      bits.push(school);
      if (subEl) subEl.textContent = me().name + " · " + bits.join(" · ");

      var reg = regRaw.ok ? regModel(regRaw.v, codes.ok ? codes.v : null) : null;
      var yearRows = reg ? regModel({ online: regRaw.v.online, attendance: regRaw.v.attendance.filter(function (x) { return x.day >= year.from && x.day <= year.to; }) }, codes.ok ? codes.v : null) : null;

      // Metrics
      var due7 = w.filter(function (x) { var s = stateOf(x, now); return (s === "todo" || s === "handed") && x.dueAt && x.dueAt <= now + 7 * 86400000; });
      var pastDue = w.filter(function (x) { var s = stateOf(x, now); return s === "late" || s === "missing"; });
      K.cxSetMetric(metrics, 0, { label: "Attendance", value: yearRows && yearRows.online && yearRows.rate != null ? yearRows.rate : null, unit: "%",
        note: !reg ? "" : !reg.online ? "Not shown by your school" : yearRows.totals.marks ? plural(yearRows.daysAbsent, "day") + " absent" : "No registers yet", go: function () { K.open("attendance"); } });
      K.cxSetMetric(metrics, 1, { label: "Average", value: rep.ok && rep.v.standing != null ? rep.v.standing : null, unit: "%",
        note: rep.ok ? plural(rep.v.courseCount, "course") : "", go: function () { K.open("grades"); } });
      K.cxSetMetric(metrics, 2, { label: "Due this week", value: work.ok ? due7.length : null, go: function () { K.open("assignments", "todo"); } });
      K.cxSetMetric(metrics, 3, { label: "Past due or missing", value: work.ok ? pastDue.length : null, bad: true, go: function () { K.open("assignments", "late"); } });

      // Today
      clear(secToday);
      if (!day.ok) { secToday.appendChild(el("p", "cx-note", esc("Today’s timetable could not be read."))); }
      else {
        var dd = day.v, entry = dd.day || {};
        if (entry.kind !== "school") {
          secToday.appendChild(el("p", "sx-quiet", "<b>No school</b>" + (entry.label ? " — " + esc(entry.label) : "") + "."));
        } else {
          var todayRows = {};
          if (reg) reg.rows.forEach(function (x) { if (x.day === t0) todayRows[x.courseId] = x; });
          var items = (dd.items || []).filter(function (x) { return x.meets && x.periods.length; });
          items.sort(function (a, b) { return (a.startsAt || "99") < (b.startsAt || "99") ? -1 : (a.startsAt || "99") > (b.startsAt || "99") ? 1 : 0; });
          var nowT = pad(new Date().getHours()) + ":" + pad(new Date().getMinutes());
          // The bell schedule is named only when it says more than the weekday does: a minimum day, an A-day.
          if (dd.schedule && dd.schedule.name.toLowerCase().indexOf(DOWL[parse(t0).getDay()].toLowerCase()) < 0) {
            secToday.querySelector(".cx-ch").appendChild(el("small", null, esc(dd.schedule.name)));
          }
          if (!items.length) secToday.appendChild(el("p", "sx-quiet", "Nothing of yours meets today."));
          var ul = el("div", "sx-periods");
          items.forEach(function (x) {
            var r1 = el("div", "sx-pd" + (x.startsAt && x.endsAt && nowT >= x.startsAt && nowT < x.endsAt ? " now" : x.endsAt && nowT >= x.endsAt ? " past" : ""));
            var s = secById[x.courseId];
            var m = todayRows[x.courseId];
            var markHtml = m ? "<span class='sx-mk " + esc(m.kind) + "' title='" + esc(m.label) + "'>" + esc(m.mark) + "</span>"
              : (reg && reg.online ? "<span class='sx-mk none' title='Not taken yet'>–</span>" : "");
            var pds = periodsToday(x, entry);
            r1.innerHTML = "<span class='sx-tm'>" + (x.startsAt ? "<b>" + esc(clock(x.startsAt)) + "</b>" + (x.endsAt ? "<small>" + esc(clock(x.endsAt)) + "</small>" : "") : "<b>" + esc(pds.join(", ")) + "</b>") + "</span>" +
              "<span class='sx-tt'><b>" + esc(x.title) + "</b><small>" + esc([pds.join(", "), x.room ? "Room " + x.room : "", s ? teacherNames(s) : ""].filter(Boolean).join(" · ")) + "</small></span>" + markHtml;
            r1.tabIndex = 0;
            r1.addEventListener("click", function () { K.open("courses", slugOf(s, x.courseId)); });
            ul.appendChild(r1);
          });
          secToday.appendChild(ul);
          var loose = (dd.items || []).filter(function (x) { return !x.periods.length; });
          if (loose.length) note(secToday, "Not in a period yet: " + loose.map(function (x) { return x.title; }).join(", ") + ".");
          if (reg && reg.online) note(secToday, "The letter at the right is today’s register for that class.");
        }
      }

      // Needs attention
      clear(secAttn);
      var off = [];
      if (cal.ok) off = (cal.v.days || []).filter(function (d) { return d.kind !== "school" && d.kind !== "none" && d.day >= t0 && d.day <= addDays(t0, 6); });
      var list = noticesFor({ work: w, report: rep.ok ? rep.v : null, reg: reg ? { online: reg.online, daysAbsent: reg.daysAbsent, rows: reg.rows } : null, off: off });
      if (secs.ok && !secs.v.length) {
        // Somebody signed in who the school has not put in a section: say what this page is, once.
        secAttn.appendChild(el("p", "sx-quiet", "<b>You are not in a school section yet.</b> When the school enrols you, your day, work, grades and attendance appear here. " +
          "To learn on your own, use <a href='https://kern.oplocloud.com/' target='_blank' rel='noopener'>Kern</a>."));
      } else if (!list.length) secAttn.appendChild(el("p", "sx-quiet", "Nothing needs attention."));
      list.slice(0, 7).forEach(function (n) {
        var b = el("button", "sx-note " + (n.tone || ""), "<i aria-hidden='true'></i><span>" + esc(n.text) + "</span>");
        b.type = "button";
        b.addEventListener("click", function () { K.open(n.go[0], n.go[1]); });
        secAttn.appendChild(b);
      });

      // Due soon
      clear(secDue);
      var open = w.filter(function (x) { var s = stateOf(x, now); return s === "todo" || s === "late" || s === "handed"; });
      open.sort(function (a, b) {
        var al = stateOf(a, now) === "late" ? 0 : 1, bl = stateOf(b, now) === "late" ? 0 : 1;
        return al - bl || (a.dueAt || 8e15) - (b.dueAt || 8e15);
      });
      if (!open.length) secDue.appendChild(el("p", "sx-quiet", "No open work."));
      else {
        var tbl = K.cnTable([{ label: "Work", w: "minmax(160px, 1.6fr)" }, { label: "Course", w: "minmax(110px, 1fr)" }, { label: "Due", w: "96px" }, { label: "", w: "92px" }]);
        open.slice(0, 7).forEach(function (x) {
          tbl.row(["<b>" + esc(x.title) + "</b>" + (x.category ? "<span class='cn-sub2'>" + esc(x.category) + " · " + esc(scoreText(x)) + "</span>" : ""),
                   esc(x.courseTitle), esc(dueText(x)), statePill(stateOf(x, now))], function () { openWork(x, secById); });
        });
        secDue.appendChild(tbl);
      }

      // Recent marks
      clear(secMarks);
      var back = w.filter(function (x) { return stateOf(x, now) === "graded"; }).sort(function (a, b) { return (b.gradedAt || 0) - (a.gradedAt || 0); });
      if (!back.length) secMarks.appendChild(el("p", "sx-quiet", "No marks yet."));
      back.slice(0, 6).forEach(function (x) {
        var p = pctOf(x.score, x.outOf);
        var row = el("button", "sx-row");
        row.type = "button";
        row.innerHTML = "<span class='t'><b>" + esc(x.title) + "</b><small>" + esc(x.courseTitle) + (x.gradedAt ? " · " + esc(relDay(x.gradedAt)) : "") + "</small></span>" +
          "<span class='v'><b class='" + tone(p) + "'>" + esc(num(x.score)) + "</b><small>/ " + esc(num(x.outOf)) + "</small></span>";
        row.addEventListener("click", function () { openWork(x, secById); });
        secMarks.appendChild(row);
      });

      // Announcements: the latest across courses
      clear(secNews);
      var courseIds = secs.ok ? secs.v.map(function (s) { return s.courseId; }) : [];
      Promise.all(courseIds.map(function (id) { return settle(D.announce(id)); })).then(function (res) {
        clear(secNews);
        var posts = [];
        res.forEach(function (x, i) {
          if (!x.ok) return;
          x.v.forEach(function (p) { posts.push({ p: p, course: secById[courseIds[i]] }); });
        });
        posts.sort(function (a, b) { return ((b.p.body && b.p.body.at) || b.p.updatedAt || 0) - ((a.p.body && a.p.body.at) || a.p.updatedAt || 0); });
        if (!posts.length) secNews.appendChild(el("p", "sx-quiet", "No announcements from your teachers."));
        posts.slice(0, 4).forEach(function (x) {
          var b = x.p.body || {};
          var n = el("div", "sx-post");
          n.innerHTML = "<b>" + esc(b.title || "Announcement") + "</b><small>" + esc([x.course ? x.course.title : "", b.by, relDay(b.at || x.p.updatedAt)].filter(Boolean).join(" · ")) + "</small>" +
            (b.text ? "<p>" + esc(b.text) + "</p>" : "");
          secNews.appendChild(n);
        });
      });

      // Coming up: the next two weeks, days off and work due
      clear(secSoon);
      var ev = [];
      if (cal.ok) (cal.v.days || []).forEach(function (d) {
        if (d.kind !== "school" && d.kind !== "none" && d.day >= t0) ev.push({ day: d.day, text: (d.label || (d.kind === "staff" ? "Staff day" : d.kind === "canceled" ? "Canceled" : "No school")), kind: "off" });
      });
      w.forEach(function (x) {
        var s = stateOf(x, now);
        if ((s === "todo" || s === "handed") && x.dueAt && x.dueAt >= now && x.dueAt <= now + 14 * 86400000) ev.push({ day: iso(new Date(x.dueAt)), text: x.title + " · " + x.courseTitle, kind: "due" });
      });
      ev.sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : 0; });
      if (!ev.length) secSoon.appendChild(el("p", "sx-quiet", "Nothing in the next two weeks."));
      ev.slice(0, 8).forEach(function (e) {
        var row = el("div", "sx-ev " + e.kind);
        row.innerHTML = "<span class='d'>" + esc(relDay(parse(e.day).getTime())) + "</span><span class='t'>" + esc(e.text) + "</span>" + (e.kind === "off" ? pill("No school") : "");
        secSoon.appendChild(row);
      });
    }).catch(function (e) {
      // Whatever went wrong is said, rather than leaving a page of "Loading".
      [secToday, secAttn, secDue, secMarks, secNews, secSoon].forEach(function (c) {
        if (c.querySelector(".admin-loading")) { clear(c); c.appendChild(el("p", "cx-note", esc("That could not be read: " + (e && e.message ? e.message : "an error")))); }
      });
    });
  };
  function clear(card) {
    var keep = card.querySelector(".cx-ch");
    [].slice.call(card.children).forEach(function (c) { if (c !== keep) card.removeChild(c); });
    // The small note a card head carries is the bell schedule on Today; leave it.
  }
  /* The address of a course is its code, which a school keeps unique. */
  function slugOf(sec, id) { return (sec && sec.code) || id; }
  function findSection(secs, key) {
    return (secs || []).filter(function (s) { return s.code === key || s.courseId === key; })[0] || null;
  }
  X.slugOf = slugOf; X.findSection = findSection;

  /* ============================================================ One piece of work */
  function openWork(w, secById) {
    var now = Date.now(), s = stateOf(w, now);
    var sec = secById && secById[w.courseId];
    dialog({ title: w.title, sub: w.courseTitle + (w.category ? " · " + w.category : ""),
      body: function (host) {
        var graded = s === "graded";
        host.appendChild(dl([
          ["Status", statePill(s).replace(/<[^>]+>/g, "") ],
          ["Due", w.dueAt ? longDay(iso(new Date(w.dueAt))) + (w.dueAt < now && !graded ? " (past)" : "") : "No due date"],
          ["Points", num(w.outOf) + (w.extraCredit ? " · extra credit" : "")],
          ["Mark", graded ? num(w.score) + " of " + num(w.outOf) + " · " + num(pctOf(w.score, w.outOf)) + "%" : s === "missing" ? "Missing — counted as " + num(w.outOf * (w.minScore || 0) / 100) + " of " + num(w.outOf) : s === "excused" ? "Excused, not part of the grade" : null],
          ["Marked", w.gradedAt ? longDay(iso(new Date(w.gradedAt))) : null],
          ["Handed in", w.submittedAt ? longDay(iso(new Date(w.submittedAt))) : null],
          ["Teacher", sec ? teacherNames(sec) : null]
        ]));
        var d = w.details || {};
        if (d.about) host.appendChild(el("p", "sx-prose", esc(d.about)));
        if (d.link && /^https:\/\//i.test(d.link)) {
          var a = el("a", null, esc(d.link.replace(/^https:\/\//i, "").slice(0, 60)));
          a.href = d.link; a.target = "_blank"; a.rel = "noopener noreferrer";
          var p = el("p", "sx-prose");
          p.appendChild(a);
          host.appendChild(p);
        }
        if (w.feedback) host.appendChild(el("p", "sx-prose sx-fb", "<small>Teacher’s comment</small>" + esc(w.feedback)));
        if (w.activity && w.activity.kind) host.appendChild(el("p", "cx-note", "This is done on Kern, and is handed in from there."));
      } });
  }
  X.openWork = openWork;
  X.stateOf = stateOf; X.statePill = statePill; X.scoreText = scoreText; X.dueText = dueText; X.STATE_TEXT = STATE_TEXT;

  /* ============================================================ Schedule */
  var SCH = { mode: "week", week: null, month: null };
  X.pages.schedule = function (v) {
    var t0 = todayIso();
    if (!SCH.week) SCH.week = mondayOf(t0);
    if (!SCH.month) SCH.month = t0.slice(0, 7) + "-01";
    var P = page(v, "Schedule", "Schedule", "Your sections by day, as the school set them.");
    var s = el("div", "sx-slot");
    v.appendChild(s);

    function bar0() {
      P.tools.innerHTML = "";
      P.tools.appendChild(K.cnFilters([{ k: "week", name: "Week" }, { k: "month", name: "Month" }], SCH.mode, function (k) { SCH.mode = k; draw(); }));
      var prev = button("‹", "cn-btn small", function () { step(-1); });
      var next = button("›", "cn-btn small", function () { step(1); });
      var now = button("Today", "cn-btn small", function () { SCH.week = mondayOf(t0); SCH.month = t0.slice(0, 7) + "-01"; draw(); });
      prev.setAttribute("aria-label", "Earlier"); next.setAttribute("aria-label", "Later");
      [prev, now, next].forEach(function (b) { P.tools.appendChild(b); });
      P.tools.appendChild(button("Subscribe", "cn-btn small", function () {
        API.feeds.link().then(function (url) {
          dialog({ title: "Subscribe to this calendar", sub: "Add this address to a calendar app. It shows the school’s days off, events and your work coming due. Keep it to yourself.",
            body: function (h) { var i = el("input", "sx-in"); i.type = "text"; i.readOnly = true; i.value = url; i.addEventListener("focus", function () { i.select(); }); h.appendChild(i); } });
        }, function (e) { toast(e && e.message ? e.message : "That could not be made."); });
      }));
    }
    function step(n) {
      if (SCH.mode === "week") SCH.week = addDays(SCH.week, 7 * n);
      else { var d = parse(SCH.month); d.setMonth(d.getMonth() + n); SCH.month = iso(d); }
      draw();
    }
    function draw() {
      bar0();
      s.innerHTML = "";
      if (SCH.mode === "week") week(); else month();
    }

    function week() {
      var n = waiting(s, "your week");
      var days = [0, 1, 2, 3, 4].map(function (i) { return addDays(SCH.week, i); });
      Promise.all([Promise.all(days.map(function (d) { return D.day(d); })), D.sections(), settle(D.register()), settle(D.codes())]).then(function (r) {
        n.remove();
        var secById = byCourse(r[1]);
        var reg = r[2].ok ? regModel(r[2].v, r[3].ok ? r[3].v : null) : null;
        s.appendChild(el("p", "sx-weekhead", esc(short(days[0]) + " – " + short(days[4]))));
        var wk = el("div", "sx-week");
        var any = false, loose = {};
        r[0].forEach(function (dd, i) {
          var day = days[i], entry = dd.day || {};
          var col = el("section", "sx-col" + (day === t0 ? " today" : ""));
          var sched = dd.schedule && dd.schedule.name && dd.schedule.name.toLowerCase().indexOf(DOWL[parse(day).getDay()].toLowerCase()) < 0 ? dd.schedule.name : "";
          col.appendChild(el("h4", null, "<b>" + esc(DOWS[parse(day).getDay()]) + "</b><span>" + parse(day).getDate() + "</span>" + (sched ? "<small>" + esc(sched) + "</small>" : "")));
          (dd.items || []).forEach(function (x) { if (!x.periods.length) loose[x.courseId] = x.title; });
          if (entry.kind !== "school") {
            col.appendChild(el("p", "sx-off", "No school" + (entry.label ? "<br>" + esc(entry.label) : "")));
          } else {
            var items = (dd.items || []).filter(function (x) { return x.meets && x.periods.length; });
            items.sort(function (a, b) { return (a.startsAt || "99") < (b.startsAt || "99") ? -1 : (a.startsAt || "99") > (b.startsAt || "99") ? 1 : String(a.periods[0]).localeCompare(String(b.periods[0]), undefined, { numeric: true }); });
            if (!items.length) col.appendChild(el("p", "sx-off", "Nothing meets"));
            items.forEach(function (x) {
              any = true;
              var sec = secById[x.courseId];
              var m = reg ? (reg.days[day] ? reg.days[day].rows.filter(function (q) { return q.courseId === x.courseId; })[0] : null) : null;
              var b = el("button", "sx-blk");
              b.type = "button";
              b.innerHTML = "<small>" + esc([periodsToday(x, entry).join(", "), span(x.startsAt, x.endsAt)].filter(Boolean).join(" · ")) + "</small><b>" + esc(x.title) + "</b>" +
                "<span>" + esc([x.room ? "Room " + x.room : "", sec ? teacherShort(sec) : ""].filter(Boolean).join(" · ")) + "</span>" +
                (m && m.kind !== "present" ? "<em class='" + esc(m.kind) + "'>" + esc(m.label) + "</em>" : "");
              b.addEventListener("click", function () { K.open("courses", slugOf(sec, x.courseId)); });
              col.appendChild(b);
            });
          }
          wk.appendChild(col);
        });
        s.appendChild(wk);
        var names = Object.keys(loose).map(function (k) { return loose[k]; });
        if (!any && !names.length) s.appendChild(K.cnEmpty("Nothing is scheduled this week.", "Your sections appear here once the school puts them in periods."));
        else if (names.length) note(s, "Not in a period yet: " + names.join(", ") + ".");
      }).catch(function (e) { n.remove(); failedAt(s, e, draw); });
    }

    function month() {
      var first = parse(SCH.month), gridStart = addDays(SCH.month, -((first.getDay() + 6) % 7));
      var last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
      var gridEnd = addDays(iso(last), (7 - ((last.getDay() + 6) % 7) - 1) % 7);
      var n = waiting(s, "the calendar");
      Promise.all([D.calendar(gridStart, gridEnd), settle(D.work())]).then(function (r) {
        n.remove();
        var cal = r[0], w = r[1].ok ? r[1].v.work : [];
        var by = {};
        (cal.days || []).forEach(function (d) { by[d.day] = d; });
        var due = {};
        w.forEach(function (x) { if (x.dueAt) { var k = iso(new Date(x.dueAt)); (due[k] = due[k] || []).push(x); } });
        s.appendChild(el("p", "sx-weekhead", esc(monthName(SCH.month))));
        var g = el("div", "sx-cal");
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(function (d) { g.appendChild(el("div", "dow", d)); });
        for (var d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
          (function (day) {
            var e = by[day] || {};
            var inMonth = day.slice(0, 7) === SCH.month.slice(0, 7);
            var kind = e.kind || "none";
            var c = el("div", "cell " + kind + (inMonth ? "" : " out") + (day === t0 ? " today" : ""));
            var what = kind === "school" ? "" : kind === "none" ? "" : (e.label || (kind === "staff" ? "Staff day" : kind === "canceled" ? "Canceled" : "Holiday"));
            var dueHere = due[day] || [];
            c.innerHTML = "<b>" + parse(day).getDate() + "</b>" + (what ? "<span>" + esc(what) + "</span>" : "") +
              dueHere.slice(0, 2).map(function (x) { return "<em>" + esc(x.title) + "</em>"; }).join("") + (dueHere.length > 2 ? "<em>+" + (dueHere.length - 2) + " more</em>" : "");
            c.title = longDay(day) + (what ? " — " + what : "");
            g.appendChild(c);
          })(d);
        }
        s.appendChild(g);
        var key = el("div", "sx-key");
        key.innerHTML = "<span class='school'>School day</span><span class='holiday'>Holiday</span><span class='staff'>Staff day</span><span class='canceled'>Canceled</span><span class='due'>Work due</span>";
        s.appendChild(key);
      }).catch(function (e) { n.remove(); failedAt(s, e, draw); });
    }
    draw();
  };

  /* ============================================================ Courses */
  X.pages.courses = function (v, arg) {
    if (arg) return courseDetail(v, arg);
    var P = page(v, "Academics", "Courses", "The sections you are in this year, with who teaches them and where they meet.");
    var s = el("div", "sx-slot");
    v.appendChild(s);
    var n = waiting(s, "your courses");
    Promise.all([D.sections(), settle(D.report()), settle(D.work()), settle(D.register()), settle(D.codes())]).then(function (r) {
      n.remove();
      var secs = r[0];
      if (!secs.length) { s.appendChild(K.cnEmpty("You are not in any section yet.", "When the school puts you in a section it appears here, with its teacher, period and room.")); return; }
      var rep = r[1].ok ? r[1].v : null, w = r[2].ok ? r[2].v.work : [];
      var reg = r[3].ok ? regModel(r[3].v, r[4].ok ? r[4].v : null) : null;
      var gradeBy = {};
      if (rep) rep.courses.forEach(function (c) { gradeBy[c.courseId] = c; });
      var now = Date.now();
      var t = K.cnTable([{ label: "Course", w: "minmax(140px, 1.4fr)" }, { label: "Teacher", w: "minmax(130px, 1.2fr)" }, { label: "Period", w: "64px" },
        { label: "Room", w: "72px" }, { label: "Grade", w: "104px" }, { label: "Absent", w: "62px", align: "right" }, { label: "Missing", w: "68px", align: "right" }]);
      secs.slice().sort(function (a, b) { return String(a.periods[0] || "~").localeCompare(String(b.periods[0] || "~"), undefined, { numeric: true }); }).forEach(function (sec) {
        var g = gradeBy[sec.courseId];
        var miss = w.filter(function (x) { var st = stateOf(x, now); return x.courseId === sec.courseId && (st === "missing" || st === "late"); }).length;
        var away = reg && reg.online ? reg.rows.filter(function (q) { return q.courseId === sec.courseId && (q.kind === "absent"); }).length : null;
        t.row(["<b>" + esc(sec.title) + "</b>" + (sec.subjectNumber ? "<span class='cn-sub2'>" + esc(sec.subjectNumber) + (sec.sectionNo ? " · Section " + esc(sec.sectionNo) : "") + "</span>" : ""),
               teacherNames(sec) ? esc(teacherNames(sec)) : none("No teacher"), sec.placed ? esc(periodName(sec.periods)) : none("Not placed"),
               sec.room ? esc(sec.room) : none(), g ? gradeHtml(g.grade) : none(), away == null ? none() : String(away),
               miss ? "<b class='cn-mk bad'>" + miss + "</b>" : "0"],
          function () { K.open("courses", slugOf(sec, sec.courseId)); }, sec.courseId);
      });
      s.appendChild(t);
    }).catch(function (e) { n.remove(); failedAt(s, e, function () { K.open("courses"); }); });
  };

  function courseDetail(v, key) {
    var s = el("div", "sx-slot");
    var back = backLink("Courses", function () { K.open("courses"); });
    v.appendChild(back);
    var holder = el("div");
    v.appendChild(holder);
    v.appendChild(s);
    var n = waiting(s, "this course");
    Promise.all([D.sections(), settle(D.report()), settle(D.work()), settle(D.register()), settle(D.codes())]).then(function (r) {
      n.remove();
      var sec = findSection(r[0], key);
      if (!sec) { s.appendChild(K.cnEmpty("That course is not one of yours.", "It may have ended, or you may have been moved.", "Courses", function () { K.open("courses"); })); return; }
      var rep = r[1].ok ? r[1].v : null;
      var rc = rep ? rep.courses.filter(function (c) { return c.courseId === sec.courseId; })[0] : null;
      var w = (r[2].ok ? r[2].v.work : []).filter(function (x) { return x.courseId === sec.courseId; });
      var reg = r[3].ok ? regModel(r[3].v, r[4].ok ? r[4].v : null) : null;
      var mine = reg ? reg.rows.filter(function (q) { return q.courseId === sec.courseId; }) : [];
      var now = Date.now();

      var P = page(holder, sec.subjectNumber || "Course", sec.title,
        esc([teacherNames(sec) || "No teacher yet", sec.placed ? "Period " + periodName(sec.periods) : "", sec.room ? "Room " + sec.room : ""].filter(Boolean).join(" · ")));
      var g = rc && rc.grade;
      var missing = w.filter(function (x) { var st = stateOf(x, now); return st === "missing" || st === "late"; }).length;
      var away = mine.filter(function (q) { return q.kind === "absent"; }).length, late = mine.filter(function (q) { return q.kind === "tardy"; }).length;
      K.cxMetrics(s, [
        { label: "Grade", value: g && g.percent != null ? g.letter : null, note: g && g.percent != null ? num(g.percent) + "%" : "No marks yet" },
        { label: "Trend", value: rc && rc.trend ? (rc.trend.change > 0 ? "+" : "") + rc.trend.change : null, unit: rc && rc.trend ? "pts" : "", note: rc && rc.trend ? "over the last " + rc.trend.over + " marks" : "" },
        { label: "Missing or past due", value: w.length ? missing : null, bad: true },
        { label: "Absent", value: reg && reg.online ? away : null },
        { label: "Late", value: reg && reg.online ? late : null }
      ]);

      var grid = el("div", "cx-grid");
      s.appendChild(grid);
      var left = K.cxSection(grid, "cx-s7", "Marks", rc ? plural(rc.marks.length, "mark") : "");
      var right = K.cxSection(grid, "cx-s5", "How the grade is made", "");

      // The marks, as the teacher entered them
      var all = w.slice().sort(function (a, b) { return (b.dueAt || 0) - (a.dueAt || 0); });
      if (!all.length) left.appendChild(el("p", "sx-quiet", "No work has been set in this course yet."));
      else {
        var t = K.cnTable([{ label: "Work", w: "minmax(150px, 1.5fr)" }, { label: "Due", w: "92px" }, { label: "Mark", w: "96px", align: "right" }, { label: "", w: "92px" }]);
        all.forEach(function (x) {
          var st = stateOf(x, now);
          t.row(["<b>" + esc(x.title) + "</b>" + (x.category ? "<span class='cn-sub2'>" + esc(x.category) + "</span>" : ""), esc(dueText(x)),
                 st === "graded" ? "<b class='cn-mk'>" + esc(num(x.score)) + "</b> / " + esc(num(x.outOf)) : st === "excused" ? "Excused" : esc(num(x.outOf)) + " pts", statePill(st)],
            function () { openWork(x, byCourse([sec])); });
        });
        left.appendChild(t);
      }

      // How the grade is made
      if (!g || !g.parts || !g.parts.length) right.appendChild(el("p", "sx-quiet", "This appears after the first mark."));
      else {
        g.parts.forEach(function (p) {
          var row = el("div", "sx-part");
          row.innerHTML = "<span class='t'><b>" + esc(p.category) + "</b><small>" + esc(p.weight) + "% of the grade · " + plural(p.items, "mark") + "</small></span><span class='v " + tone(p.percent) + "'>" + esc(num(p.percent)) + "%</span>" + bar(p.percent, tone(p.percent));
          right.appendChild(row);
        });
        var notes = [];
        if (g.dropped && g.dropped.length) notes.push("Dropped: " + g.dropped.map(function (d) { return d.title; }).join(", ") + ".");
        if (g.lateCount) notes.push("Late work cost " + num(g.latePenalty) + " points.");
        if (g.extraCredit) notes.push(num(g.extraCredit) + " points of extra credit are included.");
        if (g.missingCount) notes.push(plural(g.missingCount, "missing mark") + " counted at the course minimum.");
        if (g.override && g.override.percent != null) notes.push("Your teacher set this grade; from your marks alone it is " + num(g.override.computed) + "%.");
        if (notes.length) note(right, notes.join(" "));
      }
      if (rc && rc.comment) {
        var cm = K.cxSection(grid, "cx-s12", "Teacher’s comment", rc.comment.author || "");
        cm.appendChild(el("p", "sx-prose", esc(rc.comment.body)));
      }
      if (X.goalBox && g && g.percent != null) X.goalBox(K.cxSection(grid, "cx-s7", "What do I need?", ""), sec, w);
      // Attendance in this course
      if (reg && reg.online) {
        var att = K.cxSection(grid, "cx-s5", "Attendance in this course", plural(mine.length, "register"));
        var ex = mine.filter(function (q) { return q.kind !== "present"; });
        if (!ex.length) att.appendChild(el("p", "sx-quiet", mine.length ? "Present at every register." : "No registers yet."));
        ex.slice(0, 8).forEach(function (q) {
          var row = el("div", "sx-ev");
          row.innerHTML = "<span class='d'>" + esc(short(q.day)) + "</span><span class='t'>" + esc(q.label) + (q.note ? " — " + esc(q.note) : "") + "</span>";
          att.appendChild(row);
        });
      }
      // Announcements
      var news = K.cxSection(grid, "cx-s12", "Announcements", "");
      D.announce(sec.courseId).then(function (posts) {
        if (!posts.length) news.appendChild(el("p", "sx-quiet", "None."));
        posts.slice().sort(function (a, b) { return ((b.body && b.body.at) || b.updatedAt || 0) - ((a.body && a.body.at) || a.updatedAt || 0); }).slice(0, 5).forEach(function (p) {
          var b = p.body || {};
          var nn = el("div", "sx-post");
          nn.innerHTML = "<b>" + esc(b.title || "Announcement") + "</b><small>" + esc([b.by, relDay(b.at || p.updatedAt)].filter(Boolean).join(" · ")) + "</small>" + (b.text ? "<p>" + esc(b.text) + "</p>" : "");
          news.appendChild(nn);
        });
      }, function () { news.appendChild(el("p", "sx-quiet", "Announcements could not be read.")); });
    }).catch(function (e) { n.remove(); failedAt(s, e, function () { K.open("courses", key); }); });
  }

  /* ============================================================ Assignments */
  var ASG = { filter: "todo", course: "" };
  X.pages.assignments = function (v, arg) {
    if (arg && ["todo", "late", "handed", "graded", "all", "tests"].indexOf(arg) > -1) ASG.filter = arg;
    var P = page(v, "Academics", "Assignments", "Work your teachers have set, and where each piece stands.");
    var s = el("div", "sx-slot");
    v.appendChild(s);
    var n = waiting(s, "your work");
    Promise.all([D.work(), D.sections()]).then(function (r) {
      n.remove();
      var all = r[0].work, secById = byCourse(r[1]);
      var now = Date.now();
      function bucket(w) { var st = stateOf(w, now); return st === "todo" ? "todo" : st === "late" || st === "missing" ? "late" : st === "handed" ? "handed" : "graded"; }
      var counts = { todo: 0, late: 0, handed: 0, graded: 0 };
      all.forEach(function (w) { counts[bucket(w)]++; });
      var bar0 = el("div", "cx-bar sx-bar0");
      var filters = K.cnFilters([{ k: "todo", name: "To do", n: counts.todo }, { k: "late", name: "Past due", n: counts.late },
        { k: "handed", name: "Handed in", n: counts.handed }, { k: "graded", name: "Graded", n: counts.graded }, { k: "all", name: "All", n: all.length },
        { k: "tests", name: "Tests" }],
        ASG.filter, function (k) { ASG.filter = k; draw(); });
      bar0.appendChild(filters);
      var sel = el("select", "cx-select sx-sel");
      var o0 = el("option"); o0.value = ""; o0.textContent = "All courses"; sel.appendChild(o0);
      r[1].forEach(function (sec) { var o = el("option"); o.value = sec.courseId; o.textContent = sec.title; if (ASG.course === sec.courseId) o.selected = true; sel.appendChild(o); });
      sel.addEventListener("change", function () { ASG.course = sel.value; draw(); });
      bar0.appendChild(sel);
      s.appendChild(bar0);
      var host = el("div");
      s.appendChild(host);

      function draw() {
        filters.mark(ASG.filter);
        host.innerHTML = "";
        sel.hidden = ASG.filter === "tests";
        if (ASG.filter === "tests") {
          // Tests the school has set, with their own rules, sat in their own window.
          if (window.OPLO_EXAM) window.OPLO_EXAM.hub(host, me());
          else host.appendChild(K.cnEmpty("Tests are not available here.", ""));
          return;
        }
        var rows = all.filter(function (w) {
          return (!ASG.course || w.courseId === ASG.course) && (ASG.filter === "all" || bucket(w) === ASG.filter);
        });
        if (!rows.length) {
          host.appendChild(K.cnEmpty(ASG.filter === "todo" ? "Nothing to do." : ASG.filter === "late" ? "Nothing is past due." : "Nothing here.",
            ASG.filter === "todo" ? "No open work, or none with a mark still to come." : ""));
          return;
        }
        var groups = [];
        if (ASG.filter === "todo") {
          var weekEnd = addDays(mondayOf(todayIso()), 7), nextEnd = addDays(weekEnd, 7);
          var def = [["This week", function (w) { return w.dueAt && iso(new Date(w.dueAt)) < weekEnd; }],
                     ["Next week", function (w) { return w.dueAt && iso(new Date(w.dueAt)) >= weekEnd && iso(new Date(w.dueAt)) < nextEnd; }],
                     ["Later", function (w) { return w.dueAt && iso(new Date(w.dueAt)) >= nextEnd; }],
                     ["No due date", function (w) { return !w.dueAt; }]];
          rows.sort(function (a, b) { return (a.dueAt || 8e15) - (b.dueAt || 8e15); });
          def.forEach(function (d) { var g = rows.filter(d[1]); if (g.length) groups.push([d[0], g]); });
        } else {
          rows.sort(function (a, b) { return ASG.filter === "graded" ? (b.gradedAt || 0) - (a.gradedAt || 0) : (b.dueAt || 0) - (a.dueAt || 0); });
          groups.push([null, rows]);
        }
        groups.forEach(function (gr) {
          if (gr[0]) host.appendChild(el("h3", "sx-h3", esc(gr[0]) + "<small>" + gr[1].length + "</small>"));
          var t = K.cnTable([{ label: "Work", w: "minmax(180px, 1.7fr)" }, { label: "Course", w: "minmax(120px, 1fr)" }, { label: "Due", w: "100px" },
            { label: "Points", w: "100px", align: "right" }, { label: "", w: "96px" }]);
          gr[1].forEach(function (w) {
            var st = stateOf(w, now);
            t.row(["<b>" + esc(w.title) + "</b>" + (w.category ? "<span class='cn-sub2'>" + esc(w.category) + (w.extraCredit ? " · extra credit" : "") + "</span>" : ""),
                   esc(w.courseTitle), esc(dueText(w)),
                   st === "graded" ? "<b class='cn-mk'>" + esc(num(w.score)) + "</b> / " + esc(num(w.outOf)) : esc(num(w.outOf)), statePill(st)],
              function () { openWork(w, secById); });
          });
          host.appendChild(t);
        });
      }
      draw();
    }).catch(function (e) { n.remove(); failedAt(s, e, function () { K.open("assignments"); }); });
  };

  /* ------------------------------------------------------------- Search
     ⌘K from anywhere in the portal: a place, a course, a piece of work. */
  X.api.find = function () {
    var places = [
      ["Overview", "today"], ["Schedule", "schedule"], ["Courses", "courses"], ["Assignments", "assignments"], ["Grades", "grades"],
      ["Attendance", "attendance"], ["Transcript", "transcript"], ["Graduation", "graduation"], ["Profile", "profile"], ["Requests", "requests"], ["Account", "account"]
    ].map(function (p) { return { name: p[0], hint: "Place", kind: "place", go: function () { K.open(p[1]); } }; });
    return Promise.all([settle(D.sections()), settle(D.work())]).then(function (r) {
      var out = places.slice();
      if (r[0].ok) r[0].v.forEach(function (s) {
        out.push({ name: s.title, hint: "Course · " + [periodName(s.periods), teacherNames(s)].filter(Boolean).join(" · "), kind: "course", go: function () { K.open("courses", slugOf(s, s.courseId)); } });
      });
      if (r[1].ok) r[1].v.work.forEach(function (w) {
        out.push({ name: w.title, hint: "Assignment · " + w.courseTitle + (w.dueAt ? " · due " + relDay(w.dueAt) : ""), kind: "work", go: function () { K.open("assignments"); } });
      });
      return out;
    });
  };

  /* What waits, beside the rail's row: work past due or marked missing. */
  X.api.counts = function () {
    return D.work().then(function (r) {
      var now = Date.now();
      return { late: r.work.filter(function (w) { var st = stateOf(w, now); return st === "late" || st === "missing"; }).length };
    });
  };

  /* ----------------------------------------------------------- Surface */
  // Inbox, Events and Menu are the shared pages, drawn for a student.
  X.pages.inbox = function (v) { K.platform.inbox(v); };
  X.pages.events = function (v) { K.platform.records(v, { kind: "event", eyebrow: "School", title: "Events", sub: "What is happening at school, and who it is for.", canCreate: false }); };
  X.pages.menu = function (v) { K.platform.records(v, { kind: "menu", eyebrow: "School", title: "Menu", sub: "What is served, with the allergens.", canCreate: false }); };

  X.el = el; X.esc = esc; X.iso = iso; X.parse = parse; X.addDays = addDays; X.todayIso = todayIso;
  X.short = short; X.longDay = longDay; X.relDay = relDay; X.clock = clock; X.span = span; X.plural = plural; X.num = num;
  X.pctOf = pctOf; X.settle = settle; X.pill = pill; X.none = none; X.button = button; X.backLink = backLink; X.note = note;
  X.waiting = waiting; X.bar = bar; X.tone = tone; X.gradeHtml = gradeHtml; X.dl = dl; X.dialog = dialog; X.page = page;
  X.failedAt = failedAt; X.teacherNames = teacherNames; X.teacherShort = teacherShort; X.byCourse = byCourse; X.yearOf = yearOf; X.monthName = monthName;
  X.mondayOf = mondayOf; X.noticesFor = noticesFor; X.DOWS = DOWS; X.DOWL = DOWL; X.MON = MON; X.MONS = MONS; X.me = me; X.pad = pad;

  // The record pages (grades, attendance, transcript, graduation, profile,
  // requests) are in student-record.js, which adds to the same surface.
  if (typeof window.OPLO_STUDENT_RECORD === "function") window.OPLO_STUDENT_RECORD(X);

  Object.keys(X.pages).forEach(function (k) { X.api[k] = X.pages[k]; });
  X.api.bust = X.bust;
  return X.api;
};
