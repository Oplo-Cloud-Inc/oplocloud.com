/* ==========================================================================
   OEdu on a phone — the student's places, part two.

     Attendance    the year as a ring, the month as dots, a day as its classes
     Record        graduation (credits toward a diploma) and the transcript
     Me            who the school has down, how to reach you, how this looks
     Requests      the courses asked for next year
     Account       password, where you are signed in
     Forms         forms to sign
     Inbox, Events, Menu   the school's shared pages, in a layer

   Mounted by phone-student.js with the helpers it built (H).
   ========================================================================== */
window.OPLO_PHONE_RECORD = function (P, H) {
  "use strict";

  var K = P.K, el = P.el, esc = P.esc, API = K.API;
  var X, D;
  function ready() { H.init(); X = H.X; D = H.D; }

  function field(label, node) {
    var l = el("label", "ph-field", "<small>" + esc(label) + "</small>");
    l.appendChild(node);
    return l;
  }
  function input(value, o) {
    var i = el("input");
    o = o || {};
    i.type = o.type || "text";
    i.value = value || "";
    if (o.ph) i.placeholder = o.ph;
    if (o.auto) i.autocomplete = o.auto;
    if (o.max) i.maxLength = o.max;
    return i;
  }
  function cta(text, cls, go) {
    var b = el("button", "ph-cta" + (cls ? " " + cls : ""), esc(text));
    b.type = "button";
    b.addEventListener("click", go);
    return b;
  }
  function longDayYear(s) { var d = X.parse(s); return X.DOWL[d.getDay()] + ", " + X.MON[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }

  /* A month of days, the way the schedule shows it: dots, not boxes. */
  function monthGrid(o) {
    var d0 = X.parse(o.month), end = new Date(d0.getFullYear(), d0.getMonth() + 1, 0);
    var cal = el("div", "ph-cal");
    cal.innerHTML = '<div class="h">' + ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>";
    var grid = el("div", "g"), start = X.mondayOf(o.month);
    var cells = Math.ceil(((X.parse(X.iso(end)) - X.parse(start)) / 864e5 + 1) / 7) * 7;
    for (var i = 0; i < cells; i++) {
      (function (day) {
        var inM = day.slice(0, 7) === o.month.slice(0, 7), c = o.cell(day) || {};
        var b = el("button", "ph-cd" + (inM ? "" : " out") + (c.off ? " off" : "") + (day === X.todayIso() ? " today" : ""), "<b>" + X.parse(day).getDate() + "</b>" + (c.dot ? "<i class='mkd " + c.dot + "'></i>" : ""));
        b.type = "button";
        b.setAttribute("aria-label", X.longDay(day));
        b.setAttribute("aria-selected", day === o.selected ? "true" : "false");
        b.addEventListener("click", function () {
          [].forEach.call(grid.children, function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
          o.pick(day);
        });
        grid.appendChild(b);
      })(X.addDays(start, i));
    }
    cal.appendChild(grid);
    return cal;
  }
  function monthBar(label, prev, next) {
    var bar = el("div", "ph-weekbar");
    bar.innerHTML = '<span class="wk">' + esc(label) + "</span>";
    var nav = el("div", "nav");
    nav.appendChild(P.btn("", P.icon("left"), "Earlier", prev));
    nav.appendChild(P.btn("", P.icon("right"), "Later", next));
    bar.appendChild(nav);
    return bar;
  }

  /* ============================================================ Attendance */
  function buildAttendance(L) {
    L.head({ eyebrow: "Academics", title: "Attendance" });
    var host = L.add(el("div"));
    host.appendChild(P.skel(3, 100));
    var t0 = X.todayIso(), year = X.yearOf(t0);
    Promise.all([D.register(), D.codes(), X.settle(D.sections())]).then(function (r) {
      var raw = r[0], codes = r[1], secs = r[2].ok ? r[2].v : [];
      host.innerHTML = "";
      if (raw.online === false) { host.appendChild(P.empty("Not shown by your school", "Your school hasn’t put attendance online. Ask the office if you need your record.")); return; }
      var rows = raw.attendance.filter(function (x) { return x.day >= year.from && x.day <= year.to; });
      var all = X.regModel({ online: true, attendance: rows }, codes);
      if (!all.totals.marks) { host.appendChild(P.empty("No registers yet", "Your attendance appears here once a teacher has taken a register.")); return; }

      var big = el("div", "ph-big t-teal");
      big.appendChild(P.ring(all.rate, { size: 132, stroke: 11, tone: "teal", center: "<b>" + esc(X.num(all.rate)) + "<span class='pc'>%</span></b><small class='cap'>present</small>" }));
      var tx = el("div", "tx");
      tx.innerHTML = "<h2>This school year</h2><p>" + esc([all.daysAbsent ? X.plural(all.daysAbsent, "full day") + " absent" : "No full days absent", all.totals.tardy ? X.plural(all.totals.tardy, "late arrival") : "", all.daysPartial ? X.plural(all.daysPartial, "day") + " partly missed" : ""].filter(Boolean).join(" · ")) + ".</p>";
      big.appendChild(tx);
      host.appendChild(big);
      P.rise([big], 0);

      // The month, then the day under your finger.
      var st = { month: t0.slice(0, 8) + "01", day: null };
      var calHost = el("div"), panel = el("div");
      host.appendChild(P.sh("Month"));
      host.appendChild(calHost);
      host.appendChild(panel);
      function drawCal() {
        calHost.innerHTML = "";
        var d0 = X.parse(st.month);
        calHost.appendChild(monthBar(X.monthName(st.month),
          function () { st.month = X.iso(new Date(d0.getFullYear(), d0.getMonth() - 1, 1)); st.day = null; drawCal(); drawDay(); },
          function () { st.month = X.iso(new Date(d0.getFullYear(), d0.getMonth() + 1, 1)); st.day = null; drawCal(); drawDay(); }));
        calHost.appendChild(monthGrid({ month: st.month, selected: st.day, cell: function (day) {
          var dd = all.days[day];
          return { dot: dd ? dd.state : "", off: false };
        }, pick: function (day) { st.day = day; drawDay(); } }));
        var lg = el("div", "ph-legend");
        lg.innerHTML = "<span><i style='background:var(--ph-green)'></i>Present</span><span><i style='background:var(--ph-orange)'></i>Part of the day</span><span><i style='background:#c99a00'></i>Late</span><span><i style='background:var(--ph-red)'></i>Absent</span>";
        calHost.appendChild(lg);
      }
      function drawDay() {
        panel.innerHTML = "";
        if (!st.day) return;
        var dd = all.days[st.day];
        panel.appendChild(P.sh(X.longDay(st.day)));
        if (!dd) { panel.appendChild(P.empty("Nothing taken", "No register was taken for you on this day.")); return; }
        var g = P.group(), secBy = X.byCourse(secs);
        dd.rows.forEach(function (x) {
          g.appendChild(P.row({ dot: true, tone: H.areaOf(secBy, x.courseId, x.courseTitle), title: x.courseTitle, sub: x.note || "", valueHtml: "<span class='ph-pill " + (x.kind === "present" ? "green" : x.kind === "absent" ? "red" : x.kind === "tardy" ? "orange" : "blue") + "'>" + esc(x.label) + "</span>" }));
        });
        panel.appendChild(g);
        panel.scrollIntoView && setTimeout(function () { try { panel.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) { /* old browsers */ } }, 60);
      }
      drawCal();

      // Each course.
      host.appendChild(P.sh("By course"));
      var cg = P.group(), secBy = X.byCourse(secs);
      var courses = {};
      rows.forEach(function (x) { (courses[x.courseId] = courses[x.courseId] || []).push(x); });
      Object.keys(courses).forEach(function (id) {
        var m = X.regModel({ online: true, attendance: courses[id] }, codes), title = courses[id][0].courseTitle;
        cg.appendChild(P.row({ dot: true, tone: H.areaOf(secBy, id, title), title: title,
          sub: [m.totals.absent ? X.plural(m.totals.absent, "absence") : "No absences", m.totals.tardy ? X.plural(m.totals.tardy, "late") : ""].filter(Boolean).join(" · "),
          valueHtml: "<b>" + esc(X.num(m.rate)) + "%</b><small>" + esc(X.plural(m.totals.marks, "class", "classes")) + "</small>" }));
      });
      host.appendChild(cg);

      // What the letters mean.
      var used = {};
      rows.forEach(function (x) { used[x.status] = true; });
      var cs = ((codes && codes.codes) || []).filter(function (c) { return used[c.key]; });
      if (cs.length) {
        host.appendChild(P.sh("The school’s marks"));
        var kg = P.group();
        cs.forEach(function (c) { kg.appendChild(P.row({ title: c.label, valueHtml: "<b>" + esc(c.mark) + "</b>", sub: c.kind === "absent" ? "Counts as away" : c.kind === "tardy" ? "Counts as in the room" : c.kind === "excused" ? "Counts as in the room" : "" })); });
        host.appendChild(kg);
      }
    }, function (e) { P.fail(host, e, function () { K.open("attendance"); }); });
  }

  /* ================================================================ Record */
  var AREA_NAMES = { english: "English", math: "Mathematics", science: "Science", social_studies: "Social Studies", health: "Health", pe: "Physical Education", fine_art: "Fine Art", world_language: "World Language", elective: "Elective" };
  function yearName(y) {
    var m = String(y || "").match(/^(\d{4})\D+(\d{2,4})$/);
    return m ? m[1] + "–" + m[2].slice(-2) : String(y || "Undated");
  }
  function buildRecord(L, first) {
    L.head({ eyebrow: "Record", title: "Record" });
    var seg = P.seg([{ k: "graduation", label: "Graduation" }, { k: "transcript", label: "Transcript" }], first, function (k) { show(k); K.open(k, null, true); });
    L.add(seg);
    var host = L.add(el("div"));
    var cache = null;
    function show(k) {
      host.innerHTML = "";
      host.appendChild(P.skel(2, 130));
      (cache || (cache = D.grad())).then(function (g) {
        host.innerHTML = "";
        if (!g || !g.totals) { host.appendChild(P.empty("Nothing on your record yet", "Your requirements appear here once the school has a program and a record for you.")); return; }
        if (k === "graduation") graduation(host, g); else transcript(host, g);
      }, function (e) { cache = null; P.fail(host, e, function () { show(k); }); });
    }
    L.setTab = function (k) { seg.set(k); show(k); };
    show(first);
  }

  function graduation(host, g) {
    var t = g.totals, pe = g.pace || {}, total = g.track ? g.track.total : 0;
    var big = el("div", "ph-big t-purple");
    big.appendChild(P.ring(total ? t.earned / total * 100 : 0, { size: 132, stroke: 11, tone: "purple", center: "<b>" + esc(X.num(t.earned)) + "</b><small class='cap'>of " + esc(X.num(total)) + " credits</small>" }));
    var tx = el("div", "tx");
    tx.innerHTML = "<h2>" + esc(t.remaining > 0 ? X.num(t.remaining) + " to go" : "All earned") + "</h2><p>" +
      esc([g.track ? g.track.name : "", g.program && g.program.expectedGrad ? "Expected " + g.program.expectedGrad : "", pe.finishBy ? "At this pace: " + pe.finishBy : ""].filter(Boolean).join(" · ")) + "</p>";
    big.appendChild(tx);
    host.appendChild(big);
    P.rise([big], 0);

    host.appendChild(P.sh("Requirements"));
    var grp = P.group();
    (g.groups || []).forEach(function (r) {
      var p = r.required > 0 ? Math.min(100, r.earned / r.required * 100) : 100;
      var areas = (g.areas || []).filter(function (a) { return a.group === r.key && (r.areas || []).length > 1; });
      var row = el(areas.length ? "button" : "div", "ph-row stack");
      if (areas.length) row.type = "button";
      row.innerHTML = '<span class="top"><span class="t"><b>' + esc(r.name) + "</b><small>" + esc(r.left > 0 ? X.num(r.left) + " still needed" : "Complete") + "</small></span>" +
        '<span class="v"><b>' + esc(X.num(r.earned)) + "<small style='display:inline;color:var(--ph-label-3)'> / " + esc(X.num(r.required)) + "</small></b></span>" + (areas.length ? P.chev : "") + "</span>";
      row.appendChild(P.meter(p, p >= 100 ? "ok" : ""));
      if (areas.length) row.addEventListener("click", function () {
        P.sheet({ title: r.name, sub: X.num(r.earned) + " of " + X.num(r.required) + " credits", tone: "purple", body: function (b) {
          var ag = P.group();
          areas.forEach(function (a) { ag.appendChild(P.row({ title: a.name, sub: a.earned >= a.required ? "Complete" : X.num(a.required - a.earned) + " still needed", valueHtml: "<b>" + esc(X.num(a.earned)) + "<small style='display:inline;color:var(--ph-label-3)'> / " + esc(X.num(a.required)) + "</small></b>", chev: false })); });
          b.appendChild(ag);
        } });
      });
      grp.appendChild(row);
    });
    host.appendChild(grp);

    var rest = [
      ["At this school", g.residency ? X.num(g.residency.earnedAtEhs) + " of " + X.num(g.residency.minAtEhs) + " required here" : null],
      ["Credits a year", pe.perYear ? X.num(pe.perYear) : null]
    ].filter(function (r) { return r[1]; });
    if (rest.length) {
      host.appendChild(P.sh("Pace"));
      var pg = P.group();
      rest.forEach(function (r) { pg.appendChild(el("div", "ph-kv", "<small>" + esc(r[0]) + "</small><span>" + esc(r[1]) + "</span>")); });
      host.appendChild(pg);
    }

    if (g.exams && g.exams.length) {
      host.appendChild(P.sh("Required exams"));
      var eg = P.group();
      g.exams.forEach(function (e) {
        eg.appendChild(P.row({ title: e.name, sub: [e.sitting, e.score != null ? "Score " + e.score : ""].filter(Boolean).join(" · "), valueHtml: P.pill(e.passed ? "Passed" : e.status || "Not passed", e.passed ? "green" : "") }));
      });
      host.appendChild(eg);
    }
    [["check", "To confirm with the school"], ["info", "Notes"]].forEach(function (lv) {
      var list = (g.checks || []).filter(function (c) { return (c.level || "info") === lv[0]; });
      if (!list.length) return;
      host.appendChild(P.sh(lv[1]));
      var cg = P.group();
      list.forEach(function (c) { cg.appendChild(el("div", "ph-prose", "<b style='display:block;margin-bottom:4px'>" + esc(c.title) + "</b>" + esc(c.detail))); });
      host.appendChild(cg);
    });
    if (g.assumptions && g.assumptions.length) host.appendChild(P.note(g.assumptions.join(" ")));
  }

  function transcript(host, g) {
    var marks = g.marks || [], cur = g.current || [];
    if (!marks.length && !cur.length && !(g.ehsCourses || []).length && !(g.courses || []).length) {
      host.appendChild(P.empty("Nothing on your record yet", "When the school adds a previous transcript, or finishes a course, it appears here."));
      return;
    }
    var big = el("div", "ph-big t-purple");
    var gpa = g.gpa && g.gpa.value != null ? g.gpa.value : null;
    big.appendChild(P.ring(gpa == null ? 0 : gpa / 4 * 100, { size: 132, stroke: 11, tone: "purple", center: gpa == null ? "<small class='cap'>No GPA yet</small>" : "<b>" + esc(gpa.toFixed(2)) + "</b><small class='cap'>on a 4.0 scale</small>" }));
    var tx = el("div", "tx");
    tx.innerHTML = "<h2>Grade-point average</h2><p>" + esc([g.totals ? X.num(g.totals.earned) + " credits earned" : "", X.plural(marks.length, "course")].filter(Boolean).join(" · ")) + ".</p>";
    big.appendChild(tx);
    host.appendChild(big);
    P.rise([big], 0);

    var by = {}, order = [], yearInfo = {};
    marks.forEach(function (m) { var k = m.year || "Undated"; if (!by[k]) { by[k] = []; order.push(k); } by[k].push(m); });
    order.sort(function (a, b) { return a < b ? 1 : -1; });
    (g.years || []).forEach(function (y) { yearInfo[y.year] = y; });
    if (cur.length) {
      host.appendChild(P.sh("This year"));
      host.appendChild(el("p", "ph-sub", "In progress"));
      var cg = P.group();
      cur.forEach(function (c) {
        cg.appendChild(P.row({ dot: true, tone: P.toneOf(c.area || c.title), title: c.title, sub: c.area ? (AREA_NAMES[c.area] || c.area) : "", valueHtml: c.percent != null ? "<span class='ph-gr " + H.gradeTone(c.percent) + "'>" + esc(c.letter || "") + "</span><small>" + esc(X.num(c.percent)) + "%</small>" : "<small>—</small>" }));
      });
      host.appendChild(cg);
    }
    order.forEach(function (k) {
      var yi = yearInfo[k];
      host.appendChild(P.sh(yearName(k)));
      if (yi) host.appendChild(el("p", "ph-sub", esc([X.plural(X.num(yi.credits), "credit"), yi.average != null ? X.num(yi.average) + "% average" : ""].filter(Boolean).join(" · "))));
      var yg = P.group();
      by[k].forEach(function (m) {
        yg.appendChild(P.row({ dot: true, tone: P.toneOf(m.area || m.title), title: m.title, sub: [m.area ? (AREA_NAMES[m.area] || m.area) : "", X.plural(X.num(m.credits), "credit"), m.source === "ehs" ? "This school" : "Transferred"].filter(Boolean).join(" · "),
          valueHtml: "<span class='ph-gr'>" + esc(m.letter || "") + "</span>" + (m.mark != null ? "<small>" + esc(String(m.mark)) + "</small>" : "") }));
      });
      host.appendChild(yg);
    });
    if (g.transfer) {
      host.appendChild(P.sh("Transfer record"));
      var tg = P.group();
      [["School", g.transfer.school], ["Kind", g.transfer.kind === "official" ? "Official, sent by the school" : "Copy supplied by the family"], ["Printed", g.transfer.printedOn],
        ["Status", (g.transfer.statusSteps || [])[g.transfer.statusAt] || g.transfer.status],
        ["Credits", g.transfer.creditsEarned != null ? X.num(g.transfer.creditsEarned) + " earned of " + X.num(g.transfer.creditsAttempted) + " attempted" : null],
        ["Cumulative average", g.transfer.cumulativeAverage != null ? g.transfer.cumulativeAverage + "%" : null]].forEach(function (r) {
        if (r[1]) tg.appendChild(el("div", "ph-kv", "<small>" + esc(r[0]) + "</small><span>" + esc(r[1]) + "</span>"));
      });
      host.appendChild(tg);
    }
    if (g.assumptions && g.assumptions.length) host.appendChild(P.note(g.assumptions.join(" ")));
  }

  /* =================================================================== Me */
  function buildMe(L) {
    var me = X.me();
    L.titleEl = null;
    var hero = el("div", "ph-me");
    hero.innerHTML = '<div class="av">' + esc(me.initials || "") + "</div><h1>" + esc(me.name) + "</h1><p>" + esc(K.schoolName()) + "</p>";
    P.hue(hero.querySelector(".av"), me.hue);
    L.add(hero);
    L.titleEl = hero.querySelector("h1");
    L.barTitle.textContent = me.name;
    var host = L.add(el("div"));
    host.appendChild(P.skel(2, 120));
    Promise.all([X.settle(D.grad()), X.settle(D.contact()), X.settle(D.guardians()), X.settle(D.records())]).then(function (r) {
      host.innerHTML = "";
      var g = r[0].ok ? r[0].v : null, contact = r[1].ok ? r[1].v : null, guardians = r[2].ok ? r[2].v : [], records = r[3].ok ? r[3].v : {};
      var bits = [];
      if (g && g.program && g.program.gradeLevel) bits.push("Grade " + g.program.gradeLevel);
      if (g && g.program && g.program.name) bits.push(g.program.name);
      if (g && g.program && g.program.expectedGrad) bits.push("Class of " + String(g.program.expectedGrad).slice(0, 4));
      if (bits.length) hero.querySelector("p").textContent = bits.join(" · ") + " · " + K.schoolName();

      host.appendChild(P.sh("Student"));
      var sg = P.group();
      [["Sign-in", me.email], ["Date of birth", contact && contact.dateOfBirth ? longDayYear(contact.dateOfBirth) : null],
        ["Enrolled", g && g.enrollment && g.enrollment.enrolledOn ? longDayYear(g.enrollment.enrolledOn) : null], ["Expected graduation", g && g.program ? g.program.expectedGrad : null]].forEach(function (x) {
        if (x[1]) sg.appendChild(el("div", "ph-kv", "<small>" + esc(x[0]) + "</small><span>" + esc(x[1]) + "</span>"));
      });
      host.appendChild(sg);

      host.appendChild(P.sh("Contact", { label: "Edit", go: function () { editContact(contact); } }));
      var cg = P.group();
      [["Mailing address", contact && contact.mailingAddress], ["Cell phone", contact && contact.cellPhone], ["Other phone", contact && contact.altPhone]].forEach(function (x) {
        if (x[1]) cg.appendChild(el("div", "ph-kv", "<small>" + esc(x[0]) + "</small><span>" + esc(x[1]) + "</span>"));
      });
      if (!cg.children.length) cg.appendChild(el("div", "ph-prose", "No contact details are on file. Add them so the school can reach you."));
      host.appendChild(cg);

      if (guardians.length) {
        host.appendChild(P.sh("Family"));
        var fg = P.group();
        guardians.forEach(function (x) { fg.appendChild(P.row({ icon: "person", tone: "gray", title: x.name, sub: [x.relationship, x.description].filter(Boolean).join(" · ") })); });
        host.appendChild(fg);
      }

      var NAMES = { student: "About the student", emergency: "Emergency contact", enrollment: "Enrollment", documents: "Documents on file", transportation: "Transportation", schedule: "Timetable notes" };
      var rg = null;
      Object.keys(NAMES).forEach(function (k) {
        var rec = records[k];
        if (!rec || (!rec.summary && !(rec.facts && rec.facts.length) && !(rec.rows && rec.rows.length) && !rec.notes)) return;
        if (!rg) { host.appendChild(P.sh("On file")); rg = P.group(); host.appendChild(rg); }
        rg.appendChild(P.row({ icon: "doc", tone: "gray", title: NAMES[k], sub: rec.updatedAt ? "Updated " + X.relDay(rec.updatedAt) : "", go: function () {
          P.sheet({ title: NAMES[k], tone: "gray", body: function (b) {
            if (rec.summary) { var s = P.group(); s.appendChild(el("div", "ph-prose", esc(rec.summary))); b.appendChild(s); }
            if (rec.facts && rec.facts.length) { var f = P.group(); f.style.marginTop = "12px"; rec.facts.forEach(function (x) { if (x.value) f.appendChild(el("div", "ph-kv", "<small>" + esc(x.label) + "</small><span>" + esc(x.value) + "</span>")); }); b.appendChild(f); }
            if (rec.columns && rec.rows && rec.rows.length) { var t = P.group(); t.style.marginTop = "12px"; rec.rows.forEach(function (row) { t.appendChild(el("div", "ph-kv", "<small>" + esc(rec.columns.slice(1).join(" · ")) + "</small><span><b>" + esc(row[0]) + "</b> " + esc(row.slice(1).join(" · ")) + "</span>")); }); b.appendChild(t); }
            if (rec.notes) b.appendChild(P.note(rec.notes));
          } });
        } }));
      });

      host.appendChild(P.sh("More"));
      var mg = P.group();
      mg.appendChild(P.row({ icon: "doc", tone: "indigo", title: "Course requests", sub: "What you’d like to take next year", go: function () { K.open("requests"); } }));
      mg.appendChild(P.row({ icon: "key", tone: "gray", title: "Account", sub: "Password and where you’re signed in", go: function () { K.open("account"); } }));
      host.appendChild(mg);

      host.appendChild(P.sh("Appearance"));
      var look = el("div");
      look.appendChild(P.seg([{ k: "light", label: "Light" }, { k: "dark", label: "Dark" }, { k: "auto", label: "Auto" }], P.lookNow(), function (k) { P.look(k); }));
      host.appendChild(look);
      host.appendChild(P.note("Auto follows your phone’s own setting."));

      var out = el("div", "ph-btnrow");
      out.appendChild(cta("Sign out", "danger", function () { P.signOut(); }));
      host.appendChild(out);
    }, function (e) { P.fail(host, e, function () { K.open("profile"); }); });
  }

  function editContact(c) {
    c = c || {};
    var addr = el("textarea"); addr.rows = 3; addr.maxLength = 400; addr.value = c.mailingAddress || "";
    var cell = input(c.cellPhone, { ph: "(555) 555-0100", max: 40, type: "tel", auto: "tel" }), alt = input(c.altPhone, { max: 40, type: "tel" });
    P.sheet({ title: "Edit contact", sub: "The school uses these to reach you. Your date of birth and your family’s details are changed by the office.", tone: "gray", body: function (host) {
      var g = P.group();
      g.appendChild(field("Mailing address", addr));
      g.appendChild(field("Cell phone", cell));
      g.appendChild(field("Other phone", alt));
      host.appendChild(g);
      var row = el("div", "ph-btnrow");
      var save = cta("Save", "", function () {
        save.disabled = true;
        API.family.contact(X.me().id, { mailingAddress: addr.value.trim() || null, cellPhone: cell.value.trim() || null, altPhone: alt.value.trim() || null, dateOfBirth: c.dateOfBirth || null })
          .then(function () { X.bust("contact"); P.toast("Saved"); K.open("profile"); }, function (e) { save.disabled = false; P.toast(e && e.message ? e.message : "That didn’t save."); });
      });
      row.appendChild(save);
      host.appendChild(row);
    } });
  }

  /* ============================================================== Requests */
  var RANK = { 0: "Set by the school", 1: "First choice", 2: "Second choice", 3: "Third choice" };
  function buildRequests(L) {
    L.head({ eyebrow: "Me", title: "Course requests", sub: "The courses you’d like to take next year. The school builds the schedule from what students ask for." });
    var host = L.add(el("div"));
    host.appendChild(P.skel(3, 66));
    var SC = API.schedule;
    Promise.all([D.requests(), D.subjects(), D.sections()]).then(function (r) {
      host.innerHTML = "";
      var list = r[0].map(function (x) { return { subjectId: x.subjectId, rank: x.rank, title: x.title, number: x.number }; });
      var subjects = r[1].filter(function (x) { return !x.retired && x.requestable; }), now = r[2], dirty = false;
      var box = el("div");
      host.appendChild(box);
      var save = cta("Save my choices", "", function () {
        save.disabled = true;
        SC.putRequests(X.me().id, list.filter(function (x) { return x.rank !== 0; }).map(function (x) { return { subjectId: x.subjectId, rank: x.rank }; })).then(function () {
          X.bust("requests"); dirty = false; P.toast("Saved"); draw();
        }, function (e) { save.disabled = false; P.toast(e && e.message ? e.message : "That wasn’t saved."); });
      });
      function name(x) { return x.number ? x.number + " · " + x.title : x.title; }
      function draw() {
        box.innerHTML = "";
        var req = list.filter(function (x) { return x.rank === 0; }), mine = list.filter(function (x) { return x.rank !== 0; });
        if (req.length) {
          box.appendChild(P.sh("Required"));
          var rg = P.group();
          req.forEach(function (x) { rg.appendChild(P.row({ title: name(x), valueHtml: P.pill("Set by the school") })); });
          box.appendChild(rg);
        }
        box.appendChild(P.sh("Your choices"));
        var mg = P.group();
        if (!mine.length) mg.appendChild(el("div", "ph-prose", "You haven’t asked for any course yet."));
        mine.sort(function (a, b) { return a.rank - b.rank; }).forEach(function (x) {
          mg.appendChild(P.row({ title: name(x), sub: RANK[x.rank], go: function () {
            var sheet = P.sheet({ title: x.title, sub: x.number || "", tone: "indigo", body: function (b) {
              var g = P.group();
              [1, 2, 3].forEach(function (k) {
                g.appendChild(P.row({ title: RANK[k], valueHtml: x.rank === k ? "✓" : "", chev: false, go: function () { x.rank = k; dirty = true; sheet.close(); draw(); } }));
              });
              b.appendChild(g);
              var rm = el("div", "ph-btnrow");
              rm.appendChild(cta("Remove", "danger", function () { list.splice(list.indexOf(x), 1); dirty = true; sheet.close(); draw(); }));
              b.appendChild(rm);
            } });
          } }));
        });
        box.appendChild(mg);
        var have = {}, taking = {};
        list.forEach(function (x) { have[x.subjectId] = true; });
        now.forEach(function (s) { if (s.subjectId) taking[s.subjectId] = true; });
        var offer = subjects.filter(function (x) { return !have[x.id]; });
        box.appendChild(P.sh("Add a course"));
        if (!offer.length) box.appendChild(el("p", "ph-sub", "The school hasn’t opened any other course for requests."));
        else {
          var og = P.group();
          offer.forEach(function (x) {
            og.appendChild(P.row({ icon: "plus", tone: "indigo", title: x.title, sub: [x.number, taking[x.id] ? "you take this now" : "", x.approval ? "needs a teacher’s approval" : ""].filter(Boolean).join(" · "), chev: false, go: function () {
              list.push({ subjectId: x.id, rank: Math.min(3, mine.length + 1), title: x.title, number: x.number });
              dirty = true; draw();
            } }));
          });
          box.appendChild(og);
        }
        var row = el("div", "ph-btnrow");
        save.disabled = !dirty;
        save.textContent = dirty ? "Save my choices" : "Saved";
        row.appendChild(save);
        box.appendChild(row);
        box.appendChild(P.note("A second or third choice is used only when a first choice can’t be placed. Asking is not a promise of a seat."));
      }
      draw();
    }, function (e) { P.fail(host, e, function () { K.open("requests"); }); });
  }

  /* ================================================================ Account */
  function uaName(ua) {
    ua = String(ua || "");
    var b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "A browser";
    var o = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Mac OS X|Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /CrOS/.test(ua) ? "Chromebook" : /Linux/.test(ua) ? "Linux" : "";
    return b + (o ? " on " + o : "");
  }
  function buildAccount(L) {
    var me = X.me();
    L.head({ eyebrow: "Me", title: "Account", sub: "How you sign in, and where you are signed in." });
    var g = P.group();
    g.style.marginTop = "14px";
    [["Name", me.name], ["Email", me.email], ["School", K.schoolName()]].forEach(function (x) { g.appendChild(el("div", "ph-kv", "<small>" + esc(x[0]) + "</small><span>" + esc(x[1]) + "</span>")); });
    L.add(g);
    L.add(P.note("This is your Oplo Account. Your password is typed only on the Oplo sign-in page and is never kept on this phone."));

    L.add(P.sh("Password"));
    var cur = input("", { type: "password", auto: "current-password" }), nxt = input("", { type: "password", auto: "new-password" });
    var pg = P.group();
    pg.appendChild(field("Current password", cur));
    pg.appendChild(field("New password", nxt));
    L.add(pg);
    var row = el("div", "ph-btnrow");
    var go = cta("Change password", "", function () {
      if (!cur.value || !nxt.value) { P.toast("Both fields, please."); return; }
      go.disabled = true;
      API.changePassword(cur.value, nxt.value).then(function () {
        go.disabled = false; cur.value = ""; nxt.value = "";
        P.toast("Changed. Every other session was signed out.");
      }, function (e) { go.disabled = false; P.toast(e && e.message ? e.message : "That didn’t work."); });
    });
    row.appendChild(go);
    L.add(row);
    L.add(P.note("Changing it signs you out everywhere else."));

    L.add(P.sh("Where you’re signed in"));
    var host = L.add(el("div"));
    function draw() {
      host.innerHTML = "";
      host.appendChild(P.skel(2, 60));
      API.sessions().then(function (list) {
        host.innerHTML = "";
        list.sort(function (a, b) { return (b.current ? 1 : 0) - (a.current ? 1 : 0) || (b.lastSeenAt || 0) - (a.lastSeenAt || 0); });
        var sg = P.group();
        list.forEach(function (x) {
          sg.appendChild(P.row({ icon: /iPhone|Android/.test(x.userAgent || "") ? "pin" : "server", tone: x.current ? "blue" : "gray", title: uaName(x.userAgent), sub: "Signed in " + X.relDay(x.createdAt) + (x.current ? "" : " · last used " + X.relDay(x.lastSeenAt || x.createdAt)), valueHtml: x.current ? P.pill("This one", "blue") : "" }));
        });
        host.appendChild(sg);
        var others = list.filter(function (x) { return !x.current; }).length;
        var acts = el("div", "ph-btnrow");
        var out = cta("Sign out everywhere else", "quiet", function () {
          out.disabled = true;
          API.revokeSessions().then(function () { P.toast("Signed out everywhere else."); draw(); }, function (e) { out.disabled = false; P.toast(e && e.message ? e.message : "That didn’t work."); });
        });
        out.disabled = !others;
        acts.appendChild(out);
        host.appendChild(acts);
        var acts2 = el("div", "ph-btnrow");
        acts2.style.marginTop = "10px";
        acts2.appendChild(cta("Sign out of this phone", "danger", function () { P.signOut(); }));
        host.appendChild(acts2);
      }, function () { host.innerHTML = ""; host.appendChild(el("p", "ph-sub", "Your sessions couldn’t be read from the server.")); });
    }
    draw();
  }

  /* =================================================================== Forms
     Forms the school asks you to read and sign. OEdu keeps no fees or payments,
     so there is nothing here about money. */
  function buildForms(L) {
    L.head({ eyebrow: "School", title: "Forms", sub: "Forms the school asks you to read and sign." });
    var host = L.add(el("div"));
    host.appendChild(P.skel(3, 66));
    var me = X.me();
    Promise.all([API.items.list({ kind: "form" }), API.items.list({ kind: "signature", subjectId: me.id })]).then(function (r) {
      host.innerHTML = "";
      var forms = r[0].filter(function (f) { return f.status === "open" || f.data.audience !== "staff"; }), signed = {};
      r[1].forEach(function (x) { signed[x.data.formId] = x; });
      if (!forms.length) { host.appendChild(P.empty("No forms", "When the school posts a form to read or sign, it appears here.")); return; }
      host.appendChild(el("div")).style.height = "14px";
      var g = P.group();
      forms.forEach(function (f) {
        var sg = signed[f.id];
        g.appendChild(P.row({ icon: "doc", tone: sg ? "green" : "purple", title: f.title, sub: f.dueOn ? "Due " + f.dueOn : "Posted " + X.relDay(f.createdAt),
          valueHtml: sg ? P.pill(sg.status === "signed" ? "Signed" : "Declined", sg.status === "signed" ? "green" : "") : P.pill(f.status === "open" ? "To sign" : "Closed", f.status === "open" ? "orange" : ""), go: function () { openForm(f, sg); } }));
      });
      host.appendChild(g);
      P.rise([g], 0);
    }, function (e) { P.fail(host, e, function () { K.open("forms"); }); });
  }
  function openForm(f, sg) {
    var name = input(sg ? sg.data.typedName : "", { ph: "Type your full name", auto: "name" });
    var ctl = P.sheet({ title: f.title, sub: "Read it, then sign by typing your name.", tone: "purple", body: function (b) {
      var g = P.group();
      g.appendChild(el("div", "ph-prose", esc(f.data.body || "")));
      b.appendChild(g);
      if (sg) b.appendChild(P.note((sg.status === "signed" ? "Signed" : "Declined") + " as " + sg.data.typedName + "."));
      else if (f.status === "open") {
        var g2 = P.group(); g2.style.marginTop = "14px";
        g2.appendChild(field("Your name", name));
        b.appendChild(g2);
        var row = el("div", "ph-btnrow");
        var go = cta("Sign", "", function () {
          if (name.value.trim().length < 2) { P.toast("Type your name to sign."); return; }
          go.disabled = true;
          API.items.create({ kind: "signature", title: "Signed: " + f.title, subjectId: X.me().id, status: "signed", data: { formId: f.id, typedName: name.value.trim() } })
            .then(function () { P.toast("Signed"); ctl.close(); K.open("forms"); }, function (e) { go.disabled = false; P.toast(e && e.message ? e.message : "That didn’t work."); });
        });
        row.appendChild(go);
        b.appendChild(row);
      }
    } });
  }

  /* ================================================== The shared pages, adapted */
  function adapted(key, title, eyebrow, draw) {
    P.present(key, 1, { tone: "blue", label: title, route: function (L) { L.redraw && L.redraw(); } }, function (L) {
      L.head({ eyebrow: eyebrow, title: title });
      var w = el("div", "ph-adapt");
      L.add(w);
      P.shared.adapt(w);
      P.legacy(L, w, draw);
    });
  }

  /* ================================================================= Routing */
  H.buildAccount = function (L) { ready(); buildAccount(L); };
  H.more = function (tab, arg) {
    ready();
    switch (tab) {
      case "attendance": H.layer("attendance", 1, "teal", "Attendance", buildAttendance); return true;
      case "graduation": case "transcript":
        P.present("record", 1, { tone: "purple", label: "Record", route: function (L) { L.setTab(tab); } }, function (L) { buildRecord(L, tab); });
        return true;
      case "profile": H.layer("me", 1, "gray", "Me", buildMe); return true;
      case "requests": H.layer("requests", 2, "indigo", "Course requests", buildRequests, H.up("Me", "profile")); return true;
      case "account": H.layer("account", 2, "gray", "Account", buildAccount, H.up("Me", "profile")); return true;
      case "forms": H.layer("forms", 1, "purple", "Forms", buildForms); return true;
      case "inbox": H.layer("inbox", 1, "blue", "Inbox", P.shared.buildInbox); return true;
      case "events": adapted("events", "Events", "School", function (w) { K.stu().events(w); }); return true;
      case "menu": adapted("menu", "Menu", "School", function (w) { K.stu().menu(w); }); return true;
    }
    return false;
  };
};
