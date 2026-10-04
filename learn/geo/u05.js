/* ==========================================================================
   Geometry — Unit 5: Properties and Attributes of Triangles. See lab/core.js
   for the format and lab/geotools.js for the drawing kit.

   Follows Holt Geometry, Chapter 5, section for section (5-1 to 5-8), after
   a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   Perpendicular and angle bisectors (5-1), the circumcenter and incenter
   (5-2), medians, altitudes, the centroid and orthocenter (5-3), midsegments
   (5-4), indirect proof and the Triangle Inequality (5-5), the Hinge Theorem
   (5-6), the Pythagorean Theorem (5-7) and the two special right triangles
   (5-8).

   Lessons carry v: 4 (see Unit 1). Skills are hg5-….

   Nine lessons, eight skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  var T5 = [[0, 0], [6, 0], [1.6, 4]];
  // Line ℓ, the perpendicular bisector of AB at M, with P on it. o.pa, o.pb: labels for PA and PB. o.names "ABMP".
  function pbFig(o) {
    o = o || {};
    var A = [0, 0], B = [4.4, 0], M = [2.2, 0], P = [2.2, 2.6], n = o.names || "ABMP";
    return plain([-0.9, 5.3], [-1.2, 3.8], [{ dline: [[2.2, -0.9], [2.2, 3.6]], c: "orange" }, { seg: [A, M], marks: 1 }, { seg: [M, B], marks: 1 },
      { angle: [B, M, P], right: true, c: "orange" }, { seg: [P, A], c: "blue" }, { seg: [P, B], c: "blue" }]
      .concat(o.pa ? [{ len: o.pa, seg: [A, P], side: 1, off: 14, eq: isMaths(o.pa) }] : [], o.pb ? [{ len: o.pb, seg: [P, B], side: 1, off: 14, eq: isMaths(o.pb) }] : [],
      [{ pt: A, name: n[0], at: "sw" }, { pt: B, name: n[1], at: "se" }, { pt: M, name: n[2], at: "sw" }, { pt: P, name: n[3], at: "ne" }, { word: "ℓ", at: [2.55, 3.4], eq: true, c: "orange" }]), { u: 32, alt: o.alt });
  }
  // Angle XVY with its bisector through P, and the perpendiculars from P to each side. o.d1, o.d2: labels for the two distances. o.names "VPXY".
  function abFig(o) {
    o = o || {};
    var th = 27, V = [0, 0], P = [4, 0], c = Math.cos(th * Math.PI / 180), s = Math.sin(th * Math.PI / 180), F1 = [4 * c * c, 4 * c * s], F2 = [4 * c * c, -4 * c * s], n = o.names || "VPXY";
    return plain([-0.8, 6.4], [-3.1, 3.1], [{ ray: [V, [c, s]] }, { ray: [V, [c, -s]] }, { ray: [V, [1, 0]], c: "orange" },
      { amarks: [[1, 0], V, [c, s]], n: 1, r: 26 }, { amarks: [[c, -s], V, [1, 0]], n: 1, r: 26 },
      { seg: [P, F1], c: "blue" }, { seg: [P, F2], c: "blue" }, { angle: [P, F1, V], right: true, c: "orange" }, { angle: [V, F2, P], right: true, c: "orange" }]
      .concat(o.d1 ? [{ len: o.d1, seg: [F1, P], side: 1, off: 16, eq: isMaths(o.d1) }] : [], o.d2 ? [{ len: o.d2, seg: [P, F2], side: 1, off: 16, eq: isMaths(o.d2) }] : [],
      [{ pt: V, name: n[0], at: "w" }, { pt: P, name: n[1], at: "e" }, { pt: F1, name: n[2], at: "n" }, { pt: F2, name: n[3], at: "s" }]), { u: 32, alt: o.alt });
  }
  // The circumcentre and the incentre of a triangle.
  function circum(P) {
    var a = P[0], b = P[1], c = P[2], d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    function q(p) { return p[0] * p[0] + p[1] * p[1]; }
    return [(q(a) * (b[1] - c[1]) + q(b) * (c[1] - a[1]) + q(c) * (a[1] - b[1])) / d, (q(a) * (c[0] - b[0]) + q(b) * (a[0] - c[0]) + q(c) * (b[0] - a[0])) / d];
  }
  function incentre(P) {
    var a = GT.dist(P[1], P[2]), b = GT.dist(P[2], P[0]), c = GT.dist(P[0], P[1]), s = a + b + c;
    return [(a * P[0][0] + b * P[1][0] + c * P[2][0]) / s, (a * P[0][1] + b * P[1][1] + c * P[2][1]) / s];
  }
  // A triangle with its circumscribed circle (kind "out") or its inscribed circle (kind "in"), centre P.
  function circleFig(kind, alt, names) {
    var O = kind === "out" ? circum(T5) : incentre(T5), r = kind === "out" ? GT.dist(O, T5[0]) : O[1];
    var extra = [{ circle: [O, r], c: "orange", dash: true }];
    if (kind === "out") T5.forEach(function (v) { extra.push({ seg: [O, v], c: "green", dash: true }); });
    else extra.push({ seg: [O, [O[0], 0]], c: "green", dash: true }, { angle: [[O[0] + 1, 0], [O[0], 0], O], right: true, c: "green" });
    extra.push({ pt: O, name: "P", at: kind === "out" ? "s" : "ne", c: "green" });
    return shapes([[T5, { names: names || "ABC" }]], { alt: alt, pts: [[O[0] - r, O[1] - r], [O[0] + r, O[1] + r]], m: 0.8, extra: extra });
  }
  // A triangle with its three medians. The one from vertex i is drawn strong, to the midpoint named mid. G is the centroid.
  function medFig(i, mid, alt, names) {
    var P = T5, G = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3], items = [];
    [0, 1, 2].forEach(function (k) {
      var M = GT.mid(P[(k + 1) % 3], P[(k + 2) % 3]);
      items.push({ seg: [P[k], M], c: k === i ? "orange" : "soft", dash: k !== i });
      if (k === i) items.push({ pt: M, name: mid, at: ["ne", "nw", "s"][i], c: "orange" });
    });
    items.push({ pt: G, name: "G", at: "n", c: "green" });
    return shapes([[P, { names: names || "ABC" }]], { alt: alt, extra: items });
  }
  // Triangle ABC with the midsegment DE that joins the midpoints of AC and BC. o.ab, o.de: labels. o.angs: angle labels for A, B, C.
  function midFig(o) {
    o = o || {};
    var P = T5, D = GT.mid(P[0], P[2]), E = GT.mid(P[1], P[2]), n = o.names || "ABCDE";
    return shapes([[P, { names: n.slice(0, 3), sides: [o.ab || null, null, null], angs: o.angs }]], { alt: o.alt, extra: [{ seg: [P[0], D], marks: 1 }, { seg: [D, P[2]], marks: 1 }, { seg: [P[1], E], marks: 2 }, { seg: [E, P[2]], marks: 2 }, { seg: [D, E], c: "orange" }]
      .concat(o.de ? [{ len: o.de, seg: [D, E], side: 1, off: 13, eq: isMaths(o.de) }] : [], [{ pt: D, name: n[3], at: "nw", c: "orange" }, { pt: E, name: n[4], at: "ne", c: "orange" }]) });
  }
  // Two triangles with two pairs of congruent sides and different included angles (a1 and a2 degrees, at the first vertex).
  // o.s1, o.s2: what to write in those angles (default the measures; null for nothing). o.t1, o.t2: labels for the third sides.
  function hingeFig(n1, n2, a1, a2, o) {
    o = o || {};
    function T(a, dx) { return [[dx, 0], [dx + 3.4, 0], GT.polar([dx, 0], 3, a)]; }
    function M(n, a, s, t, c) { return { names: n, c: c, ticks: [1, 0, 2], angs: [s === undefined ? a + "°" : s, null, null], sides: [null, t || null, null] }; }
    return shapes([[T(a1, 0), M(n1, a1, o.s1, o.t1)], [T(a2, 5.4), M(n2, a2, o.s2, o.t2, "green")]], { alt: o.alt });
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
    blurb: "Before Chapter 5 · Square roots, inequalities, and midpoint and slope.",
    mins: 6, v: 4,
    steps: [
      { type: "num", kicker: "Check 1 · Squares and roots", prompt: "Find $\\sqrt{81}$.", answer: 9, skill: "Square roots",
        near: [{ v: 40.5, fb: "Not half of 81: the number whose square is 81." }], hints: ["Which number times itself is 81?"], why: "$9 \\cdot 9 = 81$." },
      { type: "choice", prompt: "Simplify $\\sqrt{48}$.",
        options: [{ t: "$4\\sqrt{3}$" }, { t: "$3\\sqrt{4}$", fb: "$\\sqrt{4}$ is 2, so that is 6, and $6^2 = 36$." }, { t: "$24$", fb: "That is half of 48. Look for a square factor: $48 = 16 \\cdot 3$." }],
        answer: 0, skill: "Simplify radicals", hints: ["$48 = 16 \\cdot 3$."], why: "$\\sqrt{16 \\cdot 3} = 4\\sqrt{3}$." },
      { type: "num", kicker: "Check 2 · Inequalities", prompt: "Solve $3x - 4 < 20$.", pre: "$x <$", answer: 8, skill: "Solve an inequality",
        near: [{ v: 16 / 3, tol: 0.01, fb: "Add 4 to both sides, do not subtract it." }], hints: ["$3x < 24$."], why: "$3x < 24$, so $x < 8$." },
      { type: "choice", prompt: "Which statement is true?",
        options: [{ t: "$6 + 9 > 14$" }, { t: "$6 + 9 < 14$", fb: "$6 + 9 = 15$, which is more than 14." }, { t: "$6 + 9 = 14$", fb: "$6 + 9 = 15$." }],
        answer: 0, skill: "Compare numbers", hints: ["Add first."], why: "$15 > 14$." },
      { type: "pair", kicker: "Check 3 · Midpoint and slope", prompt: "Find the midpoint of the segment from $(2, 1)$ to $(8, 5)$. Type it as $(x, y)$.", answer: [5, 3], skill: "Midpoint Formula",
        near: [{ v: [10, 6], fb: "Those are the sums. Divide each by 2." }], hints: ["Average the $x$s and average the $y$s."], why: "$\\left(\\frac{10}{2}, \\frac{6}{2}\\right) = (5, 3)$." },
      { type: "num", prompt: "A line has slope $\\frac{2}{3}$. What is the slope of a line perpendicular to it? (Type a fraction like -5/4.)", answer: -1.5, tol: 1e-9, shown: "-3/2", skill: "Perpendicular slopes",
        near: [{ v: 1.5, tol: 1e-9, fb: "Turn it over **and** change its sign." }, { v: -2 / 3, tol: 1e-9, fb: "Change the sign **and** turn it over." }], hints: ["The opposite reciprocal."], why: "$\\frac{2}{3} \\cdot \\left(-\\frac{3}{2}\\right) = -1$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 5-1**. If **check 3** slipped, see lessons 1-6 and 3-5. **Check 1** is practised again in lesson 5-7.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ======================================== 5-1 · Perpendicular and angle bisectors */
  var HOW_5_1 = [["Which", "Is the line the perpendicular bisector of a segment, or the bisector of an angle?"],
                 ["Equal", "A point on a perpendicular bisector is equidistant from the segment's endpoints. A point on an angle bisector is equidistant from the angle's sides."],
                 ["Solve", "Set the two distances equal, and solve."]];
  var FIG_PB = pbFig({ pa: "3x − 4", pb: "2x + 5", alt: "Segment AB with midpoint M. Line ℓ crosses AB at M at a right angle, and P is on ℓ. PA is 3x − 4 and PB is 2x + 5." }),
      FIG_AB = abFig({ d1: "4x − 2", d2: "2x + 10", alt: "An angle with vertex V. A ray from V through P cuts it into two equal angles. From P, a segment to each side meets it at a right angle, at X and at Y. PX is 4x − 2 and PY is 2x + 10." }),
      FIG_PBG = grid([-1, 7], [-1, 7], [{ seg: [[1, 2], [5, 4]], c: "blue" }, { line: [[2, 5], [4, 1]], c: "orange" }, { pt: [1, 2], name: "A", at: "sw" }, { pt: [5, 4], name: "B", at: "ne" }, { pt: [3, 3], name: "M", at: "ne", c: "orange" }],
        { u: 28, alt: "A coordinate grid. Segment AB runs from A at (1, 2) to B at (5, 4). A line crosses it at right angles at its midpoint M, (3, 3)." });
  LESSONS.push({
    title: "Perpendicular and angle bisectors",
    blurb: "Book 5-1 · Points on a perpendicular bisector, and points on an angle bisector, are equidistant.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The perpendicular bisector of $\\overline{AB}$ crosses it at $M$. $AB = 18$. Find $AM$.", answer: 9, skill: "Bisectors",
        near: [{ v: 36, fb: "A bisector cuts the segment in half. It does not double it." }], hints: ["A bisector cuts a segment into two equal parts."], why: "$18 \\div 2 = 9$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Equidistant** means the same distance from two things. **Perpendicular Bisector Theorem:** a point on the perpendicular bisector of a segment is equidistant from the segment's endpoints. **Angle Bisector Theorem:** a point on the bisector of an angle is equidistant from the angle's sides. Both converses are true.",
        scene: { type: "method", how: HOW_5_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the Perpendicular Bisector Theorem used to find $PA$.",
        scene: { type: "walk", how: HOW_5_1, rows: [
          { step: 1, m: "ℓ \\perp \\overline{AB} \\text{ at its midpoint } M", say: "So $ℓ$ is the perpendicular bisector of $\\overline{AB}$.", fig: FIG_PB },
          { step: 2, m: "PA = PB", say: "$P$ is on $ℓ$, so it is equidistant from $A$ and $B$." },
          { step: 3, m: "3x - 4 = 2x + 5", say: "Put in the two expressions." },
          { step: 3, m: "x = 9", say: "Subtract $2x$ and add 4.",
            ask: { prompt: "What is $x$ when $3x - 4 = 2x + 5$?", answer: 0,
                   options: [{ t: "9" }, { t: "1", fb: "Add 4 to both sides: $x = 5 + 4$." }] } },
          { step: 3, m: "PA = 3(9) - 4 = 23", say: "And $PB = 2(9) + 5 = 23$ as well." }] },
        gate: true, then: "On the perpendicular bisector means the same distance from both ends." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the distance from $P$ to each side of the angle.", art: FIG_AB,
        how: HOW_5_1, skill: "Angle Bisector Theorem",
        steps: [
          { step: 1, ask: "What is ray $VP$?", type: "choice", answer: 0,
            options: [{ t: "The bisector of the angle" }, { t: "A perpendicular bisector", fb: "It cuts an angle in half, not a segment." }],
            m: "\\overrightarrow{VP} \\text{ bisects } \\angle XVY", say: "The two arcs mark two congruent angles." },
          { step: 2, ask: "$P$ is on the bisector. Which equation follows?", type: "choice", answer: 0,
            options: [{ t: "$4x - 2 = 2x + 10$" }, { t: "$(4x - 2) + (2x + 10) = 180$", fb: "These are distances, and they are equal. Nothing adds to 180." }],
            m: "4x - 2 = 2x + 10", say: "The distances to the two sides are equal." },
          { step: 3, ask: "Solve for $x$.", type: "num", answer: 6, near: [{ v: 4, fb: "Add 2 to both sides: $2x = 12$." }], hint: "$2x = 12$.",
            m: "x = 6", say: "$2x = 12$." },
          { step: 3, ask: "So what is the distance $PX$?", type: "num", answer: 22, near: [{ v: 6, fb: "That is $x$. Substitute it into $4x - 2$." }], hint: "$4(6) - 2$.",
            m: "PX = 4(6) - 2 = 22", say: "And $PY = 2(6) + 10 = 22$." }],
        why: "Which, equal, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$P$ is on the perpendicular bisector of $\\overline{AB}$, and $PA = 26$. Find $PB$.", answer: 26, skill: "Perpendicular Bisector Theorem",
        near: [{ v: 13, fb: "The bisector halves $\\overline{AB}$, not $PA$. $P$ is equidistant from $A$ and $B$." }],
        hints: ["A point on the perpendicular bisector is equidistant from the endpoints."], why: "$PB = PA = 26$." },
      { type: "num", prompt: "$P$ is on the bisector of $\\angle XYZ$. Its distance to side $\\overrightarrow{YX}$ is $3n + 1$ and its distance to side $\\overrightarrow{YZ}$ is 16. Find $n$.", pre: "$n =$", answer: 5, skill: "Angle Bisector Theorem",
        near: [{ v: 17 / 3, tol: 0.01, fb: "Subtract 1 from 16, do not add it." }],
        hints: ["The two distances are equal: $3n + 1 = 16$."], why: "$3n = 15$, so $n = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "On the coordinate plane you can write the **equation** of a perpendicular bisector. Find it for the segment from $A(1, 2)$ to $B(5, 4)$.",
        scene: { type: "walk", how: [["Midpoint", "Find the midpoint of the segment."], ["Slope", "Find the segment's slope, then take the opposite reciprocal."], ["Equation", "Write the line through the midpoint with that slope."]], rows: [
          { step: 1, m: "M = \\left(\\frac{1 + 5}{2}, \\frac{2 + 4}{2}\\right) = (3, 3)", say: "The bisector passes through the midpoint.", fig: FIG_PBG },
          { step: 2, m: "\\text{slope of } \\overline{AB} = \\frac{4 - 2}{5 - 1} = \\frac{1}{2}", say: "Rise over run." },
          { step: 2, m: "\\text{slope of the bisector} = -2", say: "The opposite reciprocal of $\\frac{1}{2}$.",
            ask: { prompt: "What slope is perpendicular to $\\frac{1}{2}$?", answer: 0,
                   options: [{ t: "$-2$" }, { t: "$2$", fb: "Turn it over **and** change its sign." }, { t: "$-\\frac{1}{2}$", fb: "Change the sign **and** turn it over." }] } },
          { step: 3, m: "y - 3 = -2(x - 3)", say: "Point-slope form, through $(3, 3)$." },
          { step: 3, m: "y = -2x + 9", say: "Slope-intercept form." }] },
        gate: true },
      { type: "equation", kicker: "Try it", prompt: "Write the equation of the perpendicular bisector of the segment from $(0, 0)$ to $(4, 4)$.", answer: "y=-x+4", shown: "y = -x + 4", skill: "Perpendicular Bisector Theorem",
        near: [{ v: "y=x", fb: "That is the line the segment lies on. The bisector is perpendicular to it." }, { v: "y=-x", fb: "The slope is right, but the bisector passes through the midpoint $(2, 2)$." }],
        hints: ["The midpoint is $(2, 2)$ and the segment's slope is 1.", "A perpendicular slope is $-1$: $y - 2 = -1(x - 2)$."], why: "Through $(2, 2)$ with slope $-1$: $y = -x + 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A line passes through the midpoint $M$ of $\\overline{AB}$, but it is not perpendicular to $\\overline{AB}$. $P$ is another point on that line. Ana says $PA = PB$. What is wrong?",
        options: [{ t: "The theorem needs the perpendicular bisector. This line only bisects." },
                  { t: "$P$ must be the midpoint.", fb: "$P$ is a different point on the line." },
                  { t: "Nothing. The line passes through the midpoint.", fb: "Only $M$ itself is sure to be equidistant. The line must also be perpendicular." }],
        answer: 0, skill: "Perpendicular Bisector Theorem", hints: ["Read the theorem's name: which two things must the line do?"], why: "Perpendicular **and** bisector: both are needed." },
      { type: "choice", kicker: "Use it", prompt: "A drinking fountain is to be the same distance from two park gates. Where can it go?",
        options: [{ t: "Anywhere on the perpendicular bisector of the segment joining the gates" }, { t: "Only at the midpoint between the gates", fb: "The midpoint works, but so does every other point on the perpendicular bisector." }, { t: "Anywhere on the line through both gates", fb: "On that line, only the midpoint is equidistant." }],
        answer: 0, skill: "Perpendicular Bisector Theorem", hints: ["Use the converse of the theorem."], why: "The points equidistant from two points make up the perpendicular bisector of the segment between them." }
    ]
  });

  /* ==================================================== 5-2 · Bisectors of triangles */
  var HOW_5_2 = [["Which", "Perpendicular bisectors of the sides meet at the circumcenter. Angle bisectors meet at the incenter."],
                 ["Equal", "The circumcenter is equidistant from the three vertices. The incenter is equidistant from the three sides."],
                 ["Find", "Use the equal distances to find a length, or to check the point."]];
  var FIG_CIRC = circleFig("out", "Triangle ABC with a dashed circle through all three vertices. Its centre P is joined to A, B and C by dashed segments."),
      FIG_INC = circleFig("in", "Triangle ABC with a dashed circle inside it that just touches all three sides. A dashed segment from its centre P meets side AB at a right angle."),
      FIG_CC = grid([-1, 10], [-1, 8], [{ poly: [[0, 0], [8, 0], [0, 6]], names: "OAB" }, { line: [[4, 0], [4, 1]], c: "orange", bare: true, dash: true }, { line: [[0, 3], [1, 3]], c: "green", bare: true, dash: true }, { pt: [4, 3], name: "P", at: "ne", c: "orange" }],
        { u: 24, alt: "A coordinate grid. Right triangle OAB has O at the origin, A at (8, 0) and B at (0, 6). The dashed lines x = 4 and y = 3 cross at P, (4, 3), on the hypotenuse." });
  LESSONS.push({
    title: "Bisectors of triangles",
    blurb: "Book 5-2 · The circumcenter and the incenter: where a triangle's bisectors meet.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "$P$ is on the perpendicular bisector of $\\overline{AB}$. What must be true?",
        options: [{ t: "$PA = PB$" }, { t: "$PA = AB$", fb: "$P$ is equidistant from the two endpoints. Nothing is said about the length of $\\overline{AB}$." }, { t: "$P$ is the midpoint of $\\overline{AB}$", fb: "The midpoint is one such point, but there are many others." }],
        answer: 0, skill: "Perpendicular Bisector Theorem", hints: ["The Perpendicular Bisector Theorem."], why: "A point on the perpendicular bisector is equidistant from the endpoints." },
      { type: "learn", kicker: "The idea",
        prompt: "Lines that meet at one point are **concurrent**. A triangle's three perpendicular bisectors meet at the **circumcenter**, which is equidistant from the three vertices: it is the centre of the circle through them. Its three angle bisectors meet at the **incenter**, which is equidistant from the three sides.",
        scene: { type: "method", how: HOW_5_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the circumcenter of a right triangle found on the coordinate plane.",
        scene: { type: "walk", how: HOW_5_2, rows: [
          { step: 1, m: "x = 4", say: "The perpendicular bisector of $\\overline{OA}$: the vertical line through its midpoint $(4, 0)$.", fig: FIG_CC },
          { step: 1, m: "y = 3", say: "The perpendicular bisector of $\\overline{OB}$: the horizontal line through $(0, 3)$.",
            ask: { prompt: "$\\overline{OB}$ runs from $(0, 0)$ to $(0, 6)$. Where is its midpoint?", answer: 0,
                   options: [{ t: "$(0, 3)$" }, { t: "$(3, 0)$", fb: "$\\overline{OB}$ lies on the $y$-axis, so its midpoint does too." }] } },
          { step: 1, m: "P(4, 3)", say: "The two lines cross here: the circumcenter." },
          { step: 2, m: "PO = PA = PB", say: "The circumcenter is equidistant from the three vertices. Check it." },
          { step: 3, m: "PO = \\sqrt{4^2 + 3^2} = 5", say: "The distance to $O$." },
          { step: 3, m: "PA = 5 \\qquad PB = 5", say: "The same distance to all three vertices." }] },
        gate: true, then: "Two bisectors are enough: the third passes through the same point." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $P$ is the circumcenter of $\\triangle ABC$. $PA = 5x - 2$ and $PB = 3x + 8$. Find $PC$.", art: FIG_CIRC,
        how: HOW_5_2, skill: "Circumcenter",
        steps: [
          { step: 1, ask: "$P$ is the circumcenter. Which lines meet at $P$?", type: "choice", answer: 0,
            options: [{ t: "The perpendicular bisectors of the sides" }, { t: "The angle bisectors", fb: "Those meet at the incenter." }],
            m: "\\text{perpendicular bisectors meet at } P", say: "That is what makes $P$ the circumcenter." },
          { step: 2, ask: "The circumcenter is equidistant from the three…", type: "choice", answer: 0,
            options: [{ t: "vertices" }, { t: "sides", fb: "That is the incenter." }],
            m: "PA = PB = PC", say: "Circumcenter Theorem." },
          { step: 3, ask: "Which equation finds $x$?", type: "choice", answer: 0,
            options: [{ t: "$5x - 2 = 3x + 8$" }, { t: "$5x - 2 + 3x + 8 = 180$", fb: "These are lengths, and they are equal." }],
            m: "5x - 2 = 3x + 8", say: "$PA = PB$." },
          { step: 3, ask: "Solve for $x$.", type: "num", answer: 5, near: [{ v: 3, fb: "Add 2 to both sides: $2x = 10$." }], hint: "$2x = 10$.",
            m: "x = 5", say: "$2x = 10$." },
          { step: 3, ask: "So what is $PC$?", type: "num", answer: 23, near: [{ v: 5, fb: "That is $x$. $PC = PA = 5x - 2$." }], hint: "$PC = PA = 5(5) - 2$.",
            m: "PC = 23", say: "$PA = 5(5) - 2 = 23$, and $PC$ is the same." }],
        why: "Which, equal, find. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$P$ is the incenter of $\\triangle ABC$. The distance from $P$ to $\\overline{AB}$ is 7. What is the distance from $P$ to $\\overline{BC}$?", art: FIG_INC, answer: 7, skill: "Incenter",
        hints: ["The incenter is equidistant from the three sides."], why: "The Incenter Theorem: the same distance, 7, to every side." },
      { type: "num", prompt: "$P$ is the incenter of $\\triangle ABC$, and $m\\angle ABC = 70°$. Find $m\\angle PBC$.", post: "°", answer: 35, skill: "Incenter",
        near: [{ v: 70, fb: "$\\overline{BP}$ bisects the angle: take half." }],
        hints: ["The incenter lies on every angle bisector."], why: "$\\overline{BP}$ bisects $\\angle ABC$: $70 \\div 2 = 35$." },
      { type: "learn", kicker: "A harder case",
        prompt: "In $\\triangle ABC$, $m\\angle A = 50°$ and $m\\angle B = 70°$. $P$ is the incenter. Find $m\\angle PCA$.",
        scene: { type: "walk", how: [["Third", "Find the third angle of the triangle."], ["Bisect", "The incenter lies on every angle bisector."], ["Halve", "Halve the angle."]], rows: [
          { step: 1, m: "m\\angle C = 180 - 50 - 70 = 60°", say: "The Triangle Sum Theorem.", fig: FIG_INC },
          { step: 2, m: "\\overline{CP} \\text{ bisects } \\angle C", say: "$P$ is where the three angle bisectors meet." },
          { step: 3, m: "m\\angle PCA = \\frac{1}{2}(60°)", say: "Half of the angle at $C$.",
            ask: { prompt: "What is half of 60°?", answer: 0,
                   options: [{ t: "$30°$" }, { t: "$120°$", fb: "Half, not double." }] } },
          { step: 3, m: "m\\angle PCA = 30°", say: "And $m\\angle PCB = 30°$ too." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "Circumcenter or incenter?",
        bins: ["Circumcenter", "Incenter"],
        cards: [{ t: "Where the perpendicular bisectors meet", bin: 0, fb: "Perpendicular bisectors of the sides." }, { t: "Where the angle bisectors meet", bin: 1, fb: "Bisectors of the angles." },
                { t: "Equidistant from the three vertices", bin: 0, fb: "It is the centre of the circle through the vertices." }, { t: "Equidistant from the three sides", bin: 1, fb: "It is the centre of the circle that touches each side." },
                { t: "Can lie outside the triangle", bin: 0, fb: "In an obtuse triangle the circumcenter is outside." }, { t: "Always inside the triangle", bin: 1, fb: "The angle bisectors always cross inside." }],
        skill: "Circumcenter and incenter", hints: ["Circum- goes round the outside, through the vertices. In- sits inside, touching the sides."],
        why: "Perpendicular bisectors and vertices: circumcenter. Angle bisectors and sides: incenter." },
      { type: "choice", kicker: "Find the error",
        prompt: "Leo says the circumcenter of a triangle is always inside the triangle. What is wrong?",
        options: [{ t: "In a right triangle it is on the hypotenuse, and in an obtuse triangle it is outside." },
                  { t: "It is never inside the triangle.", fb: "In an acute triangle it is inside." },
                  { t: "Nothing. A centre is always inside.", fb: "Look at the right triangle in the Watch step: $P$ was on the hypotenuse." }],
        answer: 0, skill: "Circumcenter", hints: ["Where was the circumcenter of the right triangle?"], why: "Acute: inside. Right: on the hypotenuse. Obtuse: outside." },
      { type: "choice", kicker: "Use it", prompt: "Three towns want to share one fire station that is the same distance from each town. Where should it be built?",
        options: [{ t: "At the circumcenter of the triangle the towns form" }, { t: "At the incenter of that triangle", fb: "The incenter is equidistant from the sides: the roads between the towns, not the towns." }, { t: "At the midpoint between two of the towns", fb: "That is equidistant from two towns only." }],
        answer: 0, skill: "Circumcenter", hints: ["The towns are the vertices."], why: "The circumcenter is equidistant from the three vertices." }
    ]
  });

  /* ========================================== 5-3 · Medians and altitudes of triangles */
  var HOW_5_3 = [["Median", "A median joins a vertex to the midpoint of the opposite side. The three medians meet at the centroid."],
                 ["Two thirds", "The centroid is two thirds of the way along each median, measured from the vertex."],
                 ["Find", "Vertex to centroid is $\\frac{2}{3}$ of the median. Centroid to midpoint is the other $\\frac{1}{3}$."]];
  var FIG_MED = medFig(0, "M", "Triangle ABC with its three medians, which cross at G. The median from A meets BC at its midpoint M."),
      FIG_MEDB = medFig(1, "N", "Triangle ABC with its three medians, which cross at G. The median from B meets AC at its midpoint N."),
      FIG_ORTH = grid([-1, 7], [-1, 5], [{ poly: [[0, 0], [6, 0], [2, 4]], names: "ABC" }, { seg: [[2, 4], [2, 0]], dash: true, c: "orange" }, { seg: [[0, 0], [3, 3]], dash: true, c: "green" }, { pt: [2, 2], name: "H", at: "e", c: "orange" }],
        { u: 30, alt: "A coordinate grid. Triangle ABC has A at the origin, B at (6, 0) and C at (2, 4). A dashed segment drops from C straight down to AB. Another runs from A to side BC, meeting it at a right angle. They cross at H, (2, 2)." });
  LESSONS.push({
    title: "Medians and altitudes of triangles",
    blurb: "Book 5-3 · The centroid divides each median in the ratio 2 to 1, and the altitudes meet at the orthocenter.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $\\frac{2}{3}$ of 12?", answer: 8, skill: "Fractions of a number",
        near: [{ v: 4, fb: "That is one third. Take two of them." }, { v: 18, fb: "That is 12 divided by $\\frac{2}{3}$. Multiply instead." }], hints: ["One third of 12 is 4."], why: "$12 \\div 3 = 4$, and $2 \\cdot 4 = 8$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **median** of a triangle joins a vertex to the midpoint of the opposite side. The three medians meet at the **centroid**, the triangle's balance point. **Centroid Theorem:** the centroid is $\\frac{2}{3}$ of the way from each vertex to the midpoint of the opposite side.",
        scene: { type: "method", how: HOW_5_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the centroid split a median. $AM = 12$.",
        scene: { type: "walk", how: HOW_5_3, rows: [
          { step: 1, m: "\\overline{AM} \\text{ is a median}", say: "$M$ is the midpoint of $\\overline{BC}$, and $G$ is the centroid.", fig: FIG_MED },
          { step: 2, m: "AG = \\frac{2}{3}AM", say: "The Centroid Theorem." },
          { step: 3, m: "AG = \\frac{2}{3}(12) = 8", say: "From the vertex to the centroid.",
            ask: { prompt: "What is $\\frac{2}{3}$ of 12?", answer: 0,
                   options: [{ t: "8" }, { t: "4", fb: "That is one third of 12." }] } },
          { step: 3, m: "GM = 12 - 8 = 4", say: "The other third. $AG$ is twice $GM$." }] },
        gate: true, then: "The long part is next to the vertex." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $G$ is the centroid and $BG = 10$. Find $BN$ and $GN$.", art: FIG_MEDB,
        how: HOW_5_3, skill: "Centroid Theorem",
        steps: [
          { step: 1, ask: "$N$ is the midpoint of $\\overline{AC}$. What is $\\overline{BN}$?", type: "choice", answer: 0,
            options: [{ t: "A median" }, { t: "An altitude", fb: "An altitude meets the opposite side at a right angle. This segment goes to the midpoint." }],
            m: "\\overline{BN} \\text{ is a median}", say: "From a vertex to the midpoint of the opposite side." },
          { step: 2, ask: "What fraction of the median $\\overline{BN}$ is $\\overline{BG}$?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{2}{3}$" }, { t: "$\\frac{1}{3}$", fb: "$\\overline{BG}$ is the part next to the vertex: the longer part." }, { t: "$\\frac{1}{2}$", fb: "The centroid is not the midpoint of the median." }],
            m: "BG = \\frac{2}{3}BN", say: "From the vertex: two thirds." },
          { step: 3, ask: "$10 = \\frac{2}{3}BN$. What is $BN$?", type: "num", answer: 15, near: [{ v: 20 / 3, tol: 0.01, fb: "$BN$ is the whole median: longer than 10. Multiply 10 by $\\frac{3}{2}$." }], hint: "Multiply both sides by $\\frac{3}{2}$.",
            m: "BN = 15", say: "$10 \\cdot \\frac{3}{2} = 15$." },
          { step: 3, ask: "So what is $GN$?", type: "num", answer: 5, hint: "$BN - BG$.",
            m: "GN = 15 - 10 = 5", say: "One third of 15." }],
        why: "Median, two thirds, find. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$G$ is the centroid of a triangle, on the median $\\overline{CP}$. $CP = 21$. Find $CG$.", answer: 14, skill: "Centroid Theorem",
        near: [{ v: 7, fb: "That is $GP$, the short part. $CG$ starts at the vertex." }],
        hints: ["$CG = \\frac{2}{3}CP$."], why: "$\\frac{2}{3}(21) = 14$." },
      { type: "pair", prompt: "A triangle has vertices $(0, 0)$, $(6, 0)$ and $(3, 9)$. The centroid's coordinates are the averages of the vertices' coordinates. Find the centroid. Type it as $(x, y)$.", answer: [3, 3], skill: "Centroid Theorem",
        near: [{ v: [9, 9], fb: "Those are the sums. Divide each by 3." }, { v: [4.5, 4.5], fb: "There are three vertices: divide by 3." }],
        hints: ["Add the three $x$s and divide by 3. Then the same for the $y$s."], why: "$\\left(\\frac{0 + 6 + 3}{3}, \\frac{0 + 0 + 9}{3}\\right) = (3, 3)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "An **altitude** is the perpendicular segment from a vertex to the line containing the opposite side. The three altitudes meet at the **orthocenter**. Find it for this triangle.",
        scene: { type: "walk", how: [["One", "Write the equation of one altitude."], ["Another", "Write the equation of a second altitude."], ["Meet", "Find where the two cross."]], rows: [
          { step: 1, m: "x = 2", say: "$\\overline{AB}$ is horizontal, so the altitude from $C(2, 4)$ is vertical.", fig: FIG_ORTH },
          { step: 2, m: "\\text{slope of } \\overline{BC} = \\frac{4 - 0}{2 - 6} = -1", say: "The altitude from $A$ is perpendicular to $\\overline{BC}$." },
          { step: 2, m: "y = x", say: "Through $A(0, 0)$ with slope 1.",
            ask: { prompt: "What slope is perpendicular to $-1$?", answer: 0,
                   options: [{ t: "$1$" }, { t: "$-1$", fb: "That is parallel. Take the opposite reciprocal." }] } },
          { step: 3, m: "H(2, 2)", say: "On $y = x$, when $x = 2$, $y = 2$. This is the orthocenter." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Where is the orthocenter of a right triangle?",
        options: [{ t: "At the vertex of the right angle" }, { t: "At the midpoint of the hypotenuse", fb: "That is the circumcenter." }, { t: "Outside the triangle", fb: "That happens in an obtuse triangle." }],
        answer: 0, skill: "Altitudes", hints: ["Each leg is perpendicular to the other leg. So each leg is an altitude."], why: "The two legs are altitudes, and they meet at the right angle." },
      { type: "spotline", kicker: "Find the error",
        prompt: "$G$ is the centroid, on the median $\\overline{AM}$, and $AM = 18$. Find $AG$. Tap the line where the work **first** goes wrong.",
        lines: ["AM = 18", "AG = \\frac{1}{3}(18)", "AG = 6"], answer: 1, fix: "AG = \\frac{2}{3}(18)",
        fb: { 0: GIVEN, 2: LATER }, skill: "Centroid Theorem",
        hints: ["$\\overline{AG}$ starts at the vertex. Is it the longer part or the shorter?"],
        why: "From the vertex it is two thirds: $AG = 12$. The 6 is $GM$." },
      { type: "choice", kicker: "Use it", prompt: "A triangular wooden sign of even thickness is to hang level from a single hook. Above which point should the hook be fixed?",
        options: [{ t: "The centroid" }, { t: "The orthocenter", fb: "The altitudes do not balance the triangle." }, { t: "The circumcenter", fb: "The circumcenter can even be outside the triangle." }],
        answer: 0, skill: "Centroid Theorem", hints: ["Which point is the balance point?"], why: "The centroid is the triangle's centre of gravity." }
    ]
  });
  /* ========================================== 5-4 · The Triangle Midsegment Theorem */
  var HOW_5_4 = [["Midpoints", "A midsegment joins the midpoints of two sides of a triangle."],
                 ["Parallel", "It is parallel to the third side."],
                 ["Half", "Its length is half the length of the third side."]];
  var FIG_MIDG = grid([-1, 7], [-1, 5], [{ poly: [[0, 0], [6, 0], [2, 4]], names: "ABC" }, { seg: [[1, 2], [4, 2]], c: "orange" }, { pt: [1, 2], name: "D", at: "nw", c: "orange" }, { pt: [4, 2], name: "E", at: "ne", c: "orange" }],
        { u: 30, alt: "A coordinate grid. Triangle ABC has A at the origin, B at (6, 0) and C at (2, 4). D at (1, 2) and E at (4, 2) are joined by a segment." }),
      FIG_MID22 = midFig({ ab: "22", angs: ["48°", null, null], alt: "Triangle ABC. D is the midpoint of AC and E is the midpoint of BC, and segment DE joins them. AB is 22 and the angle at A is 48 degrees." }),
      FIG_MIDX = midFig({ ab: "5x − 4", de: "2x + 1", alt: "Triangle ABC. D is the midpoint of AC and E is the midpoint of BC. DE is 2x + 1 and AB is 5x − 4." }),
      FIG_MID3 = (function () {
        var P = T5, D = GT.mid(P[0], P[2]), E = GT.mid(P[1], P[2]), F2 = GT.mid(P[0], P[1]);
        return shapes([[P, { names: "ABC", sides: ["18", "14", "10"] }], [[D, E, F2], { c: "orange", fill: true }]], { alt: "Triangle ABC with sides AB = 18, BC = 14 and CA = 10. The midpoints of its three sides are joined to make a smaller triangle inside it." });
      })(),
      FIG_LAKE = midFig({ ab: "lake", de: "85 m", alt: "Triangle ABC. AB crosses a lake. D is the midpoint of AC and E is the midpoint of BC, and DE is 85 metres." });
  LESSONS.push({
    title: "The Triangle Midsegment Theorem",
    blurb: "Book 5-4 · A midsegment is parallel to the third side and half as long.",
    mins: 12, v: 4,
    steps: [
      { type: "pair", kicker: "Warm up", prompt: "Find the midpoint of the segment from $(0, 0)$ to $(2, 4)$. Type it as $(x, y)$.", answer: [1, 2], skill: "Midpoint Formula",
        near: [{ v: [2, 4], fb: "That is the endpoint. Halve each coordinate." }], hints: ["Average the $x$s and average the $y$s."], why: "$\\left(\\frac{2}{2}, \\frac{4}{2}\\right) = (1, 2)$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **midsegment** of a triangle joins the midpoints of two of its sides. Every triangle has three. **Triangle Midsegment Theorem:** a midsegment is parallel to the third side, and half as long.",
        scene: { type: "method", how: HOW_5_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the theorem checked on the coordinate plane.",
        scene: { type: "walk", how: HOW_5_4, rows: [
          { step: 1, m: "D(1, 2) \\qquad E(4, 2)", say: "The midpoints of $\\overline{AC}$ and $\\overline{BC}$. So $\\overline{DE}$ is a midsegment.", fig: FIG_MIDG },
          { step: 2, m: "\\text{slope of } \\overline{DE} = 0 \\qquad \\text{slope of } \\overline{AB} = 0", say: "Both are horizontal, so they are parallel." },
          { step: 3, m: "DE = 4 - 1 = 3", say: "Count along the grid line.",
            ask: { prompt: "$\\overline{AB}$ runs from $(0, 0)$ to $(6, 0)$. How long is it?", answer: 0,
                   options: [{ t: "6" }, { t: "3", fb: "That is $DE$. $\\overline{AB}$ goes from 0 to 6." }] } },
          { step: 3, m: "AB = 6", say: "$DE = \\frac{1}{2}AB$, just as the theorem says." }] },
        gate: true, then: "Parallel to the third side, and half of it." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $\\overline{DE}$ is a midsegment. Find $DE$ and $m\\angle CDE$.", art: FIG_MID22,
        how: HOW_5_4, skill: "Midsegment Theorem",
        steps: [
          { step: 1, ask: "$D$ and $E$ are the midpoints of two sides. What is $\\overline{DE}$?", type: "choice", answer: 0,
            options: [{ t: "A midsegment" }, { t: "A median", fb: "A median starts at a vertex. $\\overline{DE}$ joins two midpoints." }],
            m: "\\overline{DE} \\text{ is a midsegment}", say: "It joins the midpoints of $\\overline{AC}$ and $\\overline{BC}$." },
          { step: 2, ask: "Which side is $\\overline{DE}$ parallel to?", type: "choice", answer: 0,
            options: [{ t: "$\\overline{AB}$" }, { t: "$\\overline{AC}$", fb: "$D$ is on $\\overline{AC}$. The midsegment is parallel to the side it does not touch." }],
            m: "\\overline{DE} \\parallel \\overline{AB}", say: "The third side." },
          { step: 3, ask: "What is $DE$?", type: "num", answer: 11, near: [{ v: 44, fb: "Half of the third side, not double." }], hint: "Half of 22.",
            m: "DE = \\frac{1}{2}(22) = 11", say: "Half of $AB$." },
          { step: 3, ask: "$\\angle CDE$ and $\\angle A$ are corresponding angles on parallel lines. What is $m\\angle CDE$, in degrees?", type: "num", answer: 48, hint: "Corresponding angles on parallel lines are congruent.",
            m: "m\\angle CDE = 48°", say: "Corresponding angles are congruent." }],
        why: "Midpoints, parallel, half. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A midsegment of a triangle is 9 cm long. How long is the side it is parallel to?", post: "cm", answer: 18, skill: "Midsegment Theorem",
        near: [{ v: 4.5, fb: "The midsegment is the half. The side is twice as long." }],
        hints: ["The midsegment is half of that side."], why: "$2 \\cdot 9 = 18$." },
      { type: "num", prompt: "Find $x$.", art: FIG_MIDX, pre: "$x =$", answer: 6, skill: "Midsegment Theorem",
        near: [{ v: 5 / 3, tol: 0.01, fb: "The two are not equal: the third side is **twice** the midsegment." }],
        hints: ["$AB = 2 \\cdot DE$, so $5x - 4 = 2(2x + 1)$."], why: "$5x - 4 = 4x + 2$, so $x = 6$. $DE = 13$ and $AB = 26$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Join all three midpoints and you get the **midsegment triangle**. Find its perimeter.",
        scene: { type: "walk", how: [["Sides", "Each side of the midsegment triangle is a midsegment."], ["Halve", "Each is half of the side it is parallel to."], ["Add", "Add the three."]], rows: [
          { step: 1, m: "\\text{three midsegments}", say: "One parallel to each side of $\\triangle ABC$.", fig: FIG_MID3 },
          { step: 2, m: "\\frac{1}{2}(18) = 9 \\qquad \\frac{1}{2}(14) = 7", say: "Half of $AB$ and half of $BC$." },
          { step: 2, m: "\\frac{1}{2}(10) = 5", say: "Half of $CA$.",
            ask: { prompt: "What is half of 10?", answer: 0,
                   options: [{ t: "5" }, { t: "20", fb: "Half, not double." }] } },
          { step: 3, m: "9 + 7 + 5 = 21", say: "Half the perimeter of $\\triangle ABC$, which is 42." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A triangle has sides of 8, 12 and 16. Find the perimeter of its midsegment triangle.", answer: 18, skill: "Midsegment Theorem",
        near: [{ v: 36, fb: "That is the perimeter of the big triangle. Each midsegment is half a side." }, { v: 72, fb: "Each midsegment is half a side, not double." }],
        hints: ["The midsegments are 4, 6 and 8."], why: "$4 + 6 + 8 = 18$." },
      { type: "choice", kicker: "Find the error",
        prompt: "$\\overline{DE}$ is a midsegment of $\\triangle ABC$, parallel to $\\overline{AB}$, and $AB = 14$. Tom writes $DE = 28$. What is wrong?",
        options: [{ t: "He doubled. The midsegment is half the third side: $DE = 7$." },
                  { t: "The midsegment equals the third side: $DE = 14$.", fb: "It is half as long, not equal." },
                  { t: "Nothing. $2 \\cdot 14 = 28$.", fb: "The midsegment is the shorter one." }],
        answer: 0, skill: "Midsegment Theorem", hints: ["Which is longer: the midsegment, or the side?"], why: "$DE = \\frac{1}{2}AB = 7$." },
      { type: "num", kicker: "Use it", prompt: "To find the width $AB$ of a lake, a surveyor walks to $C$, marks the midpoints $D$ and $E$ of $\\overline{CA}$ and $\\overline{CB}$, and measures $DE$. How wide is the lake?", art: FIG_LAKE, post: "m", answer: 170, skill: "Midsegment Theorem",
        near: [{ v: 42.5, fb: "The midsegment is the half. The lake is twice as wide." }],
        hints: ["$\\overline{DE}$ is a midsegment."], why: "$AB = 2 \\cdot 85 = 170$ m." }
    ]
  });

  /* ============================== 5-5 · Indirect proof and inequalities in one triangle */
  var HOW_5_5 = [["Opposite", "In a triangle, the larger angle is opposite the longer side."],
                 ["Sum", "Any two sides add to more than the third. To test three lengths, check that the two shorter ones add to more than the longest."],
                 ["Range", "A third side lies between the difference and the sum of the other two."]];
  var FIG_KLM = tri([[0, 0], [5, 0], [1.61, 2.43]], { names: "KML", sides: ["12", "10", "7"] }, "Triangle KML. KM is 12, ML is 10 and LK is 7."),
      FIG_PQR5 = tri([[0, 0], [5, 0], [1.86, 3.49]], { names: "PQR", angs: ["62°", "48°", null] }, "Triangle PQR. The angle at P is 62 degrees and the angle at Q is 48 degrees.");
  LESSONS.push({
    title: "Indirect proof and inequalities in one triangle",
    blurb: "Book 5-5 · Proof by contradiction, sides and angles in order, and the Triangle Inequality.",
    mins: 13, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which statement is true?",
        options: [{ t: "$5 + 7 > 11$" }, { t: "$5 + 7 < 11$", fb: "$5 + 7 = 12$, which is more than 11." }, { t: "$5 + 7 = 11$", fb: "$5 + 7 = 12$." }],
        answer: 0, skill: "Compare numbers", hints: ["Add first."], why: "$12 > 11$." },
      { type: "choice", kicker: "Explore", prompt: "In an **indirect proof** you assume the opposite of what you want to prove, then reason until something impossible appears. To prove “a triangle cannot have two right angles”, what do you assume first?",
        options: [{ t: "A triangle has two right angles" }, { t: "A triangle has no right angles", fb: "That is not the opposite of the statement." }, { t: "A triangle cannot have two right angles", fb: "That is what you want to prove. Assume its opposite." }],
        answer: 0, skill: "Indirect proof", hints: ["Assume the statement is false."],
        why: "Then two angles already add to 180°, leaving 0° for the third. That is impossible, so the assumption is false and the statement is true." },
      { type: "learn", kicker: "The idea",
        prompt: "Sides and angles of a triangle keep the same order: the longest side is opposite the largest angle. And the **Triangle Inequality Theorem** says any two sides add to more than the third. Otherwise the two short sides could not reach each other.",
        scene: { type: "method", how: HOW_5_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch all three facts read from $\\triangle KLM$.",
        scene: { type: "walk", how: HOW_5_5, rows: [
          { step: 1, m: "\\angle L \\text{ is the largest angle}", say: "It is opposite the longest side, $KM = 12$.", fig: FIG_KLM },
          { step: 1, m: "\\angle M \\text{ is the smallest angle}", say: "It is opposite the shortest side, $LK = 7$.",
            ask: { prompt: "Which angle is opposite the shortest side, $\\overline{LK}$?", answer: 0,
                   options: [{ t: "$\\angle M$" }, { t: "$\\angle K$", fb: "$K$ is an endpoint of $\\overline{LK}$. The opposite angle is at the vertex not on that side." }] } },
          { step: 2, m: "7 + 10 > 12", say: "The two shorter sides add to more than the longest. The triangle can exist." },
          { step: 3, m: "10 - 7 < s < 10 + 7", say: "What could a third side be, with sides of 7 and 10?" },
          { step: 3, m: "3 < s < 17", say: "Longer than the difference, shorter than the sum." }] },
        gate: true, then: "Opposite, sum, range." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. In $\\triangle DEF$, $DE = 5$, $EF = 9$ and $DF = 12$.",
        how: HOW_5_5, skill: "Triangle Inequality",
        steps: [
          { step: 1, ask: "Which angle is the largest?", type: "choice", answer: 0,
            options: [{ t: "$\\angle E$" }, { t: "$\\angle D$", fb: "$D$ is an endpoint of the longest side, $\\overline{DF}$. The largest angle is opposite that side." }, { t: "$\\angle F$", fb: "$F$ is an endpoint of the longest side, $\\overline{DF}$. The largest angle is opposite that side." }],
            m: "\\angle E \\text{ is the largest angle}", say: "It is opposite the longest side, $DF = 12$." },
          { step: 2, ask: "Check that the triangle can exist. Add the two shorter sides: $5 + 9$.", type: "num", answer: 14, hint: "$5 + 9$.",
            m: "5 + 9 = 14 > 12", say: "More than the longest side, so the triangle can exist." },
          { step: 3, ask: "With sides of 5 and 9, a third side must be more than the difference, $9 - 5$. What is that?", type: "num", answer: 4, hint: "$9 - 5$.",
            m: "s > 4", say: "The difference of the two sides." },
          { step: 3, ask: "And less than the sum. Which range is right?", type: "choice", answer: 0,
            options: [{ t: "$4 < s < 14$" }, { t: "$5 < s < 9$", fb: "Those are the two sides themselves. Use their difference and their sum." }],
            m: "4 < s < 14", say: "12 is inside the range, as it has to be." }],
        why: "Opposite, sum, range. Now two on your own." },
      { type: "order", kicker: "On your own", prompt: "In $\\triangle ABC$, $AB = 5$, $BC = 8$ and $AC = 6$. Put the angles in order, from smallest to largest.",
        items: [nb("$\\angle C$ (opposite $AB = 5$)"), nb("$\\angle B$ (opposite $AC = 6$)"), nb("$\\angle A$ (opposite $BC = 8$)")],
        skill: "Sides and angles in order", hints: ["The smallest angle is opposite the shortest side."],
        why: "The angles follow the order of the sides opposite them: 5, 6, 8." },
      { type: "sort", prompt: "Can these three lengths be the sides of a triangle?",
        bins: ["A triangle", "Not a triangle"],
        cards: [{ t: "3, 4, 5", bin: 0, fb: "$3 + 4 = 7$, which is more than 5." }, { t: "2, 3, 6", bin: 1, fb: "$2 + 3 = 5$, which is less than 6." },
                { t: "5, 5, 9", bin: 0, fb: "$5 + 5 = 10$, which is more than 9." }, { t: "4, 4, 8", bin: 1, fb: "$4 + 4 = 8$: equal is not enough. The sides would lie flat." },
                { t: "7, 10, 16", bin: 0, fb: "$7 + 10 = 17$, which is more than 16." }, { t: "1, 2, 4", bin: 1, fb: "$1 + 2 = 3$, which is less than 4." }],
        skill: "Triangle Inequality", hints: ["Add the two shorter lengths. Is the sum more than the longest?"],
        why: "The two shorter sides must add to **more** than the longest." },
      { type: "learn", kicker: "A harder case",
        prompt: "Angles can put the **sides** in order. List the sides of $\\triangle PQR$ from shortest to longest.",
        scene: { type: "walk", how: [["Third", "Find the third angle."], ["Opposite", "Find the side opposite each angle."], ["Order", "The sides follow the same order as the angles opposite them."]], rows: [
          { step: 1, m: "m\\angle R = 180 - 62 - 48 = 70°", say: "The Triangle Sum Theorem.", fig: FIG_PQR5 },
          { step: 2, m: "\\angle Q = 48° \\text{ is opposite } \\overline{PR}", say: "The smallest angle, so $\\overline{PR}$ is the shortest side." },
          { step: 2, m: "\\angle R = 70° \\text{ is opposite } \\overline{PQ}", say: "The largest angle, so $\\overline{PQ}$ is the longest side.",
            ask: { prompt: "Which side is opposite $\\angle R$?", answer: 0,
                   options: [{ t: "$\\overline{PQ}$" }, { t: "$\\overline{QR}$", fb: "$R$ is an endpoint of $\\overline{QR}$. The opposite side does not touch $R$." }] } },
          { step: 3, m: "PR < QR < PQ", say: "Opposite 48°, 62° and 70°." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Two sides of a triangle are 6 and 11. Which range gives every possible length $s$ of the third side?",
        options: [{ t: "$5 < s < 17$" }, { t: "$6 < s < 11$", fb: "Those are the two sides. Use their difference and their sum." }, { t: "$s > 17$", fb: "The third side must be **shorter** than the sum of the other two." }],
        answer: 0, skill: "Triangle Inequality", hints: ["$11 - 6$ and $11 + 6$."], why: "More than $11 - 6 = 5$ and less than $11 + 6 = 17$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Jon says sticks of 3, 5 and 8 make a triangle, because $3 + 5 = 8$. What is wrong?",
        options: [{ t: "The sum must be greater than the third side, not equal to it. These sticks lie flat." },
                  { t: "He should have checked $3 + 8$.", fb: "$3 + 8 > 5$ is true, but the test that matters is the two shortest against the longest." },
                  { t: "Nothing. They just reach.", fb: "Just reaching makes a straight line, not a triangle." }],
        answer: 0, skill: "Triangle Inequality", hints: ["Read the theorem: greater than, or equal to?"], why: "$3 + 5$ is not greater than 8." },
      { type: "choice", kicker: "Use it", prompt: "Towns A and B are 30 km apart, and towns B and C are 50 km apart, both in a straight line. Which of these cannot be the straight-line distance between A and C?",
        options: [{ t: "85 km" }, { t: "40 km", fb: "40 is between 20 and 80, so it is possible." }, { t: "75 km", fb: "75 is between 20 and 80, so it is possible." }],
        answer: 0, skill: "Triangle Inequality", hints: ["The distance is between $50 - 30$ and $50 + 30$."], why: "It must be less than $30 + 50 = 80$ km." }
    ]
  });

  /* ================================================ 5-6 · Inequalities in two triangles */
  var HOW_5_6 = [["Two pairs", "Check that two pairs of sides are congruent."],
                 ["Compare", "Compare the included angles, or compare the third sides."],
                 ["Conclude", "The larger included angle is opposite the longer third side, and the other way round."]];
  var FIG_H1 = hingeFig("ABC", "DEF", 40, 75, { alt: "Triangles ABC and DEF. AB and DE each carry one tick mark; CA and FD each carry two. The angle at A is 40 degrees and the angle at D is 75 degrees." }),
      FIG_H2 = hingeFig("JKL", "MNP", 48, 66, { s1: null, s2: null, t1: "8", t2: "11", alt: "Triangles JKL and MNP. JK and MN each carry one tick mark; LJ and PM each carry two. KL is 8 and NP is 11." }),
      FIG_H3 = hingeFig("RST", "UVW", 110, 95, { alt: "Triangles RST and UVW. RS and UV each carry one tick mark; TR and WU each carry two. The angle at R is 110 degrees and the angle at U is 95 degrees." }),
      FIG_H4 = hingeFig("ABC", "DEF", 42, 60, { s1: "(2x + 10)°", s2: "60°", t1: "9", t2: "12", alt: "Triangles ABC and DEF with two pairs of congruent sides. The angle at A is 2x + 10 degrees and BC is 9. The angle at D is 60 degrees and EF is 12." }),
      FIG_H5 = hingeFig("ABC", "DEF", 35, 50, { t1: "5x − 8", t2: "22", alt: "Triangles ABC and DEF with two pairs of congruent sides. The angle at A is 35 degrees and BC is 5x − 8. The angle at D is 50 degrees and EF is 22." });
  LESSONS.push({
    title: "Inequalities in two triangles",
    blurb: "Book 5-6 · The Hinge Theorem: a wider angle between the same two sides opens a longer third side.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "You swing a door open wider. What happens to the gap between the door's free edge and the door frame?",
        options: [{ t: "It gets wider" }, { t: "It gets narrower", fb: "Opening the door moves its edge away from the frame." }, { t: "It stays the same", fb: "The door and the frame keep their lengths, but the gap between them changes." }],
        answer: 0, skill: "Hinge Theorem", hints: ["Picture the hinge angle growing."], why: "A bigger angle at the hinge makes a bigger opening. That is the Hinge Theorem." },
      { type: "learn", kicker: "The idea",
        prompt: "**Hinge Theorem:** if two sides of one triangle are congruent to two sides of another, the triangle with the larger included angle has the longer third side. The **converse** works too: the longer third side is opposite the larger included angle.",
        scene: { type: "method", how: HOW_5_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $BC$ and $EF$ compared.",
        scene: { type: "walk", how: HOW_5_6, rows: [
          { step: 1, m: "\\overline{AB} \\cong \\overline{DE} \\qquad \\overline{CA} \\cong \\overline{FD}", say: "Two pairs of congruent sides, shown by the tick marks.", fig: FIG_H1 },
          { step: 2, m: "m\\angle A = 40° \\qquad m\\angle D = 75°", say: "The included angles." },
          { step: 2, m: "m\\angle D > m\\angle A", say: "$\\angle D$ is larger.",
            ask: { prompt: "Which included angle is larger?", answer: 0,
                   options: [{ t: "$\\angle D$, at 75°" }, { t: "$\\angle A$, at 40°", fb: "40 is less than 75." }] } },
          { step: 3, m: "EF > BC", say: "Hinge Theorem: the larger angle opens the longer side." }] },
        gate: true, then: "Same two sides, bigger angle, longer third side." },
      { type: "guided", kicker: "Together",
        prompt: "Now the converse. Compare $m\\angle J$ and $m\\angle M$.", art: FIG_H2,
        how: HOW_5_6, skill: "Hinge Theorem",
        steps: [
          { step: 1, ask: "Are two pairs of sides congruent?", type: "choice", answer: 0,
            options: [{ t: "Yes: one tick with one tick, two ticks with two ticks" }, { t: "No", fb: "$\\overline{JK} \\cong \\overline{MN}$ and $\\overline{LJ} \\cong \\overline{PM}$." }],
            m: "\\overline{JK} \\cong \\overline{MN} \\qquad \\overline{LJ} \\cong \\overline{PM}", say: "Two pairs." },
          { step: 2, ask: "Which third side is longer?", type: "choice", answer: 0,
            options: [{ t: "$NP = 11$" }, { t: "$KL = 8$", fb: "8 is less than 11." }],
            m: "NP > KL", say: "11 is more than 8." },
          { step: 3, ask: "So which included angle is larger?", type: "choice", answer: 0,
            options: [{ t: "$\\angle M$" }, { t: "$\\angle J$", fb: "$\\angle J$ is opposite the shorter third side." }],
            m: "m\\angle M > m\\angle J", say: "Converse of the Hinge Theorem." }],
        why: "Two pairs, compare, conclude. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Compare $ST$ and $VW$.", art: FIG_H3,
        options: [{ t: "$ST > VW$" }, { t: "$ST < VW$", fb: "110° is the larger included angle, and it is in $\\triangle RST$." }, { t: "$ST = VW$", fb: "The included angles differ, so the third sides do too." }],
        answer: 0, skill: "Hinge Theorem", hints: ["Which included angle is larger?"], why: "$110° > 95°$, so the side opposite it is longer: $ST > VW$." },
      { type: "num", prompt: "Use the converse of the Hinge Theorem to finish the inequality.", art: FIG_H4, pre: "$x <$", answer: 25, skill: "Hinge Theorem",
        near: [{ v: 35, fb: "Subtract 10 from 60 before dividing by 2." }],
        hints: ["$BC = 9$ is the shorter third side, so $\\angle A$ is the smaller angle.", "$2x + 10 < 60$."], why: "$2x < 50$, so $x < 25$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Find **every** possible value of $x$. A length has to be positive, and that gives a second inequality.",
        scene: { type: "walk", how: [["Hinge", "Use the Hinge Theorem to compare the third sides."], ["Upper", "Solve that inequality."], ["Lower", "A length is more than 0. Solve that inequality too."]], rows: [
          { step: 1, m: "5x - 8 < 22", say: "35° is the smaller included angle, so $BC$ is the shorter side.", fig: FIG_H5 },
          { step: 2, m: "5x < 30", say: "Add 8 to both sides." },
          { step: 2, m: "x < 6", say: "Divide by 5." },
          { step: 3, m: "5x - 8 > 0", say: "$BC$ is a length.",
            ask: { prompt: "Solve $5x - 8 > 0$.", answer: 0,
                   options: [{ t: "$x > 1.6$" }, { t: "$x > 8$", fb: "Add 8, then divide by 5: $x > \\frac{8}{5}$." }] } },
          { step: 3, m: "1.6 < x < 6", say: "Both conditions together." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Two triangles have two pairs of congruent sides. The third side opposite a 40° included angle is $3x - 6$. The third side opposite a 65° included angle is 21. Which range gives every value of $x$?",
        options: [{ t: "$2 < x < 9$" }, { t: "$x > 9$", fb: "40° is the smaller angle, so $3x - 6$ is the **shorter** side: $3x - 6 < 21$." }, { t: "$x < 2$", fb: "Then $3x - 6$ would be negative, and a length cannot be." }],
        answer: 0, skill: "Hinge Theorem", hints: ["$3x - 6 < 21$, and $3x - 6 > 0$."], why: "$3x < 27$ gives $x < 9$. $3x > 6$ gives $x > 2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Two triangles have **one** pair of congruent sides. The angle at one end of that side is larger in the first triangle. Sara says the first triangle's opposite side is longer, by the Hinge Theorem. What is wrong?",
        options: [{ t: "The Hinge Theorem needs two pairs of congruent sides, with the angle between them." },
                  { t: "The larger angle gives the shorter side.", fb: "With two pairs of congruent sides, the larger included angle gives the **longer** side." },
                  { t: "Nothing. A larger angle always means a longer side.", fb: "Only when the two sides that form the angle are the same in both triangles." }],
        answer: 0, skill: "Hinge Theorem", hints: ["How many pairs of sides does the theorem ask for?"], why: "Two pairs of sides and their included angles." },
      { type: "choice", kicker: "Use it", prompt: "Two identical pairs of compasses are opened, one to 35° and the other to 50°. Which has its points farther apart?",
        options: [{ t: "The one opened to 50°" }, { t: "The one opened to 35°", fb: "The smaller angle gives the smaller gap." }, { t: "Neither: the arms are the same length", fb: "The arms match, but the angles between them differ." }],
        answer: 0, skill: "Hinge Theorem", hints: ["Same two arms, different included angles."], why: "Hinge Theorem: the larger included angle is opposite the longer third side." }
    ]
  });
  /* ==================================================== 5-7 · The Pythagorean Theorem */
  var HOW_5_7 = [["Hypotenuse", "Find the hypotenuse $c$: the side opposite the right angle. The other two sides are the legs, $a$ and $b$."],
                 ["Substitute", "Put the lengths you know into $a^2 + b^2 = c^2$."],
                 ["Solve", "Solve for the missing side, and simplify the square root."]];
  var FIG_46 = rt(4.5, 3, ["6", "c", "4"], "Right triangle ABC with the right angle at A. Leg AB is 6, leg CA is 4 and the hypotenuse BC is c."),
      FIG_817 = rt(4.8, 2.56, ["a", "17", "8"], "Right triangle ABC with the right angle at A. Leg AB is a, leg CA is 8 and the hypotenuse BC is 17."),
      FIG_71012 = tri([[0, 0], [5, 0], [1.61, 2.43]], { names: "ABC", sides: ["12", "10", "7"] }, "Triangle ABC with sides AB = 12, BC = 10 and CA = 7.");
  LESSONS.push({
    title: "The Pythagorean Theorem",
    blurb: "Book 5-7 · Find a side of a right triangle, and use the squares of the sides to classify any triangle.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $\\sqrt{36 + 64}$.", answer: 10, skill: "Square roots",
        near: [{ v: 14, fb: "Add first, then take the root: $\\sqrt{100}$." }], hints: ["$36 + 64 = 100$."], why: "$\\sqrt{100} = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Pythagorean Theorem:** in a right triangle with legs $a$ and $b$ and hypotenuse $c$, $a^2 + b^2 = c^2$. Three whole numbers that fit, such as 3, 4, 5, are a **Pythagorean triple**. The **converse** is true too: if $a^2 + b^2 = c^2$, the triangle is a right triangle.",
        scene: { type: "method", how: HOW_5_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the hypotenuse found, in simplest radical form.",
        scene: { type: "walk", how: HOW_5_7, rows: [
          { step: 1, m: "c \\text{ is the hypotenuse}", say: "It is opposite the right angle. The legs are 4 and 6.", fig: FIG_46 },
          { step: 2, m: "4^2 + 6^2 = c^2", say: "Legs on the left, hypotenuse on the right." },
          { step: 3, m: "52 = c^2", say: "$16 + 36$.",
            ask: { prompt: "What is $4^2 + 6^2$?", answer: 0,
                   options: [{ t: "52" }, { t: "100", fb: "That is $(4 + 6)^2$. Square each leg first, then add." }, { t: "20", fb: "$4^2$ is 16, not 8." }] } },
          { step: 3, m: "c = \\sqrt{52}", say: "Take the positive square root." },
          { step: 3, m: "c = 2\\sqrt{13}", say: "$52 = 4 \\cdot 13$, and $\\sqrt{4} = 2$." }] },
        gate: true, then: "Square, add, root, simplify." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find a leg.", art: FIG_817,
        how: HOW_5_7, skill: "Pythagorean Theorem",
        steps: [
          { step: 1, ask: "Which side is the hypotenuse?", type: "choice", answer: 0,
            options: [{ t: "The side of 17" }, { t: "The side of 8", fb: "That side touches the right angle: it is a leg." }],
            m: "c = 17", say: "Opposite the right angle, and the longest side." },
          { step: 2, ask: "Which equation is right?", type: "choice", answer: 0,
            options: [{ t: "$a^2 + 8^2 = 17^2$" }, { t: "$8^2 + 17^2 = a^2$", fb: "17 is the hypotenuse, so $17^2$ stands alone." }],
            m: "a^2 + 8^2 = 17^2", say: "Legs on the left." },
          { step: 3, ask: "$a^2 + 64 = 289$. What is $a^2$?", type: "num", answer: 225, near: [{ v: 353, fb: "Subtract 64, do not add it." }], hint: "$289 - 64$.",
            m: "a^2 = 225", say: "$289 - 64$." },
          { step: 3, ask: "So what is $a$?", type: "num", answer: 15, hint: "Which number squared is 225?",
            m: "a = 15", say: "8, 15, 17 is a Pythagorean triple." }],
        why: "Hypotenuse, substitute, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "The legs of a right triangle are 9 and 12. Find the hypotenuse.", answer: 15, skill: "Pythagorean Theorem",
        near: [{ v: 21, fb: "Square each leg, add, then take the root." }, { v: 225, fb: "That is $c^2$. Take its square root." }],
        hints: ["$9^2 + 12^2 = c^2$."], why: "$81 + 144 = 225$, and $\\sqrt{225} = 15$." },
      { type: "num", prompt: "A right triangle has a hypotenuse of 25 and a leg of 7. Find the other leg.", answer: 24, skill: "Pythagorean Theorem",
        near: [{ v: 18, fb: "Subtract the squares, not the lengths: $25^2 - 7^2$." }, { v: 576, fb: "That is the leg squared. Take its square root." }],
        hints: ["$7^2 + b^2 = 25^2$."], why: "$625 - 49 = 576$, and $\\sqrt{576} = 24$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The squares also classify triangles that are **not** right. With $c$ the longest side: if $c^2 > a^2 + b^2$ the triangle is obtuse, and if $c^2 < a^2 + b^2$ it is acute. Classify this one.",
        scene: { type: "walk", how: [["Longest", "Call the longest side $c$."], ["Compare", "Compare $c^2$ with $a^2 + b^2$."], ["Classify", "Equal: right. Greater: obtuse. Less: acute."]], rows: [
          { step: 1, m: "c = 12", say: "The longest side. The others are 7 and 10.", fig: FIG_71012 },
          { step: 2, m: "c^2 = 144", say: "$12^2$." },
          { step: 2, m: "a^2 + b^2 = 49 + 100 = 149", say: "$7^2 + 10^2$.",
            ask: { prompt: "Which is greater?", answer: 0,
                   options: [{ t: "$a^2 + b^2 = 149$" }, { t: "$c^2 = 144$", fb: "144 is less than 149." }] } },
          { step: 3, m: "c^2 < a^2 + b^2", say: "The longest side is a little too short to make a right angle." },
          { step: 3, m: "\\text{acute triangle}", say: "The angle opposite $c$ is less than 90°." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "Each card lists the three sides of a triangle. Classify the triangle.",
        bins: ["Acute", "Right", "Obtuse"],
        cards: [{ t: "5, 12, 13", bin: 1, fb: "$25 + 144 = 169 = 13^2$." }, { t: "4, 5, 6", bin: 0, fb: "$36 < 16 + 25 = 41$." },
                { t: "3, 5, 7", bin: 2, fb: "$49 > 9 + 25 = 34$." }, { t: "8, 15, 17", bin: 1, fb: "$64 + 225 = 289 = 17^2$." },
                { t: "6, 7, 10", bin: 2, fb: "$100 > 36 + 49 = 85$." }, { t: "7, 8, 9", bin: 0, fb: "$81 < 49 + 64 = 113$." }],
        skill: "Classify by sides squared", hints: ["Square the longest side. Compare it with the sum of the squares of the other two."],
        why: "Equal: right. Greater: obtuse. Less: acute." },
      { type: "spotline", kicker: "Find the error",
        prompt: "A right triangle has a hypotenuse of 13 and a leg of 5. Find the other leg, $b$. Tap the line where the work **first** goes wrong.",
        lines: ["c = 13 \\qquad a = 5", "5^2 + 13^2 = b^2", "b = \\sqrt{194}"], answer: 1, fix: "5^2 + b^2 = 13^2",
        fb: { 0: GIVEN, 2: LATER }, skill: "Pythagorean Theorem",
        hints: ["Which side is the hypotenuse? Where does it go in the formula?"],
        why: "The hypotenuse stands alone: $25 + b^2 = 169$, so $b = 12$." },
      { type: "num", kicker: "Use it", prompt: "A wheelchair ramp rises 20 cm over a level run of 21 cm. How long is the sloping surface of the ramp?", post: "cm", answer: 29, skill: "Pythagorean Theorem",
        near: [{ v: 41, fb: "The ramp is the hypotenuse: square, add, then take the root." }],
        hints: ["$20^2 + 21^2 = c^2$."], why: "$400 + 441 = 841$, and $\\sqrt{841} = 29$." }
    ]
  });

  /* ============================================ 5-8 · Applying special right triangles */
  var HOW_5_8 = [["Which", "Is it 45°-45°-90°, with two equal legs? Or 30°-60°-90°, half of an equilateral triangle?"],
                 ["Ratio", "45°-45°-90°: legs $x$ and $x$, hypotenuse $x\\sqrt{2}$. 30°-60°-90°: short leg $x$, long leg $x\\sqrt{3}$, hypotenuse $2x$."],
                 ["Find", "Find $x$ from the side you know. Then find the others."]];
  var T_45 = [[0, 0], [3, 0], [0, 3]], T_36 = [[0, 0], [2.2, 0], [0, 3.81]];
  var FIG_45 = tri(T_45, { names: "ABC", right: [0], angs: [null, "45°", "45°"], sides: ["7", "?", "7"] }, "Right triangle ABC with the right angle at A and 45 degree angles at B and C. Both legs are 7. The hypotenuse is marked with a question mark."),
      FIG_30 = tri(T_36, { names: "DEF", right: [0], angs: [null, "60°", "30°"], sides: [null, "18", null] }, "Right triangle DEF with the right angle at D, a 60 degree angle at E and a 30 degree angle at F. The hypotenuse EF is 18."),
      FIG_30L = tri(T_36, { names: "DEF", right: [0], angs: [null, "60°", "30°"], sides: ["x", null, "12"] }, "Right triangle DEF with the right angle at D, a 60 degree angle at E and a 30 degree angle at F. The short leg DE is x and the long leg FD is 12."),
      FIG_45H = tri(T_45, { names: "JKL", right: [0], angs: [null, "45°", "45°"], sides: [null, "10", null] }, "Right triangle JKL with the right angle at J and 45 degree angles at K and L. The hypotenuse KL is 10."),
      FIG_EQH = shapes([[[[0, 0], [4, 0], [2, 3.46]], { names: "RST", sides: ["10", "10", "10"] }]], { extra: [{ seg: [[2, 3.46], [2, 0]], dash: true, c: "orange" }, { angle: [[4, 0], [2, 0], [2, 3.46]], right: true, c: "orange" }, { word: "h", at: [2.3, 1.5], eq: true, c: "orange" }],
        alt: "Equilateral triangle RST with every side 10. A dashed height h drops from T to the midpoint of RS, meeting it at a right angle." });
  LESSONS.push({
    title: "Applying special right triangles",
    blurb: "Book 5-8 · The side ratios of the 45°-45°-90° and 30°-60°-90° triangles.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Simplify $\\sqrt{50}$.",
        options: [{ t: "$5\\sqrt{2}$" }, { t: "$2\\sqrt{5}$", fb: "$2\\sqrt{5} = \\sqrt{20}$. Look for a square factor of 50: $25 \\cdot 2$." }, { t: "$25$", fb: "That is half of 50. $25^2$ is 625." }],
        answer: 0, skill: "Simplify radicals", hints: ["$50 = 25 \\cdot 2$."], why: "$\\sqrt{25 \\cdot 2} = 5\\sqrt{2}$." },
      { type: "learn", kicker: "The idea",
        prompt: "Two right triangles turn up so often that their sides are worth knowing. Cut a square along its diagonal: a **45°-45°-90°** triangle, with sides $x$, $x$, $x\\sqrt{2}$. Cut an equilateral triangle down its height: a **30°-60°-90°** triangle, with sides $x$, $x\\sqrt{3}$, $2x$.",
        scene: { type: "method", how: HOW_5_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the hypotenuse of this triangle found without the Pythagorean Theorem.",
        scene: { type: "walk", how: HOW_5_8, rows: [
          { step: 1, m: "45°\\text{-}45°\\text{-}90°", say: "Two 45° angles, so the two legs are equal.", fig: FIG_45 },
          { step: 2, m: "x \\qquad x \\qquad x\\sqrt{2}", say: "Leg, leg, hypotenuse." },
          { step: 3, m: "x = 7", say: "Each leg is 7.",
            ask: { prompt: "The hypotenuse is $x\\sqrt{2}$. What is it when $x = 7$?", answer: 0,
                   options: [{ t: "$7\\sqrt{2}$" }, { t: "$14$", fb: "That is $2x$, which belongs to the 30°-60°-90° triangle." }] } },
          { step: 3, m: "BC = 7\\sqrt{2} \\approx 9.9", say: "The hypotenuse is a leg times $\\sqrt{2}$." }] },
        gate: true, then: "Check with Pythagoras: $7^2 + 7^2 = 98$, and $(7\\sqrt{2})^2 = 98$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find both legs of $\\triangle DEF$.", art: FIG_30,
        how: HOW_5_8, skill: "Special right triangles",
        steps: [
          { step: 1, ask: "Which special triangle is it?", type: "choice", answer: 0,
            options: [{ t: "30°-60°-90°" }, { t: "45°-45°-90°", fb: "Its acute angles are 30° and 60°, not two of 45°." }],
            m: "30°\\text{-}60°\\text{-}90°", say: "Its acute angles are 30° and 60°." },
          { step: 2, ask: "What are its sides, from shortest to longest?", type: "choice", answer: 0,
            options: [{ t: "$x$, $x\\sqrt{3}$, $2x$" }, { t: "$x$, $x$, $x\\sqrt{2}$", fb: "Those are the sides of a 45°-45°-90° triangle." }],
            m: "x \\qquad x\\sqrt{3} \\qquad 2x", say: "Short leg, long leg, hypotenuse." },
          { step: 3, ask: "The hypotenuse is $2x = 18$. What is the short leg, $x$?", type: "num", answer: 9, near: [{ v: 36, fb: "The hypotenuse is twice the short leg, so halve it." }], hint: "Half of 18.",
            m: "DE = 9", say: "The short leg is opposite the 30° angle." },
          { step: 3, ask: "What is the long leg, $x\\sqrt{3}$?", type: "choice", answer: 0,
            options: [{ t: "$9\\sqrt{3}$" }, { t: "$18\\sqrt{3}$", fb: "Multiply the **short leg** by $\\sqrt{3}$, not the hypotenuse." }, { t: "$9\\sqrt{2}$", fb: "$\\sqrt{2}$ belongs to the 45°-45°-90° triangle." }],
            m: "FD = 9\\sqrt{3}", say: "The long leg is opposite the 60° angle." }],
        why: "Which, ratio, find. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Find the length of each leg.", art: FIG_45H,
        options: [{ t: "$5\\sqrt{2}$" }, { t: "$10\\sqrt{2}$", fb: "A leg is shorter than the hypotenuse. Divide by $\\sqrt{2}$." }, { t: "$5$", fb: "Halving is for the 30°-60°-90° triangle. Here divide by $\\sqrt{2}$." }],
        answer: 0, skill: "Special right triangles", hints: ["$x\\sqrt{2} = 10$, so $x = \\frac{10}{\\sqrt{2}}$."], why: "$\\frac{10}{\\sqrt{2}} = \\frac{10\\sqrt{2}}{2} = 5\\sqrt{2}$." },
      { type: "num", prompt: "The short leg of a 30°-60°-90° triangle is 6. Find the hypotenuse.", answer: 12, skill: "Special right triangles",
        near: [{ v: 3, fb: "The hypotenuse is the longest side: twice the short leg." }],
        hints: ["The hypotenuse is $2x$."], why: "$2 \\cdot 6 = 12$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When you know the **long** leg, you must divide by $\\sqrt{3}$. Find the short leg and the hypotenuse.",
        scene: { type: "walk", how: [["Equation", "Set the long leg equal to $x\\sqrt{3}$."], ["Divide", "Divide by $\\sqrt{3}$, and clear the root from the denominator."], ["Double", "The hypotenuse is twice the short leg."]], rows: [
          { step: 1, m: "x\\sqrt{3} = 12", say: "The long leg is opposite the 60° angle.", fig: FIG_30L },
          { step: 2, m: "x = \\frac{12}{\\sqrt{3}}", say: "Divide both sides by $\\sqrt{3}$." },
          { step: 2, m: "x = \\frac{12\\sqrt{3}}{3} = 4\\sqrt{3}", say: "Multiply top and bottom by $\\sqrt{3}$.",
            ask: { prompt: "What is $\\sqrt{3} \\cdot \\sqrt{3}$?", answer: 0,
                   options: [{ t: "3" }, { t: "9", fb: "$\\sqrt{3} \\cdot \\sqrt{3}$ is the number whose root was taken: 3." }] } },
          { step: 3, m: "EF = 2(4\\sqrt{3}) = 8\\sqrt{3}", say: "The hypotenuse is $2x$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Find the height $h$ of this equilateral triangle.", art: FIG_EQH,
        options: [{ t: "$5\\sqrt{3}$" }, { t: "$10\\sqrt{3}$", fb: "The short leg is half the side: 5, not 10." }, { t: "$5$", fb: "5 is the short leg. The height is the long leg: $x\\sqrt{3}$." }],
        answer: 0, skill: "Special right triangles", hints: ["The height cuts it into two 30°-60°-90° triangles, with hypotenuse 10 and short leg 5."], why: "The long leg is $5\\sqrt{3}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "The short leg of a 30°-60°-90° triangle is 4. Ben says the hypotenuse is $4\\sqrt{3}$. What is wrong?",
        options: [{ t: "$4\\sqrt{3}$ is the long leg. The hypotenuse is $2x = 8$." },
                  { t: "The hypotenuse is $4\\sqrt{2}$.", fb: "$\\sqrt{2}$ belongs to the 45°-45°-90° triangle." },
                  { t: "Nothing. The hypotenuse is $x\\sqrt{3}$.", fb: "The sides are $x$, $x\\sqrt{3}$ and $2x$. The largest is $2x$." }],
        answer: 0, skill: "Special right triangles", hints: ["Which is larger: $\\sqrt{3}$ or 2?"], why: "The hypotenuse is the longest side: $2x = 8$." },
      { type: "num", kicker: "Use it", prompt: "A square floor tile has sides of 20 cm. Find the length of its diagonal, to the nearest centimetre.", post: "cm", answer: 28, skill: "Special right triangles",
        near: [{ v: 40, fb: "The diagonal is a side times $\\sqrt{2}$, not times 2." }, { v: 35, fb: "That is $20\\sqrt{3}$. A square's diagonal makes 45°-45°-90° triangles." }],
        hints: ["The diagonal makes two 45°-45°-90° triangles: $20\\sqrt{2}$.", "$\\sqrt{2} \\approx 1.414$."], why: "$20\\sqrt{2} \\approx 28.3$, which rounds to 28." }
    ]
  });
  /* ================================================================ Skills */
  var TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29]];
  // p x + q = r x − t, both equal to v at the chosen x: [x, v, left, right].
  function equalPair(R, lo, hi) {
    var x = R.int(3, 9), p = R.int(2, 3), r = p + R.int(1, 2), q = R.int(lo || 2, hi || 9), v = p * x + q, t = r * x - v;
    if (t <= 0) { x = 9; r = p + 2; v = p * x + q; t = r * x - v; }
    return [x, v, poly([[p, "x"], [q, ""]]), poly([[r, "x"], [-t, ""]]), (q + t) + " = " + (r - p) + "x"];
  }
  var SKILLS = [
    { id: "hg5-bisector", title: "Perpendicular and angle bisectors", lesson: 2,
      gen: function (R) {
        var k = R.int(0, 3), E = equalPair(R);
        if (k === 0) return { type: "num", prompt: "$P$ is on the perpendicular bisector of $\\overline{AB}$. $PA = " + E[2] + "$ and $PB = " + E[3] + "$. Find $PA$.", art: pbFig({ pa: E[2].replace(/-/g, "−"), pb: E[3].replace(/-/g, "−"), alt: "Segment AB with its perpendicular bisector, and a point P on the bisector joined to A and to B." }), answer: E[1],
          near: near(E[1], [{ v: E[0], fb: "That is $x$. Substitute it to find $PA$." }]), hints: ["$PA = PB$: $" + E[2] + " = " + E[3] + "$.", "$x = " + E[0] + "$. Now substitute."], why: "$" + E[4] + "$, so $x = " + E[0] + "$ and $PA = " + E[1] + "$." };
        if (k === 1) return { type: "num", prompt: "$P$ is on the bisector of an angle. Its distances to the two sides of the angle are $" + E[2] + "$ and $" + E[3] + "$. Find $x$.", pre: "$x =$", answer: E[0],
          near: near(E[0], [{ v: E[1], fb: "That is the distance. The question asks for $x$." }]), hints: ["A point on an angle bisector is equidistant from the sides: $" + E[2] + " = " + E[3] + "$."], why: "$" + E[4] + "$, so $x = " + E[0] + "$." };
        if (k === 2) { var h = R.int(4, 15);
          return { type: "num", prompt: "Line $ℓ$ is the perpendicular bisector of $\\overline{AB}$ and crosses it at $M$. $AM = " + h + "$. Find $AB$.", answer: 2 * h,
            near: near(2 * h, [{ v: h, fb: "$M$ is the midpoint, so $\\overline{AB}$ is twice $\\overline{AM}$." }]), hints: ["$M$ is the midpoint of $\\overline{AB}$."], why: "$2 \\cdot " + h + " = " + (2 * h) + "$." }; }
        var a = [R.int(-4, 2), R.int(-4, 2)], b = [a[0] + 2 * R.int(1, 3), a[1] + 2 * R.int(1, 3)];
        return { type: "pair", prompt: "The perpendicular bisector of the segment from $" + pt(a) + "$ to $" + pt(b) + "$ passes through one point of the segment. Which? Type it as $(x, y)$.", answer: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
          near: [{ v: [a[0] + b[0], a[1] + b[1]], fb: "Those are the sums. Divide each by 2." }], hints: ["A bisector passes through the midpoint."], why: "The midpoint: $" + pt([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) + "$." };
      } },
    { id: "hg5-centers", title: "Circumcenter and incenter", lesson: 3,
      gen: function (R) {
        var k = R.int(0, 3);
        if (k === 0) { var a = R.int(2, 7), b = R.int(2, 6);
          return { type: "pair", prompt: "A right triangle has vertices $(0, 0)$, $(" + 2 * a + ", 0)$ and $(0, " + 2 * b + ")$. Its circumcenter is where the lines $x = " + a + "$ and $y = " + b + "$ cross. Type the circumcenter as $(x, y)$.", answer: [a, b],
            near: [{ v: [b, a], fb: "On the line $x = " + a + "$, the $x$-coordinate is " + a + "." }], hints: ["A point on $x = " + a + "$ and on $y = " + b + "$."], why: "$(" + a + ", " + b + ")$: the midpoint of the hypotenuse." }; }
        if (k === 1) { var ang = 2 * R.int(15, 55);
          return { type: "num", prompt: "$P$ is the incenter of $\\triangle ABC$, and $m\\angle BAC = " + ang + "°$. Find $m\\angle PAB$.", post: "°", answer: ang / 2,
            near: near(ang / 2, [{ v: ang, fb: "$\\overline{AP}$ bisects the angle: take half." }]), hints: ["The incenter is on every angle bisector."], why: "$" + ang + " \\div 2 = " + (ang / 2) + "$." }; }
        if (k === 2) { var Q = R.pick([["equidistant from the three vertices", "Circumcenter"], ["equidistant from the three sides", "Incenter"], ["where the perpendicular bisectors of the sides meet", "Circumcenter"], ["where the angle bisectors meet", "Incenter"], ["the centre of the circle through all three vertices", "Circumcenter"], ["the centre of the circle that touches all three sides", "Incenter"]]);
          return mc(R, { prompt: "Which point of a triangle is " + Q[0] + "?", right: Q[1],
            wrong: [{ t: Q[1] === "Circumcenter" ? "Incenter" : "Circumcenter", fb: Q[1] === "Circumcenter" ? "The incenter goes with the angle bisectors and the sides." : "The circumcenter goes with the perpendicular bisectors and the vertices." }, { t: "Centroid", fb: "The centroid is where the medians meet." }],
            hints: ["Circum-: round the outside, through the vertices. In-: inside, touching the sides."], why: Q[1] === "Circumcenter" ? "The circumcenter goes with the perpendicular bisectors and the vertices." : "The incenter goes with the angle bisectors and the sides." }); }
        var E = equalPair(R);
        return { type: "num", prompt: "$P$ is the circumcenter of $\\triangle ABC$. $PA = " + E[2] + "$ and $PB = " + E[3] + "$. Find $PC$.", answer: E[1],
          near: near(E[1], [{ v: E[0], fb: "That is $x$. $PC = PA$: substitute." }]), hints: ["$PA = PB = PC$.", "$" + E[2] + " = " + E[3] + "$ gives $x = " + E[0] + "$."], why: "$x = " + E[0] + "$, so $PC = PA = " + E[1] + "$." };
      } },
    { id: "hg5-centroid", title: "Medians and the centroid", lesson: 4,
      gen: function (R) {
        var k = R.int(0, 3), t = R.int(2, 12);
        if (k === 0) return { type: "num", prompt: "$G$ is the centroid of a triangle, on the median $\\overline{AM}$. $AM = " + 3 * t + "$. Find $AG$.", answer: 2 * t,
          near: near(2 * t, [{ v: t, fb: "That is $GM$, the short part. $\\overline{AG}$ starts at the vertex." }]), hints: ["$AG = \\frac{2}{3}AM$."], why: "$\\frac{2}{3}(" + 3 * t + ") = " + 2 * t + "$." };
        if (k === 1) return { type: "num", prompt: "$G$ is the centroid of a triangle, on the median $\\overline{AM}$. $AG = " + 2 * t + "$. Find $AM$.", answer: 3 * t,
          near: near(3 * t, [{ v: 4 * t, fb: "$AG$ is two thirds of the median, not half of it." }]), hints: ["$" + 2 * t + " = \\frac{2}{3}AM$: multiply by $\\frac{3}{2}$."], why: "$" + 2 * t + " \\cdot \\frac{3}{2} = " + 3 * t + "$." };
        if (k === 2) return { type: "num", prompt: "$G$ is the centroid of a triangle, on the median $\\overline{AM}$. $AG = " + 2 * t + "$. Find $GM$.", answer: t,
          near: near(t, [{ v: 2 * t, fb: "The two parts are not equal: $GM$ is half of $AG$." }]), hints: ["$AG$ is twice $GM$."], why: "$" + 2 * t + " \\div 2 = " + t + "$." };
        var gx = R.int(-2, 4), gy = R.int(1, 4), A = [R.int(-5, 0), 0], B = [R.int(3, 8), 0], C = [3 * gx - A[0] - B[0], 3 * gy];
        return { type: "pair", prompt: "Find the centroid of the triangle with vertices $" + pt(A) + "$, $" + pt(B) + "$ and $" + pt(C) + "$. Type it as $(x, y)$.", answer: [gx, gy],
          near: [{ v: [3 * gx, 3 * gy], fb: "Those are the sums. Divide each by 3." }], hints: ["Average the three $x$s, and average the three $y$s."], why: "$\\left(\\frac{" + 3 * gx + "}{3}, \\frac{" + 3 * gy + "}{3}\\right) = " + pt([gx, gy]) + "$." };
      } },
    { id: "hg5-midsegment", title: "Triangle midsegments", lesson: 5,
      gen: function (R) {
        var k = R.int(0, 3), n = R.int(4, 20);
        if (k === 0) return { type: "num", prompt: "A side of a triangle is " + 2 * n + " cm long. How long is the midsegment parallel to it?", post: "cm", answer: n,
          near: near(n, [{ v: 4 * n, fb: "Half of the side, not double." }]), hints: ["A midsegment is half the side it is parallel to."], why: "$" + 2 * n + " \\div 2 = " + n + "$." };
        if (k === 1) return { type: "num", prompt: "A midsegment of a triangle is " + n + " cm long. How long is the side parallel to it?", post: "cm", answer: 2 * n,
          near: near(2 * n, [{ v: n / 2, fb: "The side is the longer one: twice the midsegment." }]), hints: ["The side is twice its midsegment."], why: "$2 \\cdot " + n + " = " + 2 * n + "$." };
        if (k === 2) { var x = R.int(3, 9), p = R.int(1, 3), q = R.int(1, 6), mid = p * x + q, r = 2 * p + 1, t = r * x - 2 * mid;
          if (t <= 0) { x = 2 * q + 2; mid = p * x + q; t = r * x - 2 * mid; }
          return { type: "num", prompt: "A midsegment of a triangle measures $" + poly([[p, "x"], [q, ""]]) + "$. The side parallel to it measures $" + poly([[r, "x"], [-t, ""]]) + "$. Find $x$.", pre: "$x =$", answer: x,
            near: near(x, [{ v: (q + t) / (r - p), tol: 0.01, fb: "They are not equal: the side is **twice** the midsegment." }]),
            hints: ["$" + poly([[r, "x"], [-t, ""]]) + " = 2(" + poly([[p, "x"], [q, ""]]) + ")$."], why: "$" + poly([[r, "x"], [-t, ""]]) + " = " + poly([[2 * p, "x"], [2 * q, ""]]) + "$, so $x = " + x + "$." }; }
        var a = 2 * R.int(3, 8), b = 2 * R.int(4, 9), c = 2 * R.int(5, 9);
        if (a + b <= c) c = a + b - 2;
        return { type: "num", prompt: "A triangle has sides of " + a + ", " + b + " and " + c + ". Find the perimeter of its midsegment triangle.", answer: (a + b + c) / 2,
          near: near((a + b + c) / 2, [{ v: a + b + c, fb: "That is the perimeter of the big triangle. Each midsegment is half a side." }]), hints: ["The midsegments are " + a / 2 + ", " + b / 2 + " and " + c / 2 + "."], why: "$" + a / 2 + " + " + b / 2 + " + " + c / 2 + " = " + (a + b + c) / 2 + "$." };
      } },
    { id: "hg5-inequality", title: "Inequalities in one triangle", lesson: 6,
      gen: function (R) {
        var k = R.int(0, 3), a = R.int(3, 9), b = a + R.int(1, 6);
        if (k === 0) { var ok = R.chance(0.5), c = ok ? b + R.int(0, a - 2) : a + b + R.int(0, 3);
          return mc(R, { prompt: "Can " + a + ", " + b + " and " + c + " be the sides of a triangle?", right: ok ? "Yes" : "No", keep: true,
            wrong: [{ t: ok ? "No" : "Yes", fb: "$" + a + " + " + b + " = " + (a + b) + "$. Compare that with " + c + "." }],
            hints: ["Add the two shorter lengths. Is the sum more than the longest?"], why: "$" + a + " + " + b + " = " + (a + b) + "$, which is " + (ok ? "more than " + c + "." : (a + b === c ? "equal to " : "less than ") + c + ", so they cannot meet to make a triangle.") }); }
        if (k === 1) { var up = R.chance(0.5);
          return { type: "num", prompt: "Two sides of a triangle are " + a + " and " + b + ". The third side must be " + (up ? "less" : "greater") + " than what number?", answer: up ? a + b : b - a,
            near: near(up ? a + b : b - a, [{ v: up ? b - a : a + b, fb: up ? "That is the lower limit, the difference. The upper limit is the sum." : "That is the upper limit, the sum. The lower limit is the difference." }]),
            hints: ["The third side is between the difference and the sum of the other two."], why: "$" + (b - a) + " < s < " + (a + b) + "$." }; }
        var N = R.pick(["ABC", "PQR", "XYZ", "JKL"]), S = R.shuffle([a, b, b + R.int(1, 3)]);
        if (S[0] + S[1] + S[2] - 2 * Math.max(S[0], S[1], S[2]) <= 0) S = [5, 7, 9];
        // Side i joins vertices i and i+1, so it is opposite vertex i+2.
        var want = k === 2 ? Math.max : Math.min, i = S.indexOf(want.apply(null, S)), opp = N[(i + 2) % 3];
        return mc(R, { prompt: "In $\\triangle " + N + "$, $" + N[0] + N[1] + " = " + S[0] + "$, $" + N[1] + N[2] + " = " + S[1] + "$ and $" + N[2] + N[0] + " = " + S[2] + "$. Which angle is the " + (k === 2 ? "largest" : "smallest") + "?", right: "$\\angle " + opp + "$", keep: true,
          wrong: N.split("").filter(function (v) { return v !== opp; }).map(function (v) { return { t: "$\\angle " + v + "$", fb: "The " + (k === 2 ? "largest" : "smallest") + " angle is opposite the " + (k === 2 ? "longest" : "shortest") + " side, which is " + S[i] + "." }; }),
          hints: ["Find the " + (k === 2 ? "longest" : "shortest") + " side. The angle opposite it is at the vertex that side does not touch."], why: "The side of " + S[i] + " is opposite $\\angle " + opp + "$." });
      } },
    { id: "hg5-hinge", title: "The Hinge Theorem", lesson: 7,
      gen: function (R) {
        var k = R.int(0, 2), a1 = R.int(35, 70), a2 = a1 + R.int(12, 40), sw = R.chance(0.5), A = sw ? a2 : a1, D = sw ? a1 : a2;
        if (k === 0) return mc(R, { prompt: "Compare $BC$ and $EF$.", art: hingeFig("ABC", "DEF", A, D, { alt: "Two triangles with two pairs of congruent sides. The included angle at A is " + A + " degrees and the included angle at D is " + D + " degrees." }), right: A > D ? "$BC > EF$" : "$BC < EF$", keep: true,
          wrong: [{ t: A > D ? "$BC < EF$" : "$BC > EF$", fb: "The larger included angle is opposite the longer third side." }, { t: "$BC = EF$", fb: "The included angles differ, so the third sides differ too." }],
          hints: ["Which included angle is larger?"], why: "$" + Math.max(A, D) + "° > " + Math.min(A, D) + "°$, and the larger angle opens the longer side." });
        if (k === 1) { var s1 = R.int(6, 12), s2 = s1 + R.int(2, 6), T1 = sw ? s2 : s1, T2 = sw ? s1 : s2;
          return mc(R, { prompt: "Compare $m\\angle A$ and $m\\angle D$.", art: hingeFig("ABC", "DEF", sw ? 70 : 45, sw ? 45 : 70, { s1: null, s2: null, t1: String(T1), t2: String(T2), alt: "Two triangles with two pairs of congruent sides. The third side BC is " + T1 + " and the third side EF is " + T2 + "." }), right: T1 > T2 ? "$m\\angle A > m\\angle D$" : "$m\\angle A < m\\angle D$", keep: true,
            wrong: [{ t: T1 > T2 ? "$m\\angle A < m\\angle D$" : "$m\\angle A > m\\angle D$", fb: "The longer third side is opposite the larger included angle." }, { t: "$m\\angle A = m\\angle D$", fb: "The third sides differ, so the included angles differ too." }],
            hints: ["Which third side is longer?"], why: "$" + Math.max(T1, T2) + " > " + Math.min(T1, T2) + "$, and the longer side is opposite the larger angle." }); }
        var c = R.int(2, 5), x = R.int(4, 10), d = R.int(1, 9), big = c * x - d;
        return { type: "num", prompt: "Two triangles have two pairs of congruent sides. The third side opposite a " + a1 + "° included angle is $" + c + "x - " + d + "$. The third side opposite a " + a2 + "° included angle is " + big + ". Finish the inequality.", pre: "$x <$", answer: x,
          near: near(x, [{ v: (big - d) / c, tol: 0.01, fb: "Add " + d + " to both sides, do not subtract it." }]),
          hints: ["The smaller angle is opposite the shorter side: $" + c + "x - " + d + " < " + big + "$."], why: "$" + c + "x < " + (big + d) + "$, so $x < " + x + "$." };
      } },
    { id: "hg5-pythagorean", title: "The Pythagorean Theorem", lesson: 8,
      gen: function (R) {
        var k = R.int(0, 2), T = R.pick(TRIPLES);
        if (k === 0) return { type: "num", prompt: "The legs of a right triangle are " + T[0] + " and " + T[1] + ". Find the hypotenuse.", answer: T[2],
          near: near(T[2], [{ v: T[0] + T[1], fb: "Square each leg, add, then take the root." }, { v: T[2] * T[2], fb: "That is $c^2$. Take its square root." }]), hints: ["$" + T[0] + "^2 + " + T[1] + "^2 = c^2$."], why: "$" + T[0] * T[0] + " + " + T[1] * T[1] + " = " + T[2] * T[2] + "$, and $\\sqrt{" + T[2] * T[2] + "} = " + T[2] + "$." };
        if (k === 1) { var g = R.chance(0.5) ? 0 : 1, other = T[1 - g];
          return { type: "num", prompt: "A right triangle has a hypotenuse of " + T[2] + " and a leg of " + T[g] + ". Find the other leg.", answer: other,
            near: near(other, [{ v: T[2] - T[g], fb: "Subtract the squares, not the lengths." }]), hints: ["$" + T[g] + "^2 + b^2 = " + T[2] + "^2$."], why: "$" + T[2] * T[2] + " - " + T[g] * T[g] + " = " + other * other + "$, and $\\sqrt{" + other * other + "} = " + other + "$." }; }
        var kind = R.pick(["Acute", "Right", "Obtuse"]), a = T[0], b = T[1], c = kind === "Right" ? T[2] : kind === "Obtuse" ? T[2] + 1 : T[2] - 1;
        if (c <= b) { a = 6; b = 8; c = 9; kind = "Acute"; }
        if (a + b <= c) { a = 6; b = 8; c = 11; kind = "Obtuse"; }
        var cmp = c * c === a * a + b * b ? "=" : c * c > a * a + b * b ? ">" : "<";
        return mc(R, { prompt: "A triangle has sides of " + a + ", " + b + " and " + c + ". Classify it.", right: kind, keep: true,
          wrong: ["Acute", "Right", "Obtuse"].filter(function (v) { return v !== kind; }).map(function (v) { return { t: v, fb: "$" + c + "^2 = " + c * c + "$, and $" + a + "^2 + " + b + "^2 = " + (a * a + b * b) + "$. Compare them." }; }),
          hints: ["Compare $" + c + "^2$ with $" + a + "^2 + " + b + "^2$.", "Equal: right. Greater: obtuse. Less: acute."], why: "$" + c * c + " " + cmp + " " + (a * a + b * b) + "$: " + kind.toLowerCase() + "." });
      } },
    { id: "hg5-special", title: "Special right triangles", lesson: 9,
      gen: function (R) {
        var k = R.int(0, 4), n = R.int(2, 12);
        if (k === 0) return mc(R, { prompt: "Each leg of a 45°-45°-90° triangle is " + n + ". Find the hypotenuse.", right: "$" + n + "\\sqrt{2}$",
          wrong: [{ t: "$" + 2 * n + "$", fb: "Doubling belongs to the 30°-60°-90° triangle. Here the hypotenuse is a leg times $\\sqrt{2}$." }, { t: "$" + n + "\\sqrt{3}$", fb: "$\\sqrt{3}$ belongs to the 30°-60°-90° triangle." }],
          hints: ["Sides $x$, $x$, $x\\sqrt{2}$."], why: "The hypotenuse is a leg times $\\sqrt{2}$." });
        if (k === 1) return { type: "num", prompt: "The short leg of a 30°-60°-90° triangle is " + n + ". Find the hypotenuse.", answer: 2 * n,
          near: near(2 * n, [{ v: n / 2, fb: "The hypotenuse is the longest side: twice the short leg." }]), hints: ["Sides $x$, $x\\sqrt{3}$, $2x$."], why: "$2 \\cdot " + n + " = " + 2 * n + "$." };
        if (k === 2) return mc(R, { prompt: "The short leg of a 30°-60°-90° triangle is " + n + ". Find the long leg.", right: "$" + n + "\\sqrt{3}$",
          wrong: [{ t: "$" + 2 * n + "$", fb: "That is the hypotenuse, $2x$." }, { t: "$" + n + "\\sqrt{2}$", fb: "$\\sqrt{2}$ belongs to the 45°-45°-90° triangle." }],
          hints: ["Sides $x$, $x\\sqrt{3}$, $2x$."], why: "The long leg is the short leg times $\\sqrt{3}$." });
        if (k === 3) return { type: "num", prompt: "The hypotenuse of a 30°-60°-90° triangle is " + 2 * n + ". Find the short leg.", answer: n,
          near: near(n, [{ v: 4 * n, fb: "The short leg is half the hypotenuse, not double." }]), hints: ["$2x = " + 2 * n + "$."], why: "$" + 2 * n + " \\div 2 = " + n + "$." };
        return { type: "num", prompt: "The hypotenuse of a 45°-45°-90° triangle is $" + n + "\\sqrt{2}$. Find the length of each leg.", answer: n,
          near: near(n, [{ v: 2 * n, fb: "$x\\sqrt{2} = " + n + "\\sqrt{2}$, so $x$ is just " + n + "." }]), hints: ["$x\\sqrt{2} = " + n + "\\sqrt{2}$."], why: "Divide both sides by $\\sqrt{2}$: $x = " + n + "$." };
      } }
  ];
  L.unit("geo", 5, {
    title: "Properties and Attributes of Triangles",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Bisectors, the circumcenter and incenter, medians, and midsegments.",
        skills: ["hg5-bisector", "hg5-centers", "hg5-centroid", "hg5-midsegment"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "Inequalities in one triangle and in two.",
        skills: ["hg5-inequality", "hg5-hinge"], per: 3 },
      { title: "Quiz 3", after: 9, blurb: "The Pythagorean Theorem and the special right triangles.",
        skills: ["hg5-pythagorean", "hg5-special"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:5", {
    2: { name: "Bisectors", frame: "A point on the perpendicular bisector of a segment is [[equidistant]] from the segment's [[endpoints]]. A point on the bisector of an angle is equidistant from the angle's [[sides]].",
         chips: ["midpoints", "parallel"] },
    3: { name: "Circumcenter and incenter", frame: "The perpendicular bisectors of a triangle meet at the [[circumcenter]], equidistant from the three [[vertices]]. The angle bisectors meet at the [[incenter]], equidistant from the three [[sides]].",
         chips: ["centroid", "medians"] },
    4: { name: "Medians and altitudes", frame: "A [[median]] joins a vertex to the midpoint of the opposite side. The medians meet at the [[centroid]], two [[thirds]] of the way from each vertex. The altitudes meet at the [[orthocenter]].",
         chips: ["halves", "incenter"] },
    5: { name: "Midsegments", frame: "A midsegment joins the [[midpoints]] of two sides of a triangle. It is [[parallel]] to the third side and [[half]] as long.",
         chips: ["perpendicular", "twice"] },
    6: { name: "Inequalities in one triangle", frame: "The largest angle of a triangle is opposite the [[longest]] side. Any two sides add to [[more]] than the third. An indirect proof assumes the [[opposite]] and reaches a [[contradiction]].",
         chips: ["less", "shortest"] },
    7: { name: "The Hinge Theorem", frame: "When two triangles have two pairs of [[congruent]] sides, the larger [[included]] angle is opposite the [[longer]] third side.",
         chips: ["shorter", "parallel"] },
    8: { name: "The Pythagorean Theorem", frame: "In a right triangle, $a^2 + b^2 = c^2$, where $c$ is the [[hypotenuse]]. If $c^2$ is greater than $a^2 + b^2$ the triangle is [[obtuse]]. If it is less, the triangle is [[acute]].",
         chips: ["leg", "equilateral"] },
    9: { name: "Special right triangles", frame: "A 45°-45°-90° triangle has sides $x$, $x$ and [[x√2]]. A 30°-60°-90° triangle has sides $x$, [[x√3]] and [[2x]]. The short leg is opposite the [[30°]] angle.",
         chips: ["3x", "60°"] }
  });
})();
