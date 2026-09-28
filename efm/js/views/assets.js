/* ==========================================================================
   OC EFM — Fixed assets.

   What OploCloud owns that lasts: the register, what each thing is worth
   now, the month's depreciation run, and a rollforward that ties the
   register to the ledger. Capital purchases join the register by
   themselves when their invoice is approved.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var local = { q: "", cls: "" };

  EFM.view("assets", {
    title: "Fixed assets", icon: "box",
    openId: function (id) { EFM.app.open({ kind: "asset", id: id }); },
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, cp = E.currentPeriod(), cur = app.scopeCurrency();
      var list = Object.values(E.assets).filter(function (a) { return app.inScope(a.entity); });
      function v(a, minor) { return app.inScopeCur(a.entity, minor, cp); }
      var cost = 0, acc = 0, monthly = 0, adds = 0;
      list.forEach(function (a) {
        var b = E.assetBook(a, cp);
        cost += v(a, a.cost); acc += v(a, b.accumulated);
        if (b.nbv > 0 && a.inService.slice(0, 7) < cp) monthly += v(a, Math.min(b.monthly, b.nbv));
        if (a.inService >= E.fy) adds += v(a, a.cost);
      });
      var due = E.entities.filter(function (e) { return app.inScope(e.id) && E.depreciationDue(e.id, cp).length; });

      var page = h("div");
      page.appendChild(ui.pageHead("Fixed assets", list.length + " assets on the register · straight-line, from the month after they go into service",
        [due.length ? ui.gated("asset.depreciate", {}, "Run " + ui.period(cp).slice(0, 3) + " depreciation", function () { runDialog(ctx, due); }, { kind: "primary", icon: "play" })
                    : h("span", { class: "muted", style: { fontSize: "13px" } }, ui.period(cp, true) + " depreciation has run")]));
      page.appendChild(ui.kpis([
        { label: "Cost", icon: "box", value: E.fmt(cost, cur, { compact: true }), sub: "what was paid" },
        { label: "Accumulated depreciation", icon: "trend", value: E.fmt(acc, cur, { compact: true }), sub: "used up so far" },
        { label: "Net book value", icon: "report", value: E.fmt(cost - acc, cur, { compact: true }), sub: ui.pct(cost ? (cost - acc) / cost : 0) + " of cost remains" },
        { label: "Monthly charge", icon: "calendar", value: E.fmt(monthly, cur, { compact: true }), sub: "at the current register" },
        { label: "Added this year", icon: "plus", value: E.fmt(adds, cur, { compact: true }), sub: list.filter(function (a) { return a.inService >= E.fy; }).length + " purchases capitalized" }
      ]));

      var g = h("div", { class: "grid" });
      g.appendChild(h("div", { class: "c8" }, register(ctx, list)));
      g.appendChild(h("div", { class: "c4" }, rollforward(ctx, list)));
      page.appendChild(g);
      return page;
    }
  });

  function register(ctx, list) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
    var body = h("div");
    var classes = [{ id: "", label: "Every class" }].concat(["1510", "1520", "1530"].map(function (a) { return { id: a, label: E.accounts[a].name }; }));
    function draw() {
      ui.clear(body);
      var ql = local.q.toLowerCase();
      var rows = list.filter(function (a) { return (!local.cls || a.cls === local.cls) && (!ql || (a.id + " " + a.name).toLowerCase().indexOf(ql) >= 0); });
      body.appendChild(h("div", { class: "bar" }, ui.searchBox("Search assets", local.q, function (x) { local.q = x; draw(); body.querySelector("input[type=search]").focus(); }, { width: "220px" }),
        ui.select(classes, local.cls, function (x) { local.cls = x; draw(); }, { label: "Class", width: "200px" }), h("span", { class: "sp" }),
        h("span", { class: "muted", style: { fontSize: "12.5px" } }, rows.length + " assets")));
      body.appendChild(ui.table({ rows: rows, sortKey: "nbv", sortDir: -1, onRow: function (a) { app.open({ kind: "asset", id: a.id }); }, columns: [
        { key: "n", label: "Asset", cls: "two", sort: function (a) { return a.name; }, render: function (a) {
          return h("span", null, a.name, h("span", { class: "sub" }, a.id + " · " + E.accounts[a.cls].name + (ctx.scope === "GROUP" ? " · " + E.entity[a.entity].short : "") + " · " + E.dimName("dept", a.dept))); } },
        { key: "s", label: "In service", cls: "nowrap", sort: function (a) { return a.inService; }, render: function (a) { return ui.date(a.inService, "year"); } },
        { key: "l", label: "Life", num: true, sort: function (a) { return a.life; }, render: function (a) { return a.life / 12 + " yrs"; } },
        { key: "c", label: "Cost", num: true, sort: function (a) { return E.usdOf(a.entity, a.cost, cp); }, render: function (a) { return E.fmt(a.cost, E.entity[a.entity].currency, { dp: 0 }); } },
        { key: "nbv", label: "Book value", num: true, sort: function (a) { return E.usdOf(a.entity, E.assetBook(a, cp).nbv, cp); }, render: function (a) {
          var b = E.assetBook(a, cp);
          return h("span", null, E.fmt(b.nbv, E.entity[a.entity].currency, { dp: 0 }), h("span", { class: "sub" }, b.nbv <= 0 ? "fully depreciated" : ui.pct(b.nbv / a.cost) + " left")); }, cls: "two" },
        { key: "t", label: "Depreciated to", cls: "nowrap", sort: function (a) { return a.depThrough || ""; }, render: function (a) {
          var b = E.assetBook(a, cp);
          if (b.nbv <= 0) return ui.status("done", "Complete");
          return a.depThrough ? h("span", null, ui.period(a.depThrough)) : ui.status("todo", "Starts " + ui.period(E.addMonths(a.inService.slice(0, 7), 1)).slice(0, 3)); } }
      ] }));
    }
    draw();
    return ui.card({ title: "Register", flush: true, body: body });
  }

  /* Opening + additions = closing, for cost and for depreciation — and the
     closing figures must equal the ledger. */
  function rollforward(ctx, list) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod(), cur = app.scopeCurrency();
    var ents = E.entities.filter(function (e) { return app.inScope(e.id); });
    function conv(e, minor) { return app.inScopeCur(e, minor, cp); }
    var openCost = 0, addCost = 0, openAcc = 0, charge = 0, glCost = 0, glAcc = 0;
    list.forEach(function (a) {
      if (a.inService < E.fy) { openCost += conv(a.entity, a.cost); openAcc += conv(a.entity, a.priorDep || 0); }
      else addCost += conv(a.entity, a.cost);
      charge += conv(a.entity, E.assetBook(a, cp).accumulated - (a.priorDep || 0));
    });
    ents.forEach(function (e) {
      ["1510", "1520", "1530"].forEach(function (a) { glCost += conv(e.id, E.balance(e.id, a, cp)); });
      glAcc += conv(e.id, -E.balance(e.id, "1590", cp));
    });
    function ln(label, v, total) { return h("div", { class: "ln" + (total ? " t" : "") }, h("span", null, label), h("span", null, E.fmt(v, cur, { dp: 0 }))); }
    var costOk = Math.abs(openCost + addCost - glCost) < 2 * ents.length, accOk = Math.abs(openAcc + charge - glAcc) < 2 * ents.length;
    return ui.card({ title: "Rollforward", meta: "fiscal " + E.fy + " to date",
      body: h("div", null,
        h("div", { class: "fa-roll", style: { gridTemplateColumns: "1fr" } },
          h("div", null, h("h4", null, "Cost"), ln("Opening, Jan 1", openCost), ln("Additions", addCost), ln("Disposals", 0), ln("Closing", openCost + addCost, true)),
          h("div", { style: { marginTop: "16px" } }, h("h4", null, "Accumulated depreciation"), ln("Opening, Jan 1", openAcc), ln("Charge this year", charge), ln("Disposals", 0), ln("Closing", openAcc + charge, true)),
          h("div", { style: { marginTop: "16px" } }, h("h4", null, "Net book value"), ln("Closing", openCost + addCost - openAcc - charge, true)))),
      foot: [h("span", { class: costOk && accOk ? "rp-ok" : "neg" }, ui.icon(costOk && accOk ? "check" : "alert", "sm"),
        costOk && accOk ? " Ties to the ledger (1510–1530, 1590)" : " Doesn't tie to the ledger — cost " + E.fmt(glCost, cur) + ", depreciation " + E.fmt(glAcc, cur))] });
  }

  function runDialog(ctx, entities) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
    var body = h("div", { class: "stack", style: { gap: "18px" } });
    entities.forEach(function (e) {
      var due = E.depreciationDue(e.id, cp), c = e.currency;
      var byKey = {}, total = 0;
      due.forEach(function (d) { var k = d.asset.dept; byKey[k] = (byKey[k] || 0) + d.amount; total += d.amount; });
      var lines = Object.keys(byKey).sort().map(function (k) { return { account: "6700", dr: byKey[k], dims: { dept: k } }; });
      lines.push({ account: "1590", cr: total, memo: "Accumulated depreciation" });
      body.appendChild(h("div", null, h("div", { class: "row", style: { marginBottom: "8px" } }, h("b", null, e.name), h("span", { class: "muted" }, due.length + " assets · " + E.fmt(total, c))), ui.jeTable(lines, c)));
    });
    ui.modal({ title: "Run " + ui.period(cp, true) + " depreciation", text: "One journal per entity, dated " + ui.date(E.lastDay(cp), "full") + ", charged to each asset's department. It's also close step C-13.", body: body, wide: true,
      actions: [{ label: "Cancel" }, { label: "Post " + entities.length + " journal" + (entities.length > 1 ? "s" : ""), kind: "primary", fn: function () {
        var ok = 0;
        entities.forEach(function (e) { try { E.exec("asset.depreciate", { entity: e.id, period: cp }, app.actor()); ok++; } catch (err) { if (!(err instanceof EFM.Refusal)) throw err; ui.toast(err.message, { err: true }); } });
        app.commit();
        if (ok) ui.toast("Depreciation posted for " + ok + " entit" + (ok > 1 ? "ies" : "y") + ".", { sub: "The register now shows " + ui.period(cp) + " as depreciated." });
      } }] });
  }
})(window);
