/* ==========================================================================
   C-16 Modal dialog.

   Three kinds, and only these:
     confirm          one decision, no fields (440 wide): delete, publish, withdraw
     quick form       up to four fields, no lists (520 wide): rename, add a holiday
     type to confirm  for anything bulk or that reaches families: the primary
                      stays off until the person types the word ("Type PUBLISH to
                      send results to 1,801 families")

   The footer is right-aligned, Cancel then the primary; a destructive primary is
   a danger button that names its action ("Delete 12 entries"), never "OK".
   Anything with more than four fields is a drawer or a page, not this.

   OL.ui.modal.confirm({ title, text, confirmLabel, cancelLabel, danger,
     typeToConfirm, body }) → Promise<boolean>
   OL.ui.modal.open({ title, body, actions, width, onClose }) → handle
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  function open(p) {
    var id = OL.uid("m"), titleId = id + "-t", textId = id + "-d";
    var back = h("div", { class: "ol-scrim ol-scrim--modal", "aria-hidden": "true" });
    var bodyEl = h("div", { class: "ol-modal__body", id: textId });
    OL.append(bodyEl, p.body);
    var foot = h("footer", { class: "ol-modal__foot" }, p.actions || null);
    var el = h("div", { class: OL.cx("ol-modal", "ol-modal--" + (p.width || 520)), role: p.alert ? "alertdialog" : "dialog", "aria-modal": "true", "aria-labelledby": titleId, "aria-describedby": textId, tabindex: "-1" },
      h("h2", { class: "ol-modal__title", id: titleId, text: p.title }), bodyEl, foot);
    var restore = null;
    var ov = OL.overlay.push({
      el: el, trap: true,
      onClose: function (why) {
        el.classList.remove("is-open"); back.classList.remove("is-open");
        if (restore) restore();
        setTimeout(function () { el.remove(); back.remove(); }, 180);
        if (p.onClose) p.onClose(why);
      }
    });
    back.addEventListener("click", function () { if (!p.blocking) ov.close("scrim"); });
    document.body.appendChild(back);
    document.body.appendChild(el);
    restore = OL.inertOthers([el, back]);
    requestAnimationFrame(function () {
      el.classList.add("is-open"); back.classList.add("is-open");
      var first = p.focus ? p.focus() : (OL.focusables(bodyEl)[0] || OL.focusables(foot).filter(function (b) { return b.classList.contains("ol-btn--primary") || b.classList.contains("ol-btn--danger"); })[0] || foot.querySelector("button"));
      if (first) first.focus(); else el.focus();
    });
    return { el: el, bodyEl: bodyEl, footEl: foot, close: function (why) { ov.close(why || "close"); } };
  }

  function confirm(p) {
    return new Promise(function (resolve) {
      var done = false, handle;
      function finish(v) { if (done) return; done = true; resolve(v); handle.close(v ? "ok" : "cancel"); }
      var go = OL.ui.button.render({ label: p.confirmLabel || t("common.confirm"), variant: p.danger ? "danger" : "primary", onClick: function () { finish(true); } });
      var body = h("div", null, p.text ? h("p", { text: p.text }) : null, p.body || null);
      if (p.typeToConfirm) {
        var word = String(p.typeToConfirm);
        var field = OL.ui.input.render({ label: t("modal.type_to_confirm", { word: word }), name: "confirm", autocomplete: "off", onInput: function (v) { go.setDisabled(v.trim() !== word, t("modal.type_to_enable", { word: word })); } });
        body.appendChild(field);
        go.setDisabled(true, t("modal.type_to_enable", { word: word }));
      }
      handle = open({
        title: p.title, width: 440, alert: !!p.danger, body: body, blocking: false,
        actions: [OL.ui.button.render({ label: p.cancelLabel || t("common.cancel"), variant: "secondary", onClick: function () { finish(false); } }), go],
        onClose: function (why) { if (!done) { done = true; resolve(false); } },
        focus: p.danger ? function () { return handle.footEl.querySelector(".ol-btn--secondary"); } : null
      });
    });
  }

  OL.ui.modal = { open: open, confirm: confirm, states: ["confirm", "danger confirm", "type to confirm", "quick form"] };
})();
