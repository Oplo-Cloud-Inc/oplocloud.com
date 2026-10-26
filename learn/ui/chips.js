/* ==========================================================================
   C-07 Chips and segmented control.

   A chip filters one dimension with six or fewer values and carries its
   count, written "Open · 12" with the separator always — the audit found
   "Open0" glued together. A segmented control switches between mutually
   exclusive views (List · By period) and holds two to four options; more than
   that is a dropdown.

   chips.render({ items: [{ value, label, count }], value | values, multiple,
     label, onChange })       → role=group of toggle buttons (aria-pressed)
   segmented.render({ items: [{ value, label }], value, label, onChange })
                              → role=radiogroup; ← → move, as radios do
   chips.token({ label, onRemove })   an active filter, removable
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h;

  function chips(p) {
    var sel = p.multiple ? (p.values || []).slice() : (p.value != null ? [p.value] : []);
    var group = h("div", { class: "ol-chips", role: "group", "aria-label": p.label });
    function draw() {
      OL.clear(group);
      p.items.forEach(function (it) {
        var on = sel.indexOf(it.value) > -1;
        var text = it.count != null ? it.label + " · " + OL.fmt.num(it.count) : it.label;
        group.appendChild(h("button", {
          type: "button", class: OL.cx("ol-chip", on && "is-on"), "aria-pressed": on ? "true" : "false",
          on: { click: function () {
            if (p.multiple) { var i = sel.indexOf(it.value); if (i > -1) sel.splice(i, 1); else sel.push(it.value); }
            else sel = [it.value];
            draw();
            if (p.onChange) p.onChange(p.multiple ? sel.slice() : sel[0]);
          } }
        }, on && p.multiple ? OL.icon("check", 16) : null, text));
      });
    }
    draw();
    group.set = function (v) { sel = p.multiple ? (v || []).slice() : (v != null ? [v] : []); draw(); };
    return group;
  }

  function segmented(p) {
    var cur = p.value != null ? p.value : p.items[0].value;
    var group = h("div", { class: "ol-seg", role: "radiogroup", "aria-label": p.label });
    function draw(focusIt) {
      OL.clear(group);
      p.items.forEach(function (it, i) {
        var on = it.value === cur;
        group.appendChild(h("button", {
          type: "button", role: "radio", class: OL.cx("ol-seg__opt", on && "is-on"), "aria-checked": on ? "true" : "false",
          tabindex: on ? "0" : "-1", "data-i": i,
          on: {
            click: function () { choose(it.value); },
            keydown: function (e) {
              var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
              if (!d) return;
              e.preventDefault();
              choose(p.items[(i + d + p.items.length) % p.items.length].value, true);
            }
          }
        }, it.icon ? OL.icon(it.icon, 16) : null, it.label));
      });
      if (focusIt) group.querySelector('[aria-checked="true"]').focus();
    }
    function choose(v, focus) { cur = v; draw(focus); if (p.onChange) p.onChange(v); }
    draw();
    group.set = function (v) { cur = v; draw(); };
    return group;
  }

  function token(p) {
    return h("span", { class: "ol-token" }, h("span", { text: p.label }),
      h("button", { type: "button", class: "ol-token__x", "aria-label": OL.i18n.t("common.remove_filter", { name: p.label }), on: { click: p.onRemove } }, OL.icon("x", 16)));
  }

  OL.ui.chips = { render: chips, token: token, states: ["default", "selected", "with-count"] };
  OL.ui.segmented = { render: segmented, states: ["default", "selected"] };
})();
