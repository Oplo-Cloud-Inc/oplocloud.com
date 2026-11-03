/* ==========================================================================
   Students › Admissions — template T2, the applications.

   Every application of the school year with where it stands and what the next
   step is: five numbers that are views (in progress, to verify, ready to decide,
   ready to enrol, overdue), a view menu with all eleven, search, class and
   status filters, the year, and a table the server sorts and pages. A click on
   a row opens the application beside the list; "Open application" goes to the
   admissions workspace's own page for it.

   The rest of admissions (enquiries, the assessment desk, reports, the written
   procedure, the application itself and the new-application form) is still the
   old workspace, at students/admissions/workspace (a reserved word where a
   record's id would go, as "new" is for the Directory's form): "Admissions
   workspace" opens it, and the buttons here that start a page of it call it. It
   moves onto the templates in its own step; until then nothing it does is lost.

   The address is the state: ?view=ready&q=&grade=Class X&status=&year=2026-2027
   &sort=due&dir=asc&page=&peek=app_123.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var St = OL.students = OL.students || {};

  var KEYS = ["view", "q", "grade", "status", "year", "sort", "dir", "page"];
  var VIEWS = ["mine", "open", "incomplete", "verify", "decision", "ready", "offers", "waitlist", "overdue", "closed", "all"];
  var STATUSES = ["draft", "submitted", "incomplete", "under_review", "changes_requested", "awaiting_decision", "waitlisted", "admitted", "rejected", "withdrawn"];
  var TONE = { draft: "neutral", submitted: "info", incomplete: "warning", under_review: "info", changes_requested: "warning", awaiting_decision: "info", waitlisted: "neutral", admitted: "success", rejected: "danger", withdrawn: "neutral" };
  var yearName = function (y) { return String(y || "").replace(/^(\d{4})-\d{2}(\d{2})$/, "$1–$2"); };
  var word = function (key, raw) { return OL.i18n.has(key) ? t(key) : raw; };
  var statusPill = function (s) { return OL.ui.pill.render({ label: t("students.admissions.status." + s), tone: TONE[s] || "neutral" }); };

  /* "students/admissions/workspace" is the old workspace; anything else is the list. */
  St.admissionsWorkspace = function (env) { return !!(env.route && env.route.record === "workspace"); };

  var denied = function () { return { title: t("students.admissions.denied"), text: t("students.admissions.denied_text") }; };

  function drawList(host, env) {
    var API = St.api();
    // the toolbar is drawn again with every answer: its view menu carries the counts and its filters come from the school's own classes and years
    var S = OL.templates.T2(host, {
      "class": "ol-students-adm", keys: KEYS, toolsEachTime: true,
      answer: function (q) { return API.enrollment.list({ view: view(), q: q.q, grade: q.grade, status: q.status, year: q.year, sort: q.sort, dir: q.dir, page: q.page, size: 25 }); },
      announce: function (r) { return t("students.admissions.announce", { n: r.total }); },
      onFirst: function () { var id = OL.url.get("peek"); if (id) openPeek(id); },
      message: St.message, denied: denied,
      head: head, kpis: kpis, kpiLabel: t("students.admissions.kpi.label"), kpiN: 5, tools: paintTools, tokens: paintTokens, table: tableOf
    });
    Object.assign(S, { info: null, search: null, peek: null });
    var setQ = S.set, load = S.load;
    var view = function () { return S.q.view && VIEWS.indexOf(S.q.view) > -1 ? S.q.view : "open"; };
    var filtered = function () { return !!(S.q.q || S.q.grade || S.q.status); };
    function clearAll() { if (S.search) S.search.set(""); setQ({ q: null, grade: null, status: null }, true); }

    // the classes and years the school has, once; the list does not wait for them
    API.enrollment.summary(S.q.year).then(function (r) { S.info = r; if (S.data) paintTools(); }, function () { /* the filters stay empty; the search still finds a class by name */ });
    var can = function () { return !!(S.info && S.info.can && S.info.can.write); };

    function head() {
      var year = S.data && S.data.year !== "all" ? S.data.year : S.info && S.info.currentYear;
      return {
        title: env.title || t("tab.students.admissions"), subtitle: year ? t("students.admissions.subtitle", { year: yearName(year) }) : null,
        primary: can() && env.legacy ? { label: t("students.admissions.new"), icon: "plus", onClick: function () { env.legacy.enr().openNew(); } } : null,
        secondary: [{ label: t("students.admissions.workspace"), onClick: function () { env.go("students/admissions/workspace"); } }]
      };
    }

    function kpis() {
      var c = S.data.counts, num = OL.fmt.num;
      var go = function (v) { return function () { setQ({ view: S.q.view === v ? null : v, page: null }, true); }; };
      var tile = function (v) { return { label: t("students.admissions.view." + v), value: num(c[v]), context: t("students.admissions.kpi." + v), onClick: go(v), selected: view() === v }; };
      return [tile("open"), tile("verify"), tile("decision"), tile("ready"), tile("overdue")];
    }

    /* ---------------------------------------------------------- toolbar */
    function paintTools() {
      var d = S.data, info = S.info;
      if (S.err && !d) { S.toolbar(); return; }
      // the search field is drawn once: the toolbar is drawn again with every answer, and a new field would take the keyboard from someone still typing
      if (!S.search) S.search = OL.ui.page.search({ label: t("students.admissions.search_label"), placeholder: t("students.admissions.search"), value: S.q.q || "", onInput: function (v) { if (v !== (S.q.q || "")) setQ({ q: v }, false); } });
      var fields = [S.search];
      fields.push(OL.ui.select.render({ label: t("students.admissions.view_label"), class: "ol-t2__f ol-t2__f--wide", value: view(), clearable: false,
        options: VIEWS.map(function (v) { return { value: v, label: t("students.admissions.view." + v), count: d ? d.counts[v] : null }; }),
        onChange: function (v) { setQ({ view: v === "open" ? null : v }, true); } }));
      if (info && info.grades && info.grades.length) {
        fields.push(OL.ui.select.render({ label: t("students.admissions.filter.grade"), class: "ol-t2__f", value: S.q.grade || null, clearable: true, placeholder: t("students.any"),
          options: info.grades.map(function (g) { return { value: g.name, label: g.name }; }), onChange: function (v) { setQ({ grade: v || null }, false); } }));
      }
      fields.push(OL.ui.select.render({ label: t("students.admissions.filter.status"), class: "ol-t2__f", value: S.q.status || null, clearable: true, placeholder: t("students.any"),
        options: STATUSES.map(function (s) { return { value: s, label: t("students.admissions.status." + s) }; }), onChange: function (v) { setQ({ status: v || null }, false); } }));
      var years = info && info.years && info.years.length > 1 ? info.years : null;
      var end = years ? OL.ui.segmented.render({ label: t("students.admissions.year_label"), value: (d && d.year !== "all" ? d.year : info.currentYear),
        items: years.map(function (y) { return { value: y, label: yearName(y) }; }), onChange: function (y) { setQ({ year: y === info.currentYear ? null : y }, false); API.enrollment.summary(y === info.currentYear ? undefined : y).then(function (r) { S.info = r; paintTools(); }); } }) : null;
      S.tokensEl = S.toolbar({ fields: fields, end: end }).tokens;
      paintTokens();
    }
    function paintTokens() {
      if (!S.tokensEl) return;
      OL.clear(S.tokensEl);
      if (filtered()) S.tokensEl.appendChild(OL.ui.button.render({ label: t("common.clear_filters"), variant: "link", onClick: clearAll }));
    }

    /* -------------------------------------------------------------- table */
    var columns = [
      { key: "number", label: t("students.admissions.col.number"), sort: true, width: 120, mobile: "sub", value: function (a) { return a.number; } },
      { key: "name", label: t("students.admissions.col.applicant"), sort: true, width: 240, mobile: "title", value: function (a) { return a.name; }, render: function (a) {
        return h("span", { class: "ol-students-namecell" }, OL.ui.avatar.render({ name: a.name, id: a.id, size: 24 }), h("span", { class: "ol-students-name__n", text: a.name }), a.duplicates ? OL.ui.pill.render({ label: t("students.admissions.duplicate"), tone: "warning" }) : null);
      } },
      { key: "grade", label: t("students.admissions.col.grade"), sort: true, width: 120, mobile: "sub", value: function (a) { return a.grade; } },
      { key: "type", label: t("students.admissions.col.type"), width: 110, mobile: "hide", value: function (a) { return word("students.admissions.type." + a.type, a.type); } },
      { key: "status", label: t("students.admissions.col.status"), sort: true, width: 170, mobile: "status", value: function (a) { return a.status; }, render: function (a) { return statusPill(a.status); } },
      { key: "progress", label: t("students.admissions.col.progress"), sort: true, num: true, width: 170, mobile: "hide", value: function (a) { return a.percent; }, render: function (a) {
        return h("span", { class: "ol-students-strength" }, h("span", { class: "ol-students-strength__n", text: OL.fmt.pct(a.percent, 0) }), h("span", { class: "ol-students-bar", "aria-hidden": "true" }, h("i", { style: { "--w": Math.min(100, a.percent || 0) + "%" } })));
      } },
      { key: "next", label: t("students.admissions.col.next"), width: 300, mobile: "hide", value: function (a) { return a.next ? a.next.label : null; }, render: function (a) {
        return a.next ? h("span", { class: "ol-students-adm__next", title: a.next.label, text: a.next.label }) : null;
      } },
      { key: "assigned", label: t("students.admissions.col.assigned"), width: 160, mobile: "hide", value: function (a) { return a.assignedTo ? a.assignedTo.name : null; } },
      { key: "due", label: t("students.admissions.col.due"), sort: true, width: 130, mobile: "hide", value: function (a) { return a.dueOn ? OL.fmt.date(a.dueOn) : null; }, render: function (a) {
        return a.dueOn ? h("span", { class: a.overdue ? "ol-students-adm__late" : null, text: OL.fmt.date(a.dueOn) }) : null;
      } }
    ];
    function rowActions(a) {
      var items = [{ label: t("students.admissions.quick_look"), icon: "eye", onClick: function () { openPeek(a.id); } }];
      if (env.legacy) items.push({ label: t("students.admissions.open"), icon: "file-text", onClick: function () { env.legacy.enr().openApplication(a.id); } });
      return items;
    }
    function emptyState() {
      if (!S.data) return { kind: "first", title: t("table.empty") };
      if (filtered() || view() !== "all") return { kind: "filtered", title: t("students.admissions.none_match"), text: t("students.admissions.none_match_text"), onClear: function () { clearAll(); if (view() !== "all") setQ({ view: "all" }, true); } };
      return { kind: "first", icon: "file-text", title: t("students.admissions.first_title"), text: t("students.admissions.first_text"),
        primary: can() && env.legacy ? { label: t("students.admissions.new"), icon: "plus", onClick: function () { env.legacy.enr().openNew(); } } : null };
    }
    var tableConfig = {
      caption: t("students.admissions.caption"), columns: columns, rowKey: "id", pageSize: 25,
      onSort: function (key, dir) { setQ({ sort: key, dir: dir }, false); },
      onPage: function (n) { setQ({ page: String(n) }, false); },
      onOpen: function (a) { openPeek(a.id); },
      rowActions: rowActions
    };
    function tableOf() {
      var d = S.data;
      return { key: "applications", config: tableConfig,
        state: { rows: d ? d.items : [], total: d ? d.total : 0, page: d ? d.page : 1, sort: { key: S.q.sort || "updated", dir: S.q.dir === "asc" ? "asc" : "desc" }, empty: emptyState() } };
    }

    /* --------------------------------------------------------- quick look */
    function openPeek(id) {
      var a = S.data && S.data.items.filter(function (x) { return x.id === id; })[0];
      if (!a) {
        // an address that names an application not on this page: the list as asked has no row for it, so say so in the drawer
        S.peek = OL.ui.drawer.open({ title: t("students.admissions.peek_title"), width: 560, body: OL.ui.empty.render({ kind: "first", icon: "file-text", title: t("students.admissions.not_here"), text: t("students.admissions.not_here_text") }), url: { param: "peek", value: id } });
        return;
      }
      peek(env, a);
    }

    S.start();
  }

  /* ========================================================= the quick look */
  function peek(env, a) {
    var body = h("div", { class: "ol-students-peek" });
    body.appendChild(h("div", { class: "ol-students-peek__pills" }, statusPill(a.status), a.overdue ? OL.ui.pill.render({ label: t("students.admissions.view.overdue"), tone: "danger" }) : null,
      a.blockers ? OL.ui.pill.render({ label: t("students.admissions.blockers", { n: a.blockers }), tone: "warning" }) : null));
    body.appendChild(OL.ui.page.kpis([
      { label: t("students.admissions.col.progress"), value: OL.fmt.pct(a.percent, 0), context: a.docs.required ? t("students.admissions.docs", { verified: OL.fmt.num(a.docs.verified), required: OL.fmt.num(a.docs.required) }) : t("students.admissions.docs_none") },
      { label: t("students.admissions.col.next"), value: a.next ? a.next.label : null, context: a.assignedTo && a.assignedTo.name ? t("students.admissions.peek.with", { name: a.assignedTo.name }) : t("students.admissions.peek.unassigned") }
    ], t("students.admissions.peek.label")));
    body.appendChild(OL.ui.page.facts([
      { label: t("students.admissions.col.number"), value: a.number }, { label: t("students.admissions.col.applicant"), value: a.name }, { label: t("students.admissions.peek.preferred"), value: a.preferred },
      { label: t("students.fact.dob"), value: a.dob ? OL.fmt.date(a.dob) : null }, { label: t("students.admissions.col.grade"), value: a.grade }, { label: t("students.admissions.col.type"), value: word("students.admissions.type." + a.type, a.type) },
      { label: t("students.admissions.peek.source"), value: word("students.admissions.source." + a.source, a.source) }, { label: t("students.admissions.col.due"), value: a.dueOn ? OL.fmt.date(a.dueOn) : null },
      { label: t("students.admissions.peek.start"), value: a.intendedStart ? OL.fmt.date(a.intendedStart) : null },
      { label: t("students.admissions.peek.duplicates"), value: a.duplicates ? t("students.admissions.peek.duplicates_n", { n: a.duplicates }) : null }
    ]));
    var hd, open = env.legacy ? OL.ui.button.render({ label: t("students.admissions.open"), variant: "primary", onClick: function () { hd.close(); env.legacy.enr().openApplication(a.id); } }) : null;
    hd = OL.ui.drawer.open({ title: a.name, subtitle: a.number, width: 560, body: body, url: { param: "peek", value: a.id }, footer: open ? [open] : [] });
    return hd;
  }

  St.admissions = { drawList: drawList };
})();
