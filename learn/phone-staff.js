/* ==========================================================================
   OEdu on a phone — teachers and administrators.

   A teacher and an administrator do different jobs on a phone, so they get
   different home screens, and neither is the desktop console squeezed:

     Teacher   the class that is on now · take the register · who is below a
               pass · the work to mark · messages
     Admin     the school today (who is in, which registers are missing) ·
               applications waiting · people, with the numbers to ring ·
               messages

   Both have the same few places, and every other place the console has is one
   tap away in "Everything" — the console's own page, laid out for a phone.

     Attendance   a day's registers; the register, one student a row
     Students     find one; their grades, attendance, family, and a way to reach them
     Classes      a teacher's courses, and one course
     Me           account, appearance, other roles, sign out

   Mounted by phone.js: OPLO_PHONE_STAFF(P). Same API calls as the console.
   ========================================================================== */
window.OPLO_PHONE_STAFF = function (P) {
  "use strict";

  var K = P.K, el = P.el, esc = P.esc, API = K.API;
  var X = null, SC = null, AT = null;
  var F = P.sf = {};
  var plural, num, relDay, clock, iso, parse, addDays, todayIso, settle;

  function init() {
    if (X) return;
    X = K.stu().kit; SC = API.schedule; AT = API.attendance;
    plural = X.plural; num = X.num; relDay = X.relDay; clock = X.clock; iso = X.iso; parse = X.parse; addDays = X.addDays; todayIso = X.todayIso; settle = X.settle;
  }
  function isAdmin() { return K.S.me.role === "admin"; }

  /* ------------------------------------------------------------- Data
     Kept a minute, so moving between places does not read the school again. */
  var CACHE = {};
  function cached(key, ttl, fn) {
    var h = CACHE[key];
    if (h && Date.now() - h.at < ttl) return h.p;
    var p = Promise.resolve().then(fn);
    CACHE[key] = { at: Date.now(), p: p };
    p.catch(function () { delete CACHE[key]; });
    return p;
  }
  var Dt = {
    day: function (date) { return cached("day:" + date, 45000, function () { return SC.mine(date); }); },
    teaching: function () { return cached("teaching", 60000, function () { return API.reporting.teaching(); }); },
    students: function () { return cached("students", 60000, function () { return API.reporting.students(); }); },
    people: function () { return cached("people", 120000, function () { return API.accounts.list(K.S.me.orgId); }); },
    codes: function () { return cached("codes", 120000, function () { return AT.codes(); }); },
    review: function (a, b) { return cached("review:" + a + ":" + b, 20000, function () { return AT.review(a, b); }); },
    summary: function (a, b) { return cached("sum:" + a + ":" + b, 20000, function () { return AT.summary(a, b); }); },
    sections: function () { return cached("sections", 120000, function () { return SC.sections(); }); },
    enroll: function () { return cached("enroll", 60000, function () { return API.enrollment.summary(); }); },
    facilities: function () { return cached("fx", 60000, function () { return API.facilities.summary(); }); },
    members: function (id) { return cached("mem:" + id, 60000, function () { return API.courses.members(id); }); },
    // A teacher may read a register only a course at a time: which of today's classes have one, and how it went.
    registers: function (items, day) {
      var key = "reg:" + day + ":" + items.map(function (x) { return x.courseId; }).join(",");
      return cached(key, 20000, function () {
        return Dt.codes().then(function (codes) {
          var kind = {};
          (codes.codes || []).forEach(function (c) { kind[c.key] = c.kind; });
          return Promise.all(items.map(function (x) {
            return settle(AT.list({ courseId: x.courseId, day: day })).then(function (r) {
              if (!r.ok || !r.v.length) return null;
              var o = { courseId: x.courseId, n: r.v.length, here: 0, away: 0, late: 0 };
              r.v.forEach(function (row) { var k = kind[row.status] || "present"; if (k === "absent") o.away++; else { o.here++; if (k === "tardy") o.late++; } });
              return o;
            });
          })).then(function (list) { var by = {}; list.forEach(function (o) { if (o) by[o.courseId] = o; }); return by; });
        });
      });
    }
  };
  F.bust = function () { CACHE = {}; };

  function minOf(t) { return t ? +String(t).slice(0, 2) * 60 + +String(t).slice(3, 5) : null; }
  function nowMin() { var n = new Date(); return n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60; }
  function periodLabel(pds) {
    var t = (pds || []).map(function (p) { return String(p).replace(/^[A-Za-z]+/, "") || p; });
    var same = t.filter(function (x, i) { return t.indexOf(x) === i; });
    return same.length === 1 ? "Period " + same[0] : same.length ? "Periods " + same.join(", ") : "";
  }
  function weekdayName(d) { return X.DOWL[parse(d).getDay()]; }
  function whenName(date) {
    var t = todayIso();
    return date === addDays(t, 1) ? "Tomorrow" : date <= addDays(t, 6) ? weekdayName(date) : weekdayName(date).slice(0, 3) + " " + X.MONS[parse(date).getMonth()] + " " + parse(date).getDate();
  }
  function field(label, node) { var l = el("label", "ph-field", "<small>" + esc(label) + "</small>"); l.appendChild(node); return l; }
  function cta(text, cls, go) { var b = el("button", "ph-cta" + (cls ? " " + cls : ""), esc(text)); b.type = "button"; b.addEventListener("click", go); return b; }

  /* A transient place — a register, a student — is a layer with its own step in
     the history, so Back and a pull down both come back to where you were. */
  function place(key, label, depth, o, build) {
    K.push("ph:" + key, label, function () { P.present(key, depth, o, build); });
    return P.present(key, depth, o, build);
  }
  function layer(key, depth, tone, label, build, back) { return P.present(key, depth, { tone: tone, label: label, back: back }, build); }
  var up = function (label, tab) { return { label: label, go: function () { K.openStaff(tab); } }; };

  /* ============================================================== Home */
  var home = null;

  function buildHome() {
    var Hm = P.home(), role = isAdmin() ? "admin" : "teacher";
    if (Hm.built === "staff:" + role) return Hm;
    if (Hm.timer) clearInterval(Hm.timer);
    Hm.built = "staff:" + role;
    home = Hm;
    var me = K.S.me, sc = Hm.scroll;
    sc.innerHTML = "";
    var top = el("div", "ph-top");
    top.innerHTML = '<div class="brand"><svg viewBox="12 12 76 76" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M12,40 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0 M32,60 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0"/></svg><span>' + esc(K.schoolName()) + "</span></div>";
    top.appendChild(P.btn("", P.icon("search"), "Find a person", function () { K.openStaff("students"); }));
    Hm.mailBtn = P.btn("", P.icon("mail"), "Messages", function () { K.openInbox(); });
    top.appendChild(Hm.mailBtn);
    var av = el("button", "ph-av", esc(me.initials || ""));
    av.type = "button";
    P.hue(av, me.hue);
    av.setAttribute("aria-label", "You");
    av.addEventListener("click", function () { place("me", "Me", 1, { tone: "gray", label: "Me" }, buildMe); });
    top.appendChild(av);
    sc.appendChild(top);

    var hi = el("div", "ph-hi");
    hi.innerHTML = '<p class="eb">' + esc(X.longDay(todayIso())) + "</p><h1>" + esc(P.greet(String(me.name || "").split(" ")[0])) + "</h1>";
    sc.appendChild(hi);
    Hm.titleEl = hi;

    Hm.hero = el("div", "ph-hero-slot");
    var sk = el("span", "ph-skel");
    sk.style.cssText = "height:270px;margin:20px 16px 0;border-radius:34px";
    Hm.hero.appendChild(sk);
    sc.appendChild(Hm.hero);
    Hm.notes = el("div", "ph-notes");
    sc.appendChild(Hm.notes);

    var defs = role === "admin" ? [
      { k: "attendance", tone: "teal", icon: "check", label: "Present today", ring: true },
      { k: "students", tone: "blue", icon: "people", label: "People" },
      { k: "enrollment", tone: "purple", icon: "doc", label: "Applications" },
      { k: "inbox", tone: "indigo", icon: "mail", label: "Unread", open: function () { K.openInbox(); } },
      { k: "fx-orders", tone: "orange", icon: "building", label: "Open work orders" },
      { k: "analytics", tone: "green", icon: "chart", label: "Analytics" }
    ] : [
      { k: "attendance", tone: "teal", icon: "check", label: "Registers today", ring: true },
      { k: "tograde", tone: "pink", icon: "inbox", label: "To mark" },
      { k: "courses", tone: "indigo", icon: "books", label: "Classes" },
      { k: "students", tone: "blue", icon: "people", label: "Students" },
      { k: "support", tone: "orange", icon: "alert", label: "Below a pass", open: function () { place("students:risk", "Below a pass", 1, { tone: "orange", label: "Students" }, function (L) { buildStudents(L, "risk"); }); } },
      { k: "messages", tone: "green", icon: "mail", label: "Unread", open: function () { K.openInbox(); } }
    ];
    var tiles = el("div", "ph-tiles");
    Hm.tiles = {};
    defs.forEach(function (t) {
      var b = el("button", "ph-tile t-" + t.tone);
      b.type = "button";
      b.innerHTML = '<span class="g">' + P.icon(t.icon) + '</span><span class="tx"><span class="v">—</span><span class="l">' + esc(t.label) + "</span></span>";
      b.addEventListener("click", t.open || function () { K.openStaff(t.k); });
      b.setTile = function (v) {
        var vEl = b.querySelector(".v"), lEl = b.querySelector(".l");
        if (v.value == null) vEl.innerHTML = "—";
        else if (typeof v.value === "number" && !v.plain) { vEl.innerHTML = "<span class='n'>0</span>" + (v.unit ? "<small>" + esc(v.unit) + "</small>" : ""); P.count(vEl.querySelector(".n"), v.value, { dec: v.dec || 0 }); }
        else vEl.innerHTML = esc(v.value) + (v.unit ? "<small>" + esc(v.unit) + "</small>" : "");
        lEl.innerHTML = v.labelHtml || esc(v.label || t.label);
        var old = b.querySelector(".ph-ring");
        if (old) old.remove();
        if (t.ring && v.ring != null) b.appendChild(P.ring(v.ring, { size: 38, stroke: 5, tone: t.tone }));
      };
      Hm.tiles[t.k] = b;
      tiles.appendChild(b);
    });
    sc.appendChild(tiles);
    P.rise([Hm.hero, Hm.notes].concat([].slice.call(tiles.children)), 0);

    var more = el("button", "ph-more", P.icon("dots") + "<span>Everything</span>");
    more.type = "button";
    more.addEventListener("click", openEverything);
    sc.appendChild(more);

    Hm.onShow = function () { if (Hm.at && Date.now() - Hm.at > 25000) paintHome(); };
    Hm.timer = setInterval(function () { if (!document.hidden && P.depth() === 0 && Hm.model && Hm.data) paintHero(); }, 30000);
    P.onLeave = function () { clearInterval(Hm.timer); };
    P.pull(Hm, function () { F.bust(); return paintHome(); });
    paintHome();
    return Hm;
  }

  /* ----------------------------------------------------- The hero, by role */
  function dayModel(r) {
    if (!r.ok) return null;
    var dd = r.v, entry = dd.day || {};
    if (entry.kind !== "school") return { off: true, entry: entry, items: [] };
    var items = (dd.items || []).filter(function (x) { return x.meets && x.periods.length; });
    items.sort(function (a, b) { return (a.startsAt || "99") < (b.startsAt || "99") ? -1 : (a.startsAt || "99") > (b.startsAt || "99") ? 1 : 0; });
    return { items: items, entry: entry, sched: dd.schedule };
  }
  function nextDay(from) {
    return settle(X.D.calendar(addDays(from, 1), addDays(from, 60))).then(function (r) {
      if (!r.ok) return null;
      var days = (r.v.days || []).slice().sort(function (a, b) { return a.day < b.day ? -1 : 1; });
      var school = days.filter(function (d) { return d.kind === "school" && d.day > from; })[0];
      if (!school) return null;
      var gap = days.filter(function (d) { return d.day > from && d.day < school.day && d.kind !== "school" && d.kind !== "none" && d.label; })[0];
      return { date: school.day, gap: gap ? gap.label : "" };
    });
  }
  function registersFor(rev, day) {
    // courseId → { n, here, away, late } for one day.
    var by = {};
    ((rev && rev.coverage) || []).forEach(function (c) { if (c.day === day) by[c.courseId] = c; });
    return by;
  }
  function expectedSections(rev, day, secs) {
    var cal = ((rev && rev.calendar) || []).filter(function (c) { return c.day === day; })[0];
    if (!cal || cal.kind !== "school") return [];
    var run = cal.periods || [];
    return (secs || []).filter(function (s) { return s.status !== "archived" && (s.periods || []).some(function (p) { return run.indexOf(p) > -1; }); });
  }

  function teacherHero(d) {
    var dm = dayModel(d.day), t = d.teaching.ok ? d.teaching.v : null;
    var byCourse = {};
    if (t) t.courses.forEach(function (c) { byCourse[c.id] = c; });
    var taken = d.registers || {};
    function course(x) { return byCourse[x.courseId] || { id: x.courseId, title: x.title, subject: "", students: null }; }
    function roll(x) { var c = course(x); return function () { openRoll({ id: x.courseId, title: x.title, subject: c.subject, room: x.room }, d.t0); }; }
    function registerChip(x) {
      var tk = taken[x.courseId];
      return tk ? { label: "Register", text: tk.here + " present" + (tk.away ? " · " + tk.away + " away" : ""), time: "Taken" } : { label: "Register", text: "Not taken yet", time: "Take it" };
    }
    if (!dm) return { tone: "gray", quiet: true, k: "Today", title: "Couldn’t read today", sub: "Check your connection and open OEdu again." };
    if (dm.off) {
      var e = dm.entry, weekend = parse(todayIso()).getDay() % 6 === 0;
      return { tone: "teal", quiet: true, k: "No school", title: e.label || (weekend ? "It’s the weekend" : "No school today"),
        sub: d.nxt ? (d.nxt.gap && d.nxt.gap !== e.label ? d.nxt.gap + ". " : "") + "Classes pick up " + (d.nxt.date === addDays(todayIso(), 1) ? "tomorrow" : "on " + whenName(d.nxt.date)) + "." : "Enjoy the day.", go: function () { K.openStaff("attendance"); } };
    }
    var items = dm.items;
    if (!items.length) return { tone: "gray", quiet: true, k: "Today", title: "No classes today", sub: "Nothing on today’s schedule is yours.", go: function () { K.openStaff("courses"); } };
    var n = nowMin(), cur = null, nx = null, i;
    for (i = 0; i < items.length; i++) {
      var s0 = minOf(items[i].startsAt), e0 = minOf(items[i].endsAt);
      if (s0 != null && e0 != null && n >= s0 && n < e0) { cur = items[i]; nx = items[i + 1] || null; break; }
      if (s0 != null && n < s0) { nx = items[i]; break; }
    }
    var missing = items.filter(function (x) { return !taken[x.courseId] && minOf(x.endsAt) != null && nowMin() >= minOf(x.startsAt); }).length;
    function where(x) { var c = course(x); return [x.room ? "Room " + x.room : "", c.students != null ? plural(c.students, "student") : ""].filter(Boolean).join(" · "); }
    if (cur) {
      var a = minOf(cur.startsAt), b = minOf(cur.endsAt), left = Math.max(1, Math.ceil(b - n));
      return { tone: P.toneOf(course(cur).subject || cur.title), k: "Now · " + (periodLabel(cur.periods.slice(0, 1)) || "In class"), title: cur.title, sub: where(cur),
        ring: { pct: (n - a) / (b - a) * 100, big: String(left), small: "min left" }, chip: registerChip(cur), go: roll(cur) };
    }
    if (nx) {
      var mins = Math.ceil(minOf(nx.startsAt) - n), first = nx === items[0];
      return { tone: P.toneOf(course(nx).subject || nx.title), k: first ? "First class" : "Up next", title: nx.title, sub: where(nx),
        ring: mins <= 90 ? { pct: Math.max(0, 100 - mins / (first ? 90 : 10) * 100), big: String(mins), small: "min away" } : null,
        chip: { label: "Starts", text: periodLabel(nx.periods.slice(0, 1)) || "", time: clock(nx.startsAt) }, go: roll(nx) };
    }
    var all = items.length, done = items.filter(function (x) { return taken[x.courseId]; }).length;
    return { tone: "indigo", quiet: true, k: "Done for today", title: missing ? plural(missing, "register") + " not taken" : "That’s the day",
      sub: missing ? "Open Attendance to finish them." : "You had " + plural(all, "class", "classes") + " and took " + done + " of " + all + " registers." + (d.nxt && d.nxt.gap ? " " + d.nxt.gap + " is next." : ""),
      chip: missing ? { label: "Missing", text: plural(missing, "register"), time: "Review" } : null, go: function () { K.openStaff("attendance"); } };
  }

  function adminHero(d) {
    var rev = d.review.ok ? d.review.v : null, secs = d.sections.ok ? d.sections.v : [];
    var cal = rev && (rev.calendar || []).filter(function (c) { return c.day === d.t0; })[0];
    if (cal && cal.kind !== "school") {
      var weekend = parse(todayIso()).getDay() % 6 === 0;
      return { tone: "teal", quiet: true, k: "No school", title: cal.label || (weekend ? "It’s the weekend" : "No school today"),
        sub: d.nxt ? (d.nxt.gap && d.nxt.gap !== cal.label ? d.nxt.gap + ". " : "") + "Classes pick up " + (d.nxt.date === addDays(todayIso(), 1) ? "tomorrow" : "on " + whenName(d.nxt.date)) + "." : "Enjoy the day.", go: function () { K.openStaff("attendance"); } };
    }
    var m = registerTotals(d.summary.ok ? d.summary.v : null);
    var exp = expectedSections(rev, d.t0, secs), tk = registersFor(rev, d.t0);
    var taken = exp.filter(function (s) { return tk[s.courseId]; }).length, expN = exp.length;
    if (!m.total) {
      return { tone: "blue", quiet: true, k: "Attendance today", title: expN ? "No registers yet" : "Nothing yet today", sub: expN ? plural(expN, "class", "classes") + " meet today. Registers appear here as teachers take them." : "Registers appear here as teachers take them.",
        chip: expN ? { label: "Registers", text: "0 of " + expN + " taken", time: "Review" } : null, go: function () { K.openStaff("attendance"); } };
    }
    var inRoom = m.present + m.late + m.excused;
    var pct = Math.round(inRoom / m.total * 1000) / 10;
    return { tone: pct >= 90 ? "teal" : pct >= 80 ? "blue" : "orange", k: "Attendance today", title: m.absent ? plural(m.absent, "absence") : "Everyone in",
      sub: [m.late ? plural(m.late, "late arrival") : "", m.excused ? m.excused + " excused" : "", plural(m.total, "mark")].filter(Boolean).join(" · "),
      ring: { pct: pct, big: num(pct), small: "% in" },
      chip: { label: "Registers", text: taken + " of " + expN + " taken", time: expN - taken > 0 ? plural(expN - taken, "to go", "to go") : "All in" }, go: function () { K.openStaff("attendance"); } };
  }
  function registerTotals(s) {
    var t = { present: 0, late: 0, absent: 0, excused: 0, total: 0 };
    ((s && s.byStatus) || []).forEach(function (r) {
      var k = String(r.status);
      var kind = /^(present)$/.test(k) ? "present" : /(late|tardy)/.test(k) ? "late" : /(excus|proof|field|trip)/.test(k) ? "excused" : "absent";
      t[kind] += r.n; t.total += r.n;
    });
    return t;
  }

  function paintHero() {
    var Hm = home, m = Hm.model = Hm.heroFn(Hm.data);
    var b = P.hero(m);
    var first = !Hm.hero.firstElementChild || Hm.hero.firstElementChild.classList.contains("ph-skel");
    Hm.hero.innerHTML = "";
    Hm.hero.appendChild(b);
    Hm.el.className = Hm.el.className.replace(/\bt-\w+/g, "").trim() + " t-" + m.tone;
    if (first) P.rise([b], 0);
  }

  function paintHome() {
    init();
    var Hm = home, t0 = todayIso(), adm = isAdmin();
    var jobs = adm
      ? [settle(Dt.review(t0, t0)), settle(Dt.summary(t0, t0)), settle(Dt.sections()), settle(Dt.enroll()), settle(Dt.people()), settle(Dt.facilities())]
      : [settle(Dt.day(t0)), settle(Dt.teaching())];
    var work = Promise.all(jobs).then(function (r) {
      if (adm) return r;
      var dm = dayModel(r[0]);
      return Dt.registers(dm && !dm.off ? dm.items : [], t0).then(function (reg) { return [r[0], r[1], reg]; });
    }).then(function (r) {
      var d;
      if (adm) d = { t0: t0, review: r[0], summary: r[1], sections: r[2], enroll: r[3], people: r[4], fx: r[5], nxt: null };
      else d = { t0: t0, day: r[0], teaching: r[1], registers: r[2], nxt: null };
      Hm.data = d; Hm.at = Date.now(); Hm.heroFn = adm ? adminHero : teacherHero;
      paintHero();
      var needNext = adm ? (d.review.ok && (d.review.v.calendar || []).some(function (c) { return c.day === t0 && c.kind !== "school"; })) : (function () { var dm = dayModel(d.day); return !dm || dm.off || !dm.items.length || minOf(dm.items[dm.items.length - 1].endsAt) <= nowMin(); })();
      if (needNext) nextDay(t0).then(function (nx) { Hm.data.nxt = nx; paintHero(); });

      Hm.notes.innerHTML = "";
      if (adm) paintAdminTiles(Hm, d); else paintTeacherTiles(Hm, d);
    }).catch(function (e) { P.fail(Hm.hero, e, function () { Hm.hero.innerHTML = ""; paintHome(); }); });
    var mail = API.inbox.unread().then(function (n) {
      var dot = Hm.mailBtn.querySelector(".dot");
      if (n > 0 && !dot) Hm.mailBtn.appendChild(el("i", "dot"));
      if (!n && dot) dot.remove();
      var t = Hm.tiles.messages || Hm.tiles.inbox;
      if (t) t.setTile({ value: n, label: "Unread" });
    }, function () { /* no number */ });
    return Promise.all([work, mail]);
  }

  function note(host, tone, text, go) {
    var b = el("button", "ph-nt " + (tone || ""), "<i></i><span>" + esc(text) + "</span>" + P.chev);
    b.type = "button";
    b.addEventListener("click", go);
    host.appendChild(b);
  }

  function paintTeacherTiles(Hm, d) {
    var t = d.teaching.ok ? d.teaching.v.totals : null;
    var dm = dayModel(d.day), items = dm && !dm.off ? dm.items : [], tk = d.registers || {};
    var done = items.filter(function (x) { return tk[x.courseId]; }).length;
    Hm.tiles.attendance.setTile({ value: items.length ? done : null, label: items.length ? "of " + items.length + " registers taken" : "No classes today", ring: items.length ? done / items.length * 100 : null });
    Hm.tiles.tograde.setTile({ value: t ? t.unmarked : null, label: "To mark" });
    Hm.tiles.courses.setTile({ value: t ? t.courses : null, label: t && t.courses === 1 ? "Class" : "Classes" });
    Hm.tiles.students.setTile({ value: t ? t.students : null, label: "Students" });
    Hm.tiles.support.setTile({ value: t ? t.atRisk : null, label: "Below a pass" });
    var gone = items.filter(function (x) { return !tk[x.courseId] && minOf(x.startsAt) != null && nowMin() > minOf(x.startsAt); }).length;
    if (gone) note(Hm.notes, "orange", plural(gone, "register") + " not taken yet today.", function () { K.openStaff("attendance"); });
    if (t && t.overdue) note(Hm.notes, "", plural(t.overdue, "piece of work is", "pieces of work are") + " waiting to be marked.", function () { K.openStaff("tograde"); });
  }

  function paintAdminTiles(Hm, d) {
    var m = registerTotals(d.summary.ok ? d.summary.v : null);
    var rate = m.total ? Math.round((m.present + m.late + m.excused) / m.total * 1000) / 10 : null;
    Hm.tiles.attendance.setTile({ value: rate, unit: "%", dec: rate != null && rate % 1 ? 1 : 0, label: m.total ? "In today" : "No registers yet", ring: rate });
    var people = d.people.ok ? d.people.v : null;
    var studs = people ? people.filter(function (p) { return /^(grade|kindergarten|pre)/i.test(p.title || ""); }).length : null;
    Hm.tiles.students.setTile({ value: studs != null ? studs : (people ? people.length : null), label: studs != null ? "Students" : "People" });
    var en = d.enroll.ok ? d.enroll.v.applications : null;
    Hm.tiles.enrollment.setTile({ value: en ? en.awaitingReview : null, label: "Awaiting review", labelHtml: en && en.overdue ? "Awaiting review · <em>" + en.overdue + " overdue</em>" : null });
    var fx = d.fx.ok ? d.fx.v : null;
    var open = fx ? (fx.open != null ? fx.open : fx.orders && fx.orders.open != null ? fx.orders.open : fx.counts && fx.counts.open) : null;
    Hm.tiles["fx-orders"].setTile({ value: typeof open === "number" ? open : null, label: "Open work orders" });
    Hm.tiles.analytics.setTile({ value: "Open", plain: true, label: "Analytics" });
    var rev = d.review.ok ? d.review.v : null, exp = expectedSections(rev, d.t0, d.sections.ok ? d.sections.v : []), tk = registersFor(rev, d.t0);
    var miss = exp.filter(function (s) { return !tk[s.courseId]; }).length;
    if (m.total && miss) note(Hm.notes, "orange", plural(miss, "register") + " still to come today.", function () { K.openStaff("attendance"); });
    if (en && en.awaitingReview) note(Hm.notes, "", plural(en.awaitingReview, "application") + " waiting for review.", function () { K.openStaff("enrollment"); });
  }

  /* ========================================================== Everything */
  function openEverything() {
    init();
    P.sheet({ title: "Everything", sub: "Every place in the school’s console.", tone: "gray", body: function (host) {
      var allowed = {};
      K.sections().forEach(function (t) { allowed[t.k] = true; });
      var tree = K.staffTree(), ctl = null;
      function group(title, icon, items) {
        items = items.filter(function (t) { return allowed[t.k]; });
        if (!items.length) return;
        host.appendChild(el("p", "ph-sub", esc(title)));
        var g = P.group();
        g.style.marginBottom = "16px";
        items.forEach(function (t) { g.appendChild(P.row({ icon: icon, tone: "gray", title: t.name, go: function () { P.top() && null; K.openStaff(t.k); } })); });
        host.appendChild(g);
      }
      if (tree.admin) {
        var solo = [];
        tree.items.forEach(function (t) { if (t.kids) group(t.name, t.icon, t.kids); else solo.push(t); });
        group("Console", "summary", solo);
      } else tree.items.forEach(function (g) { group(g.head, "rows", g.items); });
    } });
  }

  /* ================================================================= Me */
  function buildMe(L) {
    var me = K.S.me;
    var hero = el("div", "ph-me");
    hero.innerHTML = '<div class="av">' + esc(me.initials || "") + "</div><h1>" + esc(me.name) + "</h1><p>" + esc(isAdmin() ? "Administrator" : "Teacher") + " · " + esc(K.schoolName()) + "</p>";
    P.hue(hero.querySelector(".av"), me.hue);
    L.add(hero);
    L.titleEl = hero.querySelector("h1");
    L.barTitle.textContent = me.name;
    L.add(P.sh("Account"));
    var g = P.group();
    g.appendChild(P.row({ icon: "key", tone: "gray", title: "Password and sessions", sub: me.email, go: function () { place("account", "Account", 2, { tone: "gray", label: "Account", back: up("Me", "today") }, function (L2) { P.sx.buildAccount(L2); }); } }));
    L.add(g);
    var homes = K.otherHomes();
    if (homes.length) {
      L.add(P.sh("Switch role"));
      var hg = P.group();
      homes.forEach(function (h) { hg.appendChild(P.row({ icon: h.mode === "admin" ? "building" : h.mode === "parent" ? "heart" : "cap", tone: "gray", title: h.name, go: function () { location.href = h.href; } })); });
      L.add(hg);
    }
    L.add(P.sh("Appearance"));
    L.add(P.seg([{ k: "light", label: "Light" }, { k: "dark", label: "Dark" }, { k: "auto", label: "Auto" }], P.lookNow(), function (k) { P.look(k); }));
    L.add(P.note("Auto follows your phone’s own setting."));
    L.add(P.sh("Messages"));
    var mg = P.group();
    mg.appendChild(P.row({ icon: "alert", tone: "gray", title: "What you hear about", sub: "Announcements, reminders and alerts", go: function () { P.shared.prefs(); } }));
    L.add(mg);
    var out = el("div", "ph-btnrow");
    out.appendChild(cta("Sign out", "danger", function () { P.signOut(); }));
    L.add(out);
  }

  /* ============================================================ Attendance */
  var DAYSTATE = { day: null };
  function weekStrip(host, st, cal, onPick) {
    var strip = el("div", "ph-week");
    for (var i = 0; i < 7; i++) {
      (function (day) {
        var info = cal[day], off = info && info.kind !== "school";
        var b = el("button", "ph-wd" + (off ? " off" : "") + (day === todayIso() ? " today" : ""), "<small>" + esc(X.DOWS[parse(day).getDay()]) + "</small><b>" + parse(day).getDate() + "</b><i></i>");
        b.type = "button";
        b.setAttribute("aria-selected", day === st.date ? "true" : "false");
        b.setAttribute("aria-label", X.longDay(day));
        b.addEventListener("click", function () { st.date = day; DAYSTATE.day = day; [].forEach.call(strip.children, function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); }); onPick(day); });
        strip.appendChild(b);
      })(addDays(st.weekOf, i));
    }
    host.appendChild(strip);
  }
  function weekBar(st, redraw) {
    var bar = el("div", "ph-weekbar");
    var a = parse(st.weekOf), b = parse(addDays(st.weekOf, 6));
    bar.innerHTML = '<span class="wk">' + X.MONS[a.getMonth()] + " " + a.getDate() + " – " + X.MONS[b.getMonth()] + " " + b.getDate() + "</span>";
    var nav = el("div", "nav");
    nav.appendChild(P.btn("", P.icon("left"), "Earlier", function () { st.weekOf = addDays(st.weekOf, -7); st.date = addDays(st.date, -7); DAYSTATE.day = st.date; redraw(); }));
    nav.appendChild(P.btn("", P.icon("right"), "Later", function () { st.weekOf = addDays(st.weekOf, 7); st.date = addDays(st.date, 7); DAYSTATE.day = st.date; redraw(); }));
    bar.appendChild(nav);
    return bar;
  }

  function buildAttendance(L) {
    init();
    L.head({ eyebrow: isAdmin() ? "Students" : "Teach", title: "Attendance" });
    var t0 = todayIso(), date = DAYSTATE.day || t0;
    var st = { date: date, weekOf: X.mondayOf(date) };
    var host = L.add(el("div"));
    function redraw() { host.innerHTML = ""; drawWeek(); }
    L.refresh = function () { F.bust(); redraw(); };
    function drawWeek() {
      host.appendChild(weekBar(st, redraw));
      var panel = el("div");
      var from = st.weekOf, to = addDays(st.weekOf, 6);
      settle(X.D.calendar(from, to)).then(function (r) {
        var cal = {};
        if (r.ok) (r.v.days || []).forEach(function (c) { cal[c.day] = c; });
        weekStrip(host, st, cal, function () { drawDay(panel); });
        host.appendChild(panel);
        drawDay(panel);
      });
    }
    function drawDay(panel) {
      panel.innerHTML = "";
      panel.appendChild(P.skel(3, 76));
      var day = st.date;
      (isAdmin() ? adminDay(day) : teacherDay(day)).then(function (node) {
        if (st.date !== day) return;
        panel.innerHTML = "";
        panel.appendChild(node);
      }, function (e) { P.fail(panel, e, function () { drawDay(panel); }); });
    }
    drawWeek();
  }

  /* A teacher's day of registers. */
  function teacherDay(day) {
    return Promise.all([Dt.day(day), settle(Dt.teaching())]).then(function (r) {
      var dm = dayModel({ ok: true, v: r[0] });
      return Dt.registers(dm.off ? [] : dm.items, day).then(function (reg) { return [r[0], r[1], reg]; });
    }).then(function (r) {
      var dm = dayModel({ ok: true, v: r[0] }), byCourse = {}, wrap = el("div");
      if (r[1].ok) r[1].v.courses.forEach(function (c) { byCourse[c.id] = c; });
      var tk = r[2];
      wrap.appendChild(el("div", "ph-daytitle", "<h2>" + esc(day === todayIso() ? "Today" : X.longDay(day)) + "</h2>" + (day === todayIso() ? "<span>" + esc(X.longDay(day)) + "</span>" : "")));
      if (dm.off) { wrap.appendChild(el("div", "ph-quiet", "<b>" + esc(dm.entry.label || "No school") + "</b><p>There are no classes this day.</p>")); return wrap; }
      if (!dm.items.length) { wrap.appendChild(el("div", "ph-quiet", "<b>Nothing meets</b><p>You have no classes on this day.</p>")); return wrap; }
      var done = dm.items.filter(function (x) { return tk[x.courseId]; }).length;
      var g = P.group();
      dm.items.forEach(function (x) {
        var c = byCourse[x.courseId] || {}, t = tk[x.courseId];
        var past = day < todayIso() || (day === todayIso() && minOf(x.endsAt) != null && nowMin() >= minOf(x.endsAt));
        g.appendChild(P.row({ dot: true, tone: P.toneOf(c.subject || x.title), title: x.title, sub: [periodLabel(x.periods.slice(0, 1)), x.startsAt ? clock(x.startsAt) : "", x.room ? "Room " + x.room : ""].filter(Boolean).join(" · "),
          valueHtml: t ? "<span class='ph-pill green'>Taken</span><small>" + esc(t.here + " present" + (t.away ? " · " + t.away + " away" : "")) + "</small>" : "<span class='ph-pill " + (past ? "orange" : "") + "'>" + (day > todayIso() ? "Not yet" : "Not taken") + "</span>",
          go: function () { openRoll({ id: x.courseId, title: x.title, subject: c.subject, room: x.room }, day); } }));
      });
      wrap.appendChild(g);
      P.rise([g], 0);
      wrap.appendChild(P.note(done + " of " + dm.items.length + " registers taken."));
      return wrap;
    });
  }

  /* The school's day of registers: who is in, which registers are missing. */
  function adminDay(day) {
    return Promise.all([Dt.review(day, day), Dt.summary(day, day), settle(Dt.sections()), settle(AT.list({ day: day }))]).then(function (r) {
      var rev = r[0], m = registerTotals(r[1]), secs = r[2].ok ? r[2].v : [], rows = r[3].ok ? r[3].v : [];
      var wrap = el("div"), exp = expectedSections(rev, day, secs), tk = registersFor(rev, day);
      var cal = (rev.calendar || []).filter(function (c) { return c.day === day; })[0];
      wrap.appendChild(el("div", "ph-daytitle", "<h2>" + esc(day === todayIso() ? "Today" : X.longDay(day)) + "</h2>" + (day === todayIso() ? "<span>" + esc(X.longDay(day)) + "</span>" : "")));
      if (cal && cal.kind !== "school") { wrap.appendChild(el("div", "ph-quiet", "<b>" + esc(cal.label || "No school") + "</b><p>There are no classes this day.</p>")); return wrap; }
      var inRoom = m.present + m.late + m.excused, pct = m.total ? Math.round(inRoom / m.total * 1000) / 10 : null;
      var big = el("div", "ph-big sm t-teal");
      big.appendChild(P.ring(pct == null ? 0 : pct, { size: 118, stroke: 10, tone: "teal", center: pct == null ? "<small class='cap'>No marks</small>" : "<b>" + esc(num(pct)) + "<span class='pc'>%</span></b><small class='cap'>in</small>" }));
      var tx = el("div", "tx");
      tx.innerHTML = "<h2>" + esc(m.total ? (m.absent ? plural(m.absent, "absence") : "Everyone in") : "No registers yet") + "</h2><p>" +
        esc([m.late ? plural(m.late, "late arrival") : "", m.excused ? m.excused + " excused" : "", exp.length ? exp.filter(function (s) { return tk[s.courseId]; }).length + " of " + exp.length + " registers taken" : ""].filter(Boolean).join(" · ") || "Registers appear as teachers take them.") + "</p>";
      big.appendChild(tx);
      wrap.appendChild(big);
      P.rise([big], 0);

      var missing = exp.filter(function (s) { return !tk[s.courseId]; });
      if (missing.length) {
        wrap.appendChild(P.sh("Registers not taken", { label: plural(missing.length, "class", "classes") }));
        var mg = P.group();
        missing.slice(0, 30).forEach(function (s) {
          mg.appendChild(P.row({ dot: true, tone: P.toneOf(s.area || s.title), title: s.title, sub: [periodLabel(s.periods && s.periods.slice(0, 1)), s.room ? "Room " + s.room : "", X.teacherShort(s)].filter(Boolean).join(" · "),
            valueHtml: "<span class='ph-pill orange'>" + (day > todayIso() ? "Not yet" : "Missing") + "</span>", go: function () { openRoll({ id: s.courseId, title: s.title, subject: s.area, room: s.room }, day); } }));
        });
        wrap.appendChild(mg);
        if (missing.length > 30) wrap.appendChild(P.note("And " + (missing.length - 30) + " more."));
      }
      // Who is away.
      var away = {};
      rows.forEach(function (x) {
        var k = String(x.status);
        if (/^(absent|cut)$/.test(k)) { var a = away[x.accountId] || (away[x.accountId] = { id: x.accountId, name: x.studentName, n: 0, courses: [] }); a.n++; a.courses.push(x.courseTitle); }
      });
      var list = Object.keys(away).map(function (k) { return away[k]; }).sort(function (a, b) { return b.n - a.n || String(a.name).localeCompare(b.name); });
      if (list.length) {
        wrap.appendChild(P.sh("Away"));
        var ag = P.group();
        list.slice(0, 40).forEach(function (a) {
          var row = el("button", "ph-row has-ic");
          row.type = "button";
          row.appendChild(P.shared.avatar(a.name, 34));
          row.appendChild(el("span", "t", "<b>" + esc(a.name) + "</b><small>" + esc(plural(a.n, "class", "classes") + " missed") + "</small>"));
          row.insertAdjacentHTML("beforeend", P.chev);
          row.addEventListener("click", function () { openStudent(a.id, a.name); });
          ag.appendChild(row);
        });
        wrap.appendChild(ag);
      }
      if (!missing.length && !list.length && m.total) wrap.appendChild(P.note("Every register is in and nobody is away."));
      return wrap;
    });
  }

  /* ---------------------------------------------------------- The register
     One course on one date, a student a row. Everyone starts present; mark
     who is not. Late and absent are one tap; anything else the school keeps a
     code for is behind the dots, with a note. */
  function openRoll(course, day) { place("rc:" + course.id + ":" + day, course.title, 2, { tone: P.toneOf(course.subject || course.title), label: course.title, back: up("Attendance", "attendance") }, function (L) { buildRoll(L, course, day); }); }
  function buildRoll(L, course, day) {
    init();
    L.head({ eyebrow: (day === todayIso() ? "Today · " : "") + X.longDay(day), title: course.title, sub: "Reading the register…" });
    var host = L.add(el("div"));
    host.appendChild(P.skel(5, 62));
    Promise.all([Dt.members(course.id), AT.list({ courseId: course.id, day: day }), Dt.codes()]).then(function (r) {
      host.innerHTML = "";
      var roster = (r[0] || []).filter(function (m) { return m.role === "student"; }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
      var have = {};
      r[1].forEach(function (x) { have[x.accountId] = x; });
      var codes = (r[2].codes || []).filter(function (c) { return !c.retired; }), byKey = {};
      (r[2].codes || []).forEach(function (c) { byKey[c.key] = c; });
      function pick(kind, key) { return byKey[key] && !byKey[key].retired ? byKey[key] : codes.filter(function (c) { return c.kind === kind && !c.adminOnly; })[0] || codes.filter(function (c) { return c.kind === kind; })[0]; }
      var P1 = pick("present", "present"), P2 = pick("tardy", "late"), P3 = pick("absent", "absent"), FIRST = P1 ? P1.key : (codes[0] && codes[0].key) || "present";
      var main = [P1, P2, P3].filter(Boolean);
      var staff = isAdmin(), st = {}, nt = {}, held = {};
      roster.forEach(function (s) { var h = have[s.id]; st[s.id] = h ? h.status : FIRST; nt[s.id] = h && h.note ? h.note : ""; });
      if (!staff) roster.forEach(function (s) { if (byKey[st[s.id]] && byKey[st[s.id]].adminOnly) held[s.id] = true; });
      var future = day > todayIso(), lock = r[2].lockDays, closed = !staff && lock != null && (future || day < addDays(todayIso(), -lock));
      var rows = r[1].length;
      var wait = L.titleEl.querySelector("p:not(.eb)");
      if (wait) wait.remove();
      var subText = future ? "This day hasn’t come yet, so a register can’t be taken." : closed ? "The office has closed this day to teachers. Ask them to correct it." : rows ? "Correcting a register that was already taken." : "Everyone starts present. Mark who isn’t.";
      L.titleEl.appendChild(el("p", null, esc(plural(roster.length, "student") + " · " + subText)));
      if (!roster.length) { host.appendChild(P.empty("Nobody is enrolled yet", "Students appear here once they’re in this course.")); return; }

      var tally = el("div", "ph-tally");
      host.appendChild(tally);
      var list = el("div", "ph-roll");
      host.appendChild(list);
      var dirty = false;
      function kindOf(k) { return (byKey[k] && byKey[k].kind) || "present"; }
      function count() {
        var n = { present: 0, tardy: 0, absent: 0, excused: 0 };
        roster.forEach(function (s) { var k = kindOf(st[s.id]); n[k] = (n[k] || 0) + 1; });
        tally.innerHTML = "<span class='p'><b>" + n.present + "</b> present</span><span class='l'><b>" + n.tardy + "</b> late</span><span class='a'><b>" + n.absent + "</b> absent</span>" + (n.excused ? "<span class='e'><b>" + n.excused + "</b> excused</span>" : "");
      }
      var rowEls = {};
      roster.forEach(function (s) {
        var row = el("div", "ph-rr");
        row.appendChild(P.shared.avatar(s.name, 34));
        var nm = el("span", "nm", "<b>" + esc(s.name) + "</b>" + (nt[s.id] ? "<small>" + esc(nt[s.id]) + "</small>" : ""));
        row.appendChild(nm);
        var chips = el("span", "ch");
        function paint() {
          chips.innerHTML = "";
          var kind = kindOf(st[s.id]);
          main.forEach(function (c) {
            var b = el("button", "ph-chk " + c.kind + (st[s.id] === c.key ? " on" : ""), esc(c.mark));
            b.type = "button";
            b.setAttribute("aria-label", c.label + " — " + s.name);
            b.setAttribute("aria-pressed", st[s.id] === c.key ? "true" : "false");
            if (held[s.id] || closed || future) b.disabled = true;
            b.addEventListener("click", function () { st[s.id] = c.key; dirty = true; paint(); count(); save.disabled = false; });
            chips.appendChild(b);
          });
          var more = el("button", "ph-chk more" + (main.every(function (c) { return c.key !== st[s.id]; }) ? " on " + kind : "") + (nt[s.id] ? " has" : ""), main.every(function (c) { return c.key !== st[s.id]; }) ? esc((byKey[st[s.id]] || {}).mark || "•") : P.icon("dots"));
          more.type = "button";
          more.setAttribute("aria-label", "More for " + s.name);
          if (held[s.id] || closed || future) more.disabled = true;
          more.addEventListener("click", function () { moreSheet(s); });
          chips.appendChild(more);
          nm.innerHTML = "<b>" + esc(s.name) + "</b>" + (nt[s.id] ? "<small>" + esc(nt[s.id]) + "</small>" : "");
        }
        rowEls[s.id] = paint;
        paint();
        row.appendChild(chips);
        list.appendChild(row);
      });
      function moreSheet(s) {
        var note = el("input"); note.type = "text"; note.maxLength = 300; note.value = nt[s.id]; note.placeholder = "Sick, field trip, bereavement…";
        var sh = P.sheet({ title: s.name, sub: "Pick a mark, add a note families can read.", tone: "gray", body: function (b) {
          var g = P.group();
          codes.forEach(function (c) {
            if (!staff && c.adminOnly && st[s.id] !== c.key) return;
            g.appendChild(P.row({ title: c.label, valueHtml: st[s.id] === c.key ? "✓" : "<small>" + esc(c.mark) + "</small>", chev: false, go: function () { st[s.id] = c.key; dirty = true; save.disabled = false; sh.close(); rowEls[s.id](); count(); } }));
          });
          b.appendChild(g);
          var g2 = P.group(); g2.style.marginTop = "14px";
          g2.appendChild(field("Note", note));
          b.appendChild(g2);
          var rr = el("div", "ph-btnrow");
          rr.appendChild(cta("Save note", "quiet", function () { nt[s.id] = note.value.trim(); dirty = true; save.disabled = false; sh.close(); rowEls[s.id](); }));
          b.appendChild(rr);
        } });
      }
      var dock = el("div", "ph-dock");
      var all = cta("Everyone present", "quiet", function () { roster.forEach(function (s) { if (!held[s.id]) st[s.id] = FIRST; rowEls[s.id](); }); dirty = true; save.disabled = false; count(); });
      var save = cta("Save register", "", function () {
        save.disabled = true;
        AT.put(day, course.id, roster.map(function (s) { return { accountId: s.id, status: st[s.id], note: nt[s.id] || null }; }), "register").then(function () {
          F.bust(); P.toast("Register saved"); P.close();
          setTimeout(function () { var t = P.top(); if (t && t.refresh) t.refresh(); if (P.depth() === 0 && P.home().onShow) P.home().at = 0; }, 800);
        }, function (e) { save.disabled = false; P.toast(e && e.message ? e.message : "The register couldn’t be saved."); });
      });
      save.disabled = future || closed || (!dirty && !!rows);
      all.disabled = future || closed;
      dock.appendChild(all); dock.appendChild(save);
      L.dock(dock);
      count();
    }, function (e) { P.fail(host, e, function () { L.el.remove(); openRoll(course, day); }); });
  }

  /* ============================================================== Students */
  function buildStudents(L, mode) {
    init();
    var adm = isAdmin();
    L.head({ eyebrow: adm ? "Students" : "Teach", title: adm ? "People" : mode === "risk" ? "Below a pass" : "Students" });
    var f = el("label", "ph-find", P.icon("search") + '<input type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + (adm ? "Find anyone in the school" : "Find a student") + '" aria-label="Find">');
    var inp = f.querySelector("input");
    L.add(f);
    var seg = null, filter = mode === "risk" ? "risk" : "all";
    if (!adm) {
      seg = P.seg([{ k: "all", label: "All" }, { k: "risk", label: "Below a pass" }, { k: "missing", label: "Missing work" }], filter, function (k) { filter = k; draw(); });
      L.add(seg);
    }
    var host = L.add(el("div"));
    host.style.marginTop = "6px";
    host.appendChild(P.skel(5, 62));
    var data = null, limit = 60;
    (adm ? Dt.people() : Dt.students().then(function (r) { return r.students; })).then(function (list) { data = list; draw(); }, function (e) { P.fail(host, e, function () { L.el.remove(); K.openStaff("students"); }); });
    function draw() {
      host.innerHTML = "";
      var q = inp.value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
      var hits = data.filter(function (s) {
        if (!adm) {
          if (filter === "risk" && !(s.standing != null && s.standing < 70)) return false;
          if (filter === "missing" && !(s.missing > 0)) return false;
        }
        var hay = ((s.name || "") + " " + (s.email || "") + " " + (s.title || "")).toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) > -1; });
      });
      hits.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
      if (!hits.length) { host.appendChild(P.empty(q ? "Nobody found" : "Nobody here", q ? "Try part of a name or an email." : "")); return; }
      host.appendChild(el("p", "ph-sub", esc(plural(hits.length, adm ? "person" : "student", adm ? "people" : "students"))));
      var g = P.group();
      hits.slice(0, limit).forEach(function (s) {
        var sub = adm ? (s.title || s.email || "") : [s.standing != null ? num(s.standing) + "%" : "No marks", s.missing ? s.missing + " missing" : ""].filter(Boolean).join(" · ");
        var row = el("button", "ph-row has-ic");
        row.type = "button";
        row.appendChild(P.shared.avatar(s.name, 36));
        row.appendChild(el("span", "t", "<b>" + esc(s.name) + "</b><small>" + esc(sub) + "</small>"));
        if (!adm && s.standing != null) row.appendChild(el("span", "v", "<span class='ph-gr " + (s.standing >= 80 ? "ok" : s.standing >= 70 ? "" : s.standing >= 60 ? "orange" : "red") + "'>" + esc(num(s.standing)) + "%</span>"));
        row.insertAdjacentHTML("beforeend", P.chev);
        row.addEventListener("click", function () { openStudent(s.id, s.name, s); });
        g.appendChild(row);
      });
      host.appendChild(g);
      if (hits.length > limit) {
        var r = el("div", "ph-btnrow");
        r.appendChild(cta("Show more", "quiet", function () { limit += 80; draw(); }));
        host.appendChild(r);
      }
    }
    inp.addEventListener("input", function () { limit = 60; if (data) draw(); });
  }

  function openStudent(id, name, row) {
    place("student:" + id, name || "Student", 2, { tone: "blue", label: name || "Student", back: up(isAdmin() ? "People" : "Students", "students") }, function (L) { buildStudent(L, id, name, row); });
  }
  function buildStudent(L, id, name, row) {
    init();
    var hero = el("div", "ph-me");
    var av = el("div", "av", esc(String(name || "?").split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase()));
    P.hue(av, row && row.hue);
    hero.appendChild(av);
    hero.appendChild(el("h1", null, esc(name || "Student")));
    var sub = el("p", null, esc(row && row.title ? row.title : "")); hero.appendChild(sub);
    L.add(hero);
    L.titleEl = hero.querySelector("h1");
    L.barTitle.textContent = name || "Student";
    var host = L.add(el("div"));
    host.appendChild(P.skel(3, 90));
    Promise.all([settle(API.reporting.report(id)), settle(AT.family(id)), settle(Dt.codes()), settle(API.family.guardians(id)), settle(API.family.getContact(id)), settle(API.graduation.get(id))]).then(function (r) {
      host.innerHTML = "";
      var rep = r[0].ok ? r[0].v : null, reg = r[1].ok ? r[1].v : null, codes = r[2].ok ? r[2].v : null, guard = r[3].ok ? r[3].v : [], contact = r[4].ok ? r[4].v : null, grad = r[5].ok ? r[5].v : null;
      var bits = [];
      if (grad && grad.program && grad.program.gradeLevel) bits.push("Grade " + grad.program.gradeLevel);
      if (grad && grad.program && grad.program.name) bits.push(grad.program.name);
      if (grad && grad.program && grad.program.expectedGrad) bits.push("Class of " + String(grad.program.expectedGrad).slice(0, 4));
      if (bits.length) sub.textContent = bits.join(" · ");

      // Reaching them.
      var phones = [];
      if (contact && contact.cellPhone) phones.push({ who: name, n: contact.cellPhone });
      guard.forEach(function (g) { if (g.contact && g.contact.cellPhone) phones.push({ who: g.name, n: g.contact.cellPhone }); });
      var qa = el("div", "ph-qa");
      function qaBtn(icon, label, go, off) {
        var b = el("button", "ph-q" + (off ? " off" : ""), "<span>" + P.icon(icon) + "</span><b>" + esc(label) + "</b>");
        b.type = "button";
        if (off) b.disabled = true; else b.addEventListener("click", go);
        qa.appendChild(b);
      }
      qaBtn("mail", "Message", function () { P.shared.compose({ id: id, name: name }); });
      qaBtn("phone", "Call", function () { if (phones.length === 1) location.href = "tel:" + phones[0].n.replace(/[^\d+]/g, ""); else callSheet(phones); }, !phones.length);
      qaBtn("pin", "Address", function () { P.sheet({ title: "Address", tone: "gray", body: function (b) { var g = P.group(); g.appendChild(el("div", "ph-prose", esc(contact.mailingAddress))); b.appendChild(g); } }); }, !(contact && contact.mailingAddress));
      host.appendChild(qa);

      // Grades.
      if (rep && rep.courses && rep.courses.length) {
        host.appendChild(P.sh("Grades", rep.standing != null ? { label: "Average " + num(rep.standing) + "%" } : null));
        var g = P.group();
        rep.courses.forEach(function (c) {
          var gr = c.grade, p = gr && gr.percent;
          g.appendChild(P.row({ dot: true, tone: P.toneOf(c.subject || c.title), title: c.title, sub: [gr && gr.missingCount ? gr.missingCount + " missing" : "", c.trend && c.trend.change ? (c.trend.change > 0 ? "▲ " : "▼ ") + Math.abs(c.trend.change) + " pts" : ""].filter(Boolean).join(" · ") || (gr && gr.itemCount ? plural(gr.itemCount, "mark") : "No marks yet"),
            valueHtml: p == null ? "<small>—</small>" : "<span class='ph-gr " + (p >= 80 ? "ok" : p >= 70 ? "" : p >= 60 ? "orange" : "red") + "'>" + esc(gr.letter || "") + "</span><small>" + esc(num(p)) + "%</small>", chev: false }));
        });
        host.appendChild(g);
      }

      // Attendance.
      if (reg && reg.online !== false) {
        var year = X.yearOf(todayIso());
        var m = X.regModel({ online: true, attendance: reg.attendance.filter(function (x) { return x.day >= year.from && x.day <= year.to; }) }, codes);
        if (m.totals.marks) {
          host.appendChild(P.sh("Attendance"));
          var ag = P.group();
          ag.appendChild(P.row({ icon: "check", tone: "teal", title: num(m.rate) + "% present", sub: [m.daysAbsent ? plural(m.daysAbsent, "full day") + " absent" : "No full days absent", m.totals.tardy ? plural(m.totals.tardy, "late arrival") : ""].filter(Boolean).join(" · "), chev: false }));
          host.appendChild(ag);
        }
      }

      // Family.
      if (guard.length) {
        host.appendChild(P.sh("Family"));
        var fg = P.group();
        guard.forEach(function (gu) {
          var ph = gu.contact && gu.contact.cellPhone;
          fg.appendChild(P.row({ icon: "person", tone: "gray", title: gu.name, sub: [gu.label || gu.relationship, ph].filter(Boolean).join(" · "), go: function () { reachSheet(gu); } }));
        });
        host.appendChild(fg);
      }

      // Diploma.
      if (grad && grad.totals) {
        host.appendChild(P.sh("Diploma"));
        var dg = P.group();
        var tot = grad.track ? grad.track.total : null;
        dg.appendChild(P.row({ icon: "cap", tone: "purple", title: num(grad.totals.earned) + (tot ? " of " + num(tot) : "") + " credits", sub: grad.totals.remaining > 0 ? num(grad.totals.remaining) + " still needed" : "All earned", chev: false }));
        if (tot) { var mt = P.meter(grad.totals.earned / tot * 100); mt.style.cssText = "margin:0 16px 14px"; dg.appendChild(mt); }
        host.appendChild(dg);
      }
      if (!rep && !reg && !guard.length && !grad) host.appendChild(P.empty("Nothing to show", "You may not have access to this person’s record."));
    }, function (e) { P.fail(host, e, function () { L.el.remove(); openStudent(id, name, row); }); });
  }
  function callSheet(phones) {
    P.sheet({ title: "Call", tone: "gray", body: function (b) {
      var g = P.group();
      phones.forEach(function (p) { var a = el("a", "ph-row has-ic", "<span class='ic'>" + P.icon("phone") + "</span><span class='t'><b>" + esc(p.who) + "</b><small>" + esc(p.n) + "</small></span>"); a.href = "tel:" + p.n.replace(/[^\d+]/g, ""); g.appendChild(a); });
      b.appendChild(g);
    } });
  }
  function reachSheet(gu) {
    P.sheet({ title: gu.name, sub: [gu.label || gu.relationship, gu.primary ? "Primary contact" : ""].filter(Boolean).join(" · "), tone: "gray", body: function (b) {
      var g = P.group(), ph = gu.contact && gu.contact.cellPhone, alt = gu.contact && gu.contact.altPhone;
      function link(icon, title, sub, href) { var a = el("a", "ph-row has-ic", "<span class='ic'>" + P.icon(icon) + "</span><span class='t'><b>" + esc(title) + "</b><small>" + esc(sub) + "</small></span>"); a.href = href; g.appendChild(a); }
      if (ph) link("phone", "Call", ph, "tel:" + ph.replace(/[^\d+]/g, ""));
      if (alt) link("phone", "Call other number", alt, "tel:" + alt.replace(/[^\d+]/g, ""));
      if (gu.email) link("mail", "Email", gu.email, "mailto:" + gu.email);
      g.appendChild(P.row({ icon: "send", tone: "gray", title: "Message in OEdu", chev: false, go: function () { P.top(); P.shared.compose({ id: gu.id, name: gu.name }); } }));
      b.appendChild(g);
    } });
  }

  /* ============================================================== Classes */
  function buildClasses(L) {
    init();
    L.head({ eyebrow: "Teach", title: "Classes" });
    var host = L.add(el("div"));
    host.appendChild(P.skel(4, 72));
    Dt.teaching().then(function (r) {
      host.innerHTML = "";
      var list = r.courses.slice().sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
      if (!list.length) { host.appendChild(P.empty("No classes yet", "An administrator enrols you as a teacher on a course.")); return; }
      host.appendChild(el("p", "ph-sub", esc(plural(list.length, "class", "classes") + " · " + plural(r.totals.students, "student"))));
      var g = P.group();
      list.forEach(function (c) {
        g.appendChild(P.row({ dot: true, tone: P.toneOf(c.subject || c.title), title: c.title, sub: [plural(c.students, "student"), c.unmarked ? c.unmarked + " to mark" : "", c.atRisk ? c.atRisk + " below a pass" : ""].filter(Boolean).join(" · "),
          valueHtml: c.average != null ? "<b>" + esc(num(c.average)) + "%</b><small>average</small>" : "", go: function () { openClass(c); } }));
      });
      host.appendChild(g);
    }, function (e) { P.fail(host, e, function () { L.el.remove(); K.openStaff("courses"); }); });
  }
  function openClass(c) {
    place("class:" + c.id, c.title, 2, { tone: P.toneOf(c.subject || c.title), label: c.title, back: up("Classes", "courses") }, function (L) {
      var tone = P.toneOf(c.subject || c.title);
      var lead = el("div", "ph-lead t-" + tone);
      lead.innerHTML = '<div class="row"><div><p class="k">' + esc(c.subject || "Class") + "</p><h2>" + esc(c.title) + '</h2><p class="s">' + esc(plural(c.students, "student")) + '</p></div><span class="ringslot"></span></div><div class="chips"></div>';
      lead.querySelector(".ringslot").replaceWith(P.ring(c.average == null ? 0 : c.average, { size: 104, stroke: 9, dark: true, center: c.average == null ? "<small>No marks</small>" : "<b>" + esc(num(c.average)) + "<span class='pc'>%</span></b><small>average</small>" }));
      var chips = lead.querySelector(".chips");
      if (c.unmarked) chips.appendChild(el("span", null, c.unmarked + " to mark"));
      if (c.atRisk) chips.appendChild(el("span", null, c.atRisk + " below a pass"));
      if (!chips.children.length) chips.remove();
      L.titleEl = null;
      L.barTitle.textContent = c.title;
      L.add(lead);
      var g = P.group();
      g.style.marginTop = "18px";
      g.appendChild(P.row({ icon: "check", tone: "teal", title: "Take attendance", sub: "Today’s register", go: function () { openRoll({ id: c.id, title: c.title, subject: c.subject }, todayIso()); } }));
      g.appendChild(P.row({ icon: "table", tone: tone, title: "Gradebook", sub: "On the full console", go: function () { K.openStaff("roster"); } }));
      L.add(g);
      if (c.needs && c.needs.length) {
        L.add(P.sh("Needs you"));
        var ng = P.group();
        c.needs.forEach(function (n) { ng.appendChild(P.row({ icon: "tray", tone: "pink", title: n.title, sub: n.count + (n.kind === "overdue" ? " not marked" : " to mark"), chev: false })); });
        L.add(ng);
      }
      var host = L.add(el("div"));
      host.appendChild(P.skel(2, 62));
      Dt.students().then(function (r) {
        var rows = r.students.filter(function (s) { return (s.courses || []).some(function (x) { return x.courseId === c.id; }); });
        host.innerHTML = "";
        if (!rows.length) return;
        host.appendChild(P.sh("Students"));
        var sg = P.group();
        rows.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }).forEach(function (s) {
          var cc = s.courses.filter(function (x) { return x.courseId === c.id; })[0], gr = cc && cc.grade, p = gr && gr.percent;
          var row = el("button", "ph-row has-ic");
          row.type = "button";
          row.appendChild(P.shared.avatar(s.name, 34));
          row.appendChild(el("span", "t", "<b>" + esc(s.name) + "</b><small>" + esc(cc && cc.missing ? cc.missing + " missing" : p == null ? "No marks yet" : "") + "</small>"));
          row.appendChild(el("span", "v", p == null ? "" : "<span class='ph-gr " + (p >= 80 ? "ok" : p >= 70 ? "" : p >= 60 ? "orange" : "red") + "'>" + esc(gr.letter || num(p) + "%") + "</span><small>" + esc(num(p)) + "%</small>"));
          row.insertAdjacentHTML("beforeend", P.chev);
          row.addEventListener("click", function () { openStudent(s.id, s.name, s); });
          sg.appendChild(row);
        });
        host.appendChild(sg);
      }, function () { host.innerHTML = ""; });
    });
  }

  /* ========================================================= Everything else */
  function adapted(tab, draw) {
    var sec = K.sections().filter(function (t) { return t.k === tab; })[0];
    var title = sec ? sec.name : tab;
    P.present("page:" + tab, 1, { tone: "blue", label: title, route: function (L) { L.redraw && L.redraw(); } }, function (L) {
      L.head({ eyebrow: sec && sec.group ? sec.group : "", title: title });
      var w = el("div", "ph-adapt");
      L.add(w);
      P.shared.adapt(w);
      P.legacy(L, w, draw);
    });
  }

  P.staff = function (tab, o) {
    init();
    buildHome();
    switch (tab) {
      case "today": P.popAll(); return;
      case "inbox": case "messages": layer("inbox", 1, "blue", "Inbox", P.shared.buildInbox); return;
      case "attendance": layer("attendance", 1, "teal", "Attendance", buildAttendance); return;
      case "students": layer("students", 1, "blue", "Students", function (L) { buildStudents(L, "all"); }); return;
      case "courses": if (!isAdmin()) { layer("classes", 1, "indigo", "Classes", buildClasses); return; } break;
    }
    adapted(tab, o.draw);
  };
};
