/* ==========================================================================
   Knowledge map.

   A progress bar tells a student how far down a list they are. A map tells
   them something more useful: where they can go from here. Everything on this
   screen answers one of four questions, and nothing on it is decoration:

     WHERE AM I        every unit is an orb that fills as it is mastered
     WHAT IS OPEN      a unit lights up once the units under it hold up
     WHAT IS SLIPPING  concepts that were known and are now overdue go amber
     WHAT IS NEXT      three missions, each worth what the game layer pays

   It is gamified on game.js's terms, never its own. Nothing here awards
   anything. The XP a mission shows is what the questions behind it would pay;
   the one bonus it advertises is the one game.js actually has, for being right
   after a gap; and a unit is never locked shut. "Needs Unit 2" is advice, and
   a student who opens the unit anyway is allowed to.

   The excitement is honest too. What changed since the last visit is found by
   comparing against a snapshot, so a "+12" floating off a unit is a number the
   student earned, not an animation that plays for everybody.

   This file decides and draws. app.js hands it the numbers and decides where
   a click goes, so the same map can later be drawn for a teacher looking at a
   student without being in that student's browser.
   ========================================================================== */
window.OPLO_KMAP = (function () {
  "use strict";

  // app.js's thresholds, so the map, the course page and "your next step"
  // never disagree about what counts as mastered or as holding up.
  var MASTERED = 85, HOLDS = 50;

  var LADDER = ["recognise", "recall", "explain", "apply", "transfer"];
  var RUNG = { recognise: "Recognise", recall: "Recall", explain: "Explain",
               apply: "Apply", transfer: "Transfer" };
  var TIER = ["Foundations", "Built on those", "Built higher", "At the top"];

  var ICON = {
    tick:   '<path d="M5 12.5 10 17.5 19 7"/>',
    lock:   '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    flame:  '<path d="M12 21.5c-4 0-6.8-2.7-6.8-6.4 0-3.4 2.5-5.6 4-8 .5 1.8 1.6 3 2.7 3.5.3-2.8 1.5-5.4 3.8-7.6.5 3.3 3.1 5.4 3.1 10.3 0 4.5-2.8 8.2-6.8 8.2z"/>',
    spark:  '<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.6 2.6M15.4 15.4 18 18M18 6l-2.6 2.6M8.6 15.4 6 18"/>',
    clock:  '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    bolt:   '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    flag:   '<path d="M6 21V4"/><path d="M6 4.5h11l-2.5 4 2.5 4H6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
    arrow:  '<path d="M4.5 12h14"/><path d="M13 6.5 18.5 12 13 17.5"/>',
    dot:    '<circle cx="12" cy="12" r="2.6"/>'
  };
  function icon(k, filled) {
    return '<svg viewBox="0 0 24 24" fill="' + (filled ? "currentColor" : "none") + '" stroke="' +
      (filled ? "none" : "currentColor") + '" stroke-width="1.8" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + ICON[k] + "</svg>";
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function num(a, b) { return a - b; }
  function list(names) {
    if (names.length < 2) return names.join("");
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }

  /* How far from the ground each thing sits: nothing under it is 0, and
     anything else is one more than the highest thing it rests on. A cycle in
     authored data draws flat rather than hanging the page. */
  function depths(keys, under) {
    var memo = {}, busy = {};
    function d(k) {
      if (memo[k] != null) return memo[k];
      if (busy[k]) return 0;
      busy[k] = true;
      var v = 0;
      (under(k) || []).forEach(function (p) {
        if (keys.indexOf(p) > -1) v = Math.max(v, d(p) + 1);
      });
      busy[k] = false;
      return (memo[k] = v);
    }
    keys.forEach(d);
    return memo;
  }

  /* ================================================================ Model */

  /* One concept, read off its learning-engine state. "Fading" is narrower
     than "due": it is something that was actually known — strength of a half
     or more — and is now overdue. A concept seen once and never learned is
     not slipping; it was never there. */
  function conceptOf(c, L, now) {
    var s = c.state, seen = !!(s && s.seen);
    var m = seen ? L.mastery(s, now) : 0;
    var b = seen ? L.band(m) : L.BANDS[0];
    var levels = c.levels || LADDER.slice(0, 2);
    return {
      k: c.k, def: c.def || "", why: c.why || null, pre: c.pre || [],
      seen: seen, m: Math.round(m * 100), band: b, bi: L.BANDS.indexOf(b),
      flagged: !!(s && s.flagged),
      fading: seen && L.strength(s) >= 0.5 && L.due(s, now),
      when: seen ? L.when(s, now) : null,
      ladder: LADDER.map(function (lv) {
        return { k: lv, can: levels.indexOf(lv) > -1, has: !!(s && s[lv] >= 0.6) };
      }),
      depth: 0
    };
  }

  /* o = { units: [{ n, t, part, desc, live, set }], pre: { n: [n] },
           mastery(n) -> 0-100, concepts(n) -> [{ k, def, why, pre, levels, state }],
           sections(n) -> { done, total } | null, L, G, now } */
  function build(o) {
    var L = o.L, now = o.now || Date.now(), pre = o.pre || {}, byN = {};

    var units = o.units.map(function (u) {
      var concepts = (u.live && o.concepts ? (o.concepts(u.n) || []) : [])
        .map(function (c) { return conceptOf(c, L, now); });
      var ks = concepts.map(function (c) { return c.k; });
      var cd = depths(ks, function (k) { return concepts[ks.indexOf(k)].pre; });
      var count = { total: concepts.length, mastered: 0, strong: 0, developing: 0,
                    started: 0, fresh: 0, fading: 0, flagged: 0 };
      concepts.forEach(function (c) {
        c.depth = cd[c.k] || 0;
        if (!c.seen) count.fresh++;
        else if (c.band.k === "mastered") count.mastered++;
        else if (c.band.k === "strong") count.strong++;
        else if (c.band.k === "developing") count.developing++;
        else count.started++;
        if (c.fading) count.fading++;
        if (c.flagged) count.flagged++;
      });
      var x = { n: u.n, t: u.t, part: u.part || null, desc: u.desc || null,
                live: !!u.live, set: u.set || null,
                m: u.live ? Math.round(o.mastery(u.n)) : 0,
                pre: (pre[u.n] || []).slice(), concepts: concepts, count: count,
                sections: u.live && o.sections ? o.sections(u.n) : null };
      byN[u.n] = x;
      return x;
    });

    var nums = units.map(function (u) { return u.n; });
    var dep = depths(nums, function (n) { return byN[n] ? byN[n].pre : []; });
    units.forEach(function (u) {
      u.depth = dep[u.n] || 0;
      // Only ground that can actually be laid counts against a unit. A
      // syllabus-only unit underneath cannot be studied, so it cannot block.
      u.weak = u.pre.map(function (p) { return byN[p]; })
        .filter(function (p) { return p && p.live && p.m < HOLDS; })[0] || null;
      u.status = !u.live ? "unwritten"
        : u.m >= MASTERED ? (u.count.fading ? "fading" : "mastered")
        : u.m > 0 ? "active"
        : u.weak ? "locked" : "ready";
    });

    // The same walk as app.js's nextStep: the first unit not yet mastered, or
    // the ground under it if that ground does not hold. When everything is
    // mastered, the next step is whatever is slipping most.
    var next = null;
    units.forEach(function (u) {
      if (next || !u.live || u.m >= MASTERED) return;
      next = u.weak || u;
    });
    if (!next) {
      next = units.filter(function (u) { return u.count.fading; })
        .sort(function (a, b) { return b.count.fading - a.count.fading; })[0] || null;
    }

    var live = units.filter(function (u) { return u.live; });
    var stats = { units: live.length, mastered: 0, started: 0, ready: 0, pct: 0,
                  concepts: 0, cMastered: 0, fading: 0, flagged: 0 };
    live.forEach(function (u) {
      if (u.m >= MASTERED) stats.mastered++;
      if (u.m > 0) stats.started++;
      if (u.status === "ready") stats.ready++;
      stats.pct += u.m;
      stats.concepts += u.count.total;
      stats.cMastered += u.count.mastered;
      stats.fading += u.count.fading;
      stats.flagged += u.count.flagged;
    });
    stats.pct = live.length ? Math.round(stats.pct / live.length) : 0;

    var model = { units: units, byN: byN, next: next, stats: stats,
                  graph: units.some(function (u) { return u.pre.length; }) };
    model.missions = missions(model, o.G);
    return model;
  }

  /* ============================================================= Missions
     At most three, in the order that is worth the most to a student's
     understanding — which is also the order game.js pays best for:
     rescuing what is slipping, then undoing a confident mistake, then the
     next step, then pushing something strong over the line. */
  function missions(model, G) {
    var BASE = (G && G.BASE) || { recognise: 6, recall: 10, explain: 16, apply: 20, transfer: 26 };
    var live = model.units.filter(function (u) { return u.live; }), out = [];
    function concepts(test) {
      var r = [];
      live.forEach(function (u) {
        u.concepts.forEach(function (c) { if (test(c)) r.push({ c: c, u: u }); });
      });
      return r;
    }

    var fading = live.filter(function (u) { return u.count.fading && u.set; })
      .sort(function (a, b) { return b.count.fading - a.count.fading; })[0];
    if (fading) {
      var nf = fading.count.fading;
      out.push({ kind: "fading", icon: "clock", unit: fading.n, set: fading.set,
        title: "Bring back " + plural(nf, "fading concept", "fading concepts"),
        say: "Unit " + fading.n + ". Right after a gap pays ×1.5 — the one bonus the game has.",
        xp: Math.round(Math.min(nf, 8) * BASE.recall * 1.5) });
    }

    var flagged = concepts(function (c) { return c.flagged; })[0];
    if (flagged && flagged.u.set) {
      out.push({ kind: "flagged", icon: "flag", unit: flagged.u.n, set: flagged.u.set,
        title: "Rethink “" + flagged.c.k + "”",
        say: "You were sure, and it was wrong. Turning that round earns Changed your mind.",
        xp: BASE.apply });
    }

    var nx = model.next;
    if (nx && nx.status === "ready") {
      var ground = nx.pre.map(function (p) { return model.byN[p]; })
        .filter(function (g) { return g && g.live; });
      out.push({ kind: "open", icon: "bolt", unit: nx.n, set: nx.set,
        title: "Open Unit " + nx.n + ": " + nx.t,
        say: ground.length
          ? "Its ground holds — " + list(ground.map(function (g) { return "Unit " + g.n + " at " + g.m + "%"; })) + "."
          : "Nothing stands in front of it. A good place to begin.",
        xp: null });
    } else if (nx && nx.status === "active") {
      var leans = model.units.filter(function (u) { return u.weak === nx; })[0];
      out.push({ kind: "finish", icon: "target", unit: nx.n, set: nx.set,
        title: "Finish Unit " + nx.n + ": " + nx.t,
        say: nx.m + "% now, " + (MASTERED - nx.m) + " points from mastered." +
             (leans ? " Unit " + leans.n + " leans on it." : ""),
        xp: null });
    }

    var close = concepts(function (c) { return c.seen && c.band.k === "strong" && !c.fading; })
      .sort(function (a, b) { return b.c.m - a.c.m; })[0];
    if (close && close.u.set) {
      var rung = close.c.ladder.filter(function (l) { return l.can && !l.has; }).pop();
      out.push({ kind: "push", icon: "target", unit: close.u.n, set: close.u.set,
        title: "Take “" + close.c.k + "” to Mastered",
        say: "Strong at " + close.c.m + "%. " + (rung
          ? RUNG[rung.k] + " is the rung still open."
          : "Holding it after a gap finishes it."),
        xp: BASE[rung ? rung.k : "recall"] });
    }
    return out.slice(0, 3);
  }

  /* ============================================================= Changes
     What the map looked like the last time it was drawn, small enough to
     keep in localStorage for every course a student has. */
  function snapshot(model) {
    var s = { at: Date.now(), u: {}, c: {} };
    model.units.forEach(function (u) {
      if (!u.live) return;
      s.u[u.n] = u.m;
      u.concepts.forEach(function (c) { if (c.seen) s.c[u.n + ":" + c.k] = c.bi; });
    });
    return s;
  }

  function diff(prev, model) {
    if (!prev || !prev.u) return null;
    var units = [], concepts = [];
    model.units.forEach(function (u) {
      if (!u.live) return;
      var was = prev.u[u.n];
      if (was != null && u.m > was) units.push({ n: u.n, t: u.t, from: was, to: u.m });
      u.concepts.forEach(function (c) {
        var b = prev.c[u.n + ":" + c.k];
        if (c.seen && c.bi > (b == null ? 0 : b)) concepts.push({ n: u.n, k: c.k, band: c.band });
      });
    });
    return units.length || concepts.length ? { at: prev.at, units: units, concepts: concepts } : null;
  }

  function since(at) {
    var days = Math.floor((Date.now() - at) / 864e5);
    if (days < 1) return "earlier today";
    if (days === 1) return "yesterday";
    if (days < 7) return new Date(at).toLocaleDateString(undefined, { weekday: "long" });
    return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  /* =============================================================== Layout
     Two layouts are computed and both are drawn; a container query picks
     one. Wide, depth runs left to right, so an arrow always points forward,
     and a course with no prerequisites written becomes a trail that snakes in
     reading order.

     Narrow, the map becomes a path: one column in the order the ground is
     laid, each name beside its orb. A branching graph squeezed into a phone's
     width has lines crossing names and skipping through other units, and a
     map that has to be deciphered has stopped being a map. What each unit
     rests on is still said, in words, under its name. */
  var H = { col: 158, row: 150, pad: 16, top: 88, foot: 126 };
  var V = { x: 56, row: 104, top: 56, foot: 60 };

  function layout(model) {
    var units = model.units, pos = {}, edges = [], w, h, vh;
    if (model.graph) {
      var cols = {};
      units.forEach(function (u) { (cols[u.depth] = cols[u.depth] || []).push(u); });
      var ds = Object.keys(cols).map(Number).sort(num);
      var most = Math.max.apply(null, ds.map(function (d) { return cols[d].length; }));
      ds.forEach(function (d, di) {
        var col = cols[d], off = (most - col.length) / 2;
        col.forEach(function (u, i) {
          pos[u.n] = { x: H.pad + di * H.col + H.col / 2, y: H.top + (i + off) * H.row };
        });
      });
      units.forEach(function (u) {
        u.pre.forEach(function (p) { if (pos[p]) edges.push({ from: p, to: u.n }); });
      });
      w = H.pad * 2 + ds.length * H.col;
      h = H.top + (most - 1) * H.row + H.foot;
    } else {
      var perH = 4;
      units.forEach(function (u, i) {
        var r = Math.floor(i / perH), c = r % 2 ? perH - 1 - i % perH : i % perH;
        pos[u.n] = { x: H.pad + c * H.col + H.col / 2, y: H.top + r * H.row };
        if (i) edges.push({ from: units[i - 1].n, to: u.n });
      });
      w = H.pad * 2 + Math.min(units.length, perH) * H.col;
      h = H.top + (Math.ceil(units.length / perH) - 1) * H.row + H.foot;
    }
    var path = units.slice().sort(function (a, b) { return a.depth - b.depth || a.n - b.n; });
    path.forEach(function (u, i) { pos[u.n].vy = V.top + i * V.row; });
    var vedges = path.slice(1).map(function (u, i) { return { from: path[i].n, to: u.n }; });
    vh = V.top + (path.length - 1) * V.row + V.foot;
    return { pos: pos, edges: edges, vedges: vedges, w: w, h: h, vh: vh };
  }

  function hcurve(a, b, w) {
    if (Math.abs(b.x - a.x) < 1) {                 // a trail turning a corner
      var k = a.x > w / 2 ? 86 : -86;
      return "M" + a.x + " " + a.y + " C" + (a.x + k) + " " + a.y + " " + (b.x + k) + " " +
             b.y + " " + b.x + " " + b.y;
    }
    var dx = (b.x - a.x) / 2;
    return "M" + a.x + " " + a.y + " C" + (a.x + dx) + " " + a.y + " " + (b.x - dx) + " " +
           b.y + " " + b.x + " " + b.y;
  }

  /* A path is lit once the unit it leaves holds up, and it flows — a slow
     current along the line — into whatever that has just opened. */
  function edgesSvg(model, lay, vertical) {
    var s = '<svg class="km-edges ' + (vertical ? "v" : "h") + '" aria-hidden="true"' +
      (vertical ? "" : ' viewBox="0 0 ' + lay.w + " " + lay.h + '"') + ">";
    (vertical ? lay.vedges : lay.edges).forEach(function (e, i) {
      var a = model.byN[e.from], b = model.byN[e.to];
      var pa = lay.pos[e.from], pb = lay.pos[e.to];
      var d = vertical ? "M" + V.x + " " + pa.vy + " L" + V.x + " " + pb.vy : hcurve(pa, pb, lay.w);
      var lit = a.live && a.m >= HOLDS;
      var flow = lit && b.live && b.m < MASTERED && (b.status === "ready" || model.next === b);
      s += '<path class="' + (lit ? "lit" : "dim") + '" d="' + d + '" pathLength="1" style="--i:' + i + '"/>';
      if (flow) s += '<path class="flow" d="' + d + '" pathLength="1"/>';
    });
    return s + "</svg>";
  }

  /* ================================================================ Nodes */
  function ring(pct, r, box) {
    var c = box / 2;
    return '<svg viewBox="0 0 ' + box + " " + box + '" aria-hidden="true">' +
      '<circle class="trk" cx="' + c + '" cy="' + c + '" r="' + r + '"/>' +
      (pct ? '<circle class="arc" cx="' + c + '" cy="' + c + '" r="' + r + '" pathLength="100" ' +
             'stroke-dasharray="' + pct + ' 100" transform="rotate(-90 ' + c + " " + c + ')"/>' : "") +
      "</svg>";
  }

  function stateLine(u) {
    return {
      mastered: "Mastered",
      fading: plural(u.count.fading, "concept fading", "concepts fading"),
      active: u.m + "%" + (u.count.fading ? " · " + u.count.fading + " fading" : ""),
      ready: "Ready to open",
      locked: "Needs Unit " + (u.weak ? u.weak.n : ""),
      unwritten: "Not written yet"
    }[u.status];
  }

  function nodeEl(u, model, p, i, up) {
    var here = model.next === u;
    var b = el("button", "km-node s-" + u.status + (here ? " is-here" : "") + (up ? " is-up" : ""));
    b.type = "button";
    b.dataset.n = u.n;
    b.style.cssText = "--x:" + p.x + "px;--y:" + p.y + "px;--vy:" + p.vy + "px;--i:" + i;
    var line = stateLine(u);
    b.setAttribute("aria-label", "Unit " + u.n + ", " + u.t + ". " + line +
      (u.m && u.status !== "active" ? ", " + u.m + " percent" : "") + (here ? ". Your next step." : ""));
    var core = u.status === "mastered" || u.status === "fading" ? icon("tick") : String(u.n);
    b.innerHTML =
      (here ? '<span class="km-flag">' + (u.status === "fading" ? "Review" : "Next") + "</span>" : "") +
      '<span class="km-orb">' + ring(u.m, 34, 80) + '<span class="km-core">' + core + "</span>" +
        (u.count.fading ? '<span class="km-pip fade">' + u.count.fading + "</span>"
         : u.count.flagged ? '<span class="km-pip flag">!</span>' : "") +
        (u.status === "locked" ? '<span class="km-lock">' + icon("lock") + "</span>" : "") +
      "</span>" +
      '<span class="km-txt"><span class="km-name">' + esc(u.t) + "</span>" +
      '<span class="km-state">' + esc(line) + "</span></span>" +
      (up ? '<span class="km-delta">+' + up + "</span>" : "");
    return b;
  }

  /* ================================================================ Sheet
     The unit being looked at: how far along, what it rests on, and every
     concept inside it as a pill whose five dots are the five rungs of the
     learning engine — the one place the student can see which kind of
     knowing is still missing, not just how much. */
  function sheetFor(u, model, o) {
    var s = el("div", "km-sheet-in");
    var tag = { mastered: "Mastered", fading: "Fading", active: "In progress", ready: "Ready",
                locked: "Needs ground", unwritten: "Not written" }[u.status];
    var say = {
      mastered: "Mastered. A review after a gap keeps it that way, and pays the most.",
      fading: "Mastered, but " + plural(u.count.fading, "concept is", "concepts are") +
              " slipping. A review right after a gap pays ×1.5.",
      active: u.m + "% so far — " + (MASTERED - u.m) + " more points and it is mastered." +
              (u.weak ? " It leans on Unit " + u.weak.n + ", which is only at " + u.weak.m + "%." : ""),
      ready: u.pre.length ? "Its ground holds up: everything it rests on is at " + HOLDS + "% or better."
                          : "Nothing stands in front of it. A good place to begin.",
      locked: u.weak ? "It rests on Unit " + u.weak.n + ", " + u.weak.t + ", which is at " + u.weak.m +
              "%. Getting that to " + HOLDS + "% first is faster than pushing on and coming back." : "",
      unwritten: "The syllabus names it, but there is no material behind it yet."
    }[u.status];

    var facts = [];
    if (u.count.total) facts.push("<li><b>" + u.count.mastered + "</b> of " + u.count.total + " concepts mastered</li>");
    if (u.sections) facts.push("<li><b>" + u.sections.done + "</b> of " + u.sections.total + " sections read</li>");
    if (u.count.fading) facts.push('<li class="amber"><b>' + u.count.fading + "</b> fading</li>");
    if (u.count.flagged) facts.push('<li class="red"><b>' + u.count.flagged + "</b> confident " +
      (u.count.flagged === 1 ? "mistake" : "mistakes") + "</li>");
    if (!facts.length) facts.push("<li>" + (u.live ? "Practice problems" : "Syllabus only") + "</li>");

    s.innerHTML =
      '<p class="km-eyebrow">Unit ' + u.n + (u.part ? " · " + esc(u.part) : "") +
        ' <span class="km-tag s-' + u.status + '">' + tag + "</span></p>" +
      '<h2 class="km-sheet-h">' + esc(u.t) + "</h2>" +
      '<div class="km-sheet-top"><div class="km-big">' + ring(u.m, 44, 100) +
        "<b>" + (u.live ? u.m + "<small>%</small>" : "—") + "</b></div>" +
        '<ul class="km-facts">' + facts.join("") + "</ul></div>" +
      '<p class="km-say">' + esc(say) + "</p>";

    var acts = el("div", "km-acts");
    function btn(label, cls, fn) {
      var b = el("button", "lx-btn" + (cls ? " " + cls : ""), esc(label));
      b.type = "button";
      b.addEventListener("click", fn);
      acts.appendChild(b);
    }
    if (u.status === "locked" && u.weak) {
      btn("Go to Unit " + u.weak.n + " first", "", function () { o.onUnit(u.weak.n); });
      btn("Open anyway", "quiet", function () { o.onUnit(u.n); });
    } else if (u.status === "fading" && u.set) {
      btn("Review what is fading", "", function () { o.onLearn(u.set, u.n); });
      btn("Open unit", "quiet", function () { o.onUnit(u.n); });
    } else if (u.live) {
      btn(u.status === "ready" ? "Start this unit" : u.status === "mastered" ? "Open unit" : "Continue",
          "", function () { o.onUnit(u.n); });
      if (u.set && u.status !== "ready") btn("Learn the terms", "quiet", function () { o.onLearn(u.set, u.n); });
    } else {
      btn("See what it covers", "quiet", function () { o.onUnit(u.n); });
    }
    s.appendChild(acts);

    if (u.concepts.length) {
      s.appendChild(el("h3", "km-sub", "Concepts"));
      s.appendChild(el("p", "km-subp", "Each dot is a rung: recognise, recall, explain, apply, transfer. " +
        "Tap one to see what is missing."));
      var tiers = {};
      u.concepts.forEach(function (c, i) { c.i = i; (tiers[c.depth] = tiers[c.depth] || []).push(c); });
      var keys = Object.keys(tiers).map(Number).sort(num);
      var wrap = el("div", "km-tiers"), card = el("div");
      keys.forEach(function (d) {
        var t = el("div", "km-tier");
        if (keys.length > 1) t.appendChild(el("span", null, TIER[Math.min(d, TIER.length - 1)]));
        var row = el("div", "km-pills");
        tiers[d].forEach(function (c) { row.appendChild(pill(c)); });
        t.appendChild(row);
        wrap.appendChild(t);
      });
      wrap.addEventListener("click", function (e) {
        var p = e.target.closest(".km-c");
        if (!p) return;
        var was = p.classList.contains("on");
        [].forEach.call(wrap.querySelectorAll(".km-c.on"), function (x) {
          x.classList.remove("on");
          x.setAttribute("aria-expanded", "false");
        });
        card.innerHTML = "";
        if (was) return;
        p.classList.add("on");
        p.setAttribute("aria-expanded", "true");
        card.appendChild(conceptCard(u.concepts[+p.dataset.i], u, o));
      });
      s.appendChild(wrap);
      s.appendChild(card);
    }
    return s;
  }

  function pill(c) {
    var b = el("button", "km-c b-" + c.band.k + (c.fading ? " fading" : "") + (c.flagged ? " flagged" : ""));
    b.type = "button";
    b.dataset.i = c.i;
    b.style.setProperty("--b", c.band.hue);
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-label", c.k + ": " + c.band.name + (c.fading ? ", fading" : "") +
      (c.flagged ? ", a confident mistake" : ""));
    b.innerHTML = "<b>" + esc(c.k) + '</b><span class="lad" aria-hidden="true">' +
      c.ladder.filter(function (l) { return l.can; })
        .map(function (l) { return '<i class="' + (l.has ? "on" : "") + '"></i>'; }).join("") +
      "</span>" + (c.fading ? icon("clock") : "") + (c.flagged ? "<em>!</em>" : "");
    return b;
  }

  function conceptCard(c, u, o) {
    var d = el("div", "km-cd");
    d.innerHTML =
      '<p class="km-eyebrow"><i style="background:' + c.band.hue + '"></i>' + esc(c.band.name) +
        (c.seen ? " · " + c.m + "%" : "") + "</p>" +
      "<h4>" + esc(c.k) + "</h4><p>" + esc(c.def) + "</p>" +
      (c.why ? '<p class="why">' + esc(c.why) + "</p>" : "") +
      '<ol class="km-ladder">' + c.ladder.map(function (l) {
        return '<li class="' + (l.has ? "on" : l.can ? "" : "na") + '" title="' +
          (l.can ? "" : "This concept is not written to be asked at this level yet") + '">' +
          icon(l.has ? "tick" : "dot") + RUNG[l.k] + "</li>";
      }).join("") + "</ol>" +
      (c.pre.length ? '<p class="km-rests">Rests on ' + esc(list(c.pre)) + ".</p>" : "") +
      (c.flagged ? '<p class="km-warn">You answered this wrong while sure of it. That is a belief to change, not a gap to fill.</p>'
       : c.fading ? '<p class="km-warn amber">You had this, and it is overdue. Get it right now and the gap bonus applies.</p>'
       : c.seen ? '<p class="km-rests">Next review ' + esc(c.when) + ".</p>" : "");
    if (u.set) {
      var b = el("button", "lx-btn quiet", "Practise in Learn");
      b.type = "button";
      b.addEventListener("click", function () { o.onLearn(u.set, u.n); });
      d.appendChild(b);
    }
    return d;
  }

  /* ================================================================== HUD */
  function lede(model) {
    var st = model.stats, nx = model.next;
    if (!st.units) return "Nothing in this course has material behind it yet.";
    if (st.mastered === st.units && !st.fading) return "Every unit here is mastered. Reviews after a gap keep it that way.";
    if (st.fading >= 3) return plural(st.fading, "concept you had is", "concepts you had are") +
      " slipping. Bringing them back is worth more than anything new.";
    if (!st.started) return plural(st.units, "unit", "units") + " to light up. Each one you master opens the next.";
    if (nx && nx.status === "ready") return "Unit " + nx.n + " is open. Its ground holds up.";
    if (nx && nx.status === "active") return "Unit " + nx.n + " is at " + nx.m + "% — " +
      (MASTERED - nx.m) + " points from mastered.";
    return st.mastered + " of " + st.units + " units mastered.";
  }

  function stat(cls, top, label) {
    return '<div class="km-stat' + (cls ? " " + cls : "") + '"><div class="v">' + top + "</div><span>" + label + "</span></div>";
  }

  function hud(model, o) {
    var st = model.stats, r = o.rank, h = el("header", "km-hud");
    h.innerHTML = '<div class="km-head"><p class="lx-eyebrow">' + esc(o.course) + "</p>" +
      '<h1 class="lx-h1">Knowledge map</h1><p class="km-lede">' + esc(lede(model)) + "</p></div>";
    var row = el("div", "km-stats");
    row.innerHTML =
      stat("ring", ring(st.pct, 19, 44) + "<b>" + st.pct + "<small>%</small></b>", "of the course") +
      stat("", "<b>" + st.mastered + "<small>/" + st.units + "</small></b>", "units mastered") +
      (st.concepts ? stat("", "<b>" + st.cMastered + "<small>/" + st.concepts + "</small></b>", "concepts mastered") : "") +
      (o.streak != null ? stat("streak" + (o.streak ? " on" : ""), icon("flame", true) + "<b>" + o.streak + "</b>",
        o.streak === 1 ? "day running" : "days running") : "") +
      (r ? stat("rank", "<b>" + esc(r.name) + '</b><i class="km-bar"><i style="width:' + r.pct + '%"></i></i>',
        r.next ? r.toGo.toLocaleString() + " XP to " + esc(r.next.name) : "The top rank") : "");
    h.appendChild(row);
    return h;
  }

  function newsEl(ch) {
    var bits = ch.units.map(function (u) { return "Unit " + u.n + " up " + plural(u.to - u.from, "point", "points"); });
    if (ch.concepts.length) {
      var names = ch.concepts.slice(0, 3).map(function (c) { return c.k; });
      var more = ch.concepts.length - names.length;
      bits.push(ch.concepts.length === 1
        ? ch.concepts[0].k + " reached " + ch.concepts[0].band.name
        : list(more ? names.concat(plural(more, "more", "more")) : names) + " moved up a band");
    }
    var b = el("div", "km-news");
    b.setAttribute("role", "status");
    b.innerHTML = icon("spark") + "<p><b>Since " + esc(since(ch.at)) + ".</b> " + esc(bits.join(" · ")) + "</p>";
    return b;
  }

  function missionsEl(model, o) {
    if (!model.missions.length) return null;
    var sec = el("section", "km-missions");
    sec.appendChild(el("h2", "km-h2", "Missions"));
    var row = el("div", "km-mrow");
    model.missions.forEach(function (m, i) {
      var b = el("button", "km-m k-" + m.kind);
      b.type = "button";
      b.style.setProperty("--i", i);
      b.innerHTML = '<span class="ic">' + icon(m.icon) + "</span>" +
        '<span class="tx"><b>' + esc(m.title) + "</b><span>" + esc(m.say) + "</span></span>" +
        '<span class="xp">' + (m.xp ? "up to " + m.xp + " XP" : m.kind === "open" ? "New ground" : "Unit " + m.unit) + "</span>";
      b.addEventListener("click", function () {
        if ((m.kind === "fading" || m.kind === "flagged" || m.kind === "push") && m.set) o.onLearn(m.set, m.unit);
        else o.onUnit(m.unit);
      });
      row.appendChild(b);
    });
    sec.appendChild(row);
    return sec;
  }

  var LEGEND = [["mastered", "Mastered"], ["active", "In progress"], ["ready", "Ready"],
                ["locked", "Needs ground"], ["fading", "Fading"]];

  /* ============================================================== Render
     o = { course, hue, rank, streak, changes, focus,
           onUnit(n), onLearn(setId, n) } */
  function render(model, o) {
    var root = el("div", "km");
    if (o.hue) root.style.setProperty("--hue", o.hue);
    root.appendChild(hud(model, o));
    if (o.changes) root.appendChild(newsEl(o.changes));
    var ms = missionsEl(model, o);
    if (ms) root.appendChild(ms);

    var stage = el("div", "km-stage");
    var left = el("div", "km-left");
    var board = el("div", "km-board");
    board.setAttribute("role", "group");
    board.setAttribute("aria-label", "Knowledge map of " + o.course);
    var lay = layout(model);
    var inner = el("div", "km-board-in");
    inner.style.cssText = "--w:" + lay.w + "px;--h:" + lay.h + "px;--vh:" + lay.vh + "px";
    inner.innerHTML = edgesSvg(model, lay, false) + edgesSvg(model, lay, true);
    var up = {};
    (o.changes ? o.changes.units : []).forEach(function (c) { up[c.n] = c.to - c.from; });
    model.units.forEach(function (u, i) { inner.appendChild(nodeEl(u, model, lay.pos[u.n], i, up[u.n])); });
    board.appendChild(inner);
    left.appendChild(board);
    left.appendChild(el("div", "km-legend", LEGEND.map(function (l) {
      return '<span><i class="s-' + l[0] + '"></i>' + l[1] + "</span>";
    }).join("")));

    var sheet = el("aside", "km-sheet");
    sheet.setAttribute("aria-live", "polite");
    stage.appendChild(left);
    stage.appendChild(sheet);
    root.appendChild(stage);

    function select(n, byHand) {
      var u = model.byN[n];
      if (!u) return;
      [].forEach.call(inner.querySelectorAll(".km-node"), function (x) {
        var on = +x.dataset.n === n;
        x.classList.toggle("on", on);
        x.setAttribute("aria-pressed", String(on));
      });
      sheet.innerHTML = "";
      sheet.appendChild(sheetFor(u, model, o));
      if (byHand && window.matchMedia && window.matchMedia("(max-width: 980px)").matches) {
        var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        sheet.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
      }
    }
    inner.addEventListener("click", function (e) {
      var b = e.target.closest(".km-node");
      if (b) select(+b.dataset.n, true);
    });
    var live = model.units.filter(function (u) { return u.live; });
    var first = o.focus != null && model.byN[o.focus] ? o.focus
      : model.next ? model.next.n : (live[0] || model.units[0] || {}).n;
    if (first != null) select(first, false);
    return root;
  }

  /* The course page's way in: the whole course as a line of beads, one
     sentence, and the counts that matter. */
  function teaser(model, o) {
    var st = model.stats, b = el("button", "km-teaser");
    b.type = "button";
    if (o.hue) b.style.setProperty("--hue", o.hue);
    b.innerHTML =
      '<span class="km-t-top"><b>Knowledge map</b><span class="go">Open map' + icon("arrow") + "</span></span>" +
      '<span class="km-t-trail">' + model.units.filter(function (u) { return u.live; }).map(function (u) {
        return '<i class="s-' + u.status + (model.next === u ? " is-here" : "") + '"></i>';
      }).join("") + "</span>" +
      '<span class="km-t-say">' + esc(lede(model)) + "</span>" +
      '<span class="km-t-facts">' + [st.mastered + " of " + st.units + " units mastered",
        st.fading ? st.fading + " fading" : null,
        st.ready ? st.ready + " ready to open" : null].filter(Boolean).join(" · ") + "</span>";
    b.addEventListener("click", o.onOpen);
    return b;
  }

  return { build: build, render: render, teaser: teaser, snapshot: snapshot, diff: diff,
           layout: layout, MASTERED: MASTERED, HOLDS: HOLDS };
})();
