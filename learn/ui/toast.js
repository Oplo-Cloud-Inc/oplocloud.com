/* ==========================================================================
   C-17 Toast.

   Bottom-left, five seconds (ten when there is an Undo), at most three stacked.
   It is spoken as well as drawn: the stack is a polite live region. Hovering
   or focusing a toast holds it, because a toast that vanishes while the person
   is reaching for its Undo is a trap.

   Undo is preferred to a confirm for reversible single actions ("Holiday
   deleted · Undo"): the action happens at once and the toast carries the way
   back. The caller's `undo` runs once, and the toast closes.

   OL.ui.toast.show({ text, tone: success|info|error, undo (a function: its presence draws the Undo button), ms })
   → { close() }
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var host = null, MAX = 3;
  var ICON = { success: "check-circle", info: "info", error: "alert-circle" };

  function stack() {
    if (!host) { host = h("div", { class: "ol-toasts", role: "status", "aria-live": "polite" }); document.body.appendChild(host); }
    return host;
  }

  function show(p) {
    var tone = p.tone || "success";
    var ms = p.ms || (p.undo ? 10000 : 5000), timer = null, left = ms, started = 0, gone = false;
    var el = h("div", { class: OL.cx("ol-toast", "ol-toast--" + tone) }, OL.icon(ICON[tone] || "info", 20), h("span", { class: "ol-toast__text", text: p.text }));
    function close() {
      if (gone) return;
      gone = true; clearTimeout(timer);
      el.classList.remove("is-on");
      setTimeout(function () { el.remove(); }, 160);
    }
    if (p.undo) el.appendChild(h("button", { type: "button", class: "ol-toast__undo", on: { click: function () { close(); p.undo(); } } }, t("common.undo")));
    el.appendChild(h("button", { type: "button", class: "ol-toast__x", "aria-label": t("common.dismiss"), on: { click: close } }, OL.icon("x", 16)));
    function run() { started = Date.now(); timer = setTimeout(close, left); }
    function hold() { clearTimeout(timer); left -= Date.now() - started; if (left < 1000) left = 1000; }
    el.addEventListener("mouseenter", hold); el.addEventListener("mouseleave", run);
    el.addEventListener("focusin", hold); el.addEventListener("focusout", run);

    var s = stack();
    s.appendChild(el);
    while (s.children.length > MAX) s.removeChild(s.firstChild);
    requestAnimationFrame(function () { el.classList.add("is-on"); });
    run();
    return { close: close, el: el };
  }

  OL.ui.toast = { show: show, states: ["success", "info", "error", "with undo"] };
})();
