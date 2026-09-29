/* ==========================================================================
   OC EFM — Close.

   The month-end, as a checklist that does the work. Automated steps post
   their journals when run; review steps ask for evidence; nothing starts
   before what it depends on is done; and the period only closes when the
   list is complete. Every step here goes through the engine, so running the
   whole close in the sandbox changes the statements the way a real one does.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;

  function wdNum(wd) { return parseInt(String(wd).replace("WD", "").replace("−", "-"), 10); }
  function blocked(E, t) { return (t.deps || []).filter(function (d) { return E.closeTasks[d] && E.closeTasks[d].status !== "done"; }); }

  /* On real books there is no invented checklist: the close is the period
     itself. The month that has ended and is still open is the one to close,
     then to lock; the current month can't be closed before it is over. */
  function closable(E) {
    var cp = E.currentPeriod(), ps = E.fyPeriods();
    for (var i = 0; i < ps.length && ps[i] < cp; i++) {
      var p = ps[i];
      if (E.entities.some(function (e) { return E.periodStatus(e.id, p) !== "locked"; })) return p;
    }
    return null;
  }

  function liveClose(ctx) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod(), p = closable(E);
    var page = h("div");
    page.appendChild(ui.pageHead("Close", "Closing a month stops new postings to it, so its figures stop moving. A month can be closed once it has ended."));
    page.appendChild(periodsCard(ctx));
    var g = h("div", { class: "grid", style: { marginTop: "16px" } });
    if (p) {
      var c6 = function (card) { var w = h("div", { class: "c6" }); w.appendChild(card); return w; };
      g.appendChild(c6(checksCard(ctx, p)));
      g.appendChild(c6(closePeriodCard(ctx, [], p)));
    } else {
      g.appendChild(ui.card({ span: 12, body: ui.empty("Nothing to close yet", ui.period(cp, true) + " is still under way — it ends " + ui.date(E.lastDay(cp), "long") + ". Once a month has ended, it appears here to be closed.", "clip") }));
    }
    page.appendChild(g);
    return page;
  }

  EFM.view("close", {
    title: "Close", icon: "close",
    openId: function (id) { EFM.app.open({ kind: "task", id: id }); },
    render: function (ctx) {
      if (ctx.app.live) return liveClose(ctx);
      var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
      var tasks = Object.values(E.closeTasks).filter(function (t) { return t.period === cp; });
      var done = tasks.filter(function (t) { return t.status === "done"; });
      var ready = tasks.filter(function (t) { return t.run && t.status !== "done" && !blocked(E, t).length; });
      var target = tasks.reduce(function (m, t) { return t.due > m ? t.due : m; }, "");
      var page = h("div");

      page.appendChild(ui.pageHead(ui.period(cp, true) + " close",
        "Period ends " + ui.date(E.lastDay(cp), "long") + " · today is WD−2 · target close " + ui.date(target, "long") + " (WD+5)",
        [ready.length ? ui.gated("close.task", {}, "Run " + ready.length + " automated step" + (ready.length === 1 ? "" : "s"), function () { runReady(ctx); }, { kind: "primary", icon: "play" }) : null].filter(Boolean)));

      /* Where it stands. */
      var hist = E.closeHistory, last = hist[hist.length - 1];
      var avg = Math.round(hist.reduce(function (s, x) { return s + x.days; }, 0) / hist.length * 10) / 10;
      var manual = tasks.filter(function (t) { return !t.run && t.status !== "done"; }).length;
      var waiting = tasks.filter(function (t) { return t.status !== "done" && blocked(E, t).length; }).length;
      page.appendChild(h("div", { class: "card cl-sum" },
        ui.charts.ring(done.length / tasks.length, { size: 92, stroke: 8, text: done.length + "/" + tasks.length, label: done.length + " of " + tasks.length + " steps done" }),
        h("div", { class: "stat-row" },
          stat("Done", String(done.length), done.length ? "latest: " + done.slice().sort(function (a, b) { return a.completedAt < b.completedAt ? 1 : -1; })[0].title : "nothing yet"),
          stat("Ready to run", String(ready.length), "automated steps, their inputs are done"),
          stat("Reviews left", String(manual), "need a person's sign-off"),
          stat("Waiting", String(waiting), "on another step"),
          stat("Last close", last.days + " days", ui.period(last.period) + " · average " + avg))));

      /* The year's periods, entity by entity. */
      page.appendChild(periodsCard(ctx));

      var g = h("div", { class: "grid", style: { marginTop: "16px" } });
      g.appendChild(h("div", { class: "c8" }, checklist(ctx, tasks)));
      var side = h("div", { class: "c4 stack", style: { gap: "16px" } });
      side.appendChild(checksCard(ctx));
      side.appendChild(closePeriodCard(ctx, tasks));
      side.appendChild(historyCard(ctx));
      g.appendChild(side);
      page.appendChild(g);
      return page;
    }
  });

  function stat(l, v, s) { return h("div", null, h("div", { class: "l" }, l), h("div", { class: "v" }, v), h("div", { class: "cl-s" }, s)); }

  /* Runs every automated step whose inputs are done, in dependency order,
     until nothing more can run. One save and one redraw at the end. */
  function runReady(ctx) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod(), ran = [], posted = 0, failed = [];
    for (var pass = 0; pass < 20; pass++) {
      var next = Object.values(E.closeTasks).filter(function (t) { return t.period === cp && t.run && t.status !== "done" && !blocked(E, t).length; })
        .sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : a.id < b.id ? -1 : 1; });
      if (!next.length) break;
      var progressed = false;
      next.forEach(function (t) {
        if (failed.indexOf(t.id) >= 0) return;
        try { var r = E.exec("close.run", { id: t.id }, app.actor()); ran.push(t); posted += r.task.journals.length; progressed = true; }
        catch (e) { if (e instanceof EFM.Refusal) failed.push(t.id); else throw e; }
      });
      if (!progressed) break;
    }
    app.commit();
    ui.toast(ran.length ? "Ran " + ran.length + " step" + (ran.length === 1 ? "" : "s") + " · posted " + posted + " journal" + (posted === 1 ? "" : "s") + "." : "Nothing could run yet.",
      { sub: ran.length ? ran.map(function (t) { return t.title; }).slice(0, 3).join(" · ") + (ran.length > 3 ? " …" : "") : null, err: !ran.length });
  }

  /* ------------------------------------------------------------- Periods */
  function periodsCard(ctx) {
    var E = ctx.E, app = ctx.app, cp = E.currentPeriod();
    var months = E.fyPeriods();
    var t = h("table", { class: "cl-periods" });
    var hr = h("tr", null, h("th", null, ""));
    months.forEach(function (p) { hr.appendChild(h("th", { class: p === cp ? "cur" : "" }, ui.period(p).slice(0, 3))); });
    t.appendChild(h("thead", null, hr));
    var tb = h("tbody");
    E.entities.forEach(function (e) {
      var tr = h("tr", null, h("th", { scope: "row" }, e.short));
      months.forEach(function (p) {
        var st = E.periodStatus(e.id, p), fut = p > cp;
        var hist = E.closeHistory.filter(function (x) { return x.period === p; })[0];
        tr.appendChild(h("td", { class: "cl-p " + (fut ? "future" : st) + (p === cp ? " cur" : ""), title: e.name + " · " + ui.period(p, true) + " · " + (fut ? "not started" : st) },
          h("span", { class: "cl-dot" }, st === "locked" ? ui.icon("lock", "sm") : st === "closed" ? ui.icon("check", "sm") : null),
          h("span", { class: "cl-st" }, fut ? "" : st === "open" ? "Open" : st === "soft" ? "Soft" : st === "closed" ? (hist ? hist.days + "d" : "Closed") : (hist ? hist.days + "d" : "Locked"))));
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return ui.card({ title: "Fiscal " + E.fy, meta: E.closeHistory.length ? "Locked periods can't change; closed periods take no new postings; the number is the working days that close took" : "Locked periods can't change; closed periods take no new postings", body: h("div", { class: "tbl-wrap" }, t),
      tools: ui.charts.legend([{ label: "Locked", color: "var(--ink-3)" }, { label: "Closed", color: "var(--good-dot)" }, { label: "Open", color: "var(--accent)" }]) });
  }

  /* ----------------------------------------------------------- Checklist */
  function checklist(ctx, tasks) {
    var E = ctx.E, app = ctx.app;
    var byDay = {};
    tasks.forEach(function (t) { (byDay[t.wd] = byDay[t.wd] || []).push(t); });
    var days = Object.keys(byDay).sort(function (a, b) { return wdNum(a) - wdNum(b); });
    var wrap = h("div", { class: "card" });
    wrap.appendChild(h("div", { class: "card-h" }, h("h2", null, "Checklist"), h("span", { class: "meta" }, "by working day · WD 0 is the last day of the month")));
    var body = h("div", { class: "card-b", style: { paddingTop: "4px" } });
    days.forEach(function (wd) {
      var list = byDay[wd].sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      var n = wdNum(wd), allDone = list.every(function (t) { return t.status === "done"; });
      body.appendChild(h("div", { class: "cl-day" + (n === -2 ? " today" : "") },
        h("span", { class: "cl-wd" }, wd), h("span", { class: "muted" }, ui.date(list[0].due, "long")),
        n === -2 ? ui.tag("Today", "accent") : null, allDone ? h("span", { class: "sp" }) : null, allDone ? ui.status("done", "Done") : null));
      list.forEach(function (t) { body.appendChild(taskRow(ctx, t)); });
    });
    wrap.appendChild(body);
    return wrap;
  }

  function taskRow(ctx, t) {
    var E = ctx.E, app = ctx.app;
    var waiting = blocked(E, t);
    var state = t.status === "done" ? "done" : t.status === "in-progress" ? "prog" : waiting.length ? "blocked" : "";
    var action;
    if (t.status === "done") action = t.journals && t.journals.length ? h("span", { class: "muted cl-meta" }, t.journals.length + " journal" + (t.journals.length === 1 ? "" : "s")) : null;
    else if (waiting.length) action = h("span", { class: "muted cl-meta" }, "Waiting");
    else if (t.run) action = ui.gated("close.task", {}, "Run", function (ev) { ev.stopPropagation(); run(ctx, t); }, { size: "sm", kind: "primary", icon: "play" });
    else action = ui.gated("close.task", {}, "Complete", function (ev) { ev.stopPropagation(); complete(ctx, t); }, { size: "sm" });

    var sub = [ui.person(t.owner).name];
    if (t.status === "done") sub.push("done " + ui.time(t.completedAt) + (t.completedBy && t.completedBy !== t.owner ? " by " + ui.person(t.completedBy).name : ""));
    else if (waiting.length) sub.push("waiting on " + waiting.map(function (d) { return "“" + E.closeTasks[d].title + "”"; }).slice(0, 2).join(" and ") + (waiting.length > 2 ? " and " + (waiting.length - 2) + " more" : ""));
    else sub.push(t.run ? "automated — posts journals" : "review — sign off with evidence");
    var row = h("div", { class: "cl-task " + state, role: "button", tabindex: "0" },
      h("span", { class: "check " + (state === "done" ? "done" : state) }, state === "done" ? ui.icon("check") : null),
      h("div", { class: "grow" }, h("div", { class: "cl-t" }, t.title), h("div", { class: "cl-x" }, sub.join(" · "))),
      ui.tag(t.area), action);
    row.addEventListener("click", function () { app.open({ kind: "task", id: t.id }); });
    row.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && ev.target === row) app.open({ kind: "task", id: t.id }); });
    return row;
  }
  function run(ctx, t) {
    ctx.app.run("close.run", { id: t.id }, { ok: function (r) { return "“" + t.title + "” done" + (r.task.journals.length ? " · posted " + r.task.journals.join(", ") : "") + "."; } });
  }
  function complete(ctx, t) {
    var hints = {
      "C-04": "e.g. every September invoice received by today is approved, held or rejected",
      "C-06": "e.g. reconciled to the Sep 26 statement; outstanding items listed on the rec",
      "C-15": "e.g. all five accounts reconciled; outstanding items are timing",
      "C-16": "e.g. AR, AP and fixed assets agree to the ledger to the cent",
      "C-18": "e.g. Marketing over plan on the Roxan 3 launch; cloud up with usage revenue",
      "C-19": "e.g. reviewed the trial balance, flux and reconciliations",
      "C-20": "e.g. approved the September results"
    };
    ui.ask({ title: "Complete “" + t.title + "”", text: "Say what you checked. The note stays on the task and in the audit trail.",
      label: "Evidence or note", placeholder: hints[t.id] || "What you checked, and where the evidence is", confirmLabel: "Complete", multiline: true })
      .then(function (n) { if (n) ctx.app.run("close.run", { id: t.id, note: n }, { ok: "“" + t.title + "” complete." }); });
  }

  /* -------------------------------------------------------- Before close */
  function checksCard(ctx, period) {
    var E = ctx.E, app = ctx.app, cp = period || E.currentPeriod(), month = E.periodLabel(cp, true).split(" ")[0], last = E.fy + "-12";
    var items = [];
    var tieOff = 0;
    E.entities.forEach(function (e) {
      if (E.arOpen(e.id).reduce(function (s, i) { return s + i.balance; }, 0) !== E.balance(e.id, "1100", last)) tieOff++;
      if (E.apOpen(e.id).reduce(function (s, i) { return s + i.amount; }, 0) !== -E.balance(e.id, "2000", last)) tieOff++;
    });
    items.push({ ok: !tieOff, t: tieOff ? tieOff + " subledger" + (tieOff > 1 ? "s" : "") + " off" : "Subledgers tie to the ledger", x: "Receivables and payables, every entity, to the cent", go: "/ledger?tab=tb" });
    var unm = Object.values(E.bankLines).filter(function (l) { return l.status === "unmatched"; }).length;
    if (Object.keys(E.bankAccounts).length) items.push({ ok: !unm, t: unm ? unm + " bank line" + (unm > 1 ? "s" : "") + " to reconcile" : "Every bank account reconciled", x: "Every bank line matched to the ledger", go: "/cash" });
    var ic = E.entities.length > 1 ? E.intercompany(cp).filter(function (x) { return Math.abs(x.difference) >= 100; }) : [];
    if (E.entities.length > 1) items.push({ ok: !ic.length, t: ic.length ? ic.length + " intercompany pair" + (ic.length > 1 ? "s" : "") + " out of balance" : "Intercompany in balance", x: ic.length ? ic.map(function (x) { return x.pair; }).join(", ") : "Between the group's entities", go: "/consolidation" });
    var pend = Object.values(E.journals).filter(function (j) { return j.status === "pending" && j.period === cp; }).length;
    items.push({ ok: !pend, t: pend ? pend + " journal" + (pend > 1 ? "s" : "") + " waiting for approval" : "No journals waiting", x: "A period can't close with journals pending", go: "/journals?status=pending" });
    var rev = Object.values(E.apInvoices).filter(function (i) { return i.status === "review" && i.date <= E.lastDay(cp); }).length;
    items.push({ ok: !rev, t: rev ? rev + " " + month + " invoice" + (rev > 1 ? "s" : "") + " not yet approved" : "AP cut-off clean", x: "Approve, hold or reject before the period closes", go: "/payables?status=review" });
    var an = Object.values(E.anomalies).filter(function (a) { return a.status === "open"; }).length;
    items.push({ ok: !an, t: an ? an + " control flag" + (an > 1 ? "s" : "") + " open" : "No open control flags", x: "Resolve or escalate before sign-off", go: "/audit?tab=flags" });
    var list = h("div", { class: "att" });
    items.forEach(function (it) {
      list.appendChild(h("button", { type: "button", class: "att-i", on: { click: function () { app.navigate(it.go); } } },
        h("span", { class: "check " + (it.ok ? "done" : "") , style: it.ok ? null : { borderColor: "var(--warn-dot)" } }, it.ok ? ui.icon("check") : null),
        h("div", { class: "grow" }, h("div", { class: "t", style: { fontSize: "13px" } }, it.t), h("div", { class: "x" }, it.x)), ui.icon("chev", "sm")));
    });
    var okN = items.filter(function (i) { return i.ok; }).length;
    return ui.card({ title: "Before you close", meta: okN + " of " + items.length + " clear", flush: true, body: list });
  }

  function closePeriodCard(ctx, tasks, period) {
    var E = ctx.E, app = ctx.app, cp = period || E.currentPeriod(), month = E.periodLabel(cp, true).split(" ")[0], next = E.periodLabel(E.addMonths(cp, 1), true).split(" ")[0];
    var open = tasks.filter(function (t) { return t.status !== "done"; }).length;
    var rows = h("div", { class: "stack", style: { gap: "10px" } });
    E.entities.forEach(function (e) {
      var st = E.periodStatus(e.id, cp);
      var pend = Object.values(E.journals).filter(function (j) { return j.entity === e.id && j.period === cp && j.status === "pending"; }).length;
      var why = open ? open + " step" + (open > 1 ? "s" : "") + " left" : pend ? pend + " journal" + (pend > 1 ? "s" : "") + " pending" : null;
      var btn;
      if (st === "open" || st === "soft") {
        btn = ui.gated("period.close", {}, "Close", function () {
          ui.confirm({ title: "Close " + ui.period(cp, true) + " for " + e.name + "?", text: "No more postings to " + month + " for this entity. A correction after this goes into " + next + " — or the period is reopened, which is recorded.", confirmLabel: "Close period" })
            .then(function (y) { if (y) app.run("period.set", { entity: e.id, period: cp, status: "closed" }, { ok: ui.period(cp, true) + " closed for " + e.name + "." }); });
        }, { size: "sm", kind: why ? null : "primary" });
        if (why) btn.disabled = true;
      } else if (st === "closed") {
        btn = ui.gated("period.lock", {}, "Lock", function () {
          app.run("period.set", { entity: e.id, period: cp, status: "locked" }, { ok: ui.period(cp, true) + " locked for " + e.name + "." });
        }, { size: "sm" });
      } else btn = h("span", { class: "lock" }, ui.icon("lock", "sm"), "Locked");
      rows.appendChild(h("div", { class: "row" }, h("span", { class: "ws-dot" }, e.id),
        h("div", { class: "grow" }, h("div", { style: { fontSize: "13px", fontWeight: "550" } }, e.name), h("div", { class: "muted", style: { fontSize: "12px" } }, (st === "open" ? "Open" : st.charAt(0).toUpperCase() + st.slice(1)) + (why && (st === "open" || st === "soft") ? " · " + why : ""))),
        btn));
    });
    return ui.card({ title: "Close " + ui.period(cp, true), meta: "entity by entity", body: rows,
      foot: [h("span", null, E.live ? "Closing needs no journals waiting for approval. Locking makes the month final." : "Closing needs every step done and no journals pending. Only the CFO locks.")] });
  }

  function historyCard(ctx) {
    var E = ctx.E, hist = E.closeHistory;
    if (!hist.length) return h("span");
    return ui.card({ title: "Days to close", meta: "working days after month end", body: ui.charts.columns({ height: 150,
      labels: hist.map(function (x) { return x.period; }), series: [{ name: "Working days", color: "var(--s1)", values: hist.map(function (x) { return x.days; }) }],
      xFormat: function (p) { return ui.period(p).slice(0, 1); }, yFormat: function (v) { return String(v); }, tipFormat: function (v) { return v + " days"; },
      tipTitle: function (p) { return ui.period(p, true); }, tipExtra: function (i) { return [{ value: ui.date(hist[i].closedAt), label: "closed" }]; }, label: "Working days to close each month" }) });
  }
})(window);
