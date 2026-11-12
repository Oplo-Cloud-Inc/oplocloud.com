/* ==========================================================================
   Menu — the small popup list behind "⋯" row actions, "More ▾" tabs and the
   account button. It is not a form control (that is C-03); it runs an action.

   role=menu / menuitem. ↑ ↓ move, Home/End jump, Enter or Space runs, Esc and a
   click outside close it, Tab closes it and moves on. Focus goes to the first
   item and comes back to the anchor.

   OL.ui.menu.open({ anchor, items: [{ label, icon, href, onClick, count,
     danger, disabled, sep, head, radio, check, checked }], align }) → handle { close() }
   `head` is a small non-interactive heading above a group; `radio` + `checked`
   make a menuitemradio (appearance, language) with a tick in the icon's place;
   `check` + `checked` make a menuitemcheckbox (a setting that is on or off).
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h;

  function open(p) {
    var pop = h("div", { class: "ol-pop ol-menu", role: "menu" }), ov;
    p.items.forEach(function (it) {
      if (it.sep) { pop.appendChild(h("div", { class: "ol-menu__sep", role: "separator" })); return; }
      if (it.head) { pop.appendChild(h("div", { class: "ol-menu__head", role: "presentation", text: it.head })); return; }
      var node = h(it.href && !it.disabled ? "a" : "button", {
        class: OL.cx("ol-menu__item", it.danger && "is-danger", it.checked && "is-checked"), role: it.radio ? "menuitemradio" : it.check ? "menuitemcheckbox" : "menuitem", href: it.href && !it.disabled ? it.href : null, type: it.href ? null : "button",
        "aria-checked": it.radio || it.check ? (it.checked ? "true" : "false") : null,
        "aria-disabled": it.disabled ? "true" : null, tabindex: "-1",
        on: { click: function (e) {
          if (it.disabled) { e.preventDefault(); return; }
          if (it.onClick) { e.preventDefault(); ov.close(); it.onClick(e); } else if (!it.href) ov.close(); else ov.close("no-focus");
        } }
      }, it.radio || it.check ? h("span", { class: "ol-menu__tick", "aria-hidden": "true" }, it.checked ? OL.icon("check", 16) : null) : it.icon ? OL.icon(it.icon, 16) : null, h("span", { class: "ol-menu__label", text: it.label }), it.count != null ? h("span", { class: "ol-menu__count", text: OL.fmt.num(it.count) }) : null);
      pop.appendChild(node);
    });
    document.body.appendChild(pop);
    OL.place(pop, p.anchor, { align: p.align });
    if (p.anchor.setAttribute) p.anchor.setAttribute("aria-expanded", "true");
    ov = OL.overlay.push({ el: pop, trap: false, outside: true, trigger: p.anchor, onClose: function () {
      if (p.anchor.setAttribute) p.anchor.setAttribute("aria-expanded", "false");
      pop.remove();
    } });
    pop.addEventListener("keydown", function (e) {
      var its = OL.$$(".ol-menu__item:not([aria-disabled])", pop), i = its.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); its[(i + 1) % its.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); its[(i - 1 + its.length) % its.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); its[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); its[its.length - 1].focus(); }
      else if (e.key === "Tab") ov.close();
    });
    var first = pop.querySelector(".ol-menu__item:not([aria-disabled])");
    if (first) first.focus();
    return { close: function () { ov.close(); }, el: pop };
  }

  OL.ui.menu = { open: open, states: ["items", "with-count", "danger", "disabled"] };
})();
