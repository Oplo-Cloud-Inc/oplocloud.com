/* ==========================================================================
   OC EFM — Budgets.

   The fiscal 2026 plan against what was spent, department by department.
   The overview says who is over; a department's page says where and why —
   by account, by month, and by the vendors behind the change. Budget control
   lives here too: the policy, and the exceptions waiting for a decision.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;

  function expenseAccounts(E) {
    return E.accountList.filter(function (a) { return a.type === "expense" && !a.ic && a.group !== "other" && a.group !== "tax"; }).map(function (a) { return a.id; });
  }
  function tone(used) { return used > 1.1 ? "bad" : used > 1 ? "warn" : ""; }
  function pctColor(used) { return used > 1.1 ? "var(--bad)" : used > 1 ? "var(--warn)" : "var(--ink)"; }

  EFM.view("budgets", {
    title: "Budgets", icon: "target",
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, q = ctx.query, cur = app.scopeCurrency();
      var range = q.get("range") || "closed";
      var L = E.lastClosedPeriod(), cp = E.currentPeriod();
      var to = range === "closed" ? L : cp;
      var from = E.fy + "-01";
      var rangeText = range === "closed" ? "January through " + ui.period(L, true) + " (closed)" : range === "ytd" ? "January through " + ui.period(cp, true) + " (September is preliminary)" : "Year to date against the full-year budget";

      var page = h("div");
      var dept = q.get("dept");
      var d = dept && E.dims.dept.filter(function (x) { return x.id === dept; })[0];
      page.appendChild(ui.pageHead(d ? d.name : "Budgets", d ? "Spending against the fiscal " + E.fy + " plan · " + app.scopeLabel() : "The fiscal " + E.fy + " plan, set in December, against what was spent · " + app.scopeLabel(),
        d ? [ui.btn("All departments", { icon: "back", onClick: function () { app.setQuery({ dept: null }); } })] : []));
      page.appendChild(h("div", { class: "filters" },
        ui.seg([{ id: "closed", label: "Through " + ui.period(L).slice(0, 3) + " (closed)" }, { id: "ytd", label: "Through " + ui.period(cp).slice(0, 3) + " (preliminary)" }, { id: "fy", label: "Full year" }], range,
          function (v) { app.setQuery({ range: v === "closed" ? null : v }); }, { label: "Range" }),
        h("span", { class: "muted", style: { fontSize: "12.5px" } }, rangeText)));

      var rows = E.budgetVsActual(app.scope, from, to);
      if (range === "fy") rows.forEach(function (r) { r.budget = r.fullYear; r.variance = r.actual - r.budget; r.used = r.budget ? r.actual / r.budget : 0; });
      if (d) page.appendChild(detail(ctx, d, rows.filter(function (r) { return r.dept.id === d.id; })[0], from, to, range));
      else page.appendChild(overview(ctx, rows, from, to, range));
      return page;
    }
  });

  /* ------------------------------------------------------------ Overview */
  function overview(ctx, rows, from, to, range) {
    var E = ctx.E, app = ctx.app, cur = app.scopeCurrency();
    var bud = rows.reduce(function (s, r) { return s + r.budget; }, 0), act = rows.reduce(function (s, r) { return s + r.actual; }, 0);
    var over = rows.filter(function (r) { return r.used > 1; });
    var wrap = h("div");
    wrap.appendChild(ui.kpis([
      { label: range === "fy" ? "Full-year budget" : "Budget", icon: "target", value: E.fmt(bud, cur, { compact: true }), sub: "operating expenses and cost of revenue" },
      { label: "Actual", icon: "report", value: E.fmt(act, cur, { compact: true }), sub: "posted to the ledger" },
      { label: range === "fy" ? "Remaining" : "Variance", icon: "trend", value: E.fmt(range === "fy" ? bud - act : act - bud, cur, { compact: true, plus: range !== "fy", minus: true }),
        sub: range === "fy" ? "left to spend this year" : act > bud ? "over budget" : "under budget" },
      { label: "Used", icon: "check", value: ui.pct(bud ? act / bud : 0, 1), sub: range === "fy" ? "of the year's budget" : "of budget for the period" },
      { label: "Departments over", icon: "alert", value: String(over.length), sub: over.length ? over.map(function (r) { return r.dept.name; }).join(", ") : "every department within budget" }
    ]));

    var sorted = rows.slice().sort(function (a, b) { return b.used - a.used; });
    wrap.appendChild(ui.card({ title: "By department", meta: "click a department to see where the money went", flush: true,
      body: ui.table({ rows: sorted, sortable: false, onRow: function (r) { ctx.app.setQuery({ dept: r.dept.id }); }, columns: [
        { key: "d", label: "Department", render: function (r) { return h("b", { style: { fontWeight: "550" } }, r.dept.name); } },
        { key: "b", label: range === "fy" ? "Full-year budget" : "Budget", num: true, render: function (r) { return E.fmt(r.budget, cur, { dp: 0 }); } },
        { key: "a", label: "Actual", num: true, render: function (r) { return E.fmt(r.actual, cur, { dp: 0 }); } },
        { key: "v", label: range === "fy" ? "Remaining" : "Variance", num: true, render: function (r) {
          var v = range === "fy" ? r.budget - r.actual : r.variance;
          return h("span", { class: range !== "fy" && v > 0 ? "neg" : "" }, E.fmt(v, cur, { dp: 0, plus: range !== "fy", minus: true })); } },
        { key: "m", label: "", render: function (r) { return h("span", { style: { display: "inline-block", width: "160px" } }, ui.meter(r.used, { max: range === "fy" ? 1 : 1.25, mark: range === "fy" ? null : 1, tone: range === "fy" ? "" : tone(r.used) })); } },
        { key: "p", label: "Used", num: true, render: function (r) { return h("b", { style: { color: range === "fy" ? "var(--ink)" : pctColor(r.used) } }, ui.pct(r.used, 1)); } },
        range === "fy" ? null : { key: "f", label: "Full year", num: true, render: function (r) { return E.fmt(r.fullYear, cur, { compact: true }); } }
      ].filter(Boolean), foot: ["Total", E.fmt(bud, cur, { dp: 0 }), E.fmt(act, cur, { dp: 0 }), E.fmt(range === "fy" ? bud - act : act - bud, cur, { dp: 0, plus: range !== "fy", minus: true }), "", ui.pct(bud ? act / bud : 0)].concat(range === "fy" ? [] : [E.fmt(rows.reduce(function (s, r) { return s + r.fullYear; }, 0), cur, { compact: true })]) }) }));

    var g = h("div", { class: "grid", style: { marginTop: "16px" } });
    g.appendChild(revenueCard(ctx));
    g.appendChild(controlCard(ctx, null));
    wrap.appendChild(g);
    return wrap;
  }

  function revenueCard(ctx) {
    var E = ctx.E, app = ctx.app, cur = app.scopeCurrency(), cp = E.currentPeriod();
    var months = E.fyPeriods();
    var act = months.map(function (p) { return p <= cp ? -E.actualFor(app.scope, null, ["4000", "4100", "4200"], p, p) : null; });
    var plan = months.map(function (p) { return -E.budgetFor(app.scope, "REV", ["4000", "4100", "4200"], p, p); });
    var L = E.lastClosedPeriod(), ai = months.indexOf(L);
    var ytdA = act.slice(0, ai + 1).reduce(function (s, v) { return s + v; }, 0), ytdP = plan.slice(0, ai + 1).reduce(function (s, v) { return s + v; }, 0);
    var fyP = plan.reduce(function (s, v) { return s + v; }, 0);
    return ui.card({ title: "Revenue against plan", meta: "the other side of the budget", span: 7,
      tools: ui.charts.legend([{ label: "Actual", color: "var(--s1)" }, { label: "Plan", color: "var(--ink)", kind: "line" }]),
      body: ui.charts.columns({ height: 210, labels: months, series: [{ name: "Revenue", color: "var(--s1)", values: act }], marks: { name: "Plan", values: plan },
        prelimFrom: months.indexOf(cp), xFormat: function (p) { return ui.period(p).slice(0, 3); }, yFormat: function (v) { return E.fmt(v, cur, { compact: true }); },
        tipFormat: function (v) { return E.fmt(v, cur, { compact: true }); }, tipTitle: function (p) { return ui.period(p, true); }, label: "Revenue by month against plan" }),
      foot: [h("span", null, "Through " + ui.period(L) + ": ", h("b", { class: "num" }, E.fmt(ytdA, cur, { compact: true })), " against ", h("b", { class: "num" }, E.fmt(ytdP, cur, { compact: true })), " · ",
        ui.delta(ytdP ? (ytdA - ytdP) / ytdP : null), " · full-year plan " + E.fmt(fyP, cur, { compact: true }))] });
  }

  /* Budget control: the policy, and the exceptions waiting on a decision. */
  function controlCard(ctx, deptId) {
    var E = ctx.E, app = ctx.app;
    var ex = Object.values(E.exceptions).filter(function (x) {
      return (!deptId || x.dept === deptId) && (!x.ap || !E.apInvoices[x.ap] || app.inScope(E.apInvoices[x.ap].entity));
    });
    var body = h("div");
    body.appendChild(h("div", { class: "bg-policy" },
      h("div", null, h("b", null, "Under 80%"), "Approved automatically"), h("div", null, h("b", null, "80–100%"), "Approved, with a warning"),
      h("div", null, h("b", null, "100–110%"), "Needs a manager"), h("div", null, h("b", { style: { color: "var(--bad)" } }, "Over 110%"), "Needs the CFO")));
    body.appendChild(h("p", { class: "note", style: { margin: "12px 0 6px" } }, "Checked against the department's budget for the year to date whenever an invoice or purchase order would spend against it."));
    if (!ex.length) body.appendChild(h("p", { class: "muted", style: { fontSize: "13px" } }, "No exceptions waiting."));
    ex.forEach(function (x) {
      var inv = E.apInvoices[x.ap];
      var box = h("div", { class: "flag" + (x.status === "open" ? "" : " done"), style: { marginTop: "10px", marginBottom: "0" } },
        ui.sev(x.status === "open" ? "serious" : "info"),
        h("div", { class: "grow" }, h("div", { class: "t" }, x.title + (x.status === "open" ? "" : " — " + x.status)),
          h("div", { class: "x" }, x.status === "open" ? x.detail : (x.status === "approved" ? "Approved" : "Declined") + " by " + ui.person(x.decidedBy).name + " · " + ui.time(x.decidedAt) + (x.note ? " — “" + x.note + "”" : "")),
          x.status === "open" ? h("div", { class: "acts" },
            ui.gated("budget.approve", {}, "Approve the exception", function () {
              ui.ask({ title: "Approve over budget?", text: x.detail, label: "Why it's worth it", placeholder: "e.g. the launch was brought forward from Q4; Q4 events will be cut to match", confirmLabel: "Approve" })
                .then(function (n) { if (n) app.run("budget.decide", { id: x.id, approve: true, note: n }, { ok: "Exception approved. The invoice can now be approved in Payables." }); });
            }, { size: "sm", kind: "primary" }),
            ui.gated("budget.approve", {}, "Decline", function () {
              ui.ask({ title: "Decline the exception?", label: "Reason", placeholder: "e.g. fund it from the Q4 events budget instead", confirmLabel: "Decline", danger: true })
                .then(function (n) { if (n) app.run("budget.decide", { id: x.id, approve: false, note: n }, { ok: "Exception declined." }); });
            }, { size: "sm" }),
            inv ? ui.btn("Open " + inv.number, { size: "sm", kind: "ghost", onClick: function () { app.open({ kind: "ap", id: inv.id }); } }) : null) : null));
      body.appendChild(box);
    });
    return ui.card({ title: "Budget control", meta: ex.filter(function (x) { return x.status === "open"; }).length + " waiting", span: deptId ? 5 : 5, body: body });
  }

  /* ---------------------------------------------------------- Department */
  function detail(ctx, d, row, from, to, range) {
    var E = ctx.E, app = ctx.app, cur = app.scopeCurrency(), cp = E.currentPeriod(), L = E.lastClosedPeriod();
    var accts = expenseAccounts(E);
    var wrap = h("div");
    wrap.appendChild(ui.kpis([
      { label: range === "fy" ? "Full-year budget" : "Budget", icon: "target", value: E.fmt(row.budget, cur, { compact: true }), sub: E.fmt(row.fullYear, cur, { compact: true }) + " for the year" },
      { label: "Actual", icon: "report", value: E.fmt(row.actual, cur, { compact: true }), sub: "posted to the ledger" },
      { label: range === "fy" ? "Remaining" : "Variance", icon: "trend", value: E.fmt(range === "fy" ? row.budget - row.actual : row.variance, cur, { compact: true, plus: range !== "fy", minus: true }), sub: row.variance > 0 && range !== "fy" ? "over budget" : "within budget" },
      { label: "Used", icon: "check", value: ui.pct(row.used, 1), sub: row.used > 1.1 ? "past the CFO threshold" : row.used > 1 ? "needs manager approval to spend more" : row.used > 0.8 ? "in the warning band" : "comfortably within" }
    ]));

    var months = E.fyPeriods();
    var act = months.map(function (p) { return p <= cp ? E.actualFor(app.scope, d.id, accts, p, p) : null; });
    var bud = months.map(function (p) { return E.budgetFor(app.scope, d.id, accts, p, p); });
    var g = h("div", { class: "grid" });
    g.appendChild(ui.card({ title: "By month", meta: "actual against the monthly budget", span: 7,
      tools: ui.charts.legend([{ label: "Actual", color: "var(--s1)" }, { label: "Budget", color: "var(--ink)", kind: "line" }, { label: "Open month", color: "var(--s1)", kind: "hatch" }]),
      body: ui.charts.columns({ height: 230, labels: months, series: [{ name: "Actual", color: "var(--s1)", values: act }], marks: { name: "Budget", values: bud }, prelimFrom: months.indexOf(cp),
        xFormat: function (p) { return ui.period(p).slice(0, 3); }, yFormat: function (v) { return E.fmt(v, cur, { compact: true }); }, tipFormat: function (v) { return E.fmt(v, cur, { compact: true }); },
        tipTitle: function (p) { return ui.period(p, true); }, onClick: function (i) {
          if (months[i] <= cp) app.open({ kind: "lines", id: "bg-" + d.id + months[i], q: { entity: app.scope, accounts: accts, dept: d.id, from: months[i], to: months[i], title: d.name + " · " + ui.period(months[i]) } });
        }, label: d.name + " spending by month" }) }));

    // What changed between the last two closed months, by vendor.
    var prev = E.addMonths(L, -1);
    var drv = E.drivers(app.scope, accts, d.id, prev, prev, L, L).filter(function (x) { return x.change; }).slice(0, 7);
    var a0 = E.actualFor(app.scope, d.id, accts, prev, prev), a1 = E.actualFor(app.scope, d.id, accts, L, L);
    g.appendChild(ui.card({ title: "What changed", meta: ui.period(prev) + " → " + ui.period(L) + ": " + E.fmt(a1 - a0, cur, { compact: true, plus: true, minus: true }), span: 5,
      body: drv.length ? h("ul", { class: "bg-drivers" }, drv.map(function (x) {
        return h("li", null, h("span", { class: "n" }, x.name), h("span", { class: "muted num", style: { fontSize: "12px" } }, E.fmt(x.before, cur, { compact: true }) + " → " + E.fmt(x.after, cur, { compact: true })),
          h("span", { class: "v " + (x.change > 0 ? "neg" : "pos") }, E.fmt(x.change, cur, { compact: true, plus: true, minus: true })));
      })) : ui.empty("No change", "Spending was the same in both months.", "check"),
      foot: [h("span", null, "By vendor where the line names one; payroll and accruals by their source.")] }));
    wrap.appendChild(g);

    var byAcct = row.byAccount.slice().sort(function (a, b) { return (b.actual - b.budget) - (a.actual - a.budget); });
    var g2 = h("div", { class: "grid", style: { marginTop: "16px" } });
    g2.appendChild(ui.card({ title: "By account", meta: "click a row for the ledger lines", flush: true, span: 7,
      body: ui.table({ rows: byAcct, sortable: false, onRow: function (r) {
        app.open({ kind: "lines", id: "bga-" + d.id + r.account, q: { entity: app.scope, accounts: [r.account], dept: d.id, from: from, to: to, title: d.name + " · " + E.accounts[r.account].name } });
      }, columns: [
        { key: "a", label: "Account", render: function (r) { return h("span", { class: "row" }, h("span", { class: "mono muted" }, r.account), E.accounts[r.account].name); } },
        { key: "b", label: "Budget", num: true, render: function (r) { return E.fmt(r.budget, cur, { dp: 0 }); } },
        { key: "c", label: "Actual", num: true, render: function (r) { return E.fmt(r.actual, cur, { dp: 0 }); } },
        { key: "v", label: "Variance", num: true, render: function (r) { var v = r.actual - r.budget; return h("span", { class: v > 0 ? "neg" : "" }, E.fmt(v, cur, { dp: 0, plus: true, minus: true })); } },
        { key: "p", label: "Used", num: true, render: function (r) { return r.budget ? h("span", { style: { color: pctColor(r.actual / r.budget) } }, ui.pct(r.actual / r.budget, 1)) : h("span", { class: "faint" }, "unbudgeted"); } }
      ] }) }));
    g2.appendChild(controlCard(ctx, d.id));
    wrap.appendChild(g2);
    return wrap;
  }
})(window);
