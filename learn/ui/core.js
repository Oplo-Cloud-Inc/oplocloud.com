/* ==========================================================================
   Oplo Learn — the front end's one namespace, and what every component uses.

   window.OL is where the rebuilt screens live: OL.ui (the component library,
   one file each), OL.i18n and OL.fmt (words, dates, numbers, money), OL.shell
   (rail, top bar, palette), OL.templates (the nine page shells) and
   OL.pages (a screen is a template plus a config). Nothing here knows the
   backend exists; api.js is still the only file that does.

   The pieces every component shares, so none of them invents its own:

     OL.h        build an element. Text goes in through textContent, never
                 through innerHTML, so a student's name cannot become markup.
     OL.cx       join class names
     OL.uid      a unique id, for label/for and aria-describedby
     OL.announce speak a sentence to a screen reader (toasts, autosave, results)
     OL.overlay  the stack of things that sit over the page. Esc closes the top
                 one only, focus is trapped in it and handed back to whatever
                 opened it. A drawer, a modal, a popover and the palette are all
                 the same thing to this.
     OL.tip      a tooltip that is also read: it is the accessible name of an
                 icon-only button and the reason on a disabled one.
   ========================================================================== */
(function () {
  "use strict";

  var OL = window.OL = window.OL || {};
  OL.ui = OL.ui || {};
  OL.shell = OL.shell || {};
  OL.templates = OL.templates || {};
  OL.pages = OL.pages || {};

  var seq = 0;
  OL.uid = function (prefix) { return (prefix || "ol") + "-" + (++seq); };

  /* "a", ["b", false, "c"], { d: true, e: false } → "a b c d" */
  OL.cx = function () {
    var out = [];
    (function walk(list) {
      for (var i = 0; i < list.length; i++) {
        var v = list[i];
        if (!v) continue;
        if (typeof v === "string") out.push(v);
        else if (Array.isArray(v)) walk(v);
        else if (typeof v === "object") Object.keys(v).forEach(function (k) { if (v[k]) out.push(k); });
      }
    })(arguments);
    return out.join(" ");
  };

  /* OL.h("button", { class: "ol-btn", on: { click: go }, aria: { label: "Close" } }, "Save", icon)
     Special props: class, text, on, data, aria, style (custom properties only),
     and the properties a form control needs as properties (value, checked,
     disabled, selected, hidden). Anything else is an attribute; true is the
     bare attribute, false/null/undefined leaves it off. Children may be nodes,
     strings (text), arrays, or nothing. */
  var PROPS = { value: 1, checked: 1, disabled: 1, selected: 1, hidden: 1, indeterminate: 1, readOnly: 1, required: 1 };
  OL.h = function (tag, props) {
    var el = document.createElement(tag), k;
    props = props || {};
    for (k in props) {
      var v = props[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = Array.isArray(v) || typeof v === "object" ? OL.cx(v) : v;
      else if (k === "text") el.textContent = v;
      else if (k === "on") Object.keys(v).forEach(function (n) { if (v[n]) el.addEventListener(n, v[n]); });
      else if (k === "data") Object.keys(v).forEach(function (n) { if (v[n] != null) el.dataset[n] = v[n]; });
      else if (k === "aria") Object.keys(v).forEach(function (n) { if (v[n] != null && v[n] !== false) el.setAttribute("aria-" + n, v[n] === true ? "true" : v[n]); });
      else if (k === "style") Object.keys(v).forEach(function (n) { el.style.setProperty(n, v[n]); });
      else if (PROPS[k]) el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (var i = 2; i < arguments.length; i++) OL.append(el, arguments[i]);
    return el;
  };
  OL.append = function (el, child) {
    if (child == null || child === false) return el;
    if (Array.isArray(child)) { child.forEach(function (c) { OL.append(el, c); }); return el; }
    el.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
    return el;
  };
  OL.clear = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  OL.$ = function (sel, root) { return (root || document).querySelector(sel); };
  OL.$$ = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------ Live region
     One polite region for the whole page. Writing the same sentence twice in a
     row is swallowed by screen readers, so a zero-width space alternates. */
  var live = null, flip = false;
  OL.announce = function (text, assertive) {
    if (!live) {
      live = OL.h("div", { class: "ol-sr", role: "status", "aria-live": "polite", "aria-atomic": "true", id: "ol-live" });
      document.body.appendChild(live);
    }
    live.setAttribute("aria-live", assertive ? "assertive" : "polite");
    flip = !flip;
    live.textContent = text + (flip ? "​" : "");
  };

  /* --------------------------------------------------------- Focus handling */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  OL.focusables = function (root) {
    return OL.$$(FOCUSABLE, root).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
  };

  /* While a drawer or a modal is open, the page behind it is out of reach of Tab and of a screen
     reader's cursor. Everything in <body> except `keep` is made inert, apart from what has to keep
     working (the live region, toasts, tooltips, the icon sprite). Returns the function that undoes
     exactly what it did — a drawer under a modal is inert only while the modal is up. */
  OL.inertOthers = function (keep) {
    var done = [];
    [].slice.call(document.body.children).forEach(function (n) {
      if (keep.indexOf(n) > -1 || n.tagName === "SCRIPT" || n.hasAttribute("inert")) return;
      var c = n.classList;
      if (c && (c.contains("ol-sprite") || c.contains("ol-sr") || c.contains("ol-toasts") || c.contains("ol-tooltip"))) return;
      n.setAttribute("inert", ""); done.push(n);
    });
    return function () { done.forEach(function (n) { n.removeAttribute("inert"); }); };
  };

  /* ---------------------------------------------------------------- Overlays
     push({ el, onClose, trap, trigger, guard }) → handle { close() }.
     Esc closes the top overlay (after `guard`, which may veto: a drawer with
     unsaved changes asks first). Tab is kept inside a trapped overlay. When it
     closes, focus returns to `trigger`, or to whatever had it when it opened. */
  var stack = [];
  function topOverlay() { return stack[stack.length - 1]; }
  OL.overlay = {
    push: function (o) {
      o.trigger = o.trigger || document.activeElement;
      o.closed = false;
      stack.push(o);
      o.close = function (why) {
        if (o.closed) return;
        o.closed = true;
        var i = stack.indexOf(o);
        if (i > -1) stack.splice(i, 1);
        if (o.onClose) o.onClose(why);
        var t = o.trigger;
        if (t && t.focus && document.contains(t) && why !== "no-focus") t.focus();
      };
      return o;
    },
    top: topOverlay,
    count: function () { return stack.length; },
    closeAll: function () { while (stack.length) stack[stack.length - 1].close("no-focus"); }
  };
  document.addEventListener("keydown", function (e) {
    var o = topOverlay();
    if (!o) return;
    if (e.key === "Escape" && !e.defaultPrevented) {
      if (o.guard && o.guard() === false) { e.preventDefault(); return; }
      e.preventDefault();
      e.stopPropagation();
      o.close("escape");
    } else if (e.key === "Tab" && o.trap !== false && o.el) {
      var f = OL.focusables(o.el);
      if (!f.length) { e.preventDefault(); o.el.focus(); return; }
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (!o.el.contains(a)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    }
  }, true);

  /* A click outside a popover-style overlay closes it. */
  document.addEventListener("pointerdown", function (e) {
    var o = topOverlay();
    if (!o || !o.outside || !o.el || o.el.contains(e.target)) return;
    if (o.trigger && o.trigger.contains && o.trigger.contains(e.target)) return;
    o.close("outside");
  }, true);

  /* ---------------------------------------------------------------- Tooltip
     data-tip="…" on any element. It is shown on hover and keyboard focus and
     is wired to the element with aria-describedby, so a disabled button's
     reason is read out rather than only drawn. */
  var tipEl = null, tipFor = null;
  function showTip(t) {
    var text = t.getAttribute("data-tip");
    if (!text) return;
    if (!tipEl) {
      tipEl = OL.h("div", { class: "ol-tooltip", role: "tooltip", id: "ol-tooltip" });
      document.body.appendChild(tipEl);
    }
    tipFor = t;
    tipEl.textContent = text;
    tipEl.classList.add("is-on");
    var r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    var top = r.bottom + 8 + h > window.innerHeight ? r.top - h - 8 : r.bottom + 8;
    tipEl.style.setProperty("--x", left + "px");
    tipEl.style.setProperty("--y", top + "px");
    t.setAttribute("aria-describedby", "ol-tooltip");
  }
  function hideTip() {
    if (tipEl) tipEl.classList.remove("is-on");
    if (tipFor) { tipFor.removeAttribute("aria-describedby"); tipFor = null; }
  }
  function tipTarget(e) { return e.target.closest ? e.target.closest("[data-tip]") : null; }
  document.addEventListener("mouseover", function (e) { var t = tipTarget(e); if (t) showTip(t); });
  document.addEventListener("mouseout", function (e) { if (tipTarget(e)) hideTip(); });
  document.addEventListener("focusin", function (e) { var t = tipTarget(e); if (t) showTip(t); });
  document.addEventListener("focusout", function (e) { if (tipTarget(e)) hideTip(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); }, true);

  /* A debounce the lists and the palette share. */
  OL.debounce = function (fn, ms) {
    var t = null;
    var run = function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms);
    };
    run.cancel = function () { clearTimeout(t); };
    return run;
  };

  /* Place a floating element under (or over) an anchor, kept on screen. */
  OL.place = function (pop, anchor, opts) {
    opts = opts || {};
    var r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    var left = opts.align === "end" ? r.right - w : r.left;
    left = Math.max(8, Math.min(vw - w - 8, left));
    var below = r.bottom + 4, top = below + h > vh - 8 && r.top - h - 4 > 8 ? r.top - h - 4 : below;
    pop.style.setProperty("--x", left + "px");
    pop.style.setProperty("--y", top + "px");
    if (opts.matchWidth) pop.style.setProperty("--w", r.width + "px");
  };
})();
