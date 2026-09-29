/* ==========================================================================
   OC EFM — Insights.

   The whole book, drawn. One page from the single figure to the entire flow
   of money: what was spent and where it went, when, through whom, and what
   is tied to what — every mark clickable through to the entries behind it.
   Reads the ledger only; nothing here can change it.

   Tabs: Overview · Flow · Composition · Time · Network · Explore
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h, V = EFM.viz;

  /* ------------------------------------------------------------ The facts
     Every ledger line in scope, one row each, in the scope's currency, with
     the account's nature attached — the table every chart is a view of. */
  var cache = { key: "", facts: [] };
  var GROUPS = { cogs: "Cost of revenue", people: "People", opex: "Operating costs", other: "Financing & other", tax: "Taxes", cash: "Cash", ar: "Receivables", ap: "Payables",
    cards: "Company card", accrued: "Accrued", prepaid: "Prepaid", ppe: "Equipment", accdep: "Depreciation", deferred: "Deferred revenue", debt: "Loans", capital: "Owner capital",
    re: "Retained earnings", rev: "Revenue", icrev: "Intercompany", icexp: "Intercompany", tax_: "Taxes", payroll: "Payroll liabilities", inctax: "Income tax", ic: "Intercompany" };

  function facts(ctx) {
    var E = ctx.E, app = ctx.app, key = E.lines.length + "|" + app.scope + "|" + E.fy + "|" + (E.bookId || "");
    if (cache.key === key && cache.E === E) return cache.facts;
    var out = [], group = app.scope === "GROUP";
    for (var n = 0; n < E.lines.length; n++) {
      var l = E.lines[n];
      if (!app.inScope(l.entity)) continue;
      var a = E.accounts[l.account]; if (!a) continue;
      var d = l.dims || {}, src = l.source || {};
      out.push({ j: l.j, i: l.i, date: l.date, period: l.period, entity: l.entity, account: l.account, type: a.type, group: a.group, ic: !!a.ic, bs: !!a.bs, cash: a.group === "cash",
        dept: d.dept || "", product: d.product || "", vendor: d.vendor || "", customer: d.customer || "", project: d.project || "", src: src.label || src.type || "Entry", memo: l.memo || "",
        amt: group ? E.usdOf(l.entity, l.amt, l.period, a.bs ? "close" : "avg") : l.amt });
    }
    cache = { key: key, facts: out, E: E };
    return out;
  }

  /* What is being measured. `pick` turns a fact into a positive amount (or 0). */
  var MEASURES = {
    expense: { label: "Spending", pick: function (f) { return f.type === "expense" && !f.ic ? f.amt : 0; }, accounts: function (E) { return E.accountList.filter(function (a) { return a.type === "expense" && !a.ic; }).map(function (a) { return a.id; }); } },
    revenue: { label: "Revenue", pick: function (f) { return f.type === "revenue" && !f.ic ? -f.amt : 0; }, accounts: function (E) { return E.accountList.filter(function (a) { return a.type === "revenue" && !a.ic; }).map(function (a) { return a.id; }); } },
    cashout: { label: "Cash paid out", pick: function (f) { return f.cash && f.amt < 0 ? -f.amt : 0; }, accounts: function (E) { return E.accountList.filter(function (a) { return a.group === "cash"; }).map(function (a) { return a.id; }); } },
    cashin: { label: "Cash received", pick: function (f) { return f.cash && f.amt > 0 ? f.amt : 0; }, accounts: function (E) { return E.accountList.filter(function (a) { return a.group === "cash"; }).map(function (a) { return a.id; }); } },
    entries: { label: "Entries", count: true, pick: function (f) { return f.i === 0 ? 1 : 0; }, accounts: function () { return null; } }
  };
  var MEASURE_OPTS = ["expense", "revenue", "cashout", "cashin", "entries"];

  /* What to break it down by. `key(fact)` → an id; `name(ctx, id)` → its label. */
  var WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var DIMS = {
    category: { label: "Category", key: function (f) { return f.group; }, name: function (c, id) { return GROUPS[id] || id; } },
    account: { label: "Account", key: function (f) { return f.account; }, name: function (c, id) { var a = c.E.accounts[id]; return a ? a.name : id; } },
    dept: { label: "Department", key: function (f) { return f.dept || "-"; }, name: function (c, id) { return id === "-" ? "No department" : c.E.dimName("dept", id); }, filter: "dept" },
    vendor: { label: "Vendor", key: function (f) { return f.vendor || "-"; }, name: function (c, id) { return id === "-" ? "No vendor" : (c.E.vendors[id] ? c.E.vendors[id].name.split(" — ")[0] : id); }, filter: "vendor" },
    customer: { label: "Customer", key: function (f) { return f.customer || "-"; }, name: function (c, id) { return id === "-" ? "No customer" : (c.E.customers[id] ? c.E.customers[id].name : id); }, filter: "customer" },
    product: { label: "Product", key: function (f) { return f.product || "-"; }, name: function (c, id) { return id === "-" ? "No product" : c.E.dimName("product", id); }, filter: "product" },
    source: { label: "Source", key: function (f) { return f.src; }, name: function (c, id) { return id; } },
    entity: { label: "Entity", key: function (f) { return f.entity; }, name: function (c, id) { return c.E.entity[id] ? c.E.entity[id].name : id; } },
    month: { label: "Month", key: function (f) { return f.period; }, name: function (c, id) { return c.E.periodLabel(id, true); } },
    weekday: { label: "Day of the week", key: function (f) { return String(new Date(f.date + "T00:00:00Z").getUTCDay()); }, name: function (c, id) { return WEEK[+id]; } }
  };
  var DIM_OPTS = ["category", "account", "dept", "vendor", "customer", "product", "source", "entity", "month", "weekday"];

  /* ----------------------------------------------------------------- Range */
  var RANGES = { month: "This month", "3m": "Last 3 months", ytd: "Year to date" };
  function bounds(ctx, r) {
    var E = ctx.E, cp = E.currentPeriod(), first = E.fy + "-01";
    if (r === "month") return { from: cp, to: cp };
    if (r === "3m") { var f = E.addMonths(cp, -2); return { from: f < first ? first : f, to: cp }; }
    return { from: first, to: cp };
  }
  function previous(ctx, b) {
    var E = ctx.E, n = E.periodsBetween(b.from, b.to).length, to = E.addMonths(b.from, -1), from = E.addMonths(b.from, -n);
    return from < E.fy + "-01" ? null : { from: from, to: to };
  }
  function within(list, b) { return list.filter(function (f) { return f.period >= b.from && f.period <= b.to; }); }
  function total(list, m) { var s = 0, p = MEASURES[m].pick; for (var i = 0; i < list.length; i++) s += p(list[i]); return s; }
  function agg(list, m, dim, ctx) {
    var by = {}, p = MEASURES[m].pick, k = DIMS[dim].key;
    for (var i = 0; i < list.length; i++) { var v = p(list[i]); if (!v) continue; var id = k(list[i]); by[id] = (by[id] || 0) + v; }
    return Object.keys(by).map(function (id) { return { id: id, label: DIMS[dim].name(ctx, id), value: by[id] }; }).sort(function (a, b) { return b.value - a.value; });
  }
  function series(list, m, ctx, dim, periods) {
    var idx = {}; periods.forEach(function (p, i) { idx[p] = i; });
    var p = MEASURES[m].pick, k = DIMS[dim].key, by = {};
    list.forEach(function (f) { var v = p(f); if (!v || idx[f.period] == null) return; var id = k(f); (by[id] = by[id] || periods.map(function () { return 0; }))[idx[f.period]] += v; });
    return Object.keys(by).map(function (id) { return { id: id, name: DIMS[dim].name(ctx, id), values: by[id], sum: by[id].reduce(function (s, v) { return s + v; }, 0) }; }).sort(function (a, b) { return b.sum - a.sum; });
  }
  function fmtFor(ctx, m) {
    if (MEASURES[m].count) return function (v) { return Math.round(v).toLocaleString(); };
    var c = ctx.app.scopeCurrency();
    return function (v) { return ctx.E.fmt(v, c, { compact: Math.abs(v) >= 1e5 * Math.pow(10, ctx.E.dp(c)) }); };
  }
  function fmtFull(ctx) { var c = ctx.app.scopeCurrency(); return function (v) { return ctx.E.fmt(v, c); }; }

  /* Open the entries behind a mark. */
  function drill(ctx, m, b, extra) {
    var E = ctx.E, app = ctx.app, q = Object.assign({ entity: app.scope, accounts: MEASURES[m].accounts(E), from: b.from, to: b.to, title: MEASURES[m].label }, extra || {});
    if (!q.accounts) delete q.accounts;
    app.open({ kind: "lines", id: "x", q: q });
  }
  function filterFor(dim, id) { var o = {}; if (DIMS[dim].filter && id !== "-") o[DIMS[dim].filter] = id; return o; }
  function accountsFor(ctx, dim, id, m) {
    if (dim === "account") return [id];
    if (dim === "category") return MEASURES[m].accounts(ctx.E).filter(function (a) { return ctx.E.accounts[a].group === id; });
    return null;
  }
  function drillDim(ctx, m, b, dim, id) {
    var extra = filterFor(dim, id), acc = accountsFor(ctx, dim, id, m);
    if (dim === "month") { b = { from: id, to: id }; }
    if (acc) extra.accounts = acc;
    extra.title = MEASURES[m].label + " · " + DIMS[dim].name(ctx, id);
    drill(ctx, m, b, extra);
  }

  /* ---------------------------------------------------------------- Cards */
  function card(o) { return ui.card(o); }
  function exploreBtn(ctx, params) { return ui.btn("Explore", { size: "sm", kind: "ghost", icon: "arrow", onClick: function () { ctx.app.setQuery(Object.assign({ tab: "explore" }, params)); } }); }
  function needData(msg) { return V.empty(msg); }

  /* ================================================================== Hero */
  function hero(ctx, list, b) {
    var E = ctx.E, m = "expense", fmt = fmtFull(ctx), pb = previous(ctx, b), periods = E.periodsBetween(E.fy + "-01", E.currentPeriod());
    var exp = total(list, "expense"), rev = total(list, "revenue"), prevList = pb ? within(facts(ctx), pb) : null;
    function monthly(mm) { return periods.map(function (p) { var t = 0, pk = MEASURES[mm].pick; facts(ctx).forEach(function (f) { if (f.period === p) t += pk(f); }); return t; }); }
    var entries = total(list, "entries"), vendors = {}, biggest = 0;
    list.forEach(function (f) { if (f.type === "expense" && f.vendor) vendors[f.vendor] = 1; if (f.type === "expense" && !f.ic && f.amt > biggest) biggest = f.amt; });
    function tile(label, value, delta, sub, spark, onClick) {
      return h(onClick ? "button" : "div", { type: onClick ? "button" : null, on: onClick ? { click: onClick } : null, style: onClick ? { textAlign: "left" } : null },
        h("div", { class: "l" }, label), h("div", { class: "v" }, value), h("div", { class: "d" }, delta || null, h("span", null, sub || "")),
        spark ? h("div", { class: "sp" }, spark) : null);
    }
    var tiles = [tile("Spent", fmt(exp), pb && total(prevList, "expense") ? ui.delta((exp - total(prevList, "expense")) / total(prevList, "expense"), { invert: true }) : null, pb ? "vs the period before" : RANGES[local.range].toLowerCase(),
      V.micro.spark(monthly("expense")), function () { drill(ctx, "expense", b); })];
    if (rev) tiles.push(tile("Revenue", fmt(rev), pb && total(prevList, "revenue") ? ui.delta((rev - total(prevList, "revenue")) / total(prevList, "revenue")) : null, pb ? "vs the period before" : "", V.micro.spark(monthly("revenue")), function () { drill(ctx, "revenue", b); }));
    else tiles.push(tile("Paid to", Object.keys(vendors).length + (Object.keys(vendors).length === 1 ? " vendor" : " vendors"), null, "with something booked to them", null));
    if (rev) tiles.push(tile("Net result", fmt(rev - exp), null, rev - exp >= 0 ? "profit" : "loss", null));
    else tiles.push(tile("Largest single cost", fmt(biggest), null, "one line, this period", null));
    tiles.push(tile("Entries", Math.round(entries).toLocaleString(), null, "journals posted", V.micro.spark(monthly("entries")), function () { ctx.app.navigate("/journals"); }));
    return h("div", { class: "ins-hero" }, tiles);
  }

  /* ============================================================== Overview */
  function overview(ctx, list, b) {
    var E = ctx.E, app = ctx.app, fmtC = fmtFor(ctx, "expense"), fmt = fmtFull(ctx), periods = E.periodsBetween(E.fy + "-01", E.currentPeriod()), all = facts(ctx);
    var g = h("div", { class: "grid" });

    // Spending over time, layered by category.
    var cats = series(all, "expense", ctx, "category", periods);
    g.appendChild(card({ title: "Spending over time", meta: "by category · fiscal " + E.fy, span: 8, tools: exploreBtn(ctx, { m: "expense", d: "category", c: "stacked" }),
      body: periods.length > 1 && cats.length ? V.stacked({ labels: periods, series: cats.map(function (s, i) { return { name: s.name, values: s.values, color: V.color(i) }; }), fmt: fmtC, height: 270,
        xFormat: function (p) { return ui.period(p).slice(0, 3); }, tipTitle: function (p) { return ui.period(p, true); }, partialLast: true, partialLabel: ui.period(periods[periods.length - 1]).slice(0, 3) + " so far", onClick: function (j) { drillDim(ctx, "expense", { from: periods[j], to: periods[j] }, "month", periods[j]); } }) : needData("A trend needs a second month of spending.") }));

    var byAcct = agg(list, "expense", "account", ctx);
    g.appendChild(card({ title: "Where it went", meta: RANGES[local.range].toLowerCase() + " · by account", span: 4, tools: exploreBtn(ctx, { m: "expense", d: "account", c: "donut" }),
      body: V.donut({ items: byAcct.slice(0, 7).map(function (a) { return { id: a.id, label: a.id + " · " + a.label, value: a.value }; }).concat(byAcct.length > 7 ? [{ id: "_", label: "Everything else", value: byAcct.slice(7).reduce(function (s, a) { return s + a.value; }, 0) }] : []), fmt: fmtC, height: 270,
        onClick: function (it) { if (it.id !== "_") drillDim(ctx, "expense", b, "account", it.id); }, empty: "Nothing has been spent in this period." }) }));

    // The flow, and the calendar.
    g.appendChild(card({ title: "Money flow", meta: "where it came from → what it became", span: 12, tools: exploreBtn(ctx, { tab: "flow" }), body: flowChart(ctx, list, b, { height: 400 }) }));
    var days = {}; all.forEach(function (f) { if (f.type === "expense" && !f.ic) days[f.date] = (days[f.date] || 0) + f.amt; });
    g.appendChild(card({ title: "Spending calendar", meta: "every day of fiscal " + E.fy, span: 12, tools: exploreBtn(ctx, { tab: "time" }),
      body: V.calendar({ values: days, from: E.fy + "-01-01", to: E.asOf, fmt: fmtFull(ctx), unit: "spent", onClick: function (iso) { drill(ctx, "expense", { from: iso.slice(0, 7), to: iso.slice(0, 7) }, { dateFrom: iso, dateTo: iso, title: "Spending on " + ui.date(iso, "year") }); }, empty: "No spending yet." }) }));

    // Cash: what came in and went out, and how long it lasts at this pace.
    var cashIn = series(all, "cashin", ctx, "category", periods), cashOut = series(all, "cashout", ctx, "category", periods);
    var inV = periods.map(function (_, j) { return cashIn.reduce(function (s, r) { return s + r.values[j]; }, 0); }), outV = periods.map(function (_, j) { return cashOut.reduce(function (s, r) { return s + r.values[j]; }, 0); });
    if (inV.some(Boolean) || outV.some(Boolean)) {
      var cashNow = 0, cp = E.currentPeriod();
      E.entities.forEach(function (e) {
        if (!app.inScope(e.id)) return;
        E.accountList.forEach(function (a) { if (a.group === "cash") { var v = E.balance(e.id, a.id, cp); cashNow += app.scope === "GROUP" ? E.usdOf(e.id, v, cp, "close") : v; } });
      });
      var last3 = Math.min(3, periods.length - 1) || 1, burn = 0;
      for (var q = periods.length - 1 - last3; q < periods.length - 1; q++) if (q >= 0) burn += outV[q] - inV[q];
      burn = burn / last3;
      g.appendChild(card({ title: "Cash in and out", meta: "by month · what actually moved through cash accounts", span: 8,
        body: V.stacked({ labels: periods, series: [{ name: "In", values: inV, color: "var(--v3)" }, { name: "Out", values: outV, color: "var(--v2)" }], mode: "columns", fmt: fmtC, height: 240, partialLast: true, partialLabel: ui.period(periods[periods.length - 1]).slice(0, 3) + " so far",
          xFormat: function (p) { return ui.period(p).slice(0, 3); }, tipTitle: function (p) { return ui.period(p, true); } }) }));
      var months = burn > 0 && cashNow > 0 ? cashNow / burn : null;
      g.appendChild(card({ title: "Runway", meta: "cash today ÷ average net outflow, last three months", span: 4,
        body: months == null ? h("div", null, V.gauge({ value: 0, max: 1, text: cashNow > 0 ? "∞" : "—", caption: cashNow > 0 ? "cash isn't running down" : "no cash on hand", fmt: function () { return ""; }, height: 170 })) : V.gauge({ value: Math.min(months, 24), max: 24, text: months >= 24 ? "24+ mo" : months.toFixed(1) + " mo", caption: "at " + fmtFull(ctx)(burn) + " a month",
          bands: [{ to: 0.25, color: "var(--v2)" }, { to: 0.5, color: "var(--v5)" }, { to: 1, color: "var(--v3)" }], fmt: function (v) { return Math.round(v) + ""; }, height: 170 }),
        foot: [h("span", null, "Cash on hand " + fmtFull(ctx)(cashNow))] }));
    }

    // Concentration, sizes, departments.
    var byVendor = agg(list, "expense", "vendor", ctx).filter(function (v) { return v.id !== "-"; });
    g.appendChild(card({ title: "Who the spending depends on", meta: "vendors, biggest first · line = running share", span: 5, tools: exploreBtn(ctx, { m: "expense", d: "vendor", c: "pareto" }),
      body: V.pareto({ items: byVendor.map(function (v) { return { id: v.id, label: v.label, value: v.value }; }), total: total(list, "expense"), fmt: fmtC, height: 250,
        onClick: function (it) { drillDim(ctx, "expense", b, "vendor", it.id); }, empty: "Vendors appear here once entries name one." }) }));
    var sizes = {}; list.forEach(function (f) { if (f.type === "expense" && !f.ic && f.amt > 0) sizes[f.j] = (sizes[f.j] || 0) + f.amt; });
    g.appendChild(card({ title: "How big the entries are", meta: "distribution of expense entries · log scale", span: 4, body: V.histogram({ values: Object.keys(sizes).map(function (k) { return sizes[k]; }), fmt: fmtC, height: 250, empty: "Needs a few entries to show a shape." }) }));
    var byDept = agg(list, "expense", "dept", ctx);
    var budgets = E.budgetVsActual ? E.budgetVsActual(app.scope, b.from, b.to).filter(function (r) { return r.budget > 0; }) : [];
    g.appendChild(card({ title: budgets.length ? "Departments against budget" : "Departments", meta: budgets.length ? "actual as a share of budget" : "spending by department", span: 3,
      body: budgets.length ? V.bullet({ rows: budgets.map(function (r) { return { label: r.dept.name, actual: r.actual, target: r.budget, id: r.dept.id }; }), fmt: fmtC, warnAt: 1, onClick: function (r) { app.navigate("/budgets?dept=" + r.id); } })
        : V.bullet({ rows: byDept.slice(0, 8).map(function (d) { return { label: d.label, actual: d.value }; }), fmt: fmtC }) }));

    // Every transaction.
    var pts = []; var seen = {};
    list.forEach(function (f) { if (f.type !== "expense" || f.ic || f.amt <= 0) return; var k = f.j + "|" + f.account; if (seen[k]) { seen[k].y += f.amt; return; } var p = { id: f.j, x: f.date, y: f.amt, label: f.memo || f.j, color: V.color(Math.abs(hash(f.group)) % 10) }; seen[k] = p; pts.push(p); });
    g.appendChild(card({ title: "Every expense, as a constellation", meta: "height and size are amount (log scale) · ringed = far from the pattern", span: 12,
      body: V.constellation({ points: pts, fmt: fmtC, height: 320, from: b.from + "-01", to: E.asOf, onClick: function (p) { app.open({ kind: "journal", id: p.id }); }, empty: "Entries appear here as they're recorded." }) }));

    // Every account, small.
    var top = agg(all, "expense", "account", ctx).slice(0, 18);
    var accSeries = series(all, "expense", ctx, "account", periods);
    var sm = accSeries.filter(function (s) { return top.some(function (t) { return t.id === s.id; }); }).map(function (s) { return { id: s.id, label: s.id + " · " + s.name, values: s.values, value: s.sum, prev: null }; });
    g.appendChild(card({ title: "Every account, small", meta: "monthly trend on each account's own scale", span: 12, body: V.multiples({ items: sm, fmt: fmtC, onClick: function (it) { drillDim(ctx, "expense", { from: E.fy + "-01", to: E.currentPeriod() }, "account", it.id); }, empty: "Accounts appear as they're used." }) }));
    return g;
  }
  function hash(s) { var x = 0; s = String(s); for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return x; }

  /* ================================================================== Flow */
  /* Money in, money out, in the shape it took. With revenue: revenue → the costs it paid for and
     what was left. Without: what paid for each cost. */
  function flowData(ctx, list, opts) {
    var E = ctx.E, byJ = {};
    list.forEach(function (f) { (byJ[f.j] = byJ[f.j] || []).push(f); });
    var revBy = {}, links = {}, nodes = {}, revTotal = 0, expTotal = 0;
    function node(id, label, layer, color) { if (!nodes[id]) nodes[id] = { id: id, label: label, layer: layer, color: color }; return id; }
    function link(a, b, v) { var k = a + ">" + b; links[k] = (links[k] || 0) + v; }
    var topN = opts.top || 8, catOf = function (f) { return GROUPS[f.group] || f.group; };
    // Which accounts are big enough to name; the rest are gathered.
    var accTot = {}; list.forEach(function (f) { if (f.type === "expense" && !f.ic && f.amt > 0) accTot[f.account] = (accTot[f.account] || 0) + f.amt; });
    var named = Object.keys(accTot).sort(function (a, b) { return accTot[b] - accTot[a]; }).slice(0, topN * 2);
    list.forEach(function (f) { if (f.type === "revenue" && !f.ic) { revBy[f.account] = (revBy[f.account] || 0) - f.amt; revTotal -= f.amt; } if (f.type === "expense" && !f.ic) expTotal += f.amt; });
    if (revTotal > 0 && opts.mode !== "funding") {
      node("REV", "Revenue", 1, "var(--v3)");
      Object.keys(revBy).forEach(function (a) { if (revBy[a] > 0) { node("r" + a, E.accounts[a].name, 0, "var(--v3)"); link("r" + a, "REV", revBy[a]); } });
      var catTot = {}; list.forEach(function (f) { if (f.type === "expense" && !f.ic && f.amt > 0) { var c = catOf(f); catTot[c] = (catTot[c] || 0) + f.amt; } });
      Object.keys(catTot).forEach(function (c, i) { node("c" + c, c, 2, V.color(i + 1)); link("REV", "c" + c, catTot[c]); });
      if (revTotal > expTotal) { node("PROFIT", "Left over", 2, "var(--v3)"); link("REV", "PROFIT", revTotal - expTotal); }
      list.forEach(function (f) { if (f.type === "expense" && !f.ic && f.amt > 0) { var a = named.indexOf(f.account) >= 0 ? f.account : "_other"; node("a" + a, a === "_other" ? "Everything else" : E.accounts[a].name, 3, "var(--v8)"); link("c" + catOf(f), "a" + a, f.amt); } });
      if (expTotal > revTotal) { node("GAP", "Funded from elsewhere", 1, "var(--v2)"); link("GAP", "REV", 0); }
    } else {
      // No revenue: who paid for what, journal by journal.
      Object.keys(byJ).forEach(function (j) {
        var ls = byJ[j], debits = ls.filter(function (f) { return f.type === "expense" && !f.ic && f.amt > 0; });
        if (!debits.length) return;
        var credits = ls.filter(function (f) { return f.amt < 0 && f.type !== "revenue" && f.type !== "expense"; }), ct = credits.reduce(function (s, f) { return s - f.amt; }, 0);
        if (!ct) credits = [{ account: "_none", amt: -1 }], ct = 1;
        debits.forEach(function (d) {
          credits.forEach(function (c) {
            var v = d.amt * (-c.amt) / ct, src = c.account === "_none" ? "Not funded yet" : E.accounts[c.account].name, sid = "s" + c.account;
            node(sid, src, 0, "var(--v1)");
            var cat = "c" + catOf(d), a = named.indexOf(d.account) >= 0 ? d.account : "_other";
            node(cat, catOf(d), 1, "var(--v4)"); node("a" + a, a === "_other" ? "Everything else" : E.accounts[a].name, 2, "var(--v8)");
            link(sid, cat, v); link(cat, "a" + a, v);
          });
        });
      });
    }
    var ns = Object.keys(nodes).map(function (k) { return nodes[k]; });
    var ls = Object.keys(links).map(function (k) { var p = k.split(">"); return { source: p[0], target: p[1], value: links[k] }; }).filter(function (l) { return l.value > 0 && nodes[l.source] && nodes[l.target]; });
    return { nodes: ns, links: ls };
  }
  function flowChart(ctx, list, b, o) {
    o = o || {};
    var d = flowData(ctx, list, { mode: o.mode, top: o.top || 7 });
    return V.sankey({ nodes: d.nodes, links: d.links, fmt: fmtFor(ctx, "expense"), height: o.height || 420, empty: "Flow appears once money has moved.",
      onClick: function (n) { var id = n.id; if (/^a[0-9]/.test(id)) drillDim(ctx, "expense", b, "account", id.slice(1)); else if (/^r[0-9]/.test(id)) drillDim(ctx, "revenue", b, "account", id.slice(1)); } });
  }
  function flowTab(ctx, list, b) {
    var wrap = h("div"), mode = local.flowMode || "auto";
    var bar = h("div", { class: "viz-bar" }, ui.seg([{ id: "auto", label: "Revenue to costs" }, { id: "funding", label: "What paid for the costs" }], mode, function (v) { local.flowMode = v; ctx.app.refresh(); }, { label: "Kind of flow" }),
      h("span", { class: "grow" }), h("span", { class: "muted", style: { fontSize: "12.5px" } }, "Hover a band to follow it · click an account to open its entries"));
    wrap.appendChild(bar);
    var d = flowData(ctx, list, { mode: mode, top: 10 }), grid = h("div", { class: "grid" });
    var has = d.links.some(function (l) { return l.source === "REV" || /^r/.test(l.source); });
    grid.appendChild(card({ title: has && mode !== "funding" ? "From revenue to what it became" : "What paid for the costs", meta: RANGES[local.range].toLowerCase(), span: 12,
      body: V.sankey({ nodes: d.nodes, links: d.links, fmt: fmtFor(ctx, "expense"), height: 520, empty: "Flow appears once money has moved in this period.",
        onClick: function (n) { if (/^a[0-9]/.test(n.id)) drillDim(ctx, "expense", b, "account", n.id.slice(1)); else if (/^r[0-9]/.test(n.id)) drillDim(ctx, "revenue", b, "account", n.id.slice(1)); } }) }));
    // The same money by department → account, as a ring of ties.
    var pairs = {}; list.forEach(function (f) { if (f.type !== "expense" || f.ic || f.amt <= 0 || !f.dept) return; var k = f.dept + ">" + f.account; pairs[k] = (pairs[k] || 0) + f.amt; });
    var links = Object.keys(pairs).map(function (k) { var p = k.split(">"); return { a: "d:" + p[0], b: "a:" + p[1], value: pairs[k] }; });
    var labels = {}; ctx.E.dims.dept.forEach(function (x) { labels["d:" + x.id] = x.name; }); ctx.E.accountList.forEach(function (a) { labels["a:" + a.id] = a.name; });
    grid.appendChild(card({ title: "Departments and the accounts they spend on", meta: "each ribbon is spending; width is amount", span: 12,
      body: V.chord({ links: links, labels: labels, fmt: fmtFor(ctx, "expense"), height: 480, order: ctx.E.dims.dept.map(function (x) { return "d:" + x.id; }), empty: "Needs entries coded to departments." }) }));
    wrap.appendChild(grid);
    return wrap;
  }

  /* ========================================================== Composition */
  function tree(ctx, list, m, dims) {
    var by = {}, p = MEASURES[m].pick;
    list.forEach(function (f) { var v = p(f); if (v <= 0) return; var a = DIMS[dims[0]].key(f), c = DIMS[dims[1]].key(f); by[a] = by[a] || {}; by[a][c] = (by[a][c] || 0) + v; });
    var kids = Object.keys(by).map(function (a) {
      var ch = Object.keys(by[a]).map(function (c) { return { id: a + "|" + c, key: c, label: DIMS[dims[1]].name(ctx, c), value: by[a][c] }; }).sort(function (x, y) { return y.value - x.value; });
      return { id: a, label: DIMS[dims[0]].name(ctx, a), children: ch };
    }).sort(function (x, y) { return y.children.reduce(function (s, c) { return s + c.value; }, 0) - x.children.reduce(function (s, c) { return s + c.value; }, 0); });
    return kids;
  }
  function compositionTab(ctx, list, b) {
    var m = local.m, d0 = local.d, d1 = local.d1, view = local.view, fmt = fmtFor(ctx, m), wrap = h("div");
    var bar = h("div", { class: "viz-bar" },
      ui.seg([{ id: "treemap", label: "Treemap" }, { id: "sunburst", label: "Sunburst" }], view, function (v) { local.view = v; ctx.app.refresh(); }, { label: "View" }),
      ui.select(MEASURE_OPTS.filter(function (x) { return !MEASURES[x].count; }).map(function (x) { return { id: x, label: MEASURES[x].label }; }), m, function (v) { local.m = v; ctx.app.refresh(); }, { label: "Measure", width: "170px" }),
      h("span", { class: "muted", style: { fontSize: "12.5px" } }, "grouped by"),
      ui.select(DIM_OPTS.filter(function (x) { return x !== "month" && x !== "weekday"; }).map(function (x) { return { id: x, label: DIMS[x].label }; }), d0, function (v) { local.d = v; if (v === d1) local.d1 = v === "account" ? "dept" : "account"; ctx.app.refresh(); }, { label: "First grouping", width: "160px" }),
      h("span", { class: "muted", style: { fontSize: "12.5px" } }, "then"),
      ui.select(DIM_OPTS.filter(function (x) { return x !== "month" && x !== "weekday" && x !== d0; }).map(function (x) { return { id: x, label: DIMS[x].label }; }), d1, function (v) { local.d1 = v; ctx.app.refresh(); }, { label: "Second grouping", width: "160px" }));
    wrap.appendChild(bar);
    var kids = tree(ctx, list, m, [d0, d1]), grid = h("div", { class: "grid" });
    var totalV = kids.reduce(function (s, k) { return s + k.children.reduce(function (t, c) { return t + c.value; }, 0); }, 0);
    var body;
    if (view === "sunburst") body = V.sunburst({ root: { label: MEASURES[m].label, children: kids }, fmt: fmt, height: 520, empty: "Nothing to break down in this period.",
      onClick: function (n) { var p = String(n.id || "").split("|"); if (p.length === 2) drillDim2(ctx, m, b, d0, p[0], d1, p[1]); } });
    else {
      var items = []; kids.forEach(function (k) { k.children.forEach(function (c) { items.push({ id: c.id, label: c.label, value: c.value, group: k.label, data: { a: k.id, c: c.key } }); }); });
      body = V.treemap({ items: items, fmt: fmt, height: 520, empty: "Nothing to break down in this period.", onClick: function (it) { drillDim2(ctx, m, b, d0, it.data.a, d1, it.data.c); } });
    }
    grid.appendChild(card({ title: MEASURES[m].label + " by " + DIMS[d0].label.toLowerCase() + " and " + DIMS[d1].label.toLowerCase(), meta: RANGES[local.range].toLowerCase() + " · " + fmt(totalV) + " in all", span: 8, body: body }));
    var top = agg(list, m, d0, ctx);
    grid.appendChild(card({ title: DIMS[d0].label + " ranking", meta: "biggest first", span: 4, flush: true, body: ui.table({ dense: true, sortable: false, onRow: function (r) { drillDim(ctx, m, b, d0, r.id); }, columns: [
      { key: "l", label: DIMS[d0].label, render: function (r) { return h("span", { class: "ell", style: { maxWidth: "190px", display: "inline-block" } }, r.label); } },
      { key: "v", label: "", num: true, render: function (r) { return fmt(r.value); } },
      { key: "p", label: "", num: true, render: function (r) { return ui.pct(totalV ? r.value / totalV : 0, 0); } }], rows: top.slice(0, 16) }) }));
    var periods = ctx.E.periodsBetween(ctx.E.fy + "-01", ctx.E.currentPeriod()), allF = facts(ctx);
    [["vendor", "Every vendor, small"], ["dept", "Every department, small"]].forEach(function (x) {
      var sr = series(allF, m, ctx, x[0], periods).filter(function (s) { return s.id !== "-"; }).slice(0, 18);
      if (sr.length < 2) return;
      grid.appendChild(card({ title: x[1], meta: MEASURES[m].label.toLowerCase() + " by month, each on its own scale", span: 12, body: V.multiples({ items: sr.map(function (s) { return { id: s.id, label: s.name, values: s.values, value: s.sum }; }), fmt: fmt, onClick: function (it) { drillDim(ctx, m, { from: ctx.E.fy + "-01", to: ctx.E.currentPeriod() }, x[0], it.id); } }) }));
    });
    wrap.appendChild(grid);
    return wrap;
  }
  function drillDim2(ctx, m, b, d0, i0, d1, i1) {
    var extra = Object.assign(filterFor(d0, i0), filterFor(d1, i1)), acc = null;
    [[d0, i0], [d1, i1]].forEach(function (p) { var a = accountsFor(ctx, p[0], p[1], m); if (a) acc = acc ? acc.filter(function (x) { return a.indexOf(x) >= 0; }) : a; });
    if (acc) extra.accounts = acc;
    extra.title = MEASURES[m].label + " · " + DIMS[d0].name(ctx, i0) + " · " + DIMS[d1].name(ctx, i1);
    drill(ctx, m, b, extra);
  }

  /* ================================================================== Time */
  function timeTab(ctx, list, b) {
    var E = ctx.E, m = local.m, fmt = fmtFor(ctx, m), periods = E.periodsBetween(E.fy + "-01", E.currentPeriod()), all = facts(ctx), wrap = h("div");
    var bar = h("div", { class: "viz-bar" }, ui.select(MEASURE_OPTS.map(function (x) { return { id: x, label: MEASURES[x].label }; }), m, function (v) { local.m = v; ctx.app.refresh(); }, { label: "Measure", width: "180px" }),
      ui.seg([{ id: "area", label: "Area" }, { id: "stream", label: "Stream" }, { id: "percent", label: "Share" }, { id: "columns", label: "Columns" }], local.stack, function (v) { local.stack = v; ctx.app.refresh(); }, { label: "Layering" }),
      ui.select(["category", "dept", "vendor", "account", "product", "source"].map(function (x) { return { id: x, label: "by " + DIMS[x].label.toLowerCase() }; }), local.d, function (v) { local.d = v; ctx.app.refresh(); }, { label: "Layer by", width: "170px" }));
    wrap.appendChild(bar);
    var grid = h("div", { class: "grid" }), d = local.d === "month" || local.d === "weekday" ? "category" : local.d;
    var ser = series(all, m, ctx, d, periods), keep = ser.slice(0, 8), rest = ser.slice(8);
    if (rest.length) keep.push({ id: "_", name: "Everything else", values: periods.map(function (_, j) { return rest.reduce(function (s, r) { return s + r.values[j]; }, 0); }) });
    grid.appendChild(card({ title: MEASURES[m].label + " through fiscal " + E.fy, meta: "layered by " + DIMS[d].label.toLowerCase() + " · hover to read one month, click a name to hide it", span: 12,
      body: periods.length > 1 && keep.length ? V.stacked({ labels: periods, series: keep.map(function (s, i) { return { name: s.name, values: s.values, color: V.color(i) }; }), mode: local.stack, fmt: fmt, height: 340, partialLast: true, partialLabel: ui.period(periods[periods.length - 1]).slice(0, 3) + " so far",
        xFormat: function (p) { return ui.period(p).slice(0, 3); }, tipTitle: function (p) { return ui.period(p, true); }, onClick: function (j) { drill(ctx, m, { from: periods[j], to: periods[j] }); } }) : needData("Needs at least two months of activity.") }));
    var days = {}, pk = MEASURES[m].pick; all.forEach(function (f) { var v = pk(f); if (v) days[f.date] = (days[f.date] || 0) + v; });
    grid.appendChild(card({ title: "Every day", meta: MEASURES[m].label.toLowerCase() + " by calendar day", span: 12, body: V.calendar({ values: days, from: E.fy + "-01-01", to: E.asOf, fmt: fmtFor(ctx, m), unit: MEASURES[m].label.toLowerCase(),
      onClick: function (iso) { drill(ctx, m, { from: iso.slice(0, 7), to: iso.slice(0, 7) }, { dateFrom: iso, dateTo: iso, title: MEASURES[m].label + " on " + ui.date(iso, "year") }); }, empty: "Nothing recorded yet." }) }));
    var byMonth = periods.map(function (p) { return total(all.filter(function (f) { return f.period === p; }), m); });
    var wk = [0, 0, 0, 0, 0, 0, 0]; all.forEach(function (f) { var v = pk(f); if (v) wk[new Date(f.date + "T00:00:00Z").getUTCDay()] += v; });
    grid.appendChild(card({ title: "The shape of the year", meta: "each month's share, by area", span: 6, body: V.rose({ labels: periods.map(function (p) { return ui.period(p).slice(0, 3); }), values: byMonth, fmt: fmt, height: 300, onClick: function (i) { drill(ctx, m, { from: periods[i], to: periods[i] }); }, empty: "Needs a few months of activity." }) }));
    grid.appendChild(card({ title: "The shape of the week", meta: "which days money moves", span: 6, body: V.rose({ labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], values: wk, fmt: fmt, height: 300, empty: "Nothing recorded yet." }) }));
    // Accounts × months.
    var rows = agg(all, m, "account", ctx).slice(0, 16), byAM = {}; all.forEach(function (f) { var v = pk(f); if (v) { byAM[f.account + "|" + f.period] = (byAM[f.account + "|" + f.period] || 0) + v; } });
    grid.appendChild(card({ title: "Accounts by month", meta: "darker is more · click a cell for its entries", span: 12, body: V.heatmatrix({ rows: rows.map(function (r) { return { id: r.id, label: r.id + " · " + r.label }; }), cols: periods.map(function (p) { return { id: p, label: ui.period(p).slice(0, 3) }; }), value: function (r, c) { return byAM[r + "|" + c]; }, fmt: fmt, perRow: false,
      onClick: function (r, c) { var q = { accounts: [r.id], title: r.label + " · " + ui.period(c.id, true) }; drill(ctx, m, { from: c.id, to: c.id }, q); }, empty: "Nothing recorded yet." }) }));
    wrap.appendChild(grid);
    return wrap;
  }

  /* =============================================================== Network */
  function networkTab(ctx, list, b) {
    var E = ctx.E, m = "expense", fmt = fmtFor(ctx, m), wrap = h("div"), pk = MEASURES.expense.pick;
    var da = {}, va = {}, dv = {}, ca = {}; var dTot = {}, aTot = {}, vTot = {}, cTot = {};
    list.forEach(function (f) {
      var v = pk(f), r = f.type === "revenue" && !f.ic ? -f.amt : 0;
      if (v > 0) {
        aTot[f.account] = (aTot[f.account] || 0) + v;
        if (f.dept) { da[f.dept + ">" + f.account] = (da[f.dept + ">" + f.account] || 0) + v; dTot[f.dept] = (dTot[f.dept] || 0) + v; }
        if (f.vendor) { va[f.vendor + ">" + f.account] = (va[f.vendor + ">" + f.account] || 0) + v; vTot[f.vendor] = (vTot[f.vendor] || 0) + v; if (f.dept) dv[f.vendor + ">" + f.dept] = (dv[f.vendor + ">" + f.dept] || 0) + v; }
      }
      if (r > 0 && f.customer) { ca[f.customer + ">" + f.account] = (ca[f.customer + ">" + f.account] || 0) + r; cTot[f.customer] = (cTot[f.customer] || 0) + r; aTot[f.account] = (aTot[f.account] || 0) + r; }
    });
    var topV = Object.keys(vTot).sort(function (a, c) { return vTot[c] - vTot[a]; }).slice(0, 16), topC = Object.keys(cTot).sort(function (a, c) { return cTot[c] - cTot[a]; }).slice(0, 14);
    var topA = Object.keys(aTot).sort(function (a, c) { return aTot[c] - aTot[a]; }).slice(0, 16), keepA = {}; topA.forEach(function (a) { keepA[a] = 1; });
    var nodes = [], links = [];
    Object.keys(dTot).forEach(function (d) { nodes.push({ id: "d:" + d, label: E.dimName("dept", d), group: "Department", value: dTot[d] }); });
    topA.forEach(function (a) { nodes.push({ id: "a:" + a, label: E.accounts[a].name, group: E.accounts[a].type === "revenue" ? "Revenue account" : "Account", value: aTot[a] }); });
    topV.forEach(function (v) { nodes.push({ id: "v:" + v, label: DIMS.vendor.name(ctx, v), group: "Vendor", value: vTot[v] }); });
    topC.forEach(function (c) { nodes.push({ id: "c:" + c, label: DIMS.customer.name(ctx, c), group: "Customer", value: cTot[c] }); });
    Object.keys(da).forEach(function (k) { var p = k.split(">"); if (keepA[p[1]]) links.push({ source: "d:" + p[0], target: "a:" + p[1], value: da[k] }); });
    Object.keys(va).forEach(function (k) { var p = k.split(">"); if (keepA[p[1]] && topV.indexOf(p[0]) >= 0) links.push({ source: "v:" + p[0], target: "a:" + p[1], value: va[k] }); });
    Object.keys(dv).forEach(function (k) { var p = k.split(">"); if (topV.indexOf(p[0]) >= 0 && dTot[p[1]]) links.push({ source: "v:" + p[0], target: "d:" + p[1], value: dv[k] * 0.6 }); });
    Object.keys(ca).forEach(function (k) { var p = k.split(">"); if (keepA[p[1]] && topC.indexOf(p[0]) >= 0) links.push({ source: "c:" + p[0], target: "a:" + p[1], value: ca[k] }); });
    wrap.appendChild(h("div", { class: "viz-bar" }, h("span", { class: "muted", style: { fontSize: "12.5px" } }, "Departments, accounts, vendors and customers, pulled together by the money between them. Drag any node — its neighbours follow. Hover to follow one thread; click to open its entries.")));
    var groups = {}; nodes.forEach(function (n) { groups[n.group] = 1; });
    wrap.appendChild(card({ title: "What is tied to what", meta: nodes.length + " things · " + links.length + " ties · " + RANGES[local.range].toLowerCase(), span: 12,
      foot: [h("div", { class: "viz-legend" }, Object.keys(groups).map(function (gname, i) { return h("span", { style: { display: "inline-flex", alignItems: "center", gap: "6px" } }, h("i", { style: { background: V.color(Object.keys(groups).indexOf(gname)), width: "10px", height: "10px", borderRadius: "50%", display: "inline-block" } }), gname); }))],
      body: V.network({ nodes: nodes, links: links, fmt: fmt, height: 560, empty: "The network appears once entries carry departments, vendors or customers.",
        onClick: function (n) { var p = n.id.split(":"); if (p[0] === "a") drillDim(ctx, E.accounts[p[1]].type === "revenue" ? "revenue" : "expense", b, "account", p[1]); else if (p[0] === "d") drillDim(ctx, "expense", b, "dept", p[1]); else if (p[0] === "v") drillDim(ctx, "expense", b, "vendor", p[1]); else if (p[0] === "c") drillDim(ctx, "revenue", b, "customer", p[1]); } }) }));
    return wrap;
  }

  /* ================================================================ Explore */
  var CHARTS = [["treemap", "Treemap"], ["sunburst", "Sunburst"], ["donut", "Donut"], ["bars", "Bars"], ["pareto", "Pareto"], ["stacked", "Over time"], ["heat", "Heat map"], ["rose", "Rose"], ["calendar", "Calendar"], ["flow", "Flow"]];
  function exploreTab(ctx, list, b) {
    var E = ctx.E, m = local.m, d = local.d, c = local.chart, fmt = fmtFor(ctx, m), wrap = h("div", { class: "explorer" }), all = facts(ctx);
    var periods = E.periodsBetween(E.fy + "-01", E.currentPeriod());
    var panel = h("div", { class: "card panel" }, h("div", { class: "card-b" }, h("div", { class: "ex-ctl" },
      h("label", { class: "field" }, h("span", null, "Measure"), ui.select(MEASURE_OPTS.map(function (x) { return { id: x, label: MEASURES[x].label }; }), m, function (v) { local.m = v; ctx.app.refresh(); }, { label: "Measure" })),
      h("label", { class: "field" }, h("span", null, "Break down by"), ui.select(DIM_OPTS.map(function (x) { return { id: x, label: DIMS[x].label }; }), d, function (v) { local.d = v; ctx.app.refresh(); }, { label: "Break down by" })),
      h("label", { class: "field" }, h("span", null, "Then by (flow, heat map)"), ui.select(DIM_OPTS.filter(function (x) { return x !== d; }).map(function (x) { return { id: x, label: DIMS[x].label }; }), local.d1 === d ? "month" : local.d1, function (v) { local.d1 = v; ctx.app.refresh(); }, { label: "Then by" })),
      h("div", { class: "field" }, h("span", null, "Chart"), h("div", { class: "sm-grid", style: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px" } }, CHARTS.map(function (ch) {
        return h("button", { type: "button", class: "btn" + (ch[0] === c ? " primary" : ""), on: { click: function () { local.chart = ch[0]; ctx.app.refresh(); } } }, ch[1]);
      }))))));
    var d1 = local.d1 === d ? "month" : local.d1, rows = agg(list, m, d, ctx), tot = rows.reduce(function (s, r) { return s + Math.max(0, r.value); }, 0), body;
    var pos = rows.filter(function (r) { return r.value > 0; });
    var onDim = function (id) { drillDim(ctx, m, b, d, id); };
    if (!pos.length) body = needData("Nothing to show for " + MEASURES[m].label.toLowerCase() + " in this period.");
    else if (c === "treemap") body = V.treemap({ items: pos.map(function (r) { return { id: r.id, label: r.label, value: r.value }; }), fmt: fmt, height: 460, onClick: function (it) { onDim(it.id); } });
    else if (c === "sunburst") { var kids = tree(ctx, list, m, [d, d1 === "month" ? "account" : d1]); body = V.sunburst({ root: { label: MEASURES[m].label, children: kids }, fmt: fmt, height: 460 }); }
    else if (c === "donut") body = V.donut({ items: pos.slice(0, 10).map(function (r) { return { id: r.id, label: r.label, value: r.value }; }), fmt: fmt, height: 420, onClick: function (it) { onDim(it.id); } });
    else if (c === "bars") body = V.bullet({ rows: pos.slice(0, 16).map(function (r) { return { label: r.label, actual: r.value, id: r.id }; }), fmt: fmt, onClick: function (r) { onDim(r.id); } });
    else if (c === "pareto") body = V.pareto({ items: pos.map(function (r) { return { id: r.id, label: r.label, value: r.value }; }), fmt: fmt, height: 380, onClick: function (it) { onDim(it.id); } });
    else if (c === "stacked") { var ser = series(all, m, ctx, d === "month" || d === "weekday" ? "category" : d, periods).slice(0, 9); body = V.stacked({ labels: periods, series: ser.map(function (s, i) { return { name: s.name, values: s.values, color: V.color(i) }; }), mode: local.stack, fmt: fmt, height: 400, xFormat: function (p) { return ui.period(p).slice(0, 3); }, tipTitle: function (p) { return ui.period(p, true); } }); }
    else if (c === "rose") { var lab = pos.slice(0, 12); body = V.rose({ labels: lab.map(function (r) { return r.label.slice(0, 10); }), values: lab.map(function (r) { return r.value; }), fmt: fmt, height: 400, onClick: function (i) { onDim(lab[i].id); } }); }
    else if (c === "calendar") { var days = {}, pk = MEASURES[m].pick; all.forEach(function (f) { var v = pk(f); if (v) days[f.date] = (days[f.date] || 0) + v; }); body = V.calendar({ values: days, from: E.fy + "-01-01", to: E.asOf, fmt: fmt, unit: MEASURES[m].label.toLowerCase() }); }
    else if (c === "heat") {
      var k2 = DIMS[d1].key, pk2 = MEASURES[m].pick, cell = {}, cs = {}; list.forEach(function (f) { var v = pk2(f); if (v) { var id2 = k2(f); cell[DIMS[d].key(f) + "|" + id2] = (cell[DIMS[d].key(f) + "|" + id2] || 0) + v; cs[id2] = (cs[id2] || 0) + v; } });
      var colsIds = Object.keys(cs).sort(function (a, z) { return d1 === "month" || d1 === "weekday" ? (a < z ? -1 : 1) : cs[z] - cs[a]; }).slice(0, 14);
      body = V.heatmatrix({ rows: pos.slice(0, 18).map(function (r) { return { id: r.id, label: r.label }; }), cols: colsIds.map(function (id) { return { id: id, label: DIMS[d1].name(ctx, id).slice(0, 12) }; }), value: function (r, cc) { return cell[r + "|" + cc]; }, fmt: fmt, height: 460 });
    } else {
      var byPair = {}; list.forEach(function (f) { var v = MEASURES[m].pick(f); if (v <= 0) return; var a = "L:" + DIMS[d].key(f), z = "R:" + DIMS[d1].key(f); byPair[a + ">" + z] = (byPair[a + ">" + z] || 0) + v; });
      var nodes = {}, links = []; Object.keys(byPair).forEach(function (k) { var p = k.split(">"); nodes[p[0]] = { id: p[0], label: DIMS[d].name(ctx, p[0].slice(2)), layer: 0 }; nodes[p[1]] = { id: p[1], label: DIMS[d1].name(ctx, p[1].slice(2)), layer: 1 }; links.push({ source: p[0], target: p[1], value: byPair[k] }); });
      links.sort(function (a, z) { return z.value - a.value; }); links = links.slice(0, 40);
      var keepN = {}; links.forEach(function (l) { keepN[l.source] = 1; keepN[l.target] = 1; });
      body = V.sankey({ nodes: Object.keys(nodes).filter(function (k) { return keepN[k]; }).map(function (k) { return nodes[k]; }), links: links, fmt: fmt, height: 460 });
    }
    var right = h("div", { class: "stack", style: { gap: "16px", minWidth: 0 } },
      card({ title: MEASURES[m].label + " by " + DIMS[d].label.toLowerCase(), meta: RANGES[local.range].toLowerCase() + " · " + fmt(tot) + " in all", body: body,
        tools: ui.btn("Export CSV", { size: "sm", kind: "ghost", icon: "download", onClick: function () { ui.csv("oc-efm-" + m + "-by-" + d + ".csv", [[DIMS[d].label, MEASURES[m].label, "Share"]].concat(rows.map(function (r) { return [r.label, MEASURES[m].count ? r.value : (r.value / Math.pow(10, E.dp(ctx.app.scopeCurrency()))).toFixed(E.dp(ctx.app.scopeCurrency())), tot ? (r.value / tot * 100).toFixed(1) + "%" : ""]; }))); } }) }),
      card({ title: "The numbers", meta: rows.length + " row" + (rows.length === 1 ? "" : "s"), flush: true, body: ui.table({ dense: true, sortable: false, onRow: function (r) { onDim(r.id); }, limit: 30, columns: [
        { key: "l", label: DIMS[d].label, render: function (r) { return r.label; } },
        { key: "v", label: MEASURES[m].label, num: true, render: function (r) { return fmt(r.value); } },
        { key: "p", label: "Share", num: true, render: function (r) { return tot ? ui.pct(Math.max(0, r.value) / tot, 1) : ""; } },
        { key: "b", label: "", render: function (r) { return h("span", { style: { display: "inline-block", width: "120px" } }, ui.meter(tot ? Math.max(0, r.value) / (pos[0] ? pos[0].value : 1) : 0, { max: 1 })); } }], rows: rows }) }));
    wrap.appendChild(panel); wrap.appendChild(right);
    return wrap;
  }

  /* ================================================================== View */
  var local = { range: "ytd", m: "expense", d: "category", d1: "account", view: "treemap", chart: "treemap", stack: "area", flowMode: "auto" };
  var TABS = [["overview", "Overview"], ["flow", "Flow"], ["composition", "Composition"], ["time", "Time"], ["network", "Network"], ["explore", "Explore"]];

  EFM.view("insights", {
    title: "Insights", icon: "spark", wide: true,
    render: function (ctx) {
      var q = ctx.query, app = ctx.app, E = ctx.E;
      ["m", "d", "d1", "c"].forEach(function (k) { var v = q.get(k); if (v) local[k === "c" ? "chart" : k] = v; });
      if (q.get("r") && RANGES[q.get("r")]) local.range = q.get("r");
      if (!MEASURES[local.m]) local.m = "expense";
      var tab = q.get("tab") || "overview", b = bounds(ctx, local.range), all = facts(ctx), list = within(all, b);
      var page = h("div");
      page.appendChild(ui.pageHead("Insights", "The whole book, drawn — from a single figure to the flow of every dollar. Hover, follow, click through to the entries.",
        [ui.select(Object.keys(RANGES).map(function (r) { return { id: r, label: RANGES[r] }; }), local.range, function (v) { local.range = v; app.refresh(); }, { label: "Period", width: "170px" })]));
      if (!all.length) { page.appendChild(card({ span: 12, body: h("div", { class: "empty", style: { padding: "48px 16px" } }, ui.icon("spark"), h("b", null, "Nothing to draw yet"), h("div", null, "Insights are drawn from what's been recorded. Record a few entries and they appear here."),
        h("div", { style: { marginTop: "12px" } }, ui.btn("New entry", { kind: "primary", icon: "plus", onClick: function () { EFM.entry.open(); } }))) })); return page; }
      page.appendChild(hero(ctx, list, b));
      page.appendChild(h("div", { style: { marginBottom: "16px" } }, ui.seg(TABS.map(function (t) { return { id: t[0], label: t[1] }; }), tab, function (t) { app.setQuery({ tab: t === "overview" ? null : t }); }, { label: "Insights views" })));
      var body = tab === "flow" ? flowTab(ctx, list, b) : tab === "composition" ? compositionTab(ctx, list, b) : tab === "time" ? timeTab(ctx, list, b) : tab === "network" ? networkTab(ctx, list, b) : tab === "explore" ? exploreTab(ctx, list, b) : overview(ctx, list, b);
      page.appendChild(body);
      return page;
    }
  });
  EFM.insights = { facts: facts, MEASURES: MEASURES, DIMS: DIMS };
})(window);
