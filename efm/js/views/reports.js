/* ==========================================================================
   OC EFM — Reports.

   The three statements, laid out the way an accountant expects to read
   them, for any entity or the consolidated group, for a month, a quarter or
   the year, against the prior period or the budget. Every figure opens the
   ledger lines it adds up; nothing on this page is typed in.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;

  var RANGES = [{ id: "month", label: "Month" }, { id: "qtd", label: "Quarter to date" }, { id: "ytd", label: "Year to date" }];
  var MONTH_WORDS = ["", "month", "two months", "three months", "four months", "five months", "six months", "seven months", "eight months", "nine months", "ten months", "eleven months", "twelve months"];

  EFM.view("reports", {
    title: "Reports", icon: "report",
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, q = ctx.query, scope = ctx.scope;
      var r = q.get("r") || "is";
      var p = q.get("p") || E.lastClosedPeriod();
      var range = q.get("range") || "month";
      var compare = q.get("compare") || (r === "is" ? "budget" : "prior");
      var view = scope === "GROUP" && r !== "cf" ? (q.get("view") || "single") : "single";
      var ps = E.periodsBetween(E.fy + "-01", E.currentPeriod()).reverse();

      var page = h("div");
      page.appendChild(ui.pageHead("Reports", "The statements, straight from the ledger. Click any figure to see the lines behind it.", []));

      var tools = h("div", { class: "rp-tools" },
        ui.seg([{ id: "is", label: "Income statement" }, { id: "bs", label: "Balance sheet" }, { id: "cf", label: "Cash flow" }], r, function (v) { app.setQuery({ r: v, compare: null }); }, { label: "Statement" }),
        ui.select(ps.map(function (x) { return { id: x, label: ui.period(x, true) + (E.periodStatus(scope === "GROUP" ? "US" : scope, x) === "open" ? " · open" : "") }; }), p, function (v) { app.setQuery({ p: v }); }, { label: "Period", width: "180px" }),
        r !== "bs" ? ui.seg(RANGES, range, function (v) { app.setQuery({ range: v === "month" ? null : v }); }, { label: "Range" }) : null,
        r === "is" && view === "single" ? ui.seg([{ id: "budget", label: "vs budget" }, { id: "prior", label: "vs prior period" }, { id: "none", label: "No comparison" }], compare, function (v) { app.setQuery({ compare: v }); }, { label: "Compare" }) : null,
        scope === "GROUP" && r !== "cf" ? ui.seg([{ id: "single", label: "Consolidated" }, { id: "entities", label: "By entity" }], view, function (v) { app.setQuery({ view: v === "single" ? null : v }); }, { label: "Layout" }) : null,
        h("span", { class: "sp", style: { flex: "1" } }),
        ui.btn("Export CSV", { size: "sm", icon: "download", onClick: function () { exportCsv(); } }),
        ui.btn("Print", { size: "sm", onClick: function () { window.print(); } }));
      page.appendChild(tools);

      if (p === E.currentPeriod()) page.appendChild(h("div", { class: "banner" }, ui.icon("info", "sm"),
        h("span", null, ui.period(p, true) + " is open — these figures are preliminary until the close. Revenue recognition, accruals and depreciation for the month run during the close.")));

      var from = range === "ytd" || r === "bs" ? E.fy + "-01" : range === "qtd" ? E.quarterStart(p) : p;
      var built = r === "bs" ? balanceSheet(ctx, p, view) : r === "cf" ? cashFlow(ctx, from, p, range) : incomeStatement(ctx, from, p, range, compare, view);
      page.appendChild(built.node);

      function exportCsv() {
        var name = "oc-efm-" + { is: "income-statement", bs: "balance-sheet", cf: "cash-flow" }[r] + "-" + (scope === "GROUP" ? "group" : scope.toLowerCase()) + "-" + p + ".csv";
        ui.csv(name, built.csv);
      }
      return page;
    }
  });

  function span(E, from, to) {
    var n = E.periodsBetween(from, to).length;
    return "For the " + (n === 1 ? "month" : MONTH_WORDS[n]) + " ended " + ui.date(E.lastDay(to), "full");
  }
  function currencyNote(ctx) { return ctx.scope === "GROUP" ? "US dollars · consolidated" : E_().entity[ctx.scope].currency + " · " + E_().entity[ctx.scope].name; }
  function E_() { return EFM.app.E; }
  function prevRange(E, from, to) {
    var n = E.periodsBetween(from, to).length;
    return { from: E.addMonths(from, -n), to: E.addMonths(to, -n) };
  }

  /* Draws a statement table. cols: [{ label, sub, values: {rowId: number}, kind:"amount"|"pct"|"delta", drill: {from,to,entity} }] */
  function sheet(ctx, rows, cols, o) {
    o = o || {};
    var E = ctx.E, app = ctx.app, c = o.currency || app.scopeCurrency();
    var t = h("table", { class: "fs" });
    var hr = h("tr", null, h("th", null, ""));
    cols.forEach(function (col) { hr.appendChild(h("th", { class: col.sep ? "sepcol" : "" }, col.label, col.sub ? h("small", null, col.sub) : null)); });
    t.appendChild(h("thead", null, hr));
    var tb = h("tbody");
    rows.forEach(function (row) {
      var tr = h("tr", { class: row.kind + (o.icRows && o.icRows[row.id] ? " ic" : "") });
      tr.appendChild(h("td", null, row.label));
      cols.forEach(function (col) {
        var td = h("td", { class: col.sep ? "sepcol" : "" });
        if (row.kind === "head") { tr.appendChild(td); return; }
        var v = col.values[row.id];
        if (row.kind === "ratio" || col.kind === "pct") {
          td.textContent = v == null || !isFinite(v) ? "—" : (v * 100).toFixed(1) + "%";
          if (col.kind === "pct" && v != null && isFinite(v) && row.kind !== "ratio") td.className += v < 0 ? " neg" : "";
        } else if (v == null) td.textContent = "";
        else {
          td.textContent = v === 0 && row.kind === "line" ? "—" : E.fmt(v, c, { dp: col.dp != null ? col.dp : 0 });
          // Red when it hurts: revenue under, expense over.
          if (col.kind === "delta" && v !== 0) td.className += (v < 0 === !col.invertFor(row) ? " neg" : "");
          var accts = row.accounts && row.accounts.filter(function (a) { return /^\d/.test(a); });
          if (col.drill && accts && accts.length && v !== 0) {
            td.classList.add("drill");
            td.tabIndex = 0;
            td.title = "Show the lines";
            var go = function () {
              app.open({ kind: "lines", id: "rp-" + row.id + "-" + col.drill.from + col.drill.to + (col.drill.entity || ""), q: { entity: col.drill.entity || ctx.scope, accounts: accts, from: col.drill.from, to: col.drill.to, title: row.label + " · " + (col.drill.from === col.drill.to ? ui.period(col.drill.to) : ui.period(col.drill.from) + "–" + ui.period(col.drill.to)) } });
            };
            td.addEventListener("click", go);
            td.addEventListener("keydown", function (ev) { if (ev.key === "Enter") go(); });
          }
        }
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    var csv = [[""].concat(cols.map(function (col) { return col.label + (col.sub ? " " + col.sub : ""); }))];
    rows.forEach(function (row) {
      csv.push([row.label].concat(cols.map(function (col) {
        var v = col.values[row.id];
        if (row.kind === "head" || v == null) return "";
        if (row.kind === "ratio" || col.kind === "pct") return isFinite(v) ? (v * 100).toFixed(1) + "%" : "";
        return (v / Math.pow(10, E.dp(c))).toFixed(E.dp(c));
      })));
    });
    return { table: h("div", { class: "rp-sheet" }, t), csv: csv };
  }
  function values(rows) { var o = {}; rows.forEach(function (r) { o[r.id] = r.value; }); return o; }
  function titled(title, sub, note, table, checks) {
    var card = h("section", { class: "card" }, h("div", { class: "rp-title" }, h("h2", null, title), h("p", null, sub + " · " + note)), table);
    if (checks) card.appendChild(h("div", { class: "rp-check" }, checks));
    return card;
  }
  function check(ok, yes, no) { return h("span", { class: ok ? "ok" : "no" }, ui.icon(ok ? "check" : "alert", "sm"), ok ? yes : no); }

  /* ---------------------------------------------------- Income statement */
  function incomeStatement(ctx, from, to, range, compare, view) {
    var E = ctx.E, scope = ctx.scope, group = scope === "GROUP";
    var opts = { group: group, hideIC: group };
    if (view === "entities") return isByEntity(ctx, from, to);
    var cur = E.layout("is", E.measure(scope, from, to), opts);
    var cols = [{ label: rangeLabel(E, from, to), sub: null, values: values(cur), drill: { from: from, to: to } }];
    if (compare === "budget") {
      var bm = budgetMap(E, scope, from, to);
      var bud = E.layout("is", bm, opts);
      var bv = values(bud), cv = values(cur), diff = {}, pct = {};
      cur.forEach(function (r) { if (r.kind !== "head" && r.kind !== "ratio") { diff[r.id] = cv[r.id] - (bv[r.id] || 0); pct[r.id] = bv[r.id] ? (cv[r.id] - bv[r.id]) / Math.abs(bv[r.id]) : null; } });
      cols.push({ label: "Budget", values: bv, sep: true });
      cols.push({ label: "Variance", values: diff, kind: "delta", invertFor: expenseRow });
      cols.push({ label: "%", values: pct, kind: "pct" });
    } else if (compare === "prior") {
      var pr = prevRange(E, from, to);
      if (pr.from >= E.fy + "-01") {
        var prev = E.layout("is", E.measure(scope, pr.from, pr.to), opts);
        var pv = values(prev), cv2 = values(cur), d2 = {}, p2 = {};
        cur.forEach(function (r) { if (r.kind !== "head" && r.kind !== "ratio") { d2[r.id] = cv2[r.id] - (pv[r.id] || 0); p2[r.id] = pv[r.id] ? (cv2[r.id] - pv[r.id]) / Math.abs(pv[r.id]) : null; } });
        cols.push({ label: rangeLabel(E, pr.from, pr.to), values: pv, sep: true, drill: { from: pr.from, to: pr.to } });
        cols.push({ label: "Change", values: d2, kind: "delta", invertFor: expenseRow });
        cols.push({ label: "%", values: p2, kind: "pct" });
      }
    }
    if (range !== "ytd") {
      var ytd = E.layout("is", E.measure(scope, E.fy + "-01", to), opts);
      cols.push({ label: "Year to date", sub: "Jan–" + ui.period(to).slice(0, 3), values: values(ytd), sep: true, drill: { from: E.fy + "-01", to: to } });
      if (compare === "budget") cols.push({ label: "YTD budget", values: values(E.layout("is", budgetMap(E, scope, E.fy + "-01", to), opts)) });
    }
    var s = sheet(ctx, cur, cols);
    var ni = values(cur).ni;
    var sumCheck = Math.abs(values(cur).pti - values(cur)["8000"] - ni) < 2;
    return { node: titled("Income statement", span(E, from, to), currencyNote(ctx), s.table,
      [check(sumCheck, "Net income ties to the ledger", "Net income does not tie"), h("span", null, " · " + (group ? "intercompany revenue and fees eliminated; income translated at each month's average rate" : "includes intercompany recharges"))]), csv: s.csv };
  }
  function expenseRow(row) { return /^(5|6|8|cor|opx)/.test(row.id) || row.id === "corT" || row.id === "opxT"; }
  function rangeLabel(E, from, to) { return from === to ? ui.period(to) : ui.period(from).slice(0, 3) + "–" + ui.period(to); }
  function budgetMap(E, scope, from, to) {
    var m = {};
    E.accountList.forEach(function (a) { if (!a.bs) { var v = E.budgetFor(scope, null, a.id, from, to); if (v) m[a.id] = v; } });
    return m;
  }

  function isByEntity(ctx, from, to) {
    var E = ctx.E, c = E.consolidate(from, to);
    var cols = E.entities.map(function (e) { return { label: e.short, sub: "from " + e.currency, values: values(E.layout("is", c.by[e.id].pl, { group: true })), drill: { from: from, to: to, entity: e.id } }; });
    cols.push({ label: "Eliminations", values: values(E.layout("is", c.elimPL, { group: true })), sep: true });
    cols.push({ label: "Group", values: values(E.layout("is", c.group, { group: true })), sep: true });
    var rows = E.layout("is", c.group, { group: true });
    var s = sheet(ctx, rows, cols, { icRows: { "4900": 1, "6900": 1 }, currency: "USD" });
    return { node: titled("Consolidating income statement", span(E, from, to), "US dollars", s.table,
      [h("span", null, "Each entity translated at its months' average rates. Intercompany revenue and service fees cancel in Eliminations.")]), csv: s.csv };
  }

  /* -------------------------------------------------------- Balance sheet */
  function balanceSheet(ctx, p, view) {
    var E = ctx.E, scope = ctx.scope, group = scope === "GROUP";
    if (view === "entities") return bsByEntity(ctx, p);
    var prior = E.addMonths(p, -1) >= E.fy + "-01" ? E.addMonths(p, -1) : null;
    var cur = E.layout("bs", E.measure(scope, E.fy + "-01", p), { group: group });
    var cols = [{ label: ui.date(E.lastDay(p), "year"), values: values(cur), drill: { from: E.fy + "-01", to: p } }];
    if (prior) {
      var pr = values(E.layout("bs", E.measure(scope, E.fy + "-01", prior), { group: group })), cv = values(cur), d = {};
      cur.forEach(function (r) { if (r.kind !== "head") d[r.id] = cv[r.id] - (pr[r.id] || 0); });
      cols.push({ label: ui.date(E.lastDay(prior), "year"), values: pr, sep: true, drill: { from: E.fy + "-01", to: prior } });
      cols.push({ label: "Change", values: d, kind: "delta", invertFor: function () { return false; } });
    }
    var open = E.layout("bs", group ? E.openingGroup() : openingMap(E, scope), { group: group });
    cols.push({ label: "Opening", sub: "Jan 1", values: values(open), sep: true });
    var s = sheet(ctx, cur, cols);
    var v = values(cur);
    return { node: titled("Balance sheet", "As of " + ui.date(E.lastDay(p), "full"), currencyNote(ctx), s.table,
      [check(v.ta === v.tle, "Assets equal liabilities plus equity", "Out of balance by " + E.fmt(v.ta - v.tle, ctx.app.scopeCurrency())),
       h("span", null, group ? " · balances at " + ui.period(p) + " closing rates; equity at historical rates; the difference is CTA" : " · current-year earnings stay in equity until the year is closed")]), csv: s.csv };
  }
  function openingMap(E, scope) {
    var m = {};
    E.accountList.forEach(function (a) { if (a.bs) { var v = E.openingBalance(scope, a.id); if (v) m[a.id] = v; } });
    m._ytdPL = 0; m.CTA = 0;
    return m;
  }
  function bsByEntity(ctx, p) {
    var E = ctx.E, c = E.consolidate(E.fy + "-01", p);
    function withPL(m) {
      var o = {}, pl = 0;
      Object.keys(m).forEach(function (k) { o[k] = m[k]; if (E.accounts[k] && !E.accounts[k].bs) pl += m[k]; });
      o._ytdPL = pl;
      return o;
    }
    var cols = E.entities.map(function (e) { return { label: e.short, sub: "from " + e.currency, values: values(E.layout("bs", withPL(c.by[e.id].bs), { group: true })), drill: { from: E.fy + "-01", to: p, entity: e.id } }; });
    cols.push({ label: "Eliminations", values: values(E.layout("bs", withPL(c.elimBS), { group: true })), sep: true });
    cols.push({ label: "Group", values: values(E.layout("bs", c.group, { group: true })), sep: true });
    var rows = E.layout("bs", c.group, { group: true });
    var s = sheet(ctx, rows, cols, { icRows: { "1150": 1, "2150": 1 }, currency: "USD" });
    var ok = cols.every(function (col) { return col.values.ta === col.values.tle; });
    return { node: titled("Consolidating balance sheet", "As of " + ui.date(E.lastDay(p), "full"), "US dollars", s.table,
      [check(ok, "Every column balances", "A column is out of balance"), h("span", null, " · amounts due between entities cancel in Eliminations")]), csv: s.csv };
  }

  /* ------------------------------------------------------------ Cash flow */
  function cashFlow(ctx, from, to, range) {
    var E = ctx.E, scope = ctx.scope;
    var cf = E.cashFlow(scope, from, to);
    var cols = [{ label: rangeLabel(E, from, to), values: values(cf.rows) }];
    if (range !== "ytd") cols.push({ label: "Year to date", sub: "Jan–" + ui.period(to).slice(0, 3), values: values(E.cashFlow(scope, E.fy + "-01", to).rows), sep: true });
    var rows = cf.rows.map(function (r) { return { id: r.id, label: r.label, kind: r.kind === "line" ? "line" : r.kind, accounts: CF_ACCTS[r.id] }; });
    var s = sheet(ctx, rows, cols.map(function (c) { c.drill = CF_DRILL(E, from, to, c); return c; }));
    return { node: titled("Cash flow statement", span(E, from, to), currencyNote(ctx) + " · indirect method", s.table,
      [check(cf.reconciles, "Reconciles to the change in cash", "Doesn't reconcile — " + E.fmt(cf.unexplained, ctx.app.scopeCurrency()) + " unexplained"),
       h("span", null, scope === "GROUP" ? " · the effect of exchange rates is the change in translated cash the flows don't explain" : " · every balance-sheet movement is classified")]), csv: s.csv };
  }
  var CF_ACCTS = { dar: ["1100"], dpre: ["1200"], dic: ["1150", "2150"], dap: ["2000"], dacc: ["2100"], ddef: ["2200"], dtax: ["2300", "2400", "2500", "2600"], capex: ["1510", "1520", "1530"], debt: ["2700"], dep: ["6700"] };
  function CF_DRILL(E, from, to, col) { return col.label === "Year to date" ? { from: E.fy + "-01", to: to } : { from: from, to: to }; }
})(window);
