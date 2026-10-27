/* ==========================================================================
   The page registry — which screens have been rebuilt.

   A screen is registered under the key of the old console page it replaces
   (routes.js names those keys). When the console opens that key, and the
   screen's `when` agrees (a screen can be for one country), the frame draws it
   instead of the old page; otherwise the old page is drawn, so a module is
   rebuilt one tab at a time and nothing is ever half-replaced.

     OL.pages.register(key, { template, when(env), draw(host, env) })
     OL.pages.find(key, env) → function (host) | null

   `template` is the template the screen is built on: "T2", or a list such as
   ["T2", "T3", "T5"] when the address picks between a list, a record and a
   form. T1 to T9, Volume 01 §9.1.

   A registration is checked when it is made, because a mistake here used to
   look like nothing: the old page simply appeared. A key that is already taken,
   a page without draw, or one that does not name its template throws, in the
   developer's console. find() hands back a function that draws the page and
   never throws: if draw fails, the page shows an error with a reference and
   Retry, and the failure is logged once under that reference. A person is never
   left with a blank page, and a developer has the number to look for.

   env is built by the console at the moment of opening: { region, route, me,
   go(path), setRecord({ label }), base }. `route` is the address the frame
   parsed — module, tab, sub, record, recordTab, query — so a screen never reads
   the address itself to learn which record it is for.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, defs = {}, t = function (k, p) { return OL.i18n.t(k, p); };

  OL.pages.register = function (key, def) {
    var at = 'OL.pages.register("' + key + '")';
    if (!key || typeof key !== "string") throw new Error("OL.pages.register: the first argument is the key of the old page this one replaces");
    if (defs[key]) throw new Error(at + ": that key is already registered");
    if (!def || typeof def.draw !== "function") throw new Error(at + ": a page needs draw(host, env)");
    var tpl = [].concat(def.template || []);
    if (!tpl.length || !tpl.every(function (x) { return /^T[1-9]$/.test(x); })) throw new Error(at + ": a page names its template, T1 to T9");
    defs[key] = def;
  };

  /* The page could not be drawn: say so where the page would have been, with a reference and Retry. */
  function failed(host, key, e, again) {
    var ref = Math.random().toString(36).slice(2, 8).toUpperCase();
    if (window.console && console.error) console.error("[" + ref + "] the page \"" + key + "\" could not be drawn", e);
    OL.clear(host);
    host.appendChild(OL.ui.empty.render({ kind: "error", icon: "alert-triangle", title: t("pages.error_title"), text: t("pages.error_text"), why: t("pages.error_ref", { ref: ref }),
      primary: { label: t("common.retry"), onClick: again } }));
  }

  OL.pages.find = function (key, env) {
    var d = defs[key];
    if (!d) return null;
    try { if (d.when && !d.when(env)) return null; } catch (e) { if (window.console && console.error) console.error("the page \"" + key + "\" could not say whether it applies", e); return null; }
    return function run(host) {
      try { d.draw(host, env); } catch (e) { failed(host, key, e, function () { run(host); }); }
    };
  };
})();
