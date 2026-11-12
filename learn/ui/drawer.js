/* ==========================================================================
   C-15 Drawer.

   Right-hand panel, 560 (a form), 720 (with a preview, or a record peek) or
   960 wide. It is how a list keeps its place while a record is read or a
   five-to-twelve-field form is filled — the centred modal this replaces threw
   the list away and left half its width blank.

     · Esc closes it, after the guard (a drawer with unsaved changes asks first)
     · focus is trapped inside, and handed back to what opened it
     · the page behind is inert to a screen reader
     · the address says so (?peek=stu_123), so a refresh keeps it: the caller
       passes `url: { param, value }` and OL.url writes it
     · in peek mode, ↑/↓ with the drawer focused moves to the next or previous
       row of the list behind it (`onStep(±1)`)
     · slides in over 200 ms; with prefers-reduced-motion it only fades

   OL.ui.drawer.open({ title, subtitle, width, tabs, activeTab, onTab, body,
     footer, onClose, guard, url, onStep, openFull }) → handle { close(),
     setBody(node), setTitle(s), setDirty(bool), el, bodyEl }
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  function open(p) {
    p = p || {};
    var width = p.width || 560, dirty = false, tabsEl = null;
    var titleId = OL.uid("dt");
    var back = h("div", { class: "ol-scrim ol-scrim--drawer", "aria-hidden": "true" });
    var bodyEl = h("div", { class: "ol-drawer__body", tabindex: "-1" });
    var titleEl = h("h2", { class: "ol-drawer__title", id: titleId, text: p.title || "" });
    var step = p.onStep ? h("span", { class: "ol-drawer__step" },
      OL.ui.button.render({ iconOnly: true, icon: "arrow-up", ariaLabel: t("drawer.previous"), variant: "ghost", size: "sm", onClick: function () { p.onStep(-1); } }),
      OL.ui.button.render({ iconOnly: true, icon: "arrow-down", ariaLabel: t("drawer.next"), variant: "ghost", size: "sm", onClick: function () { p.onStep(1); } })) : null;
    var full = p.openFull ? h("a", { class: "ol-link ol-drawer__full", href: p.openFull.href || null, on: p.openFull.onClick ? { click: p.openFull.onClick } : null },
      t("drawer.open_full"), " ", OL.icon("external", 16)) : null;
    var head = h("header", { class: "ol-drawer__head" },
      h("div", { class: "ol-drawer__titles" }, titleEl, p.subtitle ? h("p", { class: "ol-drawer__sub", text: p.subtitle }) : null),
      h("div", { class: "ol-drawer__tools" }, full, step,
        OL.ui.button.render({ iconOnly: true, icon: "x", ariaLabel: t("common.close"), variant: "ghost", onClick: function () { handle.close(); } })));
    if (p.tabs && p.tabs.length) {
      tabsEl = OL.ui.tabs.render({ items: p.tabs, active: p.activeTab, size: "card", onSelect: function (k) { panelFor(k); if (p.onTab) p.onTab(k); } });
      head.appendChild(tabsEl);
      panelFor(p.activeTab != null ? p.activeTab : p.tabs[0].key);
    }
    var el = h("aside", { class: OL.cx("ol-drawer", "ol-drawer--" + width), role: "dialog", "aria-modal": "true", "aria-labelledby": titleId }, head, bodyEl,
      p.footer ? h("footer", { class: "ol-drawer__foot" }, p.footer) : null);
    // the body is the one panel the tabs switch between
    function panelFor(k) { bodyEl.setAttribute("role", "tabpanel"); bodyEl.id = tabsEl.panelId(k); bodyEl.setAttribute("aria-labelledby", tabsEl.tabId(k)); }
    function fill(node) { OL.clear(bodyEl); OL.append(bodyEl, typeof node === "function" ? node(bodyEl) : node); }
    if (p.body) fill(p.body);

    var restore = null;
    var overlay = OL.overlay.push({
      el: el, trap: true,
      guard: function () { return dirty || p.guard ? confirmDiscard() : true; },
      onClose: function (why) {
        el.classList.remove("is-open"); back.classList.remove("is-open");
        if (restore) restore();
        setTimeout(function () { el.remove(); back.remove(); }, 220);
        if (p.url && OL.url) OL.url.set(p.url.param, null, { replace: true });
        if (p.onClose) p.onClose(why);
      }
    });
    function confirmDiscard() {
      if (p.guard && p.guard() === false) return false;
      if (!dirty) return true;
      OL.ui.modal.confirm({ title: t("drawer.discard_title"), text: t("drawer.discard_text"), confirmLabel: t("drawer.discard"), danger: true }).then(function (yes) {
        if (yes) { dirty = false; handle.close(); }
      });
      return false;
    }
    back.addEventListener("click", function () { if (confirmDiscard()) handle.close(); });

    var handle = {
      el: el, bodyEl: bodyEl,
      close: function () { if (confirmDiscard()) overlay.close("close"); },
      setBody: fill,
      setTitle: function (s) { titleEl.textContent = s; },
      setDirty: function (v) { dirty = !!v; },
      setTabs: function (active) { if (tabsEl && tabsEl.set) { tabsEl.set(active); panelFor(active); } }
    };

    document.body.appendChild(back);
    document.body.appendChild(el);
    restore = OL.inertOthers([el, back]);
    requestAnimationFrame(function () {
      el.classList.add("is-open"); back.classList.add("is-open");
      (OL.focusables(bodyEl)[0] || bodyEl).focus();
    });
    if (p.url && OL.url) OL.url.set(p.url.param, p.url.value, { replace: true });
    if (p.onStep) el.addEventListener("keydown", function (e) {
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.target === bodyEl) { e.preventDefault(); p.onStep(e.key === "ArrowDown" ? 1 : -1); }
    });
    return handle;
  }

  OL.ui.drawer = { open: open, states: ["560 form", "720 preview", "with tabs", "sticky footer"] };
})();
