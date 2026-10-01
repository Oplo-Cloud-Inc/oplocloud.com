/* ==========================================================================
   OC EFM — Cash & banking.

   /cash is where the money is, today and for the next thirteen weeks.
   /cash/<account> is the reconciliation: the bank's feed on one side, the
   ledger on the other, and a statement that proves they agree — or shows
   exactly what is left to explain.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var sel = { bank: null, book: {}, showMatched: false };

  EFM.view("cash", {
    title: "Cash & banking", icon: "bank",
    render: function (ctx) {
      if (ctx.id && ctx.E.bankAccounts[ctx.id]) return workspace(ctx, ctx.E.bankAccounts[ctx.id]);
      if (ctx.id) return ui.empty("No such bank account", "“" + ctx.id + "” isn't one of OploCloud's accounts.", "bank");
      return overview(ctx);
    }
  });

  /* ============================================================ Overview */
  function lastFeed(E, bankId) {
    var d = ""; Object.values(E.bankLines).forEach(function (l) { if ((!bankId || l.bank === bankId) && l.date > d) d = l.date; });
    return d ? ui.date(d, "year") : "no statement loaded yet";
  }
  function noBanks(ctx) {
    var app = ctx.app, page = h("div");
    page.appendChild(ui.pageHead("Cash & banking", "Connect the books to the bank, and prove they agree.", []));
    page.appendChild(ui.card({ body: h("div", { class: "empty", style: { padding: "44px 16px" } }, ui.icon("bank"), h("b", null, "No bank accounts yet"),
      h("div", { style: { maxWidth: "520px" } }, "Add an account, load its statement from your bank as a CSV file, and OC EFM matches each line to what's in the books — so you can see, line by line, what's missing on either side."),
      h("div", { class: "row", style: { justifyContent: "center", marginTop: "16px" } }, ui.gated("bank.add", {}, "Add a bank account", function () { EFM.records.bankAccountForm(); }, { kind: "primary", icon: "plus" })),
      h("div", { style: { marginTop: "22px", display: "flex", gap: "24px", justifyContent: "center", fontSize: "12.5px", color: "var(--ink-3)", flexWrap: "wrap" } },
        h("span", null, "1 · Add the account"), h("span", null, "2 · Load a statement"), h("span", null, "3 · Match and reconcile"))) }));
    return page;
  }
  function overview(ctx) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod(), group = app.scope === "GROUP", cur = app.scopeCurrency();
    if (!Object.keys(E.bankAccounts).length) return noBanks(ctx);
    var pos = E.cashPosition();
    var rows = pos.rows.filter(function (r) { return app.inScope(r.bank.entity); });
    var bank = rows.reduce(function (s, r) { return s + (group ? r.usd : r.balance); }, 0);
    var book = rows.reduce(function (s, r) { return s + (group ? E.toUSD(r.book, r.currency, E.rate(r.currency, cp, "close")) : r.book); }, 0);
    var unm = rows.reduce(function (s, r) { return s + r.unmatched; }, 0);
    var sched = Object.values(E.apInvoices).filter(function (i) { return i.status === "scheduled" && app.inScope(i.entity); });
    var run = sched.reduce(function (s, i) { return s + app.inScopeCur(i.entity, i.amount, cp); }, 0);
    var banks = {};
    rows.forEach(function (r) { banks[r.bank.bankName] = 1; });

    var page = h("div");
    page.appendChild(ui.pageHead("Cash & banking", rows.length + " account" + (rows.length === 1 ? "" : "s") + " at " + Object.keys(banks).join(", ") + " · " + E.fmt(bank, cur, { compact: true }) + " at the bank today",
      [ui.gated("bank.match", {}, "Load a statement", function () { EFM.records.importStatement(); }, { icon: "download" }), ui.gated("bank.add", {}, "Add account", function () { EFM.records.bankAccountForm(); }, { kind: "primary", icon: "plus" })]));
    var tiles = [
      { label: "At the bank", icon: "bank", value: E.fmt(bank, cur, { compact: true }), sub: group ? "all accounts, USD at today's rates" : rows.length + " accounts" },
      { label: "In the books", icon: "book", value: E.fmt(book, cur, { compact: true }), sub: "difference " + E.fmt(bank - book, cur, { compact: true, plus: true, minus: true }) + " is timing" },
      { label: "Lines to reconcile", icon: "check", value: String(unm), sub: unm ? "at the bank, not yet in the books" : "every account reconciled", onClick: unm ? function () { var r = rows.filter(function (x) { return x.unmatched; })[0]; app.navigate("/cash/" + r.bank.id); } : null },
      { label: "Next payment run", icon: "payables", value: E.fmt(run, cur, { compact: true }), sub: sched.length + " invoices · " + ui.date(E.nextPaymentRun()), onClick: function () { app.navigate("/payables?tab=run"); } }
    ];
    if (group) {
      var fx = pos.rows.filter(function (r) { return r.currency !== "USD"; }).reduce(function (s, r) { return s + r.usd; }, 0);
      tiles.push({ label: "Held in GBP and JPY", icon: "globe", value: E.fmt(fx, "USD", { compact: true }), sub: ui.pct(fx / pos.total, 1) + " of cash · translation exposure" });
    }
    page.appendChild(ui.kpis(tiles));

    var g = h("div", { class: "grid" });
    if (group) g.appendChild(EFM.widgets.cashChart(ctx, { span: 12 }));
    else g.appendChild(entityHistory(ctx, rows));
    page.appendChild(g);

    page.appendChild(h("div", { style: { marginTop: "16px" } }, ui.card({ title: "Accounts", meta: "Statements are loaded from CSV files · the latest line is " + lastFeed(E), flush: true,
      body: ui.table({ rows: rows, sortable: false, onRow: function (r) { app.navigate("/cash/" + r.bank.id); }, columns: [
        { key: "b", label: "Account", cls: "two", render: function (r) { return h("span", null, r.bank.bankName + " · " + r.bank.name, h("span", { class: "sub" }, E.entity[r.bank.entity].name + " · " + r.bank.mask + " · GL " + r.bank.account)); } },
        { key: "bal", label: "At the bank", num: true, render: function (r) { return E.fmt(r.balance, r.currency); } },
        { key: "book", label: "In the books", num: true, render: function (r) { return E.fmt(r.book, r.currency); } },
        { key: "diff", label: "Timing", num: true, render: function (r) { var d = r.balance - r.book; return d ? E.fmt(d, r.currency, { plus: true, minus: true }) : h("span", { class: "faint" }, "—"); } },
        group ? { key: "usd", label: "USD", num: true, render: function (r) { return E.fmt(r.usd, "USD", { compact: true }); } } : null,
        { key: "rec", label: "Reconciled through", render: function (r) { return ui.date(lastRec(E, r.bank)); } },
        { key: "u", label: "", render: function (r) { return r.unmatched ? ui.btn("Reconcile " + r.unmatched, { size: "sm", kind: "primary", onClick: function () { app.navigate("/cash/" + r.bank.id); } }) : ui.status("good", "Reconciled"); } }
      ].filter(Boolean) }) })));

    if (group) page.appendChild(h("div", { style: { marginTop: "16px" } }, forecastTable(ctx)));
    return page;
  }

  function lastRec(E, b) {
    // The latest date through which every bank line is matched.
    var lines = Object.values(E.bankLines).filter(function (l) { return l.bank === b.id; }).sort(function (x, y) { return x.date < y.date ? -1 : 1; });
    var through = b.recThrough;
    for (var i = 0; i < lines.length; i++) { if (lines[i].status !== "matched") break; through = lines[i].date; }
    return lines.length && lines[lines.length - 1].status === "matched" ? lines[lines.length - 1].date : through;
  }

  function entityHistory(ctx, rows) {
    var E = ctx.E, cur = ctx.app.scopeCurrency();
    var end = E.asOf, pts = [];
    for (var i = 12; i >= 0; i--) {
      var d = E.addDays(end, -7 * i);
      pts.push({ d: d, v: rows.reduce(function (s, r) { return s + E.bankBalance(r.bank.id, d); }, 0) });
    }
    return ui.card({ title: "Cash, last 13 weeks", meta: "Bank balances in " + cur + ". The 13-week forecast is kept for the group, in USD.", span: 12,
      body: ui.charts.line({ height: 220, labels: pts.map(function (p) { return p.d; }), series: [{ name: "At the bank", color: "var(--s1)", values: pts.map(function (p) { return p.v; }), area: true }],
        xFormat: function (d) { return ui.date(d); }, yFormat: function (v) { return E.fmt(v, cur, { compact: true }); }, tipFormat: function (v) { return E.fmt(v, cur, { dp: 0 }); },
        tipTitle: function (d) { return ui.date(d, "year"); }, label: "Cash by week" }) });
  }

  function forecastTable(ctx) {
    var E = ctx.E, fc = E.cashForecast(13);
    var cats = {};
    fc.forEach(function (w) { Object.keys(w.items).forEach(function (k) { cats[k] = 1; }); });
    var order = ["Customer receipts", "Payroll", "Vendor payments", "Rent", "Debt service", "Taxes"].filter(function (k) { return cats[k]; })
      .concat(Object.keys(cats).filter(function (k) { return ["Customer receipts", "Payroll", "Vendor payments", "Rent", "Debt service", "Taxes"].indexOf(k) < 0; }));
    return ui.card({ title: "Thirteen-week forecast", meta: "USD · the numbers behind the chart", flush: true,
      tools: ui.btn("Export CSV", { size: "sm", kind: "ghost", icon: "download", onClick: function () {
        ui.csv("oc-efm-cash-forecast.csv", [["Week starting", "Opening"].concat(order).concat(["Closing"])].concat(fc.map(function (w) {
          return [w.start, (w.open / 100).toFixed(2)].concat(order.map(function (k) { return ((w.items[k] || 0) / 100).toFixed(2); })).concat([(w.close / 100).toFixed(2)]);
        })));
      } }),
      body: ui.table({ rows: fc, sortable: false, dense: true, columns: [{ key: "w", label: "Week of", render: function (w) { return ui.date(w.start); } },
        { key: "o", label: "Opening", num: true, render: function (w) { return E.fmt(w.open, "USD", { compact: true }); } }]
        .concat(order.map(function (k) { return { key: k, label: k, num: true, render: function (w) { var v = w.items[k] || 0; return v ? h("span", { class: v < 0 ? "" : "pos" }, E.fmt(v, "USD", { compact: true, plus: true, minus: true })) : h("span", { class: "faint" }, "—"); } }; }))
        .concat([{ key: "c", label: "Closing", num: true, render: function (w) { return h("b", null, E.fmt(w.close, "USD", { compact: true })); } }]) }) });
  }

  /* ======================================================= Reconciliation */
  function workspace(ctx, b) {
    var E = ctx.E, app = ctx.app, c = E.entity[b.entity].currency;
    var rec = E.reconciliation(b.id);
    if (sel.for !== b.id) { sel = { bank: null, book: {}, showMatched: false, for: b.id }; }
    // Drop a selection the last command already settled.
    if (sel.bank && !rec.bankOpen.some(function (l) { return l.id === sel.bank; })) sel.bank = null;
    Object.keys(sel.book).forEach(function (k) { if (!rec.bookOpen.some(function (l) { return l.key === k; })) delete sel.book[k]; });

    var auto = rec.bankOpen.filter(function (l) { return l.suggestion && l.suggestion.kind === "book" && l.suggestion.confidence === "high"; });
    var page = h("div", { class: "rx" });
    page.appendChild(ui.pageHead(b.bankName + " · " + b.name,
      E.entity[b.entity].name + " · " + b.mask + " · " + c + " · GL " + b.account + " " + E.accounts[b.account].name + " · feed " + b.feed.toLowerCase(),
      [ui.btn("All accounts", { icon: "back", onClick: function () { app.navigate("/cash"); } }),
       ui.gated("bank.match", {}, "Load a statement", function () { EFM.records.importStatement(b.id); }, { icon: "download" }),
       auto.length ? ui.gated("bank.match", {}, "Auto-match " + auto.length, function () {
         app.run("bank.autoMatch", { bank: b.id }, { ok: function (n) { return "Matched " + n + " line" + (n === 1 ? "" : "s") + " on exact amount and date."; } });
       }, { kind: "primary", icon: "sparkle" }) : null].filter(Boolean)));

    /* The statement: why the bank and the books differ, line by line. */
    var ok = rec.difference === 0, done = ok && rec.bankOpen.length === 0;
    var st = h("div", { class: "card rx-st" },
      stmt("Balance per bank", E.fmt(rec.bankBalance, c), "Latest line " + lastFeed(E, b.id)),
      h("span", { class: "rx-op" }, "+"),
      stmt("In the books, not at the bank", E.fmt(rec.outstanding, c), rec.bookOpen.length + " item" + (rec.bookOpen.length === 1 ? "" : "s") + " in transit"),
      h("span", { class: "rx-op" }, "−"),
      stmt("At the bank, not in the books", E.fmt(rec.unrecorded, c), rec.bankOpen.length + " to match or book"),
      h("span", { class: "rx-op" }, "="),
      stmt("Balance per books", E.fmt(rec.bookBalance, c), "GL " + b.account + " to date"),
      h("div", { class: "rx-diff " + (ok ? "ok" : "bad") }, h("div", { class: "l" }, "Unexplained"), h("div", { class: "v" }, ui.icon(ok ? "check" : "alert"), E.fmt(rec.difference, c))));
    page.appendChild(st);

    if (done) {
      var task = b.id === "us-op" && E.closeTasks["C-06"] && E.closeTasks["C-06"].status !== "done" ? E.closeTasks["C-06"] : null;
      page.appendChild(h("div", { class: "banner good" }, ui.icon("check"),
        h("span", { class: "grow" }, "Reconciled. Every bank line is in the books; what's left on the right is timing that clears when the bank processes it."),
        task ? ui.btn("Complete close task " + task.id, { size: "sm", kind: "primary", onClick: function () { app.open({ kind: "task", id: task.id }); } }) : null));
    }

    /* Two sides. */
    var bankSum = sel.bank ? E.bankLines[sel.bank].amount : 0;
    var bookSum = Object.keys(sel.book).reduce(function (s, k) { var l = E.lineByKey(k); return s + (l ? l.amt : 0); }, 0);
    var picking = sel.bank || Object.keys(sel.book).length;
    if (picking) {
      var agree = sel.bank && Object.keys(sel.book).length && bankSum === bookSum;
      page.appendChild(h("div", { class: "rx-bar" },
        h("span", null, "Bank ", h("b", { class: "num" }, E.fmt(bankSum, c))), h("span", null, "Books ", h("b", { class: "num" }, E.fmt(bookSum, c))),
        h("span", { class: agree ? "pos" : "neg" }, agree ? "Agree to the cent" : "Difference " + E.fmt(bankSum - bookSum, c)),
        h("span", { class: "sp" }),
        ui.btn("Clear", { size: "sm", kind: "ghost", onClick: function () { sel.bank = null; sel.book = {}; app.refresh(); } }),
        ui.gated("bank.match", {}, "Match", function () {
          if (!agree) return;
          app.run("bank.match", { bankLine: sel.bank, keys: Object.keys(sel.book) }, { ok: "Matched." });
        }, { size: "sm", kind: "primary" })));
      if (!agree) { var mb = page.querySelector(".rx-bar .btn.primary"); if (mb) mb.disabled = true; }
    }

    var split = h("div", { class: "split" });
    split.appendChild(ui.card({ title: "At the bank, not in the books", meta: String(rec.bankOpen.length), flush: true,
      body: rec.bankOpen.length ? bankList(ctx, b, rec, c) : ui.empty("Nothing to explain", "Every line in the bank feed is matched to the ledger.", "check") }));
    split.appendChild(ui.card({ title: "In the books, not at the bank", meta: String(rec.bookOpen.length), flush: true,
      body: rec.bookOpen.length ? bookList(ctx, rec, c) : ui.empty("Nothing in transit", "Every posting to this account has reached the bank.", "check"),
      foot: rec.bookOpen.length ? [h("span", null, "Usually timing: payments not yet cleared and deposits not yet credited. Select one to match it to a bank line by hand.")] : null }));
    page.appendChild(split);

    var matched = rec.lines.filter(function (l) { return l.status === "matched" && l.matchedBy && l.date > E.addDays(E.asOf, -21); }).slice(0, sel.showMatched ? 60 : 0);
    var count = rec.lines.filter(function (l) { return l.status === "matched" && l.date > E.addDays(E.asOf, -21); }).length;
    page.appendChild(h("div", { style: { marginTop: "16px" } }, ui.card({ title: "Matched in the last three weeks", meta: String(count),
      tools: ui.btn(sel.showMatched ? "Hide" : "Show", { size: "sm", kind: "ghost", onClick: function () { sel.showMatched = !sel.showMatched; app.refresh(); } }),
      flush: true, body: sel.showMatched ? ui.table({ rows: matched, sortable: false, dense: true, onRow: function (l) { app.open({ kind: "bankline", id: l.id }); }, columns: [
        { key: "d", label: "Date", render: function (l) { return ui.date(l.date); } },
        { key: "t", label: "Bank description", render: function (l) { return l.desc; } },
        { key: "j", label: "Matched to", render: function (l) { var jl = E.lineByKey(l.matches[0]); return jl ? h("span", { class: "mono" }, jl.j) : "—"; } },
        { key: "by", label: "By", render: function (l) { return l.auto ? "Auto-match" : ui.person(l.matchedBy).name; } },
        { key: "a", label: "Amount", num: true, render: function (l) { return E.fmt(l.amount, c); } },
        { key: "x", label: "", render: function (l) { return ui.gated("bank.match", {}, "Unmatch", function () { app.run("bank.unmatch", { bankLine: l.id }, { ok: "Unmatched — the line is back on the list." }); }, { size: "sm", kind: "ghost" }); } }
      ] }) : h("div", { class: "card-b", style: { paddingTop: "0" } }, h("p", { class: "note" }, "Lines matched by auto-match or by hand. Unmatching puts a line back on the list; a line that created its own journal is undone by reversing that journal."))})));
    return page;
  }

  function stmt(label, value, sub) {
    return h("div", { class: "rx-cell" }, h("div", { class: "l" }, label), h("div", { class: "v num" }, value), h("div", { class: "s" }, sub));
  }

  function bankList(ctx, b, rec, c) {
    var E = ctx.E, app = ctx.app;
    return ui.table({ rows: rec.bankOpen, sortable: false, rowClass: function (l) { return sel.bank === l.id ? "sel" : ""; }, columns: [
      { key: "s", label: "", cls: "chk", render: function (l) {
        var r = h("input", { type: "radio", name: "rx-bank", "aria-label": "Select " + l.desc });
        r.checked = sel.bank === l.id;
        r.addEventListener("change", function () { sel.bank = l.id; app.refresh(); });
        return r;
      } },
      { key: "d", label: "Date", cls: "nowrap", render: function (l) { return ui.date(l.date); } },
      { key: "t", label: "Description", cls: "two rx-desc", render: function (l) { return h("span", null, h("span", { class: "rx-d" }, l.desc), h("span", { class: "sub" }, hint(E, l))); } },
      { key: "a", label: "Amount", num: true, cls: "nowrap", render: function (l) { return h("b", { class: l.amount < 0 ? "" : "pos" }, E.fmt(l.amount, c, { minus: true, plus: true })); } },
      { key: "x", label: "", cls: "nowrap rx-act", render: function (l) { return action(ctx, b, l, c); } }
    ] });
  }
  /* What the engine thinks a bank line is, in words. */
  function hint(E, l) {
    var s = l.suggestion;
    if (!s) return "No match in the books";
    if (s.kind === "book") { var jl = E.lineByKey(s.key); return "Matches " + jl.j + (s.confidence === "high" ? "" : " · " + s.gap + " working days apart"); }
    if (s.kind === "ar") { var inv = E.arInvoices[s.invoice]; return "Pays " + inv.number + " · " + E.customers[inv.customer].name; }
    return "Not in the books: " + s.memo.toLowerCase();
  }
  function action(ctx, b, l, c) {
    var E = ctx.E, app = ctx.app, s = l.suggestion;
    if (s && s.kind === "book") {
      var jl = E.lineByKey(s.key);
      return ui.gated("bank.match", {}, "Match", function () { app.run("bank.match", { bankLine: l.id, keys: [s.key] }, { ok: "Matched to " + jl.j + "." }); }, { size: "sm" });
    }
    if (s && s.kind === "ar") {
      var inv = E.arInvoices[s.invoice];
      return ui.gated("ar.apply", {}, "Apply", function () { app.run("ar.apply", { invoice: inv.id, bankLine: l.id }, { ok: function (r) { return "Applied to " + inv.number + " · " + r.journal.id + "."; } }); }, { size: "sm", kind: "primary" });
    }
    return ui.gated("bank.match", {}, "Book it", function () { bookIt(ctx, b, l, c); }, { size: "sm", kind: s ? "primary" : null });
  }

  /* A line the bank knows about and the books don't: a fee, a chargeback. */
  function bookIt(ctx, b, l, c) {
    var E = ctx.E, app = ctx.app, s = l.suggestion || {};
    var accts = E.accountList.filter(function (a) { return !a.control && !a.bank && a.id !== "3000" && a.id !== "3100"; });
    var acct = h("select", { class: "input", "aria-label": "Account" });
    accts.forEach(function (a) { var o = h("option", { value: a.id }, a.id + " " + a.name); if (a.id === (s.account || "6650")) o.selected = true; acct.appendChild(o); });
    var dept = h("select", { class: "input", "aria-label": "Department" });
    E.dimList("dept").forEach(function (d) { var o = h("option", { value: d.id }, d.name); if (d.id === "GA") o.selected = true; dept.appendChild(o); });
    var memo = h("input", { class: "input", value: s.memo || l.desc });
    var preview = h("div");
    function drawPreview() {
      ui.clear(preview);
      var a = acct.value, amt = Math.abs(l.amount), dims = E.accounts[a].type === "expense" ? { dept: dept.value } : (s.dims || {});
      var lines = l.amount < 0 ? [{ account: a, dr: amt, dims: dims }, { account: b.account, cr: amt }] : [{ account: b.account, dr: amt }, { account: a, cr: amt, dims: dims }];
      preview.appendChild(ui.jeTable(lines, c));
    }
    acct.addEventListener("change", drawPreview); dept.addEventListener("change", drawPreview);
    drawPreview();
    ui.modal({ title: "Book “" + l.desc + "”", text: E.fmt(l.amount, c, { minus: true, plus: true }) + " on " + ui.date(l.date, "year") + ". This posts a journal dated the bank date and matches the line to it.", wide: true,
      body: h("div", { class: "stack", style: { gap: "14px" } },
        h("div", { class: "grid", style: { gap: "12px" } },
          h("label", { class: "field c5" }, h("span", null, "Account"), acct), h("label", { class: "field c3" }, h("span", null, "Department"), dept),
          h("label", { class: "field c4" }, h("span", null, "Memo"), memo)), preview),
      actions: [{ label: "Cancel" }, { label: "Post and match", kind: "primary", fn: function () {
        var a = acct.value;
        app.run("bank.create", { bankLine: l.id, account: a, memo: memo.value, dims: E.accounts[a].type === "expense" ? { dept: dept.value } : (s.dims || {}) },
          { ok: function (j) { return "Posted " + j.id + " and matched the bank line."; } });
      } }] });
  }

  function bookList(ctx, rec, c) {
    var E = ctx.E, app = ctx.app;
    return ui.table({ rows: rec.bookOpen.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }), sortable: false, rowClass: function (l) { return sel.book[l.key] ? "sel" : ""; }, columns: [
      { key: "s", label: "", cls: "chk", render: function (l) {
        var cb = h("input", { type: "checkbox", "aria-label": "Select " + l.j });
        cb.checked = !!sel.book[l.key];
        cb.addEventListener("change", function () { if (cb.checked) sel.book[l.key] = 1; else delete sel.book[l.key]; app.refresh(); });
        return cb;
      } },
      { key: "d", label: "Date", cls: "nowrap", render: function (l) { return ui.date(l.date); } },
      { key: "m", label: "Posting", cls: "two rx-desc", render: function (l) {
        return h("button", { type: "button", class: "rc-inv", on: { click: function () { app.open({ kind: "journal", id: l.j }); } } }, h("span", null, l.memo), h("span", { class: "sub mono" }, l.j)); } },
      { key: "a", label: "Amount", num: true, cls: "nowrap", render: function (l) { return h("b", { class: l.amt < 0 ? "" : "pos" }, E.fmt(l.amt, c, { minus: true, plus: true })); } }
    ] });
  }
})(window);
