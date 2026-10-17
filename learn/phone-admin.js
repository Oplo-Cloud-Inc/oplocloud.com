/* ==========================================================================
   OEdu on a phone — what an administrator does between meetings.

     Applications   the admissions queue, one application as a short story
                    (where it is, what it waits on, what is next), documents
                    looked at and verified, a decision made, a note left
     Watchlist      who may need someone to step in, and why
     Staff          who teaches what, and a way to reach them
     Work orders    what is broken or wanted, who has it, and moving it on

   The same calls and the same rules as the console. The registrar's gates are
   the server's: a step that is not allowed says what stands in the way.
   Mounted by phone-staff.js: OPLO_PHONE_ADMIN(P, F).
   ========================================================================== */
window.OPLO_PHONE_ADMIN = function (P, F) {
  "use strict";

  var K = P.K, el = P.el, esc = P.esc, API = K.API, NS = API.enrollment, FX = API.facilities;
  function X() { return F.x(); }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }
  function num(n) { return n == null ? "" : String(Math.round(Number(n) * 100) / 100); }
  function ago(ms) {
    if (!ms) return "";
    var d = new Date(ms), now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    return X().relDay(ms);
  }
  function dayOf(ymd) { return ymd ? X().short(ymd) : ""; }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }

  /* A question with a typed answer, in a sheet. */
  function ask(o) {
    var inp = el(o.line ? "input" : "textarea");
    if (o.line) inp.type = "text"; else inp.rows = o.rows || 4;
    inp.placeholder = o.placeholder || "";
    var ctl = P.sheet({ title: o.title, sub: o.sub, tone: o.tone || "purple", body: function (b) {
      var g = P.group();
      g.appendChild(F.field(o.label || "Note", inp));
      b.appendChild(g);
      if (o.extra) o.extra(b);
      var row = el("div", "ph-btnrow");
      var go = F.cta(o.cta || "Save", o.danger ? "danger" : "", function () {
        var v = inp.value.trim();
        if (o.required && !v) { P.toast(o.required); return; }
        go.disabled = true;
        Promise.resolve(o.onSubmit(v)).then(function () { ctl.close(); }, function (e) { go.disabled = false; P.toast(e && e.message ? e.message : "That was refused."); });
      });
      row.appendChild(go);
      b.appendChild(row);
    } });
    setTimeout(function () { try { inp.focus(); } catch (e) { /* old browsers */ } }, 420);
    return ctl;
  }

  /* ============================================================ Applications */
  var STATUS = { draft: ["Draft", ""], submitted: ["Submitted", "blue"], incomplete: ["Incomplete", "orange"], under_review: ["Under review", "blue"],
    changes_requested: ["Changes requested", "orange"], awaiting_decision: ["Awaiting decision", "blue"], waitlisted: ["Waitlisted", ""],
    admitted: ["Admitted", "green"], rejected: ["Declined", "red"], withdrawn: ["Withdrawn", ""] };
  var DOC = { missing: ["Not received", "orange"], received: ["Received", "blue"], verified: ["Verified", "green"], returned: ["Returned", "red"], waived: ["Waived", ""] };
  var TYPES = { "new": "New", returning: "Returning", transfer: "Transfer" };
  var REJECT = { ineligible: "Not eligible for the grade", incomplete_file: "The file was never completed", no_seat: "No seat available",
    failed_assessment: "Did not meet the assessment", duplicate: "Duplicate application", withdrawn_by_family: "Withdrawn by the family", other: "Another reason" };
  var VIEWS = [["decision", "Ready to decide"], ["verify", "To verify"], ["incomplete", "Needs documents"], ["ready", "Ready to enroll"], ["mine", "My queue"], ["open", "In progress"],
    ["offers", "Offers out"], ["waitlist", "Waitlist"], ["overdue", "Overdue"], ["closed", "Closed"], ["all", "All"]];
  var FULL = {};

  function buildApps(L) {
    L.head({ eyebrow: "Students", title: "Applications" });
    var host = L.add(el("div"));
    var st = { view: null, q: "", page: 1 }, counts = {}, items = [], total = 0, timer = null;
    var find = el("label", "ph-find", P.icon("search") + '<input type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Name or number" aria-label="Find an application">');
    var inp = find.querySelector("input");
    var chips = el("div", "ph-fchips"), list = el("div");
    host.appendChild(find); host.appendChild(chips); host.appendChild(list);
    L.onReveal = function () { load(true); };
    inp.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { st.q = inp.value.trim(); st.page = 1; load(true); }, 350); });

    function load(reset) {
      if (reset) { list.innerHTML = ""; list.appendChild(P.skel(4, 78)); st.page = reset === "more" ? st.page : 1; }
      var q = { view: st.view || "all", q: st.q || undefined, page: st.page, size: 25 };
      NS.list(q).then(function (r) {
        counts = r.counts || {};
        if (!st.view) {
          // Open on what wants someone first.
          var first = ["decision", "verify", "incomplete", "ready", "mine", "open"].filter(function (k) { return counts[k]; })[0] || "all";
          if (first !== "all") { st.view = first; load(true); return; }
          st.view = "all";
        }
        total = r.total; items = st.page > 1 ? items.concat(r.items) : r.items;
        draw();
      }, function (e) { P.fail(list, e, function () { load(true); }); });
    }
    function drawChips() {
      chips.innerHTML = "";
      VIEWS.filter(function (v) { return counts[v[0]] || st.view === v[0]; }).forEach(function (v) {
        var b = el("button", "ph-ch" + (st.view === v[0] ? " on" : ""), esc(v[1]) + " <small>" + (counts[v[0]] || 0) + "</small>");
        b.type = "button";
        b.setAttribute("aria-pressed", st.view === v[0] ? "true" : "false");
        b.addEventListener("click", function () { st.view = v[0]; load(true); });
        chips.appendChild(b);
      });
    }
    function draw() {
      drawChips();
      list.innerHTML = "";
      if (!items.length) { list.appendChild(P.empty(st.q ? "Nothing found" : "Nothing here", st.q ? "Try part of a name or an application number." : "No application is in this view.")); return; }
      list.appendChild(el("div")).style.height = "10px";
      var g = P.group();
      items.forEach(function (a) {
        var s = STATUS[a.status] || [a.status, ""], nx = a.next || {};
        var r = el("button", "ph-row has-ic");
        r.type = "button";
        r.appendChild(P.shared.avatar(a.name, 38));
        var bits = [a.number, a.grade, TYPES[a.type] || a.type].filter(Boolean).join(" · ");
        r.appendChild(el("span", "t", "<b>" + esc(a.name) + "</b><small>" + esc(bits) + "</small>" +
          (nx.label ? "<small class='nx " + (nx.kind === "action" ? "go" : "fix") + "'>" + esc(nx.label) + "</small>" : "")));
        r.appendChild(el("span", "v", "<span class='ph-pill " + s[1] + "'>" + esc(s[0]) + "</span>" + (a.overdue ? "<small style='color:var(--ph-red)'>Overdue</small>" : a.dueOn ? "<small>Due " + esc(dayOf(a.dueOn)) + "</small>" : "")));
        r.insertAdjacentHTML("beforeend", P.chev);
        r.addEventListener("click", function () { openApp(a); });
        g.appendChild(r);
      });
      list.appendChild(g);
      if (items.length < total) {
        var row = el("div", "ph-btnrow");
        row.appendChild(F.cta("Show more", "quiet", function () { st.page++; load("more"); }));
        list.appendChild(row);
      }
      P.rise([g], 0);
    }
    load(true);
  }

  function openApp(a) {
    F.place("app:" + a.id, a.number || "Application", 2, { tone: "purple", label: a.name, back: F.up("Applications", "enrollment") }, function (L) { buildApp(L, a); });
  }

  function buildApp(L, row) {
    L.head({ eyebrow: row.number, title: row.name, sub: [row.grade, TYPES[row.type]].filter(Boolean).join(" · ") });
    var host = L.add(el("div"));
    host.appendChild(P.skel(3, 110));
    function load() {
      NS.get(row.id).then(draw, function (e) { P.fail(host, e, function () { L.el.remove(); openApp(row); }); });
    }
    function draw(a) {
      host.innerHTML = "";
      var can = a.can || {}, ev = a.evaluation || {}, nx = ev.next || {}, closed = a.enrollmentId || a.status === "rejected" || a.status === "withdrawn";
      var s = STATUS[a.status] || [a.status, ""];
      L.barTitle.textContent = (a.student && a.student.name) || row.name;
      if (L.titleEl && L.titleEl.parentNode) { L.titleEl.parentNode.removeChild(L.titleEl); L.titleEl = null; }   // the hero says the name

      // Where it is.
      var lead = el("div", "ph-lead t-purple");
      var stages = ev.stages || [];
      var steps = stages.map(function (x) { return "<i class='" + (x.state === "done" ? "d" : x.key === ev.current ? "n" : "") + "' title='" + esc(x.label) + "'></i>"; }).join("");
      var cur = stages.filter(function (x) { return x.key === ev.current; })[0];
      lead.innerHTML = '<div class="row"><div><p class="k">' + esc(a.number + " · " + (TYPES[a.type] || a.type)) + "</p><h2>" + esc((a.student && a.student.name) || row.name) + '</h2><p class="s">' +
        esc([a.grade, a.schoolYear, a.student && a.student.dob ? "born " + dayOf(a.student.dob) : ""].filter(Boolean).join(" · ")) + '</p></div></div>' +
        '<div class="steps">' + steps + "</div>" + (cur ? '<p class="now"><b>' + esc(cur.label) + "</b>" + (cur.note ? " · " + esc(cur.note) : "") + "</p>" : "") +
        '<div class="chips"><span>' + esc(s[0]) + "</span>" + (a.dueOn ? "<span>Due " + esc(dayOf(a.dueOn)) + "</span>" : "") + (a.assignedTo ? "<span>" + esc(a.assignedTo.name || "") + "</span>" : "<span>Unassigned</span>") + "</div>";
      host.appendChild(lead);

      // What stands in the way of a decision.
      var gates = ((ev.gates && (ev.gates.approve || ev.gates.decision)) || []).slice();
      if (!closed && gates.length) {
        host.appendChild(P.sh("Before a decision"));
        var gg = P.group();
        gates.forEach(function (b) {
          if (b.kind === "checks") {
            var l = el("label", "ph-row");
            l.innerHTML = '<span class="t"><b>' + esc(b.label) + '</b><small>Check</small></span><input type="checkbox" class="ph-sw"' + (can.verify ? "" : " disabled") + ">";
            l.querySelector("input").addEventListener("change", function (e) {
              var box = e.target;
              NS.act(a.id, "check", { key: b.ref, done: box.checked }).then(function () { load(); }, function (er) { box.checked = !box.checked; P.toast(er && er.message ? er.message : "That was refused."); });
            });
            gg.appendChild(l);
          } else {
            var d = (a.documents || []).filter(function (x) { return x.key === b.ref; })[0];
            gg.appendChild(P.row({ icon: b.kind === "verified" || b.kind === "documents" ? "doc" : "alert", tone: b.soft ? "orange" : "purple", title: b.label, sub: b.soft ? "Can be set aside with a reason" : "", go: d ? function () { docSheet(a, d, load); } : null, chev: !!d }));
          }
        });
        host.appendChild(gg);
      } else if (!closed && a.status !== "draft") {
        host.appendChild(P.sh("Before a decision"));
        var ok = P.group();
        ok.appendChild(P.row({ icon: "check", tone: "green", title: "Nothing is in the way", chev: false }));
        host.appendChild(ok);
      }

      // Documents.
      var docs = a.documents || [];
      if (docs.length) {
        host.appendChild(P.sh("Documents", { label: docs.filter(function (d) { return d.status === "verified" || d.status === "waived"; }).length + " of " + docs.length }));
        var dg = P.group();
        docs.forEach(function (d) {
          var ds = DOC[d.status] || [d.status, ""];
          dg.appendChild(P.row({ icon: "doc", tone: ds[1] === "green" ? "green" : ds[1] === "red" ? "red" : ds[1] === "orange" ? "orange" : "purple", title: d.label, sub: (d.required ? "Required" : "Optional") + (d.sensitive ? " · restricted" : ""),
            valueHtml: "<span class='ph-pill " + ds[1] + "'>" + esc(ds[0]) + "</span>", go: function () { docSheet(a, d, load); } }));
        });
        host.appendChild(dg);
      }

      // Family.
      var guard = (a.form && a.form.guardians) || [];
      if (guard.length) {
        host.appendChild(P.sh("Family"));
        var fg = P.group();
        guard.forEach(function (g) {
          var nm = [g.firstName || g.first, g.lastName || g.last].filter(Boolean).join(" ") || g.name || "Guardian";
          var phone = g.phone || g.mobile || g.cellPhone || "", mail = g.email || "";
          fg.appendChild(P.row({ icon: "person", tone: "gray", title: nm, sub: [g.relationship || g.relation, phone, mail].filter(Boolean).join(" · "), go: (phone || mail) ? function () { reach(nm, phone, mail); } : null, chev: !!(phone || mail) }));
        });
        host.appendChild(fg);
      }

      // Corrections asked for, and notes.
      var corr = a.corrections || [];
      if (corr.length) {
        host.appendChild(P.sh("Corrections"));
        var cg = P.group();
        corr.forEach(function (c) { cg.appendChild(el("div", "ph-prose", "<small>" + (c.resolved ? "Sent back " + esc(ago(c.resolvedAt)) : "Waiting on the family") + "</small>" + esc(c.message))); });
        host.appendChild(cg);
      }
      var notes = (a.events || []).filter(function (e) { return e.kind === "note"; });
      host.appendChild(P.sh("Notes", { label: "Only the school sees these" }));
      var ng = P.group();
      if (!notes.length) ng.appendChild(el("div", "ph-prose", "No notes."));
      notes.slice(0, 6).forEach(function (n) { ng.appendChild(el("div", "ph-prose", "<small>" + esc((n.byName || "") + " · " + ago(n.at)) + "</small>" + esc(n.note || ""))); });
      host.appendChild(ng);
      var hist = (a.events || []).filter(function (e) { return e.kind === "status"; }).slice(0, 6);
      if (hist.length) {
        host.appendChild(P.sh("History"));
        var hg = P.group();
        hist.forEach(function (e) { hg.appendChild(P.row({ title: ((STATUS[e.to] || [e.to])[0]) + (e.note ? " — " + e.note : ""), sub: (e.byName || "") + " · " + ago(e.at), chev: false })); });
        host.appendChild(hg);
      }

      // What can be done now.
      function run(action, data, ok) {
        return NS.act(a.id, action, data || {}).then(function (r) { P.toast(ok || "Done"); F.bust(); load(); return r; }, function (e) { var m = (e && e.message) || "That was refused."; P.toast(m); throw e; });
      }
      var st = a.status, primary = null;
      if (a.enrollmentId) primary = ["Open the enrollment", function () { full("enrollment"); }];
      else if ((st === "draft" || st === "changes_requested") && can.edit) primary = [st === "draft" ? "Submit application" : "Send corrections back", function () { run(st === "draft" ? "submit" : "resubmit", {}, "Submitted."); }];
      else if ((st === "submitted" || st === "incomplete") && nx.action === "start_review" && can.verify) primary = ["Start the review", function () { run("start_review", {}, "Review started."); }];
      else if (st === "under_review" && nx.action === "mark_ready" && can.verify) primary = ["Ready for a decision", function () { run("mark_ready", {}, "Marked ready for a decision."); }];
      else if (st === "awaiting_decision" && can.decide) primary = ["Decide…", function () { decide(a, run); }];
      else if (st === "waitlisted" && can.decide) primary = ["Reconsider…", function () { reopen(a, "reconsider", run); }];
      else if ((st === "rejected" || st === "withdrawn") && can.decide) primary = ["Reopen…", function () { reopen(a, "reopen", run); }];
      else if (st === "admitted") primary = [a.acceptance === "pending" ? "Record acceptance" : "Enroll student…", function () { full("enrollment"); }];
      if (L.dockEl) { L.dockEl.remove(); L.dockEl = null; }
      var dock = el("div", "ph-dock");
      var more = P.btn("", P.icon("dots"), "More", function () { moreSheet(a, run, load); });
      if (primary) dock.appendChild(F.cta(primary[0], "", primary[1]));
      dock.appendChild(more);
      if (!primary) { more.style.margin = "0 auto"; }
      L.dock(dock);
    }
    L.onReveal = load;
    load();
  }

  function full(tab) { FULL[tab] = true; K.openStaff(tab); }
  function reach(name, phone, mail) {
    P.sheet({ title: name, tone: "gray", body: function (b) {
      var g = P.group();
      function link(icon, t, sub, href) { var a = el("a", "ph-row has-ic", "<span class='ic'>" + P.icon(icon) + "</span><span class='t'><b>" + esc(t) + "</b><small>" + esc(sub) + "</small></span>"); a.href = href; g.appendChild(a); }
      if (phone) link("phone", "Call", phone, "tel:" + String(phone).replace(/[^\d+]/g, ""));
      if (mail) link("mail", "Email", mail, "mailto:" + mail);
      b.appendChild(g);
    } });
  }

  /* One document: look at it, then verify it, return it, or set it aside. */
  function docSheet(a, d, done) {
    var can = a.can || {}, closed = a.enrollmentId || a.status === "rejected" || a.status === "withdrawn";
    var ctl = P.sheet({ title: d.label, sub: (DOC[d.status] || [d.status])[0] + (d.reviewedByName ? " · " + d.reviewedByName : ""), tone: "purple", body: function (b) {
      if (d.note) { var n = P.group(); n.appendChild(el("div", "ph-prose", "<small>Note</small>" + esc(d.note))); b.appendChild(n); }
      var view = el("div", "ph-viewer");
      if (d.restricted) view.appendChild(el("p", "ph-sub", "This document is restricted."));
      else if (d.file) {
        view.appendChild(el("p", "ph-sub", esc(d.file.name + " · " + kb(d.file.size))));
        var open = F.cta("Open the file", "quiet", function () {
          open.disabled = true;
          NS.getFile(a.id, d.key).then(function (f) {
            var bin = atob(f.data), n2 = bin.length, bytes = new Uint8Array(n2);
            for (var i = 0; i < n2; i++) bytes[i] = bin.charCodeAt(i);
            var url = URL.createObjectURL(new Blob([bytes], { type: f.type }));
            if (/^image\/(png|jpe?g|webp)$/.test(f.type)) { var img = el("img"); img.src = url; img.alt = d.label; view.innerHTML = ""; view.appendChild(img); }
            else { view.innerHTML = ""; var l = el("a", "ph-row", "<span class='t'><b>" + esc(f.name) + "</b><small>Opens in a new tab</small></span>" + P.chev); l.href = url; l.target = "_blank"; l.rel = "noopener"; view.appendChild(l); }
            setTimeout(function () { URL.revokeObjectURL(url); }, 300000);
          }, function (e) { open.disabled = false; P.toast(e && e.message ? e.message : "That file couldn’t be read."); });
        });
        view.appendChild(open);
      } else view.appendChild(el("p", "ph-sub", d.status === "received" || d.status === "verified" ? "Seen in person: there is no file." : "No file has been sent."));
      b.appendChild(view);
      if (!closed && (can.verify || can.edit)) {
        var row = el("div", "ph-btnrow");
        if (d.status !== "verified" && can.verify) row.appendChild(F.cta("Verify", "", function () {
          NS.putDocument(a.id, d.key, { status: "verified", sighted: !d.file }).then(function () { ctl.close(); P.toast(d.label + " verified."); if (done) done(); }, function (e) { P.toast(e && e.message ? e.message : "That was refused."); });
        }));
        if (d.status === "missing" && can.edit && !d.file) row.appendChild(F.cta("Mark received", "quiet", function () {
          NS.putDocument(a.id, d.key, { status: "received" }).then(function () { ctl.close(); if (done) done(); }, function (e) { P.toast(e && e.message ? e.message : "That was refused."); });
        }));
        if (row.children.length) b.appendChild(row);
        if (can.verify) {
          var row2 = el("div", "ph-btnrow");
          row2.style.marginTop = "10px";
          row2.appendChild(F.cta("Return it", "quiet", function () {
            ctl.close();
            setTimeout(function () { ask({ title: "Return " + d.label, sub: "The family is asked to send it again, and the application waits on it.", label: "What is wrong with it?", placeholder: "Photo is too dark to read", required: "Say what is wrong with it.", cta: "Return it", onSubmit: function (v) { return NS.putDocument(a.id, d.key, { status: "returned", note: v }).then(function () { P.toast("Returned"); if (done) done(); }); } }); }, 320);
          }));
          row2.appendChild(F.cta("Waive", "quiet", function () {
            ctl.close();
            setTimeout(function () { ask({ title: "Waive " + d.label, sub: "It will no longer be asked for on this application. The reason is kept.", label: "Why is it not needed?", line: true, placeholder: "Held on file from last year", required: "A reason is required.", cta: "Waive it", onSubmit: function (v) { return NS.putDocument(a.id, d.key, { status: "waived", note: v }).then(function () { P.toast("Waived"); if (done) done(); }); } }); }, 320);
          }));
          b.appendChild(row2);
        }
      }
    } });
  }

  /* The decision: admit, waitlist or decline. */
  function decide(a, run) {
    var ev = a.evaluation || {}, soft = ((ev.gates && ev.gates.approve) || []).filter(function (b) { return b.soft; }), hard = ((ev.gates && ev.gates.approve) || []).filter(function (b) { return !b.soft; });
    var mode = "admit", note = el("textarea"), why = el("input"), reason = el("select", "ph-sel"), over = {};
    note.rows = 3; note.placeholder = "Optional — kept with the decision"; why.type = "text"; why.placeholder = "Say why";
    Object.keys(REJECT).forEach(function (k) { var o = el("option"); o.value = k; o.textContent = REJECT[k]; reason.appendChild(o); });
    var ctl = P.sheet({ title: "Decide", sub: (a.student && a.student.name) || a.number, tone: "purple", body: function (b) {
      var seg = P.seg([{ k: "admit", label: "Admit" }, { k: "waitlist", label: "Waitlist" }, { k: "reject", label: "Decline" }], "admit", function (k) { mode = k; paint(); });
      seg.style.margin = "0 0 14px";
      b.appendChild(seg);
      var body = el("div");
      b.appendChild(body);
      var go;
      function paint() {
        body.innerHTML = "";
        var g = P.group();
        if (mode === "admit") {
          if (hard.length) body.appendChild(el("div", "ph-warn", "<b>Not ready to admit</b>" + hard.map(function (x) { return "<p>" + esc(x.label) + "</p>"; }).join("")));
          soft.forEach(function (x) { var f = el("input"); f.type = "text"; f.placeholder = "Required to set this aside"; over[x.kind] = f; g.appendChild(F.field(x.kind === "seats" ? "Admit past the seat limit — why?" : "Admit under the minimum age — why?", f)); body.appendChild(el("p", "ph-sub", esc(x.label))); });
          g.appendChild(F.field("Note", note));
        } else if (mode === "reject") { g.appendChild(F.field("Reason", reason)); g.appendChild(F.field("Note", note)); body.appendChild(el("p", "ph-sub", "The family is told the application was declined. The reason and note are kept on the record.")); }
        else g.appendChild(F.field("Reason", why));
        body.appendChild(g);
        if (go) go.textContent = { admit: "Admit", waitlist: "Place on the waitlist", reject: "Decline" }[mode];
        if (go) go.className = "ph-cta" + (mode === "reject" ? " danger" : "");
        if (go) go.disabled = mode === "admit" && hard.length > 0;
      }
      var row = el("div", "ph-btnrow");
      go = F.cta("Admit", "", function () {
        var action = { admit: "approve", waitlist: "waitlist", reject: "reject" }[mode], data = {};
        if (mode === "admit") {
          data.note = note.value.trim();
          var ov = {};
          for (var k in over) { if (over[k].value.trim().length < 4) { P.toast("Give a reason for setting that aside."); return; } ov[k] = over[k].value.trim(); }
          if (Object.keys(ov).length) data.override = ov;
        } else if (mode === "reject") { data.reason = reason.value; data.note = note.value.trim(); }
        else { data.reason = why.value.trim(); }
        go.disabled = true;
        run(action, data, { approve: "Admitted.", waitlist: "On the waitlist.", reject: "Declined." }[action]).then(function () { ctl.close(); }, function () { go.disabled = false; });
      });
      row.appendChild(go);
      b.appendChild(row);
      paint();
    } });
  }
  function reopen(a, kind, run) {
    ask({ title: kind === "reconsider" ? "Reconsider" : "Reopen", sub: (a.student && a.student.name) || a.number, label: "Why is this being looked at again?", placeholder: "Required", required: "Say why.", cta: kind === "reconsider" ? "Send back for a decision" : "Reopen",
      onSubmit: function (v) { return run(kind, { note: v }, kind === "reconsider" ? "Back with the decision-makers." : "Reopened."); } });
  }
  function moreSheet(a, run, load) {
    var can = a.can || {}, st = a.status, ctl = P.sheet({ title: "More", sub: a.number, tone: "purple", body: function (b) {
      var g = P.group();
      function item(icon, title, sub, go) { g.appendChild(P.row({ icon: icon, tone: "gray", title: title, sub: sub, chev: false, go: function () { ctl.close(); setTimeout(go, 320); } })); }
      if (can.verify && ["submitted", "incomplete", "under_review", "awaiting_decision"].indexOf(st) > -1) item("flag", "Request corrections", "Send it back to the family", function () {
        ask({ title: "Request corrections", sub: "The family sees each line and is asked to fix it.", label: "What needs fixing?", placeholder: "One thing per line", required: "Say what needs fixing.", cta: "Send back", onSubmit: function (v) {
          return run("request_changes", { items: v.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean) }, "Sent back for corrections.");
        } });
      });
      if (can.decide && ["under_review", "awaiting_decision"].indexOf(st) > -1) item("clock", "Place on the waitlist", "", function () { ask({ title: "Place on the waitlist", label: "Reason", line: true, placeholder: "Say why", cta: "Waitlist", onSubmit: function (v) { return run("waitlist", { reason: v }, "On the waitlist."); } }); });
      if (can.decide && ["submitted", "incomplete", "under_review", "awaiting_decision", "waitlisted"].indexOf(st) > -1) item("alert", "Decline application", "", function () {
        var reason = el("select", "ph-sel");
        Object.keys(REJECT).forEach(function (k) { var o = el("option"); o.value = k; o.textContent = REJECT[k]; reason.appendChild(o); });
        ask({ title: "Decline the application", sub: "The family is told. The reason and note are kept.", label: "Note", placeholder: "Optional", danger: true, cta: "Decline", extra: function (bb) { var gg = P.group(); gg.style.marginTop = "12px"; gg.appendChild(F.field("Reason", reason)); bb.insertBefore(gg, bb.firstChild); }, onSubmit: function (v) { return run("reject", { reason: reason.value, note: v }, "Declined."); } });
      });
      if (can.edit) {
        var me = K.S.me;
        item("person", a.assignedTo && a.assignedTo.id === me.id ? "Unassign me" : "Assign to me", a.assignedTo ? "Now with " + a.assignedTo.name : "Nobody has it yet", function () { run("assign", { to: a.assignedTo && a.assignedTo.id === me.id ? null : me.id, dueOn: a.dueOn || "" }, "Saved."); });
        item("pencil", "Add a note", "Only the school sees it", function () { ask({ title: "Add a note", label: "Note", placeholder: "What should the next person know?", required: "Write a note first.", cta: "Add note", onSubmit: function (v) { return run("note", { text: v, internal: true }, "Note added."); } }); });
        if (["draft", "submitted", "incomplete", "under_review", "changes_requested", "awaiting_decision", "waitlisted", "admitted"].indexOf(st) > -1) item("close", "Withdraw application", "", function () { ask({ title: "Withdraw the application", label: "Reason", line: true, placeholder: "Say why", danger: true, cta: "Withdraw", onSubmit: function (v) { return run("withdraw", { reason: v }, "Withdrawn."); } }); });
      }
      item("table", "Open the full page", "Everything about applications", function () { full("enrollment"); });
      b.appendChild(g);
    } });
  }

  /* ================================================================ Watchlist */
  function buildWatch(L) {
    L.head({ eyebrow: "Student support", title: "Watchlist", sub: "Students who may need someone to step in." });
    var host = L.add(el("div"));
    var note = el("p", "ph-sub", "Reading every class…");
    host.appendChild(note);
    host.appendChild(P.skel(4, 66));
    function load() {
      K.watchlist().then(function (r) {
        host.innerHTML = "";
        var flagged = r.flagged;
        if (!flagged.length) { host.appendChild(P.empty("Nobody is flagged", "Nobody is below a pass, missing two or more pieces of work, slipping or often away.")); return; }
        var kinds = [["all", "Everyone"], ["low", "Below a pass"], ["missing", "Missing work"], ["slip", "Slipping"]].concat(r.attendance ? [["away", "Often away"]] : []);
        var cur = "all";
        function n(k) { return k === "all" ? flagged.length : flagged.filter(function (x) { return x.f.some(function (f) { return f.k === k; }); }).length; }
        var chips = el("div", "ph-fchips"), list = el("div");
        host.appendChild(chips); host.appendChild(list);
        function draw() {
          chips.innerHTML = "";
          kinds.filter(function (k) { return n(k[0]) || cur === k[0]; }).forEach(function (k) {
            var b = el("button", "ph-ch" + (cur === k[0] ? " on" : ""), esc(k[1]) + " <small>" + n(k[0]) + "</small>");
            b.type = "button";
            b.addEventListener("click", function () { cur = k[0]; draw(); });
            chips.appendChild(b);
          });
          list.innerHTML = "";
          var shown = cur === "all" ? flagged : flagged.filter(function (x) { return x.f.some(function (f) { return f.k === cur; }); });
          list.appendChild(el("div")).style.height = "8px";
          var g = P.group();
          shown.slice(0, 80).forEach(function (x) {
            var s = x.s, p = s.standing;
            var row = el("button", "ph-row has-ic");
            row.type = "button";
            row.appendChild(P.shared.avatar(s.name, 38));
            row.appendChild(el("span", "t", "<b>" + esc(s.name) + "</b><small>" + esc(x.f.map(function (f) { return f.s; }).join(" · ")) + "</small>"));
            row.appendChild(el("span", "v", p == null ? "" : "<span class='ph-gr " + (p >= 80 ? "ok" : p >= 70 ? "" : p >= 60 ? "orange" : "red") + "'>" + esc(num(p)) + "%</span>" + (x.away != null ? "<small>Away " + x.away + "%</small>" : "")));
            row.insertAdjacentHTML("beforeend", P.chev);
            row.addEventListener("click", function () { F.openStudent(s.id, s.name, s); });
            g.appendChild(row);
          });
          list.appendChild(g);
          if (shown.length > 80) list.appendChild(P.note("And " + (shown.length - 80) + " more. Narrow the list to see them."));
        }
        draw();
      }, function (e) { P.fail(host, e, function () { host.innerHTML = ""; host.appendChild(P.skel(4, 66)); load(); }); });
    }
    load();
  }

  /* ==================================================================== Staff */
  function buildStaff(L) {
    L.head({ eyebrow: "Staff", title: "Teachers", sub: "Who teaches what, and a way to reach them." });
    var f = el("label", "ph-find", P.icon("search") + '<input type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Find a teacher" aria-label="Find a teacher">');
    var inp = f.querySelector("input");
    L.add(f);
    var host = L.add(el("div"));
    host.appendChild(el("p", "ph-sub", "Reading every class…"));
    host.appendChild(P.skel(4, 66));
    var data = null;
    K.school().then(function (d) { data = d.teachers; draw(); }, function (e) { P.fail(host, e, function () { L.el.remove(); K.openStaff("staff"); }); });
    function draw() {
      host.innerHTML = "";
      var q = inp.value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
      var hits = data.filter(function (t) { var hay = ((t.name || "") + " " + (t.email || "") + " " + t.courses.map(function (c) { return c.title; }).join(" ")).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) > -1; }); });
      if (!hits.length) { host.appendChild(P.empty(q ? "Nobody found" : "No teachers yet", "")); return; }
      host.appendChild(el("p", "ph-sub", esc(plural(hits.length, "teacher"))));
      var g = P.group();
      hits.forEach(function (t) {
        var r = el("button", "ph-row has-ic");
        r.type = "button";
        r.appendChild(P.shared.avatar(t.name, 38));
        r.appendChild(el("span", "t", "<b>" + esc(t.name) + "</b><small>" + esc(plural(t.courses.length, "class", "classes") + " · " + plural(t.students, "student")) + "</small>"));
        r.appendChild(el("span", "v", t.toMark ? "<span class='ph-pill orange'>" + t.toMark + " to grade</span>" : ""));
        r.insertAdjacentHTML("beforeend", P.chev);
        r.addEventListener("click", function () { teacherSheet(t); });
        g.appendChild(r);
      });
      host.appendChild(g);
    }
    inp.addEventListener("input", function () { if (data) draw(); });
  }
  function teacherSheet(t) {
    P.sheet({ title: t.name, sub: plural(t.courses.length, "class", "classes") + " · " + plural(t.students, "student"), tone: "blue", body: function (b) {
      var g = P.group();
      if (t.email) { var a = el("a", "ph-row has-ic", "<span class='ic'>" + P.icon("mail") + "</span><span class='t'><b>Email</b><small>" + esc(t.email) + "</small></span>"); a.href = "mailto:" + t.email; g.appendChild(a); }
      g.appendChild(P.row({ icon: "send", tone: "blue", title: "Message in OEdu", chev: false, go: function () { P.shared.compose({ id: t.id, name: t.name }); } }));
      b.appendChild(g);
      b.appendChild(el("p", "ph-sub", "Teaches"));
      var cg = P.group();
      t.courses.forEach(function (c) { cg.appendChild(P.row({ dot: true, tone: P.toneOf(c.subject || c.title), title: c.title, sub: plural(c.students, "student") + (c.atRisk ? " · " + c.atRisk + " below a pass" : ""), valueHtml: c.average != null ? "<b>" + esc(num(c.average)) + "%</b>" : "", chev: false })); });
      b.appendChild(cg);
    } });
  }

  /* ============================================================== Work orders */
  var OSTATUS = { pending: ["Needs a decision", "orange"], open: ["Open", "blue"], in_progress: ["In progress", "blue"], on_hold: ["On hold", "orange"], done: ["Done", "green"], cancelled: ["Cancelled", ""], declined: ["Declined", "red"] };
  function buildOrders(L) {
    L.head({ eyebrow: "Facilities", title: "Work orders" });
    var host = L.add(el("div"));
    host.appendChild(P.skel(4, 76));
    var state = { view: "active" }, rows = [], team = null;
    var chips = el("div", "ph-fchips"), list = el("div");
    function load() {
      host.innerHTML = ""; host.appendChild(chips); host.appendChild(list);
      list.innerHTML = ""; list.appendChild(P.skel(4, 76));
      Promise.all([FX.orders({}), team ? Promise.resolve(team) : FX.team().catch(function () { return []; })]).then(function (r) { rows = r[0].orders || []; team = r[1]; draw(); }, function (e) { P.fail(list, e, load); });
    }
    L.onReveal = load;
    function draw() {
      var views = [["active", "To do", function (o) { return /^(pending|open|in_progress|on_hold)$/.test(o.status); }], ["pending", "Needs a decision", function (o) { return o.status === "pending"; }],
        ["overdue", "Overdue", function (o) { return o.overdue && /^(open|in_progress|on_hold)$/.test(o.status); }], ["unassigned", "Unassigned", function (o) { return !o.assigneeId && /^(open|pending)$/.test(o.status); }],
        ["done", "Done", function (o) { return /^(done|cancelled|declined)$/.test(o.status); }]];
      chips.innerHTML = "";
      views.forEach(function (v) {
        var n = rows.filter(v[2]).length;
        if (!n && state.view !== v[0]) return;
        var b = el("button", "ph-ch" + (state.view === v[0] ? " on" : ""), esc(v[1]) + " <small>" + n + "</small>");
        b.type = "button";
        b.addEventListener("click", function () { state.view = v[0]; draw(); });
        chips.appendChild(b);
      });
      list.innerHTML = "";
      var cur = views.filter(function (v) { return v[0] === state.view; })[0] || views[0];
      var shown = rows.filter(cur[2]).sort(function (a, b) { return (b.priority === "high" ? 1 : 0) - (a.priority === "high" ? 1 : 0) || (a.overdue ? 0 : 1) - (b.overdue ? 0 : 1) || b.createdAt - a.createdAt; });
      if (!shown.length) { list.appendChild(P.empty("Nothing here", "No work order is in this view.")); return; }
      list.appendChild(el("div")).style.height = "10px";
      var g = P.group();
      shown.slice(0, 60).forEach(function (o) {
        var s = OSTATUS[o.status] || [o.status, ""];
        g.appendChild(P.row({ icon: o.priority === "high" ? "alert" : "building", tone: o.priority === "high" ? "red" : "orange", title: o.title, sub: [o.spaceName, o.assigneeName ? "With " + o.assigneeName : "Unassigned", "#" + o.number].filter(Boolean).join(" · "),
          valueHtml: "<span class='ph-pill " + s[1] + "'>" + esc(s[0]) + "</span>" + (o.overdue ? "<small style='color:var(--ph-red)'>Overdue</small>" : ""), go: function () { openOrder(o); } }));
      });
      list.appendChild(g);
    }
    load();
  }
  function openOrder(o0) {
    var ctl = P.sheet({ title: o0.title, sub: [o0.spaceName, "#" + o0.number].filter(Boolean).join(" · "), tone: "orange", body: function (b) {
      var holder = el("div");
      b.appendChild(holder);
      function paint(o, can) {
        holder.innerHTML = "";
        var s = OSTATUS[o.status] || [o.status, ""];
        var g = P.group();
        [["Status", s[0]], ["Priority", o.priority === "high" ? "High" : "Normal"], ["Category", o.category], ["Asked by", o.requesterName], ["With", o.assigneeName || "Nobody yet"], ["Due", o.dueOn ? dayOf(o.dueOn) : null], ["Details", o.details], ["Outcome", o.outcome]].forEach(function (r) {
          if (r[1]) g.appendChild(el("div", "ph-kv", "<small>" + esc(r[0]) + "</small><span>" + esc(r[1]) + "</span>"));
        });
        holder.appendChild(g);
        function go(action, data, ok) {
          return FX.act(o.id, action, data).then(function (n) { F.bust(); P.toast(ok || "Done"); Object.assign(o, n || {}); load(); }, function (e) { P.toast(e && e.message ? e.message : "That was refused."); });
        }
        var row = el("div", "ph-btnrow");
        row.style.flexWrap = "wrap";
        if (can.manage || can.decide) {
          if (o.status === "pending") {
            row.appendChild(F.cta("Accept", "", function () { go("approve", { priority: o.priority }, "Accepted."); }));
            row.appendChild(F.cta("Decline", "danger", function () { ctl.close(); setTimeout(function () { ask({ title: "Decline this request", label: "Why", line: true, placeholder: "The person who asked will read this", required: "Say why.", danger: true, cta: "Decline", tone: "orange", onSubmit: function (v) { return FX.act(o.id, "decline", { reason: v }).then(function () { F.bust(); P.toast("Declined."); }); } }); }, 320); }));
          }
        }
        if (can.work || can.manage) {
          if (o.status === "open" || o.status === "on_hold") row.appendChild(F.cta(o.status === "on_hold" ? "Resume" : "Start", "", function () { go("start", {}, "Started."); }));
          if (o.status === "open" || o.status === "in_progress") row.appendChild(F.cta("Put on hold", "quiet", function () { ctl.close(); setTimeout(function () { ask({ title: "Put on hold", label: "What is it waiting for?", line: true, placeholder: "A part, a person, a date", cta: "Hold it", tone: "orange", onSubmit: function (v) { return FX.act(o.id, "hold", { note: v || undefined }).then(function () { F.bust(); P.toast("On hold."); }); } }); }, 320); }));
          if (o.status === "in_progress" || o.status === "open") row.appendChild(F.cta("Complete", "", function () { ctl.close(); setTimeout(function () { ask({ title: "Complete", sub: o.title, label: "What was done?", placeholder: "Optional", cta: "Complete", tone: "orange", onSubmit: function (v) { return FX.act(o.id, "complete", { outcome: v || undefined }).then(function () { F.bust(); P.toast("Done."); }); } }); }, 320); }));
        }
        if ((o.status === "done" || o.status === "cancelled") && (can.manage || can.work)) row.appendChild(F.cta("Reopen", "quiet", function () { go("reopen", {}, "Reopened."); }));
        if (row.children.length) holder.appendChild(row);
      }
      FX.order(o0.id).then(function (d) { paint(d.order || o0, d.can || {}); }, function () { paint(o0, {}); });
      paint(o0, {});
    } });
    function load() { var t = P.top(); if (t && t.onReveal) t.onReveal(); }
  }

  /* ---------------------------------------------------------------- Routes */
  function admin(tab, fn) { F.routes[tab] = function (o) { if (!F.isAdmin()) return false; if (FULL[tab]) { delete FULL[tab]; return false; } fn(o); return true; }; }
  admin("enrollment", function () { F.layer("applications", 1, "purple", "Applications", buildApps); });
  admin("support", function () { F.layer("watchlist", 1, "orange", "Watchlist", buildWatch); });
  admin("staff", function () { F.layer("staff", 1, "blue", "Teachers", buildStaff); });
  admin("fx-orders", function () { F.layer("orders", 1, "orange", "Work orders", buildOrders); });
};
