/* ==========================================================================
   Oplo — the bar's menus.

   Hovering a link in the bar opens its menu under the bar, the way Apple's
   does, and everything about the motion is chosen to feel like one surface
   rather than a box appearing:

     the panel    grows from under the bar to its menu's height with a long,
                  settling ease, and morphs between menus rather than closing
                  and opening — drawn as a transform, so the browser moves a
                  layer instead of laying the page out on every frame
     the links    arrive row by row down each column and column by column
                  across, the order an eye reads them; switching menus slides
                  the new links in from the side the pointer moved toward
                  while the old ones leave the other way
     the bar      turns solid by fading, not snapping, and a hairline glides
                  under whichever link is open
     closing      gets out of the way quickly: the links go first, then the
                  panel folds up and the page comes back into focus

   And about intent, which is what makes a menu feel calm:

     opening      waits a moment, so sweeping across the bar opens nothing
     switching    waits a little less, so cutting diagonally from a link down
                  towards a far column does not flick through the menus the
                  pointer crosses on the way
     closing      waits too, so slipping off the panel by a few pixels does
                  not shut it; coming back while it folds reopens it from
                  where it is, without starting again

   A pointer only. On a touch screen a tap on the link goes to the page, as it
   always has, and on a phone the bar is a drawer with no menus at all. From a
   keyboard, each link is followed by a small button — shown only when it has
   focus — that opens the menu and moves into it; Escape closes it and returns
   to that button. With reduced motion asked for, it all still works, without
   the travel.

   The menus themselves are written into every page's bar by tools/build.py,
   from its MENUS. Dependency-free; safe to load twice.
   ========================================================================== */
