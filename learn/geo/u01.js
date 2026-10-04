/* ==========================================================================
   Geometry — Unit 1: Foundations for Geometry. See lab/core.js for the
   format and lab/geotools.js for the drawing kit.

   The course follows its textbook, Holt Geometry, a chapter to a unit and a
   section to a lesson: this is Chapter 1, sections 1-1 to 1-7, after a
   readiness check. That book is not an open one, so only the order of
   topics is the book's. Every sentence, example, figure and question here
   is OEdu's own.

   Each lesson is taught in the same order as Algebra I and II: warm up, the
   idea (a method with named steps), a worked example to watch, one done
   together, on your own, a harder case, try it, find the error, use it,
   and the concept built at the end.

   Points, lines and planes (1-1), measuring and constructing segments and
   angles (1-2, 1-3), pairs of angles (1-4), formulas for perimeter, area and
   circumference (1-5), midpoint and distance on the coordinate plane (1-6),
   and a first look at transformations (1-7).

   Lessons carry v: 4. Unit 1 was the transformations unit (v 1–2) and then
   "Tools of Geometry" (v 3): a record from those must not mark these done.
   Skills are hg1-…, clear of the old geo1-… and geo-… ids.

   Eight lessons, eight skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
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
    blurb: "Before Chapter 1 · Reading a ruler, a little algebra, and the coordinate plane.",
    mins: 6, v: 4,
    steps: [
      { type: "num", kicker: "Check 1 · Measuring", prompt: "A pencil lies along a ruler from the 2 cm mark to the 9 cm mark. How long is it?",
        post: "cm", answer: 7, skill: "Measure a length",
        near: [{ v: 9, fb: "It does not start at 0. Subtract where it starts from where it ends." }, { v: 11, fb: "Subtract the two readings. Do not add them." }],
        hints: ["$9 - 2$."], why: "$9 - 2 = 7$." },
      { type: "num", prompt: "A full turn is 360°. How many degrees is a quarter turn?", post: "°", answer: 90, skill: "Degrees",
        near: [{ v: 180, fb: "That is a half turn." }], hints: ["$360 \\div 4$."], why: "$360 \\div 4 = 90$: a right angle." },
      { type: "num", kicker: "Check 2 · Algebra", prompt: "Solve $3x + 5 = 20$.", pre: "$x =$", answer: 5, skill: "Solve an equation",
        near: [{ v: 25 / 3, tol: 1e-6, fb: "Subtract 5 from both sides first: $3x = 15$." }], hints: ["$3x = 15$."], why: "$3x = 15$, so $x = 5$." },
      { type: "choice", prompt: "Simplify $2x + 3 + 5x - 1$.",
        options: [{ t: "$7x + 2$" }, { t: "$7x + 4$", fb: "$3 - 1 = 2$." }, { t: "$9x$", fb: "Only like terms combine." }],
        answer: 0, skill: "Combine like terms", hints: ["$2x + 5x$, and $3 - 1$."], why: "$7x + 2$." },
      { type: "plane", kicker: "Check 3 · The coordinate plane", prompt: "Click the point $(-3, 2)$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [-3, 2] }, skill: "Plot a point",
        clickFb: function (c) { return c && c[0] === 2 && c[1] === -3 ? "That is $(2, -3)$. The first number is $x$: across." : "The first number is $x$ (across), the second is $y$ (up or down)."; },
        hints: ["3 to the left, then 2 up."], why: "$x = -3$ is 3 to the left. $y = 2$ is 2 up." },
      { type: "num", prompt: "Simplify $\\sqrt{3^2 + 4^2}$.", answer: 5, skill: "Square roots",
        near: [{ v: 7, fb: "Square and add first: $9 + 16 = 25$. Then take the root." }], hints: ["$\\sqrt{9 + 16}$."], why: "$\\sqrt{25} = 5$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 1-1**. If **check 2** slipped, Algebra I Unit 1 has the practice. If **check 3** slipped, lesson 1-6 begins with the plane and takes it slowly.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ================================= 1-1 · Understanding points, lines and planes */
  var HOW_1_1 = [["Kind", "Decide what it is: a line, a segment or a ray."],
                 ["Points", "Pick the points that name it. A segment or a ray starts with an endpoint."],
                 ["Symbol", "Write the letters under the right symbol."]];
  var FIG_KINDS = plain([0, 8], [0, 4.6], [
    { dline: [[0.8, 3.8], [7.2, 3.8]] }, { pt: [2.4, 3.8], name: "A", at: "n" }, { pt: [5.6, 3.8], name: "B", at: "n" },
    { seg: [[2.4, 2.3], [5.6, 2.3]] }, { pt: [2.4, 2.3], name: "C", at: "n" }, { pt: [5.6, 2.3], name: "D", at: "n" },
    { dline: [[2.4, 0.8], [7.2, 0.8]], ray: true }, { pt: [2.4, 0.8], name: "E", at: "n" }, { pt: [5.6, 0.8], name: "F", at: "n" }],
    { u: 40, alt: "Three figures: a line through A and B with an arrowhead at each end, a segment from C to D, and a ray that starts at E and passes through F." });
  var FIG_PQR = ptsOnLine(["P", "Q", "R"], { n: "ℓ", extra: [{ pt: [4.9, 0.9], name: "S", at: "e" }], alt: "Points P, Q and R on line ℓ, and a point S that is not on the line." });
  var FIG_KLM = ptsOnLine(["K", "L", "M"], { extra: [{ pt: [3.3, 0.7], name: "N", at: "s" }], alt: "Points K, L and M on one line, and a point N below the line." });
  function rayPic(a, b, alt) {
    return plain([0, 7.4], [0.2, 3.8], [{ dline: [[1, 1.1], [6.6, 3]], ray: true }, { pt: [1, 1.1], name: a, at: "nw" }, { pt: [4, 2.12], name: b, at: "nw" }], { u: 40, alt: alt });
  }
  LESSONS.push({
    title: "Points, lines and planes",
    blurb: "Book 1-1 · The undefined terms, segments and rays, naming figures, and where lines and planes meet.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "An arrowhead means “this goes on for ever”. Which figure has exactly **one** endpoint?", art: FIG_KINDS,
        options: [{ t: "The one through $E$ and $F$" }, { t: "The one through $A$ and $B$", fb: "It has an arrowhead at each end: no endpoints at all." }, { t: "The one from $C$ to $D$", fb: "It stops at both ends: two endpoints." }],
        answer: 0, skill: "Lines, segments and rays", hints: ["Count the ends that stop at a dot with no arrowhead beyond it."], why: "It starts at $E$ and never stops: a ray." },
      { type: "learn", kicker: "The idea",
        prompt: "Geometry starts from three things that are never defined: a **point** (a location), a **line** (straight, endless both ways) and a **plane** (a flat surface, endless). A **segment** is the part of a line between two endpoints. A **ray** starts at an endpoint and never stops.",
        scene: { type: "method", how: HOW_1_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the figures in this drawing named.",
        scene: { type: "walk", how: HOW_1_1, rows: [
          { step: 1, m: "\\text{a line}", say: "The straight path through $P$, $Q$ and $R$ has an arrowhead at each end.", fig: FIG_PQR },
          { step: 2, m: "P \\text{ and } Q", say: "Any two points on a line name it." },
          { step: 3, m: "\\overleftrightarrow{PQ}", say: "A double arrow over the letters. It is also line $ℓ$." ,
            ask: { prompt: "Which is another name for the same line?", answer: 0,
                   options: [{ t: "$\\overleftrightarrow{RP}$" }, { t: "$\\overleftrightarrow{PS}$", fb: "$S$ is not on the line." }] } },
          { step: 3, m: "\\overrightarrow{QR}", say: "From $Q$ through $R$ and on for ever: a ray. Its endpoint is written first." },
          { step: 3, m: "\\overline{PQ}", say: "Only the part from $P$ to $Q$: a segment, with a plain bar." }] },
        gate: true, then: "The symbol over the letters is a small picture of the figure." },
      { type: "guided", kicker: "Together",
        prompt: "Now you name this figure.", art: rayPic("B", "A", "A ray that starts at B and passes through A."),
        how: HOW_1_1, skill: "Name a figure",
        steps: [
          { step: 1, ask: "It starts at one point and goes on for ever one way. What is it?", type: "choice", answer: 0,
            options: [{ t: "A ray" }, { t: "A line", fb: "A line has no endpoint: it goes on both ways." }, { t: "A segment", fb: "A segment stops at both ends." }],
            m: "\\text{a ray}", say: "One endpoint, one arrowhead." },
          { step: 2, ask: "Which point must be written first?", type: "choice", answer: 0,
            options: [{ t: "$B$, the endpoint" }, { t: "$A$", fb: "$A$ is just a point the ray passes through." }],
            m: "B \\text{ first}", say: "A ray is named from its endpoint." },
          { step: 3, ask: "Which is its name?", type: "choice", answer: 0,
            options: [{ t: "$\\overrightarrow{BA}$" }, { t: "$\\overrightarrow{AB}$", fb: "That ray would start at $A$." }, { t: "$\\overleftrightarrow{BA}$", fb: "Two arrowheads mean a line." }],
            m: "\\overrightarrow{BA}", say: "Endpoint first, one arrowhead." }],
        why: "Kind, points, symbol. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Points on one line are **collinear**. Sort each group.", art: FIG_KLM,
        bins: ["Collinear", "Not collinear"],
        cards: [{ t: "$K$, $L$ and $M$", bin: 0, fb: "All three are on the line." }, { t: "$K$, $L$ and $N$", bin: 1, fb: "$N$ is off the line through $K$ and $L$." },
                { t: "$L$ and $N$", bin: 0, fb: "Any two points are collinear: one line always passes through them." }, { t: "$K$, $M$ and $N$", bin: 1, fb: "$N$ is off the line through $K$ and $M$." }],
        skill: "Collinear points", hints: ["Could one straight line pass through all of them?"],
        why: "Two points always share a line. A third may or may not be on it." },
      { type: "choice", prompt: "A **postulate** is a statement accepted without proof. One says: through any two points there is exactly one line. How many planes contain three points that are **not** collinear?",
        options: [{ t: "Exactly one" }, { t: "None", fb: "Any three points can be covered by a flat surface." }, { t: "As many as you like", fb: "That is true of three points that **are** collinear: a plane can turn about their line." }],
        answer: 0, skill: "Postulates", hints: ["Think of a sheet of card resting on three fingertips."], why: "Three noncollinear points fix one plane." },
      { type: "learn", kicker: "A harder case",
        prompt: "Where figures meet is their **intersection**: everything they share.",
        scene: { type: "walk", how: [["Figures", "Name the two figures that meet."], ["Shared", "Find all the points they share."], ["Rule", "Two lines meet in a point. Two planes meet in a line."]], rows: [
          { step: 1, m: "\\text{line } ℓ \\text{ and line } m", say: "Two lines that cross.", fig: crossFig() },
          { step: 2, m: "T", say: "They share exactly one point." },
          { step: 2, m: "\\overleftrightarrow{AB}", say: "Two planes that cross share a whole line of points.", fig: twoPlanesFig() },
          { step: 3, m: "\\text{lines} \\to \\text{a point} \\qquad \\text{planes} \\to \\text{a line}", say: "Two postulates worth remembering." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A line passes through a plane without lying in it. What do they share?", art: pierceFig(),
        options: [{ t: "One point" }, { t: "A line", fb: "The line is not in the plane, so it only touches it once." }, { t: "Nothing", fb: "It passes through, so it meets the plane somewhere." }],
        answer: 0, skill: "Intersections", hints: ["Where does the line go from above the plane to below it?"], why: "A line that is not in a plane crosses it at exactly one point." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee names this figure $\\overrightarrow{YX}$. What is wrong?", art: rayPic("X", "Y", "A ray that starts at X and passes through Y."),
        options: [{ t: "The endpoint is written first: it is $\\overrightarrow{XY}$." },
                  { t: "It should have two arrowheads: $\\overleftrightarrow{XY}$.", fb: "It stops at $X$, so it is a ray, not a line." },
                  { t: "Nothing. It is right.", fb: "$\\overrightarrow{YX}$ would start at $Y$ and head back through $X$." }],
        answer: 0, skill: "Name a figure", hints: ["Where does the ray start?"], why: "A ray's name starts with its endpoint." },
      { type: "choice", kicker: "Use it", prompt: "A camera tripod stands firm on rough ground, but a four-legged table can wobble. Which fact explains it?",
        options: [{ t: "Three points not on one line lie in exactly one plane" }, { t: "Two points lie on exactly one line", fb: "True, but it is about lines, not about a flat surface." }, { t: "A plane has no thickness", fb: "True, but it does not explain the wobble." }],
        answer: 0, skill: "Postulates", hints: ["The tips of the legs are points. The ground is a surface."], why: "Three feet always fit one plane. A fourth may be off it." }
    ]
  });

  /* ================================ 1-2 · Measuring and constructing segments */
  var HOW_1_2 = [["Draw", "Sketch the segment and mark the lengths you know."],
                 ["Equation", "Write how the lengths are related: parts add up to the whole, or two halves are equal."],
                 ["Solve", "Solve, then answer what was asked."]];
  LESSONS.push({
    title: "Measuring and constructing segments",
    blurb: "Book 1-2 · Length, congruent segments, the Segment Addition Postulate, midpoints, and copying a segment.",
    mins: 12, v: 4,
    steps: [
      { type: "sketch", kicker: "Warm up", prompt: "The length of a segment is the distance between its endpoints. Drag $B$ until $AB = 4.5$ cm.",
        ruler: { unit: "cm", div: 10, len: 6 },
        pts: { B: { at: [2, 0], drag: true, snap: 0.1, on: { seg: [[0.6, 0], [5.9, 0]] }, say: "Point B" } },
        draw: function (s) { return [{ rseg: [0, s.B[0]], names: ["A", "B"] }]; },
        readout: function (s) { return "$AB = " + num(Math.round(s.B[0] * 10) / 10) + "$ cm"; },
        goal: function (s) { return Math.abs(s.B[0] - 4.5) < 1e-6; },
        answer: { B: [4.5, 0] }, skill: "Measure a segment",
        hints: ["Each small mark is one tenth of a centimetre.", "4.5 is half-way between the 4 and the 5."], why: "$A$ is at 0 and $B$ at 4.5, so $AB = 4.5$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **length** of $\\overline{AB}$ is written $AB$. If $B$ is **between** $A$ and $C$, the parts add up to the whole: $AB + BC = AC$, the **Segment Addition Postulate**. Segments of equal length are **congruent**. A **midpoint** cuts a segment into two congruent halves.",
        scene: { type: "method", how: HOW_1_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "$B$ is between $A$ and $C$. $AB = 3x - 1$, $BC = 2x + 4$ and $AC = 23$. Watch $AB$ found.",
        scene: { type: "walk", how: HOW_1_2, rows: [
          { step: 1, m: "AB = 3x - 1 \\quad BC = 2x + 4", say: "Mark what you know on a sketch.",
            fig: segRow([["A", 0], ["B", 3.2], ["C", 6.6]], { over: [[0, 1, "3x - 1"], [1, 2, "2x + 4"]], under: [[0, 2, "23"]] }) },
          { step: 2, m: "(3x - 1) + (2x + 4) = 23", say: "The two parts add up to the whole.",
            ask: { prompt: "What do the two parts add up to?", answer: 0,
                   options: [{ t: "The whole segment, $AC$" }, { t: "Each other", fb: "The parts are equal only if $B$ is the midpoint." }] } },
          { step: 3, m: "5x + 3 = 23", say: "Combine like terms." },
          { step: 3, m: "x = 4", say: "$5x = 20$." },
          { step: 3, m: "3(4) - 1 = 11", say: "The question asked for $AB$, not for $x$: $AB = 11$." }] },
        gate: true, then: "Check: $BC = 2(4) + 4 = 12$, and $11 + 12 = 23$." },
      { type: "guided", kicker: "Together",
        prompt: "$M$ is the midpoint of $\\overline{PQ}$. $PM = 4x + 3$ and $MQ = 6x - 5$. Now you find $PQ$.",
        art: segRow([["P", 0], ["M", 3.3], ["Q", 6.6]], { over: [[0, 1, "4x + 3"], [1, 2, "6x - 5"]], ticks: [[0, 1, 1], [1, 2, 1]] }),
        how: HOW_1_2, skill: "Midpoints",
        steps: [
          { step: 1, ask: "$M$ is the midpoint. What does that say about $PM$ and $MQ$?", type: "choice", answer: 0,
            options: [{ t: "They are equal" }, { t: "They add up to 180", fb: "That is about angles. A midpoint makes two equal lengths." }],
            m: "PM = MQ", say: "The tick marks show the two halves are congruent." },
          { step: 2, ask: "Which equation follows?", type: "choice", answer: 0,
            options: [{ t: "$4x + 3 = 6x - 5$" }, { t: "$(4x + 3) + (6x - 5) = 0$", fb: "The halves are equal to each other. Their sum is the whole length." }],
            m: "4x + 3 = 6x - 5", say: "Equal halves." },
          { step: 3, ask: "Solve it. What is $x$?", type: "num", answer: 4, near: [{ v: -4, fb: "$8 = 2x$, so $x$ is positive." }, { v: 1, fb: "Subtract $4x$ and add 5: $8 = 2x$." }], hint: "$3 + 5 = 6x - 4x$.",
            m: "x = 4", say: "$8 = 2x$." },
          { step: 3, ask: "$PM = 4(4) + 3 = 19$. So what is the whole length $PQ$?", type: "num", answer: 38, near: [{ v: 19, fb: "That is one half. $PQ$ is both halves." }], hint: "Two equal halves.",
            m: "PQ = 19 + 19 = 38", say: "Both halves together." }],
        why: "Draw, equation, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$B$ is between $A$ and $C$. $AB = 7$ and $AC = 19$. Find $BC$.",
        art: segRow([["A", 0], ["B", 2.4], ["C", 6.6]], { over: [[0, 1, "7"], [1, 2, "?"]], under: [[0, 2, "19"]] }),
        answer: 12, skill: "Segment Addition",
        near: [{ v: 26, fb: "$AC$ is the whole. Subtract the part you know." }], hints: ["$7 + BC = 19$."], why: "$19 - 7 = 12$." },
      { type: "num", prompt: "$M$ is the midpoint of $\\overline{RS}$, and $RS = 26$. Find $RM$.", answer: 13, skill: "Midpoints",
        near: [{ v: 52, fb: "A midpoint halves the segment. It does not double it." }], hints: ["Half of 26."], why: "$26 \\div 2 = 13$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **construction** uses only a compass and a straightedge. Copy $\\overline{XY}$ without measuring it.",
        scene: { type: "walk", how: [["Line", "Draw a line and mark a point $P$ on it."], ["Open", "Open the compass to the length of the segment."], ["Mark", "Keep that opening, put the point on $P$, and mark the line."]], rows: [
          { step: 1, say: "A line, and a point $P$ on it where the copy will start.", fig: consCopySeg(1) },
          { step: 2, say: "The compass point on $X$ and the pencil on $Y$: the opening is now the length $XY$.", fig: consCopySeg(2) },
          { step: 3, say: "With the same opening and the point on $P$, the arc crosses the line at $Q$.", fig: consCopySeg(3) },
          { step: 3, m: "\\overline{PQ} \\cong \\overline{XY}", say: "Same opening, same length: the segments are congruent." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "On a number line, distance is the absolute value of the difference of the coordinates. Find $JK$.",
        art: numLine(-5, 7, [{ v: -3, name: "J" }, { v: 5, name: "K" }]),
        answer: 8, skill: "Distance on a number line",
        near: [{ v: 2, fb: "Subtract the coordinates: $5 - (-3)$." }, { v: -8, fb: "A distance is never negative." }], hints: ["$|5 - (-3)|$."], why: "$|5 - (-3)| = 8$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "$B$ is between $A$ and $C$, with $AB = 2x$, $BC = x + 6$ and $AC = 30$. Tap the line where the work **first** goes wrong.",
        lines: ["AB = 2x \\quad BC = x + 6 \\quad AC = 30", "2x = x + 6", "x = 6"], answer: 1, fix: "2x + (x + 6) = 30",
        fb: { 0: GIVEN, 2: LATER }, skill: "Segment Addition",
        hints: ["Is $B$ said to be the midpoint?"],
        why: "$B$ is only between, not the midpoint, so the parts add to the whole: $3x + 6 = 30$ and $x = 8$." },
      { type: "num", kicker: "Use it", prompt: "A straight relay course runs from the start $S$ through a checkpoint $C$ to the finish $F$. $SC = 280$ m and $SF = 400$ m. How long is the last leg?",
        post: "m", answer: 120, skill: "Segment Addition",
        near: [{ v: 680, fb: "$SF$ is the whole course. Subtract the first leg." }], hints: ["$280 + CF = 400$."], why: "$400 - 280 = 120$." }
    ]
  });

  /* ================================== 1-3 · Measuring and constructing angles */
  var HOW_1_3 = [["Parts", "Name the whole angle and the parts a ray cuts it into."],
                 ["Equation", "Write how they are related: parts add up to the whole, or a bisector makes equal parts."],
                 ["Solve", "Solve, then answer what was asked."]];
  var FIG_AOC = rayFig([0, 0], [{ d: 0, name: "A" }, { d: 40, name: "B" }, { d: 105, name: "C" }],
    { vname: "O", wedges: [{ i: 0, j: 1, say: "40°" }, { i: 1, j: 2, say: "x", c: "green", r: 30 }], alt: "Rays OA, OB and OC from O. Angle AOB is 40 degrees, and angle BOC is marked x." });
  LESSONS.push({
    title: "Measuring and constructing angles",
    blurb: "Book 1-3 · Naming and classifying angles, the protractor, the Angle Addition Postulate, and bisecting an angle.",
    mins: 12, v: 4,
    steps: [
      { type: "sketch", kicker: "Warm up", prompt: "Drag the orange point to open the angle until $m\\angle ABC = 70°$.",
        protractor: true, names: ["A", "B", "C"],
        pts: { B: { at: GT.polar([0, 0], 158, 150), drag: true, c: "orange", say: "The end of side BC" } },
        draw: function (s) { return [{ pray: 0 }, { pray: GT.dir([0, 0], s.B) }]; },
        readout: function (s) { return "$m\\angle ABC = " + Math.round(GT.dir([0, 0], s.B)) + "°$"; },
        goal: function (s) { return Math.round(GT.dir([0, 0], s.B)) === 70; },
        fb: function (s) { return Math.round(GT.dir([0, 0], s.B)) === 110 ? "That is 70 on the **inner** scale. Side $\\overrightarrow{BA}$ lies on the 0 of the outer scale, so read the outer numbers." : "Not yet: read the scale that starts at 0 on side $\\overrightarrow{BA}$."; },
        answer: { B: GT.polar([0, 0], 158, 70) }, skill: "Measure an angle",
        hints: ["Side $\\overrightarrow{BA}$ is on the right, at 0 of the **outer** scale.", "Turn the orange side until it crosses 70 on that scale."], why: "Counting from the 0 on side $\\overrightarrow{BA}$, the other side crosses 70." },
      { type: "learn", kicker: "The idea",
        prompt: "An **angle** is two rays with a common endpoint, its **vertex**. **Acute** is less than 90°, **right** is exactly 90°, **obtuse** is between 90° and 180°, and **straight** is 180°. A ray inside an angle cuts it into parts that add to the whole: the **Angle Addition Postulate**.",
        scene: { type: "method", how: HOW_1_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "$m\\angle AOB = 40°$ and $m\\angle AOC = 105°$. Watch $m\\angle BOC$ found.",
        scene: { type: "walk", how: HOW_1_3, rows: [
          { step: 1, m: "\\angle AOB \\quad \\angle BOC \\quad \\angle AOC", say: "Ray $\\overrightarrow{OB}$ is inside $\\angle AOC$, so the first two are its parts.", fig: FIG_AOC },
          { step: 2, m: "m\\angle AOB + m\\angle BOC = m\\angle AOC", say: "The parts add up to the whole." },
          { step: 2, m: "40 + x = 105", say: "Put in what you know.",
            ask: { prompt: "Which angle is the whole?", answer: 0,
                   options: [{ t: "$\\angle AOC$" }, { t: "$\\angle AOB$", fb: "That is one of the two parts." }] } },
          { step: 3, m: "x = 65", say: "$m\\angle BOC = 65°$." }] },
        gate: true, then: "The vertex is always the middle letter of an angle's name." },
      { type: "guided", kicker: "Together",
        prompt: "$\\overrightarrow{QS}$ **bisects** $\\angle PQR$. $m\\angle PQS = (5x - 4)°$ and $m\\angle SQR = (3x + 10)°$. Now you find $m\\angle PQR$.",
        art: rayFig([0, 0], [{ d: 0, name: "R" }, { d: 31, name: "S" }, { d: 62, name: "P" }], { vname: "Q", marks: [{ i: 0, j: 1 }, { i: 1, j: 2 }], alt: "Ray QS between rays QR and QP, with the two angles it makes marked as equal." }),
        how: HOW_1_3, skill: "Angle bisectors",
        steps: [
          { step: 1, ask: "A bisector cuts an angle into two parts that are…", type: "choice", answer: 0,
            options: [{ t: "congruent: equal in measure" }, { t: "supplementary", fb: "Supplementary angles add to 180°. To bisect is to cut in half." }],
            m: "\\angle PQS \\cong \\angle SQR", say: "Two equal halves." },
          { step: 2, ask: "Which equation follows?", type: "choice", answer: 0,
            options: [{ t: "$5x - 4 = 3x + 10$" }, { t: "$(5x - 4) + (3x + 10) = 90$", fb: "Nothing says the whole angle is 90°. The halves are equal to each other." }],
            m: "5x - 4 = 3x + 10", say: "Equal measures." },
          { step: 3, ask: "Solve it. What is $x$?", type: "num", answer: 7, near: [{ v: 3, fb: "$2x = 14$." }], hint: "$5x - 3x = 10 + 4$.",
            m: "x = 7", say: "$2x = 14$." },
          { step: 3, ask: "Each half measures $5(7) - 4 = 31°$. What is $m\\angle PQR$?", type: "num", answer: 62, near: [{ v: 31, fb: "That is one half. The whole angle is both halves." }], hint: "Two halves.",
            m: "m\\angle PQR = 31 + 31 = 62", say: "Both halves together: 62°." }],
        why: "Parts, equation, solve. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Classify each angle by its measure.",
        bins: ["Acute", "Right", "Obtuse", "Straight"],
        cards: [{ t: "$35°$", bin: 0, fb: "Less than 90°." }, { t: "$90°$", bin: 1, fb: "Exactly 90°." }, { t: "$118°$", bin: 2, fb: "Between 90° and 180°." },
                { t: "$180°$", bin: 3, fb: "Its sides form a line." }, { t: "$89°$", bin: 0, fb: "Just under 90° is still acute." }, { t: "$91°$", bin: 2, fb: "Just over 90° is obtuse." }],
        skill: "Classify angles", hints: ["Compare each measure with 90° and with 180°."],
        why: "90° and 180° are the two boundaries." },
      { type: "num", prompt: "$m\\angle XYZ = 128°$. Ray $\\overrightarrow{YW}$ lies inside it, and $m\\angle XYW = 53°$. Find $m\\angle WYZ$.",
        art: rayFig([0, 0], [{ d: 0, name: "X" }, { d: 53, name: "W" }, { d: 128, name: "Z" }], { vname: "Y", wedges: [{ i: 0, j: 1, say: "53°" }, { i: 1, j: 2, say: "?", c: "green", r: 30 }], alt: "Rays YX, YW and YZ. Angle XYW is 53 degrees." }),
        post: "°", answer: 75, skill: "Angle Addition",
        near: [{ v: 181, fb: "128° is the whole angle. Subtract the part you know." }], hints: ["$53 + x = 128$."], why: "$128 - 53 = 75$." },
      { type: "learn", kicker: "A harder case",
        prompt: "An angle can be bisected with a compass and a straightedge, with no protractor at all.",
        scene: { type: "walk", how: [["Arc", "With the point on the vertex, draw an arc across both sides."], ["Cross", "From each crossing point, with one opening, draw arcs that cross inside the angle."], ["Ray", "Draw the ray from the vertex through that crossing."]], rows: [
          { step: 1, say: "An arc centred on $A$ crosses the sides at $B$ and $C$.", fig: consBisectAngle(1) },
          { step: 2, say: "An arc from $B$.", fig: consBisectAngle(2) },
          { step: 2, say: "The same opening from $C$: the two arcs cross at $D$.", fig: consBisectAngle(3) },
          { step: 3, m: "\\angle BAD \\cong \\angle DAC", say: "$\\overrightarrow{AD}$ bisects the angle.", fig: consBisectAngle(4) }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "An angle has its vertex at $K$, and its sides pass through $J$ and $L$. Which name is correct?",
        options: [{ t: "$\\angle JKL$" }, { t: "$\\angle KJL$", fb: "The vertex must be the middle letter." }, { t: "$\\angle JLK$", fb: "The vertex must be the middle letter." }],
        answer: 0, skill: "Name an angle", hints: ["Where does the vertex go in the name?"], why: "The vertex, $K$, sits in the middle." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rosa reads this protractor and says the angle measures 50°. What is wrong?",
        art: GT.protractor({ a: 0, b: 130, names: ["D", "E", "F"], w: 380, alt: "A protractor on angle DEF. One side lies along the right-hand end of the straight edge, and the other points up and to the left." }),
        options: [{ t: "The angle is obtuse, so it cannot be 50°. She read the wrong scale: it is 130°." },
                  { t: "She should have added the two scales: 180°.", fb: "The two readings always add to 180°. Only one of them is the angle." },
                  { t: "Nothing. It is right.", fb: "The angle opens wider than a right angle." }],
        answer: 0, skill: "Measure an angle", hints: ["Is the angle wider or narrower than a right angle?"], why: "Start from the 0 on side $\\overrightarrow{ED}$: that scale reads 130." },
      { type: "num", kicker: "Use it", prompt: "A door stands open at 37° to the wall, and is then pushed 58° further. What angle does it make with the wall now?",
        post: "°", answer: 95, skill: "Angle Addition",
        near: [{ v: 21, fb: "The door opens further, so the angles add." }], hints: ["$37 + 58$."], why: "$37 + 58 = 95$: just past a right angle, so obtuse." }
    ]
  });
  /* ===================================================== 1-4 · Pairs of angles */
  var HOW_1_4 = [["Pair", "Decide how the angles are related: complementary (sum 90°), supplementary (sum 180°) or vertical (equal)."],
                 ["Equation", "Write that relation as an equation."],
                 ["Solve", "Solve, then find the measure that was asked for."]];
  LESSONS.push({
    title: "Pairs of angles",
    blurb: "Book 1-4 · Adjacent angles and linear pairs, complementary and supplementary angles, and vertical angles.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Two angles add up to 90°. One measures 25°. What is the other?", post: "°", answer: 65, skill: "Complementary angles",
        near: [{ v: 155, fb: "They add up to 90°, not 180°." }], hints: ["$90 - 25$."], why: "$90 - 25 = 65$." },
      { type: "learn", kicker: "Explore", prompt: "Two lines cross and make four angles. **Drag** the orange line round. Which angles stay equal, and which pairs always add to 180°?",
        scene: { type: "sketch", x: [-3.4, 3.4], y: [-2.6, 2.8], grid: false, u: 56, gate: true,
          pts: { H: { at: GT.polar([0, 0], 2.3, 55), drag: true, c: "orange", on: { circle: [[0, 0], 2.3], snapDeg: 1, range: [20, 160] }, say: "The turning line" } },
          draw: function (s) {
            var a = Math.round(GT.dir([0, 0], s.H)), O = [0, 0];
            return [{ angle: [[1, 0], O, GT.polar(O, 1, a)], say: "1: " + a + "°", r: 34 }, { angle: [GT.polar(O, 1, a), O, [-1, 0]], say: "2: " + (180 - a) + "°", r: 30, c: "blue" },
              { angle: [[-1, 0], O, GT.polar(O, 1, a + 180)], say: "3: " + a + "°", r: 34 }, { angle: [GT.polar(O, 1, a + 180), O, [1, 0]], say: "4: " + (180 - a) + "°", r: 30, c: "blue" },
              { dline: [[-3.1, 0], [3.1, 0]] }, { dline: [GT.polar(O, 2.9, a + 180), GT.polar(O, 2.9, a)], c: "orange" }, { pt: O }];
          },
          readout: function (s) {
            var a = Math.round(GT.dir([0, 0], s.H));
            return "$m\\angle 1 = m\\angle 3 = " + a + "°$ <span class='lw-sep'>·</span> $m\\angle 2 = m\\angle 4 = " + (180 - a) + "°$";
          } },
        gate: true,
        after: "Angles across from each other stay equal. Angles side by side always add to 180°." },
      { type: "learn", kicker: "The idea",
        prompt: "**Adjacent** angles share a vertex and a side. A **linear pair** is adjacent with its outer sides in a line, so it adds to 180°. **Complementary** angles add to 90° and **supplementary** angles to 180°. **Vertical** angles, opposite each other where two lines cross, are congruent.",
        scene: { type: "method", how: HOW_1_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Two supplementary angles measure $(3x + 10)°$ and $(2x + 20)°$. Watch both found.",
        scene: { type: "walk", how: HOW_1_4, rows: [
          { step: 1, m: "\\text{supplementary: the sum is } 180°", say: "That one word gives the equation." },
          { step: 2, m: "(3x + 10) + (2x + 20) = 180", say: "The two measures add up to 180.",
            ask: { prompt: "What do supplementary angles add up to?", answer: 0,
                   options: [{ t: "180°" }, { t: "90°", fb: "That is complementary. Supplementary angles make a straight angle." }] } },
          { step: 3, m: "5x + 30 = 180", say: "Combine like terms." },
          { step: 3, m: "x = 30", say: "$5x = 150$." },
          { step: 3, m: "3(30) + 10 = 100 \\qquad 2(30) + 20 = 80", say: "The angles measure 100° and 80°." }] },
        gate: true, then: "Check: $100 + 80 = 180$." },
      { type: "guided", kicker: "Together",
        prompt: "$\\angle 1$ and $\\angle 3$ are vertical angles. $m\\angle 1 = (4x + 6)°$ and $m\\angle 3 = (6x - 20)°$. Now you find $m\\angle 1$.",
        art: xFig(58, { alt: "Two lines crossing, making four angles numbered 1 to 4. Angles 1 and 3 are opposite each other." }),
        how: HOW_1_4, skill: "Vertical angles",
        steps: [
          { step: 1, ask: "Vertical angles are…", type: "choice", answer: 0,
            options: [{ t: "congruent: equal in measure" }, { t: "supplementary", fb: "That is a linear pair: angles side by side. Vertical angles are opposite each other." }],
            m: "m\\angle 1 = m\\angle 3", say: "Opposite angles are equal." },
          { step: 2, ask: "Which equation follows?", type: "choice", answer: 0,
            options: [{ t: "$4x + 6 = 6x - 20$" }, { t: "$(4x + 6) + (6x - 20) = 180$", fb: "That would be for a linear pair. Vertical angles are equal to each other." }],
            m: "4x + 6 = 6x - 20", say: "Equal measures." },
          { step: 3, ask: "Solve it. What is $x$?", type: "num", answer: 13, near: [{ v: -13, fb: "$26 = 2x$, so $x$ is positive." }, { v: 7, fb: "Add 20 to both sides: $6 + 20 = 26$." }], hint: "$6 + 20 = 6x - 4x$.",
            m: "x = 13", say: "$26 = 2x$." },
          { step: 3, ask: "Now the measure: what is $4(13) + 6$?", type: "num", answer: 58, hint: "$52 + 6$.",
            m: "m\\angle 1 = 4(13) + 6 = 58", say: "Both angles measure 58°." }],
        why: "Pair, equation, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the complement of a 38° angle.", post: "°", answer: 52, skill: "Complementary angles",
        near: [{ v: 142, fb: "That is the supplement. A complement adds up to 90°." }], hints: ["$90 - 38$."], why: "$90 - 38 = 52$." },
      { type: "num", prompt: "An angle is 4 times as large as its supplement. Find the angle.", post: "°", answer: 144, skill: "Supplementary angles",
        near: [{ v: 36, fb: "That is the supplement. The angle is 4 times as large." }, { v: 72, fb: "They add up to 180°, not 90°." }],
        hints: ["Call the supplement $s$. Then $4s + s = 180$."], why: "$5s = 180$, so $s = 36$ and the angle is $4 \\cdot 36 = 144$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The complement of an angle is 12° more than twice the angle. Find the angle.",
        scene: { type: "walk", how: HOW_1_4, rows: [
          { step: 1, m: "\\text{angle } x \\qquad \\text{complement } 90 - x", say: "Complementary angles add to 90°, so the complement is what is left." },
          { step: 2, m: "90 - x = 2x + 12", say: "“Is 12 more than twice the angle.”" },
          { step: 3, m: "78 = 3x", say: "Add $x$ and subtract 12." },
          { step: 3, m: "x = 26", say: "The angle is 26° and its complement 64°. Check: $2(26) + 12 = 64$." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "Vertical angles, or a linear pair?", art: xFig(62, { alt: "Two lines crossing, making four angles numbered 1 to 4 in order round the crossing point." }),
        bins: ["Vertical angles", "Linear pair"],
        cards: [{ t: "$\\angle 1$ and $\\angle 3$", bin: 0, fb: "Opposite each other." }, { t: "$\\angle 1$ and $\\angle 2$", bin: 1, fb: "Side by side, with their outer sides in a line." },
                { t: "$\\angle 2$ and $\\angle 4$", bin: 0, fb: "Opposite each other." }, { t: "$\\angle 3$ and $\\angle 4$", bin: 1, fb: "Side by side, with their outer sides in a line." }],
        skill: "Identify angle pairs", hints: ["Are the two angles across from each other, or next to each other?"],
        why: "Across: vertical and congruent. Next to each other: a linear pair, adding to 180°." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ty says angles of 100° and 80° are complementary. What is wrong?",
        options: [{ t: "They add to 180°, so they are supplementary. Complementary angles add to 90°." },
                  { t: "They are vertical angles.", fb: "Vertical angles are equal. These are not." },
                  { t: "Nothing. It is right.", fb: "$100 + 80 = 180$, not 90." }],
        answer: 0, skill: "Identify angle pairs", hints: ["Add the two measures."], why: "$100 + 80 = 180$: supplementary." },
      { type: "num", kicker: "Use it", prompt: "A ladder leans against a vertical wall on level ground. It makes a 68° angle with the ground. What angle does it make with the wall?",
        post: "°", answer: 22, skill: "Complementary angles",
        near: [{ v: 112, fb: "The wall and the ground meet at 90°, so the two angles are complementary." }], hints: ["The wall, the ground and the ladder make a right triangle: the two acute angles add to 90°."], why: "$90 - 68 = 22$." }
    ]
  });

  /* =============================================== 1-5 · Using formulas in geometry */
  var HOW_1_5 = [["Formula", "Write the formula that fits the figure and what is asked."],
                 ["Substitute", "Put in the lengths you know."],
                 ["Simplify", "Work it out, with units: plain units for a length, square units for an area."]];
  LESSONS.push({
    title: "Using formulas in geometry",
    blurb: "Book 1-5 · Perimeter and area of rectangles, squares and triangles, and the circumference and area of a circle.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which one measures the distance **around** a figure?",
        options: [{ t: "Perimeter" }, { t: "Area", fb: "Area measures the surface inside." }],
        answer: 0, skill: "Perimeter and area", hints: ["Think of a fence."], why: "Perimeter goes round the edge. Area fills the inside." },
      { type: "learn", kicker: "Explore", prompt: "Size the rectangle so that its perimeter is **24** and its area is **32**.",
        scene: { type: "rectangle", l: { v: 5, min: 1, max: 10 }, w: { v: 3, min: 1, max: 6 }, target: { P: 24, A: 32 }, answer: [8, 4] }, gate: true,
        after: "Two rectangles can share a perimeter and still have different areas." },
      { type: "learn", kicker: "The idea",
        prompt: "**Perimeter** is the distance around: $P = 2l + 2w$ for a rectangle, $P = 4s$ for a square, the sum of the sides for a triangle. **Area** is the surface inside: $A = lw$, $A = s^2$, $A = \\frac{1}{2}bh$. For a circle, $C = 2\\pi r$ and $A = \\pi r^2$.",
        scene: { type: "method", how: HOW_1_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the perimeter and the area of this rectangle found.",
        scene: { type: "walk", how: HOW_1_5, rows: [
          { step: 1, m: "P = 2l + 2w \\qquad A = lw", say: "One formula for each question.",
            fig: shapes([[[[0, 0], [6, 0], [6, 2.7], [0, 2.7]], { sides: ["9 in.", "4 in.", null, null] }]], { alt: "A rectangle 9 inches long and 4 inches wide." }) },
          { step: 2, m: "P = 2(9) + 2(4)", say: "Length 9 and width 4." },
          { step: 2, m: "A = 9 \\cdot 4", say: "The same two numbers, in the other formula.",
            ask: { prompt: "Which formula gives the area of a rectangle?", answer: 0,
                   options: [{ t: "$A = lw$" }, { t: "$A = 2l + 2w$", fb: "That is the perimeter." }] } },
          { step: 3, m: "P = 26 \\text{ in.}", say: "A length: inches." },
          { step: 3, m: "A = 36 \\text{ in.}^2", say: "An area: square inches." }] },
        gate: true, then: "The units tell you which of the two you have found." },
      { type: "guided", kicker: "Together",
        prompt: "A circle has radius 5 cm. Now you find its circumference, to the nearest tenth.",
        how: HOW_1_5, skill: "Circumference",
        steps: [
          { step: 1, ask: "Which formula gives the circumference?", type: "choice", answer: 0,
            options: [{ t: "$C = 2\\pi r$" }, { t: "$A = \\pi r^2$", fb: "That is the area of the circle." }],
            m: "C = 2\\pi r", say: "The distance around a circle." },
          { step: 2, ask: "Substitute $r = 5$. What is $2 \\cdot 5$?", type: "num", answer: 10, hint: "$2 \\cdot 5$.",
            m: "C = 2\\pi(5) = 10\\pi", say: "$10\\pi$ is the exact answer." },
          { step: 3, ask: "Use $\\pi \\approx 3.14$. What is $10\\pi$, to the nearest tenth?", type: "num", answer: 31.4, tol: 0.05, near: [{ v: 78.5, tol: 0.05, fb: "That is the area, $\\pi r^2$." }], hint: "$10 \\cdot 3.14$.",
            m: "C \\approx 31.4 \\text{ cm}", say: "A length, so plain centimetres." }],
        why: "Formula, substitute, simplify. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A triangle has base 14 ft and height 9 ft. Find its area.",
        art: shapes([[[[0, 0], [6, 0], [2, 3.4]], {}]], { extra: [{ seg: [[2, 3.4], [2, 0]], dash: "5 4", c: "orange" }, { angle: [[6, 0], [2, 0], [2, 3.4]], right: true, c: "orange" }, { word: "9 ft", at: [2.55, 1.6], c: "orange" }, { word: "14 ft", at: [3, -0.55] }], alt: "A triangle with base 14 feet. A dashed height of 9 feet meets the base at a right angle." }),
        post: "square feet", answer: 63, skill: "Area of a triangle",
        near: [{ v: 126, fb: "A triangle is half of the rectangle around it: $\\frac{1}{2}bh$." }], hints: ["$\\frac{1}{2} \\cdot 14 \\cdot 9$."], why: "$\\frac{1}{2} \\cdot 126 = 63$." },
      { type: "num", prompt: "A square has perimeter 36 m. Find its area.", post: "square metres", answer: 81, skill: "Perimeter and area",
        near: [{ v: 9, fb: "That is the side. The area is the side squared." }, { v: 1296, fb: "36 is the perimeter. Find the side first: $36 \\div 4$." }], hints: ["$4s = 36$, so $s = 9$."], why: "$s = 9$, so $A = 9^2 = 81$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The circle formulas use the **radius**. A circle has diameter 12 m. Find its area, to the nearest tenth.",
        scene: { type: "walk", how: HOW_1_5, rows: [
          { step: 1, m: "A = \\pi r^2", say: "The area of a circle." },
          { step: 2, m: "r = 12 \\div 2 = 6", say: "The radius is half the diameter." },
          { step: 2, m: "A = \\pi (6)^2", say: "The radius, squared." },
          { step: 3, m: "A = 36\\pi", say: "The exact area." },
          { step: 3, m: "A \\approx 113.0 \\text{ m}^2", say: "$36 \\cdot 3.14 = 113.04$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Use $\\pi \\approx 3.14$. A circle has radius 4 in. Find its circumference, to the nearest tenth.", post: "in.", answer: 25.1, tol: 0.05, skill: "Circumference",
        near: [{ v: 50.2, tol: 0.06, fb: "That is the area, $\\pi r^2$." }, { v: 12.6, tol: 0.06, fb: "$C = 2\\pi r$: do not leave out the 2." }], hints: ["$2 \\cdot 3.14 \\cdot 4$."], why: "$8 \\cdot 3.14 = 25.12$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A rectangle is 7 cm by 3 cm. Lee says its area is “20 cm”. Which reply puts both mistakes right?",
        options: [{ t: "20 is the perimeter. The area is $7 \\cdot 3 = 21$, in square centimetres." },
                  { t: "The area is 21 cm.", fb: "The number is right now, but an area is measured in square units." },
                  { t: "The area is 20 square centimetres.", fb: "The units are right now, but 20 is the perimeter: $2(7) + 2(3)$." }],
        answer: 0, skill: "Perimeter and area", hints: ["Where could 20 have come from? And which units does an area take?"], why: "$A = lw = 21 \\text{ cm}^2$." },
      { type: "num", kicker: "Use it", prompt: "A garden bed is a rectangle 12 ft by 5 ft. Fencing costs \\$3 a foot. What does it cost to fence it all the way round?",
        post: "dollars", answer: 102, skill: "Perimeter and area",
        near: [{ v: 180, fb: "That uses the area. A fence goes round the perimeter." }, { v: 34, fb: "That is the perimeter. Multiply by the price per foot." }], hints: ["$P = 2(12) + 2(5) = 34$ ft."], why: "$34 \\cdot 3 = 102$." }
    ]
  });
  /* ======================= 1-6 · Midpoint and distance in the coordinate plane */
  var HOW_1_6 = [["Label", "Call the points $(x_1, y_1)$ and $(x_2, y_2)$."],
                 ["Subtract", "Subtract the $x$-coordinates, and subtract the $y$-coordinates."],
                 ["Square", "Square each difference and add."],
                 ["Root", "Take the square root."]];
  var A16 = [-2, 1], B16 = [4, 9];
  LESSONS.push({
    title: "Midpoint and distance in the coordinate plane",
    blurb: "Book 1-6 · The Midpoint Formula, the Distance Formula, and the Pythagorean Theorem behind it.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "On a number line, which number is half-way between 2 and 10?", answer: 6, skill: "Midpoint",
        near: [{ v: 4, fb: "That is half the distance between them. The half-way point is $2 + 4$." }, { v: 12, fb: "Add them, then halve: the average." }], hints: ["The average of 2 and 10."], why: "$\\frac{2 + 10}{2} = 6$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **midpoint** of a segment averages the coordinates of its endpoints. The **distance** between two points is the hypotenuse of a right triangle whose legs are the differences in $x$ and in $y$, so by the Pythagorean Theorem $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.",
        scene: { type: "method", how: HOW_1_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the distance from $A(-2, 1)$ to $B(4, 9)$ found.",
        scene: { type: "walk", how: HOW_1_6, rows: [
          { step: 1, m: "A(-2, 1) \\quad B(4, 9)", say: "$x_1 = -2$, $y_1 = 1$, $x_2 = 4$, $y_2 = 9$.",
            fig: grid([-4, 6], [-1, 10], [{ seg: [A16, B16], c: "blue" }, { pt: A16, name: "A", at: "w" }, { pt: B16, name: "B", at: "e" }], { u: 20, alt: "The segment from A(−2, 1) to B(4, 9) on a grid." }) },
          { step: 2, m: "4 - (-2) = 6 \\qquad 9 - 1 = 8", say: "6 across and 8 up: the legs of a right triangle.",
            fig: grid([-4, 6], [-1, 10], [{ seg: [A16, B16], c: "blue" }].concat(legs(A16, B16), [{ pt: A16, name: "A", at: "w" }, { pt: B16, name: "B", at: "e" }]), { u: 20, alt: "The same segment as the hypotenuse of a right triangle with legs 6 and 8." }),
            ask: { prompt: "What is $4 - (-2)$?", answer: 0,
                   options: [{ t: "6" }, { t: "2", fb: "Subtracting $-2$ adds 2." }] } },
          { step: 3, m: "6^2 + 8^2 = 100", say: "$36 + 64$." },
          { step: 4, m: "d = \\sqrt{100} = 10", say: "$AB = 10$." }] },
        gate: true, then: "The Distance Formula is the Pythagorean Theorem with coordinates." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the distance from $P(1, -3)$ to $Q(6, 9)$.",
        how: HOW_1_6, skill: "Distance Formula",
        steps: [
          { step: 1, ask: "Which two numbers are the $x$-coordinates?", type: "choice", answer: 0,
            options: [{ t: "1 and 6" }, { t: "1 and $-3$", fb: "Those are the two coordinates of $P$. The $x$-coordinates come first in each pair." }],
            m: "P(1, -3) \\quad Q(6, 9)", say: "$x$: 1 and 6. $y$: $-3$ and 9." },
          { step: 2, ask: "Subtract the $y$-coordinates: $9 - (-3)$.", type: "num", answer: 12, near: [{ v: 6, fb: "Subtracting $-3$ adds 3." }], hint: "$9 + 3$.",
            m: "6 - 1 = 5 \\qquad 9 - (-3) = 12", say: "5 across and 12 up." },
          { step: 3, ask: "Square and add: $5^2 + 12^2$.", type: "num", answer: 169, near: [{ v: 34, fb: "Square each one: $25 + 144$." }, { v: 289, fb: "Square each difference first, then add." }], hint: "$25 + 144$.",
            m: "5^2 + 12^2 = 169", say: "$25 + 144$." },
          { step: 4, ask: "What is $\\sqrt{169}$?", type: "num", answer: 13, near: [{ v: 84.5, tol: 1e-9, fb: "A square root is not a half." }], hint: "$13 \\cdot 13$.",
            m: "d = \\sqrt{169} = 13", say: "$PQ = 13$." }],
        why: "Label, subtract, square, root. Now two on your own." },
      { type: "pair", kicker: "On your own", prompt: "Average the $x$s and average the $y$s. Find the midpoint of the segment from $(-4, 2)$ to $(6, 8)$. Type it as $(x, y)$.",
        answer: [1, 5], skill: "Midpoint Formula",
        near: [{ v: [2, 10], fb: "Those are the sums. Divide each by 2." }, { v: [5, 3], fb: "Add the coordinates, then halve. Do not subtract them." }],
        hints: ["$\\frac{-4 + 6}{2}$ and $\\frac{2 + 8}{2}$."], why: "$\\left(\\frac{2}{2}, \\frac{10}{2}\\right) = (1, 5)$." },
      { type: "num", prompt: "Find the distance between $(0, 0)$ and $(8, 15)$.", answer: 17, skill: "Distance Formula",
        near: [{ v: 23, fb: "Square each difference, add, then take the root." }, { v: 289, fb: "That is $d^2$. Take the square root." }], hints: ["$8^2 + 15^2 = 289$."], why: "$\\sqrt{64 + 225} = \\sqrt{289} = 17$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The Midpoint Formula can run backwards. $M(3, -1)$ is the midpoint of $\\overline{AB}$, and $A$ is $(-1, 2)$. Find $B$.",
        scene: { type: "walk", how: [["Set up", "Write the midpoint formula with the unknown endpoint $(x, y)$."], ["x", "Solve the equation for $x$."], ["y", "Solve the equation for $y$."]], rows: [
          { step: 1, m: "\\left(\\frac{-1 + x}{2}, \\frac{2 + y}{2}\\right) = (3, -1)", say: "The averages must equal the midpoint's coordinates." },
          { step: 2, m: "\\frac{-1 + x}{2} = 3", say: "The $x$-coordinates." },
          { step: 2, m: "x = 7", say: "$-1 + x = 6$." },
          { step: 3, m: "\\frac{2 + y}{2} = -1", say: "The $y$-coordinates." },
          { step: 3, m: "y = -4", say: "$2 + y = -2$." },
          { step: 3, m: "B(7, -4)", say: "From $A$ to $M$ is 4 right and 3 down. The same again reaches $B$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the distance between $(1, 2)$ and $(4, 7)$, to the nearest tenth.", answer: 5.8, tol: 0.05, skill: "Distance Formula",
        near: [{ v: 8, fb: "Square each difference, add, then take the root." }, { v: 34, fb: "That is $d^2$. Take the square root." }], hints: ["$3^2 + 5^2 = 34$."], why: "$\\sqrt{34} \\approx 5.83$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "The distance from $(1, 3)$ to $(5, 6)$. Tap the line where the work **first** goes wrong.",
        lines: ["d = \\sqrt{(5 - 1)^2 + (6 - 3)^2}", "d = \\sqrt{4 + 3}", "d = \\sqrt{7}"], answer: 1, fix: "d = \\sqrt{16 + 9}",
        fb: { 0: "The formula is filled in correctly.", 2: LATER }, skill: "Distance Formula",
        hints: ["What happened to the squares?"],
        why: "Each difference is squared: $16 + 9 = 25$, so $d = 5$." },
      { type: "num", kicker: "Use it", prompt: "On a park map, each grid unit is 1 km. A ranger station is at $(2, 1)$ and a lookout tower at $(11, 13)$. How far apart are they?",
        post: "km", answer: 15, skill: "Distance Formula",
        near: [{ v: 21, fb: "That walks round the corner. The straight-line distance is the hypotenuse." }], hints: ["9 across and 12 up."], why: "$\\sqrt{9^2 + 12^2} = \\sqrt{225} = 15$." }
    ]
  });

  /* ========================= 1-7 · Transformations in the coordinate plane */
  var HOW_1_7 = [["Rule", "Read the rule: what is added to $x$, and what is added to $y$."],
                 ["Apply", "Apply it to every vertex of the preimage."],
                 ["Draw", "Plot the image points, join them, and name them with primes."]];
  var T17 = [[-4, 1], [-1, 3], [-2, -1]], T17b = [[1, -1], [4, 1], [3, -3]];
  LESSONS.push({
    title: "Transformations in the coordinate plane",
    blurb: "Book 1-7 · Reflections, rotations and translations, and translating a figure with a coordinate rule.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The grey triangle was moved onto the blue one. What kind of move was it?",
        art: grid([-6, 6], [-1, 5], [{ poly: [[-5, 1], [-2, 1], [-2, 4]], c: "soft" }, { poly: [[5, 1], [2, 1], [2, 4]], c: "blue" }], { u: 22, alt: "A grey triangle on the left of the y-axis and its mirror image in blue on the right." }),
        options: [{ t: "A flip over the $y$-axis" }, { t: "A slide to the right", fb: "A slide would keep it facing the same way. This one faces the other way." }, { t: "A turn about the origin", fb: "A half turn would also put it upside down." }],
        answer: 0, skill: "Identify transformations", hints: ["Is the blue triangle facing the same way as the grey one?"], why: "Each point is as far from the $y$-axis as before, on the other side: a reflection." },
      { type: "learn", kicker: "Explore", prompt: "**Drag** $P$ to at least four places and watch its image $P'$. What happens to each coordinate?",
        scene: { type: "map", map: { kind: "translate", by: [3, -2] }, start: [-2, 1], need: 4, x: [-6, 6], y: [-6, 6], u: 26 }, gate: true,
        after: "Every point slides the same way: 3 right and 2 down." },
      { type: "learn", kicker: "The idea",
        prompt: "A **transformation** moves a figure. The original is the **preimage** and the result is the **image**, named with primes: $A \\to A'$. A **reflection** flips over a line, a **rotation** turns about a point, and a **translation** slides every point the same distance the same way.",
        scene: { type: "method", how: HOW_1_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\triangle ABC$ translated by the rule $(x, y) \\to (x + 5, y - 2)$.",
        scene: { type: "walk", how: HOW_1_7, rows: [
          { step: 1, m: "(x, y) \\to (x + 5, y - 2)", say: "5 right and 2 down.",
            fig: grid([-5, 5], [-4, 4], [{ poly: T17, c: "soft", names: ["A", "B", "C"] }], { u: 24, alt: "Triangle ABC with A(−4, 1), B(−1, 3) and C(−2, −1)." }) },
          { step: 2, m: "A(-4, 1) \\to A'(1, -1)", say: "$-4 + 5 = 1$ and $1 - 2 = -1$.",
            ask: { prompt: "What is $-4 + 5$?", answer: 0,
                   options: [{ t: "$1$" }, { t: "$-9$", fb: "Adding 5 moves right: $-4 + 5 = 1$." }] } },
          { step: 2, m: "B(-1, 3) \\to B'(4, 1)", say: "The same rule for every vertex." },
          { step: 2, m: "C(-2, -1) \\to C'(3, -3)", say: "$-2 + 5 = 3$ and $-1 - 2 = -3$." },
          { step: 3, m: "\\triangle A'B'C'", say: "Same size, same shape, facing the same way.",
            fig: grid([-5, 5], [-4, 4], [{ poly: T17, c: "soft", names: ["A", "B", "C"] }, { poly: T17b, c: "blue", names: ["A'", "B'", "C'"] }, { arrow: [T17[1], T17b[1]], c: "orange" }], { u: 24, alt: "Triangle ABC and its image A′B′C′, 5 to the right and 2 down." }) }] },
        gate: true, then: "A translation never turns or flips a figure." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the image of $P(2, -3)$ under $(x, y) \\to (x - 6, y + 4)$.",
        how: HOW_1_7, skill: "Translations",
        steps: [
          { step: 1, ask: "What does the rule do to $x$?", type: "choice", answer: 0,
            options: [{ t: "Subtracts 6: the point moves 6 left" }, { t: "Adds 6: the point moves 6 right", fb: "The rule says $x - 6$." }],
            m: "(x, y) \\to (x - 6, y + 4)", say: "6 left and 4 up." },
          { step: 2, ask: "The $x$-coordinate: what is $2 - 6$?", type: "num", answer: -4, near: [{ v: 4, fb: "$2 - 6$ is negative." }, { v: 8, fb: "Subtract 6. Do not add it." }], hint: "6 to the left of 2.",
            m: "2 - 6 = -4", say: "The new $x$." },
          { step: 2, ask: "The $y$-coordinate: what is $-3 + 4$?", type: "num", answer: 1, near: [{ v: -7, fb: "Add 4. Do not subtract it." }, { v: -1, fb: "4 up from $-3$ passes 0 and reaches 1." }], hint: "4 up from $-3$.",
            m: "-3 + 4 = 1", say: "The new $y$." },
          { step: 3, ask: "Name the image.", type: "choice", answer: 0,
            options: [{ t: "$P'(-4, 1)$" }, { t: "$P'(1, -4)$", fb: "$x$ comes first." }, { t: "$P(-4, 1)$", fb: "An image carries a prime: $P'$." }],
            m: "P'(-4, 1)", say: "The image of $P$." }],
        why: "Rule, apply, draw. Now two on your own." },
      { type: "plot", kicker: "On your own", prompt: "Draw the image of $\\triangle ABC$ under $(x, y) \\to (x + 4, y + 1)$. Click where $A'$ goes, then $B'$, then $C'$.",
        x: [-6, 6], y: [-6, 6], u: 26, show: [{ poly: [[-5, -2], [-2, -2], [-4, 1]], c: "soft", names: ["A", "B", "C"] }],
        target: [[-1, -1], [2, -1], [0, 2]], names: ["A'", "B'", "C'"], skill: "Translations",
        hints: ["Every vertex goes 4 right and 1 up.", "$A(-5, -2)$ goes to $(-1, -1)$."], why: "$A'(-1, -1)$, $B'(2, -1)$ and $C'(0, 2)$: each 4 right and 1 up." },
      { type: "choice", prompt: "$A(1, 2) \\to A'(-1, 2)$, $B(3, 2) \\to B'(-3, 2)$ and $C(3, 5) \\to C'(-3, 5)$. Which transformation is it?",
        options: [{ t: "A reflection across the $y$-axis" }, { t: "A translation to the left", fb: "$A$ moved 2 but $B$ moved 6. A translation moves every point the same distance." }, { t: "A rotation of 180° about the origin", fb: "That would change the sign of $y$ as well." }],
        answer: 0, skill: "Identify transformations", hints: ["Which coordinate changed, and how?"], why: "Each $x$ changed sign and each $y$ stayed: a flip over the $y$-axis." },
      { type: "learn", kicker: "A harder case",
        prompt: "From coordinates alone, decide which transformation maps $A(1, 3) \\to A'(-3, 1)$ and $B(4, 3) \\to B'(-3, 4)$.",
        scene: { type: "walk", how: [["Compare", "Compare each point with its image."], ["Pattern", "The same change for every point is a translation. A sign change is a reflection. A swap of coordinates is a rotation."], ["Name", "Name the transformation."]], rows: [
          { step: 1, m: "(1, 3) \\to (-3, 1) \\qquad (4, 3) \\to (-3, 4)", say: "The points move different distances: not a translation.",
            fig: grid([-5, 5], [-1, 5], [{ seg: [[1, 3], [4, 3]], c: "soft" }, { pt: [1, 3], name: "A", at: "n" }, { pt: [4, 3], name: "B", at: "n" }, { seg: [[-3, 1], [-3, 4]], c: "blue" }, { pt: [-3, 1], name: "A'", at: "w", c: "blue" }, { pt: [-3, 4], name: "B'", at: "w", c: "blue" }], { u: 24, alt: "Segment AB, lying flat, and its image A′B′, standing upright on the other side of the y-axis." }) },
          { step: 2, m: "(x, y) \\to (-y, x)", say: "The coordinates swap, and the new $x$ changes sign." },
          { step: 3, m: "\\text{a rotation of } 90° \\text{ about the origin}", say: "A quarter turn counterclockwise: the flat segment now stands upright." }] },
        gate: true },
      { type: "pair", kicker: "Try it", prompt: "Find the image of $(-3, 5)$ under $(x, y) \\to (x + 7, y - 8)$. Type it as $(x, y)$.",
        answer: [4, -3], skill: "Translations",
        near: [{ v: [-10, 13], fb: "The rule adds 7 to $x$ and subtracts 8 from $y$. You did the opposite." }, { v: [-3, 4], fb: "$x$ comes first: $-3 + 7$, then $5 - 8$." }],
        hints: ["$-3 + 7$ and $5 - 8$."], why: "$(-3 + 7, 5 - 8) = (4, -3)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Under $(x, y) \\to (x - 3, y + 2)$, Max says the image of $(5, 1)$ is $(8, -1)$. What went wrong?",
        options: [{ t: "He did the opposite to each coordinate. It is $(5 - 3, 1 + 2) = (2, 3)$." },
                  { t: "He swapped the coordinates. It is $(-1, 8)$.", fb: "A translation never swaps coordinates." },
                  { t: "Nothing. It is right.", fb: "The rule subtracts 3 from $x$, but 8 is more than 5." }],
        answer: 0, skill: "Translations", hints: ["Apply the rule exactly as written."], why: "$(5 - 3, 1 + 2) = (2, 3)$." },
      { type: "pair", kicker: "Use it", prompt: "A game piece at $(2, 1)$ moves 1 right and 2 up, and then 2 right and 1 up. Where does it end? Type it as $(x, y)$.",
        answer: [5, 4], skill: "Translations",
        near: [{ v: [3, 3], fb: "That is after the first move only." }], hints: ["First to $(3, 3)$. Then 2 right and 1 up."], why: "$(2 + 1 + 2, 1 + 2 + 1) = (5, 4)$: one translation by $(x + 3, y + 3)$." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "hg1-name", title: "Name lines, segments and rays", lesson: 2,
      gen: function (R) {
        var n = letters(R, 2), a = n[0], b = n[1], kind = R.int(0, 2);
        var art = plain([0, 7.4], [0.2, 3.8], [kind === 0 ? { dline: [[1, 1.1], [6.6, 3]], ray: true } : kind === 1 ? { seg: [[1, 1.1], [4, 2.12]] } : { dline: [[0.4, 0.9], [6.6, 3]] },
          { pt: [1, 1.1], name: a, at: "nw" }, { pt: [4, 2.12], name: b, at: "nw" }],
          { u: 40, alt: ["A ray that starts at " + a + " and passes through " + b + ".", "A segment from " + a + " to " + b + ".", "A line through " + a + " and " + b + ", with an arrowhead at each end."][kind] });
        var ray = "$\\overrightarrow{" + a + b + "}$", yar = "$\\overrightarrow{" + b + a + "}$", seg = "$\\overline{" + a + b + "}$", line = "$\\overleftrightarrow{" + a + b + "}$";
        return mc(R, { prompt: "Which is the name of this figure?", art: art, right: [ray, seg, line][kind],
          wrong: [kind === 0 ? { t: yar, fb: "A ray's name starts with its endpoint, $" + a + "$." } : { t: ray, fb: "A ray has one arrowhead and one endpoint." },
                  kind === 1 ? { t: line, fb: "A line has an arrowhead at each end. This figure stops at both ends." } : { t: seg, fb: "A segment stops at both ends, with no arrowheads." },
                  kind === 2 ? { t: yar, fb: "A ray has only one arrowhead." } : { t: kind === 0 ? line : yar, fb: kind === 0 ? "A line has an arrowhead at each end." : "A ray has an arrowhead. This figure has none." }],
          hints: ["Count the arrowheads: none is a segment, one is a ray, two is a line."], why: ["One endpoint, written first, and one arrowhead: a ray.", "Two endpoints and no arrowheads: a segment.", "An arrowhead at each end: a line."][kind] });
      } },
    { id: "hg1-segment", title: "Segment addition and midpoints", lesson: 3,
      gen: function (R) {
        var n = letters(R, 3), A = n[0], B = n[1], C = n[2], kind = R.int(0, 2), x = R.int(2, 9), a = R.int(2, 5), b = R.int(1, 9), c = R.int(1, 4), d = R.int(1, 9);
        if (kind === 0) { var p = R.int(3, 18), q = R.int(3, 18);
          return { type: "num", prompt: "$" + B + "$ is between $" + A + "$ and $" + C + "$. $" + A + B + " = " + p + "$ and $" + A + C + " = " + (p + q) + "$. Find $" + B + C + "$.", answer: q,
            art: segRow([[A, 0], [B, 6.6 * p / (p + q)], [C, 6.6]], { over: [[0, 1, String(p)], [1, 2, "?"]], under: [[0, 2, String(p + q)]] }),
            near: [{ v: 2 * p + q, fb: "$" + A + C + "$ is the whole. Subtract the part you know." }], hints: ["$" + p + " + " + B + C + " = " + (p + q) + "$."], why: "$" + (p + q) + " - " + p + " = " + q + "$." }; }
        if (kind === 1) { var AB = a * x + b, BC = c * x + d;
          return { type: "num", prompt: "$" + B + "$ is between $" + A + "$ and $" + C + "$. $" + A + B + " = " + a + "x + " + b + "$, $" + B + C + " = " + (c === 1 ? "" : c) + "x + " + d + "$ and $" + A + C + " = " + (AB + BC) + "$. Find $" + A + B + "$.", answer: AB,
            near: near(AB, [{ v: x, fb: "That is $x$. The question asks for $" + A + B + "$: put $x$ back in." }, { v: BC, fb: "That is $" + B + C + "$." }]),
            hints: ["$(" + a + "x + " + b + ") + (" + (c === 1 ? "" : c) + "x + " + d + ") = " + (AB + BC) + "$.", "$x = " + x + "$."], why: "$x = " + x + "$, so $" + A + B + " = " + a + "(" + x + ") + " + b + " = " + AB + "$." }; }
        // A midpoint: a x + b = c2 x − d2, with a < c2.
        var c2 = a + R.int(1, 3), half = a * x + b, d2 = c2 * x - half;
        if (d2 <= 0) { c2 = a + 1; d2 = c2 * x - half; }
        if (d2 <= 0) return { type: "num", prompt: "$" + B + "$ is the midpoint of $\\overline{" + A + C + "}$, and $" + A + C + " = " + 2 * half + "$. Find $" + A + B + "$.", answer: half,
          near: [{ v: 4 * half, fb: "A midpoint halves the segment." }], hints: ["Half of " + 2 * half + "."], why: "$" + 2 * half + " \\div 2 = " + half + "$." };
        return { type: "num", prompt: "$" + B + "$ is the midpoint of $\\overline{" + A + C + "}$. $" + A + B + " = " + a + "x + " + b + "$ and $" + B + C + " = " + c2 + "x - " + d2 + "$. Find $" + A + C + "$.", answer: 2 * half,
          near: near(2 * half, [{ v: half, fb: "That is one half. $" + A + C + "$ is both halves." }, { v: x, fb: "That is $x$. Put it back in to find the lengths." }]),
          hints: ["A midpoint makes equal halves: $" + a + "x + " + b + " = " + c2 + "x - " + d2 + "$.", "$x = " + x + "$, so each half is " + half + "."], why: "$x = " + x + "$, each half is " + half + ", and $" + A + C + " = " + 2 * half + "$." };
      } },
    { id: "hg1-angle", title: "Angle addition and bisectors", lesson: 4,
      gen: function (R) {
        var kind = R.int(0, 2), p = R.int(20, 70), q = R.int(15, 60);
        if (kind === 0) return { type: "num", prompt: "A ray cuts a $" + (p + q) + "°$ angle into two parts. One part measures $" + p + "°$. Find the other.", post: "°", answer: q,
          near: [{ v: 2 * p + q, fb: "$" + (p + q) + "°$ is the whole angle. Subtract the part you know." }], hints: ["$" + p + " + x = " + (p + q) + "$."], why: "$" + (p + q) + " - " + p + " = " + q + "$." };
        if (kind === 1) { var x = R.int(3, 12), a = R.int(2, 5), c = a + R.int(1, 3), half = a * x + R.int(1, 9), b = half - a * x, d = c * x - half;
          if (d <= 0) return { type: "num", prompt: "A ray bisects an angle of $" + 2 * half + "°$. What is the measure of each half?", post: "°", answer: half,
            near: [{ v: 4 * half, fb: "To bisect is to cut in half." }], hints: ["Half of " + 2 * half + "."], why: "$" + 2 * half + " \\div 2 = " + half + "$." };
          return { type: "num", prompt: "A ray bisects an angle. The two halves measure $(" + a + "x + " + b + ")°$ and $(" + c + "x - " + d + ")°$. Find the measure of the **whole** angle.", post: "°", answer: 2 * half,
            near: near(2 * half, [{ v: half, fb: "That is one half. The whole angle is both halves." }, { v: x, fb: "That is $x$. Put it back in." }]),
            hints: ["The halves are equal: $" + a + "x + " + b + " = " + c + "x - " + d + "$.", "$x = " + x + "$, so each half is " + half + "°."], why: "$x = " + x + "$, each half is $" + half + "°$, and the whole is $" + 2 * half + "°$." }; }
        var m = R.pick([12, 38, 67, 89, 90, 91, 104, 135, 172, 180]), cls = m < 90 ? "Acute" : m === 90 ? "Right" : m < 180 ? "Obtuse" : "Straight";
        return mc(R, { prompt: "An angle measures $" + m + "°$. What kind of angle is it?", right: cls, keep: true,
          wrong: ["Acute", "Right", "Obtuse", "Straight"].filter(function (t) { return t !== cls; }).map(function (t) { return { t: t, fb: { Acute: "Acute is less than 90°.", Right: "Right is exactly 90°.", Obtuse: "Obtuse is between 90° and 180°.", Straight: "Straight is exactly 180°." }[t] }; }),
          hints: ["Compare it with 90° and with 180°."], why: { Acute: "Less than 90°.", Right: "Exactly 90°.", Obtuse: "Between 90° and 180°.", Straight: "Exactly 180°." }[cls] });
      } },
    { id: "hg1-pairs", title: "Complementary, supplementary and vertical angles", lesson: 5,
      gen: function (R) {
        var kind = R.int(0, 2), a = R.int(12, 78);
        if (kind === 0) { var comp = R.chance(0.5), tot = comp ? 90 : 180, g = comp ? a : R.int(25, 155);
          return { type: "num", prompt: "Find the " + (comp ? "complement" : "supplement") + " of a $" + g + "°$ angle.", post: "°", answer: tot - g,
            near: near(tot - g, [{ v: (comp ? 180 : 90) - g, fb: comp ? "That is the supplement. A complement adds up to 90°." : "That is the complement. A supplement adds up to 180°." }]),
            hints: ["$" + tot + " - " + g + "$."], why: "$" + tot + " - " + g + " = " + (tot - g) + "$." }; }
        if (kind === 1) { var x = R.int(4, 15), p = R.int(2, 5), q = p + R.int(1, 3), m = p * x + R.int(2, 12), b = m - p * x, d = q * x - m;
          if (d <= 0) return { type: "num", prompt: "Two lines cross. One of the angles measures $" + a + "°$. What is the measure of the angle vertical to it?", post: "°", answer: a,
            near: [{ v: 180 - a, fb: "That is the angle beside it. Vertical angles are equal." }], hints: ["Vertical angles are congruent."], why: "Vertical angles are congruent: $" + a + "°$." };
          return { type: "num", prompt: "Two vertical angles measure $(" + p + "x + " + b + ")°$ and $(" + q + "x - " + d + ")°$. Find the measure of each angle.", post: "°", answer: m,
            near: near(m, [{ v: x, fb: "That is $x$. Put it back in to find the measure." }]),
            hints: ["Vertical angles are equal: $" + p + "x + " + b + " = " + q + "x - " + d + "$.", "$x = " + x + "$."], why: "$x = " + x + "$, so each angle is $" + p + "(" + x + ") + " + b + " = " + m + "°$." }; }
        var k = R.int(2, 5), sup = R.chance(0.5), T = sup ? 180 : 90, s0 = T / (k + 1);
        if (s0 % 1) { k = sup ? 4 : 2; s0 = T / (k + 1); }
        return { type: "num", prompt: "An angle is " + k + " times as large as its " + (sup ? "supplement" : "complement") + ". Find the angle.", post: "°", answer: k * s0,
          near: near(k * s0, [{ v: s0, fb: "That is the " + (sup ? "supplement" : "complement") + ". The angle is " + k + " times as large." }]),
          hints: ["Call the smaller one $s$. Then $" + k + "s + s = " + T + "$."], why: "$" + (k + 1) + "s = " + T + "$, so $s = " + s0 + "$ and the angle is $" + k * s0 + "°$." };
      } },
    { id: "hg1-formula", title: "Perimeter, area and circumference", lesson: 6,
      gen: function (R) {
        var kind = R.int(0, 3), l = R.int(5, 16), w = R.int(2, l - 1), b = 2 * R.int(2, 9), h = R.int(3, 12), r = R.int(2, 12);
        if (kind === 0) { var per = R.chance(0.5), ans = per ? 2 * l + 2 * w : l * w;
          return { type: "num", prompt: "A rectangle is " + l + " cm long and " + w + " cm wide. Find its **" + (per ? "perimeter" : "area") + "**.", post: per ? "cm" : "square cm", answer: ans,
            near: near(ans, [{ v: per ? l * w : 2 * l + 2 * w, fb: per ? "That is the area. Perimeter is the distance around." : "That is the perimeter. Area is length times width." }]),
            hints: [per ? "$2(" + l + ") + 2(" + w + ")$." : "$" + l + " \\cdot " + w + "$."], why: per ? "$P = " + 2 * l + " + " + 2 * w + " = " + ans + "$." : "$A = " + l + " \\cdot " + w + " = " + ans + "$." }; }
        if (kind === 1) return { type: "num", prompt: "A triangle has base " + b + " in. and height " + h + " in. Find its area.", post: "square inches", answer: b * h / 2,
          near: [{ v: b * h, fb: "A triangle is half of the rectangle around it: $\\frac{1}{2}bh$." }], hints: ["$\\frac{1}{2} \\cdot " + b + " \\cdot " + h + "$."], why: "$\\frac{1}{2} \\cdot " + b * h + " = " + b * h / 2 + "$." };
        if (kind === 2) { var s = R.int(3, 14);
          return { type: "num", prompt: "A square has perimeter " + 4 * s + " m. Find its area.", post: "square metres", answer: s * s,
            near: near(s * s, [{ v: s, fb: "That is the side. The area is the side squared." }]), hints: ["$4s = " + 4 * s + "$, so $s = " + s + "$."], why: "$s = " + s + "$, so $A = " + s * s + "$." }; }
        var area = R.chance(0.5), C = Math.round(2 * 3.14 * r * 10) / 10, A = Math.round(3.14 * r * r * 10) / 10;
        return { type: "num", prompt: "Use $\\pi \\approx 3.14$. A circle has radius " + r + " cm. Find its " + (area ? "area" : "circumference") + ", to the nearest tenth.", post: area ? "square cm" : "cm", answer: area ? A : C, tol: 0.06,
          near: near(area ? A : C, [{ v: area ? C : A, tol: 0.06, fb: area ? "That is the circumference. Area is $\\pi r^2$." : "That is the area. Circumference is $2\\pi r$." }]),
          hints: [area ? "$3.14 \\cdot " + r + "^2$." : "$2 \\cdot 3.14 \\cdot " + r + "$."], why: area ? "$3.14 \\cdot " + r * r + " \\approx " + num(A) + "$." : "$6.28 \\cdot " + r + " \\approx " + num(C) + "$." };
      } },
    { id: "hg1-midpoint", title: "Find a midpoint", lesson: 7,
      gen: function (R) {
        var mx = R.int(-4, 4), my = R.int(-4, 4), dx = R.int(1, 4), dy = R.int(1, 4) * R.pick([1, -1]), P = [mx - dx, my - dy], Q = [mx + dx, my + dy];
        return { type: "pair", prompt: "Find the midpoint of the segment from $" + pt(P) + "$ to $" + pt(Q) + "$. Type it as $(x, y)$.", answer: [mx, my],
          near: [{ v: [2 * mx, 2 * my], fb: "Those are the sums. Divide each by 2." }, { v: [dx, dy], fb: "Add the coordinates, then halve. Do not subtract them." }],
          hints: ["$\\frac{" + P[0] + " + " + (Q[0] < 0 ? "(" + Q[0] + ")" : Q[0]) + "}{2}$ and $\\frac{" + P[1] + " + " + (Q[1] < 0 ? "(" + Q[1] + ")" : Q[1]) + "}{2}$."],
          why: "$\\left(\\frac{" + 2 * mx + "}{2}, \\frac{" + 2 * my + "}{2}\\right) = " + pt([mx, my]) + "$." };
      } },
    { id: "hg1-distance", title: "Find a distance", lesson: 7,
      gen: function (R) {
        var T = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]]), sw = R.chance(0.5), dx = (sw ? T[1] : T[0]) * R.pick([1, -1]), dy = (sw ? T[0] : T[1]) * R.pick([1, -1]);
        var P = [R.int(-5, 5), R.int(-5, 5)], Q = [P[0] + dx, P[1] + dy];
        return { type: "num", prompt: "Find the distance between $" + pt(P) + "$ and $" + pt(Q) + "$.", answer: T[2],
          near: [{ v: Math.abs(dx) + Math.abs(dy), fb: "That goes round the corner. Square each difference, add, then take the root." }, { v: T[2] * T[2], fb: "That is $d^2$. Take the square root." }],
          hints: ["The differences are " + Math.abs(dx) + " and " + Math.abs(dy) + ".", "$" + Math.abs(dx) + "^2 + " + Math.abs(dy) + "^2 = " + T[2] * T[2] + "$."], why: "$\\sqrt{" + dx * dx + " + " + dy * dy + "} = \\sqrt{" + T[2] * T[2] + "} = " + T[2] + "$." };
      } },
    { id: "hg1-translate", title: "Translate a point", lesson: 8,
      gen: function (R) {
        var P = [R.int(-6, 6), R.int(-6, 6)], a = R.int(1, 8) * R.pick([1, -1]), b = R.int(1, 8) * R.pick([1, -1]);
        return { type: "pair", prompt: "Find the image of $" + pt(P) + "$ under $(x, y) \\to (x " + plusMinus(a) + ", y " + plusMinus(b) + ")$. Type it as $(x, y)$.", answer: [P[0] + a, P[1] + b],
          near: [{ v: [P[0] - a, P[1] - b], fb: "You did the opposite to each coordinate. Apply the rule as written." }, { v: [P[1] + b, P[0] + a], fb: "$x$ comes first." }],
          hints: ["$" + P[0] + " " + plusMinus(a) + "$ and $" + P[1] + " " + plusMinus(b) + "$."], why: "$" + pt([P[0] + a, P[1] + b]) + "$: " + move(a, b) + "." };
      } }
  ];
  L.unit("geo", 1, {
    title: "Foundations for Geometry",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Naming figures, segment addition and midpoints, and angles.",
        skills: ["hg1-name", "hg1-segment", "hg1-angle"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Pairs of angles, and perimeter, area and circumference.",
        skills: ["hg1-pairs", "hg1-formula"], per: 3 },
      { title: "Quiz 3", after: 8, blurb: "Midpoint, distance, and translations.",
        skills: ["hg1-midpoint", "hg1-distance", "hg1-translate"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:1", {
    2: { name: "Points, lines and planes", frame: "A point, a line and a plane are the [[undefined]] terms. A [[segment]] has two endpoints, and a [[ray]] has one. Points on the same line are [[collinear]].",
         chips: ["coplanar", "angle"] },
    3: { name: "Segments", frame: "If $B$ is between $A$ and $C$, then $AB + BC = $ [[AC]]. Segments with the same length are [[congruent]]. A [[midpoint]] divides a segment into two congruent segments.",
         chips: ["BC", "parallel"] },
    4: { name: "Angles", frame: "An angle is two rays with a common endpoint, the [[vertex]]. An [[acute]] angle is less than 90° and an [[obtuse]] angle is more. An angle [[bisector]] divides an angle into two congruent angles.",
         chips: ["right", "midpoint"] },
    5: { name: "Pairs of angles", frame: "[[Complementary]] angles add to 90° and [[supplementary]] angles add to 180°. A linear pair is supplementary. [[Vertical]] angles are congruent.",
         chips: ["Adjacent", "Acute"] },
    6: { name: "Formulas", frame: "[[Perimeter]] is the distance around a figure, and [[area]] is the surface inside it, in square units. A circle's formulas use its [[radius]]: $C = 2\\pi r$ and $A = \\pi r^2$.",
         chips: ["diameter", "volume"] },
    7: { name: "Midpoint and distance", frame: "A midpoint's coordinates are the [[averages]] of the endpoints' coordinates. The distance between two points is the [[hypotenuse]] of a right triangle whose [[legs]] are the differences in $x$ and in $y$.",
         chips: ["sums", "slope"] },
    8: { name: "Transformations", frame: "A transformation maps a [[preimage]] onto its [[image]]. A [[translation]] slides every point the same way, a reflection flips over a line, and a [[rotation]] turns about a point.",
         chips: ["dilation", "midpoint"] }
  });
})();
