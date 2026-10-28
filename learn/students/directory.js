/* ==========================================================================
   Students › Directory — template T2, the index.

   One page for all 1,801: a header whose only primary action is Add student,
   a strip of the numbers an office acts on (each one a filter), a search, the
   filters, a table that asks the server for 50 rows at a time, and a bar that
   appears when rows are selected. A click on a row opens the quick look beside
   the list; the name is a link to the whole record.

   The address is the state: ?q=&class=X-C,XI-A&attendance=under-75&sort=&page=
   &peek=stu_123, so a refresh, a shared link and Back all land where they
   should. The server filters, sorts and counts (services/directory.js); this
   file draws what it sends and never holds the school's list.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var St = OL.students = OL.students || {};

  var FILTERS = ["q", "class", "house", "category", "gender", "stream", "transport", "blood", "language", "status", "attendance", "warning", "consent",
                 "filter", "cwsn", "new", "apaar", "pen", "from", "to"];
  var KEYS = FILTERS.concat(["sort", "dir", "page"]);
  var CHIPS = [["under75", "attendance", "under-75"], ["warning", "warning", "high,medium"], ["consent", "consent", "pending"], ["gaps", "filter", "record-gaps"], ["new", "new", "1"]];
  var DRAWER_ONLY = ["stream", "transport", "blood", "language", "status", "apaar", "pen", "from", "to", "cwsn"];
  var CATEGORIES = ["General", "EWS/DG", "SC", "ST", "OBC"];

  var csv = function (v) { return v ? String(v).split(",").filter(Boolean) : []; };

  function draw(host, env) {
    var API = St.api();
    if (env.pick) { OL.clear(host); env.go(St.path(env.pick)); return; }

    // the toolbar is drawn once more when the first answer brings the facets and the person's sections; the template does the rest
    var S = OL.templates.T2(host, {
      "class": "ol-students-dir", keys: KEYS,
      answer: function (q) { return API.directory.students(q); },
      announce: function (r) { return t("students.announce", { n: r.total }); },
      onAddress: function () { St.setList(filterString()); },
      onQuery: function () { S.sel = { keys: [], allMatching: false }; if (S.table) S.table.update({ selected: [] }); syncBulk(); },
      onFirst: function () { var id = OL.url.get("peek"); if (id) openPeek(id); },
      message: St.message, denied: function () { return { title: t("students.denied"), text: t("students.denied_text") }; },
      head: head, kpis: kpis, kpiLabel: t("students.kpi.label"), kpiN: 5, tools: paintTools, tokens: paintChips, table: tableOf, bulk: bulkActions
    });
    Object.assign(S, { selAll: { total: 0 }, classes: [], sel: { keys: [], allMatching: false }, peek: null, search: null, chips: null });
    var setQ = S.set, load = S.load;

    /* ----------------------------------------------------------- the address */
    function filterString() {
      var p = new URLSearchParams();
      FILTERS.forEach(function (k) { if (S.q[k]) p.set(k, S.q[k]); });
      return p.toString();
    }
    function hasFilters() { return FILTERS.some(function (k) { return !!S.q[k]; }); }
    function clearAll() {
      var patch = {};
      FILTERS.forEach(function (k) { patch[k] = null; });
      if (S.search) S.search.set("");
      setQ(patch, true);
    }

    /* ----------------------------------------------------------------- header */
    function head() {
      var d = S.data, can = d ? d.can : {};
      var more = [];
      if (can.export) more.push({ label: t("students.export"), icon: "download", onClick: doExport });
      return {
        title: env.title || t("tab.students.directory"),
        subtitle: d ? t("students.subtitle", { n: d.kpis.students, sections: d.kpis.sections }) : null,
        primary: can.write ? { label: t("students.add"), icon: "plus", onClick: function () { env.go("students/directory/new"); } } : null,
        secondary: can.write ? [{ label: t("students.import"), icon: "upload", onClick: function () { env.go("admin/data/imports"); } }] : [],
        more: more
      };
    }

    function doExport() {
      OL.ui.toast.show({ text: t("students.exporting"), tone: "info", ms: 2500 });
      API.directory.exportRows(S.q).then(function (r) {
        St.download(r.file, r.columns, r.rows);
        OL.ui.toast.show({ text: t("students.exported", { n: r.count }) });
      }, function (e) { OL.ui.toast.show({ text: St.message(e, t("students.export_failed")), tone: "error" }); });
    }

    /* ------------------------------------------------------------------- KPIs */
    function toggleOne(key, value) { return function () { setQ((function (o) { o[key] = S.q[key] === value ? null : value; return o; })({}), true); }; }
    function kpis() {
      var k = S.data.kpis, on = S.q, num = OL.fmt.num;
      return [
        { label: t("students.kpi.students"), value: num(k.students), context: t("students.kpi.in_sections", { n: k.sections }), onClick: clearAll, selected: !hasFilters() },
        { label: t("students.kpi.under75"), value: num(k.under75), context: t("students.kpi.under75_ctx"), onClick: toggleOne("attendance", "under-75"), selected: on.attendance === "under-75" },
        { label: t("students.kpi.warning"), value: num(k.warning), context: t("students.kpi.warning_ctx", { n: num(k.warningHigh) }), onClick: toggleOne("warning", "high,medium"), selected: on.warning === "high,medium" },
        { label: t("students.kpi.consent"), value: num(k.consent), context: t("students.kpi.consent_ctx"), onClick: toggleOne("consent", "pending"), selected: on.consent === "pending" },
        { label: t("students.kpi.gaps"), value: num(k.gaps), context: t("students.kpi.gaps_ctx"), onClick: toggleOne("filter", "record-gaps"), selected: on.filter === "record-gaps" }
      ];
    }

    /* ---------------------------------------------------------------- toolbar */
    function options(list, label) {
      return (list || []).map(function (f) { return { value: f.value, label: label ? label(f.value) : f.value, count: f.count }; });
    }
    function multi(key, label, list, lab) {
      return OL.ui.select.render({ label: label, options: options(list, lab), values: csv(S.q[key]), multiple: true, clearable: true, placeholder: t("students.any"),
        class: "ol-t2__f", onChange: function (vals) { setQ((function (o) { o[key] = vals.join(","); return o; })({}), false); } });
    }
    function buildClasses(list, scope) {
      var by = {}, order = [];
      list.forEach(function (c) {
        if (scope && scope.indexOf(c.label) < 0) return;
        if (!by[c.grade]) { by[c.grade] = { id: c.grade, label: /^(nursery|lkg|ukg|kg|pre)/i.test(c.grade) ? c.grade : t("students.class_n", { name: c.grade }), sections: [] }; order.push(by[c.grade]); }
        by[c.grade].sections.push({ id: c.label, label: c.label, count: c.strength });
      });
      return order;
    }

    function paintTools() {
      var d = S.data, scope = d && d.scope ? d.scope.sections : null, fac = d ? d.facets : {};
      S.search = OL.ui.page.search({ label: t("students.search_label"), placeholder: t("students.search"), value: S.q.q || "", onInput: function (v) { if (v !== (S.q.q || "")) setQ({ q: v }, false); } });
      var groups = [S.search];
      if (!scope || scope.length > 1) {
        S.classPicker = OL.ui.classpicker.render({ label: t("term.class"), classes: buildClasses(S.classes, scope), values: csv(S.q["class"]), multiple: true, class: "ol-t2__f", placeholder: t("students.any"),
          onChange: function (ids) { setQ({ "class": ids.join(",") }, false); } });
        groups.push(S.classPicker);
      }
      if (!scope) {
        groups.push(multi("house", t("term.house"), fac.houses));
        groups.push(multi("category", t("students.filter.category"), (fac.categories && fac.categories.length ? fac.categories : CATEGORIES.map(function (c) { return { value: c }; }))));
        groups.push(multi("gender", t("students.filter.gender"), fac.genders, function (g) { return t("students.gender." + g); }));
      }
      var more = OL.ui.button.render({ label: t("students.more_filters"), icon: "sliders", variant: "secondary", onClick: function () { openFilters(more); } });
      var bits = S.toolbar({ fields: groups, end: more, chips: true });
      S.chipsEl = bits.chips; S.tokensEl = bits.tokens;
      paintChips();
    }

    function paintChips() {
      if (!S.chipsEl) return;
      OL.clear(S.chipsEl);
      var d = S.data, counts = d ? d.counts : {};
      var items = CHIPS.map(function (c) { return { value: c[0], label: t("students.chip." + c[0]), count: d ? counts[c[0]] : null }; });
      var active = CHIPS.filter(function (c) { return S.q[c[1]] === c[2]; }).map(function (c) { return c[0]; });
      S.chips = OL.ui.chips.render({ items: items, values: active, multiple: true, label: t("students.chips_label"), onChange: function (vals) {
        var patch = {};
        CHIPS.forEach(function (c) { patch[c[1]] = vals.indexOf(c[0]) > -1 ? c[2] : (S.q[c[1]] === c[2] ? null : S.q[c[1]]); });
        setQ(patch, true);
      } });
      S.chipsEl.appendChild(S.chips);
      paintTokens();
    }

    function tokenText(k) {
      var v = S.q[k];
      if (k === "status") return t("students.token.status", { value: t("students.status." + v) });
      if (k === "pen") return t("students.token.pen", { value: t("students.pen." + v) });
      if (k === "apaar") return t("students.token.apaar", { value: csv(v).map(function (x) { return t("students.apaar." + x); }).join(", ") });
      if (k === "from") return t("students.token.from", { date: OL.fmt.date(v) });
      if (k === "to") return t("students.token.to", { date: OL.fmt.date(v) });
      if (k === "cwsn") return t("students.token.cwsn");
      return t("students.token." + k, { value: v });
    }
    function paintTokens() {
      if (!S.tokensEl) return;
      OL.clear(S.tokensEl);
      var d = S.data, scope = d && d.scope ? d.scope.sections : null;
      if (scope) S.tokensEl.appendChild(h("span", { class: "ol-token ol-students-token--fixed" }, h("span", { text: t("students.token.scope", { sections: scope.join(", ") }) })));
      var shown = DRAWER_ONLY.filter(function (k) { return !!S.q[k]; });
      shown.forEach(function (k) {
        S.tokensEl.appendChild(OL.ui.chips.token({ label: tokenText(k), onRemove: function () { setQ((function (o) { o[k] = null; return o; })({}), false); paintTokens(); } }));
      });
      if (hasFilters()) S.tokensEl.appendChild(OL.ui.button.render({ label: t("common.clear_filters"), variant: "link", onClick: clearAll }));
    }

    /* The filters the toolbar has no room for, in a drawer (nine fields: more than a popover, less than a page). */
    function openFilters(anchor) {
      var d = S.data, fac = d ? d.facets : {}, draft = {};
      DRAWER_ONLY.forEach(function (k) { draft[k] = S.q[k] || ""; });
      var fields = h("div", { class: "ol-students-form" });
      function ms(key, label, list, lab) {
        fields.appendChild(OL.ui.select.render({ label: label, options: options(list, lab), values: csv(draft[key]), multiple: true, clearable: true, placeholder: t("students.any"),
          onChange: function (v) { draft[key] = v.join(","); } }));
      }
      fields.appendChild(OL.ui.check.radios({ label: t("students.filter.status"), inline: true, value: draft.status || "enrolled", options: [
        { value: "enrolled", label: t("students.status.enrolled") }, { value: "left", label: t("students.status.left") }, { value: "all", label: t("students.status.all") }],
        onChange: function (v) { draft.status = v === "enrolled" ? "" : v; } }));
      ms("stream", t("students.filter.stream"), fac.streams);
      ms("transport", t("students.filter.transport"), fac.transports);
      ms("blood", t("students.filter.blood"), fac.bloods);
      ms("language", t("students.filter.language"), fac.languages);
      ms("apaar", t("students.filter.apaar"), ["generated", "pending", "refused", "not_generated"].map(function (x) { return { value: x }; }), function (x) { return t("students.apaar." + x); });
      fields.appendChild(OL.ui.select.render({ label: t("students.filter.pen"), options: [{ value: "on_file", label: t("students.pen.on_file") }, { value: "missing", label: t("students.pen.missing") }],
        value: draft.pen || null, clearable: true, placeholder: t("students.any"), onChange: function (v) { draft.pen = v || ""; } }));
      fields.appendChild(OL.ui.date.range({ label: t("students.filter.admitted"), value: { from: draft.from, to: draft.to }, onChange: function (v) { draft.from = (v && v.from) || ""; draft.to = (v && v.to) || ""; } }));
      fields.appendChild(OL.ui.check.toggle({ label: t("students.filter.cwsn"), checked: draft.cwsn === "yes", onChange: function (on) { draft.cwsn = on ? "yes" : ""; } }));
      var hd;
      var footer = [
        OL.ui.button.render({ label: t("common.reset"), variant: "ghost", onClick: function () { var p = {}; DRAWER_ONLY.forEach(function (k) { p[k] = null; }); hd.close(); setQ(p, true); } }),
        OL.ui.button.render({ label: t("common.apply"), variant: "primary", onClick: function () { var p = {}; DRAWER_ONLY.forEach(function (k) { p[k] = draft[k] || null; }); hd.close(); setQ(p, true); } })
      ];
      hd = OL.ui.drawer.open({ title: t("students.more_filters"), width: 560, body: fields, footer: footer });
    }

    /* ------------------------------------------------------------------ table */
    function genderCell(r) { return St.genderLabel(r.gender); }
    var columns = [
      { key: "name", label: t("students.col.name"), sort: true, width: 260, mobile: "title", value: function (r) { return r.name; }, render: function (r) {
        var a = h("a", { class: "ol-students-name", href: St.href(env, r.id), on: { click: function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault(); e.stopPropagation(); env.go(St.path(r.id));
        } } }, OL.ui.avatar.render({ name: r.name, id: r.id, size: 24 }), h("span", { class: "ol-students-name__n", text: r.name }));
        var w = St.warnPill(r.warning);
        return w ? h("span", { class: "ol-students-namecell" }, a, w) : a;
      } },
      { key: "class", label: t("term.class"), sort: true, width: 96, mobile: "sub", value: function (r) { return r.classLabel; } },
      { key: "roll", label: t("term.roll_no"), sort: true, num: true, width: 80, mobile: "hide", value: function (r) { return r.rollNo; } },
      { key: "admissionNo", label: t("term.admission_no"), width: 140, mobile: "sub", value: function (r) { return r.admissionNo; } },
      { key: "gender", label: t("students.filter.gender"), sort: true, hidden: true, width: 100, mobile: "hide", value: genderCell },
      { key: "category", label: t("students.filter.category"), sort: true, hidden: true, width: 110, mobile: "hide", value: function (r) { return r.category; } },
      { key: "house", label: t("term.house"), sort: true, hidden: true, width: 110, mobile: "hide", value: function (r) { return r.house; } },
      { key: "attendance", label: t("students.col.attendance"), sort: true, num: true, width: 170, mobile: "sub", value: function (r) { return r.attendance ? r.attendance.percent : null; }, render: function (r) { return St.attendanceCell(r.attendance); } },
      { key: "guardian", label: t("students.col.contact"), sort: true, width: 200, mobile: "hide", value: function (r) { return r.guardian ? r.guardian.name + " (" + r.guardian.relation + ")" : null; } },
      { key: "admitted", label: t("students.col.admitted"), sort: true, hidden: true, width: 120, mobile: "hide", value: function (r) { return r.admittedOn ? OL.fmt.date(r.admittedOn) : null; } },
      { key: "record", label: t("students.col.record"), sort: true, width: 150, mobile: "status", value: function (r) { return r.gapCount; }, render: function (r) { return St.recordPill(r); } }
    ];

    function emptyState() {
      var d = S.data;
      if (!d) return { kind: "first", title: t("table.empty") };
      if (hasFilters()) return { kind: "filtered", title: t("students.none_match"), text: t("students.none_match_text"), onClear: clearAll };
      var can = d.can || {};
      return { kind: "first", title: t("students.first_title"), text: t("students.first_text"),
        primary: can.write ? { label: t("students.add"), icon: "plus", onClick: function () { env.go("students/directory/new"); } } : null,
        secondary: can.write ? { label: t("students.import"), onClick: function () { env.go("admin/data/imports"); } } : null };
    }

    function sortOf() { return { key: S.q.sort || "class", dir: S.q.dir === "desc" ? "desc" : "asc" }; }

    function rowActions(r) {
      var items = [
        { label: t("students.quick_look"), icon: "eye", onClick: function () { openPeek(r.id); } },
        { label: t("students.open_record"), icon: "user", href: St.href(env, r.id), onClick: function () { env.go(St.path(r.id)); } }
      ];
      if (S.data && S.data.can.write) items.push({ label: t("students.edit"), icon: "pencil", href: St.href(env, r.id, "edit"), onClick: function () { env.go(St.path(r.id, "edit")); } });
      return items;
    }

    var tableConfig = {
      caption: t("students.caption"), columns: columns, rowKey: "id", selectable: true, pageSize: 50, columnChooser: true, prefsKey: "students.directory",
      onSort: function (key, dir) { setQ({ sort: key, dir: dir }, false); },
      onPage: function (n) { setQ({ page: String(n) }, false); },
      onOpen: function (r) { openPeek(r.id); },
      onSelect: function (keys, o) { S.sel = { keys: keys, allMatching: !!(o && o.allMatching) }; syncBulk(); },
      selectAllMatching: S.selAll,
      rowActions: rowActions
    };
    function tableOf() {
      var d = S.data;
      S.selAll.total = d ? d.total : 0;
      return { key: "students", config: tableConfig, state: { rows: d ? d.rows : [], total: d ? d.total : 0, page: d ? d.page : 1, sort: sortOf(), empty: emptyState() } };
    }

    /* ---------------------------------------------------------------- bulk bar */
    // the template builds the bar when the first answer says whether this person may write
    function bulkActions() {
      var can = S.data && S.data.can, actions = [];
      actions.push({ label: t("students.bulk.message"), icon: "send", onClick: bulkMessage });
      if (can && can.write) actions.push({ label: t("students.bulk.house"), icon: "flag", onClick: bulkHouse });
      return actions;
    }
    function selectionCount() { return S.sel.allMatching ? (S.data ? S.data.total : 0) : S.sel.keys.length; }
    function syncBulk() {
      if (!S.bulk) return;
      var n = selectionCount();
      S.bulk.show(n, n ? t("table.n_selected", { n: OL.fmt.num(n) }) : "");
    }
    /* What a bulk call acts on: the ids ticked, or the whole filter when "all N" was chosen. */
    function target() { return S.sel.allMatching ? { filter: filterString() } : { ids: S.sel.keys }; }
    function afterBulk() { S.sel = { keys: [], allMatching: false }; if (S.table) S.table.update({ selected: [] }); syncBulk(); load(); }

    function bulkHouse() {
      var n = selectionCount(), dlg;
      var field = OL.ui.input.render({ label: t("term.house"), name: "house", maxLength: 40, optional: true, helper: t("students.bulk.house_help") });
      var go = OL.ui.button.render({ label: t("students.bulk.house_go", { n: n }), variant: "primary", onClick: function () {
        go.setLoading(true);
        API.directory.bulkHouse(Object.assign(target(), { house: field.value.trim() || null })).then(function (r) {
          dlg.close(); OL.ui.toast.show({ text: t("students.bulk.house_done", { n: r.changed }) }); afterBulk();
        }, function (e) { go.setLoading(false); field.setError(St.message(e, t("students.save_failed"))); });
      } });
      dlg = OL.ui.modal.open({ title: t("students.bulk.house"), width: 520, body: field,
        actions: [OL.ui.button.render({ label: t("common.cancel"), variant: "secondary", onClick: function () { dlg.close(); } }), go] });
    }

    function bulkMessage() {
      var n = selectionCount(), dlg, word = t("students.bulk.word");
      var title = OL.ui.input.render({ label: t("students.bulk.subject"), name: "title", maxLength: 120 });
      var body = OL.ui.input.render({ label: t("students.bulk.text"), name: "body", multiline: true, rows: 4, maxLength: 800 });
      var go = OL.ui.button.render({ label: t("students.bulk.send"), variant: "primary", disabled: true, disabledReason: t("modal.type_to_enable", { word: word }), onClick: function () {
        if (!title.value.trim()) { title.setError(t("students.required")); return; }
        if (!body.value.trim()) { body.setError(t("students.required")); return; }
        go.setLoading(true);
        API.directory.bulkMessage(Object.assign(target(), { title: title.value.trim(), body: body.value.trim() })).then(function (r) {
          dlg.close(); OL.ui.toast.show({ text: t("students.bulk.sent", { families: r.families, students: r.students }) }); afterBulk();
        }, function (e) { go.setLoading(false); body.setError(St.message(e, t("students.save_failed"))); });
      } });
      var confirm = OL.ui.input.render({ label: t("modal.type_to_confirm", { word: word }), name: "confirm", onInput: function (v) { go.setDisabled(v.trim() !== word, t("modal.type_to_enable", { word: word })); } });
      dlg = OL.ui.modal.open({ title: t("students.bulk.message_title", { n: n }), width: 520, body: h("div", { class: "ol-students-form" }, title, body, confirm),
        actions: [OL.ui.button.render({ label: t("common.cancel"), variant: "secondary", onClick: function () { dlg.close(); } }), go] });
    }

    /* ----------------------------------------------------------------- peek */
    function openPeek(id) {
      if (S.peek) { S.peek.show(id); return; }
      S.peek = St.peek.open({ env: env, id: id, ids: function () { return S.data ? S.data.rows.map(function (r) { return r.id; }) : []; }, onClose: function () { S.peek = null; } });
    }

    /* ------------------------------------------------------------------ start */
    S.start();
    // the classes for the picker, once; the list does not wait for them
    API.india.classes().then(function (r) {
      S.classes = r.classes || [];
      if (S.classPicker) { var d = S.data; S.classPicker.setClasses(buildClasses(S.classes, d && d.scope ? d.scope.sections : null)); }
    }, function () { /* the picker stays empty; the search still finds a class by name */ });
  }

  St.directory = { draw: draw };
})();
