/* ==========================================================================
   Students › the record — template T3, a whole page for one student.

   /admin/students/directory/{id}/{tab}. A student is not a popup: this is a
   page with an address, a Back that works and a header that says who it is.
   The main column is tabs (Overview, Attendance, Marks, Family, Record,
   Activity); the side column is what is wrong and who to ask. Switching a tab
   changes the address and the panel and nothing else, so it is instant and a
   refresh lands on the same tab.

   Edit is the form page (form.js), not a sheet over this one.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var St = OL.students = OL.students || {};

  var TABS = ["overview", "attendance", "marks", "family", "record", "activity"];

  function draw(host, env) {
    var API = St.api(), id = env.route.record;
    var back = { label: t("tab.students.directory"), href: env.base + St.listPath(), onClick: function () { env.go(St.listPath()); } };
    var R = OL.templates.T3(host, {
      "class": "ol-students-rec", loading: t("students.loading"), back: back, side: { label: t("students.side_label") },
      tabs: TABS, tab: TABS.indexOf(env.route.recordTab) > -1 ? env.route.recordTab : "overview",
      tabLabel: function (k) { return t("students.tab." + k); }, tabHref: function (k) { return St.href(env, id, k); },
      label: t("students.tabs_label"), panelPrefix: "strec",
      onTab: function (k) { St.setTab(env, id, k); },
      paint: paintTab
    });
    var panel = R.panel, side = R.side, card = R.card, S = { rec: null, err: null };

    function head() {
      var r = S.rec, s = r && r.student;
      if (!s) { R.head(); return; }
      var pills = h("div", { class: "ol-students-peek__pills" }, OL.ui.pill.render({ status: s.status === "left" ? "left" : "enrolled" }), St.attendancePill(s.attendance), St.warnPill(s.warning));
      R.head({
        title: s.name, subtitle: St.sub(s), meta: pills,
        primary: r.can.write ? { label: t("students.edit"), icon: "pencil", onClick: function () { env.go(St.path(id, "edit")); } } : null,
        secondary: [{ label: t("students.message_family"), icon: "send", onClick: messageFamily }],
        more: [{ label: t("students.issue_certificate"), icon: "file-text", onClick: function () { env.go("students/certificates"); } }]
      });
      env.setRecord({ label: s.name });
    }

    function load() {
      S.err = null;
      R.busy();
      API.directory.record(id).then(function (r) {
        S.rec = r; head(); paintSide(); R.tabs(); R.show();
      }, function (e) {
        S.err = e; head();
        R.fail(e && e.status === 404 ? OL.ui.empty.render({ kind: "first", icon: "user", title: t("students.not_found"), text: t("students.not_found_text"), primary: { label: t("tab.students.directory"), onClick: back.onClick } })
          : OL.templates.failure(e, { retry: load, denied: { title: t("students.denied"), text: t("students.denied_text") }, message: St.message }));
      });
    }

    /* ---------------------------------------------------------------- the side */
    function paintSide() {
      OL.clear(side);
      var r = S.rec, s = r.student;
      var al = St.alerts(r);
      if (al) side.appendChild(card(t("students.side.alerts"), al));
      var gaps = St.gaps(r, env);
      if (gaps) side.appendChild(card(t("students.side.fix"), gaps));
      var fam = h("div", { class: "ol-students-side__family" },
        h("p", { text: r.family.linked ? t("students.side.family_linked", { n: r.family.linked, active: OL.fmt.num(r.family.active) }) : t("students.side.family_none") }),
        OL.ui.button.render({ label: t("students.side.family_open"), variant: "link", onClick: function () { env.go("students/guardians"); } }));
      side.appendChild(card(t("students.side.guardians"), fam));
      side.appendChild(card(t("students.side.team"), OL.ui.page.facts([
        { label: t("students.fact.class_teacher"), value: r.classTeacher ? r.classTeacher.name : null },
        { label: t("term.class"), value: s.classLabel }
      ])));
    }

    /* ------------------------------------------------------------------- tabs */
    function paintTab(tab) {
      var r = S.rec;
      if (tab === "overview") {
        panel.appendChild(St.tiles(r));
        if (r.early && r.early.signals.length) panel.appendChild(card(t("students.overview.why"), h("ul", { class: "ol-students-list" }, r.early.signals.map(function (g) { return h("li", { text: g.text }); }))));
        panel.appendChild(card(t("students.overview.about"), St.about(r)));
      } else if (tab === "attendance") panel.appendChild(attendance(r));
      else if (tab === "marks") panel.appendChild(marks(r));
      else if (tab === "family") panel.appendChild(card(t("students.tab.family"), St.contacts(r, env)));
      else if (tab === "record") panel.appendChild(card(t("students.tab.record"), St.records(r)));
      else activity();
    }

    function attendance(r) {
      var s = r.standing;
      if (!s || !s.total) return OL.ui.empty.render({ kind: "first", icon: "calendar-check", title: t("students.att.none"), text: t("students.att.none_text"),
        primary: { label: t("students.att.open"), onClick: function () { env.go("attendance/registers"); } } });
      var F = OL.fmt;
      return card(t("students.tab.attendance"), OL.ui.page.facts([
        { label: t("students.tile.attendance"), node: h("span", null, F.pct(s.percent, 1), " ", St.attendancePill({ status: s.status, percent: s.percent })) },
        { label: t("students.att.marked"), value: F.num(s.total) },
        { label: t("students.att.present"), value: F.num(s.attended) },
        { label: t("students.att.leave"), value: F.num(s.excused) },
        { label: t("students.att.absent"), value: F.num(s.absent) },
        { label: t("students.att.with_leave"), value: s.percentWithLeave == null ? null : F.pct(s.percentWithLeave, 1) },
        { label: s.canMiss != null && s.canMiss >= 0 ? t("students.att.can_miss") : t("students.att.must_attend"), value: s.canMiss != null && s.canMiss >= 0 ? F.num(s.canMiss) : F.num(s.mustAttend) }
      ]));
    }

    function marks(r) {
      var l = r.latest;
      if (!l) return OL.ui.empty.render({ kind: "first", icon: "clipboard-check", title: t("students.marks.none"), text: t("students.marks.none_text"),
        primary: { label: t("students.marks.open"), onClick: function () { env.go("exams/results"); } } });
      return card(t("students.tab.marks"), OL.ui.page.facts([
        { label: t("students.marks.exam"), value: l.name },
        { label: t("students.tile.result"), value: OL.fmt.pct(l.percent, 1) },
        { label: t("students.marks.pass_line"), value: l.passLine == null ? null : OL.fmt.pct(l.passLine, 0) },
        { label: t("students.marks.state"), node: l.passLine == null ? null : OL.ui.pill.render({ status: l.percent >= l.passLine ? "complete" : "failed", label: l.percent >= l.passLine ? t("students.marks.pass") : t("students.marks.below") }) }
      ]));
    }

    /* The audit log of this record: who touched it and what they changed. */
    function activity() {
      panel.appendChild(OL.ui.skeleton.render({ type: "lines", n: 5 }));
      API.audit.list({ record: id, size: 50 }).then(function (r) {
        if (R.tab !== "activity") return;
        OL.clear(panel);
        if (!r.events.length) { panel.appendChild(OL.ui.empty.render({ kind: "first", icon: "clock", title: t("students.activity.none"), text: t("students.activity.none_text") })); return; }
        panel.appendChild(card(t("students.tab.activity"), St.timeline(r.events, "student")));
      }, function (e) {
        if (R.tab !== "activity") return;
        OL.clear(panel);
        panel.appendChild(e && e.status === 403 ? OL.ui.empty.render({ kind: "denied", title: t("students.activity.denied"), text: t("students.activity.denied_text") })
          : OL.ui.banner.render({ tone: "danger", text: St.message(e), actions: OL.ui.button.render({ label: t("common.retry"), variant: "secondary", size: "sm", onClick: function () { OL.clear(panel); activity(); } }) }));
      });
    }

    /* ---------------------------------------------------- message the family */
    function messageFamily() {
      var dlg;
      var title = OL.ui.input.render({ label: t("students.bulk.subject"), name: "title", maxLength: 120 });
      var body = OL.ui.input.render({ label: t("students.bulk.text"), name: "body", multiline: true, rows: 4, maxLength: 800 });
      var go = OL.ui.button.render({ label: t("students.bulk.send"), variant: "primary", onClick: function () {
        if (!title.value.trim()) { title.setError(t("students.required")); return; }
        if (!body.value.trim()) { body.setError(t("students.required")); return; }
        go.setLoading(true);
        API.directory.bulkMessage({ ids: [id], title: title.value.trim(), body: body.value.trim() }).then(function () {
          dlg.close(); OL.ui.toast.show({ text: t("students.message_sent") });
        }, function (e) { go.setLoading(false); body.setError(St.message(e, t("students.save_failed"))); });
      } });
      dlg = OL.ui.modal.open({ title: t("students.message_family"), width: 520, body: h("div", { class: "ol-students-form" }, title, body),
        actions: [OL.ui.button.render({ label: t("common.cancel"), variant: "secondary", onClick: function () { dlg.close(); } }), go] });
    }

    head();
    load();
  }

  St.record = { draw: draw };
})();
