/* ==========================================================================
   Geometry — Unit 7: Similarity. See lab/core.js for the format and
   lab/geotools.js for the drawing kit.

   Follows Holt Geometry, Chapter 7, section for section (7-1 to 7-6), after
   a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   Ratio and proportion (7-1), similar polygons (7-2), AA, SSS and SAS
   similarity (7-3), the Triangle Proportionality and Angle Bisector
   theorems (7-4), indirect measurement, scale drawings, and the ratios of
   perimeters and areas (7-5), and dilations on the coordinate plane (7-6).

   Lessons carry v: 4 (see Unit 1). Skills are hg7-….

   Seven lessons, seven skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  // Two similar triangles side by side: the second is the first scaled by k.
  function simTris(n1, n2, k, m1, m2, alt, P) {
    P = P || T0;
    var dx = Math.max.apply(null, P.map(function (p) { return p[0]; })) + 1.7;
    var Q = P.map(function (p) { return [dx + p[0] * k, p[1] * k]; });
    return shapes([[P, Object.assign({ names: n1 }, m1)], [Q, Object.assign({ names: n2, c: "green" }, m2 || {})]], { alt: alt });
  }
  // Triangle ABC with DE parallel to BC: D on AB and E on AC, a fraction t of the way down from A.
  // o.ad, o.db, o.ae, o.ec, o.de, o.bc: labels. o.names "ABCDE".
  function splitFig(t, o) {
    o = o || {};
    var A = [1.8, 4], B = [0, 0], C = [5.2, 0], D = [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])], E = [A[0] + t * (C[0] - A[0]), A[1] + t * (C[1] - A[1])], n = o.names || "ABCDE";
    return plain([-1.2, 6.4], [-0.9, 4.8], [{ poly: [B, C, A], c: "blue" }, { seg: [D, E], c: "orange" }]
      .concat(lab(o.ad, A, D, -1), lab(o.db, D, B, -1), lab(o.ae, A, E, 1), lab(o.ec, E, C, 1), lab(o.de, D, E, -1, 11), lab(o.bc, B, C, -1),
      [{ pt: A, name: n[0], at: "n" }, { pt: B, name: n[1], at: "sw" }, { pt: C, name: n[2], at: "se" }, { pt: D, name: n[3], at: "nw" }, { pt: E, name: n[4], at: "ne" }]), { u: 30, alt: o.alt });
  }
  // Triangle ABC with the bisector of angle A meeting BC at D. o.ab, o.ac, o.bd, o.dc: labels.
  function bisFig(o) {
    var A = [1.6, 3.8], B = [0, 0], C = [5.6, 0], ab = GT.dist(A, B), ac = GT.dist(A, C), D = [5.6 * ab / (ab + ac), 0];
    return plain([-1.1, 6.7], [-0.9, 4.6], [{ poly: [B, C, A], c: "blue" }, { seg: [A, D], c: "orange" }, { amarks: [B, A, D], n: 1, r: 24 }, { amarks: [D, A, C], n: 1, r: 28 }]
      .concat(lab(o.ab, A, B, -1), lab(o.ac, A, C, 1), lab(o.bd, B, D, -1), lab(o.dc, D, C, -1),
      [{ pt: A, name: "A", at: "n" }, { pt: B, name: "B", at: "sw" }, { pt: C, name: "C", at: "se" }, { pt: D, name: "D", at: "s", c: "orange" }]), { u: 30, alt: o.alt });
  }
  // Three parallel lines cut by two transversals. a, b: labels for the left transversal's two parts (upper, lower); c, d: the right one's.
  function threePar(a, b, c, d, alt) {
    function Lf(y) { return [1.5 - (3 - y) * 0.45, y]; }
    function Rt(y) { return [4.1 + (3 - y) * 0.4, y]; }
    function off(t) { return 13 + 4 * Math.max(0, String(t).length - 2); }   // longer labels stand further from the line
    var items = [3, 1.8, 0].map(function (y) { return { dline: [[-0.4, y], [6.4, y]], c: "blue" }; });
    items.push({ dline: [Lf(3.6), Lf(-0.6)], bare: true }, { dline: [Rt(3.6), Rt(-0.6)], bare: true });
    return plain([-0.8, 6.8], [-0.9, 3.9], items.concat(lab(a, Lf(3), Lf(1.8), -1, off(a)), lab(b, Lf(1.8), Lf(0), -1, off(b)), lab(c, Rt(3), Rt(1.8), 1, off(c)), lab(d, Rt(1.8), Rt(0), 1, off(d)),
      [3, 1.8, 0].map(function (y) { return { pt: Lf(y) }; }), [3, 1.8, 0].map(function (y) { return { pt: Rt(y) }; })), { u: 32, alt: alt });
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
    blurb: "Before Chapter 7 · Simplifying fractions, solving equations, and corresponding parts.",
    mins: 6, v: 4,
    steps: [
      { type: "choice", kicker: "Check 1 · Fractions", prompt: "Simplify $\\frac{12}{18}$.",
        options: [{ t: "$\\frac{2}{3}$" }, { t: "$\\frac{3}{2}$", fb: "That is turned over: 12 is the numerator." }, { t: "$\\frac{6}{9}$", fb: "That is equal, but it can be simplified more: divide by 3." }],
        answer: 0, skill: "Simplify fractions", hints: ["Divide the top and the bottom by 6."], why: "$12 \\div 6 = 2$ and $18 \\div 6 = 3$." },
      { type: "choice", prompt: "Which fraction is equal to $\\frac{6}{9}$?",
        options: [{ t: "$\\frac{10}{15}$" }, { t: "$\\frac{9}{12}$", fb: "$\\frac{9}{12} = \\frac{3}{4}$, but $\\frac{6}{9} = \\frac{2}{3}$." }, { t: "$\\frac{7}{10}$", fb: "Adding 1 to the top and the bottom changes the value." }],
        answer: 0, skill: "Equal fractions", hints: ["Simplify each one."], why: "Both simplify to $\\frac{2}{3}$." },
      { type: "num", kicker: "Check 2 · Equations", prompt: "Solve $8x = 60$.", pre: "$x =$", answer: 7.5, skill: "Solve an equation",
        near: [{ v: 52, fb: "Divide by 8, do not subtract it." }], hints: ["Divide both sides by 8."], why: "$60 \\div 8 = 7.5$." },
      { type: "num", prompt: "Solve $9(x + 2) = 90$.", pre: "$x =$", answer: 8, skill: "Solve an equation",
        near: [{ v: 10, fb: "That is $x + 2$. Subtract 2." }], hints: ["Divide by 9 first: $x + 2 = 10$."], why: "$x + 2 = 10$, so $x = 8$." },
      { type: "choice", kicker: "Check 3 · Corresponding parts", prompt: "$\\triangle ABC \\cong \\triangle DEF$. Which side corresponds to $\\overline{BC}$?",
        options: [{ t: "$\\overline{EF}$" }, { t: "$\\overline{DE}$", fb: "$\\overline{DE}$ matches $\\overline{AB}$: the first two letters." }, { t: "$\\overline{DF}$", fb: "$\\overline{DF}$ matches $\\overline{AC}$: the first and last letters." }],
        answer: 0, skill: "Corresponding parts", hints: ["$B$ and $C$ are the last two letters."], why: "The last two letters of each name." },
      { type: "num", prompt: "Two angles of a triangle measure 50° and 60°. Find the third.", post: "°", answer: 70, skill: "Triangle Sum Theorem",
        near: [{ v: 110, fb: "That is the sum of the two. Subtract it from 180." }], hints: ["The three add to 180°."], why: "$180 - 110 = 70$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 7-1**. If **check 3** slipped, see lessons 4-2 and 4-3. **Checks 1 and 2** are practised again in lesson 7-1.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ======================================================= 7-1 · Ratio and proportion */
  var HOW_7_1 = [["Proportion", "Write the proportion: two ratios set equal."],
                 ["Cross", "Cross-multiply: the product of the means equals the product of the extremes."],
                 ["Solve", "Solve the equation."]];
  LESSONS.push({
    title: "Ratio and proportion",
    blurb: "Book 7-1 · Write and simplify ratios, and solve proportions by cross-multiplying.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Simplify $\\frac{12}{18}$.",
        options: [{ t: "$\\frac{2}{3}$" }, { t: "$\\frac{3}{2}$", fb: "That is turned over: 12 is the numerator." }, { t: "$\\frac{6}{12}$", fb: "Subtracting 6 from each part changes the value. Divide instead." }],
        answer: 0, skill: "Simplify fractions", hints: ["Divide the top and the bottom by 6."], why: "$12 \\div 6 = 2$ and $18 \\div 6 = 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **ratio** compares two numbers by division: $a$ to $b$, $a : b$ or $\\frac{a}{b}$. A **proportion** says two ratios are equal: $\\frac{a}{b} = \\frac{c}{d}$. Here $a$ and $d$ are the **extremes**, and $b$ and $c$ are the **means**. **Cross Products Property:** $ad = bc$.",
        scene: { type: "method", how: HOW_7_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a proportion solved.",
        scene: { type: "walk", how: HOW_7_1, rows: [
          { step: 1, m: "\\frac{x}{12} = \\frac{5}{8}", say: "Two ratios set equal." },
          { step: 2, m: "8x = 12 \\cdot 5", say: "The extremes are $x$ and 8. The means are 12 and 5." },
          { step: 2, m: "8x = 60", say: "Multiply.",
            ask: { prompt: "What is $12 \\cdot 5$?", answer: 0,
                   options: [{ t: "60" }, { t: "17", fb: "Multiply, do not add." }] } },
          { step: 3, m: "x = 7.5", say: "Divide both sides by 8. Check: $\\frac{7.5}{12} = 0.625 = \\frac{5}{8}$." }] },
        gate: true, then: "Cross-multiplying turns a proportion into a one-line equation." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $\\frac{x + 2}{6} = \\frac{15}{9}$.",
        how: HOW_7_1, skill: "Solve proportions",
        steps: [
          { step: 1, ask: "Which two numbers are the means?", type: "choice", answer: 0,
            options: [{ t: "6 and 15" }, { t: "6 and 9", fb: "Those are the two denominators. The means are the middle terms when you read $a : b = c : d$." }],
            m: "\\frac{x + 2}{6} = \\frac{15}{9}", say: "Means 6 and 15. Extremes $x + 2$ and 9." },
          { step: 2, ask: "Cross-multiply. Which equation do you get?", type: "choice", answer: 0,
            options: [{ t: "$9(x + 2) = 6 \\cdot 15$" }, { t: "$6(x + 2) = 9 \\cdot 15$", fb: "Multiply across the equals sign: $x + 2$ goes with 9." }],
            m: "9(x + 2) = 90", say: "Extremes on one side, means on the other." },
          { step: 3, ask: "Divide both sides by 9. What is $x + 2$?", type: "num", answer: 10, hint: "$90 \\div 9$.",
            m: "x + 2 = 10", say: "$90 \\div 9$." },
          { step: 3, ask: "So what is $x$?", type: "num", answer: 8, near: [{ v: 12, fb: "Subtract 2, do not add it." }], hint: "$10 - 2$.",
            m: "x = 8", say: "Check: $\\frac{10}{6} = \\frac{15}{9} = \\frac{5}{3}$." }],
        why: "Proportion, cross, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $\\frac{6}{x} = \\frac{9}{12}$.", pre: "$x =$", answer: 8, skill: "Solve proportions",
        near: [{ v: 4.5, fb: "Cross-multiply: $9x = 6 \\cdot 12$." }], hints: ["$9x = 72$."], why: "$9x = 72$, so $x = 8$." },
      { type: "num", prompt: "The angles of a triangle are in the ratio $2 : 3 : 4$. Find the largest angle.", post: "°", answer: 80, skill: "Use ratios",
        near: [{ v: 20, fb: "That is $x$. The largest angle is $4x$." }, { v: 4, fb: "The angles are $2x$, $3x$ and $4x$, and they add to 180°." }],
        hints: ["Call the angles $2x$, $3x$ and $4x$.", "$9x = 180$."], why: "$x = 20$, so the angles are 40°, 60° and 80°." },
      { type: "learn", kicker: "A harder case",
        prompt: "A ratio with three parts. The sides of a triangle are in the ratio $3 : 4 : 5$, and its perimeter is 96. Find the sides.",
        scene: { type: "walk", how: [["Parts", "Write each side as a multiple of $x$."], ["Equation", "Add the sides to get the perimeter."], ["Solve", "Solve for $x$, then find each side."]], rows: [
          { step: 1, m: "3x \\qquad 4x \\qquad 5x", say: "The sides keep the ratio $3 : 4 : 5$ for every $x$." },
          { step: 2, m: "3x + 4x + 5x = 96", say: "The perimeter." },
          { step: 3, m: "12x = 96", say: "Collect like terms.",
            ask: { prompt: "What is $x$ when $12x = 96$?", answer: 0,
                   options: [{ t: "8" }, { t: "84", fb: "Divide by 12, do not subtract it." }] } },
          { step: 3, m: "x = 8", say: "Divide by 12." },
          { step: 3, m: "24 \\qquad 32 \\qquad 40", say: "$3(8)$, $4(8)$ and $5(8)$. They add to 96." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A recipe uses flour and sugar in the ratio $5 : 2$. How many cups of sugar go with 15 cups of flour?", answer: 6, skill: "Use ratios",
        near: [{ v: 37.5, fb: "Sugar is the smaller amount: $\\frac{5}{2} = \\frac{15}{s}$." }, { v: 12, fb: "The flour was tripled, so triple the sugar: $2 \\cdot 3$." }],
        hints: ["$\\frac{5}{2} = \\frac{15}{s}$."], why: "$5s = 30$, so $s = 6$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{x}{4} = \\frac{9}{6}", "9x = 24", "x = \\frac{8}{3}"], answer: 1, fix: "6x = 36",
        fb: { 0: GIVEN, 2: LATER }, skill: "Solve proportions",
        hints: ["Which numbers lie across from each other?"],
        why: "Cross products: $x \\cdot 6 = 4 \\cdot 9$, so $6x = 36$ and $x = 6$." },
      { type: "num", kicker: "Use it", prompt: "On a map, 2 cm stands for 15 km. Two towns are 7 cm apart on the map. How far apart are they really?", post: "km", answer: 52.5, skill: "Use ratios",
        near: [{ v: 105, fb: "That is $7 \\cdot 15$. Each 2 cm is 15 km, so divide by 2 as well." }],
        hints: ["$\\frac{2}{15} = \\frac{7}{d}$."], why: "$2d = 105$, so $d = 52.5$ km." }
    ]
  });

  /* ================================================== 7-2 · Ratios in similar polygons */
  var HOW_7_2 = [["Angles", "Check that corresponding angles are congruent."],
                 ["Sides", "Write the ratios of corresponding sides, and simplify each."],
                 ["Decide", "All the ratios equal: the polygons are similar, and that ratio is the similarity ratio."]];
  var FIG_RECTS = shapes([[[[0, 0], [3, 0], [3, 2], [0, 2]], { names: "ABCD", sides: ["6", "4", null, null], right: [0, 1, 2, 3] }], [[[4.7, 0], [9.2, 0], [9.2, 3], [4.7, 3]], { names: "EFGH", sides: ["9", "6", null, null], right: [0, 1, 2, 3], c: "green" }]],
        { alt: "Rectangle ABCD, 6 by 4, and rectangle EFGH, 9 by 6." }),
      FIG_RT68 = simTris("ABC", "DEF", 1.5, { right: [0], arcs: [0, 1, 2], sides: ["6", "10", "8"] }, { right: [0], arcs: [0, 1, 2], sides: ["9", "15", "12"] },
        "Right triangles ABC and DEF. The angles at B and E each carry one arc, and the angles at C and F each carry two. ABC has sides 6, 8 and 10. DEF has sides 9, 12 and 15.", [[0, 0], [1.8, 0], [0, 2.4]]),
      FIG_JKL = simTris("JKL", "PQR", 0.4, { sides: ["15", "20", null] }, { sides: ["6", "x", null] }, "Triangle JKL, and a smaller triangle PQR of the same shape. JK is 15 and KL is 20. PQ is 6 and QR is x.", [[0, 0], [3, 0], [3.6, 3.9]]);
  LESSONS.push({
    title: "Ratios in similar polygons",
    blurb: "Book 7-2 · Similar polygons have congruent angles and proportional sides.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which ratio is equal to $\\frac{6}{9}$?",
        options: [{ t: "$\\frac{4}{6}$" }, { t: "$\\frac{9}{12}$", fb: "$\\frac{9}{12} = \\frac{3}{4}$, but $\\frac{6}{9} = \\frac{2}{3}$." }, { t: "$\\frac{3}{6}$", fb: "Subtracting 3 from each part changes the value." }],
        answer: 0, skill: "Equal ratios", hints: ["Simplify each one."], why: "Both simplify to $\\frac{2}{3}$." },
      { type: "learn", kicker: "The idea",
        prompt: "Figures with the same shape, but not always the same size, are **similar** ($\\sim$). Two polygons are similar when their corresponding angles are congruent **and** their corresponding sides are proportional. The ratio of corresponding sides is the **similarity ratio**.",
        scene: { type: "method", how: HOW_7_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch two rectangles tested for similarity.",
        scene: { type: "walk", how: HOW_7_2, rows: [
          { step: 1, m: "\\text{all angles are } 90°", say: "Every angle of a rectangle is a right angle, so corresponding angles are congruent.", fig: FIG_RECTS },
          { step: 2, m: "\\frac{AB}{EF} = \\frac{6}{9} = \\frac{2}{3}", say: "The long sides." },
          { step: 2, m: "\\frac{BC}{FG} = \\frac{4}{6} = \\frac{2}{3}", say: "The short sides.",
            ask: { prompt: "Simplify $\\frac{4}{6}$.", answer: 0,
                   options: [{ t: "$\\frac{2}{3}$" }, { t: "$\\frac{3}{4}$", fb: "Divide the top and the bottom by 2." }] } },
          { step: 3, m: "ABCD \\sim EFGH", say: "The ratios are equal. The similarity ratio of $ABCD$ to $EFGH$ is $\\frac{2}{3}$." }] },
        gate: true, then: "Angles congruent and sides proportional: both are needed." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Are these triangles similar?", art: FIG_RT68,
        how: HOW_7_2, skill: "Similar polygons",
        steps: [
          { step: 1, ask: "Are the corresponding angles congruent?", type: "choice", answer: 0,
            options: [{ t: "Yes: right angle with right angle, and the arcs match" }, { t: "No", fb: "$\\angle A$ and $\\angle D$ are right angles, $\\angle B \\cong \\angle E$ and $\\angle C \\cong \\angle F$." }],
            m: "\\angle A \\cong \\angle D \\qquad \\angle B \\cong \\angle E \\qquad \\angle C \\cong \\angle F", say: "Three pairs of congruent angles." },
          { step: 2, ask: "Simplify $\\frac{AB}{DE} = \\frac{6}{9}$.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{2}{3}$" }, { t: "$\\frac{3}{2}$", fb: "6 is on top: the ratio is less than 1." }],
            m: "\\frac{6}{9} = \\frac{2}{3}", say: "Divide by 3." },
          { step: 2, ask: "Do $\\frac{10}{15}$ and $\\frac{8}{12}$ simplify to the same ratio?", type: "choice", answer: 0,
            options: [{ t: "Yes: both are $\\frac{2}{3}$" }, { t: "No", fb: "$10 \\div 5 = 2$ and $15 \\div 5 = 3$. $8 \\div 4 = 2$ and $12 \\div 4 = 3$." }],
            m: "\\frac{10}{15} = \\frac{8}{12} = \\frac{2}{3}", say: "All three ratios are equal." },
          { step: 3, ask: "So what can you say?", type: "choice", answer: 0,
            options: [{ t: "$\\triangle ABC \\sim \\triangle DEF$, with similarity ratio $\\frac{2}{3}$" }, { t: "$\\triangle ABC \\cong \\triangle DEF$", fb: "Congruent triangles are the same size. These are not." }],
            m: "\\triangle ABC \\sim \\triangle DEF", say: "Same shape, different size." }],
        why: "Angles, sides, decide. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$\\triangle ABC \\sim \\triangle DEF$. $AB = 12$, $DE = 8$ and $BC = 18$. Find $EF$.", answer: 12, skill: "Similar polygons",
        near: [{ v: 27, fb: "$\\triangle DEF$ is the smaller triangle, so $EF$ is less than 18." }, { v: 14, fb: "Similar figures keep the same **ratio**, not the same difference." }],
        hints: ["$\\frac{AB}{DE} = \\frac{BC}{EF}$: $\\frac{12}{8} = \\frac{18}{EF}$."], why: "$12 \\cdot EF = 144$, so $EF = 12$." },
      { type: "choice", prompt: "Rectangle $A$ is 4 by 8. Rectangle $B$ is 6 by 10. Are they similar?",
        options: [{ t: "No: $\\frac{4}{6} = \\frac{2}{3}$ but $\\frac{8}{10} = \\frac{4}{5}$" }, { t: "Yes: all their angles are right angles", fb: "Congruent angles are not enough. The sides must be proportional too." }, { t: "Yes: each side grew by 2", fb: "Similar figures have equal ratios, not equal differences." }],
        answer: 0, skill: "Similar polygons", hints: ["Compare the ratios of corresponding sides."], why: "The ratios of corresponding sides are not equal." },
      { type: "learn", kicker: "A harder case",
        prompt: "The order of the letters does the matching, just as with congruence. $\\triangle JKL \\sim \\triangle PQR$. Find $QR$.",
        scene: { type: "walk", how: [["Match", "Use the similarity statement to match the sides."], ["Ratio", "Write the similarity ratio, keeping the order."], ["Proportion", "Set up a proportion and solve it."]], rows: [
          { step: 1, m: "\\overline{JK} \\to \\overline{PQ} \\qquad \\overline{KL} \\to \\overline{QR}", say: "First two letters with first two, last two with last two.", fig: FIG_JKL },
          { step: 2, m: "\\frac{JK}{PQ} = \\frac{15}{6} = \\frac{5}{2}", say: "The similarity ratio of $\\triangle JKL$ to $\\triangle PQR$." },
          { step: 3, m: "\\frac{20}{x} = \\frac{5}{2}", say: "$KL$ over $QR$ is the same ratio." },
          { step: 3, m: "5x = 40", say: "Cross-multiply.",
            ask: { prompt: "What is $x$ when $5x = 40$?", answer: 0,
                   options: [{ t: "8" }, { t: "35", fb: "Divide by 5, do not subtract it." }] } },
          { step: 3, m: "x = 8", say: "$QR = 8$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Two rectangles are similar. The first is 5 wide and 8 long. The second is $x$ wide and 20 long. Find $x$.", pre: "$x =$", answer: 12.5, skill: "Similar polygons",
        near: [{ v: 17, fb: "Similar figures keep the same ratio, not the same difference." }, { v: 32, fb: "Width goes with width: $\\frac{5}{x} = \\frac{8}{20}$." }],
        hints: ["$\\frac{5}{x} = \\frac{8}{20}$."], why: "$8x = 100$, so $x = 12.5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "One rectangle is 3 by 5 and another is 6 by 8. Ty says they are similar, because each side is 3 longer. What is wrong?",
        options: [{ t: "Similar figures need equal ratios, not equal differences: $\\frac{3}{6} \\ne \\frac{5}{8}$." },
                  { t: "Rectangles are never similar.", fb: "They are, when their sides are proportional." },
                  { t: "Nothing. Adding the same amount keeps the shape.", fb: "Adding 3 to both sides makes the rectangle closer to a square: a different shape." }],
        answer: 0, skill: "Similar polygons", hints: ["Compare $\\frac{3}{6}$ with $\\frac{5}{8}$."], why: "$\\frac{1}{2}$ and $\\frac{5}{8}$ are not equal." },
      { type: "num", kicker: "Use it", prompt: "A photo 10 cm wide and 15 cm high is enlarged to a poster 24 cm wide. How high is the poster?", post: "cm", answer: 36, skill: "Similar polygons",
        near: [{ v: 29, fb: "An enlargement keeps the ratio, not the difference." }, { v: 16, fb: "Height goes with height: $\\frac{10}{24} = \\frac{15}{h}$." }],
        hints: ["$\\frac{10}{24} = \\frac{15}{h}$."], why: "$10h = 360$, so $h = 36$." }
    ]
  });

  /* ============================================ 7-3 · Triangle similarity: AA, SSS and SAS */
  var HOW_7_3 = [["Angles", "Two pairs of congruent angles? Then the triangles are similar by AA."],
                 ["Sides", "Otherwise compare the ratios of corresponding sides. All three equal: SSS. Two equal, with the included angles congruent: SAS."],
                 ["State", "Write the similarity in matching order, and use it to find lengths."]];
  var FIG_AA = simTris("ABC", "DEF", 0.95, { angs: ["50°", "60°", null] }, { angs: ["50°", null, "70°"] }, "Triangle ABC has an angle of 50 degrees at A and 60 degrees at B. Triangle DEF has an angle of 50 degrees at D and 70 degrees at F.", [[0, 0], [4, 0], [2.37, 2.82]]),
      FIG_SSS = simTris("JKL", "MNP", 1.5, { sides: ["4", "6", "8"] }, { sides: ["6", "9", "12"] }, "Triangle JKL has sides JK = 4, KL = 6 and LJ = 8. Triangle MNP has sides MN = 6, NP = 9 and PM = 12.", [[0, 0], [2, 0], [2.75, 2.9]]),
      FIG_SPL3 = splitFig(0.4, { ad: "4", db: "6", de: "6", bc: "x", alt: "Triangle ABC. D is on AB and E is on AC, and segment DE is parallel to BC. AD is 4, DB is 6, DE is 6 and BC is x." }),
      FIG_SPL0 = splitFig(0.5, { alt: "Triangle ABC. D is on AB and E is on AC, and segment DE is parallel to BC." });
  LESSONS.push({
    title: "Triangle similarity: AA, SSS and SAS",
    blurb: "Book 7-3 · Three shortcuts that prove two triangles similar.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Two angles of a triangle measure 50° and 60°. Find the third.", post: "°", answer: 70, skill: "Triangle Sum Theorem",
        near: [{ v: 110, fb: "That is the sum of the two. Subtract it from 180." }], hints: ["The three add to 180°."], why: "$180 - 110 = 70$." },
      { type: "learn", kicker: "The idea",
        prompt: "For triangles you need far less than all six parts. **AA:** two pairs of congruent angles. **SSS:** three pairs of sides in the same ratio. **SAS:** two pairs of sides in the same ratio, with the included angles congruent.",
        scene: { type: "method", how: HOW_7_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch these two triangles shown to be similar.",
        scene: { type: "walk", how: HOW_7_3, rows: [
          { step: 1, m: "m\\angle C = 180° - 50° - 60° = 70°", say: "The third angle of $\\triangle ABC$.", fig: FIG_AA },
          { step: 1, m: "\\angle A \\cong \\angle D \\qquad \\angle C \\cong \\angle F", say: "50° with 50°, and 70° with 70°.",
            ask: { prompt: "Which angle of $\\triangle DEF$ is congruent to $\\angle C$?", answer: 0,
                   options: [{ t: "$\\angle F$, also 70°" }, { t: "$\\angle D$", fb: "$\\angle D$ is 50°, like $\\angle A$." }] } },
          { step: 2, m: "\\text{no side lengths needed}", say: "Two pairs of angles already settle it." },
          { step: 3, m: "\\triangle ABC \\sim \\triangle DEF \\text{ by AA}", say: "$A$ with $D$, $B$ with $E$, $C$ with $F$." }] },
        gate: true, then: "Two angles fix a triangle's shape." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Are these triangles similar?", art: FIG_SSS,
        how: HOW_7_3, skill: "Similarity shortcuts",
        steps: [
          { step: 1, ask: "Are any angle measures given?", type: "choice", answer: 0,
            options: [{ t: "No: only side lengths" }, { t: "Yes", fb: "The figure gives six side lengths and no angles." }],
            m: "\\text{no angles given}", say: "So AA cannot be used. Compare the sides." },
          { step: 2, ask: "Pair the sides, shortest with shortest. What do $\\frac{4}{6}$, $\\frac{6}{9}$ and $\\frac{8}{12}$ each simplify to?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{2}{3}$" }, { t: "They are not all equal", fb: "$4 \\div 2$, $6 \\div 3$ and $8 \\div 4$ all give 2 on top, with 3 below." }],
            m: "\\frac{4}{6} = \\frac{6}{9} = \\frac{8}{12} = \\frac{2}{3}", say: "Three equal ratios." },
          { step: 2, ask: "Which shortcut is that?", type: "choice", answer: 0,
            options: [{ t: "SSS" }, { t: "SAS", fb: "No angle is known." }, { t: "AA", fb: "No angle is known." }],
            m: "\\text{SSS}", say: "Three pairs of proportional sides." },
          { step: 3, ask: "Which statement is in matching order?", type: "choice", answer: 0,
            options: [{ t: "$\\triangle JKL \\sim \\triangle MNP$" }, { t: "$\\triangle JKL \\sim \\triangle PMN$", fb: "$\\overline{JK}$, the shortest side, matches $\\overline{MN}$, so $J$ goes with $M$ and $K$ with $N$." }],
            m: "\\triangle JKL \\sim \\triangle MNP", say: "$\\overline{JK}$ with $\\overline{MN}$, $\\overline{KL}$ with $\\overline{NP}$, $\\overline{LJ}$ with $\\overline{PM}$." }],
        why: "Angles, sides, state. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Each card describes two triangles. How do you know they are similar, if they are?",
        bins: ["AA", "SSS", "SAS", "Not similar"],
        cards: [{ t: "Two pairs of congruent angles", bin: 0, fb: "Angle, angle." }, { t: "Sides 3, 4, 5 and sides 6, 8, 10", bin: 1, fb: "Every ratio is $\\frac{1}{2}$." },
                { t: "Sides 2 and 3 round a 40° angle; sides 4 and 6 round a 40° angle", bin: 2, fb: "$\\frac{2}{4} = \\frac{3}{6}$, and the included angles are congruent." }, { t: "Sides 3, 4, 5 and sides 6, 8, 11", bin: 3, fb: "$\\frac{5}{11}$ is not $\\frac{1}{2}$." }],
        skill: "Similarity shortcuts", hints: ["Angles first. If there are none, compare the ratios."],
        why: "AA needs two angles. SSS needs three equal ratios. SAS needs two equal ratios and the included angle." },
      { type: "num", prompt: "$\\overline{DE} \\parallel \\overline{BC}$, so $\\triangle ADE \\sim \\triangle ABC$. Find $x$.", art: FIG_SPL3, pre: "$x =$", answer: 15, skill: "Similarity shortcuts",
        near: [{ v: 9, fb: "$\\overline{AD}$ matches the whole side $\\overline{AB}$, which is $4 + 6 = 10$." }],
        hints: ["$AB = 4 + 6 = 10$.", "$\\frac{AD}{AB} = \\frac{DE}{BC}$: $\\frac{4}{10} = \\frac{6}{x}$."], why: "$4x = 60$, so $x = 15$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Why is that true? Prove it. Given: $\\overline{DE} \\parallel \\overline{BC}$. Prove: $\\triangle ADE \\sim \\triangle ABC$.",
        scene: { type: "walk", how: [["Shared", "Find an angle that both triangles share."], ["Parallel", "Parallel lines give a pair of congruent corresponding angles."], ["AA", "Two pairs of congruent angles: the triangles are similar."]], rows: [
          { step: 1, m: "\\angle A \\cong \\angle A", say: "Reflexive Property: both triangles have this angle.", fig: FIG_SPL0 },
          { step: 2, m: "\\overline{DE} \\parallel \\overline{BC}", say: "Given." },
          { step: 2, m: "\\angle ADE \\cong \\angle ABC", say: "Corresponding Angles Postulate, with transversal $\\overline{AB}$.",
            ask: { prompt: "$\\angle ADE$ and $\\angle ABC$ are in the same position at $D$ and at $B$. What are they called?", answer: 0,
                   options: [{ t: "Corresponding angles" }, { t: "Alternate interior angles", fb: "Those lie between the parallel lines, on opposite sides of the transversal." }] } },
          { step: 3, m: "\\triangle ADE \\sim \\triangle ABC", say: "AA Similarity." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "In $\\triangle ABC$, $AB = 6$, $AC = 9$ and $m\\angle A = 35°$. In $\\triangle DEF$, $DE = 4$, $DF = 6$ and $m\\angle D = 35°$. Are they similar?",
        options: [{ t: "Yes, by SAS: $\\frac{6}{4} = \\frac{9}{6}$, and the included angles are congruent" }, { t: "Yes, by SSS", fb: "Only two pairs of sides are known." }, { t: "No", fb: "$\\frac{6}{4}$ and $\\frac{9}{6}$ both equal $\\frac{3}{2}$, and the angles between those sides match." }],
        answer: 0, skill: "Similarity shortcuts", hints: ["Compare $\\frac{AB}{DE}$ with $\\frac{AC}{DF}$. Where is the angle?"], why: "Two equal ratios with the included angles congruent: SAS." },
      { type: "choice", kicker: "Find the error",
        prompt: "One triangle has sides of 6 and 9 with a 40° angle between them. Another has sides of 8 and 12, and a 40° angle that is **not** between them. Kim says they are similar by SAS. What is wrong?",
        options: [{ t: "For SAS the congruent angles must be the included ones, in both triangles." },
                  { t: "The ratios are not equal.", fb: "$\\frac{6}{8}$ and $\\frac{9}{12}$ both equal $\\frac{3}{4}$." },
                  { t: "Nothing. Two ratios and an angle are enough.", fb: "Only when the angle is between the two sides." }],
        answer: 0, skill: "Similarity shortcuts", hints: ["What does the A in the middle of SAS mean?"], why: "The angle must be included by the two proportional sides." },
      { type: "num", kicker: "Use it", prompt: "An engineer's sketch has a small triangle and a large one that are similar by AA. Sides of 3 m and 5 m in the small one match sides of 12 m and $x$ in the large one. Find $x$.", post: "m", answer: 20, skill: "Similarity shortcuts",
        near: [{ v: 14, fb: "Similar triangles keep the ratio, not the difference." }],
        hints: ["$\\frac{3}{12} = \\frac{5}{x}$."], why: "$3x = 60$, so $x = 20$." }
    ]
  });
  /* ======================================= 7-4 · Applying properties of similar triangles */
  var HOW_7_4 = [["Parallel", "A line parallel to one side of a triangle divides the other two sides proportionally."],
                 ["Proportion", "Write the proportion with matching parts: upper part over lower part, on each side."],
                 ["Solve", "Cross-multiply and solve."]];
  var FIG_SP1 = splitFig(0.4, { ad: "4", db: "6", ae: "6", ec: "x", alt: "Triangle ABC. D is on AB and E is on AC, and DE is parallel to BC. AD is 4, DB is 6, AE is 6 and EC is x." }),
      FIG_SP2 = splitFig(0.33, { ad: "5", db: "10", ae: "x", ec: "14", alt: "Triangle ABC. D is on AB and E is on AC, and DE is parallel to BC. AD is 5, DB is 10, AE is x and EC is 14." }),
      FIG_SP3 = splitFig(0.6, { ad: "9", db: "6", ae: "12", ec: "x", alt: "Triangle ABC. D is on AB and E is on AC, and DE is parallel to BC. AD is 9, DB is 6, AE is 12 and EC is x." }),
      FIG_SP4 = splitFig(0.33, { ad: "3", db: "6", ae: "4", ec: "8", alt: "Triangle ABC. D is on AB and E is on AC, joined by segment DE. AD is 3, DB is 6, AE is 4 and EC is 8." }),
      FIG_BIS = bisFig({ ab: "8", ac: "12", bd: "6", dc: "x", alt: "Triangle ABC. A segment from A meets BC at D and cuts the angle at A into two equal angles. AB is 8, AC is 12, BD is 6 and DC is x." }),
      FIG_3P = threePar("4", "10", "6", "x", "Three parallel lines cut by two transversals. On the left transversal the lines cut off segments of 4 and 10. On the right one they cut off segments of 6 and x."),
      FIG_ST = threePar("120 m", "180 m", "100 m", "?", "Three parallel streets cross two avenues. Along the left avenue the blocks are 120 metres and 180 metres. Along the right avenue the first block is 100 metres and the second is unknown.");
  LESSONS.push({
    title: "Applying properties of similar triangles",
    blurb: "Book 7-4 · Parallel lines and angle bisectors divide the sides of a triangle proportionally.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $\\frac{4}{6} = \\frac{6}{x}$.", pre: "$x =$", answer: 9, skill: "Solve proportions",
        near: [{ v: 4, fb: "Cross-multiply: $4x = 36$." }], hints: ["$4x = 6 \\cdot 6$."], why: "$4x = 36$, so $x = 9$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Triangle Proportionality Theorem:** a line parallel to one side of a triangle divides the other two sides proportionally. Its converse is true: if a line divides two sides proportionally, it is parallel to the third. The same holds for any three parallel lines that cut two transversals.",
        scene: { type: "method", how: HOW_7_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $EC$ found. $\\overline{DE} \\parallel \\overline{BC}$.",
        scene: { type: "walk", how: HOW_7_4, rows: [
          { step: 1, m: "\\overline{DE} \\parallel \\overline{BC}", say: "So $\\overline{DE}$ divides $\\overline{AB}$ and $\\overline{AC}$ proportionally.", fig: FIG_SP1 },
          { step: 2, m: "\\frac{AD}{DB} = \\frac{AE}{EC}", say: "Upper part over lower part, on both sides." },
          { step: 2, m: "\\frac{4}{6} = \\frac{6}{x}", say: "Put in the lengths." },
          { step: 3, m: "4x = 36", say: "Cross-multiply.",
            ask: { prompt: "What is $x$ when $4x = 36$?", answer: 0,
                   options: [{ t: "9" }, { t: "32", fb: "Divide by 4, do not subtract it." }] } },
          { step: 3, m: "x = 9", say: "$EC = 9$." }] },
        gate: true, then: "Keep the same order on both sides of the proportion." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $\\overline{DE} \\parallel \\overline{BC}$. Find $x$.", art: FIG_SP2,
        how: HOW_7_4, skill: "Triangle Proportionality",
        steps: [
          { step: 1, ask: "$\\overline{DE}$ is parallel to $\\overline{BC}$. What does it do to the other two sides?", type: "choice", answer: 0,
            options: [{ t: "Divides them proportionally" }, { t: "Bisects them", fb: "Only a midsegment bisects them. Here $AD = 5$ and $DB = 10$." }],
            m: "\\overline{DE} \\parallel \\overline{BC}", say: "Triangle Proportionality Theorem." },
          { step: 2, ask: "Which proportion is right?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{5}{10} = \\frac{x}{14}$" }, { t: "$\\frac{5}{10} = \\frac{14}{x}$", fb: "Upper over lower on both sides: $x$ is the upper part of $\\overline{AC}$." }],
            m: "\\frac{5}{10} = \\frac{x}{14}", say: "Upper over lower, on each side." },
          { step: 3, ask: "$10x = 70$. What is $x$?", type: "num", answer: 7, hint: "$70 \\div 10$.",
            m: "x = 7", say: "$AE = 7$, half of 14, just as 5 is half of 10." }],
        why: "Parallel, proportion, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$\\overline{DE} \\parallel \\overline{BC}$. Find $x$.", art: FIG_SP3, pre: "$x =$", answer: 8, skill: "Triangle Proportionality",
        near: [{ v: 18, fb: "Keep the order: $\\frac{9}{6} = \\frac{12}{x}$." }], hints: ["$\\frac{9}{6} = \\frac{12}{x}$."], why: "$9x = 72$, so $x = 8$." },
      { type: "choice", prompt: "Is $\\overline{DE}$ parallel to $\\overline{BC}$?", art: FIG_SP4,
        options: [{ t: "Yes: $\\frac{3}{6} = \\frac{4}{8}$" }, { t: "No: 3 is not equal to 4", fb: "The parts need not be equal. Their ratios must be." }, { t: "There is no way to tell", fb: "The converse of the Triangle Proportionality Theorem tells you." }],
        answer: 0, skill: "Triangle Proportionality", hints: ["Compare $\\frac{AD}{DB}$ with $\\frac{AE}{EC}$."], why: "Both ratios are $\\frac{1}{2}$, so the sides are divided proportionally." },
      { type: "learn", kicker: "A harder case",
        prompt: "An angle bisector splits the opposite side too. **Triangle Angle Bisector Theorem:** it divides that side in the ratio of the other two sides. Find $DC$.",
        scene: { type: "walk", how: [["Bisector", "The bisector of an angle divides the opposite side in the ratio of the other two sides."], ["Proportion", "Write $\\frac{BD}{DC} = \\frac{AB}{AC}$."], ["Solve", "Cross-multiply and solve."]], rows: [
          { step: 1, m: "\\overline{AD} \\text{ bisects } \\angle A", say: "The two arcs mark the two equal angles.", fig: FIG_BIS },
          { step: 2, m: "\\frac{BD}{DC} = \\frac{AB}{AC}", say: "Each part of $\\overline{BC}$ goes with the side next to it." },
          { step: 2, m: "\\frac{6}{x} = \\frac{8}{12}", say: "Put in the lengths." },
          { step: 3, m: "8x = 72", say: "Cross-multiply.",
            ask: { prompt: "What is $6 \\cdot 12$?", answer: 0,
                   options: [{ t: "72" }, { t: "18", fb: "Multiply, do not add." }] } },
          { step: 3, m: "x = 9", say: "$DC = 9$. The longer part is next to the longer side." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "The three blue lines are parallel. Find $x$.", art: FIG_3P, pre: "$x =$", answer: 15, skill: "Triangle Proportionality",
        near: [{ v: 12, fb: "Keep the ratio, not the difference: $\\frac{4}{10} = \\frac{6}{x}$." }], hints: ["$\\frac{4}{10} = \\frac{6}{x}$."], why: "$4x = 60$, so $x = 15$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "$\\overline{DE} \\parallel \\overline{BC}$, with $AD = 4$, $DB = 6$ and $AE = 5$. Find $EC = x$. Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{AD}{DB} = \\frac{AE}{EC}", "\\frac{4}{6} = \\frac{x}{5}", "x = \\frac{10}{3}"], answer: 1, fix: "\\frac{4}{6} = \\frac{5}{x}",
        fb: { 0: "The proportion is set up correctly.", 2: LATER }, skill: "Triangle Proportionality",
        hints: ["Which length is $AE$, and which is $EC$?"],
        why: "$AE = 5$ goes on top and $EC = x$ below: $4x = 30$, so $x = 7.5$." },
      { type: "num", kicker: "Use it", prompt: "Three parallel streets cross two avenues. How long is the second block on the right-hand avenue?", art: FIG_ST, post: "m", answer: 150, skill: "Triangle Proportionality",
        near: [{ v: 160, fb: "Keep the ratio, not the difference: $\\frac{120}{180} = \\frac{100}{x}$." }], hints: ["$\\frac{120}{180} = \\frac{100}{x}$."], why: "$120x = 18000$, so $x = 150$." }
    ]
  });

  /* ============================================= 7-5 · Using proportional relationships */
  var HOW_7_5 = [["Similar", "Find the similar figures, and match their corresponding parts."],
                 ["Ratio", "Lengths, and perimeters, are in the similarity ratio $\\frac{a}{b}$. Areas are in the ratio $\\frac{a^2}{b^2}$."],
                 ["Solve", "Write a proportion and solve it."]];
  var T_SH = [[0, 0], [1.2, 0], [1.2, 0.8]];
  var FIG_SHADOW = simTris("", "", 4, { right: [1], sides: ["3 m", "2 m", null] }, { right: [1], sides: ["12 m", "h", null] }, "Two right triangles. In the small one, a pole 2 metres high casts a shadow 3 metres long. In the large one, a tree of height h casts a shadow 12 metres long.", T_SH),
      FIG_SHADOW2 = simTris("", "", 4, { right: [1], sides: ["2 m", "1.5 m", null] }, { right: [1], sides: ["12 m", "h", null] }, "Two right triangles. In the small one, a student 1.5 metres tall casts a shadow 2 metres long. In the large one, a flagpole of height h casts a shadow 12 metres long.", [[0, 0], [1.2, 0], [1.2, 0.9]]);
  LESSONS.push({
    title: "Using proportional relationships",
    blurb: "Book 7-5 · Indirect measurement, scale drawings, and the ratios of perimeters and areas.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is $\\left(\\frac{3}{2}\\right)^2$?",
        options: [{ t: "$\\frac{9}{4}$" }, { t: "$\\frac{6}{4}$", fb: "Squaring multiplies a number by itself: $3 \\cdot 3$ and $2 \\cdot 2$." }, { t: "$\\frac{9}{2}$", fb: "Square the bottom as well." }],
        answer: 0, skill: "Squares of fractions", hints: ["Square the top, and square the bottom."], why: "$\\frac{3 \\cdot 3}{2 \\cdot 2} = \\frac{9}{4}$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Indirect measurement** uses similar figures to find a length you cannot measure. A **scale drawing** is similar to the real object, and its **scale** is the ratio of a drawn length to the real one. In similar figures, perimeters keep the similarity ratio, and areas have its **square**.",
        scene: { type: "method", how: HOW_7_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the height of a tree found from its shadow.",
        scene: { type: "walk", how: HOW_7_5, rows: [
          { step: 1, m: "\\text{two similar right triangles}", say: "The sun's rays meet the ground at the same angle, so the triangles are similar by AA.", fig: FIG_SHADOW },
          { step: 2, m: "\\frac{h}{2} = \\frac{12}{3}", say: "Height over height equals shadow over shadow." },
          { step: 3, m: "3h = 24", say: "Cross-multiply.",
            ask: { prompt: "What is $h$ when $3h = 24$?", answer: 0,
                   options: [{ t: "8" }, { t: "21", fb: "Divide by 3, do not subtract it." }] } },
          { step: 3, m: "h = 8", say: "The tree is 8 m tall." }] },
        gate: true, then: "No climbing needed." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. A floor plan has a scale of 1 cm : 4 m. On the plan, a hall is 3.5 cm wide and 5 cm long. Find its real size.",
        how: HOW_7_5, skill: "Scale drawings",
        steps: [
          { step: 1, ask: "The plan is similar to the real hall. What does 1 cm on the plan stand for?", type: "choice", answer: 0,
            options: [{ t: "4 m" }, { t: "0.25 m", fb: "The real hall is bigger than the drawing: 1 cm stands for 4 m." }],
            m: "1 \\text{ cm} : 4 \\text{ m}", say: "The scale." },
          { step: 2, ask: "The real width is $w$. Which proportion is right?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{1}{4} = \\frac{3.5}{w}$" }, { t: "$\\frac{1}{4} = \\frac{w}{3.5}$", fb: "Keep plan over real on both sides: 3.5 is a plan length." }],
            m: "\\frac{1}{4} = \\frac{3.5}{w}", say: "Plan over real, on both sides." },
          { step: 3, ask: "What is the real width, in metres?", type: "num", answer: 14, hint: "$3.5 \\cdot 4$.",
            m: "w = 14", say: "$3.5 \\cdot 4$." },
          { step: 3, ask: "And the real length, in metres?", type: "num", answer: 20, hint: "$5 \\cdot 4$.",
            m: "5 \\cdot 4 = 20", say: "The hall is 14 m by 20 m." }],
        why: "Similar, ratio, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the height $h$ of the flagpole.", art: FIG_SHADOW2, post: "m", answer: 9, skill: "Indirect measurement",
        near: [{ v: 16, fb: "Height goes with height: $\\frac{h}{1.5} = \\frac{12}{2}$." }], hints: ["$\\frac{h}{1.5} = \\frac{12}{2}$."], why: "$2h = 18$, so $h = 9$." },
      { type: "num", prompt: "A map has a scale of 1 cm : 25 km. Two cities are 6.4 cm apart on the map. How far apart are they really?", post: "km", answer: 160, skill: "Scale drawings",
        near: [{ v: 3.90625, tol: 0.01, fb: "Multiply by 25, do not divide." }], hints: ["$6.4 \\cdot 25$."], why: "$6.4 \\cdot 25 = 160$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Two similar triangles have a similarity ratio of $\\frac{2}{3}$. The smaller has a perimeter of 20 and an area of 24. Find the perimeter and the area of the larger.",
        scene: { type: "walk", how: [["Ratio", "Write the similarity ratio."], ["Perimeter", "Perimeters are in the same ratio."], ["Area", "Areas are in the ratio squared."]], rows: [
          { step: 1, m: "\\frac{a}{b} = \\frac{2}{3}", say: "Smaller to larger." },
          { step: 2, m: "\\frac{20}{P} = \\frac{2}{3}", say: "The perimeters keep the ratio." },
          { step: 2, m: "P = 30", say: "$2P = 60$." },
          { step: 3, m: "\\frac{24}{A} = \\frac{4}{9}", say: "The areas have the ratio squared.",
            ask: { prompt: "What is $\\left(\\frac{2}{3}\\right)^2$?", answer: 0,
                   options: [{ t: "$\\frac{4}{9}$" }, { t: "$\\frac{4}{6}$", fb: "Square the 3 too: $3 \\cdot 3 = 9$." }] } },
          { step: 3, m: "A = 54", say: "$4A = 216$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Two similar triangles have a similarity ratio of $\\frac{1}{3}$. The smaller has an area of 5. Find the area of the larger.", answer: 45, skill: "Perimeters and areas",
        near: [{ v: 15, fb: "Areas have the ratio **squared**: $\\frac{1}{9}$." }], hints: ["$\\left(\\frac{1}{3}\\right)^2 = \\frac{1}{9}$, so $\\frac{5}{A} = \\frac{1}{9}$."], why: "$A = 5 \\cdot 9 = 45$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Two similar rectangles have sides in the ratio $1 : 2$. Lee says the larger has twice the area of the smaller. What is wrong?",
        options: [{ t: "Areas are in the ratio squared, $1 : 4$. The larger has four times the area." },
                  { t: "The larger has the same area.", fb: "Its sides are twice as long, so it is bigger." },
                  { t: "Nothing. Twice the sides, twice the area.", fb: "Both the length and the width double, so the area is multiplied by $2 \\cdot 2$." }],
        answer: 0, skill: "Perimeters and areas", hints: ["Try a 1 by 1 square and a 2 by 2 square."], why: "$\\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4}$." },
      { type: "num", kicker: "Use it", prompt: "A model car is built at a scale of $1 : 18$. The model is 25 cm long. How long is the real car, in metres?", post: "m", answer: 4.5, skill: "Scale drawings",
        near: [{ v: 450, fb: "That is in centimetres. Change it to metres." }], hints: ["$25 \\cdot 18 = 450$ cm."], why: "$450$ cm is $4.5$ m." }
    ]
  });

  /* ============================== 7-6 · Dilations and similarity in the coordinate plane */
  var HOW_7_6 = [["Factor", "Find the scale factor $k$."],
                 ["Multiply", "A dilation centred at the origin sends $(x, y)$ to $(kx, ky)$."],
                 ["Check", "Every length is multiplied by $k$, so the image is similar to the original."]];
  var FIG_DIL = grid([-1, 8], [-1, 7], [{ ray: [[0, 0], [2, 4]], c: "soft", dash: "3 4", bare: true }, { ray: [[0, 0], [6, 2]], c: "soft", dash: "3 4", bare: true }, { ray: [[0, 0], [4, 6]], c: "soft", dash: "3 4", bare: true },
        { poly: [[1, 2], [3, 1], [2, 3]], names: "ABC", c: "soft" }, { poly: [[2, 4], [6, 2], [4, 6]], names: ["A'", "B'", "C'"], c: "blue" }],
        { u: 28, alt: "A coordinate grid. Triangle ABC has A at (1, 2), B at (3, 1) and C at (2, 3). A larger triangle has A′ at (2, 4), B′ at (6, 2) and C′ at (4, 6). Dotted rays from the origin pass through each pair of matching corners." }),
      FIG_DIL2 = grid([-1, 9], [-1, 7], [{ poly: [[4, 6], [8, 2], [2, 2]], names: "PQR", c: "soft" }],
        { u: 26, alt: "A coordinate grid. Triangle PQR has P at (4, 6), Q at (8, 2) and R at (2, 2)." }),
      FIG_DSAS = grid([-1, 9], [-1, 7], [{ poly: [[0, 0], [8, 0], [0, 6]], names: [null, "G", "H"], c: "green" }, { poly: [[0, 0], [4, 0], [0, 3]], names: ["D", "E", "F"], c: "blue" }],
        { u: 26, alt: "A coordinate grid. Triangle DEF has D at the origin, E at (4, 0) and F at (0, 3). Triangle DGH has G at (8, 0) and H at (0, 6)." });
  LESSONS.push({
    title: "Dilations and similarity in the coordinate plane",
    blurb: "Book 7-6 · Multiply the coordinates by the scale factor, and the image is similar.",
    mins: 13, v: 4,
    steps: [
      { type: "pair", kicker: "Warm up", prompt: "Multiply both coordinates of $(2, -3)$ by 4. Type the result as $(x, y)$.", answer: [8, -12], skill: "Dilations",
        near: [{ v: [6, 1], fb: "Multiply by 4, do not add it." }], hints: ["$4 \\cdot 2$ and $4 \\cdot (-3)$."], why: "$(8, -12)$." },
      { type: "learn", kicker: "Explore",
        prompt: "A **dilation** resizes a figure from a fixed point, its centre. Double this triangle and halve it, and watch the dotted lines from the centre.",
        scene: { type: "move", kind: "dilate", shape: [[1, 1], [3, 1], [1, 2]], center: [0, 0], x: [-2, 8], y: [-2, 6], gate: true },
        gate: true, then: "Every corner slides along a line from the centre. The angles never change, so the shape stays the same." },
      { type: "learn", kicker: "The idea",
        prompt: "The **scale factor** $k$ says how much a dilation resizes. With the centre at the origin, $(x, y) \\to (kx, ky)$. If $k > 1$ the figure is enlarged, and if $0 < k < 1$ it is reduced. Either way, the image is **similar** to the original.",
        scene: { type: "method", how: HOW_7_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\triangle ABC$ dilated by a scale factor of 2, centred at the origin.",
        scene: { type: "walk", how: HOW_7_6, rows: [
          { step: 1, m: "k = 2", say: "Every coordinate will be doubled.", fig: FIG_DIL },
          { step: 2, m: "A(1, 2) \\to A'(2, 4)", say: "$2 \\cdot 1$ and $2 \\cdot 2$." },
          { step: 2, m: "B(3, 1) \\to B'(6, 2)", say: "Double both.",
            ask: { prompt: "Where does $C(2, 3)$ go?", answer: 0,
                   options: [{ t: "$(4, 6)$" }, { t: "$(4, 5)$", fb: "Multiply both coordinates by 2, do not add 2." }] } },
          { step: 2, m: "C(2, 3) \\to C'(4, 6)", say: "The third corner." },
          { step: 3, m: "AB = \\sqrt{5} \\qquad A'B' = \\sqrt{20} = 2\\sqrt{5}", say: "Each side is twice as long: the triangles are similar, with ratio 2." }] },
        gate: true, then: "Multiply the coordinates, and the lengths follow." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Dilate $\\triangle PQR$ by a scale factor of $\\frac{1}{2}$, centred at the origin.", art: FIG_DIL2,
        how: HOW_7_6, skill: "Dilations",
        steps: [
          { step: 1, ask: "$k = \\frac{1}{2}$. Is this an enlargement or a reduction?", type: "choice", answer: 0,
            options: [{ t: "A reduction" }, { t: "An enlargement", fb: "A scale factor between 0 and 1 makes the figure smaller." }],
            m: "k = \\frac{1}{2}", say: "Between 0 and 1: a reduction." },
          { step: 2, ask: "$P(4, 6) \\to P'(x, 3)$. What is $x$?", type: "num", answer: 2, near: [{ v: 8, fb: "Multiply by $\\frac{1}{2}$: halve it." }], hint: "Half of 4.",
            m: "P'(2, 3)", say: "Half of each coordinate." },
          { step: 2, ask: "$Q(8, 2) \\to Q'(4, y)$. What is $y$?", type: "num", answer: 1, hint: "Half of 2.",
            m: "Q'(4, 1) \\qquad R'(1, 1)", say: "And $R(2, 2)$ goes to $(1, 1)$." },
          { step: 3, ask: "$QR = 6$. How long is $Q'R'$?", type: "num", answer: 3, near: [{ v: 12, fb: "Lengths are multiplied by $k = \\frac{1}{2}$." }], hint: "Half of 6.",
            m: "Q'R' = 3", say: "From $(4, 1)$ to $(1, 1)$. Every length is halved." }],
        why: "Factor, multiply, check. Now two on your own." },
      { type: "plot", kicker: "On your own", prompt: "Draw the image of $\\triangle ABC$ under a dilation with scale factor 2, centred at the origin.",
        show: [{ poly: [[1, 1], [3, 1], [1, 2]], c: "soft", names: "ABC" }], target: [[2, 2], [6, 2], [2, 4]], x: [-1, 8], y: [-1, 6], u: 30, skill: "Dilations",
        hints: ["Double both coordinates of each corner. Start with $A(1, 1)$.", "$A'(2, 2)$, $B'(6, 2)$, $C'(2, 4)$."], why: "$(x, y) \\to (2x, 2y)$: $A'(2, 2)$, $B'(6, 2)$, $C'(2, 4)$." },
      { type: "pair", prompt: "A dilation centred at the origin sends $(3, 5)$ to $(12, 20)$. Where does it send $(2, -1)$? Type it as $(x, y)$.", answer: [8, -4], skill: "Dilations",
        near: [{ v: [11, 14], fb: "A dilation multiplies. It does not add." }], hints: ["$12 \\div 3 = 4$, so $k = 4$."], why: "$k = 4$, so $(2, -1) \\to (8, -4)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Coordinates can **prove** two triangles similar. Show that $\\triangle DEF \\sim \\triangle DGH$.",
        scene: { type: "walk", how: [["Angle", "Find a pair of congruent angles."], ["Ratios", "Find the ratios of the sides that form those angles."], ["SAS", "Two equal ratios and the included angle: similar by SAS."]], rows: [
          { step: 1, m: "\\angle D \\cong \\angle D", say: "Both triangles have the right angle at the origin.", fig: FIG_DSAS },
          { step: 2, m: "\\frac{DE}{DG} = \\frac{4}{8} = \\frac{1}{2}", say: "Along the $x$-axis." },
          { step: 2, m: "\\frac{DF}{DH} = \\frac{3}{6} = \\frac{1}{2}", say: "Along the $y$-axis.",
            ask: { prompt: "Simplify $\\frac{3}{6}$.", answer: 0,
                   options: [{ t: "$\\frac{1}{2}$" }, { t: "$2$", fb: "3 is on top: the ratio is less than 1." }] } },
          { step: 3, m: "\\triangle DEF \\sim \\triangle DGH", say: "SAS Similarity. $\\triangle DGH$ is the image of $\\triangle DEF$ under a dilation with $k = 2$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A dilation centred at the origin sends $(6, 9)$ to $(2, 3)$. Find the scale factor. (Type a fraction like 2/5.)", answer: 1 / 3, tol: 1e-6, shown: "1/3", skill: "Dilations",
        near: [{ v: 3, tol: 1e-9, fb: "The image is smaller, so $k$ is less than 1: image over original." }], hints: ["$k = \\frac{2}{6}$."], why: "$\\frac{2}{6} = \\frac{3}{9} = \\frac{1}{3}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To dilate $(4, -2)$ by a scale factor of 3, centred at the origin, Sam writes $(7, 1)$. What is wrong?",
        options: [{ t: "He added 3. A dilation multiplies: $(12, -6)$." },
                  { t: "He should have divided: $\\left(\\frac{4}{3}, -\\frac{2}{3}\\right)$.", fb: "That is a scale factor of $\\frac{1}{3}$." },
                  { t: "Nothing. $(7, 1)$ is right.", fb: "Adding 3 slides the point. It does not dilate it." }],
        answer: 0, skill: "Dilations", hints: ["$(x, y) \\to (kx, ky)$."], why: "$(3 \\cdot 4, 3 \\cdot (-2)) = (12, -6)$." },
      { type: "num", kicker: "Use it", prompt: "A designer enlarges a logo with a scale factor of 2.5. One side of the logo is 6 units long. How long is that side after the enlargement?", answer: 15, skill: "Dilations",
        near: [{ v: 8.5, fb: "Multiply by the scale factor, do not add it." }], hints: ["$6 \\cdot 2.5$."], why: "$6 \\cdot 2.5 = 15$." }
    ]
  });
  /* ================================================================ Skills */
  var FRACS = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 2], [5, 2], [4, 3], [5, 3], [7, 4]];
  // Two equal ratios, p·m / q·m and p·n / q·n: [a, b, c, d] with a/b = c/d.
  function propNums(R) {
    var F = R.pick(FRACS), m = R.int(2, 6), n = R.int(2, 7);
    if (n === m) n = m + 1;
    return [F[0] * m, F[1] * m, F[0] * n, F[1] * n];
  }
  var SKILLS = [
    { id: "hg7-proportion", title: "Ratios and proportions", lesson: 2,
      gen: function (R) {
        var k = R.int(0, 3), P = propNums(R);
        if (k === 3) { var parts = R.pick([[1, 2, 3], [2, 3, 4], [1, 3, 5], [2, 3, 5], [3, 4, 5], [1, 4, 5]]), sum = parts[0] + parts[1] + parts[2], x = 180 / sum, big = R.chance(0.5);
          return { type: "num", prompt: "The angles of a triangle are in the ratio $" + parts.join(" : ") + "$. Find the " + (big ? "largest" : "smallest") + " angle.", post: "°", answer: (big ? parts[2] : parts[0]) * x,
            near: near((big ? parts[2] : parts[0]) * x, [{ v: x, fb: "That is $x$. Multiply it by the right part of the ratio." }]), hints: ["Call the angles $" + parts[0] + "x$, $" + parts[1] + "x$ and $" + parts[2] + "x$.", "$" + sum + "x = 180$."], why: "$x = " + x + "$, so the angle is $" + (big ? parts[2] : parts[0]) + " \\cdot " + x + " = " + (big ? parts[2] : parts[0]) * x + "°$." }; }
        var i = R.int(0, 3), T = P.map(function (v, j) { return j === i ? "x" : String(v); });
        return { type: "num", prompt: "Solve $\\frac{" + T[0] + "}{" + T[1] + "} = \\frac{" + T[2] + "}{" + T[3] + "}$.", pre: "$x =$", answer: P[i],
          near: near(P[i], [{ v: i < 2 ? P[i === 0 ? 1 : 0] * P[i + 2] / P[i === 0 ? 3 : 2] : P[i === 2 ? 3 : 2] * P[i - 2] / P[i === 2 ? 1 : 0], tol: 0.01, fb: "Cross-multiply: multiply the two numbers that lie across from each other." }]),
          hints: ["Cross-multiply: $" + T[0] + " \\cdot " + T[3] + " = " + T[1] + " \\cdot " + T[2] + "$."], why: "$" + (i === 0 || i === 3 ? P[1] * P[2] + " \\div " + P[i === 0 ? 3 : 0] : P[0] * P[3] + " \\div " + P[i === 1 ? 2 : 1]) + " = " + P[i] + "$." };
      } },
    { id: "hg7-similar", title: "Similar polygons", lesson: 3,
      gen: function (R) {
        var k = R.int(0, 2), F = R.pick(FRACS), a = F[1] * R.int(1, 4), b = F[1] * R.int(2, 5);
        if (b === a) b = a + F[1];
        var a2 = a * F[0] / F[1], b2 = b * F[0] / F[1], N = R.pick([["ABC", "DEF"], ["JKL", "MNP"], ["PQR", "XYZ"], ["RST", "UVW"]]);
        if (k === 0) return { type: "num", prompt: "$\\triangle " + N[0] + " \\sim \\triangle " + N[1] + "$. $" + N[0][0] + N[0][1] + " = " + a + "$, $" + N[1][0] + N[1][1] + " = " + a2 + "$ and $" + N[0][1] + N[0][2] + " = " + b + "$. Find $" + N[1][1] + N[1][2] + "$.", answer: b2,
          near: near(b2, [{ v: b + (a2 - a), fb: "Similar figures keep the same ratio, not the same difference." }, { v: b * a / a2, tol: 0.01, fb: "Keep the order: $\\frac{" + a + "}{" + a2 + "} = \\frac{" + b + "}{x}$." }]),
          hints: ["$\\frac{" + a + "}{" + a2 + "} = \\frac{" + b + "}{x}$."], why: "$" + a + "x = " + a2 * b + "$, so $x = " + b2 + "$." };
        if (k === 1) { var w = R.int(2, 5), h = w + R.int(1, 4), m = R.int(2, 4), yes = R.chance(0.5), w2 = yes ? w * m : w + m, h2 = yes ? h * m : h + m;
          return mc(R, { prompt: "One rectangle is " + w + " by " + h + ". Another is " + w2 + " by " + h2 + ". Are they similar?", right: yes ? "Yes" : "No", keep: true,
            wrong: [{ t: yes ? "No" : "Yes", fb: yes ? "$\\frac{" + w + "}{" + w2 + "}$ and $\\frac{" + h + "}{" + h2 + "}$ are equal." : "Adding the same amount to each side changes the shape. Compare the ratios." }],
            hints: ["Compare $\\frac{" + w + "}{" + w2 + "}$ with $\\frac{" + h + "}{" + h2 + "}$."], why: yes ? "Both ratios equal $\\frac{1}{" + m + "}$." : "$\\frac{" + w + "}{" + w2 + "}$ and $\\frac{" + h + "}{" + h2 + "}$ are not equal." }); }
        return mc(R, { prompt: "$\\triangle " + N[0] + " \\sim \\triangle " + N[1] + "$, with $" + N[0][0] + N[0][1] + " = " + a2 + "$ and $" + N[1][0] + N[1][1] + " = " + a + "$. What is the similarity ratio of $\\triangle " + N[0] + "$ to $\\triangle " + N[1] + "$?", right: "$" + frac(F[0], F[1]) + "$",
          wrong: [{ t: "$" + frac(F[1], F[0]) + "$", fb: "That is the ratio of $\\triangle " + N[1] + "$ to $\\triangle " + N[0] + "$. Keep the order." }, { t: "$" + frac(F[0], F[0] + F[1]) + "$", fb: "Divide the first length by the second, then simplify." }],
          hints: ["$\\frac{" + a2 + "}{" + a + "}$, simplified."], why: "$\\frac{" + a2 + "}{" + a + "} = " + frac(F[0], F[1]) + "$." });
      } },
    { id: "hg7-criteria", title: "AA, SSS and SAS similarity", lesson: 4,
      gen: function (R) {
        var kind = R.pick(["AA", "SSS", "SAS", "Not similar", "Not similar"]), S = R.pick([[3, 4, 5], [4, 5, 7], [2, 3, 4], [5, 6, 8], [4, 6, 7]]), m = R.int(2, 4), a = R.int(35, 65), b = R.int(40, 70), text, why;
        if (kind === "AA") { text = "One triangle has angles of " + a + "° and " + b + "°. Another has angles of " + a + "° and " + (180 - a - b) + "°."; why = "The first triangle's third angle is " + (180 - a - b) + "°, so two pairs of angles are congruent."; }
        else if (kind === "SSS") { text = "One triangle has sides of " + S.join(", ") + ". Another has sides of " + S.map(function (v) { return v * m; }).join(", ") + "."; why = "Every ratio of corresponding sides is $\\frac{1}{" + m + "}$."; }
        else if (kind === "SAS") { text = "One triangle has sides of " + S[0] + " and " + S[1] + " with a " + a + "° angle between them. Another has sides of " + S[0] * m + " and " + S[1] * m + " with a " + a + "° angle between them."; why = "Two equal ratios, and the included angles are congruent."; }
        else if (R.chance(0.5)) { text = "One triangle has sides of " + S.join(", ") + ". Another has sides of " + S[0] * m + ", " + S[1] * m + ", " + (S[2] * m + 1) + "."; why = "$\\frac{" + S[2] + "}{" + (S[2] * m + 1) + "}$ is not $\\frac{1}{" + m + "}$, so the sides are not proportional."; }
        else { var third = 180 - a - b, c = third + R.pick([5, 10, -5]); if (c === b) c += 3;
          text = "One triangle has angles of " + a + "° and " + b + "°. Another has angles of " + a + "° and " + c + "°."; why = "The first triangle's angles are " + a + "°, " + b + "° and " + third + "°. The second's are " + a + "°, " + c + "° and " + (180 - a - c) + "°. Only one pair matches."; }
        var ALL = ["AA", "SSS", "SAS", "Not similar"], FB = { AA: "AA needs two pairs of congruent angles.", SSS: "SSS needs all three pairs of sides in the same ratio.", SAS: "SAS needs two pairs of sides in the same ratio, with congruent included angles.", "Not similar": "Check again: one of the shortcuts does fit." };
        return mc(R, { prompt: text + " How do you know whether they are similar?", right: kind, keep: true, wrong: ALL.filter(function (v) { return v !== kind; }).map(function (v) { return { t: v, fb: FB[v] }; }),
          hints: ["Angles given? Find each triangle's third angle. Sides given? Compare the ratios."], why: why });
      } },
    { id: "hg7-split", title: "Proportional parts of a triangle", lesson: 5,
      gen: function (R) {
        var k = R.int(0, 3), F = R.pick([[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [3, 2], [4, 3]]), m = R.int(2, 5), n = R.int(2, 6);
        if (n === m) n = m + 1;
        var a = F[0] * m, b = F[1] * m, c = F[0] * n, d = F[1] * n;
        if (k === 0) return { type: "num", prompt: "$\\overline{DE} \\parallel \\overline{BC}$. Find $x$.", art: splitFig(a / (a + b), { ad: String(a), db: String(b), ae: String(c), ec: "x", alt: "Triangle ABC with DE parallel to BC. AD is " + a + ", DB is " + b + ", AE is " + c + " and EC is x." }), pre: "$x =$", answer: d,
          near: near(d, [{ v: a * c / b, tol: 0.01, fb: "Keep the order: $\\frac{" + a + "}{" + b + "} = \\frac{" + c + "}{x}$." }]), hints: ["$\\frac{" + a + "}{" + b + "} = \\frac{" + c + "}{x}$."], why: "$" + a + "x = " + b * c + "$, so $x = " + d + "$." };
        if (k === 1) { var yes = R.chance(0.5), d2 = yes ? d : d + R.pick([1, 2]);
          return mc(R, { prompt: "Is $\\overline{DE}$ parallel to $\\overline{BC}$?", art: splitFig(a / (a + b), { ad: String(a), db: String(b), ae: String(c), ec: String(d2), alt: "Triangle ABC with D on AB and E on AC. AD is " + a + ", DB is " + b + ", AE is " + c + " and EC is " + d2 + "." }), right: yes ? "Yes" : "No", keep: true,
            wrong: [{ t: yes ? "No" : "Yes", fb: "Compare $\\frac{" + a + "}{" + b + "}$ with $\\frac{" + c + "}{" + d2 + "}$." }], hints: ["If the two sides are divided proportionally, the segment is parallel to the third side."],
            why: yes ? "$\\frac{" + a + "}{" + b + "} = \\frac{" + c + "}{" + d2 + "}$, so the sides are divided proportionally." : "$\\frac{" + a + "}{" + b + "}$ and $\\frac{" + c + "}{" + d2 + "}$ are not equal." }); }
        if (k === 2) { var mm = Math.max(m, n) + 1, AB = F[0] * mm, AC = F[1] * mm, nn = Math.min(m, n), BD = F[0] * nn, DC = F[1] * nn;
          if (Math.abs(AB - AC) >= BD + DC) { AB = 8; AC = 12; BD = 6; DC = 9; }
          return { type: "num", prompt: "$\\overline{AD}$ bisects $\\angle A$. Find $x$.", art: bisFig({ ab: String(AB), ac: String(AC), bd: String(BD), dc: "x", alt: "Triangle ABC with the bisector of angle A meeting BC at D. AB is " + AB + ", AC is " + AC + ", BD is " + BD + " and DC is x." }), pre: "$x =$", answer: DC,
            near: near(DC, [{ v: BD * AB / AC, tol: 0.01, fb: "Each part of $\\overline{BC}$ goes with the side next to it: $\\frac{" + BD + "}{x} = \\frac{" + AB + "}{" + AC + "}$." }]), hints: ["$\\frac{BD}{DC} = \\frac{AB}{AC}$: $\\frac{" + BD + "}{x} = \\frac{" + AB + "}{" + AC + "}$."], why: "$" + AB + "x = " + BD * AC + "$, so $x = " + DC + "$." }; }
        return { type: "num", prompt: "The three blue lines are parallel. Find $x$.", art: threePar(String(a), String(b), String(c), "x", "Three parallel lines cut by two transversals, into segments of " + a + " and " + b + " on the left and " + c + " and x on the right."), pre: "$x =$", answer: d,
          near: near(d, [{ v: c + (b - a), fb: "Keep the ratio, not the difference." }]), hints: ["$\\frac{" + a + "}{" + b + "} = \\frac{" + c + "}{x}$."], why: "$" + a + "x = " + b * c + "$, so $x = " + d + "$." };
      } },
    { id: "hg7-indirect", title: "Indirect measurement and scale", lesson: 6,
      gen: function (R) {
        var k = R.int(0, 2);
        if (k === 0) { var h1 = R.pick([1.5, 2]), s1 = R.pick([2, 2.5, 3, 4]), f = R.int(3, 8);
          return { type: "num", prompt: "A " + h1 + " m post casts a shadow " + s1 + " m long. At the same time a tower casts a shadow " + s1 * f + " m long. How tall is the tower?", post: "m", answer: h1 * f,
            near: near(h1 * f, [{ v: s1 * f - s1 + h1, fb: "Use a proportion, not a difference: height over shadow." }]), hints: ["$\\frac{h}{" + h1 + "} = \\frac{" + s1 * f + "}{" + s1 + "}$."], why: "The tower's shadow is " + f + " times as long, so it is " + f + " times as tall: $" + h1 * f + "$ m." }; }
        if (k === 1) { var s = R.pick([5, 10, 20, 25, 50]), d = R.int(2, 9) + R.pick([0, 0.5]);
          return { type: "num", prompt: "A map has a scale of 1 cm : " + s + " km. Two towns are " + d + " cm apart on the map. How far apart are they really?", post: "km", answer: d * s,
            near: near(d * s, [{ v: s / d, tol: 0.01, fb: "Multiply the map distance by " + s + "." }]), hints: ["Each centimetre stands for " + s + " km."], why: "$" + d + " \\cdot " + s + " = " + d * s + "$." }; }
        var sc = R.pick([20, 24, 40, 50]), len = R.int(4, 12);
        return { type: "num", prompt: "A model is built at a scale of $1 : " + sc + "$. The model is " + len + " cm long. How long is the real object, in centimetres?", post: "cm", answer: len * sc,
          near: near(len * sc, [{ v: len / sc, tol: 0.001, fb: "The real object is larger than the model: multiply." }]), hints: ["Every 1 cm on the model is " + sc + " cm on the real thing."], why: "$" + len + " \\cdot " + sc + " = " + len * sc + "$." };
      } },
    { id: "hg7-area-ratio", title: "Ratios of perimeters and areas", lesson: 6,
      gen: function (R) {
        var k = R.int(0, 2), F = R.pick([[1, 2], [2, 3], [1, 3], [3, 4], [2, 5], [3, 5]]), m = R.int(2, 6);
        if (k === 0) return { type: "num", prompt: "Two similar polygons have a similarity ratio of $" + frac(F[0], F[1]) + "$. The smaller has a perimeter of " + F[0] * m * 2 + ". Find the perimeter of the larger.", answer: F[1] * m * 2,
          near: near(F[1] * m * 2, [{ v: F[0] * m * 2 * F[1] * F[1] / (F[0] * F[0]), tol: 0.01, fb: "Squaring the ratio is for areas. Perimeters keep the ratio itself." }]), hints: ["$\\frac{" + F[0] * m * 2 + "}{P} = " + frac(F[0], F[1]) + "$."], why: "$" + F[0] + "P = " + F[0] * m * 2 * F[1] + "$, so $P = " + F[1] * m * 2 + "$." };
        if (k === 1) return { type: "num", prompt: "Two similar polygons have a similarity ratio of $" + frac(F[0], F[1]) + "$. The smaller has an area of " + F[0] * F[0] * m + ". Find the area of the larger.", answer: F[1] * F[1] * m,
          near: near(F[1] * F[1] * m, [{ v: F[0] * m * F[1], fb: "Areas have the ratio **squared**: $" + frac(F[0] * F[0], F[1] * F[1]) + "$." }]), hints: ["$\\left(" + frac(F[0], F[1]) + "\\right)^2 = " + frac(F[0] * F[0], F[1] * F[1]) + "$.", "$\\frac{" + F[0] * F[0] * m + "}{A} = " + frac(F[0] * F[0], F[1] * F[1]) + "$."], why: "$A = " + F[1] * F[1] * m + "$." };
        return mc(R, { prompt: "Two similar figures have sides in the ratio $" + F[0] + " : " + F[1] + "$. What is the ratio of their areas?", right: "$" + F[0] * F[0] + " : " + F[1] * F[1] + "$",
          wrong: [{ t: "$" + F[0] + " : " + F[1] + "$", fb: "That is the ratio of their perimeters. Areas have the ratio squared." }, { t: "$" + 2 * F[0] + " : " + 2 * F[1] + "$", fb: "Square each part. Do not double it." }],
          hints: ["Square each part of the ratio."], why: "$" + F[0] + "^2 : " + F[1] + "^2 = " + F[0] * F[0] + " : " + F[1] * F[1] + "$." });
      } },
    { id: "hg7-dilation", title: "Dilations on the coordinate plane", lesson: 7,
      gen: function (R) {
        var k = R.int(0, 2), f = R.int(2, 5), x = R.nz(-4, 4), y = R.nz(-4, 4);
        if (k === 0) { var half = R.chance(0.3), P = half ? [2 * x, 2 * y] : [x, y], Q = half ? [x, y] : [f * x, f * y];
          return { type: "pair", prompt: "Find the image of $" + pt(P) + "$ under a dilation centred at the origin with scale factor $" + (half ? "\\frac{1}{2}" : f) + "$. Type it as $(x, y)$.", answer: Q,
            near: [{ v: half ? [4 * x, 4 * y] : [x + f, y + f], fb: half ? "Multiply by $\\frac{1}{2}$: halve each coordinate." : "Multiply each coordinate by " + f + ". Do not add." }], hints: ["$(x, y) \\to (kx, ky)$."], why: "$" + pt(Q) + "$." }; }
        if (k === 1) { var up = R.chance(0.6), P2 = up ? [x, y] : [f * x, f * y], Q2 = up ? [f * x, f * y] : [x, y];
          return { type: "num", prompt: "A dilation centred at the origin sends $" + pt(P2) + "$ to $" + pt(Q2) + "$. Find the scale factor." + (up ? "" : " (Type a fraction like 2/5.)"), answer: up ? f : 1 / f, tol: 1e-6, shown: up ? String(f) : "1/" + f,
            near: [{ v: up ? 1 / f : f, tol: 1e-6, fb: "Image over original: divide a coordinate of the image by the matching coordinate of the original." }], hints: ["$k = \\frac{" + Q2[0] + "}{" + P2[0] + "}$."], why: "$\\frac{" + Q2[0] + "}{" + P2[0] + "} = " + (up ? f : "\\frac{1}{" + f + "}") + "$." }; }
        var len = R.int(3, 12);
        return { type: "num", prompt: "A segment " + len + " units long is dilated with a scale factor of " + f + ". How long is its image?", answer: len * f,
          near: near(len * f, [{ v: len + f, fb: "Multiply by the scale factor. Do not add it." }]), hints: ["Every length is multiplied by $k$."], why: "$" + len + " \\cdot " + f + " = " + len * f + "$." };
      } }
  ];
  L.unit("geo", 7, {
    title: "Similarity",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Ratios, proportions, and similar polygons.",
        skills: ["hg7-proportion", "hg7-similar"], per: 3 },
      { title: "Quiz 2", after: 5, blurb: "AA, SSS and SAS similarity, and proportional parts.",
        skills: ["hg7-criteria", "hg7-split"], per: 3 },
      { title: "Quiz 3", after: 7, blurb: "Indirect measurement, perimeters and areas, and dilations.",
        skills: ["hg7-indirect", "hg7-area-ratio", "hg7-dilation"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:7", {
    2: { name: "Ratio and proportion", frame: "A [[proportion]] says two ratios are equal. In $\\frac{a}{b} = \\frac{c}{d}$, the cross products are equal: $ad = $ [[bc]]. Here $b$ and $c$ are the [[means]].",
         chips: ["ac", "extremes"] },
    3: { name: "Similar polygons", frame: "Similar polygons have corresponding angles that are [[congruent]] and corresponding sides that are [[proportional]]. The ratio of corresponding sides is the [[similarity]] ratio.",
         chips: ["supplementary", "equal"] },
    4: { name: "Similar triangles", frame: "[[AA]]: two pairs of congruent angles. [[SSS]]: three pairs of sides in the same ratio. [[SAS]]: two pairs of sides in the same ratio, with the [[included]] angles congruent.",
         chips: ["HL", "opposite"] },
    5: { name: "Proportional parts", frame: "A line [[parallel]] to one side of a triangle divides the other two sides [[proportionally]]. An angle bisector divides the opposite side in the [[ratio]] of the other two sides.",
         chips: ["perpendicular", "equally"] },
    6: { name: "Proportional relationships", frame: "A scale drawing is [[similar]] to the real object. In similar figures, perimeters are in the similarity [[ratio]], and areas are in the ratio [[squared]].",
         chips: ["congruent", "doubled"] },
    7: { name: "Dilations", frame: "A dilation centred at the origin sends $(x, y)$ to [[(kx, ky)]]. If $k$ is greater than 1 it is an [[enlargement]]. The image is always [[similar]] to the original.",
         chips: ["(x + k, y + k)", "reduction"] }
  });
})();
