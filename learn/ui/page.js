/* ==========================================================================
   Page furniture — the parts every template shares (Volume 01 §9.1).

   T2 Index, T3 Record and T5 Form open the same way: a header with the page's
   one primary action, a strip of numbers, a toolbar. They live here once so a
   page is its content and nothing else, and so the header cannot grow a second
   primary button.

   header({ title, subtitle, back, primary, secondary, more, meta })
       → the page's h1 (the menu's own word), at most one primary button, any
         number of secondary ones, and a "More ▾" menu
   search({ label, placeholder, value, onInput })
       → a search field that answers 250 ms after the last key and takes "/" from
         anywhere on the page; .set(v) · .focus()
   kpis(items, label)            → the number tiles (OL.ui.kpi) in a row
   bulk({ label, actions })      → the bar that holds what can be done to the
         selected rows: .show(n) · .hide()
   facts(rows)                   → a definition list: [{ label, value, node }]
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  function header(p) {
    var actions = h("div", { class: "ol-ph__actions" });
    (p.secondary || []).forEach(function (a) {
      actions.appendChild(OL.ui.button.render({ label: a.label, icon: a.icon, variant: "secondary", href: a.href, onClick: a.onClick, disabled: a.disabled, disabledReason: a.disabledReason }));
    });
    if (p.more && p.more.length) {
      var more = OL.ui.button.render({ label: t("common.more"), iconAfter: "chevron-down", variant: "secondary", onClick: function () {
        OL.ui.menu.open({ anchor: more, align: "end", items: p.more });
      } });
      more.setAttribute("aria-haspopup", "menu"); more.setAttribute("aria-expanded", "false");
      actions.appendChild(more);
    }
    if (p.primary) actions.appendChild(OL.ui.button.render({ label: p.primary.label, icon: p.primary.icon, variant: "primary", href: p.primary.href, onClick: p.primary.onClick,
      disabled: p.primary.disabled, disabledReason: p.primary.disabledReason }));
    var back = p.back ? h("a", { class: "ol-ph__back ol-link", href: p.back.href || null, on: { click: function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || !p.back.onClick) return;
      e.preventDefault(); p.back.onClick();
    } } }, OL.icon("arrow-left", 16), " ", p.back.label) : null;
    return h("header", { class: "ol-ph" },
      h("div", { class: "ol-ph__titles" }, back,
        h("h1", { class: "ol-ph__title", text: p.title }),
        p.subtitle ? h("p", { class: "ol-ph__sub", text: p.subtitle }) : null,
        p.meta || null),
      actions.childNodes.length ? actions : null);
  }

  function search(p) {
    var timer = null, input = h("input", { type: "search", class: "ol-sf__ctl", placeholder: p.placeholder, value: p.value || "", autocomplete: "off",
      "aria-label": p.label || t("common.search"), "aria-keyshortcuts": "/" });
    var clear = h("button", { type: "button", class: "ol-sf__x", "aria-label": t("common.clear"), hidden: !input.value, on: { click: function () { set(""); fire(0); input.focus(); } } }, OL.icon("x", 16));
    var el = h("div", { class: OL.cx("ol-sf", p.class), role: "search" }, OL.icon("search", 16), input, clear, h("kbd", { class: "ol-sf__kbd", "aria-hidden": "true", text: "/" }));
    function fire(ms) { clearTimeout(timer); timer = setTimeout(function () { if (p.onInput) p.onInput(input.value.trim()); }, ms); }
    function set(v) { input.value = v || ""; clear.hidden = !input.value; }
    input.addEventListener("input", function () { clear.hidden = !input.value; fire(250); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") fire(0); else if (e.key === "Escape" && input.value) { e.stopPropagation(); set(""); fire(0); } });
    // "/" from anywhere on the page, unless a field already has the keyboard or the person turned one-key shortcuts off; the listener ends with the page
    function slash(e) {
      if (!el.isConnected) { document.removeEventListener("keydown", slash); return; }
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || !OL.shortcuts.single()) return;
      var a = document.activeElement, tag = a && a.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (a && a.isContentEditable) || document.querySelector(".ol-drawer.is-open, .ol-modal.is-open, .ol-palette")) return;
      e.preventDefault(); input.focus(); input.select();
    }
    document.addEventListener("keydown", slash);
    el.input = input; el.set = set; el.focus = function () { input.focus(); };
    return el;
  }

  function kpis(items, label) {
    return h("div", { class: "ol-kpis", role: "group", "aria-label": label || null }, items.map(function (k) { return OL.ui.kpi.render(k); }));
  }

  function bulk(p) {
    var count = h("span", { class: "ol-bulk__n", "aria-live": "polite" });
    var buttons = h("div", { class: "ol-bulk__actions" }, p.actions.map(function (a) {
      return OL.ui.button.render({ label: a.label, icon: a.icon, variant: a.danger ? "danger" : "secondary", size: "sm", onClick: a.onClick });
    }));
    var el = h("div", { class: "ol-bulk", role: "region", "aria-label": p.label || t("page.bulk"), hidden: true }, count, buttons);
    el.show = function (n, text) { el.hidden = !n; count.textContent = text || t("table.n_selected", { n: OL.fmt.num(n) }); };
    el.hide = function () { el.hidden = true; };
    return el;
  }

  function facts(rows) {
    var dl = h("dl", { class: "ol-facts" });
    rows.forEach(function (r) {
      if (!r) return;
      dl.appendChild(h("div", { class: "ol-facts__row" }, h("dt", { text: r.label }),
        h("dd", null, r.node || (r.value == null || r.value === "" ? h("span", { class: "ol-facts__none", text: t("common.none") }) : String(r.value)))));
    });
    return dl;
  }

  OL.ui.page = { header: header, search: search, kpis: kpis, bulk: bulk, facts: facts, states: ["header", "search", "kpis", "bulk bar", "facts"] };
})();
