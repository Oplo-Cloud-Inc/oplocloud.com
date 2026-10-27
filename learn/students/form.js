/* ==========================================================================
   Students › Add and edit — template T5, a form with its own page.

   There are about thirty fields on a student, so this is a page, not a modal
   (the rule is four): five cards of fields in a column with a bar at the foot
   that stays in view. Add student asks for the account (name, email) and
   everything else is optional, because an office adds a child with what it has
   and the record says what is still missing. Edit sends only the fields that
   changed, so the audit log shows what was really changed and a number masked on
   screen is never written back.

   /admin/students/directory/new · /admin/students/directory/{id}/edit?focus=pen
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var St = OL.students = OL.students || {};

  var BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  var CATEGORIES = ["General", "EWS/DG", "SC", "ST", "OBC"];
  var opt = function (prefix, list) { return list.map(function (v) { return { value: v, label: prefix ? t(prefix + v) : v }; }); };

  /* type: text · int · date · pick · class · area · bool. `help` shows a helper line; `fresh` is asked only when adding. */
  var SECTIONS = [
    { key: "student", fields: [
      { k: "name", type: "text", fresh: true, max: 120 }, { k: "email", type: "text", fresh: true, mode: "email" },
      { k: "dob", type: "date" }, { k: "gender", type: "pick", options: function () { return opt("students.gender.", ["M", "F", "O"]); } },
      { k: "classId", type: "class" }, { k: "rollNo", type: "int" },
      { k: "admissionNo", type: "text" }, { k: "admittedOn", type: "date" },
      { k: "category", type: "pick", options: function () { return opt("", CATEGORIES); } }, { k: "house", type: "text", max: 40 },
      { k: "bloodGroup", type: "pick", options: function () { return opt("", BLOOD); } }, { k: "motherTongue", type: "text" },
      { k: "secondLanguage", type: "text" }, { k: "transport", type: "text" },
      { k: "address", type: "area", wide: true, max: 400 }
    ] },
    { key: "records", fields: [
      { k: "apaar", type: "text", help: true }, { k: "pen", type: "text", help: true },
      { k: "aadhaar", type: "text", help: true, mode: "numeric", masked: true }, { k: "boardRollNo", type: "text" },
      { k: "previousSchool", type: "text", wide: true }
    ] },
    { key: "family", fields: [
      { k: "fatherName", type: "text" }, { k: "fatherPhone", type: "text", mode: "tel", help: true },
      { k: "motherName", type: "text" }, { k: "motherPhone", type: "text", mode: "tel", help: true },
      { k: "primaryContact", type: "pick", options: function () { return opt("students.contact.rel.", ["Father", "Mother", "Guardian"]); } }, { k: "language", type: "text" },
      { k: "guardianName", type: "text" }, { k: "guardianRelation", type: "text" },
      { k: "guardianPhone", type: "text", mode: "tel", help: true }, { k: "guardianEmail", type: "text", mode: "email" },
      { k: "whatsapp", type: "bool" }
    ] },
    { key: "care", fields: [
      { k: "cwsn", type: "bool" }, { k: "disability", type: "text" }, { k: "udid", type: "text" }, { k: "migrant", type: "bool" }
    ] },
    { key: "consent", fields: [
      { k: "consentStatus", type: "pick", options: function () { return opt("students.consent.", ["verified", "pending", "withdrawn"]); } },
      { k: "consentMethod", type: "pick", options: function () { return opt("students.consent_method.", ["signed_form", "digilocker", "other"]); } },
      { k: "consentOn", type: "date" }, { k: "consentNote", type: "text" }
    ] }
  ];

  function buildClasses(list) {
    var by = {}, order = [];
    list.forEach(function (c) {
      if (!by[c.grade]) { by[c.grade] = { id: c.grade, label: /^(nursery|lkg|ukg|kg|pre)/i.test(c.grade) ? c.grade : t("students.class_n", { name: c.grade }), sections: [] }; order.push(by[c.grade]); }
      by[c.grade].sections.push({ id: c.id, label: c.label, count: c.strength });
    });
    return order;
  }

  function draw(host, env, id) {
    var API = St.api(), fresh = !id;
    OL.clear(host);
    var root = h("div", { class: "st-formpage" });
    var headEl = h("div"), alertEl = h("div"), formEl = h("form", { class: "st-formpage__form", novalidate: true });
    OL.append(root, [headEl, alertEl, formEl]);
    host.appendChild(root);

    var S = { was: null, ctl: {}, dirty: false, saving: false, classes: [] };
    var backTo = fresh ? { label: t("tab.students.directory"), onClick: function () { env.go(St.listPath()); }, href: env.base + St.listPath() }
      : { label: t("students.back_to_record"), onClick: function () { env.go(St.path(id)); }, href: St.href(env, id) };

    function head(name) {
      OL.clear(headEl);
      headEl.appendChild(OL.ui.page.header({ title: fresh ? t("students.new_title") : t("students.edit_title", { name: name || "" }), back: backTo }));
      if (fresh || name) env.setRecord({ label: fresh ? t("students.new_title") : name });
    }
    head();
    formEl.appendChild(OL.ui.skeleton.render({ type: "lines", n: 8 }));

    if (!fresh) API.india.student(id).then(function (r) { S.was = r.student; ready(); }, failed);
    else ready();
    API.india.classes().then(function (r) { S.classes = r.classes || []; if (S.ctl.classId) S.ctl.classId.el.setClasses(buildClasses(S.classes)); }, function () { /* the picker stays empty */ });

    function failed(e) {
      OL.clear(formEl);
      formEl.appendChild(e && e.status === 404 ? OL.ui.empty.render({ kind: "first", icon: "user", title: t("students.not_found"), text: t("students.not_found_text"), primary: { label: t("tab.students.directory"), onClick: function () { env.go(St.listPath()); } } })
        : e && e.status === 403 ? OL.ui.empty.render({ kind: "denied", title: t("students.denied"), text: t("students.denied_text") })
        : OL.ui.banner.render({ tone: "danger", text: St.message(e), actions: OL.ui.button.render({ label: t("common.retry"), variant: "secondary", size: "sm", onClick: function () { draw(host, env, id); } }) }));
    }

    /* ------------------------------------------------------------- controls */
    function initial(f) {
      var v = S.was ? S.was[f.k] : null;
      if (f.k === "aadhaar" || f.k === "udid") return "";
      if (f.type === "bool") return v === 1 || v === true;
      return v == null ? "" : v;
    }
    function control(f) {
      var label = t("students.field." + f.k), start = initial(f), c = { f: f, start: start, optional: !(f.fresh) };
      var mark = function () { S.dirty = true; };
      var helper = f.help ? t("students.help." + f.k) : null;
      if (f.k === "aadhaar" && S.was && S.was.aadhaar) helper = t("students.help.aadhaar_set", { last4: String(S.was.aadhaar).slice(-4) });
      if (f.type === "text" || f.type === "int") {
        c.el = OL.ui.input.render({ label: label, name: f.k, value: start, optional: !f.fresh, maxLength: f.max, inputMode: f.type === "int" ? "numeric" : f.mode, helper: helper, onInput: mark });
        c.val = function () { return c.el.value.trim(); };
      } else if (f.type === "area") {
        c.el = OL.ui.input.render({ label: label, name: f.k, value: start, optional: true, multiline: true, rows: 3, maxLength: f.max, onInput: mark });
        c.val = function () { return c.el.value.trim(); };
      } else if (f.type === "date") {
        c.el = OL.ui.date.render({ label: label, value: start, optional: true, max: f.k === "dob" ? OL.fmt.today() : null, onChange: mark });
        c.val = function () { return c.el.value || ""; };
      } else if (f.type === "pick") {
        c.cur = start || null;
        c.el = OL.ui.select.render({ label: label, options: f.options(), value: c.cur, clearable: true, optional: true, placeholder: t("students.choose"), onChange: function (v) { c.cur = v; mark(); } });
        c.val = function () { return c.cur || ""; };
      } else if (f.type === "class") {
        c.cur = start || null;
        c.el = OL.ui.classpicker.render({ label: label, classes: buildClasses(S.classes), multiple: false, values: c.cur ? [c.cur] : [], optional: true, placeholder: t("students.choose"),
          onChange: function (ids) { c.cur = ids[0] || null; mark(); } });
        c.val = function () { return c.cur || ""; };
      } else if (f.type === "bool") {
        c.cur = !!start;
        c.el = OL.ui.check.toggle({ label: label, checked: c.cur, onChange: function (on) { c.cur = on; mark(); } });
        c.val = function () { return c.cur; };
        c.el.setError = function () { /* a switch cannot be wrong */ };
      }
      c.changed = function () { return String(c.val()) !== String(c.start === true ? true : c.start === false ? false : c.start); };
      S.ctl[f.k] = c;
      return c.el;
    }

    function ready() {
      OL.clear(formEl);
      head(S.was ? S.was.name : "");
      SECTIONS.forEach(function (sec) {
        var fields = sec.fields.filter(function (f) { return fresh || !f.fresh; });
        var grid = h("div", { class: "st-grid" });
        fields.forEach(function (f) { var el = control(f); grid.appendChild(f.wide ? h("div", { class: "st-grid__wide" }, el) : el); });
        formEl.appendChild(OL.ui.card.render({ title: t("students.section." + sec.key), level: 2, body: grid, class: "st-formcard" }));
      });
      var cancel = OL.ui.button.render({ label: t("common.cancel"), variant: "secondary", onClick: leave });
      S.save = OL.ui.button.render({ label: fresh ? t("students.save_new") : t("common.save"), variant: "primary", type: "submit" });
      formEl.appendChild(h("div", { class: "st-formbar" }, cancel, S.save));
      formEl.addEventListener("submit", function (e) { e.preventDefault(); save(); });
      window.addEventListener("beforeunload", guard);
      var focus = OL.url.get("focus");
      if (focus && S.ctl[focus]) {
        OL.url.set("focus", null);
        var c = S.ctl[focus].el;
        setTimeout(function () { if (c.scrollIntoView) c.scrollIntoView({ block: "center" }); if (c.focus) c.focus(); }, 0);
      } else if (fresh && S.ctl.name) S.ctl.name.el.focus();
    }

    function guard(e) {
      if (!formEl.isConnected) { window.removeEventListener("beforeunload", guard); return; }
      if (S.dirty) { e.preventDefault(); e.returnValue = ""; }
    }
    function leave() {
      if (!S.dirty) { backTo.onClick(); return; }
      OL.ui.modal.confirm({ title: t("drawer.discard_title"), text: t("drawer.discard_text"), confirmLabel: t("drawer.discard"), danger: true }).then(function (yes) { if (yes) { S.dirty = false; backTo.onClick(); } });
    }

    /* ----------------------------------------------------------------- save */
    function showError(field, message) {
      var c = field && S.ctl[field];
      if (c && c.el.setError) { c.el.setError(message); if (c.el.scrollIntoView) c.el.scrollIntoView({ block: "center" }); if (c.el.focus) c.el.focus(); return; }
      OL.clear(alertEl);
      alertEl.appendChild(OL.ui.banner.render({ tone: "danger", text: message, class: "st-banner" }));
      if (alertEl.scrollIntoView) alertEl.scrollIntoView({ block: "center" });
    }

    function save() {
      if (S.saving) return;
      OL.clear(alertEl);
      Object.keys(S.ctl).forEach(function (k) { if (S.ctl[k].el.setError) S.ctl[k].el.setError(""); });
      var body = {};
      Object.keys(S.ctl).forEach(function (k) {
        var c = S.ctl[k];
        if (fresh ? (c.val() !== "" && c.val() !== false) : c.changed()) body[k] = c.val();
      });
      if (fresh) {
        if (!body.name || body.name.length < 2) { showError("name", t("students.error.name")); return; }
        if (!body.email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(body.email)) { showError("email", t("students.error.email")); return; }
      } else if (!Object.keys(body).length) { S.dirty = false; OL.ui.toast.show({ text: t("students.no_changes"), tone: "info" }); backTo.onClick(); return; }
      S.saving = true; S.save.setLoading(true);
      var call = fresh ? API.directory.create(body) : API.india.putStudent(id, body);
      call.then(function (r) {
        S.dirty = false; S.saving = false;
        OL.ui.toast.show({ text: fresh ? t("students.created", { name: r.student.name }) : t("students.saved") });
        env.go(St.path(fresh ? r.student.id : id));
      }, function (e) {
        S.saving = false; S.save.setLoading(false);
        showError(e && e.field, St.message(e, t("students.save_failed")));
      });
    }
  }

  St.form = { draw: draw };
})();
