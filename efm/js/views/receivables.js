/* ==========================================================================
   OC EFM — Receivables.

   What customers owe and getting it in. The aging strip is the whole book
   at a glance and the way into it; collections is a worklist that suggests
   the next step for each late invoice; cash application turns money that
   arrived at the bank into paid invoices.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var local = { q: "", all: false };

  var BUCKETS = [
    { id: "current", label: "Current", min: -99999, max: 0 },
    { id: "1", label: "1–30 days", min: 1, max: 30 },
    { id: "31", label: "31–60 days", min: 31, max: 60 },
    { id: "61", label: "61–90 days", min: 61, max: 90 },
    { id: "91", label: "90+ days", min: 91, max: 99999 }
  ];
  function late(E, i) { return E.daysBetween(i.due, E.asOf); }
  function step(days) {
    return days > 90 ? "Escalated to collections" : days > 60 ? "Called the customer" : days > 30 ? "Second notice sent" : "Reminder sent";
  }
  function stepLabel(days) {
    return days > 90 ? "Escalate to collections" : days > 60 ? "Log a call" : days > 30 ? "Send second notice" : "Send reminder";
  }
  function statusOf(E, i) {
    if (i.balance === 0) return ui.status("paid", "Paid" + (i.payments.length ? " " + ui.date(i.payments[i.payments.length - 1].date) : ""));
    var d = late(E, i);
    if (d > 0) return ui.status("overdue", d + " days late");
    return i.status === "partial" ? ui.status("partial") : ui.status("open", "Due " + ui.date(i.due));
  }

  EFM.view("receivables", {
    title: "Receivables", icon: "receivables",
    openId: function (id) { EFM.app.open({ kind: "ar", id: id }); },
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, q = ctx.query, cur = app.scopeCurrency(), cp = E.currentPeriod();
      var tab = q.get("tab") || "invoices";
      var open = E.arOpen(app.scope);
      function v(i) { return app.inScopeCur(i.entity, i.balance, cp); }
      var total = open.reduce(function (s, i) { return s + v(i); }, 0);
      var past = open.filter(function (i) { return late(E, i) > 0; });
      var pastT = past.reduce(function (s, i) { return s + v(i); }, 0);
      var late60 = open.filter(function (i) { return late(E, i) > 60; }).reduce(function (s, i) { return s + v(i); }, 0);
      var collected = 0;
      Object.values(E.arInvoices).forEach(function (i) {
        if (!app.inScope(i.entity)) return;
        i.payments.forEach(function (p) { if (p.date.slice(0, 7) === cp) collected += app.inScopeCur(i.entity, p.amount, cp); });
      });
      var custs = {};
      open.forEach(function (i) { custs[i.customer] = 1; });

      var page = h("div");
      page.appendChild(ui.pageHead("Receivables",
        Object.keys(custs).length + " customers owe " + E.fmt(total, cur, { compact: true }) + (pastT ? " · " + E.fmt(pastT, cur, { compact: true }) + " of it past due" : ""), []));
      page.appendChild(ui.kpis([
        { label: "Receivables", icon: "receivables", value: E.fmt(total, cur, { compact: true }), sub: open.length + " open invoices" },
        { label: "Past due", icon: "calendar", value: E.fmt(pastT, cur, { compact: true }), sub: past.length + " invoices · " + ui.pct(total ? pastT / total : 0) + " of the book", onClick: function () { app.setQuery({ tab: "collections" }); } },
        { label: "Late 60+ days", icon: "alert", value: E.fmt(late60, cur, { compact: true }), sub: "the collections risk", onClick: function () { app.setQuery({ tab: null, aging: "61" }); } },
        { label: "Days sales outstanding", icon: "trend", value: E.dso(app.scope) + " days", sub: "count-back, last 3 closed months" },
        { label: "Collected in " + ui.period(cp).slice(0, 3), icon: "check", value: E.fmt(collected, cur, { compact: true }), sub: "applied to invoices" }
      ]));

      // Aging strip: the book by age, and the way into it.
      var ag = q.get("aging");
      var strip = h("div", { class: "pipeline", role: "group", "aria-label": "Receivables by age" });
      BUCKETS.forEach(function (b) {
        var list = open.filter(function (i) { var d = late(E, i); return d >= b.min && d <= b.max; });
        strip.appendChild(h("button", { type: "button", "aria-pressed": String(ag === b.id && tab === "invoices"), on: { click: function () { app.setQuery({ tab: null, aging: ag === b.id ? null : b.id }); } } },
          h("div", { class: "l" }, b.label), h("div", { class: "v" }, E.fmt(list.reduce(function (s, i) { return s + v(i); }, 0), cur, { compact: true })),
          h("div", { class: "s" }, list.length + " invoice" + (list.length === 1 ? "" : "s"))));
      });
      page.appendChild(strip);

      var unapplied = unappliedLines(E, app);
      page.appendChild(h("div", { class: "row", style: { marginBottom: "14px" } },
        ui.seg([{ id: "invoices", label: "Invoices" }, { id: "collections", label: "Collections" }, { id: "customers", label: "Customers" },
                { id: "cash", label: "Cash application" + (unapplied.length ? " · " + unapplied.length : "") }], tab,
          function (t) { app.setQuery({ tab: t === "invoices" ? null : t, aging: null }); }, { label: "Receivables views" })));

      if (tab === "collections") page.appendChild(collections(ctx, past));
      else if (tab === "customers") page.appendChild(customers(ctx, open));
      else if (tab === "cash") page.appendChild(cashApplication(ctx, unapplied));
      else page.appendChild(invoices(ctx, ag));
      return page;
    }
  });

  /* ------------------------------------------------------------ Invoices */
  function invoices(ctx, ag) {
    var E = ctx.E, app = ctx.app, cur = app.scopeCurrency(), cp = E.currentPeriod();
    var bucket = BUCKETS.filter(function (b) { return b.id === ag; })[0];
    var body = h("div");
    function draw() {
      ui.clear(body);
      var ql = local.q.toLowerCase();
      var rows = Object.values(E.arInvoices).filter(function (i) {
        if (!app.inScope(i.entity)) return false;
        if (!local.all && !bucket && i.balance === 0) return false;
        if (bucket) { if (i.balance === 0) return false; var d = late(E, i); if (d < bucket.min || d > bucket.max) return false; }
        if (ql && (E.customers[i.customer].name + " " + i.number).toLowerCase().indexOf(ql) < 0) return false;
        return true;
      });
      body.appendChild(h("div", { class: "bar" },
        ui.searchBox("Search customer or invoice", local.q, function (x) { local.q = x; draw(); var f = body.querySelector("input[type=search]"); f.focus(); }),
        bucket ? h("span", { class: "chipf", "aria-pressed": "true" }, bucket.label, h("button", { type: "button", "aria-label": "Clear", style: { color: "inherit" }, on: { click: function () { app.setQuery({ aging: null }); } } }, ui.icon("x", "sm"))) : null,
        h("span", { class: "sp" }),
        bucket ? null : ui.seg([{ id: "open", label: "Open" }, { id: "all", label: "All this year" }], local.all ? "all" : "open", function (x) { local.all = x === "all"; draw(); }),
        h("span", { class: "muted", style: { fontSize: "12.5px" } }, rows.length + " invoices")));
      body.appendChild(ui.table({ rows: rows, sortKey: local.all ? "date" : "late", sortDir: -1, limit: 250, onRow: function (i) { app.open({ kind: "ar", id: i.id }); },
        empty: ui.empty("Nothing here", bucket ? "No open invoices are " + bucket.label.toLowerCase() + " late." : "Every invoice is paid.", "check"),
        columns: [
          { key: "c", label: "Customer", cls: "two", sort: function (i) { return E.customers[i.customer].name; }, render: function (i) {
            return h("span", null, E.customers[i.customer].name, h("span", { class: "sub" }, i.number + " · " + { annual: "annual", monthly: "monthly", usage: "usage" }[i.kind])); } },
          app.scope === "GROUP" ? { key: "e", label: "Entity", sort: function (i) { return i.entity; }, render: function (i) { return E.entity[i.entity].short; } } : null,
          { key: "date", label: "Issued", sort: function (i) { return i.date; }, render: function (i) { return ui.date(i.date); } },
          { key: "late", label: "Status", sort: function (i) { return i.balance ? late(E, i) : -9999; }, render: function (i) { return statusOf(E, i); } },
          { key: "amount", label: "Amount", num: true, sort: function (i) { return app.inScopeCur(i.entity, i.amount, cp); }, render: function (i) { return E.fmt(i.amount, E.entity[i.entity].currency); } },
          { key: "bal", label: "Balance", num: true, sort: function (i) { return app.inScopeCur(i.entity, i.balance, cp); }, render: function (i) { return i.balance ? h("b", null, E.fmt(i.balance, E.entity[i.entity].currency)) : h("span", { class: "faint" }, "—"); } }
        ].filter(Boolean) }));
    }
    draw();
    return ui.card({ flush: true, body: body });
  }

  /* ---------------------------------------------------------- Collections */
  function collections(ctx, past) {
    var E = ctx.E, app = ctx.app, cur = app.scopeCurrency(), cp = E.currentPeriod();
    var by = {};
    past.forEach(function (i) { (by[i.customer] = by[i.customer] || []).push(i); });
    var groups = Object.keys(by).map(function (c) {
      var list = by[c].sort(function (a, b) { return late(E, b) - late(E, a); });
      return { c: E.customers[c], list: list, total: list.reduce(function (s, i) { return s + app.inScopeCur(i.entity, i.balance, cp); }, 0), worst: late(E, list[0]) };
    }).sort(function (a, b) { return b.worst - a.worst || b.total - a.total; });
    if (!groups.length) return ui.card({ body: ui.empty("Nobody is late", "Every open invoice is inside its terms.", "check") });

    var wrap = h("div", { class: "stack", style: { gap: "12px" } });
    wrap.appendChild(h("p", { class: "note" }, "Late invoices, worst first. The next step follows the policy: a reminder in the first month, a second notice after 30 days, a call after 60, collections after 90. Each step is logged on the invoice."));
    groups.forEach(function (g) {
      var c = g.c, cc = E.entity[c.entity].currency;
      var paid = Object.values(E.arInvoices).filter(function (i) { return i.customer === c.id && i.payments.length; });
      var avg = paid.length ? Math.round(paid.reduce(function (s, i) { return s + E.daysBetween(i.due, i.payments[i.payments.length - 1].date); }, 0) / paid.length) : null;
      var rows = h("div");
      g.list.forEach(function (i) {
        var d = late(E, i), last = i.collections[i.collections.length - 1];
        rows.appendChild(h("div", { class: "rc-row" },
          h("button", { type: "button", class: "rc-inv", on: { click: function () { app.open({ kind: "ar", id: i.id }); } } },
            h("span", { class: "mono" }, i.number), h("span", { class: "muted" }, " · issued " + ui.date(i.date) + " · due " + ui.date(i.due))),
          h("span", { class: "rc-late " + (d > 60 ? "neg" : "") }, d + " days late"),
          h("span", { class: "rc-last muted" }, last ? last.action + " " + ui.date(last.date) : "No contact logged"),
          h("b", { class: "num rc-amt" }, E.fmt(i.balance, cc)),
          ui.gated("ar.collect", {}, stepLabel(d), function () {
            app.run("ar.remind", { invoice: i.id, step: step(d) }, { ok: step(d) + " — logged on " + i.number + "." });
          }, { size: "sm", kind: d > 60 ? "primary" : null })));
      });
      wrap.appendChild(ui.card({ title: c.name, meta: E.fmt(g.total, cur, { compact: true }) + " late · " + (avg == null ? "no payment history" : avg <= 0 ? "usually pays on time" : "usually pays " + avg + " days late") + (app.scope === "GROUP" ? " · " + E.entity[c.entity].short : ""),
        tools: ui.btn("Customer", { size: "sm", kind: "ghost", onClick: function () { app.open({ kind: "customer", id: c.id }); } }), body: rows }));
    });
    return wrap;
  }

  /* ------------------------------------------------------------ Customers */
  function customers(ctx, open) {
    var E = ctx.E, app = ctx.app, cur = app.scopeCurrency(), cp = E.currentPeriod();
    var rows = Object.values(E.customers).filter(function (c) { return app.inScope(c.entity); }).map(function (c) {
      var mine = open.filter(function (i) { return i.customer === c.id; });
      var bal = mine.reduce(function (s, i) { return s + i.balance; }, 0);
      var paid = Object.values(E.arInvoices).filter(function (i) { return i.customer === c.id && i.payments.length; });
      var avg = paid.length ? Math.round(paid.reduce(function (s, i) { return s + E.daysBetween(i.due, i.payments[i.payments.length - 1].date); }, 0) / paid.length) : null;
      return { c: c, bal: bal, used: c.creditLimit ? bal / c.creditLimit : 0, avg: avg, n: mine.length };
    });
    var body = h("div");
    function draw() {
      ui.clear(body);
      var ql = (local.cq || "").toLowerCase();
      var list = rows.filter(function (r) { return !ql || (r.c.name + " " + r.c.segment).toLowerCase().indexOf(ql) >= 0; });
      var over = list.filter(function (r) { return r.used > 1; }).length;
      body.appendChild(h("div", { class: "bar" }, ui.searchBox("Search customers", local.cq, function (x) { local.cq = x; draw(); body.querySelector("input[type=search]").focus(); }),
        h("span", { class: "sp" }), over ? ui.tag(over + " over credit limit", "bad") : null, h("span", { class: "muted", style: { fontSize: "12.5px" } }, list.length + " customers")));
      body.appendChild(ui.table({ rows: list, sortKey: "bal", sortDir: -1, onRow: function (r) { app.open({ kind: "customer", id: r.c.id }); }, columns: [
        { key: "n", label: "Customer", cls: "two", sort: function (r) { return r.c.name; }, render: function (r) {
          return h("span", null, r.c.name, h("span", { class: "sub" }, r.c.segment + " · " + E.dimName("product", r.c.product) + (app.scope === "GROUP" ? " · " + E.entity[r.c.entity].short : ""))); } },
        { key: "t", label: "Terms", render: function (r) { return "Net " + r.c.terms; } },
        { key: "used", label: "Credit used", sort: function (r) { return r.used; }, render: function (r) {
          return h("span", { class: "row", style: { gap: "10px" } }, h("span", { style: { width: "110px", display: "inline-block" } }, ui.meter(r.used, { max: Math.max(1.2, r.used), mark: 1 })),
            h("span", { class: "num", style: { fontSize: "12px", color: r.used > 1 ? "var(--bad)" : "var(--ink-3)" } }, ui.pct(r.used))); } },
        { key: "avg", label: "Pays", sort: function (r) { return r.avg == null ? -999 : r.avg; }, render: function (r) { return r.avg == null ? h("span", { class: "faint" }, "—") : r.avg <= 0 ? "On time" : h("span", { class: r.avg > 30 ? "neg" : "" }, r.avg + " days late"); } },
        { key: "lim", label: "Limit", num: true, sort: function (r) { return app.inScopeCur(r.c.entity, r.c.creditLimit, cp); }, render: function (r) { return E.fmt(r.c.creditLimit, E.entity[r.c.entity].currency, { dp: 0 }); } },
        { key: "bal", label: "Owes", num: true, sort: function (r) { return app.inScopeCur(r.c.entity, r.bal, cp); }, render: function (r) { return r.bal ? h("b", null, E.fmt(r.bal, E.entity[r.c.entity].currency, { dp: 0 })) : h("span", { class: "faint" }, "—"); } }
      ] }));
    }
    draw();
    return ui.card({ flush: true, body: body });
  }

  /* ------------------------------------------------------ Cash application */
  function unappliedLines(E, app) {
    var out = [];
    Object.values(E.bankAccounts).forEach(function (b) {
      if (!app.inScope(b.entity)) return;
      var rec = E.reconciliation(b.id);
      rec.bankOpen.forEach(function (l) { if (l.amount > 0 && l.suggestion && l.suggestion.kind === "ar") out.push({ line: l, bank: b }); });
    });
    return out;
  }
  function cashApplication(ctx, list) {
    var E = ctx.E, app = ctx.app;
    var wrap = h("div");
    wrap.appendChild(h("p", { class: "note", style: { marginBottom: "12px" } }, "Money that reached the bank with no posting behind it yet, matched to the open invoice it most likely pays. Applying posts the receipt, clears the invoice and reconciles the bank line in one step."));
    if (!list.length) { wrap.appendChild(ui.card({ body: ui.empty("Nothing to apply", "Every customer payment at the bank is on an invoice.", "check") })); return wrap; }
    wrap.appendChild(ui.card({ flush: true, body: ui.table({ rows: list, sortable: false, columns: [
      { key: "d", label: "Received", render: function (r) { return ui.date(r.line.date); } },
      { key: "b", label: "Bank", cls: "two", render: function (r) { return h("span", null, r.line.desc, h("span", { class: "sub" }, r.bank.bankName + " " + r.bank.name + " " + r.bank.mask)); } },
      { key: "m", label: "Looks like", cls: "two", render: function (r) {
        var inv = E.arInvoices[r.line.suggestion.invoice];
        return h("button", { type: "button", class: "rc-inv", on: { click: function () { app.open({ kind: "ar", id: inv.id }); } } },
          h("span", null, E.customers[inv.customer].name), h("span", { class: "sub" }, inv.number + " · due " + ui.date(inv.due) + " · " + (r.line.suggestion.confidence === "high" ? "exact amount, name on the wire" : "exact amount"))); } },
      { key: "a", label: "Amount", num: true, render: function (r) { return h("b", null, E.fmt(r.line.amount, E.entity[r.bank.entity].currency)); } },
      { key: "x", label: "", render: function (r) {
        return ui.gated("ar.apply", {}, "Apply", function () {
          app.run("ar.apply", { invoice: r.line.suggestion.invoice, bankLine: r.line.id }, { ok: function (res) { return "Applied to " + res.invoice.number + " · " + res.journal.id + " posted, bank line reconciled."; } });
        }, { size: "sm", kind: "primary" }); } }
    ] }) }));
    return wrap;
  }
})(window);
