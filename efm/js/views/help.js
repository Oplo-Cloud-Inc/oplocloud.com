/* ==========================================================================
   OC EFM — Help.

   What it does, how the pieces fit, and the rules it enforces — short enough
   to read once, organised so it can be found again.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;

  function sec(title, lede, body) { return ui.card({ title: title, meta: lede, span: 6, body: h("div", { class: "help" }, body) }); }
  function dl(rows) { return h("dl", { class: "kv help-kv" }, rows.map(function (r) { return h("div", null, h("dt", null, r[0]), h("dd", null, r[1])); })); }
  function p(t) { return h("p", null, t); }
  function k(t) { return h("kbd", { class: "kbd" }, t); }

  EFM.view("help", {
    title: "Help", icon: "info",
    render: function (ctx) {
      var app = ctx.app, page = h("div");
      page.appendChild(ui.pageHead("Help", "How OC EFM works, and the rules it holds everyone to."));
      var g = h("div", { class: "grid" });
      g.appendChild(sec("Start here", "the order that works", [
        p("A new company usually does these in order. Home keeps a short list of what's still to do."),
        dl([["1 · Company", "Settings → Company: legal name, address, tax ID."], ["2 · Chart and tags", "Settings → Departments & tags. Every expense is charged to a department, so set them up before you record spending."],
          ["3 · Bank", "Cash & banking → Add a bank account, then load its statement as a CSV."], ["4 · Vendors and customers", "Payables → Vendors, Receivables → Customers."],
          ["5 · What you already have", "Journals → Import brings journals over from another system; opening balances are one journal."], ["6 · The budget", "Budgets → Set the budget, by department and month."], ["7 · Your team", "Settings → People & access."]])
      ]));
      g.appendChild(sec("Recording what happens", "Journals → New entry", [
        p("You don't need to know debits and credits. Say what happened — an expense, a bill, payroll, an invoice, a transfer — answer a few plain questions, and check the entry it shows before you record it."),
        dl([["Posts at once", "Expenses, card charges, payroll, taxes, loans, owner money, cash sales, transfers, accruals, prepaid, assets. They take the shape of their kind and nothing else."],
          ["Goes to Payables", "A vendor bill waits for a second person to approve it, then to be scheduled and paid."], ["Needs a second person", "A general journal — any debits and credits you choose — is approved by somebody other than you."],
          ["Mistakes", "Nothing is edited or deleted. A posted entry is corrected by a reversal that points back to it."]])
      ]));
      g.appendChild(sec("The rules it enforces", "separation of duties, checked by the engine and again by the server", [
        dl([["SOD-01", "Whoever captures a vendor bill doesn't approve it."], ["SOD-02", "Whoever approved a bill doesn't release its payment."], ["SOD-03", "New vendor bank details are confirmed by somebody else, by call-back to a number already on file, before anything is paid."],
          ["SOD-04", "Whoever prepares a journal doesn't approve it."], ["Locked months", "A closed month takes no new postings. Closing a fiscal year locks every month, for good."]]),
        p("These aren't screens that can be skipped: a modified browser gets the same refusal from the server.")
      ]));
      g.appendChild(sec("Closing", "month and year", [
        dl([["A month", "Close → Close a month once it has ended. Journals waiting for approval block it."], ["A year", "Settings → The books → Close fiscal year, once every journal is approved and every bank account reconciled. Then start the next: balances, vendors, customers, open invoices, the asset register and bank accounts carry forward. Last year stays exactly as it was."]])
      ]));
      g.appendChild(sec("Insights", "the whole book, drawn", [
        p("Overview, Flow, Composition, Time, Network and Explore draw the same ledger in different ways. Everything is clickable through to the entries behind it. Explore lets you pick a measure, a breakdown and a chart, and export what you see as CSV.")
      ]));
      g.appendChild(sec("Who can do what", "Settings → People & access", [
        dl([["Administrator", "Everything a member can do, plus settings, the chart of accounts, departments, the budget, who has access, and closing a year."], ["Member", "Records and approves transactions, keeps vendors and customers, loads statements, imports journals."], ["Read-only", "Sees everything, changes nothing."]])
      ]));
      g.appendChild(sec("Keyboard", "everything from the keys", [
        dl([[[k("⌘"), " ", k("K")], "Search or ask a question, and go anywhere"], [k("Esc"), "Close what's open"], [[k("Tab"), " / ", k("Shift Tab")], "Move between controls; Enter opens a chart mark or a row"]])
      ]));
      g.appendChild(sec("Your data", "it stays yours", [
        p("Every change is saved on the server in order, chained to the one before it by a hash, and can't be edited or removed — the Audit screen checks the whole chain. Everything exports as CSV: the statements, journals, the general ledger, aging and the asset register.")
      ]));
      page.appendChild(g);
      return page;
    }
  });
})(window);
