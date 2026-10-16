/* ==========================================================================
   OEdu — the schedule, for the people who set it.

   A school thinks in two layers. A COURSE is a subject — World History, with
   a number, credits and a GPA scale. A SECTION is one instance of it: period
   3 by Ms. Ladas in room 17 with 27 students. A section is the row OEdu has
   always kept as a course: its roster, gradebook and registers are the
   section's, so nothing here moves them. What this adds is the course above
   it, the periods it meets in, and the calendar those periods run on.

     Bell schedules   named days made of periods, with optional times
     School days      which bell schedule each weekday runs, and the dates that
                      differ: a holiday, a staff day, a snow day
     Courses          the school's subjects
     Sections         each instance: teachers, periods, room, capacity, roster
     Add / drop       one student's sections, what they asked for, and the ones they could be in
     Plans            a term or next year drawn apart from the live schedule, checked against
                      what students asked for, built, then published

   Who may set any of it is decided on the server (a principal, registrar or
   administrator). A teacher or student reads the bell schedules and calendar.

   Mounted by app.js with the console kit: OPLO_SCHEDULE(kit) →
   { bell, days, courses, sections, addDrop, plans }.
   ========================================================================== */
window.OPLO_SCHEDULE = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, SC = API.schedule, toast = K.toast;

  /* ------------------------------------------------------------- Dates */
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function add(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function today() { return iso(new Date()); }
  function label(s) { var d = parse(s); return DOW[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()].slice(0, 3); }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }
  function minutes(a, b) {
    if (!a || !b) return null;
    var x = a.split(":"), y = b.split(":"), m = (+y[0] * 60 + +y[1]) - (+x[0] * 60 + +x[1]);
    return m > 0 ? m : null;
  }

  /* ------------------------------------------------------------ Pieces */
  function button(text, cls, go) {
    var b = el("button", cls || "en-btn", esc(text));
    b.type = "button";
    if (go) b.addEventListener("click", go);
    return b;
  }
  function field(text, node, note) {
    var w = el("label", "admin-field sc-f");
    w.appendChild(el("span", null, esc(text)));
    w.appendChild(node);
    if (note) w.appendChild(el("small", "sc-fnote", esc(note)));
    return w;
  }
  function input(type, value, max, ph) {
    var i = el("input", "sc-in");
    i.type = type; i.value = value == null ? "" : String(value);
    if (max) i.maxLength = max;
    if (ph) i.placeholder = ph;
    return i;
  }
  function select(options, value) {
    var s = el("select", "cx-select sc-sel");
    options.forEach(function (o) {
      var op = el("option");
      op.value = o[0] == null ? "" : String(o[0]); op.textContent = o[1];
      if (String(o[0] == null ? "" : o[0]) === String(value == null ? "" : value)) op.selected = true;
      s.appendChild(op);
    });
    return s;
  }
  function check(text, on, note) {
    var l = el("label", "sc-check"), c = el("input");
    c.type = "checkbox"; c.checked = !!on;
    l.appendChild(c);
    l.appendChild(el("span", null, esc(text) + (note ? "<small>" + esc(note) + "</small>" : "")));
    l.box = c;
    return l;
  }
  /* A sheet with a body and one decision. Its buttons are .en-btn because the
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
    (o.extra || []).forEach(function (b) { acts.appendChild(b(ctl)); });
    acts.appendChild(button(o.action ? "Cancel" : "Close", "en-btn quiet", ctl.close));
    if (o.action) {
      var go = button(o.action, o.tone === "danger" ? "en-btn danger" : "en-btn strong", function () {
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

  var PEOPLE = null;
  function people() {
    if (PEOPLE) return Promise.resolve(PEOPLE);
    return API.accounts.list(K.S.me.orgId).then(function (l) { PEOPLE = l || []; return PEOPLE; }, function () { return []; });
  }
  /* A few letters become a short list of people; picking one calls back. */
  function finder(placeholder, pick) {
    var wrap = el("div", "sc-find");
    var inp = el("input", "cn-search");
    inp.type = "search"; inp.placeholder = placeholder; inp.setAttribute("aria-label", placeholder);
    var list = el("div", "sc-find-list");
    list.hidden = true;
    inp.addEventListener("input", function () {
      var t = inp.value.trim().toLowerCase();
      list.innerHTML = "";
      if (t.length < 2) { list.hidden = true; return; }
      people().then(function (all) {
        var hits = all.filter(function (p) {
          return p.status !== "suspended" && ((p.name || "").toLowerCase().indexOf(t) > -1 || (p.email || "").toLowerCase().indexOf(t) > -1);
        }).slice(0, 8);
        list.innerHTML = "";
        if (!hits.length) list.appendChild(el("p", "sc-find-none", "Nobody by that name."));
        hits.forEach(function (p) {
          var b = el("button", "sc-find-i");
          b.type = "button";
          b.appendChild(K.cxWho(p));
          b.addEventListener("click", function () { list.hidden = true; inp.value = ""; pick(p); });
          list.appendChild(b);
        });
        list.hidden = false;
      });
    });
    wrap.appendChild(inp);
    wrap.appendChild(list);
    return wrap;
  }
  function slot(v) { var s = el("div", "sc-slot"); v.appendChild(s); return s; }

  /* ===================================================== Bell schedules */
  function bell(v) {
    var P = K.cxPage(v, "Schedule", "Bell schedules",
      "Named days made of periods: Regular, Minimum day, A-day, Monday. A period can have times; leaving them blank is fine. " +
      "Students see these when they sign in.");
    P.tools.appendChild(K.cnAction("New bell schedule", function () { newBell(load); }, true));
    var s = slot(v);

    function load() {
      s.innerHTML = "";
      var n = K.loading(s, "bell schedules");
      SC.bell().then(function (list) {
        n.remove();
        if (!list.length) {
          s.appendChild(K.cnEmpty("No bell schedule yet.", "Start with the school's regular day. Seven numbered periods are made for you to rename and give times.",
            "New bell schedule", function () { newBell(load); }));
          return;
        }
        list.forEach(function (x) { s.appendChild(card(x)); });
        s.appendChild(el("p", "cx-note", "Periods keep the labels you give them: a course meets in “3”, or in “M1” and “T5”. " +
          "To have different periods on different days, use Weekdays on the day to make Monday to Friday copies."));
      }, function (e) { K.failed(n, e, load); });
    }

    function card(x) {
      var rows = x.periods.map(function (p) { return { label: p.label, startsAt: p.startsAt || "", endsAt: p.endsAt || "", kind: p.kind }; });
      var name = x.name, minimum = x.minimumDay;
      var box = el("section", "sc-card");
      var head = el("div", "sc-cardhead");
      var nm = input("text", name, 60);
      nm.setAttribute("aria-label", "Name");
      nm.addEventListener("input", function () { name = nm.value.trim(); });
      head.appendChild(nm);
      var min = check("Minimum day", minimum, "short on minutes");
      min.box.addEventListener("change", function () { minimum = min.box.checked; });
      head.appendChild(min);
      var acts = el("div", "sc-cardacts");
      acts.appendChild(button("Weekdays", "en-btn quiet", function () {
        dialog({ title: "Monday to Friday from “" + x.name + "”",
          sub: "Makes five more schedules, one per weekday, and sets the calendar to run each on its day. Numbered periods take the day’s letter: 1 becomes M1, T1, W1, R1, F1. A period with a word for a name, like Lunch, stays as it is.",
          action: "Make five schedules",
          onSubmit: function () { return SC.weekdays(x.id).then(function (r) { toast(plural(r.made.length, "schedule") + " made"); load(); }); } });
      }));
      acts.appendChild(button("Delete", "en-btn quiet", function () {
        dialog({ title: "Delete “" + x.name + "”?", sub: "Days that still run it must be given another first; the page says so if any do.", action: "Delete", tone: "danger",
          onSubmit: function () { return SC.deleteBell(x.id).then(function () { toast("Deleted"); load(); }); } });
      }));
      head.appendChild(acts);
      box.appendChild(head);

      var list = el("div", "sc-periods");
      function draw() {
        list.innerHTML = "";
        var hd = el("div", "sc-prow head");
        ["Period", "Starts", "Ends", "Minutes", "Kind", ""].forEach(function (t) { hd.appendChild(el("span", null, t)); });
        list.appendChild(hd);
        rows.forEach(function (r, i) {
          var row = el("div", "sc-prow");
          var lb = input("text", r.label, 24); lb.setAttribute("aria-label", "Period name");
          lb.addEventListener("input", function () { r.label = lb.value.trim(); });
          var st = input("time", r.startsAt), en = input("time", r.endsAt);
          var mm = el("span", "sc-min", ""), upd = function () { var m = minutes(r.startsAt, r.endsAt); mm.textContent = m ? m + " min" : ""; };
          st.addEventListener("input", function () { r.startsAt = st.value; upd(); });
          en.addEventListener("input", function () { r.endsAt = en.value; upd(); });
          upd();
          var kd = select([["class", "Class"], ["other", "Lunch, advisory…"]], r.kind);
          kd.addEventListener("change", function () { r.kind = kd.value; });
          var rm = button("×", "sc-rm", function () { rows.splice(i, 1); draw(); });
          rm.setAttribute("aria-label", "Remove period");
          [lb, st, en, mm, kd, rm].forEach(function (n) { row.appendChild(n); });
          list.appendChild(row);
        });
      }
      draw();
      box.appendChild(list);
      var foot = el("div", "sc-cardfoot");
      foot.appendChild(button("Add a period", "en-btn quiet", function () { rows.push({ label: "", startsAt: "", endsAt: "", kind: "class" }); draw(); }));
      foot.appendChild(button("Save", "en-btn strong", function () {
        if (rows.some(function (r) { return !r.label; })) { toast("Every period needs a name."); return; }
        SC.updateBell(x.id, { name: name, minimumDay: minimum, periods: rows.map(function (r) {
          return { label: r.label, startsAt: r.startsAt || null, endsAt: r.endsAt || null, kind: r.kind };
        }) }).then(function () { toast("Saved"); load(); }, function (e) { toast(e && e.message ? e.message : "That was not saved."); });
      }));
      box.appendChild(foot);
      return box;
    }
    load();
  }

  function newBell(done) {
    var nm = input("text", "", 60, "Regular day");
    dialog({ title: "New bell schedule", sub: "Seven numbered periods are made; rename them, add times, take away what you do not use.",
      body: function (host) { host.appendChild(field("Name", nm)); }, action: "Make it",
      onSubmit: function () {
        var name = nm.value.trim();
        if (!name) throw new Error("Give it a name.");
        return SC.createBell({ name: name }).then(function () { toast("Made"); done(); });
      } });
  }

  /* ========================================================= School days */
  var CAL = { month: null };

  function days(v) {
    var P = K.cxPage(v, "Schedule", "School days",
      "Which days are school, which bell schedule each runs, and the days off. A usual week sets the weekdays; a date can differ.");
    var s = slot(v);
    if (!CAL.month) CAL.month = today().slice(0, 7) + "-01";
    P.tools.appendChild(K.cnAction("Set several days", function () { bulk(null); }, true));

    var data = null;
    function load() {
      s.innerHTML = "";
      var n = K.loading(s, "the calendar");
      var first = parse(CAL.month), gridStart = add(CAL.month, -((first.getDay() + 6) % 7));
      var last = new Date(first.getFullYear(), first.getMonth() + 1, 0), gridEnd = add(iso(last), (7 - ((last.getDay() + 6) % 7) - 1) % 7);
      SC.calendar(gridStart, gridEnd).then(function (r) {
        n.remove();
        data = r;
        draw(gridStart, gridEnd);
      }, function (e) { K.failed(n, e, load); });
    }

    function scheduleName(id) {
      var x = data.schedules.filter(function (z) { return z.id === id; })[0];
      return x ? x.name : "";
    }
    function scheduleOptions(withNone, noneLabel) {
      var o = [];
      if (withNone) o.push(["", noneLabel || "No bell schedule"]);
      data.schedules.forEach(function (x) { o.push([x.id, x.name + (x.minimumDay ? " (minimum)" : "")]); });
      return o;
    }

    function draw(gridStart, gridEnd) {
      s.innerHTML = "";
      var wrap = el("div", "sc-days");
      s.appendChild(wrap);

      /* the usual week */
      var wk = el("section", "sc-card sc-week");
      wk.appendChild(el("h3", null, "A usual week"));
      var pat = Object.assign({}, data.pattern), sels = {};
      [[1, "Monday"], [2, "Tuesday"], [3, "Wednesday"], [4, "Thursday"], [5, "Friday"], [6, "Saturday"], [0, "Sunday"]].forEach(function (d) {
        var row = el("div", "sc-wrow");
        row.appendChild(el("span", null, d[1]));
        var opts = [["__off", "No school"], ["", "School, no bell schedule"]].concat(scheduleOptions(false));
        var cur = pat[String(d[0])] === null ? "__off" : pat[String(d[0])];
        var sel = select(opts, cur);
        sel.addEventListener("change", function () { pat[String(d[0])] = sel.value === "__off" ? null : sel.value; });
        sels[d[0]] = sel;
        row.appendChild(sel);
        wk.appendChild(row);
      });
      var ys = input("date", data.yearStart || ""), ye = input("date", data.yearEnd || "");
      var yr = el("div", "sc-year");
      yr.appendChild(field("School year starts", ys)); yr.appendChild(field("and ends", ye));
      wk.appendChild(yr);
      wk.appendChild(button("Save the week", "en-btn strong", function () {
        SC.putPattern({ pattern: pat, yearStart: ys.value || null, yearEnd: ye.value || null }).then(function () { toast("Saved"); load(); },
          function (e) { toast(e && e.message ? e.message : "That was not saved."); });
      }));
      if (!data.schedules.length) wk.appendChild(el("p", "cx-note", "Make a bell schedule first, and the week can run it."));
      wrap.appendChild(wk);

      /* a month */
      var mo = el("section", "sc-month");
      var bar = el("div", "sc-monthbar");
      var prev = button("‹", "at-nb", function () { CAL.month = add(CAL.month, -1).slice(0, 7) + "-01"; load(); });
      var next = button("›", "at-nb", function () { var d = parse(CAL.month); d.setMonth(d.getMonth() + 1); CAL.month = iso(d); load(); });
      prev.setAttribute("aria-label", "Earlier month"); next.setAttribute("aria-label", "Later month");
      bar.appendChild(prev);
      bar.appendChild(el("b", null, MON[parse(CAL.month).getMonth()] + " " + parse(CAL.month).getFullYear()));
      bar.appendChild(next);
      bar.appendChild(button("This month", "at-link", function () { CAL.month = today().slice(0, 7) + "-01"; load(); }));
      mo.appendChild(bar);
      var grid = el("div", "sc-grid");
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(function (d) { grid.appendChild(el("div", "sc-dow", d)); });
      var by = {};
      data.days.forEach(function (d) { by[d.day] = d; });
      for (var d = gridStart; d <= gridEnd; d = add(d, 1)) {
        (function (day) {
          var e = by[day];
          var inMonth = day.slice(0, 7) === CAL.month.slice(0, 7);
          var c = el("button", "sc-day k-" + (e ? e.kind : "none") + (inMonth ? "" : " out") + (day === today() ? " today" : ""));
          c.type = "button";
          // A weekday that runs its own schedule says nothing: only a day that differs says what it runs.
          var usual = e && e.source === "pattern" && e.scheduleId && scheduleName(e.scheduleId) === ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][e.weekday];
          var what = !e ? "" : e.kind === "school" ? (usual ? "" : e.scheduleId ? scheduleName(e.scheduleId) : "School") :
            e.kind === "holiday" ? (e.label || "Holiday") : e.kind === "staff" ? (e.label || "Staff day") :
            e.kind === "canceled" ? (e.label || "Canceled") : "";
          c.innerHTML = "<b>" + parse(day).getDate() + "</b><span>" + esc(what) + "</span>" + (e && e.source === "day" ? "<i title='Set for this date'></i>" : "");
          c.title = label(day) + (what ? " — " + what : "");
          c.addEventListener("click", function () { one(day, e); });
          grid.appendChild(c);
        })(d);
      }
      mo.appendChild(grid);
      var key = el("div", "sc-key");
      key.innerHTML = "<span class='k-school'>School</span><span class='k-holiday'>Holiday</span><span class='k-staff'>Staff day</span><span class='k-canceled'>Canceled</span><span class='k-none'>No school</span><span><i></i> set for the date</span>";
      mo.appendChild(key);
      wrap.appendChild(mo);
    }

    var KINDS = [["school", "School day"], ["holiday", "Holiday"], ["staff", "Staff day"], ["canceled", "Canceled (snow day…)"], ["clear", "Back to the usual week"]];
    function one(day, e) {
      var kind = select(KINDS, e && e.source === "day" ? e.kind : "clear");
      var sch = select(scheduleOptions(true, "Without a bell schedule"), e && e.scheduleId || "");
      var lb = input("text", e && e.label || "", 80, "Fall break, snow day…");
      var sw = field("Bell schedule", sch);
      function show() { sw.hidden = kind.value !== "school"; }
      kind.addEventListener("change", show);
      dialog({ title: label(day), sub: e && e.source === "pattern" ? "Following the usual week." : e && e.source === "year" ? "Outside the school year." : "Set for this date.",
        body: function (host) { host.appendChild(field("This date is", kind)); host.appendChild(sw); host.appendChild(field("Reason", lb)); show(); },
        action: "Save",
        onSubmit: function () {
          var k = kind.value;
          return SC.putDays([{ day: day, kind: k, scheduleId: k === "school" && sch.value ? sch.value : null, label: lb.value.trim() || null }])
            .then(function () { toast("Saved"); load(); });
        } });
    }

    function bulk() {
      var f = input("date", today()), t = input("date", today());
      var kind = select(KINDS.slice(0, 4).concat([["clear", "Back to the usual week"]]), "holiday");
      var sch = select(scheduleOptions(true, "Without a bell schedule"), "");
      var sw = field("Bell schedule", sch);
      var lb = input("text", "", 80, "Fall break");
      var wk = check("Leave weekends alone", true, "a span that crosses a weekend does not mark the Saturday and Sunday");
      function show() { sw.hidden = kind.value !== "school"; }
      kind.addEventListener("change", show);
      dialog({ title: "Set several days", sub: "A run of dates at once: a week of break, a month of exams on the minimum schedule.",
        body: function (host) {
          var r = el("div", "sc-row"); r.appendChild(field("From", f)); r.appendChild(field("To", t)); host.appendChild(r);
          host.appendChild(field("These days are", kind)); host.appendChild(sw); host.appendChild(field("Reason", lb)); host.appendChild(wk); show();
        }, action: "Apply",
        onSubmit: function () {
          if (!f.value || !t.value || t.value < f.value) throw new Error("Choose the first and last day.");
          var k = kind.value;
          return SC.putDays([{ from: f.value, to: t.value, kind: k, scheduleId: k === "school" && sch.value ? sch.value : null,
                               label: lb.value.trim() || null, skipWeekends: wk.box.checked }]).then(function (r) { toast(plural(r.set, "day") + " set"); load(); });
        } });
    }
    load();
  }

  /* ============================================================== Courses */
  var DURATIONS = [["quarter", "1 quarter"], ["trimester", "1 trimester"], ["semester", "1 semester"], ["year", "All year"]];
  var GPAS = [["regular", "Regular"], ["honors", "Honors"], ["ap", "AP"]];

  function courses(v) {
    var P = K.cxPage(v, "Schedule", "Courses",
      "The school’s subjects: a number, credits, a GPA scale, and how each appears on report cards and transcripts. " +
      "A course is taught in sections.");
    P.tools.appendChild(K.cnAction("Courses from sections", fromSections));
    P.tools.appendChild(K.cnAction("New course", function () { editor(null); }, true));
    var s = slot(v);
    var show = "active";

    function load() {
      s.innerHTML = "";
      var n = K.loading(s, "courses");
      SC.subjects().then(function (list) {
        n.remove();
        var live = list.filter(function (x) { return !x.retired; });
        var chips = K.cnFilters([{ k: "active", name: "In use", n: live.length }, { k: "retired", name: "Retired", n: list.length - live.length }], show, function (k) { show = k; load(); });
        s.appendChild(chips);
        var shown = list.filter(function (x) { return show === "retired" ? x.retired : !x.retired; });
        if (!shown.length) {
          s.appendChild(K.cnEmpty(show === "retired" ? "Nothing retired." : "No courses yet.",
            show === "retired" ? "" : "Make the school’s courses here, or build them from the sections you already have.", show === "retired" ? null : "New course", function () { editor(null); }));
          return;
        }
        var t = K.cnTable([{ label: "Number", w: "96px" }, { label: "Course", w: "minmax(180px, 1.6fr)" }, { label: "Credits", w: "76px", align: "right" },
          { label: "Lasts", w: "100px" }, { label: "GPA", w: "84px" }, { label: "Sections", w: "84px", align: "right" }, { label: "Appears on", w: "minmax(140px, 1fr)" }]);
        shown.forEach(function (x) {
          var notes = [];
          if (x.extracurricular) notes.push("Activity");
          if (!x.onReportCards) notes.push("no report card");
          if (!x.onTranscripts) notes.push("no transcript");
          if (!x.countAttendance) notes.push("no attendance");
          t.row(["<b>" + esc(x.number) + "</b>", "<b>" + esc(x.title) + "</b>" + (x.gradReq ? "<span class='cn-sub2'>" + esc(x.gradReq) + "</span>" : ""),
                 String(x.credits), esc((DURATIONS.filter(function (d) { return d[0] === x.duration; })[0] || [0, x.duration])[1]),
                 esc((GPAS.filter(function (g) { return g[0] === x.gpa; })[0] || [0, x.gpa])[1]), String(x.sections || 0),
                 notes.length ? esc(notes.join(" · ")) : K.cxNone("Everywhere")], function () { editor(x); }, x.id);
        });
        s.appendChild(t);
      }, function (e) { K.failed(n, e, load); });
    }

    function editor(x) {
      var f = x || { number: "", title: "", duration: "year", credits: 0, gpa: "regular", showOnline: true, countAttendance: true, onReportCards: true,
                     onTranscripts: true, collegeCredit: true };
      var title = input("text", f.title, 50), number = input("text", f.number, 20);
      var dur = select(DURATIONS, f.duration), gpa = select(GPAS, f.gpa);
      var cr = input("number", f.credits), mx = input("number", f.maxCredits);
      cr.step = mx.step = "0.5"; cr.min = mx.min = "0";
      var req = input("text", f.gradReq, 60, "English, Social Studies…"), cap = input("number", f.capacity), pos = input("number", f.position);
      cap.min = "1"; pos.min = "1"; pos.max = "100";
      var grades = input("text", (f.grades || []).join(", "), 120, "9, 10");
      var cat = input("text", f.catalogCode, 64, "algebra-1");
      var std = input("text", f.standards, 80);
      var desc = el("textarea", "sc-in"); desc.rows = 3; desc.maxLength = 1000; desc.value = f.description || "";
      var flags = [["extracurricular", "Extracurricular", "a sport, a club, an activity"], ["showOnline", "Show online to students and families"],
        ["countAttendance", "Count attendance", "off for clubs and sports"], ["onReportCards", "Show on report cards"], ["onTranscripts", "Show on transcripts"],
        ["collegeCredit", "Count for college admissions", "in the unweighted GPA and credits"], ["requestable", "Students may request it"],
        ["approval", "A staff member must recommend the student"]].map(function (a) { return { k: a[0], c: check(a[1], f[a[0]], a[2]) }; });
      var retired = check("Retired", f.retired, "no new sections; sections already made are kept");
      dialog({ wide: true, title: x ? x.title : "New course",
        sub: "A course number is never used for another course. Titles are short, so they fit a report card.",
        body: function (host) {
          var r1 = el("div", "sc-row"); r1.appendChild(field("Title", title)); r1.appendChild(field("Number", number)); host.appendChild(r1);
          var r2 = el("div", "sc-row"); r2.appendChild(field("Lasts", dur)); r2.appendChild(field("Credits", cr)); r2.appendChild(field("At most, if repeated", mx));
          r2.appendChild(field("GPA", gpa)); host.appendChild(r2);
          var r3 = el("div", "sc-row"); r3.appendChild(field("Graduation requirement", req)); r3.appendChild(field("Grade levels", grades));
          r3.appendChild(field("Capacity", cap, "default for its sections")); r3.appendChild(field("Order", pos, "1 first, 100 last")); host.appendChild(r3);
          var r4 = el("div", "sc-row"); r4.appendChild(field("Teaches from the written curriculum", cat, "a curriculum code, if there is one"));
          r4.appendChild(field("Standards", std)); host.appendChild(r4);
          host.appendChild(field("Description", desc));
          var fl = el("div", "sc-checks");
          flags.forEach(function (a) { fl.appendChild(a.c); });
          host.appendChild(fl);
          if (x) host.appendChild(retired);
        }, action: x ? "Save" : "Make the course",
        onSubmit: function () {
          var d = { title: title.value.trim(), number: number.value.trim(), duration: dur.value, gpa: gpa.value,
            credits: cr.value === "" ? 0 : +cr.value, maxCredits: mx.value === "" ? null : +mx.value, gradReq: req.value.trim() || null,
            grades: grades.value.trim() ? grades.value.split(",").map(function (g) { return g.trim(); }).filter(Boolean) : null,
            capacity: cap.value === "" ? null : +cap.value, position: pos.value === "" ? null : +pos.value,
            catalogCode: cat.value.trim() || null, standards: std.value.trim() || null, description: desc.value.trim() || null };
          flags.forEach(function (a) { d[a.k] = a.c.box.checked; });
          if (x) d.retired = retired.box.checked;
          if (!d.title || !d.number) throw new Error("A course needs a title and a number.");
          return (x ? SC.updateSubject(x.id, d) : SC.createSubject(d)).then(function () { toast("Saved"); load(); });
        } });
    }

    /* The sections a school already has become courses: one per title. */
    function fromSections() {
      SC.sections().then(function (secs) {
        var free = secs.filter(function (z) { return !z.subjectId; });
        if (!free.length) { toast("Every section already has a course."); return; }
        var groups = {};
        free.forEach(function (z) { (groups[z.title] = groups[z.title] || []).push(z); });
        var titles = Object.keys(groups);
        dialog({ title: "Courses from sections", sub: plural(free.length, "section") + " have no course. This makes one course per title and puts each section under it.",
          body: function (host) {
            var ul = el("ul", "sc-list");
            titles.forEach(function (tt) { ul.appendChild(el("li", null, "<b>" + esc(tt) + "</b> · " + plural(groups[tt].length, "section"))); });
            host.appendChild(ul);
          }, action: "Make " + plural(titles.length, "course"),
          onSubmit: function () {
            var made = 0;
            return SC.subjects().then(function (have) {
              var numbers = {};
              have.forEach(function (h) { numbers[h.number] = 1; });
              return titles.reduce(function (p, tt) {
                return p.then(function () {
                  var first = groups[tt][0];
                  var base = String(first.catalogCode || first.code || tt).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 16) || "COURSE";
                  var num = base, i = 2;
                  while (numbers[num]) num = base + "-" + (i++);
                  numbers[num] = 1;
                  return SC.createSubject({ number: num, title: tt.slice(0, 50), catalogCode: first.catalogCode || null }).then(function (sub) {
                    made++;
                    return groups[tt].reduce(function (q, z) { return q.then(function () { return SC.putSection(z.courseId, { subjectId: sub.id }); }); }, Promise.resolve());
                  });
                });
              }, Promise.resolve());
            }).then(function () { toast(plural(made, "course") + " made"); load(); });
          } });
      }, function (e) { toast(e && e.message ? e.message : "The sections could not be read."); });
    }
    load();
  }

  /* ============================================================ Sections */
  var VIEW = { mode: "list", filter: "all" };

  function sections(v) {
    var P = K.cxPage(v, "Schedule", "Sections",
      "Each section is one instance of a course: its teachers, the periods it meets in, a room, a capacity and a roster.");
    P.tools.appendChild(K.cnAction("New section", function () { editor(null, load); }, true));
    var s = slot(v);
    var cache = null;

    function load() {
      s.innerHTML = "";
      var n = K.loading(s, "sections");
      Promise.all([SC.sections(), SC.subjects(), SC.bell()]).then(function (r) {
        n.remove();
        cache = { sections: r[0], subjects: r[1], bell: r[2] };
        draw();
      }, function (e) { K.failed(n, e, load); });
    }

    function periodLabels() {
      var seen = {}, out = [];
      cache.bell.forEach(function (b) { b.periods.forEach(function (p) { if (p.kind !== "other" && !seen[p.label]) { seen[p.label] = 1; out.push(p.label); } }); });
      return out;
    }

    function draw() {
      s.innerHTML = "";
      var away = cache.sections.filter(function (z) { return z.status === "archived"; });
      var all = cache.sections.filter(function (z) { return z.status !== "archived"; });
      var counts = {
        all: all.length,
        unplaced: all.filter(function (z) { return !z.placed; }).length,
        noteacher: all.filter(function (z) { return !z.teachers.length; }).length,
        full: all.filter(function (z) { return z.capacity != null && z.students > z.capacity; }).length,
        nocourse: all.filter(function (z) { return !z.subjectId; }).length
      };
      K.cxMetrics(s, [{ label: "Sections", value: counts.all }, { label: "Not in a period", value: counts.unplaced, bad: true },
        { label: "No teacher", value: counts.noteacher, bad: true }, { label: "Over capacity", value: counts.full, bad: true },
        { label: "No course", value: counts.nocourse, note: counts.nocourse ? "Courses › Courses from sections" : "" }]);
      var bar = el("div", "cx-bar");
      var chips = K.cnFilters([{ k: "all", name: "All", n: counts.all }, { k: "unplaced", name: "Not in a period", n: counts.unplaced },
        { k: "noteacher", name: "No teacher", n: counts.noteacher }, { k: "full", name: "Over capacity", n: counts.full }]
        .concat(away.length ? [{ k: "away", name: "Put away", n: away.length }] : []), VIEW.filter, function (k) { VIEW.filter = k; draw(); });
      bar.appendChild(chips);
      bar.appendChild(el("span", "sc-spacer"));
      bar.appendChild(K.cnFilters([{ k: "list", name: "List" }, { k: "grid", name: "By period" }], VIEW.mode, function (k) { VIEW.mode = k; draw(); }));
      s.appendChild(bar);

      var rows = (VIEW.filter === "away" ? away : all).filter(function (z) {
        return VIEW.filter === "unplaced" ? !z.placed : VIEW.filter === "noteacher" ? !z.teachers.length :
               VIEW.filter === "full" ? z.capacity != null && z.students > z.capacity : true;
      });
      if (!rows.length) {
        if (VIEW.filter === "away") VIEW.filter = "all";
        s.appendChild(K.cnEmpty(all.length ? "Nothing matches." : "No sections yet.",
          all.length ? "Choose another filter." : "Make a course, then a section of it, with its teacher and period.", all.length ? null : "New section", function () { editor(null, load); }));
        return;
      }
      if (VIEW.mode === "grid" && VIEW.filter !== "away") { grid(rows); return; }
      var t = K.cnTable([{ label: "Section", w: "minmax(180px, 1.5fr)" }, { label: "Course", w: "minmax(110px, .8fr)" }, { label: "Teacher", w: "minmax(150px, 1.2fr)" },
        { label: "Period", w: "110px" }, { label: "Room", w: "80px" }, { label: "Students", w: "100px", align: "right" }]);
      rows.forEach(function (z) {
        var cap = z.capacity != null ? " / " + z.capacity : "";
        t.row(["<b>" + esc(z.title) + "</b>" + (z.sectionNo ? "<span class='cn-sub2'>Section " + esc(z.sectionNo) + (z.tab ? " · " + esc(z.tab) : "") + "</span>" : ""),
               z.subjectNumber ? esc(z.subjectNumber) : K.cxNone("None"),
               z.teachers.length ? esc(z.teachers.map(function (p) { return p.name; }).join(", ")) : "<span class='cx-pill orange'>No teacher</span>",
               z.placed ? esc(z.periods.join(", ")) : "<span class='cx-pill orange'>Not placed</span>",
               z.room ? esc(z.room) : K.cxNone(),
               "<b class='cn-mk" + (z.capacity != null && z.students > z.capacity ? " bad" : "") + "'>" + z.students + "</b>" + esc(cap)],
          function () { editor(z, load); }, z.courseId);
      });
      s.appendChild(t);
    }

    /* Periods across, sections down each: the master schedule. */
    function grid(rows) {
      var labels = periodLabels();
      // Only the periods something meets in, unless nothing does yet: forty empty columns say nothing.
      var used = labels.filter(function (lb) { return rows.some(function (z) { return z.periods.indexOf(lb) > -1; }); });
      if (used.length) labels = used;
      if (!labels.length) { s.appendChild(K.cnEmpty("No periods yet.", "Make a bell schedule and its periods appear here as columns.", "Bell schedules", function () { K.openAdmin(false, "sc-bell"); })); return; }
      var wrap = el("div", "sc-gridwrap");
      var g = el("div", "sc-mgrid");
      g.style.setProperty("--n", labels.length);
      labels.forEach(function (lb) {
        var col = el("div", "sc-mcol");
        var mine = rows.filter(function (z) { return z.periods.indexOf(lb) > -1; });
        col.appendChild(el("h4", null, esc(lb) + "<small>" + plural(mine.length, "section") + "</small>"));
        mine.forEach(function (z) {
          var b = el("button", "sc-mcell");
          b.type = "button";
          b.innerHTML = "<b>" + esc(z.title) + "</b><span>" + esc(z.teachers.map(function (p) { return p.name; }).join(", ") || "No teacher") + (z.room ? " · " + esc(z.room) : "") + "</span><em>" + z.students + (z.capacity != null ? "/" + z.capacity : "") + "</em>";
          b.addEventListener("click", function () { editor(z, load); });
          col.appendChild(b);
        });
        g.appendChild(col);
      });
      wrap.appendChild(g);
      s.appendChild(wrap);
      var un = rows.filter(function (z) { return !z.placed; });
      if (un.length) s.appendChild(el("p", "cx-note", plural(un.length, "section") + " not in a period: " + esc(un.slice(0, 6).map(function (z) { return z.title; }).join(", ")) + (un.length > 6 ? "…" : "") + "."));
    }

    /* One section: its facts, its teachers, its roster. */
    function editor(z, done) {
      var isNew = !z;
      var subjects = cache.subjects.filter(function (x) { return !x.retired || (z && z.subjectId === x.id); });
      var f = z || { periods: [], teachers: [], students: 0 };
      var subj = select([["", subjects.length ? "Choose a course" : "No courses yet"]].concat(subjects.map(function (x) { return [x.id, x.number + " · " + x.title]; })), f.subjectId || "");
      var no = input("text", f.sectionNo, 20), tab = input("text", f.tab, 20, "2nd, Gonzales…"), room = input("text", f.room, 40);
      var cap = input("number", f.capacity); cap.min = "1";
      var titleIn = input("text", f.title, 160);
      var chosen = {};
      (f.periods || []).forEach(function (p) { chosen[p] = true; });
      var labels = periodLabels();
      var teachers = (f.teachers || []).slice();
      var newTeachers = [];

      var away = !isNew && f.status === "archived";
      dialog({ wide: true, title: isNew ? "New section" : f.title, sub: isNew ? "A section of a course, with its teacher and the periods it meets in." : (f.sectionNo ? "Section " + f.sectionNo + " · " : "") + (f.code || "") + (away ? " · put away" : ""),
        extra: isNew ? [] : [function (ctl) {
          return button(away ? "Bring back" : "Put away", "en-btn quiet", function () {
            SC.archive([f.courseId], away).then(function () { toast(away ? "Brought back" : "Put away, with its roster and marks kept"); ctl.close(); done(); },
              function (e) { ctl.error(e && e.message ? e.message : "That did not work."); });
          });
        }],
        body: function (host, ctl) {
          var r1 = el("div", "sc-row"); r1.appendChild(field("Course", subj));
          if (isNew) r1.appendChild(field("Title", titleIn, "Leave empty to use the course’s title"));
          r1.appendChild(field("Section number", no)); host.appendChild(r1);
          var r2 = el("div", "sc-row"); r2.appendChild(field("Room", room)); r2.appendChild(field("Capacity", cap, "limits automatic scheduling only")); r2.appendChild(field("Tab", tab, "the short label in a gradebook")); host.appendChild(r2);

          host.appendChild(el("p", "sc-lab", "Periods"));
          var pc = el("div", "sc-checks");
          if (!labels.length) pc.appendChild(el("p", "cx-note", "No bell schedule has periods yet."));
          labels.forEach(function (lb) {
            var c = check(lb, chosen[lb]);
            c.box.addEventListener("change", function () { if (c.box.checked) chosen[lb] = true; else delete chosen[lb]; });
            pc.appendChild(c);
          });
          host.appendChild(pc);
          host.appendChild(el("p", "cx-note", "Pick more than one for a block, or for a rotating schedule: M1 and T5 means period 1 on Mondays and period 5 on Tuesdays."));

          host.appendChild(el("p", "sc-lab", "Teachers"));
          var tl = el("div", "sc-people");
          function drawTeachers() {
            tl.innerHTML = "";
            teachers.forEach(function (p, i) {
              var row = el("div", "sc-person");
              row.appendChild(K.cxWho({ name: p.name, id: p.id }));
              row.appendChild(el("small", null, i === 0 ? "teacher" : "co-teacher"));
              if (!isNew) row.appendChild(button("Remove", "en-btn quiet", function () {
                API.courses.enrol(f.courseId, p.id, p.role || "teacher", true).then(function () { teachers.splice(i, 1); drawTeachers(); toast("Removed"); },
                  function (e) { ctl.error(e.message); });
              }));
              tl.appendChild(row);
            });
            newTeachers.forEach(function (p, i) {
              var row = el("div", "sc-person");
              row.appendChild(K.cxWho(p));
              row.appendChild(el("small", null, "to add"));
              row.appendChild(button("×", "sc-rm", function () { newTeachers.splice(i, 1); drawTeachers(); }));
              tl.appendChild(row);
            });
            if (!teachers.length && !newTeachers.length) tl.appendChild(el("p", "cx-note", "No teacher yet."));
          }
          drawTeachers();
          host.appendChild(tl);
          host.appendChild(finder("Add a teacher or co-teacher", function (p) {
            if (teachers.concat(newTeachers).some(function (x) { return x.id === p.id; })) return;
            newTeachers.push(p); drawTeachers();
          }));

          if (!isNew) {
            host.appendChild(el("p", "sc-lab", "Roster · " + plural(f.students, "student")));
            var ra = el("div", "sc-rosteracts");
            ra.appendChild(button("Add students", "en-btn quiet", function () { ctl.close(); addStudents(f, done); }));
            ra.appendChild(button("Copy from another section", "en-btn quiet", function () { ctl.close(); copyRoster(f, done); }));
            ra.appendChild(button("Drop everyone", "en-btn quiet", function () { ctl.close(); dropAll(f, done); }));
            host.appendChild(ra);
          }
        }, action: isNew ? "Make the section" : "Save",
        onSubmit: function () {
          var periods = labels.filter(function (l) { return chosen[l]; });
          var d = { subjectId: subj.value || null, sectionNo: no.value.trim() || null, tab: tab.value.trim() || null, room: room.value.trim() || null,
                    capacity: cap.value === "" ? null : +cap.value, periods: periods };
          var teacherIds = newTeachers.map(function (p) { return p.id; });
          if (isNew) {
            if (!d.subjectId) throw new Error("Choose the course this is a section of.");
            d.teacherIds = teacherIds.concat([]);
            if (titleIn.value.trim()) d.title = titleIn.value.trim();
            return SC.createSection(d).then(function () { toast("Section made"); done(); });
          }
          return SC.putSection(f.courseId, d).then(function () {
            return teacherIds.reduce(function (p, id) { return p.then(function () { return API.courses.enrol(f.courseId, id, teachers.length ? "assistant" : "teacher"); }); }, Promise.resolve());
          }).then(function () { toast("Saved"); done(); });
        } });
    }

    function addStudents(z, done) {
      var ta = el("textarea", "sc-in"); ta.rows = 7; ta.placeholder = "One per line: a name or an email address";
      dialog({ title: "Add students to " + z.title, sub: "Names are matched against the school’s people. Anyone not found is listed and nobody is added until it is fixed.",
        body: function (host) { host.appendChild(ta); }, action: "Add",
        onSubmit: function () {
          var lines = ta.value.split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
          if (!lines.length) throw new Error("Type or paste at least one name.");
          return people().then(function (all) {
            var ids = [], missing = [];
            lines.forEach(function (l) {
              var low = l.toLowerCase();
              var m = all.filter(function (p) { return (p.email || "").toLowerCase() === low; })[0] ||
                      all.filter(function (p) { return (p.name || "").toLowerCase() === low; })[0];
              if (m) ids.push(m.id); else missing.push(l);
            });
            if (missing.length) throw new Error("Not found: " + missing.slice(0, 6).join(", ") + (missing.length > 6 ? "…" : ""));
            return SC.addStudents(z.courseId, { accountIds: ids }).then(function (r) {
              toast(plural(r.added, "student") + " added" + (r.already ? ", " + r.already + " already in" : "") + (r.over ? ". The section is over its capacity." : ""));
              done();
            });
          });
        } });
    }

    function copyRoster(z, done) {
      var pick = select([["", "Choose a section"]].concat(cache.sections.filter(function (o) { return o.courseId !== z.courseId && o.students; })
        .map(function (o) { return [o.courseId, o.title + (o.periods.length ? " · " + o.periods.join(", ") : "") + " · " + plural(o.students, "student")]; })), "");
      dialog({ title: "Copy a roster into " + z.title, sub: "Everyone in the other section is added here. The two are not kept in step afterwards.",
        body: function (host) { host.appendChild(field("From", pick)); }, action: "Copy",
        onSubmit: function () {
          if (!pick.value) throw new Error("Choose a section.");
          return SC.addStudents(z.courseId, { copyFrom: pick.value }).then(function (r) { toast(plural(r.added, "student") + " added"); done(); });
        } });
    }

    function dropAll(z, done) {
      dialog({ title: "Drop everyone from " + z.title + "?", sub: plural(z.students, "student") + " leave the roster. Their marks stay on record.", action: "Drop everyone", tone: "danger",
        onSubmit: function () { return SC.dropStudents(z.courseId, { all: true }).then(function (r) { toast(plural(r.dropped, "student") + " dropped"); done(); }); } });
    }
    load();
  }

  /* ============================================================ Add / drop */
  var AD = { student: null };
  var RANKS = [[0, "Must take"], [1, "First choice"], [2, "Second choice"], [3, "Third choice"]];

  function addDrop(v) {
    K.cxPage(v, "Schedule", "Add and drop",
      "One student’s sections, and the ones they could be in. A section that is full is dimmed, and you can still place a student there by hand.");
    var bar = el("div", "at-bar");
    v.appendChild(bar);
    var body = el("div");
    v.appendChild(body);
    bar.appendChild(finder("Find a student", function (p) { AD.student = p; draw(); }));
    draw();

    /* What this student asked for, or must take, for the term being planned. */
    function asked(st) {
      var box = el("section", "sc-card sc-asked");
      body.appendChild(el("h3", "sc-h3", "Asked for"));
      body.appendChild(box);
      Promise.all([SC.requests({ accountId: st.id }), SC.subjects()]).then(function (r) {
        var list = r[0].map(function (x) { return { subjectId: x.subjectId, rank: x.rank, title: x.title, number: x.number }; });
        var subjects = r[1].filter(function (x) { return !x.retired; });
        function drawAsked() {
          box.innerHTML = "";
          if (!list.length) box.appendChild(el("p", "cx-note", "Nothing asked for yet. What a student asks for is what Plans seats them in."));
          list.forEach(function (x, i) {
            var row = el("div", "sc-askrow");
            row.appendChild(el("b", null, esc(x.number ? x.number + " · " + x.title : x.title)));
            var rk = select(RANKS, x.rank);
            rk.addEventListener("change", function () { x.rank = +rk.value; });
            row.appendChild(rk);
            row.appendChild(button("×", "sc-rm", function () { list.splice(i, 1); drawAsked(); }));
            box.appendChild(row);
          });
          var have = {};
          list.forEach(function (x) { have[x.subjectId] = true; });
          var pick = select([["", "Add a course"]].concat(subjects.filter(function (x) { return !have[x.id]; })
            .map(function (x) { return [x.id, x.number + " · " + x.title]; })), "");
          pick.addEventListener("change", function () {
            if (!pick.value) return;
            var sub = subjects.filter(function (x) { return x.id === pick.value; })[0];
            list.push({ subjectId: sub.id, rank: 1, title: sub.title, number: sub.number });
            drawAsked();
          });
          var foot = el("div", "sc-askfoot");
          foot.appendChild(pick);
          foot.appendChild(button("Save what they asked for", "en-btn strong", function () {
            SC.putRequests(st.id, list.map(function (x) { return { subjectId: x.subjectId, rank: x.rank }; })).then(function () { toast("Saved"); },
              function (e) { toast(e && e.message ? e.message : "That was not saved."); });
          }));
          box.appendChild(foot);
        }
        drawAsked();
      }, function (e) { box.appendChild(el("p", "cx-note", esc(e && e.message ? e.message : "Their requests could not be read."))); });
    }

    function draw() {
      body.innerHTML = "";
      if (!AD.student) { body.appendChild(K.cnEmpty("Choose a student.", "Search above by name or email.")); return; }
      var st = AD.student;
      var head = el("div", "sc-wholine");
      head.appendChild(K.cxWho(st));
      body.appendChild(head);
      var n = K.loading(body, "their sections");
      Promise.all([SC.studentSections(st.id), SC.sections()]).then(function (r) {
        n.remove();
        var mine = r[0], all = r[1];
        var inIt = {};
        mine.forEach(function (z) { inIt[z.courseId] = true; });
        var used = {};
        mine.forEach(function (z) { z.periods.forEach(function (p) { (used[p] = used[p] || []).push(z.title); }); });

        body.appendChild(el("h3", "sc-h3", "In " + plural(mine.length, "section")));
        if (!mine.length) body.appendChild(el("p", "cx-note", "Not in any section yet."));
        else {
          var t = K.cnTable([{ label: "Section", w: "minmax(180px, 1.5fr)" }, { label: "Teacher", w: "minmax(140px, 1fr)" }, { label: "Period", w: "110px" },
            { label: "Room", w: "70px" }, { label: "", w: "90px", align: "right" }]);
          mine.forEach(function (z) {
            var clash = z.periods.some(function (p) { return (used[p] || []).length > 1; });
            var act = el("span");
            act.appendChild(button("Drop", "en-btn quiet", function () {
              SC.dropStudents(z.courseId, { accountIds: [st.id] }).then(function () { toast("Dropped from " + z.title); draw(); }, function (e) { toast(e.message); });
            }));
            t.row(["<b>" + esc(z.title) + "</b>", esc(z.teachers.map(function (p) { return p.name; }).join(", ")) || K.cxNone(),
                   z.placed ? esc(z.periods.join(", ")) + (clash ? " <span class='cx-pill red'>clash</span>" : "") : K.cxNone("None"), z.room ? esc(z.room) : K.cxNone(), act]);
          });
          body.appendChild(t);
        }

        asked(st);

        body.appendChild(el("h3", "sc-h3", "Could be in"));
        var avail = all.filter(function (z) { return !inIt[z.courseId] && z.status === "published"; });
        if (!avail.length) { body.appendChild(el("p", "cx-note", "No other published sections.")); return; }
        var t2 = K.cnTable([{ label: "Section", w: "minmax(180px, 1.5fr)" }, { label: "Teacher", w: "minmax(140px, 1fr)" }, { label: "Period", w: "110px" },
          { label: "Students", w: "90px", align: "right" }, { label: "", w: "90px", align: "right" }]);
        avail.forEach(function (z) {
          var full = z.capacity != null && z.students >= z.capacity;
          var clash = z.periods.some(function (p) { return (used[p] || []).length; });
          var act = el("span");
          act.appendChild(button("Add", "en-btn quiet", function () {
            SC.addStudents(z.courseId, { accountIds: [st.id] }).then(function () { toast("Added to " + z.title); draw(); }, function (e) { toast(e.message); });
          }));
          var row = t2.row(["<b>" + esc(z.title) + "</b>", esc(z.teachers.map(function (p) { return p.name; }).join(", ")) || K.cxNone(),
                            z.placed ? esc(z.periods.join(", ")) + (clash ? " <span class='cx-pill orange'>same period</span>" : "") : K.cxNone("None"),
                            z.students + (z.capacity != null ? " / " + z.capacity : "") + (full ? " <span class='cx-pill orange'>full</span>" : ""), act]);
          if (full) row.classList.add("sc-dim");
        });
        body.appendChild(t2);
      }, function (e) { K.failed(n, e, draw); });
    }
  }

  /* ============================================================== Plans
     A plan is the schedule as it is going to be, drawn apart from the live
     one: nothing in it shows in a gradebook or a student's day until it is
     published. It is checked against what students asked for, built, and
     then published as one step that says first what it will do. */
  var PLAN = { id: null };
  var FLAGS = { none: ["red", "None offered"], short: ["orange", "Short of seats"], many: ["", "More sections than needed"] };

  function periodLabelsOf(bellList) {
    var seen = {}, out = [];
    bellList.forEach(function (b) { b.periods.forEach(function (p) { if (p.kind !== "other" && !seen[p.label]) { seen[p.label] = 1; out.push(p.label); } }); });
    return out;
  }

  function plans(v) {
    var P = K.cxPage(v, "Schedule", "Plans",
      "Draw a term or next year apart from the live schedule, check it against what students asked for, build it, then publish. " +
      "Nothing changes for anyone until you publish.");
    P.tools.appendChild(K.cnAction("Roll over to next year", function () { newPlan("year"); }));
    P.tools.appendChild(K.cnAction("New plan", function () { newPlan("term"); }, true));
    var s = slot(v);
    var live = null;

    function load() {
      if (PLAN.id) { open(); return; }
      s.innerHTML = "";
      var n = K.loading(s, "plans");
      Promise.all([SC.drafts(), SC.analyze("live")]).then(function (r) {
        n.remove();
        live = r[1];
        var list = r[0];
        if (!list.length) {
          s.appendChild(K.cnEmpty("No plan yet.", "A term plan changes the live schedule; a year plan is next year’s sections, made from this year’s.",
            "New plan", function () { newPlan("term"); }));
        } else {
          var t = K.cnTable([{ label: "Plan", w: "minmax(180px, 1.6fr)" }, { label: "For", w: "120px" }, { label: "Sections", w: "90px", align: "right" },
            { label: "Rosters", w: "120px" }, { label: "State", w: "150px" }]);
          list.forEach(function (d) {
            t.row(["<b>" + esc(d.name) + "</b>", d.kind === "year" ? "Next year" : "This term", String(d.sections || 0),
                   d.withRosters ? "Carried" : "Not planned",
                   d.publishedAt ? "<span class='cx-pill'>Published " + esc(label(iso(new Date(d.publishedAt)))) + "</span>" : "<span class='cx-pill orange'>Draft</span>"],
              function () { PLAN.id = d.id; open(); }, d.id);
          });
          s.appendChild(t);
        }
        s.appendChild(el("h3", "sc-h3", "The live schedule against what students asked for"));
        analysis(s, live, "Students have not asked for anything yet. Ask on Add and drop, or let families ask.");
      }, function (e) { K.failed(n, e, load); });
    }

    function newPlan(kind) {
      var nm = input("text", "", 60, kind === "year" ? "Next year" : "Spring changes");
      var ro = select([["empty", "Start empty, then build from what students asked for"], ["none", "Sections only; rosters are made later"],
        ["copy", "Carry this year’s rosters over"]], "empty");
      var tr = check("Keep each section’s teachers", true);
      var rt = check("Plan who is in each section", true, "publishing then moves students to match the plan");
      dialog({ title: kind === "year" ? "Roll over to next year" : "New plan",
        sub: kind === "year" ? "Makes next year’s sections as a copy of this year’s. Publishing puts this year’s sections away, with their rosters, marks and grades kept, and starts the new ones."
                            : "A copy of the live schedule to change. Publishing applies only what differs.",
        body: function (host) {
          host.appendChild(field("Name", nm));
          if (kind === "year") host.appendChild(field("Rosters", ro)); else host.appendChild(rt);
          host.appendChild(tr);
        }, action: "Make the plan",
        onSubmit: function () {
          var name = nm.value.trim();
          if (!name) throw new Error("Give the plan a name.");
          var d = { name: name, kind: kind, teachers: tr.box.checked };
          if (kind === "year") { d.rosters = ro.value !== "none"; d.copyRosters = ro.value === "copy"; } else d.rosters = rt.box.checked;
          return SC.createDraft(d).then(function (x) { PLAN.id = x.id; toast("Plan made"); open(); });
        } });
    }

    function open() {
      s.innerHTML = "";
      var n = K.loading(s, "the plan");
      Promise.all([SC.draft(PLAN.id), SC.analyze(PLAN.id), SC.subjects(), SC.bell()]).then(function (r) {
        n.remove();
        view(r[0], r[1], r[2], r[3]);
      }, function (e) { PLAN.id = null; K.failed(n, e, load); });
    }

    function view(d, a, subjects, bellList) {
      var plan = d.draft, secs = d.sections, done = !!plan.publishedAt;
      var back = el("div", "sc-planhead");
      back.appendChild(button("‹ Plans", "at-link", function () { PLAN.id = null; load(); }));
      back.appendChild(el("h2", "sc-planname", esc(plan.name)));
      back.appendChild(el("span", "cx-pill" + (done ? "" : " orange"), done ? "Published" : "Draft"));
      back.appendChild(el("span", "sc-spacer"));
      if (!done) {
        back.appendChild(button("Delete plan", "en-btn quiet", function () {
          dialog({ title: "Delete “" + plan.name + "”?", sub: "The live schedule is not touched.", action: "Delete", tone: "danger",
            onSubmit: function () { return SC.deleteDraft(plan.id).then(function () { PLAN.id = null; toast("Deleted"); load(); }); } });
        }));
        back.appendChild(button("Add a section", "en-btn quiet", function () { sectionEditor(null); }));
        back.appendChild(button("Build from requests", "en-btn quiet", build));
        back.appendChild(button("Publish", "en-btn strong", publish));
      }
      s.appendChild(back);
      s.appendChild(el("p", "cx-note", (plan.kind === "year" ? "Next year’s sections. " : "A change to this term. ") +
        (plan.withRosters ? "Publishing puts students where the plan has them. " : "Rosters are not part of this plan. ") +
        (done ? "Published " + esc(label(iso(new Date(plan.publishedAt)))) + "." : "")));

      s.appendChild(el("h3", "sc-h3", "Against what students asked for"));
      analysis(s, a, "Nobody has asked for a course yet, so there is nothing to check this plan against.");

      s.appendChild(el("h3", "sc-h3", plural(secs.length, "section")));
      if (!secs.length) { s.appendChild(el("p", "cx-note", "No sections in this plan.")); return; }
      var t = K.cnTable([{ label: "Section", w: "minmax(180px, 1.5fr)" }, { label: "Course", w: "minmax(110px, .8fr)" }, { label: "Teacher", w: "minmax(150px, 1.2fr)" },
        { label: "Period", w: "110px" }, { label: "Room", w: "80px" }, { label: "Students", w: "100px", align: "right" }]);
      secs.forEach(function (z) {
        var over = z.capacity != null && z.students > z.capacity;
        t.row(["<b>" + esc(z.title) + "</b>" + (z.sectionNo ? "<span class='cn-sub2'>Section " + esc(z.sectionNo) + "</span>" : "") + (z.sourceCourseId ? "" : "<span class='cn-sub2'>New</span>"),
               z.subjectNumber ? esc(z.subjectNumber) : K.cxNone("None"),
               z.teachers.length ? esc(z.teachers.map(function (p) { return p.name; }).join(", ")) : "<span class='cx-pill orange'>No teacher</span>",
               z.placed ? esc(z.periods.join(", ")) : "<span class='cx-pill orange'>Not placed</span>",
               z.room ? esc(z.room) : K.cxNone(),
               "<b class='cn-mk" + (over ? " bad" : "") + "'>" + z.students + "</b>" + (z.capacity != null ? " / " + z.capacity : "")],
          done ? null : function () { sectionEditor(z); }, z.id);
      });
      s.appendChild(t);

      /* ---- one section of the plan */
      function sectionEditor(z) {
        var isNew = !z;
        var f = z || { periods: [], teachers: [] };
        var live = subjects.filter(function (x) { return !x.retired || (z && z.subjectId === x.id); });
        var subj = select([["", "Choose a course"]].concat(live.map(function (x) { return [x.id, x.number + " · " + x.title]; })), f.subjectId || "");
        var no = input("text", f.sectionNo, 20), room = input("text", f.room, 40), cap = input("number", f.capacity); cap.min = "1";
        var chosen = {};
        (f.periods || []).forEach(function (p) { chosen[p] = true; });
        var labels = periodLabelsOf(bellList);
        dialog({ wide: true, title: isNew ? "Add a section to the plan" : f.title, sub: isNew ? "A section of a course, as it will be." : "Only this plan changes; the live section is left alone until you publish.",
          extra: isNew ? [] : [function (ctl) {
            return button("Take out of the plan", "en-btn quiet", function () {
              SC.deleteDraftSection(plan.id, f.id).then(function () { toast("Taken out"); ctl.close(); open(); }, function (e) { ctl.error(e.message); });
            });
          }],
          body: function (host) {
            var r1 = el("div", "sc-row"); r1.appendChild(field("Course", subj)); r1.appendChild(field("Section number", no)); host.appendChild(r1);
            var r2 = el("div", "sc-row"); r2.appendChild(field("Room", room)); r2.appendChild(field("Capacity", cap)); host.appendChild(r2);
            host.appendChild(el("p", "sc-lab", "Periods"));
            var pc = el("div", "sc-checks");
            labels.forEach(function (lb) {
              var c = check(lb, chosen[lb]);
              c.box.addEventListener("change", function () { if (c.box.checked) chosen[lb] = true; else delete chosen[lb]; });
              pc.appendChild(c);
            });
            host.appendChild(pc);
            if (!isNew && f.teachers.length) host.appendChild(el("p", "cx-note", "Teachers: " + esc(f.teachers.map(function (p) { return p.name; }).join(", ")) + "."));
          }, action: isNew ? "Add it" : "Save",
          onSubmit: function () {
            var periods = labels.filter(function (l) { return chosen[l]; });
            var body = { sectionNo: no.value.trim() || null, room: room.value.trim() || null, capacity: cap.value === "" ? null : +cap.value, periods: periods };
            if (isNew) {
              if (!subj.value) throw new Error("Choose the course.");
              body.subjectId = subj.value;
              return SC.addDraftSection(plan.id, body).then(function () { toast("Added"); open(); });
            }
            if (subj.value) body.subjectId = subj.value;
            return SC.putDraftSection(plan.id, f.id, body).then(function () { toast("Saved"); open(); });
          } });
      }

      /* ---- seat students from what they asked for */
      function build() {
        SC.build(plan.id, true).then(function (r) {
          var more = r.unplaced.length;
          dialog({ wide: true, title: "Build from requests",
            sub: r.placed + " " + (r.placed === 1 ? "seat" : "seats") + " would be filled" + (r.already ? ", " + r.already + " already in the right section" : "") + ". " +
                 (more ? plural(more, "request") + " could not be placed:" : "Every request can be placed."),
            body: function (host) {
              if (!more) return;
              var tb = K.cnTable([{ label: "Student", w: "minmax(150px, 1fr)" }, { label: "Course", w: "minmax(150px, 1fr)" }, { label: "Why", w: "minmax(220px, 1.6fr)" }]);
              r.unplaced.slice(0, 60).forEach(function (u) { tb.row(["<b>" + esc(u.studentName) + "</b>", esc(u.course), esc(u.reason)]); });
              host.appendChild(tb);
              if (more > 60) host.appendChild(el("p", "cx-note", "…and " + (more - 60) + " more."));
              host.appendChild(el("p", "cx-note", "Add a section, or raise a capacity, and build again. Nobody already placed is moved."));
            },
            action: r.placed ? "Seat " + plural(r.placed, "student") : null,
            onSubmit: function () { return SC.build(plan.id, false).then(function () { toast("Seated"); open(); }); } });
        }, function (e) { toast(e && e.message ? e.message : "That could not be built."); });
      }

      /* ---- publish: say first what it will do */
      function publish() {
        SC.previewPublish(plan.id).then(function (r) {
          var t = r.totals;
          var bits = [];
          if (t.created) bits.push(plural(t.created, "new section"));
          if (t.updated) bits.push(plural(t.updated, "section") + " changed");
          if (t.archived) bits.push(plural(t.archived, "section") + " put away");
          if (t.added) bits.push(plural(t.added, "student") + " placed");
          if (t.dropped) bits.push(plural(t.dropped, "student") + " taken out");
          var rows = r.sections.filter(function (x) { return x.action !== "update" || x.changes.length || x.addStudents || x.dropStudents || x.addTeachers.length || x.dropTeachers.length; });
          dialog({ wide: true, title: "Publish “" + plan.name + "”?",
            sub: (bits.length ? bits.join(", ") : "Nothing differs from the live schedule") + ". Marks, grades and registers are not touched, and a section put away is kept.",
            body: function (host) {
              if (!rows.length) return;
              var ul = el("ul", "sc-list");
              rows.slice(0, 80).forEach(function (x) {
                var what = x.action === "new" ? "new section" : x.action === "replace" ? "replaces this year’s" : x.changes.join("; ");
                var more = [];
                if (x.addStudents) more.push("+" + plural(x.addStudents, "student"));
                if (x.dropStudents) more.push("−" + plural(x.dropStudents, "student"));
                if (x.addTeachers.length) more.push((x.addTeachers.length === 1 ? "teacher " : "teachers ") + x.addTeachers.join(", "));
                if (x.dropTeachers.length) more.push("without " + x.dropTeachers.join(", "));
                ul.appendChild(el("li", null, "<b>" + esc(x.title) + "</b> · " + esc([what].concat(more).filter(Boolean).join(" · "))));
              });
              host.appendChild(ul);
              if (rows.length > 80) host.appendChild(el("p", "cx-note", "…and " + (rows.length - 80) + " more."));
            }, action: "Publish",
            onSubmit: function () { return SC.publish(plan.id).then(function () { toast("Published"); open(); }); } });
        }, function (e) { toast(e && e.message ? e.message : "That could not be checked."); });
      }
    }

    load();
  }

  /* Courses asked for against what is offered, then seats per period. */
  function analysis(host, a, empty) {
    if (!a.students && !a.courses.some(function (c) { return c.sections; })) { host.appendChild(el("p", "cx-note", esc(empty))); return; }
    var shortN = a.courses.filter(function (c) { return c.flag === "short"; }).length, noneN = a.courses.filter(function (c) { return c.flag === "none"; }).length;
    K.cxMetrics(host, [{ label: "Students asking", value: a.students }, { label: "Courses short of seats", value: shortN, bad: true },
      { label: "Asked for, none offered", value: noneN, bad: true }]);
    var rows = a.courses.slice().sort(function (x, y) { return (y.flag ? 1 : 0) - (x.flag ? 1 : 0) || y.planned - x.planned; });
    var t = K.cnTable([{ label: "Course", w: "minmax(180px, 1.5fr)" }, { label: "Sections", w: "90px", align: "right" }, { label: "Seats", w: "90px", align: "right" },
      { label: "Want it", w: "90px", align: "right" }, { label: "Placed", w: "90px", align: "right" }, { label: "", w: "190px" }]);
    rows.forEach(function (c) {
      var f = c.flag ? FLAGS[c.flag] : null;
      t.row(["<b>" + esc(c.number ? c.number + " · " + c.title : c.title) + "</b>", String(c.sections), c.capacity == null ? "no limit" : String(c.capacity),
             String(c.planned) + (c.asked > c.planned ? "<span class='cn-sub2'>+" + (c.asked - c.planned) + " as an alternate</span>" : ""), String(c.placed),
             f ? "<span class='cx-pill " + f[0] + "'>" + f[1] + "</span>" : ""]);
    });
    host.appendChild(t);
    if (a.periods.length) {
      var pt = K.cnTable([{ label: "Period", w: "110px" }, { label: "Sections", w: "90px", align: "right" }, { label: "Seats", w: "90px", align: "right" }, { label: "Placed", w: "90px", align: "right" }]);
      a.periods.forEach(function (p) { pt.row(["<b>" + esc(p.period) + "</b>", String(p.sections), p.unlimited ? "no limit" : String(p.capacity), String(p.placed)]); });
      host.appendChild(el("h3", "sc-h3", "Seats by period"));
      host.appendChild(pt);
    }
  }


  return { bell: bell, days: days, courses: courses, sections: sections, addDrop: addDrop, plans: plans };
};
