/* ==========================================================================
   OL.url — the address as state.

   Filters, the open tab, a drawer's record (?peek=stu_123), the page of a list
   all live in the query string, so a refresh keeps them, a link shares them and
   Back goes where it should. Nothing here navigates between screens (that is the
   router in shell.js); it reads and rewrites the part after the "?" of the
   address the screen is already on.

   set() replaces the current history entry by default: typing in a search box
   must not leave sixty entries behind Back. Pass { replace: false } for a change
   a person would expect Back to undo.

   OL.url.get(name) · all() → { name: value } · set(name, value, opts) ·
   setMany({ name: value|null }, opts) · clear(names, opts) · onChange(fn)
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL = window.OL || {};
  var listeners = [];

  function params() { return new URLSearchParams(location.search); }

  function write(p, opts) {
    var s = p.toString(), url = location.pathname + (s ? "?" + s : "") + location.hash;
    if (url === location.pathname + location.search + location.hash) return;
    try {
      if (opts && opts.replace === false) history.pushState(history.state, "", url);
      else history.replaceState(history.state, "", url);
    } catch (e) { /* a sandboxed frame has no history to write */ }
    listeners.forEach(function (fn) { fn(all()); });
  }

  function all() {
    var out = {};
    params().forEach(function (v, k) { out[k] = v; });
    return out;
  }

  OL.url = {
    get: function (name) { return params().get(name); },
    all: all,
    set: function (name, value, opts) {
      var p = params();
      if (value == null || value === "") p.delete(name); else p.set(name, value);
      write(p, opts);
    },
    setMany: function (patch, opts) {
      var p = params();
      Object.keys(patch).forEach(function (k) { var v = patch[k]; if (v == null || v === "") p.delete(k); else p.set(k, v); });
      write(p, opts);
    },
    clear: function (names, opts) {
      var p = params();
      (names || Array.from(p.keys())).forEach(function (k) { p.delete(k); });
      write(p, opts);
    },
    onChange: function (fn) { listeners.push(fn); }
  };
})();
