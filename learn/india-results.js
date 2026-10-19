/* ==========================================================================
   OEdu — results analysis, the way an Indian school reads an exam.

   After every exam a principal asks the same things: who topped, how did each
   section do, which subject let us down, did girls and boys, or the
   categories the school reports on, do differently, and who is failing
   more than one paper. This answers them from the exam's own report cards
   (api/src/routes/exams.js: /exams/:id/cards, one call a section) and the
   children's records (category, gender), and says out loud when a figure
   rests on papers that are not yet published or on very few children.

   Nothing is stored here and nothing is estimated: every figure is counted
   from marks the teachers entered. Pass is the exam's own scale's pass mark.

   Mounted by app.js with the console kit: OPLO_INDIA_RESULTS(kit) →
   { analysis }.
   ========================================================================== */
window.OPLO_INDIA_RESULTS = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, U = K.ui;
  var num = U.num, plural = U.plural;
  var ST = { examId: "" };
  var FEW = 10;       // a share of fewer children than this is shown, but said to be small

  function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; }
  function r1(n) { return n == null ? "—" : (Math.round(n * 10) / 10).toFixed(1); }
  function hueOf(n) { var h = 0; for (var i = 0; i < String(n).length; i++) h = (h * 31 + String(n).charCodeAt(i)) % 8; return h; }
  function initials(n) { return String(n || "?").split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase(); }

  function analysis(v) {
    var P = K.cxPage(v, "Reports", "Results analysis", "An exam, read the way a principal reads it: who topped, how each section and subject did, and who needs help.");
    var bar = el("div", "ra-bar"), slot = el("div", "en-slot");
    v.appendChild(bar); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the exams…"));

    API.exams.list().then(function (r) {
      var exams = r.exams || [];
      if (!exams.length) { slot.innerHTML = ""; slot.appendChild(K.cnEmpty("No exam is set up.", "Make an exam and its papers under Academics, and its analysis will be here.", "Exams", function () { K.openAdmin(false, "in-exams"); })); return; }
      if (!ST.examId || !exams.some(function (e) { return e.id === ST.examId; })) ST.examId = exams[0].id;
      var sel = el("select", "cx-select");
      sel.innerHTML = exams.map(function (e) { return '<option value="' + esc(e.id) + '"' + (e.id === ST.examId ? " selected" : "") + ">" + esc(e.name) + " · " + esc(String(e.year).replace(/(\d{4})-\d{2}(\d{2})/, "$1–$2")) + "</option>"; }).join("");
      sel.addEventListener("change", function () { ST.examId = sel.value; K.openAdmin(true, "in-analysis"); });
      bar.appendChild(sel);
      var exam = exams.filter(function (e) { return e.id === ST.examId; })[0];

      Promise.all([API.india.classes(exam.year), API.india.students()]).then(function (res) {
        var classes = res[0].classes.filter(function (c) { return c.strength > 0; }), kids = {};
        (res[1].students || []).forEach(function (s) { kids[s.id] = s; });
        return Promise.all(classes.map(function (c) { return API.exams.cards(exam.id, c.id).then(function (x) { return { c: c, x: x }; }, function () { return null; }); })).then(function (all) {
          slot.innerHTML = "";
          draw(slot, P, exam, all.filter(Boolean), kids);
        });
      }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "in-analysis"); }); });
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "in-analysis"); }); });
  }

  function draw(slot, P, exam, all, kids) {
    /* One row per child who has marks. */
    var rows = [], unpublished = 0, papers = 0;
    all.forEach(function (a) {
      (a.x.cards || []).forEach(function (c) {
        var subs = (c.subjects || []).filter(function (s) { return !s.missing; });
        if (!subs.length) return;
        subs.forEach(function (s) { papers++; if (s.state !== "published") unpublished++; });
        var k = kids[c.accountId] || {};
        rows.push({ id: c.accountId, name: c.name, cls: a.c.label, roll: c.rollNo, pct: c.percent, total: c.total, max: c.max, grade: c.grade, pass: c.result === "pass", failed: c.failed || [], subs: subs,
                    cat: k.category || "—", gender: k.gender || "—" });
      });
    });
    if (!rows.length) { slot.appendChild(K.cnEmpty("No marks are in for this exam yet.", "Teachers enter marks paper by paper; this fills as they do.")); return; }
    var scale = all[0].x.scale || { bands: [], passPercent: 33 };
    var passMark = scale.passPercent == null ? 33 : scale.passPercent;

    var kpis = el("div", "ra-kpis");
    var passN = rows.filter(function (r) { return r.pass; }).length, dist = rows.filter(function (r) { return r.pct >= 75; }).length;
    [["indigo", "Children assessed", num(rows.length), "in " + plural(all.length, "section")], ["violet", "School average", r1(mean(rows.map(function (r) { return r.pct; }))) + "%", "of the total marks"],
     ["emerald", "Passed", pct(passN, rows.length) + "%", num(passN) + " of " + num(rows.length) + " · pass mark " + passMark + "%"], ["amber", "75% or more", pct(dist, rows.length) + "%", num(dist) + " children"],
     ["rose", "Not passed", num(rows.length - passN), rows.length - passN ? "see who needs help below" : "everyone passed"]].forEach(function (k) {
      var d = el("div", "ra-kpi"); d.dataset.hue = k[0]; d.innerHTML = "<span>" + esc(k[1]) + "</span><b>" + esc(k[2]) + "</b><em>" + esc(k[3]) + "</em>"; kpis.appendChild(d);
    });
    slot.appendChild(kpis);
    if (unpublished) slot.appendChild(el("p", "ra-warn", "<b>Provisional.</b> " + num(unpublished) + " of " + num(papers) + " papers are not published yet, so these figures can still move."));

    var grid = el("div", "ra-grid");
    slot.appendChild(grid);

    /* ---- Toppers */
    var tops = rows.slice().sort(function (a, b) { return b.pct - a.pct; }).slice(0, 10);
    var c1 = section(grid, "ra-s6", "Toppers", "the school's best ten", "violet");
    var tl = el("div", "ra-tops");
    tops.forEach(function (r, i) {
      var b = el("button", "ra-top" + (i < 3 ? " podium" : ""));
      b.type = "button"; b.style.setProperty("--i", i);
      b.innerHTML = '<span class="rk">' + (i + 1) + '</span><span class="cx-av" data-h="' + hueOf(r.name) + '">' + esc(initials(r.name)) + '</span><span class="t"><b>' + esc(r.name) + "</b><small>" + esc(r.cls) + (r.roll ? " · roll " + r.roll : "") + '</small></span><span class="sc"><b>' + r1(r.pct) + "%</b><small>" + esc(r.grade || "") + "</small></span>";
      b.addEventListener("click", function () { K.student({ id: r.id, name: r.name }); });
      tl.appendChild(b);
    });
    c1.appendChild(tl);

    /* ---- Sections */
    var by = {};
    rows.forEach(function (r) { (by[r.cls] = by[r.cls] || []).push(r); });
    var secs = Object.keys(by).map(function (k) { var l = by[k]; return { k: k, n: l.length, avg: mean(l.map(function (x) { return x.pct; })), pass: pct(l.filter(function (x) { return x.pass; }).length, l.length), top: l.slice().sort(function (a, b) { return b.pct - a.pct; })[0] }; })
      .sort(function (a, b) { return b.avg - a.avg; });
    var c2 = section(grid, "ra-s6", "Sections compared", "average and pass share", "indigo");
    var sl = el("div", "ra-bars");
    secs.forEach(function (s, i) {
      var r = el("div", "ra-barrow"); r.style.setProperty("--i", i);
      r.innerHTML = "<span class='l'><b>" + esc(s.k) + "</b><small>" + s.n + " children</small></span><span class='b'><i class='avg' style='width:" + Math.min(100, s.avg) + "%'></i><u style='left:" + (s.pass == null ? 0 : s.pass) + "%' title='" + s.pass + "% passed'></u></span><span class='v'><b>" + r1(s.avg) + "%</b><small>" + s.pass + "% pass</small></span>";
      sl.appendChild(r);
    });
    c2.appendChild(sl);
    c2.appendChild(el("p", "ra-note", "The bar is the section's average; the tick is the share that passed."));

    /* ---- Subjects */
    var bySub = {};
    rows.forEach(function (r) { r.subs.forEach(function (s) { if (s.absent || s.percent == null) return; (bySub[s.subject] = bySub[s.subject] || []).push(s); }); });
    var subs = Object.keys(bySub).map(function (k) { var l = bySub[k]; return { k: k, n: l.length, avg: mean(l.map(function (x) { return x.percent; })), pass: pct(l.filter(function (x) { return x.pass !== false; }).length, l.length), hi: Math.max.apply(null, l.map(function (x) { return x.percent; })),
      fail: l.filter(function (x) { return x.pass === false; }).length }; }).sort(function (a, b) { return a.avg - b.avg; });
    var c3 = section(grid, "ra-s12", "Subjects", "weakest first", "rose");
    var tb = K.cnTable([{ label: "Subject", w: "minmax(160px, 1.3fr)" }, { label: "Average", w: "minmax(160px, 1.2fr)" }, { label: "Passed", w: "100px" }, { label: "Highest", w: "90px" }, { label: "Not passed", w: "110px" }]);
    subs.forEach(function (s) {
      tb.row(["<b>" + esc(s.k) + "</b>", "<span class='ra-meter " + (s.avg < 50 ? "lo" : s.avg < 65 ? "mid" : "hi") + "'><i style='width:" + s.avg + "%'></i></span><b class='ra-pv'>" + r1(s.avg) + "%</b>", s.pass + "%", Math.round(s.hi) + "%", s.fail ? "<b class='ra-fail'>" + s.fail + "</b>" : "<span class='cn-none'>0</span>"]);
    });
    c3.appendChild(tb);

    /* ---- Who does differently: category and gender, with the caution that small groups are small */
    function groups(key, label, order) {
      var g = {};
      rows.forEach(function (r) { (g[r[key]] = g[r[key]] || []).push(r); });
      return Object.keys(g).filter(function (k) { return k !== "—"; }).sort(function (a, b) { return (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)); }).map(function (k) {
        var l = g[k]; return { k: ({ F: "Girls", M: "Boys", O: "Other" })[k] || k, n: l.length, avg: mean(l.map(function (x) { return x.pct; })), pass: pct(l.filter(function (x) { return x.pass; }).length, l.length) };
      });
    }
    var c4 = section(grid, "ra-s6", "By category", "SC, ST, OBC, EWS/DG and General", "amber");
    c4.appendChild(groupTable(groups("cat", "Category", ["General", "OBC", "SC", "ST", "EWS/DG"])));
    var c5 = section(grid, "ra-s6", "Girls and boys", "", "fuchsia");
    c5.appendChild(groupTable(groups("gender", "Gender", ["F", "M", "O"])));

    /* ---- Who needs help */
    var weak = rows.filter(function (r) { return r.failed.length >= 1; }).sort(function (a, b) { return b.failed.length - a.failed.length || a.pct - b.pct; });
    var c6 = section(grid, "ra-s12", "Who needs help", plural(weak.length, "child", "children") + " did not pass " + (weak.length ? "at least one paper" : "any paper"), "red");
    if (!weak.length) c6.appendChild(el("p", "ra-note", "Nobody failed a paper."));
    else {
      var wt = K.cnTable([{ label: "Child", w: "minmax(200px, 1.4fr)" }, { label: "Class", w: "90px" }, { label: "Total", w: "90px" }, { label: "Not passed in", w: "minmax(200px, 1.6fr)" }]);
      weak.slice(0, 30).forEach(function (r) {
        wt.row(['<span class="is-who"><span class="cx-av" data-h="' + hueOf(r.name) + '">' + esc(initials(r.name)) + "</span><span><b>" + esc(r.name) + "</b></span></span>", "<b>" + esc(r.cls) + "</b>", r1(r.pct) + "%",
          r.failed.map(function (f) { return '<span class="ra-chip">' + esc(f) + "</span>"; }).join("")], function () { K.student({ id: r.id, name: r.name }); }, r.id);
      });
      c6.appendChild(wt);
      if (weak.length > 30) c6.appendChild(el("p", "ra-note", "The first 30 of " + weak.length + "; download for the rest."));
    }

    /* ---- Out */
    P.tools.appendChild(K.cnAction("Download", function () {
      var out = [["Class", "Roll", "Name", "Total", "Out of", "Percent", "Grade", "Result", "Category", "Gender"]].concat(rows.map(function (r) { return [r.cls, r.roll, r.name, r.total, r.max, r.pct, r.grade, r.pass ? "Pass" : "Not passed", r.cat, r.gender]; }));
      K.csvDownload(exam.name.replace(/\W+/g, "-") + "-results.csv", out);
    }));
    P.tools.appendChild(K.cnAction("Print", function () {
      K.cxPrint("Results · " + exam.name, K.printHead("Results analysis", exam.name) + "<h2>Sections</h2>" +
        K.printTable([{ t: "Section" }, { t: "Children", r: 1 }, { t: "Average %", r: 1 }, { t: "Passed %", r: 1 }, { t: "Topper" }], secs.map(function (s) { return [s.k, s.n, r1(s.avg), s.pass, s.top ? s.top.name + " (" + r1(s.top.pct) + "%)" : ""]; })) +
        "<h2>Subjects</h2>" + K.printTable([{ t: "Subject" }, { t: "Average %", r: 1 }, { t: "Passed %", r: 1 }, { t: "Highest %", r: 1 }, { t: "Not passed", r: 1 }], subs.map(function (s) { return [s.k, r1(s.avg), s.pass, Math.round(s.hi), s.fail]; })) +
        "<h2>Toppers</h2>" + K.printTable([{ t: "#", r: 1 }, { t: "Name" }, { t: "Section" }, { t: "Percent", r: 1 }, { t: "Grade" }], tops.map(function (r, i) { return [i + 1, r.name, r.cls, r1(r.pct), r.grade]; })));
    }));
  }

  function section(grid, span, title, sub, hue) {
    var c = el("section", "ra-card " + span);
    c.dataset.hue = hue;
    c.innerHTML = "<header><h3>" + esc(title) + "</h3>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</header>";
    grid.appendChild(c);
    return c;
  }

  function groupTable(list) {
    var t = K.cnTable([{ label: "Group", w: "minmax(100px, 1fr)" }, { label: "Children", w: "90px" }, { label: "Average", w: "90px" }, { label: "Passed", w: "90px" }]);
    list.forEach(function (g) {
      t.row(["<b>" + esc(g.k) + "</b>" + (g.n < FEW ? " <span class='ra-few' title='Too few children for the share to mean much'>few</span>" : ""), num(g.n), r1(g.avg) + "%", g.pass + "%"]);
    });
    if (!list.length) return el("p", "ra-note", "None of these are on the children's records yet.");
    return t;
  }

  return { analysis: analysis };
};
