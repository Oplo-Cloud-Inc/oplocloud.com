/* ==========================================================================
   Oplo — the bar's menus.

   Hovering a link in the bar opens its menu under the bar, the way Apple's
   does: the panel grows to the height of what it holds, the page behind it
   blurs, and moving along the bar to another link swaps the menu in place
   rather than closing and opening again. Leaving the bar and the panel closes
   it, after a moment, so a pointer that slips off by a few pixels does not.

   A pointer only. On a touch screen a tap on the link goes to the page, as it
   always has, and on a phone the bar is a drawer with no menus at all. From a
   keyboard, each link is followed by a small button — shown only when it has
   focus — that opens the menu and moves into it; Escape closes it and returns
   to that button.

   The menus themselves are written into every page's bar by tools/build.py,
   from its MENUS, so the markup and this script never disagree about what a
   menu holds. Dependency-free; safe to load twice.
   ========================================================================== */
(function () {
  "use strict";
  if (window.OploMenu) return;

  var OPEN_DELAY = 150, CLOSE_DELAY = 220, FADE = 320;
  var nav, flyout, inner, scrim, items = [], menus = [], buttons = [];
  var current = -1, byKey = false, openTimer = 0, closeTimer = 0, clearTimer = 0, pointer;

  function $(id) { return document.getElementById(id); }

  function measure() {
    if (current < 0) return;
    flyout.style.height = inner.offsetHeight + "px";
  }

  function show(i, fromKey) {
    if (!menus[i]) return;
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    clearTimeout(clearTimer);
    if (window.OploSearch && window.OploSearch.isOpen()) window.OploSearch.close();
    var fresh = current < 0;
    current = i;
    byKey = !!fromKey;
    menus.forEach(function (m, n) { m.classList.toggle("on", n === i); });
    buttons.forEach(function (b, n) { if (b) b.setAttribute("aria-expanded", String(n === i)); });
    items.forEach(function (li, n) { li.classList.toggle("on", n === i); });
    nav.classList.add("menu-open");
    if (scrim) scrim.hidden = false;
    flyout.classList.add("is-open");
    flyout.setAttribute("aria-hidden", "false");
    // Grown from nothing on a fresh open: the zero height is committed (reading
    // offsetHeight forces it) before the menu's own height is set, so the
    // change is a transition. Measured here and now rather than on the next
    // frame, which a background or throttled tab may never draw.
    if (fresh) { flyout.style.height = "0px"; void flyout.offsetHeight; }
    measure();
    // From the keyboard, straight into the menu. The panel is visible from the
    // moment it opens (only closing is delayed), so its first link can take
    // focus now.
    if (fromKey) {
      var first = menus[i].querySelector("a");
      if (first) first.focus();
    }
    document.dispatchEvent(new CustomEvent("oplo:menu", { detail: { open: true, menu: i } }));
  }

  function hide(focusButton) {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    if (current < 0) return;
    var was = current;
    current = -1;
    byKey = false;
    flyout.classList.remove("is-open");
    flyout.setAttribute("aria-hidden", "true");
    flyout.style.height = "0px";
    nav.classList.remove("menu-open");
    if (scrim && !(window.OploSearch && window.OploSearch.isOpen())) scrim.hidden = true;
    buttons.forEach(function (b) { if (b) b.setAttribute("aria-expanded", "false"); });
    items.forEach(function (li) { li.classList.remove("on"); });
    // The menu stays drawn while the panel closes over it, then goes.
    clearTimer = setTimeout(function () {
      if (current < 0) menus.forEach(function (m) { m.classList.remove("on"); });
    }, FADE);
    if (focusButton && buttons[was]) buttons[was].focus();
    document.dispatchEvent(new CustomEvent("oplo:menu", { detail: { open: false } }));
  }

  function later() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    if (current > -1 && !byKey) closeTimer = setTimeout(function () { hide(false); }, CLOSE_DELAY);
  }

  function isMouse(e) { return e.pointerType === "mouse" && pointer.matches; }

  function start() {
    nav = $("nav");
    flyout = $("navFlyout");
    if (!nav || !flyout) return;
    inner = flyout.querySelector(".nav-flyout-in");
    scrim = $("navScrim");
    menus = [].slice.call(flyout.querySelectorAll(".nav-menu"));
    items = [].slice.call(nav.querySelectorAll(".nav-links > li"));
    pointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 834px)");

    // Shipped hidden, so a page without this script never shows a menu. From
    // here the panel's own classes decide.
    flyout.hidden = false;
    flyout.setAttribute("aria-hidden", "true");

    items.forEach(function (li, i) {
      var b = li.querySelector(".nav-more");
      buttons[i] = b;
      if (!menus[i]) return;
      li.addEventListener("pointerenter", function (e) {
        if (!isMouse(e)) return;
        clearTimeout(closeTimer);
        clearTimeout(openTimer);
        if (current > -1) show(i);
        else openTimer = setTimeout(function () { show(i); }, OPEN_DELAY);
      });
      li.addEventListener("pointerleave", function (e) { if (isMouse(e)) later(); });
      if (b) {
        b.addEventListener("click", function () {
          if (current === i) hide(true);
          else show(i, true);
        });
      }
    });

    flyout.addEventListener("pointerenter", function (e) { if (isMouse(e)) clearTimeout(closeTimer); });
    flyout.addEventListener("pointerleave", function (e) { if (isMouse(e)) later(); });
    if (scrim) scrim.addEventListener("click", function () { hide(false); });

    // A link in a menu goes somewhere; the menu should not still be open on
    // the way there, or when the browser's back button returns to this page.
    flyout.addEventListener("click", function (e) { if (e.target.closest("a")) hide(false); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && current > -1) { e.stopPropagation(); hide(true); }
    }, true);

    // Tabbing out of the bar and its menu closes it.
    nav.addEventListener("focusout", function (e) {
      if (current > -1 && byKey && !(e.relatedTarget && nav.contains(e.relatedTarget))) hide(false);
    });

    window.addEventListener("resize", function () { if (current > -1) { if (pointer.matches || byKey) measure(); else hide(false); } });
    window.addEventListener("pageshow", function () { hide(false); });
    if (pointer.addEventListener) pointer.addEventListener("change", function () { hide(false); });
  }

  window.OploMenu = { open: function (i) { show(i, false); }, close: function () { hide(false); },
                      isOpen: function () { return current > -1; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
