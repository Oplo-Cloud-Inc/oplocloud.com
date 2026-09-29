/* ==========================================================================
   OC EFM — Recording a transaction.

   People don't think in debits and credits; they think "we paid rent", "we
   sent an invoice", "payroll ran". This is the one place to say what
   happened. Each kind asks the plain questions, shows the entry it will make
   — accounts, debits, credits — and only then records it. What it records
   goes through the same engine as everything else, which refuses any entry
   that isn't the shape of its kind, so this can't be used to slip an
   arbitrary journal past the second-person rule; that is what the general
   journal is for.

     EFM.entry.open()          the picker
     EFM.entry.open("expense") straight to a form
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;

  var CASH = ["1010", "1020", "1030"], REVENUE = ["4000", "4100", "4200"];
  function App() { return EFM.app; }
  function En() { return EFM.app.E; }

  /* -------------------------------------------------------------- Helpers */
  function slug(name, taken) {
    var s = String(name || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 26).replace(/-+$/, "");
    if (!/^[a-z]/.test(s)) s = "x-" + s;
    if (s.length < 2) s = "vendor";
    var id = s, n = 2;
    while (taken[id]) id = s + "-" + n++;
    return id;
  }
  function nextMonthStart(date) {
    var d = new Date(date + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + 1, 1);
    return d.toISOString().slice(0, 10);
  }
  function acctName(id) { var a = En().accounts[id]; return a ? id + " · " + a.name : id; }
  function expenseIds() {
    return En().accountList.filter(function (a) { return a.type === "expense" && !a.ic && a.group !== "tax"; }).map(function (a) { return a.id; });
  }
  function opts(ids) { return ids.map(function (id) { return { id: id, label: acctName(id) }; }); }

  /* -------------------------------------------------------------- The kinds
     group: out | in | assets | adj | other. `plan(S)` says what will be done:
       { quiet: true }              nothing to say yet
       { error: "…" }               something to fix
       { lines, steps, open, done } the entry to show, the commands to run, where to go, what to say
     A step is [command, payload]. */
  var KINDS = [];
  function kind(k) { KINDS.push(k); return k; }

  function txnPlan(S, id, lines, extra) {
    var E = En(), payload = Object.assign({ kind: id, entity: S.st.entity, date: S.st.date, memo: S.st.memo.trim(), lines: lines.map(function (l) {
      var o = { account: l.account, dr: l.dr || 0, cr: l.cr || 0 };
      if (l.dims && Object.keys(l.dims).length) o.dims = l.dims;
      return o;
    }) }, extra || {});
    var total = lines.reduce(function (s, l) { return s + (l.dr || 0); }, 0);
    if (!total) return { quiet: true };
    if (!payload.memo) return { lines: lines, wait: "Add a memo — what this was, in a few words." };
    var bad = E.validateJournal({ entity: payload.entity, date: payload.date, lines: payload.lines });
    if (bad) return { lines: lines, error: bad.message };
    return { lines: lines, steps: [["txn.post", payload]], open: function (j) { return { kind: "journal", id: j.id }; },
             done: function (j) { return "Recorded — " + j.id + " is in the ledger."; } };
  }

  /* ---- Money out */
  kind({ id: "expense", group: "out", icon: "card", title: "Expense", blurb: "Something the business paid for — software, meals, travel, rent.", tag: "Posts at once",
    fields: function (S) {
      return [S.money("amount", "Amount"), S.acct("acct", "What it was for", expenseIds(), { placeholder: "Choose an account" }), S.dept(),
        S.acct("from", "Paid from", CASH.concat(["2500", "2100"]), { def: "1010", labels: { "2500": "2500 · Company card", "2100": "2100 · Owed back to an employee" } }),
        S.vendor("vendor", { optional: true, label: "Vendor (optional)", card: null }), S.memo("What was it for?")];
    },
    plan: function (S) {
      var a = S.amt("amount"); if (!a) return { quiet: true };
      if (!S.v.acct) return { error: "Choose what it was for." };
      var dims = { dept: S.v.dept }; if (S.vendorId("vendor")) dims.vendor = S.vendorId("vendor");
      var p = txnPlan(S, "expense", [{ account: S.v.acct, dr: a, dims: dims }, { account: S.v.from, cr: a }]);
      if (p.steps) { var pre = S.vendorSteps("vendor"); p.steps = pre.concat(p.steps); }
      return p;
    } });

  kind({ id: "bill", ownDate: true, group: "out", icon: "payables", title: "Vendor bill", blurb: "An invoice from a supplier you'll pay later. It goes to Payables for approval.", tag: "Goes to Payables",
    fields: function (S) {
      return [S.vendor("vendor", { label: "Vendor", card: false }), S.text("number", "Their invoice number", { placeholder: "e.g. INV-2041" }), S.date("date", "Bill date"),
        S.date("due", "Due", { def: function () { return En().addDays(S.st.date, S.vendorTerms("vendor")); } }),
        S.items({ side: "expense", label: "What it's for" })];
    },
    plan: function (S) {
      var E = En(), items = S.itemList(), total = items.reduce(function (s, i) { return s + i.amt; }, 0);
      if (!total) return { quiet: true };
      if (!S.vendorId("vendor") && !S.v.vendor_new_name) return { error: "Choose the vendor." };
      if (!S.v.number || !S.v.number.trim()) return { error: "Enter the vendor's invoice number." };
      var bad = S.itemError(); if (bad) return { error: bad };
      var lines = items.map(function (i) { return { account: i.account, dr: i.amt, dims: E.accounts[i.account].bs ? {} : { dept: i.dept } }; });
      lines.push({ account: "2000", cr: total });
      if (S.st.date < E.fy + "-01-01" || S.st.date > E.fy + "-12-31") return { error: "This book is for fiscal " + E.fy + "; the bill has to be dated in it." };
      var steps = S.vendorSteps("vendor").concat([["ap.capture", { vendor: S.vendorId("vendor"), number: S.v.number.trim(), date: S.st.date, due: S.v.due || En().addDays(S.st.date, S.vendorTerms("vendor")),
        lines: items.map(function (i) { return { account: i.account, amt: i.amt, dept: E.accounts[i.account].bs ? undefined : i.dept, desc: i.desc }; }) }]]);
      return { heading: "When a second person approves it", lines: lines, steps: steps, open: function (inv) { return { kind: "ap", id: inv.id }; },
               done: function (inv) { return inv.number + " is in Payables, waiting for a second person to approve it."; } };
    } });

  kind({ id: "card", ownDate: true, group: "out", icon: "card", title: "Company card charge", blurb: "A charge on the company card. It's on the card until the statement is paid.", tag: "Posts at once",
    fields: function (S) { return [S.vendor("vendor", { label: "Merchant", card: true }), S.date("date", "Date of the charge"), S.money("amount", "Amount"), S.text("memo", "Note (optional)", { placeholder: "What it was for", plain: true })]; },
    plan: function (S) {
      var a = S.amt("amount"), E = En(); if (!a) return { quiet: true };
      if (!S.vendorId("vendor") && !S.v.vendor_new_name) return { error: "Choose the merchant." };
      var v = S.vendorObj("vendor"), acct = v ? v.account : S.v.vendor_new_account, dept = v ? v.dept : S.v.vendor_new_dept, dims = { dept: dept, vendor: S.vendorId("vendor") };
      if (S.st.date < E.fy + "-01-01" || S.st.date > E.fy + "-12-31") return { error: "This book is for fiscal " + E.fy + "; the charge has to be dated in it." };
      var lines = [{ account: acct, dr: a, dims: dims }, { account: "2500", cr: a }];
      var bad = E.validateJournal({ entity: S.st.entity, date: S.st.date, lines: lines }); if (bad) return { lines: lines, error: bad.message };
      return { lines: lines, steps: S.vendorSteps("vendor").concat([["card.record", { vendor: S.vendorId("vendor"), date: S.st.date, amount: a, source: (S.st.memo || "").trim() }]]),
               open: function (c) { return { kind: "card", id: c.id }; }, done: function (c) { return c.id + " recorded on the company card."; } };
    } });

  kind({ id: "payroll", group: "out", icon: "users", title: "Payroll", blurb: "A payroll run: wages, employer taxes and benefits, what was paid and what is still owed.", tag: "Posts at once",
    fields: function (S) {
      return [S.money("wages", "Gross wages"), S.money("employer", "Employer taxes and benefits"), S.dept(), S.acct("from", "Paid from", CASH, { def: "1020" }),
        S.money("paid", "Paid out now (net pay and anything remitted)"), S.memo("e.g. September payroll")];
    },
    plan: function (S) {
      var w = S.amt("wages"), er = S.amt("employer"), paid = S.amt("paid"), total = (w || 0) + (er || 0);
      if (!total) return { quiet: true };
      if (paid > total) return { error: "You've paid out more than the payroll cost." };
      var lines = [];
      if (w) lines.push({ account: "6000", dr: w, dims: { dept: S.v.dept } });
      if (er) lines.push({ account: "6050", dr: er, dims: { dept: S.v.dept } });
      if (paid) lines.push({ account: S.v.from, cr: paid });
      if (total - paid) lines.push({ account: "2400", cr: total - paid });
      var p = txnPlan(S, "payroll", lines);
      if (!p.error && !p.quiet && total - paid) p.note = En().fmt(total - paid, S.cur()) + " is left in payroll liabilities to be remitted — record it as a tax payment when it goes out.";
      return p;
    } });

  kind({ id: "tax-pay", group: "out", icon: "bank", title: "Pay a tax", blurb: "Sales tax, payroll taxes or income tax remitted to the authority.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("acct", "Which tax", ["2300", "2400", "2600"], { def: "2300" }), S.acct("from", "Paid from", CASH, { def: "1010" }), S.memo("e.g. Q3 sales tax")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "tax-pay", [{ account: S.v.acct, dr: a }, { account: S.v.from, cr: a }]) : { quiet: true }; } });

  kind({ id: "loan-pay", group: "out", icon: "bank", title: "Loan payment", blurb: "A repayment on a loan, split between what you owe and interest.", tag: "Posts at once",
    fields: function (S) { return [S.money("principal", "Principal"), S.money("interest", "Interest"), S.acct("from", "Paid from", CASH, { def: "1010" }), S.memo("e.g. Term loan, September")]; },
    plan: function (S) {
      var p = S.amt("principal") || 0, i = S.amt("interest") || 0; if (!p && !i) return { quiet: true };
      var lines = []; if (p) lines.push({ account: "2700", dr: p }); if (i) lines.push({ account: "7100", dr: i }); lines.push({ account: S.v.from, cr: p + i });
      return txnPlan(S, "loan-pay", lines);
    } });

  kind({ id: "distribution", group: "out", icon: "users", title: "Owner distribution", blurb: "Money the owners take out of the company — a draw or a dividend.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("from", "Paid from", CASH, { def: "1010" }), S.memo("e.g. Owner draw, September")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "distribution", [{ account: "3100", dr: a }, { account: S.v.from, cr: a }]) : { quiet: true }; } });

  kind({ id: "prepaid", group: "out", icon: "calendar", title: "Prepaid expense", blurb: "Paid now for something that covers months ahead — insurance, an annual licence.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("from", "Paid from", CASH.concat(["2500"]), { def: "1010", labels: { "2500": "2500 · Company card" } }), S.memo("e.g. Annual insurance")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "prepaid", [{ account: "1200", dr: a }, { account: S.v.from, cr: a }]) : { quiet: true }; } });

  kind({ id: "refund-in", group: "out", icon: "back", title: "Refund received", blurb: "A supplier gave money back.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("acct", "The expense it refunds", expenseIds(), { placeholder: "Choose an account" }), S.dept(), S.acct("to", "Paid into", CASH, { def: "1010" }), S.memo("e.g. Refund from the airline")]; },
    plan: function (S) {
      var a = S.amt("amount"); if (!a) return { quiet: true }; if (!S.v.acct) return { error: "Choose the expense it refunds." };
      return txnPlan(S, "refund-in", [{ account: S.v.to, dr: a }, { account: S.v.acct, cr: a, dims: { dept: S.v.dept } }]);
    } });

  /* ---- Money in */
  kind({ id: "invoice", ownDate: true, group: "in", icon: "receivables", title: "Customer invoice", blurb: "Bill a customer. It's owed to you until they pay.", tag: "Posts at once",
    fields: function (S) {
      return [S.customer("customer"), S.date("date", "Invoice date"), S.pick("terms", "Payment terms", [15, 30, 45, 60, 90].map(function (d) { return { id: String(d), label: "Net " + d }; }).concat([{ id: "0", label: "Due on receipt" }]),
          { def: function () { var c = S.customerObj("customer"); return String(c ? c.terms : 30); } }),
        S.text("ref", "Their PO or reference (optional)", { plain: true }), S.items({ side: "revenue", label: "What you're billing for" }), S.money("tax", "Sales tax (optional)")];
    },
    plan: function (S) {
      var E = En(), items = S.itemList(), sub = items.reduce(function (s, i) { return s + i.amt; }, 0), tax = S.amt("tax") || 0;
      if (!sub) return { quiet: true };
      if (!S.customerId("customer") && !S.v.customer_new_name) return { error: "Choose the customer." };
      var bad = S.itemError(); if (bad) return { error: bad };
      if (S.st.date < E.fy + "-01-01" || S.st.date > E.fy + "-12-31") return { error: "This book is for fiscal " + E.fy + "; the invoice has to be dated in it." };
      var lines = [{ account: "1100", dr: sub + tax }];
      items.forEach(function (i) { lines.push({ account: i.account, cr: i.amt, dims: i.product ? { product: i.product } : {} }); });
      if (tax) lines.push({ account: "2300", cr: tax });
      var b = E.validateJournal({ entity: S.st.entity, date: S.st.date, lines: lines.map(function (l) { return { account: l.account, dr: l.dr || 0, cr: l.cr || 0 }; }) });
      if (b) return { lines: lines, error: b.message };
      var cid = S.customerId("customer");
      var terms = +S.v.terms;
      return { lines: lines, steps: S.customerSteps("customer").concat([["ar.issue", { customer: cid, date: S.st.date, terms: isNaN(terms) ? undefined : terms, tax: tax,
                 ref: (S.v.ref || "").trim(), lines: items.map(function (i) { return { account: i.account, amt: i.amt, desc: i.desc, product: i.product || undefined }; }) }]]),
               open: function (inv) { return { kind: "ar", id: inv.id }; }, done: function (inv) { return inv.number + " sent — " + E.fmt(inv.amount, S.cur()) + " is owed to you."; } };
    } });

  kind({ id: "payment-in", ownDate: true, group: "in", icon: "bank", title: "Payment from a customer", blurb: "A customer paid an invoice, in full or in part.", tag: "Posts at once",
    fields: function (S) {
      var E = En(), open = E.arOpen(S.st.entity), list = open.map(function (i) { return { id: i.id, label: E.customers[i.customer].name + " · " + i.number + " · owes " + E.fmt(i.balance, S.cur()) }; });
      if (!list.length) return [h("div", { class: "ef-empty wide" }, ui.icon("receivables"), h("div", null, h("b", null, "No open invoices"), h("span", null, "Send a customer invoice first; then record what they pay against it.")))];
      if (!S.v.invoice || !E.arInvoices[S.v.invoice]) { S.v.invoice = list[0].id; S.v.amount = ui.majorOf(E.arInvoices[list[0].id].balance, S.dp()); }
      return [S.pick("invoice", "Invoice", list, { wide: true, onChange: function () { S.v.amount = ui.majorOf(En().arInvoices[S.v.invoice].balance, S.dp()); S.draw(); } }),
        S.date("date", "Date received"), S.money("amount", "Amount received")];
    },
    plan: function (S) {
      var E = En(), inv = E.arInvoices[S.v.invoice]; if (!inv) return { quiet: true };
      var a = S.amt("amount"); if (!a) return { quiet: true };
      if (a > inv.balance) return { error: "That's more than the " + E.fmt(inv.balance, S.cur()) + " still owed." };
      var lines = [{ account: "1010", dr: a, dims: { customer: inv.customer } }, { account: "1100", cr: a, dims: { customer: inv.customer } }];
      var b = E.validateJournal({ entity: inv.entity, date: S.st.date, lines: lines.map(function (l) { return { account: l.account, dr: l.dr || 0, cr: l.cr || 0 }; }) });
      if (b) return { lines: lines, error: b.message };
      return { lines: lines, note: "It's paid into the operating account.", steps: [["ar.apply", { invoice: inv.id, amount: a, date: S.st.date }]],
               open: function () { return { kind: "ar", id: inv.id }; }, done: function () { return "Payment recorded against " + inv.number + "."; } };
    } });

  kind({ id: "sale", group: "in", icon: "card", title: "Cash sale", blurb: "Revenue that was paid the same day, with no invoice.", tag: "Posts at once",
    fields: function (S) {
      return [S.money("amount", "Sale (before tax)"), S.money("tax", "Sales tax (optional)"), S.acct("acct", "Revenue", REVENUE, { def: "4000" }), S.product(),
        S.acct("to", "Paid into", CASH, { def: "1010" }), S.memo("e.g. Workshop tickets")];
    },
    plan: function (S) {
      var a = S.amt("amount"), t = S.amt("tax") || 0; if (!a) return { quiet: true };
      var lines = [{ account: S.v.to, dr: a + t }, { account: S.v.acct, cr: a, dims: S.v.product ? { product: S.v.product } : {} }];
      if (t) lines.push({ account: "2300", cr: t });
      return txnPlan(S, "sale", lines);
    } });

  kind({ id: "deferred", group: "in", icon: "calendar", title: "Advance payment", blurb: "A customer paid for something you'll deliver later. It becomes revenue as you earn it.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("to", "Paid into", CASH, { def: "1010" }), S.memo("e.g. Annual plan, paid up front")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "deferred", [{ account: S.v.to, dr: a }, { account: "2200", cr: a }]) : { quiet: true }; } });

  kind({ id: "investment", group: "in", icon: "users", title: "Owner investment", blurb: "Money the owners put into the company.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("to", "Paid into", CASH, { def: "1010" }), S.memo("e.g. Founder investment")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "investment", [{ account: S.v.to, dr: a }, { account: "3000", cr: a }]) : { quiet: true }; } });

  kind({ id: "loan-in", group: "in", icon: "bank", title: "Loan received", blurb: "Money borrowed from a bank or lender.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("to", "Paid into", CASH, { def: "1010" }), S.memo("e.g. Term loan")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "loan-in", [{ account: S.v.to, dr: a }, { account: "2700", cr: a }]) : { quiet: true }; } });

  kind({ id: "interest", group: "in", icon: "trend", title: "Interest received", blurb: "Interest the bank paid on your balances.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("to", "Paid into", CASH, { def: "1010" }), S.memo("e.g. Bank interest, September")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "interest", [{ account: S.v.to, dr: a }, { account: "7000", cr: a }]) : { quiet: true }; } });

  kind({ id: "refund-out", group: "in", icon: "back", title: "Refund given", blurb: "You gave a customer money back.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("acct", "The revenue it refunds", REVENUE, { def: "4000" }), S.acct("from", "Paid from", CASH, { def: "1010" }), S.memo("e.g. Refund to a customer")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "refund-out", [{ account: S.v.acct, dr: a }, { account: S.v.from, cr: a }]) : { quiet: true }; } });

  /* ---- Assets */
  kind({ id: "asset", ownDate: true, group: "assets", icon: "box", title: "Buy an asset", blurb: "Equipment or furniture that lasts for years. It's added to the asset register and depreciated.", tag: "Posts at once",
    fields: function (S) {
      return [S.text("name", "What it is", { placeholder: "e.g. MacBook Pro", wide: true, plain: true }), S.money("cost", "Cost"), S.date("date", "Bought and put to use"),
        S.acct("cls", "Kind of asset", ["1510", "1520", "1530"], { def: "1510", onChange: function () { S.v.life = ""; S.draw(); } }),
        S.pick("life", "Useful life", [12, 24, 36, 48, 60, 84, 120].map(function (m) { return { id: String(m), label: m % 12 ? m + " months" : (m / 12) + (m === 12 ? " year" : " years") }; }),
          { def: function () { return { "1510": "36", "1520": "60", "1530": "84" }[S.v.cls] || "36"; } }),
        S.dept(), S.acct("from", "Paid from", CASH.concat(["2500"]), { def: "1010", labels: { "2500": "2500 · Company card" } })];
    },
    plan: function (S) {
      var E = En(), c = S.amt("cost"); if (!c) return { quiet: true };
      if (!(S.v.name || "").trim()) return { error: "Say what it is." };
      var lines = [{ account: S.v.cls, dr: c, dims: { dept: S.v.dept } }, { account: S.v.from, cr: c }];
      var b = E.validateJournal({ entity: S.st.entity, date: S.st.date, lines: lines }); if (b) return { lines: lines, error: b.message };
      return { lines: lines, note: "Depreciated over " + S.v.life + " months, starting the month after it's put to use.",
               steps: [["asset.acquire", { entity: S.st.entity, name: S.v.name.trim(), cls: S.v.cls, cost: c, date: S.st.date, life: +S.v.life, dept: S.v.dept, paidFrom: S.v.from }]],
               open: function (a) { return { kind: "asset", id: a.id }; }, done: function (a) { return a.name + " is on the asset register."; } };
    } });

  kind({ id: "depreciation", noDate: true, group: "assets", icon: "trend", title: "Run depreciation", blurb: "Book a month's depreciation for every asset on the register.", tag: "Posts at once",
    fields: function (S) {
      var E = En(), ps = E.periodsBetween(E.fy + "-01", E.currentPeriod()).reverse();
      return [S.pick("period", "Month", ps.map(function (p) { return { id: p, label: E.periodLabel(p, true) }; }), { def: E.currentPeriod(), wide: true })];
    },
    plan: function (S) {
      var E = En(); if (!S.v.period) return { quiet: true };
      var due = E.depreciationDue(S.st.entity, S.v.period);
      if (!due.length) return { error: "Nothing to depreciate for " + E.periodLabel(S.v.period, true) + " — every asset is up to date, or none is in use yet." };
      var by = {}, total = 0; due.forEach(function (d) { var k = d.asset.dept; by[k] = (by[k] || 0) + d.amount; total += d.amount; });
      var lines = Object.keys(by).sort().map(function (k) { return { account: "6700", dr: by[k], dims: { dept: k } }; }); lines.push({ account: "1590", cr: total });
      return { lines: lines, note: due.length + " asset" + (due.length === 1 ? "" : "s") + " · dated the last day of the month.", steps: [["asset.depreciate", { entity: S.st.entity, period: S.v.period }]],
               open: function (j) { return { kind: "journal", id: j.id }; }, done: function (j) { return "Depreciation recorded — " + j.id + "."; } };
    } });

  /* ---- Adjustments */
  kind({ id: "accrual", group: "adj", icon: "calendar", title: "Accrue an expense", blurb: "You've used something but haven't been billed yet. Reverses itself when the bill arrives.", tag: "Posts at once",
    fields: function (S) {
      return [S.money("amount", "Amount"), S.acct("acct", "What it was for", expenseIds(), { placeholder: "Choose an account" }), S.dept(),
        S.date("reverse", "Reverses on", { def: function () { return nextMonthStart(S.st.date); }, min: function () { return En().addDays(S.st.date, 1); } }), S.memo("e.g. September contractor, not yet billed")];
    },
    plan: function (S) {
      var a = S.amt("amount"); if (!a) return { quiet: true }; if (!S.v.acct) return { error: "Choose what it was for." };
      var p = txnPlan(S, "accrual", [{ account: S.v.acct, dr: a, dims: { dept: S.v.dept } }, { account: "2100", cr: a }], { reverseOn: S.v.reverse || null });
      if (p.steps) p.note = "It reverses on " + ui.date(S.v.reverse, "year") + ", so the bill can be booked then without counting the cost twice.";
      return p;
    } });

  kind({ id: "amort", group: "adj", icon: "calendar", title: "Use up a prepaid amount", blurb: "A month of insurance or a licence you paid for ahead has been used.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount used"), S.acct("acct", "The expense", expenseIds(), { def: "6500" }), S.dept(), S.memo("e.g. Insurance, September")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "amort", [{ account: S.v.acct, dr: a, dims: { dept: S.v.dept } }, { account: "1200", cr: a }]) : { quiet: true }; } });

  kind({ id: "recognize", group: "adj", icon: "trend", title: "Earn deferred revenue", blurb: "Something a customer paid for in advance has been delivered.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount earned"), S.acct("acct", "Revenue", REVENUE, { def: "4000" }), S.memo("e.g. September share of the annual plan")]; },
    plan: function (S) { var a = S.amt("amount"); return a ? txnPlan(S, "recognize", [{ account: "2200", dr: a }, { account: S.v.acct, cr: a }]) : { quiet: true }; } });

  kind({ id: "transfer", group: "adj", icon: "swap", title: "Move money between accounts", blurb: "From one of your own accounts to another. Nothing is spent.", tag: "Posts at once",
    fields: function (S) { return [S.money("amount", "Amount"), S.acct("from", "From", CASH, { def: "1010" }), S.acct("to", "To", CASH, { def: "1020" }), S.memo("e.g. Fund payroll")]; },
    plan: function (S) {
      var a = S.amt("amount"); if (!a) return { quiet: true };
      if (S.v.from === S.v.to) return { error: "Choose two different accounts." };
      return txnPlan(S, "transfer", [{ account: S.v.to, dr: a }, { account: S.v.from, cr: a }]);
    } });

  /* ---- Anything else */
  kind({ id: "pay-bill", group: "other", icon: "payables", title: "Pay a bill", blurb: "Approved bills are scheduled and released from Payables.", tag: "In Payables", go: "/payables?status=approved" });
  kind({ id: "general", group: "other", icon: "journal", title: "General journal", blurb: "Any debits and credits you choose, for anything the others don't cover. A second person approves it.", tag: "Needs a second person",
    launch: function () { EFM.composeJournal(); } });
  kind({ id: "opening", group: "other", icon: "book", title: "Opening balances", blurb: "What the company already had when these books begin. A second person approves it.", tag: "Needs a second person",
    launch: function () { EFM.composeJournal({ memo: "Opening balances", date: En().fy + "-01-01" }); } });

  var GROUPS = [["out", "Money out"], ["in", "Money in"], ["assets", "Assets"], ["adj", "Adjustments"], ["other", "Something else"]];

  /* ============================================================ The form */
  function form(k, back) {
    var E = En(), app = App();
    var S = {
      st: { entity: E.entities[0].id, date: E.asOf, memo: "" },
      v: {}, rows: [{ desc: "", account: "", dept: "", product: "", amt: "" }]
    };
    if (app.scope !== "GROUP" && E.entity[app.scope]) S.st.entity = app.scope;
    S.cur = function () { return En().entity[S.st.entity].currency; };
    S.dp = function () { return En().dp(S.cur()); };
    /* An amount field's value in minor units: 0 when empty, NaN when it isn't a number. */
    S.amt = function (key) { var t = S.v[key]; if (t == null || String(t).trim() === "") return 0; var m = ui.parseMoney(t, S.dp()); return isNaN(m) || m < 0 ? NaN : m; };

    var body = h("div", { class: "ef" }), pre = h("div", { class: "ef-pre" }), footEl = h("div", { class: "ef-foot" });
    var recordBtn = null, plan = null;

    function field(label, control, cls, hint) { return h("label", { class: "field " + (cls || "") }, h("span", null, label), control, hint ? h("small", { class: "muted" }, hint) : null); }
    function initial(key, o) { if (S.v[key] == null || S.v[key] === "") { var d = o.def; S.v[key] = typeof d === "function" ? d() : d != null ? d : ""; } }

    S.money = function (key, label, o) {
      o = o || {};
      var i = h("input", { class: "input num", inputmode: "decimal", placeholder: S.dp() ? "0." + "0".repeat(S.dp()) : "0", value: S.v[key] || "", "aria-label": label });
      i.addEventListener("input", function () { S.v[key] = i.value; check(); });
      i.addEventListener("blur", function () { var m = ui.parseMoney(i.value, S.dp()); if (i.value && !isNaN(m) && m >= 0) { i.value = ui.majorOf(m, S.dp()).replace(/\B(?=(\d{3})+(?!\d))/g, ","); S.v[key] = i.value; check(); } });
      return field(label, i, o.wide ? "wide" : "");
    };
    S.text = function (key, label, o) {
      o = o || {};
      var src = o.plain && key === "memo" ? S.st : S.v, k2 = key;
      var i = h("input", { class: "input", placeholder: o.placeholder || "", value: src[k2] || "", "aria-label": label });
      i.addEventListener("input", function () { src[k2] = i.value; check(); });
      return field(label, i, o.wide ? "wide" : "");
    };
    S.memo = function (placeholder) {
      var i = h("input", { class: "input", placeholder: placeholder || "", value: S.st.memo, "aria-label": "Memo", maxlength: "200" });
      i.addEventListener("input", function () { S.st.memo = i.value; check(); });
      return field("Memo", i, "wide", "What this was — anyone reading the books will see it.");
    };
    S.date = function (key, label, o) {
      o = o || {};
      var main = key === "date";
      if (!main) initial(key, o);
      var i = h("input", { type: "date", class: "input", value: main ? S.st.date : S.v[key], min: o.min ? o.min() : E.fy + "-01-01", max: E.fy + "-12-31", "aria-label": label });
      i.addEventListener("change", function () {
        if (main) { S.st.date = i.value; S.v.due = ""; if (!S.v.reverse_touched) S.v.reverse = ""; }
        else { S.v[key] = i.value; if (key === "reverse") S.v.reverse_touched = true; }
        draw();
      });
      return field(label, i);
    };
    S.pick = function (key, label, options, o) {
      o = o || {}; initial(key, o);
      var s = ui.select(options, S.v[key], function (v) { S.v[key] = v; if (o.onChange) o.onChange(v); else check(); }, { label: label });
      if (S.v[key] == null || S.v[key] === "") S.v[key] = options.length ? String(options[0].id != null ? options[0].id : options[0]) : "";
      return field(label, s, o.wide ? "wide" : "");
    };
    S.acct = function (key, label, ids, o) {
      o = o || {};
      if (!S.v[key] && o.def) S.v[key] = o.def;
      var list = ids.map(function (id) { return { id: id, label: (o.labels && o.labels[id]) || acctName(id) }; });
      if (o.placeholder) list.unshift({ id: "", label: o.placeholder });
      var s = ui.select(list, S.v[key] || "", function (v) { S.v[key] = v; if (o.onChange) o.onChange(v); else check(); }, { label: label });
      return field(label, s, o.wide ? "wide" : "");
    };
    S.dept = function () {
      if (!S.v.dept) S.v.dept = "GA";
      return S.pick("dept", "Department", E.dims.dept.map(function (d) { return { id: d.id, label: d.name }; }), {});
    };
    S.product = function () {
      var list = [{ id: "", label: "None" }].concat(E.dims.product.map(function (d) { return { id: d.id, label: d.name }; }));
      return field("Product (optional)", ui.select(list, S.v.product || "", function (v) { S.v.product = v; check(); }, { label: "Product" }));
    };

    /* A vendor or customer to pick — or add on the spot, in a line. */
    function party(key, o, kindName) {
      var list = kindName === "vendor" ? Object.values(En().vendors) : Object.values(En().customers);
      list = list.filter(function (x) { return x.entity === S.st.entity && (kindName !== "vendor" || o.card == null || !!x.card === !!o.card); }).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
      var options = [{ id: "", label: o.optional ? "None" : "Choose…" }].concat(list.map(function (x) { return { id: x.id, label: x.name }; })).concat([{ id: "+new", label: "＋ Add a new " + kindName + "…" }]);
      var sel = ui.select(options, S.v[key] || "", function (v) { S.v[key] = v; S.v[key + "_new"] = v === "+new"; if (kindName === "customer") S.v.terms = ""; draw(); }, { label: o.label || kindName });
      var nodes = [field(o.label || (kindName === "vendor" ? "Vendor" : "Customer"), sel, S.v[key + "_new"] ? "wide" : "")];
      if (S.v[key + "_new"]) {
        var name = h("input", { class: "input", placeholder: kindName === "vendor" ? "Vendor's name" : "Customer's name", value: S.v[key + "_new_name"] || "", "aria-label": "Name" });
        name.addEventListener("input", function () { S.v[key + "_new_name"] = name.value; check(); });
        var extra = [];
        if (kindName === "vendor") {
          if (!S.v[key + "_new_account"]) S.v[key + "_new_account"] = o.card ? "6100" : "6600";
          if (!S.v[key + "_new_dept"]) S.v[key + "_new_dept"] = "GA";
          extra.push(field("Usually coded to", ui.select(opts(expenseIds()), S.v[key + "_new_account"], function (v) { S.v[key + "_new_account"] = v; check(); }, { label: "Account" })),
            field("Department", ui.select(E.dims.dept.map(function (d) { return { id: d.id, label: d.name }; }), S.v[key + "_new_dept"], function (v) { S.v[key + "_new_dept"] = v; check(); }, { label: "Department" })));
          if (!o.card) {
            if (!S.v[key + "_new_terms"]) S.v[key + "_new_terms"] = "30";
            extra.push(field("Payment terms", ui.select([15, 30, 45, 60].map(function (d) { return { id: String(d), label: "Net " + d }; }), S.v[key + "_new_terms"], function (v) { S.v[key + "_new_terms"] = v; check(); }, { label: "Terms" })));
          }
        }
        nodes.push(h("div", { class: "ef-new wide" }, h("div", { class: "ef-new-h" }, ui.icon("plus", "sm"), "New " + kindName), h("div", { class: "ef-grid" }, field("Name", name, "wide"), extra)));
      }
      return nodes;
    }
    S.vendor = function (key, o) { return party(key, o || {}, "vendor"); };
    S.customer = function (key) { return party(key, { label: "Customer" }, "customer"); };
    S.vendorId = function (key) { var v = S.v[key]; if (v && v !== "+new") return v; return S.newParty(key, "vendor") ? S.newParty(key, "vendor").id : ""; };
    S.customerId = function (key) { var v = S.v[key]; if (v && v !== "+new") return v; return S.newParty(key, "customer") ? S.newParty(key, "customer").id : ""; };
    S.vendorTerms = function (key) { var v = S.vendorObj(key); return v ? v.terms || 30 : +S.v[key + "_new_terms"] || 30; };
    S.vendorObj = function (key) { var v = S.v[key]; return v && v !== "+new" ? En().vendors[v] : null; };
    S.customerObj = function (key) { var v = S.v[key]; return v && v !== "+new" ? En().customers[v] : null; };
    /* The party to be created, if the person is adding one — reusing an existing one of the same name. */
    S.newParty = function (key, kindName) {
      if (S.v[key] !== "+new") return null;
      var name = (S.v[key + "_new_name"] || "").trim(); if (!name) return null;
      var pool = kindName === "vendor" ? En().vendors : En().customers;
      var same = Object.values(pool).filter(function (x) { return x.entity === S.st.entity && x.name.toLowerCase() === name.toLowerCase(); })[0];
      return same ? { id: same.id, exists: true } : { id: slug(name, pool), name: name, exists: false };
    };
    S.vendorSteps = function (key) {
      var n = S.newParty(key, "vendor"); if (!n || n.exists) return [];
      var card = S.vendorCard(key);
      return [["vendor.create", { id: n.id, name: n.name, entity: S.st.entity, account: S.v[key + "_new_account"], dept: S.v[key + "_new_dept"], terms: card ? 0 : +S.v[key + "_new_terms"] || 30, card: card }]];
    };
    S.vendorCard = function (key) { return S.kindId === "card"; };
    S.customerSteps = function (key) {
      var n = S.newParty(key, "customer"); if (!n || n.exists) return [];
      return [["customer.create", { id: n.id, name: n.name, entity: S.st.entity, terms: isNaN(+S.v.terms) ? 30 : +S.v.terms }]];
    };
    S.kindId = k.id;

    /* Line items for a bill or an invoice. */
    S.items = function (o) {
      var wrap = h("div", { class: "ef-items wide" });
      var ids = o.side === "expense" ? expenseIds().concat(["1200", "1510", "1520", "1530"]) : REVENUE;
      var t = h("table", { class: "tbl jc-lines" });
      t.appendChild(h("thead", null, h("tr", null, h("th", null, o.label), h("th", null, "Account"), h("th", null, o.side === "expense" ? "Department" : "Product"), h("th", { class: "num" }, "Amount"), h("th", null, ""))));
      var tb = h("tbody");
      S.rows.forEach(function (it, n) {
        var acct = ui.select([{ id: "", label: "Choose…" }].concat(opts(ids)), it.account, function (v) { it.account = v; draw(); }, { label: "Account" });
        var dim = o.side === "expense"
          ? (En().accounts[it.account] && En().accounts[it.account].bs ? h("span", { class: "faint" }, "—") : ui.select([{ id: "", label: "Choose…" }].concat(E.dims.dept.map(function (d) { return { id: d.id, label: d.name }; })), it.dept, function (v) { it.dept = v; check(); }, { label: "Department" }))
          : ui.select([{ id: "", label: "None" }].concat(E.dims.product.map(function (d) { return { id: d.id, label: d.name }; })), it.product, function (v) { it.product = v; check(); }, { label: "Product" });
        var desc = h("input", { class: "input", value: it.desc, placeholder: "Description", "aria-label": "Description" });
        desc.addEventListener("input", function () { it.desc = desc.value; });
        var amt = h("input", { class: "input num", inputmode: "decimal", value: it.amt, placeholder: S.dp() ? "0." + "0".repeat(S.dp()) : "0", "aria-label": "Amount" });
        amt.addEventListener("input", function () { it.amt = amt.value; check(); });
        amt.addEventListener("blur", function () { var m = ui.parseMoney(amt.value, S.dp()); if (amt.value && !isNaN(m) && m >= 0) { amt.value = ui.majorOf(m, S.dp()).replace(/\B(?=(\d{3})+(?!\d))/g, ","); it.amt = amt.value; check(); } });
        tb.appendChild(h("tr", null, h("td", null, desc), h("td", { class: "jc-acct" }, acct), h("td", null, dim), h("td", { class: "jc-dr" }, amt),
          h("td", null, S.rows.length > 1 ? ui.btn(null, { size: "sm", kind: "ghost", icon: "x", label: "Remove line", onClick: function () { S.rows.splice(n, 1); draw(); } }) : null)));
      });
      t.appendChild(tb);
      wrap.appendChild(t);
      wrap.appendChild(h("div", { class: "row", style: { marginTop: "8px" } }, ui.btn("Add line", { size: "sm", icon: "plus", onClick: function () { S.rows.push({ desc: "", account: o.side === "revenue" ? "4000" : "", dept: "", product: "", amt: "" }); draw(); } })));
      return wrap;
    };
    S.itemList = function () {
      return S.rows.map(function (it) { var m = ui.parseMoney(it.amt, S.dp()); return { desc: (it.desc || "").trim(), account: it.account, dept: it.dept, product: it.product, amt: isNaN(m) ? NaN : m }; })
        .filter(function (i) { return i.amt || i.account || i.desc; });
    };
    S.itemError = function () {
      var list = S.itemList();
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (isNaN(it.amt) || !(it.amt > 0)) return "Line " + (i + 1) + ": enter an amount.";
        if (!it.account) return "Line " + (i + 1) + ": choose an account.";
        var a = En().accounts[it.account];
        if (a && a.type === "expense" && !it.dept) return "Line " + (i + 1) + ": choose a department.";
      }
      return null;
    };
    if (k.id === "invoice") S.rows[0].account = "4000";
    S.draw = draw; S.check = check;

    /* ---- Assembling the form and its preview */
    function preview() {
      ui.clear(pre);
      if (!plan || plan.quiet) return;
      if (plan.lines && plan.lines.length) {
        var dr = 0, cr = 0;
        var t = h("table", { class: "tbl ef-lines" });
        t.appendChild(h("thead", null, h("tr", null, h("th", null, plan.heading || "How it will be booked"), h("th", { class: "num" }, "Debit"), h("th", { class: "num" }, "Credit"))));
        var tb = h("tbody");
        plan.lines.forEach(function (l) {
          dr += l.dr || 0; cr += l.cr || 0;
          tb.appendChild(h("tr", null, h("td", null, h("span", { class: l.cr ? "ef-cr" : "" }, acctName(l.account)), l.dims && l.dims.dept ? h("span", { class: "sub" }, E.dimName("dept", l.dims.dept)) : null),
            h("td", { class: "num" }, l.dr ? E.fmt(l.dr, S.cur()) : ""), h("td", { class: "num" }, l.cr ? E.fmt(l.cr, S.cur()) : "")));
        });
        tb.appendChild(h("tr", { class: "ef-tot" }, h("td", null, "Total"), h("td", { class: "num" }, E.fmt(dr, S.cur())), h("td", { class: "num" }, E.fmt(cr, S.cur()))));
        t.appendChild(tb);
        pre.appendChild(t);
      }
      if (plan.note) pre.appendChild(h("p", { class: "ef-note" }, ui.icon("info", "sm"), h("span", null, plan.note)));
    }
    function check() {
      var nan = ["amount", "wages", "employer", "paid", "principal", "interest", "tax", "cost"].filter(function (f) { return S.v[f] != null && String(S.v[f]).trim() !== "" && isNaN(S.amt(f)); });
      plan = nan.length ? { error: "That isn't an amount." } : k.plan(S);
      preview();
      ui.clear(footEl);
      var ok = !!(plan && plan.steps && !plan.error);
      if (plan && plan.error) footEl.appendChild(h("span", { class: "ef-msg" }, ui.icon("alert", "sm"), plan.error));
      else if (plan && plan.wait) footEl.appendChild(h("span", { class: "ef-wait" }, plan.wait));
      else if (ok) footEl.appendChild(h("span", { class: "ef-ok" }, ui.icon("check", "sm"), k.tag === "Goes to Payables" ? "Ready — this goes to Payables" : "Ready to record"));
      if (recordBtn) recordBtn.disabled = !ok;
      return ok;
    }
    function draw() {
      ui.clear(body);
      var head = [];
      if (E.entities.length > 1) head.push(field("Entity", ui.select(E.entities.map(function (e) { return { id: e.id, label: e.name + " · " + e.currency }; }), S.st.entity, function (v) { S.st.entity = v; draw(); }, { label: "Entity" })));
      if (!k.ownDate && !k.noDate) head.push(S.date("date", "Date"));
      var fs = k.fields(S);
      var flat = [];
      (head.concat(fs)).forEach(function (x) { if (Array.isArray(x)) x.forEach(function (y) { flat.push(y); }); else flat.push(x); });
      var grid = h("div", { class: "ef-grid" }, flat);
      body.appendChild(grid);
      body.appendChild(pre);
      check();
    }

    function record() {
      if (!check()) return true;
      var steps = plan.steps.slice(), last = null;
      var p = plan;
      for (var n = 0; n < steps.length; n++) {
        var isLast = n === steps.length - 1;
        last = App().run(steps[n][0], steps[n][1], isLast ? { ok: function (r) { return p.done(r); } } : {});
        if (!last) return true;             // refused: the toast says why, the form stays
      }
      var open = p.open && p.open(last);
      if (open) setTimeout(function () { App().open(open); }, 60);
      return false;
    }

    var m = ui.modal({ title: k.title, text: k.blurb, cls: "entry", body: body, foot: footEl, actions: [
      { label: back ? "Back" : "Cancel", fn: function () { if (back) setTimeout(back, 30); } },
      { label: k.tag === "Goes to Payables" ? "Send to Payables" : "Record", kind: "primary", fn: record }
    ] });
    var btns = m.box.querySelectorAll(".modal-f .btn"); recordBtn = btns[btns.length - 1];
    draw();
    setTimeout(function () { var f = body.querySelector("input:not([type=date]), select"); if (f) f.focus(); }, 80);
  }

  /* ========================================================== The picker */
  function picker() {
    var E = En(), q = "";
    var body = h("div", { class: "ent" });
    var search = h("input", { type: "search", class: "input", placeholder: "What happened? e.g. rent, payroll, invoice, transfer", "aria-label": "Search kinds of transaction" });
    var m = ui.modal({ title: "New entry", text: "Say what happened. You'll see the accounts it touches before anything is saved.", cls: "entry", body: body, actions: [{ label: "Close" }] });
    function pick(k) {
      m.close();
      setTimeout(function () {
        if (k.go) { App().navigate(k.go); return; }
        if (k.launch) { k.launch(); return; }
        form(k, picker);
      }, 60);
    }
    function draw() {
      ui.clear(body);
      body.appendChild(h("div", { class: "ent-search" }, ui.icon("search", "sm"), search));
      var any = false;
      GROUPS.forEach(function (g) {
        var ks = KINDS.filter(function (k) { return k.group === g[0] && (!q || (k.title + " " + k.blurb).toLowerCase().indexOf(q) >= 0); });
        if (!ks.length) return;
        any = true;
        var grid = h("div", { class: "ent-grid" });
        ks.forEach(function (k) {
          grid.appendChild(h("button", { type: "button", class: "ent-k", on: { click: function () { pick(k); } } },
            h("span", { class: "ent-i" }, ui.icon(k.icon)), h("span", { class: "ent-t" }, h("b", null, k.title), h("small", null, k.blurb), h("em", null, k.tag))));
        });
        body.appendChild(h("section", { class: "ent-sec" }, h("h3", null, g[1]), grid));
      });
      if (!any) body.appendChild(ui.empty("Nothing matches", "Try another word — or use a general journal for anything unusual.", "search"));
    }
    search.addEventListener("input", function () { q = search.value.trim().toLowerCase(); var pos = search.selectionStart; draw(); var s = body.querySelector("input[type=search]"); s.focus(); s.setSelectionRange(pos, pos); });
    draw();
    setTimeout(function () { search.focus(); }, 80);
  }

  EFM.entry = {
    kinds: KINDS,
    open: function (id) {
      var k = id ? KINDS.filter(function (x) { return x.id === id; })[0] : null;
      if (!k) return picker();
      if (k.go) return App().navigate(k.go);
      if (k.launch) return k.launch();
      form(k, null);
    }
  };
})(window);
