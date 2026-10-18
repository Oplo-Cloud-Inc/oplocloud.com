/* ==========================================================================
   OEdu — competencies and the Holistic Progress Card.

   What a child can do, subject by subject, term by term: the school's own list
   of competencies, a rating of 1 to 4 for each child, how many of a section are
   at grade level in each skill, and a card that carries the teacher's words with
   the child's, a classmate's and a parent's.

     competencies   the school's list, and the share at grade level in each skill
     rate           one section's grid: a child a row, a skill a column
     card           one child's card: levels, words, print

   The rules are the server's (api/src/routes/competency.js,
   services/competency.js); this file draws what it returns. Mounted by app.js
   with the console kit: OPLO_HPC(kit) → { competencies, rate, card }.
   ========================================================================== */
window.OPLO_HPC = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast, U = K.ui, CP = API.competency;
  var dialog = U.dialog, btn = U.btn, fld = U.fld, chip = U.chip, none = U.none, num = U.num, plural = U.plural;

  var LEVEL_TONE = { 1: "red", 2: "orange", 3: "green", 4: "green" };
  function bar(p) { return p == null ? "<span class='cn-none'>Not rated</span>" : "<span class='hp-bar'><i style='width:" + Math.max(2, p) + "%'></i></span> " + p + "%"; }
  var STAGES = [["", "Any stage"], ["foundational", "Foundational (before Class I, I–II)"], ["preparatory", "Preparatory (III–V)"], ["middle", "Middle (VI–VIII)"], ["secondary", "Secondary (IX–XII)"]];

  /* ======================================================== Competencies */
  var TERM = "1";
  function competencies(v) {
    var P = K.cxPage(v, "Academics", "Competencies",
      "What a child can do in each subject, rated 1 to 4 each term. The list is the school’s own. The table is the share of children at grade level (proficient or more) in each skill, lowest first.");
    var bar0 = el("div", "en-years"), slot = el("div", "en-slot");
    v.appendChild(bar0); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the ratings…"));
    var chips = K.cnFilters([{ k: "1", name: "Term 1" }, { k: "2", name: "Term 2" }], TERM, function (k) { TERM = k; K.openAdmin(true, "in-comp"); });
    bar0.appendChild(chips);
    P.tools.appendChild(K.cnAction("Add competencies", function () { addForm(function () { K.openAdmin(true, "in-comp"); }); }, true));
    Promise.all([CP.analytics(TERM), CP.list()]).then(function (res) {
      var a = res[0], l = res[1];
      slot.innerHTML = "";
      if (!l.competencies.length) { slot.appendChild(K.cnEmpty("The school has not listed any competencies.", "Add the skills the school teaches, subject by subject, or load the learning outcomes of its board.", "Add competencies", function () { addForm(function () { K.openAdmin(true, "in-comp"); }); })); return; }
      if (!a.skills.length) slot.appendChild(el("p", "en-note", "Nothing has been rated in Term " + esc(TERM) + " yet. Class teachers and subject teachers rate their sections under My class."));
      else {
        var t = K.cnTable([{ label: "Skill", w: "minmax(220px, 2fr)" }, { label: "Subject", w: "minmax(100px, 1fr)" }, { label: "Rated", w: "80px" }, { label: "At grade level", w: "minmax(150px, 1.2fr)" }]);
        a.skills.forEach(function (s) {
          t.row(["<b>" + esc(s.name) + "</b>", esc(s.subject), num(s.rated), bar(s.percent)], function () { skillDialog(s); }, s.id);
        });
        slot.appendChild(t);
      }
      var unrated = l.competencies.filter(function (c) { return !a.skills.some(function (s) { return s.id === c.id; }); });
      if (unrated.length) slot.appendChild(el("p", "en-note", plural(unrated.length, "skill") + " on the list, not rated yet this term: " + esc(unrated.slice(0, 6).map(function (c) { return c.name; }).join("; ")) + (unrated.length > 6 ? "…" : "") + "."));
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "in-comp"); }); });
  }

  function skillDialog(s) {
    dialog({
      title: s.name, sub: s.subject + ". " + plural(s.rated, "child", "children") + " rated; " + (s.percent == null ? "none" : s.percent + "%") + " at grade level.", wide: true,
      body: function (h) {
        var t = K.cnTable([{ label: "Section", w: "100px" }, { label: "Rated", w: "80px" }, { label: "At grade level", w: "minmax(150px, 1fr)" }]);
        s.sections.forEach(function (x) { t.row(["<b>" + esc(x.label) + "</b>", num(x.rated), bar(x.percent)]); });
        h.appendChild(t);
      }
    });
  }

  function addForm(done) {
    var subject = fld("text", "Subject", "", { req: true, max: 60, hint: "Mathematics" });
    var stage = fld("select", "Stage", "", { options: STAGES });
    var lines = fld("area", "Skills, one a line", "", { rows: 8, hint: "Adds and subtracts fractions | M-6.2\nReads a bar graph" });
    dialog({
      title: "Add competencies", wide: true, action: "Add them",
      sub: "One skill a line. After a bar, the reference your board or the school uses for it, if there is one. A skill that is already on the list is updated, not repeated.",
      body: function (h) { var g = el("div", "en-form-grid"); g.appendChild(subject.node); g.appendChild(stage.node); h.appendChild(g); h.appendChild(lines.node); },
      onSubmit: function () {
        if (!subject.value()) throw new Error("Name the subject.");
        var list = lines.value().split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
          var p = l.split("|").map(function (x) { return x.trim(); });
          return { subject: subject.value(), name: p[0], code: p[1] || undefined, stage: stage.value() || undefined };
        });
        if (!list.length) throw new Error("Write at least one skill.");
        return CP.add(list).then(function () { toast(plural(list.length, "skill") + " added."); done(); });
      }
    });
  }

  /* ================================================================ Rate */
  function rate(classId, label, done) {
    var data = null, sel = {}, term = TERM, subject = "";
    var ctl = dialog({
      title: "Rate " + label, wide: true, action: "Save the ratings",
      body: function (h) {
        var bar0 = el("div", "rg-nav"), slot = el("div", "en-slot");
        h.appendChild(bar0); h.appendChild(slot);
        function load() {
          slot.innerHTML = ""; slot.appendChild(el("div", "admin-loading", "Loading the section…"));
          CP.grid(classId, term, subject || undefined).then(function (r) { data = r; draw(); }, function (e) { K.failed(slot, e); });
        }
        var ts = fld("select", "Term", term, { options: [["1", "Term 1"], ["2", "Term 2"]] });
        ts.input.addEventListener("change", function () { term = ts.value(); load(); });
        var ss = fld("select", "Subject", "", { options: [["", "Every subject"]] });
        ss.input.addEventListener("change", function () { subject = ss.value(); load(); });
        bar0.appendChild(ts.node); bar0.appendChild(ss.node);
        var subjectsFilled = false;
        function draw() {
          if (!subjectsFilled) {
            var seen = {};
            data.competencies.forEach(function (c) { if (!seen[c.subject]) { seen[c.subject] = 1; var o = el("option"); o.value = c.subject; o.textContent = c.subject; ss.input.appendChild(o); } });
            subjectsFilled = true;
          }
          slot.innerHTML = ""; sel = {};
          if (!data.competencies.length) { slot.appendChild(K.cnEmpty("No competencies for this stage.", "The school lists them under Academics, Competencies.")); return; }
          if (!data.students.length) { slot.appendChild(K.cnEmpty("Nobody in this class yet.", "")); return; }
          slot.appendChild(el("p", "en-note", "1 beginning · 2 developing · 3 proficient · 4 advanced. “At grade level” is 3 or more."));
          var wrap = el("div", "hp-grid"), tbl = el("table", "hp-t");
          var hd = el("tr"); hd.appendChild(el("th", null, "Child"));
          data.competencies.forEach(function (c) { var th = el("th"); th.innerHTML = "<span title='" + esc(c.subject) + "'>" + esc(c.name) + "</span>"; hd.appendChild(th); });
          tbl.appendChild(hd);
          data.students.forEach(function (s) {
            var tr = el("tr"); tr.appendChild(el("td", "hp-n", (s.rollNo ? "<small>" + esc(s.rollNo) + "</small> " : "") + esc(s.name)));
            data.competencies.forEach(function (c) {
              var td = el("td"), x = el("select", "hp-sel");
              [["", "—"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]].forEach(function (o) { var op = el("option"); op.value = o[0]; op.textContent = o[1]; x.appendChild(op); });
              x.value = s.levels[c.id] == null ? "" : String(s.levels[c.id]);
              x.setAttribute("aria-label", c.name + " — " + s.name);
              sel[s.id + "|" + c.id] = { el: x, was: x.value };
              td.appendChild(x); tr.appendChild(td);
            });
            tbl.appendChild(tr);
          });
          var tf = el("tr", "hp-sum"); tf.appendChild(el("td", null, "At grade level"));
          data.summary.forEach(function (m) { tf.appendChild(el("td", null, m.percent == null ? "—" : m.percent + "%")); });
          tbl.appendChild(tf);
          wrap.appendChild(tbl); slot.appendChild(wrap);
        }
        load();
      },
      onSubmit: function () {
        var rows = [];
        Object.keys(sel).forEach(function (k) {
          var x = sel[k];
          if (x.el.value === x.was) return;
          var p = k.split("|");
          rows.push({ accountId: p[0], competencyId: p[1], level: x.el.value === "" ? null : Number(x.el.value) });
        });
        if (!rows.length) throw new Error("Nothing has changed.");
        return CP.putLevels({ classId: classId, term: term, levels: rows }).then(function () { toast(plural(rows.length, "rating") + " saved."); if (done) done(); });
      }
    });
    ctl.acts.insertBefore(btn("Handed to next year’s teacher", "quiet", function () { ctl.close(); carry(classId, label); }), ctl.acts.firstChild);
  }

  function carry(classId, label) {
    dialog({
      title: "Still below grade level · " + label, wide: true, sub: "At each child’s latest rating this year. This is what the next teacher is handed.",
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading…"));
        CP.carry(classId).then(function (r) {
          slot.innerHTML = "";
          if (!r.children.length) { slot.appendChild(K.cnEmpty("Nobody is behind on anything rated.", "")); return; }
          var t = K.cnTable([{ label: "Child", w: "minmax(140px, 1fr)" }, { label: "Skills still to secure", w: "minmax(260px, 3fr)" }]);
          r.children.forEach(function (k) { t.row(["<b>" + esc(k.name) + "</b>", k.behind.map(function (b) { return esc((b.subject ? b.subject + ": " : "") + b.name + " (" + b.level + ")"); }).join("<br>")]); });
          slot.appendChild(t);
        }, function (e) { K.failed(slot, e); });
      }
    });
  }

  /* ================================================================ Card */
  var SOURCE = { teacher: "Teacher", peer: "A classmate", self: "The child", parent: "A parent" };
  function card(childId, name, term) {
    var ctl = dialog({
      title: "Holistic Progress Card · " + name, wide: true,
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Building the card…"));
        function load() {
          CP.hpc(childId, term).then(function (r) { slot.innerHTML = ""; draw(slot, r, load); }, function (e) { K.failed(slot, e); });
        }
        load();
      }
    });
    ctl.acts.insertBefore(btn("Print or save as PDF", "quiet", function () {
      CP.hpc(childId, term).then(function (r) { print(r); }, function (e) { toast(e.message); });
    }), ctl.acts.firstChild);
  }

  function draw(slot, r, reload) {
    slot.appendChild(el("p", "en-note", esc(r.child.class ? "Class " + r.child.class + " · " : "") + esc(r.year.replace(/(\d{4})-\d{2}(\d{2})/, "$1–$2")) + (r.term ? " · Term " + esc(r.term) : "")));
    var subjects = Object.keys(r.competencies);
    if (!subjects.length) slot.appendChild(el("p", "en-note", "No competencies have been rated for this child yet."));
    subjects.forEach(function (sub) {
      slot.appendChild(el("h3", "en-h3", esc(sub)));
      var t = K.cnTable([{ label: "Skill", w: "minmax(220px, 2fr)" }, { label: "Term 1", w: "120px" }, { label: "Term 2", w: "120px" }]);
      r.competencies[sub].forEach(function (c) {
        var cell = function (k) { var x = c.terms[k]; return x ? chip(LEVEL_TONE[x.level], x.name) : none(); };
        t.row([esc(c.name), cell("1"), cell("2")]);
      });
      slot.appendChild(t);
    });
    slot.appendChild(el("h3", "en-h3", "In their own words, and others’"));
    if (!r.notes.length) slot.appendChild(el("p", "en-note", "Nothing written yet."));
    r.notes.forEach(function (n) { slot.appendChild(el("p", "en-note", "<b>" + esc(SOURCE[n.source] || n.source) + (n.area ? " · " + esc(n.area) : "") + "</b> (Term " + esc(n.term) + "): " + esc(n.body))); });
    var src = fld("select", "From", "teacher", { options: [["teacher", "The teacher"], ["peer", "A classmate (told to the teacher)"]] });
    var area = fld("text", "About", "", { max: 80, hint: "Strengths, Working together…" }), body = fld("area", "What was said", "", { rows: 2, max: 1000 });
    var g = el("div", "en-form-grid"); g.appendChild(src.node); g.appendChild(area.node); slot.appendChild(g); slot.appendChild(body.node);
    slot.appendChild(btn("Add to the card", "quiet", function () {
      if (!body.value()) { toast("Write something first."); return; }
      CP.addNote(r.child.id, { term: r.term || "1", source: src.value(), area: area.value() || undefined, body: body.value() }).then(function () { toast("Added."); reload(); }, function (e) { toast(e.message); });
    }));
  }

  function print(r) {
    var school = K.schoolName ? K.schoolName() : "";
    var subs = Object.keys(r.competencies).map(function (sub) {
      return "<h3>" + esc(sub) + "</h3><table><thead><tr><th>Skill</th><th>Term 1</th><th>Term 2</th></tr></thead><tbody>" + r.competencies[sub].map(function (c) {
        return "<tr><td>" + esc(c.name) + "</td><td>" + esc(c.terms["1"] ? c.terms["1"].name : "") + "</td><td>" + esc(c.terms["2"] ? c.terms["2"].name : "") + "</td></tr>";
      }).join("") + "</tbody></table>";
    }).join("");
    var by = {};
    r.notes.forEach(function (n) { (by[n.source] = by[n.source] || []).push(n); });
    var words = ["teacher", "self", "peer", "parent"].filter(function (k) { return by[k]; }).map(function (k) {
      return "<h3>" + esc(SOURCE[k]) + "</h3>" + by[k].map(function (n) { return "<p>" + (n.area ? "<b>" + esc(n.area) + ".</b> " : "") + esc(n.body) + "</p>"; }).join("");
    }).join("");
    K.cxPrint("Holistic Progress Card " + r.child.name, K.printHead(school + " — Holistic Progress Card", (r.child.class ? "Class " + r.child.class + " · " : "") + r.year.replace(/(\d{4})-\d{2}(\d{2})/, "$1–$2")) +
      "<p><b>" + esc(r.child.name) + "</b></p>" + subs + words +
      (r.attendance && r.attendance.total ? "<p>Attendance: " + esc(r.attendance.present) + " of " + esc(r.attendance.total) + " days (" + esc(r.attendance.percent) + "%)</p>" : "") +
      "<p style='margin-top:48px'>Class teacher ______________ &nbsp;&nbsp; Parent ______________ &nbsp;&nbsp; Principal ______________</p>");
  }

  /* A section's children, each opening their own card. */
  function cards(classId, label) {
    dialog({
      title: "Progress cards · " + label, wide: true, sub: "Open a child’s Holistic Progress Card to read it, add words to it, or print it.",
      body: function (h) {
        var slot = el("div", "en-slot");
        h.appendChild(slot);
        slot.appendChild(el("div", "admin-loading", "Loading…"));
        CP.grid(classId, TERM).then(function (r) {
          slot.innerHTML = "";
          var t = K.cnTable([{ label: "Roll", w: "60px" }, { label: "Child", w: "minmax(160px, 1fr)" }]);
          r.students.forEach(function (s) { t.row([s.rollNo ? esc(s.rollNo) : none(), "<b>" + esc(s.name) + "</b>"], function () { card(s.id, s.name); }, s.id); });
          slot.appendChild(t);
        }, function (e) { K.failed(slot, e); });
      }
    });
  }

  return { competencies: competencies, rate: rate, card: card, carry: carry, cards: cards };
};
