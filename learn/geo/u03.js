/* ==========================================================================
   Geometry — Unit 3: Parallel and Perpendicular Lines. See lab/core.js for
   the format and lab/geotools.js for the drawing kit.

   Follows CK-12 Geometry (CK-12 Foundation, CC BY-SA), Chapter 3, section
   for section (3.1 to 3.8), after a readiness check. The sentences,
   examples, figures and questions are OEdu's own; the order and the ideas
   are the book's.

   Lines, planes and the angles a transversal makes (3.1), those angles when
   the lines are parallel (3.2), proving lines parallel (3.3), slopes (3.4),
   equations of lines (3.5), perpendicular lines (3.6), perpendicular
   transversals and the distance to a line (3.7), and taxicab geometry, a
   geometry with another idea of distance (3.8). One drawing runs through
   3.1 to 3.3 and 3.7: two lines, a transversal, and the eight angles
   numbered 1 to 8, which you can turn and tap.

   Lessons carry v: 5, so a record kept from the Holt-based Unit 3 (v 4) does
   not mark these done. Skills are hg3-…

   Nine lessons, nine skills, three quizzes, and the unit test.
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

  /* --------------------------------------------- Hands-on scenes (sketch) */
  // A point along the line through a and b (k = 0 at a, 1 at b), for drawing a line or a ray to the frame's edge.
  function farPt(a, b, k) { return [a[0] + k * (b[0] - a[0]), a[1] + k * (b[1] - a[1])]; }
  function lineThru(a, b, c) { return { dline: [farPt(a, b, -40), farPt(a, b, 41)], c: c }; }
  function rayThru(a, b, c) { return { dline: [a, farPt(a, b, 41)], ray: true, c: c }; }
  function crossOf(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
  function samePt(a, b) { return Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6; }
  function r10(v) { return Math.round(v * 10) / 10; }
  function n1(v) { return num(r10(v)); }
  function deg0(v) { return Math.round(v); }
  // The angle at v from a to b, 0–180, in whole degrees.
  function angAt(a, v, b) { return Math.round(GT.angle(a, v, b)); }
  // "Found: acute ✓ right ✓ …": the kinds a drag has shown so far, as a line of words.
  function found(list, seen) { return list.map(function (k) { return (seen[k[0]] ? "**" + k[1] + " ✓**" : "<span class='gt-dim'>" + k[1] + "</span>"); }).join(" · "); }
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks", art: "ready",
    tag: "Ready?",
    blurb: "Before Chapter 3 · Angle pairs, equations with the variable on both sides, and slope.",
    mins: 6, v: 5,
    steps: [
      { type: "num", kicker: "Check 1 · Angle pairs", prompt: "$\\angle 1$ and $\\angle 2$ form a linear pair, and $m\\angle 1 = 72°$. Find $m\\angle 2$.", post: "°", answer: 108, skill: "Linear pairs",
        near: [{ v: 18, fb: "A linear pair adds to 180°, not 90°." }, { v: 72, fb: "A linear pair is supplementary. It is vertical angles that are equal." }], hints: ["$180 - 72$."], why: "$180 - 72 = 108$." },
      { type: "num", prompt: "Two lines cross. One of the four angles measures 55°. What is the measure of the angle vertical to it?", post: "°", answer: 55, skill: "Vertical angles",
        near: [{ v: 125, fb: "That is the angle beside it. Vertical angles are congruent." }], hints: ["Vertical angles are congruent."], why: "Vertical angles are congruent." },
      { type: "num", kicker: "Check 2 · Equations", prompt: "Solve $3x + 20 = 5x - 10$.", pre: "$x =$", answer: 15, skill: "Solve an equation",
        near: [{ v: 5, fb: "Add 10 to both sides as well: $30 = 2x$." }, { v: -15, fb: "$30 = 2x$, so $x$ is positive." }], hints: ["$20 + 10 = 5x - 3x$."], why: "$30 = 2x$, so $x = 15$." },
      { type: "num", prompt: "Solve $x + (2x + 30) = 180$.", pre: "$x =$", answer: 50, skill: "Solve an equation",
        near: [{ v: 70, fb: "Subtract 30 before you divide by 3." }], hints: ["$3x + 30 = 180$."], why: "$3x = 150$, so $x = 50$." },
      { type: "num", kicker: "Check 3 · Slope", prompt: "Find the slope of the line through $(1, 2)$ and $(3, 8)$.", answer: 3, skill: "Slope",
        near: [{ v: 1 / 3, tol: 1e-9, fb: "Rise over run: the change in $y$ goes on top." }], hints: ["$\\frac{8 - 2}{3 - 1}$."], why: "$\\frac{6}{2} = 3$." },
      { type: "num", prompt: "A line has the equation $y = 2x - 3$. What is $y$ when $x = 4$?", pre: "$y =$", answer: 5, skill: "Evaluate an equation",
        near: [{ v: 2, fb: "Multiply first: $2(4) = 8$, then subtract 3." }], hints: ["$2(4) - 3$."], why: "$8 - 3 = 5$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 3-1**. If **check 1** slipped, see lesson 1-4. If **check 3** slipped, lesson 3-5 starts from the beginning of slope.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ================================================= 3.1 · Lines and angles */
  var HOW_3_1 = [["Transversal", "Find the transversal: the line that crosses the other two."],
                 ["Position", "Are the angles between the two lines (interior) or outside them (exterior)? On the same side of the transversal, or on opposite sides?"],
                 ["Name", "Name the pair."]];
  /* ---- Two lines cut by a transversal, with their eight angles, for the hands-on scenes.
     ℓ runs through A (above), m through B (below), the transversal t crosses both at t degrees. The angles are numbered as in the book:
     1 to 4 round A (upper left, upper right, lower left, lower right) and 5 to 8 round B the same way. phi tilts m (0 when the lines are parallel). */
  var B8 = [3.3, 0];
  function crossA8(t) { return [B8[0] + 2.4 / Math.tan(t * Math.PI / 180), 2.4]; }
  function sectors8(t, phi) {
    var s = {};
    [[1, 0], [5, phi]].forEach(function (z) {
      var f = z[0], b = z[1];
      s[f] = [t, 180 + b]; s[f + 1] = [b, t]; s[f + 2] = [180 + b, t + 180]; s[f + 3] = [t + 180, 360 + b];
    });
    return s;
  }
  var PAIRS8 = { "corresponding angles": [[1, 5], [2, 6], [3, 7], [4, 8]], "alternate interior angles": [[3, 6], [4, 5]], "alternate exterior angles": [[1, 8], [2, 7]],
                 "consecutive interior angles": [[3, 5], [4, 6]], "consecutive exterior angles": [[1, 7], [2, 8]], "vertical angles": [[1, 4], [2, 3], [5, 8], [6, 7]],
                 "a linear pair": [[1, 2], [1, 3], [2, 4], [3, 4], [5, 6], [5, 7], [6, 8], [7, 8]] };
  var CONG8 = { "corresponding angles": 1, "alternate interior angles": 1, "alternate exterior angles": 1, "vertical angles": 1 };
  function pair8(a, b) {
    for (var k in PAIRS8) if (PAIRS8[k].some(function (p) { return (p[0] === +a && p[1] === +b) || (p[0] === +b && p[1] === +a); })) return { k: k, cong: !!CONG8[k] };
    return { k: "not a named pair", cong: null };
  }
  function draw8(t, phi, sel, o) {
    o = o || {};
    var A = crossA8(t), S = sectors8(t, phi), items = [];
    (sel || []).forEach(function (n, i) { var I = n <= 4 ? A : B8, r = S[n]; items.push({ angle: [GT.polar(I, 1, r[0]), I, GT.polar(I, 1, r[1])], r: 40 + i * 7, c: i ? "green" : "orange" }); });
    items.push({ dline: [[0.3, 2.4], [7.9, 2.4]], c: o.lc || "ink" }, { dline: [GT.polar(B8, 3.2, 180 + phi), GT.polar(B8, 4.6, phi)], c: o.mc || "ink" },
      { dline: [GT.polar(B8, 1.5, t + 180), GT.polar(A, 1.5, t)], c: "blue" }, { word: "ℓ", at: [7.7, 2.75], name: true }, { word: "m", at: GT.polar(B8, 4.5, phi + 4.5), name: true }, { pt: A }, { pt: B8 });
    return items;
  }
  function taps8(tf, phif, r) {
    var tp = {};
    for (var n = 1; n <= 8; n++) (function (n) {
      tp[String(n)] = { label: String(n), r: r || 15, at: function (s) { var t = tf(s), S = sectors8(t, phif ? phif(s) : 0), z = S[n], I = n <= 4 ? crossA8(t) : B8, a = (z[0] + z[1]) / 2, w = z[1] - z[0]; return GT.polar(I, w > 100 ? 0.62 : 0.95, a); } };
    })(n);
    return tp;
  }
  LESSONS.push({
    title: "Lines and angles", art: "lines",
    blurb: "Section 3.1 · Parallel, skew and perpendicular lines, parallel planes, the transversal, and the eight angles it makes.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In this box, edges $\\overline{AB}$ and $\\overline{DC}$ lie in the same face and never meet. What are they?", art: boxFig(),
        options: [{ t: "Parallel" }, { t: "Perpendicular", fb: "Perpendicular lines meet, at a right angle." }, { t: "Skew", fb: "Skew lines are not in one plane. These two are both in the front face." }],
        answer: 0, skill: "Parallel, perpendicular, skew", hints: ["They are the bottom and the top of the front face."], why: "In one plane and never meeting: parallel." },
      { type: "learn", kicker: "Explore",
        prompt: "$ℓ$ and $m$ are cut by the transversal $t$, making eight angles. Tap **any two** and see what they are called. Find an example of each of the four named pairs.",
        scene: { type: "sketch", x: [0, 8.4], y: [-1.5, 3.9], u: 54, grid: false, gate: true,
          taps: taps8(function () { return 62; }), maxSel: 2,
          track: function (s) { var p = s.selList.length === 2 ? pair8(s.selList[0], s.selList[1]).k : null; return /^(corresponding|alternate interior|alternate exterior|consecutive interior)/.test(p || "") ? p : null; },
          draw: function (s) { return draw8(62, 0, s.selList); },
          readout: function (s) {
            return (s.selList.length === 2 ? "$\\angle " + s.selList[0] + "$ and $\\angle " + s.selList[1] + "$: **" + pair8(s.selList[0], s.selList[1]).k + "**" : "Tap two angles.") + "<br>" +
              found([["corresponding angles", "Corresponding"], ["alternate interior angles", "Alternate interior"], ["alternate exterior angles", "Alternate exterior"], ["consecutive interior angles", "Consecutive interior"]], s.tracked);
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        then: "**Corresponding** angles sit in the same place at each crossing. **Alternate** angles are on opposite sides of $t$: **interior** if between the lines, **exterior** if outside. **Consecutive** interior angles are between the lines on the same side." },
      { type: "learn", kicker: "The idea",
        prompt: "**Parallel** lines lie in one plane and never meet. **Perpendicular** lines meet at 90°. **Skew** lines are not in one plane, so they neither meet nor are parallel. A **transversal** crosses two lines and makes eight angles, and pairs of those angles are named by position.",
        scene: { type: "method", how: HOW_3_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch three pairs of angles named in this drawing.",
        scene: { type: "walk", how: HOW_3_1, rows: [
          { step: 1, m: "t", say: "Line $t$ crosses the other two: it is the transversal.", fig: transFig({ marks: false }) },
          { step: 2, m: "\\angle 3 \\text{ and } \\angle 6", say: "Both are between the two lines, on opposite sides of $t$.",
            ask: { prompt: "$\\angle 3$ and $\\angle 6$ are on…", answer: 0,
                   options: [{ t: "opposite sides of the transversal" }, { t: "the same side of it", fb: "$\\angle 3$ is to the left of $t$ and $\\angle 6$ to the right." }] } },
          { step: 3, m: "\\text{alternate interior angles}", say: "Interior: between the lines. Alternate: opposite sides." },
          { step: 3, m: "\\angle 1, \\angle 5\\text{: corresponding}", say: "The same position at each crossing: upper left." },
          { step: 3, m: "\\angle 4, \\angle 6\\text{: same-side interior}", say: "Between the lines, and both to the right of $t$." }] },
        gate: true, then: "Four names: corresponding, alternate interior, alternate exterior, same-side interior." },
      { type: "guided", kicker: "Together",
        prompt: "Now you name the pair $\\angle 2$ and $\\angle 7$.", art: transFig({ marks: false }),
        how: HOW_3_1, skill: "Angle pairs",
        steps: [
          { step: 1, ask: "Which line is the transversal?", type: "choice", answer: 0,
            options: [{ t: "$t$" }, { t: "$ℓ$", fb: "$ℓ$ is one of the two lines being crossed." }],
            m: "t", say: "The line that crosses both." },
          { step: 2, ask: "Are $\\angle 2$ and $\\angle 7$ between the two lines, or outside them?", type: "choice", answer: 0,
            options: [{ t: "Outside: exterior" }, { t: "Between: interior", fb: "$\\angle 2$ is above the upper line and $\\angle 7$ below the lower one." }],
            m: "\\text{exterior}", say: "Above the top line, and below the bottom line." },
          { step: 2, ask: "Are they on the same side of $t$, or on opposite sides?", type: "choice", answer: 0,
            options: [{ t: "Opposite sides: alternate" }, { t: "The same side", fb: "$\\angle 2$ is to the right of $t$ and $\\angle 7$ to the left." }],
            m: "\\text{alternate}", say: "One on each side." },
          { step: 3, ask: "What is the pair called?", type: "choice", answer: 0,
            options: [{ t: "Alternate exterior angles" }, { t: "Corresponding angles", fb: "Corresponding angles sit in the same position at each crossing." }, { t: "Alternate interior angles", fb: "Interior angles are between the two lines." }],
            m: "\\text{alternate exterior angles}", say: "Outside the lines, on opposite sides." }],
        why: "Transversal, position, name. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "Match each pair of angles to its name.", art: transFig({ marks: false }),
        slots: [{ id: "c", label: "Corresponding" }, { id: "ai", label: "Alternate interior" }, { id: "ae", label: "Alternate exterior" }, { id: "ss", label: "Same-side interior" }],
        cards: [{ t: nb("$\\angle 2$ and $\\angle 6$"), slot: "c", fb: "Both are upper right at their crossing." }, { t: nb("$\\angle 4$ and $\\angle 5$"), slot: "ai", fb: "Between the lines, on opposite sides of $t$." },
                { t: nb("$\\angle 1$ and $\\angle 8$"), slot: "ae", fb: "Outside the lines, on opposite sides of $t$." }, { t: nb("$\\angle 3$ and $\\angle 5$"), slot: "ss", fb: "Between the lines, both to the left of $t$." }],
        skill: "Angle pairs", hints: ["Inside or outside the two lines? Same side of the transversal, or opposite sides?"],
        why: "Position names the pair." },
      { type: "choice", prompt: "In the box, what are edges $\\overline{AB}$ and $\\overline{CG}$?", art: boxFig(),
        options: [{ t: "Skew" }, { t: "Parallel", fb: "They point in different directions: one runs along the front, the other goes back." }, { t: "Perpendicular", fb: "They never meet, so they cannot be perpendicular." }],
        answer: 0, skill: "Parallel, perpendicular, skew", hints: ["Do they meet? Could one flat sheet hold both?"], why: "They do not meet and are not in one plane: skew." },
      { type: "learn", kicker: "A harder case",
        prompt: "Planes can be parallel too. Find a pair of parallel planes in the box.",
        scene: { type: "walk", how: [["Faces", "Each face of the box lies in a plane."], ["Never meet", "Two planes that never meet are parallel."], ["Name", "Name each plane by three of its points."]], rows: [
          { step: 1, m: "\\text{plane } ABC", say: "The front face.", fig: boxFig() },
          { step: 2, m: "\\text{plane } EFG", say: "The back face. However far the two are extended, they never meet." },
          { step: 3, m: "\\text{plane } ABC \\parallel \\text{plane } EFG", say: "Parallel planes. The top and bottom are another pair, and so are the two sides." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which angle is the corresponding angle of $\\angle 4$?", art: transFig({ marks: false }),
        options: [{ t: "$\\angle 8$" }, { t: "$\\angle 5$", fb: "$\\angle 4$ and $\\angle 5$ are alternate interior angles." }, { t: "$\\angle 6$", fb: "$\\angle 4$ and $\\angle 6$ are same-side interior angles." }],
        answer: 0, skill: "Angle pairs", hints: ["$\\angle 4$ is lower right at its crossing. Which angle is lower right at the other?"], why: "Both are lower right." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lena says $\\angle 3$ and $\\angle 5$ are alternate interior angles. What is wrong?", art: transFig({ marks: false, only: [3, 5, 6] }),
        options: [{ t: "They are on the same side of $t$: same-side interior. The alternate interior partner of $\\angle 3$ is $\\angle 6$." },
                  { t: "They are exterior angles.", fb: "Both are between the two lines." },
                  { t: "Nothing. It is right.", fb: "Alternate means on opposite sides of the transversal." }],
        answer: 0, skill: "Angle pairs", hints: ["Which side of $t$ is each angle on?"], why: "Both are left of $t$: same-side interior." },
      { type: "choice", kicker: "Use it", prompt: "On a railway, the two rails never meet, and each wooden tie crosses both rails at right angles. Which description fits?",
        options: [{ t: "The rails are parallel, and each tie is a transversal perpendicular to both" }, { t: "The rails are skew", fb: "The rails lie in the same flat track bed: one plane." }],
        answer: 0, skill: "Parallel, perpendicular, skew", hints: ["Are the rails in one plane? What does a tie do?"], why: "Parallel lines, cut by perpendicular transversals." }
    ]
  });
  /* ================================= 3.2 · Parallel lines and transversals */
  var HOW_3_2 = [["Pair", "Name the pair the two angles make."],
                 ["Relation", "With parallel lines: corresponding, alternate interior and alternate exterior angles are congruent. Same-side interior angles are supplementary."],
                 ["Solve", "Write the equation and solve."]];
  var B32 = [3, 0];
  LESSONS.push({
    title: "Parallel lines and transversals", art: "trans",
    blurb: "Section 3.2 · The Corresponding Angles Postulate, and the theorems about alternate and consecutive angles.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The two lines are parallel. Slide the upper crossing down the transversal and it lands on the lower one. So what is $m\\angle 5$?", art: transFig({ say: { 1: "118°", 5: "?" } }),
        post: "°", answer: 118, skill: "Corresponding angles",
        near: [{ v: 62, fb: "That is the angle beside it. The matching position has the same measure." }], hints: ["$\\angle 5$ is in the same position as the 118° angle."], why: "Corresponding angles on parallel lines are congruent." },
      { type: "learn", kicker: "Explore",
        prompt: "$ℓ \\parallel m$. Turn the transversal, and tap **any two** of the eight angles. Which kinds of pair are always **equal**, and which always add up to **180°**?",
        scene: { type: "sketch", x: [0, 8.4], y: [-1.5, 3.9], u: 54, grid: false, gate: true,
          pts: { H: { at: GT.polar(B8, 1.9, 62), drag: true, c: "orange", on: { circle: [B8, 1.9], snapDeg: 1, range: [28, 152] }, say: "The transversal" } },
          taps: taps8(function (s) { return Math.round(GT.dir(B8, s.H)); }), maxSel: 2,
          track: function (s) { if (s.selList.length < 2) return null; var p = pair8(s.selList[0], s.selList[1]); return p.cong === true ? "equal" : /consecutive|linear/.test(p.k) ? "supp" : null; },
          draw: function (s) { return draw8(Math.round(GT.dir(B8, s.H)), 0, s.selList); },
          readout: function (s) {
            var t = Math.round(GT.dir(B8, s.H)), S = sectors8(t, 0), mm = function (n) { var z = S[n]; return Math.round(z[1] - z[0]) % 360; };
            if (s.selList.length < 2) return "Tap two angles." + "<br>" + found([["equal", "Equal pairs"], ["supp", "Pairs that add to 180°"]], s.tracked);
            var a = s.selList[0], b = s.selList[1], p = pair8(a, b);
            return "$\\angle " + a + "$ and $\\angle " + b + "$: **" + p.k + "**<br>$m\\angle " + a + " = " + mm(a) + "°$ and $m\\angle " + b + " = " + mm(b) + "°$ → " + (mm(a) === mm(b) ? "**equal**" : "**add up to " + (mm(a) + mm(b)) + "°**") + "<br>" +
              found([["equal", "Equal pairs"], ["supp", "Pairs that add to 180°"]], s.tracked);
          },
          goal: function (s) { return s.tracked.equal && s.tracked.supp; } },
        then: "With parallel lines: **corresponding**, **alternate interior** and **alternate exterior** angles are congruent; **consecutive** interior angles are supplementary. No matter how you turn $t$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **Corresponding Angles Postulate**: if a transversal crosses two parallel lines, corresponding angles are congruent. Three theorems follow: alternate interior angles are congruent, alternate exterior angles are congruent, and same-side interior angles are supplementary.",
        scene: { type: "method", how: HOW_3_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "$ℓ \\parallel m$, $m\\angle 3 = (5x - 20)°$ and $m\\angle 6 = (3x + 10)°$. Watch both measures found.",
        scene: { type: "walk", how: HOW_3_2, rows: [
          { step: 1, m: "\\angle 3, \\angle 6\\text{: alternate interior}", say: "Between the lines, on opposite sides of $t$.", fig: transFig({ say: { 3: "(5x − 20)°", 6: "(3x + 10)°" } }) },
          { step: 2, m: "m\\angle 3 = m\\angle 6", say: "Alternate Interior Angles Theorem.",
            ask: { prompt: "The lines are parallel. Alternate interior angles are…", answer: 0,
                   options: [{ t: "congruent" }, { t: "supplementary", fb: "That is same-side interior angles." }] } },
          { step: 3, m: "5x - 20 = 3x + 10", say: "Equal measures." },
          { step: 3, m: "x = 15", say: "$2x = 30$." },
          { step: 3, m: "5(15) - 20 = 55", say: "Both angles measure 55°." }] },
        gate: true, then: "Name the pair first. The name tells you whether to set the measures equal or add them to 180." },
      { type: "guided", kicker: "Together",
        prompt: "$ℓ \\parallel m$, $m\\angle 4 = (2x + 15)°$ and $m\\angle 6 = (3x + 5)°$. Now you find $m\\angle 4$.", art: transFig({ say: { 4: "(2x + 15)°", 6: "(3x + 5)°" } }),
        how: HOW_3_2, skill: "Same-side interior angles",
        steps: [
          { step: 1, ask: "What kind of pair are $\\angle 4$ and $\\angle 6$?", type: "choice", answer: 0,
            options: [{ t: "Same-side interior" }, { t: "Alternate interior", fb: "Both are to the right of $t$." }],
            m: "\\text{same-side interior}", say: "Between the lines, on the same side of $t$." },
          { step: 2, ask: "With parallel lines, same-side interior angles are…", type: "choice", answer: 0,
            options: [{ t: "supplementary" }, { t: "congruent", fb: "One is acute and the other obtuse: they add to 180°." }],
            m: "m\\angle 4 + m\\angle 6 = 180", say: "Same-Side Interior Angles Theorem." },
          { step: 3, ask: "Solve $(2x + 15) + (3x + 5) = 180$. What is $x$?", type: "num", answer: 32, near: [{ v: 40, fb: "$5x + 20 = 180$: subtract 20 first." }], hint: "$5x + 20 = 180$.",
            m: "x = 32", say: "$5x = 160$." },
          { step: 3, ask: "So what is $m\\angle 4 = 2(32) + 15$?", type: "num", answer: 79, near: [{ v: 101, fb: "That is $m\\angle 6$." }], hint: "$64 + 15$.",
            m: "m\\angle 4 = 79", say: "And $m\\angle 6 = 101$: together 180." }],
        why: "Pair, relation, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$ℓ \\parallel m$ and $m\\angle 2 = 64°$. Find $m\\angle 7$.", art: transFig({ say: { 2: "64°", 7: "?" } }),
        post: "°", answer: 64, skill: "Alternate exterior angles",
        near: [{ v: 116, fb: "Alternate exterior angles on parallel lines are congruent, not supplementary." }], hints: ["$\\angle 2$ and $\\angle 7$ are alternate exterior angles."], why: "Alternate exterior angles are congruent." },
      { type: "num", prompt: "$ℓ \\parallel m$ and $m\\angle 4 = 68°$. Find $m\\angle 6$.", art: transFig({ say: { 4: "68°", 6: "?" } }),
        post: "°", answer: 112, skill: "Same-side interior angles",
        near: [{ v: 68, fb: "Same-side interior angles are supplementary, not congruent." }], hints: ["They add to 180°."], why: "$180 - 68 = 112$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The theorems are proved from the postulate. Given $ℓ \\parallel m$, prove that $\\angle 3 \\cong \\angle 6$.",
        scene: { type: "walk", how: [["Given", "Start from what is given."], ["Link", "One step at a time, each with its reason."], ["Prove", "End with the statement to be proved."]], rows: [
          { step: 1, m: "ℓ \\parallel m", say: "Given.", fig: transFig({ only: [2, 3, 6] }) },
          { step: 2, m: "\\angle 3 \\cong \\angle 2", say: "Vertical Angles Theorem." },
          { step: 2, m: "\\angle 2 \\cong \\angle 6", say: "Corresponding Angles Postulate." },
          { step: 3, m: "\\angle 3 \\cong \\angle 6", say: "Transitive Property of Congruence. That is the Alternate Interior Angles Theorem." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "$ℓ \\parallel m$, $m\\angle 1 = (4x + 6)°$ and $m\\angle 8 = (6x - 30)°$. Find $m\\angle 1$.", art: transFig({ say: { 1: "(4x + 6)°", 8: "(6x − 30)°" } }),
        post: "°", answer: 78, skill: "Alternate exterior angles",
        near: [{ v: 18, fb: "That is $x$. Put it back in to find the measure." }], hints: ["Alternate exterior angles are congruent: $4x + 6 = 6x - 30$."], why: "$x = 18$, so $4(18) + 6 = 78$." },
      { type: "choice", kicker: "Find the error",
        prompt: "$ℓ \\parallel m$ and $m\\angle 3 = 70°$. Raj says $m\\angle 5 = 70°$, because they are same-side interior angles. What is wrong?", art: transFig({ say: { 3: "70°", 5: "?" } }),
        options: [{ t: "Same-side interior angles are supplementary: $m\\angle 5 = 110°$." },
                  { t: "They are corresponding angles.", fb: "They are in different positions at the two crossings." },
                  { t: "Nothing. It is right.", fb: "Congruent is for corresponding and alternate angles." }],
        answer: 0, skill: "Same-side interior angles", hints: ["Do same-side interior angles match, or add to 180°?"], why: "$180 - 70 = 110$." },
      { type: "num", kicker: "Use it", prompt: "The rungs of a ladder are parallel. A side rail makes an 85° angle with one rung, measured above the rung. What angle does it make, in the same position, with the next rung?",
        post: "°", answer: 85, skill: "Corresponding angles",
        near: [{ v: 95, fb: "The same position at each crossing: corresponding angles, which are congruent." }], hints: ["The rail is a transversal of two parallel rungs."], why: "Corresponding angles are congruent." }
    ]
  });
  /* ================================================ 3.3 · Proving lines parallel */
  var HOW_3_3 = [["Pair", "Name the pair the two angles make."],
                 ["Test", "Corresponding or alternate angles: are they congruent? Same-side interior angles: are they supplementary?"],
                 ["Conclude", "If the test passes, the lines are parallel, by the converse."]];
  LESSONS.push({
    title: "Proving lines parallel", art: "proofpar",
    blurb: "Section 3.3 · The converses: congruent or supplementary angles make the lines parallel.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is the converse of “If two lines are parallel, then corresponding angles are congruent”?",
        options: [{ t: "If corresponding angles are congruent, then the two lines are parallel." }, { t: "If two lines are not parallel, then corresponding angles are not congruent.", fb: "That negates both parts: the inverse." }],
        answer: 0, skill: "Converse", hints: ["Swap the two parts."], why: "A converse swaps the hypothesis and the conclusion." },
      { type: "learn", kicker: "Explore",
        prompt: "The transversal and $ℓ$ stay put. Turn line $m$ about $B$ until the two **corresponding** angles, $\\angle 1$ and $\\angle 5$, are equal. What happens to the lines?",
        scene: { type: "sketch", x: [0, 8.4], y: [-1.5, 3.9], u: 54, grid: false, gate: true,
          pts: { M: { at: GT.polar(B8, 2.0, 14), drag: true, c: "orange", on: { circle: [B8, 2.0], snapDeg: 1, range: [-26, 26] }, say: "Line m" } },
          draw: function (s) {
            var phi = Math.round(GT.dir(B8, s.M)), phi2 = phi > 180 ? phi - 360 : phi, par = phi2 === 0, A = crossA8(62), items = draw8(62, phi2, [], { mc: par ? "green" : "ink", lc: par ? "green" : "ink" });
            // where ℓ and m meet, if they do within the picture
            if (!par) { var x = B8[0] + (2.4 - 0) / Math.tan(phi2 * Math.PI / 180) * 1; if (x > 0.2 && x < 8.2) items.push({ pt: [x, 2.4], c: "red", r: 5 }, { word: "they meet", at: [x, 3.1], c: "red" }); }
            items.push({ angle: [GT.polar(A, 1, 62), A, GT.polar(A, 1, 180)], say: "1", r: 30, c: "blue" }, { angle: [GT.polar(B8, 1, 62), B8, GT.polar(B8, 1, 180 + phi2)], say: "5", r: 30, c: par ? "green" : "orange" });
            return items;
          },
          readout: function (s) {
            var phi = Math.round(GT.dir(B8, s.M)), phi2 = phi > 180 ? phi - 360 : phi, a1 = 118, a5 = 118 + phi2;
            return "$m\\angle 1 = " + a1 + "°$ · $m\\angle 5 = " + a5 + "°$ → " + (phi2 === 0 ? "**congruent**: $ℓ \\parallel m$ ✓" : "not congruent: the lines will meet");
          },
          goal: function (s) { var phi = Math.round(GT.dir(B8, s.M)); return phi === 0 || phi === 360; } },
        then: "When the corresponding angles are congruent the lines never meet: they are **parallel**. That is the **Converse of the Corresponding Angles Postulate**." },
      { type: "learn", kicker: "The idea",
        prompt: "Here the converses are true as well. If a transversal makes congruent corresponding angles, congruent alternate interior or alternate exterior angles, or supplementary same-side interior angles, then the two lines are **parallel**. That is how lines are proved parallel.",
        scene: { type: "method", how: HOW_3_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "$m\\angle 1 = (3x + 10)°$, $m\\angle 5 = (4x - 5)°$ and $x = 15$. Watch it shown that $ℓ \\parallel m$.",
        scene: { type: "walk", how: HOW_3_3, rows: [
          { step: 1, m: "\\angle 1, \\angle 5\\text{: corresponding}", say: "The same position at each crossing.", fig: transFig({ marks: false, say: { 1: "(3x + 10)°", 5: "(4x − 5)°" } }) },
          { step: 2, m: "3(15) + 10 = 55 \\qquad 4(15) - 5 = 55", say: "Put in $x = 15$.",
            ask: { prompt: "For the lines to be parallel, corresponding angles must be…", answer: 0,
                   options: [{ t: "congruent" }, { t: "supplementary", fb: "That is the test for same-side interior angles." }] } },
          { step: 2, m: "\\angle 1 \\cong \\angle 5", say: "Both measure 55°." },
          { step: 3, m: "ℓ \\parallel m", say: "Converse of the Corresponding Angles Postulate." }] },
        gate: true, then: "Without the test, nothing in the drawing proves the lines parallel." },
      { type: "guided", kicker: "Together",
        prompt: "$m\\angle 3 = 112°$ and $m\\angle 5 = 68°$. Now you decide whether $ℓ \\parallel m$.", art: transFig({ marks: false, say: { 3: "112°", 5: "68°" }, t: 112 }),
        how: HOW_3_3, skill: "Prove lines parallel",
        steps: [
          { step: 1, ask: "What kind of pair are $\\angle 3$ and $\\angle 5$?", type: "choice", answer: 0,
            options: [{ t: "Same-side interior" }, { t: "Corresponding", fb: "They are in different positions at the two crossings." }],
            m: "\\text{same-side interior}", say: "Between the lines, both to the left of $t$." },
          { step: 2, ask: "The test for this pair: what is $112 + 68$?", type: "num", answer: 180, hint: "Add the two measures.",
            m: "112 + 68 = 180", say: "They are supplementary." },
          { step: 3, ask: "So the lines are…", type: "choice", answer: 0,
            options: [{ t: "parallel" }, { t: "not parallel", fb: "Supplementary same-side interior angles mean parallel lines." }],
            m: "ℓ \\parallel m", say: "Converse of the Same-Side Interior Angles Theorem." }],
        why: "Pair, test, conclude. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "$m\\angle 4 = 95°$ and $m\\angle 5 = 85°$. Are the lines parallel?", art: transFig({ marks: false, tilt: 10, say: { 4: "95°", 5: "85°" } }),
        options: [{ t: "No: alternate interior angles would have to be congruent" }, { t: "Yes: the angles are supplementary", fb: "Supplementary is the test for same-side interior angles. These are alternate interior." }],
        answer: 0, skill: "Prove lines parallel", hints: ["Name the pair first."], why: "Alternate interior angles of 95° and 85° are not congruent." },
      { type: "num", prompt: "$m\\angle 2 = (6x + 8)°$ and $m\\angle 7 = (8x - 22)°$. For which value of $x$ are the lines parallel?", art: transFig({ marks: false, say: { 2: "(6x + 8)°", 7: "(8x − 22)°" } }),
        pre: "$x =$", answer: 15, skill: "Prove lines parallel",
        near: [{ v: 97 / 7, tol: 1e-2, fb: "Alternate exterior angles must be congruent, not supplementary." }], hints: ["Alternate exterior angles: $6x + 8 = 8x - 22$."], why: "$30 = 2x$, so $x = 15$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A proof with one step before the converse. Given: $\\angle 2$ and $\\angle 5$ are supplementary. Prove: $ℓ \\parallel m$.",
        scene: { type: "walk", how: [["Given", "Start from what is given."], ["Link", "One step at a time, each with its reason."], ["Prove", "End with the statement to be proved."]], rows: [
          { step: 1, m: "\\angle 2, \\angle 5 \\text{ supplementary}", say: "Given.", fig: transFig({ marks: false, only: [1, 2, 5] }) },
          { step: 2, m: "\\angle 1, \\angle 2 \\text{ supplementary}", say: "Linear Pair Theorem." },
          { step: 2, m: "\\angle 1 \\cong \\angle 5", say: "Congruent Supplements Theorem: both are supplementary to $\\angle 2$." },
          { step: 3, m: "ℓ \\parallel m", say: "Converse of the Corresponding Angles Postulate." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "The **Parallel Postulate**: through a point $P$ that is not on line $ℓ$, how many lines are parallel to $ℓ$?",
        options: [{ t: "Exactly one" }, { t: "None", fb: "There is always one." }, { t: "As many as you like", fb: "Any other line through $P$ eventually meets $ℓ$." }],
        answer: 0, skill: "Parallel Postulate", hints: ["Picture every line through $P$. How many never meet $ℓ$?"], why: "Exactly one line through $P$ is parallel to $ℓ$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kay writes: “$\\angle 1 \\cong \\angle 4$, so $ℓ \\parallel m$.” What is wrong?", art: transFig({ marks: false, only: [1, 4] }),
        options: [{ t: "$\\angle 1$ and $\\angle 4$ are vertical angles at one crossing. They are always congruent, and say nothing about the other line." },
                  { t: "They should be supplementary.", fb: "Vertical angles are congruent. The trouble is that both are at the same crossing." },
                  { t: "Nothing. It is right.", fb: "A test for parallel lines needs one angle at each crossing." }],
        answer: 0, skill: "Prove lines parallel", hints: ["Where are the two angles?"], why: "A parallel test compares an angle at one crossing with an angle at the other." },
      { type: "choice", kicker: "Use it", prompt: "A carpenter cuts both ends of a plank so that the alternate interior angles with one edge are both 40°. What does that guarantee?",
        options: [{ t: "The two cut ends are parallel" }, { t: "The two cut ends are perpendicular", fb: "Congruent alternate interior angles give parallel lines." }],
        answer: 0, skill: "Prove lines parallel", hints: ["Which converse uses alternate interior angles?"], why: "Congruent alternate interior angles: the lines are parallel." }
    ]
  });
  /* ============================================================ 3.4 · Slopes of lines */
  var HOW_3_5 = [["Slopes", "Find the slope of each line: rise over run."],
                 ["Compare", "Equal slopes: parallel. Slopes whose product is $-1$: perpendicular."],
                 ["Decide", "If neither is true, the lines are neither parallel nor perpendicular."]];
  // A slope as TeX: rise over run, reduced (3/2, −1/3, 4).
  function slopeTex(dy, dx) {
    function g(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
    if (dx === 0) return null;
    var k = g(dy, dx), p = dy / k, q = dx / k; if (q < 0) { p = -p; q = -q; }
    return q === 1 ? String(p) : (p < 0 ? "-" : "") + "\\frac{" + Math.abs(p) + "}{" + q + "}";
  }
  function slopeKind34(A, B) { var dx = B[0] - A[0], dy = B[1] - A[1]; return dx === 0 ? "undefined" : dy === 0 ? "zero" : (dy / dx > 0 ? "positive" : "negative"); }
  // The second line against a fixed line of slope 1/2.
  function rel34(C, D) {
    var dx = D[0] - C[0], dy = D[1] - C[1];
    if (dx === 0 && dy === 0) return null;
    if (2 * dy === dx) return "parallel";
    if (dx !== 0 && dy / dx * 0.5 === -1) return "perpendicular";
    return "neither";
  }
  LESSONS.push({
    title: "Slopes of lines", art: "slope",
    blurb: "Section 3.4 · Slope as rise over run, and the slopes of parallel and perpendicular lines.",
    mins: 15, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the slope of the line through $(1, 2)$ and $(4, 8)$.", answer: 2, skill: "Slope",
        near: [{ v: 0.5, tol: 1e-9, fb: "Rise over run: the change in $y$ goes on top." }], hints: ["$\\frac{8 - 2}{4 - 1}$."], why: "$\\frac{6}{3} = 2$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag $A$ and $B$ on the grid. The **slope** is rise over run. Find a line with a **positive** slope, a **negative** slope, a slope of **zero**, and one with **no** slope.",
        scene: { type: "sketch", x: [-6, 6], y: [-5, 5], u: 32, gate: true,
          pts: { A: { at: [-3, -2], drag: true, snap: 1, say: "Point A" }, B: { at: [3, 2], drag: true, snap: 1, c: "orange", say: "Point B" } },
          track: function (s) { return samePt(s.A, s.B) ? null : slopeKind34(s.A, s.B); },
          draw: function (s) {
            var k = samePt(s.A, s.B) ? null : slopeKind34(s.A, s.B), col = { positive: "green", negative: "purple", zero: "blue", "undefined": "red" }[k] || "ink";
            return (samePt(s.A, s.B) ? [] : [lineThru(s.A, s.B, col), { steps: [s.A, s.B], c: "orange" }]).concat([{ pt: s.A, name: "A", at: "nw" }, { pt: s.B, name: "B", at: "ne", c: "orange" }]);
          },
          readout: function (s) {
            if (samePt(s.A, s.B)) return "Pull $A$ and $B$ apart.";
            var dx = s.B[0] - s.A[0], dy = s.B[1] - s.A[1], k = slopeKind34(s.A, s.B);
            return (dx === 0 ? "run $= 0$: the line is **vertical**, so its slope is **undefined**." : "$m = \\frac{\\text{rise}}{\\text{run}} = \\frac{" + dy + "}{" + dx + "} = " + slopeTex(dy, dx) + "$ · **" + k + "**") + "<br>" +
              found([["positive", "Positive"], ["negative", "Negative"], ["zero", "Zero"], ["undefined", "Undefined"]], s.tracked);
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        then: "Up to the right is **positive**, down to the right is **negative**. A flat line has slope **0**. A vertical line has run 0, and you cannot divide by 0, so its slope is **undefined**." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue line is fixed. Drag $C$ and $D$ to place a second line. Find one that is **parallel** to it, and one that is **perpendicular**. Compare the **slopes**.",
        scene: { type: "sketch", x: [-6, 6], y: [-5, 5], u: 32, gate: true,
          pts: { C: { at: [-2, 3], drag: true, snap: 1, c: "orange", say: "Point C" }, D: { at: [2, 4], drag: true, snap: 1, c: "orange", say: "Point D" } },
          track: function (s) { return rel34(s.C, s.D); },
          draw: function (s) {
            var r = rel34(s.C, s.D), col = r === "parallel" || r === "perpendicular" ? "green" : "orange";
            return [lineThru([-4, -2], [4, 2], "blue")].concat(samePt(s.C, s.D) ? [] : [lineThru(s.C, s.D, col)]).concat([{ pt: s.C, name: "C", at: "nw", c: "orange" }, { pt: s.D, name: "D", at: "ne", c: "orange" }]);
          },
          readout: function (s) {
            if (samePt(s.C, s.D)) return "Pull $C$ and $D$ apart.";
            var dx = s.D[0] - s.C[0], dy = s.D[1] - s.C[1], r = rel34(s.C, s.D);
            return "blue: $m_1 = \\frac{1}{2}$ · orange: " + (dx === 0 ? "undefined" : "$m_2 = " + slopeTex(dy, dx) + "$") + (dx !== 0 ? " · $m_1 \\cdot m_2 = " + (dy / dx * 0.5 === -1 ? "-1" : n1(dy / dx * 0.5)) + "$" : "") + "<br>" +
              (r === "parallel" ? "**Parallel**: the slopes are equal." : r === "perpendicular" ? "**Perpendicular**: the slopes multiply to $-1$." : "Neither.") + " " + found([["parallel", "Parallel"], ["perpendicular", "Perpendicular"]], s.tracked);
          },
          goal: function (s) { return s.tracked.parallel && s.tracked.perpendicular; } },
        then: "**Parallel** lines have **equal** slopes. **Perpendicular** lines have slopes that are **negative reciprocals**: they multiply to $-1$, like $\\frac{1}{2}$ and $-2$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Slope** is rise over run: $m = \\frac{y_2 - y_1}{x_2 - x_1}$. Two lines that are not vertical are **parallel** exactly when their slopes are equal. They are **perpendicular** exactly when the product of their slopes is $-1$: each slope is the opposite reciprocal of the other.",
        scene: { type: "method", how: HOW_3_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "$A(-2, -1)$, $B(2, 1)$, $C(-1, 3)$ and $D(1, -1)$. Watch $\\overleftrightarrow{AB}$ and $\\overleftrightarrow{CD}$ compared.",
        scene: { type: "walk", how: HOW_3_5, rows: [
          { step: 1, m: "\\frac{1 - (-1)}{2 - (-2)} = \\frac{2}{4} = \\frac{1}{2}", say: "The slope of $\\overleftrightarrow{AB}$.",
            fig: grid([-4, 4], [-3, 4], [{ line: [[-2, -1], [2, 1]], c: "blue" }, { line: [[-1, 3], [1, -1]], c: "green" }, { pt: [-2, -1], name: "A", at: "s" }, { pt: [2, 1], name: "B", at: "s" }, { pt: [-1, 3], name: "C", at: "w" }, { pt: [1, -1], name: "D", at: "e" }], { u: 24, alt: "Line AB rising gently and line CD falling steeply, crossing near the origin." }) },
          { step: 1, m: "\\frac{-1 - 3}{1 - (-1)} = \\frac{-4}{2} = -2", say: "The slope of $\\overleftrightarrow{CD}$." },
          { step: 2, m: "\\frac{1}{2} \\cdot (-2) = -1", say: "The product of the slopes.",
            ask: { prompt: "The slopes are $\\frac{1}{2}$ and $-2$. Are they equal?", answer: 0,
                   options: [{ t: "No, but their product is $-1$" }, { t: "Yes", fb: "One is positive and the other negative." }] } },
          { step: 3, m: "\\overleftrightarrow{AB} \\perp \\overleftrightarrow{CD}", say: "A product of $-1$: the lines are perpendicular." }] },
        gate: true, then: "$-2$ is the opposite reciprocal of $\\frac{1}{2}$: turn it over and change its sign." },
      { type: "guided", kicker: "Together",
        prompt: "One line passes through $(0, 1)$ and $(2, 5)$. Another passes through $(1, -2)$ and $(3, 2)$. Now you compare them.",
        how: HOW_3_5, skill: "Parallel or perpendicular",
        steps: [
          { step: 1, ask: "The slope of the first line: $\\frac{5 - 1}{2 - 0}$.", type: "num", answer: 2, hint: "$\\frac{4}{2}$.",
            m: "\\frac{5 - 1}{2 - 0} = 2", say: "The first slope." },
          { step: 1, ask: "The slope of the second line: $\\frac{2 - (-2)}{3 - 1}$.", type: "num", answer: 2, near: [{ v: 0, fb: "Subtracting $-2$ adds 2: the rise is 4." }], hint: "$\\frac{4}{2}$.",
            m: "\\frac{2 - (-2)}{3 - 1} = 2", say: "The second slope." },
          { step: 2, ask: "Compare the two slopes.", type: "choice", answer: 0,
            options: [{ t: "They are equal" }, { t: "Their product is $-1$", fb: "$2 \\cdot 2 = 4$." }],
            m: "2 = 2", say: "Equal slopes." },
          { step: 3, ask: "So the lines are…", type: "choice", answer: 0,
            options: [{ t: "parallel" }, { t: "perpendicular", fb: "Perpendicular lines have slopes whose product is $-1$." }, { t: "neither", fb: "Equal slopes mean parallel." }],
            m: "\\text{parallel}", say: "Same steepness, same direction." }],
        why: "Slopes, compare, decide. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A line has slope $\\frac{3}{4}$. What is the slope of a line perpendicular to it? (Type a fraction like -2/3.)", answer: -4 / 3, tol: 1e-9, shown: "-4/3", skill: "Perpendicular slopes",
        near: [{ v: 4 / 3, tol: 1e-9, fb: "Turn it over **and** change its sign." }, { v: -0.75, tol: 1e-9, fb: "Change the sign **and** turn it over." }, { v: 0.75, tol: 1e-9, fb: "That is the slope of a parallel line." }],
        hints: ["The opposite reciprocal."], why: "$\\frac{3}{4} \\cdot \\left(-\\frac{4}{3}\\right) = -1$." },
      { type: "choice", prompt: "Two lines have slopes 3 and $\\frac{1}{3}$. What are they?",
        options: [{ t: "Neither parallel nor perpendicular" }, { t: "Perpendicular", fb: "The product is $3 \\cdot \\frac{1}{3} = 1$, not $-1$. One slope would have to be negative." }, { t: "Parallel", fb: "The slopes are not equal." }],
        answer: 0, skill: "Parallel or perpendicular", hints: ["Multiply the slopes."], why: "Not equal, and the product is 1 rather than $-1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Horizontal and vertical lines are the special cases.",
        scene: { type: "walk", how: [["Horizontal", "A horizontal line has no rise: its slope is 0."], ["Vertical", "A vertical line has no run: its slope is undefined."], ["Together", "A horizontal line and a vertical line are perpendicular."]], rows: [
          { step: 1, m: "\\frac{3 - 3}{5 - 1} = \\frac{0}{4} = 0", say: "Through $(1, 3)$ and $(5, 3)$: horizontal, slope 0." },
          { step: 2, m: "\\frac{6 - 1}{2 - 2} = \\frac{5}{0}", say: "Through $(2, 1)$ and $(2, 6)$: vertical. Division by zero, so the slope is undefined." },
          { step: 3, m: "y = 3 \\perp x = 2", say: "The product rule cannot be used here, but the lines plainly meet at a right angle." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A road rises 30 m over a horizontal run of 600 m. What is its slope, as a decimal?", answer: 0.05, tol: 1e-9, skill: "Slope",
        near: [{ v: 20, fb: "Rise over run: $30 \\div 600$." }], hints: ["$\\frac{30}{600}$."], why: "$\\frac{30}{600} = 0.05$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "The slope of the line through $(1, 2)$ and $(4, 7)$. Tap the line where the work **first** goes wrong.",
        lines: ["(1, 2) \\quad (4, 7)", "m = \\frac{4 - 1}{7 - 2}", "m = \\frac{3}{5}"], answer: 1, fix: "m = \\frac{7 - 2}{4 - 1}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Slope",
        hints: ["Which change goes on top?"],
        why: "The rise, the change in $y$, goes on top: $\\frac{5}{3}$." },
      { type: "choice", kicker: "Use it", prompt: "On a city map, Elm Street has slope $\\frac{2}{3}$ and Oak Street has slope $-\\frac{3}{2}$. How do the streets meet?",
        options: [{ t: "At right angles" }, { t: "They never meet", fb: "Parallel streets would have equal slopes." }],
        answer: 0, skill: "Parallel or perpendicular", hints: ["Multiply the slopes."], why: "$\\frac{2}{3} \\cdot \\left(-\\frac{3}{2}\\right) = -1$: perpendicular." }
    ]
  });
  /* ====================================================== 3.5 · Equations of lines */
  var HOW_3_6 = [["Slope", "Find the slope $m$ of the line."],
                 ["Point", "Pick a point on it: the $y$-intercept if you know it, or any point $(x_1, y_1)$."],
                 ["Equation", "Write $y = mx + b$, or $y - y_1 = m(x - x_1)$."]];
  LESSONS.push({
    title: "Equations of lines", art: "eqn",
    blurb: "Section 3.5 · Slope-intercept and point-slope form, and the equations of parallel and perpendicular lines.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In $y = 3x - 2$, which number is the slope?",
        options: [{ t: "$3$" }, { t: "$-2$", fb: "That is the $y$-intercept: where the line crosses the $y$-axis." }],
        answer: 0, skill: "Slope-intercept form", hints: ["The slope multiplies $x$."], why: "In $y = mx + b$, the slope is $m$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the **slope** $m$ and the **intercept** $b$ until the line passes through **both** marked points, $P$ and $Q$.",
        scene: { type: "plane", x: [-6, 6], y: [-4, 6], grid: 1, gate: true,
          params: { m: { v: 1, min: -3, max: 3, step: 0.5, label: "slope $m$" }, b: { v: -1, min: -4, max: 5, step: 1, label: "intercept $b$" } },
          fns: [{ f: "m*x + b", color: "blue" }], marks: [{ x: -2, y: 3, label: "P", color: "orange" }, { x: 4, y: 0, label: "Q", color: "orange" }],
          readout: function (st) { var m = st.params.m, b = st.params.b; return "$y = " + (m === 1 ? "" : m === -1 ? "-" : num(m)) + "x " + (b < 0 ? "- " + Math.abs(b) : "+ " + b) + "$"; },
          goal: function (st) { return st.params.m === -0.5 && st.params.b === 2; } },
        then: "The line $y = -\\frac{1}{2}x + 2$ goes through both. The slope $-\\frac{1}{2}$ says: down 1 for every 2 across. The intercept 2 says: it crosses the $y$-axis at 2. That is **slope-intercept form**, $y = mx + b$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Slope-intercept form** is $y = mx + b$: slope $m$ and $y$-intercept $b$. **Point-slope form** is $y - y_1 = m(x - x_1)$: slope $m$ through the point $(x_1, y_1)$. Two lines with the same slope are parallel, unless they also share an intercept: then they are one line.",
        scene: { type: "method", how: HOW_3_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the equation of the line through $(2, 1)$ and $(4, 5)$ written.",
        scene: { type: "walk", how: HOW_3_6, rows: [
          { step: 1, m: "m = \\frac{5 - 1}{4 - 2} = 2", say: "Rise 4, run 2.",
            fig: grid([-2, 6], [-4, 6], [{ line: [[2, 1], [4, 5]], c: "blue" }, { pt: [2, 1], name: "(2, 1)", at: "e" }, { pt: [4, 5], name: "(4, 5)", at: "e" }], { u: 22, alt: "The line through (2, 1) and (4, 5)." }) },
          { step: 2, m: "(2, 1)", say: "Either point will do." },
          { step: 3, m: "y - 1 = 2(x - 2)", say: "Point-slope form.",
            ask: { prompt: "In $y - y_1 = m(x - x_1)$, which number goes with $y$?", answer: 0,
                   options: [{ t: "$y_1 = 1$" }, { t: "$x_1 = 2$", fb: "$x_1$ goes with $x$, inside the parentheses." }] } },
          { step: 3, m: "y = 2x - 3", say: "Distribute, then add 1: slope-intercept form." }] },
        gate: true, then: "Two forms, one line. Point-slope is quick to write. Slope-intercept is quick to graph." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write the equation of the line with slope 3 through $(-1, 2)$.",
        how: HOW_3_6, skill: "Equation of a line",
        steps: [
          { step: 1, ask: "What is $m$?", type: "num", answer: 3, hint: "The slope is given.",
            m: "m = 3", say: "The slope." },
          { step: 2, ask: "What are $x_1$ and $y_1$?", type: "choice", answer: 0,
            options: [{ t: "$x_1 = -1$ and $y_1 = 2$" }, { t: "$x_1 = 2$ and $y_1 = -1$", fb: "$x$ comes first in $(-1, 2)$." }],
            m: "(-1, 2)", say: "The point." },
          { step: 3, ask: "Which is the point-slope form?", type: "choice", answer: 0,
            options: [{ t: "$y - 2 = 3(x + 1)$" }, { t: "$y + 2 = 3(x - 1)$", fb: "Subtracting $-1$ gives $x + 1$, and $y_1 = 2$ gives $y - 2$." }],
            m: "y - 2 = 3(x + 1)", say: "$x - (-1)$ is $x + 1$." },
          { step: 3, ask: "And in slope-intercept form?", type: "choice", answer: 0,
            options: [{ t: "$y = 3x + 5$" }, { t: "$y = 3x + 1$", fb: "$3 \\cdot 1 = 3$, and then add 2: 5." }, { t: "$y = 3x - 1$", fb: "Distribute to get $3x + 3$, then add 2." }],
            m: "y = 3x + 5", say: "$3x + 3 + 2$." }],
        why: "Slope, point, equation. Now two on your own." },
      { type: "plane", kicker: "On your own", prompt: "Graph $y = -\\frac{1}{2}x + 3$. Drag $A$ and $B$ onto two of its points.",
        x: [-6, 6], y: [-6, 6],
        points: [{ id: "A", x: -3, y: -2, drag: true, label: "A" }, { id: "B", x: 3, y: 3, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        check: function (st) { return onLine(st, "A", "B", -0.5, 3) ? { ok: true } : { ok: false, say: "Start at the intercept $(0, 3)$. A slope of $-\\frac{1}{2}$ means down 1 for every 2 to the right." }; },
        answer: { points: { A: [0, 3], B: [2, 2] } }, skill: "Graph a line",
        hints: ["The intercept is $(0, 3)$. From there go 2 right and 1 down."], why: "$(0, 3)$, then $(2, 2)$, then $(4, 1)$." },
      { type: "sort", prompt: "Parallel, intersecting, or the same line?",
        bins: ["Parallel", "Intersecting", "The same line"],
        cards: [{ t: two("y = 2x + 1", "y = 2x - 4"), bin: 0, fb: "The same slope, different intercepts." },
                { t: two("y = 3x", "y = -3x + 2"), bin: 1, fb: "Different slopes: they cross once." },
                { t: two("y = x + 2", "2y = 2x + 4"), bin: 2, fb: "Divide the second by 2: it is $y = x + 2$ again." },
                { t: two("y = \\frac{1}{2}x", "y = 2x"), bin: 1, fb: "Different slopes: they cross once." }],
        skill: "Classify pairs of lines", hints: ["Compare the slopes first, then the intercepts."],
        why: "Same slope and different intercepts: parallel. Same slope and same intercept: one line. Different slopes: they cross." },
      { type: "learn", kicker: "A harder case",
        prompt: "When neither equation is solved for $y$, do that first. Classify $3x + y = 5$ and $6x + 2y = 4$.",
        scene: { type: "walk", how: [["Solve for y", "Write each equation in slope-intercept form."], ["Slopes", "Compare the slopes."], ["Intercepts", "If the slopes are equal, compare the intercepts."]], rows: [
          { step: 1, m: "y = -3x + 5 \\qquad y = -3x + 2", say: "Subtract $3x$ in the first. Subtract $6x$ and divide by 2 in the second." },
          { step: 2, m: "-3 = -3", say: "The same slope." },
          { step: 3, m: "5 \\ne 2", say: "Different intercepts." },
          { step: 3, m: "\\text{parallel}", say: "Same slope, different intercepts: they never meet." }] },
        gate: true },
      { type: "equation", kicker: "Try it", prompt: "Write the equation of the line with slope 4 and $y$-intercept $-1$.",
        answer: "y=4x-1", shown: "y = 4x - 1", skill: "Equation of a line",
        near: [{ v: "y=-x+4", fb: "The slope multiplies $x$, and the intercept stands alone." }, { v: "y=4x+1", fb: "The intercept is $-1$." }],
        hints: ["$y = mx + b$ with $m = 4$ and $b = -1$."], why: "$y = 4x - 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For the line with slope 5 through $(3, 2)$, Di writes $y - 3 = 5(x - 2)$. What is wrong?",
        options: [{ t: "$x_1$ and $y_1$ are swapped: it is $y - 2 = 5(x - 3)$." },
                  { t: "The slope should be $\\frac{1}{5}$.", fb: "The slope is given as 5." },
                  { t: "Nothing. It is right.", fb: "Test the point $(3, 2)$ in her equation: $2 - 3 = 5(3 - 2)$ is false." }],
        answer: 0, skill: "Equation of a line", hints: ["Which coordinate goes with $y$?"], why: "$y_1 = 2$ goes with $y$, and $x_1 = 3$ goes with $x$." },
      { type: "num", kicker: "Use it", prompt: "One gym costs \\$30 a month plus \\$5 a class: $y = 5x + 30$. Another costs \\$8 a class: $y = 8x$. After how many classes do they cost the same?",
        post: "classes", answer: 10, skill: "Lines in use",
        near: [{ v: 30 / 13, tol: 1e-2, fb: "Set them equal and subtract $5x$: $30 = 3x$." }], hints: ["$5x + 30 = 8x$."], why: "$30 = 3x$, so $x = 10$." }
    ]
  });
  /* ================================================= 3.6 · Perpendicular lines */
  var HOW_3_6 = [["Mark", "Mark the right angles, and the lines you are told are perpendicular."],
                 ["Reason", "A right angle is 90°. A linear pair adds to 180°. Two perpendicular lines make four right angles."],
                 ["Solve", "Subtract from 90° or 180° to find the angle that is missing."]];
  var FIG_RT36 = rayFig([0, 0], [{ d: 0, name: "C" }, { d: 38, name: "D" }, { d: 90, name: "A" }], { vname: "B", wedges: [{ i: 0, j: 1, say: "(3x + 6)°", c: "green", r: 40 }, { i: 1, j: 2, say: "(5x − 12)°", r: 54 }],
    alt: "Rays BC, BD and BA from B. Angle CBA is a right angle, and ray BD cuts it into two parts marked (3x + 6) and (5x − 12) degrees." });
  LESSONS.push({
    title: "Perpendicular lines", art: "perp",
    blurb: "Section 3.6 · Congruent linear pairs, the four right angles that perpendicular lines make, and complementary angles.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Two angles form a linear pair, and the two angles are **congruent**. How many degrees does each measure?", post: "°", answer: 90, skill: "Perpendicular lines",
        near: [{ v: 180, fb: "180° is the sum of the two. Each one is half of it." }, { v: 45, fb: "A linear pair adds to 180°, not 90°." }], hints: ["The pair adds to 180°, and the two halves are equal."], why: "$180 \\div 2 = 90$." },
      { type: "learn", kicker: "Explore",
        prompt: "Turn the orange line until the two angles of the **linear pair**, $\\angle 1$ and $\\angle 2$, are **congruent**. What do you notice about all four angles?",
        scene: { type: "sketch", x: [-3.7, 3.7], y: [-3.2, 3.2], u: 50, grid: false, gate: true,
          pts: { H: { at: GT.polar([0, 0], 2.7, 58), drag: true, c: "orange", on: { circle: [[0, 0], 2.7], snapDeg: 1, range: [25, 155] }, say: "The turning line" } },
          draw: function (s) {
            var O = [0, 0], a = Math.round(GT.dir(O, s.H)), eq = a === 90, c1 = eq ? "green" : "blue", c2 = eq ? "green" : "purple";
            return [{ angle: [[1, 0], O, GT.polar(O, 1, a)], say: a + "°", r: 40, c: c1, right: eq }, { angle: [GT.polar(O, 1, a), O, [-1, 0]], say: (180 - a) + "°", r: 40, c: c2, right: eq },
              { angle: [[-1, 0], O, GT.polar(O, 1, a + 180)], say: a + "°", r: 40, c: c1, right: eq }, { angle: [GT.polar(O, 1, a + 180), O, [1, 0]], say: (180 - a) + "°", r: 40, c: c2, right: eq },
              { dline: [[-3.2, 0], [3.2, 0]] }, { dline: [GT.polar(O, 2.9, a + 180), GT.polar(O, 2.9, a)], c: eq ? "green" : "orange" }, { pt: O }];
          },
          readout: function (s) {
            var a = Math.round(GT.dir([0, 0], s.H));
            return a === 90 ? "$90° = 90°$: the linear pair is **congruent**, and **all four** angles are right angles. The lines are **perpendicular**." : "$m\\angle 1 = " + a + "°$ and $m\\angle 2 = " + (180 - a) + "°$: not equal yet.";
          },
          goal: function (s) { return Math.round(GT.dir([0, 0], s.H)) === 90; } },
        then: "A linear pair adds to 180°. If its two angles are congruent, each is **90°**. And then the vertical angles are 90° too: perpendicular lines make **four right angles**." },
      { type: "learn", kicker: "The idea",
        prompt: "Lines that meet at a right angle are **perpendicular**, written $ℓ \\perp m$. A linear pair adds to 180°, so if its two angles are congruent they are each 90°. That makes all four angles right angles. Adjacent angles whose outer sides are perpendicular are **complementary**.",
        scene: { type: "method", how: HOW_3_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "$\\overrightarrow{BA} \\perp \\overrightarrow{BC}$, and ray $\\overrightarrow{BD}$ is inside the right angle. $m\\angle CBD = (3x + 6)°$ and $m\\angle DBA = (5x - 12)°$. Watch $x$ found.", art: FIG_RT36,
        scene: { type: "walk", how: HOW_3_6, rows: [
          { step: 1, m: "\\angle CBA = 90°", say: "$\\overrightarrow{BA}$ and $\\overrightarrow{BC}$ are perpendicular, so the angle between them is a right angle." },
          { step: 2, m: "(3x + 6) + (5x - 12) = 90", say: "The two parts add up to the right angle: they are complementary.",
            ask: { prompt: "What do the two parts add up to?", answer: 0, options: [{ t: "90°: the right angle" }, { t: "180°", fb: "That is a straight angle. This is a right angle." }] } },
          { step: 3, m: "8x - 6 = 90", say: "Combine like terms." },
          { step: 3, m: "x = 12", say: "$8x = 96$. So $m\\angle CBD = 3(12) + 6 = 42°$ and $m\\angle DBA = 48°$." }] },
        gate: true, then: "Check: $42 + 48 = 90$." },
      { type: "guided", kicker: "Together",
        prompt: "Lines $ℓ$ and $m$ are perpendicular. One of the four angles measures $(4x - 10)°$. Now you find $x$.",
        how: HOW_3_6, skill: "Perpendicular lines",
        steps: [
          { step: 1, ask: "What can you say about all four angles?", type: "choice", answer: 0,
            options: [{ t: "Each is a right angle" }, { t: "Two are right and two are acute", fb: "A linear pair of congruent angles is 90° + 90°. The vertical angles then match." }],
            m: "ℓ \\perp m", say: "Perpendicular lines make four right angles." },
          { step: 2, ask: "Which equation says $(4x - 10)°$ is a right angle?", type: "choice", answer: 0,
            options: [{ t: "$4x - 10 = 90$" }, { t: "$4x - 10 = 180$", fb: "180° is a straight angle, not a right angle." }],
            m: "4x - 10 = 90", say: "A right angle is 90°." },
          { step: 3, ask: "Solve it. What is $x$?", type: "num", answer: 25, near: [{ v: 20, fb: "Add 10 first: $4x = 100$." }], hint: "$4x = 100$.",
            m: "x = 25", say: "$4x = 100$, so $x = 25$." }],
        why: "Mark, reason, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$\\angle 1$ and $\\angle 2$ are a congruent linear pair, and $m\\angle 1 = (6x + 6)°$. Find $x$.", answer: 14, skill: "Perpendicular lines",
        near: [{ v: 16, fb: "The pair is congruent, so each angle is 90°, not 180°." }], hints: ["Each angle is 90°: $6x + 6 = 90$."], why: "$6x = 84$, so $x = 14$." },
      { type: "num", prompt: "A wall meets the floor at a right angle. A brace makes a 35° angle with the floor. What angle does it make with the wall?", post: "°", answer: 55, skill: "Perpendicular lines",
        near: [{ v: 145, fb: "That is the supplement of 35°. The wall and the floor make a right angle, so the two angles are complementary." }], hints: ["The brace splits the 90° angle between the wall and the floor."], why: "$90 - 35 = 55$." },
      { type: "learn", kicker: "A harder case",
        prompt: "$ℓ \\perp m$ at $O$. A line $n$ through $O$ makes a 28° angle with $ℓ$. Watch all the angles round $O$ found.",
        scene: { type: "walk", how: HOW_3_6, rows: [
          { step: 1, m: "ℓ \\perp m", say: "Four right angles round $O$, and $n$ cuts two of them." },
          { step: 2, m: "90° - 28° = 62°", say: "$n$ cuts a right angle in two parts, so they are complementary.",
            ask: { prompt: "What is the other part of that right angle?", answer: 0, options: [{ t: "62°" }, { t: "152°", fb: "That is the supplement of 28°. Here the two parts fill a **right** angle." }] } },
          { step: 3, m: "28° \\quad 62° \\quad 28° \\quad 62°", say: "Vertical angles are congruent, so the same two numbers repeat on the other side of $m$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Two lines cross and form a linear pair of **congruent** angles. What must be true of the lines?",
        options: [{ t: "They are perpendicular" }, { t: "They are parallel", fb: "Parallel lines never cross." }, { t: "Nothing", fb: "Congruent angles in a linear pair are each 90°, which is exactly what perpendicular means." }],
        answer: 0, skill: "Perpendicular lines", hints: ["What is each angle?"], why: "Each angle is 90°, so the lines are perpendicular." },
      { type: "choice", kicker: "Find the error",
        prompt: "Eli says: “$\\angle 1$ and $\\angle 2$ are a linear pair, so each must be 90°.” What is wrong?",
        options: [{ t: "A linear pair adds to 180°, but the angles are 90° each only when they are congruent." }, { t: "A linear pair adds to 90°.", fb: "A linear pair adds to 180°." }, { t: "Nothing. It is right.", fb: "A 50° angle and a 130° angle are a linear pair too." }],
        answer: 0, skill: "Perpendicular lines", hints: ["Could the two angles be 50° and 130°?"], why: "Only a congruent linear pair is a pair of right angles." },
      { type: "num", kicker: "Use it", prompt: "Two streets cross at right angles. A diagonal lane cuts the corner and makes a 40° angle with one street. What angle does it make with the other?", post: "°", answer: 50, skill: "Perpendicular lines",
        near: [{ v: 140, fb: "That is the supplement. The two streets are perpendicular, so the lane splits a 90° corner." }], hints: ["The lane splits a right angle."], why: "$90 - 40 = 50$." }
    ]
  });
  /* ================================================ 3.7 · Perpendicular transversals */
  var HOW_3_4 = [["Mark", "Mark the right angles and the parallel lines that the given facts give you."],
                 ["Theorem", "Use the fact that fits: the perpendicular segment is the shortest, or a transversal perpendicular to one parallel line is perpendicular to the other."],
                 ["Solve", "Write the equation or the inequality, and solve."]];
  function dropFig(o) {
    o = o || {};
    return plain([0, 8], [-0.9, 4], [{ dline: [[0.4, 0], [7.6, 0]] }, { seg: [[4, 3], [1.4, 0]], c: "soft" }, { seg: [[4, 3], [4, 0]], c: "blue" }, { seg: [[4, 3], [6.4, 0]], c: "soft" },
      { pt: [4, 3], name: "P", at: "n" }, { pt: [1.4, 0], name: "A", at: "s" }, { pt: [4, 0], name: "B", at: "s" }, { pt: [6.4, 0], name: "C", at: "s" },
      { angle: [[6.4, 0], [4, 0], [4, 3]], right: true, c: "orange" }, { word: "ℓ", at: [7.5, 0.4], name: true }]
      .concat(o.pb ? [{ word: o.pb, at: [4.5, 1.5], c: "blue" }] : []).concat(o.pa ? [{ word: o.pa, at: [2.05, 1.8], c: "soft" }] : []),
      { u: 40, alt: o.alt || "A point P above line ℓ, with three segments down to the line: PA and PC slanted, and PB meeting the line at a right angle." });
  }
  LESSONS.push({
    title: "Perpendicular transversals", art: "perpt",
    blurb: "Section 3.7 · A transversal perpendicular to one of two parallel lines is perpendicular to the other, and the distance to a line.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Three segments run from $P$ to line $ℓ$. Which one is the shortest?", art: dropFig(),
        options: [{ t: "$\\overline{PB}$" }, { t: "$\\overline{PA}$", fb: "It slants, so it has further to go." }, { t: "$\\overline{PC}$", fb: "It slants, so it has further to go." }],
        answer: 0, skill: "Distance to a line", hints: ["Which one goes straight down?"], why: "The segment that meets the line at a right angle is the shortest." },
      { type: "learn", kicker: "Explore",
        prompt: "Turn the transversal until it is **perpendicular** to $ℓ$. Is it then perpendicular to $m$? Try it with $ℓ \\parallel m$, then press the other button and try again.",
        scene: { type: "sketch", x: [0, 8.4], y: [-1.5, 3.9], u: 54, grid: false, gate: true,
          pts: { H: { at: GT.polar(B8, 1.9, 62), drag: true, c: "orange", on: { circle: [B8, 1.9], snapDeg: 1, range: [28, 152] }, say: "The transversal" } },
          chips: { lines: { v: "par", opts: [["par", "ℓ ∥ m"], ["tilt", "m is tilted"]] } },
          track: function (s) { var t = Math.round(GT.dir(B8, s.H)); return t === 90 ? (s.c.lines === "par" ? "both" : "one") : null; },
          draw: function (s) {
            var t = Math.round(GT.dir(B8, s.H)), phi = s.c.lines === "par" ? 0 : 12, A = crossA8(t), items = draw8(t, phi, [], { mc: phi ? "red" : "ink" });
            items.push({ angle: [GT.polar(A, 1, 0), A, GT.polar(A, 1, t)], say: t + "°", r: 22, right: t === 90, c: t === 90 ? "green" : "orange" },
              { angle: [GT.polar(B8, 1, phi), B8, GT.polar(B8, 1, t)], say: (t - phi) + "°", r: 22, right: t - phi === 90, c: t - phi === 90 ? "green" : "orange" });
            return items;
          },
          readout: function (s) {
            var t = Math.round(GT.dir(B8, s.H)), phi = s.c.lines === "par" ? 0 : 12;
            return "The transversal meets $ℓ$ at $" + t + "°$ and meets $m$ at $" + (t - phi) + "°$" + (t === 90 ? (phi === 0 ? ": **both** are right angles." : ": a right angle at $ℓ$, but **not** at $m$, because $m$ is tilted.") : ".") + "<br>" +
              found([["both", "Perpendicular to both (parallel lines)"], ["one", "Perpendicular to one only (tilted)"]], s.tracked);
          },
          goal: function (s) { return s.tracked.both && s.tracked.one; } },
        then: "If $ℓ \\parallel m$ and a transversal is perpendicular to **one** of them, it is perpendicular to **both**. The parallel lines are the reason: tilt $m$ and it stops working." },
      { type: "learn", kicker: "Explore", prompt: "**Drag** $X$ along the line and watch the length $PX$. Where is it least?",
        scene: { type: "sketch", x: [-0.4, 8.4], y: [-1, 4], grid: false, u: 46, gate: true,
          pts: { X: { at: [1.5, 0], drag: true, snap: 0.5, c: "orange", on: { seg: [[0.5, 0], [7.5, 0]] }, say: "Point X" } },
          draw: function (s) {
            var P = [4, 3], X = s.X, foot = Math.abs(X[0] - 4) < 1e-9;
            return [{ dline: [[0, 0], [8, 0]] }, { seg: [P, X], c: foot ? "green" : "orange" }, { len: num(Math.round(GT.dist(P, X) * 10) / 10), seg: [P, X], side: X[0] < 4 ? 1 : -1, c: foot ? "green" : "orange" },
              { pt: P, name: "P", at: "n" }, { pt: X, name: "X", at: "s", c: "orange" }].concat(foot ? [{ angle: [[8, 0], X, P], right: true, c: "green" }] : []);
          },
          readout: function (s) { var d = Math.round(GT.dist([4, 3], s.X) * 10) / 10; return "$PX = " + num(d) + "$" + (Math.abs(s.X[0] - 4) < 1e-9 ? " — the least it can be, and $\\overline{PX} \\perp ℓ$" : ""); } },
        gate: true,
        after: "The length is least exactly when the segment is perpendicular to the line." },
      { type: "learn", kicker: "The idea",
        prompt: "The **distance from a point to a line** is the length of the perpendicular segment from the point to the line: the shortest way there. The **perpendicular bisector** of a segment is the line perpendicular to it at its midpoint.",
        scene: { type: "method", how: HOW_3_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "$\\overline{PB} \\perp ℓ$, $PB = 12$ and $PA = x - 8$. Watch the possible values of $x$ found.",
        scene: { type: "walk", how: HOW_3_4, rows: [
          { step: 1, m: "\\overline{PB} \\perp ℓ", say: "$\\overline{PB}$ is the perpendicular segment.", fig: dropFig({ pb: "12", pa: "x − 8" }) },
          { step: 2, m: "PB < PA", say: "The perpendicular segment is shorter than any other.",
            ask: { prompt: "Which segment from $P$ to the line is the shortest?", answer: 0,
                   options: [{ t: "The perpendicular one, $\\overline{PB}$" }, { t: "$\\overline{PA}$", fb: "$\\overline{PA}$ slants, so it is longer." }] } },
          { step: 3, m: "12 < x - 8", say: "Put in the lengths." },
          { step: 3, m: "x > 20", say: "Add 8 to both sides." }] },
        gate: true, then: "An inequality, not an equation: all we know is that the slanted segment is longer." },
      { type: "guided", kicker: "Together",
        prompt: "$ℓ \\parallel m$ and $t \\perp ℓ$. The angle where $t$ meets $m$ measures $(4x + 10)°$. Now you find $x$.",
        how: HOW_3_4, skill: "Perpendicular Transversal Theorem",
        steps: [
          { step: 1, ask: "What is the measure of each angle where $t$ meets $ℓ$?", type: "num", answer: 90, hint: "Perpendicular lines.",
            m: "t \\perp ℓ \\qquad ℓ \\parallel m", say: "The given facts: a right angle, and parallel lines." },
          { step: 2, ask: "A transversal perpendicular to one of two parallel lines is…", type: "choice", answer: 0,
            options: [{ t: "perpendicular to the other one too" }, { t: "parallel to the other one", fb: "It crosses both lines, at the same angle." }],
            m: "t \\perp m", say: "Perpendicular Transversal Theorem." },
          { step: 3, ask: "So $4x + 10 = 90$. What is $x$?", type: "num", answer: 20, near: [{ v: 25, fb: "Subtract 10 first: $4x = 80$." }], hint: "$4x = 80$.",
            m: "x = 20", say: "$4x = 80$." }],
        why: "Mark, theorem, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "The perpendicular segment from $P$ to a line is 9 cm long. Another segment from $P$ to the line has length $2x + 1$. Solve $2x + 1 > 9$.", pre: "$x >$", answer: 4, skill: "Distance to a line",
        near: [{ v: 5, fb: "Subtract 1 first: $2x > 8$." }], hints: ["$2x > 8$."], why: "$2x > 8$, so $x > 4$." },
      { type: "choice", prompt: "In a plane, two lines are each perpendicular to the same line. What must be true of them?",
        options: [{ t: "They are parallel to each other" }, { t: "They are perpendicular to each other", fb: "Each makes a right angle with the third line, so they run the same way." }],
        answer: 0, skill: "Perpendicular lines", hints: ["Both make 90° corresponding angles with the third line."], why: "Congruent corresponding angles: the lines are parallel." },
      { type: "learn", kicker: "A harder case",
        prompt: "The perpendicular bisector of a segment can be constructed with a compass.",
        scene: { type: "walk", how: [["Arcs", "From one endpoint, draw arcs above and below the segment, with an opening more than half its length."], ["Again", "With the same opening, do the same from the other endpoint."], ["Line", "Draw the line through the two points where the arcs cross."]], rows: [
          { step: 1, say: "Arcs centred on $X$, above and below.", fig: consBisectSeg(1) },
          { step: 2, say: "The same opening from $Y$. The arcs cross at $P$ and at $Q$.", fig: consBisectSeg(2) },
          { step: 3, m: "\\overleftrightarrow{PQ} \\perp \\overline{XY}", say: "The line through $P$ and $Q$ meets $\\overline{XY}$ at its midpoint $M$, at a right angle.", fig: consBisectSeg(3) }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Two lines cross and form a linear pair of **congruent** angles. What must the lines be?",
        options: [{ t: "Perpendicular" }, { t: "Parallel", fb: "They cross, so they are not parallel." }],
        answer: 0, skill: "Perpendicular lines", hints: ["A linear pair adds to 180°. If the two angles are equal, what is each?"], why: "Each angle is 90°, so the lines are perpendicular." },
      { type: "choice", kicker: "Find the error",
        prompt: "$PA = 7$ and $PB = 5$. Sam says the distance from $P$ to line $ℓ$ is 7. What is wrong?", art: dropFig({ pb: "5", pa: "7" }),
        options: [{ t: "The distance is measured along the perpendicular segment: it is 5." },
                  { t: "The distance is $7 + 5 = 12$.", fb: "Distance to a line is one segment, the perpendicular one." },
                  { t: "Nothing. It is right.", fb: "$\\overline{PA}$ slants. The distance is the shortest length." }],
        answer: 0, skill: "Distance to a line", hints: ["Which segment meets the line at a right angle?"], why: "$\\overline{PB} \\perp ℓ$, so the distance is $PB = 5$." },
      { type: "choice", kicker: "Use it", prompt: "A swimmer wants the shortest path to a straight shoreline. Which way should she swim?",
        options: [{ t: "Perpendicular to the shoreline" }, { t: "Parallel to the shoreline", fb: "Then she never reaches it." }, { t: "At 45° to the shoreline", fb: "A slanted path is longer than the perpendicular one." }],
        answer: 0, skill: "Distance to a line", hints: ["The shortest segment from a point to a line."], why: "The perpendicular segment is the shortest." }
    ]
  });
  /* ============================================ 3.8 · Non-Euclidean geometry */
  var HOW_3_8 = [["Blocks", "A taxi drives along the grid, not through buildings. Count the blocks across and the blocks up."],
                 ["Add", "Add the two counts: $|x_2 - x_1| + |y_2 - y_1|$."],
                 ["Compare", "Straight-line distance is never longer than taxicab distance."]];
  function taxi38(A, B) { return Math.abs(B[0] - A[0]) + Math.abs(B[1] - A[1]); }
  LESSONS.push({
    title: "Non-Euclidean geometry", art: "noneu",
    blurb: "Section 3.8 · A different geometry: distance counted in blocks, the way a taxi drives. Midpoints and circles change too.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A taxi drives 3 blocks east and then 4 blocks north. How many blocks does it drive?", answer: 7, skill: "Taxicab distance",
        near: [{ v: 5, fb: "5 is the straight-line distance, which a taxi cannot drive through the buildings." }, { v: 12, fb: "Add the blocks. Do not multiply." }], hints: ["Blocks across plus blocks up."], why: "$3 + 4 = 7$ blocks." },
      { type: "learn", kicker: "Explore",
        prompt: "A taxi can only drive along the streets. Drag $A$ and $B$. Compare the **taxi route** with the **straight line**. When are they the same length?",
        scene: { type: "sketch", x: [-6, 6], y: [-5, 5], u: 32, gate: true,
          pts: { A: { at: [-4, -3], drag: true, snap: 1, say: "Point A" }, B: { at: [3, 2], drag: true, snap: 1, c: "orange", say: "Point B" } },
          track: function (s) { var d = taxi38(s.A, s.B); return d === 0 ? null : (s.A[0] === s.B[0] || s.A[1] === s.B[1] ? "same" : "longer"); },
          draw: function (s) {
            return [{ seg: [s.A, s.B], c: "blue", dash: true }, { path: [s.A, [s.B[0], s.A[1]], s.B], c: "orange" }, { pt: s.A, name: "A", at: "nw" }, { pt: s.B, name: "B", at: "ne", c: "orange" }];
          },
          readout: function (s) {
            var dx = Math.abs(s.B[0] - s.A[0]), dy = Math.abs(s.B[1] - s.A[1]), t = dx + dy, e = Math.sqrt(dx * dx + dy * dy);
            return "taxi: $" + dx + " + " + dy + " = " + t + "$ blocks · straight line: $\\approx " + n1(e) + "$" + (t === 0 ? "" : "<br>" + (dx === 0 || dy === 0 ? "**The same**: the points are in line with a street." : "The taxi drives **further**.") +
              " " + found([["same", "Same length"], ["longer", "Taxi is longer"]], s.tracked));
          },
          log: { need: 3, cols: [{ h: "across", f: function (s) { return "$" + Math.abs(s.B[0] - s.A[0]) + "$"; } }, { h: "up", f: function (s) { return "$" + Math.abs(s.B[1] - s.A[1]) + "$"; } },
                                 { h: "taxi", f: function (s) { return "$" + taxi38(s.A, s.B) + "$"; } }, { h: "straight", f: function (s) { return "$" + n1(Math.sqrt(sq(s.B[0] - s.A[0]) + sq(s.B[1] - s.A[1]))) + "$"; } }] },
          goal: function (s) { return s.tracked.same && s.tracked.longer; } },
        then: "**Taxicab distance** is the blocks across plus the blocks up. It is never shorter than the straight line, and equal to it only when the points line up with a street." },
      { type: "learn", kicker: "Explore",
        prompt: "A **taxicab circle** is every point the same taxi distance from the centre. Slide the radius, and look at its **shape**.",
        scene: { type: "sketch", x: [-6.5, 6.5], y: [-6, 6], u: 28, gate: true,
          params: { r: { min: 1, max: 5, step: 1, v: 2, label: "radius $r$" } },
          track: function (s) { return "r" + s.p.r; },
          draw: function (s) {
            var r = s.p.r, items = [{ path: [[r, 0], [0, r], [-r, 0], [0, -r]], closed: true, fill: true, c: "purple" }, { pt: [0, 0], name: "C", at: "s", c: "orange" }], x, y;
            for (x = -r; x <= r; x++) { y = r - Math.abs(x); items.push({ pt: [x, y], c: "purple", r: 3.6 }); if (y) items.push({ pt: [x, -y], c: "purple", r: 3.6 }); }
            return items;
          },
          readout: function (s) { return "Every point on the **diamond** is $" + s.p.r + "$ blocks from $C$ by taxi: there are $" + 4 * s.p.r + "$ grid points on it."; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        then: "In taxicab geometry a circle is a **diamond**. It is a different geometry: the same words (distance, circle) mean something different, so the theorems change too." },
      { type: "learn", kicker: "The idea",
        prompt: "Not every geometry is the one in this book. In **taxicab geometry** the distance between two points is the blocks across plus the blocks up. A **taxicab circle** is a diamond, and a segment can have more than one **midpoint**. Euclid's geometry is not wrong: it answers a different question.",
        scene: { type: "method", how: HOW_3_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the taxicab distance from $(-2, 1)$ to $(3, -3)$ found, and compared with the straight line.",
        scene: { type: "walk", how: HOW_3_8, rows: [
          { step: 1, m: "3 - (-2) = 5 \\qquad -3 - 1 = -4", say: "5 blocks across, and 4 blocks down.",
            fig: grid([-4, 5], [-5, 3], [{ path: [[-2, 1], [3, 1], [3, -3]], c: "orange" }, { seg: [[-2, 1], [3, -3]], c: "blue", dash: true }, { pt: [-2, 1], name: "A", at: "nw" }, { pt: [3, -3], name: "B", at: "ne" }], { u: 30, alt: "A at (−2, 1) and B at (3, −3). The taxi route goes 5 across then 4 down. The straight line is dashed." }) },
          { step: 2, m: "|5| + |-4| = 9", say: "Drop the minus sign, then add.",
            ask: { prompt: "Why drop the minus sign?", answer: 0, options: [{ t: "Blocks driven are counted as positive" }, { t: "Because 4 is smaller", fb: "A distance is never negative, whichever way the taxi goes." }] } },
          { step: 3, m: "\\sqrt{5^2 + 4^2} = \\sqrt{41} \\approx 6.4", say: "The straight line is shorter: 6.4 against 9." }] },
        gate: true, then: "$6.4 \\le 9$: straight-line distance is never longer." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the taxicab distance from $P(1, 2)$ to $Q(5, 7)$.",
        how: HOW_3_8, skill: "Taxicab distance",
        steps: [
          { step: 1, ask: "How many blocks **across**?", type: "num", answer: 4, near: [{ v: 6, fb: "Subtract the $x$-values: $5 - 1$." }], hint: "$5 - 1$.",
            m: "5 - 1 = 4", say: "4 blocks across." },
          { step: 2, ask: "How many blocks **up**? Then what is the taxicab distance?", type: "num", answer: 9, near: [{ v: 5, fb: "5 blocks up. Now add the 4 across." }, { v: 20, fb: "Add the two counts. Do not multiply." }], hint: "$4 + 5$.",
            m: "4 + 5 = 9", say: "5 blocks up: $4 + 5 = 9$ blocks." },
          { step: 3, ask: "The straight-line distance is $\\sqrt{4^2 + 5^2} = \\sqrt{41} \\approx 6.4$. Which is longer?", type: "choice", answer: 0,
            options: [{ t: "The taxi route, 9" }, { t: "The straight line, 6.4", fb: "9 is the bigger number." }],
            m: "9 > 6.4", say: "Taxicab is the longer, as always." }],
        why: "Blocks, add, compare. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the taxicab distance between $(-4, 3)$ and $(2, -1)$.", answer: 10, skill: "Taxicab distance",
        near: [{ v: 2, fb: "That adds the signed differences, and they cancel. Use $|2 - (-4)| + |-1 - 3|$." }, { v: 7.2, tol: 0.1, fb: "That is the straight-line distance. A taxi drives along the streets." }], hints: ["$|2 - (-4)| = 6$."], why: "$6 + 4 = 10$." },
      { type: "sketch", prompt: "Drag $P$ to any point whose taxicab distance from the centre $C(0, 0)$ is exactly 5.",
        x: [-7, 7], y: [-6, 6], u: 28,
        pts: { P: { at: [1, 1], drag: true, snap: 1, c: "orange", say: "Point P" } },
        draw: function (s) { return [{ path: [[5, 0], [0, 5], [-5, 0], [0, -5]], closed: true, c: "purple", dash: true }, { path: [[0, 0], [s.P[0], 0], s.P], c: "orange" }, { pt: [0, 0], name: "C", at: "sw" }, { pt: s.P, name: "P", at: "ne", c: "orange" }]; },
        readout: function (s) { return "$|" + s.P[0] + "| + |" + s.P[1] + "| = " + taxi38([0, 0], s.P) + "$"; },
        goal: function (s) { return taxi38([0, 0], s.P) === 5; },
        fb: function (s) { return taxi38([0, 0], s.P) < 5 ? "Too close: move $P$ further out." : "Too far: move $P$ back in."; },
        answer: { P: [2, 3] }, skill: "Taxicab circle",
        hints: ["The dashed diamond is the circle: every point on it is 5 blocks away."], why: "$(2, 3)$ is one: $2 + 3 = 5$. So are $(5, 0)$, $(-1, -4)$ and many more: they all lie on the diamond." },
      { type: "learn", kicker: "A harder case",
        prompt: "In taxicab geometry a segment can have **many** midpoints. Find the points half-way, by taxi, between $A(0, 0)$ and $B(4, 2)$.",
        scene: { type: "walk", how: [["Total", "Find the taxicab distance, and half of it."], ["Test", "A midpoint is the same taxicab distance from each end."], ["Count", "Find how many points do this."]], rows: [
          { step: 1, m: "|4| + |2| = 6 \\qquad 6 \\div 2 = 3", say: "A midpoint is 3 blocks from each end.",
            fig: grid([-1, 6], [-1, 4], [{ pt: [0, 0], name: "A", at: "sw" }, { pt: [4, 2], name: "B", at: "ne" }], { u: 36, alt: "A at the origin and B at (4, 2) on a grid." }) },
          { step: 2, m: "(2, 1): 3 \\text{ and } 3", say: "From $A$: $2 + 1 = 3$. To $B$: $2 + 1 = 3$. It works.",
            ask: { prompt: "Is $(3, 0)$ a midpoint too?", answer: 0, options: [{ t: "Yes: 3 from $A$ and $1 + 2 = 3$ from $B$" }, { t: "No: it is off the segment", fb: "In taxicab geometry the segment itself is not the test. Count the blocks." }] } },
          { step: 3, m: "(3, 0) \\quad (2, 1) \\quad (1, 2)", say: "More than one point is half-way. The midpoint is not unique here." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which is always true of taxicab distance and straight-line distance between the same two points?",
        options: [{ t: "Taxicab distance is greater than or equal to straight-line distance" }, { t: "Taxicab distance is always less", fb: "Driving along the streets is never shorter than going straight." }, { t: "They are always equal", fb: "They are equal only when the points line up with a street." }],
        answer: 0, skill: "Taxicab distance", hints: ["Think of the streets as a detour."], why: "The streets only add to the trip. At best, the points line up and there is no detour." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana says the taxicab distance from $(0, 0)$ to $(3, 4)$ is 5. What is wrong?",
        options: [{ t: "5 is the straight-line distance. By taxi it is $3 + 4 = 7$." }, { t: "It should be 12.", fb: "Add the blocks across and up. Do not multiply." }, { t: "Nothing. It is right.", fb: "A taxi cannot drive through the buildings." }],
        answer: 0, skill: "Taxicab distance", hints: ["Count the blocks across and up."], why: "Across 3, up 4: 7 blocks." },
      { type: "num", kicker: "Use it", prompt: "A courier rides from the corner $(2, -1)$ to the corner $(-3, 5)$ on a map of square blocks. How many blocks does she ride at least?", answer: 11, skill: "Taxicab distance",
        near: [{ v: 7.8, tol: 0.1, fb: "That is the straight-line distance. Roads run along the blocks." }, { v: 1, fb: "Use the absolute value of each difference, then add." }], hints: ["$|-3 - 2| + |5 - (-1)|$."], why: "$5 + 6 = 11$ blocks." }
    ]
  });
  /* ================================================================ Skills */
  var PAIR_NAME = { corr: "Corresponding angles", altInt: "Alternate interior angles", altExt: "Alternate exterior angles", ssInt: "Same-side interior angles" };
  var PAIR_FB = { corr: "Corresponding angles are in the same position at each crossing.", altInt: "Alternate interior angles are between the lines, on opposite sides of the transversal.",
                  altExt: "Alternate exterior angles are outside the lines, on opposite sides of the transversal.", ssInt: "Same-side interior angles are between the lines, on the same side of the transversal." };
  // A random pair of numbered angles and its kind.
  function pickPair(R, kinds) { var k = R.pick(kinds || ["corr", "altInt", "altExt", "ssInt"]); return { k: k, p: R.pick(T_PAIRS[k]) }; }
  // On parallel lines with the transversal at t degrees: angles 2, 3, 6, 7 measure t and the others 180 − t.
  function measure(n, t) { return [2, 3, 6, 7].indexOf(n) > -1 ? t : 180 - t; }
  var SKILLS = [
    { id: "hg3-pairs", title: "Name the angle pair", lesson: 2,
      gen: function (R) {
        var P = pickPair(R), t = R.pick([56, 62, 68, 112, 118]);
        if (R.chance(0.5)) {
          // The other way round: given one angle and the kind of pair, find its partner.
          var sw = R.chance(0.5), a = P.p[sw ? 1 : 0], b = P.p[sw ? 0 : 1], side = b > 4 ? [5, 6, 7, 8] : [1, 2, 3, 4];
          return mc(R, { prompt: "Which angle makes a pair of **" + PAIR_NAME[P.k].toLowerCase() + "** with $\\angle " + a + "$?", art: transFig({ marks: false, t: t }), right: "$\\angle " + b + "$",
            wrong: side.filter(function (n) { return n !== b; }).map(function (n) { return { t: "$\\angle " + n + "$", fb: PAIR_FB[P.k] }; }),
            hints: [PAIR_FB[P.k]], why: PAIR_FB[P.k] });
        }
        return mc(R, { prompt: "What kind of pair are $\\angle " + P.p[0] + "$ and $\\angle " + P.p[1] + "$?", art: transFig({ marks: false, t: t }), right: PAIR_NAME[P.k], keep: true,
          wrong: ["corr", "altInt", "altExt", "ssInt"].filter(function (k) { return k !== P.k; }).map(function (k) { return { t: PAIR_NAME[k], fb: PAIR_FB[k] }; }),
          hints: ["Are they between the two lines, or outside them?", "Are they on the same side of the transversal, or on opposite sides?"], why: PAIR_FB[P.k] });
      } },
    { id: "hg3-parallel", title: "Angles on parallel lines", lesson: 3,
      gen: function (R) {
        var P = pickPair(R), t = R.int(52, 78), a = P.p[0], b = P.p[1], ma = measure(a, t), mb = measure(b, t), say = {};
        if (R.chance(0.5)) { var tmp = a; a = b; b = tmp; tmp = ma; ma = mb; mb = tmp; }
        say[a] = ma + "°"; say[b] = "?";
        return { type: "num", prompt: "$ℓ \\parallel m$ and $m\\angle " + a + " = " + ma + "°$. Find $m\\angle " + b + "$.", art: transFig({ t: t, say: say }), post: "°", answer: mb,
          near: near(mb, [{ v: 180 - mb, fb: P.k === "ssInt" ? "Same-side interior angles are supplementary, not congruent." : PAIR_NAME[P.k] + " on parallel lines are congruent, not supplementary." }]),
          hints: ["Name the pair: " + PAIR_NAME[P.k].toLowerCase() + ".", P.k === "ssInt" ? "They add to 180°." : "They are congruent."], why: P.k === "ssInt" ? "$180 - " + ma + " = " + mb + "$." : PAIR_NAME[P.k] + " are congruent: $" + mb + "°$." };
      } },
    { id: "hg3-prove", title: "Decide whether lines are parallel", lesson: 4,
      gen: function (R) {
        var P = pickPair(R), a = P.p[0], b = P.p[1], x = R.int(8, 20), c1 = R.int(2, 5), c2 = c1 + R.int(1, 3), say = {};
        if (P.k === "ssInt") {
          // (c1 x + p) + (c2 x + q) = 180
          var p = R.int(2, 20), q = 180 - (c1 + c2) * x - p;
          if (q <= 0) { x = 10; q = 180 - (c1 + c2) * x - p; }
          say[a] = "(" + c1 + "x + " + p + ")°"; say[b] = "(" + c2 + "x + " + q + ")°";
          return { type: "num", prompt: "$m\\angle " + a + " = (" + c1 + "x + " + p + ")°$ and $m\\angle " + b + " = (" + c2 + "x + " + q + ")°$. For which value of $x$ are the lines parallel?", art: transFig({ marks: false, say: say }), pre: "$x =$", answer: x,
            near: [{ v: (q - p) / (c1 - c2), tol: 1e-6, fb: "Same-side interior angles must be supplementary: add the two measures to 180." }],
            hints: ["Same-side interior angles: $(" + c1 + "x + " + p + ") + (" + c2 + "x + " + q + ") = 180$."], why: "$" + (c1 + c2) + "x + " + (p + q) + " = 180$, so $x = " + x + "$." };
        }
        // c1 x + p = c2 x − q
        var m = c1 * x + R.int(3, 15), p2 = m - c1 * x, q2 = c2 * x - m;
        if (q2 <= 0) { c2 = c1 + 3; q2 = c2 * x - m; }
        say[a] = "(" + c1 + "x + " + p2 + ")°"; say[b] = "(" + c2 + "x − " + q2 + ")°";
        return { type: "num", prompt: "$m\\angle " + a + " = (" + c1 + "x + " + p2 + ")°$ and $m\\angle " + b + " = (" + c2 + "x - " + q2 + ")°$. For which value of $x$ are the lines parallel?", art: transFig({ marks: false, say: say }), pre: "$x =$", answer: x,
          near: [{ v: (180 - p2 + q2) / (c1 + c2), tol: 1e-6, fb: PAIR_NAME[P.k] + " must be congruent: set the two measures equal." }],
          hints: [PAIR_NAME[P.k] + ": $" + c1 + "x + " + p2 + " = " + c2 + "x - " + q2 + "$."], why: "$" + (p2 + q2) + " = " + (c2 - c1) + "x$, so $x = " + x + "$." };
      } },
    { id: "hg3-slope", title: "Slope, parallel and perpendicular", lesson: 5,
      gen: function (R) {
        var kind = R.int(0, 2);
        if (kind === 0) { var x1 = R.int(-4, 3), y1 = R.int(-5, 5), run = R.int(1, 4), m = R.pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5, 1.5]);
          if (m % 1 !== 0) run = 2 * R.int(1, 2);
          var rise = m * run, x2 = x1 + run, y2 = y1 + rise;
          return { type: "num", prompt: "Find the slope of the line through $" + pt([x1, y1]) + "$ and $" + pt([x2, y2]) + "$." + (m % 1 !== 0 ? " (Type a fraction like 2/3.)" : ""), answer: m, tol: 1e-9, shown: L.fracText(rise, run),
            near: near(m, [{ v: 1 / m, tol: 1e-9, fb: "Rise over run: the change in $y$ goes on top." }, { v: -m, tol: 1e-9, fb: "Check the signs of the two differences." }]),
            hints: ["$\\frac{" + y2 + " - " + (y1 < 0 ? "(" + y1 + ")" : y1) + "}{" + x2 + " - " + (x1 < 0 ? "(" + x1 + ")" : x1) + "}$."], why: "$\\frac{" + rise + "}{" + run + "} = " + frac(rise, run) + "$." }; }
        if (kind === 1) { var F = R.pick([[1, 2], [2, 3], [3, 4], [3, 2], [5, 2], [1, 3], [4, 3], [2, 5]]), sg = R.pick([1, -1]), n = sg * F[0], d = F[1];
          return { type: "num", prompt: "A line has slope $" + frac(n, d) + "$. What is the slope of a line perpendicular to it? (Type a fraction like -2/3.)", answer: -d / n, tol: 1e-9, shown: L.fracText(-d * sg, F[0]),
            near: [{ v: d / n, tol: 1e-9, fb: "Turn it over **and** change its sign." }, { v: -n / d, tol: 1e-9, fb: "Change the sign **and** turn it over." }, { v: n / d, tol: 1e-9, fb: "That is the slope of a parallel line." }],
            hints: ["The opposite reciprocal."], why: "$" + frac(n, d) + " \\cdot " + (sg > 0 ? "\\left(" + frac(-d, F[0]) + "\\right)" : frac(d, F[0])) + " = -1$." }; }
        var a = R.pick([2, 3, 4, 5]), b = R.pick([1, 2, 3]), rel = R.pick(["par", "perp", "nei"]);
        if (a === b) b = a + 1;
        var m1 = frac(a, b), m2 = rel === "par" ? frac(2 * a, 2 * b) : rel === "perp" ? frac(-b, a) : frac(b, a);
        return mc(R, { prompt: "Two lines have slopes $" + m1 + "$ and $" + m2 + "$. What are they?", right: { par: "Parallel", perp: "Perpendicular", nei: "Neither" }[rel], keep: true,
          wrong: ["par", "perp", "nei"].filter(function (k) { return k !== rel; }).map(function (k) { return { t: { par: "Parallel", perp: "Perpendicular", nei: "Neither" }[k], fb: { par: "Parallel lines have equal slopes.", perp: "Perpendicular lines have slopes whose product is $-1$.", nei: "Check again: are the slopes equal, or is their product $-1$?" }[k] }; }),
          hints: ["Are the slopes equal? If not, multiply them."], why: { par: "The slopes are equal.", perp: "The product of the slopes is $-1$.", nei: "The slopes are not equal, and their product is 1, not $-1$." }[rel] });
      } },
    { id: "hg3-equation", title: "Write the equation of a line", lesson: 6,
      gen: function (R) {
        var m = R.int(1, 5) * R.pick([1, -1]), x1 = R.int(-3, 3), y1 = R.int(-4, 4), b = y1 - m * x1, eq = "y = " + poly([[m, "x"], [b, ""]]);
        if (x1 === 0) x1 = 1, b = y1 - m * x1, eq = "y = " + poly([[m, "x"], [b, ""]]);
        return { type: "equation", prompt: "Write the equation of the line with slope $" + m + "$ through $" + pt([x1, y1]) + "$, in slope-intercept form.", answer: clean(eq), shown: eq,
          near: [{ v: clean("y = " + poly([[m, "x"], [y1, ""]])), fb: "$" + y1 + "$ is the $y$-value at $x = " + x1 + "$, not the intercept. Use $y - " + (y1 < 0 ? "(" + y1 + ")" : y1) + " = " + m + "(x - " + (x1 < 0 ? "(" + x1 + ")" : x1) + ")$." }],
          hints: ["Point-slope form: $y - " + (y1 < 0 ? "(" + y1 + ")" : y1) + " = " + m + "(x - " + (x1 < 0 ? "(" + x1 + ")" : x1) + ")$.", "Distribute, then solve for $y$."], why: "$" + eq + "$." };
      } },
    { id: "hg3-classify", title: "Classify a pair of lines", lesson: 6,
      gen: function (R) {
        var m = R.int(1, 4) * R.pick([1, -1]), b = R.int(-5, 5), rel = R.pick(["par", "int", "same"]), m2, b2;
        if (rel === "par") { m2 = m; b2 = b + R.pick([-3, -2, 2, 3, 4]); }
        else if (rel === "int") { m2 = m + R.pick([1, 2, -1]); if (m2 === m) m2 = m + 1; b2 = R.int(-5, 5); }
        else { m2 = m; b2 = b; }
        var e1 = "y = " + poly([[m, "x"], [b, ""]]), e2 = rel === "same" ? "2y = " + poly([[2 * m, "x"], [2 * b, ""]]) : "y = " + poly([[m2, "x"], [b2, ""]]);
        var N = { par: "Parallel", int: "Intersecting", same: "The same line" };
        return mc(R, { prompt: "How are these two lines related? $$" + e1 + " \\qquad " + e2 + "$$", right: N[rel], keep: true,
          wrong: ["par", "int", "same"].filter(function (k) { return k !== rel; }).map(function (k) { return { t: N[k], fb: { par: "Parallel lines have the same slope and different intercepts.", int: "Intersecting lines have different slopes.", same: "The same line has the same slope and the same intercept." }[k] }; }),
          hints: ["Write both in slope-intercept form, then compare the slopes and the intercepts."], why: { par: "The same slope, different intercepts.", int: "Different slopes: they cross once.", same: "Dividing the second equation by 2 gives the first." }[rel] });
      } },
    { id: "hg3-perp", title: "Perpendicular lines and distance", lesson: 8,
      gen: function (R) {
        var d = R.int(5, 15), c = R.int(2, 5), b = R.int(1, 9), x = R.int(5, 20);
        if (R.chance(0.5)) {
          var rhs = d - b;
          if (rhs <= 0 || rhs % c) { b = d - c * R.int(1, Math.max(1, Math.floor(d / c) - 1)); rhs = d - b; }
          if (b <= 0) { c = 2; b = d - 4; rhs = 4; }
          return { type: "num", prompt: "The perpendicular segment from $P$ to a line is " + d + " cm long. Another segment from $P$ to the line has length $" + c + "x + " + b + "$. Solve $" + c + "x + " + b + " > " + d + "$.", pre: "$x >$", answer: rhs / c,
            near: near(rhs / c, [{ v: d / c, tol: 1e-6, fb: "Subtract " + b + " before you divide." }]), hints: ["$" + c + "x > " + rhs + "$."], why: "$" + c + "x > " + rhs + "$, so $x > " + num(rhs / c) + "$." };
        }
        var k = 90 - c * x;
        if (k <= 0) { x = 10; c = 4; k = 50; }
        return { type: "num", prompt: "$ℓ \\parallel m$ and $t \\perp ℓ$. An angle where $t$ meets $m$ measures $(" + c + "x + " + k + ")°$. Find $x$.", pre: "$x =$", answer: x,
          near: near(x, [{ v: (180 - k) / c, tol: 1e-6, fb: "A perpendicular transversal makes right angles: the measure is 90°, not 180°." }]),
          hints: ["$t \\perp m$ as well, so $" + c + "x + " + k + " = 90$."], why: "$" + c + "x = " + (90 - k) + "$, so $x = " + x + "$." };
      } },
    { id: "hg3-rightangle", title: "Right angles from perpendicular lines", lesson: 7,
      gen: function (R) {
        if (R.chance(0.5)) {
          var a = R.int(2, 5), x = R.int(5, Math.floor(80 / a)), c = 90 - a * x;
          return { type: "num", prompt: "Lines $ℓ$ and $m$ are perpendicular. One of the four angles measures $(" + a + "x + " + c + ")°$. Find $x$.", answer: x,
            near: [{ v: Math.round((180 - c) / a * 100) / 100, tol: 0.01, fb: "A right angle is 90°, not 180°." }], hints: ["Perpendicular lines make right angles: $" + a + "x + " + c + " = 90$."], why: "$" + a + "x = " + (90 - c) + "$, so $x = " + x + "$." };
        }
        var p = R.int(1, 4), q = R.int(1, 4), y = R.int(4, 10), k = 90 - (p + q) * y;
        if (k < 1) { k = 5; y = Math.floor((90 - k) / (p + q)); k = 90 - (p + q) * y; }
        return { type: "num", prompt: "A ray splits a right angle into two parts of $(" + p + "x)°$ and $(" + q + "x + " + k + ")°$. Find $x$.", answer: y,
          near: [{ v: Math.round((180 - k) / (p + q) * 100) / 100, tol: 0.01, fb: "The two parts fill a right angle: 90°, not 180°." }], hints: ["The parts add up to 90°: $" + p + "x + " + q + "x + " + k + " = 90$."], why: "$" + (p + q) + "x = " + (90 - k) + "$, so $x = " + y + "$." };
      } },
    { id: "hg3-taxi", title: "Taxicab distance", lesson: 9,
      gen: function (R) {
        var P = [R.int(-6, 6), R.int(-6, 6)], Q = [R.int(-6, 6), R.int(-6, 6)];
        if (P[0] === Q[0] && P[1] === Q[1]) Q = [P[0] + 3, P[1] - 4];
        var dx = Math.abs(Q[0] - P[0]), dy = Math.abs(Q[1] - P[1]);
        return { type: "num", prompt: "Find the taxicab distance between $" + pt(P) + "$ and $" + pt(Q) + "$.", answer: dx + dy,
          near: [{ v: Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10, tol: 0.06, fb: "That is the straight-line distance. A taxi drives along the streets." }, { v: (Q[0] - P[0]) + (Q[1] - P[1]), fb: "Take the absolute value of each difference before adding." }].filter(function (n) { return Math.abs(n.v - (dx + dy)) > 0.2; }),
          hints: ["Blocks across: $|" + Q[0] + " - " + (P[0] < 0 ? "(" + P[0] + ")" : P[0]) + "| = " + dx + "$."], why: "$" + dx + " + " + dy + " = " + (dx + dy) + "$ blocks." };
      } }
  ];
  L.unit("geo", 3, {
    title: "Parallel and Perpendicular Lines",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Angle pairs, angles on parallel lines, and proving lines parallel.",
        skills: ["hg3-pairs", "hg3-parallel", "hg3-prove"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Slope, equations of lines, and pairs of lines.",
        skills: ["hg3-slope", "hg3-equation", "hg3-classify"], per: 2 },
      { title: "Quiz 3", after: 9, blurb: "Right angles, distance to a line, and taxicab distance.",
        skills: ["hg3-rightangle", "hg3-perp", "hg3-taxi"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:3", {
    2: { name: "Lines and transversals", frame: "[[Parallel]] lines lie in one plane and never meet. [[Skew]] lines are not in one plane. A [[transversal]] crosses two lines and makes eight angles, in named pairs.",
         chips: ["Perpendicular", "measure"] },
    3: { name: "Parallel lines", frame: "When a transversal crosses parallel lines, corresponding angles are [[congruent]], alternate interior angles are congruent, and consecutive interior angles are [[supplementary]].",
         chips: ["complementary", "vertical"] },
    4: { name: "Proving lines parallel", frame: "The [[converses]] are true as well: if corresponding or alternate angles are [[congruent]], or consecutive interior angles are supplementary, the lines are parallel.",
         chips: ["inverses", "perpendicular"] },
    5: { name: "Slope", frame: "Slope is [[rise]] over [[run]]. Parallel lines have [[equal]] slopes. Perpendicular lines have slopes whose product is [[−1]].",
         chips: ["1", "length"] },
    6: { name: "Equations of lines", frame: "In $y = mx + b$, $m$ is the [[slope]] and $b$ is the [[y-intercept]]. Point-slope form is $y - y_1 = m(x - x_1)$. Lines with equal slopes are parallel.",
         chips: ["x-intercept", "perpendicular"] },
    7: { name: "Perpendicular lines", frame: "Perpendicular lines make [[four]] right angles. A linear pair of congruent angles is two [[right]] angles, and a right angle split in two gives [[complementary]] parts.",
         chips: ["supplementary", "three"] },
    8: { name: "Perpendicular transversals", frame: "If a transversal is [[perpendicular]] to one of two parallel lines, it is perpendicular to the other. The distance from a point to a line is the [[shortest]] segment, the perpendicular one.",
         chips: ["longest", "parallel"] },
    9: { name: "Taxicab geometry", frame: "Taxicab distance is the blocks [[across]] plus the blocks [[up]]. A taxicab circle is a [[diamond]], and a segment can have many midpoints.",
         chips: ["straight", "round"] }
  });
})();
