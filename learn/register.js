/* ==========================================================================
   OEdu — the class register and the 75% watch.

   An Indian school's morning register is taken once a day, by the class
   teacher, for the section (X-C): everybody is present until the teacher taps
   otherwise, and an absence carries the reason. The office sees which
   registers are in, watches the children who are, or are about to be, under the
   attendance a board asks for, and locks the days it has reported.

     classes     the office: every section and whether its register is in
     sheet       one section's register for a day (office and class teacher)
     watch       who is under, or close to, the line, and what can still be done
     myClass     the class teacher's own page

   The numbers and the rules are the server's (api/src/routes/register.js,
   services/register.js); this file draws what it returns. Mounted by app.js
   with the console kit: OPLO_REGISTER(kit) → { classes, watch, myClass }.
   ========================================================================== */
window.OPLO_REGISTER = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast, RG = API.register, U = K.ui;
  var dialog = U.dialog, btn = U.btn, fld = U.fld, chip = U.chip, none = U.none, num = U.num, plural = U.plural, dmy = U.dmy;

  var KIND_TONE = { present: "green", tardy: "orange", absent: "red", excused: "muted" };
  function tone(kind) { return KIND_TONE[kind] || "muted"; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function shift(day, by) { return new Date(Date.parse(day + "T00:00:00Z") + by * 86400000).toISOString().slice(0, 10); }
  function mmss(sec) { return Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2); }
  function clock(ms) { return ms ? new Date(Number(ms)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""; }

  /* ============================================================ The sheet
     One section's register. Nothing is saved until Save: the teacher taps the
     children who are away and saves once. */
  function sheet(classId, day, done) {
    var st = {}, data = null, body = null, why = null, force = null, totals = null, saveBtn = null;

    function away(code) { return code && (code.kind === "absent" || code.kind === "excused"); }
    function codeOf(key) { return data.codes.filter(function (c) { return c.key === key; })[0] || null; }

    function count() {
      var by = {};
      data.students.forEach(function (s) { var c = codeOf(st[s.id].status); var k = c ? c.label : st[s.id].status; by[k] = (by[k] || 0) + 1; });
      totals.textContent = Object.keys(by).map(function (k) { return by[k] + " " + k.toLowerCase(); }).join(" · ");
    }

    function row(s) {
      var r = el("div", "rg-row"), cur = st[s.id];
      r.appendChild(el("span", "rg-roll", s.rollNo ? esc(s.rollNo) : ""));
      r.appendChild(el("span", "rg-name", esc(s.name)));
      var marks = el("span", "rg-marks");
      var extra = el("span", "rg-extra");
      function paint() {
        [].forEach.call(marks.children, function (b) { b.classList.toggle("on", b.dataset.k === cur.status); });
        extra.innerHTML = "";
        var c = codeOf(cur.status);
        if (away(c)) {
          var sel = el("select", "cx-select rg-reason");
          [["", "Reason"]].concat(data.reasons.map(function (x) { return [x.key, x.label]; })).forEach(function (x) { var o = el("option"); o.value = x[0]; o.textContent = x[1]; sel.appendChild(o); });
          sel.value = cur.reason || "";
          sel.addEventListener("change", function () { cur.reason = sel.value || null; });
          extra.appendChild(sel);
        } else cur.reason = null;
        count();
      }
      data.codes.forEach(function (c) {
        var b = el("button", "rg-mk rg-" + tone(c.kind), esc(c.mark || c.label));
        b.type = "button"; b.dataset.k = c.key; b.title = c.label; b.setAttribute("aria-label", c.label + " — " + s.name);
        b.addEventListener("click", function () { cur.status = c.key; paint(); });
        marks.appendChild(b);
      });
      r.appendChild(marks); r.appendChild(extra);
      paint();
      return r;
    }

    var ctl, head, banner;
    function render() {
      body.innerHTML = "";
      banner.innerHTML = ""; banner.hidden = true;
      var note = [];
      if (data.locked) note.push("<b>Locked</b> for “" + esc(data.locked.label) + "” (" + esc(dmy(data.locked.from)) + " to " + esc(dmy(data.locked.to)) + "). Only the office may change it, and says why.");
      if (data.schoolDay.kind !== "school") note.push("<b>Not a school day</b>" + (data.schoolDay.label ? " (" + esc(data.schoolDay.label) + ")" : "") + ".");
      if (data.day > data.today) note.push("This day has not come yet.");
      if (note.length) { banner.hidden = false; banner.innerHTML = note.join(" "); }
      if (!data.students.length) { body.appendChild(K.cnEmpty("Nobody in this class yet.", "Add children to the class first (Students, Classes).")); return; }
      var list = el("div", "rg-list");
      data.students.forEach(function (s) { list.appendChild(row(s)); });
      body.appendChild(list);
      if (saveBtn) saveBtn.disabled = !data.canEdit || data.day > data.today;
      if (data.locked && data.canEdit) {
        why = fld("text", "Why are you changing a locked day?", "", { req: true, max: 200, hint: "A medical certificate arrived late, a mistake in the entry…" });
        body.appendChild(why.node);
      } else why = null;
      if (data.schoolDay.kind !== "school" && data.canEdit) {
        force = el("label", "rg-force");
        force.innerHTML = "<input type='checkbox'> Take it anyway (a special working day)";
        body.appendChild(force);
      } else force = null;
      var line = data.taken ? "Taken" + (data.students.some(function (s) { return s.markedBy; }) ? " by " + esc(data.students.filter(function (s) { return s.markedBy; })[0].markedBy) : "") : data.marked ? data.marked + " of " + data.students.length + " marked" : "Not taken yet: everyone starts as present";
      head.innerHTML = esc(data.class.label) + " · " + esc(dmy(data.day)) + "<small>" + line + "</small>";
    }

    function load(d) {
      body.innerHTML = ""; body.appendChild(el("div", "admin-loading", "Loading the register…"));
      return RG.get(classId, d).then(function (r) {
        data = r; st = {};
        r.students.forEach(function (s) { st[s.id] = { status: s.status || r.codes[0].key, reason: s.reason || null, note: s.note || null }; });
        render();
      }, function (e) { body.innerHTML = ""; K.failed(body, e); });
    }

    function save(c) {
      if (why && why.value().length < 5) throw new Error("Say why you are changing a locked day.");
      var marks = data.students.map(function (s) { var x = st[s.id]; return { accountId: s.id, status: x.status, reason: x.reason || undefined, note: x.note || undefined }; });
      var b = { classId: classId, day: data.day, marks: marks };
      if (why) b.why = why.value();
      if (force && force.querySelector("input").checked) b.force = true;
      // With no signal the register is kept on this device and sent when it is back (learn/offline.js).
      return window.OPLO_QUEUE.shared().submit({ label: "Register " + data.class.label + " " + dmy(data.day), method: "PUT", path: "/register", body: b, merge: "reg:" + classId + ":" + data.day }).then(function (r) {
        toast(r.queued ? "No signal: the register is saved on this device and will send when you are back online." : "Register saved for " + data.class.label + ", " + dmy(data.day) + ".");
        if (done) done();
      });
    }

    ctl = dialog({
      title: "Class register", wide: true, action: "Save the register",
      body: function (h) {
        head = el("p", "rg-head");
        var nav = el("div", "rg-nav");
        var prev = btn("‹", "quiet", function () { load(shift(data.day, -1)); }), nxt = btn("›", "quiet", function () { load(shift(data.day, 1)); });
        prev.setAttribute("aria-label", "The day before"); nxt.setAttribute("aria-label", "The day after");
        var all = btn("Everyone present", "quiet", function () {
          data.students.forEach(function (s) { st[s.id].status = data.codes[0].key; st[s.id].reason = null; });
          render();
        });
        totals = el("span", "rg-total");
        nav.appendChild(prev); nav.appendChild(nxt); nav.appendChild(all); nav.appendChild(totals);
        banner = el("p", "rg-banner"); banner.hidden = true;
        body = el("div", "rg-body");
        h.appendChild(head); h.appendChild(nav); h.appendChild(banner); h.appendChild(body);
        load(day);
      },
      onSubmit: function (c) { return save(c); }
    });
    saveBtn = ctl.acts.lastChild;
    saveBtn.disabled = true;
  }

  /* ========================================================== The overview */
  var DAY = null;
  function classes(v) {
    var P = K.cxPage(v, "Attendance", "Class registers",
      "Each section's morning register: who has taken it today, and who has not. Open one to see it, or to correct it.");
    var bar = el("div", "rg-bar");
    var date = el("input", "at-dateinput"); date.type = "date";
    var todayBtn = btn("Today", "quiet", function () { DAY = null; K.openAdmin(true, "in-register"); });
    bar.appendChild(date); bar.appendChild(todayBtn);
    v.appendChild(bar);
    var metrics = el("div"), slot = el("div", "en-slot");
    v.appendChild(metrics); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the registers…"));
    Promise.all([RG.classes(DAY), RG.dayStats().catch(function () { return null; })]).then(function (res) {
      var r = res[0], ds = res[1];
      slot.innerHTML = "";
      date.value = r.day;
      date.addEventListener("change", function () { DAY = date.value || null; K.openAdmin(true, "in-register"); });
      var withKids = r.classes.filter(function (c) { return c.strength > 0; });
      var inCount = withKids.filter(function (c) { return c.taken; }).length;
      K.cxMetrics(metrics, [
        { label: "Registers in", value: inCount, note: "of " + plural(withKids.length, "section"), line: withKids.length ? Math.round(inCount / withKids.length * 100) : null },
        { label: "Not yet taken", value: withKids.length - inCount, bad: withKids.length - inCount > 0, note: r.schoolDay.kind === "school" ? "for " + dmy(r.day) : "not a school day" },
        { label: "Children marked", value: num(withKids.reduce(function (a, c) { return a + c.marked; }, 0)), note: "of " + num(withKids.reduce(function (a, c) { return a + c.strength; }, 0)) }
      ].concat(ds && ds.count ? [{ label: "A class teacher’s day", value: mmss(ds.median), note: "the middle of " + plural(ds.count, "day") + " in the last 30 · " + ds.under10 + "% under ten minutes" }] : []));
      if (r.schoolDay.kind !== "school") slot.appendChild(el("p", "en-note", esc(dmy(r.day)) + " is not a school day" + (r.schoolDay.label ? " (" + esc(r.schoolDay.label) + ")" : "") + "."));
      if (!r.classes.length) { slot.appendChild(K.cnEmpty("No sections in this school year.", "Make the school's classes first (Students, Classes).")); return; }
      var t = K.cnTable([{ label: "Class", w: "90px" }, { label: "Class teacher", w: "minmax(150px, 1.2fr)" }, { label: "Children", w: "90px" }, { label: "Marked", w: "100px" }, { label: "Register", w: "150px" }]);
      r.classes.forEach(function (c) {
        var off = r.schoolDay.kind !== "school" && !c.marked;
        var state = !c.strength ? chip("muted", "Empty") : c.taken ? chip("green", "In" + (c.at ? " at " + clock(c.at) : "")) : c.marked ? chip("orange", "Part") : off ? chip("muted", "No school") : chip("red", "Not taken");
        t.row(["<b>" + esc(c.label) + "</b>", c.classTeacher ? esc(c.classTeacher.name) : "<span class='cn-none'>Not set</span>", num(c.strength), c.strength ? num(c.marked) + " of " + num(c.strength) : none(), state],
          function () { sheet(c.id, r.day, function () { K.openAdmin(true, "in-register"); }); }, c.id);
      });
      slot.appendChild(t);
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "in-register"); }); });
  }

  /* ============================================================== The watch */
  var WATCH = { classId: "", threshold: 75, filter: "risk" };
  function pctCell(s) { return s.percent == null ? none() : s.percent + "%"; }
  var TOO_EARLY = 10;      // marked days before a percentage means anything
  function statusChip(s) { return s.total && s.total < TOO_EARLY && s.status !== "ok" ? chip("muted", "Too early") : s.status === "below" ? chip("red", "Under") : s.status === "watch" ? chip("orange", "On watch") : s.status === "ok" ? chip("green", "Fine") : chip("muted", "No marks"); }
  /* What is left to do: a child under the line is told how many of the days left they must be there for;
     one over it, how many they can still miss. */
  function missText(s, left) {
    if (s.status === "none") return "";
    if (s.canMiss < 0) return "<span class='en-late'>Cannot reach it</span>";
    if (s.status === "below") return "Needs " + num(s.mustAttend) + " of " + num(left) + " days";
    return esc(s.canMiss + (s.canMiss === 1 ? " day" : " days") + " to spare");
  }

  function watch(v, opts) {
    opts = opts || {};
    var P = K.cxPage(v, "Attendance", opts.title || "75% watch",
      "Children under, or close to, the attendance a board asks for, counted over the school year to its last day. “Days to spare” is how many more days a child can miss and still finish on the line.");
    P.tools.appendChild(K.cnAction("Board list (CSV)", function () {
      RG.eligibility(opts.classId, false).then(function (d) { K.csvDownload(d.file, [d.columns].concat(d.rows)); toast("Counted from " + dmy(d.counted.from) + " to " + dmy(d.counted.to) + "."); }, function (e) { toast(e.message); });
    }));
    if (!opts.classId) {
      P.tools.appendChild(K.cnAction("Locked days", function () { locksDialog(); }));
      P.tools.appendChild(K.cnAction("Lock days reported to a board", function () { lockForm(function () { K.openAdmin(true, "in-watch"); }); }, true));
    }
    var metrics = el("div"), filters = el("div"), slot = el("div", "en-slot");
    v.appendChild(metrics); v.appendChild(filters); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Counting the registers…"));
    var q = { threshold: WATCH.threshold };
    if (opts.classId) q.classId = opts.classId;
    RG.watch(q).then(function (r) {
      slot.innerHTML = "";
      var s = { below: 0, watch: 0, ok: 0, none: 0, early: 0 }, total = r.students.length;
      r.students.forEach(function (x) { if (x.total && x.total < TOO_EARLY && x.status !== "ok") s.early++; else s[x.status]++; });
      K.cxMetrics(metrics, [
        { label: "Under " + r.threshold + "%", value: s.below, bad: s.below > 0, note: s.below ? "cannot sit a board exam as things stand" : "nobody" },
        { label: "On watch", value: s.watch, note: "a few days from the line" },
        { label: "Fine", value: s.ok, note: "of " + plural(total, "child", "children") },
        { label: "School days left", value: r.remaining, note: "to " + dmy(r.until) + (s.early ? " · " + s.early + " with under " + TOO_EARLY + " days marked: too early to say" : "") }
      ]);
      var chips = K.cnFilters([{ k: "risk", name: "Under and on watch", n: s.below + s.watch }, { k: "all", name: "Everyone", n: total }], WATCH.filter,
        function (k) { WATCH.filter = k; chips.mark(k); paint(); });
      filters.appendChild(chips);
      var box = el("div", "en-slot"); slot.appendChild(box);
      function paint() {
        box.innerHTML = "";
        var rows = r.students.filter(function (x) { return WATCH.filter === "all" || ((x.status === "below" || x.status === "watch") && !(x.total < TOO_EARLY)); });
        if (!rows.length) { box.appendChild(K.cnEmpty(total ? "Nobody is under or close to the line." : "No registers have been taken yet.", total ? "" : "Take the class registers and this fills in.")); return; }
        var t = K.cnTable([{ label: "Child", w: "minmax(150px, 1.3fr)" }, { label: "Class", w: "80px" }, { label: "Present", w: "110px" }, { label: "%", w: "70px" }, { label: "With leave", w: "90px" },
          { label: "What is left", w: "150px" }, { label: "", w: "110px" }]);
        rows.slice(0, 300).forEach(function (x) {
          t.row(["<b>" + esc(x.name) + "</b>" + (x.rollNo ? "<span class='cn-sub2'>Roll " + esc(x.rollNo) + "</span>" : ""), x.classLabel ? esc(x.classLabel) : none(),
                 x.total ? num(x.attended) + " of " + num(x.total) : none(), pctCell(x), x.percentWithLeave != null ? x.percentWithLeave + "%" : none(), missText(x, r.remaining),
                 statusChip(x) + (x.case ? "<span class='cn-sub2'>Case: " + esc(x.case.status) + "</span>" : "")],
            function () { childDialog(x, r, function () { K.openAdmin(true, opts.classId ? "in-myclass" : "in-watch"); }); }, x.id);
        });
        box.appendChild(t);
        if (rows.length > 300) box.appendChild(el("p", "en-note", "Showing the first 300 of " + num(rows.length) + "."));
      }
      paint();
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, opts.classId ? "in-myclass" : "in-watch"); }); });
  }

  function childDialog(x, r, done) {
    var ctl = dialog({
      title: x.name, sub: (x.classLabel ? "Class " + x.classLabel + ". " : "") + "Counted from " + dmy(r.year.from) + " to today.", wide: true,
      body: function (h) {
        var lines = [
          "<b>" + num(x.attended) + " of " + num(x.total) + " days present</b> (" + pctCell(x) + "), " + num(x.excused) + " on leave, " + num(x.absent) + " absent.",
          x.status === "none" ? "" : x.canMiss < 0
            ? "Even if " + esc(x.name) + " is there on every one of the " + num(r.remaining) + " school days left, the year ends under " + r.threshold + "%."
            : "To finish on " + r.threshold + "%, " + esc(x.name) + " must be there on " + num(x.mustAttend) + " of the " + num(r.remaining) + " school days left, and can miss " + num(x.canMiss) + ".",
          x.condonable ? "The " + num(x.excused) + " days of leave, if the board condones them, would bring this to " + x.percentWithLeave + "%." : ""
        ];
        lines.filter(Boolean).forEach(function (l) { h.appendChild(el("p", "en-note", l)); });
      }
    });
    if (x.status === "below" || x.status === "watch") {
      ctl.acts.insertBefore(btn(x.case ? "Open the case" : "Start a condonation case", "quiet", function () {
        ctl.close();
        if (x.case) { K.openAdmin(false, "in-condone"); return; }
        API.items.create({ kind: "condonation", title: x.name + ": attendance condonation", subjectId: x.id, status: "requested",
          data: { percent: x.percent, days: x.excused + x.absent, reason: "Illness (medical certificate)" } }).then(function () { toast("Case started. Add the documents under Attendance, Condonation."); done(); },
          function (e) { toast(e.message); });
      }), ctl.acts.firstChild);
    }
  }

  /* ================================================================== Locks */
  function lockForm(done) {
    var from = fld("date", "From", ""), to = fld("date", "To", today()), label = fld("text", "What was reported", "", { req: true, max: 120, hint: "Board eligibility list, 1 January 2027" });
    dialog({
      title: "Lock days reported to a board", wide: true, action: "Lock these days",
      sub: "From now on a class teacher cannot change a register in these days. The office can, but must say why, and every such change is marked as made after the lock. A lock cannot be taken back.",
      body: function (h) { var g = el("div", "en-form-grid"); [from, to, label].forEach(function (f) { g.appendChild(f.node); }); h.appendChild(g); },
      onSubmit: function () {
        if (!from.value() || !to.value()) throw new Error("Choose the first and last day.");
        if (!label.value()) throw new Error("Say what was reported.");
        return RG.addLock({ from: from.value(), to: to.value(), label: label.value() }).then(function () { toast("Locked."); done(); });
      }
    });
  }

  function locksDialog() {
    dialog({
      title: "Locked days", wide: true, sub: "Days the school has reported. Changes inside them are listed below, with who made them and why.",
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading…"));
        Promise.all([RG.locks(), RG.afterLock().catch(function () { return { edits: [] }; })]).then(function (res) {
          slot.innerHTML = "";
          var locks = res[0].locks, edits = res[1].edits;
          if (!locks.length) slot.appendChild(el("p", "en-note", "Nothing is locked yet."));
          else {
            var t = K.cnTable([{ label: "From", w: "110px" }, { label: "To", w: "110px" }, { label: "Reported as", w: "minmax(200px, 2fr)" }, { label: "By", w: "150px" }]);
            locks.forEach(function (l) { t.row([esc(dmy(l.from)), esc(dmy(l.to)), esc(l.label), l.by ? esc(l.by) : none()]); });
            slot.appendChild(t);
          }
          slot.appendChild(el("h3", "en-h3", "Changes made after a lock"));
          if (!edits.length) { slot.appendChild(el("p", "en-note", "None.")); return; }
          var e = K.cnTable([{ label: "Day", w: "100px" }, { label: "Child", w: "minmax(130px, 1fr)" }, { label: "Was", w: "90px" }, { label: "Became", w: "90px" }, { label: "By", w: "130px" }, { label: "Why", w: "minmax(180px, 2fr)" }]);
          edits.slice(0, 100).forEach(function (x) { e.row([esc(dmy(x.day)), esc(x.student), x.from ? esc(x.from) : none(), x.to ? esc(x.to) : "<span class='en-late'>removed</span>", esc(x.by), esc(x.why)]); });
          slot.appendChild(e);
        }, function (e) { K.failed(slot, e); });
      }
    });
  }

  /* ================================================== Early warning
     Children drifting out of school, with the reasons. The edges of a stage
     (after Class V, VIII and X) are where children change school and are lost. */
  var EW = { filter: "risk" };
  function levelChip(l) { return l === "high" ? chip("red", "High") : l === "medium" ? chip("orange", "Medium") : l === "low" ? chip("muted", "Low") : chip("muted", "None"); }
  function early(v, opts) {
    opts = opts || {};
    var P = K.cxPage(v, "Student Support", opts.title || "Early warning",
      "Children who may be drifting out of school: attendance thinning, marks falling, older than the class, a migrant family. Each says why. Fees are not used, and nobody is flagged for what a family owes.");
    var metrics = el("div"), filters = el("div"), slot = el("div", "en-slot");
    v.appendChild(metrics); v.appendChild(filters); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the registers and the marks…"));
    RG.early(opts.classId).then(function (r) {
      slot.innerHTML = "";
      var s = r.summary, moving = Object.keys(r.transitions).reduce(function (a, k) { return a + r.transitions[k]; }, 0), cases = r.students.filter(function (x) { return x.case; }).length;
      K.cxMetrics(metrics, [
        { label: "High", value: s.high, bad: s.high > 0, note: "several signals together" },
        { label: "Medium", value: s.medium, note: "worth a conversation" },
        { label: "Moving up soon", value: moving, note: Object.keys(r.transitions).map(function (k) { return r.transitions[k] + " at " + k; }).join(" · ") || "none" },
        { label: "Cases open", value: cases, note: "with a mentor" }
      ]);
      var chips = K.cnFilters([{ k: "risk", name: "High and medium", n: s.high + s.medium }, { k: "move", name: "Moving up soon", n: moving }, { k: "all", name: "Everyone", n: r.students.length }], EW.filter, function (k) { EW.filter = k; chips.mark(k); paint(); });
      filters.appendChild(chips);
      var box = el("div", "en-slot"); slot.appendChild(box);
      function paint() {
        box.innerHTML = "";
        var rows = r.students.filter(function (x) { return EW.filter === "all" || (EW.filter === "move" ? !!x.transition : x.level === "high" || x.level === "medium"); });
        if (!rows.length) { box.appendChild(K.cnEmpty(r.students.length ? "Nobody to look at here." : "Nobody in the class yet.", "")); return; }
        var t = K.cnTable([{ label: "Child", w: "minmax(140px, 1.1fr)" }, { label: "Class", w: "80px" }, { label: "Level", w: "100px" }, { label: "Why", w: "minmax(240px, 2.4fr)" }]);
        rows.slice(0, 300).forEach(function (x) {
          t.row(["<b>" + esc(x.name) + "</b>" + (x.rollNo ? "<span class='cn-sub2'>Roll " + esc(x.rollNo) + "</span>" : ""), x.classLabel ? esc(x.classLabel) : none(), levelChip(x.level) + (x.case ? "<span class='cn-sub2'>Case: " + esc(x.case.status) + "</span>" : ""),
                 x.signals.length ? x.signals.map(function (g) { return esc(g.text); }).join("<br>") : x.transition ? "<span class='cn-none'>Moves up (" + esc(x.transition) + "); nothing else on</span>" : none()],
            function () { earlyDialog(x, function () { K.openAdmin(true, opts.classId ? "in-myclass" : "in-ews"); }); }, x.id);
        });
        box.appendChild(t);
      }
      paint();
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, opts.classId ? "in-myclass" : "in-ews"); }); });
  }

  function earlyDialog(x, done) {
    var ctl = dialog({
      title: x.name, sub: (x.classLabel ? "Class " + x.classLabel + ". " : "") + "Level: " + x.level + ".", wide: true,
      body: function (h) {
        if (!x.signals.length) h.appendChild(el("p", "en-note", "Nothing is on for this child."));
        x.signals.forEach(function (g) { h.appendChild(el("p", "en-note", "• " + esc(g.text))); });
        if (x.transition) h.appendChild(el("p", "en-note", "Children are most often lost at the move " + esc(x.transition) + ": a phone call or a home visit before the year ends matters most here."));
      }
    });
    if (x.level === "high" || x.level === "medium" || x.case) {
      ctl.acts.insertBefore(btn(x.case ? "Open the case" : "Start a case", "quiet", function () {
        ctl.close();
        if (x.case) { K.openAdmin(false, "in-cases"); return; }
        API.items.create({ kind: "ewscase", title: x.name + ": early warning", subjectId: x.id, status: "open", data: { concern: x.signals.map(function (g) { return g.text; }).join(". ") } })
          .then(function () { toast("Case started. Add a mentor and the home visits under Student Support, Mentoring cases."); done(); }, function (e) { toast(e.message); });
      }), ctl.acts.firstChild);
    }
  }

  /* ============================================================ My class */
  function myClass(v) {
    var P = K.cxPage(v, "Students", "My class", "Your section's register for today, and the children close to the attendance a board asks for.");
    var slot = el("div", "en-slot");
    v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Loading…"));
    RG.classes(DAY, true).then(function (r) {
      slot.innerHTML = "";
      if (!r.classes.length) { slot.appendChild(K.cnEmpty("You are not the class teacher of a section.", "The office makes you a class teacher under Students, Classes.")); return; }
      r.classes.forEach(function (c) {
        var card = el("div", "rg-card");
        var off = r.schoolDay.kind !== "school" && !c.marked;
        var state = !c.strength ? chip("muted", "Empty") : c.taken ? chip("green", "Register in") : c.marked ? chip("orange", c.marked + " of " + c.strength + " marked") : off ? chip("muted", "Not a school day") : chip("red", "Register not taken");
        card.innerHTML = "<div><b>" + esc(c.label) + "</b><span class='cn-sub2'>" + plural(c.strength, "child", "children") + (c.room ? " · Room " + esc(c.room) : "") + " · " + esc(dmy(r.day)) + "</span></div>";
        card.appendChild(el("span", "rg-state", state));
        card.appendChild(btn(c.taken ? "Open the register" : "Take the register", "strong", function () { sheet(c.id, r.day, function () { K.openAdmin(true, "in-myclass"); }); }));
        if (K.hpc) {
          card.appendChild(btn("Rate competencies", "quiet", function () { K.hpc().rate(c.id, c.label); }));
          card.appendChild(btn("Progress cards", "quiet", function () { K.hpc().cards(c.id, c.label); }));
        }
        slot.appendChild(card);
        var sub = el("div", "rg-sub");
        slot.appendChild(sub);
        watch(sub, { classId: c.id, title: c.label + " attendance" });
        var sub2 = el("div", "rg-sub");
        slot.appendChild(sub2);
        early(sub2, { classId: c.id, title: c.label + " early warning" });
      });
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "in-myclass"); }); });
  }

  return { classes: classes, watch: function (v) { watch(v); }, early: function (v) { early(v); }, myClass: myClass, sheet: sheet };
};
