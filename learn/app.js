/* ==========================================================================
   Oplo Learn.

   Two halves that answer different questions. The course side — subjects,
   units, practice — asks "do you understand this?" The study side —
   flashcards, Learn, Match, Test — asks "do you know it cold?" Neither one
   substitutes for the other, which is why both are here.

   No backend and no network — but progress is kept. Everything a student
   does is written to one record in this browser (store.js), so a session
   resumes where it was left and a streak survives closing the tab. What that
   cannot do is follow them to another machine, and the account screen says
   so plainly rather than implying an account that does not exist.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.OPLO;
  var ST = window.OPLO_STORE;
  var G  = window.OPLO_GAME;
  var $ = function (s) { return document.querySelector(s); };
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function norm(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  /* ---------------------------------------------------------------- State
     S is the session — where you are, what is in flight, what is on screen.
     What is *true about you* lives in R, the record, and survives the tab.
     The fields below that look like data (m, sets, mistakes, readDone) are
     references into R.d, assigned at sign-in: reading them is free, and
     writing them is followed by R.save(). */
  var R = null;           // the persisted record; null until somebody signs in
  var S = {
    me: null,             // the signed-in student
    view: "my",
    here: null,           // the place you are, with a closure that rebuilds it
    hist: [],             // the places behind you, innermost last
    course: null, unit: null, unitIx: 0,
    setId: null, set: null,
    m: {},                // "courseId:unit" -> {u,p,r,a} as percentages
    sets: {},             // setId -> { level: {}, star: {}, best: null }
    mistakes: [],         // every wrong answer, kept and practisable
    marks: [],            // highlights and notes made while reading
    readIx: 0, readDone: {},
    doneToday: {},        // which planned steps have been finished
    citeStyle: "mla",     // what a copied quotation comes out as
    p: {}                 // the practice run in flight
  };

  function setState(id) {
    return R ? R.set(id)
             : (S.sets[id] || (S.sets[id] = { level: {}, star: {}, best: null, runs: 0, seen: 0 }));
  }
  /* Every write to the record funnels through here, so there is exactly one
     place that knows saving exists and exactly one to check when it stops. */
  function keep() { if (R) R.save(); }
  function setMastered(id) {
    var st = setState(id), n = 0;
    for (var k in st.level) if (st.level[k] >= 3) n++;
    return n;
  }

  /* ----------------------------------------------------------------- Game
     The surface over game.js. It owns three things and nothing else: paying
     out experience, noticing a badge has been earned, and saying so quietly.

     Quietly is the operative word. The rule the reading and Learn screens are
     built on — that nothing competes with the thing the student is thinking
     about — applies here too, so an award appears as a small line that fades,
     never over the question, and never while an answer is still being formed. */
  var Game = (function () {
    var rec = null, pending = 0, timer = null;

    function attach(r) { rec = r; }
    function on() { return !!rec; }

    /* Awards are batched. A run of six quick answers should read as one
       "+48" rather than as six numbers fighting each other on the way out. */
    function show(xp, note) {
      if (!xp) return;
      pending += xp;
      var n = $("#xpPop");
      n.innerHTML = "<b>+" + pending + "</b><span>" + esc(note || "") + "</span>";
      n.classList.add("on");
      clearTimeout(timer);
      timer = setTimeout(function () {
        n.classList.remove("on");
        pending = 0;
      }, 2400);
    }

    function paint() {
      if (!rec) return;
      var g = rec.d.game;
      var r = G.rank(g.xp);
      var s1 = $("#streak");
      if (s1) s1.textContent = String(g.streak);
      var chip = $("#rankChip");
      if (chip) {
        chip.hidden = false;
        chip.innerHTML = "<b>" + esc(r.name) + "</b><i style=\"width:" + r.pct + "%\"></i>";
        chip.title = r.name + " — " + g.xp + " XP" +
          (r.next ? ", " + r.toGo + " to " + r.next.name : ", the top of the ladder");
      }
    }

    /* One answer. Everything the award depends on is passed in rather than
       looked up, so the exchange rate can be read in one place. */
    function answer(o) {
      if (!rec) return 0;
      var a = G.forAnswer(o);
      if (!a.xp) return 0;
      rec.earn(a.xp);
      show(a.xp, a.why);
      paint();
      return a.xp;
    }

    function run(kind, o) {
      if (!rec) return 0;
      var xp = G.forRun(kind, o);
      if (!xp) return 0;
      rec.earn(xp);
      paint();
      return xp;
    }

    /* Badges are checked rather than awarded: the caller says what just
       happened, and this decides whether it crossed a line. Each one fires
       once, ever, and announces itself properly — a thing earned twelve times
       silently is not a thing anybody values. */
    function check(what, o) {
      if (!rec) return;
      o = o || {};
      var g = rec.d.game, got = [];
      function win(k) { if (rec.badge(k)) got.push(k); }

      if (what === "session") {
        win("first");
        if (o.asked >= 8 && !o.hints && o.right / Math.max(1, o.asked) >= 0.8) win("nohint");
        if (o.swept) win("swept");
      }
      if (what === "answer" && o.right) {
        if (o.level === "transfer") win("transfer");
        if (o.gapDays >= 7) win("held");
        if (o.wasFlagged && o.mastery >= 0.88) win("fixed");
      }
      if (what === "explain" && o.ok) win("explain");
      if (what === "match" && o.seconds < 30) win("quick");
      if (what === "hunt" && o.all) win("hunter");
      if (what === "skip") {
        g.skips = (g.skips || 0) + 1;
        if (g.skips >= 10) win("honest");
        rec.save();
      }
      if (g.streak >= 7) win("week");
      if (g.streak >= 30) win("month");

      got.forEach(function (k, i) {
        setTimeout(function () { announce(G.badge(k)); }, 500 + i * 2600);
      });
      return got;
    }

    /* A badge gets a card rather than a toast, because it is the one thing
       in this layer that is genuinely rare and genuinely earned. */
    function announce(b) {
      if (!b) return;
      var n = $("#badgePop");
      n.innerHTML = '<span class="ic">' + svg(I.star) + "</span>" +
        "<span class=\"t\"><em>Badge earned</em><b>" + esc(b.name) + "</b><span>" +
        esc(b.say) + "</span></span>";
      n.classList.add("on");
      setTimeout(function () { n.classList.remove("on"); }, 4200);
    }

    return { attach: attach, on: on, answer: answer, run: run, check: check,
             paint: paint, announce: announce,
             rec: function () { return rec; } };
  })();

  /* ---------------------------------------------------------------- Icons */
  var I = {
    play:  '<path d="M8 5.5 18 12 8 18.5z"/>',
    cards: '<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 4h11a2 2 0 0 1 2 2v10"/>',
    learn: '<path d="M12 3 3 7.5l9 4.5 9-4.5z"/><path d="M6 10v5.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V10"/>',
    match: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    test:  '<path d="M6 3.5h8L18 7v13.5H6z"/><path d="M13.5 3.5V7H18"/><path d="M9 12.5h6M9 16h4"/>',
    doc:   '<path d="M6 3.5h8L18 7v13.5H6z"/><path d="M13.5 3.5V7H18"/><path d="M9 12h6M9 15.5h4"/>',
    chev:  '<path d="M9 5l6 6.5L9 18"/>',
    book:  '<path d="M4 4.5h6.5A2.5 2.5 0 0 1 13 7v12a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6.5A2.5 2.5 0 0 0 11 7v12a2 2 0 0 1 2-2h7z"/>',
    star:  '<path d="M12 3.5l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.9l6.1-.8z"/>',
    tick:  '<path d="M4 12.5 9 17.5 20 6.5"/>',
    read:  '<path d="M4 5.5h6.5A2.5 2.5 0 0 1 13 8v11a2 2 0 0 0-2-2H4z"/><path d="M20 5.5h-6.5A2.5 2.5 0 0 0 11 8v11a2 2 0 0 1 2-2h7z"/>',
    pen:   '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 6.5l3 3"/>',
    copy:  '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 5.5h-11a1 1 0 0 0-1 1v11"/>',
    point: '<path d="M5 4.5 19 11l-6 1.8L11 19z"/>',
    link:  '<path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.6 6.3"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.2-1.2"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7"/><path d="M6.5 6.5 7.6 20a1.3 1.3 0 0 0 1.3 1.2h6.2a1.3 1.3 0 0 0 1.3-1.2L17.5 6.5"/>',
    people:'<path d="M9.5 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z"/><path d="M2.8 20a6.7 6.7 0 0 1 13.4 0"/><path d="M16.2 5.2a3.4 3.4 0 0 1 0 6.6"/><path d="M17.6 14.2A6.7 6.7 0 0 1 21.2 20"/>',
    arrow: '<path d="M4.5 12h14"/><path d="M13 6.5 18.5 12 13 17.5"/>',
    grid:  '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    bulb:  '<path d="M9 17.5h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9h5c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z"/>',
    alert: '<path d="M12 8.5v5"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/>'
  };
  function svg(d, stroke) {
    return '<svg viewBox="0 0 24 24" fill="' + (stroke ? "none" : "currentColor") + '" ' +
           'stroke="' + (stroke ? "currentColor" : "none") + '" stroke-width="1.7" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }

  /* --------------------------------------------------------------- Router
     History is a stack of places, not of view names. Each entry carries a
     closure that rebuilds that exact screen — this course, this unit, this
     set — so Back retraces the path you actually took rather than re-running
     whichever course happens to be in state now. It also carries a label, so
     the button names where you are going instead of saying "Back". */

  function trim(t, n) {
    t = String(t);
    return t.length > (n || 20) ? t.slice(0, (n || 20) - 1).trim() + "\u2026" : t;
  }

  /* ------------------------------------------------ The browser's history
     The stack above was the app's alone. The browser never heard about any
     of it, so to the browser the whole of Learn was one page — and its Back
     button skipped every screen inside it and left the app entirely,
     landing wherever the student had been before they opened it.

     So every place is also a browser history entry. TRAIL mirrors those
     entries one for one, each holding the place and a copy of the path that
     led to it, and a popstate replays the entry the browser moved to. The
     URL is left alone: the places are closures, not addresses, and a URL
     that looked shareable but opened the home screen would be worse than
     one that makes no promise. After a reload the old entries still exist
     in the browser but not in memory, so they land on Home rather than on
     nothing. */
  var TRAIL = [], POS = -1, RESTORING = false;

  function mark(push) {
    if (RESTORING) return;
    var entry = { here: S.here, hist: S.hist.slice() };
    if (push && POS >= 0) {
      TRAIL = TRAIL.slice(0, POS + 1);        // a new step drops the old forward path
      TRAIL.push(entry);
      POS = TRAIL.length - 1;
      try { history.pushState({ lx: POS }, ""); } catch (e) { /* sandboxed frame */ }
    } else {
      // The very first place replaces the entry the page already has, so
      // opening Learn does not cost an extra press of Back to leave it.
      if (POS < 0) { TRAIL = [entry]; POS = 0; } else TRAIL[POS] = entry;
      try { history.replaceState({ lx: POS }, ""); } catch (e) { /* sandboxed frame */ }
    }
  }

  function enter(key, label, restore, replace) {
    if (S.here && S.here.key === key) { S.here.restore = restore; return; }
    // Replaying a place must not record it again as a new one.
    if (RESTORING) {
      S.here = { key: key, label: label, restore: restore };
      if (TRAIL[POS]) TRAIL[POS].here = S.here;
      return;
    }
    // A finished run is not a place to go back into, so the screen that
    // reports it replaces the run rather than stacking on top of it.
    if (!replace && S.here) {
      S.hist.push(S.here);
      if (S.hist.length > 40) S.hist.shift();
    }
    S.here = { key: key, label: label, restore: restore };
    mark(!replace);
  }

  /* A top-level section starts a fresh in-app path — the Back button in the
     bar hides — but it is still a step in the browser's history, so the
     browser's Back returns to wherever the student was before they clicked
     Home. Clicking the section they are already on does not add a step. */
  function root(key, label, restore) {
    var same = S.here && S.here.key === key && !S.hist.length;
    S.hist = [];
    S.here = { key: key, label: label, restore: restore };
    mark(!same);
  }

  function show(view) {
    S.view = view;
    [].forEach.call(document.querySelectorAll(".lx-view"), function (v) {
      v.classList.toggle("on", v.id === "v-" + view);
    });
    var prev = S.hist[S.hist.length - 1];
    $("#back").hidden = !prev;
    if (prev) $("#backLabel").textContent = prev.label;
    // The subject bar belongs to browsing. The home screen is a personal
    // command centre, and a catalogue across the top of it is just noise.
    $("#subbar").hidden = !(view === "explore" || view === "subject");
    $("#wrap").classList.toggle("wide", view === "match" || view === "read");
    if (view !== "read") { railOff(); if (S.hideAnn) S.hideAnn(); }
    [].forEach.call(document.querySelectorAll("#topNav button"), function (b) {
      b.setAttribute("aria-current", String(b.dataset.view === view));
    });
    window.scrollTo(0, 0);
    // Tutor is declared later in this scope; hoisting makes it undefined
    // until the panel is built, which is exactly the case to skip.
    if (typeof Tutor !== "undefined" && Tutor && Tutor.where) Tutor.where();
  }

  /* The Back button in the bar goes through the browser whenever there is a
     browser entry behind this one, so the two backs can never disagree about
     where the student is. */
  function goBack() {
    if (S.hist.length && POS > 0 && TRAIL[POS - 1]) { history.back(); return; }
    var prev = S.hist.pop();
    if (!prev) { home(); return; }
    S.here = prev;
    prev.restore();
    mark(false);
  }

  function home() {
    root("my", "Home", home);
    drawMy();
    show("my");
  }
  function explore() {
    root("explore", "Explore", explore);
    drawExplore();
    show("explore");
  }

  function foot(msg, label, on, handler) {
    var f = $("#foot"), b = $("#footBtn");
    f.hidden = false;
    $("#footMsg").innerHTML = msg || "";
    b.textContent = label;
    b.disabled = !on;
    b.onclick = handler;
  }
  function noFoot() { $("#foot").hidden = true; $("#footBtn").onclick = null; }
  function progress(pct) {
    var p = $("#barProg");
    p.hidden = pct == null;
    if (pct != null) p.firstElementChild.style.width = pct + "%";
  }

  var toastT;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("on"); }, 2200);
  }

  /* ------------------------------------------------------------ Catalogue */
  function allCourses() {
    return D.SUBJECTS.reduce(function (a, s) { return a.concat(s.courses); }, []);
  }
  function enrolled() {
    var mine = (S.me && S.me.assigned) || [];
    return allCourses().filter(function (c) { return mine.indexOf(c.id) > -1; });
  }
  function unitsOf(c) {
    if (c.units) {
      return c.units.map(function (u, i) {
        return { n: i + 1, t: u.t, desc: u.desc, play: !!u.play, set: u.set };
      });
    }
    var out = [], n = 0;
    (c.parts || []).forEach(function (part) {
      part.units.forEach(function (t) {
        n++;
        out.push({ n: n, t: t, part: part.name, set: (c.sets || {})[n],
                   read: !!readerFor(c.id, n) });
      });
    });
    return out;
  }
  /* Mastery is four different questions, and a single percentage answers
     none of them well. Understanding and Practice come from working problems;
     Recall from Learn and flashcards; Application from a graded test. A unit
     is only scored on the dimensions it can actually offer. */
  var DIMS = [["u", "Understanding"], ["p", "Practice"], ["r", "Recall"], ["a", "Application"]];

  function unitKey(c, n) { return c.id + ":" + n; }
  function dims(c, n) {
    if (R) return R.unit(c.id, n);
    var k = unitKey(c, n);
    if (!S.m[k]) S.m[k] = { u: 0, p: 0, r: 0, a: 0 };
    return S.m[k];
  }
  function offers(u) {
    return { u: !!(u.play || u.read), p: !!(u.play || u.read), r: !!u.set, a: !!u.set };
  }
  function raise(c, n, dim, pct) {
    var d = dims(c, n);
    if (pct > d[dim]) { d[dim] = Math.round(pct); keep(); }
  }
  function mastery(c, n) {          // 0-100 across whatever this unit offers
    var u = unitsOf(c).filter(function (x) { return x.n === n; })[0];
    if (!u) return 0;
    var av = offers(u), d = dims(c, n), sum = 0, count = 0;
    DIMS.forEach(function (x) { if (av[x[0]]) { sum += d[x[0]]; count++; } });
    return count ? Math.round(sum / count) : 0;
  }
  function band(pct) {              // for the mastery strip and the map
    return pct >= 85 ? "master" : pct >= 50 ? "prof" : pct > 0 ? "fam" : "";
  }
  function coursePct(c) {
    var us = unitsOf(c).filter(function (u) { return u.play || u.set; });
    if (!us.length) return 0;
    return Math.round(us.reduce(function (a, u) { return a + mastery(c, u.n); }, 0) / us.length);
  }
  function subjectPct(name) {
    var cs = enrolled().filter(function (c) { return c.subject === name; });
    if (!cs.length) return null;
    return Math.round(cs.reduce(function (a, c) { return a + coursePct(c); }, 0) / cs.length);
  }

  /* -------------------------------------------------------- Mistake book
     Every wrong answer is kept, deduplicated, and counted. Getting the same
     thing wrong three times is the most useful signal the platform has. */
  function slip(kind, key, title, note, extra) {
    if (R) { R.slip(kind, key, title, note, extra); return; }
    var hit = S.mistakes.filter(function (m) { return m.key === key; })[0];
    if (hit) { hit.n++; hit.at = Date.now(); return; }
    S.mistakes.push({ kind: kind, key: key, title: title, note: note, n: 1, at: Date.now() });
  }

  /* --------------------------------------------------------- Next step
     Walks the prerequisite graph rather than the list order: a unit whose
     ground has not been laid is not the next thing to do. */
  function nextStep() {
    var courses = enrolled(), best = null;
    courses.forEach(function (c) {
      var pre = (D.PRE || {})[c.id] || {};
      unitsOf(c).forEach(function (u) {
        if (!(u.play || u.set)) return;
        var m = mastery(c, u.n);
        if (m >= 85 || best) return;
        var weak = (pre[u.n] || []).map(function (k) {
          return { n: k, m: mastery(c, k) };
        }).filter(function (x) { return x.m < 50; })[0];
        best = { course: c, unit: u, pct: m, weak: weak };
      });
    });
    return best;
  }

  /* Four dials rather than one bar. A dimension a unit cannot offer is not
     drawn, because averaging in a zero nobody can earn is just a lie. */
  function dimRow(c, units) {
    var live = units.filter(function (u) { return u.play || u.set; });
    if (!live.length) return "";
    var out = '<div class="lx-dims">';
    DIMS.forEach(function (dim) {
      var able = live.filter(function (u) { return offers(u)[dim[0]]; });
      var pct = able.length
        ? Math.round(able.reduce(function (a, u) { return a + dims(c, u.n)[dim[0]]; }, 0) / able.length)
        : null;
      var circ = 2 * Math.PI * 26;
      out += '<div class="lx-dim"><svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<circle cx="32" cy="32" r="26" fill="none" stroke="#e6e6e8" stroke-width="6"/>' +
        (pct == null ? "" :
          '<circle cx="32" cy="32" r="26" fill="none" stroke="' + c.hue + '" stroke-width="6" ' +
          'stroke-linecap="round" stroke-dasharray="' + circ.toFixed(0) + '" stroke-dashoffset="' +
          (circ - circ * pct / 100).toFixed(1) + '" transform="rotate(-90 32 32)"/>') +
        '<text x="32" y="37" text-anchor="middle" font-size="15" font-weight="600" fill="#1d1d1f">' +
        (pct == null ? "—" : pct) + "</text></svg><b>" + dim[1] + "</b><span>" +
        (pct == null ? "not offered" : able.length + (able.length === 1 ? " unit" : " units")) +
        "</span></div>";
    });
    return out + "</div>";
  }

  /* The prerequisite graph, drawn. Columns are depth, so an arrow always
     points forward and the weak link is visible without reading anything. */
  function mapFor(c, units) {
    var pre = (D.PRE || {})[c.id];
    if (!pre || !Object.keys(pre).length) return "";
    var depth = {}, order = Object.keys(pre).map(Number).sort(function (a, b) { return a - b; });
    order.forEach(function (k) {
      depth[k] = (pre[k] || []).reduce(function (a, p) {
        return Math.max(a, (depth[p] == null ? 0 : depth[p]) + 1);
      }, 0);
    });
    var cols = {}, maxD = 0;
    order.forEach(function (k) {
      (cols[depth[k]] = cols[depth[k]] || []).push(k);
      maxD = Math.max(maxD, depth[k]);
    });
    var colW = 132, rowH = 62, pad = 8;
    var rows = Math.max.apply(null, Object.keys(cols).map(function (d) { return cols[d].length; }));
    var w = (maxD + 1) * colW + pad, h = rows * rowH + pad;
    var at = {};
    Object.keys(cols).forEach(function (d) {
      cols[d].forEach(function (k, i) {
        at[k] = { x: +d * colW + pad, y: i * rowH + pad,
                  cy: i * rowH + pad + 20, w: colW - 26 };
      });
    });
    var edges = "", nodes = "";
    var byN = {};
    units.forEach(function (u) { byN[u.n] = u; });
    order.forEach(function (k) {
      (pre[k] || []).forEach(function (p) {
        if (!at[p] || !at[k]) return;
        var x1 = at[p].x + at[p].w, y1 = at[p].cy, x2 = at[k].x, y2 = at[k].cy;
        edges += '<path d="M' + x1 + " " + y1 + " C" + (x1 + 14) + " " + y1 + " " +
          (x2 - 14) + " " + y2 + " " + x2 + " " + y2 +
          '" fill="none" stroke="#d2d2d7" stroke-width="1.4"/>';
      });
    });
    var TONE = { master: c.hue, prof: "#61a8ee", fam: "#b8d8f7", "": "#ececee" };
    order.forEach(function (k) {
      var u = byN[k], a = at[k], m = mastery(c, k), b = band(m);
      var live = u && (u.play || u.set);
      nodes += '<g class="node" data-n="' + k + '" role="button" tabindex="0">' +
        '<rect x="' + a.x + '" y="' + a.y + '" width="' + a.w + '" height="40" rx="9" ' +
        'fill="#fff" stroke="#e6e6e8" stroke-width="1.2"/>' +
        '<rect x="' + a.x + '" y="' + a.y + '" width="4" height="40" rx="2" fill="' +
        (live ? TONE[b] : "#ececee") + '"/>' +
        '<text x="' + (a.x + 13) + '" y="' + (a.y + 17) + '" font-size="11" font-weight="600" ' +
        'fill="#1d1d1f">' + esc(String(u ? u.t : k).slice(0, 15)) +
        (u && u.t.length > 15 ? "…" : "") + "</text>" +
        '<text x="' + (a.x + 13) + '" y="' + (a.y + 31) + '" font-size="10" fill="#86868b">' +
        (live ? m + "%" : "not written") + "</text></g>";
    });
    return '<div class="lx-map"><svg viewBox="0 0 ' + w + " " + h + '" width="' + w +
           '" height="' + h + '">' + edges + nodes + "</svg></div>";
  }

  /* ------------------------------------------------------------ My courses */
  function courseCard(c) {
    var b = el("button", "lx-card");
    b.type = "button";
    var ic = el("span", "ic");
    ic.style.background = c.hue + "1a";
    ic.style.color = c.hue;
    ic.innerHTML = svg(c.glyph, true);
    b.appendChild(ic);
    b.appendChild(el("h3", null, esc(c.t)));
    b.appendChild(el("p", null, esc(c.d)));
    var pct = coursePct(c);
    var f = el("div", "foot");
    f.innerHTML = '<span class="lx-tag">' + esc(c.subject) + "</span>" +
      (c.stub ? '<span class="lx-tag soon">Not written yet</span>'
              : '<span class="lx-tag live">' + unitsOf(c).length + " units</span>") +
      (pct ? '<span style="margin-left:auto">' + pct + "%</span>" : "");
    b.appendChild(f);
    b.addEventListener("click", function () {
      if (c.stub) { toast("“" + c.t + "” has no syllabus behind it yet."); return; }
      openCourse(c);
    });
    return b;
  }

  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }

  function drawMy() {
    var v = $("#v-my");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-hello", greeting() + ", " + esc(S.me.first) + "."));
    v.appendChild(el("h1", "lx-h1", "Here is where you are."));
    v.appendChild(standing());

    /* ---- Your next step ------------------------------------------- */
    var step = nextStep();
    var next = el("div", "lx-next");
    if (!step) {
      next.innerHTML = '<p class="k">Nothing outstanding</p>' +
        "<h2>You are on top of everything assigned.</h2>" +
        '<p class="why">Every unit with material behind it is at mastery. Review keeps it there — ' +
        "the study sets do not expire.</p>";
    } else {
      var target = step.weak
        ? unitsOf(step.course).filter(function (x) { return x.n === step.weak.n; })[0]
        : step.unit;
      next.innerHTML = '<p class="k">Your next step</p>' +
        "<h2>" + esc(step.course.t) + " · " + esc(target.t) + "</h2>" +
        '<p class="why">' + (step.pct
          ? "You are at " + step.pct + "% on this one. "
          : "You have not started this one. ") +
        esc(target.desc || "Work through it, then drill the terms until they stick.") + "</p>";
      if (step.weak) {
        next.appendChild(el("div", "warn",
          "<b>First, factoring in the ground under it.</b> Unit " + step.weak.n + " is at " +
          step.weak.m + "%, and " + esc(step.unit.t) + " leans on it. Strengthening that first is " +
          "faster than pushing on and coming back."));
      }
      var go = el("button", "lx-btn lg", step.pct ? "Continue" : "Start");
      go.type = "button";
      go.addEventListener("click", function () { openUnit(step.course, target.n); });
      next.appendChild(go);
    }
    v.appendChild(next);

    /* ---- Today's session ------------------------------------------ */
    var plan = session(step);
    if (plan.length) {
      v.appendChild(el("h2", "lx-h2", "Today"));
      v.appendChild(el("p", "lx-lede",
        "About " + plan.reduce(function (a, x) { return a + x.mins; }, 0) +
        " minutes, in the order that gets the most out of them."));
      var pl = el("div", "lx-plan");
      plan.forEach(function (st) {
        var b = el("button", "lx-step" + (st.done ? " done" : ""));
        b.type = "button";
        b.innerHTML = '<span class="ic">' + svg(st.icon, true) + "</span>" +
          '<span class="txt"><b>' + esc(st.t) + "</b><span>" + esc(st.d) + "</span></span>" +
          '<span class="mins">' + st.mins + " min</span>";
        b.addEventListener("click", st.go);
        pl.appendChild(b);
      });
      v.appendChild(pl);
    }

    /* ---- Progress by subject -------------------------------------- */
    var subs = [];
    D.SUBJECTS.forEach(function (sub) {
      var pct = subjectPct(sub.n);
      if (pct != null) subs.push([sub.n, pct]);
    });
    if (subs.length) {
      v.appendChild(el("h2", "lx-h2", "Your progress"));
      var bars = el("div", "lx-bars");
      subs.forEach(function (r) {
        var row = el("div", "lx-barrow");
        row.innerHTML = "<b>" + esc(r[0]) + '</b><span class="track"><i style="width:' +
          r[1] + '%"></i></span><span class="pc">' + r[1] + "%</span>";
        bars.appendChild(row);
      });
      v.appendChild(bars);
    }

    /* ---- Courses --------------------------------------------------- */
    v.appendChild(el("h2", "lx-h2", "Assigned to you"));
    var g = el("div", "lx-grid");
    enrolled().forEach(function (x) { g.appendChild(courseCard(x)); });
    v.appendChild(g);

    /* ---- Mistakes -------------------------------------------------- */
    v.appendChild(el("h2", "lx-h2", "What you keep getting wrong"));
    if (!S.mistakes.length) {
      v.appendChild(el("div", "lx-empty",
        "Nothing yet. Every question you miss is kept here, so the things that trip you up " +
        "can be practised on their own rather than found again by accident."));
    } else {
      var mm = el("div", "lx-mistakes");
      S.mistakes.slice(0, 4).forEach(function (m) {
        var row = el("div", "lx-mistake");
        row.innerHTML = '<span class="txt"><b>' + esc(m.title) + "</b><p>" + esc(m.note) + "</p></span>" +
          '<span class="n">' + m.n + (m.n === 1 ? " miss" : " misses") + "</span>";
        mm.appendChild(row);
      });
      v.appendChild(mm);
      var mb = el("button", "lx-btn", "Practise my mistakes");
      mb.type = "button";
      mb.style.marginTop = "14px";
      mb.addEventListener("click", function () { openMistakes(); });
      v.appendChild(mb);
    }

    /* ---- Tutor ------------------------------------------------------ */
    var t = el("div", "lx-tutor");
    t.innerHTML = '<div class="lx-tutor-head">' + svg(I.learn, true) +
      "<b>Tutor</b></div>" +
      "<p>The plan above is worked out from what you have actually answered — which units lean on " +
      "which, and what you have missed more than once. A tutor that can talk you through a wrong " +
      "answer, rather than just count it, is the next thing being built.</p>" +
      '<div class="lx-modes-row"><span>Tutor</span><span>Socratic</span><span>Hints</span>' +
      "<span>Practice</span><span>Exam</span><span>Review</span><span>Challenge</span></div>" +
      '<p style="margin-top:14px;font-size:13px;color:var(--ink-3)">In development. Nothing here ' +
      "answers you yet, and the page will not pretend otherwise.</p>";
    v.appendChild(t);

    v.appendChild(el("p", "lx-note",
      "<b>In progress.</b> Five study sets are written and one unit is playable end to end. The rest " +
      "carry a real syllabus with the lessons still to be made. Your progress is kept in this " +
      "browser and is not sent anywhere \u2014 which also means it does not follow you to another " +
      'computer. <a href="../edu/">About Oplo Edu &rsaquo;</a>'));
  }

  /* ------------------------------------------------------- Your standing
     Rank, the week, and today against the goal. This is the only screen the
     game layer gets a large surface on, and it is the right one: the home
     screen is where a student decides what to do, and "you are eleven points
     short of the day" is a decision-shaped fact. Inside a session it would
     just be noise beside a question. */
  function standing() {
    var wrap = el("div", "lx-standing");
    if (!R) return wrap;
    var g = R.d.game, r = G.rank(g.xp);

    var left = el("div", "lx-stand-card");
    left.innerHTML = '<p class="k">Your standing</p>' +
      '<div class="lx-stand-rank"><b>' + esc(r.name) + "</b><em>" +
      g.xp.toLocaleString() + " XP</em></div>" +
      '<div class="lx-stand-track"><i style="width:' + r.pct + '%"></i></div>' +
      "<p>" + (r.next
        ? esc(r.say) + " <b>" + r.toGo + "</b> more reaches " + esc(r.next.name) + "."
        : esc(r.say) + " There is no rung above this one.") + "</p>";

    /* Badges, including the ones not yet earned. Showing the locked ones is
       deliberate: a badge nobody knows exists cannot be aimed at, and every
       one of these names something worth aiming at. */
    var got = Object.keys(g.badges).length;
    var bl = el("div", "lx-badges");
    G.BADGES.forEach(function (b) {
      var has = !!g.badges[b.k];
      var t = el("span", "lx-bdg" + (has ? "" : " off"));
      t.innerHTML = svg(has ? I.star : I.tick) + esc(b.name);
      t.title = has ? b.say + " Earned." : b.say;
      bl.appendChild(t);
    });
    left.appendChild(el("p", "k", (got ? got : "No") + " of " + G.BADGES.length +
      " badges" + (got ? " earned" : " yet")));
    left.appendChild(bl);
    wrap.appendChild(left);

    var right = el("div", "lx-stand-card");
    right.innerHTML = '<p class="k">This week</p>';
    var wk = G.week(R, ST);
    var top = Math.max(g.goal, wk.reduce(function (a, d) { return Math.max(a, d.xp); }, 0));
    var row = el("div", "lx-week");
    wk.forEach(function (d, i) {
      var cell = el("div", "lx-week-day" + (d.xp ? "" : " none") + (i === 6 ? " today" : ""));
      cell.title = d.day + " — " + d.xp + " XP";
      var bar = el("div", "lx-week-bar");
      var fill = el("i");
      fill.style.height = Math.max(d.xp ? 6 : 2, Math.round(d.xp / top * 100)) + "%";
      bar.appendChild(fill);
      cell.appendChild(bar);
      cell.appendChild(el("span", null, esc(d.label)));
      row.appendChild(cell);
    });
    right.appendChild(row);

    var goal = el("div", "lx-goal");
    goal.innerHTML = "<b>" + g.today + " / " + g.goal + "</b><span>" +
      (g.today >= g.goal ? "Today\u2019s goal met"
                         : (g.goal - g.today) + " XP to today\u2019s goal") + "</span>";
    right.appendChild(goal);
    right.appendChild(el("p", null,
      g.streak
        ? "<b>" + g.streak + (g.streak === 1 ? " day" : " days") + " running.</b> " +
          (g.best > g.streak ? "Your longest is " + g.best + "."
                             : "That is your longest run so far.")
        : "No streak running. A day counts when you learn something on it, not when you open the app."));
    wrap.appendChild(right);
    return wrap;
  }

  /* A session is assembled, not listed: review what is broken, learn the new
     thing, practise it, then prove it without help. */
  function session(step) {
    var out = [];
    if (S.mistakes.length) {
      out.push({ t: "Review what you missed", d: S.mistakes.length + " to go back over",
                 mins: 5, icon: I.learn, go: function () { openMistakes(); } });
    }
    if (!step) return out;
    var c = step.course, u = step.weak
      ? unitsOf(c).filter(function (x) { return x.n === step.weak.n; })[0] : step.unit;
    var d = dims(c, u.n);
    if (u.play) {
      out.push({ t: "Work through " + u.t, d: "Practice problems, with the answer explained",
                 mins: 10, icon: I.play, done: d.p >= 85,
                 go: function () { openUnit(c, u.n); } });
    }
    if (u.set) {
      out.push({ t: "Learn the terms", d: D.SETS[u.set].cards.length + " terms, drilled three ways",
                 mins: 10, icon: I.cards, done: d.r >= 85,
                 go: function () { openSet(u.set); } });
      out.push({ t: "Prove it", d: "A graded test, no hints", mins: 5, icon: I.test,
                 done: d.a >= 85, go: function () { openSet(u.set); } });
    }
    return out;
  }

  /* ------------------------------------------------------- Mistake book */
  function openMistakes(silent) {
    if (!silent) enter("mistakes", "Mistake book", function () { openMistakes(true); });
    var v = $("#v-mistakes");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", "Mistake book"));
    v.appendChild(el("h1", "lx-h1", "What you keep getting wrong."));
    v.appendChild(el("p", "lx-lede",
      "Every question you have missed, kept and counted. Getting the same thing wrong three times " +
      "is the most useful thing this page knows about you."));

    if (!S.mistakes.length) {
      v.appendChild(el("div", "lx-empty", "Nothing in here yet."));
    } else {
      var mm = el("div", "lx-mistakes");
      S.mistakes.slice().sort(function (a, b) { return b.n - a.n || b.at - a.at; })
        .forEach(function (m) {
          var row = el("div", "lx-mistake");
          row.innerHTML = '<span class="txt"><b>' + esc(m.title) + "</b><p>" + esc(m.note) +
            "</p></span>" + '<span class="n">' + m.n + (m.n === 1 ? " miss" : " misses") + "</span>";
          mm.appendChild(row);
        });
      v.appendChild(mm);

      var terms = S.mistakes.filter(function (m) { return m.kind === "term"; });
      var row2 = el("div");
      row2.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:20px";
      if (terms.length >= 2) {
        var b = el("button", "lx-btn lg", "Practise these " + terms.length + " terms");
        b.type = "button";
        b.addEventListener("click", function () { drillMistakes(terms); });
        row2.appendChild(b);
      }
      var clr = el("button", "lx-btn lg quiet", "Clear the book");
      clr.type = "button";
      clr.addEventListener("click", function () {
        if (R) { R.d.mistakes.length = 0; R.save(); } else S.mistakes = [];
        S.mistakes = R ? R.d.mistakes : [];
        toast("Mistake book cleared."); openMistakes();
      });
      row2.appendChild(clr);
      v.appendChild(row2);
      if (terms.length < 2) {
        v.appendChild(el("p", "lx-lede",
          "Practice problems are reviewed inside their own unit. Two or more missed terms unlock a " +
          "targeted drill here."));
      }
    }
    noFoot(); progress(null);
    show("mistakes");
  }

  /* A Learn run built only from what was missed. */
  function drillMistakes(terms) {
    var cards = terms.map(function (m) { return m.card; }).filter(Boolean);
    if (cards.length < 2) { toast("Not enough missed terms to drill yet."); return; }
    S.setId = "__mistakes";
    S.set = { t: "Your mistakes", cards: cards };
    D.SETS.__mistakes = S.set;
    startLearn();
  }

  /* --------------------------------------------------------------- Explore */
  function drawExplore() {
    var v = $("#v-explore");
    v.innerHTML = "";
    v.appendChild(el("h1", "lx-h1", "Explore"));
    v.appendChild(el("p", "lx-lede",
      "Every course Oplo has written, by subject. All curriculum is our own."));
    D.SUBJECTS.forEach(function (s) {
      var sh = el("section", "lx-shelf");
      var head = el("div", "lx-shelf-head");
      head.innerHTML = "<h2>" + esc(s.n) + "</h2><p>" + esc(s.d) + "</p>";
      sh.appendChild(head);
      var g = el("div", "lx-grid");
      s.courses.forEach(function (c) { g.appendChild(courseCard(c)); });
      sh.appendChild(g);
      v.appendChild(sh);
    });
  }

  function drawSubjectNav() {
    var n = $("#subjectNav");
    n.innerHTML = "";
    var all = el("button", null, "All");
    all.type = "button";
    all.addEventListener("click", explore);
    n.appendChild(all);
    D.SUBJECTS.forEach(function (s) {
      var b = el("button", null, esc(s.n));
      b.type = "button";
      b.addEventListener("click", function () { openSubject(s); });
      n.appendChild(b);
    });
  }
  function markSubjectNav(name) {
    [].forEach.call($("#subjectNav").children, function (b) {
      b.setAttribute("aria-current", String(b.textContent === (name || "All")));
    });
  }

  function openSubject(s, silent) {
    if (!s) { explore(); return; }
    if (!silent) enter("subject:" + s.n, s.n, function () { openSubject(s, true); });
    S.subject = s;
    var v = $("#v-subject");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", "Subject"));
    v.appendChild(el("h1", "lx-h1", esc(s.n)));
    v.appendChild(el("p", "lx-lede", esc(s.d)));
    var g = el("div", "lx-grid");
    g.style.marginTop = "30px";
    s.courses.forEach(function (c) { g.appendChild(courseCard(c)); });
    v.appendChild(g);
    markSubjectNav(s.n);
    show("subject");
  }

  /* ---------------------------------------------------------------- Course */
  function openCourse(c, silent) {
    if (!c) return;
    if (!silent) enter("course:" + c.id, trim(c.t), function () { openCourse(c, true); });
    S.course = c;
    var v = $("#v-course");
    v.innerHTML = "";
    var units = unitsOf(c);

    var hero = el("header", "lx-hero");
    var row = el("div", "row");
    var ic = el("span", "ic");
    ic.style.background = c.hue + "1a"; ic.style.color = c.hue;
    ic.innerHTML = svg(c.glyph, true);
    row.appendChild(ic);
    var htxt = el("div");
    htxt.innerHTML = '<p class="lx-eyebrow">' + esc(c.subject) + "</p>" +
                     '<h1 class="lx-h1">' + esc(c.t) + "</h1>";
    row.appendChild(htxt);
    hero.appendChild(row);
    hero.appendChild(el("p", "lx-lede", esc(c.lede || c.d)));
    var meta = el("div", "meta");
    meta.innerHTML = '<span class="lx-tag">' + units.length + " units</span>" +
      '<span class="lx-tag">' + esc(c.level) + "</span>" +
      (c.tag ? '<span class="lx-tag">' + esc(c.tag) + "</span>" : "") +
      '<span class="lx-tag live">' +
      units.filter(function (u) { return u.set; }).length + " study sets</span>";
    hero.appendChild(meta);
    v.appendChild(hero);

    var two = el("div", "lx-two");
    var main = el("div");

    var pct = coursePct(c);
    var mast = el("div", "lx-panel");
    mast.style.marginBottom = "22px";
    var bars = units.map(function (u) {
      return '<i class="' + band(mastery(c, u.n)) + '"></i>';
    }).join("");
    mast.innerHTML = "<h3>Course mastery — " + pct + "%</h3>" +
      '<div class="lx-mastery">' + bars + "</div>" +
      '<div class="lx-legend"><span><i></i>Not started</span><span><i class="fam"></i>Familiar</span>' +
      '<span><i class="prof"></i>Proficient</span><span><i class="master"></i>Mastered</span></div>' +
      dimRow(c, units);
    main.appendChild(mast);

    var map = mapFor(c, units);
    if (map) {
      var mp = el("div", "lx-panel");
      mp.style.marginBottom = "22px";
      mp.innerHTML = "<h3>Knowledge map</h3>" +
        '<p style="margin-bottom:4px">What each unit rests on. A unit is only worth opening once ' +
        "the ones feeding into it hold up.</p>" + map;
      mp.querySelectorAll(".node").forEach(function (g) {
        g.addEventListener("click", function () { openUnit(c, +g.dataset.n); });
      });
      main.appendChild(mp);
    }

    var list = el("div", "lx-units");
    var part = null;
    units.forEach(function (u) {
      if (u.part && u.part !== part) {
        part = u.part;
        list.appendChild(el("p", "lx-part", esc(part)));
      }
      var b = el("button", "lx-unit" + (mastery(c, u.n) >= 85 ? " done" : ""));
      b.type = "button";
      var bits = [];
      if (u.play) bits.push("Practice");
      if (u.set) bits.push(D.SETS[u.set].cards.length + " terms");
      if (!bits.length) bits.push("Syllabus only");
      b.innerHTML = '<span class="n">' + u.n + "</span>" +
        '<span class="txt"><b>' + esc(u.t) + "</b><span>" + bits.join(" · ") + "</span></span>" +
        '<span class="go">' + svg(I.chev, true) + "</span>";
      b.addEventListener("click", function () { openUnit(c, u.n); });
      list.appendChild(b);
    });
    main.appendChild(list);
    two.appendChild(main);

    var side = el("aside", "lx-side");
    if (c.objectives) {
      var o = el("div", "lx-panel");
      o.innerHTML = "<h3>What you will be able to do</h3><ul>" +
        c.objectives.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
      side.appendChild(o);
    }
    if (c.grading) {
      var g = el("div", "lx-panel");
      g.innerHTML = "<h3>How it is graded</h3><ul>" +
        c.grading.map(function (r) {
          return "<li><b>" + esc(r[0]) + "</b><span>" + r[1] + "%</span></li>";
        }).join("") + "</ul>";
      side.appendChild(g);
    }
    if (c.textbook) {
      var t = el("div", "lx-panel");
      t.innerHTML = "<h3>Text</h3><p>" + esc(c.textbook) + "</p>";
      side.appendChild(t);
    }
    two.appendChild(side);
    v.appendChild(two);

    markSubjectNav(c.subject);
    noFoot(); progress(null);
    show("course");
  }

  /* ------------------------------------------------------------------ Unit */
  function openUnit(c, n, silent) {
    var u = unitsOf(c).filter(function (x) { return x.n === n; })[0];
    if (!u) return;
    if (!silent) enter("unit:" + c.id + ":" + n, trim(u.t), function () { openUnit(c, n, true); });
    S.course = c; S.unitIx = n; S.unit = u;

    var v = $("#v-unit");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", esc(c.t) + " · Unit " + n));
    v.appendChild(el("h1", "lx-h1", esc(u.t)));
    if (u.desc) v.appendChild(el("p", "lx-lede", esc(u.desc)));

    var any = false;

    if (u.play) {
      any = true;
      var b1 = el("div", "lx-block");
      b1.appendChild(el("h2", null, "Practice"));
      var pb = el("button", "lx-item");
      pb.type = "button";
      pb.innerHTML = '<span class="ic">' + svg(I.play) + "</span>" +
        '<span class="txt"><b>' + esc(u.t) + "</b><span>" + D.PROBLEMS.length +
        " problems · about 5 minutes</span></span>" +
        '<span class="ic">' + svg(I.chev, true) + "</span>";
      pb.addEventListener("click", function () { startPractice(); });
      b1.appendChild(pb);
      v.appendChild(b1);
    }

    var reader = readerFor(c.id, n);
    if (reader) {
      any = true;
      var b0 = el("div", "lx-block");
      b0.appendChild(el("h2", null, "Sections"));
      reader.sections.forEach(function (sec, k) {
        var rb = el("button", "lx-item");
        rb.type = "button";
        rb.innerHTML = '<span class="ic">' + svg(S.readDone[sec.n] ? I.tick : I.read, true) + "</span>" +
          '<span class="txt"><b>' + esc(sec.n) + "  " + esc(sec.t) + "</b><span>" +
          esc(sec.kicker) + " \u00b7 " + sec.mins + " min" + (sec.video ? " \u00b7 video" : "") +
          "</span></span>" + '<span class="ic">' + svg(I.chev, true) + "</span>";
        rb.addEventListener("click", function () { openRead(k, false, reader.key); });
        b0.appendChild(rb);
      });
      v.appendChild(b0);
    }

    if (u.set) {
      any = true;
      var set = D.SETS[u.set];
      var b2 = el("div", "lx-block");
      b2.appendChild(el("h2", null, "Study set"));
      var sb = el("button", "lx-item");
      sb.type = "button";
      var done = setMastered(u.set);
      sb.innerHTML = '<span class="ic">' + svg(I.cards, true) + "</span>" +
        '<span class="txt"><b>' + esc(set.t) + "</b><span>" + set.cards.length + " terms" +
        (done ? " · " + done + " mastered" : " · flashcards, Learn, Match and Test") + "</span></span>" +
        '<span class="ic">' + svg(I.chev, true) + "</span>";
      sb.addEventListener("click", function () { openSet(u.set); });
      b2.appendChild(sb);
      v.appendChild(b2);
    }

    if (!any) {
      var p = el("div", "lx-pending");
      p.innerHTML = "<b>Not written yet</b><p>This unit is on the syllabus and its lessons are still " +
        "being made. The units that are finished are marked on the course page.</p>";
      v.appendChild(p);
    }

    noFoot(); progress(null);
    show("unit");
  }

  /* ================================================================= Sets */
  function openSet(id, silent) {
    if (!silent) enter("set:" + id, trim(D.SETS[id].t), function () { openSet(id, true); });
    S.setId = id; S.set = D.SETS[id];
    var st = setState(id), cards = S.set.cards;
    var v = $("#v-set");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", "Study set"));
    v.appendChild(el("h1", "lx-h1", esc(S.set.t)));
    v.appendChild(el("p", "lx-lede", cards.length + " terms · " + setMastered(id) +
      " mastered" + (st.best ? " · best match " + st.best.toFixed(1) + "s" : "")));

    var modes = el("div", "lx-modes");
    [["Flashcards", "Flip through them", I.cards, startCards],
     ["Learn", "Drilled until they stick", I.learn, startLearn],
     ["Match", "Pair them against a clock", I.match, startMatch],
     ["Test", "One graded run", I.test, startTest]
    ].forEach(function (m) {
      var b = el("button", "lx-mode");
      b.type = "button";
      b.innerHTML = svg(m[2], true) + "<b>" + m[0] + "</b><span>" + m[1] + "</span>";
      b.addEventListener("click", function () { m[3](); });
      modes.appendChild(b);
    });
    v.appendChild(modes);

    /* The games sit under the study modes rather than beside them, because
       they are not four equivalent choices — Learn is the one that teaches,
       and a row of eight tiles would say otherwise. Each says what it is
       actually good for, since "play a game" is not a reason to pick one. */
    v.appendChild(el("h2", "lx-h2", "Play it"));
    v.appendChild(el("p", "lx-lede",
      "All three write to the same record Learn does \u2014 what you prove in a game, " +
      "Learn stops asking you."));
    var games = el("div", "lx-modes lx-games");
    [["Match the card", "Definition first, term second", I.grid, startCardMatch],
     ["Word Hunt", "Find them in the grid", I.point, startHunt],
     ["Hangman", "Produce it from the clue", I.pen, startHangman]
    ].forEach(function (m) {
      var b = el("button", "lx-mode");
      b.type = "button";
      b.innerHTML = svg(m[2], true) + "<b>" + m[0] + "</b><span>" + m[1] + "</span>";
      b.addEventListener("click", function () { m[3](); });
      games.appendChild(b);
    });
    v.appendChild(games);

    var terms = el("div", "lx-terms");
    cards.forEach(function (c, i) {
      var row = el("div", "lx-term");
      row.innerHTML = "<b>" + esc(c[0]) + "</b><p>" + esc(c[1]) + "</p>";
      var star = el("button", "star" + (st.star[i] ? " on" : ""));
      star.type = "button";
      star.setAttribute("aria-label", "Star " + c[0]);
      star.setAttribute("aria-pressed", String(!!st.star[i]));
      star.innerHTML = svg(I.star, !st.star[i]);
      star.addEventListener("click", function () {
        st.star[i] = !st.star[i];
        keep();
        star.classList.toggle("on", st.star[i]);
        star.setAttribute("aria-pressed", String(!!st.star[i]));
        star.innerHTML = svg(I.star, !st.star[i]);
      });
      row.appendChild(star);
      terms.appendChild(row);
    });
    v.appendChild(terms);

    noFoot(); progress(null);
    show("set");
  }

  /* ----------------------------------------------------------- Flashcards */
  function startCards(again) {
    enter("cards:" + S.setId, "Flashcards", function () { startCards(true); }, again);
    var cards = S.set.cards, order = cards.map(function (_, i) { return i; });
    var i = 0, flipped = false, shuffled = false;
    var known = {}, learning = {};

    var v = $("#v-cards");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", esc(S.set.t)));
    v.appendChild(el("h1", "lx-h1", "Flashcards"));

    var deck = el("div", "lx-deck");
    var flip = el("div", "lx-flip");
    flip.tabIndex = 0;
    flip.setAttribute("role", "button");
    flip.setAttribute("aria-label", "Flip card");
    flip.innerHTML =
      '<div class="lx-face a"><span class="kind">Term</span><p id="cFront"></p></div>' +
      '<div class="lx-face b"><span class="kind">Definition</span><p id="cBack"></p></div>';
    deck.appendChild(flip);
    v.appendChild(deck);

    var bar = el("div", "lx-deck-bar");
    var prev = el("button", "lx-round");
    prev.type = "button"; prev.setAttribute("aria-label", "Previous card");
    prev.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 9 11.5 15 18"/></svg>';
    var count = el("span", "lx-count");
    var next = el("button", "lx-round");
    next.type = "button"; next.setAttribute("aria-label", "Next card");
    next.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l6 6.5L9 18"/></svg>';
    bar.appendChild(prev); bar.appendChild(count); bar.appendChild(next);
    v.appendChild(bar);

    var side = el("div", "lx-deck-side");
    var still = el("button", "lx-pill warm", "Still learning");
    still.type = "button";
    var got = el("button", "lx-pill cool", "Know it");
    got.type = "button";
    var shuf = el("button", "lx-pill", "Shuffle");
    shuf.type = "button"; shuf.setAttribute("aria-pressed", "false");
    side.appendChild(still); side.appendChild(got); side.appendChild(shuf);
    v.appendChild(side);

    var tally = el("p", "lx-lede");
    tally.style.cssText = "text-align:center;margin-top:18px;font-size:14px";
    v.appendChild(tally);

    function draw() {
      var c = cards[order[i]];
      flipped = false;
      flip.classList.remove("back");
      $("#cFront").textContent = c[0];
      $("#cBack").textContent = c[1];
      count.textContent = (i + 1) + " / " + order.length;
      prev.disabled = i === 0;
      next.disabled = i === order.length - 1;
      var k = Object.keys(known).length, l = Object.keys(learning).length;
      tally.textContent = (k || l)
        ? k + " known · " + l + " still learning"
        : "Tap the card to flip it. Arrow keys move.";
    }
    function step(d) {
      i = Math.min(order.length - 1, Math.max(0, i + d));
      draw();
    }
    function sort(pile) {
      pile[order[i]] = true;
      var other = pile === known ? learning : known;
      delete other[order[i]];
      if (pile === known) {
        setState(S.setId).level[order[i]] = 3;
        keep();
        if (S.course && S.unitIx) {
          raise(S.course, S.unitIx, "r",
                Math.round(Object.keys(known).length / cards.length * 100));
        }
      }
      if (i === order.length - 1) { draw(); toast("End of the deck."); }
      else step(1);
    }

    flip.addEventListener("click", function () {
      flipped = !flipped;
      flip.classList.toggle("back", flipped);
    });
    flip.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip.click(); }
    });
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    still.addEventListener("click", function () { sort(learning); });
    got.addEventListener("click", function () { sort(known); });
    shuf.addEventListener("click", function () {
      shuffled = !shuffled;
      shuf.setAttribute("aria-pressed", String(shuffled));
      order = shuffled ? shuffle(cards.map(function (_, k) { return k; }))
                       : cards.map(function (_, k) { return k; });
      i = 0; draw();
      toast(shuffled ? "Shuffled." : "Back in order.");
    });

    S.keys = function (e) {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === " ") { e.preventDefault(); flip.click(); }
    };

    draw();
    noFoot(); progress(null);
    show("cards");
    setTimeout(function () { flip.focus(); }, 80);
  }

  /* ---------------------------------------------------------------- Learn
     The session. Everything that decides what to ask is in learn.js; this
     file asks it, and then gets out of the way.

     The screen is one card and nothing else. No sidebar, no streak, no
     confetti — a question a student is thinking about does not need a second
     thing on the page competing for the thought. What sits under the card is
     the help, in the order a good tutor offers it: a hint before an answer,
     and a question before a hint.

       GOAL -> DIAGNOSTIC -> [ ASK -> ANSWER -> TEACH ] -> REPORT
                                 ^                  |
                                 +---- adapt -------+
  */
  var L = window.OPLO_LEARN;
  var CN = window.OPLO_CONCEPTS;
  var AK = window.OPLO_ASK;

  function startLearn(again) {
    enter("learn:" + S.setId, "Learn", function () { startLearn(true); }, again);

    var setId = S.setId;
    var concepts = CN.forSet(setId, S.set.cards);
    var store = new L.Store(S.me ? S.me.id : "anon", setId);
    var v = $("#v-learn");

    var goal = null, mode = "deep", rounds = 6;
    var round = 0, asked = 0, correct = 0, hintsUsed = 0, earned = 0;
    var began = Date.now();
    var opened = {}, gained = {};      // mastery at the start, per concept
    var phase = "goal";
    var cur = null, curLevel = null, curQ = null;
    var hintLevel = 0, answered = false, picked = null;
    var diag = [], diagIx = 0;

    concepts.forEach(function (c) {
      opened[c.k] = L.mastery(store.get(c.k), Date.now());
    });

    /* ============================================================== Goal */
    function askGoal() {
      phase = "goal";
      noFoot(); progress(null);
      v.innerHTML = "";
      var wrap = el("div", "ln-open");
      wrap.appendChild(el("p", "lx-eyebrow", esc(S.set.t)));
      wrap.appendChild(el("h1", "ln-open-h", "What are you trying to do?"));
      wrap.appendChild(el("p", "ln-open-p",
        "It changes the session, not just the words on this screen — which levels you " +
        "are asked at, how hard the questions get, and what counts as done."));

      var grid = el("div", "ln-goals");
      L.GOALS.forEach(function (g) {
        var b = el("button", "ln-goal");
        b.type = "button";
        b.innerHTML = '<span class="ic">' + svg(I[g.glyph] || I.learn, true) + "</span>" +
          "<b>" + esc(g.name) + "</b><span class=\"s\">" + esc(g.say) + "</span>";
        b.addEventListener("click", function () { chose(g); });
        grid.appendChild(b);
      });
      wrap.appendChild(grid);

      /* What is already known, so the goal is not chosen blind. */
      var sum = L.summary(store.all(), concepts, Date.now());
      if (sum.mastered.length || sum.weak.length || sum.developing.length) {
        var st = el("div", "ln-known");
        st.innerHTML = "<b>Where you are</b>";
        var bar = el("div", "ln-known-bar");
        [["mastered", sum.mastered.length], ["strong", sum.strong.length],
         ["developing", sum.developing.length], ["weak", sum.weak.length],
         ["new", sum.untouched.length]].forEach(function (p) {
          if (!p[1]) return;
          var i = el("i");
          i.style.flex = p[1];
          i.style.background = L.BANDS.filter(function (b) { return b.k === p[0]; })[0].hue;
          i.title = p[1] + " " + p[0];
          bar.appendChild(i);
        });
        st.appendChild(bar);
        var legend = el("p", "ln-known-say",
          sum.untouched.length === concepts.length
            ? "Nothing seen yet — all " + concepts.length + " concepts are new."
            : sum.mastered.length + " mastered · " + sum.strong.length + " strong · " +
              sum.developing.length + " developing · " + sum.weak.length + " weak · " +
              sum.untouched.length + " untouched");
        st.appendChild(legend);
        if (sum.flagged.length) {
          st.appendChild(el("p", "ln-known-flag",
            svg(I.alert, true) + "<span>" + sum.flagged.length +
            (sum.flagged.length === 1 ? " concept you were sure about and got wrong. That is a " +
             "misconception, and it comes first." : " concepts you were sure about and got wrong. " +
             "Those are misconceptions, and they come first.") + "</span>"));
        }
        wrap.appendChild(st);
      }
      v.appendChild(wrap);
      show("learn");
    }

    function chose(g) {
      goal = g;
      if (g.mode === "auto") {
        goal = L.decideGoal(store.all(), concepts, Date.now());
        toast("Diagnostic first — it will decide.");
      }
      mode = goal.mode; rounds = goal.rounds;
      buildDiagnostic();
    }

    /* ======================================================== Diagnostic
       Five to eight questions, weighted towards what has never been seen,
       asked at the lowest level each concept supports. The point is not to
       score anybody. It is to give the engine something to work from other
       than zeros, so the first real question is already the right one. */
    function buildDiagnostic() {
      var pool = concepts.slice();
      var unseen = pool.filter(function (c) { return !store.get(c.k).seen; });
      var seen = pool.filter(function (c) { return store.get(c.k).seen; });
      diag = shuffle(unseen).slice(0, 6).concat(shuffle(seen).slice(0, 2));
      if (diag.length < 5) diag = shuffle(pool).slice(0, Math.min(5, pool.length));
      diag = shuffle(diag).slice(0, 8);
      diagIx = 0;
      phase = "diagnostic";
      nextDiag();
    }

    function nextDiag() {
      if (diagIx >= diag.length) { phase = "session"; nextQ(); return; }
      cur = diag[diagIx];
      var allowed = L.ceilingLevels(goal, CN.levelsFor(cur));
      curLevel = allowed[0];
      curQ = build(cur, curLevel);
      hintLevel = 0; answered = false; picked = null;
      draw();
    }

    /* =========================================================== The loop */
    function nextQ() {
      if (round >= rounds * Math.max(3, Math.min(8, concepts.length))) return finish();
      var pick = L.next(store.all(), concepts, Date.now(), cur ? cur.k : null);
      if (!pick) return finish();
      var sum = L.summary(store.all(), concepts, Date.now());
      if (sum.mastery >= goal.target && round > concepts.length) return finish();

      cur = pick;
      var allowed = L.ceilingLevels(goal, CN.levelsFor(cur));
      curLevel = L.levelFor(store.get(cur.k), allowed, mode);
      curQ = build(cur, curLevel);
      hintLevel = 0; answered = false; picked = null;
      draw();
    }

    /* ------------------------------------------------------ The questions
       Built by ask.js, which owns the one rule that matters here: a concept
       is never asked the same way twice running. What is passed in is how
       many times this concept has already been asked at this level, because
       that is what the phrasings are walked by — a student who misses
       something four times gets four different questions at it. */
    function build(c, lv) {
      return AK.build(c, lv, L.asked(store.get(c.k), lv), concepts);
    }

    /* --------------------------------------------------------- Parking
       A session that is walked out of is kept, so that closing a laptop
       mid-question is not the same as throwing the session away. Only what
       cannot be recomputed is stored: the counters, the goal, and where in
       the queue we were. The question itself is rebuilt from the concept and
       the level, which is cheaper and cannot go stale. */
    function park() {
      if (!R || phase === "goal") return;
      R.park(setId, {
        goal: goal && goal.k, mode: mode, rounds: rounds,
        round: round, asked: asked, correct: correct,
        hints: hintsUsed, earned: earned, began: began, opened: opened,
        phase: phase, diagIx: diagIx,
        diag: diag.map(function (c) { return c.k; }),
        cur: cur && cur.k, level: curLevel
      });
    }

    function unpark(p) {
      goal = L.GOALS.filter(function (g) { return g.k === p.goal; })[0] || L.GOALS[1];
      mode = p.mode || goal.mode;
      rounds = p.rounds || goal.rounds;
      round = p.round || 0; asked = p.asked || 0; correct = p.correct || 0;
      hintsUsed = p.hints || 0; earned = p.earned || 0;
      began = Date.now() - Math.min(36e5, Date.now() - (p.began || Date.now()));
      if (p.opened) opened = p.opened;
      phase = p.phase || "session";
      diagIx = p.diagIx || 0;
      diag = (p.diag || []).map(byKey).filter(Boolean);
      var back = p.cur && byKey(p.cur);
      if (!back) { phase = "session"; return nextQ(); }
      cur = back;
      curLevel = p.level || L.levelFor(store.get(cur.k), L.ceilingLevels(goal, CN.levelsFor(cur)), mode);
      curQ = build(cur, curLevel);
      hintLevel = 0; answered = false; picked = null;
      draw();
    }

    function byKey(k) {
      return concepts.filter(function (c) { return c.k === k; })[0] || null;
    }

    /* ------------------------------------------------------------- Render */
    function draw() {
      park();
      v.innerHTML = "";
      var stage = el("div", "ln");

      stage.appendChild(topBar());

      var card = el("section", "ln-card");
      var head = el("header", "ln-card-head");
      head.innerHTML = '<span class="lbl">' + esc(curQ.label) + "</span>";
      var lv = L.level(curLevel);
      var chip = el("span", "ln-lv");
      chip.title = lv.say;
      chip.innerHTML = '<i class="n' + lv.n + '"></i>' + esc(lv.name);
      head.appendChild(chip);
      if (phase === "diagnostic") {
        head.appendChild(el("span", "ln-diag", "Diagnostic"));
      }
      card.appendChild(head);

      card.appendChild(el("p", "ln-prompt", esc(curQ.prompt)));

      card.appendChild(el("p", "ln-ask", esc(curQ.ask)));
      card.appendChild(answerArea());

      var verdict = el("div", "ln-verdict-slot");
      verdict.id = "lnVerdict";
      card.appendChild(verdict);

      card.appendChild(helpRow());
      stage.appendChild(card);
      v.appendChild(stage);
      show("learn");

      if (curQ.kind === "type" || curQ.kind === "free") {
        setTimeout(function () { var i = $("#lnIn"); if (i) i.focus(); }, 70);
      }
    }

    function topBar() {
      var sum = L.summary(store.all(), concepts, Date.now());
      var bar = el("div", "ln-top");

      var left = el("span", "ln-count", String(sum.mastered.length + sum.strong.length));
      bar.appendChild(left);

      /* Segments, one per concept, coloured by band. It is a progress bar
         that happens to also be the whole student model at a glance. */
      var track = el("div", "ln-track");
      concepts.forEach(function (c) {
        var s = store.get(c.k);
        var m = L.mastery(s, Date.now());
        var b = L.band(m);
        var i = el("i");
        i.style.background = m > 0 ? b.hue : "";
        i.className = m > 0 ? "on" : "";
        if (cur && c.k === cur.k) i.classList.add("here");
        i.title = c.k + " — " + b.name;
        track.appendChild(i);
      });
      bar.appendChild(track);
      bar.appendChild(el("span", "ln-count end", String(concepts.length)));

      var quit = el("button", "ln-quit");
      quit.type = "button";
      quit.setAttribute("aria-label", "End the session");
      quit.innerHTML = svg(I.close, true);
      quit.addEventListener("click", function () { finish(); });
      bar.appendChild(quit);
      return bar;
    }

    function answerArea() {
      if (curQ.kind === "choice") {
        var wrap = el("div", "ln-opts" + (curQ.long ? " long" : ""));
        curQ.opts.forEach(function (o, i) {
          var b = el("button", "ln-opt");
          b.type = "button";
          b.dataset.value = o;
          b.innerHTML = '<span class="n">' + (i + 1) + "</span><span class=\"t\">" + esc(o) + "</span>";
          b.addEventListener("click", function () { answer(o); });
          wrap.appendChild(b);
        });
        return wrap;
      }
      if (curQ.kind === "type") {
        var w = el("form", "ln-type");
        var inp = el("input");
        inp.id = "lnIn"; inp.type = "text"; inp.autocomplete = "off";
        inp.spellcheck = false;
        inp.placeholder = "The term";
        inp.setAttribute("aria-label", "The term");
        w.appendChild(inp);
        var go = el("button", "ln-go", "Check");
        go.type = "submit";
        w.appendChild(go);
        w.addEventListener("submit", function (e) {
          e.preventDefault();
          if (answered || !inp.value.trim()) return;
          answer(inp.value.trim());
        });
        return w;
      }
      var f = el("form", "ln-free");
      var ta = el("textarea");
      ta.id = "lnIn"; ta.rows = 4;
      ta.placeholder = "In your own words. Two or three sentences is plenty.";
      ta.setAttribute("aria-label", "Your explanation");
      f.appendChild(ta);
      var g = el("button", "ln-go wide", "Check what I said");
      g.type = "submit";
      f.appendChild(g);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (answered || !ta.value.trim()) return;
        answer(ta.value.trim());
      });
      return f;
    }

    /* The help, in the order it should be offered. A hint before an answer,
       and the reason it matters before either. */
    function helpRow() {
      var row = el("div", "ln-help");

      var hint = el("button", "ln-hint");
      hint.type = "button";
      hint.id = "lnHint";
      hint.innerHTML = svg(I.bulb, true) + "<span>Need a hint?</span>";
      hint.addEventListener("click", giveHint);
      row.appendChild(hint);

      if (cur.why) {
        var why = el("button", "ln-why");
        why.type = "button";
        why.innerHTML = "Why am I learning this?";
        why.addEventListener("click", function () {
          var box = $("#lnHelpOut");
          box.innerHTML = '<div class="ln-note"><b>Why this matters</b><p>' + esc(cur.why) + "</p>" +
            (cur.eg ? '<p class="eg">' + esc(cur.eg) + "</p>" : "") + "</div>";
        });
        row.appendChild(why);
      }

      var dunno = el("button", "ln-dunno", "Don't know?");
      dunno.type = "button";
      dunno.addEventListener("click", function () { answer(null); });
      row.appendChild(dunno);

      var out = el("div", "ln-help-out");
      out.id = "lnHelpOut";
      var box = el("div");
      box.appendChild(row);
      box.appendChild(out);
      return box;
    }

    /* --------------------------------------------------------- The ladder
       Three rungs and then the explanation, and the level taken is recorded.
       A student who reaches 90% on rung three has not done what a student who
       reaches 90% on rung zero has done, and the model needs to know which
       one it is looking at. */
    function hints() {
      var out = [];
      if (curLevel === "recognise" || curLevel === "recall") {
        out.push("Read the definition again and ask what kind of thing it is describing — a " +
                 "part, a property, or a technique.");
        if (cur.pre && cur.pre.length) {
          out.push("It sits just after " + cur.pre.join(" and ") + " in the chain.");
        } else if (cur.eg) {
          out.push("Here is an instance of it: " + cur.eg);
        } else {
          out.push("It starts with “" + cur.k.charAt(0) + "”.");
        }
        out.push("The first two letters are “" + cur.k.slice(0, 2) + "”.");
      } else if (curLevel === "explain") {
        out.push("Start with what kind of thing it is, then what it does.");
        out.push("A good answer usually mentions " + (cur.say || []).slice(0, 2).join(" and ") + ".");
        out.push("Say it as though the person opposite you has never heard the word.");
      } else {
        out.push("Work out what the question is really asking about — which single idea is " +
                 "being tested here?");
        if (cur.miss && cur.miss.length) {
          out.push("Watch out for this: " + cur.miss[0][0]);
        } else {
          out.push("Rule out the two options that are about something else entirely first.");
        }
        out.push(cur.why ? "Remember: " + cur.why : "Go back to the definition and read it literally.");
      }
      return out;
    }

    function giveHint() {
      if (answered) return;
      var all = hints();
      if (hintLevel >= all.length) return;
      var text = all[hintLevel];
      hintLevel++;
      hintsUsed++;
      var box = $("#lnHelpOut");
      var h = el("div", "ln-hintbox");
      h.innerHTML = "<b>Hint " + hintLevel + " of " + all.length + "</b><p>" + esc(text) + "</p>";
      box.appendChild(h);
      var btn = $("#lnHint");
      if (hintLevel >= all.length) {
        btn.disabled = true;
        btn.querySelector("span").textContent = "No more hints";
      } else {
        btn.querySelector("span").textContent = "Another hint";
      }
    }

    /* -------------------------------------------------------- The answer */
    function answer(given) {
      if (answered) return;
      answered = true;
      picked = given;
      asked++;
      round++;

      var ok = false, detail = null;
      if (given == null) ok = false;
      else if (curQ.kind === "free") {
        detail = scoreExplanation(given, curQ.look);
        ok = detail.ok;
      } else if (curQ.kind === "type") ok = norm(given) === norm(curQ.right);
      else ok = given === curQ.right;

      if (ok) correct++;

      // Mark the options before anything else moves, so the eye lands on the
      // answer rather than on a layout change.
      if (curQ.kind === "choice") {
        [].forEach.call(v.querySelectorAll(".ln-opt"), function (b) {
          b.disabled = true;
          if (b.dataset.value === curQ.right) b.classList.add("right");
          else if (b.dataset.value === given) b.classList.add("wrong");
        });
      } else if (curQ.kind === "type") {
        var inp = $("#lnIn");
        if (inp) { inp.disabled = true; inp.classList.add(ok ? "right" : "wrong"); }
        var go = v.querySelector(".ln-go");
        if (go) go.disabled = true;
      } else {
        var ta = $("#lnIn");
        if (ta) ta.disabled = true;
        var g2 = v.querySelector(".ln-go");
        if (g2) g2.disabled = true;
      }

      /* Confidence is asked before the verdict is explained, and only when it
         will tell us something: a hinted answer's confidence is about the
         hint, not the knowledge. */
      if (!hintLevel && given != null && (curLevel !== "recognise" || Math.random() < 0.4)) {
        askConfidence(ok, detail);
      } else {
        record(ok, detail, null);
        verdict(ok, detail, null);
      }
    }

    /* Scored on the ideas a good answer contains rather than on wording. The
       list is shown afterwards either way, because "you missed two of the five
       things we look for, and here they are" is a lesson and a mark is not. */
    function scoreExplanation(text, look) {
      var t = " " + norm(text) + " ";
      var hit = [], miss = [];
      (look || []).forEach(function (w) {
        if (t.indexOf(norm(w)) > -1) hit.push(w); else miss.push(w);
      });
      var need = Math.max(2, Math.ceil((look || []).length * 0.4));
      return { hit: hit, miss: miss, need: need, ok: hit.length >= need,
               words: text.trim().split(/\s+/).length };
    }

    function askConfidence(ok, detail) {
      var slot = $("#lnVerdict");
      slot.innerHTML = "";
      var box = el("div", "ln-conf");
      box.innerHTML = "<b>Before the answer — how sure were you?</b>";
      var row = el("div", "ln-conf-row");
      [["Guessing", 0], ["Not sure", 1], ["Fairly sure", 2], ["Certain", 3]].forEach(function (c) {
        var b = el("button");
        b.type = "button";
        b.textContent = c[0];
        b.addEventListener("click", function () {
          record(ok, detail, c[1]);
          verdict(ok, detail, c[1]);
        });
        row.appendChild(b);
      });
      box.appendChild(row);
      slot.appendChild(box);
      slot.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function record(ok, detail, confidence) {
      /* What was true *before* the answer is what the award is priced on —
         proving something you already had is worth almost nothing, and that
         can only be known from the state as it was a moment ago. */
      var now = Date.now();
      var before = store.get(cur.k);
      var wasMastery = L.mastery(before, now);
      var wasFlagged = !!before.flagged;
      var gapDays = before.last ? (now - before.last) / 864e5 : 0;

      store.grade(cur.k, { level: curLevel, right: ok, hints: hintLevel,
                           confidence: confidence }, now);

      earned += Game.answer({ level: curLevel, right: ok, hints: hintLevel,
                              mastery: wasMastery, gapDays: gapDays,
                              confidence: confidence, skipped: picked == null });
      Game.check("answer", { right: ok, level: curLevel, gapDays: gapDays,
                             wasFlagged: wasFlagged,
                             mastery: L.mastery(store.get(cur.k), now) });
      if (picked == null) Game.check("skip", {});

      if (!ok) {
        slip("term", setId + ":" + cur.i, cur.k, cur.def, { card: [cur.k, cur.def] });
        var m = S.mistakes.filter(function (x) { return x.key === setId + ":" + cur.i; })[0];
        if (m) m.card = [cur.k, cur.def];
      }
      /* Parked again here, not only when a question is drawn: leaving in the
         two seconds after answering should not lose the answer's counters. */
      park();
      // Keep the old set-level mastery in step, so the rest of the app still
      // reads the same story off the same session.
      var st = setState(setId);
      var sum = L.summary(store.all(), concepts, Date.now());
      concepts.forEach(function (c, i) {
        st.level[i] = L.mastery(store.get(c.k), Date.now()) >= 0.72 ? 3 : 0;
      });
      keep();
      if (S.course && S.unitIx) raise(S.course, S.unitIx, "r", Math.round(sum.mastery * 100));
    }

    /* ------------------------------------------------------------ Verdict
       A wrong answer is where the teaching happens, so it gets the room. It
       never opens with the correct answer: it opens with the part of the
       student's thinking that was right, then the misconception, then a
       question back. */
    function verdict(ok, detail, confidence) {
      var slot = $("#lnVerdict");
      slot.innerHTML = "";
      var s = store.get(cur.k);
      var m = L.mastery(s, Date.now());
      var b = L.band(m);

      var box = el("div", "ln-verdict " + (ok ? "right" : picked == null ? "skip" : "wrong"));

      if (ok) {
        box.innerHTML = "<b>" + (hintLevel ? "Right, with " + hintLevel +
          (hintLevel === 1 ? " hint" : " hints") : "Right") + "</b>";
        if (curQ.kind === "free" && detail) {
          box.innerHTML += "<p>You covered " + detail.hit.length + " of " +
            (detail.hit.length + detail.miss.length) + " things a full answer has: <em>" +
            detail.hit.join(", ") + "</em>." +
            (detail.miss.length ? " Not mentioned: <em>" + detail.miss.join(", ") + "</em>." : "") +
            "</p>";
        } else if (curQ.why) {
          box.innerHTML += "<p>" + esc(curQ.why) + "</p>";
        }
      } else if (picked == null) {
        box.innerHTML = "<b>Left it</b><p>Saying you do not know is worth more than a guess — " +
          "it goes in as unknown rather than as a coin flip. It comes back soon.</p>";
        box.innerHTML += teachBlock();
      } else {
        box.appendChild(wrongTeaching(detail, confidence));
      }

      /* Where this concept now stands, and when it is next worth seeing. */
      var state = el("div", "ln-state");
      state.innerHTML = '<span class="dot" style="background:' + b.hue + '"></span>' +
        "<span class=\"nm\"><b>" + esc(cur.k) + "</b> — " + esc(b.name) + "</span>" +
        '<span class="due">back ' + esc(L.when(s, Date.now())) + "</span>";
      box.appendChild(state);

      var dims = el("div", "ln-dims");
      L.LEVELS.forEach(function (lv) {
        var val = Math.round(s[lv.k] * 100);
        var d = el("div", "ln-dim" + (lv.k === curLevel ? " now" : ""));
        d.title = lv.say;
        d.innerHTML = "<span>" + esc(lv.name) + "</span><div class=\"t\"><i style=\"width:" +
          val + '%"></i></div>';
        dims.appendChild(d);
      });
      box.appendChild(dims);

      slot.appendChild(box);

      var next = el("div", "ln-next");
      var nb = el("button", "ln-continue", "Continue");
      nb.type = "button";
      nb.addEventListener("click", function () { advance(); });
      next.appendChild(nb);
      if (!ok) {
        var tt = el("button", "ln-talk");
        tt.type = "button";
        tt.innerHTML = svg(I.learn, true) + "<span>Talk it through</span>";
        tt.addEventListener("click", function () {
          Tutor.ask("I am working on " + cur.k + ". The question was: " + curQ.prompt +
            (picked ? " I answered “" + picked + "” and it was wrong." : " I did not know.") +
            " Do not tell me the answer — ask me something that helps me see it.");
        });
        next.appendChild(tt);
      }
      slot.appendChild(next);
      setTimeout(function () { nb.focus(); }, 40);
      slot.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    /* The Socratic move, done locally so it works with no model running. The
       misconception data is what makes it possible: knowing the mistake
       students actually make is what lets you name the right part of their
       thinking before you correct the wrong part. */
    function wrongTeaching(detail, confidence) {
      var box = el("div");
      var flagged = confidence != null && confidence >= 3;

      if (curQ.kind === "free" && detail) {
        box.innerHTML = "<b>Not yet — but look at what you did say</b>" +
          (detail.hit.length
            ? "<p>You got to <em>" + detail.hit.join(", ") + "</em>. That is the right territory.</p>"
            : "<p>Nothing in that answer touched the ideas this one turns on yet.</p>") +
          "<p>A full answer would also reach: <em>" + detail.miss.join(", ") + "</em>. " +
          "Which of those could you have added?</p>";
        return box;
      }

      var miss = (cur.miss && cur.miss.length) ? cur.miss[0] : null;
      var head = flagged ? "You were sure — and that makes this worth stopping on"
                         : "Not quite, and it is a close one";
      var html = "<b>" + head + "</b>";
      if (flagged) {
        html += "<p>Being certain and wrong is different from not knowing. It means there is " +
                "something you believe that is getting in the way, so this one is coming back " +
                "sooner than the rest.</p>";
      }
      if (miss) {
        html += '<p class="ln-miss"><em>' + esc(miss[0]) + "</em> " + esc(miss[1]) + "</p>";
      }
      html += "<p>" + (curQ.why ? esc(curQ.why) : "The answer is " + esc(curQ.right) + ".") + "</p>";
      box.innerHTML = html;
      return box;
    }

    function teachBlock() {
      var out = "<p><b>" + esc(curQ.right || cur.k) + "</b> — " + esc(cur.def) + "</p>";
      if (cur.eg) out += '<p class="eg">' + esc(cur.eg) + "</p>";
      return out;
    }

    /* ------------------------------------------------- Teach it back
       When a concept crosses into strong, it gets asked for once in the
       student's own words. Retrieval and construction in one move, and the
       only checkpoint in the session that cannot be passed by recognising
       something. */
    function advance() {
      if (phase === "diagnostic") { diagIx++; nextDiag(); return; }
      var s = store.get(cur.k);
      var m = L.mastery(s, Date.now());
      if (mode === "deep" && cur.say && m >= 0.72 && !s.taught && s[cur.say ? "explain" : "recall"] < 0.9) {
        s.taught = true;
        store.save();
        return teachMe(cur);
      }
      nextQ();
    }

    function teachMe(c) {
      v.innerHTML = "";
      var stage = el("div", "ln");
      stage.appendChild(topBar());
      var card = el("section", "ln-card ln-teach");
      card.innerHTML = '<header class="ln-card-head"><span class="lbl">Teach it back</span>' +
        '<span class="ln-lv"><i class="n2"></i>Explain</span></header>' +
        '<p class="ln-teach-h">' + esc(c.k) + "</p>" +
        '<p class="ln-prompt">You have this one. Say it to someone who has never heard the ' +
        "word — that is the test that recognition cannot fake.</p>";
      var f = el("form", "ln-free");
      var ta = el("textarea");
      ta.rows = 4;
      ta.id = "lnIn";
      ta.placeholder = "Explain " + c.k + " in your own words.";
      ta.setAttribute("aria-label", "Your explanation");
      f.appendChild(ta);
      var g = el("button", "ln-go wide", "Done");
      g.type = "submit";
      f.appendChild(g);
      card.appendChild(f);
      var slot = el("div", "ln-verdict-slot");
      slot.id = "lnVerdict";
      card.appendChild(slot);
      stage.appendChild(card);
      v.appendChild(stage);
      show("learn");
      setTimeout(function () { ta.focus(); }, 70);

      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var txt = ta.value.trim();
        if (!txt) return;
        ta.disabled = true; g.disabled = true;
        var d = scoreExplanation(txt, c.say);
        var wasM = L.mastery(store.get(c.k), Date.now());
        store.grade(c.k, { level: "explain", right: d.ok, hints: 0 }, Date.now());
        earned += Game.answer({ level: "explain", right: d.ok, hints: 0, mastery: wasM });
        Game.check("explain", { ok: d.ok });
        slot.innerHTML = '<div class="ln-verdict ' + (d.ok ? "right" : "wrong") + '"><b>' +
          (d.ok ? "That will hold" : "Nearly") + "</b><p>You reached <em>" +
          (d.hit.join(", ") || "none of the key ideas yet") + "</em>." +
          (d.miss.length ? " A full answer also reaches <em>" + d.miss.join(", ") + "</em>." : "") +
          "</p></div>";
        var nx = el("div", "ln-next");
        var nb = el("button", "ln-continue", "Continue");
        nb.type = "button";
        nb.addEventListener("click", nextQ);
        nx.appendChild(nb);
        slot.appendChild(nx);
        nb.focus();
      });
    }

    /* ============================================================ Report */
    function finish() {
      progress(null); noFoot();
      if (R) R.clearPark(setId);        // a finished session is not a parked one
      var now = Date.now();
      var sum = L.summary(store.all(), concepts, now);
      var mins = Math.max(1, Math.round((now - began) / 6e4));

      var moved = [], slipped = [];
      concepts.forEach(function (c) {
        var was = opened[c.k] || 0;
        var is = L.mastery(store.get(c.k), now);
        if (is - was > 0.06) moved.push([c, was, is]);
        if (was - is > 0.06) slipped.push([c, was, is]);
      });
      moved.sort(function (a, b) { return (b[2] - b[1]) - (a[2] - a[1]); });

      v.innerHTML = "";
      var wrap = el("div", "ln-report");
      wrap.appendChild(el("p", "lx-eyebrow", esc(S.set.t) + " · " + mins + " min"));
      wrap.appendChild(el("h1", "ln-open-h",
        sum.mastery >= goal.target ? "You hit what you came for." : "Session report"));
      wrap.appendChild(el("p", "ln-open-p",
        asked + (asked === 1 ? " question" : " questions") + ", " + correct + " right" +
        (hintsUsed ? ", " + hintsUsed + (hintsUsed === 1 ? " hint" : " hints") + " taken" : "") +
        ". " + honest(sum, correct, asked, hintsUsed)));

      var cols = el("div", "ln-rep-cols");
      [["Mastered", sum.mastered, "mastered"], ["Strong", sum.strong, "strong"],
       ["Developing", sum.developing, "developing"], ["Still weak", sum.weak, "weak"]]
        .forEach(function (g) {
          if (!g[1].length) return;
          var hue = L.BANDS.filter(function (b) { return b.k === g[2]; })[0].hue;
          var c = el("div", "ln-rep-col");
          c.innerHTML = '<h3><i style="background:' + hue + '"></i>' + g[0] +
            "<em>" + g[1].length + "</em></h3>";
          var ul = el("ul");
          g[1].forEach(function (x) { ul.innerHTML += "<li>" + esc(x.k) + "</li>"; });
          c.appendChild(ul);
          cols.appendChild(c);
        });
      wrap.appendChild(cols);

      if (moved.length) {
        var mv = el("div", "ln-rep-moved");
        mv.innerHTML = "<h3>What moved</h3>";
        moved.slice(0, 6).forEach(function (m) {
          var row = el("div", "ln-move");
          row.innerHTML = "<span>" + esc(m[0].k) + "</span>" +
            '<div class="t"><i class="was" style="width:' + Math.round(m[1] * 100) + '%"></i>' +
            '<i class="is" style="width:' + Math.round(m[2] * 100) + '%"></i></div>' +
            "<em>+" + Math.round((m[2] - m[1]) * 100) + "</em>";
          mv.appendChild(row);
        });
        wrap.appendChild(mv);
      }

      if (sum.flagged.length) {
        var fl = el("div", "ln-rep-flag");
        fl.innerHTML = "<h3>" + svg(I.alert, true) + "Misconceptions</h3><p>You were confident " +
          "and wrong on " + sum.flagged.map(function (c) { return "<b>" + esc(c.k) + "</b>"; })
            .join(", ") + ". That is not a gap in what you know, it is something you believe " +
          "that is in the way — which is why these come back first.</p>";
        wrap.appendChild(fl);
      }

      var plan = el("div", "ln-rep-plan");
      plan.innerHTML = "<h3>Next</h3>";
      var soon = concepts.map(function (c) { return [c, store.get(c.k)]; })
        .filter(function (p) { return p[1].seen; })
        .sort(function (a, b) { return (a[1].due || 0) - (b[1].due || 0); })
        .slice(0, 5);
      if (soon.length) {
        var ul = el("ul");
        soon.forEach(function (p) {
          ul.innerHTML += "<li><b>" + esc(p[0].k) + "</b><span>" +
            esc(L.when(p[1], now)) + "</span></li>";
        });
        plan.appendChild(ul);
        plan.appendChild(el("p", "ln-rep-say",
          "Spacing is the point. Coming back to these on the days above is worth more than " +
          "another hour today — the gap is what makes it stick."));
      }
      wrap.appendChild(plan);

      /* What the session was worth, and where that leaves the ladder. It
         goes here rather than beside the questions, because a number moving
         while somebody is thinking is a number stealing the thinking. */
      if (Game.on() && earned) {
        var rec = Game.rec();
        var r = G.rank(rec.d.game.xp);
        var xpBox = el("div", "ln-rep-xp");
        xpBox.innerHTML =
          '<div class="ln-xp-num"><b>+' + earned + "</b><span>XP this session</span></div>" +
          '<div class="ln-xp-rank"><div class="t"><i style="width:' + r.pct + '%"></i></div>' +
          "<p><b>" + esc(r.name) + "</b>" +
          (r.next ? " \u00b7 " + r.toGo + " to " + esc(r.next.name)
                  : " \u00b7 the top of the ladder") + "</p>" +
          "<span>" + esc(r.say) + "</span></div>" +
          '<div class="ln-xp-streak"><b>' + rec.d.game.streak + "</b><span>day" +
          (rec.d.game.streak === 1 ? "" : "s") + " running</span></div>";
        wrap.appendChild(xpBox);
      }

      Game.check("session", {
        asked: asked, right: correct, hints: hintsUsed,
        swept: sum.mastered.length === concepts.length && concepts.length > 3
      });

      var acts = el("div", "ln-rep-acts");
      var again = el("button", "lx-btn", "Another round");
      again.type = "button";
      again.addEventListener("click", function () { startLearn(true); });
      acts.appendChild(again);
      var back = el("button", "lx-btn quiet", "Back to the set");
      back.type = "button";
      back.addEventListener("click", function () { openSet(setId); });
      acts.appendChild(back);
      wrap.appendChild(acts);

      v.appendChild(wrap);
      show("learn");
    }

    /* One sentence, and it has to be true even when the news is bad. */
    function honest(sum, right, total, hints) {
      var acc = total ? right / total : 0;
      if (!total) return "Nothing answered, so nothing changed.";
      if (hints / Math.max(1, total) > 0.6) {
        return "Most of those came with help, so they are marked lower than they look. " +
               "Try a round without hints and see what holds.";
      }
      if (sum.mastered.length >= sum.weak.length && acc > 0.8) {
        return "Strong session. What is left is retention, and retention is a calendar problem.";
      }
      if (acc < 0.5) return "A hard session, which is what a useful one usually feels like.";
      if (sum.untouched.length) return sum.untouched.length + " concepts still untouched.";
      return "Steady. The weak ones are the ones worth coming back to.";
    }

    /* 1-4 pick an option, Enter continues, H asks for a hint. */
    S.learnKeys = function (e) {
      if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName || "")) return;
      if (e.metaKey || e.ctrlKey) return;
      if (phase === "goal") return;
      if (e.key === "Enter") {
        var c = v.querySelector(".ln-continue");
        if (c) { e.preventDefault(); c.click(); }
        return;
      }
      if (e.key.toLowerCase() === "h" && !answered) { e.preventDefault(); giveHint(); return; }
      if (answered) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) {
        var opts = v.querySelectorAll(".ln-opt");
        if (opts[n - 1]) { e.preventDefault(); opts[n - 1].click(); }
      }
    };

    /* ------------------------------------------------------- Coming back
       A session left in the middle is offered back rather than restored
       silently. Silently would be worse: a student who opened Learn meaning
       to start fresh should not find themselves eleven questions into
       Tuesday's session with no way to tell what happened. */
    function offerResume(p) {
      phase = "resume";
      noFoot(); progress(null);
      v.innerHTML = "";
      var wrap = el("div", "ln-open");
      wrap.appendChild(el("p", "lx-eyebrow", esc(S.set.t)));
      wrap.appendChild(el("h1", "ln-open-h", "You were part-way through."));

      var g = L.GOALS.filter(function (x) { return x.k === p.goal; })[0];
      var mins = Math.max(1, Math.round((Date.now() - (p.at || Date.now())) / 6e4));
      var ago = mins < 60 ? mins + (mins === 1 ? " minute" : " minutes") + " ago"
              : mins < 1440 ? Math.round(mins / 60) + "h ago" : "yesterday";

      wrap.appendChild(el("p", "ln-open-p",
        "You left this one " + ago + ", " + (p.asked || 0) +
        ((p.asked === 1) ? " question" : " questions") + " in" +
        (p.asked ? ", " + (p.correct || 0) + " right" : "") +
        (g ? ", working on \u201c" + esc(g.name.toLowerCase()) + "\u201d" : "") +
        ". Nothing you answered was lost \u2014 every one of them is already in the " +
        "record. This is only about whether you carry on in the same run."));

      var row = el("div", "ln-resume");
      var go = el("button", "lx-btn lg", "Pick up where I was");
      go.type = "button";
      go.addEventListener("click", function () { unpark(p); });
      row.appendChild(go);
      var fresh = el("button", "lx-btn quiet", "Start a new session");
      fresh.type = "button";
      fresh.addEventListener("click", function () {
        R.clearPark(setId);
        askGoal();
      });
      row.appendChild(fresh);
      wrap.appendChild(row);
      v.appendChild(wrap);
      show("learn");
      setTimeout(function () { go.focus(); }, 60);
    }

    var waiting = (!again && R) ? R.parked(setId) : null;
    if (waiting) offerResume(waiting);
    else askGoal();
  }

  /* ----------------------------------------------------------------- Match */
  function startMatch(again) {
    enter("match:" + S.setId, "Match", function () { startMatch(true); }, again);
    var st = setState(S.setId);
    var pick = shuffle(S.set.cards).slice(0, Math.min(6, S.set.cards.length));
    var tiles = [];
    pick.forEach(function (c, i) {
      tiles.push({ id: i, txt: c[0], term: true });
      tiles.push({ id: i, txt: c[1], term: false });
    });
    tiles = shuffle(tiles);

    var v = $("#v-match");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", esc(S.set.t)));
    var head = el("div");
    head.style.cssText = "display:flex;align-items:baseline;justify-content:space-between;gap:20px;flex-wrap:wrap";
    head.innerHTML = '<h1 class="lx-h1">Match</h1><p class="lx-timer" id="mTime">0.0s</p>';
    v.appendChild(head);
    v.appendChild(el("p", "lx-lede", "Pair every term with its definition. The clock is the whole game." +
      (st.best ? " Your best is " + st.best.toFixed(1) + "s." : "")));

    var grid = el("div", "lx-match");
    var nodes = tiles.map(function (t) {
      var b = el("button", "lx-tile" + (t.term ? " term" : ""));
      b.type = "button";
      b.textContent = t.txt;
      b.dataset.id = t.id;
      b.dataset.term = String(t.term);
      grid.appendChild(b);
      return b;
    });
    v.appendChild(grid);

    var start = performance.now(), left = pick.length, sel = null, lock = false, timer;
    function tick() {
      $("#mTime").textContent = ((performance.now() - start) / 1000).toFixed(1) + "s";
    }
    timer = setInterval(tick, 100);

    nodes.forEach(function (b) {
      b.addEventListener("click", function () {
        if (lock || b.classList.contains("gone") || b === sel) return;
        if (!sel) { sel = b; b.classList.add("pick"); return; }
        var hit = sel.dataset.id === b.dataset.id && sel.dataset.term !== b.dataset.term;
        if (hit) {
          var a = sel; sel = null;
          a.classList.remove("pick");
          a.classList.add("hit"); b.classList.add("hit");
          setTimeout(function () { a.classList.add("gone"); b.classList.add("gone"); }, 190);
          if (--left === 0) finish();
        } else {
          lock = true;
          var a2 = sel; sel = null;
          a2.classList.remove("pick");
          a2.classList.add("miss"); b.classList.add("miss");
          setTimeout(function () {
            a2.classList.remove("miss"); b.classList.remove("miss");
            lock = false;
          }, 380);
        }
      });
    });

    function finish() {
      clearInterval(timer);
      var secs = (performance.now() - start) / 1000;
      var best = st.best == null || secs < st.best;
      if (best) st.best = secs;
      st.runs = (st.runs || 0) + 1;
      keep();
      var won = Game.run("match", { seconds: secs });
      Game.check("match", { seconds: secs });
      setTimeout(function () {
        result({
          title: secs.toFixed(1) + " seconds.",
          lede: best ? "That is your best run on this set."
                     : "Your best on this set is still " + st.best.toFixed(1) + "s.",
          pct: 100,
          stats: [[pick.length, "pairs"], [secs.toFixed(1), "seconds"],
                  [(secs / pick.length).toFixed(1), "per pair"]].concat(
                  won ? [["+" + won, "XP"]] : []),
          back: function () { openSet(S.setId); },
          again: startMatch
        });
      }, 420);
    }

    noFoot(); progress(null);
    show("match");
  }

  /* ================================================================ Games
     Three of them, drawn here and decided in games.js.

     What they have in common is the thing that makes them worth building at
     all: every one of them writes to the same student model Learn runs on.
     A game with a private high score wastes the evidence it collects. If a
     student can produce "cochlea" from four letters and a definition, the
     model should know it, and Learn should stop offering them four options
     to pick between. */
  var GM = window.OPLO_GAMES;

  /* The bridge. Everything a game learns about a student goes through here,
     at the cognitive level the game actually demonstrates — which is why the
     level is an argument and not a constant. Picking a term out of four is
     recognition however much fun the wrapper is; producing it letter by
     letter from a definition is recall, and is scored as such. */
  function gradeFromGame(setId, term, ok, level, hints) {
    var concepts = CN.forSet(setId, D.SETS[setId].cards);
    var c = concepts.filter(function (x) { return x.k === term; })[0];
    if (!c) return;
    var store = new L.Store(S.me ? S.me.id : "anon", setId);
    var was = L.mastery(store.get(c.k), Date.now());
    store.grade(c.k, { level: level, right: ok, hints: hints || 0 }, Date.now());
    Game.answer({ level: level, right: ok, hints: hints || 0, mastery: was });
    if (!ok) slip("term", setId + ":" + c.i, c.k, c.def, { card: [c.k, c.def] });
    var st = setState(setId);
    concepts.forEach(function (x, i) {
      st.level[i] = L.mastery(store.get(x.k), Date.now()) >= 0.72 ? 3 : 0;
    });
    keep();
  }

  /* The terms this student is worst at, weakest first. Every game builds its
     rounds from this rather than from the deck order, so ten minutes of a
     game is ten minutes on the ten things that need it. */
  function weakestFirst(setId) {
    var cards = D.SETS[setId].cards;
    var concepts = CN.forSet(setId, cards);
    var store = new L.Store(S.me ? S.me.id : "anon", setId);
    var now = Date.now();
    return concepts.map(function (c, i) { return { i: i, m: L.mastery(store.get(c.k), now) }; })
      .sort(function (a, b) { return a.m - b.m; })
      .map(function (x) { return x.i; });
  }

  /* ------------------------------------------------- Match the card
     Definition on the card, terms underneath. The direction a flashcard deck
     is worst at, and the direction an exam asks in. */
  function startCardMatch(again) {
    enter("cardmatch:" + S.setId, "Match the card", function () { startCardMatch(true); }, again);
    var setId = S.setId, cards = S.set.cards;
    var rounds = GM.cardRounds(cards, weakestFirst(setId), 10);
    var i = 0, right = 0, streak = 0, bestStreak = 0, locked = false;
    var v = $("#v-cardmatch");

    function draw() {
      if (i >= rounds.length) return done();
      var q = rounds[i];
      locked = false;
      v.innerHTML = "";
      var wrap = el("div", "gm");

      var top = el("div", "gm-top");
      top.innerHTML = '<span class="gm-count">' + (i + 1) + " / " + rounds.length + "</span>" +
        '<div class="gm-track"><i style="width:' + Math.round(i / rounds.length * 100) + '%"></i></div>' +
        '<span class="gm-streak' + (streak >= 3 ? " hot" : "") + '">' +
        (streak >= 2 ? streak + " in a row" : "&nbsp;") + "</span>";
      wrap.appendChild(top);

      var card = el("section", "gm-card");
      card.innerHTML = '<span class="gm-kind">Definition</span>' +
        '<p class="gm-def">' + esc(q.def) + "</p>";
      wrap.appendChild(card);

      var opts = el("div", "gm-opts");
      q.opts.forEach(function (o) {
        var b = el("button", "gm-opt");
        b.type = "button";
        b.textContent = o;
        b.addEventListener("click", function () { answer(b, o, q); });
        opts.appendChild(b);
      });
      wrap.appendChild(opts);
      v.appendChild(wrap);
      show("cardmatch");
    }

    function answer(btn, given, q) {
      if (locked) return;
      locked = true;
      var ok = given === q.right;
      if (ok) { right++; streak++; bestStreak = Math.max(bestStreak, streak); }
      else streak = 0;

      [].forEach.call(v.querySelectorAll(".gm-opt"), function (b) {
        b.disabled = true;
        if (b.textContent === q.right) b.classList.add("right");
        else if (b === btn) b.classList.add("wrong");
      });
      gradeFromGame(setId, q.right, ok, "recognise");

      // Wrong answers hold longer, because the correct one has to be read.
      setTimeout(function () { i++; draw(); }, ok ? 520 : 1500);
    }

    function done() {
      var xp = Game.run("cardmatch", { right: right, total: rounds.length });
      result({
        title: right + " of " + rounds.length + ".",
        lede: right === rounds.length
          ? "Every definition matched. That is the harder direction, and you had all of them."
          : "The ones you missed are in your mistake book, and Learn will bring them back.",
        pct: Math.round(right / rounds.length * 100),
        stats: [[right + "/" + rounds.length, "matched"],
                [bestStreak, "best run"]].concat(xp ? [["+" + xp, "XP"]] : []),
        back: function () { openSet(setId); },
        again: function () { startCardMatch(true); }
      });
    }

    noFoot(); progress(null);
    draw();
  }

  /* ----------------------------------------------------------- Word hunt
     Weak as a test and good as an introduction. A student who has hunted for
     "tympanic" for ninety seconds has looked at those letters harder than any
     amount of reading would have made them. */
  function startHunt(again) {
    enter("hunt:" + S.setId, "Word hunt", function () { startHunt(true); }, again);
    var setId = S.setId, cards = S.set.cards;
    var terms = weakestFirst(setId).map(function (ix) { return cards[ix][0]; });
    var size = 12;
    var hunt = GM.huntGrid(terms, size);
    var found = 0, began = performance.now(), timer = null;
    var anchor = null, cells = {};
    var v = $("#v-hunt");

    v.innerHTML = "";
    var wrap = el("div", "gm gm-hunt");
    var top = el("div", "gm-top");
    top.innerHTML = '<span class="gm-count" id="hFound">0 / ' + hunt.words.length + "</span>" +
      '<div class="gm-track"><i id="hBar" style="width:0%"></i></div>' +
      '<span class="gm-streak" id="hTime">0.0s</span>';
    wrap.appendChild(top);

    var board = el("div", "hunt-board");
    var g = el("div", "hunt-grid");
    g.style.setProperty("--n", size);
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var b = el("button", "hunt-cell");
        b.type = "button";
        b.textContent = hunt.grid[r][c];
        b.dataset.r = r; b.dataset.c = c;
        cells[r + ":" + c] = b;
        b.addEventListener("click", (function (rr, cc) {
          return function () { tap(rr, cc); };
        })(r, c));
        g.appendChild(b);
      }
    }
    board.appendChild(g);

    var list = el("div", "hunt-words");
    list.innerHTML = "<b>Find these</b>";
    var ul = el("ul");
    hunt.words.forEach(function (p, ix) {
      var li = el("li");
      li.id = "hw" + ix;
      li.innerHTML = "<span>" + esc(p.show) + "</span>";
      ul.appendChild(li);
    });
    list.appendChild(ul);
    list.appendChild(el("p", "hunt-say",
      "Tap the first letter, then the last. Words run in any direction, " +
      "including backwards and diagonally."));
    board.appendChild(list);
    wrap.appendChild(board);
    v.appendChild(wrap);

    function tap(r, c) {
      var key = r + ":" + c;
      if (!anchor) {
        anchor = [r, c];
        cells[key].classList.add("pick");
        return;
      }
      cells[anchor[0] + ":" + anchor[1]].classList.remove("pick");
      var hit = GM.huntCheck(hunt, anchor[0], anchor[1], r, c);
      if (hit) {
        hit.found = true;
        found++;
        GM.huntCells(hit).forEach(function (p) {
          cells[p[0] + ":" + p[1]].classList.add("hit");
        });
        var ix = hunt.words.indexOf(hit);
        var li = $("#hw" + ix);
        if (li) li.classList.add("got");
        $("#hFound").textContent = found + " / " + hunt.words.length;
        $("#hBar").style.width = Math.round(found / hunt.words.length * 100) + "%";
        /* Finding a word is exposure, not mastery, so it is graded at
           recognition with a hint counted against it. Overstating what a word
           search proves would poison the model that Learn depends on. */
        gradeFromGame(setId, hit.show, true, "recognise", 1);
        if (found === hunt.words.length) finish();
      } else {
        cells[key].classList.add("nope");
        setTimeout(function () { cells[key].classList.remove("nope"); }, 320);
      }
      anchor = null;
    }

    function finish() {
      clearInterval(timer);
      var secs = (performance.now() - began) / 1000;
      var xp = Game.run("hunt", { found: found });
      Game.check("hunt", { all: found === hunt.words.length });
      setTimeout(function () {
        result({
          title: "All " + found + " found.",
          lede: "You have now looked at each of those words far more closely than reading " +
                "them would have made you. That is the whole point of this one.",
          pct: 100,
          stats: [[found, "words"], [secs.toFixed(1), "seconds"]].concat(xp ? [["+" + xp, "XP"]] : []),
          back: function () { openSet(setId); },
          again: function () { startHunt(true); }
        });
      }, 420);
    }

    timer = setInterval(function () {
      var t = $("#hTime");
      if (!t) { clearInterval(timer); return; }
      t.textContent = ((performance.now() - began) / 1000).toFixed(1) + "s";
    }, 100);

    noFoot(); progress(null);
    show("hunt");
  }

  /* ------------------------------------------------------------- Hangman
     Production under partial information — the closest thing in the app to
     the moment in an exam where you can nearly remember a word. No gallows is
     drawn; what is at stake is the word. */
  function startHangman(again) {
    enter("hangman:" + S.setId, "Hangman", function () { startHangman(true); }, again);
    var setId = S.setId, cards = S.set.cards;
    var queue = weakestFirst(setId).slice(0, 5);
    var at = 0, won = 0, hinted = 0;
    var h = null;
    var v = $("#v-hangman");

    function begin() {
      if (at >= queue.length) return done();
      var card = cards[queue[at]];
      h = GM.hangman(card[0], card[1]);
      hinted = 0;
      draw();
    }

    function draw() {
      v.innerHTML = "";
      var wrap = el("div", "gm gm-hang");

      var top = el("div", "gm-top");
      top.innerHTML = '<span class="gm-count">' + (at + 1) + " / " + queue.length + "</span>" +
        '<div class="gm-track"><i style="width:' + Math.round(at / queue.length * 100) + '%"></i></div>';
      var lives = el("span", "hang-lives");
      for (var i = 0; i < GM.LIVES; i++) {
        var d = el("i", i < h.lives ? "on" : "");
        lives.appendChild(d);
      }
      lives.title = h.lives + " guesses left";
      top.appendChild(lives);
      wrap.appendChild(top);

      var card = el("section", "gm-card");
      card.innerHTML = '<span class="gm-kind">The clue</span><p class="gm-def">' +
        esc(h.def) + "</p>";
      wrap.appendChild(card);

      var word = el("div", "hang-word");
      h.answer.split("").forEach(function (ch, ix) {
        if (!/[A-Z]/.test(ch)) {
          word.appendChild(el("span", "sp", ch === " " ? "&nbsp;" : esc(ch)));
          return;
        }
        var slot = el("span", "sl" + (h.shown[ix] ? " on" : ""));
        slot.textContent = h.shown[ix] || "";
        word.appendChild(slot);
      });
      wrap.appendChild(word);

      if (h.done) {
        var end = el("div", "hang-end " + (h.won ? "won" : "lost"));
        end.innerHTML = h.won
          ? "<b>" + esc(h.answer) + "</b><p>" +
            (hinted ? "With " + hinted + (hinted === 1 ? " letter" : " letters") + " given."
                    : "Produced from the definition alone, which is the hard way.") + "</p>"
          : "<b>" + esc(h.answer) + "</b><p>Out of guesses. It goes in the mistake book, " +
            "and Learn will bring it back before long.</p>";
        var nx = el("button", "lx-btn", at + 1 >= queue.length ? "See how you did" : "Next word");
        nx.type = "button";
        nx.addEventListener("click", function () { at++; begin(); });
        end.appendChild(nx);
        wrap.appendChild(end);
      } else {
        var keys = el("div", "hang-keys");
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (ch) {
          var b = el("button", "hang-key");
          b.type = "button";
          b.textContent = ch;
          if (h.guessed[ch]) {
            b.disabled = true;
            b.classList.add(h.answer.indexOf(ch) > -1 ? "hit" : "miss");
          }
          b.addEventListener("click", function () { play(ch); });
          keys.appendChild(b);
        });
        wrap.appendChild(keys);

        var help = el("div", "hang-help");
        var give = el("button", "ln-hint");
        give.type = "button";
        give.innerHTML = svg(I.bulb, true) + "<span>Give me a letter — it costs a guess</span>";
        give.addEventListener("click", function () {
          if (GM.reveal(h)) { hinted++; settle(); draw(); }
        });
        help.appendChild(give);
        wrap.appendChild(help);
      }

      v.appendChild(wrap);
      show("hangman");
    }

    function play(ch) {
      GM.guess(h, ch);
      settle();
      draw();
    }

    /* Graded once, when the word is over. Grading per letter would make a
       long word worth more than a short one, which is not a thing about the
       student. Recall, not recognition: nothing was offered to choose from. */
    function settle() {
      if (!h.done || h.scored) return;
      h.scored = true;
      if (h.won) won++;
      gradeFromGame(setId, cards[queue[at]][0], h.won, "recall", hinted);
      Game.run("hangman", { won: h.won, lives: h.lives });
    }

    function done() {
      result({
        title: won + " of " + queue.length + ".",
        lede: won === queue.length
          ? "Every one produced from its definition with nothing to choose from. That is recall, " +
            "and it is the level most study apps never reach."
          : "Producing a term cold is the hardest thing this app asks. What you missed is worth " +
            "another look before the test.",
        pct: Math.round(won / queue.length * 100),
        stats: [[won + "/" + queue.length, "produced"]],
        back: function () { openSet(setId); },
        again: function () { startHangman(true); }
      });
    }

    /* A physical keyboard is the natural way to play this, so it works. */
    S.hangKeys = function (e) {
      if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName || "")) return;
      if (e.metaKey || e.ctrlKey || !h) return;
      if (h.done && e.key === "Enter") { at++; begin(); return; }
      if (/^[a-zA-Z]$/.test(e.key)) play(e.key.toUpperCase());
    };

    noFoot(); progress(null);
    begin();
  }

  /* ------------------------------------------------------------------ Test
     Every question on one page, answered in any order, graded once — the
     point of a test rather than a drill. */
  function startTest(again) {
    enter("test:" + S.setId, "Test", function () { startTest(true); }, again);
    var cards = S.set.cards;
    var n = Math.min(10, cards.length);
    var pick = shuffle(cards.map(function (_, i) { return i; })).slice(0, n);
    var qs = pick.map(function (ix, k) {
      var kind = k % 5 === 4 ? "tf" : k % 2 === 0 ? "choice" : "written";
      var c = cards[ix];
      if (kind === "choice") {
        var pool = cards.map(function (_, i) { return i; }).filter(function (i) { return i !== ix; });
        var opts = shuffle([c[0]].concat(shuffle(pool).slice(0, 3).map(function (i) { return cards[i][0]; })));
        return { kind: kind, ix: ix, q: c[1], opts: opts, right: c[0] };
      }
      if (kind === "tf") {
        var lie = Math.random() < 0.5;
        var other = cards[shuffle(cards.map(function (_, i) { return i; })
                    .filter(function (i) { return i !== ix; }))[0]];
        return { kind: kind, ix: ix, q: "<b>" + esc(c[0]) + "</b> — " + esc(lie ? other[1] : c[1]),
                 right: lie ? "False" : "True" };
      }
      return { kind: kind, ix: ix, q: c[1], right: c[0] };
    });
    var answers = {};

    var v = $("#v-test");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", esc(S.set.t)));
    v.appendChild(el("h1", "lx-h1", "Test"));
    v.appendChild(el("p", "lx-lede", n + " questions — written, multiple choice and true or false. " +
      "Answer them in any order; nothing is marked until you submit."));

    var form = el("div");
    form.style.marginTop = "10px";
    qs.forEach(function (q, i) {
      var box = el("div", "lx-q");
      box.innerHTML = '<p class="qn">Question ' + (i + 1) + " of " + n + " · " +
        (q.kind === "written" ? "Written" : q.kind === "tf" ? "True or false" : "Multiple choice") +
        '</p><p class="qt">' + (q.kind === "tf" ? q.q : esc(q.q)) + "</p>";

      if (q.kind === "written") {
        var w = el("div", "lx-numwrap");
        var inp = el("input", "lx-num");
        inp.type = "text"; inp.autocomplete = "off";
        inp.setAttribute("aria-label", "Question " + (i + 1));
        inp.placeholder = "The term";
        inp.addEventListener("input", function () { answers[i] = inp.value.trim(); count(); });
        w.appendChild(inp);
        box.appendChild(w);
      } else {
        var opts = q.kind === "tf" ? ["True", "False"] : q.opts;
        var wrap = el("div", q.kind === "tf" ? "lx-tf" : "lx-opts");
        opts.forEach(function (o, j) {
          var b = el("button", "lx-opt");
          b.type = "button";
          b.setAttribute("aria-pressed", "false");
          b.innerHTML = '<span class="lx-key">' + (q.kind === "tf" ? "TF"[j] : "ABCD"[j]) +
                        "</span><span>" + esc(o) + "</span>";
          b.addEventListener("click", function () {
            answers[i] = o;
            [].forEach.call(wrap.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); });
            count();
          });
          wrap.appendChild(b);
        });
        box.appendChild(wrap);
      }
      form.appendChild(box);
    });
    v.appendChild(form);

    function count() {
      var done = Object.keys(answers).filter(function (k) { return answers[k]; }).length;
      foot(done + " of " + n + " answered", "Submit test", done > 0, grade);
    }

    function grade() {
      var right = 0;
      var review = qs.map(function (q, i) {
        var a = answers[i] || "";
        var ok = norm(a) === norm(q.right);
        if (ok) right++;
        return { q: q, a: a, ok: ok };
      });
      var pct = Math.round(right / n * 100);
      var st = setState(S.setId);
      review.forEach(function (r) {
        if (r.ok) st.level[r.q.ix] = Math.max(st.level[r.q.ix] || 0, 2);
        else {
          var card = cards[r.q.ix];
          var m = S.mistakes.filter(function (x) { return x.key === S.setId + ":" + r.q.ix; })[0];
          slip("term", S.setId + ":" + r.q.ix, card[0], card[1]);
          (m || S.mistakes[S.mistakes.length - 1]).card = card;
        }
      });
      if (S.course && S.unitIx) raise(S.course, S.unitIx, "a", pct);

      result({
        title: pct + "% — " + right + " of " + n + ".",
        lede: pct === 100 ? "Every one. Nothing left to review on this set."
                          : "The ones below are worth another pass.",
        pct: pct,
        stats: [[right, "correct"], [n - right, "missed"], [n, "questions"]],
        back: function () { openSet(S.setId); },
        again: startTest,
        review: review.map(function (r) {
          return { ok: r.ok, term: cards[r.q.ix][0], yours: r.a,
                   def: r.q.kind === "tf" ? cards[r.q.ix][1] : r.q.q };
        })
      });
    }

    count();
    show("test");
  }


  /* ============================================================ Read together
     The surface over collab.js. Three things, and the discipline is in what
     is left out: no video, no cursors chasing each other, no chat sitting
     where the text should be. Two people, one passage, and the ability to
     point at it.

       PRESENCE  who is here and which section they are in
       MARGIN    their annotations arriving beside yours, attributed, and
                 yours theirs — kept apart until someone chooses to keep one
       FOLLOW    your page moving because theirs did

     Reach is stated plainly in the panel rather than implied by the design.
     A room joins every tab of this site in this browser today; a relay makes
     it join two laptops, and `Room.transport` in collab.js is where that
     goes. */
  var Room = (function () {
    var R = window.OPLO_ROOM;
    var room = null, code = null, panelEl = null;

    function live() { return !!(room && room.id); }
    function count() { return room ? room.peerCount() : 0; }

    function me() {
      return S.me ? { id: S.me.id, name: S.me.name, first: S.me.first,
                      initials: S.me.initials, hue: S.me.hue || "#6e6e73",
                      role: S.me.role } : null;
    }

    function make() {
      if (room || !R || !S.me) return room;
      room = new R.Room(me());
      room.on("change", function () { paintPresence(); if (panelEl) fillPanel(); });
      room.on("joined", function (who) {
        toast(who.first + " joined the room.");
        // Everything already on this page, so they arrive to a marked-up copy
        // rather than a blank one.
        Ann.here().forEach(function (m) { room.share(m); });
      });
      room.on("mark", function (e) { Ann.receive(e.by, e.mark); });
      room.on("unmark", function (e) { Ann.retract(e.id); });
      room.on("point", function (e) {
        var sec = readSec();
        if (!sec || sec.n !== e.at.sec) { toast(e.by.first + " pointed at something in " + e.at.sec + "."); return; }
        toast(e.by.first + " is pointing at this.");
        Ann.flash(e.at.anchor);
      });
      room.on("lead", function (at) { followTo(at); });
      room.on("follow", function () { paintFollow(); });
      return room;
    }

    /* Following: their section, then their scroll. The section change has to
       finish rendering before the scroll means anything, hence the wait. */
    var settling = false;
    function followTo(at) {
      if (settling) return;
      // Somebody being followed may be in another unit; switch to it first.
      var hit = at.sec ? findSection(at.sec) : null;
      if (hit && hit.reader !== RU) useReader(hit.reader);
      var U = RU.sections;
      var here = U[S.readIx];
      if (at.sec && (!here || here.n !== at.sec)) {
        var ix = -1;
        U.forEach(function (x, k) { if (x.n === at.sec) ix = k; });
        if (ix > -1) {
          settling = true;
          openRead(ix);
          setTimeout(function () {
            if (at.y != null) window.scrollTo({ top: at.y, behavior: "auto" });
            settling = false;
          }, 90);
          return;
        }
      }
      if (at.y != null && Math.abs(window.scrollY - at.y) > 60) {
        window.scrollTo({ top: at.y, behavior: "smooth" });
      }
    }

    /* --------------------------------------------------------- The header */
    function paintPresence() {
      var box = $("#presence");
      if (!box) return;
      var list = room ? room.roster() : [];
      box.innerHTML = "";
      box.hidden = false;

      var btn = el("button", "pr-open" + (live() ? " on" : ""));
      btn.type = "button";
      btn.title = live()
        ? (list.length ? list.length + " reading with you" : "Room open — nobody else here yet")
        : "Read together";
      btn.setAttribute("aria-label", btn.title);
      btn.innerHTML = svg(I.people, true);
      if (list.length) {
        var stack = el("span", "pr-stack");
        list.slice(0, 3).forEach(function (p) {
          var a = el("span", "pr-av");
          a.style.background = (p.who && p.who.hue) || "#6e6e73";
          a.textContent = p.who ? p.who.initials : "?";
          a.title = p.who ? p.who.name : "";
          stack.appendChild(a);
        });
        btn.appendChild(stack);
      } else if (live()) {
        btn.appendChild(el("span", "pr-dot"));
      }
      btn.addEventListener("click", panel);
      box.appendChild(btn);

      var c = $("#roomCount");
      if (c) c.textContent = list.length || "";
    }

    function paintFollow() {
      var bar = $("#followBar");
      if (!bar) return;
      var who = room && room.following
        ? (room.peers[room.following] || {}).who : null;
      if (!who) { bar.hidden = true; return; }
      bar.hidden = false;
      bar.innerHTML = "";
      var av = el("span", "fb-av");
      av.style.background = who.hue || "#6e6e73";
      av.textContent = who.initials;
      bar.appendChild(av);
      bar.appendChild(el("span", "fb-say", "Following <b>" + esc(who.name) +
        "</b> — your page moves when theirs does"));
      var stop = el("button", "fb-stop", "Stop");
      stop.type = "button";
      stop.addEventListener("click", function () { room.follow(null); });
      bar.appendChild(stop);
    }

    /* ---------------------------------------------------------- The panel */
    function panel() {
      make();
      if (panelEl) { close(); return; }
      panelEl = el("div", "rm");
      panelEl.setAttribute("role", "dialog");
      panelEl.setAttribute("aria-label", "Read together");
      document.body.appendChild(panelEl);
      fillPanel();
      setTimeout(function () { document.addEventListener("mousedown", away); }, 0);
      document.addEventListener("keydown", esckey);
    }
    function close() {
      if (!panelEl) return;
      panelEl.remove();
      panelEl = null;
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esckey);
    }
    function away(e) {
      if (panelEl && !panelEl.contains(e.target) && !e.target.closest(".pr-open") &&
          !e.target.closest("#roomOpen")) close();
    }
    function esckey(e) { if (e.key === "Escape") close(); }

    function fillPanel() {
      if (!panelEl) return;
      panelEl.innerHTML = "";

      var head = el("header", "rm-head");
      head.innerHTML = "<b>Read together</b>";
      var x = el("button", "rm-x");
      x.type = "button";
      x.setAttribute("aria-label", "Close");
      x.innerHTML = svg(I.close, true);
      x.addEventListener("click", close);
      head.appendChild(x);
      panelEl.appendChild(head);

      if (!live()) {
        panelEl.appendChild(el("p", "rm-say",
          "Open a room and whoever joins reads the same section beside you — their " +
          "marks land in your margin, yours in theirs, and either of you can point at a line."));
        var start = el("button", "rm-go", "Open a room");
        start.type = "button";
        start.addEventListener("click", function () {
          code = code || Math.random().toString(36).slice(2, 7);
          make().open("oplo-" + code);
          var sec = readSec();
          if (sec) room.where(sec.n, window.scrollY);
          fillPanel();
          paintPresence();
        });
        panelEl.appendChild(start);
      } else {
        /* Who is here. */
        var list = room.roster();
        var who = el("div", "rm-here");
        var mineRow = person(me(), "You", null);
        mineRow.classList.add("me");
        who.appendChild(mineRow);
        list.forEach(function (p) {
          who.appendChild(person(p.who, p.sec ? "Reading " + p.sec : "Here", p));
        });
        if (!list.length) {
          who.appendChild(el("p", "rm-none",
            "Nobody else yet. Send them the link below — it opens Learn straight into this room."));
        }
        panelEl.appendChild(who);

        /* The link. */
        var link = location.origin + location.pathname + "?room=" + code;
        var lk = el("div", "rm-link");
        var inp = el("input");
        inp.type = "text";
        inp.readOnly = true;
        inp.value = link;
        inp.setAttribute("aria-label", "Room link");
        inp.addEventListener("focus", function () { inp.select(); });
        lk.appendChild(inp);
        var cp = el("button", "rm-copy", "Copy");
        cp.type = "button";
        cp.addEventListener("click", function () { copy(link); toast("Room link copied."); });
        lk.appendChild(cp);
        panelEl.appendChild(lk);

        var out = el("button", "rm-leave", "Leave the room");
        out.type = "button";
        out.addEventListener("click", function () {
          room.leave();
          Ann.forget();
          fillPanel(); paintPresence(); paintFollow();
        });
        panelEl.appendChild(out);
      }

      /* ------------------------------------------------------ OploContacts */
      var dir = el("div", "rm-dir");
      dir.appendChild(el("h4", null, "OploContacts"));
      var contacts = (D.CONTACTS ? D.CONTACTS() : []).filter(function (c) {
        return !S.me || c.id !== S.me.id;
      });
      if (!contacts.length) dir.appendChild(el("p", "rm-none", "No one else in your directory yet."));
      contacts.forEach(function (c) {
        var inRoom = live() && room.roster().some(function (p) { return p.id === c.id; });
        var r = el("div", "rm-person");
        var av = el("span", "rm-av");
        av.style.background = c.hue || "#6e6e73";
        av.textContent = c.initials;
        r.appendChild(av);
        r.appendChild(el("div", "rm-nm", "<b>" + esc(c.name) + "</b><span>" +
          esc(c.title || c.role || "") + "</span>"));
        var b = el("button", "rm-inv");
        b.type = "button";
        if (inRoom) { b.textContent = "Here"; b.disabled = true; b.classList.add("in"); }
        else {
          b.textContent = "Invite";
          b.addEventListener("click", function () {
            if (!live()) {
              code = code || Math.random().toString(36).slice(2, 7);
              make().open("oplo-" + code);
              var sec = readSec();
              if (sec) room.where(sec.n, window.scrollY);
            }
            copy(location.origin + location.pathname + "?room=" + code);
            toast("Room link copied — send it to " + c.first + ".");
            fillPanel(); paintPresence();
          });
        }
        r.appendChild(b);
        dir.appendChild(r);
      });
      panelEl.appendChild(dir);

      panelEl.appendChild(el("p", "rm-fine",
        "A room reaches every tab of Oplo Learn in this browser. Reaching a second " +
        "machine needs a relay, and this page is served as static files — there is no " +
        "server here to be one. The transport is a single object in <code>collab.js</code>, " +
        "so that is a swap rather than a rebuild."));
    }

    function person(who, sub, peer) {
      var r = el("div", "rm-person");
      var av = el("span", "rm-av");
      av.style.background = (who && who.hue) || "#6e6e73";
      av.textContent = who ? who.initials : "?";
      r.appendChild(av);
      r.appendChild(el("div", "rm-nm", "<b>" + esc(who ? who.name : "Someone") +
        "</b><span>" + esc(sub || "") + "</span>"));
      if (peer) {
        var f = el("button", "rm-follow");
        f.type = "button";
        var on = room.following === peer.id;
        f.textContent = on ? "Following" : "Follow";
        f.setAttribute("aria-pressed", String(on));
        f.addEventListener("click", function () {
          room.follow(on ? null : peer.id);
          fillPanel(); paintFollow();
        });
        r.appendChild(f);
        if (peer.following) {
          var tag = el("span", "rm-tag", "following you");
          r.appendChild(tag);
        }
      }
      return r;
    }

    /* ----------------------------------------------------------- Outbound */
    function here(sec) { if (live()) room.where(sec, window.scrollY); }
    function scrolled(y) {
      if (live() && !room.following) {
        var sec = readSec();
        room.where(sec ? sec.n : null, y);
      }
    }
    function shareMark(m) { if (live()) room.share(m); }
    function retractMark(id) { if (live()) room.retract(id); }
    function point(at) { if (live()) room.point(at); }

    /* A link with ?room= walks straight in. */
    function fromLink() {
      var m = /[?&]room=([a-z0-9]+)/i.exec(location.search);
      if (!m || !S.me) return;
      code = m[1];
      make().open("oplo-" + code);
      paintPresence();
      toast("You are in a shared reading room.");
    }

    function reset() {
      if (room) room.leave();
      room = null; code = null;
      close();
      var box = $("#presence");
      if (box) { box.innerHTML = ""; box.hidden = true; }
      var bar = $("#followBar");
      if (bar) bar.hidden = true;
    }

    return { panel: panel, live: live, count: count, here: here, scrolled: scrolled,
             shareMark: shareMark, retractMark: retractMark, point: point,
             fromLink: fromLink, presence: paintPresence, reset: reset };
  })();

  /* ================================================================= Read
     A section of the unit, set as an article, in three columns.

       LEFT     where you are in the unit, and where you can go
       CENTRE   the text, at a measure you can actually read
       RIGHT    your margin — every mark you made, beside the line you made it on

     The bottom right corner is left empty on purpose. That is the tutor's,
     and a panel that opens over your own notes is a panel you close. */
  var A = window.OPLO_ANNOTATE;

  /* -------------------------------------------------------------- Readers
     Every unit written as a reader, keyed by course and unit number. The
     reader used to be Unit 5 and nothing else — a dozen places assumed it —
     so adding a second unit meant copying the reader. Now a unit is one entry
     here and one content file, and the reader, the notebook, the margin, the
     room and the tutor all follow whichever unit is open.

     `doc` keys the annotation store, so each unit keeps its own notebook.
     `set` is the study set the last section hands on to. */
  var READERS = {
    "media:5": { key: "media:5", course: "media", courseTitle: "Media Arts", unit: 5,
                 title: "Waves and Sound", sections: window.OPLO_UNIT5 || [],
                 doc: "media-u5", set: "media-5" },
    "media:6": { key: "media:6", course: "media", courseTitle: "Media Arts", unit: 6,
                 title: "Intro to Photography", sections: window.OPLO_UNIT6 || [],
                 doc: "media-u6", set: "media-6" }
  };
  var RU = READERS["media:5"];        // the unit being read

  /* Kept for the one screen that is still Unit 5 only: an administrator's
     read-only view of a student's notebook, which says so in its heading. */
  var U5 = READERS["media:5"].sections;

  /* What a quotation from this unit is a quotation from. The same object is
     handed to the annotation layer, so switching units updates it in place. */
  var SOURCE = {
    title: RU.title,
    container: RU.courseTitle + ", Unit " + RU.unit,
    author: "Excel High School",
    publisher: "Excel High School",
    year: "2026"
  };
  var DOC = RU.doc;

  function readerFor(courseId, n) {
    var r = READERS[courseId + ":" + n];
    return r && r.sections && r.sections.length ? r : null;
  }
  function readSec() { return RU.sections[S.readIx] || null; }
  function findSection(n) {
    for (var k in READERS) {
      var list = READERS[k].sections;
      for (var i = 0; i < list.length; i++) {
        if (list[i].n === n) return { reader: READERS[k], ix: i };
      }
    }
    return null;
  }
  /* Sections checked in one unit. readDone is keyed by section number, and
     "5.3" and "6.3" never collide — but counting every key would let finishing
     Unit 5 show Unit 6 as half done. */
  function doneIn(r) {
    return r.sections.filter(function (x) { return S.readDone[x.n]; }).length;
  }
  function useReader(r) {
    if (!r || r === RU) return;
    RU = r;
    DOC = r.doc;
    SOURCE.title = r.title;
    SOURCE.container = r.courseTitle + ", Unit " + r.unit;
    // The annotation store is bound to one unit's document; dropping it makes
    // the next read open the right unit's notebook.
    if (typeof Ann !== "undefined" && Ann && Ann.reset) Ann.reset();
  }

  function sectionAt(i) { return RU.sections[i]; }
  function secByN(n) { return RU.sections.filter(function (x) { return x.n === n; })[0] || null; }

  /* ========================================================== Annotation
     The controller for everything a reader leaves on the page: the selection
     toolbar, the note editor, the margin, and the job of putting all of it
     back where it was after a render. The mechanics — anchoring, painting,
     storage, citation — are in annotate.js; this is the surface. */
  var Ann = (function () {
    var store = null;         // this reader's marks, persisted
    var theirs = [];          // marks arriving from a room, in memory only
    var body = null, sec = null, marginEl = null, artEl = null;
    var filter = 0;           // 0 = every pass
    var pending = null;       // a live selection waiting for a decision
    var open = null;          // the mark whose editor is showing

    function shop() {
      if (!store) store = new A.Store(S.me ? S.me.id : "anon", DOC);
      return store;
    }
    function reset() { store = null; theirs = []; }

    function mine() { return shop().all(); }
    function here() { return shop().inSection(sec); }
    function theirsHere() { return theirs.filter(function (m) { return m.sec === sec; }); }

    /* ------------------------------------------------------- The toolbar
       Built rather than written into the page, so the taxonomy has exactly
       one definition and adding a pass is a line in annotate.js. */
    function buildTools() {
      var t = $("#rdTools");
      if (t.dataset.built) return t;
      t.dataset.built = "1";
      A.PASSES.forEach(function (p) {
        var b = el("button");
        b.type = "button";
        b.dataset.pass = p.n;
        b.title = p.name + " — " + p.k + ". " + p.what;
        b.innerHTML = '<span class="sw" style="background:' + p.hue + '"></span>' + esc(p.short);
        b.addEventListener("click", function () { commit(p.n); });
        t.appendChild(b);
      });
      t.appendChild(el("span", "sep"));
      [["note", "Annotate — N", I.pen],
       ["copy", "Copy with citation — C", I.copy],
       ["point", "Point at this for the room — P", I.point]].forEach(function (a) {
        var b = el("button", "act");
        b.type = "button";
        b.dataset.act = a[0];
        b.title = a[1];
        b.setAttribute("aria-label", a[1]);
        b.innerHTML = svg(a[2], true);
        b.addEventListener("click", function () { act(a[0]); });
        t.appendChild(b);
      });
      return t;
    }

    function place(node, rect, below) {
      var w = node.offsetWidth || 320;
      var x = rect.left + rect.width / 2 + window.scrollX;
      x = Math.max(w / 2 + 12, Math.min(x, window.innerWidth - w / 2 - 12));
      node.style.left = x + "px";
      node.style.top = (below ? rect.bottom + window.scrollY + 8
                              : rect.top + window.scrollY - 8) + "px";
      node.classList.toggle("below", !!below);
    }

    function hideAll() {
      $("#rdTools").classList.remove("on");
      $("#rdPop").classList.remove("on");
      open = null;
      unfocus();
    }
    S.hideAnn = hideAll;

    function grab() {
      var s = window.getSelection();
      if (!s || s.isCollapsed || !s.rangeCount) return null;
      var r = s.getRangeAt(0);
      if (!body || !body.contains(r.commonAncestorContainer)) return null;
      if (!String(s).trim()) return null;
      return r.cloneRange();
    }

    /* A selection becomes a mark. The anchor is taken before anything is
       painted — painting splits text nodes, and an anchor measured after that
       would be measuring a document that no longer exists. */
    function commit(passN, then) {
      var r = pending || grab();
      if (!r) return null;
      var a = A.anchor(body, r);
      if (!a) { hideAll(); return null; }
      var m = shop().add({
        sec: sec, pass: passN,
        text: a.exact.replace(/\s+/g, " ").trim(),
        anchor: a,
        by: null
      });
      A.paint(body, r, m);
      window.getSelection().removeAllRanges();
      pending = null;
      hideAll();
      drawMargin();
      if (Room.live()) Room.shareMark(m);
      if (then) then(m);
      return m;
    }

    function act(kind) {
      var r = pending || grab();
      if (!r) return;
      if (kind === "note") {
        commit(A.PASSES[0].n, function (m) {
          var node = body.querySelector('mark[data-id="' + m.id + '"]');
          if (node) editor(node, m.id);
        });
        return;
      }
      if (kind === "copy") {
        var said = String(r).trim().replace(/\s+/g, " ");
        copy(A.quoted({ text: said, sec: sec }, SOURCE, S.citeStyle || "mla"));
        window.getSelection().removeAllRanges();
        pending = null; hideAll();
        toast("Copied with the citation.");
        return;
      }
      if (kind === "point") {
        if (!Room.live()) { toast("Nobody is in the room to point for."); return; }
        var a = A.anchor(body, r);
        if (a) { Room.point({ sec: sec, anchor: a }); toast("Pointed at it."); }
        window.getSelection().removeAllRanges();
        pending = null; hideAll();
      }
    }

    /* --------------------------------------------------------- The editor
       Six passes, a note, tags, and — the part that makes a notebook worth
       re-reading — a link to another mark. An objection floating on its own
       is a mood; an objection attached to the claim it is against is an
       argument. */
    function editor(node, id) {
      var m = shop().byId(id);
      if (!m) return;
      open = id;
      focusMark(id);

      var pop = $("#rdPop");
      pop.innerHTML = "";
      var p = A.pass(m.pass);

      var head = el("div", "rd-pop-head");
      head.innerHTML = '<span class="cite">' + esc(sec) + " · " + esc(secByN(sec) ? secByN(sec).t : "") +
        "</span>";
      var x = el("button", "rd-pop-x");
      x.type = "button";
      x.setAttribute("aria-label", "Close");
      x.innerHTML = svg(I.close, true);
      x.addEventListener("click", hideAll);
      head.appendChild(x);
      pop.appendChild(head);

      pop.appendChild(el("blockquote", "said", esc(m.text)));

      var kinds = el("div", "kinds");
      A.PASSES.forEach(function (q) {
        var b = el("button");
        b.type = "button";
        b.title = q.what;
        b.setAttribute("aria-pressed", String(q.n === m.pass));
        b.innerHTML = '<span class="sw" style="background:' + q.hue + '"></span>' + esc(q.short);
        b.addEventListener("click", function () {
          shop().update(id, { pass: q.n });
          repaintClass(id);
          [].forEach.call(kinds.children, function (o) {
            o.setAttribute("aria-pressed", String(o === b));
          });
          prompt.textContent = q.ask;
          ta.placeholder = q.ask;
          drawMargin();
          if (Room.live()) Room.shareMark(shop().byId(id));
        });
        kinds.appendChild(b);
      });
      pop.appendChild(kinds);

      var prompt = el("p", "rd-pop-ask", esc(p.ask));
      pop.appendChild(prompt);

      var ta = el("textarea");
      ta.placeholder = p.ask;
      ta.setAttribute("aria-label", "Your note");
      ta.value = m.note || "";
      pop.appendChild(ta);

      var tags = el("input", "tags");
      tags.type = "text";
      tags.placeholder = "Tags, separated by commas";
      tags.setAttribute("aria-label", "Tags");
      tags.value = (m.tags || []).join(", ");
      pop.appendChild(tags);

      /* Link to another mark in this unit. Claims first, because a claim is
         what most things want to be attached to. */
      var others = mine().filter(function (o) { return o.id !== id; })
        .sort(function (a2, b2) { return (a2.pass === 2 ? -1 : 0) - (b2.pass === 2 ? -1 : 0); });
      if (others.length) {
        var link = el("div", "rd-pop-link");
        var sel = el("select");
        sel.setAttribute("aria-label", "Link this to another mark");
        sel.innerHTML = '<option value="">Link this to…</option>' + others.map(function (o) {
          var on = (m.links || []).indexOf(o.id) > -1;
          return '<option value="' + o.id + '"' + (on ? " selected" : "") + ">" +
            esc(A.pass(o.pass).name + " · " + o.sec + " · " + trim(o.text, 42)) + "</option>";
        }).join("");
        sel.addEventListener("change", function () {
          var v = sel.value;
          if (!v) return;
          var links = (shop().byId(id).links || []).slice();
          if (links.indexOf(v) < 0) links.push(v);
          shop().update(id, { links: links });
          drawLinks();
          drawMargin();
        });
        link.appendChild(sel);
        var linked = el("div", "rd-pop-linked");
        link.appendChild(linked);
        pop.appendChild(link);

        var drawLinks = function () {
          var cur = shop().byId(id);
          linked.innerHTML = "";
          (cur.links || []).forEach(function (lid) {
            var o = shop().byId(lid);
            if (!o) return;
            var chip = el("span", "lk");
            chip.innerHTML = '<i style="background:' + A.pass(o.pass).hue + '"></i>' +
              esc(trim(o.text, 30));
            var rm = el("button");
            rm.type = "button";
            rm.setAttribute("aria-label", "Unlink");
            rm.textContent = "×";
            rm.addEventListener("click", function () {
              shop().update(id, { links: cur.links.filter(function (l) { return l !== lid; }) });
              drawLinks(); drawMargin();
            });
            chip.appendChild(rm);
            linked.appendChild(chip);
          });
        };
        drawLinks();
      }

      var row = el("div", "row");
      var save = el("button", "save", "Save");
      save.type = "button";
      save.addEventListener("click", function () {
        shop().update(id, {
          note: ta.value.trim(),
          tags: tags.value.split(",").map(function (t) { return t.trim(); })
                .filter(Boolean).slice(0, 8)
        });
        repaintClass(id);
        drawMargin();
        if (Room.live()) Room.shareMark(shop().byId(id));
        hideAll();
      });
      var cp = el("button", "quote");
      cp.type = "button";
      cp.title = "Copy the quotation with its citation";
      cp.innerHTML = svg(I.copy, true);
      cp.addEventListener("click", function () {
        copy(A.quoted(shop().byId(id), SOURCE, S.citeStyle || "mla"));
        toast("Copied in " + (S.citeStyle || "mla").toUpperCase() + ".");
      });
      var del = el("button", "del");
      del.type = "button";
      del.title = "Remove this mark";
      del.innerHTML = svg(I.trash, true);
      del.addEventListener("click", function () { remove(id); hideAll(); });
      row.appendChild(save); row.appendChild(cp); row.appendChild(del);
      pop.appendChild(row);

      $("#rdTools").classList.remove("on");
      pop.classList.add("on");
      place(pop, node.getBoundingClientRect(), true);
      setTimeout(function () { ta.focus(); }, 40);
    }
    S.openNote = editor;

    function repaintClass(id) {
      var m = shop().byId(id);
      if (!m || !body) return;
      [].forEach.call(body.querySelectorAll('mark[data-id="' + id + '"]'), function (n) {
        n.className = A.className(m);
        n.dataset.pass = m.pass;
      });
    }

    function remove(id) {
      A.unpaint(body, id);
      shop().remove(id);
      drawMargin();
      if (Room.live()) Room.retractMark(id);
    }

    function focusMark(id) {
      unfocus();
      if (!body) return;
      [].forEach.call(body.querySelectorAll('mark[data-id="' + id + '"]'), function (n) {
        n.classList.add("focus");
      });
      var card = marginEl && marginEl.querySelector('[data-for="' + id + '"]');
      if (card) card.classList.add("focus");
    }
    function unfocus() {
      if (body) [].forEach.call(body.querySelectorAll("mark.focus"), function (n) {
        n.classList.remove("focus");
      });
      if (marginEl) [].forEach.call(marginEl.querySelectorAll(".focus"), function (n) {
        n.classList.remove("focus");
      });
    }

    /* ---------------------------------------------------------- The margin
       Every mark beside the line it was made on. Cards are placed at the top
       of their highlight and then pushed down until they stop overlapping,
       which is what keeps the column readable when three marks land in one
       paragraph. */
    function card(m, isTheirs) {
      var p = A.pass(m.pass);
      var c = el("article", "mg" + (isTheirs ? " theirs" : ""));
      c.dataset.for = m.id;
      c.style.setProperty("--hue", p.hue);

      var top = el("header", "mg-top");
      top.innerHTML = '<span class="k">' + esc(p.name) + "</span>";
      if (isTheirs && m.by) {
        var av = el("span", "mg-who");
        av.style.background = m.by.hue || "#6e6e73";
        av.textContent = m.by.initials;
        av.title = m.by.name;
        top.appendChild(av);
      }
      c.appendChild(top);

      c.appendChild(el("q", null, esc(trim(m.text, 120))));
      if (m.note) c.appendChild(el("p", "mg-note", esc(m.note)));
      if (m.tags && m.tags.length) {
        c.appendChild(el("p", "mg-tags", m.tags.map(function (t) {
          return "<em>" + esc(t) + "</em>";
        }).join("")));
      }
      if (m.links && m.links.length) {
        var n = m.links.filter(function (l) { return shop().byId(l); }).length;
        if (n) c.appendChild(el("p", "mg-link", svg(I.link, true) +
          "<span>" + n + (n === 1 ? " link" : " links") + "</span>"));
      }

      if (isTheirs) {
        var keep = el("button", "mg-keep", "Keep this");
        keep.type = "button";
        keep.addEventListener("click", function (e) {
          e.stopPropagation();
          var copyOf = JSON.parse(JSON.stringify(m));
          delete copyOf.id; copyOf.by = null;
          copyOf.note = (copyOf.note ? copyOf.note + " " : "") +
            "(from " + (m.by ? m.by.first || m.by.name : "the room") + ")";
          var made = shop().add(copyOf);
          var r = A.locate(body, made.anchor);
          if (r) A.paint(body, r, made);
          drawMargin();
          toast("Kept in your notebook.");
        });
        c.appendChild(keep);
      }

      c.addEventListener("mouseenter", function () { focusMark(m.id); });
      c.addEventListener("mouseleave", function () { if (!open) unfocus(); });
      c.addEventListener("click", function () {
        var node = body.querySelector('mark[data-id="' + m.id + '"]');
        if (!node) return;
        node.scrollIntoView({ block: "center", behavior: "smooth" });
        if (!isTheirs) setTimeout(function () { editor(node, m.id); }, 340);
      });
      return c;
    }

    function drawMargin() {
      if (!marginEl) return;
      var list = here().concat(theirsHere().map(function (m) { m._t = true; return m; }));
      list = list.filter(function (m) { return !filter || m.pass === filter; });

      var head = marginEl.querySelector(".mg-head");
      var wrap = marginEl.querySelector(".mg-wrap");
      wrap.innerHTML = "";

      var all = here();
      head.innerHTML = "";
      var h = el("div", "mg-head-in");
      h.innerHTML = "<b>Margin</b><span>" + all.length +
        (all.length === 1 ? " mark" : " marks") + " here</span>";
      head.appendChild(h);
      if (all.length) {
        var nb = el("button", "mg-open");
        nb.type = "button";
        nb.textContent = "Notebook";
        nb.addEventListener("click", function () { openNotebook(); });
        head.appendChild(nb);
      }

      if (!list.length) {
        var e = el("div", "mg-empty");
        e.innerHTML = filter
          ? "<p>No " + esc(A.pass(filter).name.toLowerCase()) + "s in this section.</p>"
          : "<p>Select any sentence to mark it.</p><p class=\"k\">1–6 pick the pass · N annotates · C copies with the citation</p>";
        wrap.appendChild(e);
        return;
      }

      // Position: each card at its highlight, then pushed clear of the one above.
      var artTop = artEl.getBoundingClientRect().top + window.scrollY;
      var placed = list.map(function (m) {
        var node = body.querySelector('mark[data-id="' + m.id + '"]');
        var y = node ? node.getBoundingClientRect().top + window.scrollY - artTop : 1e6;
        return { m: m, y: y, orphan: !node };
      }).sort(function (a2, b2) { return a2.y - b2.y; });

      var floor = 0;
      placed.forEach(function (x) {
        var c = card(x.m, !!x.m._t);
        if (x.orphan) {
          c.classList.add("orphan");
          c.title = "This passage has moved or changed. The note is kept.";
        }
        wrap.appendChild(c);
        var top = Math.max(x.orphan ? floor : x.y, floor);
        c.style.top = top + "px";
        floor = top + c.offsetHeight + 10;
      });
      wrap.style.height = floor + "px";
    }

    /* ------------------------------------------------------------- Wiring */
    function arm(newBody, newSec, art, margin) {
      body = newBody; sec = newSec; artEl = art; marginEl = margin;
      buildTools();

      A.restore(body, here());
      theirsHere().forEach(function (m) {
        var r = A.locate(body, m.anchor);
        if (r) A.paint(body, r, m);
      });

      body.addEventListener("mouseup", function () {
        setTimeout(function () {
          var r = grab();
          if (!r) { if (!open) hideAll(); return; }
          pending = r;
          open = null;
          $("#rdPop").classList.remove("on");
          place($("#rdTools"), r.getBoundingClientRect());
          $("#rdTools").classList.add("on");
        }, 10);
      });

      body.addEventListener("click", function (e) {
        var n = e.target.closest("mark.hl");
        if (!n) return;
        e.stopPropagation();
        $("#rdTools").classList.remove("on");
        var m = shop().byId(n.dataset.id);
        if (m) editor(n, n.dataset.id);
        else focusMark(n.dataset.id);      // someone else's — look, do not edit
      });

      // 1-6 pick a pass, N annotates, C copies, P points.
      S.readKeys = function (e) {
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || "") || e.metaKey || e.ctrlKey) return;
        if (e.key === "Escape") { hideAll(); return; }
        var r = pending || grab();
        if (!r) return;
        var k = e.key.toLowerCase();
        var p = A.PASSES.filter(function (x) { return x.k === k; })[0];
        if (p) { e.preventDefault(); pending = r; commit(p.n); }
        else if (k === "n" || k === "c" || k === "p") {
          e.preventDefault(); pending = r; act(k === "n" ? "note" : k === "c" ? "copy" : "point");
        }
      };

      if (S.annAway) document.removeEventListener("mousedown", S.annAway);
      S.annAway = function (e) {
        if ($("#rdTools").contains(e.target) || $("#rdPop").contains(e.target)) return;
        if (e.target.closest("mark.hl") || e.target.closest(".mg")) return;
        hideAll();
      };
      document.addEventListener("mousedown", S.annAway);

      drawMargin();
    }

    /* A mark arriving from the room. Kept apart from this reader's own so a
       shared session never quietly rewrites someone's notebook. */
    function receive(who, m) {
      m = JSON.parse(JSON.stringify(m));
      m.by = who;
      var was = theirs.filter(function (x) { return x.id === m.id; })[0];
      if (was) {
        A.unpaint(body, m.id);
        theirs = theirs.filter(function (x) { return x.id !== m.id; });
      }
      theirs.push(m);
      if (body && m.sec === sec) {
        var r = A.locate(body, m.anchor);
        if (r) A.paint(body, r, m);
      }
      drawMargin();
    }
    function retract(id) {
      A.unpaint(body, id);
      theirs = theirs.filter(function (x) { return x.id !== id; });
      drawMargin();
    }
    function forget() { theirs.forEach(function (m) { A.unpaint(body, m.id); }); theirs = []; drawMargin(); }

    /* A peer pointing at a passage: find it, flash it, do not keep it. */
    function flash(a) {
      if (!body) return;
      var r = A.locate(body, a);
      if (!r) return;
      var m = { id: "point" + Date.now(), pass: 0 };
      var span = document.createElement("span");
      span.className = "rd-point";
      try { r.surroundContents(span); }
      catch (e) { return; }
      span.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(function () {
        var parent = span.parentNode;
        if (!parent) return;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parent.normalize();
      }, 2600);
    }

    function setFilter(n) { filter = n; drawMargin(); }
    function currentFilter() { return filter; }

    return {
      arm: arm, store: shop, reset: reset, all: mine, here: here,
      draw: drawMargin, remove: remove, editor: editor,
      receive: receive, retract: retract, forget: forget, flash: flash,
      setFilter: setFilter, filter: currentFilter, source: SOURCE
    };
  })();

  /* ==================================================== The section itself */
  function openRead(i, silent, rkey) {
    if (rkey && READERS[rkey]) useReader(READERS[rkey]);
    var r = RU;
    var sec = sectionAt(i);
    if (!sec) return;
    if (!silent) enter("read:" + sec.n, sec.n, function () { openRead(i, true, r.key); });
    S.readIx = i;
    // S.readIx is a copy, not a reference into the record, so the record has
    // to be written directly — keep() alone saved the old position forever.
    if (R) { R.d.readIx = i; R.d.readUnit = r.key; }
    keep();

    var v = $("#v-read");
    v.innerHTML = "";

    var three = el("div", "rd-three");
    var art = el("article", "rd");

    var kick = el("div", "rd-kicker");
    kick.innerHTML = '<span class="num">' + esc(sec.n) + "</span><span>" + esc(sec.kicker) + "</span>";
    art.appendChild(kick);
    art.appendChild(el("h1", null, esc(sec.t)));
    art.appendChild(el("p", "rd-stand", esc(sec.stand)));

    var meta = el("div", "rd-meta");
    meta.innerHTML = "<b>" + esc(r.courseTitle) + "</b><span>Unit " + r.unit + " · " +
      esc(r.title) + "</span>" +
      "<span>" + sec.mins + " min read</span>" +
      (sec.video ? "<span>Includes video</span>" : "");
    art.appendChild(meta);

    if (sec.objectives && sec.objectives.length) {
      var ob = el("ul", "rd-obj");
      sec.objectives.forEach(function (o) { ob.innerHTML += "<li>" + esc(o) + "</li>"; });
      art.appendChild(ob);
    }

    if (sec.video) art.appendChild(videoBlock(sec));

    var body = el("div", "rd-body");
    body.id = "rdBody";
    sec.body.forEach(function (b) {
      if (b.k === "p") body.appendChild(el("p", null, b.t));
      else if (b.k === "h") body.appendChild(el("h2", null, esc(b.t)));
      else if (b.k === "def") {
        body.appendChild(el("div", "rd-def", "<b>" + esc(b.t) + "</b><p>" + b.d + "</p>"));
      } else if (b.k === "quote") {
        body.appendChild(el("blockquote", "rd-quote",
          "<p>" + esc(b.t) + "</p>" + (b.s ? "<span>" + esc(b.s) + "</span>" : "")));
      } else if (b.k === "stat") {
        body.appendChild(el("div", "rd-stat", "<b>" + esc(b.n) + "</b><span>" + esc(b.d) + "</span>"));
      } else if (b.k === "note") {
        body.appendChild(el("aside", "rd-note", b.t));
      } else if (b.k === "list") {
        var ul = el("div", "rd-list", "<b>" + esc(b.t) + "</b>");
        var inner = el("ul");
        b.items.forEach(function (it) {
          inner.innerHTML += "<li><b>" + it[0] + "</b><span>" + it[1] + "</span></li>";
        });
        ul.appendChild(inner);
        body.appendChild(ul);
      }
    });
    art.appendChild(body);

    if (sec.check) art.appendChild(checkBlock(sec, i));

    var nxt = sectionAt(i + 1);
    var next = el("div", "rd-next");
    next.innerHTML = nxt
      ? '<div><span class="t">Next in this unit</span><b>' + esc(nxt.n) + " " + esc(nxt.t) + "</b></div>"
      : '<div><span class="t">End of the unit</span><b>Study the terms</b></div>';
    var nb = el("button", "lx-btn", nxt ? "Continue" : "Study set");
    nb.type = "button";
    nb.addEventListener("click", function () { if (nxt) openRead(i + 1); else openSet(r.set); });
    next.appendChild(nb);
    art.appendChild(next);

    three.appendChild(unitRail(i));
    three.appendChild(art);

    var margin = el("aside", "rd-margin");
    margin.innerHTML = '<div class="mg-head"></div><div class="mg-wrap"></div>';
    three.appendChild(margin);

    v.appendChild(three);

    noFoot(); progress(null);
    show("read");
    Ann.arm(body, sec.n, art, margin);
    railWatch();
    Room.here(sec.n);
    if (S.marginFn) window.removeEventListener("resize", S.marginFn);
    S.marginFn = function () { Ann.draw(); };
    window.addEventListener("resize", S.marginFn);
  }

  /* ------------------------------------------------------------- The video
     The placeholder is the default and the player is the upgrade, rather than
     the other way round. A <video> pointed at a file that is not there shows
     a broken control for as long as it takes to fail, and a broken control at
     the top of an article is the first thing a reader sees. So the file is
     probed off-screen first and the frame only becomes a player once the
     browser has actually found something to play. */
  function videoBlock(sec) {
    var box = el("figure", "rd-video");
    var ph = el("div", "rd-vph");
    ph.innerHTML =
      '<div class="rd-vph-art" aria-hidden="true"><span class="wave"></span>' +
      '<span class="glyph">' + svg(I.play) + "</span></div>" +
      '<div class="rd-vph-say"><span class="k">Section video · ' + esc(sec.n) + "</span>" +
      "<b>" + esc(sec.t) + "</b>" +
      "<p>Placeholder. The file is not carried in this build — drop " +
      "<code>" + esc(String(sec.video).split("/").pop()) + "</code> into <code>learn/media/</code>, " +
      "or point <code>video</code> in <code>unit5.js</code> at a URL. The player appears here on " +
      "its own once it can find it.</p></div>";
    box.appendChild(ph);
    var cap = el("figcaption", "rd-cap", "Section video — " + esc(sec.t) + ".");
    box.appendChild(cap);

    var probe = document.createElement("video");
    probe.preload = "metadata";
    probe.muted = true;
    probe.addEventListener("loadedmetadata", function () {
      var tag = el("video");
      tag.controls = true; tag.preload = "metadata"; tag.playsInline = true;
      tag.src = sec.video;
      box.replaceChild(tag, ph);
      box.classList.add("live");
    });
    probe.src = sec.video;

    return box;
  }

  /* ---------------------------------------------- The left rail: the unit
     Where you are, what is left, and the two doors out of the article —
     your notebook, and the room. */
  function unitRail(i) {
    var side = el("aside", "rd-rail-nav");

    var toc = el("div", "rd-panel");
    toc.innerHTML = "<h3>Unit " + RU.unit + "<span>" + esc(RU.title) + "</span></h3>";
    var list = el("div", "rd-toc");
    RU.sections.forEach(function (x, k) {
      var b = el("button");
      b.type = "button";
      b.setAttribute("aria-current", String(k === i));
      var n = Ann.all().filter(function (m) { return m.sec === x.n; }).length;
      b.innerHTML = '<span class="n">' + esc(x.n) + "</span><span class=\"t\">" + esc(x.t) + "</span>" +
        (n ? '<span class="badge">' + n + "</span>" : "") +
        (S.readDone[x.n] ? '<span class="tick">' + svg(I.tick, true) + "</span>" : "");
      b.addEventListener("click", function () { openRead(k); });
      list.appendChild(b);
    });
    toc.appendChild(list);

    var done = doneIn(RU);
    var prog = el("div", "rd-unitprog");
    prog.innerHTML = '<div class="track"><i style="width:' +
      Math.round(done / RU.sections.length * 100) + '%"></i></div>' +
      "<span>" + done + " of " + RU.sections.length + " sections checked</span>";
    toc.appendChild(prog);
    side.appendChild(toc);

    /* The passes, as a legend and as a filter. Six counts tell a reader more
       about their own reading than any progress bar does. */
    var lens = el("div", "rd-panel rd-passes");
    lens.innerHTML = "<h3>Passes<span>Click to filter your margin</span></h3>";
    var all = Ann.all();
    A.PASSES.forEach(function (p) {
      var n = all.filter(function (m) { return m.pass === p.n; }).length;
      var b = el("button");
      b.type = "button";
      b.title = p.what;
      b.setAttribute("aria-pressed", String(Ann.filter() === p.n));
      b.innerHTML = '<i style="background:' + p.hue + '"></i><span>' + esc(p.name) +
        '</span><em>' + n + "</em>";
      b.addEventListener("click", function () {
        var now = Ann.filter() === p.n ? 0 : p.n;
        Ann.setFilter(now);
        [].forEach.call(lens.querySelectorAll("button"), function (o) {
          o.setAttribute("aria-pressed", String(o === b && now));
        });
      });
      lens.appendChild(b);
    });
    side.appendChild(lens);

    var nbl = el("button", "rd-side-link");
    nbl.type = "button";
    nbl.innerHTML = svg(I.book, true) + "<span>Notebook</span><span class=\"c\">" +
      Ann.all().length + "</span>";
    nbl.addEventListener("click", function () { openNotebook(); });
    side.appendChild(nbl);

    var col = el("button", "rd-side-link");
    col.id = "roomOpen";
    col.type = "button";
    col.innerHTML = svg(I.people, true) + "<span>Read together</span>" +
      '<span class="c" id="roomCount">' + (Room.count() || "") + "</span>";
    col.addEventListener("click", function () { Room.panel(); });
    side.appendChild(col);

    return side;
  }

  function checkBlock(sec, i) {
    var c = sec.check, done = false, r = RU;
    var box = el("div", "rd-check");
    box.innerHTML = '<p class="k">Check your understanding</p><p class="q">' + esc(c.q) + "</p>";
    var wrap = el("div", "lx-opts");
    var verdict = el("div");
    c.opts.forEach(function (o, j) {
      var b = el("button", "lx-opt");
      b.type = "button";
      b.innerHTML = '<span class="lx-key">' + "ABCD"[j] + "</span><span>" + esc(o) + "</span>";
      b.addEventListener("click", function () {
        if (done) return;
        done = true;
        var ok = j === c.right;
        [].forEach.call(wrap.children, function (x, k) {
          x.disabled = true;
          if (k === c.right) x.classList.add("right");
          else if (k === j) x.classList.add("wrong");
        });
        verdict.innerHTML = '<div class="lx-verdict ' + (ok ? "right" : "wrong") + '"><b>' +
          (ok ? "That's it" : "Not quite") + "</b><p>" + c.why + "</p></div>";
        S.readDone[sec.n] = true;
        keep();
        var pct = Math.round(doneIn(r) / r.sections.length * 100);
        var course = allCourses().filter(function (x) { return x.id === r.course; })[0] || D.MEDIA;
        raise(course, r.unit, "u", pct);
        if (ok) raise(course, r.unit, "p", pct);
        else slip("problem", "u" + r.unit + ":" + sec.n, sec.t,
                  "Missed the check in section " + sec.n + ".");
      });
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
    box.appendChild(verdict);
    return box;
  }

  /* Reading progress as a hairline under the bar — and, when following
     someone, the thing that tells them where you are. */
  function railWatch() {
    var rail = $("#rdRail");
    if (!rail) return;
    rail.hidden = false;
    if (S.railFn) window.removeEventListener("scroll", S.railFn);
    var beat = 0;
    S.railFn = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? Math.min(100, Math.max(0, window.scrollY / h * 100)) : 0;
      rail.firstElementChild.style.width = pct + "%";
      var now = Date.now();
      if (Room.live() && now - beat > 400) { beat = now; Room.scrolled(window.scrollY); }
    };
    window.addEventListener("scroll", S.railFn, { passive: true });
    S.railFn();
  }
  function railOff() {
    var rail = $("#rdRail");
    if (rail) rail.hidden = true;
    if (S.railFn) { window.removeEventListener("scroll", S.railFn); S.railFn = null; }
    if (S.marginFn) { window.removeEventListener("resize", S.marginFn); S.marginFn = null; }
  }

  /* ============================================================== Notebook
     Four ways into the same marks, because the question changes.

       SECTIONS   what did I make of this part
       PASSES     what kind of reader was I being
       TAGS       what keeps coming up
       ARGUMENT   what is actually being claimed, and does it hold

     The last one is the one that matters. It reassembles claims with the
     evidence and objections a reader linked to them, which is an essay
     outline that happens to have been written while reading. */
  function openNotebook(silent) {
    if (!silent) enter("notes", "Notebook", function () { openNotebook(true); });
    var v = $("#v-notes");
    v.innerHTML = "";

    var marks = Ann.all();
    var prof = A.profile(marks);

    v.appendChild(el("p", "lx-eyebrow", esc(RU.courseTitle) + " · Unit " + RU.unit));
    v.appendChild(el("h1", "lx-h1", "Notebook"));

    if (!marks.length) {
      v.appendChild(el("p", "lx-lede",
        "Nothing marked yet. Select any sentence while reading — 1 to 6 for the pass, " +
        "N to write a note — and it lands here."));
      noFoot(); progress(null); show("notes"); return;
    }

    v.appendChild(el("p", "lx-lede", prof.shape));

    /* The reading, in numbers that mean something. */
    var strip = el("div", "nb-prof");
    var depth = el("div", "nb-depth");
    depth.innerHTML = '<div class="ring" style="--v:' + prof.depth + '"><b>' + prof.depth +
      "</b></div><span>Depth<em>How far past underlining</em></span>";
    strip.appendChild(depth);
    var counts = el("div", "nb-counts");
    A.PASSES.forEach(function (p) {
      var n = prof.count[p.key];
      var c = el("div", "nb-count" + (n ? "" : " nil"));
      c.innerHTML = '<i style="background:' + p.hue + '"></i><b>' + n + "</b><span>" +
        esc(p.name) + "</span>";
      counts.appendChild(c);
    });
    strip.appendChild(counts);
    var writ = el("div", "nb-count wide");
    writ.innerHTML = "<b>" + prof.noted + "</b><span>with a note</span>";
    counts.appendChild(writ);
    v.appendChild(strip);

    /* Controls. */
    var bar = el("div", "nb-bar");
    var search = el("input", "nb-search");
    search.type = "search";
    search.placeholder = "Search your marks, notes and tags";
    search.setAttribute("aria-label", "Search the notebook");
    bar.appendChild(search);

    var mode = "section";
    var modes = el("div", "nb-modes");
    [["section", "Sections"], ["pass", "Passes"], ["tag", "Tags"], ["argument", "Argument"]]
      .forEach(function (m) {
        var b = el("button", "nb-seg");
        b.type = "button";
        b.textContent = m[1];
        b.setAttribute("aria-pressed", String(m[0] === mode));
        b.addEventListener("click", function () {
          mode = m[0];
          [].forEach.call(modes.children, function (x) {
            x.setAttribute("aria-pressed", String(x === b));
          });
          render();
        });
        modes.appendChild(b);
      });
    bar.appendChild(modes);

    var acts = el("div", "nb-acts");
    var style = el("select", "nb-style");
    style.setAttribute("aria-label", "Citation style");
    style.innerHTML = ["mla", "apa", "chicago"].map(function (s) {
      return '<option value="' + s + '"' + ((S.citeStyle || "mla") === s ? " selected" : "") +
        ">" + s.toUpperCase() + "</option>";
    }).join("");
    style.addEventListener("change", function () {
      S.citeStyle = style.value;
      if (R) R.d.citeStyle = style.value;     // a copy, so the record is written directly
      keep(); render();
    });
    acts.appendChild(style);

    var exp = el("button", "lx-btn quiet", "Copy notebook");
    exp.type = "button";
    exp.addEventListener("click", function () {
      copy(asMarkdown(marks));
      toast("Notebook copied as Markdown.");
    });
    acts.appendChild(exp);

    var outl = el("button", "lx-btn quiet", "Copy outline");
    outl.type = "button";
    outl.title = "Claims, with their evidence and objections, as an essay skeleton";
    outl.addEventListener("click", function () {
      copy(asOutline(marks));
      toast("Outline copied — claims with what holds them up.");
    });
    acts.appendChild(outl);
    bar.appendChild(acts);
    v.appendChild(bar);

    var out = el("div", "nb-out");
    v.appendChild(out);

    function hits() {
      var q = search.value.trim().toLowerCase();
      if (!q) return marks;
      return marks.filter(function (m) {
        return (m.text + " " + (m.note || "") + " " + (m.tags || []).join(" "))
          .toLowerCase().indexOf(q) > -1;
      });
    }

    function group(title, sub, rows, go) {
      var g = el("section", "nb-group");
      var h = el("div", "nb-group-head");
      h.innerHTML = "<h2>" + title + "</h2><span>" + rows.length + "</span>" +
        (sub ? '<em class="nb-sub">' + esc(sub) + "</em>" : "");
      if (go) {
        var b = el("button", "lx-btn ghost", "Read");
        b.type = "button";
        b.addEventListener("click", go);
        h.appendChild(b);
      }
      g.appendChild(h);
      rows.forEach(function (m) { g.appendChild(row(m)); });
      return g;
    }

    function row(m) {
      var p = A.pass(m.pass);
      var b = el("div", "nb-row");
      b.style.setProperty("--hue", p.hue);
      var main = el("div", "nb-row-main");
      main.innerHTML = '<span class="kind">' + esc(p.name) + " · " + esc(m.sec) + "</span>" +
        "<q>" + esc(m.text) + "</q>" +
        (m.note ? '<p class="note">' + esc(m.note) + "</p>" : "") +
        ((m.tags && m.tags.length)
          ? '<p class="tags">' + m.tags.map(function (t) { return "<em>" + esc(t) + "</em>"; }).join("") + "</p>"
          : "");
      b.appendChild(main);

      var tools = el("div", "nb-row-tools");
      var go = el("button");
      go.type = "button"; go.title = "Go to it in the text"; go.setAttribute("aria-label", "Go to it in the text");
      go.innerHTML = svg(I.arrow, true);
      go.addEventListener("click", function () {
        var ix = RU.sections.indexOf(secByN(m.sec));
        if (ix < 0) return;
        openRead(ix);
        setTimeout(function () {
          var node = document.querySelector('#rdBody mark[data-id="' + m.id + '"]');
          if (node) {
            node.scrollIntoView({ block: "center", behavior: "smooth" });
            setTimeout(function () { Ann.editor(node, m.id); }, 340);
          }
        }, 120);
      });
      var cp = el("button");
      cp.type = "button"; cp.title = "Copy with citation"; cp.setAttribute("aria-label", "Copy with citation");
      cp.innerHTML = svg(I.copy, true);
      cp.addEventListener("click", function () {
        copy(A.quoted(m, SOURCE, S.citeStyle || "mla"));
        toast("Copied in " + (S.citeStyle || "mla").toUpperCase() + ".");
      });
      var rm = el("button");
      rm.type = "button"; rm.title = "Remove"; rm.setAttribute("aria-label", "Remove");
      rm.innerHTML = svg(I.trash, true);
      rm.addEventListener("click", function () {
        Ann.remove(m.id);
        marks = Ann.all();
        render();
      });
      tools.appendChild(go); tools.appendChild(cp); tools.appendChild(rm);
      b.appendChild(tools);
      return b;
    }

    function render() {
      var list = hits();
      out.innerHTML = "";
      if (!list.length) { out.appendChild(el("div", "lx-empty", "Nothing matches that.")); return; }

      if (mode === "section") {
        RU.sections.forEach(function (s) {
          var rows = list.filter(function (m) { return m.sec === s.n; });
          if (!rows.length) return;
          out.appendChild(group(esc(s.n) + "  " + esc(s.t), null, rows, function () {
            openRead(RU.sections.indexOf(s));
          }));
        });
      } else if (mode === "pass") {
        A.PASSES.forEach(function (p) {
          var rows = list.filter(function (m) { return m.pass === p.n; });
          if (!rows.length) return;
          out.appendChild(group(esc(p.name) + "s", p.what, rows, null));
        });
      } else if (mode === "tag") {
        var tags = {};
        list.forEach(function (m) { (m.tags || []).forEach(function (t) { (tags[t] = tags[t] || []).push(m); }); });
        var keys = Object.keys(tags).sort(function (a2, b2) { return tags[b2].length - tags[a2].length; });
        if (!keys.length) {
          out.appendChild(el("div", "lx-empty",
            "No tags yet. Tag a mark while you write the note and the themes group themselves."));
        }
        keys.forEach(function (t) { out.appendChild(group(esc(t), null, tags[t], null)); });
        var untagged = list.filter(function (m) { return !(m.tags || []).length; });
        if (untagged.length) out.appendChild(group("Untagged", null, untagged, null));
      } else {
        var t = A.threads(list);
        if (!t.threads.length) {
          out.appendChild(el("div", "lx-empty",
            "No claims marked yet. Mark a claim with 2, then link the evidence and objections " +
            "to it from the note editor — this view is the argument that comes out."));
        }
        t.threads.forEach(function (th) {
          var g = el("section", "nb-thread");
          var head = el("div", "nb-claim");
          head.style.setProperty("--hue", A.pass(2).hue);
          head.innerHTML = '<span class="kind">Claim · ' + esc(th.claim.sec) + "</span><q>" +
            esc(th.claim.text) + "</q>" +
            (th.claim.note ? "<p>" + esc(th.claim.note) + "</p>" : "");
          g.appendChild(head);
          [["Rests on", th.evidence], ["Against it", th.objections],
           ["Still unclear", th.questions], ["Also", th.other]].forEach(function (part) {
            if (!part[1].length) return;
            var col = el("div", "nb-limb");
            col.appendChild(el("h4", null, esc(part[0])));
            part[1].forEach(function (m) { col.appendChild(row(m)); });
            g.appendChild(col);
          });
          if (!th.evidence.length && !th.objections.length) {
            g.appendChild(el("p", "nb-bare",
              "Nothing linked to this claim yet. What in the text holds it up?"));
          }
          out.appendChild(g);
        });
        if (t.loose.length) out.appendChild(group("Not yet in an argument", null, t.loose, null));
      }
    }

    search.addEventListener("input", render);
    render();
    noFoot(); progress(null);
    show("notes");
  }

  function asMarkdown(marks) {
    var style = S.citeStyle || "mla";
    var lines = ["# " + SOURCE.container + " — " + SOURCE.title, "", "## Notebook", ""];
    RU.sections.forEach(function (sec) {
      var mine = marks.filter(function (m) { return m.sec === sec.n; });
      if (!mine.length) return;
      lines.push("### " + sec.n + "  " + sec.t, "");
      mine.forEach(function (m) {
        lines.push("- **" + A.pass(m.pass).name + "** — “" + m.text + "”");
        if (m.note) lines.push("  - " + m.note);
        if (m.tags && m.tags.length) lines.push("  - Tags: " + m.tags.join(", "));
        lines.push("  - " + A.cite(m, SOURCE, style));
      });
      lines.push("");
    });
    return lines.join("\n");
  }

  /* The outline is the notebook read as an argument rather than as a list.
     It is deliberately not prose: it is the skeleton a student then has to
     put muscle on themselves. */
  function asOutline(marks) {
    var style = S.citeStyle || "mla";
    var t = A.threads(marks);
    var lines = ["# Outline — " + SOURCE.container + ", " + SOURCE.title, ""];
    if (!t.threads.length) {
      lines.push("_No claims marked yet. Mark the claims with 2 and link their evidence to them._");
      return lines.join("\n");
    }
    t.threads.forEach(function (th, i) {
      lines.push((i + 1) + ". **" + th.claim.text + "**");
      if (th.claim.note) lines.push("   _" + th.claim.note + "_");
      lines.push("   " + A.cite(th.claim, SOURCE, style));
      if (th.evidence.length) {
        lines.push("   - Rests on:");
        th.evidence.forEach(function (m) {
          lines.push("     - “" + m.text + "” — " + m.sec + (m.note ? " — " + m.note : ""));
        });
      }
      if (th.objections.length) {
        lines.push("   - Against it:");
        th.objections.forEach(function (m) {
          lines.push("     - " + (m.note || "“" + m.text + "”") + " — " + m.sec);
        });
      }
      if (th.questions.length) {
        lines.push("   - Still unclear:");
        th.questions.forEach(function (m) {
          lines.push("     - " + (m.note || "“" + m.text + "”") + " — " + m.sec);
        });
      }
      lines.push("");
    });
    if (t.loose.length) {
      lines.push("## Not yet placed", "");
      t.loose.forEach(function (m) {
        lines.push("- " + A.pass(m.pass).name + ": “" + m.text + "” — " + m.sec);
      });
    }
    return lines.join("\n");
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
      return;
    }
    var t = document.createElement("textarea");
    t.value = text;
    t.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(t);
    t.select();
    try { document.execCommand("copy"); } catch (e) { /* nothing to fall back to */ }
    document.body.removeChild(t);
  }

  /* -------------------------------------------------------------- Practice */
  function startPractice(again) {
    enter("practice:" + S.course.id + ":" + S.unitIx, "Practice",
          function () { startPractice(true); }, again);
    var P = D.PROBLEMS;
    S.p = { i: 0, right: 0, first: 0, tries: 0, picked: null, checked: false };

    var v = $("#v-practice");
    v.innerHTML = '<div class="lx-stage">' +
      '<p class="lx-ask" id="ask"></p><p class="lx-hint" id="hint"></p>' +
      '<div class="lx-figure" id="figure" hidden></div>' +
      '<div id="answer"></div><div id="verdict"></div></div>';

    function drawQ() {
      var p = P[S.p.i];
      S.p.picked = null; S.p.checked = false; S.p.tries = 0;
      progress(Math.round(S.p.i / P.length * 100));
      $("#ask").innerHTML = p.ask;
      $("#hint").innerHTML = p.hint || "";
      $("#hint").hidden = !p.hint;
      var fig = $("#figure");
      fig.hidden = !p.fig; fig.innerHTML = p.fig || "";
      $("#verdict").innerHTML = "";

      var a = $("#answer"); a.innerHTML = "";
      if (p.type === "choice") {
        var wrap = el("div", "lx-opts");
        p.opts.forEach(function (o, i) {
          var b = el("button", "lx-opt");
          b.type = "button";
          b.setAttribute("aria-pressed", "false");
          b.innerHTML = '<span class="lx-key">' + "ABCD"[i] + "</span><span>" + o + "</span>";
          b.addEventListener("click", function () {
            if (S.p.checked) return;
            S.p.picked = i;
            [].forEach.call(wrap.children, function (x, j) { x.setAttribute("aria-pressed", String(i === j)); });
            $("#footBtn").disabled = false;
          });
          wrap.appendChild(b);
        });
        a.appendChild(wrap);
      } else {
        var w = el("div", "lx-numwrap");
        var inp = el("input", "lx-num");
        inp.type = "text"; inp.inputMode = "numeric"; inp.id = "numIn";
        inp.setAttribute("aria-label", "Your answer");
        inp.addEventListener("input", function () {
          S.p.picked = inp.value.trim();
          $("#footBtn").disabled = !S.p.picked;
        });
        inp.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && !$("#footBtn").disabled) go();
        });
        w.appendChild(inp);
        a.appendChild(w);
        setTimeout(function () { inp.focus(); }, 60);
      }
      foot("Problem " + (S.p.i + 1) + " of " + P.length, "Check", false, go);
    }

    function go() {
      var p = P[S.p.i];
      if (S.p.checked) {
        S.p.i++;
        if (S.p.i >= P.length) return finish();
        return drawQ();
      }
      S.p.tries++;
      var ok = p.type === "choice"
        ? S.p.picked === p.right
        : String(S.p.picked).replace(/\s/g, "") === String(p.right);

      if (!ok && S.p.tries === 1) {          // one free retry, then the answer
        if (p.type === "choice") {
          var opts = $("#answer").querySelectorAll(".lx-opt");
          opts[S.p.picked].classList.add("wrong");
          opts[S.p.picked].setAttribute("aria-pressed", "false");
          S.p.picked = null;
          $("#footBtn").disabled = true;
        } else { $("#numIn").classList.add("wrong"); }
        $("#verdict").innerHTML =
          '<div class="lx-verdict wrong"><b>Not quite</b><p>Have another look — you get one more try.</p></div>';
        return;
      }

      S.p.checked = true;
      if (ok) { S.p.right++; if (S.p.tries === 1) S.p.first++; }
      else {
        slip("problem", S.course.id + ":" + S.unitIx + ":q" + S.p.i,
             String(p.ask).replace(/<[^>]*>/g, ""),
             "Missed in " + S.unit.t + ". " + String(p.why).replace(/<[^>]*>/g, "").slice(0, 130) + "…");
      }

      if (p.type === "choice") {
        var os = $("#answer").querySelectorAll(".lx-opt");
        [].forEach.call(os, function (o, i) {
          o.disabled = true;
          if (i === p.right) o.classList.add("right");
        });
      } else {
        var nn = $("#numIn");
        nn.classList.remove("wrong");
        nn.classList.add(ok ? "right" : "wrong");
        nn.disabled = true;
        if (!ok) nn.value = p.right;
      }
      $("#verdict").innerHTML = '<div class="lx-verdict ' + (ok ? "right" : "wrong") + '"><b>' +
        (ok ? "That's it" : "The answer is " + (p.type === "choice" ? p.opts[p.right] : p.right)) +
        "</b><p>" + p.why + "</p></div>";
      progress(Math.round((S.p.i + 1) / P.length * 100));
      foot("Problem " + (S.p.i + 1) + " of " + P.length,
           S.p.i === P.length - 1 ? "Finish" : "Next", true, go);
    }

    function finish() {
      var pct = Math.round(S.p.right / P.length * 100);
      raise(S.course, S.unitIx, "p", pct);
      raise(S.course, S.unitIx, "u", Math.round(S.p.first / P.length * 100));
      progress(null);
      var u = S.unit;
      result({
        title: pct === 100 ? "Every one." : pct + "% of the way.",
        lede: pct === 100
          ? "Nothing left to redo here. The study set is the other half of this unit."
          : "The ones you missed come back later, spaced out, until they stop being misses.",
        pct: pct,
        stats: [[S.p.right, "correct"], [P.length, "problems"], [S.p.first, "first try"]],
        back: function () { openUnit(S.course, S.unitIx); },
        again: startPractice,
        next: u && u.set ? { label: "Study the terms", go: function () { openSet(u.set); } } : null
      });
    }

    show("practice");
    drawQ();
  }

  /* ---------------------------------------------------------------- Result */
  function result(o) {
    var v = $("#v-result");
    v.innerHTML = "";
    var d = el("div", "lx-done");
    var circ = 2 * Math.PI * 52;
    d.innerHTML =
      '<svg class="lx-ring" viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="52" fill="none" stroke="#e6e6e8" stroke-width="9"/>' +
      '<circle id="ringArc" cx="60" cy="60" r="52" fill="none" stroke="#12915a" stroke-width="9" ' +
      'stroke-linecap="round" stroke-dasharray="' + circ.toFixed(0) + '" stroke-dashoffset="' + circ.toFixed(0) + '" ' +
      'transform="rotate(-90 60 60)" style="transition:stroke-dashoffset .9s cubic-bezier(.32,.08,.24,1)"/>' +
      '<text x="60" y="67" text-anchor="middle" font-size="25" font-weight="600" fill="#1d1d1f">' +
      o.pct + "%</text></svg>" +
      '<h1 class="lx-h1">' + esc(o.title) + "</h1>" +
      '<p class="lx-lede" style="margin-inline:auto">' + esc(o.lede) + "</p>";

    var sc = el("div", "lx-score");
    o.stats.forEach(function (s) {
      sc.innerHTML += "<div><b>" + s[0] + "</b><span>" + s[1] + "</span></div>";
    });
    d.appendChild(sc);

    var row = el("div");
    row.style.cssText = "display:flex;gap:10px;justify-content:center;flex-wrap:wrap";
    if (o.next) {
      var nb = el("button", "lx-btn lg", o.next.label);
      nb.type = "button";
      nb.addEventListener("click", o.next.go);
      row.appendChild(nb);
    }
    if (o.again) {
      var ab = el("button", "lx-btn lg quiet", "Again");
      ab.type = "button";
      ab.addEventListener("click", function () { o.again(true); });
      row.appendChild(ab);
    }
    var bb = el("button", "lx-btn lg" + (o.next || o.again ? " quiet" : ""), "Back");
    bb.type = "button";
    bb.addEventListener("click", o.back);
    row.appendChild(bb);
    d.appendChild(row);

    if (o.review) {
      var rv = el("div", "lx-review");
      o.review.forEach(function (r) {
        var box = el("div", "lx-rev" + (r.ok ? "" : " bad"));
        box.innerHTML = "<b>" + esc(r.term) + "</b><p>" + esc(r.def) + "</p>" +
          (r.ok ? "" : '<p class="yours">You wrote: ' + (r.yours ? esc(r.yours) : "nothing") + "</p>");
        rv.appendChild(box);
      });
      d.appendChild(rv);
    }

    v.appendChild(d);
    enter("result", "Results", function () { result(o); }, true);
    noFoot();
    show("result");
    setTimeout(function () {
      var arc = document.getElementById("ringArc");
      if (arc) arc.style.strokeDashoffset = String(circ - circ * o.pct / 100);
    }, 130);
  }

  /* --------------------------------------------------------------- Account */
  function openAccount(silent) {
    if (!silent) enter("account", "Account", function () { openAccount(true); });
    var A = S.me.enrolment;
    A.student = S.me.name; A.initials = S.me.initials;
    var v = $("#v-account");
    v.innerHTML = "";

    var head = el("div", "lx-acct-head");
    head.innerHTML = '<span class="av">' + esc(A.initials) + "</span><div>" +
      '<p class="lx-eyebrow" style="margin-bottom:4px">Student account</p>' +
      '<h1 class="lx-h1">' + esc(A.student) + "</h1></div>";
    v.appendChild(head);

    var prog = el("div", "lx-panel");
    prog.style.marginTop = "26px";
    var stars = "";
    for (var i = 0; i < 5; i++) stars += svg(I.star, i >= Math.round(A.rating));
    prog.innerHTML = "<h3 style=\"font-size:17px\">" + esc(A.program) + "</h3>" +
      '<div class="lx-stars">' + stars + "<span>" + A.rating + " · " + A.ratings + " ratings</span>" +
      '<span class="lx-tag" style="margin-left:6px">' + esc(A.status) + "</span></div>" +
      '<div class="lx-mastery" style="margin-top:16px"><i></i><i></i><i></i><i></i><i></i>' +
      "<i></i><i></i><i></i><i></i><i></i></div>" +
      '<p style="margin-top:10px">Program progress is ' + A.progress + "%. It is calculated from completed " +
      "course credits — courses passed, with or without a grade — against the credits required to graduate.</p>";
    v.appendChild(prog);

    var row = el("div", "lx-stat-row");
    A.stats.forEach(function (s) {
      row.innerHTML += '<div class="lx-stat"><b>' + esc(s[1]) + "</b><span>" + esc(s[0]) + "</span></div>";
    });
    v.appendChild(row);

    A.detail.forEach(function (group) {
      v.appendChild(el("h2", "lx-h2", esc(group[0])));
      var f = el("div", "lx-fields");
      group[1].forEach(function (r) {
        f.innerHTML += "<div><b>" + esc(r[0]) + "</b><span>" + esc(r[1]) + "</span></div>";
      });
      v.appendChild(f);
    });

    var bal = el("div", "lx-bal");
    bal.innerHTML = '<div><p class="k">Tuition balance due</p><p class="amt">' +
      esc(A.balance) + "</p></div>";
    var pay = el("button", "lx-btn lg", "Make a payment");
    pay.type = "button";
    pay.style.marginLeft = "auto";
    pay.addEventListener("click", function () {
      toast("Payments are not handled here yet. Nothing was charged.");
    });
    bal.appendChild(pay);
    v.appendChild(bal);

    v.appendChild(el("h2", "lx-h2", "Courses"));
    var cg = el("div", "lx-units");
    A.courses.forEach(function (name) {
      var b = el("button", "lx-unit");
      b.type = "button";
      b.innerHTML = '<span class="n">1</span><span class="txt"><b>' + esc(name) +
        "</b><span>In progress · no grade recorded</span></span>" +
        '<span class="go">' + svg(I.chev, true) + "</span>";
      b.addEventListener("click", function () { openCourse(D.MEDIA); });
      cg.appendChild(b);
    });
    v.appendChild(cg);

    v.appendChild(el("p", "lx-note",
      "<b>Read only.</b> Enrolment and tuition figures are shown as they stand on the record. Nothing " +
      "on this page can be edited here, and no payment can be taken yet."));

    var out = el("button", "lx-btn lg quiet", "Sign out");
    out.type = "button";
    out.style.marginTop = "26px";
    out.addEventListener("click", signOut);
    v.appendChild(out);

    noFoot(); progress(null);
    show("account");
  }

  /* ================================================================== Admin
     What an administrator needs is not a second application. It is the same
     one, with the ability to see whose work it is.

     Everything here is read from this machine — a student's marks live in
     their own localStorage under their own id, so this page can show them
     when the student has used this browser and says so plainly when they
     have not. It does not invent a roster it cannot see. */
  function openAdmin(silent) {
    if (!S.me || S.me.role !== "admin") return;
    if (!silent) enter("admin", "Students", function () { openAdmin(true); });

    var v = $("#v-admin");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", "Administration"));
    v.appendChild(el("h1", "lx-h1", "Students"));

    var people = D.STUDENTS.filter(function (p) { return p.role !== "admin"; });
    v.appendChild(el("p", "lx-lede", people.length === 1
      ? "One enrolled student. Their reading and their notebook are below."
      : people.length + " enrolled students."));

    var grid = el("div", "ad-grid");
    people.forEach(function (p) { grid.appendChild(studentCard(p)); });
    v.appendChild(grid);

    noFoot(); progress(null);
    show("admin");
  }

  /* A student's marks, read from where the annotation store keeps them. The
     store is the only thing that knows the shape of that key, so ask it. */
  function marksOf(personId) {
    try { return new A.Store(personId, "media-u5").all(); }
    catch (e) { return []; }
  }

  function studentCard(p) {
    var c = el("article", "ad-card");

    var head = el("header", "ad-head");
    var av = el("span", "ad-av");
    av.style.background = p.hue || "#6e6e73";
    av.textContent = p.initials;
    head.appendChild(av);
    head.appendChild(el("div", "ad-who", "<b>" + esc(p.name) + "</b><span>" +
      esc(p.email) + "</span>"));
    var g = el("span", "ad-grade", "Grade " + (p.grade || "—"));
    head.appendChild(g);
    c.appendChild(head);

    if (p.enrolment) {
      var en = el("div", "ad-en");
      en.innerHTML = "<b>" + esc(p.enrolment.program) + "</b>" +
        "<span>" + esc(p.enrolment.status) + " · balance " + esc(p.enrolment.balance) + "</span>";
      c.appendChild(en);
    }

    /* What they have actually done. Marks are the honest signal here — a
       progress bar can be moved by clicking, a margin full of objections
       cannot. */
    var marks = marksOf(p.id);
    var prof = A.profile(marks);

    var stats = el("div", "ad-stats");
    [["Courses", (p.assigned || []).length],
     ["Marks", marks.length],
     ["With a note", prof.noted],
     ["Depth", marks.length ? prof.depth + "%" : "—"]].forEach(function (s) {
      var b = el("div", "ad-stat");
      b.innerHTML = "<b>" + s[1] + "</b><span>" + s[0] + "</span>";
      stats.appendChild(b);
    });
    c.appendChild(stats);

    if (marks.length) {
      var passes = el("div", "ad-passes");
      A.PASSES.forEach(function (q) {
        var n = prof.count[q.key];
        if (!n) return;
        var t = el("span", "ad-pass");
        t.innerHTML = '<i style="background:' + q.hue + '"></i>' + n + " " + esc(q.name.toLowerCase()) +
          (n === 1 ? "" : "s");
        passes.appendChild(t);
      });
      c.appendChild(passes);
      c.appendChild(el("p", "ad-shape", esc(prof.shape)));
    } else {
      c.appendChild(el("p", "ad-shape quiet",
        "No marks on this machine. A student's notebook is stored in their own browser, " +
        "so it is visible here only when they have read on this one."));
    }

    var acts = el("div", "ad-acts");
    var read = el("button", "lx-btn", "Read alongside");
    read.type = "button";
    read.title = "Open a room and start on section 5.1";
    read.addEventListener("click", function () {
      openRead(0);
      setTimeout(function () { Room.panel(); }, 200);
    });
    acts.appendChild(read);

    if (marks.length) {
      var nb = el("button", "lx-btn quiet", "Their notebook");
      nb.type = "button";
      nb.addEventListener("click", function () { openTheirNotebook(p); });
      acts.appendChild(nb);
    }
    c.appendChild(acts);
    return c;
  }

  /* Read-only. An administrator looking at a student's reading should not be
     able to edit it by accident — a note you did not write, changed without
     you knowing, is worse than no note at all. */
  function openTheirNotebook(p) {
    enter("their:" + p.id, p.first, function () { openTheirNotebook(p); });
    var v = $("#v-admin");
    v.innerHTML = "";
    var marks = marksOf(p.id);
    var prof = A.profile(marks);

    v.appendChild(el("p", "lx-eyebrow", esc(p.name) + " · Media Arts, Unit 5"));
    v.appendChild(el("h1", "lx-h1", "Their notebook"));
    v.appendChild(el("p", "lx-lede", prof.shape + " Read-only."));

    var t = A.threads(marks);
    var out = el("div", "nb-out");

    U5.forEach(function (s) {
      var rows = marks.filter(function (m) { return m.sec === s.n; });
      if (!rows.length) return;
      var g = el("section", "nb-group");
      var h = el("div", "nb-group-head");
      h.innerHTML = "<h2>" + esc(s.n) + "  " + esc(s.t) + "</h2><span>" + rows.length + "</span>";
      g.appendChild(h);
      rows.forEach(function (m) {
        var q = A.pass(m.pass);
        var r = el("div", "nb-row");
        r.style.setProperty("--hue", q.hue);
        r.innerHTML = '<div class="nb-row-main"><span class="kind">' + esc(q.name) +
          " · " + esc(m.sec) + "</span><q>" + esc(m.text) + "</q>" +
          (m.note ? '<p class="note">' + esc(m.note) + "</p>" : "") +
          ((m.tags && m.tags.length)
            ? '<p class="tags">' + m.tags.map(function (x) { return "<em>" + esc(x) + "</em>"; }).join("") + "</p>"
            : "") + "</div>";
        g.appendChild(r);
      });
      out.appendChild(g);
    });
    v.appendChild(out);
    noFoot(); progress(null);
    show("admin");
  }

  /* ================================================================== Auth
     Auth.verify is the seam. Today it derives a PBKDF2 verifier in the
     browser and compares it in constant time; swapping in a real provider —
     a server, Firebase, Supabase, anything that holds the verifier itself —
     means replacing this one function and nothing else in the app.

     What the current implementation is honest about: a static host has no
     server to check a password against, so the verifier ships to the browser
     and can be read. PBKDF2 at 210,000 iterations makes each guess against it
     cost real work rather than a table lookup, which is the difference
     between a verifier leaking and a password leaking. It is not a substitute
     for a server. */
  var Auth = (function () {
    var enc = new TextEncoder();

    function b64(buf) {
      return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
    }
    function unb64(s) {
      return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); });
    }
    /* Compared byte by byte to the end regardless: bailing on the first
       mismatch leaks how much of a guess was right through timing. */
    function same(a, b) {
      if (a.length !== b.length) return false;
      var diff = 0;
      for (var i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
      return diff === 0;
    }

    function derive(password, salt) {
      return crypto.subtle
        .importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"])
        .then(function (key) {
          return crypto.subtle.deriveBits(
            { name: "PBKDF2", salt: salt, iterations: D.ITERATIONS, hash: "SHA-256" },
            key, 256);
        });
    }

    function verify(email, password) {
      var who = D.STUDENTS.filter(function (s) {
        return s.email.toLowerCase() === String(email).trim().toLowerCase();
      })[0];
      if (!(window.crypto && crypto.subtle && crypto.subtle.deriveBits)) {
        return Promise.reject(new Error("insecure-context"));
      }
      // Derive either way, so a wrong address and a wrong password take the
      // same time and neither can be told apart from outside.
      var target = who || D.STUDENTS[0];
      return derive(password, unb64(target.salt)).then(function (bits) {
        if (!who) return null;
        return same(new Uint8Array(bits), unb64(who.verifier)) ? who : null;
      });
    }

    /* The session is the tab's, not the browser's: closing it signs out. */
    var KEY = "oplo.learn.session";
    function open(id) {
      try { sessionStorage.setItem(KEY, id); } catch (e) { /* private mode */ }
    }
    function current() {
      var id;
      try { id = sessionStorage.getItem(KEY); } catch (e) { return null; }
      return id ? D.STUDENTS.filter(function (s) { return s.id === id; })[0] || null : null;
    }
    function close() {
      try { sessionStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ }
    }

    return { verify: verify, open: open, current: current, close: close, b64: b64 };
  })();

  function boot(who) {
    S.me = who;

    /* The record is opened before anything is drawn, and S is pointed at it.
       Every screen below reads S.m, S.sets, S.mistakes exactly as it always
       did — they are simply the same objects the record holds now, so a
       write through either name is a write to both. */
    R = new ST.Record(who.id);
    S.m = R.d.m;
    S.sets = R.d.sets;
    S.mistakes = R.d.mistakes;
    S.readDone = R.d.readDone;
    S.doneToday = R.d.doneToday;
    S.readIx = R.d.readIx || 0;
    S.citeStyle = R.d.citeStyle || "mla";
    var ru = READERS[R.d.readUnit];
    useReader(ru && ru.sections.length ? ru : READERS["media:5"]);
    Game.attach(R);

    $("#gate").hidden = true;
    var av = document.querySelector(".lx-user .av");
    av.textContent = who.initials;
    av.style.background = who.hue || "";
    document.querySelector(".lx-user .nm").textContent = who.name;
    $("#user").title = "Signed in as " + who.name;
    document.body.classList.toggle("is-admin", who.role === "admin");
    $("#navAdmin").hidden = who.role !== "admin";
    if (R.broken) {
      toast("This browser will not let the page store anything, so progress will not be kept.");
    }
    Ann.reset();
    Game.paint();          // the bar shows the real streak and rank from the first frame
    drawSubjectNav();
    home();
    Room.presence();
    Room.fromLink();
  }

  function signOut() {
    if (R) R.flush();                 // never leave the last few answers unwritten
    R = null;
    Game.attach(null);
    Auth.close();
    Room.reset();
    Ann.reset();
    // Everything the session learned goes with it rather than sitting in
    // memory for whoever opens the tab next.
    S.me = null; S.m = {}; S.sets = {}; S.mistakes = [];
    S.here = null; S.hist = [];
    TRAIL = []; POS = -1;            // the next person's history starts from nothing
    S.course = null; S.unit = null; S.setId = null; S.set = null;
    document.body.classList.remove("is-admin");
    $("#navAdmin").hidden = true;
    $("#rankChip").hidden = true;
    $("#streak").textContent = "0";
    $("#gate").hidden = false;
    $("#gEmail").value = ""; $("#gPass").value = "";
    $("#gErr").textContent = "";
    noFoot(); progress(null);
    setTimeout(function () { $("#gEmail").focus(); }, 80);
  }

  (function gate() {
    var form = $("#gateForm"), err = $("#gErr"), btn = form.querySelector("button");
    var tries = 0, until = 0;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#gEmail").value, pw = $("#gPass").value;
      err.textContent = "";
      $("#gEmail").classList.remove("bad");
      $("#gPass").classList.remove("bad");

      var wait = Math.ceil((until - Date.now()) / 1000);
      if (wait > 0) {
        err.textContent = "Too many attempts. Try again in " + wait +
                          (wait === 1 ? " second." : " seconds.");
        return;
      }
      if (!email || !pw) { err.textContent = "Both fields, please."; return; }

      btn.disabled = true;
      btn.textContent = "Checking\u2026";
      Auth.verify(email, pw).then(function (who) {
        btn.disabled = false;
        btn.textContent = "Sign in";
        if (who) { tries = 0; Auth.open(who.id); boot(who); return; }
        tries++;
        // Backs off after three: 5s, 10s, 20s, capped at a minute.
        if (tries >= 3) until = Date.now() + Math.min(60000, 5000 * Math.pow(2, tries - 3));
        err.textContent = "That email and password do not match an account.";
        $("#gEmail").classList.add("bad");
        $("#gPass").classList.add("bad");
        $("#gPass").value = "";
        $("#gPass").focus();
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = "Sign in";
        err.textContent = "This page needs a secure connection (https) to check a password.";
      });
    });

    var already = Auth.current();
    if (already) boot(already);
    else setTimeout(function () { $("#gEmail").focus(); }, 120);
  })();


  /* ================================================================ Tutor
     The panel. All the pedagogy lives in tutor.js; this is the surface, plus
     the job of telling the controller where the student currently is. */
  var T = window.OPLO_TUTOR;

  var Tutor = (function () {
    if (!T) return { note: function () {} };
    var ctrl = new T.Controller();
    var history = [], live = false, busy = false, checked = false;

    function log() { return $("#ttLog"); }
    function dot(state) {
      var d = $("#ttDot");
      d.className = "tt-dot" + (state ? " " + state : "");
      d.title = state === "live" ? "Connected to Ollama"
              : state === "busy" ? "Thinking" : "Not connected";
    }
    function rungs() {
      var bar = $("#ttLadder");
      if (!live) { bar.hidden = true; return; }
      bar.hidden = false;
      var r = ctrl.rung();
      $("#ttRungs").innerHTML = T.LADDER.map(function (x) {
        return '<i class="' + (x.n <= r.n ? "on" : "") + '"></i>';
      }).join("");
      $("#ttRungName").textContent = r.name;
    }
    function say(cls, html) {
      var m = el("div", "tt-msg " + cls, html);
      log().appendChild(m);
      log().scrollTop = log().scrollHeight;
      return m;
    }
    function clear() { log().innerHTML = ""; }

    function offline() {
      clear();
      say("sys",
        "<b>No model is running</b>" +
        "Oplo Tutor runs on your own machine, so nothing you type is sent anywhere. " +
        "To turn it on, install Ollama and pull a model:" +
        "<br><code>brew install ollama</code><br><code>ollama pull " + T.MODEL + "</code>" +
        "<br><code>OLLAMA_ORIGINS='*' ollama serve</code><br><br>" +
        "Then reopen this panel. Until then it will not answer — a tutor that " +
        "invents its confidence is worse than no tutor.");
    }

    function welcome() {
      clear();
      say("sys",
        "<b>Oplo Tutor</b>I will not give you answers. I will ask you questions until you " +
        "find them, and I will tell you when you are close. Ask me anything about what you " +
        "are reading.");
    }

    function context() {
      var c = { mastery: coursePct(D.MEDIA) };
      var sec = readSec();
      if (S.view === "read" && sec) { c.section = "Media Arts " + sec.n; c.title = sec.t; }
      else if (S.course) { c.section = S.course.t; c.title = S.unit && S.unit.t; }
      var sel = String(window.getSelection() || "").trim();
      if (sel && sel.length < 400) c.selection = sel.replace(/\s+/g, " ");
      c.missed = S.mistakes.slice(0, 4).map(function (m) { return m.title; });

      /* What they marked is better evidence of where they are than any
         progress number. An unanswered question in the margin is the exact
         thing a tutor should open on. */
      if (S.view === "read" && sec) {
        var marks = Ann.here();
        var open = marks.filter(function (m) { return m.pass === 4 || m.pass === 5; });
        if (open.length) {
          c.marked = open.slice(0, 3).map(function (m) {
            return A.pass(m.pass).name + ": “" + trim(m.text, 90) + "”" +
                   (m.note ? " — they wrote: " + trim(m.note, 90) : "");
          });
        }
        var prof = A.profile(marks);
        if (marks.length) c.reading = prof.shape;
      }
      return c;
    }

    function send(text, raise) {
      if (busy || !live || !text) return;
      busy = true;
      ctrl.setContext(context());
      if (raise) ctrl.raise();
      rungs();
      say("me", esc(text));
      history.push({ role: "user", content: text });
      $("#ttIn").value = "";
      $("#ttSend").disabled = true;
      dot("busy");

      var node = say("it", "");
      node.classList.add("tt-caret");
      var warned = null;
      T.ask(ctrl, history, function (bit, acc) {
        if (warned) { warned.remove(); warned = null; }
        node.textContent = acc;
        log().scrollTop = log().scrollHeight;
      }, function () {
        warned = say("sys", "<b>Loading the model</b>" + esc(ctrl.model || T.MODEL) +
          " has to come off disk before it can answer. That is a one-off per session — " +
          "something smaller answers in about a second.");
      }).then(function (full) {
        if (warned) warned.remove();
        node.classList.remove("tt-caret");
        // The validator is the point of the controller. If the model gave the
        // game away on an activity that does not allow it, the reply is not
        // shown — the student gets the hint they were owed instead.
        if (T.leaks(full, ctrl.answerAllowed())) {
          node.textContent = "";
          node.className = "tt-msg sys";
          node.innerHTML = "<b>Held back</b>That reply gave away the answer, and this is still " +
            "guided practice. Try the next step yourself and tell me what you get — press " +
            "Explain if you genuinely want it worked through.";
          history.push({ role: "assistant", content: "(withheld: revealed the answer)" });
        } else {
          history.push({ role: "assistant", content: full });
        }
        busy = false; dot("live");
      }).catch(function (e) {
        node.classList.remove("tt-caret");
        node.className = "tt-msg sys";
        node.innerHTML = "<b>Lost the connection</b>" + esc(String(e.message || e)) +
          ". Check that <code>ollama serve</code> is still running.";
        busy = false; live = false; dot(null);
      });
    }

    function connect() {
      if (checked) { rungs(); return; }
      checked = true;
      dot(null);
      T.reachable().then(function (ok) {
        live = ok;
        if (!ok) { offline(); rungs(); return; }
        dot("live");
        T.models().then(function (list) {
          var m = T.pick(list);
          if (m) ctrl.model = m.name;
          $("#ttWhere").textContent = (ctrl.model || T.MODEL) + " · on this machine";
          welcome();
          if (T.heavy(m)) {
            say("sys", "<b>" + esc(m.name) + " is the only model installed</b>At " +
              (m.size / 1e9).toFixed(0) + "GB it takes minutes to say its first word, and it " +
              "was not built for teaching. Something small and instruction-tuned is far better " +
              "here:<br><code>ollama pull llama3.2</code><br>Reopen this panel afterwards and " +
              "it picks the better one on its own.");
          }
          rungs();
        });
      });
    }

    function open() {
      $("#ttOpen").classList.add("gone");
      $("#ttOpen").setAttribute("aria-expanded", "true");
      $("#tt").hidden = false;
      connect();
      where();
      setTimeout(function () { $("#ttIn").focus(); }, 260);
    }
    function close() {
      $("#tt").hidden = true;
      $("#ttOpen").classList.remove("gone");
      $("#ttOpen").setAttribute("aria-expanded", "false");
    }
    function where() {
      if (!live) return;
      var c = context();
      $("#ttWhere").textContent = c.section
        ? c.section + (c.title ? " · " + c.title : "")
        : (ctrl.model || T.MODEL) + " · on this machine";
    }

    /* ---- wiring ---- */
    $("#ttOpen").addEventListener("click", open);
    $("#ttClose").addEventListener("click", close);
    $("#ttReset").addEventListener("click", function () {
      history = []; ctrl.reset();
      if (live) { welcome(); rungs(); } else offline();
    });

    var input = $("#ttIn");
    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(120, input.scrollHeight) + "px";
      $("#ttSend").disabled = !input.value.trim() || !live;
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#ttForm").requestSubmit(); }
    });
    $("#ttForm").addEventListener("submit", function (e) {
      e.preventDefault();
      send(input.value.trim(), false);
      input.style.height = "auto";
    });

    [].forEach.call($("#ttQuick").children, function (b) {
      b.addEventListener("click", function () {
        if (!live) { toast("The tutor needs Ollama running on this machine."); return; }
        var kind = b.dataset.ask;
        if (kind === "think") {
          ctrl.mode = "guided";
          say("sys", "<b>Think first</b>Before anything else — what is the first thing you would " +
                     "try here? Say it in one line, however unsure you are.");
          rungs();
          return;
        }
        if (kind === "explain") {
          ctrl.mode = "explain";
          send("I would like this explained properly now, including the answer, and then " +
               "I will say it back to you.", true);
          return;
        }
        ctrl.mode = "guided";
        send("Give me the next hint.", true);
      });
    });

    /* Learn hands the tutor a question that has already gone wrong. It arrives
       with the constraint attached — do not answer it — because the moment a
       student is stuck is exactly the moment the temptation to just be told
       is strongest, and the ladder exists for that moment. */
    function fromLearn(text) {
      open();
      if (!live) { toast("The tutor needs Ollama running on this machine."); return; }
      ctrl.mode = "guided";
      ctrl.level = 0;
      setTimeout(function () { send(text, false); }, 120);
    }

    return { open: open, close: close, where: where, ask: fromLearn,
             note: function (text) { if (!$("#tt").hidden) say("sys", text); } };
  })();

  /* A tab can be closed between two debounced writes. `pagehide` is the one
     event that fires reliably on every path out — closing, navigating,
     backgrounding on iOS — so the last few seconds are written there. */
  window.addEventListener("pagehide", function () { if (R) R.flush(); });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && R) R.flush();
  });

  /* ---------------------------------------------------------------- Wiring */
  [].forEach.call(document.querySelectorAll("#topNav button"), function (b) {
    b.addEventListener("click", function () {
      markSubjectNav(null);
      noFoot(); progress(null);
      if (b.dataset.view === "my") home();
      else if (b.dataset.view === "admin") openAdmin();
      else explore();
    });
  });
  $("#back").addEventListener("click", goBack);

  /* The browser's Back and Forward — including a swipe on a phone. */
  window.addEventListener("popstate", function (e) {
    if (!S.me) return;                         // the sign-in gate is showing
    var pos = e.state && typeof e.state.lx === "number" ? e.state.lx : null;
    var entry = pos != null ? TRAIL[pos] : null;
    RESTORING = true;
    try {
      if (entry) {
        POS = pos;
        S.hist = entry.hist.slice();
        S.here = entry.here;
        entry.here.restore();
      } else {
        S.hist = []; S.here = null;
        home();
      }
    } finally { RESTORING = false; }
    if (!entry) { TRAIL = []; POS = -1; mark(false); }
  });
  $("#user").addEventListener("click", function () { openAccount(); });

  document.addEventListener("keydown", function (e) {
    if (S.view === "cards" && S.keys) S.keys(e);
    else if (S.view === "hangman" && S.hangKeys) S.hangKeys(e);
    else if (S.view === "read" && S.readKeys) S.readKeys(e);
    else if (S.view === "learn" && S.learnKeys) S.learnKeys(e);
  });

})();
