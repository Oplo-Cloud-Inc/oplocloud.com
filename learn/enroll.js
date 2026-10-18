/* ==========================================================================
   OEdu — Enrollment.

   Students → Enrollment is not a form with a Save button. It is the school's
   admissions office: a queue of applications, each with an owner and a next
   step; a record for every application with its documents, its review and
   its history; a decision that is separate from enrolling; and the enrolled
   students with their dates. The page is organised around one question the
   person at the desk keeps asking — "what is stopping this one?" — and every
   application answers it in words and puts the button to fix it beside it.

   What a thing is, what blocks it, and who may do it is decided on the
   server (api/src/services/enrollment.js, api/src/core/guard.js). This file
   draws what the server says and sends what the person chose: it never works
   out for itself whether an application is complete or a step is allowed,
   so it can never disagree with the record.

   Mounted by app.js, which hands over its console kit — the same table,
   filter, sheet and field pieces every other console page is built from:
   OPLO_ENROLL(kit) → { tab, openApplication, openNew }.
   ========================================================================== */
window.OPLO_ENROLL = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast;
  var NS = API.enrollment;

  /* ------------------------------------------------------------- Words */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function day(ymd) {
    if (!ymd) return "";
    var p = String(ymd).split("-");
    return p.length === 3 ? (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0] : String(ymd);
  }
  function stamp(ms) {
    if (!ms) return "";
    var d = new Date(ms);
    var h = d.getHours(), m = ("0" + d.getMinutes()).slice(-2);
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear() + ", " + ((h + 11) % 12 + 1) + ":" + m + (h < 12 ? " am" : " pm");
  }
  function ago(ms) {
    if (!ms) return "";
    var s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    var d = Math.floor(s / 86400);
    return d === 1 ? "yesterday" : d < 30 ? d + " days ago" : day(new Date(ms).toISOString().slice(0, 10));
  }
  function yearName(y) { return y && /^\d{4}-\d{4}$/.test(y) ? y.slice(0, 4) + "–" + y.slice(7) : y || ""; }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function kb(n) { return n >= 1024 * 1024 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many || one + "s"); }

  var STATUS = {
    draft: ["Draft", "muted"], submitted: ["Submitted", "blue"], incomplete: ["Incomplete", "orange"],
    under_review: ["Under review", "blue"], changes_requested: ["Changes requested", "orange"],
    awaiting_decision: ["Awaiting decision", "blue"], waitlisted: ["Waitlisted", "muted"],
    admitted: ["Admitted", "green"], rejected: ["Declined", "red"], withdrawn: ["Withdrawn", "muted"]
  };
  var ENR_STATUS = {
    scheduled: ["Scheduled", "blue"], active: ["Active", "green"], suspended: ["Suspended", "orange"],
    transferred: ["Transferred", "muted"], withdrawn: ["Withdrawn", "muted"], completed: ["Completed", "muted"]
  };
  var DOC_STATUS = {
    missing: ["Not received", "orange"], received: ["Received", "blue"], verified: ["Verified", "green"],
    returned: ["Returned", "red"], waived: ["Waived", "muted"]
  };
  var TYPES = { "new": "New", returning: "Returning", transfer: "Transfer" };
  var REJECT = {
    ineligible: "Not eligible for the grade", incomplete_file: "The file was never completed", no_seat: "No seat available",
    failed_assessment: "Did not meet the assessment", duplicate: "Duplicate application",
    withdrawn_by_family: "Withdrawn by the family", other: "Another reason"
  };
  var EXIT = {
    relocated: "Moved away", transferred_out: "Transferred to another school", withdrawn_by_family: "Withdrawn by the family",
    disciplinary: "Disciplinary", completed_programme: "Completed the programme", other: "Another reason"
  };
  var FIELD = {
    "student.legalFirst": "Legal first name", "student.legalLast": "Legal last name", "student.preferredName": "Preferred name",
    "student.dob": "Date of birth", grade: "Grade", schoolYear: "School year", type: "Application type",
    intendedStart: "Joining date", studentId: "Linked student", consent: "Consent", guardians: "Parent or guardian",
    "contact.address": "Residential address", "previous.school": "Previous school",
    "form.guardians": "Parents and guardians", "form.contact": "Contact details", "form.previous": "Previous school",
    "form.emergency": "Emergency contact", "form.pickup": "Authorized pickup", "form.student": "Student details",
    "form.support": "Support information (restricted)"
  };

  function chip(map, key) {
    var m = map[key] || [key, "muted"];
    return "<span class='en-st en-" + m[1] + "'><i></i>" + esc(m[0]) + "</span>";
  }

  /* ------------------------------------------------------------ Fields
     A control and what it holds, so a form can be read back whole. */
  function fld(kind, label, value, o) {
    o = o || {};
    var wrap = el("label", "admin-field en-f" + (o.cls ? " " + o.cls : ""));
    wrap.appendChild(el("span", null, esc(label) + (o.req ? " <i class='en-req'>*</i>" : "")));
    var input;
    if (kind === "select") {
      input = el("select");
      (o.options || []).forEach(function (op) {
        var oe = el("option");
        oe.value = op[0]; oe.textContent = op[1];
        input.appendChild(oe);
      });
      input.value = value == null ? "" : value;
    } else if (kind === "area") {
      input = el("textarea");
      input.rows = o.rows || 3;
      input.value = value == null ? "" : value;
    } else {
      input = el("input");
      input.type = kind === "date" ? "date" : kind === "email" ? "email" : "text";
      input.value = value == null ? "" : value;
    }
    if (o.hint) input.placeholder = o.hint;
    if (o.list) input.setAttribute("list", o.list);
    if (o.disabled) input.disabled = true;
    if (o.max) input.maxLength = o.max;
    wrap.appendChild(input);
    if (o.note) wrap.appendChild(el("small", "en-fnote", esc(o.note)));
    return { node: wrap, input: input, value: function () { return input.value.trim(); } };
  }
  function opts(list, first) {
    var out = first ? [first] : [];
    list.forEach(function (x) { out.push(typeof x === "string" ? [x, x] : x); });
    return out;
  }

  /* ----------------------------------------------------------- Buttons */
  function btn(label, cls, go) {
    var b = el("button", "en-btn" + (cls ? " " + cls : ""), esc(label));
    b.type = "button";
    if (go) b.addEventListener("click", go);
    return b;
  }

  /* A sheet with a title, a body and one decision. The sheet's own close
     rule treats any `.cn-btn` pressed inside it as "going somewhere", so the
     buttons here are `.en-btn`: pressing one validates, and only a success
     closes the sheet. */
  function dialog(o) {
    var box = el("div", "en-dlg" + (o.wide ? " en-wide" : ""));
    box.appendChild(el("h2", "en-dlg-h", esc(o.title)));
    if (o.sub) box.appendChild(el("p", "en-dlg-sub", o.sub));
    var host = el("div", "en-dlg-body");
    box.appendChild(host);
    var err = el("div", "en-dlg-err");
    err.hidden = true;
    box.appendChild(err);
    var acts = el("div", "en-dlg-acts");
    var sheet = null;
    var ctl = {
      close: function () { if (sheet) sheet.close(); },
      error: function (msg, blockers) {
        err.hidden = !msg;
        err.innerHTML = "";
        if (msg) err.appendChild(el("p", null, esc(msg)));
        if (blockers && blockers.length > 1) {
          var ul = el("ul");
          blockers.forEach(function (b) { ul.appendChild(el("li", null, esc(b.label))); });
          err.appendChild(ul);
        }
      }
    };
    var cancel = btn(o.cancel || "Cancel", "quiet", function () { ctl.close(); });
    acts.appendChild(cancel);
    var go = null;
    if (o.action) {
      go = btn(o.action, o.tone === "danger" ? "danger" : "strong", function () {
        ctl.error("");
        go.disabled = true;
        var out;
        try { out = o.onSubmit(ctl); } catch (e) { go.disabled = false; ctl.error(e.message); return; }
        Promise.resolve(out).then(function (ok) {
          if (ok !== false) ctl.close(); else go.disabled = false;
        }, function (e) {
          go.disabled = false;
          ctl.error(e && e.message ? e.message : "That did not work.", e && e.blockers);
        });
      });
      acts.appendChild(go);
    }
    box.appendChild(acts);
    sheet = K.cxSheet(box);
    ctl.submit = go;
    if (o.body) o.body(host, ctl);
    return ctl;
  }

  /* The server's refusal, carrying its list of blockers when it has one. */
  function wrapErr(p) {
    return p.then(null, function (e) {
      var blockers = e && e.blockers;
      throw Object.assign(e, { blockers: blockers });
    });
  }

  /* --------------------------------------------------------- Settings
     What this school asks for, read once and kept for a minute. Everything
     that lists grades, years or documents reads it from here. */
  var SET = null, SET_AT = 0;
  function settings(force) {
    if (!force && SET && Date.now() - SET_AT < 60000) return Promise.resolve(SET);
    return NS.settings().then(function (r) { SET = r.settings; SET_AT = Date.now(); return SET; });
  }

  /* What the queue remembers between visits to a record. */
  var ST = {
    tab: "applications", view: "open", year: null, q: "", grade: "", type: "", assignee: "", status: "",
    sort: "updated", dir: "desc", page: 1, size: 25, enr: "all", enrQ: "", enrPage: 1
  };
  var SELECTED = {};

  function hostView() { return document.getElementById("v-admin"); }

  /* =================================================================== Tab
     The workspace: the year, the numbers that need a person, and the four
     places work happens. */
  function tab(v) {
    var P = K.cxPage(v, "Students", "Enrollment",
      "From first enquiry to a student in a course. Every application has an owner and a next step, and every change is on its record.");
    var yearSel = el("select", "cx-select en-year");
    yearSel.setAttribute("aria-label", "School year");
    yearSel.style.minWidth = "130px";
    P.tools.appendChild(yearSel);
    P.tools.appendChild(K.cnAction("Re-enrol returning students", function () { openReenrol(function () { reload(); }); }));
    P.tools.appendChild(K.cnAction("New application", function () { openNew(); }, true));

    var node = K.loading(v, "enrollment");
    var metrics = el("div", "en-metrics");
    var tabsBar = el("div", "cn-bar en-tabs");
    var body = el("div", "en-body");
    var counts = {}, summary = null;

    function reload() { K.openAdmin(true, "enrollment"); }

    function paintMetrics() {
      metrics.innerHTML = "";
      var a = summary ? summary.applications : null, e = summary ? summary.enrollments : null;
      var go = function (view) { return function () { ST.tab = "applications"; ST.view = view; ST.page = 1; reload(); }; };
      K.cxMetrics(metrics, [
        { label: "In progress", value: counts.open != null ? counts.open : a && a.open, note: a ? a.overdue + " overdue" : "", go: go("open") },
        { label: "Documents to verify", value: counts.verify, go: go("verify") },
        { label: "Ready for a decision", value: counts.decision, go: go("decision") },
        { label: "Ready to enroll", value: counts.ready, note: counts.offers ? counts.offers + " awaiting acceptance" : "", go: go("ready") },
        { label: "Enrolled", value: e ? e.total : null, note: e && e.exceptions ? e.exceptions + " need attention" : "",
          go: function () { ST.tab = "enrolled"; reload(); } }
      ]);
      // The one number in the rail: what is waiting on a person.
      if (summary && K.railCount) {
        K.railCount("enrollment", (a.awaitingReview || 0) + (a.awaitingDecision || 0) + (a.readyToEnroll || 0) + (e.exceptions || 0));
      }
    }

    function draw() {
      tabsBar.innerHTML = "";
      var seg = el("div", "cn-seg");
      [["applications", "Applications"], ["enrolled", "Enrolled"], ["capacity", "Capacity"], ["requirements", "Requirements"]].filter(function (t) {
        // What a school asks for is changed by administrators only.
        return t[0] !== "requirements" || !summary || (summary.can && summary.can.settings);
      }).forEach(function (t) {
        var b = el("button", "cn-segb" + (ST.tab === t[0] ? " on" : ""), t[1]);
        b.type = "button";
        b.addEventListener("click", function () { ST.tab = t[0]; draw(); });
        seg.appendChild(b);
      });
      tabsBar.appendChild(seg);
      body.innerHTML = "";
      if (ST.tab === "applications") drawApplications(body, function (c) { counts = c; paintMetrics(); });
      else if (ST.tab === "enrolled") drawEnrolled(body);
      else if (ST.tab === "capacity") drawCapacity(body, summary);
      else drawRequirements(body, function () { SET = null; });
    }

    Promise.all([settings(true), NS.summary(ST.year)]).then(function (r) {
      node.remove();
      var s = r[0];
      summary = r[1];
      ST.year = ST.year || summary.year;
      s.years.forEach(function (y) {
        var o = el("option");
        o.value = y; o.textContent = yearName(y) + (y === s.currentYear ? " · current" : "");
        if (y === ST.year) o.selected = true;
        yearSel.appendChild(o);
      });
      var all = el("option"); all.value = "all"; all.textContent = "All years";
      if (ST.year === "all") all.selected = true;
      yearSel.appendChild(all);
      yearSel.addEventListener("change", function () { ST.year = yearSel.value; ST.page = 1; reload(); });
      v.appendChild(metrics);
      v.appendChild(tabsBar);
      v.appendChild(body);
      paintMetrics();
      draw();
      if (summary.synced) toast("Course placement ran for " + plural(summary.synced, "student") + " whose start day has arrived.");
    }, function (e) { K.failed(node, e, reload); });
  }

  /* ====================================================== Applications */
  var VIEWS = [
    ["mine", "My queue"], ["open", "In progress"], ["incomplete", "Needs documents"], ["verify", "To verify"],
    ["decision", "Ready to decide"], ["ready", "Ready to enroll"], ["offers", "Offers out"], ["waitlist", "Waitlist"],
    ["overdue", "Overdue"], ["closed", "Closed"], ["all", "All"]
  ];

  function drawApplications(host, onCounts) {
    var views = K.cnFilters(VIEWS.map(function (x) { return { k: x[0], name: x[1], n: "" }; }), ST.view,
      function (k) { ST.view = k; ST.page = 1; SELECTED = {}; load(); });
    views.classList.add("en-views");
    host.appendChild(views);

    var tools = el("div", "cn-bar en-tools");
    var find = el("input", "cn-search");
    find.type = "search";
    find.placeholder = "Search name, ENR number, admission number, guardian or school";
    find.value = ST.q;
    find.setAttribute("aria-label", "Search applications");
    tools.appendChild(find);
    var grade = el("select", "cx-select");
    grade.setAttribute("aria-label", "Grade");
    var type = el("select", "cx-select");
    type.setAttribute("aria-label", "Type");
    var who = el("select", "cx-select");
    who.setAttribute("aria-label", "Owner");
    var stat = el("select", "cx-select");
    stat.setAttribute("aria-label", "Status");
    [grade, type, who, stat].forEach(function (s) { s.style.minWidth = "0"; tools.appendChild(s); });
    function fill(sel, items, cur) {
      sel.innerHTML = "";
      items.forEach(function (o) {
        var op = el("option"); op.value = o[0]; op.textContent = o[1];
        if (o[0] === cur) op.selected = true;
        sel.appendChild(op);
      });
    }
    settings().then(function (s) {
      fill(grade, [["", "Any grade"]].concat(s.grades.map(function (g) { return [g.name, g.name]; })), ST.grade);
    });
    fill(type, [["", "Any type"], ["new", "New"], ["returning", "Returning"], ["transfer", "Transfer"]], ST.type);
    fill(who, [["", "Anyone"], ["me", "Assigned to me"], ["none", "Unassigned"]], ST.assignee);
    fill(stat, [["", "Any status"]].concat(Object.keys(STATUS).map(function (k) { return [k, STATUS[k][0]]; })), ST.status);
    host.appendChild(tools);

    var bulk = el("div", "en-bulk");
    bulk.hidden = true;
    host.appendChild(bulk);
    var slot = el("div", "en-slot");
    host.appendChild(slot);
    var foot = el("div", "en-pager");
    host.appendChild(foot);

    var t = null;
    find.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { ST.q = find.value.trim(); ST.page = 1; load(); }, 250);
    });
    [[grade, "grade"], [type, "type"], [who, "assignee"], [stat, "status"]].forEach(function (p) {
      p[0].addEventListener("change", function () { ST[p[1]] = p[0].value; ST.page = 1; load(); });
    });

    function selectedIds() { return Object.keys(SELECTED).filter(function (k) { return SELECTED[k]; }); }

    function paintBulk(staff) {
      var ids = selectedIds();
      bulk.hidden = !ids.length;
      bulk.innerHTML = "";
      if (!ids.length) return;
      bulk.appendChild(el("b", null, plural(ids.length, "application") + " selected"));
      var to = el("select", "cx-select");
      to.appendChild(Object.assign(el("option"), { value: "", textContent: "Choose an owner…" }));
      var me = el("option"); me.value = K.S.me.id; me.textContent = "Me (" + (K.S.me.name || "you") + ")";
      to.appendChild(me);
      staff.forEach(function (p) {
        if (p.id === K.S.me.id) return;
        var o = el("option"); o.value = p.id; o.textContent = p.name;
        to.appendChild(o);
      });
      bulk.appendChild(to);
      var due = el("input", "en-date");
      due.type = "date";
      due.setAttribute("aria-label", "Due");
      bulk.appendChild(due);
      bulk.appendChild(btn("Assign", "strong", function () {
        if (!to.value) { toast("Choose who should own them."); return; }
        NS.bulk({ ids: ids, action: "assign", to: to.value, dueOn: due.value || undefined }).then(function (r) {
          toast("Assigned " + plural(r.changed, "application") + (r.changed < ids.length ? "; " + (ids.length - r.changed) + " could not be changed." : "."));
          SELECTED = {};
          load();
        }, function (e) { toast(e.message); });
      }));
      bulk.appendChild(btn("Clear", "quiet", function () { SELECTED = {}; load(); }));
    }

    var staffCache = null;
    function staffList() {
      if (staffCache) return Promise.resolve(staffCache);
      return NS.team().then(function (l) { staffCache = l || []; return staffCache; }, function () { return []; });
    }

    var SORTS = { name: "name", grade: "grade", status: "status", progress: "progress", due: "due", updated: "updated" };

    function load() {
      slot.innerHTML = "";
      slot.appendChild(el("div", "admin-loading", "Loading applications…"));
      NS.list({ year: ST.year, view: ST.view, q: ST.q, grade: ST.grade, type: ST.type, assignee: ST.assignee,
                status: ST.status, sort: SORTS[ST.sort], dir: ST.dir, page: ST.page, size: ST.size }).then(function (r) {
        slot.innerHTML = "";
        if (onCounts) onCounts(r.counts);
        [].forEach.call(views.children, function (b) {
          var k = b.dataset.k;
          var n = r.counts[k];
          var em = b.querySelector("em");
          if (em) em.textContent = n != null ? n : "";
        });
        views.mark(ST.view);
        drawRows(r);
        staffList().then(paintBulk);
      }, function (e) { K.failed(slot, e, load); });
    }

    function drawRows(r) {
      if (!r.items.length) {
        var filtered = ST.q || ST.grade || ST.type || ST.assignee || ST.status;
        slot.appendChild(K.cnEmpty(
          filtered ? "Nothing matches." : ST.view === "mine" ? "Nothing is assigned to you." : "Nothing here.",
          filtered ? "Clear the search and filters to see the whole view."
                   : ST.view === "open" ? "Start an application to begin a student's journey into the school." : "This view is empty right now.",
          filtered ? null : "New application", filtered ? null : function () { openNew(); }));
        foot.innerHTML = "";
        return;
      }
      var t = K.cnTable([
        { label: "", w: "24px" },
        { label: "Applicant", w: "minmax(150px, 1.3fr)" },
        { label: "Grade", w: "76px" },
        { label: "Status", w: "128px" },
        { label: "Progress", w: "104px" },
        { label: "Next step", w: "minmax(140px, 1.5fr)" },
        { label: "Owner", w: "minmax(84px, .7fr)" },
        { label: "Updated", w: "78px", align: "right" }
      ]);
      t.classList.add("en-tbl");
      // Column headings that sort.
      var heads = t.querySelectorAll(".cn-th");
      [[1, "name"], [2, "grade"], [3, "status"], [4, "progress"], [7, "updated"]].forEach(function (h) {
        var c = heads[h[0]];
        c.classList.add("sort");
        if (ST.sort === h[1]) c.classList.add(ST.dir === "asc" ? "asc" : "desc");
        c.addEventListener("click", function () {
          if (ST.sort === h[1]) ST.dir = ST.dir === "asc" ? "desc" : "asc"; else { ST.sort = h[1]; ST.dir = h[1] === "name" ? "asc" : "desc"; }
          ST.page = 1;
          load();
        });
      });
      var all = el("input");
      all.type = "checkbox";
      all.setAttribute("aria-label", "Select everything on this page");
      all.checked = r.items.every(function (x) { return SELECTED[x.id]; });
      all.addEventListener("change", function () {
        r.items.forEach(function (x) { SELECTED[x.id] = all.checked; });
        load();
      });
      heads[0].appendChild(all);

      r.items.forEach(function (x) {
        var pick = el("input");
        pick.type = "checkbox";
        pick.checked = !!SELECTED[x.id];
        pick.setAttribute("aria-label", "Select " + x.name);
        pick.addEventListener("click", function (e) { e.stopPropagation(); });
        pick.addEventListener("change", function () { SELECTED[x.id] = pick.checked; staffList().then(paintBulk); });
        var who = el("span", "en-who");
        who.appendChild(K.avatarFor({ name: x.name }));
        who.appendChild(el("span", "en-who-t", "<b>" + esc(x.name) + "</b><small>" + esc(x.number) + " · " + esc(TYPES[x.type] || x.type) +
          (x.duplicates ? " · <em class='bad'>possible duplicate</em>" : "") + "</small>"));
        var prog = el("span", "en-prog");
        prog.innerHTML = "<span class='bar'><i style='width:" + x.percent + "%'></i></span><small>" + x.percent + "% · " +
          x.docs.verified + "/" + x.docs.required + " docs</small>";
        var next = x.next || {};
        var nextTxt = next.kind === "closed" ? "<span class='cn-none'>" + esc(next.label || "—") + "</span>"
          : "<span class='en-next-t " + (next.kind === "fix" ? "fix" : next.kind === "wait" ? "wait" : "go") + "'>" + esc(next.label || "") + "</span>";
        var ownerHtml = x.assignedTo ? esc(x.assignedTo.name || "Assigned") : "<span class='cn-none'>Unassigned</span>";
        var upd = "<span class='" + (x.overdue ? "en-late" : x.stalled ? "en-stalled" : "") + "'>" +
          (x.overdue ? "Overdue" : esc(ago(x.updatedAt))) + "</span>";
        var row = t.row([pick, who, esc(x.grade), chip(STATUS, x.status), prog, nextTxt, ownerHtml, upd],
          function () { openApplication(x.id); }, x.id);
        row.classList.toggle("sel", !!SELECTED[x.id]);
      });
      slot.appendChild(t);

      // Paging
      foot.innerHTML = "";
      var from = (r.page - 1) * r.size + 1, to = Math.min(r.total, r.page * r.size);
      foot.appendChild(el("span", "en-count", from + "–" + to + " of " + r.total));
      var prev = btn("Previous", "quiet", function () { ST.page--; load(); });
      var nextB = btn("Next", "quiet", function () { ST.page++; load(); });
      prev.disabled = r.page <= 1;
      nextB.disabled = to >= r.total;
      foot.appendChild(prev);
      foot.appendChild(nextB);
      var csv = btn("Export this view", "quiet", function () { exportView(r); });
      foot.appendChild(csv);
    }

    function exportView() {
      NS.list({ year: ST.year, view: ST.view, q: ST.q, grade: ST.grade, type: ST.type, assignee: ST.assignee,
                status: ST.status, sort: SORTS[ST.sort], dir: ST.dir, page: 1, size: 100 }).then(function (r) {
        K.csvDownload("applications-" + (ST.year || "all") + "-" + ST.view + ".csv",
          [["Number", "Applicant", "Grade", "Type", "Status", "Complete %", "Documents verified", "Documents required", "Next step", "Due", "Updated"]]
            .concat(r.items.map(function (x) {
              return [x.number, x.name, x.grade, TYPES[x.type] || x.type, (STATUS[x.status] || [x.status])[0], x.percent,
                      x.docs.verified, x.docs.required, (x.next || {}).label || "", x.dueOn || "", new Date(x.updatedAt).toISOString().slice(0, 10)];
            })));
        if (r.total > r.items.length) toast("Exported the first " + r.items.length + " of " + r.total + ". Narrow the view to export the rest.");
      }, function (e) { toast(e.message); });
    }

    load();
  }

  /* ================================================================= New
     Before anyone is made, ask whether they are already here. A student
     enrolled last year is one person with a new year, not a second person
     with the same name. */
  function openNew(preset) {
    K.enter("enr-new", "New application", function () { openNew(preset); });
    var v = hostView();
    v.innerHTML = "";
    var back = btn("← Enrollment", "back", function () { K.goBack(); });
    back.className = "cn-back en-back";
    v.appendChild(back);
    K.consoleHead(v, "Enrollment", "New application",
      "Say who the student is first. If the school already knows them, this year becomes a new year for the same person.");

    var box = el("div", "en-new");
    v.appendChild(box);
    var first = fld("text", "Legal first name", preset && preset.first, { req: true, max: 80 });
    var last = fld("text", "Legal last name", preset && preset.last, { req: !!!(window.OPLO_LOCALE && window.OPLO_LOCALE.active()), max: 80, hint: !!(window.OPLO_LOCALE && window.OPLO_LOCALE.active()) ? "Leave empty for a single name" : "" });
    var dob = fld("date", "Date of birth", preset && preset.dob);
    var email = fld("email", "A parent or guardian's email", "", { hint: "Optional — helps find brothers and sisters" });
    var phone = fld("text", "Or their phone number", "", { hint: "Optional" });
    var who = el("div", "en-form-grid");
    [first, last, dob, email, phone].forEach(function (f) { who.appendChild(f.node); });
    box.appendChild(who);

    var found = el("div", "en-found");
    box.appendChild(found);
    var year = fld("select", "School year", "", { options: [] });
    var grade = fld("select", "Grade applying to", "", { options: [], req: true });
    var type = fld("select", "Application type", "new", {
      options: [["new", "New to the school"], ["transfer", "Transferring from another school"], ["returning", "Returning student"]] });
    var start = fld("date", "Intended joining date", "");
    var when = el("div", "en-form-grid");
    [year, grade, type, start].forEach(function (f) { when.appendChild(f.node); });
    box.appendChild(el("h2", "cn-h2", "Where and when"));
    box.appendChild(when);

    settings().then(function (s) {
      opts(s.years.map(function (y) { return [y, yearName(y)]; })).forEach(function (o) {
        var op = el("option"); op.value = o[0]; op.textContent = o[1];
        year.input.appendChild(op);
      });
      year.input.value = (ST.year && ST.year !== "all" ? ST.year : s.currentYear);
      s.grades.forEach(function (g) {
        var op = el("option"); op.value = g.name; op.textContent = g.name;
        grade.input.appendChild(op);
      });
      grade.input.value = preset && preset.grade ? preset.grade : (ST.grade || s.grades[Math.min(2, s.grades.length - 1)].name);
    });

    var picked = null;
    var timer = null;
    function search() {
      var f = first.value(), l = last.value();
      if (f.length < 2 && l.length < 2 && !email.value() && !phone.value()) { found.innerHTML = ""; return; }
      NS.lookup({ first: f, last: l, dob: dob.value(), email: email.value(), phone: phone.value() }).then(function (r) {
        found.innerHTML = "";
        if (!r.matches.length && !r.siblings.length) {
          if (f && l) found.appendChild(el("p", "en-ok", "Nobody with that name is on file. This will be a new student."));
          return;
        }
        if (r.matches.length) {
          found.appendChild(el("h2", "cn-h2", "Already known to the school"));
          r.matches.forEach(function (m) { found.appendChild(matchRow(m)); });
        }
        if (r.siblings.length) {
          found.appendChild(el("p", "en-sib", "<b>Family already here:</b> " +
            esc(r.siblings.map(function (s) { return s.name + (s.grade ? " (" + s.grade + ")" : ""); }).join(", "))));
        }
      }, function () { found.innerHTML = ""; });
    }
    function matchRow(m) {
      var row = el("div", "en-match en-" + m.strength);
      var last = m.last ? " · last " + yearName(m.last.year) + ", " + m.last.grade + " (" + m.last.state + ")" : "";
      row.appendChild(el("div", "en-match-t", "<b>" + esc(m.name) + "</b><small>" +
        esc(m.reason) + (m.dob ? " · born " + esc(day(m.dob)) : "") + esc(last) +
        (m.kind === "application" ? " · " + esc(m.number) + ", " + esc((STATUS[m.status] || [m.status])[0]) : "") + "</small>"));
      var acts = el("div", "en-match-acts");
      if (m.kind === "student") {
        acts.appendChild(btn("Re-enrol this student", "strong", function () {
          picked = m;
          start_({ studentId: m.id });
        }));
      } else {
        acts.appendChild(btn("Open " + m.number, "", function () { openApplication(m.id); }));
      }
      row.appendChild(acts);
      return row;
    }
    [first, last, dob, email, phone].forEach(function (f) {
      f.input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(search, 300); });
    });

    var key = "new-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    var err = el("p", "en-dlg-err");
    err.hidden = true;
    var acts = el("div", "en-page-acts");
    var make = btn("Start the application", "strong", function () { start_(); });
    acts.appendChild(make);
    acts.appendChild(btn("Cancel", "quiet", function () { K.goBack(); }));
    box.appendChild(err);
    box.appendChild(acts);

    function start_(extra) {
      err.hidden = true;
      var body = {
        clientKey: key, grade: grade.value(), schoolYear: year.value(), type: type.value(),
        intendedStart: start.value() || undefined,
        student: { legalFirst: first.value(), legalLast: last.value(), dob: dob.value() || undefined },
        assignTo: "me"
      };
      if (extra && extra.studentId) { body.studentId = extra.studentId; body.type = "returning"; delete body.grade; }
      else {
        if (!first.value() || (!last.value() && !!!(window.OPLO_LOCALE && window.OPLO_LOCALE.active()))) { err.hidden = false; err.textContent = "The student's legal first and last name are required."; return; }
        var guardian = email.value() || phone.value();
        if (guardian) body.form = { guardians: [{ name: "", email: email.value(), phone: phone.value() }] };
      }
      make.disabled = true;
      NS.create(body).then(function (r) {
        toast(r.existing ? "That application was already started." : "Application " + r.application.number + " started.");
        openApplication(r.application.id, "application", true);
      }, function (e) {
        make.disabled = false;
        err.hidden = false;
        err.textContent = e.message;
      });
    }
    K.show("admin");
  }

  /* ==================================================== Re-enrol */
  function openReenrol(done) {
    settings().then(function (s) {
      var years = s.years.filter(function (y) { return y > s.years[0]; });
      if (!years.length) { toast("Add a later school year in Requirements first."); return; }
      var to = fld("select", "Enrol for", years.indexOf(s.currentYear) > -1 ? years[0] : years[0],
        { options: years.map(function (y) { return [y, yearName(y)]; }) });
      var from = el("p", "en-note");
      function says() {
        var p = (+to.input.value.slice(0, 4) - 1) + "-" + (+to.input.value.slice(5) - 1);
        from.innerHTML = "One application for each student enrolled in <b>" + esc(yearName(p)) + "</b>, in the next grade up, " +
          "carrying what the family already told us. A student already enrolled or already applying is skipped, and " +
          "nothing is submitted for them.";
      }
      dialog({
        title: "Re-enrol returning students", sub: "Next year, for the students who are here this year.",
        action: "Create the applications",
        body: function (host) { host.appendChild(to.node); host.appendChild(from); says(); to.input.addEventListener("change", says); },
        onSubmit: function () {
          return NS.reenrol({ toYear: to.input.value }).then(function (r) {
            toast(r.created.length ? "Made " + plural(r.created.length, "application") + " for " + yearName(r.toYear) +
              (r.skipped.length ? "; skipped " + r.skipped.length + "." : ".") : "Nothing to create — " + plural(r.skipped.length, "student") + " already done or at the last grade.");
            ST.year = r.toYear; ST.view = "open"; ST.tab = "applications";
            if (done) done();
          });
        }
      });
    });
  }

  /* =========================================================== Record
     One application, whole. */
  function openApplication(id, tabName, replace) {
    K.enter("enr-app:" + id, "Application", function () { openApplication(id, tabName); }, replace);
    var v = hostView();
    v.innerHTML = "";
    var node = K.loading(v, "the application");
    var cur = { tab: tabName || "application" };
    var prevScroll = 0;

    function fetchAndDraw() {
      Promise.all([NS.get(id), settings()]).then(function (r) {
        node.remove();
        draw(r[0]);
      }, function (e) { K.failed(node, e, fetchAndDraw); });
    }

    function draw(a) {
      v.innerHTML = "";
      var back = btn("← Enrollment", "back", function () { K.goBack(); });
      back.className = "cn-back en-back";
      v.appendChild(back);
      drawHead(v, a);
      drawStepper(v, a);
      drawNext(v, a);
      var tabs = [["application", "Application"], ["documents", "Documents", docBadge(a)], ["review", "Review"], ["history", "History", a.events.length]];
      var bar = el("div", "en-tabbar");
      tabs.forEach(function (t) {
        var b = el("button", "en-tabb" + (cur.tab === t[0] ? " on" : ""), esc(t[1]) + (t[2] ? " <em>" + esc(t[2]) + "</em>" : ""));
        b.type = "button";
        b.addEventListener("click", function () { cur.tab = t[0]; draw(a); });
        bar.appendChild(b);
      });
      v.appendChild(bar);
      var pane = el("div", "en-pane");
      v.appendChild(pane);
      if (cur.tab === "application") drawFormTab(pane, a, set);
      else if (cur.tab === "documents") drawDocs(pane, a, set);
      else if (cur.tab === "review") drawReview(pane, a, set, go);
      else drawHistory(pane, a);
      K.show("admin");
      if (prevScroll) window.scrollTo(0, prevScroll);
      prevScroll = 0;
    }
    function set(a, keepScroll) {
      if (keepScroll !== false) prevScroll = window.pageYOffset;
      draw(a);
    }
    function go(tabName2) { cur.tab = tabName2; }
    cur.go = function (t) { cur.tab = t; fetchAndDraw(); };
    cur.set = set;
    APP_CTX = cur;
    fetchAndDraw();
    K.show("admin");
  }
  var APP_CTX = null;

  function docBadge(a) {
    var o = a.documents.filter(function (d) { return d.required && d.status !== "verified" && d.status !== "waived"; }).length;
    return o || "";
  }

  /* ------------------------------------------------------------ Header */
  function drawHead(v, a) {
    var h = el("header", "cn-head en-head");
    h.appendChild(el("p", "cn-eyebrow", esc(a.number) + " · " + esc(TYPES[a.type] || a.type) + " · " + esc(yearName(a.schoolYear))));
    var title = a.student.name || "Unnamed applicant";
    h.appendChild(el("h1", "cn-h1", esc(title) + (a.student.preferredName ? " <span class='en-pref'>“" + esc(a.student.preferredName) + "”</span>" : "")));
    h.appendChild(el("p", "cn-sub", esc(a.grade) + (a.intendedStart ? " · joining " + esc(day(a.intendedStart)) : "") +
      (a.student.admissionNo ? " · admission " + esc(a.student.admissionNo) : "")));
    var meta = el("div", "en-meta");
    meta.appendChild(el("span", null, chip(STATUS, a.status)));
    var cc = a.evaluation.percent;
    meta.appendChild(el("span", "en-metaitem", "<b>" + cc + "%</b> complete"));
    if (a.assignedTo !== undefined) {
      meta.appendChild(el("span", "en-metaitem", a.assignedTo ? "Owner <b>" + esc(a.assignedTo.name || "—") + "</b>" : "<em>Unassigned</em>"));
    }
    if (a.dueOn && a.evaluation) meta.appendChild(el("span", "en-metaitem", "Due <b>" + esc(day(a.dueOn)) + "</b>"));
    if (a.enrollmentId) meta.appendChild(el("span", "en-metaitem", "<b>Enrolled</b>"));
    h.appendChild(meta);
    v.appendChild(h);
  }

  function drawStepper(v, a) {
    var ol = el("ol", "en-steps");
    a.evaluation.stages.forEach(function (s, i) {
      var cls = s.state + (a.evaluation.current === s.key ? " current" : "");
      var li = el("li", "en-step " + cls, "<i>" + (s.state === "done" ? "✓" : String(i + 1)) + "</i><b>" + esc(s.label) + "</b><small>" + esc(s.note || "") + "</small>");
      ol.appendChild(li);
    });
    v.appendChild(ol);
  }

  /* "What is stopping this one?" — in words, with the button beside it. */
  function gateFor(a) {
    var g = a.evaluation.gates;
    return ({ draft: g.submit, changes_requested: g.submit, submitted: g.review, incomplete: g.review,
              under_review: g.decision, awaiting_decision: g.approve, admitted: g.activate })[a.status] || [];
  }

  function drawNext(v, a) {
    var ev = a.evaluation, nx = ev.next || {}, can = a.can;
    var card = el("section", "en-next " + (nx.kind || ""));
    var left = el("div", "en-next-l");
    left.appendChild(el("p", "en-eyebrow", a.enrollmentId ? "Enrolled" : "What happens next"));
    var head = el("h2");
    if (nx.blocker && nx.kind === "fix") {
      var hl = el("button", "en-blk en-blk-h", esc(nx.label));
      hl.type = "button";
      hl.addEventListener("click", function () { fixBlocker(a, nx.blocker); });
      head.appendChild(hl);
    } else head.textContent = nx.label || (a.enrollmentId ? "This student is enrolled." : "Nothing is waiting.");
    left.appendChild(head);
    var blockers = gateFor(a).slice(nx.blocker && nx.kind === "fix" ? 1 : 0, 9);
    if (blockers.length && nx.kind !== "action") {
      var ul = el("ul", "en-blockers");
      blockers.forEach(function (b) {
        var li = el("li", b.soft ? "soft" : "");
        var link = el("button", "en-blk", esc(b.label));
        link.type = "button";
        link.addEventListener("click", function () { fixBlocker(a, b); });
        li.appendChild(link);
        ul.appendChild(li);
      });
      left.appendChild(ul);
    }
    card.appendChild(left);
    var right = el("div", "en-next-r");
    primaryAction(a).forEach(function (b) { right.appendChild(b); });
    card.appendChild(right);
    v.appendChild(card);
  }

  function fixBlocker(a, b) {
    var tabFor = { fields: "application", received: "documents", verified: "documents", checks: "review", dups: "review", corrections: "application",
                   seats: "review", age: "review", acceptance: "review", start: "review", identity: "review" };
    if (b.kind === "seats" || b.kind === "age") { decide(a, "approve"); return; }
    if (b.kind === "start" || b.kind === "identity") { activate(a); return; }
    if (b.kind === "acceptance") { acceptance(a); return; }
    APP_CTX.go(tabFor[b.kind] || "application");
  }

  /* The buttons for what this application can have done to it right now, by
     what the person is allowed to do. */
  function primaryAction(a) {
    var out = [], can = a.can, nx = (a.evaluation.next || {});
    function refresh(r) { APP_CTX.set(r.application); }
    function run(action, data, ok) {
      return NS.act(a.id, action, data).then(function (r) { refresh(r); if (ok) toast(ok); return r; }, function (e) { toast(e.message); throw e; });
    }
    if (a.enrollmentId) {
      out.push(btn("Open the enrollment", "strong", function () { openEnrollmentFor(a); }));
      return out;
    }
    var st = a.status;
    var asks = nx.action;
    function need(role) { return el("span", "en-need", "Needs " + role); }
    if ((st === "draft" || st === "changes_requested") && (can.edit || can.family)) {
      out.push(btn(st === "draft" ? "Submit application" : "Send corrections back", "strong", function () {
        run(st === "draft" ? "submit" : "resubmit", {}, "Submitted.");
      }));
    }
    if ((st === "submitted" || st === "incomplete") && asks === "start_review") {
      out.push(can.verify ? btn("Start review", "strong", function () { run("start_review", {}, "Review started."); }) : need("the registrar"));
    }
    if (st === "under_review" && asks === "mark_ready") {
      out.push(can.verify ? btn("Ready for a decision", "strong", function () { run("mark_ready", {}, "Marked ready for a decision."); }) : need("the registrar"));
    }
    if (st === "awaiting_decision") {
      out.push(can.decide ? btn("Decide…", "strong", function () { decide(a, "approve"); }) : need("an admissions reviewer"));
    }
    if (st === "admitted") {
      if (a.acceptance === "pending") {
        out.push(btn("Record acceptance", "strong", function () { acceptance(a); }));
      } else {
        out.push(can.activate ? btn("Enroll student…", "strong", function () { activate(a); }) : need("the registrar"));
      }
    }
    if (st === "waitlisted" && can.decide) out.push(btn("Reconsider…", "strong", function () { decide(a, "reconsider"); }));
    if ((st === "rejected" || st === "withdrawn") && can.decide) out.push(btn("Reopen…", "", function () { decide(a, "reopen"); }));
    if (can.edit && ["draft", "submitted", "incomplete", "under_review", "changes_requested", "awaiting_decision", "waitlisted", "admitted"].indexOf(st) > -1) {
      out.push(btn("More ▾", "quiet", function (e) { moreMenu(a, e.currentTarget); }));
    }
    return out;
  }

  function moreMenu(a, anchor) {
    var items = [];
    var st = a.status;
    if (a.can.verify && ["submitted", "incomplete", "under_review", "awaiting_decision"].indexOf(st) > -1) {
      items.push(["Request corrections…", function () { askCorrections(a); }]);
    }
    if (a.can.decide && ["under_review", "awaiting_decision"].indexOf(st) > -1) items.push(["Place on the waitlist…", function () { decide(a, "waitlist"); }]);
    if (a.can.decide && ["submitted", "incomplete", "under_review", "awaiting_decision", "waitlisted"].indexOf(st) > -1) {
      items.push(["Decline application…", function () { decide(a, "reject"); }]);
    }
    items.push(["Assign owner…", function () { assign(a); }]);
    items.push(["Add a note…", function () { addNote(a); }]);
    items.push(["Print summary", function () { printSummary(a); }]);
    items.push(["Withdraw application…", function () { withdraw(a); }]);
    var m = el("div", "en-menu");
    items.forEach(function (it) {
      var b = el("button", "en-menu-i", esc(it[0]));
      b.type = "button";
      b.addEventListener("click", function () { close(); it[1](); });
      m.appendChild(b);
    });
    var r = anchor.getBoundingClientRect();
    m.style.top = (r.bottom + window.scrollY + 6) + "px";
    m.style.left = Math.max(12, r.right + window.scrollX - 230) + "px";
    document.body.appendChild(m);
    function close() { document.removeEventListener("mousedown", away, true); if (m.parentNode) m.parentNode.removeChild(m); }
    function away(e) { if (!m.contains(e.target)) close(); }
    setTimeout(function () { document.addEventListener("mousedown", away, true); }, 0);
  }

  /* ------------------------------------------------------- Application */
  var RELATIONSHIPS = ["Mother", "Father", "Guardian", "Grandparent", "Foster parent", "Aunt or uncle", "Sibling", "Other"];

  function drawFormTab(pane, a, set) {
    var editable = a.can.edit ? a.status !== "rejected" && a.status !== "withdrawn" && !a.enrollmentId
      : a.can.family && (a.status === "draft" || a.status === "changes_requested");
    var f = a.form || {};
    var stu = f.student || {}, con = f.contact || {}, prev = f.previous || {}, em = f.emergency || {}, sup = f.support;
    var dirty = false;
    var bar = el("div", "en-savebar");
    bar.hidden = true;
    function touch() { if (!dirty) { dirty = true; bar.hidden = false; } }

    // Corrections the school asked for, first — they are what to do.
    var open = (a.corrections || []).filter(function (c) { return !c.resolved; });
    if (open.length) {
      var cc = el("section", "en-corr");
      cc.appendChild(el("h3", null, "Corrections asked for"));
      var ul = el("ul");
      open.forEach(function (c) { ul.appendChild(el("li", null, esc(c.message))); });
      cc.appendChild(ul);
      pane.appendChild(cc);
    }

    var gradeOpts = (SET ? SET.grades.map(function (g) { return [g.name, g.name]; }) : [[a.grade, a.grade]]);
    var yearOpts = (SET ? SET.years.map(function (y) { return [y, yearName(y)]; }) : [[a.schoolYear, yearName(a.schoolYear)]]);
    var X = {
      first: fld("text", "Legal first name", a.student.legalFirst, { req: true, disabled: !editable, max: 80 }),
      last: fld("text", "Legal last name", a.student.legalLast, { req: !!!(window.OPLO_LOCALE && window.OPLO_LOCALE.active()), disabled: !editable, max: 80 }),
      pref: fld("text", "Preferred name", a.student.preferredName, { disabled: !editable, max: 80 }),
      dob: fld("date", "Date of birth", a.student.dob, { req: true, disabled: !editable }),
      gender: fld("select", "Gender", stu.gender || "", { disabled: !editable,
        options: [["", "—"], ["Female", "Female"], ["Male", "Male"], ["Non-binary", "Non-binary"], ["Prefer not to say", "Prefer not to say"]] }),
      lang: fld("text", "Home language", stu.language || "", { disabled: !editable, max: 60 }),
      grade: fld("select", "Grade applied to", a.grade, { req: true, disabled: !editable, options: gradeOpts }),
      year: fld("select", "School year", a.schoolYear, { disabled: !editable, options: yearOpts }),
      type: fld("select", "Application type", a.type, { disabled: !editable,
        options: [["new", "New to the school"], ["transfer", "Transferring from another school"], ["returning", "Returning student"]] }),
      start: fld("date", "Intended joining date", a.intendedStart, { req: true, disabled: !editable }),
      addr: fld("area", "Residential address", con.address, { req: true, disabled: !editable, rows: 2, max: 400 }),
      corr: fld("area", "Correspondence address", con.correspondence, { disabled: !editable, rows: 2, max: 400, hint: "If different" }),
      phone: fld("text", "Home phone", con.phone, { disabled: !editable, max: 40 }),
      clang: fld("text", "Preferred language for the school's messages", con.language, { disabled: !editable, max: 60 }),
      channel: fld("select", "Preferred channel", con.channel || "", { disabled: !editable,
        options: [["", "No preference"], ["email", "Email"], ["phone", "Phone call"], ["sms", "Text message"]] }),
      eName: fld("text", "Emergency contact", em.name, { disabled: !editable, max: 120 }),
      eRel: fld("text", "Relationship", em.relationship, { disabled: !editable, max: 40 }),
      ePhone: fld("text", "Phone", em.phone, { disabled: !editable, max: 40 }),
      pSchool: fld("text", "Previous school", prev.school, { disabled: !editable, req: a.type === "transfer", max: 160 }),
      pLoc: fld("text", "Location", prev.location, { disabled: !editable, max: 120 }),
      pBoard: fld("text", "Board or curriculum", prev.board, { disabled: !editable, max: 80 }),
      pGrade: fld("text", "Last grade completed", prev.lastGrade, { disabled: !editable, max: 40 }),
      pYear: fld("text", "Last year attended", prev.lastYear, { disabled: !editable, max: 20, hint: "2025–26" }),
      pTc: fld("text", "Transfer certificate number", prev.tcNumber, { disabled: !editable, max: 60 }),
      pWhy: fld("text", "Reason for leaving", prev.reason, { disabled: !editable, max: 240 })
    };
    Object.keys(X).forEach(function (k) {
      X[k].input.addEventListener("input", touch);
      X[k].input.addEventListener("change", touch);
    });

    function block(title, note, nodes, cls) {
      var s = el("section", "en-block");
      s.appendChild(el("header", "en-block-h", "<h3>" + esc(title) + "</h3>" + (note ? "<p>" + esc(note) + "</p>" : "")));
      var g = el("div", "en-form-grid" + (cls ? " " + cls : ""));
      nodes.forEach(function (n) { g.appendChild(n.node || n); });
      s.appendChild(g);
      pane.appendChild(s);
      return s;
    }

    block("The student", "As it appears on their birth certificate or other legal document.",
      [X.first, X.last, X.pref, X.dob, X.gender, X.lang]);
    block("Applying for", null, [X.year, X.grade, X.type, X.start]);

    // Parents and guardians
    var guardians = ((f.guardians || []).length ? f.guardians : [{ name: "", relationship: "", phone: "", email: "", primary: true }]).map(function (g) {
      return { name: g.name || "", relationship: g.relationship || "", phone: g.phone || "", email: g.email || "", address: g.address || "",
               primary: !!g.primary, emergency: !!g.emergency, pickup: !!g.pickup };
    });
    var gsec = el("section", "en-block");
    gsec.appendChild(el("header", "en-block-h", "<h3>Parents and guardians</h3><p>At least one, with a phone number or an email. The primary contact is who the school writes to first.</p>"));
    var glist = el("div", "en-guardians");
    gsec.appendChild(glist);
    var dl = el("datalist");
    dl.id = "en-rel";
    RELATIONSHIPS.forEach(function (r) { var o = el("option"); o.value = r; dl.appendChild(o); });
    gsec.appendChild(dl);
    function drawGuardians() {
      glist.innerHTML = "";
      guardians.forEach(function (g, i) {
        var row = el("div", "en-guardian");
        var n = fld("text", "Name", g.name, { disabled: !editable, max: 120 });
        var rel = fld("text", "Relationship", g.relationship, { disabled: !editable, list: "en-rel", max: 40 });
        var ph = fld("text", "Phone", g.phone, { disabled: !editable, max: 40 });
        var em2 = fld("email", "Email", g.email, { disabled: !editable, max: 320 });
        [[n, "name"], [rel, "relationship"], [ph, "phone"], [em2, "email"]].forEach(function (p) {
          p[0].input.addEventListener("input", function () { g[p[1]] = p[0].input.value; touch(); });
          row.appendChild(p[0].node);
        });
        var side = el("div", "en-guardian-side");
        var pr = el("label", "en-radio");
        var rd = el("input");
        rd.type = "radio"; rd.name = "en-primary"; rd.checked = !!g.primary; rd.disabled = !editable;
        rd.addEventListener("change", function () { guardians.forEach(function (x) { x.primary = false; }); g.primary = true; touch(); });
        pr.appendChild(rd); pr.appendChild(el("span", null, "Primary"));
        side.appendChild(pr);
        if (editable && guardians.length > 1) {
          side.appendChild(btn("Remove", "quiet small", function () {
            guardians.splice(i, 1);
            if (!guardians.some(function (x) { return x.primary; })) guardians[0].primary = true;
            touch(); drawGuardians();
          }));
        }
        row.appendChild(side);
        glist.appendChild(row);
      });
      if (editable && guardians.length < 6) {
        glist.appendChild(btn("Add a parent or guardian", "quiet", function () {
          guardians.push({ name: "", relationship: "", phone: "", email: "", primary: false }); touch(); drawGuardians();
        }));
      }
    }
    drawGuardians();
    pane.appendChild(gsec);

    block("Contact", "Where the family lives, and how the school should reach them.", [X.addr, X.corr, X.phone, X.clang, X.channel]);
    block("Emergency contact", "Somebody to call if the parents cannot be reached.", [X.eName, X.eRel, X.ePhone]);
    block("Educational background", "Where the student has been, and what they completed.",
      [X.pSchool, X.pLoc, X.pBoard, X.pGrade, X.pYear, X.pTc, X.pWhy]);

    // Restricted information
    var support = null;
    if (sup !== undefined && (a.can.sensitive || a.can.family)) {
      support = fld("area", "Support or accessibility needs", sup && sup.notes, { rows: 3, disabled: !editable, max: 2000 });
      var rs = block("Restricted", "Only administrators can read this. It is never shown to teachers or in lists, and it is collected only because the family chose to share it.", [support]);
      rs.classList.add("restricted");
      support.input.addEventListener("input", touch);
    } else if (editable && (a.can.sensitive || a.can.family)) {
      support = fld("area", "Support or accessibility needs (optional)", "", { rows: 3, max: 2000 });
      var rs2 = block("Restricted", "Only administrators can read this. Share only what the school needs to prepare a place.", [support]);
      rs2.classList.add("restricted");
      support.input.addEventListener("input", touch);
    }

    // Consent
    var consent = a.consent || {};
    var csec = el("section", "en-block");
    csec.appendChild(el("header", "en-block-h", "<h3>Consent</h3><p>Policy version " + esc(consent.version || "") + "</p>"));
    var accepted = !!consent.current;
    var ck = el("input");
    ck.type = "checkbox"; ck.checked = accepted; ck.disabled = !editable || accepted;
    var lab = el("label", "en-consent");
    lab.appendChild(ck);
    lab.appendChild(el("span", null, esc(consent.statement || "")));
    csec.appendChild(lab);
    if (accepted) csec.appendChild(el("p", "en-note", "Accepted. The policy version and the moment are on the record."));
    ck.addEventListener("change", touch);
    pane.appendChild(csec);

    if (editable) {
      bar.appendChild(el("span", null, "You have unsaved changes."));
      var discard = btn("Discard", "quiet", function () { set(a, false); });
      var save = btn("Save", "strong", function () {
        save.disabled = true;
        var form = {
          student: { gender: X.gender.value(), language: X.lang.value() },
          guardians: guardians,
          contact: { address: X.addr.value(), correspondence: X.corr.value(), phone: X.phone.value(), language: X.clang.value(), channel: X.channel.value() },
          emergency: { name: X.eName.value(), relationship: X.eRel.value(), phone: X.ePhone.value() },
          previous: { school: X.pSchool.value(), location: X.pLoc.value(), board: X.pBoard.value(), lastGrade: X.pGrade.value(),
                      lastYear: X.pYear.value(), tcNumber: X.pTc.value(), reason: X.pWhy.value() }
        };
        if (support) form.support = { notes: support.value() };
        var body = {
          ifUpdatedAt: a.updatedAt,
          student: { legalFirst: X.first.value(), legalLast: X.last.value(), preferredName: X.pref.value(), dob: X.dob.value() },
          grade: X.grade.value(), schoolYear: X.year.value(), type: X.type.value(), intendedStart: X.start.value(), form: form
        };
        if (ck.checked && !accepted) body.consent = true;
        NS.update(a.id, body).then(function (r) { toast("Saved."); set(r.application, false); }, function (e) {
          save.disabled = false;
          toast(e.message);
        });
      });
      bar.appendChild(discard);
      bar.appendChild(save);
      pane.appendChild(bar);
    } else if (!a.enrollmentId) {
      pane.appendChild(el("p", "en-note", a.can.family
        ? "This application has been sent to the school. If something needs correcting, they will ask."
        : "This application is closed, so its details are fixed. Reopen it to change them."));
    }
  }

  /* --------------------------------------------------------- Documents */
  function drawDocs(pane, a, set) {
    var closed = a.enrollmentId || a.status === "rejected" || a.status === "withdrawn";
    pane.appendChild(el("p", "en-note", "A file that has been attached is only received. A document is verified when a person has looked at it " +
      "and says it is genuine and right — until then the application cannot move to a decision."));
    if (!a.documents.length) {
      pane.appendChild(K.cnEmpty("No documents are asked for.", "This school asks nothing of a " + (TYPES[a.type] || a.type).toLowerCase() + " application to " + a.grade + "."));
      return;
    }
    var list = el("div", "en-docs");
    a.documents.forEach(function (d) {
      var row = el("div", "en-doc en-" + (DOC_STATUS[d.status] || ["", "muted"])[1]);
      var main = el("div", "en-doc-main");
      main.appendChild(el("b", null, esc(d.label)));
      main.appendChild(el("small", null, (d.required ? "Required" : "Optional") + (d.sensitive ? " · restricted" : "") +
        (d.hint ? " · " + esc(d.hint) : "")));
      if (d.note) main.appendChild(el("p", "en-doc-note", esc(d.note)));
      row.appendChild(main);
      row.appendChild(el("div", "en-doc-st", chip(DOC_STATUS, d.status) +
        (d.reviewedByName && (d.status === "verified" || d.status === "returned" || d.status === "waived")
          ? "<small>" + esc(d.reviewedByName) + (d.reviewedAt ? " · " + esc(ago(d.reviewedAt)) : "") + "</small>"
          : d.receivedAt && d.status === "received" ? "<small>" + esc(ago(d.receivedAt)) + "</small>" : "")));
      var file = el("div", "en-doc-file");
      if (d.restricted) file.appendChild(el("small", null, "Restricted"));
      else if (d.file) {
        file.appendChild(el("span", null, esc(d.file.name) + " <small>" + kb(d.file.size) + "</small>"));
        file.appendChild(btn("View", "quiet small", function () { viewFile(a, d); }));
      } else file.appendChild(el("small", null, d.status === "received" || d.status === "verified" ? "Seen in person" : "No file"));
      row.appendChild(file);

      var acts = el("div", "en-doc-acts");
      if (!closed) {
        if (!d.restricted || a.can.sensitive) {
          var pick = el("input");
          pick.type = "file"; pick.accept = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"; pick.hidden = true;
          pick.addEventListener("change", function () { if (pick.files[0]) upload(a, d, pick.files[0], set); });
          acts.appendChild(pick);
          acts.appendChild(btn(d.file ? "Replace file" : "Attach file", "quiet small", function () { pick.click(); }));
        }
        if (a.can.edit && !d.file && d.status === "missing") {
          acts.appendChild(btn("Mark received", "quiet small", function () {
            NS.putDocument(a.id, d.key, { status: "received" }).then(function (r) { set(r.application); }, function (e) { toast(e.message); });
          }));
        }
        if (a.can.verify && (!d.restricted || a.can.sensitive)) {
          if (d.status === "received") {
            acts.appendChild(btn("Verify", "strong small", function () { verify(a, d, set); }));
            acts.appendChild(btn("Return…", "quiet small", function () { returnDoc(a, d, set); }));
          }
          if (d.status === "verified") acts.appendChild(btn("Undo", "quiet small", function () {
            NS.putDocument(a.id, d.key, { status: "received" }).then(function (r) { set(r.application); }, function (e) { toast(e.message); });
          }));
          if (d.status !== "waived" && d.status !== "verified") acts.appendChild(btn("Waive…", "quiet small", function () { waive(a, d, set); }));
        }
      }
      row.appendChild(acts);
      list.appendChild(row);
    });
    pane.appendChild(list);
  }

  function upload(a, d, file, set) {
    if (file.size > 700 * 1024) {
      toast(file.name + " is " + kb(file.size) + ". The limit is 700 KB — scan at a lower resolution, or save it as a PDF.");
      return;
    }
    var rd = new FileReader();
    rd.onload = function () {
      var s = String(rd.result), data = s.slice(s.indexOf(",") + 1);
      var type = file.type || (/\.pdf$/i.test(file.name) ? "application/pdf" : "");
      NS.uploadFile(a.id, d.key, { name: file.name, type: type, data: data }).then(function (r) {
        toast(d.label + " received."); set(r.application);
      }, function (e) { toast(e.message); });
    };
    rd.onerror = function () { toast("That file could not be read."); };
    rd.readAsDataURL(file);
  }

  function viewFile(a, d) {
    NS.getFile(a.id, d.key).then(function (f) {
      var bin = atob(f.data), n = bin.length, bytes = new Uint8Array(n);
      for (var i = 0; i < n; i++) bytes[i] = bin.charCodeAt(i);
      var url = URL.createObjectURL(new Blob([bytes], { type: f.type }));
      var box = el("div", "en-dlg en-wide");
      box.appendChild(el("h2", "en-dlg-h", esc(d.label)));
      box.appendChild(el("p", "en-dlg-sub", esc(f.name) + " · " + kb(f.size)));
      var view = el("div", "en-viewer");
      if (/^image\/(png|jpe?g|webp)$/.test(f.type)) {
        var img = el("img"); img.src = url; img.alt = d.label; view.appendChild(img);
      } else if (f.type === "application/pdf") {
        var fr = el("iframe"); fr.src = url; fr.title = d.label; view.appendChild(fr);
      } else view.appendChild(el("p", "en-note", "This file type cannot be previewed here."));
      box.appendChild(view);
      var acts = el("div", "en-dlg-acts");
      var dl = el("a", "en-btn", "Download");
      dl.href = url; dl.download = f.name;
      acts.appendChild(dl);
      box.appendChild(acts);
      K.cxSheet(box);
      setTimeout(function () { URL.revokeObjectURL(url); }, 300000);
    }, function (e) { toast(e.message); });
  }

  function verify(a, d, set) {
    NS.putDocument(a.id, d.key, { status: "verified", sighted: !d.file }).then(function (r) {
      toast(d.label + " verified."); set(r.application);
    }, function (e) { toast(e.message); });
  }

  function returnDoc(a, d, set) {
    var why = fld("area", "What is wrong with it?", "", { rows: 3, req: true, hint: "The family will read this. Be specific: “Photo is too dark to read”" });
    dialog({
      title: "Return " + d.label, sub: "The family is asked to send it again, and the application waits on it.",
      action: "Return it", body: function (h) { h.appendChild(why.node); },
      onSubmit: function () {
        if (!why.value()) throw new Error("Say what is wrong with it.");
        return NS.putDocument(a.id, d.key, { status: "returned", note: why.value() }).then(function (r) { set(r.application); });
      }
    });
  }

  function waive(a, d, set) {
    var why = fld("text", "Why is it not needed?", "", { req: true, hint: "e.g. Held on file from last year" });
    dialog({
      title: "Waive " + d.label, sub: "It will no longer be asked for on this application. The reason is kept.",
      action: "Waive it", body: function (h) { h.appendChild(why.node); },
      onSubmit: function () {
        if (!why.value()) throw new Error("A reason is required.");
        return NS.putDocument(a.id, d.key, { status: "waived", note: why.value() }).then(function (r) { set(r.application); });
      }
    });
  }

  /* ------------------------------------------------------------ Review */
  function drawReview(pane, a, set) {
    if (a.can.family) {
      pane.appendChild(el("p", "en-note", "The school's review happens on its side. You will see where your application stands above, and anything the school asks of you."));
      var cs = a.corrections || [];
      if (cs.length) {
        var ul = el("ul", "en-corr-list");
        cs.forEach(function (c) { ul.appendChild(el("li", c.resolved ? "done" : "", esc(c.message) + (c.resolved ? " <small>— sent back</small>" : ""))); });
        pane.appendChild(ul);
      }
      return;
    }
    var grid = el("div", "en-two");
    var left = el("div"), right = el("div");
    grid.appendChild(left); grid.appendChild(right);
    pane.appendChild(grid);

    // Review checklist
    var rv = a.review || { checks: {}, duplicates: {}, overrides: {} };
    var sec = el("section", "en-block");
    sec.appendChild(el("header", "en-block-h", "<h3>Review checklist</h3><p>What the reviewer confirms before a decision.</p>"));
    var closed = a.enrollmentId || ["rejected", "withdrawn"].indexOf(a.status) > -1;
    settings().then(function (s) {
      s.review.forEach(function (c) {
        var st = rv.checks[c.key] || {};
        var row = el("label", "en-check" + (st.done ? " done" : ""));
        var cb = el("input"); cb.type = "checkbox"; cb.checked = !!st.done; cb.disabled = !a.can.verify || closed;
        cb.addEventListener("change", function () {
          NS.act(a.id, "check", { key: c.key, done: cb.checked }).then(function (r) { set(r.application); }, function (e) { toast(e.message); cb.checked = !cb.checked; });
        });
        row.appendChild(cb);
        row.appendChild(el("span", null, esc(c.label) + (c.required ? "" : " <small>optional</small>") +
          (st.done ? "<small class='by'>" + esc(st.byName || "") + " · " + esc(ago(st.at)) + "</small>" : "")));
        sec.appendChild(row);
      });
    });
    left.appendChild(sec);

    // Eligibility
    var ev = a.evaluation;
    var el2 = el("section", "en-block");
    el2.appendChild(el("header", "en-block-h", "<h3>Eligibility</h3>"));
    var lines = [];
    if (ev.age) lines.push("<b>" + (ev.age.ok ? "Old enough" : "Younger than the grade asks") + "</b> — " + ev.age.age + " on " + esc(day(ev.age.cutoff)) + "; " + esc(a.grade) + " asks for " + ev.age.minAge + ".");
    else lines.push("<span class='cn-none'>No minimum age is set for " + esc(a.grade) + ".</span>");
    if (ev.seats) lines.push("<b>" + (ev.seats.used >= ev.seats.limit ? "No seat left" : (ev.seats.limit - ev.seats.used) + " seat" + (ev.seats.limit - ev.seats.used === 1 ? "" : "s") + " left") +
      "</b> in " + esc(a.grade) + " — " + ev.seats.used + " of " + ev.seats.limit + " taken (admitted and enrolled).");
    else lines.push("<span class='cn-none'>No seat limit is set for " + esc(a.grade) + ".</span>");
    var ov = rv.overrides || {};
    Object.keys(ov).forEach(function (k) {
      lines.push("<b>Set aside</b> (" + (k === "age" ? "age" : "seats") + "): " + esc(ov[k].reason) + " <small>— " + esc(ov[k].byName || "") + "</small>");
    });
    lines.forEach(function (l) { el2.appendChild(el("p", "en-line", l)); });
    left.appendChild(el2);

    // Possible matches and family
    var dup = el("section", "en-block");
    dup.appendChild(el("header", "en-block-h", "<h3>Is this a person the school already has?</h3><p>Settle every possible match before a decision.</p>"));
    var ds = a.duplicates || [];
    if (!ds.length) dup.appendChild(el("p", "en-ok", "No one else on file matches this applicant."));
    ds.forEach(function (d) {
      var res = (rv.duplicates || {})[d.key];
      var row = el("div", "en-match en-" + d.strength + (res ? " settled" : ""));
      row.appendChild(el("div", "en-match-t", "<b>" + esc(d.name) + "</b><small>" + esc(d.reason) + (d.dob ? " · born " + esc(day(d.dob)) : "") +
        (d.number ? " · " + esc(d.number) + " " + esc((STATUS[d.status] || [d.status])[0]) + ", " + esc(d.grade || "") : "") + "</small>"));
      var acts = el("div", "en-match-acts");
      if (res) {
        acts.appendChild(el("span", "en-settled", res.resolution === "same" ? "Same person" : "Different person"));
      } else if (d.strength !== "weak" && a.can.verify && !closed) {
        acts.appendChild(btn("Same person", "", function () { settleDup(a, d, "same", set); }));
        acts.appendChild(btn("Different person", "quiet", function () { settleDup(a, d, "different", set); }));
      } else if (d.strength === "weak") acts.appendChild(el("span", "en-settled", "For information"));
      row.appendChild(acts);
      dup.appendChild(row);
    });
    if ((a.siblings || []).length) {
      dup.appendChild(el("p", "en-sib", "<b>Brothers and sisters at the school or applying:</b> " +
        esc(a.siblings.map(function (s) { return s.name + (s.grade ? " (" + s.grade + ")" : ""); }).join(", "))));
    }
    left.appendChild(dup);

    // Owner and timing
    var own = el("section", "en-block");
    own.appendChild(el("header", "en-block-h", "<h3>Owner</h3>"));
    own.appendChild(el("p", "en-line", a.assignedTo ? "<b>" + esc(a.assignedTo.name || "") + "</b>" + (a.dueOn ? " · due " + esc(day(a.dueOn)) : "") : "<span class='cn-none'>Unassigned</span>"));
    if (a.can.edit && !closed) own.appendChild(btn("Assign…", "quiet", function () { assign(a); }));
    right.appendChild(own);

    // Decision
    var dec = el("section", "en-block");
    dec.appendChild(el("header", "en-block-h", "<h3>Decision</h3>"));
    if (a.decision) {
      var d = a.decision;
      dec.appendChild(el("p", "en-line", "<b>" + esc(({ admitted: "Admitted", rejected: "Declined", waitlisted: "Waitlisted" })[d.value] || d.value) + "</b>" +
        (d.by && d.by.name ? " by " + esc(d.by.name) : "") + (d.at ? " · " + esc(ago(d.at)) : "")));
      if (d.reason) dec.appendChild(el("p", "en-line", esc(REJECT[d.reason] || d.reason)));
      if (d.note) dec.appendChild(el("p", "en-line", esc(d.note)));
      if (a.acceptance !== "not_required") dec.appendChild(el("p", "en-line", "Offer: <b>" + esc(a.acceptance) + "</b>" + (a.offerUntil ? " · valid until " + esc(day(a.offerUntil)) : "")));
    } else dec.appendChild(el("p", "en-line", "<span class='cn-none'>No decision yet.</span>"));
    if (!closed || ["rejected", "withdrawn"].indexOf(a.status) > -1) {
      var da = el("div", "en-stack");
      if (a.status === "awaiting_decision" && a.can.decide) da.appendChild(btn("Decide…", "strong", function () { decide(a, "approve"); }));
      if (["rejected", "withdrawn", "waitlisted"].indexOf(a.status) > -1 && a.can.decide) {
        da.appendChild(btn(a.status === "waitlisted" ? "Reconsider…" : "Reopen…", "", function () { decide(a, a.status === "waitlisted" ? "reconsider" : "reopen"); }));
      }
      if (da.children.length) dec.appendChild(da);
    }
    if (!a.can.decide && a.status === "awaiting_decision") dec.appendChild(el("p", "en-note", "Decisions are made by an admissions reviewer or an administrator."));
    right.appendChild(dec);

    // Corrections
    var cs2 = a.corrections || [];
    if (cs2.length || (a.can.verify && !closed)) {
      var cr = el("section", "en-block");
      cr.appendChild(el("header", "en-block-h", "<h3>Corrections</h3>"));
      if (!cs2.length) cr.appendChild(el("p", "en-line", "<span class='cn-none'>None asked for.</span>"));
      var cul = el("ul", "en-corr-list");
      cs2.forEach(function (c) { cul.appendChild(el("li", c.resolved ? "done" : "", esc(c.message) + (c.resolved ? " <small>— sent back " + esc(ago(c.resolvedAt)) + "</small>" : ""))); });
      cr.appendChild(cul);
      if (a.can.verify && ["submitted", "incomplete", "under_review", "awaiting_decision"].indexOf(a.status) > -1) {
        cr.appendChild(btn("Request corrections…", "quiet", function () { askCorrections(a); }));
      }
      right.appendChild(cr);
    }

    // Notes
    var notes = a.events.filter(function (e) { return e.kind === "note"; });
    var nt = el("section", "en-block");
    nt.appendChild(el("header", "en-block-h", "<h3>Notes</h3><p>Only the school sees these.</p>"));
    if (!notes.length) nt.appendChild(el("p", "en-line", "<span class='cn-none'>No notes.</span>"));
    notes.slice(0, 6).forEach(function (n) {
      nt.appendChild(el("div", "en-note-i", "<p>" + esc(n.note) + "</p><small>" + esc(n.byName || "") + " · " + esc(ago(n.at)) + "</small>"));
    });
    if (a.can.edit) nt.appendChild(btn("Add a note…", "quiet", function () { addNote(a); }));
    right.appendChild(nt);

    function settleDup(app, d, res, setFn) {
      var go = function (note) {
        return NS.act(app.id, "resolve_duplicate", { key: d.key, resolution: res, note: note }).then(function (r) { setFn(r.application); });
      };
      if (res === "same" && d.kind === "application") {
        dialog({
          title: "This is a duplicate of " + (d.number || d.name),
          sub: "This application will be withdrawn as a duplicate. The other one carries on.", action: "Withdraw this one", tone: "danger",
          onSubmit: function () { return go(""); }
        });
      } else if (res === "same") {
        dialog({
          title: "This is " + d.name, sub: "This application becomes another year for that student: it links to their record and keeps one identity.",
          action: "Link to " + d.name, onSubmit: function () { return go(""); }
        });
      } else go("");
    }
  }

  /* ----------------------------------------------------------- History */
  function drawHistory(pane, a) {
    var filter = "all";
    var bar = K.cnFilters([{ k: "all", name: "Everything" }, { k: "status", name: "Status" }, { k: "document", name: "Documents" },
      { k: "note", name: "Notes" }, { k: "field", name: "Edits" }], filter, function (k) { filter = k; draw(); });
    pane.appendChild(bar);
    var slot = el("div", "en-history");
    pane.appendChild(slot);
    function text(e) {
      var f = FIELD[e.field] || e.field;
      switch (e.kind) {
        case "status":
          return e.from ? "Status: " + esc((STATUS[e.from] || [e.from])[0]) + " → <b>" + esc((STATUS[e.to] || [e.to])[0]) + "</b>"
                        : "Application started";
        case "field":
          if (e.field === "studentId") return "Linked to an existing student";
          if (e.field === "consent") return "Consent recorded — " + esc(e.to || "");
          return "Changed <b>" + esc(f) + "</b>" + (e.from ? " from “" + esc(e.from) + "”" : "") + (e.to ? " to “" + esc(e.to) + "”" : "");
        case "document":
          return "<b>" + esc(e.field) + "</b>: " + esc((DOC_STATUS[e.from] || [e.from || "—"])[0]) + " → " + esc((DOC_STATUS[e.to] || [e.to])[0]);
        case "decision":
          return e.field && /^override/.test(e.field) ? "Set aside a rule: " + esc(e.note || "") : "Decision: <b>" + esc(e.to || "") + "</b>";
        case "check": return "Review check " + esc(e.to || "") + ": " + esc(e.note || "");
        case "duplicate": return "Possible match settled: " + esc(e.from || "") + " — <b>" + esc(e.to || "") + "</b>";
        case "assign": return "Assigned to <b>" + esc(e.to || "nobody") + "</b>" + (e.from ? " (was " + esc(e.from) + ")" : "");
        case "enrollment": return e.to === "enrolled" ? "<b>Enrolled</b>" : e.field === "account" ? "Student sign-in created" : "Enrollment " + esc(e.from || "") + " → <b>" + esc(e.to || "") + "</b>";
        case "sync": return "School systems: <b>" + esc(e.to || "") + "</b>";
        case "note": return "Note";
        default: return esc(e.kind);
      }
    }
    function draw() {
      bar.mark(filter);
      slot.innerHTML = "";
      var list = a.events.filter(function (e) { return filter === "all" || e.kind === filter; });
      if (!list.length) { slot.appendChild(el("p", "en-note", "Nothing here yet.")); return; }
      list.forEach(function (e) {
        var row = el("div", "en-ev");
        row.appendChild(el("span", "en-ev-t", esc(stamp(e.at))));
        var body = el("div", "en-ev-b");
        body.appendChild(el("p", null, text(e)));
        if (e.note && e.kind !== "decision" && e.kind !== "sync") body.appendChild(el("p", "en-ev-note", esc(e.note)));
        if (e.kind === "sync" && e.note) body.appendChild(el("p", "en-ev-note", esc(e.note)));
        row.appendChild(body);
        row.appendChild(el("span", "en-ev-w", esc(e.byName || "") + (e.internal ? " · internal" : "")));
        slot.appendChild(row);
      });
    }
    draw();
  }

  /* ------------------------------------------------------------ Dialogs */
  function assign(a) {
    var sel = fld("select", "Owner", a.assignedTo ? a.assignedTo.id : "", { options: [["", "Unassigned"]] });
    var due = fld("date", "Due", a.dueOn || "");
    NS.team().then(function (list) {
      (list || []).forEach(function (p) {
        var o = el("option"); o.value = p.id; o.textContent = p.name + (p.roles.indexOf("registrar") > -1 ? " · Registrar" : p.roles.indexOf("admissions") > -1 ? " · Admissions" : "");
        sel.input.appendChild(o);
      });
      sel.input.value = a.assignedTo ? a.assignedTo.id : "";
    });
    dialog({
      title: "Assign", sub: "Whoever owns it is who is asked about it.", action: "Save",
      body: function (h) { h.appendChild(sel.node); h.appendChild(due.node); },
      onSubmit: function () {
        return NS.act(a.id, "assign", { to: sel.value() || null, dueOn: due.value() || "" }).then(function (r) { APP_CTX.set(r.application); toast("Saved."); });
      }
    });
  }

  function addNote(a) {
    var t = fld("area", "Note", "", { rows: 4, hint: "What was said, decided or noticed" });
    var inn = el("label", "en-radio");
    var cb = el("input"); cb.type = "checkbox"; cb.checked = true;
    inn.appendChild(cb); inn.appendChild(el("span", null, "Internal — the family will not see it"));
    dialog({
      title: "Add a note", action: "Add the note",
      body: function (h) { h.appendChild(t.node); h.appendChild(inn); },
      onSubmit: function () {
        if (!t.value()) throw new Error("Write something first.");
        return NS.act(a.id, "note", { text: t.value(), internal: cb.checked }).then(function (r) { APP_CTX.set(r.application); toast("Note added."); });
      }
    });
  }

  function withdraw(a) {
    var why = fld("text", "Reason", "", { req: true, hint: "e.g. The family chose another school" });
    dialog({
      title: "Withdraw this application", sub: "It leaves the queue and is kept on the record. It can be reopened.",
      action: "Withdraw", tone: "danger", body: function (h) { h.appendChild(why.node); },
      onSubmit: function () {
        if (!why.value()) throw new Error("A reason is required.");
        return NS.act(a.id, "withdraw", { reason: why.value() }).then(function (r) { APP_CTX.set(r.application); toast("Withdrawn."); });
      }
    });
  }

  function askCorrections(a) {
    var items = [];
    var list = el("div", "en-corr-edit");
    var msg = fld("text", "What needs correcting?", "", { hint: "e.g. The postal address needs the pin code" });
    var what = fld("select", "About", "other", { options: [["other", "Something else"]] });
    a.documents.forEach(function (d) { var o = el("option"); o.value = "doc:" + d.key; o.textContent = d.label; what.input.appendChild(o); });
    function paint() {
      list.innerHTML = "";
      items.forEach(function (it, i) {
        var row = el("div", "en-corr-row", "<span>" + esc(it.message) + "</span>");
        row.appendChild(btn("Remove", "quiet small", function () { items.splice(i, 1); paint(); }));
        list.appendChild(row);
      });
    }
    var add = btn("Add to the list", "quiet", function () {
      if (!msg.value()) return;
      var w = what.value();
      items.push(w.indexOf("doc:") === 0 ? { kind: "document", ref: w.slice(4), message: msg.value() } : { kind: "other", message: msg.value() });
      msg.input.value = "";
      paint();
    });
    dialog({
      title: "Request corrections", sub: "The application goes back to the family with exactly this list. A document you name here is marked returned.",
      action: "Send back", wide: false,
      body: function (h) { h.appendChild(what.node); h.appendChild(msg.node); h.appendChild(add); h.appendChild(list); },
      onSubmit: function () {
        if (msg.value()) add.click();
        if (!items.length) throw new Error("Add at least one thing that needs correcting.");
        return NS.act(a.id, "request_changes", { items: items }).then(function (r) { APP_CTX.set(r.application); toast("Sent back for corrections."); });
      }
    });
  }

  function acceptance(a) {
    dialog({
      title: "Record the family's answer", sub: "An offer was made" + (a.offerUntil ? ", valid until " + day(a.offerUntil) : "") + ". Has the family accepted it?",
      action: "Accepted",
      body: function (h, ctl) {
        var no = btn("They declined", "danger", function () {
          NS.act(a.id, "decline", {}).then(function (r) { APP_CTX.set(r.application); ctl.close(); toast("Offer declined — application withdrawn."); }, function (e) { ctl.error(e.message); });
        });
        h.appendChild(no);
      },
      onSubmit: function () { return NS.act(a.id, "accept", {}).then(function (r) { APP_CTX.set(r.application); toast("Offer accepted."); }); }
    });
  }

  /* The decision: admit, waitlist or decline — and anything the school's own
     rules say needs a reason to set aside. */
  function decide(a, kind) {
    var ev = a.evaluation;
    var soft = (ev.gates.approve || []).filter(function (b) { return b.soft; });
    var hard = (ev.gates.approve || []).filter(function (b) { return !b.soft; });
    var mode = kind === "approve" ? "admit" : kind;
    var note = fld("area", "Note", "", { rows: 2, hint: "Optional — kept with the decision" });
    var reason = fld("select", "Reason", "ineligible", { options: Object.keys(REJECT).map(function (k) { return [k, REJECT[k]]; }) });
    var why = fld("text", "Reason", "", { hint: "Say why" });
    var overrides = {};
    var host2 = null;

    var title = { admit: "Decide", waitlist: "Place on the waitlist", reject: "Decline the application", reconsider: "Reconsider", reopen: "Reopen" }[mode];
    var ctl = dialog({
      title: title + " — " + (a.student.name || a.number),
      sub: mode === "admit" ? "Admitting is not enrolling: the student is admitted now, and enrolled when the registrar sets the start day and courses." : null,
      action: ({ admit: "Admit", waitlist: "Place on the waitlist", reject: "Decline", reconsider: "Send back for a decision", reopen: "Reopen" })[mode],
      tone: mode === "reject" ? "danger" : "strong",
      body: function (h) {
        host2 = h;
        if (mode === "admit") {
          var seg = el("div", "cn-seg en-choice");
          var choices = [["admit", "Admit"], ["waitlist", "Waitlist"], ["reject", "Decline"]];
          choices.forEach(function (c) {
            var b = el("button", "cn-segb" + (mode === c[0] ? " on" : ""), c[1]);
            b.type = "button";
            b.addEventListener("click", function () { ctl.close(); decide(a, c[0] === "admit" ? "approve" : c[0]); });
            seg.appendChild(b);
          });
          h.appendChild(seg);
          if (hard.length) {
            var hb = el("div", "en-dlg-err");
            hb.appendChild(el("p", null, "Not ready to admit:"));
            var u = el("ul"); hard.forEach(function (b) { u.appendChild(el("li", null, esc(b.label))); }); hb.appendChild(u);
            h.appendChild(hb);
          }
          soft.forEach(function (b) {
            var f = fld("text", b.kind === "seats" ? "Admit past the seat limit — why?" : "Admit under the minimum age — why?", "", { hint: "Required to set this aside" });
            h.appendChild(el("p", "en-line warn", esc(b.label)));
            h.appendChild(f.node);
            overrides[b.kind] = f;
          });
          h.appendChild(note.node);
        } else if (mode === "reject") {
          h.appendChild(reason.node);
          h.appendChild(note.node);
          h.appendChild(el("p", "en-note", "The family is told the application was declined. The reason and note are kept on the record."));
        } else if (mode === "waitlist") {
          h.appendChild(why.node);
        } else {
          h.appendChild(note.node);
          note.input.placeholder = "Why is this being looked at again? (required)";
        }
      },
      onSubmit: function () {
        var action = { admit: "approve", waitlist: "waitlist", reject: "reject", reconsider: "reconsider", reopen: "reopen" }[mode];
        var data = {};
        if (mode === "admit") {
          if (hard.length) throw new Error(hard[0].label);
          data.note = note.value();
          var ov = {};
          Object.keys(overrides).forEach(function (k) {
            if (overrides[k].value().length < 4) throw new Error("Give a reason for setting that aside.");
            ov[k] = overrides[k].value();
          });
          if (Object.keys(ov).length) data.override = ov;
        } else if (mode === "reject") { data.reason = reason.value(); data.note = note.value(); }
        else if (mode === "waitlist") { data.reason = why.value(); }
        else { data.note = note.value(); if (!data.note) throw new Error("Say why."); }
        return wrapErr(NS.act(a.id, action, data)).then(function (r) {
          APP_CTX.set(r.application);
          toast(({ approve: "Admitted.", waitlist: "On the waitlist.", reject: "Declined.", reconsider: "Back with the decision-makers.", reopen: "Reopened." })[action]);
        });
      }
    });
  }

  /* Enrolling: the formal enrollment record, and everything it sets in motion. */
  function activate(a) {
    var courses = null;
    var start = fld("date", "Starts", a.intendedStart || today(), { req: true });
    var grade = fld("select", "Grade", a.grade, { options: [[a.grade, a.grade]] });
    var mail = fld("email", "Student's sign-in email", "", { hint: "name@school.example" });
    var pw = fld("text", "Initial password", randomPassword(), { note: "Shown once. Give it to the family; the student changes it at first sign-in." });
    var newStudent = !a.student.id;
    var picks = {};
    var pwds = {};
    var summary = el("div", "en-activate-sum");

    settings().then(function (s) {
      grade.input.innerHTML = "";
      s.grades.forEach(function (g) {
        var o = el("option"); o.value = g.name; o.textContent = g.name; grade.input.appendChild(o);
      });
      grade.input.value = a.grade;
    });

    var ctl = dialog({
      title: "Enroll " + (a.student.name || "the student"), wide: true,
      sub: "This creates the student's year at the school. Then they join their courses and their family is linked — and anything that cannot be done now is left for staff to finish, not undone.",
      action: "Enroll student",
      body: function (h) {
        var g = el("div", "en-form-grid");
        g.appendChild(start.node); g.appendChild(grade.node);
        h.appendChild(g);
        if (newStudent) {
          h.appendChild(el("h3", "en-h3", "Sign-in for the student"));
          h.appendChild(el("p", "en-note", "A new account is made for " + esc(a.student.name) + ". If they already have one, close this and link them under Review → possible matches."));
          var g2 = el("div", "en-form-grid"); g2.appendChild(mail.node); g2.appendChild(pw.node); h.appendChild(g2);
        } else h.appendChild(el("p", "en-ok", esc(a.student.name) + " already has an account; this year joins their record."));

        var gs = ((a.form || {}).guardians || []);
        if (gs.length) {
          h.appendChild(el("h3", "en-h3", "Family access"));
          gs.forEach(function (gd, i) {
            var row = el("div", "en-act-g");
            row.appendChild(el("div", null, "<b>" + esc(gd.name || "Guardian") + "</b><small>" + esc([gd.relationship, gd.email].filter(Boolean).join(" · ")) + "</small>"));
            if (gd.email) {
              var p = fld("text", "Password if they have no account yet", "", { hint: "Leave empty if they already do" });
              p.input.addEventListener("input", function () { pwds[i] = p.input.value; });
              row.appendChild(p.node);
            } else row.appendChild(el("small", "cn-none", "No email on file — no sign-in can be made"));
            h.appendChild(row);
          });
        }
        h.appendChild(el("h3", "en-h3", "Courses"));
        var cbox = el("div", "en-courses");
        cbox.appendChild(el("p", "en-note", "Loading courses…"));
        h.appendChild(cbox);
        API.courses.all(K.S.me.orgId).then(function (list) {
          cbox.innerHTML = "";
          list = (list || []).filter(function (c) { return c.status !== "archived"; });
          if (!list.length) { cbox.appendChild(el("p", "en-note", "There are no courses yet. The student can be placed later.")); return; }
          var matched = list.filter(function (c) { return (c.level || "").toLowerCase().indexOf(a.grade.toLowerCase()) > -1; });
          list.forEach(function (c) {
            var lab = el("label", "en-course");
            var cb = el("input"); cb.type = "checkbox"; cb.checked = matched.indexOf(c) > -1;
            picks[c.id] = cb.checked;
            cb.addEventListener("change", function () { picks[c.id] = cb.checked; });
            lab.appendChild(cb);
            lab.appendChild(el("span", null, "<b>" + esc(c.title) + "</b><small>" + esc([c.subject, c.level].filter(Boolean).join(" · ")) + "</small>"));
            cbox.appendChild(lab);
          });
        }, function () { cbox.innerHTML = ""; cbox.appendChild(el("p", "en-note", "Courses could not be loaded; place the student afterwards.")); });
        h.appendChild(summary);
      },
      onSubmit: function () {
        var body = { startsOn: start.value(), grade: grade.value(),
                     courseIds: Object.keys(picks).filter(function (k) { return picks[k]; }),
                     guardians: Object.keys(pwds).filter(function (i) { return pwds[i]; }).map(function (i) { return { index: +i, password: pwds[i] }; }) };
        if (!body.startsOn) throw new Error("Say the day the student starts.");
        if (newStudent) {
          if (!mail.value()) throw new Error("Give the student a sign-in email.");
          body.account = { email: mail.value(), password: pw.value() };
        }
        return wrapErr(NS.act(a.id, "activate", body)).then(function (r) {
          APP_CTX.set(r.application);
          var bad = r.enrollment && r.enrollment.syncState === "exception";
          toast(bad ? "Enrolled — some set-up needs attention." : r.enrollment.status === "scheduled" ? "Enrolled. They start on " + day(r.enrollment.startsOn) + "." : "Enrolled.");
        });
      }
    });
  }

  function randomPassword() {
    var chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "";
    var a = new Uint32Array(12);
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < a.length; i++) out += chars[a[i] % chars.length];
    return out.slice(0, 4) + "-" + out.slice(4, 8) + "-" + out.slice(8);
  }

  function printSummary(a) {
    var rows = [["Number", a.number], ["Student", a.student.name], ["Date of birth", a.student.dob ? day(a.student.dob) : ""], ["Applying to", a.grade + ", " + yearName(a.schoolYear)],
      ["Type", TYPES[a.type] || a.type], ["Status", (STATUS[a.status] || [a.status])[0]], ["Joining", a.intendedStart ? day(a.intendedStart) : ""],
      ["Admission number", a.student.admissionNo || ""]];
    var f = a.form || {};
    var html = K.printHead("Application " + a.number, a.student.name) +
      K.printTable([{ t: "Field" }, { t: "Value" }], rows) +
      "<h2>Parents and guardians</h2>" +
      K.printTable([{ t: "Name" }, { t: "Relationship" }, { t: "Phone" }, { t: "Email" }],
        (f.guardians || []).map(function (g) { return [g.name, g.relationship, g.phone, g.email]; })) +
      "<h2>Documents</h2>" +
      K.printTable([{ t: "Document" }, { t: "Required" }, { t: "Status" }],
        a.documents.map(function (d) { return [d.label, d.required ? "Yes" : "No", (DOC_STATUS[d.status] || [d.status])[0]]; }));
    K.cxPrint("Application " + a.number, html);
  }

  /* ============================================================ Enrolled */
  function drawEnrolled(host) {
    var FILTERS = [["all", "All"], ["scheduled", "Scheduled"], ["active", "Active"], ["suspended", "Suspended"], ["left", "Left"],
                   ["completed", "Completed"], ["exceptions", "Needs attention"]];
    var bar = K.cnFilters(FILTERS.map(function (x) { return { k: x[0], name: x[1], n: "" }; }), ST.enr, function (k) { ST.enr = k; ST.enrPage = 1; load(); });
    host.appendChild(bar);
    var tools = el("div", "cn-bar en-tools");
    var find = el("input", "cn-search");
    find.type = "search"; find.placeholder = "Search students"; find.value = ST.enrQ;
    tools.appendChild(find);
    host.appendChild(tools);
    var slot = el("div", "en-slot");
    host.appendChild(slot);
    var foot = el("div", "en-pager");
    host.appendChild(foot);
    var t = null;
    find.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { ST.enrQ = find.value.trim(); ST.enrPage = 1; load(); }, 250); });

    function load() {
      slot.innerHTML = ""; slot.appendChild(el("div", "admin-loading", "Loading enrollments…"));
      NS.enrollments({ year: ST.year, status: ST.enr, q: ST.enrQ, page: ST.enrPage, size: 25 }).then(function (r) {
        slot.innerHTML = "";
        var c = r.counts;
        [].forEach.call(bar.children, function (b) {
          var em = b.querySelector("em"), k = b.dataset.k;
          var n = k === "all" ? c.all : k === "left" ? (c.withdrawn || 0) + (c.transferred || 0) : c[k];
          if (em) em.textContent = n || "";
        });
        bar.mark(ST.enr);
        var items = r.items;
        if (!items.length) {
          slot.appendChild(K.cnEmpty("No enrollments here.", ST.enrQ ? "Nothing matches that search." : "Students appear here once an admitted application has been enrolled."));
          foot.innerHTML = "";
          return;
        }
        var tb = K.cnTable([
          { label: "Student", w: "minmax(170px, 1.3fr)" }, { label: "Grade", w: "76px" }, { label: "Status", w: "120px" },
          { label: "Dates", w: "minmax(190px, 1.2fr)" }, { label: "Courses", w: "minmax(100px, .9fr)" }, { label: "Set-up", w: "100px" }
        ]);
        items.forEach(function (x) {
          var who = el("span", "en-who");
          who.appendChild(K.avatarFor({ name: x.name || "?", initials: x.initials, hue: x.hue }));
          who.appendChild(el("span", "en-who-t", "<b>" + esc(x.name || "") + "</b><small>" + esc(x.admissionNo || x.email || "") + "</small>"));
          var placed = x.placements.filter(function (p) { return p.status === "done" || p.status === "scheduled"; });
          var bad = x.syncState === "exception";
          var gone = ["withdrawn", "transferred", "completed"].indexOf(x.status) > -1;
          tb.row([who, esc(x.grade), chip(ENR_STATUS, x.status),
                  esc(day(x.startsOn)) + (x.endsOn ? " – " + esc(day(x.endsOn)) : ""),
                  placed.length ? esc(plural(placed.length, "course")) : gone ? "<span class='cn-none'>—</span>" : "<span class='cn-mk warn'>Not placed</span>",
                  gone ? "<span class='cn-none'>—</span>" : bad ? "<span class='cn-mk warn'>Needs attention</span>" : x.syncState === "pending" ? "<span class='cn-none'>Waiting</span>" : "<span class='cn-none'>Done</span>"],
            function () { openEnrollment(x); }, x.id);
        });
        slot.appendChild(tb);
        foot.innerHTML = "";
        var from = (r.page - 1) * r.size + 1, to = Math.min(r.total, r.page * r.size);
        foot.appendChild(el("span", "en-count", from + "–" + to + " of " + r.total));
        var prev = btn("Previous", "quiet", function () { ST.enrPage--; load(); });
        var next = btn("Next", "quiet", function () { ST.enrPage++; load(); });
        prev.disabled = r.page <= 1; next.disabled = to >= r.total;
        foot.appendChild(prev); foot.appendChild(next);
        foot.appendChild(btn("Export", "quiet", function () {
          K.csvDownload("enrolled-" + (ST.year || "all") + ".csv", [["Student", "Admission number", "Grade", "Status", "Starts", "Ends", "Courses", "Set-up"]].concat(
            items.map(function (x) { return [x.name, x.admissionNo || "", x.grade, (ENR_STATUS[x.status] || [x.status])[0], x.startsOn, x.endsOn || "",
              x.placements.filter(function (p) { return p.status === "done"; }).map(function (p) { return p.title; }).join("; "), x.syncState]; })));
        }));
      }, function (e) { K.failed(slot, e, load); });
    }
    load();
  }

  function openEnrollmentFor(a) {
    NS.enrollments({ year: "all", q: a.student.name, size: 100 }).then(function (r) {
      var e = r.items.filter(function (x) { return x.id === a.enrollmentId; })[0];
      if (e) openEnrollment(e); else { ST.tab = "enrolled"; K.openAdmin(false, "enrollment"); }
    }, function (er) { toast(er.message); });
  }

  /* One enrollment, with what was set up and what can happen next. */
  function openEnrollment(x) {
    var box = el("div", "en-dlg en-wide");
    box.appendChild(el("h2", "en-dlg-h", esc(x.name || "Student") + " <span class='en-pref'>" + esc(x.grade) + " · " + esc(yearName(x.year)) + "</span>"));
    box.appendChild(el("p", "en-dlg-sub", chip(ENR_STATUS, x.status) + " &nbsp; starts " + esc(day(x.startsOn)) + (x.endsOn ? ", ends " + esc(day(x.endsOn)) : "") +
      (x.admissionNo ? " · admission " + esc(x.admissionNo) : "")));
    var st = el("div", "en-setup");
    st.appendChild(el("h3", "en-h3", "What was set up"));
    var STEP = { identity: "Student account", records: "Student record", placement: "Courses" };
    var steps = x.sync || [];
    if (!steps.length) st.appendChild(el("p", "en-note", "Nothing has run yet."));
    steps.forEach(function (s) {
      var label = s.key.indexOf("family:") === 0 ? "Family" : (STEP[s.key] || s.key);
      var tone = s.status === "done" ? "green" : s.status === "scheduled" ? "blue" : s.status === "note" ? "muted" : "orange";
      st.appendChild(el("div", "en-step-r", "<span class='en-st en-" + tone + "'><i></i>" + esc(label) + "</span><small>" + esc(s.note || "") + "</small>"));
    });
    if (x.placements.length) {
      st.appendChild(el("h3", "en-h3", "Courses"));
      x.placements.forEach(function (p) {
        st.appendChild(el("div", "en-step-r", "<span class='en-st en-" + (p.status === "done" ? "green" : p.status === "scheduled" ? "blue" : p.status === "left" ? "muted" : "orange") +
          "'><i></i>" + esc(p.title || "Course") + "</span><small>" + esc(p.status === "done" ? "Enrolled" : p.status === "scheduled" ? p.note : p.status === "left" ? "Left" : p.note || "Could not join") + "</small>"));
      });
    }
    box.appendChild(st);
    if (x.exitReason) box.appendChild(el("p", "en-note", "Left: " + esc(EXIT[x.exitReason] || x.exitReason) + (x.exitNote ? " — " + esc(x.exitNote) : "")));

    var acts = el("div", "en-dlg-acts en-wrap");
    var live = x.state === "enrolled" || x.state === "suspended";
    function after() { K.openAdmin(true, "enrollment"); }
    var sheet = null;
    function run(action, data, msg) {
      NS.enrollmentAct(x.id, action, data).then(function () { toast(msg); sheet.close(); after(); }, function (e) { toast(e.message); });
    }
    var needAccess = steps.filter(function (s) { return s.needs === "signin"; });
    if (live) {
      acts.appendChild(btn("Place in courses…", "", function () { sheet.close(); placeCourses(x, after); }));
      if (needAccess.length) acts.appendChild(btn("Give the family a sign-in…", "", function () { sheet.close(); familyAccess(x, needAccess, after); }));
      if (x.syncState === "exception") acts.appendChild(btn("Try the set-up again", "", function () { run("resync", {}, "Tried again."); }));
      acts.appendChild(btn(x.state === "suspended" ? "Resume" : "Suspend", "", function () {
        run(x.state === "suspended" ? "resume" : "suspend", {}, x.state === "suspended" ? "Resumed." : "Suspended.");
      }));
      acts.appendChild(btn("Transfer out…", "", function () { sheet.close(); leaving(x, "transfer", after); }));
      acts.appendChild(btn("Withdraw…", "danger", function () { sheet.close(); leaving(x, "withdraw", after); }));
      acts.appendChild(btn("Complete the year…", "", function () { sheet.close(); leaving(x, "complete", after); }));
    }
    if (x.applicationId) acts.appendChild(btn("Open application", "quiet", function () { sheet.close(); openApplication(x.applicationId); }));
    box.appendChild(acts);
    sheet = K.cxSheet(box);
  }

  /* A parent who has an email but no account yet: a sign-in is made when the
     school gives them a first password, which it then hands to them. */
  function familyAccess(x, list, after) {
    var fields = list.map(function (s) {
      return { s: s, f: fld("text", s.name + " — " + s.email, randomPassword(), { note: "Shown once. Give it to them; they change it at first sign-in." }) };
    });
    dialog({
      title: "Give the family a sign-in", sub: "Each person signs in on the same page as everybody else and lands on the family view, where they can read the record and change none of it.",
      action: "Create the sign-ins",
      body: function (h) { fields.forEach(function (p) { h.appendChild(p.f.node); }); },
      onSubmit: function () {
        var guardians = fields.map(function (p) { return { index: p.s.index, password: p.f.value() }; });
        return NS.enrollmentAct(x.id, "resync", { guardians: guardians }).then(function () { toast("Sign-ins created."); after(); });
      }
    });
  }

  function placeCourses(x, after) {
    var picks = {};
    var have = {};
    x.placements.forEach(function (p) { if (p.status === "done" || p.status === "scheduled") have[p.courseId] = true; });
    dialog({
      title: "Place " + (x.name || "the student") + " in courses", sub: "A student who starts later joins on their first day.",
      action: "Place",
      body: function (h) {
        var box = el("div", "en-courses");
        h.appendChild(box);
        API.courses.all(K.S.me.orgId).then(function (list) {
          (list || []).filter(function (c) { return c.status !== "archived"; }).forEach(function (c) {
            var lab = el("label", "en-course");
            var cb = el("input"); cb.type = "checkbox"; cb.checked = !!have[c.id]; cb.disabled = !!have[c.id];
            cb.addEventListener("change", function () { picks[c.id] = cb.checked; });
            lab.appendChild(cb);
            lab.appendChild(el("span", null, "<b>" + esc(c.title) + "</b><small>" + esc([c.subject, c.level].filter(Boolean).join(" · ")) + "</small>"));
            box.appendChild(lab);
          });
        });
      },
      onSubmit: function () {
        var ids = Object.keys(picks).filter(function (k) { return picks[k]; });
        if (!ids.length) throw new Error("Choose at least one course.");
        return NS.enrollmentAct(x.id, "place", { courseIds: ids }).then(function () { toast("Placed."); after(); });
      }
    });
  }

  function leaving(x, action, after) {
    var reason = fld("select", "Reason", action === "withdraw" ? "relocated" : "transferred_out", {
      options: Object.keys(EXIT).filter(function (k) { return k !== "transferred_out" && k !== "completed_programme"; }).map(function (k) { return [k, EXIT[k]]; }) });
    var school = fld("text", "Transferring to", "", { req: true, hint: "Name of the other school" });
    var ends = fld("date", "Last day", today());
    var note = fld("text", "Note", "", {});
    var rm = el("label", "en-radio");
    var cb = el("input"); cb.type = "checkbox"; cb.checked = action !== "complete";
    rm.appendChild(cb); rm.appendChild(el("span", null, "Also remove them from their courses (their marks stay on the record)"));
    dialog({
      title: { transfer: "Transfer out", withdraw: "Withdraw", complete: "Complete the year" }[action] + " — " + (x.name || ""),
      sub: "The enrollment ends on that day and stays on the record. The student keeps their account and their history.",
      action: { transfer: "Transfer out", withdraw: "Withdraw", complete: "Complete" }[action], tone: action === "withdraw" ? "danger" : "strong",
      body: function (h) {
        if (action === "withdraw") h.appendChild(reason.node);
        if (action === "transfer") h.appendChild(school.node);
        h.appendChild(ends.node);
        if (action !== "complete") h.appendChild(note.node);
        h.appendChild(rm);
      },
      onSubmit: function () {
        var data = { endsOn: ends.value() || today(), removeFromCourses: cb.checked, note: note.value() };
        if (action === "withdraw") data.reason = reason.value();
        if (action === "transfer") { if (!school.value()) throw new Error("Say which school."); data.school = school.value(); }
        return NS.enrollmentAct(x.id, action, data).then(function () { toast("Done."); after(); });
      }
    });
  }

  /* ============================================================ Capacity */
  function drawCapacity(host, summary) {
    if (!summary) { host.appendChild(K.cnEmpty("No figures yet.", "")); return; }
    host.appendChild(el("p", "en-note", "Seats are counted from students enrolled or suspended and applicants who have been admitted but not yet enrolled. " +
      "A seat limit is set per grade under Requirements; a grade with no limit is open."));
    if (!summary.grades.length) {
      host.appendChild(K.cnEmpty("No grade has applicants or a seat limit yet.", "Seats and the waitlist appear here as applications arrive.", "Set seat limits", function () { ST.tab = "requirements"; K.openAdmin(true, "enrollment"); }));
      return;
    }
    var t = K.cnTable([
      { label: "Grade", w: "minmax(120px, 1fr)" }, { label: "Seats", w: "70px", align: "right" }, { label: "Filled", w: "70px", align: "right" },
      { label: "", w: "minmax(140px, 1.4fr)" }, { label: "Left", w: "70px", align: "right" }, { label: "Applying", w: "84px", align: "right" },
      { label: "Waitlist", w: "80px", align: "right" }
    ]);
    summary.grades.forEach(function (g) {
      var left = g.seats == null ? null : g.seats - g.used;
      var pct = g.seats ? Math.min(100, Math.round(g.used / g.seats * 100)) : 0;
      var bar = g.seats == null ? "<span class='cn-none'>No limit</span>"
        : "<span class='bar en-cap " + (left < 0 ? "over" : left === 0 ? "full" : "") + "'><i style='width:" + pct + "%'></i></span>";
      t.row(["<b>" + esc(g.name) + "</b>", g.seats == null ? "<span class='cn-none'>—</span>" : String(g.seats), String(g.used), bar,
             left == null ? "<span class='cn-none'>—</span>" : left < 0 ? "<b class='cn-mk bad'>" + left + "</b>" : String(left),
             String(g.applying), g.waitlisted ? "<b class='cn-mk warn'>" + g.waitlisted + "</b>" : "<span class='cn-none'>0</span>"],
        function () { ST.tab = "applications"; ST.grade = g.name; ST.view = g.waitlisted ? "waitlist" : "open"; K.openAdmin(true, "enrollment"); }, g.name);
    });
    host.appendChild(t);
  }

  /* ======================================================= Requirements */
  var COMMON_DOCS = [
    { key: "national_id", label: "Government identity number", sensitive: true, required: false,
      hint: "Ask only where the school or the law requires it" },
    { key: "category_cert", label: "Caste or category certificate", sensitive: true, required: false,
      hint: "Only where a seat is reserved by category; held restricted" },
    { key: "income_cert", label: "Income certificate", sensitive: true, required: false, hint: "Only where a seat depends on it" },
    { key: "disability_cert", label: "Disability certificate", sensitive: true, required: false },
    { key: "parent_id", label: "Parent or guardian photo ID", sensitive: true, required: false },
    { key: "court_order", label: "Custody or court order", sensitive: true, required: false },
    { key: "report_card_2", label: "Last two years' report cards", required: false, types: ["transfer"] },
    { key: "sibling_proof", label: "Proof of a sibling at the school", required: false }
  ];

  function drawRequirements(host, changed) {
    var node = K.loading(host, "requirements");
    NS.settings().then(function (r) {
      node.remove();
      var s = JSON.parse(JSON.stringify(r.settings));
      var editable = true;
      host.appendChild(el("p", "en-note", "What this school asks of an application. Change it here — nothing needs a developer. " +
        "Rules the school cannot switch off (a possible duplicate is settled, a document is verified by a person, a decision is the admissions reviewer's) stay as they are."));
      var save = btn("Save requirements", "strong", function () {
        save.disabled = true;
        s.requireAcceptance = acc.checked;
        s.offerDays = +offer.value() || 14; s.dueDays = +due.value() || 7; s.stalledDays = +stall.value() || 5;
        s.admissionPrefix = pre.value(); s.admissionPad = +pad.value() || 4;
        s.ageCutoff = cut.value() || "04-01";
        s.consent = { version: cv.value() || "1", statement: cs.value() };
        s.currentYear = curY.value();
        NS.putSettings(s).then(function () { toast("Requirements saved."); SET = null; if (changed) changed(); K.openAdmin(true, "enrollment"); },
          function (e) { save.disabled = false; toast(e.message); });
      });

      // Years
      var ysec = el("section", "en-block");
      ysec.appendChild(el("header", "en-block-h", "<h3>School years</h3><p>The years applications can be made for, and which one is current.</p>"));
      var curY = fld("select", "Current year", s.currentYear, { options: s.years.map(function (y) { return [y, yearName(y)]; }) });
      var yl = el("div", "en-chips");
      function drawYears() {
        yl.innerHTML = "";
        s.years.forEach(function (y, i) {
          var c = el("span", "en-chip", esc(yearName(y)));
          if (s.years.length > 1) {
            var x = el("button", "x", "×"); x.type = "button";
            x.addEventListener("click", function () { s.years.splice(i, 1); if (s.currentYear === y) s.currentYear = s.years[0]; drawYears(); refreshCur(); });
            c.appendChild(x);
          }
          yl.appendChild(c);
        });
        var next = String(+s.years[s.years.length - 1].slice(0, 4) + 1);
        yl.appendChild(btn("Add " + yearName(next + "-" + (+next + 1)), "quiet small", function () { s.years.push(next + "-" + (+next + 1)); drawYears(); refreshCur(); }));
      }
      function refreshCur() {
        curY.input.innerHTML = "";
        s.years.forEach(function (y) { var o = el("option"); o.value = y; o.textContent = yearName(y); if (y === s.currentYear) o.selected = true; curY.input.appendChild(o); });
      }
      ysec.appendChild(yl);
      ysec.appendChild(curY.node);
      drawYears();
      host.appendChild(ysec);

      // Grades
      var gsec = el("section", "en-block");
      gsec.appendChild(el("header", "en-block-h", "<h3>Grades</h3><p>What the school admits to, in order. Seats and a minimum age are optional; with a minimum age, the student's age is counted on the cut-off day.</p>"));
      var cut = fld("text", "Age is counted on (month-day)", s.ageCutoff, { hint: "04-01", note: "Written MM-DD, in the school year's first calendar year" });
      var gl = el("div", "en-rows");
      function drawGrades() {
        gl.innerHTML = "";
        var head = el("div", "en-row head", "<span>Grade</span><span>Seats</span><span>Minimum age</span><span></span>");
        gl.appendChild(head);
        s.grades.forEach(function (g, i) {
          var row = el("div", "en-row");
          var n = el("input"); n.value = g.name; n.addEventListener("input", function () { g.name = n.value; });
          var se = el("input"); se.type = "number"; se.min = 0; se.value = g.seats == null ? "" : g.seats; se.placeholder = "No limit";
          se.addEventListener("input", function () { g.seats = se.value === "" ? null : +se.value; });
          var ma = el("input"); ma.type = "number"; ma.min = 0; ma.value = g.minAge == null ? "" : g.minAge; ma.placeholder = "None";
          ma.addEventListener("input", function () { g.minAge = ma.value === "" ? null : +ma.value; });
          var rm = btn("Remove", "quiet small", function () { s.grades.splice(i, 1); drawGrades(); });
          [n, se, ma, rm].forEach(function (c) { var w = el("span"); w.appendChild(c); row.appendChild(w); });
          gl.appendChild(row);
        });
        gl.appendChild(btn("Add a grade", "quiet", function () { s.grades.push({ name: "", seats: null, minAge: null }); drawGrades(); }));
      }
      drawGrades();
      gsec.appendChild(gl);
      gsec.appendChild(cut.node);
      host.appendChild(gsec);

      // Documents
      var dsec = el("section", "en-block");
      dsec.appendChild(el("header", "en-block-h", "<h3>Documents</h3><p>What an application must carry, by grade and kind of application. A document marked restricted is readable by administrators only, and should be collected only where the school or the law asks for it.</p>"));
      var dl = el("div", "en-rows en-docrows");
      function drawDocsCfg() {
        dl.innerHTML = "";
        s.documents.forEach(function (d, i) {
          var row = el("div", "en-docrow");
          var lab = el("input"); lab.value = d.label; lab.addEventListener("input", function () { d.label = lab.value; if (!d._keyed) d.key = slug(lab.value) || d.key; });
          var req = el("label", "en-radio"); var rc = el("input"); rc.type = "checkbox"; rc.checked = d.required !== false;
          rc.addEventListener("change", function () { d.required = rc.checked; }); req.appendChild(rc); req.appendChild(el("span", null, "Required"));
          var sen = el("label", "en-radio"); var sc = el("input"); sc.type = "checkbox"; sc.checked = !!d.sensitive;
          sc.addEventListener("change", function () { d.sensitive = sc.checked; }); sen.appendChild(sc); sen.appendChild(el("span", null, "Restricted"));
          var types = el("div", "en-types");
          [["new", "New"], ["transfer", "Transfer"], ["returning", "Returning"]].forEach(function (t) {
            var l = el("label", "en-radio"); var c = el("input"); c.type = "checkbox";
            c.checked = !d.types || !d.types.length || d.types.indexOf(t[0]) > -1;
            c.addEventListener("change", function () {
              var cur = d.types && d.types.length ? d.types.slice() : ["new", "transfer", "returning"];
              if (c.checked && cur.indexOf(t[0]) < 0) cur.push(t[0]);
              if (!c.checked) cur = cur.filter(function (x) { return x !== t[0]; });
              d.types = cur.length === 3 ? [] : cur;
            });
            l.appendChild(c); l.appendChild(el("span", null, t[1])); types.appendChild(l);
          });
          var rm = btn("Remove", "quiet small", function () { s.documents.splice(i, 1); drawDocsCfg(); });
          var top = el("div", "en-docrow-top"); top.appendChild(lab); top.appendChild(req); top.appendChild(sen); top.appendChild(rm);
          row.appendChild(top);
          row.appendChild(types);
          dl.appendChild(row);
        });
        var add = el("div", "en-addrow");
        add.appendChild(btn("Add a document", "quiet", function () {
          s.documents.push({ key: "doc_" + Date.now().toString(36), label: "", required: true, _keyed: false }); drawDocsCfg();
        }));
        var tpl = el("select", "cx-select");
        var first = el("option"); first.value = ""; first.textContent = "Add a common one…"; tpl.appendChild(first);
        COMMON_DOCS.forEach(function (c, i) { var o = el("option"); o.value = String(i); o.textContent = c.label + (c.sensitive ? " (restricted)" : ""); tpl.appendChild(o); });
        tpl.addEventListener("change", function () {
          if (tpl.value === "") return;
          var c = COMMON_DOCS[+tpl.value];
          if (!s.documents.some(function (d) { return d.key === c.key; })) s.documents.push(JSON.parse(JSON.stringify(c)));
          drawDocsCfg();
        });
        add.appendChild(tpl);
        dl.appendChild(add);
      }
      function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 36); }
      drawDocsCfg();
      dsec.appendChild(dl);
      host.appendChild(dsec);

      // Review
      var rsec = el("section", "en-block");
      rsec.appendChild(el("header", "en-block-h", "<h3>Review checklist</h3><p>What a reviewer confirms before a decision. A required item must be ticked before an application can be marked ready.</p>"));
      var rl = el("div", "en-rows");
      function drawReviewCfg() {
        rl.innerHTML = "";
        s.review.forEach(function (c, i) {
          var row = el("div", "en-docrow-top");
          var lab = el("input"); lab.value = c.label; lab.addEventListener("input", function () { c.label = lab.value; if (!c._keyed && /^chk_/.test(c.key)) c.key = "chk_" + slug(lab.value); });
          var rq = el("label", "en-radio"); var rc = el("input"); rc.type = "checkbox"; rc.checked = !!c.required;
          rc.addEventListener("change", function () { c.required = rc.checked; }); rq.appendChild(rc); rq.appendChild(el("span", null, "Required"));
          var rm = btn("Remove", "quiet small", function () { s.review.splice(i, 1); drawReviewCfg(); });
          row.appendChild(lab); row.appendChild(rq); row.appendChild(rm);
          rl.appendChild(row);
        });
        rl.appendChild(btn("Add a check", "quiet", function () { s.review.push({ key: "chk_" + Date.now().toString(36), label: "", required: false }); drawReviewCfg(); }));
      }
      drawReviewCfg();
      rsec.appendChild(rl);
      host.appendChild(rsec);

      // Offer, timing, consent, numbers
      var osec = el("section", "en-block");
      osec.appendChild(el("header", "en-block-h", "<h3>Offers, timing and numbers</h3>"));
      var og = el("div", "en-form-grid");
      var accL = el("label", "en-radio en-wide-row"); var acc = el("input"); acc.type = "checkbox"; acc.checked = !!s.requireAcceptance;
      accL.appendChild(acc); accL.appendChild(el("span", null, "An offer must be accepted before the student can be enrolled"));
      var offer = fld("text", "Offer is valid for (days)", String(s.offerDays));
      var due = fld("text", "A new application is due for review in (days)", String(s.dueDays));
      var stall = fld("text", "Flag as stalled after (days without a change)", String(s.stalledDays));
      var pre = fld("text", "Admission number prefix", s.admissionPrefix, { hint: "ADM-" });
      var pad = fld("text", "Digits in an admission number", String(s.admissionPad));
      og.appendChild(accL);
      [offer, due, stall, pre, pad].forEach(function (f) { og.appendChild(f.node); });
      osec.appendChild(og);
      host.appendChild(osec);

      var csec = el("section", "en-block");
      csec.appendChild(el("header", "en-block-h", "<h3>Consent</h3><p>What a family agrees to on submitting. Change the version when the policy changes, and every family is asked again.</p>"));
      var cv = fld("text", "Policy version", s.consent.version);
      var cs = fld("area", "Statement", s.consent.statement, { rows: 3 });
      csec.appendChild(cv.node); csec.appendChild(cs.node);
      host.appendChild(csec);

      var tail = el("div", "en-page-acts");
      tail.appendChild(save);
      host.appendChild(tail);
    }, function (e) { K.failed(node, e, function () { K.openAdmin(true, "enrollment"); }); });
  }

  /* A student's years at the school and every application they have made —
     one person, one record, however many years. Drawn into Student 360. */
  function studentPanel(pane, student) {
    var node = K.loading(pane, "their enrollment history");
    Promise.all([
      NS.enrollments({ year: "all", studentId: student.id, size: 100 }),
      NS.list({ year: "all", view: "all", studentId: student.id, size: 100 })
    ]).then(function (r) {
      node.remove();
      var es = r[0].items, as = r[1].items;
      pane.appendChild(el("p", "en-note", "Every year this student has been enrolled, and every application behind it. Nothing here is overwritten when a year ends."));
      if (!es.length && !as.length) {
        pane.appendChild(K.cnEmpty("No enrollment on record.", "Enrollments appear here once an application has been admitted and enrolled.", "New application", function () {
          openNew({ first: student.firstName, last: (student.name || "").split(" ").slice(1).join(" ") });
        }));
        return;
      }
      pane.appendChild(el("h2", "cn-h2", "Years"));
      var t = K.cnTable([{ label: "Year", w: "100px" }, { label: "Grade", w: "90px" }, { label: "Status", w: "130px" },
                         { label: "Dates", w: "minmax(180px, 1fr)" }, { label: "Admission no.", w: "120px" }]);
      es.forEach(function (e) {
        t.row([esc(yearName(e.year)), esc(e.grade), chip(ENR_STATUS, e.status),
               esc(day(e.startsOn)) + (e.endsOn ? " – " + esc(day(e.endsOn)) : ""), esc(e.admissionNo || "—")],
              e.applicationId ? function () { openApplication(e.applicationId); } : null, e.id);
      });
      if (es.length) pane.appendChild(t);
      else pane.appendChild(el("p", "en-note", "Not enrolled yet."));
      if (as.length) {
        pane.appendChild(el("h2", "cn-h2", "Applications"));
        var t2 = K.cnTable([{ label: "Number", w: "100px" }, { label: "Year", w: "100px" }, { label: "Grade", w: "90px" },
                            { label: "Type", w: "100px" }, { label: "Status", w: "150px" }, { label: "Updated", w: "110px", align: "right" }]);
        as.forEach(function (a) {
          t2.row([esc(a.number), esc(yearName(a.year)), esc(a.grade), esc(TYPES[a.type] || a.type), chip(STATUS, a.status), esc(ago(a.updatedAt))],
                 function () { openApplication(a.id); }, a.id);
        });
        pane.appendChild(t2);
      }
      var acts = K.cnActions();
      acts.style.marginTop = "20px";
      acts.appendChild(K.cnAction("Apply for another year", function () {
        NS.create({ studentId: student.id, type: "returning", schoolYear: undefined }).then(function (res) {
          toast("Application " + res.application.number + " started.");
          openApplication(res.application.id, "application");
        }, function (e) { toast(e.message); });
      }, true));
      pane.appendChild(acts);
    }, function (e) { K.failed(node, e, function () { pane.innerHTML = ""; studentPanel(pane, student); }); });
  }

  return { tab: tab, openApplication: openApplication, openNew: openNew, studentPanel: studentPanel };
};
