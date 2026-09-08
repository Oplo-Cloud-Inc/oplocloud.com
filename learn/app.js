/* ==========================================================================
   Oplo Learn.

   Two halves that answer different questions. The course side — subjects,
   units, practice — asks "do you understand this?" The study side —
   flashcards, Learn, Match, Test — asks "do you know it cold?" Neither one
   substitutes for the other, which is why both are here.

   No backend, no storage, no network. Progress lives in memory for the
   length of the visit and is gone when the tab closes; the page says so.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.OPLO;
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

  /* ---------------------------------------------------------------- State */
  var S = {
    me: null,             // the signed-in student
    view: "my",
    stack: [],            // where Back goes, innermost last
    course: null, unit: null, unitIx: 0,
    setId: null, set: null,
    m: {},                // "courseId:unit" -> {u,p,r,a} as percentages
    sets: {},             // setId -> { level: {}, star: {}, best: null }
    mistakes: [],         // every wrong answer, kept and practisable
    doneToday: {},        // which planned steps have been finished
    p: {}                 // the practice run in flight
  };

  function setState(id) {
    if (!S.sets[id]) S.sets[id] = { level: {}, star: {}, best: null };
    return S.sets[id];
  }
  function setMastered(id) {
    var st = setState(id), n = 0;
    for (var k in st.level) if (st.level[k] >= 3) n++;
    return n;
  }

  /* ---------------------------------------------------------------- Icons */
  var I = {
    play:  '<path d="M8 5.5 18 12 8 18.5z"/>',
    cards: '<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 4h11a2 2 0 0 1 2 2v10"/>',
    learn: '<path d="M12 3 3 7.5l9 4.5 9-4.5z"/><path d="M6 10v5.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V10"/>',
    match: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    test:  '<path d="M6 3.5h8L18 7v13.5H6z"/><path d="M13.5 3.5V7H18"/><path d="M9 12.5h6M9 16h4"/>',
    doc:   '<path d="M6 3.5h8L18 7v13.5H6z"/><path d="M13.5 3.5V7H18"/><path d="M9 12h6M9 15.5h4"/>',
    chev:  '<path d="M9 5l6 6.5L9 18"/>',
    star:  '<path d="M12 3.5l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.9l6.1-.8z"/>'
  };
  function svg(d, stroke) {
    return '<svg viewBox="0 0 24 24" fill="' + (stroke ? "none" : "currentColor") + '" ' +
           'stroke="' + (stroke ? "currentColor" : "none") + '" stroke-width="1.7" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }

  /* --------------------------------------------------------------- Router */
  var LABEL = {
    my: "Home", explore: "Explore", subject: "Subject", course: "Course",
    unit: "Unit", set: "Study set", cards: "Flashcards", learn: "Learn",
    match: "Match", test: "Test", practice: "Practice", result: "Results",
    account: "Account", mistakes: "Mistake book"
  };

  function show(view, push) {
    if (push !== false && S.view !== view) S.stack.push(S.view);
    S.view = view;
    [].forEach.call(document.querySelectorAll(".lx-view"), function (v) {
      v.classList.toggle("on", v.id === "v-" + view);
    });
    var home = view === "my" || view === "explore";
    $("#back").hidden = home;
    if (!home) $("#backLabel").textContent = LABEL[S.stack[S.stack.length - 1]] || "Back";
    $("#subbar").hidden = !home && view !== "subject";
    $("#wrap").classList.toggle("wide", view === "match");
    [].forEach.call(document.querySelectorAll("#topNav button"), function (b) {
      b.setAttribute("aria-current", String(b.dataset.view === view));
    });
    window.scrollTo(0, 0);
  }

  function goBack() {
    // A result screen is not a place you navigate back through: the run that
    // produced it is over, so Back goes wherever the result points.
    if (S.view === "result" && S.resultBack) {
      S.stack.pop();
      var f = S.resultBack; S.resultBack = null; f();
      return;
    }
    var to = S.stack.pop() || "my";
    // Rebuild the destination rather than revealing a stale one.
    var draw = {
      my: drawMy, explore: drawExplore,
      subject: function () { openSubject(S.subject, false); },
      course: function () { openCourse(S.course, false); },
      unit: function () { openUnit(S.course, S.unitIx, false); },
      set: function () { openSet(S.setId, false); }
    }[to];
    if (draw) draw(); else show(to, false);
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
    var k = unitKey(c, n);
    if (!S.m[k]) S.m[k] = { u: 0, p: 0, r: 0, a: 0 };
    return S.m[k];
  }
  function offers(u) {
    return { u: !!u.play, p: !!u.play, r: !!u.set, a: !!u.set };
  }
  function raise(c, n, dim, pct) {
    var d = dims(c, n);
    if (pct > d[dim]) d[dim] = Math.round(pct);
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
  function slip(kind, key, title, note) {
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
      mb.addEventListener("click", openMistakes);
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
      "<b>Demo.</b> One unit is playable end to end and five study sets are complete. The rest carry " +
      "a real syllabus with the lessons still to be written. Nothing is saved and nothing leaves this " +
      'page. <a href="../edu/">About Oplo Edu &rsaquo;</a>'));
  }

  /* A session is assembled, not listed: review what is broken, learn the new
     thing, practise it, then prove it without help. */
  function session(step) {
    var out = [];
    if (S.mistakes.length) {
      out.push({ t: "Review what you missed", d: S.mistakes.length + " to go back over",
                 mins: 5, icon: I.learn, go: openMistakes });
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
  function openMistakes() {
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
        S.mistakes = []; toast("Mistake book cleared."); openMistakes();
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
    all.addEventListener("click", function () { drawExplore(); show("explore"); });
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

  function openSubject(s, push) {
    if (!s) { drawExplore(); show("explore", push); return; }
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
    show("subject", push);
  }

  /* ---------------------------------------------------------------- Course */
  function openCourse(c, push) {
    if (!c) return;
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
    show("course", push);
  }

  /* ------------------------------------------------------------------ Unit */
  function openUnit(c, n, push) {
    S.course = c; S.unitIx = n;
    var u = unitsOf(c).filter(function (x) { return x.n === n; })[0];
    if (!u) return;
    S.unit = u;

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
      pb.addEventListener("click", startPractice);
      b1.appendChild(pb);
      v.appendChild(b1);
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
    show("unit", push);
  }

  /* ================================================================= Sets */
  function openSet(id, push) {
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
      b.addEventListener("click", m[3]);
      modes.appendChild(b);
    });
    v.appendChild(modes);

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
        star.classList.toggle("on", st.star[i]);
        star.setAttribute("aria-pressed", String(!!st.star[i]));
        star.innerHTML = svg(I.star, !st.star[i]);
      });
      row.appendChild(star);
      terms.appendChild(row);
    });
    v.appendChild(terms);

    noFoot(); progress(null);
    show("set", push);
  }

  /* ----------------------------------------------------------- Flashcards */
  function startCards() {
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
     Three passes over each term, each harder than the last: recognise it,
     recognise it backwards, then produce it from nothing. A wrong answer
     sends the term back to the start of the queue rather than to the end
     of the session — the ones you miss are the ones you see most. */
  function startLearn() {
    var cards = S.set.cards, st = setState(S.setId);
    var level = {}, queue = [];
    cards.forEach(function (_, i) { level[i] = 0; queue.push(i); });
    queue = shuffle(queue);
    var cur = null, picked = null, checked = false, correct = 0, asked = 0;

    var v = $("#v-learn");

    function mastered() {
      return cards.filter(function (_, i) { return level[i] >= 3; }).length;
    }

    function nextQ() {
      if (!queue.length) return done();
      cur = queue.shift();
      picked = null; checked = false;
      progress(Math.round(mastered() / cards.length * 100));
      draw();
    }

    function distractors(ix, which) {
      var pool = cards.map(function (_, i) { return i; }).filter(function (i) { return i !== ix; });
      return shuffle(pool).slice(0, Math.min(3, pool.length)).map(function (i) { return cards[i][which]; });
    }

    function draw() {
      var c = cards[cur], lv = level[cur];
      v.innerHTML = "";
      v.appendChild(el("p", "lx-eyebrow", esc(S.set.t) + " · " + mastered() + " of " + cards.length + " mastered"));

      var stage = el("div", "lx-stage");
      if (lv === 0) {
        stage.appendChild(el("p", "lx-ask", "Which term is this?"));
        stage.appendChild(el("div", "lx-prompt", esc(c[1])));
        stage.appendChild(choices(shuffle([c[0]].concat(distractors(cur, 0))), c[0]));
      } else if (lv === 1) {
        stage.appendChild(el("p", "lx-ask", esc(c[0])));
        stage.appendChild(el("p", "lx-hint", "Which definition belongs to it?"));
        stage.appendChild(choices(shuffle([c[1]].concat(distractors(cur, 1))), c[1]));
      } else {
        stage.appendChild(el("p", "lx-ask", "Type the term."));
        stage.appendChild(el("div", "lx-prompt", esc(c[1])));
        var w = el("div", "lx-numwrap");
        var inp = el("input", "lx-num");
        inp.type = "text"; inp.id = "learnIn"; inp.autocomplete = "off";
        inp.setAttribute("aria-label", "The term");
        inp.addEventListener("input", function () {
          picked = inp.value.trim();
          $("#footBtn").disabled = !picked;
        });
        inp.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && !$("#footBtn").disabled) submit();
        });
        w.appendChild(inp);
        stage.appendChild(w);
        setTimeout(function () { inp.focus(); }, 60);
      }
      stage.appendChild(el("div", null, "")).id = "learnVerdict";
      v.appendChild(stage);
      // Always starts disabled: with it live, Check could be pressed on an
      // unanswered question and marked wrong for you.
      foot("", "Check", false, submit);
    }

    function choices(opts, right) {
      var wrap = el("div", "lx-opts");
      opts.forEach(function (o, i) {
        var b = el("button", "lx-opt");
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.innerHTML = '<span class="lx-key">' + "ABCD"[i] + "</span><span>" + esc(o) + "</span>";
        b.addEventListener("click", function () {
          if (checked) return;
          picked = o;
          [].forEach.call(wrap.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          $("#footBtn").disabled = false;
        });
        wrap.appendChild(b);
      });
      wrap.dataset.right = right;
      return wrap;
    }

    function submit() {
      var c = cards[cur], lv = level[cur];
      if (checked) { nextQ(); return; }
      checked = true; asked++;
      var right = lv === 0 ? c[0] : lv === 1 ? c[1] : c[0];
      var ok = lv === 2 ? norm(picked) === norm(c[0]) : picked === right;
      if (ok) { correct++; level[cur] = lv + 1; if (level[cur] >= 3) st.level[cur] = 3; }
      else {
        level[cur] = 0;
        var m = S.mistakes.filter(function (x) { return x.key === S.setId + ":" + cur; })[0];
        slip("term", S.setId + ":" + cur, c[0], c[1]);
        (m || S.mistakes[S.mistakes.length - 1]).card = c;
      }

      var opts = v.querySelectorAll(".lx-opt");
      if (opts.length) {
        [].forEach.call(opts, function (b) {
          b.disabled = true;
          var t = b.lastElementChild.textContent;
          if (t === right) b.classList.add("right");
          else if (t === picked) b.classList.add("wrong");
        });
      } else {
        var inp = $("#learnIn");
        inp.disabled = true;
        inp.classList.add(ok ? "right" : "wrong");
      }
      var vd = document.getElementById("learnVerdict");
      vd.innerHTML = '<div class="lx-verdict ' + (ok ? "right" : "wrong") + '"><b>' +
        (ok ? "Correct" : "The answer is " + esc(right)) + "</b><p>" +
        (ok ? (level[cur] >= 3 ? "Mastered. It will not come round again."
                               : "It comes back once more, harder.")
            : "Back to the start of the queue for this one.") + "</p></div>";

      if (!ok || level[cur] < 3) queue.unshift(cur);
      foot(mastered() + " of " + cards.length + " mastered", queue.length ? "Continue" : "Finish", true, submit);
    }

    function done() {
      progress(null);
      if (S.course && S.unitIx) raise(S.course, S.unitIx, "r", 100);
      result({
        title: "Set mastered.",
        lede: "Every term answered three ways: recognised, reversed, and typed from nothing.",
        pct: 100,
        stats: [[cards.length, "terms"], [correct, "correct"], [asked, "questions"]],
        back: function () { openSet(S.setId); }
      });
    }

    show("learn");
    nextQ();
  }

  /* ----------------------------------------------------------------- Match */
  function startMatch() {
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
      setTimeout(function () {
        result({
          title: secs.toFixed(1) + " seconds.",
          lede: best ? "That is your best run on this set."
                     : "Your best on this set is still " + st.best.toFixed(1) + "s.",
          pct: 100,
          stats: [[pick.length, "pairs"], [secs.toFixed(1), "seconds"],
                  [(secs / pick.length).toFixed(1), "per pair"]],
          back: function () { openSet(S.setId); },
          again: startMatch
        });
      }, 420);
    }

    noFoot(); progress(null);
    show("match");
  }

  /* ------------------------------------------------------------------ Test
     Every question on one page, answered in any order, graded once — the
     point of a test rather than a drill. */
  function startTest() {
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

  /* -------------------------------------------------------------- Practice */
  function startPractice() {
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
      ab.addEventListener("click", o.again);
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
    S.resultBack = o.back;
    noFoot();
    show("result");
    $("#backLabel").textContent = "Back";
    setTimeout(function () {
      var arc = document.getElementById("ringArc");
      if (arc) arc.style.strokeDashoffset = String(circ - circ * o.pct / 100);
    }, 130);
  }

  /* --------------------------------------------------------------- Account */
  function openAccount() {
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
      toast("Demo account — there is no payment system behind this button.");
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
      "<b>Demo record.</b> These figures are here to show the shape of an enrolment page. Nothing is " +
      "submitted, no payment can be taken, and none of it is stored — reloading the page resets it."));

    noFoot(); progress(null);
    show("account");
  }

  /* ================================================================= Gate
     Not authentication. A static page cannot keep a secret from the browser
     it is running in, so this decides which student's material to open and
     nothing more — the screen itself says so. The password is compared as a
     salted SHA-256 rather than sitting in the source in plain text, which
     keeps it out of a casual read of view-source without pretending to be
     more than it is. */
  function digest(pw) {
    var data = new TextEncoder().encode("oplo-learn:" + pw);
    if (!(window.crypto && crypto.subtle && crypto.subtle.digest)) return Promise.resolve(null);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return [].map.call(new Uint8Array(buf), function (b) {
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
    });
  }

  function signIn(email, pw) {
    var who = D.STUDENTS.filter(function (s) {
      return s.email.toLowerCase() === String(email).trim().toLowerCase();
    })[0];
    if (!who) return Promise.resolve(null);
    return digest(pw).then(function (h) {
      // Without SubtleCrypto (an insecure origin, say) the gate cannot check
      // anything, so it opens rather than locking a demo nobody can reach.
      if (h == null) return who;
      return h === who.hash ? who : null;
    });
  }

  function boot(who) {
    S.me = who;
    $("#gate").hidden = true;
    document.querySelector(".lx-user .av").textContent = who.initials;
    document.querySelector(".lx-user .nm").textContent = who.name;
    $("#user").title = "Signed in as " + who.name;
    drawSubjectNav();
    drawMy();
    show("my", false);
  }

  (function gate() {
    var form = $("#gateForm"), err = $("#gErr");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#gEmail").value, pw = $("#gPass").value;
      err.textContent = "";
      $("#gEmail").classList.remove("bad");
      $("#gPass").classList.remove("bad");
      if (!email || !pw) {
        err.textContent = "Both fields, please.";
        return;
      }
      signIn(email, pw).then(function (who) {
        if (who) { boot(who); return; }
        err.textContent = "That email and password do not match an account here.";
        $("#gEmail").classList.add("bad");
        $("#gPass").classList.add("bad");
        $("#gPass").value = "";
        $("#gPass").focus();
      });
    });
    setTimeout(function () { $("#gEmail").focus(); }, 120);
  })();

  /* ---------------------------------------------------------------- Wiring */
  [].forEach.call(document.querySelectorAll("#topNav button"), function (b) {
    b.addEventListener("click", function () {
      S.stack = [];
      markSubjectNav(null);
      if (b.dataset.view === "my") { drawMy(); show("my", false); }
      else { drawExplore(); show("explore", false); }
      noFoot(); progress(null);
    });
  });
  $("#back").addEventListener("click", goBack);
  $("#user").addEventListener("click", openAccount);

  document.addEventListener("keydown", function (e) {
    if (S.view === "cards" && S.keys) S.keys(e);
  });

})();
