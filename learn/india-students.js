/* ==========================================================================
   OEdu — an Indian school's students, and one student.

   The office finds a child by name, admission number or section, and by what
   is wrong with their record or their attendance; it does not browse
   courses. So this is a directory of every child the school has, once, with
   the filters an office actually uses (under 75%, early warning, consent not
   given, a record a board's list would refuse), and a profile that holds
   the whole child in one place: who they are, where they sit, who to call,
   the numbers a board asks for, how often they are in, and how they did.

   What it reads is what the console already reads:
     /india/students      the child's record, with the class and roll
     /register/watch      the 75% rule's count for every child
     /register/early-warning
     /students/:id/hpc    attendance and exam summary
     /students/:id/report-cards
     /attendance?accountId   the days, one by one
   The profile's edit form is india.js's. Dates are DD/MM/YYYY.

   Mounted by app.js with the console kit: OPLO_INDIA_STUDENTS(kit) →
   { directory, profile }.
   ========================================================================== */
window.OPLO_INDIA_STUDENTS = function (K) {
  "use strict";

  var el = K.el, esc = K.esc, API = K.API, IN = API.india, RG = API.register, U = K.ui;
  var chip = U.chip, none = U.none, num = U.num, plural = U.plural, dmy = U.dmy;

  function soft(p) { return p.catch(function () { return null; }); }
  function initials(n) { return String(n || "?").split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase(); }
  function hueOf(n) { var h = 0; for (var i = 0; i < String(n).length; i++) h = (h * 31 + String(n).charCodeAt(i)) % 8; return h; }
  function avatar(n, cls) { return '<span class="cx-av ' + (cls || "") + '" data-h="' + hueOf(n) + '">' + esc(initials(n)) + "</span>"; }
  function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function age(dob) {
    if (!dob) return null;
    var b = new Date(dob + "T12:00:00"), n = new Date(), a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  }
  var BOARD = { IX: 1, X: 1, XI: 1, XII: 1 };

  /* What stands between this child and a list a board will take. The same rule the
     server's compliance page applies (api/src/services/india.js problemsOf), read here
     from the record already in hand so a directory of 300 does not ask 300 times. */
  function gaps(s) {
    var out = [];
    function add(level, text) { out.push({ level: level, text: text }); }
    if (!s.pen) add("blocks", "No PEN");
    if (!s.dob) add("blocks", "No date of birth");
    if (!s.gender) add("blocks", "No gender");
    if (!s.category) add("blocks", "No category");
    if (BOARD[s.grade] && !s.apaar) add("blocks", "No APAAR ID");
    if (!s.fatherName && !s.motherName) add("fix", "No parent's name");
    if (s.consentStatus !== "verified" && s.consentStatus !== "withdrawn") add("fix", "Consent not on file");
    if (s.cwsn === 1 && !s.disability) add("fix", "Special needs: kind not named");
    return out;
  }

  /* ============================================================= Directory */
  var ST = { q: "", classId: "", filter: "all", shown: 60 };

  function directory(v) {
    var P = K.cxPage(v, "Students", "Student profile",
      "Every child in the school, once. Find one by name, admission number or section, narrow to who needs something, and open them for the whole picture.");
    var metrics = el("div"), bar = el("div", "is-bar"), slot = el("div", "en-slot");
    v.appendChild(metrics); v.appendChild(bar); v.appendChild(slot);
    slot.appendChild(el("div", "admin-loading", "Reading the school's children…"));

    Promise.all([IN.students(), soft(RG.watch()), soft(RG.early()), IN.classes()]).then(function (res) {
      var kids = (res[0].students || []).filter(function (s) { return !s.leftOn; }), watch = res[1], early = res[2], classes = res[3].classes || [];   // a child who has left is not in the school's list
      var wby = {}, eby = {};
      ((watch && watch.students) || []).forEach(function (w) { wby[w.id] = w; });
      ((early && early.students) || []).forEach(function (e) { eby[e.id] = e; });
      kids.forEach(function (s) { s._gaps = gaps(s); s._w = wby[s.id] || null; s._e = eby[s.id] || null; });
      slot.innerHTML = "";

      var girls = kids.filter(function (s) { return s.gender === "F"; }).length;
      var below = kids.filter(function (s) { return s._w && s._w.status === "below"; }).length;
      var complete = kids.filter(function (s) { return !s._gaps.length; }).length;
      K.cxMetrics(metrics, [
        { label: "Children", value: num(kids.length), note: plural(classes.length, "section") },
        { label: "Girls", value: kids.length ? Math.round(girls / kids.length * 100) : null, unit: "%", note: num(girls) + " of " + num(kids.length), line: kids.length ? girls / kids.length * 100 : null },
        { label: "Under 75%", value: below, bad: true, note: "attendance this year" },
        { label: "Records complete", value: kids.length ? Math.round(complete / kids.length * 100) : null, unit: "%", note: num(kids.length - complete) + " to fix", line: kids.length ? complete / kids.length * 100 : null }
      ]);

      var FILTERS = [
        ["all", "Everyone", function () { return true; }],
        ["below", "Under 75%", function (s) { return s._w && s._w.status === "below"; }],
        ["early", "Early warning", function (s) { return s._e && (s._e.level === "high" || s._e.level === "medium"); }],
        ["consent", "Consent pending", function (s) { return s.consentStatus === "pending" || !s.consentStatus; }],
        ["gaps", "Record gaps", function (s) { return s._gaps.some(function (g) { return g.level === "blocks"; }); }],
        ["needs", "Special needs", function (s) { return s.cwsn === 1; }]
      ];
      var fn = {}; FILTERS.forEach(function (f) { fn[f[0]] = f[2]; });
      var filters = K.cnFilters(FILTERS.map(function (f) { return { k: f[0], name: f[1], n: kids.filter(f[2]).length }; }), ST.filter, function (k) { ST.filter = k; ST.shown = 60; draw(); filters.mark(k); });
      var search = el("input", "cn-search"); search.type = "search"; search.placeholder = "Name, admission no. or roll"; search.value = ST.q;
      var sel = el("select", "cx-select");
      sel.innerHTML = '<option value="">All sections</option>' + classes.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === ST.classId ? " selected" : "") + ">" + esc(c.label) + " (" + c.strength + ")</option>"; }).join("");
      bar.appendChild(filters); bar.appendChild(sel); bar.appendChild(search);

      var host = el("div"); slot.appendChild(host);
      function draw() {
        var q = ST.q.trim().toLowerCase();
        var list = kids.filter(function (s) {
          if (ST.classId && s.classId !== ST.classId) return false;
          if (!fn[ST.filter](s)) return false;
          return !q || (s.name || "").toLowerCase().indexOf(q) > -1 || (s.admissionNo || "").toLowerCase().indexOf(q) > -1 || String(s.rollNo || "") === q;
        });
        host.innerHTML = "";
        if (!list.length) { host.appendChild(K.cnEmpty("Nobody matches.", "Clear the search or pick another filter.")); return; }
        var t = K.cnTable([{ label: "Child", w: "minmax(220px, 1.5fr)" }, { label: "Class", w: "100px" }, { label: "Category", w: "100px" }, { label: "House", w: "110px" },
          { label: "Attendance", w: "minmax(120px, .9fr)" }, { label: "Record", w: "130px" }]);
        list.slice(0, ST.shown).forEach(function (s) {
          var w = s._w, p = w && w.percent != null && w.total >= 10 ? w.percent : null;
          var att = p == null ? none() : '<span class="is-att ' + (w.status === "below" ? "lo" : w.status === "watch" ? "mid" : "hi") + '"><i style="width:' + Math.min(100, p) + '%"></i></span><b>' + p + "%</b>";
          var rec = !s._gaps.length ? chip("green", "Complete") : s._gaps.some(function (g) { return g.level === "blocks"; }) ? chip("red", plural(s._gaps.length, "gap")) : chip("orange", plural(s._gaps.length, "to fix"));
          t.row(['<span class="is-who">' + avatar(s.name) + "<span><b>" + esc(s.name) + "</b><small>" + esc(s.admissionNo || "No admission no.") + "</small></span></span>",
            s.classLabel ? "<b>" + esc(s.classLabel) + "</b>" + (s.rollNo ? "<small class='is-roll'> · " + s.rollNo + "</small>" : "") : none(),
            s.category ? '<span class="is-cat" data-c="' + esc(String(s.category).replace(/\W/g, "")) + '">' + esc(s.category) + "</span>" : none(),
            s.house ? '<span class="is-house" data-h="' + hueOf(s.house) + '">' + esc(s.house) + "</span>" : none(), att, rec],
            function () { profile(s.id, function () { K.openAdmin(true, "students"); }); }, s.id);
        });
        host.appendChild(t);
        var foot = el("div", "is-foot");
        foot.appendChild(el("span", null, "Showing " + Math.min(ST.shown, list.length) + " of " + num(list.length)));
        if (list.length > ST.shown) {
          var more = U.btn("Show more", "", function () { ST.shown += 60; draw(); });
          foot.appendChild(more);
        }
        host.appendChild(foot);
      }
      var timer = null;
      search.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { ST.q = search.value; ST.shown = 60; draw(); }, 140); });
      sel.addEventListener("change", function () { ST.classId = sel.value; ST.shown = 60; draw(); });
      draw();
      if (K.S.studentPick) { var pick = K.S.studentPick; K.S.studentPick = null; profile(pick, function () { K.openAdmin(true, "students"); }); }
    }, function (e) { K.failed(slot, e, function () { K.openAdmin(true, "students"); }); });
  }

  /* ============================================================== Profile */
  function kv(label, value) { return '<div class="is-kv"><span>' + esc(label) + "</span><b>" + (value == null || value === "" ? "<i>—</i>" : value) + "</b></div>"; }
  function phone(n) { return n ? '<a href="tel:' + esc(String(n).replace(/\s/g, "")) + '">' + esc(n) + "</a>" : ""; }
  function wa(n) { var d = String(n || "").replace(/\D/g, ""); return d.length >= 10 ? ' <a class="is-wa" target="_blank" rel="noopener" href="https://wa.me/' + (d.length === 10 ? "91" + d : d) + '">WhatsApp</a>' : ""; }

  function profile(id, done) {
    var box = el("div", "isp");
    box.appendChild(el("div", "admin-loading", "Opening the profile…"));
    var sheet = K.cxSheet(box);
    var year0 = (function () { var d = new Date(), y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return y + "-04-01"; })();

    IN.student(id).then(function (r) {
      var s = r.student;
      Promise.all([soft(IN.classHistory(id)), s.classId ? soft(RG.watch({ classId: s.classId })) : Promise.resolve(null), soft(API.exams.reportCards(id)),
        soft(API.attendance.list({ accountId: id, from: year0, to: ymd(new Date()) })), soft(API.items.list({ subjectId: id, limit: 100 })), soft(API.register.early(s.classId))]).then(function (x) {
        var hist = x[0], wRows = x[1], cards = x[2], marks = x[3] || [], notes = x[4] || [], early = x[5];
        var w = wRows && (wRows.students || []).filter(function (k) { return k.id === id; })[0];
        var e = early && (early.students || []).filter(function (k) { return k.id === id; })[0];
        draw(s, r.problems || [], hist, w, cards && cards.reportCards || [], marks, notes, e);
      });
    }, function (e) { box.innerHTML = ""; box.appendChild(el("p", "en-note", esc(e && e.message ? e.message : "That did not load."))); });

    function draw(s, problems, hist, w, cards, marks, notes, ew) {
      box.innerHTML = "";
      var a = age(s.dob);
      var head = el("header", "isp-head");
      head.dataset.hue = ["indigo", "violet", "blue", "sky", "emerald", "rose", "amber", "fuchsia"][hueOf(s.name)];
      head.innerHTML = avatar(s.name, "big") +
        '<div class="isp-id"><h2>' + esc(s.name) + "</h2><p>" + (s.classLabel ? "Class <b>" + esc(s.classLabel) + "</b>" : "No section") + (s.rollNo ? " · Roll " + s.rollNo : "") +
        (s.admissionNo ? " · Adm. " + esc(s.admissionNo) : "") + (a != null ? " · " + a + " years" : "") + "</p>" +
        '<div class="isp-chips">' + (s.house ? '<span class="is-house" data-h="' + hueOf(s.house) + '">' + esc(s.house) + " House</span>" : "") +
        (s.category ? '<span class="is-cat" data-c="' + esc(String(s.category).replace(/\W/g, "")) + '">' + esc(s.category) + "</span>" : "") +
        (s.bloodGroup ? '<span class="is-tag">' + esc(s.bloodGroup) + "</span>" : "") + (s.cwsn === 1 ? '<span class="is-tag warn">Special needs</span>' : "") +
        (s.migrant === 1 ? '<span class="is-tag">Migrant family</span>' : "") +
        (s.consentStatus === "verified" ? '<span class="is-tag ok">Consent verified</span>' : s.consentStatus === "withdrawn" ? '<span class="is-tag">Consent withdrawn</span>' : '<span class="is-tag warn">Consent pending</span>') +
        (s.leftOn ? '<span class="is-tag warn">Left ' + dmy(s.leftOn) + "</span>" : "") + "</div></div>";
      var acts = el("div", "isp-acts");
      acts.appendChild(U.btn("Edit details", "strong", function () { sheet.close(); K.studentForm(id, function () { profile(id, done); }); }));
      acts.appendChild(U.btn("Print", "", function () { printProfile(s, w, cards); }));
      acts.appendChild(U.btn("Certificate…", "", function () { sheet.close(); K.openAdmin(false, "in-certs"); }));
      head.appendChild(acts);
      box.appendChild(head);

      var tabs = el("nav", "isp-tabs"), body = el("div", "isp-body");
      var TABS = [["overview", "Overview"], ["attendance", "Attendance"], ["marks", "Marks"], ["family", "Family"], ["record", "Record" + (notes.length ? " · " + notes.length : "")]];
      var views = { overview: overview, attendance: attendance, marks: marksView, family: family, record: record };
      var on = "overview";
      function show(k) {
        on = k;
        [].forEach.call(tabs.children, function (b) { b.classList.toggle("on", b.dataset.k === k); });
        body.innerHTML = "";
        views[k](body);
      }
      TABS.forEach(function (t) {
        var b = el("button", "isp-tab", esc(t[1])); b.type = "button"; b.dataset.k = t[0];
        b.addEventListener("click", function () { show(t[0]); });
        tabs.appendChild(b);
      });
      box.appendChild(tabs); box.appendChild(body);

      /* ---- Overview */
      function overview(h) {
        var done = 0, tot = 0;
        marks.forEach(function (m) { tot++; });
        var cnt = { present: 0, absent: 0, excused: 0, late: 0 };
        marks.forEach(function (m) { if (cnt[m.status] != null) cnt[m.status]++; });
        var pctNow = w && w.percent != null && w.total >= 10 ? w.percent : null;
        var last = cards.length ? cards[cards.length - 1] : null, card = last && last.cards && last.cards[0];
        var stats = el("div", "isp-stats");
        function stat(hue, label, value, sub, bar) {
          var d = el("div", "isp-stat"); d.dataset.hue = hue;
          d.innerHTML = "<span>" + esc(label) + "</span><b>" + value + "</b><em>" + sub + "</em>" + (bar != null ? '<i class="bar"><u style="width:' + Math.max(0, Math.min(100, bar)) + '%"></u></i>' : "");
          stats.appendChild(d);
        }
        stat(w && w.status === "below" ? "rose" : "emerald", "Attendance this year", pctNow == null ? "—" : pctNow + "<small>%</small>",
          !w ? "Not in a section" : w.total < 10 ? "Too early to say" : w.status === "below" ? (w.canMiss < 0 ? "Cannot reach 75%" : "Needs " + w.mustAttend + " of the days left") : w.canMiss + " days can still be missed", pctNow);
        stat("violet", "Latest result", card ? card.percent + "<small>%</small>" : "—", card ? esc(card.grade) + " · " + esc(last.exam.name) + (card.result === "pass" ? "" : " · " + esc(card.result)) : "No result published yet", card ? card.percent : null);
        stat(ew && ew.level === "high" ? "rose" : ew && ew.level === "medium" ? "amber" : "sky", "Early warning", ew ? (ew.level === "high" ? "High" : ew.level === "medium" ? "Medium" : "Low") : "None",
          ew && ew.signals && ew.signals.length ? esc(ew.signals[0].text) : "No signals", null);
        var bl = s._gaps = gaps(s);
        stat(bl.length ? "orange" : "teal", "Record", bl.length ? plural(bl.length, "gap") : "Complete", bl.length ? esc(bl[0].text) : "A board's list would take this child", null);
        h.appendChild(stats);

        var cols = el("div", "isp-cols");
        var about = el("section", "isp-card");
        about.innerHTML = "<h3>About</h3>" + kv("Date of birth", s.dob ? dmy(s.dob) + (a != null ? " · " + a + " years" : "") : "") + kv("Gender", { F: "Female", M: "Male", O: "Other" }[s.gender] || "") +
          kv("Mother tongue", esc(s.motherTongue || "")) + kv("Second language", esc(s.secondLanguage || "")) + kv("Address", esc([s.address, s.pin].filter(Boolean).join(" — "))) +
          kv("Previous school", esc(s.previousSchool || "")) + kv("Admitted", s.admittedOn ? dmy(s.admittedOn) : "") + kv("Transport", esc(s.transport || ""));
        var ident = el("section", "isp-card");
        ident.innerHTML = "<h3>Numbers a board asks for</h3>" + kv("APAAR ID", s.apaar === "REFUSED" ? chip("muted", "Refused") : s.apaar === "NOGEN" ? chip("muted", "Not generated") : s.apaar ? esc(s.apaar) : '<span class="is-miss">Pending</span>') +
          kv("PEN", s.pen ? esc(s.pen) : '<span class="is-miss">Missing</span>') + kv("Aadhaar", s.aadhaar ? esc(s.aadhaar) : "Not on file") + kv("Board roll no.", esc(s.boardRollNo || "")) +
          kv("Consent", s.consentStatus === "verified" ? chip("green", "Verified" + (s.consentMethod ? " · " + s.consentMethod.replace("_", " ") : "")) : s.consentStatus === "withdrawn" ? chip("muted", "Withdrawn") : chip("orange", "Pending"));
        cols.appendChild(about); cols.appendChild(ident);
        h.appendChild(cols);
        if (bl.length) {
          var todo = el("section", "isp-card wide warn");
          todo.innerHTML = "<h3>To fix on this record</h3>" + bl.map(function (g) { return '<span class="is-fix ' + g.level + '">' + esc(g.text) + "</span>"; }).join("");
          h.appendChild(todo);
        }
        if (hist && hist.classes && hist.classes.length > 1) {
          h.appendChild(el("p", "isp-note", "Sections so far: " + hist.classes.map(function (c) { return esc(c.label) + " (" + esc(String(c.year).replace(/(\d{4})-\d{2}(\d{2})/, "$1–$2")) + ")"; }).join(" → ")));
        }
      }

      /* ---- Attendance: the days, a month at a time */
      function attendance(h) {
        var by = {};
        marks.forEach(function (m) { by[m.day] = m.status; });
        var cnt = { present: 0, late: 0, excused: 0, absent: 0 };
        Object.keys(by).forEach(function (d) { if (cnt[by[d]] != null) cnt[by[d]]++; });
        var all = Object.keys(by).length;
        var top = el("div", "isp-cnt");
        top.innerHTML = '<span class="hi"><b>' + (cnt.present + cnt.late) + "</b>present</span><span class='lo'><b>" + cnt.absent + "</b>absent</span><span class='lv'><b>" + cnt.excused + "</b>on leave</span><span><b>" + all + "</b>days marked</span>";
        h.appendChild(top);
        if (!all) { h.appendChild(el("p", "ih-quiet", "No register has marked this child yet.")); return; }
        var now = new Date(), months = [];
        for (var i = 2; i >= 0; i--) months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
        var grid = el("div", "isp-months");
        months.forEach(function (m) {
          var c = el("div", "isp-month"), first = (m.getDay() + 6) % 7, days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
          var html = "<h4>" + esc(m.toLocaleDateString(undefined, { month: "long", year: "numeric" })) + '</h4><div class="dow"><i>M</i><i>T</i><i>W</i><i>T</i><i>F</i><i>S</i><i>S</i></div><div class="days">';
          for (var b = 0; b < first; b++) html += "<span></span>";
          for (var d = 1; d <= days; d++) {
            var key = m.getFullYear() + "-" + ("0" + (m.getMonth() + 1)).slice(-2) + "-" + ("0" + d).slice(-2), st = by[key];
            html += '<span class="d ' + (st ? "s-" + st : "") + '" title="' + esc(key + (st ? " · " + st : "")) + '">' + d + "</span>";
          }
          c.innerHTML = html + "</div>";
          grid.appendChild(c);
        });
        h.appendChild(grid);
        h.appendChild(el("div", "isp-legend", '<span class="s-present">Present</span><span class="s-late">Late</span><span class="s-excused">On leave</span><span class="s-absent">Absent</span>'));
        if (w && w.status === "below") h.appendChild(el("p", "isp-note warn", "Under 75% with " + (w.canMiss < 0 ? "no way back by the end of the year." : "a way back: " + w.mustAttend + " of the days left.") + (w.condonable ? " A condonation case can be started." : "")));
      }

      /* ---- Marks: every published result */
      function marksView(h) {
        if (!cards.length) { h.appendChild(el("p", "ih-quiet", "No result is published for this child yet. Marks reach the family once the principal publishes the papers.")); return; }
        cards.slice().reverse().forEach(function (rc) {
          var c = rc.cards && rc.cards[0];
          if (!c) return;
          var sec = el("section", "isp-card wide");
          var rows = c.subjects.map(function (sj) {
            return '<div class="isp-mk"><span>' + esc(sj.subject) + '</span><i class="bar"><u class="' + (sj.pass === false ? "lo" : sj.percent >= 75 ? "hi" : "mid") + '" style="width:' + (sj.percent || 0) + '%"></u></i><b>' + (sj.absent ? "Ab" : sj.total == null ? "—" : sj.total + "/" + sj.max) + "</b><em>" + esc(sj.grade || "") + "</em></div>";
          }).join("");
          sec.innerHTML = '<h3>' + esc(rc.exam.name) + '<small>' + esc(rc.classLabel) + '</small><span class="is-res ' + (c.result === "pass" ? "ok" : "no") + '">' + esc(c.result === "pass" ? "Pass" : c.result) + "</span></h3>" + rows +
            '<div class="isp-mktotal"><span>Total</span><b>' + c.total + " / " + c.max + "</b><em>" + c.percent + "% · " + esc(c.grade || "") + "</em></div>";
          h.appendChild(sec);
        });
      }

      /* ---- Family: who to call */
      function family(h) {
        var rows = [];
        function person(rel, name, ph) { if (name || ph) rows.push('<div class="is-person"><span class="who">' + avatar(name || rel) + "<span><b>" + esc(name || "—") + "</b><small>" + esc(rel) + (s.primaryContact === rel ? " · main contact" : "") + "</small></span></span><span class='ph'>" + (phone(ph) || "<i>No number</i>") + wa(ph) + "</span></div>"); }
        person("Father", s.fatherName, s.fatherPhone); person("Mother", s.motherName, s.motherPhone);
        if (s.guardianName || s.guardianPhone) person("Guardian" + (s.guardianRelation ? " (" + s.guardianRelation + ")" : ""), s.guardianName, s.guardianPhone);
        var c = el("section", "isp-card wide");
        c.innerHTML = "<h3>Who to call</h3>" + (rows.join("") || '<p class="ih-quiet">No parent or guardian is on the record.</p>') +
          kv("Family email", esc(s.guardianEmail || "")) + kv("Family's language", esc(s.language || "")) + kv("WhatsApp", s.whatsapp === 1 ? chip("green", "Opted in") : s.whatsapp === 0 ? chip("muted", "Not opted in") : "Not asked");
        h.appendChild(c);
      }

      /* ---- Record: everything else the school keeps about the child */
      function record(h) {
        var useful = notes.filter(function (n) { return n.kind !== "rsvp"; });
        if (!useful.length) { h.appendChild(el("p", "ih-quiet", "Nothing else is on this child's record: no certificates, referrals, plans or mentoring cases.")); return; }
        var l = el("div", "isp-notes");
        var KIND = { certificate: "Certificate", referral: "Referral", ewscase: "Mentoring case", condonation: "Condonation", senplan: "Learning support", accommodation: "Accommodation", detention: "Detention", leave: "Leave" };
        useful.forEach(function (n) {
          var row = el("div", "isp-note-row");
          row.innerHTML = '<span class="k">' + esc(KIND[n.kind] || n.kind) + "</span><b>" + esc(n.title) + "</b><span class='st'>" + esc(n.status) + "</span><small>" + (n.dueOn ? dmy(n.dueOn) : "") + "</small>";
          l.appendChild(row);
        });
        h.appendChild(l);
      }

      show(on);
    }

    function printProfile(s, w, cards) {
      var rows = [["Class", (s.classLabel || "") + (s.rollNo ? " · roll " + s.rollNo : "")], ["Admission number", s.admissionNo], ["Date of birth", s.dob ? dmy(s.dob) : ""], ["Gender", s.gender], ["Category", s.category], ["House", s.house],
        ["Blood group", s.bloodGroup], ["Address", [s.address, s.pin].filter(Boolean).join(", ")], ["Father", [s.fatherName, s.fatherPhone].filter(Boolean).join(" · ")], ["Mother", [s.motherName, s.motherPhone].filter(Boolean).join(" · ")],
        ["APAAR", s.apaar], ["PEN", s.pen], ["Attendance this year", w && w.percent != null ? w.percent + "%" : ""]];
      K.cxPrint(s.name + " — student profile", K.printHead(s.name, "Student profile") + K.printTable([{ t: "" }, { t: "" }], rows));
    }
  }

  return { directory: directory, profile: profile };
};
