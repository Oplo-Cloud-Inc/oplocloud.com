/* ==========================================================================
   OC EFM — keeping the company's records.

   Vendors and customers, bank accounts and their statements, journals brought
   over from somewhere else, and a word left on a record for whoever looks
   next. Each of these is a form or a file and ends in a command; none of them
   can do anything the engine would refuse.

     EFM.records.vendorForm(id?)        EFM.records.customerForm(id?)
     EFM.records.bankDetails(id)        EFM.records.retire(kind, id)
     EFM.records.bankAccountForm()      EFM.records.importStatement(bankId?)
     EFM.records.importJournals()       EFM.records.notes(kind, id)
     EFM.records.exportJournals()
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var R = EFM.records = {};
  function En() { return EFM.app.E; }
  function App() { return EFM.app; }

  /* ---------------------------------------------------------------- CSV in */
  /* Rows of cells from CSV text: quoted cells, doubled quotes, CRLF, a BOM, and a
     comma, semicolon or tab between cells (whichever the first line uses most). */
  ui.parseCsv = function (text) {
    text = String(text || "").replace(/^﻿/, "");
    var first = text.split(/\r?\n/, 1)[0] || "", best = ",", n = 0;
    [",", ";", "\t"].forEach(function (d) { var c = first.split(d).length; if (c > n) { n = c; best = d; } });
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
      } else if (c === '"') q = true;
      else if (c === best) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some(function (x) { return x !== ""; })) rows.push(row); row = []; }
      else cell += c;
    }
    row.push(cell); if (row.some(function (x) { return x !== ""; })) rows.push(row);
    return rows.map(function (r) { return r.map(function (x) { return x.trim(); }); });
  };
  /* A date from a cell: 2026-09-28, 9/28/2026, 9/28/26 — or day first when told. */
  function parseDate(s, dayFirst) {
    s = String(s || "").trim();
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (!m) {
      var t = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/.exec(s);
      if (!t) return null;
      var a = +t[1], b = +t[2], y = +t[3]; if (y < 100) y += 2000;
      m = [null, y, dayFirst ? b : a, dayFirst ? a : b];
    }
    var iso = (+m[1]) + "-" + ("0" + (+m[2])).slice(-2) + "-" + ("0" + (+m[3])).slice(-2);
    var d = new Date(iso + "T00:00:00Z");
    return !isNaN(d) && d.toISOString().slice(0, 10) === iso ? iso : null;
  }
  R.parseDate = parseDate;
  function pickFile(accept, onText) {
    var input = h("input", { type: "file", accept: accept, class: "sr" });
    input.addEventListener("change", function () {
      var f = input.files[0]; if (!f) return;
      if (f.size > 4 * 1024 * 1024) { ui.toast("That file is too large.", { err: true, sub: "Split it into files under 4 MB." }); return; }
      var r = new FileReader(); r.onload = function () { onText(String(r.result), f.name); }; r.readAsText(f); });
    document.body.appendChild(input); input.click(); setTimeout(function () { input.remove(); }, 60000);
  }

  /* --------------------------------------------------------------- Helpers */
  function field(label, control, cls, hint) { return h("label", { class: "field " + (cls || "") }, h("span", null, label), control, hint ? h("small", { class: "muted" }, hint) : null); }
  function text(v, ph, mx) { return h("input", { class: "input", value: v || "", placeholder: ph || "", maxlength: mx || 100 }); }
  function slugFor(name, pool) {
    var s = String(name || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 26).replace(/-+$/, "");
    if (!/^[a-z]/.test(s)) s = "x-" + s;
    if (s.length < 2) s = "party";
    var id = s, n = 2; while (pool[id]) id = s + "-" + n++;
    return id;
  }
  function expenseOpts() { return En().accountList.filter(function (a) { return a.type === "expense" && !a.ic && a.group !== "tax"; }).map(function (a) { return { id: a.id, label: a.id + " · " + a.name }; }); }
  function deptOpts(keep) { return En().dimList("dept", keep).map(function (d) { return { id: d.id, label: d.name }; }); }
  function fmtErr(e) { return e && e.message ? e.message : "That didn't work."; }
  function modalForm(o) {
    var msg = h("span", { class: "ef-msg", style: { display: "none" } });
    var m = ui.modal({ title: o.title, text: o.text, cls: o.cls || "", body: o.body, foot: msg, actions: [{ label: "Cancel" }, { label: o.label || "Save", kind: "primary", fn: function () {
      var r = o.save(); if (r === true) return true;
      if (typeof r === "string") { msg.style.display = "inline-flex"; msg.textContent = r; return true; }
      return false; } }] });
    return m;
  }

  /* ---------------------------------------------------------------- Vendors */
  R.vendorForm = function (id) {
    var E = En(), app = App(), v = id ? E.vendors[id] : null;
    if (id && !v) return;
    var name = text(v && v.name, "Vendor's name", 80), terms = ui.select([0, 15, 30, 45, 60, 90].map(function (d) { return { id: String(d), label: d ? "Net " + d : "Due on receipt" }; }), String(v ? v.terms || 0 : 30), function () {}, { label: "Terms" }),
      acct = ui.select(expenseOpts(), v ? v.account : "6600", function () {}, { label: "Account" }), dept = ui.select(deptOpts(v && v.dept), v ? v.dept : "GA", function () {}, { label: "Department" }),
      email = text(v && v.email, "ap@vendor.com", 120), tin = text(v && v.tin, "Tax ID (EIN)", 30), cat = text(v && v.category, "e.g. Software", 40);
    var w9 = h("input", { type: "checkbox" }); if (v && v.w9) w9.checked = true;
    var kind = ui.select([{ id: "invoice", label: "Sends invoices — paid later" }, { id: "card", label: "Paid on the company card" }], v && v.card ? "card" : "invoice", function () {}, { label: "How it's paid" });
    if (v) kind.disabled = true;
    var body = h("div", { class: "ef-grid" }, field("Name", name, "wide"), field("How it's paid", kind), field("Payment terms", terms), field("Usually coded to", acct), field("Department", dept), field("Email for remittances", email), field("Tax ID", tin), field("Category", cat),
      h("label", { class: "row wide", style: { gap: "8px", fontSize: "13px" } }, w9, "Form W-9 is on file"));
    modalForm({ title: v ? "Edit " + v.name : "New vendor", text: v ? "Bank details are changed separately, because a change is confirmed by someone else." : "Someone with this vendor's invoices — or a merchant on the company card.", body: body, cls: "entry", label: v ? "Save" : "Add vendor", save: function () {
      var nm = name.value.trim(); if (!nm) return "Enter the vendor's name.";
      var run = v
        ? app.run("vendor.update", { id: v.id, name: nm, terms: +terms.value, account: acct.value, dept: dept.value, email: email.value, tin: tin.value, category: cat.value || undefined, w9: w9.checked }, { ok: nm + " updated." })
        : (function () { var nid = slugFor(nm, E.vendors); var r = app.run("vendor.create", { id: nid, name: nm, entity: app.scope === "GROUP" ? E.entities[0].id : app.scope, account: acct.value, dept: dept.value, terms: kind.value === "card" ? 0 : +terms.value, card: kind.value === "card", category: cat.value || undefined }, { ok: nm + " added." });
            if (r && (email.value || tin.value || w9.checked)) app.run("vendor.update", { id: nid, email: email.value, tin: tin.value, w9: w9.checked }, {}); return r ? { id: nid } : null; })();
      if (!run) return true;
      if (!v) setTimeout(function () { app.open({ kind: "vendor", id: run.id }); }, 60);
      return false;
    } });
  };
  R.bankDetails = function (id) {
    var E = En(), app = App(), v = E.vendors[id]; if (!v) return;
    var bank = text(v.bank && v.bank.bank, "Bank's name", 60), mask = text("", "Last four digits of the account", 24), note = text("", "How you got these (optional)", 200);
    modalForm({ title: "Bank details for " + v.name, text: "Payments to " + v.name + " are held until somebody else confirms these by calling a number already on file — never one from the email that asked for the change.",
      body: h("div", { class: "ef-grid" }, field("Bank", bank, "wide"), field("Account ends in", mask), field("Note", note)), label: "Submit for verification", save: function () {
        if (!bank.value.trim() || !mask.value.trim()) return "Enter the bank and the end of the account number.";
        return app.run("vendor.setBank", { id: id, bank: bank.value, mask: mask.value, note: note.value }, { ok: "Held until someone else verifies them." }) ? false : true; } });
  };
  R.retire = function (kind, id) {
    var E = En(), app = App(), rec = kind === "vendor" ? E.vendors[id] : E.customers[id]; if (!rec) return;
    var off = !rec.off;
    ui.confirm({ title: (off ? "Retire " : "Restore ") + rec.name + "?", text: off ? "They drop out of the pickers. Everything already recorded stays exactly as it is, and you can restore them later." : "They come back into the pickers.", confirmLabel: off ? "Retire" : "Restore", danger: off })
      .then(function (y) { if (y) app.run(kind + ".archive", { id: id, off: off }, { ok: rec.name + (off ? " retired." : " restored.") }); });
  };

  /* -------------------------------------------------------------- Customers */
  R.customerForm = function (id) {
    var E = En(), app = App(), c = id ? E.customers[id] : null;
    if (id && !c) return;
    var dp = E.dp(E.entity[c ? c.entity : E.entities[0].id].currency);
    var name = text(c && c.name, "Customer's name", 80), terms = ui.select([0, 15, 30, 45, 60, 90].map(function (d) { return { id: String(d), label: d ? "Net " + d : "Due on receipt" }; }), String(c ? c.terms : 30), function () {}, { label: "Terms" }),
      email = text(c && c.email, "accounts@customer.com", 120), contact = text(c && c.contact, "Who to chase", 80), seg = text(c && c.segment !== "Customer" ? c.segment : "", "e.g. Enterprise, Education", 40),
      limit = h("input", { class: "input num", inputmode: "decimal", placeholder: "No limit", value: c && c.creditLimit ? ui.majorOf(c.creditLimit, dp) : "" });
    modalForm({ title: c ? "Edit " + c.name : "New customer", cls: "entry", body: h("div", { class: "ef-grid" }, field("Name", name, "wide"), field("Payment terms", terms), field("Credit limit", limit, "", "Leave empty for no limit"), field("Email", email), field("Contact", contact), field("Segment", seg)),
      label: c ? "Save" : "Add customer", save: function () {
        var nm = name.value.trim(); if (!nm) return "Enter the customer's name.";
        var lim = limit.value.trim() ? ui.parseMoney(limit.value, dp) : 0; if (isNaN(lim) || lim < 0) return "The credit limit isn't an amount.";
        var r = c ? app.run("customer.update", { id: c.id, name: nm, terms: +terms.value, creditLimit: lim, email: email.value, contact: contact.value, segment: seg.value || undefined }, { ok: nm + " updated." })
          : (function () { var nid = slugFor(nm, E.customers); var x = app.run("customer.create", { id: nid, name: nm, entity: app.scope === "GROUP" ? E.entities[0].id : app.scope, terms: +terms.value, email: email.value, contact: contact.value }, { ok: nm + " added." });
              if (x && (lim || seg.value)) app.run("customer.update", { id: nid, creditLimit: lim, segment: seg.value || undefined }, {}); return x ? { id: nid } : null; })();
        if (!r) return true;
        if (!c) setTimeout(function () { app.open({ kind: "customer", id: r.id }); }, 60);
        return false; } });
  };

  /* ------------------------------------------------------------------ Notes */
  R.notes = function (kind, id) {
    var E = En(), app = App(), list = E.notes[kind + ":" + id] || [];
    var wrap = h("div", { class: "notes" });
    list.forEach(function (n) { wrap.appendChild(h("div", { class: "note-i" }, ui.avatar(n.by, true), h("div", { class: "grow" }, h("div", { class: "who" }, h("b", null, n.name), h("span", { class: "muted" }, " · " + ui.time(n.at))), h("div", { class: "txt" }, n.text)))); });
    if (!list.length) wrap.appendChild(h("p", { class: "muted", style: { fontSize: "12.5px", margin: "0 0 8px" } }, "No notes yet. Leave one for whoever looks at this next — what you checked, or why."));
    if (E.can("note.add", app.actor()).ok) {
      var ta = h("textarea", { class: "input", rows: "2", placeholder: "Add a note", maxlength: "1000", "aria-label": "Note" });
      var post = ui.btn("Add note", { size: "sm", onClick: function () { if (!ta.value.trim()) return; if (app.run("note.add", { kind: kind, id: id, text: ta.value }, {})) { /* the drawer redraws */ } } });
      wrap.appendChild(h("div", { class: "stack", style: { gap: "8px", marginTop: "8px" } }, ta, h("div", null, post)));
    }
    return wrap;
  };

  /* ------------------------------------------------------------ Bank accounts */
  R.bankAccountForm = function () {
    var E = En(), app = App();
    var taken = {}; Object.values(E.bankAccounts).forEach(function (b) { taken[b.entity + "|" + b.account] = 1; });
    var ents = E.entities, ent = ui.select(ents.map(function (e) { return { id: e.id, label: e.name }; }), app.scope === "GROUP" ? ents[0].id : app.scope, function () { refresh(); }, { label: "Entity" });
    var gl = h("select", { class: "input", "aria-label": "Cash account in the ledger" });
    function refresh() { gl.innerHTML = ""; ["1010", "1020", "1030"].filter(function (a) { return !taken[ent.value + "|" + a]; }).forEach(function (a) { gl.appendChild(h("option", { value: a }, a + " · " + E.accounts[a].name)); }); }
    var bank = text("", "e.g. Chase", 60), name = text("", "e.g. Operating", 60), mask = text("", "Last four digits", 12);
    var dp = E.dp(ents[0].currency), opening = h("input", { class: "input num", inputmode: "decimal", placeholder: "0.00" });
    refresh();
    if (!gl.options.length) { ui.toast("Every cash account already has a bank account.", { err: true }); return; }
    modalForm({ title: "Add a bank account", text: "A bank account is matched to one cash account in the ledger. Load its statements and reconcile them against the books.", cls: "entry",
      body: h("div", { class: "ef-grid" }, ents.length > 1 ? field("Entity", ent) : null, field("Bank", bank), field("Account name", name), field("Ledger account", gl), field("Ends in", mask), field("Balance on the first statement", opening, "", "What the bank says at the start of what you'll load. Leave empty if you'll load everything.")),
      label: "Add account", save: function () {
        if (!bank.value.trim() || !name.value.trim()) return "Enter the bank and a name for the account.";
        var op = opening.value.trim() ? ui.parseMoney(opening.value, dp) : 0; if (isNaN(op)) return "The opening balance isn't an amount.";
        var r = app.run("bank.add", { entity: ent.value, account: gl.value, bankName: bank.value, name: name.value, mask: mask.value, opening: op }, { ok: "Bank account added." });
        if (!r) return true;
        setTimeout(function () { R.importStatement(r.id); }, 200);
        return false; } });
  };

  /* ---------------------------------------------------------- Statement CSV */
  R.importStatement = function (bankId) {
    var E = En(), app = App(), banks = Object.values(E.bankAccounts);
    if (!banks.length) { R.bankAccountForm(); return; }
    var bank = E.bankAccounts[bankId] || banks[0], dp = E.dp(E.entity[bank.entity].currency);
    var pick = ui.select(banks.map(function (b) { return { id: b.id, label: b.bankName + " " + b.name + " · " + b.mask }; }), bank.id, function (v) { bank = E.bankAccounts[v]; }, { label: "Bank account" });
    var st = { rows: null, name: "", map: {}, dayFirst: false, flip: false };
    var body = h("div"), prev = h("div"), msg = h("span", { class: "ef-msg", style: { display: "none" } }), btn = null;
    function detect(head) {
      var m = { date: -1, desc: -1, amount: -1, debit: -1, credit: -1 };
      head.forEach(function (c, i) { var t = c.toLowerCase();
        if (m.date < 0 && /date|posted/.test(t)) m.date = i;
        else if (m.desc < 0 && /desc|memo|narr|detail|payee|particulars|reference/.test(t)) m.desc = i;
        else if (m.amount < 0 && /^amount|^amt|value/.test(t)) m.amount = i;
        else if (m.debit < 0 && /debit|withdraw|paid out|money out/.test(t)) m.debit = i;
        else if (m.credit < 0 && /credit|deposit|paid in|money in/.test(t)) m.credit = i; });
      return m;
    }
    function lines() {
      var out = [], bad = [];
      st.rows.slice(1).forEach(function (r, i) {
        var d = parseDate(r[st.map.date], st.dayFirst), desc = st.map.desc >= 0 ? r[st.map.desc] : "", amt = NaN;
        if (st.map.amount >= 0) amt = ui.parseMoney(r[st.map.amount], dp);
        else { var dr = st.map.debit >= 0 && r[st.map.debit] ? ui.parseMoney(r[st.map.debit], dp) : 0, cr = st.map.credit >= 0 && r[st.map.credit] ? ui.parseMoney(r[st.map.credit], dp) : 0; amt = Math.abs(cr || 0) - Math.abs(dr || 0); }
        if (st.flip) amt = -amt;
        if (!d) bad.push("Row " + (i + 2) + ": no date"); else if (isNaN(amt) || !amt) bad.push("Row " + (i + 2) + ": no amount"); else out.push({ date: d, desc: desc || "(no description)", amount: amt });
      });
      return { ok: out, bad: bad };
    }
    function draw() {
      ui.clear(prev);
      if (!st.rows) { prev.appendChild(h("div", { class: "ef-empty" }, ui.icon("doc"), h("div", null, h("b", null, "Choose the statement"), h("span", null, "A CSV file from your bank's website, with a date, a description and an amount on each line.")))); return; }
      var head = st.rows[0], colSel = function (key, label, optional) {
        var s = ui.select([{ id: "-1", label: optional ? "None" : "Choose…" }].concat(head.map(function (c, i) { return { id: String(i), label: c || "Column " + (i + 1) }; })), String(st.map[key]), function (v) { st.map[key] = +v; draw(); }, { label: label });
        return field(label, s); };
      prev.appendChild(h("div", { class: "ef-grid", style: { marginTop: "12px" } }, colSel("date", "Date column"), colSel("desc", "Description column", true), colSel("amount", "Amount column", true), h("span"), colSel("debit", "…or money-out column", true), colSel("credit", "…and money-in column", true)));
      prev.appendChild(h("div", { class: "row", style: { gap: "16px", margin: "10px 0", fontSize: "13px", flexWrap: "wrap" } },
        h("label", { class: "row", style: { gap: "6px" } }, (function () { var c = h("input", { type: "checkbox" }); c.checked = st.dayFirst; c.addEventListener("change", function () { st.dayFirst = c.checked; draw(); }); return c; })(), "Dates are day first (28/09/2026)"),
        h("label", { class: "row", style: { gap: "6px" } }, (function () { var c = h("input", { type: "checkbox" }); c.checked = st.flip; c.addEventListener("change", function () { st.flip = c.checked; draw(); }); return c; })(), "Money out is shown as positive")));
      var L = lines(), sample = L.ok.slice(0, 6);
      prev.appendChild(h("div", { class: "muted", style: { fontSize: "12.5px", marginBottom: "6px" } }, L.ok.length + " line" + (L.ok.length === 1 ? "" : "s") + " ready" + (L.bad.length ? " · " + L.bad.length + " skipped (" + L.bad.slice(0, 2).join("; ") + (L.bad.length > 2 ? "…" : "") + ")" : "") + " · in: " + E.fmt(L.ok.filter(function (x) { return x.amount > 0; }).reduce(function (s, x) { return s + x.amount; }, 0), E.entity[bank.entity].currency) + " · out: " + E.fmt(-L.ok.filter(function (x) { return x.amount < 0; }).reduce(function (s, x) { return s + x.amount; }, 0), E.entity[bank.entity].currency)));
      if (sample.length) prev.appendChild(ui.table({ dense: true, sortable: false, rows: sample, columns: [{ key: "d", label: "Date", render: function (r) { return ui.date(r.date, "year"); } }, { key: "x", label: "Description", render: function (r) { return r.desc; } }, { key: "a", label: "Amount", num: true, render: function (r) { return E.fmt(r.amount, E.entity[bank.entity].currency); } }] }));
      if (btn) btn.disabled = !L.ok.length;
    }
    body.appendChild(h("div", { class: "ef-grid" }, field("For which account", pick, "wide"), h("div", { class: "wide" }, ui.btn("Choose a CSV file…", { icon: "download", onClick: function () {
      pickFile(".csv,text/csv,text/plain", function (txt, name) {
        var rows = ui.parseCsv(txt); if (rows.length < 2) { ui.toast("That file has no lines in it.", { err: true }); return; }
        st.rows = rows; st.name = name; st.map = detect(rows[0]); if (st.map.date < 0) st.map.date = 0; draw(); }); } }),
      h("a", { href: "#", style: { marginLeft: "12px", fontSize: "12.5px" }, on: { click: function (ev) { ev.preventDefault(); ui.csv("statement-template.csv", [["Date", "Description", "Amount"], ["2026-09-01", "WIRE FROM CUSTOMER", "1500.00"], ["2026-09-02", "OFFICE SUPPLIES", "-84.50"]]); } } }, "Download a template"))));
    body.appendChild(prev);
    var m = ui.modal({ title: "Load a bank statement", text: "Lines already loaded are skipped, so it is safe to load the same file twice.", cls: "entry", body: body, foot: msg, actions: [{ label: "Cancel" }, { label: "Load statement", kind: "primary", fn: function () {
      var L = lines(); if (!L.ok.length) return true;
      var total = 0, ok = true;
      for (var i = 0; i < L.ok.length && ok; i += 1500) { var r = app.run("bank.import", { bank: bank.id, lines: L.ok.slice(i, i + 1500) }, { ok: null }); if (!r) ok = false; else total += r.added; }
      if (!ok) return true;
      ui.toast("Loaded " + total + " new line" + (total === 1 ? "" : "s") + " for " + bank.bankName + " " + bank.name + ".");
      setTimeout(function () { app.navigate("/cash/" + bank.id); }, 80);
      return false; } }] });
    btn = m.box.querySelectorAll(".modal-f .btn"); btn = btn[btn.length - 1]; btn.disabled = true;
    draw();
  };

  /* --------------------------------------------------------- Journals in CSV */
  var JCOLS = { journal: /^journal|^ref|^entry|^batch|^id$/, date: /^date/, entity: /^entity|^company/, memo: /^memo|^description|^narration/, account: /^account/, debit: /^debit|^dr$/, credit: /^credit|^cr$/, dept: /^dep/, product: /^prod/, project: /^proj/, vendor: /^vendor/, customer: /^customer/, line: /^line.?memo|^note/ };
  R.importJournals = function () {
    var E = En(), app = App(), body = h("div"), prev = h("div"), st = { entries: null, name: "", dayFirst: false }, btn = null;
    var cur = E.entity[E.entities[0].id].currency, dp = E.dp(cur);
    function build(rows) {
      var head = rows[0].map(function (c) { return c.toLowerCase(); }), ix = {};
      Object.keys(JCOLS).forEach(function (k) { ix[k] = head.findIndex(function (c) { return JCOLS[k].test(c); }); });
      if (ix.date < 0 || ix.account < 0 || (ix.debit < 0 && ix.credit < 0)) return { err: "The file needs a Date, an Account and Debit / Credit columns. Download the template to see the layout." };
      var by = {}, order = [];
      rows.slice(1).forEach(function (r, i) {
        var key = ix.journal >= 0 && r[ix.journal] ? r[ix.journal] : "row" + (i + 2);
        if (!by[key]) { by[key] = { key: key, entity: ix.entity >= 0 && r[ix.entity] ? r[ix.entity].toUpperCase() : E.entities[0].id, dateRaw: r[ix.date], memo: ix.memo >= 0 ? r[ix.memo] : "", lines: [], row: i + 2 }; order.push(key); }
        var g = by[key], acct = String(r[ix.account] || "").match(/\d{4}/), dr = ix.debit >= 0 && r[ix.debit] ? ui.parseMoney(r[ix.debit], dp) : 0, cr = ix.credit >= 0 && r[ix.credit] ? ui.parseMoney(r[ix.credit], dp) : 0;
        if (!g.memo && ix.memo >= 0) g.memo = r[ix.memo];
        var dims = {}; [["dept", "dept"], ["product", "product"], ["project", "project"], ["vendor", "vendor"], ["customer", "customer"]].forEach(function (p) { if (ix[p[0]] >= 0 && r[ix[p[0]]]) dims[p[1]] = r[ix[p[0]]].trim(); });
        // A department may be given by its name as well as its code.
        if (dims.dept) { var dd = E.dims.dept.filter(function (d) { return d.id.toLowerCase() === dims.dept.toLowerCase() || d.name.toLowerCase() === dims.dept.toLowerCase(); })[0]; if (dd) dims.dept = dd.id; }
        g.lines.push({ account: acct ? acct[0] : (r[ix.account] || ""), dr: isNaN(dr) ? NaN : Math.abs(dr || 0), cr: isNaN(cr) ? NaN : Math.abs(cr || 0), dims: dims, memo: ix.line >= 0 && r[ix.line] ? r[ix.line] : undefined });
      });
      return { list: order.map(function (k) { return by[k]; }) };
    }
    function check() {
      st.entries.forEach(function (g) {
        g.date = parseDate(g.dateRaw, st.dayFirst); g.error = null;
        if (!E.entity[g.entity]) g.error = "Unknown entity " + g.entity;
        else if (!g.date) g.error = "Row " + g.row + ": that isn't a date (" + g.dateRaw + ")";
        else if (g.lines.some(function (l) { return isNaN(l.dr) || isNaN(l.cr); })) g.error = "An amount isn't a number";
        else if (!(g.memo || "").trim()) g.error = "Add a memo";
        else { var b = E.validateJournal({ entity: g.entity, date: g.date, lines: g.lines.map(function (l) { return { account: l.account, dr: l.dr, cr: l.cr, dims: l.dims }; }) }); if (b) g.error = b.message; else { var c = g.lines.filter(function (l) { var a = E.accounts[l.account]; return a && a.control; })[0]; if (c) g.error = c.account + " is a control account — it takes postings from its own ledger"; } }
      });
    }
    function draw() {
      ui.clear(prev);
      if (!st.entries) { prev.appendChild(h("div", { class: "ef-empty" }, ui.icon("doc"), h("div", null, h("b", null, "Choose a file"), h("span", null, "One line per debit or credit; lines that share a Journal reference are one journal. Every imported journal waits for somebody else to approve it.")))); return; }
      check();
      var good = st.entries.filter(function (g) { return !g.error; }), bad = st.entries.length - good.length, lines = good.reduce(function (s, g) { return s + g.lines.length; }, 0);
      prev.appendChild(h("div", { class: "row", style: { gap: "16px", margin: "10px 0", fontSize: "13px" } }, h("label", { class: "row", style: { gap: "6px" } }, (function () { var c = h("input", { type: "checkbox" }); c.checked = st.dayFirst; c.addEventListener("change", function () { st.dayFirst = c.checked; draw(); }); return c; })(), "Dates are day first"),
        h("span", { class: "muted" }, st.entries.length + " journal" + (st.entries.length === 1 ? "" : "s") + " · " + good.length + " ready (" + lines + " lines)" + (bad ? " · " + bad + " need fixing" : ""))));
      prev.appendChild(ui.table({ dense: true, sortable: false, limit: 40, rows: st.entries, columns: [
        { key: "k", label: "Journal", render: function (g) { return g.key; } }, { key: "d", label: "Date", render: function (g) { return g.date ? ui.date(g.date, "year") : "—"; } },
        { key: "m", label: "Memo", render: function (g) { return h("span", { class: "ell", style: { maxWidth: "260px", display: "inline-block" } }, g.memo || "—"); } },
        { key: "n", label: "Lines", num: true, render: function (g) { return String(g.lines.length); } },
        { key: "s", label: "", render: function (g) { return g.error ? h("span", { class: "ef-msg" }, ui.icon("alert", "sm"), g.error) : ui.status("good", "Ready"); } }] }));
      if (btn) btn.disabled = !good.length || bad > 0;
    }
    body.appendChild(h("div", { class: "row", style: { gap: "12px" } }, ui.btn("Choose a CSV file…", { icon: "download", onClick: function () {
      pickFile(".csv,text/csv,text/plain", function (txt, name) {
        var rows = ui.parseCsv(txt); if (rows.length < 2) { ui.toast("That file has no lines in it.", { err: true }); return; }
        var b = build(rows); if (b.err) { ui.toast(b.err, { err: true }); return; }
        st.entries = b.list; st.name = name; draw(); }); } }),
      h("a", { href: "#", style: { fontSize: "12.5px" }, on: { click: function (ev) { ev.preventDefault(); ui.csv("journal-import-template.csv", [["Journal", "Date", "Memo", "Account", "Debit", "Credit", "Department", "Line memo"],
        ["J-1", "2026-09-01", "Opening balances", "1010", "10000.00", "", "", ""], ["J-1", "2026-09-01", "Opening balances", "3000", "", "10000.00", "", ""],
        ["J-2", "2026-09-02", "September rent", "6300", "2500.00", "", "GA", "Office"], ["J-2", "2026-09-02", "September rent", "1010", "", "2500.00", "", ""]]); } } }, "Download a template")));
    body.appendChild(prev);
    var m = ui.modal({ title: "Import journals", text: "Bring entries over from another system. Nothing posts until somebody other than you approves it.", cls: "entry", body: body, actions: [{ label: "Cancel" }, { label: "Import for approval", kind: "primary", fn: function () {
      var good = (st.entries || []).filter(function (g) { return !g.error; }); if (!good.length) return true;
      var payload = good.map(function (g) { return { entity: g.entity, date: g.date, memo: g.memo.trim(), lines: g.lines.map(function (l) { var o = { account: l.account, dr: l.dr || 0, cr: l.cr || 0 }; if (Object.keys(l.dims).length) o.dims = l.dims; if (l.memo) o.memo = l.memo; return o; }) }; });
      var n = 0;
      for (var i = 0; i < payload.length; i += 100) { var r = app.run("journal.import", { entries: payload.slice(i, i + 100) }, {}); if (!r) return true; n += r.length; }
      ui.toast("Imported " + n + " journal" + (n === 1 ? "" : "s") + ".", { sub: "They're waiting for a second person to approve them." });
      setTimeout(function () { app.navigate("/journals?status=pending"); }, 80);
      return false; } }] });
    btn = m.box.querySelectorAll(".modal-f .btn"); btn = btn[btn.length - 1]; btn.disabled = true;
    draw();
  };

  /* ---------------------------------------------------------------- Exports */
  R.exportJournals = function (js) {
    var E = En(), app = App(), rows = [["Journal", "Date", "Entity", "Status", "Source", "Memo", "Prepared by", "Account", "Account name", "Debit", "Credit", "Department", "Product", "Project", "Vendor", "Customer"]];
    var dp = function (e) { return E.dp(E.entity[e].currency); };
    (js || E.journalOrder.map(function (id) { return E.journals[id]; })).forEach(function (j) {
      if (j.status === "discarded" || !app.inScope(j.entity)) return;
      j.lines.forEach(function (l) { var d = l.dims || {}; rows.push([j.id, j.date, j.entity, j.status, j.source.label || j.source.type, j.memo, j.createdBy ? ui.person(j.createdBy).name : "", l.account, E.accounts[l.account].name,
        l.dr ? ui.majorOf(l.dr, dp(j.entity)) : "", l.cr ? ui.majorOf(l.cr, dp(j.entity)) : "", d.dept || "", d.product || "", d.project || "", d.vendor || "", d.customer || ""]); });
    });
    ui.csv("oc-efm-journals-" + E.fy + ".csv", rows);
  };
  R.exportTable = function (name, head, rows) { ui.csv(name, [head].concat(rows)); };
  function money(E, entity, v) { return ui.majorOf(v, E.dp(E.entity[entity].currency)); }
  R.exportAP = function () {
    var E = En(), app = App();
    R.exportTable("oc-efm-vendor-invoices-" + E.fy + ".csv", ["Invoice", "Vendor", "Their number", "Date", "Due", "Status", "Entity", "Currency", "Amount", "Approved by", "Paid on", "Journal"],
      Object.values(E.apInvoices).filter(function (i) { return app.inScope(i.entity); }).map(function (i) { return [i.id, E.vendors[i.vendor].name, i.number, i.date, i.due, i.status, i.entity, i.currency, money(E, i.entity, i.amount), i.approvedBy ? ui.person(i.approvedBy).name : "", i.paidAt || "", i.journal || ""]; }));
  };
  R.exportAR = function () {
    var E = En(), app = App();
    R.exportTable("oc-efm-customer-invoices-" + E.fy + ".csv", ["Invoice", "Customer", "Issued", "Due", "Status", "Entity", "Amount", "Balance", "Journal"],
      Object.values(E.arInvoices).filter(function (i) { return app.inScope(i.entity); }).map(function (i) { return [i.number, E.customers[i.customer].name, i.date, i.due, i.status, i.entity, money(E, i.entity, i.amount), money(E, i.entity, i.balance), i.journal || ""]; }));
  };
  R.exportVendors = function () {
    var E = En();
    R.exportTable("oc-efm-vendors.csv", ["Vendor", "Entity", "How paid", "Terms", "Coding", "Department", "Email", "Tax ID", "W-9", "Retired"],
      Object.values(E.vendors).map(function (v) { return [v.name, v.entity, v.card ? "Company card" : "Invoice", v.terms || 0, v.account, v.dept, v.email || "", v.tin || "", v.w9 ? "Yes" : "No", v.off ? "Yes" : ""]; }));
  };
  R.exportCustomers = function () {
    var E = En();
    R.exportTable("oc-efm-customers.csv", ["Customer", "Entity", "Terms", "Credit limit", "Email", "Contact", "Segment", "Retired"],
      Object.values(E.customers).map(function (c) { return [c.name, c.entity, c.terms, c.creditLimit ? money(E, c.entity, c.creditLimit) : "", c.email || "", c.contact || "", c.segment || "", c.off ? "Yes" : ""]; }));
  };
  R.exportAssets = function () {
    var E = En(), app = App();
    R.exportTable("oc-efm-asset-register.csv", ["Asset", "Name", "Class", "Entity", "Department", "Cost", "In service", "Life (months)", "Status"],
      Object.values(E.assets).filter(function (a) { return app.inScope(a.entity); }).map(function (a) { return [a.id, a.name, E.accounts[a.cls].name, a.entity, a.dept, money(E, a.entity, a.cost), a.inService, a.life, a.status]; }));
  };
  R.exportChart = function () {
    var E = En();
    R.exportTable("oc-efm-chart-of-accounts.csv", ["Number", "Name", "Type", "Group"], E.accountList.map(function (a) { return [a.id, a.name, a.type, a.group]; }));
  };
  R.exportLedger = function () {
    var E = En(), app = App(), rows = [];
    E.lines.forEach(function (l) { if (!app.inScope(l.entity)) return; var d = l.dims || {}; rows.push([l.date, l.j, l.entity, l.account, E.accounts[l.account].name, l.memo || "", money(E, l.entity, l.amt), d.dept || "", d.product || "", d.project || "", d.vendor || "", d.customer || ""]); });
    R.exportTable("oc-efm-general-ledger-" + E.fy + ".csv", ["Date", "Journal", "Entity", "Account", "Account name", "Memo", "Debit / (credit)", "Department", "Product", "Project", "Vendor", "Customer"], rows);
  };
})(window);
