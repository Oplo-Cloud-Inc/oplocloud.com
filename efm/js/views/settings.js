/* ==========================================================================
   OC EFM — Settings.

   How the company is set up, and who is in it: the company's details, the
   chart of accounts, the departments and tags entries carry, who has access,
   and the books themselves. Administrators change these; everybody can read
   them. Every change is a command like any other — in the audit trail, with
   the name of the person who made it.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var local = { q: "", access: null, accessErr: null };
  var TABS = [["company", "Company"], ["accounts", "Chart of accounts"], ["tags", "Departments & tags"], ["access", "People & access"], ["books", "The books"]];

  function field(label, control, cls, hint) { return h("label", { class: "field " + (cls || "") }, h("span", null, label), control, hint ? h("small", { class: "muted" }, hint) : null); }
  function isAdmin(app) { return app.E.can("company.update", app.actor()).ok; }
  function note(app) { return isAdmin(app) ? null : h("div", { class: "banner info", style: { marginBottom: "14px" } }, ui.icon("lock", "sm"), h("span", null, "Only an administrator can change these settings. You can read them.")); }

  EFM.view("settings", {
    title: "Settings", icon: "settings",
    render: function (ctx) {
      var app = ctx.app, tab = ctx.query.get("tab") || "company", page = h("div");
      page.appendChild(ui.pageHead("Settings", "How the company is set up, and who is in it."));
      page.appendChild(h("div", { style: { marginBottom: "16px" } }, ui.seg(TABS.map(function (t) { return { id: t[0], label: t[1] }; }), tab, function (t) { app.setQuery({ tab: t === "company" ? null : t }); }, { label: "Settings" })));
      var n = note(app); if (n) page.appendChild(n);
      page.appendChild(tab === "accounts" ? accounts(ctx) : tab === "tags" ? tags(ctx) : tab === "access" ? access(ctx) : tab === "books" ? books(ctx) : company(ctx));
      return page;
    }
  });

  /* --------------------------------------------------------------- Company */
  function company(ctx) {
    var E = ctx.E, app = ctx.app, wrap = h("div", { class: "stack", style: { gap: "16px" } }), can = isAdmin(app);
    E.entities.forEach(function (e) {
      var f = {}, dis = !can;
      function inp(k, ph) { var i = h("input", { class: "input", value: e[k] || "", placeholder: ph || "", maxlength: k === "address" ? 200 : 100 }); i.disabled = dis; f[k] = i; return i; }
      var save = ui.gated("company.update", {}, "Save changes", function () {
        var patch = { entity: e.id }; ["name", "legal", "address", "city", "country", "taxId"].forEach(function (k) { patch[k] = f[k].value; });
        app.run("company.update", patch, { ok: "Company details saved." });
      }, { kind: "primary" });
      wrap.appendChild(ui.card({ title: E.entities.length > 1 ? e.name : "The company", meta: e.currency + " · fiscal year " + E.fy, span: 12,
        body: h("div", { class: "ef-grid" }, field("Name people see", inp("name", "e.g. OploCloud"), "wide"), field("Legal name", inp("legal", "e.g. OploCloud, Inc.")), field("Tax ID", inp("taxId", "EIN or VAT number")),
          field("Address", inp("address", "Street address"), "wide"), field("City", inp("city")), field("Country", inp("country"))),
        foot: [h("span", { class: "muted" }, "Reports and invoices carry these."), h("span", { class: "sp" }), save] }));
    });
    wrap.appendChild(ui.card({ title: "Books", meta: "read-only", body: h("div", { class: "ef-grid" },
      field("Currency", h("input", { class: "input", value: E.entities[0].currency, disabled: true })), field("Fiscal year", h("input", { class: "input", value: "January – December " + E.fy, disabled: true }))) }));
    return wrap;
  }

  /* ---------------------------------------------------------------- Accounts */
  function nextFree(E, sec) { for (var n = sec.lo; n <= sec.hi; n += 10) if (!E.accounts[String(n)]) return String(n); for (n = sec.lo; n <= sec.hi; n++) if (!E.accounts[String(n)]) return String(n); return ""; }
  function accounts(ctx) {
    var E = ctx.E, app = ctx.app, S = EFM.Engine.ACCOUNT_SECTIONS, wrap = h("div"), body = h("div");
    var add = ui.gated("account.manage", {}, "Add an account", function () {
      var sec = ui.select([["opex", "Operating expense"], ["cogs", "Cost of revenue"], ["revenue", "Revenue"]].map(function (x) { return { id: x[0], label: x[1] }; }), "opex", function (v) { num.value = nextFree(E, S[v]); hint.textContent = "Between " + S[v].lo + " and " + S[v].hi + "."; }, { label: "Section" });
      var num = h("input", { class: "input", value: nextFree(E, S.opex), inputmode: "numeric", maxlength: 4 }), name = h("input", { class: "input", placeholder: "e.g. Recruiting", maxlength: 60 }), hint = h("small", { class: "muted" }, "Between " + S.opex.lo + " and " + S.opex.hi + ".");
      var msg = h("span", { class: "ef-msg", style: { display: "none" } });
      ui.modal({ title: "Add an account", text: "It joins the chart, the income statement and every total it belongs to.", cls: "entry", foot: msg, body: h("div", { class: "ef-grid" }, field("Where it sits", sec, "wide"), field("Number", num, "", ""), field("Name", name), h("div", { class: "wide" }, hint)),
        actions: [{ label: "Cancel" }, { label: "Add account", kind: "primary", fn: function () { if (!name.value.trim()) { msg.style.display = "inline-flex"; msg.textContent = "Give the account a name."; return true; } return app.run("account.add", { id: num.value, name: name.value, section: sec.value }, { ok: "Account " + num.value + " added." }) ? false : true; } }] });
    }, { kind: "primary", icon: "plus" });
    function draw() {
      ui.clear(body);
      var ql = local.q.toLowerCase(), rows = E.accountList.filter(function (a) { return !ql || (a.id + " " + a.name).toLowerCase().indexOf(ql) >= 0; });
      body.appendChild(h("div", { class: "bar" }, ui.searchBox("Search accounts", local.q, function (x) { local.q = x; draw(); var f = body.querySelector("input[type=search]"); if (f) f.focus(); }), h("span", { class: "sp" }), h("span", { class: "muted", style: { fontSize: "12.5px" } }, rows.length + " accounts")));
      body.appendChild(ui.table({ rows: rows, sortable: false, limit: 80, columns: [
        { key: "id", label: "Number", cls: "nowrap", render: function (a) { return h("span", { class: "mono" }, a.id); } },
        { key: "n", label: "Name", cls: "two", render: function (a) { return h("span", null, a.name, a.custom ? h("span", { class: "sub" }, "added by an administrator") : null); } },
        { key: "t", label: "Type", render: function (a) { return h("span", { class: "muted" }, { asset: "Asset", liability: "Liability", equity: "Equity", revenue: "Revenue", expense: "Expense" }[a.type]); } },
        { key: "f", label: "", render: function (a) { var f = h("span", { class: "row", style: { gap: "4px" } }); if (a.control) f.appendChild(h("span", { class: "lock" }, ui.icon("lock", "sm"), "Control")); if (a.bank) f.appendChild(ui.tag("Bank")); if (a.ic) f.appendChild(ui.tag("Intercompany")); return f; } },
        { key: "b", label: "", num: true, render: function (a) { return E.can("account.manage", app.actor()).ok ? ui.btn("Rename", { size: "sm", kind: "ghost", onClick: function (ev) { ev.stopPropagation(); ui.ask({ title: "Rename " + a.id, label: "Name", value: a.name, confirmLabel: "Rename" }).then(function (v) { if (v) app.run("account.rename", { id: a.id, name: v }, { ok: "Renamed." }); }); } }) : ""; } }] }));
    }
    draw();
    wrap.appendChild(ui.card({ title: "Chart of accounts", meta: "one chart, used for every entry", tools: add, flush: true, body: body,
      foot: [h("span", null, "Balance-sheet accounts are fixed so the statements always balance. Income and expense accounts can be added.")] }));
    return wrap;
  }

  /* ---------------------------------------------------------- Departments etc. */
  function tags(ctx) {
    var E = ctx.E, app = ctx.app, wrap = h("div", { class: "grid" }), uses = {};
    E.lines.forEach(function (l) { var d = l.dims || {}; ["dept", "product", "project"].forEach(function (k) { if (d[k]) uses[k + ":" + d[k]] = (uses[k + ":" + d[k]] || 0) + 1; }); });
    [["dept", "Departments", "Every expense is charged to one, so budgets can be held to them.", "e.g. Operations", 6], ["product", "Products", "What revenue and costs are about.", "e.g. Mobile app", 6], ["project", "Projects", "One-off pieces of work you want to follow.", "e.g. Spring launch", 12]].forEach(function (k) {
      var kind = k[0], list = E.dims[kind];
      var add = ui.gated("dim.manage", {}, "Add", function () {
        var code = h("input", { class: "input", placeholder: "Code, e.g. OPS", maxlength: 8 }), name = h("input", { class: "input", placeholder: k[3], maxlength: 60 }), msg = h("span", { class: "ef-msg", style: { display: "none" } });
        name.addEventListener("input", function () { if (!code.dataset.touched) code.value = name.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase(); });
        code.addEventListener("input", function () { code.dataset.touched = "1"; });
        ui.modal({ title: "Add " + k[1].toLowerCase().replace(/s$/, ""), cls: "entry", foot: msg, body: h("div", { class: "ef-grid" }, field("Name", name, "wide"), field("Code", code, "", "Two to eight letters or digits. Never changes.")),
          actions: [{ label: "Cancel" }, { label: "Add", kind: "primary", fn: function () { if (!name.value.trim()) { msg.style.display = "inline-flex"; msg.textContent = "Give it a name."; return true; } return app.run("dim.add", { kind: kind, id: code.value, name: name.value }, { ok: "Added." }) ? false : true; } }] });
      }, { size: "sm", icon: "plus" });
      wrap.appendChild(ui.card({ title: k[1], meta: list.filter(function (d) { return !d.off; }).length + " in use", span: 4, tools: add, flush: true,
        body: list.length ? ui.table({ rows: list, sortable: false, columns: [
          { key: "n", label: "Name", render: function (d) { return h("span", null, d.name, h("span", { class: "sub" }, d.id + (d.off ? " · retired" : ""))); } },
          { key: "u", label: "Entries", num: true, render: function (d) { return String(uses[kind + ":" + d.id] || 0); } },
          { key: "b", label: "", num: true, render: function (d) { return E.can("dim.manage", app.actor()).ok ? h("span", { class: "row", style: { gap: "4px", justifyContent: "flex-end" } },
            ui.btn("Rename", { size: "sm", kind: "ghost", onClick: function () { ui.ask({ title: "Rename " + d.name, label: "Name", value: d.name, confirmLabel: "Rename" }).then(function (v) { if (v) app.run("dim.rename", { kind: kind, id: d.id, name: v }, { ok: "Renamed." }); }); } }),
            ui.btn(d.off ? "Restore" : "Retire", { size: "sm", kind: "ghost", onClick: function () { app.run("dim.archive", { kind: kind, id: d.id, off: !d.off }, { ok: d.off ? "Restored." : "Retired — past entries keep it." }); } })) : ""; } }] })
          : ui.empty("None yet", k[2], "layers"),
        foot: [h("span", null, k[2])] }));
    });
    return wrap;
  }

  /* --------------------------------------------------------------- Access */
  var ROLE_LABEL = { admin: "Administrator", user: "Member", viewer: "Read-only" };
  var ROLE_HELP = { admin: "Everything a member can do, plus settings, budgets and who has access.", user: "Record and approve transactions.", viewer: "See everything; change nothing." };
  function access(ctx) {
    var app = ctx.app, E = ctx.E, wrap = h("div"), body = h("div");
    if (!app.live) return ui.card({ body: ui.empty("Access is managed on the real books", "The test books have no people.", "users") });
    if (!E.can("company.update", app.actor()).ok) return ui.card({ body: ui.empty("Only administrators manage access", "Ask an administrator to add or change who can use OC EFM.", "lock") });
    function load() {
      app.api("GET", "/api/v1/efm/access").then(function (r) {
        if (r.status !== 200) { local.accessErr = (r.body && r.body.error && r.body.error.message) || "Couldn't load who has access."; local.access = null; } else { local.access = r.body.access; local.accessErr = null; }
        draw();
      }, function () { local.accessErr = "Couldn't reach the server."; draw(); });
    }
    function set(email, role, done) {
      app.api("PUT", "/api/v1/efm/access", { email: email, role: role }).then(function (r) {
        if (r.status !== 200) { ui.toast((r.body && r.body.error && r.body.error.message) || "That didn't work.", { err: true }); return; }
        local.access = r.body.access; ui.toast(role ? "Access updated." : "Access removed."); if (done) done(); draw();
      }, function () { ui.toast("Couldn't reach the server.", { err: true }); });
    }
    function draw() {
      ui.clear(body);
      if (local.accessErr) { body.appendChild(ui.empty("Couldn't load this", local.accessErr, "alert")); return; }
      if (!local.access) { body.appendChild(h("div", { class: "viz-empty" }, "Loading…")); return; }
      body.appendChild(ui.table({ rows: local.access, sortable: false, columns: [
        { key: "n", label: "Person", cls: "two", render: function (a) { return h("span", null, a.name, h("span", { class: "sub" }, a.email + (a.status === "invited" ? " · invited, not signed in yet" : "") + (app.account && a.id === app.account.id ? " · you" : ""))); } },
        { key: "r", label: "Access", render: function (a) { return ui.select(["admin", "user", "viewer"].map(function (r) { return { id: r, label: ROLE_LABEL[r] }; }), a.role, function (v) { set(a.email, v); }, { label: "Access for " + a.name, width: "170px" }); } },
        { key: "x", label: "", num: true, render: function (a) { return ui.btn("Remove", { size: "sm", kind: "ghost", onClick: function () { ui.confirm({ title: "Remove " + a.name + "?", text: "They lose access to OC EFM right away. Everything they recorded stays.", confirmLabel: "Remove", danger: true }).then(function (y) { if (y) set(a.email, null); }); } }); } }] }));
    }
    var email = h("input", { class: "input", type: "email", placeholder: "their Oplo Account email", "aria-label": "Email" }), role = ui.select(["user", "viewer", "admin"].map(function (r) { return { id: r, label: ROLE_LABEL[r] }; }), "user", function () { help.textContent = ROLE_HELP[role.value]; }, { label: "Access" }), help = h("small", { class: "muted" }, ROLE_HELP.user);
    var give = ui.btn("Give access", { kind: "primary", onClick: function () { if (!email.value.trim()) return; set(email.value, role.value, function () { email.value = ""; }); } });
    wrap.appendChild(ui.card({ title: "Give someone access", meta: "they need an Oplo Account first", body: h("div", { class: "row", style: { gap: "10px", flexWrap: "wrap", alignItems: "flex-end" } }, h("div", { style: { flex: "1", minWidth: "240px" } }, field("Email", email)), h("div", { style: { width: "190px" } }, field("Access", role)), give),
      foot: [help] }));
    wrap.appendChild(h("div", { style: { marginTop: "16px" } }, ui.card({ title: "People with OC EFM", meta: "changes take effect on their next request", flush: true, body: body })));
    load();
    return wrap;
  }

  /* ------------------------------------------------------- The fiscal year
     Closing a year locks every month; then the next year's books are opened with
     everything carried forward — worked out by the server from this year's own
     history. Last year stays exactly as it was, one click away. */
  function yearCard(ctx) {
    var E = ctx.E, app = ctx.app, admin = E.can("year.manage", app.actor()).ok, next = String(+E.fy + 1), nextBook = app.books.filter(function (b) { return String(b.fy) === next; })[0];
    var body = h("div", { class: "stack", style: { gap: "12px" } }), acts = h("div", { class: "row", style: { gap: "8px", flexWrap: "wrap" } });
    if (!E.yearClosed) {
      body.appendChild(h("p", { style: { fontSize: "13px", lineHeight: "1.5" } }, "Fiscal " + E.fy + " is open. When the year's work is done — every journal approved, every bank account reconciled — close it. That locks every month, and nothing can be posted to it again."));
      acts.appendChild(ui.gated("year.manage", {}, "Close fiscal " + E.fy, function () {
        ui.confirm({ title: "Close fiscal " + E.fy + "?", text: "Every month is locked and cannot be reopened. Every journal must be approved and every bank line matched first — if something is outstanding, you'll be told what.", confirmLabel: "Close the year", danger: true })
          .then(function (y) { if (y) app.run("year.close", {}, { ok: "Fiscal " + E.fy + " is closed." }); });
      }, { kind: "primary", icon: "lock" }));
    } else {
      body.appendChild(h("p", { style: { fontSize: "13px", lineHeight: "1.5" } }, "Fiscal " + E.fy + " is closed: every month is locked" + (E.yearClosed.at ? " (" + ui.time(E.yearClosed.at) + ")" : "") + ". " + (nextBook ? "Fiscal " + next + " has begun." : "The next year can begin, carrying forward every balance, vendor, customer, open invoice, asset and bank account.")));
      if (nextBook) acts.appendChild(ui.btn("Open fiscal " + next, { kind: "primary", icon: "arrow", onClick: function () { app.switchBook(nextBook.id); } }));
      else acts.appendChild(ui.gated("year.manage", {}, "Start fiscal " + next, function () {
        ui.confirm({ title: "Start fiscal " + next + "?", text: "The balances at the end of " + E.fy + " become the opening balances of " + next + ", with what's still owed either way, the asset register and the bank accounts. This year's books stay as they are. You'll set the new budget after.", confirmLabel: "Start " + next }).then(function (y) {
          if (!y) return;
          app.api("POST", "/api/v1/efm/books", { from: app.bookId() }).then(function (r) {
            if (r.status === 201) { ui.toast("Fiscal " + next + " has begun."); setTimeout(function () { app.switchBook(r.body.book.id); }, 600); }
            else ui.toast((r.body && r.body.error && r.body.error.message) || "That didn't work.", { err: true, sub: r.body && r.body.error && r.body.error.rule });
          }, function () { ui.toast("Couldn't reach the server.", { err: true }); });
        });
      }, { kind: "primary", icon: "arrow" }));
    }
    body.appendChild(acts);
    return ui.card({ title: "Fiscal year " + E.fy, meta: E.yearClosed ? "closed" : "open", span: 12, body: body });
  }

  /* ------------------------------------------------------------- The books */
  function books(ctx) {
    var E = ctx.E, app = ctx.app, wrap = h("div", { class: "grid" }), log = E.commandLog || [];
    var head = log.length ? log[log.length - 1].hash : "", state = h("span");
    function verify() {
      var r = EFM.verifyCommands(E.bookId || "oplo", log);
      ui.clear(state); state.appendChild(r.ok ? h("span", { class: "ef-ok" }, ui.icon("check", "sm"), "Every link checks out") : h("span", { class: "ef-msg" }, ui.icon("alert", "sm"), "Broken at command " + r.at));
    }
    wrap.appendChild(ui.card({ title: E.bookName || "The books", meta: "fiscal " + E.fy, span: 7, body: h("div", { class: "stack", style: { gap: "12px" } },
      h("div", { class: "kv" }, h("div", null, h("span", null, "Book"), h("b", null, E.bookId || "test")), h("div", null, h("span", null, "Commands saved"), h("b", null, app.live ? String(log.length) : "—")), h("div", null, h("span", null, "Entities"), h("b", null, String(E.entities.length))), h("div", null, h("span", null, "Engine"), h("b", null, "v" + EFM.ENGINE_VERSION))),
      head ? h("div", null, h("div", { class: "muted", style: { fontSize: "12px", marginBottom: "4px" } }, "Latest link in the chain"), h("div", { class: "au-hash" }, head)) : null,
      h("div", { class: "row" }, ui.btn("Verify the chain", { icon: "shield", onClick: verify }), state)),
      foot: [h("span", null, "Every change is saved on the server, in order, and can't be edited or removed.")] }));
    if (app.live) wrap.appendChild(yearCard(ctx));
    wrap.appendChild(ui.card({ title: "Take your data with you", meta: "your books are yours", span: 5, body: h("div", { class: "stack", style: { gap: "10px" } },
      h("p", { style: { fontSize: "13px", lineHeight: "1.5" } }, "Everything in OC EFM exports to CSV: the statements, the journals, the ledger, aging, the asset register."),
      h("div", { class: "row", style: { gap: "8px", flexWrap: "wrap" } }, ui.btn("All journals", { icon: "download", onClick: function () { EFM.records.exportJournals(); } }), ui.btn("Trial balance", { icon: "download", onClick: function () { app.navigate("/ledger?tab=tb"); } }), ui.btn("Audit trail", { icon: "download", onClick: function () { app.navigate("/audit"); } }))) }));
    return wrap;
  }
})(window);
