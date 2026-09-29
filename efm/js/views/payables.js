/* ==========================================================================
   OC EFM — Payables.

   Every vendor invoice from capture to payment. The status strip across the
   top is the pipeline; exceptions sit above the list because they are the
   only invoices that need judgment; everything else can be approved in bulk.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;

  // Filters that change on every keystroke live here, not in the address,
  // so typing redraws only the list.
  var local = { q: "", sel: {} };

  var STAGES = [
    { id: "review", label: "Awaiting approval", match: function (i) { return i.status === "review" || i.status === "captured"; } },
    { id: "exceptions", label: "Exceptions", match: function (i) { return i.status !== "rejected" && i.status !== "paid" && unresolved(i).length > 0; } },
    { id: "approved", label: "Approved", match: function (i) { return i.status === "approved"; } },
    { id: "scheduled", label: "Scheduled", match: function (i) { return i.status === "scheduled"; } },
    { id: "paid", label: "Paid this month", match: function (i, E) { return i.status === "paid" && i.paidAt && i.paidAt.slice(0, 7) === E.currentPeriod(); } },
    { id: "hold", label: "On hold", match: function (i) { return i.status === "hold"; } }
  ];
  // What needs doing sorts first: waiting, held, approved, scheduled, then done.
  var RANK = { captured: "0", review: "0", hold: "1", approved: "2", scheduled: "3", paid: "4", rejected: "5" };
  function unresolved(i) { return (i.flags || []).filter(function (f) { return !f.resolved; }); }
  function blocking(i) { return unresolved(i).filter(function (f) { return f.blocking; }); }

  EFM.view("payables", {
    title: "Payables", icon: "payables",
    openId: function (id) { EFM.app.open({ kind: "ap", id: id }); },
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, q = ctx.query;
      var tab = q.get("tab") || "invoices";
      var cur = app.scopeCurrency();
      var all = Object.values(E.apInvoices).filter(function (i) { return app.inScope(i.entity); });
      function inScope(i) { return app.inScopeCur(i.entity, i.amount, E.currentPeriod()); }
      function total(list) { return list.reduce(function (s, i) { return s + inScope(i); }, 0); }

      var page = h("div");
      var waiting = all.filter(STAGES[0].match);
      page.appendChild(ui.pageHead("Payables",
        waiting.length ? waiting.length + " invoice" + (waiting.length === 1 ? "" : "s") + " waiting for approval · next payment run " + ui.date(E.nextPaymentRun(), "long")
                       : "Every vendor invoice, from capture to payment.",
        [ui.btn("Payment run", { icon: "calendar", onClick: function () { app.setQuery({ tab: "run", status: null }); } })]));

      /* ---- The pipeline */
      var status = q.get("status") || (q.get("flag") ? "exceptions" : null);
      var strip = h("div", { class: "pipeline", role: "group", "aria-label": "Invoices by stage" });
      STAGES.forEach(function (st) {
        var list = all.filter(function (i) { return st.match(i, E); });
        strip.appendChild(h("button", { type: "button", "aria-pressed": String(status === st.id && tab === "invoices"),
          on: { click: function () { app.setQuery({ tab: null, flag: null, status: status === st.id ? null : st.id }); } } },
          h("div", { class: "l" }, st.label), h("div", { class: "v" }, String(list.length)), h("div", { class: "s" }, E.fmt(total(list), cur, { compact: true }))));
      });
      page.appendChild(strip);

      page.appendChild(h("div", { class: "row", style: { marginBottom: "14px" } },
        ui.seg([{ id: "invoices", label: "Invoices" }, { id: "run", label: "Payment run" }, { id: "cards", label: "Card charges" }, { id: "aging", label: "Aging" }, { id: "vendors", label: "Vendors" }], tab,
          function (t) { app.setQuery({ tab: t === "invoices" ? null : t }); }, { label: "Payables views" })));

      if (tab === "run") page.appendChild(paymentRun(ctx, all));
      else if (tab === "cards") page.appendChild(cards(ctx));
      else if (tab === "aging") page.appendChild(aging(ctx));
      else if (tab === "vendors") page.appendChild(vendors(ctx, all));
      else page.appendChild(invoices(ctx, all, status));
      return page;
    }
  });

  /* ------------------------------------------------------------ Invoices */
  function invoices(ctx, all, status) {
    var E = ctx.E, app = ctx.app, q = ctx.query;
    var wrap = h("div");
    var vendorF = q.get("vendor");

    // Exceptions first: the only invoices that need a person's judgment.
    var flagged = all.filter(STAGES[1].match);
    if (flagged.length && status !== "exceptions" && !vendorF) {
      var list = h("div", { class: "att" });
      flagged.forEach(function (i) {
        unresolved(i).forEach(function (f) {
          list.appendChild(h("button", { type: "button", class: "att-i", on: { click: function () { app.open({ kind: "ap", id: i.id }); } } },
            ui.sev(f.sev || "serious"),
            h("div", { class: "grow" }, h("div", { class: "t" }, f.title + " — " + E.vendors[i.vendor].name),
              h("div", { class: "x" }, i.number + " · " + E.entity[i.entity].short + " · " + f.detail)),
            h("div", { class: "a" }, h("span", { class: "amt" }, E.fmt(i.amount, i.currency)), ui.icon("chev", "sm"))));
        });
      });
      wrap.appendChild(h("div", { style: { marginBottom: "16px" } },
        ui.card({ title: "Exceptions", meta: flagged.length + " invoice" + (flagged.length === 1 ? "" : "s") + " need a decision before they can be paid", flush: true, body: list })));
    }

    var body = h("div");
    var card = ui.card({ flush: true, body: body });
    wrap.appendChild(card);

    function rows() {
      var st = STAGES.filter(function (s) { return s.id === status; })[0];
      var ql = local.q.toLowerCase();
      return all.filter(function (i) {
        if (vendorF && i.vendor !== vendorF) return false;
        if (st && !st.match(i, E)) return false;
        if (!st && !vendorF && i.status === "paid" && i.paidAt < E.addDays(E.asOf, -45)) return false;
        if (ql && (E.vendors[i.vendor].name + " " + i.number + " " + i.id).toLowerCase().indexOf(ql) < 0) return false;
        return true;
      });
    }
    function eligible(i) { return (i.status === "review" || i.status === "captured") && !blocking(i).length && !unresolved(i).some(function (f) { return f.code === "bank"; }); }

    function draw() {
      ui.clear(body);
      var list = rows();
      var bar = h("div", { class: "bar" },
        ui.searchBox("Search vendor or invoice number", local.q, function (v) { local.q = v; draw(); focusSearch(); }),
        vendorF ? h("span", { class: "chipf", "aria-pressed": "true" }, E.vendors[vendorF].name,
          h("button", { type: "button", "aria-label": "Clear vendor filter", style: { color: "inherit" }, on: { click: function () { app.setQuery({ vendor: null }); } } }, ui.icon("x", "sm"))) : null,
        status || vendorF ? ui.btn("Show all", { size: "sm", kind: "ghost", onClick: function () { app.setQuery({ status: null, vendor: null, flag: null }); } }) : null,
        h("span", { class: "sp" }),
        h("span", { class: "muted", style: { fontSize: "12.5px" } }, list.length + " invoice" + (list.length === 1 ? "" : "s") + (!status && !vendorF ? " · paid invoices older than 45 days hidden" : "")));
      body.appendChild(bar);

      var picked = Object.keys(local.sel).filter(function (id) { return local.sel[id] && E.apInvoices[id] && eligible(E.apInvoices[id]); });
      if (picked.length) {
        var sum = picked.reduce(function (s, id) { return s + E.usdOf(E.apInvoices[id].entity, E.apInvoices[id].amount, E.currentPeriod(), "close"); }, 0);
        body.appendChild(h("div", { class: "bulk" }, h("b", null, picked.length + " selected"), h("span", { class: "muted" }, E.fmt(sum, "USD") + " in USD"),
          h("span", { class: "sp", style: { flex: "1" } }),
          ui.btn("Clear", { size: "sm", kind: "ghost", onClick: function () { local.sel = {}; draw(); } }),
          ui.btn("Approve " + picked.length, { size: "sm", kind: "primary", icon: "check", onClick: function () { approveMany(ctx, picked); } })));
      }
      var anyEligible = list.some(eligible);
      var allBox = h("input", { type: "checkbox", "aria-label": "Select every invoice that can be approved" });
      allBox.checked = anyEligible && list.filter(eligible).every(function (i) { return local.sel[i.id]; });
      allBox.disabled = !anyEligible;
      allBox.addEventListener("change", function () { list.filter(eligible).forEach(function (i) { local.sel[i.id] = allBox.checked; }); draw(); });

      body.appendChild(ui.table({ rows: list, onRow: function (i) { app.open({ kind: "ap", id: i.id }); }, sortKey: "st", sortDir: 1, limit: 250,
        empty: ui.empty(status === "review" ? "Nothing waiting for approval" : "No invoices here", status ? "Try another stage in the strip above." : null, "check"),
        columns: [
          { key: "sel", label: allBox, cls: "chk", render: function (i) {
            if (!eligible(i)) return "";
            var b = h("input", { type: "checkbox", "aria-label": "Select " + i.number });
            b.checked = !!local.sel[i.id];
            b.addEventListener("change", function () { local.sel[i.id] = b.checked; draw(); });
            return b;
          } },
          { key: "v", label: "Vendor", cls: "two", sort: function (i) { return E.vendors[i.vendor].name; }, render: function (i) {
            return h("span", null, E.vendors[i.vendor].name, h("span", { class: "sub" }, i.number + (i.po ? " · " + i.po : ""))); } },
          app.scope === "GROUP" ? { key: "e", label: "Entity", sort: function (i) { return i.entity; }, render: function (i) { return E.entity[i.entity].short; } } : null,
          { key: "date", label: "Invoice date", sort: function (i) { return i.date; }, render: function (i) { return ui.date(i.date); } },
          { key: "due", label: "Due", sort: function (i) { return i.due; }, render: function (i) {
            var late = i.status !== "paid" && i.status !== "rejected" ? E.daysBetween(i.due, E.asOf) : 0;
            return h("span", null, ui.date(i.due), late > 0 ? h("span", { class: "sub neg" }, late + " days late") : null); }, cls: "two" },
          { key: "st", label: "Status", sort: function (i) { return RANK[i.status] + (unresolved(i).length ? 0 : 1) + i.due; }, render: function (i) {
            var f = unresolved(i)[0];
            var s = i.status === "scheduled" ? ui.status("scheduled", "Scheduled · " + ui.date(i.scheduledFor)) : i.status === "paid" ? ui.status("paid", "Paid " + ui.date(i.paidAt)) : ui.status(i.status);
            return f && i.status !== "rejected" ? h("span", { class: "row" }, s, ui.tag(f.title, f.sev === "critical" ? "bad" : "serious")) : s; } },
          { key: "amount", label: "Amount", num: true, sort: function (i) { return E.usdOf(i.entity, i.amount, E.currentPeriod()); }, render: function (i) { return E.fmt(i.amount, i.currency); } }
        ].filter(Boolean) }));
    }
    function focusSearch() { var f = body.querySelector(".searchf input"); if (f) { f.focus(); var n = f.value.length; f.setSelectionRange(n, n); } }
    draw();
    return wrap;
  }

  function approveMany(ctx, ids) {
    var E = ctx.E, app = ctx.app, ok = 0, refused = [];
    ids.forEach(function (id) {
      try { E.exec("ap.approve", { id: id }, app.actor()); ok++; }
      catch (e) { if (e instanceof EFM.Refusal) refused.push(E.apInvoices[id].number + ": " + e.message); else throw e; }
    });
    local.sel = {};
    app.commit();
    ui.toast("Approved " + ok + " invoice" + (ok === 1 ? "" : "s") + (refused.length ? " · " + refused.length + " refused" : "") + ".", { sub: refused.length ? refused.slice(0, 2).join(" · ") : "Each one is now in the ledger." , err: !ok && refused.length > 0 });
  }

  /* ---------------------------------------------------------- Payment run */
  function paymentRun(ctx, all) {
    var E = ctx.E, app = ctx.app, run = E.nextPaymentRun(), cp = E.currentPeriod();
    var sched = all.filter(function (i) { return i.status === "scheduled"; });
    var approved = all.filter(function (i) { return i.status === "approved"; });
    var held = all.filter(function (i) { return ["review", "approved", "scheduled", "hold"].indexOf(i.status) >= 0 && E.vendors[i.vendor].bankPending; });
    var releasable = sched.filter(function (i) { return !E.vendors[i.vendor].bankPending; });
    var usd = releasable.reduce(function (s, i) { return s + E.usdOf(i.entity, i.amount, cp, "close"); }, 0);
    var byCur = {};
    releasable.forEach(function (i) { byCur[i.currency] = (byCur[i.currency] || 0) + i.amount; });
    var mine = releasable.filter(function (i) { return !E.can("ap.pay", app.actor(), { approvedBy: i.approvedBy }).ok; });

    var wrap = h("div");
    var head = h("div", { class: "card", style: { padding: "18px 20px", marginBottom: "16px" } },
      h("div", { class: "row", style: { alignItems: "flex-start", gap: "24px", flexWrap: "wrap" } },
        h("div", { class: "grow" },
          h("div", { class: "muted", style: { fontSize: "12.5px" } }, "Next payment run"),
          h("div", { style: { font: "600 24px/1.2 var(--display)", letterSpacing: "-.02em", marginTop: "2px" } }, ui.date(run, "long")),
          h("div", { class: "muted", style: { fontSize: "13px", marginTop: "4px" } }, "Payments go out on Thursdays. Releasing posts each payment to the ledger today; the bank shows it in a day.")),
        h("div", { class: "stat-row" },
          h("div", null, h("div", { class: "l" }, "Invoices"), h("div", { class: "v" }, String(releasable.length))),
          h("div", null, h("div", { class: "l" }, "Total in USD"), h("div", { class: "v" }, E.fmt(usd, "USD", { compact: true }))),
          Object.keys(byCur).filter(function (c) { return c !== "USD"; }).map(function (c) { return h("div", null, h("div", { class: "l" }, "In " + c), h("div", { class: "v" }, E.fmt(byCur[c], c, { compact: true }))); }))),
      h("div", { class: "row", style: { marginTop: "16px", gap: "10px", flexWrap: "wrap" } },
        ui.gated("ap.pay", {}, releasable.length ? "Release payment run" : "Nothing to release", function () { release(); }, { kind: "primary", icon: "check" }),
        mine.length ? h("span", { class: "gate-why", style: { marginTop: "0" } }, ui.icon("lock", "sm"),
          h("span", null, "You approved " + mine.length + " of these, so someone else must release them (SOD-02). ")) : null,
        mine.length && !app.live ? ui.btn("Simulate Tomás releasing it", { kind: "ghost", icon: "users", onClick: function () { release(E.people.tomas); } }) : null));
    if (!releasable.length) head.querySelector(".btn.primary").disabled = true;
    wrap.appendChild(head);

    function release(actor) {
      ui.confirm({ title: "Release " + releasable.length + " payment" + (releasable.length === 1 ? "" : "s") + "?",
        text: E.fmt(usd, "USD") + " in USD across " + Object.keys(byCur).length + " currenc" + (Object.keys(byCur).length === 1 ? "y" : "ies") + ". Each payment posts now (debit Accounts payable, credit the operating account) and appears in the bank feed tomorrow." + (held.length ? " " + held.length + " held for bank verification stay behind." : ""),
        confirmLabel: "Release payments" }).then(function (y) {
        if (y) app.run("ap.payRun", { date: run, ids: releasable.map(function (i) { return i.id; }) }, { actor: actor, ok: function (r) { return "Released " + r.length + " payment" + (r.length === 1 ? "" : "s") + (actor ? " as " + actor.name + " (simulated)" : "") + "."; } });
      });
    }

    if (held.length) {
      var hl = h("div", { class: "att" });
      held.forEach(function (i) {
        var v = E.vendors[i.vendor];
        hl.appendChild(h("div", { class: "att-i" }, ui.sev("critical"),
          h("div", { class: "grow" }, h("div", { class: "t" }, v.name + " · " + i.number), h("div", { class: "x" }, "Held: new bank details requested " + ui.date(v.bankPending.requestedAt.slice(0, 10)) + " by " + v.bankPending.via + ". " + (v.bankPending.note || ""))),
          h("div", { class: "a" }, h("span", { class: "amt" }, E.fmt(i.amount, i.currency)), ui.gated("vendor.verify", {}, "Verify bank details", function () { EFM.drill._verifyBank(v); }, { size: "sm" }))));
      });
      wrap.appendChild(h("div", { style: { marginBottom: "16px" } }, ui.card({ title: "Held", meta: "Not paid until the vendor's new bank details are verified by call-back", flush: true, body: hl })));
    }

    var rows = [];
    E.entities.forEach(function (e) {
      var mineE = releasable.filter(function (i) { return i.entity === e.id; });
      if (!mineE.length) return;
      rows.push({ sub: true, e: e, n: mineE.length, t: mineE.reduce(function (s, i) { return s + i.amount; }, 0) });
      mineE.sort(function (a, b) { return b.amount - a.amount; }).forEach(function (i) { rows.push(i); });
    });
    var bankOf = function (e) { return Object.values(E.bankAccounts).filter(function (b) { return b.entity === e && b.account === "1010"; })[0]; };
    wrap.appendChild(ui.card({ title: "In this run", meta: "Paid from each entity's operating account", flush: true,
      body: ui.table({ rows: rows, sortable: false, onRow: function (r) { if (!r.sub) app.open({ kind: "ap", id: r.id }); },
        rowClass: function (r) { return r.sub ? "subhead" : ""; },
        empty: ui.empty("Nothing scheduled", "Approved invoices are scheduled for the run before they fall due.", "calendar"),
        columns: [
          { key: "v", label: "Vendor", render: function (r) { if (r.sub) { var b = bankOf(r.e.id); return r.e.name + " · from " + b.bankName + " " + b.mask; } return h("span", null, E.vendors[r.vendor].name, h("span", { class: "sub" }, r.number)); }, cls: "two" },
          { key: "to", label: "Pays to", render: function (r) { if (r.sub) return ""; var v = E.vendors[r.vendor]; return v.bank.bank + " " + v.bank.mask; } },
          { key: "due", label: "Due", render: function (r) { return r.sub ? "" : ui.date(r.due); } },
          { key: "ap", label: "Approved by", render: function (r) { return r.sub ? "" : ui.who(r.approvedBy); } },
          { key: "amt", label: "Amount", num: true, render: function (r) { return r.sub ? r.n + " · " + E.fmt(r.t, r.e.currency) : E.fmt(r.amount, r.currency); } }
        ] }) }));

    if (approved.length) {
      wrap.appendChild(h("div", { style: { marginTop: "16px" } }, ui.card({ title: "Approved, not yet scheduled", meta: approved.length + " invoice" + (approved.length === 1 ? "" : "s"), flush: true,
        body: ui.table({ rows: approved, sortable: false, onRow: function (i) { app.open({ kind: "ap", id: i.id }); }, columns: [
          { key: "v", label: "Vendor", cls: "two", render: function (i) { return h("span", null, E.vendors[i.vendor].name, h("span", { class: "sub" }, i.number)); } },
          { key: "due", label: "Due", render: function (i) { return ui.date(i.due); } },
          { key: "amt", label: "Amount", num: true, render: function (i) { return E.fmt(i.amount, i.currency); } },
          { key: "act", label: "", render: function (i) {
            var ok = E.can("ap.pay", app.actor(), { approvedBy: i.approvedBy }).ok;
            return ok ? ui.btn("Schedule", { size: "sm", onClick: function () { app.run("ap.schedule", { id: i.id }, { ok: i.number + " scheduled for " + ui.date(run) + "." }); } })
                      : app.live ? ui.gated("ap.pay", { approvedBy: i.approvedBy }, "Schedule", function () {}, { size: "sm" })
                      : ui.btn("Simulate Tomás scheduling", { size: "sm", kind: "ghost", onClick: function () { app.run("ap.schedule", { id: i.id }, { actor: E.people.tomas, ok: i.number + " scheduled by Tomás Reyes (simulated)." }); } });
          } }] }) })));
    }
    return wrap;
  }

  /* ---------------------------------------------------------- Card charges */
  function cards(ctx) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
    var wrap = h("div");
    if (!app.inScope("US")) return ui.card({ body: ui.empty("No card charges for " + E.entity[app.scope].short, "The company card belongs to OploCloud, Inc. Switch to the US entity or the group.", "card") });
    var all = E.cardChargeList();
    if (!all.length) return ui.card({ body: ui.empty("No card charges yet", "Actual card charges appear here once they've been loaded into OC EFM.", "card") });
    var fy = all.filter(function (x) { return x.journal; });
    var net = E.cardSpend(null, E.fy + "-01", E.fy + "-12");
    var month = E.cardSpend(null, cp, cp);
    var refunds = all.filter(function (x) { return x.status === "refunded"; });
    var owed = -E.balance("US", "2500", cp);
    var vendors = {};
    all.forEach(function (x) { vendors[x.vendor] = 1; });
    wrap.appendChild(ui.kpis([
      { label: "Charged this year", icon: "card", value: E.fmt(net, "USD"), sub: "net of refunds · " + fy.length + " charges in fiscal " + E.fy },
      { label: ui.period(cp, true), icon: "calendar", value: E.fmt(month, "USD"), sub: fy.filter(function (x) { return x.date.slice(0, 7) === cp; }).length + " charges so far · not yet on a statement" },
      { label: "Refunded", icon: "undo", value: E.fmt(refunds.reduce(function (s, x) { return s + x.amount; }, 0), "USD"), sub: refunds.length + " charge" + (refunds.length === 1 ? "" : "s") + " booked and reversed" },
      { label: "Owed on the card", icon: "bank", value: E.fmt(owed, "USD"), sub: "settles on " + ui.date(E.addDays(E.addMonths(cp, 1) + "-20", 0)) + " with the September statement", onClick: function () { app.open({ kind: "account", id: "2500", q: { entity: "US" } }); } },
      { label: "Vendors on the card", icon: "payables", value: String(Object.keys(vendors).length), sub: Object.keys(vendors).map(function (id) { return E.vendors[id].name.split(" — ")[0]; }).join(", ") }
    ]));
    var body = h("div");
    var q = local.cq || "";
    function draw() {
      ui.clear(body);
      var ql = (local.cq || "").toLowerCase();
      var rows = all.filter(function (x) { return !ql || (E.vendors[x.vendor].name + " " + x.id + " " + x.date + " " + x.status).toLowerCase().indexOf(ql) >= 0; });
      body.appendChild(h("div", { class: "bar" }, ui.searchBox("Search charges", local.cq, function (t) { local.cq = t; draw(); body.querySelector("input[type=search]").focus(); }),
        h("span", { class: "sp" }),
        ui.btn("Export CSV", { size: "sm", kind: "ghost", icon: "download", onClick: function () {
          ui.csv("oc-efm-card-charges.csv", [["Charge", "Date", "Vendor", "Status", "Journal", "Total"]].concat(rows.map(function (x) { return [x.id, x.date, E.vendors[x.vendor].name, x.status, x.journal || "", (x.amount / 100).toFixed(2)]; })));
        } }),
        h("span", { class: "muted", style: { fontSize: "12.5px" } }, rows.length + " charge" + (rows.length === 1 ? "" : "s"))));
      body.appendChild(EFM.drill._cardTable(rows, { vendor: true }));
    }
    draw();
    wrap.appendChild(ui.card({ title: "Company card", meta: "Charged at the time of purchase and settled together, on the 20th of the following month", flush: true, body: body,
      foot: [h("span", null, "Actual charges from " + all[0].source + ". Each posts as an expense on its date against the card payable.")] }));
    return wrap;
  }

  /* ---------------------------------------------------------------- Aging */
  function aging(ctx) {
    var E = ctx.E, app = ctx.app, cur = app.scopeCurrency();
    var ag = E.aging("ap", app.scope);
    var wrap = h("div", { class: "grid" });
    wrap.appendChild(ui.card({ title: "Approved and unpaid, by age", meta: E.fmt(ag.total, cur) + " · the ledger's accounts payable", span: 5,
      body: ui.charts.columns({ height: 220, labels: ag.buckets.map(function (b) { return b.label; }),
        series: [{ name: "Payables", color: "var(--s1)", values: ag.buckets.map(function (b) { return b.amount; }) }],
        yFormat: function (v) { return E.fmt(v, cur, { compact: true }); }, tipFormat: function (v) { return E.fmt(v, cur); },
        tipExtra: function (i) { return [{ value: String(ag.buckets[i].count), label: "invoices" }]; }, label: "Payables aging" }),
      foot: [h("span", null, "Unapproved invoices aren't in the ledger yet, so they aren't aged here.")] }));
    var by = {};
    ag.buckets.forEach(function (b, k) {
      b.items.forEach(function (i) {
        var row = by[i.vendor] || (by[i.vendor] = { vendor: i.vendor, b: [0, 0, 0, 0, 0], t: 0, n: 0 });
        var v = app.inScopeCur(i.entity, i.amount, E.currentPeriod());
        row.b[k] += v; row.t += v; row.n++;
      });
    });
    var rows = Object.values(by);
    wrap.appendChild(ui.card({ title: "By vendor", span: 7, flush: true,
      body: ui.table({ rows: rows, sortKey: "t", sortDir: -1, onRow: function (r) { app.setQuery({ tab: null, vendor: r.vendor, status: null }); },
        empty: ui.empty("Nothing owed", "Every approved invoice has been paid.", "check"),
        columns: [{ key: "v", label: "Vendor", sort: function (r) { return E.vendors[r.vendor].name; }, render: function (r) { return E.vendors[r.vendor].name; } }]
          .concat(ag.buckets.map(function (b, k) { return { key: "b" + k, label: b.label, num: true, sort: function (r) { return r.b[k]; }, render: function (r) { return r.b[k] ? E.fmt(r.b[k], cur, { dp: 0 }) : h("span", { class: "faint" }, "—"); } }; }))
          .concat([{ key: "t", label: "Total", num: true, sort: function (r) { return r.t; }, render: function (r) { return h("b", null, E.fmt(r.t, cur, { dp: 0 })); } }]) }) }));
    return wrap;
  }

  /* -------------------------------------------------------------- Vendors */
  function vendors(ctx, all) {
    var E = ctx.E, app = ctx.app, cur = app.scopeCurrency(), cp = E.currentPeriod();
    var list = Object.values(E.vendors).filter(function (v) { return app.inScope(v.entity); }).map(function (v) {
      var inv = all.filter(function (i) { return i.vendor === v.id; });
      return { v: v, spend: v.card ? E.cardSpend(v.id, E.fy + "-01", cp) : inv.filter(function (i) { return i.journal && (i.glDate || i.date) >= E.fy; }).reduce(function (s, i) { return s + app.inScopeCur(i.entity, i.amount, cp); }, 0),
               open: inv.filter(function (i) { return i.status === "approved" || i.status === "scheduled"; }).reduce(function (s, i) { return s + app.inScopeCur(i.entity, i.amount, cp); }, 0),
               waiting: inv.filter(function (i) { return i.status === "review"; }).length };
    });
    var body = h("div");
    function draw() {
      ui.clear(body);
      var ql = local.vq ? local.vq.toLowerCase() : "";
      var rows = list.filter(function (r) { return !ql || (r.v.name + " " + r.v.category).toLowerCase().indexOf(ql) >= 0; });
      body.appendChild(h("div", { class: "bar" }, ui.searchBox("Search vendors", local.vq, function (v) { local.vq = v; draw(); var f = body.querySelector("input"); f.focus(); }),
        h("span", { class: "sp" }), h("span", { class: "muted", style: { fontSize: "12.5px" } }, rows.length + " vendors")));
      body.appendChild(ui.table({ rows: rows, sortKey: "spend", sortDir: -1, onRow: function (r) { app.open({ kind: "vendor", id: r.v.id }); }, columns: [
        { key: "n", label: "Vendor", cls: "two", sort: function (r) { return r.v.name; }, render: function (r) { return h("span", null, r.v.name, h("span", { class: "sub" }, r.v.category + (app.scope === "GROUP" ? " · " + E.entity[r.v.entity].short : ""))); } },
        { key: "t", label: "Terms", render: function (r) { return r.v.card ? "At purchase" : r.v.terms ? "Net " + r.v.terms : "On receipt"; } },
        { key: "b", label: "Pays to", render: function (r) {
          if (r.v.card) return h("span", { class: "row" }, ui.icon("card", "sm"), "Company card");
          return h("span", { class: "row" }, h("span", null, r.v.bank.bank + " " + r.v.bank.mask), r.v.bankPending ? ui.tag("Change pending", "bad") : null); } },
        { key: "c", label: "Coding", render: function (r) { return r.v.account + " · " + (E.accounts[r.v.account].bs ? E.accounts[r.v.account].name : E.dimName("dept", r.v.dept)); } },
        { key: "w", label: "Waiting", num: true, sort: function (r) { return r.waiting; }, render: function (r) { return r.waiting ? String(r.waiting) : h("span", { class: "faint" }, "—"); } },
        { key: "open", label: "Owed", num: true, sort: function (r) { return r.open; }, render: function (r) { return r.open ? E.fmt(r.open, cur, { dp: 0 }) : h("span", { class: "faint" }, "—"); } },
        { key: "spend", label: "Spend this year", num: true, sort: function (r) { return r.spend; }, render: function (r) { return E.fmt(r.spend, cur, { dp: 0 }); } }
      ] }));
    }
    draw();
    return ui.card({ flush: true, body: body });
  }
})(window);
