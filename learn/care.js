/* ==========================================================================
   OEdu — Behavior and Health.

   Two places the office keeps what is sensitive, and the rules around each.

   Behavior is incidents, merits and counseling notes. A teacher records what
   they saw; the people who run discipline settle entries, set a follow-up and
   choose — entry by entry — whether the family sees it. The default is that
   it does not.

   Health is allergies, conditions, vaccinations, medications, screenings,
   visits and insurance, kept by the nurse and the office. A teacher is not
   given the record; they are given the flags the school raised.

   Whether a person may read or change either is decided on the server
   (api/src/core/guard.js). This file draws what it was given; a page the
   server refuses says so instead of showing less.

   Mounted by app.js with the console kit: OPLO_CARE(kit) →
   { behavior, health, studentBehavior, studentHealth }.
   ========================================================================== */
window.OPLO_CARE = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast;
  var CN = API.conduct, HL = API.healthRecords;

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function day(ymd) {
    if (!ymd) return "";
    var p = String(ymd).split("-");
    return p.length === 3 ? (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0] : String(ymd);
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function plus(ymd, n) { var d = new Date(ymd + "T00:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function ago(ms) {
    if (!ms) return "";
    var s = Math.floor((Date.now() - ms) / 1000);
    if (s < 3600) return Math.max(1, Math.floor(s / 60)) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    var d = Math.floor(s / 86400);
    return d === 1 ? "yesterday" : d + " days ago";
  }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }

  var KIND = { incident: ["Incident", "orange"], merit: ["Merit", "green"], counseling: ["Counseling", "blue"] };
  var HKIND = { allergy: "Allergy", condition: "Condition", immunization: "Immunization", medication: "Medication",
                screening: "Screening", visit: "Visit", insurance: "Insurance" };
  var HORDER = ["allergy", "condition", "medication", "immunization", "screening", "visit", "insurance"];

  function chip(tone, label) { return "<span class='en-st en-" + tone + "'><i></i>" + esc(label) + "</span>"; }

  function fld(kind, label, value, o) {
    o = o || {};
    var w = el("label", "admin-field en-f");
    w.appendChild(el("span", null, esc(label) + (o.req ? " <i class='en-req'>*</i>" : "")));
    var i;
    if (kind === "select") {
      i = el("select");
      (o.options || []).forEach(function (x) { var op = el("option"); op.value = x[0]; op.textContent = x[1]; i.appendChild(op); });
    } else if (kind === "area") { i = el("textarea"); i.rows = o.rows || 3; }
    else { i = el("input"); i.type = kind === "date" ? "date" : "text"; }
    i.value = value == null ? "" : value;
    if (o.hint) i.placeholder = o.hint;
    if (o.max) i.maxLength = o.max;
    w.appendChild(i);
    if (o.note) w.appendChild(el("small", "en-fnote", esc(o.note)));
    return { node: w, input: i, value: function () { return i.value.trim(); } };
  }
  function btn(label, cls, go) {
    var b = el("button", "en-btn" + (cls ? " " + cls : ""), esc(label));
    b.type = "button";
    if (go) b.addEventListener("click", go);
    return b;
  }

  /* A sheet with a body and one decision (its buttons are .en-btn on purpose:
     the console's sheet closes on any .cn-btn pressed inside it). */
  function dialog(o) {
    var box = el("div", "en-dlg" + (o.wide ? " en-wide" : ""));
    box.appendChild(el("h2", "en-dlg-h", esc(o.title)));
    if (o.sub) box.appendChild(el("p", "en-dlg-sub", esc(o.sub)));
    var host = el("div", "en-dlg-body");
    box.appendChild(host);
    var err = el("div", "en-dlg-err");
    err.hidden = true;
    box.appendChild(err);
    var acts = el("div", "en-dlg-acts" + (o.wrap ? " en-wrap" : ""));
    var sheet = null;
    var ctl = { close: function () { if (sheet) sheet.close(); },
                error: function (m) { err.hidden = !m; err.textContent = m || ""; } };
    acts.appendChild(btn(o.action ? "Cancel" : "Close", "quiet", ctl.close));
    if (o.action) {
      var go = btn(o.action, o.tone === "danger" ? "danger" : "strong", function () {
        ctl.error("");
        go.disabled = true;
        var out;
        try { out = o.onSubmit(ctl); } catch (e) { go.disabled = false; ctl.error(e.message); return; }
        Promise.resolve(out).then(function () { ctl.close(); }, function (e) { go.disabled = false; ctl.error(e && e.message ? e.message : "That did not work."); });
      });
      acts.appendChild(go);
    }
    if (o.extra) o.extra(acts, ctl);
    box.appendChild(acts);
    sheet = K.cxSheet(box);
    if (o.body) o.body(host, ctl);
    return ctl;
  }

  /* Who: a search that turns a few letters into a short list of students. */
  var PEOPLE = null;
  function people() {
    if (PEOPLE) return Promise.resolve(PEOPLE);
    return API.accounts.list(K.S.me.orgId).then(function (l) { PEOPLE = l || []; return PEOPLE; }, function () { return []; });
  }
  function picker(pre) {
    var chosen = pre || null;
    var wrap = el("div", "en-f care-pick");
    var lab = el("label", "admin-field");
    lab.appendChild(el("span", null, "Student <i class='en-req'>*</i>"));
    var inp = el("input");
    inp.type = "search"; inp.placeholder = "Start typing a name";
    inp.value = pre ? pre.name : "";
    lab.appendChild(inp);
    wrap.appendChild(lab);
    var list = el("div", "care-pick-list");
    wrap.appendChild(list);
    inp.addEventListener("input", function () {
      chosen = null;
      var t = inp.value.trim().toLowerCase();
      list.innerHTML = "";
      if (t.length < 2) return;
      people().then(function (all) {
        all.filter(function (p) { return (p.name || "").toLowerCase().indexOf(t) > -1 && p.status !== "suspended"; }).slice(0, 6).forEach(function (p) {
          var b = el("button", "care-pick-i", esc(p.name) + (p.title ? " <small>" + esc(p.title) + "</small>" : ""));
          b.type = "button";
          b.addEventListener("click", function () { chosen = p; inp.value = p.name; list.innerHTML = ""; });
          list.appendChild(b);
        });
      });
    });
    return { node: wrap, get: function () { return chosen; } };
  }

  /* ===================================================== Behavior (page) */
  var ST = { kind: "", status: "open", q: "", due: false };

  function behavior(v) {
    var P = K.cxPage(v, "Students", "Behavior",
      "Incidents, merits and counseling notes — who recorded what, what was done, and when somebody should look again. A family sees only what the school chooses to show.");
    P.tools.appendChild(K.cnAction("Record an entry", function () { entry(null, function () { K.openAdmin(true, "behavior"); }); }, true));
    var metrics = el("div");
    v.appendChild(metrics);
    var filters = el("div");
    v.appendChild(filters);
    var tools = el("div", "cn-bar en-tools");
    var find = el("input", "cn-search");
    find.type = "search"; find.placeholder = "Search student, title or category"; find.value = ST.q;
    tools.appendChild(find);
    v.appendChild(tools);
    var slot = el("div", "en-slot");
    v.appendChild(slot);

    var timer = null;
    find.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { ST.q = find.value.trim(); load(); }, 250); });

    var chips = K.cnFilters([{ k: "", name: "Everything" }, { k: "incident", name: "Incidents" }, { k: "merit", name: "Merits" },
      { k: "counseling", name: "Counseling" }, { k: "due", name: "Follow-ups due" }], ST.due ? "due" : ST.kind, function (k) {
      ST.due = k === "due"; ST.kind = k === "due" ? "" : k; chips.mark(k); load();
    });
    filters.appendChild(chips);
    var st = K.cnFilters([{ k: "open", name: "Open" }, { k: "resolved", name: "Resolved" }, { k: "", name: "All" }], ST.status, function (k) {
      ST.status = k; st.mark(k); load();
    });
    st.style.marginLeft = "10px";
    filters.style.display = "flex"; filters.style.flexWrap = "wrap"; filters.style.marginBottom = "14px";
    filters.appendChild(st);

    function paintMetrics(s) {
      metrics.innerHTML = "";
      K.cxMetrics(metrics, [
        { label: "Open incidents", value: s.open }, { label: "Follow-ups due", value: s.followUpsDue, bad: true },
        { label: "Incidents, 30 days", value: s.incidents30 }, { label: "Merits, 30 days", value: s.merits30 },
        { label: "Students with 3 or more", value: s.repeat.length, note: s.repeat.slice(0, 2).map(function (r) { return esc(r.name); }).join(", ") }
      ]);
    }
    CN.summary(today()).then(paintMetrics, function (e) {
      metrics.appendChild(el("p", "en-note", esc(e.status === 403 ? "You can record and read your own entries here. The school-wide figures are for those who run discipline." : e.message)));
    });

    function load() {
      slot.innerHTML = "";
      slot.appendChild(el("div", "admin-loading", "Loading entries…"));
      CN.list({ kind: ST.kind || undefined, status: ST.status || undefined, q: ST.q || undefined, followUp: ST.due ? "due" : undefined, today: today() })
        .then(function (r) {
          slot.innerHTML = "";
          if (!r.entries.length) {
            slot.appendChild(K.cnEmpty("No entries.", ST.q || ST.kind || ST.due ? "Nothing matches. Clear the filters to see more." : "Record an incident, a merit or a counseling note and it appears here.",
              "Record an entry", function () { entry(null, load); }));
            return;
          }
          var t = K.cnTable([{ label: "Date", w: "92px" }, { label: "Student", w: "minmax(150px, 1.1fr)" }, { label: "Kind", w: "110px" },
            { label: "What happened", w: "minmax(200px, 1.6fr)" }, { label: "Follow-up", w: "96px" }, { label: "Family", w: "70px" }, { label: "Status", w: "90px" }]);
          r.entries.forEach(function (c) {
            var k = KIND[c.kind] || [c.kind, "muted"];
            var late = c.status === "open" && c.followUpOn && c.followUpOn <= today();
            t.row([esc(day(c.occurredOn)), "<b>" + esc(c.studentName || "") + "</b>", chip(k[1], k[0]),
                   esc(c.title) + (c.category ? "<span class='cn-sub2'>" + esc(c.category) + (c.severity ? " · " + esc(c.severity) : "") + "</span>" : ""),
                   c.followUpOn ? "<span class='" + (late ? "en-late" : "") + "'>" + esc(day(c.followUpOn)) + "</span>" : "<span class='cn-none'>—</span>",
                   c.familySees ? "Sees it" : "<span class='cn-none'>No</span>",
                   c.status === "open" ? chip("orange", "Open") : chip("muted", "Resolved")],
              function () { detail(c.id, load); }, c.id);
          });
          slot.appendChild(t);
        }, function (e) { K.failed(slot, e, load); });
    }
    load();
  }

  /* An entry, to record or to change. */
  function entry(pre, done) {
    var who = picker(pre && pre.student);
    var kind = fld("select", "Kind", "incident", { options: [["incident", "Incident"], ["merit", "Merit"], ["counseling", "Counseling note"]] });
    var cat = fld("text", "Category", "", { hint: "Tardiness, respect, kindness, leadership…", max: 60 });
    var sev = fld("select", "How serious", "minor", { options: [["minor", "Minor"], ["moderate", "Moderate"], ["serious", "Serious"]] });
    var title = fld("text", "In a line", "", { req: true, max: 160 });
    var when = fld("date", "When", today(), { req: true });
    var where = fld("text", "Where", "", { max: 120 });
    var details = fld("area", "What happened", "", { rows: 4, max: 4000 });
    var people2 = fld("text", "Others involved", "", { max: 400 });
    var action = fld("area", "What was done", "", { rows: 2, max: 1000 });
    var follow = fld("date", "Look again on", "", { note: "Leave empty if nothing needs following up." });
    var share = el("label", "en-radio");
    var sc = el("input"); sc.type = "checkbox";
    share.appendChild(sc); share.appendChild(el("span", null, "Show this to the student's family"));
    dialog({
      title: "Record an entry", sub: "It goes on the student's record, with who wrote it and when.", wide: true, action: "Record it",
      body: function (h) {
        h.appendChild(who.node);
        var g = el("div", "en-form-grid");
        [kind, cat, title, when, where].forEach(function (f) { g.appendChild(f.node); });
        function sevShow() { sev.node.hidden = kind.value() !== "incident"; }
        g.insertBefore(sev.node, title.node);
        kind.input.addEventListener("change", sevShow); sevShow();
        h.appendChild(g);
        h.appendChild(details.node); h.appendChild(people2.node); h.appendChild(action.node);
        var g2 = el("div", "en-form-grid"); g2.appendChild(follow.node); h.appendChild(g2);
        h.appendChild(share);
        h.appendChild(el("p", "en-note", "Only people who run discipline can choose to show an entry to a family. Nothing is sent to anyone."));
      },
      onSubmit: function () {
        // Everything missing at once, not the first thing and then the next.
        var s = who.get(), missing = [];
        if (!s) missing.push("the student, chosen from the list");
        if (!title.value()) missing.push("what it was, in a line");
        if (!when.value()) missing.push("the date");
        if (missing.length) throw new Error("Still needed: " + missing.join("; ") + ".");
        return CN.create({ studentId: s.id, kind: kind.value(), category: cat.value(), severity: kind.value() === "incident" ? sev.value() : undefined,
          title: title.value(), occurredOn: when.value(), location: where.value(), details: details.value(), people: people2.value(),
          actionTaken: action.value(), followUpOn: follow.value() || undefined, familySees: sc.checked }).then(function () {
          toast("Recorded."); if (done) done();
        });
      }
    });
  }

  function detail(id, done) {
    CN.get(id).then(function (r) {
      var c = r.entry;
      var box = el("div", "en-dlg en-wide");
      var k = KIND[c.kind] || [c.kind, "muted"];
      box.appendChild(el("h2", "en-dlg-h", esc(c.title)));
      box.appendChild(el("p", "en-dlg-sub", chip(k[1], k[0]) + " &nbsp; " + esc(c.studentName || "") + " · " + esc(day(c.occurredOn)) +
        (c.location ? " · " + esc(c.location) : "") + (c.courseTitle ? " · " + esc(c.courseTitle) : "")));
      function line(l, v) { if (v) box.appendChild(el("p", "en-line", "<b>" + esc(l) + "</b> " + esc(v))); }
      line("Category", [c.category, c.severity].filter(Boolean).join(" · "));
      line("What happened", c.details); line("Others involved", c.people); line("What was done", c.actionTaken);
      line("Look again", c.followUpOn ? day(c.followUpOn) : "");
      line("Recorded by", c.reporterName);
      line("Family", c.familySees ? "Sees this entry" : "Does not see this entry");
      if (r.events && r.events.length) {
        box.appendChild(el("h3", "en-h3", "History"));
        r.events.forEach(function (e) {
          box.appendChild(el("div", "en-step-r", "<span>" + esc(ago(e.at)) + "</span><small>" + esc(e.byName || "") + " — " + esc(e.kind) + (e.note ? ": " + esc(e.note) : "") + "</small>"));
        });
      }
      var acts = el("div", "en-dlg-acts en-wrap");
      var sheet = null;
      function act(a, msg, note) {
        CN.act(id, a, note || {}).then(function () { toast(msg); sheet.close(); if (done) done(); }, function (e) { toast(e.message); });
      }
      acts.appendChild(btn(c.status === "open" ? "Resolve" : "Reopen", c.status === "open" ? "strong" : "", function () { act(c.status === "open" ? "resolve" : "reopen", c.status === "open" ? "Resolved." : "Reopened."); }));
      acts.appendChild(btn(c.familySees ? "Hide from the family" : "Show to the family", "", function () { act(c.familySees ? "hide" : "show", c.familySees ? "Hidden from the family." : "Shown to the family."); }));
      acts.appendChild(btn("Edit follow-up…", "quiet", function () {
        sheet.close();
        var f = fld("date", "Look again on", c.followUpOn || ""), a = fld("area", "What was done", c.actionTaken || "", { rows: 3 });
        dialog({ title: "Follow-up", action: "Save", body: function (h) { h.appendChild(f.node); h.appendChild(a.node); },
          onSubmit: function () { return CN.update(id, { followUpOn: f.value() || null, actionTaken: a.value() || null }).then(function () { toast("Saved."); if (done) done(); }); } });
      }));
      acts.appendChild(btn("Close", "quiet", function () { sheet.close(); }));
      box.appendChild(acts);
      sheet = K.cxSheet(box);
    }, function (e) { toast(e.message); });
  }

  /* One student's behavior, in Student 360. */
  function studentBehavior(pane, student) {
    var slot = el("div");
    pane.appendChild(slot);
    function load() {
      slot.innerHTML = "";
      CN.forStudent(student.id).then(function (r) {
        slot.innerHTML = "";
        var acts = K.cnActions();
        acts.appendChild(K.cnAction("Record an entry", function () { entry({ student: { id: student.id, name: student.name } }, load); }, true));
        slot.appendChild(acts);
        if (!r.entries.length) { slot.appendChild(K.cnEmpty("Nothing recorded.", "Incidents, merits and counseling notes for this student appear here.")); return; }
        var t = K.cnTable([{ label: "Date", w: "92px" }, { label: "Kind", w: "110px" }, { label: "What happened", w: "minmax(200px, 1.6fr)" },
          { label: "Follow-up", w: "96px" }, { label: "Family", w: "70px" }, { label: "Status", w: "90px" }]);
        r.entries.forEach(function (c) {
          var k = KIND[c.kind] || [c.kind, "muted"];
          t.row([esc(day(c.occurredOn)), chip(k[1], k[0]), esc(c.title) + (c.category ? "<span class='cn-sub2'>" + esc(c.category) + "</span>" : ""),
                 c.followUpOn ? esc(day(c.followUpOn)) : "<span class='cn-none'>—</span>", c.familySees ? "Sees it" : "<span class='cn-none'>No</span>",
                 c.status === "open" ? chip("orange", "Open") : chip("muted", "Resolved")], function () { detail(c.id, load); }, c.id);
        });
        slot.appendChild(t);
      }, function (e) { slot.appendChild(el("p", "en-note", esc(e.message))); });
    }
    load();
  }

  /* ======================================================== Health (page) */
  var HS = { view: "alerts", q: "" };

  function health(v) {
    var P = K.cxPage(v, "Students", "Health",
      "Allergies, vaccinations, medications and the rest — kept by the nurse and the office. A teacher is shown only the flags raised for the students they teach.");
    P.tools.appendChild(K.cnAction("Add an entry", function () { healthEntry(null, function () { K.openAdmin(true, "health"); }); }, true));
    var metrics = el("div");
    v.appendChild(metrics);
    var slotTop = el("div");
    v.appendChild(slotTop);
    var tools = el("div", "cn-bar en-tools");
    var find = el("input", "cn-search");
    find.type = "search"; find.placeholder = "Search student or entry"; find.value = HS.q;
    tools.appendChild(find);
    v.appendChild(tools);
    var slot = el("div", "en-slot");
    v.appendChild(slot);

    var node = K.loading(slot, "health records");
    var T = today();
    var all = null;
    Promise.all([HL.summary(T), HL.list({ status: "active" })]).then(function (r) {
      node.remove();
      var s = r[0];
      all = r[1].entries;
      K.cxMetrics(metrics, [
        { label: "Students overdue", value: s.studentsOverdue, bad: true, note: plural(s.immunizationsOverdue, "dose") + " overdue" },
        { label: "Due in 30 days", value: s.immunizationsSoon },
        { label: "Severe allergies", value: s.severeAllergies },
        { label: "On medication", value: s.medications },
        { label: "Flagged for teachers", value: s.flagged, note: plural(s.studentsWithRecords, "student") + " with records" }
      ]);
      var views = K.cnFilters([{ k: "alerts", name: "Alerts" }, { k: "immunizations", name: "Immunizations" }, { k: "medications", name: "Medications" },
        { k: "students", name: "By student" }], HS.view, function (k) { HS.view = k; views.mark(k); draw(); });
      slotTop.appendChild(views);
      slotTop.style.marginBottom = "14px";
      draw();
    }, function (e) {
      node.remove();
      slot.appendChild(K.cnEmpty(e.status === 403 ? "Health records are the nurse's and the office's." : "That did not load.",
        e.status === 403 ? "Ask an administrator to give you the nurse role if this is your work. A teacher sees the flags for their students in the gradebook." : e.message));
    });
    find.addEventListener("input", function () { HS.q = find.value.trim(); draw(); });

    function match(r) {
      var t = HS.q.toLowerCase();
      return !t || [r.studentName, r.title, r.detail, r.flag].join(" ").toLowerCase().indexOf(t) > -1;
    }
    function draw() {
      if (!all) return;
      slot.innerHTML = "";
      var rows = all.filter(match), t, soon = plus(T, 30);
      if (HS.view === "alerts") {
        var al = rows.filter(function (r) { return (r.kind === "allergy" && r.severity !== "mild") || (r.kind === "condition" && r.severity === "severe") || r.flag ||
          (r.kind === "immunization" && r.dueOn && r.dueOn < T); });
        if (!al.length) { slot.appendChild(K.cnEmpty("No alerts.", "Severe allergies, flagged conditions and overdue vaccinations appear here.")); return; }
        t = K.cnTable([{ label: "Student", w: "minmax(150px, 1fr)" }, { label: "Entry", w: "minmax(180px, 1.3fr)" }, { label: "Kind", w: "120px" },
          { label: "Why it is here", w: "minmax(180px, 1.4fr)" }]);
        al.sort(function (a, b) { return String(a.studentName).localeCompare(String(b.studentName)); }).forEach(function (r) {
          var why = r.kind === "immunization" ? "<span class='en-late'>Overdue since " + esc(day(r.dueOn)) + "</span>" : r.flag ? "Teachers told: " + esc(r.flag) : esc(r.severity || "");
          t.row(["<b>" + esc(r.studentName || "") + "</b>", esc(r.title) + (r.detail ? "<span class='cn-sub2'>" + esc(r.detail) + "</span>" : ""), esc(HKIND[r.kind] || r.kind), why],
            function () { studentRecord(r.studentId, r.studentName, function () { K.openAdmin(true, "health"); }); }, r.id);
        });
      } else if (HS.view === "immunizations") {
        var im = rows.filter(function (r) { return r.kind === "immunization"; });
        if (!im.length) { slot.appendChild(K.cnEmpty("No vaccinations recorded.", "Add a vaccination with the date given and the day the next is due.")); return; }
        t = K.cnTable([{ label: "Student", w: "minmax(150px, 1fr)" }, { label: "Vaccine", w: "minmax(150px, 1fr)" }, { label: "Last given", w: "110px" },
          { label: "Next due", w: "110px" }, { label: "Status", w: "120px" }]);
        im.sort(function (a, b) { return (a.dueOn || "9") < (b.dueOn || "9") ? -1 : 1; }).forEach(function (r) {
          var s = !r.dueOn ? chip("muted", "Complete") : r.dueOn < T ? chip("red", "Overdue") : r.dueOn <= soon ? chip("orange", "Due soon") : chip("green", "Up to date");
          t.row(["<b>" + esc(r.studentName || "") + "</b>", esc(r.title), r.onDate ? esc(day(r.onDate)) : "<span class='cn-none'>—</span>",
                 r.dueOn ? esc(day(r.dueOn)) : "<span class='cn-none'>—</span>", s],
            function () { studentRecord(r.studentId, r.studentName, function () { K.openAdmin(true, "health"); }); }, r.id);
        });
        slot.appendChild(K.cnActions());
        slot.lastChild.appendChild(K.cnAction("Download CSV", function () {
          K.csvDownload("immunizations-" + T + ".csv", [["Student", "Vaccine", "Last given", "Next due"]].concat(im.map(function (r) { return [r.studentName, r.title, r.onDate || "", r.dueOn || ""]; })));
        }));
      } else if (HS.view === "medications") {
        var md = rows.filter(function (r) { return r.kind === "medication"; });
        if (!md.length) { slot.appendChild(K.cnEmpty("No medications recorded.", "Medication given at school, with the dose and the time, appears here.")); return; }
        t = K.cnTable([{ label: "Student", w: "minmax(150px, 1fr)" }, { label: "Medication", w: "minmax(150px, 1fr)" }, { label: "Dose and when", w: "minmax(200px, 1.5fr)" }, { label: "Teachers told", w: "minmax(150px, 1fr)" }]);
        md.forEach(function (r) {
          t.row(["<b>" + esc(r.studentName || "") + "</b>", esc(r.title), esc(r.detail || ""), r.flag ? esc(r.flag) : "<span class='cn-none'>Nothing</span>"],
            function () { studentRecord(r.studentId, r.studentName, function () { K.openAdmin(true, "health"); }); }, r.id);
        });
      } else {
        var by = {};
        rows.forEach(function (r) { (by[r.studentId] = by[r.studentId] || { name: r.studentName, n: 0, kinds: {} }); by[r.studentId].n++; by[r.studentId].kinds[r.kind] = 1; });
        var ids = Object.keys(by).sort(function (a, b) { return String(by[a].name).localeCompare(String(by[b].name)); });
        if (!ids.length) { slot.appendChild(K.cnEmpty("No records.", "Add an entry to begin a student's health record.")); return; }
        t = K.cnTable([{ label: "Student", w: "minmax(180px, 1fr)" }, { label: "Entries", w: "80px", align: "right" }, { label: "What is on file", w: "minmax(220px, 2fr)" }]);
        ids.forEach(function (id) {
          t.row(["<b>" + esc(by[id].name || "") + "</b>", String(by[id].n), esc(Object.keys(by[id].kinds).map(function (k) { return HKIND[k] || k; }).join(", "))],
            function () { studentRecord(id, by[id].name, function () { K.openAdmin(true, "health"); }); }, id);
        });
      }
      slot.insertBefore(t, slot.firstChild);
    }
  }

  function healthEntry(pre, done) {
    var who = picker(pre && pre.student);
    var kind = fld("select", "Kind", (pre && pre.kind) || "allergy", { options: HORDER.map(function (k) { return [k, HKIND[k]]; }) });
    var title = fld("text", "What", "", { req: true, hint: "Peanuts · MMR · Asthma inhaler · Vision", max: 160 });
    var sev = fld("select", "How serious", "", { options: [["", "—"], ["mild", "Mild"], ["moderate", "Moderate"], ["severe", "Severe"]] });
    var on = fld("date", "Date given or seen", "");
    var due = fld("date", "Next due", "", { note: "For a vaccination: the day the next dose is due." });
    var detail = fld("area", "Detail", "", { rows: 3, max: 2000, hint: "Reaction, dose and time, result, policy number…" });
    var flag = fld("text", "Tell teachers", "", { max: 240, hint: "e.g. Peanut allergy — auto-injector in the office", note: "A teacher sees only this sentence, never the record behind it." });
    dialog({
      title: "Add a health entry", sub: "Only the nurse and the office can read this.", wide: true, action: "Add it",
      body: function (h) {
        h.appendChild(who.node);
        var g = el("div", "en-form-grid");
        [kind, title, sev, on, due].forEach(function (f) { g.appendChild(f.node); });
        h.appendChild(g); h.appendChild(detail.node); h.appendChild(flag.node);
      },
      onSubmit: function () {
        var s = who.get(), missing = [];
        if (!s) missing.push("the student, chosen from the list");
        if (!title.value()) missing.push("what it is");
        if (missing.length) throw new Error("Still needed: " + missing.join("; ") + ".");
        return HL.create({ studentId: s.id, kind: kind.value(), title: title.value(), severity: sev.value() || undefined, onDate: on.value() || undefined,
          dueOn: due.value() || undefined, detail: detail.value() || undefined, flag: flag.value() || undefined }).then(function () {
          toast("Added."); if (done) done();
        });
      }
    });
  }

  /* One student's whole health record. */
  function studentRecord(studentId, name, done) {
    HL.forStudent(studentId).then(function (r) {
      var box = el("div", "en-dlg en-wide");
      box.appendChild(el("h2", "en-dlg-h", esc(name || "Student") + " <span class='en-pref'>health record</span>"));
      var by = {};
      r.entries.forEach(function (e) { (by[e.kind] = by[e.kind] || []).push(e); });
      var sheet = null;
      if (!r.entries.length) box.appendChild(el("p", "en-note", "Nothing is on file."));
      HORDER.forEach(function (k) {
        if (!by[k]) return;
        box.appendChild(el("h3", "en-h3", esc(HKIND[k])));
        by[k].forEach(function (e) {
          var row = el("div", "care-h" + (e.status === "resolved" ? " done" : ""));
          var T = today();
          var tag = e.dueOn ? (e.dueOn < T ? " <span class='en-late'>due " + esc(day(e.dueOn)) + "</span>" : " · next " + esc(day(e.dueOn))) : "";
          row.appendChild(el("div", "care-h-t", "<b>" + esc(e.title) + "</b>" + (e.severity ? " <small>" + esc(e.severity) + "</small>" : "") +
            "<small>" + esc([e.onDate ? day(e.onDate) : "", e.detail || ""].filter(Boolean).join(" · ")) + tag + "</small>" +
            (e.flag ? "<small class='care-flag'>Teachers told: " + esc(e.flag) + "</small>" : "")));
          if (!r.family) {
            row.appendChild(btn(e.status === "active" ? "Resolve" : "Reopen", "quiet small", function () {
              HL.update(e.id, { status: e.status === "active" ? "resolved" : "active" }).then(function () { toast("Updated."); sheet.close(); studentRecord(studentId, name, done); }, function (er) { toast(er.message); });
            }));
          }
          box.appendChild(row);
        });
      });
      var acts = el("div", "en-dlg-acts en-wrap");
      if (!r.family) acts.appendChild(btn("Add an entry…", "strong", function () { sheet.close(); healthEntry({ student: { id: studentId, name: name } }, function () { studentRecord(studentId, name, done); }); }));
      acts.appendChild(btn("Close", "quiet", function () { sheet.close(); if (done) done(); }));
      box.appendChild(acts);
      sheet = K.cxSheet(box);
    }, function (e) { toast(e.message); });
  }

  /* One student's health, in Student 360. */
  function studentHealth(pane, student) {
    var node = K.loading(pane, "their health record");
    HL.forStudent(student.id).then(function (r) {
      node.remove();
      var acts = K.cnActions();
      acts.appendChild(K.cnAction("Open the record", function () { studentRecord(student.id, student.name); }, true));
      acts.appendChild(K.cnAction("Add an entry", function () { healthEntry({ student: { id: student.id, name: student.name } }, function () { pane.innerHTML = ""; studentHealth(pane, student); }); }));
      pane.appendChild(acts);
      if (!r.entries.length) { pane.appendChild(K.cnEmpty("Nothing on file.", "Allergies, vaccinations and medications for this student appear here.")); return; }
      var t = K.cnTable([{ label: "Kind", w: "120px" }, { label: "Entry", w: "minmax(180px, 1.4fr)" }, { label: "Date", w: "100px" }, { label: "Next due", w: "100px" }, { label: "Teachers told", w: "minmax(150px, 1fr)" }]);
      r.entries.filter(function (e) { return e.status === "active"; }).forEach(function (e) {
        t.row([esc(HKIND[e.kind] || e.kind), "<b>" + esc(e.title) + "</b>" + (e.severity ? "<span class='cn-sub2'>" + esc(e.severity) + "</span>" : ""),
               e.onDate ? esc(day(e.onDate)) : "<span class='cn-none'>—</span>", e.dueOn ? esc(day(e.dueOn)) : "<span class='cn-none'>—</span>",
               e.flag ? esc(e.flag) : "<span class='cn-none'>—</span>"]);
      });
      pane.appendChild(t);
    }, function (e) {
      node.remove();
      pane.appendChild(K.cnEmpty(e.status === 403 ? "Health records are the nurse's and the office's." : "That did not load.", e.status === 403 ? "You do not hold the role that reads them." : e.message));
    });
  }

  return { behavior: behavior, health: health, studentBehavior: studentBehavior, studentHealth: studentHealth };
};
