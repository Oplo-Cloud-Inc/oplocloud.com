/* ==========================================================================
   OC EFM — General ledger.

   The chart of accounts with what's in each account, the trial balance that
   proves debits equal credits, and every posted line, searchable. One chart
   serves all three entities, which is why they consolidate without a
   mapping table.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var local = { q: "", account: "", from: "", to: "", dept: "" };

  EFM.view("ledger", {
    title: "General ledger", icon: "book",
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, q = ctx.query;
      var tab = q.get("tab") || "coa";
      var page = h("div");
      page.appendChild(ui.pageHead("General ledger",
        "One chart of accounts for every entity · " + E.accountList.length + " accounts · " + E.lines.length.toLocaleString() + " lines posted in fiscal " + E.fy,
        [ui.gated("journal.create", {}, "New journal", function () { EFM.composeJournal(); }, { icon: "plus" })]));
      page.appendChild(h("div", { class: "row", style: { marginBottom: "14px" } },
        ui.seg([{ id: "coa", label: "Chart of accounts" }, { id: "tb", label: "Trial balance" }, { id: "lines", label: "Ledger lines" }], tab,
          function (t) { app.setQuery({ tab: t === "coa" ? null : t }); }, { label: "Ledger views" })));
      if (tab === "tb") page.appendChild(trial(ctx));
      else if (tab === "lines") page.appendChild(lines(ctx));
      else page.appendChild(chart(ctx));
      return page;
    }
  });

  /* Balance of one account in the scope's currency: balance-sheet accounts
     at the end of `p`, income and expense for the year to date. */
  function scoped(E, scope, a, p) {
    if (scope !== "GROUP") return a.bs ? E.balance(scope, a.id, p) : E.net(scope, a.id, E.fy + "-01", p);
    var s = 0;
    E.entities.forEach(function (e) {
      if (a.bs) {
        var kind = a.id === "3000" || a.id === "3100" ? "hist" : "close";
        s += E.toUSD(E.balance(e.id, a.id, p), e.currency, E.rate(e.currency, p, kind));
      } else s += E.translatedPL(e.id, a.id, E.fy + "-01", p);
    });
    return s;
  }

  /* ------------------------------------------------------ Chart of accounts */
  function chart(ctx) {
    var E = ctx.E, app = ctx.app, scope = ctx.scope, cur = app.scopeCurrency(), cp = E.currentPeriod();
    var ps = E.periodsBetween(E.fy + "-01", cp);
    var rows = [];
    E.headers.forEach(function (g) {
      var items = g.accounts.map(function (id) {
        var a = E.accounts[id];
        var bal = E.natural(id, scoped(E, scope, a, cp));
        var trend = ps.map(function (p) { return E.natural(id, scoped(E, scope, a, p)); });
        return { a: a, bal: bal, trend: trend };
      });
      // A group total only means something when its accounts sit on one side.
      var side = E.accounts[g.accounts[0]].normal;
      var mixed = items.some(function (r) { return !r.a.contra && r.a.normal !== side; });
      var tot = mixed ? null : items.reduce(function (s, r) { return s + (r.a.contra ? -r.bal : r.bal); }, 0);
      rows.push({ grp: true, g: g, tot: tot });
      items.forEach(function (r) { rows.push(r); });
    });
    var t = ui.table({ rows: rows, sortable: false, rowClass: function (r) { return r.grp ? "grp" : ""; }, onRow: function (r) {
      if (!r.grp) app.open({ kind: "account", id: r.a.id, q: { entity: scope } });
    }, columns: [
      { key: "id", label: "Account", render: function (r) { return r.grp ? r.g.name : h("span", { class: "row" }, h("span", { class: "mono", style: { color: "var(--ink-3)" } }, r.a.id), h("span", null, r.a.name)); } },
      { key: "type", label: "Type", render: function (r) { return r.grp ? "" : h("span", { class: "muted" }, { asset: "Asset", liability: "Liability", equity: "Equity", revenue: r.a.group === "other" ? "Other income" : "Revenue", expense: r.a.group === "other" ? "Other expense" : "Expense" }[r.a.type] + (r.a.contra ? " · contra" : "")); } },
      { key: "flags", label: "", render: function (r) {
        if (r.grp) return "";
        var f = h("span", { class: "row", style: { gap: "4px" } });
        if (r.a.control) f.appendChild(h("span", { class: "lock", title: "Posts only from " + { ar: "Receivables", ap: "Payables", fa: "Fixed assets" }[r.a.control] }, ui.icon("lock", "sm"), "Control"));
        if (r.a.bank) f.appendChild(ui.tag("Bank"));
        if (r.a.ic) f.appendChild(ui.tag("Intercompany"));
        return f; } },
      { key: "trend", label: "Jan–" + ui.period(cp).slice(0, 3), render: function (r) { return r.grp ? "" : ui.charts.spark(r.trend, { w: 96, h: 22 }); } },
      { key: "bal", label: scope === "GROUP" ? "Group, USD" : "Balance, " + cur, num: true, render: function (r) {
        return r.grp ? (r.tot == null ? "" : h("b", null, E.fmt(r.tot, cur, { dp: 0 }))) : r.bal ? E.fmt(r.bal, cur, { dp: 0 }) : h("span", { class: "faint" }, "—"); } }
    ] });
    t.classList.add("coa");
    return ui.card({ title: "Chart of accounts", meta: "Balance-sheet accounts as of today; income and expense year to date" + (scope === "GROUP" ? " · translated to USD, before eliminations" : ""), flush: true, body: t,
      foot: [h("span", null, "Control accounts take postings only from their subledger, so the ledger and the subledger can't disagree. Manual journals to them are refused.")] });
  }

  /* ---------------------------------------------------------- Trial balance */
  function trial(ctx) {
    var E = ctx.E, app = ctx.app, scope = ctx.scope, q = ctx.query;
    var p = q.get("p") || E.lastClosedPeriod();
    var ps = E.periodsBetween(E.fy + "-01", E.currentPeriod()).reverse();
    var picker = ui.select(ps.map(function (x) { return { id: x, label: "As of " + ui.period(x, true) + " · " + E.periodStatus(scope === "GROUP" ? "US" : scope, x) }; }), p,
      function (v) { app.setQuery({ p: v }); }, { label: "Period", width: "240px" });
    var wrap = h("div");
    wrap.appendChild(h("div", { class: "filters" }, picker,
      p === E.currentPeriod() ? h("span", { class: "banner", style: { margin: "0", padding: "6px 12px" } }, ui.icon("info", "sm"), ui.period(p, true) + " is open — balances move as the close runs") : null));

    if (scope !== "GROUP") {
      var tb = E.trialBalance(scope, p), c = tb.currency;
      wrap.appendChild(ui.card({ title: "Trial balance · " + E.entity[scope].name, meta: "As of " + ui.date(E.lastDay(p), "full") + " · " + c, flush: true,
        body: ui.table({ rows: tb.rows, sortable: false, dense: true, onRow: function (r) {
          app.open({ kind: "lines", id: "tb-" + r.account + p, q: { entity: scope, accounts: [r.account], from: E.accounts[r.account].bs ? E.fy + "-01" : E.fy + "-01", to: p, title: r.account + " " + r.name } });
        }, foot: ["", "Total", E.fmt(tb.dr, c), E.fmt(tb.cr, c)], columns: [
          { key: "a", label: "Account", render: function (r) { return h("span", { class: "mono" }, r.account); } },
          { key: "n", label: "Name", render: function (r) { return r.name; } },
          { key: "dr", label: "Debit", num: true, render: function (r) { return r.dr ? E.fmt(r.dr, c) : ""; } },
          { key: "cr", label: "Credit", num: true, render: function (r) { return r.cr ? E.fmt(r.cr, c) : ""; } }
        ] }),
        foot: [h("span", { class: tb.balanced ? "rp-ok" : "neg" }, ui.icon(tb.balanced ? "check" : "alert", "sm"), tb.balanced ? " Debits equal credits to the " + (c === "JPY" ? "yen" : "cent") + "." : " Out of balance by " + E.fmt(tb.dr - tb.cr, c) + ".")] }));
      return wrap;
    }

    // The group: each entity's trial balance translated to USD, side by side.
    var cols = E.entities.map(function (e) {
      var m = {}, sum = 0;
      E.accountList.forEach(function (a) {
        var v;
        if (a.bs) {
          var kind = a.id === "3000" || a.id === "3100" ? "hist" : "close";
          v = E.toUSD(E.balance(e.id, a.id, p), e.currency, E.rate(e.currency, p, kind));
        } else v = E.translatedPL(e.id, a.id, E.fy + "-01", p);
        if (v) { m[a.id] = v; sum += v; }
      });
      m.CTA = -sum;
      return { e: e, m: m };
    });
    var rows = E.accountList.filter(function (a) { return cols.some(function (c) { return c.m[a.id]; }); }).map(function (a) { return { id: a.id, name: a.name }; });
    rows.push({ id: "CTA", name: "Translation difference (CTA)" });
    function total(k) { return cols.reduce(function (s, c) { return s + (c.m[k] || 0); }, 0); }
    var foot = ["", "Total"].concat(cols.map(function (c) { return E.fmt(Object.keys(c.m).reduce(function (s, k) { return s + c.m[k]; }, 0), "USD"); }))
      .concat([E.fmt(rows.reduce(function (s, r) { return s + total(r.id); }, 0), "USD")]);
    wrap.appendChild(ui.card({ title: "Trial balance · every entity in USD", meta: "As of " + ui.date(E.lastDay(p), "full") + " · debits positive, credits in parentheses", flush: true,
      body: ui.table({ rows: rows, sortable: false, dense: true, foot: foot, onRow: function (r) {
        if (r.id !== "CTA") app.open({ kind: "lines", id: "tbg-" + r.id + p, q: { entity: "GROUP", accounts: [r.id], from: E.fy + "-01", to: p, title: r.id + " " + r.name } });
      }, columns: [
        { key: "a", label: "Account", render: function (r) { return r.id === "CTA" ? "" : h("span", { class: "mono" }, r.id); } },
        { key: "n", label: "Name", render: function (r) { return r.id === "CTA" ? h("i", { class: "muted" }, r.name) : r.name; } }
      ].concat(cols.map(function (c) { return { key: c.e.id, label: c.e.short + " (from " + c.e.currency + ")", num: true, render: function (r) { var v = c.m[r.id] || 0; return v ? E.fmt(v, "USD") : ""; } }; }))
       .concat([{ key: "t", label: "Combined", num: true, render: function (r) { return h("b", null, E.fmt(total(r.id), "USD")); } }]) }),
      foot: [h("span", { class: "rp-ok" }, ui.icon("check", "sm"), " Each column nets to zero. Translating at different rates — balances at close, income at average, equity at historical — leaves a difference that belongs in equity as CTA.")] }));
    return wrap;
  }

  /* ------------------------------------------------------------ Ledger lines */
  function lines(ctx) {
    var E = ctx.E, app = ctx.app, scope = ctx.scope, group = scope === "GROUP";
    var ps = E.periodsBetween(E.fy + "-01", E.currentPeriod());
    if (!local.from) { local.from = E.currentPeriod(); local.to = E.currentPeriod(); }
    var body = h("div");
    function draw() {
      ui.clear(body);
      var ql = local.q.toLowerCase();
      var list = E.linesWhere({ entity: scope, accounts: local.account ? [local.account] : null, from: local.from, to: local.to, dept: local.dept || null })
        .filter(function (l) { return !ql || (l.j + " " + (l.memo || "")).toLowerCase().indexOf(ql) >= 0; });
      var net = list.reduce(function (s, l) { return s + (group ? E.usdOf(l.entity, l.amt, l.period) : l.amt); }, 0);
      var acctOpts = [{ id: "", label: "Every account" }].concat(E.accountList.map(function (a) { return { id: a.id, label: a.id + " " + a.name }; }));
      var pOpts = ps.map(function (p) { return { id: p, label: ui.period(p) }; });
      body.appendChild(h("div", { class: "bar" },
        ui.searchBox("Search memo or journal", local.q, function (x) { local.q = x; draw(); body.querySelector("input[type=search]").focus(); }, { width: "220px" }),
        ui.select(acctOpts, local.account, function (v) { local.account = v; draw(); }, { label: "Account", width: "230px" }),
        ui.select(pOpts, local.from, function (v) { local.from = v; if (local.to < v) local.to = v; draw(); }, { label: "From", width: "120px" }),
        h("span", { class: "muted" }, "to"),
        ui.select(pOpts, local.to, function (v) { local.to = v; if (local.from > v) local.from = v; draw(); }, { label: "To", width: "120px" }),
        ui.select([{ id: "", label: "Every department" }].concat(E.dims.dept.map(function (d) { return { id: d.id, label: d.name }; })), local.dept, function (v) { local.dept = v; draw(); }, { label: "Department", width: "190px" }),
        h("span", { class: "sp" }),
        h("span", { class: "muted", style: { fontSize: "12.5px" } }, list.length.toLocaleString() + " lines" +
          // A net only means something for one account; across accounts every journal nets to zero.
          (local.account ? " · net " + E.fmt(net, group ? "USD" : E.entity[scope].currency, { minus: true }) : ""))));
      body.appendChild(ui.table({ rows: list, sortKey: "date", sortDir: -1, limit: 300, dense: true, onRow: function (l) { app.open({ kind: "journal", id: l.j }); },
        empty: ui.empty("No lines", "Nothing posted matches these filters.", "search"),
        columns: [
          { key: "date", label: "Date", cls: "nowrap", sort: function (l) { return l.date + l.j; }, render: function (l) { return ui.date(l.date); } },
          { key: "j", label: "Journal", cls: "nowrap", sort: function (l) { return l.j; }, render: function (l) { return h("span", { class: "mono" }, l.j); } },
          group ? { key: "e", label: "Entity", render: function (l) { return l.entity; } } : null,
          { key: "a", label: "Account", cls: "nowrap", sort: function (l) { return l.account; }, render: function (l) { return l.account + " " + E.accounts[l.account].name; } },
          { key: "m", label: "Memo", cls: "jn-memo", render: function (l) { return h("span", { class: "jn-m" }, l.memo || ""); } },
          { key: "d", label: "Dimensions", render: function (l) {
            var d = h("span", { class: "dims", style: { marginTop: "0" } });
            if (l.dims.dept) d.appendChild(ui.tag(E.dimName("dept", l.dims.dept)));
            if (l.dims.product) d.appendChild(ui.tag(E.dimName("product", l.dims.product)));
            if (l.dims.project) d.appendChild(ui.tag(E.dimName("project", l.dims.project)));
            return d; } },
          { key: "amt", label: "Debit / (credit)", num: true, cls: "nowrap", sort: function (l) { return group ? E.usdOf(l.entity, l.amt, l.period) : l.amt; }, render: function (l) { return E.fmt(l.amt, E.entity[l.entity].currency); } }
        ].filter(Boolean) }));
    }
    draw();
    return ui.card({ flush: true, body: body });
  }
})(window);
