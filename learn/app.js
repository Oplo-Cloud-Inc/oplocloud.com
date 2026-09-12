/* ==========================================================================
   OEdu.

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
    p: {},                // the practice run in flight
    tab: null,            // the console: which section is open
    courseId: null,       // and which class is on the gradebook
    reportCourse: null,   // and which class the report list is filtered to
    studentFilter: null,  // the roster's filter, remembered between visits
    studentQuery: null,   // and what was typed into its search
    studentPick: null     // and who was selected, so coming back keeps the place
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

  /* ------------------------------------------------ The browser's history
     The stack above was the app's alone. The browser never heard about any
     of it, so to the browser the whole of OEdu was one page — and its Back
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
    /* The console has no bar, so its back control is its own element. It is
       shown only when there is somewhere to go back to — a permanently
       present Back that sometimes does nothing is worse than none. */
    // Any view inside the console shell, not just #v-admin — Account is one.
    $("#cnBack").hidden = !(prev && document.body.classList.contains("is-console"));
    if (prev) $("#cnBackLabel").textContent = prev.label;
    // The subject bar belongs to browsing. The home screen is a personal
    // command centre, and a catalogue across the top of it is just noise.
    $("#subbar").hidden = !(view === "explore" || view === "subject");
    // The console's rail belongs to the console. Every screen it owns —
    // gradebook, enrolment, a student's report — is drawn into #v-admin, so
    // one check here keeps the chrome right without every screen knowing.
    if (view !== "admin") leaveConsole();
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

    /* ---- What your teachers have set ------------------------------- */
    var workSlot = el("div");
    v.appendChild(workSlot);
    drawSetWork(workSlot);

    /* ---- Your next step ------------------------------------------- */
    var step = nextStep();
    var next = el("div", "lx-next");
    if (!step) {
        /* This is about Oplo's own material, not about work a teacher set —
           and "everything assigned" put it in flat contradiction with the
           list of unhanded-in work three lines above it on the same screen. */
        next.innerHTML = '<p class="k">Nothing to practise</p>' +
          "<h2>Every unit is at mastery.</h2>" +
          '<p class="why">That is the material. Work your teachers have set is above, ' +
          "and is counted separately. Review keeps mastery where it is; the study sets " +
          "do not expire.</p>";
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
  /* ----------------------------------------------------- What has been set

     The hole this fills had a real consequence rather than being a missing
     feature. A teacher could set an essay, mark it not handed in, and count it
     as a zero — and nothing anywhere told the student the essay existed. A
     gradebook that can take marks off somebody for work they were never shown
     is not a gradebook, and no amount of polish elsewhere makes up for it.

     So it sits first, above everything the app has an opinion about. What is
     late, then what is due, then what has come back. The study plan below it
     is Oplo's suggestion; this is what somebody is actually being marked on. */
  function drawSetWork(host) {
    host.innerHTML = "";
    API.reporting.coursework().then(function (data) {
      if (!data.work.length) return;          // nothing set: say nothing

      var t = data.totals;
      var waiting = data.work.filter(function (w) {
        return !w.status || (w.status === "marked" && w.score == null);
      });
      var missing = data.work.filter(function (w) { return w.status === "missing"; });
      var back = data.work.filter(function (w) {
        return w.status === "marked" && w.score != null;
      });

      host.appendChild(el("h2", "lx-h2", "Set by your teachers"));

      /* One sentence before the list. Somebody who reads "3 things" and goes
         and does them is better served than somebody who reads five numbers. */
      var bits = [];
      if (t.overdue) bits.push("<b>" + t.overdue + " past due</b>");
      if (waiting.length - t.overdue > 0) {
        bits.push((waiting.length - t.overdue) + " still to hand in");
      }
      if (t.missing) bits.push("<b>" + t.missing + " marked as not handed in</b>");
      if (back.length) bits.push(back.length + " marked");
      host.appendChild(el("p", "lx-lede", bits.length
        ? bits.join(" &middot; ")
        : "Everything set has been handed back."));

      var list = el("div", "sw-list");
      // What can still be done something about, first.
      waiting.concat(missing).slice(0, 8).forEach(function (w) {
        list.appendChild(workRow(w));
      });
      if (!waiting.length && !missing.length) {
        back.slice(0, 4).forEach(function (w) { list.appendChild(workRow(w)); });
      }
      host.appendChild(list);
    }, function () {
      /* The rest of this screen is the student's own record and works without
         a server. This one piece does not, and says so — "nothing was set" and
         "could not ask" are different, and only one of them is good news. */
      host.appendChild(el("p", "lx-lede",
        "Could not reach the server, so what your teachers have set is not shown here. " +
        "Everything below is from this device."));
    });
  }

  function workRow(w) {
    var late = w.dueAt && w.dueAt < Date.now();
    var row = el("div", "sw-row" +
      (w.status === "missing" ? " miss" : (late && !w.status) ? " late" : ""));

    var said = w.status === "missing" ? "Not handed in"
      : w.status === "excused" ? "Excused"
      : (w.status === "marked" && w.score != null) ? w.score + " / " + w.outOf
      : "Not marked yet";

    var when = w.status === "missing" ? "counted as 0 of " + w.outOf
      : w.status === "excused" ? "not part of your grade"
      : w.dueAt ? (late ? "was due " + dayName(w.dueAt) : "due " + dayName(w.dueAt))
      : "no date set";

    row.innerHTML =
      "<span class='t'><b>" + esc(w.title) + "</b><span>" + esc(w.courseTitle) +
        " &middot; " + esc(when) + (w.extraCredit ? " &middot; extra credit" : "") +
        "</span></span>" +
      "<span class='m'>" + esc(said) + "</span>" +
      (w.feedback ? "<p class='fb'>" + esc(w.feedback) + "</p>" : "");
    return row;
  }


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
            "Nobody else yet. Send them the link below — it opens OEdu straight into this room."));
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
        "A room reaches every tab of OEdu in this browser. Reaching a second " +
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
      var list = el("div", "admin-list");
      mine.forEach(function (c) {
        var row = el("div", "admin-row");
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
    var pwForm = el("div", "admin-form");
    var cur = field("Current password", "");
    cur.input.type = "password";
    cur.input.autocomplete = "current-password";
    var next = field("New password", "", "At least 10 characters");
    next.input.type = "password";
    next.input.autocomplete = "new-password";
    pwForm.appendChild(cur);
    pwForm.appendChild(next);
    v.appendChild(pwForm);

    var pwActs = el("div", "admin-acts");
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
    var out = el("div", "admin-acts");
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
      "as zero. " + policySays(summary)));

    var parts = el("div", "admin-mark-parts");
    summary.parts.forEach(function (x) {
      var row = el("div", "admin-mark-part");
      row.innerHTML = "<span>" + esc(x.category) + "</span>" +
        '<div class="t"><i style="width:' + x.percent + '%"></i></div>' +
        "<em>" + x.percent + '%</em><span class="w">' + x.weight + "% of the grade · " +
        x.items + (x.items === 1 ? " item" : " items") + "</span>";
      parts.appendChild(row);
    });
    v.appendChild(parts);

    /* What the teacher wrote about the term. The server has always let a
       student read their own report — a document a school writes about
       somebody that they are not allowed to read is a strange thing to
       produce — and nothing had ever asked it for one. */
    var said = el("div");
    v.appendChild(said);
    API.reporting.report(S.me.id).then(function (rep) {
      var mine = (rep.courses || []).filter(function (c) {
        return c.courseId === summary.courseId;
      })[0];
      if (!mine || !mine.comment || !String(mine.comment.body || "").trim()) return;
      said.appendChild(el("h2", "lx-h2", "What your teacher wrote"));
      var box = el("div", "sw-said");
      box.innerHTML = "<p>" + esc(mine.comment.body) + "</p><span>" +
        esc(mine.comment.author || "Your teacher") +
        (mine.comment.updatedAt ? " · " + esc(whenName(mine.comment.updatedAt)) : "") +
        "</span>";
      said.appendChild(box);
    }, function () { /* the marks below are the point; this is an addition */ });

    v.appendChild(el("h2", "lx-h2", "Every mark"));
    var list = el("div", "admin-list");
    all.filter(function (g) { return g.courseId === summary.courseId; })
      .forEach(function (g) {
        var row = el("div", "admin-row");
        var pct = g.score != null && g.outOf ? Math.round(g.score / g.outOf * 100) : null;
        /* The three things a blank can mean, said rather than left blank. A
           student looking at a dash cannot tell whether their teacher has not
           marked it yet or whether it is a zero sitting in their grade, and
           those call for opposite actions on their part. */
        var mark = g.status === "missing" ? "<em>Not handed in</em>"
          : g.status === "excused" ? "<em>Excused</em>"
          : g.score == null ? "<em>Not marked yet</em>"
          : g.score + " / " + g.outOf + (pct != null ? " · " + pct + "%" : "");
        var note = g.status === "missing" ? "counted as 0 of " + g.outOf
          : g.status === "excused" ? "not part of your grade"
          : g.late ? "handed in late" : "";
        if (g.extraCredit) note = note ? note + " · extra credit" : "extra credit";
        row.innerHTML = '<span class="t"><b>' + esc(g.title) + "</b><span>" +
          esc(g.category || "") + (note ? " · " + esc(note) : "") +
          (g.feedback ? " · " + esc(g.feedback) : "") + "</span></span>" +
          '<span class="mk' + (g.status === "missing" ? " miss" : "") + '">' + mark + "</span>";
        list.appendChild(row);
      });
    v.appendChild(list);
    noFoot(); progress(null);
    show("account");
  }

  /* ================================================================= Grades
     A student's standing, drawn so that it makes them want to keep going.

     Every number on this screen is computed on the server from the record in
     the database — the courses that transferred, EHS's diploma rules, the
     grades teachers have entered — so it can never disagree with what an
     administrator or a teacher sees. This file only draws it.

     Two commitments shape the drawing. It is encouraging: somebody
     two-thirds of the way to a diploma should feel two-thirds of the way
     there, and see the next milestone within reach, before they see what is
     left. And it is honest: an estimate is labelled an estimate, a credit
     that may not transfer is shown as a range rather than counted, and a
     number that comes from a judgement says so. Motivation built on a number
     that later drops is not motivation.

     Charts follow one set of rules: one big number per view, thin marks,
     hairline grids, values on the marks rather than a legend hunt, identity
     never carried by colour alone, and a table twin for the one line chart. */
  var GR_NS = "http://www.w3.org/2000/svg";
  var GR_CALM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var GR_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" ' +
    'height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function grNode(tag, attrs) {
    var n = document.createElementNS(GR_NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  /* Credits to three places at most, trailing zeros dropped: 15.125, 7.25, 1. */
  function grCr(x) { return String(Math.round(Number(x || 0) * 1000) / 1000); }
  function grCount(node, to, decimals, suffix) {
    suffix = suffix || "";
    // The finished number goes in first. A tab that is not being painted gets
    // no animation frames at all, and a headline number left blank — or worse,
    // frozen partway up — is not a trade worth making for a flourish.
    node.textContent = to.toFixed(decimals) + suffix;
    if (GR_CALM || document.hidden) return;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 900);
      p = 1 - Math.pow(1 - p, 3);
      node.textContent = (to * p).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function grShortTerm(s) {
    var m = String(s).match(/(\d{4})\D+(\d+)/);
    return m ? "’" + m[1].slice(2) + " T" + m[2] : String(s).slice(0, 8);
  }
  function grMonth(s) {
    var m = String(s || "").match(/^(\d{4})-(\d{2})/);
    if (!m) return s || "";
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m[2] - 1] +
           " " + m[1];
  }
  function grArea(key, g) {
    var hit = g.areas.filter(function (a) { return a.key === key; })[0];
    return hit ? hit.name : ({ world_language: "World Language" }[key] || key);
  }
  function grHead(title, aside) {
    var h = el("header", "gr-sec-head");
    h.appendChild(el("h2", null, esc(title)));
    if (aside) { var s = el("span"); s.textContent = aside; h.appendChild(s); }
    return h;
  }

  /* ------------------------------------------------------------- The plan
     One commitment, in the student's own words, kept on the server under its
     own scope so it follows them to another device. "When X, I will Y" is the
     form on purpose: an intention tied to a cue is kept far more often than
     one floating free of it, and this is the only thing in OEdu a student is
     asked to keep. An administrator reading the record sees it and cannot
     write it — the server allows progress to be written by its owner only. */
  var PLAN_SCOPE = "graduation:plan";

  function planLoad(accountId) {
    return API.progress.all(accountId).then(function (rows) {
      var row = rows && rows[PLAN_SCOPE];
      return row && row.state && row.state.what ? row.state : null;
    }, function () { return null; });
  }

  function openGrades(silent) {
    root("grades", "Grades", function () { openGrades(true); });
    var v = $("#v-grades");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", "Grades" + (S.me ? " · " + esc(S.me.name) : "")));
    v.appendChild(el("h1", "lx-h1", "Your path to graduation"));
    var host = el("div", "gr");
    v.appendChild(host);
    var wait = el("div", "admin-loading", "Reading your record…");
    host.appendChild(wait);
    noFoot(); progress(null);
    show("grades");
    Promise.all([API.graduation.get(), planLoad()]).then(function (out) {
      wait.remove();
      drawGrades(host, out[0], null, { canCommit: true, plan: out[1],
                                       again: function () { openGrades(true); } });
    }, function (e) { failed(wait, e, function () { openGrades(true); }); });
  }

  /* `empty` is what to say when there is nothing yet. The student is spoken to
     in the second person; the Console, looking at somebody else, passes its own. */
  function drawGrades(host, g, empty, opts) {
    opts = opts || {};
    /* The server always sends a dashboard, even an empty one — but a screen
       that throws shows a student nothing at all, with no way to tell whether
       their record is empty or the page is broken. The empty state already
       has the right words; this is what lets it reach them. */
    if (!g || !g.totals || !g.current) {
      host.appendChild(el("div", "lx-empty", empty ||
        "Nothing on your record yet. When your school adds your previous transcript, or " +
        "your teachers enter grades, your path to graduation appears here."));
      return;
    }
    if (!g.transfer && !g.current.length && !g.totals.earnedTowardDiploma) {
      host.appendChild(el("div", "lx-empty", empty ||
        "Nothing on your record yet. When your school adds your previous transcript, or your " +
        "teachers enter grades, your path to graduation appears here."));
      return;
    }
    host.appendChild(gradHero(g));
    /* The one move before the wall of numbers. A student who opens this page
       and reads eight things they owe closes it; a student who reads one
       thing they can do today does that thing. */
    if (g.focus) host.appendChild(gradFocus(g, opts));
    host.appendChild(gradKpis(g));
    if (g.pace) host.appendChild(gradPlan(g));
    if (g.risk) host.appendChild(gradRisk(g, opts));
    if (g.board && g.exams.length) host.appendChild(gradPathway(g));
    host.appendChild(gradBadges(g));
    host.appendChild(gradAreas(g));
    if (g.transfer) host.appendChild(gradTransfer(g));
    if (g.courses.length) host.appendChild(gradPerformance(g));
    if (g.exams.length) host.appendChild(gradExams(g));
    host.appendChild(gradCurrent(g));
    if (g.courses.length) host.appendChild(gradHistory(g));
    host.appendChild(gradNotes(g));
  }

  /* ------------------------------------------------------------- The hero
     The one big number, inside a ring that separates what is expected to
     count from what may still move. */
  function gradHero(g) {
    var t = g.totals, track = g.track;
    var sec = el("section", "gr-hero");
    var got = t.earnedTowardDiploma;
    var sure = Math.min(got, t.transferConservative + t.ehsEarned);
    var evaluated = g.transfer && g.transfer.status === "evaluated";

    var side = el("div", "gr-ring-side");
    var ring = el("div", "gr-ring");
    var R = 66, C = 2 * Math.PI * R, GAP = 2;
    var sv = grNode("svg", { viewBox: "0 0 160 160", "aria-hidden": "true" });
    sv.appendChild(grNode("circle", { cx: 80, cy: 80, r: R, class: "gr-ring-track" }));
    function arc(from, to, cls) {
      if (to <= from) return;
      var start = from * C + (from > 0 ? GAP : 0);
      var len = Math.max(0, to * C - start);
      var c = grNode("circle", { cx: 80, cy: 80, r: R, class: "gr-arc " + cls, transform: "rotate(-90 80 80)" });
      c.style.strokeDashoffset = String(-start);
      c.style.strokeDasharray = (GR_CALM ? len : 0) + " " + C;
      sv.appendChild(c);
      if (!GR_CALM) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { c.style.strokeDasharray = len + " " + C; });
        });
      }
    }
    arc(0, sure / track.total, "sure");
    arc(sure / track.total, Math.min(1, got / track.total), "maybe");
    ring.appendChild(sv);
    var mid = el("div", "gr-ring-mid");
    var num = el("b");
    mid.appendChild(num);
    mid.appendChild(el("span", null, "of your diploma"));
    ring.appendChild(mid);
    grCount(num, t.percent, t.percent % 1 ? 1 : 0, "%");
    side.appendChild(ring);
    side.appendChild(el("div", "gr-key",
      '<span><i class="t"></i>' + (evaluated ? "Transferred" : "Expected to transfer") + "</span>" +
      (sure < got ? '<span><i class="maybe"></i>May not transfer</span>' : "") +
      '<span><i class="left"></i>Still to earn</span>'));
    sec.appendChild(side);

    var txt = el("div", "gr-hero-txt");
    txt.appendChild(el("p", "gr-kicker", esc(track.name) + " · " + track.total + " credits" +
      (g.program && g.program.name ? " · " + esc(g.program.name) : "")));
    var who = g.account && g.account.firstName ? esc(g.account.firstName) + ", you’re " : "You’re ";
    txt.appendChild(el("h2", null, t.percent >= 100
      ? "Every credit is in. That’s a diploma."
      : who + Math.floor(t.percent) + "% of the way to your diploma."));
    txt.appendChild(el("p", "gr-lede",
      "<b>" + grCr(got) + " of " + track.total + " credits</b> already count toward it" +
      (sure < got ? " — between " + grCr(sure) + " and " + grCr(got) + " once EHS confirms your transfer."
                  : ".")));
    var togo = el("div", "gr-togo");
    togo.innerHTML = "<b>" + grCr(t.planAtEhs) + "</b><span>credits to go at EHS</span>";
    txt.appendChild(togo);

    var miles = el("ol", "gr-miles");
    // The stops sit at the centres of four equal columns (12.5%, 37.5%,
    // 62.5%, 87.5%) and mark 25/50/75/100%, so the fill that starts at the
    // first stop is exactly (percent − 25)% of the track wide.
    miles.style.setProperty("--gr-fill", Math.max(0, Math.min(75, t.percent - 25)) + "%");
    var next = null;
    g.milestones.forEach(function (m) {
      var li = el("li", m.reached ? "done" : "");
      if (!m.reached && !next) { next = m; li.className = "next"; }
      li.innerHTML = "<i>" + (m.reached ? svg(I.tick, true) : "") + "</i><span>" + esc(m.label) +
        "</span><em>" + m.at + "%</em>";
      miles.appendChild(li);
    });
    txt.appendChild(miles);
    if (next) {
      var need = Math.max(0, next.at / 100 * track.total - got);
      txt.appendChild(el("p", "gr-next", svg(I.star, true) + "<span><b>Next up: " + esc(next.label) +
        "</b> — " + (need > 0 ? grCr(need) + (need === 1 ? " credit" : " credits") + " away." : "within reach.") +
        "</span>"));
    }
    sec.appendChild(txt);
    return sec;
  }

  function gradKpis(g) {
    var t = g.totals;
    var row = el("div", "gr-kpis");
    var taken = {}, passed = {};
    g.exams.forEach(function (e) { taken[e.name] = true; if (e.passed) passed[e.name] = true; });
    var nTaken = Object.keys(taken).length, nPassed = Object.keys(passed).length;
    [[grCr(t.transferEstimate), "Transferred" + (g.transfer ? " from " + g.transfer.school : ""),
      !g.transfer ? "None on file"
        : t.transferConservative < t.transferEstimate
          ? "Estimate · " + grCr(t.transferConservative) + " if partial semesters don’t count"
          : "Estimate until EHS evaluates it"],
     [grCr(t.planAtEhs), "Still to earn at EHS", "Including EHS’s " + g.track.minAtEhs + "-credit minimum"],
     [g.gpa.estimate != null ? g.gpa.estimate.toFixed(2) : "—", "GPA on the EHS scale",
      g.gpa.courses ? "Estimate from " + g.gpa.courses + " marks" : "No marks yet"],
     [String(nPassed), "State exams passed", nTaken ? "of " + nTaken + " taken" : "None on file"]
    ].forEach(function (k) {
      var tile = el("div", "gr-kpi");
      tile.appendChild(el("b", null, esc(k[0])));
      var l = el("span"); l.textContent = k[1]; tile.appendChild(l);
      var n = el("em"); n.textContent = k[2]; tile.appendChild(n);
      row.appendChild(tile);
    });
    return row;
  }

  /* --------------------------------------------------------- Achievements
     Each is computed from the record and carries the evidence that earned
     it. The locked ones stay on the wall, because a badge nobody knows about
     cannot be aimed at. */
  function gradBadges(g) {
    var sec = el("section", "gr-sec");
    var got = g.achievements.filter(function (a) { return a.earned; });
    sec.appendChild(grHead("Achievements", got.length + " of " + g.achievements.length + " earned"));
    var grid = el("div", "gr-badges");
    got.concat(g.achievements.filter(function (a) { return !a.earned; })).forEach(function (a, i) {
      var b = el("article", "gr-badge " + (a.earned ? "earned" : "locked"));
      if (a.earned && !GR_CALM) b.style.animationDelay = (i * 55) + "ms";
      b.innerHTML = '<span class="ic">' + (a.earned ? svg(I.star) : GR_LOCK) + "</span><div><b></b><p></p></div>";
      b.querySelector("b").textContent = a.name;
      b.querySelector("p").textContent = a.earned ? a.detail : "Locked — " + a.detail;
      grid.appendChild(b);
    });
    sec.appendChild(grid);
    return sec;
  }

  /* ---------------------------------------------------------- Requirements */
  function gradAreas(g) {
    var sec = el("section", "gr-sec");
    var done = g.areas.filter(function (a) { return a.complete; }).length;
    sec.appendChild(grHead("Diploma requirements", done + " of " + g.areas.length + " areas complete"));
    sec.appendChild(el("div", "gr-key",
      '<span><i class="t"></i>Transferred' + (g.transfer ? " from " + esc(g.transfer.school) : "") + "</span>" +
      '<span><i class="e"></i>Earned at EHS</span><span><i class="left"></i>Still to go</span>'));
    var list = el("div", "gr-areas");
    g.areas.forEach(function (a) {
      var row = el("div", "gr-area" + (a.complete ? " done" : ""));
      var fromT = Math.max(0, a.applied - a.ehs);
      var pt = Math.min(100, fromT / a.required * 100);
      var pe = Math.min(100 - pt, a.ehs / a.required * 100);
      var name = el("div", "gr-area-name");
      name.appendChild(el("b"));
      name.firstChild.textContent = a.name;
      name.appendChild(el("span", null, grCr(a.applied) + " / " + a.required));
      row.appendChild(name);
      var meter = el("div", "gr-meter");
      meter.setAttribute("role", "img");
      meter.setAttribute("aria-label", a.name + ": " + grCr(a.applied) + " of " + a.required + " credits");
      if (pt > 0) {
        var s1 = el("span", "seg t" + (pe > 0 ? "" : " end"));
        s1.style.width = pt + "%";
        s1.title = grCr(fromT) + " transferred";
        meter.appendChild(s1);
      }
      if (pe > 0) {
        var s2 = el("span", "seg e end");
        s2.style.width = pe + "%";
        s2.title = grCr(a.ehs) + " earned at EHS";
        meter.appendChild(s2);
      }
      row.appendChild(meter);
      var st = el("div", "gr-area-state");
      st.innerHTML = a.complete ? '<span class="ok">' + svg(I.tick, true) + "Done</span>"
                                : "<b>" + grCr(a.remaining) + "</b> to go";
      if (a.planAtEhs > a.remaining) st.appendChild(el("em", null, "EHS asks for " + a.residencyMin + " here"));
      if (a.fromOtherAreas > 0) st.appendChild(el("em", null, "+" + grCr(a.fromOtherAreas) + " from other areas"));
      row.appendChild(st);
      list.appendChild(row);
    });
    sec.appendChild(list);
    return sec;
  }

  /* -------------------------------------------------------------- Transfer */
  function gradTransfer(g) {
    var x = g.transfer, t = g.totals;
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("Your transfer to EHS", x.school + (x.authority ? " · " + x.authority : "")));
    var steps = el("ol", "gr-steps");
    x.statusSteps.forEach(function (s, i) {
      var li = el("li", i < x.statusAt ? "done" : i === x.statusAt ? "now" : "");
      li.innerHTML = "<i>" + (i < x.statusAt ? svg(I.tick, true) : String(i + 1)) + "</i><span></span>" +
        (i === x.statusAt ? "<em>You are here</em>" : "");
      li.querySelector("span").textContent = s;
      steps.appendChild(li);
    });
    sec.appendChild(steps);

    var grid = el("div", "gr-two");
    var est = el("div", "gr-card");
    est.appendChild(el("h3", null, "Estimated transfer"));
    est.appendChild(el("p", "gr-range", t.transferConservative < t.transferEstimate
      ? "<b>" + grCr(t.transferConservative) + "–" + grCr(t.transferEstimate) + "</b> EHS credits"
      : "<b>" + grCr(t.transferEstimate) + "</b> EHS credits"));
    est.appendChild(el("p", "gr-sub", "Up to " + g.track.transferCap + " can transfer on the " + g.track.total +
      "-credit track." + (x.creditsEarned != null ? " Your record shows " + x.creditsEarned +
      " credits earned there, in its own units." : "")));
    if (x.conversion) { var cv = el("p", "gr-note"); cv.textContent = x.conversion; est.appendChild(cv); }
    grid.appendChild(est);

    var act = el("div", "gr-card gr-act");
    var step = g.nextSteps.filter(function (s) { return s.kind === "transcript"; })[0];
    act.appendChild(el("p", "gr-kicker", "Your next step"));
    var h = el("h3"); h.textContent = step ? step.title : "Your transfer has been evaluated";
    var p = el("p"); p.textContent = step ? step.detail
      : "EHS has reviewed your previous school's record. The credits above are the ones that count.";
    act.appendChild(h); act.appendChild(p);
    grid.appendChild(act);
    sec.appendChild(grid);

    if (x.review && x.review.length) {
      var rv = el("div", "gr-review");
      rv.appendChild(el("h3", null, "Pieces that may not transfer"));
      x.review.forEach(function (r) {
        var row = el("div", "gr-review-row");
        row.innerHTML = '<span class="ic">' + svg(I.alert, true) + "</span><div><b></b><p></p></div><em></em>";
        row.querySelector("b").textContent = grArea(r.area, g) + " · " + r.year;
        row.querySelector("p").textContent = r.titles.join(", ") + ". " + r.reason;
        row.querySelector("em").textContent = grCr(r.atRisk) + " at risk";
        rv.appendChild(row);
      });
      sec.appendChild(rv);
    }
    return sec;
  }

  /* ----------------------------------------------------------- Performance */
  function gradPerformance(g) {
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("How you’ve been doing", "Marks from your previous school"));
    var grid = el("div", "gr-two wide");
    grid.appendChild(trendCard(g));
    var col = el("div", "gr-stack");
    col.appendChild(distCard(g));
    col.appendChild(strengthCard(g));
    grid.appendChild(col);
    sec.appendChild(grid);
    return sec;
  }

  /* One series, so no legend box: the title names it. Crosshair and
     tooltip on hover, arrow keys on focus, and a table twin underneath. */
  function trendCard(g) {
    var terms = g.trend || [];
    var card = el("section", "gr-card");
    card.appendChild(el("h3", null, "Term averages"));
    card.appendChild(el("p", "gr-sub", terms.length + " graded terms" +
      (g.transfer && g.transfer.cumulativeAverage != null ? " · cumulative " + g.transfer.cumulativeAverage + "%" : "")));
    if (!terms.length) { card.appendChild(el("p", "gr-sub", "No term averages on this record.")); return card; }

    var W = 600, H = 230, m = { l: 34, r: 58, t: 14, b: 30 };
    var vals = terms.map(function (t) { return t.average; });
    var lo = Math.min(60, Math.floor(Math.min.apply(null, vals) / 10) * 10), hi = 100;
    function x(i) { return m.l + (terms.length === 1 ? (W - m.l - m.r) / 2 : i * (W - m.l - m.r) / (terms.length - 1)); }
    function y(v) { return m.t + (hi - v) * (H - m.t - m.b) / (hi - lo); }
    var wrap = el("div", "gr-plot");
    var sv = grNode("svg", { viewBox: "0 0 " + W + " " + H, role: "img", tabindex: "0",
      "aria-label": "Term averages from " + vals[0] + "% to " + vals[vals.length - 1] + "%. Use the arrow keys to read each term." });
    for (var v = lo; v <= hi; v += 10) {
      sv.appendChild(grNode("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 80 ? "gr-ref" : "gr-grid" }));
      var tk = grNode("text", { x: m.l - 8, y: y(v) + 4, "text-anchor": "end", class: "gr-tick" });
      tk.textContent = v;
      sv.appendChild(tk);
    }
    var rl = grNode("text", { x: W - m.r + 6, y: y(80) + 4, class: "gr-tick" });
    rl.textContent = "B line";
    sv.appendChild(rl);
    terms.forEach(function (t, i) {
      var tx = grNode("text", { x: x(i), y: H - 8, "text-anchor": "middle", class: "gr-tick" });
      tx.textContent = grShortTerm(t.term);
      sv.appendChild(tx);
    });
    var pts = terms.map(function (t, i) { return [x(i), y(t.average)]; });
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    sv.appendChild(grNode("path", { d: d + " L" + pts[pts.length - 1][0].toFixed(1) + " " + y(lo) + " L" + pts[0][0].toFixed(1) + " " + y(lo) + " Z", class: "gr-area-fill" }));
    sv.appendChild(grNode("path", { d: d, class: "gr-line" }));
    // Selective labels: the latest term and the best one, nothing else.
    var best = 0;
    vals.forEach(function (vv, i) { if (vv > vals[best]) best = i; });
    [best, vals.length - 1].forEach(function (i, n) {
      if (n === 1 && i === best) return;
      sv.appendChild(grNode("circle", { cx: pts[i][0], cy: pts[i][1], r: 4.5, class: "gr-dot" }));
      var lb = grNode("text", { x: pts[i][0] + (i === vals.length - 1 ? 10 : 0), y: pts[i][1] - (i === vals.length - 1 ? -4 : 10),
        "text-anchor": i === vals.length - 1 ? "start" : "middle", class: "gr-endlabel" });
      lb.textContent = vals[i] + "%" + (i === best && i !== vals.length - 1 ? " best" : "");
      sv.appendChild(lb);
    });
    var cross = grNode("line", { y1: m.t, y2: H - m.b, class: "gr-cross", visibility: "hidden" });
    var hot = grNode("circle", { r: 5, class: "gr-dot", visibility: "hidden" });
    sv.appendChild(cross);
    sv.appendChild(hot);
    var tip = el("div", "gr-tip");
    tip.hidden = true;
    function showAt(i) {
      var p = pts[i];
      cross.setAttribute("x1", p[0]); cross.setAttribute("x2", p[0]); cross.setAttribute("visibility", "visible");
      hot.setAttribute("cx", p[0]); hot.setAttribute("cy", p[1]); hot.setAttribute("visibility", "visible");
      tip.innerHTML = "";
      var b = el("b"); b.textContent = terms[i].average + "%";
      var s2 = el("span"); s2.textContent = terms[i].term;
      tip.appendChild(b); tip.appendChild(s2);
      tip.hidden = false;
      var r = sv.getBoundingClientRect();
      tip.style.left = (p[0] / W * r.width) + "px";
      tip.style.top = (p[1] / H * r.height) + "px";
    }
    function hide() { cross.setAttribute("visibility", "hidden"); hot.setAttribute("visibility", "hidden"); tip.hidden = true; }
    var hit = grNode("rect", { x: m.l - 14, y: 0, width: W - m.l - m.r + 28, height: H, fill: "transparent" });
    hit.addEventListener("pointermove", function (e) {
      var r = sv.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * W, bi = 0, bd = 1e9;
      pts.forEach(function (p, i) { var dd = Math.abs(p[0] - sx); if (dd < bd) { bd = dd; bi = i; } });
      showAt(bi);
    });
    hit.addEventListener("pointerleave", hide);
    sv.appendChild(hit);
    var ki = terms.length - 1;
    sv.addEventListener("focus", function () { showAt(ki); });
    sv.addEventListener("blur", hide);
    sv.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { ki = Math.min(terms.length - 1, ki + 1); showAt(ki); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { ki = Math.max(0, ki - 1); showAt(ki); e.preventDefault(); }
    });
    wrap.appendChild(sv);
    wrap.appendChild(tip);
    card.appendChild(wrap);

    if (g.momentum) {
      var mo = el("p", "gr-lede"); mo.textContent = g.momentum.says; card.appendChild(mo);
      var hi = el("p", "gr-sub"); hi.textContent = g.momentum.high; card.appendChild(hi);
    }

    var det = document.createElement("details");
    det.className = "gr-table";
    det.innerHTML = "<summary>Show as a table</summary>";
    var tb = el("table");
    tb.innerHTML = "<thead><tr><th>Term</th><th>Average</th></tr></thead>";
    var body = el("tbody");
    terms.forEach(function (t) {
      var tr = el("tr"), a = el("td"), b = el("td");
      a.textContent = t.term; b.textContent = t.average + "%";
      tr.appendChild(a); tr.appendChild(b); body.appendChild(tr);
    });
    tb.appendChild(body);
    det.appendChild(tb);
    card.appendChild(det);
    return card;
  }

  function distCard(g) {
    var card = el("section", "gr-card");
    card.appendChild(el("h3", null, "Your marks on the EHS scale"));
    card.appendChild(el("p", "gr-sub", g.gpa.courses + " marks · A 90+, B 80+, C 70+, D 60+"));
    var L = ["A", "B", "C", "D", "F"], d = g.gpa.distribution;
    var max = Math.max.apply(null, L.map(function (k) { return d[k] || 0; })) || 1;
    var W = 300, H = 150, top = 22, base = H - 24, slot = W / L.length, bw = 22;
    var sv = grNode("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": L.map(function (k) { return k + ": " + (d[k] || 0); }).join(", ") });
    sv.appendChild(grNode("line", { x1: 0, x2: W, y1: base, y2: base, class: "gr-base" }));
    L.forEach(function (k, i) {
      var n = d[k] || 0, h = n / max * (base - top), x = i * slot + (slot - bw) / 2, yy = base - h, r = Math.min(4, h);
      var gEl = grNode("g", { class: "gr-col" });
      gEl.appendChild(grNode("rect", { x: i * slot, y: 0, width: slot, height: H, fill: "transparent" }));
      if (h > 0) {
        gEl.appendChild(grNode("path", { class: "gr-bar", d: "M" + x + " " + base + "V" + (yy + r) + "Q" + x + " " + yy +
          " " + (x + r) + " " + yy + "H" + (x + bw - r) + "Q" + (x + bw) + " " + yy + " " + (x + bw) + " " + (yy + r) + "V" + base + "Z" }));
      }
      var val = grNode("text", { x: x + bw / 2, y: yy - 6, "text-anchor": "middle", class: "gr-val" });
      val.textContent = n;
      var lab = grNode("text", { x: x + bw / 2, y: H - 6, "text-anchor": "middle", class: "gr-tick" });
      lab.textContent = k;
      var tt = grNode("title", {});
      tt.textContent = k + ": " + n + (n === 1 ? " mark" : " marks");
      gEl.appendChild(val); gEl.appendChild(lab); gEl.appendChild(tt);
      sv.appendChild(gEl);
    });
    card.appendChild(sv);
    if (g.gpa.estimate != null) {
      card.appendChild(el("p", "gr-gpa", "<b>" + g.gpa.estimate.toFixed(2) + "</b> estimated GPA on EHS’s 4.0 scale"));
    }
    return card;
  }

  function strengthCard(g) {
    var card = el("section", "gr-card");
    card.appendChild(el("h3", null, "Where you shine"));
    card.appendChild(el("p", "gr-sub", "Average mark by subject"));
    var list = el("div", "gr-hbars");
    g.strengths.slice(0, 5).forEach(function (s) {
      var row = el("div", "gr-hbar");
      var name = el("span"); name.textContent = s.name;
      var trk = el("div", "trk"), fill = el("i");
      fill.style.width = Math.max(0, Math.min(100, s.average)) + "%";
      trk.appendChild(fill);
      row.appendChild(name); row.appendChild(trk); row.appendChild(el("b", null, String(s.average)));
      row.title = s.name + ": average " + s.average + " across " + s.marks + " marks";
      list.appendChild(row);
    });
    card.appendChild(list);
    return card;
  }

  function gradExams(g) {
    var sec = el("section", "gr-sec");
    var passed = g.exams.filter(function (e) { return e.passed; }).length;
    sec.appendChild(grHead("State exams", passed + " passed"));
    var list = el("div", "gr-exams");
    var ST = { passed: ["ok", I.tick, "Passed"], not_passed: ["bad", I.close, "Not passed"],
               below_65: ["warn", I.alert, "Below 65"], superseded: ["muted", I.arrow, "Retaken"] };
    g.exams.forEach(function (e) {
      var st = ST[e.status] || ["muted", I.alert, e.status];
      var row = el("div", "gr-exam");
      row.innerHTML = '<div class="n"><b></b><span></span></div>' +
        '<div class="sc"><div class="trk"><i style="width:' + Math.max(0, Math.min(100, e.score || 0)) + '%"></i>' +
        '<u style="left:65%" title="65"></u></div><b>' + (e.score != null ? e.score : "—") + "</b></div>" +
        '<span class="chip ' + st[0] + '">' + svg(st[1], true) + st[2] + "</span>";
      row.querySelector(".n b").textContent = e.name;
      row.querySelector(".n span").textContent = grMonth(e.sitting);
      list.appendChild(row);
    });
    sec.appendChild(list);
    return sec;
  }

  function gradCurrent(g) {
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("This year at EHS", g.current.length ? g.current.length + (g.current.length === 1 ? " course" : " courses") : ""));
    if (!g.current.length) {
      sec.appendChild(el("div", "lx-empty", "No EHS grades yet. As your teachers mark your work, your courses and grades appear here."));
      return sec;
    }
    var list = el("div", "gr-current");
    g.current.forEach(function (c) {
      var row = el("div", "gr-cur");
      row.innerHTML = '<div><b></b><span></span></div><span class="let"></span><strong></strong>';
      row.querySelector("b").textContent = c.title;
      row.querySelector("div span").textContent = c.itemCount + (c.itemCount === 1 ? " item" : " items") +
        " marked · over " + c.countedWeight + "% of the grade";
      row.querySelector(".let").textContent = c.letter;
      row.querySelector("strong").textContent = c.percent + "%";
      list.appendChild(row);
    });
    sec.appendChild(list);
    return sec;
  }

  function gradHistory(g) {
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("Course history", g.courses.length + " courses on your record"));
    var avg = {};
    (g.trend || []).forEach(function (t) { avg[t.term] = t.average; });
    var years = [], byYear = {};
    g.courses.forEach(function (c) {
      var k = c.year || "Other";
      if (!byYear[k]) { byYear[k] = { grade: c.gradeLevel, terms: [], byTerm: {} }; years.push(k); }
      var y = byYear[k];
      if (!y.byTerm[c.term]) { y.byTerm[c.term] = []; y.terms.push(c.term); }
      y.byTerm[c.term].push(c);
    });
    years.forEach(function (k) {
      var y = byYear[k];
      var all = [];
      y.terms.forEach(function (t) { all = all.concat(y.byTerm[t]); });
      var credits = all.reduce(function (a, c) { return a + (c.decision === "declined" ? 0 : Number(c.ehsCredits || 0)); }, 0);
      var det = document.createElement("details");
      det.className = "gr-year";
      var sum = document.createElement("summary");
      sum.innerHTML = "<b></b><span></span>";
      sum.querySelector("b").textContent = k.replace("-", "–") + (y.grade ? " · Grade " + y.grade : "");
      sum.querySelector("span").textContent = all.length + " courses · " + grCr(credits) + " EHS credits";
      det.appendChild(sum);
      y.terms.forEach(function (t) {
        var box = el("div", "gr-term");
        var th = el("h4"); th.textContent = t + (avg[t] != null ? " · " + avg[t] + "%" : "");
        box.appendChild(th);
        y.byTerm[t].forEach(function (c) {
          var row = el("div", "gr-crs" + (c.attempted > 0 && !c.earned && c.markNumeric != null ? " miss" : ""));
          row.innerHTML = '<span class="t"></span><span class="mk"></span><span class="let"></span><span class="cr"></span><span class="fl"></span>';
          row.querySelector(".t").textContent = c.title;
          row.querySelector(".mk").textContent = c.mark || "";
          row.querySelector(".let").textContent = c.letter || "";
          row.querySelector(".cr").textContent = c.ehsCredits ? "+" + grCr(c.ehsCredits) : "";
          var fl = row.querySelector(".fl");
          if (c.flags.indexOf("recovered") > -1) fl.appendChild(el("em", "rec", "Recovered"));
          if (c.flags.indexOf("weighted") > -1) fl.appendChild(el("em", null, "Weighted"));
          if (c.attempted > 0 && !c.earned && c.markNumeric != null) fl.appendChild(el("em", "no", svg(I.close, true) + "No credit"));
          if (c.decision === "declined") fl.appendChild(el("em", "no", "Declined by EHS"));
          box.appendChild(row);
        });
        det.appendChild(box);
      });
      sec.appendChild(det);
    });
    return sec;
  }

  /* ------------------------------------------------------------- The move
     Ranked on the server by what it unlocks against what it costs, and shown
     with both, because "2.25 credits of coursework" and "one email" are not
     comparable and must not look it. */
  function gradFocus(g, opts) {
    var f = g.focus;
    var sec = el("section", "gr-focus");
    var head = el("div", "gr-focus-head");
    head.appendChild(el("p", "gr-kicker", "The one move"));
    var costs = el("span", "gr-effort");
    costs.innerHTML = "<b></b><em>what it costs</em>";
    costs.querySelector("b").textContent = f.effort;
    head.appendChild(costs);
    sec.appendChild(head);

    var h = el("h2"); h.textContent = f.title; sec.appendChild(h);
    var d = el("p", "gr-lede"); d.textContent = f.detail; sec.appendChild(d);
    if (f.why) { var w = el("p", "gr-why"); w.textContent = f.why; sec.appendChild(w); }

    sec.appendChild(planBox(g, f, opts));
    return sec;
  }

  /* The commitment. Not a reminder and not a nag: a sentence the student
     writes, shown back to them in their own words. */
  function planBox(g, f, opts) {
    var box = el("div", "gr-commit");
    var plan = opts.plan;

    if (!opts.canCommit) {
      if (plan) {
        box.appendChild(el("p", "gr-kicker", plan.doneAt ? "They kept their plan" : "Their plan"));
        var said = el("p", "gr-plan-said");
        said.textContent = "When " + plan.when + ", I will " + plan.what + ".";
        box.appendChild(said);
      } else {
        box.appendChild(el("p", "gr-sub", "No plan written yet. It is theirs to write, not yours."));
      }
      return box;
    }

    if (plan && !plan.doneAt) {
      box.appendChild(el("p", "gr-kicker", "Your plan"));
      var mine = el("p", "gr-plan-said");
      mine.textContent = "When " + plan.when + ", I will " + plan.what + ".";
      box.appendChild(mine);
      var acts = el("div", "gr-commit-acts");
      var done = el("button", "lx-btn", "I did it");
      done.type = "button";
      done.addEventListener("click", function () {
        done.disabled = true;
        plan.doneAt = Date.now();
        attempt(API.progress.put(PLAN_SCOPE, plan), function () {
          toast("Kept. That is the part most people skip.");
          if (opts.again) opts.again();
        }).then(function () { done.disabled = false; });
      });
      var change = el("button", "lx-btn quiet", "Change it");
      change.type = "button";
      change.addEventListener("click", function () {
        box.innerHTML = "";
        box.appendChild(planForm(f, opts, null));
      });
      acts.appendChild(done); acts.appendChild(change);
      box.appendChild(acts);
      return box;
    }

    if (plan && plan.doneAt) {
      box.appendChild(el("p", "gr-kicker", "Done"));
      var kept = el("p", "gr-plan-said");
      kept.textContent = "You said you would " + plan.what + ". You did.";
      box.appendChild(kept);
    }
    box.appendChild(planForm(f, opts, plan));
    return box;
  }

  function planForm(f, opts, previous) {
    var wrap = el("div", "gr-plan-form");
    wrap.appendChild(el("p", "gr-kicker", previous ? "Write the next one" : "Make it a plan"));
    var line = el("div", "gr-plan-line");
    var when = el("input");
    when.type = "text";
    when.placeholder = "Tuesday after dinner";
    when.setAttribute("aria-label", "When");
    var what = el("input");
    what.type = "text";
    what.value = f.title;
    what.setAttribute("aria-label", "What you will do");
    line.appendChild(el("span", null, "When"));
    line.appendChild(when);
    line.appendChild(el("span", null, "I will"));
    line.appendChild(what);
    wrap.appendChild(line);
    var go = el("button", "lx-btn", "Save the plan");
    go.type = "button";
    go.addEventListener("click", function () {
      var w = when.value.trim(), t = what.value.trim();
      if (!w) { toast("A plan needs its moment. When will you do it?"); when.focus(); return; }
      if (!t) { toast("And the thing you will do."); what.focus(); return; }
      go.disabled = true;
      attempt(API.progress.put(PLAN_SCOPE, { when: w, what: t, kind: f.kind, madeAt: Date.now() }),
        function () {
          toast("Written down. A plan with a time attached is kept far more often.");
          if (opts.again) opts.again();
        }).then(function () { go.disabled = false; });
    });
    wrap.appendChild(go);
    wrap.appendChild(el("p", "gr-sub",
      "Saved to your account, not to this browser, so it is here on any device you sign in on."));
    return wrap;
  }

  /* ---------------------------------------------------------- When it ends
     A credit count says how far. This says when — at the pace of the
     student's own record, labelled as the estimate it is. */
  function gradPlan(g) {
    var pc = g.pace;
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("When this ends", pc.finishBy ? "On your own pace" : "No pace on the record yet"));
    var grid = el("div", "gr-two");

    var card = el("div", "gr-card gr-plan");
    var big = el("p", "gr-plan-big");
    big.innerHTML = "<b></b><span></span>";
    big.querySelector("b").textContent = pc.finishBy ? grMonth(pc.finishBy) : "—";
    big.querySelector("span").textContent = pc.finishBy ? "on this pace" : "not enough finished terms";
    card.appendChild(big);
    var says = el("p", "gr-lede"); says.textContent = pc.says; card.appendChild(says);
    if (pc.expected) {
      var vs = el("p", "gr-sub");
      vs.textContent = pc.aheadOfPlan
        ? "That is at or ahead of the " + grMonth(pc.expected) + " on file."
        : "The record on file says " + grMonth(pc.expected) + ", which is sooner than this pace reaches.";
      card.appendChild(vs);
    }
    var note = el("p", "gr-note"); note.textContent = pc.assumption; card.appendChild(note);
    grid.appendChild(card);

    var years = el("div", "gr-card");
    years.appendChild(el("h3", null, "Credits a year, as you actually earned them"));
    var bars = el("div", "gr-hbars");
    var top = Math.max.apply(null, pc.years.map(function (y) { return y.credits; }).concat([pc.creditsPerYear, 1]));
    pc.years.forEach(function (y) {
      var row = el("div", "gr-hbar");
      var nm = el("span"); nm.textContent = y.year.replace("-", "–");
      var trk = el("div", "trk"), fill = el("i");
      fill.style.width = Math.round(y.credits / top * 100) + "%";
      trk.appendChild(fill);
      row.appendChild(nm); row.appendChild(trk); row.appendChild(el("b", null, grCr(y.credits)));
      bars.appendChild(row);
    });
    years.appendChild(bars);
    years.appendChild(el("p", "gr-sub", "In EHS credits, after conversion — not in your old school's units."));
    grid.appendChild(years);
    sec.appendChild(grid);
    return sec;
  }

  /* ---------------------------------------------------------------- Risk
     One area, named once, with its evidence. Never a verdict about a person:
     the sentence has to survive being read by the student on a bad day. */
  function gradRisk(g, opts) {
    var r = g.risk;
    var sec = el("section", "gr-risk");
    sec.appendChild(el("p", "gr-kicker", "Where the next hour pays most"));
    var h = el("h3"); h.textContent = r.name; sec.appendChild(h);
    var ul = el("ul", "gr-evidence");
    r.evidence.forEach(function (e) { var li = el("li"); li.textContent = e; ul.appendChild(li); });
    sec.appendChild(ul);
    var says = el("p", "gr-lede");
    says.textContent = opts.canCommit ? r.says
      : r.says.replace(/\byour\b/g, "their").replace(/\byou\b/g, "they");
    sec.appendChild(says);
    return sec;
  }

  /* -------------------------------------------------------------- Pathway
     The state's rules, as printed on the transcript — not EHS's, which does
     not publish any. Kept because the record carries these results and
     because they decide which diploma New York would issue, which is worth
     knowing while a retake window is still open. */
  function gradPathway(g) {
    var b = g.board;
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("Your New York exam record", b.covered + " of 4 core areas covered"));

    var core = el("div", "gr-core");
    b.areas.forEach(function (a) {
      var cell = el("div", "gr-core-cell " + a.state);
      var nm = el("b"); nm.textContent = a.name; cell.appendChild(nm);
      var sc = el("span", "sc");
      sc.textContent = a.score == null ? "—" : String(a.score);
      cell.appendChild(sc);
      var st = el("em");
      st.textContent = a.state === "met" ? "Met at 65+"
        : a.state === "low_pass" ? a.toPass + " from 65"
        : a.state === "short" ? "Below the 55 band" : "No exam yet";
      cell.appendChild(st);
      if (a.exam) { var ex = el("i"); ex.textContent = a.exam + (a.sitting ? " · " + grMonth(a.sitting) : ""); cell.appendChild(ex); }
      core.appendChild(cell);
    });
    sec.appendChild(core);

    var paths = el("div", "gr-paths");
    b.pathways.forEach(function (p) {
      var card = el("div", "gr-path " + (p.met ? "met" : ""));
      var t = el("h4");
      t.innerHTML = (p.met ? svg(I.tick, true) : "") + "<span></span>";
      t.querySelector("span").textContent = p.name;
      card.appendChild(t);
      var sub = el("p", "gr-sub"); sub.textContent = p.says; card.appendChild(sub);
      if (p.met) { card.appendChild(el("p", "gr-plan-said", "Every condition on this path is met.")); }
      else {
        var ul = el("ul", "gr-evidence");
        p.blockers.forEach(function (x) { var li = el("li"); li.textContent = x; ul.appendChild(li); });
        card.appendChild(ul);
      }
      paths.appendChild(card);
    });
    sec.appendChild(paths);

    if (b.closest) {
      var near = el("div", "gr-near");
      near.innerHTML = '<span class="ic">' + svg(I.star, true) + "</span><div><b></b><p></p></div>";
      near.querySelector("b").textContent = b.closest.toPass +
        (b.closest.toPass === 1 ? " point" : " points") + " on " + b.closest.exam;
      near.querySelector("p").textContent =
        "Your best sitting is " + b.closest.score + ". Nothing else on this record changes so much for " +
        "so little — and a retake is a sitting, not a year.";
      sec.appendChild(near);
    }
    if (b.surplus.length) {
      sec.appendChild(el("p", "gr-sub", "Blocks nothing: " + b.surplus.map(function (s) {
        return s.name + (s.score == null ? "" : " " + s.score); }).join(", ") +
        ". That area is already covered by another exam."));
    }
    var note = el("p", "gr-note"); note.textContent = b.says; sec.appendChild(note);
    return sec;
  }

  function gradNotes(g) {
    var sec = el("section", "gr-notes");
    sec.appendChild(el("h3", null, "How these numbers are worked out"));
    var ul = el("ul");
    g.assumptions.concat([
      "Diploma rules follow Excel High School’s published policies: the " + g.track.total +
      "-credit track, up to " + g.track.transferCap + " credits by transfer, at least " + g.track.minAtEhs +
      " earned at EHS, and a 60% passing mark."
    ]).forEach(function (a) { var li = el("li"); li.textContent = a; ul.appendChild(li); });
    sec.appendChild(ul);
    return sec;
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
     laptop the next time they open OEdu. That is the whole point of the
     backend existing, and it is the one thing this console could not do
     before it. */

  /* --------------------------------------------------------------- The rail
     The console is not a tab in a student's app. It is a different job done by
     a different person, and until now it was five words in a row above a page
     of cards — which is fine for five screens and stops working at eight.

     So it gets the shape every operations console has converged on: a fixed
     left rail holding the whole surface at once, grouped by the part of the
     job it belongs to, with the work itself filling everything to the right of
     it. Cloudflare's dashboard is the clearest version of that pattern and the
     structure here is deliberately theirs — account at the top, search under
     it, labelled groups, the account's own settings at the foot.

     What is not theirs is the weight. A console is read for eight hours a day
     by somebody who is not interested in it, so: no chevron on a row that does
     not expand, no icon competing with the word beside it, no coloured status
     dots, one accent and it is only ever on the row you are standing on. The
     numbers on the right are the only thing allowed to be loud, because they
     are the only thing that changes.

     And nothing in the rail is a claim. A count beside a class is a count of
     rows the server returned; there is no sparkline, because there is no time
     series behind one and a drawn trend that nothing measured is a decoration
     people read as a fact. */

  var SECTIONS = [
    { k: "today",   name: "Today",       group: null,         roles: ["admin", "teacher"] },
    { k: "roster",  name: "Gradebook",   group: "Teaching",   roles: ["admin", "teacher"] },
    { k: "students",name: "Students",    group: "Teaching",   roles: ["admin", "teacher"] },
    { k: "work",    name: "Work",        group: "Teaching",   roles: ["admin", "teacher"] },
    { k: "sets",    name: "Study sets",  group: "Teaching",   roles: ["admin", "teacher"] },
    { k: "reports", name: "Report cards",group: "Reporting",  roles: ["admin", "teacher"] },
    { k: "courses", name: "Courses",     group: "School",     roles: ["admin", "teacher"] },
    { k: "activity",name: "Activity",    group: "School",     roles: ["admin", "teacher"] },
    { k: "people",  name: "People",      group: "School",     roles: ["admin"] },
    { k: "system",  name: "System",      group: "School",     roles: ["admin"] }
  ];

  function allowedTabs() {
    if (!S.me) return [];
    return SECTIONS.filter(function (t) { return t.roles.indexOf(S.me.role) > -1; });
  }

  function sectionNamed(k) {
    var found = allowedTabs().filter(function (t) { return t.k === k; })[0];
    return found || allowedTabs()[0];
  }

  /* Built once and kept. The rail must not be torn down and rebuilt on every
     navigation — a list that redraws under the pointer is a list you cannot
     aim at, and the one thing a rail owes you is that it never moves. */
  function drawRail() {
    var rail = $("#rail");
    if (rail.dataset.built === "1") { markRail(); return; }
    rail.innerHTML = "";

    var who = el("button", "cn-org");
    who.type = "button";
    who.innerHTML = '<span class="av" aria-hidden="true"></span>' +
      '<span class="t"><b>' + esc(S.me.name) + "</b><span>" +
      esc(S.me.role === "admin" ? "Administrator" : "Teacher") + "</span></span>";
    var av = who.querySelector(".av");
    av.textContent = S.me.initials || "";
    av.style.background = S.me.hue || "";
    who.addEventListener("click", function () { openAccount(); });
    rail.appendChild(who);

    var find = el("button", "cn-find");
    find.type = "button";
    find.innerHTML = "<span>Search</span><kbd>" +
      (/Mac|iP(hone|ad)/.test(navigator.platform) ? "⌘K" : "Ctrl K") + "</kbd>";
    find.addEventListener("click", openFinder);
    rail.appendChild(find);

    var nav = el("nav", "cn-nav");
    nav.setAttribute("aria-label", "Console");
    var lastGroup;                    // undefined matches no group, so the first one prints
    allowedTabs().forEach(function (t) {
      if (t.group !== lastGroup) {
        lastGroup = t.group;
        if (t.group) nav.appendChild(el("p", "cn-group", esc(t.group)));
      }
      var b = el("button", "cn-item");
      b.type = "button";
      b.dataset.k = t.k;
      b.appendChild(el("span", "nm", esc(t.name)));
      b.appendChild(el("span", "ct"));
      b.addEventListener("click", function () { openAdmin(false, t.k); });
      nav.appendChild(b);
    });
    rail.appendChild(nav);

    /* The foot of the rail, and there is deliberately no way from here into
       the student app: the console is not a mode this person is visiting.

       The label is what the button does. The account chip at the top of the
       rail opens the account; this signs out, and a row that said "Sign out"
       while opening a settings page would be the kind of small lie that
       teaches people not to trust the rest of the labels. */
    var foot = el("div", "cn-foot");
    var out = el("button", "cn-item quiet", "<span class='nm'>Sign out</span>");
    out.type = "button";
    out.addEventListener("click", function () {
      if (confirm("Sign out of OEdu?")) signOut();
    });
    foot.appendChild(out);
    rail.appendChild(foot);

    rail.dataset.built = "1";
    markRail();
  }

  function markRail() {
    var rail = $("#rail");
    [].forEach.call(rail.querySelectorAll(".cn-item[data-k]"), function (b) {
      var on = b.dataset.k === S.tab;
      b.classList.toggle("on", on);
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
  }

  /* The counts beside the rail's rows. They are written after the console's
     first screen has loaded, from the same payload it drew itself with, so
     the rail and the page can never say different numbers. */
  function railCount(k, n) {
    var b = $("#rail").querySelector(".cn-item[data-k='" + k + "']");
    if (!b) return;
    var slot = b.querySelector(".ct");
    slot.textContent = n ? String(n) : "";
    slot.className = "ct" + (n ? " on" : "");
  }

  function openAdmin(silent, tab) {
    if (!allowedTabs().length) return;
    S.tab = sectionNamed(tab || S.tab).k;
    if (!silent) enter("admin:" + S.tab, "Console", function () { openAdmin(true, S.tab); });

    document.body.classList.add("is-console");
    applyDensity(currentDensity());
    drawRail();
    closeRail();

    var v = $("#v-admin");
    v.innerHTML = "";
    var body = el("div", "admin-body");
    v.appendChild(body);
    ({ today: consoleHome, roster: tabRoster, students: tabStudents, work: tabWork,
       sets: tabSets, reports: tabReports, courses: tabCourses, activity: tabActivity,
       people: tabPeople, system: tabSystem }[S.tab] || consoleHome)(body);

    noFoot(); progress(null);
    show("admin");
  }

  /* Leaving the console puts the student's chrome back. It is one class on the
     body rather than two apps, because a teacher who is also studying should
     not have to sign in twice to be both. */
  function leaveConsole() {
    /* For staff there is nowhere to leave to. The account screen and every
       other view they can reach is drawn inside the console's shell, so the
       rail stays and the student's chrome never appears — without this guard
       opening Account would strand them on a page with no navigation at all. */
    if (document.body.classList.contains("is-staff")) { closeRail(); return; }
    document.body.classList.remove("is-console");
    document.body.classList.remove("focus-mode");
    closeRail();
  }

  function closeRail() { document.body.classList.remove("rail-open"); }

  /* A heading, the same on every console screen: what this is, and what it is
     about. Cloudflare puts the account above the page title; the same idea,
     fewer words. */
  function consoleHead(v, eyebrow, title, sub) {
    var h = el("header", "cn-head");
    if (eyebrow) h.appendChild(el("p", "cn-eyebrow", esc(eyebrow)));
    h.appendChild(el("h1", "cn-h1", esc(title)));
    if (sub) h.appendChild(el("p", "cn-sub", sub));
    v.appendChild(h);
    return h;
  }

  /* ------------------------------------------------------------------ Today
     Every class at once, and what each one owes. This is the screen a teacher
     opens first and it has one job: say where the work is. */
  function consoleHome(v) {
    var when = new Date();
    consoleHead(v, when.toLocaleDateString(undefined,
      { weekday: "long", day: "numeric", month: "long" }),
      greeting() + ", " + esc(S.me.first || String(S.me.name).split(" ")[0]) + ".");

    var node = loading(v, "your classes");
    API.reporting.teaching().then(function (data) {
      node.remove();
      var t = data.totals;

      /* Nothing set up yet. Five zeroes and a sentence telling somebody to go
         to another screen is the worst thing a product can open with: it
         reports on work that does not exist and then declines to help start
         it. So on the first day the numbers are not drawn at all, and the
         screen is the one thing there is to do. */
      if (!data.courses.length) {
        var start = el("div", "cn-start");
        start.appendChild(el("h2", null, "Let’s get your first class in."));
        start.appendChild(el("p", null,
          "A course is what carries enrolment, work and grades. Start from one Oplo " +
          "has already written — the units and the grading scheme come with it — or " +
          "make your own from nothing."));
        var sacts = cnActions();
        sacts.appendChild(cnAction("Explore courses", openCatalogue, true));
        sacts.appendChild(cnAction("Create one from nothing",
          function () { openCourseEditor(null); }));
        start.appendChild(sacts);
        v.appendChild(start);
        railCount("roster", 0);
        return;
      }

      /* The tiles. Five numbers, no charts: there is no time series behind
         any of these, and a sparkline drawn over one point is a drawing. */
      var tiles = el("div", "cn-tiles");
      [["Unmarked", t.unmarked, t.unmarked ? "owe" : ""],
       ["Past due", t.overdue, t.overdue ? "late" : ""],
       ["Below a pass", t.atRisk, ""],
       ["Students", t.students, ""],
       ["Classes", t.courses, ""]].forEach(function (x) {
        var tile = el("div", "cn-tile" + (x[2] ? " " + x[2] : ""));
        tile.innerHTML = "<b>" + x[1] + "</b><span>" + x[0] + "</span>";
        tiles.appendChild(tile);
      });
      v.appendChild(tiles);
      railCount("roster", t.unmarked);

      if (!data.courses.length) {
        v.appendChild(el("div", "lx-empty",
          S.me.role === "admin"
            ? "You are not teaching anything yet. Create a course and enrol yourself as its " +
              "teacher, and it appears here."
            : "You are not teaching any courses yet. An administrator enrols you as a " +
              "teacher, and your classes appear here."));
        return;
      }

      v.appendChild(el("h2", "cn-h2", "Your classes"));
      var list = el("div", "cn-rows");
      data.courses.forEach(function (c) {
        var row = el("button", "cn-row");
        row.type = "button";
        /* "All marked" on a class with nobody in it, or nothing set, is a
           product telling a teacher they are finished before they have
           started. Say what is actually missing. */
        var state = !c.students
          ? "<em class='owe'>nobody enrolled</em>"
          : !c.work
            ? "<em class='owe'>no work set</em>"
            : c.unmarked
              ? "<em class='" + (c.overdue ? "late" : "owe") + "'>" + c.unmarked + " unmarked" +
                (c.overdue ? " · " + c.overdue + " past due" : "") + "</em>"
              : "<em class='done'>all marked</em>";
        row.innerHTML =
          "<span class='t'><b>" + esc(c.title) + "</b><span>" +
            esc(c.subject || c.code) + " · " + c.students +
            (c.students === 1 ? " student" : " students") + "</span></span>" +
          "<span class='m'>" + (c.average == null ? "<i>—</i>" : "<i>" + c.average + "%</i>") +
            "<span>class average</span></span>" +
          "<span class='s'>" + state + "</span>";
        row.addEventListener("click", function () {
          S.courseId = c.id;
          openAdmin(false, "roster");
        });
        list.appendChild(row);
      });
      v.appendChild(list);

      /* What is owed, named, across every class — the same strip the gradebook
         shows for one, which is the point: it is the same computation on the
         server, asked over more courses. */
      var needs = [];
      data.courses.forEach(function (c) {
        (c.needs || []).forEach(function (n) { needs.push({ course: c, need: n }); });
      });
      if (needs.length) {
        v.appendChild(el("h2", "cn-h2", "Needs you"));
        var owed = el("div", "cn-rows tight");
        needs.slice(0, 6).forEach(function (x) {
          var row = el("button", "cn-row");
          row.type = "button";
          row.innerHTML =
            "<span class='t'><b>" + esc(x.need.title) + "</b><span>" +
              esc(x.course.title) + "</span></span>" +
            "<span class='m'></span>" +
            "<span class='s'><em class='" + (x.need.kind === "overdue" ? "late" : "owe") + "'>" +
              x.need.count + " unmarked" +
              (x.need.kind === "overdue" ? " · past due" : "") + "</em></span>";
          row.addEventListener("click", function () {
            S.courseId = x.course.id;
            openAdmin(false, "roster");
          });
          owed.appendChild(row);
        });
        v.appendChild(owed);
      }
    }, function (e) { failed(node, e, function () { openAdmin(true, "today"); }); });
  }

  /* ------------------------------------------------------------------- Work
     Everything set, across every class. The gradebook is where work is marked;
     this is where it is kept — renamed, re-weighted, given a due date, or
     removed. */
  function tabWork(v) {
    consoleHead(v, "Teaching", "Work",
      "Everything set across your classes. A piece of work is a column on the " +
      "gradebook, and what it is out of is what a mark on it is measured against.");

    var node = loading(v, "your classes");
    API.courses.mine().then(function (courses) {
      var teaching = S.me.role === "admin" ? courses
        : courses.filter(function (c) { return c.myRole === "teacher" || c.myRole === "assistant"; });
      node.remove();
      if (!teaching.length) {
        v.appendChild(S.me.role === "admin"
          ? cnEmpty("No classes yet, so there is nothing set.",
              "Work is set on a course. Make one first and its columns appear here.",
              "Explore courses", openCatalogue)
          : cnEmpty("No classes yet, so there is nothing set.",
              "An administrator enrols you as a teacher on a course, and the work you " +
              "set on it appears here."));
        return;
      }
      teaching.forEach(function (c) {
        var sec = el("section", "cn-block");
        var head = el("header", "cn-blockhead");
        head.innerHTML = "<h3>" + esc(c.title) + "</h3><span>" + esc(c.subject || c.code) + "</span>";
        var add = el("button", "cn-btn", "Set work");
        add.type = "button";
        add.addEventListener("click", function () { openAssignments(c); });
        head.appendChild(add);
        sec.appendChild(head);

        var slot = el("div");
        sec.appendChild(slot);
        var busy = loading(slot, "the list");
        API.courses.assignments(c.id).then(function (items) {
          busy.remove();
          if (!items.length) {
            slot.appendChild(el("div", "lx-empty",
              "Nothing set on this course yet."));
            return;
          }
          var list = el("div", "cn-rows tight");
          items.forEach(function (a) {
            var row = el("button", "cn-row");
            row.type = "button";
            row.innerHTML =
              "<span class='t'><b>" + esc(a.title) + "</b><span>" +
                esc(a.category || "uncategorised") + " · out of " + a.outOf + "</span></span>" +
              "<span class='m'></span>" +
              "<span class='s'>" + (a.dueAt ? "<em>due " + esc(dayName(a.dueAt)) + "</em>"
                                            : "<em class='done'>no due date</em>") + "</span>";
            row.addEventListener("click", function () { openAssignments(c); });
            list.appendChild(row);
          });
          slot.appendChild(list);
        }, function (e) { failed(busy, e, null); });
        v.appendChild(sec);
      });
    }, function (e) { failed(node, e, function () { openAdmin(true, "work"); }); });
  }

  /* ---------------------------------------------------------- Report cards
     Nothing is generated here. Every number a report card carries is already
     in the record, so the only questions left are whether the marking is
     finished and whether anybody has read what was written. */
  function tabReports(v) {
    consoleHead(v, "Reporting", "Report cards",
      "Reports are not built and they are not stored. Each one is the record, " +
      "read now — so the only thing that can be unfinished is the work behind it.");

    var node = loading(v, "the term");
    API.reporting.readiness({ courseId: S.reportCourse || null }).then(function (data) {
      node.remove();
      railCount("reports", data.counts.blocked + data.counts.review);

      var tiles = el("div", "cn-tiles");
      [["Ready", data.counts.ready, "done"],
       ["To review", data.counts.review, data.counts.review ? "owe" : ""],
       ["Blocked", data.counts.blocked, data.counts.blocked ? "late" : ""]].forEach(function (x) {
        var tile = el("div", "cn-tile" + (x[2] ? " " + x[2] : ""));
        tile.innerHTML = "<b>" + x[1] + "</b><span>" + x[0] + "</span>";
        tiles.appendChild(tile);
      });
      v.appendChild(tiles);

      /* The sentence a head teacher actually wants, said once and plainly.
         Not a percentage: "97% ready" is a number that hides four children. */
      v.appendChild(el("p", "cn-verdict" + (data.publishable ? " ok" : ""),
        !data.rows.length
          ? "There is nothing to report on yet."
          : data.publishable
            ? "Every report on this term is finished."
            : data.counts.blocked +
              (data.counts.blocked === 1 ? " report is waiting" : " reports are waiting") +
              " on marking that has not been done. Nothing can be sent out until it is."));

      if (data.courses.length > 1) {
        var pick = el("div", "gb-pick");
        var all = el("button", "gb-pickb" + (S.reportCourse ? "" : " on"));
        all.type = "button";
        all.innerHTML = "<b>Every class</b><span>" + data.rows.length + " reports</span>";
        all.addEventListener("click", function () {
          S.reportCourse = null; openAdmin(true, "reports");
        });
        pick.appendChild(all);
        data.courses.forEach(function (c) {
          var b = el("button", "gb-pickb" + (S.reportCourse === c.id ? " on" : ""));
          b.type = "button";
          b.innerHTML = "<b>" + esc(c.title) + "</b><span>" +
            (c.blocked ? c.blocked + " blocked" : c.review ? c.review + " to review" : "ready") +
            "</span>";
          b.addEventListener("click", function () {
            S.reportCourse = c.id; openAdmin(true, "reports");
          });
          pick.appendChild(b);
        });
        v.appendChild(pick);
      }

      if (!data.rows.length) return;

      /* Blocked first, then to review, then ready. An administrator opens this
         to find what is wrong, and sorting alphabetically buries it. */
      var order = { blocked: 0, review: 1, ready: 2 };
      var rows = data.rows.slice().sort(function (a, b) {
        return (order[a.state] - order[b.state]) ||
               String(a.student.name).localeCompare(String(b.student.name));
      });

      var list = el("div", "cn-rows");
      rows.forEach(function (r) {
        var row = el("button", "cn-row report " + r.state);
        row.type = "button";
        var why = r.reasons.length
          ? r.reasons.map(function (x) { return esc(x.text); }).join(" · ")
          : "Finished";
        row.innerHTML =
          "<span class='t'><b>" + esc(r.student.name) + "</b><span>" +
            esc(r.courseTitle) + "</span></span>" +
          "<span class='m'>" + (r.grade
            ? "<i>" + esc(r.grade.letter) + "</i><span>" + r.grade.percent + "%</span>"
            : "<i>—</i><span>no marks</span>") + "</span>" +
          "<span class='s'><em class='" +
            (r.state === "blocked" ? "late" : r.state === "review" ? "owe" : "done") + "'>" +
            (r.state === "blocked" ? "Blocked" : r.state === "review" ? "Review" : "Ready") +
            "</em><span class='why'>" + why + "</span></span>";
        row.addEventListener("click", function () { openReport(r.student); });
        list.appendChild(row);
      });
      v.appendChild(list);
    }, function (e) { failed(node, e, function () { openAdmin(true, "reports"); }); });
  }

  /* What the course's rules did to a number, said in a sentence. One
     implementation, used by the student's screen, the teacher's and the
     report card — three descriptions of one grade is three chances to
     disagree about it. */
  function policySays(sum, who) {
    if (!sum) return "";
    var they = who || "They";
    var bits = [];
    if (sum.dropped && sum.dropped.length) {
      bits.push("The lowest " +
        (sum.dropped.length === 1 ? "mark was dropped" : sum.dropped.length + " marks were dropped") +
        " under this course's rules: " +
        sum.dropped.map(function (d) { return esc(d.title); }).join(", ") + ".");
    }
    if (sum.lateCount) {
      bits.push(sum.lateCount + (sum.lateCount === 1 ? " piece" : " pieces") +
        " of work came in late, costing " +
        (Math.round(sum.latePenalty * 10) / 10) +
        (sum.latePenalty === 1 ? " point." : " points."));
    }
    if (sum.extraCredit) {
      bits.push((Math.round(sum.extraCredit * 10) / 10) +
        " points of extra credit are included, which can raise this grade and " +
        "could never have lowered it.");
    }
    if (sum.missingCount) {
      bits.push(sum.missingCount + (sum.missingCount === 1 ? " piece" : " pieces") +
        " of work marked as not handed in is counted as a zero, because it is one.");
    }
    return bits.join(" ");
  }

  /* ------------------------------------------------------- One student's report
     The document a school prints, except that it is not a document. Every
     course the student is enrolled in, the grade, where it is going, the marks
     behind it, and the sentence about the term — written here, next to the
     evidence for it, rather than in a separate screen that shows the teacher
     nothing while they try to remember. */
  function openReport(student) {
    enter("report:" + student.id, trim(student.name, 18), function () { openReport(student); });
    var v = $("#v-admin");

    function render() {
      v.innerHTML = "";
      var body = el("div", "admin-body");
      v.appendChild(body);
      var node = loading(body, "the report");

      API.reporting.report(student.id).then(function (rep) {
        node.remove();
        consoleHead(body, "Report card · this term", rep.student.name,
          rep.standing == null
            ? "Nothing marked yet."
            : "Standing " + rep.standing + "% across " + rep.courseCount +
              (rep.courseCount === 1 ? " course." : " courses.") +
              (rep.state === "ready" ? " Finished."
               : rep.state === "review" ? " Something here wants a second look."
               : " Marking is still outstanding."));

        if (!rep.courses.length) {
          body.appendChild(el("div", "lx-empty", "Not enrolled in anything yet."));
          return;
        }

        rep.courses.forEach(function (c) {
          body.appendChild(reportCourse(rep.student, c));
        });

        body.appendChild(el("p", "lx-lede",
          "This is the same record " + esc(rep.student.firstName || rep.student.name) +
          " reads on their own screen. There is no separate copy to publish and none to " +
          "keep in step — change a mark and this sentence changes with it."));
        show("admin");
      }, function (e) { failed(node, e, render); });
      show("admin");
    }

    render();
  }

  function reportCourse(student, c) {
    var sec = el("section", "cn-report");

    var head = el("header", "cn-reporthead");
    var trend = c.trend
      ? "<em class='tr " + c.trend.direction + "'>" +
        (c.trend.direction === "up" ? "↑ " : c.trend.direction === "down" ? "↓ " : "") +
        (c.trend.change > 0 ? "+" : "") + c.trend.change + "%</em>"
      : "";
    head.innerHTML =
      "<div class='t'><h3>" + esc(c.title) + "</h3><span>" + esc(c.subject || "") + "</span></div>" +
      "<div class='g'>" + (c.grade
        ? "<b>" + esc(c.grade.letter) + "</b><span>" + c.grade.percent + "%</span>" + trend
        : "<b>—</b><span>no marks</span>") + "</div>";
    sec.appendChild(head);

    var say = policySays(c.grade);
    if (c.grade && (c.grade.countedWeight < c.grade.totalWeight || say)) {
      sec.appendChild(el("p", "cn-fine",
        (c.grade.countedWeight < c.grade.totalWeight
          ? "Over the " + c.grade.countedWeight + "% of the grade marked so far. " : "") + say));
    }

    /* The evidence, beside the box the sentence goes in. A teacher writing
       thirty of these is otherwise writing from memory, and a comment written
       from memory is how last term's sentence ends up on this term's report. */
    if (c.evidence && c.evidence.byCategory.length) {
      var ev = el("div", "cn-ev");
      c.evidence.byCategory.forEach(function (p) {
        var chip = el("span", "cn-chip");
        chip.innerHTML = "<b>" + p.percent + "%</b> " + esc(p.category) +
          "<span>" + p.items + (p.items === 1 ? " mark" : " marks") + "</span>";
        ev.appendChild(chip);
      });
      if (c.trend) {
        var t = el("span", "cn-chip quiet");
        t.innerHTML = "<b>" + (c.trend.change > 0 ? "+" : "") + c.trend.change + "%</b> " +
          "second half against first<span>over " + c.trend.over + " marks</span>";
        ev.appendChild(t);
      }
      sec.appendChild(ev);
    }

    var box = el("div", "cn-comment");
    box.appendChild(el("label", "cn-lab", "The comment on this term"));
    var area = el("textarea");
    area.rows = 3;
    area.placeholder = "What " + (student.firstName || student.name) +
      " did this term, and what would help next term.";
    area.value = (c.comment && c.comment.body) || "";
    box.appendChild(area);

    var foot = el("div", "cn-commentfoot");
    var state = el("span", "cn-fine",
      c.comment && c.comment.author
        ? "Written by " + esc(c.comment.author) + " · " + esc(whenName(c.comment.updatedAt))
        : "Not written yet.");
    foot.appendChild(state);
    var save = el("button", "cn-btn strong", "Save");
    save.type = "button";
    save.addEventListener("click", function () {
      save.disabled = true;
      save.textContent = "Saving…";
      API.reporting.comment(c.courseId, student.id, area.value).then(function (cm) {
        save.disabled = false;
        save.textContent = "Save";
        state.textContent = cm && cm.author
          ? "Written by " + cm.author + " · just now"
          : "Saved.";
        toast("Comment saved.");
      }, function (e) {
        save.disabled = false;
        save.textContent = "Save";
        toast(e && e.message ? e.message : "The server refused that.");
      });
    });
    foot.appendChild(save);
    box.appendChild(foot);
    sec.appendChild(box);

    if (c.readiness.reasons.length) {
      var why = el("ul", "cn-why");
      c.readiness.reasons.forEach(function (r) {
        why.appendChild(el("li", r.kind === "mismatch" ? "flag" : null, esc(r.text)));
      });
      sec.appendChild(why);
    }

    var marks = el("details", "cn-marks");
    marks.appendChild(el("summary", null,
      c.marks.length + (c.marks.length === 1 ? " mark behind this" : " marks behind this")));
    var list = el("div", "cn-rows tight");
    c.marks.forEach(function (m) {
      var row = el("div", "cn-row flat");
      var said = m.status === "missing" ? "<em class='late'>Not handed in</em>"
        : m.status === "excused" ? "<em class='done'>Excused</em>"
        : m.score == null ? "<em>Not marked</em>"
        : "<i>" + m.score + " / " + m.outOf + "</i>";
      row.innerHTML =
        "<span class='t'><b>" + esc(m.title) + "</b><span>" + esc(m.category || "—") +
          (m.feedback ? " · " + esc(m.feedback) : "") + "</span></span>" +
        "<span class='m'></span>" +
        "<span class='s'>" + said + "</span>";
      list.appendChild(row);
    });
    marks.appendChild(list);
    sec.appendChild(marks);

    return sec;
  }

  /* ---------------------------------------------------------------- Finder
     ⌘K. It goes to a place, and that is all it does — there is no natural
     language behind it and nothing is being interpreted. A search box that
     answers questions is a promise; a search box that jumps to a screen is a
     shortcut, and the shortcut is the thing people use forty times a day. */
  function openFinder() {
    var wrap = $("#finder");
    wrap.hidden = false;
    wrap.innerHTML = "";

    var box = el("div", "cn-finder");
    var input = el("input", "cn-finderin");
    input.type = "text";
    input.placeholder = "Go to…";
    input.setAttribute("aria-label", "Go to");
    box.appendChild(input);
    var list = el("div", "cn-finderlist");
    box.appendChild(list);
    wrap.appendChild(box);

    var places = allowedTabs().map(function (t) {
      return { name: t.name, hint: t.group || "Console", go: function () { openAdmin(false, t.k); } };
    });
    places.push({ name: "Account", hint: "Sessions, password, sign out", go: openAccount });

    /* People, once they have been asked for. The roster is one request and it
       is the thing most often searched for, so it is fetched on the first ⌘K
       of a session and kept — but the box works before it arrives rather than
       waiting on it. */
    if (FOUND_PEOPLE) addPeople();
    else {
      API.reporting.students().then(function (data) {
        FOUND_PEOPLE = data.students;
        addPeople();
        draw();
      }, function () { /* the places still work */ });
    }
    function addPeople() {
      FOUND_PEOPLE.forEach(function (st) {
        places.push({
          name: st.name,
          hint: st.standing == null ? "Student" : "Student · " + st.standing + "%",
          go: function () { openReport(st); }
        });
      });
    }

    var picked = 0;
    function draw() {
      var term = input.value.trim().toLowerCase();
      var hits = places.filter(function (p) {
        return !term || p.name.toLowerCase().indexOf(term) > -1 ||
               p.hint.toLowerCase().indexOf(term) > -1;
      });
      if (picked >= hits.length) picked = Math.max(0, hits.length - 1);
      list.innerHTML = "";
      hits.forEach(function (p, i) {
        var b = el("button", "cn-finderrow" + (i === picked ? " on" : ""));
        b.type = "button";
        b.innerHTML = "<b>" + esc(p.name) + "</b><span>" + esc(p.hint) + "</span>";
        b.addEventListener("click", function () { closeFinder(); p.go(); });
        list.appendChild(b);
      });
      list.dataset.n = hits.length;
      box.hits = hits;
    }

    input.addEventListener("input", function () { picked = 0; draw(); });
    input.addEventListener("keydown", function (e) {
      var n = Number(list.dataset.n) || 0;
      if (e.key === "ArrowDown") { e.preventDefault(); picked = Math.min(n - 1, picked + 1); draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); picked = Math.max(0, picked - 1); draw(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        var p = box.hits[picked];
        if (p) { closeFinder(); p.go(); }
      } else if (e.key === "Escape") { closeFinder(); }
    });
    wrap.addEventListener("click", function (e) { if (e.target === wrap) closeFinder(); });

    draw();
    input.focus();
  }

  var FOUND_PEOPLE = null;

  function closeFinder() {
    var wrap = $("#finder");
    wrap.hidden = true;
    wrap.innerHTML = "";
  }

  /* Every screen here is waiting on a network call, so the three states a
     network call has — working, failed, empty — are drawn rather than
     assumed. A spinner that never resolves into an error is how a broken
     backend looks like a broken app. */
  function loading(v, what) {
    var n = el("div", "admin-loading", "Loading " + esc(what) + "…");
    v.appendChild(n);
    return n;
  }

  function failed(node, e, retry) {
    node.className = "admin-failed";
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
    var f = el("label", "admin-field");
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
    var f = el("label", "admin-field");
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
    var av = el("span", "admin-av");
    av.style.background = p.hue || "#6e6e73";
    av.textContent = p.initials ||
      String(p.name || "?").split(/\s+/).map(function (w) { return w[0]; })
        .join("").slice(0, 2).toUpperCase();
    return av;
  }

  /* ------------------------------------------------------------- Students
     The class, as one sheet.

     What was here before was a card per student, and a screen per student to
     mark them on. Marking one quiz for a class of twenty-eight meant opening
     twenty-eight screens, and the arithmetic a teacher actually does — who
     has not handed this in, what did the class find hard, who is sliding —
     was not on any of them. A gradebook that can only be read one person at a
     time is not a gradebook; it is twenty-eight report cards.

     So this is a grid: students down, work across, the grade at the end. It
     is the oldest interface in teaching and it is the right one, because the
     comparison a teacher needs is always between cells.

     Three rules hold it up.

     One: a cell is never ambiguous. Blank means nobody has marked it yet.
     `M` means it was not handed in and is being counted as a zero. `Ex` means
     the work does not apply to this student and is not in their grade at all.
     Those are three different facts and every gradebook that shows them as
     one blank cell eventually tells a student something untrue about
     themselves.

     Two: the browser never works out a grade. A mark is written, and the
     student's recomputed grade comes back with the response — from the same
     function on the server that the student's own screen reads. Two
     implementations of a weighted average disagree in the end, and the
     disagreement is always discovered by the person it costs.

     Three: nothing here is a draft. There is no save button, because there is
     no state in this page worth losing. A mark leaves the cell as it is
     typed, and the cell says whether it landed. */

  /* The book on screen: the server's payload, the DOM handles into it, and
     what the teacher has selected. It dies with the screen, so it lives here
     rather than in the record. */
  var BOOK = null;

  function tabRoster(v) {
    /* Every other console screen names itself. This one went straight into
       the class picker, which made it the one place you could arrive and not
       be told where you were. */
    consoleHead(v, "Teaching", "Gradebook",
      "Students down, work across. Type a score, <b>m</b> for not handed in, " +
      "<b>e</b> for excused.");

    var node = loading(v, "your courses");

    API.courses.mine().then(function (courses) {
      var teaching = S.me.role === "admin"
        ? courses
        : courses.filter(function (c) { return c.myRole === "teacher" || c.myRole === "assistant"; });

      if (!teaching.length) {
        node.remove();
        /* A sentence naming another screen, with no way to reach it, is a dead
           end. An administrator can make a course; a teacher cannot, and is
           told who can rather than sent somewhere that will refuse them. */
        v.appendChild(S.me.role === "admin"
          ? cnEmpty("No courses yet.",
              "A course is what carries enrolment, work and grades. Start from one Oplo " +
              "has written, or make your own.",
              "Explore courses", openCatalogue)
          : cnEmpty("You are not teaching any courses yet.",
              "An administrator enrols you as a teacher on a course, and it appears here " +
              "with its students."));
        return;
      }

      node.remove();
      if (!S.courseId || !teaching.some(function (c) { return c.id === S.courseId; })) {
        S.courseId = teaching[0].id;
      }

      /* One class at a time. A stack of grids is a stack of things to scroll
         past to reach the one being marked. */
      if (teaching.length > 1) {
        var pick = el("div", "gb-pick");
        teaching.forEach(function (c) {
          var b = el("button", "gb-pickb" + (c.id === S.courseId ? " on" : ""));
          b.type = "button";
          b.innerHTML = "<b>" + esc(c.title) + "</b><span>" + esc(c.subject || c.code) + "</span>";
          b.addEventListener("click", function () {
            S.courseId = c.id;
            openAdmin(true, "roster");
          });
          pick.appendChild(b);
        });
        v.appendChild(pick);
      }

      var host = el("div", "gb-host");
      v.appendChild(host);
      loadBook(host, S.courseId);
    }, function (e) { failed(node, e, function () { openAdmin(true, "roster"); }); });
  }

  /* One request for the whole class. It used to be one for the members, one
     for the work, and two per student — sixty-odd for a class of thirty, each
     able to fail on its own and leave the sheet half true. */
  function loadBook(host, courseId) {
    host.innerHTML = "";
    var node = loading(host, "the class");
    API.grades.book(courseId).then(function (book) {
      node.remove();
      BOOK = book;
      BOOK.host = host;
      BOOK.sel = null;
      drawBook();
    }, function (e) { failed(node, e, function () { loadBook(host, courseId); }); });
  }

  /* ---------------------------------------------------------- The cell
     A cell holds one of four things and has to be readable as which. */
  function cellText(g) {
    if (!g) return "";
    if (g.status === "missing") return "M";
    if (g.status === "excused") return "Ex";
    return g.score == null ? "" : String(g.score);
  }

  /* What a teacher typed, read as what they meant. Empty clears; `m` is not
     handed in; `e` does not apply. Anything else must be a number, and if it
     is not, nothing is written — a typo is not a grade. */
  function readCell(raw) {
    var t = String(raw == null ? "" : raw).trim().toLowerCase();
    if (!t || t === "-" || t === "—") return { status: "marked", score: null, late: false };
    if (t === "m" || t === "missing") return { status: "missing", score: null, late: false };
    if (t === "e" || t === "ex" || t === "excused") return { status: "excused", score: null, late: false };

    /* A trailing `l` means it came in late. Late is not a status — the mark
       is still a mark — so it rides along with the number rather than
       replacing it, and `18l` is the fastest way to say both at once. */
    var late = false;
    if (/l$/.test(t) && t.length > 1) { late = true; t = t.slice(0, -1).trim(); }

    var n = Number(t);
    if (!isFinite(n) || n < 0) return null;
    return { status: "marked", score: n, late: late };
  }

  function sameMark(g, want) {
    var have = g ? { status: g.status || "marked",
                     score: g.score == null ? null : Number(g.score), late: !!g.late }
                 : { status: "marked", score: null, late: false };
    return have.status === want.status && have.late === !!want.late &&
           have.score === (want.score == null ? null : Number(want.score));
  }

  /* --------------------------------------------------------- The sheet */
  function drawBook() {
    var host = BOOK.host;
    host.innerHTML = "";

    var students = BOOK.students, work = BOOK.assignments;

    var head = el("header", "gb-head");
    head.appendChild(el("div", "gb-title",
      "<h2>" + esc(BOOK.course.title) + "</h2><span>" +
      students.length + (students.length === 1 ? " student · " : " students · ") +
      (work.length ? work.length + (work.length === 1 ? " piece of work" : " pieces of work")
                   : "no work set yet") + "</span>"));

    var acts = cnActions();
    acts.appendChild(cnAction("Set work", function () { openAssignments(courseOf()); }));
    acts.appendChild(cnAction("Enrol", function () { openEnrol(courseOf()); }));
    /* Marking is the one thing in this product somebody does for an hour
       without stopping, so it gets a mode with nothing else on the screen.
       Escape comes back. */
    acts.appendChild(cnAction("Focus", function () {
      document.body.classList.add("focus-mode");
      toast("Focus. Escape to come back.");
    }));
    acts.appendChild(cnAction("Export", exportBook));
    head.appendChild(acts);
    host.appendChild(head);

    if (!students.length) {
      host.appendChild(el("div", "lx-empty",
        "Nobody is enrolled yet. Enrol a student and the sheet fills in."));
      return;
    }
    if (!work.length) {
      host.appendChild(el("div", "lx-empty",
        "No work has been set on this course, so there is nothing to mark. " +
        "Set a quiz or an assignment and a column appears here for it."));
      return;
    }

    host.appendChild(needsStrip());

    /* The sheet scrolls sideways under a frozen header and a frozen name
       column, because the two things you must never lose while marking are
       which student you are on and which piece of work. */
    var scroll = el("div", "gb-scroll");
    var sheet = el("div", "gb");
    sheet.style.setProperty("--gb-cols", work.length);
    scroll.appendChild(sheet);

    var hr = el("div", "gb-r head");
    hr.appendChild(el("div", "gb-c name", "<span class='gb-hn'>Student</span>"));
    work.forEach(function (a, ci) {
      var col = BOOK.columns[ci] || {};
      var b = el("button", "gb-c col");
      b.type = "button";
      b.dataset.c = ci;
      b.title = a.title + " · " + (a.category || "uncategorised") + " · out of " + a.outOf;
      b.innerHTML = "<b>" + esc(a.title) + "</b><span>out of " + a.outOf + "</span>" +
        (col.unmarked ? "<i class='gb-owed" + (col.overdue ? " late" : "") + "'>" +
                        col.unmarked + "</i>" : "");
      b.addEventListener("click", function () { selectColumn(ci); });
      hr.appendChild(b);
    });
    hr.appendChild(el("div", "gb-c grade head", "<span class='gb-hn'>Grade</span>"));
    hr.appendChild(el("div", "gb-c fill"));
    sheet.appendChild(hr);

    BOOK.cells = [];
    BOOK.gradeCells = [];
    students.forEach(function (st, ri) {
      var row = el("div", "gb-r");
      row.dataset.r = ri;

      var who = el("button", "gb-c name");
      who.type = "button";
      who.appendChild(avatarFor({ name: st.name, initials: st.initials, hue: st.hue }));
      who.appendChild(el("span", "gb-nm", esc(st.name)));
      who.addEventListener("click", function () { openStudent(st); });
      row.appendChild(who);

      BOOK.cells[ri] = [];
      work.forEach(function (a, ci) {
        var wrap = el("div", "gb-c cell");
        var input = el("input");
        input.type = "text";
        input.inputMode = "decimal";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.dataset.r = ri;
        input.dataset.c = ci;
        input.setAttribute("aria-label", st.name + " · " + a.title);
        var cell = { r: ri, c: ci, student: st, work: a, input: input, wrap: wrap,
                     grade: gradeAt(a.id, st.id) };
        input.value = cellText(cell.grade);
        paintCell(cell);

        input.addEventListener("focus", function () { selectCell(cell); });
        input.addEventListener("blur", function () { saveCell(cell); });
        wrap.appendChild(input);
        row.appendChild(wrap);
        BOOK.cells[ri][ci] = cell;
      });

      var g = el("div", "gb-c grade");
      g.dataset.r = ri;
      row.appendChild(g);
      row.appendChild(el("div", "gb-c fill"));
      BOOK.gradeCells[ri] = g;
      sheet.appendChild(row);
      paintGrade(ri);
    });

    var fr = el("div", "gb-r foot");
    fr.appendChild(el("div", "gb-c name", "<span class='gb-hn'>Class</span>"));
    work.forEach(function (a, ci) { fr.appendChild(el("div", "gb-c avg", "")); });
    fr.appendChild(el("div", "gb-c grade", ""));
    fr.appendChild(el("div", "gb-c fill"));
    sheet.appendChild(fr);
    BOOK.foot = fr;
    paintFoot();

    sheet.addEventListener("keydown", sheetKeys);
    sheet.addEventListener("paste", sheetPaste);
    host.appendChild(scroll);

    host.appendChild(el("p", "gb-hint",
      "Type a score. <b>m</b> for not handed in, <b>e</b> for excused, " +
      "<b>18l</b> for a mark handed in late, <b>blank</b> for not marked yet. " +
      "<b>Return</b> moves to the next student, <b>Tab</b> to the next piece of work. " +
      "<b>Paste</b> a column of marks from a spreadsheet straight into a cell."));

    host.appendChild(inspector());
  }

  function courseOf() {
    return { id: BOOK.course.id, title: BOOK.course.title, code: BOOK.course.code,
             subject: BOOK.course.subject, body: { grading: BOOK.course.grading } };
  }

  function gradeAt(assignmentId, accountId) {
    for (var i = 0; i < BOOK.grades.length; i++) {
      var g = BOOK.grades[i];
      if (g.assignmentId === assignmentId && g.accountId === accountId) return g;
    }
    return null;
  }

  function paintCell(cell) {
    var g = cell.grade;
    var cls = "gb-c cell";
    if (g && g.status === "missing") cls += " miss";
    else if (g && g.status === "excused") cls += " exc";
    else if (!g || g.score == null) {
      cls += " blank";
      var col = BOOK.columns[cell.c];
      if (col && col.overdue) cls += " late";
    }
    if (g && g.feedback) cls += " noted";
    if (g && g.late) cls += " tardy";
    cell.wrap.className = cls;
  }

  function paintGrade(ri) {
    var st = BOOK.students[ri];
    var node = BOOK.gradeCells[ri];
    if (!node) return;
    var sum = BOOK.summaries[st.id];
    if (!sum) { node.innerHTML = "<span class='gb-none'>—</span>"; return; }
    node.innerHTML = "<b>" + esc(sum.letter) + "</b><span>" + sum.percent + "%</span>";
    node.title = "Over the " + sum.countedWeight + "% of the grade marked so far.";
  }

  function paintFoot() {
    if (!BOOK.foot) return;
    var cells = BOOK.foot.querySelectorAll(".gb-c.avg");
    BOOK.assignments.forEach(function (a, ci) {
      var col = BOOK.columns[ci] || {};
      var n = cells[ci];
      if (!n) return;
      n.innerHTML = col.average == null ? "<span class='gb-none'>—</span>"
        : "<b>" + col.average + "%</b>";
      n.title = col.average == null ? "Nothing marked yet."
        : "The class average on " + a.title + ", over what has been marked.";
    });
  }

  /* A gradebook a teacher cannot get out of the building is a gradebook they
     do not own. This writes exactly what is on the screen — the same marks,
     the same three words for the three kinds of blank, and the grade the
     server computed — so the file and the sheet can never disagree.

     It is built from the payload already in the page rather than from a new
     endpoint, because "export" should never be able to show something the
     teacher was not already looking at. */
  function exportBook() {
    var rows = [];
    var head = ["Student", "Email"];
    BOOK.assignments.forEach(function (a) {
      head.push(a.title + " (out of " + a.outOf +
                (a.extraCredit ? ", extra credit" : "") + ")");
    });
    head.push("Grade", "Percent", "Over");
    rows.push(head);

    BOOK.students.forEach(function (st) {
      var line = [st.name, st.email || ""];
      BOOK.assignments.forEach(function (a) {
        var g = gradeAt(a.id, st.id);
        line.push(!g ? ""
          : g.status === "missing" ? "missing"
          : g.status === "excused" ? "excused"
          : g.score == null ? ""
          : String(g.score) + (g.late ? " late" : ""));
      });
      var sum = BOOK.summaries[st.id];
      line.push(sum ? sum.letter : "", sum ? sum.percent + "%" : "",
                sum ? sum.countedWeight + "% of the grade marked" : "");
      rows.push(line);
    });

    /* Quoted properly, because a student called "O'Shea, Liam" and a comment
       with a comma in it are both ordinary, and a CSV that breaks on them is
       a CSV somebody has to repair by hand. */
    var csv = rows.map(function (r) {
      return r.map(function (cell) {
        var v = String(cell == null ? "" : cell);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(",");
    }).join("\r\n");

    var name = String(BOOK.course.title).replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-|-$/g, "").toLowerCase() + "-" +
      new Date().toISOString().slice(0, 10) + ".csv";

    try {
      var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast(BOOK.students.length + " students exported.");
    } catch (e) {
      toast("This browser would not let the file be saved.");
    }
  }

  /* ------------------------------------------------------------ Writing
     A mark is written when the cell is left, not as it is typed. A request
     per keystroke would briefly store 9 while somebody types 95, and a grade
     that flickers is a grade a student can see flicker. */
  function saveCell(cell) {
    var want = readCell(cell.input.value);
    if (!want) {
      cell.input.value = cellText(cell.grade);
      toast("A score, m for not handed in, or e for excused.");
      return;
    }
    if (sameMark(cell.grade, want)) { cell.input.value = cellText(cell.grade); return; }
    if (want.score != null && want.score > cell.work.outOf * 1.5) {
      cell.input.value = cellText(cell.grade);
      toast(want.score + " is well above the " + cell.work.outOf + " this is out of.");
      return;
    }

    cell.wrap.classList.add("busy");
    API.grades.put(cell.work.id, cell.student.id,
                   { score: want.score, status: want.status, late: want.late,
                     outOf: cell.work.outOf })
      .then(function (r) {
        cell.wrap.classList.remove("busy");
        cell.grade = r.grade;
        replaceGrade(r.grade);
        cell.input.value = cellText(r.grade);
        paintCell(cell);
        applySummary(cell.student.id, r.summary);
        flash(cell.wrap);
        if (BOOK.sel && BOOK.sel.cell === cell) drawInspector();
        statsSoon();
      }, function (e) {
        cell.wrap.classList.remove("busy");
        cell.input.value = cellText(cell.grade);
        cell.wrap.classList.add("bad");
        setTimeout(function () { cell.wrap.classList.remove("bad"); }, 1400);
        toast(e && e.message ? e.message : "The server refused that mark.");
      });
  }

  function replaceGrade(g) {
    for (var i = 0; i < BOOK.grades.length; i++) {
      if (BOOK.grades[i].assignmentId === g.assignmentId &&
          BOOK.grades[i].accountId === g.accountId) { BOOK.grades[i] = g; return; }
    }
    BOOK.grades.push(g);
  }

  function applySummary(accountId, summary) {
    if (summary) BOOK.summaries[accountId] = summary;
    else delete BOOK.summaries[accountId];
    var ri = BOOK.students.findIndex(function (s) { return s.id === accountId; });
    if (ri > -1) paintGrade(ri);
  }

  function flash(node) {
    node.classList.add("ok");
    setTimeout(function () { node.classList.remove("ok"); }, 900);
  }

  /* The class's own numbers — what each column averages, what is still owed —
     are the server's arithmetic too, so they are re-read rather than
     recomputed here. Debounced, because they are not what the teacher is
     looking at while they type. */
  var statsTimer = null;
  function statsSoon() {
    clearTimeout(statsTimer);
    statsTimer = setTimeout(function () {
      var courseId = BOOK && BOOK.course.id;
      if (!courseId) return;
      API.grades.book(courseId).then(function (fresh) {
        if (!BOOK || BOOK.course.id !== courseId) return;   // they moved on
        BOOK.columns = fresh.columns;
        BOOK.needs = fresh.needs;
        BOOK.summaries = fresh.summaries;
        paintFoot();
        BOOK.students.forEach(function (s, ri) { paintGrade(ri); });
        var strip = BOOK.host.querySelector(".gb-needs");
        if (strip) strip.replaceWith(needsStrip());
        var heads = BOOK.host.querySelectorAll(".gb-c.col");
        BOOK.assignments.forEach(function (a, ci) {
          var col = BOOK.columns[ci] || {}, h = heads[ci];
          if (!h) return;
          var owed = h.querySelector(".gb-owed");
          if (!col.unmarked) { if (owed) owed.remove(); return; }
          if (!owed) { owed = el("i", "gb-owed"); h.appendChild(owed); }
          owed.className = "gb-owed" + (col.overdue ? " late" : "");
          owed.textContent = col.unmarked;
        });
        // A selected column's inspector is a statement about these numbers —
        // "14 not marked yet" — so it is stale the moment they are not.
        if (BOOK.sel && BOOK.sel.kind === "col") drawInspector();
      }, function () { /* the sheet is still true; only the totals are stale */ });
    }, 700);
  }

  /* --------------------------------------------------------- Navigation */
  function focusCell(r, c) {
    var row = BOOK.cells[r];
    if (!row || !row[c]) return;
    row[c].input.focus();
    row[c].input.select();
  }

  function sheetKeys(e) {
    var t = e.target;
    if (!t || !t.dataset || t.dataset.r == null || t.tagName !== "INPUT") return;
    var r = Number(t.dataset.r), c = Number(t.dataset.c);
    var rows = BOOK.cells.length, cols = BOOK.assignments.length;

    if (e.key === "Enter") {
      e.preventDefault();
      t.blur();
      focusCell(e.shiftKey ? Math.max(0, r - 1) : Math.min(rows - 1, r + 1), c);
    } else if (e.key === "ArrowDown") {
      e.preventDefault(); t.blur(); focusCell(Math.min(rows - 1, r + 1), c);
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); t.blur(); focusCell(Math.max(0, r - 1), c);
    } else if (e.key === "Escape") {
      var cell = BOOK.cells[r][c];
      t.value = cellText(cell.grade);
      t.blur();
    } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") &&
               t.selectionStart === t.selectionEnd &&
               (e.key === "ArrowLeft" ? t.selectionStart === 0
                                      : t.selectionStart === t.value.length)) {
      // Only when the caret is already at the end it would leave: inside a
      // two-digit score the arrows still move the caret, which is what a
      // person typing expects them to do.
      e.preventDefault(); t.blur();
      focusCell(r, e.key === "ArrowLeft" ? Math.max(0, c - 1) : Math.min(cols - 1, c + 1));
    }
  }

  /* ------------------------------------------------------------------ Paste
     Teachers have their marks in a spreadsheet. They always have. A gradebook
     that makes them retype thirty numbers they already have in a column is
     asking them to do the same work twice, and the second time is the one
     with the typos in it.

     So a column pasted from anywhere — Excel, Numbers, Sheets, a text file —
     fills down from the cell it was pasted into. Nothing is written until the
     teacher has seen what it would do: a paste that silently wrote thirty
     marks would be the most frightening button in the product. */
  function sheetPaste(e) {
    var t = e.target;
    if (!t || t.tagName !== "INPUT" || t.dataset.r == null) return;
    var text = (e.clipboardData || window.clipboardData).getData("text") || "";
    var lines = text.replace(/\r/g, "").split("\n");

    // One value is not a column. Let the browser paste it into the cell.
    if (lines.length < 2) return;
    e.preventDefault();

    var r0 = Number(t.dataset.r), c = Number(t.dataset.c);
    var work = BOOK.assignments[c];

    /* A row from a spreadsheet may be "Amara Bello<TAB>18". Take the last
       non-empty column: the marks are what was copied, whatever came with
       them. */
    var wanted = [], skipped = [], bad = [];
    for (var i = 0; i < lines.length && (r0 + i) < BOOK.cells.length; i++) {
      var raw = lines[i];
      if (!String(raw).trim()) { skipped.push(r0 + i); continue; }
      var cols = String(raw).split("\t").filter(function (x) { return String(x).trim(); });
      var want = readCell(cols[cols.length - 1]);
      var student = BOOK.students[r0 + i];
      if (!want) { bad.push(student.name + " · “" + trim(String(raw).trim(), 14) + "”"); continue; }
      if (want.score != null && want.score > work.outOf * 1.5) {
        bad.push(student.name + " · " + want.score + " over " + work.outOf);
        continue;
      }
      wanted.push({ r: r0 + i, student: student, want: want });
    }

    var over = lines.filter(function (x) { return String(x).trim(); }).length -
               (wanted.length + bad.length);

    if (!wanted.length) {
      toast(bad.length ? "None of that could be read as a mark." : "Nothing to paste.");
      return;
    }

    var says = "Put " + wanted.length + (wanted.length === 1 ? " mark" : " marks") +
      " into “" + work.title + "”, starting at " + wanted[0].student.name + "?" +
      (bad.length ? "\n\n" + bad.length + " could not be read and will be left alone:\n" +
                    bad.slice(0, 5).join("\n") + (bad.length > 5 ? "\n…" : "") : "") +
      (over > 0 ? "\n\n" + over + " more than there are students — those are ignored." : "");
    if (!confirm(says)) return;

    var entries = wanted.map(function (x) {
      return { assignmentId: work.id, accountId: x.student.id, outOf: work.outOf,
               score: x.want.score, status: x.want.status, late: x.want.late };
    });

    API.grades.batch(entries).then(function (res) {
      (res.grades || []).forEach(function (g) {
        replaceGrade(g);
        var ri = BOOK.students.findIndex(function (st) { return st.id === g.accountId; });
        if (ri < 0) return;
        var cell = BOOK.cells[ri][c];
        cell.grade = g;
        cell.input.value = cellText(g);
        paintCell(cell);
        flash(cell.wrap);
      });
      Object.keys(res.summaries || {}).forEach(function (id) {
        applySummary(id, res.summaries[id]);
      });
      if ((res.refused || []).length) {
        toast(res.grades.length + " written, " + res.refused.length + " refused: " +
              res.refused[0].message);
      } else {
        toast(res.grades.length + " marks pasted.");
      }
      statsSoon();
    }, function (err) {
      toast(err && err.message ? err.message : "The server refused that paste.");
    });
  }

  /* ------------------------------------------------------------ Needs you
     What is owed, named. It is deliberately short: a list of everything that
     could be done is a list nobody reads. */
  function needsStrip() {
    var strip = el("div", "gb-needs");
    if (!BOOK.needs.length) {
      strip.className = "gb-needs clear";
      strip.innerHTML = "<b>Everything set on this course is marked.</b>";
      return strip;
    }
    BOOK.needs.slice(0, 3).forEach(function (n) {
      var b = el("button", "gb-need" + (n.kind === "overdue" ? " late" : ""));
      b.type = "button";
      b.innerHTML = "<b>" + n.count + "</b><span>unmarked on " + esc(trim(n.title, 28)) +
        (n.kind === "overdue" ? " · past due" : "") + "</span>";
      b.addEventListener("click", function () {
        var ci = BOOK.assignments.findIndex(function (a) { return a.id === n.assignmentId; });
        if (ci < 0) return;
        selectColumn(ci);
        var first = BOOK.cells.findIndex(function (row) {
          var g = row[ci].grade;
          return !g || (g.status === "marked" && g.score == null);
        });
        if (first > -1) focusCell(first, ci);
      });
      strip.appendChild(b);
    });
    if (BOOK.needs.length > 3) {
      strip.appendChild(el("span", "gb-needmore",
        "and " + (BOOK.needs.length - 3) + " more"));
    }
    return strip;
  }

  /* ----------------------------------------------------------- Inspector
     One bar under the sheet, showing whatever is selected: a cell, or a whole
     column. It is where the things that do not fit in a cell live — the
     comment, the history, and the one bulk action worth having. */
  function inspector() {
    var bar = el("div", "gb-insp");
    bar.id = "gbInsp";
    return bar;
  }

  function selectCell(cell) {
    BOOK.sel = { kind: "cell", cell: cell };
    var sheet = BOOK.host.querySelector(".gb");
    if (sheet) {
      sheet.querySelectorAll(".gb-c.col.on").forEach(function (n) { n.classList.remove("on"); });
    }
    drawInspector();
  }

  function selectColumn(ci) {
    BOOK.sel = { kind: "col", c: ci };
    var heads = BOOK.host.querySelectorAll(".gb-c.col");
    heads.forEach(function (n, i) { n.classList.toggle("on", i === ci); });
    drawInspector();
  }

  function drawInspector() {
    var bar = BOOK.host.querySelector("#gbInsp");
    if (!bar) return;
    bar.innerHTML = "";
    var sel = BOOK.sel;
    if (!sel) { bar.className = "gb-insp"; return; }
    bar.className = "gb-insp on";

    if (sel.kind === "col") { drawColumnInspector(bar, sel.c); return; }

    var cell = sel.cell, g = cell.grade;
    bar.appendChild(el("div", "gb-iwho",
      "<b>" + esc(cell.student.name) + "</b><span>" + esc(cell.work.title) + "</span>"));

    var state = !g ? "Not marked"
      : g.status === "missing" ? "Not handed in — counted as 0 of " + cell.work.outOf
      : g.status === "excused" ? "Excused — not part of their grade"
      : g.score == null ? "Not marked"
      : g.score + " out of " + cell.work.outOf + (g.late ? " · handed in late" : "");
    bar.appendChild(el("div", "gb-istate", esc(state)));

    var fb = el("input", "gb-ifb");
    fb.type = "text";
    fb.placeholder = "A comment for " + esc(cell.student.firstName || cell.student.name) +
                     " — they see it with the mark";
    fb.value = (g && g.feedback) || "";
    fb.addEventListener("keydown", function (e) { if (e.key === "Enter") fb.blur(); });
    fb.addEventListener("blur", function () {
      var was = (cell.grade && cell.grade.feedback) || "";
      if (fb.value === was) return;
      API.grades.put(cell.work.id, cell.student.id, { feedback: fb.value })
        .then(function (r) {
          cell.grade = r.grade;
          replaceGrade(r.grade);
          paintCell(cell);
          toast(fb.value ? "Comment saved." : "Comment removed.");
        }, function (e) {
          fb.value = was;
          toast(e && e.message ? e.message : "The server refused that comment.");
        });
    });
    bar.appendChild(fb);

    var hist = el("button", "gb-ibtn", "History");
    hist.type = "button";
    hist.addEventListener("click", function () {
      showHistory(bar, { assignmentId: cell.work.id, accountId: cell.student.id },
                   cell.student.name + " · " + cell.work.title);
    });
    bar.appendChild(hist);
  }

  function drawColumnInspector(bar, ci) {
    var a = BOOK.assignments[ci], col = BOOK.columns[ci] || {};
    bar.appendChild(el("div", "gb-iwho",
      "<b>" + esc(a.title) + "</b><span>" + esc(a.category || "uncategorised") +
      " · out of " + a.outOf + (a.dueAt ? " · due " + esc(dayName(a.dueAt)) : "") + "</span>"));
    bar.appendChild(el("div", "gb-istate",
      col.marked + " marked · " + col.missing + " missing · " + col.excused +
      " excused · " + col.unmarked + " not marked yet"));

    if (col.unmarked) {
      var all = el("button", "gb-ibtn strong",
        "Mark the " + col.unmarked + " unmarked as missing");
      all.type = "button";
      all.addEventListener("click", function () { markRestMissing(ci, all); });
      bar.appendChild(all);
    }

    var edit = el("button", "gb-ibtn", "Edit work");
    edit.type = "button";
    edit.addEventListener("click", function () { openAssignments(courseOf()); });
    bar.appendChild(edit);
  }

  /* The one bulk action that earns its place. "Everybody I have not marked
     did not hand it in" is a decision a teacher makes once; making them make
     it thirty times is how an evening disappears. It is a write like any
     other, so it is recorded like any other and can be undone one cell at a
     time. */
  function markRestMissing(ci, btn) {
    var a = BOOK.assignments[ci];
    var entries = [];
    BOOK.cells.forEach(function (row) {
      var cell = row[ci], g = cell.grade;
      if (g && (g.status !== "marked" || g.score != null)) return;
      entries.push({ assignmentId: a.id, accountId: cell.student.id, status: "missing" });
    });
    if (!entries.length) return;
    if (!confirm("Mark " + entries.length + " " +
                 (entries.length === 1 ? "student" : "students") + " as not having handed in “" +
                 a.title + "”? Each one is counted as a zero.")) return;

    btn.disabled = true;
    btn.textContent = "Marking…";
    API.grades.batch(entries).then(function (r) {
      (r.grades || []).forEach(function (g) {
        replaceGrade(g);
        var ri = BOOK.students.findIndex(function (s) { return s.id === g.accountId; });
        if (ri < 0) return;
        var cell = BOOK.cells[ri][ci];
        cell.grade = g;
        cell.input.value = cellText(g);
        paintCell(cell);
      });
      Object.keys(r.summaries || {}).forEach(function (id) { applySummary(id, r.summaries[id]); });
      if ((r.refused || []).length) {
        toast(r.refused.length + " could not be marked: " + r.refused[0].message);
      } else {
        toast(r.grades.length + " marked as missing.");
      }
      statsSoon();
      drawInspector();
    }, function (e) {
      btn.disabled = false;
      btn.textContent = "Mark the " + entries.length + " unmarked as missing";
      toast(e && e.message ? e.message : "The server refused that.");
    });
  }

  /* -------------------------------------------------------------- History
     Every change to a mark, kept. Not a feature so much as the difference
     between a gradebook and a spreadsheet: a number that can be altered with
     no trace of having been altered is not a record of anything. */
  function showHistory(after, query, title) {
    var open = after.parentNode.querySelector(".gb-hist");
    if (open) open.remove();
    var panel = el("div", "gb-hist");
    panel.appendChild(el("p", "gb-histh", esc(title)));
    var node = loading(panel, "the history");
    // Directly under whatever was clicked, so on a list of marks the history
    // belongs visibly to the one it is about.
    after.parentNode.insertBefore(panel, after.nextSibling);

    API.grades.history(query).then(function (events) {
      node.remove();
      if (!events.length) {
        panel.appendChild(el("p", "admin-shape quiet", "No changes recorded yet."));
        return;
      }
      var list = el("ol", "gb-histl");
      events.forEach(function (ev, i) {
        var from = ev.fromStatus == null ? "entered"
          : ev.fromStatus === "missing" ? "was missing"
          : ev.fromStatus === "excused" ? "was excused"
          : ev.fromScore == null ? "was unmarked" : "was " + ev.fromScore;
        var to = ev.toStatus === "missing" ? "missing"
          : ev.toStatus === "excused" ? "excused"
          : ev.toScore == null ? "unmarked" : ev.toScore + " / " + ev.outOf;
        var li = el("li");
        li.innerHTML = "<b>" + esc(to) + "</b><span>" + esc(from) + " · " +
          esc(ev.actorName || "somebody") + " · " + esc(whenName(ev.at)) + "</span>";

        /* Undo, on the newest change only. Undoing something from three
           changes ago is not an undo — it is entering an old number, and
           calling it undo hides which one you are actually restoring. */
        if (i === 0 && S.me && S.me.role !== "student") {
          var back = el("button", "cn-btn small", "Undo");
          back.type = "button";
          back.addEventListener("click", function () {
            back.disabled = true;
            back.textContent = "Undoing…";
            API.grades.undo(ev.id).then(function (r) {
              toast("Put back to " +
                (r.grade.status === "missing" ? "missing"
                 : r.grade.status === "excused" ? "excused"
                 : r.grade.score == null ? "unmarked" : r.grade.score) + ".");
              // The reversal is a change like any other, so the sheet and the
              // history both have to be re-read rather than patched.
              if (BOOK && BOOK.course) loadBook(BOOK.host, BOOK.course.id);
              else openAdmin(true, S.tab);
            }, function (e) {
              back.disabled = false;
              back.textContent = "Undo";
              toast(e && e.message ? e.message : "The server refused that.");
            });
          });
          li.appendChild(back);
        }
        list.appendChild(li);
      });
      panel.appendChild(list);
      var close = el("button", "gb-ibtn", "Close");
      close.type = "button";
      close.addEventListener("click", function () { panel.remove(); });
      panel.appendChild(close);
    }, function (e) { failed(node, e, null); });
  }

  function dayName(ms) {
    var d = new Date(Number(ms));
    if (!isFinite(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function whenName(ms) {
    var d = new Date(Number(ms));
    if (!isFinite(d.getTime())) return "—";
    var mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + (mins === 1 ? " minute ago" : " minutes ago");
    if (mins < 60 * 24) {
      var h = Math.round(mins / 60);
      return h + (h === 1 ? " hour ago" : " hours ago");
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + ", " +
           d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  /* What the course's rules did to a number, said in a sentence. One
     implementation, used by the student's screen, the teacher's and the
     report card — three descriptions of one grade is three chances to
     disagree about it. */
  /* ------------------------------------------------------- One student
     The row, opened. Everything on this screen is also on the sheet; what it
     adds is the reason for the number — every mark that makes it up, the
     comment attached to each, and what the student sees. */
  function openStudent(st) {
    enter("student:" + st.id + ":" + BOOK.course.id, trim(st.name, 18),
          function () { openStudent(st); });
    var course = courseOf();
    var v = $("#v-admin");

    function render() {
      v.innerHTML = "";
      consoleHead(v, course.title, st.name);
      var node = loading(v, "their marks");

      Promise.all([
        API.courses.assignments(course.id),
        API.grades.list({ courseId: course.id, accountId: st.id })
      ]).then(function (out) {
        var work = out[0], data = out[1];
        node.remove();

        var byAssignment = {};
        (data.grades || []).forEach(function (g) { byAssignment[g.assignmentId] = g; });
        var sum = (data.summaries || [])[0];

        var mark = el("div", "admin-mark");
        if (sum) {
          mark.innerHTML = '<div class="big"><b>' + sum.letter + "</b><span>" +
            sum.percent + "%</span></div>";
          var parts = el("div", "admin-mark-parts");
          sum.parts.forEach(function (x) {
            var row = el("div", "admin-mark-part");
            row.innerHTML = "<span>" + esc(x.category) + "</span>" +
              '<div class="t"><i style="width:' + x.percent + '%"></i></div>' +
              "<em>" + x.percent + '%</em><span class="w">' + x.weight +
              "% of the grade · " + x.items + (x.items === 1 ? " item" : " items") + "</span>";
            parts.appendChild(row);
          });
          mark.appendChild(parts);
          if (sum.countedWeight < sum.totalWeight) {
            mark.appendChild(el("p", "admin-mark-say",
              "Computed over the " + sum.countedWeight + "% of the grade that has been " +
              "marked. Categories with nothing in them are left out rather than counted " +
              "as zero — a student who has not sat the final has not failed it. " +
              policySays(sum)));
          }
        } else {
          mark.innerHTML = '<p class="admin-shape quiet">Nothing marked yet.</p>';
        }
        v.appendChild(mark);

        var list = el("div", "gb-marks");
        work.forEach(function (a) {
          var g = byAssignment[a.id];
          var row = el("div", "gb-mark");
          var state = !g ? "not marked"
            : g.status === "missing" ? "not handed in"
            : g.status === "excused" ? "excused"
            : g.score == null ? "not marked" : g.score + " / " + a.outOf;
          row.innerHTML = "<div class='t'><b>" + esc(a.title) + "</b><span>" +
            esc(a.category || "—") + " · " + esc(state) + "</span></div>" +
            (g && g.feedback ? "<p class='fb'>" + esc(g.feedback) + "</p>" : "");
          var h = el("button", "gb-ibtn", "History");
          h.type = "button";
          h.addEventListener("click", function () {
            showHistory(row, { assignmentId: a.id, accountId: st.id },
                        st.name + " · " + a.title);
          });
          row.appendChild(h);
          list.appendChild(row);
        });
        v.appendChild(list);

        v.appendChild(el("p", "cn-sub",
          "This is what " + esc(st.firstName || st.name) + " sees on their own Grades tab, " +
          "computed by the server from the same record. Marks are entered on the sheet."));
        show("admin");
      }, function (e) { failed(node, e, render); });
      show("admin");
    }

    render();
  }

  /* ------------------------------------------------------------ Enrolment */
  function openEnrol(course) {
    enter("enrol:" + course.id, trim(course.title), function () { openEnrol(course); });
    var v = $("#v-admin");
    v.innerHTML = "";
    consoleHead(v, course.title, "Who is in this course",
      "A student enrolled here has this course on their own screen, and their work on " +
      "it counts towards their grade.");
    var node = loading(v, "people");

    Promise.all([API.accounts.list(S.me.orgId), API.courses.members(course.id)])
      .then(function (out) {
        var people = out[0], members = out[1];
        node.remove();
        var inCourse = {};
        members.forEach(function (m) { inCourse[m.id] = m.role; });

        v.appendChild(el("p", "cn-sub",
          "Enrolling a student is what gives you permission to grade them. The server " +
          "checks that relationship on every write, so this list is the permission, " +
          "not a display of it."));

        var others = people.filter(function (p) { return p.id !== S.me.id; });

        /* A school on its first day has no accounts but its own. The screen
           used to render two paragraphs and an empty box — a wall, at the
           exact moment somebody is trying to get started. */
        if (!others.length) {
          v.appendChild(S.me.role === "admin"
            ? cnEmpty("There are no other accounts yet.",
                "A student has to have an Oplo Account before they can be enrolled. Add " +
                "them once and the same sign-in carries them into every Oplo product.",
                "Add a person", function () { openPersonEditor(null); })
            : cnEmpty("There are no student accounts yet.",
                "An administrator creates accounts. Once they exist, they appear here and " +
                "you can enrol them."));
          show("admin");
          return;
        }

        /* A search, because an organisation with four hundred accounts is an
           organisation where scrolling to find one is the whole job. */
        var bar = el("div", "cn-bar");
        var find = el("input", "cn-search");
        find.type = "search";
        find.placeholder = "Find somebody";
        find.setAttribute("aria-label", "Find somebody");
        bar.appendChild(find);
        var count = el("span", "cn-fine");
        bar.appendChild(count);
        v.appendChild(bar);

        var list = el("div", "admin-picklist");
        find.addEventListener("input", function () {
          var term = find.value.trim().toLowerCase();
          var shown = 0;
          [].forEach.call(list.children, function (row) {
            var hit = !term || row.dataset.find.indexOf(term) > -1;
            row.hidden = !hit;
            if (hit) shown++;
          });
          count.textContent = term
            ? shown + (shown === 1 ? " person" : " people") + " match"
            : others.length + " in this organisation";
        });
        count.textContent = others.length + " in this organisation";

        others.forEach(function (p) {
          var row = el("label", "admin-pick");
          row.dataset.find = String(p.name + " " + (p.email || "")).toLowerCase();
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
      consoleHead(v, course.title, "Work set on this course");
      var node = loading(v, "the list");

      API.courses.assignments(course.id).then(function (items) {
        node.remove();
        var weights = (course.body && course.body.grading) || [["Work", 100]];
        v.appendChild(el("p", "cn-sub",
          "Each piece counts towards a category, and the categories carry the weights " +
          "the course sets: " + weights.map(function (w) { return w[0] + " " + w[1] + "%"; })
            .join(", ") + "."));

        var list = el("div", "admin-list");
        items.forEach(function (a) {
          var row = el("div", "admin-row");
          /* A piece of work can be edited. Until now it could only be added or
             removed, and removing it takes every grade on it — so fixing a
             typo in a title meant deleting thirty marks and typing them again.
             The API could always do this; nothing called it. */
          var open = el("button", "admin-rowmain");
          open.type = "button";
          open.innerHTML = '<span class="t"><b>' + esc(a.title) + "</b><span>" +
            esc(a.category || "uncategorised") + " · out of " + a.outOf +
            (a.extraCredit ? " · extra credit" : "") +
            (a.dueAt ? " · due " + esc(dayName(a.dueAt)) : "") + "</span></span>";
          open.addEventListener("click", function () {
            editWork(a, row, weights, render);
          });
          row.appendChild(open);

          var rm = el("button", "admin-x");
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

        var form = el("div", "admin-form");
        var title = field("Title", "", "Unit 5 quiz");
        var catF = el("label", "admin-field");
        catF.innerHTML = "<span>Category</span>";
        var cat = el("select");
        weights.forEach(function (w) {
          var o = el("option");
          o.value = w[0]; o.textContent = w[0] + " (" + w[1] + "% of the grade)";
          cat.appendChild(o);
        });
        catF.appendChild(cat);
        var outOf = field("Out of", "20");
        /* A due date is what lets the sheet tell "nobody has marked this yet"
           apart from "this was due on Tuesday and six people have not handed
           it in". The column stops being a list and starts being a deadline. */
        var due = field("Due", "", "optional");
        due.input.type = "date";
        /* Work that can raise a grade and never lower one. Not doing it is
           not a failure at it, so it is never counted as a zero and never
           dropped. */
        var xcF = el("label", "admin-field");
        xcF.innerHTML = "<span>Extra credit</span>";
        var xc = el("select");
        [["", "No — counts towards the grade"],
         ["1", "Yes — can only raise a grade"]].forEach(function (o) {
          var n = el("option");
          n.value = o[0]; n.textContent = o[1];
          xc.appendChild(n);
        });
        xcF.appendChild(xc);
        [title, catF, outOf, due, xcF].forEach(function (f) { form.appendChild(f); });
        v.appendChild(form);

        var acts = el("div", "admin-acts");
        var add = el("button", "lx-btn lg", "Set this work");
        add.type = "button";
        add.addEventListener("click", function () {
          if (!title.input.value.trim()) { toast("Give it a title."); return; }
          add.disabled = true;
          // Midnight at the end of the day named, in the teacher's own zone: a
          // date input says "the 14th", and work due on the 14th is late on
          // the 15th, not at midnight as the 14th begins.
          var dueAt = null;
          if (due.input.value) {
            var d = new Date(due.input.value + "T23:59:59");
            if (isFinite(d.getTime())) dueAt = d.getTime();
          }
          attempt(API.courses.addAssignment(course.id, {
            title: title.input.value.trim(),
            category: cat.value,
            outOf: Number(outOf.input.value) || 100,
            dueAt: dueAt,
            extraCredit: !!xc.value
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

  /* Editing one piece of work, in place, so the list it belongs to does not
     go away while you are looking at it. */
  function editWork(a, row, weights, done) {
    if (row.nextSibling && row.nextSibling.className === "admin-edit") {
      row.nextSibling.remove();
      return;
    }
    [].forEach.call(row.parentNode.querySelectorAll(".admin-edit"),
                    function (n) { n.remove(); });

    var box = el("div", "admin-edit");
    var form = el("div", "admin-form");
    var title = field("Title", a.title);
    var catF = el("label", "admin-field");
    catF.innerHTML = "<span>Category</span>";
    var cat = el("select");
    weights.forEach(function (w) {
      var o = el("option");
      o.value = w[0];
      o.textContent = w[0] + " (" + w[1] + "% of the grade)";
      if (w[0] === a.category) o.selected = true;
      cat.appendChild(o);
    });
    catF.appendChild(cat);
    var outOf = field("Out of", String(a.outOf));
    var due = field("Due", "");
    due.input.type = "date";
    if (a.dueAt) {
      var d = new Date(Number(a.dueAt));
      if (isFinite(d.getTime())) {
        due.input.value = d.getFullYear() + "-" +
          ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
      }
    }
    var xcF = el("label", "admin-field");
    xcF.innerHTML = "<span>Extra credit</span>";
    var xc = el("select");
    [["", "No — counts towards the grade"],
     ["1", "Yes — can only raise a grade"]].forEach(function (o) {
      var n = el("option");
      n.value = o[0]; n.textContent = o[1];
      if (!!o[0] === !!a.extraCredit) n.selected = true;
      xc.appendChild(n);
    });
    xcF.appendChild(xc);
    [title, catF, outOf, due, xcF].forEach(function (f) { form.appendChild(f); });
    box.appendChild(form);

    /* A mark is "18 out of 20" for as long as it exists — the grade keeps what
       it was out of rather than a pointer to whatever the work says today.
       That is the right design and it has a consequence worth saying out loud
       rather than letting somebody discover it. */
    box.appendChild(el("p", "cn-fine",
      "Marks already given keep what they were out of. Changing “out of” applies to " +
      "marks entered from now on; it does not rescale work that has already been graded."));

    var acts = el("div", "admin-acts");
    var save = el("button", "lx-btn lg", "Save");
    save.type = "button";
    save.addEventListener("click", function () {
      var t = title.input.value.trim();
      if (!t) { toast("Give it a title."); return; }
      var n = Number(outOf.input.value);
      if (!isFinite(n) || n <= 0) { toast("What is it out of?"); return; }
      var dueAt = null;
      if (due.input.value) {
        var dd = new Date(due.input.value + "T23:59:59");
        if (isFinite(dd.getTime())) dueAt = dd.getTime();
      }
      save.disabled = true;
      attempt(API.courses.updateAssignment(a.id, {
        title: t, category: cat.value, outOf: n, dueAt: dueAt, extraCredit: !!xc.value
      }), function () { toast("Saved."); done(); })
        .then(function () { save.disabled = false; });
    });
    acts.appendChild(save);
    var cancel = el("button", "lx-btn quiet", "Cancel");
    cancel.type = "button";
    cancel.addEventListener("click", function () { box.remove(); });
    acts.appendChild(cancel);
    box.appendChild(acts);

    row.parentNode.insertBefore(box, row.nextSibling);
    title.input.focus();
    title.input.select();
  }

  /* ============================================================== Primitives

     Three shapes, and every console screen is built from them.

     A **table**, because a teacher comparing thirty students is doing the one
     thing a table is for and the one thing a card grid makes impossible. The
     old console drew a card per student: 340px wide, a heading, an avatar, four
     statistics and two buttons, repeated. Twenty-eight of those is nine screens
     of scrolling to answer a question a table answers in one glance, and the
     comparison — which is the entire point — has to be held in the head.

     A **split view**, because selecting somebody should not be a page
     transition. Losing your place in a list to look at one row, and losing it
     again coming back, is the single most common way software wastes a
     professional's afternoon.

     An **inspector**, which is where everything that does not fit in a row
     lives. It changes with the selection and it never moves.

     Density is a variable rather than a redesign: the same markup at three
     row heights, chosen by the person doing the work. Somebody marking four
     hundred submissions wants more rows; somebody planning a lesson does not.
     The text does not get smaller — solving density with 10px type is how
     professional software becomes unreadable. */

  var DENSITY = ["comfortable", "standard", "dense"];

  function applyDensity(d) {
    if (DENSITY.indexOf(d) < 0) d = "standard";
    document.body.dataset.density = d;
    try { localStorage.setItem("oplo.console.density", d); } catch (e) { /* private mode */ }
  }

  function currentDensity() {
    try { return localStorage.getItem("oplo.console.density") || "standard"; }
    catch (e) { return "standard"; }
  }

  /* `cols` is [{ label, w, align }]. The returned node carries `.row()`, which
     is the only way rows are added — so every table in the console has the
     same alignment, the same header, and the same keyboard behaviour without
     any screen having to remember to ask for them. */
  function cnTable(cols) {
    var t = el("div", "cn-tbl");
    t.style.setProperty("--cols", cols.map(function (c) { return c.w || "1fr"; }).join(" "));

    /* A table whose columns are all unlabelled is a list of facts, not a
       table of data. Drawing an empty header over it is a rule with nothing
       above it. */
    var titled = cols.some(function (c) { return c.label; });
    if (titled) {
      var head = el("div", "cn-tr head");
      cols.forEach(function (c) {
        var s = el("span", "cn-th" + (c.align === "right" ? " r" : ""));
        s.textContent = c.label || "";
        head.appendChild(s);
      });
      t.appendChild(head);
    }

    var body = el("div", "cn-tbody");
    t.appendChild(body);

    t.row = function (cells, onPick, key) {
      var r = el(onPick ? "button" : "div", "cn-tr" + (onPick ? "" : " flat"));
      if (onPick) r.type = "button";
      if (key) r.dataset.key = key;
      cells.forEach(function (html, i) {
        var c = el("span", "cn-td" + (cols[i] && cols[i].align === "right" ? " r" : ""));
        if (html && html.nodeType) c.appendChild(html);
        else c.innerHTML = html == null ? "" : html;
        r.appendChild(c);
      });
      if (onPick) r.addEventListener("click", function () { onPick(r); });
      body.appendChild(r);
      return r;
    };

    /* Up and down move the selection. A table somebody works down all day has
       to be reachable from the keyboard, and Tab through thirty rows is not
       reachable, it is a punishment. */
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      var rows = [].slice.call(body.querySelectorAll(".cn-tr:not(.flat)"));
      var at = rows.indexOf(document.activeElement);
      if (at < 0) return;
      e.preventDefault();
      var next = rows[e.key === "ArrowDown" ? at + 1 : at - 1];
      if (next) { next.focus(); next.click(); }
    });

    t.select = function (key) {
      [].forEach.call(body.querySelectorAll(".cn-tr"), function (r) {
        r.classList.toggle("on", r.dataset.key === key);
      });
    };
    return t;
  }

  /* A list on the left, whatever is selected on the right. */
  function cnSplit(v) {
    var wrap = el("div", "cn-split");
    var left = el("div", "cn-splitleft");
    var right = el("div", "cn-splitright");
    wrap.appendChild(left);
    wrap.appendChild(right);
    v.appendChild(wrap);
    return { wrap: wrap, left: left, right: right };
  }

  /* An empty state says what to do next. "No data" says nothing and is the
     first thing a person sees on a screen they have never used. */
  function cnEmpty(title, body, action, go) {
    var n = el("div", "cn-empty");
    n.appendChild(el("b", null, esc(title)));
    if (body) n.appendChild(el("p", null, esc(body)));
    if (action && go) {
      var b = el("button", "cn-btn strong", esc(action));
      b.type = "button";
      b.addEventListener("click", go);
      n.appendChild(b);
    }
    return n;
  }

  function cnActions() { return el("div", "cn-acts"); }

  function cnAction(label, go, strong) {
    var b = el("button", "cn-btn" + (strong ? " strong" : ""), esc(label));
    b.type = "button";
    b.addEventListener("click", go);
    return b;
  }

  /* A filter bar. Deliberately a small fixed set per screen rather than a
     query builder: the four filters a teacher actually uses are worth one
     click each, and the fifth is worth a search box. */
  function cnFilters(options, current, pick) {
    var bar = el("div", "cn-filters");
    options.forEach(function (o) {
      var b = el("button", "cn-filter" + (o.k === current ? " on" : ""));
      b.type = "button";
      b.dataset.k = o.k;
      b.innerHTML = esc(o.name) + (o.n != null ? "<em>" + o.n + "</em>" : "");
      b.addEventListener("click", function () { pick(o.k); });
      bar.appendChild(b);
    });
    /* Which one is lit is a fact about the key, never about the label. A
       filter bar that decides by matching its own text breaks the day two
       filters start with the same word. */
    bar.mark = function (k) {
      [].forEach.call(bar.children, function (b) { b.classList.toggle("on", b.dataset.k === k); });
    };
    return bar;
  }

  function gradeCell(g) {
    if (!g) return "<span class='cn-none'>—</span>";
    return "<b class='cn-mk'>" + esc(g.letter) + "</b><span class='cn-pc'>" +
           g.percent + "%</span>";
  }

  /* ================================================================ Students
     The people, across every class, with the comparison a teacher is actually
     making visible in one screen. Selecting somebody fills the inspector; it
     does not take the list away. */
  function tabStudents(v) {
    consoleHead(v, "Teaching", "Students",
      "Everyone you teach, once. A student in three of your classes is one " +
      "row with three grades on it, not three rows.");

    var node = loading(v, "your students");
    API.reporting.students().then(function (data) {
      node.remove();
      railCount("students", data.totals.belowPass);

      if (!data.students.length) {
        API.courses.mine().then(function (courses) {
          var mine = courses.filter(function (c) {
            return S.me.role === "admin" || c.myRole === "teacher" || c.myRole === "assistant";
          });
          v.appendChild(mine.length
            ? cnEmpty("Nobody is enrolled yet.",
                "Enrol students into " + esc(mine[0].title) + " and they appear here, with " +
                "their standing in every class you share with them.",
                "Enrol students", function () { openEnrol(mine[0]); })
            : cnEmpty("Nobody is enrolled yet.",
                "Students are enrolled on a course, so there needs to be one first.",
                S.me.role === "admin" ? "Explore courses" : null,
                S.me.role === "admin" ? openCatalogue : null));
        }, function () {
          v.appendChild(cnEmpty("Nobody is enrolled yet.",
            "Enrol students into a class and they appear here."));
        });
        return;
      }

      var filters = [
        { k: "all", name: "Everyone", n: data.students.length },
        { k: "low", name: "Below a pass", n: data.totals.belowPass },
        { k: "missing", name: "Missing work",
          n: data.students.filter(function (s) { return s.missing > 0; }).length },
        { k: "unmarked", name: "Waiting on me",
          n: data.students.filter(function (s) { return s.unmarked > 0; }).length }
      ];
      S.studentFilter = S.studentFilter || "all";

      var bar = el("div", "cn-bar");
      var chips = cnFilters(filters, S.studentFilter, function (k) {
        S.studentFilter = k;
        draw();
      });
      bar.appendChild(chips);
      var search = el("input", "cn-search");
      search.type = "search";
      search.placeholder = "Find a student";
      search.setAttribute("aria-label", "Find a student");
      search.value = S.studentQuery || "";
      search.addEventListener("input", function () {
        S.studentQuery = search.value;
        draw();
      });
      bar.appendChild(search);
      v.appendChild(bar);

      var split = cnSplit(v);
      var listSlot = el("div");
      split.left.appendChild(listSlot);

      function matching() {
        var term = String(S.studentQuery || "").trim().toLowerCase();
        return data.students.filter(function (s) {
          if (S.studentFilter === "low" && !(s.standing != null && s.standing < 70)) return false;
          if (S.studentFilter === "missing" && !s.missing) return false;
          if (S.studentFilter === "unmarked" && !s.unmarked) return false;
          if (term && String(s.name).toLowerCase().indexOf(term) < 0 &&
              String(s.email || "").toLowerCase().indexOf(term) < 0) return false;
          return true;
        });
      }

      var table;
      function draw() {
        chips.mark(S.studentFilter);
        listSlot.innerHTML = "";
        var rows = matching();
        if (!rows.length) {
          listSlot.appendChild(cnEmpty("Nobody matches that.",
            "Clear the filter or the search to see everyone again."));
          return;
        }
        table = cnTable([
          { label: "Student", w: "minmax(160px, 1fr)" },
          { label: "Standing", w: "86px", align: "right" },
          { label: "Missing", w: "74px", align: "right" },
          { label: "Unmarked", w: "88px", align: "right" }
        ]);
        rows.forEach(function (s) {
          var who = el("span", "cn-who");
          who.appendChild(avatarFor(s));
          who.appendChild(el("span", "nm", esc(s.name)));
          table.row([
            who,
            s.standing == null ? "<span class='cn-none'>—</span>"
              : "<b class='cn-mk" + (s.standing < 70 ? " bad" : "") + "'>" + s.standing + "%</b>",
            s.missing ? "<b class='cn-mk bad'>" + s.missing + "</b>" : "<span class='cn-none'>—</span>",
            s.unmarked ? "<b class='cn-mk warn'>" + s.unmarked + "</b>" : "<span class='cn-none'>—</span>"
          ], function () { pick(s); }, s.id);
        });
        listSlot.appendChild(table);
        var was = rows.filter(function (s) { return s.id === S.studentPick; })[0];
        pick(was || rows[0]);
      }

      function pick(s) {
        if (!s) return;
        S.studentPick = s.id;
        if (table) table.select(s.id);
        split.right.innerHTML = "";
        split.right.appendChild(studentInspector(s));
      }

      draw();
    }, function (e) { failed(node, e, function () { openAdmin(true, "students"); }); });
  }

  /* What is worth knowing about one person, in the space beside the list. Not
     a page — a page would have taken the list away, and the next question is
     almost always about the row underneath. */
  function studentInspector(s) {
    var box = el("div", "cn-insp");

    var head = el("header", "cn-insphead");
    head.appendChild(avatarFor(s));
    head.appendChild(el("div", "t", "<b>" + esc(s.name) + "</b><span>" +
      esc(s.email || "") + "</span>"));
    box.appendChild(head);

    var big = el("div", "cn-inspbig");
    big.innerHTML = s.standing == null
      ? "<b>—</b><span>nothing marked yet</span>"
      : "<b>" + s.standing + "%</b><span>across " + s.courses.length +
        (s.courses.length === 1 ? " class" : " classes") + "</span>";
    box.appendChild(big);

    var t = cnTable([
      { label: "Class", w: "minmax(120px, 1fr)" },
      { label: "Grade", w: "78px", align: "right" },
      { label: "Missing", w: "70px", align: "right" }
    ]);
    s.courses.forEach(function (c) {
      t.row([
        "<b>" + esc(c.title) + "</b><span class='cn-sub2'>" + esc(c.subject || "") + "</span>",
        gradeCell(c.grade),
        c.missing ? "<b class='cn-mk bad'>" + c.missing + "</b>" : "<span class='cn-none'>—</span>"
      ], function () {
        S.courseId = c.courseId;
        openAdmin(false, "roster");
      }, c.courseId);
    });
    box.appendChild(t);

    if (s.unmarked) {
      box.appendChild(el("p", "cn-fine",
        s.unmarked + (s.unmarked === 1 ? " piece" : " pieces") +
        " of their work is waiting on you. Their grade is computed over what has been " +
        "marked, so it will move when you mark it."));
    }

    var acts = cnActions();
    acts.appendChild(cnAction("Open their report", function () { openReport(s); }, true));
    box.appendChild(acts);
    return box;
  }

  /* ================================================================ Activity
     What has happened to the marks, newest first.

     Deliberately only that. A log of every screen a teacher opened would be
     surveillance of teachers, and this product is not going to build one —
     which is worth writing down here, because "activity feed" is the name
     under which that usually arrives. */
  function tabActivity(v) {
    consoleHead(v, "School", "Activity",
      "Every change to a mark in your classes. Not a log of what anybody looked " +
      "at — only the things that change what a student's grade says.");

    var node = loading(v, "what happened");
    API.reporting.activity(80).then(function (events) {
      node.remove();
      if (!events.length) {
        v.appendChild(cnEmpty("Nothing has been marked yet.",
          "Changes to marks appear here as they are made, with who made them."));
        return;
      }

      var t = cnTable([
        { label: "Student", w: "minmax(140px, 1fr)" },
        { label: "Work", w: "minmax(140px, 1.2fr)" },
        { label: "Change", w: "140px" },
        { label: "By", w: "minmax(110px, .8fr)" },
        { label: "When", w: "120px", align: "right" }
      ]);
      events.forEach(function (e) {
        var was = e.fromStatus == null ? "entered"
          : e.fromStatus === "missing" ? "missing"
          : e.fromStatus === "excused" ? "excused"
          : e.fromScore == null ? "unmarked" : String(e.fromScore);
        var now = e.toStatus === "missing" ? "missing"
          : e.toStatus === "excused" ? "excused"
          : e.toScore == null ? "unmarked" : e.toScore + " / " + e.outOf;
        var who = el("span", "cn-who");
        who.appendChild(avatarFor({ name: e.student.name, initials: e.student.initials,
                                    hue: e.student.hue }));
        who.appendChild(el("span", "nm", esc(e.student.name || "—")));
        t.row([
          who,
          "<b>" + esc(e.title) + "</b><span class='cn-sub2'>" + esc(e.courseTitle) + "</span>",
          "<span class='cn-change'><i>" + esc(was) + "</i>→<b>" + esc(now) + "</b></span>",
          esc(e.actorName || "—"),
          esc(whenName(e.at))
        ], null, e.id);
      });
      v.appendChild(t);
    }, function (e) { failed(node, e, function () { openAdmin(true, "activity"); }); });
  }

  /* -------------------------------------------------------------- Courses */
  function tabCourses(v) {
    consoleHead(v, "School", "Courses",
      "The courses that carry enrolment, work and grades. The catalogue students " +
      "browse is the shipped curriculum — published content in the site's files, " +
      "not rows in the database.");

    var node = loading(v, "courses");
    API.courses.mine().then(function (courses) {
      node.remove();

      var acts = cnActions();
      acts.appendChild(cnAction("New course", function () { openCourseEditor(null); }, true));
      acts.appendChild(cnAction("Explore courses", openCatalogue));
      v.appendChild(acts);

      if (!courses.length) {
        v.appendChild(cnEmpty("No courses yet.",
          "Start from a course Oplo has already written, or create your own from nothing.",
          "Explore courses", openCatalogue));
        return;
      }

      var t = cnTable([
        { label: "Course", w: "minmax(180px, 1.4fr)" },
        { label: "Subject", w: "minmax(110px, .8fr)" },
        { label: "Code", w: "minmax(100px, .7fr)" },
        { label: "You are", w: "100px" },
        { label: "Status", w: "94px", align: "right" }
      ]);
      courses.forEach(function (c) {
        t.row([
          "<b>" + esc(c.title) + "</b>",
          esc(c.subject || "—"),
          "<span class='cn-mono'>" + esc(c.code) + "</span>",
          c.myRole ? esc(c.myRole) : "<span class='cn-none'>—</span>",
          "<span class='cn-tag" + (c.status === "published" ? " on" : "") + "'>" +
            esc(c.status) + "</span>"
        ], function () { openCoursePage(c); }, c.id);
      });
      v.appendChild(t);
    }, function (e) { failed(node, e, function () { openAdmin(true, "courses"); }); });
  }

  /* ---------------------------------------------------------- One course
     What a course *is*, rather than the row that stores it.

     This was a form: seven fields and a Save button, which is the database
     table with labels on. A teacher opening their own course wants to know
     what is in it — the plan, what is set, what is written, who is in it —
     and a page that answers none of those has made them go and look in four
     other places to assemble it themselves.

     Two requests build the whole thing. The gradebook already returns the
     students, the work and every mark, so the numbers at the top are the same
     arithmetic the sheet uses rather than a second count that can drift.

     Where a course was started from the catalogue, the curriculum behind it is
     read for what a row cannot hold: what each unit is about, which ones have
     a study set or a reader written, what the course sets out to teach, and
     the textbook it came from. Read, not linked — the copy stays a copy. */
  function openCoursePage(c) {
    /* `openCoursePage`, not `openCourse`. There is already an openCourse — the
       student's course screen, since long before this one — and two function
       declarations with one name in the same scope is not an overload, it is
       the second one silently winning. Naming this one the same broke every
       route a student had into a course, and did it quietly. */
    enter("course:" + c.id, trim(c.title, 18), function () { openCoursePage(c); });
    var v = $("#v-admin");
    v.innerHTML = "";
    var body = el("div", "admin-body");
    v.appendChild(body);

    var cb = c.body || {};
    var shipped = cb.from ? SC.course(cb.from) : SC.course(c.code);
    var grading = (cb.grading && cb.grading.length) ? cb.grading
                : (shipped && shipped.grading) || [];
    var unitNames = (cb.units && cb.units.length) ? cb.units
                  : (shipped ? unitsOf(shipped).map(function (u) { return u.t; }) : []);

    consoleHead(body, "Course", c.title,
      [esc(c.subject || "—"), esc(c.level || "Introductory"),
       "<span class='cn-mono'>" + esc(c.code) + "</span>",
       "<span class='cn-tag" + (c.status === "published" ? " on" : "") + "'>" +
         esc(c.status) + "</span>"].join(" &middot; "));

    var acts = cnActions();
    acts.appendChild(cnAction("Open the gradebook", function () {
      S.courseId = c.id;
      openAdmin(false, "roster");
    }, true));
    acts.appendChild(cnAction("Set work", function () { openAssignments(c); }));
    acts.appendChild(cnAction("Enrol", function () { openEnrol(c); }));
    acts.appendChild(cnAction("Edit", function () { openCourseEditor(c); }));
    body.appendChild(acts);

    var tiles = el("div", "cn-tiles");
    body.appendChild(tiles);
    function tile(label, value, tone) {
      var t = el("div", "cn-tile" + (tone ? " " + tone : ""));
      t.innerHTML = "<b>" + value + "</b><span>" + label + "</span>";
      tiles.appendChild(t);
    }

    var slot = el("div");
    body.appendChild(slot);
    var node = loading(slot, "the course");

    Promise.all([
      API.grades.book(c.id).catch(function () { return null; }),
      API.studySets.forCourse(c.id).catch(function () { return []; })
    ]).then(function (out) {
      var book = out[0], sets = out[1] || [];
      node.remove();

      var students = book ? book.students.length : null;
      var work = book ? book.assignments.length : null;
      var avg = null;
      if (book) {
        var vals = Object.keys(book.summaries).map(function (k) {
          return book.summaries[k].percent;
        });
        if (vals.length) {
          avg = Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length);
        }
      }
      var owed = book ? book.columns.reduce(function (a, col) { return a + col.unmarked; }, 0) : 0;

      tile("Students", students == null ? "—" : students);
      tile("Work set", work == null ? "—" : work);
      tile("Units", unitNames.length || "—");
      tile("Class average", avg == null ? "—" : avg + "%");
      if (owed) tile("Unmarked", owed, "owe");

      /* ------------------------------------------------------ What it is */
      var about = c.summary || (shipped && (shipped.lede || shipped.d)) || "";
      if (about) {
        slot.appendChild(el("h2", "cn-h2", "What this course is"));
        slot.appendChild(el("p", "cs-lede", esc(about)));
      }

      /* ----------------------------------------------------- How it grades */
      if (grading.length) {
        slot.appendChild(el("h2", "cn-h2", "How it is graded"));
        var total = grading.reduce(function (a, g) { return a + Number(g[1] || 0); }, 0);
        var parts = el("div", "admin-mark-parts");
        grading.forEach(function (g) {
          var row = el("div", "admin-mark-part");
          var pct = Number(g[1]) || 0;
          row.innerHTML = "<span>" + esc(g[0]) + "</span>" +
            '<div class="t"><i style="width:' + Math.min(100, pct) + '%"></i></div>' +
            "<em>" + pct + "%</em><span class='w'></span>";
          parts.appendChild(row);
        });
        slot.appendChild(parts);
        if (Math.abs(total - 100) > 0.5) {
          slot.appendChild(el("p", "cn-fine",
            "These add to " + total + "%, not 100. A grade is computed over the " +
            "categories that have something in them, so it still works — but the " +
            "weights are not saying what they look like they are saying."));
        }
        var policy = [];
        if (cb.latePenalty) policy.push("Work handed in late loses " + cb.latePenalty +
          "% of what it was out of.");
        if (cb.drop) {
          Object.keys(cb.drop).forEach(function (k) {
            if (cb.drop[k] > 0) policy.push("The lowest " + cb.drop[k] + " in " + esc(k) +
              (cb.drop[k] === 1 ? " is" : " are") + " dropped.");
          });
        }
        if (policy.length) slot.appendChild(el("p", "cn-fine", policy.join(" ")));
      }

      /* ------------------------------------------------------------ The plan */
      if (unitNames.length) {
        var h = el("h2", "cn-h2", "The plan");
        slot.appendChild(h);
        var su = shipped ? unitsOf(shipped) : [];
        var plan = el("ol", "cs-plan");
        unitNames.forEach(function (name, i) {
          var u = su[i];
          var li = el("li");
          var tags = "";
          if (u && u.set) tags += "<em class='cs-tag'>study set</em>";
          if (u && u.read) tags += "<em class='cs-tag'>reader</em>";
          if (u && u.play) tags += "<em class='cs-tag'>practice</em>";
          li.innerHTML = "<span class='n'>" + (i + 1) + "</span>" +
            "<span class='t'><b>" + esc(name) + "</b>" +
            (u && u.desc ? "<span>" + esc(u.desc) + "</span>" : "") + "</span>" +
            "<span class='g'>" + (tags || "<span class='cn-none'>nothing written yet</span>") +
            "</span>";
          plan.appendChild(li);
        });
        slot.appendChild(plan);
        slot.appendChild(el("p", "cn-fine",
          "The plan is this course's own. What is written behind a unit — a study set, " +
          "a reader, a practice run — belongs to the published curriculum and is the " +
          "same for every school."));
      }

      /* ----------------------------------------------------------- The work */
      slot.appendChild(el("h2", "cn-h2", "Work set on this course"));
      if (book && book.assignments.length) {
        var wt = cnTable([
          { label: "Work", w: "minmax(180px, 1.6fr)" },
          { label: "Category", w: "minmax(120px, 1fr)" },
          { label: "Out of", w: "80px", align: "right" },
          { label: "Marked", w: "110px", align: "right" }
        ]);
        book.assignments.forEach(function (a, ci) {
          var col = book.columns[ci] || {};
          wt.row([
            "<b>" + esc(a.title) + "</b>" +
              (a.dueAt ? "<span class='cn-sub2'>due " + esc(dayName(a.dueAt)) + "</span>" : ""),
            esc(a.category || "—") + (a.extraCredit ? " · extra credit" : ""),
            "<b class='cn-mk'>" + a.outOf + "</b>",
            col.unmarked
              ? "<b class='cn-mk warn'>" + col.unmarked + " left</b>"
              : "<span class='cn-none'>all marked</span>"
          ], function () { openAssignments(c); }, a.id);
        });
        slot.appendChild(wt);
      } else {
        slot.appendChild(cnEmpty("Nothing set yet.",
          "A piece of work is a column on the gradebook. Set one and you can mark it.",
          "Set work", function () { openAssignments(c); }));
      }

      /* ----------------------------------------------------- The study sets */
      slot.appendChild(el("h2", "cn-h2", "Study sets for this course"));
      if (sets.length) {
        var st = cnTable([
          { label: "Set", w: "minmax(180px, 1.6fr)" },
          { label: "Terms", w: "90px", align: "right" },
          { label: "Status", w: "110px", align: "right" }
        ]);
        sets.forEach(function (x) {
          st.row(["<b>" + esc(x.title) + "</b>",
                  "<b class='cn-mk'>" + x.termCount + "</b>",
                  "<span class='cn-tag" + (x.status === "published" ? " on" : "") + "'>" +
                    esc(x.status) + "</span>"],
                 function () { openAdmin(false, "sets"); }, x.id);
        });
        slot.appendChild(st);
      } else {
        slot.appendChild(el("p", "cn-sub",
          "None written for this course yet. A set published to a course reaches every " +
          "student in it, on every device they sign in on."));
      }

      /* ------------------------------------------------------- The objectives */
      if (shipped && (shipped.objectives || []).length) {
        slot.appendChild(el("h2", "cn-h2", "What it sets out to teach"));
        var ol = el("ul", "cn-why");
        shipped.objectives.forEach(function (o) { ol.appendChild(el("li", null, esc(o))); });
        slot.appendChild(ol);
      }
      if (shipped && shipped.textbook) {
        slot.appendChild(el("p", "cn-fine", esc(shipped.textbook)));
      }
      if (!book) {
        slot.appendChild(el("p", "cn-fine",
          "The class numbers are missing because you do not teach this course — you " +
          "wrote it. Enrol yourself as a teacher to see and mark its students."));
      }
      show("admin");
    }, function (e) { failed(node, e, function () { openCoursePage(c); }); });
    show("admin");
  }

  /* ------------------------------------------------------------- Catalogue
     Every course Oplo has written, offered as a starting point.

     The distinction this screen exists to hold is the one the whole product
     rests on. The catalogue is *published curriculum* — units, objectives,
     study sets, a textbook — and it lives in the site's files, the same for
     every school. A course is a *database row* that carries enrolment, work
     and grades, and belongs to one organisation.

     Picking one here does not link them. It copies what a course needs to
     exist — the title, the subject, the grading scheme the curriculum was
     written around, and the unit list — into a row this school owns and can
     change. Nothing here reaches back into the catalogue afterwards, because a
     school that renames a unit should not be editing Oplo's curriculum, and a
     change Oplo makes next year should not silently rewrite a course somebody
     already graded against. */
  function openCatalogue() {
    enter("catalogue", "Courses", openCatalogue);
    var v = $("#v-admin");
    v.innerHTML = "";
    var body = el("div", "admin-body");
    v.appendChild(body);

    consoleHead(body, "School", "Explore courses",
      "Curriculum Oplo has written. Picking one creates a course this school owns — " +
      "with its units and its grading scheme already in place — which you can then " +
      "change like any other. It is a starting point, not a link.");

    var shipped = allCourses();
    var written = shipped.filter(function (c) { return !c.stub; });
    var soon = shipped.filter(function (c) { return c.stub; });

    var t = cnTable([
      { label: "Course", w: "minmax(200px, 1.6fr)" },
      { label: "Subject", w: "minmax(110px, .8fr)" },
      { label: "Units", w: "80px", align: "right" },
      { label: "Grading", w: "minmax(150px, 1fr)" }
    ]);
    written.forEach(function (c) {
      var us = unitsOf(c);
      t.row([
        "<b>" + esc(c.t) + "</b><span class='cn-sub2'>" + esc(trim(c.d, 62)) + "</span>",
        esc(c.subject || "—"),
        "<b class='cn-mk'>" + us.length + "</b>",
        (c.grading || []).length
          ? esc(c.grading.map(function (g) { return g[0] + " " + g[1] + "%"; }).join(" · "))
          : "<span class='cn-none'>set it yourself</span>"
      ], function () { openCataloguePick(c); }, c.id);
    });
    body.appendChild(t);

    if (soon.length) {
      body.appendChild(el("h2", "cn-h2", "Not written yet"));
      body.appendChild(el("p", "cn-sub",
        "These have a name and a subject and nothing behind them. A course made from " +
        "one is an empty course with a sensible title — which is still a saving over " +
        "typing it, and is not pretending to be a curriculum."));
      var t2 = cnTable([
        { label: "Course", w: "minmax(200px, 1.6fr)" },
        { label: "Subject", w: "minmax(110px, 1fr)" }
      ]);
      soon.forEach(function (c) {
        t2.row(["<b>" + esc(c.t) + "</b><span class='cn-sub2'>" + esc(trim(c.d, 62)) + "</span>",
                esc(c.subject || "—")],
               function () { openCataloguePick(c); }, c.id);
      });
      body.appendChild(t2);
    }
    show("admin");
  }

  /* What will be created, before it is created. */
  function openCataloguePick(c) {
    enter("catalogue:" + c.id, trim(c.t, 18), function () { openCataloguePick(c); });
    var v = $("#v-admin");
    v.innerHTML = "";
    var body = el("div", "admin-body");
    v.appendChild(body);

    var us = unitsOf(c);
    var grading = (c.grading && c.grading.length)
      ? c.grading
      : [["Quizzes", 35], ["Assignments", 35], ["Exams", 30]];

    consoleHead(body, "From the catalogue", c.t, esc(c.lede || c.d));

    var box = el("div", "cn-report");
    box.appendChild(el("p", "cn-lab", "What this creates"));
    var facts = cnTable([
      { label: "", w: "minmax(140px, .7fr)" },
      { label: "", w: "minmax(200px, 2fr)" }
    ]);
    facts.row(["<b>Subject</b>", esc(c.subject || "—")], null, "subject");
    facts.row(["<b>Level</b>", esc(c.level || "Introductory")], null, "level");
    facts.row(["<b>Grading</b>",
      esc(grading.map(function (g) { return g[0] + " — " + g[1] + "%"; }).join("  ·  ")) +
      (c.grading && c.grading.length ? "" :
        "<span class='cn-sub2'>a sensible default, because this course does not set one</span>")],
      null, "grading");
    facts.row(["<b>Units</b>", us.length
      ? esc(us.map(function (u) { return u.t || u.n; }).join(" · "))
      : "<span class='cn-none'>none yet</span>"], null, "units");
    if (c.textbook) facts.row(["<b>Textbook</b>", esc(c.textbook)], null, "book");
    box.appendChild(facts);

    if ((c.objectives || []).length) {
      box.appendChild(el("p", "cn-lab", "What it sets out to teach"));
      var ol = el("ul", "cn-why");
      c.objectives.forEach(function (o) { ol.appendChild(el("li", null, esc(o))); });
      box.appendChild(ol);
    }

    box.appendChild(el("p", "cn-fine",
      "A copy, not a link. Change anything here afterwards and you are changing your " +
      "school's course; the catalogue is untouched, and a change Oplo makes to the " +
      "curriculum later will not rewrite a course you have already graded against."));

    var acts = cnActions();
    var make = cnAction("Create this course", function () {
      make.disabled = true;
      make.textContent = "Creating…";
      createFromCatalogue(c, grading, us, make);
    }, true);
    acts.appendChild(make);
    box.appendChild(acts);
    body.appendChild(box);
    show("admin");
  }

  function createFromCatalogue(c, grading, us, btn) {
    /* The code has to be unique inside the organisation, and the obvious one
       is often taken — a school teaching Media Arts twice wants both. Rather
       than refusing and making somebody invent a name, take the next free
       one. */
    function attemptWith(code, n) {
      API.courses.create({
        code: code,
        orgId: S.me.orgId,
        title: c.t,
        subject: c.subject || null,
        level: c.level || "Introductory",
        summary: c.d || null,
        status: "published",
        body: {
          grading: grading,
          units: us.map(function (u) { return u.t || u.n; }),
          from: c.id
        }
      }).then(function (made) {
        toast("“" + made.title + "” created. You are its teacher.");
        S.courseId = made.id;
        openAdmin(false, "roster");
      }, function (e) {
        if (e && e.code === "conflict" && n < 9) {
          attemptWith(c.id + "-" + (n + 1), n + 1);
          return;
        }
        btn.disabled = false;
        btn.textContent = "Create this course";
        toast(e && e.message ? e.message : "The server refused that.");
      });
    }
    attemptWith(c.id, 1);
  }

  function openCourseEditor(c) {
    var making = !c;
    enter("course-edit:" + (c ? c.id : "new"), making ? "New course" : trim(c.title),
          function () { openCourseEditor(c); });
    var v = $("#v-admin");
    v.innerHTML = "";
    consoleHead(v, making ? "New course" : "Course",
      making ? "Create a course" : c.title);

    var body = (c && c.body) || {};
    var form = el("div", "admin-form");
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

    var acts = el("div", "admin-acts");
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
    consoleHead(v, "Teaching", "Study sets",
      "A set published to a course reaches every student in it, on every device they " +
      "sign in on. It works in Flashcards, Learn, Match, Test and all three games.");

    var node = loading(v, "study sets");

    Promise.all([
      API.studySets.authored(),
      API.courses.mine()
    ]).then(function (out) {
      var sets = out[0], courses = out[1];
      node.remove();

      var acts = cnActions();
      acts.appendChild(cnAction("New study set",
        function () { openSetEditor(null, courses); }, true));
      v.appendChild(acts);

      if (!sets.length) {
        v.appendChild(cnEmpty("You have not written a set yet.",
          "A set needs four terms before the games will use it — they need something " +
          "to choose between.",
          "New study set", function () { openSetEditor(null, courses); }));
      } else {
        var t = cnTable([
          { label: "Set", w: "minmax(180px, 1.4fr)" },
          { label: "Class", w: "minmax(140px, 1fr)" },
          { label: "Terms", w: "80px", align: "right" },
          { label: "Status", w: "100px", align: "right" }
        ]);
        sets.forEach(function (st) {
          var course = courses.filter(function (c) { return c.id === st.courseId; })[0];
          t.row([
            "<b>" + esc(st.title) + "</b>",
            course ? esc(course.title) : "<span class='cn-none'>not attached</span>",
            "<b class='cn-mk'>" + st.termCount + "</b>",
            "<span class='cn-tag" + (st.status === "published" ? " on" : "") + "'>" +
              esc(st.status) + "</span>"
          ], function () { openSetEditor(st.id, courses); }, st.id);
        });
        v.appendChild(t);
      }

      /* The curriculum that ships with the site, listed so nobody wonders
         where the built-in sets went. They are read-only here: they are
         published content, and one school editing them would edit them for
         everybody. */
      var shipped = SC.sets();
      var ids = Object.keys(shipped).filter(function (k) { return k.indexOf("__") !== 0; });
      if (ids.length) {
        v.appendChild(el("h2", "cn-h2", "Shipped with the site"));
        v.appendChild(el("p", "cn-sub",
          "Published curriculum, read-only. To make a school version of one, write a new " +
          "set with the same terms — it takes precedence for your students."));
        var sl = cnTable([
          { label: "Set", w: "minmax(180px, 1.4fr)" },
          { label: "Code", w: "minmax(140px, 1fr)" },
          { label: "Terms", w: "80px", align: "right" }
        ]);
        ids.forEach(function (id) {
          sl.row([
            "<b>" + esc(shipped[id].t) + "</b>",
            "<span class='cn-mono'>" + esc(id) + "</span>",
            "<b class='cn-mk'>" + shipped[id].cards.length + "</b>"
          ], null, id);
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
        v.appendChild(el("p", "cn-eyebrow", making ? "New study set" : "Study set"));
        v.appendChild(el("h1", "cn-h1", making ? "Write a study set" : esc(set.title)));

        var form = el("div", "admin-form");
        var code = field("Code", head.code, "e.g. waves-and-sound");
        if (!making) code.input.disabled = true;
        code.input.addEventListener("input", function () { head.code = code.input.value; });
        var title = field("Title", head.title, "What this set covers");
        title.input.addEventListener("input", function () { head.title = title.input.value; });

        var courseF = el("label", "admin-field");
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

        var statusF = el("label", "admin-field");
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
        v.appendChild(el("p", "cn-sub",
          "Every definition has to stand on its own: in Match, Test and the games it is " +
          "shown without its term beside it. A term with a reason and an example can also " +
          "be asked as a case to work through — without them it stops at explanation."));

        var depth = el("p", "admin-depth");
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

        var table = el("div", "admin-table terms");
        var hd = el("div", "admin-tr head");
        hd.innerHTML = "<span>Term</span><span>Definition</span>" +
          "<span>Why it matters</span><span>An example</span><span></span>";
        table.appendChild(hd);

        rows.forEach(function (r, ix) {
          var tr = el("div", "admin-tr");
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
          var del = el("button", "admin-x");
          del.type = "button";
          del.setAttribute("aria-label", "Remove this term");
          del.innerHTML = svg(I.close, true);
          del.addEventListener("click", function () { rows.splice(ix, 1); render(); });
          tr.appendChild(del);
          table.appendChild(tr);
        });
        v.appendChild(table);
        say();

        var acts = el("div", "admin-acts");
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
    consoleHead(v, "School", "People",
      "An Oplo Account, not an OEdu account — the same sign-in carries a person into " +
      "every Oplo product they are authorised for, and roles are held per product.");

    var node = loading(v, "people");
    API.accounts.list(S.me.orgId).then(function (people) {
      node.remove();

      var acts = cnActions();
      acts.appendChild(cnAction("Add a person", function () { openPersonEditor(null); }, true));
      v.appendChild(acts);

      if (!people.length) {
        v.appendChild(cnEmpty("No accounts in this organisation yet.",
          "Add a person and they can sign in to every Oplo product they are given a " +
          "role in.", "Add a person", function () { openPersonEditor(null); }));
        return;
      }

      var t = cnTable([
        { label: "Name", w: "minmax(170px, 1.2fr)" },
        { label: "Email", w: "minmax(180px, 1.4fr)" },
        { label: "Title", w: "minmax(110px, .8fr)" },
        { label: "", w: "96px", align: "right" }
      ]);
      people.forEach(function (p) {
        var who = el("span", "cn-who");
        who.appendChild(avatarFor(p));
        who.appendChild(el("span", "nm", esc(p.name)));
        var rec = el("button", "cn-btn small", "Record");
        rec.type = "button";
        rec.addEventListener("click", function (e) { e.stopPropagation(); openRecord(p); });
        t.row([
          who,
          "<span class='cn-mono'>" + esc(p.email || "—") + "</span>",
          p.title ? esc(p.title) : "<span class='cn-none'>—</span>",
          rec
        ], function () { openPersonEditor(p); }, p.id);
      });
      v.appendChild(t);
    }, function (e) { failed(node, e, function () { openAdmin(true, "people"); }); });
  }

  /* ------------------------------------------------------------- A record
     One student's diploma record as the registrar sees it: the dashboard the
     student has on their Grades tab, from the same server call, and the one
     thing an administrator does to it here — import a previous school's
     transcript. The file is read in this browser and sent once, over the
     administrator's own session, so no password is typed into a terminal and
     nothing is kept on the page. */
  function openRecord(p) {
    var first = p.firstName || p.name;
    enter("record:" + p.id, first, function () { openRecord(p); });
    var v = $("#v-admin");
    v.innerHTML = "";
    consoleHead(v, "Diploma record", p.name);
    v.appendChild(el("p", "cn-sub",
      "What " + esc(first) + " sees on their Grades tab, computed by the server from their record. " +
      "A transcript from a school that is already on the record replaces it rather than adding to it."));

    var acts = el("div", "admin-acts");
    var file = el("input");
    file.type = "file";
    file.accept = ".json,application/json";
    file.hidden = true;
    var pick = el("button", "lx-btn", "Import a transcript");
    pick.type = "button";
    pick.addEventListener("click", function () { file.click(); });
    acts.appendChild(pick);
    acts.appendChild(file);
    v.appendChild(acts);
    var staged = el("div");
    v.appendChild(staged);

    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      file.value = "";
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { stageImport(p, reader.result, staged); };
      reader.onerror = function () { toast("That file could not be read."); };
      reader.readAsText(f);
    });

    var host = el("div", "gr");
    v.appendChild(host);
    var wait = el("div", "admin-loading", "Reading the record…");
    host.appendChild(wait);
    noFoot(); progress(null);
    show("admin");
    Promise.all([API.graduation.get(p.id), planLoad(p.id)]).then(function (out) {
      wait.remove();
      drawGrades(host, out[0], "Nothing on this record yet. Import the transcript from " +
        esc(first) + "'s previous school and the path to graduation appears here.",
        { canCommit: false, plan: out[1] });
    }, function (e) { failed(wait, e, function () { openRecord(p); }); });
  }

  /* The file is checked for shape here only so that a wrong file is caught
     before it is sent. What the courses mean — areas, credit, the transfer
     cap — is decided by the server, which refuses anything it cannot read. */
  function stageImport(p, text, where) {
    where.innerHTML = "";
    var data = null;
    try { data = JSON.parse(text); } catch (e) { /* reported below */ }
    if (!data || !data.source || !Array.isArray(data.terms)) {
      where.appendChild(el("div", "lx-empty",
        "That file is not a transcript import: it needs a source and a list of terms."));
      return;
    }
    var courses = data.terms.reduce(function (n, t) { return n + (t.courses || []).length; }, 0);
    var exams = (data.exams || []).length;
    where.appendChild(el("p", "cn-sub",
      "<b>" + esc(data.source.school || "Unnamed school") + "</b> · " + courses + " courses in " +
      data.terms.length + " terms · " + exams + " exams" +
      (data.source.printedOn ? " · printed " + esc(data.source.printedOn) : "") +
      (data.program && data.program.track ? " · " + esc(data.program.track) + "-credit track" : "")));
    var acts = el("div", "admin-acts");
    var go = el("button", "lx-btn", "Import into " + esc(p.firstName || p.name) + "'s record");
    go.type = "button";
    var no = el("button", "lx-btn quiet", "Cancel");
    no.type = "button";
    no.addEventListener("click", function () { where.innerHTML = ""; });
    go.addEventListener("click", function () {
      go.disabled = true;
      var program = data.program ? API.graduation.setProgram(p.id, data.program) : Promise.resolve();
      attempt(program.then(function () { return API.graduation.importTranscript(p.id, data); }),
        function (r) {
          toast("Imported " + r.courses + " courses and " + r.exams + " exams from " + r.school + ".");
          openRecord(p);
        }).then(function () { go.disabled = false; });
    });
    acts.appendChild(go);
    acts.appendChild(no);
    where.appendChild(acts);
  }

  function openPersonEditor(p) {
    var making = !p;
    enter("person:" + (p ? p.id : "new"), making ? "New person" : (p.firstName || p.name),
          function () { openPersonEditor(p); });
    var v = $("#v-admin");
    v.innerHTML = "";
    v.appendChild(el("p", "cn-eyebrow", making ? "New person" : "Person"));
    v.appendChild(el("h1", "cn-h1", making ? "Add somebody" : esc(p.name)));

    var form = el("div", "admin-form");
    var name = field("Full name", p ? p.name : "");
    var email = field("Email", p ? p.email : "");
    if (!making) email.input.disabled = true;
    var title = field("Title", p ? p.title : "", "High School Silver Program");

    var roleF = el("label", "admin-field");
    roleF.innerHTML = "<span>Role in OEdu</span>";
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
      v.appendChild(el("p", "cn-sub",
        "The password is sent once, over HTTPS, and hashed on the server. It is never " +
        "stored anywhere in this page and never reaches the database in a readable form."));
    } else {
      v.appendChild(el("p", "cn-sub",
        "Passwords are changed by the person they belong to, from their own account " +
        "screen. An administrator cannot read or set somebody else's password."));
    }

    var acts = el("div", "admin-acts");
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
    consoleHead(v, "School", "System",
      "Where this install stands, and what is actually enforced.");

    /* How much fits on a screen, chosen by the person looking at it. The same
       markup at three row heights — the text does not shrink, because solving
       density with smaller type is how professional software becomes
       unreadable by the people who use it most. */
    var pref = el("div", "cn-pref");
    pref.appendChild(el("div", "t",
      "<b>Rows</b><span>How much fits on a screen. Marking hundreds of submissions " +
      "wants more; planning a lesson wants fewer.</span>"));
    var seg = el("div", "cn-seg");
    [["comfortable", "Comfortable"], ["standard", "Standard"], ["dense", "Dense"]]
      .forEach(function (d) {
        var b = el("button", "cn-segb" + (currentDensity() === d[0] ? " on" : ""));
        b.type = "button";
        b.textContent = d[1];
        b.addEventListener("click", function () {
          applyDensity(d[0]);
          [].forEach.call(seg.children, function (x) { x.classList.remove("on"); });
          b.classList.add("on");
        });
        seg.appendChild(b);
      });
    pref.appendChild(seg);
    v.appendChild(pref);

    var box = el("div", "admin-sys");
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
      var row = el("div", "admin-sys-row");
      row.innerHTML = "<b>" + esc(r[0]) + "</b><em>" + esc(r[1]) + "</em><span>" +
        esc(r[2]) + "</span>";
      box.appendChild(row);
    });
    v.appendChild(box);

    API.health().then(function (up) {
      var first = box.querySelector(".admin-sys-row span");
      if (first) {
        first.textContent = up
          ? "Answering. Sign-in, grades and progress are live."
          : "Not answering. Nothing that needs the server will work until it is running.";
      }
    });

    v.appendChild(el("h2", "lx-h2", "Your account"));
    var who = el("div", "admin-list");
    var row1 = el("div", "admin-row");
    row1.appendChild(avatarFor(S.me));
    row1.appendChild(el("span", "t", "<b>" + esc(S.me.name) + "</b><span>" +
      esc(S.me.email) + " · " + esc(S.me.id) + "</span>"));
    who.appendChild(row1);
    (S.me.roles || []).forEach(function (r) {
      var row = el("div", "admin-row");
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

     One Oplo Account, not an OEdu account. The same session will carry
     a person into OMaps or OShopping, which is why none of this lives under
     an OEdu-specific name. */
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
    var ru = READERS[R.d.readUnit];
    useReader(ru && ru.sections.length ? ru : READERS["media:5"]);
    Game.attach(R);

    $("#gate").hidden = true;
    var av = document.querySelector(".lx-user .av");
    av.textContent = who.initials;
    av.style.background = who.hue || "";
    document.querySelector(".lx-user .nm").textContent = who.name;
    $("#user").title = "Signed in as " + who.name;
    /* Staff and students are not the same product.

       A teacher is not a student with extra buttons. They have no streak, no
       badges, no rank and nothing assigned to them, and a screen offering all
       four is a screen telling them it was built for somebody else. So the
       console is not a tab they can reach — it is the whole of what they
       signed in to, and there is no way out of it because there is nowhere
       else they were going.

       Everything the student app puts in the top bar goes with it: the bar,
       the subject rail, the tutor, the experience counter. Not hidden behind
       a class that some future screen forgets to set — never drawn. */
    var staff = who.role === "admin" || who.role === "teacher";
    document.body.classList.toggle("is-admin", staff);
    document.body.classList.toggle("is-staff", staff);
    $("#navAdmin").hidden = !allowedTabs().length;
    $("#navGrades").hidden = who.role !== "student";
    $("#navAdmin").textContent = who.role === "admin" ? "Console" : "My students";
    if (R.broken) {
      toast("This browser will not let the page store anything, so progress will not be kept.");
    }
    Ann.reset();

    if (staff) {
      openAdmin(true, S.tab || "today");
    } else {
      drawSubjectNav();
      home();
      Room.presence();
      Room.fromLink();
    }

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
      if (staff) return;
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
    TRAIL = []; POS = -1;            // the next person's history starts from nothing
    S.course = null; S.unit = null; S.setId = null; S.set = null;
    document.body.classList.remove("is-admin");
    $("#navAdmin").hidden = true;
    $("#navGrades").hidden = true;
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
      else if (b.dataset.view === "grades") openGrades();
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

  /* The rail, on a narrow screen. It is a drawer rather than a squeeze: at
     900px there is not room for both a rail and a gradebook, and a rail that
     shrinks to icons is a rail you have to learn twice. */
  $("#railOpen").addEventListener("click", function () {
    var open = document.body.classList.toggle("rail-open");
    this.setAttribute("aria-expanded", String(open));
  });
  $("#railScrim").addEventListener("click", closeRail);
  $("#cnBack").addEventListener("click", goBack);

  document.addEventListener("keydown", function (e) {
    /* ⌘K, from anywhere in the console. Not bound outside it: a student
       pressing it in a reading pass should get their browser's own search,
       and taking a shortcut people already have is worse than not having
       one. */
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      if (!document.body.classList.contains("is-console")) return;
      e.preventDefault();
      if ($("#finder").hidden) openFinder(); else closeFinder();
      return;
    }
    if (e.key === "Escape" && !$("#finder").hidden) { closeFinder(); return; }
    if (e.key === "Escape" && document.body.classList.contains("focus-mode")) {
      document.body.classList.remove("focus-mode");
      return;
    }
    if (S.view === "cards" && S.keys) S.keys(e);
    else if (S.view === "hangman" && S.hangKeys) S.hangKeys(e);
    else if (S.view === "read" && S.readKeys) S.readKeys(e);
    else if (S.view === "learn" && S.learnKeys) S.learnKeys(e);
  });

})();
