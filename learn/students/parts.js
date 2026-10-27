/* ==========================================================================
   Students — the parts of a student the quick look and the record both draw:
   alerts, the three number tiles, facts, who to call, what needs fixing. One
   place, so the two never say different things about the same child.

   Every function takes the answer of GET /directory/students/:id (`rec`).
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var St = OL.students = OL.students || {};

  St.alerts = function (rec) {
    var wrap = h("div", { class: "st-alerts" });
    rec.alerts.forEach(function (a) {
      var tone = a.level === "danger" ? "danger" : a.level === "warning" ? "warning" : "info", text;
      if (a.key === "attendance") text = t("students.alert.attendance", { percent: OL.fmt.pct(a.percent, 1) });
      else if (a.key === "attendance_watch") text = t("students.alert.attendance_watch", { percent: OL.fmt.pct(a.percent, 1), n: Math.max(0, a.canMiss) });
      else if (a.key === "consent") text = t("students.alert.consent");
      else if (a.key === "early_warning") text = t(a.level === "danger" ? "students.alert.early_high" : "students.alert.early_medium");
      else text = t("students.alert.cwsn");
      wrap.appendChild(OL.ui.banner.render({ tone: tone, text: text, class: "st-alert" }));
    });
    return wrap.childNodes.length ? wrap : null;
  };

  St.tiles = function (rec) {
    var s = rec.standing, e = rec.early, l = rec.latest;
    return OL.ui.page.kpis([
      { label: t("students.tile.attendance"), value: s && s.total ? OL.fmt.pct(s.percent, 1) : null,
        context: s && s.total ? t("students.tile.days_marked", { n: s.total }) : t("students.tile.not_marked") },
      { label: t("students.tile.warning"), value: e ? t("students.level." + e.level) : null, context: e ? t("students.tile.warning_ctx", { n: e.signals.length }) : t("students.tile.no_reading") },
      { label: t("students.tile.result"), value: l ? OL.fmt.pct(l.percent, 1) : null, context: l ? l.name : t("students.tile.no_result") }
    ], t("students.tile.label"));
  };

  /* The facts a front desk is asked for, in the order they are asked. */
  St.about = function (rec) {
    var s = rec.student, F = OL.fmt;
    return OL.ui.page.facts([
      { label: t("students.fact.dob"), value: s.dob ? F.date(s.dob) : null },
      { label: t("students.filter.gender"), value: St.genderLabel(s.gender) },
      { label: t("students.filter.category"), value: s.category },
      { label: t("term.house"), value: s.house },
      { label: t("term.admission_no"), value: s.admissionNo },
      { label: t("students.fact.admitted"), value: s.admittedOn ? F.date(s.admittedOn) : null },
      { label: t("students.fact.class_teacher"), value: rec.classTeacher ? rec.classTeacher.name : null },
      { label: t("students.filter.stream"), value: s.stream },
      { label: t("students.fact.mother_tongue"), value: s.motherTongue },
      { label: t("students.filter.blood"), value: s.bloodGroup },
      { label: t("students.filter.transport"), value: s.transport },
      { label: t("students.fact.address"), value: [s.address, s.district, s.state, s.pin].filter(Boolean).join(", ") || null }
    ]);
  };

  /* Government records: what the school holds, never the whole of an Aadhaar number. */
  St.records = function (rec) {
    var s = rec.student;
    return OL.ui.page.facts([
      { label: t("students.fact.apaar"), value: s.apaarId || t("students.apaar." + s.apaar) },
      { label: t("students.fact.pen"), value: s.penId || t("students.pen." + s.pen) },
      { label: t("students.fact.aadhaar"), value: s.aadhaar && s.aadhaar.onFile ? OL.fmt.maskAadhaar(s.aadhaar.last4) || "XXXX XXXX " + s.aadhaar.last4 : null },
      { label: t("students.fact.board_roll"), value: s.boardRollNo },
      { label: t("students.fact.previous_school"), value: s.previousSchool },
      { label: t("students.fact.consent"), value: t("students.consent." + s.consent) + (s.consentOn ? " · " + OL.fmt.date(s.consentOn) : "") },
      { label: t("students.fact.cwsn"), value: s.cwsn ? t("common.yes") : t("common.no") },
      { label: t("students.fact.disability"), value: s.disability },
      { label: t("students.fact.udid"), value: s.udid },
      { label: t("students.fact.migrant"), value: s.migrant ? t("common.yes") : t("common.no") }
    ]);
  };

  /* Who to call. The number is masked until someone asks; asking is written to the audit log. */
  St.contacts = function (rec, env) {
    var API = St.api(), wrap = h("ul", { class: "st-contacts" });
    if (!rec.contacts.length) return OL.ui.empty.render({ kind: "first", icon: "phone", title: t("students.contact.none"), text: t("students.contact.none_text"),
      primary: rec.can.write ? { label: t("students.edit"), icon: "pencil", onClick: function () { env.go(St.path(rec.student.id, "edit")); } } : null });
    rec.contacts.forEach(function (c) {
      var number = h("span", { class: "st-contact__num", text: c.hasPhone ? c.phone : t("students.contact.no_number") });
      var actions = h("span", { class: "st-contact__act" });
      var timer = null;
      function mask() { number.textContent = c.phone; OL.clear(actions); actions.appendChild(showBtn); }
      var showBtn = OL.ui.button.render({ label: t("students.contact.show"), icon: "eye", variant: "secondary", size: "sm", onClick: function () {
        showBtn.setLoading(true);
        API.directory.phone(rec.student.id, c.which).then(function (r) {
          var digits = String(r.phone).replace(/\D/g, ""), wa = digits.length === 10 ? "91" + digits : digits;
          number.textContent = OL.fmt.phone(r.phone);
          OL.clear(actions);
          actions.appendChild(OL.ui.button.render({ label: t("students.contact.call"), icon: "phone", variant: "secondary", size: "sm", href: "tel:" + digits }));
          if (rec.student.whatsapp) actions.appendChild(h("a", { class: "ol-btn ol-btn--secondary ol-btn--sm", href: "https://wa.me/" + wa, target: "_blank", rel: "noopener noreferrer" }, OL.icon("whatsapp", 16), h("span", { class: "ol-btn__label", text: t("students.contact.whatsapp") })));
          clearTimeout(timer); timer = setTimeout(function () { if (number.isConnected) mask(); }, 60000);
        }, function (e) { showBtn.setLoading(false); OL.ui.toast.show({ text: St.message(e, t("students.contact.show_failed")), tone: "error" }); });
      } });
      if (c.hasPhone) actions.appendChild(showBtn);
      wrap.appendChild(h("li", { class: "st-contact" },
        h("div", { class: "st-contact__who" },
          h("strong", { text: c.name || t("students.contact.unnamed") }), h("span", { class: "st-contact__rel", text: c.relation }),
          c.primary ? OL.ui.pill.render({ label: t("students.contact.primary"), tone: "info" }) : null),
        h("div", { class: "st-contact__line" }, number, actions)));
    });
    return wrap;
  };

  /* The audit log of one record as a timeline: who did what and, for a changed field, what it was and what it is. A number shown,
     an export or a creation has no field and says only what was done. `kind` is the noun a bare event is about ("student", "class"). */
  St.timeline = function (events, kind) {
    var list = h("ol", { class: "st-timeline" });
    events.forEach(function (e) {
      var bare = "students.activity.event_" + kind + "." + e.verb, did;
      if (e.field) did = t("students.activity.verb." + e.verb, { field: t("students.field." + e.field) });
      else did = t(OL.i18n.has(bare) ? bare : "students.activity.event." + e.verb);
      var change = e.field && e.verb === "changed" ? h("span", { class: "st-timeline__chg" }, h("s", { text: e.before || t("common.none") }), " → ", h("b", { text: e.after || t("common.none") })) : null;
      list.appendChild(h("li", { class: "st-timeline__i" },
        h("span", { class: "st-timeline__dot", "aria-hidden": "true" }),
        h("div", null, h("p", { class: "st-timeline__t" }, h("strong", { text: e.actor.name || t("students.activity.system") }), " ", did, " ", change),
          h("time", { class: "st-timeline__when", datetime: new Date(e.at).toISOString(), text: OL.fmt.dateTime(new Date(e.at)) }))));
    });
    return list;
  };

  /* What the record still lacks, each a link to the field that fixes it. */
  St.gaps = function (rec, env) {
    var gaps = rec.student.gaps;
    if (!gaps.length) return null;
    var wrap = h("div", { class: "st-gaps" }, h("p", { class: "st-gaps__t", text: t("students.gaps.title", { n: gaps.length }) }));
    var list = h("div", { class: "st-gaps__list" });
    gaps.forEach(function (g) {
      var go = function () { env.go(St.path(rec.student.id, "edit") + "?focus=" + encodeURIComponent(g.field)); };
      var label = t("students.gap." + g.field);
      list.appendChild(h("button", { type: "button", class: OL.cx("st-gap", g.level === "blocks" && "is-blocks"), on: { click: go } }, OL.icon(g.level === "blocks" ? "alert-circle" : "alert-triangle", 16), h("span", { text: label })));
    });
    wrap.appendChild(list);
    return rec.can.write ? wrap : null;
  };
})();
