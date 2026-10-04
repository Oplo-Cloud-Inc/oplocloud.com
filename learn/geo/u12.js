/* ==========================================================================
   Geometry — Unit 12: Extending Transformational Geometry. See lab/core.js
   for the format and lab/geotools.js for the drawing kit. The move, map and
   plot scenes (lab/widgets.js) let the student slide, turn, flip and scale a
   figure, and draw an image point by point.

   Follows Holt Geometry, Chapter 12, section for section (12-1 to 12-7),
   after a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   Reflections (12-1), translations (12-2), rotations (12-3), compositions
   (12-4), symmetry (12-5), tessellations (12-6) and dilations (12-7).

   Lessons carry v: 4 (see Unit 1). Skills are hg12-….

   Eight lessons, seven skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  var TRI = [[1, 1], [4, 1], [1, 3]];
  function primes(s) { return s.split("").map(function (c) { return c + "'"; }); }
  // A figure (soft) and its image (blue) on a grid. o.extra: items drawn first (a mirror line, a centre, arrows);
  // o.names "ABC"; o.x, o.y: the window.
  function trFig(P, Q, alt, o) {
    o = o || {};
    return grid(o.x || [-6, 6], o.y || [-6, 6], (o.extra || []).concat([{ poly: P, names: o.names || "ABC", c: "soft" }, { poly: Q, names: primes(o.names || "ABC"), c: "blue" }]), { u: o.u || 24, alt: alt });
  }
  // The rules of this chapter, as functions of a point.
  var RULE = {
    rx: function (p) { return [p[0], -p[1]]; }, ry: function (p) { return [-p[0], p[1]]; }, ryx: function (p) { return [p[1], p[0]]; },
    r90: function (p) { return [-p[1], p[0]]; }, r180: function (p) { return [-p[0], -p[1]]; }, r270: function (p) { return [p[1], -p[0]]; }
  };
  function shift(a, b) { return function (p) { return [p[0] + a, p[1] + b]; }; }
  function scale(k) { return function (p) { return [k * p[0], k * p[1]]; }; }
  // ⟨a, b⟩ with real minus signs.
  function vec(a, b) { return "⟨" + nm(a) + ", " + nm(b) + "⟩"; }
  // A regular polygon with its lines of symmetry dashed.
  function symFig(n, alt) {
    var P = reg(n, 2), items = [{ poly: P, c: "blue", fill: true }];
    for (var i = 0; i < n; i++) { var d = 90 + 180 * i / n; items.push({ seg: [GT.polar([0, 0], 2.5, d), GT.polar([0, 0], 2.5, d + 180)], dash: true, c: "orange" }); }
    return plain([-2.9, 2.9], [-2.9, 2.9], items, { u: 30, alt: alt });
  }
  var L = window.OPLO_LAB;
  var poly = L.poly, frac = L.frac, num = L.num, mc = L.mc, signed = L.signed;

  // A worked calculation, one line per step.
  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  // Two equations set one above the other: a system.
  function sys(a, b) { return "$$" + a + "$$$$" + b + "$$"; }
  // A small table of values, set as maths, for a question to point at.
  function tbl(head, rows, cap) {
    return '<table class="lw-table big">' + (cap ? "<caption>" + L.fmt(cap) + "</caption>" : "") +
      "<thead><tr>" + head.map(function (h) { return "<th>" + L.fmt(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + L.m(String(c)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
  }
  // Keep only replies whose wrong answer is different from the right one.
  function near(ans, list) { return list.filter(function (n) { return n.v !== ans && (typeof n.v !== "number" || Math.abs(n.v - ans) > 1e-9); }); }
  function clean(s) { return String(s).replace(/\s/g, ""); }
  // A number the way it is written in a sentence: −3, not -3.
  function nm(v) { return num(v).replace("-", "−"); }
  function r2(v) { return Math.round(v * 100) / 100; }

  // Do two dragged points both sit on y = mx + c (and differ)?
  function onLine(st, a, b, m, c) {
    var p = st.pt(a), q = st.pt(b);
    return (p.x !== q.x || p.y !== q.y) && Math.abs(p.y - (m * p.x + c)) < 1e-9 && Math.abs(q.y - (m * q.x + c)) < 1e-9;
  }

  // Two equations on one card ("… and …"): cards and options close up the
  // spaces beside maths, so the gap is written as hard spaces.
  function two(a, b) { return "$" + a + "$\u00a0\u00a0and\u00a0\u00a0$" + b + "$"; }

  // A graph made of straight pieces through these points (nothing outside them).
  function pw(pts) {
    return function (x) {
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        if (x >= a[0] && x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      }
      return NaN;
    };
  }
  // A graph to look at: a plane with these curves and nothing to drag.
  function graph(x, y, fns, o) { return Object.assign({ type: "plane", x: x, y: y, fns: fns }, o || {}); }

  // A typed "4,000" is read as 4.000, so a big answer carries this reply.
  function big(ans) { return { v: ans / 1000, tol: 1e-9, fb: "Type it without a comma: " + ans + "." }; }

  var LESSONS = [];
  /* Shared by every Geometry unit (compiled in after the Algebra helpers, src/common.js).
     The drawing helpers come from the course's first unit: rays and angles, points on a line,
     planes, constructions a step at a time, polygons, and solids with their measurements. */
  var GT = L.GT, F = GT.fig, FS = GT.figs;
  var GIVEN = "That is the problem as it was given.", LATER = "This line follows correctly from the one above it. Look earlier.";
  /* ------------------------------------------------------------ Helpers */
  var LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("");
  // Planes are named with a script capital, the way the book writes them.
  var SCRIPT = { A: "𝒜", B: "ℬ", C: "𝒞", D: "𝒟", E: "ℰ", F: "ℱ", G: "𝒢", H: "ℋ", J: "𝒥", K: "𝒦", L: "ℒ", M: "ℳ", N: "𝒩",
                 P: "𝒫", Q: "𝒬", R: "ℛ", S: "𝒮", T: "𝒯", U: "𝒰", V: "𝒱", W: "𝒲", X: "𝒳", Y: "𝒴", Z: "𝒵" };
  // A plane's script name in a sentence, set a little larger so it reads.
  function PN(c) { return '<span class="gt-scr">' + SCRIPT[c] + "</span>"; }
  // Sort cards lay their text out as a flex row, which drops the spaces
  // next to maths: keep them as no-break spaces.
  function nb(t) { return String(t).replace(/ \$/g, function () { return "\u00a0$"; }).replace(/\$ /g, function () { return "$\u00a0"; }); }
  function letters(R, n, avoid) { return R.shuffle(LETTERS.filter(function (c) { return (avoid || "").indexOf(c) < 0; })).slice(0, n); }
  function plain(x, y, items, o) { return F(Object.assign({ x: x, y: y, grid: false, items: items }, o || {})); }
  function grid(x, y, items, o) { return F(Object.assign({ x: x, y: y, items: items }, o || {})); }
  function r1(v) { return Math.round(v * 10) / 10; }
  function sq(v) { return v * v; }
  // √n in simplest form, as TeX: 52 → 2\sqrt{13}; 49 → 7.
  function root(n) {
    var a = 1, b = n;
    for (var k = Math.floor(Math.sqrt(n)); k > 1; k--) if (n % (k * k) === 0) { a = k; b = n / (k * k); break; }
    if (b === 1) return String(a);
    return (a > 1 ? a : "") + "\\sqrt{" + b + "}";
  }
  function isSquare(n) { var r = Math.round(Math.sqrt(n)); return r * r === n; }
  function pt(p) { return "(" + num(p[0]) + ", " + num(p[1]) + ")"; }
  function plusMinus(v) { return v < 0 ? "- " + Math.abs(v) : "+ " + v; }
  // (x − a): with a negative a, a subtraction of a negative, in brackets.
  function minus(x, a) { return a < 0 ? x + " - (" + a + ")" : x + " - " + a; }
  // A fraction of an inch as TeX, reduced: 1.375 → 1\frac{3}{8}.
  function inch(v) {
    var w = Math.floor(v + 1e-9), f = v - w, d = 16, n = Math.round(f * 16);
    while (n && n % 2 === 0 && d > 1) { n /= 2; d /= 2; }
    if (!n) return String(w);
    return (w ? w : "") + "\\frac{" + n + "}{" + d + "}";
  }
  /* ------------------------------------------------------------ Figures */
  // A plane: a slanted sheet with its lower-left corner at (x, y).
  function sheet(x, y, w, h, s) { s = s == null ? h * 0.9 : s; return [[x, y], [x + w, y], [x + w + s, y + h], [x + s, y + h]]; }
  // The pages of a book: planes turning on one line (the spine).
  function pagesFig(o) {
    o = o || {};
    var A = [1.2, 1.2], B = [5.2, 1.2], items = [];
    [[-0.2, 2.3], [1.3, 2.6], [2.6, 1.9]].forEach(function (d, i) {
      items.push({ plane: [A, B, [B[0] + d[0], B[1] + d[1]], [A[0] + d[0], A[1] + d[1]]], c: ["blue", "purple", "green"][i], under: true });
    });
    items.push({ line: [[0.3, 1.2], [6.2, 1.2]], bare: false });
    (o.pts || []).forEach(function (p) { items.push(p); });
    return plain([0, 7.6], [0, 4.4], items, { u: 38, cap: o.cap, alt: o.alt || "Three planes, like the pages of a book, all turning on one line." });
  }
  // Points spread along a line from left to right, and its lowercase name.
  function ptsOnLine(names, o) {
    o = o || {};
    var a = o.a || [0.8, 0.9], b = o.b || [6.2, 2.9], items = [{ line: [a, b] }];
    names.forEach(function (nm, i) {
      var t = (i + 1) / (names.length + 1), p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      items.push({ pt: p, name: nm, at: "nw" });
    });
    if (o.n) items.push({ word: o.n, at: [b[0] - 0.2, b[1] - 0.55], name: true });
    (o.extra || []).forEach(function (it) { items.push(it); });
    return plain([0, 7], [0, 3.8], items, { u: o.u || 40, cap: o.cap, alt: o.alt || "Points " + names.join(", ") + " on a line." });
  }
  // A box (rectangular prism), its corners named: A B C D round the front
  // (bottom left, bottom right, top right, top left), E F G H behind them.
  var BOX = "ABCDEFGH".split("");
  function boxFig(names, o) {
    o = o || {};
    return GT.solid({ shape: "box", bases: false, w: 3.4, h: 1.9, d: 2.2, names: names || BOX, yaw: 0.52, pitch: 0.36, size: o.size || 260, sizeH: 210, scale: 50,
      cap: o.cap, alt: o.alt || "A box with its eight corners named: " + (names || BOX).join(", ") + ". Hidden edges are dashed.", maxW: o.w });
  }
  // The box's faces, by the names of their corners, and which face is opposite which.
  var FACES = [{ k: "front", c: [0, 1, 2, 3] }, { k: "back", c: [4, 5, 6, 7] }, { k: "left", c: [0, 4, 7, 3] },
               { k: "right", c: [1, 5, 6, 2] }, { k: "top", c: [3, 2, 6, 7] }, { k: "bottom", c: [0, 1, 5, 4] }];
  var OPP = { front: "back", back: "front", left: "right", right: "left", top: "bottom", bottom: "top" };
  // A line through a plane: above it solid, under it dashed, out below it again.
  function pierceFig(o) {
    o = o || {};
    var R = [3.4, 1.8];
    return plain([0, 7.6], [-0.9, 5], [{ plane: sheet(0.5, 0.5, 5.2, 2.5, 1.8), name: o.plane || "ℛ" },
      { dline: [R, [3.9, 4.7]], ray: true }, { seg: [R, [3.16, 0.5]], dash: "4 4" }, { dline: [[3.16, 0.5], [3.02, -0.6]], ray: true },
      { pt: R, name: o.at || "R", at: "e" }, { word: o.line || "m", at: [4.25, 4.3], name: true }],
      { u: o.u || 34, cap: o.cap, alt: o.alt || "A line crosses a plane at one point; the part under the plane is dashed." });
  }
  // Two planes crossing along a line.
  function twoPlanesFig(o) {
    o = o || {};
    var n = o.names || ["A", "B"];
    return plain([0, 8.4], [-0.3, 4.6], [{ plane: sheet(0.3, 1.0, 5.6, 2.2, 1.9), name: o.p || "𝒫" },
      { plane: [[1.3, -0.1], [6.9, -0.1], [6.9, 4.2], [1.3, 4.2]], c: "purple", nameAt: [6.3, 3.6], name: o.q || "𝒬" },
      { dline: [[0.9, 2.1], [7.4, 2.1]] }, { pt: [2.6, 2.1], name: n[0], at: "n" }, { pt: [5.5, 2.1], name: n[1], at: "n" }],
      { u: o.u || 34, cap: o.cap, alt: o.alt || "Two planes crossing; they meet along the line through " + n[0] + " and " + n[1] + "." });
  }
  // Two lines crossing at a point.
  function crossFig(o) {
    o = o || {};
    return plain([0, 6], [0, 4], [{ dline: [[0.6, 0.6], [5.4, 3.4]] }, { dline: [[0.8, 3.5], [5.2, 0.5]] },
      { pt: [3.07, 2.04], name: o.at || "T", at: "n" }, { word: o.a || "ℓ", at: [5.35, 2.9], name: true }, { word: o.b || "m", at: [5.2, 0.95], name: true }],
      { u: o.u || 36, cap: o.cap, alt: o.alt || "Two lines crossing at a point." });
  }
  /* Collinear points on a flat segment, with lengths written over the parts
     (and under the whole). pts: [[name, x]…] left to right, over: [[i, j,
     "text"]…] above, under: [[i, j, "text"]…] below, ticks: [[i, j, n]…]. */
  function segRow(pts, o) {
    o = o || {};
    var x0 = pts[0][1], x1 = pts[pts.length - 1][1], y = 1, items = [{ seg: [[x0, y], [x1, y]], c: o.c || "blue" }];
    (o.ticks || []).forEach(function (t) { items.push({ seg: [[pts[t[0]][1], y], [pts[t[1]][1], y]], marks: t[2] || 1, c: o.c || "blue" }); });
    pts.forEach(function (p) { items.push({ pt: [p[1], y], name: p[0], at: "s", c: o.c || "blue" }); });
    (o.over || []).forEach(function (t) { items.push({ len: t[2], seg: [[pts[t[0]][1], y], [pts[t[1]][1], y]], side: 1, off: 16, eq: true }); });
    (o.under || []).forEach(function (t) {
      var a = pts[t[0]][1], b = pts[t[1]][1];
      items.push({ path: [[a, 0.2], [a, 0.05], [b, 0.05], [b, 0.2]], c: "soft" });
      items.push({ word: t[2], at: [(a + b) / 2, -0.35], eq: true });
    });
    return plain([x0 - 0.8, x1 + 0.8], [-0.8, 1.9], items, { u: o.u || 40, cap: o.cap, alt: o.alt || "Points " + pts.map(function (p) { return p[0]; }).join(", ") + " on a segment, with lengths marked.", w: o.w });
  }
  /* A number line from lo to hi, a tick at every `step`, a number every
     `every`; marks: [{ v, name, c }] as dots with their names above. */
  function numLine(lo, hi, marks, o) {
    o = o || {};
    var step = o.step || 1, every = o.every || (hi - lo > 16 ? 5 : hi - lo > 10 ? 2 : 1), items = [{ dline: [[lo - 0.7, 0], [hi + 0.7, 0]] }], d = "";
    var path = [];
    for (var v = lo; v <= hi + 1e-9; v += step) {
      var big = Math.abs(Math.round(v / every) * every - v) < 1e-9;
      items.push({ path: [[v, big ? 0.24 : 0.14], [v, big ? -0.24 : -0.14]], c: "ink" });
      if (big) items.push({ word: num(v), at: [v, -0.8], c: "soft" });
    }
    (marks || []).forEach(function (mk) { items.push({ pt: [mk.v, 0], c: mk.c || "blue", r: 5 }); if (mk.name) items.push({ word: mk.name, at: [mk.v, 0.62], name: true, c: mk.c || "blue" }); });
    (o.extra || []).forEach(function (it) { items.push(it); });
    var u = o.u || Math.min(40, 560 / (hi - lo + 2));
    return plain([lo - 1, hi + 1], [-1.3, 1.25], items, { u: u, cap: o.cap, w: o.w, alt: o.alt || "A number line from " + lo + " to " + hi + (marks && marks.length ? " with points " + marks.map(function (mk) { return mk.name + " at " + mk.v; }).join(", ") : "") + "." });
  }
  // A right triangle on a segment: its across and up legs, dashed, and their lengths.
  function legs(A, B, o) {
    o = o || {};
    var C = [B[0], A[1]], dx = Math.abs(B[0] - A[0]), dy = Math.abs(B[1] - A[1]);
    return [{ seg: [A, C], c: "orange", dash: "5 4" }, { seg: [C, B], c: "orange", dash: "5 4" },
      dx ? { len: String(dx), seg: [A, C], side: B[1] > A[1] ? -1 : 1, off: 13, c: "orange" } : null,
      dy ? { len: String(dy), seg: [C, B], side: (B[0] > A[0]) === (B[1] > A[1]) ? -1 : 1, off: 13, c: "orange" } : null].filter(Boolean);
  }
  // A window round some points: a margin of one, and at least 6 units each way.
  function win(pts, k) {
    var lo = Math.min.apply(null, pts.map(function (p) { return p[k]; })) - 1, hi = Math.max.apply(null, pts.map(function (p) { return p[k]; })) + 1;
    while (hi - lo < 6) { lo -= 0.5; hi += 0.5; }
    return [Math.floor(lo), Math.ceil(hi)];
  }
  // A move in words: "4 right and 3 down", "5 left".
  function move(dx, dy) {
    var a = dx ? Math.abs(dx) + (dx > 0 ? " right" : " left") : "", b = dy ? Math.abs(dy) + (dy > 0 ? " up" : " down") : "";
    return a && b ? a + " and " + b : a || b || "no move at all";
  }
  /* Rays from a vertex. V: [x, y]; rays: [{ d: degrees, name, r (length), c, line: true (both ways) }];
     o.wedges: [{ i, j, say, c, r, right }] mark the angle between rays i and j;
     o.marks: [{ i, j, n }] congruence arcs; o.num: [{ i, j, t }] a number in the angle;
     o.vname, o.x, o.y, o.u, o.pts: extra items. */
  var SIDE8 = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
  function side8(d) { return SIDE8[((Math.round((((d % 360) + 360) % 360) / 45) % 8) + 8) % 8]; }
  function rayFig(V, rays, o) {
    o = o || {};
    var items = [], P = rays.map(function (r) { return GT.polar(V, r.r || 3, r.d); });
    function mid(i, j) {
      var a = rays[i].d, b = rays[j].d, d = ((b - a) % 360 + 360) % 360;
      if (d > 180) { d = 360 - d; return a - d / 2; }
      return a + d / 2;
    }
    (o.wedges || []).forEach(function (w) { items.push({ angle: [P[w.i], V, P[w.j]], say: w.say, c: w.c, r: w.r, right: w.right }); });
    rays.forEach(function (r, i) {
      if (r.line) items.push({ dline: [GT.polar(V, r.r || 3, r.d + 180), P[i]], c: r.c });
      else items.push({ dline: [V, P[i]], ray: true, c: r.c });
    });
    (o.marks || []).forEach(function (mk) { items.push({ amarks: [P[mk.i], V, P[mk.j]], n: mk.n || 1, r: mk.r || 20 }); });
    (o.num || []).forEach(function (t) { items.push({ word: t.t, at: GT.polar(V, t.r || 0.85, mid(t.i, t.j)), c: t.c || "orange" }); });
    rays.forEach(function (r, i) {
      if (!r.name) return;
      var q = GT.polar(V, (r.r || 3) * (r.at || 0.72), r.d);
      items.push({ pt: q, name: r.name, at: r.lab || side8(r.d + 90) });
      if (r.name2) { var q2 = GT.polar(V, (r.r || 3) * 0.72, r.d + 180); items.push({ pt: q2, name: r.name2, at: side8(r.d + 270) }); }
    });
    if (o.vname) {
      var sx = 0, sy = 0;
      rays.forEach(function (r) { sx += Math.cos(r.d * Math.PI / 180); sy += Math.sin(r.d * Math.PI / 180); });
      var away = Math.atan2(-sy, -sx) * 180 / Math.PI;
      items.push({ pt: V, name: o.vname, at: o.vlab || side8(away) });
    }
    (o.pts || []).forEach(function (it) { items.push(it); });
    return plain(o.x || [V[0] - 3.6, V[0] + 3.6], o.y || [V[1] - 1, V[1] + 3.6], items, { u: o.u || 38, cap: o.cap, w: o.w, alt: o.alt || "Rays from a point." });
  }

  /* ------------------------------------------------------ Constructions
     Each drawn as it stands after step k (k = 1 … its number of steps), so
     a walk can build it up the way it's done on paper. Compass arcs are
     pencil-thin; the finished line or ray is orange. */
  function consBisectAngle(k, o) {
    o = o || {};
    var A = [0.6, 0.6], B = [3.2, 0.6], C = GT.polar(A, 2.6, 64), D = [3.924, 2.677], it = [];
    it.push({ dline: [A, GT.polar(A, 5.4, 0)], ray: true }, { dline: [A, GT.polar(A, 5.4, 64)], ray: true });
    if (k >= 1) it.push({ arc: [A, 2.6, -8, 72] }, { pt: B, name: "B", at: "s" }, { pt: C, name: "C", at: "nw" });
    if (k >= 2) it.push({ arc: [B, 2.2, 55, 88] });
    if (k >= 3) it.push({ arc: [C, 2.2, -22, 9] }, { pt: D, name: "D", at: "ne" });
    if (k >= 4) it.push({ dline: [A, GT.polar(A, 5.6, 32)], ray: true, c: "orange" }, { amarks: [B, A, D], n: 1, r: 34 }, { amarks: [D, A, C], n: 1, r: 34 });
    it.push({ pt: A, name: "A", at: "sw" });
    return plain([0, 6.4], [0, 5.6], it, { u: o.u || 34, w: o.w, alt: o.alt || "Bisecting angle A with a compass, step " + k + "." });
  }
  function consCopyAngle(k, o) {
    o = o || {};
    var P = [0.8, 1], R0 = [2.6, 1], Q = GT.polar(P, 1.8, 50), T = [4.6, 1], S = [6.4, 1], U = GT.polar(T, 1.8, 50), it = [];
    it.push({ dline: [P, GT.polar(P, 3.2, 0)], ray: true }, { dline: [P, GT.polar(P, 3.2, 50)], ray: true }, { dline: [T, GT.polar(T, 3.2, 0)], ray: true });
    if (k >= 2) it.push({ arc: [P, 1.8, -10, 62] }, { pt: R0, name: "R", at: "s" }, { pt: Q, name: "Q", at: "nw" });
    if (k >= 3) it.push({ arc: [T, 1.8, -10, 66] }, { pt: S, name: "S", at: "s" });
    if (k >= 4) it.push({ arc: [R0, 1.521, 104, 126] });
    if (k >= 5) it.push({ arc: [S, 1.521, 102, 128] }, { pt: U, name: "U", at: "nw" });
    if (k >= 6) it.push({ dline: [T, GT.polar(T, 3.2, 50)], ray: true, c: "orange" }, { amarks: [R0, P, Q], n: 1, r: 22 }, { amarks: [S, T, U], n: 1, r: 22 });
    it.push({ pt: P, name: "P", at: "sw" }, { pt: T, name: "T", at: "sw" });
    return plain([0, 8.2], [0, 4.2], it, { u: o.u || 34, w: o.w, alt: o.alt || "Copying angle P onto a ray from T, step " + k + "." });
  }
  function consPerpOn(k, o) {
    o = o || {};
    var C = [3.5, 1], A = [2, 1], B = [5, 1], D = [3.5, 3], it = [{ dline: [[0.4, 1], [6.6, 1]] }, { word: "n", at: [6.5, 0.6], name: true }];
    if (k >= 1) it.push({ arc: [C, 1.5, 168, 192] }, { arc: [C, 1.5, -12, 12] }, { pt: A, name: "A", at: "s" }, { pt: B, name: "B", at: "s" });
    if (k >= 2) it.push({ arc: [A, 2.5, 40, 66] });
    if (k >= 3) it.push({ arc: [B, 2.5, 114, 140] }, { pt: D, name: "D", at: "ne" });
    if (k >= 4) it.push({ dline: [[3.5, 0.15], [3.5, 3.85]], c: "orange" }, { angle: [B, C, D], right: true, c: "orange" });
    it.push({ pt: C, name: "C", at: "se" });
    return plain([0, 7], [0, 4], it, { u: o.u || 36, w: o.w, alt: o.alt || "A perpendicular through a point C on line n, step " + k + "." });
  }
  function consPerpOff(k, o) {
    o = o || {};
    var Z = [3.5, 3.8], X = [2.068, 2], Y = [4.932, 2], A = [3.5, 0.604], it = [{ dline: [[0.4, 2], [6.6, 2]] }, { word: "m", at: [6.5, 1.6], name: true }];
    if (k >= 1) it.push({ arc: [Z, 2.3, 218, 322] }, { pt: X, name: "X", at: "nw" }, { pt: Y, name: "Y", at: "ne" });
    if (k >= 2) it.push({ arc: [X, 2.0, -60, -28] });
    if (k >= 3) it.push({ arc: [Y, 2.0, 208, 240] }, { pt: A, name: "A", at: "e" });
    if (k >= 4) it.push({ dline: [[3.5, 4.4], [3.5, 0.1]], c: "orange" }, { angle: [Y, [3.5, 2], Z], right: true, c: "orange" });
    it.push({ pt: Z, name: "Z", at: "e" });
    return plain([0, 7], [0, 4.6], it, { u: o.u || 36, w: o.w, alt: o.alt || "A perpendicular through a point Z not on line m, step " + k + "." });
  }
  function consBisectSeg(k, o) {
    o = o || {};
    var it = [{ seg: [[1, 1.5], [6, 1.5]], c: "blue" }];
    if (k >= 1) it.push({ arc: [[1, 1.5], 3.2, 22, 56] }, { arc: [[1, 1.5], 3.2, -56, -22] });
    if (k >= 2) it.push({ arc: [[6, 1.5], 3.2, 124, 158] }, { arc: [[6, 1.5], 3.2, 202, 236] }, { pt: [3.5, 3.5], name: "P", at: "e" }, { pt: [3.5, -0.5], name: "Q", at: "e" });
    if (k >= 3) it.push({ dline: [[3.5, 4.3], [3.5, -1.3]], c: "orange" }, { pt: [3.5, 1.5], name: "M", at: "se", c: "orange" });
    it.push({ pt: [1, 1.5], name: "X", at: "w", c: "blue" }, { pt: [6, 1.5], name: "Y", at: "e", c: "blue" });
    return plain([0, 7], [-1.6, 4.6], it, { u: o.u || 34, w: o.w, alt: o.alt || "Bisecting segment XY with a compass, step " + k + "." });
  }
  function consCopySeg(k, o) {
    o = o || {};
    var it = [{ seg: [[0.6, 2.4], [3.4, 2.4]], c: "blue" }, { dline: [[0.6, 0.2], [7.4, 0.2]] }];
    if (k >= 2) it.push({ arc: [[0.6, 2.4], 2.8, -18, 18] });
    if (k >= 3) it.push({ arc: [[1.4, 0.2], 2.8, -20, 20] }, { seg: [[1.4, 0.2], [4.2, 0.2]], c: "orange" }, { pt: [4.2, 0.2], name: "Q", at: "s", c: "orange" });
    it.push({ pt: [0.6, 2.4], name: "X", at: "n", c: "blue" }, { pt: [3.4, 2.4], name: "Y", at: "n", c: "blue" }, { pt: [1.4, 0.2], name: "P", at: "s" });
    return plain([0, 8], [-1, 3.4], it, { u: o.u || 34, w: o.w, alt: o.alt || "Copying segment XY onto a line at P, step " + k + "." });
  }
  /* Two lines crossing at O: one flat, one at `a` degrees; the four angles
     numbered 1–4 counterclockwise from the flat line's right-hand ray.
     names: [right, up-line end, left, down-line end] (optional). */
  function xFig(a, o) {
    o = o || {};
    var nm = o.names || [], rot = o.rot || 0;
    return rayFig([0, 0], [{ d: rot, name: nm[0] }, { d: rot + a, name: nm[1] }, { d: rot + 180, name: nm[2] }, { d: rot + 180 + a, name: nm[3] }],
      { vname: o.v, vlab: o.vlab || "s", num: o.nums === false ? [] : [{ i: 0, j: 1, t: "1" }, { i: 1, j: 2, t: "2" }, { i: 2, j: 3, t: "3" }, { i: 3, j: 0, t: "4" }].map(function (t) { t.r = 0.8; return t; }),
        wedges: o.wedges, marks: o.marks, x: [-3.4, 3.4], y: [-2.6, 2.6], u: o.u || 40, cap: o.cap, w: o.w, pts: o.pts,
        alt: o.alt || "Two lines crossing, making four angles numbered 1 to 4." });
  }

  /* ------------------------------------------------------------ Polygons */
  var NGON = { 3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon", 7: "heptagon", 8: "octagon", 9: "nonagon", 10: "decagon", 12: "dodecagon" };
  // A regular n-gon of radius r about c, one vertex straight up unless rot says otherwise.
  function reg(n, r, c, rot) {
    c = c || [0, 0]; rot = rot == null ? 90 : rot;
    var out = [];
    for (var i = 0; i < n; i++) out.push(GT.polar(c, r, rot + 360 * i / n));
    return out;
  }
  // An irregular n-gon: a regular one with its corners pushed in and out a little (still convex).
  function wobbly(n, R, c) {
    return reg(n, 2, c || [0, 0], 90 + R.int(-10, 10)).map(function (p, i) {
      var k = 0.78 + 0.34 * ((i * 7 + R.int(0, 6)) % 7) / 6, cc = c || [0, 0];
      return [cc[0] + (p[0] - cc[0]) * k, cc[1] + (p[1] - cc[1]) * k];
    });
  }
  // Convex when every turn goes the same way.
  function convex(P) {
    var sgn = 0;
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length], c = P[(i + 2) % P.length];
      var z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (Math.abs(z) < 1e-9) continue;
      if (!sgn) sgn = z > 0 ? 1 : -1; else if ((z > 0 ? 1 : -1) !== sgn) return false;
    }
    return true;
  }
  function polyFig(P, o) {
    o = o || {};
    var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
    var x = [Math.min.apply(null, xs) - 0.7, Math.max.apply(null, xs) + 0.7], y = [Math.min.apply(null, ys) - 0.7, Math.max.apply(null, ys) + 0.7];
    var items = [{ poly: P, c: o.c || "blue", names: o.names }].concat(o.extra || []);
    return plain(x, y, items, { u: o.u || 30, cap: o.cap, w: o.w, alt: o.alt || "A polygon with " + P.length + " sides." });
  }
  // Two concave shapes that come up often: an arrowhead and an L.
  var ARROW = [[0, 0], [2, 1.1], [4, 0], [2, 3.4]], ELL = [[0, 0], [3.2, 0], [3.2, 1.2], [1.2, 1.2], [1.2, 3], [0, 3]];

  /* -------------------------------------------------------------- Solids
     Drawn the textbook way (oblique: depth goes up and to the right, at
     half size), with their measurements written on. */
  var DX = 0.62, DY = 0.45;               // one unit of depth, on the page
  function boxDims(w, h, d, lab, o) {
    o = o || {};
    var sc = o.sc || 3.4 / Math.max(w, h * 1.3, d * 1.1), W = w * sc, H = h * sc, D = d * sc;
    var A = [0, 0], B = [W, 0], C = [W, H], E = [0, H], dd = [D * DX, D * DY];
    function t(p) { return [p[0] + dd[0], p[1] + dd[1]]; }
    var items = [{ path: [A, B, C, E], closed: true, fill: true, c: "blue" }, { path: [E, t(E), t(C), C], closed: true, fill: true, c: "blue" }, { path: [B, t(B), t(C), C], closed: true, fill: true, c: "blue" },
      { seg: [A, t(A)], c: "blue", dash: "5 5" }, { seg: [t(A), t(B)], c: "blue", dash: "5 5" }, { seg: [t(A), t(E)], c: "blue", dash: "5 5" }];
    if (lab) items.push({ len: lab[0], seg: [A, B], side: -1, off: 14 }, { len: lab[1], seg: [A, E], side: 1, off: 16 }, { len: lab[2], seg: [B, t(B)], side: -1, off: 16 });
    return plain([-1.3, W + dd[0] + 1.2], [-0.9, H + dd[1] + 0.6], items, { u: o.u || 40, w: o.w, cap: o.cap, alt: o.alt || "A box " + lab.join(" by ") + "." });
  }
  // A square pyramid: base s, height h, slant height l (labels are strings; any may be null).
  function pyrDims(lab, o) {
    o = o || {};
    var s = 3.2, D = s, A = [0, 0], B = [s, 0], Cc = [s + D * DX, D * DY], Dd = [D * DX, D * DY], M = [(s + D * DX) / 2, D * DY / 2], T = [M[0], M[1] + 3], F = [s / 2, 0];
    var items = [{ path: [A, B, T], closed: true, fill: true, c: "blue" }, { path: [B, Cc, T], closed: true, fill: true, c: "blue" },
      { seg: [A, Dd], dash: "5 5", c: "blue" }, { seg: [Dd, Cc], dash: "5 5", c: "blue" }, { seg: [Dd, T], dash: "5 5", c: "blue" }];
    if (lab.h) items.push({ seg: [T, M], dash: "3 4", c: "orange" }, { word: lab.h, at: [M[0] + 0.14, M[1] + 1.1], anchor: "start", c: "orange" });
    if (lab.l) items.push({ seg: [T, F], c: "green" }, { word: lab.l, at: [(T[0] + F[0]) / 2 - 0.2, (T[1] + F[1]) / 2 - 0.3], anchor: "end", c: "green" });
    if (lab.s) items.push({ len: lab.s, seg: [A, B], side: -1, off: 14 });
    return plain([-1.2, s + D * DX + 0.8], [-0.9, T[1] + 0.5], items, { u: o.u || 40, w: o.w, cap: o.cap, alt: o.alt || "A square pyramid with its measurements marked." });
  }
  // A prism with a right-triangle base (legs a, b), lying along its length.
  function triPrism(lab, o) {
    o = o || {};
    var P = [0, 0], Q = [2.4, 0], R0 = [0, 1.8], L = 3.2, v = [L * DX * 1.3, L * DY * 1.3];
    function t(p) { return [p[0] + v[0], p[1] + v[1]]; }
    var items = [{ path: [P, Q, R0], closed: true, fill: true, c: "orange" }, { path: [Q, t(Q), t(R0), R0], closed: true, fill: true, c: "blue" },
      { path: [R0, t(R0)], c: "blue" }, { seg: [P, t(P)], dash: "5 5", c: "blue" }, { seg: [t(P), t(Q)], dash: "5 5", c: "blue" }, { seg: [t(P), t(R0)], dash: "5 5", c: "blue" },
      { angle: [Q, P, R0], right: true, c: "orange" }];
    if (lab) items.push({ len: lab[0], seg: [P, Q], side: -1, off: 14 }, { len: lab[1], seg: [P, R0], side: 1, off: 16 }, { len: lab[2], seg: [Q, t(Q)], side: -1, off: 16 });
    return plain([-1.2, 2.4 + v[0] + 1], [-0.9, 1.8 + v[1] + 0.5], items, { u: o.u || 40, w: o.w, cap: o.cap, alt: o.alt || "A prism whose bases are right triangles." });
  }
  var SOLIDS = [
    { k: "prism3", name: "triangular prism", o: { shape: "prism", n: 3, r: 1.3, h: 2.2, rot: 0.3 }, poly: true },
    { k: "box", name: "rectangular prism", o: { shape: "box", w: 3, h: 1.8, d: 1.8 }, poly: true },
    { k: "prism5", name: "pentagonal prism", o: { shape: "prism", n: 5, r: 1.3, h: 2.2, rot: 0.3 }, poly: true },
    { k: "prism6", name: "hexagonal prism", o: { shape: "prism", n: 6, r: 1.3, h: 2.2, rot: 0.3 }, poly: true },
    { k: "pyr3", name: "triangular pyramid", o: { shape: "pyramid", n: 3, r: 1.5, h: 2.4 }, poly: true },
    { k: "pyr4", name: "square pyramid", o: { shape: "pyramid", n: 4, r: 1.5, h: 2.4 }, poly: true },
    { k: "pyr5", name: "pentagonal pyramid", o: { shape: "pyramid", n: 5, r: 1.5, h: 2.4 }, poly: true },
    { k: "cyl", name: "cylinder", o: { shape: "cylinder", r: 1.2, h: 2.2 } },
    { k: "cone", name: "cone", o: { shape: "cone", r: 1.3, h: 2.4 } },
    { k: "sph", name: "sphere", o: { shape: "sphere", r: 1.6 } }];
  function solidFig(S, o) { return GT.solid(Object.assign({ size: 200, scale: 50, alt: "A " + S.name + "." }, S.o, o || {})); }

  /* ================================================================ Skills
     One for each kind of exercise in the chapter. Every problem comes with
     its picture when it's about a figure, hints that walk the steps, a
     worked reason, and a reply to the slip people usually make. */

  /* ------------------------------------------------- Marked-up polygons
     What a geometry diagram writes on a figure. P: the corners in order.
       o.names "ABC"                    corner names
       o.sides ["5", null, "x"]         a length beside side i (corner i to the next)
       o.ticks [1, 1, 0]                tick marks on side i: equal sides
       o.arcs  [1, 2, 0]                arcs in the angle at corner i: equal angles
       o.right [0]                      a right-angle box at corner i
       o.angs  ["40°", null, "x"]       a measure written in the angle at corner i
     polyItems returns the items; shapes([[P, o], …], { extra, alt, u }) frames one or more of them. */
  function polyItems(P, o) {
    o = o || {};
    var n = P.length, c = o.c || "blue", area = 0, i;
    for (i = 0; i < n; i++) { var a0 = P[i], b0 = P[(i + 1) % n]; area += a0[0] * b0[1] - b0[0] * a0[1]; }
    var out = area > 0 ? -1 : 1;
    var it = [{ poly: P, c: c, names: typeof o.names === "string" ? o.names.split("") : o.names, fill: o.fill }];
    for (i = 0; i < n; i++) {
      var p = P[i], q = P[(i + 1) % n], prev = P[(i + n - 1) % n];
      if (o.ticks && o.ticks[i]) it.push({ seg: [p, q], marks: o.ticks[i], c: c });
      if (o.sides && o.sides[i] != null) it.push({ len: String(o.sides[i]), seg: [p, q], side: out, off: o.off || 14, eq: !/[A-Za-z]{2}/.test(String(o.sides[i])) });   // "x + 3" is maths, "9 in." is words
      if (o.arcs && o.arcs[i]) it.push({ amarks: [q, p, prev], n: o.arcs[i], r: o.ar || 18 });
      if (o.right && o.right.indexOf(i) > -1) it.push({ angle: [q, p, prev], right: true, c: "orange" });
      if (o.angs && o.angs[i] != null) it.push({ angle: [q, p, prev], say: String(o.angs[i]), c: "orange" });
    }
    return it;
  }
  function shapes(polys, o) {
    o = o || {};
    var items = [], xs = [], ys = [];
    polys.forEach(function (pq) {
      pq[0].forEach(function (p) { xs.push(p[0]); ys.push(p[1]); });
      items = items.concat(polyItems(pq[0], pq[1]));
    });
    (o.pts || []).forEach(function (p) { xs.push(p[0]); ys.push(p[1]); });
    items = (o.under || []).concat(items, o.extra || []);
    var mg = o.m == null ? 1 : o.m;
    return plain([Math.min.apply(null, xs) - mg, Math.max.apply(null, xs) + mg], [Math.min.apply(null, ys) - mg, Math.max.apply(null, ys) + mg], items,
      { u: o.u || 30, alt: o.alt, cap: o.cap, w: o.w });
  }

  // A label that is maths ("x + 3", "12") and not words ("9 in.", "lake"): maths is set in italics.
  function isMaths(t) { return !/[A-Za-z]{2}/.test(String(t)); }
  // One marked triangle (or any polygon): tri(P, { names, sides, ticks, arcs, right, angs }, alt).
  function tri(P, m, alt, o) { return shapes([[P, m]], Object.assign({ alt: alt }, o || {})); }
  var T0 = [[0, 0], [4, 0], [1.2, 2.8]];
  // Two triangles side by side, the second a copy of the first moved across. m2 defaults to m1's marks.
  function twoTris(n1, n2, m1, m2, alt, P) {
    P = P || T0;
    var dx = Math.max.apply(null, P.map(function (p) { return p[0]; })) + 1.6;
    var Q = P.map(function (p) { return [p[0] + dx, p[1]]; });
    return shapes([[P, Object.assign({ names: n1 }, m1)], [Q, Object.assign({ names: n2, c: "green" }, m2 || m1)]], { alt: alt });
  }

  // A label beside the segment from p to q (side 1: on the left as you go from p to q; −1: on the right). Nothing if t is null.
  function lab(t, p, q, side, off) { return t == null ? [] : [{ len: String(t), seg: [p, q], side: side, off: off || 13, eq: isMaths(t) }]; }
  // A right triangle with legs w (across) and h (up). sides: labels for [bottom, hypotenuse, left]. m: more marks.
  function rt(w, h, sides, alt, m) { return tri([[0, 0], [w, 0], [0, h]], Object.assign({ names: "ABC", right: [0], sides: sides }, m || {}), alt); }

  /* A flowchart proof. boxes: [{ at: [cx, cy], t: "statement", r: "reason", w }], arrows: [[from, to], …]
     (box numbers). Each box holds its statement with the reason under it. o.x, o.y: the window. */
  function flow(boxes, arrows, o) {
    o = o || {};
    var items = [], W = 4.6, H = 1.3;
    arrows.forEach(function (a) {
      var p = boxes[a[0]], q = boxes[a[1]];
      items.push({ arrow: [[p.at[0] + (p.w || W) / 2, p.at[1]], [q.at[0] - (q.w || W) / 2 - 0.08, q.at[1]]], c: "orange" });
    });
    boxes.forEach(function (b) {
      var x = b.at[0], y = b.at[1], w = (b.w || W) / 2;
      items.push({ path: [[x - w, y - H / 2], [x + w, y - H / 2], [x + w, y + H / 2], [x - w, y + H / 2]], closed: true, fill: true, c: b.c || "blue" });
      items.push({ word: b.t, at: [x, y + 0.08] });
      items.push({ word: b.r, at: [x, y - 0.42], c: "soft" });
    });
    return plain(o.x, o.y, items, { u: o.u || 30, alt: o.alt, w: o.w });
  }

  /* Two lines cut by a transversal, with the eight angles numbered the usual way: 1 and 2 above the upper
     line (left, right), 3 and 4 below it, then 5 6 7 8 the same way round the lower crossing. So 1–5, 2–6, 3–7
     and 4–8 correspond; 3–6 and 4–5 are alternate interior; 1–8 and 2–7 alternate exterior; 3–5 and 4–6
     same-side interior.
       o.t      the transversal's direction in degrees (default 62)
       o.tilt   turns the lower line by this many degrees, so the lines are not parallel
       o.say    { 3: "(5x − 20)°", 6: "x" }: writes these in place of the numbers, and hides the other numbers
       o.only   [1, 5]: show just these numbers
       o.marks  false: no arrow marks on the lines (they mark the lines as parallel)
       o.names  [upper, lower, transversal] line names (default ℓ, m, t) */
  var T_PAIRS = { corr: [[1, 5], [2, 6], [3, 7], [4, 8]], altInt: [[3, 6], [4, 5]], altExt: [[1, 8], [2, 7]], ssInt: [[3, 5], [4, 6]] };
  function transFig(o) {
    o = o || {};
    var t = o.t || 62, tilt = o.tilt || 0, k = Math.PI / 180, B = [3.3, 0], A = [B[0] + 2.4 / Math.tan(t * k), 2.4], nm = o.names || ["ℓ", "m", "t"];
    var items = [{ dline: [[0.3, 2.4], [7.9, 2.4]] }, { dline: [GT.polar(B, 3, 180 + tilt), GT.polar(B, 4.6, tilt)] }, { dline: [GT.polar(B, 1.5, t + 180), GT.polar(A, 1.5, t)], c: "blue" },
      { word: nm[0], at: [7.75, 2.75], name: true }, { word: nm[1], at: GT.polar(B, 4.5, tilt + 4.5), name: true }, { word: nm[2], at: GT.polar(A, 1.5, t - 14), name: true, c: "blue" }];
    if (o.marks !== false && !tilt) [[1.2, 2.4], [1.2, 0]].forEach(function (p) { items.push({ path: [[p[0] - 0.16, p[1] + 0.14], [p[0], p[1]], [p[0] - 0.16, p[1] - 0.14]], c: "orange" }); });
    function label(I, base, first) {
      // upper left, upper right, lower left, lower right of the crossing at I
      [(t + 180 + base) / 2, (t + base) / 2, 180 + (t + base) / 2, 270 + (t + base) / 2 + (base ? base / 2 : 0)].forEach(function (d, i) {
        var n = first + i, acute = (i === 1 || i === 2) === (t < 90), txt = o.say && o.say[n] != null ? o.say[n] : (o.say && !o.only) || (o.only && o.only.indexOf(n) < 0) ? null : String(n);
        if (txt != null) items.push({ word: txt, at: GT.polar(I, (acute ? 0.95 : 0.62) + (txt.length > 2 ? 0.45 : 0), d), c: "orange" });
      });
    }
    label(A, 0, 1); label(B, tilt, 5);
    return plain([0, 8.4], [-1.5, 3.9], items, { u: o.u || 40, w: o.w, alt: o.alt || "Two " + (tilt ? "" : "parallel ") + "lines " + nm[0] + " and " + nm[1] + " cut by a transversal " + nm[2] + ", making eight angles numbered 1 to 8: 1 and 2 above the upper line, 3 and 4 below it, 5 and 6 above the lower line, 7 and 8 below it." });
  }
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Before Chapter 12 · Points on the plane, congruent figures, and vectors.",
    mins: 6, v: 4,
    steps: [
      { type: "plane", kicker: "Check 1 · The coordinate plane", prompt: "Click the point $(-4, 3)$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [-4, 3] }, skill: "Plot a point",
        clickFb: function (c) { return c && c[0] === 3 && c[1] === -4 ? "That is $(3, -4)$. The first number is $x$: across." : "The first number is $x$ (across), the second is $y$ (up or down)."; },
        hints: ["4 to the left, then 3 up."], why: "$x = -4$ is 4 to the left. $y = 3$ is 3 up." },
      { type: "pair", prompt: "Start at $(2, 3)$. Move 4 to the right and 1 down. Where are you? Type it as $(x, y)$.", answer: [6, 2], skill: "Moves on the plane",
        near: [{ v: [6, 4], fb: "Down means subtract from $y$." }], hints: ["Right changes $x$. Down changes $y$."], why: "$(2 + 4, 3 - 1) = (6, 2)$." },
      { type: "choice", kicker: "Check 2 · Congruent and similar", prompt: "Two figures have the same shape and the same size. What are they?",
        options: [{ t: "Congruent" }, { t: "Similar but not congruent", fb: "Similar figures have the same shape. With the same size as well, they are congruent." }],
        answer: 0, skill: "Congruent figures", hints: ["Same shape and same size."], why: "Same shape and same size: congruent." },
      { type: "num", prompt: "A triangle is enlarged with a scale factor of 3. One side was 5 long. How long is it now?", answer: 15, skill: "Scale factor",
        near: [{ v: 8, fb: "Multiply by the scale factor. Do not add it." }], hints: ["$5 \\cdot 3$."], why: "$5 \\cdot 3 = 15$." },
      { type: "pair", kicker: "Check 3 · Vectors", prompt: "Write the vector from $(1, 2)$ to $(4, 6)$. Type its components as $(x, y)$.", answer: [3, 4], skill: "Vectors",
        near: [{ v: [-3, -4], fb: "Terminal minus initial, in that order." }], hints: ["$4 - 1$ and $6 - 2$."], why: "⟨3, 4⟩." },
      { type: "num", prompt: "Find $360 \\div 5$.", answer: 72, skill: "Arithmetic",
        hints: ["$5 \\cdot 70 = 350$."], why: "$5 \\cdot 72 = 360$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 12-1**. If **check 1** slipped, see lesson 1-6. If **check 3** slipped, see lesson 8-6.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });

  /* ======================================================================== 12-1 · Reflections */
  var HOW_12_1 = [["Line", "Find the line of reflection."],
                  ["Rule", "Across the $x$-axis: $(x, y) \\to (x, -y)$. Across the $y$-axis: $(x, y) \\to (-x, y)$. Across $y = x$: $(x, y) \\to (y, x)$."],
                  ["Image", "Apply the rule to every vertex."]];
  var FIG_RY = trFig(TRI, TRI.map(RULE.ry), "A coordinate grid. Triangle ABC has A at (1, 1), B at (4, 1) and C at (1, 3). Its mirror image across the y-axis has A′ at (−1, 1), B′ at (−4, 1) and C′ at (−1, 3).", { extra: [{ mirror: "y" }] }),
      FIG_RIVER = grid([-1, 8], [-3, 4], [{ line: [[0, 0], [1, 0]], c: "blue", bare: true }, { seg: [[1, 3], [4, 0]], c: "orange" }, { seg: [[4, 0], [6, 2]], c: "orange" }, { seg: [[4, 0], [6, -2]], c: "soft", dash: true },
        { pt: [1, 3], name: "A", at: "nw" }, { pt: [6, 2], name: "B", at: "ne" }, { pt: [6, -2], name: "B'", at: "se", c: "soft" }, { pt: [4, 0], name: "P", at: "s", c: "orange" }],
        { u: 28, alt: "A coordinate grid. A is at (1, 3) and B is at (6, 2), both above the x-axis. B′, at (6, −2), is the mirror image of B. A path runs from A to P at (4, 0) on the axis, then to B. The dashed continuation from P runs straight on to B′." });
  LESSONS.push({
    title: "Reflections",
    blurb: "Book 12-1 · A reflection flips a figure across a line, and keeps its size and shape.",
    mins: 13, v: 4,
    steps: [
      { type: "pair", kicker: "Warm up", prompt: "Take the point $(3, 5)$ and change the sign of its $y$-coordinate. Type the new point as $(x, y)$.", answer: [3, -5], skill: "Reflections",
        near: [{ v: [-3, 5], fb: "Change the sign of $y$, the second number." }], hints: ["Keep $x$. Flip the sign of $y$."], why: "$(3, -5)$." },
      { type: "learn", kicker: "Explore",
        prompt: "A **reflection** flips a figure across a line. Reflect this triangle across each line in turn, and watch what happens to its corners.",
        scene: { type: "move", kind: "reflect", shape: TRI, x: [-6, 6], y: [-6, 6], gate: true },
        gate: true, then: "The image is the same size and shape, but it faces the other way. Each corner lands as far behind the mirror line as it started in front of it." },
      { type: "learn", kicker: "The idea",
        prompt: "A transformation that keeps size and shape is an **isometry**. A reflection is one: the image is congruent to the original. The line of reflection is the perpendicular bisector of every segment that joins a point to its image.",
        scene: { type: "method", how: HOW_12_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\triangle ABC$ reflected across the $y$-axis.",
        scene: { type: "walk", how: HOW_12_1, rows: [
          { step: 1, m: "\\text{the } y\\text{-axis}", say: "The mirror line.", fig: FIG_RY },
          { step: 2, m: "(x, y) \\to (-x, y)", say: "Across the $y$-axis, $x$ changes sign and $y$ stays." },
          { step: 3, m: "A(1, 1) \\to A'(-1, 1)", say: "One unit right of the axis becomes one unit left.",
            ask: { prompt: "Where does $B(4, 1)$ go?", answer: 0,
                   options: [{ t: "$(-4, 1)$" }, { t: "$(4, -1)$", fb: "That is a reflection across the $x$-axis." }] } },
          { step: 3, m: "B(4, 1) \\to B'(-4, 1)", say: "The same rule." },
          { step: 3, m: "C(1, 3) \\to C'(-1, 3)", say: "$\\triangle A'B'C'$ is congruent to $\\triangle ABC$." }] },
        gate: true, then: "Line, rule, image." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Reflect $P(2, -3)$ and $Q(5, 1)$ across the $x$-axis.",
        how: HOW_12_1, skill: "Reflections",
        steps: [
          { step: 1, ask: "What is the line of reflection?", type: "choice", answer: 0,
            options: [{ t: "The $x$-axis" }, { t: "The $y$-axis", fb: "The question says the $x$-axis." }],
            m: "\\text{the } x\\text{-axis}", say: "The horizontal axis." },
          { step: 2, ask: "Which rule reflects across the $x$-axis?", type: "choice", answer: 0,
            options: [{ t: "$(x, y) \\to (x, -y)$" }, { t: "$(x, y) \\to (-x, y)$", fb: "That flips left and right: across the $y$-axis." }],
            m: "(x, y) \\to (x, -y)", say: "$x$ stays, and $y$ changes sign." },
          { step: 3, ask: "$P(2, -3) \\to P'(2, y)$. What is $y$?", type: "num", answer: 3, near: [{ v: -3, fb: "Change the sign: $-(-3) = 3$." }], hint: "The opposite of $-3$.",
            m: "P'(2, 3)", say: "Below the axis becomes above it." },
          { step: 3, ask: "$Q(5, 1) \\to Q'(5, y)$. What is $y$?", type: "num", answer: -1, hint: "The opposite of 1.",
            m: "Q'(5, -1)", say: "Above the axis becomes below it." }],
        why: "Line, rule, image. Now two on your own." },
      { type: "plot", kicker: "On your own", prompt: "Draw the image of $\\triangle ABC$ after a reflection across the $x$-axis.",
        show: [{ poly: TRI, c: "soft", names: "ABC" }, { mirror: "x" }], target: TRI.map(RULE.rx), x: [-6, 6], y: [-6, 6], u: 24, skill: "Reflections",
        hints: ["$(x, y) \\to (x, -y)$. Start with $A(1, 1)$.", "$A'(1, -1)$, $B'(4, -1)$, $C'(1, -3)$."], why: "Each $y$ changes sign: $A'(1, -1)$, $B'(4, -1)$, $C'(1, -3)$." },
      { type: "pair", prompt: "Reflect $(4, -1)$ across the line $y = x$. Type the image as $(x, y)$.", answer: [-1, 4], skill: "Reflections",
        near: [{ v: [4, 1], fb: "That is across the $x$-axis. Across $y = x$ the coordinates swap." }, { v: [-4, 1], fb: "Swap the coordinates. Keep their signs." }], hints: ["$(x, y) \\to (y, x)$."], why: "The coordinates swap: $(-1, 4)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A reflection finds the shortest path. You must walk from $A$ to the river (the $x$-axis) and then on to $B$. Where should you reach the river?",
        scene: { type: "walk", how: [["Reflect", "Reflect one point across the line."], ["Join", "Join the other point to that image with a straight segment."], ["Cross", "Where the segment crosses the line is the best point."]], rows: [
          { step: 1, m: "B(6, 2) \\to B'(6, -2)", say: "Reflect $B$ across the river.", fig: FIG_RIVER },
          { step: 2, m: "\\text{slope of } \\overline{AB'} = \\frac{-2 - 3}{6 - 1} = -1", say: "The straight segment from $A(1, 3)$ to $B'$." },
          { step: 2, m: "y = -x + 4", say: "Through $(1, 3)$ with slope $-1$.",
            ask: { prompt: "Where does $y = -x + 4$ cross the $x$-axis?", answer: 0,
                   options: [{ t: "$(4, 0)$" }, { t: "$(0, 4)$", fb: "That is where it crosses the $y$-axis. On the $x$-axis, $y = 0$." }] } },
          { step: 3, m: "P(4, 0)", say: "$PB = PB'$, so the path $A$ to $P$ to $B$ is as short as the straight segment to $B'$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A point is 5 units from the line of reflection. How far is it from its own image?", answer: 10, skill: "Reflections",
        near: [{ v: 5, fb: "The image is 5 units on the other side as well." }], hints: ["The line is half-way between the point and its image."], why: "$5 + 5 = 10$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To reflect $(3, 5)$ across the $x$-axis, Kim writes $(-3, 5)$. What is wrong?",
        options: [{ t: "That is across the $y$-axis. Across the $x$-axis the $y$ changes sign: $(3, -5)$." },
                  { t: "Both signs should change: $(-3, -5)$.", fb: "That is a half turn about the origin." },
                  { t: "Nothing. $(-3, 5)$ is right.", fb: "The $x$-axis is horizontal, so the point flips up and down, not left and right." }],
        answer: 0, skill: "Reflections", hints: ["Flipping across a horizontal line changes how high the point is."], why: "$(x, y) \\to (x, -y)$." },
      { type: "choice", kicker: "Use it", prompt: "The word on the front of an ambulance is painted backwards, so that it reads correctly in a driver's rear-view mirror. Which transformation does the mirror perform?",
        options: [{ t: "A reflection" }, { t: "A rotation", fb: "A turn would not reverse the letters." }, { t: "A translation", fb: "A slide would not reverse the letters." }],
        answer: 0, skill: "Reflections", hints: ["Which transformation reverses left and right?"], why: "A mirror reflects: it flips the image." }
    ]
  });

  /* ======================================================================= 12-2 · Translations */
  var HOW_12_2 = [["Vector", "Read the translation vector ⟨$a$, $b$⟩: $a$ across and $b$ up."],
                  ["Rule", "$(x, y) \\to (x + a, y + b)$."],
                  ["Image", "Apply the rule to every vertex."]];
  var T2 = [[-4, 1], [-1, 1], [-4, 3]];
  var FIG_TR = trFig(T2, T2.map(shift(5, -3)), "A coordinate grid. Triangle ABC has A at (−4, 1), B at (−1, 1) and C at (−4, 3). Its image, 5 to the right and 3 down, has A′ at (1, −2), B′ at (4, −2) and C′ at (1, 0).",
        { extra: T2.map(function (p) { return { arrow: [p, shift(5, -3)(p)], c: "orange", dash: true }; }) });
  LESSONS.push({
    title: "Translations",
    blurb: "Book 12-2 · A translation slides every point of a figure along the same vector.",
    mins: 12, v: 4,
    steps: [
      { type: "pair", kicker: "Warm up", prompt: "Start at $(2, 3)$. Move 4 to the right and 1 down. Where are you? Type it as $(x, y)$.", answer: [6, 2], skill: "Moves on the plane",
        near: [{ v: [6, 4], fb: "Down means subtract from $y$." }], hints: ["Right changes $x$. Down changes $y$."], why: "$(2 + 4, 3 - 1) = (6, 2)$." },
      { type: "learn", kicker: "Explore",
        prompt: "A **translation** slides a figure without turning or flipping it. Slide this triangle, and watch its corners.",
        scene: { type: "move", kind: "translate", shape: TRI, x: [-6, 6], y: [-6, 6], gate: true },
        gate: true, then: "Every corner moves the same distance in the same direction. That one move is the **translation vector**." },
      { type: "learn", kicker: "The idea",
        prompt: "A translation moves every point along the same vector ⟨$a$, $b$⟩. It is an isometry: the image is congruent to the original, and it faces the same way.",
        scene: { type: "method", how: HOW_12_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\triangle ABC$ translated along the vector ⟨5, −3⟩.",
        scene: { type: "walk", how: HOW_12_2, rows: [
          { step: 1, m: "⟨5, -3⟩", say: "5 to the right and 3 down.", fig: FIG_TR },
          { step: 2, m: "(x, y) \\to (x + 5, y - 3)", say: "Add the vector's components." },
          { step: 3, m: "A(-4, 1) \\to A'(1, -2)", say: "$-4 + 5$ and $1 - 3$.",
            ask: { prompt: "Where does $B(-1, 1)$ go?", answer: 0,
                   options: [{ t: "$(4, -2)$" }, { t: "$(-6, 4)$", fb: "That moves 5 left and 3 up: the opposite vector." }] } },
          { step: 3, m: "B(-1, 1) \\to B'(4, -2)", say: "The same move." },
          { step: 3, m: "C(-4, 3) \\to C'(1, 0)", say: "Every corner slides along the same vector." }] },
        gate: true, then: "Vector, rule, image." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Translate $P(1, 4)$ and $Q(-2, 0)$ along the vector ⟨−3, 5⟩.",
        how: HOW_12_2, skill: "Translations",
        steps: [
          { step: 1, ask: "What does the vector ⟨−3, 5⟩ say?", type: "choice", answer: 0,
            options: [{ t: "3 to the left and 5 up" }, { t: "3 to the right and 5 down", fb: "A negative first component means left. A positive second component means up." }],
            m: "⟨-3, 5⟩", say: "Left 3, up 5." },
          { step: 2, ask: "Which rule is it?", type: "choice", answer: 0,
            options: [{ t: "$(x, y) \\to (x - 3, y + 5)$" }, { t: "$(x, y) \\to (-3x, 5y)$", fb: "A translation adds. It does not multiply." }],
            m: "(x, y) \\to (x - 3, y + 5)", say: "Add each component." },
          { step: 3, ask: "$P(1, 4) \\to P'(x, 9)$. What is $x$?", type: "num", answer: -2, near: [{ v: 4, fb: "Subtract 3 from 1." }], hint: "$1 - 3$.",
            m: "P'(-2, 9)", say: "$1 - 3$ and $4 + 5$." },
          { step: 3, ask: "$Q(-2, 0) \\to Q'(-5, y)$. What is $y$?", type: "num", answer: 5, hint: "$0 + 5$.",
            m: "Q'(-5, 5)", say: "$-2 - 3$ and $0 + 5$." }],
        why: "Vector, rule, image. Now two on your own." },
      { type: "plot", kicker: "On your own", prompt: "Draw the image of $\\triangle ABC$ after a translation along ⟨−4, 2⟩.",
        show: [{ poly: TRI, c: "soft", names: "ABC" }], target: TRI.map(shift(-4, 2)), x: [-6, 6], y: [-6, 6], u: 24, skill: "Translations",
        hints: ["Each corner moves 4 left and 2 up. Start with $A(1, 1)$.", "$A'(-3, 3)$, $B'(0, 3)$, $C'(-3, 5)$."], why: "$(x, y) \\to (x - 4, y + 2)$: $A'(-3, 3)$, $B'(0, 3)$, $C'(-3, 5)$." },
      { type: "pair", prompt: "A translation sends $A(2, 5)$ to $A'(7, 1)$. Type the components of its vector as $(a, b)$.", answer: [5, -4], skill: "Translations",
        near: [{ v: [-5, 4], fb: "Image minus original: $7 - 2$ and $1 - 5$." }], hints: ["$7 - 2$ and $1 - 5$."], why: "⟨5, −4⟩." },
      { type: "learn", kicker: "A harder case",
        prompt: "Going backwards. Under a translation along ⟨5, −3⟩, the image of $A$ is $A'(2, -1)$. Find $A$.",
        scene: { type: "walk", how: [["Undo", "To go back, use the opposite vector."], ["Rule", "Write the rule for the opposite vector."], ["Check", "Translate your answer forwards to check it."]], rows: [
          { step: 1, m: "⟨-5, 3⟩", say: "The opposite of ⟨5, −3⟩: 5 left and 3 up." },
          { step: 2, m: "(x, y) \\to (x - 5, y + 3)", say: "The rule that undoes the translation." },
          { step: 2, m: "A = (2 - 5, -1 + 3) = (-3, 2)", say: "Apply it to $A'$.",
            ask: { prompt: "Check: where does ⟨5, −3⟩ send $(-3, 2)$?", answer: 0,
                   options: [{ t: "$(2, -1)$" }, { t: "$(-8, 5)$", fb: "That applies the opposite vector again. Add 5 and subtract 3." }] } },
          { step: 3, m: "(-3 + 5, 2 - 3) = (2, -1)", say: "It lands on $A'$, so $A$ is $(-3, 2)$." }] },
        gate: true },
      { type: "pair", kicker: "Try it", prompt: "Find the image of $(-2, 6)$ under a translation along ⟨4, −9⟩. Type it as $(x, y)$.", answer: [2, -3], skill: "Translations",
        near: [{ v: [-6, 15], fb: "Add the vector. Do not subtract it." }], hints: ["$-2 + 4$ and $6 - 9$."], why: "$(2, -3)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To translate $(3, 2)$ along ⟨−4, 1⟩, Ty writes $(7, 3)$. What is wrong?",
        options: [{ t: "He added 4 instead of subtracting it. The image is $(-1, 3)$." },
                  { t: "The image is $(-12, 2)$.", fb: "A translation adds the components. It does not multiply." },
                  { t: "Nothing. $(7, 3)$ is right.", fb: "The first component is $-4$: the point moves left." }],
        answer: 0, skill: "Translations", hints: ["Which way does $-4$ move the point?"], why: "$(3 - 4, 2 + 1) = (-1, 3)$." },
      { type: "num", kicker: "Use it", prompt: "In a marching band routine, a drummer moves along the vector ⟨3, 4⟩, measured in metres. How far does she move?", post: "m", answer: 5, skill: "Translations",
        near: [{ v: 7, fb: "The distance is the vector's magnitude: $\\sqrt{3^2 + 4^2}$." }], hints: ["The magnitude of the vector."], why: "$\\sqrt{9 + 16} = 5$." }
    ]
  });

  /* ========================================================================== 12-3 · Rotations */
  var HOW_12_3 = [["Centre", "Find the centre of rotation and the angle. Counterclockwise is the positive direction."],
                  ["Rule", "About the origin. 90°: $(x, y) \\to (-y, x)$. 180°: $(x, y) \\to (-x, -y)$. 270°: $(x, y) \\to (y, -x)$."],
                  ["Image", "Apply the rule to every vertex."]];
  var FIG_ROT = trFig(TRI, TRI.map(RULE.r90), "A coordinate grid. Triangle ABC has A at (1, 1), B at (4, 1) and C at (1, 3). Its image after a quarter turn counterclockwise about the origin has A′ at (−1, 1), B′ at (−1, 4) and C′ at (−3, 1).",
        { extra: [{ centre: [0, 0], say: "" }, { turn: [[0, 0], 1.6, 14, 104], c: "orange", say: "90°" }] });
  LESSONS.push({
    title: "Rotations",
    blurb: "Book 12-3 · A rotation turns a figure about a fixed point through a given angle.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "How many degrees are in a quarter turn?", post: "°", answer: 90, skill: "Angles",
        near: [{ v: 45, fb: "45° is an eighth of a turn. A whole turn is 360°." }], hints: ["$360 \\div 4$."], why: "$360 \\div 4 = 90$." },
      { type: "learn", kicker: "Explore",
        prompt: "A **rotation** turns a figure about a fixed point, the **centre of rotation**. Turn this triangle a quarter turn at a time, and watch one corner.",
        scene: { type: "move", kind: "rotate", shape: [[1, 1], [3, 1], [3, 2]], center: [0, 0], x: [-5, 5], y: [-5, 5], gate: true },
        gate: true, then: "Each corner stays the same distance from the centre. After four quarter turns the triangle is back where it began." },
      { type: "learn", kicker: "The idea",
        prompt: "A rotation is fixed by its centre and its angle. It is an isometry. Unless you are told otherwise, a rotation is **counterclockwise**. About the origin, the turns of 90°, 180° and 270° have simple rules.",
        scene: { type: "method", how: HOW_12_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\triangle ABC$ rotated 90° about the origin.",
        scene: { type: "walk", how: HOW_12_3, rows: [
          { step: 1, m: "90° \\text{ about } (0, 0)", say: "A quarter turn, counterclockwise.", fig: FIG_ROT },
          { step: 2, m: "(x, y) \\to (-y, x)", say: "Swap the coordinates, then change the sign of the new first one." },
          { step: 3, m: "A(1, 1) \\to A'(-1, 1)", say: "From the first quadrant into the second.",
            ask: { prompt: "Where does $B(4, 1)$ go?", answer: 0,
                   options: [{ t: "$(-1, 4)$" }, { t: "$(1, -4)$", fb: "That is a turn of 270°, the other way round." }] } },
          { step: 3, m: "B(4, 1) \\to B'(-1, 4)", say: "$-y$ first, then $x$." },
          { step: 3, m: "C(1, 3) \\to C'(-3, 1)", say: "The image is congruent to the original." }] },
        gate: true, then: "Centre, rule, image." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Rotate $P(3, 2)$ and $Q(5, -1)$ by 180° about the origin.",
        how: HOW_12_3, skill: "Rotations",
        steps: [
          { step: 1, ask: "What kind of turn is 180°?", type: "choice", answer: 0,
            options: [{ t: "A half turn" }, { t: "A quarter turn", fb: "A quarter turn is 90°." }],
            m: "180° \\text{ about } (0, 0)", say: "A half turn. Clockwise or counterclockwise, it ends in the same place." },
          { step: 2, ask: "Which rule is a half turn about the origin?", type: "choice", answer: 0,
            options: [{ t: "$(x, y) \\to (-x, -y)$" }, { t: "$(x, y) \\to (-y, x)$", fb: "That is a quarter turn." }],
            m: "(x, y) \\to (-x, -y)", say: "Both signs change." },
          { step: 3, ask: "$P(3, 2) \\to P'(x, -2)$. What is $x$?", type: "num", answer: -3, hint: "The opposite of 3.",
            m: "P'(-3, -2)", say: "Straight through the origin to the other side." },
          { step: 3, ask: "$Q(5, -1) \\to Q'(-5, y)$. What is $y$?", type: "num", answer: 1, near: [{ v: -1, fb: "Change the sign: $-(-1) = 1$." }], hint: "The opposite of $-1$.",
            m: "Q'(-5, 1)", say: "Both signs change." }],
        why: "Centre, rule, image. Now two on your own." },
      { type: "plot", kicker: "On your own", prompt: "Draw the image of $\\triangle ABC$ after a rotation of 90° counterclockwise about the origin.",
        show: [{ poly: TRI, c: "soft", names: "ABC" }, { centre: [0, 0], say: "", at: "sw" }], target: TRI.map(RULE.r90), x: [-6, 6], y: [-6, 6], u: 24, skill: "Rotations",
        hints: ["$(x, y) \\to (-y, x)$. Start with $A(1, 1)$.", "$A'(-1, 1)$, $B'(-1, 4)$, $C'(-3, 1)$."], why: "$(x, y) \\to (-y, x)$: $A'(-1, 1)$, $B'(-1, 4)$, $C'(-3, 1)$." },
      { type: "pair", prompt: "Rotate $(2, 5)$ by 270° counterclockwise about the origin. Type the image as $(x, y)$.", answer: [5, -2], skill: "Rotations",
        near: [{ v: [-5, 2], fb: "That is a turn of 90°. For 270° use $(y, -x)$." }], hints: ["$(x, y) \\to (y, -x)$."], why: "$(5, -2)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Which rotation about the origin sends $A(2, 1)$ to $A'(-1, 2)$?",
        scene: { type: "walk", how: [["Try", "Try each rule on the point."], ["Match", "Find the rule that gives the image."], ["Name", "Name the angle."]], rows: [
          { step: 1, m: "180°\\text{: } (2, 1) \\to (-2, -1)", say: "Not the image." },
          { step: 1, m: "90°\\text{: } (2, 1) \\to (-1, 2)", say: "$(-y, x)$.",
            ask: { prompt: "Is $(-1, 2)$ the image $A'$?", answer: 0,
                   options: [{ t: "Yes" }, { t: "No", fb: "$A'$ is $(-1, 2)$: it matches." }] } },
          { step: 2, m: "(x, y) \\to (-y, x)", say: "This rule gives $A'$." },
          { step: 3, m: "90° \\text{ counterclockwise}", say: "A quarter turn about the origin." }] },
        gate: true },
      { type: "pair", kicker: "Try it", prompt: "Rotate $(-4, 1)$ by 90° counterclockwise about the origin. Type the image as $(x, y)$.", answer: [-1, -4], skill: "Rotations",
        near: [{ v: [1, 4], fb: "That is a turn of 270°. For 90° use $(-y, x)$." }, { v: [4, -1], fb: "That is a half turn. For 90° use $(-y, x)$." }], hints: ["$(x, y) \\to (-y, x)$."], why: "$(-1, -4)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To rotate $(2, 3)$ by 90° counterclockwise about the origin, Jo writes $(3, -2)$. What is wrong?",
        options: [{ t: "That is a turn of 270°, which is 90° clockwise. The image is $(-3, 2)$." },
                  { t: "The image is $(-2, -3)$.", fb: "That is a half turn." },
                  { t: "Nothing. $(3, -2)$ is right.", fb: "A counterclockwise quarter turn takes the first quadrant to the second, where $x$ is negative." }],
        answer: 0, skill: "Rotations", hints: ["Which quadrant does a counterclockwise quarter turn carry $(2, 3)$ into?"], why: "$(x, y) \\to (-y, x)$ gives $(-3, 2)$." },
      { type: "num", kicker: "Use it", prompt: "Through what angle does the minute hand of a clock turn in 20 minutes?", post: "°", answer: 120, skill: "Rotations",
        near: [{ v: 20, fb: "20 is the number of minutes. A full turn of 360° takes 60 minutes." }], hints: ["20 minutes is one third of an hour."], why: "$\\frac{20}{60} \\cdot 360 = 120$." }
    ]
  });
  /* ===================================================== 12-4 · Compositions of transformations */
  var HOW_12_4 = [["First", "Do the first transformation."],
                  ["Second", "Do the second transformation to the **image**, not to the original."],
                  ["Describe", "Describe the result as one transformation, if you can."]];
  var T4 = [[1, 1], [3, 1], [1, 2]];
  var FIG_GLIDE = grid([-1, 9], [-4, 4], [{ poly: T4, names: "ABC", c: "soft" }, { poly: T4.map(shift(4, 0)), c: "soft", dash: true }, { arrow: [[1, 2], [5, 2]], c: "orange", dash: true }, { mirror: "x" },
        { poly: T4.map(shift(4, 0)).map(RULE.rx), names: primes("ABC"), c: "blue" }], { u: 24, alt: "A coordinate grid. Triangle ABC, above the x-axis, is first slid 4 to the right, and then flipped across the x-axis to give triangle A′B′C′ below the axis." }),
      FIG_2LINES = grid([-2, 8], [-1, 5], [{ mirror: { x: 1 } }, { mirror: { x: 4 } }, { arrow: [[0, 2], [2, 2]], c: "orange", dash: true }, { arrow: [[2, 2], [6, 2]], c: "green", dash: true },
        { pt: [0, 2], name: "P", at: "n" }, { pt: [2, 2], name: "P'", at: "n", c: "soft" }, { pt: [6, 2], name: "P''", at: "n", c: "blue" }], { u: 28, alt: "A coordinate grid with the vertical lines x = 1 and x = 4. P at (0, 2) is reflected across the first line to (2, 2), and then across the second line to (6, 2)." });
  LESSONS.push({
    title: "Compositions of transformations",
    blurb: "Book 12-4 · One transformation after another, and what the pair amounts to.",
    mins: 12, v: 4,
    steps: [
      { type: "pair", kicker: "Warm up", prompt: "Reflect $(2, 3)$ across the $x$-axis. Type the image as $(x, y)$.", answer: [2, -3], skill: "Reflections",
        near: [{ v: [-2, 3], fb: "That is across the $y$-axis." }], hints: ["$(x, y) \\to (x, -y)$."], why: "$(2, -3)$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **composition** is one transformation followed by another. A composition of isometries is an isometry. A translation followed by a reflection across a line parallel to it is a **glide reflection**. Two reflections make a translation if the lines are parallel, and a rotation if they cross.",
        scene: { type: "method", how: HOW_12_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a glide reflection: translate along ⟨4, 0⟩, then reflect across the $x$-axis. Follow the corner $C(1, 2)$.",
        scene: { type: "walk", how: HOW_12_4, rows: [
          { step: 1, m: "C(1, 2) \\to (5, 2)", say: "The translation: 4 to the right.", fig: FIG_GLIDE },
          { step: 2, m: "(5, 2) \\to C'(5, -2)", say: "The reflection, applied to the image.",
            ask: { prompt: "Which point is reflected across the $x$-axis in this second step?", answer: 0,
                   options: [{ t: "$(5, 2)$, the image from the first step" }, { t: "$(1, 2)$, the original point", fb: "The second transformation acts on the result of the first." }] } },
          { step: 3, m: "(x, y) \\to (x + 4, -y)", say: "The two steps as one rule." },
          { step: 3, m: "\\text{a glide reflection}", say: "A slide along a line, then a flip across it." }] },
        gate: true, then: "First, second, describe." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Reflect $P(0, 2)$ across the line $x = 1$, and then across the line $x = 4$.", art: FIG_2LINES,
        how: HOW_12_4, skill: "Compositions",
        steps: [
          { step: 1, ask: "$P$ is 1 unit left of the line $x = 1$. What is the $x$-coordinate of its image $P'$?", type: "num", answer: 2, hint: "1 unit to the right of the line.",
            m: "P(0, 2) \\to P'(2, 2)", say: "As far beyond the line as $P$ was before it." },
          { step: 2, ask: "$P'(2, 2)$ is 2 units left of the line $x = 4$. What is the $x$-coordinate of $P''$?", type: "num", answer: 6, near: [{ v: 8, fb: "Reflect $P'$, not $P$: 2 units to the right of the line." }], hint: "2 units to the right of the line.",
            m: "P'(2, 2) \\to P''(6, 2)", say: "The second reflection acts on $P'$." },
          { step: 3, ask: "$P(0, 2)$ ended at $(6, 2)$. Which single transformation does that?", type: "choice", answer: 0,
            options: [{ t: "A translation of 6 to the right" }, { t: "A reflection across $x = 3$", fb: "A single reflection would flip the figure. Two flips leave it facing the same way." }],
            m: "⟨6, 0⟩", say: "A translation of twice the distance between the two lines: $2 \\cdot 3 = 6$." }],
        why: "First, second, describe. Now two on your own." },
      { type: "pair", kicker: "On your own", prompt: "Rotate $(3, 1)$ by 180° about the origin, and then translate along ⟨2, 5⟩. Type the final image as $(x, y)$.", answer: [-1, 4], skill: "Compositions",
        near: [{ v: [-5, -6], fb: "Translate first only if the question says so. Rotate first, then add the vector." }, { v: [5, 6], fb: "That skips the rotation." }], hints: ["First: $(3, 1) \\to (-3, -1)$.", "Then add ⟨2, 5⟩."], why: "$(-3, -1)$, then $(-3 + 2, -1 + 5) = (-1, 4)$." },
      { type: "choice", prompt: "A figure is reflected across the $x$-axis, and then across the $y$-axis. Which single transformation gives the same result?",
        options: [{ t: "A rotation of 180° about the origin" }, { t: "A translation", fb: "Two reflections make a translation only when the lines are parallel. The axes cross." }, { t: "A reflection across $y = x$", fb: "Try the point $(1, 2)$: it goes to $(1, -2)$ and then to $(-1, -2)$." }],
        answer: 0, skill: "Compositions", hints: ["Follow $(x, y)$: first $(x, -y)$, then $(-x, -y)$."], why: "$(x, y) \\to (-x, -y)$: a half turn. The axes cross at 90°, and the turn is twice that." },
      { type: "learn", kicker: "A harder case",
        prompt: "Does the **order** matter? Take $(2, 1)$, a translation along ⟨3, 0⟩, and a reflection across the $y$-axis.",
        scene: { type: "walk", how: [["One", "Do the two transformations in one order."], ["Other", "Do them in the other order."], ["Compare", "Compare the two results."]], rows: [
          { step: 1, m: "(2, 1) \\to (5, 1) \\to (-5, 1)", say: "Translate, then reflect." },
          { step: 2, m: "(2, 1) \\to (-2, 1) \\to (1, 1)", say: "Reflect, then translate.",
            ask: { prompt: "Are $(-5, 1)$ and $(1, 1)$ the same point?", answer: 0,
                   options: [{ t: "No" }, { t: "Yes", fb: "Their $x$-coordinates differ." }] } },
          { step: 3, m: "(-5, 1) \\ne (1, 1)", say: "The order changed the result. Always do them in the order given." }] },
        gate: true },
      { type: "pair", kicker: "Try it", prompt: "Reflect $(-2, 4)$ across the $y$-axis, and then translate along ⟨1, −3⟩. Type the final image as $(x, y)$.", answer: [3, 1], skill: "Compositions",
        near: [{ v: [1, 1], fb: "Reflect first: $(-2, 4) \\to (2, 4)$. Then translate." }], hints: ["First: $(2, 4)$.", "Then $(2 + 1, 4 - 3)$."], why: "$(2, 4)$, then $(3, 1)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Translate $(1, 3)$ along ⟨2, 0⟩, then reflect across the $x$-axis. Al translates to get $(3, 3)$, then reflects the **original** point and answers $(1, -3)$. What is wrong?",
        options: [{ t: "The reflection must act on the image $(3, 3)$: the answer is $(3, -3)$." },
                  { t: "He should reflect first.", fb: "The question gives the order: translate, then reflect." },
                  { t: "Nothing. $(1, -3)$ is right.", fb: "The second transformation acts on the result of the first." }],
        answer: 0, skill: "Compositions", hints: ["Which point does the second transformation act on?"], why: "$(1, 3) \\to (3, 3) \\to (3, -3)$." },
      { type: "choice", kicker: "Use it", prompt: "A line of footprints in wet sand shows a left foot, then a right foot further on, then a left, and so on. Which transformation carries each footprint to the next?",
        options: [{ t: "A glide reflection" }, { t: "A translation", fb: "A slide alone would give a left foot every time." }, { t: "A rotation", fb: "The footprints all point the same way." }],
        answer: 0, skill: "Compositions", hints: ["Each print slides forward, and flips from left to right."], why: "A slide along the path, then a flip across it." }
    ]
  });

  /* ============================================================================ 12-5 · Symmetry */
  var HOW_12_5 = [["Lines", "Line symmetry: can a line fold the figure exactly onto itself? Count the lines."],
                  ["Turns", "Rotational symmetry: turn the figure less than 360° about its centre. Does it land on itself?"],
                  ["Order", "The order is how many times it lands on itself in one full turn. The angle of rotational symmetry is 360° divided by the order."]];
  var FIG_PENT = symFig(5, "A regular pentagon with five dashed lines through its centre, each from a vertex to the middle of the opposite side."),
      FIG_RECTS = plain([-3.4, 3.4], [-2.4, 2.4], [{ poly: [[-2.6, -1.4], [2.6, -1.4], [2.6, 1.4], [-2.6, 1.4]], c: "blue", fill: true }, { seg: [[-3.1, 0], [3.1, 0]], dash: true, c: "orange" }, { seg: [[0, -2.1], [0, 2.1]], dash: true, c: "orange" }],
        { u: 30, alt: "A rectangle that is wider than it is tall, with two dashed lines through its centre: one across and one up and down." }),
      FIG_PYR4 = GT.solid({ shape: "pyramid", n: 4, r: 1.5, h: 2.4, size: 220, scale: 52, alt: "A square pyramid." });
  LESSONS.push({
    title: "Symmetry",
    blurb: "Book 12-5 · Line symmetry and rotational symmetry, and the order of a symmetry.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $360 \\div 6$.", answer: 60, skill: "Arithmetic",
        hints: ["$6 \\cdot 6 = 36$."], why: "$6 \\cdot 60 = 360$." },
      { type: "learn", kicker: "The idea",
        prompt: "A figure has **symmetry** if a transformation carries it onto itself. **Line symmetry**: a reflection does it, and the mirror line is a **line of symmetry**. **Rotational symmetry**: a turn of less than 360° about its centre does it.",
        scene: { type: "method", how: HOW_12_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the symmetry of a regular pentagon described.",
        scene: { type: "walk", how: HOW_12_5, rows: [
          { step: 1, m: "5 \\text{ lines of symmetry}", say: "One through each vertex and the middle of the opposite side.", fig: FIG_PENT },
          { step: 2, m: "\\text{it lands on itself 5 times in a full turn}", say: "Each vertex moves on to the next." },
          { step: 3, m: "\\text{order } 5", say: "Five positions look the same.",
            ask: { prompt: "What is $360 \\div 5$?", answer: 0,
                   options: [{ t: "72" }, { t: "60", fb: "That is $360 \\div 6$." }] } },
          { step: 3, m: "360° \\div 5 = 72°", say: "The angle of rotational symmetry." }] },
        gate: true, then: "A regular polygon with $n$ sides has $n$ lines of symmetry, and rotational symmetry of order $n$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe the symmetry of this rectangle. It is not a square.", art: FIG_RECTS,
        how: HOW_12_5, skill: "Symmetry",
        steps: [
          { step: 1, ask: "How many lines of symmetry does it have?", type: "num", answer: 2, near: [{ v: 4, fb: "Fold along a diagonal: the corners do not meet. Only the two dashed lines work." }], hint: "Count the dashed lines.",
            m: "2 \\text{ lines of symmetry}", say: "The diagonals are not lines of symmetry: folding along one does not match the halves." },
          { step: 2, ask: "Does a turn of 90° carry it onto itself?", type: "choice", answer: 0,
            options: [{ t: "No: it would stand on its short side" }, { t: "Yes", fb: "After a quarter turn the long sides are upright. It looks different." }],
            m: "90°\\text{: no} \\qquad 180°\\text{: yes}", say: "Only a half turn works." },
          { step: 3, ask: "What is the order of its rotational symmetry?", type: "num", answer: 2, hint: "It lands on itself at 180° and at 360°.",
            m: "\\text{order } 2 \\qquad 360° \\div 2 = 180°", say: "Twice in a full turn." }],
        why: "Lines, turns, order. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Sort these capital letters by their symmetry.",
        bins: ["Line only", "Rotational only", "Both", "Neither"],
        cards: [{ t: "A", bin: 0, fb: "One vertical line of symmetry, and no turn works." }, { t: "S", bin: 1, fb: "A half turn works, but no fold does." }, { t: "H", bin: 2, fb: "Two lines of symmetry, and a half turn works." },
                { t: "F", bin: 3, fb: "No fold and no turn carries it onto itself." }, { t: "Z", bin: 1, fb: "A half turn works, but no fold does." }, { t: "M", bin: 0, fb: "One vertical line of symmetry." }],
        skill: "Symmetry", hints: ["Can you fold it onto itself? Does it look the same upside down?"],
        why: "Fold for line symmetry. Turn for rotational symmetry." },
      { type: "num", prompt: "Find the angle of rotational symmetry of a regular octagon.", post: "°", answer: 45, skill: "Symmetry",
        near: [{ v: 135, fb: "That is its interior angle. The angle of rotational symmetry is $360 \\div 8$." }], hints: ["Its order is 8."], why: "$360 \\div 8 = 45$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Solids have symmetry too. A **plane of symmetry** cuts a solid into two mirror halves. An **axis of symmetry** is a line the solid can turn about onto itself. Look at a square pyramid.",
        scene: { type: "walk", how: [["Planes", "Look for planes that cut the solid into two mirror halves."], ["Axis", "Look for a line it can turn about onto itself."], ["Order", "Count how many times it lands on itself in one full turn."]], rows: [
          { step: 1, m: "4 \\text{ planes of symmetry}", say: "Each passes through the top vertex and a line of symmetry of the square base.", fig: FIG_PYR4 },
          { step: 2, m: "\\text{one axis, through the top vertex}", say: "Straight down to the centre of the base.",
            ask: { prompt: "A square lands on itself how many times in one full turn?", answer: 0,
                   options: [{ t: "4" }, { t: "2", fb: "Every quarter turn works: 90°, 180°, 270° and 360°." }] } },
          { step: 3, m: "\\text{order } 4", say: "A quarter turn about the axis carries the pyramid onto itself." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A figure has an angle of rotational symmetry of 40°. What is the order of its rotational symmetry?", answer: 9, skill: "Symmetry",
        near: [{ v: 320, fb: "Divide 360 by the angle." }], hints: ["$360 \\div 40$."], why: "$360 \\div 40 = 9$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Di says a parallelogram that is not a rectangle or a rhombus has two lines of symmetry: its diagonals. What is wrong?",
        options: [{ t: "It has no line of symmetry. Folding along a diagonal does not match the halves. It has rotational symmetry of order 2." },
                  { t: "It has four lines of symmetry.", fb: "Only a square has four." },
                  { t: "Nothing. The diagonals are lines of symmetry.", fb: "Fold a slanted parallelogram along a diagonal: the corners miss each other." }],
        answer: 0, skill: "Symmetry", hints: ["Picture folding it along a diagonal."], why: "A half turn carries it onto itself, but no reflection does." },
      { type: "num", kicker: "Use it", prompt: "A starfish has five identical arms spaced evenly round its centre. What is its angle of rotational symmetry?", post: "°", answer: 72, skill: "Symmetry",
        near: [{ v: 5, fb: "5 is the order. The angle is $360 \\div 5$." }], hints: ["Order 5."], why: "$360 \\div 5 = 72$." }
    ]
  });

  /* ======================================================================= 12-6 · Tessellations */
  var HOW_12_6 = [["Vertex", "Look at one vertex of the pattern. The angles round it must add to exactly 360°."],
                  ["Angle", "Find the interior angle of each regular polygon that meets there."],
                  ["Decide", "If whole copies fill 360° exactly, the polygons tessellate."]];
  var FIG_HEXT = plain([-3.6, 3.6], [-3.4, 3.4], [[0, 0]].concat([30, 90, 150, 210, 270, 330].map(function (d) { return GT.polar([0, 0], 1.732, d); })).map(function (c, i) { return { poly: reg(6, 1, c, 0), c: i ? "blue" : "orange", fill: true }; }),
        { u: 30, alt: "Seven regular hexagons fitted together with no gaps: one in the middle and six round it. Three hexagons meet at every corner." }),
      FIG_OCT = (function () {
        var d = 2 * 1.2 * Math.cos(22.5 * Math.PI / 180), items = [];
        [[0, 0], [d, 0], [0, d], [d, d]].forEach(function (c) { items.push({ poly: reg(8, 1.2, c, 22.5), c: "blue", fill: true }); });
        items.push({ poly: reg(4, 2 * 1.2 * Math.sin(22.5 * Math.PI / 180) / Math.SQRT2, [d / 2, d / 2], 0), c: "orange", fill: true });   // the gap: a square on its corner
        return plain([-1.5, d + 1.5], [-1.5, d + 1.5], items, { u: 34, alt: "Four regular octagons arranged in a square, with a small square filling the gap between them." });
      })();
  LESSONS.push({
    title: "Tessellations",
    blurb: "Book 12-6 · Patterns that cover the plane with no gaps and no overlaps.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the measure of each interior angle of a regular hexagon.", post: "°", answer: 120, skill: "Polygon Angle Sum",
        near: [{ v: 60, fb: "That is each exterior angle. The interior angle is its supplement." }, { v: 720, fb: "That is the sum. Divide by 6." }], hints: ["$(6 - 2)180 = 720$, then divide by 6."], why: "$720 \\div 6 = 120$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **tessellation** covers the plane with copies of a figure, with no gaps and no overlaps. A **regular tessellation** uses one regular polygon. A **semiregular tessellation** uses two or more, arranged the same way at every vertex. Round any vertex, the angles add to exactly 360°.",
        scene: { type: "method", how: HOW_12_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the regular hexagon tested.",
        scene: { type: "walk", how: HOW_12_6, rows: [
          { step: 1, m: "\\text{angles at a vertex add to } 360°", say: "Otherwise there is a gap or an overlap.", fig: FIG_HEXT },
          { step: 2, m: "120°", say: "Each interior angle of a regular hexagon." },
          { step: 3, m: "360° \\div 120° = 3", say: "A whole number: three hexagons fit round each vertex.",
            ask: { prompt: "What is $3 \\cdot 120°$?", answer: 0,
                   options: [{ t: "$360°$" }, { t: "$240°$", fb: "That is $2 \\cdot 120°$." }] } },
          { step: 3, m: "\\text{regular hexagons tessellate}", say: "As in a honeycomb." }] },
        gate: true, then: "Vertex, angle, decide." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Do regular pentagons tessellate?",
        how: HOW_12_6, skill: "Tessellations",
        steps: [
          { step: 1, ask: "What must the angles round each vertex add to, in degrees?", type: "num", answer: 360, hint: "A full turn.",
            m: "360°", say: "A full turn." },
          { step: 2, ask: "What is each interior angle of a regular pentagon, in degrees?", type: "num", answer: 108, near: [{ v: 72, fb: "That is the exterior angle. The interior angle is $180 - 72$." }], hint: "$(5 - 2)180 \\div 5$.",
            m: "\\frac{(5 - 2)180°}{5} = 108°", say: "$540 \\div 5$." },
          { step: 3, ask: "$360 \\div 108 \\approx 3.33$. So do regular pentagons tessellate?", type: "choice", answer: 0,
            options: [{ t: "No: three leave a gap, and four overlap" }, { t: "Yes", fb: "$3 \\cdot 108 = 324$ leaves a gap of 36°, and a fourth pentagon does not fit." }],
            m: "360° \\div 108° \\text{ is not a whole number}", say: "No whole number of pentagons fills 360°." }],
        why: "Vertex, angle, decide. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Which of these tessellate the plane on their own?",
        bins: ["Tessellates", "Does not"],
        cards: [{ t: "Equilateral triangles", bin: 0, fb: "$360 \\div 60 = 6$." }, { t: "Squares", bin: 0, fb: "$360 \\div 90 = 4$." }, { t: "Regular hexagons", bin: 0, fb: "$360 \\div 120 = 3$." },
                { t: "Regular pentagons", bin: 1, fb: "$360 \\div 108$ is not a whole number." }, { t: "Regular octagons", bin: 1, fb: "$360 \\div 135$ is not a whole number." }, { t: "Any one shape of triangle", bin: 0, fb: "Two copies make a parallelogram, and parallelograms tile the plane." }],
        skill: "Tessellations", hints: ["Divide 360 by the interior angle. Is it a whole number?"],
        why: "Only three regular polygons tessellate alone: the triangle, the square and the hexagon." },
      { type: "num", prompt: "How many equilateral triangles meet at each vertex of a tessellation of equilateral triangles?", answer: 6, skill: "Tessellations",
        near: [{ v: 3, fb: "Each angle is 60°, and they must fill 360°." }], hints: ["$360 \\div 60$."], why: "$360 \\div 60 = 6$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Regular octagons do not tessellate alone. Can octagons **and squares** make a semiregular tessellation?",
        scene: { type: "walk", how: [["Angles", "Find the interior angle of each polygon."], ["Add", "Add the angles that meet at one vertex."], ["Decide", "If they add to exactly 360°, the polygons tessellate together."]], rows: [
          { step: 1, m: "135° \\text{ and } 90°", say: "A regular octagon and a square.", fig: FIG_OCT },
          { step: 2, m: "135° + 135° + 90°", say: "Two octagons and one square meet at each vertex.",
            ask: { prompt: "What is $135 + 135 + 90$?", answer: 0,
                   options: [{ t: "360" }, { t: "270", fb: "That is the two octagons. Add the square's 90°." }] } },
          { step: 3, m: "360°", say: "Exactly a full turn, so they tessellate together." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "In a semiregular tessellation, two regular hexagons meet at each vertex, together with some equilateral triangles. How many triangles?", answer: 2, skill: "Tessellations",
        near: [{ v: 4, fb: "The hexagons use 240°. Only 120° is left for the triangles." }], hints: ["$2 \\cdot 120 = 240$, so $360 - 240 = 120$ is left.", "Each triangle takes 60°."], why: "$120 \\div 60 = 2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ed says regular octagons tessellate, because $3 \\cdot 135° = 405°$ is close to $360°$. What is wrong?",
        options: [{ t: "The angles must add to exactly 360°. Three octagons overlap, and two leave a gap." },
                  { t: "The interior angle of an octagon is 120°.", fb: "It is $1080 \\div 8 = 135°$." },
                  { t: "Nothing. Close is good enough.", fb: "An extra 45° means the third octagon overlaps the first." }],
        answer: 0, skill: "Tessellations", hints: ["What does 405° mean at a vertex?"], why: "$360 \\div 135$ is not a whole number." },
      { type: "choice", kicker: "Use it", prompt: "A honeycomb is a tessellation of regular hexagons. How many cells meet at each corner?",
        options: [{ t: "3" }, { t: "6", fb: "Six equilateral triangles meet at a point, but a hexagon's angle is 120°." }, { t: "4", fb: "Four squares meet at a point, but a hexagon's angle is 120°." }],
        answer: 0, skill: "Tessellations", hints: ["$360 \\div 120$."], why: "$360 \\div 120 = 3$." }
    ]
  });

  /* ========================================================================== 12-7 · Dilations */
  var HOW_12_7 = [["Factor", "Find the scale factor $k$ and the centre of dilation."],
                  ["Multiply", "About the origin: $(x, y) \\to (kx, ky)$."],
                  ["Describe", "A factor larger than 1 in size enlarges. A factor smaller than 1 in size reduces. A negative factor also turns the figure 180°."]];
  var T7 = [[1, 1], [3, 1], [1, 2]];
  var FIG_NEG = trFig(T7, T7.map(scale(-2)), "A coordinate grid. Triangle ABC has A at (1, 1), B at (3, 1) and C at (1, 2). Its image has A′ at (−2, −2), B′ at (−6, −2) and C′ at (−2, −4): twice as large, and on the opposite side of the origin.",
        { x: [-7, 4], y: [-5, 3], extra: [{ centre: [0, 0], say: "" }].concat(T7.map(function (p) { return { seg: [p, scale(-2)(p)], dash: true, c: "soft" }; })) }),
      FIG_CEN = grid([-1, 9], [-1, 7], [{ arrow: [[1, 1], [4, 3]], c: "orange" }, { arrow: [[4, 3], [7, 5]], c: "orange", dash: true }, { pt: [1, 1], name: "C", at: "sw" }, { pt: [4, 3], name: "P", at: "nw" }, { pt: [7, 5], name: "P'", at: "ne", c: "blue" }],
        { u: 28, alt: "A coordinate grid. C is at (1, 1) and P is at (4, 3). An arrow runs from C to P and on, the same distance again, to P′ at (7, 5)." });
  LESSONS.push({
    title: "Dilations",
    blurb: "Book 12-7 · A dilation enlarges or reduces a figure from a centre. It keeps the shape, not the size.",
    mins: 12, v: 4,
    steps: [
      { type: "pair", kicker: "Warm up", prompt: "Multiply both coordinates of $(2, -1)$ by 3. Type the result as $(x, y)$.", answer: [6, -3], skill: "Dilations",
        near: [{ v: [5, 2], fb: "Multiply by 3. Do not add it." }], hints: ["$3 \\cdot 2$ and $3 \\cdot (-1)$."], why: "$(6, -3)$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **dilation** changes the size of a figure but not its shape, so it is **not** an isometry: the image is similar to the original, not congruent. Its **centre** stays fixed, and its **scale factor** $k$ multiplies every distance from the centre.",
        scene: { type: "method", how: HOW_12_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\triangle ABC$ dilated about the origin with a scale factor of $-2$.",
        scene: { type: "walk", how: HOW_12_7, rows: [
          { step: 1, m: "k = -2", say: "The centre is the origin.", fig: FIG_NEG },
          { step: 2, m: "A(1, 1) \\to A'(-2, -2)", say: "Multiply both coordinates by $-2$.",
            ask: { prompt: "Where does $B(3, 1)$ go?", answer: 0,
                   options: [{ t: "$(-6, -2)$" }, { t: "$(6, 2)$", fb: "That is a scale factor of 2. The factor here is negative." }] } },
          { step: 2, m: "B(3, 1) \\to B'(-6, -2)", say: "The same rule." },
          { step: 2, m: "C(1, 2) \\to C'(-2, -4)", say: "And again." },
          { step: 3, m: "\\text{an enlargement, turned } 180°", say: "Twice as large, and on the far side of the centre." }] },
        gate: true, then: "A negative scale factor sends each point through the centre and out the other side." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Dilate $P(6, 9)$ and $Q(-3, 12)$ about the origin with a scale factor of $\\frac{1}{3}$.",
        how: HOW_12_7, skill: "Dilations",
        steps: [
          { step: 1, ask: "$k = \\frac{1}{3}$. Is this an enlargement or a reduction?", type: "choice", answer: 0,
            options: [{ t: "A reduction" }, { t: "An enlargement", fb: "A scale factor between 0 and 1 makes the figure smaller." }],
            m: "k = \\frac{1}{3}", say: "Smaller than 1: a reduction." },
          { step: 2, ask: "$P(6, 9) \\to P'(x, 3)$. What is $x$?", type: "num", answer: 2, near: [{ v: 18, fb: "Multiply by $\\frac{1}{3}$: divide by 3." }], hint: "$6 \\div 3$.",
            m: "P'(2, 3)", say: "One third of each coordinate." },
          { step: 2, ask: "$Q(-3, 12) \\to Q'(-1, y)$. What is $y$?", type: "num", answer: 4, hint: "$12 \\div 3$.",
            m: "Q'(-1, 4)", say: "One third of each coordinate." },
          { step: 3, ask: "Is the image congruent to the original?", type: "choice", answer: 0,
            options: [{ t: "No: it is similar, but smaller" }, { t: "Yes", fb: "Congruent figures are the same size. This one is one third the size." }],
            m: "\\text{similar, not congruent}", say: "A dilation is not an isometry, unless $k$ is 1 or $-1$." }],
        why: "Factor, multiply, describe. Now two on your own." },
      { type: "plot", kicker: "On your own", prompt: "Draw the image of $\\triangle ABC$ under a dilation about the origin with a scale factor of 2.",
        show: [{ poly: [[1, 1], [2, 1], [1, 3]], c: "soft", names: "ABC" }, { centre: [0, 0], say: "", at: "sw" }], target: [[2, 2], [4, 2], [2, 6]], x: [-1, 7], y: [-1, 7], u: 30, skill: "Dilations",
        hints: ["Double both coordinates of each corner. Start with $A(1, 1)$.", "$A'(2, 2)$, $B'(4, 2)$, $C'(2, 6)$."], why: "$(x, y) \\to (2x, 2y)$: $A'(2, 2)$, $B'(4, 2)$, $C'(2, 6)$." },
      { type: "pair", prompt: "Dilate $(4, -6)$ about the origin with a scale factor of $-\\frac{1}{2}$. Type the image as $(x, y)$.", answer: [-2, 3], skill: "Dilations",
        near: [{ v: [2, -3], fb: "The factor is negative: both signs change as well." }, { v: [-8, 12], fb: "That is a factor of $-2$. Halve the coordinates." }], hints: ["Halve each coordinate, and change its sign."], why: "$(-2, 3)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the centre is **not** the origin, work from the centre. Dilate $P(4, 3)$ about $C(1, 1)$ with a scale factor of 2.",
        scene: { type: "walk", how: [["Move", "Find the move from the centre to the point."], ["Scale", "Multiply that move by $k$."], ["Start", "Make the new move, starting from the centre."]], rows: [
          { step: 1, m: "⟨4 - 1, \\; 3 - 1⟩ = ⟨3, 2⟩", say: "From $C$ to $P$: 3 across and 2 up.", fig: FIG_CEN },
          { step: 2, m: "2⟨3, 2⟩ = ⟨6, 4⟩", say: "Twice as far, in the same direction.",
            ask: { prompt: "Start at $C(1, 1)$ and move ⟨6, 4⟩. Where do you land?", answer: 0,
                   options: [{ t: "$(7, 5)$" }, { t: "$(8, 6)$", fb: "That doubles $P$'s coordinates, which is a dilation about the origin." }] } },
          { step: 3, m: "P' = (1 + 6, 1 + 4) = (7, 5)", say: "$P'$ is twice as far from $C$ as $P$ is." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A dilation sends a segment 6 units long to a segment 15 units long. Find the scale factor.", answer: 2.5, skill: "Dilations",
        near: [{ v: 0.4, fb: "Image over original: $15 \\div 6$." }, { v: 9, fb: "A scale factor is a ratio, not a difference." }], hints: ["$15 \\div 6$."], why: "$15 \\div 6 = 2.5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee says every dilation is an isometry, because the image has the same shape as the original. What is wrong?",
        options: [{ t: "An isometry keeps the size too. A dilation changes it, unless the scale factor is 1 or $-1$." },
                  { t: "A dilation changes the shape.", fb: "It keeps the shape: every angle stays the same." },
                  { t: "Nothing. Same shape means isometry.", fb: "Same shape is similarity. An isometry needs the same size as well." }],
        answer: 0, skill: "Dilations", hints: ["What does an isometry keep?"], why: "Isometries give congruent images. Dilations give similar ones." },
      { type: "num", kicker: "Use it", prompt: "A print 4 in. by 6 in. is enlarged with a scale factor of 2.5. How long is the longer side of the enlargement?", post: "in.", answer: 15, skill: "Dilations",
        near: [{ v: 10, fb: "That is the shorter side, $4 \\cdot 2.5$." }, { v: 8.5, fb: "Multiply by the scale factor. Do not add it." }], hints: ["$6 \\cdot 2.5$."], why: "$6 \\cdot 2.5 = 15$." }
    ]
  });
  /* ================================================================ Skills */
  function P12(R) { return [R.nz(-5, 5), R.nz(-5, 5)]; }
  var MOVES = [
    { say: "reflect across the $x$-axis", f: RULE.rx, how: "$(x, y) \\to (x, -y)$" }, { say: "reflect across the $y$-axis", f: RULE.ry, how: "$(x, y) \\to (-x, y)$" },
    { say: "rotate 180° about the origin", f: RULE.r180, how: "$(x, y) \\to (-x, -y)$" }, { say: "rotate 90° counterclockwise about the origin", f: RULE.r90, how: "$(x, y) \\to (-y, x)$" }];
  var SKILLS = [
    { id: "hg12-reflect", title: "Reflections", lesson: 2,
      gen: function (R) {
        var p = P12(R), M = R.pick([["the $x$-axis", RULE.rx, "$(x, y) \\to (x, -y)$"], ["the $y$-axis", RULE.ry, "$(x, y) \\to (-x, y)$"], ["the line $y = x$", RULE.ryx, "$(x, y) \\to (y, x)$"]]), q = M[1](p);
        if (p[0] === p[1]) p[0] = -p[0], q = M[1](p);
        if (R.chance(0.3)) { var W = [["the $x$-axis", RULE.rx], ["the $y$-axis", RULE.ry], ["the line $y = x$", RULE.ryx]].filter(function (w) { return w[0] !== M[0] && pt(w[1](p)) !== pt(q); });
          if (W.length) return mc(R, { prompt: "A reflection sends $" + pt(p) + "$ to $" + pt(q) + "$. What is the line of reflection?", right: M[0], keep: true,
            wrong: W.map(function (w) { return { t: w[0], fb: "That line would send it to $" + pt(w[1](p)) + "$." }; }), hints: ["Which coordinate changed, and how?"], why: M[2] + "." }); }
        return { type: "pair", prompt: "Reflect $" + pt(p) + "$ across " + M[0] + ". Type the image as $(x, y)$.", answer: q,
          near: [{ v: RULE.r180(p), fb: "That changes both signs: a half turn. A reflection changes less." }], hints: [M[2] + "."], why: "$" + pt(q) + "$." };
      } },
    { id: "hg12-translate", title: "Translations", lesson: 3,
      gen: function (R) {
        var p = P12(R), a = R.nz(-6, 6), b = R.nz(-6, 6), q = [p[0] + a, p[1] + b], k = R.int(0, 2);
        if (k === 0) return { type: "pair", prompt: "Find the image of $" + pt(p) + "$ under a translation along " + vec(a, b) + ". Type it as $(x, y)$.", answer: q,
          near: [{ v: [p[0] - a, p[1] - b], fb: "Add the vector. Do not subtract it." }], hints: ["$(x, y) \\to (x " + plusMinus(a) + ", y " + plusMinus(b) + ")$."], why: "$" + pt(q) + "$." };
        if (k === 1) return { type: "pair", prompt: "A translation sends $" + pt(p) + "$ to $" + pt(q) + "$. Type the components of its vector as $(a, b)$.", answer: [a, b],
          near: [{ v: [-a, -b], fb: "Image minus original, in that order." }], hints: ["Subtract the original's coordinates from the image's."], why: vec(a, b) + "." };
        return { type: "pair", prompt: "Under a translation along " + vec(a, b) + ", the image of a point is $" + pt(q) + "$. Find the original point. Type it as $(x, y)$.", answer: p,
          near: [{ v: [q[0] + a, q[1] + b], fb: "To go back, use the opposite vector: subtract." }], hints: ["Undo the translation: subtract the vector."], why: "$" + pt(p) + "$." };
      } },
    { id: "hg12-rotate", title: "Rotations", lesson: 4,
      gen: function (R) {
        var p = P12(R), M = R.pick([[90, RULE.r90, "$(x, y) \\to (-y, x)$"], [180, RULE.r180, "$(x, y) \\to (-x, -y)$"], [270, RULE.r270, "$(x, y) \\to (y, -x)$"]]), q = M[1](p);
        if (Math.abs(p[0]) === Math.abs(p[1])) p[0] = p[0] > 0 ? p[0] + 1 : p[0] - 1, q = M[1](p);
        if (R.chance(0.3)) return mc(R, { prompt: "A counterclockwise rotation about the origin sends $" + pt(p) + "$ to $" + pt(q) + "$. What is the angle of rotation?", right: M[0] + "°", keep: true,
          wrong: [90, 180, 270].filter(function (d) { return d !== M[0]; }).map(function (d) { return { t: d + "°", fb: "That turn would send it to $" + pt({ 90: RULE.r90, 180: RULE.r180, 270: RULE.r270 }[d](p)) + "$." }; }),
          hints: ["Try each rule on the point."], why: M[2] + "." });
        return { type: "pair", prompt: "Rotate $" + pt(p) + "$ by " + M[0] + "° counterclockwise about the origin. Type the image as $(x, y)$.", answer: q,
          near: [{ v: (M[0] === 90 ? RULE.r270 : M[0] === 270 ? RULE.r90 : RULE.rx)(p), fb: M[0] === 180 ? "A half turn changes both signs." : "That turns it the other way round." }], hints: [M[2] + "."], why: "$" + pt(q) + "$." };
      } },
    { id: "hg12-compose", title: "Compositions of transformations", lesson: 5,
      gen: function (R) {
        var p = P12(R), a = R.nz(-5, 5), b = R.nz(-5, 5), M = R.pick(MOVES), first = R.chance(0.5), T = shift(a, b);
        var mid = first ? M.f(p) : T(p), end = first ? T(mid) : M.f(mid), other = first ? M.f(T(p)) : T(M.f(p));
        var s1 = first ? M.say.charAt(0).toUpperCase() + M.say.slice(1) : "Translate", s2 = first ? "then translate along " + vec(a, b) : "then " + M.say;
        return { type: "pair", prompt: (first ? s1 + " the point $" + pt(p) + "$, and " + s2 : "Translate the point $" + pt(p) + "$ along " + vec(a, b) + ", and " + s2) + ". Type the final image as $(x, y)$.", answer: end,
          near: pt(other) === pt(end) ? [] : [{ v: other, fb: "That does the two steps in the other order. Do them in the order given." }],
          hints: ["First step: $" + pt(p) + " \\to " + pt(mid) + "$.", "Apply the second step to that image."], why: "$" + pt(p) + " \\to " + pt(mid) + " \\to " + pt(end) + "$." };
      } },
    { id: "hg12-symmetry", title: "Symmetry", lesson: 6,
      gen: function (R) {
        var k = R.int(0, 3), n = R.pick([3, 4, 5, 6, 8, 9, 10, 12]);
        if (k === 0) return { type: "num", prompt: "How many lines of symmetry does a regular polygon with " + n + " sides have?", answer: n,
          near: near(n, [{ v: n / 2, fb: "Count the lines through vertices **and** the lines through the middles of sides." }]), hints: ["A regular polygon has as many lines of symmetry as sides."], why: "A regular polygon with " + n + " sides has " + n + " lines of symmetry." };
        if (k === 1) return { type: "num", prompt: "Find the angle of rotational symmetry of a regular polygon with " + n + " sides.", post: "°", answer: 360 / n,
          near: near(360 / n, [{ v: (n - 2) * 180 / n, fb: "That is its interior angle. Divide 360 by the number of sides." }]), hints: ["Its order is " + n + ".", "$360 \\div " + n + "$."], why: "$360 \\div " + n + " = " + 360 / n + "$." };
        if (k === 2) { var o = R.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
          return { type: "num", prompt: "A figure has an angle of rotational symmetry of " + 360 / o + "°. What is the order of its rotational symmetry?", answer: o,
            near: near(o, [{ v: 360 - 360 / o, fb: "Divide 360 by the angle." }]), hints: ["$360 \\div " + 360 / o + "$."], why: "$360 \\div " + 360 / o + " = " + o + "$." }; }
        var Lt = R.pick([["A", "Line symmetry only"], ["M", "Line symmetry only"], ["T", "Line symmetry only"], ["S", "Rotational symmetry only"], ["Z", "Rotational symmetry only"], ["N", "Rotational symmetry only"], ["H", "Both"], ["O", "Both"], ["X", "Both"], ["F", "Neither"], ["G", "Neither"], ["R", "Neither"]]);
        return mc(R, { prompt: "What symmetry does the capital letter **" + Lt[0] + "** have?", right: Lt[1], keep: true,
          wrong: ["Line symmetry only", "Rotational symmetry only", "Both", "Neither"].filter(function (v) { return v !== Lt[1]; }).map(function (v) { return { t: v, fb: "Can it be folded onto itself? Does it look the same upside down?" }; }),
          hints: ["Fold it for line symmetry. Give it a half turn for rotational symmetry."], why: "The letter " + Lt[0] + " has: " + Lt[1].toLowerCase() + "." });
      } },
    { id: "hg12-tessellate", title: "Tessellations", lesson: 7,
      gen: function (R) {
        var k = R.int(0, 2);
        if (k === 0) { var n = R.pick([3, 4, 5, 6, 8, 9, 10, 12]), ang = (n - 2) * 180 / n, yes = 360 % ang === 0;
          return mc(R, { prompt: "A regular polygon with " + n + " sides has interior angles of " + ang + "°. Does it tessellate the plane on its own?", right: yes ? "Yes" : "No", keep: true,
            wrong: [{ t: yes ? "No" : "Yes", fb: "Divide 360 by " + ang + ". Is the answer a whole number?" }], hints: ["The angles round a vertex must fill exactly 360°."], why: yes ? "$360 \\div " + ang + " = " + 360 / ang + "$: a whole number." : "$360 \\div " + ang + "$ is not a whole number." }); }
        if (k === 1) { var Q = R.pick([["equilateral triangles", 60], ["squares", 90], ["regular hexagons", 120]]);
          return { type: "num", prompt: "In a tessellation of " + Q[0] + ", how many of them meet at each vertex?", answer: 360 / Q[1],
            near: near(360 / Q[1], [{ v: Q[1] === 60 ? 3 : Q[1] === 120 ? 6 : 2, fb: "Each interior angle is " + Q[1] + "°, and they must fill 360°." }]), hints: ["$360 \\div " + Q[1] + "$."], why: "$360 \\div " + Q[1] + " = " + 360 / Q[1] + "$." }; }
        var S = R.pick([["two regular octagons (135° each)", 270], ["two regular hexagons (120° each)", 240], ["one regular hexagon (120°) and two squares (90° each)", 300], ["two regular dodecagons (150° each)", 300], ["three equilateral triangles (60° each)", 180], ["one square (90°) and one regular hexagon (120°)", 210]]);
        return { type: "num", prompt: "At a vertex of a tessellation, " + S[0] + " meet. How many degrees are left for the other polygons there?", post: "°", answer: 360 - S[1],
          near: near(360 - S[1], [{ v: Math.abs(180 - S[1]), fb: "The angles round a point add to 360°, not 180°." }]), hints: ["The angles round a vertex add to 360°."], why: "$360 - " + S[1] + " = " + (360 - S[1]) + "$." };
      } },
    { id: "hg12-dilate", title: "Dilations", lesson: 8,
      gen: function (R) {
        var k = R.int(0, 3), p = P12(R);
        if (k === 0) { var half = R.chance(0.35), f = half ? R.pick([0.5, -0.5]) : R.pick([2, 3, 4, -2, -3]), src = half ? [2 * p[0], 2 * p[1]] : p, img = scale(f)(src);
          return { type: "pair", prompt: "Dilate $" + pt(src) + "$ about the origin with a scale factor of $" + (half ? (f < 0 ? "-" : "") + "\\frac{1}{2}" : f) + "$. Type the image as $(x, y)$.", answer: img,
            near: [{ v: scale(-f)(src), fb: f < 0 ? "The factor is negative: both signs change." : "The factor is positive: the signs stay as they are." }], hints: ["$(x, y) \\to (kx, ky)$."], why: "$" + pt(img) + "$." }; }
        if (k === 1) { var len = R.int(2, 9), g = R.pick([2, 3, 4, 1.5, 2.5]);
          return { type: "num", prompt: "A dilation sends a segment " + 2 * len + " units long to a segment " + 2 * len * g + " units long. Find the scale factor.", answer: g,
            near: near(g, [{ v: 1 / g, tol: 0.001, fb: "Image over original: the image is longer, so $k$ is more than 1." }]), hints: ["$" + 2 * len * g + " \\div " + 2 * len + "$."], why: "$" + 2 * len * g + " \\div " + 2 * len + " = " + g + "$." }; }
        if (k === 2) { var Q = R.pick([["3", "An enlargement"], ["\\frac{1}{4}", "A reduction"], ["2.5", "An enlargement"], ["\\frac{2}{3}", "A reduction"], ["1", "Neither: the figure stays the same size"], ["\\frac{5}{2}", "An enlargement"], ["0.8", "A reduction"]]);
          return mc(R, { prompt: "A dilation has a scale factor of $" + Q[0] + "$. What does it do?", right: Q[1], keep: true,
            wrong: ["An enlargement", "A reduction", "Neither: the figure stays the same size"].filter(function (v) { return v !== Q[1]; }).map(function (v) { return { t: v, fb: "Compare the scale factor with 1." }; }),
            hints: ["More than 1: larger. Less than 1: smaller."], why: "The scale factor is " + (Q[1][0] === "N" ? "exactly 1." : Q[1] === "An enlargement" ? "more than 1." : "less than 1.") }); }
        var c = [R.int(-2, 2), R.int(-2, 2)], d = [R.nz(-3, 3), R.nz(-3, 3)], pp = [c[0] + d[0], c[1] + d[1]], f2 = R.pick([2, 3]), q = [c[0] + f2 * d[0], c[1] + f2 * d[1]];
        return { type: "pair", prompt: "Dilate $P" + pt(pp) + "$ about the centre $C" + pt(c) + "$ with a scale factor of " + f2 + ". Type the image as $(x, y)$.", answer: q,
          near: pt(scale(f2)(pp)) === pt(q) ? [] : [{ v: scale(f2)(pp), fb: "That is a dilation about the origin. Work from the centre $C$." }],
          hints: ["From $C$ to $P$ is " + vec(d[0], d[1]) + ".", "Multiply that by " + f2 + ", then start again from $C$."], why: "$C$ plus " + vec(f2 * d[0], f2 * d[1]) + " is $" + pt(q) + "$." };
      } }
  ];
  L.unit("geo", 12, {
    title: "Extending Transformational Geometry",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Reflections, translations and rotations.",
        skills: ["hg12-reflect", "hg12-translate", "hg12-rotate"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Compositions of transformations, and symmetry.",
        skills: ["hg12-compose", "hg12-symmetry"], per: 3 },
      { title: "Quiz 3", after: 8, blurb: "Tessellations and dilations.",
        skills: ["hg12-tessellate", "hg12-dilate"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:12", {
    2: { name: "Reflections", frame: "A reflection flips a figure across a [[line]]. It is an [[isometry]]: the image is congruent to the original. Across the x-axis, (x, y) goes to [[(x, −y)]].",
         chips: ["(−x, y)", "dilation"] },
    3: { name: "Translations", frame: "A translation slides every point along the same [[vector]]. Along ⟨a, b⟩, (x, y) goes to [[(x + a, y + b)]]. The image faces the [[same]] way.",
         chips: ["(ax, by)", "opposite"] },
    4: { name: "Rotations", frame: "A rotation turns a figure about its [[centre]]. Unless told otherwise, it is [[counterclockwise]]. A turn of 180° about the origin sends (x, y) to [[(−x, −y)]].",
         chips: ["clockwise", "(y, x)"] },
    5: { name: "Compositions", frame: "A composition is one transformation followed by [[another]], applied to the image. A translation then a reflection is a [[glide]] reflection. Two reflections across parallel lines make a [[translation]].",
         chips: ["rotation", "dilation"] },
    6: { name: "Symmetry", frame: "A figure with [[line]] symmetry folds onto itself. A figure with [[rotational]] symmetry turns onto itself. The angle of rotational symmetry is 360° divided by the [[order]].",
         chips: ["scale", "area"] },
    7: { name: "Tessellations", frame: "A tessellation has no [[gaps]] and no overlaps. The angles round each vertex add to [[360°]]. Only three regular polygons tessellate alone: the triangle, the square and the [[hexagon]].",
         chips: ["pentagon", "180°"] },
    8: { name: "Dilations", frame: "A dilation multiplies every distance from its [[centre]] by the scale factor. The image is [[similar]] to the original. A dilation is not an [[isometry]].",
         chips: ["congruent", "vector"] }
  });
})();
