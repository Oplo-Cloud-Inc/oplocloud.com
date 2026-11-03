/* ==========================================================================
   Checkbox, radio group and switch — the three small controls every form, row
   selector and settings page needs, so none of them draws its own.

   They are the native controls, styled: a real <input>, so a screen reader,
   the keyboard and form autofill all behave as the platform does. A switch is a
   checkbox with role=switch — it says "on/off" and applies at once; a checkbox
   is for a choice that is submitted later.

   check.box({ label, checked, indeterminate, disabled, onChange })
       just the input, for a table row or header (label is its aria-label)
   check.field({ label, helper, checked, disabled, onChange })
       checkbox with a visible label and optional helper line
   check.radios({ label, options: [{ value, label, hint, disabled }], value,
       name, inline, onChange })  → fieldset, .value
   check.toggle({ label, helper, checked, disabled, onChange })  → switch
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h;

  function box(p) {
    var el = h("input", { type: "checkbox", class: "ol-cb", "aria-label": p.label, checked: !!p.checked, disabled: p.disabled, indeterminate: !!p.indeterminate });
    el.addEventListener("change", function () { if (p.onChange) p.onChange(el.checked, el); });
    return el;
  }

  function field(p) {
    var id = OL.uid("cb"), input = box({ checked: p.checked, disabled: p.disabled, indeterminate: p.indeterminate, onChange: p.onChange });
    input.id = id; input.removeAttribute("aria-label");
    var help = p.helper ? h("span", { class: "ol-help", id: id + "-h", text: p.helper }) : null;
    if (help) input.setAttribute("aria-describedby", id + "-h");
    var el = h("div", { class: OL.cx("ol-checkfield", p.class) }, input, h("label", { for: id, class: "ol-checkfield__label" }, p.label), help);
    el.input = input;
    return el;
  }

  function radios(p) {
    var name = p.name || OL.uid("rg"), cur = p.value;
    var el = h("fieldset", { class: OL.cx("ol-radios", p.inline && "is-inline", p.class) }, h("legend", { class: "ol-label", text: p.label }));
    p.options.forEach(function (o) {
      var id = OL.uid("r");
      var input = h("input", { type: "radio", class: "ol-rb", id: id, name: name, value: o.value, checked: o.value === cur, disabled: o.disabled,
        "aria-describedby": o.hint ? id + "-h" : null });
      input.addEventListener("change", function () { if (input.checked) { cur = o.value; if (p.onChange) p.onChange(cur); } });
      el.appendChild(h("div", { class: "ol-checkfield" }, input, h("label", { for: id, class: "ol-checkfield__label", text: o.label }),
        o.hint ? h("span", { class: "ol-help", id: id + "-h", text: o.hint }) : null));
    });
    Object.defineProperty(el, "value", { get: function () { return cur; }, set: function (v) {
      cur = v; OL.$$("input", el).forEach(function (i) { i.checked = i.value === String(v); });
    } });
    return el;
  }

  function toggle(p) {
    var id = OL.uid("sw");
    var input = h("input", { type: "checkbox", role: "switch", class: "ol-sw", id: id, checked: !!p.checked, disabled: p.disabled, "aria-describedby": p.helper ? id + "-h" : null });
    input.addEventListener("change", function () { if (p.onChange) p.onChange(input.checked, input); });
    var el = h("div", { class: OL.cx("ol-switchfield", p.class) }, input, h("label", { for: id, class: "ol-checkfield__label", text: p.label }),
      p.helper ? h("span", { class: "ol-help", id: id + "-h", text: p.helper }) : null);
    el.input = input;
    return el;
  }

  OL.ui.check = { box: box, field: field, radios: radios, toggle: toggle, states: ["unchecked", "checked", "indeterminate", "disabled", "switch"] };
})();
