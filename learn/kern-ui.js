/* ==========================================================================
   Kern's pages, in the new UI system.

   Home, Courses, a course's map, a unit, Practice, Progress and the Tutor, and
   the slim header over a lesson. The look is kern.css; this file draws the
   markup and works out what the pages say from what the record holds. Only
   when window.OPLO_KERN is set.

   The one picture that is new is the course wheel: a ring for each unit, the
   outside ring the first, a segment in a ring for each lesson, a core in the
   middle. Green is done, black is the lesson you are on, beige is the rest.
   A course's lessons are read from learn/kern-outline.js (tools/kern_outline.mjs
   writes it), so no page needs to load a unit just to count its lessons.

   Everything a page says is something the record can back up. A skill comes
   back to Practice after 1, 3, 7 and 14 days as its level rises: that is this
   list's own rule, said on the page where it applies. The streak and the
   experience are the game ledger's (store.js) and nothing here adds to them.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_KERN) return;

  var K = window.KERN_UI = {};
  var NS = "http://www.w3.org/2000/svg";
  var DAY = 864e5;
  var LEVELS = ["Not started", "Attempted", "Familiar", "Proficient", "Mastered"];
  var INTERVAL = [0, 1, 3, 7, 14];                 // days until a skill is due again, by level
  var STILL = false;                               // a redraw because the record arrived: no entrance, no jump

  /* ------------------------------------------------------------- Helpers */
  function h(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function btn(cls, html, fn) {
    var b = h("button", cls, html);
    b.type = "button";
    if (fn) b.addEventListener("click", fn);
    return b;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function sv(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function ico(d, w) {
    return '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }
  var I = {
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 4.5 4.5"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.2"/><path d="M12 16.4h.01"/>',
    list: '<path d="M5 7h14M5 12h14M5 17h9"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
    xp: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/>',
    book: '<path d="M4 5.5h5.5A2.5 2.5 0 0 1 12 8v11a2 2 0 0 0-2-2H4z"/><path d="M20 5.5h-5.5A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    x: '<path d="m7 7 10 10M17 7 7 17"/>'
  };
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many || one + "s"); }
  function num(n) { return Number(n || 0).toLocaleString(); }
  function dayStart(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function shortDate(t) { return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  function longMinutes(m) {
    if (m < 60) return "About " + Math.max(1, Math.round(m)) + " min";
    var hrs = m >= 600 ? Math.round(m / 60) : Math.round(m / 30) / 2;
    return "About " + hrs + " h";
  }
  // Every course here calls its parts units, as the lessons themselves do.
  K.noun = function () { return "Unit"; };
  function lab() { return window.OPLO_LAB; }
  function O(cid, n) { var o = window.KERN_OUTLINE; return (o && o[cid] && o[cid][n]) || null; }

  /* --------------------------------------------------------------- The record
     What this account has done in the lab, read without loading a unit. A
     lesson is kept under its unit, its number and its version ("alg:3:5~2"):
     a lesson that has been rewritten is a new lesson, and starts over. */
  function record(x) {
    var L = lab();
    return L && L.record ? L.record(x.S.me) : null;
  }
  function lessonRec(R, cid, n, k, v) {
    return (R && R.lessons && R.lessons[cid + ":" + n + ":" + k + (v ? "~" + v : "")]) || null;
  }
  /* When the record arrives from the account after a page is drawn, the page
     that is showing draws again, in place. One page owns the slot at a time. */
  function watch(view, again) {
    var L = lab();
    if (!L || !L.live) return;
    L.live.refresh = function () {
      var v = document.getElementById("v-" + view);
      if (!v || !v.classList.contains("on")) return;
      STILL = true;
      try { again(); } finally { STILL = false; }
    };
  }

  /* A course as the pages draw it: its units, each with the lessons it has, which
     are done, and which is the one you are on. */
  function model(x, c, R) {
    var m = { c: c, units: [], total: 0, done: 0, mins: 0, cur: null, last: 0, lab: false };
    x.units(c).forEach(function (u) {
      var o = O(c.id, u.n), lessons = [], doneN = 0;
      if (o) {
        m.lab = true;
        o.l.forEach(function (l, i) {
          var k = i + 1, r = lessonRec(R, c.id, u.n, k, l[5]), done = !!(r && r.done);
          if (r && r.at > m.last) m.last = r.at;
          lessons.push({ k: k, title: l[0], mins: l[1], tag: l[2], read: !!l[3], steps: l[4], done: done });
          m.total++;
          if (done) { m.done++; doneN++; } else m.mins += l[1];
          if (!done && !m.cur) m.cur = { n: u.n, k: k };
        });
        o.s.forEach(function (s) {
          var sk = R && R.skills && R.skills[s[0]];
          if (sk && sk.at > m.last) m.last = sk.at;
        });
      }
      m.units.push({ n: u.n, t: u.t, desc: u.desc, art: u.art, outline: o, lessons: lessons, done: doneN, pct: x.mastery(c, u.n),
                     live: !!(u.play || u.set || u.lab || u.read) });
    });
    if (m.cur) {
      var cu = m.units.filter(function (u) { return u.n === m.cur.n; })[0];
      m.cur.unit = cu;
      m.cur.lesson = cu.lessons[m.cur.k - 1];
      m.cur.no = lessonNo(cu, m.cur.k);
    }
    return m;
  }
  // The number a lesson wears in its unit: tagged ones (a "Ready?" check) are not counted.
  function lessonNo(u, k) {
    var n = 0;
    for (var i = 0; i < k; i++) if (!u.lessons[i].tag) n++;
    return u.lessons[k - 1].tag ? null : n;
  }
  function untagged(u) { return u.lessons.filter(function (z) { return !z.tag; }).length; }
  function startedCourse(m) { return m.done > 0 || m.units.some(function (u) { return u.pct > 0; }); }
  K.model = model;

  /* Every practised skill, with when it is next due. */
  var SKIX = null, SKSRC = null;
  function skillIndex(x) {
    if (SKIX && SKSRC === window.KERN_OUTLINE) return SKIX;
    SKIX = {}; SKSRC = window.KERN_OUTLINE;
    x.courses().forEach(function (c) {
      x.units(c).forEach(function (u) {
        var o = O(c.id, u.n);
        if (o) o.s.forEach(function (s) { SKIX[s[0]] = { c: c, n: u.n, title: s[1], unit: u.t }; });
      });
    });
    return SKIX;
  }
  function skills(x) {
    var R = record(x), out = [];
    if (!R) return out;
    var ix = skillIndex(x), eod = dayStart(Date.now()) + DAY - 1;
    Object.keys(R.skills || {}).forEach(function (id) {
      var s = R.skills[id], meta = ix[id];
      if (!s || !s.lv || !meta) return;
      var due = (s.at || 0) + INTERVAL[Math.min(4, s.lv)] * DAY;
      out.push({ id: id, lv: s.lv, at: s.at || 0, due: due, today: due <= eod, c: meta.c, n: meta.n, title: meta.title, unit: meta.unit });
    });
    return out;
  }
  function dueNow(list) { return list.filter(function (s) { return s.today; }).sort(function (a, b) { return a.due - b.due; }); }
  function dots(lv) {
    var o = '<span class="kd-dots" role="img" aria-label="' + LEVELS[lv] + '">';
    for (var i = 1; i <= 4; i++) o += "<i" + (i <= lv ? ' class="on"' : "") + "></i>";
    return o + "</span>";
  }

  /* ------------------------------------------------------------ The wheel
     m        the course model
     o.size   the picture's width and height
     o.labels write each unit's name along its ring
     o.pick   a function (unitNumber, lessonNumber) for a tap on a segment
     o.sel    {n, k} the segment that is selected
     o.mark   mark the lesson you are on and say so
     o.core   the text in the middle, [small, large], or false for a plain disc
     o.mini   a picture only: no names, no core text, no note                     */
  K.wheel = function (m, o) {
    o = o || {};
    var S = o.size || 640, R = S / 2, us = m.units, N = Math.max(1, us.length);
    var svg = sv("svg", { viewBox: "0 0 " + S + " " + S, "class": "kd-wheel" + (o.mini ? " mini" : ""), role: "img",
      "aria-label": m.c.t + ": " + m.done + " of " + m.total + " lessons done" });
    if (!o.mini) { svg.setAttribute("width", S); svg.setAttribute("height", S); }
    var gap = Math.max(1.2, R * 0.012);
    // The core shrinks as rings are added, so twelve units still leave each ring room to carry its name.
    var coreR = o.coreR != null ? o.coreR : Math.max(R * 0.17, Math.min(R * 0.29, (0.62 - N * 0.04) * R));
    var outer = R - 2, pitch = (outer - coreR - gap * 2) / N, thick = pitch - gap;
    function pt(r, a) { var t = (a - 90) * Math.PI / 180; return [R + r * Math.cos(t), R + r * Math.sin(t)]; }
    function sector(r0, r1, a0, a1) {
      var p0 = pt(r1, a0), p1 = pt(r1, a1), p2 = pt(r0, a1), p3 = pt(r0, a0), big = a1 - a0 > 180 ? 1 : 0;
      return "M" + p0[0].toFixed(2) + " " + p0[1].toFixed(2) + "A" + r1 + " " + r1 + " 0 " + big + " 1 " + p1[0].toFixed(2) + " " + p1[1].toFixed(2) +
        "L" + p2[0].toFixed(2) + " " + p2[1].toFixed(2) + "A" + r0 + " " + r0 + " 0 " + big + " 0 " + p3[0].toFixed(2) + " " + p3[1].toFixed(2) + "Z";
    }
    var segs = sv("g", { "class": "kd-segs" }, svg), labels = sv("g", { "class": "kd-ringlabels" }, svg), here = null;
    var tick = Math.min(2.6, 700 / Math.max(40, countSegments(us)));          // the gap between segments, in degrees

    // What a segment is: the lesson's own state, or, where a unit has no lessons to point at, the unit's mastery.
    function stateOf(u, j) {
      var l = u.lessons[j], k = j + 1;
      if (l) return l.done ? "done" : (m.cur && m.cur.n === u.n && m.cur.k === k ? "cur" : "todo");
      return u.pct >= 85 ? "done" : u.pct > 0 ? "cur" : (u.live ? "todo" : "soon");
    }

    us.forEach(function (u, i) {
      var r1 = outer - i * pitch, r0 = r1 - thick, n = u.lessons.length || 1, step = 360 / n, states = [];
      var ring = sv("g", { "class": "kd-ring", "data-n": u.n }, segs);
      for (var j = 0; j < n; j++) {
        var l = u.lessons[j], k = j + 1, state = stateOf(u, j);
        states.push(state);
        var a0 = j * step + tick / 2, a1 = (j + 1) * step - tick / 2;
        if (n === 1) { a0 = tick / 2; a1 = 360 - tick / 2; }
        var p = sv("path", { d: sector(r0, r1, a0, a1), "class": "kd-seg " + state + (o.sel && o.sel.n === u.n && (o.sel.k === k || !o.sel.k) ? " sel" : ""),
          "data-n": u.n, "data-k": k }, ring);
        var name = l ? l.title : u.t;
        sv("title", {}, p).textContent = K.noun(m.c) + " " + u.n + ", " + u.t + (l ? ": " + (l.tag ? l.tag + " " : "Lesson " + lessonNo(u, k) + " ") + name : "") +
          (state === "done" ? " (done)" : state === "cur" ? " (you are here)" : state === "soon" ? " (not written yet)" : "");
        // An unwritten unit has no lessons to point at; its one segment is dimmed and does nothing.
        if (o.pick && state !== "soon") {
          p.setAttribute("tabindex", "0"); p.setAttribute("role", "button");
          p.setAttribute("aria-label", K.noun(m.c) + " " + u.n + ", " + u.t + (l ? ", " + name : ""));
          (function (uu, kk) {
            p.addEventListener("click", function () { o.pick(uu, kk); });
            p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); o.pick(uu, kk); } });
          })(u.n, l ? k : 0);
        }
        if (state === "cur" && !here) here = { a: (a0 + a1) / 2, r: (r0 + r1) / 2 };
      }
      // The unit's name, along its ring, starting at the top: white over green and black, ink over beige.
      if (o.labels && thick >= 13) {
        var fs = Math.min(12.5, thick * 0.6), mid = (r0 + r1) / 2 - fs * 0.34, id = "kdr" + (o.id || "x") + "-" + u.n;
        var words = u.n + " " + u.t, fit = Math.floor(mid * 1.75 / (fs * 0.58));
        if (words.length > fit) words = words.slice(0, Math.max(4, fit - 1)).replace(/\s+\S*$/, "") + "…";
        var span = Math.min(105, (words.length * fs * 0.58 + 10) / mid * 180 / Math.PI), dark = 0, total = 0;
        for (var q = 0; q < n; q++) if (q * step < span) { total++; if (states[q] === "done" || states[q] === "cur") dark++; }
        var tone = dark === total ? "on" : dark ? "mixed" : "off";
        sv("path", { id: id, d: "M" + pt(mid, 0)[0].toFixed(2) + " " + pt(mid, 0)[1].toFixed(2) + "A" + mid + " " + mid + " 0 1 1 " + pt(mid, 359.9)[0].toFixed(2) + " " + pt(mid, 359.9)[1].toFixed(2), fill: "none" }, labels);
        var t = sv("text", { "class": "kd-ringlabel " + tone, "font-size": fs.toFixed(1) }, labels);
        var tp = sv("textPath", { href: "#" + id, startOffset: "1%" }, t);
        tp.textContent = words;
      }
    });

    // The core.
    var core = sv("g", { "class": "kd-core" + (o.coreGo ? " go" : "") }, svg);
    sv("circle", { cx: R, cy: R, r: coreR - gap, "class": "kd-corebg" }, core);
    if (o.core !== false && !o.mini) {
      var t1 = sv("text", { x: R, y: R - 3, "text-anchor": "middle", "class": "kd-core-s", "font-size": Math.max(9, coreR * 0.15).toFixed(1) }, core);
      t1.textContent = ((o.core || ["Core"])[0] || "Core").toUpperCase();
      var t2 = sv("text", { x: R, y: R + coreR * 0.22, "text-anchor": "middle", "class": "kd-core-l", "font-size": Math.max(12, coreR * 0.24).toFixed(1) }, core);
      t2.textContent = (o.core || [, ""])[1] || "";
      if (o.coreGo) {
        core.setAttribute("tabindex", "0"); core.setAttribute("role", "button"); core.setAttribute("aria-label", o.coreLabel || "Open the core");
        core.addEventListener("click", o.coreGo);
        core.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); o.coreGo(); } });
      }
    }

    // Where you are: a dot on the segment, and a note beside the wheel with a line to it.
    if (o.mark && here) {
      var hp = pt(here.r, here.a);
      sv("circle", { cx: hp[0], cy: hp[1], r: Math.max(3.2, thick * 0.2), "class": "kd-here" }, svg);
      if (!o.mini) {
        var right = hp[0] >= R, py = S - 22, px = right ? S - 104 : 4, ex = right ? px : px + 102;
        var elbow = right ? Math.min(hp[0] + 56, S - 118) : Math.max(hp[0] - 56, 120);
        sv("polyline", { points: hp[0].toFixed(1) + "," + hp[1].toFixed(1) + " " + elbow.toFixed(1) + "," + py + " " + ex + "," + py, "class": "kd-leader" }, svg);
        sv("rect", { x: px, y: py - 16, width: 102, height: 32, rx: 16, "class": "kd-youpill" }, svg);
        var yt = sv("text", { x: px + 51, y: py + 4.5, "text-anchor": "middle", "class": "kd-youtext" }, svg);
        yt.textContent = "You are here";
      }
    }
    return svg;
  };
  function countSegments(us) { return us.reduce(function (a, u) { return a + (u.lessons.length || 1); }, 0); }

  /* ------------------------------------------------------- Shared pieces */
  function head(eyebrow, title, lede) {
    var f = document.createDocumentFragment();
    if (eyebrow) f.appendChild(h("p", "kd-eyebrow", esc(eyebrow)));
    f.appendChild(h("h1", "kd-h1", esc(title)));
    if (lede) f.appendChild(h("p", "kd-lede", lede));
    return f;
  }
  function sechead(title, linkLabel, fn) {
    var d = h("div", "kd-sechead", "<h2>" + esc(title) + "</h2>");
    if (linkLabel) d.appendChild(btn("kd-link", esc(linkLabel), fn));
    return d;
  }
  function page(view, cls) {
    var v = document.getElementById("v-" + view);
    v.innerHTML = "";
    var p = h("div", "kd-page " + (cls || "") + (STILL ? " still" : ""));
    v.appendChild(p);
    return p;
  }
  function crumbs(items) {
    var nav = h("nav", "kd-crumbs"), ol = h("ol");
    nav.setAttribute("aria-label", "Breadcrumb");
    items.forEach(function (it, i) {
      var li = h("li");
      if (it.go) li.appendChild(btn("kd-crumb", esc(it.t), it.go));
      else { li.className = "cur"; li.setAttribute("aria-current", "page"); li.textContent = it.t; }
      ol.appendChild(li);
      if (i < items.length - 1) ol.appendChild(h("li", "sep", "/")).setAttribute("aria-hidden", "true");
    });
    nav.appendChild(ol);
    return nav;
  }
  function greeting() {
    var hr = new Date().getHours();
    return hr < 5 ? "Good evening" : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  }
  function goLesson(x, m, n, k) { x.openLab(m.c, n, "l" + k); }
  function courseCard(x, m) {
    var c = m.c, b = h("button", "kd-card kd-mini");
    b.type = "button";
    var pct = m.total ? Math.round(m.done / m.total * 100) : x.pct(c);
    b.appendChild(K.wheel(m, { size: 100, mini: true, id: "m" + c.id }));
    var tx = h("span", "kd-mini-tx");
    tx.innerHTML = "<b>" + esc(c.t) + "</b><span>" + (m.total ? m.done + " of " + plural(m.total, "lesson") : plural(x.units(c).length, "unit")) + "</span>" +
      '<span class="kd-bar"><i style="width:' + pct + '%"></i></span>';
    b.appendChild(tx);
    b.addEventListener("click", function () { x.openCourse(c); });
    return b;
  }

  /* ================================================================== Home */
  K.home = function (x) {
    var p = page("my", "kd-home"), R = x.R, g = R.d.game, rc = record(x);
    var mine = x.own(), models = mine.map(function (c) { return model(x, c, rc); });
    // The course you were last in, and failing that the first you started.
    models.sort(function (a, b) { return b.last - a.last; });
    var lead = models.filter(function (m) { return m.cur; })[0] || null;
    var list = skills(x), due = dueNow(list);
    watch("my", function () { K.home(x); });

    var say = [];
    if (lead) say.push("Pick up where you left off.");
    if (due.length) say.push(plural(due.length, "skill") + (due.length === 1 ? " is" : " are") + " due for review.");
    else if (list.length) say.push("Nothing is due for review.");
    if (!say.length) say.push("Pick something to learn. Everything here is worked through by solving, and nothing is graded.");
    p.appendChild(head(new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
      greeting() + ", " + x.S.me.first, esc(say.join(" "))));

    var cols = h("div", "kd-cols"), main = h("div", "kd-main"), side = h("aside", "kd-side");
    cols.appendChild(main); cols.appendChild(side); p.appendChild(cols);

    // Where to go on.
    var cont = h("section", "kd-card kd-cont"), tx = h("div", "kd-cont-tx");
    if (lead) {
      var cu = lead.cur, u = cu.unit, l = cu.lesson, begun = startedCourse(lead);
      tx.innerHTML = '<p class="kd-eyebrow">' + (begun ? "Continue" : "Start") + " · " + esc(lead.c.t) + "</p><h2>" + esc(l.title) + "</h2>" +
        '<p class="kd-meta">' + esc(K.noun(lead.c) + " " + u.n + ", " + u.t) + " · " + (cu.no ? "Lesson " + cu.no + " of " + untagged(u) : esc(l.tag)) +
        " · " + longMinutes(l.mins) + "</p>";
      var segs = h("div", "kd-segbar");
      u.lessons.forEach(function (z, i) { segs.appendChild(h("i", z.done ? "done" : i + 1 === cu.k ? "cur" : "")); });
      tx.appendChild(segs);
      var acts = h("div", "kd-actions");
      acts.appendChild(btn("kd-btn primary", begun ? "Continue lesson" : "Start lesson", function () { goLesson(x, lead, cu.n, cu.k); }));
      acts.appendChild(btn("kd-btn", "Course map", function () { x.openCourse(lead.c); }));
      tx.appendChild(acts);
      cont.appendChild(tx);
      var wv = h("div", "kd-cont-wheel");
      wv.appendChild(K.wheel(lead, { size: 216, mini: true, mark: true, id: "hc" }));
      cont.appendChild(wv);
    } else {
      var step = mine.length ? x.next(mine) : null;
      tx.innerHTML = '<p class="kd-eyebrow">' + (mine.length ? "Your courses" : "Start here") + "</p><h2>" + (step ? esc(step.course.t) : "Pick something to learn") + "</h2>" +
        '<p class="kd-meta">' + (step ? esc(K.noun(step.course) + " " + step.unit.n + ", " + step.unit.t) : "Courses are made of short steps. You work through them from the outside in.") + "</p>";
      var a2 = h("div", "kd-actions");
      if (step) a2.appendChild(btn("kd-btn primary", step.pct ? "Continue" : "Start", function () { x.openUnit(step.course, step.unit.n); }));
      a2.appendChild(btn(step ? "kd-btn" : "kd-btn primary", "Browse courses", function () { x.explore(); }));
      tx.appendChild(a2);
      cont.appendChild(tx);
    }
    main.appendChild(cont);

    // Due for review.
    main.appendChild(sechead("Due for review", "Open practice", function () { x.openPractice(); }));
    var dl = h("section", "kd-card kd-rows");
    if (due.length) {
      due.slice(0, 3).forEach(function (s) {
        var row = h("button", "kd-row");
        row.type = "button";
        row.innerHTML = '<span class="kd-row-tx"><b>' + esc(s.title) + "</b><span>" + esc(s.unit) + "</span></span>" + dots(s.lv) + '<span class="kd-pill amber">Due today</span>';
        row.addEventListener("click", function () { x.openLab(s.c, s.n, "Practice/" + s.id); });
        dl.appendChild(row);
      });
    } else {
      dl.appendChild(h("p", "kd-none", list.length ? "Nothing is due. A skill you have practised comes back here when it is due again." :
        "Skills you practise come back here to be reviewed. Finish a lesson, then practise a skill from its unit."));
    }
    main.appendChild(dl);

    // Your courses.
    main.appendChild(sechead("Your courses", "Browse all courses", function () { x.explore(); }));
    var pair = h("div", "kd-pair");
    if (models.length) models.slice(0, 4).forEach(function (m) { pair.appendChild(courseCard(x, m)); });
    else pair.appendChild(h("p", "kd-none", "Courses you start are kept here."));
    main.appendChild(pair);
    if (x.S.mistakes.length) main.appendChild(btn("kd-link plain", "What you keep getting wrong · " + x.S.mistakes.length, function () { x.openMistakes(); }));

    // The week.
    var wk = x.G.week(R, x.ST), wkXp = wk.reduce(function (a, d) { return a + d.xp; }, 0), lastWeek = 0;
    for (var i = 7; i < 14; i++) lastWeek += g.days[x.ST.today(Date.now() - i * DAY)] || 0;
    var st = h("section", "kd-card kd-streak");
    st.innerHTML = '<p class="kd-eyebrow">Streak</p><div class="kd-big">' + g.streak + " <span>" + (g.streak === 1 ? "day" : "days") + "</span></div>" +
      '<ol class="kd-week">' + wk.map(function (d, i) {
        var nm = i === 6 ? "Today" : new Date(Date.now() - (6 - i) * DAY).toLocaleDateString(undefined, { weekday: "short" });
        return '<li class="' + (d.xp ? "on" : "") + (i === 6 ? " today" : "") + '"><i title="' + esc(d.day + ": " + d.xp + " XP") + '">' + (d.xp ? ico(I.check, 14) : "") + "</i><span>" + nm + "</span></li>";
      }).join("") + "</ol>" +
      "<p>" + (g.today >= g.goal ? "Today’s goal is met." : g.streak ? "Learn something today to keep your streak." : "Earn some experience today to start a streak.") +
      (g.best > g.streak ? " Your longest run is " + plural(g.best, "day") + "." : "") + "</p>" +
      '<hr><p class="kd-eyebrow">XP this week</p><div class="kd-big">' + num(wkXp) + "</div>" +
      "<p>" + (wkXp > lastWeek ? num(wkXp - lastWeek) + " XP more than last week." : wkXp < lastWeek ? num(lastWeek - wkXp) + " XP fewer than last week." : lastWeek ? "The same as last week." : "Your daily goal is " + g.goal + " XP.") + "</p>";
    side.appendChild(st);

    if (lead) {
      var nx = h("section", "kd-card kd-nextin");
      nx.innerHTML = '<p class="kd-eyebrow">Next in this course</p>';
      var rows = [], cu2 = lead.cur;
      lead.units.some(function (u) {
        if (u.n < cu2.n) return false;
        return u.lessons.some(function (z) {
          if (u.n === cu2.n && z.k <= cu2.k) return false;
          if (z.done) return false;
          rows.push({ u: u, z: z });
          return rows.length >= 3;
        });
      });
      rows.forEach(function (r) {
        nx.appendChild(btn("kd-nrow", "<b>" + esc(r.z.title) + "</b><span>" + (r.z.tag ? esc(r.z.tag) : "Lesson " + lessonNo(r.u, r.z.k)) + "</span>", function () { goLesson(x, lead, r.u.n, r.z.k); }));
      });
      if (rows.length) side.appendChild(nx);
    }
  };

  /* ============================================================== Courses
     pre   a subject to start with (a subject's page is this page with it picked) */
  K.courses = function (x, pre) {
    var p = page("explore", "kd-cat"), rc = record(x);
    watch("explore", function () { K.courses(x, pre); });
    p.appendChild(head("Courses", "Choose a course", "Free courses made of short steps. Each one is a map you work through from the outside in."));
    var all = x.courses().map(function (c) { return model(x, c, rc); });
    var live = all.filter(function (m) { return !m.c.stub; }).concat(all.filter(function (m) { return m.c.stub; }));
    var subjects = [];
    live.forEach(function (m) { if (subjects.indexOf(m.c.subject) < 0) subjects.push(m.c.subject); });
    var cur = subjects.indexOf(pre) > -1 ? pre : "All", q = "";
    var bar = h("div", "kd-filters"), pills = h("div", "kd-pills"), search = h("label", "kd-search");
    search.innerHTML = ico(I.search, 16);
    var inp = h("input"); inp.type = "search"; inp.placeholder = "Search courses"; inp.setAttribute("aria-label", "Search courses"); inp.autocomplete = "off"; inp.spellcheck = false;
    search.appendChild(inp);
    bar.appendChild(pills); bar.appendChild(search); p.appendChild(bar);
    var grid = h("div", "kd-grid"); p.appendChild(grid);
    var empty = h("p", "kd-none", "No course matches that."); empty.hidden = true; p.appendChild(empty);

    function cardFor(m) {
      var c = m.c, soon = c.stub, started = startedCourse(m);
      var a = h("button", "kd-card kd-course" + (soon ? " soon" : ""));
      a.type = "button";
      a.dataset.subject = c.subject; a.dataset.find = (c.t + " " + (c.d || "") + " " + c.subject).toLowerCase();
      a.appendChild(K.wheel(m, { size: 96, mini: true, id: "c" + c.id }));
      a.appendChild(h("span", "kd-chip " + (started ? "green" : ""), soon ? "Soon" : started ? "In progress" : esc(c.subject)));
      var us = x.units(c);
      a.insertAdjacentHTML("beforeend", "<h3>" + esc(c.t) + "</h3><p>" + esc(c.d || c.lede || "") + "</p>" +
        "<footer><span>" + (soon ? "Not written yet" : plural(us.length, "unit") + (m.total ? "<em>" + plural(m.total, "lesson") + "</em>" : "")) + "</span><span>" + esc(c.level || "") + "</span></footer>");
      a.addEventListener("click", function () { if (soon) x.toast("“" + c.t + "” isn’t written yet."); else x.openCourse(c); });
      return a;
    }
    var cards = live.map(cardFor);
    cards.forEach(function (a) { grid.appendChild(a); });
    function filter() {
      var shown = 0;
      cards.forEach(function (a) {
        var ok = (cur === "All" || a.dataset.subject === cur) && (!q || a.dataset.find.indexOf(q) > -1);
        a.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = !!shown;
      [].forEach.call(pills.children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.s === cur)); });
    }
    ["All"].concat(subjects).forEach(function (s) {
      var n = s === "All" ? live.length : live.filter(function (m) { return m.c.subject === s; }).length;
      var b = btn("kd-pillbtn", esc(s) + " <i>" + n + "</i>", function () { cur = s; filter(); });
      b.dataset.s = s;
      pills.appendChild(b);
    });
    inp.addEventListener("input", function () { q = inp.value.trim().toLowerCase(); filter(); });
    filter();
  };

  /* ================================================================ Course
     The wheel on the left, and on the right what the course is and the unit
     selected on the wheel: its lessons, and the one to do next. */
  K.course = function (x, c) {
    var rc = record(x), m = model(x, c, rc), noun = K.noun(c);
    var p = page("course", "kd-coursepage");
    watch("course", function () { K.course(x, c); });
    p.appendChild(crumbs([{ t: "Courses", go: x.explore }, { t: c.t }]));
    var cols = h("div", "kd-mapcols"), left = h("div", "kd-mapl"), right = h("div", "kd-mapr");
    cols.appendChild(left); cols.appendChild(right); p.appendChild(cols);

    // The unit selected: the one you are in, or the first.
    var sel = m.cur ? { n: m.cur.n, k: m.cur.k } : (m.units[0] ? { n: m.units[0].n, k: 0 } : null), picked = false;
    var challenge = !!(c.lab && m.lab);
    var wrap = h("div", "kd-wheelwrap"), unitBox = h("div", "kd-unitbox");
    function draw() {
      wrap.innerHTML = "";
      wrap.appendChild(K.wheel(m, {
        size: 640, labels: true, mark: !!m.cur && startedCourse(m), sel: picked ? sel : null, id: "course",
        core: challenge ? ["Core", "Challenge"] : ["Core", ""], coreLabel: "Open the course challenge",
        coreGo: challenge ? function () { x.openLab(c, null, "Challenge"); } : null,
        pick: function (n, k) { sel = { n: n, k: k }; picked = true; draw(); select(); }
      }));
    }
    left.appendChild(wrap);
    left.appendChild(h("div", "kd-legend", '<span><i class="done"></i>Done</span><span><i class="cur"></i>In progress</span><span><i></i>Not started</span><em>' +
      (m.lab ? "Start at the outside. Finish at the core." : noun + " 1 is the outer ring.") + "</em>"));

    // The course.
    right.appendChild(h("p", "kd-eyebrow", "Course"));
    right.appendChild(h("h1", "kd-h1", esc(c.t)));
    right.appendChild(h("p", "kd-lede", esc(c.d || c.lede || "")));
    var stats = h("dl", "kd-stats");
    function stat(big, small) { stats.insertAdjacentHTML("beforeend", "<div><dt>" + big + "</dt><dd>" + small + "</dd></div>"); }
    if (m.total) stat(m.done + " <i>/</i> " + m.total, "Lessons done");
    stat(String(m.units.length), noun + "s");
    if (m.total) stat(m.cur ? longMinutes(m.mins) : "0 min", m.cur ? "Left to finish" : "Course done");
    else stat(String(m.units.filter(function (u) { return u.live; }).length), "Open now");
    right.appendChild(stats);
    right.appendChild(unitBox);

    // The unit selected on the wheel.
    function select() {
      unitBox.innerHTML = "";
      if (!sel) return;
      var u = m.units.filter(function (z) { return z.n === sel.n; })[0];
      if (!u) return;
      var card = h("section", "kd-card kd-unit"), nxt = u.lessons.filter(function (z) { return !z.done; })[0];
      var inside = u.lessons.length ? u.done + " of " + u.lessons.length + " done" : u.live ? (u.pct ? u.pct + "% mastered" : "Open") : "Not written yet";
      card.innerHTML = '<div class="kd-unit-top"><p class="kd-eyebrow">' + noun + " " + u.n + "</p><span>" + inside + "</span></div><h2>" + esc(u.t) + "</h2>";
      if (u.lessons.length) {
        var ul = h("ol", "kd-ulist");
        u.lessons.forEach(function (z) {
          var li = h("li"), row = btn("kd-urow" + (z.done ? " done" : "") + (nxt === z ? " cur" : "") + (picked && sel.k === z.k ? " sel" : ""),
            '<span class="kd-tick">' + (z.done ? ico(I.check, 12) : "") + "</span><span>" + esc(z.title) + "</span><em>" + (z.done ? "Done" : z.mins + " min") + "</em>",
            function () { goLesson(x, m, u.n, z.k); });
          li.appendChild(row); ul.appendChild(li);
        });
        card.appendChild(ul);
        if (nxt) {
          var verb = (u.done || (m.cur && m.cur.n === u.n && startedCourse(m))) ? "Continue" : "Start";
          var go = btn("kd-btn primary wide kd-unit-go", "<span>" + verb + ": " + esc(nxt.title) + "</span>", function () { goLesson(x, m, u.n, nxt.k); });
          card.appendChild(go);
        } else {
          card.appendChild(btn("kd-btn primary wide kd-unit-go", "<span>Take the " + noun.toLowerCase() + " test</span>", function () { x.openLab(c, u.n, "Test"); }));
        }
        var lk = h("div", "kd-unit-links");
        lk.appendChild(btn("kd-link", "Practice and test", function () { x.openUnit(c, u.n); }));
        lk.appendChild(btn("kd-link", "All of " + noun.toLowerCase() + " " + u.n, function () { x.openUnit(c, u.n); }));
        card.appendChild(lk);
      } else {
        card.appendChild(h("p", "kd-unit-desc", u.live ? esc(u.desc || "") : "This " + noun.toLowerCase() + " is on the syllabus; its lessons are still being made."));
        if (u.live) card.appendChild(btn("kd-btn primary wide kd-unit-go", "<span>" + (u.pct ? "Continue" : "Open") + " " + noun.toLowerCase() + "</span>", function () { x.openUnit(c, u.n); }));
      }
      unitBox.appendChild(card);
    }
    select();

    if (!m.lab) {
      // A course with no lessons to point at lists its units as well.
      var ul2 = h("ol", "kd-unitlist");
      m.units.forEach(function (u) {
        var b = h("li");
        b.appendChild(btn("kd-urow" + (u.live ? "" : " soon"), "<span>" + u.n + "</span><b>" + esc(u.t) + "</b><em>" + (u.live ? (u.pct ? u.pct + "%" : "Open") : "Soon") + "</em>",
          function () { if (u.live) x.openUnit(c, u.n); else x.toast("That " + noun.toLowerCase() + " isn’t written yet."); }));
        ul2.appendChild(b);
      });
      right.appendChild(ul2);
    }
    if (challenge) {
      var core = h("p", "kd-corenote", "<b>Core:</b> Course challenge. Two problems from every " + noun.toLowerCase() + ". ");
      core.appendChild(btn("kd-link inline", "Open the challenge", function () { x.openLab(c, null, "Challenge"); }));
      right.appendChild(core);
    }
    if (x.S.me && !document.body.classList.contains("is-staff") && x.R) {
      var on = x.R.own().indexOf(c.id) > -1, add = btn("kd-link plain", on ? "On your list ✓" : "Add to my courses");
      add.addEventListener("click", function () {
        if (x.R.own().indexOf(c.id) > -1) { x.R.drop(c.id); add.textContent = "Add to my courses"; x.toast("Taken off your list."); }
        else { x.R.adopt(c.id); add.textContent = "On your list ✓"; x.toast("Added to your courses."); }
      });
      right.appendChild(add);
    }
    if (c.objectives || c.textbook || c.grownup) {
      var more = h("details", "kd-more");
      more.innerHTML = "<summary>About this course</summary>" + (c.grownup ? "<p>" + esc(c.grownup) + "</p>" : "") +
        (c.objectives ? "<ul>" + c.objectives.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") + (c.textbook ? "<p>" + esc(c.textbook) + "</p>" : "");
      right.appendChild(more);
    }
    draw();
    x.mark(c.subject); x.noFoot(); x.progress(null);
    if (!STILL) x.show("course");
  };

  /* ================================================================== Unit
     A lab unit's page: the course's units down the left, this one on the right.
     lab/core.js hands over here (renderUnit) when Kern is on a wide screen. */
  K.unit = function (host, ctx) {
    var x = K.ctx && K.ctx(), L = lab();
    host.innerHTML = "";
    var p = h("div", "kd-page kd-unitpage lb-unit" + (STILL ? " still" : ""));
    if (ctx.course) p.setAttribute("data-course", ctx.course);
    host.appendChild(p);
    var c = x ? x.courses().filter(function (z) { return z.id === ctx.course; })[0] : null;
    var noun = K.noun(c);
    p.appendChild(crumbs([{ t: "Courses", go: x && x.explore }, { t: ctx.courseTitle || "Course", go: ctx.go.course }, { t: noun + " " + ctx.n }]));
    var cols = h("div", "kd-ucols"), nav = h("nav", "kd-unav"), body = h("div", "kd-ubody");
    nav.setAttribute("aria-label", noun + "s");
    cols.appendChild(nav); cols.appendChild(body); p.appendChild(cols);
    body.appendChild(h("div", "lb-loading", "<span></span><span></span><span></span>"));

    function paintNav() {
      nav.innerHTML = '<p class="kd-eyebrow">' + noun + "s</p>";
      if (!x || !c) return;
      var m = model(x, c, L.record(ctx.me)), ol = h("ol");
      m.units.forEach(function (u) {
        var li = h("li"), on = u.n === ctx.n, can = u.live || u.outline;
        var b = btn("kd-nrow2" + (on ? " on" : "") + (can ? "" : " soon"),
          "<span>" + u.n + "</span><b>" + esc(u.t) + "</b><em>" + (u.lessons.length ? u.done + " of " + u.lessons.length : can ? (u.pct ? u.pct + "%" : "") : "Soon") + "</em>",
          function () { if (can && !on) x.openUnit(c, u.n); });
        if (on) b.setAttribute("aria-current", "page");
        li.appendChild(b); ol.appendChild(li);
      });
      nav.appendChild(ol);
    }
    paintNav();

    L.load(ctx.course, ctx.n).then(function (u) {
      function paint() {
        var R = L.record(ctx.me), lev = L.level;
        body.innerHTML = "";
        var seq = 0;
        var lessons = u.lessons.map(function (l) {
          var r = lessonRec(R, ctx.course, ctx.n, l.k, l.v);
          if (!l.tag) seq++;
          return { l: l, k: l.k, done: !!(r && r.done), no: l.tag ? null : seq, mins: l.mins || Math.max(4, Math.round(l.steps.length * 0.9)) };
        });
        var doneN = lessons.filter(function (z) { return z.done; }).length;
        var nextL = lessons.filter(function (z) { return !z.done; })[0];
        var openQuiz = u.quizzes.filter(function (q) {
          return !R.tests[q.unit + ":q" + q.k] && lessons.slice(0, q.after).every(function (z) { return z.done; });
        })[0];
        var weakest = u.skills.slice().sort(function (a, b) { return lev(a.id) - lev(b.id); })[0];
        var tBest = (R.tests[u.key] || {}).best;

        var card = h("section", "kd-card kd-ucard");
        var top = h("div", "kd-utop"), tx = h("div", "kd-utx");
        tx.innerHTML = '<p class="kd-eyebrow">' + esc(noun + " " + u.n) + "</p><h1>" + L.fmt(u.title) + "</h1>" + (ctx.desc ? "<p>" + esc(ctx.desc) + "</p>" : "");
        top.appendChild(tx);
        // Done, as a small wheel of the unit's own lessons.
        var mini = K.wheel({ c: c || { t: ctx.courseTitle, id: ctx.course }, done: doneN, total: lessons.length, cur: nextL ? { n: u.n, k: nextL.k } : null,
          units: [{ n: u.n, t: u.title, lessons: lessons.map(function (z) { return { done: z.done, title: z.l.title, tag: z.l.tag }; }), pct: 0, live: true }] },
          { size: 132, coreR: 40, id: "u" + u.n, core: false });
        mini.setAttribute("class", "kd-wheel kd-unitwheel");
        var ring = h("div", "kd-uring");
        ring.appendChild(mini);
        ring.insertAdjacentHTML("beforeend", '<span class="kd-ring-tx"><em>Done</em><b>' + doneN + " <i>/</i> " + lessons.length + "</b></span>");
        top.appendChild(ring);
        card.appendChild(top);

        var mins = lessons.reduce(function (a, z) { return a + (z.done ? 0 : z.mins); }, 0) || lessons.reduce(function (a, z) { return a + z.mins; }, 0);
        var tiles = h("div", "kd-tiles");
        [[lessons.length, "Lessons"], [mins, doneN === lessons.length ? "Minutes in all" : "Minutes left"], [u.skills.length, "Skills to practise"]].forEach(function (t) {
          tiles.insertAdjacentHTML("beforeend", "<div><b>" + t[0] + "</b><span>" + t[1] + "</span></div>");
        });
        card.appendChild(tiles);

        var acts = h("div", "kd-uacts");
        var label = nextL ? (doneN ? "Continue " : "Start ") + noun.toLowerCase() : openQuiz ? "Take the quiz" : tBest != null ? "Take the test again" : "Take the test";
        acts.appendChild(btn("kd-btn primary", label, function () {
          if (nextL) ctx.go.lesson(nextL.k); else if (openQuiz) ctx.go.quiz(openQuiz.k); else ctx.go.test();
        }));
        acts.appendChild(btn("kd-btn", "Practice a skill", function () { var sk = weakest || u.skills[0]; if (sk) ctx.go.practice(sk.id); }));
        acts.appendChild(btn("kd-btn", noun + " test", function () { ctx.go.test(); }));
        card.appendChild(acts);

        card.appendChild(h("h2", "kd-h3", "Lessons"));
        var ol = h("ol", "kd-lessons");
        lessons.forEach(function (z) {
          var l = z.l, li = h("li");
          var row = h("button", "kd-lrow" + (z.done ? " done" : "") + (nextL === z ? " cur" : ""));
          row.type = "button";
          row.innerHTML = '<span class="kd-tick">' + (z.done ? ico(I.check, 12) : "") + '</span><span class="kd-ltx"><b>' + L.fmt(l.title) + "</b><span>" + L.fmt(l.blurb || "") + "</span></span>" +
            '<span class="kd-lmeta">' + (l.tag ? esc(l.tag) + " · " : "") + plural(l.steps.length, "step") + " · about " + z.mins + ' min</span><span class="kd-lgo">' + (z.done ? "Review" : nextL === z && doneN ? "Continue" : "Start") + "</span>";
          row.addEventListener("click", function () { ctx.go.lesson(l.k); });
          li.appendChild(row); ol.appendChild(li);
          u.quizzes.filter(function (q) { return q.after === l.k; }).forEach(function (q) {
            var best = R.tests[q.unit + ":q" + q.k], qi = h("li");
            var qb = h("button", "kd-lrow quiz" + (best ? " done" : ""));
            qb.type = "button";
            qb.innerHTML = '<span class="kd-tick">' + (best ? ico(I.check, 12) : "") + '</span><span class="kd-ltx"><b>' + esc(q.title) + "</b><span>A short check on the skills so far.</span></span>" +
              '<span class="kd-lmeta">' + plural(q.skills.length * (q.per || 2), "question") + (best ? " · best " + Math.round(best.best * 100) + "%" : "") + '</span><span class="kd-lgo">' + (best ? "Again" : "Start") + "</span>";
            qb.addEventListener("click", function () { ctx.go.quiz(q.k); });
            qi.appendChild(qb); ol.appendChild(qi);
          });
        });
        var ti = h("li"), tb = h("button", "kd-lrow quiz" + (tBest != null ? " done" : ""));
        tb.type = "button";
        tb.innerHTML = '<span class="kd-tick">' + (tBest != null ? ico(I.check, 12) : "") + '</span><span class="kd-ltx"><b>' + noun + " test</b><span>One problem from every skill.</span></span>" +
          '<span class="kd-lmeta">' + plural(u.skills.length, "question") + (tBest != null ? " · best " + Math.round(tBest * 100) + "%" : "") + '</span><span class="kd-lgo">' + (tBest != null ? "Again" : "Start") + "</span>";
        tb.addEventListener("click", function () { ctx.go.test(); });
        ti.appendChild(tb); ol.appendChild(ti);
        card.appendChild(ol);

        card.appendChild(h("h2", "kd-h3", "Practice"));
        card.appendChild(h("p", "kd-sub", "Five fresh problems each time. Get four right to level a skill up; the " + noun.toLowerCase() + " test takes it the rest of the way."));
        var sg = h("div", "kd-skills");
        u.skills.forEach(function (s) {
          var lv = lev(s.id), b = h("button", "kd-skill");
          b.type = "button";
          b.innerHTML = "<b>" + L.fmt(s.title) + "</b><span>" + LEVELS[lv] + "</span>" + dots(lv);
          b.addEventListener("click", function () { ctx.go.practice(s.id); });
          sg.appendChild(b);
        });
        card.appendChild(sg);
        body.appendChild(card);
        // A unit may add to its own page (Business Unit 1 shows its concept deck).
        if (typeof u.page === "function") { try { u.page(card, ctx); } catch (e) { /* the page stands without it */ } }
      }
      paint();
      L.live.refresh = function () {
        if (!p.isConnected) return;
        STILL = true;
        try { paint(); paintNav(); } finally { STILL = false; }
      };
    }, function (e) {
      body.className = "lb-none";
      body.innerHTML = "<b>This " + noun.toLowerCase() + " is still being written.</b><p>" + esc(e.message) + "</p>";
    });
  };

  /* ============================================================== Practice */
  K.practice = function (x) {
    var p = page("kpractice", "kd-practice"), rc = record(x);
    watch("kpractice", function () { K.practice(x); });
    p.appendChild(head("Practice", "Review what is due", "Short sets of problems on skills you have already practised. Coming back to a skill after a gap is what keeps it from fading."));
    var list = skills(x), due = dueNow(list), cols = h("div", "kd-cols"), main = h("div", "kd-main"), side = h("aside", "kd-side");
    cols.appendChild(main); cols.appendChild(side); p.appendChild(cols);
    var courses = {};
    due.forEach(function (s) { courses[s.c.id] = 1; });

    var hero = h("section", "kd-card kd-todaycard"), tx = h("div", "kd-today-tx");
    tx.innerHTML = '<p class="kd-eyebrow">Today</p><div class="kd-huge">' + (due.length ? plural(due.length, "skill") : "Nothing due") + "</div>" +
      '<p class="kd-meta">' + (due.length ? "From " + plural(Object.keys(courses).length, "course") + " · five fresh problems each" : list.length ? "Your next review is on " + shortDate(Math.min.apply(null, list.map(function (s) { return s.due; }))) + "." : "Practise a skill and it will come back here.") + "</p>" +
      "<p>A skill comes back after 1, 3, 7 and 14 days as its level goes up. Practice that goes wrong takes a skill down a level, so it comes back sooner.</p>";
    if (due.length) tx.appendChild(btn("kd-btn primary", "Start review", function () { x.openLab(due[0].c, due[0].n, "Practice/" + due[0].id); }));
    hero.appendChild(tx);
    if (due.length) {
      var dark = h("div", "kd-darkcard"), f = due[0];
      dark.innerHTML = '<p class="kd-eyebrow">Up first</p><h3>' + esc(f.title) + "</h3><p>" + esc(f.c.t + " · " + f.unit) + "</p>" + dots(f.lv) +
        '<p class="kd-darkfoot">' + LEVELS[f.lv] + ". Last practised " + shortDate(f.at) + ".</p>";
      hero.appendChild(dark);
    }
    main.appendChild(hero);

    main.appendChild(h("h2", "kd-h3 pad", "Other ways to practice"));
    var ways = h("div", "kd-ways");
    function way(icon, title, sub, fn, off) {
      var b = h("button", "kd-card kd-way" + (off ? " off" : ""));
      b.type = "button";
      b.innerHTML = '<span class="kd-wayic">' + ico(icon, 20) + '</span><span class="kd-way-tx"><b>' + title + "</b><span>" + sub + "</span></span><i>" + ico(I.arrow, 16) + "</i>";
      if (off) b.setAttribute("aria-disabled", "true"); else b.addEventListener("click", fn);
      ways.appendChild(b);
    }
    var weak = list.filter(function (s) { return s.lv <= 2; }).sort(function (a, b) { return a.lv - b.lv || a.at - b.at; });
    way(I.alert, "Weak spots", weak.length ? plural(weak.length, "skill") + " still at Attempted or Familiar. Start with " + esc(weak[0].title) + "." : "Skills you are still learning show up here.",
      function () { x.openLab(weak[0].c, weak[0].n, "Practice/" + weak[0].id); }, !weak.length);
    var pick = h("div", "kd-card kd-pickbox"); pick.hidden = true;
    way(I.list, "Choose a skill", list.length ? "Pick one skill from any course you have started." : "Practise a skill first.",
      function () { pick.hidden = !pick.hidden; if (!pick.hidden && pick.scrollIntoView) pick.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, !list.length);
    var byCourse = {};
    list.forEach(function (s) { (byCourse[s.c.id] = byCourse[s.c.id] || { c: s.c, items: [] }).items.push(s); });
    Object.keys(byCourse).forEach(function (id) {
      var g = byCourse[id], sec = h("div", "kd-pickcourse", "<h4>" + esc(g.c.t) + "</h4>");
      g.items.sort(function (a, b) { return a.n - b.n; }).forEach(function (s) {
        sec.appendChild(btn("kd-pickrow", "<b>" + esc(s.title) + "</b><span>" + esc(s.unit) + "</span>" + dots(s.lv), function () { x.openLab(s.c, s.n, "Practice/" + s.id); }));
      });
      pick.appendChild(sec);
    });
    var latest = x.own().map(function (c) { return model(x, c, rc); }).filter(function (m) { return m.lab && m.c.lab; }).sort(function (a, b) { return b.last - a.last; })[0];
    way(I.grid, "Course challenge", latest ? "Two problems from every unit of " + esc(latest.c.t) + "." : "Start a course to unlock its challenge.",
      function () { x.openLab(latest.c, null, "Challenge"); }, !latest);
    if (x.S.mistakes.length) way(I.book, "Mistake book", plural(x.S.mistakes.length, "thing") + " you got wrong, kept so you can go back to them.", function () { x.openMistakes(); });
    main.appendChild(ways);
    main.appendChild(pick);

    // The week ahead.
    var days = [0, 0, 0, 0, 0, 0, 0], t0 = dayStart(Date.now());
    list.forEach(function (s) { var i = Math.max(0, Math.floor((dayStart(s.due) - t0) / DAY)); if (i < 7) days[i]++; });
    var top = Math.max(1, Math.max.apply(null, days)), chart = h("section", "kd-card kd-chart");
    chart.innerHTML = '<p class="kd-eyebrow">Next 7 days</p><ol class="kd-bars">' + days.map(function (n, i) {
      var nm = i === 0 ? "Today" : new Date(t0 + i * DAY).toLocaleDateString(undefined, { weekday: "short" });
      return '<li class="' + (i === 0 ? "today" : "") + '"><b>' + n + '</b><i style="height:' + Math.max(3, Math.round(n / top * 100)) + 'px"></i><span>' + nm + "</span></li>";
    }).join("") + "</ol>";
    side.appendChild(chart);
    var dl = h("section", "kd-card kd-duelist");
    dl.innerHTML = '<p class="kd-eyebrow">Due today</p>';
    if (due.length) due.slice(0, 8).forEach(function (s) { dl.appendChild(btn("kd-duerow", "<b>" + esc(s.title) + "</b>" + dots(s.lv), function () { x.openLab(s.c, s.n, "Practice/" + s.id); })); });
    else dl.appendChild(h("p", "kd-none", "Nothing is due today."));
    side.appendChild(dl);
  };

  /* ============================================================== Progress */
  K.progress = function (x) {
    var p = page("progress", "kd-prog"), R = x.R, g = R.d.game, rc = record(x);
    watch("progress", function () { K.progress(x); });
    p.appendChild(head("Progress", "Your skills", "Each skill has a level from 1 to 4. A level goes up when you answer correctly, and a skill you have not seen for a while comes back to Practice."));
    var list = skills(x), lessons = 0;
    x.courses().forEach(function (c) { lessons += model(x, c, rc).done; });
    var stats = h("section", "kd-card kd-statrow");
    [[lessons, "Lessons completed"], [list.length, "Skills practised"], [list.filter(function (s) { return s.lv >= 4; }).length, "Skills mastered"], [g.best + (g.best === 1 ? " day" : " days"), "Longest streak"]].forEach(function (s) {
      stats.insertAdjacentHTML("beforeend", "<div><span>" + s[1] + "</span><b>" + s[0] + "</b></div>");
    });
    p.appendChild(stats);
    var cols = h("div", "kd-cols wide"), main = h("div", "kd-main"), side = h("aside", "kd-side");
    cols.appendChild(main); cols.appendChild(side); p.appendChild(cols);

    var byCourse = {}, order = [];
    list.forEach(function (s) { if (!byCourse[s.c.id]) { byCourse[s.c.id] = { c: s.c, items: [] }; order.push(s.c.id); } byCourse[s.c.id].items.push(s); });
    var card = h("section", "kd-card kd-skilltab");
    if (!order.length) card.appendChild(h("p", "kd-none", "No skills yet. Practise a skill from a unit and it will be listed here, with when it comes back."));
    order.forEach(function (id) {
      var g1 = byCourse[id], blk = h("div", "kd-skillblock");
      blk.appendChild(sechead(g1.c.t, "Open map", function () { x.openCourse(g1.c); }));
      var tbl = h("table"), body = "";
      tbl.innerHTML = "<thead><tr><th>Skill</th><th>Level</th><th>Last practised</th><th>Next review</th></tr></thead>";
      g1.items.sort(function (a, b) { return a.n - b.n; }).forEach(function (s) {
        body += '<tr data-id="' + esc(s.id) + '"><td><b>' + esc(s.title) + "</b><span>" + esc(s.unit) + "</span></td><td>" + dots(s.lv) + "</td><td>" + shortDate(s.at) + "</td><td>" +
          (s.today ? '<span class="kd-pill amber">Due today</span>' : shortDate(s.due)) + "</td></tr>";
      });
      var tb = h("tbody", null, body);
      [].forEach.call(tb.children, function (tr) {
        var s = g1.items.filter(function (z) { return z.id === tr.dataset.id; })[0];
        tr.tabIndex = 0;
        tr.addEventListener("click", function () { x.openLab(s.c, s.n, "Practice/" + s.id); });
        tr.addEventListener("keydown", function (e) { if (e.key === "Enter") x.openLab(s.c, s.n, "Practice/" + s.id); });
      });
      tbl.appendChild(tb);
      blk.appendChild(tbl);
      card.appendChild(blk);
    });
    main.appendChild(card);

    // Experience, week by week.
    var weeks = [], today = dayStart(Date.now());
    for (var w = 7; w >= 0; w--) {
      var s0 = today - (w * 7 + 6) * DAY, tot = 0;
      for (var d = 0; d < 7; d++) tot += g.days[x.ST.today(s0 + d * DAY)] || 0;
      weeks.push({ at: s0, xp: tot });
    }
    var topX = Math.max(1, Math.max.apply(null, weeks.map(function (z) { return z.xp; })));
    var xc = h("section", "kd-card kd-chart");
    xc.innerHTML = '<p class="kd-eyebrow">XP per week</p><ol class="kd-bars tall">' + weeks.map(function (z, i) {
      return '<li class="' + (i === 7 ? "today" : "") + '"><b>' + (i === 7 ? num(z.xp) : "") + '</b><i style="height:' + Math.max(4, Math.round(z.xp / topX * 120)) + 'px" title="' + num(z.xp) + ' XP"></i></li>';
    }).join("") + '</ol><p class="kd-axis"><span>Week of ' + shortDate(weeks[0].at) + "</span><span>" + shortDate(Date.now()) + "</span></p>";
    side.appendChild(xc);
    var lv = h("section", "kd-card kd-levels");
    lv.innerHTML = '<p class="kd-eyebrow">Levels</p>' + [1, 2, 3, 4].map(function (n) {
      return "<div>" + dots(n) + "<span>" + LEVELS[n] + ". Back in " + plural(INTERVAL[n], "day") + ".</span></div>";
    }).join("");
    side.appendChild(lv);

    // What has been earned: the badges.
    var B = (window.OPLO_GAME && window.OPLO_GAME.BADGES) || [];
    if (B.length) {
      var earned = B.filter(function (b) { return g.badges[b.k]; });
      var bc = h("section", "kd-card kd-badges");
      bc.innerHTML = '<p class="kd-eyebrow">Badges · ' + earned.length + " of " + B.length + "</p>";
      B.forEach(function (b) {
        var has = !!g.badges[b.k];
        bc.insertAdjacentHTML("beforeend", '<div class="' + (has ? "on" : "") + '"><i>' + (has ? ico(I.check, 12) : "") + "</i><span><b>" + esc(b.name) + "</b>" + esc(b.say) + "</span></div>");
      });
      side.appendChild(bc);
    }
    x.noFoot(); x.progress(null);
    if (!STILL) x.show("progress");
  };

  /* ================================================================== Tutor
     The tutor itself is the panel app.js already runs (tutor.js has the rules);
     on this page the panel is moved in and shown as the page. */
  K.tutor = function (x) {
    var p = page("ktutor", "kd-tutorpage"), c = x.S.course;
    var cols = h("div", "kd-tcols"), side = h("aside", "kd-card kd-youon"), chat = h("div", "kd-chat");
    cols.appendChild(side); cols.appendChild(chat); p.appendChild(cols);
    side.innerHTML = '<p class="kd-eyebrow">You are on</p>' + (c ? "<h3>" + esc(c.t) + "</h3><p>" + esc(x.S.unit ? K.noun(c) + " " + x.S.unit.n + ", " + x.S.unit.t : "The course page") + "</p>" :
      "<h3>Nothing open</h3><p>Open a lesson and ask from there; the tutor reads where you are.</p>");
    if (c) side.appendChild(btn("kd-btn wide", x.S.unit ? "Back to the lesson" : "Back to the course", function () { if (x.S.unit) x.openUnit(c, x.S.unit.n); else x.openCourse(c); }));
    side.appendChild(h("hr"));
    side.appendChild(h("p", "kd-small", "The tutor asks questions and gives hints. If you want the answer, ask for it. It runs on your own machine, so nothing you type is sent anywhere."));
    K.dock = chat;
  };

  /* ===================================================== Moving between pages */
  K.open = function (x, view) {
    x = x || (K.ctx && K.ctx());
    if (!x) return;
    if (view === "kpractice") x.openPractice();
    else if (view === "ktutor") x.openTutor();
  };

  /* What the bar shows: the streak, the experience, and who is signed in. */
  K.paintBar = function (g, me) {
    var bar = document.querySelector(".lx-bar-in");
    if (!bar) return;
    var s = document.getElementById("streak"), u = document.getElementById("streakUnit");
    if (s && !u) { u = h("span", "lx-streak-unit"); u.id = "streakUnit"; s.parentNode.appendChild(u); }
    if (u && g) u.textContent = g.streak === 1 ? " day" : " days";
    var xp = document.getElementById("xpChip");
    if (g) {
      K.xp = num(g.xp) + " XP";
      if (xp) { xp.hidden = false; xp.lastElementChild.textContent = K.xp; }
      [].forEach.call(document.querySelectorAll(".kd-lbar .kd-xp"), function (n) { n.hidden = false; n.lastElementChild.textContent = K.xp; });
    }
    var av = document.querySelector("#user .av");
    if (av && me && me.first && !av.textContent) av.textContent = String(me.first).charAt(0).toUpperCase();
  };

  /* The page about to show. The tutor lives in one place at a time: its own
     page, or the drawer beside a lesson. The top bar's "you are here" follows
     the section a deeper page belongs to. */
  K.onShow = function (view) {
    var tt = document.getElementById("tt"), dock = K.dock;
    var onPage = view === "ktutor" && dock && document.getElementById("v-ktutor").contains(dock);
    if (tt) {
      if (onPage) {
        if (tt.parentNode !== dock) dock.appendChild(tt);
        tt.classList.add("docked");
        tt.hidden = false;
        if (K.tutorOpen) K.tutorOpen();
      } else if (tt.classList.contains("docked")) {
        tt.classList.remove("docked");
        document.body.appendChild(tt);
        if (K.tutorClose) K.tutorClose(); else tt.hidden = true;
      }
    }
    document.documentElement.setAttribute("data-kview", view);
    var into = { course: "explore", unit: "explore", subject: "explore", map: "explore", lab: "explore", set: "explore" }[view];
    if (into) [].forEach.call(document.querySelectorAll("#topNav button"), function (b) { b.setAttribute("aria-current", String(b.dataset.view === into)); });
  };

  /* ================================================== The header over a lesson
     A way out, where this is, a segment for each step, your experience, and
     the tutor. Used for a lesson, a practice set, a quiz and a test; a lesson's
     segments can be pressed to go back to a step already reached.

     o.trail  "Algebra I · Unit 3"
     o.exit   leave and go back to where the work came from
     o.go     (step) go to that step; leave out for a run whose steps are not walked
     returns { el, set(info, ix) } — the player reports its steps to set()        */
  K.lessonBar = function (o) {
    var el = h("header", "kd-lbar"), left = h("div", "kd-lbar-l"), mid = h("ol", "kd-lsegs"), right = h("div", "kd-lbar-r");
    var exit = btn("kd-lexit", ico(I.x, 16) + "<span>Exit</span>", o.exit);
    exit.setAttribute("aria-label", "Exit and go back");
    left.appendChild(exit);
    left.appendChild(h("span", "kd-llab", esc(o.trail || "")));
    mid.setAttribute("aria-label", "Steps");
    var xp = h("span", "kd-xp", ico(I.xp, 14) + "<span>" + esc(K.xp || "") + "</span>");
    xp.hidden = !K.xp;
    right.appendChild(xp);
    right.appendChild(btn("kd-ask", "Ask tutor", function () { if (K.tutorOpen) K.tutorOpen(); }));
    el.appendChild(left); el.appendChild(mid); el.appendChild(right);

    var segs = [], last = [];
    function set(info, ix) {
      last = info || [];
      if (segs.length !== last.length) {
        mid.innerHTML = ""; segs = [];
        last.forEach(function (st, i) {
          var li = h("li"), s;
          if (o.go) s = btn("kd-lseg", "", function () { var cur = last[i]; if (cur && cur.open) o.go(cur); });
          else s = h("span", "kd-lseg");
          li.appendChild(s); mid.appendChild(li); segs.push(s);
        });
      }
      last.forEach(function (st, i) {
        var s = segs[i];
        s.className = "kd-lseg" + (st.current ? " cur" : "") + (st.state ? " " + st.state : "");
        if (!o.go) return;
        s.disabled = !st.open;
        s.title = st.label;
        s.setAttribute("aria-label", st.label + (st.state ? ", done" : "") + (st.open ? "" : ", not reached yet"));
        if (st.current) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current");
      });
    }
    return { el: el, set: set };
  };
})();
