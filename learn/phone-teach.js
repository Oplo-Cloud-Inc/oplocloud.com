/* ==========================================================================
   OEdu on a phone — what a teacher does with marks.

     To mark         work handed in on OEdu and waiting, and work past its date
                     with nothing recorded, across every class
     Marking         one piece of work, one student at a time: the number, a
                     comment, on to the next. The keyboard stays up between
                     students, so a whole class is a run of numbers and Return.
     A class         its grade as the picture; the work set, with how it went;
                     the students, with where each stands
     A student       their marks in this class, any of them one tap from a change
     Announcements   one message to a class, and what is already posted

   The same calls and the same rules as the console: a typed mark is read by
   the console's own reader ("8", "85%", "B+", "M", "E"), a mark is written one
   student at a time, and the server decides what it will not take.
   Mounted by phone-staff.js: OPLO_PHONE_TEACH(P, F).
   ========================================================================== */
window.OPLO_PHONE_TEACH = function (P, F) {
  "use strict";

  var K = P.K, el = P.el, esc = P.esc, API = K.API, Dt = F.Dt;
  function X() { return F.x(); }
  function onOedu(act) { return !!(act && act.kind && act.kind !== "offline"); }
  function tone(c) { return P.toneOf((c && (c.subject || c.title)) || ""); }
  function num(n) { return n == null ? "" : String(Math.round(Number(n) * 100) / 100); }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b || a + "s"); }
  function dueText(a) { return a.dueAt ? (a.dueAt > Date.now() ? "due " : "was due ") + X().relDay(a.dueAt) : "no due date"; }
  function gradeTone(p) { return p == null ? "" : p >= 80 ? "ok" : p >= 70 ? "" : p >= 60 ? "orange" : "red"; }
  function dropBook(id) { F.bust(); }

  /* Where a student stands on one piece of work, said once. */
  var SAY = { handed: "Handed in", late: "Past due", missing: "Not handed in", open: "Not yet", marked: "Marked", excused: "Excused" };
  var ORDER = { handed: 0, late: 1, missing: 2, open: 3, marked: 4, excused: 5 };
  function stateOf(work, g, sub) {
    if (g && g.status === "excused") return "excused";
    if (g && g.score != null) return "marked";
    if (sub) return "handed";
    if (g && g.status === "missing") return "missing";
    return work.dueAt && work.dueAt <= Date.now() ? "late" : "open";
  }
  function markText(g) { return !g ? "" : g.mark ? g.mark : g.score != null ? num(g.score) : g.status === "missing" ? "M" : g.status === "excused" ? "Ex" : ""; }
  function isDone(st) { return st === "marked" || st === "excused" || st === "missing"; }

  /* What a typed mark means, or a sentence saying what would be understood. */
  function read(raw, work, policy) {
    var want = K.readEntry(raw, work.outOf, policy);
    return want;
  }
  var CANT = "A score, a percent like 85%, or a mark like B+.";

  /* ============================================================== To mark */
  function loadBooks() {
    return Dt.teaching().then(function (t) {
      return Promise.all(t.courses.map(function (c) {
        return X().settle(Dt.book(c.id)).then(function (r) { return { course: c, book: r.ok ? r.v : null }; });
      }));
    });
  }
  /* The console's own queue: what waits, and what is due later. */
  function queueOf(list) {
    var now = Date.now(), items = [], later = [];
    list.forEach(function (c) {
      var gb = c.book || {}, roster = gb.students || [], marks = {}, subs = {};
      (gb.grades || []).forEach(function (g) { marks[g.assignmentId + ":" + g.accountId] = g; });
      (gb.submissions || []).forEach(function (s) { subs[s.assignmentId + ":" + s.accountId] = s; });
      (gb.assignments || []).forEach(function (a) {
        var handed = 0, waiting = 0, notIn = 0;
        roster.forEach(function (s) {
          var g = marks[a.id + ":" + s.id], sub = subs[a.id + ":" + s.id];
          var scored = g && (g.score != null || g.status === "excused");
          var recorded = scored || (g && g.status === "missing");
          if (sub && !scored) handed++;
          else if (!recorded && a.dueAt && a.dueAt <= now) waiting++;
          else if (!recorded && !sub) notIn++;
        });
        var row = { course: c.course, book: c.book, a: a, handed: handed, waiting: waiting, notIn: notIn, total: roster.length, n: handed + waiting };
        if (row.n) items.push(row);
        else if (a.dueAt && a.dueAt > now && notIn) later.push(row);
      });
    });
    items.sort(function (x, y) { return (y.handed ? 1 : 0) - (x.handed ? 1 : 0) || (x.a.dueAt || 0) - (y.a.dueAt || 0); });
    later.sort(function (x, y) { return x.a.dueAt - y.a.dueAt; });
    return { now: items, later: later };
  }

  function buildToMark(L) {
    L.head({ eyebrow: "Teach", title: "To grade" });
    var host = L.add(el("div"));
    function load() {
    host.innerHTML = "";
    host.appendChild(P.skel(3, 78));
    var note = el("p", "ph-sub", "Reading your classes…");
    host.insertBefore(note, host.firstChild);
    loadBooks().then(function (list) {
      host.innerHTML = "";
      var q = queueOf(list.filter(function (c) { return c.book; }));
      if (!q.now.length && !q.later.length) {
        host.appendChild(P.empty("All caught up", "When students hand in work set on OEdu, or work passes its due date with nothing recorded, it waits here."));
        return;
      }
      var total = q.now.reduce(function (a, r) { return a + r.n; }, 0);
      var oldSub = L.titleEl.querySelector("p:not(.eb)");
      if (oldSub) oldSub.remove();
      L.titleEl.insertAdjacentHTML("beforeend", "<p>" + esc(q.now.length ? plural(total, "mark") + " waiting across " + plural(q.now.length, "piece") + " of work" : "Nothing is waiting.") + "</p>");
      function group(title, rows, isLater) {
        if (!rows.length) return;
        host.appendChild(P.sh(title));
        var g = P.group();
        rows.forEach(function (r) {
          var what = isLater ? r.notIn + " of " + r.total + " still to hand in"
            : [r.handed ? r.handed + " handed in on OEdu" : "", r.waiting ? r.waiting + " past due, nothing recorded" : ""].filter(Boolean).join(" · ");
          g.appendChild(P.row({ icon: onOedu(r.a.activity) ? "play" : "pencil", tone: tone(r.course), title: r.a.title, sub: r.course.title + " · " + dueText(r.a) + " · " + what,
            valueHtml: "<b>" + (isLater ? r.notIn : r.n) + "</b><small>" + (isLater ? "to come" : "to grade") + "</small>",
            go: function () { isLater ? F.openClass(r.course) : openMark(r.course, r.a, null); } }));
        });
        host.appendChild(g);
        P.rise([g], 0);
      }
      group("Waiting", q.now, false);
      group("Coming up", q.later, true);
      if (q.now.length && !L.dockEl) {
        var dock = el("div", "ph-dock");
        dock.appendChild(F.cta("Start grading", "", function () { openMark(L.first.course, L.first.a, null); }));
        L.dock(dock);
      }
      L.first = q.now[0];
      if (L.dockEl) L.dockEl.style.display = q.now.length ? "" : "none";
    }, function (e) { P.fail(host, e, load); });
    }
    L.onReveal = function () { F.bust(); load(); };
    load();
  }

  /* ============================================================== Marking */
  var ANON = false;
  function openMark(course, a, startId) {
    F.place("mark:" + a.id, a.title, 2, { tone: tone(course), label: a.title, back: { label: "Back", go: function () { if (K.hasBack()) K.back(); else K.openStaff("tograde"); } } },
      function (L) { buildMark(L, course, a, startId); });
  }

  function buildMark(L, course, a, startId) {
    var tn = tone(course), me = K.S.me;
    L.head({ eyebrow: course.title + (onOedu(a.activity) ? " · On OEdu" : ""), title: a.title, sub: "Out of " + num(a.outOf) + (a.dueAt ? " · " + dueText(a) : "") + (a.category ? " · " + a.category : "") });
    var host = L.add(el("div"));
    host.appendChild(P.skel(2, 150));
    API.grades.book(course.id).then(function (book) {
      host.innerHTML = "";
      var work = (book.assignments || []).filter(function (x) { return x.id === a.id; })[0] || a;
      var policy = book.course && book.course.policy;
      var marks = {}, subs = {}, roster = (book.students || []).slice();
      (book.grades || []).forEach(function (g) { if (g.assignmentId === a.id) marks[g.accountId] = g; });
      (book.submissions || []).forEach(function (s) { if (s.assignmentId === a.id) subs[s.accountId] = s; });
      var who = work.details && work.details.assignees;
      if (who) roster = roster.filter(function (s) { return who.indexOf(s.id) > -1; });
      function st(s) { return stateOf(work, marks[s.id], subs[s.id]); }
      function order() {
        roster.sort(function (x, y) { return ORDER[st(x)] - ORDER[st(y)] || (ANON ? String(x.id).localeCompare(String(y.id)) : String(x.name).localeCompare(String(y.name))); });
      }
      order();
      if (!roster.length) { host.appendChild(P.empty("Nobody is enrolled", "Enrol students and their work appears here.")); return; }
      var at = Math.max(0, roster.findIndex(function (s) { return startId ? s.id === startId : st(s) === "handed" || !isDone(st(s)); }));
      var mode = "one", late = false, openComment = false;
      function nm(s, i) { return ANON ? "Student " + (i + 1) : s.name; }
      function ava(s, i, size) { var n = P.shared.avatar(ANON ? "" : s.name, size); if (ANON) n.textContent = ""; return n; }

      // Progress.
      var prog = el("div", "ph-prog");
      host.appendChild(prog);
      function paintProg() {
        var done = roster.filter(function (s) { return isDone(st(s)); }).length;
        prog.innerHTML = "<span><b>" + done + "</b> of " + roster.length + " done</span>";
        prog.appendChild(P.meter(done / roster.length * 100, done === roster.length ? "ok" : ""));
      }
      var seg = P.seg([{ k: "one", label: "Mark" }, { k: "all", label: "Everyone" }], "one", function (k) { mode = k; paint(); });
      host.appendChild(seg);
      var names = P.btn("", P.icon("dots"), "Options", function () {
        var opt = P.sheet({ title: "Marking", tone: tn, body: function (b) {
          var g = P.group();
          g.appendChild(P.row({ icon: "person", tone: "gray", title: ANON ? "Show names" : "Hide names", sub: "Mark an essay for what it says", chev: false, go: function () { ANON = !ANON; order(); at = 0; opt.close(); paint(); } }));
          b.appendChild(g);
        } });
      });
      L.right.insertBefore(names, L.right.firstChild);
      var stage = el("div");
      host.appendChild(stage);

      // The card is built once. What changes from student to student is written
      // into it, so the keyboard never goes down between two marks.
      var card = el("div", "ph-mk t-" + tn);
      card.innerHTML = '<div class="who"></div><div class="ev"></div><div class="score"><input type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="–" aria-label="Mark"><span class="of"></span></div><div class="chips"></div><div class="cmrow"></div>';
      var whoEl = card.querySelector(".who"), evEl = card.querySelector(".ev"), inp = card.querySelector("input"), ofEl = card.querySelector(".of"), chipsEl = card.querySelector(".chips"), cmRow = card.querySelector(".cmrow");
      ofEl.textContent = "/ " + num(work.outOf);
      var cm = el("textarea");
      cm.rows = 3; cm.placeholder = "Comment — they see this with the mark";
      cmRow.appendChild(cm);
      var cmBtn = el("button", "ph-ch quiet", "Add a comment");
      cmBtn.type = "button";
      cmBtn.addEventListener("click", function () { openComment = !openComment; paintComment(); if (openComment) cm.focus(); });
      cmRow.insertBefore(cmBtn, cm);
      function paintComment() { cm.style.display = openComment ? "block" : "none"; cmBtn.textContent = openComment ? "Hide comment" : (cm.value.trim() ? "Edit comment" : "Add a comment"); }

      function chip(text, go, cls) {
        var b = el("button", "ph-ch" + (cls ? " " + cls : ""), esc(text));
        b.type = "button";
        b.addEventListener("mousedown", function (e) { e.preventDefault(); });
        b.addEventListener("touchstart", function (e) { e.preventDefault(); b.click(); }, { passive: false });
        b.addEventListener("click", go);
        chipsEl.appendChild(b);
        return b;
      }

      var dock = el("div", "ph-dock");
      var prev = P.btn("", P.icon("left"), "Previous student", function () { go(at - 1); });
      var next = P.btn("", P.icon("right"), "Next student", function () { go(at + 1); });
      var saveBtn = F.cta("Save and next", "", function () { saveTyped(); });
      [prev, next, saveBtn].forEach(function (b) { b.addEventListener("mousedown", function (e) { e.preventDefault(); }); b.addEventListener("touchstart", function (e) { e.preventDefault(); b.click(); }, { passive: false }); });
      dock.appendChild(prev); dock.appendChild(saveBtn); dock.appendChild(next);
      L.dock(dock);

      function go(i) { if (i < 0 || i >= roster.length) return; at = i; late = false; paintCard(true); }
      function nextOpen(from) {
        for (var k = 1; k <= roster.length; k++) { var j = (from + k) % roster.length; if (!isDone(st(roster[j]))) return j; }
        return -1;
      }

      function paintCard(focus) {
        var s = roster[at], g = marks[s.id], sub = subs[s.id], state = st(s);
        whoEl.innerHTML = "";
        whoEl.appendChild(ava(s, at, 64));
        whoEl.appendChild(el("h2", null, esc(nm(s, at))));
        whoEl.appendChild(el("p", null, "<span class='ph-pill " + (state === "marked" ? "green" : state === "late" || state === "missing" ? "orange" : state === "handed" ? "blue" : "") + "'>" + esc(SAY[state]) + "</span>" +
          (sub ? " <small>" + esc(X().relDay(sub.submittedAt)) + "</small>" : "") + "<small class='pos'>" + (at + 1) + " of " + roster.length + "</small>"));
        if (onOedu(work.activity)) {
          var res = sub && sub.result;
          evEl.innerHTML = "<b>On OEdu</b><span>" + (res ? (res.pct != null ? esc(res.pct + "%") : res.score != null ? esc(num(res.score) + (res.outOf ? " / " + num(res.outOf) : "")) : "Done") + " · " + esc(res.detail || "Finished on OEdu.") : esc((ANON ? "This student" : s.firstName || s.name) + " hasn’t finished it on OEdu.")) + "</span>";
          evEl.style.display = "";
        } else evEl.style.display = "none";
        inp.value = g && g.mark ? g.mark : g && g.score != null ? String(g.score) : "";
        cm.value = g && g.feedback ? g.feedback : "";
        openComment = !!cm.value.trim();
        paintComment();
        chipsEl.innerHTML = "";
        chip("Full marks", function () { inp.value = num(work.outOf); inp.focus(); });
        if (work.outOf > 0) chip("0", function () { inp.value = "0"; inp.focus(); });
        var res2 = sub && sub.result, suggest = res2 ? (res2.pct != null ? Math.round(res2.pct / 100 * work.outOf * 10) / 10 : res2.score != null && res2.outOf ? Math.round(res2.score / res2.outOf * work.outOf * 10) / 10 : null) : null;
        if (suggest != null) chip("Use OEdu’s " + num(suggest), function () { inp.value = String(suggest); inp.focus(); }, "hi");
        var codes = (policy && policy.marks) || [];
        codes.slice(0, 5).forEach(function (m) { chip(m.code, function () { inp.value = m.code; inp.focus(); }); });
        if (work.dueAt) {
          var lb = chip(late ? "Late ✓" : "Late", function () { late = !late; lb.textContent = late ? "Late ✓" : "Late"; lb.classList.toggle("on", late); }, late ? "on" : "");
        }
        chip("Not handed in", function () { saveWith({ status: "missing", score: null, mark: null }, true); }, "warn");
        chip("Excused", function () { saveWith({ status: "excused", score: null, mark: null }, true); });
        prev.disabled = at === 0; next.disabled = at === roster.length - 1;
        paintProg();
        if (focus) { inp.focus(); inp.select(); }
      }

      function saveTyped() {
        var t = inp.value.trim();
        if (!t) { P.toast("Type a mark, or choose Not handed in or Excused."); return; }
        var want = read(t, work, policy);
        if (!want) { P.toast(CANT); return; }
        saveWith({ status: want.status, score: want.score, late: want.late || late, mark: want.mark || null }, true);
      }
      var busy = false;
      function saveWith(patch, advance) {
        if (busy) return;
        busy = true;
        var s = roster[at];
        patch.feedback = cm.value.trim() || null;
        return API.grades.put(work.id, s.id, patch).then(function (r) {
          busy = false;
          marks[s.id] = r.grade;
          dropBook(course.id);
          var j = advance ? nextOpen(at) : at;
          if (advance && j < 0) { complete(); return; }
          if (advance) { at = j; late = false; }
          paintCard(true);
          flash();
        }, function (e) { busy = false; P.toast(e && e.message ? e.message : "The server refused that."); });
      }
      function flash() { card.classList.remove("saved"); void card.offsetWidth; card.classList.add("saved"); }
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); saveTyped(); } });

      function complete() {
        var sum = 0, n = 0;
        roster.forEach(function (s) { var g = marks[s.id]; if (g && g.score != null && work.outOf > 0) { sum += g.score / work.outOf * 100; n++; } });
        var avg = n ? Math.round(sum / n * 10) / 10 : null;
        stage.innerHTML = "";
        inp.blur();
        dock.style.display = "none";
        var d = el("div", "ph-big t-" + tn);
        d.style.marginTop = "18px";
        d.appendChild(P.ring(avg == null ? 0 : avg, { size: 118, stroke: 10, tone: tn, center: avg == null ? "<small class='cap'>No marks</small>" : "<b>" + esc(num(avg)) + "<span class='pc'>%</span></b><small class='cap'>average</small>" }));
        var tx = el("div", "tx");
        tx.innerHTML = "<h2>All marked</h2><p>" + esc(plural(roster.length, "student") + " done on " + a.title + ".") + "</p>";
        d.appendChild(tx);
        stage.appendChild(d);
        var row = el("div", "ph-btnrow");
        row.appendChild(F.cta("Review marks", "quiet", function () { dock.style.display = ""; mode = "all"; seg.set("all"); paint(); }));
        row.appendChild(F.cta("Done", "", function () { P.close(); }));
        stage.appendChild(row);
        paintProg();
      }

      function paintAll() {
        stage.innerHTML = "";
        var g = P.group();
        g.style.marginTop = "14px";
        roster.forEach(function (s, i) {
          var state = st(s), mk = markText(marks[s.id]);
          var r = el("button", "ph-row has-ic");
          r.type = "button";
          r.appendChild(ava(s, i, 36));
          r.appendChild(el("span", "t", "<b>" + esc(nm(s, i)) + "</b><small>" + esc(SAY[state]) + "</small>"));
          r.appendChild(el("span", "v", mk ? "<b>" + esc(mk) + "</b>" : ""));
          r.insertAdjacentHTML("beforeend", P.chev);
          r.addEventListener("click", function () { at = i; late = false; mode = "one"; seg.set("one"); paint(true); });
          g.appendChild(r);
        });
        stage.appendChild(g);
        dock.style.display = "none";
        paintProg();
      }
      function paint(focus) {
        if (mode === "all") { paintAll(); return; }
        dock.style.display = "";
        stage.innerHTML = "";
        stage.appendChild(card);
        paintCard(focus !== false);
      }
      paint(false);
    }, function (e) { P.fail(host, e, function () { L.el.remove(); openMark(course, a, startId); }); });
  }

  /* One mark, changed from a sheet: for a student's marks, where no queue is running. */
  function markSheet(course, book, work, s, g, done) {
    var policy = book.course && book.course.policy;
    var inp = el("input"); inp.type = "text"; inp.inputMode = "decimal"; inp.autocomplete = "off"; inp.setAttribute("aria-label", "Mark");
    inp.value = g && g.mark ? g.mark : g && g.score != null ? String(g.score) : "";
    var cm = el("textarea"); cm.rows = 3; cm.value = g && g.feedback ? g.feedback : ""; cm.placeholder = "Comment — they see this with the mark";
    var ctl = P.sheet({ title: work.title, sub: s.name + " · out of " + num(work.outOf), tone: "indigo", body: function (b) {
      var gp = P.group();
      var l = el("label", "ph-field", "<small>Mark out of " + esc(num(work.outOf)) + "</small>");
      l.appendChild(inp);
      gp.appendChild(l);
      var l2 = el("label", "ph-field", "<small>Comment</small>");
      l2.appendChild(cm);
      gp.appendChild(l2);
      b.appendChild(gp);
      var row = el("div", "ph-btnrow");
      function save(patch) {
        patch.feedback = cm.value.trim() || null;
        API.grades.put(work.id, s.id, patch).then(function (r) { dropBook(course.id); ctl.close(); P.toast("Saved"); if (done) done(r.grade); }, function (e) { P.toast(e && e.message ? e.message : "The server refused that."); });
      }
      row.appendChild(F.cta("Save", "", function () {
        var t = inp.value.trim();
        if (!t) { P.toast("Type a mark, or choose Not handed in or Excused."); return; }
        var want = read(t, work, policy);
        if (!want) { P.toast(CANT); return; }
        save({ status: want.status, score: want.score, late: want.late, mark: want.mark || null });
      }));
      b.appendChild(row);
      var row2 = el("div", "ph-btnrow");
      row2.style.marginTop = "10px";
      row2.appendChild(F.cta("Not handed in", "quiet", function () { save({ status: "missing", score: null, mark: null }); }));
      row2.appendChild(F.cta("Excused", "quiet", function () { save({ status: "excused", score: null, mark: null }); }));
      b.appendChild(row2);
    } });
    setTimeout(function () { try { inp.focus(); inp.select(); } catch (e) { /* old browsers */ } }, 400);
  }

  /* ================================================================= A class */
  F.openClass = function (c) {
    F.place("class:" + c.id, c.title, 2, { tone: tone(c), label: c.title, back: F.up(F.isAdmin() ? "Classes" : "Classes", "courses") }, function (L) { buildClass(L, c); });
  };
  function buildClass(L, c) {
    var tn = tone(c);
    var lead = el("div", "ph-lead t-" + tn);
    lead.innerHTML = '<div class="row"><div><p class="k">' + esc(c.subject || "Class") + "</p><h2>" + esc(c.title) + '</h2><p class="s">' + esc(plural(c.students, "student")) + '</p></div><span class="ringslot"></span></div><div class="chips"></div>';
    lead.querySelector(".ringslot").replaceWith(P.ring(c.average == null ? 0 : c.average, { size: 104, stroke: 9, dark: true, center: c.average == null ? "<small>No marks</small>" : "<b>" + esc(num(c.average)) + "<span class='pc'>%</span></b><small>average</small>" }));
    var chips = lead.querySelector(".chips");
    if (c.unmarked) chips.appendChild(el("span", null, c.unmarked + " to grade"));
    if (c.atRisk) chips.appendChild(el("span", null, c.atRisk + " below a pass"));
    if (!chips.children.length) chips.remove();
    L.titleEl = null;
    L.barTitle.textContent = c.title;
    L.add(lead);

    var qa = el("div", "ph-qa");
    function qaBtn(icon, label, go) { var b = el("button", "ph-q", "<span>" + P.icon(icon) + "</span><b>" + esc(label) + "</b>"); b.type = "button"; b.addEventListener("click", go); qa.appendChild(b); }
    qaBtn("check", "Register", function () { F.openRoll({ id: c.id, title: c.title, subject: c.subject }, X().todayIso()); });
    qaBtn("megaphone", "Announce", function () { openAnnounce(c); });
    qaBtn("mail", "Message", function () { P.shared.compose(null, { audience: "course", courseId: c.id }); });
    L.add(qa);

    var host = L.add(el("div"));
    host.appendChild(P.skel(3, 66));
    Dt.book(c.id).then(function (book) {
      host.innerHTML = "";
      var cols = {};
      (book.columns || []).forEach(function (x) { cols[x.assignmentId] = x; });
      var seg = P.seg([{ k: "work", label: "Work", n: (book.assignments || []).length }, { k: "students", label: "Students", n: (book.students || []).length }], (book.assignments || []).length ? "work" : "students", function (k) { show(k); });
      host.appendChild(seg);
      var body = el("div");
      host.appendChild(body);
      function show(k) { body.innerHTML = ""; if (k === "work") drawWork(); else drawStudents(); }
      function drawWork() {
        var list = (book.assignments || []).slice().sort(function (x, y) { return (y.dueAt || 0) - (x.dueAt || 0); });
        if (!list.length) { body.appendChild(P.empty("No work set yet", "Set work on the full console and it appears here.")); return; }
        body.appendChild(el("div")).style.height = "14px";
        var g = P.group();
        list.forEach(function (a) {
          var col = cols[a.id] || {};
          var parts = [];
          if (col.unmarked) parts.push("<span class='ph-pill orange'>" + col.unmarked + " to grade</span>");
          g.appendChild(P.row({ icon: onOedu(a.activity) ? "play" : "pencil", tone: tn, title: a.title, sub: [a.category, "out of " + num(a.outOf), dueText(a)].filter(Boolean).join(" · "),
            valueHtml: (col.average != null && col.marked ? "<b>" + esc(num(col.average)) + "%</b><small>average</small>" : "<small>" + (col.marked ? col.marked + " marked" : "Not marked") + "</small>") + parts.join(""),
            go: function () { openMark(c, a, null); } }));
        });
        body.appendChild(g);
      }
      function drawStudents() {
        var rows = (book.students || []).slice().sort(function (x, y) { return String(x.name).localeCompare(String(y.name)); });
        if (!rows.length) { body.appendChild(P.empty("Nobody is enrolled", "Enrol students on the full console.")); return; }
        body.appendChild(el("div")).style.height = "14px";
        var g = P.group();
        rows.forEach(function (s) {
          var sm = (book.summaries || {})[s.id] || {}, p = sm.percent;
          var r = el("button", "ph-row has-ic");
          r.type = "button";
          r.appendChild(P.shared.avatar(s.name, 36));
          r.appendChild(el("span", "t", "<b>" + esc(s.name) + "</b><small>" + esc(sm.missingCount ? sm.missingCount + " missing" : p == null ? "No marks yet" : plural(sm.itemCount || 0, "mark")) + "</small>"));
          r.appendChild(el("span", "v", p == null ? "" : "<span class='ph-gr " + gradeTone(p) + "'>" + esc(sm.letter || "") + "</span><small>" + esc(num(p)) + "%</small>"));
          r.insertAdjacentHTML("beforeend", P.chev);
          r.addEventListener("click", function () { openStudentMarks(c, s); });
          g.appendChild(r);
        });
        body.appendChild(g);
      }
      show(seg.cur);
    }, function (e) { P.fail(host, e, function () { L.el.remove(); F.openClass(c); }); });
  }

  /* One student's marks in one class. */
  function openStudentMarks(c, s) {
    F.place("marks:" + c.id + ":" + s.id, s.name, 3, { tone: tone(c), label: s.name, back: { label: c.title, go: function () { if (K.hasBack()) K.back(); else F.openClass(c); } } }, function (L) { buildStudentMarks(L, c, s); });
  }
  function buildStudentMarks(L, c, s) {
    var tn = tone(c);
    L.head({ eyebrow: c.title, title: s.name });
    var host = L.add(el("div"));
    host.appendChild(P.skel(3, 66));
    function load() {
      host.innerHTML = "";
      host.appendChild(P.skel(3, 66));
      Dt.book(c.id, true).then(function (book) {
        host.innerHTML = "";
        var sm = (book.summaries || {})[s.id] || {}, p = sm.percent;
        var big = el("div", "ph-big t-" + tn);
        big.appendChild(P.ring(p == null ? 0 : p, { size: 118, stroke: 10, tone: tn, center: p == null ? "<small class='cap'>No marks</small>" : "<b>" + esc(num(p)) + "<span class='pc'>%</span></b><small class='cap'>" + esc(sm.letter || "") + "</small>" }));
        var tx = el("div", "tx");
        tx.innerHTML = "<h2>" + esc(p == null ? "No marks yet" : "Grade in this class") + "</h2><p>" + esc([sm.itemCount ? plural(sm.itemCount, "mark") + " counted" : "", sm.missingCount ? sm.missingCount + " missing" : ""].filter(Boolean).join(" · ") || "Nothing is counted yet.") + "</p>";
        big.appendChild(tx);
        host.appendChild(big);
        P.rise([big], 0);
        var marks = {};
        (book.grades || []).forEach(function (g) { if (g.accountId === s.id) marks[g.assignmentId] = g; });
        var list = (book.assignments || []).slice().sort(function (x, y) { return (y.dueAt || 0) - (x.dueAt || 0); });
        host.appendChild(P.sh("Marks"));
        var g = P.group();
        list.forEach(function (a) {
          var mk = marks[a.id], state = stateOf(a, mk, null), txt = markText(mk);
          g.appendChild(P.row({ dot: true, tone: tn, title: a.title, sub: [a.category, dueText(a), mk && mk.feedback ? "Comment" : ""].filter(Boolean).join(" · "),
            valueHtml: txt ? "<b>" + esc(txt) + (mk && mk.score != null ? "<small style='display:inline;color:var(--ph-label-3)'> / " + esc(num(a.outOf)) + "</small>" : "") + "</b>" + (mk && mk.late ? "<small>Late</small>" : "") : "<small>" + esc(SAY[state]) + "</small>",
            go: function () { markSheet(c, book, a, s, mk, load); } }));
        });
        if (!list.length) g.appendChild(el("div", "ph-prose", "No work has been set in this class."));
        host.appendChild(g);
        host.appendChild(P.note("Tap a mark to change it. A change is on the record: the old mark and the new one both stay."));
      }, function (e) { P.fail(host, e, load); });
    }
    load();
  }

  /* ========================================================= Announcements */
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function openAnnounce(course) {
    F.place("announce" + (course ? ":" + course.id : ""), "Announcements", 1, { tone: "orange", label: "Announcements" }, function (L) { buildAnnounce(L, course); });
  }
  function buildAnnounce(L, first) {
    L.head({ eyebrow: "Communicate", title: "Announcements", sub: "One message to everyone in a class. Students see it on their School page the moment it is posted." });
    var host = L.add(el("div"));
    host.appendChild(P.skel(2, 80));
    Dt.teaching().then(function (t) {
      host.innerHTML = "";
      var courses = t.courses.slice().sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
      if (!courses.length) { host.appendChild(P.empty("You aren’t teaching any classes yet", "")); return; }
      var cur = (first && courses.filter(function (c) { return c.id === first.id; })[0]) || courses[0];
      var pick = el("button", "ph-pickrow");
      pick.type = "button";
      function paintPick() { pick.innerHTML = "<small>To everyone in</small><b>" + esc(cur.title) + "</b>" + P.chev; }
      paintPick();
      pick.addEventListener("click", function () {
        var ctl = P.sheet({ title: "Which class?", tone: "orange", body: function (b) {
          var g = P.group();
          courses.forEach(function (c) { g.appendChild(P.row({ dot: true, tone: tone(c), title: c.title, valueHtml: c.id === cur.id ? "✓" : "<small>" + esc(plural(c.students, "student")) + "</small>", chev: false, go: function () { cur = c; paintPick(); ctl.close(); drawFeed(); } })); });
          b.appendChild(g);
        } });
      });
      host.appendChild(pick);
      var row = el("div", "ph-btnrow");
      row.appendChild(F.cta("New announcement", "", function () { composeSheet(); }));
      host.appendChild(row);
      var feed = el("div");
      host.appendChild(feed);
      function composeSheet() {
        var title = el("input"); title.type = "text"; title.maxLength = 160; title.placeholder = "Quiz on Friday";
        var text = el("textarea"); text.rows = 5; text.maxLength = 2000; text.placeholder = "What they need to know";
        var ctl = P.sheet({ title: "New announcement", sub: "To everyone in " + cur.title, tone: "orange", body: function (b) {
          var g = P.group();
          g.appendChild(F.field("Headline", title));
          g.appendChild(F.field("Message", text));
          b.appendChild(g);
          var r = el("div", "ph-btnrow");
          var go = F.cta("Post", "", function () {
            if (!title.value.trim()) { P.toast("Give it a headline."); return; }
            go.disabled = true;
            API.courses.putDoc(cur.id, "announce", newId(), { title: title.value.trim().slice(0, 160), text: text.value.trim().slice(0, 2000), at: Date.now(), by: K.S.me.name }).then(function () {
              P.toast("Posted to " + cur.title + "."); ctl.close(); drawFeed();
            }, function (e) { go.disabled = false; P.toast(e && e.message ? e.message : "That wasn’t posted."); });
          });
          r.appendChild(go);
          b.appendChild(r);
        } });
        setTimeout(function () { try { title.focus(); } catch (e) { /* old browsers */ } }, 420);
      }
      function drawFeed() {
        feed.innerHTML = "";
        feed.appendChild(P.skel(2, 90));
        API.courses.docs(cur.id, "announce").then(function (list) {
          feed.innerHTML = "";
          if (!list.length) { feed.appendChild(P.empty("Nothing posted yet", "Students see an announcement as soon as you post it.")); return; }
          feed.appendChild(P.sh("Posted"));
          list.sort(function (a, b) { return (b.body.at || 0) - (a.body.at || 0); }).forEach(function (d) {
            var card = el("div", "ph-post");
            card.innerHTML = "<div class='h'><b>" + esc(d.body.title) + "</b><span>" + esc(X().relDay(d.body.at || d.updatedAt)) + "</span></div>" + (d.body.text ? "<p>" + esc(d.body.text) + "</p>" : "") + "<small>" + esc(d.body.by || "") + "</small>";
            var rm = el("button", "ph-link", "Take down");
            rm.type = "button";
            rm.addEventListener("click", function () {
              var ctl = P.sheet({ title: "Take this down?", sub: "Students stop seeing “" + d.body.title + "”.", tone: "gray", body: function (b) {
                var r = el("div", "ph-btnrow");
                r.appendChild(F.cta("Keep it", "quiet", function () { ctl.close(); }));
                r.appendChild(F.cta("Take down", "danger", function () { API.courses.removeDoc(cur.id, "announce", d.id).then(function () { ctl.close(); P.toast("Taken down"); drawFeed(); }, function (e) { P.toast(e && e.message ? e.message : "That didn’t work."); }); }));
                b.appendChild(r);
              } });
            });
            card.appendChild(rm);
            feed.appendChild(card);
          });
        }, function (e) { P.fail(feed, e, drawFeed); });
      }
      drawFeed();
    }, function (e) { P.fail(host, e, function () { L.el.remove(); K.openStaff("announcements"); }); });
  }

  /* ---------------------------------------------------------------- Routes */
  F.routes.tograde = function () { if (F.isAdmin()) return false; F.layer("tograde", 1, "pink", "To grade", buildToMark); return true; };
  F.routes.announcements = function () { if (F.isAdmin()) return false; openAnnounce(null); return true; };
  F.routes.roster = function () {
    if (F.isAdmin()) return false;
    F.layer("gradebook", 1, "indigo", "Gradebook", function (L) {
      L.head({ eyebrow: "Teach", title: "Gradebook" });
      var host = L.add(el("div"));
      host.appendChild(P.skel(4, 72));
      Dt.teaching().then(function (r) {
        host.innerHTML = "";
        var list = r.courses.slice().sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
        if (!list.length) { host.appendChild(P.empty("No classes yet", "An administrator enrols you as a teacher on a course.")); return; }
        host.appendChild(el("p", "ph-sub", "Choose a class."));
        var g = P.group();
        list.forEach(function (c) {
          g.appendChild(P.row({ dot: true, tone: tone(c), title: c.title, sub: [plural(c.students, "student"), c.unmarked ? c.unmarked + " to grade" : "", c.atRisk ? c.atRisk + " below a pass" : ""].filter(Boolean).join(" · "),
            valueHtml: c.average != null ? "<b>" + esc(num(c.average)) + "%</b><small>average</small>" : "", go: function () { F.openClass(c); } }));
        });
        host.appendChild(g);
      }, function (e) { P.fail(host, e, function () { L.el.remove(); K.openStaff("roster"); }); });
    });
    return true;
  };
  F.openMark = openMark;
};
