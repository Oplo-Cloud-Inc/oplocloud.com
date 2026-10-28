/* ==========================================================================
   Students › Guardians — template T2, with a quick look and an Add drawer.

   Every parent and guardian, the students they are linked to, and who has signed
   in; or, with the view switch, the students nobody is linked to. A click on a
   row opens the guardian beside the list (the full context for a family is the
   student's own page). The number is masked until someone asks and asking is
   written to the audit log; an email is masked and stays masked.

   The address is the state: ?view=no-guardian&q=&app=invited&class=X-C&relation=
   Father&sort=&page=&peek=acc_123. The server filters, sorts and counts
   (services/guardians.js); this file draws what it sends.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var St = OL.students = OL.students || {};

  var KEYS = ["view", "q", "app", "class", "relation", "sort", "dir", "page"];
  var csv = function (v) { return v ? String(v).split(",").filter(Boolean) : []; };
  /* what the office says → the relation the server keeps, and the word the family used */
  var RELATIONS = [["father", "parent", "Father"], ["mother", "parent", "Mother"], ["guardian", "guardian", null], ["grandparent", "grandparent", null], ["relative", "relative", null], ["other", "other", null]];

  var denied = function () { return { title: t("students.gd.denied"), text: t("students.gd.denied_text") }; };
  function failure(e, retry) { return OL.templates.failure(e, { retry: retry, denied: denied(), message: St.message }); }

  /* ============================================================= the list */
  function drawList(host, env) {
    var API = St.api();
    // the toolbar is drawn once more when the first answer brings the facets; the template does the rest
    var S = OL.templates.T2(host, {
      "class": "ol-students-gd", keys: KEYS,
      answer: function (q) { return API.directory.guardians(q); },
      announce: function (r) { return t("students.gd.announce", { n: r.total }); },
      onFirst: function () { var id = OL.url.get("peek"); if (id && !lonely()) openPeek(id); },
      message: St.message, denied: denied,
      head: head, kpis: kpis, kpiLabel: t("students.gd.kpi.label"), kpiN: 5, tools: paintTools, tokens: paintTokens, table: tableOf
    });
    Object.assign(S, { search: null, peek: null });
    var setQ = S.set, load = S.load;
    var lonely = function () { return S.q.view === "no-guardian"; };
    var hasFilters = function () { return !!(S.q.q || S.q.app || S.q["class"] || S.q.relation); };
    function clearAll() { if (S.search) S.search.set(""); setQ({ q: null, app: null, "class": null, relation: null }, true); }
    var can = function () { return !!(S.data && S.data.can && S.data.can.write); };

    function head() {
      return {
        title: env.title || t("tab.students.guardians"), subtitle: t("students.gd.subtitle"),
        primary: can() ? { label: t("students.gd.add"), icon: "plus", onClick: function () { openAdd(env, null, load); } } : null
      };
    }

    function kpis() {
      var k = S.data.kpis, num = OL.fmt.num;
      var toggle = function (key, v) { return function () { setQ((function (o) { o.view = null; o[key] = S.q[key] === v ? null : v; return o; })({}), true); }; };
      return [
        { label: t("students.gd.kpi.guardians"), value: num(k.guardians), context: t("students.gd.kpi.guardians_ctx"), onClick: clearAll, selected: !lonely() && !hasFilters() },
        { label: t("students.gd.kpi.lonely"), value: num(k.withoutGuardian), context: t("students.gd.kpi.lonely_ctx"), onClick: function () { setQ({ view: lonely() ? null : "no-guardian", app: null }, true); }, selected: lonely() },
        { label: t("students.gd.kpi.no_mobile"), value: num(k.noMobile), context: t("students.gd.kpi.no_mobile_ctx") },
        { label: t("students.gd.kpi.invited"), value: num(k.invited), context: t("students.gd.kpi.invited_ctx"), onClick: toggle("app", "invited"), selected: S.q.app === "invited" },
        { label: t("students.gd.kpi.active"), value: num(k.active), context: t("students.gd.kpi.active_ctx"), onClick: toggle("app", "active"), selected: S.q.app === "active" }
      ];
    }

    /* ---------------------------------------------------------- toolbar */
    function multi(key, label, list) {
      return OL.ui.select.render({ label: label, options: (list || []).map(function (v) { return { value: v, label: v }; }), values: csv(S.q[key]), multiple: true, clearable: true, searchable: true,
        placeholder: t("students.any"), class: "ol-t2__f", onChange: function (vals) { setQ((function (o) { o[key] = vals.join(","); return o; })({}), false); } });
    }
    function paintTools() {
      var d = S.data, fac = d ? d.facets : { classes: [], relations: [] };
      S.search = OL.ui.page.search({ label: t("students.gd.search_label"), placeholder: t(lonely() ? "students.gd.search_lonely" : "students.gd.search"), value: S.q.q || "", onInput: function (v) { if (v !== (S.q.q || "")) setQ({ q: v }, false); } });
      var fields = [S.search];
      if (d) {
        fields.push(multi("class", t("students.gd.filter.class"), fac.classes));
        if (!lonely()) fields.push(multi("relation", t("students.gd.filter.relation"), fac.relations));
      }
      var view = OL.ui.segmented.render({ label: t("students.gd.view_label"), value: lonely() ? "no-guardian" : "guardians",
        items: [{ value: "guardians", label: t("students.gd.view.guardians") }, { value: "no-guardian", label: t("students.gd.view.no_guardian") }],
        onChange: function (v) { setQ({ view: v === "no-guardian" ? "no-guardian" : null, app: null, relation: null, sort: null, dir: null }, true); } });
      var bits = S.toolbar({ fields: fields, end: view, chips: true });
      S.chipsEl = bits.chips; S.tokensEl = bits.tokens;
      paintTokens();
    }
    function paintChips() {
      if (!S.chipsEl) return;
      OL.clear(S.chipsEl);
      if (lonely()) return;
      var c = S.data ? S.data.counts : {};
      S.chipsEl.appendChild(OL.ui.chips.render({ label: t("students.gd.chips_label"), value: S.q.app || "all",
        items: [{ value: "all", label: t("common.all"), count: S.data ? c.all : null }, { value: "invited", label: t("students.gd.chip.invited"), count: S.data ? c.invited : null }, { value: "active", label: t("students.gd.chip.active"), count: S.data ? c.active : null }],
        onChange: function (v) { setQ({ app: v === "all" ? null : v }, false); paintChips(); } }));
    }
    function paintTokens() {
      if (!S.tokensEl) return;
      OL.clear(S.tokensEl);
      if (hasFilters()) S.tokensEl.appendChild(OL.ui.button.render({ label: t("common.clear_filters"), variant: "link", onClick: clearAll }));
      paintChips();
    }

    /* ------------------------------------------------------------- table */
    var student = function (s) {
      return h("a", { class: "ol-students-chip", href: St.href(env, s.id), title: s.name, on: { click: function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); env.go(St.path(s.id)); } } },
        s.name + (s.classLabel ? " · " + s.classLabel : ""));
    };
    var gCols = [
      { key: "name", label: t("students.gd.col.guardian"), sort: true, width: 260, mobile: "title", value: function (g) { return g.name; }, render: function (g) {
        return h("span", { class: "ol-students-namecell" }, OL.ui.avatar.render({ name: g.name, id: g.id, size: 24 }), h("span", { class: "ol-students-name__n", text: g.name }), h("span", { class: "ol-students-gd__rel", text: g.relations.join(", ") }));
      } },
      { key: "students", label: t("students.gd.col.students"), sort: true, width: 340, mobile: "sub", value: function (g) { return g.students.map(function (s) { return s.name; }).join(", "); }, render: function (g) {
        var shown = g.students.slice(0, 2), more = g.studentCount - shown.length;
        return h("span", { class: "ol-students-gd__kids" }, shown.map(student), more > 0 ? h("span", { class: "ol-students-gd__more", text: t("students.gd.more", { n: more }) }) : null);
      } },
      { key: "phone", label: t("students.gd.col.mobile"), width: 150, mobile: "sub", value: function (g) { return g.phone; } },
      { key: "email", label: t("students.gd.col.email"), width: 200, mobile: "hide", value: function (g) { return g.email; } },
      { key: "app", label: t("students.gd.col.app"), sort: true, width: 150, mobile: "status", value: function (g) { return g.app; }, render: function (g) { return OL.ui.pill.render({ status: g.app === "active" ? "active" : "invited" }); } }
    ];
    var lCols = [
      { key: "name", label: t("students.gd.col.student"), sort: true, width: 280, mobile: "title", value: function (r) { return r.name; }, render: function (r) {
        return h("a", { class: "ol-students-name", href: St.href(env, r.id), on: { click: function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); env.go(St.path(r.id)); } } },
          OL.ui.avatar.render({ name: r.name, id: r.id, size: 24 }), h("span", { class: "ol-students-name__n", text: r.name }));
      } },
      { key: "class", label: t("term.class"), width: 110, mobile: "sub", value: function (r) { return r.classLabel; } },
      { key: "adm", label: t("term.admission_no"), width: 160, mobile: "sub", value: function (r) { return r.admissionNo; } },
      { key: "admitted", label: t("students.gd.col.admitted"), width: 140, mobile: "hide", value: function (r) { return r.admittedOn ? OL.fmt.date(r.admittedOn) : null; } },
      { key: "act", label: t("students.gd.col.action"), width: 170, mobile: "status", render: function (r) {
        return can() ? OL.ui.button.render({ label: t("students.gd.add"), variant: "secondary", size: "sm", onClick: function () { openAdd(env, { id: r.id, name: r.name, sub: r.classLabel || "" }, load); } }) : null;
      } }
    ];
    function emptyState() {
      if (!S.data) return { kind: "first", title: t("table.empty") };
      if (hasFilters()) return { kind: "filtered", title: t("students.gd.none_match"), text: t("students.gd.none_match_text"), onClear: clearAll };
      if (lonely()) return { kind: "first", icon: "users", title: t("students.gd.lonely_title"), text: t("students.gd.lonely_text") };
      return { kind: "first", icon: "users", title: t("students.gd.first_title"), text: t("students.gd.first_text"),
        primary: can() ? { label: t("students.gd.add"), icon: "plus", onClick: function () { openAdd(env, null, load); } } : null };
    }
    // the two views are two different tables: the template makes the other one when the key changes
    function tableOf() {
      var d = S.data;
      return { key: lonely() ? "lonely" : "guardians",
        config: {
          caption: t(lonely() ? "students.gd.caption_lonely" : "students.gd.caption"), columns: lonely() ? lCols : gCols, rowKey: "id", pageSize: 50,
          onSort: function (key, dir) { setQ({ sort: key, dir: dir }, false); },
          onPage: function (n) { setQ({ page: String(n) }, false); },
          onOpen: function (r) { if (lonely()) env.go(St.path(r.id)); else openPeek(r.id); }
        },
        state: { rows: d ? d.rows : [], total: d ? d.total : 0, page: d ? d.page : 1, sort: { key: S.q.sort || "name", dir: S.q.dir === "desc" ? "desc" : "asc" }, empty: emptyState() } };
    }

    /* --------------------------------------------------------- quick look */
    function openPeek(id) {
      if (S.peek) { S.peek.close(); }
      S.peek = peek(env, id, can, load, function () { S.peek = null; });
    }

    S.start();
  }

  /* ========================================================== the quick look */
  /* One guardian beside the list: who they are, the children they are linked to, and the number behind a button. */
  function peek(env, id, can, changed, closed) {
    var API = St.api(), hd, seq = 0;
    hd = OL.ui.drawer.open({ title: t("students.gd.peek_title"), width: 560, body: OL.ui.skeleton.render({ type: "lines", n: 8 }), url: { param: "peek", value: id }, onClose: function () { hd = null; seq++; if (closed) closed(); } });
    (function show() {
      var n = ++seq;
      API.directory.guardian(id).then(function (r) {
        if (n !== seq || !hd) return;
        var g = r.guardian;
        hd.setTitle(g.name);
        var body = h("div", { class: "ol-students-peek" });
        body.appendChild(h("div", { class: "ol-students-peek__pills" }, OL.ui.pill.render({ status: g.app === "active" ? "active" : "invited" })));
        body.appendChild(OL.ui.page.facts([
          { label: t("students.gd.peek.relation"), value: g.relations.join(", ") },
          { label: t("students.gd.peek.email"), value: g.email },
          { label: t("students.gd.peek.language"), value: g.language },
          { label: t("students.gd.peek.whatsapp"), value: g.whatsapp === 1 ? t("common.yes") : g.whatsapp === 0 ? t("common.no") : t("students.gd.peek.not_asked") }
        ]));
        body.appendChild(h("h3", { class: "ol-students-gd__h", text: t("students.gd.peek.mobile") }));
        body.appendChild(numbers(g));
        body.appendChild(h("h3", { class: "ol-students-gd__h", text: t("students.gd.peek.students", { n: g.students.length }) }));
        body.appendChild(h("ul", { class: "ol-students-gd__list" }, g.students.map(function (s) {
          return h("li", null, h("a", { class: "ol-link", href: St.href(env, s.id), on: { click: function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); if (hd) hd.close(); env.go(St.path(s.id)); } } }, s.name),
            h("span", { class: "ol-students-gd__rel", text: [s.classLabel, s.relation].filter(Boolean).join(" · ") }));
        })));
        hd.setBody(body);
      }, function (e) {
        if (n !== seq || !hd) return;
        hd.setBody(e && e.status === 404 ? OL.ui.empty.render({ kind: "first", icon: "users", title: t("students.gd.not_found"), text: t("students.gd.not_found_text") }) : failure(e, show));
      });
    })();

    /* the number is masked until asked for; asking is written down */
    function numbers(g) {
      if (!g.phones.length) return h("p", { class: "ol-students-gd__none", text: t("students.gd.peek.no_number") });
      var wrap = h("ul", { class: "ol-students-contacts" });
      g.phones.forEach(function (p) {
        var num = h("span", { class: "ol-students-contact__num", text: p.phone }), acts = h("span", { class: "ol-students-contact__act" }), timer = null;
        var show = OL.ui.button.render({ label: t("students.gd.peek.show"), icon: "eye", variant: "secondary", size: "sm", onClick: function () {
          show.setLoading(true);
          API.directory.guardianPhone(g.id, p.which).then(function (r) {
            var digits = String(r.phone).replace(/\D/g, "");
            num.textContent = OL.fmt.phone(r.phone); OL.clear(acts);
            acts.appendChild(OL.ui.button.render({ label: t("students.contact.call"), icon: "phone", variant: "secondary", size: "sm", href: "tel:" + digits }));
            clearTimeout(timer); timer = setTimeout(function () { if (num.isConnected) { num.textContent = p.phone; OL.clear(acts); acts.appendChild(show); show.setLoading(false); } }, 60000);
          }, function (e) { show.setLoading(false); OL.ui.toast.show({ text: St.message(e, t("students.contact.show_failed")), tone: "error" }); });
        } });
        acts.appendChild(show);
        wrap.appendChild(h("li", { class: "ol-students-contact" }, h("div", { class: "ol-students-contact__who" }, h("strong", { text: t("students.gd.peek.phone_" + p.which) })), h("div", { class: "ol-students-contact__line" }, num, acts)));
      });
      return wrap;
    }
    return { close: function () { if (hd) hd.close(); } };
  }

  /* ============================================================ add a guardian */
  /* A guardian linked to one or more students, in a drawer. A new email makes an invited account; one that has an account is linked as it is. */
  function openAdd(env, pre, done) {
    var API = St.api(), hd, dirty = false;
    var mark = function () { dirty = true; if (hd) hd.setDirty(true); };
    var picked = pre ? [{ id: pre.id, name: pre.name }] : [];
    var students = OL.ui.people.render({ label: t("students.gd.add_form.students"), kind: "student", multiple: true, values: picked, helper: t("students.gd.add_form.students_help"),
      search: function (text) { return API.search.query(text, ["student"]).then(function (r) { var g = (r.groups || [])[0]; return g ? g.items.map(function (x) { return { id: x.id, name: x.title, sub: x.meta && x.meta.class || "" }; }) : []; }); },
      onChange: function (people) { picked = people; mark(); } });
    var name = OL.ui.input.render({ label: t("students.gd.add_form.name"), name: "name", maxLength: 120, optional: true, helper: t("students.gd.add_form.name_help"), onInput: mark });
    var email = OL.ui.input.render({ label: t("students.gd.add_form.email"), name: "email", inputMode: "email", maxLength: 120, onInput: mark });
    var relation = null;
    var rel = OL.ui.select.render({ label: t("students.gd.add_form.relation"), options: RELATIONS.map(function (r) { return { value: r[0], label: t("students.gd.relation." + r[0]) }; }), placeholder: t("students.choose"), onChange: function (v) { relation = v; mark(); } });
    var mobile = OL.ui.input.render({ label: t("students.gd.add_form.mobile"), name: "cellPhone", inputMode: "tel", maxLength: 20, optional: true, helper: t("students.help.fatherPhone"), onInput: mark });
    var form = h("form", { class: "ol-students-form", novalidate: true }, students, h("div", { class: "ol-students-grid" }, name, email, rel, mobile));
    var save = OL.ui.button.render({ label: t("students.gd.add"), variant: "primary", onClick: function () { submit(); } });
    form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    form.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target && e.target.tagName === "INPUT" && !e.target.closest(".ol-select, .ol-people")) { e.preventDefault(); submit(); } });

    function submit() {
      [students, name, email, rel, mobile].forEach(function (f) { if (f.setError) f.setError(""); });
      var em = String(email.value || "").trim();
      if (!picked.length) { students.setError(t("students.gd.add_form.error_students")); return; }
      if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(em)) { email.setError(t("students.error.email")); email.focus(); return; }
      var r = RELATIONS.filter(function (x) { return x[0] === relation; })[0];
      if (!r) { rel.setError(t("students.gd.add_form.error_relation")); return; }
      var body = { studentIds: picked.map(function (p) { return p.id; }), email: em, relation: r[1] };
      if (r[2]) body.label = r[2];
      if (name.value.trim()) body.name = name.value.trim();
      if (mobile.value.trim()) body.cellPhone = mobile.value.trim();
      save.setLoading(true);
      API.directory.addGuardian(body).then(function (res) {
        dirty = false; hd.setDirty(false); hd.close();
        OL.ui.toast.show({ text: t(res.created ? "students.gd.added_new" : "students.gd.added", { name: res.guardian.name, n: res.guardian.studentCount }) });
        done();
      }, function (e) {
        save.setLoading(false);
        var field = e && e.field, text = St.message(e, t("students.save_failed"));
        var target = field === "studentIds" ? students : field === "name" ? name : field === "email" ? email : field === "relation" ? rel : field === "cellPhone" ? mobile : (e && e.status === 400 && !picked.length ? students : email);
        target.setError(text); if (target.focus) target.focus();
      });
    }
    hd = OL.ui.drawer.open({ title: t("students.gd.add"), width: 560, body: form, footer: [OL.ui.button.render({ label: t("common.cancel"), variant: "secondary", onClick: function () { hd.close(); } }), save] });
    setTimeout(function () { (pre ? email : students).focus && (pre ? email : students).focus(); }, 0);
  }

  St.guardians = { drawList: drawList };
})();
