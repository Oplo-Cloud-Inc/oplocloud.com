/* ==========================================================================
   C-02 Input and textarea.

   A field is its label, its control, its helper line and its error, wired
   together: the label is a <label for>, the helper and the error are named in
   aria-describedby, and the error takes the helper's place in the danger
   colour with an icon (colour is never the only signal). The label sits above
   the control, never inside it — a placeholder is an example, not a name.

   Fields are required unless they say "(optional)": most fields are required,
   and starring them all is noise.

   OL.ui.input.render({ label, name, type, value, placeholder, helper, error,
     optional, prefix, suffix, maxLength, counter, multiline, rows, disabled,
     readOnly, inputMode, autocomplete, onInput, onChange, onBlur })
   → the field element, with .input (the control), .value, .setError(msg),
   .setHelper(msg), .focus().
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  function render(p) {
    p = p || {};
    var id = p.id || OL.uid("f");
    var helpId = id + "-h", errId = id + "-e";
    var tag = p.multiline ? "textarea" : "input";
    var control = h(tag, {
      id: id, name: p.name, class: "ol-input__ctl",
      type: p.multiline ? null : (p.type || "text"), rows: p.multiline ? (p.rows || 3) : null,
      placeholder: p.placeholder, maxlength: p.maxLength, inputmode: p.inputMode, autocomplete: p.autocomplete || "off",
      disabled: p.disabled, readOnly: p.readOnly, "aria-required": p.optional ? null : (p.required === false ? null : "true"),
      spellcheck: p.spellcheck === true ? "true" : null
    });
    if (p.value != null) control.value = p.value;

    var box = h("div", { class: OL.cx("ol-input__box", p.multiline && "is-multi") },
      p.prefix ? h("span", { class: "ol-input__fix", text: p.prefix }) : null,
      control,
      p.suffix ? h("span", { class: "ol-input__fix", text: p.suffix }) : null);

    var label = p.label ? h("label", { class: "ol-label", for: id }, p.label,
      p.optional ? h("span", { class: "ol-label__opt", text: " " + t("common.optional") }) : null) : null;
    var helper = h("p", { class: "ol-help", id: helpId });
    var error = h("p", { class: "ol-error", id: errId, role: "alert", hidden: true });
    var counter = (p.counter || p.maxLength) ? h("span", { class: "ol-counter", "aria-hidden": "true" }) : null;

    var el = h("div", { class: OL.cx("ol-field", p.class) }, label, box,
      h("div", { class: "ol-field__foot" }, h("div", { class: "ol-field__msgs" }, helper, error), counter));

    function describe() {
      var ids = [];
      if (!error.hidden) ids.push(errId);
      if (helper.textContent) ids.push(helpId);
      if (ids.length) control.setAttribute("aria-describedby", ids.join(" ")); else control.removeAttribute("aria-describedby");
    }
    el.setHelper = function (msg) { helper.textContent = msg || ""; helper.hidden = !msg; describe(); };
    el.setError = function (msg) {
      OL.clear(error);
      error.hidden = !msg;
      if (msg) { error.appendChild(OL.icon("alert-circle", 16)); error.appendChild(document.createTextNode(msg)); }
      helper.hidden = !!msg || !helper.textContent;
      el.classList.toggle("is-invalid", !!msg);
      if (msg) control.setAttribute("aria-invalid", "true"); else control.removeAttribute("aria-invalid");
      describe();
    };
    function count() {
      if (!counter) return;
      var n = control.value.length;
      counter.textContent = p.maxLength ? n + "/" + p.maxLength : String(n);
      counter.classList.toggle("is-near", !!p.maxLength && n >= p.maxLength * 0.9);
    }
    el.setHelper(p.helper);
    if (p.error) el.setError(p.error);
    count();

    control.addEventListener("input", function (e) { count(); if (el.classList.contains("is-invalid") && p.clearErrorOnInput !== false) el.setError(""); if (p.onInput) p.onInput(control.value, e); });
    control.addEventListener("change", function (e) { if (p.onChange) p.onChange(control.value, e); });
    control.addEventListener("blur", function (e) { if (p.onBlur) p.onBlur(control.value, e); });

    el.input = control;
    // configurable: the date, time and month fields wrap this one and give `value` their own meaning
    Object.defineProperty(el, "value", { configurable: true, get: function () { return control.value; }, set: function (v) { control.value = v == null ? "" : v; count(); } });
    el.focus = function () { control.focus(); };
    return el;
  }

  OL.ui.input = { render: render, states: ["default", "focus", "error", "disabled", "read-only", "prefix"] };
})();
