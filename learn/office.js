/* ==========================================================================
   OEdu — Reports, the office's own.

   The lists a school office reaches for every week and every term: who is on
   the honor roll, who is failing something, how old each grade is, whose
   birthday is this month, where the labels go, who has not come back.

   Every one is computed here, now, from what the platform already holds — the
   gradebooks, the enrollments, the contact cards and the school's records —
   and each says what it counted. Nothing is stored for a report, so it cannot
   be stale and it cannot disagree with the page it came from. Each prints and
   each downloads as a file.

   Mounted by app.js, which hands over its console kit:
   OPLO_OFFICE(kit) → { tab }.
   ========================================================================== */
window.OPLO_OFFICE = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API;
  var PASS = K.CX_PASS;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function day(ymd) {
    if (!ymd) return "";
    var p = String(ymd).split("-");
    return p.length === 3 ? (+p[2]) + " " + MONTHS[+p[1] - 1].slice(0, 3) + " " + p[0] : String(ymd);
  }
  function ageOn(dob, ref) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || "")) return null;
    var a = +ref.slice(0, 4) - +dob.slice(0, 4);
    if (ref.slice(5) < dob.slice(5)) a--;
    return a;
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function factOf(records, section, label) {
    var r = records && records[section];
    var f = r && (r.facts || []).filter(function (x) { return String(x.label).toLowerCase() === label.toLowerCase() && x.value; })[0];
    return f ? f.value : "";
  }
  function byName(a, b) { return String(a.name).localeCompare(String(b.name)); }
  function gradeOrder(g) { var m = /(\d+)/.exec(g || ""); return m ? +m[1] : /pre|nurs|lkg/i.test(g || "") ? -2 : /kinder|ukg/i.test(g || "") ? -1 : 999; }

  /* ----------------------------------------------------------------- Data
     One read of the school, reused for five minutes by every report. */
  var DATA = null, DATA_AT = 0;

  function allEnrollments(year, page, acc) {
    page = page || 1; acc = acc || [];
    return API.enrollment.enrollments({ year: year, size: 100, page: page }).then(function (r) {
      acc = acc.concat(r.items);
      return page * r.size < r.total && page < 30 ? allEnrollments(year, page + 1, acc) : acc;
    });
  }

  function load(tick) {
    if (DATA && Date.now() - DATA_AT < 300000) return Promise.resolve(DATA);
    return API.enrollment.summary(null).then(function (sum) {
      return Promise.all([K.loadSchool(), allEnrollments(sum.currentYear), allEnrollments(prevYear(sum.currentYear)),
                          API.enrollment.list({ year: sum.currentYear, view: "all", size: 100 }).catch(function () { return { items: [] }; })])
        .then(function (r) {
          var school = r[0], cur = r[1], prev = r[2], apps = r[3].items || [];
          var people = {};
          school.students.forEach(function (s) {
            people[s.id] = { id: s.id, name: s.name, email: s.email, s: s, courses: s.courses, standing: s.standing, missing: s.missing };
          });
          cur.forEach(function (e) {
            if (["withdrawn", "transferred"].indexOf(e.state) > -1) return;
            var p = people[e.studentId] || (people[e.studentId] = { id: e.studentId, name: e.name, email: e.email, courses: [], standing: null, missing: 0,
                                                                  s: { id: e.studentId, name: e.name, email: e.email } });
            p.grade = e.grade; p.enrolled = e;
          });
          var list = Object.keys(people).map(function (k) { return people[k]; });
          return K.readFamilies(list.map(function (p) { return p.s; }), tick).then(function (fam) {
            list.forEach(function (p) {
              var f = fam[p.id] || {};
              p.guardians = f.guardians || [];
              var c = f.contact || {};
              p.dob = c.dateOfBirth || ""; p.address = c.mailingAddress || ""; p.phone = c.cellPhone || c.altPhone || "";
              p.records = f.records || {};
              p.gender = factOf(p.records, "student", "Gender");
              p.language = factOf(p.records, "student", "Home language");
              if (!p.grade) p.grade = factOf(p.records, "enrollment", "Grade") || "";
            });
            DATA = { year: sum.currentYear, prevYear: prevYear(sum.currentYear), school: school, people: list, prev: prev, cur: cur, apps: apps };
            DATA_AT = Date.now();
            return DATA;
          });
        });
    });
  }
  function prevYear(y) { return (+y.slice(0, 4) - 1) + "-" + (+y.slice(5) - 1); }

  /* --------------------------------------------------------------- Reports
     Each build() returns { cols, rows, note, chart?, notes? }: columns with a
     label and alignment, rows of plain values (what a CSV holds), and a note
     that says what was counted. */
  var REPORTS = [
    { key: "honor", group: "Academics", name: "Honor roll", about: "Students whose overall average is at or above a mark.",
      params: [{ k: "min", label: "At or above", value: 90, type: "number" }],
      build: function (d, p) {
        var min = +p.min || 90;
        var rows = d.people.filter(function (x) { return x.standing != null && x.standing >= min; })
          .sort(function (a, b) { return b.standing - a.standing || byName(a, b); })
          .map(function (x) { return [x.name, x.grade || "", x.standing, x.courses.length]; });
        return { cols: [["Student"], ["Grade"], ["Average %", 1], ["Courses", 1]], rows: rows,
          note: rows.length + " of " + d.people.filter(function (x) { return x.standing != null; }).length + " students with a mark are at " + min + "% or above." };
      } },
    { key: "low", group: "Academics", name: "Students with low grades", about: "Every course mark below the pass line, with missing work beside it.",
      params: [{ k: "line", label: "Below", value: PASS, type: "number" }],
      build: function (d, p) {
        var line = +p.line || PASS, rows = [];
        d.people.forEach(function (x) {
          x.courses.forEach(function (c) {
            if (c.grade && c.grade.percent < line) rows.push([x.name, x.grade || "", c.title, c.grade.percent, c.grade.letter || "", c.missing || 0]);
          });
        });
        rows.sort(function (a, b) { return a[3] - b[3] || String(a[0]).localeCompare(String(b[0])); });
        var people = {}; rows.forEach(function (r) { people[r[0]] = 1; });
        return { cols: [["Student"], ["Grade"], ["Course"], ["Mark %", 1], ["Letter"], ["Missing", 1]], rows: rows,
          note: rows.length + " course marks below " + line + "%, across " + Object.keys(people).length + " students." };
      } },
    { key: "deficiency", group: "Academics", name: "Deficiency list", about: "Students failing a course or missing work, one row each, ready to send home.",
      params: [{ k: "missing", label: "Missing work at least", value: 2, type: "number" }],
      build: function (d, p) {
        var minMiss = +p.missing || 2;
        var rows = d.people.map(function (x) {
          var fails = x.courses.filter(function (c) { return c.grade && c.grade.percent < PASS; });
          return { x: x, fails: fails };
        }).filter(function (r) { return r.fails.length || r.x.missing >= minMiss; })
          .sort(function (a, b) { return b.fails.length - a.fails.length || b.x.missing - a.x.missing || byName(a.x, b.x); })
          .map(function (r) {
            return [r.x.name, r.x.grade || "", r.fails.map(function (c) { return c.title + " " + c.grade.percent + "%"; }).join("; "), r.x.missing || 0,
                    (r.x.guardians[0] && r.x.guardians[0].name) || "", (r.x.guardians[0] && r.x.guardians[0].email) || ""];
          });
        return { cols: [["Student"], ["Grade"], ["Failing"], ["Missing", 1], ["Guardian"], ["Guardian email"]], rows: rows,
          note: rows.length + " students are failing a course or missing " + minMiss + " or more pieces of work." };
      } },
    { key: "courses", group: "Academics", name: "Courses by average", about: "Every course, lowest average first, with how many are below the pass line.",
      build: function (d) {
        var rows = d.school.courses.filter(function (c) { return c.average != null; }).sort(function (a, b) { return a.average - b.average; })
          .map(function (c) {
            return [c.title, c.subject || "", c.teachers.map(function (t) { return t.name; }).join(", "), c.students, c.average, c.below || 0];
          });
        return { cols: [["Course"], ["Department"], ["Teachers"], ["Students", 1], ["Average %", 1], ["Below pass", 1]], rows: rows,
          note: rows.length + " courses with at least one mark." };
      } },
    { key: "curve", group: "Academics", name: "School bell curve", about: "How the school's overall averages are spread, ten points at a time.",
      build: function (d) {
        var bins = [], names = [];
        for (var i = 0; i < 10; i++) { bins.push(0); names.push(i === 9 ? "90–100" : (i * 10) + "–" + (i * 10 + 9)); }
        var n = 0;
        d.people.forEach(function (x) {
          if (x.standing == null) return;
          bins[Math.min(9, Math.floor(x.standing / 10))]++; n++;
        });
        var mean = n ? Math.round(d.people.reduce(function (a, x) { return a + (x.standing || 0); }, 0) / n) : null;
        return { cols: [["Range %"], ["Students", 1]], rows: names.map(function (nm, i) { return [nm, bins[i]]; }),
          chart: names.map(function (nm, i) { return { label: nm.split("–")[0], n: bins[i] }; }),
          note: n + " students with a mark" + (mean != null ? "; the average of their averages is " + mean + "%." : ".") };
      } },
    { key: "kinds", group: "Academics", name: "Averages by kind of work", about: "The average mark on homework, quizzes, tests and the rest, across the whole school.",
      build: function (d) {
        var cat = {};
        d.school.courses.forEach(function (c) {
          var b = c.book || {}, asg = {};
          (b.assignments || []).forEach(function (a) { asg[a.id] = a; });
          (b.grades || []).forEach(function (g) {
            var a = asg[g.assignmentId];
            if (!a || g.score == null || !(a.outOf > 0)) return;
            var k = a.category || "Other", o = cat[k] || (cat[k] = { n: 0, sum: 0 });
            o.n++; o.sum += g.score / a.outOf * 100;
          });
        });
        var rows = Object.keys(cat).map(function (k) { return [k, cat[k].n, Math.round(cat[k].sum / cat[k].n)]; })
          .sort(function (a, b) { return a[2] - b[2]; });
        return { cols: [["Kind of work"], ["Marks", 1], ["Average %", 1]], rows: rows, note: rows.length + " kinds of work with marks." };
      } },

    { key: "age", group: "Students", name: "Age by grade level", about: "How many students of each age are in each grade, on the day you choose.",
      params: [{ k: "on", label: "Age on", value: todayStr(), type: "date" }],
      build: function (d, p) {
        var on = p.on || todayStr(), grid = {}, ages = {}, none = 0;
        d.people.forEach(function (x) {
          var a = ageOn(x.dob, on);
          if (a == null || !x.grade) { none++; return; }
          grid[x.grade] = grid[x.grade] || {};
          grid[x.grade][a] = (grid[x.grade][a] || 0) + 1;
          ages[a] = 1;
        });
        var cols = Object.keys(ages).map(Number).sort(function (a, b) { return a - b; });
        var rows = Object.keys(grid).sort(function (a, b) { return gradeOrder(a) - gradeOrder(b); }).map(function (g) {
          var tot = 0, r = cols.map(function (a) { var n = grid[g][a] || 0; tot += n; return n || ""; });
          return [g].concat(r, [tot]);
        });
        return { cols: [["Grade"]].concat(cols.map(function (a) { return ["Age " + a, 1]; }), [["Total", 1]]), rows: rows,
          note: none ? none + " students are left out: no date of birth or no grade on file." : "Every student has a date of birth and a grade." };
      } },
    { key: "count", group: "Students", name: "Count by grade level", about: "Enrolled students in each grade this year, with gender where the record has it.",
      build: function (d) {
        var g = {};
        d.people.forEach(function (x) {
          if (!x.grade) return;
          var o = g[x.grade] || (g[x.grade] = { all: 0, f: 0, m: 0, o: 0 });
          o.all++;
          var s = String(x.gender || "").toLowerCase();
          if (s === "female") o.f++; else if (s === "male") o.m++; else o.o++;
        });
        var rows = Object.keys(g).sort(function (a, b) { return gradeOrder(a) - gradeOrder(b); }).map(function (k) { return [k, g[k].all, g[k].f, g[k].m, g[k].o]; });
        var total = rows.reduce(function (a, r) { return a + r[1]; }, 0);
        return { cols: [["Grade"], ["Students", 1], ["Female", 1], ["Male", 1], ["Other / not given", 1]], rows: rows,
          chart: rows.map(function (r) { return { label: r[0].replace(/Grade /, "G"), n: r[1] }; }), note: total + " students with a grade." };
      } },
    { key: "demo", group: "Students", name: "Gender and home language", about: "How the school's students are described in their records.",
      build: function (d) {
        var gen = {}, lang = {};
        d.people.forEach(function (x) {
          var gk = x.gender || "Not given", lk = x.language || "Not given";
          gen[gk] = (gen[gk] || 0) + 1; lang[lk] = (lang[lk] || 0) + 1;
        });
        var rows = [];
        Object.keys(gen).sort().forEach(function (k) { rows.push(["Gender", k, gen[k]]); });
        Object.keys(lang).sort().forEach(function (k) { rows.push(["Home language", k, lang[k]]); });
        return { cols: [["Measure"], ["Value"], ["Students", 1]], rows: rows, note: d.people.length + " students." };
      } },
    { key: "birthdays", group: "Students", name: "Birthday list", about: "Whose birthday falls in a month, with the age they turn.",
      params: [{ k: "month", label: "Month", value: String(new Date().getMonth() + 1), type: "month" }],
      build: function (d, p) {
        var m = +p.month || (new Date().getMonth() + 1), yr = new Date().getFullYear();
        var rows = d.people.filter(function (x) { return x.dob && +x.dob.slice(5, 7) === m; })
          .sort(function (a, b) { return a.dob.slice(8) - b.dob.slice(8) || byName(a, b); })
          .map(function (x) { return [+x.dob.slice(8) + " " + MONTHS[m - 1], x.name, x.grade || "", yr - +x.dob.slice(0, 4)]; });
        return { cols: [["Day"], ["Student"], ["Grade"], ["Turns", 1]], rows: rows, note: rows.length + " birthdays in " + MONTHS[m - 1] + "." };
      } },
    { key: "notback", group: "Students", name: "Not re-enrolled", about: "Students enrolled last year who have no enrollment this year — and whether an application is in.",
      build: function (d) {
        var now = {}, applying = {};
        d.cur.forEach(function (e) { if (["withdrawn", "transferred"].indexOf(e.state) < 0) now[e.studentId] = 1; });
        d.apps.forEach(function (a) { if (a.studentId && ["rejected", "withdrawn"].indexOf(a.status) < 0) applying[a.studentId] = a; });
        var rows = d.prev.filter(function (e) { return ["enrolled", "completed"].indexOf(e.state) > -1 && !now[e.studentId]; })
          .sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); })
          .map(function (e) {
            var a = applying[e.studentId];
            return [e.name, e.grade, a ? "Applied — " + a.status.replace(/_/g, " ") : "No application", e.email || ""];
          });
        return { cols: [["Student"], ["Last grade"], ["This year"], ["Email"]], rows: rows,
          note: rows.length + " of last year's students are not enrolled this year." };
      } },
    { key: "labels", group: "Students", name: "Labels", about: "Address labels for each family, or name labels for each student, three across.",
      params: [{ k: "kind", label: "For", value: "family", type: "select", options: [["family", "Each family (address)"], ["student", "Each student (name)"]] }],
      build: function (d, p) {
        var rows = [];
        if (p.kind === "student") {
          d.people.slice().sort(byName).forEach(function (x) { rows.push([x.name, x.grade || "", x.email || ""]); });
          return { cols: [["Student"], ["Grade"], ["Email"]], rows: rows, labels: rows.map(function (r) { return [r[0], r[1], r[2]]; }),
            note: rows.length + " name labels." };
        }
        var seen = {};
        d.people.forEach(function (x) {
          if (!x.address) return;
          var g = x.guardians[0], to = g && g.name ? g.name : "The family of " + x.name;
          var key = (to + "|" + x.address).toLowerCase();
          if (seen[key]) { seen[key][3] += ", " + x.name; return; }
          seen[key] = [to, x.address, "", x.name]; rows.push(seen[key]);
        });
        rows.sort(function (a, b) { return String(a[0]).localeCompare(String(b[0])); });
        var missing = d.people.filter(function (x) { return !x.address; }).length;
        return { cols: [["Addressed to"], ["Address"], ["_"], ["Students"]], rows: rows.map(function (r) { return [r[0], r[1], "", r[3]]; }),
          labels: rows.map(function (r) { return [r[0], r[1]]; }),
          note: rows.length + " family labels" + (missing ? "; " + missing + " students have no address on file." : ".") };
      } }
  ];

  /* ---------------------------------------------------------------- Page */
  var CUR = "honor", PARAMS = {};

  function tab(v) {
    var P = K.cxPage(v, "Reports", "Reports", "The lists the office reaches for — computed now from the gradebooks, enrollments and records, never stored. Each prints and each downloads.");
    var wrap = el("div", "of-wrap");
    var list = el("nav", "of-list");
    var pane = el("div", "of-pane");
    wrap.appendChild(list); wrap.appendChild(pane);
    v.appendChild(wrap);
    var note = K.loading(pane, "the school");
    var data = null;

    var groups = {};
    REPORTS.forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
    Object.keys(groups).forEach(function (g) {
      list.appendChild(el("h3", null, esc(g)));
      groups[g].forEach(function (r) {
        var b = el("button", "of-item" + (CUR === r.key ? " on" : ""), esc(r.name));
        b.type = "button";
        b.dataset.k = r.key;
        b.addEventListener("click", function () { CUR = r.key; mark(); draw(); });
        list.appendChild(b);
      });
    });
    function mark() { [].forEach.call(list.querySelectorAll(".of-item"), function (b) { b.classList.toggle("on", b.dataset.k === CUR); }); }

    var tick = function (done, n) { if (note.parentNode) note.textContent = done < n ? "Reading " + done + " of " + n + " student records…" : "Putting it together…"; };
    load(tick).then(function (d) { data = d; if (note.parentNode) note.remove(); draw(); },
      function (e) { K.failed(note, e, function () { K.openAdmin(true, "office"); }); });

    function draw() {
      if (!data) return;
      pane.innerHTML = "";
      var rep = REPORTS.filter(function (r) { return r.key === CUR; })[0];
      var head = el("header", "of-head");
      head.appendChild(el("h2", null, esc(rep.name)));
      head.appendChild(el("p", null, esc(rep.about)));
      pane.appendChild(head);
      var bar = el("div", "of-params");
      var params = PARAMS[rep.key] = PARAMS[rep.key] || {};
      (rep.params || []).forEach(function (pm) {
        if (params[pm.k] == null) params[pm.k] = pm.value;
        var lab = el("label", "of-param", "<span>" + esc(pm.label) + "</span>");
        var inp;
        if (pm.type === "select") {
          inp = el("select");
          pm.options.forEach(function (o) { var op = el("option"); op.value = o[0]; op.textContent = o[1]; inp.appendChild(op); });
        } else if (pm.type === "month") {
          inp = el("select");
          MONTHS.forEach(function (m, i) { var op = el("option"); op.value = String(i + 1); op.textContent = m; inp.appendChild(op); });
        } else { inp = el("input"); inp.type = pm.type; }
        inp.value = params[pm.k];
        inp.addEventListener("change", function () { params[pm.k] = inp.value; draw(); });
        lab.appendChild(inp);
        bar.appendChild(lab);
      });
      var out = rep.build(data, params);
      var tools = el("div", "of-tools");
      var title = rep.name + " — " + data.year.slice(0, 4) + "–" + data.year.slice(7);
      tools.appendChild(K.cnAction("Print", function () {
        if (rep.key === "labels" && out.labels) { K.cxPrint(title, labelSheet(out.labels)); return; }
        K.cxPrint(title, K.printHead(rep.name, out.note) + K.printTable(out.cols.map(function (c) { return { t: c[0] === "_" ? "" : c[0], r: c[1] }; }),
          out.rows.map(function (r) { return r.map(function (x) { return x == null ? "" : String(x); }); })));
      }));
      tools.appendChild(K.cnAction("Download CSV", function () {
        K.csvDownload(rep.key + "-" + data.year + ".csv", [out.cols.map(function (c) { return c[0] === "_" ? "" : c[0]; })].concat(out.rows));
      }, true));
      bar.appendChild(tools);
      pane.appendChild(bar);
      pane.appendChild(el("p", "of-note", esc(out.note || "")));
      if (out.chart && K.barChart) pane.appendChild(K.barChart(out.chart, {}));
      if (!out.rows.length) { pane.appendChild(K.cnEmpty("Nothing to list.", "Nobody matches, or the records this report reads are empty.")); return; }
      var t = K.cnTable(out.cols.map(function (c, i) {
        return { label: c[0] === "_" ? "" : c[0], w: i === 0 ? "minmax(150px, 1.4fr)" : c[1] ? "88px" : "minmax(110px, 1fr)", align: c[1] ? "right" : undefined };
      }));
      out.rows.slice(0, 500).forEach(function (r) {
        t.row(r.map(function (x) { return x === "" || x == null ? K.cxNone() : esc(x); }));
      });
      pane.appendChild(t);
      if (out.rows.length > 500) pane.appendChild(el("p", "of-note", "Showing the first 500 of " + out.rows.length + ". The download has them all."));
    }
  }

  function labelSheet(labels) {
    var css = "<style>.sheet{display:grid;grid-template-columns:repeat(3,1fr);gap:0 14px}.lab{height:1.05in;padding:.12in .1in;box-sizing:border-box;overflow:hidden;line-height:1.35;border:.5pt dashed #ddd}" +
      ".lab b{display:block;font-weight:600}.lab span{display:block;white-space:pre-line;color:#333}@media print{.lab{border:0}}</style>";
    return css + "<div class='sheet'>" + labels.map(function (l) {
      return "<div class='lab'><b>" + esc(l[0]) + "</b>" + l.slice(1).filter(Boolean).map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>";
    }).join("") + "</div>";
  }

  return { tab: tab };
};
