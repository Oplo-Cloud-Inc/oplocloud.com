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
  /* The school: courses, study sets and people, as they are *now* rather than
     as they shipped. Everything below reads through it, so a course written
     this morning and a course written last year are indistinguishable to
     every screen — which is the only way an authoring tool stays honest. */
  var SC = window.OPLO_SCHOOL;
  var API = window.OPLO_API;

  /* Study sets come from two places and the screens below must not have to
     care which. `SC.sets()` is the curriculum published with the site;
     `dbSets` is what this school has written, fetched once at sign-in and
     refreshed after an edit.

     It is a cache of a server fetch, not a source of truth: it is filled from
     the API, it is replaced by the API, and a set that is not in it is a set
     this account is not allowed to study. Keeping it synchronous is what lets
     the rest of the app — openSet, Learn, all three games — stay unchanged.

     A school's own set wins over a shipped one with the same code, because a
     school that has written its own version of a set has said what it wants. */
  var dbSets = {};

  function SETS() {
    var out = SC.sets();
    Object.keys(dbSets).forEach(function (k) { out[k] = dbSets[k]; });
    return out;
  }
  function SET(id) { return dbSets[id] || SC.set(id); }

  /* The API's shape turned into the pair-list the study screens render. The
     richer fields ride along, so a set authored with worked cases can be
     asked at apply and one without is honestly capped. */
  function adoptSet(row) {
    if (!row || !row.terms) return null;
    return {
      t: row.title,
      cards: row.terms.map(function (t) { return [t.term, t.definition]; }),
      rich: row.terms,
      dbId: row.id,
      code: row.code,
      courseId: row.courseId,
      status: row.status,
      visibility: row.visibility,
      createdBy: row.createdBy,
      fromDb: true
    };
  }

  /* Fetches the list, then the terms for each. Two round trips rather than
     one fat endpoint, because the list is what the home screen needs and the
     terms are what a study screen needs, and most sign-ins never open a set. */
  function loadStudySets() {
    if (!API || !S.me) return Promise.resolve(false);
    return API.studySets.mine().then(function (rows) {
      if (!rows.length) return false;
      return Promise.all(rows.map(function (r) {
        return API.studySets.get(r.id).then(adoptSet, function () { return null; });
      })).then(function (full) {
        var changed = false;
        full.forEach(function (set) {
          if (!set) return;
          dbSets[set.code] = set;
          changed = true;
        });
        return changed;
      });
    }, function () { return false; });
  }
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
    /* The number shown is the client's estimate; the number kept is the
       server's. game.js holds the same schedule as services/progress.js so
       the two normally agree, and when they do not the server's answer
       arrives a moment later and replaces this one. The alternative — waiting
       for a round trip before telling a student they got it right — would
       make the app feel broken to buy an accuracy nobody would notice. */
    function answer(o) {
      if (!rec) return 0;
      var a = G.forAnswer(o);
      Sync.report({
        kind: "answer", level: o.level, right: !!o.right, hints: o.hints || 0,
        mastery: o.mastery || 0, gapDays: o.gapDays || 0, confidence: o.confidence
      });
      if (!a.xp) return 0;
      rec.earn(a.xp);
      show(a.xp, a.why);
      paint();
      return a.xp;
    }

    function run(kind, o) {
      if (!rec) return 0;
      Sync.report({ kind: "run", activity: kind, stats: o || {} });
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

      /* Local badges are shown immediately for the ones the server cannot
         see — a Match time, a clean session. The streak and retention badges
         are the server's, granted from the ledger, and arrive through Sync. */
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

  /* ----------------------------------------------------------------- Sync
     The local record is a cache. The database is the truth.

     That sentence decides everything below it. Progress and experience are
     written locally first so the app stays instant and works on a train, and
     then pushed; on sign-in the server's copy is pulled and wins. What is
     never done is the thing that would be easy and wrong — treating whatever
     this browser happens to hold as authoritative because it is nearer.

     Conflict resolution is stated rather than implied: progress is
     last-write-wins per study set, which is safe because the scope is small
     enough that two devices rarely touch the same one, and because losing a
     write here costs a few minutes of drill rather than a grade. Experience
     is not merged at all — it is an append-only ledger on the server, and the
     local number is only ever a copy of what the server last said. */
  var Sync = (function () {
    var pushing = {}, queue = [], flushing = false;

    /* Pull the server's view into the cache. Returns whether anything moved,
       so a screen already on display knows to redraw. */
    function pull() {
      if (!R || !API) return Promise.resolve(false);
      return Promise.all([
        API.gamification.standing().catch(function () { return null; }),
        API.progress.all().catch(function () { return null; })
      ]).then(function (out) {
        var standing = out[0], progress = out[1], changed = false;

        if (standing) {
          var g = R.d.game;
          // The server's totals replace the local ones outright. A local XP
          // count that disagrees with the ledger is simply wrong.
          if (g.xp !== standing.xp || g.streak !== standing.streak) changed = true;
          g.xp = standing.xp;
          g.today = standing.today;
          g.streak = standing.streak;
          g.best = Math.max(g.best || 0, standing.longestStreak || 0);
          (standing.days || []).forEach(function (d) { g.days[d.day] = d.xp; });
          (standing.badges || []).forEach(function (b) { g.badges[b.key] = b.earnedAt; });
          R.d.game.synced = Date.now();
        }

        if (progress) {
          Object.keys(progress).forEach(function (scope) {
            if (scope.indexOf("set:") !== 0) return;
            var setId = scope.slice(4);
            var remote = progress[scope];
            var key = "oplo.learn." + S.me.id + "." + setId;
            var localAt = 0;
            try {
              var raw = localStorage.getItem(key + ".at");
              localAt = raw ? Number(raw) : 0;
            } catch (e) { /* private mode */ }
            // The newer of the two wins, and the timestamps are the server's
            // on one side and this browser's on the other — so a device with
            // a wrong clock loses rather than corrupting the record.
            if (remote.updatedAt > localAt) {
              try {
                localStorage.setItem(key, JSON.stringify(remote.state));
                localStorage.setItem(key + ".at", String(remote.updatedAt));
                changed = true;
              } catch (e) { /* full */ }
            }
          });
        }

        if (changed) R.save();
        return changed;
      });
    }

    /* Push one study set's concept states. Debounced per set, because a
       session answers a question every few seconds and each one would
       otherwise be a request. */
    function pushSet(setId) {
      if (!API || !S.me) return;
      clearTimeout(pushing[setId]);
      pushing[setId] = setTimeout(function () {
        var key = "oplo.learn." + S.me.id + "." + setId;
        var state;
        try { state = JSON.parse(localStorage.getItem(key) || "{}"); }
        catch (e) { return; }
        API.progress.put("set:" + setId, state).then(function () {
          try { localStorage.setItem(key + ".at", String(Date.now())); } catch (e) { /* full */ }
        }).catch(function () { /* offline; the next push carries it */ });
      }, 4000);
    }

    /* Experience events. Batched and retried, because a dropped award is a
       student's work going unrecorded, which is the one thing here worth
       being stubborn about. */
    function report(event) {
      if (!API || !S.me) return;
      queue.push(event);
      if (queue.length > 40) queue.splice(0, queue.length - 40);
      schedule();
    }

    var timer = null;
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(flush, 2500);
    }

    function flush() {
      if (flushing || !queue.length || !API || !S.me) return;
      flushing = true;
      var batch = queue.splice(0, 50);
      API.gamification.report(batch).then(function (r) {
        flushing = false;
        if (R && r) {
          R.d.game.xp = r.xp;
          R.d.game.streak = r.streak;
          R.save();
          Game.paint();
          (r.badges || []).forEach(function (k, i) {
            setTimeout(function () { Game.announce(G.badge(k)); }, 400 + i * 2600);
          });
        }
        if (queue.length) schedule();
      }).catch(function () {
        // Put them back at the front and try again later rather than
        // discarding somebody's work because the network blinked.
        flushing = false;
        queue = batch.concat(queue);
        setTimeout(schedule, 15000);
      });
    }

    function flushNow() {
      clearTimeout(timer);
      if (!queue.length || !API || !S.me) return;
      // A request that has to outlive the document. api.js owns the mechanics
      // of that, the same as it owns every other call.
      API.gamification.beacon(queue.splice(0, 50));
    }

    return { pull: pull, pushSet: pushSet, report: report, flush: flush, flushNow: flushNow };
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

  function enter(key, label, restore, replace) {
    if (S.here && S.here.key === key) { S.here.restore = restore; return; }
    // A finished run is not a place to go back into, so the screen that
    // reports it replaces the run rather than stacking on top of it.
    if (!replace && S.here) {
      S.hist.push(S.here);
      if (S.hist.length > 40) S.hist.shift();
    }
    S.here = { key: key, label: label, restore: restore };
  }

  function root(key, label, restore) {
    S.hist = [];
    S.here = { key: key, label: label, restore: restore };
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

  function goBack() {
    var prev = S.hist.pop();
    if (!prev) { home(); return; }
    S.here = prev;
    prev.restore();
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
    return SC.courses();
  }
  /* What a student is actually enrolled in, according to the database. The
     shipped catalogue is matched to it by code, so a database course called
     `media` shows the written Media Arts curriculum, and one with no shipped
     counterpart appears as itself.

     Before the API answers this is empty rather than guessed. A home screen
     that shows courses a student is not enrolled in, and then removes them a
     second later, is worse than one that waits. */
  function enrolled() {
    var mine = (S.me && S.me.assigned) || [];
    var shipped = allCourses();
    var out = [];
    mine.forEach(function (row) {
      var match = shipped.filter(function (c) { return c.id === row.code; })[0];
      if (match) { match.dbId = row.id; out.push(match); }
      else out.push(fromDbCourse(row));
    });
    return out;
  }

  /* A database course rendered in the shape the catalogue screens expect. */
  function fromDbCourse(row) {
    var body = row.body || {};
    return {
      id: row.code, dbId: row.id, t: row.title,
      subject: row.subject || "Other", level: row.level || "Introductory",
      hue: "#0071e3", d: row.summary || "",
      lede: row.summary || "",
      glyph: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
      parts: [{ name: null, units: body.units || [] }],
      grading: body.grading || null,
      fromDb: true
    };
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
        out.push({ n: n, t: t, part: part.name, set: (c.sets || {})[n] });
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
    return { u: !!u.play, p: !!u.play, r: !!u.set, a: !!u.set };
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
    SC.subjects().forEach(function (sub) {
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

    /* ---- Study sets from your teachers ------------------------------ */
    var given = Object.keys(dbSets).map(function (k) { return [k, dbSets[k]]; });
    if (given.length) {
      v.appendChild(el("h2", "lx-h2", "Set by your teachers"));
      v.appendChild(el("p", "lx-lede",
        given.length === 1
          ? "One study set, written for a course you are in."
          : given.length + " study sets, written for courses you are in."));
      var sg = el("div", "lx-grid");
      given.forEach(function (pair) {
        var id = pair[0], set = pair[1];
        var card = el("button", "lx-setcard");
        card.type = "button";
        var deep = (set.rich || []).filter(function (t) {
          return t.levels && t.levels.indexOf("apply") > -1;
        }).length;
        card.innerHTML = '<span class="ic">' + svg(I.cards, true) + "</span>" +
          "<b>" + esc(set.t) + "</b><span>" + set.cards.length + " terms" +
          (deep ? " · " + deep + " with a worked case" : "") + "</span>";
        card.addEventListener("click", function () { openSet(id); });
        sg.appendChild(card);
      });
      v.appendChild(sg);
    }

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
      out.push({ t: "Learn the terms", d: SET(u.set).cards.length + " terms, drilled three ways",
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
    SETS().__mistakes = S.set;
    startLearn();
  }

  /* --------------------------------------------------------------- Explore */
  function drawExplore() {
    var v = $("#v-explore");
    v.innerHTML = "";
    v.appendChild(el("h1", "lx-h1", "Explore"));
    v.appendChild(el("p", "lx-lede",
      "Every course Oplo has written, by subject. All curriculum is our own."));
    SC.subjects().forEach(function (s) {
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
    SC.subjects().forEach(function (s) {
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
      if (u.set) bits.push(SET(u.set).cards.length + " terms");
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

    if (c.id === "media" && n === 5 && window.OPLO_UNIT5) {
      any = true;
      var b0 = el("div", "lx-block");
      b0.appendChild(el("h2", null, "Sections"));
      window.OPLO_UNIT5.forEach(function (sec, k) {
        var rb = el("button", "lx-item");
        rb.type = "button";
        rb.innerHTML = '<span class="ic">' + svg(S.readDone[sec.n] ? I.tick : I.read, true) + "</span>" +
          '<span class="txt"><b>' + esc(sec.n) + "  " + esc(sec.t) + "</b><span>" +
          esc(sec.kicker) + " \u00b7 " + sec.mins + " min" + (sec.video ? " \u00b7 video" : "") +
          "</span></span>" + '<span class="ic">' + svg(I.chev, true) + "</span>";
        rb.addEventListener("click", function () { openRead(k); });
        b0.appendChild(rb);
      });
      v.appendChild(b0);
    }

    if (u.set) {
      any = true;
      var set = SET(u.set);
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
    if (!silent) enter("set:" + id, trim(SET(id).t), function () { openSet(id, true); });
    S.setId = id; S.set = SET(id);
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
      Sync.pushSet(setId);
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
    var concepts = CN.forSet(setId, SET(setId).cards);
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
    Sync.pushSet(setId);
  }

  /* The terms this student is worst at, weakest first. Every game builds its
     rounds from this rather than from the deck order, so ten minutes of a
     game is ten minutes on the ten things that need it. */
  function weakestFirst(setId) {
    var cards = SET(setId).cards;
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
        var sec = (window.OPLO_UNIT5 || [])[S.readIx];
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
      var U = window.OPLO_UNIT5 || [];
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
          var sec = (window.OPLO_UNIT5 || [])[S.readIx];
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

      /* ------------------------------------------------------ OploContacts
         The directory is the platform's roster, fetched once and cached for
         the life of the panel. It used to be a list in data.js; who a person
         can invite is an account question, and account questions belong to
         the API. */
      var dir = el("div", "rm-dir");
      dir.appendChild(el("h4", null, "OploContacts"));
      var contacts = (S.directory || []).filter(function (c) {
        return !S.me || c.id !== S.me.id;
      });
      if (!contacts.length) {
        dir.appendChild(el("p", "rm-none",
          S.directory ? "No one else in your directory yet." : "Loading your directory\u2026"));
        if (!S.directory && API && S.me) {
          API.accounts.list(S.me.orgId).then(function (people) {
            S.directory = people;
            fillPanel();
          }, function () { S.directory = []; });
        }
      }
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
              var sec = (window.OPLO_UNIT5 || [])[S.readIx];
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
        var sec = (window.OPLO_UNIT5 || [])[S.readIx];
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
  var U5 = window.OPLO_UNIT5 || [];
  var A = window.OPLO_ANNOTATE;

  /* What a quotation from this unit is a quotation from. */
  var SOURCE = {
    title: "Waves and Sound",
    container: "Media Arts, Unit 5",
    author: "Excel High School",
    publisher: "Excel High School",
    year: "2026"
  };
  var DOC = "media-u5";

  function sectionAt(i) { return U5[i]; }
  function secByN(n) { return U5.filter(function (x) { return x.n === n; })[0] || null; }

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
  function openRead(i, silent) {
    var sec = sectionAt(i);
    if (!sec) return;
    if (!silent) enter("read:" + sec.n, sec.n, function () { openRead(i, true); });
    S.readIx = i;
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
    meta.innerHTML = "<b>Media Arts</b><span>Unit 5 · Waves and Sound</span>" +
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
    nb.addEventListener("click", function () { if (nxt) openRead(i + 1); else openSet("media-5"); });
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
    toc.innerHTML = '<h3>Unit 5<span>Waves and Sound</span></h3>';
    var list = el("div", "rd-toc");
    U5.forEach(function (x, k) {
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

    var done = Object.keys(S.readDone).length;
    var prog = el("div", "rd-unitprog");
    prog.innerHTML = '<div class="track"><i style="width:' +
      Math.round(done / U5.length * 100) + '%"></i></div>' +
      "<span>" + done + " of " + U5.length + " sections checked</span>";
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
    var c = sec.check, done = false;
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
        var pct = Math.round(Object.keys(S.readDone).length / U5.length * 100);
        raise(D.MEDIA, 5, "u", pct);
        if (ok) raise(D.MEDIA, 5, "p", pct);
        else slip("problem", "u5:" + sec.n, sec.t, "Missed the check in section " + sec.n + ".");
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

    v.appendChild(el("p", "lx-eyebrow", "Media Arts · Unit 5"));
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
      S.citeStyle = style.value; keep(); render();
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
        var ix = U5.indexOf(secByN(m.sec));
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
        U5.forEach(function (s) {
          var rows = list.filter(function (m) { return m.sec === s.n; });
          if (!rows.length) return;
          out.appendChild(group(esc(s.n) + "  " + esc(s.t), null, rows, function () {
            openRead(U5.indexOf(s));
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
    U5.forEach(function (sec) {
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
  /* --------------------------------------------------------------- Account
     A person's own record: who they are, what they are taking, and what they
     have been graded. Every number on this screen comes from the server —
     which is the difference between a grade a student can trust and a number
     their browser happened to remember.

     It handles an account with no enrolment record, which the previous
     version did not: opening it as an administrator threw, because the
     enrolment block was read unconditionally from a field only students had. */
  function openAccount(silent) {
    if (!silent) enter("account", "Account", function () { openAccount(true); });
    var v = $("#v-account");
    v.innerHTML = "";

    var head = el("div", "lx-acct-head");
    var av = el("span", "av");
    av.textContent = S.me.initials;
    av.style.background = S.me.hue || "";
    head.appendChild(av);
    head.appendChild(el("div", null,
      '<p class="lx-eyebrow" style="margin-bottom:4px">' +
      esc(S.me.title || (S.me.role === "admin" ? "Administrator"
                       : S.me.role === "teacher" ? "Teacher" : "Student account")) +
      '</p><h1 class="lx-h1">' + esc(S.me.name) + "</h1>"));
    v.appendChild(head);

    v.appendChild(el("p", "lx-lede", esc(S.me.email) +
      (S.me.orgs && S.me.orgs.length ? " · " + esc(S.me.orgs[0].name) : "")));

    /* ---- Standing, from the ledger ------------------------------------ */
    var standing = el("div", "lx-panel");
    standing.style.marginTop = "26px";
    standing.innerHTML = "<h3 style=\"font-size:17px\">Your standing</h3>" +
      '<p class="ac-loading">Reading it from the server…</p>';
    v.appendChild(standing);

    API.gamification.standing().then(function (st) {
      standing.innerHTML = "<h3 style=\"font-size:17px\">Your standing</h3>";
      var row = el("div", "lx-stat-row");
      [[st.rank.name, "Rank"], [st.xp.toLocaleString(), "XP"],
       [st.streak, "Day streak"], [(st.badges || []).length, "Badges"]]
        .forEach(function (x) {
          row.innerHTML += '<div class="lx-stat"><b>' + esc(String(x[0])) +
            "</b><span>" + x[1] + "</span></div>";
        });
      standing.appendChild(row);
      standing.appendChild(el("p", null,
        st.rank.next
          ? "<b>" + st.rank.toGo + " XP</b> to " + esc(st.rank.next) + "."
          : "You are at the top of the ladder."));
    }, function (e) {
      standing.innerHTML = "<h3 style=\"font-size:17px\">Your standing</h3>" +
        '<p class="ac-loading">' + esc(e && e.code === "offline"
          ? "Cannot reach the server, so this cannot be shown."
          : "Could not be read.") + "</p>";
    });

    /* ---- Grades ------------------------------------------------------- */
    v.appendChild(el("h2", "lx-h2", "Your grades"));
    var grades = el("div", "ac-grades");
    grades.appendChild(el("p", "ac-loading", "Reading them from the server…"));
    v.appendChild(grades);

    API.grades.list().then(function (data) {
      grades.innerHTML = "";
      var summaries = data.summaries || [];
      if (!summaries.length) {
        grades.appendChild(el("div", "lx-empty",
          "Nothing graded yet. When a teacher enters a mark it appears here — on this " +
          "device and on every other one you sign in on."));
        return;
      }
      summaries.forEach(function (sm) {
        var row = el("div", "ac-grade");
        row.innerHTML = '<span class="t"><b>' + esc(sm.courseTitle || "Course") +
          "</b><span>" + sm.itemCount + (sm.itemCount === 1 ? " item" : " items") +
          " marked · over " + sm.countedWeight + "% of the grade</span></span>" +
          '<span class="mk"><b>' + esc(sm.letter) + "</b><span>" + sm.percent + "%</span></span>";
        row.style.cursor = "pointer";
        row.addEventListener("click", function () { openMyGrades(sm, data.grades); });
        grades.appendChild(row);
      });
      grades.appendChild(el("p", "lx-lede",
        "Grades are entered by your teachers and stored on the Oplo platform. They are " +
        "the same on every device you sign in on, and you cannot change them — which is " +
        "what makes them worth something."));
    }, function (e) {
      grades.innerHTML = "";
      grades.appendChild(el("div", "lx-empty", esc(
        e && e.code === "offline"
          ? "Cannot reach the server, so your grades cannot be shown. They are not stored " +
            "in this browser — that is deliberate."
          : "Your grades could not be read.")));
    });

    /* ---- Courses ------------------------------------------------------ */
    v.appendChild(el("h2", "lx-h2", "Enrolled"));
    var mine = enrolled();
    if (!mine.length) {
      v.appendChild(el("div", "lx-empty",
        "No courses yet. A teacher or administrator enrols you, and they appear here."));
    } else {
      var list = el("div", "ad-list");
      mine.forEach(function (c) {
        var row = el("div", "ad-row");
        row.innerHTML = '<span class="t"><b>' + esc(c.t) + "</b><span>" +
          esc(c.subject || "") + "</span></span>";
        var go = el("button", "lx-btn quiet", "Open");
        go.type = "button";
        go.addEventListener("click", function () { openCourse(c); });
        row.appendChild(go);
        list.appendChild(row);
      });
      v.appendChild(list);
    }

    /* ---- Password ----------------------------------------------------- */
    v.appendChild(el("h2", "lx-h2", "Password"));
    v.appendChild(el("p", "lx-lede",
      "Changed here and nowhere else. Your password is sent once over HTTPS, hashed on " +
      "the server, and never stored in this browser. Changing it signs out every other " +
      "session."));
    var pwForm = el("div", "ad-form");
    var cur = field("Current password", "");
    cur.input.type = "password";
    cur.input.autocomplete = "current-password";
    var next = field("New password", "", "At least 10 characters");
    next.input.type = "password";
    next.input.autocomplete = "new-password";
    pwForm.appendChild(cur);
    pwForm.appendChild(next);
    v.appendChild(pwForm);

    var pwActs = el("div", "ad-acts");
    var change = el("button", "lx-btn", "Change my password");
    change.type = "button";
    change.addEventListener("click", function () {
      if (!cur.input.value || !next.input.value) {
        toast("Both fields, please."); return;
      }
      change.disabled = true;
      change.textContent = "Changing…";
      API.changePassword(cur.input.value, next.input.value).then(function () {
        change.disabled = false;
        change.textContent = "Change my password";
        cur.input.value = ""; next.input.value = "";
        toast("Changed. Every other session has been signed out.");
      }, function (e) {
        change.disabled = false;
        change.textContent = "Change my password";
        toast(e && e.message ? e.message : "That did not work.");
      });
    });
    pwActs.appendChild(change);
    v.appendChild(pwActs);

    /* ---- Sign out ------------------------------------------------------ */
    var out = el("div", "ad-acts");
    var so = el("button", "lx-btn quiet", "Sign out");
    so.type = "button";
    so.addEventListener("click", signOut);
    out.appendChild(so);
    v.appendChild(out);

    noFoot(); progress(null);
    show("account");
  }

  /* The individual marks behind one course grade. "Which piece of work brought
     it down" is the question every student actually has, and a single
     percentage cannot answer it. */
  function openMyGrades(summary, all) {
    enter("mygrades:" + summary.courseId, trim(summary.courseTitle || "Grades"),
          function () { openMyGrades(summary, all); });
    var v = $("#v-account");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", esc(summary.courseTitle || "Course")));
    v.appendChild(el("h1", "lx-h1", summary.letter + " · " + summary.percent + "%"));
    v.appendChild(el("p", "lx-lede",
      "Computed over the " + summary.countedWeight + "% of the grade that has been " +
      "marked so far. Categories with nothing in them are left out rather than counted " +
      "as zero."));

    var parts = el("div", "ad-mark-parts");
    summary.parts.forEach(function (x) {
      var row = el("div", "ad-mark-part");
      row.innerHTML = "<span>" + esc(x.category) + "</span>" +
        '<div class="t"><i style="width:' + x.percent + '%"></i></div>' +
        "<em>" + x.percent + '%</em><span class="w">' + x.weight + "% of the grade · " +
        x.items + (x.items === 1 ? " item" : " items") + "</span>";
      parts.appendChild(row);
    });
    v.appendChild(parts);

    v.appendChild(el("h2", "lx-h2", "Every mark"));
    var list = el("div", "ad-list");
    all.filter(function (g) { return g.courseId === summary.courseId; })
      .forEach(function (g) {
        var row = el("div", "ad-row");
        var pct = g.score != null && g.outOf ? Math.round(g.score / g.outOf * 100) : null;
        row.innerHTML = '<span class="t"><b>' + esc(g.title) + "</b><span>" +
          esc(g.category || "") + (g.feedback ? " · " + esc(g.feedback) : "") + "</span></span>" +
          '<span class="mk">' + (g.score == null ? "—" : g.score + " / " + g.outOf) +
          (pct != null ? " · " + pct + "%" : "") + "</span>";
        list.appendChild(row);
      });
    v.appendChild(list);
    noFoot(); progress(null);
    show("account");
  }

  /* ================================================================ Console
     What an administrator needs is not a second application. It is this one,
     with the ability to see whose work it is.

     Everything on these screens is a call to the platform API. Nothing here
     decides what the person in front of it is allowed to do: it asks for
     something, and the server either does it or refuses with a sentence
     naming the rule. Buttons are hidden from people who cannot use them as a
     courtesy, never as a control — the same page ships with a console in it,
     and a permission system that lives in the markup is not one.

     The practical consequence is worth stating plainly: a grade entered here
     is written to the database and is visible to that student on their own
     laptop the next time they open Learn. That is the whole point of the
     backend existing, and it is the one thing this console could not do
     before it. */

  var TABS = [
    { k: "roster",  name: "Students",  roles: ["admin", "teacher"] },
    { k: "courses", name: "Courses",   roles: ["admin", "teacher"] },
    { k: "sets",    name: "Study sets",roles: ["admin", "teacher"] },
    { k: "people",  name: "People",    roles: ["admin"] },
    { k: "system",  name: "System",    roles: ["admin"] }
  ];

  function allowedTabs() {
    if (!S.me) return [];
    return TABS.filter(function (t) { return t.roles.indexOf(S.me.role) > -1; });
  }

  function openAdmin(silent, tab) {
    if (!allowedTabs().length) return;
    S.tab = tab || S.tab || allowedTabs()[0].k;
    if (!silent) enter("admin:" + S.tab, "Console", function () { openAdmin(true, S.tab); });

    var v = $("#v-admin");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", S.me.role === "admin" ? "Administration" : "Teaching"));
    v.appendChild(el("h1", "lx-h1", "Console"));

    var nav = el("div", "ad-tabs");
    allowedTabs().forEach(function (t) {
      var b = el("button", "ad-tab" + (t.k === S.tab ? " on" : ""));
      b.type = "button";
      b.textContent = t.name;
      b.addEventListener("click", function () { openAdmin(true, t.k); });
      nav.appendChild(b);
    });
    v.appendChild(nav);

    var body = el("div", "ad-body");
    v.appendChild(body);
    ({ roster: tabRoster, courses: tabCourses, sets: tabSets,
       people: tabPeople, system: tabSystem }[S.tab] || tabRoster)(body);

    noFoot(); progress(null);
    show("admin");
  }

  /* Every screen here is waiting on a network call, so the three states a
     network call has — working, failed, empty — are drawn rather than
     assumed. A spinner that never resolves into an error is how a broken
     backend looks like a broken app. */
  function loading(v, what) {
    var n = el("div", "ad-loading", "Loading " + esc(what) + "…");
    v.appendChild(n);
    return n;
  }

  function failed(node, e, retry) {
    node.className = "ad-failed";
    node.innerHTML = "";
    var offline = e && e.code === "offline";
    node.appendChild(el("b", null, offline ? "Cannot reach the Oplo API" : "That did not load"));
    node.appendChild(el("p", null, esc(
      offline ? "The platform API at " + API.base() + " is not answering. Nothing here can " +
                "be shown or changed until it is — this console reads and writes the " +
                "database, and there is no local copy standing in for it."
              : (e && e.message) || "The server refused that request.")));
    if (retry) {
      var again = el("button", "lx-btn quiet", "Try again");
      again.type = "button";
      again.addEventListener("click", retry);
      node.appendChild(again);
    }
  }

  /* An action whose failure is the server refusing, and which says so. */
  function attempt(promise, done) {
    return promise.then(function (r) { if (done) done(r); }, function (e) {
      toast(e && e.message ? e.message : "The server refused that.");
    });
  }

  function field(label, value, hint) {
    var f = el("label", "ad-field");
    f.innerHTML = "<span>" + esc(label) + "</span>";
    var i = el("input");
    i.type = "text";
    i.value = value == null ? "" : value;
    if (hint) i.placeholder = hint;
    f.appendChild(i);
    f.input = i;
    return f;
  }

  function areaField(label, value, hint, rows) {
    var f = el("label", "ad-field");
    f.innerHTML = "<span>" + esc(label) + "</span>";
    var i = el("textarea");
    i.rows = rows || 3;
    i.value = value == null ? "" : value;
    if (hint) i.placeholder = hint;
    f.appendChild(i);
    f.input = i;
    return f;
  }

  function avatarFor(p) {
    var av = el("span", "ad-av");
    av.style.background = p.hue || "#6e6e73";
    av.textContent = p.initials ||
      String(p.name || "?").split(/\s+/).map(function (w) { return w[0]; })
        .join("").slice(0, 2).toUpperCase();
    return av;
  }

  /* ------------------------------------------------------------- Students
     For a teacher this is the students in the courses they teach — which is
     what "their students" means on the server too, so the screen and the
     permission agree by construction rather than by being kept in step. */
  function tabRoster(v) {
    var node = loading(v, "your courses");

    API.courses.mine().then(function (courses) {
      var teaching = S.me.role === "admin"
        ? courses
        : courses.filter(function (c) { return c.myRole === "teacher" || c.myRole === "assistant"; });

      if (!teaching.length) {
        node.className = "lx-empty";
        node.textContent = S.me.role === "admin"
          ? "No courses yet. Create one on the Courses tab, then enrol students into it."
          : "You are not teaching any courses yet. An administrator enrols you as a teacher, " +
            "and the students on those courses appear here.";
        return;
      }

      node.remove();
      v.appendChild(el("p", "lx-lede",
        teaching.length + (teaching.length === 1 ? " course" : " courses") +
        ". A grade entered here is written to the database and is visible to that student " +
        "on their own device."));

      teaching.forEach(function (c) { v.appendChild(courseRoster(c)); });
    }, function (e) { failed(node, e, function () { openAdmin(true, "roster"); }); });
  }

  function courseRoster(course) {
    var wrap = el("section", "ad-course");
    var head = el("header", "ad-course-head");
    head.innerHTML = "<h2>" + esc(course.title) + "</h2><span>" +
      esc(course.subject || "") + " · " + esc(course.code) + "</span>";
    wrap.appendChild(head);

    var body = el("div");
    wrap.appendChild(body);
    var node = loading(body, "the roster");

    Promise.all([
      API.courses.members(course.id),
      API.courses.assignments(course.id),
      API.grades.list({ courseId: course.id })
    ]).then(function (out) {
      var members = out[0], assignments = out[1], grades = out[2];
      node.remove();

      var students = members.filter(function (m) { return m.role === "student"; });
      var byStudent = {};
      (grades.summaries || []).forEach(function (sm) { /* per course, not per student */ });

      var acts = el("div", "ad-acts");
      var addWork = el("button", "lx-btn quiet",
        assignments.length ? assignments.length + " pieces of work" : "Set some work");
      addWork.type = "button";
      addWork.addEventListener("click", function () { openAssignments(course); });
      acts.appendChild(addWork);

      var enrol = el("button", "lx-btn quiet", "Enrol a student");
      enrol.type = "button";
      enrol.addEventListener("click", function () { openEnrol(course); });
      acts.appendChild(enrol);
      body.appendChild(acts);

      if (!students.length) {
        body.appendChild(el("div", "lx-empty",
          "Nobody is enrolled yet. Enrol a student and their work appears here."));
        return;
      }

      var grid = el("div", "ad-grid");
      students.forEach(function (st) {
        grid.appendChild(studentCard(st, course, assignments));
      });
      body.appendChild(grid);
    }, function (e) { failed(node, e, function () { openAdmin(true, "roster"); }); });

    return wrap;
  }

  function studentCard(p, course, assignments) {
    var c = el("article", "ad-card");

    var head = el("header", "ad-head");
    head.appendChild(avatarFor(p));
    head.appendChild(el("div", "ad-who", "<b>" + esc(p.name) + "</b><span>" +
      esc(p.email || "") + "</span>"));
    c.appendChild(head);

    var markSlot = el("div", "ad-books");
    markSlot.appendChild(el("p", "ad-shape quiet", "Reading their grade…"));
    c.appendChild(markSlot);

    /* Their mark, from the server. Asked per student rather than computed in
       the page, so the number a teacher sees is the number the student sees —
       there is one implementation of the weighting and it is on the server. */
    API.grades.list({ courseId: course.id, accountId: p.id }).then(function (r) {
      markSlot.innerHTML = "";
      var sum = (r.summaries || [])[0];
      var row = el("button", "ad-book");
      row.type = "button";
      row.innerHTML = "<b>" + esc(course.title) + "</b>" +
        (sum ? '<span class="mk"><em>' + sum.letter + "</em>" + sum.percent + "%</span>"
             : '<span class="mk none">no marks yet</span>');
      row.addEventListener("click", function () { openGradebook(p, course, assignments); });
      markSlot.appendChild(row);
      if (sum && sum.countedWeight < sum.totalWeight) {
        markSlot.appendChild(el("p", "ad-shape quiet",
          "Over the " + sum.countedWeight + "% of the grade marked so far."));
      }
    }, function () {
      markSlot.innerHTML = "";
      markSlot.appendChild(el("p", "ad-shape quiet", "Could not read their grade."));
    });

    /* What they have actually done in the app. Progress is theirs and is
       readable by their teachers; it is not writable by anybody but them. */
    var work = el("div", "ad-stats");
    work.appendChild(el("div", "ad-stat", "<b>…</b><span>XP</span>"));
    c.appendChild(work);
    API.gamification.standing(p.id).then(function (st) {
      work.innerHTML = "";
      [["XP", st.xp], ["Streak", st.streak], ["Rank", st.rank.name],
       ["Badges", (st.badges || []).length]].forEach(function (x) {
        var b = el("div", "ad-stat");
        b.innerHTML = "<b>" + esc(String(x[1])) + "</b><span>" + x[0] + "</span>";
        work.appendChild(b);
      });
    }, function () {
      work.innerHTML = "";
      work.appendChild(el("p", "ad-shape quiet", "No activity recorded yet."));
    });

    var acts = el("div", "ad-acts");
    var grade = el("button", "lx-btn", "Grades");
    grade.type = "button";
    grade.addEventListener("click", function () { openGradebook(p, course, assignments); });
    acts.appendChild(grade);
    c.appendChild(acts);
    return c;
  }

  /* ------------------------------------------------------------ Enrolment */
  function openEnrol(course) {
    enter("enrol:" + course.id, trim(course.title), function () { openEnrol(course); });
    var v = $("#v-admin");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", esc(course.title)));
    v.appendChild(el("h1", "lx-h1", "Who is in this course"));
    var node = loading(v, "people");

    Promise.all([API.accounts.list(S.me.orgId), API.courses.members(course.id)])
      .then(function (out) {
        var people = out[0], members = out[1];
        node.remove();
        var inCourse = {};
        members.forEach(function (m) { inCourse[m.id] = m.role; });

        v.appendChild(el("p", "lx-lede",
          "Enrolling a student is what gives you permission to grade them. The server " +
          "checks that relationship on every write, so this list is the permission, " +
          "not a display of it."));

        var list = el("div", "ad-picklist");
        people.forEach(function (p) {
          if (p.id === S.me.id) return;
          var row = el("label", "ad-pick");
          var box = el("input");
          box.type = "checkbox";
          box.checked = inCourse[p.id] === "student";
          box.addEventListener("change", function () {
            box.disabled = true;
            attempt(API.courses.enrol(course.id, p.id, "student", !box.checked), function () {
              box.disabled = false;
              toast(box.checked ? p.name + " enrolled." : p.name + " removed from the course.");
            }).then(function () { box.disabled = false; });
          });
          row.appendChild(box);
          row.appendChild(avatarFor(p));
          row.appendChild(el("span", "t", "<b>" + esc(p.name) + "</b><span>" +
            esc(p.email || "") + (inCourse[p.id] && inCourse[p.id] !== "student"
              ? " · " + esc(inCourse[p.id]) : "") + "</span>"));
          list.appendChild(row);
        });
        v.appendChild(list);
        show("admin");
      }, function (e) { failed(node, e, function () { openEnrol(course); }); });
    show("admin");
  }

  /* ---------------------------------------------------------- Assignments */
  function openAssignments(course) {
    enter("work:" + course.id, "Work", function () { openAssignments(course); });
    var v = $("#v-admin");

    function render() {
      v.innerHTML = "";
      v.appendChild(el("p", "lx-eyebrow", esc(course.title)));
      v.appendChild(el("h1", "lx-h1", "Work set on this course"));
      var node = loading(v, "the list");

      API.courses.assignments(course.id).then(function (items) {
        node.remove();
        var weights = (course.body && course.body.grading) || [["Work", 100]];
        v.appendChild(el("p", "lx-lede",
          "Each piece counts towards a category, and the categories carry the weights " +
          "the course sets: " + weights.map(function (w) { return w[0] + " " + w[1] + "%"; })
            .join(", ") + "."));

        var list = el("div", "ad-list");
        items.forEach(function (a) {
          var row = el("div", "ad-row");
          row.innerHTML = '<span class="t"><b>' + esc(a.title) + "</b><span>" +
            esc(a.category || "uncategorised") + " · out of " + a.outOf + "</span></span>";
          var rm = el("button", "ad-x");
          rm.type = "button";
          rm.setAttribute("aria-label", "Remove " + a.title);
          rm.innerHTML = svg(I.close, true);
          rm.addEventListener("click", function () {
            if (!confirm("Remove “" + a.title + "” and every grade on it?")) return;
            attempt(API.courses.removeAssignment(a.id), render);
          });
          row.appendChild(rm);
          list.appendChild(row);
        });
        if (!items.length) {
          list.appendChild(el("div", "lx-empty",
            "Nothing set yet. Add a quiz or an assignment and you can start grading it."));
        }
        v.appendChild(list);

        var form = el("div", "ad-form");
        var title = field("Title", "", "Unit 5 quiz");
        var catF = el("label", "ad-field");
        catF.innerHTML = "<span>Category</span>";
        var cat = el("select");
        weights.forEach(function (w) {
          var o = el("option");
          o.value = w[0]; o.textContent = w[0] + " (" + w[1] + "% of the grade)";
          cat.appendChild(o);
        });
        catF.appendChild(cat);
        var outOf = field("Out of", "20");
        [title, catF, outOf].forEach(function (f) { form.appendChild(f); });
        v.appendChild(form);

        var acts = el("div", "ad-acts");
        var add = el("button", "lx-btn lg", "Set this work");
        add.type = "button";
        add.addEventListener("click", function () {
          if (!title.input.value.trim()) { toast("Give it a title."); return; }
          add.disabled = true;
          attempt(API.courses.addAssignment(course.id, {
            title: title.input.value.trim(),
            category: cat.value,
            outOf: Number(outOf.input.value) || 100
          }), function () { toast("Added."); render(); })
            .then(function () { add.disabled = false; });
        });
        acts.appendChild(add);
        v.appendChild(acts);
        show("admin");
      }, function (e) { failed(node, e, render); });
      show("admin");
    }

    render();
  }

  /* ----------------------------------------------------------- Gradebook
     The screen the whole backend exists for. A number typed here is a PUT to
     /api/v1/grades, checked against whether this person teaches the course,
     and stored. The student reads it from the same table on another machine. */
  function openGradebook(p, course, assignments) {
    enter("grades:" + p.id + ":" + course.id, "Grades",
          function () { openGradebook(p, course, assignments); });
    var v = $("#v-admin");

    function render() {
      v.innerHTML = "";
      v.appendChild(el("p", "lx-eyebrow", esc(p.name) + " · " + esc(course.title)));
      v.appendChild(el("h1", "lx-h1", "Gradebook"));
      var node = loading(v, "their marks");

      Promise.all([
        assignments ? Promise.resolve(assignments) : API.courses.assignments(course.id),
        API.grades.list({ courseId: course.id, accountId: p.id })
      ]).then(function (out) {
        var work = out[0], data = out[1];
        node.remove();

        var byAssignment = {};
        (data.grades || []).forEach(function (g) { byAssignment[g.assignmentId] = g; });
        var sum = (data.summaries || [])[0];

        var head = el("div", "ad-mark");
        if (sum) {
          head.innerHTML = '<div class="big"><b>' + sum.letter + "</b><span>" +
            sum.percent + "%</span></div>";
          var parts = el("div", "ad-mark-parts");
          sum.parts.forEach(function (x) {
            var row = el("div", "ad-mark-part");
            row.innerHTML = "<span>" + esc(x.category) + "</span>" +
              '<div class="t"><i style="width:' + x.percent + '%"></i></div>' +
              "<em>" + x.percent + '%</em><span class="w">' + x.weight +
              "% of the grade · " + x.items +
              (x.items === 1 ? " item" : " items") + "</span>";
            parts.appendChild(row);
          });
          head.appendChild(parts);
          if (sum.countedWeight < sum.totalWeight) {
            head.appendChild(el("p", "ad-mark-say",
              "Computed over the " + sum.countedWeight + "% of the grade that has been " +
              "marked. Categories with nothing in them are left out rather than counted " +
              "as zero — a student who has not sat the final has not failed it."));
          }
        } else {
          head.innerHTML = '<p class="ad-shape quiet">Nothing marked yet.</p>';
        }
        v.appendChild(head);

        if (!work.length) {
          v.appendChild(el("div", "lx-empty",
            "No work has been set on this course, so there is nothing to mark."));
          var setBtn = el("button", "lx-btn", "Set some work");
          setBtn.type = "button";
          setBtn.addEventListener("click", function () { openAssignments(course); });
          v.appendChild(setBtn);
          show("admin");
          return;
        }

        var table = el("div", "ad-table");
        var hd = el("div", "ad-tr head");
        hd.innerHTML = "<span>Work</span><span>Category</span><span>Score</span>" +
          "<span>Out of</span><span></span>";
        table.appendChild(hd);

        work.forEach(function (a) {
          var g = byAssignment[a.id];
          var tr = el("div", "ad-tr");
          tr.appendChild(el("span", "ad-cellname", esc(a.title)));
          tr.appendChild(el("span", "ad-cellcat", esc(a.category || "—")));

          var got = el("input");
          got.type = "number"; got.min = "0"; got.step = "0.5";
          got.value = g && g.score != null ? g.score : "";
          got.placeholder = "—";
          tr.appendChild(got);

          tr.appendChild(el("span", "ad-cellout", String(a.outOf)));

          var state = el("span", "ad-cellstate");
          tr.appendChild(state);

          /* Written when the field loses focus, not on every keystroke. A
             PUT per digit would mean "9" is briefly stored while somebody
             types "95", and a grade that flickers is a grade a student sees. */
          var last = got.value;
          got.addEventListener("blur", function () {
            if (got.value === last) return;
            last = got.value;
            var score = got.value === "" ? null : Number(got.value);
            state.textContent = "Saving…";
            state.className = "ad-cellstate busy";
            API.grades.put(a.id, p.id, score, a.outOf).then(function () {
              state.textContent = "Saved";
              state.className = "ad-cellstate ok";
              setTimeout(function () { state.textContent = ""; }, 1600);
              render();
            }, function (e) {
              state.textContent = "Refused";
              state.className = "ad-cellstate bad";
              toast(e && e.message ? e.message : "The server refused that grade.");
            });
          });
          table.appendChild(tr);
        });
        v.appendChild(table);

        v.appendChild(el("p", "lx-lede",
          "Saved to the database as you go. " + esc(p.first || p.name) +
          " sees this on their own device the next time they open Learn."));
        show("admin");
      }, function (e) { failed(node, e, render); });
      show("admin");
    }

    render();
  }

  /* -------------------------------------------------------------- Courses */
  function tabCourses(v) {
    var node = loading(v, "courses");
    API.courses.mine().then(function (courses) {
      node.remove();
      v.appendChild(el("p", "lx-lede",
        "Courses in the database. These are the ones that carry enrolment, work and " +
        "grades. The catalogue on the Explore tab is the shipped curriculum — " +
        "published content that lives in the site's files, not in the database."));

      var acts = el("div", "ad-acts");
      var add = el("button", "lx-btn", "New course");
      add.type = "button";
      add.addEventListener("click", function () { openCourseEditor(null); });
      acts.appendChild(add);
      v.appendChild(acts);

      var list = el("div", "ad-list");
      courses.forEach(function (c) {
        var row = el("div", "ad-row");
        row.innerHTML = '<span class="t"><b>' + esc(c.title) + "</b><span>" +
          esc(c.subject || "") + " · " + esc(c.code) + " · " + esc(c.status) +
          (c.myRole ? " · you are " + esc(c.myRole) : "") + "</span></span>";
        var edit = el("button", "lx-btn quiet", "Edit");
        edit.type = "button";
        edit.addEventListener("click", function () { openCourseEditor(c); });
        row.appendChild(edit);
        list.appendChild(row);
      });
      if (!courses.length) {
        list.appendChild(el("div", "lx-empty",
          "No courses in the database yet. Create one, enrol students, and you can " +
          "set work and grade it."));
      }
      v.appendChild(list);
    }, function (e) { failed(node, e, function () { openAdmin(true, "courses"); }); });
  }

  function openCourseEditor(c) {
    var making = !c;
    enter("course-edit:" + (c ? c.id : "new"), making ? "New course" : trim(c.title),
          function () { openCourseEditor(c); });
    var v = $("#v-admin");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", making ? "New course" : "Course"));
    v.appendChild(el("h1", "lx-h1", making ? "Create a course" : esc(c.title)));

    var body = (c && c.body) || {};
    var form = el("div", "ad-form");
    var code = field("Code", c ? c.code : "", "a short slug, e.g. media-arts");
    if (!making) code.input.disabled = true;
    var title = field("Title", c ? c.title : "", "Media Arts");
    var subject = field("Subject", c ? c.subject : "", "English");
    var level = field("Level", c ? c.level : "Introductory");
    var summary = areaField("Summary", c ? c.summary : "", "What this course is, in a sentence.");
    var grading = areaField("Grading",
      (body.grading || [["Quizzes", 35], ["Assignments", 35], ["Exams", 30]])
        .map(function (g) { return g[0] + " = " + g[1]; }).join("\n"),
      "One category per line, as Name = percent. They should add to 100.", 5);
    var units = areaField("Units", (body.units || []).join("\n"), "One unit per line.", 6);
    [code, title, subject, level, summary, grading, units].forEach(function (f) {
      form.appendChild(f);
    });
    v.appendChild(form);

    var acts = el("div", "ad-acts");
    var save = el("button", "lx-btn lg", making ? "Create" : "Save");
    save.type = "button";
    save.addEventListener("click", function () {
      var weights = grading.input.value.split("\n").map(function (line) {
        var bits = line.split("=");
        if (bits.length < 2) return null;
        var pct = Number(bits[1].trim());
        if (!bits[0].trim() || !isFinite(pct)) return null;
        return [bits[0].trim(), pct];
      }).filter(Boolean);
      var total = weights.reduce(function (a, w) { return a + w[1]; }, 0);
      if (weights.length && Math.abs(total - 100) > 0.5) {
        toast("The grading weights add to " + total + "%, not 100%.");
        return;
      }
      var payload = {
        title: title.input.value.trim(),
        subject: subject.input.value.trim(),
        level: level.input.value.trim(),
        summary: summary.input.value.trim(),
        status: "published",
        body: {
          grading: weights,
          units: units.input.value.split("\n").map(function (x) { return x.trim(); })
                      .filter(Boolean)
        }
      };
      if (!payload.title) { toast("A course needs a title."); return; }
      save.disabled = true;
      var go = making
        ? API.courses.create(Object.assign({ code: code.input.value.trim().toLowerCase(),
                                             orgId: S.me.orgId }, payload))
        : API.courses.update(c.id, payload);
      attempt(go, function () {
        toast(making ? "Course created." : "Saved.");
        goBack();
      }).then(function () { save.disabled = false; });
    });
    acts.appendChild(save);
    v.appendChild(acts);
    show("admin");
  }

  /* ----------------------------------------------------------- Study sets
     Written by teachers, studied by their classes, stored in the database.

     Until this existed the tab carried a warning saying sets reached nobody
     but the person who wrote them. The warning is gone because the thing it
     described is gone — which is the only honest way for a label like that to
     disappear. */
  function tabSets(v) {
    var node = loading(v, "study sets");

    Promise.all([
      API.studySets.authored(),
      API.courses.mine()
    ]).then(function (out) {
      var sets = out[0], courses = out[1];
      node.remove();

      v.appendChild(el("p", "lx-lede",
        "A set published to a course appears for every student in it, on every device " +
        "they sign in on. It works in Flashcards, Learn, Match, Test and all three games."));

      var acts = el("div", "ad-acts");
      var add = el("button", "lx-btn", "New study set");
      add.type = "button";
      add.addEventListener("click", function () { openSetEditor(null, courses); });
      acts.appendChild(add);
      v.appendChild(acts);

      var list = el("div", "ad-list");
      sets.forEach(function (st) {
        var course = courses.filter(function (c) { return c.id === st.courseId; })[0];
        var row = el("div", "ad-row");
        row.innerHTML = '<span class="t"><b>' + esc(st.title) + "</b><span>" +
          st.termCount + (st.termCount === 1 ? " term" : " terms") +
          (course ? " · " + esc(course.title) : " · not attached to a course") +
          " · " + esc(st.status) + "</span></span>";
        var edit = el("button", "lx-btn quiet", "Edit");
        edit.type = "button";
        edit.addEventListener("click", function () { openSetEditor(st.id, courses); });
        row.appendChild(edit);
        list.appendChild(row);
      });
      if (!sets.length) {
        list.appendChild(el("div", "lx-empty",
          "You have not written any yet. A set needs four terms to work — the games " +
          "need something to choose between."));
      }
      v.appendChild(list);

      /* The curriculum that ships with the site, listed so nobody wonders
         where the built-in sets went. They are read-only here: they are
         published content, and one school editing them would edit them for
         everybody. */
      var shipped = SC.sets();
      var ids = Object.keys(shipped).filter(function (k) { return k.indexOf("__") !== 0; });
      if (ids.length) {
        v.appendChild(el("h2", "lx-h2", "Shipped with the site"));
        v.appendChild(el("p", "lx-lede",
          "Published curriculum, read-only. To make a school version of one, write a new " +
          "set with the same terms — it will take precedence for your students."));
        var sl = el("div", "ad-list");
        ids.forEach(function (id) {
          var row = el("div", "ad-row");
          row.innerHTML = '<span class="t"><b>' + esc(shipped[id].t) + "</b><span>" +
            esc(id) + " · " + shipped[id].cards.length + " terms</span></span>";
          sl.appendChild(row);
        });
        v.appendChild(sl);
      }
    }, function (e) { failed(node, e, function () { openAdmin(true, "sets"); }); });
  }

  function openSetEditor(setId, courses) {
    var making = !setId;
    enter("set-edit:" + (setId || "new"), making ? "New set" : "Study set",
          function () { openSetEditor(setId, courses); });
    var v = $("#v-admin");

    function draw(set) {
      var rows = set && set.terms
        ? set.terms.map(function (t) {
            return { term: t.term, definition: t.definition,
                     why: t.why || "", example: t.example || "" };
          })
        : [{ term: "", definition: "", why: "", example: "" }];

      /* The header fields live out here with the rows, not inside render().
         Adding a term redraws the whole editor, and a redraw that rebuilds
         the title from the saved set silently discards what the author has
         typed — so somebody who names a set, writes four terms and then adds
         a fifth loses the name and does not notice until the save fails. */
      var head = {
        code: set ? set.code : "",
        title: set ? set.title : "",
        courseId: set ? (set.courseId || "") : "",
        status: set ? set.status : "draft"
      };

      function render() {
        v.innerHTML = "";
        v.appendChild(el("p", "lx-eyebrow", making ? "New study set" : "Study set"));
        v.appendChild(el("h1", "lx-h1", making ? "Write a study set" : esc(set.title)));

        var form = el("div", "ad-form");
        var code = field("Code", head.code, "e.g. waves-and-sound");
        if (!making) code.input.disabled = true;
        code.input.addEventListener("input", function () { head.code = code.input.value; });
        var title = field("Title", head.title, "What this set covers");
        title.input.addEventListener("input", function () { head.title = title.input.value; });

        var courseF = el("label", "ad-field");
        courseF.innerHTML = "<span>Course</span>";
        var courseSel = el("select");
        var none = el("option");
        none.value = ""; none.textContent = "Not attached to a course";
        courseSel.appendChild(none);
        (courses || []).forEach(function (c) {
          if (c.myRole !== "teacher" && c.myRole !== "assistant" && S.me.role !== "admin") return;
          var o = el("option");
          o.value = c.id; o.textContent = c.title;
          if (head.courseId === c.id) o.selected = true;
          courseSel.appendChild(o);
        });
        courseSel.addEventListener("change", function () { head.courseId = courseSel.value; });
        courseF.appendChild(courseSel);

        var statusF = el("label", "ad-field");
        statusF.innerHTML = "<span>Who can see it</span>";
        var statusSel = el("select");
        [["draft", "Draft — only you, until you publish it"],
         ["published", "Published — the course it is attached to"]].forEach(function (r) {
          var o = el("option");
          o.value = r[0]; o.textContent = r[1];
          if (head.status === r[0]) o.selected = true;
          statusSel.appendChild(o);
        });
        statusSel.addEventListener("change", function () { head.status = statusSel.value; });
        statusF.appendChild(statusSel);

        [code, title, courseF, statusF].forEach(function (f) { form.appendChild(f); });
        v.appendChild(form);

        v.appendChild(el("h2", "lx-h2", "Terms"));
        v.appendChild(el("p", "lx-lede",
          "Every definition has to stand on its own: in Match, Test and the games it is " +
          "shown without its term beside it. A term with a reason and an example can also " +
          "be asked as a case to work through — without them it stops at explanation."));

        var depth = el("p", "ad-depth");
        v.appendChild(depth);
        function say() {
          var full = rows.filter(function (r) {
            return r.term.trim() && r.definition.trim() && r.why.trim() && r.example.trim();
          }).length;
          var done = rows.filter(function (r) {
            return r.term.trim() && r.definition.trim();
          }).length;
          depth.textContent = done < 4
            ? done + " of the four terms a set needs so far."
            : done + " terms, " + full + " with a worked case" +
              (full === done ? " — every one can be asked at apply."
                             : ". The other " + (done - full) + " stop at explanation.");
        }

        var table = el("div", "ad-table terms");
        var hd = el("div", "ad-tr head");
        hd.innerHTML = "<span>Term</span><span>Definition</span>" +
          "<span>Why it matters</span><span>An example</span><span></span>";
        table.appendChild(hd);

        rows.forEach(function (r, ix) {
          var tr = el("div", "ad-tr");
          function box(key, placeholder, rowsN) {
            var i = rowsN ? el("textarea") : el("input");
            if (rowsN) i.rows = rowsN; else i.type = "text";
            i.value = r[key];
            i.placeholder = placeholder;
            i.addEventListener("input", function () { r[key] = i.value; say(); });
            return i;
          }
          tr.appendChild(box("term", "Term"));
          tr.appendChild(box("definition", "A definition that stands on its own.", 2));
          tr.appendChild(box("why", "Optional — why this is worth knowing.", 2));
          tr.appendChild(box("example", "Optional — one concrete instance.", 2));
          var del = el("button", "ad-x");
          del.type = "button";
          del.setAttribute("aria-label", "Remove this term");
          del.innerHTML = svg(I.close, true);
          del.addEventListener("click", function () { rows.splice(ix, 1); render(); });
          tr.appendChild(del);
          table.appendChild(tr);
        });
        v.appendChild(table);
        say();

        var acts = el("div", "ad-acts");
        var add = el("button", "lx-btn quiet", "Add a term");
        add.type = "button";
        add.addEventListener("click", function () {
          rows.push({ term: "", definition: "", why: "", example: "" });
          render();
        });
        acts.appendChild(add);

        var save = el("button", "lx-btn lg", making ? "Create the set" : "Save");
        save.type = "button";
        save.addEventListener("click", function () {
          var terms = rows.map(function (r) {
            return { term: r.term.trim(), definition: r.definition.trim(),
                     why: r.why.trim() || null, example: r.example.trim() || null };
          }).filter(function (r) { return r.term && r.definition; });

          var payload = {
            title: head.title.trim(),
            courseId: head.courseId || null,
            status: head.status,
            terms: terms
          };
          if (!payload.title) { toast("A set needs a title."); return; }

          save.disabled = true;
          var go = making
            ? API.studySets.create(Object.assign(
                { code: head.code.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  orgId: S.me.orgId }, payload))
            : API.studySets.update(setId, payload);

          /* The cache is refilled from the server rather than patched from
             what was typed. The server may have normalised something, and a
             cache that diverges from the source is worse than no cache. */
          attempt(go, function (saved) {
            loadStudySets().then(function () {
              toast(making
                ? (payload.status === "published"
                    ? "Created and published to the course."
                    : "Created as a draft — only you can see it until you publish it.")
                : "Saved.");
              goBack();
            });
          }).then(function () { save.disabled = false; });
        });
        acts.appendChild(save);

        if (!making) {
          var arch = el("button", "lx-btn quiet", "Archive");
          arch.type = "button";
          arch.addEventListener("click", function () {
            if (!confirm("Archive “" + set.title + "”? Students stop seeing it. " +
                         "It is not deleted.")) return;
            attempt(API.studySets.archive(setId), function () {
              delete dbSets[set.code];
              toast("Archived.");
              goBack();
            });
          });
          acts.appendChild(arch);
        }
        v.appendChild(acts);
        show("admin");
      }

      render();
    }

    if (making) { draw(null); return; }
    v.innerHTML = "";
    var node = loading(v, "the set");
    show("admin");
    API.studySets.get(setId).then(function (set) { draw(set); },
                                 function (e) { failed(node, e, function () {
                                   openSetEditor(setId, courses); }); });
  }

  /* --------------------------------------------------------------- People */  /* --------------------------------------------------------------- People */
  function tabPeople(v) {
    var node = loading(v, "people");
    API.accounts.list(S.me.orgId).then(function (people) {
      node.remove();
      v.appendChild(el("p", "lx-lede",
        people.length + (people.length === 1 ? " account" : " accounts") +
        ". An Oplo Account, not a Learn account — the same sign-in carries a person " +
        "into every Oplo product they are authorised for, and roles are held per product."));

      var acts = el("div", "ad-acts");
      var add = el("button", "lx-btn", "Add a person");
      add.type = "button";
      add.addEventListener("click", function () { openPersonEditor(null); });
      acts.appendChild(add);
      v.appendChild(acts);

      var list = el("div", "ad-list");
      people.forEach(function (p) {
        var row = el("div", "ad-row");
        row.appendChild(avatarFor(p));
        row.appendChild(el("span", "t", "<b>" + esc(p.name) + "</b><span>" +
          esc(p.email || "") + (p.title ? " · " + esc(p.title) : "") + "</span>"));
        var edit = el("button", "lx-btn quiet", "Edit");
        edit.type = "button";
        edit.addEventListener("click", function () { openPersonEditor(p); });
        row.appendChild(edit);
        list.appendChild(row);
      });
      v.appendChild(list);
    }, function (e) { failed(node, e, function () { openAdmin(true, "people"); }); });
  }

  function openPersonEditor(p) {
    var making = !p;
    enter("person:" + (p ? p.id : "new"), making ? "New person" : (p.firstName || p.name),
          function () { openPersonEditor(p); });
    var v = $("#v-admin");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", making ? "New person" : "Person"));
    v.appendChild(el("h1", "lx-h1", making ? "Add somebody" : esc(p.name)));

    var form = el("div", "ad-form");
    var name = field("Full name", p ? p.name : "");
    var email = field("Email", p ? p.email : "");
    if (!making) email.input.disabled = true;
    var title = field("Title", p ? p.title : "", "High School Silver Program");

    var roleF = el("label", "ad-field");
    roleF.innerHTML = "<span>Role in Oplo Learn</span>";
    var role = el("select");
    [["student", "Student — their own work"],
     ["teacher", "Teacher — the courses they teach"],
     ["author", "Author — content they write"],
     ["admin", "Administrator — the whole school"]].forEach(function (r) {
      var o = el("option");
      o.value = r[0]; o.textContent = r[1];
      role.appendChild(o);
    });
    roleF.appendChild(role);

    var pw = field("Password", "", making ? "At least 10 characters" : "");
    pw.input.type = "password";
    pw.input.autocomplete = "new-password";

    [name, email, title, roleF].forEach(function (f) { form.appendChild(f); });
    if (making) form.appendChild(pw);
    v.appendChild(form);

    if (making) {
      v.appendChild(el("p", "lx-lede",
        "The password is sent once, over HTTPS, and hashed on the server. It is never " +
        "stored anywhere in this page and never reaches the database in a readable form."));
    } else {
      v.appendChild(el("p", "lx-lede",
        "Passwords are changed by the person they belong to, from their own account " +
        "screen. An administrator cannot read or set somebody else's password."));
    }

    var acts = el("div", "ad-acts");
    var save = el("button", "lx-btn lg", making ? "Add them" : "Save");
    save.type = "button";
    save.addEventListener("click", function () {
      if (!name.input.value.trim()) { toast("A person needs a name."); return; }
      save.disabled = true;
      var go;
      if (making) {
        go = API.accounts.create({
          email: email.input.value.trim(),
          name: name.input.value.trim(),
          title: title.input.value.trim(),
          password: pw.input.value,
          role: role.value,
          orgId: S.me.orgId
        });
      } else {
        go = API.accounts.update(p.id, {
          name: name.input.value.trim(),
          title: title.input.value.trim()
        }).then(function () {
          return API.accounts.role(p.id, "learn", role.value, S.me.orgId);
        });
      }
      attempt(go, function () {
        toast(making ? name.input.value.trim() + " added." : "Saved.");
        goBack();
      }).then(function () { save.disabled = false; });
    });
    acts.appendChild(save);
    v.appendChild(acts);
    show("admin");
  }

  /* --------------------------------------------------------------- System
     What is real, what is not, and where the line is. It is a screen rather
     than a README because the person who most needs to know is the one
     looking at the console wondering why a change did not reach a student. */
  function tabSystem(v) {
    v.appendChild(el("p", "lx-lede",
      "Where this install stands, and what is actually enforced."));

    var box = el("div", "ad-sys");
    var rows = [
      ["Platform API", API.base(), "checking…"],
      ["Identity", "Oplo Account", "One account across Oplo products. Sessions are " +
        "HttpOnly cookies set by the server; this page cannot read them."],
      ["Authorization", "Server-side", "Every permission is decided in the API. Hidden " +
        "buttons are a courtesy, not a control."],
      ["Grades", "Database", "Written by the teachers of a course, read by the student " +
        "they belong to. Synchronised across devices."],
      ["Progress and XP", "Database", "Written by the student, priced by the server. " +
        "This browser keeps a cache so the app works offline; the database is the truth."],
      ["Study sets", "Database", "Written by teachers, published to a course, and read by " +
        "the students in it. Drafts stay with their author until published."],
      ["Course catalogue", "Shipped in the site", "The Explore tab reads published " +
        "content from the site's files. Database courses carry the enrolment and grades."],
      ["Tutor", "Local model", "Runs through Ollama on your own machine, if you have it. " +
        "Nothing is sent to a server."]
    ];
    rows.forEach(function (r) {
      var row = el("div", "ad-sys-row");
      row.innerHTML = "<b>" + esc(r[0]) + "</b><em>" + esc(r[1]) + "</em><span>" +
        esc(r[2]) + "</span>";
      box.appendChild(row);
    });
    v.appendChild(box);

    API.health().then(function (up) {
      var first = box.querySelector(".ad-sys-row span");
      if (first) {
        first.textContent = up
          ? "Answering. Sign-in, grades and progress are live."
          : "Not answering. Nothing that needs the server will work until it is running.";
      }
    });

    v.appendChild(el("h2", "lx-h2", "Your account"));
    var who = el("div", "ad-list");
    var row1 = el("div", "ad-row");
    row1.appendChild(avatarFor(S.me));
    row1.appendChild(el("span", "t", "<b>" + esc(S.me.name) + "</b><span>" +
      esc(S.me.email) + " · " + esc(S.me.id) + "</span>"));
    who.appendChild(row1);
    (S.me.roles || []).forEach(function (r) {
      var row = el("div", "ad-row");
      row.innerHTML = '<span class="t"><b>' + esc(r.product) + "." + esc(r.role) +
        "</b><span>" + (r.orgId ? "in " + esc(r.orgId) : "platform-wide") + "</span></span>";
      who.appendChild(row);
    });
    v.appendChild(who);
  }

  /* ================================================================== Auth
     Identity is the platform's, not this app's.

     What used to be here was a PBKDF2 verifier that ran in the browser
     against a salt and hash shipped inside data.js. It was honest about being
     a lock on a door rather than a safe, but it was still the wrong thing: a
     verifier that reaches the browser is a verifier an attacker can grind
     offline at their own pace, and an app that decides for itself who is
     signed in cannot enforce anything against a user with a console open.

     So it is gone. Sign-in posts to the Oplo platform API, the server checks
     the password, and the server sets an HttpOnly session cookie this file
     cannot read. From then on the only question this app ever asks about
     identity is `who am I?` — and the answer comes from the server.

     One Oplo Account, not an Oplo Learn account. The same session will carry
     a person into OMaps or OShopping, which is why none of this lives under
     a Learn-specific name. */
  var Auth = (function () {
    function verify(email, password) { return API.login(email, password); }
    function current() { return API.me(); }
    function close() { return API.logout().catch(function () { /* already gone */ }); }
    return { verify: verify, current: current, close: close };
  })();

  /* `who` is whatever /api/v1/me resolved the session cookie to. Nothing in
     this function may be reached without that having succeeded. */
  function boot(who) {
    S.me = normaliseAccount(who);
    who = S.me;

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
    Game.attach(R);

    $("#gate").hidden = true;
    var av = document.querySelector(".lx-user .av");
    av.textContent = who.initials;
    av.style.background = who.hue || "";
    document.querySelector(".lx-user .nm").textContent = who.name;
    $("#user").title = "Signed in as " + who.name;
    document.body.classList.toggle("is-admin", who.role === "admin" || who.role === "teacher");
    $("#navAdmin").hidden = !allowedTabs().length;
    $("#navAdmin").textContent = who.role === "admin" ? "Console" : "My students";
    if (R.broken) {
      toast("This browser will not let the page store anything, so progress will not be kept.");
    }
    Ann.reset();
    drawSubjectNav();
    home();
    Room.presence();
    Room.fromLink();

    /* Enrolment is the database's answer, not a list in a file. The home
       screen is drawn twice — once immediately so the app is not a spinner,
       and again when the server says what this person is actually taking. */
    Promise.all([
      API.courses.mine().then(function (courses) {
        S.me.assigned = courses.filter(function (c) {
          return !c.myRole || c.myRole === "student";
        });
        S.me.teaching = courses.filter(function (c) {
          return c.myRole === "teacher" || c.myRole === "assistant";
        });
        return true;
      }, function () { return false; }),
      loadStudySets()
    ]).then(function (out) {
      if ((out[0] || out[1]) && S.view === "my") drawMy();
    });

    /* The record on this device is a cache. The server is the truth, so it is
       asked as soon as there is a session, and the screens redraw when the
       answer differs from what was cached. */
    Sync.pull().then(function (changed) {
      Game.paint();
      if (changed && S.view === "my") drawMy();
    });
  }

  /* The API returns an Oplo Account: an id, a profile, and product roles. The
     rest of this app was written against a flatter shape, so the translation
     happens once, here, rather than in forty places. */
  function normaliseAccount(a) {
    var learn = (a.roles || []).filter(function (r) { return r.product === "learn"; });
    var platform = (a.roles || []).filter(function (r) { return r.product === "platform"; });
    var role = platform.some(function (r) { return r.role === "admin"; }) ? "admin"
             : learn.some(function (r) { return r.role === "admin"; }) ? "admin"
             : learn.some(function (r) { return r.role === "teacher"; }) ? "teacher"
             : "student";
    var name = a.name || a.email || "Someone";
    return {
      id: a.id, email: a.email, name: name,
      first: a.firstName || name.split(/\s+/)[0],
      initials: a.initials ||
        name.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase(),
      hue: a.hue || "#0071e3",
      title: a.title || "",
      role: role,
      roles: a.roles || [],
      orgs: a.organizations || [],
      orgId: (a.organizations && a.organizations[0]) ? a.organizations[0].id : null,
      assigned: [],
      enrolment: null
    };
  }

  function signOut() {
    if (R) R.flush();                 // never leave the last few answers unwritten
    Sync.flushNow();
    R = null;
    Game.attach(null);
    Auth.close();
    Room.reset();
    Ann.reset();
    // Everything the session learned goes with it rather than sitting in
    // memory for whoever opens the tab next.
    S.me = null; S.m = {}; S.sets = {}; S.mistakes = [];
    S.here = null; S.hist = [];
    S.tab = null;
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

    function fail(message, field) {
      err.textContent = message;
      if (field === "email") $("#gEmail").classList.add("bad");
      if (field === "password") $("#gPass").classList.add("bad");
      if (!field) { $("#gEmail").classList.add("bad"); $("#gPass").classList.add("bad"); }
      $("#gPass").value = "";
      $("#gPass").focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#gEmail").value.trim(), pw = $("#gPass").value;
      err.textContent = "";
      $("#gEmail").classList.remove("bad");
      $("#gPass").classList.remove("bad");
      if (!email || !pw) { err.textContent = "Both fields, please."; return; }

      btn.disabled = true;
      btn.textContent = "Signing in…";

      /* No rate limiting here, and that is deliberate: it is enforced by the
         server, per address and per address-of-origin. A limiter in the page
         stops an honest user from mistyping twice and stops an attacker from
         nothing at all. */
      Auth.verify(email, pw).then(function (account) {
        btn.disabled = false;
        btn.textContent = "Sign in";
        boot(account);
      }).catch(function (e2) {
        btn.disabled = false;
        btn.textContent = "Sign in";
        if (e2 && e2.code === "offline") {
          err.innerHTML = "Cannot reach the Oplo account service. " +
            "Sign-in needs the platform API, and it is not answering at " +
            "<code>" + esc(API.base()) + "</code>.";
          return;
        }
        if (e2 && e2.code === "rate_limited") { fail(e2.message); return; }
        fail(e2 && e2.message ? e2.message
                              : "That email and password do not match an account.", e2 && e2.field);
      });
    });

    /* A session already open in this browser signs straight in. The cookie is
       HttpOnly, so the only way to find out is to ask the server. */
    API.me().then(function (account) {
      boot(account);
    }).catch(function (e) {
      if (e && e.code === "offline") {
        err.innerHTML = "Cannot reach the Oplo account service at <code>" +
          esc(API.base()) + "</code>.";
      }
      setTimeout(function () { $("#gEmail").focus(); }, 120);
    });
  })();

  /* A tab can be closed between two debounced writes. `pagehide` is the one
     event that fires reliably on every path out — closing, navigating,
     backgrounding on iOS — so the last few seconds are written there. */
  window.addEventListener("pagehide", function () {
    if (R) R.flush();
    Sync.flushNow();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      if (R) R.flush();
      Sync.flush();
    }
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
  $("#user").addEventListener("click", function () { openAccount(); });

  document.addEventListener("keydown", function (e) {
    if (S.view === "cards" && S.keys) S.keys(e);
    else if (S.view === "hangman" && S.hangKeys) S.hangKeys(e);
    else if (S.view === "read" && S.readKeys) S.readKeys(e);
    else if (S.view === "learn" && S.learnKeys) S.learnKeys(e);
  });

})();
