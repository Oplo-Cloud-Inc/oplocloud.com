/* ==========================================================================
   OC EFM — Journals.

   Every journal in the ledger, and the one place to write a new one. The
   composer checks the double entry as you type — the same validation the
   engine applies when it posts — so a journal that can't post never gets
   as far as the button.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var local = { q: "", source: "", period: "" };

  var SOURCES = {
    manual: "Manual", accrual: "Accrual", reversal: "Reversal", revrec: "Revenue recognition", dep: "Depreciation",
    ap: "Vendor invoice", "ap-pay": "Vendor payment", ar: "Customer invoice", "ar-pay": "Customer payment", payroll: "Payroll",
    settlement: "Card settlement", ic: "Intercompany", "ic-settle": "Intercompany settlement", fx: "FX revaluation", tax: "Tax provision",
    "tax-pay": "Tax payment", treasury: "Treasury", transfer: "Transfer", cards: "Card statement", "cards-pay": "Card payment",
    amort: "Prepaid amortization", bank: "Bank entry", open: "Opening balances"
  };
  var STATUS = [
    { id: "", label: "All" }, { id: "pending", label: "Waiting for approval" }, { id: "draft", label: "Drafts" },
    { id: "posted", label: "Posted" }, { id: "reversal", label: "Reversals" }, { id: "rejected", label: "Rejected" }
  ];
  function matchStatus(j, st) {
    if (!st) return j.status !== "discarded";
    if (st === "reversal") return j.source.type === "reversal" || !!j.reversedBy;
    return j.status === st;
  }

  EFM.view("journals", {
    title: "Journals", icon: "journal",
    openId: function (id) { EFM.app.open({ kind: "journal", id: id }); },
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, q = ctx.query;
      if (q.get("new")) setTimeout(function () { app.setQuery({ new: null }); composer(ctx); }, 0);
      var st = q.get("status") || "";
      if (q.get("source") && !local.sourceFromUrl) { local.source = q.get("source"); local.sourceFromUrl = true; }
      var js = E.journalOrder.map(function (id) { return E.journals[id]; }).filter(function (j) { return app.inScope(j.entity); });

      var page = h("div");
      page.appendChild(ui.pageHead("Journals", "Every entry in the ledger. Posted journals are permanent — a correction is a reversal that points back to what it corrects.",
        [ui.gated("journal.create", {}, "New journal", function () { composer(ctx); }, { kind: "primary", icon: "plus" })]));

      var pending = js.filter(function (j) { return j.status === "pending"; });
      if (pending.length) page.appendChild(h("div", { style: { marginBottom: "16px" } }, pendingCard(ctx, pending)));

      var chips = h("div", { class: "filters" });
      STATUS.forEach(function (s) {
        var n = js.filter(function (j) { return matchStatus(j, s.id); }).length;
        chips.appendChild(ui.chipFilter(s.label, n, st === s.id, function () { app.setQuery({ status: s.id || null }); }));
      });
      page.appendChild(chips);

      var body = h("div");
      page.appendChild(ui.card({ flush: true, body: body }));
      var periods = E.periodsBetween(E.fy + "-01", E.currentPeriod()).reverse();
      var sources = {};
      js.forEach(function (j) { sources[j.source.type] = 1; });

      function draw() {
        ui.clear(body);
        var ql = local.q.toLowerCase();
        var rows = js.filter(function (j) {
          if (!matchStatus(j, st)) return false;
          if (local.source && j.source.type !== local.source) return false;
          if (local.period && j.period !== local.period) return false;
          if (ql && (j.id + " " + j.memo).toLowerCase().indexOf(ql) < 0) return false;
          return true;
        });
        body.appendChild(h("div", { class: "bar" },
          ui.searchBox("Search journal number or memo", local.q, function (x) { local.q = x; draw(); body.querySelector("input[type=search]").focus(); }),
          ui.select([{ id: "", label: "Every source" }].concat(Object.keys(SOURCES).filter(function (k) { return sources[k]; }).map(function (k) { return { id: k, label: SOURCES[k] }; })),
            local.source, function (v) { local.source = v; draw(); }, { label: "Source", width: "190px" }),
          ui.select([{ id: "", label: "Every period" }].concat(periods.map(function (p) { return { id: p, label: ui.period(p, true) + (E.periodStatus("US", p) === "open" ? " · open" : "") }; })),
            local.period, function (v) { local.period = v; draw(); }, { label: "Period", width: "180px" }),
          h("span", { class: "sp" }),
          h("span", { class: "muted", style: { fontSize: "12.5px" } }, rows.length.toLocaleString() + " journal" + (rows.length === 1 ? "" : "s"))));
        body.appendChild(ui.table({ rows: rows, sortKey: "id", sortDir: -1, limit: 200, onRow: function (j) { app.open({ kind: "journal", id: j.id }); },
          empty: ui.empty("No journals match", "Clear a filter to see more.", "journal"),
          columns: [
            { key: "id", label: "Journal", cls: "nowrap", sort: function (j) { return j.date + j.id; }, render: function (j) { return h("span", { class: "mono" }, j.id); } },
            { key: "date", label: "Date", cls: "nowrap", sort: function (j) { return j.date; }, render: function (j) { return ui.date(j.date); } },
            ctx.scope === "GROUP" ? { key: "e", label: "Entity", sort: function (j) { return j.entity; }, render: function (j) { return E.entity[j.entity].short; } } : null,
            { key: "memo", label: "Memo", cls: "two jn-memo", render: function (j) { return h("span", null, h("span", { class: "jn-m" }, j.memo), h("span", { class: "sub" }, SOURCES[j.source.type] || j.source.label)); } },
            { key: "st", label: "Status", sort: function (j) { return j.status; }, render: function (j) {
              if (j.reversedBy) return ui.status("posted", "Reversed");
              return ui.status(j.status, j.status === "pending" ? "Waiting · " + (j.needs === "cfo" ? "CFO" : "Controller") : null); } },
            { key: "by", label: "Prepared by", render: function (j) { return j.createdBy ? ui.who(j.createdBy) : h("span", { class: "faint" }, "—"); } },
            { key: "t", label: "Amount", num: true, sort: function (j) { return E.usdOf(j.entity, j.total, j.period); }, render: function (j) { return E.fmt(j.total, E.entity[j.entity].currency); } }
          ].filter(Boolean) }));
      }
      draw();
      return page;
    }
  });

  function pendingCard(ctx, pending) {
    var E = ctx.E, app = ctx.app;
    var list = h("div", { class: "att" });
    pending.forEach(function (j) {
      var usd = E.usdOf(j.entity, j.total, j.period, "avg");
      var can = E.can("journal.approve", app.actor(), { createdBy: j.createdBy, usd: usd });
      var reviewer = usd > E.limits.journal.controller * 100 ? E.people.dana : E.people.marcus;
      list.appendChild(h("div", { class: "att-i" }, ui.avatar(j.createdBy, true),
        h("button", { type: "button", class: "grow", style: { textAlign: "left" }, on: { click: function () { app.open({ kind: "journal", id: j.id }); } } },
          h("div", { class: "t" }, j.memo), h("div", { class: "x" }, j.id + " · " + E.entity[j.entity].short + " · " + ui.period(j.period) + " · prepared by " + ui.person(j.createdBy).name + " · " + j.lines.length + " lines" + (j.attachments && j.attachments.length ? " · " + j.attachments.length + " attachment" : ""))),
        h("div", { class: "a" }, h("span", { class: "amt" }, E.fmt(j.total, E.entity[j.entity].currency)),
          can.ok ? ui.btn("Approve", { size: "sm", kind: "primary", onClick: function () { app.run("journal.approve", { id: j.id }, { ok: j.id + " approved and posted to " + ui.period(j.period) + "." }); } })
                 : ui.btn("Simulate " + reviewer.name.split(" ")[0], { size: "sm", kind: "ghost", icon: "users", onClick: function () {
                   app.run("journal.approve", { id: j.id, simulated: true }, { actor: reviewer, ok: reviewer.name + " approved " + j.id + " (simulated)." }); } }),
          ui.btn("Review", { size: "sm", onClick: function () { app.open({ kind: "journal", id: j.id }); } }))));
    });
    return ui.card({ title: "Waiting for approval", meta: pending.length + " · a second person approves every manual journal", flush: true, body: list });
  }

  /* ============================================================ Composer */
  function composer(ctx) {
    var E = ctx.E, app = ctx.app;
    var st = {
      entity: ctx.scope === "GROUP" ? "US" : ctx.scope, date: E.asOf, memo: "", reverseOn: "", files: [],
      lines: [blank(), blank()]
    };
    function blank() { return { account: "", dept: "", product: "", project: "", memo: "", dr: "", cr: "" }; }
    function cur() { return E.entity[st.entity].currency; }
    function dp() { return E.dp(cur()); }

    var box = h("div", { class: "jc" });
    var footEl = h("div", { class: "jc-foot" });
    var m = ui.modal({ title: "New journal", text: "A manual journal posts once somebody other than you approves it. Control accounts — receivables, payables, fixed assets — take postings only from their own ledgers.",
      body: box, cls: "xl", actions: [
        { label: "Cancel" },
        { label: "Save draft", fn: function () { return save(false); } },
        { label: "Submit for approval", kind: "primary", fn: function () { return save(true); } }
      ], foot: footEl });

    function field(label, el, cls) { return h("label", { class: "field " + (cls || "") }, h("span", null, label), el); }
    function head() {
      var ent = ui.select(E.entities.map(function (e) { return { id: e.id, label: e.name + " · " + e.currency }; }), st.entity, function (v) { st.entity = v; draw(); }, { label: "Entity" });
      var date = h("input", { type: "date", class: "input", value: st.date, min: E.fy + "-01-01", max: E.fy + "-12-31" });
      date.addEventListener("change", function () { st.date = date.value; check(); });
      var memo = h("input", { class: "input", value: st.memo, placeholder: "What this journal does and why" });
      memo.addEventListener("input", function () { st.memo = memo.value; check(); });
      var rev = h("input", { type: "date", class: "input", value: st.reverseOn, min: st.date });
      rev.addEventListener("change", function () { st.reverseOn = rev.value; });
      var file = h("input", { type: "file", class: "sr", multiple: true, id: "jc-file" });
      var fileLbl = h("label", { for: "jc-file", class: "btn", style: { width: "100%" } }, ui.icon("clip"), h("span", null, st.files.length ? st.files.length + " attached" : "Attach"));
      file.addEventListener("change", function () {
        st.files = Array.prototype.map.call(file.files, function (f) { return { name: f.name, size: Math.max(1, Math.round(f.size / 1024)) + " KB" }; });
        fileLbl.lastChild.textContent = st.files.length ? st.files.length + " attached" : "Attach";
      });
      return h("div", { class: "jc-head" },
        field("Entity", ent), field("Date", date), field("Memo", memo),
        field("Reverses on", rev), field("Evidence", h("div", null, file, fileLbl)));
    }

    /* The account picker: grouped like the chart, control accounts shown but not choosable. */
    function acctSelect(l) {
      var s = h("select", { class: "input", "aria-label": "Account" });
      s.appendChild(h("option", { value: "" }, "Choose an account"));
      E.headers.forEach(function (g) {
        var og = h("optgroup", { label: g.id + " · " + g.name });
        g.accounts.forEach(function (id) {
          var a = E.accounts[id];
          var o = h("option", { value: id }, id + " " + a.name + (a.control ? " — use its ledger" : ""));
          if (a.control) o.disabled = true;
          if (id === l.account) o.selected = true;
          og.appendChild(o);
        });
        s.appendChild(og);
      });
      s.addEventListener("change", function () { l.account = s.value; draw(); });
      return s;
    }
    function dimSelect(kind, l, label) {
      var s = h("select", { class: "input", "aria-label": label });
      s.appendChild(h("option", { value: "" }, "—"));
      E.dims[kind].forEach(function (d) { var o = h("option", { value: d.id }, d.name); if (l[kind] === d.id) o.selected = true; s.appendChild(o); });
      s.addEventListener("change", function () { l[kind] = s.value; check(); });
      return s;
    }
    function amount(l, side) {
      var i = h("input", { class: "input num", inputmode: "decimal", placeholder: "0." + "0".repeat(Math.max(0, dp())), value: l[side], "aria-label": side === "dr" ? "Debit" : "Credit" });
      if (dp() === 0) i.placeholder = "0";
      i.addEventListener("input", function () {
        l[side] = i.value;
        if (i.value) { l[side === "dr" ? "cr" : "dr"] = ""; var other = i.closest("tr").querySelector(side === "dr" ? ".jc-cr input" : ".jc-dr input"); if (other) other.value = ""; }
        check();
      });
      i.addEventListener("blur", function () {
        var v = ui.parseMoney(i.value, dp());
        if (i.value && !isNaN(v)) { i.value = ui.majorOf(Math.abs(v), dp()).replace(/\B(?=(\d{3})+(?!\d))/g, ","); l[side] = i.value; }
      });
      return i;
    }
    function linesTable() {
      var t = h("table", { class: "tbl jc-lines" });
      t.appendChild(h("thead", null, h("tr", null, h("th", null, "Account"), h("th", null, "Department"), h("th", null, "Product"), h("th", null, "Project"),
        h("th", null, "Line memo"), h("th", { class: "num" }, "Debit"), h("th", { class: "num" }, "Credit"), h("th", null, ""))));
      var tb = h("tbody");
      st.lines.forEach(function (l, k) {
        var a = E.accounts[l.account];
        var needDept = a && a.type === "expense" && !a.ic && a.group !== "other" && a.group !== "tax";
        var dsel = dimSelect("dept", l, "Department");
        if (needDept && !l.dept) dsel.classList.add("need");
        tb.appendChild(h("tr", null,
          h("td", { class: "jc-acct" }, acctSelect(l)), h("td", null, dsel), h("td", null, dimSelect("product", l, "Product")), h("td", null, dimSelect("project", l, "Project")),
          h("td", null, (function () { var i = h("input", { class: "input", value: l.memo, placeholder: "Optional", "aria-label": "Line memo" }); i.addEventListener("input", function () { l.memo = i.value; }); return i; })()),
          h("td", { class: "jc-dr" }, amount(l, "dr")), h("td", { class: "jc-cr" }, amount(l, "cr")),
          h("td", null, st.lines.length > 2 ? ui.btn(null, { size: "sm", kind: "ghost", icon: "x", label: "Remove line", onClick: function () { st.lines.splice(k, 1); draw(); } }) : null)));
      });
      t.appendChild(tb);
      return t;
    }
    function toJournal() {
      var bad = null;
      var lines = st.lines.map(function (l, k) {
        var dr = l.dr ? ui.parseMoney(l.dr, dp()) : 0, cr = l.cr ? ui.parseMoney(l.cr, dp()) : 0;
        if (isNaN(dr) || isNaN(cr)) bad = bad || "Line " + (k + 1) + ": that isn't an amount.";
        if (dr < 0 || cr < 0) bad = bad || "Line " + (k + 1) + ": use the other column instead of a negative amount.";
        var dims = {};
        ["dept", "product", "project"].forEach(function (d) { if (l[d]) dims[d] = l[d]; });
        return { account: l.account, dr: dr || 0, cr: cr || 0, dims: dims, memo: l.memo };
      });
      return { bad: bad, j: { entity: st.entity, date: st.date, memo: st.memo, lines: lines } };
    }
    function check() {
      var t = toJournal(), dr = 0, cr = 0;
      t.j.lines.forEach(function (l) { dr += l.dr || 0; cr += l.cr || 0; });
      var msg = t.bad;
      var used = t.j.lines.filter(function (l) { return l.account || l.dr || l.cr; });
      if (!msg && used.length && used.some(function (l) { return !l.account; })) msg = "Choose an account for every line with an amount.";
      if (!msg) { var r = E.validateJournal({ entity: t.j.entity, date: t.j.date, lines: t.j.lines.filter(function (l) { return l.account || l.dr || l.cr; }) }); if (r) msg = r.message + (r.rule ? " " + r.rule : ""); }
      if (!msg && !st.memo.trim()) msg = "Add a memo — it's what the approver reads first.";
      ui.clear(footEl);
      var ok = dr === cr && dr > 0;
      footEl.appendChild(h("span", { class: "jc-tot" }, "Debits ", h("b", { class: "num" }, E.fmt(dr, cur()))));
      footEl.appendChild(h("span", { class: "jc-tot" }, "Credits ", h("b", { class: "num" }, E.fmt(cr, cur()))));
      footEl.appendChild(h("span", { class: "balanced" + (ok ? "" : " no") }, ui.icon(ok ? "check" : "alert", "sm"), ok ? "Balanced" : dr || cr ? "Off by " + E.fmt(Math.abs(dr - cr), cur()) : "No amounts yet"));
      if (msg && (dr || cr || st.memo)) footEl.appendChild(h("span", { class: "jc-msg" }, msg));
      st.valid = !msg && ok;
      var btns = m.box.querySelectorAll(".modal-f .btn");
      if (btns.length) { btns[btns.length - 1].disabled = !st.valid; btns[btns.length - 2].disabled = !st.valid; }
      return st.valid;
    }
    function save(submit) {
      if (!check()) return true;
      var t = toJournal();
      var j = app.run("journal.create", { entity: t.j.entity, date: t.j.date, memo: st.memo.trim(), submit: submit, reverseOn: st.reverseOn || null, attachments: st.files,
        lines: t.j.lines.filter(function (l) { return l.account; }) }, { ok: function (r) { return submit ? r.id + " is waiting for a second approver." : r.id + " saved as a draft."; } });
      if (!j) return true;
      setTimeout(function () { app.open({ kind: "journal", id: j.id }); }, 60);
      return false;
    }
    function draw() {
      ui.clear(box);
      box.appendChild(head());
      box.appendChild(linesTable());
      box.appendChild(h("div", { class: "row", style: { marginTop: "10px" } },
        ui.btn("Add line", { size: "sm", icon: "plus", onClick: function () { st.lines.push(blank()); draw(); var s = box.querySelectorAll(".jc-acct select"); s[s.length - 1].focus(); } }),
        ui.btn("Balance the last line", { size: "sm", kind: "ghost", onClick: function () {
          var t = toJournal(), dr = 0, cr = 0;
          t.j.lines.slice(0, -1).forEach(function (l) { dr += l.dr || 0; cr += l.cr || 0; });
          var last = st.lines[st.lines.length - 1], d = dr - cr;
          last.dr = d < 0 ? ui.majorOf(-d, dp()) : ""; last.cr = d > 0 ? ui.majorOf(d, dp()) : "";
          draw();
        } }),
        h("span", { class: "sp" }),
        h("span", { class: "muted", style: { fontSize: "12px" } }, "Amounts in " + cur() + " · " + E.periodLabel(st.date.slice(0, 7), true) + " is " + E.periodStatus(st.entity, st.date.slice(0, 7)))));
      check();
    }
    draw();
    setTimeout(function () { var f = box.querySelector("input:not([type=date]):not([type=file])"); if (f) f.focus(); }, 60);
  }
  EFM.composeJournal = function () { composer({ E: EFM.app.E, app: EFM.app, scope: EFM.app.scope }); };
})(window);
