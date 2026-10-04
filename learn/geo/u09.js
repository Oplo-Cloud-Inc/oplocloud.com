/* ==========================================================================
   Geometry — Unit 9: Extending Perimeter, Circumference, and Area. See
   lab/core.js for the format and lab/geotools.js for the drawing kit.

   Follows Holt Geometry, Chapter 9, section for section (9-1 to 9-6), after
   a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   Area formulas for triangles and quadrilaterals (9-1), circles and regular
   polygons (9-2), composite figures (9-3), perimeter and area on the
   coordinate plane (9-4), what happens when dimensions change (9-5), and
   geometric probability (9-6).

   An answer with π in it is typed as the number in front of π. A
   probability is typed as a fraction.

   Lessons carry v: 4 (see Unit 1). Skills are hg9-….

   Seven lessons, six skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  var PI_POST = "$\\pi$";
  // A parallelogram with its height drawn (dashed). o.b, o.h, o.s: labels for the base, the height and the slanted side.
  function parFig(o) {
    var w = o.w || 4.4, h = o.ht || 2.4, sk = o.sk || 1.2, P = [[0, 0], [w, 0], [w + sk, h], [sk, h]];
    return shapes([[P, {}]], { alt: o.alt, extra: [{ seg: [[sk, 0], [sk, h]], dash: true, c: "orange" }, { angle: [[w, 0], [sk, 0], [sk, h]], right: true, c: "orange" }]
      .concat(lab(o.b, P[0], P[1], -1), lab(o.h, [sk, 0], [sk, h], -1, 11), lab(o.s, P[1], P[2], -1)) });
  }
  // A triangle on its base, with its height (dashed). o.b, o.h: labels for the base and the height; o.s: for the right-hand side. o.x: where the top is.
  function triH(o) {
    var w = o.w || 5, h = o.ht || 3, x = o.x == null ? 1.6 : o.x, P = [[0, 0], [w, 0], [x, h]];
    return shapes([[P, {}]], { alt: o.alt, extra: [{ seg: [[x, 0], [x, h]], dash: true, c: "orange" }, { angle: [[w, 0], [x, 0], [x, h]], right: true, c: "orange" }]
      .concat(lab(o.b, P[0], P[1], -1), lab(o.h, [x, 0], [x, h], -1, 11), lab(o.s, P[1], P[2], -1)) });
  }
  // A trapezoid with its height (dashed). o.b1, o.b2: labels for the lower and upper bases; o.h: the height.
  function trapH(o) {
    var P = [[0, 0], [5, 0], [3.8, 2.4], [1.2, 2.4]];
    return shapes([[P, {}]], { alt: o.alt, extra: [{ seg: [[1.2, 0], [1.2, 2.4]], dash: true, c: "orange" }, { angle: [[5, 0], [1.2, 0], [1.2, 2.4]], right: true, c: "orange" }]
      .concat(lab(o.b1, P[0], P[1], -1), lab(o.b2, P[3], P[2], 1), lab(o.h, [1.2, 0], [1.2, 2.4], -1, 11)) });
  }
  // A rhombus (o.kite: a kite) with its diagonals. o.d1, o.d2: the lengths of the across and the up-and-down diagonals, written beside them.
  function diagFig(o) {
    var P = o.kite ? [[-1.7, 0], [0, -3], [1.7, 0], [0, 1.4]] : [[-2.6, 0], [0, -1.6], [2.6, 0], [0, 1.6]];
    return shapes([[P, {}]], { alt: o.alt, extra: [{ seg: [P[0], P[2]], c: "orange" }, { seg: [P[1], P[3]], c: "green" }, { angle: [P[2], [0, 0], P[3]], right: true, c: "orange" }]
      .concat(o.d1 == null ? [] : [{ word: String(o.d1), at: o.kite ? [0.85, -0.34] : [1.3, -0.34] }], o.d2 == null ? [] : [{ word: String(o.d2), at: o.kite ? [-0.42, -1.5] : [-0.42, 0.8] }]) });
  }
  // A circle. o.r: label on a radius; o.d: label on a diameter.
  function circ(o) {
    var items = [{ circle: [[0, 0], 2], c: "blue" }];
    if (o.d != null) items = items.concat([{ seg: [[-2, 0], [2, 0]], c: "orange" }], lab(o.d, [-2, 0], [2, 0], 1, 15));
    if (o.r != null) items = items.concat([{ seg: [[0, 0], [2, 0]], c: "orange" }], lab(o.r, [0, 0], [2, 0], 1, 11));
    return plain([-2.6, 2.6], [-2.6, 2.6], items.concat([{ pt: [0, 0] }]), { u: 30, alt: o.alt });
  }
  // A regular polygon with n sides, flat on its lowest side, with its apothem (dashed). o.s, o.a: labels for a side and the apothem.
  function regFig(n, o) {
    var P = reg(n, 2.3, [0, 0], n % 2 ? 90 : 90 + 180 / n), lo = 0;
    P.forEach(function (p, i) { if (GT.mid(p, P[(i + 1) % n])[1] < GT.mid(P[lo], P[(lo + 1) % n])[1]) lo = i; });
    var M = GT.mid(P[lo], P[(lo + 1) % n]);
    return plain([-3, 3], [-3, 2.9], [{ poly: P, c: "blue" }, { seg: [[0, 0], M], dash: true, c: "orange" }, { angle: [P[(lo + 1) % n], M, [0, 0]], right: true, c: "orange" }, { pt: [0, 0] }]
      .concat(lab(o.s, P[lo], P[(lo + 1) % n], -1), lab(o.a, [0, 0], M, 1, 11)), { u: 30, alt: o.alt });
  }
  // A polygon with labelled sides, for a composite figure. sides: labels by side number (null for none). o.cuts: dashed segments; o.extra.
  function comp(P, sides, alt, o) {
    o = o || {};
    return shapes([[P, { sides: sides }]], { alt: alt, u: o.u, extra: (o.cuts || []).map(function (s) { return { seg: s, dash: true, c: "orange" }; }).concat(o.extra || []) });
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
    blurb: "Before Chapter 9 · Area of a rectangle, squares and roots, and the Distance Formula.",
    mins: 6, v: 4,
    steps: [
      { type: "num", kicker: "Check 1 · Rectangles", prompt: "A rectangle is 8 cm long and 5 cm wide. Find its area.", post: "cm²", answer: 40, skill: "Area of a rectangle",
        near: [{ v: 26, fb: "That is the perimeter. Area is length times width." }], hints: ["$8 \\cdot 5$."], why: "$8 \\cdot 5 = 40$." },
      { type: "num", prompt: "Find the perimeter of the same rectangle.", post: "cm", answer: 26, skill: "Perimeter",
        near: [{ v: 13, fb: "That is one length and one width. Go all the way round." }], hints: ["$2(8) + 2(5)$."], why: "$16 + 10 = 26$." },
      { type: "num", kicker: "Check 2 · Squares and roots", prompt: "Find $7^2$.", answer: 49, skill: "Squares",
        near: [{ v: 14, fb: "That is $7 \\cdot 2$. Squaring multiplies 7 by itself." }], hints: ["$7 \\cdot 7$."], why: "$7 \\cdot 7 = 49$." },
      { type: "num", prompt: "Solve $60 = 10h$.", pre: "$h =$", answer: 6, skill: "Solve an equation",
        near: [{ v: 50, fb: "Divide by 10, do not subtract it." }], hints: ["Divide both sides by 10."], why: "$60 \\div 10 = 6$." },
      { type: "num", kicker: "Check 3 · Distance", prompt: "Find the distance between $(1, 2)$ and $(4, 6)$.", answer: 5, skill: "Distance Formula",
        near: [{ v: 7, fb: "Square each difference, add, then take the root." }], hints: ["$\\sqrt{3^2 + 4^2}$."], why: "$\\sqrt{25} = 5$." },
      { type: "choice", prompt: "A bag holds 3 red marbles and 5 blue ones. You pick one without looking. What is the probability that it is red?",
        options: [{ t: "$\\frac{3}{8}$" }, { t: "$\\frac{3}{5}$", fb: "Compare red with **all** the marbles: $3 + 5 = 8$." }, { t: "$\\frac{5}{8}$", fb: "That is the probability of blue." }],
        answer: 0, skill: "Probability", hints: ["Favourable outcomes over all outcomes."], why: "3 red out of 8 marbles." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 9-1**. If **check 3** slipped, see lesson 1-6. If **check 1** slipped, see lesson 1-5.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });

  /* ============================ 9-1 · Developing formulas for triangles and quadrilaterals */
  var HOW_9_1 = [["Formula", "Choose the formula. Parallelogram: $A = bh$. Triangle: $A = \\frac{1}{2}bh$. Trapezoid: $A = \\frac{1}{2}(b_1 + b_2)h$. Rhombus or kite: $A = \\frac{1}{2}d_1 d_2$."],
                 ["Substitute", "Put in the measures. The height is perpendicular to the base."],
                 ["Solve", "Work it out. Area is in square units."]];
  var FIG_TRAP1 = trapH({ b1: "10", b2: "6", h: "4", alt: "A trapezoid with a lower base of 10, an upper base of 6 and a height of 4." }),
      FIG_TRI1 = triH({ b: "12", h: "5", s: "13", w: 5.2, ht: 2.2, x: 0, alt: "A right triangle with a base of 12, a height of 5 and a sloping side of 13." }),
      FIG_PAR1 = parFig({ b: "9", h: "4", s: "5", alt: "A parallelogram with a base of 9, a height of 4 and a slanted side of 5." }),
      FIG_RH1 = diagFig({ d1: "10", d2: "6", alt: "A rhombus. Its diagonals cross at right angles. One is 10 and the other is 6." }),
      FIG_TRAP2 = trapH({ b1: "13", b2: "7", h: "h", alt: "A trapezoid with a lower base of 13, an upper base of 7 and a height of h." }),
      FIG_KT1 = diagFig({ kite: true, d1: "8", d2: "15", alt: "A kite. Its diagonals cross at right angles. One is 8 and the other is 15." }),
      FIG_PAR2 = parFig({ b: "10", h: "5", s: "6", alt: "A parallelogram with a base of 10, a height of 5 and a slanted side of 6." });
  LESSONS.push({
    title: "Developing formulas for triangles and quadrilaterals",
    blurb: "Book 9-1 · The areas of parallelograms, triangles, trapezoids, rhombuses and kites.",
    mins: 13, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A rectangle is 8 by 5. Find its area.", answer: 40, skill: "Area of a rectangle",
        near: [{ v: 26, fb: "That is the perimeter. Multiply the length by the width." }], hints: ["$8 \\cdot 5$."], why: "$8 \\cdot 5 = 40$." },
      { type: "choice", kicker: "Explore", prompt: "Cut a right triangle off one end of a parallelogram and slide it to the other end. What do you get?",
        options: [{ t: "A rectangle with the same base and the same height" }, { t: "A bigger parallelogram", fb: "Nothing is added. The same pieces are rearranged." }, { t: "A triangle", fb: "Moving the triangle squares off both ends." }],
        answer: 0, skill: "Area formulas", hints: ["The slanted end becomes a straight one."],
        why: "The pieces are the same, so the areas are equal: a parallelogram's area is base times height, $A = bh$. Half a parallelogram is a triangle: $A = \\frac{1}{2}bh$." },
      { type: "learn", kicker: "The idea",
        prompt: "Every area formula here comes from the rectangle. A parallelogram rearranges into one. A triangle is half a parallelogram. A trapezoid is half a parallelogram whose base is $b_1 + b_2$. A rhombus or a kite is half the rectangle drawn round its diagonals.",
        scene: { type: "method", how: HOW_9_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the area of this trapezoid found.",
        scene: { type: "walk", how: HOW_9_1, rows: [
          { step: 1, m: "A = \\frac{1}{2}(b_1 + b_2)h", say: "One pair of parallel sides: a trapezoid.", fig: FIG_TRAP1 },
          { step: 2, m: "A = \\frac{1}{2}(10 + 6)(4)", say: "The bases are 10 and 6. The height is 4." },
          { step: 3, m: "A = \\frac{1}{2}(16)(4)", say: "Add the bases first.",
            ask: { prompt: "What is $\\frac{1}{2}(16)(4)$?", answer: 0,
                   options: [{ t: "32" }, { t: "64", fb: "That is $16 \\cdot 4$. Take half." }] } },
          { step: 3, m: "A = 32", say: "32 square units." }] },
        gate: true, then: "Formula, substitute, solve." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the area of this triangle.", art: FIG_TRI1,
        how: HOW_9_1, skill: "Area formulas",
        steps: [
          { step: 1, ask: "Which formula fits a triangle?", type: "choice", answer: 0,
            options: [{ t: "$A = \\frac{1}{2}bh$" }, { t: "$A = bh$", fb: "That is a parallelogram. A triangle is half of one." }],
            m: "A = \\frac{1}{2}bh", say: "Half of base times height." },
          { step: 2, ask: "The base is 12. Which length is the height?", type: "choice", answer: 0,
            options: [{ t: "5: it is perpendicular to the base" }, { t: "13: it is the longest side", fb: "The height must meet the base at a right angle. The side of 13 slopes." }],
            m: "A = \\frac{1}{2}(12)(5)", say: "The height is perpendicular to the base." },
          { step: 3, ask: "What is the area?", type: "num", answer: 30, near: [{ v: 60, fb: "That is $12 \\cdot 5$. Take half." }, { v: 78, fb: "13 is not the height." }], hint: "Half of 60.",
            m: "A = 30", say: "30 square units." }],
        why: "Formula, substitute, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the area of this parallelogram.", art: FIG_PAR1, answer: 36, skill: "Area formulas",
        near: [{ v: 45, fb: "5 is the slanted side. The height is the perpendicular distance: 4." }, { v: 18, fb: "A parallelogram's area is $bh$, with no half." }],
        hints: ["$A = bh$, with the perpendicular height."], why: "$9 \\cdot 4 = 36$." },
      { type: "num", prompt: "Find the area of this rhombus.", art: FIG_RH1, answer: 30, skill: "Area formulas",
        near: [{ v: 60, fb: "That is $d_1 d_2$. Take half." }], hints: ["$A = \\frac{1}{2}d_1 d_2$."], why: "$\\frac{1}{2}(10)(6) = 30$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A formula can run backwards. This trapezoid has an area of 60. Find its height.",
        scene: { type: "walk", how: [["Formula", "Write the formula."], ["Substitute", "Put in the area and the measures you know."], ["Solve", "Solve for the unknown."]], rows: [
          { step: 1, m: "A = \\frac{1}{2}(b_1 + b_2)h", say: "The trapezoid formula.", fig: FIG_TRAP2 },
          { step: 2, m: "60 = \\frac{1}{2}(13 + 7)h", say: "The area is 60, and the bases are 13 and 7." },
          { step: 3, m: "60 = 10h", say: "$\\frac{1}{2}(20) = 10$.",
            ask: { prompt: "What is $h$ when $10h = 60$?", answer: 0,
                   options: [{ t: "6" }, { t: "50", fb: "Divide by 10, do not subtract it." }] } },
          { step: 3, m: "h = 6", say: "The height is 6." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the area of this kite.", art: FIG_KT1, answer: 60, skill: "Area formulas",
        near: [{ v: 120, fb: "That is $d_1 d_2$. Take half." }, { v: 23, fb: "Multiply the diagonals, then halve. Do not add them." }], hints: ["$A = \\frac{1}{2}d_1 d_2$."], why: "$\\frac{1}{2}(8)(15) = 60$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia finds the area of this parallelogram as $10 \\cdot 6 = 60$. What is wrong?", art: FIG_PAR2,
        options: [{ t: "6 is the slanted side. The height is 5, so the area is 50." },
                  { t: "She should have halved: 30.", fb: "A parallelogram's area is $bh$, with no half." },
                  { t: "Nothing. Base times side is the area.", fb: "The height must be perpendicular to the base." }],
        answer: 0, skill: "Area formulas", hints: ["Which length meets the base at a right angle?"], why: "$A = bh = 10 \\cdot 5 = 50$." },
      { type: "num", kicker: "Use it", prompt: "A triangular sail has a base of 3 m and a height of 4.5 m. Find its area.", post: "m²", answer: 6.75, skill: "Area formulas",
        near: [{ v: 13.5, fb: "That is $3 \\cdot 4.5$. Take half." }], hints: ["$\\frac{1}{2}(3)(4.5)$."], why: "$\\frac{1}{2}(13.5) = 6.75$." }
    ]
  });

  /* =========================== 9-2 · Developing formulas for circles and regular polygons */
  var HOW_9_2 = [["Radius", "Find the radius $r$: half the diameter."],
                 ["Formula", "Circumference: $C = 2\\pi r$. Area: $A = \\pi r^2$."],
                 ["Solve", "Leave $\\pi$ in the answer, or use $\\pi \\approx 3.14$."]];
  var FIG_C10 = circ({ d: "10", alt: "A circle with a diameter of 10." }),
      FIG_C12 = circ({ d: "12", alt: "A circle with a diameter of 12." }),
      FIG_C9 = circ({ r: "9", alt: "A circle with a radius of 9." }),
      FIG_HEX6 = regFig(6, { s: "6", a: "5.2", alt: "A regular hexagon with sides of 6. A dashed segment of 5.2 runs from its centre to the middle of one side, meeting it at a right angle." }),
      FIG_PEN8 = regFig(5, { s: "8", a: "5.5", alt: "A regular pentagon with sides of 8. A dashed segment of 5.5 runs from its centre to the middle of one side, meeting it at a right angle." });
  LESSONS.push({
    title: "Developing formulas for circles and regular polygons",
    blurb: "Book 9-2 · The circumference and area of a circle, and the area of a regular polygon.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A circle has a diameter of 12. What is its radius?", answer: 6, skill: "Circles",
        near: [{ v: 24, fb: "The radius is half the diameter, not double." }], hints: ["Half of 12."], why: "$12 \\div 2 = 6$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **circle** is every point at one distance, the radius $r$, from its **center**. The ratio of its circumference to its diameter is always the same number, $\\pi \\approx 3.14$. So $C = \\pi d = 2\\pi r$. Cut the circle into thin wedges and rearrange them, and you get $A = \\pi r^2$.",
        scene: { type: "method", how: HOW_9_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the circumference and the area of this circle found.",
        scene: { type: "walk", how: HOW_9_2, rows: [
          { step: 1, m: "r = 10 \\div 2 = 5", say: "Half the diameter.", fig: FIG_C10 },
          { step: 2, m: "C = 2\\pi(5) = 10\\pi", say: "The circumference, with $\\pi$ left in." },
          { step: 2, m: "A = \\pi(5)^2 = 25\\pi", say: "The area: square the radius.",
            ask: { prompt: "What is $5^2$?", answer: 0,
                   options: [{ t: "25" }, { t: "10", fb: "That is $5 \\cdot 2$. Squaring multiplies 5 by itself." }] } },
          { step: 3, m: "C \\approx 31.4 \\qquad A \\approx 78.5", say: "With $\\pi \\approx 3.14$. Circumference is in units, area in square units." }] },
        gate: true, then: "Circumference uses $r$. Area uses $r^2$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the circumference and the area of this circle.", art: FIG_C12,
        how: HOW_9_2, skill: "Circles",
        steps: [
          { step: 1, ask: "What is the radius?", type: "num", answer: 6, near: [{ v: 12, fb: "12 is the diameter. Halve it." }], hint: "Half of 12.",
            m: "r = 6", say: "Half the diameter." },
          { step: 2, ask: "$C = 2\\pi r$. The circumference is what number times $\\pi$?", type: "num", answer: 12, near: [{ v: 36, fb: "That is $r^2$, for the area. The circumference is $2 \\cdot 6$ times $\\pi$." }], hint: "$2 \\cdot 6$.",
            m: "C = 12\\pi", say: "$2\\pi(6)$." },
          { step: 2, ask: "$A = \\pi r^2$. The area is what number times $\\pi$?", type: "num", answer: 36, near: [{ v: 12, fb: "Square the radius: $6 \\cdot 6$." }], hint: "$6^2$.",
            m: "A = 36\\pi", say: "$\\pi(6)^2$." },
          { step: 3, ask: "With $\\pi \\approx 3.14$, what is the area to the nearest whole number?", type: "choice", answer: 0,
            options: [{ t: "113" }, { t: "38", fb: "That is $12 \\cdot 3.14$: the circumference." }],
            m: "A \\approx 36(3.14) \\approx 113", say: "$36 \\cdot 3.14 = 113.04$." }],
        why: "Radius, formula, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the circumference of this circle. Type the number in front of $\\pi$.", art: FIG_C9, post: PI_POST, answer: 18, skill: "Circles",
        near: [{ v: 81, fb: "That is the area, $\\pi r^2$. The circumference is $2\\pi r$." }, { v: 9, fb: "$C = 2\\pi r$: double the radius." }], hints: ["$2 \\cdot 9$."], why: "$C = 2\\pi(9) = 18\\pi$." },
      { type: "num", prompt: "A circle has an area of $49\\pi$. Find its radius.", answer: 7, skill: "Circles",
        near: [{ v: 24.5, fb: "$r^2 = 49$: take the square root, do not halve." }], hints: ["$\\pi r^2 = 49\\pi$, so $r^2 = 49$."], why: "$r = \\sqrt{49} = 7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The **apothem** of a regular polygon is the distance from its centre to a side. Join the centre to every vertex and you get triangles of height $a$, so $A = \\frac{1}{2}aP$, where $P$ is the perimeter. Find the area of this hexagon.",
        scene: { type: "walk", how: [["Perimeter", "Multiply the side length by the number of sides."], ["Apothem", "Find the apothem: the distance from the centre to a side."], ["Area", "Use $A = \\frac{1}{2}aP$."]], rows: [
          { step: 1, m: "P = 6 \\cdot 6 = 36", say: "Six sides of 6.", fig: FIG_HEX6 },
          { step: 2, m: "a = 5.2", say: "Given: the dashed segment." },
          { step: 3, m: "A = \\frac{1}{2}(5.2)(36)", say: "Half the apothem times the perimeter.",
            ask: { prompt: "What is half of 36?", answer: 0,
                   options: [{ t: "18" }, { t: "72", fb: "Half, not double." }] } },
          { step: 3, m: "A = 5.2 \\cdot 18 = 93.6", say: "93.6 square units." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the area of this regular pentagon.", art: FIG_PEN8, answer: 110, skill: "Regular polygons",
        near: [{ v: 220, fb: "That is $aP$. Take half." }, { v: 22, fb: "Use the whole perimeter: $5 \\cdot 8 = 40$." }], hints: ["$P = 5 \\cdot 8 = 40$.", "$A = \\frac{1}{2}(5.5)(40)$."], why: "$\\frac{1}{2}(5.5)(40) = 110$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Find the area of a circle with a diameter of 8. Tap the line where the work **first** goes wrong.",
        lines: ["d = 8", "A = \\pi(8)^2", "A = 64\\pi"], answer: 1, fix: "A = \\pi(4)^2",
        fb: { 0: GIVEN, 2: LATER }, skill: "Circles",
        hints: ["Does the formula use the diameter or the radius?"],
        why: "The radius is 4, so $A = 16\\pi$." },
      { type: "num", kicker: "Use it", prompt: "A bicycle wheel has a diameter of 70 cm. How far does the bicycle move in one turn of the wheel, to the nearest centimetre? Use $\\pi \\approx 3.14$.", post: "cm", answer: 220, tol: 1, skill: "Circles",
        near: [{ v: 3847, tol: 3, fb: "That is the area. One turn rolls out the circumference." }], hints: ["One turn is one circumference: $C = \\pi d$."], why: "$3.14 \\cdot 70 = 219.8$, about 220." }
    ]
  });

  /* ============================================================ 9-3 · Composite figures */
  var HOW_9_3 = [["Split", "Split the figure into shapes you know, or see it as one shape with a piece cut out."],
                 ["Areas", "Find the area of each piece."],
                 ["Combine", "Add the pieces, or subtract the piece that is cut out."]];
  var FIG_HOUSE = comp([[0, 0], [6, 0], [6, 4], [3, 7], [0, 4]], ["6", "4", null, null, null], "A house shape: a rectangle 6 wide and 4 high, with a triangle on top that is 3 high.", { u: 26, cuts: [[[0, 4], [6, 4]], [[3, 4], [3, 7]]], extra: lab("3", [3, 4], [3, 7], -1, 10) }),
      FIG_HOLE = shapes([[[[0, 0], [6, 0], [6, 4], [0, 4]], { sides: ["12", "8", null, null] }], [[[2.2, 1.3], [4.2, 1.3], [4.2, 2.8], [2.2, 2.8]], { c: "orange", sides: ["4", "3", null, null], off: 11 }]],
        { alt: "A rectangle 12 by 8 with a smaller rectangle, 4 by 3, cut out of its middle." }),
      FIG_L = comp([[0, 0], [5, 0], [5, 2], [2, 2], [2, 4.5], [0, 4.5]], ["10", "4", null, "5", "4", null], "An L shape. Its bottom edge is 10 and its right edge is 4. The upright part is 4 wide and rises 5 above the bottom part.", { cuts: [[[0, 2], [2, 2]]] }),
      FIG_SEMI = plain([-0.9, 5.4], [-0.9, 5.4], [{ path: [[0, 3], [0, 0], [4, 0], [4, 3]], c: "blue" }, { arc: [[2, 3], 2, 0, 180], c: "blue" }, { seg: [[0, 3], [4, 3]], dash: true, c: "orange" }].concat(lab("8", [0, 0], [4, 0], -1), lab("6", [4, 0], [4, 3], -1)),
        { u: 30, alt: "A rectangle 8 wide and 6 high with a semicircle on top. The semicircle's diameter is the rectangle's top side." }),
      FIG_SQC = plain([-0.8, 4.8], [-0.8, 4.8], [{ poly: [[0, 0], [4, 0], [4, 4], [0, 4]], c: "blue", fill: true }, { circle: [[2, 2], 2], c: "orange" }, { seg: [[2, 2], [4, 2]], c: "orange" }].concat(lab("8", [0, 0], [4, 0], -1), lab("4", [2, 2], [4, 2], 1, 10)),
        { u: 30, alt: "A square with sides of 8. A circle of radius 4 inside it just touches all four sides." }),
      FIG_OCT = grid([-1, 6], [-1, 5], [{ poly: [[1, 0], [4, 0], [5, 1], [5, 3], [4, 4], [1, 4], [0, 3], [0, 1]], c: "blue", fill: true }],
        { u: 34, alt: "A grid with an eight-sided figure. It is 5 squares wide and 4 squares high, and each of its four corners is cut off along the diagonal of one square." });
  LESSONS.push({
    title: "Composite figures",
    blurb: "Book 9-3 · Find the area of a figure made from simpler ones, by adding or by subtracting.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the area of a triangle with a base of 6 and a height of 4.", answer: 12, skill: "Area formulas",
        near: [{ v: 24, fb: "That is $6 \\cdot 4$. Take half." }], hints: ["$\\frac{1}{2}(6)(4)$."], why: "$\\frac{1}{2}(24) = 12$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **composite figure** is made of simple shapes: triangles, rectangles, trapezoids, circles. Its area is the sum of the areas of its parts, as long as they do not overlap. A figure with a hole is a whole shape **minus** the part cut out.",
        scene: { type: "method", how: HOW_9_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the area of this house shape found by adding.",
        scene: { type: "walk", how: HOW_9_3, rows: [
          { step: 1, m: "\\text{a rectangle and a triangle}", say: "The dashed line splits it.", fig: FIG_HOUSE },
          { step: 2, m: "6 \\cdot 4 = 24", say: "The rectangle." },
          { step: 2, m: "\\frac{1}{2}(6)(3) = 9", say: "The triangle: base 6, height 3.",
            ask: { prompt: "What is $\\frac{1}{2}(6)(3)$?", answer: 0,
                   options: [{ t: "9" }, { t: "18", fb: "That is $6 \\cdot 3$. Take half." }] } },
          { step: 3, m: "24 + 9 = 33", say: "33 square units." }] },
        gate: true, then: "Split, find each area, combine." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the area of the blue region: a rectangle with a rectangular hole.", art: FIG_HOLE,
        how: HOW_9_3, skill: "Composite figures",
        steps: [
          { step: 1, ask: "How should you see this figure?", type: "choice", answer: 0,
            options: [{ t: "The large rectangle, minus the small one" }, { t: "The large rectangle, plus the small one", fb: "The small rectangle is a hole: it is missing." }],
            m: "\\text{large rectangle} - \\text{small rectangle}", say: "A whole shape with a piece cut out." },
          { step: 2, ask: "What is the area of the large rectangle?", type: "num", answer: 96, hint: "$12 \\cdot 8$.",
            m: "12 \\cdot 8 = 96", say: "The whole." },
          { step: 2, ask: "What is the area of the hole?", type: "num", answer: 12, hint: "$4 \\cdot 3$.",
            m: "4 \\cdot 3 = 12", say: "The piece cut out." },
          { step: 3, ask: "So what is the area of the blue region?", type: "num", answer: 84, near: [{ v: 108, fb: "Subtract the hole. Do not add it." }], hint: "$96 - 12$.",
            m: "96 - 12 = 84", say: "84 square units." }],
        why: "Split, areas, combine. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the area of this L shape.", art: FIG_L, answer: 60, skill: "Composite figures",
        near: [{ v: 76, fb: "The parts overlap that way. Split along the dashed line: a 10 by 4 rectangle and a 4 by 5 rectangle." }, { v: 90, fb: "That is the whole 10 by 9 rectangle. Part of it is missing." }],
        hints: ["Bottom rectangle: $10 \\cdot 4$. Top rectangle: $4 \\cdot 5$."], why: "$40 + 20 = 60$." },
      { type: "num", prompt: "This figure is a rectangle with a semicircle on top. Its area is $48 + k\\pi$. Find $k$.", art: FIG_SEMI, pre: "$k =$", answer: 8, skill: "Composite figures",
        near: [{ v: 16, fb: "That is a whole circle of radius 4. A semicircle is half of it." }, { v: 32, fb: "The radius is half of 8: use $r = 4$." }],
        hints: ["The semicircle's diameter is 8, so its radius is 4.", "Half of $\\pi(4)^2$."], why: "$\\frac{1}{2}\\pi(16) = 8\\pi$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Subtracting a curved piece. Find the area of the blue corners left when this circle is cut from the square. Use $\\pi \\approx 3.14$.",
        scene: { type: "walk", how: HOW_9_3, rows: [
          { step: 1, m: "\\text{square} - \\text{circle}", say: "The circle is cut out of the square.", fig: FIG_SQC },
          { step: 2, m: "8^2 = 64", say: "The square." },
          { step: 2, m: "\\pi(4)^2 = 16\\pi \\approx 50.24", say: "The circle, with radius 4.",
            ask: { prompt: "What is $16(3.14)$?", answer: 0,
                   options: [{ t: "50.24" }, { t: "25.12", fb: "That is $8 \\cdot 3.14$." }] } },
          { step: 3, m: "64 - 50.24 = 13.76", say: "About 13.8 square units are left in the corners." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Estimate by counting. Each whole square counts 1, and each half square counts $\\frac{1}{2}$. Find the area of the figure.", art: FIG_OCT, answer: 18, skill: "Composite figures",
        near: [{ v: 20, fb: "That is the whole 5 by 4 rectangle. Each corner has lost half a square." }, { v: 16, fb: "Those are the whole squares. Add the four half squares." }],
        hints: ["There are 16 whole squares and 4 half squares."], why: "$16 + 4 \\cdot \\frac{1}{2} = 18$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A rectangle 10 by 6 has a triangular corner cut off, with legs of 3 and 4. Ed finds the area as $60 + 6 = 66$. What is wrong?",
        options: [{ t: "The corner is cut off, so its area is subtracted: $60 - 6 = 54$." },
                  { t: "The triangle's area is 12, not 6.", fb: "$\\frac{1}{2}(3)(4) = 6$ is right." },
                  { t: "Nothing. The parts are added.", fb: "A piece that is removed makes the area smaller." }],
        answer: 0, skill: "Composite figures", hints: ["Is the triangle part of the figure, or missing from it?"], why: "Whole minus the missing piece." },
      { type: "num", kicker: "Use it", prompt: "A lawn is a rectangle 20 m by 12 m. A square flower bed, 4 m on each side, is cut into it. What area of grass is left?", post: "m²", answer: 224, skill: "Composite figures",
        near: [{ v: 256, fb: "The flower bed is not grass. Subtract it." }, { v: 232, fb: "The bed's area is $4 \\cdot 4 = 16$, not 8." }],
        hints: ["$20 \\cdot 12 - 4 \\cdot 4$."], why: "$240 - 16 = 224$." }
    ]
  });
  /* ======================================= 9-4 · Perimeter and area in the coordinate plane */
  var HOW_9_4 = [["Plot", "Draw the figure, and name what kind it is."],
                 ["Lengths", "Find the lengths you need: count along grid lines, or use the Distance Formula."],
                 ["Formula", "Use the perimeter or area formula. For an awkward figure, box it in and subtract."]];
  var FIG_G1 = grid([-1, 8], [-1, 6], [{ poly: [[1, 1], [7, 1], [4, 5]], names: "ABC" }, { seg: [[4, 1], [4, 5]], dash: true, c: "orange" }],
        { u: 28, alt: "A coordinate grid. Triangle ABC has A at (1, 1), B at (7, 1) and C at (4, 5). A dashed segment drops from C straight down to AB." }),
      FIG_G2 = grid([-1, 10], [-1, 5], [{ poly: [[0, 0], [9, 0], [6, 4], [3, 4]], names: "ABCD" }],
        { u: 28, alt: "A coordinate grid. Quadrilateral ABCD has A at the origin, B at (9, 0), C at (6, 4) and D at (3, 4)." }),
      FIG_G3 = grid([-1, 7], [-1, 6], [{ path: [[1, 1], [6, 1], [6, 5], [1, 5]], closed: true, dash: true, c: "orange" }, { poly: [[1, 1], [6, 2], [3, 5]], names: "ABC", fill: true }],
        { u: 30, alt: "A coordinate grid. Triangle ABC has A at (1, 1), B at (6, 2) and C at (3, 5). A dashed rectangle with corners at (1, 1) and (6, 5) boxes it in." }),
      FIG_G4 = grid([-1, 5], [-1, 4], [{ path: [[0, 0], [4, 0], [4, 3], [0, 3]], closed: true, dash: true, c: "orange" }, { poly: [[0, 0], [4, 1], [1, 3]], names: "PQR", fill: true }],
        { u: 36, alt: "A coordinate grid. Triangle PQR has P at the origin, Q at (4, 1) and R at (1, 3). A dashed rectangle with corners at the origin and (4, 3) boxes it in." });
  LESSONS.push({
    title: "Perimeter and area in the coordinate plane",
    blurb: "Book 9-4 · Use coordinates to find the lengths that the perimeter and area formulas need.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the distance between $(1, 2)$ and $(4, 6)$.", answer: 5, skill: "Distance Formula",
        near: [{ v: 7, fb: "Square each difference, add, then take the root." }], hints: ["$\\sqrt{3^2 + 4^2}$."], why: "$\\sqrt{25} = 5$." },
      { type: "learn", kicker: "The idea",
        prompt: "On the coordinate plane, lengths come from the coordinates. Sides along grid lines can be counted. Slanted sides need the Distance Formula. A figure with no side along a grid line can be boxed in a rectangle: subtract the right triangles round it.",
        scene: { type: "method", how: HOW_9_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the area and the perimeter of $\\triangle ABC$ found.",
        scene: { type: "walk", how: HOW_9_4, rows: [
          { step: 1, m: "\\text{a triangle with a horizontal base}", say: "$\\overline{AB}$ lies along a grid line.", fig: FIG_G1 },
          { step: 2, m: "AB = 6 \\qquad h = 4", say: "Count: from 1 to 7 across, and from 1 to 5 up." },
          { step: 2, m: "AC = \\sqrt{3^2 + 4^2} = 5", say: "The Distance Formula. $BC$ is 5 as well." },
          { step: 3, m: "A = \\frac{1}{2}(6)(4) = 12", say: "Half of base times height.",
            ask: { prompt: "What is the perimeter, $6 + 5 + 5$?", answer: 0,
                   options: [{ t: "16" }, { t: "12", fb: "That is the area. Add the three sides." }] } },
          { step: 3, m: "P = 6 + 5 + 5 = 16", say: "The area is 12 square units. The perimeter is 16 units." }] },
        gate: true, then: "Count where you can. Use the Distance Formula where you must." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the perimeter and the area of $ABCD$.", art: FIG_G2,
        how: HOW_9_4, skill: "Coordinate area",
        steps: [
          { step: 1, ask: "$\\overline{AB}$ and $\\overline{DC}$ are both horizontal. What kind of figure is $ABCD$?", type: "choice", answer: 0,
            options: [{ t: "A trapezoid" }, { t: "A parallelogram", fb: "$AB = 9$ and $DC = 3$: only one pair of sides is parallel." }],
            m: "\\text{trapezoid}", say: "Bases $\\overline{AB}$ and $\\overline{DC}$." },
          { step: 2, ask: "Find $AD$, from $(0, 0)$ to $(3, 4)$.", type: "num", answer: 5, near: [{ v: 7, fb: "Square each, add, then take the root." }], hint: "$\\sqrt{3^2 + 4^2}$.",
            m: "AD = 5 \\qquad BC = 5", say: "Both legs: 3 across and 4 up." },
          { step: 2, ask: "How long is $\\overline{DC}$, from $(3, 4)$ to $(6, 4)$?", type: "num", answer: 3, hint: "$6 - 3$.",
            m: "AB = 9 \\qquad DC = 3 \\qquad h = 4", say: "The bases and the height, by counting." },
          { step: 3, ask: "What is the perimeter?", type: "num", answer: 22, hint: "$9 + 5 + 3 + 5$.",
            m: "P = 9 + 5 + 3 + 5 = 22", say: "All four sides." },
          { step: 3, ask: "What is the area?", type: "num", answer: 24, near: [{ v: 48, fb: "That is $(9 + 3)(4)$. Take half." }], hint: "$\\frac{1}{2}(9 + 3)(4)$.",
            m: "A = \\frac{1}{2}(9 + 3)(4) = 24", say: "The trapezoid formula." }],
        why: "Plot, lengths, formula. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A rectangle has vertices $(1, 1)$, $(6, 1)$, $(6, 4)$ and $(1, 4)$. Find its area.", answer: 15, skill: "Coordinate area",
        near: [{ v: 16, fb: "That is the perimeter. Multiply the length by the width." }, { v: 24, fb: "Subtract the coordinates to get the sides: $6 - 1$ and $4 - 1$." }],
        hints: ["Its sides are $6 - 1 = 5$ and $4 - 1 = 3$."], why: "$5 \\cdot 3 = 15$." },
      { type: "num", prompt: "A triangle has vertices $(0, 0)$, $(6, 0)$ and $(2, 5)$. Find its area.", answer: 15, skill: "Coordinate area",
        near: [{ v: 30, fb: "That is $6 \\cdot 5$. Take half." }], hints: ["The base is 6, along the $x$-axis. The height is 5."], why: "$\\frac{1}{2}(6)(5) = 15$." },
      { type: "learn", kicker: "A harder case",
        prompt: "No side of this triangle lies along a grid line. Box it in, and subtract the three right triangles round it.",
        scene: { type: "walk", how: [["Box", "Draw the rectangle that just holds the figure."], ["Corners", "Find the area of each right triangle in the corners."], ["Subtract", "Take the corners away from the rectangle."]], rows: [
          { step: 1, m: "5 \\cdot 4 = 20", say: "The dashed rectangle, from $(1, 1)$ to $(6, 5)$.", fig: FIG_G3 },
          { step: 2, m: "\\frac{1}{2}(5)(1) = 2.5", say: "Below $\\overline{AB}$: legs 5 and 1." },
          { step: 2, m: "\\frac{1}{2}(3)(3) = 4.5", say: "Beside $\\overline{BC}$: legs 3 and 3." },
          { step: 2, m: "\\frac{1}{2}(2)(4) = 4", say: "Beside $\\overline{CA}$: legs 2 and 4.",
            ask: { prompt: "What is $2.5 + 4.5 + 4$?", answer: 0,
                   options: [{ t: "11" }, { t: "10", fb: "$2.5 + 4.5 = 7$, and $7 + 4 = 11$." }] } },
          { step: 3, m: "20 - 11 = 9", say: "The triangle's area is 9 square units." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Box in $\\triangle PQR$ and subtract. Find its area.", art: FIG_G4, answer: 5.5, skill: "Coordinate area",
        near: [{ v: 6.5, fb: "That is the total of the three corners. Subtract it from the rectangle's 12." }, { v: 12, fb: "That is the rectangle. Take away the three right triangles." }],
        hints: ["The rectangle is $4 \\cdot 3 = 12$.", "The corners are $\\frac{1}{2}(4)(1)$, $\\frac{1}{2}(3)(2)$ and $\\frac{1}{2}(1)(3)$."], why: "$12 - (2 + 3 + 1.5) = 5.5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For the triangle with vertices $(0, 0)$, $(6, 0)$ and $(2, 5)$, Lu uses the side from $(0, 0)$ to $(2, 5)$ as the height. What is wrong?",
        options: [{ t: "The height is the perpendicular distance from $(2, 5)$ to the base: 5." },
                  { t: "The base should be that side.", fb: "Any side can be the base, but the height must be perpendicular to it." },
                  { t: "Nothing. A side can be the height.", fb: "Only when it is perpendicular to the base. That side slopes." }],
        answer: 0, skill: "Coordinate area", hints: ["What angle does a height make with the base?"], why: "The base is on the $x$-axis, so the height is the $y$-coordinate of the top vertex." },
      { type: "num", kicker: "Use it", prompt: "A park is drawn on a grid where each unit stands for 10 m. On the grid it is a rectangle 6 units by 4 units. What is the park's real area?", post: "m²", answer: 2400, skill: "Coordinate area",
        near: [{ v: 240, fb: "Each side is 10 times as long, so the area is $10 \\cdot 10$ times as big." }, { v: 24, fb: "That is in grid squares. Each square is 10 m by 10 m." }],
        hints: ["The real sides are 60 m and 40 m."], why: "$60 \\cdot 40 = 2400$." }
    ]
  });

  /* =================================== 9-5 · Effects of changing dimensions proportionally */
  var HOW_9_5 = [["Factor", "Find the factor $k$ that every dimension is multiplied by."],
                 ["Perimeter", "The perimeter, or circumference, is multiplied by $k$."],
                 ["Area", "The area is multiplied by $k^2$."]];
  var FIG_2R = shapes([[[[0, 0], [1.6, 0], [1.6, 2.4], [0, 2.4]], { sides: ["4", "6", null, null] }], [[[3.4, 0], [6.6, 0], [6.6, 4.8], [3.4, 4.8]], { sides: ["8", "12", null, null], c: "green" }]],
        { alt: "A rectangle 4 by 6, and a larger rectangle 8 by 12." }),
      FIG_T3 = triH({ b: "10", h: "6", w: 4.4, ht: 2.64, x: 1.5, alt: "A triangle with a base of 10 and a height of 6." });
  LESSONS.push({
    title: "Effects of changing dimensions proportionally",
    blurb: "Book 9-5 · Multiply every dimension by k: the perimeter is multiplied by k, and the area by k squared.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $3^2$.", answer: 9, skill: "Squares",
        near: [{ v: 6, fb: "That is $3 \\cdot 2$. Squaring multiplies 3 by itself." }], hints: ["$3 \\cdot 3$."], why: "$3 \\cdot 3 = 9$." },
      { type: "learn", kicker: "The idea",
        prompt: "Multiply **every** dimension of a figure by the same number $k$ and you get a similar figure. Its perimeter is $k$ times as long. Its area is $k^2$ times as big, because area multiplies two dimensions and each one grew by $k$.",
        scene: { type: "method", how: HOW_9_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch what doubling both dimensions does to a 4 by 6 rectangle.",
        scene: { type: "walk", how: HOW_9_5, rows: [
          { step: 1, m: "k = 2", say: "4 becomes 8, and 6 becomes 12.", fig: FIG_2R },
          { step: 2, m: "P\\text{: } 20 \\to 40", say: "$2(4 + 6)$ and $2(8 + 12)$. The perimeter doubled." },
          { step: 3, m: "A\\text{: } 24 \\to 96", say: "$4 \\cdot 6$ and $8 \\cdot 12$.",
            ask: { prompt: "$96 \\div 24$: the area was multiplied by…", answer: 0,
                   options: [{ t: "4" }, { t: "2", fb: "$24 \\cdot 2 = 48$, not 96." }] } },
          { step: 3, m: "96 = 4 \\cdot 24", say: "The area was multiplied by $2^2 = 4$." }] },
        gate: true, then: "Perimeter by $k$. Area by $k^2$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. The base and the height of this triangle are both tripled.", art: FIG_T3,
        how: HOW_9_5, skill: "Changing dimensions",
        steps: [
          { step: 1, ask: "What is $k$?", type: "num", answer: 3, hint: "Tripled means multiplied by 3.",
            m: "k = 3", say: "Every dimension is multiplied by 3." },
          { step: 2, ask: "The perimeter is multiplied by…", type: "choice", answer: 0,
            options: [{ t: "3" }, { t: "9", fb: "That is $k^2$, for the area. Each side is 3 times as long, so the perimeter is too." }],
            m: "P \\to 3P", say: "Each side triples, so their sum triples." },
          { step: 3, ask: "The area is 30 now. What will it be?", type: "num", answer: 270, near: [{ v: 90, fb: "The area is multiplied by $k^2 = 9$, not by 3." }], hint: "$30 \\cdot 3^2$.",
            m: "30 \\cdot 3^2 = 270", say: "Check: $\\frac{1}{2}(30)(18) = 270$." }],
        why: "Factor, perimeter, area. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "The radius of a circle is multiplied by 3. Its area is multiplied by what number?", answer: 9, skill: "Changing dimensions",
        near: [{ v: 3, fb: "That is what happens to the circumference. The area is multiplied by $k^2$." }, { v: 6, fb: "Square the factor: $3^2$. Do not double it." }],
        hints: ["$\\pi(3r)^2 = 9\\pi r^2$."], why: "$3^2 = 9$." },
      { type: "num", prompt: "Every side of a square is halved. Its area is multiplied by what fraction? (Type a fraction like 2/5.)", answer: 0.25, tol: 1e-9, shown: "1/4", skill: "Changing dimensions",
        near: [{ v: 0.5, tol: 1e-9, fb: "That is what happens to the perimeter. The area is multiplied by $k^2$." }],
        hints: ["$k = \\frac{1}{2}$, so $k^2 = \\frac{1}{4}$."], why: "$\\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "What if only **one** dimension changes? The height of a 4 by 6 rectangle is doubled, and its width stays the same.",
        scene: { type: "walk", how: [["One", "Only one dimension is multiplied by $k$. The figure is no longer similar to the original."], ["Area", "The area is multiplied by $k$, once."], ["Perimeter", "The perimeter has to be worked out again."]], rows: [
          { step: 1, m: "4 \\times 6 \\to 4 \\times 12", say: "Only the height is doubled." },
          { step: 2, m: "A\\text{: } 24 \\to 48", say: "$4 \\cdot 12 = 48$. The area doubled, once." },
          { step: 3, m: "P\\text{: } 20 \\to 32", say: "$2(4 + 12) = 32$.",
            ask: { prompt: "Did the perimeter double?", answer: 0,
                   options: [{ t: "No: double 20 is 40" }, { t: "Yes", fb: "Double 20 is 40, and the new perimeter is 32." }] } },
          { step: 3, m: "32 \\ne 2 \\cdot 20", say: "With one dimension changed, the $k$ and $k^2$ rule does not apply." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A square has an area of 16. Its sides are changed so that the area becomes 144. The sides were multiplied by what number?", answer: 3, skill: "Changing dimensions",
        near: [{ v: 9, fb: "That is what the area was multiplied by: $k^2 = 9$. Take the square root." }], hints: ["$144 \\div 16 = 9 = k^2$."], why: "$k^2 = 9$, so $k = 3$. The side goes from 4 to 12." },
      { type: "choice", kicker: "Find the error",
        prompt: "The radius of a circle is doubled. Ana says its area doubles. What is wrong?",
        options: [{ t: "The area is multiplied by $2^2 = 4$. It is the circumference that doubles." },
                  { t: "The area is multiplied by 8.", fb: "$k^2 = 2^2 = 4$." },
                  { t: "Nothing. Twice the radius, twice the area.", fb: "$\\pi(2r)^2 = 4\\pi r^2$." }],
        answer: 0, skill: "Changing dimensions", hints: ["Work out $\\pi(2r)^2$."], why: "$\\pi(2r)^2 = 4\\pi r^2$: four times the area." },
      { type: "num", kicker: "Use it", prompt: "A poster is enlarged so that each side is 2.5 times as long. The amount of ink needed depends on its area. How many times as much ink is needed?", answer: 6.25, skill: "Changing dimensions",
        near: [{ v: 2.5, fb: "That is the change in the sides. The area is multiplied by $k^2$." }, { v: 5, fb: "Square the factor: $2.5 \\cdot 2.5$. Do not double it." }],
        hints: ["$2.5^2$."], why: "$2.5^2 = 6.25$." }
    ]
  });

  /* ========================================================== 9-6 · Geometric probability */
  var HOW_9_6 = [["Whole", "Measure the whole region: its length, its angle or its area."],
                 ["Part", "Measure the part that counts as a success."],
                 ["Ratio", "The probability is the part over the whole."]];
  var FIG_SEG = plain([-0.7, 6.7], [-0.9, 0.9], [{ seg: [[0, 0], [6, 0]] }, { seg: [[1.5, 0], [4, 0]], c: "orange" }]
        .concat(lab("3", [0, 0], [1.5, 0], -1), lab("5", [1.5, 0], [4, 0], -1), lab("4", [4, 0], [6, 0], -1), [{ pt: [0, 0], name: "A", at: "n" }, { pt: [1.5, 0], name: "B", at: "n" }, { pt: [4, 0], name: "C", at: "n" }, { pt: [6, 0], name: "D", at: "n" }]),
        { u: 34, alt: "Segment AD with points B and C on it. AB is 3, BC is 5 and CD is 4." }),
      FIG_SPIN = plain([-2.6, 2.6], [-2.6, 2.6], [{ circle: [[0, 0], 2.2], c: "blue" }, { seg: [[0, 0], GT.polar([0, 0], 2.2, 0)] }, { seg: [[0, 0], GT.polar([0, 0], 2.2, 90)] }, { seg: [[0, 0], GT.polar([0, 0], 2.2, 210)] },
        { word: "90°", at: GT.polar([0, 0], 1.2, 45) }, { word: "120°", at: GT.polar([0, 0], 1.2, 150) }, { word: "150°", at: GT.polar([0, 0], 1.2, 285) }, { pt: [0, 0] }],
        { u: 30, alt: "A spinner: a circle cut into three sectors of 90, 120 and 150 degrees." }),
      FIG_RS = shapes([[[[0, 0], [6, 0], [6, 4], [0, 4]], { sides: ["6", "4", null, null] }], [[[1, 1], [3, 1], [3, 3], [1, 3]], { c: "orange", fill: true, sides: [null, "2", "2", null], off: 11 }]],
        { alt: "A rectangle 6 by 4 with a shaded square, 2 by 2, inside it." }),
      FIG_SQC2 = plain([-0.8, 4.8], [-0.8, 4.8], [{ poly: [[0, 0], [4, 0], [4, 4], [0, 4]], c: "blue" }, { circle: [[2, 2], 2], c: "orange" }, { seg: [[2, 2], [4, 2]], c: "orange" }].concat(lab("10", [0, 0], [4, 0], -1), lab("5", [2, 2], [4, 2], 1, 10)),
        { u: 30, alt: "A square with sides of 10. A circle of radius 5 inside it just touches all four sides." }),
      FIG_DART = plain([-2.6, 2.6], [-2.6, 2.6], [{ circle: [[0, 0], 2.25], c: "blue" }, { circle: [[0, 0], 0.75], c: "orange" }, { seg: [[0, 0], [0.75, 0]], c: "orange" }, { seg: [[0, 0], GT.polar([0, 0], 2.25, 135)], c: "blue" }, { word: "2", at: [0.38, -0.3] }, { word: "6", at: [-1.2, 0.72] }, { pt: [0, 0] }],
        { u: 30, alt: "A dartboard: a circle of radius 6 with a smaller circle of radius 2 at its centre." });
  LESSONS.push({
    title: "Geometric probability",
    blurb: "Book 9-6 · A probability found by comparing lengths, angles or areas.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A bag holds 3 red marbles and 5 blue ones. You pick one without looking. What is the probability that it is red?",
        options: [{ t: "$\\frac{3}{8}$" }, { t: "$\\frac{3}{5}$", fb: "Compare red with **all** the marbles: $3 + 5 = 8$." }, { t: "$\\frac{5}{8}$", fb: "That is the probability of blue." }],
        answer: 0, skill: "Probability", hints: ["Favourable outcomes over all outcomes."], why: "3 red out of 8 marbles." },
      { type: "learn", kicker: "The idea",
        prompt: "With marbles you count outcomes. When a point is chosen at random from a segment, a circle or a region, there are too many points to count, so you **measure** instead. That is **geometric probability**: the measure of the part, over the measure of the whole.",
        scene: { type: "method", how: HOW_9_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "A point is chosen at random on $\\overline{AD}$. Watch the probability that it is on $\\overline{BC}$ found.",
        scene: { type: "walk", how: HOW_9_6, rows: [
          { step: 1, m: "AD = 3 + 5 + 4 = 12", say: "The whole segment.", fig: FIG_SEG },
          { step: 2, m: "BC = 5", say: "The part that counts." },
          { step: 3, m: "P = \\frac{BC}{AD}", say: "Part over whole.",
            ask: { prompt: "What is the probability?", answer: 0,
                   options: [{ t: "$\\frac{5}{12}$" }, { t: "$\\frac{5}{7}$", fb: "The whole is all of $\\overline{AD}$: 12, not just the rest." }] } },
          { step: 3, m: "P = \\frac{5}{12}", say: "A little less than one half." }] },
        gate: true, then: "Whole, part, ratio." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. The spinner is spun. Find the probability that it stops in the 120° sector.", art: FIG_SPIN,
        how: HOW_9_6, skill: "Geometric probability",
        steps: [
          { step: 1, ask: "How many degrees is the whole circle?", type: "num", answer: 360, hint: "A full turn.",
            m: "360°", say: "The whole." },
          { step: 2, ask: "How many degrees is the part that counts?", type: "num", answer: 120, hint: "The sector named in the question.",
            m: "120°", say: "The part." },
          { step: 3, ask: "What is $\\frac{120}{360}$ in simplest form?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{1}{3}$" }, { t: "$\\frac{1}{4}$", fb: "That is $\\frac{90}{360}$." }, { t: "$\\frac{2}{3}$", fb: "That is the probability of **not** stopping there." }],
            m: "P = \\frac{120}{360} = \\frac{1}{3}", say: "One third of the circle." }],
        why: "Whole, part, ratio. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A bus stops at a station every 20 minutes and waits there for 4 minutes. You arrive at a random time. What is the probability that a bus is waiting? (Type a fraction like 2/5.)", answer: 0.2, tol: 1e-9, shown: "1/5", skill: "Geometric probability",
        near: [{ v: 0.25, tol: 1e-9, fb: "The whole cycle is 20 minutes, and 4 of them have a bus: $\\frac{4}{20}$." }], hints: ["Part over whole: $\\frac{4}{20}$."], why: "$\\frac{4}{20} = \\frac{1}{5}$." },
      { type: "num", prompt: "A point is chosen at random in the rectangle. What is the probability that it is in the shaded square? (Type a fraction like 2/5.)", art: FIG_RS, answer: 1 / 6, tol: 1e-6, shown: "1/6", skill: "Geometric probability",
        near: [{ v: 0.2, tol: 1e-6, fb: "The whole is the entire rectangle, 24, not what is left over." }, { v: 1 / 3, tol: 1e-6, fb: "Compare areas, not side lengths: $\\frac{4}{24}$." }],
        hints: ["The square's area is 4. The rectangle's is 24."], why: "$\\frac{4}{24} = \\frac{1}{6}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A point is chosen at random in the square. Find the probability that it is inside the circle. Use $\\pi \\approx 3.14$.",
        scene: { type: "walk", how: HOW_9_6, rows: [
          { step: 1, m: "10^2 = 100", say: "The area of the whole square.", fig: FIG_SQC2 },
          { step: 2, m: "\\pi(5)^2 = 25\\pi", say: "The area of the circle." },
          { step: 3, m: "P = \\frac{25\\pi}{100} = \\frac{\\pi}{4}", say: "Part over whole.",
            ask: { prompt: "What is $3.14 \\div 4$, to two decimal places?", answer: 0,
                   options: [{ t: "0.79" }, { t: "1.27", fb: "That is $4 \\div 3.14$. A probability is never more than 1." }] } },
          { step: 3, m: "P \\approx 0.79", say: "About 79% of the square is inside the circle." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A dart lands at a random point on this board. What is the probability that it lands in the small circle? (Type a fraction like 2/5.)", art: FIG_DART, answer: 1 / 9, tol: 1e-6, shown: "1/9", skill: "Geometric probability",
        near: [{ v: 1 / 3, tol: 1e-6, fb: "Compare areas, not radii: $\\frac{\\pi(2)^2}{\\pi(6)^2}$." }], hints: ["$\\frac{4\\pi}{36\\pi}$."], why: "$\\frac{4\\pi}{36\\pi} = \\frac{1}{9}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A spinner has two sectors, of 60° and 300°. Ben says the probability of the 60° sector is $\\frac{60}{300}$. What is wrong?",
        options: [{ t: "The whole is 360°, so the probability is $\\frac{60}{360} = \\frac{1}{6}$." },
                  { t: "It should be $\\frac{300}{60}$.", fb: "A probability cannot be more than 1." },
                  { t: "Nothing. Part over the other part.", fb: "A probability compares the part with the **whole**." }],
        answer: 0, skill: "Geometric probability", hints: ["What is the whole?"], why: "Part over whole: $\\frac{60}{360}$." },
      { type: "num", kicker: "Use it", prompt: "A traffic light is red for 40 seconds, green for 25 seconds and yellow for 5 seconds, over and over. You arrive at a random time. What is the probability that it is green? (Type a fraction like 2/5.)", answer: 25 / 70, tol: 1e-6, shown: "5/14", skill: "Geometric probability",
        near: [{ v: 25 / 45, tol: 1e-6, fb: "The whole cycle is $40 + 25 + 5 = 70$ seconds." }], hints: ["The whole cycle is 70 seconds."], why: "$\\frac{25}{70} = \\frac{5}{14}$." }
    ]
  });
  /* ================================================================ Skills */
  var FRAC_NOTE = " (Type a fraction like 2/5.)";
  function prob(n, d, o) { return Object.assign({ type: "num", answer: n / d, tol: 1e-6, shown: L.fracText(n, d) }, o); }
  var SKILLS = [
    { id: "hg9-area", title: "Areas of triangles and quadrilaterals", lesson: 2,
      gen: function (R) {
        var k = R.int(0, 4), b = R.int(4, 14), h = R.int(3, 10);
        if (k === 0) { var s = h + R.int(1, 3);
          return { type: "num", prompt: "Find the area of this parallelogram.", art: parFig({ b: String(b), h: String(h), s: String(s), alt: "A parallelogram with a base of " + b + ", a height of " + h + " and a slanted side of " + s + "." }), answer: b * h,
            near: near(b * h, [{ v: b * s, fb: s + " is the slanted side. Use the perpendicular height, " + h + "." }, { v: b * h / 2, fb: "A parallelogram's area is $bh$, with no half." }]), hints: ["$A = bh$."], why: "$" + b + " \\cdot " + h + " = " + b * h + "$." }; }
        if (k === 1) { var bb = 2 * R.int(2, 8);
          return { type: "num", prompt: "Find the area of this triangle.", art: triH({ b: String(bb), h: String(h), alt: "A triangle with a base of " + bb + " and a height of " + h + "." }), answer: bb * h / 2,
            near: near(bb * h / 2, [{ v: bb * h, fb: "That is $bh$. A triangle is half of that." }]), hints: ["$A = \\frac{1}{2}bh$."], why: "$\\frac{1}{2}(" + bb + ")(" + h + ") = " + bb * h / 2 + "$." }; }
        if (k === 2) { var b2 = R.int(3, 8), b1 = b2 + 2 * R.int(1, 4);
          return { type: "num", prompt: "Find the area of this trapezoid.", art: trapH({ b1: String(b1), b2: String(b2), h: String(h), alt: "A trapezoid with bases of " + b1 + " and " + b2 + " and a height of " + h + "." }), answer: (b1 + b2) * h / 2,
            near: near((b1 + b2) * h / 2, [{ v: (b1 + b2) * h, fb: "That is $(b_1 + b_2)h$. Take half." }, { v: b1 * h, fb: "Use both bases: add them first." }]), hints: ["$A = \\frac{1}{2}(b_1 + b_2)h$."], why: "$\\frac{1}{2}(" + (b1 + b2) + ")(" + h + ") = " + (b1 + b2) * h / 2 + "$." }; }
        if (k === 3) { var d1 = 2 * R.int(2, 8), d2 = R.int(3, 12), kite = R.chance(0.5);
          return { type: "num", prompt: "The diagonals of a " + (kite ? "kite" : "rhombus") + " measure " + d1 + " and " + d2 + ". Find its area.", answer: d1 * d2 / 2,
            near: near(d1 * d2 / 2, [{ v: d1 * d2, fb: "That is $d_1 d_2$. Take half." }]), hints: ["$A = \\frac{1}{2}d_1 d_2$."], why: "$\\frac{1}{2}(" + d1 + ")(" + d2 + ") = " + d1 * d2 / 2 + "$." }; }
        return { type: "num", prompt: "A parallelogram has an area of " + b * h + " and a base of " + b + ". Find its height.", answer: h,
          near: near(h, [{ v: b * h - b, fb: "Divide the area by the base. Do not subtract." }]), hints: ["$" + b * h + " = " + b + "h$."], why: "$" + b * h + " \\div " + b + " = " + h + "$." };
      } },
    { id: "hg9-circle", title: "Circles and regular polygons", lesson: 3,
      gen: function (R) {
        var k = R.int(0, 4), r = R.int(2, 12);
        if (k === 0) { var dia = R.chance(0.5);
          return { type: "num", prompt: "A circle has a " + (dia ? "diameter of " + 2 * r : "radius of " + r) + ". Find its circumference. Type the number in front of $\\pi$.", post: PI_POST, answer: 2 * r,
            near: near(2 * r, [{ v: r * r, fb: "That is the area, $\\pi r^2$. The circumference is $2\\pi r$." }]), hints: ["$C = 2\\pi r = \\pi d$."], why: "$C = " + 2 * r + "\\pi$." }; }
        if (k === 1) { var dia2 = R.chance(0.5);
          return { type: "num", prompt: "A circle has a " + (dia2 ? "diameter of " + 2 * r : "radius of " + r) + ". Find its area. Type the number in front of $\\pi$.", post: PI_POST, answer: r * r,
            near: near(r * r, [{ v: 2 * r, fb: "That is the circumference. The area is $\\pi r^2$." }, { v: 4 * r * r, fb: "Use the radius, " + r + ", not the diameter." }]), hints: ["$A = \\pi r^2$, with $r = " + r + "$."], why: "$\\pi(" + r + ")^2 = " + r * r + "\\pi$." }; }
        if (k === 2) return { type: "num", prompt: "A circle has an area of $" + r * r + "\\pi$. Find its radius.", answer: r,
          near: near(r, [{ v: r * r / 2, fb: "$r^2 = " + r * r + "$: take the square root, do not halve." }]), hints: ["$r^2 = " + r * r + "$."], why: "$\\sqrt{" + r * r + "} = " + r + "$." };
        if (k === 3) return { type: "num", prompt: "A circle has a radius of " + r + ". Find its area to the nearest whole number. Use $\\pi \\approx 3.14$.", answer: Math.round(3.14 * r * r), tol: 1,
          near: [{ v: Math.round(6.28 * r), tol: 1, fb: "That is the circumference. The area is $\\pi r^2$." }], hints: ["$3.14 \\cdot " + r * r + "$."], why: "$3.14(" + r * r + ") \\approx " + Math.round(3.14 * r * r) + "$." };
        var n = R.pick([5, 6, 8]), s = 2 * R.int(2, 6), a = R.pick([3, 4, 5, 6, 7]);
        return { type: "num", prompt: "A regular " + NGON[n] + " has sides of " + s + " and an apothem of " + a + ". Find its area.", answer: a * n * s / 2,
          near: near(a * n * s / 2, [{ v: a * n * s, fb: "That is $aP$. Take half." }, { v: a * s / 2, fb: "Use the whole perimeter: $" + n + " \\cdot " + s + "$." }]), hints: ["$P = " + n + " \\cdot " + s + " = " + n * s + "$.", "$A = \\frac{1}{2}aP$."], why: "$\\frac{1}{2}(" + a + ")(" + n * s + ") = " + a * n * s / 2 + "$." };
      } },
    { id: "hg9-composite", title: "Composite figures", lesson: 4,
      gen: function (R) {
        var k = R.int(0, 3), w = 2 * R.int(2, 6), h = R.int(3, 8);
        if (k === 0) { var t = R.int(2, 6);
          return { type: "num", prompt: "A figure is a rectangle " + w + " wide and " + h + " high, with a triangle on top. The triangle's base is the rectangle's top side, and its height is " + t + ". Find the area of the figure.", answer: w * h + w * t / 2,
            near: near(w * h + w * t / 2, [{ v: w * h + w * t, fb: "The triangle is $\\frac{1}{2}(" + w + ")(" + t + ")$: take half." }]), hints: ["Rectangle: $" + w + " \\cdot " + h + "$. Triangle: $\\frac{1}{2}(" + w + ")(" + t + ")$."], why: "$" + w * h + " + " + w * t / 2 + " = " + (w * h + w * t / 2) + "$." }; }
        if (k === 1) { var W = w + R.int(4, 8), H = h + R.int(3, 6), a = R.int(2, 4), b = R.int(2, 3);
          return { type: "num", prompt: "A rectangle " + W + " by " + H + " has a rectangular hole, " + a + " by " + b + ", cut out of it. Find the area that is left.", answer: W * H - a * b,
            near: near(W * H - a * b, [{ v: W * H + a * b, fb: "The hole is missing: subtract it." }]), hints: ["$" + W + " \\cdot " + H + " - " + a + " \\cdot " + b + "$."], why: "$" + W * H + " - " + a * b + " = " + (W * H - a * b) + "$." }; }
        if (k === 2) { var r = R.int(2, 6), hh = R.int(3, 9);
          return { type: "num", prompt: "A figure is a rectangle " + 2 * r + " wide and " + hh + " high, with a semicircle on top whose diameter is the rectangle's top side. Its area is $" + 2 * r * hh + " + k\\pi$. Find $k$." + (r % 2 ? " (It may be a decimal.)" : ""), pre: "$k =$", answer: r * r / 2,
            near: near(r * r / 2, [{ v: r * r, fb: "That is a whole circle. A semicircle is half." }, { v: 2 * r * r, fb: "The radius is half of " + 2 * r + ": use $r = " + r + "$." }]), hints: ["The radius is " + r + ".", "Half of $\\pi(" + r + ")^2$."], why: "$\\frac{1}{2}\\pi(" + r * r + ") = " + num(r * r / 2) + "\\pi$." }; }
        var A = R.int(6, 12), B = R.int(3, 5), C = R.int(2, 4), D = R.int(3, 6);
        return { type: "num", prompt: "An L shape is made of two rectangles that do not overlap: one is " + A + " by " + B + ", and the other is " + C + " by " + D + ". Find its area.", answer: A * B + C * D,
          near: near(A * B + C * D, [{ v: A * B, fb: "Add the second rectangle too." }]), hints: ["Add the two areas."], why: "$" + A * B + " + " + C * D + " = " + (A * B + C * D) + "$." };
      } },
    { id: "hg9-coordinate", title: "Perimeter and area on the coordinate plane", lesson: 5,
      gen: function (R) {
        var k = R.int(0, 3), x = R.int(-4, 1), y = R.int(-4, 1), w = R.int(2, 7), h = R.int(2, 6);
        if (k < 2) { var P = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], per = k === 1;
          return { type: "num", prompt: "A rectangle has vertices $" + P.map(pt).join("$, $") + "$. Find its " + (per ? "perimeter" : "area") + ".", answer: per ? 2 * (w + h) : w * h,
            near: near(per ? 2 * (w + h) : w * h, [{ v: per ? w * h : 2 * (w + h), fb: per ? "That is the area. Add all four sides." : "That is the perimeter. Multiply the length by the width." }]), hints: ["Its sides are " + w + " and " + h + "."], why: per ? "$2(" + w + " + " + h + ") = " + 2 * (w + h) + "$." : "$" + w + " \\cdot " + h + " = " + w * h + "$." }; }
        if (k === 2) { var b = 2 * R.int(1, 4), t = R.int(0, b);
          return { type: "num", prompt: "A triangle has vertices $" + pt([x, y]) + "$, $" + pt([x + b, y]) + "$ and $" + pt([x + t, y + h]) + "$. Find its area.", answer: b * h / 2,
            near: near(b * h / 2, [{ v: b * h, fb: "That is base times height. Take half." }]), hints: ["The base is horizontal: " + b + " long. The height is " + h + "."], why: "$\\frac{1}{2}(" + b + ")(" + h + ") = " + b * h / 2 + "$." }; }
        var T = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5]]);
        return { type: "num", prompt: "A right triangle has vertices $" + pt([x, y]) + "$, $" + pt([x + T[0], y]) + "$ and $" + pt([x, y + T[1]]) + "$. Find its perimeter.", answer: T[0] + T[1] + T[2],
          near: near(T[0] + T[1] + T[2], [{ v: T[0] + T[1], fb: "Add the third side too: the hypotenuse." }, { v: T[0] * T[1] / 2, fb: "That is the area. Add the three sides." }]), hints: ["The legs are " + T[0] + " and " + T[1] + ".", "The hypotenuse is $\\sqrt{" + T[0] + "^2 + " + T[1] + "^2}$."], why: "$" + T[0] + " + " + T[1] + " + " + T[2] + " = " + (T[0] + T[1] + T[2]) + "$." };
      } },
    { id: "hg9-scale", title: "Changing dimensions", lesson: 6,
      gen: function (R) {
        var k = R.int(0, 3), f = R.int(2, 6), shape = R.pick(["rectangle", "triangle", "circle", "square"]), word = shape === "circle" ? "circumference" : "perimeter";
        if (k === 0) return { type: "num", prompt: "Every dimension of a " + shape + " is multiplied by " + f + ". Its area is multiplied by what number?", answer: f * f,
          near: near(f * f, [{ v: f, fb: "That is the change in the " + word + ". The area is multiplied by $k^2$." }, { v: 2 * f, fb: "Square the factor. Do not double it." }]), hints: ["$k^2$."], why: "$" + f + "^2 = " + f * f + "$." };
        if (k === 1) return { type: "num", prompt: "Every dimension of a " + shape + " is multiplied by " + f + ". Its " + word + " is multiplied by what number?", answer: f,
          near: near(f, [{ v: f * f, fb: "That is the change in the area. The " + word + " is multiplied by $k$." }]), hints: ["A length is multiplied by $k$, once."], why: "Every length is " + f + " times as long." };
        if (k === 2) { var A = R.int(3, 12);
          return { type: "num", prompt: "A figure has an area of " + A + ". Every dimension is multiplied by " + f + ". Find the new area.", answer: A * f * f,
            near: near(A * f * f, [{ v: A * f, fb: "The area is multiplied by $k^2 = " + f * f + "$, not by " + f + "." }]), hints: ["$" + A + " \\cdot " + f + "^2$."], why: "$" + A + " \\cdot " + f * f + " = " + A * f * f + "$." }; }
        return { type: "num", prompt: "A figure is enlarged so that its area is multiplied by " + f * f + ". Each of its dimensions was multiplied by what number?", answer: f,
          near: near(f, [{ v: f * f / 2, fb: "Take the square root of " + f * f + ". Do not halve it." }]), hints: ["$k^2 = " + f * f + "$."], why: "$\\sqrt{" + f * f + "} = " + f + "$." };
      } },
    { id: "hg9-probability", title: "Geometric probability", lesson: 7,
      gen: function (R) {
        var k = R.int(0, 3);
        if (k === 0) { var a = R.int(2, 6), b = R.int(2, 7), c = R.int(2, 6);
          return prob(b, a + b + c, { prompt: "Points $B$ and $C$ are on $\\overline{AD}$, with $AB = " + a + "$, $BC = " + b + "$ and $CD = " + c + "$. A point is chosen at random on $\\overline{AD}$. What is the probability that it is on $\\overline{BC}$?" + FRAC_NOTE,
            near: [{ v: b / (a + c), tol: 1e-6, fb: "The whole is all of $\\overline{AD}$: " + (a + b + c) + "." }], hints: ["$AD = " + (a + b + c) + "$.", "Part over whole."], why: "$" + frac(b, a + b + c) + "$." }); }
        if (k === 1) { var deg = R.pick([30, 40, 45, 60, 72, 90, 120, 135, 150]);
          return prob(deg, 360, { prompt: "A spinner has a sector of " + deg + "°. What is the probability that it stops in that sector?" + FRAC_NOTE,
            near: [{ v: deg / (360 - deg), tol: 1e-6, fb: "The whole is the full circle: 360°." }], hints: ["$\\frac{" + deg + "}{360}$, simplified."], why: "$\\frac{" + deg + "}{360} = " + frac(deg, 360) + "$." }); }
        if (k === 2) { var s = R.int(1, 3), W = R.int(4, 8), H = R.int(4, 6);
          return prob(s * s, W * H, { prompt: "A square with sides of " + s + " lies inside a rectangle " + W + " by " + H + ". A point is chosen at random in the rectangle. What is the probability that it is in the square?" + FRAC_NOTE,
            near: [{ v: s / W, tol: 1e-6, fb: "Compare areas, not side lengths." }], hints: ["The square's area is " + s * s + ". The rectangle's is " + W * H + "."], why: "$\\frac{" + s * s + "}{" + W * H + "} = " + frac(s * s, W * H) + "$." }); }
        var r = R.int(1, 3), Rr = r * R.int(2, 4);
        return prob(r * r, Rr * Rr, { prompt: "A dartboard is a circle of radius " + Rr + ". Its bullseye is a circle of radius " + r + " at the centre. A dart lands at a random point on the board. What is the probability that it hits the bullseye?" + FRAC_NOTE,
          near: [{ v: r / Rr, tol: 1e-6, fb: "Compare areas, not radii: square each radius." }], hints: ["$\\frac{\\pi(" + r + ")^2}{\\pi(" + Rr + ")^2}$."], why: "$\\frac{" + r * r + "\\pi}{" + Rr * Rr + "\\pi} = " + frac(r * r, Rr * Rr) + "$." });
      } }
  ];
  L.unit("geo", 9, {
    title: "Extending Perimeter, Circumference, and Area",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Areas of triangles and quadrilaterals, circles, and regular polygons.",
        skills: ["hg9-area", "hg9-circle"], per: 3 },
      { title: "Quiz 2", after: 5, blurb: "Composite figures, and perimeter and area on the coordinate plane.",
        skills: ["hg9-composite", "hg9-coordinate"], per: 3 },
      { title: "Quiz 3", after: 7, blurb: "Changing dimensions, and geometric probability.",
        skills: ["hg9-scale", "hg9-probability"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:9", {
    2: { name: "Area formulas", frame: "A parallelogram's area is [[bh]]. A triangle's is [[½bh]]. A trapezoid's is ½(b₁ + b₂)h. A rhombus's or a kite's is half the product of its [[diagonals]]. The height is always [[perpendicular]] to the base.",
         chips: ["2bh", "parallel"] },
    3: { name: "Circles and regular polygons", frame: "A circle's circumference is [[2πr]] and its area is [[πr²]]. A regular polygon's area is half its [[apothem]] times its [[perimeter]].",
         chips: ["πd²", "diagonal"] },
    4: { name: "Composite figures", frame: "Split a composite figure into [[simple]] shapes. [[Add]] the areas of its parts, and [[subtract]] the area of any piece that is cut out.",
         chips: ["Multiply", "similar"] },
    5: { name: "Coordinate plane", frame: "Sides along grid lines can be [[counted]]. Slanted sides need the [[Distance]] Formula. A figure with no side on a grid line can be [[boxed]] in a rectangle.",
         chips: ["Midpoint", "guessed"] },
    6: { name: "Changing dimensions", frame: "When every dimension is multiplied by $k$, the perimeter is multiplied by [[k]] and the area by [[k²]]. If only one dimension changes, the figures are not [[similar]].",
         chips: ["2k", "congruent"] },
    7: { name: "Geometric probability", frame: "Geometric probability compares [[measures]]: lengths, angles or areas. It is the measure of the [[part]] over the measure of the [[whole]].",
         chips: ["counts", "rest"] }
  });
})();
