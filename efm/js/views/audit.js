/* ==========================================================================
   OC EFM — Audit & controls.

   The record of every change — who, what, when, and why — chained so that
   editing or deleting any event is detectable; the flags the controls
   engine raised; and the rules that decide who may do what. An auditor
   should be able to start here and trust what they find.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var local = { q: "", actor: "", family: "", verified: null, tamper: null };

  var FAMILIES = { journal: "Journals", ap: "Payables", ar: "Receivables", bank: "Bank", vendor: "Vendor master", period: "Periods", close: "Close",
                   anomaly: "Control flags", asset: "Fixed assets", budget: "Budgets", ic: "Intercompany" };

  EFM.view("audit", {
    title: "Audit & controls", icon: "shield",
    render: function (ctx) {
      var E = ctx.E, app = ctx.app, q = ctx.query;
      var tab = q.get("tab") || "trail";
      if (q.get("anomaly")) { var an = q.get("anomaly"); setTimeout(function () { app.setQuery({ anomaly: null }); app.open({ kind: "anomaly", id: an }); }, 0); tab = "flags"; }
      var open = Object.values(E.anomalies).filter(function (a) { return a.status === "open"; }).length;
      var page = h("div");
      page.appendChild(ui.pageHead("Audit & controls", "Every change — who made it, when and why — chained so it can't be quietly edited, and the rules that decide who may do what.", []));
      page.appendChild(h("div", { class: "row", style: { marginBottom: "14px" } },
        ui.seg([{ id: "trail", label: "Audit trail" }, { id: "flags", label: "Control flags" + (open ? " · " + open : "") }, { id: "sod", label: "Separation of duties" }], tab,
          function (t) { app.setQuery({ tab: t === "trail" ? null : t }); }, { label: "Audit views" })));
      if (tab === "flags") page.appendChild(flags(ctx));
      else if (tab === "sod") page.appendChild(sod(ctx));
      else page.appendChild(trail(ctx));
      return page;
    }
  });

  /* --------------------------------------------------------------- Trail */
  function trail(ctx) {
    var E = ctx.E, app = ctx.app;
    var wrap = h("div");
    var chain = E.chain();
    var v = local.verified;
    var head = chain.length ? chain[chain.length - 1].hash : "";
    var card = h("div", { class: "card au-verify" },
      h("span", { class: "ic" + (v && !v.ok ? " bad" : "") }, ui.icon(v && !v.ok ? "alert" : "shield")),
      h("div", { class: "grow" },
        h("div", { style: { fontWeight: "600", fontSize: "15px" } }, v ? (v.ok ? "Intact — " + v.count.toLocaleString() + " events verified" : "Broken at event #" + v.at) : E.audit.length.toLocaleString() + " events, hash-chained"),
        h("div", { class: "muted", style: { fontSize: "12.5px", marginTop: "2px" } }, v ? "Recomputed every hash from the first event at " + new Date(v.when).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) + "." :
          "Each event's SHA-256 covers its content and the hash before it. Change or delete one and every hash after it stops matching."),
        h("div", { class: "au-hash", style: { marginTop: "6px" } }, "Head " + head)),
      ui.btn("Show a tampered copy", { onClick: function () { tamperDemo(ctx); } }),
      ui.btn("Verify the chain", { kind: "primary", icon: "check", onClick: function () { var r = E.verifyAudit(); r.when = Date.now(); local.verified = r; app.refresh(); } }));
    wrap.appendChild(card);

    var body = h("div");
    wrap.appendChild(ui.card({ flush: true, body: body }));
    var actors = {};
    E.audit.forEach(function (ev) { actors[ev.actor] = 1; });
    function draw() {
      ui.clear(body);
      var ql = local.q.toLowerCase();
      var rows = E.audit.filter(function (ev) {
        if (local.actor && ev.actor !== local.actor) return false;
        if (local.family && ev.action.split(".")[0] !== local.family) return false;
        if (ql && (ev.summary + " " + ev.obj + " " + ev.action + " " + (ev.reason || "")).toLowerCase().indexOf(ql) < 0) return false;
        return true;
      });
      body.appendChild(h("div", { class: "bar" },
        ui.searchBox("Search the trail", local.q, function (x) { local.q = x; draw(); body.querySelector("input[type=search]").focus(); }),
        ui.select([{ id: "", label: "Everyone" }].concat(Object.keys(actors).map(function (a) { return { id: a, label: ui.person(a).name }; })), local.actor, function (x) { local.actor = x; draw(); }, { label: "Who", width: "200px" }),
        ui.select([{ id: "", label: "Every kind of change" }].concat(Object.keys(FAMILIES).map(function (k) { return { id: k, label: FAMILIES[k] }; })), local.family, function (x) { local.family = x; draw(); }, { label: "What", width: "210px" }),
        h("span", { class: "sp" }),
        ui.btn("Export CSV", { size: "sm", kind: "ghost", icon: "download", onClick: function () {
          ui.csv("oc-efm-audit-trail.csv", [["Seq", "Time", "Actor", "Action", "Object", "Summary", "Reason", "Hash"]].concat(rows.map(function (ev) {
            return [ev.seq, ev.at, ui.person(ev.actor).name, ev.action, ev.obj, ev.summary, ev.reason || "", chain[ev.seq - 1] ? chain[ev.seq - 1].hash : ""];
          })));
        } }),
        h("span", { class: "muted", style: { fontSize: "12.5px" } }, rows.length.toLocaleString() + " events")));
      body.appendChild(ui.table({ rows: rows, sortKey: "seq", sortDir: -1, limit: 300, dense: true, columns: [
        { key: "seq", label: "#", num: true, sort: function (ev) { return ev.seq; }, render: function (ev) { return h("span", { class: "muted" }, String(ev.seq)); } },
        { key: "at", label: "When", cls: "nowrap", sort: function (ev) { return ev.at; }, render: function (ev) { return ui.time(ev.at); } },
        { key: "who", label: "Who", render: function (ev) { return ui.who(ev.actor); } },
        { key: "act", label: "Action", render: function (ev) { return h("span", { class: "mono", style: { fontSize: "11.5px", color: "var(--ink-3)" } }, ev.action); } },
        { key: "sum", label: "What happened", cls: "jn-memo", render: function (ev) {
          var ref = refFor(E, ev.obj);
          var s = h("span", { class: "jn-m", title: ev.summary + (ev.reason ? " — " + ev.reason : "") }, ev.summary);
          if (!ref) return s;
          return h("button", { type: "button", class: "rc-inv", style: { width: "100%" }, on: { click: function () { app.open(ref); } } }, s);
        } },
        { key: "h", label: "Hash", render: function (ev) { var c = chain[ev.seq - 1]; return h("span", { class: "au-hash", title: c ? c.hash : "" }, c ? c.hash.slice(0, 10) : ""); } }
      ] }));
    }
    draw();
    return wrap;
  }
  function refFor(E, obj) {
    if (!obj) return null;
    if (E.journals[obj]) return { kind: "journal", id: obj };
    if (E.apInvoices[obj]) return { kind: "ap", id: obj };
    if (E.arInvoices[obj]) return { kind: "ar", id: obj };
    if (E.vendors[obj]) return { kind: "vendor", id: obj };
    if (E.closeTasks[obj]) return { kind: "task", id: obj };
    if (E.anomalies[obj]) return { kind: "anomaly", id: obj };
    if (E.bankLines[obj]) return { kind: "bankline", id: obj };
    return null;
  }

  /* What an edit to one event does to the chain — on a copy, never the trail. */
  function tamperDemo(ctx) {
    var E = ctx.E;
    var target = E.audit.filter(function (ev) { return ev.action === "ap.approve"; }).slice(-1)[0] || E.audit[Math.floor(E.audit.length / 2)];
    // Nudge the first digit of the first amount — the smallest possible edit.
    var altered = target.summary.replace(/([$£¥])(\d)/, function (m, sym, d) { return sym + (d === "9" ? "1" : String(+d + 1)); });
    if (altered === target.summary) altered = target.summary + " (edited)";
    function body(ev, summary) { return JSON.stringify([ev.seq, ev.at, ev.actor, ev.action, ev.obj, summary, ev.before || null, ev.after || null, ev.reason || null]); }
    var real = E.chain(), prev = target.seq > 1 ? real[target.seq - 2].hash : "0".repeat(64), fake = [];
    for (var i = target.seq - 1; i < Math.min(E.audit.length, target.seq + 4); i++) {
      var ev = E.audit[i];
      var hh = E.sha256(prev + body(ev, i === target.seq - 1 ? altered : ev.summary));
      fake.push({ ev: ev, real: real[i].hash, fake: hh });
      prev = hh;
    }
    var rows = h("div", { class: "stack", style: { gap: "8px" } });
    fake.forEach(function (f, k) {
      rows.appendChild(h("div", { class: "flag" + (k === 0 ? " critical" : ""), style: { marginBottom: "0" } }, h("span", { class: "mono", style: { fontSize: "12px", color: "var(--ink-3)", minWidth: "44px" } }, "#" + f.ev.seq),
        h("div", { class: "grow" }, h("div", { class: "t", style: { fontSize: "12.5px" } }, k === 0 ? altered : f.ev.summary),
          h("div", { class: "au-hash" }, "recorded " + f.real.slice(0, 24) + "…"), h("div", { class: "au-hash", style: { color: "var(--bad)" } }, "now      " + f.fake.slice(0, 24) + "…"))));
    });
    ui.modal({ title: "If someone edited event #" + target.seq, wide: true,
      text: "One figure changed in one event — and its hash no longer matches, nor does any hash after it, because each covers the one before. This is a copy for illustration; the trail itself hasn't been touched.",
      body: h("div", null, h("div", { class: "note", style: { marginBottom: "10px" } }, "Recorded: “" + target.summary + "”"), rows),
      actions: [{ label: "Done", kind: "primary" }] });
  }

  /* --------------------------------------------------------------- Flags */
  function flags(ctx) {
    var E = ctx.E, app = ctx.app;
    var list = Object.values(E.anomalies).sort(function (a, b) { return (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1) || (a.raisedAt < b.raisedAt ? 1 : -1); });
    var wrap = h("div");
    wrap.appendChild(h("p", { class: "note", style: { marginBottom: "12px" } }, "Rules run over every posting, payment and change to the vendor master. A flag is a reason to look, not an accusation — each is resolved with a note, dismissed or escalated to Internal Audit."));
    wrap.appendChild(ui.card({ flush: true, body: ui.table({ rows: list, sortable: false, onRow: function (a) { app.open({ kind: "anomaly", id: a.id }); }, columns: [
      { key: "s", label: "", render: function (a) { return ui.sev(a.status === "open" ? a.sev : "info"); } },
      { key: "t", label: "Flag", cls: "two jn-memo", render: function (a) { return h("span", null, h("span", { class: "jn-m" }, a.title), h("span", { class: "sub" }, a.detail)); } },
      { key: "r", label: "Rule", cls: "nowrap", render: function (a) { return h("span", { class: "mono", style: { fontSize: "12px" } }, a.rule.split(" · ")[0]); } },
      { key: "a", label: "Amount", num: true, render: function (a) { return a.amount ? E.fmt(a.amount, "USD") : ""; } },
      { key: "w", label: "Raised", cls: "nowrap", render: function (a) { return ui.date(a.raisedAt.slice(0, 10)); } },
      { key: "st", label: "Status", render: function (a) { return a.status === "open" ? ui.status(a.sev, "Open") : ui.status(a.status); } }
    ] }) }));
    return wrap;
  }

  /* ----------------------------------------------- Separation of duties */
  function sod(ctx) {
    var E = ctx.E;
    var RULES = [
      ["SOD-01", "Whoever captures a vendor invoice doesn't approve it.", "Capture and coding sit with Accounts Payable; approval with a controller or the CFO."],
      ["SOD-02", "Whoever approved an invoice doesn't release its payment.", "Treasury releases payment runs. A run containing an invoice you approved is refused."],
      ["SOD-03", "New vendor bank details are verified by call-back before anything is paid.", "The number called is the one already on file — never one from the email that asked for the change."],
      ["SOD-04", "Whoever prepares a document doesn't approve it.", "Every manual journal needs a second person; above $250,000, the CFO."]
    ];
    var wrap = h("div", { class: "grid" });
    var rules = h("div");
    RULES.forEach(function (r) {
      rules.appendChild(h("div", { class: "au-rule" }, h("span", { class: "id" }, r[0]), h("div", null, h("div", { style: { fontWeight: "550" } }, r[1]), h("div", { class: "muted", style: { fontSize: "12.5px", marginTop: "2px" } }, r[2])),
        ui.status("good", "Enforced")));
    });
    wrap.appendChild(ui.card({ title: "Rules", meta: "checked by the engine on every command — a screen can't skip them", span: 7, body: rules }));
    var lim = h("div", { class: "stack", style: { gap: "10px" } },
      limRow("Manual journals", "Controller up to " + E.fmt(E.limits.journal.controller * 100, "USD", { dp: 0 }), "CFO above"),
      limRow("Vendor invoices", "Controller up to " + E.fmt(E.limits.ap.controller * 100, "USD", { dp: 0 }), "CFO above"),
      limRow("Spending over budget", "Manager from 100% of budget", "CFO over 110%"),
      limRow("Periods", "Controller closes", "Only the CFO locks"));
    wrap.appendChild(ui.card({ title: "Approval limits", span: 5, body: lim }));

    var roles = Object.keys(E.roles), acts = Object.keys(E.perms).filter(function (k) { return E.perms[k].rule; });
    var t = h("table", { class: "tbl au-matrix dense" });
    t.appendChild(h("thead", null, h("tr", null, h("th", null, "Action"), roles.map(function (r) { return h("th", null, E.roles[r].name); }))));
    var tb = h("tbody");
    acts.forEach(function (a) {
      tb.appendChild(h("tr", null, h("td", null, h("span", { class: "mono", style: { fontSize: "12px" } }, a), h("span", { class: "sub" }, E.perms[a].rule)),
        roles.map(function (r) { var yes = E.perms[a].roles.indexOf(r) >= 0; return h("td", { class: yes ? "yes" : "faint" }, yes ? ui.icon("check", "sm") : "—"); })));
    });
    t.appendChild(tb);
    wrap.appendChild(ui.card({ title: "Permissions by role", meta: "the colleagues whose work is in these books", span: 12, flush: true,
      body: h("div", { class: "tbl-wrap" }, t),
      foot: [h("span", null, "Everyone signed in to OC EFM works in the same system with full access. The document rules above still apply to you — and where they stop you, the sandbox lets you simulate the colleague who would act.")] }));
    return wrap;
  }
  function limRow(what, a, b) {
    return h("div", { class: "row", style: { justifyContent: "space-between", fontSize: "13px", paddingBottom: "10px", borderBottom: "1px solid var(--line)" } },
      h("b", { style: { fontWeight: "550" } }, what), h("span", { class: "muted" }, a + " · " + b));
  }
})(window);
