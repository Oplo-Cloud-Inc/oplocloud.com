/* ==========================================================================
   OEdu — the teacher's own tools.

   The teacher console (app.js) already had the sheet, To Grade, assignments,
   analytics. This file is the rest of what a teacher expects a gradebook to
   do, the part they set up once and then lean on every day:

     Setup        the course's grade scale, weighted categories, dropped
                  scores, a minimum score, the late penalty, special marks of
                  their own, and grading periods
     Entry        what a teacher types in a cell, read as what they meant:
                  points, 85%, B+, 25+2, 40-5%, INC
     A column     its distribution with mean and median, a curve, filling
                  the blanks
     A student    what-if, what each piece did to the grade, a grade set by
                  hand
     Marking      a rubric's subtotals, stock comments in two clicks, a
                  sticker, names hidden
     Standards    the course's own objectives, and who has mastered which
     Seating      a chart to drag students round, shuffle, and mark from
     Plans        lesson plans, on a calendar
     Announce     one message to a course

   Every grade is still computed by the server (api/src/services/grades.js).
   Nothing here adds up a column: the setup page writes the course's rules,
   and the server applies them — for the teacher, the student and the family
   alike. What is kept that is not a grade (a chart, a plan, the comments) is
   a course document: /api/v1/courses/:id/docs.

   Mounted by app.js, which hands over its console kit — the same table,
   sheet, chart and field pieces every other console page is built from:
   OPLO_TEACH(kit) → the pages and helpers below.
   ========================================================================== */
