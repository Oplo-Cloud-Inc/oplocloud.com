/* ==========================================================================
   OEdu — the admissions office around the application.

   enroll.js is the application itself: the queue, the record, the decision,
   the enrolment. This file is what a school that runs admissions as a procedure
   keeps beside it:

     Enquiries    a family that has asked, before it applies — who, how it heard
                  of the school, when somebody is to ring back
     Assessments  the desk for a day of entrance tests, interactions and
                  interviews: who is coming, where, and how each one went
     Reports      the cycle in numbers (asked → applied → seen → offered →
                  took the seat → joined), and the admission register
     Procedure    the written procedure the school runs, drawn from its own
                  settings so that it can never disagree with what the screens do

   Like enroll.js it draws what the server says and sends what the person
   chose; whether a step is allowed or a number is right is decided on the
   server (api/src/routes/admissions.js, services/admissions.js).

   Mounted by enroll.js:  OPLO_ADMIT(K, H) → { enquiries, desk, reports, procedure, recordResult }
   ========================================================================== */
window.OPLO_ADMIT = function (K, H) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast, NS = API.enrollment;
  var fld = H.fld, btn = H.btn, dialog = H.dialog, chip = H.chip, day = H.day, ago = H.ago, plural = H.plural, yearName = H.yearName, opts = H.opts;

  /* ------------------------------------------------------------- Words */
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function longDay(ymd) {
    if (!ymd) return "";
    var p = String(ymd).split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return WEEKDAYS[d.getDay()] + " " + (+p[2]) + " " + MONTHS[+p[1] - 1];
  }
  function clock(t) {
    if (!t) return "";
    var m = /^(\d{1,2}):(\d{2})$/.exec(t);
    if (!m) return t;
    var h = +m[1];
    return ((h + 11) % 12 + 1) + ":" + m[2] + (h < 12 ? " am" : " pm");
  }
  function plus(ymd, n) {
    var p = ymd.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2] + n);
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  var SESSION = { scheduled: ["Scheduled", "blue"], completed: ["Done", "green"], absent: ["Did not attend", "orange"], cancelled: ["Called off", "muted"] };
  var RESULT = { qualified: "Qualified", not_qualified: "Did not qualify", deferred: "Left open" };
  var ENQ = { "new": ["New", "blue"], contacted: ["Contacted", "blue"], visit_booked: ["Visit booked", "blue"], visited: ["Visited", "blue"],
              applied: ["Applied", "green"], not_proceeding: ["Not proceeding", "muted"] };
  var SOURCES = [["walk_in", "Walk-in"], ["phone", "Phone call"], ["website", "Website"], ["referral", "Referral"],
                 ["school_event", "Open day or school event"], ["advertisement", "Advertisement"], ["other", "Something else"]];
  function sourceName(k) {
    for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i][0] === k) return SOURCES[i][1];
    return k === "direct" ? "Came straight to apply" : k || "—";
  }
  function pct(n) { return n == null ? "—" : n + "%"; }

  /* A heading, an optional line under it, and a body: the page's one repeated shape. */
  function section(host, title, note) {
    var s = el("section", "en-block ad-wide");
    s.appendChild(el("header", "en-block-h", "<h3>" + esc(title) + "</h3>" + (note ? "<p>" + esc(note) + "</p>" : "")));
    host.appendChild(s);
    return s;
  }

  /* ============================================================ Enquiries */
  var E = { view: "open", q: "", source: "", assignee: "", page: 1 };

  function enquiries(host, onCount) {
    var views = K.cnFilters([["follow_up", "Calls due"], ["new", "New"], ["visits", "Visits to come"], ["open", "Open"], ["converted", "Applied"], ["closed", "Not proceeding"], ["all", "All"]]
      .map(function (x) { return { k: x[0], name: x[1], n: "" }; }), E.view, function (k) { E.view = k; E.page = 1; load(); });
    views.classList.add("en-views");
    host.appendChild(views);

    var tools = el("div", "cn-bar en-tools");
    var find = el("input", "cn-search");
    find.type = "search"; find.placeholder = "Search the child, a parent, a phone number or ENQ number"; find.value = E.q;
    find.setAttribute("aria-label", "Search enquiries");
    tools.appendChild(find);
    var src = el("select", "cx-select"); src.setAttribute("aria-label", "Source");
    var who = el("select", "cx-select"); who.setAttribute("aria-label", "Owner");
    [src, who].forEach(function (s) { s.style.minWidth = "0"; tools.appendChild(s); });
    function fill(sel, items, cur) {
      sel.innerHTML = "";
      items.forEach(function (o) { var op = el("option"); op.value = o[0]; op.textContent = o[1]; if (o[0] === cur) op.selected = true; sel.appendChild(op); });
    }
    fill(src, [["", "Any source"]].concat(SOURCES), E.source);
    fill(who, [["", "Anyone"], ["me", "Assigned to me"], ["none", "Unassigned"]], E.assignee);
    tools.appendChild(btn("New enquiry", "strong", function () { newEnquiry(load); }));
    host.appendChild(tools);
    var slot = el("div", "en-slot"); host.appendChild(slot);
    var foot = el("div", "en-pager"); host.appendChild(foot);

    var t = null;
    find.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { E.q = find.value.trim(); E.page = 1; load(); }, 250); });
    src.addEventListener("change", function () { E.source = src.value; E.page = 1; load(); });
    who.addEventListener("change", function () { E.assignee = who.value; E.page = 1; load(); });

    function load() {
      slot.innerHTML = ""; slot.appendChild(el("div", "admin-loading", "Loading enquiries…"));
      NS.enquiries({ year: H.ST.year, view: E.view, q: E.q, source: E.source, assignee: E.assignee, page: E.page, size: 25 }).then(function (r) {
        slot.innerHTML = "";
        if (onCount) onCount(r.counts);
        [].forEach.call(views.children, function (b) { var em = b.querySelector("em"); if (em) em.textContent = r.counts[b.dataset.k] || ""; });
        views.mark(E.view);
        rows(r);
      }, function (e) { K.failed(slot, e, load); });
    }

    function rows(r) {
      foot.innerHTML = "";
      if (!r.items.length) {
        var filtered = E.q || E.source || E.assignee;
        slot.appendChild(K.cnEmpty(filtered ? "Nothing matches." : E.view === "follow_up" ? "No calls are due." : "No enquiries here.",
          filtered ? "Clear the search and filters to see the whole view."
            : "Write down every family that asks, even by phone: the school then knows who to ring back, and where its applications come from.",
          filtered ? null : "New enquiry", filtered ? null : function () { newEnquiry(load); }));
        return;
      }
      var tb = K.cnTable([
        { label: "Child", w: "minmax(150px, 1.2fr)" }, { label: "Class", w: "84px" }, { label: "Family", w: "minmax(150px, 1.2fr)" },
        { label: "Heard of us", w: "minmax(100px, .9fr)" }, { label: "Status", w: "124px" }, { label: "Ring back", w: "104px" },
        { label: "Owner", w: "minmax(84px, .7fr)" }
      ]);
      tb.classList.add("en-tbl");
      r.items.forEach(function (x) {
        var who = el("span", "en-who");
        who.appendChild(K.avatarFor({ name: x.name }));
        who.appendChild(el("span", "en-who-t", "<b>" + esc(x.name) + "</b><small>" + esc(x.number) + "</small>"));
        var fam = "<span class='en-who-t'><b>" + esc(x.guardianName || "—") + "</b><small>" + esc([x.phone, x.email].filter(Boolean).join(" · ")) + "</small></span>";
        var when = !x.open ? "<span class='cn-none'>—</span>" : x.followUpOn
          ? "<span class='" + (x.overdue ? "en-late" : "") + "'>" + esc(x.overdue ? "Overdue · " + day(x.followUpOn) : day(x.followUpOn)) + "</span>" : "<span class='cn-none'>None set</span>";
        tb.row([who, esc(x.grade || "—"), fam, esc(sourceName(x.source)), chip(ENQ, x.status), when,
                x.assignedTo ? esc(x.assignedTo.name || "Assigned") : "<span class='cn-none'>Unassigned</span>"],
          function () { openEnquiry(x.id, load); }, x.id);
      });
      slot.appendChild(tb);
      var from = (r.page - 1) * r.size + 1, to = Math.min(r.total, r.page * r.size);
      foot.appendChild(el("span", "en-count", from + "–" + to + " of " + r.total));
      var prev = btn("Previous", "quiet", function () { E.page--; load(); }), next = btn("Next", "quiet", function () { E.page++; load(); });
      prev.disabled = r.page <= 1; next.disabled = to >= r.total;
      foot.appendChild(prev); foot.appendChild(next);
      foot.appendChild(btn("Export", "quiet", function () {
        K.csvDownload("enquiries-" + (H.ST.year || "all") + ".csv", [["Number", "Child", "Class", "Parent", "Phone", "Email", "Source", "Status", "Ring back", "Note"]]
          .concat(r.items.map(function (x) { return [x.number, x.name, x.grade || "", x.guardianName || "", x.phone || "", x.email || "", sourceName(x.source), (ENQ[x.status] || [x.status])[0], x.followUpOn || "", x.note || ""]; })));
      }));
    }
    load();
  }

  /* One family that has asked. Enough to ring them back, and to know where they came from. */
  function newEnquiry(done) {
    H.settings().then(function (s) {
      var f = {
        first: fld("text", "Child's first name", "", { req: true, max: 80 }), last: fld("text", "Surname", "", { max: 80 }),
        dob: fld("date", "Date of birth", ""), grade: fld("select", "Class asked about", "", { options: [["", "Not sure yet"]].concat(s.grades.map(function (g) { return [g.name, g.name]; })) }),
        year: fld("select", "For the year", H.ST.year && H.ST.year !== "all" ? H.ST.year : s.currentYear, { options: s.years.map(function (y) { return [y, yearName(y)]; }) }),
        parent: fld("text", "Parent or guardian", "", { max: 120 }), phone: fld("text", "Phone", "", { max: 40, req: true }), email: fld("email", "Email", "", { max: 320 }),
        source: fld("select", "How did they hear of the school?", "walk_in", { options: SOURCES }), ref: fld("text", "Referred by", "", { max: 120, hint: "A parent, a teacher, an advertisement" }),
        next: fld("date", "Ring back on", plus(H.today(), 2)), note: fld("area", "What they asked", "", { rows: 3, max: 1000 })
      };
      var key = "enq-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      dialog({
        title: "New enquiry", wide: true, sub: "Write it down while they are on the phone or at the desk. The school promises to ring back on the day below.",
        action: "Record the enquiry",
        body: function (h) {
          var g = el("div", "en-form-grid");
          [f.first, f.last, f.dob, f.grade, f.year, f.parent, f.phone, f.email, f.source, f.ref, f.next].forEach(function (x) { g.appendChild(x.node); });
          h.appendChild(g); h.appendChild(f.note.node);
        },
        onSubmit: function () {
          if (!f.first.value()) throw new Error("The child's first name is required.");
          if (!f.phone.value() && !f.email.value()) throw new Error("Give a phone number or an email so the school can reach the family.");
          return NS.enquiryCreate({ clientKey: key, childFirst: f.first.value(), childLast: f.last.value(), dob: f.dob.value() || undefined, grade: f.grade.value(),
            schoolYear: f.year.value(), guardianName: f.parent.value(), phone: f.phone.value(), email: f.email.value(), source: f.source.value(),
            referredBy: f.ref.value(), followUpOn: f.next.value() || undefined, note: f.note.value(), assignTo: "me" }).then(function (r) {
            toast(r.enquiry.number + " recorded." + (r.matches && r.matches.length ? " Note: " + r.matches.length + " earlier record" + (r.matches.length > 1 ? "s" : "") + " for this family — " +
              r.matches.map(function (m) { return m.number || m.name; }).join(", ") + "." : ""));
            if (done) done();
          });
        }
      });
    });
  }

  /* One enquiry: its particulars, everything said and done, and what can be done next. */
  function openEnquiry(id, changed) {
    NS.enquiry(id).then(function (e) {
      var box = el("div", "en-dlg en-wide");
      box.appendChild(el("h2", "en-dlg-h", esc(e.name) + " <span class='en-pref'>" + esc(e.number) + "</span>"));
      box.appendChild(el("p", "en-dlg-sub", chip(ENQ, e.status) + " &nbsp; " + esc(e.grade || "Class not decided") + " · " + esc(yearName(e.year)) +
        " · heard of us: " + esc(sourceName(e.source)) + (e.referredBy ? " (" + esc(e.referredBy) + ")" : "")));
      var info = el("div", "ad-info");
      [["Parent", e.guardianName], ["Phone", e.phone], ["Email", e.email], ["Born", e.dob ? day(e.dob) : ""], ["Ring back", e.open && e.followUpOn ? day(e.followUpOn) : ""],
       ["Campus visit", e.visitOn ? day(e.visitOn) : ""], ["Owner", e.assignedTo && e.assignedTo.name]].forEach(function (p) {
        if (p[1]) info.appendChild(el("div", null, "<small>" + esc(p[0]) + "</small><b>" + esc(p[1]) + "</b>"));
      });
      box.appendChild(info);
      if (e.note) box.appendChild(el("p", "en-note", esc(e.note)));
      if (e.lostReason) box.appendChild(el("p", "en-note", "Not proceeding: " + esc(e.lostReason)));
      if (e.application) {
        box.appendChild(el("p", "en-ok", "Became application <b>" + esc(e.application.number) + "</b>."));
      }
      box.appendChild(el("h3", "en-h3", "What has been said and done"));
      var log = el("div", "en-history ad-log");
      e.log.forEach(function (l) {
        var what = ({ created: "Enquiry recorded", note: "Note", call: "Call", visit: "Visit", status: "Status", assign: "Assigned", application: "Became an application" })[l.kind] || l.kind;
        log.appendChild(el("div", "en-ev", "<span class='en-ev-t'>" + esc(H.stamp(l.at)) + "</span><div class='en-ev-b'><p><b>" + esc(what) + "</b>" +
          (l.to && l.kind !== "note" ? " · " + esc(l.to) : "") + "</p>" + (l.note ? "<p class='en-ev-note'>" + esc(l.note) + "</p>" : "") + "</div><span class='en-ev-w'>" + esc(l.by || "") + "</span>"));
      });
      box.appendChild(log);

      var acts = el("div", "en-dlg-acts en-wrap");
      var sheet = null;
      function after() { if (sheet) sheet.close(); if (changed) changed(); }
      if (e.open) {
        acts.appendChild(btn("Start the application", "strong", function () { sheet.close(); H.openNew({ first: e.childFirst, last: e.childLast, dob: e.dob, grade: e.grade, year: e.year,
          guardian: { name: e.guardianName, phone: e.phone, email: e.email }, enquiry: { id: e.id, number: e.number, source: e.source } }); }));
        acts.appendChild(btn("Log a call…", "", function () { sheet.close(); logCall(e, function () { openEnquiry(id, changed); if (changed) changed(); }); }));
        acts.appendChild(btn("Book a visit…", "", function () { sheet.close(); bookVisit(e, function () { openEnquiry(id, changed); if (changed) changed(); }); }));
        if (e.status === "visit_booked") acts.appendChild(btn("They visited", "", function () {
          NS.enquiryAct(e.id, "visited", {}).then(function () { toast("Visit recorded."); sheet.close(); openEnquiry(id, changed); if (changed) changed(); }, function (er) { toast(er.message); }); }));
        acts.appendChild(btn("Add a note…", "quiet", function () { sheet.close(); addNote(e, function () { openEnquiry(id, changed); }); }));
        acts.appendChild(btn("Not proceeding…", "danger", function () { sheet.close(); closing(e, function () { if (changed) changed(); }); }));
      } else if (e.status === "not_proceeding") {
        acts.appendChild(btn("Reopen", "strong", function () {
          NS.enquiryAct(e.id, "reopen", {}).then(function () { toast("Reopened."); after(); }, function (er) { toast(er.message); }); }));
      } else if (e.application) {
        acts.appendChild(btn("Open the application", "strong", function () { sheet.close(); H.openApplication(e.application.id); }));
      }
      box.appendChild(acts);
      sheet = K.cxSheet(box);
    }, function (er) { toast(er.message); });
  }

  function logCall(e, done) {
    var note = fld("area", "What was said", "", { rows: 3, max: 600 });
    var next = fld("date", "Ring back on", plus(H.today(), 3));
    dialog({ title: "Log a call — " + e.name, action: "Save", body: function (h) { h.appendChild(note.node); h.appendChild(next.node); },
      onSubmit: function () { return NS.enquiryAct(e.id, "contacted", { note: note.value(), followUpOn: next.value() || "" }).then(function () { toast("Call logged."); done(); }); } });
  }
  function bookVisit(e, done) {
    var on = fld("date", "Campus visit on", plus(H.today(), 3), { req: true });
    dialog({ title: "Book a campus visit — " + e.name, sub: "The family is shown the school; the follow-up moves to the visit.", action: "Book it", body: function (h) { h.appendChild(on.node); },
      onSubmit: function () { if (!on.value()) throw new Error("Choose the day."); return NS.enquiryAct(e.id, "visit_booked", { visitOn: on.value() }).then(function () { toast("Visit booked."); done(); }); } });
  }
  function addNote(e, done) {
    var t = fld("area", "Note", "", { rows: 3, max: 1000 });
    dialog({ title: "Add a note", action: "Add the note", body: function (h) { h.appendChild(t.node); },
      onSubmit: function () { if (!t.value()) throw new Error("Write something first."); return NS.enquiryAct(e.id, "note", { text: t.value() }).then(function () { toast("Note added."); done(); }); } });
  }
  function closing(e, done) {
    var why = fld("text", "Why is the family not going ahead?", "", { req: true, hint: "e.g. Chose a school nearer home" });
    dialog({ title: "Close this enquiry", sub: "It leaves the follow-up list and is kept on the record. It can be reopened.", action: "Close it", tone: "danger", body: function (h) { h.appendChild(why.node); },
      onSubmit: function () { if (why.value().length < 3) throw new Error("A reason is required."); return NS.enquiryAct(e.id, "close", { reason: why.value() }).then(function () { toast("Closed."); done(); }); } });
  }

  /* ================================================ Assessments (the desk) */
  var D = { range: "week" };

  function rangeOf(k) {
    var t = H.today();
    return ({ today: [t, t], week: [t, plus(t, 6)], month: [t, plus(t, 29)], past: [plus(t, -7), plus(t, -1)] })[k] || [t, plus(t, 6)];
  }

  function desk(host) {
    var seg = el("div", "cn-seg");
    [["today", "Today"], ["week", "Next 7 days"], ["month", "Next 30 days"], ["past", "Last 7 days"]].forEach(function (r) {
      var b = el("button", "cn-segb" + (D.range === r[0] ? " on" : ""), r[1]);
      b.type = "button";
      b.addEventListener("click", function () { D.range = r[0]; [].forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); }); load(); });
      seg.appendChild(b);
    });
    var bar = el("div", "cn-bar en-tools");
    bar.appendChild(seg);
    host.appendChild(bar);
    host.appendChild(el("p", "en-note", "Every entrance assessment, interaction and interview, by day. Schedule one from an application; record how it went here or there. " +
      "A child who does not come is marked as such, and the application still waits for a result."));
    var slot = el("div", "en-slot"); host.appendChild(slot);

    function load() {
      slot.innerHTML = ""; slot.appendChild(el("div", "admin-loading", "Loading the days…"));
      var r = rangeOf(D.range);
      NS.sessions(r[0], r[1]).then(function (res) {
        slot.innerHTML = "";
        if (!res.items.length) {
          slot.appendChild(K.cnEmpty("Nothing is scheduled in this window.", "Open an application and choose Assessment to put a child in the diary.")); return;
        }
        var byDay = {};
        res.items.forEach(function (x) { (byDay[x.onDate] = byDay[x.onDate] || []).push(x); });
        Object.keys(byDay).sort().forEach(function (d) {
          var list = byDay[d];
          var head = el("div", "ad-day");
          head.appendChild(el("h3", null, esc(longDay(d)) + (d === res.today ? " <em>Today</em>" : "")));
          head.appendChild(el("span", null, plural(list.length, "session")));
          head.appendChild(btn("Print the day sheet", "quiet small", function () { daySheet(d, list); }));
          slot.appendChild(head);
          var tb = K.cnTable([
            { label: "Time", w: "84px" }, { label: "Child", w: "minmax(160px, 1.3fr)" }, { label: "Class", w: "84px" }, { label: "For", w: "minmax(140px, 1.1fr)" },
            { label: "Where", w: "minmax(100px, .9fr)" }, { label: "Status", w: "130px" }, { label: "", w: "minmax(120px, auto)", align: "right" }
          ]);
          tb.classList.add("en-tbl");
          list.forEach(function (x) {
            var who = el("span", "en-who");
            who.appendChild(K.avatarFor({ name: x.applicant }));
            who.appendChild(el("span", "en-who-t", "<b>" + esc(x.applicant) + "</b><small>" + esc(x.number) + "</small>"));
            var st = chip(SESSION, x.status) + (x.result ? "<small class='ad-res'>" + esc(RESULT[x.result] || x.result) + (x.score != null ? " · " + x.score + (x.maxScore != null ? "/" + x.maxScore : "") : "") + "</small>" : "");
            var acts = el("span", "ad-acts");
            if (x.status === "scheduled" || x.status === "absent" || x.status === "completed") {
              acts.appendChild(btn(x.status === "completed" ? "Edit result" : "Record", "quiet small", function (e) { e.stopPropagation(); recordResult(x.applicationId, x, load); }));
            }
            var row = tb.row([x.atTime ? esc(clock(x.atTime)) : "<span class='cn-none'>—</span>", who, esc(x.grade), esc(x.label), esc(x.venue || "—"), st, acts],
              function () { H.openApplication(x.applicationId, "assessment"); }, x.id);
            void row;
          });
          slot.appendChild(tb);
        });
        slot.appendChild(el("div", "en-pager")).appendChild(btn("Export", "quiet", function () {
          K.csvDownload("assessments-" + res.from + "-to-" + res.to + ".csv", [["Date", "Time", "Child", "Application", "Class", "For", "Venue", "Panel", "Status", "Result", "Score", "Out of", "Remarks"]]
            .concat(res.items.map(function (x) { return [x.onDate, x.atTime || "", x.applicant, x.number, x.grade, x.label, x.venue || "", x.panel || "", (SESSION[x.status] || [x.status])[0],
              RESULT[x.result] || "", x.score == null ? "" : x.score, x.maxScore == null ? "" : x.maxScore, x.remarks || ""]; })));
        }));
      }, function (e) { K.failed(slot, e, load); });
    }
    load();
  }

  /* The sheet the person at the door holds: who is expected, and blanks for what they write. */
  function daySheet(d, list) {
    var html = K.printHead("Assessment day sheet — " + longDay(d), plural(list.length, "child", "children")) +
      K.printTable([{ t: "Time" }, { t: "Child" }, { t: "Application" }, { t: "Class" }, { t: "For" }, { t: "Venue" }, { t: "Panel" }, { t: "Present" }, { t: "Score" }, { t: "Result" }],
        list.map(function (x) { return [x.atTime ? clock(x.atTime) : "", x.applicant, x.number, x.grade, x.label, x.venue || "", x.panel || "", "", "", ""]; })) +
      "<p class='sub' style='margin-top:24px'>Signature of the panel: ______________________________ &nbsp;&nbsp; Date: ______________</p>";
    K.cxPrint("Assessment day sheet", html);
  }

  /* How it went: the result, the marks, and a few words. Used from the desk and from the application. */
  function recordResult(applicationId, s, done) {
    var result = fld("select", "How did it go?", s.result || "qualified", { options: [["qualified", "Qualified"], ["not_qualified", "Did not qualify"], ["deferred", "Not decided — see the child again"]] });
    var score = fld("text", "Marks", s.score == null ? "" : String(s.score), { hint: "Optional" });
    var max = fld("text", "Out of", s.maxScore == null ? "" : String(s.maxScore), { hint: "Optional" });
    var rem = fld("area", "Remarks", s.remarks || "", { rows: 3, max: 1000, hint: "What the panel saw. The family does not see this." });
    var absent = btn("Did not attend", "danger", null);
    dialog({
      title: s.label + " — " + (s.applicant || "record the result"), sub: longDay(s.onDate) + (s.atTime ? ", " + clock(s.atTime) : "") + (s.venue ? " · " + s.venue : ""),
      action: "Save the result",
      body: function (h, ctl) {
        var g = el("div", "en-form-grid"); g.appendChild(score.node); g.appendChild(max.node);
        h.appendChild(result.node); h.appendChild(g); h.appendChild(rem.node);
        if (s.status === "scheduled") {
          absent.addEventListener("click", function () {
            NS.sessionUpdate(applicationId, s.id, { status: "absent" }).then(function () { toast("Marked as not attended."); ctl.close(); if (done) done(); }, function (e) { ctl.error(e.message); });
          });
          h.appendChild(absent);
        }
      },
      onSubmit: function () {
        var sc = score.value(), mx = max.value();
        if ((sc && isNaN(+sc)) || (mx && isNaN(+mx))) throw new Error("Marks are numbers.");
        return NS.sessionUpdate(applicationId, s.id, { status: "completed", result: result.value(), score: sc === "" ? null : +sc, maxScore: mx === "" ? null : +mx, remarks: rem.value() })
          .then(function (r) { toast("Recorded."); if (done) done(r); });
      }
    });
  }

  /* ============================================================== Reports */
  var R = { part: "figures" };

  function reports(host) {
    var seg = el("div", "cn-seg");
    var body = el("div", "ad-rep");
    [["figures", "The cycle in numbers"], ["register", "Admission register"]].forEach(function (p) {
      var b = el("button", "cn-segb" + (R.part === p[0] ? " on" : ""), p[1]);
      b.type = "button";
      b.addEventListener("click", function () { R.part = p[0]; [].forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); }); draw(); });
      seg.appendChild(b);
    });
    var bar = el("div", "cn-bar en-tools"); bar.appendChild(seg); host.appendChild(bar); host.appendChild(body);
    function draw() { body.innerHTML = ""; (R.part === "figures" ? figures : register)(body); }
    draw();
  }

  function figures(host) {
    var node = K.loading(host, "the figures");
    NS.reports(H.ST.year === "all" ? undefined : H.ST.year).then(function (res) {
      node.remove();
      var r = res.report, max = Math.max.apply(null, r.funnel.map(function (f) { return f.n; }).concat([1]));
      var s = section(host, "From the first question to the first day", "Counted from the records, for " + yearName(res.year) + ". Each step is a count of children who got that far, not an estimate.");
      var fun = el("div", "ad-funnel");
      r.funnel.forEach(function (f, i) {
        var row = el("div", "ad-fun-row");
        row.appendChild(el("span", "ad-fun-l", esc(f.label)));
        row.appendChild(el("span", "ad-fun-bar", "<i style='width:" + Math.max(f.n ? 2 : 0, Math.round(f.n / max * 100)) + "%'></i>"));
        row.appendChild(el("b", "ad-fun-n", String(f.n)));
        row.appendChild(el("small", "ad-fun-p", f.fromEnquiry != null ? f.fromEnquiry + " began as an enquiry" : i === 0 || f.ofPrevious == null ? "" : pct(f.ofPrevious) + " of the step before"));
        fun.appendChild(row);
      });
      s.appendChild(fun);
      var o = r.outcomes;
      s.appendChild(el("p", "en-note", "Also: " + plural(o.waitlisted, "child", "children") + " on the waiting list · " + o.declined + " declined · " + o.withdrawn + " withdrawn · " + plural(o.drafts, "draft") +
        " not yet sent in." + (r.followUps ? " <b>" + plural(r.followUps, "call") + " to make today.</b>" : "")));

      var t = r.timeliness;
      var s2 = section(host, "How long the school takes", "From an application being sent in to a decision, against the school's own promise of " + t.target + " days.");
      var cards = el("div", "ad-cards");
      [[t.medianDays == null ? "—" : t.medianDays + " days", "median time to a decision"], [t.withinTarget == null ? "—" : t.withinTarget + "%", "decided within " + t.target + " days"],
       [String(t.open), "applications waiting for a decision"], [String(t.openPastTarget), "of them past " + t.target + " days" + (t.oldestOpenDays != null ? " (the oldest, " + t.oldestOpenDays + ")" : "")],
       [String(t.overdue), "past their due date for review"]].forEach(function (c) {
        cards.appendChild(el("div", "ad-card", "<b>" + esc(c[0]) + "</b><small>" + esc(c[1]) + "</small>"));
      });
      s2.appendChild(cards);

      var s3 = section(host, "By class", "Seats against what the class has had.");
      if (!r.grades.length) s3.appendChild(el("p", "en-note", "No class has applications or a seat limit yet."));
      else {
        var tg = K.cnTable([{ label: "Class", w: "minmax(110px, 1fr)" }, { label: "Seats", w: "70px", align: "right" }, { label: "Applied", w: "80px", align: "right" }, { label: "Offered", w: "80px", align: "right" },
          { label: "Joined", w: "74px", align: "right" }, { label: "Waiting", w: "74px", align: "right" }, { label: "Declined", w: "80px", align: "right" }]);
        r.grades.forEach(function (g) {
          tg.row(["<b>" + esc(g.name) + "</b>", g.seats == null ? "<span class='cn-none'>—</span>" : String(g.seats), String(g.applications), String(g.offered), String(g.enrolled),
                  g.waitlisted ? "<b class='cn-mk warn'>" + g.waitlisted + "</b>" : "0", String(g.declined)], null, g.name);
        });
        s3.appendChild(tg);
      }

      var s4 = section(host, "Where families come from", "The enquiry that began each application, or \"came straight to apply\".");
      var ts = K.cnTable([{ label: "Source", w: "minmax(160px, 1.4fr)" }, { label: "Enquiries", w: "90px", align: "right" }, { label: "Applications", w: "104px", align: "right" }, { label: "Joined", w: "74px", align: "right" }]);
      r.sources.forEach(function (x) { ts.row(["<b>" + esc(sourceName(x.source)) + "</b>", String(x.enquiries), String(x.applications), String(x.enrolled)], null, x.source); });
      if (r.sources.length) s4.appendChild(ts); else s4.appendChild(el("p", "en-note", "Nothing yet."));
      if (r.notProceeding.length) {
        s4.appendChild(el("h3", "en-h3", "Why families did not go ahead"));
        s4.appendChild(el("p", "en-note", r.notProceeding.map(function (x) { return esc(x.reason) + " (" + x.n + ")"; }).join(" · ")));
      }

      var s5 = section(host, "Who applies", "Counts only. A name is never shown here.");
      var dist = el("div", "ad-two");
      function tallyBox(title, list, label) {
        var b = el("div"); b.appendChild(el("h3", "en-h3", esc(title)));
        if (!list.length || (list.length === 1 && list[0].key === "—")) b.appendChild(el("p", "en-note", "Nothing recorded."));
        list.forEach(function (x) { b.appendChild(el("div", "ad-tally", "<span>" + esc(label ? label(x.key) : x.key) + "</span><b>" + x.n + "</b>")); });
        dist.appendChild(b);
      }
      var priorityLabel = {};
      H.settings().then(function (st) {
        st.priorities.forEach(function (p) { priorityLabel[p.key] = p.label; });
        tallyBox("Priority category claimed", r.priority, function (k) { return k === "—" ? "None claimed" : priorityLabel[k] || k; });
        tallyBox("Category", r.category, function (k) { return k === "—" ? "Not stated" : k; });
      });
      s5.appendChild(dist);

      var acts = el("div", "en-page-acts");
      acts.appendChild(btn("Print this report", "strong", function () { printFigures(res); }));
      host.appendChild(acts);
    }, function (e) { K.failed(node, e, function () { K.openAdmin(true, "enrollment"); }); });
  }

  function printFigures(res) {
    var r = res.report;
    var html = K.printHead("Admissions report — " + yearName(res.year), "As at " + day(res.today)) +
      "<h2>From the first question to the first day</h2>" +
      K.printTable([{ t: "Step" }, { t: "Children", r: 1 }, { t: "Of the step before", r: 1 }], r.funnel.map(function (f) { return [f.label, f.n, f.ofPrevious == null ? "" : f.ofPrevious + "%"]; })) +
      "<h2>By class</h2>" +
      K.printTable([{ t: "Class" }, { t: "Seats", r: 1 }, { t: "Applied", r: 1 }, { t: "Offered", r: 1 }, { t: "Joined", r: 1 }, { t: "Waiting", r: 1 }, { t: "Declined", r: 1 }],
        r.grades.map(function (g) { return [g.name, g.seats == null ? "" : g.seats, g.applications, g.offered, g.enrolled, g.waitlisted, g.declined]; })) +
      "<h2>Where families come from</h2>" +
      K.printTable([{ t: "Source" }, { t: "Enquiries", r: 1 }, { t: "Applications", r: 1 }, { t: "Joined", r: 1 }], r.sources.map(function (x) { return [sourceName(x.source), x.enquiries, x.applications, x.enrolled]; })) +
      "<h2>How long the school took</h2><p>Median " + (r.timeliness.medianDays == null ? "—" : r.timeliness.medianDays + " days") + " from application to decision; " +
      (r.timeliness.withinTarget == null ? "—" : r.timeliness.withinTarget + "%") + " within the school's target of " + r.timeliness.target + " days; " + r.timeliness.open + " waiting.</p>";
    K.cxPrint("Admissions report", html);
  }

  /* The register every school keeps: one line per child, in the order of their admission numbers. */
  function register(host) {
    var node = K.loading(host, "the register");
    NS.register(H.ST.year === "all" ? undefined : H.ST.year).then(function (res) {
      node.remove();
      host.appendChild(el("p", "en-note", "Every child enrolled for " + yearName(res.year) + ", with the particulars the school is expected to keep. It is built from the applications and the class registers, so it is never typed twice." +
        (res.sensitive ? "" : " Category is shown to administrators only.")));
      var acts = el("div", "en-tools");
      acts.appendChild(btn("Print the register", "strong", function () { printRegister(res); }));
      acts.appendChild(btn("Export", "", function () {
        K.csvDownload("admission-register-" + res.year + ".csv", [REG_COLS.map(function (c) { return c[1]; })].concat(res.rows.map(function (r) { return REG_COLS.map(function (c) { return r[c[0]] == null ? "" : r[c[0]]; }); })));
      }));
      host.appendChild(acts);
      if (!res.rows.length) { host.appendChild(K.cnEmpty("Nobody is enrolled for this year yet.", "Children appear here once an admitted application has been enrolled.")); return; }
      var tb = K.cnTable([{ label: "Sr.", w: "44px" }, { label: "Adm. no.", w: "96px" }, { label: "Admitted", w: "100px" }, { label: "Name", w: "minmax(150px, 1.2fr)" }, { label: "Born", w: "100px" },
        { label: "Father / Mother", w: "minmax(150px, 1.2fr)" }, { label: "Previous school", w: "minmax(120px, 1fr)" }, { label: "Class", w: "74px" }, { label: "Status", w: "96px" }]);
      tb.classList.add("en-tbl");
      res.rows.forEach(function (r) {
        tb.row([String(r.serial), esc(r.admissionNo || "—"), r.admittedOn ? esc(day(r.admittedOn)) : "—", "<b>" + esc(r.name) + "</b>", r.dob ? esc(day(r.dob)) : "—",
                esc([r.father, r.mother].filter(Boolean).join(" / ") || r.guardian || "—"), esc(r.previousSchool || "—"), esc(r.class || r.admittedToClass),
                chip({ enrolled: ["Enrolled", "green"], suspended: ["Suspended", "orange"], withdrawn: ["Left", "muted"], transferred: ["Left", "muted"], completed: ["Completed", "muted"] }, r.state)], null, r.enrollmentId);
      });
      host.appendChild(tb);
    }, function (e) { K.failed(node, e, function () { K.openAdmin(true, "enrollment"); }); });
  }

  var REG_COLS = [["serial", "Sr. no."], ["admissionNo", "Admission no."], ["admittedOn", "Date of admission"], ["name", "Name of the student"], ["dob", "Date of birth"], ["gender", "Gender"],
    ["father", "Father's name"], ["mother", "Mother's name"], ["guardian", "Guardian"], ["address", "Address"], ["nationality", "Nationality"], ["motherTongue", "Mother tongue"],
    ["category", "Category"], ["previousSchool", "Previous school"], ["tcNumber", "TC number"], ["admittedToClass", "Class admitted to"], ["class", "Class and section"],
    ["leftOn", "Date of leaving"], ["leftReason", "Reason for leaving"]];

  function printRegister(res) {
    var cols = REG_COLS.filter(function (c) { return c[0] !== "motherTongue" && c[0] !== "guardian" && (c[0] !== "category" || res.sensitive); });
    var html = "<style>@page{size:A4 landscape;margin:12mm}table{font-size:9.5px}td,th{padding:4px 5px}</style>" +
      K.printHead("Admission register — " + yearName(res.year), res.school) +
      K.printTable(cols.map(function (c) { return { t: c[1] }; }), res.rows.map(function (r) { return cols.map(function (c) { return r[c[0]]; }); })) +
      "<p class='sub' style='margin-top:26px'>Checked by the Principal: ______________________ &nbsp;&nbsp; Date: ______________</p>";
    K.cxPrint("Admission register", html);
  }

  /* ============================================================ Procedure
     The written procedure, drawn from what the school has set. A procedure that
     is typed once into a document and then changed on the screens drifts; this
     is read from the same settings the screens obey, so it cannot. */
  function procedure(host) {
    var node = K.loading(host, "the procedure");
    H.settings(true).then(function (s) {
      node.remove();
      var year = H.ST.year && H.ST.year !== "all" ? H.ST.year : s.currentYear;
      var cal = (s.calendar || {})[year] || {};
      var L = s.letters || {};
      var assess = (s.assessments || []);
      var reqAssess = assess.filter(function (a) { return a.required; });

      host.appendChild(el("p", "en-note", "This is the procedure the school follows for the " + yearName(year) + " admissions, written from the school's own settings. " +
        "Change a setting under Requirements and this page changes with it. Print it to give to the governing body, to parents, or to an inspector."));
      var tools = el("div", "en-tools");
      tools.appendChild(btn("Print the procedure", "strong", function () { printProcedure(s, year); }));
      host.appendChild(tools);

      // 1. The calendar
      var c = section(host, "Admission calendar", "The dates the school publishes. Set them under Requirements.");
      var CAL = [["opens", "Registration opens"], ["closes", "Registration closes"], ["assessFrom", "Assessments begin"], ["assessTo", "Assessments end"],
                 ["resultsOn", "Results declared"], ["offersBy", "Offers must be taken up by"], ["classesBegin", "Classes begin"]];
      if (!Object.keys(cal).length) c.appendChild(el("p", "en-note", "No dates are set for " + yearName(year) + " yet."));
      else {
        var ct = K.cnTable([{ label: "Step", w: "minmax(180px, 1fr)" }, { label: "Date", w: "minmax(160px, 1fr)" }]);
        CAL.forEach(function (x) { if (cal[x[0]]) ct.row([esc(x[1]), "<b>" + esc(longDay(cal[x[0]]) + " " + cal[x[0]].slice(0, 4)) + "</b>"], null, x[0]); });
        c.appendChild(ct);
      }

      // 2. The stages
      var st = section(host, "The procedure, step by step", "Every step has an owner, leaves a record, and has a time the school holds itself to.");
      var tb = K.cnTable([{ label: "", w: "34px" }, { label: "Step", w: "minmax(130px, .8fr)" }, { label: "What happens", w: "minmax(260px, 2fr)" }, { label: "Who", w: "minmax(120px, .8fr)" },
                          { label: "Kept as", w: "minmax(120px, .9fr)" }, { label: "Time", w: "minmax(90px, .6fr)" }]);
      tb.classList.add("ad-proc");
      STAGES(s).forEach(function (x, i) { tb.row([String(i + 1), "<b>" + esc(x[0]) + "</b>", esc(x[1]), esc(x[2]), esc(x[3]), esc(x[4])], null, "s" + i); });
      st.appendChild(tb);

      // 3. What an application must carry
      var w = section(host, "What every application carries", "An application cannot be sent in, or decided, until these are met.");
      w.appendChild(el("h3", "en-h3", "Particulars"));
      var base = ["The student's legal name and date of birth", "The class and year applied for, and the joining date", "A parent or guardian with a phone number or email", "The residential address",
                  "The family's declaration under the school's policy (version " + s.consent.version + ")"];
      (s.requiredFields || []).forEach(function (k) { base.push(FIELD_LABEL[k] || k); });
      w.appendChild(ul(base));
      w.appendChild(el("h3", "en-h3", "Documents"));
      var dt = K.cnTable([{ label: "Document", w: "minmax(200px, 1.4fr)" }, { label: "Needed", w: "90px" }, { label: "For", w: "minmax(140px, 1fr)" }, { label: "Restricted", w: "90px" }]);
      s.documents.forEach(function (d) {
        var types = (d.types && d.types.length ? d.types.map(function (t) { return H.TYPES[t] || t; }) : ["Every kind"]).join(", ");
        dt.row([esc(d.label), d.required === false ? "Optional" : "Required", esc(types + (d.grades && d.grades.length ? " · " + d.grades.join(", ") : "")), d.sensitive ? "Yes" : "—"], null, d.key);
      });
      w.appendChild(dt);
      w.appendChild(el("h3", "en-h3", "Assessment"));
      if (!assess.length) w.appendChild(el("p", "en-note", "The school does not assess children before a decision."));
      else {
        var at = K.cnTable([{ label: "What", w: "minmax(200px, 1.4fr)" }, { label: "Before a decision", w: "130px" }, { label: "For", w: "minmax(140px, 1fr)" }]);
        assess.forEach(function (a) {
          at.row([esc(a.label), a.required ? "<b>Required</b>" : "Optional", esc((a.types && a.types.length ? a.types.map(function (t) { return H.TYPES[t] || t; }).join(", ") : "Every kind") +
            (a.grades && a.grades.length ? " · " + a.grades.join(", ") : " · every class"))], null, a.key);
        });
        w.appendChild(at);
      }
      w.appendChild(el("h3", "en-h3", "When seats are few"));
      w.appendChild(el("p", "en-note", "A class with a seat limit admits no more than that without a reason recorded by the person deciding. Children who are waitlisted are heard in this order, then by the day they joined the list:"));
      w.appendChild(ul((s.priorities || []).map(function (p, i) { return (i + 1) + ". " + p.label; }).concat(["Everyone else, in order of application"])));

      // 4. Who may do what
      var who = section(host, "Who may do what", "The people who check papers are not the people who decide, and neither enrols the child. Every action is on the child's record.");
      var wt = K.cnTable([{ label: "Action", w: "minmax(220px, 1.4fr)" }, { label: "Administrator", w: "100px" }, { label: "Registrar", w: "90px" }, { label: "Admissions", w: "100px" }]);
      [["Record an enquiry, register and edit an application, schedule and record an assessment", 1, 1, 1], ["Verify, return or waive a document; start a review; settle a possible duplicate", 1, 1, 0],
       ["Admit, waitlist or decline; set aside a seat, age or assessment rule with a reason", 1, 0, 1], ["Enrol a student, choose the class, create their sign-in and the family's", 1, 1, 0],
       ["Write an acknowledgement or a call letter", 1, 1, 1], ["Write a letter about documents", 1, 1, 0], ["Write an offer, waiting-list or regret letter", 1, 0, 1],
       ["Write a confirmation of admission", 1, 1, 0], ["Read restricted notes, health and support information", 1, 0, 0], ["Change what the school asks, the calendar and the letters", 1, 0, 0]]
        .forEach(function (r) { wt.row([esc(r[0]), r[1] ? "✓" : "—", r[2] ? "✓" : "—", r[3] ? "✓" : "—"], null, r[0]); });
      who.appendChild(wt);

      // 5. Letters
      var lt = section(host, "Letters", "Every letter is numbered, kept exactly as it was written, and cannot be changed afterwards. A letter never mentions money.");
      lt.appendChild(el("p", "en-note", "A reference reads <b>" + esc((L.code || "ADM") + "/ADM/" + year.slice(0, 4) + "-" + year.slice(7) + "/0012/OFR") + "</b>: the school, the year, the application, the kind of letter." +
        (L.signatory ? " Letters are signed by " + esc(L.signatory) + (L.designation ? ", " + esc(L.designation) : "") + "." : " Set who signs the letters under Requirements.")));
      lt.appendChild(ul(["Acknowledgement — when an application is received", "Documents required — when papers or corrections are outstanding", "Call for assessment — when a session is scheduled",
        "Offer of admission — when the child is admitted", "Waiting list — with the child's position", "Regret — when the application is declined", "Confirmation of admission — when the child is enrolled and seated"]));

      // 6. Rules
      var ru = section(host, "Rules the school cannot switch off", "These hold whatever is set above.");
      ru.appendChild(ul(["A possible duplicate is settled by a person before any decision. Brothers and sisters are shown, not flagged.", "A file attached is only received; a person verifies a document.",
        "Approving and enrolling are separate acts by separate people.", "A child has one live enrolment in a school year.", "Every change leaves a line: who, when, from what, to what, and why. Nothing is rewritten.",
        "Restricted notes, health and support information are read by administrators and by the family that wrote them.", "No identity number is required of a family unless the school adds it. Aadhaar is never stored.",
        "A rule about age, seats or assessment can be set aside only with a reason, by the person who decides, and the reason is kept."]));
      void reqAssess;
    }, function (e) { K.failed(node, e, function () { K.openAdmin(true, "enrollment"); }); });
  }

  var FIELD_LABEL = { "student.gender": "Gender", "student.nationality": "Nationality", "student.motherTongue": "Mother tongue", "student.bloodGroup": "Blood group",
    "student.category": "Category", "contact.pin": "PIN code", "emergency.name": "An emergency contact", "previous.lastGrade": "The last class completed" };

  function ul(items) {
    var u = el("ul", "ad-list");
    items.forEach(function (x) { u.appendChild(el("li", null, esc(x))); });
    return u;
  }

  /* The nine steps, with the school's own numbers in them. */
  function STAGES(s) {
    var yes = s.requireAcceptance;
    return [
      ["Enquiry", "The family's enquiry is written down: the child, the class, how they heard of the school. A call back is promised.", "Admissions officer", "Enquiry record and log", "Call back within 2 days"],
      ["Registration", "The application is registered after checking that the child is not already known to the school. An application number is issued.", "Admissions officer", "Application number; history", "Same day"],
      ["Application form", "Every particular is filled in, the parents' details taken, and the family makes its declaration. The application is sent in.", "Family or admissions officer", "The application form", "At registration"],
      ["Documents", "Each document is received, then checked against the original by the registrar and marked verified, returned with a reason, or waived with a reason.", "Registrar", "Document status and who checked", "Review begins within " + s.dueDays + " days"],
      ["Assessment", (s.assessments || []).some(function (a) { return a.required; }) ? "The child sits what the school requires (" + s.assessments.filter(function (a) { return a.required; }).map(function (a) { return a.label.toLowerCase(); }).join(", ") +
        "). A call letter is issued; the panel records the result." : "Where the school asks for an assessment or interaction, it is scheduled, a call letter issued, and the result recorded.", "Admissions officer and panel", "Session, result, remarks", "As scheduled"],
      ["Review", "The registrar completes the review checklist, settles any possible duplicate, and marks the application ready for a decision.", "Registrar", "Checklist and history", "Before the decision"],
      ["Decision", "The application is admitted, waitlisted or declined. A full class, a younger child or an assessment not met needs a recorded reason to admit.", "Admissions reviewer or administrator", "Decision, reason and note", "Within " + s.decisionDays + " days of the application"],
      ["Offer", yes ? "An offer letter is issued. The family accepts in writing within " + s.offerDays + " days, or the seat may be offered to another child." : "An offer letter is issued and the seat is confirmed.", "Admissions reviewer", "Offer letter; acceptance", yes ? s.offerDays + " days to accept" : "On the decision"],
      ["Enrolment and class", "The registrar sets the day the student starts, chooses the class and section, creates the student's sign-in and the family's, and the child appears in the class register. A confirmation letter is issued.", "Registrar", "Enrolment, roster, confirmation letter", "Before the first day"]
    ];
  }

  function printProcedure(s, year) {
    var L = s.letters || {}, cal = (s.calendar || {})[year] || {};
    var CAL = [["opens", "Registration opens"], ["closes", "Registration closes"], ["assessFrom", "Assessments begin"], ["assessTo", "Assessments end"], ["resultsOn", "Results declared"], ["offersBy", "Offers must be taken up by"], ["classesBegin", "Classes begin"]];
    var html = "<style>h2{margin-top:22px}ol,ul{margin:6px 0 0 18px;padding:0}li{margin:3px 0}.sig{margin-top:50px;display:flex;justify-content:space-between}.sig div{width:44%;border-top:1px solid #000;padding-top:6px;font-size:12px}</style>" +
      K.printHead("Admission procedure and policy — " + yearName(year), L.address || "") +
      "<h2>1. Purpose</h2><p>Admission to the school is a controlled procedure, not a data-entry task. Every application has an owner and a next step, every decision has a recorded reason, and every change is on the child's record.</p>" +
      (Object.keys(cal).length ? "<h2>2. Calendar</h2>" + K.printTable([{ t: "Step" }, { t: "Date" }], CAL.filter(function (x) { return cal[x[0]]; }).map(function (x) { return [x[1], longDay(cal[x[0]]) + " " + cal[x[0]].slice(0, 4)]; })) : "") +
      "<h2>3. The procedure</h2>" + K.printTable([{ t: "#" }, { t: "Step" }, { t: "What happens" }, { t: "Who" }, { t: "Time" }], STAGES(s).map(function (x, i) { return [i + 1, x[0], x[1], x[2], x[4]]; })) +
      "<h2>4. Documents</h2>" + K.printTable([{ t: "Document" }, { t: "Needed" }, { t: "For" }], s.documents.map(function (d) {
        return [d.label, d.required === false ? "Optional" : "Required", (d.types && d.types.length ? d.types.map(function (t) { return H.TYPES[t] || t; }).join(", ") : "Every kind") + (d.grades && d.grades.length ? " · " + d.grades.join(", ") : "")]; })) +
      "<h2>5. Seats and the waiting list</h2><p>A class admits no more than its seat limit unless the person deciding records a reason. Waitlisted children are heard in this order, then by the day they joined the list: " +
      (s.priorities || []).map(function (p) { return p.label; }).concat(["everyone else"]).join("; ") + ".</p>" +
      "<h2>6. Rules that always apply</h2><ul><li>A possible duplicate is settled by a person before a decision.</li><li>A document is verified by a person after seeing the original.</li><li>Those who check papers do not decide, and neither enrols the child.</li>" +
      "<li>Every change is recorded with who made it, when, and why; nothing is rewritten.</li><li>Health and support information is restricted to administrators and the family.</li><li>No identity number is required unless the school adds it, and Aadhaar is never stored.</li></ul>" +
      "<div class='sig'><div>" + esc(L.signatory || "Principal") + (L.designation ? "<br>" + esc(L.designation) : "") + "</div><div>Date</div></div>";
    K.cxPrint("Admission procedure and policy", html);
  }

  return { enquiries: enquiries, desk: desk, reports: reports, procedure: procedure, recordResult: recordResult, logCall: logCall };
};
