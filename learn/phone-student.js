/* ==========================================================================
   OEdu on a phone — the student's places, part one.

   The same facts as the student console (student.js reads them; this draws
   them again), shown the way a phone can hold them: the home screen says what
   is happening now and what needs you, six tiles say one thing each, and
   everything else is a layer that opens over it. Nothing here is a score for
   being here — a number is a fact the school entered or a sum the server made
   of facts the school entered, as on the desktop.

     Home          what is happening now · what needs you · six places
     Search        a place, a course, a piece of work
     Schedule      the day, a week strip, the month
     Courses       a stack, then one course with its grade as the picture
     Assignments   to do · past due · done
     Grades        the average, and each course

   Part two (phone-record.js) is attendance, the record, and me.
   ========================================================================== */
window.OPLO_PHONE_STUDENT = function (P) {
  "use strict";

  var K = P.K, el = P.el, esc = P.esc, API = K.API;
  var X = null, D = null;
  var plural, num, relDay, clock, span, short, longDay, pctOf, settle, iso, parse, addDays, todayIso, pad;
  var H = P.sx = {};

  function init() {
    if (X) return;
    X = K.stu().kit; D = X.D;
    plural = X.plural; num = X.num; relDay = X.relDay; clock = X.clock; span = X.span; short = X.short; longDay = X.longDay;
    pctOf = X.pctOf; settle = X.settle; iso = X.iso; parse = X.parse; addDays = X.addDays; todayIso = X.todayIso; pad = X.pad;
    H.X = X; H.D = D;
  }
  H.init = init;

  /* ----------------------------------------------------------- Small things */
  function minOf(t) { return t ? +String(t).slice(0, 2) * 60 + +String(t).slice(3, 5) : null; }
  function nowMin() { var n = new Date(); return n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60; }
  function byStart(a, b) { return (a.startsAt || "99") < (b.startsAt || "99") ? -1 : (a.startsAt || "99") > (b.startsAt || "99") ? 1 : 0; }
  function periodLabel(pds) {
    var t = (pds || []).map(function (p) { return String(p).replace(/^[A-Za-z]+/, "") || p; });
    var same = t.filter(function (x, i) { return t.indexOf(x) === i; });
    return same.length === 1 ? "Period " + same[0] : same.length ? "Periods " + same.join(", ") : "";
  }
  function weekdayName(date) { return X.DOWL[parse(date).getDay()]; }
  function gradeTone(p) { return p == null ? "" : p >= 80 ? "ok" : p >= 70 ? "" : p >= 60 ? "orange" : "red"; }
  function areaOf(secById, courseId, fallback) { var s = secById[courseId]; return P.toneOf((s && (s.area || s.title)) || fallback); }
  function yearLabel(t) { var y = X.yearOf(t); return y.from.slice(0, 4) + "–" + y.to.slice(2, 4); }
  H.minOf = minOf; H.periodLabel = periodLabel; H.gradeTone = gradeTone; H.areaOf = areaOf; H.yearLabel = yearLabel; H.weekdayName = weekdayName;

  /* One place to say what a piece of work is, and where. */
  function openWork(w, secById) {
    var now = Date.now(), s = X.stateOf(w, now), sec = secById && secById[w.courseId];
    var graded = s === "graded";
    P.sheet({
      title: w.title, sub: w.courseTitle + (w.category ? " · " + w.category : ""), tone: areaOf(secById || {}, w.courseId, w.courseTitle),
      body: function (host) {
        var g = P.group();
        var rows = [
          ["Status", X.STATE_TEXT[s]],
          ["Due", w.dueAt ? longDay(iso(new Date(w.dueAt))) + (w.dueAt < now && !graded ? " (past)" : "") : "No due date"],
          ["Points", num(w.outOf) + (w.extraCredit ? " · extra credit" : "")],
          ["Mark", graded ? num(w.score) + " of " + num(w.outOf) + " · " + num(pctOf(w.score, w.outOf)) + "%" :
            s === "missing" ? "Missing — counted as " + num(w.outOf * (w.minScore || 0) / 100) + " of " + num(w.outOf) : s === "excused" ? "Excused" : null],
          ["Marked", w.gradedAt ? longDay(iso(new Date(w.gradedAt))) : null],
          ["Handed in", w.submittedAt ? longDay(iso(new Date(w.submittedAt))) : null],
          ["Teacher", sec ? X.teacherNames(sec) : null]
        ];
        rows.forEach(function (r) { if (r[1]) g.appendChild(el("div", "ph-kv", "<small>" + esc(r[0]) + "</small><span>" + esc(r[1]) + "</span>")); });
        host.appendChild(g);
        var d = w.details || {};
        if (d.about || w.feedback || (d.link && /^https:\/\//i.test(d.link))) {
          var g2 = P.group();
          g2.style.marginTop = "14px";
          if (w.feedback) g2.appendChild(el("div", "ph-prose", "<small>Teacher’s comment</small>" + esc(w.feedback)));
          if (d.about) g2.appendChild(el("div", "ph-prose", "<small>About this work</small>" + esc(d.about)));
          if (d.link && /^https:\/\//i.test(d.link)) {
            var a = el("a", "ph-row", "<span class='t'><b>" + esc(d.link.replace(/^https:\/\//i, "").slice(0, 44)) + "</b><small>Opens in a new tab</small></span>" + P.chev);
            a.href = d.link; a.target = "_blank"; a.rel = "noopener noreferrer";
            g2.appendChild(a);
          }
          host.appendChild(g2);
        }
        if (w.activity && w.activity.kind) host.appendChild(P.note("This is done on Kern, and is handed in from there."));
      }
    });
  }
  H.openWork = openWork;

  /* =================================================================== Home */
  var home = null;

  function buildHome() {
    var Hm = P.home();
    if (Hm.built) return Hm;
    Hm.built = true;
    home = Hm;
    var me = X.me(), sc = Hm.scroll;
    sc.innerHTML = "";
    var top = el("div", "ph-top");
    top.innerHTML = '<div class="brand"><svg viewBox="12 12 76 76" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M12,40 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0 M32,60 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0"/></svg><span>' + esc(K.schoolName()) + "</span></div>";
    top.appendChild(P.btn("", P.icon("search"), "Search", openSearch));
    Hm.mailBtn = P.btn("", P.icon("mail"), "Messages", function () { K.open("inbox"); });
    top.appendChild(Hm.mailBtn);
    var av = el("button", "ph-av", esc(me.initials || ""));
    av.type = "button";
    P.hue(av, me.hue);
    av.setAttribute("aria-label", "You");
    av.addEventListener("click", function () { K.open("profile"); });
    top.appendChild(av);
    sc.appendChild(top);

    var hi = el("div", "ph-hi");
    hi.innerHTML = '<p class="eb">' + esc(longDay(todayIso())) + "</p><h1>" + esc(P.greet(String(me.name || "").split(" ")[0])) + "</h1>";
    sc.appendChild(hi);
    Hm.titleEl = hi;

    Hm.hero = el("div", "ph-hero-slot");
    Hm.hero.appendChild(el("span", "ph-skel", ""));
    Hm.hero.firstChild.style.cssText = "height:270px;margin:20px 16px 0;border-radius:34px";
    sc.appendChild(Hm.hero);
    Hm.notes = el("div", "ph-notes");
    sc.appendChild(Hm.notes);

    var tiles = el("div", "ph-tiles");
    Hm.tiles = {};
    [
      { k: "schedule", tone: "orange", icon: "calendar", label: "Today" },
      { k: "courses", tone: "indigo", icon: "books", label: "Courses" },
      { k: "assignments", tone: "pink", icon: "tray", label: "Due this week" },
      { k: "grades", tone: "green", icon: "chart", label: "Average", ring: true },
      { k: "attendance", tone: "teal", icon: "check", label: "Present", ring: true },
      { k: "graduation", tone: "purple", icon: "cap", label: "Credits", ring: true }
    ].forEach(function (t) {
      var b = el("button", "ph-tile t-" + t.tone);
      b.type = "button";
      b.innerHTML = '<span class="g">' + P.icon(t.icon) + '</span><span class="tx"><span class="v">—</span><span class="l">' + esc(t.label) + "</span></span>";
      b.addEventListener("click", function () { K.open(t.k); });
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

    var more = el("button", "ph-more", P.icon("dots") + "<span>More</span>");
    more.type = "button";
    more.addEventListener("click", openMore);
    sc.appendChild(more);

    Hm.onShow = function () { if (Hm.at && Date.now() - Hm.at > 25000) paintHome(); };
    Hm.timer = setInterval(function () { if (!document.hidden && P.depth() === 0 && Hm.model) paintHero(); }, 30000);
    P.onLeave = function () { clearInterval(Hm.timer); };
    P.pull(Hm, function () { X.bust(); return paintHome(); });
    paintHome();
    return Hm;
  }

  /* What is happening now, as one saturated surface. */
  function dayModel(dayRes) {
    if (!dayRes.ok) return null;
    var dd = dayRes.v, entry = dd.day || {};
    if (entry.kind !== "school") return { off: true, entry: entry, items: [] };
    var items = (dd.items || []).filter(function (x) { return x.meets && x.periods.length; });
    items.sort(byStart);
    return { items: items, entry: entry, sched: dd.schedule };
  }

  /* The next school day after today, and its first class: for after the last
     bell, and for a day off. Read from the calendar, so a week-long break is
     one step; a break with a name is said ("Fall break"). */
  function nextDay(from) {
    return settle(D.calendar(addDays(from, 1), addDays(from, 60))).then(function (r) {
      if (!r.ok) return null;
      var days = (r.v.days || []).slice().sort(function (a, b) { return a.day < b.day ? -1 : 1; });
      var school = days.filter(function (d) { return d.kind === "school" && d.day > from; })[0];
      if (!school) return null;
      var gap = days.filter(function (d) { return d.day > from && d.day < school.day && d.kind !== "school" && d.kind !== "none" && d.label; })[0];
      return settle(D.day(school.day)).then(function (x) {
        var m = dayModel(x);
        return m && !m.off && m.items.length ? { date: school.day, first: m.items[0], gap: gap ? gap.label : "" } : null;
      });
    });
  }
  function whenName(date) {
    var t = todayIso();
    return date === addDays(t, 1) ? "Tomorrow" : date <= addDays(t, 6) ? weekdayName(date) : weekdayName(date).slice(0, 3) + " " + X.MONS[parse(date).getMonth()] + " " + parse(date).getDate();
  }

  function heroModel(d, nxt) {
    var secs = d.secs.ok ? d.secs.v : [], secById = X.byCourse(secs);
    var dm = dayModel(d.day);
    function toneFor(x) { return areaOf(secById, x.courseId, x.title); }
    function goFor(x) { var s = secById[x.courseId]; return function () { K.open("courses", X.slugOf(s, x.courseId)); }; }
    function where(x) { var s = secById[x.courseId]; return [x.room ? "Room " + x.room : "", s ? X.teacherShort(s) : ""].filter(Boolean).join(" · "); }
    function chipFor(date, x) {
      return x ? { label: whenName(date), text: x.title, time: x.startsAt ? clock(x.startsAt) : "" } : null;
    }
    if (d.secs.ok && !secs.length) return { tone: "gray", quiet: true, k: "Not in a section yet", title: "No classes yet", sub: "When the school puts you in a section, your day appears here.", go: function () { K.open("schedule"); } };
    if (!dm) return { tone: "gray", quiet: true, k: "Today", title: "Couldn’t read today", sub: "Check your connection and open OEdu again.", go: function () { K.open("schedule"); } };
    if (dm.off) {
      var e = dm.entry, weekend = parse(todayIso()).getDay() % 6 === 0;
      return { tone: "teal", quiet: true, k: "No school", title: e.label || (weekend ? "It’s the weekend" : "No school today"),
        sub: nxt ? (nxt.gap && nxt.gap !== e.label ? nxt.gap + ". " : "") + "Classes pick up " + (nxt.date === addDays(todayIso(), 1) ? "tomorrow" : "on " + whenName(nxt.date)) + "." : "Enjoy the day.",
        chip: nxt ? chipFor(nxt.date, nxt.first) : null, go: function () { K.open("schedule"); } };
    }
    var items = dm.items;
    if (!items.length) return { tone: "gray", quiet: true, k: "Today", title: "Nothing of yours meets", sub: "You have no classes on today’s schedule.", go: function () { K.open("schedule"); } };
    if (!items.some(function (x) { return x.startsAt; })) {
      return { tone: toneFor(items[0]), k: "Today · " + plural(items.length, "class", "classes"), title: items[0].title, sub: items.slice(1, 4).map(function (x) { return x.title; }).join(" · "),
        go: function () { K.open("schedule"); } };
    }
    var n = nowMin(), cur = null, up = null, i;
    for (i = 0; i < items.length; i++) {
      var s0 = minOf(items[i].startsAt), e0 = minOf(items[i].endsAt);
      if (s0 != null && e0 != null && n >= s0 && n < e0) { cur = items[i]; up = items[i + 1] || null; break; }
      if (s0 != null && n < s0) { up = items[i]; break; }
    }
    if (cur) {
      var a = minOf(cur.startsAt), b = minOf(cur.endsAt), left = Math.max(1, Math.ceil(b - n));
      return { tone: toneFor(cur), k: "Now · " + (periodLabel(cur.periods.slice(0, 1)) || "In class"), title: cur.title, sub: where(cur),
        ring: { pct: (n - a) / (b - a) * 100, big: left >= 100 ? Math.round(left / 6) / 10 + "" : String(left), small: left >= 100 ? "hr left" : "min left" },
        chip: up ? { label: "Next", text: up.title, time: clock(up.startsAt) } : { label: "Last class", text: "of the day", time: clock(cur.endsAt) + " out" },
        go: goFor(cur) };
    }
    if (up) {
      var first = up === items[0], mins = Math.ceil(minOf(up.startsAt) - n);
      return { tone: toneFor(up), k: first ? "First class" : "Up next", title: up.title, sub: where(up),
        ring: mins <= 90 ? { pct: Math.max(0, 100 - mins / (first ? 90 : 10) * 100), big: String(mins), small: "min away" } : null,
        chip: { label: "Starts", text: periodLabel(up.periods.slice(0, 1)) || "", time: clock(up.startsAt) }, go: goFor(up) };
    }
    return { tone: "indigo", quiet: true, k: "Done for today", title: "That’s the day", sub: "You had " + plural(items.length, "class", "classes") + " today." + (nxt && nxt.gap ? " " + nxt.gap + " is next." : ""),
      chip: nxt ? chipFor(nxt.date, nxt.first) : null, go: function () { K.open("schedule"); } };
  }

  function paintHero() {
    var Hm = home, m = Hm.model = heroModel(Hm.data, Hm.nxt);
    var b = P.hero(m);
    var old = Hm.hero.firstElementChild, first = !old || old.classList.contains("ph-skel");
    Hm.hero.innerHTML = "";
    Hm.hero.appendChild(b);
    Hm.el.className = Hm.el.className.replace(/\bt-\w+/g, "").trim() + " t-" + m.tone;
    if (first) P.rise([b], 0);
  }

  function paintHome() {
    var Hm = home;
    var work = homeData().then(function (d) {
      Hm.data = d; Hm.at = Date.now();
      var secs = d.secs.ok ? d.secs.v : [], secById = X.byCourse(secs);
      var w = d.work.ok ? d.work.v.work : [], now = Date.now();
      var codes = d.codes.ok ? d.codes.v : null;
      var year = X.yearOf(d.t0);
      var reg = d.regRaw.ok ? X.regModel({ online: d.regRaw.v.online, attendance: d.regRaw.v.attendance.filter(function (x) { return x.day >= year.from && x.day <= year.to; }) }, codes) : null;
      var regAll = d.regRaw.ok ? X.regModel(d.regRaw.v, codes) : null;

      // The hero, now and every half minute; after the last bell it reaches for tomorrow.
      Hm.nxt = null;
      paintHero();
      var dm = dayModel(d.day);
      if (!dm || dm.off || !dm.items.length || (function () { var l = dm.items[dm.items.length - 1]; return minOf(l.endsAt) != null && nowMin() >= minOf(l.endsAt); })()) {
        nextDay(d.t0).then(function (nx) { Hm.nxt = nx; paintHero(); });
      }

      // What needs you.
      var off = [];
      if (d.cal.ok) off = (d.cal.v.days || []).filter(function (x) { return x.kind !== "school" && x.kind !== "none" && x.day >= d.t0 && x.day <= addDays(d.t0, 6); });
      var list = X.noticesFor({ work: w, report: d.rep.ok ? d.rep.v : null, reg: regAll ? { online: regAll.online, daysAbsent: regAll.daysAbsent, rows: regAll.rows } : null, off: off });
      list = list.filter(function (n) { return n.tone || n.go[0] !== "schedule"; });
      Hm.notes.innerHTML = "";
      var shown = list.length > 2 ? 1 : list.length;
      list.slice(0, shown).forEach(function (n) {
        var b = el("button", "ph-nt " + (n.tone || ""), "<i></i><span>" + esc(n.text) + "</span>" + P.chev);
        b.type = "button";
        b.addEventListener("click", function () { K.open(n.go[0], n.go[1]); });
        Hm.notes.appendChild(b);
      });
      if (list.length > shown) {
        var more = el("button", "ph-nt", "<i></i><span>" + esc(plural(list.length - shown, "more thing needs", "more things need") + " a look") + "</span>" + P.chev);
        more.type = "button";
        more.addEventListener("click", function () { openNotices(list); });
        Hm.notes.appendChild(more);
      }

      // The six places.
      var open7 = w.filter(function (x) { var s = X.stateOf(x, now); return (s === "todo" || s === "handed") && x.dueAt && x.dueAt <= now + 7 * 86400000; });
      var pastDue = w.filter(function (x) { var s = X.stateOf(x, now); return s === "late" || s === "missing"; });
      var tdItems = dm && !dm.off ? dm.items.length : 0;
      Hm.tiles.schedule.setTile(dm && dm.off ? { value: "Off", plain: true, label: dm.entry.label || "No school today" } : { value: tdItems, label: tdItems === 1 ? "Class today" : "Classes today" });
      Hm.tiles.courses.setTile({ value: secs.length, label: secs.length === 1 ? "Course" : "Courses" });
      Hm.tiles.assignments.setTile({ value: d.work.ok ? open7.length : null, label: "Due this week", labelHtml: pastDue.length ? "Due this week · <em>" + pastDue.length + " late</em>" : null });
      Hm.tiles.grades.setTile({ value: d.rep.ok && d.rep.v.standing != null ? d.rep.v.standing : null, unit: "%", label: "Average", ring: d.rep.ok ? d.rep.v.standing : null });
      var rate = reg && reg.online && reg.rate != null ? reg.rate : null;
      Hm.tiles.attendance.setTile({ value: rate, unit: "%", dec: rate != null && rate % 1 ? 1 : 0, label: reg && !reg.online ? "Not shown" : "Present", ring: rate });
      var g = d.grad.ok ? d.grad.v : null, earned = g && g.totals ? g.totals.earned : null, total = g && g.track ? g.track.total : null;
      Hm.tiles.graduation.setTile({ value: earned, dec: earned != null && earned % 1 ? 1 : 0, label: total ? "of " + num(total) + " credits" : "Credits", ring: earned != null && total ? earned / total * 100 : null });
    }).catch(function (e) { P.fail(Hm.hero, e, function () { Hm.hero.innerHTML = ""; paintHome(); }); });

    // Mail: a dot when something is unread.
    var mail = API.inbox.unread().then(function (n) {
      var dot = Hm.mailBtn.querySelector(".dot");
      if (n > 0 && !dot) Hm.mailBtn.appendChild(el("i", "dot"));
      if (!n && dot) dot.remove();
    }, function () { /* no number */ });
    return Promise.all([work, mail]);
  }
  function homeData() {
    var t0 = todayIso();
    return Promise.all([settle(D.day(t0)), settle(D.work()), settle(D.report()), settle(D.register()), settle(D.codes()), settle(D.sections()),
      settle(D.calendar(t0, addDays(t0, 13))), settle(D.grad())]).then(function (r) {
      return { t0: t0, day: r[0], work: r[1], rep: r[2], regRaw: r[3], codes: r[4], secs: r[5], cal: r[6], grad: r[7] };
    });
  }
  H.homeData = homeData;

  function openNotices(list) {
    P.sheet({ title: "Needs a look", tone: "orange", body: function (host) {
      var g = P.group();
      list.forEach(function (n) {
        var r = P.row({ dot: true, tone: n.tone === "red" ? "red" : n.tone === "orange" ? "orange" : "gray", title: n.text, go: function () { K.open(n.go[0], n.go[1]); } });
        r.querySelector(".t b").style.fontWeight = "400";
        g.appendChild(r);
      });
      host.appendChild(g);
    } });
  }

  /* Everything, once, for the places a tile does not name. */
  function openMore() {
    P.sheet({ title: "Everything", tone: "gray", body: function (host) {
      function grp(title, rows) {
        host.appendChild(el("p", "ph-sub", esc(title)));
        var g = P.group();
        g.style.marginBottom = "18px";
        rows.forEach(function (r) { g.appendChild(P.row({ icon: r[2], tone: r[3], title: r[0], go: function () { K.open(r[1]); } })); });
        host.appendChild(g);
      }
      grp("School", [["Messages", "inbox", "mail", "blue"], ["Events", "events", "flag", "orange"], ["Menu", "menu", "rows", "green"], ["Forms", "forms", "doc", "purple"]]);
      grp("Record", [["Transcript", "transcript", "table", "purple"], ["Graduation", "graduation", "cap", "purple"]]);
      grp("Me", [["Profile", "profile", "person", "gray"], ["Course requests", "requests", "doc", "indigo"], ["Account", "account", "key", "gray"]]);
    } });
  }

  /* ================================================================ Search */
  function openSearch() { K.push("ph:search", "Search", showSearch); showSearch(); }
  function showSearch() {
    P.present("search", 1, { tone: "gray", label: "Search" }, function (L) {
      L.head({ title: "Search" });
      var f = el("label", "ph-find", P.icon("search") + '<input type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Courses, work, places" aria-label="Search">');
      var inp = f.querySelector("input");
      L.add(f);
      var host = L.add(el("div"));
      host.style.marginTop = "6px";
      var items = null;
      X.api.find().then(function (r) { items = r; draw(); }, function () { items = []; draw(); });
      function draw() {
        host.innerHTML = "";
        if (!items) return;
        var q = inp.value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
        var hit = items.filter(function (it) {
          var hay = (it.name + " " + (it.hint || "")).toLowerCase();
          return words.every(function (w) { return hay.indexOf(w) > -1; });
        });
        if (!hit.length) { host.appendChild(P.empty("Nothing found", "Try a course name, a piece of work, or a place like Grades.")); return; }
        [["place", "Places"], ["course", "Courses"], ["work", "Assignments"]].forEach(function (k) {
          var rows = hit.filter(function (it) { return it.kind === k[0]; }).slice(0, q ? 12 : (k[0] === "place" ? 14 : 5));
          if (!rows.length) return;
          host.appendChild(P.sh(k[1]));
          var g = P.group();
          rows.forEach(function (it) {
            g.appendChild(P.row({ icon: it.kind === "place" ? "rows" : it.kind === "course" ? "books" : "tray", tone: it.kind === "course" ? "indigo" : it.kind === "work" ? "pink" : "gray",
              title: it.name, sub: it.kind === "place" ? "" : String(it.hint || "").replace(/^(Course|Assignment) · /, "").replace(/^(\d+)( · |$)/, "Period $1$2"), go: it.go }));
          });
          host.appendChild(g);
        });
      }
      inp.addEventListener("input", draw);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { var b = host.querySelector(".ph-row"); if (b) b.click(); } });
      try { inp.focus({ preventScroll: true }); } catch (e) { /* old browsers */ }
    });
  }

  /* =============================================================== Schedule */
  function buildSchedule(L) {
    var t0 = todayIso();
    var st = { mode: "day", date: t0, weekOf: X.mondayOf(t0), month: t0.slice(0, 8) + "01" };
    L.head({ eyebrow: X.monthName(t0), title: "Schedule" });
    var seg = P.seg([{ k: "day", label: "Day" }, { k: "month", label: "Month" }], "day", function (k) { st.mode = k; draw(); });
    L.add(seg);
    var host = L.add(el("div"));
    var data = null;

    function load(from, to) {
      return Promise.all([settle(D.calendar(from, to)), settle(D.work()), settle(D.register()), settle(D.codes()), settle(D.sections())]).then(function (r) {
        var cal = {}, due = {}, w = r[1].ok ? r[1].v.work : [], now = Date.now();
        if (r[0].ok) (r[0].v.days || []).forEach(function (x) { cal[x.day] = x; });
        w.forEach(function (x) { var s = X.stateOf(x, now); if ((s === "todo" || s === "handed" || s === "late") && x.dueAt) due[iso(new Date(x.dueAt))] = (due[iso(new Date(x.dueAt))] || 0) + 1; });
        var reg = r[2].ok ? X.regModel(r[2].v, r[3].ok ? r[3].v : null) : null;
        data = { cal: cal, due: due, work: w, reg: reg, secs: r[4].ok ? r[4].v : [] };
        return data;
      });
    }
    function draw() {
      host.innerHTML = "";
      host.appendChild(P.skel(3, 84));
      var from = st.mode === "day" ? st.weekOf : addDays(X.mondayOf(st.month), 0);
      var to = st.mode === "day" ? addDays(st.weekOf, 6) : addDays(X.mondayOf(st.month), 41);
      var lo = from < t0 ? from : t0, hi = addDays(t0, 14) > to ? addDays(t0, 14) : to;
      load(lo, hi).then(function () {
        host.innerHTML = "";
        if (st.mode === "day") drawDay(); else drawMonth();
      }, function (e) { P.fail(host, e, draw); });
    }

    function navButtons(label, prev, next) {
      var bar = el("div", "ph-weekbar");
      bar.innerHTML = '<span class="wk">' + esc(label) + "</span>";
      var nav = el("div", "nav");
      nav.appendChild(P.btn("", P.icon("left"), "Earlier", prev));
      nav.appendChild(P.btn("", P.icon("right"), "Later", next));
      bar.appendChild(nav);
      return bar;
    }

    function drawDay() {
      host.appendChild(navButtons(X.MONS[parse(st.weekOf).getMonth()] + " " + parse(st.weekOf).getDate() + " – " + X.MONS[parse(addDays(st.weekOf, 6)).getMonth()] + " " + parse(addDays(st.weekOf, 6)).getDate(),
        function () { st.weekOf = addDays(st.weekOf, -7); st.date = addDays(st.date, -7); draw(); },
        function () { st.weekOf = addDays(st.weekOf, 7); st.date = addDays(st.date, 7); draw(); }));
      var strip = el("div", "ph-week");
      for (var i = 0; i < 7; i++) {
        (function (day) {
          var info = data.cal[day], off = info && info.kind !== "school";
          var b = el("button", "ph-wd" + (off ? " off" : "") + (day === t0 ? " today" : "") + (data.due[day] ? " has" : ""),
            "<small>" + esc(X.DOWS[parse(day).getDay()]) + "</small><b>" + parse(day).getDate() + "</b><i></i>");
          b.type = "button";
          b.setAttribute("aria-selected", day === st.date ? "true" : "false");
          b.setAttribute("aria-label", longDay(day));
          b.addEventListener("click", function () {
            st.date = day;
            [].forEach.call(strip.children, function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
            drawPanel();
          });
          strip.appendChild(b);
        })(addDays(st.weekOf, i));
      }
      host.appendChild(strip);
      var panel = el("div");
      host.appendChild(panel);
      function drawPanel() {
        panel.innerHTML = "";
        var date = st.date;
        panel.appendChild(P.skel(2, 84));
        settle(D.day(date)).then(function (r) {
          panel.innerHTML = "";
          if (st.date !== date) return;
          var secById = X.byCourse(data.secs), dm = dayModel(r);
          var title = el("div", "ph-daytitle", "<h2>" + esc(date === t0 ? "Today" : longDay(date)) + "</h2>");
          if (date === t0) title.appendChild(el("span", null, esc(longDay(date))));
          else if (dm && dm.sched && dm.sched.name && dm.sched.name.toLowerCase().indexOf(weekdayName(date).toLowerCase()) < 0) title.appendChild(el("span", null, esc(dm.sched.name)));
          panel.appendChild(title);
          if (!dm) { panel.appendChild(P.empty("Couldn’t read this day", "Try again in a moment.")); return; }
          if (dm.off) {
            var q = el("div", "ph-quiet");
            var wk = parse(date).getDay() % 6 === 0;
            q.innerHTML = "<b>" + esc(dm.entry.label || (wk ? "Weekend" : "No school")) + "</b><p>" + esc(dm.entry.label ? "No school this day." : wk ? "Nothing is scheduled." : "There are no classes this day.") + "</p>";
            panel.appendChild(q);
          } else if (!dm.items.length) {
            panel.appendChild(el("div", "ph-quiet", "<b>Nothing meets</b><p>You have no classes on this day’s schedule.</p>"));
          } else {
            var tl = el("div", "ph-tl"), n = nowMin();
            var marks = {};
            if (data.reg) data.reg.rows.forEach(function (x) { if (x.day === date) marks[x.courseId] = x; });
            dm.items.forEach(function (x) {
              var sec = secById[x.courseId], s0 = minOf(x.startsAt), e0 = minOf(x.endsAt);
              var past = date < t0 || (date === t0 && e0 != null && n >= e0), now = date === t0 && s0 != null && e0 != null && n >= s0 && n < e0;
              var m = marks[x.courseId];
              var b = el("button", "ph-pd t-" + areaOf(secById, x.courseId, x.title) + (now ? " now" : past ? " past" : ""));
              b.type = "button";
              var pds = (x.periods || []).filter(function (p) { return !dm.entry.periods || dm.entry.periods.indexOf(p) > -1; });
              b.innerHTML = "<span class='tm'>" + (x.startsAt ? "<b>" + esc(clock(x.startsAt).replace(/ [AP]M$/, "")) + "</b>" + (x.endsAt ? "<small>" + esc(clock(x.endsAt).replace(/ [AP]M$/, "")) + "</small>" : "") : "<b>" + esc(pds.join(", ")) + "</b>") + "</span>" +
                "<i class='bar'></i><span class='t'><b>" + esc(x.title) + "</b><small>" + esc([periodLabel(pds.length ? pds : x.periods), x.room ? "Room " + x.room : "", sec ? X.teacherShort(sec) : ""].filter(Boolean).join(" · ")) + "</small></span>" +
                (m ? "<span class='mk " + esc(m.kind) + "' title='" + esc(m.label) + "'>" + esc(m.mark) + "</span>" : "") +
                (now ? "<span class='live'><i style='width:" + Math.round((n - s0) / (e0 - s0) * 100) + "%'></i></span>" : "");
              b.addEventListener("click", function () { K.open("courses", X.slugOf(sec, x.courseId)); });
              tl.appendChild(b);
            });
            panel.appendChild(tl);
            P.rise([].slice.call(tl.children), 0);
            var loose = (dm.items.length ? [] : []);
            if (loose.length) panel.appendChild(P.note("Not in a period yet: " + loose.join(", ")));
          }
          drawComing(panel);
        });
      }
      drawPanel();
    }

    /* The next two weeks: days off and work due. */
    function drawComing(panel) {
      var ev = [], now = Date.now();
      Object.keys(data.cal).forEach(function (d) {
        var x = data.cal[d];
        if (x.kind !== "school" && x.kind !== "none" && d >= t0 && d <= addDays(t0, 14)) ev.push({ day: d, text: x.label || (x.kind === "staff" ? "Staff day" : x.kind === "canceled" ? "Canceled" : "No school"), kind: "off" });
      });
      data.work.forEach(function (x) {
        var s = X.stateOf(x, now);
        if ((s === "todo" || s === "handed") && x.dueAt && x.dueAt >= now && x.dueAt <= now + 14 * 86400000) ev.push({ day: iso(new Date(x.dueAt)), text: x.title, sub: x.courseTitle, kind: "due" });
      });
      ev.sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : 0; });
      if (!ev.length) return;
      panel.appendChild(P.sh("Coming up"));
      var g = P.group();
      ev.slice(0, 7).forEach(function (e) {
        g.appendChild(P.row({ icon: e.kind === "off" ? "flag" : "tray", tone: e.kind === "off" ? "teal" : "pink", title: e.text, sub: e.sub || "No school", value: relDay(parse(e.day).getTime()) }));
      });
      panel.appendChild(g);
    }

    function drawMonth() {
      var ms = st.month, d0 = parse(ms), mEnd = new Date(d0.getFullYear(), d0.getMonth() + 1, 0);
      host.appendChild(navButtons(X.monthName(ms),
        function () { var d = new Date(d0.getFullYear(), d0.getMonth() - 1, 1); st.month = iso(d); draw(); },
        function () { var d = new Date(d0.getFullYear(), d0.getMonth() + 1, 1); st.month = iso(d); draw(); }));
      var cal = el("div", "ph-cal");
      cal.innerHTML = '<div class="h">' + ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>";
      var grid = el("div", "g");
      var start = X.mondayOf(ms), cells = Math.ceil(((parse(iso(mEnd)) - parse(start)) / 864e5 + 1) / 7) * 7;
      for (var i = 0; i < cells; i++) {
        (function (day) {
          var inMonth = day.slice(0, 7) === ms.slice(0, 7), info = data.cal[day], off = info && info.kind !== "school";
          var regDay = data.reg && data.reg.days[day];
          var dot = regDay && day <= t0 ? regDay.state : data.due[day] ? "due" : "";
          var b = el("button", "ph-cd" + (inMonth ? "" : " out") + (off ? " off" : "") + (day === t0 ? " today" : ""), "<b>" + parse(day).getDate() + "</b>" + (dot ? "<i class='mkd " + dot + "'></i>" : ""));
          b.type = "button";
          b.setAttribute("aria-label", longDay(day) + (info && off && info.label ? ", " + info.label : ""));
          b.addEventListener("click", function () { st.date = day; st.weekOf = X.mondayOf(day); st.mode = "day"; seg.set("day"); draw(); });
          grid.appendChild(b);
        })(addDays(start, i));
      }
      cal.appendChild(grid);
      host.appendChild(cal);
      var lg = el("div", "ph-legend");
      lg.innerHTML = "<span><i style='background:var(--ph-green)'></i>Present</span><span><i style='background:var(--ph-orange)'></i>Part of the day</span><span><i style='background:var(--ph-red)'></i>Absent</span><span><i style='background:var(--ph-accent)'></i>Work due</span>";
      host.appendChild(lg);
      var offs = Object.keys(data.cal).filter(function (d) { var x = data.cal[d]; return d.slice(0, 7) === ms.slice(0, 7) && x.kind !== "school" && x.kind !== "none" && x.label; }).sort();
      // One row for a break, not one for each of its days.
      var runs = [];
      offs.forEach(function (d) {
        var last = runs[runs.length - 1];
        if (last && last.label === data.cal[d].label && (parse(d) - parse(last.to)) / 864e5 <= 3) last.to = d;
        else runs.push({ label: data.cal[d].label, from: d, to: d });
      });
      if (runs.length) {
        host.appendChild(P.sh("Days off"));
        var g = P.group();
        runs.forEach(function (r) { g.appendChild(P.row({ icon: "flag", tone: "teal", title: r.label, value: r.from === r.to ? short(r.from) : short(r.from) + " – " + short(r.to).replace(/^\w+ /, "") })); });
        host.appendChild(g);
      }
    }
    draw();
  }

  /* ================================================================ Courses */
  function sortedSections(secs) {
    function k(s) { var n = (s.periods || []).map(function (p) { return +String(p).replace(/^[A-Za-z]+/, "") || 99; }); return n.length ? Math.min.apply(null, n) : 99; }
    return secs.slice().sort(function (a, b) { return k(a) - k(b) || String(a.title).localeCompare(b.title); });
  }
  function buildCourses(L) {
    L.head({ eyebrow: yearLabel(todayIso()), title: "Courses" });
    var host = L.add(el("div"));
    host.appendChild(P.skel(3, 120));
    Promise.all([D.sections(), settle(D.report())]).then(function (r) {
      var secs = sortedSections(r[0]), rep = r[1].ok ? r[1].v : null, by = {};
      if (rep) rep.courses.forEach(function (c) { by[c.courseId] = c; });
      host.innerHTML = "";
      if (!secs.length) { host.appendChild(P.empty("No courses yet", "When the school puts you in a section, it appears here.")); return; }
      L.titleEl.querySelector("h1").insertAdjacentHTML("afterend", "<p>" + esc(plural(secs.length, "course")) + "</p>");
      var stk = el("div", "ph-stk");
      secs.forEach(function (s) {
        var c = by[s.courseId], g = c && c.grade;
        var b = el("button", "ph-cc t-" + P.toneOf(s.area || s.title));
        b.type = "button";
        b.innerHTML = '<div class="hd"><b>' + esc(s.title) + "</b>" + (g && g.percent != null ? '<span class="gr">' + esc((g.letter || "") + " · " + num(g.percent) + "%") + "</span>" : "") + "</div>" +
          '<div class="bd">' + esc([periodLabel(s.periods), s.room ? "Room " + s.room : ""].filter(Boolean).join(" · ")) + "<small>" + esc(X.teacherNames(s)) + "</small></div>";
        b.addEventListener("click", function () { K.open("courses", X.slugOf(s, s.courseId)); });
        stk.appendChild(b);
      });
      host.appendChild(stk);
      P.rise([].slice.call(stk.children), 0);
    }, function (e) { P.fail(host, e, function () { K.open("courses"); }); });
  }

  /* One course: the grade is the picture. */
  var GOALS = [["A", 93], ["B", 83], ["C", 73], ["D", 63]];
  function buildCourse(L, arg) {
    L.head({ title: "Course" });
    var host = L.add(el("div"));
    host.appendChild(P.skel(2, 150));
    Promise.all([D.sections(), settle(D.report()), settle(D.work()), settle(D.register()), settle(D.codes())]).then(function (r) {
      var sec = X.findSection(r[0], arg);
      host.innerHTML = "";
      if (!sec) { host.appendChild(P.empty("No such course", "It may have been archived, or it isn’t one of yours.")); return; }
      var secById = X.byCourse(r[0]), tone = P.toneOf(sec.area || sec.title);
      L.tone(tone);
      L.titleEl.remove();
      L.barTitle.textContent = sec.title;
      var rc = r[1].ok ? r[1].v.courses.filter(function (c) { return c.courseId === sec.courseId; })[0] : null, g = rc && rc.grade;
      var work = r[2].ok ? r[2].v.work.filter(function (w) { return w.courseId === sec.courseId; }) : [], now = Date.now();

      var lead = el("div", "ph-lead t-" + tone);
      lead.innerHTML = '<div class="row"><div><p class="k">' + esc(sec.area || "Course") + "</p><h2>" + esc(sec.title) + '</h2><p class="s">' +
        esc([periodLabel(sec.periods), sec.room ? "Room " + sec.room : ""].filter(Boolean).join(" · ")) + "<br>" + esc(X.teacherNames(sec)) + '</p></div><span class="ringslot"></span></div><div class="chips"></div>';
      var ring = P.ring(g && g.percent != null ? g.percent : 0, { size: 104, stroke: 9, dark: true,
        center: g && g.percent != null ? "<b>" + esc(num(g.percent)) + "<span class='pc'>%</span></b><small>" + esc(g.letter || "") + "</small>" : "<small>No marks</small>" });
      lead.querySelector(".ringslot").replaceWith(ring);
      var chips = lead.querySelector(".chips");
      if (rc && rc.trend) chips.appendChild(el("span", null, rc.trend.change ? (rc.trend.change > 0 ? "▲ " : "▼ ") + Math.abs(rc.trend.change) + " pts" : "Steady"));
      if (g && g.itemCount != null) chips.appendChild(el("span", null, plural(g.itemCount, "mark")));
      if (g && g.missingCount) chips.appendChild(el("span", null, g.missingCount + " missing"));
      if (!chips.children.length) chips.remove();
      host.appendChild(lead);

      // How the grade is made.
      var parts = g && g.parts && g.parts.length ? g.parts : null;
      if (parts) {
        host.appendChild(P.sh("How it’s made"));
        var pg = P.group();
        parts.forEach(function (p) {
          var d = el("div", "ph-part");
          d.innerHTML = '<div class="r"><b>' + esc(p.category) + "</b><span>" + esc(num(p.percent)) + "%<small>" + esc(plural(p.items, "mark") + (p.weight != null && parts.length > 1 ? " · " + num(p.weight) + "% of grade" : "")) + "</small></span></div>";
          d.appendChild(P.meter(p.percent, gradeTone(p.percent)));
          pg.appendChild(d);
        });
        host.appendChild(pg);
        if (g.dropped && g.dropped.length) host.appendChild(P.note(plural(g.dropped.length, "lowest mark is", "lowest marks are") + " dropped in this course."));
      }

      // A goal.
      var rest = work.filter(function (w) { return !w.status && w.outOf > 0 && !w.extraCredit; });
      if (g && g.percent != null && rest.length) {
        host.appendChild(P.sh("A goal"));
        var gg = P.group();
        gg.appendChild(P.row({ icon: "target", tone: tone, title: "What do I need?", sub: plural(rest.length, "piece") + " left · " + plural(num(rest.reduce(function (a, w) { return a + Number(w.outOf); }, 0)), "point"), go: function () { openGoal(sec, rest, tone); } }));
        host.appendChild(gg);
      }

      // Up next, and what came back.
      var openW = work.filter(function (w) { var s = X.stateOf(w, now); return s === "todo" || s === "late" || s === "handed"; })
        .sort(function (a, b) { return (a.dueAt || 8e15) - (b.dueAt || 8e15); });
      var back = work.filter(function (w) { return X.stateOf(w, now) === "graded"; }).sort(function (a, b) { return (b.gradedAt || 0) - (a.gradedAt || 0); });
      function workRows(title, list, more) {
        if (!list.length) return;
        host.appendChild(P.sh(title, more));
        var wg = P.group();
        list.forEach(function (w) {
          var s = X.stateOf(w, now), p = pctOf(w.score, w.outOf);
          wg.appendChild(P.row({ title: w.title, sub: [w.category, X.scoreText(w) && s !== "graded" ? X.scoreText(w) : ""].filter(Boolean).join(" · "),
            valueHtml: s === "graded" ? "<b>" + esc(num(w.score)) + "<small style='display:inline'> / " + esc(num(w.outOf)) + "</small></b>" : esc(X.dueText(w)) + (s === "late" || s === "missing" ? "<small style='color:var(--ph-" + (s === "missing" ? "red" : "orange") + ")'>" + esc(X.STATE_TEXT[s]) + "</small>" : s === "handed" ? "<small>Handed in</small>" : ""),
            go: function () { openWork(w, secById); }, cls: p != null && p < 70 && s === "graded" ? "low" : "" }));
        });
        host.appendChild(wg);
      }
      workRows("Up next", openW.slice(0, 5), openW.length > 5 ? { label: "All", go: function () { K.open("assignments"); } } : null);
      workRows("Marked", back.slice(0, 5));

      // Attendance in this course.
      if (r[3].ok && r[3].v.online !== false) {
        var reg = X.regModel({ online: true, attendance: r[3].v.attendance.filter(function (x) { return x.courseId === sec.courseId; }) }, r[4].ok ? r[4].v : null);
        if (reg.totals.marks) {
          host.appendChild(P.sh("Attendance"));
          var ag = P.group();
          ag.appendChild(P.row({ icon: "check", tone: "teal", title: num(reg.rate) + "% present", sub: [reg.totals.absent ? plural(reg.totals.absent, "absence") : "No absences", reg.totals.tardy ? plural(reg.totals.tardy, "late arrival") : ""].filter(Boolean).join(" · "), go: function () { K.open("attendance"); } }));
          host.appendChild(ag);
        }
      }

      // From the teacher.
      D.announce(sec.courseId).then(function (posts) {
        posts = (posts || []).slice().sort(function (a, b) { return ((b.body && b.body.at) || b.updatedAt || 0) - ((a.body && a.body.at) || a.updatedAt || 0); }).slice(0, 3);
        if (!posts.length) return;
        var wrap = el("div");
        wrap.appendChild(P.sh("From your teacher"));
        var ng = P.group();
        posts.forEach(function (p) {
          var b = p.body || {};
          ng.appendChild(el("div", "ph-prose", "<small>" + esc([b.by, relDay(b.at || p.updatedAt)].filter(Boolean).join(" · ")) + "</small><b style='display:block;margin-bottom:4px'>" + esc(b.title || "Announcement") + "</b>" + (b.text ? esc(b.text) : "")));
        });
        wrap.appendChild(ng);
        host.appendChild(wrap);
      }, function () { /* none to show */ });

      host.appendChild(P.sh("Teachers"));
      var tg = P.group();
      (sec.teachers || []).forEach(function (t) { tg.appendChild(P.row({ icon: "person", tone: tone, title: t.name, sub: t.role === "assistant" ? "Assistant" : "Teacher" })); });
      host.appendChild(tg);
    }, function (e) { P.fail(host, e, function () { K.open("courses", arg); }); });
  }

  /* What a goal needs: the server's own what-if, searched for the lowest
     average on the work left that reaches the goal. */
  function openGoal(sec, rest, tone) {
    P.sheet({ title: "What do I need?", sub: sec.title, tone: tone, body: function (host) {
      var cache = {};
      function whatAt(pct) {
        return API.grades.whatif(sec.courseId, X.me().id, rest.map(function (w) { return { assignmentId: w.assignmentId, score: Math.round(pct * w.outOf) / 100, status: "marked" }; })).then(function (r) { return r && r.then; });
      }
      function solve(min) {
        if (cache[min]) return cache[min];
        var p = whatAt(100).then(function (top) {
          if (!top) throw new Error("no answer");
          if (top.percent < min) return { kind: "out", best: top };
          return whatAt(0).then(function (floor) {
            if (floor && floor.percent >= min) return { kind: "safe" };
            var lo = 0, hi = 100;
            function step() {
              if (hi - lo <= 1) return { kind: "need", pct: hi };
              var mid = Math.round((lo + hi) / 2);
              return whatAt(mid).then(function (x) { if (x && x.percent >= min) hi = mid; else lo = mid; return step(); });
            }
            return step();
          });
        });
        cache[min] = p;
        p.catch(function () { delete cache[min]; });
        return p;
      }
      host.appendChild(el("p", "ph-sub", "Choose the grade you want. We’ll work out what it takes on the " + plural(rest.length, "piece") + " of work left."));
      var seg = P.seg(GOALS.map(function (g) { return { k: g[0], label: g[0] + "  " + g[1] + "%+" }; }), "", function () { });
      var out = el("div", "ph-big");
      out.style.cssText = "margin-top:16px;display:none";
      out.setAttribute("aria-live", "polite");
      [].forEach.call(seg.querySelectorAll("button"), function (b, i) {
        b.addEventListener("click", function () {
          var g = GOALS[i];
          out.style.display = "block";
          out.innerHTML = "<div class='tx'><p>Working it out…</p></div>";
          solve(g[1]).then(function (r) {
            var where = rest.length === 1 ? "on the last piece of work" : "on average across the " + rest.length + " pieces left";
            var an = g[0] === "A" ? "an A" : "a " + g[0];
            out.innerHTML = r.kind === "out" ? "<div class='tx'><h2>Not possible now</h2><p>Full marks " + where + " reaches " + esc(r.best.letter) + " (" + num(r.best.percent) + "%).</p></div>"
              : r.kind === "safe" ? "<div class='tx'><h2>Already secured</h2><p>" + (g[0] === "A" ? "An A" : "A " + g[0]) + " or better is safe whatever the rest scores.</p></div>"
              : "<div class='tx'><h2>About " + r.pct + "%</h2><p>To get " + an + ", aim for about " + r.pct + "% " + where + ".</p></div>";
          }, function () { out.innerHTML = "<div class='tx'><p>That couldn’t be worked out just now.</p></div>"; });
        });
      });
      host.appendChild(seg);
      host.appendChild(out);
    } });
  }

  /* ============================================================ Assignments */
  function buildAssignments(L, arg) {
    L.head({ eyebrow: "Academics", title: "Assignments" });
    var host = L.add(el("div"));
    host.appendChild(P.skel(4, 66));
    Promise.all([D.work(), settle(D.sections())]).then(function (r) {
      var w = r[0].work, secById = r[1].ok ? X.byCourse(r[1].v) : {}, now = Date.now();
      var bucket = { todo: [], late: [], done: [] };
      w.forEach(function (x) {
        var s = X.stateOf(x, now);
        if (s === "late" || s === "missing") bucket.late.push(x);
        else if (s === "graded" || s === "excused") bucket.done.push(x);
        else bucket.todo.push(x);
      });
      bucket.todo.sort(function (a, b) { return (a.dueAt || 8e15) - (b.dueAt || 8e15); });
      bucket.late.sort(function (a, b) { return (a.dueAt || 0) - (b.dueAt || 0); });
      bucket.done.sort(function (a, b) { return (b.gradedAt || b.dueAt || 0) - (a.gradedAt || a.dueAt || 0); });
      host.innerHTML = "";
      // Open on what matters: what is waiting, else what is late, else what came back.
      var cur = arg === "late" || arg === "done" || arg === "todo" ? arg : bucket.todo.length ? "todo" : bucket.late.length ? "late" : bucket.done.length ? "done" : "todo";
      var seg = P.seg([{ k: "todo", label: "To do", n: bucket.todo.length }, { k: "late", label: "Past due", n: bucket.late.length, hot: bucket.late.length > 0 }, { k: "done", label: "Done", n: bucket.done.length }],
        cur, function (k) { cur = k; draw(); });
      host.appendChild(seg);
      var list = el("div");
      host.appendChild(list);
      function dayBucket(x) {
        if (!x.dueAt) return "No due date";
        var d = iso(new Date(x.dueAt)), t = todayIso();
        if (d === t) return "Today";
        if (d === addDays(t, 1)) return "Tomorrow";
        if (d <= addDays(t, 6)) return "This week";
        if (d <= addDays(t, 13)) return "Next week";
        return "Later";
      }
      function draw() {
        list.innerHTML = "";
        var items = bucket[cur];
        if (!items.length) {
          list.appendChild(P.empty(cur === "todo" ? "All caught up" : cur === "late" ? "Nothing past due" : "Nothing marked yet",
            cur === "todo" ? "Nothing is waiting for you." : cur === "late" ? "Nothing is missing or overdue." : "Marks appear here as your teachers enter them."));
          return;
        }
        var groups = [], by = {};
        items.forEach(function (x) {
          var k = cur === "todo" ? dayBucket(x) : cur === "late" ? "" : (x.courseTitle || "");
          if (cur === "done") k = "";
          if (!by[k]) { by[k] = []; groups.push(k); }
          by[k].push(x);
        });
        groups.forEach(function (k) {
          if (k) list.appendChild(P.sh(k));
          else list.appendChild(el("div")).style.height = "16px";
          var g = P.group();
          by[k].forEach(function (x) {
            var s = X.stateOf(x, now), p = pctOf(x.score, x.outOf), tone = areaOf(secById, x.courseId, x.courseTitle);
            var right = cur === "done" ? (s === "graded" ? "<b class='" + (p != null && p < 70 ? "" : "") + "'>" + esc(num(x.score)) + "<small style='display:inline;color:var(--ph-label-3)'> / " + esc(num(x.outOf)) + "</small></b>" : "<small>Excused</small>")
              : esc(X.dueText(x)) + (s === "late" || s === "missing" ? "<small style='color:var(--ph-" + (s === "missing" ? "red" : "orange") + ")'>" + esc(X.STATE_TEXT[s]) + "</small>" : s === "handed" ? "<small>Handed in</small>" : "<small>" + esc(num(x.outOf)) + " pts</small>");
            g.appendChild(P.row({ dot: true, tone: tone, title: x.title, sub: [x.courseTitle, x.category].filter(Boolean).join(" · "), valueHtml: right, go: function () { openWork(x, secById); } }));
          });
          list.appendChild(g);
          P.rise([g], 0);
        });
      }
      draw();
    }, function (e) { P.fail(host, e, function () { K.open("assignments", arg); }); });
  }

  /* ================================================================== Grades */
  function buildGrades(L) {
    L.head({ eyebrow: "Academics", title: "Grades" });
    var host = L.add(el("div"));
    host.appendChild(P.skel(3, 90));
    Promise.all([D.report(), D.sections(), settle(D.work())]).then(function (r) {
      var rep = r[0], secs = r[1], secById = X.byCourse(secs), w = r[2].ok ? r[2].v.work : [], now = Date.now();
      host.innerHTML = "";
      if (!rep.courses.length) { host.appendChild(P.empty("No courses yet", "Your grades appear here once the school puts you in a section.")); return; }
      var graded = rep.courses.filter(function (c) { return c.grade && c.grade.percent != null; });
      var low = graded.slice().sort(function (a, b) { return a.grade.percent - b.grade.percent; })[0];
      var big = el("div", "ph-big t-green");
      var ring = P.ring(rep.standing == null ? 0 : rep.standing, { size: 132, stroke: 11, tone: gradeTone(rep.standing) === "red" ? "red" : gradeTone(rep.standing) === "orange" ? "orange" : "green",
        center: rep.standing == null ? "<small class='cap'>No marks yet</small>" : "<b>" + esc(num(rep.standing)) + "<span class='pc'>%</span></b><small class='cap'>average</small>" });
      big.appendChild(ring);
      var tx = el("div", "tx");
      tx.innerHTML = "<h2>" + (rep.standing == null ? "No marks yet" : rep.standing >= 90 ? "Excellent" : rep.standing >= 80 ? "Doing well" : rep.standing >= 70 ? "Passing" : "Needs attention") + "</h2><p>" +
        esc(rep.standing == null ? "Your teachers haven’t marked anything yet." : "Across " + plural(graded.length, "course") + " with marks." + (low && graded.length > 1 ? " Lowest: " + low.title + " at " + num(low.grade.percent) + "%." : "")) + "</p>";
      big.appendChild(tx);
      host.appendChild(big);
      P.rise([big], 0);

      host.appendChild(P.sh("Courses"));
      var g = P.group();
      sortedSections(secs).forEach(function (s) {
        var c = rep.courses.filter(function (x) { return x.courseId === s.courseId; })[0];
        if (!c) return;
        var gr = c.grade, p = gr && gr.percent, tr = c.trend;
        var row = P.row({ dot: true, tone: P.toneOf(s.area || s.title), title: c.title, sub: tr && tr.change ? (tr.change > 0 ? "▲ " : "▼ ") + Math.abs(tr.change) + " pts recently" : tr ? "Steady" : (gr && gr.itemCount ? plural(gr.itemCount, "mark") : "No marks yet"),
          valueHtml: p == null ? "<small>—</small>" : "<span class='ph-gr " + gradeTone(p) + "'>" + esc(gr.letter || "") + "</span><small>" + esc(num(p)) + "%</small>", go: function () { K.open("courses", X.slugOf(s, s.courseId)); } });
        g.appendChild(row);
      });
      host.appendChild(g);

      var back = w.filter(function (x) { return X.stateOf(x, now) === "graded"; }).sort(function (a, b) { return (b.gradedAt || 0) - (a.gradedAt || 0); }).slice(0, 6);
      if (back.length) {
        host.appendChild(P.sh("Recent marks"));
        var rg = P.group();
        back.forEach(function (x) {
          rg.appendChild(P.row({ title: x.title, sub: x.courseTitle + (x.gradedAt ? " · " + relDay(x.gradedAt) : ""), valueHtml: "<b>" + esc(num(x.score)) + "<small style='display:inline;color:var(--ph-label-3)'> / " + esc(num(x.outOf)) + "</small></b>", go: function () { openWork(x, secById); } }));
        });
        host.appendChild(rg);
      }
      host.appendChild(P.note("Each grade is worked out by the server from the marks and the way the course weights them. It changes when a mark does."));
    }, function (e) { P.fail(host, e, function () { K.open("grades"); }); });
  }

  /* =============================================================== Routing */
  function layer(key, depth, tone, label, build, back) {
    return P.present(key, depth, { tone: tone, label: label, back: back }, build);
  }
  var up = function (label, tab) { return { label: label, go: function () { K.open(tab); } }; };
  H.layer = layer; H.up = up; H.openSearch = openSearch;

  P.student = function (tab, arg) {
    init();
    buildHome();
    switch (tab) {
      case "today": P.popAll(); break;
      case "schedule": layer("schedule", 1, "orange", "Schedule", buildSchedule); break;
      case "courses":
        if (arg) layer("course:" + arg, 2, "indigo", "Course", function (L) { buildCourse(L, arg); }, up("Courses", "courses"));
        else layer("courses", 1, "indigo", "Courses", buildCourses);
        break;
      case "assignments":
        layer("assignments", 1, "pink", "Assignments", function (L) { buildAssignments(L, arg); }, null);
        break;
      case "grades": layer("grades", 1, "green", "Grades", buildGrades); break;
      default:
        if (H.more && H.more(tab, arg)) break;
        P.popAll();
    }
  };
  H.rows = {};

  if (typeof window.OPLO_PHONE_RECORD === "function") window.OPLO_PHONE_RECORD(P, H);
};