window.OPLO_TEACH = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, toast = K.toast;
  var PASS = K.CX_PASS;

  /* ------------------------------------------------------------ Documents */
  function docs(courseId, kind) { return API.courses.docs(courseId, kind); }
  function oneDoc(courseId, kind, id) {
    return docs(courseId, kind).then(function (list) {
      var hit = list.filter(function (d) { return d.id === id; })[0];
      return hit ? hit.body : null;
    });
  }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function round2(n) { return Math.round(n * 100) / 100; }
  // A mark as a cell shows it.
  function markText(g) {
    return !g ? "" : g.mark || (g.status === "missing" ? "M" : g.status === "excused" ? "Ex" : g.score == null ? "" : String(g.score));
  }
  function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  /* ------------------------------------------------------- A rows editor
     A short list a teacher edits in place — the steps of a scale, the
     requirements of a rubric, their objectives. Columns are fixed; rows are
     added and removed. `value()` returns the rows that have anything in them. */
  function rowsEditor(cols, rows, addLabel) {
    var box = el("div", "tx-rows");
    box.style.setProperty("--cols", cols.map(function (c) { return c.w || "1fr"; }).join(" ") + " 28px");
    var head = el("div", "tx-row head");
    cols.forEach(function (c) { head.appendChild(el("span", null, esc(c.label))); });
    head.appendChild(el("span"));
    box.appendChild(head);
    var list = el("div");
    box.appendChild(list);
    function add(r) {
      var row = el("div", "tx-row");
      cols.forEach(function (c) {
        var i;
        if (c.options) {
          i = el("select");
          c.options.forEach(function (o) {
            var op = el("option"); op.value = o[0]; op.textContent = o[1];
            if (r && String(r[c.k]) === String(o[0])) op.selected = true;
            i.appendChild(op);
          });
        } else {
          i = el("input");
          i.type = c.type || "text";
          if (c.type === "number") { i.inputMode = "decimal"; i.step = "any"; }
          if (c.ph) i.placeholder = c.ph;
          i.value = r && r[c.k] != null ? r[c.k] : "";
        }
        i.dataset.k = c.k;
        i.setAttribute("aria-label", c.label);
        row.appendChild(i);
      });
      var rm = el("button", "tx-rm", "×");
      rm.type = "button";
      rm.setAttribute("aria-label", "Remove this row");
      rm.addEventListener("click", function () { row.remove(); });
      row.appendChild(rm);
      list.appendChild(row);
      return row;
    }
    (rows || []).forEach(add);
    // Not a .cn-btn: inside a sheet, pressing one of those closes the sheet.
    var more = el("button", "tx-add", "+ " + esc(addLabel || "Add a row"));
    more.type = "button";
    more.addEventListener("click", function () { var r = add(null); r.querySelector("input, select").focus(); });
    box.appendChild(more);
    box.value = function () {
      return [].map.call(list.children, function (row) {
        var o = {};
        [].forEach.call(row.querySelectorAll("[data-k]"), function (i) { o[i.dataset.k] = i.value.trim(); });
        return o;
      }).filter(function (o) { return cols.some(function (c) { return !c.options && o[c.k] !== ""; }); });
    };
    box.fill = function (next) { list.innerHTML = ""; next.forEach(add); };
    return box;
  }

  /* ================================================================ Scales
     The scale a course marks on. The server holds the same default; a course
     that keeps it stores nothing. */
  var DEFAULT_SCALE = [[93, "A"], [90, "A-"], [87, "B+"], [83, "B"], [80, "B-"], [77, "C+"],
                       [73, "C"], [70, "C-"], [67, "D+"], [63, "D"], [60, "D-"], [0, "F"]];
  var SCALES = [
    ["plus", "Letters with + and −", DEFAULT_SCALE],
    ["letters", "Letters, A to F", [[90, "A"], [80, "B"], [70, "C"], [60, "D"], [0, "F"]]],
    ["four", "4 · 3 · 2 · 1", [[90, "4"], [75, "3"], [60, "2"], [0, "1"]]],
    ["esn", "E · S · N", [[85, "E"], [65, "S"], [0, "N"]]],
    ["pass", "Pass and fail", [[60, "Pass"], [0, "Fail"]]]
  ];
  function scaleOf(policy) { return policy && policy.scale && policy.scale.length ? policy.scale : DEFAULT_SCALE; }
  function letterFor(pct, scale) {
    for (var i = 0; i < scale.length; i++) if (pct >= scale[i][0]) return scale[i][1];
    return scale[scale.length - 1][1];
  }

  /* ================================================================= Entry
     What a teacher typed in a cell, read as what they meant. Returns the
     write to make — { status, score, late, mark, as } — or null when it is
     none of these, because a typo is not a grade.

       18          points
       18l         points, handed in late
       85%         85% of what it is out of
       B+          the middle of that mark's band on the course's scale
       25+2  40-5% a score with an adjustment: extra credit, or a penalty
                   (a percent is of what the work is out of)
       m  e        not handed in; excused
       INC  ABS    one of the course's own special marks
       (empty)     not marked yet                                          */
  function readEntry(raw, outOf, policy) {
    var t = String(raw == null ? "" : raw).trim();
    var low = t.toLowerCase();
    if (!t || t === "-" || t === "—") return { status: "marked", score: null, late: false, mark: null };
    if (low === "m" || low === "missing") return { status: "missing", score: null, late: false, mark: null };
    if (low === "e" || low === "ex" || low === "excused") return { status: "excused", score: null, late: false, mark: null };

    var marks = (policy && policy.marks) || [];
    for (var i = 0; i < marks.length; i++) {
      if (String(marks[i].code).toLowerCase() !== low) continue;
      var as = marks[i].as;
      if (as === "excused") return { status: "excused", score: null, late: false, mark: marks[i].code };
      if (as === "zero" || as == null) return { status: "missing", score: null, late: false, mark: marks[i].code };
      return { status: "marked", score: round2(outOf * Number(as) / 100), late: false, mark: marks[i].code };
    }

    var late = false;
    if (/\d\s*l$/.test(low)) { late = true; t = t.slice(0, -1).trim(); low = t.toLowerCase(); }

    var n = Number(t);
    if (isFinite(n) && n >= 0) return { status: "marked", score: n, late: late, mark: null };

    var m = /^(\d+(?:\.\d+)?)\s*%$/.exec(t);
    if (m) return { status: "marked", score: round2(outOf * Number(m[1]) / 100), late: late, mark: null, as: t };

    m = /^(\d+(?:\.\d+)?)\s*([+-])\s*(\d+(?:\.\d+)?)\s*(%?)$/.exec(t);
    if (m) {
      var by = m[4] ? outOf * Number(m[3]) / 100 : Number(m[3]);
      var got = Number(m[1]) + (m[2] === "+" ? by : -by);
      return { status: "marked", score: Math.max(0, round2(got)), late: late, mark: null, as: t.replace(/\s+/g, "") };
    }

    var scale = scaleOf(policy);
    for (var k = 0; k < scale.length; k++) {
      if (String(scale[k][1]).toLowerCase() !== low) continue;
      var top = k === 0 ? 100 : scale[k - 1][0];
      return { status: "marked", score: round2(outOf * ((scale[k][0] + top) / 2) / 100), late: late, mark: null, as: scale[k][1] };
    }
    return null;
  }

  /* ================================================================= Setup
     The course's rules, on one page. Saved into the course itself, where the
     server reads them — so the grade a student sees follows them from the
     next request, with nothing to recalculate. */
  function gbSetup(host, row) {
    var node = K.loading(host, "the course's rules");
    API.courses.get(row.id).then(function (course) {
      node.remove();
      var body = course.body || {};
      host.appendChild(el("p", "cn-sub", "How " + esc(course.title) + " is graded. These are the course’s rules: the server applies them to every grade, " +
        "for you, your students and their families alike."));
      var grid = el("div", "cx-grid");
      host.appendChild(grid);

      // ---- Scale
      var sc = K.cxSection(grid, "cx-s6", "Grade scale", "The mark a percent earns");
      var cur = body.scale && body.scale.length ? body.scale : DEFAULT_SCALE;
      var pick = el("select", "tx-select");
      var op0 = el("option"); op0.value = ""; op0.textContent = "Start from…"; pick.appendChild(op0);
      SCALES.forEach(function (s) { var op = el("option"); op.value = s[0]; op.textContent = s[1]; pick.appendChild(op); });
      sc.appendChild(pick);
      var scaleEd = rowsEditor([{ k: "mark", label: "Mark", w: "1fr", ph: "A" }, { k: "from", label: "From %", w: "90px", type: "number", ph: "93" }],
        cur.map(function (s) { return { mark: s[1], from: s[0] }; }), "Add a mark");
      sc.appendChild(scaleEd);
      pick.addEventListener("change", function () {
        var hit = SCALES.filter(function (s) { return s[0] === pick.value; })[0];
        if (hit) scaleEd.fill(hit[2].map(function (s) { return { mark: s[1], from: s[0] }; }));
        pick.value = "";
      });
      sc.appendChild(el("p", "cx-note", "Any marks you like, with or without letters. The lowest one catches everything beneath it."));

      // ---- Categories
      var ct = K.cxSection(grid, "cx-s6", "Categories", "What each kind of work is worth");
      var drop = body.drop || {};
      var catEd = rowsEditor([{ k: "name", label: "Category", w: "1fr", ph: "Homework" }, { k: "weight", label: "% of grade", w: "90px", type: "number", ph: "30" },
                              { k: "drop", label: "Drop lowest", w: "90px", type: "number", ph: "0" }],
        (body.grading || [["Work", 100]]).map(function (g) { return { name: g[0], weight: g[1], drop: drop[g[0]] || "" }; }), "Add a category");
      ct.appendChild(catEd);
      ct.appendChild(el("p", "cx-note", "The weights add to 100. A category with nothing marked yet is left out of a grade rather than counted as zero. " +
        "Drop lowest leaves a student’s worst marks in that category out — never their last one."));

      // ---- Rules
      var ru = K.cxSection(grid, "cx-s6", "Rules", "Applied to every mark");
      var least = K.field("Minimum score, %", body.minScore ? String(body.minScore) : "", "none");
      least.input.inputMode = "decimal";
      var late = K.field("Late penalty, % of the work", body.latePenalty ? String(body.latePenalty) : "", "none");
      late.input.inputMode = "decimal";
      ru.appendChild(least);
      ru.appendChild(el("p", "cx-note", "With a minimum of 50, nothing counts for less than half marks — work not handed in included — so one bad day can be recovered from."));
      ru.appendChild(late);
      ru.appendChild(el("p", "cx-note", "Taken off a mark you flag as late (type 18l). The student sees what they earned and what it cost."));

      // ---- Special marks
      var mk = K.cxSection(grid, "cx-s6", "Special marks", "Type the code in a cell");
      var marksEd = rowsEditor([{ k: "code", label: "Code", w: "80px", ph: "INC" }, { k: "name", label: "Means", w: "1fr", ph: "Incomplete" },
                                { k: "kind", label: "Counts as", w: "130px", options: [["zero", "Zero"], ["excused", "Left out"], ["percent", "A percent"]] },
                                { k: "pct", label: "%", w: "60px", type: "number", ph: "" }],
        (body.marks || []).map(function (m) {
          var pct = m.as !== "zero" && m.as !== "excused";
          return { code: m.code, name: m.name || "", kind: pct ? "percent" : m.as, pct: pct ? m.as : "" };
        }), "Add a mark");
      mk.appendChild(marksEd);
      mk.appendChild(el("p", "cx-note", "<b>m</b> (not handed in, a zero) and <b>e</b> (excused, left out) always work. Add your own — INC, ABS, W — and say what each counts as."));

      // ---- Grading periods
      var tm = K.cxSection(grid, "cx-s12", "Grading periods", "Optional — a cumulative grade across terms");
      var termEd = rowsEditor([{ k: "name", label: "Period", w: "1fr", ph: "Quarter 1" }, { k: "from", label: "Starts", w: "170px", type: "date" },
                               { k: "weight", label: "Weight", w: "90px", type: "number", ph: "40" }],
        (body.terms || []).map(function (t) { return { name: t.name, from: ymd(new Date(Number(t.from))), weight: t.weight }; }), "Add a period");
      tm.appendChild(termEd);
      tm.appendChild(el("p", "cx-note", "With two or more periods, each is graded on its own — its own categories and drops — and the course grade is the periods weighted, " +
        "like Quarter 1 40, Quarter 2 40, Final 20. Work belongs to the period its due date falls in. A period with nothing marked is left out."));

      var acts = K.cnActions();
      acts.classList.add("tx-save");
      var save = K.cnAction("Save the rules", function () {
        var scale = scaleEd.value().filter(function (r) { return r.mark && r.from !== "" && isFinite(Number(r.from)); })
          .map(function (r) { return [Number(r.from), r.mark.slice(0, 8)]; }).sort(function (a, b) { return b[0] - a[0]; });
        if (!scale.length) { toast("A scale needs at least one mark."); return; }
        var cats = catEd.value().filter(function (r) { return r.name; });
        var total = cats.reduce(function (a, r) { return a + (Number(r.weight) || 0); }, 0);
        if (!cats.length) { toast("A course needs at least one category."); return; }
        if (Math.abs(total - 100) > 0.5) { toast("The categories add to " + total + "%, not 100%."); return; }
        var drops = {};
        cats.forEach(function (r) { var n = Math.floor(Number(r.drop) || 0); if (n > 0) drops[r.name] = n; });
        var marks = marksEd.value().filter(function (r) { return r.code; }).map(function (r) {
          return { code: r.code.toUpperCase().slice(0, 8), name: r.name, as: r.kind === "percent" ? Math.max(0, Math.min(100, Number(r.pct) || 0)) : r.kind };
        });
        var clash = marks.filter(function (m) { return /^(m|e|ex)$/i.test(m.code) || isFinite(Number(m.code)); })[0];
        if (clash) { toast("“" + clash.code + "” already means something in a cell. Pick another code."); return; }
        var terms = termEd.value().filter(function (r) { return r.name && r.from && Number(r.weight) > 0; }).map(function (r) {
          return { name: r.name, from: new Date(r.from + "T00:00:00").getTime(), weight: Number(r.weight) };
        });
        if (terms.length === 1) { toast("One period is no periods. Add a second, or remove it."); return; }
        var same = JSON.stringify(scale) === JSON.stringify(DEFAULT_SCALE);
        var next = Object.assign({}, body, {
          grading: cats.map(function (r) { return [r.name, Number(r.weight)]; }),
          drop: drops, minScore: Math.max(0, Math.min(100, Number(least.input.value) || 0)),
          latePenalty: Math.max(0, Math.min(100, Number(late.input.value) || 0)),
          scale: same ? null : scale, marks: marks, terms: terms
        });
        save.disabled = true;
        API.courses.update(course.id, { body: next }).then(function () {
          K.invalidate();
          toast("Saved. Every grade in " + course.title + " now follows these rules.");
          K.openAdmin(true, "roster");
        }, function (e) { save.disabled = false; toast((e && e.message) || "The server refused that."); });
      }, true);
      acts.appendChild(save);
      host.appendChild(acts);
    }, function (e) { K.failed(node, e, function () { host.innerHTML = ""; gbSetup(host, row); }); });
  }

  /* ============================================================== A column
     What the sheet's column inspector offers beyond one bulk action. `book`
     is the gradebook payload the sheet was drawn from. */
  function columnMarks(book, a) {
    var who = a.details && a.details.assignees;
    return book.students.filter(function (s) { return !who || who.indexOf(s.id) > -1; }).map(function (s) {
      var g = book.grades.filter(function (x) { return x.assignmentId === a.id && x.accountId === s.id; })[0];
      return { s: s, g: g || null };
    });
  }
  function median(list) {
    var a = list.slice().sort(function (x, y) { return x - y; }), h = Math.floor(a.length / 2);
    return !a.length ? null : a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2;
  }

  /* Who got what, on one piece of work: a bar for each mark on the course's
     scale, and the middle of the class two ways. */
  function distribution(book, a) {
    var rows = columnMarks(book, a), scale = scaleOf(book.course.policy);
    var pcts = rows.filter(function (r) { return r.g && r.g.status === "marked" && r.g.score != null; })
      .map(function (r) { return r.g.score / a.outOf * 100; });
    var box = el("div", "as-sheet");
    box.appendChild(el("p", "cn-eyebrow", esc(book.course.title)));
    box.appendChild(el("h2", "as-h", esc(a.title)));
    if (!pcts.length) { box.appendChild(el("p", "cx-note", "Nothing is marked on this yet.")); K.cxSheet(box); return; }
    var mean = pcts.reduce(function (x, y) { return x + y; }, 0) / pcts.length;
    K.cxMetrics(box, [
      { label: "Mean", value: Math.round(mean), unit: "%" },
      { label: "Median", value: Math.round(median(pcts)), unit: "%" },
      { label: "Highest", value: Math.round(Math.max.apply(null, pcts)), unit: "%" },
      { label: "Lowest", value: Math.round(Math.min.apply(null, pcts)), unit: "%" }
    ]);
    var count = {};
    pcts.forEach(function (p) { var m = letterFor(Math.round(p), scale); count[m] = (count[m] || 0) + 1; });
    box.appendChild(K.barChart(scale.map(function (s) {
      return { label: s[1], n: count[s[1]] || 0, color: s[0] < PASS && s === scale[scale.length - 1] ? "var(--cx-red)" : "var(--cx-bar)" };
    }), { values: true }));
    var miss = rows.filter(function (r) { return r.g && r.g.status === "missing"; }).length;
    var blank = rows.filter(function (r) { return !r.g || (r.g.status === "marked" && r.g.score == null); }).length;
    box.appendChild(el("p", "cx-note", K.cxPlural(pcts.length, "mark") + " · " + miss + " not handed in · " + blank + " not marked yet. " +
      "The mean and median are over the marks given; work not handed in is not a mark."));
    K.cxSheet(box);
  }

  /* Many marks, in chunks the server accepts, then the sheet re-read. */
  function writeMany(entries, done) {
    var written = 0, refused = [];
    function next() {
      var part = entries.splice(0, 150);
      if (!part.length) { done(written, refused); return; }
      API.grades.batch(part).then(function (r) {
        written += (r.grades || []).length;
        refused = refused.concat(r.refused || []);
        next();
      }, function (e) { toast((e && e.message) || "The server refused that."); done(written, refused); });
    }
    next();
  }

  /* A curve: every mark on one piece of work moved by the same rule. It is
     written as ordinary marks, each with a note saying which curve, so every
     one of them is in the history and can be put back. */
  function curve(book, a, redraw) {
    var rows = columnMarks(book, a).filter(function (r) { return r.g && r.g.status === "marked" && r.g.score != null; });
    var box = el("div", "as-sheet");
    box.appendChild(el("p", "cn-eyebrow", "Curve"));
    box.appendChild(el("h2", "as-h", esc(a.title)));
    if (!rows.length) { box.appendChild(el("p", "cx-note", "There are no marks on this to curve.")); K.cxSheet(box); return; }
    var top = Math.max.apply(null, rows.map(function (r) { return r.g.score; }));
    var kind = "add";
    var seg = el("div", "cn-seg");
    var KINDS = [["add", "Add points"], ["top", "Top score becomes full marks"], ["root", "Square-root curve"]];
    var pts = K.field("Points to add to every mark", String(Math.max(1, Math.round(a.outOf * 0.05))));
    pts.input.inputMode = "decimal";
    var cap = el("label", "tx-check");
    cap.innerHTML = '<input type="checkbox" checked> <span>Never above full marks (' + K.cxNum(a.outOf) + ")</span>";
    var say = el("p", "cx-note");
    function moved(score) {
      var n = kind === "add" ? score + (Number(pts.input.value) || 0)
        : kind === "top" ? (top > 0 ? score * a.outOf / top : score)
        : Math.sqrt(score / a.outOf) * a.outOf;
      if (cap.firstChild.checked) n = Math.min(n, a.outOf);
      return Math.max(0, round2(n));
    }
    function mean(f) { return Math.round(rows.reduce(function (x, r) { return x + f(r.g.score); }, 0) / rows.length / a.outOf * 100); }
    function redrawSay() {
      pts.hidden = kind !== "add";
      say.textContent = K.cxPlural(rows.length, "mark") + ". The mean goes from " + mean(function (s) { return s; }) + "% to " + mean(moved) + "%." +
        (kind === "root" ? " A square-root curve lifts low marks most: 49% becomes 70%, 81% becomes 90%." : "") +
        (kind === "top" ? " The top mark is " + K.cxNum(top) + " of " + K.cxNum(a.outOf) + "." : "");
    }
    KINDS.forEach(function (k) {
      var b = el("button", "cn-segb" + (k[0] === kind ? " on" : ""), k[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        kind = k[0];
        [].forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); });
        redrawSay();
      });
      seg.appendChild(b);
    });
    pts.input.addEventListener("input", redrawSay);
    cap.firstChild.addEventListener("change", redrawSay);
    box.appendChild(seg);
    box.appendChild(pts);
    box.appendChild(cap);
    box.appendChild(say);
    box.appendChild(el("p", "cx-note", "Each mark is changed and the change is recorded, so Grade History shows the mark before the curve and Undo puts it back."));
    var acts = K.cnActions();
    var sheet;
    var go = el("button", "lx-btn lg", "Curve these marks");
    go.type = "button";
    go.addEventListener("click", function () {
      var note = "Curve: " + (kind === "add" ? "+" + (Number(pts.input.value) || 0) + " points" : kind === "top" ? "top score to full marks" : "square root");
      var entries = rows.map(function (r) { return { assignmentId: a.id, accountId: r.s.id, score: moved(r.g.score), status: "marked", note: note }; })
        .filter(function (e, i) { return e.score !== rows[i].g.score; });
      if (!entries.length) { toast("That curve changes nothing."); return; }
      go.disabled = true;
      writeMany(entries, function (n, refused) {
        toast(n + (n === 1 ? " mark" : " marks") + " curved." + (refused.length ? " " + refused.length + " refused: " + refused[0].message : ""));
        sheet.close();
        redraw();
      });
    });
    acts.appendChild(go);
    box.appendChild(acts);
    sheet = K.cxSheet(box);
    redrawSay();
  }

  /* Every blank on one piece of work, given the same thing. */
  function fillBlanks(book, a, redraw) {
    var blanks = columnMarks(book, a).filter(function (r) { return !r.g || (r.g.status === "marked" && r.g.score == null); });
    if (!blanks.length) { toast("Nothing on this is blank."); return; }
    var raw = prompt("Give the " + blanks.length + " unmarked " + (blanks.length === 1 ? "student" : "students") + " on “" + a.title +
      "” — a score, a percent like 100%, m for not handed in, or e for excused:", String(a.outOf));
    if (raw == null) return;
    var want = readEntry(raw, a.outOf, book.course.policy);
    if (!want || (want.status === "marked" && want.score == null)) { toast("A score, a percent, m or e."); return; }
    writeMany(blanks.map(function (r) {
      return { assignmentId: a.id, accountId: r.s.id, score: want.score, status: want.status, mark: want.mark, note: "Filled the blanks" };
    }), function (n) { toast(n + " filled."); redraw(); });
  }

  /* The buttons a selected column gets. */
  function columnTools(bar, book, a, redraw) {
    [["Distribution", function () { distribution(book, a); }], ["Curve", function () { curve(book, a, redraw); }],
     ["Fill the blanks", function () { fillBlanks(book, a, redraw); }]].forEach(function (x) {
      var b = el("button", "gb-ibtn", x[0]);
      b.type = "button";
      b.addEventListener("click", x[1]);
      bar.appendChild(b);
    });
  }

  /* ============================================================= A student
     In one course: what would happen if, what each piece of work did to the
     grade, and a grade set by hand. */
  function whatIf(course, st, work, byAssignment, sum) {
    var box = el("div", "as-sheet");
    box.appendChild(el("p", "cn-eyebrow", "What if · " + esc(course.title)));
    box.appendChild(el("h2", "as-h", esc(st.name)));
    var out = el("div", "tx-whatif");
    out.innerHTML = "<span>Now <b>" + (sum && sum.percent != null ? sum.percent + "% " + esc(sum.letter) : "—") + "</b></span><span class='to'>Would be <b>—</b></span>";
    box.appendChild(out);
    box.appendChild(el("p", "cn-sub", "Change any score to see the grade it would give. Nothing here is saved."));
    var list = el("div", "tx-wlist"), inputs = [], timer = null;
    function ask() {
      var changes = [];
      inputs.forEach(function (x) {
        var t = x.i.value.trim(), g = byAssignment[x.a.id];
        var was = g && g.status === "marked" && g.score != null ? String(g.score) : g && g.status === "missing" ? "m" : g && g.status === "excused" ? "e" : "";
        if (t === was) return;
        var want = readEntry(t, x.a.outOf, course.policy);
        if (!want) return;
        changes.push({ assignmentId: x.a.id, score: want.score, status: want.status });
      });
      var to = out.querySelector(".to b");
      if (!changes.length) { to.textContent = "—"; return; }
      API.grades.whatif(course.id, st.id, changes).then(function (r) {
        to.textContent = r.then && r.then.percent != null ? r.then.percent + "% " + r.then.letter : "—";
      }, function (e) { toast((e && e.message) || "Couldn’t work that out."); });
    }
    work.forEach(function (a) {
      var g = byAssignment[a.id], row = el("label", "tx-wrow");
      row.innerHTML = "<span><b>" + esc(a.title) + "</b><small>" + esc(a.category || "") + " · out of " + K.cxNum(a.outOf) + "</small></span>";
      var i = el("input");
      i.type = "text"; i.inputMode = "decimal";
      i.value = g && g.status === "marked" && g.score != null ? String(g.score) : g && g.status === "missing" ? "m" : g && g.status === "excused" ? "e" : "";
      i.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(ask, 350); });
      row.appendChild(i);
      list.appendChild(row);
      inputs.push({ a: a, i: i });
    });
    box.appendChild(list);
    K.cxSheet(box);
  }

  /* A grade set by hand. The computed grade is kept and shown beside it. */
  function overrideSheet(course, st, sum, current, redraw) {
    var ov = current || {};
    var box = el("div", "as-sheet");
    box.appendChild(el("p", "cn-eyebrow", "Override · " + esc(course.title)));
    box.appendChild(el("h2", "as-h", esc(st.name)));
    var computed = sum ? (sum.override ? sum.override.computed : sum.percent) : null;
    box.appendChild(el("p", "cn-sub", "From their marks, the grade is <b>" + (computed != null ? computed + "%" : "not computed yet") +
      "</b>. An override replaces it everywhere a grade is shown — to you, to " + esc(st.firstName || st.name) + " and to their family — and says that it was set by hand."));
    var kind = ov.percent != null ? "percent" : ov.adjust ? "adjust" : ov.mark ? "mark" : "percent";
    var seg = el("div", "cn-seg");
    var pct = K.field("Grade, %", ov.percent != null ? String(ov.percent) : "", "85");
    var adj = K.field("Raise or lower by, points", ov.adjust ? String(ov.adjust) : "", "+3 or -5");
    var mark = K.field("Mark instead of a letter", ov.mark || "", "INC, W, P …");
    var why = K.field("Why (kept with the override)", ov.reason || "", "optional");
    function showKind() { pct.hidden = kind !== "percent"; adj.hidden = kind !== "adjust"; }
    [["percent", "Set the percent"], ["adjust", "Raise or lower"], ["mark", "A mark only"]].forEach(function (k) {
      var b = el("button", "cn-segb" + (k[0] === kind ? " on" : ""), k[1]);
      b.type = "button";
      b.addEventListener("click", function () { kind = k[0]; [].forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); }); showKind(); });
      seg.appendChild(b);
    });
    [seg, pct, adj, mark, why].forEach(function (n) { box.appendChild(n); });
    box.appendChild(el("p", "cx-note", "A mark — INC, W — shows in place of the letter. With Set the percent or Raise or lower it can be left empty."));
    showKind();
    var acts = K.cnActions(), sheet;
    var go = el("button", "lx-btn lg", "Save the override");
    go.type = "button";
    go.addEventListener("click", function () {
      var body = { mark: mark.input.value.trim() || null, reason: why.input.value.trim() || null };
      if (kind === "percent" && pct.input.value.trim() !== "") body.percent = Number(pct.input.value);
      if (kind === "adjust") body.adjust = Number(adj.input.value) || 0;
      if (body.percent == null && !body.adjust && !body.mark) { toast("Set a percent, a raise or lowering, or a mark."); return; }
      if (body.percent != null && !isFinite(body.percent)) { toast("A percent is a number."); return; }
      if (computed == null && body.percent == null) { toast("Nothing is marked yet, so set a percent for the mark to stand on."); return; }
      K.attempt(API.courses.putDoc(course.id, "override", st.id, body), function () { K.invalidate(); toast("Override saved."); sheet.close(); redraw(); });
    });
    acts.appendChild(go);
    if (current) {
      var rm = el("button", "lx-btn quiet danger", "Remove the override");
      rm.type = "button";
      rm.addEventListener("click", function () {
        K.attempt(API.courses.removeDoc(course.id, "override", st.id), function () { K.invalidate(); toast("Back to the computed grade."); sheet.close(); redraw(); });
      });
      acts.appendChild(rm);
    }
    box.appendChild(acts);
    sheet = K.cxSheet(box);
  }

  /* What each piece of work did to the grade: bars either side of nothing. */
  function impactChart(host, course, st) {
    var sec = el("section", "tx-impact");
    sec.appendChild(el("h3", null, "What each piece did to the grade"));
    var note = el("p", "cx-note", "Working it out…");
    sec.appendChild(note);
    host.appendChild(sec);
    API.grades.whatif(course.id, st.id, [], true).then(function (r) {
      var rows = (r.impact || []).filter(function (x) { return x.delta != null; });
      if (!rows.length) { note.textContent = "A grade needs two marks before one of them can be weighed against it."; return; }
      note.textContent = "Each bar is the grade as it stands, less the grade without that piece: to the right it raised the grade, to the left it lowered it.";
      var max = Math.max(1, Math.max.apply(null, rows.map(function (x) { return Math.abs(x.delta); })));
      rows.sort(function (a, b) { return a.delta - b.delta; }).forEach(function (x) {
        var w = Math.abs(x.delta) / max * 50, row = el("div", "tx-irow");
        row.innerHTML = "<span class='t'>" + esc(x.title) + "</span><span class='bar'><i class='" + (x.delta < 0 ? "neg" : "pos") + "' style='width:" + w.toFixed(1) +
          "%;" + (x.delta < 0 ? "right:50%" : "left:50%") + "'></i></span><b class='" + (x.delta < 0 ? "bad" : "") + "'>" + (x.delta > 0 ? "+" : "") + x.delta + "</b>";
        sec.appendChild(row);
      });
    }, function () { note.textContent = "Couldn’t work out the impact."; });
  }

  /* The tools row and the impact chart on a student's page in a course.
     `course` carries the gradebook's policy; `sum` is the server's summary. */
  function studentTools(host, course, st, work, byAssignment, sum, redraw) {
    var acts = K.cnActions();
    acts.classList.add("tx-stools");
    acts.appendChild(K.cnAction("What if…", function () { whatIf(course, st, work, byAssignment, sum); }));
    var ovb = K.cnAction(sum && sum.override ? "Change the override" : "Override the grade", function () {
      oneDoc(course.id, "override", st.id).then(function (cur) { overrideSheet(course, st, sum, cur, redraw); },
        function () { overrideSheet(course, st, sum, null, redraw); });
    });
    acts.appendChild(ovb);
    host.appendChild(acts);
    if (sum && sum.override) {
      var o = sum.override;
      host.appendChild(el("p", "tx-ovnote", "Set by hand" + (o.percent != null ? " to " + o.percent + "%" : o.adjust ? ": " + (o.adjust > 0 ? "raised " : "lowered ") + Math.abs(o.adjust) + " points" : "") +
        (o.mark ? " · shown as " + esc(o.mark) : "") + ". From their marks it is " + (o.computed != null ? o.computed + "%" : "not computed yet") + "." +
        (o.reason ? " “" + esc(o.reason) + "”" : "")));
    }
    if (sum && sum.terms) {
      var t = K.cnTable([{ label: "Grading period", w: "minmax(160px, 1.4fr)" }, { label: "Weight", w: "90px", align: "right" }, { label: "Grade", w: "110px", align: "right" }]);
      sum.terms.forEach(function (x) { t.row([esc(x.name), String(x.weight), x.percent == null ? K.cxNone("Nothing marked") : "<b class='cn-mk'>" + esc(x.letter) + "</b> " + x.percent + "%"]); });
      host.appendChild(t);
    }
    impactChart(host, course, st);
  }

  /* ================================================================ Marking
     What the grading panel gets for one student's piece of work: a rubric's
     subtotals, the teacher's stock comments, a sticker. */
  var STICKERS = window.OPLO_TEACH.STICKERS, stickerChar = window.OPLO_TEACH.sticker;
  var DEFAULT_BANK = ["Great work.", "Show your working.", "Check your arithmetic.", "Explain your reasoning.", "See me about this.", "Much improved."];
  var BANK = {};      // courseId → [comments], read once
  function bankFor(courseId) {
    if (BANK[courseId]) return Promise.resolve(BANK[courseId]);
    return oneDoc(courseId, "bank", "comments").then(function (b) {
      return (BANK[courseId] = b && Array.isArray(b.items) && b.items.length ? b.items : DEFAULT_BANK.slice());
    }, function () { return DEFAULT_BANK.slice(); });
  }
  function editBank(courseId, done) {
    bankFor(courseId).then(function (items) {
      var box = el("div", "as-sheet");
      box.appendChild(el("p", "cn-eyebrow", "Marking"));
      box.appendChild(el("h2", "as-h", "Comment shortcuts"));
      box.appendChild(el("p", "cn-sub", "The comments you write most. In Grading, one click puts one in. Shared with anyone else who teaches this course."));
      var ed = rowsEditor([{ k: "text", label: "Comment", w: "1fr", ph: "Show your working." }], items.map(function (t) { return { text: t }; }), "Add a comment");
      box.appendChild(ed);
      var acts = K.cnActions(), sheet;
      var go = el("button", "lx-btn lg", "Save");
      go.type = "button";
      go.addEventListener("click", function () {
        var next = ed.value().map(function (r) { return r.text.slice(0, 300); }).slice(0, 60);
        K.attempt(API.courses.putDoc(courseId, "bank", "comments", { items: next }), function () { BANK[courseId] = next.length ? next : DEFAULT_BANK.slice(); sheet.close(); if (done) done(); });
      });
      acts.appendChild(go);
      box.appendChild(acts);
      sheet = K.cxSheet(box);
    });
  }

  /* o: { course, work, grade, score (input), comment (textarea) }.
     Returns { node, detail() } — detail() is what to save with the mark. */
  function gradingExtras(o) {
    var node = el("div", "tx-extras");
    var had = (o.grade && o.grade.detail) || {};
    var rubric = o.work.details && o.work.details.rubric, cells = [];
    if (rubric) {
      var rb = el("div", "tx-rubric");
      rb.appendChild(el("p", "k", "Rubric"));
      rubric.forEach(function (r, i) {
        var row = el("label", "tx-rrow");
        row.innerHTML = "<span>" + esc(r.name) + "</span>";
        var inp = el("input");
        inp.type = "text"; inp.inputMode = "decimal";
        inp.value = had.rubric && had.rubric[i] != null ? String(had.rubric[i]) : "";
        inp.setAttribute("aria-label", r.name + ", out of " + r.points);
        inp.addEventListener("input", function () {
          var any = cells.some(function (c) { return c.value.trim() !== ""; });
          if (any) o.score.value = String(round2(cells.reduce(function (a, c) { return a + (Number(c.value) || 0); }, 0)));
        });
        row.appendChild(inp);
        row.appendChild(el("small", null, "/ " + K.cxNum(r.points)));
        rb.appendChild(row);
        cells.push(inp);
      });
      node.appendChild(rb);
    }

    var chips = el("div", "tx-bank");
    node.appendChild(chips);
    function drawBank() {
      bankFor(o.course.id).then(function (items) {
        chips.innerHTML = "";
        items.forEach(function (t) {
          var b = el("button", "tx-chip", esc(t));
          b.type = "button";
          b.addEventListener("click", function () {
            var v = o.comment.value;
            o.comment.value = v ? v.replace(/\s*$/, " ") + t : t;
            o.comment.focus();
          });
          chips.appendChild(b);
        });
        var ed = el("button", "tx-chip edit", "Edit…");
        ed.type = "button";
        ed.addEventListener("click", function () { editBank(o.course.id, drawBank); });
        chips.appendChild(ed);
      });
    }
    drawBank();

    var sticker = had.sticker || null;
    var st = el("div", "tx-stickers");
    st.setAttribute("role", "group");
    st.setAttribute("aria-label", "Sticker");
    STICKERS.forEach(function (s) {
      var b = el("button", "tx-sticker" + (sticker === s[0] ? " on" : ""), s[1]);
      b.type = "button";
      b.setAttribute("aria-label", s[0]);
      b.setAttribute("aria-pressed", String(sticker === s[0]));
      b.addEventListener("click", function () {
        sticker = sticker === s[0] ? null : s[0];
        [].forEach.call(st.children, function (x) { var on = x === b && !!sticker; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
      });
      st.appendChild(b);
    });
    node.appendChild(st);

    return {
      node: node,
      detail: function () {
        var d = {};
        if (cells.some(function (c) { return c.value.trim() !== ""; })) d.rubric = cells.map(function (c) { return c.value.trim() === "" ? null : Number(c.value) || 0; });
        if (sticker) d.sticker = sticker;
        return Object.keys(d).length ? d : null;
      }
    };
  }

  /* The rest of what the assign sheet asks: how it is marked, what it is
     about, which students it is for when it is not for a whole course, and a
     note and link for whoever is doing it. `courses` are the courses it is
     being set in — one piece of work in each. */
  function detailsEditor(courses, details) {
    var d = details || {};
    var node = el("details", "tx-more");
    if (d.rubric || d.standards || d.assignees || d.about || d.link) node.open = true;
    node.innerHTML = "<summary>Rubric, objectives, specific students</summary>";
    var about = K.areaField("Instructions for students", d.about || "", "optional", 2);
    var link = K.field("Link", d.link || "", "https://…");
    node.appendChild(about);
    node.appendChild(link);
    node.appendChild(el("p", "tx-lab", "Rubric — the requirements, and what each is worth. Their points become what the work is out of."));
    var rub = rowsEditor([{ k: "name", label: "Requirement", w: "1fr", ph: "Content" }, { k: "points", label: "Points", w: "80px", type: "number", ph: "10" }],
      d.rubric || [], "Add a requirement");
    node.appendChild(rub);
    var objWrap = el("div"), whoWrap = el("div");
    node.appendChild(objWrap);
    node.appendChild(whoWrap);
    var objs = (d.standards || []).slice(), who = d.assignees ? d.assignees.slice() : null;
    var rosters = {}, turn = 0;        // courseId → its students' ids, once read
    function tick(l, list, id) {
      l.firstChild.checked = list.indexOf(id) > -1;
      l.firstChild.addEventListener("change", function () {
        var at = list.indexOf(id);
        if (l.firstChild.checked && at < 0) list.push(id);
        if (!l.firstChild.checked && at > -1) list.splice(at, 1);
      });
    }
    /* The courses the work is being set in. Their objectives are offered
       together, and their students each under their own course's name. */
    function load(list) {
      var mine = ++turn;                // the latest choice of courses wins
      objWrap.innerHTML = ""; whoWrap.innerHTML = "";
      if (!list.length) return;
      Promise.all(list.map(function (c) { return oneDoc(c.id, "standards", "list").catch(function () { return null; }); })).then(function (all) {
        if (mine !== turn) return;
        var seen = {}, items = [];
        all.forEach(function (b) {
          ((b && b.items) || []).forEach(function (x) { if (!seen[x.code]) { seen[x.code] = 1; items.push(x); } });
        });
        objWrap.appendChild(el("p", "tx-lab", "Objectives this is about"));
        if (!items.length) { objWrap.appendChild(el("p", "cx-note", "No objectives of your own here yet. Add them in Standards.")); return; }
        var box = el("div", "tx-checks");
        items.forEach(function (x) {
          var l = el("label", "tx-check");
          l.innerHTML = '<input type="checkbox"> <span>' + esc(x.code + " — " + x.name) + "</span>";
          tick(l, objs, x.code);
          box.appendChild(l);
        });
        objWrap.appendChild(box);
      });
      Promise.all(list.map(function (c) { return API.courses.members(c.id).catch(function () { return null; }); })).then(function (all) {
        if (mine !== turn) return;
        var groups = [];
        all.forEach(function (ms, i) {
          if (!ms) return;              // that roster didn't load: the work stays for everyone there
          var studs = ms.filter(function (m) { return m.role === "student"; });
          rosters[list[i].id] = studs.map(function (s) { return s.id; });
          groups.push({ c: list[i], studs: studs });
        });
        whoWrap.appendChild(el("p", "tx-lab", "Who it’s for"));
        var some = el("label", "tx-check");
        some.innerHTML = '<input type="checkbox"> <span>Specific students — a makeup, extra credit, independent study, a different task</span>';
        some.firstChild.checked = !!who;
        var slot = el("div");
        function draw() {
          slot.innerHTML = "";
          if (!who) return;
          slot.appendChild(el("p", "cx-note", "Only the students ticked get it. For everyone else it does not exist: not on their page, not owed, not in their grade."));
          groups.forEach(function (g) {
            if (groups.length > 1) slot.appendChild(el("p", "tx-lab", esc(g.c.title)));
            var box = el("div", "tx-checks");
            g.studs.forEach(function (s) {
              var l = el("label", "tx-check");
              l.innerHTML = '<input type="checkbox"> <span>' + esc(s.name) + "</span>";
              tick(l, who, s.id);
              box.appendChild(l);
            });
            slot.appendChild(box);
          });
        }
        some.firstChild.addEventListener("change", function () { who = some.firstChild.checked ? (who || []) : null; draw(); });
        whoWrap.appendChild(some);
        whoWrap.appendChild(slot);
        draw();
      });
    }
    load(courses);
    function inCourse(courseId) {
      var r = rosters[courseId];
      return !who ? null : r ? who.filter(function (id) { return r.indexOf(id) > -1; }) : who.slice();
    }
    return {
      node: node,
      courses: load,
      rubricTotal: function () {
        var r = rub.value().filter(function (x) { return x.name && Number(x.points) > 0; });
        return r.length ? round2(r.reduce(function (a, x) { return a + Number(x.points); }, 0)) : null;
      },
      // Why this can't be saved yet, in words — or nothing.
      problem: function () { return who && !who.length ? "Tick the students it’s for, or untick Specific students." : null; },
      // For specific students, and none of them is in this course: not set here.
      skips: function (courseId) { var mine = inCourse(courseId); return !!mine && !mine.length; },
      // The details as this course's piece of work carries them.
      value: function (courseId) {
        var out = {};
        var r = rub.value().filter(function (x) { return x.name && Number(x.points) > 0; }).map(function (x) { return { name: x.name, points: Number(x.points) }; });
        if (r.length) out.rubric = r;
        if (objs.length) out.standards = objs.slice();
        var mine = inCourse(courseId);
        if (mine && mine.length) out.assignees = mine;
        if (about.input.value.trim()) out.about = about.input.value.trim();
        if (link.input.value.trim()) out.link = link.input.value.trim();
        return Object.keys(out).length ? out : null;
      }
    };
  }

  /* ============================================================== Standards
     The course's objectives — its units on OEdu, and the teacher's own — and
     who has mastered which: every student against every objective, from the
     marks on the work that was about it. */
  var LEVELS = [[90, 4], [75, 3], [60, 2], [0, 1]];
  function levelOf(p) { for (var i = 0; i < LEVELS.length; i++) if (p >= LEVELS[i][0]) return LEVELS[i][1]; return 1; }

  function editObjectives(courseId, items, done) {
    var box = el("div", "as-sheet");
    box.appendChild(el("p", "cn-eyebrow", "Standards"));
    box.appendChild(el("h2", "as-h", "This course’s objectives"));
    box.appendChild(el("p", "cn-sub", "Your own learning objectives, or a standard’s codes. Tick them on a piece of work when you set it, and its marks count towards each."));
    var ed = rowsEditor([{ k: "code", label: "Code", w: "110px", ph: "A-REI.3" }, { k: "name", label: "Objective", w: "1fr", ph: "Solve linear equations in one variable" }], items, "Add an objective");
    box.appendChild(ed);
    var acts = K.cnActions(), sheet;
    var go = el("button", "lx-btn lg", "Save");
    go.type = "button";
    go.addEventListener("click", function () {
      var next = ed.value().filter(function (r) { return r.code; }).map(function (r) { return { code: r.code.slice(0, 40), name: r.name.slice(0, 200) }; }).slice(0, 80);
      K.attempt(API.courses.putDoc(courseId, "standards", "list", { items: next }), function () { sheet.close(); done(); });
    });
    acts.appendChild(go);
    box.appendChild(acts);
    sheet = K.cxSheet(box);
  }

  function mastery(host, c) {
    var gb = c.book, cur = K.curriculumOf(c.raw), units = cur ? K.unitsOf(cur) : [];
    var node = K.loading(host, "the objectives");
    oneDoc(c.id, "standards", "list").then(function (b) { return (b && b.items) || []; }, function () { return []; }).then(function (own) {
      node.remove();
      S_VIEW = S_VIEW || "level";
      // Each objective, and the work that is about it.
      var objs = own.map(function (o) {
        return { key: o.code, name: o.name, work: (gb.assignments || []).filter(function (a) { return a.details && a.details.standards && a.details.standards.indexOf(o.code) > -1; }) };
      });
      units.forEach(function (u) {
        var work = (gb.assignments || []).filter(function (a) { return a.activity && a.activity.unit === u.n; });
        if (work.length) objs.push({ key: "Unit " + u.n, name: u.t, work: work });
      });
      var top = el("div", "tx-bar");
      var seg = el("div", "cn-seg");
      [["level", "4 · 3 · 2 · 1"], ["pct", "Percent"]].forEach(function (x) {
        var bt = el("button", "cn-segb" + (S_VIEW === x[0] ? " on" : ""), x[1]);
        bt.type = "button";
        bt.addEventListener("click", function () { S_VIEW = x[0]; host.innerHTML = ""; mastery(host, c); });
        seg.appendChild(bt);
      });
      top.appendChild(seg);
      top.appendChild(K.cnAction("Edit objectives", function () { editObjectives(c.id, own, function () { host.innerHTML = ""; mastery(host, c); }); }));
      host.appendChild(top);

      var marked = objs.filter(function (o) { return o.work.length; });
      if (!marked.length) {
        host.appendChild(K.cnEmpty("No work is tied to an objective yet.",
          "Work set on OEdu is tied to its unit. For your own objectives, add them here, then tick them when you set a piece of work."));
      } else {
        var byPair = {};
        (gb.grades || []).forEach(function (g) { byPair[g.assignmentId + ":" + g.accountId] = g; });
        function pctOf(o, sid) {
          var got = 0, of = 0;
          o.work.forEach(function (a) {
            var g = byPair[a.id + ":" + sid];
            if (!g || g.status === "excused") return;
            if (g.status === "missing") { of += a.outOf; return; }
            if (g.score == null) return;
            got += g.score; of += a.outOf;
          });
          return of ? got / of * 100 : null;
        }
        var wrap = el("div", "tx-mwrap"), tbl = el("table", "tx-mastery");
        var h = "<thead><tr><th>Student</th>" + marked.map(function (o) { return "<th title='" + esc(o.name) + "'><b>" + esc(o.key) + "</b><span>" + esc(K.trim(o.name, 22)) + "</span></th>"; }).join("") + "</tr></thead><tbody>";
        var sums = marked.map(function () { return { s: 0, n: 0 }; });
        (gb.students || []).forEach(function (s) {
          h += "<tr><th>" + esc(s.name) + "</th>" + marked.map(function (o, i) {
            var p = pctOf(o, s.id);
            if (p == null) return "<td class='na'>—</td>";
            sums[i].s += p; sums[i].n++;
            var lv = levelOf(p);
            return "<td class='l" + lv + "' title='" + Math.round(p) + "%'>" + (S_VIEW === "level" ? lv : Math.round(p) + "%") + "</td>";
          }).join("") + "</tr>";
        });
        h += "</tbody><tfoot><tr><th>Course average</th>" + sums.map(function (x) {
          if (!x.n) return "<td class='na'>—</td>";
          var p = x.s / x.n, lv = levelOf(p);
          return "<td class='l" + lv + "'>" + (S_VIEW === "level" ? lv : Math.round(p) + "%") + "</td>";
        }).join("") + "</tr></tfoot>";
        tbl.innerHTML = h;
        wrap.appendChild(tbl);
        host.appendChild(wrap);
        host.appendChild(el("p", "cx-note", "4 is 90% or better on the work about an objective, 3 is 75%, 2 is 60%, 1 is below. Work not handed in counts as zero; excused work is left out."));
      }

      // The map: is every objective covered?
      var map = K.cnTable([{ label: "Objective", w: "minmax(220px, 2fr)" }, { label: "Work about it", w: "120px", align: "right" }, { label: "", w: "130px", align: "right" }]);
      var all = own.map(function (o) { return { key: o.code, name: o.name, n: (objs.filter(function (x) { return x.key === o.code; })[0] || { work: [] }).work.length }; })
        .concat(units.map(function (u) { return { key: "Unit " + u.n, name: u.t, unit: u, n: (gb.assignments || []).filter(function (a) { return a.activity && a.activity.unit === u.n; }).length }; }));
      all.forEach(function (o) {
        map.row(["<b>" + esc(o.key) + "</b> <span class='cn-none'>" + esc(o.name) + "</span>", o.n ? String(o.n) : "<span class='cn-mk bad'>None yet</span>", "<span class='cn-none'>Set work ›</span>"],
          function () {
            K.openAssignSheet(o.unit ? { courseId: c.id, act: { kind: "unit", course: cur.id, unit: o.unit.n, title: o.unit.t } } : { courseId: c.id, details: { standards: [o.key] } });
          }, o.key);
      });
      var sec = el("section", "tx-map");
      sec.appendChild(el("h3", null, "Curriculum map"));
      sec.appendChild(el("p", "cn-sub", "Every objective, and how much work covers it."));
      if (all.length) sec.appendChild(map); else sec.appendChild(el("p", "cx-note", "No objectives yet. Edit objectives to add the course’s own."));
      host.appendChild(sec);
    });
  }
  var S_VIEW = null;

  /* ================================================================ Seating
     Where everyone sits. Seats go anywhere — a horseshoe, tables of four —
     because a room is not a grid. Kept with the course, so a co-teacher or a
     substitute sees the same chart. Pick a piece of work and each seat takes
     its mark. */
  function tabSeating(v) {
    var head = el("div", "tr-pagehead");
    v.appendChild(head);
    var node = K.loading(v, "your courses");
    K.teachCourses().then(function (cs) {
      node.remove();
      if (!cs.length) { v.appendChild(K.cnEmpty("You aren’t teaching any courses yet.", "")); return; }
      var cur = K.coursePill(head, cs);
      K.consoleHead(head, null, "Seating");
      var n2 = K.loading(v, "the room");
      Promise.all([API.grades.book(cur.id), oneDoc(cur.id, "seating", "chart").catch(function () { return null; })]).then(function (r) {
        n2.remove();
        var book = r[0], seats = (r[1] && r[1].seats) || {}, studs = book.students || [];
        if (!studs.length) { v.appendChild(K.cnEmpty("Nobody is enrolled yet.", "Enrol students and they appear here to be seated.")); return; }
        var bar = el("div", "tx-bar");
        var sel = el("select", "tx-select");
        var o0 = el("option"); o0.value = ""; o0.textContent = "Mark a piece of work from the seats…"; sel.appendChild(o0);
        (book.assignments || []).forEach(function (a) { var op = el("option"); op.value = a.id; op.textContent = a.title + " — out of " + a.outOf; sel.appendChild(op); });
        bar.appendChild(sel);
        var tools = K.cnActions();
        bar.appendChild(tools);
        v.appendChild(bar);
        var room = el("div", "tx-room");
        room.appendChild(el("span", "tx-front", "Front of the room"));
        v.appendChild(room);
        v.appendChild(el("p", "cx-note", "Drag a student to their seat. The chart is saved as you go, and anyone else who teaches this course sees the same one."));

        var cols = Math.ceil(Math.sqrt(studs.length * 1.6));
        function gridSpot(i) { return [(i % cols + 0.5) / cols, (Math.floor(i / cols) + 0.5) / Math.ceil(studs.length / cols)]; }
        studs.forEach(function (s, i) { if (!seats[s.id]) seats[s.id] = gridSpot(i); });
        var timer = null;
        function saveSoon() {
          clearTimeout(timer);
          timer = setTimeout(function () {
            API.courses.putDoc(cur.id, "seating", "chart", { seats: seats }).catch(function (e) { toast((e && e.message) || "The chart didn’t save."); });
          }, 500);
        }
        function draw() {
          [].slice.call(room.querySelectorAll(".tx-seat")).forEach(function (n) { n.remove(); });
          var a = (book.assignments || []).filter(function (x) { return x.id === sel.value; })[0];
          studs.forEach(function (s) {
            var seat = el("div", "tx-seat" + (a ? " marking" : ""));
            seat.style.left = (seats[s.id][0] * 100) + "%";
            seat.style.top = (seats[s.id][1] * 100) + "%";
            seat.appendChild(K.avatarFor(s));
            seat.appendChild(el("span", "nm", esc(s.firstName || String(s.name).split(" ")[0])));
            if (a) {
              var g = book.grades.filter(function (x) { return x.assignmentId === a.id && x.accountId === s.id; })[0];
              var inp = el("input");
              inp.type = "text"; inp.inputMode = "decimal";
              inp.setAttribute("aria-label", s.name + " · " + a.title);
              inp.value = markText(g);
              inp.addEventListener("change", function () {
                var want = readEntry(inp.value, a.outOf, book.course.policy);
                if (!want) { inp.value = markText(g); toast("A score, a percent, m or e."); return; }
                API.grades.put(a.id, s.id, { score: want.score, status: want.status, late: want.late, mark: want.mark, outOf: a.outOf }).then(function (res) {
                  book.grades = book.grades.filter(function (x) { return !(x.assignmentId === a.id && x.accountId === s.id); }).concat([res.grade]);
                  K.invalidate();
                  inp.value = markText(res.grade);
                  seat.classList.add("ok");
                  setTimeout(function () { seat.classList.remove("ok"); }, 900);
                }, function (e) { toast((e && e.message) || "The server refused that mark."); });
              });
              seat.appendChild(inp);
            }
            // Dragging: the seat follows the pointer, and stays in the room.
            seat.addEventListener("pointerdown", function (e) {
              if (e.target.tagName === "INPUT") return;
              e.preventDefault();
              seat.setPointerCapture(e.pointerId);
              seat.classList.add("drag");
              var box = room.getBoundingClientRect();
              function move(ev) {
                var x = Math.max(0.04, Math.min(0.96, (ev.clientX - box.left) / box.width));
                var y = Math.max(0.08, Math.min(0.94, (ev.clientY - box.top) / box.height));
                seats[s.id] = [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000];
                seat.style.left = (x * 100) + "%"; seat.style.top = (y * 100) + "%";
              }
              function up() {
                seat.removeEventListener("pointermove", move);
                seat.removeEventListener("pointerup", up);
                seat.classList.remove("drag");
                saveSoon();
              }
              seat.addEventListener("pointermove", move);
              seat.addEventListener("pointerup", up);
            });
            room.appendChild(seat);
          });
        }
        sel.addEventListener("change", draw);
        tools.appendChild(K.cnAction("Shuffle", function () {
          // The same seats, different students in them.
          var spots = studs.map(function (s) { return seats[s.id]; });
          for (var i = spots.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = spots[i]; spots[i] = spots[j]; spots[j] = t; }
          studs.forEach(function (s, k) { seats[s.id] = spots[k]; });
          draw(); saveSoon();
        }));
        tools.appendChild(K.cnAction("Rows", function () { studs.forEach(function (s, i) { seats[s.id] = gridSpot(i); }); draw(); saveSoon(); }));
        tools.appendChild(K.cnAction("Print", function () {
          var rows = studs.slice().sort(function (a, b) { return seats[a.id][1] - seats[b.id][1] || seats[a.id][0] - seats[b.id][0]; });
          K.cxPrint("Seating — " + cur.title, "<h1>Seating — " + esc(cur.title) + "</h1><div style='position:relative;height:640px;border:1px solid #ccc;border-radius:8px'>" +
            rows.map(function (s) {
              return "<span style='position:absolute;transform:translate(-50%,-50%);left:" + (seats[s.id][0] * 100) + "%;top:" + (seats[s.id][1] * 100) +
                "%;border:1px solid #999;border-radius:6px;padding:6px 9px;font-size:11px;background:#fff'>" + esc(s.name) + "</span>";
            }).join("") + "</div><p class='sub'>Front of the room is at the top.</p>");
        }));
        draw();
      }, function (e) { K.failed(n2, e, function () { K.openAdmin(true, "seating"); }); });
    }, function (e) { K.failed(node, e, function () { K.openAdmin(true, "seating"); }); });
  }

  /* ============================================================ Lesson plans
     A collection of plans for a course, each on the day it is taught. Kept
     with the course, so whoever else teaches it — or covers it — reads the
     same plan. */
  var P_VIEW = "calendar", P_MONTH = null;
  function planSheet(course, units, plan, done) {
    var p = plan ? plan.body : {};
    var box = el("div", "as-sheet");
    box.appendChild(el("p", "cn-eyebrow", esc(course.title)));
    box.appendChild(el("h2", "as-h", plan ? "Lesson plan" : "New lesson plan"));
    var title = K.field("Title", p.title || "", "Solving two-step equations");
    var date = K.field("Day", p.date || "", "");
    date.input.type = "date";
    var uF = el("label", "admin-field");
    uF.innerHTML = "<span>Unit</span>";
    var uSel = el("select");
    var none = el("option"); none.value = ""; none.textContent = "Not about one unit"; uSel.appendChild(none);
    units.forEach(function (u) { var op = el("option"); op.value = String(u.n); op.textContent = "Unit " + u.n + " — " + u.t; if (p.unit === u.n) op.selected = true; uSel.appendChild(op); });
    uF.appendChild(uSel);
    var goal = K.areaField("Objective", p.goal || "", "What students will be able to do by the end", 2);
    var body = K.areaField("Plan", p.plan || "", "Warm-up, teaching, practice, exit ticket…", 8);
    var need = K.areaField("Materials", p.materials || "", "Handouts, links, what to set up", 2);
    [title, date, uF, goal, body, need].forEach(function (n) { box.appendChild(n); });
    var acts = K.cnActions(), sheet;
    var go = el("button", "lx-btn lg", "Save");
    go.type = "button";
    go.addEventListener("click", function () {
      if (!title.input.value.trim()) { toast("Give the plan a title."); return; }
      var next = { title: title.input.value.trim().slice(0, 160), date: date.input.value || null, unit: Number(uSel.value) || null,
                   goal: goal.input.value.trim(), plan: body.input.value.trim(), materials: need.input.value.trim() };
      K.attempt(API.courses.putDoc(course.id, "plan", plan ? plan.id : newId(), next), function () { sheet.close(); done(); });
    });
    acts.appendChild(go);
    if (plan) {
      var copy = el("button", "lx-btn quiet", "Use again");
      copy.type = "button";
      copy.addEventListener("click", function () {
        K.attempt(API.courses.putDoc(course.id, "plan", newId(), Object.assign({}, p, { date: null, title: p.title })), function () { toast("Copied, with no day yet."); sheet.close(); done(); });
      });
      acts.appendChild(copy);
      var pr = el("button", "lx-btn quiet", "Print");
      pr.type = "button";
      pr.addEventListener("click", function () { printPlans(course, [plan]); });
      acts.appendChild(pr);
      var rm = el("button", "lx-btn quiet danger", "Delete");
      rm.type = "button";
      rm.addEventListener("click", function () {
        if (!confirm("Delete “" + p.title + "”?")) return;
        K.attempt(API.courses.removeDoc(course.id, "plan", plan.id), function () { sheet.close(); done(); });
      });
      acts.appendChild(rm);
    }
    box.appendChild(acts);
    sheet = K.cxSheet(box);
  }
  function printPlans(course, plans) {
    function para(t) { return esc(t || "").replace(/\n/g, "<br>"); }
    K.cxPrint("Lesson plans — " + course.title, plans.map(function (d) {
      var p = d.body;
      return "<h1>" + esc(p.title) + "</h1><p class='sub'>" + esc(course.title + (p.date ? " · " + new Date(p.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : "") +
        (p.unit ? " · Unit " + p.unit : "")) + "</p>" + (p.goal ? "<h2>Objective</h2><p>" + para(p.goal) + "</p>" : "") +
        (p.plan ? "<h2>Plan</h2><p>" + para(p.plan) + "</p>" : "") + (p.materials ? "<h2>Materials</h2><p>" + para(p.materials) + "</p>" : "");
    }).join("<div style='page-break-after:always'></div>"));
  }

  function tabPlans(v) {
    var head = el("div", "tr-pagehead");
    v.appendChild(head);
    var node = K.loading(v, "your courses");
    K.teachCourses().then(function (cs) {
      node.remove();
      if (!cs.length) { v.appendChild(K.cnEmpty("You aren’t teaching any courses yet.", "")); return; }
      var cur = K.coursePill(head, cs);
      K.consoleHead(head, null, "Lesson Plans");
      var curr = K.curriculumOf(cur), units = curr ? K.unitsOf(curr) : [];
      var redo = function () { K.openAdmin(true, "plans"); };
      K.subNav(head, [["calendar", "Calendar"], ["all", "All plans"]], P_VIEW, function (k) { P_VIEW = k; redo(); });
      var tools = el("div", "tx-bar");
      v.appendChild(tools);
      var n2 = K.loading(v, "the plans");
      Promise.all([docs(cur.id, "plan"), API.courses.assignments(cur.id).catch(function () { return []; })]).then(function (r) {
        n2.remove();
        var plans = r[0], work = r[1].filter(function (a) { return a.dueAt && a.status !== "draft"; });
        var acts = K.cnActions();
        acts.appendChild(K.cnAction("New plan", function () { planSheet(cur, units, null, redo); }, true));
        if (P_VIEW === "all") {
          tools.appendChild(el("span"));
          tools.appendChild(acts);
          if (!plans.length) { v.appendChild(K.cnEmpty("No lesson plans yet.", "Write one, put it on a day, and it is here for you — and for anyone covering the course.", "New plan", function () { planSheet(cur, units, null, redo); })); return; }
          var t = K.cnTable([{ label: "Plan", w: "minmax(220px, 2fr)" }, { label: "Day", w: "150px" }, { label: "Unit", w: "90px" }]);
          plans.slice().sort(function (a, b) { return String(b.body.date || "").localeCompare(String(a.body.date || "")); }).forEach(function (d) {
            t.row(["<b>" + esc(d.body.title) + "</b>" + (d.body.goal ? "<span class='cn-none as-kind'>" + esc(K.trim(d.body.goal, 80)) + "</span>" : ""),
                   d.body.date ? esc(new Date(d.body.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })) : K.cxNone("No day yet"),
                   d.body.unit ? "Unit " + d.body.unit : K.cxNone()], function () { planSheet(cur, units, d, redo); }, d.id);
          });
          v.appendChild(t);
          return;
        }
        // A month: each day's plans, and the work due on it.
        var today = new Date();
        P_MONTH = P_MONTH || [today.getFullYear(), today.getMonth()];
        var first = new Date(P_MONTH[0], P_MONTH[1], 1);
        var nav = el("div", "tx-month");
        function step(d) { return function () { var m = new Date(P_MONTH[0], P_MONTH[1] + d, 1); P_MONTH = [m.getFullYear(), m.getMonth()]; redo(); }; }
        nav.appendChild(K.cnAction("‹", step(-1)));
        nav.appendChild(el("b", null, esc(first.toLocaleDateString(undefined, { month: "long", year: "numeric" }))));
        nav.appendChild(K.cnAction("›", step(1)));
        nav.appendChild(K.cnAction("Today", function () { P_MONTH = null; redo(); }));
        tools.appendChild(nav);
        acts.appendChild(K.cnAction("Print this month", function () {
          var key = ymd(first).slice(0, 7);
          var month = plans.filter(function (d) { return String(d.body.date || "").slice(0, 7) === key; }).sort(function (a, b) { return a.body.date.localeCompare(b.body.date); });
          if (!month.length) { toast("No plans this month."); return; }
          printPlans(cur, month);
        }));
        tools.appendChild(acts);
        var cal = el("div", "tx-cal");
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(function (d) { cal.appendChild(el("span", "dow", d)); });
        var lead = (first.getDay() + 6) % 7, days = new Date(P_MONTH[0], P_MONTH[1] + 1, 0).getDate();
        for (var i = 0; i < lead; i++) cal.appendChild(el("span", "pad"));
        for (var d = 1; d <= days; d++) {
          (function (d) {
            var key = ymd(new Date(P_MONTH[0], P_MONTH[1], d));
            var cell = el("div", "day" + (key === ymd(today) ? " today" : ""));
            var num = el("button", "n", String(d));
            num.type = "button";
            num.setAttribute("aria-label", "New plan on " + key);
            num.addEventListener("click", function () { planSheet(cur, units, { id: newId(), body: { date: key } }, redo); });
            cell.appendChild(num);
            plans.filter(function (p) { return p.body.date === key; }).forEach(function (p) {
              var b = el("button", "plan", esc(p.body.title));
              b.type = "button";
              b.addEventListener("click", function () { planSheet(cur, units, p, redo); });
              cell.appendChild(b);
            });
            work.filter(function (a) { return ymd(new Date(Number(a.dueAt))) === key; }).forEach(function (a) {
              cell.appendChild(el("span", "due", "Due: " + esc(a.title)));
            });
            cal.appendChild(cell);
          })(d);
        }
        v.appendChild(cal);
        v.appendChild(el("p", "cx-note", "Press a day’s number to plan it. Work due that day is shown under the plans. Plans belong to the course: a co-teacher or a substitute opens the same ones."));
      }, function (e) { K.failed(n2, e, redo); });
    }, function (e) { K.failed(node, e, function () { K.openAdmin(true, "plans"); }); });
  }

  /* =========================================================== Announcements
     One message to everyone in a course. Students see it at the top of their
     School page from the moment it is posted. */
  function tabAnnouncements(v) {
    var head = el("div", "tr-pagehead");
    v.appendChild(head);
    var node = K.loading(v, "your courses");
    K.teachCourses().then(function (cs) {
      node.remove();
      if (!cs.length) { v.appendChild(K.cnEmpty("You aren’t teaching any courses yet.", "")); return; }
      var cur = K.coursePill(head, cs);
      K.consoleHead(head, null, "Announcements");
      var redo = function () { K.openAdmin(true, "announcements"); };
      var box = el("div", "tx-compose");
      var title = K.field("To everyone in " + cur.title, "", "Quiz on Friday");
      var text = K.areaField("Message", "", "What they need to know", 3);
      box.appendChild(title);
      box.appendChild(text);
      var acts = K.cnActions();
      acts.appendChild(K.cnAction("Post", function () {
        if (!title.input.value.trim()) { toast("Give it a headline."); return; }
        K.attempt(API.courses.putDoc(cur.id, "announce", newId(), { title: title.input.value.trim().slice(0, 160), text: text.input.value.trim().slice(0, 2000), at: Date.now(), by: K.S.me.name }),
          function () { toast("Posted to " + cur.title + "."); redo(); });
      }, true));
      box.appendChild(acts);
      v.appendChild(box);
      var n2 = K.loading(v, "what’s posted");
      docs(cur.id, "announce").then(function (list) {
        n2.remove();
        if (!list.length) { v.appendChild(el("p", "cx-note", "Nothing posted yet. Students see an announcement on their School page as soon as you post it.")); return; }
        var feed = el("div", "tx-feed");
        list.sort(function (a, b) { return (b.body.at || 0) - (a.body.at || 0); }).forEach(function (d) {
          var card = el("article", "tx-post");
          card.innerHTML = "<header><b>" + esc(d.body.title) + "</b><time>" + esc(K.whenName(d.body.at || d.updatedAt)) + "</time></header>" +
            (d.body.text ? "<p>" + esc(d.body.text).replace(/\n/g, "<br>") + "</p>" : "") + "<small>" + esc(d.body.by || "") + "</small>";
          var rm = el("button", "cn-btn small", "Take down");
          rm.type = "button";
          rm.addEventListener("click", function () {
            if (!confirm("Take down “" + d.body.title + "”? Students stop seeing it.")) return;
            K.attempt(API.courses.removeDoc(cur.id, "announce", d.id), redo);
          });
          card.appendChild(rm);
          feed.appendChild(card);
        });
        v.appendChild(feed);
      }, function (e) { K.failed(n2, e, redo); });
    }, function (e) { K.failed(node, e, function () { K.openAdmin(true, "announcements"); }); });
  }

  return {
    readEntry: readEntry, scaleOf: scaleOf, letterFor: letterFor, stickerChar: stickerChar,
    gbSetup: gbSetup, columnTools: columnTools, studentTools: studentTools,
    gradingExtras: gradingExtras, detailsEditor: detailsEditor, mastery: mastery,
    tabs: { seating: tabSeating, plans: tabPlans, announcements: tabAnnouncements }
  };
};

/* The stickers a teacher can put on a mark — here, outside the console's
   tools, because the student's pages show one without ever building those. */
window.OPLO_TEACH.STICKERS = [["star", "⭐"], ["thumbs", "👍"], ["clap", "👏"], ["fire", "🔥"], ["heart", "❤️"],
                              ["rocket", "🚀"], ["trophy", "🏆"], ["hundred", "💯"], ["smile", "😀"], ["think", "🤔"]];
window.OPLO_TEACH.sticker = function (k) {
  "use strict";
  var hit = window.OPLO_TEACH.STICKERS.filter(function (s) { return s[0] === k; })[0];
  return hit ? hit[1] : "";
};
