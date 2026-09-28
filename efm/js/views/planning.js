/* ==========================================================================
   OC EFM — Forecast & scenarios.

   A driver-based model of the next fifteen months, started from what the
   ledger says the last three closed months looked like. Three scenarios,
   each a handful of drivers a finance team actually argues about; move one
   and every chart and total follows. It's a planning model: nothing here
   posts to the ledger.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var KEY = "efm.planning.v1";

  var DRIVERS = [
    { id: "gSelf", label: "Self-serve growth", unit: "% a month", min: -2, max: 8, step: 0.1, hint: "Oplo+ and Workspace seats" },
    { id: "gEnt", label: "Enterprise growth", unit: "% a month", min: -2, max: 6, step: 0.1, hint: "new contracts and expansion" },
    { id: "churn", label: "Enterprise churn", unit: "% a month", min: 0, max: 4, step: 0.1, hint: "contracts lost" },
    { id: "gUse", label: "API usage growth", unit: "% a month", min: -3, max: 12, step: 0.1, hint: "Roxan and OMaps APIs" },
    { id: "hires", label: "Net new hires", unit: "a month", min: -5, max: 20, step: 1, hint: "across the group" },
    { id: "hireCost", label: "Loaded cost per hire", unit: "$K a month", min: 6, max: 30, step: 0.5, hint: "salary, taxes, benefits" },
    { id: "cloud", label: "Cloud cost", unit: "% of revenue", min: 5, max: 25, step: 0.1, hint: "AWS, Google Cloud, Cloudflare" },
    { id: "mkt", label: "Marketing spend", unit: "% vs. run-rate", min: -60, max: 100, step: 5, hint: "advertising and events" },
    { id: "gOther", label: "Other costs growth", unit: "% a month", min: -2, max: 4, step: 0.1, hint: "software, rent, legal, travel" }
  ];
  var PRESETS = {
    base:      { name: "Base", color: "var(--s1)", blurb: "Recent trends continue.", d: { gSelf: 2.8, gEnt: 1.5, churn: 0.4, gUse: 4, hires: 4, hireCost: 14, cloud: 0, mkt: 0, gOther: 0.5 } },
    expansion: { name: "Expansion", color: "var(--s2)", blurb: "Roxan 3 lands; hire ahead of demand.", d: { gSelf: 4.2, gEnt: 2.8, churn: 0.3, gUse: 7, hires: 10, hireCost: 15, cloud: 0, mkt: 40, gOther: 1 } },
    downturn:  { name: "Downturn", color: "var(--s3)", blurb: "Demand softens; hiring freezes.", d: { gSelf: 0.4, gEnt: 0, churn: 1.3, gUse: 1, hires: 0, hireCost: 14, cloud: 0, mkt: -35, gOther: 0 } }
  };
  var ORDER = ["base", "expansion", "downturn"];
  var state = null;

  function load(baseCloud) {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { s = null; }
    var out = { sel: (s && s.sel) || "base", d: {} };
    ORDER.forEach(function (k) {
      var p = JSON.parse(JSON.stringify(PRESETS[k].d));
      p.cloud = Math.round((baseCloud + (k === "expansion" ? -0.5 : k === "downturn" ? 1 : 0)) * 10) / 10;
      out.d[k] = Object.assign(p, s && s.d && s.d[k] ? s.d[k] : {});
    });
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ sel: state.sel, d: state.d })); } catch (e) { /* the model still works; edits just don't survive a reload */ } }

  /* The run-rate: the average of the last three closed months, from the ledger. */
  function baseline(E) {
    var L = E.lastClosedPeriod(), from = E.addMonths(L, -2);
    function avg(accts) { return E.actualFor("GROUP", null, accts, from, L) / 3; }
    var b = {
      self: -avg(["4000"]), ent: -avg(["4100"]), use: -avg(["4200"]),
      payroll: avg(["6000", "6050"]), cloud: avg(["5000"]), cogsOther: avg(["5100", "5200"]),
      mkt: avg(["6200", "6250"]), other: avg(["6100", "6300", "6400", "6500", "6600", "6650", "6800"]), dep: avg(["6700"]),
      from: from, to: L
    };
    b.rev = b.self + b.ent + b.use;
    b.cloudPct = b.cloud / b.rev * 100;
    b.cogsOtherPct = b.cogsOther / b.rev;
    return b;
  }

  /* Fifteen months, October 2026 to December 2027. */
  function project(E, b, d, cash0) {
    var months = [], cash = cash0, p = E.addMonths(E.currentPeriod(), 1), heads = 0;
    for (var k = 1; k <= 15; k++, p = E.addMonths(p, 1)) {
      var self = b.self * Math.pow(1 + d.gSelf / 100, k);
      var ent = b.ent * Math.pow(1 + (d.gEnt - d.churn) / 100, k);
      var use = b.use * Math.pow(1 + d.gUse / 100, k);
      var rev = self + ent + use;
      var cogs = rev * (d.cloud / 100 + b.cogsOtherPct);
      heads += d.hires;
      var payroll = b.payroll + heads * d.hireCost * 1000 * 100;
      var mkt = b.mkt * (1 + d.mkt / 100);
      var other = b.other * Math.pow(1 + d.gOther / 100, k);
      var opex = payroll + mkt + other + b.dep;
      var oi = rev - cogs - opex;
      // Cash follows profit, plus depreciation back, less equipment and tax.
      var capex = 6000000, tax = oi > 0 ? oi * 0.22 : 0;
      cash += oi - tax + b.dep - capex;
      months.push({ p: p, rev: rev, gp: rev - cogs, opex: opex, oi: oi, cash: cash, heads: heads });
    }
    return months;
  }
  function fy27(ms) { return ms.filter(function (m) { return m.p.slice(0, 4) === "2027"; }); }
  function sum(ms, k) { return ms.reduce(function (s, m) { return s + m[k]; }, 0); }

  EFM.view("planning", {
    title: "Forecast & scenarios", icon: "trend",
    render: function (ctx) {
      var E = ctx.E, app = ctx.app;
      var b = baseline(E), cash0 = E.cashPosition().total;
      if (!state) state = load(b.cloudPct);
      var page = h("div");
      page.appendChild(ui.pageHead("Forecast & scenarios",
        "A driver-based plan for " + ui.period(E.addMonths(E.currentPeriod(), 1)) + " through Dec 2027, started from the ledger's run-rate for " + ui.period(b.from).slice(0, 3) + "–" + ui.period(b.to) + ". Nothing here posts to the ledger.",
        [ui.btn("Export CSV", { icon: "download", onClick: function () { exportCsv(E, b, cash0); } })]));
      if (ctx.scope !== "GROUP") page.appendChild(h("div", { class: "banner info" }, ui.icon("info", "sm"), h("span", null, "The plan is kept for the whole group, in US dollars.")));

      var grid = h("div", { class: "pl-grid" });
      var left = h("div", { class: "pl-drivers" });
      var right = h("div");
      grid.appendChild(left); grid.appendChild(right);
      page.appendChild(grid);

      function drawResults() {
        ui.clear(right);
        var runs = {};
        ORDER.forEach(function (k) { runs[k] = project(E, b, state.d[k], cash0); });
        var sel = runs[state.sel], fy = fy27(sel);
        var low = sel.reduce(function (m, x) { return x.cash < m.cash ? x : m; }, sel[0]);
        right.appendChild(ui.kpis([
          { label: "Revenue", icon: "report", value: E.fmt(Math.round(sum(fy, "rev")), "USD", { compact: true }), sub: "FY2027 · " + ui.pct(sum(fy, "rev") / (b.rev * 12) - 1, 1) + " over run-rate" },
          { label: "Operating income", icon: "trend", value: E.fmt(Math.round(sum(fy, "oi")), "USD", { compact: true }), sub: "FY2027 · " + ui.pct(sum(fy, "oi") / sum(fy, "rev"), 1) + " margin" },
          { label: "Cash at the end", icon: "bank", value: E.fmt(Math.round(sel[sel.length - 1].cash), "USD", { compact: true }), sub: "Dec 2027 · from " + E.fmt(cash0, "USD", { compact: true }) + " today" },
          { label: "Lowest cash", icon: "alert", value: E.fmt(Math.round(low.cash), "USD", { compact: true }), sub: ui.period(low.p) },
          { label: "Net hires", icon: "users", value: (sel[sel.length - 1].heads >= 0 ? "+" : "") + sel[sel.length - 1].heads, sub: "by Dec 2027" }
        ]));
        var labels = sel.map(function (m) { return m.p; });
        var legend = ui.charts.legend(ORDER.map(function (k) { return { label: PRESETS[k].name, color: PRESETS[k].color, kind: "line" }; }));
        var g = h("div", { class: "grid" });
        g.appendChild(ui.card({ title: "Revenue", meta: "a month, by scenario", span: 6, tools: legend,
          body: ui.charts.line({ height: 210, labels: labels, series: ORDER.map(function (k) { return { name: PRESETS[k].name, color: PRESETS[k].color, values: runs[k].map(function (m) { return m.rev; }), endDot: true }; }),
            xFormat: function (p) { return ui.period(p).slice(0, 3) + (p.slice(5) === "01" ? " ’" + p.slice(2, 4) : ""); }, yFormat: function (v) { return E.fmt(v, "USD", { compact: true }); },
            tipFormat: function (v) { return E.fmt(Math.round(v), "USD", { compact: true }); }, tipTitle: function (p) { return ui.period(p, true); }, label: "Monthly revenue by scenario" }) }));
        g.appendChild(ui.card({ title: "Cash", meta: "at month end, by scenario", span: 6, tools: ui.charts.legend(ORDER.map(function (k) { return { label: PRESETS[k].name, color: PRESETS[k].color, kind: "line" }; })),
          body: ui.charts.line({ height: 210, labels: labels, series: ORDER.map(function (k) { return { name: PRESETS[k].name, color: PRESETS[k].color, values: runs[k].map(function (m) { return m.cash; }), endDot: true }; }),
            xFormat: function (p) { return ui.period(p).slice(0, 3) + (p.slice(5) === "01" ? " ’" + p.slice(2, 4) : ""); }, yFormat: function (v) { return E.fmt(v, "USD", { compact: true }); },
            tipFormat: function (v) { return E.fmt(Math.round(v), "USD", { compact: true }); }, tipTitle: function (p) { return ui.period(p, true); }, label: "Cash by scenario" }) }));
        right.appendChild(g);

        // Side by side, fiscal 2027.
        var metrics = [
          ["Revenue", function (ms) { return sum(fy27(ms), "rev"); }, "money"],
          ["Gross margin", function (ms) { var f = fy27(ms); return sum(f, "gp") / sum(f, "rev"); }, "pct"],
          ["Operating expenses", function (ms) { return sum(fy27(ms), "opex"); }, "money"],
          ["Operating income", function (ms) { return sum(fy27(ms), "oi"); }, "money"],
          ["Operating margin", function (ms) { var f = fy27(ms); return sum(f, "oi") / sum(f, "rev"); }, "pct"],
          ["Cash, Dec 2027", function (ms) { return ms[ms.length - 1].cash; }, "money"],
          ["Lowest cash", function (ms) { return ms.reduce(function (m, x) { return Math.min(m, x.cash); }, Infinity); }, "money"]
        ];
        var t = h("table", { class: "tbl pl-cmp" });
        t.appendChild(h("thead", null, h("tr", null, h("th", null, "Fiscal 2027"), ORDER.map(function (k) { return h("th", { class: "num" }, h("span", { class: "row", style: { justifyContent: "flex-end", gap: "6px" } }, h("i", { style: { width: "10px", height: "2px", background: PRESETS[k].color, display: "inline-block" } }), PRESETS[k].name)); }))));
        var tb = h("tbody");
        metrics.forEach(function (m) {
          var vals = ORDER.map(function (k) { return m[1](runs[k]); });
          tb.appendChild(h("tr", null, h("td", null, m[0]), vals.map(function (v, i) {
            return h("td", { class: "num" + (ORDER[i] === state.sel ? " best" : "") + (v < 0 ? " neg" : "") }, m[2] === "pct" ? ui.pct(v, 1) : E.fmt(Math.round(v), "USD", { compact: true }));
          })));
        });
        t.appendChild(tb);
        right.appendChild(h("div", { style: { marginTop: "16px" } }, ui.card({ title: "Scenarios side by side", meta: "the selected one in bold", flush: true, body: t,
          foot: [h("span", null, "Cash assumes 22% of profit goes to tax and $60K a month to equipment. Working-capital timing and financing are left out on purpose — this is for direction, not the 13-week forecast.")] })));

        var mt = ui.table({ rows: sel, sortable: false, dense: true, columns: [
          { key: "p", label: "Month", render: function (m) { return ui.period(m.p); } },
          { key: "r", label: "Revenue", num: true, render: function (m) { return E.fmt(Math.round(m.rev), "USD", { dp: 0 }); } },
          { key: "g", label: "Gross profit", num: true, render: function (m) { return E.fmt(Math.round(m.gp), "USD", { dp: 0 }); } },
          { key: "o", label: "Operating expenses", num: true, render: function (m) { return E.fmt(Math.round(m.opex), "USD", { dp: 0 }); } },
          { key: "i", label: "Operating income", num: true, render: function (m) { return ui.amt(Math.round(m.oi), "USD", { dp: 0 }); } },
          { key: "c", label: "Cash", num: true, render: function (m) { return h("b", null, E.fmt(Math.round(m.cash), "USD", { dp: 0 })); } }
        ] });
        right.appendChild(h("div", { style: { marginTop: "16px" } }, ui.card({ title: PRESETS[state.sel].name + " by month", flush: true, body: mt })));
      }

      function drawDrivers() {
        ui.clear(left);
        var d = state.d[state.sel], pre = PRESETS[state.sel];
        var body = h("div");
        body.appendChild(h("div", { style: { marginBottom: "12px" } }, ui.seg(ORDER.map(function (k) { return { id: k, label: PRESETS[k].name }; }), state.sel, function (k) { state.sel = k; save(); drawDrivers(); drawResults(); }, { label: "Scenario" })));
        body.appendChild(h("p", { class: "note", style: { marginBottom: "12px" } }, pre.blurb));
        DRIVERS.forEach(function (dv) {
          var out = h("b", null, fmt(dv, d[dv.id]));
          var r = h("input", { type: "range", min: dv.min, max: dv.max, step: dv.step, value: d[dv.id], "aria-label": dv.label });
          r.addEventListener("input", function () { d[dv.id] = parseFloat(r.value); out.textContent = fmt(dv, d[dv.id]); drawResults(); });
          r.addEventListener("change", save);
          body.appendChild(h("div", { class: "pl-drv" }, h("div", { class: "row" }, h("span", null, dv.label), out), r, h("small", null, dv.hint)));
        });
        body.appendChild(h("div", { class: "row", style: { marginTop: "12px" } },
          ui.btn("Reset " + pre.name, { size: "sm", kind: "ghost", icon: "refresh", onClick: function () {
            var p = JSON.parse(JSON.stringify(PRESETS[state.sel].d));
            p.cloud = Math.round((b.cloudPct + (state.sel === "expansion" ? -0.5 : state.sel === "downturn" ? 1 : 0)) * 10) / 10;
            state.d[state.sel] = p; save(); drawDrivers(); drawResults();
          } })));
        left.appendChild(ui.card({ title: "Drivers", meta: pre.name, body: body,
          foot: [h("span", null, "Run-rate: revenue " + E.fmt(Math.round(b.rev), "USD", { compact: true }) + " a month, cloud " + b.cloudPct.toFixed(1) + "% of it, payroll " + E.fmt(Math.round(b.payroll), "USD", { compact: true }) + ".")] }));
      }
      function fmt(dv, v) {
        if (dv.id === "hires") return (v > 0 ? "+" : "") + v + " " + dv.unit;
        if (dv.id === "hireCost") return "$" + v + "K";
        if (dv.id === "mkt") return (v > 0 ? "+" : "") + v + "%";
        return v.toFixed(1) + "%";
      }
      drawDrivers();
      drawResults();
      return page;
    }
  });

  function exportCsv(E, b, cash0) {
    var rows = [["Scenario", "Month", "Revenue", "Gross profit", "Operating expenses", "Operating income", "Cash"]];
    ORDER.forEach(function (k) {
      project(E, b, state.d[k], cash0).forEach(function (m) {
        rows.push([PRESETS[k].name, m.p].concat([m.rev, m.gp, m.opex, m.oi, m.cash].map(function (v) { return (v / 100).toFixed(0); })));
      });
    });
    ui.csv("oc-efm-scenarios.csv", rows);
  }
})(window);
