/* ==========================================================================
   OEdu.

   Two halves that answer different questions. The course side — subjects,
   units, practice — asks "do you understand this?" The study side —
   flashcards, Learn, Match, Test — asks "do you know it cold?" Neither one
   substitutes for the other, which is why both are here.

   Progress follows the account. Everything a student does is written first
   to a record in this browser (store.js), so nothing waits on the network and
   a dropped connection costs nothing, and is then kept in step with their Oplo
   Account (sync.js) — merged, never replaced — so the same progress is there
   on every device they sign in on.
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

  /* Scored on the ideas a good answer contains rather than on wording. The
     list is shown afterwards either way, because "you missed two of the five
     things we look for, and here they are" is a lesson and a mark is not.

     Module level because two screens ask a student to explain something now —
     the Learn session and the retrieval at a section boundary — and two copies
     of a scoring rule is how they end up scoring differently. */
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

  /* ---------------------------------------------------------------- State
     S is the session — where you are, what is in flight, what is on screen.
     What is *true about you* lives in R, the record, and survives the tab.
     The fields below that look like data (m, sets, mistakes, readDone) are
     references into R.d, assigned at sign-in: reading them is free, and
     writing them is followed by R.save(). */
  var R = null;           // the persisted record; null until somebody signs in
  var Progress = null;    // the record's sync with the account (sync.js); null signed out
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
    courseId: null,       // and which course is on the gradebook
    reportCourse: null,   // and which course the report list is filtered to
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
  function keep() { if (R) R.save(); checkSetWork(); }
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
        Progress ? Progress.pull().catch(function () { return []; }) : Promise.resolve([])
      ]).then(function (out) {
        var standing = out[0], moved = out[1] || [], changed = moved.length > 0;

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

        if (changed) R.save();
        return changed;
      });
    }

    /* A set's concept states changed. Kept for the screens that still call it;
       learn.js now tells the engine itself whenever any set is saved, so this is
       belt and braces rather than the only path. */
    function pushSet(setId) {
      if (Progress) Progress.dirty("set:" + setId);
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

  /* ------------------------------------------------------------ Addresses
     Every place a student can be has an address, and the address is the
     place. /student/Science/Biology/u1/l3 is lesson 3 of Biology's first
     unit whether it was reached by clicking, typed, bookmarked, shared or
     reloaded. Moving somewhere pushes its address, and the browser's Back
     and Forward walk them — the only back there is. The app used to draw its
     own Back chip in the bar as well, and two backs are one too many: it
     named the section before last, sat where nobody looked for it, and could
     disagree with the browser about where the student had been.

     The addresses are the names people see, spaces as hyphens:

       /student/                                   Home
       /student/Explore                            everything on offer
       /student/Science                            a subject
       /student/Science/Biology                    a course
       /student/Science/Biology/Map                its knowledge map
       /student/Science/Biology/u1                 a unit
       /student/Science/Biology/u1/l3              a lesson
       /student/Science/Biology/u1/l3/Questions    the questions after it
       /student/Science/Biology/u1/Practice        a unit's practice
       /student/Sets/<id>                          a study set
       /student/Sets/<id>/Flashcards               …and a way of studying it
       /student/Exams, /Exams/<id>, /Progress, /Grades, /Account,
       /student/Notebook, /Mistakes
       /student/Grades/<Class>, /Grades/<2025-26>, /Grades/Plan
                                                   a class, a past year, the plan

     The console has no addresses of its own yet; its places are still
     history entries, so Back works there, but the address bar stays put. */
  var TRAIL = [], POS = -1, RESTORING = false;
  // Entries this page made carry this; ones left by an earlier load of the
  // page do not, and are found by their address instead of by their index.
  var SESSION = Math.random().toString(36).slice(2, 10);

  function slug(s) { return String(s == null ? "" : s).trim().replace(/\s+/g, "-"); }
  function sameName(a, b) { return String(a || "").toLowerCase() === String(b || "").toLowerCase(); }
  function here() { return window.OPLO_HOME.parse(location.pathname); }
  /* Where the app's addresses start: /student/, or /learn/student/ locally. */
  function appBase() {
    var p = here();
    return p.mode ? p.root + p.mode + "/" : p.root;
  }
  function appRest() { return (here().rest || "").replace(/^\/+/, ""); }
  function addressOf(path) {
    return appBase() + String(path).split("/").filter(Boolean).map(encodeURIComponent).join("/");
  }
  function coursePath(c) { return slug(c.subject || "Other") + "/" + slug(c.t || c.title || c.id); }
  function courseById(id) {
    return allCourses().concat(enrolled()).filter(function (c) { return c.id === id; })[0] || null;
  }
  function readPath(r, i) {
    var c = courseById(r.course);
    return (c ? coursePath(c) : slug(r.courseTitle)) + "/u" + r.unit + "/l" + (i + 1);
  }

  function mark(push, path) {
    if (RESTORING) return;
    var entry = { here: S.here, hist: S.hist.slice(), path: path };
    var url = path == null ? undefined : addressOf(path);
    if (push && POS >= 0) {
      TRAIL = TRAIL.slice(0, POS + 1);        // a new step drops the old forward path
      TRAIL.push(entry);
      POS = TRAIL.length - 1;
      try { history.pushState({ lx: POS, s: SESSION }, "", url); } catch (e) { /* sandboxed frame */ }
    } else {
      // The very first place replaces the entry the page already has, so
      // opening OEdu does not cost an extra press of Back to leave it.
      if (POS < 0) { TRAIL = [entry]; POS = 0; } else TRAIL[POS] = entry;
      try { history.replaceState({ lx: POS, s: SESSION }, "", url); } catch (e) { /* sandboxed frame */ }
    }
  }

  function enter(key, label, restore, replace, path) {
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
    mark(!replace, path);
  }

  /* A top-level section starts a fresh in-app path, but it is still a step
     in the browser's history, so Back returns to wherever the student was
     before they clicked it. Clicking the section they are already on does
     not add a step. */
  function root(key, label, restore, path) {
    var same = S.here && S.here.key === key && !S.hist.length;
    S.hist = [];
    S.here = { key: key, label: label, restore: restore };
    mark(!same, path);
  }

  /* Open whatever an address names. Used when the app starts at an address,
     and when Back or Forward lands on one this page did not make. Returns
     false for an address that names nothing, so the caller can go home. */
  function route(rest) {
    var seg = (rest == null ? appRest() : rest).split("/").filter(Boolean).map(function (x) {
      try { return decodeURIComponent(x); } catch (e) { return x; }
    });
    var a = seg[0] || "";
    if (!a) { home(); return true; }
    if (sameName(a, "Explore")) { explore(); return true; }
    if (sameName(a, "Exams")) {
      openExams();
      // /Exams/<id> is the sitting itself, which exam.js owns. While the app
      // is starting, exam.js is about to be asked what to resume and is told
      // this one; after that it is opened directly.
      if (seg[1] && window.OPLO_EXAM) {
        if (S.booting) S.examAsked = seg[1]; else window.OPLO_EXAM.open(seg[1]);
      }
      return true;
    }
    if (sameName(a, "School") || sameName(a, "Classes")) { openClasses(); return true; }
    if (sameName(a, "Self-learning")) { openOwn(); return true; }
    if (sameName(a, "Progress")) { openProgress(); return true; }
    if (sameName(a, "Grades")) { openGrades(false, seg.slice(1)); return true; }
    if (sameName(a, "Account")) { openAccount(); return true; }
    if (sameName(a, "Notebook")) { openNotebook(); return true; }
    if (sameName(a, "Mistakes")) { openMistakes(); return true; }
    if (sameName(a, "Sets") && seg[1]) {
      if (!SET(seg[1])) return false;
      openSet(seg[1]);
      var run = { flashcards: startCards, learn: startLearn, match: startMatch,
                  "match-the-card": startCardMatch, "word-hunt": startHunt,
                  hangman: startHangman, test: startTest }[String(seg[2] || "").toLowerCase()];
      if (run) run(false);
      return true;
    }
    var subject = SC.subjects().filter(function (s) { return sameName(slug(s.n), a); })[0];
    if (!subject) return false;
    if (!seg[1]) { openSubject(subject); return true; }
    var c = allCourses().concat(enrolled()).filter(function (x) {
      return sameName(slug(x.subject || "Other"), a) && sameName(slug(x.t || x.title || x.id), seg[1]);
    })[0];
    if (!c) return false;
    if (!seg[2]) { openCourse(c); return true; }
    if (sameName(seg[2], "Map")) { openMap(c); return true; }
    // A course with a page of its own (SAT Math) has its own places below it.
    if (c.hub && !/^u\d+$/i.test(seg[2]) && !sameName(seg[2], "Challenge")) { openHub(c, seg.slice(2).join("/")); return true; }
    if (sameName(seg[2], "Challenge") && c.lab) { openLab(c, null, "Challenge"); return true; }
    var um = /^u(\d+)$/i.exec(seg[2]);
    if (!um) return false;
    var n = +um[1];
    if (!unitsOf(c).some(function (u) { return u.n === n; })) return false;
    if (!seg[3]) { openUnit(c, n); return true; }
    var lu = unitsOf(c).filter(function (u) { return u.n === n; })[0];
    if (lu && lu.lab) {
      if (/^l\d+$/i.test(seg[3]) && !seg[4]) { openLab(c, n, "l" + (+seg[3].slice(1))); return true; }
      if (sameName(seg[3], "Practice") && seg[4]) { openLab(c, n, "Practice/" + seg[4]); return true; }
      if (sameName(seg[3], "Test")) { openLab(c, n, "Test"); return true; }
      if (sameName(seg[3], "Quiz") && /^\d+$/.test(seg[4] || "")) { openLab(c, n, "Quiz/" + seg[4]); return true; }
      return false;
    }
    // A lab course's unit that isn't written yet has no pages below it — not
    // even a reader left over from before the course became a lab one.
    if (c.lab) return false;
    if (sameName(seg[3], "Practice")) {
      S.course = c; S.unitIx = n; S.unit = unitsOf(c).filter(function (u) { return u.n === n; })[0];
      startPractice(false);
      return true;
    }
    var lm = /^l(\d+)$/i.exec(seg[3]), r = readerFor(c.id, n);
    if (sameName(seg[3], "Challenge")) {
      if (!r || !hasChallenge(r, "review")) return false;
      openChallenge(r, "review");
      return true;
    }
    if (!lm || !r || !r.sections[+lm[1] - 1]) return false;
    var ix = +lm[1] - 1;
    if (sameName(seg[4], "Challenge")) {
      if (!hasChallenge(r, r.sections[ix].n)) return false;
      openChallenge(r, ix);
      return true;
    }
    if (sameName(seg[4], "Questions")) {
      useReader(r);
      S.readIx = ix;
      openRetrieve(r.sections[ix], ix);
      return true;
    }
    openRead(ix, false, r.key);
    return true;
  }

  /* Classes, Grades and Exams belong to a student a teacher has put in a
     course. Until the server says so, they are not in the bar. */
  function setEnrolledTabs() {
    var has = !!(S.me && (S.me.assigned || []).length);
    ["#navClasses", "#navGrades", "#navExams"].forEach(function (id) {
      var tab = $(id);
      if (tab) tab.hidden = !(has && S.me && S.me.role === "student");
    });
    var own = $("#navOwn");
    if (own) own.hidden = !(S.me && S.me.role === "student");
  }

  function show(view) {
    S.view = view;
    [].forEach.call(document.querySelectorAll(".lx-view"), function (v) {
      v.classList.toggle("on", v.id === "v-" + view);
    });
    $("#subbar").hidden = !(view === "explore" || view === "subject");
    if (view !== "admin") leaveConsole();
    $("#wrap").classList.toggle("wide", view === "match" || view === "map");
    // The gradebook grows with the window, centred (gradebook.css).
    $("#wrap").classList.toggle("sgb-wide", view === "grades");
    $("#wrap").classList.toggle("full", view === "read");
    if (view !== "read") { railOff(); if (S.hideAnn) S.hideAnn(); }
    [].forEach.call(document.querySelectorAll("#topNav button"), function (b) {
      b.setAttribute("aria-current", String(b.dataset.view === view));
    });
    window.scrollTo(0, 0);
    if (typeof Tutor !== "undefined" && Tutor && Tutor.where) Tutor.where();
  }

  /* What a console form does when it is finished with: step back, through
     the browser whenever there is a browser entry behind this one, so it
     lands exactly where the browser's own Back would. */
  function goBack() {
    if (S.hist.length && POS > 0 && TRAIL[POS - 1]) { history.back(); return; }
    var prev = S.hist.pop();
    if (!prev) { home(); return; }
    S.here = prev;
    prev.restore();
    mark(false);
  }

  function home() {
    root("my", "Home", home, "");
    drawMy();
    show("my");
  }
  function explore() {
    root("explore", "Explore", explore, "Explore");
    drawExplore();
    show("explore");
  }

  function openProgress() {
    root("progress", "Progress", openProgress, "Progress");
    if (window.OPLO_PROGRESS) {
      if (R) window.OPLO_PROGRESS.setRecord(R);
      window.OPLO_PROGRESS.draw();
    }
    noFoot(); progress(null);
    show("progress");
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
    return ((S.me && S.me.assigned) || []).map(courseFromRow);
  }

  /* A database course as the catalogue screens know it: the shipped course
     with the same code, carrying the row's id, or the row itself when nothing
     was shipped for it. */
  function courseFromRow(row) {
    var match = allCourses().filter(function (c) { return c.id === row.code; })[0];
    if (!match) return fromDbCourse(row);
    match.dbId = row.id;
    return match;
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
        return { n: i + 1, t: u.t, desc: u.desc, play: !!u.play, set: u.set,
                 lab: !!u.lab && !!(window.OPLO_LAB && window.OPLO_LAB.has(c.id, i + 1)) };
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
    // A lab unit teaches (lessons), practises (skills) and tests (the unit
    // test); it has no flashcards, so Recall is not offered.
    return { u: !!(u.play || u.read || u.lab), p: !!(u.play || u.read || u.lab), r: !!u.set, a: !!(u.set || u.lab) };
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
    var us = unitsOf(c).filter(function (u) { return u.play || u.set || u.lab; });
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
  function nextStep(list) {
    var courses = list || enrolled(), best = null;
    courses.forEach(function (c) {
      var pre = (D.PRE || {})[c.id] || {};
      unitsOf(c).forEach(function (u) {
        if (!(u.play || u.set || u.lab)) return;
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
    var live = units.filter(function (u) { return u.play || u.set || u.lab; });
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

  /* ------------------------------------------------------ Knowledge map
     kmap.js draws it and decides what each unit's state means. The numbers
     come from here: the same unit mastery, the same prerequisite graph and the
     same concept states as every other screen, so the map can never tell a
     student something the course page or Learn would contradict. */
  function mapModel(c) {
    var units = unitsOf(c);
    return window.OPLO_KMAP.build({
      units: units.map(function (u) {
        return { n: u.n, t: u.t, part: u.part, desc: u.desc, set: u.set, live: !!(u.play || u.set || u.lab) };
      }),
      pre: (D.PRE || {})[c.id] || {},
      mastery: function (n) { return mastery(c, n); },
      concepts: function (n) {
        var u = units.filter(function (x) { return x.n === n; })[0];
        var set = u && u.set ? SET(u.set) : null;
        if (!set) return null;
        var store = new L.Store(S.me ? S.me.id : "anon", u.set);
        return CN.forSet(u.set, set.cards).map(function (cn) {
          cn.levels = CN.levelsFor(cn);
          cn.state = store.get(cn.k);
          return cn;
        });
      },
      sections: function (n) {
        var r = readerFor(c.id, n);
        if (!r) return null;
        return { total: r.sections.length,
                 done: r.sections.filter(function (sec) { return S.readDone[sec.n]; }).length };
      },
      L: L, G: G, now: Date.now()
    });
  }

  /* What the map looked like last time, per person and per course, so the
     next visit can show what moved. A convenience of this browser only: lose
     it and the map simply has no news to report. */
  function mapSeenKey(c) { return "oplo.map." + (S.me ? S.me.id : "anon") + "." + c.id; }

  function openMap(c, silent, focus) {
    if (!c) return;
    if (!silent) enter("map:" + c.id, "Map", function () { openMap(c, true, focus); }, false, coursePath(c) + "/Map");
    S.course = c;
    var K = window.OPLO_KMAP, model = mapModel(c), prev = null;
    try { prev = JSON.parse(localStorage.getItem(mapSeenKey(c)) || "null"); } catch (e) { /* private mode */ }
    var v = $("#v-map");
    v.innerHTML = "";
    v.appendChild(K.render(model, {
      course: c.t, hue: c.hue, focus: focus,
      rank: R ? G.rank(R.d.game.xp) : null,
      streak: R ? R.d.game.streak : null,
      changes: K.diff(prev, model),
      onUnit: function (n) { openUnit(c, n); },
      onLearn: function (setId) { openSet(setId); startLearn(); }
    }));
    try { localStorage.setItem(mapSeenKey(c), JSON.stringify(K.snapshot(model))); } catch (e) { /* full */ }
    show("map");
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

  /* ======================================================= School, and your own
     Two different things, and never drawn as one.

     School is what a school put a student in: its courses, the work their
     teachers set — usually a lesson or an activity right here on OEdu — and
     the marks that come back. That is what is graded.

     Self-learning is whatever a student takes up on their own from Explore.
     It is never graded, it is not on their school record, and nobody at
     school can see it: the server gives their learning record to them alone.
     A course a school put them in is School even when they practise it
     beyond what was set; a course nobody put them in is theirs. */
  function inSchool(c) { return !!c && enrolled().some(function (x) { return x.id === c.id; }); }
  function learnerHere() { return !!(R && S.me && !document.body.classList.contains("is-staff")); }
  function ownCourses() {
    if (!R) return [];
    return R.own().map(function (id) { return allCourses().filter(function (c) { return c.id === id; })[0]; })
      .filter(function (c) { return c && !inSchool(c); });
  }
  // Starting something in a course nobody put you in puts it on your list.
  function adoptIfOwn(c) {
    if (!learnerHere() || !c || c.stub || inSchool(c)) return;
    if (R.adopt(c.id)) toast("“" + c.t + "” is in Self-learning — not graded, and only you see it.");
  }

  /* The work set for this student, kept for half a minute so the home page
     and the School page draw from one answer. */
  var WORK = null;
  function loadWork(force) {
    if (!force && WORK && Date.now() - WORK.at < 30000) return WORK.p;
    var p = API.reporting.coursework().then(function (data) { handInDone(data.work); return data; });
    WORK = { at: Date.now(), p: p };
    p.catch(function () { WORK = null; });
    return p;
  }

  /* Where an assigned activity stands on this device's record. */
  function activityState(act) {
    if (!act) return null;
    if (act.kind === "set") {
      var st = SET(act.set);
      if (!st || !st.cards || !st.cards.length) return null;
      var m = setMastered(act.set), n = st.cards.length;
      return { done: m / n >= 0.8, pct: Math.round(m / n * 100), started: m > 0 || !!setState(act.set).runs,
               detail: m + " of " + n + " terms mastered" };
    }
    var c = activityCourse(act), L = window.OPLO_LAB;
    if (!c) return null;
    if (act.kind === "lesson") {
      var ls = L && L.lessonState ? L.lessonState(c.id, act.unit, act.lesson, S.me) : null;
      return { done: !!(ls && ls.done), pct: ls && ls.done ? 100 : null, started: !!ls, detail: ls && ls.done ? "Lesson finished on OEdu" : "Lesson started" };
    }
    if (act.kind === "test") {
      var best = L && L.testBest ? L.testBest(c.id, act.unit, S.me) : null;
      return { done: best != null, pct: best != null ? Math.round(best * 100) : null, started: best != null,
               detail: best != null ? "Best score on the unit test" : "Not taken yet" };
    }
    var u = unitsOf(c).filter(function (x) { return x.n === act.unit; })[0];
    if (!u) return null;
    var mm = mastery(c, act.unit), dd = dims(c, act.unit);
    var done = mm >= 85 || (u.lab && dd.u >= 100);
    return { done: done, pct: mm, started: mm > 0, detail: (u.lab ? dd.u + "% of the lessons done · " : "") + mm + "% mastery" };
  }

  /* Hand in whatever is finished and has not been handed in. Quietly: the
     student sees "Handed in" beside it, and a toast the once. */
  var HANDING = {};
  function handInDone(work) {
    if (!learnerHere() || !work) return;
    work.forEach(function (w) {
      if (!onOedu(w.activity) || w.submittedAt || HANDING[w.assignmentId]) return;
      if (w.status === "excused" || (w.status === "marked" && w.score != null)) return;
      var st = activityState(w.activity);
      if (!st || !st.done) return;
      HANDING[w.assignmentId] = 1;
      API.courses.submit(w.assignmentId, { kind: w.activity.kind, done: true, pct: st.pct == null ? undefined : st.pct, detail: st.detail })
        .then(function (sub) {
          w.submittedAt = sub.submittedAt;
          w.result = sub.result;
          toast("Handed in: " + w.title);
          if (S.view === "my") drawMy();
          else if (S.view === "classes") openClasses(true);
        }, function () { delete HANDING[w.assignmentId]; });
    });
  }
  // After practice changes anything, see whether it finished set work.
  var HAND_T = null;
  function checkSetWork() {
    clearTimeout(HAND_T);
    HAND_T = setTimeout(function () { if (WORK) WORK.p.then(function (d) { handInDone(d.work); }); }, 1500);
  }

  function openActivity(act) {
    var c = activityCourse(act);
    if (act.kind === "set") { if (SET(act.set)) openSet(act.set); else toast("That study set isn’t available."); return; }
    if (!c) { toast("That lesson isn’t on OEdu any more. Ask your teacher."); return; }
    if (act.kind === "lesson") openLab(c, act.unit, "l" + act.lesson);
    else if (act.kind === "test") openLab(c, act.unit, "Test");
    else openUnit(c, act.unit);
  }

  /* One piece of set work: what it is, where it stands, and — when it is on
     OEdu — the button that opens it. */
  function workRow(w, compact) {
    var now = Date.now(), late = w.dueAt && w.dueAt < now;
    var marked = w.status === "marked" && w.score != null;
    var st = onOedu(w.activity) ? activityState(w.activity) : null;
    var state = marked ? "marked" : w.status === "excused" ? "excused" : w.submittedAt ? "handed"
      : w.status === "missing" ? "missing" : late ? "late" : st && st.started ? "going" : "todo";
    var row = el("div", "sw-row " + state);
    var said = {
      marked: cxNum(w.score) + " / " + cxNum(w.outOf), excused: "Excused", handed: "Handed in",
      missing: "Not handed in", late: "Past due", going: "In progress", todo: w.dueAt ? "" : "No due date"
    }[state];
    var when = w.status === "missing" ? "counted as 0 of " + cxNum(w.outOf)
      : state === "handed" ? "waiting for your teacher to mark it"
      : state === "excused" ? "not part of your grade"
      : w.dueAt ? (late ? "was due " + dayName(w.dueAt) : "due " + dayName(w.dueAt)) : "";
    var where = w.activity && onOedu(w.activity) ? "On OEdu · " + activityShort(w.activity) : "";
    row.innerHTML =
      "<span class='ic'>" + svg(onOedu(w.activity) ? I.play : I.read, true) + "</span>" +
      "<span class='t'><b>" + esc(w.title) + "</b><span>" + esc([compact ? w.courseTitle : "", where, when].filter(Boolean).join(" · ")) +
        (w.extraCredit ? " · extra credit" : "") + "</span></span>" +
      "<span class='m'>" + esc(said) + "</span>";
    if (onOedu(w.activity) && !marked && w.status !== "excused") {
      var go = el("button", "lx-btn sw-go" + (state === "handed" ? " quiet" : ""),
        state === "handed" ? "Open" : st && st.started ? "Continue" : "Start");
      go.type = "button";
      go.addEventListener("click", function () { openActivity(w.activity); });
      row.appendChild(go);
    }
    if (w.feedback) row.appendChild(el("p", "fb", esc(w.feedback)));
    return row;
  }

  function schoolWorkList(host, work, max) {
    // What can still be done on time comes first, soonest first; then what
    // is past due, most recent first. Marked work only when nothing is open.
    var now = Date.now();
    var open = work.filter(function (w) { return !(w.status === "marked" && w.score != null) && w.status !== "excused"; });
    var due = open.filter(function (w) { return !w.dueAt || w.dueAt >= now || w.submittedAt; })
      .sort(function (a, b) { return (a.dueAt || 8e15) - (b.dueAt || 8e15); });
    var late = open.filter(function (w) { return w.dueAt && w.dueAt < now && !w.submittedAt; })
      .sort(function (a, b) { return b.dueAt - a.dueAt; });
    open = due.concat(late);
    var back = work.filter(function (w) { return w.status === "marked" && w.score != null; })
      .sort(function (a, b) { return (b.gradedAt || 0) - (a.gradedAt || 0); });
    var list = el("div", "sw-list");
    open.slice(0, max || 99).forEach(function (w) { list.appendChild(workRow(w, true)); });
    if (!open.length) back.slice(0, 3).forEach(function (w) { list.appendChild(workRow(w, true)); });
    host.appendChild(list);
    return open.length;
  }

  /* ------------------------------------------------------------------ Home */
  function drawMy() {
    var v = $("#v-my");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-hello", greeting() + ", " + esc(S.me.first) + "."));
    v.appendChild(el("h1", "lx-h1", "Here is where you are."));
    v.appendChild(standing());

    var lanes = el("div", "lx-lanes");
    v.appendChild(lanes);

    /* ---- School ------------------------------------------------------ */
    var school = el("section", "lx-lane school");
    lanes.appendChild(school);
    var mine = enrolled();
    school.innerHTML = "<header class='lx-lanehead'><p class='k'>School</p><h2>" + esc(schoolOf()) + "</h2>" +
      "<p>What your school put you in, and the work your teachers set. This is what’s graded.</p></header>";
    var workSlot = el("div", "lx-lanebody");
    school.appendChild(workSlot);
    if (mine.length) {
      workSlot.appendChild(el("p", "lx-lanesub", "Set by your teachers"));
      var wait = el("p", "lx-lanenote", "Looking for work…");
      workSlot.appendChild(wait);
      loadWork().then(function (data) {
        wait.remove();
        if (!data.work.length) { workSlot.appendChild(el("p", "lx-lanenote", "Nothing has been set yet.")); return; }
        var t = data.totals, bits = [];
        if (t.overdue) bits.push("<b>" + t.overdue + " past due</b>");
        if (t.missing) bits.push("<b>" + t.missing + " marked as not handed in</b>");
        if (bits.length) workSlot.insertBefore(el("p", "lx-lanenote", bits.join(" · ")), workSlot.children[1]);
        var n = schoolWorkList(workSlot, data.work, 5);
        if (n > 5 || data.work.length > 5) {
          var all = el("button", "lx-lanelink", "All work ›");
          all.type = "button";
          all.addEventListener("click", function () { openClasses(); });
          workSlot.appendChild(all);
        }
      }, function () {
        wait.textContent = "Couldn’t reach the server, so what your teachers have set isn’t shown here.";
      });

      school.appendChild(el("p", "lx-lanesub", "Your courses"));
      var cl = el("div", "lx-crow-list");
      mine.forEach(function (c) { cl.appendChild(courseRow(c, "school")); });
      school.appendChild(cl);

      var given = Object.keys(dbSets);
      if (given.length) {
        school.appendChild(el("p", "lx-lanesub", "Study sets from your teachers"));
        var sg = el("div", "lx-crow-list");
        given.forEach(function (id) {
          var set = dbSets[id], b = el("button", "lx-crow");
          b.type = "button";
          b.innerHTML = '<span class="ic">' + svg(I.cards, true) + "</span><span class='t'><b>" + esc(set.t) + "</b><span>" + set.cards.length + " terms</span></span>";
          b.addEventListener("click", function () { openSet(id); });
          sg.appendChild(b);
        });
        school.appendChild(sg);
      }
      var sstep = nextStep(mine);
      if (sstep) school.appendChild(stepCard(sstep, "Practice next", "Practice isn’t graded — only work your teachers set is."));
    } else {
      school.appendChild(el("div", "lx-lanenone", "<b>No school courses yet</b><p>When your school puts you in a course, it appears here with the work your teachers set.</p>"));
    }

    /* ---- Self-learning ---------------------------------------------- */
    var own = el("section", "lx-lane own");
    lanes.appendChild(own);
    own.innerHTML = "<header class='lx-lanehead'><p class='k'>Self-learning</p><h2>On your own</h2>" +
      "<p>Courses you chose. Never graded, not on your school record, and only you can see them.</p></header>";
    var mineOwn = ownCourses();
    var ostep = nextStep(mineOwn);
    if (ostep) own.appendChild(stepCard(ostep, "Pick up where you left off", null));
    if (mineOwn.length) {
      own.appendChild(el("p", "lx-lanesub", "You’re learning"));
      var ol = el("div", "lx-crow-list");
      mineOwn.slice(0, 5).forEach(function (c) { ol.appendChild(courseRow(c, "own")); });
      own.appendChild(ol);
      if (mineOwn.length > 5) {
        var more = el("button", "lx-lanelink", "All " + mineOwn.length + " ›");
        more.type = "button";
        more.addEventListener("click", function () { openOwn(); });
        own.appendChild(more);
      }
    } else {
      own.appendChild(el("div", "lx-lanenone", "<b>Nothing yet</b><p>Start any course in Explore and it shows up here — for you, not for a grade.</p>"));
    }
    var ex = el("button", "lx-btn quiet", "Find something to learn");
    ex.type = "button";
    ex.addEventListener("click", explore);
    own.appendChild(ex);

    /* ---- Account-wide: what trips you up --------------------------- */
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
  }

  function schoolOf() {
    var o = (S.me && S.me.orgs || [])[0];
    return o && o.name ? o.name : "Your school";
  }

  /* A course, as one row: what it is, how far through, and where it lives. */
  function courseRow(c, lane) {
    var b = el("button", "lx-crow");
    b.type = "button";
    var pct = coursePct(c);
    b.innerHTML = '<span class="ic" style="background:' + c.hue + '1a;color:' + c.hue + '">' + svg(c.glyph, true) + "</span>" +
      "<span class='t'><b>" + esc(c.t) + "</b><span>" + esc(c.subject) + (lane === "own" ? " · not graded" : "") + "</span></span>" +
      "<span class='p'><i style='width:" + pct + "%'></i></span><span class='pc'>" + pct + "%</span>";
    b.addEventListener("click", function () { if (c.stub) toast("“" + c.t + "” has no syllabus behind it yet."); else openCourse(c); });
    return b;
  }

  function stepCard(step, title, note) {
    var target = step.weak ? unitsOf(step.course).filter(function (x) { return x.n === step.weak.n; })[0] : step.unit;
    var card = el("div", "lx-stepcard");
    card.innerHTML = "<p class='k'>" + esc(title) + "</p><b>" + esc(step.course.t) + " · " + esc(target.t) + "</b>" +
      "<span>" + (step.pct ? "You’re at " + step.pct + "% on this one." : "You haven’t started this one.") + (note ? " " + esc(note) : "") + "</span>";
    var go = el("button", "lx-btn", step.pct ? "Continue" : "Start");
    go.type = "button";
    go.addEventListener("click", function () { openUnit(step.course, target.n); });
    card.appendChild(go);
    return card;
  }

  /* ---------------------------------------------------------------- School
     Every course the school put this student in, and all the work set in
     it — soonest first, with what came back. */
  function openClasses(silent) {
    if (!silent) root("classes", "School", function () { openClasses(true); }, "School");
    var v = $("#v-classes");
    v.innerHTML = "";
    var mine = enrolled();
    v.appendChild(el("p", "lx-eyebrow", "School"));
    v.appendChild(el("h1", "lx-h1", esc(schoolOf())));
    v.appendChild(el("p", "lx-lede", mine.length
      ? "The courses your school put you in, and the work your teachers set. This is what’s graded — your marks are in Grades."
      : "Nothing yet."));
    if (!mine.length) {
      var none = el("div", "lx-pending");
      none.innerHTML = "<b>No school courses yet</b><p>When your school puts you in a course, it appears here " +
        "with the work your teachers set. Anything in Explore is yours to learn on your own in the meantime — it isn’t graded.</p>";
      v.appendChild(none);
      noFoot(); progress(null);
      show("classes");
      return;
    }
    var list = el("div", "lx-classes");
    v.appendChild(list);
    var cards = {};
    mine.forEach(function (c) { var card = classCard(c); cards[c.dbId || c.id] = card; list.appendChild(card); });
    loadWork().then(function (data) {
      mine.forEach(function (c) {
        var card = cards[c.dbId || c.id], host = card && card.querySelector(".lx-class-work");
        if (!host) return;
        host.innerHTML = "";
        var rows = data.work.filter(function (w) { return w.courseId === c.dbId; });
        if (!rows.length) { host.appendChild(el("p", "lx-class-none", "No work has been set in this course yet.")); return; }
        host.appendChild(el("h3", "lx-class-h", rows.length === 1 ? "One piece of work" : rows.length + " pieces of work"));
        var ul = el("div", "sw-list");
        rows.forEach(function (w) { ul.appendChild(workRow(w, false)); });
        host.appendChild(ul);
      });
    }, function () {
      [].forEach.call(v.querySelectorAll(".lx-class-work"), function (h) {
        h.innerHTML = "<p class='lx-class-none'>The work set in this course couldn’t be loaded just now.</p>";
      });
    });
    noFoot(); progress(null);
    show("classes");
  }

  /* One course. Who teaches it arrives after it is drawn, so the card is
     never a spinner. */
  function classCard(c) {
    var card = el("section", "lx-class");
    var head = el("div", "lx-class-head");
    var ic = el("span", "ic");
    ic.style.background = c.hue + "1a";
    ic.style.color = c.hue;
    ic.innerHTML = svg(c.glyph || '<path d="M4 5.5h7v14H4z"/><path d="M13 5.5h7v14h-7z"/>', true);
    head.appendChild(ic);
    var txt = el("div", "lx-class-txt");
    txt.appendChild(el("h2", null, esc(c.t)));
    var who = el("p", "lx-class-who", "&nbsp;");
    txt.appendChild(who);
    head.appendChild(txt);
    var gr = el("button", "lx-btn quiet");
    gr.type = "button";
    gr.textContent = "Grades";
    gr.addEventListener("click", function () { openGrades(); });
    head.appendChild(gr);
    var go = el("button", "lx-btn");
    go.type = "button";
    go.textContent = "Open course";
    go.addEventListener("click", function () { openCourse(c); });
    head.appendChild(go);
    card.appendChild(head);
    var work = el("div", "lx-class-work");
    work.appendChild(el("p", "lx-class-none", "Looking for work set in this course…"));
    card.appendChild(work);
    if (c.dbId) {
      API.courses.members(c.dbId).then(function (rows) {
        var teachers = (rows || []).filter(function (r) { return r.role === "teacher" || r.role === "assistant"; })
          .map(function (r) { return r.name || r.email; });
        who.textContent = teachers.length ? "Taught by " + teachers.join(", ") : "Your course";
      }, function () { who.textContent = "Your course"; });
    } else who.textContent = "Your course";
    return card;
  }

  /* --------------------------------------------------------- Self-learning */
  function openOwn(silent) {
    if (!silent) root("own", "Self-learning", function () { openOwn(true); }, "Self-learning");
    var v = $("#v-own");
    v.innerHTML = "";
    v.appendChild(el("p", "lx-eyebrow", "Self-learning"));
    v.appendChild(el("h1", "lx-h1", "On your own"));
    v.appendChild(el("p", "lx-lede", "Courses you chose to learn. Never graded, not on your school record, and your teachers can’t see them — " +
      "your progress here is kept in your account for you alone."));
    var list = ownCourses();
    if (!list.length) {
      var none = el("div", "lx-pending");
      none.innerHTML = "<b>Nothing yet</b><p>Pick any course in Explore and start a unit — it appears here.</p>";
      v.appendChild(none);
      var ex = el("button", "lx-btn lg", "Explore courses");
      ex.type = "button";
      ex.addEventListener("click", explore);
      v.appendChild(ex);
    } else {
      var step = nextStep(list);
      if (step) v.appendChild(stepCard(step, "Pick up where you left off", null));
      var g = el("div", "lx-owngrid");
      list.forEach(function (c) {
        var card = el("section", "lx-owncard");
        var pct = coursePct(c), us = unitsOf(c).filter(function (u) { return u.play || u.set || u.lab || u.read; });
        var mastered = us.filter(function (u) { return mastery(c, u.n) >= 85; }).length;
        card.innerHTML = '<span class="ic" style="background:' + c.hue + '1a;color:' + c.hue + '">' + svg(c.glyph, true) + "</span>" +
          "<h3>" + esc(c.t) + "</h3><p>" + esc(c.subject) + " · " + mastered + " of " + us.length + " units mastered</p>" +
          "<div class='bar'><i style='width:" + pct + "%'></i></div><p class='pc'>" + pct + "% mastery · not graded</p>";
        var acts = el("div", "acts");
        var go = el("button", "lx-btn", pct ? "Continue" : "Start");
        go.type = "button";
        go.addEventListener("click", function () { openCourse(c); });
        var off = el("button", "lx-btn quiet", "Take off my list");
        off.type = "button";
        off.addEventListener("click", function () {
          R.drop(c.id);
          toast("Taken off your list. Your progress is kept.");
          openOwn(true);
        });
        acts.appendChild(go);
        acts.appendChild(off);
        card.appendChild(acts);
        g.appendChild(card);
      });
      v.appendChild(g);
    }
    noFoot(); progress(null);
    show("own");
  }

  /* On a course's page: which of the two it is. */
  function courseKind(c) {
    if (!S.me || document.body.classList.contains("is-staff")) return null;
    var box = el("div", "lx-kind " + (inSchool(c) ? "school" : "own"));
    if (inSchool(c)) {
      box.innerHTML = "<b>School course</b><span>Your school put you in this course. Work your teachers set here is graded; practising beyond it isn’t.</span>";
      var w = el("button", "lx-lanelink", "Work set ›");
      w.type = "button";
      w.addEventListener("click", function () { openClasses(); });
      box.appendChild(w);
    } else {
      var on = R && R.own().indexOf(c.id) > -1;
      box.innerHTML = "<b>Self-learning</b><span>Not graded, not on your school record, and only you can see your progress.</span>";
      var b = el("button", "lx-btn quiet", on ? "On your list ✓" : "Add to Self-learning");
      b.type = "button";
      b.addEventListener("click", function () {
        if (!R) return;
        if (R.own().indexOf(c.id) > -1) { R.drop(c.id); b.textContent = "Add to Self-learning"; toast("Taken off your list."); }
        else { R.adopt(c.id); b.textContent = "On your list ✓"; toast("Added to Self-learning."); }
      });
      box.appendChild(b);
    }
    return box;
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
  /* ------------------------------------------------------- Mistake book */
  function openMistakes(silent) {
    if (!silent) enter("mistakes", "Mistake book", function () { openMistakes(true); }, false, "Mistakes");
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
    if (!silent) enter("subject:" + s.n, s.n, function () { openSubject(s, true); }, false, slug(s.n));
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
    if (!silent) enter("course:" + c.id, trim(c.t), function () { openCourse(c, true); }, false, coursePath(c));
    S.course = c;
    // A course with a page of its own draws it here instead: SAT Math's hub.
    if (c.hub && !c.hubPanel && window.OPLO_LAB && window.OPLO_LAB.hub) {
      window.OPLO_LAB.hub($("#v-course"), hubCtx(c), "");
      markSubjectNav(c.subject);
      noFoot(); progress(null);
      show("course");
      return;
    }
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
    var kind = courseKind(c);
    if (kind) v.appendChild(kind);
    // A course with a panel (Algebra I) carries its Pathway ring above the units.
    if (c.hub && c.hubPanel && window.OPLO_LAB && window.OPLO_LAB.hub) {
      var pw = el("div", "pw-panel");
      v.appendChild(pw);
      window.OPLO_LAB.hub(pw, hubCtx(c), "");
    }

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

    if (units.some(function (u) { return u.play || u.set || u.lab; })) {
      main.appendChild(window.OPLO_KMAP.teaser(mapModel(c), {
        hue: c.hue, onOpen: function () { openMap(c); }
      }));
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
      if (u.lab) bits.push("Interactive lessons · practice · unit test");
      if (u.set) bits.push(SET(u.set).cards.length + " terms");
      if (!bits.length) bits.push("Syllabus only");
      b.innerHTML = '<span class="n">' + u.n + "</span>" +
        '<span class="txt"><b>' + esc(u.t) + "</b><span>" + bits.join(" · ") + "</span></span>" +
        '<span class="go">' + svg(I.chev, true) + "</span>";
      b.addEventListener("click", function () { openUnit(c, u.n); });
      list.appendChild(b);
    });
    main.appendChild(list);
    if (c.lab && window.OPLO_LAB) {
      var cc = el("button", "lb-test lb-coursebtn");
      cc.type = "button";
      cc.innerHTML = '<span class="lb-tico">' + svg(I.star, true) + "</span>" +
        '<span class="lb-ttxt"><b>Course challenge</b><span>Two problems from every unit, mixed — see what has stuck ' +
        "and what needs another look.</span></span>" + '<span class="lb-go">Start' + svg(I.arrow, true) + "</span>";
      cc.addEventListener("click", function () { openLab(c, null, "Challenge"); });
      main.appendChild(cc);
    }
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
    if (!silent) enter("unit:" + c.id + ":" + n, trim(u.t), function () { openUnit(c, n, true); },
                       false, coursePath(c) + "/u" + n);
    S.course = c; S.unitIx = n; S.unit = u;
    adoptIfOwn(c);
    if (u.lab && window.OPLO_LAB) {
      window.OPLO_LAB.renderUnit($("#v-unit"), labCtx(c, n));
      noFoot(); progress(null);
      show("unit");
      return;
    }

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
      if (hasChallenge(reader, "review")) v.appendChild(challengeBlock(reader));
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

  /* ============================================================ The lab
     Interactive math courses (lab/core.js). A lab unit's page, its lessons,
     a skill's practice and the tests all live in the lab; the app gives them
     an address, a place in history, and a way to raise the unit's mastery. */
  function labCtx(c, n) {
    var u = n ? unitsOf(c).filter(function (x) { return x.n === n; })[0] : null;
    return {
      course: c.id, courseTitle: c.t, n: n, title: u ? u.t : "", desc: u ? u.desc : "", me: S.me,
      units: unitsOf(c).filter(function (x) { return x.lab; }).map(function (x) { return x.n; }),
      go: {
        course: function () { openCourse(c); },
        unit: function () { openUnit(c, n); },
        lesson: function (k) { openLab(c, n, "l" + k); },
        practice: function (id) { openLab(c, n, "Practice/" + id); },
        test: function () { openLab(c, n, "Test"); },
        quiz: function (k) { openLab(c, n, "Quiz/" + k); }
      },
      // What was done, as the unit's four dials. Mastery never falls.
      onProgress: function (d, un) {
        var nn = un || n;
        if (!d || !nn) return;
        raise(c, nn, "u", d.u); raise(c, nn, "p", d.p); raise(c, nn, "a", d.a);
        checkSetWork();
      }
    };
  }
  /* A course's own page and the places below it (SAT-Math/Scan,
     SAT-Math/Fix/<skill>, …) — drawn by the course's kit (lab/core.js, hub). */
  var HUB_LABEL = { Scan: "Brain Scan", Results: "Scan results", Mission: "Today's mission", Time: "Session", Fix: "Fix a skill",
                    Skill: "Skill", Drill: "Practice", Module: "Practice module", Errors: "Error Lab", Library: "Strategy Library",
                    Try: "Strategy", Spot: "Pattern Spotter", Target: "Target score",
                    Learn: "Learn a topic", Check: "Knowledge Check", Review: "Review", Graph: "Knowledge graph" };
  function hubCtx(c) {
    var ctx = labCtx(c, null);
    ctx.go.hub = function () { openCourse(c); };
    ctx.go.page = function (what) { openHub(c, what); };
    ctx.go.unit = function (n) { openUnit(c, n); };
    ctx.go.lesson = function (n, k) { openLab(c, n, "l" + k); };
    ctx.go.practice = function (n, id) { openLab(c, n, "Practice/" + id); };
    ctx.go.course = function (id, n) {
      var cc = courseById(id);
      if (!cc) return;
      if (n && unitsOf(cc).some(function (u) { return u.n === n; })) openUnit(cc, n); else openCourse(cc);
    };
    ctx.onProgress = function (d, n) { if (d && n) { raise(c, n, "u", d.u); raise(c, n, "p", d.p); raise(c, n, "a", d.a); } };
    return ctx;
  }
  function openHub(c, what, silent) {
    if (!what) { openCourse(c, silent); return; }
    if (!window.OPLO_LAB || !window.OPLO_LAB.hub) return;
    if (!silent) enter("hub:" + c.id + ":" + what, HUB_LABEL[what.split("/")[0]] || trim(c.t), function () { openHub(c, what, true); },
                       false, coursePath(c) + "/" + what);
    S.course = c;
    window.OPLO_LAB.hub($("#v-lab"), hubCtx(c), what);
    markSubjectNav(c.subject);
    noFoot(); progress(null);
    show("lab");
  }

  function openLab(c, n, what, silent) {
    var LAB = window.OPLO_LAB;
    if (!LAB) return;
    var label = what === "Test" ? "Unit test" : what === "Challenge" ? "Course challenge" :
      /^Practice\//.test(what) ? "Practice" : /^Quiz\//.test(what) ? "Quiz" : "Lesson";
    if (!silent) enter("lab:" + c.id + ":" + n + ":" + what, label, function () { openLab(c, n, what, true); },
                       false, coursePath(c) + (n ? "/u" + n : "") + "/" + what);
    S.course = c;
    adoptIfOwn(c);
    var v = $("#v-lab");
    var ctx = labCtx(c, n);
    if (what === "Challenge") LAB.runTest(v, ctx, "course");
    else if (what === "Test") LAB.runTest(v, ctx, "unit");
    else if (/^Practice\//.test(what)) LAB.runPractice(v, ctx, what.slice(9));
    else if (/^Quiz\//.test(what)) LAB.runQuiz(v, ctx, +what.slice(5));
    else LAB.runLesson(v, ctx, +what.slice(1));
    noFoot(); progress(null);
    show("lab");
  }

  /* ================================================================= Sets */
  function openSet(id, silent) {
    if (!silent) enter("set:" + id, trim(SET(id).t), function () { openSet(id, true); }, false, "Sets/" + id);
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
    enter("cards:" + S.setId, "Flashcards", function () { startCards(true); }, again, "Sets/" + S.setId + "/Flashcards");
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
        : "Click the card to flip it. Arrow keys move.";
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

  /* The colour for one of summary()'s groups. Those groups are not the
     bands: "weak" is exposed and familiar together, and there is no band
     called that. Looking it up as if it were one threw the moment a student
     had got anything wrong — which the unit's warm-up questions are built to
     make happen — so Learn would not open at all. A name with no band of its
     own falls back to "new" rather than stopping the screen. */
  function bandHue(group) {
    var k = group === "weak" ? "familiar" : group === "untouched" ? "new" : group;
    var hit = L.BANDS.filter(function (b) { return b.k === k; })[0];
    return (hit || L.BANDS[0]).hue;
  }

  function startLearn(again) {
    enter("learn:" + S.setId, "Learn", function () { startLearn(true); }, again, "Sets/" + S.setId + "/Learn");

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
          i.style.background = bandHue(p[0]);
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
          var hue = bandHue(g[2]);
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
    enter("match:" + S.setId, "Match", function () { startMatch(true); }, again, "Sets/" + S.setId + "/Match");
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
    enter("cardmatch:" + S.setId, "Match the card", function () { startCardMatch(true); }, again, "Sets/" + S.setId + "/Match-the-card");
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
    enter("hunt:" + S.setId, "Word hunt", function () { startHunt(true); }, again, "Sets/" + S.setId + "/Word-hunt");
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
      "Click the first letter, then the last. Words run in any direction, " +
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
    enter("hangman:" + S.setId, "Hangman", function () { startHangman(true); }, again, "Sets/" + S.setId + "/Hangman");
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
    enter("test:" + S.setId, "Test", function () { startTest(true); }, again, "Sets/" + S.setId + "/Test");
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
                 doc: "media-u6", set: "media-6" },
    "media:7": { key: "media:7", course: "media", courseTitle: "Media Arts", unit: 7,
                 title: "Video Basics", sections: window.OPLO_UNIT7 || [],
                 doc: "media-u7", set: "media-7" },
    "media:8": { key: "media:8", course: "media", courseTitle: "Media Arts", unit: 8,
                 title: "Intro to Animation", sections: window.OPLO_UNIT8 || [],
                 doc: "media-u8", set: "media-8" },
    "media:9": { key: "media:9", course: "media", courseTitle: "Media Arts", unit: 9,
                 title: "Audio/Video Production", sections: window.OPLO_UNIT9 || [],
                 doc: "media-u9", set: "media-9" },
    "biz:4":   { key: "biz:4", course: "biz", courseTitle: "Introduction to Business", unit: 4,
                 title: "International Business", sections: window.OPLO_BIZ4 || [],
                 doc: "biz-u4", set: "biz-4" },
    "biz:1":   { key: "biz:1", course: "biz", courseTitle: "Introduction to Business", unit: 1,
                 title: "Introduction to Business", sections: window.OPLO_BIZ1 || [],
                 doc: "biz-u1", set: "biz-1" },
    "biz:2":   { key: "biz:2", course: "biz", courseTitle: "Introduction to Business", unit: 2,
                 title: "Economics and Business", sections: window.OPLO_BIZ2 || [],
                 doc: "biz-u2", set: "biz-2" },
    "biz:3":   { key: "biz:3", course: "biz", courseTitle: "Introduction to Business", unit: 3,
                 title: "Business Ethics and Social Responsibility", sections: window.OPLO_BIZ3 || [],
                 doc: "biz-u3", set: "biz-3" },
    "biz:5":   { key: "biz:5", course: "biz", courseTitle: "Introduction to Business", unit: 5,
                 title: "Business Writing", sections: window.OPLO_BIZ5 || [],
                 doc: "biz-u5", set: "biz-5" },
    "bio:1":   { key: "bio:1", course: "bio", courseTitle: "Biology", unit: 1,
                 title: "Ecology and Natural Systems", sections: window.OPLO_BIO1 || [],
                 doc: "bio-u1", set: "bio-1" }
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

    /* The store, and — when there is an account behind it — the server it
       caches. `connect` pulls once and merges; every write after that pushes
       itself. Nothing waits on the network: the reading uses the local copy
       from the first frame, and a pull that lands later repaints the margin
       through the same subscription a local write uses. */
    function shop() {
      if (!store) {
        store = new A.Store(S.me ? S.me.id : "anon", DOC);
        store.courseId = RU.key || null;
        if (API && S.me) {
          var bound = store;
          bound.connect({
            pull: function (scope) { return API.marks.list({ scope: scope }); },
            push: function (m) { return API.marks.put(m); },
            drop: function (id) { return API.marks.remove(id); }
          }, DOC).then(function () {
            // Only repaint if the reader is still on the page that asked.
            if (store === bound && S.view === "read") redrawMarks();
          });
        }
      }
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
    S.redrawMarks = redrawMarks;

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

    /* Marks that arrived after the page did — a pull finishing, most often.
       Painting is idempotent through `restore`, which skips a mark already on
       the page, so this is safe to call whenever the store changes. */
    function redrawMarks() {
      if (!body || !sec) return;
      A.restore(body, here());
      drawMargin();
      if (S.railCounts) S.railCounts();
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
  /* ------------------------------------------------------------- Figures
     A picture inside a section, placed beside the sentence it illustrates.

     Every <img> carries its real width and height, so the column does not
     jump when a photograph arrives, and loads lazily, because a reader starts
     at the top. The credit travels with the figure rather than living on a
     page at the end: a CC BY-SA image has to carry its author and licence
     wherever it is shown, and naming a photographer is what the free licences
     ask in return even where they do not require it.

     A figure can also teach by comparison. `label` names each panel; `grid`
     lays the rule-of-thirds or golden-ratio lines over a photograph, drawn in
     the page rather than burned into the file; `natural` keeps each image's
     own proportions, because a before-and-after that crops both sides to
     match has stopped showing the before; `fx` applies one of a fixed set of
     display filters to the same licensed photograph, so "this is what sepia
     does" is shown on pixels the student has already seen unfiltered.

     b = { imgs: [{ src, alt, w, h, pos, label, grid, fx }], cap,
           credits: [{ what, by, byUrl, site, siteUrl, license, licenseUrl }],
           cols, natural, diagram, size } */
  var FIG_FX = { sepia: 1, vintage: 1, dramatic: 1, saturated: 1, swapped: 1 };
  function figureFilters() {
    // Swapping two colour channels is not a CSS filter function, so the one
    // SVG filter it needs is added to the page the first time a figure asks.
    if (document.getElementById("fxFilters")) return;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("id", "fxFilters");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.innerHTML = '<filter id="fx-swap-gb" color-interpolation-filters="sRGB">' +
      '<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 1 0 0  0 1 0 0 0  0 0 0 1 0"/></filter>';
    document.body.appendChild(svg);
  }

  function figureBlock(b) {
    var cols = Math.min(b.cols || b.imgs.length, 3);
    var cls = "rd-fig cols-" + cols + (b.natural ? " natural" : "") +
              (b.diagram ? " diagram" : "") + (b.size ? " " + b.size : "");
    var f = el("figure", cls);
    var row = el("div", "rd-fig-imgs");
    b.imgs.forEach(function (im) {
      var cell = el("div", "rd-fig-cell");
      if (im.label) cell.appendChild(el("span", "rd-fig-label", esc(im.label)));
      var frame = el("div", "rd-fig-frame");
      var img = document.createElement("img");
      img.src = im.src;
      img.alt = im.alt;
      if (im.w) img.width = im.w;
      if (im.h) img.height = im.h;
      if (im.pos) img.style.objectPosition = im.pos;
      if (im.fx && FIG_FX[im.fx]) {
        img.classList.add("fx-" + im.fx);
        if (im.fx === "swapped") figureFilters();
      }
      img.loading = "lazy";
      img.decoding = "async";
      // Every picture opens at the size of the window, so a label in a
      // diagram or a detail in a photograph can be read however narrow the
      // column is. A figure a reader has to squint at is a figure that does
      // not teach.
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Enlarge: " + im.alt);
      img.classList.add("rd-zoomable");
      img.addEventListener("click", function () { openFigZoom(im, b); });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFigZoom(im, b); }
      });
      frame.appendChild(img);
      frame.appendChild(el("span", "rd-fig-hint",
        svg('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>', true) + "<span>Enlarge</span>"));
      if (im.grid === "thirds" || im.grid === "phi") {
        var g = el("i", "rd-fig-grid " + im.grid);
        g.setAttribute("aria-hidden", "true");
        frame.appendChild(g);
      }
      cell.appendChild(frame);
      row.appendChild(cell);
    });
    f.appendChild(row);
    f.appendChild(figCaption(b));
    return f;
  }

  /* A figure's caption, and under it the credit its licence asks for. */
  function figCaption(b) {
    function link(text, href) {
      return href
        ? '<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + esc(text) + "</a>"
        : esc(text);
    }
    var credits = (b.credits || []).map(function (c) {
      return (c.what ? esc(c.what) + ": " : "") + link(c.by, c.byUrl) +
        (c.site ? " / " + link(c.site, c.siteUrl) : "") +
        (c.license ? " (" + link(c.license, c.licenseUrl) + ")" : "");
    }).join(" &middot; ");
    var cap = el("figcaption");
    cap.innerHTML = (b.cap ? "<span>" + b.cap + "</span>" : "") +
      (credits ? '<span class="credit">' + credits + "</span>" : "");
    return cap;
  }

  /* One picture at the size of the screen, with its caption under it. A
     diagram is scaled up as a vector, so its smallest label is as sharp at
     full screen as its title; a photograph is shown at up to its own size.
     Escape, the close button, or a click on the dark closes it, and focus
     goes back to the picture it came from. */
  var zoomBack = null;
  function openFigZoom(im, b) {
    closeFigZoom();
    zoomBack = document.activeElement;
    var box = el("div", "rd-zoom");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", im.alt);
    var x = el("button", "rd-zoom-x", svg(I.close, true));
    x.type = "button";
    x.setAttribute("aria-label", "Close");
    var stage = el("div", "rd-zoom-stage");
    var big = document.createElement("img");
    big.src = im.src;
    big.alt = im.alt;
    if (im.fx && FIG_FX[im.fx]) big.classList.add("fx-" + im.fx);
    if (/\.svg(\?|$)/i.test(im.src) || b.diagram) {
      big.classList.add("vector");
      if (im.w && im.h) big.style.setProperty("--ar", String(im.w / im.h));
    }
    stage.appendChild(big);
    box.appendChild(x);
    box.appendChild(stage);
    if (b.cap) box.appendChild(el("p", "rd-zoom-cap", b.cap));
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target === stage || e.target.closest(".rd-zoom-x")) closeFigZoom();
    });
    document.body.appendChild(box);
    window.addEventListener("keydown", zoomKey, true);
    x.focus();
  }
  function zoomKey(e) {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    closeFigZoom();
  }
  function closeFigZoom() {
    var z = document.querySelector(".rd-zoom");
    if (!z) return;
    z.remove();
    window.removeEventListener("keydown", zoomKey, true);
    if (zoomBack && zoomBack.focus) zoomBack.focus();
    zoomBack = null;
  }

  /* Sources and further reading, set at reading size under the section.
     A reference in small grey type is a reference nobody follows. Kept out of
     the text that can be marked, like a figure's caption, so a book title
     cannot be tagged as a Claim. */
  function refsBlock(b) {
    var box = el("aside", "rd-refs");
    box.setAttribute("data-noread", "");
    box.appendChild(el("h3", null, esc(b.t || "Sources and further reading")));
    var ol = el("ol");
    b.items.forEach(function (r) {
      var li = el("li");
      var bits = [];
      if (r.by) bits.push(esc(r.by) + (r.year ? " (" + esc(r.year) + ")" : "") + ".");
      if (r.title) bits.push("<i>" + esc(r.title) + "</i>" + ".");
      if (r.pub) bits.push(esc(r.pub) + ".");
      li.innerHTML = bits.join(" ") +
        (r.url ? ' <a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">Open</a>' : "") +
        (r.note ? '<span class="rd-refs-note">' + esc(r.note) + "</span>" : "");
      ol.appendChild(li);
    });
    box.appendChild(ol);
    return box;
  }

  /* Words a reader may not have yet, said the way you would say them to a
     ten-year-old. Not the terms a section teaches — those are definitions —
     but the ordinary words the explanation leans on, so a reader who is
     missing one is not stopped by it. */
  function wordsBlock(b) {
    var box = el("div", "rd-words", "<b>Words to know</b>");
    var dl = el("dl");
    b.items.forEach(function (w) { dl.innerHTML += "<dt>" + esc(w[0]) + "</dt><dd>" + w[1] + "</dd>"; });
    box.appendChild(dl);
    return box;
  }

  /* Two kinds of card that leave the page: something to do with your hands,
     and a place the idea turns up outside the course. */
  var CALLOUT = {
    try: ["Try it", I.pen],
    world: ["In the real world", '<circle cx="12" cy="12" r="9"/><path d="M3.2 9.5h17.6M3.2 14.5h17.6"/>' +
            '<path d="M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/>']
  };
  function calloutBlock(b) {
    var k = CALLOUT[b.k];
    return el("aside", "rd-call " + b.k,
      "<span>" + svg(k[1], true) + k[0] + "</span><b>" + esc(b.t) + "</b><p>" + b.d + "</p>");
  }

  /* A common misconception, what the student thinks, and the specific
     intervention that corrects it. Shown as a callout so it cannot be
     skipped without being seen. */
  function misconBlock(b) {
    return el("aside", "rd-mcon",
      '<span>' + svg(I.alert, true) + "Common mistake</span>" +
      "<b>" + esc(b.t) + "</b>" +
      "<p class=\"why\">" + esc(b.d) + "</p>" +
      "<p>" + esc(b.i || "") + "</p>");
  }

  /* A concept from an earlier section the student is about to need again.
     Kept short enough to answer in thirty seconds. */
  function flashbackBlock(b) {
    return el("aside", "rd-fbk",
      '<span>' + svg(I.learn, true) + "Flashback</span>" +
      "<b>" + esc(b.t) + "</b>" +
      "<p>" + esc(b.d) + "</p>");
  }

  /* Claim, Evidence, Reasoning. The scaffolding the standards ask for,
     made visible so a student can see the shape of an argument before
     writing one. */
  function cerBlock(b) {
    var parts = b.items || [];
    var html = '<div class="rd-cer"><b>' + esc(b.t || "Claim, Evidence, Reasoning") + "</b>";
    parts.forEach(function (p) {
      html += '<div class="rd-cer-part"><span class="k">' + esc(p.k) +
              '</span><p>' + esc(p.d) + "</p></div>";
    });
    html += "</div>";
    return el("div", "rd-cer-wrap", html);
  }

  /* ------------------------------------------------------------- Motion
     A figure that moves, for a unit about movement. A still diagram can say
     that twos are choppier than ones; a moving one lets a student see it,
     and one they can switch themselves lets them find it out.

     The content file supplies the scene: draw(f, o, ghost) returns the SVG
     for the drawing that starts on frame f with options o, frames(o) the
     frames that start a new drawing (every other frame holds the one
     before), keys(o) which of those are key frames, back(o) what sits
     underneath. The reader supplies the clock, the controls and the strip of
     frames under the stage — a dark block for a key, a mid one for a new
     drawing, a pale one for a hold — which is where most of the teaching is.

     It plays only while it is on screen, and never by itself for a reader
     who has asked for less motion: for them it opens paused with every
     drawing showing, which is a diagram in its own right. Nothing flashes;
     the scenes move shapes, they never swap light for dark.

     b = { k: "motion", w, h, len, fps, alt, cap, credits,
           controls: [{ key, label, def, opts: [[value, label], …] }],
           frames(o), keys(o), back(o), draw(f, o, ghost) } */
  var MO_ICON = {
    pause: '<path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z"/>',
    prev: '<path d="M17 5.5 8.5 12l8.5 6.5z"/><path d="M5.5 5.5h2.2v13H5.5z"/>',
    next: '<path d="M7 5.5 15.5 12 7 18.5z"/><path d="M16.3 5.5h2.2v13h-2.2z"/>'
  };
  var moSeq = 0;
  function motionBlock(b) {
    var NS = "http://www.w3.org/2000/svg";
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var len = b.len, fps = b.fps || 24;
    var o = {};
    (b.controls || []).forEach(function (c) { o[c.key] = c.def != null ? c.def : c.opts[0][0]; });
    var st = { f: 0, playing: false, want: !reduced, onion: reduced, t0: 0, raf: 0, shown: -1 };
    var ds = [], keys = {};

    var fig = el("figure", "rd-fig rd-motion");
    var box = el("div", "rd-mo");
    var stage = el("div", "rd-mo-stage");
    var pic = document.createElementNS(NS, "svg");
    pic.setAttribute("viewBox", "0 0 " + b.w + " " + b.h);
    pic.setAttribute("role", "img");
    pic.setAttribute("aria-label", b.alt);
    pic.setAttribute("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif");
    var gBack = document.createElementNS(NS, "g");
    var gGhost = document.createElementNS(NS, "g");
    var gLive = document.createElementNS(NS, "g");
    gGhost.setAttribute("opacity", "0.32");
    pic.appendChild(gBack); pic.appendChild(gGhost); pic.appendChild(gLive);
    stage.appendChild(pic);
    var readout = el("span", "rd-mo-read");
    readout.setAttribute("aria-hidden", "true");
    stage.appendChild(readout);
    box.appendChild(stage);

    var strip = el("div", "rd-mo-strip");
    strip.setAttribute("aria-hidden", "true");
    var cells = [];
    for (var i = 0; i < len; i++) cells.push(strip.appendChild(el("i")));
    box.appendChild(strip);
    var legend = el("div", "rd-mo-legend",
      '<span><i class="k"></i>Key frame</span><span><i class="d"></i>New drawing</span><span><i></i>Held</span>');
    legend.setAttribute("aria-hidden", "true");
    box.appendChild(legend);

    var bar = el("div", "rd-mo-bar");
    function button(icon, label, fn) {
      var x = el("button", "rd-mo-btn", svg(icon));
      x.type = "button";
      x.setAttribute("aria-label", label);
      x.title = label;
      x.addEventListener("click", fn);
      return bar.appendChild(x);
    }
    button(MO_ICON.prev, "Previous drawing", function () { step(-1); });
    var bPlay = button(I.play, "Play", function () {
      st.want = !st.playing;
      if (st.want) play(); else pause();
    });
    bPlay.classList.add("main");
    button(MO_ICON.next, "Next drawing", function () { step(1); });
    var bOnion = bar.appendChild(el("button", "rd-mo-onion", "Show every drawing"));
    bOnion.type = "button";
    bOnion.addEventListener("click", function () { st.onion = !st.onion; ghosts(); sync(); });
    box.appendChild(bar);

    if (b.controls && b.controls.length) {
      var ctl = el("div", "rd-mo-ctl");
      b.controls.forEach(function (c) {
        var grp = el("div", "rd-mo-grp");
        var name = grp.appendChild(el("span", null, esc(c.label)));
        name.id = "mo" + (++moSeq);
        var seg = grp.appendChild(el("div", "rd-mo-seg"));
        seg.setAttribute("role", "group");
        seg.setAttribute("aria-labelledby", name.id);
        c.opts.forEach(function (op) {
          var x = seg.appendChild(el("button", null, esc(op[1])));
          x.type = "button";
          x.setAttribute("aria-pressed", String(o[c.key] === op[0]));
          x.addEventListener("click", function () {
            o[c.key] = op[0];
            [].forEach.call(seg.children, function (y) { y.setAttribute("aria-pressed", String(y === x)); });
            rebuild();
          });
        });
        ctl.appendChild(grp);
      });
      box.appendChild(ctl);
    }
    fig.appendChild(box);
    fig.appendChild(figCaption(b));

    function drawingAt(f) {
      var d = ds[0];
      for (var k = 0; k < ds.length && ds[k] <= f; k++) d = ds[k];
      return d;
    }
    function paint() {
      var d = drawingAt(st.f);
      if (d !== st.shown) { gLive.innerHTML = b.draw(d, o, false); st.shown = d; }
      cells.forEach(function (c, k) { c.classList.toggle("on", k === st.f); });
      readout.textContent = "Frame " + (st.f + 1) + " of " + len +
        " · drawing " + (ds.indexOf(d) + 1) + " of " + ds.length;
    }
    function ghosts() {
      gGhost.innerHTML = st.onion ? ds.map(function (d) { return b.draw(d, o, true); }).join("") : "";
    }
    function rebuild() {
      ds = b.frames ? b.frames(o) : cells.map(function (c, k) { return k; });
      keys = {};
      (b.keys ? b.keys(o) : []).forEach(function (k) { keys[k] = true; });
      gBack.innerHTML = b.back ? b.back(o) : "";
      cells.forEach(function (c, k) {
        c.className = ds.indexOf(k) < 0 ? "" : keys[k] ? "k" : "d";
      });
      st.shown = -1;
      ghosts();
      paint();
    }
    function sync() {
      bPlay.innerHTML = svg(st.playing ? MO_ICON.pause : I.play);
      bPlay.setAttribute("aria-label", st.playing ? "Pause" : "Play");
      bPlay.title = st.playing ? "Pause" : "Play";
      bOnion.setAttribute("aria-pressed", String(st.onion));
    }
    function tick(now) {
      if (!st.playing) return;
      if (!fig.isConnected) { pause(); return; }
      var f = Math.floor((now - st.t0) * fps / 1000) % len;
      if (f !== st.f) { st.f = f; paint(); }
      st.raf = requestAnimationFrame(tick);
    }
    function play() {
      if (st.playing) return;
      st.playing = true;
      st.t0 = performance.now() - st.f * 1000 / fps;
      st.raf = requestAnimationFrame(tick);
      sync();
    }
    function pause() {
      st.playing = false;
      cancelAnimationFrame(st.raf);
      sync();
    }
    function step(dir) {
      st.want = false;
      pause();
      var k = ds.indexOf(drawingAt(st.f));
      st.f = ds[(k + dir + ds.length) % ds.length];
      paint();
    }

    rebuild();
    sync();
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (seen) {
        if (!fig.isConnected) { io.disconnect(); pause(); return; }
        var on = seen[seen.length - 1].isIntersecting;
        if (on && st.want) play();
        else if (!on && st.playing) pause();
      }, { threshold: 0.35 });
      io.observe(fig);
    } else if (st.want) {
      play();
    }
    return fig;
  }

  /* ====================================================== Predict
     Three questions before the unit, and they are meant to be got wrong.

     A student who has already tried to answer something reads the passage
     that answers it differently — the gap is felt rather than described, and
     the objectives list at the top of a section describes it at best. Wrong
     predictions cost nothing in the model (see `pre` in learn.js); a right
     one is recorded as what it is, which is that they already knew.

     It runs once per unit and it is skippable. Seven phases of ceremony
     around a five-minute read is its own way of losing a reader.
   ========================================================================== */
  function predictable(r) {
    var set = SET(r.set);
    if (!set || !set.cards || !CN) return [];
    var all;
    try { all = CN.forSet(r.set, set.cards); } catch (e) { return []; }
    // Only concepts authored with a worked case can be asked at apply. A
    // pretest built out of definitions would be asking a student to recall
    // words nobody has shown them yet, which teaches nothing and reads as a
    // trick.
    return all.filter(function (c) {
      return c.apply && c.apply.ask && c.apply.opts && c.apply.opts.length > 1;
    });
  }

  function wantsPredict(r) {
    if (!R || !R.d) return false;
    if (R.d.pre && R.d.pre[r.key]) return false;         // already predicted
    if (doneIn(r) > 0) return false;                      // already reading
    return predictable(r).length >= 3;
  }

  function openPredict(r, then) {
    var pool = predictable(r);
    // Deterministic per unit rather than random: a student who reloads should
    // get the questions they walked away from, not three new ones.
    var picks = pool.slice(0, 3);
    var ix = 0, right = 0, asked = [];
    var store = new L.Store(S.me ? S.me.id : "anon", r.set);

    var v = $("#v-read");
    show("read");
    $("#wrap").classList.add("pd-on");
    noFoot();

    function done() {
      R.d.pre[r.key] = { right: right, of: picks.length, at: Date.now(), asked: asked };
      keep();
      then();
    }

    function draw() {
      var c = picks[ix];
      if (!c) return done();
      v.innerHTML = "";
      var wrap = el("div", "pd");

      var head = el("div", "pd-head");
      head.innerHTML = '<p class="eyebrow">Before you read</p>' +
        "<h1>What do you already think?</h1>" +
        "<p class=\"pd-say\">Three questions about Unit " + r.unit + ". You have not been taught " +
        "this yet, so being wrong is the point &mdash; it is what makes the reading land.</p>";
      wrap.appendChild(head);

      var step = el("div", "pd-step");
      step.innerHTML = "<span>" + (ix + 1) + " of " + picks.length + "</span>" +
        '<div class="track"><i style="width:' + Math.round(ix / picks.length * 100) + '%"></i></div>';
      wrap.appendChild(step);

      var card = el("div", "pd-card");
      card.appendChild(el("p", "pd-ask", esc(c.apply.ask)));
      var opts = el("div", "pd-opts");
      c.apply.opts.forEach(function (o, k) {
        var b = el("button");
        b.type = "button";
        b.textContent = o;
        b.addEventListener("click", function () { answer(c, k, card, opts); });
        opts.appendChild(b);
      });
      card.appendChild(opts);
      wrap.appendChild(card);

      var skip = el("button", "pd-skip");
      skip.type = "button";
      skip.textContent = "Skip this and start reading";
      skip.addEventListener("click", function () {
        // Skipping is recorded, so the end-of-unit screen does not claim a
        // gain against a baseline nobody set.
        R.d.pre[r.key] = { right: 0, of: 0, at: Date.now(), asked: [], skipped: true };
        keep();
        then();
      });
      wrap.appendChild(skip);

      v.appendChild(wrap);
      window.scrollTo(0, 0);
    }

    /* Confidence is asked before the verdict, never after. Asked afterwards
       it is a memory of how sure you were, which is a different and much
       kinder question than the one worth recording. */
    function answer(c, chose, card, opts) {
      [].forEach.call(opts.querySelectorAll("button"), function (b) { b.disabled = true; });
      var ok = chose === c.apply.right;

      var conf = el("div", "pd-conf");
      conf.innerHTML = "<b>Before the answer &mdash; how sure were you?</b>";
      var row = el("div", "pd-conf-row");
      [["Guessing", 0], ["Not sure", 1], ["Fairly sure", 2], ["Certain", 3]].forEach(function (x) {
        var b = el("button");
        b.type = "button";
        b.textContent = x[0];
        b.addEventListener("click", function () { verdict(c, ok, x[1], card); });
        row.appendChild(b);
      });
      conf.appendChild(row);
      card.appendChild(conf);
      conf.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function verdict(c, ok, confidence, card) {
      // A double-tap on a confidence button would otherwise grade twice and
      // then throw on the second pass, when the row it removes is already gone.
      var conf = card.querySelector(".pd-conf");
      if (!conf) return;
      conf.remove();
      store.grade(c.k, { level: "apply", right: ok, confidence: confidence, pre: true });
      asked.push(c.k);
      if (ok) right++;

      var box = el("div", "pd-verdict" + (ok ? " ok" : ""));
      box.innerHTML = "<b>" + (ok ? "You already knew that." : "Not yet &mdash; and that is fine.") +
        "</b><p>" + esc(c.apply.why || "") + "</p>" +
        (ok ? "" : '<p class="pd-watch">Watch for <em>' + esc(c.k) + "</em> as you read.</p>");
      var next = el("button", "pd-next");
      next.type = "button";
      next.textContent = ix === picks.length - 1 ? "Start reading" : "Next question";
      next.addEventListener("click", function () { ix++; draw(); });
      box.appendChild(next);
      card.appendChild(box);
      box.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    draw();
  }

  /* ========================================================== Challenges
     Problems solved by doing, one to a screen — see challenge.js. The
     reading is where an idea is met and the challenge is where it is used,
     so each lesson ends by offering its own, and the unit page lists them
     all with the mixed unit review. A lesson's challenge is at
     …/uN/lM/Challenge; the review at …/uN/Challenge. */
  var CH = window.OPLO_CHALLENGE || null;
  function hasChallenge(r, n) { return !!(CH && r && CH.has(r.key, n)); }
  function challengePath(r, ix) {
    var c = courseById(r.course);
    return (c ? coursePath(c) : slug(r.courseTitle)) + "/u" + r.unit +
      (ix === "review" ? "" : "/l" + (ix + 1)) + "/Challenge";
  }
  function openChallenge(r, ix, silent) {
    var review = ix === "review", sec = review ? null : r.sections[ix];
    if (!review && !sec) return;
    if (!silent) {
      enter("challenge:" + r.key + ":" + (review ? "review" : sec.n), review ? "Unit review" : sec.n,
            function () { openChallenge(r, ix, true); }, false, challengePath(r, ix));
    }
    var c = courseById(r.course);
    // Where to go next: the next lesson, then the review, then the unit.
    var after = [];
    if (!review && r.sections[ix + 1]) {
      var nx = r.sections[ix + 1];
      after.push({ label: "Read " + nx.n + " " + nx.t, go: function () { openRead(ix + 1, false, r.key); } });
    } else if (!review && hasChallenge(r, "review")) {
      after.push({ label: "Unit review", go: function () { openChallenge(r, "review"); } });
    }
    if (c) after.push({ label: "Unit " + r.unit + ": " + r.title, go: function () { openUnit(c, r.unit); } });
    var v = $("#v-challenge");
    v.innerHTML = "";
    CH.play(v, { reader: r.key, sec: review ? "review" : sec.n, me: S.me, after: after });
    noFoot(); progress(null);
    show("challenge");
  }
  var CH_ICON = '<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4"/><circle cx="12" cy="12" r="2.2"/>';
  function challengeCta(r, i) {
    var sec = r.sections[i], p = CH.progress(r.key, sec.n, S.me);
    var b = el("button", "chx-cta");
    b.type = "button";
    var state = !p.solved ? p.total + " problems · about " + Math.max(3, Math.round(p.total * 1.2)) + " minutes"
      : p.solved < p.total ? p.solved + " of " + p.total + " solved — pick up where you left off"
      : "Done · " + p.first + " of " + p.total + " first try — run it again any time";
    b.innerHTML = '<span class="chx-ico">' + svg(CH_ICON, true) + "</span>" +
      '<span class="chx-txt"><b>Challenge: use what you just read</b><span>' + esc(CH.blurb(r.key, sec.n) || "") +
      "</span><span>" + esc(state) + "</span></span>" +
      '<span class="chx-go">' + svg(I.arrow, true) + "</span>";
    b.addEventListener("click", function () { openChallenge(r, i); });
    return b;
  }
  function challengeBlock(r) {
    var box = el("div", "lx-block");
    box.appendChild(el("h2", null, "Challenges"));
    var list = el("div", "chx-list");
    r.sections.forEach(function (sec, k) {
      if (!hasChallenge(r, sec.n)) return;
      var p = CH.progress(r.key, sec.n, S.me);
      var b = el("button", "chx");
      b.type = "button";
      var bar = "";
      for (var j = 0; j < p.total; j++) bar += "<i" + (j < p.first ? ' class="first"' : j < p.solved ? ' class="helped"' : "") + "></i>";
      b.innerHTML = '<span class="chx-n">' + esc(sec.n) + " · " + p.total + " problems</span>" +
        '<span class="chx-t">' + esc(sec.t) + "</span>" +
        '<span class="chx-s">' + esc(!p.solved ? "Not started" : p.solved < p.total ? p.solved + " of " + p.total + " solved"
          : "Done · " + p.first + " first try") + "</span>" +
        '<span class="chx-bar" aria-hidden="true">' + bar + "</span>";
      b.addEventListener("click", function () { openChallenge(r, k); });
      list.appendChild(b);
    });
    var rv = el("button", "chx review");
    rv.type = "button";
    rv.innerHTML = '<span class="chx-n">Unit review</span><span class="chx-t">Mixed from every lesson</span>' +
      '<span class="chx-s">The ones you needed help with come first.</span>';
    rv.addEventListener("click", function () { openChallenge(r, "review"); });
    list.appendChild(rv);
    box.appendChild(list);
    return box;
  }

  function openRead(i, silent, rkey) {
    if (rkey && READERS[rkey]) useReader(READERS[rkey]);
    var r = RU;
    var sec = sectionAt(i);
    if (!sec) return;
    // The prediction gates the unit, not the section: once through it, the
    // reader opens where it was going anyway.
    if (wantsPredict(r)) { openPredict(r, function () { openRead(i, silent, rkey); }); return; }
    $("#wrap").classList.remove("pd-on");
    if (!silent) enter("read:" + sec.n, sec.n, function () { openRead(i, true, r.key); }, false, readPath(r, i));
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
        var depthBadge = b.depth
          ? ' <span class="rd-depth" data-depth="' + esc(b.depth) + '">' + esc(b.depth) + '</span>'
          : "";
        body.appendChild(el("div", "rd-def", "<b>" + esc(b.t) + "</b>" + depthBadge + "<p>" + b.d + "</p>" +
          (b.p ? '<p class="plain"><span>In plain words</span>' + b.p + "</p>" : "")));
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
      } else if (b.k === "fig") {
        body.appendChild(figureBlock(b));
      } else if (b.k === "refs") {
        body.appendChild(refsBlock(b));
      } else if (b.k === "words") {
        body.appendChild(wordsBlock(b));
      }       else if (b.k === "try" || b.k === "world") {
        body.appendChild(calloutBlock(b));
      } else if (b.k === "motion") {
        body.appendChild(motionBlock(b));
      } else if (b.k === "mcon") {
        body.appendChild(misconBlock(b));
      } else if (b.k === "fbk") {
        body.appendChild(flashbackBlock(b));
      } else if (b.k === "cer") {
        body.appendChild(cerBlock(b));
      }
    });
    art.appendChild(body);

    /* The authored check no longer sits here. It used to close the article
       with its own answer four inches above it, which asks a student to
       recognise rather than to recall — and the difference between those two
       is most of what this product is for. It is the last card on the
       retrieval screen now. */
    var next = el("div", "rd-next");
    var marked = Ann.all().filter(function (m) { return m.sec === sec.n && !m.by; }).length;
    // A boundary already started is resumed, not restarted: the answers given
    // before a look back at the text are the ones that count.
    var flight = rtBag()[rtKey(r, sec)];
    var inFlight = !!(flight && !flight.done);
    next.innerHTML = '<div><span class="t">' + (inFlight ? "Part-way through" : "Finished reading?") +
      "</span><b>" +
      (inFlight ? "Your questions on this section are waiting"
        : marked ? "Close the section without the page" : "Answer one question on this section") +
      '</b><p class="why">' +
      (inFlight ? "Answers you have already given are kept."
        : marked ? "What you marked, asked back — the article will not be on screen."
        : "You have not marked anything here. Marking as you read is what the questions are made of.") +
      "</p></div>";
    var nb = el("button", "lx-btn", inFlight ? "Back to the questions" : "Continue");
    nb.type = "button";
    nb.addEventListener("click", function () { openRetrieve(sec, i); });
    next.appendChild(nb);
    art.appendChild(next);
    if (hasChallenge(r, sec.n)) art.appendChild(challengeCta(r, i));

    three.appendChild(unitRail(i));
    three.appendChild(art);

    var margin = el("aside", "rd-margin");
    margin.innerHTML = '<div class="mg-head"></div><div class="mg-wrap"></div>';
    three.appendChild(margin);

    v.appendChild(three);

    noFoot(); progress(null);
    show("read");
    Ann.arm(body, sec.n, art, margin);
    // Checks sit in the same margin as the notes, level with their passages.
    if (window.OPLO_CHECKS) {
      window.OPLO_CHECKS.arm({ reader: r.key, sec: sec.n, body: body, art: art, margin: margin, me: S.me });
    }
    // Arrived from a retrieval card to look back. The answer was committed
    // before this was offered, so looking is feedback now rather than a way
    // round the question — and the questions wait where they were left.
    var rv = S.rtReview;
    S.rtReview = null;
    if (rv && rv.key === rtKey(r, sec)) {
      var banner = el("div", "rd-review");
      banner.innerHTML = "<p><b>Looking back at " + esc(sec.n) + ".</b> Your answers so far are kept.</p>";
      var resume = el("button", "lx-btn", "Back to the questions");
      resume.type = "button";
      resume.addEventListener("click", function () { openRetrieve(sec, i); });
      banner.appendChild(resume);
      art.insertBefore(banner, art.firstChild);
      if (rv.mark) {
        var sel = 'mark[data-id="' + (window.CSS && CSS.escape ? CSS.escape(rv.mark) : rv.mark) + '"]';
        var lit = body.querySelectorAll(sel);
        [].forEach.call(lit, function (x) { x.classList.add("rt-flash"); });
        if (lit.length) setTimeout(function () {
          lit[0].scrollIntoView({ block: "center", behavior: "smooth" });
        }, 60);
      }
    }
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

  /* What the reading looks like per section, by pass rather than as a total.
     Six counts say something a single number cannot: four terms and nothing
     else is a vocabulary pass, and the rail should be able to show that
     without the student opening the section to find out. */
  function railCounts(list) {
    list = list || document.querySelector(".rd-toc");
    if (!list) return;
    var all = Ann.all();
    [].forEach.call(list.querySelectorAll("button[data-sec]"), function (b) {
      var slot = b.querySelector(".dots");
      if (!slot) return;
      var here = all.filter(function (m) { return m.sec === b.dataset.sec; });
      if (!here.length) { slot.innerHTML = ""; return; }
      var html = "";
      A.PASSES.forEach(function (p) {
        var n = here.filter(function (m) { return m.pass === p.n; }).length;
        // A pass with nothing in it draws nothing. Six grey slots on every
        // row would be a chart of what the student has not done.
        if (n) html += '<i style="background:' + p.hue + '" title="' + esc(p.name) +
                       ': ' + n + '">' + (n > 1 ? n : "") + "</i>";
      });
      slot.innerHTML = html;
    });
  }
  S.railCounts = function () { railCounts(); };

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
      b.dataset.sec = x.n;
      b.setAttribute("aria-current", String(k === i));
      b.innerHTML = '<span class="n">' + esc(x.n) + "</span><span class=\"t\">" + esc(x.t) + "</span>" +
        '<span class="dots"></span>' +
        (S.readDone[x.n] ? '<span class="tick">' + svg(I.tick, true) + "</span>" : "");
      b.addEventListener("click", function () { openRead(k); });
      list.appendChild(b);
    });
    toc.appendChild(list);
    railCounts(list);

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

  /* ====================================================== Retrieve
     The section boundary, with the text gone.

     A check sitting at the foot of the article is answered by looking up. The
     answer is four inches above it, and a student who scrolls back has learned
     that scrolling back works. So this is a screen and not a block: the
     article is not on it, and the only way to answer is to have kept
     something.

     The questions are cued by what this student marked, and the prompts were
     already written — every pass in annotate.js carries an `ask`. Marking a
     sentence as Evidence and then being asked which claim it supports is the
     same intellectual act the taxonomy was built around, a few minutes later
     and without the page.

     What the engine gets out of it is the part that was missing: reading has
     never moved a dimension or set a review date. Now a section ends in real
     `grade()` calls, and retention starts its clock.
   ========================================================================== */
  function unitConcepts(r) {
    var set = SET(r.set);
    if (!set || !set.cards || !CN) return [];
    try { return CN.forSet(r.set, set.cards); } catch (e) { return []; }
  }

  /* The concept a marked sentence is about, if the unit knows one. Longest
     match wins, so a sentence containing both "lens" and "telephoto lens" is
     about the telephoto lens. */
  function conceptFor(text, pool) {
    var t = " " + norm(text) + " ", best = null;
    pool.forEach(function (c) {
      var k = norm(c.k);
      if (!k) return;
      if (t.indexOf(" " + k + " ") > -1 || t.indexOf(" " + k + "s ") > -1) {
        if (!best || k.length > norm(best.k).length) best = c;
      }
    });
    return best;
  }

  /* Which marks to ask about. Weighted by how hard the mark was to make — an
     objection is worth more than an underlined term, and annotate.js already
     says so — then by whether it lands on something gradeable, then by
     whether the student wrote anything beside it. */
  function retrievalCards(sec, r) {
    var pool = unitConcepts(r);
    var mine = Ann.all().filter(function (m) { return m.sec === sec.n && !m.by; });
    var seen = {};
    var scored = [];
    mine.forEach(function (m) {
      var c = conceptFor(m.text, pool);
      // One question per concept. Three questions about aperture because it
      // was marked three times is a worse minute than three about three things.
      if (c && seen[c.k]) return;
      if (c) seen[c.k] = true;
      var p = A.pass(m.pass);
      scored.push({ mark: m, pass: p, concept: c,
                    w: p.weight * 2 + (c && c.say ? 3 : 0) + (m.note ? 1 : 0) });
    });
    scored.sort(function (a, b) { return b.w - a.w; });
    return scored.slice(0, 3);
  }

  /* Where a section boundary has got to. Kept in the record, because leaving
     this screen — Back, the rail, a reload — and returning through Continue
     used to rebuild the cards and grade every answer again, after the student
     had been free to reread the passage in between. The first answer is the
     one that counts, and this state is what makes that true. */
  function rtBag() {
    if (R && R.d) return R.d.rt || (R.d.rt = {});
    return S.rtBag || (S.rtBag = {});
  }
  function rtKey(r, sec) { return r.key + ":" + sec.n; }

  function openRetrieve(sec, i) {
    var r = RU;
    enter("questions:" + sec.n, "Questions", function () { openRetrieve(sec, i); }, false,
          readPath(r, i) + "/Questions");
    var key = rtKey(r, sec);
    var bag = rtBag();
    var st = (bag[key] && !bag[key].done) ? bag[key]
           : (bag[key] = { cards: {}, check: null, at: Date.now() });
    var pool = unitConcepts(r);
    var store = new L.Store(S.me ? S.me.id : "anon", r.set);
    var v = $("#v-read");

    // The selection is frozen the first time the screen opens. A mark made
    // while looking back at the passage must not reshuffle the questions, or
    // an answered card could quietly be swapped for a fresh one.
    var cards;
    if (st.ids) {
      cards = st.ids.map(function (id) {
        var m = Ann.all().filter(function (x) { return x.id === id; })[0];
        return m ? { mark: m, pass: A.pass(m.pass), concept: conceptFor(m.text, pool) } : null;
      }).filter(Boolean);
    } else {
      cards = retrievalCards(sec, r);
      st.ids = cards.map(function (c) { return c.mark.id; });
      keep();
    }

    function stateOf(card) { return st.cards[card.mark.id] || (st.cards[card.mark.id] = {}); }
    function current() {
      for (var k = 0; k < cards.length; k++) if (!stateOf(cards[k]).closed) return k;
      return cards.length;
    }

    function finish() {
      // Done is done whether or not every answer was right. The section was
      // read and recalled from; a wrong answer is information, not a gate.
      S.readDone[sec.n] = true;
      // Closed, not deleted: a dated marker, so another device's copy of this
      // boundary, still open there, cannot come back through a merge.
      bag[key] = { done: true, at: Date.now() };
      keep();
      var pct = Math.round(doneIn(r) / r.sections.length * 100);
      var course = allCourses().filter(function (x) { return x.id === r.course; })[0] || D.MEDIA;
      raise(course, r.unit, "u", pct);
      var nxt = sectionAt(i + 1);
      if (nxt) openRead(i + 1); else openSet(r.set);
    }

    /* Looking back is offered only once an answer is committed. Before that
       it is a way round the question; after, it is the feedback. The state
       survives the trip, so returning resumes rather than restarts. */
    function lookButton(markId) {
      var b = el("button", "rt-look", "Show me in the text");
      b.type = "button";
      b.addEventListener("click", function () {
        S.rtReview = { key: key, mark: markId || null };
        openRead(i, false, r.key);
      });
      return b;
    }
    function nextButton(label, then) {
      var b = el("button", "rt-next", label);
      b.type = "button";
      b.addEventListener("click", then);
      return b;
    }

    function draw() {
      var ix = current();
      var total = cards.length + (sec.check ? 1 : 0);
      if (ix >= cards.length && (!sec.check || (st.check && st.check.closed))) { finish(); return; }

      v.innerHTML = "";
      var three = el("div", "rd-three");
      three.appendChild(unitRail(i));

      var mid = el("div", "rt");
      var head = el("div", "rt-head");
      head.innerHTML = '<p class="eyebrow">' + esc(sec.n) + " &middot; without the page</p>" +
        "<h1>" + esc(sec.t) + "</h1>" +
        '<p class="rt-say">' + (cards.length
          ? "What you marked, asked back. Answer from memory &mdash; the passage comes back after you do."
          : "You did not mark anything in this section, so there is nothing of yours to ask about. " +
            "One question from the section itself instead.") + "</p>";
      mid.appendChild(head);

      var step = el("div", "rt-step");
      step.innerHTML = "<span>" + (ix + 1) + " of " + total + "</span>" +
        '<div class="track"><i style="width:' + Math.round(ix / total * 100) + '%"></i></div>';
      mid.appendChild(step);

      var margin = el("aside", "rd-margin rt-margin");
      margin.innerHTML = '<div class="mg-head"><b>Your mark</b><span>shown after you answer</span></div>' +
                         '<div class="mg-wrap"></div>';

      mid.appendChild(ix < cards.length ? markCard(cards[ix], margin) : finalCheck(margin));
      three.appendChild(mid);
      three.appendChild(margin);
      v.appendChild(three);
      noFoot(); progress(null); show("read");
      $("#wrap").classList.remove("pd-on");
      window.scrollTo(0, 0);
    }

    /* One mark, asked with the prompt its own pass carries, and drawn from
       its state every time — so a card returned to after a look at the text
       shows the answer that was given rather than taking a second one. */
    function markCard(card, margin) {
      var p = card.pass, c = card.concept, cs = stateOf(card);
      var scored = !!(c && c.say && c.say.length);
      var box = el("div", "rt-card");
      box.innerHTML = '<p class="rt-kind"><i style="background:' + p.hue + '"></i>' +
        "You marked something here as <b>" + esc(p.name) + "</b></p>" +
        '<p class="rt-ask">' + esc(p.ask) + "</p>";
      var slot = el("div");
      box.appendChild(slot);
      var close = function () { cs.closed = true; keep(); draw(); };

      // The passage comes back only once there is an answer. Before that it
      // would be the answer, sitting beside the question.
      function reveal(missed) {
        var says = "";
        if (missed && c) {
          var def = null;
          r.sections.forEach(function (x) {
            (x.body || []).forEach(function (b) {
              if (!def && b.k === "def" && norm(b.t) === norm(c.k)) def = b;
            });
          });
          if (def) says = '<div class="rt-says"><span>What the unit says</span><b>' + esc(def.t) +
                          "</b><p>" + def.d + "</p></div>";
        }
        margin.querySelector(".mg-head").innerHTML = "<b>Your mark</b><span>" + esc(p.name) + "</span>";
        margin.querySelector(".mg-wrap").innerHTML =
          '<div class="mg rt-shown" style="border-left-color:' + p.hue + '">' +
          "<p>&ldquo;" + esc(card.mark.text) + "&rdquo;</p>" +
          (card.mark.note ? "<span>Your note: " + esc(card.mark.note) + "</span>" : "") +
          "</div>" + says;
      }

      function actions(withLook) {
        var a = el("div", "rt-actions");
        a.appendChild(nextButton("Next", close));
        if (withLook) a.appendChild(lookButton(card.mark.id));
        return a;
      }

      /* ------------------------------------------------------------ Repair
         Phase four. A miss names the mistake the concept already carries and
         what to think instead. Not "the one you hold" — a keyword match cannot
         know that — but "the usual mistake", which is what the data can
         honestly claim. A confident miss is framed as what it is: a belief
         rather than a gap, and one the engine now brings back in minutes. */
      function repair(first) {
        var box = el("div", "rt-repair");
        if (first.conf >= 3) {
          box.insertAdjacentHTML("beforeend", '<div class="rt-flag"><b>You were certain.</b> ' +
            "That makes this a belief rather than a gap &mdash; the kind worth fixing now, before it " +
            "is rehearsed. It will come back in minutes, not days.</div>");
        }
        var m = (c.miss || [])[0];
        if (m) {
          box.insertAdjacentHTML("beforeend",
            '<div class="rt-belief"><span>The usual mistake</span><p>' + esc(m[0]) + "</p></div>" +
            '<div class="rt-instead"><span>What to think instead</span><p>' + esc(m[1]) + "</p></div>");
        }
        return box;
      }

      /* The second attempt is at a different level: the idea used on a case,
         not the correction repeated back. It is graded with a hint counted,
         because the correction was help, and help caps what an answer can
         prove. */
      function again() {
        var wrap = el("div", "rt-again");
        var q = c.apply;
        if (!q || !q.opts || !q.opts.length) { wrap.appendChild(actions(true)); return wrap; }
        wrap.innerHTML = '<p class="rt-kind"><i style="background:var(--ink-3)"></i>Now use it</p>' +
          '<p class="rt-q">' + esc(q.ask) + "</p>";
        var opts = el("div", "lx-opts");
        q.opts.forEach(function (o, j) {
          var b = el("button", "lx-opt");
          b.type = "button";
          b.innerHTML = '<span class="lx-key">' + "ABCD"[j] + "</span><span>" + esc(o) + "</span>";
          if (cs.second) {
            b.disabled = true;
            if (j === q.right) b.classList.add("right");
            else if (j === cs.second.chose) b.classList.add("wrong");
          } else {
            b.addEventListener("click", function () {
              if (cs.second) return;                      // a double tap grades once
              var ok = j === q.right;
              store.grade(c.k, { level: "apply", right: ok, hints: 1 }, Date.now());
              cs.second = { chose: j, ok: ok };
              keep();
              paint();
            });
          }
          opts.appendChild(b);
        });
        wrap.appendChild(opts);
        if (cs.second) {
          var ok2 = cs.second.ok;
          wrap.insertAdjacentHTML("beforeend", '<div class="rt-verdict ' + (ok2 ? "ok" : "") + '"><b>' +
            (ok2 ? (cs.first.conf >= 3 ? "You changed your mind." : "Now it holds.")
                 : "Still not there. That is recorded, and this concept comes back sooner because of it.") +
            "</b><p>" + esc(q.why || "") + "</p></div>");
          wrap.appendChild(actions(true));
        }
        return wrap;
      }

      function paint() {
        slot.innerHTML = "";

        // Nothing written yet: the question, and nowhere to look.
        if (!cs.text) {
          var f = el("form", "rt-form");
          var ta = el("textarea");
          ta.rows = 4;
          ta.placeholder = "From memory. A sentence or two is plenty.";
          ta.setAttribute("aria-label", p.ask);
          var send = el("button", "rt-send", "Answer");
          send.type = "submit";
          f.appendChild(ta); f.appendChild(send);
          f.addEventListener("submit", function (e) {
            e.preventDefault();
            var txt = ta.value.trim();
            if (!txt || cs.text) return;
            cs.text = txt;
            if (!scored) cs.first = { scored: false };
            keep();
            paint();
          });
          slot.appendChild(f);
          return;
        }

        slot.insertAdjacentHTML("beforeend", '<div class="rt-said"><span>You wrote</span>' +
          esc(cs.text) + "</div>");

        // Written and scoreable: how sure, before the verdict. Asked after, it
        // is a memory of confidence — a kinder question, and a less useful one.
        if (!cs.first) {
          var conf = el("div", "rt-conf");
          conf.innerHTML = "<b>Before the answer &mdash; how sure are you?</b>";
          var row = el("div", "rt-conf-row");
          [["Guessing", 0], ["Not sure", 1], ["Fairly sure", 2], ["Certain", 3]].forEach(function (x) {
            var b = el("button", null, x[0]);
            b.type = "button";
            b.addEventListener("click", function () {
              if (cs.first) return;                       // a double tap grades once
              var d = scoreExplanation(cs.text, c.say);
              store.grade(c.k, { level: "explain", right: d.ok, hints: 0, confidence: x[1] }, Date.now());
              cs.first = { scored: true, ok: d.ok, conf: x[1], hit: d.hit, miss: d.miss };
              keep();
              paint();
              var last = slot.lastElementChild;
              if (last) last.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
            row.appendChild(b);
          });
          conf.appendChild(row);
          slot.appendChild(conf);
          return;
        }

        var first = cs.first;
        reveal(first.scored && !first.ok);

        // Nothing here can score it, and saying so beats inventing a number.
        if (!first.scored) {
          slot.insertAdjacentHTML("beforeend", '<div class="rt-verdict"><b>Compare.</b>' +
            "<p>Nothing here scores this one &mdash; it is your sentence, not a term the unit " +
            "defines. Read what you marked against what you just wrote.</p></div>");
          slot.appendChild(actions(true));
          return;
        }

        var reach = "<p>You reached <em>" + first.hit.length + " of " + c.say.length +
          "</em> of the things a full answer covers" +
          (first.miss.length ? ", and did not reach <em>" + first.miss.map(esc).join(", ") + "</em>" : "") +
          ".</p>";

        if (first.ok) {
          slot.insertAdjacentHTML("beforeend", '<div class="rt-verdict ok"><b>That holds.</b>' + reach + "</div>");
          slot.appendChild(actions(true));
          return;
        }

        slot.insertAdjacentHTML("beforeend", '<div class="rt-verdict"><b>' +
          (first.hit.length ? "Partly." : "Not yet.") + "</b>" + reach + "</div>");
        slot.appendChild(repair(first));
        slot.appendChild(again());
      }

      paint();
      return box;
    }

    /* The section's authored question, last. Answered once: coming back to it
       after a look at the text shows the answer given, not a fresh chance. */
    function finalCheck(margin) {
      var c = sec.check, cs = st.check;
      margin.querySelector(".mg-head").innerHTML = "<b>From the section</b><span>not one of your marks</span>";
      var box = el("div", "rt-card");
      box.innerHTML = '<p class="rt-kind"><i style="background:var(--ink-3)"></i>From the section</p>' +
        '<p class="rt-ask">' + esc(c.q) + "</p>";
      var wrap = el("div", "lx-opts");
      c.opts.forEach(function (o, j) {
        var b = el("button", "lx-opt");
        b.type = "button";
        b.innerHTML = '<span class="lx-key">' + "ABCD"[j] + "</span><span>" + esc(o) + "</span>";
        if (cs) {
          b.disabled = true;
          if (j === c.right) b.classList.add("right");
          else if (j === cs.chose) b.classList.add("wrong");
        } else {
          b.addEventListener("click", function () {
            if (st.check) return;
            var ok = j === c.right;
            var course = allCourses().filter(function (x) { return x.id === r.course; })[0] || D.MEDIA;
            var pct = Math.round(doneIn(r) / r.sections.length * 100);
            if (ok) raise(course, r.unit, "p", pct);
            else slip("problem", "u" + r.unit + ":" + sec.n, sec.t,
                      "Missed the check in section " + sec.n + ".");
            st.check = { chose: j, ok: ok };
            keep();
            draw();
          });
        }
        wrap.appendChild(b);
      });
      box.appendChild(wrap);
      if (cs) {
        box.insertAdjacentHTML("beforeend", '<div class="rt-verdict ' + (cs.ok ? "ok" : "") + '"><b>' +
          (cs.ok ? "That's it." : "Not quite.") + "</b><p>" + c.why + "</p></div>");
        var a = el("div", "rt-actions");
        a.appendChild(nextButton(sectionAt(i + 1) ? "Next section" : "Study the terms",
          function () { st.check.closed = true; keep(); draw(); }));
        a.appendChild(lookButton(null));
        box.appendChild(a);
      }
      return box;
    }

    draw();
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
    if (!silent) enter("notes", "Notebook", function () { openNotebook(true); }, false, "Notebook");
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
          function () { startPractice(true); }, again, coursePath(S.course) + "/u" + S.unitIx + "/Practice");
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
  /* Where this account is signed in — each browser, when it was last used,
     and one button to sign out of all the others. The label is read from the
     browser's own user-agent; the whole string is kept in the tooltip. */
  function accountDevices(v) {
    v.appendChild(el("h2", "lx-h2", "Where you’re signed in"));
    var box = el("div", "cx-set");
    box.appendChild(el("div", "cx-setrow", '<span class="t"><span>Reading it from the server…</span></span>'));
    v.appendChild(box);
    if (!API.sessions) return;
    function uaName(ua) {
      ua = String(ua || "");
      var b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "A browser";
      var o = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Mac OS X|Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /CrOS/.test(ua) ? "Chromebook" : /Linux/.test(ua) ? "Linux" : "";
      return b + (o ? " on " + o : "");
    }
    function draw() {
      API.sessions().then(function (list) {
        box.innerHTML = "";
        list.sort(function (a, b) { return (b.current ? 1 : 0) - (a.current ? 1 : 0) || (b.lastSeenAt || 0) - (a.lastSeenAt || 0); });
        list.forEach(function (s) {
          var r = el("div", "cx-setrow");
          r.title = s.userAgent || "";
          r.innerHTML = '<span class="ic" style="--c:' + (s.current ? "var(--cx-accent)" : "var(--cx-gray)") + '">' + cxIcon("server") + "</span>" +
            '<span class="t"><b>' + esc(uaName(s.userAgent)) + "</b><span>" +
            (s.current ? "This browser" : "Last used " + esc(whenName(s.lastSeenAt || s.createdAt))) +
            " · signed in " + esc(dayName(s.createdAt)) + "</span></span>" +
            '<span class="v">' + (s.current ? '<span class="cx-pill blue">This one</span>' : "") + "</span>";
          box.appendChild(r);
        });
        var others = list.filter(function (s) { return !s.current; }).length;
        var foot = el("div", "cx-setrow");
        foot.innerHTML = '<span></span><span class="t"><span>' + (others ? others + (others === 1 ? " other session." : " other sessions.") :
          "Nowhere else.") + "</span></span>";
        var out = el("button", "cn-btn small", "Sign out everywhere else");
        out.type = "button";
        out.disabled = !others;
        out.addEventListener("click", function () {
          out.disabled = true;
          API.revokeSessions().then(function () { toast("Signed out everywhere else."); draw(); },
                                    function (e) { out.disabled = false; toast(e.message || "That did not work."); });
        });
        var vv = el("span", "v");
        vv.appendChild(out);
        foot.appendChild(vv);
        box.appendChild(foot);
      }, function () {
        box.innerHTML = '<div class="cx-setrow"><span></span><span class="t"><span>Could not be read from the server.</span></span></div>';
      });
    }
    draw();
  }

  function openAccount(silent) {
    if (!silent) enter("account", "Account", function () { openAccount(true); }, false, "Account");
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

    /* Staff who are not also studying have no standing, grades or courses
       of their own to show; their account is who they are, where they are
       signed in, and their password. */
    var learner = !(S.me.role === "admin" || S.me.role === "teacher") || enrolled().length > 0;
    if (!learner) accountDevices(v);
    if (learner) {
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

    /* ---- Progress ----------------------------------------------------- */
    v.appendChild(el("h2", "lx-h2", "Progress"));
    var syncLine = el("p", "lx-lede");
    syncLine.id = "acSync";
    v.appendChild(syncLine);
    paintSync();
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
    var next = field("New password", "");
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
          function () { openMyGrades(summary, all); }, false, "Account");
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

  /* The Grades tab is a gradebook: every class, every assignment, the
     what-if calculator, the report card (gradebook.js). The path to
     graduation is its last tab, drawn here as it always was. */
  function openGrades(silent, at) {
    root("grades", "Grades", function () { openGrades(true); }, "Grades");
    var v = $("#v-grades");
    v.innerHTML = "";
    noFoot(); progress(null);
    show("grades");
    if (!window.OPLO_GRADEBOOK) { openGraduation(v); return; }
    var GB = window.OPLO_GRADEBOOK;
    GB.mount(v, {
      me: S.me || {}, toast: toast, at: at,
      graduation: function (host) { drawGraduation(host, function () { openGrades(true, ["Plan"]); }); },
      /* A place inside the gradebook — a class, a past year, the plan — is a
         step in the app's history with its own address, so Back, the bar's
         back button and a refresh all land where the student expects. */
      go: function (segs, label, replace) {
        enter("grades:" + segs.join("/"), label, function () {
          show("grades"); noFoot(); progress(null);
          if (!GB.view(segs)) openGrades(true, segs);
        }, replace, ["Grades"].concat(segs).join("/"));
      },
      back: function () { if (S.hist.length) goBack(); else openGrades(true); }
    });
  }

  function openGraduation(v) {
    v.appendChild(el("p", "lx-eyebrow", "Grades" + (S.me ? " · " + esc(S.me.name) : "")));
    v.appendChild(el("h1", "lx-h1", "Your path to graduation"));
    drawGraduation(v, function () { openGrades(true); });
  }

  function drawGraduation(v, again) {
    var host = el("div", "gr");
    v.appendChild(host);
    var wait = el("div", "admin-loading", "Reading your record…");
    host.appendChild(wait);
    Promise.all([API.graduation.get(), planLoad()]).then(function (out) {
      wait.remove();
      drawGrades(host, out[0], null, { canCommit: true, plan: out[1], again: again });
    }, function (e) { failed(wait, e, again); });
  }

  /* ---------------------------------------------------------------- Exams
     The tab belongs to the assessment runtime (exam.js): it lists what this
     student has been set, runs a sitting and keeps the work safe. This only
     gives it the screen. */
  function openExams(silent) {
    if (!silent) root("exams", "Exams", function () { openExams(true); }, "Exams");
    noFoot(); progress(null);
    show("exams");
    if (window.OPLO_EXAM) window.OPLO_EXAM.hub($("#v-exams"), S.me);
  }

  /* `empty` is what to say when there is nothing yet. The student is spoken to
     in the second person; the Console, looking at somebody else, passes its own. */
  function drawGrades(host, g, empty, opts) {
    opts = opts || {};
    var none = empty ||
      "Nothing on your record yet. When your school adds your previous transcript, or your " +
      "teachers enter grades, your path to graduation appears here.";
    /* The server always sends a dashboard, even an empty one — but a screen
       that throws shows a student nothing at all, with no way to tell whether
       their record is empty or the page is broken. The empty state already
       has the right words; this is what lets it reach them. */
    if (!g || !g.totals || !g.current) { host.appendChild(el("div", "lx-empty", none)); return; }
    var ehsCount = g.ehs ? g.ehs.count : 0;
    if (!g.transfer && !g.current.length && !g.totals.earned && !ehsCount) {
      host.appendChild(el("div", "lx-empty", none));
      return;
    }
    /* The order is the order a student's questions come in: how far am I, what
       is the one thing to do, what does every credit look like, how have I
       been doing, when does it end — and last, the record itself, laid out the
       way EHS lays it out, so the page and the paper can be read side by side. */
    host.appendChild(gradHero(g));
    if (g.focus) host.appendChild(gradFocus(g, opts));
    host.appendChild(gradKpis(g));
    host.appendChild(gradMap(g));
    if (g.years && g.years.length) host.appendChild(gradJourney(g));
    if (g.marks && g.marks.length) host.appendChild(gradMarks(g));
    if (g.pace && g.totals.planAtEhs > 0) host.appendChild(gradPlan(g));
    if (g.risk) host.appendChild(gradRisk(g, opts));
    if (g.checks && g.checks.length) host.appendChild(gradChecks(g));
    if (g.transfer && g.transfer.status !== "evaluated") host.appendChild(gradTransfer(g));
    if (g.board && g.exams.length) host.appendChild(gradPathway(g));
    if (g.exams.length || (g.stateTests || []).length) host.appendChild(gradExams(g));
    host.appendChild(gradCurrent(g));
    if (g.courses.length || ehsCount) host.appendChild(gradRecord(g));
    host.appendChild(gradBadges(g));
    host.appendChild(gradNotes(g));
  }

  /* ------------------------------------------------------- Shared pieces */
  function grYear(y) {
    var m = String(y || "").match(/^(\d{4})\D+(\d{2,4})$/);
    return m ? m[1] + "–" + m[2].slice(-2) : String(y || "");
  }
  function grYY(y) {
    var m = String(y || "").match(/^(\d{4})\D+(\d{2,4})$/);
    return m ? m[1].slice(2) + "/" + m[2].slice(-2) : String(y || "");
  }
  /* A credit printed the way a record prints it — 4.0, 0.5, 19.0 — and a
     converted fragment like 0.125 as itself rather than rounded away. */
  function grFixed(x) {
    var v = Math.round(Number(x || 0) * 1000) / 1000;
    return Math.abs(v * 2 - Math.round(v * 2)) < 1e-9 ? v.toFixed(1) : String(v);
  }
  function grCredits(x) { return grFixed(x) + (Math.abs(Number(x) - 1) < 1e-9 ? " credit" : " credits"); }
  function grAnd(list) {
    if (list.length <= 1) return list.join("");
    return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
  }
  var GR_AREA_WORD = { english: "English", math: "math", science: "science", social_studies: "social studies",
                       health: "health", pe: "PE", fine_art: "fine art", world_language: "world language",
                       elective: "elective" };

  /* One tooltip per chart, positioned against the chart's own box. It adds to
     what is on the page and never gates it: every value it shows is also in
     the table under the chart. */
  function grTip(box) {
    var tip = el("div", "gr-tip");
    tip.hidden = true;
    box.appendChild(tip);
    return {
      show: function (node, head, lines) {
        tip.innerHTML = "";
        var b = el("b"); b.textContent = head; tip.appendChild(b);
        (lines || []).forEach(function (l) {
          if (!l) return;
          var s = el("span"); s.textContent = l; tip.appendChild(s);
        });
        tip.hidden = false;
        var r = node.getBoundingClientRect(), c = box.getBoundingClientRect();
        var half = tip.offsetWidth / 2;
        var x = Math.max(half, Math.min(c.width - half, r.left - c.left + r.width / 2));
        // Above the thing it describes, unless the top of the window is in
        // the way — then below it, so it never covers what you are pointing at.
        var under = r.top - tip.offsetHeight - 20 < 0;
        tip.classList.toggle("under", under);
        tip.style.left = x + "px";
        tip.style.top = ((under ? r.bottom : r.top) - c.top) + "px";
      },
      hide: function () { tip.hidden = true; }
    };
  }
  function grBind(node, tip, head, lines) {
    node.__tip = [head, lines];
    function on() { tip.show(node, head, lines); }
    node.addEventListener("pointerenter", on);
    node.addEventListener("focus", on);
    node.addEventListener("pointerleave", tip.hide);
    node.addEventListener("blur", tip.hide);
  }
  /* Arrow keys walk a chart's marks in reading order, so the same values the
     pointer finds are reachable from the keyboard. */
  function grKeys(sv, nodes, tip) {
    var ki = -1;
    sv.setAttribute("tabindex", "0");
    sv.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      var fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
      ki = fwd ? Math.min(nodes.length - 1, ki + 1) : Math.max(0, ki - 1);
      var nd = nodes[ki];
      if (nd && nd.__tip) tip.show(nd, nd.__tip[0], nd.__tip[1]);
      e.preventDefault();
    });
    sv.addEventListener("blur", tip.hide);
  }
  function grTable(summary, head, rows) {
    var det = document.createElement("details");
    det.className = "gr-table";
    det.innerHTML = "<summary></summary>";
    det.querySelector("summary").textContent = summary;
    var scroll = el("div", "gr-table-scroll");
    var tb = el("table");
    var th = el("thead"), tr = el("tr");
    head.forEach(function (h) { var c = el("th"); c.textContent = h; tr.appendChild(c); });
    th.appendChild(tr);
    tb.appendChild(th);
    var body = el("tbody");
    rows.forEach(function (r) {
      var row = el("tr");
      r.forEach(function (v) { var c = el("td"); c.textContent = v == null ? "—" : String(v); row.appendChild(c); });
      body.appendChild(row);
    });
    tb.appendChild(body);
    scroll.appendChild(tb);
    det.appendChild(scroll);
    return det;
  }

  /* ------------------------------------------------------------- The hero
     The one big number, in a ring the size of the diploma. The ring holds
     every credit in the order it counts — transferred, earned at EHS — and
     then the extra, in grey, because extra credit is real and still fills
     nothing. What the ring leaves open is what has not been earned; what the
     sentence beside it says is what still has to be, and when those differ
     the sentence says why. */
  function gradHero(g) {
    var t = g.totals, track = g.track, total = track.total;
    var sec = el("section", "gr-hero");
    var ehsApplied = 0;
    g.areas.forEach(function (a) { ehsApplied += Math.min(a.ehs, a.applied); });
    var transferApplied = Math.max(0, t.applied - ehsApplied);
    var sure = Math.min(transferApplied, t.transferConservative);
    var segs = [[sure, "t"], [transferApplied - sure, "maybe"], [ehsApplied, "e"], [t.surplus, "x"]];

    var side = el("div", "gr-ring-side");
    var ring = el("div", "gr-ring");
    var R = 66, C = 2 * Math.PI * R, GAP = 2.5;
    var sv = grNode("svg", { viewBox: "0 0 160 160", "aria-hidden": "true" });
    sv.appendChild(grNode("circle", { cx: 80, cy: 80, r: R, class: "gr-ring-track" }));
    function arc(from, to, cls) {
      if (to <= from) return;
      var start = from * C + (from > 0 ? GAP : 0);
      var len = Math.max(0, to * C - start);
      var c = grNode("circle", { cx: 80, cy: 80, r: R, class: "gr-arc " + cls, transform: "rotate(-90 80 80)" });
      c.style.strokeDashoffset = String(-start);
      // The same rule as grCount: a tab that is not being painted gets no
      // animation frames, and a ring left at zero because nobody was looking
      // when it was drawn is a ring that says the student has nothing.
      var still = GR_CALM || document.hidden;
      c.style.strokeDasharray = (still ? len : 0) + " " + C;
      sv.appendChild(c);
      if (!still) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { c.style.strokeDasharray = len + " " + C; });
        });
        setTimeout(function () { c.style.strokeDasharray = len + " " + C; }, 1500);
      }
    }
    var at = 0;
    segs.forEach(function (s) {
      if (s[0] <= 1e-9) return;
      var end = Math.min(total, at + s[0]);
      arc(at / total, end / total, s[1]);
      at = end;
    });
    ring.appendChild(sv);
    ring.setAttribute("role", "img");
    ring.setAttribute("aria-label", Math.floor(t.percent) + " percent: " + grFixed(t.earned) + " of " + total +
      " credits earned, " + grFixed(t.planAtEhs) + " still to earn");
    var mid = el("div", "gr-ring-mid");
    var num = el("b");
    mid.appendChild(num);
    mid.appendChild(el("span", null, grFixed(t.earned) + " of " + total + " credits"));
    ring.appendChild(mid);
    grCount(num, Math.floor(t.percent), 0, "%");
    side.appendChild(ring);
    var evaluated = g.transfer && g.transfer.status === "evaluated";
    side.appendChild(el("div", "gr-key",
      (transferApplied > 0 ? '<span><i class="t"></i>' + (evaluated ? "Transferred" : "Expected to transfer") + "</span>" : "") +
      (transferApplied - sure > 1e-9 ? '<span><i class="maybe"></i>May not transfer</span>' : "") +
      (ehsApplied > 0 ? '<span><i class="e"></i>Earned at EHS</span>' : "") +
      (t.surplus > 0 ? '<span><i class="x"></i>Extra</span>' : "") +
      '<span><i class="left"></i>Not yet earned</span>'));
    sec.appendChild(side);

    var txt = el("div", "gr-hero-txt");
    var kick = el("p", "gr-kicker");
    kick.textContent = (g.enrollment ? "Excel High School · " : "") + track.name + " · " + total + " credits" +
      (g.program && g.program.name ? " · " + g.program.name : "");
    txt.appendChild(kick);
    var first = g.account && g.account.firstName;
    var h = el("h2");
    h.textContent = t.planAtEhs <= 0
      ? "Every requirement is met. That’s a diploma."
      : (first ? first + ", you’ve" : "You’ve") + " earned " + Math.floor(t.percent) + "% of your diploma’s credits.";
    txt.appendChild(h);

    var gapNames = g.gaps.map(function (x) { return x.name + " " + grFixed(x.left); });
    var extras = g.areas.filter(function (a) { return a.surplus > 0; }).map(function (a) { return a.name; });
    var lede = "<b>" + grFixed(t.earned) + " of " + total + "</b> credits are in";
    if (t.transferConservative < t.transferEstimate - 1e-9) {
      lede += " — between " + grFixed(t.earned - (t.transferEstimate - t.transferConservative)) + " and " +
        grFixed(t.earned) + " once EHS confirms your transfer";
    }
    lede += ".";
    if (t.planAtEhs > 0) lede += " <b>" + grFixed(t.planAtEhs) + "</b> still to earn: " + esc(grAnd(gapNames)) + ".";
    if (t.surplus > 0 && t.planAtEhs > t.netRemaining + 1e-9) {
      lede += " The " + grFixed(t.surplus) + " extra in " + esc(grAnd(extras)) + " can’t stand in for " +
        (g.gaps.length === 1 ? "it" : g.gaps.length === 2 ? "either" : "any of them") +
        ", which is why it’s " + grFixed(t.planAtEhs) + " and not " + grFixed(t.netRemaining) + ".";
    }
    txt.appendChild(el("p", "gr-lede", lede));

    var facts = el("dl", "gr-facts");
    function fact(k, v) {
      var d = el("div"), dt = el("dt"), dd = el("dd");
      dt.textContent = k; dd.textContent = v;
      d.appendChild(dt); d.appendChild(dd);
      facts.appendChild(d);
    }
    if (g.enrollment && g.enrollment.enrolledOn) fact("Enrolled", grMonth(g.enrollment.enrolledOn));
    if (g.enrollment && g.enrollment.status) {
      fact("Standing", g.enrollment.status.charAt(0).toUpperCase() + g.enrollment.status.slice(1));
    }
    var gpaV = g.gpa.issued != null ? g.gpa.issued : g.gpa.value;
    if (gpaV != null) fact("GPA", gpaV.toFixed(2));
    if (g.board && g.board.taken) fact("Regents passed", g.board.passed + " of " + g.board.taken);
    if (g.transfer && !g.enrollment) fact("Transfer", evaluated ? "Evaluated" : "Estimate");
    txt.appendChild(facts);

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
      var need = next.at === 100 ? t.planAtEhs : Math.max(0, next.at / 100 * total - t.earned);
      txt.appendChild(el("p", "gr-next", svg(I.star, true) + "<span><b>Next up: " + esc(next.label) +
        "</b> — " + (need > 0 ? grCredits(need) + " away." : "within reach.") + "</span>"));
    }
    sec.appendChild(txt);
    return sec;
  }

  function gradKpis(g) {
    var t = g.totals, b = g.board;
    var row = el("div", "gr-kpis");
    var gpaV = g.gpa.issued != null ? g.gpa.issued : g.gpa.value;
    var noEla = b && b.taken && b.areas.some(function (a) { return a.key === "english" && a.state === "none"; });
    [[grFixed(t.earned), "Credits earned",
      (g.transfer ? grFixed(t.transferEarned) + " transferred · " : "") + grFixed(t.ehsEarned) + " at EHS"],
     [grFixed(t.planAtEhs), "Still to earn",
      t.surplus > 0 && t.planAtEhs > t.netRemaining + 1e-9
        ? grFixed(t.netRemaining) + " on paper — " + grFixed(t.surplus) + " extra can’t fill a gap"
        : g.gaps.length ? "Across " + g.gaps.length + (g.gaps.length === 1 ? " requirement" : " requirements")
                        : "Every requirement met"],
     [gpaV != null ? gpaV.toFixed(2) : "—", "GPA · unweighted",
      g.gpa.issued != null
        ? (g.gpa.matchesIssued ? "As issued by EHS · checks out over " + grCredits(g.gpa.credits)
                               : "As issued by EHS · the record adds up to " +
                                 (g.gpa.value != null ? g.gpa.value.toFixed(2) : "—"))
        : g.gpa.courses ? "From " + g.gpa.courses + " lettered marks" : "No marks yet"],
     [b && b.taken ? String(b.passed) : "—", "State exams passed",
      b && b.taken ? "of " + b.taken + " taken" + (noEla ? " · no ELA exam on record" : "") : "None on file"]
    ].forEach(function (k) {
      var tile = el("div", "gr-kpi");
      tile.appendChild(el("b", null, esc(k[0])));
      var l = el("span"); l.textContent = k[1]; tile.appendChild(l);
      var n = el("em"); n.textContent = k[2]; tile.appendChild(n);
      row.appendChild(tile);
    });
    return row;
  }

  /* ----------------------------------------------------------- Credit map
     Every requirement drawn to one scale, a credit the same width in every
     row, with every course that fills it as its own block and its grade on
     it. The black line is where the requirement ends: what sits before it
     counts, what sits after it is extra, and the grey bed is what is left.
     A student can see from across a room that English is one block short and
     Electives three — and hover any block to see which course it is. */
  function gradMap(g) {
    var sec = el("section", "gr-sec");
    var done = g.areas.filter(function (a) { return a.complete; }).length;
    sec.appendChild(grHead("Your diploma, credit by credit", done + " of " + g.areas.length + " requirements met"));
    var card = el("div", "gr-card gcm");
    var anyT = false, anyE = false, anyX = false, anyC = false;
    g.areas.forEach(function (a) {
      (a.items || []).forEach(function (it) {
        if (it.source === "ehs") anyE = true; else anyT = true;
        if (it.surplus > 0) anyX = true;
        if (it.capped > 0) anyC = true;
      });
    });
    card.appendChild(el("div", "gr-key",
      (anyT ? '<span><i class="t"></i>Transferred</span>' : "") +
      (anyE ? '<span><i class="e"></i>Earned at EHS</span>' : "") +
      (anyX ? '<span><i class="x"></i>Extra, past the requirement</span>' : "") +
      (anyC ? '<span><i class="cap"></i>Over the transfer limit</span>' : "") +
      '<span><i class="left"></i>Still to earn</span><span><i class="line"></i>Where the requirement ends</span>'));

    var scale = 0;
    g.areas.forEach(function (a) { scale = Math.max(scale, a.required + a.surplus + (a.cappedOut || 0)); });
    var rows = el("div", "gcm-rows");
    var tip = grTip(card);
    var fits = [];
    g.groups.forEach(function (grp) {
      var areas = g.areas.filter(function (a) { return a.group === grp.key; });
      if (!areas.length) return;
      var block = el("div", "gcm-group" + (areas.length > 1 ? " multi" : ""));
      if (areas.length > 1) {
        var gh = el("div", "gcm-grouphead");
        var gb = el("b"); gb.textContent = grp.name; gh.appendChild(gb);
        var gs = el("span");
        gs.textContent = grFixed(grp.earned) + " of " + grFixed(grp.required) +
          (grp.includes ? " · " + grAnd(grp.includes) : "");
        gh.appendChild(gs);
        block.appendChild(gh);
      }
      areas.forEach(function (a) {
        block.appendChild(gmRow(a, areas.length > 1 ? a.name : grp.name, scale, tip, fits));
      });
      rows.appendChild(block);
    });
    card.appendChild(rows);

    // A grade goes on its block only where it fits with room either side.
    // Anything narrower keeps it in the tooltip and the table.
    function fit() {
      fits.forEach(function (b) {
        var s = b.firstChild;
        if (!s) return;
        s.hidden = false;
        if (!b.clientWidth || s.offsetWidth > b.clientWidth - 8) s.hidden = true;
      });
    }
    if (window.ResizeObserver) new ResizeObserver(fit).observe(rows);
    requestAnimationFrame(fit);

    if (anyX) {
      card.appendChild(el("p", "gr-note",
        "A credit counts in the requirement it was earned in. What goes past the line is extra — it isn’t " +
        "moved into Electives, because that is how your EHS record counts it."));
    }
    card.appendChild(grTable("Show as a table", ["Requirement", "Needed", "Earned", "Extra", "Left", "Courses"],
      g.areas.map(function (a) {
        return [a.name, grFixed(a.required), grFixed(a.earned), a.surplus ? "+" + grFixed(a.surplus) : "—",
          a.planAtEhs ? grFixed(a.planAtEhs) : "Met",
          (a.items || []).map(function (it) {
            return it.title + " " + grFixed(it.credits) + (it.source === "ehs" ? " (EHS)" : "");
          }).join("; ") || "—"];
      })));
    sec.appendChild(card);
    return sec;
  }

  function gmRow(a, label, scale, tip, fits) {
    var row = el("div", "gcm-row" + (a.complete ? " done" : ""));
    var name = el("div", "gcm-name");
    var nb = el("b"); nb.textContent = label; name.appendChild(nb);
    var ns = el("span"); ns.textContent = grFixed(a.earned - (a.cappedOut || 0)) + " / " + grFixed(a.required);
    name.appendChild(ns);
    row.appendChild(name);

    var trackEl = el("div", "gcm-track");
    trackEl.setAttribute("role", "group");
    trackEl.setAttribute("aria-label", label + ": " + grFixed(a.applied) + " of " + grFixed(a.required) +
      " counted" + (a.surplus ? ", " + grFixed(a.surplus) + " extra" : "") +
      (a.planAtEhs ? ", " + grFixed(a.planAtEhs) + " to go" : ", met"));
    var bed = el("span", "gcm-bed");
    bed.style.width = (a.required / scale * 100) + "%";
    // A faint tick at every half credit, the unit EHS counts in.
    bed.style.backgroundSize = (0.5 / a.required * 100) + "% 100%";
    trackEl.appendChild(bed);
    var line = el("i", "gcm-line");
    line.style.left = (a.required / scale * 100) + "%";
    trackEl.appendChild(line);

    function seg(it, from, len, cls, role) {
      var b = el("button", "gcm-seg " + cls);
      b.type = "button";
      b.style.left = "calc(" + (from / scale * 100) + "% + 1px)";
      b.style.width = "calc(" + (len / scale * 100) + "% - 2px)";
      var mark = it.letter || it.mark || "";
      if (mark) { var s = el("span"); s.textContent = mark; b.appendChild(s); fits.push(b); }
      var lines = [
        (it.source === "ehs" ? "Earned at EHS" : "Transferred") + " · " + grYear(it.year) + " · " + grCredits(len),
        it.markNumeric != null ? it.markNumeric + " · " + it.letter : it.mark ? "Mark " + it.mark : null,
        role
      ];
      b.setAttribute("aria-label", it.title + ". " + lines.filter(Boolean).join(". "));
      grBind(b, tip, it.title, lines);
      trackEl.appendChild(b);
    }
    var applied = 0, extra = a.required;
    (a.items || []).forEach(function (it) {
      var src = it.source === "ehs" ? "e" : "t";
      if (it.applied > 0) { seg(it, applied, it.applied, src, "Counts toward " + label); applied += it.applied; }
      if (it.capped > 0) { seg(it, extra, it.capped, "cap", "Over the transfer limit, so it doesn’t count"); extra += it.capped; }
      if (it.surplus > 0) { seg(it, extra, it.surplus, "x", "Extra — past the " + label + " requirement"); extra += it.surplus; }
    });
    row.appendChild(trackEl);

    var st = el("div", "gcm-state");
    if (a.complete) {
      st.innerHTML = '<span class="ok">' + svg(I.tick, true) + "Met</span>";
      if (a.surplus > 0) st.appendChild(el("em", null, "+" + grFixed(a.surplus) + " extra"));
    } else {
      st.innerHTML = "<b>" + grFixed(a.planAtEhs) + "</b> to go";
    }
    if (a.residencyExtra > 0) st.appendChild(el("em", "warn", "EHS minimum: " + grFixed(a.residencyMin) + " at EHS"));
    row.appendChild(st);
    return row;
  }

  /* ---------------------------------------------------------- Year by year
     Two small charts on the same years, side by side rather than stacked on
     one plot with two scales: credits in one, marks in the other. A year with
     nothing on the record keeps its place and says so, and the day a student
     started at EHS is drawn as a line on both. */
  function gradJourney(g) {
    var ys = g.years;
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("Year by year", ys[0].label + " to " + ys[ys.length - 1].label));

    var strip = el("div", "gj-schools");
    function school(cls, name, line) {
      var d = el("div", "gj-school");
      d.innerHTML = '<i class="' + cls + '"></i><div><b></b><span></span></div>';
      d.querySelector("b").textContent = name;
      d.querySelector("span").textContent = line;
      strip.appendChild(d);
    }
    if (g.transfer) {
      var x = g.transfer;
      var span = x.firstYear && x.lastYear
        ? String(x.firstYear).slice(0, 4) + "–" + (Number(String(x.lastYear).slice(0, 4)) + 1) + " · " : "";
      school("t", x.school, span + x.courses + (x.courses === 1 ? " course · " : " courses · ") +
        grCredits(x.credits) + " · " + (x.status === "evaluated" ? "evaluated by EHS" : "estimate until EHS evaluates it"));
    }
    if (g.enrollment || (g.ehs && g.ehs.count)) {
      school("e", "Excel High School",
        (g.enrollment && g.enrollment.enrolledOn ? "Since " + grMonth(g.enrollment.enrolledOn) + " · " : "") +
        g.ehs.count + (g.ehs.count === 1 ? " course · " : " courses · ") + grCredits(g.ehs.credits) +
        (g.ehs.average != null ? " · averaging " + g.ehs.average : ""));
    }
    sec.appendChild(strip);

    var W = 360, H = 220, m = { l: 30, r: 12, t: 34, b: 30 };
    var slot = (W - m.l - m.r) / ys.length;
    var geo = { W: W, H: H, m: m, slot: slot, cx: function (i) { return m.l + slot * i + slot / 2; }, join: -1 };
    if (g.transfer && g.ehs && g.ehs.count) {
      ys.forEach(function (y, i) { if (geo.join < 0 && y.ehs > 0) geo.join = i; });
    }
    var grid = el("div", "gr-two");
    grid.appendChild(gjCredits(g, ys, geo));
    grid.appendChild(gjAverage(g, ys, geo));
    sec.appendChild(grid);
    if (g.momentum && g.momentum.basis === "years") {
      var mo = el("p", "gr-lede"); mo.textContent = g.momentum.says; sec.appendChild(mo);
    }
    if (g.trend && g.trend.length >= 2) sec.appendChild(trendCard(g));
    sec.appendChild(grTable("Show years as a table", ["Year", "Transferred", "At EHS", "Courses", "Average"],
      ys.map(function (y) {
        return [y.label, y.transfer ? grFixed(y.transfer) : "—", y.ehs ? grFixed(y.ehs) : "—",
          y.gap ? "None on the record" : y.courses,
          y.average != null ? y.average : y.thinAverage != null ? y.thinAverage + " (under 1 lettered credit)" : "—"];
      })));
    return sec;
  }

  function gjJoin(sv, geo, g) {
    var x = geo.m.l + geo.slot * geo.join;
    sv.appendChild(grNode("line", { x1: x, x2: x, y1: geo.m.t - 16, y2: geo.H - geo.m.b, class: "gj-join" }));
    var right = x > geo.W * 0.55;
    var t = grNode("text", { x: right ? x - 5 : x + 5, y: geo.m.t - 20, "text-anchor": right ? "end" : "start",
                             class: "gj-joinlabel" });
    t.textContent = "Joined EHS" + (g.enrollment && g.enrollment.enrolledOn ? " · " + grMonth(g.enrollment.enrolledOn) : "");
    sv.appendChild(t);
  }
  function grColumn(x, w, top, bottom, r) {
    var h = bottom - top;
    if (h <= 0) return "";
    r = Math.min(r, h, w / 2);
    return "M" + x + " " + bottom + "V" + (top + r) +
      (r ? "Q" + x + " " + top + " " + (x + r) + " " + top : "") + "H" + (x + w - r) +
      (r ? "Q" + (x + w) + " " + top + " " + (x + w) + " " + (top + r) : "") + "V" + bottom + "Z";
  }

  function gjCredits(g, ys, geo) {
    var W = geo.W, H = geo.H, m = geo.m;
    var card = el("section", "gr-card");
    card.appendChild(el("h3", null, "Credits earned each year"));
    card.appendChild(el("p", "gr-sub", "EHS credits, by the school that awarded them"));
    var max = 0;
    ys.forEach(function (y) { max = Math.max(max, y.credits); });
    var top = Math.max(2, Math.ceil(max / 2) * 2), step = top <= 4 ? 1 : 2;
    function y(v) { return m.t + (top - v) * (H - m.t - m.b) / top; }
    var wrap = el("div", "gr-plot");
    var sv = grNode("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "Credits earned each year: " + ys.map(function (yy) {
        return yy.label + " " + (yy.gap ? "none" : grFixed(yy.credits)); }).join(", ") + "." });
    for (var v = 0; v <= top; v += step) {
      sv.appendChild(grNode("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? "gr-base" : "gr-grid" }));
      var tk = grNode("text", { x: m.l - 8, y: y(v) + 4, "text-anchor": "end", class: "gr-tick" });
      tk.textContent = v;
      sv.appendChild(tk);
    }
    if (geo.join > 0) gjJoin(sv, geo, g);
    var tip = grTip(wrap);
    var bw = Math.min(24, geo.slot * 0.46), nodes = [];
    ys.forEach(function (yy, i) {
      var cx = geo.cx(i);
      var gEl = grNode("g", { class: "gr-col" });
      gEl.appendChild(grNode("rect", { x: cx - geo.slot / 2, y: m.t - 12, width: geo.slot, height: H - m.t - m.b + 12, fill: "transparent" }));
      var lab = grNode("text", { x: cx, y: H - 9, "text-anchor": "middle", class: "gr-tick" });
      lab.textContent = grYY(yy.year);
      gEl.appendChild(lab);
      if (yy.gap) {
        var none = grNode("text", { x: cx, y: y(0) - 8, "text-anchor": "middle", class: "gj-none" });
        none.textContent = "none";
        gEl.appendChild(none);
      } else {
        var parts = [[yy.transfer, "t"], [yy.ehs, "e"]].filter(function (p) { return p[0] > 0; });
        var sumAt = 0;
        parts.forEach(function (p, k) {
          var bottom = y(sumAt) - (k > 0 ? 2 : 0), topY = y(sumAt + p[0]);
          gEl.appendChild(grNode("path", { class: "gj-bar " + p[1],
            d: grColumn(cx - bw / 2, bw, topY, bottom, k === parts.length - 1 ? 4 : 0) }));
          sumAt += p[0];
        });
        var val = grNode("text", { x: cx, y: y(yy.credits) - 7, "text-anchor": "middle", class: "gr-val" });
        val.textContent = grFixed(yy.credits);
        gEl.appendChild(val);
      }
      grBind(gEl, tip, yy.label + (yy.gap ? "" : " · " + grCredits(yy.credits)), yy.gap
        ? ["No coursework on the record"]
        : [yy.transfer ? grFixed(yy.transfer) + " transferred" : null,
           yy.ehs ? grFixed(yy.ehs) + " earned at EHS" : null,
           yy.courses + (yy.courses === 1 ? " course" : " courses")]);
      sv.appendChild(gEl);
      nodes.push(gEl);
    });
    grKeys(sv, nodes, tip);
    wrap.appendChild(sv);
    card.appendChild(wrap);
    return card;
  }

  function gjAverage(g, ys, geo) {
    var W = geo.W, H = geo.H, m = geo.m;
    var card = el("section", "gr-card");
    card.appendChild(el("h3", null, "Average mark each year"));
    card.appendChild(el("p", "gr-sub", "Weighted by credit · lettered courses only"));
    var pts = [];
    ys.forEach(function (yy, i) { if (yy.average != null) pts.push({ i: i, v: yy.average, y: yy }); });
    if (!pts.length) {
      card.appendChild(el("p", "gr-sub", "No year with a full lettered credit on the record yet."));
      return card;
    }
    var minV = Math.min.apply(null, pts.map(function (p) { return p.v; }));
    var lo = Math.min(70, Math.floor((minV - 1) / 10) * 10), hi = 100;
    function y(v) { return m.t + (hi - v) * (H - m.t - m.b) / (hi - lo); }
    var wrap = el("div", "gr-plot");
    var sv = grNode("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "Average mark each year: " + pts.map(function (p) { return p.y.label + " " + p.v; }).join(", ") + "." });
    for (var v = lo; v <= hi; v += 10) {
      sv.appendChild(grNode("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === lo ? "gr-base" : "gr-grid" }));
      var tk = grNode("text", { x: m.l - 8, y: y(v) + 4, "text-anchor": "end", class: "gr-tick" });
      tk.textContent = v;
      sv.appendChild(tk);
    }
    // The letter each band is, named at the right edge, so 90 reads as an A
    // without a legend to hunt for.
    [[90, "A"], [80, "B"], [70, "C"], [60, "D"]].forEach(function (b) {
      if (b[0] < lo || b[0] >= hi) return;
      var t = grNode("text", { x: W - m.r, y: y(b[0]) - 4, "text-anchor": "end", class: "gj-band" });
      t.textContent = b[1];
      sv.appendChild(t);
    });
    if (geo.join > 0) gjJoin(sv, geo, g);
    ys.forEach(function (yy, i) {
      var lab = grNode("text", { x: geo.cx(i), y: H - 9, "text-anchor": "middle", class: "gr-tick" });
      lab.textContent = grYY(yy.year);
      sv.appendChild(lab);
    });
    // Consecutive years join with the line; a year with no average between
    // them leaves only a hairline, so the chart never implies marks it lacks.
    for (var k = 1; k < pts.length; k++) {
      var p0 = pts[k - 1], p1 = pts[k];
      sv.appendChild(grNode("line", { x1: geo.cx(p0.i), y1: y(p0.v), x2: geo.cx(p1.i), y2: y(p1.v),
        class: p1.i - p0.i === 1 ? "gj-line" : "gj-bridge" }));
    }
    var tip = grTip(wrap), nodes = [];
    pts.forEach(function (p, n) {
      var cls = p.y.school === "ehs" ? "e" : "t";
      var gEl = grNode("g", { class: "gj-pt" });
      gEl.appendChild(grNode("circle", { cx: geo.cx(p.i), cy: y(p.v), r: 14, fill: "transparent" }));
      gEl.appendChild(grNode("circle", { cx: geo.cx(p.i), cy: y(p.v), r: 5.5, class: "gj-dot " + cls }));
      if (n === 0 || n === pts.length - 1) {
        var lb = grNode("text", { x: geo.cx(p.i), y: y(p.v) - 12, "text-anchor": "middle", class: "gr-endlabel" });
        lb.textContent = p.v;
        gEl.appendChild(lb);
      }
      grBind(gEl, tip, p.y.label + " · " + p.v, [
        p.y.school === "ehs" ? "Excel High School" : p.y.school === "both" ? "Both schools"
          : (g.transfer ? g.transfer.school : "Previous school"),
        grFixed(p.y.letteredCredits) + " lettered credits"]);
      sv.appendChild(gEl);
      nodes.push(gEl);
    });
    grKeys(sv, nodes, tip);
    wrap.appendChild(sv);
    card.appendChild(wrap);
    return card;
  }

  /* ------------------------------------------------------------ The marks
     Every lettered course as a dot on the 0–100 line, one row per school
     year, with EHS's letter bands behind them. A D in one row and a run of
     A's in another is the whole story of a record, and a table of 20
     percentages hides it. The highest and lowest are named; the rest are in
     the tooltip and the table. */
  function gradMarks(g) {
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("Every mark on your record", g.marks.length + " lettered courses · EHS’s 4.0 scale"));
    var grid = el("div", "gr-two wide");
    grid.appendChild(markStrip(g));
    var col = el("div", "gr-stack");
    col.appendChild(gpaCard(g));
    if (g.strengths.length) col.appendChild(strengthCard(g));
    grid.appendChild(col);
    sec.appendChild(grid);
    return sec;
  }

  function markStrip(g) {
    var card = el("section", "gr-card");
    card.appendChild(el("h3", null, "Each course, by mark"));
    card.appendChild(el("p", "gr-sub", "One dot per lettered course · a bigger dot carries more credit"));
    var hasT = g.marks.some(function (x) { return x.source !== "ehs"; });
    var hasE = g.marks.some(function (x) { return x.source === "ehs"; });
    if (hasT && hasE) {
      card.appendChild(el("div", "gr-key gk-key", '<span><i class="t dot"></i>Transferred</span><span><i class="e dot"></i>Earned at EHS</span>'));
    }
    var years = [];
    g.marks.forEach(function (x) { var k = x.year || "Other"; if (years.indexOf(k) < 0) years.push(k); });
    years.sort();
    var W = 600, rowH = 62, m = { l: 50, r: 16, t: 28, b: 28 };
    var H = m.t + years.length * rowH + m.b;
    var minMark = Math.min.apply(null, g.marks.map(function (x) { return x.mark; }));
    var lo = Math.min(60, Math.floor((minMark - 2) / 10) * 10), hi = 100;
    function x(v) { return m.l + (v - lo) * (W - m.l - m.r) / (hi - lo); }
    var wrap = el("div", "gr-plot");
    var sv = grNode("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": g.marks.length + " lettered courses from " + minMark + " to " +
        Math.max.apply(null, g.marks.map(function (q) { return q.mark; })) + ". Use the arrow keys to read each one." });
    [[90, 100, "A"], [80, 90, "B"], [70, 80, "C"], [60, 70, "D"], [0, 60, "F"]].forEach(function (b, i) {
      var a0 = Math.max(lo, b[0]), a1 = Math.min(hi, b[1]);
      if (a1 <= a0) return;
      sv.appendChild(grNode("rect", { x: x(a0), y: m.t - 18, width: x(a1) - x(a0), height: H - m.t - m.b + 18,
                                      class: "gk-band" + (i % 2 ? "" : " alt") }));
      var t = grNode("text", { x: (x(a0) + x(a1)) / 2, y: m.t - 6, "text-anchor": "middle", class: "gk-letter" });
      t.textContent = b[2];
      sv.appendChild(t);
    });
    for (var v = lo; v <= hi; v += 10) {
      var tk = grNode("text", { x: x(v), y: H - 8, "text-anchor": "middle", class: "gr-tick" });
      tk.textContent = v;
      sv.appendChild(tk);
    }
    years.forEach(function (yr, i) {
      var cy = m.t + i * rowH + rowH / 2;
      sv.appendChild(grNode("line", { x1: m.l, x2: W - m.r, y1: cy, y2: cy, class: "gr-grid" }));
      var t = grNode("text", { x: m.l - 10, y: cy + 4, "text-anchor": "end", class: "gr-tick" });
      t.textContent = grYY(yr);
      sv.appendChild(t);
    });

    var tip = grTip(wrap);
    var byMark = g.marks.slice().sort(function (a, b) { return a.mark - b.mark || String(b.year).localeCompare(String(a.year)); });
    var low = byMark[0];
    var high = g.marks.slice().sort(function (a, b) { return b.mark - a.mark || String(b.year).localeCompare(String(a.year)); })[0];
    var placed = {}, nodes = [];
    g.marks.slice().sort(function (a, b) { return String(a.year).localeCompare(String(b.year)) || a.mark - b.mark; })
      .forEach(function (mk) {
        var row = years.indexOf(mk.year || "Other");
        var base = m.t + row * rowH + rowH / 2;
        var r = 4 + Math.min(2.5, mk.credits * 2);
        var px = x(mk.mark), list = placed[row] || (placed[row] = []);
        var cy = null, offs = [0, -9, 9, -17, 17];
        for (var o = 0; o < offs.length && cy == null; o++) {
          var tryY = base + offs[o];
          var clash = list.some(function (q) {
            var dx = q.x - px, dy = q.y - tryY;
            return Math.sqrt(dx * dx + dy * dy) < q.r + r + 1;
          });
          if (!clash) cy = tryY;
        }
        if (cy == null) cy = base;
        list.push({ x: px, y: cy, r: r });
        var gEl = grNode("g", { class: "gk-pt" });
        gEl.appendChild(grNode("circle", { cx: px, cy: cy, r: Math.max(12, r + 4), fill: "transparent" }));
        gEl.appendChild(grNode("circle", { cx: px, cy: cy, r: r, class: "gk-dot " + (mk.source === "ehs" ? "e" : "t") }));
        if (mk === low || mk === high) {
          var anchor = px > W - 110 ? "end" : px < m.l + 70 ? "start" : "middle";
          var lb = grNode("text", { x: px + (anchor === "end" ? 4 : anchor === "start" ? -4 : 0), y: cy + r + 14,
                                    "text-anchor": anchor, class: "gk-label" });
          lb.textContent = mk.title + " · " + mk.mark;
          gEl.appendChild(lb);
        }
        grBind(gEl, tip, mk.title, [
          (mk.source === "ehs" ? "Earned at EHS" : "Transferred") + " · " + grYear(mk.year),
          mk.mark + " · " + mk.letter + " · " + grCredits(mk.credits)]);
        sv.appendChild(gEl);
        nodes.push(gEl);
      });
    grKeys(sv, nodes, tip);
    wrap.appendChild(sv);
    card.appendChild(wrap);
    card.appendChild(grTable("Show as a table", ["Year", "Course", "School", "Mark", "Grade", "Credits"],
      g.marks.slice().sort(function (a, b) { return String(b.year).localeCompare(String(a.year)) || b.mark - a.mark; })
        .map(function (q) {
          return [grYear(q.year), q.title, q.source === "ehs" ? "EHS" : "Transferred", q.mark, q.letter, grFixed(q.credits)];
        })));
    return card;
  }

  function gpaCard(g) {
    var card = el("section", "gr-card");
    card.appendChild(el("h3", null, "GPA"));
    var v = g.gpa.issued != null ? g.gpa.issued : g.gpa.value;
    var big = el("p", "gk-gpa");
    big.innerHTML = "<b></b><span></span>";
    big.querySelector("b").textContent = v != null ? v.toFixed(2) : "—";
    big.querySelector("span").textContent = "unweighted · 4.0 scale";
    card.appendChild(big);
    card.appendChild(el("p", "gr-sub", grFixed(g.gpa.points) + " quality points ÷ " + grFixed(g.gpa.credits) +
      " lettered credits. Courses marked P carry credit and no points."));
    if (g.gpa.issued != null && g.gpa.value != null) {
      card.appendChild(el("p", "gk-verdict", g.gpa.matchesIssued
        ? '<span class="chip ok">' + svg(I.tick, true) + "Matches the GPA EHS issued</span>"
        : '<span class="chip warn">' + svg(I.alert, true) + "EHS issued " + g.gpa.issued.toFixed(2) +
          " · the record adds up to " + g.gpa.value.toFixed(2) + "</span>"));
    }

    // Credits at each letter: the weight each letter actually carries in the
    // average, which a count of courses does not show.
    var L = ["A", "B", "C", "D", "F"], dc = g.gpa.distributionCredits || {}, dn = g.gpa.distribution || {};
    var max = Math.max.apply(null, L.map(function (k) { return dc[k] || 0; })) || 1;
    var W = 300, H = 150, top = 24, base = H - 24, slot = W / L.length, bw = 22;
    var wrap = el("div", "gr-plot");
    var sv = grNode("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "Credits at each letter: " + L.map(function (k) { return k + " " + grFixed(dc[k] || 0); }).join(", ") });
    sv.appendChild(grNode("line", { x1: 0, x2: W, y1: base, y2: base, class: "gr-base" }));
    var tip = grTip(wrap), nodes = [];
    L.forEach(function (k, i) {
      var n = dc[k] || 0, h = n / max * (base - top), bx = i * slot + (slot - bw) / 2;
      var gEl = grNode("g", { class: "gr-col" });
      gEl.appendChild(grNode("rect", { x: i * slot, y: 0, width: slot, height: H, fill: "transparent" }));
      if (h > 0) gEl.appendChild(grNode("path", { class: "gr-bar", d: grColumn(bx, bw, base - h, base, 4) }));
      var val = grNode("text", { x: bx + bw / 2, y: base - h - 6, "text-anchor": "middle", class: "gr-val" });
      val.textContent = grFixed(n);
      var lab = grNode("text", { x: bx + bw / 2, y: H - 6, "text-anchor": "middle", class: "gr-tick" });
      lab.textContent = k;
      gEl.appendChild(val);
      gEl.appendChild(lab);
      grBind(gEl, tip, k + " · " + grCredits(n), [(dn[k] || 0) + ((dn[k] || 0) === 1 ? " course" : " courses")]);
      sv.appendChild(gEl);
      nodes.push(gEl);
    });
    grKeys(sv, nodes, tip);
    wrap.appendChild(sv);
    card.appendChild(el("p", "gr-sub gk-distlabel", "Credits at each letter"));
    card.appendChild(wrap);
    return card;
  }

  /* ---------------------------------------------------- What’s left, and when
     A credit count says how far; this says when, at the pace of the
     student's own record, labelled as the estimate it is — and beside it,
     each gap with what is already on the way to it and the EHS courses that
     would close the rest. */
  function gradPlan(g) {
    var pc = g.pace;
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("What’s left, and when",
      pc.finishBy ? (pc.basis === "ehs" ? "At your EHS pace" : "On your own pace") : "No pace on the record yet"));
    var grid = el("div", "gr-two");

    var card = el("div", "gr-card gr-plan");
    var big = el("p", "gr-plan-big");
    big.innerHTML = "<b></b><span></span>";
    big.querySelector("b").textContent = pc.finishBy ? grMonth(pc.finishBy) : "—";
    big.querySelector("span").textContent = pc.finishBy ? "on this pace" : "not enough on the record yet";
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

    var gaps = el("div", "gr-card");
    gaps.appendChild(el("h3", null, "What closes each gap"));
    var list = el("div", "gr-gaps");
    g.gaps.forEach(function (gp) {
      var row = el("div", "gr-gap");
      var head = el("div", "gr-gap-head");
      head.innerHTML = "<b></b><span><strong></strong> to go</span>";
      head.querySelector("b").textContent = gp.name;
      head.querySelector("strong").textContent = grFixed(gp.left);
      row.appendChild(head);
      gp.enrolled.forEach(function (c) {
        var p = el("p", "gr-gap-on");
        p.innerHTML = "<em>In progress</em><span></span>";
        p.querySelector("span").textContent = c.title + " · " + grCredits(c.credits) +
          (c.percent != null ? " · " + c.percent + "% so far" : "");
        row.appendChild(p);
      });
      if (gp.enrolled.length && gp.afterEnrolled > 0) {
        row.appendChild(el("p", null, "After that, " + grFixed(gp.afterEnrolled) + " more."));
      }
      if (gp.options.length && gp.afterEnrolled > 0) {
        var o = el("p", "gr-gap-opts");
        o.innerHTML = "<em>EHS offers</em><span></span>";
        o.querySelector("span").textContent = gp.options.join(" · ");
        row.appendChild(o);
      }
      list.appendChild(row);
    });
    gaps.appendChild(list);
    if (g.residency && g.residency.extra > 0) {
      var rn = el("p", "gr-note"); rn.textContent = g.residency.says; gaps.appendChild(rn);
    }
    grid.appendChild(gaps);
    sec.appendChild(grid);
    return sec;
  }

  /* --------------------------------------------------------------- Checks
     The record read against itself, the way a registrar would. "Checks
     out" is shown as plainly as "ask about", because knowing the GPA adds up
     is worth as much to a student as knowing where it does not. */
  function gradChecks(g) {
    var sec = el("section", "gr-sec");
    var ok = g.checks.filter(function (c) { return c.level === "ok"; }).length;
    var look = g.checks.filter(function (c) { return c.level === "check"; }).length;
    sec.appendChild(grHead("Checked against your record",
      ok + (ok === 1 ? " checks out" : " check out") + (look ? " · " + look + " to ask about" : "")));
    var list = el("div", "gr-checks");
    var order = { check: 0, info: 1, ok: 2 };
    var TAG = { ok: [I.tick, "Checks out"], check: [I.alert, "Ask about"], info: [I.bulb, "Worth knowing"] };
    g.checks.slice().sort(function (a, b) { return order[a.level] - order[b.level]; }).forEach(function (c) {
      var tag = TAG[c.level] || TAG.info;
      var row = el("div", "gr-check " + c.level);
      row.innerHTML = '<span class="ic">' + svg(tag[0], true) + "</span><div><em></em><b></b><p></p></div>";
      row.querySelector("em").textContent = tag[1];
      row.querySelector("b").textContent = c.title;
      row.querySelector("p").textContent = c.detail;
      list.appendChild(row);
    });
    sec.appendChild(list);
    return sec;
  }

  /* ---------------------------------------------------------- State exams */
  function gradExams(g) {
    var sec = el("section", "gr-sec");
    var passed = g.exams.filter(function (e) { return e.passed; }).length;
    sec.appendChild(grHead("State exams", g.exams.length ? passed + " of " + g.exams.length + " passed" : "Grades 4 to 8"));
    if (g.exams.length) {
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
    }
    var tests = g.stateTests || [];
    if (tests.length) {
      var card = el("div", "gr-card gs");
      card.appendChild(el("h3", null, "Earlier state tests"));
      card.appendChild(el("p", "gr-sub", "Grades 4 to 8, as your previous school recorded them. Levels run 1 to 4, " +
        "and 3 is proficient."));
      var LV = { 4: "Excels", 3: "Proficient", 2: "Below proficient", 1: "Well below" };
      var scroll = el("div", "gs-scroll");
      var tb = el("table");
      tb.innerHTML = "<thead><tr><th>Year</th><th>Grade</th><th>Exam</th><th class='num'>Score</th><th>Level</th>" +
        "<th class='num'>Rating</th><th class='num'>City percentile</th></tr></thead>";
      var body = el("tbody");
      tests.forEach(function (s) {
        var tr = el("tr");
        if (s.note) {
          tr.className = "note";
          tr.innerHTML = "<td></td><td></td><td colspan='5'></td>";
          tr.children[0].textContent = s.year || "";
          tr.children[1].textContent = s.grade != null ? s.grade : "";
          tr.children[2].textContent = s.note;
        } else {
          if (s.score == null && s.level == null) tr.className = "blank";
          tr.innerHTML = "<td></td><td></td><td></td><td class='num'></td><td></td><td class='num'></td><td class='num'></td>";
          tr.children[0].textContent = s.year || "";
          tr.children[1].textContent = s.grade != null ? s.grade : "";
          tr.children[2].textContent = s.exam || "";
          tr.children[3].textContent = s.score != null ? s.score : "—";
          if (s.level != null) {
            var lv = el("span", "gs-lv");
            var pips = "";
            for (var p = 1; p <= 4; p++) pips += '<u class="' + (p <= s.level ? "on" : "") + '"></u>';
            lv.innerHTML = "<i aria-hidden='true'>" + pips + "</i><span></span>";
            lv.querySelector("span").textContent = s.level + " · " + LV[s.level];
            tr.children[4].appendChild(lv);
          } else {
            tr.children[4].textContent = "—";
          }
          tr.children[5].textContent = s.rating != null ? s.rating : "—";
          tr.children[6].textContent = s.percentile || "—";
        }
        body.appendChild(tr);
      });
      tb.appendChild(body);
      scroll.appendChild(tb);
      card.appendChild(scroll);
      sec.appendChild(card);
    }
    return sec;
  }

  /* ------------------------------------------------------ This year at EHS */
  function gradCurrent(g) {
    var sec = el("section", "gr-sec");
    sec.appendChild(grHead("This year at EHS", g.current.length
      ? g.current.length + (g.current.length === 1 ? " course" : " courses") : ""));
    if (!g.current.length) {
      sec.appendChild(el("div", "lx-empty", "No courses open right now. As you enrol and your teachers mark your " +
        "work, your courses and grades appear here."));
      return sec;
    }
    var list = el("div", "gr-current");
    g.current.forEach(function (c) {
      var row = el("div", "gr-cur");
      row.innerHTML = "<div><b></b><span></span></div><span class='let'></span><strong></strong>";
      row.querySelector("b").textContent = c.title;
      row.querySelector("div span").textContent =
        (c.itemCount ? c.itemCount + (c.itemCount === 1 ? " item" : " items") + " marked · over " +
                       c.countedWeight + "% of the grade" : "No marks yet") +
        (c.credits ? " · counts " + grFixed(c.credits) + " " + (GR_AREA_WORD[c.area] || "") +
                     (c.credits === 1 ? " credit" : " credits") : "");
      if (c.percent != null) {
        row.querySelector(".let").textContent = c.letter;
        row.querySelector("strong").textContent = c.percent + "%";
      } else {
        row.querySelector(".let").remove();
        var chip = el("span", "chip", "In progress");
        row.replaceChild(chip, row.querySelector("strong"));
      }
      list.appendChild(row);
    });
    sec.appendChild(list);
    return sec;
  }

  /* ---------------------------------------------------------- Course record
     The record itself, grouped by subject exactly as EHS's academic record
     groups it, newest first, with where each course came from on its row.
     This is the section a student holds their paper copy up against. */
  function gradRecord(g) {
    var sec = el("section", "gr-sec");
    var groupOf = {};
    g.areas.forEach(function (a) { groupOf[a.key] = a.group; });
    function numMark(n, raw) {
      if (n != null) return Number(n).toFixed(1);
      return raw && /\d/.test(raw) ? raw : "—";
    }
    var all = (g.ehsCourses || []).map(function (c) {
      return { src: "e", year: c.year, code: c.code || "", title: c.title,
               credits: c.status === "completed" ? Number(c.credits || 0) : 0,
               mark: numMark(c.markNumeric, c.mark), letter: c.letter || (c.mark && !/\d/.test(c.mark) ? c.mark : ""),
               area: c.area, flags: c.status === "completed" ? [] : [c.status === "in_progress" ? "In progress" : "Withdrawn"] };
    }).concat(g.courses.map(function (c) {
      var fl = [];
      if (c.decision === "declined") fl.push("Declined by EHS");
      if (c.attempted > 0 && !Number(c.earned) && c.markNumeric != null) fl.push("No credit");
      if (c.flags.indexOf("recovered") > -1) fl.push("Recovered");
      return { src: "t", year: c.year, code: c.code && c.code !== "TR" ? c.code : "", title: c.title,
               credits: c.decision === "declined" ? 0 : Number(c.ehsCredits || 0),
               mark: numMark(c.markNumeric, c.mark), letter: c.letter || (c.mark && !/\d/.test(c.mark) ? c.mark : ""),
               area: c.area, flags: fl };
    }));
    sec.appendChild(grHead("Course record", all.length + " courses · grouped by subject, as your EHS record lays them out"));

    g.groups.forEach(function (grp) {
      var rows = all.filter(function (r) { return (groupOf[r.area] || "elective") === grp.key; })
        .sort(function (a, b) {
          return String(b.year).localeCompare(String(a.year)) || (a.src === b.src ? 0 : a.src === "e" ? -1 : 1);
        });
      if (!rows.length) return;
      var det = document.createElement("details");
      det.className = "gr-rec";
      det.open = true;
      var sum = document.createElement("summary");
      sum.innerHTML = "<b></b><span></span><strong></strong>";
      sum.querySelector("b").textContent = grp.name;
      sum.querySelector("span").textContent = grFixed(grp.required) + " credits required" +
        (grp.includes ? " · " + grAnd(grp.includes) : "");
      sum.querySelector("strong").innerHTML = esc(grFixed(grp.earned)) + "<small>/" + esc(grFixed(grp.required)) + "</small>";
      det.appendChild(sum);

      var scroll = el("div", "gr-rec-scroll");
      var tb = el("table");
      tb.innerHTML = "<thead><tr><th>Term</th><th>School</th><th>Code</th><th>Course</th>" +
        "<th class='num'>Credits</th><th class='num'>%</th><th class='let'>Grade</th></tr></thead>";
      var body = el("tbody");
      rows.forEach(function (r) {
        var tr = el("tr");
        tr.innerHTML = "<td></td><td><span class='gr-src'><i></i><span></span></span></td><td class='code'></td>" +
          "<td class='t'></td><td class='num'></td><td class='num'></td><td class='let'></td>";
        tr.children[0].textContent = grYY(r.year);
        tr.querySelector(".gr-src").classList.add(r.src);
        tr.querySelector(".gr-src span").textContent = r.src === "e" ? "EHS" : "Transfer";
        tr.children[2].textContent = r.code || "—";
        tr.children[3].textContent = r.title;
        r.flags.forEach(function (f) { tr.children[3].appendChild(el("em", "gr-flag", esc(f))); });
        tr.children[4].textContent = grFixed(r.credits);
        tr.children[5].textContent = r.mark;
        tr.children[6].textContent = r.letter || "—";
        body.appendChild(tr);
      });
      tb.appendChild(body);
      scroll.appendChild(tb);
      det.appendChild(scroll);

      var foot = el("p", "gr-rec-foot");
      var over = Math.round((grp.earned - grp.required) * 1000) / 1000;
      foot.innerHTML = "<span>Earned <b></b></span><em></em>";
      foot.querySelector("b").textContent = grFixed(grp.earned);
      var em = foot.querySelector("em");
      if (grp.left > 0) { em.className = "left"; em.textContent = grCredits(grp.left) + " remaining"; }
      else { em.className = "ok"; em.textContent = "Requirement met" + (over > 0 ? " · +" + grFixed(over) + " surplus" : ""); }
      det.appendChild(foot);
      sec.appendChild(det);
    });
    return sec;
  }

  function gradNotes(g) {
    var sec = el("section", "gr-notes");
    sec.appendChild(el("h3", null, "How these numbers are worked out"));
    var ul = el("ul");
    g.assumptions.concat([
      "Diploma rules follow Excel High School’s published requirements: the " + g.track.total +
      "-credit track, up to " + g.track.transferCap + " credits by transfer, at least " + g.track.minAtEhs +
      " earned at EHS, and a 60% passing mark."
    ]).forEach(function (a) { var li = el("li"); li.textContent = a; ul.appendChild(li); });
    sec.appendChild(ul);
    return sec;
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

     What is not theirs is the look: it is the Mac's. A sidebar the way System
     Settings draws one — translucent, grouped, each place on a tile of its own
     colour so it is found without reading, the place you are on lit in the
     accent — above a window of inset grouped cards (console.css). The numbers
     beside a row are the only thing in the rail that changes.

     And nothing in the rail is a claim. A count beside a row is a count of
     rows the server returned; the charts on Summary are drawn only from series
     the record actually has (grades entered, by day, from the audit trail) or
     from a distribution of rows it returned, never a trend nobody measured. */

  var ASSESSMENT_STATES = ["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "LIVE", "SUBMITTED", "SCORING", "RESULTS_READY", "RELEASED", "ARCHIVED"];

  var ASSESSMENT_TABS = ["Overview", "Experience", "Content", "Students", "Sessions", "Results", "Security", "Activity", "Versions"];

  /* Two consoles, never one. The address decides which: /admin is the
     school's, run by its administrators; /teacher is a teacher's own courses.
     An administrator who also teaches opens /teacher for those — and the two
     are not drawn as one screen with everything on it, because running a
     school and marking a class are different jobs done at different times,
     and a console that offers both is a console that is clear about neither. */
  function consoleMode() {
    var H = window.OPLO_HOME, m = H && H.parse ? H.parse(location.pathname).mode : null;
    return S.me && S.me.role === "admin" && m !== "teacher" ? "admin" : "teacher";
  }

  /* The school's console, as a tree: a place for every job a school office
     does, each under the one heading someone would look for it. Groups fold
     the way a Finder sidebar does. A place whose records the platform does
     not keep yet is still here, and says so, rather than being left out —
     a map with holes drawn in is more use than one that hides them. */
  var ADMIN_TREE = [
    { k: "today", name: "Overview", icon: "summary" },
    { name: "Academics", icon: "cap", kids: [
      { k: "gradebook", name: "Gradebook" }, { k: "assessments", name: "Assessments" }, { k: "standards", name: "Standards" },
      { k: "gpa", name: "GPA" }, { k: "transcripts", name: "Transcripts" }, { k: "reportcards", name: "Report Cards" },
      { k: "graduation", name: "Graduation" }] },
    { name: "Students", icon: "people", kids: [
      { k: "students", name: "Student 360" }, { k: "enrollment", name: "Enrollment" }, { k: "rosters", name: "Rosters" },
      { k: "records", name: "Records" }, { k: "documents", name: "Documents" }, { k: "guardians", name: "Guardians" }] },
    { name: "Analytics", icon: "chart", kids: [
      { k: "analytics", name: "Academic" }, { k: "an-assessments", name: "Assessments" }, { k: "an-standards", name: "Standards" },
      { k: "growth", name: "Growth" }, { k: "groups", name: "Groups" }, { k: "longitudinal", name: "Longitudinal" }] },
    { name: "Staff", icon: "badge", kids: [
      { k: "staff", name: "Teachers" }, { k: "departments", name: "Departments" }, { k: "permissions", name: "Permissions" },
      { k: "teacher-analytics", name: "Teacher Analytics" }] },
    { k: "scheduling", name: "Scheduling", icon: "calendar" },
    { k: "attendance", name: "Attendance", icon: "check" },
    { k: "behavior", name: "Behavior", icon: "flag" },
    { k: "support", name: "Student Support", icon: "heart" },
    { k: "curriculum", name: "Curriculum", icon: "books" },
    { name: "School Operations", icon: "building", kids: [
      { k: "inventory", name: "Inventory" }, { k: "lockers", name: "Lockers" }, { k: "cafeteria", name: "Cafeteria" }] },
    { name: "Data Center", icon: "server", kids: [
      { k: "sis", name: "SIS Sync" }, { k: "imports", name: "Imports" }, { k: "data", name: "Exports" },
      { k: "sftp", name: "SFTP" }, { k: "api", name: "API" }] },
    { k: "state", name: "State Reporting", icon: "landmark" },
    { k: "security", name: "Security", icon: "shield" },
    { k: "activity", name: "Audit Log", icon: "wave" },
    { k: "system", name: "Settings", icon: "gear" }
  ];
  var ADMIN_SECTIONS = [];
  ADMIN_TREE.forEach(function (t) {
    if (!t.kids) { ADMIN_SECTIONS.push({ k: t.k, name: t.name, group: null, icon: t.icon }); return; }
    t.kids.forEach(function (c) { ADMIN_SECTIONS.push({ k: c.k, name: c.name, group: t.name, icon: t.icon }); });
  });
  // Reached from other screens, not places in the sidebar: one course's full
  // gradebook, missing work across the school, and the older names of places.
  ADMIN_SECTIONS.push(
    { k: "roster", name: "Gradebook", group: "Academics", icon: "table", hidden: true },
    { k: "missing", name: "Missing work", group: "Students", icon: "tray", hidden: true },
    { k: "courses", name: "Courses", group: "Curriculum", icon: "books", hidden: true },
    { k: "people", name: "Directory", group: "Staff", icon: "person", hidden: true });

  function allowedTabs() {
    if (!S.me || (S.me.role !== "admin" && S.me.role !== "teacher")) return [];
    return consoleMode() === "admin" ? ADMIN_SECTIONS : TEACHER_SECTIONS;
  }

  function sectionNamed(k) {
    var found = allowedTabs().filter(function (t) { return t.k === k; })[0];
    return found || allowedTabs()[0];
  }

  /* An administrator who makes a course is not thereby its teacher. The
     server enrols whoever writes a course as its teacher — so a teacher can
     edit what they just made — and in the school's console that enrolment is
     taken back: the course is staffed by assigning a teacher to it. */
  function unteachIfAdmin(made) {
    if (consoleMode() !== "admin" || !made || !made.id) return made;
    return API.courses.enrol(made.id, S.me.id, "teacher", true)
      .then(function () { SCHOOL = null; return made; }, function () { return made; });
  }

  /* ------------------------------------------------------------ The school
     Everything the two consoles' screens are drawn from, in one read: the
     courses (the whole school's for an administrator — who may teach none of
     them — or the courses a teacher teaches), each with its gradebook, its
     roster and its latest mark changes. The reporting endpoints answer only
     for courses the caller teaches, so the school's view is assembled from
     the reads an administrator is allowed: every course, its gradebook, its
     members, its history. Kept for a minute, so moving between screens does
     not read it all again. */
  var SCHOOL = null;
  var HISTORY_LIMIT = 200;
  function loadSchool(force) {
    var mode = consoleMode();
    if (!force && SCHOOL && SCHOOL.mode === mode && Date.now() - SCHOOL.at < 60000) return SCHOOL.promise;
    var list = mode === "admin" ? API.courses.all(S.me.orgId)
      : API.courses.mine().then(function (cs) {
          return cs.filter(function (c) { return c.myRole === "teacher" || c.myRole === "assistant"; });
        });
    var p = list.then(function (courses) {
      return Promise.all(courses.map(function (c) {
        return Promise.all([
          API.courses.gradebook(c.id).catch(function () { return null; }),
          API.courses.members(c.id).catch(function () { return []; }),
          API.grades.history({ courseId: c.id, limit: HISTORY_LIMIT }).catch(function () { return []; })
        ]).then(function (r) { return { course: c, book: r[0], members: r[1] || [], events: r[2] || [] }; });
      }));
    }).then(buildSchool);
    SCHOOL = { at: Date.now(), mode: mode, promise: p };
    p.catch(function () { SCHOOL = null; });
    return p;
  }

  function letterKey(letter) {
    var L = String(letter || "").charAt(0).toUpperCase();
    return L === "E" ? "F" : "ABCDF".indexOf(L) > -1 ? L : null;
  }

  function buildSchool(rows) {
    var now = Date.now(), students = {}, teachers = {}, events = [], courses = [];
    var capped = false;
    rows.forEach(function (row) {
      var c = row.course, gb = row.book || {}, roster = gb.students || [];
      var due = {}, dueList = [];
      (gb.assignments || []).forEach(function (a) { if (a.dueAt && a.dueAt <= now) { due[a.id] = a; dueList.push(a); } });
      var graded = {};
      (gb.grades || []).forEach(function (g) { (graded[g.accountId] = graded[g.accountId] || {})[g.assignmentId] = g; });
      var sums = gb.summaries || {};
      var cs = { raw: c, book: gb, id: c.id, title: c.title, subject: c.subject, code: c.code, status: c.status, myRole: c.myRole, level: c.level,
                 students: roster.length, work: (gb.assignments || []).length, sum: 0, graded: 0, below: 0,
                 dist: { A: 0, B: 0, C: 0, D: 0, F: 0 }, cells: 0, dealt: 0, handed: 0, toMark: 0, overdue: 0, missing: 0,
                 teachers: row.members.filter(function (m) { return m.role === "teacher" || m.role === "assistant"; }), needs: [] };
      (gb.columns || []).forEach(function (col) {
        var a = due[col.assignmentId];
        if (!a) return;
        var n = (col.marked || 0) + (col.missing || 0) + (col.excused || 0) + (col.unmarked || 0);
        cs.cells += n;
        cs.dealt += n - (col.unmarked || 0);
        cs.handed += (col.marked || 0) + (col.excused || 0);
        cs.toMark += col.unmarked || 0;
        cs.missing += col.missing || 0;
        if (col.unmarked) cs.needs.push({ title: a.title, count: col.unmarked, dueAt: a.dueAt, courseId: c.id, course: c.title });
      });
      roster.forEach(function (s) {
        var sm = sums[s.id], mine = graded[s.id] || {};
        var missing = 0, waiting = 0;
        dueList.forEach(function (a) {
          var g = mine[a.id];
          if (!g || (g.score == null && g.status !== "missing" && g.status !== "excused")) waiting++;
          else if (g.status === "missing") missing++;
        });
        var grade = sm && sm.percent != null ? { percent: sm.percent, letter: sm.letter } : null;
        if (grade) {
          cs.sum += grade.percent; cs.graded++;
          if (grade.percent < CX_PASS) cs.below++;
          var k = letterKey(grade.letter);
          if (k) cs.dist[k]++;
        }
        var st = students[s.id] || (students[s.id] = { id: s.id, name: s.name, firstName: s.firstName, email: s.email,
          initials: s.initials, hue: s.hue, courses: [] });
        st.courses.push({ courseId: c.id, title: c.title, subject: c.subject, grade: grade, missing: missing, unmarked: waiting });
      });
      cs.average = cs.graded ? Math.round(cs.sum / cs.graded) : null;
      cs.atRisk = cs.below;
      cs.teachers.forEach(function (t) {
        var tt = teachers[t.id] || (teachers[t.id] = { id: t.id, name: t.name, firstName: t.firstName, email: t.email,
          initials: t.initials, hue: t.hue, courses: [], students: 0, cells: 0, dealt: 0, toMark: 0, last: 0, marks: 0 });
        tt.courses.push(cs);
        tt.students += cs.students;
        tt.cells += cs.cells; tt.dealt += cs.dealt; tt.toMark += cs.toMark;
      });
      var byId = {};
      roster.forEach(function (s) { byId[s.id] = s; });
      if (row.events.length >= HISTORY_LIMIT) capped = true;
      row.events.forEach(function (e) {
        var s = byId[e.accountId] || {};
        events.push(Object.assign({}, e, { courseId: c.id, courseTitle: c.title,
          student: { id: e.accountId, name: s.name || "A student", initials: s.initials, hue: s.hue } }));
        var t = teachers[e.actorId];
        if (t) { t.marks++; if (e.at > t.last) t.last = e.at; }
      });
      courses.push(cs);
    });
    events.sort(function (a, b) { return b.at - a.at; });
    var list = Object.keys(students).map(function (id) {
      var s = students[id], g = s.courses.filter(function (c) { return c.grade; });
      s.standing = g.length ? Math.round(g.reduce(function (a, c) { return a + c.grade.percent; }, 0) / g.length) : null;
      s.missing = s.courses.reduce(function (a, c) { return a + c.missing; }, 0);
      s.unmarked = s.courses.reduce(function (a, c) { return a + c.unmarked; }, 0);
      return s;
    }).sort(function (a, b) { return String(a.name || "").localeCompare(String(b.name || "")); });
    var staff = Object.keys(teachers).map(function (id) { return teachers[id]; })
      .sort(function (a, b) { return String(a.name || "").localeCompare(String(b.name || "")); });
    return {
      courses: courses, students: list, teachers: staff, events: events, capped: capped,
      totals: { students: list.length, belowPass: list.filter(function (s) { return s.standing != null && s.standing < CX_PASS; }).length,
                missing: list.reduce(function (a, s) { return a + s.missing; }, 0) }
    };
  }


  /* Each place in the sidebar has a glyph drawn like an SF Symbol — one line
     weight, rounded, in the label's own grey — so the shape is how you find a
     place without reading, and nothing in the sidebar competes with the page. */
  var CX_ICONS = {
    summary: '<rect x="4" y="4" width="7" height="7" rx="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.8"/>',
    checklist: '<path d="M10 6.5h10M10 12h10M10 17.5h10"/><path d="m3.8 6.4 1.4 1.4L7.8 5M3.8 11.9l1.4 1.4 2.6-2.8M3.8 17.4l1.4 1.4 2.6-2.8"/>',
    books: '<path d="M4.5 4.5h4v15h-4zM9.5 4.5h4v15h-4z"/><path d="m14.6 5.6 3.7-1 3.3 14.4-3.7 1z"/>',
    table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15"/>',
    people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.6 14.1a5 5 0 0 1 6 5"/>',
    wave: '<path d="M2.5 12h4l2.5-6.5 5 13 2.5-6.5h5"/>',
    doc: '<path d="M7 3.5h6.5l5 5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M13.5 3.5v5h5M9 13h6M9 16.5h4"/>',
    person: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="10" r="3"/><path d="M6.6 18a6.4 6.4 0 0 1 10.8 0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    cap: '<path d="M2 9.5 12 5l10 4.5L12 14z"/><path d="M6 11.6v4.1c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.1"/><path d="M22 9.5v5"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M2.5 20h19"/>',
    tray: '<path d="M3.5 13.5 6 5.5h12l2.5 8V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/><path d="M3.5 13.5h5l1 2.5h5l1-2.5h5"/>',
    pencil: '<path d="M4 20h4L19.5 8.5a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    rows: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    key: '<circle cx="8" cy="14" r="4"/><path d="m11 11 8.5-8.5M16 6l2.5 2.5M14 8l2 2"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    server: '<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><path d="M8 7.5h.01M8 16.5h.01"/>',
    sparkle: '<path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/>',
    badge: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><circle cx="12" cy="10.5" r="2.6"/><path d="M8.3 16.8a3.9 3.9 0 0 1 7.4 0M10 6.5h4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.2 2.6 2.6 5-5.2"/>',
    flag: '<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>',
    heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z"/>',
    building: '<path d="M4.5 20.5V5.5l7.5-2.5v17.5M12 8.5h7.5v12M2.5 20.5h19"/><path d="M7.5 8h1.5M7.5 11.5h1.5M7.5 15h1.5M15 12h1.5M15 15.5h1.5"/>',
    landmark: '<path d="M3 9.5 12 4l9 5.5zM4.5 20h15M3 20.5h18"/><path d="M6.5 11.5v6M10.2 11.5v6M13.8 11.5v6M17.5 11.5v6"/>',
    chev: '<path d="m9.5 6 6 6-6 6"/>'
  };
  function cxIcon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (CX_ICONS[name] || CX_ICONS.summary) + "</svg>";
  }

  /* ======================================================= The teacher's rail
     A map of how a teacher's day goes, not a list of everything OEdu does:
     Today, then Teach, Learning, Students, Insights, Communicate. Each group
     is a heading and a few places; what lives below a place (the gradebook's
     five views, an assignment's filters) is inside the place, not in the rail,
     so the rail stays two levels deep and never becomes the whole product.

     Full when there is room, icons only when there is not — and never
     wordless: a collapsed row says its name the moment the pointer or the
     keyboard reaches it. The rail can be widened a little and no more; the
     gradebook is what deserves the width. Kept on this device. */
  var TEACHER_TREE = [
    { head: "Home", items: [{ k: "today", name: "Today", icon: "sun" }] },
    { head: "Teach", items: [
      { k: "courses", name: "Courses", icon: "books", more: true },
      { k: "roster", name: "Gradebook", icon: "table" },
      { k: "tograde", name: "To Grade", icon: "inbox" },
      { k: "assignments", name: "Assignments", icon: "stack" },
      { k: "assessments", name: "Assessments", icon: "checklist" }] },
    { head: "Learning", items: [
      { k: "lessons", name: "Lessons", icon: "play" },
      { k: "standards", name: "Standards", icon: "target" },
      { k: "curriculum", name: "Curriculum", icon: "path" },
      { k: "resources", name: "Resources", icon: "folder" }] },
    { head: "Students", items: [
      { k: "students", name: "Students", icon: "people" },
      { k: "groups", name: "Groups", icon: "groups" },
      { k: "attendance", name: "Attendance", icon: "clock" }] },
    { head: "Insights", items: [
      { k: "analytics", name: "Analytics", icon: "chart" },
      { k: "interventions", name: "Interventions", icon: "lifebuoy" }] },
    { head: "Communicate", items: [
      { k: "messages", name: "Messages", icon: "mail" },
      { k: "announcements", name: "Announcements", icon: "megaphone" }] }
  ];
  var TEACHER_FOOT = [{ k: "system", name: "Settings", icon: "gear" }, { k: "help", name: "Help", icon: "help" }];
  var TEACHER_SECTIONS = [];
  TEACHER_TREE.forEach(function (g) {
    g.items.forEach(function (t) { TEACHER_SECTIONS.push({ k: t.k, name: t.name, group: g.head, icon: t.icon }); });
  });
  TEACHER_FOOT.forEach(function (t) { TEACHER_SECTIONS.push({ k: t.k, name: t.name, group: null, icon: t.icon }); });
  // Reached from inside other places rather than from the rail.
  TEACHER_SECTIONS.push(
    { k: "activity", name: "Grade history", group: "Teach", icon: "wave", hidden: true },
    { k: "reports", name: "Reports", group: "Insights", icon: "doc", hidden: true },
    { k: "work", name: "Work", group: "Teach", icon: "stack", hidden: true },
    { k: "sets", name: "Study sets", group: "Learning", icon: "folder", hidden: true });

  Object.assign(CX_ICONS, {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M5.5 18.5l1.6-1.6M16.9 7.1l1.6-1.6"/>',
    inbox: '<path d="M3.5 13.5 6 5.5h12l2.5 8V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/><path d="M3.5 13.5h5l1 2.5h5l1-2.5h5"/><path d="m9.3 9.6 1.9 1.9 3.6-3.8"/>',
    stack: '<path d="m12 3.5 8.5 4.3L12 12 3.5 7.8z"/><path d="m3.5 12 8.5 4.3 8.5-4.3"/><path d="m3.5 16.2 8.5 4.3 8.5-4.3"/>',
    play: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8.6v6.8l5.6-3.4z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2"/>',
    path: '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8.2 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.8"/>',
    folder: '<path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.2l2 2.2H19A1.5 1.5 0 0 1 20.5 9.2V18A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z"/>',
    groups: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><circle cx="12" cy="16" r="3"/>',
    lifebuoy: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.6"/><path d="m6 6 3.4 3.4M14.6 14.6 18 18M18 6l-3.4 3.4M9.4 14.6 6 18"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.2"/><path d="m4 7 8 6 8-6"/>',
    megaphone: '<path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M16.5 9a4 4 0 0 1 0 6"/><path d="M8 15.5 9 20"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.4a2.4 2.4 0 1 1 3.3 2.2c-.7.3-1 .8-1 1.5v.4"/><circle cx="12" cy="16.6" r=".5"/>',
    sidebar: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/>',
    down: '<path d="m7 10 5 5 5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="m14.5 6-6 6 6 6"/>'
  });

  /* ----------------------------------------------------- Size and state */
  var TR_KEY = "oplo.teach.rail", TR_MIN = 240, TR_MAX = 300, TR_DEF = 252, TR_NARROW = 1180;
  function trPrefs() {
    try { return JSON.parse(localStorage.getItem(TR_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function trSave(p) {
    try { localStorage.setItem(TR_KEY, JSON.stringify(p)); } catch (e) { /* private mode */ }
  }
  function trWidth() { return Math.max(TR_MIN, Math.min(TR_MAX, Number(trPrefs().w) || TR_DEF)); }
  // Collapsed when the teacher chose it, or when the window is too narrow to
  // give the gradebook its room — then the full rail only peeks over the page.
  function trMini() { return !!trPrefs().mini || window.innerWidth < TR_NARROW; }
  function trApply() {
    var b = document.body, teach = b.classList.contains("t-console");
    if (!teach) { b.style.removeProperty("--rail-w"); b.classList.remove("rail-mini", "rail-peek"); return; }
    var mini = trMini();
    b.classList.toggle("rail-mini", mini);
    if (!mini) b.classList.remove("rail-peek");
    b.style.setProperty("--rail-w", (mini ? 64 : trWidth()) + "px");
    b.style.setProperty("--rail-full", trWidth() + "px");
    var t = $("#rail").querySelector(".tr-toggle");
    if (t) {
      var open = !mini || b.classList.contains("rail-peek");
      t.setAttribute("aria-label", open ? "Collapse the sidebar" : "Expand the sidebar");
      t.setAttribute("aria-expanded", String(open));
      t.classList.toggle("shut", !open);
    }
  }
  function trToggle() {
    var p = trPrefs(), b = document.body;
    if (window.innerWidth < TR_NARROW && !p.mini) {
      // Too narrow to keep it open beside the page: show it over the page.
      b.classList.toggle("rail-peek");
      trApply();
      return;
    }
    p.mini = !p.mini;
    trSave(p);
    b.classList.add("rail-anim");
    trApply();
    setTimeout(function () { b.classList.remove("rail-anim"); }, 260);
    trTip(null);
  }
  window.addEventListener("resize", function () { if (document.body.classList.contains("t-console")) trApply(); });

  /* ------------------------------------------------------------ The tip
     The one label a collapsed row shows: small, instant, beside the row. */
  function trTip(node, text) {
    var tip = $("#trTip");
    if (!tip) {
      tip = el("div", "tr-tip");
      tip.id = "trTip";
      tip.setAttribute("role", "tooltip");
      document.body.appendChild(tip);
    }
    if (!node || !document.body.classList.contains("rail-mini") || document.body.classList.contains("rail-peek")) {
      tip.classList.remove("on");
      return;
    }
    var r = node.getBoundingClientRect();
    tip.textContent = text;
    tip.style.top = Math.round(r.top + r.height / 2) + "px";
    tip.style.left = Math.round(r.right + 10) + "px";
    tip.classList.add("on");
  }

  /* --------------------------------------------------------- Popovers
     A small panel beside what opened it — the course switcher, the profile
     menu. Escape or a click anywhere else puts it away. */
  var TR_POP = null;
  function trPop(anchor, node, o) {
    o = o || {};
    trPopClose();
    var pop = el("div", "tr-pop" + (o.cls ? " " + o.cls : ""));
    pop.setAttribute("role", "dialog");
    pop.appendChild(node);
    document.body.appendChild(pop);
    var r = anchor.getBoundingClientRect(), h = pop.offsetHeight, w = pop.offsetWidth;
    var left = o.below ? r.left : r.right + 8;
    var top = o.below ? r.bottom + 6 : Math.min(r.top - 6, window.innerHeight - h - 12);
    if (o.up) top = Math.max(12, r.bottom - h);
    pop.style.left = Math.max(12, Math.min(left, window.innerWidth - w - 12)) + "px";
    pop.style.top = Math.max(12, top) + "px";
    anchor.setAttribute("aria-expanded", "true");
    function away(e) {
      if (e.type === "keydown" && e.key !== "Escape") return;
      if (e.type === "mousedown" && (pop.contains(e.target) || anchor.contains(e.target))) return;
      trPopClose();
    }
    document.addEventListener("mousedown", away, true);
    document.addEventListener("keydown", away, true);
    TR_POP = { pop: pop, anchor: anchor, away: away };
    var first = pop.querySelector("button, [tabindex]");
    if (first && o.focus !== false) first.focus();
    return TR_POP;
  }
  function trPopClose() {
    if (!TR_POP) return;
    document.removeEventListener("mousedown", TR_POP.away, true);
    document.removeEventListener("keydown", TR_POP.away, true);
    TR_POP.anchor.setAttribute("aria-expanded", "false");
    if (TR_POP.pop.parentNode) TR_POP.pop.parentNode.removeChild(TR_POP.pop);
    TR_POP = null;
  }
  function trMenuRow(icon, label, go, right) {
    var b = el("button", "tr-mrow");
    b.type = "button";
    b.innerHTML = (icon ? '<span class="ic">' + cxIcon(icon) + "</span>" : '<span class="ic"></span>') +
      '<span class="nm">' + esc(label) + "</span>" + (right ? '<span class="r">' + right + "</span>" : "");
    b.addEventListener("click", function () { trPopClose(); go(); });
    return b;
  }

  /* --------------------------------------------------- The current course
     Most of a teacher's places are about one course at a time. Which one is
     kept here, shown on the profile card and at the head of the gradebook,
     and changed from either — never by growing the rail a row per course. */
  var TEACH_COURSES = null;
  function teachCourses(force) {
    if (!force && TEACH_COURSES && Date.now() - TEACH_COURSES.at < 60000) return TEACH_COURSES.p;
    var p = API.courses.mine().then(function (cs) {
      return cs.filter(function (c) { return c.myRole === "teacher" || c.myRole === "assistant"; });
    });
    TEACH_COURSES = { at: Date.now(), p: p };
    p.catch(function () { TEACH_COURSES = null; });
    return p;
  }
  function currentCourse(list) {
    if (!list || !list.length) return null;
    var hit = list.filter(function (c) { return c.id === S.courseId; })[0];
    if (!hit) { hit = list[0]; S.courseId = hit.id; }
    return hit;
  }
  function pickCourse(id) {
    S.courseId = id;
    try { localStorage.setItem("oplo.teach.course", id); } catch (e) { /* private mode */ }
    trMe();
    if (document.body.classList.contains("is-console")) openAdmin(true, S.tab);
  }
  try { if (!S.courseId) S.courseId = localStorage.getItem("oplo.teach.course") || null; } catch (e) { /* private mode */ }

  function courseSwitcher(anchor) {
    var box = el("div", "tr-switch");
    box.appendChild(el("p", "tr-phead", "Your courses"));
    var list = el("div", "tr-plist");
    list.appendChild(el("p", "tr-pnote", "Loading…"));
    box.appendChild(list);
    trPop(anchor, box, { below: !!anchor.closest(".tr-coursepill"), focus: false });
    Promise.all([teachCourses(), loadSchool().catch(function () { return null; })]).then(function (r) {
      var cs = r[0], d = r[1], n = {};
      if (d) d.courses.forEach(function (c) { n[c.id] = c.students; });
      list.innerHTML = "";
      if (!cs.length) list.appendChild(el("p", "tr-pnote", "You aren’t teaching a course yet."));
      var cur = currentCourse(cs);
      cs.forEach(function (c) {
        var b = el("button", "tr-course" + (cur && c.id === cur.id ? " on" : ""));
        b.type = "button";
        b.setAttribute("aria-current", String(!!(cur && c.id === cur.id)));
        b.innerHTML = '<i aria-hidden="true"></i><span><b>' + esc(c.title) + "</b><span>" +
          (n[c.id] != null ? cxPlural(n[c.id], "student") : esc(c.subject || c.code || "")) + "</span></span>";
        b.addEventListener("click", function () { trPopClose(); pickCourse(c.id); });
        list.appendChild(b);
      });
      var all = trMenuRow("books", "All courses", function () { openAdmin(false, "courses"); }, "›");
      all.classList.add("tr-pfoot");
      box.appendChild(all);
      var first = list.querySelector(".tr-course");
      if (first) first.focus();
    }, function () { list.innerHTML = ""; list.appendChild(el("p", "tr-pnote", "Couldn’t load your courses.")); });
  }

  /* The card at the foot: who is teaching, and in which course right now. */
  function trMe() {
    var me = $("#rail").querySelector(".tr-me");
    if (!me) return;
    teachCourses().then(function (cs) {
      var c = currentCourse(cs);
      var sub = me.querySelector(".t span");
      if (sub) sub.textContent = c ? c.title : "Teacher";
    }, function () { /* the name still stands */ });
  }

  function otherHomes() {
    var H = window.OPLO_HOME;
    if (!H || !S.me) return [];
    var at = H.parse(location.pathname);
    var names = { admin: "School console", student: "Student view", parent: "Family view" };
    return H.allowed(S.me.roles || []).filter(function (m) { return m !== "teacher" && names[m]; })
      .map(function (m) { return { mode: m, name: names[m], href: H.pathFor(at.root, m) }; });
  }

  function profileMenu(anchor) {
    var box = el("div", "tr-profile");
    var head = el("div", "tr-phero");
    head.appendChild(avatarFor(S.me));
    head.appendChild(el("span", "t", "<b>" + esc(S.me.name) + "</b><span>Teacher</span><span>" + esc(schoolName()) + "</span>"));
    box.appendChild(head);
    box.appendChild(el("hr", "tr-sep"));
    box.appendChild(trMenuRow("person", "Profile", function () { openAccount(); }));
    box.appendChild(trMenuRow("gear", "Preferences", function () { openAdmin(false, "system"); }));
    // Appearance is three choices, so it is answered right here.
    var look = el("div", "tr-mrow tr-look");
    look.innerHTML = '<span class="ic">' + cxIcon("moon") + '</span><span class="nm">Appearance</span>';
    var seg = el("div", "cn-seg");
    [["light", "Light"], ["dark", "Dark"], ["auto", "Auto"]].forEach(function (o) {
      var b = el("button", "cn-segb" + (currentAppearance() === o[0] ? " on" : ""), o[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        applyAppearance(o[0]);
        [].forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); });
      });
      seg.appendChild(b);
    });
    look.appendChild(seg);
    box.appendChild(look);
    box.appendChild(trMenuRow("alert", "Notifications", function () { S.helpAt = "notify"; openAdmin(false, "help"); }));
    box.appendChild(trMenuRow("key", "Keyboard shortcuts", function () { S.helpAt = "keys"; openAdmin(false, "help"); }));
    box.appendChild(el("hr", "tr-sep"));
    var homes = otherHomes();
    if (homes.length) {
      var sw = el("div", "tr-switchrole");
      sw.appendChild(el("p", "tr-phead", "Switch role"));
      homes.forEach(function (h) {
        sw.appendChild(trMenuRow(h.mode === "admin" ? "building" : h.mode === "parent" ? "heart" : "cap", h.name,
          function () { location.href = h.href; }, "›"));
      });
      box.appendChild(sw);
      box.appendChild(el("hr", "tr-sep"));
    }
    box.appendChild(trMenuRow(null, "Sign out", function () { if (confirm("Sign out of OEdu?")) signOut(); }));
    trPop(anchor, box, { up: true });
  }

  /* ------------------------------------------------------------ Drawing */
  function drawTeachRail(rail) {
    rail.innerHTML = "";
    rail.classList.add("t-rail");

    var top = el("div", "tr-top");
    top.innerHTML = '<span class="tr-logo" aria-hidden="true"><svg viewBox="12 12 76 76"><path fill="currentColor" fill-rule="evenodd" ' +
      'd="M12,40 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0 M32,60 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0"/></svg></span><b>OEdu</b>';
    var tog = el("button", "tr-toggle");
    tog.type = "button";
    tog.innerHTML = cxIcon("sidebar");
    tog.title = "Show or hide the sidebar (" + (/Mac|iP(hone|ad)/.test(navigator.platform) ? "⌘" : "Ctrl ") + "\\)";
    tog.addEventListener("click", trToggle);
    top.appendChild(tog);
    rail.appendChild(top);

    var find = el("button", "cn-find tr-find");
    find.type = "button";
    find.dataset.tip = "Search";
    find.innerHTML = cxIcon("search") + "<span>Search</span><kbd>" + (/Mac|iP(hone|ad)/.test(navigator.platform) ? "⌘K" : "Ctrl K") + "</kbd>";
    find.addEventListener("click", function () { document.body.classList.remove("rail-peek"); trApply(); openFinder(); });
    rail.appendChild(find);

    var nav = el("nav", "cn-nav tr-nav");
    nav.setAttribute("aria-label", "Teacher console");
    function place(t) {
      var b = el("button", "cn-item");
      b.type = "button";
      b.dataset.k = t.k;
      b.dataset.tip = t.name;
      b.innerHTML = '<span class="ic">' + cxIcon(t.icon) + '</span><span class="nm">' + esc(t.name) + '</span><span class="ct"></span>';
      b.addEventListener("click", function () {
        document.body.classList.remove("rail-peek");
        trApply();
        openAdmin(false, t.k);
      });
      if (!t.more) return b;
      var row = el("div", "tr-row");
      row.appendChild(b);
      var more = el("button", "tr-more");
      more.type = "button";
      more.setAttribute("aria-label", "Switch course");
      more.setAttribute("aria-haspopup", "dialog");
      more.innerHTML = cxIcon("chev");
      more.addEventListener("click", function () { courseSwitcher(more); });
      row.appendChild(more);
      return row;
    }
    TEACHER_TREE.forEach(function (g) {
      var sec = el("div", "tr-sec");
      sec.appendChild(el("p", "tr-head", esc(g.head)));
      g.items.forEach(function (t) { sec.appendChild(place(t)); });
      nav.appendChild(sec);
    });
    rail.appendChild(nav);

    var foot = el("div", "tr-foot");
    TEACHER_FOOT.forEach(function (t) { foot.appendChild(place(t)); });
    var me = el("button", "tr-me");
    me.type = "button";
    me.dataset.tip = S.me.name;
    me.setAttribute("aria-haspopup", "dialog");
    me.appendChild(avatarFor(S.me));
    me.appendChild(el("span", "t", "<b>" + esc(S.me.name) + "</b><span>Teacher</span>"));
    me.addEventListener("click", function () { profileMenu(me); });
    foot.appendChild(me);
    rail.appendChild(foot);

    // Widen it a little, and no more.
    var grip = el("div", "tr-grip");
    grip.setAttribute("role", "separator");
    grip.setAttribute("aria-orientation", "vertical");
    grip.setAttribute("aria-label", "Sidebar width");
    grip.tabIndex = 0;
    grip.addEventListener("pointerdown", function (e) {
      if (trMini()) return;
      e.preventDefault();
      grip.setPointerCapture(e.pointerId);
      document.body.classList.add("rail-drag");
      function move(ev) {
        var p = trPrefs();
        p.w = Math.max(TR_MIN, Math.min(TR_MAX, Math.round(ev.clientX)));
        trSave(p);
        trApply();
      }
      function up() {
        grip.removeEventListener("pointermove", move);
        grip.removeEventListener("pointerup", up);
        document.body.classList.remove("rail-drag");
      }
      grip.addEventListener("pointermove", move);
      grip.addEventListener("pointerup", up);
    });
    grip.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      var p = trPrefs();
      p.w = Math.max(TR_MIN, Math.min(TR_MAX, trWidth() + (e.key === "ArrowRight" ? 8 : -8)));
      trSave(p);
      trApply();
    });
    grip.addEventListener("dblclick", function () { var p = trPrefs(); delete p.w; trSave(p); trApply(); });
    rail.appendChild(grip);

    // The collapsed rail's labels.
    rail.addEventListener("mouseover", function (e) {
      var t = e.target.closest && e.target.closest("[data-tip]");
      if (t && rail.contains(t)) trTip(t, t.dataset.tip); else trTip(null);
    });
    rail.addEventListener("mouseleave", function () { trTip(null); });
    rail.addEventListener("focusin", function (e) {
      var t = e.target.closest && e.target.closest("[data-tip]");
      trTip(t || null, t ? t.dataset.tip : "");
    });
    rail.addEventListener("focusout", function () { trTip(null); });
    rail.addEventListener("click", function () { trTip(null); });

    // A peeking rail goes away when the page is touched.
    document.addEventListener("mousedown", function (e) {
      if (!document.body.classList.contains("rail-peek") || rail.contains(e.target)) return;
      document.body.classList.remove("rail-peek");
      trApply();
    }, true);

    trApply();
    trMe();
    teachCounts();
  }

  /* What waits for the teacher, beside To Grade. Read from the same books the
     pages draw from, so the rail and the page never disagree. */
  function teachCounts() {
    loadSchool().then(function (d) { railCount("tograde", gradeQueue(d).now.length); }, function () { /* no number */ });
  }

  /* Light, dark, or whatever the Mac is set to. Kept on this device, like
     the density: it is how one person likes to look at the console, not a
     setting of the school. */
  var APPEARANCE = ["light", "dark", "auto"];
  function applyAppearance(a) {
    if (APPEARANCE.indexOf(a) < 0) a = "light";
    document.body.dataset.appearance = a;
    try { localStorage.setItem("oplo.console.appearance", a); } catch (e) { /* private mode */ }
  }
  function currentAppearance() {
    try { return localStorage.getItem("oplo.console.appearance") || "light"; }
    catch (e) { return "light"; }
  }

  /* Built once and kept. The rail must not be torn down and rebuilt on every
     navigation — a list that redraws under the pointer is a list you cannot
     aim at, and the one thing a rail owes you is that it never moves. */
  function drawRail() {
    var rail = $("#rail");
    if (rail.dataset.built === "1") { markRail(); return; }
    rail.innerHTML = "";
    if (consoleMode() !== "admin") { drawTeachRail(rail); rail.dataset.built = "1"; markRail(); return; }

    // The school, at the head: whose console this is.
    var school = el("div", "cn-school");
    school.innerHTML = '<span class="logo">' + cxIcon("cap") + "</span><span><b>" + esc(schoolName()) +
      "</b><span>" + (consoleMode() === "admin" ? "School console" : "Teacher console") + "</span></span>";
    rail.appendChild(school);

    var find = el("button", "cn-find");
    find.type = "button";
    find.innerHTML = cxIcon("search") + "<span>Search</span><kbd>" +
      (/Mac|iP(hone|ad)/.test(navigator.platform) ? "⌘K" : "Ctrl K") + "</kbd>";
    find.addEventListener("click", openFinder);
    rail.appendChild(find);

    var nav = el("nav", "cn-nav");
    nav.setAttribute("aria-label", "Console");
    function place(t, icon) {
      var b = el("button", "cn-item");
      b.type = "button";
      b.dataset.k = t.k;
      if (icon) b.innerHTML = '<span class="ic">' + cxIcon(icon) + "</span>";
      b.appendChild(el("span", "nm", esc(t.name)));
      b.appendChild(el("span", "ct"));
      b.addEventListener("click", function () { openAdmin(false, t.k); });
      return b;
    }
    if (consoleMode() === "admin") {
      ADMIN_TREE.forEach(function (t) {
        if (!t.kids) { nav.appendChild(place(t, t.icon)); return; }
        // A group: its row folds and unfolds; opening one you are not in
        // also goes to its first place, the way a Finder folder shows what is in it.
        var g = el("button", "cn-item grp");
        g.type = "button";
        g.dataset.group = t.name;
        g.setAttribute("aria-expanded", "false");
        g.innerHTML = '<span class="ic">' + cxIcon(t.icon) + '</span><span class="nm">' + esc(t.name) +
          '</span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          CX_ICONS.chev + "</svg>";
        var kids = el("div", "cn-kids");
        t.kids.forEach(function (c) { kids.appendChild(place(c)); });
        g.addEventListener("click", function () {
          var open = !g.classList.contains("open");
          railFold(t.name, open);
          if (open && !t.kids.some(function (c) { return c.k === S.tab; })) openAdmin(false, t.kids[0].k);
        });
        nav.appendChild(g);
        nav.appendChild(kids);
      });
    } else {
      allowedTabs().forEach(function (t) { if (!t.hidden) nav.appendChild(place(t, t.icon)); });
    }
    rail.appendChild(nav);

    /* The foot: who is signed in, which opens their account, and signing
       out — two rows that say exactly what they do. There is deliberately no
       way from here into the student app: the console is not a mode this
       person is visiting. */
    var foot = el("div", "cn-foot");
    var who = el("button", "cn-org");
    who.type = "button";
    who.innerHTML = '<span class="av" aria-hidden="true"></span>' +
      '<span class="t"><b>' + esc(S.me.name) + "</b><span>" +
      esc(S.me.role === "admin" ? "Administrator" : "Teacher") + "</span></span>";
    var av = who.querySelector(".av");
    av.textContent = S.me.initials || "";
    av.style.background = S.me.hue || "";
    who.addEventListener("click", function () { openAccount(); });
    foot.appendChild(who);
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
    // The group you are in is always open; the others stay as you left them.
    var here = (ADMIN_SECTIONS.filter(function (t) { return t.k === S.tab; })[0] || {}).group;
    [].forEach.call(rail.querySelectorAll(".cn-item.grp"), function (g) {
      var mine = g.dataset.group === here;
      g.classList.toggle("has-on", mine);
      var open = !!RAIL_OPEN[g.dataset.group] || (mine && !RAIL_SHUT[here]);
      g.classList.toggle("open", open);
      g.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Which groups are open, kept on this device like the appearance. */
  var RAIL_OPEN = {}, RAIL_SHUT = {};
  try { RAIL_OPEN = JSON.parse(localStorage.getItem("oplo.console.rail") || "{}") || {}; } catch (e) { RAIL_OPEN = {}; }
  function railFold(name, open) {
    RAIL_OPEN[name] = open;
    if (open) delete RAIL_SHUT[name]; else RAIL_SHUT[name] = true;
    try { localStorage.setItem("oplo.console.rail", JSON.stringify(RAIL_OPEN)); } catch (e) { /* private mode */ }
    markRail();
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
    var was = S.tab;
    S.tab = sectionNamed(tab || S.tab).k;
    if (S.tab !== was) RAIL_SHUT = {};
    if (!silent) enter("admin:" + S.tab, "Console", function () { openAdmin(true, S.tab); });

    document.body.classList.add("is-console");
    document.body.classList.toggle("t-console", consoleMode() !== "admin");
    applyDensity(currentDensity());
    applyAppearance(currentAppearance());
    drawRail();
    trApply();
    trPopClose();
    closeRail();

    var v = $("#v-admin");
    v.innerHTML = "";
    var body = el("div", "admin-body");
    v.appendChild(body);
    var admin = consoleMode() === "admin";
    if (!admin) { (TEACH_TABS[S.tab] || consoleHome)(body); noFoot(); progress(null); show("admin"); return; }
    ({ today: consoleHome, assessments: admin ? tabSchoolAssessments : tabAssessments, roster: tabRoster, students: tabStudents, work: tabWork,
       sets: tabSets, reports: tabReports, courses: tabCourses, curriculum: tabCourses, activity: tabActivity,
       people: tabPeople, permissions: tabPeople, system: tabSystem, staff: tabStaff, gradebook: tabSchoolGradebook, missing: tabMissing,
       reportcards: tabReportCards, analytics: tabAnalytics, data: tabData, security: tabSecurity,
       standards: tabStandards, gpa: tabGpa, transcripts: tabTranscripts, graduation: tabGraduation,
       enrollment: tabEnrollment, rosters: tabRosters, records: tabRecords, documents: tabDocuments, guardians: tabGuardians,
       "an-assessments": tabAnAssessments, "an-standards": tabAnStandards, growth: tabGrowth, groups: tabGroups, longitudinal: tabLongitudinal,
       departments: tabDepartments, "teacher-analytics": tabTeacherAnalytics,
       scheduling: tabScheduling, attendance: tabAttendance, behavior: tabBehavior, support: tabSupport,
       inventory: tabInventory, lockers: tabLockers, cafeteria: tabCafeteria,
       sis: tabSis, imports: tabImports, sftp: tabSftp, api: tabApi, state: tabStateReporting }[S.tab] || consoleHome)(body);

    noFoot(); progress(null);
    show("admin");
  }

  /* ============================================================ Assessments
     Assessments are a first-class system in OEdu. They have states,
     versions, governance, security policies, and a lifecycle from
     DRAFT through ARCHIVED. The administrator controls governance,
     permissions, policies, publishing, monitoring, and auditability.
     The teacher controls instructional intent and assessment design.
     The student experiences the assessment itself — not the machinery. */

  /* Assessment state machine */
  var ASSESSMENT_STATES = ["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "LIVE", "SUBMITTED", "SCORING", "RESULTS_READY", "RELEASED", "ARCHIVED"];

  var ASSESSMENT_TRANSITIONS = {
    DRAFT: ["IN_REVIEW", "ARCHIVED"],
    IN_REVIEW: ["APPROVED", "DRAFT"],
    APPROVED: ["SCHEDULED", "DRAFT"],
    SCHEDULED: ["LIVE", "DRAFT"],
    LIVE: ["SUBMITTED"],
    SUBMITTED: ["SCORING"],
    SCORING: ["RESULTS_READY"],
    RESULTS_READY: ["RELEASED", "SCORING"],
    RELEASED: ["ARCHIVED"],
    ARCHIVED: []
  };

  function canTransition(from, to) {
    return (ASSESSMENT_TRANSITIONS[from] || []).indexOf(to) > -1;
  }

  var ASSESSMENT_TABS = ["Overview", "Experience", "Content", "Students", "Sessions", "Results", "Security", "Activity", "Versions"];

  /* Sample assessment data for demo purposes */
  function sampleAssessments() {
    var now = Date.now();
    return [
      { id: "asm-001", title: "Algebra I — Quadratics Benchmark", course: "Algebra I",
        state: "LIVE", version: "v2.0", createdBy: "Ms. Rivera",
        duration: 45, items: 35, students: 126,
        scheduledAt: now + 86400000 * 2, startsAt: now + 86400000 * 2 + 3600000 * 10,
        readiness: 98, createdAt: now - 86400000 * 14,
        approvedBy: "Saswat Jimac", approvedAt: now - 86400000 * 5,
        security: { testingMode: "Secure", internet: false, aiAssistance: false, calculator: true, referenceSheet: true },
        skills: { "Quadratic equations": 84, "Graph interpretation": 71, "Modeling": 76, "Reasoning": 69, "Communication": 82 },
        experiences: ["Opening", "Explore", "Investigate", "Apply", "Challenge", "Final Demonstration", "Reflection"],
        timeline: { created: now - 86400000 * 14, reviewed: now - 86400000 * 10, approved: now - 86400000 * 5, scheduled: now - 86400000 * 2, testing: now + 86400000 * 2, scoring: now + 86400000 * 4, results: now + 86400000 * 5 },
        incidents: 0, sessions: { started: 0, paused: 0, submitted: 0, interrupted: 0 }
      },
      { id: "asm-002", title: "Biology — Ecosystems Assessment", course: "Biology",
        state: "SCHEDULED", version: "v1.1", createdBy: "Mr. Chen",
        duration: 60, items: 28, students: 94,
        scheduledAt: now + 86400000 * 5, startsAt: now + 86400000 * 5 + 3600000 * 9,
        readiness: 92, createdAt: now - 86400000 * 10,
        approvedBy: "Saswat Jimac", approvedAt: now - 86400000 * 3,
        security: { testingMode: "Secure", internet: false, aiAssistance: false, calculator: true, referenceSheet: false },
        skills: { "Ecosystem dynamics": 78, "Food webs": 82, "Energy flow": 71, "Biodiversity": 75 },
        experiences: ["Opening", "Investigate", "Simulation", "Challenge", "Reflection"],
        timeline: { created: now - 86400000 * 10, reviewed: now - 86400000 * 7, approved: now - 86400000 * 3, scheduled: now - 86400000 * 1, testing: now + 86400000 * 5, scoring: now + 86400000 * 7, results: now + 86400000 * 8 },
        incidents: 0, sessions: { started: 0, paused: 0, submitted: 0, interrupted: 0 }
      },
      { id: "asm-003", title: "ELA — Argument & Evidence", course: "ELA",
        state: "IN_REVIEW", version: "v1.0", createdBy: "Ms. Williams",
        duration: 50, items: 22, students: 118,
        scheduledAt: null, startsAt: null,
        readiness: 85, createdAt: now - 86400000 * 7,
        approvedBy: null, approvedAt: null,
        security: { testingMode: "Standard", internet: true, aiAssistance: "configurable", calculator: true, referenceSheet: true },
        skills: { "Argument structure": 74, "Evidence evaluation": 68, "Counter-argument": 71, "Writing clarity": 79 },
        experiences: ["Opening", "Case Study", "Challenge", "Reflection"],
        timeline: { created: now - 86400000 * 7, reviewed: now - 86400000 * 3, approved: null, scheduled: null, testing: null, scoring: null, results: null },
        incidents: 0, sessions: { started: 0, paused: 0, submitted: 0, interrupted: 0 }
      },
      { id: "asm-004", title: "Algebra I — Unit 3 Review", course: "Algebra I",
        state: "DRAFT", version: "v1.2", createdBy: "Ms. Rivera",
        duration: 30, items: 18, students: 126,
        scheduledAt: null, startsAt: null,
        readiness: 72, createdAt: now - 86400000 * 3,
        approvedBy: null, approvedAt: null,
        security: { testingMode: "Standard", internet: true, aiAssistance: "configurable", calculator: true, referenceSheet: true },
        skills: { "Linear equations": 80, "Quadratic equations": 65, "Graph interpretation": 72 },
        experiences: ["Opening", "Practice", "Challenge", "Reflection"],
        timeline: { created: now - 86400000 * 3, reviewed: null, approved: null, scheduled: null, testing: null, scoring: null, results: null },
        incidents: 0, sessions: { started: 0, paused: 0, submitted: 0, interrupted: 0 }
      },
      { id: "asm-005", title: "Science — Forces & Motion", course: "Science",
        state: "RESULTS_READY", version: "v1.0", createdBy: "Mr. Patel",
        duration: 40, items: 25, students: 88,
        scheduledAt: null, startsAt: null,
        readiness: 100, createdAt: now - 86400000 * 21,
        approvedBy: "Saswat Jimac", approvedAt: now - 86400000 * 18,
        security: { testingMode: "Secure", internet: false, aiAssistance: false, calculator: false, referenceSheet: false },
        skills: { "Newton's laws": 81, "Force diagrams": 76, "Friction": 68, "Gravity": 73 },
        experiences: ["Opening", "Lab", "Challenge", "Final Demonstration"],
        timeline: { created: now - 86400000 * 21, reviewed: now - 86400000 * 19, approved: now - 86400000 * 18, scheduled: now - 86400000 * 15, testing: now - 86400000 * 10, scoring: now - 86400000 * 5, results: now - 86400000 * 2 },
        incidents: 1, sessions: { started: 88, paused: 2, submitted: 85, interrupted: 1 }
      },
      { id: "asm-006", title: "History — Civilizations Unit", course: "History",
        state: "APPROVED", version: "v1.0", createdBy: "Ms. Okafor",
        duration: 55, items: 30, students: 102,
        scheduledAt: now + 86400000 * 8, startsAt: now + 86400000 * 8 + 3600000 * 11,
        readiness: 95, createdAt: now - 86400000 * 12,
        approvedBy: "Saswat Jimac", approvedAt: now - 86400000 * 2,
        security: { testingMode: "Standard", internet: true, aiAssistance: "configurable", calculator: true, referenceSheet: true },
        skills: { "Historical analysis": 77, "Source evaluation": 72, "Timeline reasoning": 80, "Writing": 74 },
        experiences: ["Opening", "Investigate", "Case Study", "Challenge", "Reflection"],
        timeline: { created: now - 86400000 * 12, reviewed: now - 86400000 * 8, approved: now - 86400000 * 2, scheduled: now - 86400000 * 1, testing: now + 86400000 * 8, scoring: null, results: null },
        incidents: 0, sessions: { started: 0, paused: 0, submitted: 0, interrupted: 0 }
      }
    ];
  }

  function stateColor(state) {
    var colors = {
      DRAFT: "#6b7280", IN_REVIEW: "#d97706", APPROVED: "#7c5cfc",
      SCHEDULED: "#0060c0", LIVE: "#12915a", SUBMITTED: "#0060c0",
      SCORING: "#d97706", RESULTS_READY: "#7c5cfc", RELEASED: "#12915a", ARCHIVED: "#6b7280"
    };
    return colors[state] || "#6b7280";
  }

  function stateLabel(state) {
    return state.replace(/_/g, " ");
  }

  /* ----------------------------------------------------------- Assessments List
     The overview: what exists, in what state, who created it, when. */
  function tabAssessments(v) {
    consoleHead(v, "Academics", "Assessments",
      "Create, review, publish, monitor, and understand every assessment across your school.");

    var host = el("div");
    v.appendChild(host);

    /* Command area */
    var cmd = el("div");
    cmd.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:24px;flex-wrap:wrap;";
    var createBtn = el("button", "cn-btn strong");
    createBtn.type = "button";
    createBtn.textContent = "Create assessment";
    createBtn.addEventListener("click", function () { assessmentStudio(host); });
    cmd.appendChild(createBtn);

    var search = el("input");
    search.type = "text";
    search.placeholder = "Search assessments…";
    search.style.cssText = "padding:8px 14px;border-radius:9px;border:1px solid var(--hair);font-size:13.5px;min-width:220px;background:var(--paper);color:var(--ink);";
    search.addEventListener("input", function () { filterAssessments(search.value); });
    cmd.appendChild(search);
    host.appendChild(cmd);

    /* Status tabs */
    var tabs = el("div");
    tabs.style.cssText = "display:flex;gap:4px;margin-bottom:20px;background:var(--canvas);border-radius:100px;padding:3px;width:fit-content;";
    var filterState = "all";
    var statusTabs = [["all", "All"], ["DRAFT", "Drafts"], ["SCHEDULED", "Scheduled"], ["LIVE", "Live"], ["RESULTS_READY", "Completed"]];
    statusTabs.forEach(function (t) {
      var b = el("button", "asm-tab" + (t[0] === "all" ? " asm-tab-on" : ""));
      b.type = "button";
      b.textContent = t[1];
      b.addEventListener("click", function () {
        filterState = t[0];
        [].forEach.call(tabs.children, function (x) { x.classList.remove("asm-tab-on"); });
        b.classList.add("asm-tab-on");
        renderAssessments(v, filterState, search.value);
      });
      tabs.appendChild(b);
    });
    host.appendChild(tabs);

    /* Results area */
    var results = el("div");
    results.id = "assess-results";
    host.appendChild(results);

    renderAssessments(v, "all", "");
  }

  function renderAssessments(v, filter, search) {
    var results = $("#assess-results");
    if (!results) return;
    results.innerHTML = "";
    var all = sampleAssessments();
    if (filter !== "all") {
      all = all.filter(function (a) { return a.state === filter; });
    }
    if (search) {
      var q = search.toLowerCase();
      all = all.filter(function (a) {
        return (a.title || "").toLowerCase().indexOf(q) > -1 ||
               (a.course || "").toLowerCase().indexOf(q) > -1 ||
               (a.createdBy || "").toLowerCase().indexOf(q) > -1;
      });
    }

    if (!all.length) {
      results.innerHTML = '<div style="margin-top:40px;padding:48px;text-align:center;color:var(--ink-3);font-size:14px;">No assessments match your search.</div>';
      return;
    }

    var head = el("p");
    head.style.cssText = "font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;";
    head.textContent = "Recent assessments";
    results.appendChild(head);

    var list = el("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:8px;";
    all.forEach(function (a) {
      var row = el("button");
      row.type = "button";
      row.style.cssText = "display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:14px;background:var(--paper);border:1px solid var(--hair);cursor:pointer;text-align:left;transition:transform .2s var(--ease),border-color .2s var(--ease),box-shadow .2s var(--ease);width:100%;";
      row.addEventListener("mouseenter", function () { row.style.transform = "translateY(-2px)"; row.style.boxShadow = "0 8px 28px rgba(0,0,0,.06)"; });
      row.addEventListener("mouseleave", function () { row.style.transform = ""; row.style.boxShadow = ""; });
      row.addEventListener("click", function () { assessmentDetail(v, a.id); });

      var statusColor = stateColor(a.state);
      row.innerHTML =
        '<div style="width:4px;height:40px;border-radius:2px;background:' + statusColor + ';flex:none;"></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-family:var(--font);font-size:15px;font-weight:600;letter-spacing:-.014em;color:var(--ink);">' + esc(a.title) + '</div>' +
          '<div style="font-size:12.5px;color:var(--ink-3);margin-top:2px;">' + esc(a.course) + ' · ' + esc(a.createdBy) + ' · ' + (a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString(undefined, {month:"short",day:"numeric"}) : "Not scheduled") + '</div>' +
        "</div>" +
        '<div style="display:flex;align-items:center;gap:12px;flex:none;">' +
          '<span style="font-size:12px;color:var(--ink-3);font-variant-numeric:tabular-nums;">' + a.items + ' items · ' + a.students + ' students</span>' +
          '<span style="display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:100px;font-size:11px;font-weight:600;background:' + statusColor + '1a;color:' + statusColor + ';">' +
            '<span style="width:6px;height:6px;border-radius:50%;background:' + statusColor + ';"></span>' +
            stateLabel(a.state) +
          "</span>" +
          '<span style="font-size:11px;color:var(--ink-3);font-family:"Spline Sans Mono",monospace;">' + esc(a.version) + '</span>' +
        "</div>";
      list.appendChild(row);
    });
    results.appendChild(list);
  }

  function filterAssessments(query) {
    var filter = "all";
    var tabs = $("#assess-results").parentElement.querySelectorAll(".lx-exam-tab");
    [].forEach.call(tabs, function (t) {
      if (t.classList.contains("on")) {
        var text = t.textContent.trim().toLowerCase();
        if (text === "drafts") filter = "DRAFT";
        else if (text === "scheduled") filter = "SCHEDULED";
        else if (text === "live") filter = "LIVE";
        else if (text === "completed") filter = "RESULTS_READY";
        else filter = "all";
      }
    });
    renderAssessments($("#v-admin"), filter, query);
  }

  /* ----------------------------------------------------------- Assessment Detail
     The assessment's command center. */
  function assessmentDetail(v, id) {
    S.tab = "assessments";
    var asm = sampleAssessments().filter(function (a) { return a.id === id; })[0];
    if (!asm) return;

    v.innerHTML = "";

    /* Back button */
    var back = el("button", "cn-back");
    back.type = "button";
    back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;"><path d="M5 12h14"/><path d="m12 5-7 7 7 7"/></svg> Back to Assessments';
    back.addEventListener("click", function () { tabAssessments(v); });
    v.appendChild(back);

    /* Header */
    var head = el("header", "cn-head");
    var eyebrow = el("p", "cn-eyebrow", "Academics");
    head.appendChild(eyebrow);
    var h1 = el("h1", "cn-h1", asm.title);
    head.appendChild(h1);
    var sub = el("p", "cn-sub");
    sub.innerHTML = '<span style="display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:100px;font-size:11px;font-weight:600;background:' + stateColor(asm.state) + '1a;color:' + stateColor(asm.state) + ';"><span style="width:6px;height:6px;border-radius:50%;background:' + stateColor(asm.state) + ';"></span>' + stateLabel(asm.state) + '</span> ' + asm.version + ' · ' + asm.course;
    head.appendChild(sub);
    v.appendChild(head);

    /* Stats bar */
    var stats = el("div");
    stats.style.cssText = "display:flex;gap:24px;margin-bottom:24px;flex-wrap:wrap;";
    var statItems = [
      [asm.duration + " min", "duration"],
      [asm.items, "items"],
      [asm.students, "students"],
      [asm.readiness + "%", "readiness"]
    ];
    statItems.forEach(function (s) {
      var d = el("div");
      d.innerHTML = "<b style='font-size:18px;font-weight:700;color:var(--ink);'>" + s[0] + "</b><span style='font-size:12px;color:var(--ink-3);'>" + s[1] + "</span>";
      stats.appendChild(d);
    });
    v.appendChild(stats);

    /* Tabs */
    var tabs = el("div");
    tabs.style.cssText = "display:flex;gap:2px;margin-bottom:24px;background:var(--canvas);border-radius:100px;padding:3px;width:fit-content;";
    var activeTab = "Overview";
    asmTabsRender(tabs, asm, activeTab);
    v.appendChild(tabs);

    /* Tab content */
    var content = el("div");
    content.id = "asm-tab-content";
    asmTabContent(content, asm, activeTab);
    v.appendChild(content);
  }

  function asmTabsRender(tabs, asm, active) {
    tabs.innerHTML = "";
    ASSESSMENT_TABS.forEach(function (t) {
      var b = el("button", "lx-exam-tab" + (t === active ? " on" : ""));
      b.type = "button";
      b.style.cssText = "height:32px;padding:0 14px;border-radius:100px;font-size:13px;font-weight:500;color:var(--ink-2);display:inline-flex;align-items:center;gap:6px;transition:background .18s var(--ease),color .18s var(--ease);";
      b.textContent = t;
      b.addEventListener("click", function () {
        [].forEach.call(tabs.children, function (x) { x.classList.remove("asm-tab-on"); });
        b.classList.add("asm-tab-on");
        asmTabContent($("#asm-tab-content"), asm, t);
      });
      tabs.appendChild(b);
    });
  }

  function asmTabContent(host, asm, tab) {
    host.innerHTML = "";
    switch (tab) {
      case "Overview": asmOverview(host, asm); break;
      case "Experience": asmExperience(host, asm); break;
      case "Content": asmContent(host, asm); break;
      case "Students": asmStudents(host, asm); break;
      case "Sessions": asmSessions(host, asm); break;
      case "Results": asmResults(host, asm); break;
      case "Security": asmSecurity(host, asm); break;
      case "Activity": asmActivity(host, asm); break;
      case "Versions": asmVersions(host, asm); break;
      default: asmOverview(host, asm);
    }
  }

  function asmOverview(host, asm) {
    /* Status block */
    var block = el("div", "cn-block");
    var head = el("div", "cn-blockhead");
    head.innerHTML = "<h3>Assessment status</h3>";
    var span = el("span"); span.textContent = asm.state; head.appendChild(span);
    block.appendChild(head);

    var grid = el("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;";
    var items = [
      ["Scheduled", asm.scheduledAt ? new Date(asm.scheduledAt).toLocaleDateString(undefined, {weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : "Not scheduled"],
      ["Students", asm.students + " assigned"],
      ["Active", (asm.sessions ? asm.sessions.started : 0) + " started"],
      ["Submitted", (asm.sessions ? asm.sessions.submitted : 0)],
      ["Readiness", asm.readiness + "%"]
    ];
    items.forEach(function (it) {
      var d = el("div");
      d.style.cssText = "padding:14px;border-radius:12px;background:var(--canvas);border:1px solid var(--hair);";
      d.innerHTML = "<div style='font-size:11px;font-weight:600;color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;'>" + it[0] + "</div><div style='font-size:14px;font-weight:500;color:var(--ink);'>" + it[1] + "</div>";
      grid.appendChild(d);
    });
    block.appendChild(grid);
    host.appendChild(block);

    /* Timeline */
    if (asm.timeline) {
      var tl = el("div", "cn-block");
      var tlHead = el("div", "cn-blockhead");
      tlHead.innerHTML = "<h3>Timeline</h3>";
      tl.appendChild(tlHead);

      var steps = [
        ["Created", asm.timeline.created],
        ["Reviewed", asm.timeline.reviewed],
        ["Approved", asm.timeline.approved],
        ["Scheduled", asm.timeline.scheduled],
        ["Testing", asm.timeline.testing],
        ["Scoring", asm.timeline.scoring],
        ["Results", asm.timeline.results]
      ];
      var tlList = el("div");
      tlList.style.cssText = "display:flex;flex-direction:column;gap:0;";
      steps.forEach(function (s, i) {
        var row = el("div");
        row.style.cssText = "display:flex;align-items:center;gap:12px;padding:8px 0;" + (i < steps.length - 1 ? 'border-bottom:1px solid var(--hair);' : "");
        var dot = el("div");
        dot.style.cssText = "width:8px;height:8px;border-radius:50%;flex:none;background:" + (s[1] ? "var(--blue)" : "var(--ink-3)") + ";";
        row.appendChild(dot);
        var label = el("div");
        label.style.cssText = "font-size:13px;color:var(--ink);flex:1;";
        label.textContent = s[0];
        row.appendChild(label);
        var date = el("div");
        date.style.cssText = "font-size:12px;color:var(--ink-3);font-variant-numeric:tabular-nums;";
        date.textContent = s[1] ? new Date(s[1]).toLocaleDateString(undefined, {month:"short",day:"numeric"}) : "Pending";
        row.appendChild(date);
        tlList.appendChild(row);
      });
      tl.appendChild(tlList);
      host.appendChild(tl);
    }

    /* Governance */
    var gov = el("div", "cn-block");
    var govHead = el("div", "cn-blockhead");
    govHead.innerHTML = "<h3>Governance</h3>";
    gov.appendChild(govHead);
    var govGrid = el("div");
    govGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;";
    var govItems = [
      ["Created by", asm.createdBy],
      ["Approved by", asm.approvedBy || "Pending"],
      ["Version", asm.version],
      ["State", stateLabel(asm.state)],
      ["Created", asm.createdAt ? new Date(asm.createdAt).toLocaleDateString() : "—"],
      ["Incidents", asm.incidents || 0]
    ];
    govItems.forEach(function (g) {
      var d = el("div");
      d.style.cssText = "padding:10px 14px;border-radius:10px;background:var(--canvas);border:1px solid var(--hair);";
      d.innerHTML = "<div style='font-size:11px;font-weight:600;color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;'>" + g[0] + "</div><div style='font-size:13.5px;color:var(--ink);'>" + esc(g[1]) + "</div>";
      govGrid.appendChild(d);
    });
    gov.appendChild(govGrid);
    host.appendChild(gov);
  }

  function asmExperience(host, asm) {
    var block = el("div", "cn-block");
    var head = el("div", "cn-blockhead");
    head.innerHTML = "<h3>Experience</h3><span>" + (asm.experiences ? asm.experiences.length : 0) + " stages</span>";
    block.appendChild(head);

    var list = el("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:8px;";
    if (asm.experiences) {
      asm.experiences.forEach(function (exp, i) {
        var row = el("div");
        row.style.cssText = "display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:12px;background:var(--paper);border:1px solid var(--hair);";
        row.innerHTML =
          '<div style="width:28px;height:28px;border-radius:8px;background:var(--canvas);display:grid;place-items:center;font-size:12px;font-weight:600;color:var(--ink-3);flex:none;">' + (i + 1) + '</div>' +
          '<div style="flex:1;font-size:14px;font-weight:500;color:var(--ink);">' + esc(exp) + '</div>' +
          '<span style="font-size:11px;color:var(--ink-3);">Stage ' + (i + 1) + '</span>';
        list.appendChild(row);
      });
    }
    block.appendChild(list);
    host.appendChild(block);

    /* AI panel */
    var ai = el("div", "cn-block");
    ai.style.cssText = "padding:18px;border-radius:14px;background:var(--canvas);border:1px solid var(--hair);";
    ai.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:var(--blue);"></span>' +
        '<span style="font-size:13px;font-weight:600;color:var(--ink);">Ask OEdu</span>' +
      "</div>" +
      '<div style="font-size:13px;color:var(--ink-3);line-height:1.5;margin-bottom:12px;">OEdu understands this assessment. Ask to modify the experience without leaving the builder.</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button type="button" style="padding:6px 12px;border-radius:8px;border:1px solid var(--hair);background:var(--paper);font-size:12px;color:var(--ink-2);">Make it more rigorous</button>' +
        '<button type="button" style="padding:6px 12px;border-radius:8px;border:1px solid var(--hair);background:var(--paper);font-size:12px;color:var(--ink-2);">Reduce to 45 min</button>' +
        '<button type="button" style="padding:6px 12px;border-radius:8px;border:1px solid var(--hair);background:var(--paper);font-size:12px;color:var(--ink-2);">Check alignment</button>' +
      "</div>";
    host.appendChild(ai);
  }

  function asmContent(host, asm) {
    var block = el("div", "cn-block");
    var head = el("div", "cn-blockhead");
    head.innerHTML = "<h3>Content</h3><span>" + (asm.items || 0) + " items</span>";
    block.appendChild(head);

    var list = el("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:6px;";
    var skills = asm.skills ? Object.keys(asm.skills) : [];
    var items = asm.items || 0;
    var perSkill = Math.ceil(items / Math.max(skills.length, 1));
    skills.forEach(function (skill, i) {
      var row = el("div");
      row.style.cssText = "display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;background:var(--paper);border:1px solid var(--hair);";
      row.innerHTML =
        '<div style="flex:1;font-size:13.5px;color:var(--ink);">' + esc(skill) + '</div>' +
        '<div style="font-size:12px;color:var(--ink-3);">' + perSkill + ' items</div>' +
        '<div style="width:60px;height:6px;border-radius:3px;background:var(--sunk);overflow:hidden;">' +
          '<div style="width:' + (asm.skills[skill] || 0) + '%;height:100%;border-radius:3px;background:' + (asm.skills[skill] >= 75 ? '#12915a' : asm.skills[skill] >= 60 ? '#0060c0' : '#d4533b') + ';"></div>' +
        "</div>" +
        '<div style="font-size:12px;font-weight:600;color:var(--ink-3);">' + (asm.skills[skill] || 0) + '%</div>';
      list.appendChild(row);
    });
    block.appendChild(list);
    host.appendChild(block);
  }

  function asmStudents(host, asm) {
    var block = el("div", "cn-block");
    var head = el("div", "cn-blockhead");
    head.innerHTML = "<h3>Students</h3><span>" + asm.students + " assigned</span>";
    block.appendChild(head);

    var stats = el("div");
    stats.style.cssText = "display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;";
    var sStats = [
      [asm.students - 4, "Ready", ""],
      [4, "Not ready", "owe"],
      [2, "Accommodation review", "late"]
    ];
    sStats.forEach(function (s) {
      var d = el("div");
      d.style.cssText = "padding:10px 16px;border-radius:10px;background:var(--paper);border:1px solid var(--hair);";
      d.innerHTML = "<b style='font-size:16px;color:var(--ink);'>" + s[0] + "</b> <span style='font-size:12px;color:var(--ink-3);'>" + s[1] + "</span>";
      if (s[2]) d.style.borderColor = s[2] === "owe" ? "#d4a017" : "#d4533b";
      stats.appendChild(d);
    });
    block.appendChild(stats);

    var list = el("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:4px;";
    var students = ["Jordan M.", "Alex K.", "Priya S.", "Marcus T.", "Elena R.", "Sam W.", "Taylor L.", "Rashid N."];
    students.forEach(function (name, i) {
      var row = el("div");
      row.style.cssText = "display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;background:var(--canvas);";
      var status = i < 4 ? '<span style="font-size:11px;color:#d4533b;">Not ready</span>' : i < 6 ? '<span style="font-size:11px;color:#d4a017;">Accommodation</span>' : '<span style="font-size:11px;color:var(--green);">Ready</span>';
      row.innerHTML =
        '<div style="width:24px;height:24px;border-radius:6px;background:var(--sunk);display:grid;place-items:center;font-size:10px;font-weight:600;color:var(--ink-3);flex:none;">' + name.split(" ").map(function(w){return w[0];}).join("") + '</div>' +
        '<div style="flex:1;font-size:13px;color:var(--ink);">' + name + '</div>' +
        status;
      list.appendChild(row);
    });
    block.appendChild(list);
    host.appendChild(block);
  }

  function asmSessions(host, asm) {
    var block = el("div", "cn-block");
    var head = el("div", "cn-blockhead");
    head.innerHTML = "<h3>Live sessions</h3><span>" + (asm.sessions ? asm.sessions.started : 0) + " started</span>";
    block.appendChild(head);

    if (asm.state !== "LIVE") {
      block.innerHTML += '<div style="margin-top:12px;font-size:13px;color:var(--ink-3);">This assessment is not currently live. Sessions will appear here during testing.</div>';
      host.appendChild(block);
      return;
    }

    var stats = el("div");
    stats.style.cssText = "display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;";
    var sStats = [
      [asm.sessions.started, "Started", ""],
      [asm.sessions.paused, "Paused", "late"],
      [asm.sessions.submitted, "Submitted", "done"],
      [asm.sessions.interrupted, "Interrupted", "owe"]
    ];
    sStats.forEach(function (s) {
      var d = el("div");
      d.style.cssText = "padding:10px 16px;border-radius:10px;background:var(--paper);border:1px solid var(--hair);";
      d.innerHTML = "<b style='font-size:16px;color:var(--ink);'>" + s[0] + "</b> <span style='font-size:12px;color:var(--ink-3);'>" + s[1] + "</span>";
      stats.appendChild(d);
    });
    block.appendChild(stats);
    host.appendChild(block);
  }

  function asmResults(host, asm) {
    var block = el("div", "cn-block");
    var head = el("div", "cn-blockhead");
    head.innerHTML = "<h3>Results</h3><span>" + (asm.skills ? Object.keys(asm.skills).length : 0) + " skill areas</span>";
    block.appendChild(head);

    if (!asm.skills) {
      block.innerHTML += '<div style="margin-top:12px;font-size:13px;color:var(--ink-3);">Results will appear after the assessment is released.</div>';
      host.appendChild(block);
      return;
    }

    var grid = el("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;";
    Object.keys(asm.skills).forEach(function (skill) {
      var val = asm.skills[skill];
      var d = el("div");
      d.style.cssText = "padding:14px;border-radius:12px;background:var(--paper);border:1px solid var(--hair);";
      d.innerHTML =
        '<div style="font-size:11px;font-weight:600;color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">' + esc(skill) + '</div>' +
        '<div style="font-size:22px;font-weight:700;color:var(--ink);">' + val + '%</div>' +
        '<div style="width:100%;height:4px;border-radius:2px;background:var(--sunk);margin-top:8px;">' +
          '<div style="width:' + val + '%;height:100%;border-radius:2px;background:' + (val >= 75 ? '#12915a' : val >= 60 ? '#0060c0' : '#d4533b') + ';"></div>' +
        "</div>";
      grid.appendChild(d);
    });
    block.appendChild(grid);
    host.appendChild(block);
  }

  function asmSecurity(host, asm) {
    var block = el("div", "cn-block");
    var head = el("div", "cn-blockhead");
    head.innerHTML = "<h3>Security</h3>";
    block.appendChild(head);

    var sec = asm.security || {};
    var list = el("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:0;";
    var items = [
      ["Testing mode", sec.testingMode || "Standard"],
      ["Internet", sec.internet === false ? "Blocked" : "Allowed"],
      ["AI assistance", sec.aiAssistance === false ? "Disabled" : sec.aiAssistance || "Configurable"],
      ["Calculator", sec.calculator ? "Allowed" : "Blocked"],
      ["Reference sheet", sec.referenceSheet ? "Allowed" : "Blocked"],
      ["Navigation", sec.testingMode === "Secure" ? "Restricted" : "Standard"]
    ];
    items.forEach(function (it) {
      var row = el("div");
      row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:8px;background:var(--paper);border:1px solid var(--hair);";
      row.innerHTML =
        '<span style="font-size:13px;color:var(--ink);">' + it[0] + '</span>' +
        '<span style="font-size:12px;font-weight:600;padding:2px 8px;border-radius:100px;background:' + (it[1] === "Blocked" || it[1] === "Disabled" ? "#e8f5ee" : "var(--sunk)") + ';color:' + (it[1] === "Blocked" || it[1] === "Disabled" ? "#12915a" : "var(--ink-2)") + ';">' + it[1] + '</span>';
      list.appendChild(row);
    });
    block.appendChild(list);
    host.appendChild(block);
  }

  function asmActivity(host, asm) {
    var block = el("div", "cn-block");
    var head = el("div", "cn-blockhead");
    head.innerHTML = "<h3>Activity</h3>";
    block.appendChild(head);

    var events = [
      [asm.createdAt, asm.createdBy + " created assessment"],
      [asm.timeline.reviewed, "Entered review"],
      [asm.timeline.approved, "Approved by " + (asm.approvedBy || "—")],
      [asm.timeline.scheduled, "Scheduled for " + (asm.scheduledAt ? new Date(asm.scheduledAt).toLocaleDateString() : "—")],
      [asm.timeline.testing, "Assessment opened"]
    ].filter(function (e) { return e[0]; });

    var list = el("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:0;";
    events.forEach(function (e, i) {
      var row = el("div");
      row.style.cssText = "display:flex;align-items:center;gap:12px;padding:8px 0;" + (i < events.length - 1 ? 'border-bottom:1px solid var(--hair);' : "");
      row.innerHTML =
        '<div style="width:8px;height:8px;border-radius:50%;background:var(--blue);flex:none;"></div>' +
        '<div style="flex:1;font-size:13px;color:var(--ink);">' + esc(e[1]) + '</div>' +
        '<div style="font-size:12px;color:var(--ink-3);font-variant-numeric:tabular-nums;">' + new Date(e[0]).toLocaleString() + '</div>';
      list.appendChild(row);
    });
    block.appendChild(list);
    host.appendChild(block);
  }

  function asmVersions(host, asm) {
    var block = el("div", "cn-block");
    var head = el("div", "cn-blockhead");
    head.innerHTML = "<h3>Versions</h3>";
    block.appendChild(head);

    var versions = [
      [asm.version, asm.state, asm.createdBy, asm.createdAt],
      ["v1.0", "DRAFT", asm.createdBy, asm.createdAt ? asm.createdAt - 86400000 * 4 : null],
      ["v0.9", "DRAFT", "OEdu AI", asm.createdAt ? asm.createdAt - 86400000 * 7 : null]
    ];

    var list = el("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:0;";
    versions.forEach(function (v, i) {
      var row = el("div");
      row.style.cssText = "display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;background:var(--paper);border:1px solid var(--hair);" + (i === 0 ? 'box-shadow:inset 3px 0 0 var(--blue);' : "");
      row.innerHTML =
        '<div style="font-family:"Spline Sans Mono",monospace;font-size:13px;font-weight:600;color:var(--ink);flex:none;">' + esc(v[0]) + '</div>' +
        '<div style="flex:1;font-size:13px;color:var(--ink-2);">' + esc(v[1]) + '</div>' +
        '<div style="font-size:12px;color:var(--ink-3);">' + esc(v[2]) + '</div>' +
        '<div style="font-size:12px;color:var(--ink-3);font-variant-numeric:tabular-nums;">' + (v[3] ? new Date(v[3]).toLocaleDateString() : "—") + '</div>';
      list.appendChild(row);
    });
    block.appendChild(list);
    host.appendChild(block);
  }

  /* ----------------------------------------------------------- Assessment Studio
     Conversational creation surface. */
  function assessmentStudio(host) {
    S.tab = "assessments";
    host.innerHTML = "";

    /* Back button */
    var back = el("button", "cn-back");
    back.type = "button";
    back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;"><path d="M5 12h14"/><path d="m12 5-7 7 7 7"/></svg> Back to Assessments';
    back.addEventListener("click", function () { tabAssessments(host); });
    host.appendChild(back);

    var studio = el("div");
    studio.style.cssText = "max-width:800px;";

    /* Header */
    var head = el("div", "cn-head");
    head.appendChild(el("p", "cn-eyebrow", "Create"));
    head.appendChild(el("h1", "cn-h1", "Assessment Studio"));
    head.appendChild(el("p", "cn-sub", "Describe what you want to assess. OEdu builds the structure, the experience, and the evidence."));
    studio.appendChild(head);

    /* Goal input */
    var goalBlock = el("div");
    goalBlock.style.cssText = "margin-bottom:24px;";
    var goalLabel = el("p");
    goalLabel.style.cssText = "font-size:13px;font-weight:600;color:var(--ink);margin-bottom:8px;";
    goalLabel.textContent = "What are you trying to assess?";
    goalBlock.appendChild(goalLabel);

    var textarea = el("textarea");
    textarea.style.cssText = "width:100%;min-height:120px;padding:16px;border-radius:14px;border:1px solid var(--hair);background:var(--paper);font-size:14.5px;line-height:1.5;color:var(--ink);resize:vertical;font-family:inherit;";
    textarea.placeholder = "e.g. Create a 60-minute Algebra I assessment on quadratic functions. I want students to demonstrate conceptual understanding, graph interpretation, solving, and reasoning. Make it rigorous and interactive.";
    goalBlock.appendChild(textarea);
    studio.appendChild(goalBlock);

    /* Upload */
    var uploadBlock = el("div");
    uploadBlock.style.cssText = "margin-bottom:24px;padding:32px;border-radius:14px;border:2px dashed var(--hair);text-align:center;background:var(--paper);";
    uploadBlock.innerHTML =
      '<div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px;">Drop files here</div>' +
      '<div style="font-size:12.5px;color:var(--ink-3);">Past assessments · Curriculum · Standards · Teacher materials · Rubrics · PDFs · Images · Documents</div>' +
      '<button type="button" style="margin-top:12px;padding:6px 14px;border-radius:8px;background:var(--canvas);border:1px solid var(--hair);font-size:12.5px;color:var(--ink-2);">Browse files</button>';
    studio.appendChild(uploadBlock);

    /* AI Architect panel */
    var architect = el("div");
    architect.style.cssText = "padding:20px;border-radius:14px;background:linear-gradient(135deg,#0d0d12,#1a1a2e);color:#fff;margin-bottom:24px;overflow:hidden;";
    architect.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:#7c5cfc;"></span>' +
        '<span style="font-size:13px;font-weight:600;">AI Assessment Architect</span>' +
      "</div>" +
      '<div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:14px;line-height:1.5;">OEdu will use your materials to understand the assessment goal before generating anything.</div>' +
      '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.3);margin-bottom:8px;">Proposed blueprint</div>' +
      '<div style="font-size:13px;color:rgba(255,255,255,.85);line-height:1.6;">' +
        '<div style="margin-bottom:8px;"><b>Goal:</b> Measure students ability to apply quadratic functions in unfamiliar contexts.</div>' +
        '<div style="margin-bottom:8px;"><b>Evidence required:</b></div>' +
        '<div style="padding-left:12px;margin-bottom:8px;">Conceptual understanding ████████</div>' +
        '<div style="padding-left:12px;margin-bottom:8px;">Application ██████████</div>' +
        '<div style="padding-left:12px;margin-bottom:8px;">Reasoning █████████</div>' +
        '<div style="margin-bottom:8px;"><b>Proposed experience:</b> Quadratic Design Challenge — 6 stages, ~55 minutes</div>' +
      "</div>" +
      '<div style="display:flex;gap:8px;margin-top:16px;">' +
        '<button type="button" id="asm-approve" style="padding:8px 16px;border-radius:9px;background:#fff;color:#0d0d12;font-size:13px;font-weight:600;border:none;cursor:pointer;">Approve blueprint</button>' +
        '<button type="button" id="asm-modify" style="padding:8px 16px;border-radius:9px;background:rgba(255,255,255,.1);color:#fff;font-size:13px;border:1px solid rgba(255,255,255,.2);cursor:pointer;">Modify</button>' +
        '<button type="button" id="asm-ask" style="padding:8px 16px;border-radius:9px;background:transparent;color:rgba(255,255,255,.7);font-size:13px;border:none;cursor:pointer;">Ask OEdu</button>' +
      "</div>";
    studio.appendChild(architect);

    /* Architect button interactivity */
    var approveBtn = studio.querySelector("#asm-approve");
    if (approveBtn) approveBtn.addEventListener("click", function () {
      if (studioState.approved) return;
      studioState.approved = true;
      approveBtn.textContent = "Approved ✓";
      approveBtn.style.background = "#e8f5ee";
      approveBtn.style.color = "#12915a";
      approveBtn.style.border = "none";
      publishBtn2.disabled = false;
      toast("Blueprint approved — you can now publish.");
    });
    var modifyBtn = studio.querySelector("#asm-modify");
    if (modifyBtn) modifyBtn.addEventListener("click", function () {
      var modPanel = studio.querySelector(".asm-modify-panel");
      if (modPanel) { modPanel.remove(); return; }
      modPanel = el("div");
      modPanel.className = "asm-modify-panel";
      modPanel.style.cssText = "padding:18px;border-radius:14px;background:var(--canvas);border:1px solid var(--hair);margin-bottom:16px;";
      modPanel.innerHTML =
        '<div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:12px;">Modify blueprint</div>' +
        '<div style="font-size:12px;color:var(--ink-3);margin-bottom:4px;">Content preservation: <b>60%</b></div>' +
        '<input type="range" min="0" max="100" value="60" style="width:100%;margin-bottom:12px;">' +
        '<div style="font-size:12px;color:var(--ink-3);margin-bottom:4px;">Experience intensity: <b>Interactive</b></div>' +
        '<input type="range" min="0" max="100" value="70" style="width:100%;margin-bottom:12px;">' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
          '<button type="button" class="asm-mod-cancel" style="padding:6px 12px;border-radius:8px;border:1px solid var(--hair);background:var(--paper);font-size:12px;color:var(--ink-2);">Cancel</button>' +
          '<button type="button" class="asm-mod-apply" style="padding:6px 12px;border-radius:8px;background:var(--ink);color:#fff;font-size:12px;border:none;">Apply</button>' +
        "</div>";
      studio.insertBefore(modPanel, studio.querySelector(".asm-summary"));
      modPanel.querySelector(".asm-mod-cancel").addEventListener("click", function () { modPanel.remove(); });
      modPanel.querySelector(".asm-mod-apply").addEventListener("click", function () {
        modPanel.remove();
        toast("Blueprint modified — OEdu is recalculating the design.");
        summary.innerHTML = '<div class="asm-summary-body"><div style="font-size:13px;font-weight:600;color:#d97706;margin-bottom:10px;">Blueprint modified</div><div style="font-size:13px;color:var(--ink-2);line-height:1.6;">Content preservation adjusted. Experience intensity increased.</div><div style="font-size:13px;color:var(--ink-3);margin-top:8px;">Recalculating timing and complexity…</div></div>';
      });
    });
    var askBtn = studio.querySelector("#asm-ask");
    if (askBtn) askBtn.addEventListener("click", function () {
      var chatPanel = studio.querySelector(".asm-chat-panel");
      if (chatPanel) { chatPanel.remove(); return; }
      chatPanel = el("div");
      chatPanel.className = "asm-chat-panel";
      chatPanel.style.cssText = "padding:18px;border-radius:14px;background:var(--canvas);border:1px solid var(--hair);margin-bottom:16px;";
      chatPanel.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:#7c5cfc;"></span>' +
          '<span style="font-size:13px;font-weight:600;color:var(--ink);">Ask OEdu</span>' +
        "</div>" +
        '<div style="font-size:13px;color:var(--ink-2);line-height:1.5;margin-bottom:12px;">What would you like to change?</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
          '<button type="button" class="asm-ask-chip" data-msg="Make this more rigorous">Make it more rigorous</button>' +
          '<button type="button" class="asm-ask-chip" data-msg="Reduce to 45 minutes">Reduce to 45 min</button>' +
          '<button type="button" class="asm-ask-chip" data-msg="Check alignment with curriculum">Check alignment</button>' +
          '<button type="button" class="asm-ask-chip" data-msg="Add more interactive tasks">Add interaction</button>' +
        "</div>" +
        '<div id="asm-chat-response" style="font-size:13px;color:var(--ink-2);line-height:1.5;min-height:40px;"></div>';
      studio.insertBefore(chatPanel, studio.querySelector(".asm-summary"));
      chatPanel.querySelectorAll(".asm-ask-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          var resp = chatPanel.querySelector("#asm-chat-response");
          resp.innerHTML = '<em style="color:var(--ink-3);">OEdu is thinking…</em>';
          var msg = chip.dataset.msg;
          var responses = {
            "Make this more rigorous": "I'll increase the proportion of transfer and reasoning tasks while preserving the core objectives.",
            "Reduce to 45 minutes": "I've reduced the number of interaction stages and recalculated the estimated completion time.",
            "Check alignment with curriculum": "I'll prioritize the uploaded curriculum materials and identify where the proposed tasks align.",
            "Add more interactive tasks": "I'll add two application tasks and one constructed response to deepen engagement."
          };
          setTimeout(function () {
            resp.innerHTML = '<div style="margin-bottom:4px;"><b>OEdu:</b> ' + (responses[msg] || "I'll adjust the assessment based on your request.") + '</div><div style="font-size:11px;color:var(--ink-3);">Based on: 24 source concepts · 6 skill areas</div>';
          }, 800);
        });
      });
    });

    /* AI Design Summary */
    var summary = el("div", "asm-summary");
    summary.style.cssText = "padding:20px;border-radius:14px;background:var(--canvas);border:1px solid var(--hair);margin-bottom:24px;";
    summary.innerHTML =
      '<div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:14px;">AI Design Summary</div>' +
      '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3);margin-bottom:6px;">Source</div>' +
      '<div style="font-size:13px;color:var(--ink-2);margin-bottom:14px;">Algebra I Midterm.pdf · 3 files uploaded</div>' +
      '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3);margin-bottom:6px;">Transformation</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;color:var(--ink-2);">' +
        '<div>Retained: 24 concepts</div>' +
        '<div>Redesigned: 18 experiences</div>' +
        '<div>Combined: 7 items</div>' +
        '<div>Added: 3 tasks</div>' +
        '<div>Added: 1 constructed response</div>' +
        '<div>Requires review: 2 items</div>' +
      "</div>" +
      '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3);margin-top:14px;margin-bottom:6px;">Requires attention</div>' +
      '<div style="font-size:13px;color:#d4533b;">1 accessibility concern · 1 timing concern</div>';
    studio.appendChild(summary);

    /* Studio state */
    var studioState = { approved: false, transformed: false, previewing: false, published: false };

    /* Action buttons */
    var actions = el("div");
    actions.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;";
    var transformBtn = el("button", "cn-btn strong");
    transformBtn.type = "button";
    transformBtn.textContent = "Transform";
    transformBtn.addEventListener("click", function () {
      if (studioState.transformed) return;
      transformBtn.textContent = "Transforming…";
      transformBtn.disabled = true;
      summary.innerHTML = '<div class="asm-summary-body"><div style="font-size:13px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:14px;">OEdu is redesigning the experience architecture…</div><div style="font-size:13px;color:rgba(255,255,255,.7);">Analyzing source materials</div><div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px;">Mapping learning objectives</div><div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px;">Designing interactive tasks</div><div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px;">Checking accessibility</div></div>';
      setTimeout(function () {
        studioState.transformed = true;
        transformBtn.textContent = "Transformed ✓";
        transformBtn.disabled = false;
        summary.innerHTML = '<div class="asm-summary-body"><div style="font-size:13px;font-weight:600;color:#12915a;margin-bottom:10px;">Transformation complete</div><div style="font-size:13px;color:var(--ink-2);line-height:1.6;">Retained: <b>24</b> concepts · Redesigned: <b>22</b> experiences · Added: <b>5</b> interactive tasks</div><div style="font-size:13px;color:var(--ink-3);margin-top:8px;">1 accessibility concern resolved · 1 timing concern adjusted</div></div>';
        toast("Transformation complete — the experience has been redesigned.");
      }, 2500);
    });
    actions.appendChild(transformBtn);

    var previewBtn2 = el("button", "cn-btn");
    previewBtn2.type = "button";
    previewBtn2.textContent = "Preview as student";
    previewBtn2.addEventListener("click", function () {
      if (!studioState.previewing) {
        studioState.previewing = true;
        previewBtn2.textContent = "Exit preview";
        previewBtn2.classList.add("cn-btn.strong");
        studio.classList.add("asm-previewing");
        toast("PREVIEW MODE — You are seeing what students see. No real data is affected.");
      } else {
        studioState.previewing = false;
        previewBtn2.textContent = "Preview as student";
        previewBtn2.classList.remove("cn-btn.strong");
        studio.classList.remove("asm-previewing");
      }
    });
    actions.appendChild(previewBtn2);

    var publishBtn2 = el("button", "cn-btn");
    publishBtn2.type = "button";
    publishBtn2.textContent = "Publish";
    publishBtn2.disabled = true;
    publishBtn2.addEventListener("click", function () {
      if (!studioState.approved) return;
      if (studioState.published) return;
      studioState.published = true;
      publishBtn2.textContent = "Published ✓";
      publishBtn2.disabled = true;
      toast("Assessment published — students can now access it.");
    });
    actions.appendChild(publishBtn2);
    studio.appendChild(actions);

    host.appendChild(studio);
  }


  /* Leaving the console puts the student's chrome back. It is one class on the
     body rather than two apps, because a teacher who is also studying should
     not have to sign in twice to be both. */
  function leaveConsole() {
    /* For staff there is nowhere to leave to. The account screen and every
       other view they can reach is drawn inside the console's shell, so the
       rail stays and the student's chrome never appears — without this guard
       opening Account would strand them on a page with no navigation at all. */
    if (document.body.classList.contains("is-staff")) { closeRail(); trPopClose(); return; }
    document.body.classList.remove("is-console", "t-console");
    trApply();
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

  /* ---------------------------------------------------------------- Summary
     The school on one screen, the way Health opens on Summary: three rings,
     four numbers, two charts and the people who need someone to look.

     Every figure is computed now, from rows the server returned for this
     request, and each one says what it counts. The rings are ratios of
     things that exist (work due and marked, work due and handed in, students
     at or above the pass line); the one time series is the only one the
     record has — grades entered, by day, from the audit trail — and when that
     trail is cut short by the request's limit the chart says so. */
  var CX_PASS = 70;          // the server's pass line: "below a pass" is under 70%
  function consoleHome(v) {
    var admin = consoleMode() === "admin";
    var when = new Date();
    var top = el("div", "cx-top");
    var head = consoleHead(top, when.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
      greeting() + ", " + esc(S.me.first || String(S.me.name).split(" ")[0]) + ".",
      esc(admin ? schoolName() : "Your courses"));
    var tools = el("div", "cx-tools");
    if (admin) tools.appendChild(cnAction("Add a person", function () { openPersonEditor(null); }));
    tools.appendChild(cnAction("New course", function () { openCourseEditor(null); }, true));
    top.appendChild(tools);
    v.appendChild(top);

    var grid = el("div", "cx-grid");
    v.appendChild(grid);
    // The shape of the page while it loads, so nothing jumps when it arrives.
    [["cx-s12", 110], ["cx-s7", 300], ["cx-s5", 300], ["cx-s7", 300], ["cx-s5", 300]].forEach(function (x) {
      var c = el("div", "cx-card " + x[0]);
      c.innerHTML = '<div class="cx-skel" style="height:18px;width:40%"></div><div class="cx-skel" style="height:' + (x[1] - 70) + 'px;margin-top:18px"></div>';
      grid.appendChild(c);
    });

    loadSchool(true).then(function (d) {
      if (!d.courses.length) { grid.remove(); emptySchool(v, admin); railCount("roster", 0); return; }
      grid.innerHTML = "";
      if (admin) drawOverview(v, grid, d, head);
      else drawSummary(grid, d, head, admin);
    }, function (e) { grid.remove(); failed(loading(v, "the summary"), e, function () { openAdmin(true, "today"); }); });
  }

  function schoolName() {
    var o = (S.me.orgs || [])[0];
    return o && o.name ? o.name : "Your school";
  }

  function emptySchool(v, admin) {
    var start = el("div", "cn-start");
    start.appendChild(el("h2", null, admin ? "Let’s get your school’s first course in." : "You aren’t teaching a course yet."));
    start.appendChild(el("p", null, admin
      ? "A course is what carries enrolment, work and grades. Start from one Oplo has already written — " +
        "the units and the grading scheme come with it — or make your own, then assign its teacher."
      : "An administrator assigns you to a course, or you can make one of your own. Your courses appear here."));
    var sacts = cnActions();
    sacts.appendChild(cnAction("Explore courses", openCatalogue, true));
    sacts.appendChild(cnAction("Create one from nothing", function () { openCourseEditor(null); }));
    start.appendChild(sacts);
    v.appendChild(start);
  }

  function drawSummary(grid, d, head, admin) {
    var courses = d.courses, students = d.students, i = 0;
    function card(cls, title, icon, tone, more) {
      var c = el("section", "cx-card " + cls);
      c.style.setProperty("--i", i++);
      if (title) {
        var h = el("header", "cx-ch");
        h.innerHTML = (icon ? '<span class="ic" style="--c:' + tone + '">' + cxIcon(icon) + "</span>" : "") + "<h3>" + esc(title) + "</h3>";
        if (more) {
          var m = el("button", "more", esc(more.label) + " ›");
          m.type = "button";
          m.addEventListener("click", more.go);
          h.appendChild(m);
        }
        c.appendChild(h);
      }
      grid.appendChild(c);
      return c;
    }
    var cells = 0, dealt = 0, handed = 0, toMark = 0, dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    courses.forEach(function (c) {
      cells += c.cells; dealt += c.dealt; handed += c.handed; toMark += c.toMark;
      Object.keys(dist).forEach(function (k) { dist[k] += c.dist[k]; });
    });
    var graded = students.filter(function (s) { return s.standing != null; });
    var passing = graded.filter(function (s) { return s.standing >= CX_PASS; }).length;
    var pMarked = cells ? dealt / cells : 0, pHanded = dealt ? handed / dealt : 0, pPass = graded.length ? passing / graded.length : 0;
    if (!admin) teachCounts();
    var tcount = d.teachers.length;
    var sub = head.querySelector(".cn-sub");
    if (sub) sub.innerHTML = (admin ? esc(schoolName()) + " · " : "Your courses · ") + students.length + (students.length === 1 ? " student" : " students") +
      (admin ? " · " + tcount + (tcount === 1 ? " teacher" : " teachers") : "") + " · " + courses.length + (courses.length === 1 ? " course" : " courses");

    // ---- Rings.
    var rings = card("cx-s5 cx-rings", null);
    var rh = el("header", "cx-ch");
    rh.style.cssText = "grid-column: 1 / -1; margin-bottom: 0";
    rh.innerHTML = "<h3>" + (admin ? "School health" : "Your courses") + "</h3><small>Due work, and who is passing</small>";
    rings.appendChild(rh);
    rings.appendChild(ringsSvg([pMarked, pHanded, pPass]));
    var leg = el("div", "cx-legend");
    leg.innerHTML =
      '<div><span class="cx-r1">Marked</span><b class="cx-r1">' + Math.round(pMarked * 100) + '<small>%</small></b><em>' +
        (toMark ? toMark + " due and waiting to be marked" : "Everything due is marked") + "</em></div>" +
      '<div><span class="cx-r2">Handed in</span><b class="cx-r2">' + Math.round(pHanded * 100) + '<small>%</small></b><em>of due work recorded so far</em></div>' +
      '<div><span class="cx-r3">Passing</span><b class="cx-r3">' + Math.round(pPass * 100) + '<small>%</small></b><em>' +
        passing + " of " + graded.length + " students at " + CX_PASS + "% or better</em></div>";
    rings.appendChild(leg);

    // ---- Four numbers.
    var kp = el("div", "cx-kpis");
    kp.style.cssText = "grid-column: span 7";
    grid.appendChild(kp);
    var below = graded.length - passing;
    var avg = graded.length ? Math.round(graded.reduce(function (a, s) { return a + s.standing; }, 0) / graded.length) : null;
    var distList = [["A", "var(--cx-green)"], ["B", "var(--cx-teal)"], ["C", "var(--cx-yellow)"], ["D", "var(--cx-orange)"], ["F", "var(--cx-red)"]]
      .map(function (x) { return { k: x[0], n: dist[x[0]], color: x[1] }; });
    var missingStudents = students.filter(function (s) { return s.missing > 0; }).length;
    var kpis = [
      [admin ? "Students" : "Students you teach", "people", "var(--cx-accent)", students.length, "",
       below ? '<span class="bad">' + below + " below a pass</span>" : '<span class="ok">Everyone is passing</span>'],
      admin ? ["Teachers", "badge", "var(--cx-indigo)", tcount, "", "Teaching " + courses.length + (courses.length === 1 ? " course" : " courses")]
            : ["To mark", "pencil", "var(--cx-indigo)", toMark, "", toMark ? "Due work waiting for you" : "You’re all caught up"],
      [admin ? "School average" : "Course average", "chart", "var(--cx-green)", avg == null ? "—" : avg, avg == null ? "" : "%", "Mean of every student’s standing", distList],
      ["Missing work", "tray", "var(--cx-orange)", d.totals.missing, "",
       missingStudents + (missingStudents === 1 ? " student has" : " students have") + " something missing"]
    ];
    kpis.forEach(function (x) {
      var c = el("section", "cx-card cx-kpi");
      c.style.setProperty("--i", i++);
      c.style.setProperty("--c", x[2]);
      c.innerHTML = '<div class="lab">' + cxIcon(x[1]) + esc(x[0]) + "</div><b>" + x[3] + (x[4] ? "<small>" + x[4] + "</small>" : "") +
        "</b><p>" + x[5] + "</p>";
      if (x[6]) c.appendChild(miniDist(x[6]));
      kp.appendChild(c);
    });

    // ---- Grade distribution.
    var gd = card("cx-s6", "Grade distribution", "chart", "var(--cx-green)");
    var total = distList.reduce(function (a, b) { return a + b.n; }, 0);
    gd.appendChild(el("div", "cx-big", "<b>" + total + "</b><span>course grades across " + courses.length + (courses.length === 1 ? " course" : " courses") + "</span>"));
    gd.appendChild(barChart(distList.map(function (b) { return { label: b.k, n: b.n, color: b.color }; }), { values: true }));

    // ---- Grades entered, by day, from the audit trail.
    var days = 14, dayMs = 864e5, start = new Date(); start.setHours(0, 0, 0, 0);
    var t0 = start.getTime() - (days - 1) * dayMs, perDay = [];
    for (var k = 0; k < days; k++) perDay.push({ n: 0, t: t0 + k * dayMs });
    d.events.forEach(function (e) { var at = Number(e.at); if (at >= t0) { var ix = Math.floor((at - t0) / dayMs); if (perDay[ix]) perDay[ix].n++; } });
    var sum = perDay.reduce(function (a, b) { return a + b.n; }, 0);
    var ge = card("cx-s6", "Grades entered", "pencil", "var(--cx-pink)",
      { label: admin ? "Audit log" : "Activity", go: function () { openAdmin(false, "activity"); } });
    ge.appendChild(el("div", "cx-big", "<b>" + sum + "</b><span>in the last two weeks · " + Math.round(sum / days) + " a day on average</span>"));
    ge.appendChild(barChart(perDay.map(function (p, j) {
      var dt = new Date(p.t);
      return { label: j % 2 === 0 ? dt.toLocaleDateString(undefined, { weekday: "narrow" }) + dt.getDate() : "", n: p.n, color: "var(--cx-pink)",
               title: dt.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) };
    }), { average: true }));
    if (d.capped) ge.appendChild(el("p", "cx-note", "Counted from each course’s latest " + HISTORY_LIMIT + " changes; a busy course may have had more."));

    // ---- Who needs someone to look.
    var risk = students.filter(function (s) { return (s.standing != null && s.standing < CX_PASS) || s.missing >= 2; })
      .sort(function (a, b) { return (a.standing == null ? 999 : a.standing) - (b.standing == null ? 999 : b.standing) || b.missing - a.missing; });
    var na = card("cx-s7", "Needs attention", "alert", "var(--cx-red)",
      risk.length > 6 ? { label: "All " + risk.length, go: function () { S.studentFilter = "low"; openAdmin(false, "students"); } } : null);
    if (!risk.length) na.appendChild(el("p", "cx-note", "Nobody is below a pass or missing more than one piece of work."));
    var nl = el("div", "cx-list");
    risk.slice(0, 6).forEach(function (s) {
      var low = s.courses.filter(function (c) { return c.grade && c.grade.percent < CX_PASS; }).map(function (c) { return c.title; });
      var b = el("button", "cx-li");
      b.type = "button";
      b.innerHTML = avatarHtml(s) + '<span class="t"><b>' + esc(s.name) + "</b><span>" +
        esc(low.length ? "Below a pass in " + low.join(", ") : s.courses.map(function (c) { return c.title; }).join(", ")) + "</span></span>" +
        '<span class="r"><b style="color:' + (s.standing != null && s.standing < CX_PASS ? "var(--cx-red)" : "var(--cx-label)") + '">' +
        (s.standing == null ? "—" : s.standing + "%") + "</b>" +
        (s.missing ? '<span class="cx-pill orange">' + s.missing + " missing</span>" : "") + "</span>";
      b.addEventListener("click", function () { if (admin) openStudent360(s); else openStudentSheet(s); });
      nl.appendChild(b);
    });
    na.appendChild(nl);

    // ---- Courses.
    var cc = card("cx-s5", "Courses", "books", "var(--cx-indigo)", { label: "All", go: function () { openAdmin(false, "courses"); } });
    var cl = el("div", "cx-list");
    courses.slice().sort(function (a, b) { return (a.average == null ? 999 : a.average) - (b.average == null ? 999 : b.average); })
      .forEach(function (c) {
        var b = el("button", "cx-li");
        b.type = "button";
        var who = c.teachers.map(function (t) { return t.name; }).join(", ");
        b.innerHTML = miniRing(c.average) + '<span class="t"><b>' + esc(c.title) + "</b><span>" +
          esc((admin ? (who || "No teacher assigned") : (c.subject || c.code)) + " · " + c.students + (c.students === 1 ? " student" : " students")) + "</span></span>" +
          '<span class="r"><b>' + (c.average == null ? "—" : c.average + "%") + "</b>" +
          (c.below ? '<span class="cx-pill red">' + c.below + " below a pass</span>" : '<span class="cx-pill green">on track</span>') + "</span>";
        b.addEventListener("click", function () {
          if (admin) openCoursePage(c.raw); else { S.courseId = c.id; openAdmin(false, "roster"); }
        });
        cl.appendChild(b);
      });
    cc.appendChild(cl);

    // ---- The school's staff, and where each stands with marking — or, for
    //      a teacher, the work waiting for them.
    if (admin) {
      var sf = card("cx-s5", "Marking by teacher", "badge", "var(--cx-orange)", { label: "Staff", go: function () { openAdmin(false, "staff"); } });
      if (!d.teachers.length) sf.appendChild(el("p", "cx-note", "No course has a teacher assigned yet."));
      var tl = el("div", "cx-list");
      d.teachers.slice().sort(function (a, b) { return (a.cells ? a.dealt / a.cells : 1) - (b.cells ? b.dealt / b.cells : 1); }).slice(0, 6)
        .forEach(function (t) {
          var p = t.cells ? Math.round(t.dealt / t.cells * 100) : null;
          var b = el("button", "cx-li");
          b.type = "button";
          b.innerHTML = avatarHtml(t) + '<span class="t"><b>' + esc(t.name) + "</b><span>" +
            esc(t.courses.map(function (c) { return c.title; }).join(", ")) + "</span></span>" +
            '<span class="r"><b>' + (p == null ? "—" : p + "%") + "</b>" +
            (t.toMark ? '<span class="cx-pill orange">' + t.toMark + " to mark</span>" : '<span class="cx-pill green">up to date</span>') + "</span>";
          b.addEventListener("click", function () { S.staffPick = t.id; openAdmin(false, "staff"); });
          tl.appendChild(b);
        });
      sf.appendChild(tl);
    } else {
      var needs = [];
      courses.forEach(function (c) { needs = needs.concat(c.needs); });
      needs.sort(function (a, b) { return (a.dueAt || 0) - (b.dueAt || 0); });
      var tm = card("cx-s5", "To grade", "inbox", "var(--cx-indigo)", { label: "To Grade", go: function () { openAdmin(false, "tograde"); } });
      if (!needs.length) tm.appendChild(el("p", "cx-note", "Nothing due is waiting to be marked."));
      var ml = el("div", "cx-list");
      needs.slice(0, 6).forEach(function (n) {
        var b = el("button", "cx-li");
        b.type = "button";
        b.innerHTML = '<span class="cx-av" style="--h:var(--cx-indigo)">' + cxIcon("pencil") + '</span><span class="t"><b>' + esc(n.title) + "</b><span>" +
          esc(n.course + " · was due " + dayName(n.dueAt)) + '</span></span><span class="r"><span class="cx-pill orange">' + n.count + " to mark</span></span>";
        b.addEventListener("click", function () { S.courseId = n.courseId; openAdmin(false, "roster"); });
        ml.appendChild(b);
      });
      tm.appendChild(ml);
    }

    // ---- The latest changes to marks.
    var fa = card("cx-s7", "Latest marks", "clock", "var(--cx-teal)", { label: admin ? "Audit log" : "Activity", go: function () { openAdmin(false, "activity"); } });
    var feed = el("div", "cx-feed");
    d.events.slice(0, 7).forEach(function (e) {
      var r = el("div", "cx-ev");
      var to = e.toStatus === "missing" ? "missing" : e.toStatus === "excused" ? "excused" : e.toScore == null ? "cleared" : cxNum(e.toScore) + " / " + cxNum(e.outOf);
      r.innerHTML = avatarHtml(e.student || {}) + '<span class="t"><b>' + esc(e.actorName || "Someone") + "</b><span> marked </span><b>" +
        esc((e.student && e.student.name) || "a student") + "</b><span>’s " + esc(e.title) + " · " + esc(e.courseTitle || "") + " → </span>" +
        '<span class="cx-chg">' + esc(to) + "</span></span><time>" + esc(whenName(e.at)) + "</time>";
      feed.appendChild(r);
    });
    if (!d.events.length) feed.appendChild(el("p", "cx-note", "Nothing has been marked yet."));
    fa.appendChild(feed);
  }

  /* ------------------------------------------------------------------ Staff
     The school's teachers, as an administrator needs to see them: what each
     teaches, how many students that is, and whether their marking is keeping
     up — work that is due and not yet marked, and when they last marked
     anything. Read from the same gradebooks the teachers mark in, so it is
     never a report somebody has to remember to file. */
  function tabStaff(v) {
    var top = el("div", "cx-top");
    consoleHead(top, "Staff", "Teachers",
      "Everyone teaching a course here, what they teach, and whether marking is keeping up with the work that is due.");
    var tools = el("div", "cx-tools");
    tools.appendChild(cnAction("Add a person", function () { openPersonEditor(null); }, true));
    top.appendChild(tools);
    v.appendChild(top);
    var node = loading(v, "your staff");
    loadSchool().then(function (d) {
      node.remove();
      tools.insertBefore(cnAction("Print directory", function () {
        cxPrint("Staff directory", printHead("Staff directory", d.teachers.length + " teachers") +
          printTable([{ t: "Name" }, { t: "Email" }, { t: "Teaches" }, { t: "Students", r: 1 }],
            d.teachers.map(function (t) { return [t.name, t.email, t.courses.map(function (c) { return c.title; }).join(", "), t.students]; })));
      }), tools.firstChild);
      var unstaffed = d.courses.filter(function (c) { return !c.teachers.length; });
      if (unstaffed.length) {
        v.appendChild(el("div", "cn-verdict", "<b>" + unstaffed.length + (unstaffed.length === 1 ? " course has" : " courses have") +
          " no teacher:</b> " + esc(unstaffed.map(function (c) { return c.title; }).join(", ")) + ". Open a course to assign one."));
      }
      if (!d.teachers.length) {
        v.appendChild(cnEmpty("Nobody is teaching a course yet.",
          "Assign a teacher from a course's page, and they appear here with their marking.", "Courses",
          function () { openAdmin(false, "courses"); }));
        return;
      }
      var split = cnSplit(v);
      var t = cnTable([
        { label: "Teacher", w: "minmax(170px, 1.2fr)" },
        { label: "Courses", w: "74px", align: "right" },
        { label: "Students", w: "80px", align: "right" },
        { label: "Marked", w: "76px", align: "right" },
        { label: "To mark", w: "76px", align: "right" },
        { label: "Last marked", w: "118px", align: "right" }
      ]);
      function pick(tt) {
        S.staffPick = tt.id;
        t.select(tt.id);
        split.right.innerHTML = "";
        split.right.appendChild(staffInspector(tt));
      }
      d.teachers.forEach(function (tt) {
        var who = el("span", "cn-who");
        who.appendChild(avatarFor(tt));
        who.appendChild(el("span", "nm", esc(tt.name)));
        var p = tt.cells ? Math.round(tt.dealt / tt.cells * 100) : null;
        t.row([who, String(tt.courses.length), String(tt.students),
          p == null ? "<span class='cn-none'>—</span>" : "<b class='cn-mk" + (p < 80 ? " warn" : "") + "'>" + p + "%</b>",
          tt.toMark ? "<b class='cn-mk warn'>" + tt.toMark + "</b>" : "<span class='cn-none'>—</span>",
          tt.last ? esc(whenName(tt.last)) : "<span class='cn-none'>never</span>"
        ], function () { pick(tt); }, tt.id);
      });
      split.left.appendChild(t);
      pick(d.teachers.filter(function (x) { return x.id === S.staffPick; })[0] || d.teachers[0]);
    }, function (e) { failed(node, e, function () { openAdmin(true, "staff"); }); });
  }

  function staffInspector(tt) {
    var box = el("div", "cn-insp cx-insp");
    box.appendChild(el("header", "cx-ihead", avatarHtml(tt) + '<div class="t"><b>' + esc(tt.name) + "</b><span>" + esc(tt.email || "") + "</span></div>"));
    var p = tt.cells ? tt.dealt / tt.cells : null;
    var hero = el("div", "cx-ihero");
    hero.innerHTML = '<div class="ring">' + miniRing(p == null ? null : Math.round(p * 100)).replace('class="cx-mring"', 'class="cx-mring big"') +
      "<b>" + (p == null ? "—" : Math.round(p * 100) + "<small>%</small>") + "</b></div>" +
      '<div class="stats"><div><b>' + tt.students + "</b><span>Students</span></div>" +
      '<div><b style="color:' + (tt.toMark ? "var(--cx-orange)" : "var(--cx-label)") + '">' + tt.toMark + "</b><span>To mark</span></div>" +
      "<div><b>" + tt.marks + "</b><span>Recent marks</span></div></div>";
    box.appendChild(hero);
    box.appendChild(el("p", "cx-note", p == null ? "Nothing of theirs is due yet." :
      "Of the work that is due in their courses, " + Math.round(p * 100) + "% is marked." +
      (tt.last ? " They last marked something " + whenName(tt.last) + "." : "")));
    var list = el("div", "cx-ilist");
    tt.courses.forEach(function (c) {
      var cp = c.cells ? Math.round(c.dealt / c.cells * 100) : null;
      var col = cp == null ? "var(--cx-gray)" : cp >= 90 ? "var(--cx-green)" : cp >= 70 ? "var(--cx-teal)" : "var(--cx-orange)";
      var r = el("button", "cx-irow");
      r.type = "button";
      r.innerHTML = '<span class="t"><b>' + esc(c.title) + "</b><span>" + c.students + " students · average " +
        (c.average == null ? "—" : c.average + "%") + (c.toMark ? ' · <em>' + c.toMark + " to mark</em>" : "") + "</span></span>" +
        '<span class="bar"><i style="width:' + (cp == null ? 0 : Math.max(2, cp)) + "%;background:" + col + '"></i></span>' +
        '<span class="g"><b>' + (cp == null ? "—" : cp + "%") + "</b><span>marked</span></span>";
      r.addEventListener("click", function () { openCoursePage(c.raw); });
      list.appendChild(r);
    });
    box.appendChild(list);
    return box;
  }

  function cxNum(n) { return n == null ? "—" : String(Math.round(n * 10) / 10); }

  function miniDist(dist) {
    var total = dist.reduce(function (a, b) { return a + b.n; }, 0) || 1;
    var bar = el("div", "cx-mini");
    bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", dist.map(function (b) { return b.n + " " + b.k; }).join(", "));
    dist.forEach(function (b) {
      if (!b.n) return;
      var s = el("i");
      s.style.cssText = "flex:" + b.n / total + ";background:" + b.color;
      s.title = b.k + ": " + b.n;
      bar.appendChild(s);
    });
    return bar;
  }

  function avatarHtml(p) {
    return '<span class="cx-av" style="--h:' + esc(p.hue || "#8e8e93") + '" aria-hidden="true">' + esc(p.initials || "") + "</span>";
  }

  /* Three rings on black, Apple's way: a track, and an arc that fills to the
     share it stands for. */
  function ringsSvg(ps) {
    var NS = "http://www.w3.org/2000/svg", size = 190, c = size / 2, w = 17;
    var R = [c - w / 2 - 2, c - w * 1.5 - 5, c - w * 2.5 - 8];
    var G = [["#fa114f", "#ff5a87"], ["#86f000", "#c7ff3c"], ["#00d0ff", "#6af0ff"]];
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + size + " " + size);
    svg.setAttribute("class", "cx-ringsvg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Marked " + Math.round(ps[0] * 100) + "%, handed in " + Math.round(ps[1] * 100) +
      "%, passing " + Math.round(ps[2] * 100) + "%");
    var defs = "<defs>" + G.map(function (g, k) {
      return '<linearGradient id="cxg' + k + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + g[0] + '"/><stop offset="1" stop-color="' + g[1] + '"/></linearGradient>';
    }).join("") + "</defs>";
    var arcs = [];
    svg.innerHTML = defs + R.map(function (r, k) {
      var len = 2 * Math.PI * r;
      arcs.push({ k: k, len: len });
      return '<circle class="trk" cx="' + c + '" cy="' + c + '" r="' + r + '" stroke="' + G[k][0] + '" stroke-width="' + w + '"/>' +
        '<circle class="arc" cx="' + c + '" cy="' + c + '" r="' + r + '" stroke="url(#cxg' + k + ')" stroke-width="' + w + '" stroke-dasharray="' +
        len.toFixed(1) + '" stroke-dashoffset="' + len.toFixed(1) + '" transform="rotate(-90 ' + c + " " + c + ')"/>';
    }).join("");
    // Fill after the card has arrived, so the rings close the way Fitness closes them.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var list = svg.querySelectorAll(".arc");
        arcs.forEach(function (a) {
          var p = Math.max(0, Math.min(1, ps[a.k] || 0));
          list[a.k].setAttribute("stroke-dashoffset", (a.len * (1 - p)).toFixed(1));
          if (p === 0) list[a.k].style.opacity = "0";
        });
      });
    });
    return svg;
  }

  function miniRing(pct) {
    var r = 13, len = 2 * Math.PI * r, p = pct == null ? 0 : Math.max(0, Math.min(1, pct / 100));
    var col = pct == null ? "var(--cx-gray)" : pct >= 80 ? "var(--cx-green)" : pct >= CX_PASS ? "var(--cx-teal)" : pct >= 60 ? "var(--cx-orange)" : "var(--cx-red)";
    return '<svg class="cx-mring" viewBox="0 0 34 34" aria-hidden="true"><circle class="trk" cx="17" cy="17" r="' + r + '"/>' +
      '<circle cx="17" cy="17" r="' + r + '" stroke="' + col + '" stroke-dasharray="' + len.toFixed(1) + '" stroke-dashoffset="' +
      (len * (1 - p)).toFixed(1) + '" transform="rotate(-90 17 17)"/></svg>';
  }

  /* Bars, the way Health and Screen Time draw them: rounded, a dashed grid,
     the day or the bucket under each, and — for a series — the average. */
  function barChart(items, o) {
    o = o || {};
    var NS = "http://www.w3.org/2000/svg", W = o.wide ? 1100 : 560, H = o.wide ? 190 : 180, padB = 22, padT = 16, gap = items.length > 8 ? 8 : 22;
    var max = Math.max(1, Math.max.apply(null, items.map(function (x) { return x.n; })));
    var nice = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / nice) * nice;
    if (top / nice > 5) top = Math.ceil(max / (nice * 2)) * nice * 2;
    // Each bar sits centred in its slot and is never wider than a finger:
    // slim bars read as quantities, wide ones as blocks.
    var slot = (W - gap * (items.length - 1)) / items.length, bw = Math.min(slot, 26), inset = (slot - bw) / 2, ch = H - padB - padT;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", items.map(function (x) { return (x.title || x.label) + ": " + x.n; }).join(", "));
    var h = "";
    [0, .5, 1].forEach(function (f) {
      var y = padT + ch * (1 - f);
      h += '<line class="grid" x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>';
    });
    items.forEach(function (x, k) {
      var bh = x.n ? Math.max(3, ch * x.n / top) : 0, bx = k * (slot + gap) + inset, by = padT + ch - bh;
      h += '<rect class="bar" x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) +
        '" rx="' + Math.min(3, bw / 3).toFixed(1) + '" fill="' + x.color + '"><title>' + esc((x.title || x.label) + ": " + x.n) + "</title></rect>";
      if (o.values && x.n) h += '<text class="val" x="' + (bx + bw / 2).toFixed(1) + '" y="' + (by - 5).toFixed(1) + '" text-anchor="middle">' + x.n + "</text>";
      h += '<text class="ax" x="' + (bx + bw / 2).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle">' + esc(x.label) + "</text>";
    });
    if (o.average) {
      var mean = items.reduce(function (a, b) { return a + b.n; }, 0) / items.length;
      if (mean > 0) {
        var ay = padT + ch - ch * mean / top;
        h += '<line class="avg" x1="0" x2="' + W + '" y1="' + ay.toFixed(1) + '" y2="' + ay.toFixed(1) + '"/>' +
          '<text class="avgt" x="' + W + '" y="' + (ay - 5).toFixed(1) + '" text-anchor="end">avg</text>';
      }
    }
    svg.innerHTML = h;
    var wrap = el("div", "cx-chart");
    wrap.appendChild(svg);
    return wrap;
  }

  /* A sheet over the console — one student, from wherever they were picked. */
  function cxSheet(node) {
    var wrap = el("div", "cx-sheetwrap");
    var sheet = el("div", "cx-sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    var x = el("button", "cx-sheetx", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Close");
    sheet.appendChild(x);
    sheet.appendChild(node);
    wrap.appendChild(sheet);
    document.body.appendChild(wrap);
    var back = document.activeElement;
    function close() {
      document.removeEventListener("keydown", key, true);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      if (back && back.focus && document.contains(back)) back.focus();
    }
    function key(e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } }
    document.addEventListener("keydown", key, true);
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap || e.target === x) { close(); return; }
      // Going somewhere from inside the sheet closes it behind you.
      if (e.target.closest && e.target.closest(".cn-tr, .cn-btn")) setTimeout(close, 0);
    });
    x.focus();
    return { close: close };
  }

  function openStudentSheet(s) { cxSheet(studentInspector(s)); }

  /* ------------------------------------------------------------------- Work
     Everything set, across every course. The gradebook is where work is marked;
     this is where it is kept — renamed, re-weighted, given a due date, or
     removed. */
  function tabWork(v) {
    consoleHead(v, "Teaching", "Work",
      "Everything set across your courses. A piece of work is a column on the " +
      "gradebook, and what it is out of is what a mark on it is measured against.");

    var node = loading(v, "your courses");
    (consoleMode() === "admin" ? API.courses.all(S.me.orgId) : API.courses.mine()).then(function (courses) {
      var teaching = consoleMode() === "admin" ? courses
        : courses.filter(function (c) { return c.myRole === "teacher" || c.myRole === "assistant"; });
      node.remove();
      if (!teaching.length) {
        v.appendChild(S.me.role === "admin"
          ? cnEmpty("No courses yet, so there is nothing set.",
              "Work is set on a course. Make one first and its columns appear here.",
              "Explore courses", openCatalogue)
          : cnEmpty("No courses yet, so there is nothing set.",
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
        all.innerHTML = "<b>Every course</b><span>" + data.rows.length + " reports</span>";
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
    var admin = consoleMode() === "admin";

    var box = el("div", "cn-finder");
    var input = el("input", "cn-finderin");
    input.type = "text";
    input.placeholder = admin ? "Go to…" : "Search OEdu";
    input.setAttribute("aria-label", admin ? "Go to" : "Search OEdu");
    box.appendChild(input);
    if (!admin) box.appendChild(el("p", "cn-finderhint", "Students, assignments, lessons, standards, courses, places"));
    var list = el("div", "cn-finderlist");
    box.appendChild(list);
    wrap.appendChild(box);

    var places = allowedTabs().filter(function (t) { return !t.hidden; }).map(function (t) {
      return { name: t.name, hint: t.group || "Console", kind: "place", go: function () { openAdmin(false, t.k); } };
    });
    places.push({ name: "Account", hint: "Sessions, password, sign out", kind: "place", go: openAccount });

    /* A teacher's search reaches past the places: every student, every piece
       of work and every lesson in the courses they teach, read from the same
       books the pages use. Before it arrives the places still work. */
    var actions = admin ? [] : [
      { name: "New assignment", hint: "Quick action", kind: "action", icon: "plus", go: function () { openAssignSheet({}); } },
      { name: "Assign a lesson", hint: "Quick action", kind: "action", icon: "plus", go: function () { openAssignSheet({ where: "oedu" }); } },
      { name: "New assessment", hint: "Quick action", kind: "action", icon: "plus", go: function () { openAssignSheet({ where: "oedu" }); } },
      { name: "Start grading", hint: "Quick action", kind: "action", icon: "inbox", go: function () { openAdmin(false, "tograde"); } }
    ];
    function remember(p) {
      if (admin || !p.ref) return;
      var r = recentFound().filter(function (x) { return x.ref !== p.ref; });
      r.unshift({ ref: p.ref, name: p.name, hint: p.hint });
      try { localStorage.setItem("oplo.teach.recent", JSON.stringify(r.slice(0, 5))); } catch (e) { /* private mode */ }
    }

    if (admin) {
      if (FOUND_PEOPLE && FOUND_PEOPLE.mode === "admin") addPeople(FOUND_PEOPLE.list);
      else loadSchool().then(function (data) {
        FOUND_PEOPLE = { mode: "admin", list: data.students };
        addPeople(data.students);
        draw();
      }, function () { /* the places still work */ });
    } else {
      loadSchool().then(function (d) {
        addPeople(d.students);
        d.courses.forEach(function (c) {
          places.push({ name: c.title, hint: "Course · " + cxPlural(c.students, "student"), kind: "course", ref: "c:" + c.id,
            go: function () { S.courseId = c.id; S.gbView = "overview"; openAdmin(false, "roster"); } });
          (c.book.assignments || []).forEach(function (a) {
            places.push({ name: a.title, hint: "Assignment · " + c.title + (a.dueAt ? " · due " + dayName(a.dueAt) : ""), kind: "work", ref: "a:" + a.id,
              go: function () { openGrading(c, a); } });
          });
          var cur = curriculumOf(c.raw);
          if (cur) unitsOf(cur).forEach(function (u) {
            places.push({ name: "Unit " + u.n + " · " + u.t, hint: "Lesson · Standard · " + c.title, kind: "lesson", ref: "u:" + cur.id + ":" + u.n,
              go: function () { openUnit(cur, u.n); } });
          });
        });
        draw();
      }, function () { /* the places still work */ });
    }
    function addPeople(people) {
      people.forEach(function (st) {
        places.push({
          name: st.name, kind: "student", ref: "s:" + st.id,
          hint: st.standing == null ? "Student" : "Student · " + st.standing + "%",
          go: function () { if (admin) openStudent360(st); else openStudentSheet(st); }
        });
      });
    }

    var picked = 0;
    function draw() {
      var term = input.value.trim().toLowerCase();
      var rows = [];
      if (!term && !admin) {
        var rec = recentFound().map(function (r) {
          var live = places.filter(function (p) { return p.ref === r.ref; })[0];
          return live ? { name: live.name, hint: live.hint, go: live.go, ref: live.ref } : null;
        }).filter(Boolean);
        if (rec.length) { rows.push({ head: "Recent" }); rows = rows.concat(rec); }
        rows.push({ head: "Quick actions" });
        rows = rows.concat(actions);
        rows.push({ head: "Places" });
        rows = rows.concat(places.filter(function (p) { return p.kind === "place"; }));
      } else {
        rows = places.concat(actions).filter(function (p) {
          return !term || p.name.toLowerCase().indexOf(term) > -1 || p.hint.toLowerCase().indexOf(term) > -1;
        }).slice(0, 60);
      }
      var hits = rows.filter(function (p) { return !p.head; });
      if (picked >= hits.length) picked = Math.max(0, hits.length - 1);
      list.innerHTML = "";
      var i = 0;
      rows.forEach(function (p) {
        if (p.head) { list.appendChild(el("p", "cn-finderhead", esc(p.head))); return; }
        var me = i++;
        var b = el("button", "cn-finderrow" + (me === picked ? " on" : ""));
        b.type = "button";
        b.innerHTML = (p.icon ? '<span class="ic">' + cxIcon(p.icon) + "</span>" : "") + "<b>" + esc(p.name) + "</b><span>" + esc(p.hint) + "</span>";
        b.addEventListener("click", function () { closeFinder(); remember(p); p.go(); });
        list.appendChild(b);
      });
      if (!hits.length) list.appendChild(el("p", "cn-findernone", "Nothing called that."));
      list.dataset.n = hits.length;
      box.hits = hits;
      var on = list.querySelector(".cn-finderrow.on");
      if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
    }

    input.addEventListener("input", function () { picked = 0; draw(); });
    input.addEventListener("keydown", function (e) {
      var n = Number(list.dataset.n) || 0;
      if (e.key === "ArrowDown") { e.preventDefault(); picked = Math.min(n - 1, picked + 1); draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); picked = Math.max(0, picked - 1); draw(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        var p = box.hits[picked];
        if (p) { closeFinder(); remember(p); p.go(); }
      } else if (e.key === "Escape") { closeFinder(); }
    });
    wrap.addEventListener("click", function (e) { if (e.target === wrap) closeFinder(); });

    draw();
    input.focus();
  }
  function recentFound() {
    try { var r = JSON.parse(localStorage.getItem("oplo.teach.recent") || "[]"); return Array.isArray(r) ? r : []; }
    catch (e) { return []; }
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
     The course, as one sheet.

     What was here before was a card per student, and a screen per student to
     mark them on. Marking one quiz for twenty-eight students meant opening
     twenty-eight screens, and the arithmetic a teacher actually does — who
     has not handed this in, what did the students find hard, who is sliding —
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
       the course picker, which made it the one place you could arrive and not
       be told where you were. */
    consoleHead(v, "Teaching", "Gradebook",
      "Students down, work across. Type a score, <b>m</b> for not handed in, " +
      "<b>e</b> for excused.");

    var node = loading(v, "your courses");

    (consoleMode() === "admin" ? API.courses.all(S.me.orgId) : API.courses.mine()).then(function (courses) {
      var teaching = consoleMode() === "admin"
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

      /* One course at a time. A stack of grids is a stack of things to scroll
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

  /* One request for the whole course. It used to be one for the members, one
     for the work, and two per student — sixty-odd for thirty students, each
     able to fail on its own and leave the sheet half true. */
  function loadBook(host, courseId) {
    host.innerHTML = "";
    var node = loading(host, "the gradebook");
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
    acts.appendChild(cnAction("Set work", function () {
      if (consoleMode() === "admin") openAssignments(courseOf()); else openAssignSheet({ courseId: BOOK.course.id, done: function () { loadBook(BOOK.host, BOOK.course.id); } });
    }));
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
    fr.appendChild(el("div", "gb-c name", "<span class='gb-hn'>Course</span>"));
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
    // Handed in on OEdu and not marked yet: a dot, and what OEdu measured.
    var sub = handedIn(cell.work.id, cell.student.id);
    if (sub && !(g && (g.score != null || g.status === "excused"))) {
      cls += " handed";
      cell.input.placeholder = sub.result && sub.result.pct != null ? sub.result.pct + "%" : "✓";
      cell.wrap.title = "Handed in on OEdu " + whenName(sub.submittedAt) + (sub.result && sub.result.detail ? " · " + sub.result.detail : "");
    } else {
      cell.input.placeholder = "";
      cell.wrap.removeAttribute("title");
    }
    cell.wrap.className = cls;
  }

  function handedIn(assignmentId, accountId) {
    var list = (BOOK && BOOK.submissions) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].assignmentId === assignmentId && list[i].accountId === accountId) return list[i];
    }
    return null;
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
        : "The course average on " + a.title + ", over what has been marked.";
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

  /* The course's own numbers — what each column averages, what is still owed —
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

  /* Who teaches a course — which, in the school's console, is decided here
     rather than by whoever happened to create it. Each teacher can be taken
     off; anybody in the school who is not a student of this course can be
     put on. The server checks the administrator's right on every change. */
  function teacherPicker(course, people, members) {
    var wrap = el("div");
    wrap.appendChild(el("p", "cx-sethead", "Teachers"));
    var box = el("div", "cx-set");
    wrap.appendChild(box);
    var teaching = members.filter(function (m) { return m.role === "teacher" || m.role === "assistant"; });
    var students = {};
    members.forEach(function (m) { if (m.role === "student") students[m.id] = true; });
    function done(msg) { SCHOOL = null; toast(msg); openEnrol(course); }
    if (!teaching.length) {
      box.appendChild(el("div", "cx-setrow", '<span class="ic" style="--c:var(--cx-orange)">' + cxIcon("alert") +
        '</span><span class="t"><b>No teacher yet</b><span>Nobody can mark this course until somebody is assigned to teach it.</span></span><span class="v"></span>'));
    }
    teaching.forEach(function (m) {
      var r = el("div", "cx-setrow");
      r.innerHTML = avatarHtml(m) + '<span class="t"><b>' + esc(m.name) + "</b><span>" + esc(m.email || "") + "</span></span>";
      var off = el("button", "cn-btn small", "Remove");
      off.type = "button";
      off.addEventListener("click", function () {
        if (!confirm("Take " + m.name + " off " + course.title + "?")) return;
        off.disabled = true;
        attempt(API.courses.enrol(course.id, m.id, m.role, true), function () { done(m.name + " no longer teaches " + course.title + "."); })
          .then(function () { off.disabled = false; });
      });
      var vv = el("span", "v");
      vv.appendChild(off);
      r.appendChild(vv);
      box.appendChild(r);
    });
    var add = el("div", "cx-setrow");
    add.innerHTML = '<span class="ic" style="--c:var(--cx-accent)">' + cxIcon("badge") + '</span><span class="t"><b>Assign a teacher</b><span>Anybody in the school who isn’t a student here.</span></span>';
    var pick = el("select", "cx-select");
    pick.setAttribute("aria-label", "Choose a teacher");
    var on = {};
    teaching.forEach(function (m) { on[m.id] = true; });
    pick.innerHTML = '<option value="">Choose a person…</option>' + people
      .filter(function (p) { return !on[p.id] && !students[p.id]; })
      .map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + (p.title ? " — " + esc(p.title) : "") + "</option>"; }).join("");
    var go = el("button", "cn-btn small strong", "Assign");
    go.type = "button";
    go.addEventListener("click", function () {
      var id = pick.value;
      if (!id) { pick.focus(); return; }
      var who = people.filter(function (p) { return p.id === id; })[0];
      go.disabled = true;
      attempt(API.courses.enrol(course.id, id, "teacher", false), function () { done((who ? who.name : "They") + " now teaches " + course.title + "."); })
        .then(function () { go.disabled = false; });
    });
    var vv = el("span", "v");
    vv.appendChild(pick);
    vv.appendChild(go);
    add.appendChild(vv);
    box.appendChild(add);
    wrap.appendChild(el("p", "cx-sethead", "Students"));
    return wrap;
  }

  /* ------------------------------------------------------------ Enrolment */
  function openEnrol(course, studentName, studentEmail) {
    enter("enrol:" + course.id, trim(course.title), function () { openEnrol(course, studentName, studentEmail); });
    var v = $("#v-admin");
    v.innerHTML = "";

    /* If student info provided, auto-create and enrol */
    if (studentName && studentEmail) {
      openEnrolCreate(course, studentName, studentEmail);
      return;
    }

    consoleHead(v, course.title, "Who is in this course",
      "A student enrolled here has this course on their own screen, and their work on " +
      "it counts towards their grade.");
    var node = loading(v, "people");

    Promise.all([API.accounts.list(S.me.orgId), API.courses.members(course.id)])
      .then(function (out) {
        var people = out[0], members = out[1];
        node.remove();

        var acts = cnActions();
        acts.appendChild(cnAction("Add student", function () { openEnrolCreate(course); }, true));
        acts.appendChild(cnAction("Quick assign", function () { openEnrolCreate(course, "Saswat Chen", "saswatc@nycstudents.net"); }, true));
        v.appendChild(acts);

        var inCourse = {};
        members.forEach(function (m) { inCourse[m.id] = m.role; });
        if (consoleMode() === "admin") v.appendChild(teacherPicker(course, people, members));

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

  /* ---------------------------------------------------------- Enrol by course name */
  function openEnrolByCourseName(name, studentName, studentEmail) {
    var node = loading($("#v-admin"), "finding course");
    (consoleMode() === "admin" ? API.courses.all(S.me.orgId) : API.courses.mine()).then(function (courses) {
      node.remove();
      var course = courses.filter(function (c) { return c.title === name; })[0];
      if (!course) { toast("Could not find course: " + name); return; }
      openEnrol(course, studentName, studentEmail);
    }, function () { toast("Could not load courses."); });
  }

  /* ---------------------------------------------------------- Quick enrol student */
  function openEnrolCreate(course, studentName, studentEmail) {
    enter("enrol-create:" + course.id, trim(course.title), function () { openEnrolCreate(course); });
    var v = $("#v-admin");
    v.innerHTML = "";
    consoleHead(v, course.title, "Enrolling a student",
      "Adding a student gives them access to this course and their work counts toward their grade.");

    var node = loading(v, "checking");
    API.accounts.list(S.me.orgId).then(function (people) {
      var existing = people.filter(function (p) {
        return (p.email || "").toLowerCase() === (studentEmail || "").toLowerCase();
      });
      node.remove();

      if (existing.length) {
        var person = existing[0];
        attempt(API.courses.enrol(course.id, person.id, "student", false), function () {
          toast(person.name + " is now enrolled in " + course.title + ".");
          setTimeout(function () { openEnrol(course); }, 800);
        });
        return;
      }

      /* Create the student account first */
      var form = el("div", "admin-form");
      var name = field("Full name", studentName || "");
      var email = field("Email", studentEmail || "");
      var pw = field("Password", "");
      pw.input.type = "password";
      pw.input.autocomplete = "new-password";
      [name, email, pw].forEach(function (f) { form.appendChild(f); });
      v.appendChild(form);

      var acts = el("div", "admin-acts");
      var save = el("button", "lx-btn lg", "Create and enrol");
      save.type = "button";
      save.addEventListener("click", function () {
        if (!name.input.value.trim()) { toast("A name is needed."); return; }
        if (!email.input.value.trim()) { toast("An email is needed."); return; }
        save.disabled = true;
        attempt(API.accounts.create({
          email: email.input.value.trim(),
          name: name.input.value.trim(),
          password: pw.input.value || "change-me",
          role: "student",
          orgId: S.me.orgId
        }), function (account) {
          attempt(API.courses.enrol(course.id, account.id, "student", false), function () {
            toast(name.input.value.trim() + " is now enrolled in " + course.title + ".");
            setTimeout(function () { openEnrol(course); }, 800);
          });
        }).then(function () { save.disabled = false; });
      });
      acts.appendChild(save);
      v.appendChild(acts);
      show("admin");
    }, function () { toast("Could not check accounts."); });
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

  /* ============================================================ Student 360
     One student, whole: where they stand and why, the evidence behind every
     grade, what is missing, what changed and who changed it, how far they are
     from a diploma, and who their family is. Every part is a read the school
     is already allowed — the report, the grades and their history, the
     graduation record, the family record — so this page adds no new source of
     truth; it puts the ones there are side by side. */
  function openStudent360(s, tab) {
    enter("student360:" + s.id, trim(s.name || "Student", 18), function () { openStudent360(s, S.s360tab); });
    S.s360tab = tab || S.s360tab || "overview";
    var v = $("#v-admin");
    v.innerHTML = "";
    var body = el("div", "admin-body cx-360");
    v.appendChild(body);

    var head = el("header", "cx-360h");
    head.innerHTML = avatarHtml(s) + '<div class="t"><p class="cn-eyebrow">Student</p><h1 class="cn-h1">' + esc(s.name || "") +
      '</h1><p class="cn-sub" data-sub>' + esc(s.email || "") + "</p></div>";
    var tools = el("div", "cx-tools");
    tools.appendChild(cnAction("Report card", function () { openReport(s); }));
    tools.appendChild(cnAction("Diploma record", function () { openRecord(s); }));
    tools.appendChild(cnAction("Family view", function () {
      var H = window.OPLO_HOME;
      window.open(H.pathFor(H.parse(location.pathname).root, "parent") + "?student=" + encodeURIComponent(s.id), "_blank", "noopener");
    }));
    head.appendChild(tools);
    body.appendChild(head);

    var TABS = [["overview", "Overview"], ["grades", "Grades"], ["missing", "Missing work"], ["timeline", "Timeline"],
                ["graduation", "Graduation"], ["family", "Family"]];
    var seg = el("div", "cn-seg cx-360tabs");
    TABS.forEach(function (t) {
      var b = el("button", "cn-segb" + (S.s360tab === t[0] ? " on" : ""), t[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        S.s360tab = t[0];
        [].forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); });
        draw();
      });
      seg.appendChild(b);
    });
    body.appendChild(seg);
    var pane = el("div", "cx-360p");
    body.appendChild(pane);
    var node = loading(pane, "everything about " + (s.firstName || s.name || "them"));
    var D = null;
    Promise.all([
      API.accounts.get(s.id).catch(function () { return null; }),
      API.reporting.report(s.id),
      API.grades.history({ accountId: s.id, limit: 200 }).catch(function () { return []; }),
      API.graduation.get(s.id).catch(function () { return null; }),
      API.family.guardians(s.id).catch(function () { return []; }),
      API.family.getContact(s.id).catch(function () { return null; }),
      API.family.records(s.id).catch(function () { return {}; }),
      API.progress.all(s.id).catch(function () { return {}; }),
      loadSchool().catch(function () { return null; })
    ]).then(function (r) {
      node.remove();
      D = { account: r[0], report: r[1], events: r[2] || [], grad: r[3], guardians: r[4] || [], contact: r[5], records: r[6] || {},
            progress: r[7] || {}, school: r[8] };
      var sub = head.querySelector("[data-sub]");
      if (sub && D.account) sub.textContent = [D.account.title, D.account.email].filter(Boolean).join(" · ");
      // Due dates and teachers, from the school's gradebooks.
      D.due = {}; D.teachers = {};
      ((D.school && D.school.courses) || []).forEach(function (c) {
        D.teachers[c.id] = c.teachers.map(function (t) { return t.name; }).join(", ");
        ((c.book && c.book.assignments) || []).forEach(function (a) { D.due[a.id] = a.dueAt; });
      });
      draw();
    }, function (e) { failed(node, e, function () { openStudent360(s); }); });

    function draw() {
      if (!D) return;
      pane.innerHTML = "";
      ({ overview: s360Overview, grades: s360Grades, missing: s360Missing, timeline: s360Timeline,
         graduation: s360Graduation, family: s360Family }[S.s360tab] || s360Overview)(pane, D, s);
    }
  }

  function trendText(t) {
    if (!t || t.change == null) return "";
    if (!t.change) return "steady over the last " + t.over + " marks";
    return (t.change > 0 ? "▲ " : "▼ ") + Math.abs(t.change) + " pts over the last " + t.over + " marks";
  }
  function gradeTone(p) {
    return p == null ? "var(--cx-gray)" : p >= 80 ? "var(--cx-green)" : p >= CX_PASS ? "var(--cx-teal)" : p >= 60 ? "var(--cx-orange)" : "var(--cx-red)";
  }
  function s360Card(grid, cls, title, icon, tone) {
    var c = el("section", "cx-card " + cls);
    if (title) c.appendChild(el("header", "cx-ch", '<span class="ic" style="--c:' + tone + '">' + cxIcon(icon) + "</span><h3>" + esc(title) + "</h3>"));
    grid.appendChild(c);
    return c;
  }
  function missingOf(report) {
    var out = [];
    (report.courses || []).forEach(function (c) {
      (c.marks || []).forEach(function (m) { if (m.status === "missing") out.push({ course: c, mark: m }); });
    });
    return out;
  }

  function s360Overview(pane, D, s) {
    var R = D.report, grid = el("div", "cx-grid");
    pane.appendChild(grid);
    var courses = R.courses || [], graded = courses.filter(function (c) { return c.grade; });
    var below = graded.filter(function (c) { return c.grade.percent < CX_PASS; });
    var missing = missingOf(R);

    var st = s360Card(grid, "cx-s5", "Where they stand", "summary", "var(--cx-accent)");
    var hero = el("div", "cx-ihero");
    var p = R.standing;
    hero.innerHTML = '<div class="ring">' + miniRing(p).replace('class="cx-mring"', 'class="cx-mring big"') + "<b>" + (p == null ? "—" : p + "<small>%</small>") + "</b></div>" +
      '<div class="stats"><div><b>' + courses.length + "</b><span>Courses</span></div>" +
      '<div><b style="color:' + (below.length ? "var(--cx-red)" : "var(--cx-label)") + '">' + below.length + "</b><span>Below a pass</span></div>" +
      '<div><b style="color:' + (missing.length ? "var(--cx-orange)" : "var(--cx-label)") + '">' + missing.length + "</b><span>Missing</span></div></div>";
    st.appendChild(hero);
    st.appendChild(el("p", "cx-note", p == null ? "Nothing has been marked yet." :
      "The mean of their course grades, " + (p >= CX_PASS ? "at or above" : "below") + " the " + CX_PASS + "% pass line. Report card: " +
      (R.state === "ready" ? "ready to send." : R.state === "blocked" ? "not ready yet — see below." : esc(R.state || "") + ".")));

    // Why: each course, weakest first, with its trend and its weakest evidence.
    var why = s360Card(grid, "cx-s7", "Why — course by course", "alert", "var(--cx-red)");
    var list = el("div", "cx-ilist");
    courses.slice().sort(function (a, b) { return (a.grade ? a.grade.percent : 999) - (b.grade ? b.grade.percent : 999); }).forEach(function (c) {
      var g = c.grade, pc = g ? g.percent : null, weak = c.evidence && c.evidence.weakest;
      var miss = (c.marks || []).filter(function (m) { return m.status === "missing"; }).length;
      var bits = [];
      if (c.trend && c.trend.change) bits.push(trendText(c.trend));
      if (weak) bits.push("weakest in " + weak.category + " (" + weak.percent + "%)");
      if (miss) bits.push("<em>" + miss + " missing</em>");
      var r = el("button", "cx-irow");
      r.type = "button";
      r.innerHTML = '<span class="t"><b>' + esc(c.title) + "</b><span>" + (bits.length ? bits.join(" · ") : esc(D.teachers[c.courseId] || c.subject || "")) + "</span></span>" +
        '<span class="bar"><i style="width:' + (pc == null ? 0 : Math.max(2, Math.min(100, pc))) + "%;background:" + gradeTone(pc) + '"></i></span>' +
        '<span class="g"><b>' + (g ? esc(g.letter || "") : "—") + "</b><span>" + (pc == null ? "" : pc + "%") + "</span></span>";
      r.addEventListener("click", function () { S.s360tab = "grades"; openStudent360(s, "grades"); });
      list.appendChild(r);
    });
    why.appendChild(list);

    // What changed.
    var ch = s360Card(grid, "cx-s7", "What changed", "clock", "var(--cx-teal)");
    var feed = el("div", "cx-feed");
    var titles = {};
    courses.forEach(function (c) { (c.marks || []).forEach(function (m) { titles[m.assignmentId] = c.title; }); });
    D.events.slice(0, 6).forEach(function (e) {
      var r = el("div", "cx-ev");
      r.innerHTML = '<span class="cx-av" style="--h:var(--cx-teal)">' + cxIcon("pencil") + '</span><span class="t"><b>' + esc(e.title) + "</b><span> · " +
        esc(titles[e.assignmentId] || "") + " → </span><span class=\"cx-chg\">" + esc(changeText(e)) + "</span><span> by " + esc(e.actorName || "someone") +
        "</span></span><time>" + esc(whenName(e.at)) + "</time>";
      feed.appendChild(r);
    });
    if (!D.events.length) feed.appendChild(el("p", "cx-note", "No marks have changed yet."));
    ch.appendChild(feed);

    // What stands between them and a report card.
    var rd = s360Card(grid, "cx-s5", "Report card", "doc", "var(--cx-purple)");
    var reasons = [];
    courses.forEach(function (c) { ((c.readiness && c.readiness.reasons) || []).forEach(function (x) { reasons.push(x.text); }); });
    rd.appendChild(el("p", "cx-note", reasons.length ? "Not ready to send. What is still to do:" : "Ready: every course is marked and has its comment."));
    if (reasons.length) {
      var ul = el("ul", "cx-bul");
      ul.innerHTML = reasons.slice(0, 8).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
      rd.appendChild(ul);
    }

    // Learning on OEdu, from the student's own synced progress.
    var lp = s360Card(grid, "cx-s6", "Learning on OEdu", "sparkle", "var(--cx-indigo)");
    var lab = D.progress.lab || {}, lessons = lab.lessons ? Object.keys(lab.lessons).filter(function (k) { return lab.lessons[k] && lab.lessons[k].done; }).length : 0;
    var skills = lab.skills ? Object.keys(lab.skills) : [];
    var mastered = skills.filter(function (k) { return (lab.skills[k] || {}).lv >= 4; }).length;
    lp.appendChild(el("p", "cx-note", lessons || skills.length
      ? "Interactive lessons finished: <b>" + lessons + "</b> · skills practised: <b>" + skills.length + "</b>, mastered: <b>" + mastered + "</b>."
      : "No interactive lessons recorded on OEdu yet."));

    // Family.
    var fam = s360Card(grid, "cx-s6", "Family", "people", "var(--cx-cyan)");
    fam.appendChild(el("p", "cx-note", D.guardians.length
      ? D.guardians.map(function (g) { return "<b>" + esc(g.name || g.email || "Guardian") + "</b>" + (g.relationship ? " · " + esc(g.relationship) : ""); }).join("<br>")
      : "No guardian is linked yet. Add one from Family view."));
  }

  function changeText(e) {
    var to = e.toStatus === "missing" ? "missing" : e.toStatus === "excused" ? "excused" : e.toScore == null ? "cleared" : cxNum(e.toScore) + " / " + cxNum(e.outOf);
    var from = e.fromStatus == null && e.fromScore == null ? "" : (e.fromStatus === "missing" ? "missing" : e.fromStatus === "excused" ? "excused" : e.fromScore == null ? "—" : cxNum(e.fromScore)) + " → ";
    return from + to;
  }

  function s360Grades(pane, D, s) {
    var courses = D.report.courses || [];
    if (!courses.length) { pane.appendChild(cnEmpty("Not enrolled in any course.", "Enrol them in a course and their grades appear here.")); return; }
    courses.forEach(function (c) {
      var g = c.grade, pc = g ? g.percent : null;
      var sec = el("section", "cx-card cx-s12 cx-gcard");
      sec.innerHTML = '<header class="cx-ch"><span class="ic" style="--c:' + gradeTone(pc) + '">' + cxIcon("books") + "</span><h3>" + esc(c.title) + "</h3><small>" +
        esc(D.teachers[c.courseId] || c.subject || "") + '</small></header><div class="cx-gtop"><b style="color:' + gradeTone(pc) + '">' + (g ? esc(g.letter) + " · " + pc + "%" : "—") +
        "</b><span>" + esc(trendText(c.trend)) + "</span></div>";
      var cats = el("div", "cx-cats");
      ((c.evidence && c.evidence.byCategory) || []).forEach(function (x) {
        cats.innerHTML += '<div><span>' + esc(x.category) + " · " + x.items + '</span><span class="bar"><i style="width:' + Math.max(2, Math.min(100, x.percent)) +
          "%;background:" + gradeTone(x.percent) + '"></i></span><b>' + x.percent + "%</b></div>";
      });
      sec.appendChild(cats);
      var t = cnTable([{ label: "Work", w: "minmax(150px, 1.3fr)" }, { label: "Category", w: "110px" }, { label: "Due", w: "100px" },
                       { label: "Mark", w: "90px", align: "right" }, { label: "", w: "90px", align: "right" }]);
      (c.marks || []).forEach(function (m) {
        var mark = m.status === "missing" ? "<span class='cx-pill orange'>missing</span>" : m.status === "excused" ? "<span class='cx-pill'>excused</span>"
          : m.score == null ? "<span class='cn-none'>not marked</span>" : "<b>" + cxNum(m.score) + "</b> / " + cxNum(m.outOf);
        var pct = m.score != null && m.outOf ? Math.round(m.score / m.outOf * 100) : null;
        t.row([esc(m.title), esc(m.category || "—"), D.due[m.assignmentId] ? esc(dayName(D.due[m.assignmentId])) : "<span class='cn-none'>—</span>",
               mark, pct == null ? "" : "<b style='color:" + gradeTone(pct) + "'>" + pct + "%</b>"], null, m.assignmentId);
      });
      sec.appendChild(t);
      if (c.comment && c.comment.body) sec.appendChild(el("p", "cx-note", "<b>Teacher’s comment:</b> " + esc(c.comment.body)));
      pane.appendChild(sec);
    });
  }

  function s360Missing(pane, D) {
    var miss = missingOf(D.report);
    if (!miss.length) { pane.appendChild(cnEmpty("Nothing is missing.", "Every piece of due work has been handed in or excused.")); return; }
    var t = cnTable([{ label: "Work", w: "minmax(150px, 1.3fr)" }, { label: "Course", w: "minmax(130px, 1fr)" }, { label: "Category", w: "110px" },
                     { label: "Was due", w: "110px", align: "right" }]);
    miss.sort(function (a, b) { return (D.due[a.mark.assignmentId] || 0) - (D.due[b.mark.assignmentId] || 0); }).forEach(function (x) {
      t.row([esc(x.mark.title), esc(x.course.title), esc(x.mark.category || "—"),
             D.due[x.mark.assignmentId] ? esc(dayName(D.due[x.mark.assignmentId])) : "—"], null, x.mark.assignmentId);
    });
    pane.appendChild(el("p", "cx-note", miss.length + (miss.length === 1 ? " piece" : " pieces") + " of work marked missing. Missing work counts as nothing in the grade until it is handed in, so each one here is pulling a grade down."));
    pane.appendChild(t);
  }

  function s360Timeline(pane, D) {
    if (!D.events.length) { pane.appendChild(cnEmpty("No marks have changed yet.", "Every change to one of their marks appears here — before, after, who and when.")); return; }
    var titles = {};
    (D.report.courses || []).forEach(function (c) { (c.marks || []).forEach(function (m) { titles[m.assignmentId] = c.title; }); });
    var byDay = {}, order = [];
    D.events.forEach(function (e) {
      var k = new Date(Number(e.at)).toDateString();
      if (!byDay[k]) { byDay[k] = []; order.push(k); }
      byDay[k].push(e);
    });
    order.forEach(function (k) {
      pane.appendChild(el("p", "cx-sethead", esc(new Date(k).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))));
      var box = el("div", "cx-set");
      byDay[k].forEach(function (e) {
        box.appendChild(el("div", "cx-setrow", '<span class="ic" style="--c:var(--cx-teal)">' + cxIcon("pencil") + '</span><span class="t"><b>' + esc(e.title) +
          " · " + esc(titles[e.assignmentId] || "") + "</b><span>" + esc(e.actorName || "Someone") + (e.note ? " — “" + esc(e.note) + "”" : "") + '</span></span><span class="v"><span class="cx-chg">' +
          esc(changeText(e)) + "</span>&nbsp;&nbsp;" + esc(new Date(Number(e.at)).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })) + "</span>"));
      });
      pane.appendChild(box);
    });
  }

  function s360Graduation(pane, D, s) {
    var G = D.grad;
    if (!G) { pane.appendChild(cnEmpty("The diploma record could not be read.", "")); return; }
    var T = G.totals || {}, total = (G.track && G.track.total) || 0;
    var grid = el("div", "cx-grid");
    pane.appendChild(grid);
    var hc = s360Card(grid, "cx-s5", G.track ? G.track.name : "Diploma", "cap", "var(--cx-accent)");
    var pct = total ? Math.round((T.earnedTowardDiploma || T.earned || 0) / total * 100) : 0;
    var hero = el("div", "cx-ihero");
    hero.innerHTML = '<div class="ring">' + miniRing(pct).replace('class="cx-mring"', 'class="cx-mring big"') + "<b>" + pct + "<small>%</small></b></div>" +
      '<div class="stats"><div><b>' + cxNum(T.earnedTowardDiploma || T.earned || 0) + "</b><span>Credits earned</span></div><div><b>" + cxNum(total) +
      "</b><span>Required</span></div><div><b>" + (G.gpa && G.gpa.value != null ? G.gpa.value : G.gpa && G.gpa.estimate != null ? "~" + G.gpa.estimate : "—") + "</b><span>GPA</span></div></div>";
    hc.appendChild(hero);
    hc.appendChild(el("p", "cx-note", G.program ? "Program set. " + esc((G.residency && G.residency.says) || "") :
      "No diploma program is set for this student yet, so nothing counts toward one. Set it from the diploma record."));
    var act = cnActions();
    act.appendChild(cnAction("Open the diploma record", function () { openRecord(s); }, true));
    hc.appendChild(act);

    var ar = s360Card(grid, "cx-s7", "Requirements", "checklist", "var(--cx-green)");
    var list = el("div", "cx-ilist");
    (G.areas || []).forEach(function (a) {
      var p = a.required ? Math.round(Math.min(1, (a.applied || a.earned || 0) / a.required) * 100) : 0;
      list.appendChild(el("div", "cx-irow", '<span class="t"><b>' + (a.complete ? "✓ " : "") + esc(a.name) + "</b><span>" + cxNum(a.applied || a.earned || 0) + " of " + cxNum(a.required) +
        " credits" + (a.remaining ? " · " + cxNum(a.remaining) + " to go" : "") + '</span></span><span class="bar"><i style="width:' + Math.max(2, p) + "%;background:" +
        (a.complete ? "var(--cx-green)" : p >= 50 ? "var(--cx-teal)" : "var(--cx-orange)") + '"></i></span><span class="g"><b>' + p + "%</b></span>"));
    });
    ar.appendChild(list);

    if ((G.gaps || []).length) {
      var gp = s360Card(grid, "cx-s12", "Still to earn — and how", "alert", "var(--cx-orange)");
      var t = cnTable([{ label: "Requirement", w: "minmax(130px, 1fr)" }, { label: "Left", w: "70px", align: "right" },
                       { label: "Enrolled now", w: "minmax(140px, 1fr)" }, { label: "Courses that count", w: "minmax(200px, 2fr)" }]);
      G.gaps.forEach(function (g) {
        t.row([esc(g.name), cxNum(g.left), (g.enrolled || []).length ? esc(g.enrolled.map(function (x) { return x.title || x; }).join(", ")) : "<span class='cn-none'>none</span>",
               esc((g.options || []).slice(0, 5).join(", "))], null, g.key);
      });
      gp.appendChild(t);
    }
  }

  function s360Family(pane, D, s) {
    var g1 = el("p", "cx-sethead", "Guardians");
    pane.appendChild(g1);
    var box = el("div", "cx-set");
    if (!D.guardians.length) box.appendChild(el("div", "cx-setrow", '<span></span><span class="t"><span>No guardian is linked yet.</span></span>'));
    D.guardians.forEach(function (g) {
      box.appendChild(el("div", "cx-setrow", avatarHtml({ initials: String(g.name || "?").split(" ").map(function (w) { return w[0]; }).join("").slice(0, 2), hue: "#8e8e93" }) +
        '<span class="t"><b>' + esc(g.name || g.email || "Guardian") + "</b><span>" + esc([g.relationship, g.email, g.phone].filter(Boolean).join(" · ")) + "</span></span>"));
    });
    pane.appendChild(box);
    pane.appendChild(el("p", "cx-sethead", "Contact"));
    var c = D.contact || {};
    var cb = el("div", "cx-set");
    [["Cell phone", c.cellPhone], ["Other phone", c.altPhone], ["Mailing address", c.mailingAddress], ["Date of birth", c.dateOfBirth]].forEach(function (x) {
      cb.appendChild(el("div", "cx-setrow", '<span></span><span class="t"><b>' + esc(x[0]) + '</b></span><span class="v">' + (x[1] ? esc(x[1]) : "<span class='cn-none'>not recorded</span>") + "</span>"));
    });
    pane.appendChild(cb);
    var keys = Object.keys(D.records || {});
    pane.appendChild(el("p", "cx-sethead", "School records"));
    var rb = el("div", "cx-set");
    rb.appendChild(el("div", "cx-setrow", '<span></span><span class="t"><b>' + (keys.length ? esc(keys.join(", ")) : "No sections recorded") +
      "</b><span>Health, emergency and other records the school keeps are edited in Family view.</span></span>"));
    pane.appendChild(rb);
    var acts = cnActions();
    acts.appendChild(cnAction("Open Family view", function () {
      var H = window.OPLO_HOME;
      window.open(H.pathFor(H.parse(location.pathname).root, "parent") + "?student=" + encodeURIComponent(s.id), "_blank", "noopener");
    }, true));
    pane.appendChild(acts);
  }

  /* ============================================================== Gradebook
     The school's grades, as an administrator walks them: the school, then a
     department, then a course, then a student. Read, never typed — marks are
     entered by the teachers of a course, in their own gradebook. */
  function tabSchoolGradebook(v) {
    var P = S.gbPath || (S.gbPath = {});
    var top = el("div", "cx-top");
    var head = consoleHead(top, "Academics", "Gradebook", "Every grade in the school, from the whole school down to one student. Marks are entered by each course’s teachers.");
    v.appendChild(top);
    var node = loading(v, "the school’s grades");
    loadSchool().then(function (d) {
      node.remove();
      var crumbs = el("div", "cx-crumbs");
      function crumb(label, go, on) {
        var b = el("button", "cx-crumb" + (on ? " on" : ""), esc(label));
        b.type = "button";
        b.addEventListener("click", go);
        crumbs.appendChild(b);
      }
      var depts = {};
      d.courses.forEach(function (c) { var k = c.subject || "Other"; (depts[k] = depts[k] || []).push(c); });
      var course = P.course && d.courses.filter(function (c) { return c.id === P.course; })[0];
      if (P.course && !course) P.course = null;
      crumb("School", function () { S.gbPath = {}; openAdmin(true, "gradebook"); }, !P.dept);
      if (P.dept) crumb(P.dept, function () { S.gbPath = { dept: P.dept }; openAdmin(true, "gradebook"); }, !course);
      if (course) crumb(course.title, function () {}, true);
      v.appendChild(crumbs);

      function agg(list) {
        var g = 0, sum = 0, below = 0, students = 0, cells = 0, dealt = 0, missing = 0;
        list.forEach(function (c) { sum += c.sum; g += c.graded; below += c.below; students += c.students; cells += c.cells; dealt += c.dealt; missing += c.missing; });
        return { avg: g ? Math.round(sum / g) : null, below: below, students: students, marked: cells ? Math.round(dealt / cells * 100) : null, missing: missing, graded: g };
      }
      function mk(p, bad) { return p == null ? "<span class='cn-none'>—</span>" : "<b class='cn-mk" + (bad ? " bad" : "") + "'>" + p + "%</b>"; }

      if (course) {
        var acts = cnActions();
        acts.appendChild(cnAction("Open the full gradebook", function () { S.courseId = course.id; openAdmin(false, "roster"); }, true));
        acts.appendChild(cnAction("Course page", function () { openCoursePage(course.raw); }));
        v.appendChild(acts);
        var sums = (course.book && course.book.summaries) || {};
        var t = cnTable([{ label: "Student", w: "minmax(170px, 1.3fr)" }, { label: "Grade", w: "90px", align: "right" }, { label: "Letter", w: "70px", align: "right" },
                         { label: "Missing", w: "80px", align: "right" }]);
        ((course.book && course.book.students) || []).slice().sort(function (a, b) {
          return ((sums[a.id] || {}).percent || 0) - ((sums[b.id] || {}).percent || 0);
        }).forEach(function (st) {
          var sm = sums[st.id] || {};
          var who = el("span", "cn-who");
          who.appendChild(avatarFor(st));
          who.appendChild(el("span", "nm", esc(st.name)));
          t.row([who, mk(sm.percent, sm.percent != null && sm.percent < CX_PASS), esc(sm.letter || "—"),
                 sm.missingCount ? "<b class='cn-mk bad'>" + sm.missingCount + "</b>" : "<span class='cn-none'>—</span>"], function () { openStudent360(st); }, st.id);
        });
        v.appendChild(t);
        return;
      }
      var rows = P.dept ? (depts[P.dept] || []).map(function (c) { return { key: c.id, name: c.title, sub: c.teachers.map(function (t) { return t.name; }).join(", ") || "No teacher", a: agg([c]), go: function () { S.gbPath = { dept: P.dept, course: c.id }; openAdmin(true, "gradebook"); } }; })
        : Object.keys(depts).sort().map(function (k) { return { key: k, name: k, sub: depts[k].length + (depts[k].length === 1 ? " course" : " courses"), a: agg(depts[k]), go: function () { S.gbPath = { dept: k }; openAdmin(true, "gradebook"); } }; });
      var all = agg(P.dept ? depts[P.dept] || [] : d.courses);
      var tiles = el("div", "cn-tiles");
      [["Average", all.avg == null ? "—" : all.avg + "%"], ["Course grades", all.graded], ["Below a pass", all.below], ["Due work marked", all.marked == null ? "—" : all.marked + "%"], ["Missing", all.missing]]
        .forEach(function (x) { tiles.appendChild(el("div", "cn-tile", "<b>" + x[1] + "</b><span>" + x[0] + "</span>")); });
      v.appendChild(tiles);
      var t2 = cnTable([{ label: P.dept ? "Course" : "Department", w: "minmax(170px, 1.4fr)" }, { label: "Students", w: "84px", align: "right" },
                        { label: "Average", w: "84px", align: "right" }, { label: "Below a pass", w: "100px", align: "right" },
                        { label: "Marked", w: "80px", align: "right" }, { label: "Missing", w: "80px", align: "right" }]);
      rows.forEach(function (r) {
        t2.row(["<b>" + esc(r.name) + "</b><span class='cn-sub2'>" + esc(r.sub) + "</span>", String(r.a.students), mk(r.a.avg, r.a.avg != null && r.a.avg < CX_PASS),
                r.a.below ? "<b class='cn-mk bad'>" + r.a.below + "</b>" : "<span class='cn-none'>—</span>", mk(r.a.marked), r.a.missing ? "<b class='cn-mk warn'>" + r.a.missing + "</b>" : "<span class='cn-none'>—</span>"],
               r.go, r.key);
      });
      v.appendChild(t2);
    }, function (e) { failed(node, e, function () { openAdmin(true, "gradebook"); }); });
  }

  /* =========================================================== Missing work
     Every piece of due work marked missing, across the school — by student,
     by course, or piece by piece — because nine missing assignments is not a
     number to look at but a list to act on. */
  function missingRows(d) {
    var out = [];
    d.courses.forEach(function (c) {
      var gb = c.book || {}, byId = {}, st = {};
      (gb.assignments || []).forEach(function (a) { byId[a.id] = a; });
      (gb.students || []).forEach(function (s) { st[s.id] = s; });
      (gb.grades || []).forEach(function (g) {
        if (g.status !== "missing") return;
        var a = byId[g.assignmentId] || {};
        out.push({ student: st[g.accountId] || { id: g.accountId, name: "A student" }, course: c, work: a.title || g.title, category: a.category || g.category, due: a.dueAt,
                   teacher: c.teachers.map(function (t) { return t.name; }).join(", ") });
      });
    });
    return out.sort(function (a, b) { return (a.due || 0) - (b.due || 0); });
  }
  function tabMissing(v) {
    var top = el("div", "cx-top");
    consoleHead(top, "Students", "Missing work", "Every piece of due work marked missing, across the school.");
    var tools = el("div", "cx-tools");
    top.appendChild(tools);
    v.appendChild(top);
    var node = loading(v, "missing work");
    loadSchool().then(function (d) {
      node.remove();
      var rows = missingRows(d);
      tools.appendChild(cnAction("Export CSV", function () {
        csvDownload("missing-work.csv", [["Student", "Email", "Course", "Teacher", "Work", "Category", "Was due"]].concat(rows.map(function (r) {
          return [r.student.name, r.student.email, r.course.title, r.teacher, r.work, r.category, r.due ? new Date(r.due).toISOString().slice(0, 10) : ""];
        })));
      }));
      if (!rows.length) { v.appendChild(cnEmpty("Nothing is missing.", "Every piece of due work across the school has been handed in or excused.")); return; }
      S.missView = S.missView || "student";
      var bar = el("div", "cn-bar");
      var chips = cnFilters([{ k: "student", name: "By student" }, { k: "course", name: "By course" }, { k: "all", name: "Every piece", n: rows.length }],
        S.missView, function (k) { S.missView = k; draw(); });
      bar.appendChild(chips);
      v.appendChild(bar);
      var slot = el("div");
      v.appendChild(slot);
      function draw() {
        chips.mark(S.missView);
        slot.innerHTML = "";
        var t;
        if (S.missView === "student") {
          var by = {};
          rows.forEach(function (r) { var k = r.student.id; (by[k] = by[k] || { s: r.student, list: [] }).list.push(r); });
          t = cnTable([{ label: "Student", w: "minmax(170px, 1.2fr)" }, { label: "Missing", w: "80px", align: "right" }, { label: "Courses", w: "minmax(200px, 2fr)" }]);
          Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.list.length - a.list.length; }).forEach(function (x) {
            var who = el("span", "cn-who");
            who.appendChild(avatarFor(x.s));
            who.appendChild(el("span", "nm", esc(x.s.name)));
            var cs = {};
            x.list.forEach(function (r) { cs[r.course.title] = (cs[r.course.title] || 0) + 1; });
            t.row([who, "<b class='cn-mk bad'>" + x.list.length + "</b>", esc(Object.keys(cs).map(function (k) { return k + " (" + cs[k] + ")"; }).join(", "))],
                  function () { openStudent360(x.s, "missing"); }, x.s.id);
          });
        } else if (S.missView === "course") {
          var bc = {};
          rows.forEach(function (r) { var k = r.course.id; (bc[k] = bc[k] || { c: r.course, list: [] }).list.push(r); });
          t = cnTable([{ label: "Course", w: "minmax(170px, 1.2fr)" }, { label: "Missing", w: "80px", align: "right" }, { label: "Students", w: "84px", align: "right" },
                       { label: "Most missed", w: "minmax(180px, 1.6fr)" }]);
          Object.keys(bc).map(function (k) { return bc[k]; }).sort(function (a, b) { return b.list.length - a.list.length; }).forEach(function (x) {
            var works = {}, people = {};
            x.list.forEach(function (r) { works[r.work] = (works[r.work] || 0) + 1; people[r.student.id] = 1; });
            var worst = Object.keys(works).sort(function (a, b) { return works[b] - works[a]; })[0];
            t.row(["<b>" + esc(x.c.title) + "</b><span class='cn-sub2'>" + esc(x.c.teachers.map(function (q) { return q.name; }).join(", ")) + "</span>",
                   "<b class='cn-mk bad'>" + x.list.length + "</b>", String(Object.keys(people).length), esc(worst + " (" + works[worst] + ")")],
                  function () { S.gbPath = { dept: x.c.subject || "Other", course: x.c.id }; openAdmin(false, "gradebook"); }, x.c.id);
          });
        } else {
          t = cnTable([{ label: "Student", w: "minmax(150px, 1fr)" }, { label: "Work", w: "minmax(130px, 1fr)" }, { label: "Course", w: "minmax(130px, 1fr)" },
                       { label: "Was due", w: "100px", align: "right" }]);
          rows.forEach(function (r, k) {
            t.row([esc(r.student.name), esc(r.work), esc(r.course.title), r.due ? esc(dayName(r.due)) : "—"], function () { openStudent360(r.student, "missing"); }, String(k));
          });
        }
        slot.appendChild(t);
      }
      draw();
    }, function (e) { failed(node, e, function () { openAdmin(true, "missing"); }); });
  }

  /* ========================================================== Report cards
     Whether every student's report can go out, and if not, exactly what is
     holding it — read from each student's report as the school would send
     it, so the answer is never a checklist somebody kept by hand. */
  function tabReportCards(v) {
    var P = cxPage(v, "Academics", "Report Cards",
      "Every student’s report, and what — if anything — stands between it and being sent. Progress reports can go out at any time.");
    var node = loading(v, "the school’s students");
    loadSchool().then(function (d) {
      node.remove();
      var students = d.students.slice(), done = 0, reports = {}, teachers = {};
      d.courses.forEach(function (c) { teachers[c.id] = c.teachers.map(function (t) { return t.name; }).join(", "); });
      S.rcView = S.rcView || "cards";
      var seg = el("div", "cn-seg");
      [["cards", "Report cards"], ["progress", "Progress reports"]].forEach(function (x) {
        var b = el("button", "cn-segb" + (S.rcView === x[0] ? " on" : ""), x[1]);
        b.type = "button";
        b.addEventListener("click", function () {
          S.rcView = x[0];
          [].forEach.call(seg.children, function (y) { y.classList.toggle("on", y === b); });
          paint();
        });
        seg.appendChild(b);
      });
      P.tools.appendChild(seg);
      P.tools.appendChild(cnAction("Print progress reports", function () {
        var list = students.filter(function (s) { return reports[s.id]; });
        if (!list.length) { toast("Still reading the reports — try again in a moment."); return; }
        cxPrint("Progress reports", list.map(function (s) {
          var r = reports[s.id];
          return "<section class='page'>" + printHead(s.name, "Progress report") + printTable(
            [{ t: "Course" }, { t: "Teacher" }, { t: "Grade", r: 1 }, { t: "Trend" }, { t: "Missing", r: 1 }],
            (r.courses || []).map(function (c) {
              var miss = (c.marks || []).filter(function (m) { return m.status === "missing"; }).length;
              return [c.title, teachers[c.courseId] || "", c.grade ? c.grade.letter + " · " + c.grade.percent + "%" : "", trendText(c.trend), miss || ""];
            })) + (r.courses || []).filter(function (c) { return c.comment && c.comment.body; }).map(function (c) {
              return "<h2>" + esc(c.title) + "</h2><p>" + esc(c.comment.body) + "</p>";
            }).join("") + "<p class='foot'>Grades as they stand today. A progress report is not a final grade.</p></section>";
        }).join(""));
      }));
      var prog = el("p", "cx-note cx-prog");
      v.appendChild(prog);
      var tiles = el("div", "cn-tiles");
      v.appendChild(tiles);
      var slot = el("div");
      v.appendChild(slot);
      function who(s) { return cxWho(s); }
      function paint() {
        var list = students.filter(function (s) { return reports[s.id]; });
        tiles.innerHTML = "";
        slot.innerHTML = "";
        var t;
        if (S.rcView === "progress") {
          var below = 0, missing = 0, down = 0;
          list.forEach(function (s) {
            var cs = reports[s.id].courses || [];
            if (cs.some(function (c) { return c.grade && c.grade.percent < CX_PASS; })) below++;
            if (cs.some(function (c) { return (c.marks || []).some(function (m) { return m.status === "missing"; }); })) missing++;
            if (cs.some(function (c) { return c.trend && c.trend.change < 0; })) down++;
          });
          [["Students", list.length, ""], ["Below a pass somewhere", below, below ? "late" : ""], ["Missing work", missing, missing ? "owe" : ""], ["Trending down somewhere", down, ""]]
            .forEach(function (x) { tiles.appendChild(el("div", "cn-tile" + (x[2] ? " " + x[2] : ""), "<b>" + x[1] + "</b><span>" + esc(x[0]) + "</span>")); });
          t = cnTable([{ label: "Student", w: "minmax(160px, 1fr)" }, { label: "Courses as they stand", w: "minmax(260px, 2.4fr)" }, { label: "Missing", w: "76px", align: "right" }]);
          list.forEach(function (s) {
            var cs = reports[s.id].courses || [];
            var miss = cs.reduce(function (a, c) { return a + (c.marks || []).filter(function (m) { return m.status === "missing"; }).length; }, 0);
            t.row([who(s), cs.map(function (c) {
              var low = c.grade && c.grade.percent < CX_PASS;
              return esc(c.title) + " " + (c.grade ? "<b class='cn-mk" + (low ? " bad" : "") + "'>" + esc(c.grade.letter) + "</b>" : "<span class='cn-none'>—</span>") +
                (c.trend && c.trend.change ? " <span class='cn-none'>" + (c.trend.change > 0 ? "▲" : "▼") + Math.abs(c.trend.change) + "</span>" : "");
            }).join(" · "), miss ? "<b class='cn-mk warn'>" + miss + "</b>" : "<span class='cn-none'>—</span>"], function () { openReport(s); }, s.id);
          });
        } else {
          var ready = list.filter(function (s) { return reports[s.id].state === "ready"; }).length, reasons = {};
          list.forEach(function (s) {
            (reports[s.id].courses || []).forEach(function (c) {
              ((c.readiness && c.readiness.reasons) || []).forEach(function (x) {
                var k = x.kind === "no-comment" ? "Comments to write" : x.kind === "unmarked" ? "Work to mark" : x.text;
                reasons[k] = (reasons[k] || 0) + 1;
              });
            });
          });
          [["Ready", ready, ready ? "done" : ""], ["Not ready", list.length - ready, list.length - ready ? "owe" : ""]].concat(Object.keys(reasons).map(function (k) { return [k, reasons[k], ""]; }))
            .forEach(function (x) { tiles.appendChild(el("div", "cn-tile" + (x[2] ? " " + x[2] : ""), "<b>" + x[1] + "</b><span>" + esc(x[0]) + "</span>")); });
          t = cnTable([{ label: "Student", w: "minmax(170px, 1.1fr)" }, { label: "State", w: "100px" }, { label: "What is holding it", w: "minmax(220px, 2.2fr)" }]);
          list.forEach(function (s) {
            var r = reports[s.id], rs = [];
            (r.courses || []).forEach(function (c) { ((c.readiness && c.readiness.reasons) || []).forEach(function (x) { rs.push(x.text); }); });
            t.row([who(s), r.state === "ready" ? "<span class='cx-pill green'>Ready</span>" : "<span class='cx-pill orange'>Not ready</span>",
                   rs.length ? esc(rs.slice(0, 3).join(" · ") + (rs.length > 3 ? " · +" + (rs.length - 3) + " more" : "")) : "<span class='cn-none'>—</span>"],
                  function () { openReport(s); }, s.id);
          });
        }
        slot.appendChild(t);
      }
      // Read the reports a few at a time, so a big school does not flood the server.
      var queue = students.slice(), running = 0;
      function next() {
        prog.textContent = done < students.length ? "Reading " + done + " of " + students.length + " reports…" : students.length + " reports read, as the school would send them now.";
        while (running < 6 && queue.length) {
          var s = queue.shift();
          running++;
          API.reporting.report(s.id).then(function (r) { reports[this.id] = r; }.bind(s), function () {}).then(function () {
            running--; done++;
            if (done % 6 === 0 || done === students.length) paint();
            next();
          });
        }
      }
      next();
    }, function (e) { failed(node, e, function () { openAdmin(true, "reportcards"); }); });
  }

  /* ============================================================== Analytics
     The school's grades in context. Departments side by side, how students do
     by kind of work, and every course with the numbers that explain its
     average — how many students, how spread out, how much is missing, how
     much is marked. It is evidence to read, not a ranking: courses start
     from different places with different students. */
  function tabAnalytics(v) {
    consoleHead(v, "Analytics", "Academic",
      "The school’s grades in context. Compare with care: courses start from different places, with different students.");
    var node = loading(v, "the school’s grades");
    loadSchool().then(function (d) {
      node.remove();
      var grid = el("div", "cx-grid");
      v.appendChild(grid);
      // Departments.
      var depts = {};
      d.courses.forEach(function (c) {
        var k = c.subject || "Other", x = depts[k] || (depts[k] = { sum: 0, n: 0, dist: { A: 0, B: 0, C: 0, D: 0, F: 0 } });
        x.sum += c.sum; x.n += c.graded;
        Object.keys(x.dist).forEach(function (L) { x.dist[L] += c.dist[L]; });
      });
      var dc = s360Card(grid, "cx-s6", "Average by department", "chart", "var(--cx-teal)");
      dc.appendChild(barChart(Object.keys(depts).sort().map(function (k) {
        var a = depts[k].n ? Math.round(depts[k].sum / depts[k].n) : 0;
        return { label: k.length > 11 ? k.slice(0, 10) + "…" : k, title: k, n: a, color: gradeTone(a) };
      }), { values: true }));
      // By kind of work.
      var cat = {};
      d.courses.forEach(function (c) {
        var gb = c.book || {}, a = {};
        (gb.assignments || []).forEach(function (x) { a[x.id] = x; });
        (gb.grades || []).forEach(function (g) {
          if (g.score == null || !g.outOf) return;
          var k = (a[g.assignmentId] && a[g.assignmentId].category) || g.category || "Other", x = cat[k] || (cat[k] = { s: 0, n: 0 });
          x.s += g.score / g.outOf; x.n++;
        });
      });
      var kc = s360Card(grid, "cx-s6", "How students do by kind of work", "checklist", "var(--cx-orange)");
      kc.appendChild(barChart(Object.keys(cat).sort().map(function (k) {
        var a = Math.round(cat[k].s / cat[k].n * 100);
        return { label: k, n: a, color: gradeTone(a), title: k + " (" + cat[k].n + " marks)" };
      }), { values: true }));
      kc.appendChild(el("p", "cx-note", "The mean score on every marked piece of work of each kind, across all courses."));
      // Courses in context.
      var cc = s360Card(grid, "cx-s12", "Courses in context", "books", "var(--cx-indigo)");
      var t = cnTable([{ label: "Course", w: "minmax(170px, 1.4fr)" }, { label: "Students", w: "76px", align: "right" }, { label: "Average", w: "76px", align: "right" },
                       { label: "Spread", w: "72px", align: "right" }, { label: "Passing", w: "76px", align: "right" }, { label: "Missing", w: "76px", align: "right" },
                       { label: "Marked", w: "72px", align: "right" }, { label: "Grades", w: "minmax(110px, 1fr)" }]);
      d.courses.slice().sort(function (a, b) { return String(a.subject + a.title).localeCompare(String(b.subject + b.title)); }).forEach(function (c) {
        var ps = [], sums = (c.book && c.book.summaries) || {};
        Object.keys(sums).forEach(function (k) { if (sums[k] && sums[k].percent != null) ps.push(sums[k].percent); });
        var mean = ps.length ? ps.reduce(function (a, b) { return a + b; }, 0) / ps.length : null;
        var sd = ps.length > 1 ? Math.round(Math.sqrt(ps.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (ps.length - 1))) : null;
        var pass = ps.length ? Math.round(ps.filter(function (p) { return p >= CX_PASS; }).length / ps.length * 100) : null;
        var missRate = c.dealt ? Math.round(c.missing / c.dealt * 100) : null;
        var bands = [["A", "var(--cx-green)"], ["B", "var(--cx-teal)"], ["C", "var(--cx-yellow)"], ["D", "var(--cx-orange)"], ["F", "var(--cx-red)"]]
          .map(function (x) { return c.dist[x[0]] ? '<i style="flex:' + c.dist[x[0]] + ";background:" + x[1] + '"></i>' : ""; }).join("");
        t.row(["<b>" + esc(c.title) + "</b><span class='cn-sub2'>" + esc((c.subject || "") + " · " + (c.teachers.map(function (q) { return q.name; }).join(", ") || "no teacher")) + "</span>",
               String(c.students), c.average == null ? "—" : "<b style='color:" + gradeTone(c.average) + "'>" + c.average + "%</b>", sd == null ? "—" : "±" + sd,
               pass == null ? "—" : pass + "%", missRate == null ? "—" : missRate + "%", c.cells ? Math.round(c.dealt / c.cells * 100) + "%" : "—",
               '<span class="cx-dist" style="display:flex">' + bands + "</span>"],
              function () { S.gbPath = { dept: c.subject || "Other", course: c.id }; openAdmin(false, "gradebook"); }, c.id);
      });
      cc.appendChild(t);
      cc.appendChild(el("p", "cx-note", "Spread is the standard deviation of students’ course grades. Missing is the share of recorded due work marked missing. " +
        "Growth over time needs a starting assessment for each course, which the record does not hold yet."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "analytics"); }); });
  }

  /* ============================================================ Data Center
     The school's data, out — as files it can open anywhere. Every export is
     built in this browser from what the server returned just now, so it is
     exactly what the console shows. */
  function csvCell(v) {
    v = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;          // never let a spreadsheet run a cell as a formula
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function csvDownload(name, rows) {
    var text = "﻿" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast("Downloaded " + name + " — " + (rows.length - 1) + (rows.length === 2 ? " row." : " rows."));
  }
  function tabData(v) {
    consoleHead(v, "Data Center", "Exports", "The school’s records, out as files it can open anywhere — built in this browser from what the server returned just now.");
    var node = loading(v, "the school’s records");
    loadSchool().then(function (d) {
      node.remove();
      var stamp = new Date().toISOString().slice(0, 10);
      function iso(ms) { return ms ? new Date(Number(ms)).toISOString().slice(0, 10) : ""; }
      var EX = [
        ["Students", "people", "var(--cx-cyan)", "Every enrolled student, their courses, standing and missing work.", function () {
          return [["Name", "Email", "Courses", "Standing %", "Missing", "Waiting to be marked"]].concat(d.students.map(function (s) {
            return [s.name, s.email, s.courses.map(function (c) { return c.title; }).join("; "), s.standing, s.missing, s.unmarked]; })); }],
        ["Course grades", "table", "var(--cx-green)", "One row per student per course: percent and letter.", function () {
          var rows = [["Student", "Email", "Course", "Subject", "Percent", "Letter", "Missing"]];
          d.students.forEach(function (s) { s.courses.forEach(function (c) { rows.push([s.name, s.email, c.title, c.subject, c.grade ? c.grade.percent : "", c.grade ? c.grade.letter : "", c.missing]); }); });
          return rows; }],
        ["Every mark", "pencil", "var(--cx-pink)", "Every mark on every piece of work, with its status and whether it was late.", function () {
          var rows = [["Student", "Email", "Course", "Work", "Category", "Due", "Score", "Out of", "Status", "Late"]];
          d.courses.forEach(function (c) {
            var gb = c.book || {}, a = {}, st = {};
            (gb.assignments || []).forEach(function (x) { a[x.id] = x; });
            (gb.students || []).forEach(function (x) { st[x.id] = x; });
            (gb.grades || []).forEach(function (g) {
              var w = a[g.assignmentId] || {}, s = st[g.accountId] || {};
              rows.push([s.name, s.email, c.title, w.title || g.title, w.category || g.category, iso(w.dueAt), g.score, g.outOf, g.status, g.late ? "yes" : ""]);
            });
          });
          return rows; }],
        ["Missing work", "tray", "var(--cx-orange)", "Every piece of due work marked missing.", function () {
          return [["Student", "Email", "Course", "Teacher", "Work", "Category", "Was due"]].concat(missingRows(d).map(function (r) {
            return [r.student.name, r.student.email, r.course.title, r.teacher, r.work, r.category, iso(r.due)]; })); }],
        ["Courses and rosters", "books", "var(--cx-indigo)", "Every course with its teachers, size, average and status.", function () {
          return [["Code", "Course", "Subject", "Status", "Teachers", "Students", "Average %", "Below a pass"]].concat(d.courses.map(function (c) {
            return [c.code, c.title, c.subject, c.status, c.teachers.map(function (t) { return t.name; }).join("; "), c.students, c.average, c.below]; })); }],
        ["Staff", "badge", "var(--cx-orange)", "Every teacher, what they teach and how their marking stands.", function () {
          return [["Teacher", "Email", "Courses", "Students", "Due work marked %", "To mark", "Last marked"]].concat(d.teachers.map(function (t) {
            return [t.name, t.email, t.courses.map(function (c) { return c.title; }).join("; "), t.students, t.cells ? Math.round(t.dealt / t.cells * 100) : "", t.toMark, iso(t.last)]; })); }],
        ["Audit log", "wave", "var(--cx-purple)", "Every change to a mark: before, after, who and when.", function () {
          return [["When", "Student", "Course", "Work", "From score", "From status", "To score", "To status", "Out of", "By", "Note"]].concat(d.events.map(function (e) {
            return [new Date(Number(e.at)).toISOString(), e.student && e.student.name, e.courseTitle, e.title, e.fromScore, e.fromStatus, e.toScore, e.toStatus, e.outOf, e.actorName, e.note]; })); }]
      ];
      var box = el("div", "cx-set");
      EX.forEach(function (x) {
        var r = el("div", "cx-setrow", '<span class="ic" style="--c:' + x[2] + '">' + cxIcon(x[1]) + '</span><span class="t"><b>' + esc(x[0]) + "</b><span>" + esc(x[3]) + "</span></span>");
        var b = el("button", "cn-btn small", "Download CSV");
        b.type = "button";
        b.addEventListener("click", function () { csvDownload(x[0].toLowerCase().replace(/\s+/g, "-") + "-" + stamp + ".csv", x[4]()); });
        var vv = el("span", "v");
        vv.appendChild(b);
        r.appendChild(vv);
        box.appendChild(r);
      });
      v.appendChild(box);
      if (d.capped) v.appendChild(el("p", "cx-note", "The audit log export holds each course’s latest " + HISTORY_LIMIT + " changes."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "data"); }); });
  }

  /* =============================================================== Security
     What protects the school's records, stated only where it is true: each
     line below is something the platform does today. What it does not do yet
     is listed as not done, not left out. */
  function tabSecurity(v) {
    consoleHead(v, null, "Security", "What protects the school’s records today — and what is not built yet.");
    function group(title, rows, ok) {
      v.appendChild(el("p", "cx-sethead", esc(title)));
      var box = el("div", "cx-set");
      rows.forEach(function (x) {
        box.appendChild(el("div", "cx-setrow", '<span class="ic" style="--c:' + (ok ? "var(--cx-green)" : "var(--cx-gray)") + '">' + cxIcon(ok ? "shield" : "alert") +
          '</span><span class="t"><b>' + esc(x[0]) + "</b><span>" + esc(x[1]) + '</span></span><span class="v">' + (ok ? '<span class="cx-pill green">On</span>' : '<span class="cx-pill">Not yet</span>') + "</span>"));
      });
      v.appendChild(box);
    }
    group("In place", [
      ["Passwords are hashed", "PBKDF2-SHA-256 with 100,000 iterations and a salt of their own. Nobody, including Oplo, can read one."],
      ["Sessions a script cannot steal", "The sign-in lives in an HttpOnly, SameSite cookie set by the server — no page script can read it. A session lasts 30 days."],
      ["Sign-in attempts are limited", "Repeated attempts on one account, or from one network, are refused for a while."],
      ["Permissions are decided by the server", "Every request is checked against the account’s roles and its relationship to the course or student. Hidden buttons are a courtesy, not the control."],
      ["Every mark change is kept", "Before, after, who and when — the Audit Log — and any mark change can be put back, which is itself logged."],
      ["Connections are encrypted", "The session cookie is marked Secure in production, so it is only ever sent over HTTPS."],
      ["Queries cannot be rewritten by what someone types", "Every database query binds its values as parameters; the only text spliced into a query is fixed column names and placeholders."],
      ["Text is escaped before it is drawn", "Names, titles and notes are escaped before they reach the page — and even a script that got in could not read the session."],
      ["Sign out everywhere", "Every place an account is signed in is listed below, and can be signed out at once."]
    ], true);
    group("Not built yet", [
      ["Two-step sign-in", "A second factor at sign-in, for staff first."],
      ["Alerts for unusual sign-ins", "An email when an account signs in from somewhere new."],
      ["Automatic sign-out", "A school-wide setting for how long a staff session may sit idle."],
      ["A content security policy", "A header telling browsers to refuse scripts from anywhere else — a second wall behind the escaping."],
      ["Backups with a stated schedule", "A published backup schedule, and a restore the school can ask for and has seen tested."],
      ["Undelete", "Bringing back a course or a piece of work that was deleted."],
      ["Offline access", "Marking without a connection, saved when it comes back."]
    ], false);
    accountDevices(v);
  }

  /* ======================================================== The whole school
     Every place in the school's console that is not a screen of its own
     above. Each one reads what the platform already keeps — the gradebooks,
     the diploma records, the family records, the accounts — and a place whose
     records the platform does not keep yet says so, and says what it would
     need, instead of drawing numbers it does not have. */

  function cxPage(v, eyebrow, title, sub) {
    var top = el("div", "cx-top");
    var head = consoleHead(top, eyebrow, title, sub);
    var tools = el("div", "cx-tools");
    top.appendChild(tools);
    v.appendChild(top);
    return { head: head, tools: tools };
  }

  /* Numbers set large and light, a word under each, a hairline between. */
  function cxMetrics(parent, items) {
    var row = el("div", "cx-metrics");
    items.forEach(function (x) {
      var m = el(x.go ? "button" : "div", "cx-metric");
      if (x.go) { m.type = "button"; m.addEventListener("click", x.go); }
      var has = x.value != null && x.value !== "";
      m.innerHTML = "<b" + (x.bad && has && x.value !== 0 ? ' style="color:var(--cx-red)"' : "") + ">" + (has ? x.value : "—") +
        (x.unit && has ? "<small>" + x.unit + "</small>" : "") + "</b><span>" + esc(x.label) + "</span>" +
        (x.note ? "<em>" + x.note + "</em>" : "") +
        (x.line != null ? '<div class="line"><i style="width:' + Math.max(0, Math.min(100, x.line)) + '%"></i></div>' : "");
      row.appendChild(m);
    });
    parent.appendChild(row);
    return row;
  }

  function cxSection(parent, cls, title, note, more) {
    var c = el("section", "cx-card " + (cls || "cx-s12"));
    var h = el("header", "cx-ch", "<h3>" + esc(title) + "</h3>" + (note ? "<small>" + esc(note) + "</small>" : ""));
    if (more) {
      var m = el("button", "more", esc(more.label) + " ›");
      m.type = "button";
      m.addEventListener("click", more.go);
      h.appendChild(m);
    }
    c.appendChild(h);
    parent.appendChild(c);
    return c;
  }

  function cxWho(p) {
    var who = el("span", "cn-who");
    who.appendChild(avatarFor(p));
    who.appendChild(el("span", "nm", esc(p.name || "")));
    return who;
  }
  function cxNone(t) { return "<span class='cn-none'>" + esc(t || "—") + "</span>"; }
  function cxPct(p, bad) { return p == null ? cxNone() : "<b class='cn-mk" + (bad ? " bad" : "") + "'>" + p + "%</b>"; }
  function cxPlural(n, one, many) { return n + " " + (n === 1 ? one : many || one + "s"); }
  function cxMean(list) { return list.length ? list.reduce(function (a, b) { return a + b; }, 0) / list.length : null; }

  /* Paper, for the reports a school still hands out: a clean page of its own,
     opened in a new window and sent to the printer. */
  var CX_PRINT_CSS = "body{font:12.5px -apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;color:#1d1d1f;margin:36px}" +
    "h1{font-size:21px;font-weight:600;letter-spacing:-.01em;margin:0 0 2px}h2{font-size:15px;font-weight:600;margin:18px 0 4px}" +
    ".sub{color:#6e6e73;margin:0 0 16px}table{width:100%;border-collapse:collapse;margin:6px 0 0}" +
    "th{text-align:left;font-weight:500;color:#6e6e73;font-size:11px;border-bottom:.5pt solid #bbb;padding:5px 10px 5px 0}" +
    "td{border-bottom:.5pt solid #e3e3e3;padding:6px 10px 6px 0;vertical-align:top}.r{text-align:right}.muted{color:#86868b}" +
    ".page{page-break-after:always}.page:last-child{page-break-after:auto}.foot{margin-top:14px;color:#86868b;font-size:11px}" +
    "@media screen{body{max-width:760px;margin:36px auto}.page{padding-bottom:28px;margin-bottom:28px;border-bottom:1px dashed #ddd}}";
  function cxPrint(title, body) {
    var html = "<!doctype html><html lang='en'><head><meta charset='utf-8'><title>" + esc(title) + "</title><style>" + CX_PRINT_CSS +
      "</style></head><body>" + body + "<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>";
    var url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    var w = window.open(url, "_blank");
    if (!w) toast("Allow pop-ups for this site to print.");
    setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
  }
  function printHead(title, sub) {
    return "<h1>" + esc(title) + "</h1><p class='sub'>" + esc([schoolName(), sub, new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })]
      .filter(Boolean).join(" · ")) + "</p>";
  }
  function printTable(cols, rows) {
    return "<table><thead><tr>" + cols.map(function (c) { return "<th" + (c.r ? " class='r'" : "") + ">" + esc(c.t) + "</th>"; }).join("") +
      "</tr></thead><tbody>" + rows.map(function (r) {
        return "<tr>" + r.map(function (x, k) { return "<td" + (cols[k].r ? " class='r'" : "") + ">" + (x == null || x === "" ? "<span class='muted'>—</span>" : esc(x)) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table>";
  }

  /* Two groups' scores, and whether the difference between them is bigger
     than chance would usually make: Welch's t-test, which does not assume the
     groups are the same size or equally spread. */
  function lnGamma(z) {
    var c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
             12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
    z -= 1;
    var x = c[0];
    for (var i = 1; i < 9; i++) x += c[i] / (z + i);
    var t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function betaCf(a, b, x) {
    var TINY = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < TINY) d = TINY;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
      c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
      c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
      d = 1 / d;
      var del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 3e-14) break;
    }
    return h;
  }
  function incBeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betaCf(a, b, x) / a : 1 - bt * betaCf(b, a, 1 - x) / b;
  }
  function welchTest(A, B) {
    var n1 = A.length, n2 = B.length;
    if (n1 < 2 || n2 < 2) return null;
    var m1 = cxMean(A), m2 = cxMean(B);
    var v1 = A.reduce(function (s, x) { return s + (x - m1) * (x - m1); }, 0) / (n1 - 1);
    var v2 = B.reduce(function (s, x) { return s + (x - m2) * (x - m2); }, 0) / (n2 - 1);
    var se2 = v1 / n1 + v2 / n2;
    if (!se2) return null;
    var t = (m1 - m2) / Math.sqrt(se2);
    var df = se2 * se2 / ((v1 / n1) * (v1 / n1) / (n1 - 1) + (v2 / n2) * (v2 / n2) / (n2 - 1));
    var pooled = Math.sqrt((v1 + v2) / 2);
    return { n1: n1, n2: n2, m1: m1, m2: m2, sd1: Math.sqrt(v1), sd2: Math.sqrt(v2), t: t, df: df,
             p: incBeta(df / (df + t * t), df / 2, 0.5), d: pooled ? (m1 - m2) / pooled : 0 };
  }

  /* Many reads, six at a time, so a big school never floods the server, and
     kept for five minutes so moving between screens does not read them again. */
  var CX_CACHE = {};
  function eachSlowly(list, fn, tick) {
    return new Promise(function (resolve) {
      var i = 0, running = 0, done = 0, out = {};
      if (!list.length) { resolve(out); return; }
      function next() {
        while (running < 6 && i < list.length) {
          (function (x) {
            running++; i++;
            Promise.resolve().then(function () { return fn(x); })
              .then(function (r) { out[x.id] = r; }, function () { out[x.id] = null; })
              .then(function () {
                running--; done++;
                if (tick) tick(done, list.length, out);
                if (done === list.length) resolve(out); else next();
              });
          })(list[i]);
        }
      }
      next();
    });
  }
  function cachedEach(key, list, fn, tick) {
    var c = CX_CACHE[key];
    if (c && Date.now() - c.at < 300000 && list.every(function (x) { return x.id in c.out; })) {
      if (tick) tick(list.length, list.length, c.out);
      return Promise.resolve(c.out);
    }
    return eachSlowly(list, fn, tick).then(function (out) { CX_CACHE[key] = { at: Date.now(), out: out }; return out; });
  }
  function readRecords(students, tick) {
    return cachedEach("grad", students, function (s) { return API.graduation.get(s.id); }, tick);
  }
  function readFamilies(students, tick) {
    return cachedEach("fam", students, function (s) {
      return Promise.all([
        API.family.guardians(s.id).catch(function () { return []; }),
        API.family.getContact(s.id).catch(function () { return null; }),
        API.family.records(s.id).catch(function () { return {}; })
      ]).then(function (r) { return { guardians: r[0] || [], contact: r[1], records: r[2] || {} }; });
    }, tick);
  }
  function readingNote(v, what) {
    var p = el("p", "cx-note cx-prog");
    v.appendChild(p);
    return function (done, n) {
      p.textContent = done < n ? "Reading " + done + " of " + n + " " + what + "…" : "";
      if (done >= n) p.remove();
    };
  }

  /* A place that is not set up: what it will hold, what it needs first, and
     what can be done today instead. Said once, plainly. */
  function soonPage(v, eyebrow, title, sub, will, needs, today) {
    consoleHead(v, eyebrow, title, sub);
    var box = el("div", "cx-soon");
    box.innerHTML = "<h3>Not set up yet</h3><p>" + esc(needs) + "</p><ul>" +
      will.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>";
    v.appendChild(box);
    if (today && today.length) {
      var acts = cnActions();
      acts.style.marginTop = "24px";
      today.forEach(function (t) { acts.appendChild(cnAction(t[0], t[1])); });
      v.appendChild(acts);
    }
  }


  /* ========================================================= Work on OEdu
     When a school puts a student in a course here, the work is usually a
     lesson or an activity on OEdu: Unit 2, Lesson 3; the unit test; a study
     set. An assignment can say which (`activity`), the student is sent
     straight to it, and when it is done it is handed in — with what OEdu
     measured — and waits in To Grade for the teacher's mark. */
  var ACT_KIND = { lesson: "Lesson", test: "Unit test", unit: "Whole unit", set: "Study set", offline: "Done elsewhere" };

  // The shipped curriculum a database course carries, matched by its code.
  function curriculumOf(row) {
    if (!row) return null;
    var hit = allCourses().filter(function (c) { return c.id === row.code; })[0];
    return hit || fromDbCourse(row);
  }
  function activityCourse(act) {
    return act && act.course ? allCourses().filter(function (c) { return c.id === act.course; })[0] || null : null;
  }
  function activityName(act) {
    if (!act) return "";
    if (act.kind === "set") { var st = SET(act.set); return (st && st.t) || act.title || "Study set"; }
    var bits = ["Unit " + act.unit];
    if (act.kind === "lesson") bits.push("Lesson " + act.lesson);
    if (act.kind === "test") bits.push("Unit test");
    return bits.join(" · ") + (act.title ? ": " + act.title : "");
  }
  function onOedu(act) { return !!(act && act.kind && act.kind !== "offline"); }
  // The same, without the title — for a row whose title already says it.
  function activityShort(act) {
    if (!act) return "";
    if (act.kind === "set") return "Study set";
    return "Unit " + act.unit + (act.kind === "lesson" ? ", lesson " + act.lesson : act.kind === "test" ? " test" : "");
  }

  /* What a teacher can point a piece of work at, for one unit of one course.
     Lab units list their lessons once the unit's file has loaded. */
  function unitChoices(c, u) {
    var out = [];
    function done() {
      if (u.lab || u.play || u.read || u.set) out.push({ act: { kind: "unit", course: c.id, unit: u.n, title: u.t }, label: "The whole unit — " + u.t });
      if (u.set) out.push({ act: { kind: "set", set: u.set, title: (SET(u.set) || {}).t }, label: "Study set — " + ((SET(u.set) || {}).t || u.set) });
      out.push({ act: { kind: "offline", course: c.id, unit: u.n, title: u.t }, label: "Something done elsewhere, about this unit" });
      return out;
    }
    if (!u.lab || !window.OPLO_LAB) return Promise.resolve(done());
    return window.OPLO_LAB.load(c.id, u.n).then(function (def) {
      (def.lessons || []).forEach(function (l) {
        out.push({ act: { kind: "lesson", course: c.id, unit: u.n, lesson: l.k, title: l.title }, label: "Lesson " + l.k + " — " + l.title + (l.mins ? " · " + l.mins + " min" : "") });
      });
      out.push({ act: { kind: "test", course: c.id, unit: u.n, title: u.t }, label: "Unit test — " + u.t });
      return done();
    }, function () { return done(); });
  }

  /* --------------------------------------------------------- To Grade
     Everything that can be marked now: work handed in on OEdu and waiting
     for a mark, and work whose due date has passed with nothing recorded.
     Then, for what is coming, how many have still to hand it in. */
  function endOfToday() { var d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); }
  function gradeQueue(d) {
    var now = Date.now(), items = [], later = [];
    d.courses.forEach(function (c) {
      var gb = c.book || {}, roster = gb.students || [];
      var marks = {}, subs = {};
      (gb.grades || []).forEach(function (g) { marks[g.assignmentId + ":" + g.accountId] = g; });
      (gb.submissions || []).forEach(function (s) { subs[s.assignmentId + ":" + s.accountId] = s; });
      (gb.assignments || []).forEach(function (a) {
        var handed = 0, waiting = 0, notIn = 0, done = 0;
        roster.forEach(function (s) {
          var g = marks[a.id + ":" + s.id], sub = subs[a.id + ":" + s.id];
          var scored = g && (g.score != null || g.status === "excused");
          var recorded = scored || (g && g.status === "missing");
          if (sub && !scored) handed++;
          else if (!recorded && a.dueAt && a.dueAt <= now) waiting++;
          else if (!recorded && !sub) notIn++;
          else done++;
        });
        var row = { course: c, a: a, handed: handed, waiting: waiting, notIn: notIn, done: done, total: roster.length, n: handed + waiting };
        if (row.n) items.push(row);
        else if (a.dueAt && a.dueAt > now && notIn) later.push(row);
      });
    });
    items.sort(function (x, y) { return (y.handed ? 1 : 0) - (x.handed ? 1 : 0) || (x.a.dueAt || 0) - (y.a.dueAt || 0); });
    later.sort(function (x, y) { return x.a.dueAt - y.a.dueAt; });
    return { now: items, later: later };
  }

  function tabToGrade(v) {
    var top = el("div", "cx-top");
    consoleHead(top, "Teach", "To Grade", "Work handed in on OEdu and waiting for your mark, and work past its due date with nothing recorded.");
    v.appendChild(top);
    var node = loading(v, "your courses");
    loadSchool(true).then(function (d) {
      node.remove();
      var q = gradeQueue(d);
      railCount("tograde", q.now.length);
      var sub = top.querySelector(".cn-sub");
      if (sub) sub.innerHTML = q.now.length ? cxPlural(q.now.length, "item") + " to grade across " + cxPlural(d.courses.length, "course") : "You’re all caught up.";
      if (q.now.length) {
        var tools = el("div", "cx-tools");
        tools.appendChild(cnAction("Start grading", function () { openGrading(q.now[0].course, q.now[0].a); }, true));
        top.appendChild(tools);
      }
      function list(title, rows, isLater) {
        if (!rows.length) return;
        v.appendChild(el("p", "tq-head", esc(title)));
        var box = el("div", "tq-list");
        rows.forEach(function (r) {
          var b = el("button", "tq-row");
          b.type = "button";
          var what = isLater
            ? r.notIn + " of " + r.total + " still to hand in"
            : [r.handed ? r.handed + " handed in on OEdu" : "", r.waiting ? r.waiting + " past due, nothing recorded" : ""].filter(Boolean).join(" · ");
          b.innerHTML = '<span class="ic">' + cxIcon(onOedu(r.a.activity) ? "play" : "pencil") + '</span>' +
            '<span class="t"><b>' + esc(r.a.title) + "</b><span>" + esc(r.course.title + " · " + (r.a.dueAt ? (r.a.dueAt > Date.now() ? "due " : "was due ") + dayName(r.a.dueAt) : "no due date")) +
            " · " + esc(what) + '</span></span><span class="n">' + (isLater ? r.notIn : r.n) + '</span><span class="go">' + cxIcon("chev") + "</span>";
          b.addEventListener("click", function () {
            if (isLater) { S.courseId = r.course.id; openAdmin(false, "roster"); }
            else openGrading(r.course, r.a);
          });
          box.appendChild(b);
        });
        v.appendChild(box);
      }
      if (!q.now.length) v.appendChild(cnEmpty("Nothing to grade.", "When students hand in work set on OEdu, or work passes its due date, it waits here."));
      var eod = endOfToday();
      list("Today", q.now.filter(function (r) { return r.handed || !r.a.dueAt || r.a.dueAt <= eod; }));
      list("Later", q.later, true);
    }, function (e) { failed(node, e, function () { openAdmin(true, "tograde"); }); });
  }

  /* --------------------------------------------------------- Grading
     One piece of work, one student at a time: what they handed in on OEdu,
     the mark, a comment, and on to the next. The OEdu result is shown, and
     can be taken as the mark with one press — it is never taken silently. */
  function openGrading(course, a, startId) {
    enter("grading:" + a.id, trim(a.title, 18), function () { openGrading(course, a); });
    var v = $("#v-admin");
    v.innerHTML = "";
    var body = el("div", "admin-body");
    v.appendChild(body);
    consoleHead(body, (course.title || "") + (onOedu(a.activity) ? " · On OEdu" : ""), a.title,
      "Out of " + cxNum(a.outOf) + (a.dueAt ? " · due " + esc(dayName(a.dueAt)) : "") + (a.category ? " · " + esc(a.category) : ""));
    var node = loading(body, "the work");
    show("admin");
    API.grades.book(course.id).then(function (book) {
      node.remove();
      var work = (book.assignments || []).filter(function (x) { return x.id === a.id; })[0] || a;
      var marks = {}, subs = {};
      (book.grades || []).forEach(function (g) { if (g.assignmentId === a.id) marks[g.accountId] = g; });
      (book.submissions || []).forEach(function (s) { if (s.assignmentId === a.id) subs[s.accountId] = s; });
      var roster = (book.students || []).slice();
      function state(s) {
        var g = marks[s.id], sub = subs[s.id];
        if (g && g.status === "excused") return "excused";
        if (g && g.score != null) return "marked";
        if (sub) return "handed";
        if (g && g.status === "missing") return "missing";
        return work.dueAt && work.dueAt <= Date.now() ? "late" : "open";
      }
      var ORDER = { handed: 0, late: 1, missing: 2, open: 3, marked: 4, excused: 5 };
      roster.sort(function (x, y) { return ORDER[state(x)] - ORDER[state(y)] || String(x.name).localeCompare(String(y.name)); });
      var at = Math.max(0, roster.findIndex(function (s) { return startId ? s.id === startId : true; }));

      var split = el("div", "gq");
      var left = el("div", "gq-list");
      var right = el("div", "gq-card");
      split.appendChild(left);
      split.appendChild(right);
      body.appendChild(split);
      var SAY = { handed: "Handed in", late: "Past due", missing: "Not handed in", open: "Not yet", marked: "Marked", excused: "Excused" };

      function drawList() {
        left.innerHTML = "";
        var counts = {};
        roster.forEach(function (s) { var k = state(s); counts[k] = (counts[k] || 0) + 1; });
        left.appendChild(el("p", "gq-sum", (counts.handed || 0) + " handed in · " + (counts.marked || 0) + " marked · " + roster.length + " students"));
        roster.forEach(function (s, i) {
          var st = state(s), g = marks[s.id];
          var b = el("button", "gq-li" + (i === at ? " on" : ""));
          b.type = "button";
          b.innerHTML = avatarHtml(s) + '<span class="t"><b>' + esc(s.name) + "</b><span class='st " + st + "'>" + esc(SAY[st]) + "</span></span>" +
            '<span class="m">' + (g && g.score != null ? cxNum(g.score) : g && g.status === "missing" ? "M" : g && g.status === "excused" ? "Ex" : "") + "</span>";
          b.addEventListener("click", function () { at = i; draw(); });
          left.appendChild(b);
        });
      }
      function draw() {
        drawList();
        right.innerHTML = "";
        var s = roster[at];
        if (!s) { right.appendChild(cnEmpty("Nobody is enrolled.", "Enrol students and their work appears here.")); return; }
        var g = marks[s.id], sub = subs[s.id], st = state(s);
        var head = el("div", "gq-who");
        head.innerHTML = avatarHtml(s) + "<span><b>" + esc(s.name) + "</b><span>" + esc(SAY[st]) +
          (sub ? " · " + esc(whenName(sub.submittedAt)) : "") + "</span></span>";
        right.appendChild(head);

        var ev = el("div", "gq-ev");
        if (onOedu(work.activity)) {
          var res = sub && sub.result;
          ev.innerHTML = "<p class='k'>On OEdu · " + esc(activityName(work.activity)) + "</p>" + (res
            ? "<b>" + (res.pct != null ? res.pct + "%" : res.score != null ? cxNum(res.score) + (res.outOf ? " / " + cxNum(res.outOf) : "") : "Done") + "</b>" +
              "<span>" + esc(res.detail || "Finished on OEdu.") + "</span>"
            : "<b>Not handed in yet</b><span>" + esc(s.firstName || s.name) + " hasn’t finished it on OEdu.</span>");
        } else {
          ev.innerHTML = "<p class='k'>Done elsewhere</p><span>This work isn’t on OEdu, so there is nothing handed in here. Mark it from what you collected.</span>";
        }
        right.appendChild(ev);

        var form = el("div", "gq-form");
        var score = field("Mark out of " + cxNum(work.outOf), g && g.score != null ? String(g.score) : "", "Score");
        score.input.inputMode = "decimal";
        var fb = areaField("Comment for " + (s.firstName || s.name), g && g.feedback ? g.feedback : "", "Optional — they see this with the mark", 3);
        form.appendChild(score);
        form.appendChild(fb);
        right.appendChild(form);

        var acts = cnActions();
        var res2 = sub && sub.result;
        var suggest = res2 ? (res2.pct != null ? Math.round(res2.pct / 100 * work.outOf * 10) / 10
          : res2.score != null && res2.outOf ? Math.round(res2.score / res2.outOf * work.outOf * 10) / 10 : null) : null;
        if (suggest != null) {
          acts.appendChild(cnAction("Use OEdu’s " + cxNum(suggest), function () { score.input.value = String(suggest); score.input.focus(); }));
        }
        function save(patch, next) {
          patch.feedback = fb.input.value.trim() || null;
          return API.grades.put(work.id, s.id, patch).then(function (r) {
            marks[s.id] = r.grade;
            if (BOOK && BOOK.course && BOOK.course.id === course.id) BOOK = null;
            SCHOOL = null;
            teachCounts();
            if (next) { at = Math.min(roster.length - 1, at + 1); }
            draw();
          }, function (e) { toast(e && e.message ? e.message : "The server refused that."); });
        }
        var go = cnAction("Save and next", function () {
          var t = score.input.value.trim();
          if (!t) { toast("Type a mark, or choose Not handed in or Excused."); return; }
          var n = Number(t);
          if (!isFinite(n) || n < 0) { toast("A mark is a number."); return; }
          save({ status: "marked", score: n }, true);
        }, true);
        acts.appendChild(go);
        acts.appendChild(cnAction("Not handed in", function () { save({ status: "missing", score: null }, true); }));
        acts.appendChild(cnAction("Excused", function () { save({ status: "excused", score: null }, true); }));
        right.appendChild(acts);
        var nav = el("div", "gq-nav");
        var prev = cnAction("‹ Previous", function () { at = Math.max(0, at - 1); draw(); });
        var nxt = cnAction("Next ›", function () { at = Math.min(roster.length - 1, at + 1); draw(); });
        nav.appendChild(prev);
        nav.appendChild(el("span", null, (at + 1) + " of " + roster.length));
        nav.appendChild(nxt);
        right.appendChild(nav);
        score.input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go.click(); } });
        score.input.focus();
        score.input.select();
      }
      draw();
    }, function (e) { failed(node, e, function () { openGrading(course, a); }); });
  }

  /* ---------------------------------------------------- Setting work
     One sheet for new work and for changing it: which course, whether it is
     done on OEdu (and which lesson or activity) or elsewhere, what it counts
     as, what it is out of and when it is due. Assign sets it; Save as draft
     keeps it from students until it is. */
  function openAssignSheet(o) {
    o = o || {};
    var a = o.assignment || null;
    var box = el("div", "as-sheet");
    box.appendChild(el("h2", "as-h", a ? "Change work" : "New assignment"));
    var form = el("div", "admin-form as-form");
    box.appendChild(form);
    var slot = el("div");
    form.appendChild(slot);
    slot.appendChild(el("p", "cx-note", "Loading your courses…"));
    var sheet = cxSheet(box);

    teachCourses().then(function (cs) {
      slot.innerHTML = "";
      if (!cs.length) { slot.appendChild(el("p", "cx-note", "You aren’t teaching a course yet.")); return; }
      var courseId = (a && a.courseId) || o.courseId || (currentCourse(cs) || cs[0]).id;
      var act = a ? a.activity : (o.act || null);
      var where = act && act.kind === "offline" ? "else" : act ? "oedu" : (o.where || "oedu");

      var cF = el("label", "admin-field");
      cF.innerHTML = "<span>Course</span>";
      var cSel = el("select");
      cs.forEach(function (c) { var op = el("option"); op.value = c.id; op.textContent = c.title; if (c.id === courseId) op.selected = true; cSel.appendChild(op); });
      cSel.disabled = !!a;              // work belongs to its course
      cF.appendChild(cSel);
      slot.appendChild(cF);

      var whereF = el("div", "admin-field");
      whereF.innerHTML = "<span>Students do it</span>";
      var seg = el("div", "cn-seg");
      [["oedu", "On OEdu"], ["else", "Somewhere else"]].forEach(function (x) {
        var b = el("button", "cn-segb" + (where === x[0] ? " on" : ""), x[1]);
        b.type = "button";
        b.addEventListener("click", function () {
          where = x[0];
          [].forEach.call(seg.children, function (y) { y.classList.toggle("on", y === b); });
          fillWhat();
        });
        seg.appendChild(b);
      });
      whereF.appendChild(seg);
      slot.appendChild(whereF);

      var uF = el("label", "admin-field");
      uF.innerHTML = "<span>Unit</span>";
      var uSel = el("select");
      uF.appendChild(uSel);
      slot.appendChild(uF);
      var wF = el("label", "admin-field");
      wF.innerHTML = "<span>Lesson or activity</span>";
      var wSel = el("select");
      wF.appendChild(wSel);
      slot.appendChild(wF);

      var title = field("Title", a ? a.title : "", "Unit 2 quiz");
      slot.appendChild(title);
      var catF = el("label", "admin-field");
      catF.innerHTML = "<span>Counts as</span>";
      var cat = el("select");
      catF.appendChild(cat);
      slot.appendChild(catF);
      var outOf = field("Out of", a ? String(a.outOf) : "10");
      slot.appendChild(outOf);
      var due = field("Due", "", "optional");
      due.input.type = "date";
      if (a && a.dueAt) {
        var dd = new Date(Number(a.dueAt));
        due.input.value = dd.getFullYear() + "-" + ("0" + (dd.getMonth() + 1)).slice(-2) + "-" + ("0" + dd.getDate()).slice(-2);
      }
      slot.appendChild(due);
      var xcF = el("label", "admin-field");
      xcF.innerHTML = "<span>Extra credit</span>";
      var xc = el("select");
      [["", "No — counts towards the grade"], ["1", "Yes — can only raise a grade"]].forEach(function (x) {
        var n = el("option"); n.value = x[0]; n.textContent = x[1]; if (a && !!x[0] === !!a.extraCredit) n.selected = true; xc.appendChild(n);
      });
      xcF.appendChild(xc);
      slot.appendChild(xcF);
      var note = el("p", "cn-fine as-note");
      slot.appendChild(note);

      var choices = [], titled = !!(a && a.title);
      title.input.addEventListener("input", function () { titled = !!title.input.value.trim(); });
      function row() { return cs.filter(function (c) { return c.id === cSel.value; })[0]; }
      function fillCats() {
        var weights = (row().body && row().body.grading) || [["Work", 100]];
        cat.innerHTML = "";
        weights.forEach(function (w) {
          var op = el("option"); op.value = w[0]; op.textContent = w[0] + " (" + w[1] + "% of the grade)";
          if (a && a.category === w[0]) op.selected = true;
          cat.appendChild(op);
        });
      }
      function fillUnits() {
        var cur = curriculumOf(row());
        var units = cur ? unitsOf(cur) : [];
        uSel.innerHTML = "";
        if (where === "else") { var none = el("option"); none.value = ""; none.textContent = "Not about one unit"; uSel.appendChild(none); }
        units.forEach(function (u) {
          var op = el("option"); op.value = String(u.n); op.textContent = "Unit " + u.n + " — " + u.t;
          if (act && act.unit === u.n) op.selected = true;
          uSel.appendChild(op);
        });
        uF.hidden = !units.length;
        return cur;
      }
      function fillWhat() {
        var cur = fillUnits();
        wF.hidden = where !== "oedu";
        wSel.innerHTML = "";
        note.textContent = where === "oedu"
          ? "Students open it from their School page. When they finish it on OEdu it is handed in, and waits in To Grade for your mark."
          : "Students see it on their School page. You mark it from what you collect.";
        if (where !== "oedu") { choices = []; return; }
        var u = cur && unitsOf(cur).filter(function (x) { return String(x.n) === uSel.value; })[0];
        if (!u) { var op0 = el("option"); op0.textContent = "This course has no OEdu lessons"; wSel.appendChild(op0); choices = []; return; }
        var wait = el("option"); wait.textContent = "Loading…"; wSel.appendChild(wait);
        unitChoices(cur, u).then(function (list) {
          choices = list.filter(function (x) { return x.act.kind !== "offline"; });
          wSel.innerHTML = "";
          choices.forEach(function (x, i) {
            var op = el("option"); op.value = String(i); op.textContent = x.label;
            if (act && act.kind === x.act.kind && act.lesson === x.act.lesson && act.unit === x.act.unit && act.set === x.act.set) op.selected = true;
            wSel.appendChild(op);
          });
          suggest();
        });
      }
      function picked() {
        if (where === "oedu") { var x = choices[Number(wSel.value)]; return x ? x.act : null; }
        var cur = curriculumOf(row()), n = Number(uSel.value);
        if (!n || !cur) return null;
        var u = unitsOf(cur).filter(function (y) { return y.n === n; })[0];
        return { kind: "offline", course: cur.id, unit: n, title: u ? u.t : undefined };
      }
      function suggest() {
        var p = picked();
        if (!p || titled) return;
        title.input.value = p.kind === "set" ? (p.title || "Study set") : p.kind === "lesson" ? "Lesson " + p.lesson + ": " + (p.title || "") :
          p.kind === "test" ? "Unit " + p.unit + " test" : p.kind === "unit" ? "Unit " + p.unit + ": " + (p.title || "") : title.input.value;
        if (!a) outOf.input.value = p.kind === "test" ? "100" : "10";
        var want = p.kind === "test" ? /test|assess|exam/i : p.kind === "lesson" || p.kind === "set" ? /home|class|practice|work/i : null;
        if (want && !a) [].some.call(cat.options, function (op) { if (want.test(op.value)) { op.selected = true; return true; } return false; });
      }
      cSel.addEventListener("change", function () { act = null; fillCats(); fillWhat(); });
      uSel.addEventListener("change", function () { act = null; fillWhat(); });
      wSel.addEventListener("change", function () { if (!a) titled = false; suggest(); });
      fillCats();
      fillWhat();

      var acts = el("div", "admin-acts");
      function send(status) {
        var t = title.input.value.trim();
        if (!t) { toast("Give it a title."); return; }
        var n = Number(outOf.input.value);
        if (!isFinite(n) || n <= 0) { toast("What is it out of?"); return; }
        var dueAt = null;
        if (due.input.value) { var d2 = new Date(due.input.value + "T23:59:59"); if (isFinite(d2.getTime())) dueAt = d2.getTime(); }
        var data = { title: t, category: cat.value, outOf: n, dueAt: dueAt, extraCredit: !!xc.value, activity: picked() };
        if (status) data.status = status;
        var p = a ? API.courses.updateAssignment(a.id, data) : API.courses.addAssignment(cSel.value, data);
        attempt(p, function () {
          toast(status === "draft" ? "Saved as a draft." : a ? "Saved." : "Assigned.");
          SCHOOL = null; BOOK = null;
          sheet.close();
          teachCounts();
          if (o.done) o.done(); else openAdmin(true, S.tab);
        });
      }
      var go = el("button", "lx-btn lg", a && a.status !== "draft" ? "Save" : "Assign");
      go.type = "button";
      go.addEventListener("click", function () { send(a && a.status !== "draft" ? null : "open"); });
      acts.appendChild(go);
      if (!a || a.status === "draft") {
        var draft = el("button", "lx-btn quiet", "Save as draft");
        draft.type = "button";
        draft.addEventListener("click", function () { send("draft"); });
        acts.appendChild(draft);
      }
      if (a) {
        var rm = el("button", "lx-btn quiet danger", "Delete");
        rm.type = "button";
        rm.addEventListener("click", function () {
          if (!confirm("Delete “" + a.title + "” and every mark on it?")) return;
          attempt(API.courses.removeAssignment(a.id), function () { SCHOOL = null; BOOK = null; sheet.close(); teachCounts(); openAdmin(true, S.tab); });
        });
        acts.appendChild(rm);
      }
      box.appendChild(acts);
    }, function (e) { slot.innerHTML = ""; slot.appendChild(el("p", "cx-note", esc((e && e.message) || "Couldn’t load your courses."))); });
  }

  /* ======================================================= Teacher places */

  /* The course a page is about, as a pop-up button at its head. */
  function coursePill(host, courses, after) {
    var cur = currentCourse(courses);
    var b = el("button", "tr-coursepill");
    b.type = "button";
    b.setAttribute("aria-haspopup", "dialog");
    b.innerHTML = "<b>" + esc(cur ? cur.title : "No course") + "</b>" + cxIcon("down");
    b.addEventListener("click", function () { courseSwitcher(b); });
    host.appendChild(b);
    if (after) after(cur);
    return cur;
  }

  /* A place's own views, as a segmented control under its title. */
  function subNav(host, list, cur, pick) {
    var seg = el("div", "cn-seg tr-subnav");
    seg.setAttribute("role", "tablist");
    list.forEach(function (x) {
      var b = el("button", "cn-segb" + (x[0] === cur ? " on" : ""), esc(x[1]));
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(x[0] === cur));
      b.addEventListener("click", function () { pick(x[0]); });
      seg.appendChild(b);
    });
    host.appendChild(seg);
    return seg;
  }

  /* The school's books for the course a teacher is on. */
  function courseBook(d, id) { return d.courses.filter(function (c) { return c.id === id; })[0] || null; }

  /* ----------------------------------------------------------- Gradebook
     Overview · Grades · Standards · Missing · Grade History, for the course
     at its head. Grades is the sheet itself. */
  var GB_VIEWS = [["overview", "Overview"], ["grades", "Grades"], ["standards", "Standards"], ["missing", "Missing"], ["history", "Grade History"]];
  function tabTeachGradebook(v) {
    var head = el("div", "tr-pagehead");
    v.appendChild(head);
    var node = loading(v, "your courses");
    teachCourses().then(function (cs) {
      node.remove();
      if (!cs.length) {
        v.appendChild(cnEmpty("You aren’t teaching any courses yet.",
          "An administrator enrols you as a teacher on a course, and it appears here with its students."));
        return;
      }
      var cur = coursePill(head, cs);
      consoleHead(head, null, "Gradebook");
      S.gbView = S.gbView || "grades";
      subNav(head, GB_VIEWS, S.gbView, function (k) { S.gbView = k; openAdmin(true, "roster"); });
      var host = el("div", "gb-host");
      v.appendChild(host);
      if (S.gbView === "grades") {
        host.appendChild(el("p", "cn-sub gb-hint", "Students down, work across. Type a score, <b>m</b> for not handed in, <b>e</b> for excused."));
        var sheet = el("div");
        host.appendChild(sheet);
        loadBook(sheet, cur.id);
        return;
      }
      var n2 = loading(host, "the course");
      loadSchool().then(function (d) {
        n2.remove();
        var c = courseBook(d, cur.id);
        if (!c) { host.appendChild(cnEmpty("This course has no gradebook yet.", "")); return; }
        ({ overview: gbOverview, standards: gbStandards, missing: gbMissing, history: gbHistory })[S.gbView](host, c, d);
      }, function (e) { failed(n2, e, function () { openAdmin(true, "roster"); }); });
    }, function (e) { failed(node, e, function () { openAdmin(true, "roster"); }); });
  }

  function gbOverview(host, c, d) {
    var q = gradeQueue({ courses: [c] });
    var studs = d.students.filter(function (s) { return s.courses.some(function (x) { return x.courseId === c.id; }); });
    var below = studs.filter(function (s) { var x = s.courses.filter(function (y) { return y.courseId === c.id; })[0]; return x.grade && x.grade.percent < CX_PASS; });
    cxMetrics(host, [
      { label: "Course average", value: c.average, unit: "%", line: c.average },
      { label: "Students", value: c.students, note: below.length ? below.length + " below " + CX_PASS + "%" : "Everyone is passing" },
      { label: "To grade", value: q.now.length, note: q.now.length ? "pieces of work" : "All caught up", go: function () { openAdmin(false, "tograde"); } },
      { label: "Missing", value: c.missing, bad: true, note: "marked not handed in", go: function () { S.gbView = "missing"; openAdmin(true, "roster"); } }
    ]);
    var grid = el("div", "cx-grid");
    host.appendChild(grid);
    var dist = cxSection(grid, "cx-s6", "Grade distribution", cxPlural(c.graded, "student") + " with a grade");
    dist.appendChild(barChart(["A", "B", "C", "D", "F"].map(function (k) { return { label: k, n: c.dist[k], color: k === "F" ? "var(--cx-red)" : "var(--cx-bar)" }; }), { values: true }));
    var work = (c.book.assignments || []);
    var avgBy = assignmentAverages(c);
    var wk = cxSection(grid, "cx-s6", "How each piece went", "Average mark, in the order it was set");
    wk.appendChild(barChart(work.filter(function (a) { return avgBy[a.id] != null; }).slice(-10).map(function (a) {
      return { label: trim(a.title, 9), title: a.title, n: avgBy[a.id], color: avgBy[a.id] < CX_PASS ? "var(--cx-red)" : "var(--cx-bar)" };
    }), { values: true }));
    var na = cxSection(grid, "cx-s12", "Needs a look", "Below " + CX_PASS + "%, or missing two or more pieces");
    var t = cnTable([{ label: "Student", w: "minmax(180px, 1.4fr)" }, { label: "Grade", w: "90px", align: "right" }, { label: "Missing", w: "90px", align: "right" }, { label: "", w: "110px", align: "right" }]);
    var risk = studs.map(function (s) { return { s: s, x: s.courses.filter(function (y) { return y.courseId === c.id; })[0] }; })
      .filter(function (r) { return (r.x.grade && r.x.grade.percent < CX_PASS) || r.x.missing >= 2; })
      .sort(function (p, q2) { return (p.x.grade ? p.x.grade.percent : 999) - (q2.x.grade ? q2.x.grade.percent : 999); });
    risk.forEach(function (r) {
      t.row([cxWho(r.s), cxPct(r.x.grade ? r.x.grade.percent : null, r.x.grade && r.x.grade.percent < CX_PASS), String(r.x.missing || 0), "<span class='cn-none'>Open ›</span>"],
        function () { openStudentSheet(r.s); }, r.s.id);
    });
    if (!risk.length) na.appendChild(el("p", "cx-note", "Nobody in this course is below a pass or missing more than one piece."));
    else na.appendChild(t);
  }

  function assignmentAverages(c) {
    var sum = {}, n = {};
    (c.book.grades || []).forEach(function (g) {
      if (g.score == null || !g.outOf) return;
      sum[g.assignmentId] = (sum[g.assignmentId] || 0) + g.score / g.outOf; n[g.assignmentId] = (n[g.assignmentId] || 0) + 1;
    });
    var out = {};
    Object.keys(sum).forEach(function (k) { out[k] = Math.round(sum[k] / n[k] * 100); });
    return out;
  }

  /* Standards, as OEdu has them: the course's units. Work set on OEdu — and
     work done elsewhere that the teacher said was about a unit — carries its
     unit, so the marks on it add up to how the course is doing on that unit.
     Only marks count: what students practise on their own is theirs. */
  function unitStanding(c) {
    var byA = {};
    (c.book.assignments || []).forEach(function (a) { if (a.activity && a.activity.unit) byA[a.id] = a; });
    var U = {};
    (c.book.grades || []).forEach(function (g) {
      var a = byA[g.assignmentId];
      if (!a || g.score == null || !g.outOf) return;
      var u = U[a.activity.unit] || (U[a.activity.unit] = { s: 0, n: 0, work: {}, low: {} });
      u.s += g.score / g.outOf; u.n++; u.work[a.id] = 1;
      if (g.score / g.outOf < CX_PASS / 100) u.low[g.accountId] = 1;
    });
    var tagged = {};
    Object.keys(byA).forEach(function (id) { var a = byA[id]; (tagged[a.activity.unit] = tagged[a.activity.unit] || []).push(a); });
    return { units: U, tagged: tagged, untagged: (c.book.assignments || []).length - Object.keys(byA).length };
  }

  function gbStandards(host, c) {
    var cur = curriculumOf(c.raw), units = cur ? unitsOf(cur) : [];
    var st = unitStanding(c);
    host.appendChild(el("p", "cn-sub", "Each unit of " + esc(c.title) + ", from the marks on work tied to it. Work set on OEdu is tied to its unit; for other work, pick the unit when you set it."));
    var t = cnTable([{ label: "Unit", w: "minmax(220px, 2fr)" }, { label: "Average", w: "100px", align: "right" }, { label: "Marks", w: "80px", align: "right" },
                     { label: "Below " + CX_PASS + "%", w: "110px", align: "right" }, { label: "", w: "140px", align: "right" }]);
    units.forEach(function (u) {
      var x = st.units[u.n], avg = x ? Math.round(x.s / x.n * 100) : null;
      var bar = avg == null ? "" : '<span class="tr-meter"><i style="width:' + avg + '%"></i></span>';
      t.row(["<b>Unit " + u.n + "</b> <span class='cn-none'>" + esc(u.t) + "</span>" + bar, cxPct(avg, avg != null && avg < CX_PASS), x ? String(x.n) : cxNone(),
             x ? String(Object.keys(x.low).length) : cxNone(), "<span class='cn-none'>" + (st.tagged[u.n] ? cxPlural(st.tagged[u.n].length, "piece") + " of work" : "No work yet") + "</span>"],
        function () { openAssignSheet({ courseId: c.id, act: { kind: "unit", course: cur.id, unit: u.n, title: u.t } }); }, "u" + u.n);
    });
    host.appendChild(t);
    if (!units.length) host.appendChild(el("p", "cx-note", "This course has no units on OEdu, so there is nothing to tie work to."));
    if (st.untagged) host.appendChild(el("p", "cx-note", cxPlural(st.untagged, "piece") + " of work in this course " + (st.untagged === 1 ? "isn’t" : "aren’t") + " tied to a unit, so " + (st.untagged === 1 ? "it isn’t" : "they aren’t") + " counted here."));
  }

  function gbMissing(host, c) {
    var gb = c.book, marks = {}, subs = {};
    (gb.grades || []).forEach(function (g) { marks[g.assignmentId + ":" + g.accountId] = g; });
    (gb.submissions || []).forEach(function (s) { subs[s.assignmentId + ":" + s.accountId] = s; });
    var rows = [], now = Date.now();
    (gb.assignments || []).forEach(function (a) {
      (gb.students || []).forEach(function (s) {
        var g = marks[a.id + ":" + s.id], sub = subs[a.id + ":" + s.id];
        if (g && g.status === "missing" && !sub) rows.push({ a: a, s: s, why: "Marked not handed in" });
        else if (!g && !sub && a.dueAt && a.dueAt < now) rows.push({ a: a, s: s, why: "Past due, nothing recorded" });
      });
    });
    host.appendChild(el("p", "cn-sub", rows.length ? cxPlural(rows.length, "piece") + " of work not handed in" : "Nothing is missing in " + esc(c.title) + "."));
    if (!rows.length) return;
    var t = cnTable([{ label: "Student", w: "minmax(170px, 1.2fr)" }, { label: "Work", w: "minmax(180px, 1.6fr)" }, { label: "Due", w: "120px" }, { label: "", w: "minmax(150px, 1fr)", align: "right" }]);
    rows.sort(function (p, q) { return String(p.s.name).localeCompare(String(q.s.name)) || (p.a.dueAt || 0) - (q.a.dueAt || 0); });
    rows.forEach(function (r) {
      t.row([cxWho(r.s), "<b>" + esc(r.a.title) + "</b>", r.a.dueAt ? esc(dayName(r.a.dueAt)) : cxNone(), "<span class='cn-none'>" + esc(r.why) + "</span>"],
        function () { openGrading(c, r.a, r.s.id); }, r.a.id + r.s.id);
    });
    host.appendChild(t);
  }

  function gbHistory(host, c, d) {
    var evs = d.events.filter(function (e) { return e.courseId === c.id; });
    host.appendChild(el("p", "cn-sub", "Every change to a mark in " + esc(c.title) + ", newest first. Changes are kept for good." +
      (evs.length >= HISTORY_LIMIT ? " Showing the latest " + HISTORY_LIMIT + "." : "")));
    if (!evs.length) { host.appendChild(cnEmpty("No marks yet.", "Marks appear here as they are entered.")); return; }
    var feed = el("div", "cx-feed");
    evs.forEach(function (e) {
      var r = el("div", "cx-ev");
      var to = e.toStatus === "missing" ? "missing" : e.toStatus === "excused" ? "excused" : e.toScore == null ? "cleared" : cxNum(e.toScore) + " / " + cxNum(e.outOf);
      var from = e.fromStatus === "missing" ? "missing" : e.fromStatus === "excused" ? "excused" : e.fromScore == null ? null : cxNum(e.fromScore);
      r.innerHTML = avatarHtml(e.student || {}) + '<span class="t"><b>' + esc((e.student && e.student.name) || "A student") + "</b><span> · " + esc(e.title || "") + " → </span>" +
        '<span class="cx-chg">' + esc(to) + "</span>" + (from ? "<span> (was " + esc(from) + ")</span>" : "") +
        "<span> · by " + esc(e.actorName || "someone") + "</span></span><time>" + esc(whenName(e.at)) + "</time>";
      feed.appendChild(r);
    });
    host.appendChild(feed);
  }

  /* --------------------------------------------------------- Assignments */
  var AS_VIEWS = [["upcoming", "Upcoming"], ["active", "Active"], ["past", "Past"], ["drafts", "Drafts"]];
  function tabTeachAssignments(v) {
    var top = el("div", "cx-top");
    consoleHead(top, "Teach", "Assignments", "Everything you have set, across your courses. Work on OEdu opens straight into the lesson for your students.");
    var tools = el("div", "cx-tools");
    tools.appendChild(cnAction("New assignment", function () { openAssignSheet({}); }, true));
    top.appendChild(tools);
    v.appendChild(top);
    S.asView = S.asView || "active";
    var node = loading(v, "your work");
    teachCourses().then(function (cs) {
      return Promise.all(cs.map(function (c) {
        return Promise.all([API.courses.assignments(c.id), API.grades.book(c.id).catch(function () { return null; })])
          .then(function (r) { return { c: c, list: r[0], book: r[1] }; });
      }));
    }).then(function (rows) {
      node.remove();
      var now = Date.now(), soon = now + 14 * 864e5, all = [];
      rows.forEach(function (r) {
        var handed = {}, marked = {}, n = r.book ? (r.book.students || []).length : 0;
        if (r.book) {
          (r.book.submissions || []).forEach(function (s) { handed[s.assignmentId] = (handed[s.assignmentId] || 0) + 1; });
          (r.book.grades || []).forEach(function (g) { if (g.score != null || g.status !== "marked") marked[g.assignmentId] = (marked[g.assignmentId] || 0) + 1; });
        }
        r.list.forEach(function (a) { all.push({ a: a, c: r.c, handed: handed[a.id] || 0, marked: marked[a.id] || 0, n: n }); });
      });
      function inView(x, k) {
        var a = x.a;
        if (k === "drafts") return a.status === "draft";
        if (a.status === "draft") return false;
        if (k === "past") return a.dueAt && a.dueAt < now;
        if (k === "upcoming") return a.dueAt && a.dueAt >= now && a.dueAt <= soon;
        return !a.dueAt || a.dueAt >= now;
      }
      var bar = el("div", "cn-bar");
      var chips = cnFilters(AS_VIEWS.map(function (x) { return { k: x[0], name: x[1], n: all.filter(function (y) { return inView(y, x[0]); }).length }; }),
        S.asView, function (k) { S.asView = k; chips.mark(k); draw(); });
      bar.appendChild(chips);
      v.appendChild(bar);
      var slot = el("div");
      v.appendChild(slot);
      function draw() {
        slot.innerHTML = "";
        var list = all.filter(function (x) { return inView(x, S.asView); })
          .sort(function (p, q) { return S.asView === "past" ? (q.a.dueAt || 0) - (p.a.dueAt || 0) : (p.a.dueAt || Infinity) - (q.a.dueAt || Infinity); });
        if (!list.length) {
          slot.appendChild(cnEmpty(S.asView === "drafts" ? "No drafts." : "Nothing here.",
            S.asView === "drafts" ? "Save work as a draft and it waits here, unseen by students, until you assign it." : "Set work with New assignment."));
          return;
        }
        var t = cnTable([{ label: "Work", w: "minmax(220px, 2fr)" }, { label: "Course", w: "minmax(120px, 1fr)" }, { label: "Due", w: "120px" },
                         { label: "Handed in", w: "100px", align: "right" }, { label: "Marked", w: "90px", align: "right" }]);
        list.forEach(function (x) {
          var a = x.a;
          t.row(["<b>" + esc(a.title) + "</b><span class='cn-none as-kind'>" + esc(a.activity ? (onOedu(a.activity) ? "On OEdu · " + activityShort(a.activity) : "Elsewhere · Unit " + a.activity.unit) : a.category || "") + "</span>",
                 esc(x.c.title), a.dueAt ? esc(dayName(a.dueAt)) : cxNone("No date"),
                 onOedu(a.activity) ? x.handed + " / " + x.n : cxNone(), x.marked + " / " + x.n],
            function () { openAssignSheet({ assignment: a }); }, a.id);
        });
        slot.appendChild(t);
      }
      draw();
    }, function (e) { failed(node, e, function () { openAdmin(true, "assignments"); }); });
  }

  /* ---------------------------------------------------------- Assessments
     The formal ones: tests and quizzes in the teacher's own courses, with
     how each went. School-wide assessments are the school console's. */
  var AM_VIEWS = [["tests", "Tests"], ["quizzes", "Quizzes"], ["bank", "Question Bank"], ["results", "Results"]];
  function tabTeachAssessments(v) {
    var top = el("div", "cx-top");
    consoleHead(top, "Teach", "Assessments", "Tests and quizzes in your courses, and how they went.");
    var tools = el("div", "cx-tools");
    tools.appendChild(cnAction("New assessment", function () { openAssignSheet({ where: "oedu" }); }, true));
    top.appendChild(tools);
    v.appendChild(top);
    S.amView = S.amView || "tests";
    subNav(v, AM_VIEWS, S.amView, function (k) { S.amView = k; openAdmin(true, "assessments"); });
    if (S.amView === "bank") {
      v.appendChild(el("div", "cx-soon", "<h3>Not set up yet</h3><p>A bank of your own questions, reused across quizzes and tests, needs somewhere to keep them. " +
        "Today, OEdu unit tests and quizzes come with their questions — assign one from Lessons.</p>"));
      return;
    }
    var node = loading(v, "your tests");
    loadSchool().then(function (d) {
      node.remove();
      var rows = [];
      d.courses.forEach(function (c) {
        var avg = assignmentAverages(c), n = {};
        (c.book.grades || []).forEach(function (g) { if (g.score != null) n[g.assignmentId] = (n[g.assignmentId] || 0) + 1; });
        (c.book.assignments || []).forEach(function (a) {
          var kind = a.activity && a.activity.kind === "test" ? "tests" : /test|exam|assess|final|midterm/i.test(a.category || a.title) ? "tests" : /quiz|check/i.test(a.category || a.title) ? "quizzes" : null;
          if (kind) rows.push({ c: c, a: a, kind: kind, avg: avg[a.id], n: n[a.id] || 0 });
        });
      });
      var list = S.amView === "results" ? rows.filter(function (r) { return r.avg != null; }) : rows.filter(function (r) { return r.kind === S.amView; });
      if (!list.length) { v.appendChild(cnEmpty("None yet.", "Set a test or a quiz — an OEdu unit test, or your own — and it appears here.")); return; }
      if (S.amView === "results") {
        var grid = el("div", "cx-grid");
        v.appendChild(grid);
        var ch = cxSection(grid, "cx-s12", "Average mark", "Tests and quizzes that have been marked");
        ch.appendChild(barChart(list.slice(-12).map(function (r) { return { label: trim(r.a.title, 9), title: r.a.title + " · " + r.c.title, n: r.avg, color: r.avg < CX_PASS ? "var(--cx-red)" : "var(--cx-bar)" }; }), { values: true, wide: true }));
      }
      var t = cnTable([{ label: S.amView === "quizzes" ? "Quiz" : "Test", w: "minmax(220px, 2fr)" }, { label: "Course", w: "minmax(120px, 1fr)" },
                       { label: "Date", w: "120px" }, { label: "Marked", w: "90px", align: "right" }, { label: "Average", w: "90px", align: "right" }]);
      list.sort(function (p, q) { return (q.a.dueAt || 0) - (p.a.dueAt || 0); }).forEach(function (r) {
        t.row(["<b>" + esc(r.a.title) + "</b>" + (onOedu(r.a.activity) ? "<span class='cn-none as-kind'>On OEdu · " + esc(activityName(r.a.activity)) + "</span>" : ""),
               esc(r.c.title), r.a.dueAt ? esc(dayName(r.a.dueAt)) : cxNone(), String(r.n), cxPct(r.avg, r.avg != null && r.avg < CX_PASS)],
          function () { openGrading(r.c, r.a); }, r.a.id);
      });
      v.appendChild(t);
    }, function (e) { failed(node, e, function () { openAdmin(true, "assessments"); }); });
  }

  /* -------------------------------------------------------------- Lessons
     What students are doing on OEdu because you set it — today, coming up,
     not yet assigned — and the OEdu library to set more from. */
  var LS_VIEWS = [["today", "Today"], ["upcoming", "Upcoming"], ["drafts", "Drafts"], ["shared", "Shared"], ["library", "OEdu Library"]];
  function tabTeachLessons(v) {
    var top = el("div", "cx-top");
    consoleHead(top, "Learning", "Lessons", "Lessons and activities your students do on OEdu, and the library to set them from.");
    var tools = el("div", "cx-tools");
    tools.appendChild(cnAction("Assign a lesson", function () { openAssignSheet({ where: "oedu" }); }, true));
    top.appendChild(tools);
    v.appendChild(top);
    S.lsView = S.lsView || "today";
    subNav(v, LS_VIEWS, S.lsView, function (k) { S.lsView = k; openAdmin(true, "lessons"); });
    if (S.lsView === "library") { lessonLibrary(v); return; }
    if (S.lsView === "shared") {
      v.appendChild(el("div", "cx-soon", "<h3>Not set up yet</h3><p>Sharing lessons between teachers needs lessons of your own to share. " +
        "Every OEdu lesson is in the library for every teacher already.</p>"));
      return;
    }
    var node = loading(v, "your lessons");
    teachCourses().then(function (cs) {
      return Promise.all(cs.map(function (c) {
        return Promise.all([API.courses.assignments(c.id), API.grades.book(c.id).catch(function () { return null; })]).then(function (r) { return { c: c, list: r[0], book: r[1] }; });
      }));
    }).then(function (rows) {
      node.remove();
      var eod = endOfToday(), sod = eod - 864e5 + 1, out = [];
      rows.forEach(function (r) {
        var handed = {}, n = r.book ? (r.book.students || []).length : 0;
        if (r.book) (r.book.submissions || []).forEach(function (s) { handed[s.assignmentId] = (handed[s.assignmentId] || 0) + 1; });
        r.list.forEach(function (a) {
          if (!onOedu(a.activity)) return;
          var k = a.status === "draft" ? "drafts" : a.dueAt && a.dueAt >= sod && a.dueAt <= eod ? "today" : a.dueAt && a.dueAt > eod ? "upcoming" : !a.dueAt ? "today" : null;
          if (k === S.lsView) out.push({ a: a, c: r.c, handed: handed[a.id] || 0, n: n });
        });
      });
      if (!out.length) {
        v.appendChild(cnEmpty(S.lsView === "drafts" ? "No drafts." : S.lsView === "today" ? "Nothing on OEdu is due today." : "Nothing coming up on OEdu.",
          "Assign a lesson from the OEdu Library, or with Assign a lesson.", "Open the library", function () { S.lsView = "library"; openAdmin(true, "lessons"); }));
        return;
      }
      var list = el("div", "tq-list");
      out.sort(function (p, q) { return (p.a.dueAt || 0) - (q.a.dueAt || 0); }).forEach(function (x) {
        var b = el("button", "tq-row");
        b.type = "button";
        b.innerHTML = '<span class="ic">' + cxIcon("play") + '</span><span class="t"><b>' + esc(x.a.title) + "</b><span>" + esc(x.c.title + " · " + activityName(x.a.activity) +
          (x.a.dueAt ? " · due " + dayName(x.a.dueAt) : "")) + '</span></span><span class="n">' + x.handed + "<small>/" + x.n + '</small></span><span class="go">' + cxIcon("chev") + "</span>";
        b.addEventListener("click", function () { if (x.a.status === "draft") openAssignSheet({ assignment: x.a }); else openGrading(x.c, x.a); });
        list.appendChild(b);
      });
      v.appendChild(list);
    }, function (e) { failed(node, e, function () { openAdmin(true, "lessons"); }); });
  }

  /* The library: each course's units, and inside a unit what can be set. */
  function lessonLibrary(v) {
    var node = loading(v, "the library");
    teachCourses().then(function (cs) {
      node.remove();
      var mine = cs.map(function (c) { return { row: c, cur: curriculumOf(c) }; }).filter(function (x) { return x.cur; });
      var shown = {};
      mine.forEach(function (x) { shown[x.cur.id] = 1; });
      function courseBlock(cur, row) {
        var sec = el("section", "lib-course");
        sec.appendChild(el("h3", null, esc(cur.t) + (row ? "" : " <span class='cn-none'>· not a course you teach</span>")));
        var units = unitsOf(cur).filter(function (u) { return u.lab || u.play || u.read || u.set; });
        if (!units.length) { sec.appendChild(el("p", "cx-note", "No lessons are written for this course yet.")); return sec; }
        units.forEach(function (u) {
          var d = el("details", "lib-unit");
          d.innerHTML = "<summary><b>Unit " + u.n + "</b><span>" + esc(u.t) + "</span>" + cxIcon("chev") + "</summary>";
          var body = el("div", "lib-items");
          d.appendChild(body);
          d.addEventListener("toggle", function () {
            if (!d.open || body.dataset.done) return;
            body.dataset.done = "1";
            body.appendChild(el("p", "cx-note", "Loading…"));
            unitChoices(cur, u).then(function (list) {
              body.innerHTML = "";
              list.filter(function (x) { return x.act.kind !== "offline"; }).forEach(function (x) {
                var r = el("div", "lib-item");
                r.innerHTML = '<span class="ic">' + cxIcon(x.act.kind === "test" ? "checklist" : x.act.kind === "set" ? "folder" : x.act.kind === "unit" ? "path" : "play") + "</span><span class='t'>" + esc(x.label) + "</span>";
                var pv = el("button", "cn-btn small", "Preview");
                pv.type = "button";
                pv.addEventListener("click", function () { previewActivity(x.act); });
                var go = el("button", "cn-btn small strong", "Assign");
                go.type = "button";
                go.addEventListener("click", function () {
                  openAssignSheet({ courseId: row ? row.id : null, act: x.act, done: function () { S.lsView = "upcoming"; openAdmin(true, "lessons"); } });
                });
                r.appendChild(pv);
                r.appendChild(go);
                body.appendChild(r);
              });
            });
          });
          sec.appendChild(d);
        });
        return sec;
      }
      if (!mine.length) v.appendChild(el("p", "cx-note", "None of your courses has OEdu lessons yet. Everything OEdu has written is below."));
      mine.forEach(function (x) { v.appendChild(courseBlock(x.cur, x.row)); });
      var more = allCourses().filter(function (c) { return !shown[c.id] && !c.stub && unitsOf(c).some(function (u) { return u.lab || u.play || u.read || u.set; }); });
      if (more.length) {
        var d = el("details", "lib-more");
        d.innerHTML = "<summary>More from OEdu <span class='cn-none'>" + cxPlural(more.length, "course") + "</span></summary>";
        more.forEach(function (c) { d.appendChild(courseBlock(c, null)); });
        v.appendChild(d);
      }
    }, function (e) { failed(node, e, function () { openAdmin(true, "lessons"); }); });
  }

  /* Seeing a lesson the way a student will, from inside the console. */
  function previewActivity(act) {
    var c = activityCourse(act);
    if (act.kind === "set") { openSet(act.set); return; }
    if (!c) { toast("That course isn’t on OEdu."); return; }
    if (act.kind === "lesson") openLab(c, act.unit, "l" + act.lesson);
    else if (act.kind === "test") openLab(c, act.unit, "Test");
    else openUnit(c, act.unit);
  }

  /* ------------------------------------------------------------ Standards */
  function tabTeachStandards(v) {
    var head = el("div", "tr-pagehead");
    v.appendChild(head);
    var node = loading(v, "your courses");
    Promise.all([teachCourses(), loadSchool()]).then(function (r) {
      node.remove();
      if (!r[0].length) { v.appendChild(cnEmpty("You aren’t teaching any courses yet.", "")); return; }
      var cur = coursePill(head, r[0]);
      consoleHead(head, null, "Standards");
      var c = courseBook(r[1], cur.id);
      if (c) gbStandards(v, c);
    }, function (e) { failed(node, e, function () { openAdmin(true, "standards"); }); });
  }

  /* ----------------------------------------------------------- Curriculum
     The course's units in order, and how far the teaching has got: a unit
     whose work is all past due is taught, one with work still to come is
     under way, one with none is still ahead. */
  function tabTeachCurriculum(v) {
    var head = el("div", "tr-pagehead");
    v.appendChild(head);
    var node = loading(v, "your courses");
    Promise.all([teachCourses(), loadSchool()]).then(function (r) {
      node.remove();
      if (!r[0].length) { v.appendChild(cnEmpty("You aren’t teaching any courses yet.", "")); return; }
      var row = coursePill(head, r[0]);
      consoleHead(head, null, "Curriculum");
      var c = courseBook(r[1], row.id), cur = curriculumOf(row);
      var units = cur ? unitsOf(cur) : [];
      if (!units.length) { v.appendChild(cnEmpty("No units yet.", "This course has no curriculum on OEdu.")); return; }
      var st = c ? unitStanding(c) : { tagged: {} }, now = Date.now(), part = null;
      var list = el("div", "cu-list");
      units.forEach(function (u) {
        if (u.part && u.part !== part) { part = u.part; list.appendChild(el("p", "tq-head", esc(part))); }
        var work = st.tagged[u.n] || [];
        var state = !work.length ? "ahead" : work.every(function (a) { return a.dueAt && a.dueAt < now; }) ? "taught" : "going";
        var b = el("div", "cu-row " + state);
        var ready = u.lab || u.play || u.read || u.set;
        b.innerHTML = '<span class="cu-dot" aria-hidden="true"></span><span class="t"><b>Unit ' + u.n + " · " + esc(u.t) + "</b><span>" +
          esc(state === "taught" ? "Taught · " + cxPlural(work.length, "piece") + " of work" : state === "going" ? "Under way · " + cxPlural(work.length, "piece") + " of work"
            : ready ? "Not started" : "Not started · lessons not written yet") + "</span></span>";
        var acts = el("span", "r");
        if (ready) {
          var pv = el("button", "cn-btn small", "Preview");
          pv.type = "button";
          pv.addEventListener("click", function () { openUnit(cur, u.n); });
          acts.appendChild(pv);
        }
        var go = el("button", "cn-btn small", "Set work");
        go.type = "button";
        go.addEventListener("click", function () { openAssignSheet({ courseId: row.id, act: ready ? { kind: "unit", course: cur.id, unit: u.n, title: u.t } : { kind: "offline", course: cur.id, unit: u.n, title: u.t } }); });
        acts.appendChild(go);
        b.appendChild(acts);
        list.appendChild(b);
      });
      v.appendChild(list);
      v.appendChild(el("p", "cx-note", "Taught means every piece of work tied to the unit is past its due date. Tie work to a unit when you set it."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "curriculum"); }); });
  }

  /* ------------------------------------------------------------ Resources */
  function tabTeachResources(v) {
    consoleHead(v, "Learning", "Resources", "Study sets and readings for your courses — yours, and OEdu’s.");
    var node = loading(v, "your courses");
    teachCourses().then(function (cs) {
      node.remove();
      var grid = el("div", "cx-grid");
      v.appendChild(grid);
      var mineSec = cxSection(grid, "cx-s12", "My resources", "Study sets you have written for your courses", { label: "Write a study set", go: function () { openAdmin(false, "sets"); } });
      var own = Object.keys(dbSets).map(function (k) { return { id: k, s: dbSets[k] }; });
      if (!own.length) mineSec.appendChild(el("p", "cx-note", "You haven’t written a study set yet."));
      own.forEach(function (x) { mineSec.appendChild(resRow(x.id, x.s, "Yours")); });
      var lib = cxSection(grid, "cx-s12", "OEdu Library", "Written by OEdu for the courses you teach");
      var any = false;
      cs.forEach(function (row) {
        var cur = curriculumOf(row);
        if (!cur) return;
        unitsOf(cur).forEach(function (u) {
          if (u.set && SC.set(u.set)) { any = true; lib.appendChild(resRow(u.set, SC.set(u.set), cur.t + " · Unit " + u.n)); }
          var rd = readerFor(cur.id, u.n);
          if (rd) { any = true; lib.appendChild(readRow(cur, u, rd)); }
        });
      });
      if (!any) lib.appendChild(el("p", "cx-note", "No study sets or readings for your courses yet — see Lessons › OEdu Library for lessons."));
      var sh = cxSection(grid, "cx-s12", "Department · School · District · Shared with me", "");
      sh.appendChild(el("p", "cx-note", "Sharing resources between teachers isn’t set up yet. When it is, what your department and school share will be here."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "resources"); }); });
  }
  function resRow(id, s, where) {
    var r = el("div", "lib-item");
    r.innerHTML = '<span class="ic">' + cxIcon("folder") + "</span><span class='t'><b>" + esc(s.t || id) + "</b> <span class='cn-none'>" + esc(where) + " · " +
      cxPlural((s.cards || []).length, "term") + "</span></span>";
    var pv = el("button", "cn-btn small", "Open");
    pv.type = "button";
    pv.addEventListener("click", function () { openSet(id); });
    var go = el("button", "cn-btn small strong", "Assign");
    go.type = "button";
    go.addEventListener("click", function () { openAssignSheet({ act: { kind: "set", set: id, title: s.t } }); });
    r.appendChild(pv);
    r.appendChild(go);
    return r;
  }
  function readRow(cur, u, rd) {
    var r = el("div", "lib-item");
    r.innerHTML = '<span class="ic">' + cxIcon("doc") + "</span><span class='t'><b>" + esc(u.t) + "</b> <span class='cn-none'>" + esc(cur.t) + " · Unit " + u.n + " · " +
      cxPlural(rd.sections.length, "section") + " to read</span></span>";
    var pv = el("button", "cn-btn small", "Open");
    pv.type = "button";
    pv.addEventListener("click", function () { openUnit(cur, u.n); });
    var go = el("button", "cn-btn small strong", "Assign");
    go.type = "button";
    go.addEventListener("click", function () { openAssignSheet({ act: { kind: "unit", course: cur.id, unit: u.n, title: u.t } }); });
    r.appendChild(pv);
    r.appendChild(go);
    return r;
  }

  /* --------------------------------------------------------------- Groups
     Groups a teacher would make anyway, found in the marks: who is below a
     pass, who is missing work, who is ready for more, who is struggling on
     a particular unit. Work is still set for the whole course. */
  function tabTeachGroups(v) {
    consoleHead(v, "Students", "Groups", "Instructional groups, found in your gradebooks. Open one to see who is in it and why.");
    var node = loading(v, "your gradebooks");
    loadSchool().then(function (d) {
      node.remove();
      var groups = [];
      d.courses.forEach(function (c) {
        var studs = d.students.map(function (s) { return { s: s, x: s.courses.filter(function (y) { return y.courseId === c.id; })[0] }; })
          .filter(function (r) { return r.x; });
        function add(name, why, list) { if (list.length) groups.push({ c: c, name: name, why: why, list: list }); }
        add("Below a pass", "Under " + CX_PASS + "% in " + c.title, studs.filter(function (r) { return r.x.grade && r.x.grade.percent < CX_PASS; }));
        add("Missing work", "Two or more pieces not handed in", studs.filter(function (r) { return r.x.missing >= 2; }));
        add("Ready for more", "90% or above", studs.filter(function (r) { return r.x.grade && r.x.grade.percent >= 90; }));
        var st = unitStanding(c), cur = curriculumOf(c.raw);
        Object.keys(st.units).forEach(function (n) {
          var low = Object.keys(st.units[n].low);
          if (low.length < 2) return;
          var u = cur ? unitsOf(cur).filter(function (x) { return String(x.n) === n; })[0] : null;
          add("Unit " + n + (u ? ": " + u.t : ""), "Scored under " + CX_PASS + "% on this unit’s work",
            studs.filter(function (r) { return low.indexOf(r.s.id) > -1; }));
        });
      });
      if (!groups.length) { v.appendChild(cnEmpty("No groups yet.", "Groups appear once there are marks to find them in.")); return; }
      var grid = el("div", "tg-grid");
      groups.forEach(function (g) {
        var b = el("button", "tg-card");
        b.type = "button";
        b.innerHTML = "<p class='k'>" + esc(g.c.title) + "</p><h3>" + esc(g.name) + "</h3><p>" + esc(g.why) + "</p>" +
          "<div class='av'>" + g.list.slice(0, 6).map(function (r) { return avatarHtml(r.s); }).join("") +
          (g.list.length > 6 ? "<span>+" + (g.list.length - 6) + "</span>" : "") + "</div><b class='n'>" + cxPlural(g.list.length, "student") + "</b>";
        b.addEventListener("click", function () { groupSheet(g); });
        grid.appendChild(b);
      });
      v.appendChild(grid);
      v.appendChild(el("p", "cx-note", "These groups are worked out from marks each time you open this page. Naming and keeping groups of your own, and setting work for one group, aren’t set up yet — work is set for the whole course."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "groups"); }); });
  }
  function groupSheet(g) {
    var box = el("div", "as-sheet");
    box.appendChild(el("p", "cn-eyebrow", esc(g.c.title)));
    box.appendChild(el("h2", "as-h", esc(g.name)));
    box.appendChild(el("p", "cn-sub", esc(g.why)));
    var t = cnTable([{ label: "Student", w: "minmax(160px, 1.4fr)" }, { label: "Grade", w: "80px", align: "right" }, { label: "Missing", w: "80px", align: "right" }]);
    g.list.forEach(function (r) {
      t.row([cxWho(r.s), cxPct(r.x.grade ? r.x.grade.percent : null, r.x.grade && r.x.grade.percent < CX_PASS), String(r.x.missing || 0)],
        function () { openStudentSheet(r.s); }, r.s.id);
    });
    box.appendChild(t);
    var acts = cnActions();
    acts.appendChild(cnAction("Print the list", function () {
      cxPrint(g.name, "<h1>" + esc(g.name) + "</h1><p class='sub'>" + esc(g.c.title + " · " + g.why) + "</p><table><tr><th>Student</th><th class='r'>Grade</th><th class='r'>Missing</th></tr>" +
        g.list.map(function (r) { return "<tr><td>" + esc(r.s.name) + "</td><td class='r'>" + (r.x.grade ? r.x.grade.percent + "%" : "—") + "</td><td class='r'>" + (r.x.missing || 0) + "</td></tr>"; }).join("") + "</table>");
    }));
    box.appendChild(acts);
    cxSheet(box);
  }

  /* ------------------------------------------------------------ Analytics */
  var AN_VIEWS = [["courses", "Course performance"], ["work", "Assignments"], ["kinds", "Kinds of work"], ["trends", "Grade trends"]];
  function tabTeachAnalytics(v) {
    consoleHead(v, "Insights", "Analytics", "Your courses’ marks in context. Only marks count here — never what students practise on their own.");
    S.anView = S.anView || "courses";
    subNav(v, AN_VIEWS, S.anView, function (k) { S.anView = k; openAdmin(true, "analytics"); });
    var node = loading(v, "your gradebooks");
    loadSchool().then(function (d) {
      node.remove();
      var grid = el("div", "cx-grid");
      v.appendChild(grid);
      if (S.anView === "courses") {
        var c1 = cxSection(grid, "cx-s12", "Average by course", "");
        c1.appendChild(barChart(d.courses.map(function (c) { return { label: trim(c.title, 10), title: c.title, n: c.average || 0, color: c.average != null && c.average < CX_PASS ? "var(--cx-red)" : "var(--cx-bar)" }; }), { values: true, wide: true }));
        var t = cnTable([{ label: "Course", w: "minmax(180px, 1.6fr)" }, { label: "Students", w: "90px", align: "right" }, { label: "Average", w: "90px", align: "right" },
                         { label: "Below " + CX_PASS + "%", w: "100px", align: "right" }, { label: "Missing", w: "90px", align: "right" }]);
        d.courses.forEach(function (c) {
          t.row(["<b>" + esc(c.title) + "</b>", String(c.students), cxPct(c.average, c.average != null && c.average < CX_PASS), String(c.below), String(c.missing)],
            function () { S.courseId = c.id; S.gbView = "overview"; openAdmin(false, "roster"); }, c.id);
        });
        cxSection(grid, "cx-s12", "Courses", "").appendChild(t);
      } else if (S.anView === "work") {
        d.courses.forEach(function (c) {
          var avg = assignmentAverages(c);
          var sec = cxSection(grid, "cx-s12", c.title, "Average mark on each piece, in the order it was set");
          sec.appendChild(barChart((c.book.assignments || []).filter(function (a) { return avg[a.id] != null; }).map(function (a) {
            return { label: trim(a.title, 8), title: a.title, n: avg[a.id], color: avg[a.id] < CX_PASS ? "var(--cx-red)" : "var(--cx-bar)" };
          }), { values: true, wide: true }));
        });
      } else if (S.anView === "kinds") {
        var cat = {};
        d.courses.forEach(function (c) {
          var a = {};
          (c.book.assignments || []).forEach(function (x) { a[x.id] = x; });
          (c.book.grades || []).forEach(function (g) {
            if (g.score == null || !g.outOf) return;
            var k = (a[g.assignmentId] && a[g.assignmentId].category) || "Other", x = cat[k] || (cat[k] = { s: 0, n: 0 });
            x.s += g.score / g.outOf; x.n++;
          });
        });
        var kc = cxSection(grid, "cx-s12", "How students do by kind of work", "Across your courses");
        kc.appendChild(barChart(Object.keys(cat).sort().map(function (k) {
          var p = Math.round(cat[k].s / cat[k].n * 100);
          return { label: k, n: p, title: k + " (" + cat[k].n + " marks)", color: p < CX_PASS ? "var(--cx-red)" : "var(--cx-bar)" };
        }), { values: true, wide: true }));
      } else {
        var wk = {};
        d.courses.forEach(function (c) {
          var due = {};
          (c.book.assignments || []).forEach(function (a) { due[a.id] = a.dueAt; });
          (c.book.grades || []).forEach(function (g) {
            if (g.score == null || !g.outOf || !due[g.assignmentId]) return;
            var w = weekOf(due[g.assignmentId]), x = wk[w] || (wk[w] = { s: 0, n: 0 });
            x.s += g.score / g.outOf; x.n++;
          });
        });
        var keys = Object.keys(wk).map(Number).sort(function (p, q) { return p - q; }).slice(-16);
        var tr = cxSection(grid, "cx-s12", "Average mark by week", "By the week the work was due");
        tr.appendChild(barChart(keys.map(function (k) {
          var p = Math.round(wk[k].s / wk[k].n * 100), dt = new Date(k);
          return { label: (dt.getMonth() + 1) + "/" + dt.getDate(), n: p, title: "Week of " + dt.toLocaleDateString(), color: p < CX_PASS ? "var(--cx-red)" : "var(--cx-bar)" };
        }), { values: true, wide: true, average: true }));
        var gr = growthRows(d).sort(function (p, q) { return p.change - q.change; });
        var gs = cxSection(grid, "cx-s12", "Who is changing", "Each student’s later marks against their earlier ones, in each course");
        var t2 = cnTable([{ label: "Student", w: "minmax(160px, 1.4fr)" }, { label: "Course", w: "minmax(120px, 1fr)" }, { label: "Now", w: "80px", align: "right" }, { label: "Change", w: "90px", align: "right" }]);
        gr.slice(0, 12).forEach(function (x) { t2.row([cxWho(x.s), esc(x.course.title), cxPct(x.now, x.now < CX_PASS), changeHtml(x.change)], function () { openStudentSheet(x.s); }, x.s.id + x.course.id); });
        if (gr.length) gs.appendChild(t2); else gs.appendChild(el("p", "cx-note", "A student needs four marks in a course before a change can be seen."));
      }
    }, function (e) { failed(node, e, function () { openAdmin(true, "analytics"); }); });
  }

  /* -------------------------------------------------------- Interventions
     Students needing support, the reason in words, and what to do next. */
  function tabTeachInterventions(v) {
    consoleHead(v, "Insights", "Interventions", "Students who need support, why, and a next step for each.");
    var node = loading(v, "your gradebooks");
    loadSchool().then(function (d) {
      node.remove();
      var slip = {};
      growthRows(d).forEach(function (x) { if (x.change <= -8) (slip[x.s.id] = slip[x.s.id] || []).push(x); });
      var list = d.students.map(function (s) {
        var why = [], acts = [];
        s.courses.forEach(function (c) {
          if (c.grade && c.grade.percent < CX_PASS) why.push("Below a pass in " + c.title + " (" + c.grade.percent + "%)");
          if (c.missing >= 2) why.push(c.missing + " pieces missing in " + c.title);
        });
        (slip[s.id] || []).forEach(function (x) { why.push("Down " + Math.abs(x.change) + " points in " + x.course.title); });
        if (s.missing) acts.push("Chase the missing work — a zero counts until it is handed in");
        if (s.standing != null && s.standing < CX_PASS) acts.push("Set practice on the units they are weakest in");
        if (slip[s.id]) acts.push("Talk to them: something changed");
        return { s: s, why: why, acts: acts, weight: (s.standing == null ? 100 : s.standing) - s.missing * 3 - (slip[s.id] ? 5 : 0) };
      }).filter(function (r) { return r.why.length; }).sort(function (p, q) { return p.weight - q.weight; });
      cxMetrics(v, [
        { label: "Need support", value: list.length, note: "of " + cxPlural(d.students.length, "student") },
        { label: "Below a pass", value: d.students.filter(function (s) { return s.standing != null && s.standing < CX_PASS; }).length, bad: true },
        { label: "Missing work", value: d.students.filter(function (s) { return s.missing >= 2; }).length, note: "two or more pieces" },
        { label: "Slipping", value: Object.keys(slip).length, note: "down 8 points or more" }
      ]);
      if (!list.length) { v.appendChild(cnEmpty("Nobody needs support right now.", "Nobody is below a pass, missing two pieces, or slipping.")); return; }
      var box = el("div", "iv-list");
      list.forEach(function (r) {
        var card = el("div", "iv-card");
        card.innerHTML = avatarHtml(r.s) + "<div class='t'><b>" + esc(r.s.name) + "</b><ul class='why'>" + r.why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") +
          "</ul><p class='do'>" + esc(r.acts.join(" · ")) + "</p></div>";
        var a = el("div", "r");
        a.appendChild(cnAction("Open", function () { openStudentSheet(r.s); }));
        a.appendChild(cnAction("Report", function () { openReport(r.s); }));
        card.appendChild(a);
        box.appendChild(card);
      });
      v.appendChild(box);
      v.appendChild(el("p", "cx-note", "Recording an intervention — what was tried, when, and how it went — isn’t set up yet, so there is no history here."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "interventions"); }); });
  }

  /* ---------------------------------------------- Not set up yet, honestly */
  function tabTeachAttendance(v) {
    soonPage(v, "Students", "Attendance", "Taking attendance for each course, fast, every day.",
      ["A register for each course, with the whole roster present by default", "Absent, late and excused, one tap each",
       "Each student’s attendance beside their grade", "What families see, the same day"],
      "Attendance records are being set up for the school; taking it from here arrives with them.",
      [["Students", function () { openAdmin(false, "students"); }]]);
  }
  function tabTeachMessages(v) {
    soonPage(v, "Communicate", "Messages", "One place for every conversation — students, families, colleagues.",
      ["A conversation per student, with their family on it when you choose", "Messages to colleagues who teach the same students",
       "A note on work you have marked, answered in one place"],
      "Messaging needs somewhere to keep conversations, and that isn’t built yet. Comments on marks already reach students with the mark.",
      [["To Grade", function () { openAdmin(false, "tograde"); }]]);
  }
  function tabTeachAnnouncements(v) {
    soonPage(v, "Communicate", "Announcements", "One message to everyone in a course.",
      ["Post to a course — students see it on their School page", "Schedule for later", "Families copied when you choose"],
      "Announcements aren’t built yet. Work you set shows up on every student’s School page as soon as you assign it.",
      [["New assignment", function () { openAssignSheet({}); }]]);
  }

  /* ------------------------------------------------------------------ Help */
  function tabTeachHelp(v) {
    consoleHead(v, "Help", "Help", "How the teacher console works, and its shortcuts.");
    var mac = /Mac|iP(hone|ad)/.test(navigator.platform), cmd = mac ? "⌘" : "Ctrl ";
    var grid = el("div", "cx-grid");
    v.appendChild(grid);
    var keys = cxSection(grid, "cx-s6", "Keyboard shortcuts", "");
    keys.id = "help-keys";
    var kt = cnTable([{ label: "", w: "minmax(120px, 1fr)" }, { label: "", w: "auto", align: "right" }]);
    [["Search OEdu", cmd + "K"], ["Show or hide the sidebar", cmd + "\\"], ["Next cell in the gradebook", "Tab · ↵"], ["Not handed in", "m"], ["Excused", "e"],
     ["Late", "a score then l — 18l"], ["Save and go to the next student", "↵ in Grading"], ["Leave focus mode", "Esc"]].forEach(function (k) {
      kt.row([esc(k[0]), "<kbd class='tr-kbd'>" + esc(k[1]) + "</kbd>"]);
    });
    keys.appendChild(kt);
    var how = cxSection(grid, "cx-s6", "How things work", "");
    how.innerHTML += "<ul class='hp-list'>" + [
      "<b>Work on OEdu.</b> Set a lesson, a unit test, a whole unit or a study set as an assignment. Students open it from their School page; when they finish, it is handed in and waits in To Grade.",
      "<b>A hand-in is not a mark.</b> What OEdu measured is shown beside the student. You decide the mark — one press takes OEdu’s.",
      "<b>Self-learning is theirs.</b> Courses students take up on their own are never graded, and you can’t see them. Only work you set, and mark, counts.",
      "<b>Drafts</b> stay out of students’ sight until you assign them.",
      "<b>Standards</b> are your course’s units: work tied to a unit adds up to how the course is doing on it."
    ].map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
    var nt = cxSection(grid, "cx-s12", "Notifications", "");
    nt.id = "help-notify";
    nt.appendChild(el("p", "cx-note", "OEdu doesn’t send notifications yet. What needs you is counted beside To Grade in the sidebar."));
    if (S.helpAt) {
      var at = S.helpAt === "keys" ? keys : nt;
      S.helpAt = null;
      setTimeout(function () { at.scrollIntoView({ block: "start" }); at.classList.add("hp-flash"); }, 60);
    }
  }

  var TEACH_TABS = {
    today: consoleHome, courses: tabCourses, roster: tabTeachGradebook, tograde: tabToGrade, assignments: tabTeachAssignments,
    assessments: tabTeachAssessments, lessons: tabTeachLessons, standards: tabTeachStandards, curriculum: tabTeachCurriculum,
    resources: tabTeachResources, students: tabStudents, groups: tabTeachGroups, attendance: tabTeachAttendance,
    analytics: tabTeachAnalytics, interventions: tabTeachInterventions, messages: tabTeachMessages, announcements: tabTeachAnnouncements,
    system: tabSystem, help: tabTeachHelp, activity: tabActivity, reports: tabReports, work: tabWork, sets: tabSets
  };

  /* ------------------------------------------------------------- Overview */
  function drawOverview(v, grid, d, head) {
    var courses = d.courses, students = d.students;
    var cells = 0, dealt = 0, handed = 0, toMark = 0, dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    courses.forEach(function (c) {
      cells += c.cells; dealt += c.dealt; handed += c.handed; toMark += c.toMark;
      Object.keys(dist).forEach(function (k) { dist[k] += c.dist[k]; });
    });
    var graded = students.filter(function (s) { return s.standing != null; });
    var passing = graded.filter(function (s) { return s.standing >= CX_PASS; }).length;
    var avg = graded.length ? Math.round(cxMean(graded.map(function (s) { return s.standing; }))) : null;
    var pMarked = cells ? Math.round(dealt / cells * 100) : null, pPass = graded.length ? Math.round(passing / graded.length * 100) : null;
    var missingStudents = students.filter(function (s) { return s.missing > 0; }).length;
    var sub = head.querySelector(".cn-sub");
    if (sub) sub.textContent = schoolName() + " · " + cxPlural(students.length, "student") + " · " + cxPlural(d.teachers.length, "teacher") +
      " · " + cxPlural(courses.length, "course");

    var metrics = cxMetrics(grid, [
      { label: "Students", value: students.length, note: cxPlural(courses.length, "course"), go: function () { openAdmin(false, "students"); } },
      { label: "School average", value: avg, unit: "%", line: avg, go: function () { openAdmin(false, "analytics"); } },
      { label: "Passing", value: pPass, unit: "%", line: pPass, note: (graded.length - passing) + " below " + CX_PASS + "%", go: function () { openAdmin(false, "support"); } },
      { label: "Due work marked", value: pMarked, unit: "%", line: pMarked, note: toMark ? toMark + " waiting" : "nothing waiting", go: function () { openAdmin(false, "teacher-analytics"); } },
      { label: "Missing work", value: d.totals.missing, bad: true, note: cxPlural(missingStudents, "student"), go: function () { openAdmin(false, "missing"); } }
    ]);
    metrics.style.setProperty("--i", 0);

    // Who needs someone to look.
    var risk = students.filter(function (s) { return (s.standing != null && s.standing < CX_PASS) || s.missing >= 2; })
      .sort(function (a, b) { return (a.standing == null ? 999 : a.standing) - (b.standing == null ? 999 : b.standing) || b.missing - a.missing; });
    var na = cxSection(grid, "cx-s7", "Needs attention", risk.length ? cxPlural(risk.length, "student") : "", { label: "Student Support", go: function () { openAdmin(false, "support"); } });
    if (!risk.length) na.appendChild(el("p", "cx-note", "Nobody is below a pass or missing more than one piece of work."));
    var nl = el("div", "cx-list");
    risk.slice(0, 6).forEach(function (s) {
      var low = s.courses.filter(function (c) { return c.grade && c.grade.percent < CX_PASS; }).map(function (c) { return c.title; });
      var b = el("button", "cx-li");
      b.type = "button";
      b.innerHTML = avatarHtml(s) + '<span class="t"><b>' + esc(s.name) + "</b><span>" +
        esc(low.length ? "Below a pass in " + low.join(", ") : s.courses.map(function (c) { return c.title; }).join(", ")) + "</span></span>" +
        '<span class="r"><b' + (s.standing != null && s.standing < CX_PASS ? ' style="color:var(--cx-red)"' : "") + ">" +
        (s.standing == null ? "—" : s.standing + "%") + "</b>" + (s.missing ? '<span class="cx-pill orange">' + s.missing + " missing</span>" : "") + "</span>";
      b.addEventListener("click", function () { openStudent360(s); });
      nl.appendChild(b);
    });
    na.appendChild(nl);

    // Grades, as the school gives them.
    var gd = cxSection(grid, "cx-s5", "Grades", "every course grade");
    var total = Object.keys(dist).reduce(function (a, k) { return a + dist[k]; }, 0);
    gd.appendChild(el("div", "cx-big", "<b>" + total + "</b><span>course grades, A to F</span>"));
    gd.appendChild(barChart(["A", "B", "C", "D", "F"].map(function (k) {
      return { label: k, n: dist[k], color: k === "F" ? "var(--cx-red)" : "var(--cx-bar)" };
    }), { values: true }));

    // Courses, weakest first.
    var cc = cxSection(grid, "cx-s7", "Courses", "lowest average first", { label: "Gradebook", go: function () { openAdmin(false, "gradebook"); } });
    var cl = el("div", "cx-list");
    courses.slice().sort(function (a, b) { return (a.average == null ? 999 : a.average) - (b.average == null ? 999 : b.average); }).slice(0, 7)
      .forEach(function (c) {
        var b = el("button", "cx-li plain");
        b.type = "button";
        b.innerHTML = '<span class="t"><b>' + esc(c.title) + "</b><span>" +
          esc((c.teachers.map(function (t) { return t.name; }).join(", ") || "No teacher assigned") + " · " + cxPlural(c.students, "student")) + "</span></span>" +
          '<span class="r"><b>' + (c.average == null ? "—" : c.average + "%") + "</b>" +
          (c.below ? '<span class="cx-pill red">' + c.below + " below a pass</span>" : '<span class="cx-pill green">on track</span>') + "</span>";
        b.addEventListener("click", function () { S.gbPath = { dept: c.subject || "Other", course: c.id }; openAdmin(false, "gradebook"); });
        cl.appendChild(b);
      });
    cc.appendChild(cl);

    // Marking, teacher by teacher.
    var sf = cxSection(grid, "cx-s5", "Marking", "due work marked", { label: "Teachers", go: function () { openAdmin(false, "staff"); } });
    if (!d.teachers.length) sf.appendChild(el("p", "cx-note", "No course has a teacher assigned yet."));
    var tl = el("div", "cx-list");
    d.teachers.slice().sort(function (a, b) { return (a.cells ? a.dealt / a.cells : 1) - (b.cells ? b.dealt / b.cells : 1); }).slice(0, 7)
      .forEach(function (t) {
        var p = t.cells ? Math.round(t.dealt / t.cells * 100) : null;
        var b = el("button", "cx-li");
        b.type = "button";
        b.innerHTML = avatarHtml(t) + '<span class="t"><b>' + esc(t.name) + "</b><span>" +
          esc(t.courses.map(function (c) { return c.title; }).join(", ")) + "</span></span>" +
          '<span class="r"><b>' + (p == null ? "—" : p + "%") + "</b>" +
          (t.toMark ? '<span class="cx-pill orange">' + t.toMark + " to mark</span>" : '<span class="cx-pill green">up to date</span>') + "</span>";
        b.addEventListener("click", function () { S.staffPick = t.id; openAdmin(false, "staff"); });
        tl.appendChild(b);
      });
    sf.appendChild(tl);

    // The latest changes to marks.
    var fa = cxSection(grid, "cx-s12", "Latest marks", "", { label: "Audit Log", go: function () { openAdmin(false, "activity"); } });
    var feed = el("div", "cx-feed");
    d.events.slice(0, 6).forEach(function (e) {
      var r = el("div", "cx-ev");
      r.innerHTML = avatarHtml(e.student || {}) + '<span class="t"><b>' + esc(e.actorName || "Someone") + "</b><span> marked </span><b>" +
        esc((e.student && e.student.name) || "a student") + "</b><span>’s " + esc(e.title) + " · " + esc(e.courseTitle || "") + " → </span>" +
        '<span class="cx-chg">' + esc(changeText(e)) + "</span></span><time>" + esc(whenName(e.at)) + "</time>";
      feed.appendChild(r);
    });
    if (!d.events.length) feed.appendChild(el("p", "cx-note", "Nothing has been marked yet."));
    fa.appendChild(feed);
    [].forEach.call(grid.children, function (c, k) { c.style.setProperty("--i", k); });
  }

  /* ============================================================ Academics */

  /* The school's 4.0 scale, the same one the diploma record uses. */
  function gpaPoints(p) { return p == null ? null : p >= 90 ? 4 : p >= 80 ? 3 : p >= 70 ? 2 : p >= 60 ? 1 : 0; }
  function currentGpa(s) {
    var g = s.courses.filter(function (c) { return c.grade && c.grade.percent != null; });
    return g.length ? Math.round(cxMean(g.map(function (c) { return gpaPoints(c.grade.percent); })) * 100) / 100 : null;
  }
  function gpaText(n) { return n == null ? "—" : Number(n).toFixed(2); }

  function tabGpa(v) {
    cxPage(v, "Academics", "GPA",
      "On the school’s 4.0 scale — A 90+, B 80+, C 70+, D 60+. Current is this year’s course grades as they stand today; " +
      "cumulative is the finished courses on each student’s diploma record.");
    var node = loading(v, "grades");
    loadSchool().then(function (d) {
      node.remove();
      var cur = {};
      d.students.forEach(function (s) { cur[s.id] = currentGpa(s); });
      var have = d.students.filter(function (s) { return cur[s.id] != null; });
      var mean = have.length ? cxMean(have.map(function (s) { return cur[s.id]; })) : null;
      cxMetrics(v, [
        { label: "Mean current GPA", value: mean == null ? null : mean.toFixed(2) },
        { label: "Students with a GPA", value: have.length, note: "of " + d.students.length },
        { label: "3.5 and above", value: have.filter(function (s) { return cur[s.id] >= 3.5; }).length },
        { label: "Below 2.0", value: have.filter(function (s) { return cur[s.id] < 2; }).length, bad: true }
      ]);
      var grid = el("div", "cx-grid");
      v.appendChild(grid);
      var bands = [["Below 1", 0, 1], ["1–2", 1, 2], ["2–3", 2, 3], ["3–3.5", 3, 3.5], ["3.5–4", 3.5, 4.01]];
      var ch = cxSection(grid, "cx-s12", "Current GPA", "students in each band");
      ch.appendChild(barChart(bands.map(function (b) {
        return { label: b[0], n: have.filter(function (s) { return cur[s.id] >= b[1] && cur[s.id] < b[2]; }).length, color: "var(--cx-bar)" };
      }), { values: true, wide: true }));

      // Eligibility: the usual rule for sports and activities.
      var inel = d.students.map(function (s) {
        var why = [], fail = s.courses.filter(function (c) { return c.grade && c.grade.percent < 60; });
        if (fail.length) why.push("failing " + fail.map(function (c) { return c.title; }).join(", "));
        if (cur[s.id] != null && cur[s.id] < 2) why.push("current GPA " + gpaText(cur[s.id]));
        return { s: s, why: why };
      }).filter(function (x) { return x.why.length; });
      var eg = cxSection(grid, "cx-s12", "Eligibility", (have.length - inel.length) + " of " + have.length + " eligible");
      eg.appendChild(el("p", "cx-note", "Eligible means passing every course — 60% or better — with a current GPA of 2.0 or more, the usual rule for " +
        "sports and activities. The school cannot set a rule of its own here yet."));
      if (inel.length) {
        var et = cnTable([{ label: "Not eligible", w: "minmax(170px, 1fr)" }, { label: "GPA", w: "70px", align: "right" }, { label: "Why", w: "minmax(240px, 2.2fr)" }]);
        inel.forEach(function (x) {
          et.row([cxWho(x.s), "<b class='cn-mk bad'>" + gpaText(cur[x.s.id]) + "</b>", esc(x.why.join(" · "))], function () { openStudent360(x.s); }, x.s.id);
        });
        eg.appendChild(et);
      }

      var list = cxSection(grid, "cx-s12", "Students", "");
      var bar = el("div", "cn-bar");
      S.gpaFilter = S.gpaFilter || "all";
      var chips = cnFilters([{ k: "all", name: "Everyone" }, { k: "high", name: "3.5 and above" }, { k: "low", name: "Below 2.0" }], S.gpaFilter,
        function (k) { S.gpaFilter = k; draw(); });
      bar.appendChild(chips);
      list.appendChild(bar);
      var tick = readingNote(list, "diploma records");
      var slot = el("div");
      list.appendChild(slot);
      var recs = {};
      function draw() {
        chips.mark(S.gpaFilter);
        slot.innerHTML = "";
        var t = cnTable([{ label: "Student", w: "minmax(180px, 1.4fr)" }, { label: "Grade", w: "90px" }, { label: "Current", w: "80px", align: "right" },
                         { label: "Cumulative", w: "96px", align: "right" }, { label: "GPA credits", w: "96px", align: "right" }]);
        d.students.filter(function (s) {
          var c = cur[s.id];
          return S.gpaFilter === "all" || (S.gpaFilter === "high" ? c != null && c >= 3.5 : c != null && c < 2);
        }).forEach(function (s) {
          var G = recs[s.id], g = G && G.gpa;
          t.row([cxWho(s), G === undefined ? cxNone("…") : G && G.program && G.program.gradeLevel ? esc(G.program.gradeLevel) : cxNone(),
                 cur[s.id] == null ? cxNone() : "<b class='cn-mk" + (cur[s.id] < 2 ? " bad" : "") + "'>" + gpaText(cur[s.id]) + "</b>",
                 G === undefined ? cxNone("…") : g && g.value != null ? "<b class='cn-mk'>" + gpaText(g.value) + "</b>" : cxNone(),
                 g && g.credits ? cxNum(g.credits) : cxNone()], function () { openStudent360(s, "graduation"); }, s.id);
        });
        slot.appendChild(t);
      }
      draw();
      readRecords(d.students, tick).then(function (r) { recs = r; draw(); });
      list.appendChild(el("p", "cx-note", "Cumulative GPA comes from courses with a final letter on the diploma record — transcripts the school has imported, " +
        "and finished courses. A student with none yet shows a dash. Both are unweighted: a weighted GPA needs honors and AP weights on courses, which courses do not carry yet."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "gpa"); }); });
  }

  function tabTranscripts(v) {
    var P = cxPage(v, "Academics", "Transcripts",
      "Each student’s courses and marks: finished courses from their diploma record, and this year’s courses as they stand.");
    var node = loading(v, "students");
    loadSchool().then(function (d) {
      node.remove();
      var tick = readingNote(v, "diploma records");
      var slot = el("div");
      v.appendChild(slot);
      readRecords(d.students, tick).then(function (recs) {
        P.tools.appendChild(cnAction("Export all (CSV)", function () {
          var rows = [["Student", "Email", "Year", "Course", "Area", "Mark", "Letter", "Credits", "Source"]];
          d.students.forEach(function (s) {
            var G = recs[s.id];
            ((G && G.marks) || []).forEach(function (m) { rows.push([s.name, s.email, m.year, m.title, m.area, m.mark, m.letter, m.credits, m.source]); });
            s.courses.forEach(function (c) { rows.push([s.name, s.email, "This year", c.title, c.subject, c.grade ? c.grade.percent : "", c.grade ? c.grade.letter : "", "", "in progress"]); });
          });
          csvDownload("transcripts-" + new Date().toISOString().slice(0, 10) + ".csv", rows);
        }));
        var t = cnTable([{ label: "Student", w: "minmax(180px, 1.4fr)" }, { label: "Grade", w: "90px" }, { label: "On record", w: "92px", align: "right" },
                         { label: "Credits", w: "80px", align: "right" }, { label: "GPA", w: "70px", align: "right" }, { label: "This year", w: "90px", align: "right" }]);
        d.students.forEach(function (s) {
          var G = recs[s.id] || {};
          t.row([cxWho(s), G.program && G.program.gradeLevel ? esc(G.program.gradeLevel) : cxNone(),
                 (G.marks || []).length ? String(G.marks.length) : cxNone(),
                 G.totals && G.totals.earned ? cxNum(G.totals.earned) : cxNone(),
                 G.gpa && G.gpa.value != null ? gpaText(G.gpa.value) : cxNone(),
                 cxPlural(s.courses.length, "course")], function () { openTranscript(s, recs[s.id]); }, s.id);
        });
        slot.appendChild(t);
      });
    }, function (e) { failed(node, e, function () { openAdmin(true, "transcripts"); }); });
  }

  /* One student's transcript, as a sheet: year by year, then this year. */
  function openTranscript(s, G) {
    G = G || {};
    var box = el("div", "cx-transcript");
    box.appendChild(el("header", "cx-ihead", avatarHtml(s) + '<div class="t"><b>' + esc(s.name) + "</b><span>" +
      esc([schoolName(), G.program && G.program.gradeLevel, G.track && G.track.name].filter(Boolean).join(" · ")) + "</span></div>"));
    var stats = el("div", "cx-ihero");
    stats.innerHTML = '<div class="stats"><div><b>' + (G.gpa && G.gpa.value != null ? gpaText(G.gpa.value) : "—") + "</b><span>Cumulative GPA</span></div><div><b>" +
      cxNum((G.totals && G.totals.earned) || 0) + "</b><span>Credits earned</span></div><div><b>" + gpaText(currentGpa(s)) + "</b><span>Current GPA</span></div></div>";
    box.appendChild(stats);
    var byYear = {};
    (G.marks || []).forEach(function (m) { (byYear[m.year || "Year not given"] = byYear[m.year || "Year not given"] || []).push(m); });
    Object.keys(byYear).sort().forEach(function (y) {
      box.appendChild(el("p", "cx-sethead", esc(y)));
      var t = cnTable([{ label: "Course", w: "minmax(150px, 1.6fr)" }, { label: "Mark", w: "60px", align: "right" }, { label: "", w: "40px", align: "right" },
                       { label: "Credits", w: "64px", align: "right" }]);
      byYear[y].forEach(function (m, k) { t.row([esc(m.title) + (m.area ? "<span class='cn-sub2'>" + esc(m.area) + "</span>" : ""), esc(m.mark == null ? "—" : m.mark), esc(m.letter || ""), cxNum(m.credits)], null, y + k); });
      box.appendChild(t);
    });
    if (!(G.marks || []).length) box.appendChild(el("p", "cx-note", "No finished courses on the diploma record yet."));
    box.appendChild(el("p", "cx-sethead", "This year · in progress"));
    var t2 = cnTable([{ label: "Course", w: "minmax(150px, 1.6fr)" }, { label: "Now", w: "60px", align: "right" }, { label: "", w: "40px", align: "right" }]);
    s.courses.forEach(function (c) { t2.row([esc(c.title), c.grade ? c.grade.percent + "%" : "—", esc(c.grade ? c.grade.letter : "")], null, c.courseId); });
    box.appendChild(t2);
    var acts = cnActions();
    acts.style.marginTop = "20px";
    acts.appendChild(cnAction("Diploma record", function () { openRecord(s); }, true));
    acts.appendChild(cnAction("Student 360", function () { openStudent360(s); }));
    acts.appendChild(cnAction("Download CSV", function () {
      var rows = [["Year", "Course", "Area", "Mark", "Letter", "Credits"]];
      (G.marks || []).forEach(function (m) { rows.push([m.year, m.title, m.area, m.mark, m.letter, m.credits]); });
      s.courses.forEach(function (c) { rows.push(["This year", c.title, c.subject, c.grade ? c.grade.percent : "", c.grade ? c.grade.letter : "", ""]); });
      csvDownload("transcript-" + String(s.name).toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".csv", rows);
    }));
    box.appendChild(acts);
    cxSheet(box);
  }

  function tabGraduation(v) {
    cxPage(v, "Academics", "Graduation",
      "Where every student stands against their diploma: credits toward it, requirements met, and what is still to earn.");
    var node = loading(v, "students");
    loadSchool().then(function (d) {
      node.remove();
      var tick = readingNote(v, "diploma records");
      var slot = el("div");
      v.appendChild(slot);
      readRecords(d.students, tick).then(function (recs) {
        function pct(G) { var T = G.totals || {}, tot = G.track && G.track.total; return tot ? Math.round(Math.min(1, (T.earnedTowardDiploma || 0) / tot) * 100) : null; }
        var rows = d.students.map(function (s) { return { s: s, G: recs[s.id] || {} }; });
        var withProg = rows.filter(function (r) { return r.G.program; });
        var gaps = rows.filter(function (r) { return (r.G.gaps || []).length; });
        var done = rows.filter(function (r) { return (r.G.areas || []).length && r.G.areas.every(function (a) { return a.complete; }); });
        // Off track: at the pace the record shows, they finish after the date their program expects.
        var off = rows.filter(function (r) { return r.G.program && r.G.pace && r.G.pace.aheadOfPlan === false; });
        var mean = withProg.length ? Math.round(cxMean(withProg.map(function (r) { return pct(r.G) || 0; }))) : null;
        cxMetrics(slot, [
          { label: "Diploma program set", value: withProg.length, note: "of " + rows.length + " students" },
          { label: "Average progress", value: mean, unit: "%", line: mean, note: "credits toward the diploma" },
          { label: "Every requirement met", value: done.length },
          { label: "Off track", value: off.length, bad: true, note: "finishing after their expected date" }
        ]);
        if (!withProg.length) slot.appendChild(el("div", "cn-verdict", "<b>No student has a diploma program set yet,</b> so these are measured against the " +
          "default track. Set each student’s program from their diploma record."));
        var bar = el("div", "cn-bar");
        S.gradFilter = S.gradFilter || "all";
        var chips = cnFilters([{ k: "all", name: "Everyone", n: rows.length }, { k: "none", name: "No program", n: rows.length - withProg.length },
                               { k: "off", name: "Off track", n: off.length }, { k: "gaps", name: "Still to earn", n: gaps.length }, { k: "done", name: "Complete", n: done.length }],
          S.gradFilter, function (k) { S.gradFilter = k; draw(); });
        bar.appendChild(chips);
        slot.appendChild(bar);
        var ts = el("div");
        slot.appendChild(ts);
        function draw() {
          chips.mark(S.gradFilter);
          ts.innerHTML = "";
          var t = cnTable([{ label: "Student", w: "minmax(170px, 1.3fr)" }, { label: "Program", w: "minmax(130px, 1fr)" }, { label: "Grade", w: "80px" },
                           { label: "Credits", w: "90px", align: "right" }, { label: "Progress", w: "minmax(120px, .9fr)" }, { label: "Requirements", w: "104px", align: "right" }]);
          rows.filter(function (r) {
            return S.gradFilter === "all" || (S.gradFilter === "none" ? !r.G.program : S.gradFilter === "off" ? off.indexOf(r) > -1 :
              S.gradFilter === "gaps" ? (r.G.gaps || []).length : done.indexOf(r) > -1);
          }).forEach(function (r) {
            var G = r.G, p = pct(G), areas = G.areas || [];
            t.row([cxWho(r.s), G.program ? esc((G.track && G.track.name) || G.program.name || "Set") : cxNone("not set"),
                   G.program && G.program.gradeLevel ? esc(G.program.gradeLevel) : cxNone(),
                   G.track && G.track.total ? cxNum((G.totals || {}).earnedTowardDiploma || 0) + " / " + cxNum(G.track.total) : cxNone(),
                   p == null ? cxNone() : '<span class="cx-meter"><i style="width:' + Math.max(1, p) + '%"></i></span><span class="cx-meterv">' + p + "%</span>",
                   areas.length ? areas.filter(function (a) { return a.complete; }).length + " of " + areas.length : cxNone()],
                  function () { openStudent360(r.s, "graduation"); }, r.s.id);
          });
          ts.appendChild(t);
        }
        draw();
      });
    }, function (e) { failed(node, e, function () { openAdmin(true, "graduation"); }); });
  }

  /* Tests and quizzes, from the courses' own gradebooks: any work whose kind
     or title says it is one. */
  var CX_ASSESSMENT = /test|quiz|exam|assess|benchmark|midterm|final|regents|check-in/i;
  function assessmentRows(d) {
    var now = Date.now(), out = [];
    d.courses.forEach(function (c) {
      var gb = c.book || {}, cols = {};
      (gb.columns || []).forEach(function (col) { cols[col.assignmentId] = col; });
      (gb.assignments || []).forEach(function (a) {
        if (!CX_ASSESSMENT.test(a.category || "") && !CX_ASSESSMENT.test(a.title || "")) return;
        var scores = [], missing = 0, marks = [];
        (gb.grades || []).forEach(function (g) {
          if (g.assignmentId !== a.id) return;
          if (g.status === "missing") missing++;
          else if (g.score != null && g.outOf) { scores.push(g.score / g.outOf * 100); marks.push({ id: g.accountId, p: g.score / g.outOf * 100 }); }
        });
        var col = cols[a.id] || {};
        var state = a.dueAt && a.dueAt > now ? "upcoming" : (col.unmarked || 0) > 0 ? "marking" : "marked";
        out.push({ a: a, course: c, due: a.dueAt, state: state, taken: scores.length, of: c.students, missing: missing, toMark: col.unmarked || 0,
                   avg: scores.length ? Math.round(cxMean(scores)) : null,
                   pass: scores.length ? Math.round(scores.filter(function (x) { return x >= CX_PASS; }).length / scores.length * 100) : null,
                   low: scores.length ? Math.round(Math.min.apply(null, scores)) : null, high: scores.length ? Math.round(Math.max.apply(null, scores)) : null,
                   scores: scores, marks: marks });
      });
    });
    return out.sort(function (x, y) { return (x.due || 0) - (y.due || 0); });
  }

  function tabSchoolAssessments(v) {
    cxPage(v, "Academics", "Assessments", "Every test and quiz across the school — coming up, being marked and marked — read from each course’s gradebook.");
    var node = loading(v, "assessments");
    Promise.all([loadSchool(), API.assessments.all().catch(function () { return []; })]).then(function (r) {
      node.remove();
      var d = r[0], exams = r[1] || [], rows = assessmentRows(d), now = Date.now();
      var soon = rows.filter(function (x) { return x.state === "upcoming" && x.due - now < 14 * 864e5; });
      var marking = rows.filter(function (x) { return x.state === "marking"; });
      var marked = rows.filter(function (x) { return x.state === "marked" && x.avg != null; });
      cxMetrics(v, [
        { label: "In the next two weeks", value: soon.length, go: function () { S.asmFilter = "upcoming"; openAdmin(true, "assessments"); } },
        { label: "Being marked", value: marking.length, note: marking.reduce(function (a, x) { return a + x.toMark; }, 0) + " papers waiting" },
        { label: "Marked", value: marked.length },
        { label: "Average score", value: marked.length ? Math.round(cxMean(marked.map(function (x) { return x.avg; }))) : null, unit: "%", go: function () { openAdmin(false, "an-assessments"); } }
      ]);
      var bar = el("div", "cn-bar");
      S.asmFilter = S.asmFilter || (rows.some(function (x) { return x.state === "upcoming"; }) ? "upcoming" : "all");
      var chips = cnFilters([{ k: "upcoming", name: "Upcoming", n: rows.filter(function (x) { return x.state === "upcoming"; }).length },
                             { k: "marking", name: "Being marked", n: marking.length }, { k: "marked", name: "Marked", n: rows.filter(function (x) { return x.state === "marked"; }).length },
                             { k: "all", name: "All", n: rows.length }], S.asmFilter, function (k) { S.asmFilter = k; draw(); });
      bar.appendChild(chips);
      v.appendChild(bar);
      var slot = el("div");
      v.appendChild(slot);
      function draw() {
        chips.mark(S.asmFilter);
        slot.innerHTML = "";
        var list = rows.filter(function (x) { return S.asmFilter === "all" || x.state === S.asmFilter; });
        if (S.asmFilter !== "upcoming") list = list.slice().reverse();
        if (!list.length) { slot.appendChild(cnEmpty("Nothing here.", "No test or quiz in the gradebooks is in this state.")); return; }
        var t = cnTable([{ label: "Assessment", w: "minmax(170px, 1.3fr)" }, { label: "Course", w: "minmax(140px, 1fr)" }, { label: "Kind", w: "80px" },
                         { label: "Date", w: "96px", align: "right" }, { label: "Taken", w: "80px", align: "right" }, { label: "Average", w: "80px", align: "right" }]);
        list.forEach(function (x) {
          t.row(["<b>" + esc(x.a.title) + "</b>", esc(x.course.title), esc(x.a.category || "—"), x.due ? esc(dayName(x.due)) : cxNone(),
                 x.state === "upcoming" ? cxNone() : x.taken + " / " + x.of, cxPct(x.avg, x.avg != null && x.avg < CX_PASS)],
                function () { S.gbPath = { dept: x.course.subject || "Other", course: x.course.id }; openAdmin(false, "gradebook"); }, x.a.id);
        });
        slot.appendChild(t);
      }
      draw();
      if (exams.length) {
        v.appendChild(el("h2", "cn-h2", "Secure assessments"));
        var t2 = cnTable([{ label: "Assessment", w: "minmax(180px, 1.4fr)" }, { label: "Kind", w: "110px" }, { label: "Status", w: "100px" },
                          { label: "Opens", w: "110px", align: "right" }, { label: "Tasks", w: "70px", align: "right" }]);
        exams.forEach(function (x) {
          t2.row(["<b>" + esc(x.title) + "</b>" + (x.course && x.course.name ? "<span class='cn-sub2'>" + esc(x.course.name) + "</span>" : ""), esc(x.kind || ""),
                  esc(x.status || ""), x.opensAt ? esc(dayName(x.opensAt)) : cxNone(), String(x.taskCount || 0)], null, x.id);
        });
        v.appendChild(t2);
      }
    }, function (e) { failed(node, e, function () { openAdmin(true, "assessments"); }); });
  }

  function tabStandards(v) {
    soonPage(v, "Academics", "Standards", "Grading against learning standards rather than only by assignment.",
      ["Each course’s standards, from the state framework or the school’s own", "Work tagged to the standards it assesses",
       "A mastery level per student per standard, alongside the grade", "Standards-based report cards"],
      "Work in the gradebook is not tagged to standards yet, so there is nothing to measure against. The lessons already track skills students practise; " +
      "tying those to standards, and letting teachers tag work, comes first.",
      [["Gradebook", function () { openAdmin(false, "gradebook"); }], ["Curriculum", function () { openAdmin(false, "curriculum"); }]]);
  }

  /* ============================================================= Students */
  function tabEnrollment(v) {
    var P = cxPage(v, "Students", "Enrollment", "Who is enrolled in what, how full each course is, and who is not in a course at all.");
    P.tools.appendChild(cnAction("Add a person", function () { openPersonEditor(null); }));
    P.tools.appendChild(cnAction("New course", function () { openCourseEditor(null); }, true));
    var node = loading(v, "enrollment");
    Promise.all([loadSchool(), API.accounts.list(S.me.orgId).catch(function () { return []; })]).then(function (r) {
      node.remove();
      var d = r[0], people = r[1] || [], staff = {}, enrolled = {};
      d.teachers.forEach(function (t) { staff[t.id] = 1; });
      staff[S.me.id] = 1;
      d.students.forEach(function (s) { enrolled[s.id] = 1; });
      var notIn = people.filter(function (p) { return !enrolled[p.id] && !staff[p.id]; });
      var seats = d.courses.reduce(function (a, c) { return a + c.students; }, 0);
      cxMetrics(v, [
        { label: "Accounts", value: people.length },
        { label: "Enrolled students", value: d.students.length },
        { label: "In no course", value: notIn.length, note: "accounts that are not staff", go: function () { S.enrolView = "none"; openAdmin(true, "enrollment"); } },
        { label: "Seats filled", value: seats, note: cxPlural(d.courses.length, "course") },
        { label: "Average class", value: d.courses.length ? Math.round(seats / d.courses.length) : null, note: "students a course" }
      ]);
      var bar = el("div", "cn-bar");
      S.enrolView = S.enrolView || "course";
      var chips = cnFilters([{ k: "course", name: "By course", n: d.courses.length }, { k: "none", name: "In no course", n: notIn.length }],
        S.enrolView, function (k) { S.enrolView = k; draw(); });
      bar.appendChild(chips);
      v.appendChild(bar);
      var slot = el("div");
      v.appendChild(slot);
      function draw() {
        chips.mark(S.enrolView);
        slot.innerHTML = "";
        var t;
        if (S.enrolView === "none") {
          if (!notIn.length) { slot.appendChild(cnEmpty("Everyone is in a course.", "Every account that is not staff is enrolled in at least one course.")); return; }
          t = cnTable([{ label: "Name", w: "minmax(170px, 1.2fr)" }, { label: "Email", w: "minmax(180px, 1.3fr)" }, { label: "Title", w: "minmax(100px, .8fr)" }]);
          notIn.forEach(function (p) { t.row([cxWho(p), "<span class='cn-mono'>" + esc(p.email || "—") + "</span>", p.title ? esc(p.title) : cxNone()], function () { openPersonEditor(p); }, p.id); });
        } else {
          t = cnTable([{ label: "Course", w: "minmax(180px, 1.4fr)" }, { label: "Department", w: "minmax(110px, .8fr)" }, { label: "Teachers", w: "minmax(130px, 1fr)" },
                       { label: "Students", w: "84px", align: "right" }, { label: "", w: "96px", align: "right" }]);
          d.courses.slice().sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); }).forEach(function (c) {
            var go = el("button", "cn-btn small", "Enrol…");
            go.type = "button";
            go.addEventListener("click", function (e) { e.stopPropagation(); openEnrol(c.raw); });
            t.row(["<b>" + esc(c.title) + "</b>" + (c.level ? "<span class='cn-sub2'>" + esc(c.level) + "</span>" : ""), esc(c.subject || "—"),
                   c.teachers.length ? esc(c.teachers.map(function (x) { return x.name; }).join(", ")) : "<span class='cn-mk warn'>none</span>",
                   String(c.students), go], function () { S.rosterCourse = c.id; openAdmin(false, "rosters"); }, c.id);
          });
        }
        slot.appendChild(t);
      }
      draw();
    }, function (e) { failed(node, e, function () { openAdmin(true, "enrollment"); }); });
  }

  function tabRosters(v) {
    var P = cxPage(v, "Students", "Rosters", "A course’s class list, or the whole school’s, with each student’s grade as it stands.");
    var node = loading(v, "rosters");
    loadSchool().then(function (d) {
      node.remove();
      if (!d.courses.length) { v.appendChild(cnEmpty("No courses yet.", "Make a course and enrol students, and its roster appears here.")); return; }
      var list = d.courses.slice().sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
      var school = S.rosterCourse === "school";
      var c = list.filter(function (x) { return x.id === S.rosterCourse; })[0] || list[0];
      if (!school) S.rosterCourse = c.id;
      var pick = el("select", "cx-select");
      pick.setAttribute("aria-label", "Course");
      var whole = el("option");
      whole.value = "school"; whole.textContent = "Whole school · " + d.students.length;
      if (S.rosterCourse === "school") whole.selected = true;
      pick.appendChild(whole);
      list.forEach(function (x) {
        var o = el("option");
        o.value = x.id; o.textContent = x.title + " · " + x.students;
        if (x.id === c.id) o.selected = true;
        pick.appendChild(o);
      });
      pick.addEventListener("change", function () { S.rosterCourse = pick.value; openAdmin(true, "rosters"); });
      P.tools.appendChild(pick);
      P.tools.appendChild(cnAction("Print class lists", function () {
        cxPrint("Class grade lists", list.map(function (x) {
          var sm = (x.book && x.book.summaries) || {};
          return "<section class='page'>" + printHead(x.title, (x.teachers.map(function (q) { return q.name; }).join(", ") || "No teacher") + " · " + x.students + " students") +
            printTable([{ t: "Student" }, { t: "Email" }, { t: "Grade", r: 1 }, { t: "Letter" }, { t: "Missing", r: 1 }],
              ((x.book && x.book.students) || []).slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }).map(function (st) {
                var g = sm[st.id] || {};
                return [st.name, st.email, g.percent == null ? "" : g.percent + "%", g.letter, g.missingCount || ""];
              })) + "</section>";
        }).join(""));
      }));
      if (school) {
        P.tools.appendChild(cnAction("Export CSV", function () {
          csvDownload("school-roster.csv", [["Student", "Email", "Courses", "Standing %", "Missing"]].concat(d.students.map(function (st) {
            return [st.name, st.email, st.courses.map(function (x) { return x.title; }).join("; "), st.standing, st.missing]; })));
        }));
        cxMetrics(v, [{ label: "Students", value: d.students.length }, { label: "Courses", value: d.courses.length },
                      { label: "Teachers", value: d.teachers.length }]);
        var ts = cnTable([{ label: "", w: "34px", align: "right" }, { label: "Student", w: "minmax(170px, 1.2fr)" }, { label: "Courses", w: "minmax(220px, 2fr)" },
                          { label: "Standing", w: "84px", align: "right" }, { label: "Missing", w: "74px", align: "right" }]);
        d.students.forEach(function (st, k) {
          ts.row(["<span class='cn-none'>" + (k + 1) + "</span>", cxWho(st), esc(st.courses.map(function (x) { return x.title; }).join(", ")),
                  cxPct(st.standing, st.standing != null && st.standing < CX_PASS), st.missing ? "<b class='cn-mk warn'>" + st.missing + "</b>" : cxNone()],
                 function () { openStudent360(st); }, st.id);
        });
        v.appendChild(ts);
        return;
      }
      var sums = (c.book && c.book.summaries) || {}, roster = ((c.book && c.book.students) || []).slice()
        .sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
      P.tools.appendChild(cnAction("Export CSV", function () {
        csvDownload("roster-" + String(c.code || c.title).toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".csv",
          [["Student", "Email", "Percent", "Letter", "Missing"]].concat(roster.map(function (s) {
            var sm = sums[s.id] || {}; return [s.name, s.email, sm.percent, sm.letter, sm.missingCount]; })));
      }));
      P.tools.appendChild(cnAction("Enrol…", function () { openEnrol(c.raw); }, true));
      cxMetrics(v, [
        { label: "Students", value: c.students },
        { label: "Teachers", value: c.teachers.length, note: esc(c.teachers.map(function (x) { return x.name; }).join(", ") || "none assigned") },
        { label: "Average", value: c.average, unit: "%", line: c.average },
        { label: "Below a pass", value: c.below, bad: true }
      ]);
      if (!roster.length) { v.appendChild(cnEmpty("Nobody is enrolled yet.", "Enrol students and they appear here.", "Enrol…", function () { openEnrol(c.raw); })); return; }
      var t = cnTable([{ label: "", w: "34px", align: "right" }, { label: "Student", w: "minmax(170px, 1.3fr)" }, { label: "Email", w: "minmax(170px, 1.2fr)" },
                       { label: "Grade", w: "74px", align: "right" }, { label: "", w: "40px" }, { label: "Missing", w: "74px", align: "right" }]);
      roster.forEach(function (s, k) {
        var sm = sums[s.id] || {};
        t.row(["<span class='cn-none'>" + (k + 1) + "</span>", cxWho(s), "<span class='cn-mono'>" + esc(s.email || "—") + "</span>",
               cxPct(sm.percent, sm.percent != null && sm.percent < CX_PASS), esc(sm.letter || ""),
               sm.missingCount ? "<b class='cn-mk warn'>" + sm.missingCount + "</b>" : cxNone()], function () { openStudent360(s); }, s.id);
      });
      v.appendChild(t);
      var acts = cnActions();
      acts.style.marginTop = "20px";
      acts.appendChild(cnAction("Course page", function () { openCoursePage(c.raw); }));
      acts.appendChild(cnAction("Full gradebook", function () { S.courseId = c.id; openAdmin(false, "roster"); }));
      v.appendChild(acts);
    }, function (e) { failed(node, e, function () { openAdmin(true, "rosters"); }); });
  }

  var RECORD_NAMES = { student: "Student profile", enrollment: "Enrollment", emergency: "Emergency", wellness: "Health & wellness",
    transportation: "Transportation", schedule: "Schedule", attendance: "Attendance", promotion: "Promotion", pathways: "Pathways",
    reading_math: "Reading & math", grades: "Grades", assignments: "Assignments", assessments: "Assessments", graduation: "Graduation",
    iep: "IEP", supports: "Supports", documents: "Documents" };

  function tabRecords(v) {
    var P = cxPage(v, "Students", "Records", "What the school keeps on each student beyond marks — contact details and the sections of their record — and where it is missing.");
    var node = loading(v, "students");
    loadSchool().then(function (d) {
      node.remove();
      var tick = readingNote(v, "student records");
      var slot = el("div");
      v.appendChild(slot);
      readFamilies(d.students, tick).then(function (F) {
        function contactOn(x) { var c = x && x.contact; return !!(c && (c.cellPhone || c.altPhone || c.mailingAddress)); }
        // Emergency information, on paper, for the office and for trips.
        function emergencyRows() {
          return d.students.map(function (s) {
            var x = F[s.id] || {}, c = x.contact || {}, e = (x.records || {}).emergency || {};
            return [s.name, [c.cellPhone, c.altPhone].filter(Boolean).join(" · "), c.mailingAddress || "",
                    (x.guardians || []).map(function (g) { return (g.name || g.email) + (g.phone ? " " + g.phone : ""); }).join("; "),
                    [e.summary].concat((e.facts || []).map(function (f) { return f.label + ": " + f.value; })).filter(Boolean).join("; ")];
          });
        }
        P.tools.appendChild(cnAction("Print emergency info", function () {
          cxPrint("Emergency information", printHead("Emergency information", d.students.length + " students") +
            printTable([{ t: "Student" }, { t: "Phone" }, { t: "Address" }, { t: "Guardians" }, { t: "Emergency record" }], emergencyRows()));
        }));
        P.tools.appendChild(cnAction("Export CSV", function () {
          csvDownload("emergency-information.csv", [["Student", "Phone", "Address", "Guardians", "Emergency record"]].concat(emergencyRows()));
        }));
        var n = d.students.length, withContact = 0, withEmerg = 0, total = 0, count = {};
        d.students.forEach(function (s) {
          var x = F[s.id] || {};
          if (contactOn(x)) withContact++;
          var keys = Object.keys(x.records || {});
          if (keys.indexOf("emergency") > -1) withEmerg++;
          total += keys.length;
          keys.forEach(function (k) { count[k] = (count[k] || 0) + 1; });
        });
        cxMetrics(slot, [
          { label: "Students", value: n },
          { label: "Contact on file", value: withContact, note: n ? Math.round(withContact / n * 100) + "%" : "", line: n ? withContact / n * 100 : 0 },
          { label: "Emergency record", value: withEmerg, note: n ? Math.round(withEmerg / n * 100) + "%" : "", line: n ? withEmerg / n * 100 : 0 },
          { label: "Sections recorded", value: total }
        ]);
        var grid = el("div", "cx-grid");
        slot.appendChild(grid);
        var by = cxSection(grid, "cx-s5", "By section", "students with it");
        var box = el("div", "cx-set");
        Object.keys(RECORD_NAMES).forEach(function (k) {
          var c = count[k] || 0;
          box.appendChild(el("div", "cx-setrow cx-setrow2", '<span class="t"><b>' + esc(RECORD_NAMES[k]) + '</b></span><span class="v">' +
            '<span class="cx-meter sm"><i style="width:' + (n ? Math.max(c ? 2 : 0, c / n * 100) : 0) + '%"></i></span>' + c + "</span>"));
        });
        by.appendChild(box);
        var st = cxSection(grid, "cx-s7", "Students", "");
        var t = cnTable([{ label: "Student", w: "minmax(160px, 1.3fr)" }, { label: "Contact", w: "76px" }, { label: "Emergency", w: "86px" },
                         { label: "Sections", w: "76px", align: "right" }, { label: "Updated", w: "96px", align: "right" }]);
        d.students.forEach(function (s) {
          var x = F[s.id] || {}, recs = x.records || {}, keys = Object.keys(recs);
          var last = keys.reduce(function (a, k) { return Math.max(a, Number(recs[k].updatedAt) || 0); }, 0);
          t.row([cxWho(s), contactOn(x) ? "Yes" : cxNone("no"), recs.emergency ? "Yes" : cxNone("no"), keys.length ? String(keys.length) : cxNone(),
                 last ? esc(dayName(last)) : cxNone()], function () { openStudent360(s, "family"); }, s.id);
        });
        st.appendChild(t);
        st.appendChild(el("p", "cx-note", "Sections are written in each student’s Family view, which the family reads. Nothing here is estimated: a section nobody has written is empty."));
      });
    }, function (e) { failed(node, e, function () { openAdmin(true, "records"); }); });
  }

  function tabDocuments(v) {
    cxPage(v, "Students", "Documents", "What the school has recorded about each student’s documents. Storing the files themselves is not set up yet.");
    var node = loading(v, "students");
    loadSchool().then(function (d) {
      node.remove();
      var tick = readingNote(v, "student records");
      var slot = el("div");
      v.appendChild(slot);
      readFamilies(d.students, tick).then(function (F) {
        var have = d.students.filter(function (s) { return F[s.id] && F[s.id].records && F[s.id].records.documents; });
        if (have.length) {
          var t = cnTable([{ label: "Student", w: "minmax(160px, 1.2fr)" }, { label: "Recorded", w: "minmax(200px, 2fr)" }, { label: "Items", w: "64px", align: "right" },
                           { label: "Updated", w: "96px", align: "right" }]);
          have.forEach(function (s) {
            var r = F[s.id].records.documents;
            t.row([cxWho(s), esc(trim(r.summary || (r.facts || []).map(function (f) { return f.label; }).join(", ") || "—", 90)),
                   String(((r.table && r.table.rows) || []).length + (r.facts || []).length), r.updatedAt ? esc(dayName(r.updatedAt)) : cxNone()],
                  function () { openStudent360(s, "family"); }, s.id);
          });
          slot.appendChild(t);
        } else {
          slot.appendChild(cnEmpty("No documents recorded yet.", "A student’s documents — what is on file and what is still owed — can be listed in the Documents section of their Family view."));
        }
        var box = el("div", "cx-soon");
        box.style.marginTop = "40px";
        box.innerHTML = "<h3>File storage is not set up yet</h3><p>Uploading and keeping the files — birth certificates, proofs of address, signed forms — needs " +
          "private storage with its own access rules, which the platform does not have yet.</p>";
        slot.appendChild(box);
      });
    }, function (e) { failed(node, e, function () { openAdmin(true, "documents"); }); });
  }

  function tabGuardians(v) {
    cxPage(v, "Students", "Guardians", "Every student’s family, and the students nobody is linked to yet. Guardians are added from a student’s Family view.");
    var node = loading(v, "students");
    loadSchool().then(function (d) {
      node.remove();
      var tick = readingNote(v, "families");
      var slot = el("div");
      v.appendChild(slot);
      readFamilies(d.students, tick).then(function (F) {
        var seen = {}, none = [];
        d.students.forEach(function (s) {
          var g = (F[s.id] && F[s.id].guardians) || [];
          if (!g.length) none.push(s);
          g.forEach(function (x) { seen[x.id || x.email || x.name] = 1; });
        });
        cxMetrics(slot, [
          { label: "Students", value: d.students.length },
          { label: "With a guardian", value: d.students.length - none.length, line: d.students.length ? (d.students.length - none.length) / d.students.length * 100 : 0 },
          { label: "Nobody linked", value: none.length, bad: true, go: function () { S.guardFilter = "none"; draw(); } },
          { label: "Guardians", value: Object.keys(seen).length }
        ]);
        var bar = el("div", "cn-bar");
        S.guardFilter = S.guardFilter || "all";
        // The parent directory: one row per guardian, with their children.
        var dir = {}, order = [];
        d.students.forEach(function (s) {
          ((F[s.id] && F[s.id].guardians) || []).forEach(function (x) {
            var k = x.id || x.email || x.name;
            if (!dir[k]) { dir[k] = { g: x, kids: [], rel: {} }; order.push(k); }
            dir[k].kids.push(s.name);
            if (x.relationship) dir[k].rel[String(x.relationship).replace(/_/g, " ")] = 1;
          });
        });
        var parents = order.map(function (k) { return dir[k]; }).sort(function (a, b) { return String(a.g.name || a.g.email).localeCompare(String(b.g.name || b.g.email)); });
        var chips = cnFilters([{ k: "all", name: "Everyone", n: d.students.length }, { k: "none", name: "Nobody linked", n: none.length },
                               { k: "dir", name: "Parent directory", n: parents.length }],
          S.guardFilter, function (k) { S.guardFilter = k; draw(); });
        bar.appendChild(chips);
        slot.appendChild(bar);
        var ts = el("div");
        slot.appendChild(ts);
        function draw() {
          chips.mark(S.guardFilter);
          ts.innerHTML = "";
          if (S.guardFilter === "dir") {
            var acts = cnActions();
            acts.style.marginBottom = "16px";
            var rows = parents.map(function (x) { return [x.g.name || "", Object.keys(x.rel).join(", "), x.g.email || "", x.g.phone || "", x.kids.join(", ")]; });
            acts.appendChild(cnAction("Print directory", function () {
              cxPrint("Parent directory", printHead("Parent directory", parents.length + " guardians") +
                printTable([{ t: "Guardian" }, { t: "Relationship" }, { t: "Email" }, { t: "Phone" }, { t: "Children" }], rows));
            }));
            acts.appendChild(cnAction("Export CSV", function () { csvDownload("parent-directory.csv", [["Guardian", "Relationship", "Email", "Phone", "Children"]].concat(rows)); }));
            ts.appendChild(acts);
            if (!parents.length) { ts.appendChild(cnEmpty("No guardians linked yet.", "Guardians are added from a student’s Family view.")); return; }
            var pt = cnTable([{ label: "Guardian", w: "minmax(160px, 1fr)" }, { label: "Relationship", w: "110px" }, { label: "Reach them at", w: "minmax(180px, 1.3fr)" },
                              { label: "Children", w: "minmax(160px, 1.2fr)" }]);
            parents.forEach(function (x, k) {
              pt.row(["<b>" + esc(x.g.name || x.g.email || "Guardian") + "</b>", esc(Object.keys(x.rel).join(", ") || "—"),
                      "<span class='cn-mono'>" + esc([x.g.email, x.g.phone].filter(Boolean).join(" · ") || "—") + "</span>", esc(x.kids.join(", "))], null, String(k));
            });
            ts.appendChild(pt);
            return;
          }
          var t = cnTable([{ label: "Student", w: "minmax(160px, 1.1fr)" }, { label: "Guardians", w: "minmax(200px, 1.6fr)" }, { label: "Reach them at", w: "minmax(180px, 1.3fr)" }]);
          (S.guardFilter === "none" ? none : d.students).forEach(function (s) {
            var g = (F[s.id] && F[s.id].guardians) || [];
            var first = g[0] || {};
            t.row([cxWho(s), g.length ? esc(g.map(function (x) { return (x.name || x.email || "Guardian") + (x.relationship ? " · " + String(x.relationship).replace(/_/g, " ") : ""); }).join(", "))
                     : "<span class='cn-mk warn'>nobody linked</span>",
                   g.length ? "<span class='cn-mono'>" + esc([first.email, first.phone].filter(Boolean).join(" · ") || "—") + "</span>" : cxNone()],
                  function () { openStudent360(s, "family"); }, s.id);
          });
          ts.appendChild(t);
        }
        draw();
      });
    }, function (e) { failed(node, e, function () { openAdmin(true, "guardians"); }); });
  }

  /* ============================================================ Analytics */
  function tabAnAssessments(v) {
    cxPage(v, "Analytics", "Assessments", "How students do on tests and quizzes, school-wide — by department, by kind, and one assessment at a time.");
    var node = loading(v, "assessments");
    loadSchool().then(function (d) {
      node.remove();
      var rows = assessmentRows(d).filter(function (x) { return x.avg != null; });
      if (!rows.length) { v.appendChild(cnEmpty("No test or quiz has been marked yet.", "When one is, its results appear here.")); return; }
      var all = [];
      rows.forEach(function (x) { all = all.concat(x.scores); });
      var mean = cxMean(all), sd = all.length > 1 ? Math.sqrt(all.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (all.length - 1)) : null;
      var other = [];
      d.courses.forEach(function (c) {
        var gb = c.book || {}, a = {};
        (gb.assignments || []).forEach(function (x) { a[x.id] = x; });
        (gb.grades || []).forEach(function (g) {
          var w = a[g.assignmentId];
          if (!w || CX_ASSESSMENT.test(w.category || "") || CX_ASSESSMENT.test(w.title || "")) return;
          if (g.score != null && g.outOf) other.push(g.score / g.outOf * 100);
        });
      });
      cxMetrics(v, [
        { label: "Assessments marked", value: rows.length },
        { label: "Average score", value: Math.round(mean), unit: "%", line: mean },
        { label: "Scoring " + CX_PASS + "% or more", value: Math.round(all.filter(function (x) { return x >= CX_PASS; }).length / all.length * 100), unit: "%" },
        { label: "Spread", value: sd == null ? null : "±" + Math.round(sd), note: "standard deviation, points" },
        { label: "Other work", value: other.length ? Math.round(cxMean(other)) : null, unit: "%", note: "homework, projects — for comparison" }
      ]);
      var grid = el("div", "cx-grid");
      v.appendChild(grid);
      var dep = {};
      rows.forEach(function (x) { var k = x.course.subject || "Other"; (dep[k] = dep[k] || []).push.apply(dep[k], x.scores); });
      var dc = cxSection(grid, "cx-s6", "By department", "average score");
      dc.appendChild(barChart(Object.keys(dep).sort().map(function (k) {
        var a = Math.round(cxMean(dep[k]));
        return { label: k.length > 11 ? k.slice(0, 10) + "…" : k, title: k, n: a, color: a < CX_PASS ? "var(--cx-red)" : "var(--cx-bar)" };
      }), { values: true }));
      var bands = [0, 0, 0, 0, 0];
      all.forEach(function (x) { bands[x >= 90 ? 0 : x >= 80 ? 1 : x >= 70 ? 2 : x >= 60 ? 3 : 4]++; });
      var sc = cxSection(grid, "cx-s6", "Scores", "every paper");
      sc.appendChild(barChart(["90+", "80s", "70s", "60s", "<60"].map(function (l, k) { return { label: l, n: bands[k], color: k === 4 ? "var(--cx-red)" : "var(--cx-bar)" }; }), { values: true }));
      var tc = cxSection(grid, "cx-s12", "Each assessment", "latest first");
      var t = cnTable([{ label: "Assessment", w: "minmax(160px, 1.3fr)" }, { label: "Course", w: "minmax(130px, 1fr)" }, { label: "Date", w: "90px", align: "right" },
                       { label: "Taken", w: "70px", align: "right" }, { label: "Average", w: "76px", align: "right" }, { label: "Passing", w: "76px", align: "right" },
                       { label: "Range", w: "90px", align: "right" }]);
      rows.slice().reverse().forEach(function (x) {
        t.row(["<b>" + esc(x.a.title) + "</b><span class='cn-sub2'>" + esc(x.a.category || "") + "</span>", esc(x.course.title), x.due ? esc(dayName(x.due)) : cxNone(),
               String(x.taken), cxPct(x.avg, x.avg < CX_PASS), x.pass + "%", x.low + "–" + x.high],
              function () { S.gbPath = { dept: x.course.subject || "Other", course: x.course.id }; openAdmin(false, "gradebook"); }, x.a.id);
      });
      tc.appendChild(t);
      tc.appendChild(el("p", "cx-note", "Item-by-item analysis needs the questions and answers of each test in the platform; these are the scores teachers entered."));

      // Two groups side by side, and whether the gap is bigger than chance.
      var groups = [];
      Object.keys(dep).sort().forEach(function (k) { groups.push({ k: "d:" + k, name: "Department · " + k, has: function (x) { return (x.course.subject || "Other") === k; } }); });
      d.teachers.forEach(function (tt) { groups.push({ k: "t:" + tt.id, name: "Teacher · " + tt.name, has: function (x) { return x.course.teachers.some(function (q) { return q.id === tt.id; }); } }); });
      d.courses.forEach(function (c) { groups.push({ k: "c:" + c.id, name: "Course · " + c.title, has: function (x) { return x.course.id === c.id; } }); });
      var cmp = cxSection(grid, "cx-s12", "Compare two groups", "Welch’s t-test on every paper");
      var bar = el("div", "cn-bar");
      function sel(label, withRest, cur) {
        var s = el("select", "cx-select");
        s.setAttribute("aria-label", label);
        (withRest ? [{ k: "rest", name: "The rest of the school" }] : []).concat(groups).forEach(function (g) {
          var o = el("option");
          o.value = g.k; o.textContent = g.name;
          if (g.k === cur) o.selected = true;
          s.appendChild(o);
        });
        return s;
      }
      S.cmpA = S.cmpA || (groups[0] && groups[0].k);
      S.cmpB = S.cmpB || "rest";
      var sa = sel("First group", false, S.cmpA), sb = sel("Second group", true, S.cmpB);
      bar.appendChild(sa);
      bar.appendChild(el("span", "cn-none", "against"));
      bar.appendChild(sb);
      cmp.appendChild(bar);
      var out = el("div");
      cmp.appendChild(out);
      function compare() {
        S.cmpA = sa.value; S.cmpB = sb.value;
        out.innerHTML = "";
        var A = groups.filter(function (g) { return g.k === S.cmpA; })[0];
        var B = groups.filter(function (g) { return g.k === S.cmpB; })[0];
        var inA = rows.filter(function (x) { return A && A.has(x); });
        var inB = rows.filter(function (x) { return B ? B.has(x) : inA.indexOf(x) < 0; });
        var sA = [], sB = [];
        inA.forEach(function (x) { sA = sA.concat(x.scores); });
        inB.forEach(function (x) { sB = sB.concat(x.scores); });
        var r = welchTest(sA, sB);
        if (!r) { out.appendChild(el("p", "cx-note", "Each group needs at least two marked papers to compare.")); return; }
        var diff = r.m1 - r.m2;
        cxMetrics(out, [
          { label: A.name.split(" · ")[1] || A.name, value: Math.round(r.m1), unit: "%", note: r.n1 + " papers · ±" + Math.round(r.sd1) },
          { label: B ? B.name.split(" · ")[1] || B.name : "The rest of the school", value: Math.round(r.m2), unit: "%", note: r.n2 + " papers · ±" + Math.round(r.sd2) },
          { label: "Difference", value: (diff > 0 ? "+" : "") + diff.toFixed(1), note: "points · effect size d " + r.d.toFixed(2) },
          { label: "p-value", value: r.p < 0.001 ? "<0.001" : r.p.toFixed(3), note: "t " + r.t.toFixed(2) + " · df " + r.df.toFixed(1) }
        ]);
        out.appendChild(el("p", "cx-note", (r.p < 0.05
          ? "<b>A gap this size would rarely happen by chance alone</b> (p below 0.05). "
          : "<b>This gap could well be chance</b> (p of 0.05 or more). ") +
          "It does not say why: the groups sat different tests, with different students who started in different places. " +
          "A fair comparison of teaching needs the same test, and a pre-test to start from."));
      }
      sa.addEventListener("change", compare);
      sb.addEventListener("change", compare);
      compare();

      // Each student's tests and quizzes.
      var bys = {};
      rows.forEach(function (x) { x.marks.forEach(function (m) { (bys[m.id] = bys[m.id] || []).push(m.p); }); });
      var people = {};
      d.students.forEach(function (st) { people[st.id] = st; });
      var sc2 = cxSection(grid, "cx-s12", "By student", "lowest average first");
      var t2 = cnTable([{ label: "Student", w: "minmax(170px, 1.3fr)" }, { label: "Papers", w: "70px", align: "right" }, { label: "Average", w: "80px", align: "right" },
                        { label: "Lowest", w: "74px", align: "right" }, { label: "Highest", w: "74px", align: "right" }]);
      Object.keys(bys).filter(function (id) { return people[id]; }).map(function (id) { return { s: people[id], ps: bys[id] }; })
        .sort(function (a, b) { return cxMean(a.ps) - cxMean(b.ps); }).forEach(function (x) {
          var m = Math.round(cxMean(x.ps));
          t2.row([cxWho(x.s), String(x.ps.length), cxPct(m, m < CX_PASS), Math.round(Math.min.apply(null, x.ps)) + "%", Math.round(Math.max.apply(null, x.ps)) + "%"],
                 function () { openStudent360(x.s, "grades"); }, x.s.id);
        });
      sc2.appendChild(t2);
    }, function (e) { failed(node, e, function () { openAdmin(true, "an-assessments"); }); });
  }

  function tabAnStandards(v) {
    soonPage(v, "Analytics", "Standards", "Mastery of each learning standard, across courses and over time.",
      ["Mastery by standard, school-wide and by course", "Which standards most students have not met yet", "Each student’s standards profile"],
      "There is nothing to analyse until work is tagged to standards — see Academics › Standards.",
      [["Academics › Standards", function () { openAdmin(false, "standards"); }]]);
  }

  /* A student's change in one course: the mean of their later marks less the
     mean of their earlier ones, in percentage points. Four marks at least. */
  function growthRows(d) {
    var out = [];
    d.courses.forEach(function (c) {
      var gb = c.book || {}, due = {}, by = {};
      (gb.assignments || []).forEach(function (a) { due[a.id] = a.dueAt || 0; });
      (gb.grades || []).forEach(function (g) {
        if (g.score == null || !g.outOf) return;
        (by[g.accountId] = by[g.accountId] || []).push({ at: due[g.assignmentId] || 0, p: g.score / g.outOf * 100 });
      });
      (gb.students || []).forEach(function (s) {
        var m = (by[s.id] || []).sort(function (a, b) { return a.at - b.at; });
        if (m.length < 4) return;
        var h = Math.floor(m.length / 2);
        var early = cxMean(m.slice(0, h).map(function (x) { return x.p; })), late = cxMean(m.slice(m.length - h).map(function (x) { return x.p; }));
        out.push({ s: s, course: c, change: Math.round(late - early), marks: m.length, now: Math.round(late) });
      });
    });
    return out;
  }
  function changeHtml(n) {
    if (n == null) return cxNone();
    return "<b class='cn-mk" + (n <= -5 ? " bad" : "") + "'>" + (n > 0 ? "▲ " : n < 0 ? "▼ " : "") + Math.abs(n) + "</b>";
  }

  function tabGrowth(v) {
    cxPage(v, "Analytics", "Growth", "Who is getting better and who is slipping, course by course: each student’s later marks against their earlier ones.");
    var node = loading(v, "grades");
    loadSchool().then(function (d) {
      node.remove();
      var rows = growthRows(d);
      if (!rows.length) { v.appendChild(cnEmpty("Not enough marks yet.", "Growth needs at least four marks for a student in a course.")); return; }
      var up = rows.filter(function (r) { return r.change >= 5; }), down = rows.filter(function (r) { return r.change <= -5; });
      cxMetrics(v, [
        { label: "Measured", value: rows.length, note: "a student in a course" },
        { label: "Improving", value: up.length, note: "5 points or more" },
        { label: "Steady", value: rows.length - up.length - down.length },
        { label: "Slipping", value: down.length, bad: true, note: "5 points or more" },
        { label: "Mean change", value: (function (m) { return (m > 0 ? "+" : "") + Math.round(m); })(cxMean(rows.map(function (r) { return r.change; }))), note: "points" }
      ]);
      var grid = el("div", "cx-grid");
      v.appendChild(grid);
      var bc = {};
      rows.forEach(function (r) { (bc[r.course.id] = bc[r.course.id] || { c: r.course, list: [] }).list.push(r); });
      var cs = cxSection(grid, "cx-s12", "By course", "mean change, points");
      var t = cnTable([{ label: "Course", w: "minmax(170px, 1.3fr)" }, { label: "Measured", w: "84px", align: "right" }, { label: "Change", w: "76px", align: "right" },
                       { label: "", w: "minmax(140px, 1fr)" }, { label: "Improving", w: "84px", align: "right" }, { label: "Slipping", w: "80px", align: "right" }]);
      Object.keys(bc).map(function (k) { return bc[k]; }).sort(function (a, b) {
        return cxMean(a.list.map(function (r) { return r.change; })) - cxMean(b.list.map(function (r) { return r.change; }));
      }).forEach(function (x) {
        var m = Math.round(cxMean(x.list.map(function (r) { return r.change; })));
        t.row(["<b>" + esc(x.c.title) + "</b>", String(x.list.length), changeHtml(m), divBar(m, 20),
               String(x.list.filter(function (r) { return r.change >= 5; }).length), String(x.list.filter(function (r) { return r.change <= -5; }).length)],
              function () { S.gbPath = { dept: x.c.subject || "Other", course: x.c.id }; openAdmin(false, "gradebook"); }, x.c.id);
      });
      cs.appendChild(t);
      function movers(title, list) {
        var sec = cxSection(grid, "cx-s6", title, "");
        var l = el("div", "cx-list");
        list.slice(0, 6).forEach(function (r) {
          var b = el("button", "cx-li");
          b.type = "button";
          b.innerHTML = avatarHtml(r.s) + '<span class="t"><b>' + esc(r.s.name) + "</b><span>" + esc(r.course.title + " · now " + r.now + "%") + '</span></span><span class="r">' + changeHtml(r.change) + "</span>";
          b.addEventListener("click", function () { openStudent360(r.s, "grades"); });
          l.appendChild(b);
        });
        if (!list.length) l.appendChild(el("p", "cx-note", "Nobody."));
        sec.appendChild(l);
      }
      movers("Rising most", up.slice().sort(function (a, b) { return b.change - a.change; }));
      movers("Falling most", down.slice().sort(function (a, b) { return a.change - b.change; }));
      v.appendChild(el("p", "cx-note", "Change is the mean of a student’s later half of marks less their earlier half, in the same course. It is not growth " +
        "against a pre-test — the record holds no baseline assessment yet — and different work can be harder or easier."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "growth"); }); });
  }
  function divBar(n, scale) {
    var w = Math.min(50, Math.abs(n) / scale * 50);
    return '<span class="cx-div"><i class="' + (n < 0 ? "neg" : "pos") + '" style="' + (n < 0 ? "right:50%" : "left:50%") + ";width:" + w + '%"></i></span>';
  }

  function tabGroups(v) {
    cxPage(v, "Analytics", "Groups", "The same grades, grouped — by department, by course level, by grade level — so a gap between groups shows.");
    var node = loading(v, "grades");
    loadSchool().then(function (d) {
      node.remove();
      var bar = el("div", "cn-bar");
      S.groupBy = S.groupBy || "dept";
      var chips = cnFilters([{ k: "dept", name: "Department" }, { k: "level", name: "Course level" }, { k: "grade", name: "Grade level" }, { k: "band", name: "Standing" }],
        S.groupBy, function (k) { S.groupBy = k; draw(); });
      bar.appendChild(chips);
      v.appendChild(bar);
      var slot = el("div");
      v.appendChild(slot);
      var recs = null;
      function draw() {
        chips.mark(S.groupBy);
        slot.innerHTML = "";
        if (S.groupBy === "grade" && !recs) {
          var tick = readingNote(slot, "diploma records");
          readRecords(d.students, tick).then(function (r) { recs = r; if (S.groupBy === "grade") draw(); });
          return;
        }
        var G = {};
        function add(k, s, p, missing) {
          var g = G[k] || (G[k] = { students: {}, ps: [], missing: 0 });
          g.students[s.id] = 1;
          if (p != null) g.ps.push(p);
          g.missing += missing || 0;
        }
        var level = {};
        d.courses.forEach(function (c) { level[c.id] = c.level || "No level set"; });
        d.students.forEach(function (s) {
          if (S.groupBy === "band" || S.groupBy === "grade") {
            var k = S.groupBy === "band"
              ? (s.standing == null ? "Not marked yet" : s.standing >= 90 ? "90 and above" : s.standing >= 80 ? "80–89" : s.standing >= 70 ? "70–79" : "Below 70")
              : (recs[s.id] && recs[s.id].program && recs[s.id].program.gradeLevel) || "Not recorded";
            add(k, s, s.standing, s.missing);
          } else {
            s.courses.forEach(function (c) { add(S.groupBy === "dept" ? c.subject || "Other" : level[c.courseId], s, c.grade ? c.grade.percent : null, c.missing); });
          }
        });
        var keys = Object.keys(G).sort();
        var grid = el("div", "cx-grid");
        slot.appendChild(grid);
        var ch = cxSection(grid, "cx-s12", "Average by group", "");
        ch.appendChild(barChart(keys.map(function (k) {
          var a = G[k].ps.length ? Math.round(cxMean(G[k].ps)) : 0;
          return { label: k.length > 12 ? k.slice(0, 11) + "…" : k, title: k, n: a, color: a && a < CX_PASS ? "var(--cx-red)" : "var(--cx-bar)" };
        }), { values: true, wide: true }));
        var tb = cxSection(grid, "cx-s12", "Groups", "");
        var t = cnTable([{ label: "Group", w: "minmax(160px, 1.4fr)" }, { label: "Students", w: "84px", align: "right" }, { label: "Average", w: "84px", align: "right" },
                         { label: "Passing", w: "84px", align: "right" }, { label: "Missing a student", w: "130px", align: "right" }]);
        keys.forEach(function (k) {
          var g = G[k], n = Object.keys(g.students).length, a = g.ps.length ? Math.round(cxMean(g.ps)) : null;
          t.row(["<b>" + esc(k) + "</b>", String(n), cxPct(a, a != null && a < CX_PASS),
                 g.ps.length ? Math.round(g.ps.filter(function (p) { return p >= CX_PASS; }).length / g.ps.length * 100) + "%" : cxNone(),
                 n ? cxNum(g.missing / n) : cxNone()], null, k);
        });
        tb.appendChild(t);
        tb.appendChild(el("p", "cx-note", "Groups such as English learners, students with disabilities or economic need are not recorded on student accounts yet, " +
          "so they cannot be compared here."));
      }
      draw();
    }, function (e) { failed(node, e, function () { openAdmin(true, "groups"); }); });
  }

  function weekOf(ms) {
    var dt = new Date(Number(ms)); dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
    return dt.getTime();
  }
  function tabLongitudinal(v) {
    cxPage(v, "Analytics", "Longitudinal", "Grades over the year, week by week, by the week the work was due — for the school and for each department.");
    var node = loading(v, "grades");
    loadSchool().then(function (d) {
      node.remove();
      var W = {}, dep = {};
      d.courses.forEach(function (c) {
        var gb = c.book || {}, due = {};
        (gb.assignments || []).forEach(function (a) { due[a.id] = a.dueAt; });
        (gb.grades || []).forEach(function (g) {
          var at = due[g.assignmentId];
          if (!at || g.score == null || !g.outOf) return;
          var w = weekOf(at), p = g.score / g.outOf * 100;
          (W[w] = W[w] || []).push(p);
          var k = c.subject || "Other";
          ((dep[k] = dep[k] || {})[w] = dep[k][w] || []).push(p);
        });
      });
      var weeks = Object.keys(W).map(Number).sort(function (a, b) { return a - b; }).slice(-16);
      if (!weeks.length) { v.appendChild(cnEmpty("Nothing marked yet.", "As work is marked, the year’s grades build up here week by week.")); return; }
      var first = Math.round(cxMean(W[weeks[0]])), last = Math.round(cxMean(W[weeks[weeks.length - 1]]));
      cxMetrics(v, [
        { label: "Weeks with marks", value: weeks.length },
        { label: "First week", value: first, unit: "%" },
        { label: "Latest week", value: last, unit: "%" },
        { label: "Change", value: (last - first > 0 ? "+" : "") + (last - first), note: "points" }
      ]);
      var grid = el("div", "cx-grid");
      v.appendChild(grid);
      var ch = cxSection(grid, "cx-s12", "School average by week", "mean of every mark on work due that week");
      ch.appendChild(barChart(weeks.map(function (w, k) {
        var dt = new Date(w), a = Math.round(cxMean(W[w]));
        return { label: k % 2 === 0 ? dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "", n: a, color: "var(--cx-bar)",
                 title: "Week of " + dt.toLocaleDateString(undefined, { month: "long", day: "numeric" }) + " · " + W[w].length + " marks" };
      }), { values: true, wide: true }));
      var tb = cxSection(grid, "cx-s12", "By department", "first weeks against the latest");
      var t = cnTable([{ label: "Department", w: "minmax(150px, 1.2fr)" }, { label: "Weeks", w: "70px", align: "right" }, { label: "First weeks", w: "96px", align: "right" },
                       { label: "Latest weeks", w: "100px", align: "right" }, { label: "Change", w: "80px", align: "right" }, { label: "", w: "minmax(120px, 1fr)" }]);
      Object.keys(dep).sort().forEach(function (k) {
        var ws = Object.keys(dep[k]).map(Number).sort(function (a, b) { return a - b; });
        var third = Math.max(1, Math.floor(ws.length / 3));
        var a = [], b = [];
        ws.slice(0, third).forEach(function (w) { a = a.concat(dep[k][w]); });
        ws.slice(-third).forEach(function (w) { b = b.concat(dep[k][w]); });
        var ma = Math.round(cxMean(a)), mb = Math.round(cxMean(b));
        t.row(["<b>" + esc(k) + "</b>", String(ws.length), ma + "%", mb + "%", changeHtml(mb - ma), divBar(mb - ma, 20)],
              function () { S.gbPath = { dept: k }; openAdmin(false, "gradebook"); }, k);
      });
      tb.appendChild(t);
      tb.appendChild(el("p", "cx-note", "This year only. Earlier years live on each student’s diploma record — see Transcripts."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "longitudinal"); }); });
  }

  /* ================================================================ Staff */
  function tabDepartments(v) {
    cxPage(v, "Staff", "Departments", "The school by subject: its courses, who teaches them, how many students, and how they are doing.");
    var node = loading(v, "departments");
    loadSchool().then(function (d) {
      node.remove();
      var D = {};
      d.courses.forEach(function (c) {
        var k = c.subject || "Other", x = D[k] || (D[k] = { courses: [], teachers: {}, students: {}, sum: 0, graded: 0, below: 0, cells: 0, dealt: 0, missing: 0 });
        x.courses.push(c);
        c.teachers.forEach(function (t) { x.teachers[t.id] = t.name; });
        ((c.book && c.book.students) || []).forEach(function (s) { x.students[s.id] = 1; });
        x.sum += c.sum; x.graded += c.graded; x.below += c.below; x.cells += c.cells; x.dealt += c.dealt; x.missing += c.missing;
      });
      var keys = Object.keys(D).sort();
      cxMetrics(v, [
        { label: "Departments", value: keys.length },
        { label: "Courses", value: d.courses.length },
        { label: "Teachers", value: d.teachers.length }
      ]);
      var grid = el("div", "cx-grid");
      v.appendChild(grid);
      var ch = cxSection(grid, "cx-s12", "Average by department", "");
      ch.appendChild(barChart(keys.map(function (k) {
        var a = D[k].graded ? Math.round(D[k].sum / D[k].graded) : 0;
        return { label: k.length > 12 ? k.slice(0, 11) + "…" : k, title: k, n: a, color: a && a < CX_PASS ? "var(--cx-red)" : "var(--cx-bar)" };
      }), { values: true, wide: true }));
      var tb = cxSection(grid, "cx-s12", "Departments", "");
      var t = cnTable([{ label: "Department", w: "minmax(130px, 1fr)" }, { label: "Teachers", w: "minmax(160px, 1.4fr)" }, { label: "Courses", w: "74px", align: "right" },
                       { label: "Students", w: "80px", align: "right" }, { label: "Average", w: "80px", align: "right" }, { label: "Below a pass", w: "100px", align: "right" },
                       { label: "Marked", w: "74px", align: "right" }]);
      keys.forEach(function (k) {
        var x = D[k], a = x.graded ? Math.round(x.sum / x.graded) : null, names = Object.keys(x.teachers).map(function (id) { return x.teachers[id]; });
        t.row(["<b>" + esc(k) + "</b>", names.length ? esc(names.join(", ")) : "<span class='cn-mk warn'>no teacher</span>", String(x.courses.length),
               String(Object.keys(x.students).length), cxPct(a, a != null && a < CX_PASS), x.below ? "<b class='cn-mk bad'>" + x.below + "</b>" : cxNone(),
               x.cells ? Math.round(x.dealt / x.cells * 100) + "%" : cxNone()], function () { S.gbPath = { dept: k }; openAdmin(false, "gradebook"); }, k);
      });
      tb.appendChild(t);
    }, function (e) { failed(node, e, function () { openAdmin(true, "departments"); }); });
  }

  function tabTeacherAnalytics(v) {
    cxPage(v, "Staff", "Teacher Analytics",
      "Each teacher’s courses by the numbers — size, grades, how marking keeps up. Evidence to talk about, not a league table: courses start from different places.");
    var node = loading(v, "staff");
    loadSchool().then(function (d) {
      node.remove();
      if (!d.teachers.length) { v.appendChild(cnEmpty("Nobody is teaching a course yet.", "Assign a teacher from a course’s page.")); return; }
      var since = Date.now() - 14 * 864e5, recent = {};
      d.events.forEach(function (e) { if (Number(e.at) >= since) recent[e.actorId] = (recent[e.actorId] || 0) + 1; });
      var cells = 0, dealt = 0;
      d.teachers.forEach(function (t) { cells += t.cells; dealt += t.dealt; });
      var behind = d.teachers.filter(function (t) { return t.cells && t.dealt / t.cells < .8; }).length;
      cxMetrics(v, [
        { label: "Teachers", value: d.teachers.length },
        { label: "Due work marked", value: cells ? Math.round(dealt / cells * 100) : null, unit: "%", line: cells ? dealt / cells * 100 : 0, note: "across the school" },
        { label: "Under 80% marked", value: behind, bad: true },
        { label: "Marks, last two weeks", value: Object.keys(recent).reduce(function (a, k) { return a + recent[k]; }, 0) }
      ]);
      var grid = el("div", "cx-grid");
      v.appendChild(grid);
      var ch = cxSection(grid, "cx-s12", "Marks entered", "last two weeks, by teacher");
      ch.appendChild(barChart(d.teachers.map(function (t) {
        var nm = String(t.name || "").split(" ");
        return { label: nm[0] + (nm[1] ? " " + nm[1][0] + "." : ""), title: t.name, n: recent[t.id] || 0, color: "var(--cx-bar)" };
      }), { values: true, wide: true }));
      if (d.capped) ch.appendChild(el("p", "cx-note", "Counted from each course’s latest " + HISTORY_LIMIT + " changes."));
      var tb = cxSection(grid, "cx-s12", "Teachers", "");
      var t = cnTable([{ label: "Teacher", w: "minmax(170px, 1.3fr)" }, { label: "Courses", w: "70px", align: "right" }, { label: "Students", w: "76px", align: "right" },
                       { label: "Average", w: "76px", align: "right" }, { label: "Below", w: "64px", align: "right" }, { label: "Marked", w: "72px", align: "right" },
                       { label: "To mark", w: "70px", align: "right" }, { label: "Missing", w: "70px", align: "right" }, { label: "Last marked", w: "104px", align: "right" }]);
      d.teachers.forEach(function (tt) {
        var sum = 0, g = 0, below = 0, missing = 0, dl = 0;
        tt.courses.forEach(function (c) { sum += c.sum; g += c.graded; below += c.below; missing += c.missing; dl += c.dealt; });
        var a = g ? Math.round(sum / g) : null, p = tt.cells ? Math.round(tt.dealt / tt.cells * 100) : null;
        t.row([cxWho(tt), String(tt.courses.length), String(tt.students), cxPct(a, a != null && a < CX_PASS), below ? String(below) : cxNone(),
               p == null ? cxNone() : "<b class='cn-mk" + (p < 80 ? " warn" : "") + "'>" + p + "%</b>", tt.toMark ? "<b class='cn-mk warn'>" + tt.toMark + "</b>" : cxNone(),
               dl ? Math.round(missing / dl * 100) + "%" : cxNone(), tt.last ? esc(whenName(tt.last)) : cxNone("never")],
              function () { S.staffPick = tt.id; openAdmin(false, "staff"); }, tt.id);
      });
      tb.appendChild(t);
      tb.appendChild(el("p", "cx-note", "Missing is the share of recorded due work marked missing in their courses."));
    }, function (e) { failed(node, e, function () { openAdmin(true, "teacher-analytics"); }); });
  }

  /* ======================================================= Student Support */
  function tabSupport(v) {
    cxPage(v, null, "Student Support",
      "Students who may need someone to step in — below a pass, missing work, or slipping — and the support plans on their records.");
    var node = loading(v, "students");
    loadSchool().then(function (d) {
      node.remove();
      var slip = {};
      growthRows(d).forEach(function (r) { if (r.change <= -10) (slip[r.s.id] = slip[r.s.id] || []).push(r.course.title); });
      var flagged = d.students.map(function (s) {
        var f = [];
        var low = s.courses.filter(function (c) { return c.grade && c.grade.percent < CX_PASS; });
        if (low.length) f.push({ k: "low", t: "Below a pass in " + low.map(function (c) { return c.title; }).join(", ") });
        if (s.missing >= 2) f.push({ k: "missing", t: s.missing + " missing" });
        if (slip[s.id]) f.push({ k: "slip", t: "Slipping in " + slip[s.id].join(", ") });
        return { s: s, f: f };
      }).filter(function (x) { return x.f.length; }).sort(function (a, b) { return b.f.length - a.f.length || (a.s.standing || 0) - (b.s.standing || 0); });
      var count = function (k) { return flagged.filter(function (x) { return x.f.some(function (f) { return f.k === k; }); }).length; };
      var metrics = cxMetrics(v, [
        { label: "Need a look", value: flagged.length, bad: true },
        { label: "Below a pass", value: count("low") },
        { label: "Two or more missing", value: count("missing") },
        { label: "Slipping", value: count("slip"), note: "10 points or more" },
        { label: "Support plans", value: "…", note: "IEP or supports on record" }
      ]);
      var tick = readingNote(v, "student records");
      var slot = el("div");
      v.appendChild(slot);
      function draw(F) {
        slot.innerHTML = "";
        if (!flagged.length) { slot.appendChild(cnEmpty("Nobody is flagged.", "Nobody is below a pass, missing two or more pieces of work, or slipping.")); return; }
        var t = cnTable([{ label: "Student", w: "minmax(160px, 1fr)" }, { label: "Standing", w: "84px", align: "right" }, { label: "Why", w: "minmax(240px, 2.2fr)" },
                         { label: "Plan", w: "96px" }]);
        flagged.forEach(function (x) {
          var r = F && F[x.s.id] && F[x.s.id].records || {};
          var plan = [r.iep ? "IEP" : "", r.supports ? "Supports" : ""].filter(Boolean).join(", ");
          t.row([cxWho(x.s), cxPct(x.s.standing, x.s.standing != null && x.s.standing < CX_PASS), esc(x.f.map(function (f) { return f.t; }).join(" · ")),
                 F ? (plan ? esc(plan) : cxNone("none")) : cxNone("…")], function () { openStudent360(x.s); }, x.s.id);
        });
        slot.appendChild(t);
      }
      draw(null);
      readFamilies(d.students, tick).then(function (F) {
        var plans = d.students.filter(function (s) { var r = F[s.id] && F[s.id].records || {}; return r.iep || r.supports; }).length;
        var b = metrics.children[4].querySelector("b");
        if (b) b.textContent = String(plans);
        draw(F);
        var box = el("div", "cx-soon");
        box.style.marginTop = "40px";
        box.innerHTML = "<h3>Interventions are not tracked yet</h3><p>Tiers, meetings, who is responsible and whether it worked need their own records. " +
          "Today a plan can be written in the IEP or Supports section of a student’s record, and it shows here.</p>";
        v.appendChild(box);
      });
    }, function (e) { failed(node, e, function () { openAdmin(true, "support"); }); });
  }

  /* ============================================ Places not set up yet */
  function tabScheduling(v) {
    soonPage(v, null, "Scheduling", "Periods, sections, rooms and the master schedule.",
      ["The bell schedule and its periods", "Sections of each course, with a room and a teacher", "Each student’s timetable", "Conflicts, before they happen"],
      "Courses exist, but they are not placed in periods or rooms yet, so there is no timetable to build from.",
      [["Enrollment", function () { openAdmin(false, "enrollment"); }], ["Curriculum", function () { openAdmin(false, "curriculum"); }]]);
  }
  function tabAttendance(v) {
    soonPage(v, null, "Attendance", "Taking attendance, and seeing it.",
      ["Attendance taken by period or by day", "Absences, lateness and excuses, with who recorded them", "Chronic absence, early", "A family told the same day"],
      "Attendance needs the timetable first — a period to be present in — which Scheduling does not have yet. A summary can already be written in the Attendance section of a student’s record.",
      [["Records", function () { openAdmin(false, "records"); }]]);
  }
  function tabBehavior(v) {
    soonPage(v, null, "Behavior", "Incidents, recognition and follow-up.",
      ["Incidents, with what happened, where and who was involved", "Recognition, not only referrals", "Consequences and follow-up, and who owns each", "Patterns over time"],
      "The platform keeps no behaviour records yet. It will need its own permissions — who may write one, and what a family sees — before it keeps any.",
      [["Student Support", function () { openAdmin(false, "support"); }]]);
  }
  function tabInventory(v) {
    soonPage(v, "School Operations", "Inventory", "The school’s things: devices, textbooks, equipment.",
      ["Devices and textbooks, with who has each", "Checking out and returning", "What is lost, damaged or due back"],
      "Not recorded in the platform yet.", null);
  }
  function tabLockers(v) {
    soonPage(v, "School Operations", "Lockers", "Who has which locker.",
      ["Lockers by building and floor", "Assigning a student, and their combination kept private", "Clearing them all at the end of the year"],
      "Not recorded in the platform yet.", null);
  }
  function tabCafeteria(v) {
    soonPage(v, "School Operations", "Cafeteria", "Meals, menus and eligibility.",
      ["Menus", "Meal eligibility, kept private", "Balances and a family’s top-ups"],
      "Not recorded in the platform yet. Meal eligibility is sensitive and would need its own access rules first.", null);
  }
  function tabSis(v) {
    soonPage(v, "Data Center", "SIS Sync", "Keeping OEdu in step with another student information system.",
      ["Students, staff, courses and sections synced from the system of record", "Clever and OneRoster", "A log of each sync: what changed, what failed"],
      "Nothing is connected. OEdu is the system of record for everything on this console today.",
      [["Exports", function () { openAdmin(false, "data"); }]]);
  }
  function tabImports(v) {
    soonPage(v, "Data Center", "Imports", "Bringing people, rosters and records in from a file.",
      ["People and their roles, from a spreadsheet", "Rosters: who is in which course", "Checked before anything is written, with every row that would fail named"],
      "Bulk import is not built yet — it waits on sign-in invitations, so nobody’s password is ever typed into a spreadsheet. " +
      "What can be brought in today: people one at a time, and a student’s previous-school transcript from their diploma record.",
      [["Add a person", function () { openPersonEditor(null); }], ["Transcripts", function () { openAdmin(false, "transcripts"); }]]);
  }
  function tabSftp(v) {
    soonPage(v, "Data Center", "SFTP", "Files sent to and from other systems on a schedule.",
      ["Nightly exports to a district or vendor server", "Incoming files picked up and imported", "Keys, not passwords, and a log of every transfer"],
      "Not connected. Every export today is a file downloaded from Exports.",
      [["Exports", function () { openAdmin(false, "data"); }]]);
  }
  function tabStateReporting(v) {
    soonPage(v, null, "State Reporting", "The reports a school owes its state.",
      ["Enrollment, attendance and assessment extracts in the state’s format — for New York, SIRS", "Checked for errors before they are sent", "What was sent, when, and by whom"],
      "Not set up. State extracts need attendance and scheduling, which are not built yet, and each state’s own format.",
      [["Exports", function () { openAdmin(false, "data"); }]]);
  }

  /* The API everything on this console is read through, and whether it is up. */
  function tabApi(v) {
    consoleHead(v, "Data Center", "API", "Everything on this console is read through the Oplo API, with your session and your permissions — nothing else.");
    var box = el("div", "cx-set");
    function row(label, value, note) {
      var r = el("div", "cx-setrow cx-setrow2", '<span class="t"><b>' + esc(label) + "</b>" + (note ? "<span>" + esc(note) + "</span>" : "") + '</span><span class="v">' + value + "</span>");
      box.appendChild(r);
      return r;
    }
    var status = row("Status", '<span class="cn-none">Checking…</span>');
    row("Address", "<span class='cn-mono'>" + esc(API.base()) + "</span>");
    row("Version", "v1", "Versioned in the path; a new version would sit beside it, not replace it.");
    row("Sign-in", "Session cookie", "HttpOnly, set by the server. No API keys are issued yet.");
    v.appendChild(box);
    var t0 = Date.now();
    API.health().then(function (ok) {
      status.querySelector(".v").innerHTML = ok ? '<span class="cx-dot"></span>Online · ' + (Date.now() - t0) + " ms" : '<span class="cx-dot off"></span>Not reachable';
    });
    v.appendChild(el("p", "cx-sethead", "What it serves"));
    var t = cnTable([{ label: "Path", w: "minmax(220px, 1.2fr)" }, { label: "What", w: "minmax(220px, 1.6fr)" }]);
    [["/accounts", "People, their profiles and roles"], ["/courses", "Courses, members, work"], ["/courses/{id}/gradebook", "A course’s gradebook: students, work, marks, grades"],
     ["/grades · /grades/history", "Marks, and every change to one"], ["/students/{id}/report", "A student’s report card"], ["/graduation", "A student’s diploma record"],
     ["/students/{id}/guardians · /records", "A student’s family and school record"], ["/progress", "A student’s own lesson progress"], ["/auth/sessions", "Where an account is signed in"]]
      .forEach(function (x, k) { t.row(["<span class='cn-mono'>" + esc(x[0]) + "</span>", esc(x[1])], null, String(k)); });
    v.appendChild(t);
    var soon = el("div", "cx-soon");
    soon.style.marginTop = "40px";
    soon.innerHTML = "<h3>Not set up yet</h3><p>Keys for other systems to call the API on the school’s behalf, and webhooks that tell them when something changes.</p>";
    v.appendChild(soon);
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
     The people, across every course, with the comparison a teacher is actually
     making visible in one screen. Selecting somebody fills the inspector; it
     does not take the list away. */
  function tabStudents(v) {
    if (consoleMode() === "admin") consoleHead(v, "Students", "Student 360",
      "Every student in the school, once. Open one to see all of them — grades and why, " +
      "missing work, what changed, their diploma and their family.");
    else consoleHead(v, "Teaching", "Students",
      "Everyone you teach, once. A student in three of your courses is one " +
      "row with three grades on it, not three rows.");

    var node = loading(v, "your students");
    (consoleMode() === "admin" ? loadSchool() : API.reporting.students()).then(function (data) {
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
                "their standing in every course you share with them.",
                "Enrol students", function () { openEnrol(mine[0]); })
            : cnEmpty("Nobody is enrolled yet.",
                "Students are enrolled on a course, so there needs to be one first.",
                S.me.role === "admin" ? "Explore courses" : null,
                S.me.role === "admin" ? openCatalogue : null));
        }, function () {
          v.appendChild(cnEmpty("Nobody is enrolled yet.",
            "Enrol students into a course and they appear here."));
        });
        return;
      }

      var filters = [
        { k: "all", name: "Everyone", n: data.students.length },
        { k: "low", name: "Below a pass", n: data.totals.belowPass },
        { k: "missing", name: "Missing work",
          n: data.students.filter(function (s) { return s.missing > 0; }).length },
        { k: "unmarked", name: consoleMode() === "admin" ? "Waiting to be marked" : "Waiting on me",
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
    var box = el("div", "cn-insp cx-insp");

    var head = el("header", "cx-ihead");
    head.innerHTML = avatarHtml(s) + '<div class="t"><b>' + esc(s.name) + "</b><span>" + esc(s.email || "") + "</span></div>";
    box.appendChild(head);

    // Where they stand: one ring for the mean of their course grades, and
    // the two counts that say what to do about it.
    var hero = el("div", "cx-ihero");
    var pct = s.standing;
    hero.innerHTML = '<div class="ring">' + miniRing(pct).replace('class="cx-mring"', 'class="cx-mring big"') +
      "<b>" + (pct == null ? "—" : pct + "<small>%</small>") + "</b></div>" +
      '<div class="stats"><div><b>' + s.courses.length + "</b><span>" + (s.courses.length === 1 ? "Course" : "Courses") + "</span></div>" +
      '<div><b style="color:' + (s.missing ? "var(--cx-orange)" : "var(--cx-label)") + '">' + (s.missing || 0) + "</b><span>Missing</span></div>" +
      '<div><b>' + (s.unmarked || 0) + "</b><span>Unmarked</span></div></div>";
    box.appendChild(hero);
    box.appendChild(el("p", "cx-note", pct == null ? "Nothing marked yet." :
      "The mean of their course grades — " + (pct >= CX_PASS ? "at or above" : "below") + " the " + CX_PASS + "% pass line."));

    var list = el("div", "cx-ilist");
    s.courses.forEach(function (c) {
      var g = c.grade, p = g ? g.percent : null;
      var col = p == null ? "var(--cx-gray)" : p >= 80 ? "var(--cx-green)" : p >= CX_PASS ? "var(--cx-teal)" : p >= 60 ? "var(--cx-orange)" : "var(--cx-red)";
      var r = el("button", "cx-irow");
      r.type = "button";
      r.innerHTML = '<span class="t"><b>' + esc(c.title) + "</b><span>" + esc(c.subject || "") +
        (c.missing ? ' · <em>' + c.missing + " missing</em>" : "") + "</span></span>" +
        '<span class="bar"><i style="width:' + (p == null ? 0 : Math.max(2, Math.min(100, p))) + "%;background:" + col + '"></i></span>' +
        '<span class="g"><b>' + (g ? esc(g.letter || "") : "—") + "</b><span>" + (p == null ? "" : p + "%") + "</span></span>";
      r.addEventListener("click", function () { S.courseId = c.courseId; openAdmin(false, "roster"); });
      list.appendChild(r);
    });
    box.appendChild(list);

    if (s.unmarked) {
      box.appendChild(el("p", "cx-note",
        s.unmarked + (s.unmarked === 1 ? " piece" : " pieces") +
        " of their work is waiting to be marked. Their grade is computed over what has been " +
        "marked, so it will move when it is."));
    }

    var acts = cnActions();
    if (consoleMode() === "admin") acts.appendChild(cnAction("Student 360", function () { openStudent360(s); }, true));
    acts.appendChild(cnAction("Open their report", function () { openReport(s); }, consoleMode() !== "admin"));
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
    var admin = consoleMode() === "admin";
    if (admin) consoleHead(v, null, "Audit Log",
      "Every change to a mark across the school — before, after, who and when. Any change can be put back; " +
      "putting it back is recorded here as a change of its own, so nothing is ever erased.");
    else consoleHead(v, "Records", "Activity",
      "Every change to a mark in your courses. Not a log of what anybody looked " +
      "at — only the things that change what a student's grade says.");

    var node = loading(v, "what happened");
    (admin ? loadSchool(true).then(function (d) { return d.events.slice(0, 150); })
           : API.reporting.activity(80)).then(function (events) {
      node.remove();
      if (!events.length) {
        v.appendChild(cnEmpty("Nothing has been marked yet.",
          "Changes to marks appear here as they are made, with who made them."));
        return;
      }

      var cols = [
        { label: "Student", w: "minmax(140px, 1fr)" },
        { label: "Work", w: "minmax(140px, 1.2fr)" },
        { label: "Change", w: "140px" },
        { label: "By", w: "minmax(110px, .8fr)" },
        { label: "When", w: "120px", align: "right" }
      ];
      if (admin) cols.push({ label: "", w: "80px", align: "right" });
      var t = cnTable(cols);
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
        var cells = [
          who,
          "<b>" + esc(e.title) + "</b><span class='cn-sub2'>" + esc(e.courseTitle) + "</span>",
          "<span class='cn-change'><i>" + esc(was) + "</i>→<b>" + esc(now) + "</b></span>",
          esc(e.actorName || "—"),
          esc(whenName(e.at))
        ];
        if (admin) {
          var back = was === "entered" ? "unmarked" : was;
          var u = el("button", "cn-btn small", "Undo");
          u.type = "button";
          u.title = "Put this mark back to " + back;
          u.addEventListener("click", function () {
            if (!confirm("Put " + (e.student.name || "this student") + "’s " + e.title + " back to " + back + "?\n\nThe undo is recorded in this log as a change of its own.")) return;
            u.disabled = true;
            attempt(API.grades.undo(e.id), function () { toast("Put back. The undo is in the log."); SCHOOL = null; openAdmin(true, "activity"); })
              .then(function () { u.disabled = false; });
          });
          cells.push(u);
        }
        t.row(cells, null, e.id);
      });
      v.appendChild(t);
    }, function (e) { failed(node, e, function () { openAdmin(true, "activity"); }); });
  }

  /* -------------------------------------------------------------- Courses */
  /* A subject's colour and picture, for course cards. */
  var CX_SUBJECT = {
    mathematics: ["var(--cx-accent)", '<path d="M17 5H7l5.5 7L7 19h10"/>'],
    science: ["var(--cx-green)", '<path d="M9 3.5h6M10 3.5v6L4.8 18.6A1.5 1.5 0 0 0 6.1 21h11.8a1.5 1.5 0 0 0 1.3-2.4L14 9.5v-6"/><path d="M7.5 15h9"/>'],
    business: ["var(--cx-orange)", '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17"/>'],
    humanities: ["var(--cx-purple)", '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17"/>'],
    "test prep": ["var(--cx-pink)", '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>'],
    english: ["var(--cx-indigo)", '<path d="M4 5.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4zM20 5.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"/>']
  };
  function subjectLook(subject) {
    var k = String(subject || "").toLowerCase();
    return CX_SUBJECT[k] || ["var(--cx-teal)", CX_ICONS.books];
  }

  /* --------------------------------------------------------------- Courses
     Every course as a card: its subject, who teaches it, how many are in it,
     where the class stands and how its grades spread — or, for somebody
     comparing thirty of them, the table. */
  function tabCourses(v) {
    var top = el("div", "cx-top");
    if (consoleMode() === "admin") consoleHead(top, null, "Curriculum",
      "The school’s courses, and the curriculum Oplo has written that a new course can start from — its units and " +
      "grading scheme come with it.");
    else consoleHead(top, "Academics", "Courses",
      "The courses that carry enrolment, work and grades. The catalogue students browse is the " +
      "shipped curriculum — published content in the site's files, not rows in the database.");
    var tools = el("div", "cx-tools");
    top.appendChild(tools);
    v.appendChild(top);

    var node = loading(v, "courses");
    (consoleMode() === "admin"
      ? loadSchool().then(function (d) { return [d.courses.map(function (c) { return c.raw; }), { courses: d.courses }, { students: d.students }]; })
      : Promise.all([API.courses.mine().then(function (cs) {
            return cs.filter(function (c) { return c.myRole === "teacher" || c.myRole === "assistant"; });
          }), API.reporting.teaching().catch(function () { return { courses: [] }; }),
          API.reporting.students().catch(function () { return { students: [] }; })])).then(function (out) {
      var courses = out[0], stats = {}, dist = {};
      out[1].courses.forEach(function (c) { stats[c.id] = c; });
      (out[2].students || []).forEach(function (s) {
        (s.courses || []).forEach(function (c) {
          if (!c.grade || !c.grade.letter) return;
          var L = String(c.grade.letter).charAt(0).toUpperCase();
          dist[c.courseId] = dist[c.courseId] || { A: 0, B: 0, C: 0, D: 0, F: 0 };
          dist[c.courseId][L === "E" ? "F" : L] = (dist[c.courseId][L === "E" ? "F" : L] || 0) + 1;
        });
      });
      node.remove();

      var seg = el("div", "cn-seg");
      S.courseView = S.courseView || "cards";
      [["cards", "Cards"], ["list", "List"]].forEach(function (x) {
        var b = el("button", "cn-segb" + (S.courseView === x[0] ? " on" : ""), x[1]);
        b.type = "button";
        b.addEventListener("click", function () { S.courseView = x[0]; openAdmin(true, S.tab); });
        seg.appendChild(b);
      });
      tools.appendChild(seg);
      tools.appendChild(cnAction(consoleMode() === "admin" ? "Oplo catalogue" : "Explore courses", openCatalogue));
      tools.appendChild(cnAction("Create from curriculum", function () { openCourseEditor(null, "biology"); }));
      tools.appendChild(cnAction("New course", function () { openCourseEditor(null); }, true));

      if (!courses.length) {
        v.appendChild(cnEmpty("No courses yet.",
          "Start from a course Oplo has already written, or create your own from nothing.",
          "Explore courses", openCatalogue));
        return;
      }

      if (S.courseView === "list") {
        var t = cnTable([
          { label: "Course", w: "minmax(180px, 1.4fr)" },
          { label: "Subject", w: "minmax(110px, .8fr)" },
          { label: "Students", w: "84px", align: "right" },
          { label: "Average", w: "84px", align: "right" },
          { label: "You are", w: "90px" },
          { label: "Status", w: "94px", align: "right" }
        ]);
        courses.forEach(function (c) {
          var st = stats[c.id] || {};
          t.row([
            "<b>" + esc(c.title) + "</b>",
            esc(c.subject || "—"),
            st.students == null ? "<span class='cn-none'>—</span>" : String(st.students),
            st.average == null ? "<span class='cn-none'>—</span>" : "<b class='cn-mk" + (st.average < CX_PASS ? " bad" : "") + "'>" + st.average + "%</b>",
            c.myRole ? esc(c.myRole) : "<span class='cn-none'>—</span>",
            "<span class='cn-tag" + (c.status === "published" ? " on" : "") + "'>" + esc(c.status) + "</span>"
          ], function () { openCoursePage(c); }, c.id);
        });
        v.appendChild(t);
        return;
      }

      var grid = el("div", "cx-cgrid");
      v.appendChild(grid);
      courses.forEach(function (c, k) {
        var st = stats[c.id] || {}, look = subjectLook(c.subject), ds = dist[c.id];
        var b = el("button", "cx-card cx-course");
        b.type = "button";
        b.style.setProperty("--i", k);
        b.style.setProperty("--c", look[0]);
        var bands = ds ? [["A", "var(--cx-green)"], ["B", "var(--cx-teal)"], ["C", "var(--cx-yellow)"], ["D", "var(--cx-orange)"], ["F", "var(--cx-red)"]]
          .map(function (x) { return ds[x[0]] ? '<i style="flex:' + ds[x[0]] + ";background:" + x[1] + '" title="' + x[0] + ": " + ds[x[0]] + '"></i>' : ""; }).join("") : "";
        b.innerHTML =
          '<div class="band"><small>' + esc(c.subject || "Course") + "</small>" +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + look[1] + "</svg></div>" +
          '<div class="body"><div><h4>' + esc(c.title) + '</h4><div class="who" data-who></div></div>' +
            '<div class="nums"><div><b>' + (st.students == null ? "—" : st.students) + "</b><span>Students</span></div>" +
              '<div><b style="color:' + (st.average != null && st.average < CX_PASS ? "var(--cx-red)" : "var(--cx-label)") + '">' + (st.average == null ? "—" : st.average + "%") + "</b><span>Average</span></div>" +
              "<div><b>" + (st.atRisk == null ? "—" : st.atRisk) + "</b><span>Below a pass</span></div></div>" +
            '<div class="cx-dist" role="img" aria-label="Grade spread">' + bands + "</div>" +
            '<div style="display:flex;gap:6px;align-items:center"><span class="cx-pill ' + (c.status === "published" ? "green" : "") + '">' + esc(c.status) + "</span>" +
              (c.myRole ? '<span class="cx-pill blue">you: ' + esc(c.myRole) + "</span>" : "") +
              (st.overdue ? '<span class="cx-pill red">' + st.overdue + " past due</span>" : "") + "</div></div>";
        b.addEventListener("click", function () { openCoursePage(c); });
        grid.appendChild(b);
        // Who teaches it, when the roster arrives.
        API.courses.members(c.id).then(function (mem) {
          var t = mem.filter(function (m) { return m.role === "teacher"; }).map(function (m) { return m.name; });
          var w = b.querySelector("[data-who]");
          if (w) w.textContent = t.length ? t.join(", ") : "No teacher yet";
        }, function () { /* the card stands without it */ });
      });
    }, function (e) { failed(node, e, function () { openAdmin(true, S.tab); }); });
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
      tile("Course average", avg == null ? "—" : avg + "%");
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
          "The course numbers are missing because you do not teach it — you " +
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
      }).then(unteachIfAdmin).then(function (made) {
        toast("“" + made.title + "” created." + (consoleMode() === "admin" ? " Assign its teacher from its page." : " You are its teacher."));
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

  function openCourseEditor(c, curriculum) {
    var making = !c;
    enter("course-edit:" + (c ? c.id : "new"), making ? "New course" : trim(c.title),
          function () { openCourseEditor(c, curriculum); });
    var v = $("#v-admin");
    v.innerHTML = "";
    consoleHead(v, making ? "New course" : "Course",
      making ? "Create a course" : c.title);

    var body = (c && c.body) || {};
    var isBio = curriculum === "biology";

    /* Back button */
    if (!making) {
      var back = el("button", "cn-back");
      back.type = "button";
      back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;"><path d="M5 12h14"/><path d="m12 5-7 7 7 7"/></svg> Back to Courses';
      back.addEventListener("click", function () { openAdmin(false, "courses"); });
      v.appendChild(back);
    }

    /* Pre-populated Biology curriculum */
    if (isBio && making) {
      title.value = "Biology";
      subject.value = "Biology";
      level.value = "High School";
      summary.value = "Unit 1: Ecology and Natural Systems — how biotic and abiotic factors interact to shape Earth's natural systems, influence the distribution of life, affect population dynamics, and drive species interactions.";
      standards.value = "HS-LS2-1\nHS-LS2-2\nHS-LS2-6\nHS-ESS2-7";
      dcis.value = "HS-LS2.A.1\nHS-LS2.C.1\nHS-ESS2.E.1";
      practices.value = "Developing and using models\nConstructing explanations and designing solutions\nEngaging in argument from evidence";
      cccs.value = "Patterns\nCause and effect\nSystems and system models\nStability and change";
      units.value = "Unit 1: Ecology and Natural Systems";
      unitPromise.value = "Everything in an ecosystem is connected. A change in temperature can change where a species lives. A change in food can change population size. A change in one species can affect many others.";
      bigQuestion.value = "How does life interact with the world around it?";
      unitObjectives.value = "identify the living and nonliving factors that shape ecosystems\nexplain how organisms are organized from populations to the biosphere\nuse data to identify patterns in biodiversity\nexplain how environmental conditions shape where organisms can live\ndistinguish between fundamental and realized niches\nanalyze population growth and carrying capacity\nexplain how competition and other species interactions affect populations\nuse evidence to explain how ecosystems change\napply ecological ideas to real-world problems";
      unitMap.value = "01 — How Is Life Organized?\n02 — Why Does Life Live Where It Does?\n03 — What Does an Organism Need to Survive?\n04 — How Big Can a Population Get?\n05 — Can We Predict Population Change?\n06 — How Do Species Shape Each Other?";
      lessons.value = "Lesson 1: How Is Life Organized?\nLesson 2: Why Does Life Live Where It Does?\nLesson 3: What Does an Organism Need to Survive?\nLesson 4: How Big Can a Population Get?\nLesson 5: Investigation — Human-Shark Interactions\nLesson 6: How Do Species Shape Each Other?";
      phenomena.value = "Bald Eagle: How do biologists know whether a population is changing?\nMonarch Butterfly: Why do monarch butterflies migrate so far?";
      handsOn.value = "Why are human-shark interactions increasing around Cape Cod?";
      misconceptions.value = 'A niche is just a habitat.\nPopulations cannot exceed their carrying capacity.\nMore individuals always means higher density.\nCompetition always means fighting.';
      title.input.disabled = true;
      subject.input.disabled = true;
      level.input.disabled = true;
    }

    var form = el("div", "admin-form");
    var code = field("Code", c ? c.code : (isBio ? "biology-eco-1" : ""), "a short slug, e.g. biology");
    if (!making) code.input.disabled = true;
    var title = field("Title", c ? c.title : "Biology", "Biology");
    if (isBio && making) title.input.disabled = true;
    var subject = field("Subject", c ? c.subject : "Biology", "Biology");
    if (isBio && making) subject.input.disabled = true;
    var level = field("Level", c ? c.level : "High School", "High School");
    if (isBio && making) level.input.disabled = true;
    var summary = areaField("Summary", c ? c.summary : "", "What this course is, in a sentence.");
    var standards = areaField("Standards",
      c && c.body && c.body.standards ? c.body.standards.join("\n") : "",
      "One standard per line, e.g. HS-LS2-1");
    var grading = areaField("Grading",
      (body.grading || [["Quizzes", 35], ["Assignments", 35], ["Exams", 30]])
        .map(function (g) { return g[0] + " = " + g[1]; }).join("\n"),
      "One category per line, as Name = percent. They should add to 100.", 5);
    var units = areaField("Units", (body.units || []).join("\n"), "One unit per line.", 6);
    var dcis = areaField("Core Ideas",
      c && c.body && c.body.dcis ? c.body.dcis.join("\n") : "",
      "Disciplinary core ideas, one per line");
    var practices = areaField("Practices",
      c && c.body && c.body.practices ? c.body.practices.join("\n") : "",
      "Science and engineering practices, one per line");
    var cccs = areaField("Crosscutting Concepts",
      c && c.body && c.body.cccs ? c.body.cccs.join("\n") : "",
      "Crosscutting concepts, one per line");
    var unitPromise = areaField("Unit Promise",
      c && c.body && c.body.unitPromise ? c.body.unitPromise.join("\n") : "",
      "The core idea students should grasp by the end of the unit");
    var bigQuestion = field("Big Question",
      c && c.body && c.body.bigQuestion ? c.body.bigQuestion : "",
      "The driving question for the unit");
    var unitObjectives = areaField("Unit Objectives",
      c && c.body && c.body.unitObjectives ? c.body.unitObjectives.join("\n") : "",
      "What students will be able to do, one per line");
    var unitMap = areaField("Unit Map",
      c && c.body && c.body.unitMap ? c.body.unitMap.join("\n") : "",
      "Lesson sequence, one per line");
    var lessons = areaField("Lessons",
      c && c.body && c.body.lessons ? c.body.lessons.join("\n") : "",
      "One lesson per line. Format: Lesson N: Title");
    var phenomena = areaField("Phenomena",
      c && c.body && c.body.phenomena ? c.body.phenomena.join("\n") : "",
      "Each phenomenon, one per line");
    var handsOn = areaField("Hands-on Activity",
      c && c.body && c.body.handsOn ? c.body.handsOn.join("\n") : "",
      "Description of the hands-on investigation");
    var misconceptions = areaField("Common Misconceptions",
      c && c.body && c.body.misconceptions ? c.body.misconceptions.join("\n") : "",
      "One misconception per line");
    [code, title, subject, level, summary, standards, dcis, practices, cccs, units, unitPromise, bigQuestion, unitObjectives, unitMap, lessons, phenomena, handsOn, misconceptions, grading].forEach(function (f) {
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
          units: units.input.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean),
          lessons: lessons.input.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean),
          standards: standards.input.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean),
          dcis: dcis.input.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean),
          practices: practices.input.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean)
        }
      };
      if (!payload.title) { toast("A course needs a title."); return; }
      save.disabled = true;
      var go = making
        ? API.courses.create(Object.assign({ code: code.input.value.trim().toLowerCase(),
                                             orgId: S.me.orgId }, payload)).then(unteachIfAdmin)
        : API.courses.update(c.id, payload);
      attempt(go, function () {
        toast(making ? "Course created." : "Saved.");
        goBack();
      }).then(function () {
        save.disabled = false;
        if (making) {
          var newTitle = title.input.value.trim();
          openEnrolByCourseName(newTitle);
        }
      });
    });
    acts.appendChild(save);
    v.appendChild(acts);
    show("admin");
  }

  /* ----------------------------------------------------------- Study sets
     Written by teachers, studied by their students, stored in the database.

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
          { label: "Course", w: "minmax(140px, 1fr)" },
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

  /* ----------------------------------------------------------------- People
     Everyone with an account here, with what they are in the school — worked
     out from the courses they belong to, so it is what the record says rather
     than a label somebody typed. */
  function tabPeople(v) {
    var top = el("div", "cx-top");
    consoleHead(top, "Staff", "Permissions",
      "Who can do what. An administrator runs the whole school; a teacher, their own courses’ gradebooks; a student, their own work. " +
      "Roles belong to an Oplo Account, held per product, and every request is checked against them on the server.");
    var tools = el("div", "cx-tools");
    tools.appendChild(cnAction("Add a person", function () { openPersonEditor(null); }, true));
    top.appendChild(tools);
    v.appendChild(top);

    var node = loading(v, "people");
    // Who teaches and who studies, from the school's own course rosters.
    Promise.all([API.accounts.list(S.me.orgId), loadSchool()]).then(function (out) {
      return { people: out[0], school: out[1] };
    }).then(function (d) {
      node.remove();
      var role = {}, count = {};
      d.school.courses.forEach(function (c) {
        c.teachers.forEach(function (t) { role[t.id] = "teacher"; });
        ((c.book && c.book.students) || []).forEach(function (st) {
          if (!role[st.id]) role[st.id] = "student";
          count[st.id] = (count[st.id] || 0) + 1;
        });
      });
      if (S.me.role === "admin") role[S.me.id] = "admin";
      var people = d.people;
      if (!people.length) {
        v.appendChild(cnEmpty("No accounts in this organisation yet.",
          "Add a person and they can sign in to every Oplo product they are given a role in.",
          "Add a person", function () { openPersonEditor(null); }));
        return;
      }
      function kind(p) { return role[p.id] || "none"; }
      var n = { all: people.length, student: 0, teacher: 0, none: 0 };
      people.forEach(function (p) { var k = kind(p); if (k === "admin") k = "teacher"; n[k] = (n[k] || 0) + 1; });

      var bar = el("div", "cn-bar");
      S.peopleFilter = S.peopleFilter || "all";
      var chips = cnFilters([
        { k: "all", name: "Everyone", n: n.all }, { k: "student", name: "Students", n: n.student },
        { k: "teacher", name: "Staff", n: n.teacher }, { k: "none", name: "Not in a course", n: n.none }
      ], S.peopleFilter, function (k) { S.peopleFilter = k; draw(); });
      bar.appendChild(chips);
      var search = el("input", "cn-search");
      search.type = "search";
      search.placeholder = "Find a person";
      search.setAttribute("aria-label", "Find a person");
      search.value = S.peopleQuery || "";
      search.addEventListener("input", function () { S.peopleQuery = search.value; draw(); });
      bar.appendChild(search);
      v.appendChild(bar);
      var slot = el("div");
      v.appendChild(slot);

      function draw() {
        chips.mark(S.peopleFilter);
        slot.innerHTML = "";
        var q = String(S.peopleQuery || "").trim().toLowerCase();
        var rows = people.filter(function (p) {
          var k = kind(p);
          if (S.peopleFilter === "student" && k !== "student") return false;
          if (S.peopleFilter === "teacher" && k !== "teacher" && k !== "admin") return false;
          if (S.peopleFilter === "none" && k !== "none") return false;
          return !q || String(p.name).toLowerCase().indexOf(q) > -1 || String(p.email || "").toLowerCase().indexOf(q) > -1;
        });
        if (!rows.length) { slot.appendChild(cnEmpty("Nobody matches that.", "Clear the filter or the search to see everyone again.")); return; }
        var t = cnTable([
          { label: "Name", w: "minmax(170px, 1.2fr)" },
          { label: "Role", w: "110px" },
          { label: "Email", w: "minmax(180px, 1.3fr)" },
          { label: "Title", w: "minmax(110px, .8fr)" },
          { label: "", w: "150px", align: "right" }
        ]);
        rows.forEach(function (p) {
          var who = el("span", "cn-who");
          who.appendChild(avatarFor(p));
          who.appendChild(el("span", "nm", esc(p.name)));
          var k = kind(p);
          var label = { admin: "Administrator", teacher: "Teacher", student: count[p.id] ? "Student · " + count[p.id] : "Student", none: "No course" }[k];
          var both = el("span", "cn-rowacts");
          if (k === "student") {
            var fam = el("button", "cn-btn small", "Family");
            fam.type = "button";
            fam.addEventListener("click", function (e) {
              e.stopPropagation();
              var H = window.OPLO_HOME;
              window.open(H.pathFor(H.parse(location.pathname).root, "parent") + "?student=" + encodeURIComponent(p.id), "_blank", "noopener");
            });
            var rec = el("button", "cn-btn small", "Record");
            rec.type = "button";
            rec.addEventListener("click", function (e) { e.stopPropagation(); openRecord(p); });
            both.appendChild(fam);
            both.appendChild(rec);
          }
          t.row([who, '<span class="cx-role ' + k + '">' + esc(label) + "</span>",
            "<span class='cn-mono'>" + esc(p.email || "—") + "</span>",
            p.title ? esc(p.title) : "<span class='cn-none'>—</span>", both
          ], function () { openPersonEditor(p); }, p.id);
        });
        slot.appendChild(t);
      }
      draw();
      // The roles each account actually holds, read one by one and put in
      // place of the guess from the rosters as they arrive.
      cachedEach("roles", people, function (p) { return API.accounts.get(p.id); }).then(function (out) {
        people.forEach(function (p) {
          var rs = ((out[p.id] && out[p.id].roles) || []).map(function (r) { return r.role; });
          if (rs.indexOf("admin") > -1) role[p.id] = "admin";
          else if (rs.indexOf("teacher") > -1 && !role[p.id]) role[p.id] = "teacher";
        });
        draw();
      });
    }, function (e) { failed(node, e, function () { openAdmin(true, S.tab); }); });
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
    // A file can carry a previous school's transcript, EHS's own record of a
    // student already enrolled, or both — an EHS academic record has both.
    var hasTransfer = !!(data && data.source && Array.isArray(data.terms) && data.terms.length);
    var hasEhs = !!(data && data.ehs && Array.isArray(data.ehs.courses));
    if (!hasTransfer && !hasEhs) {
      where.appendChild(el("div", "lx-empty",
        "That file is not a record import: it needs a previous school's source and terms, an EHS record, or both."));
      return;
    }
    var courses = hasTransfer ? data.terms.reduce(function (n, t) { return n + (t.courses || []).length; }, 0) : 0;
    var exams = (data.exams || []).length;
    where.appendChild(el("p", "cn-sub",
      (hasTransfer
        ? "<b>" + esc(data.source.school || "Unnamed school") + "</b> · " + courses + " courses in " +
          data.terms.length + " terms · " + exams + " exams" +
          (data.source.status === "evaluated" ? " · evaluated by EHS" : "") +
          (data.source.printedOn ? " · printed " + esc(data.source.printedOn) : "")
        : "") +
      (hasEhs
        ? (hasTransfer ? " · " : "") + "<b>Excel High School</b> · " + data.ehs.courses.length + " courses" +
          (data.ehs.enrolledOn ? " · enrolled " + esc(data.ehs.enrolledOn) : "")
        : "") +
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
      var saved = { t: null, e: null };
      attempt(program
        .then(function () { return hasTransfer ? API.graduation.importTranscript(p.id, data) : null; })
        .then(function (r) {
          saved.t = r;
          return hasEhs ? API.graduation.putEhsRecord(p.id, data.ehs) : null;
        })
        .then(function (e) { saved.e = e; return saved; }),
        function () {
          toast("Imported " +
            (saved.t ? saved.t.courses + " courses and " + saved.t.exams + " exams from " + saved.t.school : "") +
            (saved.e ? (saved.t ? ", and " : "") + saved.e.courses + " EHS courses" : "") + ".");
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
     ["guardian", "Parent or guardian — a student's family"],
     ["admin", "Administrator — the whole school"]].forEach(function (r) {
      var o = el("option");
      o.value = r[0]; o.textContent = r[1];
      role.appendChild(o);
    });
    roleF.appendChild(role);

    var pw = field("Password", "");
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
    if (!making) {
      /* The person's roles, read rather than assumed. The select starts at the
         role they hold, so saving a name never quietly makes a parent a
         student; and a student's page gains their family. The anchor keeps a
         slow answer from landing on whatever screen came next. */
      var anchor = el("div");
      v.appendChild(anchor);
      API.accounts.get(p.id).then(function (a) {
        if (!anchor.isConnected) return;
        var learn = (a.roles || []).filter(function (r) { return r.product === "learn"; })
                                   .map(function (r) { return r.role; });
        var held = ["admin", "teacher", "author", "student", "guardian"]
          .filter(function (r) { return learn.indexOf(r) > -1; })[0];
        if (held) role.value = held;
        if (learn.indexOf("student") > -1) personFamily(anchor, p);
      }, function () { /* the editor works without them */ });
    }
    show("admin");
  }

  /* A student's family, from their page in People: who is linked, and a form
     to add a parent or guardian. Adding creates the guardian's Oplo Account on
     the server — or links the account an email already has, keeping its own
     password — and they sign in on the same page as everybody else and land on
     /parent/. Removing takes the link away, never the account. */
  function personFamily(host, p) {
    var first = p.firstName || p.name;
    var REL = { parent: "Parent", guardian: "Guardian", grandparent: "Grandparent",
                foster_parent: "Foster parent", relative: "Relative", other: "Other" };
    var box = el("section", "cn-family");
    box.appendChild(el("h2", null, "Family"));
    box.appendChild(el("p", "cn-sub", "Parents and guardians linked to " + esc(first) + ". Each signs in on the " +
      "same page as everybody else and lands on the family view, where they can read " + esc(first) +
      "'s record and change none of it."));
    var list = el("div");
    box.appendChild(list);
    host.appendChild(box);

    function draw(gs) {
      list.innerHTML = "";
      if (!gs.length) {
        list.appendChild(el("p", "cn-none", "Nobody is linked yet."));
        return;
      }
      var t = cnTable([
        { label: "Name", w: "minmax(160px, 1.2fr)" },
        { label: "Email", w: "minmax(170px, 1.3fr)" },
        { label: "Relationship", w: "minmax(110px, .8fr)" },
        { label: "", w: "90px", align: "right" }
      ]);
      gs.forEach(function (g) {
        var who = el("span", "cn-who");
        who.appendChild(avatarFor(g));
        who.appendChild(el("span", "nm", esc(g.name)));
        var rm = el("button", "cn-btn small", "Remove");
        rm.type = "button";
        rm.addEventListener("click", function () {
          if (!confirm("Remove " + g.name + " from " + first + "? Their account stays; they stop seeing this record.")) return;
          rm.disabled = true;
          API.family.removeGuardian(p.id, g.id).then(function (next) {
            toast(g.name + " is no longer linked to " + first + ".");
            draw(next);
          }, function (e) { rm.disabled = false; toast(e.message); });
        });
        var rel = [g.label, REL[g.relationship]].filter(function (x, i, all) { return x && all.indexOf(x) === i; });
        t.row([who, "<span class='cn-mono'>" + esc(g.email || "—") + "</span>",
               esc(rel.join(" · ")) + (g.primary ? " <span class='cn-none'>· primary</span>" : ""), rm]);
      });
      list.appendChild(t);
    }
    list.appendChild(el("p", "cn-none", "Reading the family…"));
    API.family.guardians(p.id).then(draw, function (e) {
      list.innerHTML = "";
      list.appendChild(el("p", "cn-none", esc(e.message)));
    });

    var acts = el("div", "admin-acts");
    var open = el("button", "lx-btn", "Add a parent or guardian");
    open.type = "button";
    var view = el("button", "lx-btn quiet", "Open the family view");
    view.type = "button";
    view.addEventListener("click", function () {
      var H = window.OPLO_HOME;
      window.open(H.pathFor(H.parse(location.pathname).root, "parent") + "?student=" + encodeURIComponent(p.id),
                  "_blank", "noopener");
    });
    acts.appendChild(open);
    acts.appendChild(view);
    box.appendChild(acts);

    var add = el("div", "cn-family-add");
    add.hidden = true;
    var form = el("div", "admin-form");
    var gName = field("Full name", "");
    var gEmail = field("Email", "");
    gEmail.input.type = "email";
    gEmail.input.autocapitalize = "none";
    var gPw = field("Password", "", "Leave empty if this email already has an account");
    gPw.input.type = "password";
    gPw.input.autocomplete = "new-password";
    var relF = el("label", "admin-field");
    relF.innerHTML = "<span>Relationship</span>";
    var relSel = el("select");
    Object.keys(REL).forEach(function (k) {
      var o = el("option");
      o.value = k;
      o.textContent = REL[k];
      relSel.appendChild(o);
    });
    relF.appendChild(relSel);
    var gLabel = field("Described as", "", "Father, Mother, Aunt…");
    var gDob = field("Date of birth", "");
    gDob.input.type = "date";
    var gCell = field("Cell phone", "", "Leave empty or write N/A");
    var gAlt = field("Alternate phone", "", "Leave empty or write N/A");
    var gAddr = field("Mailing address", "", "Leave empty or write N/A");
    [gName, gEmail, gPw, relF, gLabel, gDob, gCell, gAlt, gAddr].forEach(function (f) { form.appendChild(f); });
    add.appendChild(form);
    var prim = el("label", "cn-check", "<input type='checkbox' checked> <span>Primary guardian</span>");
    add.appendChild(prim);
    add.appendChild(el("p", "cn-sub",
      "The password is sent once, over HTTPS, and hashed on the server. It is never stored in this page, " +
      "and an account that already exists keeps the password its owner set."));
    var addActs = el("div", "admin-acts");
    var save = el("button", "lx-btn", "Add and link to " + esc(first));
    save.type = "button";
    var cancel = el("button", "lx-btn quiet", "Cancel");
    cancel.type = "button";
    addActs.appendChild(save);
    addActs.appendChild(cancel);
    add.appendChild(addActs);
    box.appendChild(add);

    open.addEventListener("click", function () {
      add.hidden = false;
      open.hidden = true;
      gName.input.focus();
    });
    cancel.addEventListener("click", function () {
      gPw.input.value = "";
      add.hidden = true;
      open.hidden = false;
    });
    save.addEventListener("click", function () {
      if (!gEmail.input.value.trim()) { toast("A guardian needs an email to sign in with."); return; }
      var body = {
        email: gEmail.input.value.trim(),
        name: gName.input.value.trim(),
        relationship: relSel.value,
        label: gLabel.input.value.trim(),
        primary: prim.querySelector("input").checked,
        contact: { dateOfBirth: gDob.input.value, cellPhone: gCell.input.value,
                   altPhone: gAlt.input.value, mailingAddress: gAddr.input.value }
      };
      if (gPw.input.value) body.password = gPw.input.value;
      save.disabled = true;
      API.family.addGuardian(p.id, body).then(function (next) {
        [gName, gEmail, gPw, gLabel, gDob, gCell, gAlt, gAddr].forEach(function (f) { f.input.value = ""; });
        add.hidden = true;
        open.hidden = false;
        toast((body.name || body.email) + " is linked to " + first + ". They sign in on the OEdu sign-in page.");
        draw(next);
      }, function (e) {
        gPw.input.value = "";
        toast(e.message || "That did not work.");
      }).then(function () { save.disabled = false; });
    });
  }

  /* ----------------------------------------------------------------- System
     How this console looks on this Mac, where the install stands, and what is
     actually enforced — as System Settings lays out a pane. */
  function tabSystem(v) {
    consoleHead(v, null, "Settings", "How this console looks on this Mac, and where the install stands.");

    function group(title) {
      if (title) v.appendChild(el("p", "cx-sethead", esc(title)));
      var g = el("div", "cx-set");
      v.appendChild(g);
      return g;
    }
    function row(g, icon, tone, title, sub, right) {
      var r = el("div", "cx-setrow");
      r.innerHTML = '<span class="ic" style="--c:' + tone + '">' + cxIcon(icon) + '</span><span class="t"><b>' + esc(title) + "</b>" +
        (sub ? "<span>" + esc(sub) + "</span>" : "") + "</span>";
      var v2 = el("span", "v");
      if (right && right.nodeType) v2.appendChild(right); else v2.innerHTML = right || "";
      r.appendChild(v2);
      g.appendChild(r);
      return r;
    }
    function segOf(options, cur, pick) {
      var seg = el("div", "cn-seg");
      options.forEach(function (o) {
        var b = el("button", "cn-segb" + (cur === o[0] ? " on" : ""), o[1]);
        b.type = "button";
        b.addEventListener("click", function () {
          pick(o[0]);
          [].forEach.call(seg.children, function (x) { x.classList.remove("on"); });
          b.classList.add("on");
        });
        seg.appendChild(b);
      });
      return seg;
    }

    var look = group("Appearance");
    row(look, "moon", "var(--cx-indigo)", "Appearance", "Light, dark, or whatever this Mac is set to. Kept on this device.",
      segOf([["light", "Light"], ["dark", "Dark"], ["auto", "Auto"]], currentAppearance(), applyAppearance));
    row(look, "rows", "var(--cx-accent)", "Rows", "How much fits on a screen. Marking hundreds of submissions wants more; planning a lesson wants fewer.",
      segOf([["comfortable", "Comfortable"], ["standard", "Standard"], ["dense", "Dense"]], currentDensity(), applyDensity));

    var plat = group("Platform");
    var api = row(plat, "server", "var(--cx-green)", "Platform API", API.base(), '<span class="cx-dot"></span><span>Checking…</span>');
    row(plat, "person", "var(--cx-accent)", "Identity", "One account across Oplo products. Sessions are HttpOnly cookies set by the server; this page cannot read them.", "Oplo Account");
    row(plat, "shield", "var(--cx-orange)", "Authorization", "Every permission is decided in the API. Hidden buttons are a courtesy, not a control.", "Server-side");
    API.health().then(function (up) {
      var s = api.querySelector(".v");
      s.innerHTML = up ? '<span class="cx-dot"></span><span>Answering</span>' : '<span class="cx-dot off"></span><span>Not answering</span>';
    });

    var data = group("Where things live");
    row(data, "table", "var(--cx-green)", "Grades", "Written by the teachers of a course, read by the student they belong to. Synchronised across devices.", "Database");
    row(data, "wave", "var(--cx-pink)", "Progress and XP", "Written by the student, priced by the server. This browser keeps a cache so the app works offline; the database is the truth.", "Database");
    row(data, "books", "var(--cx-indigo)", "Study sets", "Written by teachers, published to a course, and read by the students in it.", "Database");
    row(data, "doc", "var(--cx-purple)", "Course catalogue", "The Explore tab reads published content from the site's files. Database courses carry the enrolment and grades.", "Shipped in the site");
    row(data, "sparkle", "var(--cx-teal)", "Tutor", "Runs through Ollama on your own machine, if you have it. Nothing is sent to a server.", "Local model");

    var you = group("Your account");
    var r1 = el("div", "cx-setrow");
    var av = avatarFor(S.me);
    r1.appendChild(av);
    r1.appendChild(el("span", "t", "<b>" + esc(S.me.name) + "</b><span>" + esc(S.me.email) + "</span>"));
    var open = el("button", "cn-btn small", "Account");
    open.type = "button";
    open.addEventListener("click", function () { openAccount(); });
    var rv = el("span", "v");
    rv.appendChild(open);
    r1.appendChild(rv);
    you.appendChild(r1);
    (S.me.roles || []).forEach(function (r) {
      row(you, "key", "var(--cx-gray)", r.product + " · " + r.role, r.orgId ? "In " + (schoolName()) : "Across the platform", "");
    });
  }

  /* ================================================================== Auth
     Identity is the platform's, not this app's.

     What used to be here was a PBKDF2 verifier that ran in the browser
     against a salt and hash shipped inside data.js. It was honest about being
     a lock on a door rather than a safe, but it was still the wrong thing: a
     verifier that reaches the browser is a verifier an attacker can grind
     offline at their own pace, and an app that decides for itself who is
     signed in cannot enforce anything against a user with a console open.

     So it is gone. Sign-in happens at auth.oplocloud.com, in a tab of its own
     (auth/public/connect.js): the password is typed there, the server checks
     it, and the server sets an HttpOnly session cookie this file cannot read.
     The tab closes, this page refreshes, and the only question this app ever
     asks about identity is `who am I?` — and the answer comes from the server.

     One Oplo Account, not an OEdu account. The same session will carry
     a person into OMaps or OShopping, which is why none of this lives under
     an OEdu-specific name. */
  var Auth = (function () {
    function current() { return API.me(); }
    function close() { return API.logout().catch(function () { /* already gone */ }); }
    return { current: current, close: close };
  })();

  /* `who` is whatever /api/v1/me resolved the session cookie to. Nothing in
     this function may be reached without that having succeeded. */
  /* Something arrived from another device. The record was merged in place,
     so S.m, S.sets and the rest already hold it; only the copied primitives
     need refreshing, and whatever is on screen redrawn. Where a student is
     reading is not moved under them mid-page — it applies when the reader is
     next opened. */
  function adoptSynced(scopes) {
    if (!R) return;
    if (scopes.indexOf("record") > -1) {
      S.citeStyle = R.d.citeStyle || S.citeStyle;
      if (S.view !== "read") {
        S.readIx = R.d.readIx || 0;
        var ru = READERS[R.d.readUnit];
        if (ru && ru.sections.length) useReader(ru);
      }
    }
    Game.paint();
    if (S.view === "my") drawMy();
  }

  /* Saved, saving, or waiting for a connection — in words, because "is my
     work safe?" deserves an answer a student can read. */
  function paintSync() {
    var n = document.getElementById("acSync");
    if (!n) return;
    var st = S.syncState || {};
    var at = st.at ? new Date(st.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
    n.textContent =
      st.state === "saving"  ? "Saving your progress to your account…" :
      st.state === "offline" ? "You are offline. Your progress is kept on this device and saves to " +
                               "your account when the connection is back." :
      st.state === "error"   ? "Your latest progress has not reached your account yet. It is kept on " +
                               "this device and will be sent again." :
      st.state === "saved"   ? "Saved to your account, so it is the same on every device you sign in on." +
                               (at ? " Last saved at " + at + "." : "") :
      "Your progress saves to your account, so it is the same on every device you sign in on.";
  }

  /* The student side is dark (learn/obsidian.css). The page marks a
     /student/ address itself before anything is drawn; signing in at the
     root and signing out change the address without a new page, so they
     mark it here. */
  function setLook(mode) {
    if (mode === "student") document.documentElement.setAttribute("data-look", "obsidian");
    else document.documentElement.removeAttribute("data-look");
  }

  function boot(who) {
    /* Everybody signs in on this one page; where they belong is read from their
       roles (home.js) — /admin/, /teacher/, /student/, or the family view at
       /parent/. An address their roles allow is kept, a `next` they were sent
       with is honoured if it is one of those, and anything else sends them
       home. The app's own addresses are the same page, so moving between them
       changes the URL and not the document; the family view is another page. */
    var H = window.OPLO_HOME;
    var dest = H.destination(who.roles, location, new URLSearchParams(location.search).get("next"));
    if (!dest.stay) {
      if (dest.mode === "parent") { location.replace(dest.href); return; }
      history.replaceState(null, "", dest.href);
    }
    setLook(dest.mode);
    S.me = normaliseAccount(who);
    // The address is the hat: an administrator who opens /teacher/ sees the
    // console as a teacher does. Their roles allowed it, or they would not be here.
    S.me.role = dest.mode;
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
    if (window.OPLO_PROGRESS) window.OPLO_PROGRESS.setRecord(R);

    /* The record is written here first and kept in step with the account —
       and so is every set's concept state, through the one hook learn.js
       calls when it saves. The first pull runs below with the rest of what
       the server knows. */
    if (window.OPLO_SYNC && API) {
      Progress = window.OPLO_SYNC.create({
        api: API, record: R, store: ST, learn: L, personId: who.id,
        onChange: adoptSynced,
        onStatus: function (st) { S.syncState = st; paintSync(); }
      });
      R.subscribe(function () { if (Progress) Progress.dirty("record"); });
      L.Store.changed = function (setId) { if (Progress) Progress.dirty("set:" + setId); };
    }

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
    /* The six-section bar (index.html) has no Grades, Exams or Console tab.
       Each is set only if it is there: a tab missing from the bar must not
       stop the app from drawing, and it did — every sign-in and every reload
       died here and left the bar over an empty page. */
    var navAdmin = $("#navAdmin"), navGrades = $("#navGrades"), navExams = $("#navExams");
    if (navAdmin) {
      navAdmin.hidden = !allowedTabs().length;
      navAdmin.textContent = who.role === "admin" ? "Console" : "My students";
    }
    setEnrolledTabs();
    if (R.broken) {
      toast("This browser will not let the page store anything, so progress will not be kept.");
    }
    Ann.reset();

    if (staff) {
      openAdmin(true, S.tab || "today");
    } else {
      drawSubjectNav();
      /* The address is where they asked to be. A course that only the
         database knows about is not known yet, so an address naming one is
         tried again when enrolment arrives. */
      var asked = appRest();
      S.booting = true;
      if (!route(asked)) { home(); S.pendingRoute = asked; }
      S.booting = false;
      Room.presence();
      Room.fromLink();
      // A sitting that was running when the page went away comes straight back.
      if (window.OPLO_EXAM) window.OPLO_EXAM.resume(S.me, S.examAsked);
      S.examAsked = null;
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
      var pending = S.pendingRoute;
      S.pendingRoute = null;
      if (pending && S.here && S.here.key === "my" && route(pending)) return;
      setEnrolledTabs();
      if ((out[0] || out[1]) && S.view === "my") drawMy();
      if (out[0] && S.view === "classes") openClasses(true);
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
    if (window.OPLO_EXAM) window.OPLO_EXAM.close(true);   // saved first, then closed
    if (R) R.flush();                 // never leave the last few answers unwritten
    Sync.flushNow();
    if (Progress) { Progress.flushNow(); Progress.stop(); Progress = null; }
    L.Store.changed = null;
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
    ["#navAdmin", "#navClasses", "#navGrades", "#navExams"].forEach(function (id) {
      var tab = $(id);
      if (tab) tab.hidden = true;
    });
    $("#rankChip").hidden = true;
    $("#streak").textContent = "0";
    // Signed out, the page is the sign-in page again, at the address everybody
    // signs in at — not at the /admin/ or /student/ the last person left behind.
    history.replaceState(null, "", window.OPLO_HOME.parse(location.pathname).root);
    setLook(null);
    // Back to the welcome page from its top, with the sign-in panel closed —
    // it was left open by the sign-in that started this session.
    var gate = $("#gate"), panel = $("#ldSignin");
    if (panel) panel.hidden = true;
    gate.classList.remove("ld-locked", "ld-wait");
    gate.hidden = false;
    gate.scrollTop = 0;
    $("#gErr").textContent = "";
    noFoot(); progress(null);
  }

  (function gate() {
    var err = $("#gErr"), go = $("#gateGo");
    var Account = window.OploSignIn;

    /* Every "Sign in" on the welcome page, and the panel's button, come here.
       The password is never typed on this page: connect.js opens
       auth.oplocloud.com in a tab of its own, and when that tab says it is
       done this page refreshes and the question below is asked again. If the
       tab closes without saying — the message lost, or the person gave up —
       the server is asked which. */
    function signIn() {
      err.textContent = "";
      if (!Account) {
        err.innerHTML = "Cannot reach the Oplo Account service at " +
          "<code>auth.oplocloud.com</code>. Check your connection and reload.";
        return;
      }
      Account.open({
        verify: function () {
          return API.me().then(function () { return true; }, function () { return false; });
        }
      });
    }
    window.OEDU_SIGNIN = signIn;
    if (go) go.addEventListener("click", signIn);

    /* A session already open in this browser signs straight in — which is also
       how a sign-in in the Oplo Account tab arrives, after the refresh. The
       cookie is HttpOnly, so the only way to find out is to ask the server. */
    API.me().then(function (account) {
      boot(account);
      if (Account) Account.done();
    }).catch(function (e) {
      if (Account) Account.done();
      // Nobody is signed in, so the welcome page can be shown; until now it
      // stayed blank so a signed-in visitor never saw it on the way home.
      $("#gate").classList.remove("ld-wait");
      var panel = $("#ldSignin");
      if (e && e.code === "offline") {
        err.innerHTML = "Cannot reach the Oplo account service at <code>" +
          esc(API.base()) + "</code>.";
      }
      // The button is only focused when the sign-in panel is open; focusing
      // into a closed panel would scroll the welcome page to nowhere.
      if (panel && !panel.hidden && go) setTimeout(function () { go.focus(); }, 120);
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
      // The course of the unit being read, not Media Arts: the tutor was told
      // "Media Arts 4.2" about a Business section before a second course had a reader.
      var ruCourse = allCourses().filter(function (x) { return x.id === RU.course; })[0] || D.MEDIA;
      var c = { mastery: coursePct(ruCourse) };
      var sec = readSec();
      if (S.view === "read" && sec) { c.section = RU.courseTitle + " " + sec.n; c.title = sec.t; }
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
    if (Progress) Progress.flushNow();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      if (R) R.flush();
      Sync.flush();
      if (Progress) Progress.flush();
    } else if (Progress) {
      // Back to a tab that may have sat behind another device's session.
      Progress.maybePull();
    }
  });

  /* ---------------------------------------------------------------- Wiring */
  [].forEach.call(document.querySelectorAll("#topNav button"), function (b) {
    b.addEventListener("click", function () {
      markSubjectNav(null);
      noFoot(); progress(null);
      if (b.dataset.view === "my") home();
      else if (b.dataset.view === "classes") openClasses();
      else if (b.dataset.view === "own") openOwn();
      else if (b.dataset.view === "progress") openProgress();
      else if (b.dataset.view === "admin") openAdmin();
      else if (b.dataset.view === "grades") openGrades();
      else if (b.dataset.view === "exams") openExams();
      else explore();
    });
  });

  /* The browser's Back and Forward — including a swipe on a phone. */
  window.addEventListener("popstate", function (e) {
    if (!S.me) return;                         // the sign-in gate is showing
    var st = e.state || {};
    var pos = st.s === SESSION && typeof st.lx === "number" ? st.lx : null;
    var entry = pos != null ? TRAIL[pos] : null;
    var found = true;
    RESTORING = true;
    try {
      if (entry) {
        POS = pos;
        S.hist = entry.hist.slice();
        S.here = entry.here;
        entry.here.restore();
      } else {
        // An entry from before a reload: the address says where it was. An
        // address that names nothing goes home, and says so.
        S.hist = []; S.here = null;
        if (document.body.classList.contains("is-staff")) openAdmin(true, S.tab);
        else if (!route()) { home(); found = false; }
      }
    } finally { RESTORING = false; }
    if (!entry) {
      TRAIL = []; POS = -1;
      mark(false, document.body.classList.contains("is-staff") ? undefined : found ? appRest() : "");
    }
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
    if ((e.metaKey || e.ctrlKey) && e.key === "\\" && document.body.classList.contains("t-console")) {
      e.preventDefault();
      trToggle();
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

  /* New view navigation */
  window.OPLO_APP = {
    enter: enter,
    show: show,
    subjectPct: function (name) { return subjectPct(name); }
  };
})();
