/* ==========================================================================
   OC EFM — the drill-down.

   Whatever a person clicks — a statement line, an aging bucket, an invoice,
   a journal — opens here, and whatever that points at opens on top of it:
   statement → account → lines → journal → source document → who did what,
   when. This is the answer to "can an auditor trace a reported number back
   to the original transaction?", made into a place people actually use.

   Each kind is { title(ref), render(ref, body, foot), wide? }. Open one with
   EFM.app.open({ kind, id, q }).
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM, ui = EFM.ui, h = ui.h;
  var D = EFM.drill = {};
  function A() { return EFM.app; }
  function En() { return EFM.app.E; }

  /* -------------------------------------------------------------- Parts */
  function head(ic, title, sub, amount, statusNode) {
    return h("div", { class: "doc-h" }, h("span", { class: "ic" }, ui.icon(ic, "lg")),
      h("div", { class: "grow" }, h("h2", null, title), sub ? h("div", { class: "sub" }, sub) : null),
      amount != null || statusNode ? h("div", { class: "amount" }, amount != null ? h("b", null, amount) : null, statusNode || null) : null);
  }
  function kv(pairs) {
    return h("dl", { class: "kv" }, pairs.filter(Boolean).map(function (p) { return h("div", null, h("dt", null, p[0]), h("dd", null, p[1] == null || p[1] === "" ? "—" : p[1])); }));
  }
  function sec(title, body, tools) {
    return h("section", { class: "dr-sec" }, h("h3", null, title, tools ? h("span", { class: "sp", style: { flex: "1" } }) : null, tools || null), body);
  }
  function openLink(ref, text) {
    return h("a", { href: "#" + ref.kind + "/" + encodeURIComponent(ref.id), on: { click: function (ev) { ev.preventDefault(); A().open(ref); } } }, text);
  }
  /* A document's history from the audit trail. Documents that automation
     made before anyone touched them have no events of their own, so their
     history is read from the document itself — shown, but without a hash,
     because it isn't part of the chain. */
  function history(ids, derived) {
    var E = En(), set = {};
    ids.forEach(function (i) { if (i) set[i] = 1; });
    var evs = E.audit.filter(function (ev) { return set[ev.obj]; });
    if (!evs.length && derived && derived.length) {
      return h("div", null, ui.timeline(derived.map(function (d) { return { seq: 0, actor: d.actor || "system", at: d.at, summary: d.summary }; })),
        h("p", { class: "note" }, "From the document's own record — posted by automation, so there's no separate audit event."));
    }
    if (!evs.length) return h("p", { class: "muted", style: { fontSize: "13px" } }, "Nothing recorded yet.");
    return ui.timeline(evs, { chain: true });
  }
  function at(date, iso) { return iso || (date + "T13:00:00Z"); }
  function periodChip(entity, p) {
    var st = En().periodStatus(entity, p);
    return h("span", { class: "row", style: { gap: "6px" } }, ui.period(p), st === "locked" || st === "closed" ? h("span", { class: "lock" }, ui.icon(st === "locked" ? "lock" : "lock", "sm"), st) : ui.status(st === "soft" ? "soft" : "open", st === "soft" ? "Soft close" : "Open"));
  }
  function sourceRef(src) {
    if (!src || !src.id) return null;
    if (src.type === "ap" || src.type === "ap-pay") return { kind: "ap", id: src.id };
    if (src.type === "ar" || src.type === "ar-pay") return { kind: "ar", id: src.id };
    if (src.type === "reversal") return { kind: "journal", id: src.id };
    if (src.type === "bank") return { kind: "bankline", id: src.id };
    return null;
  }
  function cur(entity) { return En().entity[entity].currency; }
  D._parts = { head: head, kv: kv, sec: sec, openLink: openLink, history: history };

  /* ============================================================ Journal */
  D.journal = {
    title: function (r) { return r.id; },
    render: function (ref, body, foot) {
      var E = En(), app = A(), j = E.journals[ref.id];
      if (!j) { body.appendChild(ui.empty("No such journal", ref.id, "alert")); return; }
      var c = cur(j.entity);
      var st = j.status === "posted" && j.reversedBy ? ui.status("posted", "Posted · reversed") : ui.status(j.status);
      body.appendChild(head("journal", j.id, j.memo, E.fmt(j.total, c), st));
      var src = sourceRef(j.source);
      body.appendChild(kv([
        ["Entity", E.entity[j.entity].name], ["Date", ui.date(j.date, "year")], ["Period", periodChip(j.entity, j.period)],
        ["Source", src ? openLink(src, (j.source.label || j.source.type) + " " + src.id) : (j.source && j.source.label) || "Manual"],
        ["Prepared by", j.createdBy ? ui.who(j.createdBy) : "—"], ["Approved by", j.approvedBy ? ui.who(j.approvedBy) : j.status === "pending" ? "Waiting · " + (j.needs === "cfo" ? "CFO" : "Controller") : "—"],
        j.reverses ? ["Reverses", openLink({ kind: "journal", id: j.reverses }, j.reverses)] : null,
        j.reversedBy ? ["Reversed by", openLink({ kind: "journal", id: j.reversedBy }, j.reversedBy)] : null,
        j.postedAt && j.status === "posted" ? ["Posted", ui.time(j.postedAt)] : null
      ]));
      if (j.status === "posted") body.appendChild(h("p", { class: "note", style: { marginBottom: "10px" } }, ui.icon("lock", "sm"), " Posted journals can't be edited. To correct one, reverse it — the reversal points back here and both stay on the record."));
      body.appendChild(ui.jeTable(j.lines, c, { onAccount: function (a) { app.open({ kind: "account", id: a, q: { entity: j.entity } }); } }));
      if (j.attachments && j.attachments.length) body.appendChild(sec("Evidence", h("div", { class: "stack" }, j.attachments.map(function (f) {
        return h("div", { class: "row" }, ui.icon("clip", "sm"), h("span", null, f.name), h("span", { class: "muted" }, f.size || ""));
      }))));
      if (j.rejectReason) body.appendChild(h("div", { class: "flag done" }, ui.icon("x"), h("div", null, h("div", { class: "t" }, "Rejected by " + ui.person(j.rejectedBy).name), h("div", { class: "x" }, j.rejectReason))));
      var jd = [{ actor: j.createdBy || "system", at: at(j.date, j.createdAt), summary: (j.status === "posted" ? "Posted " : "Prepared ") + j.id + " · " + ((j.source && j.source.label) || "journal") + " · " + E.fmt(j.total, c) }];
      if (j.approvedBy && j.approvedBy !== j.createdBy) jd.push({ actor: j.approvedBy, at: at(j.date, j.approvedAt), summary: "Approved " + j.id });
      body.appendChild(sec("History", history([j.id, j.source && j.source.id], jd)));

      /* Actions */
      var usd = E.usdOf(j.entity, j.total, j.period, "avg");
      if (j.status === "pending") {
        var can = E.can("journal.approve", app.actor(), { createdBy: j.createdBy, usd: usd });
        foot.appendChild(ui.gated("journal.approve", { createdBy: j.createdBy, usd: usd }, "Approve and post", function () {
          app.run("journal.approve", { id: j.id }, { ok: j.id + " posted to " + ui.period(j.period) + "." });
        }, { kind: "primary", icon: "check" }));
        foot.appendChild(ui.gated("journal.approve", { usd: 0 }, "Reject", function () {
          ui.ask({ title: "Reject " + j.id + "?", text: "The preparer sees your reason.", label: "Reason", confirmLabel: "Reject", danger: true }).then(function (why) {
            if (why) app.run("journal.reject", { id: j.id, reason: why }, { ok: j.id + " rejected." });
          });
        }));
        if (!can.ok && j.createdBy === "me") {
          var reviewer = usd > E.limits.journal.controller * 100 ? E.people.dana : E.people.marcus;
          foot.appendChild(h("span", { class: "sp" }));
          foot.appendChild(ui.btn("Simulate " + reviewer.name.split(" ")[0] + "'s approval", { kind: "ghost", icon: "users", onClick: function () {
            app.run("journal.approve", { id: j.id, simulated: true }, { actor: reviewer, ok: reviewer.name + " approved " + j.id + " (simulated in the sandbox)." });
          } }));
        }
        if (!can.ok) body.insertBefore(h("div", { class: "flag" }, ui.icon("lock"), h("div", null, h("div", { class: "t" }, can.reason), can.rule ? h("div", { class: "rule" }, can.rule) : null)), body.children[2]);
      } else if (j.status === "posted" && !j.reversedBy && j.source.type !== "open") {
        foot.appendChild(ui.gated("journal.reverse", {}, "Reverse", function () {
          var date = E.periodStatus(j.entity, j.period) === "open" ? j.date : E.firstOpenDate(j.entity);
          ui.ask({ title: "Reverse " + j.id + "?", text: "A new journal with every debit and credit swapped posts on " + ui.date(date, "year") + (date !== j.date ? " — " + ui.period(j.period) + " is " + E.periodStatus(j.entity, j.period) + ", so it lands in the first open period" : "") + ". The original stays exactly as it is.",
            label: "Why is it being reversed?", confirmLabel: "Reverse", danger: true, body: ui.jeTable(j.lines.map(function (l) { return { account: l.account, dr: l.cr || 0, cr: l.dr || 0, dims: l.dims, memo: l.memo }; }), c) , wide: true })
            .then(function (why) {
              if (why) app.run("journal.reverse", { id: j.id, reason: why, date: date }, { ok: function (r) { return j.id + " reversed by " + r.id + "."; }, then: function (r) { app.open({ kind: "journal", id: r.id }, { replace: true }); } });
            });
        }, { icon: "undo" }));
      } else if (j.status === "draft" || j.status === "rejected") {
        foot.appendChild(ui.gated("journal.create", {}, "Submit for approval", function () { app.run("journal.submit", { id: j.id }, { ok: j.id + " sent for approval." }); }, { kind: "primary" }));
        foot.appendChild(ui.gated("journal.create", {}, "Discard", function () { app.run("journal.discard", { id: j.id }, { ok: j.id + " discarded." }); }, { kind: "danger" }));
      }
    }
  };

  /* ===================================================== Vendor invoice */
  D.ap = {
    title: function (r) { var i = En().apInvoices[r.id]; return i ? i.number : r.id; },
    wide: true,
    render: function (ref, body, foot) {
      var E = En(), app = A(), inv = E.apInvoices[ref.id];
      if (!inv) { body.appendChild(ui.empty("No such invoice", ref.id, "alert")); return; }
      var v = E.vendors[inv.vendor], c = inv.currency;
      var usd = E.usdOf(inv.entity, inv.amount, E.currentPeriod(), "close");
      body.appendChild(head("doc", v.name, inv.number + " · " + E.entity[inv.entity].name, E.fmt(inv.amount, c), ui.status(inv.status)));

      // Flags come first: they are why a person is looking.
      (inv.flags || []).forEach(function (f) {
        var box = h("div", { class: "flag" + (f.resolved ? " done" : f.sev === "critical" ? " critical" : "") },
          ui.sev(f.resolved ? "info" : f.sev),
          h("div", { class: "grow" }, h("div", { class: "t" }, f.title + (f.resolved ? " — resolved" : "")),
            h("div", { class: "x" }, f.resolved ? f.resolved.how + " · " + ui.person(f.resolved.by).name + ", " + ui.time(f.resolved.at) : f.detail),
            !f.resolved && f.rule ? h("div", { class: "rule" }, f.rule) : null));
        var acts = h("div", { class: "acts" });
        if (!f.resolved && inv.status !== "rejected") {
          if (f.code === "duplicate") {
            acts.appendChild(ui.btn("Compare with " + E.apInvoices[f.other].number, { size: "sm", icon: "eye", onClick: function () { app.open({ kind: "ap", id: f.other }); } }));
            acts.appendChild(ui.gated("ap.hold", {}, "Reject as duplicate", function () {
              app.run("ap.reject", { id: inv.id, reason: "Duplicate of " + E.apInvoices[f.other].number }, { ok: inv.number + " rejected as a duplicate. Nothing was posted or paid." });
            }, { size: "sm", kind: "danger" }));
            acts.appendChild(ui.gated("ap.hold", {}, "Not a duplicate", function () {
              ui.ask({ title: "Why isn't this a duplicate?", label: "Reason", placeholder: "e.g. separate work order, confirmed with vendor" }).then(function (why) {
                if (why) app.run("ap.clearFlag", { id: inv.id, code: "duplicate", how: why }, { ok: "Flag cleared." });
              });
            }, { size: "sm" }));
          } else if (f.code === "match") {
            var po = E.pos[inv.po], got = po.lines[0].received;
            acts.appendChild(ui.gated("ap.hold", {}, "Pay for " + got + " received · request credit", function () {
              app.run("ap.clearFlag", { id: inv.id, code: "match", how: "received" }, { ok: "Invoice reduced to " + got + " units. Credit memo requested from " + v.name + "." });
            }, { size: "sm", kind: "primary" }));
            if (inv.status !== "hold") acts.appendChild(ui.gated("ap.hold", {}, "Hold until the rest arrive", function () {
              app.run("ap.hold", { id: inv.id, reason: "Waiting for " + (po.lines[0].qty - got) + " units" }, { ok: inv.number + " on hold." });
            }, { size: "sm" }));
          } else if (f.code === "bank") {
            acts.appendChild(ui.gated("vendor.verify", {}, "Verify by call-back", function () { verifyBank(v); }, { size: "sm", kind: "primary", icon: "phone" }));
          } else if (f.code === "budget") {
            var chk = E.budgetCheck(inv.entity, inv.lines[0].dept || v.dept, usd);
            box.querySelector(".grow").appendChild(h("div", { style: { marginTop: "10px", maxWidth: "360px" } },
              h("div", { class: "row", style: { fontSize: "12px", marginBottom: "4px" } }, h("span", { class: "muted" }, "Budget used"), h("span", { class: "sp" }), h("b", { class: "num" }, ui.pct(chk.before) + " → " + ui.pct(chk.after))),
              ui.meter(chk.after, { max: 1.3, mark: 1 })));
          }
        }
        if (acts.childNodes.length) box.querySelector(".grow").appendChild(acts);
        body.appendChild(box);
      });

      body.appendChild(kv([
        ["Vendor", openLink({ kind: "vendor", id: v.id }, v.name)], ["Invoice date", ui.date(inv.date, "year")], ["Due", ui.date(inv.due, "year") + (inv.status !== "paid" && inv.due < E.asOf ? " · " + E.daysBetween(inv.due, E.asOf) + " days late" : "")],
        ["Captured", inv.capture ? inv.capture.method + " · " + Math.round(inv.capture.confidence * 100) + "% confidence" : "—"], ["Captured by", ui.who(inv.createdBy)],
        ["Posts to", inv.glDate ? periodChip(inv.entity, inv.glDate.slice(0, 7)) : periodChip(inv.entity, (E.periodStatus(inv.entity, inv.date.slice(0, 7)) === "open" ? inv.date : E.firstOpenDate(inv.entity)).slice(0, 7))],
        inv.po ? ["Purchase order", openLink({ kind: "po", id: inv.po }, inv.po)] : ["Terms", v.terms ? "Net " + v.terms : "Due on receipt"],
        inv.approvedBy ? ["Approved by", ui.who(inv.approvedBy)] : null,
        inv.scheduledFor ? ["Payment run", ui.date(inv.scheduledFor, "year")] : inv.paidAt ? ["Paid", ui.date(inv.paidAt, "year")] : null
      ]));

      body.appendChild(sec("Lines", ui.table({ dense: true, columns: [
        { key: "desc", label: "Description", render: function (l) { return h("span", null, l.desc, l.project ? h("span", { class: "sub" }, E.dimName("project", l.project)) : null); } },
        { key: "acct", label: "Account", render: function (l) { var a = l.account || v.account; return a + " " + E.accounts[a].name; } },
        { key: "dept", label: "Department", render: function (l) { return E.accounts[l.account || v.account].bs ? "—" : E.dimName("dept", l.dept || v.dept); } },
        { key: "q", label: "Qty × price", num: true, render: function (l) { return l.qty ? l.qty + " × " + E.fmt(l.unit, c) : ""; } },
        { key: "amt", label: "Amount", num: true, render: function (l) { return E.fmt(l.amt, c); } }
      ], rows: inv.lines, sortable: false })));

      if (inv.po) {
        var po = E.pos[inv.po], pl = po.lines[0], il = inv.lines[0];
        function cell(ok, txt) { return h("span", { class: "row", style: { justifyContent: "flex-end", gap: "6px" } }, txt, ui.icon(ok ? "check" : "alert", "sm")); }
        body.appendChild(sec("Three-way match", h("table", { class: "tbl dense" },
          h("thead", null, h("tr", null, h("th", null, ""), h("th", { class: "num" }, "Purchase order"), h("th", { class: "num" }, "Received"), h("th", { class: "num" }, "Invoice"))),
          h("tbody", null,
            h("tr", null, h("td", null, "Quantity"), h("td", { class: "num" }, String(pl.qty)), h("td", { class: "num" }, String(pl.received)), h("td", { class: "num" }, cell((il.qty || 0) <= pl.received, String(il.qty || "—")))),
            h("tr", null, h("td", null, "Unit price"), h("td", { class: "num" }, E.fmt(pl.unit, c)), h("td", { class: "num" }, "—"), h("td", { class: "num" }, cell(il.unit === pl.unit, E.fmt(il.unit || 0, c)))),
            h("tr", null, h("td", null, "Amount"), h("td", { class: "num" }, E.fmt(pl.qty * pl.unit, c)), h("td", { class: "num" }, E.fmt(pl.received * pl.unit, c)), h("td", { class: "num" }, cell(inv.amount <= pl.received * pl.unit, E.fmt(inv.amount, c))))))));
      }

      var acct = inv.journal ? E.journals[inv.journal] : E.apJournal(inv, inv.date);
      body.appendChild(sec(inv.journal ? "Accounting · " + inv.journal : "Accounting on approval", h("div", null,
        inv.journal ? null : h("p", { class: "note", style: { marginBottom: "8px" } }, "Nothing is in the ledger yet. Approving posts this journal."),
        ui.jeTable(acct.lines, c, { onAccount: function (a) { app.open({ kind: "account", id: a, q: { entity: inv.entity } }); } })),
        inv.journal ? ui.btn("Open journal", { size: "sm", kind: "ghost", onClick: function () { app.open({ kind: "journal", id: inv.journal }); } }) : null));
      if (inv.payJournal) body.appendChild(sec("Payment", h("div", { class: "row" }, ui.status("paid"), h("span", null, ui.date(inv.paidAt, "year") + " · "), openLink({ kind: "journal", id: inv.payJournal }, inv.payJournal), inv.paidBy ? h("span", { class: "muted" }, " · released by " + ui.person(inv.paidBy).name) : null)));
      body.appendChild(sec("History", history([inv.id])));

      /* Actions */
      if (inv.status === "review" || inv.status === "captured") {
        var budgetFlag = (inv.flags || []).filter(function (f) { return f.code === "budget" && !f.resolved; })[0];
        foot.appendChild(ui.gated("ap.approve", { createdBy: inv.createdBy, usd: usd }, budgetFlag ? "Approve over budget" : "Approve", function () {
          var go = function () { app.run("ap.approve", { id: inv.id, budgetOverride: !!budgetFlag }, { ok: function () { return inv.number + " approved and posted as " + inv.journal + "."; } }); };
          if (budgetFlag) ui.confirm({ title: "Approve over budget?", text: budgetFlag.detail + " Your approval is recorded as the budget exception.", confirmLabel: "Approve" }).then(function (y) {
            if (!y) return;
            var x = Object.values(E.exceptions).filter(function (x) { return x.ap === inv.id && x.status === "open"; })[0];
            if (x) app.run("budget.decide", { id: x.id, approve: true, note: "Approved with " + inv.number });
            go();
          });
          else go();
        }, { kind: "primary", icon: "check", explain: "inline" }));
        foot.appendChild(ui.gated("ap.hold", {}, "Hold", function () {
          ui.ask({ title: "Put " + inv.number + " on hold?", label: "Reason", placeholder: "e.g. waiting for the vendor to confirm" }).then(function (why) { if (why) app.run("ap.hold", { id: inv.id, reason: why }, { ok: inv.number + " on hold." }); });
        }));
        foot.appendChild(ui.gated("ap.hold", {}, "Reject", function () {
          ui.ask({ title: "Reject " + inv.number + "?", text: "Nothing has posted, so rejecting leaves the ledger untouched.", label: "Reason", confirmLabel: "Reject", danger: true }).then(function (why) { if (why) app.run("ap.reject", { id: inv.id, reason: why }, { ok: inv.number + " rejected." }); });
        }, { kind: "danger" }));
      } else if (inv.status === "hold") {
        foot.appendChild(h("span", { class: "muted", style: { fontSize: "12.5px" } }, "On hold: " + (inv.holdReason || "")));
        foot.appendChild(h("span", { class: "sp" }));
        foot.appendChild(ui.gated("ap.hold", {}, "Release hold", function () { app.run("ap.release", { id: inv.id }, { ok: "Hold released." }); }, { kind: "primary" }));
      } else if (inv.status === "approved" || inv.status === "scheduled") {
        // Whoever approved an invoice doesn't release its payment (SOD-02).
        // In the sandbox a colleague in Treasury can be asked to.
        var mine = !E.can("ap.pay", app.actor(), { approvedBy: inv.approvedBy }).ok;
        var tomas = E.people.tomas;
        var schedule = function (actor) { app.run("ap.schedule", { id: inv.id }, { actor: actor, ok: inv.number + " scheduled for " + ui.date(E.nextPaymentRun()) + (actor ? " by " + actor.name + " (simulated)" : "") + "." }); };
        var pay = function (actor) {
          ui.confirm({ title: "Release this payment today?", text: E.fmt(inv.amount, c) + " to " + v.name + " (" + v.bank.bank + " " + v.bank.mask + "). The payment posts to the ledger now and reaches the bank in a day.", confirmLabel: "Release payment" })
            .then(function (y) { if (y) app.run("ap.payRun", { ids: [inv.id], date: inv.scheduledFor }, { actor: actor, ok: "Payment released" + (actor ? " by " + actor.name + " (simulated)" : "") + "." }); });
        };
        if (inv.status === "approved") foot.appendChild(ui.gated("ap.pay", { approvedBy: inv.approvedBy }, "Schedule for the " + ui.date(E.nextPaymentRun()) + " run", function () { schedule(); }, { kind: "primary", explain: "inline" }));
        else foot.appendChild(ui.gated("ap.pay", { approvedBy: inv.approvedBy }, "Pay now", function () { pay(); }, { kind: "primary", explain: "inline" }));
        if (mine) {
          foot.appendChild(h("span", { class: "sp" }));
          foot.appendChild(ui.btn(inv.status === "approved" ? "Simulate " + tomas.name.split(" ")[0] + " scheduling it" : "Simulate " + tomas.name.split(" ")[0] + " releasing it",
            { kind: "ghost", icon: "users", onClick: function () { if (inv.status === "approved") schedule(tomas); else pay(tomas); } }));
        }
      }
    }
  };

  function verifyBank(v) {
    var E = En(), app = A(), p = v.bankPending;
    if (!p) return;
    ui.modal({ title: "Verify " + v.name + "'s new bank details",
      text: "Call the vendor on the number already in the vendor master — never a number from the email that asked for the change.",
      body: h("div", { class: "stack", style: { gap: "12px" } },
        kv([["On file", v.bank.bank + " " + v.bank.mask], ["Requested", p.bank + " " + p.mask], ["Requested by", p.via], ["Received", ui.time(p.requestedAt)],
            ["Call", "(212) 555-0147 · accounts receivable (vendor master, verified 2024)"]]),
        p.note ? h("div", { class: "flag critical" }, ui.icon("alert"), h("div", null, h("div", { class: "t" }, "Warning sign"), h("div", { class: "x" }, p.note))) : null),
      actions: [
        { label: "Cancel" },
        { label: "Vendor did not confirm — reject change", kind: "danger", fn: function () { app.run("vendor.verifyBank", { id: v.id, approve: false, reason: "Vendor says they requested no change" }, { ok: "Change rejected. Payments go to the account on file; the attempt is logged for Internal Audit." }); } },
        { label: "Confirmed by phone", kind: "primary", fn: function () { app.run("vendor.verifyBank", { id: v.id, approve: true, contact: "call-back to (212) 555-0147" }, { ok: "New bank details verified. Held payments are released." }); } }
      ], wide: true });
  }
  D._verifyBank = verifyBank;

  /* =================================================== Customer invoice */
  D.ar = {
    title: function (r) { return r.id; },
    render: function (ref, body, foot) {
      var E = En(), app = A(), inv = E.arInvoices[ref.id];
      if (!inv) { body.appendChild(ui.empty("No such invoice", ref.id, "alert")); return; }
      var cu = E.customers[inv.customer], c = cur(inv.entity);
      var late = inv.balance > 0 ? E.daysBetween(inv.due, E.asOf) : 0;
      var stt = inv.status === "paid" ? ui.status("paid") : late > 0 ? ui.status("overdue", late + " days overdue") : ui.status(inv.status === "partial" ? "partial" : "open", inv.status === "partial" ? "Partly paid" : "Open");
      body.appendChild(head("doc", cu.name, inv.number + " · " + E.entity[inv.entity].name, E.fmt(inv.amount, c), stt));
      body.appendChild(kv([
        ["Customer", openLink({ kind: "customer", id: cu.id }, cu.name)], ["Issued", ui.date(inv.date, "year")], ["Due", ui.date(inv.due, "year") + " · net " + cu.terms],
        ["Balance", E.fmt(inv.balance, c)], ["Billing", { annual: "Annual, in advance", monthly: "Monthly, in advance", usage: "Usage, in arrears" }[inv.kind] || inv.kind],
        ["Journal", inv.journal ? openLink({ kind: "journal", id: inv.journal }, inv.journal) : "Opening balance"]
      ]));
      var rows = inv.lines.map(function (l) { return { d: l.desc, a: l.account, v: l.amt }; });
      if (inv.tax) rows.push({ d: inv.entity === "UK" ? "VAT 20%" : "Consumption tax 10%", a: "2300", v: inv.tax });
      body.appendChild(sec("Lines", ui.table({ dense: true, sortable: false, columns: [
        { key: "d", label: "Description" }, { key: "a", label: "Account", render: function (r) { return r.a + " " + E.accounts[r.a].name; } },
        { key: "v", label: "Amount", num: true, render: function (r) { return E.fmt(r.v, c); } }], rows: rows,
        foot: ["Total", "", E.fmt(inv.amount, c)] })));
      if (inv.lines[0].account === "2200") body.appendChild(h("p", { class: "note", style: { marginTop: "8px" } }, "Billed in advance, so it sits in deferred revenue and is recognized a month at a time as the service is delivered."));
      if (inv.payments.length) body.appendChild(sec("Payments", ui.table({ dense: true, sortable: false, columns: [
        { key: "date", label: "Date", render: function (p) { return ui.date(p.date, "year"); } },
        { key: "j", label: "Journal", render: function (p) { return p.journal ? openLink({ kind: "journal", id: p.journal }, p.journal) : "—"; } },
        { key: "amount", label: "Amount", num: true, render: function (p) { return E.fmt(p.amount, c); } }], rows: inv.payments })));
      if (inv.collections.length) body.appendChild(sec("Collections", ui.timeline(inv.collections.map(function (x, i) { return { seq: 0, actor: x.by, at: x.at, summary: x.action, reason: x.note }; }))));
      var ad = [{ actor: "system", at: at(inv.date), summary: "Issued " + inv.number + " to " + cu.name + " · " + E.fmt(inv.amount, c) + (inv.journal ? " · " + inv.journal : " · opening balance") }];
      inv.payments.forEach(function (p) { ad.push({ actor: "tomas", at: at(p.date), summary: "Payment of " + E.fmt(p.amount, c) + " received" + (p.journal ? " · " + p.journal : "") }); });
      body.appendChild(sec("History", history([inv.id], ad)));
      if (inv.balance > 0) {
        foot.appendChild(ui.gated("ar.apply", {}, "Record payment", function () { recordPayment(inv); }, { kind: "primary" }));
        if (late > 0) foot.appendChild(ui.gated("ar.collect", {}, "Collections step", function (ev) {
          var steps = ["Reminder sent", "Second notice sent", "Called the customer", "Escalated to collections"];
          ui.menu(ev.currentTarget, steps.map(function (s) { return { label: s, fn: function () { app.run("ar.remind", { invoice: inv.id, step: s }, { ok: s + " — logged on " + inv.number + "." }); } }; }));
        }));
      }
    }
  };
  function recordPayment(inv) {
    var E = En(), app = A(), c = cur(inv.entity);
    var amt = h("input", { class: "input num", value: (inv.balance / Math.pow(10, E.dp(c))).toFixed(E.dp(c)), inputmode: "decimal", "aria-label": "Amount" });
    ui.modal({ title: "Record a payment on " + inv.number, text: E.customers[inv.customer].name + " owes " + E.fmt(inv.balance, c) + ". The receipt posts to the operating account today.",
      body: h("label", { class: "field" }, h("span", null, "Amount (" + c + ")"), amt),
      actions: [{ label: "Cancel" }, { label: "Record payment", kind: "primary", fn: function () {
        var v = Math.round(parseFloat(String(amt.value).replace(/[^0-9.]/g, "")) * Math.pow(10, E.dp(c)));
        if (!v || v < 0) { amt.focus(); return true; }
        app.run("ar.apply", { invoice: inv.id, amount: v }, { ok: function (r) { return "Payment recorded · " + r.journal.id + "."; } });
      } }] });
  }
  D._recordPayment = recordPayment;

  /* ======================================================= Ledger lines
     ref.q = { entity|scope, accounts, from, to, dept, product, project, vendor, title } */
  D.lines = {
    title: function (r) { return (r.q && r.q.title) || "Lines"; },
    wide: true,
    render: function (ref, body) {
      var E = En(), app = A(), q = ref.q || {};
      var scope = q.entity || app.scope, group = scope === "GROUP";
      var lines = E.linesWhere({ entity: scope, accounts: q.accounts, from: q.from, to: q.to, dept: q.dept, product: q.product, project: q.project, vendor: q.vendor, customer: q.customer });
      var c = group ? "USD" : cur(scope);
      function val(l) { return group ? E.usdOf(l.entity, l.amt, l.period, E.accounts[l.account].bs ? "close" : "avg") : l.amt; }
      var total = lines.reduce(function (s, l) { return s + val(l); }, 0);
      var acctNames = (q.accounts || []).slice(0, 4).map(function (a) { return a + " " + E.accounts[a].name; }).join(", ") + ((q.accounts || []).length > 4 ? " +" + (q.accounts.length - 4) : "");
      body.appendChild(head("hash", q.title || "Ledger lines", (acctNames || "All accounts") + " · " + (q.from === q.to ? ui.period(q.from, true) : ui.period(q.from) + " – " + ui.period(q.to)) + " · " + (group ? "OploCloud Group" : E.entity[scope].name),
        E.fmt(total, c), h("span", { class: "muted", style: { fontSize: "12px" } }, lines.length + " lines · debit positive")));
      if (group) body.appendChild(h("p", { class: "note", style: { marginBottom: "10px" } }, "Amounts in each entity's own currency, with the USD translation used in consolidation (income and expense at the month's average rate, balances at the closing rate)."));
      body.appendChild(ui.table({ dense: true, onRow: function (l) { app.open({ kind: "journal", id: l.j }); }, sortKey: "date", sortDir: -1, limit: 300,
        columns: [
          { key: "date", label: "Date", sort: function (l) { return l.date + l.j; }, render: function (l) { return ui.date(l.date); } },
          { key: "j", label: "Journal", sort: function (l) { return l.j; }, render: function (l) { return h("span", { class: "mono" }, l.j); } },
          group ? { key: "e", label: "Entity", render: function (l) { return l.entity; } } : null,
          { key: "acct", label: "Account", render: function (l) { return l.account; } },
          { key: "memo", label: "Memo", render: function (l) { return h("span", { class: "ell", style: { maxWidth: "280px", display: "inline-block" } }, l.memo || ""); } },
          { key: "amt", label: group ? "Local" : "Amount", num: true, sort: function (l) { return l.amt; }, render: function (l) { return E.fmt(l.amt, cur(l.entity)); } },
          group ? { key: "usd", label: "USD", num: true, sort: val, render: function (l) { return E.fmt(val(l), "USD"); } } : null
        ].filter(Boolean), rows: lines }));
    }
  };

  /* ============================================================ Account */
  D.account = {
    title: function (r) { var a = En().accounts[r.id]; return a ? r.id + " " + a.name : r.id; },
    wide: true,
    render: function (ref, body) {
      var E = En(), app = A(), a = E.accounts[ref.id];
      if (!a) { body.appendChild(ui.empty("No such account", ref.id, "alert")); return; }
      var scope = (ref.q && ref.q.entity) || app.scope, group = scope === "GROUP";
      var c = group ? "USD" : cur(scope);
      var ents = group ? E.entities.map(function (e) { return e.id; }) : [scope];
      var ps = E.periodsBetween(E.fy + "-01", E.currentPeriod());
      var rows = ps.map(function (p) {
        var net = 0, bal = 0;
        ents.forEach(function (e) {
          var n = E.net(e, a.id, p, p), b = a.bs ? E.balance(e, a.id, p) : E.net(e, a.id, E.fy + "-01", p);
          net += group ? E.usdOf(e, n, p, a.bs ? "close" : "avg") : n;
          bal += group ? (a.bs ? E.usdOf(e, b, p, "close") : E.translatedPL(e, a.id, E.fy + "-01", p)) : b;
        });
        return { p: p, net: E.natural(a.id, net), bal: E.natural(a.id, bal) };
      });
      var last = rows[rows.length - 1];
      body.appendChild(head("book", a.id + " " + a.name, { asset: "Asset", liability: "Liability", equity: "Equity", revenue: "Revenue", expense: "Expense" }[a.type] + " · normal " + (a.normal === "D" ? "debit" : "credit") + " balance" + (a.contra ? " · contra account" : "") + " · " + (group ? "OploCloud Group" : E.entity[scope].name),
        E.fmt(last.bal, c), h("span", { class: "muted", style: { fontSize: "12px" } }, a.bs ? "Balance, " + ui.period(last.p) : "Year to date")));
      if (a.control) body.appendChild(h("div", { class: "flag done", style: { marginBottom: "14px" } }, ui.icon("lock"), h("div", null, h("div", { class: "t" }, "Control account"),
        h("div", { class: "x" }, "Only " + { ar: "Receivables", ap: "Payables", fa: "Fixed assets" }[a.control] + " posts here, so the subledger and this balance always agree. Manual journals are refused."))));
      body.appendChild(ui.charts.line({ height: 150, labels: rows.map(function (r) { return r.p; }), xFormat: function (p) { return ui.period(p).slice(0, 3); },
        series: [{ name: a.bs ? "Balance" : "Year to date", color: "var(--s1)", values: rows.map(function (r) { return r.bal; }), area: true }],
        yFormat: function (v) { return E.fmt(v, c, { compact: true }); }, tipFormat: function (v) { return E.fmt(v, c, { dp: 0 }); }, tipTitle: function (p) { return ui.period(p, true); } }));
      body.appendChild(sec("By month", ui.table({ dense: true, sortable: false, onRow: function (r) {
          app.open({ kind: "lines", id: a.id + "-" + r.p, q: { entity: scope, accounts: [a.id], from: r.p, to: r.p, title: a.name + " · " + ui.period(r.p) } });
        }, columns: [
          { key: "p", label: "Period", render: function (r) { return h("span", { class: "row" }, ui.period(r.p, true), group ? null : (function () { var s = E.periodStatus(scope, r.p); return s === "locked" || s === "closed" ? h("span", { class: "lock" }, ui.icon("lock", "sm")) : null; })()); } },
          { key: "net", label: "Activity", num: true, render: function (r) { return ui.amt(r.net, c); } },
          { key: "bal", label: a.bs ? "Closing balance" : "Year to date", num: true, render: function (r) { return ui.amt(r.bal, c); } }], rows: rows.slice().reverse() })));
    }
  };

  /* ============================================================= Vendor */
  D.vendor = {
    title: function (r) { var v = En().vendors[r.id]; return v ? v.name : r.id; },
    wide: true,
    render: function (ref, body, foot) {
      var E = En(), app = A(), v = E.vendors[ref.id];
      if (!v) { body.appendChild(ui.empty("No such vendor", ref.id, "alert")); return; }
      var c = cur(v.entity), invs = Object.values(E.apInvoices).filter(function (i) { return i.vendor === v.id; });
      var ytd = invs.filter(function (i) { return i.journal && i.date >= E.fy; }).reduce(function (s, i) { return s + i.amount; }, 0);
      body.appendChild(head("payables", v.name, v.category + " · " + E.entity[v.entity].name + " · vendor since " + v.created.slice(0, 4), E.fmt(ytd, c), h("span", { class: "muted", style: { fontSize: "12px" } }, "Approved this year")));
      if (v.bankPending) {
        body.appendChild(h("div", { class: "flag critical" }, ui.sev("critical"), h("div", { class: "grow" },
          h("div", { class: "t" }, "Bank details change waiting for verification"),
          h("div", { class: "x" }, "From " + v.bank.bank + " " + v.bank.mask + " to " + v.bankPending.bank + " " + v.bankPending.mask + " — " + v.bankPending.via + ". " + (v.bankPending.note || "")),
          h("div", { class: "rule" }, "Payments to this vendor are held until Treasury verifies by call-back."),
          h("div", { class: "acts" }, ui.gated("vendor.verify", {}, "Verify by call-back", function () { verifyBank(v); }, { size: "sm", kind: "primary", icon: "phone" })))));
      }
      body.appendChild(kv([
        ["Pays to", v.bank.bank + " " + v.bank.mask + (v.bank.verified ? " · verified" : "")], ["Terms", v.terms ? "Net " + v.terms : "Due on receipt"],
        ["Default coding", v.account + " " + E.accounts[v.account].name + (E.accounts[v.account].bs ? "" : " · " + E.dimName("dept", v.dept))],
        ["Tax ID", v.tin || "—"], ["Remit email", v.email || "—"], ["Tax form", v.w9 ? "W-9 on file" : "Not required"]
      ]));
      var by = {};
      invs.forEach(function (i) { if (i.journal) { var p = (i.glDate || i.date).slice(0, 7); by[p] = (by[p] || 0) + i.amount; } });
      var ps = E.periodsBetween(E.fy + "-01", E.currentPeriod());
      if (invs.length > 2) body.appendChild(ui.charts.columns({ height: 130, labels: ps, xFormat: function (p) { return ui.period(p).slice(0, 3); },
        series: [{ name: "Approved invoices", color: "var(--s1)", values: ps.map(function (p) { return by[p] || 0; }) }], prelimFrom: ps.length - 1,
        yFormat: function (x) { return E.fmt(x, c, { compact: true }); }, tipFormat: function (x) { return E.fmt(x, c, { dp: 0 }); }, tipTitle: function (p) { return ui.period(p, true); } }));
      body.appendChild(sec("Invoices", ui.table({ dense: true, onRow: function (i) { app.open({ kind: "ap", id: i.id }); }, sortKey: "date", sortDir: -1, columns: [
        { key: "number", label: "Invoice", render: function (i) { return h("span", null, i.number, (i.flags || []).some(function (f) { return !f.resolved; }) ? h("span", { style: { marginLeft: "6px" } }, ui.tag("Flag", "serious")) : null); } },
        { key: "date", label: "Date", sort: function (i) { return i.date; }, render: function (i) { return ui.date(i.date); } },
        { key: "status", label: "Status", render: function (i) { return ui.status(i.status); } },
        { key: "amount", label: "Amount", num: true, sort: function (i) { return i.amount; }, render: function (i) { return E.fmt(i.amount, c); } }], rows: invs })));
      body.appendChild(sec("History", history([v.id])));
    }
  };

  /* ============================================================ Customer */
  D.customer = {
    title: function (r) { var c = En().customers[r.id]; return c ? c.name : r.id; },
    wide: true,
    render: function (ref, body) {
      var E = En(), app = A(), cu = E.customers[ref.id];
      if (!cu) { body.appendChild(ui.empty("No such customer", ref.id, "alert")); return; }
      var c = cur(cu.entity), invs = Object.values(E.arInvoices).filter(function (i) { return i.customer === cu.id; });
      var open = invs.filter(function (i) { return i.balance > 0; }), bal = open.reduce(function (s, i) { return s + i.balance; }, 0);
      var paid = invs.filter(function (i) { return i.payments.length; });
      var avgLate = paid.length ? Math.round(paid.reduce(function (s, i) { return s + E.daysBetween(i.due, i.payments[i.payments.length - 1].date); }, 0) / paid.length) : null;
      body.appendChild(head("receivables", cu.name, cu.segment + " · " + E.dimName("product", cu.product) + (cu.usage && cu.usage !== cu.product ? " + " + E.dimName("product", cu.usage) + " API" : "") + " · customer since " + cu.since, E.fmt(bal, c), h("span", { class: "muted", style: { fontSize: "12px" } }, "Owed today")));
      var used = cu.creditLimit ? bal / cu.creditLimit : 0;
      body.appendChild(h("div", { style: { margin: "0 0 18px" } },
        h("div", { class: "row", style: { fontSize: "12.5px", marginBottom: "6px" } }, h("span", { class: "muted" }, "Credit used"), h("span", { class: "sp" }),
          h("b", { class: "num" }, E.fmt(bal, c, { dp: 0 }) + " of " + E.fmt(cu.creditLimit, c, { dp: 0 })), used > 1 ? ui.tag("Over limit", "bad") : null),
        ui.meter(used, { max: Math.max(1.2, used), mark: 1 })));
      var ag = { cur: 0, a: 0, b: 0, c: 0, d: 0 };
      open.forEach(function (i) { var l = E.daysBetween(i.due, E.asOf); if (l <= 0) ag.cur += i.balance; else if (l <= 30) ag.a += i.balance; else if (l <= 60) ag.b += i.balance; else if (l <= 90) ag.c += i.balance; else ag.d += i.balance; });
      body.appendChild(kv([["Current", E.fmt(ag.cur, c)], ["1–30 days", E.fmt(ag.a, c)], ["31–60 days", E.fmt(ag.b, c)], ["61–90 days", E.fmt(ag.c, c)], ["90+ days", E.fmt(ag.d, c)],
        ["Pays, on average", avgLate == null ? "—" : avgLate <= 0 ? "On time" : avgLate + " days late"]]));
      body.appendChild(sec("Invoices", ui.table({ dense: true, onRow: function (i) { app.open({ kind: "ar", id: i.id }); }, sortKey: "date", sortDir: -1, columns: [
        { key: "number", label: "Invoice" }, { key: "date", label: "Issued", sort: function (i) { return i.date; }, render: function (i) { return ui.date(i.date); } },
        { key: "due", label: "Due", sort: function (i) { return i.due; }, render: function (i) { return ui.date(i.due); } },
        { key: "st", label: "Status", render: function (i) { var l = E.daysBetween(i.due, E.asOf); return i.balance === 0 ? ui.status("paid") : l > 0 ? ui.status("overdue", l + " days late") : ui.status("open"); } },
        { key: "amount", label: "Amount", num: true, sort: function (i) { return i.amount; }, render: function (i) { return E.fmt(i.amount, c); } },
        { key: "balance", label: "Balance", num: true, sort: function (i) { return i.balance; }, render: function (i) { return i.balance ? E.fmt(i.balance, c) : "—"; } }], rows: invs })));
    }
  };

  /* ============================================================== Asset */
  D.asset = {
    title: function (r) { return r.id; },
    render: function (ref, body) {
      var E = En(), app = A(), a = E.assets[ref.id];
      if (!a) { body.appendChild(ui.empty("No such asset", ref.id, "alert")); return; }
      var c = cur(a.entity), bk = E.assetBook(a, E.currentPeriod());
      body.appendChild(head("box", a.name, a.id + " · " + E.accounts[a.cls].name + " · " + E.entity[a.entity].name, E.fmt(bk.nbv, c), h("span", { class: "muted", style: { fontSize: "12px" } }, "Net book value")));
      body.appendChild(kv([["Cost", E.fmt(a.cost, c)], ["Accumulated depreciation", E.fmt(bk.accumulated, c)], ["In service", ui.date(a.inService, "year")],
        ["Useful life", a.life + " months · straight line"], ["Monthly depreciation", E.fmt(bk.monthly, c)], ["Depreciated through", a.depThrough ? ui.period(a.depThrough, true) : "Not yet"],
        ["Department", E.dimName("dept", a.dept)], ["Location", a.location], ["Source", E.apInvoices[a.source] ? openLink({ kind: "ap", id: a.source }, E.apInvoices[a.source].number) : a.source]]));
      var rows = [], start = E.addMonths(a.inService.slice(0, 7), 1), accum = 0;
      for (var i = 0, p = start; i < a.life; i++, p = E.addMonths(p, 1)) {
        var amt = Math.min(bk.monthly, a.cost - accum);
        if (amt <= 0) break;
        accum += amt;
        if (p >= E.fy + "-01" && p <= E.fy + "-12") rows.push({ p: p, amt: amt, acc: accum, nbv: a.cost - accum, posted: a.depThrough && p <= a.depThrough });
      }
      body.appendChild(sec("Schedule, fiscal " + E.fy, ui.table({ dense: true, sortable: false, columns: [
        { key: "p", label: "Period", render: function (r) { return ui.period(r.p, true); } },
        { key: "s", label: "", render: function (r) { return r.posted ? ui.status("posted") : ui.status("todo", "Scheduled"); } },
        { key: "amt", label: "Depreciation", num: true, render: function (r) { return E.fmt(r.amt, c); } },
        { key: "acc", label: "Accumulated", num: true, render: function (r) { return E.fmt(r.acc, c); } },
        { key: "nbv", label: "Book value", num: true, render: function (r) { return E.fmt(r.nbv, c); } }], rows: rows })));
    }
  };

  /* ========================================================== Bank line */
  D.bankline = {
    title: function (r) { return "Bank line"; },
    render: function (ref, body) {
      var E = En(), app = A(), l = E.bankLines[ref.id];
      if (!l) { body.appendChild(ui.empty("No such bank line", ref.id, "alert")); return; }
      var b = E.bankAccounts[l.bank], c = cur(b.entity);
      body.appendChild(head("bank", l.desc, b.bankName + " " + b.name + " " + b.mask, E.fmt(l.amount, c), ui.status(l.status)));
      body.appendChild(kv([["Date", ui.date(l.date, "year")], ["Reference", h("span", { class: "mono" }, l.ref)], ["Matched by", l.matchedBy ? ui.who(l.matchedBy) : "—"]]));
      if (l.matches && l.matches.length) body.appendChild(sec("Matched to", h("div", { class: "stack" }, l.matches.map(function (k) {
        var jl = E.lineByKey(k);
        return jl ? h("div", { class: "row" }, openLink({ kind: "journal", id: jl.j }, jl.j), h("span", { class: "muted" }, jl.memo), h("span", { class: "sp" }), h("b", { class: "num" }, E.fmt(jl.amt, c))) : null;
      }))));
      body.appendChild(sec("History", history([l.id])));
    }
  };

  /* ================================================================ PO */
  D.po = {
    title: function (r) { return r.id; },
    render: function (ref, body) {
      var E = En(), po = E.pos[ref.id];
      if (!po) { body.appendChild(ui.empty("No such purchase order", ref.id, "alert")); return; }
      var c = cur(po.entity);
      body.appendChild(head("doc", po.id, E.vendors[po.vendor].name + " · " + po.budget, E.fmt(po.total, c), ui.status(po.status)));
      body.appendChild(kv([["Ordered", ui.date(po.date, "year")], ["Requested by", po.requester], ["Approved by", ui.who(po.approvedBy)]]));
      body.appendChild(ui.table({ dense: true, sortable: false, columns: [
        { key: "desc", label: "Item" }, { key: "qty", label: "Ordered", num: true }, { key: "received", label: "Received", num: true, render: function (l) { return l.received + (l.receivedOn ? " · " + ui.date(l.receivedOn) : ""); } },
        { key: "unit", label: "Unit price", num: true, render: function (l) { return E.fmt(l.unit, c); } }], rows: po.lines }));
    }
  };

  /* ============================================================ Anomaly */
  D.anomaly = {
    title: function (r) { return r.id; },
    render: function (ref, body, foot) {
      var E = En(), app = A(), a = E.anomalies[ref.id];
      if (!a) { body.appendChild(ui.empty("No such flag", ref.id, "alert")); return; }
      body.appendChild(head("shield", a.title, "Raised " + ui.time(a.raisedAt) + " by the controls engine", a.amount != null ? E.fmt(a.amount, "USD") : null, ui.status(a.status === "open" ? a.sev : a.status)));
      body.appendChild(h("p", { style: { fontSize: "14px", lineHeight: "1.55", marginBottom: "14px" } }, a.detail));
      body.appendChild(h("div", { class: "flag done" }, ui.icon("info"), h("div", null, h("div", { class: "t" }, "Rule"), h("div", { class: "x" }, a.rule))));
      body.appendChild(h("p", { class: "note", style: { margin: "10px 0" } }, "A flag is a reason to look, not an accusation. Resolve it with a note either way — the note stays on the record."));
      var links = h("div", { class: "stack" });
      (a.refs || []).forEach(function (r) {
        if (E.vendors[r]) links.appendChild(openLink({ kind: "vendor", id: r }, "Vendor · " + E.vendors[r].name));
        else if (E.journals[r]) links.appendChild(openLink({ kind: "journal", id: r }, "Journal · " + r));
        else if (E.apInvoices[r]) links.appendChild(openLink({ kind: "ap", id: r }, "Invoice · " + E.apInvoices[r].number));
      });
      if (a.kind === "split") E.cards.filter(function (x) { return x.split; }).forEach(function (x) { links.appendChild(h("div", { class: "row" }, ui.icon("card", "sm"), h("span", null, x.holder + " · " + x.merchant + " · " + ui.date(x.date)), h("span", { class: "sp" }), h("b", { class: "num" }, E.fmt(x.amount, "USD")))); });
      if (a.kind === "threshold") Object.values(E.apInvoices).filter(function (i) { return i.vendor === "crescent"; }).forEach(function (i) { links.appendChild(openLink({ kind: "ap", id: i.id }, i.number + " · " + ui.date(i.date) + " · " + E.fmt(i.amount, "USD"))); });
      if (links.childNodes.length) body.appendChild(sec("Evidence", links));
      if (a.status !== "open") body.appendChild(sec("Outcome", h("p", null, (a.status === "escalated" ? "Escalated to Internal Audit" : a.status === "resolved" ? "Resolved" : "Dismissed") + " by " + ui.person(a.resolvedBy).name + " · " + ui.time(a.resolvedAt) + (a.note ? " — “" + a.note + "”" : ""))));
      body.appendChild(sec("History", history([a.id])));
      if (a.status === "open") {
        foot.appendChild(ui.gated("anomaly.resolve", {}, "Escalate to Internal Audit", function () {
          ui.ask({ title: "Escalate " + a.id + "?", label: "Note for Internal Audit", placeholder: "What you found, and why it needs a closer look" }).then(function (n) { if (n) app.run("anomaly.resolve", { id: a.id, outcome: "escalated", note: n }, { ok: "Escalated to Internal Audit." }); });
        }, { kind: "primary" }));
        foot.appendChild(ui.gated("anomaly.resolve", {}, "Dismiss", function () {
          ui.ask({ title: "Dismiss " + a.id + "?", label: "Why is it fine?", placeholder: "e.g. reclass approved in advance; timing only" }).then(function (n) { if (n) app.run("anomaly.resolve", { id: a.id, outcome: "dismissed", note: n }, { ok: "Flag dismissed." }); });
        }));
      }
    }
  };

  /* ========================================================= Close task */
  D.task = {
    title: function (r) { return r.id; },
    render: function (ref, body, foot) {
      var E = En(), app = A(), t = E.closeTasks[ref.id];
      if (!t) { body.appendChild(ui.empty("No such task", ref.id, "alert")); return; }
      var blockers = (t.deps || []).filter(function (d) { return E.closeTasks[d].status !== "done"; });
      body.appendChild(head("close", t.title, t.area + " · " + ui.period(t.period, true) + " close", null, ui.status(t.status === "todo" && blockers.length ? "blocked" : t.status, t.status === "todo" && blockers.length ? "Waiting" : null)));
      body.appendChild(kv([["Owner", ui.who(t.owner)], ["Due", ui.date(t.due, "year") + " · " + t.wd], ["Kind", t.run ? "Automated — posts journals" : "Review — sign-off with evidence"],
        t.completedBy ? ["Completed by", ui.who(t.completedBy)] : null, t.completedAt ? ["Completed", ui.time(t.completedAt)] : null]));
      if (t.deps && t.deps.length) body.appendChild(sec("Depends on", h("div", { class: "stack" }, t.deps.map(function (d) {
        var dt = E.closeTasks[d];
        return h("div", { class: "row" }, ui.status(dt.status), openLink({ kind: "task", id: d }, dt.title));
      }))));
      if (t.journals && t.journals.length) body.appendChild(sec("Posted", h("div", { class: "stack" }, t.journals.map(function (id) {
        var j = E.journals[id];
        return h("div", { class: "row" }, openLink({ kind: "journal", id: id }, id), h("span", { class: "muted ell grow" }, j.memo), h("b", { class: "num" }, E.fmt(j.total, cur(j.entity))));
      }))));
      if (t.note) body.appendChild(sec("Note", h("p", null, t.note)));
      body.appendChild(sec("History", history([t.id])));
      if (t.status !== "done") {
        foot.appendChild(ui.gated("close.task", {}, t.run ? "Run and complete" : "Mark complete", function () {
          if (t.run) app.run("close.run", { id: t.id }, { ok: function (r) { return "“" + t.title + "” done" + (r.task.journals.length ? " · posted " + r.task.journals.length + " journal" + (r.task.journals.length > 1 ? "s" : "") : "") + "."; } });
          else ui.ask({ title: "Complete “" + t.title + "”", label: "Evidence or note", placeholder: "What you checked, and where the evidence is" }).then(function (n) { if (n) app.run("close.run", { id: t.id, note: n }, { ok: "“" + t.title + "” complete." }); });
        }, { kind: "primary", icon: t.run ? "play" : "check" }));
        if (blockers.length) foot.appendChild(h("span", { class: "muted", style: { fontSize: "12.5px" } }, "Waiting on " + E.closeTasks[blockers[0]].title));
      } else if (!(t.journals && t.journals.length)) {
        foot.appendChild(ui.gated("close.task", {}, "Reopen", function () { app.run("close.reopen", { id: t.id }, { ok: "Task reopened." }); }));
      }
    }
  };
})(window);