(function () {
  "use strict";
  if (window.OploMenu) return;

  var OPEN_DELAY = 110, SWITCH_DELAY = 70, CLOSE_DELAY = 240, FOLD = 440, SETTLE = 300;

  var nav, flyout, bg, scrim, glide, items = [], menus = [], buttons = [], heights = [], tallest = 0;
  var current = -1, byKey = false, pointer, reduced;
  var openTimer = 0, switchTimer = 0, closeTimer = 0, foldTimer = 0, settleTimer = 0;

  function $(id) { return document.getElementById(id); }
  function isMouse(e) { return e.pointerType === "mouse" && pointer.matches; }
  function stopTimers() {
    clearTimeout(openTimer); clearTimeout(switchTimer); clearTimeout(closeTimer);
  }
  // Commits whatever style has just been set, so the next change animates
  // from it. Reading layout is the only reliable way; a skipped animation
  // frame in a background tab would otherwise swallow the starting point.
  function commit(el) { void el.offsetHeight; }

  /* Every menu is laid out all the time, stacked in the same place and
     invisible unless it is open, so its height is always known. The panel is
     as tall as the tallest and is scaled to the one showing. */
  function measure() {
    tallest = 0;
    menus.forEach(function (m, i) {
      heights[i] = m.offsetHeight;
      if (heights[i] > tallest) tallest = heights[i];
    });
    flyout.style.height = tallest + "px";
  }
  function fit(i) {
    bg.style.transform = "scaleY(" + (i > -1 && tallest ? heights[i] / tallest : 0).toFixed(4) + ")";
  }

  function stagger(menu, fresh) {
    [].forEach.call(menu.querySelectorAll(".nav-menu-col"), function (col, c) {
      var base = fresh ? 80 + c * 50 : 10 + c * 30, step = fresh ? 24 : 14;
      var h = col.querySelector(".nav-menu-h");
      if (h) h.style.setProperty("--d", (base - 10) + "ms");
      [].forEach.call(col.querySelectorAll("li"), function (li, r) {
        li.style.setProperty("--d", (base + r * step) + "ms");
      });
    });
  }

  function glideTo(i, jump) {
    if (!glide) return;
    var a = items[i] && items[i].querySelector("a");
    if (!a) return;
    var box = glide.parentNode.getBoundingClientRect(), r = a.getBoundingClientRect();
    var to = "translate3d(" + (r.left - box.left).toFixed(2) + "px,0,0) scaleX(" + (r.width / 100).toFixed(4) + ")";
    if (jump || !glide.classList.contains("on")) {
      glide.classList.add("snap");
      glide.style.transform = to;
      commit(glide);
      glide.classList.remove("snap");
    } else {
      glide.style.transform = to;
    }
    glide.classList.add("on");
  }

  function show(i, fromKey) {
    if (!menus[i]) return;
    stopTimers();
    if (window.OploSearch && window.OploSearch.isOpen()) window.OploSearch.close();
    if (i === current) { if (fromKey) byKey = true; return; }

    var was = current;
    var folding = flyout.classList.contains("is-closing");
    var fresh = was < 0 && !folding;
    var dir = was < 0 ? 0 : (i > was ? 1 : -1);
    current = i;
    byKey = !!fromKey;
    clearTimeout(foldTimer);

    if (fresh) measure();
    // A fresh menu drops in from just above; a menu switched to slides in
    // from the side the pointer moved toward.
    flyout.style.setProperty("--from-y", (fresh ? -10 : 0) + "px");
    flyout.style.setProperty("--from-x", (dir * 22) + "px");
    flyout.style.setProperty("--to-x", (dir * -22) + "px");
    flyout.classList.remove("is-closing");
    flyout.classList.add("is-open");
    flyout.setAttribute("aria-hidden", "false");

    // The menu that was showing leaves; any other is put away.
    menus.forEach(function (m, n) {
      if (n === i) return;
      if (m.classList.contains("on")) { m.classList.remove("on"); m.classList.add("out"); }
    });

    var m = menus[i];
    var returning = m.classList.contains("out") || (folding && m.classList.contains("on"));
    m.classList.remove("out");
    stagger(m, fresh);
    if (!returning) {
      // Its links jump to where they enter from, then travel in. A menu the
      // pointer is coming back to is already on its way and carries on.
      m.classList.remove("on");
      m.classList.add("prep");
      commit(m);
      m.classList.remove("prep");
    }
    m.classList.add("on");

    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      menus.forEach(function (x, n) { if (n !== current) x.classList.remove("out"); });
    }, SETTLE);

    buttons.forEach(function (b, n) { if (b) b.setAttribute("aria-expanded", String(n === i)); });
    items.forEach(function (li, n) { li.classList.toggle("on", n === i); });
    nav.classList.add("menu-open");

    if (scrim) {
      scrim.classList.add("menu-fade");
      if (scrim.hidden) { scrim.hidden = false; commit(scrim); }
      scrim.classList.add("is-on");
    }

    if (fresh) {
      bg.classList.add("snap");
      fit(-1);
      commit(bg);
      bg.classList.remove("snap");
    }
    fit(i);
    glideTo(i, fresh);

    if (fromKey) {
      var first = m.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
    document.dispatchEvent(new CustomEvent("oplo:menu", { detail: { open: true, menu: i } }));
  }

  function hide(focusButton) {
    stopTimers();
    if (current < 0) return;
    var was = current;
    current = -1;
    byKey = false;

    flyout.classList.add("is-closing");
    flyout.setAttribute("aria-hidden", "true");
    nav.classList.remove("menu-open");
    buttons.forEach(function (b) { if (b) b.setAttribute("aria-expanded", "false"); });
    items.forEach(function (li) { li.classList.remove("on"); });
    fit(-1);
    if (glide) glide.classList.remove("on");
    if (scrim) scrim.classList.remove("is-on");

    clearTimeout(foldTimer);
    foldTimer = setTimeout(function () {
      if (current > -1) return;
      flyout.classList.remove("is-open", "is-closing");
      menus.forEach(function (m) { m.classList.remove("on", "out"); });
      if (scrim) {
        scrim.classList.remove("menu-fade");
        if (!(window.OploSearch && window.OploSearch.isOpen())) scrim.hidden = true;
      }
    }, reduced.matches ? 0 : FOLD);

    if (focusButton && buttons[was]) buttons[was].focus();
    document.dispatchEvent(new CustomEvent("oplo:menu", { detail: { open: false } }));
  }

  function later() {
    clearTimeout(openTimer);
    clearTimeout(switchTimer);
    clearTimeout(closeTimer);
    if (current > -1 && !byKey) closeTimer = setTimeout(function () { hide(false); }, CLOSE_DELAY);
  }

  function start() {
    nav = $("nav");
    flyout = $("navFlyout");
    if (!nav || !flyout) return;
    bg = flyout.querySelector(".nav-flyout-bg");
    if (!bg) {
      bg = document.createElement("div");
      bg.className = "nav-flyout-bg";
      flyout.insertBefore(bg, flyout.firstChild);
    }
    scrim = $("navScrim");
    menus = [].slice.call(flyout.querySelectorAll(".nav-menu"));
    items = [].slice.call(nav.querySelectorAll(".nav-links > li"));
    pointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 834px)");
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    var inner = nav.querySelector(".nav-in");
    if (inner) {
      glide = document.createElement("span");
      glide.className = "nav-glide";
      glide.setAttribute("aria-hidden", "true");
      inner.appendChild(glide);
    }

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
        stopTimers();
        if (current > -1) {
          if (current !== i) switchTimer = setTimeout(function () { show(i); }, SWITCH_DELAY);
        } else if (flyout.classList.contains("is-closing")) {
          show(i);
        } else {
          openTimer = setTimeout(function () { show(i); }, OPEN_DELAY);
        }
      });
      li.addEventListener("pointerleave", function (e) { if (isMouse(e)) later(); });
      if (b) {
        b.addEventListener("click", function () {
          if (current === i) hide(true);
          else show(i, true);
        });
      }
    });

    // The panel takes no pointer itself; the part of it that is showing does.
    // Events from inside still reach it, so this is one hover region the
    // exact size of what is drawn.
    flyout.addEventListener("pointerover", function (e) { if (isMouse(e)) clearTimeout(closeTimer); });
    flyout.addEventListener("pointerout", function (e) {
      if (isMouse(e) && !(e.relatedTarget && flyout.contains(e.relatedTarget))) later();
    });
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

    window.addEventListener("resize", function () {
      if (current < 0) return;
      if (!pointer.matches && !byKey) { hide(false); return; }
      measure();
      fit(current);
      glideTo(current, true);
    });
    window.addEventListener("pageshow", function () { hide(false); });
    if (pointer.addEventListener) pointer.addEventListener("change", function () { hide(false); });
    // Web fonts change how tall a menu is; measure again once they are in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); });
  }

  window.OploMenu = { open: function (i) { show(i, false); }, close: function () { hide(false); },
                      isOpen: function () { return current > -1; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

/* ==========================================================================
   Oplo — the bars' material.

   The bar stays at the top of the window, unless the page has a chapter bar,
   in which case that one stays and the bar scrolls away above it
   (assets/css/oplo-design.css). Two things follow the scroll here:

     --nav-y      how far a scrolling bar has gone off the top (0 to −44px),
                  so its menus, search and drawer — fixed to the window —
                  still open right under its edge
     .bars-dark   on the root while what is just below the lowest bar is dark — a dark band, a dark card, the photograph at the top
   of the front page. The bars are dark glass then, and light glass over
   everything else.

   "Dark" is read from the page itself: the first painted background up from
   whatever is there. A background that is a picture or a gradient says
   nothing by its colour, so it is read by its text instead — light text is
   set on something dark.

   OEdu's welcome page scrolls inside itself and does this in
   learn/landing.js, so this stands aside there.
   ========================================================================== */
(function () {
  "use strict";
  if (window.OploBars) return;
  window.OploBars = true;

  function lum(rgb) {
    var m = /rgba?\(([^)]+)\)/.exec(rgb || "");
    if (!m) return null;
    var c = m[1].split(",").map(Number);
    if (c.length > 3 && c[3] < 0.5) return null;
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  }
  function darkAt(y) {
    var at = document.elementFromPoint(window.innerWidth / 2, y);
    for (var n = at; n && n.nodeType === 1; n = n.parentElement) {
      if (n.closest(".nav, .chapter")) continue;
      var cs = getComputedStyle(n), l = lum(cs.backgroundColor);
      if (l != null) return l < 0.4;
      if (cs.backgroundImage && cs.backgroundImage !== "none") {
        var t = lum(cs.color);
        if (t != null) return t > 0.6;
      }
    }
    return false;
  }

  function start() {
    var nav = document.getElementById("nav");
    if (!nav || nav.closest(".ld")) return;
    var root = document.documentElement, chapter = document.querySelector(".chapter"), queued = false;
    function paint() {
      queued = false;
      if (chapter) {
        var y = Math.max(0, window.scrollY || window.pageYOffset || 0);
        root.style.setProperty("--nav-y", -Math.min(y, nav.offsetHeight) + "px");
      }
      // Leave the material alone while a menu or search is open over the page.
      if (nav.classList.contains("menu-open") || nav.classList.contains("searching")) return;
      var bottom = (chapter || nav).getBoundingClientRect().bottom;
      if (bottom > 0) root.classList.toggle("bars-dark", darkAt(bottom + 2));
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    window.addEventListener("load", queue);
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
