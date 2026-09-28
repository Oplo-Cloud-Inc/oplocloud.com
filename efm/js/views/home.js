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
    var list = h("div", { class: "att" });
    items.slice(0, o.limit || 7).forEach(function (a) {
      var b = h("button", { type: "button", class: "att-i", on: { click: function () { app.navigate(a.action.go); } } },
        ui.sev(a.sev),
        h("div", { class: "grow" }, h("div", { class: "area" }, a.area), h("div", { class: "t" }, a.title), h("div", { class: "x" }, a.detail)),
        h("div", { class: "a" }, ui.icon("chev", "sm")));
      list.appendChild(b);
    });
    if (!items.length) list.appendChild(ui.empty("All clear", "Nothing needs attention right now.", "check"));
    return ui.card({ title: o.title || "Needs attention", meta: items.length ? String(items.length) : null, flush: true, body: list, span: o.span || 4,
      tools: ui.btn("Inbox", { size: "sm", kind: "ghost", onClick: function () { app.navigate("/inbox"); } }) });
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
    return ui.card({ title: "Cash", meta: "13 weeks back · 13 ahead · all entities in USD", span: o.span || 8,
      tools: ui.charts.legend([{ label: "Actual", color: "var(--s1)", kind: "line" }, { label: "Forecast", color: "var(--s1)", kind: "dash" }]),
      body: chart,
      foot: [h("span", null, "Lowest point ahead: ", h("b", { class: "num" }, E.fmt(low.close, "USD", { compact: true })), " · week of " + ui.date(low.start)), h("span", { class: "sp" }),
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
        h("span", { class: "pc", style: { color: r.used > 1.1 ? "var(--bad)" : r.used > 1 ? "var(--warn)" : "var(--ink)" } }, ui.pct(r.used))));
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
    return ui.card({ title: "Legal entities", meta: ui.period(L, true) + ", in local currency", span: (o && o.span) || 8, body: grid,
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
      .filter(function (j) { return app.inScope(j.entity) && (j.source.type === "manual" || j.source.type === "reversal" || j.createdBy === "me" || j.status !== "posted"); })
      .reverse().slice(0, 8);
    return ui.card({ title: "Manual and recent journals", span: (o && o.span) || 6, flush: true,
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
    var E = ctx.E, app = ctx.app, L = E.lastClosedPeriod(), cp = E.currentPeriod();
    var hist = E.closeHistory[E.closeHistory.length - 1];
    return h("div", { class: "ph greet" },
      h("div", null, h("h1", null, greeting() + ", " + (app.me.firstName || "there")),
        h("p", null, ui.date(E.asOf, "long") + " · " + app.scopeLabel() + " · " + ui.period(L) + " closed " + ui.date(hist.closedAt) + " · " + ui.period(cp) + " open")),
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
      { label: "Revenue · " + ui.period(L), icon: "report", value: E.fmt(a.revT, c, { compact: true }), delta: ui.delta(b.revT ? (a.revT - b.revT) / b.revT : null), sub: "vs " + ui.period(P),
        spark: ui.charts.spark(E.periodsBetween(E.fy + "-01", L).map(function (p) { return pl(E, scope, p, p).revT; })), onClick: function () { app.navigate("/reports?r=is"); } },
      { label: "Operating income · " + ui.period(L), icon: "trend", value: E.fmt(a.oi, c, { compact: true }), delta: ui.delta(a.om - b.om, { text: ((a.om - b.om) >= 0 ? "+" : "−") + Math.abs((a.om - b.om) * 100).toFixed(1) + " pts" }), sub: ui.pct(a.om, 1) + " margin",
        onClick: function () { app.navigate("/reports?r=is"); } },
      { label: "Revenue vs plan · YTD", icon: "target", value: ui.pct(plan ? ytd.revT / plan : null, 1), delta: ui.delta(plan ? (ytd.revT - plan) / plan : null), sub: E.fmt(ytd.revT - plan, c, { compact: true, plus: true, minus: true }) + " through " + ui.period(L),
        onClick: function () { app.navigate("/budgets"); } },
      { label: "Receivables", icon: "receivables", value: E.fmt(ag.total, scope === "GROUP" ? "USD" : c, { compact: true }), sub: "DSO " + E.dso(scope) + " days · " + E.fmt(late, scope === "GROUP" ? "USD" : c, { compact: true }) + " over 60",
        onClick: function () { app.navigate("/receivables"); } },
      { label: "Payables due in 30 days", icon: "payables", value: E.fmt(apDue, scope === "GROUP" ? "USD" : c, { compact: true }), sub: apN + " invoices · run " + ui.date(E.nextPaymentRun()),
        onClick: function () { app.navigate("/payables"); } }
    ]);
  }

  EFM.view("home", {
    title: "Home", icon: "home",
    render: function (ctx) {
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
      g.appendChild(closeCard(ctx, { span: 4 }));
      page.appendChild(g);
      return page;
    }
  });

  // Shared with other screens.
  EFM.widgets = { attentionCard: attentionCard, cashChart: cashChart, revenueChart: revenueChart, budgetCard: budgetCard, closeCard: closeCard,
                  tieOutCard: tieOutCard, recentJournals: recentJournals, apQueue: apQueue, paymentRun: paymentRun, cashTable: cashTable,
                  controlsCard: controlsCard, sensitiveCard: sensitiveCard, entitiesCard: entitiesCard, pl: pl };
})(window);
