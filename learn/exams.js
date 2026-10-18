/* ==========================================================================
   OEdu — the exam cycle.

   Exams and their papers (one subject in one section), the marks a subject
   teacher enters, the steps a paper goes through (handed in, checked, approved,
   published), the report card, and the parent meeting that follows. Grading
   scales are the school's own, started from a board's template.

     scales    the school's grading scales
     exams     the exams of the school year, and every paper in each
     papers    a teacher's own papers (marks entry)
     sheet     one paper: the marks, row by row
     cards     a section's report cards, the class teacher's words, and print

   The rules are the server's (api/src/routes/exams.js, services/grading.js);
   this file draws what it returns. Mounted by app.js with the console kit:
   OPLO_EXAMS(kit) → { scales, exams, papers }.
   ========================================================================== */
window.OPLO_EXAMS = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast, U = K.ui, EX = API.exams;
  var dialog = U.dialog, btn = U.btn, fld = U.fld, chip = U.chip, none = U.none, num = U.num, plural = U.plural, dmy = U.dmy;

  var STATE = { entry: ["muted", "With the teacher"], submitted: ["orange", "Handed in"], checked: ["orange", "Checked"], approved: ["green", "Approved"], published: ["green", "Published"] };
  function stateChip(p) { var s = STATE[p.state] || ["muted", p.state]; return chip(s[0], s[1]); }
  var year = function (y) { return String(y || "").replace(/(\d{4})-\d{2}(\d{2})/, "$1–$2"); };
  function again(place) { return function () { K.openAdmin(true, place); }; }

  /* ============================================================== Scales */
  function scales(v) {
    var P = K.cxPage(v, "Academics", "Grading scales",
      "How marks become grades, and what passes. Each scale starts from a board’s published bands and is the school’s from then on: check it against the board’s current circular before using it.");
    var slot = el("div", "en-slot");
    v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Loading the scales…"));
    EX.scales().then(function (r) {
      P.tools.appendChild(K.cnAction("New scale", function () { newScale(r, again("in-scales")); }, true));
      slot.innerHTML = "";
      if (!r.scales.length) { slot.appendChild(K.cnEmpty("The school has no grading scale yet.", "Start one from a board’s template; every exam uses a scale.", "New scale", function () { newScale(r, again("in-scales")); })); return; }
      var t = K.cnTable([{ label: "Scale", w: "minmax(180px, 1.5fr)" }, { label: "Board", w: "90px" }, { label: "Kind", w: "120px" }, { label: "Pass mark", w: "100px" }, { label: "Bands", w: "100px" }, { label: "In use", w: "80px" }]);
      r.scales.forEach(function (s) {
        t.row(["<b>" + esc(s.name) + "</b>", s.board ? esc(s.board) : none(), s.kind === "coscholastic" ? "Co-scholastic" : "Marks and grades", s.passPercent == null ? none() : s.passPercent + "%",
               s.bands.length ? num(s.bands.length) : "<span class='cn-none'>None</span>", s.used ? num(s.used) : none()], function () { scaleForm(s, again("in-scales")); }, s.id);
      });
      slot.appendChild(t);
    }, function (e) { K.failed(slot, e, again("in-scales")); });
  }

  function newScale(r, done) {
    var pick = fld("select", "Start from", r.templates[0].key, { options: r.templates.map(function (t) { return [t.key, t.name]; }) });
    var name = fld("text", "Call it", "", { max: 80, hint: "Leave empty to use the template’s name" });
    var note = el("p", "en-note");
    function show() { var t = r.templates.filter(function (x) { return x.key === pick.value(); })[0]; note.textContent = t ? t.note : ""; }
    dialog({
      title: "New grading scale", wide: true, action: "Make it the school’s",
      body: function (h) { var g = el("div", "en-form-grid"); g.appendChild(pick.node); g.appendChild(name.node); h.appendChild(g); h.appendChild(note); pick.input.addEventListener("change", show); show(); },
      onSubmit: function () { var b = { template: pick.value() }; if (name.value()) b.name = name.value(); return EX.createScale(b).then(function () { toast("Scale made."); done(); }); }
    });
  }

  function scaleForm(s, done) {
    var name = fld("text", "Name", s.name, { max: 80 }), pass = fld("text", "Pass mark (%)", s.passPercent == null ? "" : s.passPercent, { max: 5, hint: "Empty: no pass line" });
    var note = fld("area", "Where it is from, and what it was checked against", s.note || "", { rows: 3, max: 600 });
    var rows = [];
    var box = el("div", "ex-bands");
    function band(b) {
      var r = el("div", "ex-band"), g = el("input"), m = el("input"), p = el("input");
      g.value = b.grade || ""; g.placeholder = "Grade"; g.maxLength = 8;
      if (s.kind === "scholastic") { m.value = b.min == null ? "" : b.min; m.placeholder = "From %"; p.value = b.point == null ? "" : b.point; p.placeholder = "Point"; }
      else { m.value = b.label || ""; m.placeholder = "Meaning"; }
      r.appendChild(g); r.appendChild(m); if (s.kind === "scholastic") r.appendChild(p);
      var x = btn("×", "quiet", function () { rows.splice(rows.indexOf(rec), 1); r.remove(); }); x.setAttribute("aria-label", "Remove this band");
      r.appendChild(x);
      var rec = { g: g, m: m, p: p };
      rows.push(rec); box.appendChild(r);
    }
    (s.bands || []).forEach(band);
    var ctl = dialog({
      title: s.name, wide: true, action: "Save",
      sub: s.kind === "coscholastic" ? "The grades a teacher may give for art, sport, discipline and the like." : "A mark gets the highest band it reaches. The lowest band must start at 0%.",
      body: function (h) {
        var g = el("div", "en-form-grid"); g.appendChild(name.node);
        if (s.kind === "scholastic") g.appendChild(pass.node);
        h.appendChild(g); h.appendChild(note.node);
        h.appendChild(el("h3", "en-h3", s.kind === "coscholastic" ? "Grades" : "Bands, highest first"));
        h.appendChild(box);
        h.appendChild(btn("Add a band", "quiet", function () { band({}); }));
      },
      onSubmit: function () {
        var bands = rows.map(function (r) {
          return s.kind === "scholastic" ? { grade: r.g.value.trim(), min: r.m.value.trim(), point: r.p.value.trim() === "" ? null : r.p.value.trim() } : { grade: r.g.value.trim(), label: r.m.value.trim() };
        });
        var b = { name: name.value(), note: note.value() || null, bands: bands };
        if (s.kind === "scholastic") b.passPercent = pass.value() === "" ? null : pass.value();
        return EX.updateScale(s.id, b).then(function () { toast("Saved."); done(); });
      }
    });
    if (!s.used) ctl.acts.insertBefore(btn("Delete", "quiet", function () { ctl.close(); EX.deleteScale(s.id).then(function () { toast("Deleted."); done(); }, function (e) { toast(e.message); }); }), ctl.acts.firstChild);
  }

  /* =============================================================== Exams */
  var YEAR = null;
  function exams(v) {
    var P = K.cxPage(v, "Academics", "Exams", "The school year’s exams. Each has a paper for every subject of every section; marks go from the teacher to a check, an approval and then the families.");
    var bar = el("div", "en-years"), slot = el("div", "en-slot");
    v.appendChild(bar); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Loading the exams…"));
    Promise.all([EX.list(YEAR), EX.scales()]).then(function (res) {
      var r = res[0], sc = res[1];
      slot.innerHTML = "";
      P.tools.appendChild(K.cnAction("New exam", function () { examForm(sc, again("in-exams")); }, true));
      var here = (r.exams[0] && r.exams[0].year) || YEAR;
      if (here) {
        var a = +here.slice(0, 4);
        var yrs = [(a - 1) + "-" + a, here, (a + 1) + "-" + (a + 2)];
        var chips = K.cnFilters(yrs.map(function (y) { return { k: y, name: year(y) }; }), here, function (k) { YEAR = k; K.openAdmin(true, "in-exams"); });
        bar.appendChild(chips);
      }
      if (!sc.scales.some(function (x) { return x.kind === "scholastic"; })) slot.appendChild(el("p", "en-note", "Make a grading scale first (Academics, Grading scales); an exam is graded by one."));
      if (!r.exams.length) { slot.appendChild(K.cnEmpty("No exams in this school year.", "Make the first exam, such as Term 1, then set up its papers.", "New exam", function () { examForm(sc, again("in-exams")); })); return; }
      var t = K.cnTable([{ label: "Exam", w: "minmax(180px, 1.5fr)" }, { label: "Year", w: "100px" }, { label: "Kind", w: "100px" }, { label: "Papers", w: "90px" }, { label: "Published", w: "100px" }]);
      r.exams.forEach(function (e) {
        t.row(["<b>" + esc(e.name) + "</b>", esc(year(e.year)), esc(e.kind), num(e.papers || 0), e.papers ? num(e.published) + " of " + num(e.papers) : none()], function () { examView(e, sc); }, e.id);
      });
      slot.appendChild(t);
    }, function (e) { K.failed(slot, e, again("in-exams")); });
  }

  function examForm(sc, done, pre) {
    var name = fld("text", "Name", pre ? pre.name : "", { req: true, max: 80, hint: "Term 1, Half-yearly, Annual" });
    var kind = fld("select", "Kind", pre ? pre.kind : "term", { options: [["term", "Term"], ["periodic", "Periodic test"], ["annual", "Annual"], ["improvement", "Improvement"]] });
    var scale = fld("select", "Grading scale", pre ? pre.scaleId || "" : "", { options: [["", "None: marks only"]].concat(sc.scales.filter(function (x) { return x.kind === "scholastic"; }).map(function (x) { return [x.id, x.name]; })) });
    var co = fld("select", "Co-scholastic scale", pre ? pre.coscaleId || "" : "", { options: [["", "None"]].concat(sc.scales.filter(function (x) { return x.kind === "coscholastic"; }).map(function (x) { return [x.id, x.name]; })) });
    var from = fld("date", "Attendance counted from", pre ? pre.startsOn || "" : ""), to = fld("date", "To", pre ? pre.endsOn || "" : "");
    dialog({
      title: pre ? pre.name : "New exam", wide: true, action: pre ? "Save" : "Make the exam",
      sub: "The attendance on each report card is counted over these dates; left empty it is the school year to today.",
      body: function (h) { var g = el("div", "en-form-grid"); (pre ? [scale, co, from, to] : [name, kind, scale, co, from, to]).forEach(function (f) { g.appendChild(f.node); }); h.appendChild(g); },
      onSubmit: function () {
        var b = { scaleId: scale.value() || null, coscaleId: co.value() || null, startsOn: from.value() || null, endsOn: to.value() || null };
        if (pre) return EX.update(pre.id, b).then(function () { toast("Saved."); done(); });
        if (!name.value()) throw new Error("Give the exam a name.");
        b.name = name.value(); b.kind = kind.value();
        return EX.create(b).then(function () { toast("Exam made. Set up its papers next."); done(); });
      }
    });
  }

  /* One exam: its papers by section, and what each needs next. */
  function examView(e, sc) {
    var ctl = dialog({
      title: e.name, wide: true, sub: year(e.year) + ". Open a section to see its papers, move them on, or print its report cards.",
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading the papers…"));
        Promise.all([EX.papers({ examId: e.id }), API.india.classes(e.year)]).then(function (res) {
          slot.innerHTML = "";
          var by = {};
          res[0].papers.forEach(function (p) { (by[p.classId] = by[p.classId] || { label: p.classLabel, papers: [] }).papers.push(p); });
          var ids = Object.keys(by);
          var classes = res[1].classes;
          if (!ids.length) slot.appendChild(el("p", "en-note", "No papers yet. Set them up for a section: a line for each subject."));
          else {
            var t = K.cnTable([{ label: "Section", w: "90px" }, { label: "Papers", w: "80px" }, { label: "With the teacher", w: "130px" }, { label: "Handed in / checked", w: "150px" }, { label: "Approved", w: "100px" }, { label: "Published", w: "100px" }]);
            ids.sort().forEach(function (id) {
              var ps = by[id].papers, c = function (st) { return ps.filter(function (p) { return p.state === st; }).length; };
              t.row(["<b>" + esc(by[id].label) + "</b>", num(ps.length), num(c("entry")), num(c("submitted") + c("checked")), num(c("approved")), num(c("published"))],
                function () { ctl.close(); classPapers(e, id, by[id].label, sc); }, id);
            });
            slot.appendChild(t);
          }
          var acts = el("div", "cn-acts");
          acts.appendChild(K.cnAction("Set up papers for a section", function () { ctl.close(); paperSetup(e, classes, again("in-exams")); }, true));
          acts.appendChild(K.cnAction("Exam settings", function () { ctl.close(); examForm(sc, again("in-exams"), e); }));
          slot.appendChild(acts);
        }, function (er) { K.failed(slot, er); });
      }
    });
  }

  function paperSetup(e, classes, done) {
    var cls = fld("select", "Section", "", { options: [["", "Choose a section"]].concat(classes.map(function (c) { return [c.id, c.label + (c.classTeacher ? " · " + c.classTeacher.name : "")]; })) });
    var lines = fld("area", "Subjects", "", { rows: 8, hint: "One subject a line: Science, or Science | 80 | 20 for theory and internal marks" });
    dialog({
      title: "Papers for " + e.name, wide: true, action: "Set up the papers",
      sub: "A paper is one subject in one section. The marks are out of 80 for the exam and 20 for internal assessment unless a line says otherwise: Subject | theory | internal | practical. The subject teacher is chosen next.",
      body: function (h) { var g = el("div", "en-form-grid"); g.appendChild(cls.node); h.appendChild(g); h.appendChild(lines.node); },
      onSubmit: function () {
        if (!cls.value()) throw new Error("Choose the section.");
        var papers = lines.value().split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
          var p = l.split("|").map(function (x) { return x.trim(); }), o = { subject: p[0] };
          if (p[1] !== undefined && p[1] !== "") o.maxTheory = Number(p[1]);
          if (p[2] !== undefined && p[2] !== "") o.maxInternal = Number(p[2]);
          if (p[3] !== undefined && p[3] !== "") o.maxPractical = Number(p[3]);
          return o;
        });
        if (!papers.length) throw new Error("Name at least one subject.");
        return EX.addPapers(e.id, cls.value(), papers).then(function () { toast("Papers set up."); done(); });
      }
    });
  }

  /* A section's papers in an exam: who has them, where each is, and the next step. */
  function classPapers(e, classId, label, sc) {
    var ctl = dialog({
      title: label + " · " + e.name, wide: true,
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading…"));
        Promise.all([EX.papers({ examId: e.id, classId: classId }), API.accounts.list(K.S.me.orgId).catch(function () { return []; })]).then(function (res) {
          slot.innerHTML = "";
          var t = K.cnTable([{ label: "Subject", w: "minmax(130px, 1.2fr)" }, { label: "Teacher", w: "minmax(130px, 1fr)" }, { label: "Marks in", w: "90px" }, { label: "Out of", w: "70px" }, { label: "Where it is", w: "140px" }]);
          res[0].papers.forEach(function (p) {
            t.row(["<b>" + esc(p.subject) + "</b>", p.teacher ? esc(p.teacher.name) : "<span class='cn-none'>Not set</span>", num(p.entered) + " of " + num(p.strength), num(p.maxTheory + p.maxInternal + p.maxPractical),
                   stateChip(p) + (p.returnedNote && p.state === "entry" ? "<span class='cn-sub2'>Sent back</span>" : "")],
              function () { ctl.close(); sheet(p.id, function () { classPapers(e, classId, label, sc); }); }, p.id);
          });
          slot.appendChild(t);
        }, function (er) { K.failed(slot, er); });
      }
    });
    ctl.acts.insertBefore(btn("Report cards", "quiet", function () { ctl.close(); cards(e, classId, label); }), ctl.acts.firstChild);
    ctl.acts.insertBefore(btn("Parent meeting…", "quiet", function () { ctl.close(); ptmForm(e, classId, label); }), ctl.acts.firstChild);
    ctl.acts.insertBefore(btn("Papers: choose teachers", "quiet", function () { ctl.close(); teachers(e, classId, label, sc); }), ctl.acts.firstChild);
  }

  function teachers(e, classId, label, sc) {
    var people = [];
    var rows = [];
    dialog({
      title: "Who sets and marks each paper · " + label, wide: true, action: "Save",
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading…"));
        Promise.all([EX.papers({ examId: e.id, classId: classId }), API.accounts.list(K.S.me.orgId)]).then(function (res) {
          slot.innerHTML = "";
          people = (res[1] || []).filter(function (p) { return p.status !== "suspended"; });
          res[0].papers.forEach(function (p) {
            var s = fld("select", p.subject, p.teacher ? p.teacher.id : "", { options: [["", "Nobody yet"]].concat(people.map(function (a) { return [a.id, a.name]; })) });
            rows.push({ id: p.id, was: p.teacher ? p.teacher.id : "", f: s });
            slot.appendChild(s.node);
          });
        }, function (er) { K.failed(slot, er); });
      },
      onSubmit: function () {
        var changed = rows.filter(function (r) { return r.f.value() !== r.was; });
        return Promise.all(changed.map(function (r) { return EX.reassign(r.id, r.f.value() || null); })).then(function () { toast("Saved."); K.openAdmin(true, "in-exams"); });
      }
    });
  }

  /* ============================================================ The sheet */
  function sheet(paperId, done) {
    var data = null, inputs = {}, why = null;
    var ctl = dialog({
      title: "Marks", wide: true,
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading the paper…"));
        load(slot);
      }
    });
    function can() { return data && (data.paper.state === "entry" || data.mayCheck); }
    function load(slot) {
      EX.paper(paperId).then(function (r) { data = r; draw(slot); }, function (e) { K.failed(slot, e); });
    }
    function draw(slot) {
      slot.innerHTML = ""; inputs = {};
      var p = data.paper, locked = p.state === "approved" || p.state === "published";
      slot.appendChild(el("p", "rg-head", esc(p.subject) + " · " + esc(p.classLabel) + "<small>" + esc(p.exam) + " · " + stateChip(p) + " · " + num(p.entered) + " of " + num(p.strength) + " have marks</small>"));
      if (p.returnedNote && p.state === "entry") slot.appendChild(el("p", "rg-banner", "<b>Sent back:</b> " + esc(p.returnedNote)));
      var editable = p.state === "entry" || data.office;
      if (locked && editable) slot.appendChild(el("p", "rg-banner", "<b>" + esc(p.state === "published" ? "Published" : "Approved") + ".</b> A change now needs a reason, is kept with the change, and is listed for the principal."));
      var cols = [{ k: "theory", l: "Exam", max: p.maxTheory }, { k: "internal", l: "Internal", max: p.maxInternal }, { k: "practical", l: "Practical", max: p.maxPractical }].filter(function (c) { return c.max > 0; });
      var head = el("div", "ex-row ex-head");
      head.style.setProperty("--n", cols.length);
      head.appendChild(el("span", null, "Roll")); head.appendChild(el("span", null, "Name"));
      cols.forEach(function (c) { head.appendChild(el("span", "ex-c", c.l + " /" + c.max)); });
      head.appendChild(el("span", "ex-c", "AB")); head.appendChild(el("span", "ex-c", "Total")); head.appendChild(el("span", "ex-c", "Grade"));
      var list = el("div", "ex-sheet");
      list.appendChild(head);
      data.students.forEach(function (s) {
        var r = el("div", "ex-row"); r.style.setProperty("--n", cols.length);
        r.appendChild(el("span", "rg-roll", s.rollNo ? esc(s.rollNo) : "")); r.appendChild(el("span", "rg-name", esc(s.name)));
        var rec = inputs[s.id] = { in: {}, ab: null, total: null, grade: null };
        cols.forEach(function (c) {
          var i = el("input", "ex-in"); i.type = "text"; i.inputMode = "decimal"; i.value = s[c.k] == null ? "" : s[c.k]; i.disabled = !editable;
          i.setAttribute("aria-label", c.l + " — " + s.name);
          i.addEventListener("input", calc); rec.in[c.k] = i;
          var w = el("span", "ex-c"); w.appendChild(i); r.appendChild(w);
        });
        var ab = el("input"); ab.type = "checkbox"; ab.checked = s.absent; ab.disabled = !editable; ab.setAttribute("aria-label", "Absent — " + s.name);
        ab.addEventListener("change", function () { cols.forEach(function (c) { rec.in[c.k].disabled = ab.checked || !editable; }); calc(); });
        rec.ab = ab; var wa = el("span", "ex-c"); wa.appendChild(ab); r.appendChild(wa);
        rec.total = el("span", "ex-c ex-t"); rec.grade = el("span", "ex-c ex-g");
        r.appendChild(rec.total); r.appendChild(rec.grade);
        if (ab.checked) cols.forEach(function (c) { rec.in[c.k].disabled = true; });
        list.appendChild(r);
      });
      slot.appendChild(list);
      var max = p.maxTheory + p.maxInternal + p.maxPractical;
      function calc() {
        data.students.forEach(function (s) {
          var rec = inputs[s.id];
          if (rec.ab.checked) { rec.total.textContent = "AB"; rec.grade.textContent = ""; return; }
          var vals = cols.map(function (c) { return rec.in[c.k].value.trim(); });
          if (vals.some(function (x) { return x === ""; })) { rec.total.textContent = ""; rec.grade.textContent = ""; return; }
          var tot = vals.reduce(function (a, x) { return a + Number(x); }, 0);
          rec.total.textContent = isFinite(tot) ? Math.round(tot * 100) / 100 : "?";
          var bad = cols.some(function (c, i) { return !isFinite(Number(vals[i])) || Number(vals[i]) > c.max || Number(vals[i]) < 0; });
          rec.total.classList.toggle("ex-bad", bad);
          var pct = max ? tot / max * 100 : 0, g = "";
          for (var i = 0; i < data.scale.bands.length; i++) if (pct + 1e-9 >= data.scale.bands[i].min) { g = data.scale.bands[i].grade; break; }
          rec.grade.textContent = bad ? "" : g;
          if (!bad && data.scale.passPercent != null && pct + 1e-9 < data.scale.passPercent) rec.grade.classList.add("ex-fail"); else rec.grade.classList.remove("ex-fail");
        });
      }
      calc();
      if (locked && editable) { why = fld("text", "Why are you changing a mark?", "", { req: true, max: 200 }); slot.appendChild(why.node); } else why = null;
      var acts = el("div", "cn-acts ex-acts");
      function step(label, to, strong, needNote) {
        acts.appendChild(K.cnAction(label, function () {
          var go = function (note) { return EX.advance(paperId, to, note).then(function () { toast(label + ": done."); ctl.close(); if (done) done(); else K.openAdmin(true); }, function (e) { toast(e.message); }); };
          if (needNote) { var n = window.prompt("What needs another look? The teacher is shown this."); if (n) go(n); } else go();
        }, strong));
      }
      if (editable) acts.appendChild(K.cnAction("Save the marks", function () { save(false); }, p.state === "entry"));
      if (p.state === "entry" && data.canEnter) step("Hand it in", "submitted", true);
      if (p.state === "submitted" && data.mayCheck) { step("Mark as checked", "checked", true); step("Send it back", "entry", false, true); }
      if (p.state === "checked" && data.mayApprove) { step("Approve", "approved", true); step("Send it back", "entry", false, true); }
      if (p.state === "checked" && !data.mayApprove && data.mayCheck) step("Send it back", "entry", false, true);
      if (p.state === "approved" && data.mayPublish) { step("Publish to families", "published", true); }
      slot.appendChild(acts);
    }
    function save() {
      var marks = data.students.map(function (s) {
        var rec = inputs[s.id], o = { accountId: s.id, absent: rec.ab.checked };
        Object.keys(rec.in).forEach(function (k) { o[k] = rec.in[k].value.trim() === "" ? null : rec.in[k].value.trim(); });
        return o;
      });
      var body = { marks: marks };
      if (why) { if (why.value().length < 5) { toast("Say why you are changing a mark."); return; } body.why = why.value(); }
      EX.putMarks(paperId, body).then(function (r) { toast("Marks saved."); data = Object.assign({}, r, { office: data.office, mayCheck: data.mayCheck, mayApprove: data.mayApprove, mayPublish: data.mayPublish, canEnter: data.canEnter }); draw(ctl.host.querySelector(".en-slot")); },
        function (e) { toast(e.message); });
    }
  }

  /* ========================================================== My papers */
  function papers(v) {
    var P = K.cxPage(v, "Teach", "Marks entry", "The papers you set and mark, and your own section’s. Enter marks, then hand a paper in: the dean checks it, the principal approves it, and families see it once it is published.");
    var slot = el("div", "en-slot");
    v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Loading your papers…"));
    EX.papers({ mine: true }).then(function (r) {
      slot.innerHTML = "";
      if (!r.papers.length) { slot.appendChild(K.cnEmpty("No papers are with you.", "The office sets up each exam’s papers and says who marks them.")); return; }
      var t = K.cnTable([{ label: "Exam", w: "minmax(140px, 1fr)" }, { label: "Section", w: "90px" }, { label: "Subject", w: "minmax(130px, 1fr)" }, { label: "Marks in", w: "90px" }, { label: "Where it is", w: "150px" }]);
      r.papers.forEach(function (p) {
        t.row([esc(p.exam), "<b>" + esc(p.classLabel) + "</b>", esc(p.subject), num(p.entered) + " of " + num(p.strength), stateChip(p) + (p.returnedNote && p.state === "entry" ? "<span class='cn-sub2'>Sent back</span>" : "")],
          function () { sheet(p.id, again("in-papers")); }, p.id);
      });
      slot.appendChild(t);
    }, function (e) { K.failed(slot, e, again("in-papers")); });
    // A class teacher also writes the remarks on their own section's cards.
    var cardsBox = el("div", "en-slot");
    v.appendChild(cardsBox);
    Promise.all([API.register.classes(null, true), EX.list(null)]).then(function (res) {
      var mine = res[0].classes, list = res[1].exams;
      if (!mine.length || !list.length) return;
      cardsBox.appendChild(el("h3", "cn-h2", "Report cards of your section"));
      var acts = el("div", "cn-acts");
      mine.forEach(function (c) { list.forEach(function (x) { acts.appendChild(K.cnAction(c.label + " · " + x.name, function () { cards(x, c.id, c.label); })); }); });
      cardsBox.appendChild(acts);
    }, function () { /* not a class teacher, or no exams yet */ });
  }

  /* ======================================================== Report cards */
  function cards(e, classId, label) {
    var data = null, forms = {};
    var ctl = dialog({
      title: "Report cards · " + label + " · " + e.name, wide: true, action: "Save the remarks",
      sub: "Built from the papers that have been published. A child’s remark and result show to the family once every paper is out.",
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Building the cards…"));
        EX.cards(e.id, classId).then(function (r) {
          data = r; slot.innerHTML = "";
          var areas = r.coscale ? ["Art education", "Health and physical education", "Work education", "Discipline"] : [];
          r.cards.forEach(function (c) {
            var card = el("div", "ex-card"), f = forms[c.accountId] = { cos: {} };
            var hd = "<b>" + esc(c.name) + "</b><span class='cn-sub2'>" + (c.rollNo ? "Roll " + esc(c.rollNo) + " · " : "") + (c.percent == null ? "no marks yet" : esc(c.total + " of " + c.max + " · " + c.percent + "%" + (c.grade ? " · " + c.grade : ""))) +
              (c.attendance.total ? " · attendance " + c.attendance.percent + "%" : "") + "</span>";
            card.appendChild(el("div", "ex-card-h", hd + " " + (c.result === "pass" ? chip("green", "Pass") : c.result === "fail" ? chip("red", "Not passed: " + esc(c.failed.join(", "))) : c.result === "incomplete" ? chip("orange", "Waiting for " + esc(c.incomplete.join(", "))) : "")));
            var lines = c.subjects.map(function (l) {
              return "<span>" + esc(l.subject) + "</span><span>" + (l.absent ? "AB" : l.missing ? "—" : esc(l.total + "/" + l.max)) + "</span><span>" + esc(l.grade || "") + "</span><span>" + (l.state && l.state !== "published" ? esc(l.state) : "") + "</span>";
            }).join("");
            if (lines) card.appendChild(el("div", "ex-lines", lines));
            f.remark = el("input", "ex-remark"); f.remark.type = "text"; f.remark.placeholder = "Class teacher’s remark"; f.remark.maxLength = 400; f.remark.value = c.remark || "";
            f.result = el("select", "cx-select");
            [["", "Result not decided"], ["promoted", "Promoted"], ["detained", "Detained"], ["passed out", "Passed out"]].forEach(function (x) { var o = el("option"); o.value = x[0]; o.textContent = x[1]; f.result.appendChild(o); });
            f.result.value = c.decision || "";
            var row = el("div", "ex-card-f"); row.appendChild(f.remark); row.appendChild(f.result);
            card.appendChild(row);
            if (r.coscale) {
              var cr = el("div", "ex-cos");
              areas.forEach(function (a) {
                var s = el("select", "cx-select ex-cosel"), o0 = el("option"); o0.value = ""; o0.textContent = a; s.appendChild(o0);
                r.coscale.bands.forEach(function (b) { var o = el("option"); o.value = b.grade; o.textContent = b.grade + (b.label ? " — " + b.label : ""); s.appendChild(o); });
                s.value = c.cos[a] || ""; f.cos[a] = s; cr.appendChild(s);
              });
              card.appendChild(cr);
            }
            slot.appendChild(card);
          });
          if (!r.cards.length) slot.appendChild(K.cnEmpty("Nobody to make a card for.", ""));
        }, function (er) { K.failed(slot, er); });
      },
      onSubmit: function () {
        if (!data) throw new Error("The cards have not loaded.");
        var items = data.cards.map(function (c) {
          var f = forms[c.accountId], o = { accountId: c.accountId, remark: f.remark.value.trim() || null, result: f.result.value || null };
          if (data.coscale) { o.cos = {}; Object.keys(f.cos).forEach(function (a) { if (f.cos[a].value) o.cos[a] = f.cos[a].value; }); }
          return o;
        });
        return EX.putCards(e.id, classId, items).then(function () { toast("Saved."); });
      }
    });
    ctl.acts.insertBefore(btn("Print or save as PDF", "quiet", function () {
      if (!data) return;
      EX.cards(e.id, classId).then(function (r) { printCards(e, label, r); }, function (er) { toast(er.message); });
    }), ctl.acts.firstChild);
  }

  function printCards(e, label, r) {
    var school = K.schoolName ? K.schoolName() : "";
    var pages = r.cards.map(function (c) {
      var rows = c.subjects.map(function (l) {
        return "<tr><td>" + esc(l.subject) + "</td><td>" + (l.absent ? "AB" : l.missing ? "" : esc(l.theory == null ? "" : l.theory)) + "</td><td>" + (l.absent || l.missing ? "" : esc(l.internal == null ? "" : l.internal)) +
               "</td><td>" + (l.absent || l.missing ? "" : esc(l.practical == null ? "" : l.practical)) + "</td><td>" + (l.absent || l.missing ? "" : esc(l.total)) + "</td><td>" + esc(l.max) + "</td><td>" + esc(l.grade || "") + "</td></tr>";
      }).join("");
      var cos = Object.keys(c.cos || {}).map(function (a) { return "<tr><td>" + esc(a) + "</td><td>" + esc(c.cos[a]) + "</td></tr>"; }).join("");
      return "<section style='page-break-after:always'>" + K.printHead(school + " — Report card", e.name + " · " + year(e.year)) +
        "<p><b>" + esc(c.name) + "</b> &nbsp; Class " + esc(label) + (c.rollNo ? " &nbsp; Roll " + esc(c.rollNo) : "") + "</p>" +
        "<table><thead><tr><th>Subject</th><th>Exam</th><th>Internal</th><th>Practical</th><th>Total</th><th>Out of</th><th>Grade</th></tr></thead><tbody>" + rows + "</tbody></table>" +
        "<p><b>Total " + esc(c.total) + " of " + esc(c.max) + (c.percent != null ? " (" + esc(c.percent) + "%)" : "") + (c.grade ? " · Grade " + esc(c.grade) : "") + "</b>" +
        (c.result === "pass" ? " · Pass" : c.result === "fail" ? " · Not passed in " + esc(c.failed.join(", ")) : "") + "</p>" +
        (cos ? "<table><thead><tr><th>Co-scholastic</th><th>Grade</th></tr></thead><tbody>" + cos + "</tbody></table>" : "") +
        (c.attendance.total ? "<p>Attendance: " + esc(c.attendance.present) + " of " + esc(c.attendance.total) + " days (" + esc(c.attendance.percent) + "%)</p>" : "") +
        (c.remark ? "<p>Class teacher’s remark: " + esc(c.remark) + "</p>" : "") + (c.decision ? "<p>Result: " + esc(c.decision) + "</p>" : "") +
        "<p style='margin-top:48px'>Class teacher ______________ &nbsp;&nbsp;&nbsp; Principal ______________ &nbsp;&nbsp;&nbsp; Parent ______________</p></section>";
    }).join("");
    K.cxPrint("Report cards " + label + " " + e.name, pages);
  }

  /* ======================================================= Parent meeting */
  function ptmForm(e, classId, label) {
    var title = fld("text", "Title", e.name + " results", { req: true, max: 120 }), day = fld("date", "Day", ""), start = fld("text", "Starts at", "10:00", { max: 5, hint: "10:00" });
    var mins = fld("text", "Minutes for each family", "10", { max: 2 });
    var mode = fld("select", "Slots", "roll", { options: [["roll", "One for each child, in roll order"], ["open", "Open: families choose"]] });
    dialog({
      title: "Parent meeting · " + label, wide: true, action: "Set the meeting",
      sub: "Families are told the day and, in roll order, their own time. In an open meeting each family chooses from the free slots in the family view.",
      body: function (h) { var g = el("div", "en-form-grid"); [title, day, start, mins, mode].forEach(function (f) { g.appendChild(f.node); }); h.appendChild(g); },
      onSubmit: function () {
        if (!day.value()) throw new Error("Choose the day.");
        return EX.createPtm({ classId: classId, examId: e.id, title: title.value(), day: day.value(), start: start.value(), slotMinutes: Number(mins.value()), mode: mode.value() })
          .then(function () { toast("Meeting set; families are being told."); });
      }
    });
  }

  return { scales: scales, exams: exams, papers: papers, sheet: sheet };
};
