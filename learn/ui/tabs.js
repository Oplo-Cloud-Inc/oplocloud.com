/* ==========================================================================
   C-09 Tabs, and C-09b the sub-tab row.

   Underline style. Three sizes:
     page   the module tabs under every page header
     sub    the second, smaller row (--t-small, at most 7, never a third level)
     card   tabs inside a card or a drawer

   A tab that does not fit moves into "More ▾" instead of making the row
   scroll sideways. Counts are badges ("Applications 12"). When an item has an
   href the tab is a real link, so middle-click and copy-link work and the URL
   keeps the state; the click is still handled here so the page does not reload.

   Keyboard, as the tabs pattern asks: ← → move and select, Home/End jump. The
   row is one tab stop; the selected tab owns it.

   OL.ui.tabs.render({ items: [{ key, label, count, href, disabled }], active,
     size, label, onSelect, panelPrefix, controls }) → the tablist, with .set(key) and
   .panelId(key) (the id the panel should carry, aria-labelledby points back).
   controls: false leaves out aria-controls, for a row whose panel is shared with another row.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  function render(p) {
    var size = p.size || "page", cur = p.active != null ? p.active : (p.items[0] && p.items[0].key);
    var base = p.panelPrefix || OL.uid("tp");
    var list = h("div", { class: "ol-tablist", role: "tablist", "aria-label": p.label || null });
    var moreBtn = null, ro = null;
    // "More" sits beside the tablist, not in it: a tablist holds tabs and nothing else
    var more = h("div", { class: "ol-tabs__more", hidden: true });
    var el = h("div", { class: OL.cx("ol-tabs", "ol-tabs--" + size) }, list, more);

    function panelId(k) { return base + "-" + k; }
    function tabId(k) { return base + "-tab-" + k; }

    function tabNode(it) {
      var on = it.key === cur;
      var node = h(it.href && !it.disabled ? "a" : "button", {
        class: OL.cx("ol-tab", on && "is-on"), role: "tab", id: tabId(it.key), href: it.href && !it.disabled ? it.href : null,
        type: it.href ? null : "button", "aria-selected": on ? "true" : "false", "aria-controls": p.controls === false ? null : panelId(it.key),
        tabindex: on ? "0" : "-1", "aria-disabled": it.disabled ? "true" : null, "data-key": it.key,
        on: { click: function (e) { if (it.disabled) { e.preventDefault(); return; } if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); choose(it.key); } }
      }, h("span", { text: it.label }), it.count != null ? h("span", { class: "ol-tab__count", text: OL.fmt.num(it.count) }) : null);
      return node;
    }

    function choose(k, focus) {
      if (k === cur && !focus) return;
      cur = k;
      draw();
      if (focus) { var n = list.querySelector('[data-key="' + k + '"]'); if (n) n.focus(); }
      if (p.onSelect) p.onSelect(k);
    }

    function draw() {
      OL.clear(list);
      p.items.forEach(function (it) { list.appendChild(tabNode(it)); });
      fit();
    }

    /* Anything that does not fit moves to the menu. The selected tab never does: it is the one
       the person is on. */
    function fit() {
      if (!list.isConnected) return;
      var tabs = [].slice.call(list.querySelectorAll(".ol-tab"));
      tabs.forEach(function (n) { n.hidden = false; });
      more.hidden = true; OL.clear(more);
      if (list.scrollWidth <= list.clientWidth + 1) return;
      moreBtn = h("button", { type: "button", class: "ol-tab ol-tab--more", "aria-haspopup": "menu", "aria-expanded": "false" }, h("span", { text: t("common.more") }), OL.icon("chevron-down", 16));
      more.hidden = false; more.appendChild(moreBtn);
      var hidden = [];
      for (var i = tabs.length - 1; i >= 0 && list.scrollWidth > list.clientWidth + 1; i--) {
        if (tabs[i].classList.contains("is-on")) continue;
        tabs[i].hidden = true; hidden.unshift(p.items[i]);
      }
      moreBtn.addEventListener("click", function () { openMenu(hidden); });
    }

    function openMenu(items) {
      OL.ui.menu.open({ anchor: moreBtn, items: items.map(function (it) {
        return { label: it.label, count: it.count, onClick: function () { choose(it.key, true); } };
      }) });
    }

    list.addEventListener("keydown", function (e) {
      var live = p.items.filter(function (it) { return !it.disabled && list.querySelector('[data-key="' + it.key + '"]') && !list.querySelector('[data-key="' + it.key + '"]').hidden; });
      var i = live.map(function (it) { return it.key; }).indexOf(cur);
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); choose(live[(i + d + live.length) % live.length].key, true); }
      else if (e.key === "Home") { e.preventDefault(); choose(live[0].key, true); }
      else if (e.key === "End") { e.preventDefault(); choose(live[live.length - 1].key, true); }
    });

    draw();
    if (window.ResizeObserver) {
      var later = OL.debounce(fit, 60), first = true;
      // the first report comes when the row is on the page: fit at once so no one sees it overflow
      ro = new ResizeObserver(function () { if (first) { first = false; fit(); } else later(); });
      ro.observe(el);
    }
    el.set = function (k) { cur = k; draw(); };
    el.setCount = function (k, n) { p.items.forEach(function (it) { if (it.key === k) it.count = n; }); draw(); };
    el.panelId = panelId; el.tabId = tabId;
    return el;
  }

  OL.ui.tabs = { render: render, states: ["page", "sub", "card", "with-count", "overflow"] };
})();
