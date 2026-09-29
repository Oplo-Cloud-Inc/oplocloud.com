/* ==========================================================================
   OC EFM — Inbox.

   Everything that needs a person, in one place: approvals first, because
   they're one click each; then exceptions, grouped by where they live; then
   what you've done, so the page also answers "where was I?".
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var local = { area: "" };

  EFM.view("inbox", {
    title: "Inbox", icon: "inbox",
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
      var items = E.attention();
      var journals = Object.values(E.journals).filter(function (j) { return j.status === "pending" && app.inScope(j.entity); });
      var invoices = Object.values(E.apInvoices).filter(function (i) { return (i.status === "review" || i.status === "captured") && app.inScope(i.entity); });
      var n = journals.length + invoices.length;

      var page = h("div");
      page.appendChild(ui.pageHead("Inbox", n + items.length ? (n ? n + " approval" + (n === 1 ? "" : "s") + " waiting · " : "") + items.length + " thing" + (items.length === 1 ? "" : "s") + " that need a person" : "Nothing needs you right now.", []));

      if (n) page.appendChild(h("div", { style: { marginBottom: "16px" } }, approvals(ctx, journals, invoices)));

      // Exceptions, grouped by where they live.
      var areas = {};
      items.forEach(function (a) { areas[a.area] = (areas[a.area] || 0) + 1; });
      if (local.area && !areas[local.area]) local.area = "";
      var chips = h("div", { class: "filters" }, ui.chipFilter("Everything", items.length, !local.area, function () { local.area = ""; app.refresh(); }));
      Object.keys(areas).forEach(function (a) { chips.appendChild(ui.chipFilter(a, areas[a], local.area === a, function () { local.area = a; app.refresh(); })); });
      page.appendChild(chips);
      var list = h("div", { class: "att" });
      items.filter(function (a) { return !local.area || a.area === local.area; }).forEach(function (a) {
        list.appendChild(h("button", { type: "button", class: "att-i", on: { click: function () { app.navigate(a.action.go); } } }, ui.sev(a.sev),
          h("div", { class: "grow" }, h("div", { class: "area" }, a.area), h("div", { class: "t" }, a.title), h("div", { class: "x" }, a.detail)),
          h("div", { class: "a" }, a.amount ? h("span", { class: "amt" }, E.fmt(a.amount, "USD", { compact: true })) : null, h("span", { class: "btn sm" }, a.action.label), ui.icon("chev", "sm"))));
      });
      if (!items.length) list.appendChild(ui.empty("All clear", "No exceptions, no reconciliations waiting, nothing late.", "check"));
      page.appendChild(ui.card({ title: "Needs attention", meta: "most urgent first", flush: true, body: list }));

      page.appendChild(h("div", { style: { marginTop: "16px" } }, recent(ctx)));
      return page;
    }
  });

  function approvals(ctx, journals, invoices) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
    var rows = [];
    journals.forEach(function (j) { rows.push({ kind: "journal", j: j, usd: E.usdOf(j.entity, j.total, j.period, "avg"), date: j.submittedAt || j.createdAt }); });
    invoices.forEach(function (i) { rows.push({ kind: "ap", i: i, usd: E.usdOf(i.entity, i.amount, cp, "close"), date: i.capturedAt }); });
    rows.sort(function (a, b) { return b.usd - a.usd; });
    var list = h("div", { class: "att" });
    rows.forEach(function (r) {
      var title, sub, amount, action, open;
      if (r.kind === "journal") {
        var j = r.j, can = E.can("journal.approve", app.actor(), { createdBy: j.createdBy, usd: r.usd });
        var reviewer = r.usd > E.limits.journal.controller * 100 ? E.people.dana : E.people.marcus;
        title = j.memo; sub = "Journal " + j.id + " · " + E.entity[j.entity].short + " · prepared by " + ui.person(j.createdBy).name + " · " + ui.period(j.period);
        amount = E.fmt(j.total, E.entity[j.entity].currency);
        open = function () { app.open({ kind: "journal", id: j.id }); };
        action = can.ok ? ui.btn("Approve", { size: "sm", kind: "primary", onClick: function () { app.run("journal.approve", { id: j.id }, { ok: j.id + " approved and posted." }); } })
          : app.live ? ui.gated("journal.approve", { createdBy: j.createdBy, usd: r.usd }, "Approve", function () {}, { size: "sm" })
          : ui.btn("Simulate " + reviewer.name.split(" ")[0], { size: "sm", kind: "ghost", icon: "users", onClick: function () { app.run("journal.approve", { id: j.id, simulated: true }, { actor: reviewer, ok: reviewer.name + " approved " + j.id + " (simulated)." }); } });
      } else {
        var i = r.i, v = E.vendors[i.vendor];
        var flags = (i.flags || []).filter(function (f) { return !f.resolved; });
        title = v.name + " · " + i.number; sub = "Vendor invoice · " + E.entity[i.entity].short + " · due " + ui.date(i.due) + (flags.length ? " · " + flags[0].title.toLowerCase() : "");
        amount = E.fmt(i.amount, i.currency);
        open = function () { app.open({ kind: "ap", id: i.id }); };
        action = flags.length ? ui.btn("Resolve", { size: "sm", onClick: open })
          : ui.gated("ap.approve", { createdBy: i.createdBy, usd: r.usd }, "Approve", function () { app.run("ap.approve", { id: i.id }, { ok: i.number + " approved and posted." }); }, { size: "sm", kind: "primary" });
      }
      list.appendChild(h("div", { class: "att-i" }, ui.icon(r.kind === "journal" ? "journal" : "doc"),
        h("button", { type: "button", class: "grow", style: { textAlign: "left" }, on: { click: open } }, h("div", { class: "t" }, title), h("div", { class: "x" }, sub)),
        h("div", { class: "a" }, h("span", { class: "amt" }, amount), action, ui.btn("Open", { size: "sm", onClick: open }))));
    });
    var easy = rows.filter(function (r) { return r.kind === "ap" && !(r.i.flags || []).some(function (f) { return !f.resolved; }); });
    return ui.card({ title: "Approvals", meta: rows.length + " waiting · largest first", flush: true, body: list,
      tools: easy.length > 1 ? ui.btn("Approve " + easy.length + " clean invoices", { size: "sm", kind: "ghost", icon: "check", onClick: function () {
        ui.confirm({ title: "Approve " + easy.length + " invoices?", text: "These have no flags. Each posts to the ledger as it's approved: " + easy.map(function (r) { return E.vendors[r.i.vendor].name; }).join(", ") + ".", confirmLabel: "Approve all" })
          .then(function (y) {
            if (!y) return;
            var ok = 0;
            easy.forEach(function (r) { try { E.exec("ap.approve", { id: r.i.id }, app.actor()); ok++; } catch (e) { if (!(e instanceof EFM.Refusal)) throw e; } });
            app.commit();
            ui.toast("Approved " + ok + " invoice" + (ok === 1 ? "" : "s") + ".", { sub: "Each one is now in the ledger and ready for the payment run." });
          });
      } }) : null });
  }

  function recent(ctx) {
    var E = ctx.E, app = ctx.app;
    var mine = E.audit.filter(function (ev) { return app.isMe(ev.actor); }).slice(-12).reverse();
    var others = E.audit.filter(function (ev) { return !app.isMe(ev.actor) && ev.actor !== "system"; }).slice(-6).reverse();
    var g = h("div", { class: "grid" });
    g.appendChild(ui.card({ title: "What you've done", meta: mine.length ? "latest first" : null, span: 6,
      body: mine.length ? ui.timeline(mine) : ui.empty("Nothing yet", "Approvals, reconciliations and close steps you take show up here — and in the audit trail.", "clip") }));
    g.appendChild(ui.card({ title: "What the team did", meta: "latest first", span: 6, body: ui.timeline(others) }));
    return g;
  }
})(window);
