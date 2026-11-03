/* ==========================================================================
   C-05 People picker.

   Find a student, a staff member or a guardian by what staff actually know —
   name, admission number, roll, phone — and see who it is before choosing: an
   avatar, the name, and the class or role underneath. With 1,801 students the
   list never loads whole; every keystroke asks the server (250 ms after the
   last), and an empty search shows the people this person picked recently.

   It is the select (C-03) with people-shaped options, so the keyboard, the
   listbox and the phone sheet are the same. A multiple picker lists the chosen
   people below the field, each removable, and takes pasted admission numbers:
   "Paste admission numbers" turns a column from a spreadsheet into students,
   and says which ones it could not find instead of dropping them silently.

   OL.ui.people.render({ label, kind: student|staff|guardian, multiple,
     search(query) → Promise<[{ id, name, sub, src, group }]>,
     resolve(tokens) → Promise<{ found: [person], missing: [token] }>,
     values: [person], optional, helper, error, placeholder, onChange(people) })
   → field with .people (chosen), .setError, .focus()
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  function render(p) {
    var multi = !!p.multiple, known = {}, chosen = [];
    function opt(x) {
      known[x.id] = x;
      return { value: x.id, label: x.name, sub: x.sub, hint: x.sub, group: x.group, avatar: { name: x.name, id: x.id, src: x.src } };
    }
    (p.values || []).forEach(function (x) { chosen.push(x); });

    var field = OL.ui.select.render({
      label: p.label, multiple: multi, searchable: true, optional: p.optional, helper: p.helper, error: p.error, class: "ol-people",
      options: chosen.map(opt), values: multi ? chosen.map(function (x) { return x.id; }) : null, value: !multi && chosen[0] ? chosen[0].id : null,
      placeholder: p.placeholder || t("people.placeholder." + (p.kind || "student")), emptyText: t("people.none"),
      summary: multi ? function (list) { return t("people.n_selected", { n: list.length }); } : null,
      load: function (q) { return Promise.resolve(p.search(q)).then(function (list) { return (list || []).map(opt); }); },
      onChange: function (v) {
        var ids = multi ? v : (v == null ? [] : [v]);
        chosen = ids.map(function (id) { return known[id]; }).filter(Boolean);
        drawTokens(); if (p.onChange) p.onChange(multi ? chosen.slice() : (chosen[0] || null));
      }
    });
    var tokens = h("ul", { class: "ol-people__list", "aria-label": t("people.chosen") });
    if (multi) field.appendChild(tokens);

    function drawTokens() {
      OL.clear(tokens);
      chosen.forEach(function (x) {
        tokens.appendChild(h("li", { class: "ol-person" },
          OL.ui.avatar.render({ name: x.name, id: x.id, src: x.src, size: 24 }),
          h("span", { class: "ol-person__t" }, h("span", { class: "ol-person__n", text: x.name }), x.sub ? h("span", { class: "ol-person__s", text: x.sub }) : null),
          h("button", { type: "button", class: "ol-iconbtn", "aria-label": t("common.remove_filter", { name: x.name }),
            on: { click: function () {
              chosen = chosen.filter(function (y) { return y.id !== x.id; });
              field.values = chosen.map(function (y) { return y.id; }); drawTokens();
              if (p.onChange) p.onChange(chosen.slice());
            } } }, OL.icon("x", 16))));
      });
    }

    /* Admission numbers pasted from a spreadsheet: split on anything that is not part of a number. */
    if (multi && p.resolve) {
      var paste = OL.ui.button.render({ label: t("people.paste"), icon: "clipboard-check", variant: "link", size: "sm", onClick: openPaste });
      field.appendChild(h("div", { class: "ol-people__paste" }, paste));
    }
    function openPaste() {
      var ta = OL.ui.input.render({ label: t("people.paste_label"), multiline: true, rows: 5, helper: t("people.paste_help"), autocomplete: "off" });
      var go = OL.ui.button.render({ label: t("people.add"), variant: "primary", onClick: function () {
        var toks = ta.value.split(/[\s,;]+/).filter(Boolean).filter(function (x, i, a) { return a.indexOf(x) === i; });
        if (!toks.length) { ta.setError(t("people.paste_empty")); return; }
        go.setLoading(true);
        Promise.resolve(p.resolve(toks)).then(function (r) {
          go.setLoading(false);
          var add = (r.found || []).filter(function (x) { return !chosen.some(function (y) { return y.id === x.id; }); });
          add.forEach(function (x) { known[x.id] = x; chosen.push(x); });
          field.setOptions(Object.keys(known).map(function (k) { return opt(known[k]); }));
          field.values = chosen.map(function (x) { return x.id; }); drawTokens();
          if (p.onChange) p.onChange(chosen.slice());
          m.close();
          OL.ui.toast.show({ text: t("people.added", { n: OL.fmt.num(add.length) }), tone: "success" });
          if (r.missing && r.missing.length) field.setError(t("people.missing", { n: OL.fmt.num(r.missing.length), list: r.missing.slice(0, 5).join(", ") + (r.missing.length > 5 ? "…" : "") }));
        }, function () { go.setLoading(false); ta.setError(t("common.load_failed")); });
      } });
      var m = OL.ui.modal.open({ title: t("people.paste"), width: 520, body: ta,
        actions: [OL.ui.button.render({ label: t("common.cancel"), variant: "secondary", onClick: function () { m.close(); } }), go] });
    }

    Object.defineProperty(field, "people", { get: function () { return chosen.slice(); } });
    drawTokens();
    return field;
  }

  OL.ui.people = { render: render, states: ["student", "staff", "guardian", "multiple", "bulk-paste"] };
})();
