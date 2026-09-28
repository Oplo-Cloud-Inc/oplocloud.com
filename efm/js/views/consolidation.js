/* ==========================================================================
   OC EFM — Consolidation.

   How three sets of books in three currencies become one set of group
   accounts: each entity translated to US dollars, what they owe each other
   matched and eliminated, and the worksheet that shows every step, column
   by column, so a reviewer can follow any number from an entity to the
   group.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;

  EFM.view("consolidation", {
    title: "Consolidation", icon: "layers", wide: true,
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, q = ctx.query, cp = E.currentPeriod();
      var p = q.get("p") || E.lastClosedPeriod();
      var st = q.get("s") || "bs";
      var ps = E.periodsBetween(E.fy + "-01", cp).reverse();
      var page = h("div");
      page.appendChild(ui.pageHead("Consolidation", "OploCloud Group in US dollars — three entities translated to one currency, with what they owe each other eliminated.",
        [ui.select(ps.map(function (x) { return { id: x, label: ui.period(x, true) + (x === cp ? " · open" : "") }; }), p, function (v) { app.setQuery({ p: v }); }, { label: "Period", width: "200px" })]));
      if (ctx.scope !== "GROUP") page.appendChild(h("div", { class: "banner info" }, ui.icon("info", "sm"),
        h("span", { class: "grow" }, "Consolidation is always the whole group. You're reporting on " + app.scopeLabel() + " elsewhere."),
        ui.btn("Switch to the group", { size: "sm", onClick: function () { app.setScope("GROUP"); } })));

      page.appendChild(entities(ctx, p));
      page.appendChild(intercompany(ctx, p));
      page.appendChild(worksheet(ctx, p, st));
      page.appendChild(rates(ctx));
      return page;
    }
  });

  /* ------------------------------------------------------------ Entities */
  function entities(ctx, p) {
    var E = ctx.E, row = h("div", { class: "cx-ent" });
    E.entities.forEach(function (e) {
      var st = E.periodStatus(e.id, p);
      var rateBox = e.currency === "USD"
        ? h("div", { class: "cx-rate" }, h("span", null, "Functional currency"), h("span", null, "USD"), h("span", null, "Translation"), h("span", null, "none — reports in USD"))
        : h("div", { class: "cx-rate" },
            h("span", null, "Income and expense"), h("span", null, E.rate(e.currency, p, "avg").toFixed(e.currency === "JPY" ? 6 : 4) + " · " + ui.period(p).slice(0, 3) + " average"),
            h("span", null, "Assets and liabilities"), h("span", null, E.rate(e.currency, p, "close").toFixed(e.currency === "JPY" ? 6 : 4) + " · closing"),
            h("span", null, "Equity"), h("span", null, E.rate(e.currency, null, "hist").toFixed(e.currency === "JPY" ? 5 : 4) + " · historical"));
      row.appendChild(h("div", { class: "card" },
        h("div", { class: "row" }, h("span", { class: "ws-dot" }, e.id), h("b", { class: "grow ell", style: { fontSize: "14px" } }, e.name),
          st === "locked" ? h("span", { class: "lock" }, ui.icon("lock", "sm"), "Locked") : ui.status(st === "closed" ? "closed" : "open", st === "closed" ? "Closed" : "Open")),
        h("div", { class: "muted", style: { fontSize: "12.5px", marginTop: "4px" } }, e.city + " · " + e.country + " · " + e.legal),
        rateBox));
    });
    return row;
  }

  /* -------------------------------------------------------- Intercompany */
  function intercompany(ctx, p) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
    var pairs = E.intercompany(p);
    var rows = pairs.map(function (x) {
      var charged = E.linesWhere({ entity: "US", accounts: ["4900"], from: p, to: p }).filter(function (l) { return l.dims.counterparty === x.entity; }).length > 0;
      var booked = E.linesWhere({ entity: x.entity, accounts: ["6900"], from: p, to: p }).length > 0;
      return Object.assign({ unbooked: charged && !booked }, x);
    });
    var out = rows.filter(function (r) { return Math.abs(r.difference) >= 100; });
    return h("div", { style: { marginBottom: "16px" } }, ui.card({ title: "Intercompany", meta: out.length ? out.length + " pair" + (out.length > 1 ? "s" : "") + " out of balance" : "every pair agrees",
      flush: true,
      body: ui.table({ rows: rows, sortable: false, columns: [
        { key: "p", label: "Between", render: function (r) { return h("b", { style: { fontWeight: "550" } }, "OploCloud, Inc. ↔ " + E.entity[r.entity].name); } },
        { key: "r", label: "US says it's owed", num: true, render: function (r) { return E.fmt(r.receivable, "USD"); } },
        { key: "y", label: "They say they owe", num: true, render: function (r) { return h("span", null, E.fmt(r.payable, "USD"), h("span", { class: "sub" }, E.fmt(r.payableLocal, r.currency) + " on their books")); }, cls: "two" },
        { key: "d", label: "Difference", num: true, render: function (r) { return Math.abs(r.difference) < 100 ? h("span", { class: "faint" }, "—") : h("b", { class: "neg" }, E.fmt(r.difference, "USD")); } },
        { key: "s", label: "", render: function (r) {
          if (Math.abs(r.difference) < 100) return ui.status("good", "Agrees");
          if (r.unbooked && p === cp) return ui.gated("journal.create", {}, "Book it in " + E.entity[r.entity].short, function () {
            app.run("ic.book", { entity: r.entity, period: p }, { ok: function (j) { return "Booked in " + E.entity[r.entity].short + " as " + j.id + ". The pair now agrees."; } });
          }, { size: "sm", kind: "primary" });
          return ui.status("serious", "Out of balance");
        } }
      ] }),
      foot: [h("span", null, out.some(function (r) { return r.unbooked; }) ? "The parent billed its " + ui.period(p) + " recharge on Sep 25; the subsidiaries haven't booked their side yet. Until they do, eliminations remove the whole receivable and the group's profit is lower by exactly the missing charge." :
        "Both sides agree in dollars — the currency the recharge is billed in — so eliminations cancel them exactly.")] }));
  }

  /* ----------------------------------------------------------- Worksheet */
  function worksheet(ctx, p, st) {
    var E = ctx.E, app = ctx.app;
    var isBS = st === "bs";
    var c = isBS ? E.consolidate(E.fy + "-01", p) : E.consolidate(E.fy + "-01", p);
    function withPL(m) {
      var o = {}, pl = 0;
      Object.keys(m).forEach(function (k) { o[k] = m[k]; if (E.accounts[k] && !E.accounts[k].bs) pl += m[k]; });
      o._ytdPL = pl;
      return o;
    }
    var cols = E.entities.map(function (e) { return { id: e.id, label: e.short, sub: "from " + e.currency, rows: E.layout(st, isBS ? withPL(c.by[e.id].bs) : c.by[e.id].pl, { group: true }), entity: e.id }; });
    cols.push({ id: "elim", label: "Eliminations", sub: "intercompany", rows: E.layout(st, isBS ? withPL(c.elimBS) : c.elimPL, { group: true }), elim: true });
    cols.push({ id: "grp", label: "OploCloud Group", sub: "consolidated", rows: E.layout(st, c.group, { group: true }), grp: true });
    var base = cols[cols.length - 1].rows;
    var t = h("table", { class: "fs" });
    var hr = h("tr", null, h("th", null, ""));
    cols.forEach(function (col, i) { hr.appendChild(h("th", { class: (col.elim || col.grp ? "sepcol " : "") + (col.grp ? "grp" : "") }, col.label, h("small", null, col.sub))); });
    t.appendChild(h("thead", null, hr));
    var tb = h("tbody");
    base.forEach(function (row, k) {
      var ic = { "1150": 1, "2150": 1, "4900": 1, "6900": 1 }[row.id];
      var tr = h("tr", { class: row.kind + (ic ? " ic" : "") }, h("td", null, row.label));
      cols.forEach(function (col) {
        var r = col.rows[k], td = h("td", { class: (col.elim || col.grp ? "sepcol " : "") + (col.elim ? "elim " : "") + (col.grp ? "grp" : "") });
        if (row.kind !== "head" && r) {
          if (row.kind === "ratio") td.textContent = col.elim || r.value == null || !isFinite(r.value) ? "" : (r.value * 100).toFixed(1) + "%";
          else {
            td.textContent = r.value ? E.fmt(r.value, "USD", { dp: 0 }) : "—";
            var accts = (row.accounts || []).filter(function (a) { return /^\d/.test(a); });
            if (col.entity && accts.length && r.value) {
              td.classList.add("drill"); td.tabIndex = 0;
              var go = function () { app.open({ kind: "lines", id: "cx-" + col.entity + row.id + p, q: { entity: col.entity, accounts: accts, from: E.fy + "-01", to: p, title: row.label + " · " + E.entity[col.entity].short } }); };
              td.addEventListener("click", go); td.addEventListener("keydown", function (ev) { if (ev.key === "Enter") go(); });
            }
          }
        }
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    var checks = cols.map(function (col) {
      var v = {}; col.rows.forEach(function (r) { v[r.id] = r.value; });
      return isBS ? v.ta === v.tle : true;
    });
    var ok = checks.every(Boolean);
    var sum = h("div", { class: "rp-check" }, h("span", { class: ok ? "ok" : "no" }, ui.icon(ok ? "check" : "alert", "sm"), isBS ? (ok ? "Every column balances" : "A column is out of balance") : "Group net income is the entities' less the eliminated recharge"),
      h("span", null, " · income and expense at each month's average rate, balances at the " + ui.period(p) + " closing rate, equity at historical; the difference is CTA"));
    return h("div", { style: { marginBottom: "16px" } }, h("section", { class: "card cx-ws" },
      h("div", { class: "card-h" }, h("h2", null, isBS ? "Consolidating balance sheet" : "Consolidating income statement"),
        h("span", { class: "meta" }, (isBS ? "As of " + ui.date(E.lastDay(p), "full") : "January through " + ui.period(p, true)) + " · US dollars"),
        h("div", { class: "tools" }, ui.seg([{ id: "bs", label: "Balance sheet" }, { id: "is", label: "Income statement" }], st, function (v) { app.setQuery({ s: v === "bs" ? null : v }); }, { label: "Statement" }))),
      h("div", { class: "rp-sheet", style: { marginTop: "10px" } }, t), sum));
  }

  /* --------------------------------------------------------------- Rates */
  function rates(ctx) {
    var E = ctx.E, cp = E.currentPeriod();
    var ps = E.periodsBetween(E.fy + "-01", cp);
    var chart = ui.charts.line({ height: 150, labels: ps, series: [{ name: "GBP, USD per pound", color: "var(--s1)", values: ps.map(function (p) { return E.rate("GBP", p, "close"); }) }],
      xFormat: function (p) { return ui.period(p).slice(0, 3); }, yFormat: function (v) { return v.toFixed(3); }, tipFormat: function (v) { return v.toFixed(4); }, tipTitle: function (p) { return ui.period(p, true) + " close"; }, label: "Pound closing rate" });
    return ui.card({ title: "Exchange rates", meta: "US dollars per unit · average for the month and at month end", flush: true,
      body: h("div", null, h("div", { style: { padding: "0 18px 8px" } }, chart),
        ui.table({ rows: ps.slice().reverse(), sortable: false, dense: true, columns: [
          { key: "p", label: "Month", render: function (p) { return ui.period(p, true) + (p === cp ? " (to date)" : ""); } },
          { key: "ga", label: "GBP average", num: true, render: function (p) { return E.rate("GBP", p, "avg").toFixed(4); } },
          { key: "gc", label: "GBP close", num: true, render: function (p) { return E.rate("GBP", p, "close").toFixed(4); } },
          { key: "ja", label: "JPY average", num: true, render: function (p) { return E.rate("JPY", p, "avg").toFixed(6); } },
          { key: "jc", label: "JPY close", num: true, render: function (p) { return E.rate("JPY", p, "close").toFixed(6); } }
        ] })) });
  }
})(window);
