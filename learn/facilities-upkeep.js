/* ==========================================================================
   OEdu — Facilities: what recurs, who holds a room, the outside people, the
   papers, and the numbers.

   Routines are preventive jobs, inspections, and the checks a school has to be
   able to show it did. A schedule has no timer: it writes its work order when
   somebody looks and its window has opened, once, and never a pile.

   Bookings are checked against the room's own rules before they are made, and
   every reason one cannot be made is said.

   A vendor is only as current as the papers it was asked for.

   Adds `upkeep`, `bookings`, `vendors`, `documents`, `reports` to OPLO_FX.
   ========================================================================== */
OPLO_FX.add(function (H) {
  "use strict";
  var el = H.el, esc = H.esc, K = H.K, API = H.API, toast = H.toast;
  var UNITS = [["day", "days"], ["week", "weeks"], ["month", "months"], ["year", "years"]];
  var KIND = { preventive: "Preventive", inspection: "Inspection", compliance: "Required check" };
  var COUNTRY = { US: "United States", UK: "United Kingdom (England)", IN: "India", ANY: "Any school" };
  var WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  /* ======================================================== Routines */
  var US = { f: "all" };

  function upkeep(v) {
    var P = K.cxPage(v, "Facilities", "Routines",
      "What recurs: preventive jobs, inspections, and the checks a school has to be able to show it did. Each writes its work order when it falls due.");
    P.tools.appendChild(K.cnAction("New schedule", function () { schedForm({}, null, load); }, true));
    P.tools.appendChild(K.cnAction("Starter checks", function () { starters(load); }));
    var metrics = el("div");
    v.appendChild(metrics);
    var filters = el("div");
    filters.style.cssText = "display:flex;flex-wrap:wrap;margin-bottom:14px";
    v.appendChild(filters);
    var slot = H.slot(v);
    var rows = null, today = H.today();
    var chips = K.cnFilters([{ k: "all", name: "All" }, { k: "preventive", name: "Preventive" }, { k: "inspection", name: "Inspections" },
      { k: "compliance", name: "Required checks" }, { k: "paused", name: "Paused" }], US.f, function (k) { US.f = k; chips.mark(k); draw(); });
    filters.appendChild(chips);

    function load() {
      slot.innerHTML = "";
      slot.appendChild(el("div", "admin-loading", "Loading schedules…"));
      API.schedules().then(function (r) { rows = r.schedules; today = r.today || today; draw(); }, function (e) { H.fail(slot, e, load); });
    }
    function draw() {
      slot.innerHTML = "";
      metrics.innerHTML = "";
      var act = rows.filter(function (s) { return s.active; });
      K.cxMetrics(metrics, [
        { label: "Running", value: act.length },
        { label: "Due in 14 days", value: act.filter(function (s) { return s.nextDueOn && s.nextDueOn <= H.plus(today, 14); }).length },
        { label: "Past due", value: act.filter(function (s) { return s.overdue; }).length, bad: true },
        { label: "Paused", value: rows.length - act.length }
      ]);
      var list = rows.filter(function (s) { return US.f === "all" ? true : US.f === "paused" ? !s.active : s.kind === US.f; });
      if (!list.length) {
        slot.appendChild(K.cnEmpty(rows.length ? "Nothing here." : "Nothing recurs yet.",
          rows.length ? "Change the filter." : "Add a monthly inspection, a filter change, or start from the checks a school is usually asked for.",
          rows.length ? null : "Starter checks", rows.length ? null : function () { starters(load); }));
        return;
      }
      var t = K.cnTable([{ label: "What", w: "minmax(220px, 1.8fr)" }, { label: "Kind", w: "120px" }, { label: "Repeats", w: "120px" },
        { label: "Next due", w: "110px" }, { label: "Last done", w: "110px" }, { label: "", w: "96px" }]);
      list.forEach(function (s) {
        var st = !s.active ? H.chip("muted", "Paused") : s.state === "waiting" ? H.chip("blue", "After the last") : s.state === "finished" ? H.chip("muted", "Finished") : "";
        t.row(["<b>" + esc(s.title) + "</b><span class='cn-sub2'>" + esc([s.spaceName, s.assetName, s.authority].filter(Boolean).join(" · ")) + "</span>",
               esc(KIND[s.kind] || s.kind), esc(H.every(s.every, s.unit)),
               s.nextDueOn ? "<span class='" + (s.overdue ? "en-late" : "") + "'>" + esc(H.day(s.nextDueOn)) + "</span>" : "<span class='cn-none'>—</span>",
               s.lastDoneOn ? esc(H.day(s.lastDoneOn)) : "<span class='cn-none'>never</span>", st],
          function () { schedSheet(s.id, load); }, s.id);
      });
      slot.appendChild(t);
    }
    load();
  }

  function checklistText(list) {
    return (list || []).map(function (x) { return (x.type === "pass_fail" ? "? " : x.type === "note" ? "# " : "") + x.text; }).join("\n");
  }
  function checklistFrom(text) {
    return text.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      if (l.charAt(0) === "?") return { text: l.slice(1).trim(), type: "pass_fail" };
      if (l.charAt(0) === "#") return { text: l.slice(1).trim(), type: "note" };
      return { text: l, type: "check" };
    });
  }

  function schedForm(pre, existing, done) {
    Promise.all([H.spaces(), H.team()]).then(function (r) {
      var list = r[0], who = r[1], s = existing || {};
      var kind = H.fld("select", "What kind", s.kind || pre.kind || "preventive", { options: [["preventive", "A preventive job"], ["inspection", "An inspection"], ["compliance", "A check the school must be able to show"]] });
      var title = H.fld("text", "Title", s.title || pre.title || "", { req: true, max: 160, hint: "Replace the hall filters" });
      var room = H.fld("select", "Where", s.spaceId || "", { options: H.spaceOptions(list, { blank: "Anywhere / the whole school" }) });
      var every = H.fld("number", "Every", s.every || pre.every || 1, { min: 1, max: 60 });
      var unit = H.fld("select", "", s.unit || pre.unit || "month", { options: UNITS });
      var starts = H.fld("date", "First due", s.startsOn || pre.startsOn || H.today(), { req: true });
      var ends = H.fld("date", "Stops after", s.endsOn || "");
      var lead = H.fld("number", "Write the order this many days early", s.leadDays == null ? (pre.leadDays || 0) : s.leadDays, { min: 0, max: 120 });
      var asg = H.fld("select", "Give it to", s.assigneeId || "", { options: H.teamOptions(who) });
      var cat = H.fld("select", "Kind of job", s.category || pre.category || "maintenance", { options: H.CATEGORIES });
      var pri = H.fld("select", "How urgent", s.priority || "normal", { options: H.PRIORITIES });
      var wait = H.check("Wait for the last one to be finished before writing the next", s.skipIfOpen !== false);
      var from = H.check("Count the next one from the day this one is finished", !!s.fromCompletion);
      var brk = H.check("A date that falls in a break moves to the day term starts", !!s.skipBreaks);
      var cl = H.fld("area", "Checklist", checklistText(s.checklist || pre.checklist), { rows: 5, note: "One line each. Start a line with ? for pass or fail, # for a note." });
      var auth = H.fld("text", "Who requires it", s.authority || pre.authority || "", { max: 160 });
      var src = H.fld("text", "Where that is written", s.source || pre.source || "", { max: 240 });
      var details = H.fld("area", "More detail", s.details || pre.details || "", { rows: 2, max: 2000 });
      var note = pre.note ? el("p", "en-note", esc(pre.note)) : null;
      H.dialog({
        title: existing ? "Edit schedule" : "New schedule", wide: true, action: "Save",
        sub: "It writes one work order when it falls due. If the last one is still open it waits, and a month nobody looked is one overdue order, not four.",
        body: function (h) {
          if (note) h.appendChild(note);
          h.appendChild(title.node);
          var g = el("div", "en-form-grid");
          [kind, room, cat, pri, asg].forEach(function (f) { g.appendChild(f.node); });
          h.appendChild(g);
          var row = el("div", "en-form-grid");
          row.appendChild(every.node); row.appendChild(unit.node); row.appendChild(starts.node); row.appendChild(ends.node); row.appendChild(lead.node);
          h.appendChild(row);
          h.appendChild(wait.node); h.appendChild(from.node); h.appendChild(brk.node);
          h.appendChild(cl.node);
          var g2 = el("div", "en-form-grid"); g2.appendChild(auth.node); g2.appendChild(src.node); h.appendChild(g2);
          h.appendChild(details.node);
        },
        onSubmit: function () {
          if (!title.value()) throw new Error("Give it a title.");
          var data = { kind: kind.value(), title: title.value(), spaceId: room.value() || null, category: cat.value(), priority: pri.value(),
            assigneeId: asg.value() || null, every: +every.value() || 1, unit: unit.value(), startsOn: starts.value(), endsOn: ends.value() || null,
            leadDays: +lead.value() || 0, skipIfOpen: wait.value(), fromCompletion: from.value(), skipBreaks: brk.value(),
            checklist: checklistFrom(cl.input.value), authority: auth.value() || null, source: src.value() || null, details: details.value() || null };
          if (pre.assetId && !existing) data.assetId = pre.assetId;
          var p = existing ? API.updateSchedule(existing.id, data) : API.addSchedule(data);
          return p.then(function () { toast("Saved."); if (done) done(); });
        }
      });
    });
  }

  function schedSheet(id, done) {
    API.schedule(id).then(function (d) {
      var s = d.schedule;
      var box = el("div", "en-dlg en-wide");
      var ref = null;
      function reload() { if (ref) ref.close(); schedSheet(id, done); if (done) done(); }
      box.appendChild(el("h2", "en-dlg-h", esc(s.title)));
      box.appendChild(el("p", "en-dlg-sub", esc(KIND[s.kind] || s.kind) + " · " + esc(H.every(s.every, s.unit)) + (s.active ? "" : " · paused")));
      H.line(box, "Where", s.spaceName || s.assetName);
      H.line(box, "Next due", s.nextDueOn ? H.day(s.nextDueOn) : s.state === "waiting" ? "When the open one is finished" : "");
      H.line(box, "Last done", s.lastDoneOn ? H.day(s.lastDoneOn) : "Never");
      H.line(box, "Written", s.leadDays ? s.leadDays + " days before it is due" : "");
      H.line(box, "Required by", s.authority); H.line(box, "Where that is written", s.source);
      H.line(box, "Given to", s.assigneeName); H.line(box, "Detail", s.details);
      if (s.checklist.length) { box.appendChild(el("h3", "en-h3", "Checklist")); s.checklist.forEach(function (c) { box.appendChild(el("div", "fx-linkrow flat", esc(c.text) + (c.type === "pass_fail" ? " <small>pass / fail</small>" : c.type === "note" ? " <small>note</small>" : ""))); }); }
      if (d.orders.length) {
        box.appendChild(el("h3", "en-h3", "Work it has written"));
        d.orders.slice(0, 10).forEach(function (o) {
          var b = el("button", "fx-linkrow", "<span>" + esc(H.number(o.number)) + "</span> " + esc(H.day(o.dueOn)) + " " + H.status(o.status));
          b.type = "button";
          b.addEventListener("click", function () { H.open.order(o.id, reload); });
          box.appendChild(b);
        });
      }
      H.history(box, d.events);
      var acts = el("div", "en-dlg-acts en-wrap");
      if (s.active) acts.appendChild(H.btn("Write the work order now", "strong", function () {
        API.scheduleAct(id, "run_now").then(function (r) { toast(r.made ? "Work order written." : "Nothing was written."); reload(); }, function (e) { toast(e.message); });
      }));
      acts.appendChild(H.btn(s.active ? "Pause" : "Resume", "", function () {
        API.scheduleAct(id, s.active ? "pause" : "resume").then(function () { reload(); }, function (e) { toast(e.message); });
      }));
      acts.appendChild(H.btn("Edit…", "", function () { ref.close(); schedForm({}, s, function () { schedSheet(id, done); if (done) done(); }); }));
      acts.appendChild(H.btn("Close", "quiet", function () { ref.close(); }));
      box.appendChild(acts);
      ref = K.cxSheet(box);
    }, function (e) { toast(e.message); });
  }

  /* The checks a school is usually asked for. Offered, never applied: the
     interval is the school's to confirm. */
  function starters(done) {
    Promise.all([API.templates(), API.schedules()]).then(function (r) {
      var have = {};
      r[1].schedules.forEach(function (s) { have[s.title] = true; });
      var box = el("div", "en-dlg en-wide");
      var ref = null;
      box.appendChild(el("h2", "en-dlg-h", "Starter checks"));
      box.appendChild(el("p", "en-dlg-sub", "The checks schools are commonly asked to keep evidence of. Each says where the interval came from and how firm that source was. " +
        "Many are set by your own authority or by a risk assessment, so you confirm the interval before it is added. Not legal advice."));
      ["US", "UK", "IN", "ANY"].forEach(function (c) {
        var items = r[0].filter(function (t) { return t.country === c; });
        if (!items.length) return;
        box.appendChild(el("h3", "en-h3", esc(COUNTRY[c])));
        items.forEach(function (t) {
          var q = t.quality === "primary" ? H.chip("green", "Rule read") : t.quality === "snippet" ? H.chip("orange", "Confirm it") : H.chip("muted", "Good practice");
          var row = el("div", "fx-starter");
          var info = el("div");
          info.innerHTML = "<b>" + esc(t.title) + "</b><span>" + esc(H.every(t.every, t.unit)) + " · " + esc(t.authority) + "</span><small>" + esc(t.source) + (t.note ? " — " + esc(t.note) : "") + "</small>";
          row.appendChild(info);
          var side = el("div");
          side.innerHTML = q;
          var add = H.btn(have[t.title] ? "Added" : "Add…", have[t.title] ? "quiet" : "", function () {
            ref.close();
            schedForm({ kind: "compliance", title: t.title, every: t.every, unit: t.unit, authority: t.authority, source: t.source, category: t.category,
              leadDays: 7, note: t.note ? t.note : "Confirm the interval against your own authority before you save." }, null, function () { if (done) done(); });
          });
          if (have[t.title]) add.disabled = true;
          side.appendChild(add);
          row.appendChild(side);
          box.appendChild(row);
        });
      });
      var acts = el("div", "en-dlg-acts");
      acts.appendChild(H.btn("Close", "quiet", function () { ref.close(); }));
      box.appendChild(acts);
      ref = K.cxSheet(box);
    }, function (e) { toast(e.message); });
  }

  /* ========================================================= Bookings */
  var BS = { f: "week", room: "" };

  function rulesLine(s) {
    var r = s.rules || {}, d = (r.days || []).slice().sort().map(function (x) { return WEEK[x]; });
    return "Open " + r.opens + "–" + r.closes + " · " + d.join(", ") + " · up to " + r.daysAhead + " days ahead" + (r.noticeHours ? " · " + r.noticeHours + " h notice" : "") +
      (r.maxMinutes ? " · at most " + r.maxMinutes + " min" : "") + (r.bufferMinutes ? " · " + r.bufferMinutes + " min between" : "") +
      (s.approverName ? " · approved by " + s.approverName : " · approved on the spot");
  }

  function bookings(v) {
    var P = K.cxPage(v, "Facilities", "Bookings",
      "Who holds which room, and when. Each room has its own rules, and a request that breaks one says which.");
    P.tools.appendChild(K.cnAction("Book a room", function () { book({}, load); }, true));
    var wait = el("div");
    v.appendChild(wait);
    var filters = el("div");
    filters.style.cssText = "display:flex;flex-wrap:wrap;margin-bottom:14px;align-items:center";
    v.appendChild(filters);
    var slot = H.slot(v);
    var chips = K.cnFilters([{ k: "week", name: "Next 2 weeks" }, { k: "month", name: "Next 3 months" }, { k: "mine", name: "Mine" }], BS.f, function (k) { BS.f = k; chips.mark(k); load(); });
    filters.appendChild(chips);
    var roomSel = el("select", "cn-search");
    roomSel.style.cssText = "margin-left:10px;max-width:220px";
    filters.appendChild(roomSel);
    H.spaces().then(function (list) {
      H.spaceOptions(list, { blank: "Every room", only: "bookable" }).forEach(function (o) { var op = el("option"); op.value = o[0]; op.textContent = o[1]; roomSel.appendChild(op); });
      roomSel.value = BS.room;
    });
    roomSel.addEventListener("change", function () { BS.room = roomSel.value; load(); });

    function load() {
      slot.innerHTML = "";
      slot.appendChild(el("div", "admin-loading", "Loading bookings…"));
      var today = H.today();
      var o = { spaceId: BS.room || undefined };
      if (BS.f === "mine") { o.mine = 1; o.status = "pending,approved"; o.from = today; }
      else { o.from = today; o.to = H.plus(today, BS.f === "week" ? 14 : 92); }
      API.bookings(o).then(function (r) {
        slot.innerHTML = "";
        // waiting for a decision (the ones this person may decide)
        wait.innerHTML = "";
        var pend = r.bookings.filter(function (b) { return b.status === "pending"; });
        if (r.canDecide && pend.length) {
          wait.appendChild(el("h3", "en-h3", "Waiting for a decision"));
          var seen = {};
          pend.forEach(function (b) {
            if (b.seriesId && seen[b.seriesId]) return;
            if (b.seriesId) seen[b.seriesId] = true;
            var n = b.seriesId ? pend.filter(function (x) { return x.seriesId === b.seriesId; }).length : 1;
            var row = el("div", "fx-starter");
            var info = el("div");
            info.innerHTML = "<b>" + esc(b.title) + "</b><span>" + esc(b.spaceName) + " · " + esc(H.dayShort(b.day)) + " " + esc(b.starts) + "–" + esc(b.ends) +
              (n > 1 ? " · and " + (n - 1) + " more dates" : "") + "</span><small>" + esc(b.bookerName || "") + (b.attendees ? " · " + b.attendees + " people" : "") + "</small>";
            row.appendChild(info);
            var side = el("div");
            side.appendChild(H.btn("Approve", "strong", function () {
              API.bookAct(b.id, "approve").then(function () { toast("Approved."); load(); }, function (e) { toast(e.message); });
            }));
            side.appendChild(H.btn("Decline…", "", function () {
              var why = H.fld("area", "Why not", "", { rows: 2, max: 400 });
              H.dialog({ title: "Decline this booking", action: "Decline", body: function (h) { h.appendChild(why.node); },
                onSubmit: function () { if (!why.value()) throw new Error("Give a reason."); return API.bookAct(b.id, "decline", { note: why.value() }).then(function () { toast("Declined."); load(); }); } });
            }));
            row.appendChild(side);
            wait.appendChild(row);
          });
        }
        if (!r.bookings.length) {
          slot.appendChild(K.cnEmpty("Nothing is booked.", BS.f === "mine" ? "Your bookings appear here." : "Book a room and it appears here for everyone to see.", "Book a room", function () { book({}, load); }));
          return;
        }
        var byDay = {};
        r.bookings.forEach(function (b) { (byDay[b.day] = byDay[b.day] || []).push(b); });
        Object.keys(byDay).sort().forEach(function (d) {
          slot.appendChild(el("h3", "en-h3", esc(H.dayShort(d)) + (d === today ? " — today" : "")));
          var t = K.cnTable([{ label: "Time", w: "110px" }, { label: "Room", w: "minmax(120px, 1fr)" }, { label: "For", w: "minmax(180px, 1.6fr)" },
            { label: "By", w: "minmax(100px, 1fr)" }, { label: "Status", w: "104px" }, { label: "", w: "84px" }]);
          byDay[d].forEach(function (b) {
            var mayCancel = b.mine || r.canDecide;
            var c = mayCancel ? H.btn("Cancel", "quiet", function () {
              API.bookAct(b.id, "cancel", { series: false }).then(function () { toast("Cancelled."); load(); }, function (e) { toast(e.message); });
            }) : "";
            t.row([esc(b.starts) + "–" + esc(b.ends), "<b>" + esc(b.spaceName) + "</b>", esc(b.title), b.bookerName ? esc(b.bookerName) : "<span class='cn-none'>—</span>",
                   b.status === "pending" ? H.chip("orange", "Waiting") : b.status === "approved" ? H.chip("green", "Approved") : H.chip("muted", b.status), c]);
          });
          slot.appendChild(t);
        });
      }, function (e) { H.fail(slot, e, load); });
    }
    load();
  }

  function book(pre, done) {
    H.spaces().then(function (list) {
      var rooms = list.filter(function (s) { return s.bookable; });
      if (!rooms.length) { toast("No room can be held yet. A facilities manager makes a room bookable under Spaces."); return; }
      var room = H.fld("select", "Room", pre.spaceId || "", { options: H.spaceOptions(list, { blank: "Choose a room…", only: "bookable" }) });
      var rules = el("p", "en-note", "");
      var title = H.fld("text", "What for", "", { req: true, max: 160 });
      var dayF = H.fld("date", "Day", pre.day || "", { req: true });
      var s = H.fld("time", "From", "09:00"), e = H.fld("time", "To", "10:00");
      var n = H.fld("number", "How many people", "", { min: 1, max: 100000 });
      var rep = H.fld("select", "Repeats", "none", { options: [["none", "Just this once"], ["weekly", "Every week"], ["biweekly", "Every two weeks"], ["daily", "Every day it can be held"]] });
      var count = H.fld("number", "Times", 4, { min: 1, max: 52 });
      var notes = H.fld("area", "Anything the room needs", "", { rows: 2, max: 1000 });
      function sync() {
        var r = list.by[room.value()];
        rules.textContent = r ? rulesLine(r) : "";
        count.node.hidden = rep.value() === "none";
      }
      room.input.addEventListener("change", sync); rep.input.addEventListener("change", sync);
      H.dialog({
        title: "Book a room", sub: "The room's own rules are checked before anything is held.", wide: true, action: "Request it",
        body: function (h) {
          h.appendChild(room.node); h.appendChild(rules); h.appendChild(title.node);
          var g = el("div", "en-form-grid");
          [dayF, s, e, n, rep, count].forEach(function (f) { g.appendChild(f.node); });
          h.appendChild(g); h.appendChild(notes.node);
          sync();
        },
        onSubmit: function (ctl) {
          if (!room.value()) throw new Error("Choose a room.");
          if (!title.value()) throw new Error("Say what it is for.");
          if (!dayF.value()) throw new Error("Choose the day.");
          function send(skip) {
            return API.book({ spaceId: room.value(), title: title.value(), day: dayF.value(), starts: s.value(), ends: e.value(),
              attendees: n.value() === "" ? undefined : +n.value(), repeat: rep.value(), count: rep.value() === "none" ? 1 : +count.value() || 1,
              notes: notes.value() || undefined, skipConflicts: skip || undefined }).then(function (r) {
              toast(r.approved ? "Booked." : "Requested. You will see it here once it is decided.");
              if (r.skipped && r.skipped.length) toast(r.skipped.length + " date" + (r.skipped.length === 1 ? "" : "s") + " could not be held.");
              if (done) done();
            });
          }
          return send(false).catch(function (err) {
            if (err.unavailable && err.unavailable.length) {
              var box = el("div");
              box.appendChild(el("p", null, esc(err.message)));
              if (err.unavailable.length > 1 || (err.free && err.free.length)) {
                var ul = el("ul");
                err.unavailable.slice(0, 8).forEach(function (u) { ul.appendChild(el("li", null, "<b>" + esc(H.dayShort(u.day)) + "</b> — " + esc(u.problems.join(" ")))); });
                box.appendChild(ul);
              }
              if (err.free && err.free.length) {
                box.appendChild(H.btn("Book the " + err.free.length + " that can be held", "strong", function () { send(true).then(function () { ctl.close(); }, function (x) { ctl.error(x.message); }); }));
              }
              ctl.error(box);
              var blocked = new Error("");
              blocked.silent = true;
              throw blocked;
            }
            throw err;
          });
        }
      });
    });
  }
  H.open.book = book;

  /* ========================================================== Vendors */
  var VS = { f: "all" };

  function vendors(v) {
    var P = K.cxPage(v, "Facilities", "Vendors",
      "The outside people who do work for the school, and the papers each has to hold. A vendor is only as current as its newest paper.");
    P.tools.appendChild(K.cnAction("Add a vendor", function () { vendorForm(null, load); }, true));
    var filters = el("div");
    filters.style.cssText = "display:flex;flex-wrap:wrap;margin-bottom:14px";
    v.appendChild(filters);
    var slot = H.slot(v);
    var rows = null;
    var chips = K.cnFilters([{ k: "all", name: "All" }, { k: "attention", name: "Papers missing or run out" }, { k: "soon", name: "Running out soon" }], VS.f, function (k) { VS.f = k; chips.mark(k); draw(); });
    filters.appendChild(chips);
    function load() {
      slot.innerHTML = "";
      slot.appendChild(el("div", "admin-loading", "Loading vendors…"));
      API.vendors().then(function (r) { rows = r; draw(); }, function (e) { H.fail(slot, e, load); });
    }
    function draw() {
      slot.innerHTML = "";
      var list = rows.filter(function (x) { return VS.f === "all" ? x.active : x.active && x.standing.state === VS.f; });
      if (!list.length) {
        slot.appendChild(K.cnEmpty(rows.length ? "Nothing here." : "No vendors yet.", rows.length ? "Change the filter." : "Add the electrician, the lift engineer, the pest control firm — and the papers each has to hold.",
          rows.length ? null : "Add a vendor", rows.length ? null : function () { vendorForm(null, load); }));
        return;
      }
      var t = K.cnTable([{ label: "Vendor", w: "minmax(180px, 1.5fr)" }, { label: "Contact", w: "minmax(140px, 1.2fr)" }, { label: "Papers", w: "150px" },
        { label: "Contract ends", w: "130px" }, { label: "Open work", w: "90px", align: "right" }]);
      list.forEach(function (x) {
        var miss = x.standing.list.filter(function (y) { return y.state === "missing"; }).length;
        var out = x.standing.list.filter(function (y) { return y.state === "expired"; }).length;
        var soon = x.standing.list.filter(function (y) { return y.state === "soon"; }).length;
        var papers = !x.requires.length ? "<span class='cn-none'>None asked for</span>" : x.standing.state === "ok" ? H.chip("green", "All current")
          : H.chip(miss || out ? "red" : "orange", [miss ? miss + " missing" : "", out ? out + " run out" : "", soon ? soon + " soon" : ""].filter(Boolean).join(", "));
        t.row(["<b>" + esc(x.name) + "</b>" + (x.trade ? "<span class='cn-sub2'>" + esc(x.trade) + "</span>" : ""),
               esc([x.contactName, x.phone].filter(Boolean).join(" · ")) || "<span class='cn-none'>—</span>", papers,
               x.contractEndsOn ? H.expiry(x.contract, x.contractEndsOn) : "<span class='cn-none'>—</span>",
               x.openOrders ? "<b>" + x.openOrders + "</b>" : "<span class='cn-none'>0</span>"], function () { vendorSheet(x.id, load); }, x.id);
      });
      slot.appendChild(t);
    }
    load();
  }

  function vendorForm(existing, done) {
    var x = existing || {};
    var name = H.fld("text", "Name", x.name || "", { req: true, max: 160 });
    var trade = H.fld("text", "Trade", x.trade || "", { max: 80, hint: "Electrical, lifts, pest control…" });
    var contact = H.fld("text", "Contact", x.contactName || "", { max: 120 }), phone = H.fld("text", "Phone", x.phone || "", { max: 40 });
    var email = H.fld("text", "Email", x.email || "", { max: 200 });
    var ends = H.fld("date", "Contract ends", x.contractEndsOn || "");
    var needs = H.fld("area", "Papers it has to hold", (x.requires || []).join("\n"), { rows: 3, note: "One a line: Insurance certificate, Licence, Safeguarding letter." });
    var notes = H.fld("area", "Notes", x.notes || "", { rows: 2, max: 1000 });
    H.dialog({
      title: existing ? "Edit vendor" : "Add a vendor", sub: "What they charge is not kept here: OEdu does not do finance.", wide: true, action: "Save",
      body: function (h) {
        h.appendChild(name.node);
        var g = el("div", "en-form-grid");
        [trade, contact, phone, email, ends].forEach(function (f) { g.appendChild(f.node); });
        h.appendChild(g); h.appendChild(needs.node); h.appendChild(notes.node);
      },
      onSubmit: function () {
        if (!name.value()) throw new Error("Give it a name.");
        var data = { name: name.value(), trade: trade.value() || null, contactName: contact.value() || null, phone: phone.value() || null,
          email: email.value() || null, contractEndsOn: ends.value() || null, requires: needs.input.value.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean), notes: notes.value() || null };
        return (existing ? API.updateVendor(existing.id, data) : API.addVendor(data)).then(function () { toast("Saved."); if (done) done(); });
      }
    });
  }

  function vendorSheet(id, done) {
    API.vendor(id).then(function (d) {
      var x = d.vendor;
      var box = el("div", "en-dlg en-wide");
      var ref = null;
      function reload() { if (ref) ref.close(); vendorSheet(id, done); if (done) done(); }
      box.appendChild(el("h2", "en-dlg-h", esc(x.name)));
      box.appendChild(el("p", "en-dlg-sub", esc([x.trade, x.contactName, x.phone, x.email].filter(Boolean).join(" · "))));
      if (x.contractEndsOn) box.appendChild(el("p", "en-line", "<b>Contract</b> " + H.expiry(x.contract, x.contractEndsOn)));
      H.line(box, "Notes", x.notes);
      box.appendChild(el("h3", "en-h3", "Papers"));
      if (!x.requires.length) box.appendChild(el("p", "en-note", "No papers are asked of this vendor. Edit it to say which."));
      x.standing.list.forEach(function (p) {
        var tone = p.state === "ok" ? "green" : p.state === "soon" ? "orange" : "red";
        var label = p.state === "missing" ? "Missing" : p.state === "expired" ? "Ran out " + H.day(p.expiresOn) : p.expiresOn ? "Until " + H.day(p.expiresOn) : "Current";
        var row = el("div", "fx-starter");
        row.appendChild(el("div", null, "<b>" + esc(p.need) + "</b>"));
        var side = el("div");
        side.innerHTML = H.chip(tone, label);
        side.appendChild(H.btn(p.state === "missing" ? "Add" : "Renew", "", function () {
          ref.close();
          addDocument({ ownerKind: "vendor", ownerId: id, kind: p.need }, function () { vendorSheet(id, done); if (done) done(); });
        }));
        row.appendChild(side);
        box.appendChild(row);
      });
      var others = d.documents.filter(function (dd) { return x.requires.map(function (r) { return r.toLowerCase(); }).indexOf(String(dd.kind).toLowerCase()) < 0 && !dd.archived; });
      others.forEach(function (dd) { box.appendChild(el("div", "fx-linkrow flat", esc(dd.kind) + " — " + esc(dd.title) + " " + H.expiry(dd.state, dd.expiresOn))); });
      if (d.orders.length) {
        box.appendChild(el("h3", "en-h3", "Work given to them"));
        d.orders.slice(0, 8).forEach(function (o) {
          var b = el("button", "fx-linkrow", "<span>" + esc(H.number(o.number)) + "</span> " + esc(o.title) + " " + H.status(o.status));
          b.type = "button";
          b.addEventListener("click", function () { H.open.order(o.id, reload); });
          box.appendChild(b);
        });
      }
      var acts = el("div", "en-dlg-acts en-wrap");
      acts.appendChild(H.btn("Add a paper…", "strong", function () { ref.close(); addDocument({ ownerKind: "vendor", ownerId: id }, function () { vendorSheet(id, done); if (done) done(); }); }));
      acts.appendChild(H.btn("Edit…", "", function () { ref.close(); vendorForm(x, function () { vendorSheet(id, done); if (done) done(); }); }));
      acts.appendChild(H.btn("Close", "quiet", function () { ref.close(); }));
      box.appendChild(acts);
      ref = K.cxSheet(box);
    }, function (e) { toast(e.message); });
  }

  /* ======================================================== Documents */
  var DS = { f: "attention" };

  function documents(v) {
    var P = K.cxPage(v, "Facilities", "Documents",
      "Certificates, manuals, contracts, floor plans — each with the date it runs out, soonest first. A file up to 700 KB is kept here; anything larger is added as a link.");
    P.tools.appendChild(K.cnAction("Add a document", function () { addDocument({}, load); }, true));
    var filters = el("div");
    filters.style.cssText = "display:flex;flex-wrap:wrap;margin-bottom:14px";
    v.appendChild(filters);
    var slot = H.slot(v);
    var rows = null;
    var chips = K.cnFilters([{ k: "attention", name: "Running out" }, { k: "all", name: "All" }, { k: "undated", name: "No date" }], DS.f, function (k) { DS.f = k; chips.mark(k); draw(); });
    filters.appendChild(chips);
    function load() {
      slot.innerHTML = "";
      slot.appendChild(el("div", "admin-loading", "Loading documents…"));
      API.documents().then(function (r) { rows = r; draw(); }, function (e) { H.fail(slot, e, load); });
    }
    function draw() {
      slot.innerHTML = "";
      var list = rows.filter(function (d) { return DS.f === "all" ? true : DS.f === "undated" ? d.state === "none" : d.state === "soon" || d.state === "expired"; });
      if (!list.length) {
        slot.appendChild(K.cnEmpty(DS.f === "attention" ? "Nothing is running out." : "No documents here.",
          DS.f === "attention" ? "Papers that have run out, or will within 30 days, appear here." : "Add a fire certificate, a lift certificate, a warranty — anything with a date it ends.",
          "Add a document", function () { addDocument({}, load); }));
        return;
      }
      var t = K.cnTable([{ label: "Document", w: "minmax(200px, 1.6fr)" }, { label: "Belongs to", w: "minmax(130px, 1fr)" }, { label: "Kind", w: "130px" },
        { label: "Expires", w: "160px" }, { label: "", w: "70px" }]);
      list.forEach(function (d) {
        t.row(["<b>" + esc(d.title) + "</b>", d.ownerName ? esc(d.ownerName) : "<span class='cn-none'>—</span>", esc(d.kind), H.expiry(d.state, d.expiresOn),
               d.file ? "File" : d.url ? "Link" : ""], function () { docSheet(d, load); }, d.id);
      });
      slot.appendChild(t);
    }
    load();
  }

  function addDocument(pre, done) {
    Promise.all([H.spaces(), API.vendors().catch(function () { return []; }), API.assets().catch(function () { return { assets: [] }; })]).then(function (r) {
      var list = r[0], vs = r[1], as = r[2].assets;
      var owner = H.fld("select", "Belongs to", pre.ownerKind || "school", { options: [["school", "The school"], ["space", "A room or building"], ["asset", "An asset"], ["vendor", "A vendor"]] });
      var spaceSel = H.fld("select", "Which", pre.ownerKind === "space" ? pre.ownerId : "", { options: H.spaceOptions(list, { blank: "Choose…" }) });
      var assetSel = H.fld("select", "Which", pre.ownerKind === "asset" ? pre.ownerId : "", { options: [["", "Choose…"]].concat(as.map(function (a) { return [a.id, a.name + " — " + a.code]; })) });
      var vendSel = H.fld("select", "Which", pre.ownerKind === "vendor" ? pre.ownerId : "", { options: [["", "Choose…"]].concat(vs.map(function (x) { return [x.id, x.name]; })) });
      var kind = H.fld("text", "What kind", pre.kind || "", { req: true, max: 80, hint: "Certificate, Manual, Insurance certificate, Contract…" });
      var title = H.fld("text", "Title", pre.title || pre.kind || "", { req: true, max: 160 });
      var issued = H.fld("date", "Issued", ""), expires = H.fld("date", "Runs out", "");
      var url = H.fld("text", "Link", "", { max: 500, hint: "https://…", note: "For anything larger than 700 KB, or kept elsewhere." });
      var picked = null, fileLine = el("p", "en-note", "");
      function sync() {
        spaceSel.node.hidden = owner.value() !== "space"; assetSel.node.hidden = owner.value() !== "asset"; vendSel.node.hidden = owner.value() !== "vendor";
      }
      owner.input.addEventListener("change", sync);
      H.dialog({
        title: "Add a document", sub: "The date it runs out is what puts it on the list when it is time to renew.", wide: true, action: "Save",
        body: function (h) {
          var g = el("div", "en-form-grid");
          [owner, spaceSel, assetSel, vendSel, kind, title, issued, expires].forEach(function (f) { g.appendChild(f.node); });
          h.appendChild(g); h.appendChild(url.node);
          h.appendChild(H.btn("Attach a file…", "quiet", function () {
            H.chooseFile("image/*,application/pdf", function (f) {
              fileLine.textContent = "Reading…";
              H.readImage(f).then(function (p) { picked = p; fileLine.textContent = p.name + " — " + Math.round(p.data.length * 0.75 / 1024) + " KB."; }, function (e) { picked = null; fileLine.textContent = e.message; });
            });
          }));
          h.appendChild(fileLine);
          sync();
        },
        onSubmit: function () {
          var ok = owner.value(), oid = ok === "space" ? spaceSel.value() : ok === "asset" ? assetSel.value() : ok === "vendor" ? vendSel.value() : undefined;
          if (ok !== "school" && !oid) throw new Error("Choose what it belongs to.");
          if (!kind.value() || !title.value()) throw new Error("Say what kind it is and give it a title.");
          return API.addDocument({ ownerKind: ok, ownerId: oid, kind: kind.value(), title: title.value(), issuedOn: issued.value() || undefined,
            expiresOn: expires.value() || undefined, url: url.value() || undefined }).then(function (d) {
            if (picked) return API.putDocumentFile(d.id, picked);
            return d;
          }).then(function () { toast("Saved."); if (done) done(); });
        }
      });
    });
  }
  H.open.addDocument = addDocument;

  function docSheet(d, done) {
    var box = el("div", "en-dlg");
    var ref = null;
    box.appendChild(el("h2", "en-dlg-h", esc(d.title)));
    box.appendChild(el("p", "en-dlg-sub", esc(d.kind) + (d.ownerName ? " · " + esc(d.ownerName) : "")));
    box.appendChild(el("p", "en-line", "<b>Runs out</b> " + H.expiry(d.state, d.expiresOn)));
    H.line(box, "Issued", d.issuedOn ? H.day(d.issuedOn) : ""); H.line(box, "Note", d.note);
    var acts = el("div", "en-dlg-acts en-wrap");
    if (d.url) {
      var a = el("a", "en-btn strong", "Open the link");
      a.href = d.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      acts.appendChild(a);
    }
    if (d.file) acts.appendChild(H.btn("Open " + d.file.name, "strong", function () { API.documentFile(d.id).then(function (f) { H.show(f); }, function (e) { toast(e.message); }); }));
    acts.appendChild(H.btn("Renew…", "", function () {
      var n = H.fld("date", "New date it runs out", ""), u = H.fld("text", "New link", d.url || "", { max: 500 });
      ref.close();
      H.dialog({ title: "Renew", action: "Save", body: function (h) { h.appendChild(n.node); h.appendChild(u.node); },
        onSubmit: function () { return API.updateDocument(d.id, { expiresOn: n.value() || null, url: u.value() || null }).then(function () { toast("Renewed."); if (done) done(); }); } });
    }));
    acts.appendChild(H.btn("Replace the file…", "quiet", function () {
      H.chooseFile("image/*,application/pdf", function (f) { H.readImage(f).then(function (p) { return API.putDocumentFile(d.id, p); }).then(function () { toast("Replaced."); ref.close(); if (done) done(); }, function (e) { toast(e.message); }); });
    }));
    acts.appendChild(H.btn("Archive", "quiet", function () { API.updateDocument(d.id, { archived: true }).then(function () { toast("Archived."); ref.close(); if (done) done(); }, function (e) { toast(e.message); }); }));
    acts.appendChild(H.btn("Close", "quiet", function () { ref.close(); }));
    box.appendChild(acts);
    ref = K.cxSheet(box);
  }

  /* ========================================================== Reports */
  var RS = { range: "30" };

  function reports(v) {
    var P = K.cxPage(v, "Facilities", "Reports",
      "What was reported, what was finished, how long it took, and what is overdue. Computed now from the work orders, never stored.");
    var tools = el("div", "cn-bar en-tools");
    var sel = H.fld("select", "", RS.range, { options: [["30", "Last 30 days"], ["90", "Last 90 days"], ["365", "Last year"]] });
    sel.node.querySelector("span").textContent = "";
    tools.appendChild(sel.node);
    v.appendChild(tools);
    var slot = H.slot(v);
    var data = null;
    P.tools.appendChild(K.cnAction("Download", function () {
      if (!data) return;
      K.csvDownload("facilities-" + data.from + "-to-" + data.to + ".csv", csv(data));
    }));
    P.tools.appendChild(K.cnAction("Print", function () {
      if (!data) return;
      K.cxPrint("Facilities report", K.printHead("Facilities report", H.day(data.from) + " to " + H.day(data.to)) + printBody(data));
    }));
    sel.input.addEventListener("change", function () { RS.range = sel.value(); load(); });
    function load() {
      slot.innerHTML = "";
      slot.appendChild(el("div", "admin-loading", "Working it out…"));
      var to = H.today();
      API.reports(H.plus(to, -(+RS.range - 1)), to).then(function (r) { data = r; draw(); }, function (e) { H.fail(slot, e, load); });
    }
    function table(cols, rows) {
      var t = K.cnTable(cols);
      rows.forEach(function (r) { t.row(r); });
      return t;
    }
    function draw() {
      slot.innerHTML = "";
      var r = data;
      K.cxMetrics(slot, [
        { label: "Reported", value: r.created }, { label: "Finished", value: r.done },
        { label: "Open now", value: r.open, note: r.overdue ? r.overdue + " overdue" : "" },
        { label: "Days to finish, on average", value: r.avgDaysToFinish }, { label: "Preventive on time", value: r.preventive.pct, unit: r.preventive.pct == null ? "" : "%", note: r.preventive.done ? r.preventive.onTime + " of " + r.preventive.done : "" },
        { label: "Time spent", value: Math.round(r.minutesSpent / 6) / 10, unit: " h" }
      ]);
      function block(title, cols, rows, empty) {
        slot.appendChild(el("h3", "en-h3", esc(title)));
        if (!rows.length) slot.appendChild(el("p", "en-note", esc(empty || "Nothing in this period.")));
        else slot.appendChild(table(cols, rows));
      }
      var catName = function (c) { return H.categoryName(c); };
      block("By week", [{ label: "Week of", w: "160px" }, { label: "Reported", w: "110px", align: "right" }, { label: "Finished", w: "110px", align: "right" }],
        r.weeks.map(function (w) { return [esc(H.day(w.week)), String(w.created), String(w.done)]; }));
      block("By kind of job", [{ label: "Kind", w: "minmax(160px, 1fr)" }, { label: "Reported", w: "110px", align: "right" }],
        r.byCategory.map(function (x) { return [esc(catName(x.name)), String(x.n)]; }));
      block("Where the work is", [{ label: "Room", w: "minmax(160px, 1fr)" }, { label: "Reported", w: "110px", align: "right" }],
        r.byRoom.map(function (x) { return [esc(x.name), String(x.n)]; }));
      block("Open now, by priority", [{ label: "Priority", w: "minmax(160px, 1fr)" }, { label: "Orders", w: "110px", align: "right" }],
        r.openByPriority.map(function (x) { return [esc(x.name), String(x.n)]; }), "Nothing is open.");
    }
    function csv(r) {
      var out = [["Facilities report", r.from + " to " + r.to], [], ["Reported", r.created], ["Finished", r.done], ["Declined", r.declined], ["Open now", r.open],
        ["Overdue now", r.overdue], ["Days to finish, average", r.avgDaysToFinish == null ? "" : r.avgDaysToFinish], ["Minutes spent", r.minutesSpent],
        ["Preventive jobs finished", r.preventive.done], ["…on or before their due date", r.preventive.onTime], [], ["Week of", "Reported", "Finished"]];
      r.weeks.forEach(function (w) { out.push([w.week, w.created, w.done]); });
      out.push([], ["Kind of job", "Reported"]);
      r.byCategory.forEach(function (x) { out.push([H.categoryName(x.name), x.n]); });
      out.push([], ["Room", "Reported"]);
      r.byRoom.forEach(function (x) { out.push([x.name, x.n]); });
      out.push([], ["Open by priority", "Orders"]);
      r.openByPriority.forEach(function (x) { out.push([x.name, x.n]); });
      return out;
    }
    function printBody(r) {
      return "<p>Reported <b>" + r.created + "</b> · finished <b>" + r.done + "</b> · open now <b>" + r.open + "</b> (" + r.overdue + " overdue)" +
        (r.avgDaysToFinish != null ? " · " + r.avgDaysToFinish + " days to finish on average" : "") + (r.preventive.pct != null ? " · preventive on time " + r.preventive.pct + "%" : "") + "</p>" +
        K.printTable([{ t: "Week of" }, { t: "Reported", r: 1 }, { t: "Finished", r: 1 }], r.weeks.map(function (w) { return [H.day(w.week), w.created, w.done]; })) +
        K.printTable([{ t: "Kind of job" }, { t: "Reported", r: 1 }], r.byCategory.map(function (x) { return [H.categoryName(x.name), x.n]; })) +
        K.printTable([{ t: "Room" }, { t: "Reported", r: 1 }], r.byRoom.map(function (x) { return [x.name, x.n]; }));
    }
    load();
  }

  H.open.schedule = schedSheet;
  return { upkeep: upkeep, bookings: bookings, vendors: vendors, documents: documents, reports: reports };
});
