/* ==========================================================================
   Admin › Settings › Modules — template T7 (O8).

   One card for each module a school may turn on: Family, Fees, Homework, Lesson plans, Messages. All start off. A card saves on
   its own (PUT /school/modules; one audit row for each switch that changed) and says what it did. A module that is not built, whose
   flag in shell/routes.js is off, cannot be switched on: its switch is off and gives the reason, because the flag is the hard
   off-switch and a school's settings must not be able to get past it. The states are the ones in docs/design/state-tables.md §1.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  var api = function () { return window.OPLO_API; };
  var online = function () { return typeof navigator === "undefined" || navigator.onLine !== false; };

  /* an error in words: offline, an unexpected failure with its request id, otherwise the card's own sentence */
  function words(e, fallback) {
    if (e && e.code === "offline") return t("admin.modules.offline");
    if (e && e.status >= 500 && e.requestId) return t("common.server_error", { id: e.requestId });
    return fallback;
  }

  function draw(host, env) {
    var syncs = [];                                    // each card's way of asking "may I save now?" again
    var S = OL.templates.T7(host, {
      "class": "ol-admin-modules",
      load: function () { return api().school.profile(); },
      head: function () { return { title: env.title || t("tab.admin.settings"), subtitle: t("admin.modules.subtitle") }; },
      message: function (e) { return words(e, t("admin.modules.load_failed")); },
      denied: function () { return { title: t("admin.modules.denied"), text: t("admin.modules.read_only") }; },
      skeleton: OL.routes.SWITCHES.length,
      note: function (d) {
        return [d.can && d.can.manage ? null : OL.ui.banner.render({ tone: "info", text: t("admin.modules.read_only") }),
          online() ? null : OL.ui.banner.render({ tone: "offline", text: t("admin.modules.offline") })];
      },
      cards: function (d) {
        syncs = [];
        return OL.routes.SWITCHES.map(function (k) { return card(k, d); }).concat(h("p", { class: "ol-t7__note", text: t("admin.modules.footer") }));
      }
    });

    function card(k, d) {
      var saved = d.profile.modules[k] === true, now = saved;
      var may = !!(d.can && d.can.manage), built = OL.routes.FLAGS[k] === true;
      var sw = OL.ui.check.toggle({ label: t("admin.modules.on_label"), checked: saved, disabled: !may || !built, helper: built ? null : t("admin.modules.unavailable"),
        onChange: function (on) { now = on; sync(); } });
      var save = OL.ui.button.render({ label: t("common.save"), variant: "primary", size: "sm", onClick: submit });
      var msg = h("div", { class: "ol-t7__msg" });
      var actions = h("div", { class: "ol-t7__actions" }, may ? save : null);
      if (k === "family") {
        // there is no family app to look at yet: the button is here so its absence is explained, not so it can be pressed
        actions.appendChild(OL.ui.button.render({ label: t("admin.modules.preview"), variant: "secondary", size: "sm", disabled: true, disabledReason: t("admin.modules.preview_unavailable") }));
      }
      function sync() {
        var off = !online();
        save.setDisabled(now === saved || off, off ? t("admin.modules.offline") : "");
        if (!off) save.removeAttribute("data-tip");
      }
      function submit() {
        if (now === saved) return;
        save.setLoading(true); OL.clear(msg);
        var body = {}; body[k] = now;
        api().school.putModules(body).then(function (r) {
          save.setLoading(false);
          saved = now = r.profile.modules[k] === true;
          d.profile = r.profile;
          OL.routes.setSchool(r.profile);              // the rail and the tabs follow the switch at once
          if (OL.shell && OL.shell.refresh) OL.shell.refresh();
          sync();
          OL.ui.toast.show({ text: t(saved ? "admin.modules.saved_on" : "admin.modules.saved_off", { name: t("admin.modules." + k + ".name") }) });
        }, function (e) {
          save.setLoading(false);
          now = saved; sw.input.checked = saved; sync();   // the card keeps the state it had, and says so
          msg.appendChild(OL.ui.banner.render({ tone: e && e.code === "offline" ? "offline" : "danger", text: words(e, t("admin.modules.save_failed")) }));
        });
      }
      syncs.push(sync); sync();
      return OL.ui.card.render({ title: t("admin.modules." + k + ".name"), why: t("admin.modules." + k + ".text"), level: 2,
        body: [h("div", { class: "ol-t7__row" }, sw, actions), msg] });
    }

    // Going offline or coming back changes the banner and what Save may do, not the switches the person has set
    function net() {
      if (!host.isConnected) { window.removeEventListener("online", net); window.removeEventListener("offline", net); return; }
      S.note(); syncs.forEach(function (f) { f(); });
    }
    window.addEventListener("online", net); window.addEventListener("offline", net);
    S.start();
  }

  OL.pages.register("modules", { template: "T7", draw: draw });
})();
