/* ==========================================================================
   OEdu — an Indian school's timetable, and who covers when a teacher is away.

   A timetable in India is a grid you can read from across a staff room: the
   days of the week across, the periods down, and in each box the subject and
   the teacher. The platform keeps the same facts as sections (a subject
   taught to a class by a teacher in named periods: M1, T3, S2) and the bell
   schedules that say when each period is. This draws them as that grid, for
   a class or for a teacher, says out loud where one teacher is in two places
   or one class has two lessons at once, and uses it to answer the question
   that ends every Monday morning: a teacher is away, who is free?

   Nothing here is a second copy: it reads /sections and /bell-schedules, and
   it writes cover as the same records Staff › Cover has always kept.

   Mounted by app.js with the console kit: OPLO_INDIA_TT(kit) →
   { timetable, cover }.
   ========================================================================== */
window.OPLO_INDIA_TT = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, SC = API.schedule, U = K.ui;
  var chip = U.chip, num = U.num, plural = U.plural, dmy = U.dmy;

  var DAYS = [["M", "Mon", "Monday"], ["T", "Tue", "Tuesday"], ["W", "Wed", "Wednesday"], ["R", "Thu", "Thursday"], ["F", "Fri", "Friday"], ["S", "Sat", "Saturday"]];
  var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  function soft(p) { return p.catch(function () { return null; }); }
  function byClass(a, b) {
    var pa = String(a).split("-"), pb = String(b).split("-"), ga = ROMAN.indexOf(pa[0]), gb = ROMAN.indexOf(pb[0]);
    return (ga - gb) || String(pa[1] || "").localeCompare(String(pb[1] || ""));
  }
  function hueOf(n) { var h = 0; for (var i = 0; i < String(n).length; i++) h = (h * 31 + String(n).charCodeAt(i)) % 8; return h; }
  function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function hhmm(t) { return t ? String(t).slice(0, 5) : ""; }

  /* ------------------------------------------------- Reading the sections */
  function parse(l) { var m = /^([MTWRFS])(\d+)$/.exec(l); return m ? { d: m[1], n: Number(m[2]) } : null; }
  function load() {
    return Promise.all([SC.sections(), SC.bell()]).then(function (r) {
      var secs = (r[0] || []).filter(function (s) { return s.placed && s.status !== "archived"; }), bell = r[1] || [];
      var at = {};                                   // label → [sections]
      secs.forEach(function (s) { s.periods.forEach(function (l) { (at[l] = at[l] || []).push(s); }); });
      // The rows: the Monday schedule's order, lunch and all; a Saturday's shorter day just has fewer boxes.
      var mon = bell.filter(function (b) { return b.periods.some(function (p) { return /^M\d/.test(p.label); }); })[0] || bell[0] || { periods: [] };
      var rows = mon.periods.map(function (p) { var q = parse(p.label); return { label: p.label, n: q ? q.n : null, from: hhmm(p.startsAt), to: hhmm(p.endsAt), other: p.kind === "other" || !q, name: q ? "Period " + q.n : p.label }; });
      var have = {};
      secs.forEach(function (s) { s.periods.forEach(function (l) { var q = parse(l); if (q) have[q.d] = true; }); });
      var days = DAYS.filter(function (d) { return have[d[0]]; });
      var classes = [], teachers = {};
      secs.forEach(function (s) {
        if (s.tab && classes.indexOf(s.tab) < 0) classes.push(s.tab);
        s.teachers.forEach(function (t) { if (t.role === "teacher") teachers[t.id] = t.name; });
      });
      classes.sort(byClass);
      var valid = {};
      bell.forEach(function (b) { b.periods.forEach(function (p) { valid[p.label] = true; }); });
      return { secs: secs, at: at, rows: rows, days: days, classes: classes, teachers: teachers, bell: bell, valid: valid };
    });
  }
  /* Who is where, when: one teacher in two sections at once, or a class with two lessons in one box. */
  function clashes(D) {
    var out = [];
    Object.keys(D.at).forEach(function (l) {
      var by = {}, byTab = {};
      D.at[l].forEach(function (s) {
        s.teachers.filter(function (t) { return t.role === "teacher"; }).forEach(function (t) { (by[t.id] = by[t.id] || []).push(s); });
        if (s.tab) (byTab[s.tab] = byTab[s.tab] || []).push(s);
      });
      Object.keys(by).forEach(function (id) { if (by[id].length > 1) out.push({ label: l, kind: "teacher", who: D.teachers[id], what: by[id].map(function (s) { return s.tab + " " + s.title; }) }); });
      Object.keys(byTab).forEach(function (t) { if (byTab[t].length > 1) out.push({ label: l, kind: "class", who: t, what: byTab[t].map(function (s) { return s.title; }) }); });
    });
    return out;
  }
  function pretty(l) { var q = parse(l), d = DAYS.filter(function (x) { return x[0] === q.d; })[0]; return d[1] + " P" + q.n; }

  /* ============================================================ The grid */
  var ST = { view: "class", pick: "" };

  function timetable(v, legacy) {
    K.cxPage(v, "Schedule", "Timetable", "Each class's week, and each teacher's: the periods down, the days across, the subject and teacher in every box.");
    var bar = el("div", "tmt-bar"), slot = el("div", "en-slot");
    v.appendChild(bar); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the timetable…"));
    load().then(function (D) {
      slot.innerHTML = "";
      if (!D.secs.length) { slot.appendChild(K.cnEmpty("Nothing is placed in the timetable yet.", "Give each subject of each class its periods, or build them from the plans, and the grid draws itself.", "All sections", function () { legacy(v); })); return; }
      var seg = el("div", "cn-seg");
      [["class", "By class"], ["teacher", "By teacher"], ["list", "All sections"]].forEach(function (x) {
        var b = el("button", "cn-segb" + (ST.view === x[0] ? " on" : ""), x[1]); b.type = "button";
        b.addEventListener("click", function () { ST.view = x[0]; ST.pick = ""; K.openAdmin(true, "sc-sections"); });
        seg.appendChild(b);
      });
      bar.appendChild(seg);
      var cl = clashes(D);
      bar.appendChild(el("span", "tmt-health " + (cl.length ? "bad" : "ok"), cl.length ? "<i></i>" + plural(cl.length, "clash", "clashes") : "<i></i>No clashes"));
      var stat = el("span", "tmt-stat", num(D.secs.length) + " sections · " + num(Object.keys(D.teachers).length) + " teachers · " + D.classes.length + " classes");
      bar.appendChild(stat);

      if (ST.view === "list") { var host = el("div"); slot.appendChild(host); legacy(host); return; }
      var pick = el("select", "cx-select tmt-pick");
      var list = ST.view === "class" ? D.classes : Object.keys(D.teachers).sort(function (a, b) { return D.teachers[a].localeCompare(D.teachers[b]); });
      if (!ST.pick || list.indexOf(ST.pick) < 0) ST.pick = list[0];
      pick.innerHTML = list.map(function (k) { return '<option value="' + esc(k) + '"' + (k === ST.pick ? " selected" : "") + ">" + esc(ST.view === "class" ? "Class " + k : D.teachers[k]) + "</option>"; }).join("");
      pick.addEventListener("change", function () { ST.pick = pick.value; draw(); });
      bar.insertBefore(pick, stat);

      var host2 = el("div"); slot.appendChild(host2);
      function draw() { host2.innerHTML = ""; host2.appendChild(grid(D, ST.view, ST.pick)); if (cl.length) host2.appendChild(clashList(cl)); }
      draw();
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "sc-sections"); }); });
  }

  function grid(D, view, pick) {
    var box = el("div", "tmt");
    var mine = D.secs.filter(function (s) { return view === "class" ? s.tab === pick : s.teachers.some(function (t) { return t.id === pick; }); });
    var total = mine.reduce(function (a, s) { return a + s.periods.length; }, 0);
    var head = el("div", "tmt-head");
    if (view === "class") {
      head.innerHTML = "<h2>Class " + esc(pick) + "</h2><span>" + plural(mine.length, "subject") + " · " + plural(total, "period") + " a week</span>";
    } else {
      head.innerHTML = "<h2>" + esc(D.teachers[pick]) + "</h2><span>" + plural(mine.length, "class", "classes") + " · " + plural(total, "period") + " a week</span>";
      head.appendChild(el("i", "tmt-load", "<u style='width:" + Math.min(100, Math.round(total / 40 * 100)) + "%'></u>"));
    }
    box.appendChild(head);
    var g = el("div", "tmt-grid");
    g.style.setProperty("--d", D.days.length);
    g.appendChild(el("span", "tmt-corner"));
    D.days.forEach(function (d) { g.appendChild(el("span", "tmt-day", "<b>" + d[1] + "</b>")); });
    D.rows.forEach(function (r) {
      if (r.other) { var band = el("div", "tmt-band", "<span>" + esc(r.name) + (r.from ? " · " + r.from + "–" + r.to : "") + "</span>"); g.appendChild(band); return; }
      g.appendChild(el("span", "tmt-time", "<b>P" + r.n + "</b><small>" + esc(r.from) + "</small>"));
      D.days.forEach(function (d) {
        var l = d[0] + r.n, here = mine.filter(function (s) { return s.periods.indexOf(l) > -1; });
        var c;
        if (!D.valid[l]) { g.appendChild(el("span", "tmt-none")); return; }
        if (!here.length) { c = el("button", "tmt-cell free", "<span>Free</span>"); c.type = "button"; c.addEventListener("click", function () { whoIsFree(D, l); }); }
        else {
          c = el("button", "tmt-cell h" + hueOf(here[0].title));
          c.type = "button";
          c.innerHTML = here.map(function (s) {
            return "<b>" + esc(s.title) + "</b><small>" + esc(view === "class" ? (s.teachers[0] ? s.teachers[0].name : "No teacher") : s.tab) + (s.room ? " · " + esc(s.room) : "") + "</small>";
          }).join("");
          if (here.length > 1) c.classList.add("clash");
          c.addEventListener("click", function () { whoIsFree(D, l, here[0]); });
        }
        g.appendChild(c);
      });
    });
    box.appendChild(g);
    return box;
  }

  function clashList(cl) {
    var c = el("section", "tmt-clashes");
    c.innerHTML = "<h3>Clashes</h3>" + cl.slice(0, 12).map(function (x) {
      return "<p><b>" + esc(pretty(x.label)) + "</b> " + (x.kind === "teacher" ? esc(x.who) + " is in " : "Class " + esc(x.who) + " has ") + esc(x.what.join(" and ")) + ".</p>";
    }).join("");
    return c;
  }

  /* Free at that period: teachers with nothing in that box, those who teach the subject first. */
  function freeAt(D, label, subject, except) {
    var busy = {};
    (D.at[label] || []).forEach(function (s) { s.teachers.forEach(function (t) { busy[t.id] = true; }); });
    return Object.keys(D.teachers).filter(function (id) { return !busy[id] && !(except && except[id]); }).map(function (id) {
      var teaches = D.secs.filter(function (s) { return s.teachers.some(function (t) { return t.id === id; }); });
      var same = subject && teaches.some(function (s) { return s.title === subject; });
      var load = teaches.reduce(function (a, s) { return a + s.periods.length; }, 0);
      return { id: id, name: D.teachers[id], same: same, load: load };
    }).sort(function (a, b) { return (b.same ? 1 : 0) - (a.same ? 1 : 0) || a.load - b.load; });
  }
  function whoIsFree(D, label, sec) {
    var box = el("div", "tmt-free");
    var free = freeAt(D, label, sec && sec.title);
    box.innerHTML = "<h2>" + esc(pretty(label)) + (sec ? " · " + esc(sec.tab + " " + sec.title) : "") + "</h2><p>" + (sec ? "Taught by " + esc(sec.teachers.map(function (t) { return t.name; }).join(", ") || "nobody yet") + (sec.room ? " in " + esc(sec.room) : "") + ". " : "Nothing is placed. ") +
      plural(free.length, "teacher is", "teachers are") + " free now.</p>" +
      '<div class="tmt-people">' + free.slice(0, 14).map(function (f) { return "<span class='" + (f.same ? "same" : "") + "'><b>" + esc(f.name) + "</b><small>" + (f.same ? "teaches " + esc(sec.title) + " · " : "") + f.load + " periods</small></span>"; }).join("") + "</div>";
    K.cxSheet(box);
  }

  /* ========================================================== Cover desk */
  var COVER = { day: "" };
  function nextSchoolDay() { var d = new Date(); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return ymd(d); }

  function cover(v) {
    var P = K.cxPage(v, "Staff", "Cover", "A teacher is away: which of their periods need someone, and who is free then. Pick a day, then pick a person for each period.");
    var bar = el("div", "tmt-bar"), slot = el("div", "en-slot");
    v.appendChild(bar); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the day…"));
    var date = el("input", "at-dateinput"); date.type = "date"; date.value = COVER.day || nextSchoolDay();
    date.addEventListener("change", function () { COVER.day = date.value; K.openAdmin(true, "cover"); });
    bar.appendChild(date);
    var day = date.value, letter = (["", "M", "T", "W", "R", "F", "S"])[new Date(day + "T12:00:00").getDay()];
    Promise.all([load(), soft(API.items.list({ kind: "leave", limit: 300 })), soft(API.items.list({ kind: "substitute", limit: 300 }))]).then(function (r) {
      var D = r[0], leave = r[1] || [], subs = r[2] || [];
      slot.innerHTML = "";
      if (!letter) { slot.appendChild(el("p", "en-note", esc(dmy(day)) + " is a Sunday.")); return; }
      var away = {};
      leave.forEach(function (l) { if (l.status !== "approved" && l.status !== "pending") return; var until = (l.data && l.data.until) || l.dueOn; if (l.subjectId && l.dueOn && l.dueOn <= day && day <= until) away[l.subjectId] = l; });
      var absent = Object.keys(away).filter(function (id) { return D.teachers[id]; });
      var covered = {};                                   // "teacherId|label" → cover record
      subs.filter(function (s) { return s.dueOn === day; }).forEach(function (s) { covered[s.subjectId + "|" + ((s.data && s.data.slot) || "")] = s; });
      var need = [];
      absent.forEach(function (id) {
        D.secs.filter(function (s) { return s.teachers.some(function (t) { return t.id === id; }); }).forEach(function (s) {
          s.periods.filter(function (l) { return l[0] === letter; }).forEach(function (l) { need.push({ id: id, sec: s, label: l, n: parse(l).n }); });
        });
      });
      need.sort(function (a, b) { return a.n - b.n; });
      var done = need.filter(function (x) { return covered[x.id + "|" + x.label]; }).length;
      bar.appendChild(el("span", "tmt-stat", esc(dmy(day)) + " · " + plural(absent.length, "teacher") + " away · " + done + " of " + need.length + " periods covered"));
      if (!absent.length) {
        slot.appendChild(el("div", "ih-clear", "<span>" + K.icon("check") + "</span><b>Nobody is away on " + esc(dmy(day)) + ".</b><em>Approved leave for the day would show here, with each period to cover.</em>"));
        return;
      }
      var list = el("div", "cv-list");
      var coverers = {};                                   // who is already covering which label today
      Object.keys(covered).forEach(function (k) { var c = covered[k], who = c.data && c.data.coveredBy; if (who) (coverers[k.split("|")[1]] = coverers[k.split("|")[1]] || {})[who] = true; });
      need.forEach(function (x, i) {
        var key = x.id + "|" + x.label, c = covered[key];
        var row = el("div", "cv-row" + (c ? " done" : ""));
        row.style.setProperty("--i", i);
        var time = D.rows.filter(function (q) { return q.label === x.label; })[0];
        row.innerHTML = '<span class="cv-p"><b>P' + x.n + "</b><small>" + esc(time ? time.from : "") + "</small></span>" +
          '<span class="cv-what"><b>' + esc(x.sec.tab + " · " + x.sec.title) + "</b><small>" + esc(D.teachers[x.id]) + " is away" + (x.sec.room ? " · " + esc(x.sec.room) : "") + "</small></span>";
        var side = el("span", "cv-side");
        if (c) {
          side.innerHTML = "<em>" + K.icon("check") + esc(c.data && c.data.coveredByName || "Covered") + "</em>";
          var undo = U.btn("Change", "quiet small", function () { assign(x, c, null); });
          side.appendChild(undo);
        } else {
          var free = freeAt(D, x.label, x.sec.title, coverers[x.label] || {});
          var sel = el("select", "cx-select");
          sel.innerHTML = '<option value="">Choose who covers…</option>' + free.slice(0, 20).map(function (f) { return '<option value="' + esc(f.id) + '">' + esc(f.name) + (f.same ? " — teaches " + esc(x.sec.title) : "") + " (" + f.load + ")</option>"; }).join("");
          var go = U.btn("Assign", "strong small", function () { if (!sel.value) { K.toast("Choose who covers first."); return; } assign(x, null, { id: sel.value, name: D.teachers[sel.value] }); });
          side.appendChild(sel); side.appendChild(go);
          if (free[0]) { var best = el("button", "cv-best", "Suggest: " + esc(free[0].name)); best.type = "button"; best.addEventListener("click", function () { sel.value = free[0].id; }); side.appendChild(best); }
        }
        row.appendChild(side);
        list.appendChild(row);
      });
      slot.appendChild(list);

      function assign(x, existing, who) {
        var key = x.id + "|" + x.label;
        var body = { title: "Cover for " + D.teachers[x.id] + ": P" + x.n + " " + x.sec.tab, status: who ? "covered" : "needed",
          data: { periods: "P" + x.n + " " + x.sec.tab + " " + x.sec.title, slot: x.label, reason: (away[x.id].data && away[x.id].data.type ? away[x.id].data.type + " leave" : "Leave"), coveredBy: who ? who.id : "", coveredByName: who ? who.name : "" } };
        var p = existing ? API.items.update(existing.id, body) : API.items.create(Object.assign({ kind: "substitute", subjectId: x.id, dueOn: day }, body));
        p.then(function () { K.toast(who ? who.name + " covers P" + x.n + " for " + x.sec.tab + "." : "Cover cleared."); K.openAdmin(true, "cover"); }, function (e) { K.toast(e && e.message ? e.message : "That did not save."); });
      }
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "cover"); }); });
  }

  return { timetable: timetable, cover: cover };
};
