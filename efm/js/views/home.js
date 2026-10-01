/* ==========================================================================
   OC EFM — Home.

   The same Home for everyone: where the money is, how the month went, what
   needs a person, and how far the close has got. Exceptions lead; routine
   work stays out of the way.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;

  function greeting() {
    var hr = new Date().getHours();
    return hr < 5 ? "Working late" : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  }

  /* The income statement for one month, in the scope's currency. */
  function pl(E, scope, from, to) {
    var rows = E.layout("is", E.measure(scope, from, to), { group: scope === "GROUP", hideIC: scope === "GROUP" });
    var o = {};
    rows.forEach(function (r) { o[r.id] = r.value; });
    return o;
  }
  function planRevenue(E, scope, p) { return -E.budgetFor(scope, "REV", ["4000", "4100", "4200"], p, p); }

  /* --------------------------------------------------------- Widgets */
  function attentionCard(ctx, o) {
    o = o || {};
    var E = ctx.E, app = ctx.app;
    var items = E.attention().filter(o.filter || function () { return true; });
    var list = h("div", { class: "att" + (o.clamp === false ? "" : " clamp") });
    items.slice(0, o.limit || 5).forEach(function (a) {
      var b = h("button", { type: "button", class: "att-i", on: { click: function () { app.navigate(a.action.go); } } },
        ui.sev(a.sev),
        h("div", { class: "grow" }, h("div", { class: "area" }, a.area), h("div", { class: "t" }, a.title), h("div", { class: "x" }, a.detail)),
        h("div", { class: "a" }, ui.icon("chev", "sm")));
      list.appendChild(b);
    });
    if (!items.length) list.appendChild(ui.empty("All clear", "Nothing needs attention right now.", "check"));
    var more = items.length - Math.min(items.length, o.limit || 5);
    return ui.card({ title: o.title || "Needs attention", meta: items.length ? String(items.length) : null, flush: true, body: list, span: o.span || 4,
      tools: ui.btn("Inbox", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/inbox"); } }),
      foot: more > 0 ? [h("span", null, more + " more in your Inbox"), h("span", { class: "sp" }), ui.btn("View all", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/inbox"); } })] : null });
  }

  function cashChart(ctx, o) {
    o = o || {};
    var E = ctx.E, app = ctx.app;
    var hist = E.cashHistory(13), fc = E.cashForecast(13);
    var labels = hist.map(function (x) { return x.date; }).concat(fc.map(function (w) { return w.end; }));
    var actual = hist.map(function (x) { return x.cash; }).concat(fc.map(function () { return null; }));
    var fcast = hist.map(function (x, i) { return i === hist.length - 1 ? x.cash : null; }).concat(fc.map(function (w) { return w.close; }));
    // The forecast starts from today's balance, so it joins the actual line.
    fcast[hist.length - 1] = E.cashPosition().total;
    actual[hist.length - 1] = E.cashPosition().total;
    var low = fc.reduce(function (m, w) { return w.close < m.close ? w : m; }, fc[0]);
    var chart = ui.charts.line({ height: o.height || 230, labels: labels, split: hist.length - 1, splitLabel: "Today",
      series: [{ name: "Actual", color: "var(--s1)", values: actual, area: true, endDot: false }, { name: "Forecast", color: "var(--s1)", values: fcast, dashFrom: 0, endDot: true }],
      xFormat: function (d) { return ui.date(d); }, yFormat: function (v) { return E.fmt(v, "USD", { compact: true }); },
      tipFormat: function (v) { return E.fmt(v, "USD", { compact: true }); },
      tipTitle: function (d, i) { return i < hist.length ? "Week ending " + ui.date(d) : "Week ending " + ui.date(d) + " · forecast"; },
      tipExtra: function (i) {
        var w = fc[i - hist.length];
        if (!w) return [];
        return [{ value: "+" + E.fmt(w.inflow, "USD", { compact: true }), label: "in" }, { value: "−" + E.fmt(w.outflow, "USD", { compact: true }), label: "out" }];
      }, label: "Cash, thirteen weeks of actuals and thirteen of forecast" });
    var next4 = fc.slice(0, 4);
    var inn = next4.reduce(function (s, w) { return s + w.inflow; }, 0), out = next4.reduce(function (s, w) { return s + w.outflow; }, 0);
    var stats = h("div", { class: "stat-row", style: { marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--line)" } },
      h("div", null, h("div", { class: "l" }, "Coming in, next 4 weeks"), h("div", { class: "v" }, E.fmt(inn, "USD", { compact: true }))),
      h("div", null, h("div", { class: "l" }, "Going out, next 4 weeks"), h("div", { class: "v" }, E.fmt(out, "USD", { compact: true }))),
      h("div", null, h("div", { class: "l" }, "In 13 weeks"), h("div", { class: "v" }, E.fmt(fc[fc.length - 1].close, "USD", { compact: true }))),
      h("div", null, h("div", { class: "l" }, "Lowest point"), h("div", { class: "v" }, E.fmt(low.close, "USD", { compact: true }))));
    return ui.card({ title: "Cash", meta: "13 weeks back · 13 ahead · all entities in USD", span: o.span || 8,
      tools: ui.charts.legend([{ label: "Actual", color: "var(--s1)", kind: "line" }, { label: "Forecast", color: "var(--s1)", kind: "dash" }]),
      body: h("div", null, chart, stats),
      foot: [h("span", null, "Forecast from open receivables and payables, payroll, rent, debt service and settlement run-rates · lowest week of " + ui.date(low.start)), h("span", { class: "sp" }),
        ui.btn("Cash & banking", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/cash"); } })] });
  }

  function revenueChart(ctx, o) {
    o = o || {};
    var E = ctx.E, app = ctx.app, scope = ctx.scope, c = app.scopeCurrency();
    var ps = E.periodsBetween(E.fy + "-01", E.currentPeriod());
    var data = ps.map(function (p) { return pl(E, scope, p, p); });
    var chart = ui.charts.columns({ height: 220, labels: ps, prelimFrom: ps.length - 1,
      series: [{ name: "Revenue", color: "var(--s1)", values: data.map(function (d) { return d.revT; }) }],
      marks: { name: "Plan", values: ps.map(function (p) { return planRevenue(E, scope, p); }) },
      xFormat: function (p) { return ui.period(p).slice(0, 3); }, yFormat: function (v) { return E.fmt(v, c, { compact: true }); },
      tipFormat: function (v) { return E.fmt(v, c, { compact: true }); }, tipTitle: function (p) { return ui.period(p, true); },
      tipExtra: function (i) { return [{ value: E.fmt(data[i].oi, c, { compact: true }), label: "operating income" }, { value: ui.pct(data[i].om, 1), label: "operating margin" }]; },
      onClick: function (i) { app.navigate("/reports?r=is&p=" + ps[i]); }, label: "Revenue by month against plan" });
    var L = E.lastClosedPeriod(), ytd = pl(E, scope, E.fy + "-01", L), plan = -E.budgetFor(scope, "REV", ["4000", "4100", "4200"], E.fy + "-01", L);
    return ui.card({ title: "Revenue", meta: "Fiscal " + E.fy + " · " + app.scopeLabel(), span: o.span || 6,
      tools: ui.charts.legend([{ label: "Revenue", color: "var(--s1)" }, { label: "Plan", color: "var(--ink)", kind: "line" }, { label: "Open month", color: "var(--s1)", kind: "hatch" }]),
      body: chart,
      foot: [h("span", null, "Year to date through " + ui.period(L) + ": ", h("b", { class: "num" }, E.fmt(ytd.revT, c, { compact: true })), " · ", ui.delta(plan ? (ytd.revT - plan) / plan : null), " vs plan")] });
  }

  function budgetCard(ctx, o) {
    o = o || {};
    var E = ctx.E, app = ctx.app, scope = ctx.scope, c = app.scopeCurrency(), L = E.lastClosedPeriod();
    var rows = E.budgetVsActual(scope, E.fy + "-01", L).sort(function (a, b) { return b.used - a.used; });
    var list = h("div");
    rows.forEach(function (r) {
      var tone = r.used > 1.1 ? "bad" : r.used > 1 ? "warn" : "";
      list.appendChild(h("button", { type: "button", class: "bva", on: { click: function () { app.navigate("/budgets?dept=" + r.dept.id); } } },
        h("span", { class: "nm ell" }, r.dept.name), ui.meter(r.used, { max: 1.25, mark: 1, tone: tone }),
        h("span", { class: "am" }, E.fmt(r.actual, c, { compact: true })),
        h("span", { class: "pc", style: { color: r.used > 1.1 ? "var(--bad)" : r.used > 1 ? "var(--warn)" : "var(--ink)" } }, ui.pct(r.used, r.used > 1 ? 1 : 0))));
    });
    return ui.card({ title: "Spending against budget", meta: "Year to date through " + ui.period(L) + " · expenses", span: o.span || 6, body: list,
      foot: [h("span", null, "The mark is 100% of budget. Over 110% needs the CFO."), h("span", { class: "sp" }), ui.btn("Budgets", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/budgets"); } })] });
  }

  function entitiesCard(ctx, o) {
    var E = ctx.E, app = ctx.app, L = E.lastClosedPeriod();
    var cash = E.cashPosition();
    var grid = h("div", { class: "grid", style: { gap: "12px" } });
    E.entities.forEach(function (e) {
      var d = pl(E, e.id, L, L), c = e.currency;
      var ec = cash.rows.filter(function (r) { return r.bank.entity === e.id; }).reduce(function (s, r) { return s + r.balance; }, 0);
      grid.appendChild(h("button", { type: "button", class: "card flat c4 entity-card", "aria-label": "Report on " + e.name, on: { click: function () { app.setScope(e.id); } } },
        h("div", { class: "row" }, h("span", { class: "ws-dot" }, e.id), h("b", { class: "ell grow", style: { fontSize: "13.5px" } }, e.name)),
        h("div", { class: "muted", style: { fontSize: "12px", margin: "4px 0 10px" } }, e.city + " · " + c + " · " + E.periodLabel(L) + " closed"),
        h("div", { class: "row", style: { justifyContent: "space-between", fontSize: "12.5px" } }, h("span", { class: "muted" }, "Revenue"), h("b", { class: "num" }, E.fmt(d.revT, c, { compact: true }))),
        h("div", { class: "row", style: { justifyContent: "space-between", fontSize: "12.5px", marginTop: "3px" } }, h("span", { class: "muted" }, "Operating income"), ui.amt(d.oi, c, { compact: true })),
        h("div", { class: "row", style: { justifyContent: "space-between", fontSize: "12.5px", marginTop: "3px" } }, h("span", { class: "muted" }, "Cash today"), h("b", { class: "num" }, E.fmt(ec, c, { compact: true })))));
    });
    var ic = E.intercompany(E.currentPeriod()).filter(function (x) { return Math.abs(x.difference) >= 10000; });
    return ui.card({ title: "Legal entities", meta: ui.period(L, true) + ", in local currency", span: (o && o.span) || 8, body: grid,
      foot: [h("span", null, "Consolidated in USD — " + ui.period(L) + " closing rates GBP " + E.rate("GBP", L, "close").toFixed(4) + " · JPY " + E.rate("JPY", L, "close").toFixed(6) +
        (ic.length ? " · " + ic.length + " intercompany pair" + (ic.length > 1 ? "s" : "") + " out of balance for " + ui.period(E.currentPeriod()) : " · intercompany in balance"))],
      tools: ui.btn("Consolidation", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/consolidation"); } }) });
  }

  function closeCard(ctx, o) {
    o = o || {};
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
    var tasks = Object.values(E.closeTasks).filter(function (t) { return t.period === cp; });
    var done = tasks.filter(function (t) { return t.status === "done"; }).length;
    var next = tasks.filter(function (t) { return t.status !== "done"; }).sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : a.id < b.id ? -1 : 1; }).slice(0, o.limit || 4);
    var hist = E.closeHistory;
    var body = h("div", null,
      h("div", { class: "row", style: { gap: "16px", marginBottom: "12px" } }, ui.charts.ring(done / tasks.length, { text: done + "/" + tasks.length, label: done + " of " + tasks.length + " tasks done" }),
        h("div", null, h("div", { style: { fontWeight: "600" } }, ui.period(cp, true)), h("div", { class: "muted", style: { fontSize: "12.5px" } }, "Period ends " + ui.date(E.lastDay(cp)) + " · target close " + ui.date(tasks.reduce(function (m, t) { return t.due > m ? t.due : m; }, "")) ),
          h("div", { class: "muted", style: { fontSize: "12.5px", marginTop: "2px" } }, "Last close: " + hist[hist.length - 1].days + " working days"))),
      h("div", { class: "att" }, next.map(function (t) {
        var blocked = (t.deps || []).some(function (d) { return E.closeTasks[d].status !== "done"; });
        return h("button", { type: "button", class: "att-i", style: { padding: "9px 0" }, on: { click: function () { app.open({ kind: "task", id: t.id }); } } },
          h("span", { class: "check" + (t.status === "in-progress" ? " prog" : blocked ? " blocked" : "") }),
          h("div", { class: "grow" }, h("div", { class: "t", style: { fontSize: "13px", fontWeight: "500" } }, t.title), h("div", { class: "x" }, ui.person(t.owner).name + " · " + t.wd + " · " + ui.date(t.due))),
          t.run ? ui.tag("Automated") : null);
      })));
    return ui.card({ title: "Close", meta: done + " of " + tasks.length + " done", span: o.span || 4, body: body,
      tools: ui.btn("Open close", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/close"); } }) });
  }

  function tieOutCard(ctx, o) {
    var E = ctx.E, app = ctx.app, rows = [];
    E.entities.forEach(function (e) {
      var c = e.currency;
      var ar = E.arOpen(e.id).reduce(function (s, i) { return s + i.balance; }, 0), arGL = E.balance(e.id, "1100", "2026-12");
      var ap = E.apOpen(e.id).reduce(function (s, i) { return s + i.amount; }, 0), apGL = -E.balance(e.id, "2000", "2026-12");
      var fa = Object.values(E.assets).filter(function (a) { return a.entity === e.id; }).reduce(function (s, a) { return s + a.cost; }, 0);
      var faGL = ["1510", "1520", "1530"].reduce(function (s, a) { return s + E.balance(e.id, a, "2026-12"); }, 0);
      rows.push({ e: e, what: "Receivables", sub: ar, gl: arGL, c: c, acct: "1100" }, { e: e, what: "Payables", sub: ap, gl: apGL, c: c, acct: "2000" }, { e: e, what: "Fixed assets (cost)", sub: fa, gl: faGL, c: c, acct: "1510" });
    });
    var t = ui.table({ dense: true, sortable: false, onRow: function (r) { app.open({ kind: "account", id: r.acct, q: { entity: r.e.id } }); }, columns: [
      { key: "e", label: "Entity", render: function (r) { return r.e.short; } },
      { key: "what", label: "Subledger" },
      { key: "sub", label: "Subledger", num: true, render: function (r) { return E.fmt(r.sub, r.c, { compact: true }); } },
      { key: "gl", label: "Ledger", num: true, render: function (r) { return E.fmt(r.gl, r.c, { compact: true }); } },
      { key: "ok", label: "", render: function (r) { return r.sub === r.gl ? ui.status("good", "Ties") : ui.status("bad", "Off by " + E.fmt(r.sub - r.gl, r.c)); } }], rows: rows });
    return ui.card({ title: "Subledgers tie to the ledger", meta: "Live · to the cent", span: (o && o.span) || 6, flush: true, body: t });
  }

  function recentJournals(ctx, o) {
    var E = ctx.E, app = ctx.app;
    var js = E.journalOrder.slice(-400).map(function (id) { return E.journals[id]; })
      .filter(function (j) { return app.inScope(j.entity) && (app.live || j.source.type === "manual" || j.source.type === "reversal" || app.isMe(j.createdBy) || j.status !== "posted"); })
      .reverse().slice(0, 8);
    return ui.card({ title: app.live ? "Recent journals" : "Manual and recent journals", span: (o && o.span) || 6, flush: true,
      tools: ui.btn("Journals", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/journals"); } }),
      body: ui.table({ dense: true, sortable: false, onRow: function (j) { app.open({ kind: "journal", id: j.id }); }, columns: [
        { key: "id", label: "Journal", render: function (j) { return h("span", { class: "mono" }, j.id); } },
        { key: "memo", label: "Memo", render: function (j) { return h("span", { class: "ell", style: { display: "inline-block", maxWidth: "260px" } }, j.memo); } },
        { key: "st", label: "Status", render: function (j) { return ui.status(j.status); } },
        { key: "t", label: "Amount", num: true, render: function (j) { return E.fmt(j.total, E.entity[j.entity].currency, { compact: true }); } }], rows: js }) });
  }

  function apQueue(ctx, o) {
    var E = ctx.E, app = ctx.app;
    var rows = Object.values(E.apInvoices).filter(function (i) { return (i.status === "review" || i.status === "hold") && app.inScope(i.entity); })
      .sort(function (a, b) { return (b.flags.filter(function (f) { return !f.resolved; }).length - a.flags.filter(function (f) { return !f.resolved; }).length) || (a.due < b.due ? -1 : 1); });
    return ui.card({ title: "Invoices waiting", meta: rows.length + " in the queue", span: (o && o.span) || 8, flush: true,
      tools: ui.btn("Payables", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/payables"); } }),
      body: ui.table({ dense: true, onRow: function (i) { app.open({ kind: "ap", id: i.id }); }, columns: [
        { key: "v", label: "Vendor", render: function (i) { return h("span", { class: "two" }, E.vendors[i.vendor].name, h("span", { class: "sub" }, i.number)); }, cls: "two" },
        { key: "f", label: "", render: function (i) { var f = i.flags.filter(function (x) { return !x.resolved; })[0]; return f ? ui.tag(f.title, f.sev === "critical" ? "bad" : "serious") : i.status === "hold" ? ui.status("hold") : ui.status("review"); } },
        { key: "due", label: "Due", render: function (i) { return ui.date(i.due); } },
        { key: "amount", label: "Amount", num: true, render: function (i) { return E.fmt(i.amount, i.currency); } }], rows: rows }) });
  }

  function paymentRun(ctx, o) {
    var E = ctx.E, app = ctx.app, run = E.nextPaymentRun();
    var rows = Object.values(E.apInvoices).filter(function (i) { return i.status === "scheduled" && app.inScope(i.entity); });
    var tot = rows.reduce(function (s, i) { return s + E.usdOf(i.entity, i.amount, E.currentPeriod(), "close"); }, 0);
    var held = rows.filter(function (i) { return E.vendors[i.vendor].bankPending; });
    return ui.card({ title: "Payment run · " + ui.date(run, "long"), meta: rows.length + " invoices · " + E.fmt(tot, "USD", { compact: true }), span: (o && o.span) || 6, flush: true,
      tools: ui.btn("Open run", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/payables?status=scheduled"); } }),
      body: ui.table({ dense: true, onRow: function (i) { app.open({ kind: "ap", id: i.id }); }, sortKey: "amount", sortDir: -1, limit: 7, columns: [
        { key: "v", label: "Vendor", render: function (i) { return E.vendors[i.vendor].name; } },
        { key: "e", label: "Entity", render: function (i) { return i.entity; } },
        { key: "amount", label: "Amount", num: true, sort: function (i) { return E.usdOf(i.entity, i.amount, E.currentPeriod()); }, render: function (i) { return E.fmt(i.amount, i.currency); } }], rows: rows }),
      foot: held.length ? [ui.icon("lock", "sm"), h("span", null, held.length + " held for bank verification")] : null });
  }

  function cashTable(ctx, o) {
    var E = ctx.E, app = ctx.app, pos = E.cashPosition();
    return ui.card({ title: "Cash by account", meta: "Bank balances today · " + E.fmt(pos.total, "USD", { compact: true }) + " in USD", span: (o && o.span) || 7, flush: true,
      body: ui.table({ dense: true, sortable: false, onRow: function (r) { app.navigate("/cash/" + r.bank.id); }, columns: [
        { key: "b", label: "Account", cls: "two", render: function (r) { return h("span", null, r.bank.bankName + " · " + r.bank.name, h("span", { class: "sub" }, E.entity[r.bank.entity].name + " · " + r.bank.mask)); } },
        { key: "bal", label: "Bank", num: true, render: function (r) { return E.fmt(r.balance, r.currency, { dp: 0 }); } },
        { key: "book", label: "Books", num: true, render: function (r) { return E.fmt(r.book, r.currency, { dp: 0 }); } },
        { key: "usd", label: "USD", num: true, render: function (r) { return E.fmt(r.usd, "USD", { compact: true }); } },
        { key: "u", label: "", render: function (r) { return r.unmatched ? ui.status("unmatched", r.unmatched + " to match") : ui.status("good", "Reconciled"); } }], rows: pos.rows }) });
  }

  function controlsCard(ctx, o) {
    var E = ctx.E, app = ctx.app;
    var list = h("div", { class: "att" });
    Object.values(E.anomalies).sort(function (a, b) { return (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1); }).forEach(function (a) {
      list.appendChild(h("button", { type: "button", class: "att-i", on: { click: function () { app.open({ kind: "anomaly", id: a.id }); } } }, ui.sev(a.status === "open" ? a.sev : "info"),
        h("div", { class: "grow" }, h("div", { class: "area" }, a.id + " · " + a.rule.split(" · ")[0]), h("div", { class: "t" }, a.title), h("div", { class: "x" }, a.status === "open" ? a.detail : "Closed: " + a.status + (a.note ? " — " + a.note : ""))),
        h("div", { class: "a" }, a.status === "open" ? ui.status(a.sev) : ui.status(a.status))));
    });
    return ui.card({ title: "Control flags", meta: Object.values(E.anomalies).filter(function (a) { return a.status === "open"; }).length + " open", span: (o && o.span) || 7, flush: true, body: list,
      tools: ui.btn("Audit & controls", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/audit"); } }) });
  }

  function sensitiveCard(ctx, o) {
    var E = ctx.E;
    var evs = E.audit.filter(function (ev) { return /^(vendor\.|period\.set|journal\.reverse|anomaly\.|ap\.reject|journal\.reject)/.test(ev.action); }).slice(-7).reverse();
    return ui.card({ title: "Sensitive changes", meta: "From the audit trail", span: (o && o.span) || 5, body: ui.timeline(evs, { chain: true }) });
  }

  /* ---------------------------------------------------------- Homes */
  function header(ctx) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
    var last = E.closeHistory && E.closeHistory[E.closeHistory.length - 1];
    var sub = ui.date(E.asOf, "long") + " · " + app.scopeLabel();
    sub += last ? " · " + ui.period(E.lastClosedPeriod()) + " closed " + ui.date(last.closedAt) + " · " + ui.period(cp) + " open" : " · " + ui.period(cp) + " open";
    return h("div", { class: "ph greet" },
      h("div", null, h("h1", null, greeting() + ", " + (app.me.firstName || "there")), h("p", null, sub)),
      h("div", { class: "actions" },
        ui.btn("Ask a question", { icon: "sparkle", onClick: function () { app.palette(); } }),
        ui.btn("Reports", { icon: "report", onClick: function () { app.navigate("/reports"); } })));
  }

  function overviewKpis(ctx) {
    var E = ctx.E, app = ctx.app, scope = ctx.scope, c = app.scopeCurrency(), L = E.lastClosedPeriod(), P = E.addMonths(L, -1);
    var a = pl(E, scope, L, L), b = pl(E, scope, P, P), ytd = pl(E, scope, E.fy + "-01", L);
    var plan = -E.budgetFor(scope, "REV", ["4000", "4100", "4200"], E.fy + "-01", L);
    var hist = E.cashHistory(13), pos = E.cashPosition();
    var cashNow = scope === "GROUP" ? pos.total : pos.rows.filter(function (r) { return r.bank.entity === scope; }).reduce(function (s, r) { return s + r.balance; }, 0);
    var four = hist[hist.length - 5].cash;
    var ag = E.aging("ar", scope);
    var late = ag.buckets[3].amount + ag.buckets[4].amount;
    var soon = E.addDays(E.asOf, 30), apDue = 0, apN = 0;
    Object.values(E.apInvoices).forEach(function (i) {
      if (!app.inScope(i.entity) || ["review", "approved", "scheduled", "hold"].indexOf(i.status) < 0 || i.due > soon) return;
      apDue += app.inScopeCur(i.entity, i.amount); apN++;
    });
    return ui.kpis([
      { label: "Cash today", icon: "bank", value: E.fmt(cashNow, scope === "GROUP" ? "USD" : c, { compact: true }),
        delta: scope === "GROUP" ? ui.delta((cashNow - four) / four) : null, sub: scope === "GROUP" ? "vs 4 weeks ago" : pos.rows.filter(function (r) { return r.bank.entity === scope; }).length + " accounts",
        spark: scope === "GROUP" ? ui.charts.spark(hist.map(function (x) { return x.cash; }).concat([cashNow])) : null, onClick: function () { app.navigate("/cash"); } },
      { label: "Revenue · " + ui.period(L).slice(0, 3), icon: "report", value: E.fmt(a.revT, c, { compact: true }), delta: ui.delta(b.revT ? (a.revT - b.revT) / b.revT : null), sub: "vs " + ui.period(P),
        spark: ui.charts.spark(E.periodsBetween(E.fy + "-01", L).map(function (p) { return pl(E, scope, p, p).revT; })), onClick: function () { app.navigate("/reports?r=is"); } },
      { label: "Operating income", icon: "trend", value: E.fmt(a.oi, c, { compact: true }), delta: ui.delta(a.om - b.om, { text: ((a.om - b.om) >= 0 ? "+" : "−") + Math.abs((a.om - b.om) * 100).toFixed(1) + " pts" }), sub: ui.pct(a.om, 1) + " margin",
        onClick: function () { app.navigate("/reports?r=is"); } },
      { label: "Revenue vs plan", icon: "target", value: ui.pct(plan ? ytd.revT / plan : null, 1), delta: ui.delta(plan ? (ytd.revT - plan) / plan : null), sub: E.fmt(ytd.revT - plan, c, { compact: true, plus: true, minus: true }) + " year to date",
        onClick: function () { app.navigate("/budgets"); } },
      { label: "Receivables", icon: "receivables", value: E.fmt(ag.total, scope === "GROUP" ? "USD" : c, { compact: true }), sub: E.dso(scope) + " days DSO · " + E.fmt(late, scope === "GROUP" ? "USD" : c, { compact: true }) + " late",
        onClick: function () { app.navigate("/receivables"); } },
      { label: "Due in 30 days", icon: "payables", value: E.fmt(apDue, scope === "GROUP" ? "USD" : c, { compact: true }), sub: apN + " invoices · run " + ui.date(E.nextPaymentRun()),
        onClick: function () { app.navigate("/payables"); } }
    ]);
  }

  /* ------------------------------------------------- Home on real books
     Real books start nearly empty and fill up as people work, so nothing here
     assumes a bank, a customer, a budget or a finished close exists: each tile
     and card appears once there is something to show, and the page is never
     a wall of zeros. */
  function totals(E, scope, from, to) {
    var m = E.measure(scope, from, to), exp = 0, rev = 0;
    E.accountList.forEach(function (a) {
      if (a.ic || !m[a.id]) return;
      if (a.type === "expense") exp += m[a.id];
      else if (a.type === "revenue") rev -= m[a.id];
    });
    return { spend: exp, revenue: rev, m: m };
  }

  function liveKpis(ctx, t) {
    var E = ctx.E, app = ctx.app, scope = ctx.scope, c = app.scopeCurrency(), cp = E.currentPeriod(), first = E.fy + "-01";
    var ps = E.periodsBetween(first, cp);
    var months = ps.map(function (p) { return totals(E, scope, p, p); });
    var now = months[months.length - 1], prev = months.length > 1 ? months[months.length - 2] : null;
    var tiles = [];
    tiles.push({ label: "Spent · " + ui.period(cp).slice(0, 3), icon: "payables", value: E.fmt(now.spend, c, { compact: true }),
      delta: prev && prev.spend ? ui.delta((now.spend - prev.spend) / prev.spend, { invert: true }) : null, sub: prev && prev.spend ? "vs " + ui.period(ps[ps.length - 2]) : "so far this month",
      spark: months.length > 1 ? ui.charts.spark(months.map(function (x) { return x.spend; })) : null, onClick: function () { app.navigate("/reports?r=is"); } });
    tiles.push({ label: "Spent this year", icon: "report", value: E.fmt(t.spend, c, { compact: true }), sub: "fiscal " + E.fy + " to date", onClick: function () { app.navigate("/reports?r=is"); } });
    if (t.revenue) tiles.push({ label: "Revenue this year", icon: "trend", value: E.fmt(t.revenue, c, { compact: true }), sub: "fiscal " + E.fy + " to date", onClick: function () { app.navigate("/reports?r=is"); } });
    var charges = E.cardChargeList({ from: first }).filter(function (x) { return app.inScope("US") && x.journal; });
    if (charges.length) tiles.push({ label: "Company card", icon: "bank", value: E.fmt(E.cardSpend(null, first, cp), c, { compact: true }), sub: charges.length + " charge" + (charges.length === 1 ? "" : "s") + " this year", onClick: function () { app.navigate("/payables"); } });
    var pos = E.cashPosition();
    if (pos.rows.length) tiles.push({ label: "Cash today", icon: "bank", value: E.fmt(pos.total, "USD", { compact: true }), sub: pos.rows.length + " account" + (pos.rows.length === 1 ? "" : "s"), onClick: function () { app.navigate("/cash"); } });
    var ar = E.aging("ar", scope);
    if (ar.total) tiles.push({ label: "Receivables", icon: "receivables", value: E.fmt(ar.total, c, { compact: true }), sub: E.dso(scope) + " days DSO", onClick: function () { app.navigate("/receivables"); } });
    var ap = 0, apN = 0;
    Object.values(E.apInvoices).forEach(function (i) { if (app.inScope(i.entity) && ["review", "approved", "scheduled", "hold"].indexOf(i.status) >= 0) { ap += app.inScopeCur(i.entity, i.amount); apN++; } });
    if (apN) tiles.push({ label: "Waiting to be paid", icon: "payables", value: E.fmt(ap, c, { compact: true }), sub: apN + " invoice" + (apN === 1 ? "" : "s"), onClick: function () { app.navigate("/payables"); } });
    return ui.kpis(tiles);
  }

  function spendByMonth(ctx, o) {
    var E = ctx.E, app = ctx.app, scope = ctx.scope, c = app.scopeCurrency(), cp = E.currentPeriod();
    var ps = E.periodsBetween(E.fy + "-01", cp);
    var vals = ps.map(function (p) { return totals(E, scope, p, p).spend; });
    var chart = ui.charts.columns({ height: 230, labels: ps, prelimFrom: ps.length - 1,
      series: [{ name: "Spent", color: "var(--s1)", values: vals }],
      xFormat: function (p) { return ui.period(p).slice(0, 3); }, yFormat: function (v) { return E.fmt(v, c, { compact: true }); },
      tipFormat: function (v) { return E.fmt(v, c, { compact: true }); }, tipTitle: function (p) { return ui.period(p, true); },
      onClick: function (i) { app.navigate("/reports?r=is&p=" + ps[i]); }, label: "Spending by month" });
    return ui.card({ title: "Spending by month", meta: "Fiscal " + E.fy + " · " + app.scopeLabel(), span: (o && o.span) || 8,
      tools: ui.charts.legend([{ label: "Spent", color: "var(--s1)" }, { label: "Open month", color: "var(--s1)", kind: "hatch" }]),
      body: chart, foot: [h("span", null, "Every expense account, including the company card. Click a month for its income statement."), h("span", { class: "sp" }), ui.btn("More in Insights", { size: "sm", kind: "ghost", icon: "arrow", onClick: function () { app.navigate("/insights"); } })] });
  }

  function whereItWent(ctx, t, o) {
    var E = ctx.E, app = ctx.app, c = app.scopeCurrency();
    var rows = E.accountList.filter(function (a) { return a.type === "expense" && !a.ic && t.m[a.id] > 0; })
      .map(function (a) { return { a: a, v: t.m[a.id] }; }).sort(function (x, y) { return y.v - x.v; });
    var top = rows.length ? rows[0].v : 1, list = h("div");
    rows.slice(0, 8).forEach(function (r) {
      list.appendChild(h("button", { type: "button", class: "bva", on: { click: function () { app.open({ kind: "account", id: r.a.id, q: { entity: app.scope } }); } } },
        h("span", { class: "nm ell" }, r.a.name), ui.meter(r.v / top, { max: 1 }),
        h("span", { class: "am" }, E.fmt(r.v, c, { compact: true })),
        h("span", { class: "pc" }, ui.pct(t.spend ? r.v / t.spend : 0, 0))));
    });
    return ui.card({ title: "Where it went", meta: "Fiscal " + E.fy + " to date · by account", span: (o && o.span) || 6, body: list,
      foot: [h("span", null, rows.length > 8 ? "Top 8 of " + rows.length + " accounts" : rows.length + " account" + (rows.length === 1 ? "" : "s")), h("span", { class: "sp" }),
        ui.btn("Chart of accounts", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/ledger"); } })] });
  }

  function byVendor(ctx, o) {
    var E = ctx.E, app = ctx.app, c = app.scopeCurrency(), cp = E.currentPeriod(), by = {};
    E.linesWhere({ entity: app.scope, from: E.fy + "-01", to: cp }).forEach(function (l) {
      var a = E.accounts[l.account];
      if (!l.dims.vendor || a.type !== "expense") return;
      by[l.dims.vendor] = (by[l.dims.vendor] || 0) + app.inScopeCur(l.entity, l.amt, l.period);
    });
    var rows = Object.keys(by).map(function (id) { return { id: id, name: E.vendors[id] ? E.vendors[id].name : id, v: by[id] }; })
      .filter(function (r) { return r.v > 0; }).sort(function (x, y) { return y.v - x.v; });
    if (!rows.length) return null;
    return ui.card({ title: "Vendors", meta: "Fiscal " + E.fy + " to date", span: (o && o.span) || 6, flush: true,
      body: ui.table({ dense: true, sortable: false, onRow: function (r) { app.open({ kind: "vendor", id: r.id }); }, columns: [
        { key: "n", label: "Vendor", render: function (r) { return r.name; } },
        { key: "v", label: "Spent", num: true, render: function (r) { return E.fmt(r.v, c); } }], rows: rows.slice(0, 8) }) });
  }

  /* A short list for a company that has only just started: what to set up, each
     ticked by what the books already hold, not by a click. */
  function getStarted(ctx) {
    var E = ctx.E, app = ctx.app, hidden = false;
    try { hidden = localStorage.getItem("efm.setup.hidden") === "1"; } catch (e) { /* ignore */ }
    if (hidden) return null;
    var ent = E.entities[0], admin = E.can("company.update", app.actor()).ok, invoiceVendors = Object.values(E.vendors).some(function (v) { return !v.card; });
    var steps = [
      { t: "Set up the company", x: "Legal name, address and tax ID — they go on what you send.", done: !!(ent.legal && ent.address), go: "/settings", show: admin },
      { t: "Add a bank account", x: "Load a statement and reconcile it against the books.", done: Object.keys(E.bankAccounts).length > 0, go: "/cash" },
      { t: "Add your vendors and customers", x: "So bills and invoices are a few clicks.", done: invoiceVendors || Object.keys(E.customers).length > 0, go: "/payables?tab=vendors" },
      { t: "Bring over what you already have", x: "Import journals from another system as a CSV.", done: E.journalOrder.length > 1, action: function () { EFM.records.importJournals(); } },
      { t: "Set the budget", x: "What each department may spend, month by month.", done: Object.keys(E.budgets).length > 0, go: "/budgets", show: admin },
      { t: "Give your team access", x: "Members record and approve; read-only people just look.", done: false, go: "/settings?tab=access", show: admin && app.live, optional: true }
    ].filter(function (s) { return s.show !== false; });
    var n = steps.filter(function (s) { return s.done; }).length;
    if (steps.every(function (s) { return s.done || s.optional; })) return null;
    var list = h("div", { class: "tour-steps", style: { gridTemplateColumns: "repeat(" + Math.min(steps.length, 3) + ", minmax(0, 1fr))", display: "grid", gap: "10px" } });
    steps.forEach(function (s, i) {
      list.appendChild(h("button", { type: "button", class: "gs-step" + (s.done ? " done" : ""), on: { click: function () { if (s.action) s.action(); else app.navigate(s.go); } } },
        h("span", { class: "check" + (s.done ? " done" : "") }, s.done ? ui.icon("check") : h("span", { class: "gs-n" }, String(i + 1))), h("span", { class: "grow" }, h("b", null, s.t), h("small", null, s.x))));
    });
    return h("section", { class: "card", style: { marginBottom: "16px" }, "aria-label": "Get set up" },
      h("div", { class: "card-h" }, h("h2", null, "Get set up"), h("span", { class: "meta" }, n + " of " + steps.length + " done"),
        h("div", { class: "tools" }, ui.btn(null, { size: "sm", kind: "ghost", icon: "x", label: "Hide", onClick: function () { try { localStorage.setItem("efm.setup.hidden", "1"); } catch (e) { /* ignore */ } app.refresh(); } }))),
      h("div", { class: "card-b" }, list));
  }

  function liveHome(ctx) {
    var E = ctx.E, app = ctx.app, scope = ctx.scope, cp = E.currentPeriod();
    var page = h("div");
    page.appendChild(header(ctx));
    if (!E.journalOrder.length) {
      var gs0 = getStarted(ctx); if (gs0) page.appendChild(gs0);
      page.appendChild(ui.card({ span: 12, body: h("div", { class: "empty", style: { padding: "40px 16px" } }, ui.icon("report"), h("b", null, "Nothing has been posted yet"),
        h("div", null, "These are OploCloud's books for fiscal " + E.fy + ". Each entry is saved to the server as it is made, and every figure here can be traced back to the entry behind it."),
        h("div", { class: "row", style: { justifyContent: "center", marginTop: "14px" } },
          ui.btn("Post a journal", { kind: "primary", icon: "plus", onClick: function () { app.navigate("/journals"); } }),
          ui.btn("Payables", { onClick: function () { app.navigate("/payables"); } }))) }));
      return page;
    }
    var gs = getStarted(ctx); if (gs) page.appendChild(gs);
    var t = totals(E, scope, E.fy + "-01", cp);
    page.appendChild(liveKpis(ctx, t));
    function row(cards, gap) {
      cards = cards.filter(Boolean);
      var g = h("div", { class: "grid", style: gap ? { marginTop: "16px" } : null });
      cards.forEach(function (c) { g.appendChild(c); });
      page.appendChild(g);
    }
    row([spendByMonth(ctx, { span: 8 }), attentionCard(ctx, { span: 4 })]);
    var vendors = byVendor(ctx, { span: 6 });
    row([whereItWent(ctx, t, { span: 6 }), vendors || recentJournals(ctx, { span: 6 })], true);
    if (vendors) row([recentJournals(ctx, { span: 12 })], true);
    // What only appears once the books hold it.
    if (E.cashPosition().rows.length) row([cashChart(ctx, { span: 12 })], true);
    if (t.revenue) row([revenueChart(ctx, { span: 6 }), Object.keys(E.budgets).length ? budgetCard(ctx, { span: 6 }) : null], true);
    else if (Object.keys(E.budgets).length) row([budgetCard(ctx, { span: 12 })], true);
    if (Object.values(E.closeTasks).some(function (x) { return x.period === cp; })) row([closeCard(ctx, { span: 12, limit: 4 })], true);
    return page;
  }

  EFM.view("home", {
    title: "Home", icon: "home",
    render: function (ctx) {
      if (ctx.app.live) return liveHome(ctx);
      var page = h("div");
      page.appendChild(header(ctx));
      page.appendChild(overviewKpis(ctx));
      var g = h("div", { class: "grid" });
      g.appendChild(cashChart(ctx, { span: 8 }));
      g.appendChild(attentionCard(ctx, { span: 4 }));
      page.appendChild(g);
      g = h("div", { class: "grid", style: { marginTop: "16px" } });
      g.appendChild(revenueChart(ctx, { span: 6 }));
      g.appendChild(budgetCard(ctx, { span: 6 }));
      page.appendChild(g);
      g = h("div", { class: "grid", style: { marginTop: "16px" } });
      g.appendChild(ctx.scope === "GROUP" ? entitiesCard(ctx, { span: 8 }) : tieOutCard(ctx, { span: 8 }));
      g.appendChild(closeCard(ctx, { span: 4, limit: 3 }));
      page.appendChild(g);
      return page;
    }
  });

  // Shared with other screens.
  EFM.widgets = { attentionCard: attentionCard, cashChart: cashChart, revenueChart: revenueChart, budgetCard: budgetCard, closeCard: closeCard,
                  tieOutCard: tieOutCard, recentJournals: recentJournals, apQueue: apQueue, paymentRun: paymentRun, cashTable: cashTable,
                  controlsCard: controlsCard, sensitiveCard: sensitiveCard, entitiesCard: entitiesCard, pl: pl };
})(window);
