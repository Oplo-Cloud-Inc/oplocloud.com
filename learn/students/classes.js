/* ==========================================================================
   Students › Classes › Sections — template T2 for the list, T3 for one section.

   Every section of the school year with its class teacher, room and strength; a
   click opens the section as a page (Overview, Roster, Activity). Adding or
   changing a section, adding children to it, numbering its rolls and promoting
   it to next year are a drawer or a confirmation: the centred sheet this
   replaces threw the list away.

   The address is the state: ?q=&stage=primary&filter=no-teacher&year=2025-2026
   &sort=&page=, and students/classes/sections/{id}[/roster|activity]. The list
   is one answer from the server (a school has tens of sections, not thousands),
   filtered and sorted here; the roster is the Directory's own rows for the
   section, so it carries no phone number and agrees with the Directory.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var St = OL.students = OL.students || {};

  var KEYS = ["q", "stage", "filter", "year", "sort", "dir", "page"];
  var STAGES = ["pre_primary", "primary", "middle", "secondary", "senior_secondary"];
  var GRADES = ["Play", "Nursery", "LKG", "UKG", "KG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  var TABS = ["overview", "roster", "activity"];
  var PAGE = 50;
  var rank = function (c) { var i = GRADES.indexOf(c.grade); return i < 0 ? 99 : i; };
  var stageOf = function (c) { return OL.ui.classpicker.stageOf({ id: c.grade, label: c.grade }); };
  var yearName = function (y) { return String(y || "").replace(/^(\d{4})-\d{2}(\d{2})$/, "$1–$2"); };
  var shiftYear = function (y, n) { var a = +String(y).slice(0, 4) + n; return a + "-" + (a + 1); };
  var by = function (f) { return function (a, b) { return String(f(a)).localeCompare(String(f(b)), "en", { sensitivity: "base", numeric: true }); }; };
  var CMP = {
    section: function (a, b) { return rank(a) - rank(b) || String(a.grade).localeCompare(String(b.grade)) || String(a.section).localeCompare(String(b.section)); },
    programme: by(function (c) { return [c.programme, c.stream].filter(Boolean).join(" "); }),
    teacher: by(function (c) { return c.classTeacher ? c.classTeacher.name : "￿"; }),
    room: by(function (c) { return c.room || "￿"; }),
    strength: function (a, b) { return a.strength - b.strength; }
  };
  var over = function (c) { return !!c.capacity && c.strength > c.capacity; };

  /* Where a section lives, with the year only when it is not this one. */
  St.classPath = function (id, tab, year) {
    return "students/classes/sections/" + encodeURIComponent(id) + (tab && tab !== "overview" ? "/" + tab : "") + (year ? "?year=" + encodeURIComponent(year) : "");
  };
  var LIST = "ol.students.classes";
  var lastList = ""; try { lastList = sessionStorage.getItem(LIST) || ""; } catch (e) { /* storage is off: the list comes back unfiltered */ }
  var setList = function (q) { lastList = q; try { sessionStorage.setItem(LIST, q); } catch (e) { /* as above */ } };
  St.classListPath = function () { return "students/classes/sections" + (lastList ? "?" + lastList : ""); };

  /* The word for a person who may not do a thing, and for a failure: the same everywhere on these pages. */
  var denied = function () { return { title: t("students.cls.denied"), text: t("students.cls.denied_text") }; };
  function failure(e, retry) { return OL.templates.failure(e, { retry: retry, denied: denied(), message: St.message }); }

  /* ============================================================= the list */
  function drawList(host, env) {
    var API = St.api();
    // one answer from the server, filtered, sorted and paged here: only the year asks again, and the toolbar is drawn with every answer
    var S = OL.templates.T2(host, {
      "class": "ol-students-cls", keys: KEYS, again: ["year"], toolsEachTime: true,
      answer: function (q) { return API.india.classes(q.year); },
      announce: function (r) { return t("students.cls.announce", { n: r.classes.length }); },
      onAddress: function () {
        var p = new URLSearchParams();
        ["q", "stage", "filter", "year"].forEach(function (k) { if (S.q[k]) p.set(k, S.q[k]); });
        setList(p.toString());
      },
      message: St.message, denied: denied,
      head: head, kpis: kpis, kpiLabel: t("students.cls.kpi.label"), kpiN: 4, tools: paintTools, table: tableOf
    });
    S.search = null;
    var setQ = S.set, load = S.load;
    var filtered = function () { return !!(S.q.q || S.q.stage || S.q.filter); };
    function clearAll() { if (S.search) S.search.set(""); setQ({ q: null, stage: null, filter: null }, true); }
    var can = function () { return !!(S.data && S.data.can && S.data.can.write); };
    var here = function () { return S.data ? S.data.year : S.q.year; };

    /* what the filters leave, before the stage is applied (for the chips' counts) and after */
    function matching(withStage) {
      var all = S.data ? S.data.classes : [], text = String(S.q.q || "").toLowerCase().trim();
      return all.filter(function (c) {
        if (text && [c.label, c.grade + " " + c.section, c.programme, c.stream, c.room, c.classTeacher && c.classTeacher.name].filter(Boolean).join(" ").toLowerCase().indexOf(text) < 0) return false;
        if (S.q.filter === "no-teacher" && c.classTeacher) return false;
        if (S.q.filter === "over-capacity" && !over(c)) return false;
        return !withStage || !S.q.stage || stageOf(c) === S.q.stage;
      });
    }

    function head() {
      var d = S.data;
      return {
        title: env.title || t("tab.students.classes"),
        subtitle: d ? t("students.cls.subtitle", { n: d.classes.length, year: yearName(d.year) }) : null,
        primary: can() ? { label: t("students.cls.add"), icon: "plus", onClick: function () { openForm(env, null, here(), load); } } : null,
        secondary: can() ? [{ label: t("students.cls.import"), icon: "upload", onClick: function () { env.go("admin/data/imports"); } }] : []
      };
    }

    function kpis() {
      var all = S.data.classes, num = OL.fmt.num;
      var seats = all.reduce(function (a, c) { return a + (c.capacity || 0); }, 0), kids = all.reduce(function (a, c) { return a + c.strength; }, 0);
      var noTeacher = all.filter(function (c) { return !c.classTeacher; }).length, full = all.filter(over).length;
      var toggle = function (v) { return function () { setQ({ filter: S.q.filter === v ? null : v }, true); }; };
      return [
        { label: t("students.cls.kpi.sections"), value: num(all.length), context: yearName(S.data.year), onClick: clearAll, selected: !filtered() },
        { label: t("students.cls.kpi.students"), value: num(kids), context: seats ? t("students.cls.kpi.of_seats", { n: seats }) : t("students.cls.kpi.no_seats") },
        { label: t("students.cls.kpi.no_teacher"), value: num(noTeacher), context: t("students.cls.kpi.no_teacher_ctx"), onClick: toggle("no-teacher"), selected: S.q.filter === "no-teacher" },
        { label: t("students.cls.kpi.over"), value: num(full), context: t("students.cls.kpi.over_ctx"), onClick: toggle("over-capacity"), selected: S.q.filter === "over-capacity" }
      ];
    }

    /* ------------------------------------------------------------ toolbar */
    function paintTools() {
      var d = S.data;
      if (S.err && !d) { S.toolbar(); return; }
      S.search = OL.ui.page.search({ label: t("students.cls.search_label"), placeholder: t("students.cls.search"), value: S.q.q || "", onInput: function (v) { if (v !== (S.q.q || "")) setQ({ q: v }, false); } });
      var end = null;
      if (d) {
        var years = [shiftYear(d.year, -1), d.year, shiftYear(d.year, 1)];
        end = OL.ui.segmented.render({ label: t("students.cls.year_label"), value: d.year, items: years.map(function (y) { return { value: y, label: yearName(y) }; }),
          onChange: function (y) { setQ({ year: y }, false); } });
      }
      var bits = S.toolbar({ fields: S.search, end: end, chips: !!d });
      if (d) {
        var base = matching(false), count = function (s) { return base.filter(function (c) { return stageOf(c) === s; }).length; };
        var items = [{ value: "all", label: t("common.all"), count: base.length }].concat(STAGES.map(function (s) { return { value: s, label: t("classpicker.stage." + s), count: count(s) }; }).filter(function (i) { return i.count || S.q.stage === i.value; }));
        bits.chips.appendChild(OL.ui.chips.render({ items: items, value: S.q.stage || "all", label: t("students.cls.stage_label"),
          onChange: function (v) { setQ({ stage: v === "all" ? null : v }, true); } }));
      }
      if (S.q.filter) bits.tokens.appendChild(OL.ui.chips.token({ label: t("students.cls.token." + S.q.filter), onRemove: function () { setQ({ filter: null }, true); } }));
      if (filtered()) bits.tokens.appendChild(OL.ui.button.render({ label: t("common.clear_filters"), variant: "link", onClick: clearAll }));
    }

    /* -------------------------------------------------------------- table */
    var columns = [
      { key: "section", label: t("students.cls.col.section"), sort: true, width: 130, mobile: "title", value: function (c) { return c.label; }, render: function (c) {
        return h("a", { class: "ol-students-name", href: env.base + St.classPath(c.id, null, yearOf(c)), on: { click: function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault(); e.stopPropagation(); env.go(St.classPath(c.id, null, yearOf(c)));
        } } }, h("span", { class: "ol-students-name__n", text: c.label }));
      } },
      { key: "programme", label: t("students.cls.col.programme"), sort: true, width: 200, mobile: "sub", value: function (c) { return [c.programme, c.stream].filter(Boolean).join(" · ") || null; } },
      { key: "teacher", label: t("students.cls.col.teacher"), sort: true, width: 240, mobile: "sub", value: function (c) { return c.classTeacher ? c.classTeacher.name : null; }, render: function (c) {
        return c.classTeacher ? h("span", { class: "ol-students-namecell" }, OL.ui.avatar.render({ name: c.classTeacher.name, id: c.classTeacher.id, size: 24 }), h("span", { text: c.classTeacher.name }))
          : OL.ui.pill.render({ label: t("students.cls.no_teacher"), tone: "warning" });
      } },
      { key: "room", label: t("students.cls.col.room"), sort: true, width: 110, mobile: "hide", value: function (c) { return c.room; } },
      { key: "strength", label: t("students.cls.col.strength"), sort: true, num: true, width: 230, mobile: "status", value: function (c) { return c.strength; }, render: strengthCell }
    ];
    // a section of another year is opened with that year in its address; this year's needs none
    function yearOf(c) { return S.q.year && S.q.year !== c.year ? null : S.q.year || null; }
    function strengthCell(c) {
      var cap = c.capacity, pct = cap ? Math.min(100, Math.round(c.strength / cap * 100)) : 0, full = over(c);
      return h("span", { class: "ol-students-strength" },
        h("span", { class: "ol-students-strength__n", text: cap ? t("students.cls.strength_of", { n: OL.fmt.num(c.strength), cap: OL.fmt.num(cap) }) : OL.fmt.num(c.strength) }),
        cap ? h("span", { class: OL.cx("ol-students-bar", full && "is-over"), "aria-hidden": "true" }, h("i", { style: { "--w": pct + "%" } })) : null,
        full ? OL.ui.pill.render({ label: t("students.cls.kpi.over"), tone: "danger" }) : null);
    }
    function rowActions(c) {
      var items = [{ label: t("students.cls.open"), icon: "eye", href: env.base + St.classPath(c.id, null, yearOf(c)), onClick: function () { env.go(St.classPath(c.id, null, yearOf(c))); } }];
      if (can()) items.push({ label: t("students.cls.edit"), icon: "pencil", onClick: function () { openForm(env, c, c.year, load); } });
      items.push({ label: t("students.cls.see_students"), icon: "users", href: env.base + "students/directory?class=" + encodeURIComponent(c.label), onClick: function () { env.go("students/directory?class=" + encodeURIComponent(c.label)); } });
      return items;
    }
    function emptyState() {
      if (filtered()) return { kind: "filtered", title: t("students.cls.none_match"), text: t("students.cls.none_match_text"), onClear: clearAll };
      return { kind: "first", title: t("students.cls.first_title", { year: yearName(here()) }), text: t("students.cls.first_text"),
        primary: can() ? { label: t("students.cls.add"), icon: "plus", onClick: function () { openForm(env, null, here(), load); } } : null,
        secondary: can() ? { label: t("students.cls.import"), onClick: function () { env.go("admin/data/imports"); } } : null };
    }
    var tableConfig = {
      caption: t("students.cls.caption"), columns: columns, rowKey: "id", pageSize: PAGE,
      onSort: function (key, dir) { setQ({ sort: key, dir: dir }, false); },
      onPage: function (n) { setQ({ page: String(n) }, false); },
      onOpen: function (c) { env.go(St.classPath(c.id, null, yearOf(c))); },
      rowActions: rowActions
    };
    function tableOf() {
      var sort = { key: S.q.sort || "section", dir: S.q.dir === "desc" ? "desc" : "asc" };
      var list = matching(true).slice().sort(CMP[sort.key] || CMP.section);
      if (sort.dir === "desc") list.reverse();
      var pages = Math.max(1, Math.ceil(list.length / PAGE)), page = Math.min(Math.max(parseInt(S.q.page, 10) || 1, 1), pages);
      return { key: "classes", config: tableConfig, state: { rows: list.slice((page - 1) * PAGE, page * PAGE), total: list.length, page: page, sort: sort, empty: emptyState() } };
    }

    S.start();
  }

  /* ========================================================= add and edit */
  /* A section, made or changed, in a drawer. Adding takes one section or several (A, B, C) of the same class. */
  function openForm(env, pre, year, done) {
    var API = St.api(), hd, dirty = false;
    var mark = function () { dirty = true; if (hd) hd.setDirty(true); };
    var gradeV = pre ? pre.grade : null;
    var grade = OL.ui.select.render({ label: t("students.cls.form.grade"), options: GRADES.map(function (g) { return { value: g, label: g }; }), value: gradeV, disabled: !!pre,
      placeholder: t("students.choose"), searchable: true, onChange: function (v) { gradeV = v; mark(); } });
    var section = OL.ui.input.render({ label: t(pre ? "students.cls.form.section" : "students.cls.form.sections"), name: "section", value: pre ? pre.section : "", disabled: !!pre, maxLength: 40,
      helper: pre ? null : t("students.cls.form.sections_help"), onInput: mark });
    var programme = OL.ui.input.render({ label: t("students.cls.form.programme"), name: "programme", value: pre && pre.programme || "", optional: true, maxLength: 80, helper: t("students.cls.form.programme_help"), onInput: mark });
    var stream = OL.ui.input.render({ label: t("students.cls.form.stream"), name: "stream", value: pre && pre.stream || "", optional: true, maxLength: 80, helper: t("students.cls.form.stream_help"), onInput: mark });
    var room = OL.ui.input.render({ label: t("students.cls.form.room"), name: "room", value: pre && pre.room || "", optional: true, maxLength: 40, onInput: mark });
    var cap = OL.ui.input.render({ label: t("students.cls.form.capacity"), name: "capacity", value: pre && pre.capacity != null ? String(pre.capacity) : "", optional: true, inputMode: "numeric", maxLength: 3, onInput: mark });
    var teacher = null, teacherId = pre && pre.classTeacher ? pre.classTeacher.id : null, teacherTouched = false;
    teacher = OL.ui.people.render({ label: t("students.cls.form.teacher"), kind: "staff", optional: true, values: pre && pre.classTeacher ? [{ id: pre.classTeacher.id, name: pre.classTeacher.name }] : [],
      search: function (text) { return API.search.query(text, ["staff"]).then(function (r) { var g = (r.groups || [])[0]; return g ? g.items.map(function (x) { return { id: x.id, name: x.title, sub: x.meta && x.meta.roles || "" }; }) : []; }); },
      onChange: function (people) { teacherTouched = true; teacherId = people[0] ? people[0].id : null; mark(); } });
    var form = h("form", { class: "ol-students-form", novalidate: true }, grade, section, h("div", { class: "ol-students-grid" }, programme, stream, room, cap), teacher);
    // the buttons live in the drawer's foot, outside the form, so Save is not a submit button: it calls submit(), and so does Enter in a field
    var save = OL.ui.button.render({ label: pre ? t("common.save") : t("students.cls.form.save_add"), variant: "primary", onClick: function () { submit(); } });
    var cancel = OL.ui.button.render({ label: t("common.cancel"), variant: "secondary", onClick: function () { hd.close(); } });
    form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    form.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target && e.target.tagName === "INPUT" && !e.target.closest(".ol-select, .ol-people")) { e.preventDefault(); submit(); } });

    function sections() { return pre ? [pre.section] : String(section.value || "").split(/[\s,;]+/).map(function (x) { return x.trim(); }).filter(Boolean); }
    function submit() {
      [grade, section, cap].forEach(function (f) { if (f.setError) f.setError(""); });
      var list = sections();
      if (!gradeV) { grade.setError(t("students.cls.form.error_grade")); return; }
      if (!list.length) { section.setError(t("students.cls.form.error_section")); section.focus(); return; }
      var capacity = String(cap.value || "").trim();
      if (capacity && !(/^\d{1,3}$/.test(capacity) && +capacity >= 1 && +capacity <= 200)) { cap.setError(t("students.cls.form.error_capacity")); cap.focus(); return; }
      save.setLoading(true);
      var made = [];
      (function next(i) {
        if (i >= list.length) { dirty = false; hd.setDirty(false); hd.close(); OL.ui.toast.show({ text: pre ? t("students.cls.saved") : t("students.cls.added", { n: made.length, list: made.join(", ") }) }); done(); return; }
        var body = { grade: gradeV, section: list[i], year: year || undefined, programme: programme.value.trim() || null, stream: stream.value.trim() || null, room: room.value.trim() || null,
          capacity: capacity ? Number(capacity) : null };
        if (!pre || teacherTouched) body.classTeacherId = teacherId; else if (pre) body.classTeacherId = pre.classTeacher ? pre.classTeacher.id : null;
        API.india.putClass(body).then(function (r) { made.push(r.class.label); next(i + 1); }, function (e) {
          save.setLoading(false);
          var text = St.message(e, t("students.save_failed"));
          (e && e.field === "capacity" ? cap : section).setError(made.length ? t("students.cls.form.partial", { done: made.join(", "), failed: list[i], message: text }) : text);
        });
      })(0);
    }
    hd = OL.ui.drawer.open({ title: pre ? t("students.cls.form.edit_title", { label: pre.label }) : t("students.cls.form.add_title"), width: 560, body: form, footer: [cancel, save] });
    setTimeout(function () { (pre ? room : grade).focus && (pre ? room : grade).focus(); }, 0);
  }

  /* ========================================================== the record */
  function drawRecord(host, env) {
    var API = St.api(), id = env.route.record, year = OL.url.get("year");
    var R = OL.templates.T3(host, {
      "class": "ol-students-rec", loading: t("students.cls.loading"),
      back: { label: t("tab.students.classes"), href: env.base + St.classListPath(), onClick: function () { env.go(St.classListPath()); } },
      tabs: TABS, tab: TABS.indexOf(env.route.recordTab) > -1 ? env.route.recordTab : "overview",
      tabLabel: function (k) { return t("students.cls.tab." + k); }, tabHref: function (k) { return env.base + St.classPath(id, k, year); },
      label: t("students.cls.tabs_label"), panelPrefix: "stcls",
      onTab: function (k) { try { history.replaceState(history.state, "", env.base + St.classPath(id, k, year) + location.hash); } catch (e) { /* no history */ } },
      paint: function (tab) { if (tab === "overview") overview(); else if (tab === "roster") roster(); else activity(); }
    });
    var panel = R.panel, card = R.card, S = { c: null, can: false, rows: null, err: null };

    function head() {
      var c = S.c;
      if (!c) { R.head(); return; }
      var more = [];
      if (S.can && c.strength) more.push({ label: t("students.cls.number_rolls"), icon: "list", onClick: function () { numberRolls(c); } });
      if (S.can) more.push({ label: t("students.cls.seat.add"), icon: "plus", onClick: function () { seat(c); } });
      if (S.can && c.strength) more.push({ label: t("students.cls.promote.menu"), icon: "arrow-right", onClick: function () { promote(c); } });
      more.push({ label: t("students.cls.see_students"), icon: "users", onClick: function () { env.go("students/directory?class=" + encodeURIComponent(c.label)); } });
      var pills = h("div", { class: "ol-students-peek__pills" }, over(c) ? OL.ui.pill.render({ label: t("students.cls.kpi.over"), tone: "danger" }) : null,
        !c.classTeacher ? OL.ui.pill.render({ label: t("students.cls.no_teacher"), tone: "warning" }) : null);
      R.head({
        title: c.label, subtitle: [t("students.cls.sub", { grade: c.grade, section: c.section }), c.programme, c.room ? t("students.cls.room_n", { room: c.room }) : null, yearName(c.year)].filter(Boolean).join(" · "),
        meta: pills,
        primary: S.can ? { label: t("students.cls.edit"), icon: "pencil", onClick: function () { openForm(env, c, c.year, load); } } : null, more: more
      });
      env.setRecord({ label: c.label });
    }

    function load() {
      S.err = null;
      R.busy();
      API.india.classes(year || undefined).then(function (r) {
        S.can = !!(r.can && r.can.write);
        S.c = r.classes.filter(function (x) { return x.id === id; })[0] || null;
        if (!S.c) { head(); R.fail(OL.ui.empty.render({ kind: "first", icon: "users", title: t("students.cls.not_found"), text: t("students.cls.not_found_text"), primary: { label: t("tab.students.classes"), onClick: function () { env.go(St.classListPath()); } } })); return; }
        head(); R.tabs();
        return API.directory.students({ "class": S.c.label, sort: "roll", size: "100", status: "enrolled" }).then(function (d) { S.rows = d.rows; }, function (e) { S.rows = []; S.rosterErr = e; }).then(function () { R.show(); });
      }, function (e) { S.err = e; head(); R.fail(failure(e, load)); });
    }

    function overview() {
      var c = S.c, rows = S.rows || [], num = OL.fmt.num;
      var gaps = rows.filter(function (r) { return r.blocked; }).length, consent = rows.filter(function (r) { return r.consent !== "verified" && r.consent !== "withdrawn"; }).length;
      var low = rows.filter(function (r) { return r.attendance && r.attendance.status === "below"; }).length;
      panel.appendChild(OL.ui.page.kpis([
        { label: t("students.cls.tile.strength"), value: c.capacity ? t("students.cls.strength_of", { n: num(c.strength), cap: num(c.capacity) }) : num(c.strength), context: c.capacity ? t("students.cls.tile.seats") : t("students.cls.kpi.no_seats") },
        { label: t("students.cls.tile.under75"), value: num(low), context: t("students.cls.kpi.under75_ctx") },
        { label: t("students.cls.tile.gaps"), value: num(gaps), context: t("students.cls.kpi.gaps_ctx") },
        { label: t("students.cls.tile.consent"), value: num(consent), context: t("students.cls.kpi.consent_ctx") }
      ], t("students.cls.tile.label")));
      panel.appendChild(card(t("students.cls.facts.title"), OL.ui.page.facts([
        { label: t("students.cls.facts.class"), value: c.grade }, { label: t("students.cls.facts.section"), value: c.section },
        { label: t("students.cls.facts.programme"), value: c.programme }, { label: t("students.cls.facts.stream"), value: c.stream },
        { label: t("students.cls.facts.teacher"), value: c.classTeacher ? c.classTeacher.name : null }, { label: t("students.cls.facts.room"), value: c.room },
        { label: t("students.cls.facts.capacity"), value: c.capacity == null ? null : num(c.capacity) }, { label: t("students.cls.facts.year"), value: yearName(c.year) }
      ])));
    }

    function roster() {
      var c = S.c;
      if (S.rosterErr) { panel.appendChild(failure(S.rosterErr, load)); return; }
      var cols2 = [
        { key: "roll", label: t("term.roll_no"), num: true, width: 90, mobile: "sub", value: function (r) { return r.rollNo; } },
        { key: "name", label: t("students.col.name"), width: 260, mobile: "title", value: function (r) { return r.name; }, render: function (r) {
          var a = h("a", { class: "ol-students-name", href: St.href(env, r.id), on: { click: function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); env.go(St.path(r.id)); } } },
            OL.ui.avatar.render({ name: r.name, id: r.id, size: 24 }), h("span", { class: "ol-students-name__n", text: r.name }));
          var w = St.warnPill(r.warning);
          return w ? h("span", { class: "ol-students-namecell" }, a, w) : a;
        } },
        { key: "adm", label: t("term.admission_no"), width: 150, mobile: "sub", value: function (r) { return r.admissionNo; } },
        { key: "gender", label: t("students.filter.gender"), width: 110, mobile: "hide", value: function (r) { return St.genderLabel(r.gender); } },
        { key: "house", label: t("term.house"), width: 120, mobile: "hide", value: function (r) { return r.house; } },
        { key: "attendance", label: t("students.col.attendance"), num: true, width: 170, mobile: "sub", value: function (r) { return r.attendance ? r.attendance.percent : null; }, render: function (r) { return St.attendanceCell(r.attendance); } },
        { key: "record", label: t("students.col.record"), width: 150, mobile: "status", value: function (r) { return r.gapCount; }, render: function (r) { return St.recordPill(r); } }
      ];
      panel.appendChild(h("div", { class: "ol-students-rec__tools" }, S.can ? OL.ui.button.render({ label: t("students.cls.seat.add"), icon: "plus", variant: "secondary", onClick: function () { seat(c); } }) : null,
        c.strength ? OL.ui.button.render({ label: t("students.cls.see_students"), icon: "users", variant: "secondary", onClick: function () { env.go("students/directory?class=" + encodeURIComponent(c.label)); } }) : null));
      panel.appendChild(OL.ui.table.render({ caption: t("students.cls.roster_caption", { label: c.label }), columns: cols2, rows: S.rows, rowKey: "id", sort: null, page: 1, pageSize: 100, total: S.rows.length,
        empty: { kind: "first", icon: "users", title: t("students.cls.roster_none"), text: t("students.cls.roster_none_text"), primary: S.can ? { label: t("students.cls.seat.add"), icon: "plus", onClick: function () { seat(c); } } : null },
        onOpen: function (r) { env.go(St.path(r.id)); } }));
    }

    function activity() {
      panel.appendChild(OL.ui.skeleton.render({ type: "lines", n: 5 }));
      API.audit.list({ record: id, size: 50 }).then(function (r) {
        if (R.tab !== "activity") return;
        OL.clear(panel);
        if (!r.events.length) { panel.appendChild(OL.ui.empty.render({ kind: "first", icon: "clock", title: t("students.cls.activity.none"), text: t("students.cls.activity.none_text") })); return; }
        panel.appendChild(card(t("students.cls.tab.activity"), St.timeline(r.events, "class")));
      }, function (e) {
        if (R.tab !== "activity") return;
        OL.clear(panel);
        panel.appendChild(e && e.status === 403 ? OL.ui.empty.render({ kind: "denied", title: t("students.activity.denied"), text: t("students.activity.denied_text") }) : failure(e, function () { OL.clear(panel); activity(); }));
      });
    }

    /* --------------------------------------------------------- the actions */
    function numberRolls(c) {
      OL.ui.modal.confirm({ title: t("students.cls.number.title", { label: c.label }), text: t("students.cls.number.text"), confirmLabel: t("students.cls.number.go") }).then(function (yes) {
        if (!yes) return;
        API.india.numberRolls(c.id, "name").then(function (r) { OL.ui.toast.show({ text: t("students.cls.number.done", { n: r.numbered }) }); load(); },
          function (e) { OL.ui.toast.show({ text: St.message(e, t("students.save_failed")), tone: "error" }); });
      });
    }

    function seat(c) {
      var hd, picked = {}, all = [], count = h("span", { class: "ol-students-seat__n", "aria-live": "polite" });
      var list = h("div", { class: "ol-students-seat" }), body = h("div", { class: "ol-students-form" });
      var go = OL.ui.button.render({ label: t("students.cls.seat.go", { n: 0 }), variant: "primary", disabled: true, disabledReason: t("students.cls.seat.pick_one"), onClick: function () {
        var ids = Object.keys(picked);
        go.setLoading(true);
        API.india.seat(c.id, ids).then(function (r) { hd.close(); OL.ui.toast.show({ text: t("students.cls.seat.done", { n: r.seated, label: c.label }) }); load(); },
          function (e) { go.setLoading(false); OL.ui.toast.show({ text: St.message(e, t("students.save_failed")), tone: "error" }); });
      } });
      function paintList(text) {
        OL.clear(list);
        var shown = all.filter(function (s) { return !text || s.name.toLowerCase().indexOf(text.toLowerCase()) > -1; });
        if (!shown.length) { list.appendChild(h("p", { class: "ol-students-seat__none", text: all.length ? t("students.cls.seat.no_match") : t("students.cls.seat.none") })); return; }
        shown.slice(0, 200).forEach(function (s) {
          list.appendChild(OL.ui.check.box({ label: s.name, checked: !!picked[s.id], onChange: function (on) {
            if (on) picked[s.id] = 1; else delete picked[s.id];
            var n = Object.keys(picked).length, lab = go.querySelector(".ol-btn__label");
            if (lab) lab.textContent = t("students.cls.seat.go", { n: n });
            go.setDisabled(!n, t("students.cls.seat.pick_one")); count.textContent = n ? t("table.n_selected", { n: OL.fmt.num(n) }) : "";
          } }));
        });
      }
      var search = OL.ui.input.render({ label: t("students.cls.seat.search"), name: "q", onInput: function (v) { paintList(v.trim()); } });
      OL.append(body, [h("p", { class: "ol-students-seat__sub", text: t("students.cls.seat.sub") }), search, count, list]);
      list.appendChild(OL.ui.skeleton.render({ type: "lines", n: 6 }));
      API.india.unplaced().then(function (r) { all = r.students || []; paintList(""); }, function (e) { OL.clear(list); list.appendChild(failure(e, function () { hd.close(); seat(c); })); });
      hd = OL.ui.drawer.open({ title: t("students.cls.seat.title", { label: c.label }), width: 560, body: body, footer: [OL.ui.button.render({ label: t("common.cancel"), variant: "secondary", onClick: function () { hd.close(); } }), go] });
    }

    function promote(c) {
      var hd, next = shiftYear(c.year, 1), target = null, rolls = "name";
      var body = h("div", { class: "ol-students-form" }), slot = h("div");
      var go = OL.ui.button.render({ label: t("students.cls.promote.go"), variant: "primary", disabled: true, disabledReason: t("students.cls.promote.need_target"), onClick: function () {
        go.setLoading(true);
        API.india.promote(c.id, { toClassId: target, rolls: rolls }).then(function (r) { hd.close(); OL.ui.toast.show({ text: t("students.cls.promote.done", { n: r.moved, to: r.to }) }); load(); },
          function (e) { go.setLoading(false); OL.ui.toast.show({ text: St.message(e, t("students.save_failed")), tone: "error" }); });
      } });
      body.appendChild(h("p", { class: "ol-students-seat__sub", text: t("students.cls.promote.sub", { label: c.label, year: yearName(next) }) }));
      body.appendChild(slot);
      API.india.classes(next).then(function (r) {
        if (!r.classes.length) { slot.appendChild(OL.ui.banner.render({ tone: "info", text: t("students.cls.promote.none", { year: yearName(next) }) })); return; }
        slot.appendChild(OL.ui.select.render({ label: t("students.cls.promote.to"), options: r.classes.map(function (x) { return { value: x.id, label: x.label + (x.programme ? " · " + x.programme : ""), sub: t("students.cls.promote.now", { n: x.strength }) }; }),
          placeholder: t("students.cls.promote.choose"), searchable: true, onChange: function (v) { target = v; go.setDisabled(!v, t("students.cls.promote.need_target")); } }));
        slot.appendChild(OL.ui.check.radios({ label: t("students.cls.promote.rolls"), value: rolls, options: [{ value: "name", label: t("students.cls.promote.rolls_name") }, { value: "none", label: t("students.cls.promote.rolls_none") }], onChange: function (v) { rolls = v; } }));
      }, function (e) { slot.appendChild(failure(e, function () { hd.close(); promote(c); })); });
      hd = OL.ui.drawer.open({ title: t("students.cls.promote.title", { label: c.label }), width: 560, body: body, footer: [OL.ui.button.render({ label: t("common.cancel"), variant: "secondary", onClick: function () { hd.close(); } }), go] });
    }

    head();
    load();
  }

  St.classes = { drawList: drawList, drawRecord: drawRecord };
})();
