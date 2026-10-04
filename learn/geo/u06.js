/* ==========================================================================
   Geometry — Unit 6: Polygons and Quadrilaterals. See lab/core.js for the
   format and lab/geotools.js for the drawing kit.

   Follows Holt Geometry, Chapter 6, section for section (6-1 to 6-6), after
   a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   Polygons and their angle sums (6-1), properties of parallelograms (6-2),
   conditions for parallelograms (6-3), rectangles, rhombuses and squares
   (6-4), conditions for those (6-5), and kites and trapezoids (6-6).

   Lessons carry v: 4 (see Unit 1). Skills are hg6-….

   Seven lessons, seven skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  var PAR = [[0, 0], [4.6, 0], [5.8, 2.6], [1.2, 2.6]], RECT = [[0, 0], [4.8, 0], [4.8, 2.8], [0, 2.8]], RHOM = [[0, 0], [3.2, 0], [5.12, 2.56], [1.92, 2.56]],
      KITE = [[-1.7, 0], [0, -3.65], [1.7, 0], [0, 1.19]], ISOT = [[0, 0], [5, 0], [4.03, 2.4], [0.97, 2.4]], TRAP = [[0, 0], [5.4, 0], [3.6, 2.4], [1.4, 2.4]];
  // Where the diagonals of a quadrilateral cross.
  function meet(P) {
    var a = P[0], b = P[2], c = P[1], d = P[3], den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
    var t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / den;
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  }
  /* A quadrilateral with marks m (names, sides, ticks, arcs, right, angs: see polyItems).
       o.diag    draw the diagonals        o.e      name the point where they cross (o.eat: where its name goes)
       o.halves  labels for the four half-diagonals, from each vertex in turn to the crossing point
       o.dticks  tick marks on those four halves        o.perp   a right-angle mark where they cross */
  function quad(P, m, alt, o) {
    o = o || {};
    var E = meet(P), extra = [];
    if (o.diag) extra.push({ seg: [P[0], P[2]], c: "orange" }, { seg: [P[1], P[3]], c: "green" });
    (o.dticks || []).forEach(function (t, i) { if (t) extra.push({ seg: [P[i], E], marks: t, c: i % 2 ? "green" : "orange" }); });
    (o.halves || []).forEach(function (t, i) { if (t != null) extra.push({ len: String(t), seg: [P[i], E], side: 1, off: 11, eq: isMaths(t) }); });
    if (o.perp) extra.push({ angle: [P[2], E, P[1]], right: true, c: "orange" });
    if (o.e) extra.push({ pt: E, name: o.e, at: o.eat || "n" });
    return shapes([[P, m]], { alt: alt, extra: extra.concat(o.extra || []), u: o.u });
  }
  // A trapezoid ABCD (AB and DC the bases) with its midsegment. b1, b2, mid: labels for AB, DC and the midsegment.
  function trapMid(b1, b2, mid, alt) {
    var P = TRAP, M = GT.mid(P[0], P[3]), N = GT.mid(P[1], P[2]);
    return shapes([[P, { names: "ABCD", sides: [b1, null, b2, null] }]], { alt: alt, extra: [{ seg: [P[0], M], marks: 1 }, { seg: [M, P[3]], marks: 1 }, { seg: [P[1], N], marks: 2 }, { seg: [N, P[2]], marks: 2 },
      { seg: [M, N], c: "orange" }, { len: String(mid), seg: [M, N], side: 1, off: 12, eq: isMaths(mid) }] });
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
    blurb: "Before Chapter 6 · Angles on parallel lines, the angles of a triangle, and slope and distance.",
    mins: 6, v: 4,
    steps: [
      { type: "num", kicker: "Check 1 · Parallel lines", prompt: "Two parallel lines are cut by a transversal. One of a pair of same-side interior angles measures 70°. Find the other.", post: "°", answer: 110, skill: "Angles on parallel lines",
        near: [{ v: 70, fb: "Same-side interior angles are supplementary, not congruent." }], hints: ["They add to 180°."], why: "$180 - 70 = 110$." },
      { type: "choice", prompt: "Two parallel lines are cut by a transversal. What is true of a pair of alternate interior angles?",
        options: [{ t: "They are congruent" }, { t: "They are supplementary", fb: "That is true of same-side interior angles." }, { t: "They are complementary", fb: "Complementary angles add to 90°." }],
        answer: 0, skill: "Angles on parallel lines", hints: ["Alternate Interior Angles Theorem."], why: "Alternate interior angles on parallel lines are congruent." },
      { type: "num", kicker: "Check 2 · Triangles", prompt: "Two angles of a triangle measure 55° and 65°. Find the third angle.", post: "°", answer: 60, skill: "Triangle Sum Theorem",
        near: [{ v: 120, fb: "That is the sum of the two. Subtract it from 180." }], hints: ["The three angles add to 180°."], why: "$180 - 55 - 65 = 60$." },
      { type: "num", prompt: "A right triangle has legs of 6 and 8. Find the hypotenuse.", answer: 10, skill: "Pythagorean Theorem",
        near: [{ v: 14, fb: "Square each leg, add, then take the root." }], hints: ["$6^2 + 8^2 = c^2$."], why: "$36 + 64 = 100$, and $\\sqrt{100} = 10$." },
      { type: "num", kicker: "Check 3 · Slope and distance", prompt: "Find the slope of the line through $(1, 1)$ and $(5, 3)$. (Type a fraction like 2/3.)", answer: 0.5, tol: 1e-9, shown: "1/2", skill: "Slope",
        near: [{ v: 2, tol: 1e-9, fb: "Rise over run: the change in $y$ goes on top." }], hints: ["$\\frac{3 - 1}{5 - 1}$."], why: "$\\frac{2}{4} = \\frac{1}{2}$." },
      { type: "num", prompt: "Find the distance between $(1, 2)$ and $(4, 6)$.", answer: 5, skill: "Distance Formula",
        near: [{ v: 7, fb: "Square each difference, add, then take the root." }], hints: ["$\\sqrt{3^2 + 4^2}$."], why: "$\\sqrt{9 + 16} = 5$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 6-1**. If **check 1** slipped, see lesson 3-2. If **check 3** slipped, see lessons 1-6 and 3-5.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ====================================== 6-1 · Properties and attributes of polygons */
  var HOW_6_1 = [["Count", "Count the sides: that is $n$."],
                 ["Interior", "The interior angles add to $(n - 2)180°$. In a regular polygon, divide by $n$ to get each angle."],
                 ["Exterior", "The exterior angles, one at each vertex, add to 360°. In a regular polygon each is $\\frac{360°}{n}$."]];
  var PENT = reg(5, 2.2), HEX = reg(6, 2.2, [0, 0], 0), P5 = [[0, 0], [2.4, 0], [2.82, 2.36], [0.74, 3.56], [-0.7, 1.51]];
  var FIG_PENT = polyFig(PENT, { extra: [{ seg: [PENT[0], PENT[2]], c: "orange", dash: true }, { seg: [PENT[0], PENT[3]], c: "orange", dash: true }], alt: "A regular pentagon. Two dashed diagonals from its top vertex cut it into triangles." }),
      FIG_HEX = plain([-2.9, 3.9], [-2.7, 2.7], [{ poly: HEX, c: "blue" }, { seg: [HEX[5], [3.3, HEX[5][1]]] }, { angle: [HEX[0], HEX[5], HEX[4]], say: "?", c: "orange" }, { angle: [[3.3, HEX[5][1]], HEX[5], HEX[0]], say: "?", c: "green" }],
        { u: 30, alt: "A regular hexagon. One interior angle is marked. The side beside it is extended, and the exterior angle there is marked too." }),
      FIG_P5 = tri(P5, { names: "ABCDE", angs: ["x°", "100°", "110°", "95°", "120°"] }, "Pentagon ABCDE. The angle at A is x degrees, B is 100 degrees, C is 110 degrees, D is 95 degrees and E is 120 degrees.", { u: 40 }),
      FIG_CONC = polyFig([[0, 0], [4, 0], [4, 3], [2, 1.4], [0, 3]], { alt: "A five-sided figure shaped like the letter M: the middle of its top side is pushed down into the figure." });
  LESSONS.push({
    title: "Properties and attributes of polygons",
    blurb: "Book 6-1 · Name polygons, and find their interior and exterior angles.",
    mins: 13, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "How many sides does a hexagon have?", answer: 6, skill: "Name polygons",
        near: [{ v: 5, fb: "Five sides is a pentagon." }, { v: 8, fb: "Eight sides is an octagon." }], hints: ["Hex- means six."], why: "A hexagon has 6 sides." },
      { type: "num", kicker: "Explore", prompt: "The diagonals from one vertex cut this pentagon into triangles. How many triangles?", art: FIG_PENT, answer: 3, skill: "Polygon Angle Sum",
        near: [{ v: 2, fb: "Two diagonals make three pieces." }, { v: 5, fb: "Count the triangles, not the sides." }], hints: ["Count the pieces."],
        why: "3 triangles, so the angles add to $3 \\cdot 180° = 540°$. A polygon with $n$ sides always gives $n - 2$ triangles." },
      { type: "learn", kicker: "The idea",
        prompt: "A polygon is named by its number of sides. It is **regular** if all sides and angles are congruent, and **concave** if part of a diagonal lies outside it. **Polygon Angle Sum Theorem:** the interior angles of a convex $n$-gon add to $(n - 2)180°$.",
        scene: { type: "method", how: HOW_6_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the angles of a regular hexagon found.",
        scene: { type: "walk", how: HOW_6_1, rows: [
          { step: 1, m: "n = 6", say: "A hexagon has six sides.", fig: FIG_HEX },
          { step: 2, m: "(6 - 2)180° = 720°", say: "The sum of the six interior angles.",
            ask: { prompt: "What is $4 \\cdot 180$?", answer: 0,
                   options: [{ t: "720" }, { t: "1080", fb: "That is $6 \\cdot 180$. Use $n - 2 = 4$." }] } },
          { step: 2, m: "720° \\div 6 = 120°", say: "Regular, so all six are equal. Each interior angle is 120°." },
          { step: 3, m: "360° \\div 6 = 60°", say: "Each exterior angle." },
          { step: 3, m: "120° + 60° = 180°", say: "An interior angle and its exterior angle are a linear pair." }] },
        gate: true, then: "The exterior angles of any convex polygon add to 360°." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find $x$, and then the exterior angle at $A$.", art: FIG_P5,
        how: HOW_6_1, skill: "Polygon Angle Sum",
        steps: [
          { step: 1, ask: "How many sides does $ABCDE$ have?", type: "num", answer: 5, hint: "Count the vertices.",
            m: "n = 5", say: "A pentagon." },
          { step: 2, ask: "What do its interior angles add to, in degrees?", type: "num", answer: 540, near: [{ v: 900, fb: "Use $n - 2$: $(5 - 2)180$." }], hint: "$(5 - 2)180$.",
            m: "(5 - 2)180° = 540°", say: "Three triangles' worth." },
          { step: 2, ask: "The four known angles add to 425°. What is $x$?", type: "num", answer: 115, hint: "$540 - 425$.",
            m: "x = 540 - 425 = 115", say: "$100 + 110 + 95 + 120 = 425$." },
          { step: 3, ask: "What is the exterior angle at $A$, in degrees?", type: "num", answer: 65, near: [{ v: 245, fb: "An exterior angle and its interior angle add to 180°, not 360°." }], hint: "$180 - 115$.",
            m: "180° - 115° = 65°", say: "A linear pair with the interior angle." }],
        why: "Count, interior, exterior. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the sum of the interior angles of a convex decagon (10 sides).", post: "°", answer: 1440, skill: "Polygon Angle Sum",
        near: [{ v: 1800, fb: "Use $n - 2 = 8$, not 10." }], hints: ["$(10 - 2)180$."], why: "$8 \\cdot 180 = 1440$." },
      { type: "num", prompt: "Find the measure of each exterior angle of a regular polygon with 12 sides.", post: "°", answer: 30, skill: "Polygon Exterior Angles",
        near: [{ v: 150, fb: "That is each interior angle. The exterior angles add to 360°." }], hints: ["$360 \\div 12$."], why: "$360 \\div 12 = 30$." },
      { type: "learn", kicker: "A harder case",
        prompt: "It works backwards too. Each interior angle of a regular polygon measures 150°. How many sides does it have?",
        scene: { type: "walk", how: [["Exterior", "Find one exterior angle: 180° minus the interior angle."], ["Divide", "The exterior angles add to 360°, so divide 360° by one of them."], ["Check", "Check with the interior angle sum."]], rows: [
          { step: 1, m: "180° - 150° = 30°", say: "Each exterior angle." },
          { step: 2, m: "n = 360° \\div 30°", say: "The exterior angles are all equal, and add to 360°." },
          { step: 2, m: "n = 12", say: "Twelve sides.",
            ask: { prompt: "What is $360 \\div 30$?", answer: 0,
                   options: [{ t: "12" }, { t: "10", fb: "$30 \\cdot 10 = 300$." }] } },
          { step: 3, m: "\\frac{(12 - 2)180°}{12} = 150°", say: "It checks: 1800° shared among 12 angles." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Is this polygon convex or concave?", art: FIG_CONC,
        options: [{ t: "Concave: a diagonal between its two top corners lies outside it" }, { t: "Convex", fb: "One vertex points inwards. Join the two top corners: that diagonal is outside the figure." }],
        answer: 0, skill: "Convex and concave", hints: ["Does any vertex point into the figure?"], why: "A polygon with a diagonal outside it is concave." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Find the sum of the interior angles of a convex heptagon (7 sides). Tap the line where the work **first** goes wrong.",
        lines: ["n = 7", "(7 - 1)180°", "1080°"], answer: 1, fix: "(7 - 2)180°",
        fb: { 0: GIVEN, 2: LATER }, skill: "Polygon Angle Sum",
        hints: ["How many triangles do the diagonals from one vertex make?"],
        why: "$n - 2$ triangles: $(7 - 2)180° = 900°$." },
      { type: "num", kicker: "Use it", prompt: "A stop sign is a regular octagon. Find the measure of each of its interior angles.", post: "°", answer: 135, skill: "Polygon Angle Sum",
        near: [{ v: 45, fb: "That is each exterior angle. The interior angle is its supplement." }, { v: 1080, fb: "That is the sum. Divide by 8." }],
        hints: ["$(8 - 2)180 = 1080$. Then divide by 8."], why: "$1080 \\div 8 = 135$." }
    ]
  });

  /* ================================================= 6-2 · Properties of parallelograms */
  var HOW_6_2 = [["Sides", "Opposite sides are parallel and congruent."],
                 ["Angles", "Opposite angles are congruent. Consecutive angles are supplementary."],
                 ["Diagonals", "The diagonals bisect each other."]];
  var FIG_PAR1 = quad(PAR, { names: "ABCD", sides: ["12", "7", null, null], angs: ["65°", null, null, null] }, "Parallelogram ABCD. AB is 12, BC is 7 and the angle at A is 65 degrees. The diagonals cross at E, and AE is 5.", { diag: true, e: "E", halves: ["5", null, null, null] }),
      FIG_PAR2 = quad(PAR, { names: "ABCD", sides: ["3x + 2", null, "5x − 8", null], angs: ["(4y)°", "(5y)°", null, null] }, "Parallelogram ABCD. AB is 3x + 2 and CD is 5x − 8. The angle at A is 4y degrees and the angle at B is 5y degrees. The diagonals cross at E, and EC is 9.", { diag: true, e: "E", halves: [null, null, "9", null] }),
      FIG_PARG = grid([-1, 9], [-1, 7], [{ seg: [[1, 1], [5, 2]], c: "blue" }, { seg: [[5, 2], [7, 5]], c: "blue" }, { arrow: [[5, 2], [7, 5]], c: "orange" }, { arrow: [[1, 1], [3, 4]], c: "orange", dash: true },
        { pt: [1, 1], name: "A", at: "sw" }, { pt: [5, 2], name: "B", at: "se" }, { pt: [7, 5], name: "C", at: "ne" }],
        { u: 26, alt: "A coordinate grid with A at (1, 1), B at (5, 2) and C at (7, 5). Segments AB and BC are drawn. An arrow runs from B to C, and a matching dashed arrow starts at A." });
  LESSONS.push({
    title: "Properties of parallelograms",
    blurb: "Book 6-2 · The sides, angles and diagonals of a parallelogram.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Parallel lines are cut by a transversal. Two same-side interior angles measure 70° and $x°$. Find $x$.", pre: "$x =$", answer: 110, skill: "Angles on parallel lines",
        near: [{ v: 70, fb: "Same-side interior angles are supplementary." }], hints: ["They add to 180°."], why: "$180 - 70 = 110$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **parallelogram** is a quadrilateral with both pairs of opposite sides parallel. That one fact gives four more: opposite sides are congruent, opposite angles are congruent, consecutive angles are supplementary, and the diagonals bisect each other.",
        scene: { type: "method", how: HOW_6_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch every other measure of parallelogram $ABCD$ found.",
        scene: { type: "walk", how: HOW_6_2, rows: [
          { step: 1, m: "CD = 12 \\qquad DA = 7", say: "Opposite sides are congruent.", fig: FIG_PAR1 },
          { step: 2, m: "m\\angle C = 65°", say: "Opposite angles are congruent." },
          { step: 2, m: "m\\angle B = 180° - 65° = 115°", say: "Consecutive angles are supplementary. $\\angle D$ is 115° too.",
            ask: { prompt: "$\\angle A$ and $\\angle B$ are consecutive angles. What do they add to?", answer: 0,
                   options: [{ t: "180°" }, { t: "90°", fb: "They are same-side interior angles on parallel lines: supplementary." }] } },
          { step: 3, m: "EC = 5", say: "The diagonals bisect each other, so $AC = 10$." }] },
        gate: true, then: "One side, one angle and half a diagonal gave everything else." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $ABCD$ is a parallelogram. Find $x$, $y$ and $AC$.", art: FIG_PAR2,
        how: HOW_6_2, skill: "Parallelogram properties",
        steps: [
          { step: 1, ask: "Opposite sides are congruent. Which equation follows?", type: "choice", answer: 0,
            options: [{ t: "$3x + 2 = 5x - 8$" }, { t: "$3x + 2 + 5x - 8 = 180$", fb: "Those are lengths, and they are equal." }],
            m: "3x + 2 = 5x - 8", say: "$AB = CD$." },
          { step: 1, ask: "Solve for $x$.", type: "num", answer: 5, near: [{ v: 3, fb: "Add 8 to both sides: $10 = 2x$." }], hint: "$10 = 2x$.",
            m: "x = 5", say: "Each of those sides is 17." },
          { step: 2, ask: "Consecutive angles are supplementary: $4y + 5y = 180$. What is $y$?", type: "num", answer: 20, hint: "$9y = 180$.",
            m: "y = 20", say: "The angles are 80° and 100°." },
          { step: 3, ask: "$EC = 9$. What is $AC$?", type: "num", answer: 18, near: [{ v: 9, fb: "$E$ is the midpoint of $\\overline{AC}$, so $AC$ is twice $EC$." }], hint: "The diagonals bisect each other.",
            m: "AC = 18", say: "$E$ is the midpoint of both diagonals." }],
        why: "Sides, angles, diagonals. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "In parallelogram $PQRS$, $m\\angle P = 72°$. Find $m\\angle Q$.", post: "°", answer: 108, skill: "Parallelogram properties",
        near: [{ v: 72, fb: "$\\angle Q$ is next to $\\angle P$, not opposite it. Consecutive angles are supplementary." }],
        hints: ["$P$ and $Q$ are consecutive vertices."], why: "$180 - 72 = 108$." },
      { type: "num", prompt: "The diagonals of parallelogram $JKLM$ cross at $N$. $JN = 2z + 3$ and $NL = z + 9$. Find $JL$.", answer: 30, skill: "Parallelogram properties",
        near: [{ v: 6, fb: "That is $z$. Find $JN$, then double it." }, { v: 15, fb: "That is $JN$, half of the diagonal." }],
        hints: ["$JN = NL$: $2z + 3 = z + 9$.", "$z = 6$, so $JN = 15$."], why: "$z = 6$, $JN = NL = 15$, and $JL = 30$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Three vertices of parallelogram $ABCD$ are $A(1, 1)$, $B(5, 2)$ and $C(7, 5)$. Find $D$.",
        scene: { type: "walk", how: [["Sides", "$\\overline{AD}$ and $\\overline{BC}$ are opposite sides: parallel and congruent."], ["Move", "Find the move that takes $B$ to $C$."], ["Apply", "Make the same move from $A$."]], rows: [
          { step: 1, m: "\\overline{AD} \\parallel \\overline{BC} \\qquad AD = BC", say: "So the move from $A$ to $D$ matches the move from $B$ to $C$.", fig: FIG_PARG },
          { step: 2, m: "B(5, 2) \\to C(7, 5)", say: "2 right and 3 up." },
          { step: 3, m: "D = (1 + 2, 1 + 3)", say: "The same move, starting at $A(1, 1)$.",
            ask: { prompt: "From $A(1, 1)$, go 2 right and 3 up. Where do you land?", answer: 0,
                   options: [{ t: "$(3, 4)$" }, { t: "$(4, 3)$", fb: "2 right changes $x$. 3 up changes $y$." }] } },
          { step: 3, m: "D(3, 4)", say: "Check: $\\overline{AB}$ and $\\overline{DC}$ both go 4 right and 1 up." }] },
        gate: true },
      { type: "pair", kicker: "Try it", prompt: "Three vertices of parallelogram $WXYZ$ are $W(0, 0)$, $X(4, 1)$ and $Y(6, 4)$. Find $Z$. Type it as $(x, y)$.", answer: [2, 3], skill: "Parallelogram properties",
        near: [{ v: [10, 5], fb: "That adds $X$ and $Y$. Use the move from $X$ to $Y$, starting at $W$." }],
        hints: ["From $X$ to $Y$ is 2 right and 3 up.", "Make the same move from $W$."], why: "$(0 + 2, 0 + 3) = (2, 3)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "In parallelogram $ABCD$, $m\\angle A = 80°$. Lia says $m\\angle B = 80°$ too, because the angles of a parallelogram are congruent. What is wrong?",
        options: [{ t: "Only opposite angles are congruent. $\\angle B$ is consecutive to $\\angle A$: 100°." },
                  { t: "$\\angle B$ must be 90°.", fb: "A parallelogram need not have right angles." },
                  { t: "Nothing. All four angles are 80°.", fb: "Four angles of 80° add to 320°, but a quadrilateral's angles add to 360°." }],
        answer: 0, skill: "Parallelogram properties", hints: ["Is $B$ opposite $A$, or next to it?"], why: "Consecutive angles are supplementary: $180 - 80 = 100$." },
      { type: "num", kicker: "Use it", prompt: "The bars of a folding safety gate make parallelograms. When one angle of a parallelogram is 125°, what is the angle next to it?", post: "°", answer: 55, skill: "Parallelogram properties",
        near: [{ v: 125, fb: "That is the opposite angle. The one next to it is supplementary." }],
        hints: ["Consecutive angles are supplementary."], why: "$180 - 125 = 55$." }
    ]
  });

  /* ================================================= 6-3 · Conditions for parallelograms */
  var HOW_6_3 = [["List", "List what is known about the sides, the angles and the diagonals."],
                 ["Match", "Look for a condition: both pairs of opposite sides parallel, or both congruent; one pair parallel and congruent; both pairs of opposite angles congruent; or diagonals that bisect each other."],
                 ["Conclude", "If a condition is met, the quadrilateral is a parallelogram."]];
  var FIG_Q1 = quad(PAR, { names: "ABCD", sides: ["2x + 3", "4y − 1", "15", "19"] }, "Quadrilateral ABCD. AB is 2x + 3, BC is 4y − 1, CD is 15 and DA is 19."),
      FIG_Q2 = quad(PAR, { names: "ABCD" }, "Quadrilateral ABCD with its diagonals, which cross at E. AE is 7 and EC is 7. BE is 4 and ED is 4.", { diag: true, e: "E", eat: "s", halves: ["7", "4", "7", "4"] }),
      FIG_QG = grid([-1, 7], [-1, 7], [{ poly: [[0, 0], [4, 2], [5, 5], [1, 3]], names: "JKLM" }],
        { u: 28, alt: "A coordinate grid. Quadrilateral JKLM has J at the origin, K at (4, 2), L at (5, 5) and M at (1, 3)." });
  LESSONS.push({
    title: "Conditions for parallelograms",
    blurb: "Book 6-3 · Five ways to prove that a quadrilateral is a parallelogram.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is the converse of “If a quadrilateral is a parallelogram, then its opposite sides are congruent”?",
        options: [{ t: "If the opposite sides of a quadrilateral are congruent, then it is a parallelogram." }, { t: "If a quadrilateral is not a parallelogram, then its opposite sides are not congruent.", fb: "That is the inverse. The converse swaps the two parts." }],
        answer: 0, skill: "Converses", hints: ["Swap the hypothesis and the conclusion."], why: "The converse exchanges “if” and “then”." },
      { type: "learn", kicker: "The idea",
        prompt: "Each parallelogram property works backwards, as a **test**. A quadrilateral is a parallelogram if both pairs of opposite sides are congruent, or both pairs of opposite angles are congruent, or its diagonals bisect each other, or **one** pair of opposite sides is both parallel and congruent.",
        scene: { type: "method", how: HOW_6_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $ABCD$ shown to be a parallelogram when $x = 6$ and $y = 5$.",
        scene: { type: "walk", how: HOW_6_3, rows: [
          { step: 1, m: "AB = 2(6) + 3 = 15", say: "The same as $CD = 15$.", fig: FIG_Q1 },
          { step: 1, m: "BC = 4(5) - 1 = 19", say: "The same as $DA = 19$.",
            ask: { prompt: "What is $4y - 1$ when $y = 5$?", answer: 0,
                   options: [{ t: "19" }, { t: "16", fb: "Multiply first: $20 - 1$." }] } },
          { step: 2, m: "\\overline{AB} \\cong \\overline{CD} \\qquad \\overline{BC} \\cong \\overline{DA}", say: "Both pairs of opposite sides are congruent." },
          { step: 3, m: "ABCD \\text{ is a parallelogram}", say: "That is one of the five conditions." }] },
        gate: true, then: "No need to check that the sides are parallel: the theorem does it." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Is $ABCD$ a parallelogram?", art: FIG_Q2,
        how: HOW_6_3, skill: "Conditions for parallelograms",
        steps: [
          { step: 1, ask: "What do the labels tell you about $E$?", type: "choice", answer: 0,
            options: [{ t: "$E$ is the midpoint of both diagonals" }, { t: "The diagonals are congruent", fb: "$AC = 14$ and $BD = 8$: not congruent." }],
            m: "AE = EC \\qquad BE = ED", say: "7 and 7, 4 and 4." },
          { step: 2, ask: "Which condition does that match?", type: "choice", answer: 0,
            options: [{ t: "The diagonals bisect each other" }, { t: "Both pairs of opposite sides are congruent", fb: "No side lengths are given." }],
            m: "\\text{the diagonals bisect each other}", say: "Each diagonal cuts the other in half." },
          { step: 3, ask: "So is $ABCD$ a parallelogram?", type: "choice", answer: 0,
            options: [{ t: "Yes" }, { t: "There is not enough to tell", fb: "Bisecting diagonals are enough." }],
            m: "ABCD \\text{ is a parallelogram}", say: "By the diagonals condition." }],
        why: "List, match, conclude. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Is each fact enough to be sure the quadrilateral is a parallelogram?",
        bins: ["Enough", "Not enough"],
        cards: [{ t: "Both pairs of opposite sides are congruent", bin: 0, fb: "That is one of the conditions." }, { t: "One pair of opposite sides is parallel", bin: 1, fb: "A trapezoid has that too." },
                { t: "One pair of opposite sides is parallel and congruent", bin: 0, fb: "The same pair, both parallel and congruent: enough." }, { t: "The diagonals bisect each other", bin: 0, fb: "That is one of the conditions." },
                { t: "One pair of sides is parallel, and the other pair is congruent", bin: 1, fb: "An isosceles trapezoid fits that, and it is not a parallelogram." }, { t: "Both pairs of opposite angles are congruent", bin: 0, fb: "That is one of the conditions." }],
        skill: "Conditions for parallelograms", hints: ["Can you draw a quadrilateral that fits the fact and is not a parallelogram?"],
        why: "The parallel pair and the congruent pair must be the same pair." },
      { type: "num", prompt: "One pair of opposite sides of a quadrilateral is parallel. Their lengths are $4x - 5$ and $2x + 9$. For which value of $x$ must the quadrilateral be a parallelogram?", pre: "$x =$", answer: 7, skill: "Conditions for parallelograms",
        near: [{ v: 2, fb: "Add 5 to both sides: $2x = 14$." }], hints: ["The parallel sides must be congruent too: $4x - 5 = 2x + 9$."], why: "$2x = 14$, so $x = 7$. Then both sides are 23." },
      { type: "learn", kicker: "A harder case",
        prompt: "On the coordinate plane, slopes can show that both pairs of opposite sides are parallel. Show that $JKLM$ is a parallelogram.",
        scene: { type: "walk", how: [["Slopes", "Find the slope of each side."], ["Compare", "Compare the slopes of opposite sides."], ["Conclude", "Both pairs parallel: a parallelogram, by definition."]], rows: [
          { step: 1, m: "\\text{slope of } \\overline{JK} = \\frac{2 - 0}{4 - 0} = \\frac{1}{2}", say: "From $(0, 0)$ to $(4, 2)$.", fig: FIG_QG },
          { step: 1, m: "\\text{slope of } \\overline{ML} = \\frac{5 - 3}{5 - 1} = \\frac{1}{2}", say: "From $(1, 3)$ to $(5, 5)$." },
          { step: 1, m: "\\text{slope of } \\overline{KL} = 3 \\qquad \\text{slope of } \\overline{JM} = 3", say: "$\\frac{5 - 2}{5 - 4}$ and $\\frac{3 - 0}{1 - 0}$.",
            ask: { prompt: "What is the slope from $J(0, 0)$ to $M(1, 3)$?", answer: 0,
                   options: [{ t: "3" }, { t: "$\\frac{1}{3}$", fb: "Rise over run: $\\frac{3}{1}$." }] } },
          { step: 2, m: "\\overline{JK} \\parallel \\overline{ML} \\qquad \\overline{KL} \\parallel \\overline{JM}", say: "Equal slopes mean parallel lines." },
          { step: 3, m: "JKLM \\text{ is a parallelogram}", say: "Both pairs of opposite sides are parallel." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Quadrilateral $PQRS$ has $P(0, 0)$, $Q(5, 0)$, $R(7, 3)$ and $S(2, 3)$. $\\overline{PQ}$ and $\\overline{SR}$ are both horizontal, and both 5 long. Is $PQRS$ a parallelogram?",
        options: [{ t: "Yes: one pair of opposite sides is parallel and congruent" }, { t: "No: only one pair of sides was checked", fb: "One pair is enough when it is both parallel and congruent." }],
        answer: 0, skill: "Conditions for parallelograms", hints: ["Which condition needs only one pair of sides?"], why: "$\\overline{PQ} \\parallel \\overline{SR}$ and $PQ = SR$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A quadrilateral has one pair of opposite sides parallel, and the **other** pair congruent. Raj says it must be a parallelogram. What is wrong?",
        options: [{ t: "The same pair must be both parallel and congruent. An isosceles trapezoid fits his description." },
                  { t: "A parallelogram has no parallel sides.", fb: "It has two pairs." },
                  { t: "Nothing. One pair parallel and one pair congruent is a condition.", fb: "Only when it is the same pair." }],
        answer: 0, skill: "Conditions for parallelograms", hints: ["Picture a trapezoid with two equal legs."], why: "An isosceles trapezoid has one parallel pair and one congruent pair, but is not a parallelogram." },
      { type: "choice", kicker: "Use it", prompt: "The two legs of an ironing board are bolted together at the midpoint of each leg. Why does the board always stay parallel to the floor?",
        options: [{ t: "The legs are diagonals that bisect each other, so their four ends make a parallelogram" }, { t: "The legs are perpendicular", fb: "The angle between the legs changes as the board is raised or lowered." }, { t: "The legs are parallel", fb: "The legs cross each other." }],
        answer: 0, skill: "Conditions for parallelograms", hints: ["The legs cross at both their midpoints."], why: "Diagonals that bisect each other make a parallelogram, and its opposite sides are parallel." }
    ]
  });
  /* ======================================= 6-4 · Properties of special parallelograms */
  var HOW_6_4 = [["Which", "Rectangle: four right angles. Rhombus: four congruent sides. Square: both."],
                 ["Property", "Rectangle: the diagonals are congruent. Rhombus: the diagonals are perpendicular, and each one bisects a pair of opposite angles."],
                 ["Find", "Add the parallelogram properties, then find the measure."]];
  var FIG_RECT = quad(RECT, { names: "ABCD", right: [0, 1, 2, 3] }, "Rectangle ABCD with both diagonals, which cross at E.", { diag: true, e: "E" }),
      FIG_RHOM = quad(RHOM, { names: "ABCD", sides: ["4x − 3", "2x + 9", null, null] }, "Rhombus ABCD with both diagonals, which cross at E. AB is 4x − 3 and BC is 2x + 9.", { diag: true, e: "E" }),
      FIG_RH32 = quad(RHOM, { names: "JKLM" }, "Rhombus JKLM with diagonal JL. The angle between side JK and the diagonal is 32 degrees.", { extra: [{ seg: [RHOM[0], RHOM[2]], c: "orange" }, { angle: [RHOM[1], RHOM[0], RHOM[2]], say: "32°", c: "orange", r: 34 }] }),
      FIG_SQG = grid([-1, 6], [-1, 6], [{ poly: [[1, 0], [4, 1], [3, 4], [0, 3]], names: "PQRS" }, { seg: [[1, 0], [3, 4]], c: "orange" }, { seg: [[4, 1], [0, 3]], c: "green" }],
        { u: 30, alt: "A coordinate grid. Square PQRS has P at (1, 0), Q at (4, 1), R at (3, 4) and S at (0, 3). Both diagonals are drawn." });
  LESSONS.push({
    title: "Properties of special parallelograms",
    blurb: "Book 6-4 · What rectangles, rhombuses and squares add to the properties of a parallelogram.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The diagonals of a parallelogram cross at $E$. On diagonal $\\overline{AC}$, $AE = 6$. Find $AC$.", answer: 12, skill: "Parallelogram properties",
        near: [{ v: 6, fb: "$E$ is the midpoint, so $AC$ is twice $AE$." }], hints: ["The diagonals bisect each other."], why: "$2 \\cdot 6 = 12$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **rectangle** has four right angles, a **rhombus** has four congruent sides, and a **square** has both. All three are parallelograms, so they keep every parallelogram property, and each adds more: a rectangle's diagonals are congruent, and a rhombus's diagonals are perpendicular.",
        scene: { type: "method", how: HOW_6_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the diagonals of rectangle $ABCD$ used. $AC = 26$.",
        scene: { type: "walk", how: HOW_6_4, rows: [
          { step: 1, m: "ABCD \\text{ is a rectangle}", say: "Four right angles, so it is a parallelogram as well.", fig: FIG_RECT },
          { step: 2, m: "BD = AC = 26", say: "The diagonals of a rectangle are congruent." },
          { step: 3, m: "BE = \\frac{1}{2}BD", say: "The diagonals of a parallelogram bisect each other.",
            ask: { prompt: "What is half of 26?", answer: 0,
                   options: [{ t: "13" }, { t: "52", fb: "Half, not double." }] } },
          { step: 3, m: "BE = 13", say: "In fact $AE = BE = CE = DE = 13$." }] },
        gate: true, then: "A rectangle's diagonals are congruent, and they bisect each other." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $ABCD$ is a rhombus. Find the angle where its diagonals cross, and the length of a side.", art: FIG_RHOM,
        how: HOW_6_4, skill: "Special parallelograms",
        steps: [
          { step: 1, ask: "What makes a rhombus a rhombus?", type: "choice", answer: 0,
            options: [{ t: "Four congruent sides" }, { t: "Four right angles", fb: "That is a rectangle." }],
            m: "AB = BC = CD = DA", say: "Four congruent sides." },
          { step: 2, ask: "At what angle do its diagonals cross, in degrees?", type: "num", answer: 90, hint: "The diagonals of a rhombus are perpendicular.",
            m: "m\\angle AEB = 90°", say: "The diagonals of a rhombus are perpendicular." },
          { step: 3, ask: "The sides are equal: $4x - 3 = 2x + 9$. What is $x$?", type: "num", answer: 6, near: [{ v: 3, fb: "Add 3 to both sides: $2x = 12$." }], hint: "$2x = 12$.",
            m: "x = 6", say: "$2x = 12$." },
          { step: 3, ask: "So how long is each side?", type: "num", answer: 21, near: [{ v: 6, fb: "That is $x$. Substitute it." }], hint: "$4(6) - 3$.",
            m: "AB = 4(6) - 3 = 21", say: "And $2(6) + 9 = 21$." }],
        why: "Which, property, find. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Which figure must have each property?",
        bins: ["Every rectangle", "Every rhombus", "Every parallelogram"],
        cards: [{ t: "Diagonals are congruent", bin: 0, fb: "That is the rectangle's extra property." }, { t: "Diagonals are perpendicular", bin: 1, fb: "That is the rhombus's extra property." },
                { t: "Opposite sides are congruent", bin: 2, fb: "True of every parallelogram, so of rectangles and rhombuses too." }, { t: "Four right angles", bin: 0, fb: "That is what a rectangle is." },
                { t: "Four congruent sides", bin: 1, fb: "That is what a rhombus is." }, { t: "Diagonals bisect each other", bin: 2, fb: "True of every parallelogram." }],
        skill: "Special parallelograms", hints: ["Put each property with the widest group that always has it."],
        why: "Rectangles and rhombuses inherit every parallelogram property, and add their own." },
      { type: "num", prompt: "The diagonals of a rhombus measure 6 and 8. Find the length of a side.", answer: 5, skill: "Special parallelograms",
        near: [{ v: 10, fb: "Use half of each diagonal: 3 and 4." }, { v: 7, fb: "The half-diagonals are the legs of a right triangle: use the Pythagorean Theorem." }],
        hints: ["The diagonals bisect each other at right angles.", "Legs of 3 and 4."], why: "$\\sqrt{3^2 + 4^2} = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A square is a rectangle and a rhombus at once. Check on the coordinate plane that the diagonals of square $PQRS$ are congruent, perpendicular, and bisect each other.",
        scene: { type: "walk", how: [["Lengths", "Find the length of each diagonal."], ["Slopes", "Find the slope of each diagonal."], ["Midpoints", "Find the midpoint of each diagonal."]], rows: [
          { step: 1, m: "PR = \\sqrt{2^2 + 4^2} = \\sqrt{20}", say: "From $(1, 0)$ to $(3, 4)$.", fig: FIG_SQG },
          { step: 1, m: "QS = \\sqrt{4^2 + 2^2} = \\sqrt{20}", say: "From $(4, 1)$ to $(0, 3)$. Congruent." },
          { step: 2, m: "\\text{slopes: } 2 \\text{ and } -\\frac{1}{2}", say: "$\\frac{4 - 0}{3 - 1}$ and $\\frac{3 - 1}{0 - 4}$.",
            ask: { prompt: "What is $2 \\cdot \\left(-\\frac{1}{2}\\right)$?", answer: 0,
                   options: [{ t: "$-1$" }, { t: "$1$", fb: "A positive times a negative is negative." }] } },
          { step: 2, m: "2 \\cdot \\left(-\\frac{1}{2}\\right) = -1", say: "Perpendicular." },
          { step: 3, m: "(2, 2) \\text{ and } (2, 2)", say: "Both diagonals have the same midpoint, so they bisect each other." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "$JKLM$ is a rhombus. Find $m\\angle KJM$, the whole angle at $J$.", art: FIG_RH32, post: "°", answer: 64, skill: "Special parallelograms",
        near: [{ v: 32, fb: "That is half of it. The diagonal bisects the angle." }, { v: 16, fb: "The diagonal splits the angle into two parts of 32°: double, do not halve." }],
        hints: ["Each diagonal of a rhombus bisects a pair of opposite angles."], why: "$2 \\cdot 32 = 64$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kai says the diagonals of every rectangle are perpendicular. What is wrong?",
        options: [{ t: "A rectangle's diagonals are congruent. They are perpendicular only if it is also a rhombus: a square." },
                  { t: "A rectangle's diagonals do not bisect each other.", fb: "They do: a rectangle is a parallelogram." },
                  { t: "Nothing. All rectangles have perpendicular diagonals.", fb: "Draw a long, thin rectangle: its diagonals cross at a sharp angle." }],
        answer: 0, skill: "Special parallelograms", hints: ["Which figure has perpendicular diagonals?"], why: "Congruent: rectangle. Perpendicular: rhombus. Both: square." },
      { type: "num", kicker: "Use it", prompt: "A carpenter builds a door frame 80 cm wide and 192 cm high. If its corners are right angles, how long is each diagonal?", post: "cm", answer: 208, skill: "Special parallelograms",
        near: [{ v: 272, fb: "The diagonal is a hypotenuse: square, add, then take the root." }],
        hints: ["$80^2 + 192^2 = d^2$.", "$6400 + 36864 = 43264$."], why: "$\\sqrt{43264} = 208$. In a rectangle both diagonals are that length." }
    ]
  });

  /* ======================================= 6-5 · Conditions for special parallelograms */
  var HOW_6_5 = [["First", "Make sure the figure is a parallelogram."],
                 ["Test", "Rectangle: one right angle, or congruent diagonals. Rhombus: two consecutive sides congruent, perpendicular diagonals, or a diagonal that bisects a pair of opposite angles."],
                 ["Name", "A rectangle that is also a rhombus is a square."]];
  var FIG_PAR10 = quad(RECT, { names: "ABCD", ticks: [1, 2, 1, 2] }, "Quadrilateral ABCD with both diagonals. AB and CD each carry one tick mark. BC and DA each carry two.", { diag: true }),
      FIG_RHG = grid([-1, 9], [-1, 6], [{ poly: [[0, 0], [5, 0], [8, 4], [3, 4]], names: "ABCD" }, { seg: [[0, 0], [8, 4]], c: "orange" }, { seg: [[5, 0], [3, 4]], c: "green" }],
        { u: 26, alt: "A coordinate grid. Quadrilateral ABCD has A at the origin, B at (5, 0), C at (8, 4) and D at (3, 4). Both diagonals are drawn." }),
      FIG_ISOD = quad(ISOT, { names: "ABCD" }, "Trapezoid ABCD, with AB parallel to DC and the two slanted sides the same length. Both diagonals are drawn.", { diag: true });
  LESSONS.push({
    title: "Conditions for special parallelograms",
    blurb: "Book 6-5 · How to prove that a parallelogram is a rectangle, a rhombus or a square.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Two segments have slopes of 2 and $-\\frac{1}{2}$. What are they?",
        options: [{ t: "Perpendicular" }, { t: "Parallel", fb: "Parallel segments have equal slopes." }, { t: "Neither", fb: "Multiply the slopes: $2 \\cdot \\left(-\\frac{1}{2}\\right) = -1$." }],
        answer: 0, skill: "Perpendicular slopes", hints: ["Multiply the slopes."], why: "The product of the slopes is $-1$." },
      { type: "learn", kicker: "The idea",
        prompt: "Start with a **parallelogram**. If it has one right angle, or congruent diagonals, it is a rectangle. If it has two consecutive sides congruent, or perpendicular diagonals, or a diagonal that bisects opposite angles, it is a rhombus. If it passes both tests, it is a square.",
        scene: { type: "method", how: HOW_6_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $ABCD$ named. Given: the tick marks, and $AC = BD = 10$.",
        scene: { type: "walk", how: HOW_6_5, rows: [
          { step: 1, m: "\\overline{AB} \\cong \\overline{CD} \\qquad \\overline{BC} \\cong \\overline{DA}", say: "Both pairs of opposite sides are congruent, so $ABCD$ is a parallelogram.", fig: FIG_PAR10 },
          { step: 2, m: "AC = BD", say: "Its diagonals are congruent.",
            ask: { prompt: "A parallelogram with congruent diagonals is a…", answer: 0,
                   options: [{ t: "rectangle" }, { t: "rhombus", fb: "A rhombus needs perpendicular diagonals, or congruent consecutive sides." }] } },
          { step: 2, m: "ABCD \\text{ is a rectangle}", say: "Parallelogram, plus congruent diagonals." },
          { step: 3, m: "\\text{a rectangle, not known to be a square}", say: "Nothing says its consecutive sides are congruent." }] },
        gate: true, then: "Parallelogram first, then the test." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Give $ABCD$ its best name.", art: FIG_RHG,
        how: HOW_6_5, skill: "Conditions for special parallelograms",
        steps: [
          { step: 1, ask: "$\\overline{AB}$ and $\\overline{DC}$ are both horizontal and both 5 long. So $ABCD$ is…", type: "choice", answer: 0,
            options: [{ t: "a parallelogram: one pair of sides is parallel and congruent" }, { t: "not known to be a parallelogram", fb: "One pair of opposite sides both parallel and congruent is enough." }],
            m: "ABCD \\text{ is a parallelogram}", say: "$\\overline{AB} \\parallel \\overline{DC}$ and $AB = DC = 5$." },
          { step: 2, ask: "The diagonals have slopes $\\frac{1}{2}$ and $-2$. What does that show?", type: "choice", answer: 0,
            options: [{ t: "They are perpendicular: it is a rhombus" }, { t: "They are congruent: it is a rectangle", fb: "Slopes tell you about direction, not length." }],
            m: "\\frac{1}{2} \\cdot (-2) = -1", say: "Perpendicular diagonals: a rhombus." },
          { step: 2, ask: "The diagonals measure $\\sqrt{80}$ and $\\sqrt{20}$. Is it a rectangle?", type: "choice", answer: 0,
            options: [{ t: "No: the diagonals are not congruent" }, { t: "Yes", fb: "A rectangle's diagonals are congruent. These are not." }],
            m: "\\sqrt{80} \\ne \\sqrt{20}", say: "Not a rectangle." },
          { step: 3, ask: "What is its best name?", type: "choice", answer: 0,
            options: [{ t: "Rhombus" }, { t: "Square", fb: "A square must be a rectangle too." }, { t: "Rectangle", fb: "Its diagonals are not congruent." }],
            m: "ABCD \\text{ is a rhombus}", say: "A rhombus, but not a square." }],
        why: "First, test, name. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Each card describes a **parallelogram**. What must it be?",
        bins: ["Rectangle", "Rhombus", "Square"],
        cards: [{ t: "It has one right angle", bin: 0, fb: "One right angle in a parallelogram forces the other three." }, { t: "Its diagonals are perpendicular", bin: 1, fb: "Perpendicular diagonals: a rhombus." },
                { t: "Its diagonals are congruent and perpendicular", bin: 2, fb: "Rectangle and rhombus together: a square." }, { t: "Two consecutive sides are congruent", bin: 1, fb: "Then all four sides are congruent." },
                { t: "Its diagonals are congruent", bin: 0, fb: "Congruent diagonals: a rectangle." }],
        skill: "Conditions for special parallelograms", hints: ["Rectangle tests are about right angles and congruent diagonals. Rhombus tests are about equal sides and perpendicular diagonals."],
        why: "Pass a rectangle test and a rhombus test, and it is a square." },
      { type: "choice", prompt: "A parallelogram has congruent diagonals. Must it be a square?",
        options: [{ t: "No. It must be a rectangle, but its sides need not all be congruent." }, { t: "Yes", fb: "A long, thin rectangle has congruent diagonals and is not a square." }],
        answer: 0, skill: "Conditions for special parallelograms", hints: ["Which test has it passed?"], why: "Congruent diagonals prove a rectangle only." },
      { type: "learn", kicker: "A harder case",
        prompt: "The tests work only on parallelograms. The diagonals of quadrilateral $ABCD$ are congruent. Is it a rectangle?",
        scene: { type: "walk", how: [["Check", "Is the figure known to be a parallelogram?"], ["Counter", "If not, look for a counterexample."], ["Decide", "Without the parallelogram, the test proves nothing."]], rows: [
          { step: 1, m: "AC = BD", say: "Given. But nothing says $ABCD$ is a parallelogram.", fig: FIG_ISOD },
          { step: 2, m: "\\text{an isosceles trapezoid}", say: "Its diagonals are congruent, and it is not even a parallelogram.",
            ask: { prompt: "How many pairs of parallel sides does this trapezoid have?", answer: 0,
                   options: [{ t: "One" }, { t: "Two", fb: "Only $\\overline{AB}$ and $\\overline{DC}$ are parallel." }] } },
          { step: 3, m: "\\text{not necessarily a rectangle}", say: "Congruent diagonals are a rectangle test only for parallelograms." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Parallelogram $WXYZ$ has $W(0, 0)$, $X(4, 0)$, $Y(4, 3)$ and $Z(0, 3)$. What is its best name?",
        options: [{ t: "Rectangle" }, { t: "Square", fb: "Its sides are 4 and 3: not all congruent." }, { t: "Rhombus", fb: "Its sides are 4 and 3: not all congruent." }],
        answer: 0, skill: "Conditions for special parallelograms", hints: ["Its sides lie along grid lines, so its angles are right angles."], why: "A parallelogram with a right angle is a rectangle. Sides of 4 and 3 are not congruent." },
      { type: "choice", kicker: "Find the error",
        prompt: "The diagonals of a quadrilateral are perpendicular. Mo says it must be a rhombus. What is wrong?",
        options: [{ t: "It must first be a parallelogram. A kite has perpendicular diagonals too." },
                  { t: "A rhombus does not have perpendicular diagonals.", fb: "It does. But so do some figures that are not rhombuses." },
                  { t: "Nothing. Perpendicular diagonals make a rhombus.", fb: "Only in a parallelogram." }],
        answer: 0, skill: "Conditions for special parallelograms", hints: ["Step 1 of the method."], why: "The rhombus tests start from a parallelogram." },
      { type: "choice", kicker: "Use it", prompt: "A builder makes a frame with opposite sides of equal length, then measures both diagonals and finds them equal. What has she shown?",
        options: [{ t: "The frame is a rectangle, so its corners are right angles" }, { t: "The frame is a rhombus", fb: "A rhombus test would need equal sides or perpendicular diagonals." }, { t: "Nothing: diagonals do not matter", fb: "In a parallelogram, congruent diagonals prove a rectangle." }],
        answer: 0, skill: "Conditions for special parallelograms", hints: ["Opposite sides equal: a parallelogram. Then which test?"], why: "A parallelogram with congruent diagonals is a rectangle." }
    ]
  });

  /* =========================================== 6-6 · Properties of kites and trapezoids */
  var HOW_6_6 = [["Which", "Kite: two pairs of congruent consecutive sides. Trapezoid: exactly one pair of parallel sides, the bases."],
                 ["Property", "Kite: perpendicular diagonals, and one pair of congruent opposite angles. Isosceles trapezoid: congruent base angles and congruent diagonals."],
                 ["Find", "Use the property, with the angle sum of 360°, to find the measure."]];
  var FIG_KITE = quad(KITE, { names: "JMLK", ticks: [2, 2, 1, 1], angs: ["x°", "50°", "x°", "110°"] }, "Kite JKLM. JK and KL each carry one tick mark; JM and LM each carry two. The angle at K is 110 degrees, the angle at M is 50 degrees, and the angles at J and L are each x degrees."),
      FIG_KITED = quad(KITE, { names: "ABCD" }, "Kite ABCD with both diagonals, which cross at right angles at E. AE is 5 and BE is 12.", { diag: true, perp: true, e: "E", eat: "ne", halves: ["5", "12", null, null] }),
      FIG_ISO68 = quad(ISOT, { names: "ABCD", ticks: [0, 1, 0, 1], angs: ["68°", null, null, null] }, "Trapezoid ABCD with AB parallel to DC. BC and DA each carry one tick mark. The angle at A is 68 degrees. Both diagonals are drawn.", { diag: true }),
      FIG_TM1 = trapMid("14", "8", "?", "Trapezoid ABCD with bases AB = 14 and DC = 8. A segment joins the midpoints of the two legs, and is marked with a question mark."),
      FIG_TM2 = trapMid("21", "x", "16", "Trapezoid ABCD with bases AB = 21 and DC = x. The segment joining the midpoints of the two legs is 16."),
      FIG_TM3 = trapMid("x + 6", "x", "12", "Trapezoid ABCD with bases AB = x + 6 and DC = x. The segment joining the midpoints of the two legs is 12.");
  LESSONS.push({
    title: "Properties of kites and trapezoids",
    blurb: "Book 6-6 · Kites, isosceles trapezoids, and the midsegment of a trapezoid.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the average of 8 and 14.", answer: 11, skill: "Averages",
        near: [{ v: 22, fb: "That is the sum. Divide by 2." }], hints: ["Add them, then halve."], why: "$\\frac{8 + 14}{2} = 11$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **kite** has two pairs of congruent consecutive sides. Its diagonals are perpendicular, and one pair of its opposite angles is congruent. A **trapezoid** has exactly one pair of parallel sides, its **bases**. If its **legs** are congruent it is **isosceles**, with congruent base angles and diagonals.",
        scene: { type: "method", how: HOW_6_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the missing angles of kite $JKLM$ found.",
        scene: { type: "walk", how: HOW_6_6, rows: [
          { step: 1, m: "\\overline{JK} \\cong \\overline{KL} \\qquad \\overline{JM} \\cong \\overline{LM}", say: "Two pairs of congruent consecutive sides: a kite.", fig: FIG_KITE },
          { step: 2, m: "\\angle J \\cong \\angle L", say: "The angles between the unequal sides are congruent." },
          { step: 3, m: "x + x + 110 + 50 = 360", say: "The angles of a quadrilateral add to 360°." },
          { step: 3, m: "2x = 200", say: "Subtract 160.",
            ask: { prompt: "What is $360 - 110 - 50$?", answer: 0,
                   options: [{ t: "200" }, { t: "20", fb: "That starts from 180. A quadrilateral's angles add to 360°." }] } },
          { step: 3, m: "x = 100", say: "$m\\angle J = m\\angle L = 100°$." }] },
        gate: true, then: "Only one pair of a kite's opposite angles is congruent." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $\\overline{AB} \\parallel \\overline{DC}$, and $AC = 15$. Find $m\\angle B$, $m\\angle D$ and $BD$.", art: FIG_ISO68,
        how: HOW_6_6, skill: "Kites and trapezoids",
        steps: [
          { step: 1, ask: "One pair of sides is parallel, and the legs are congruent. What is $ABCD$?", type: "choice", answer: 0,
            options: [{ t: "An isosceles trapezoid" }, { t: "A kite", fb: "A kite has no parallel sides." }, { t: "A parallelogram", fb: "Only one pair of sides is parallel." }],
            m: "\\text{isosceles trapezoid}", say: "Bases $\\overline{AB}$ and $\\overline{DC}$, legs $\\overline{BC}$ and $\\overline{DA}$." },
          { step: 2, ask: "What is $m\\angle B$, in degrees?", type: "num", answer: 68, near: [{ v: 112, fb: "$\\angle B$ is on the same base as $\\angle A$: base angles are congruent." }], hint: "Base angles of an isosceles trapezoid are congruent.",
            m: "m\\angle B = 68°", say: "$\\angle A$ and $\\angle B$ are a pair of base angles." },
          { step: 3, ask: "$\\angle A$ and $\\angle D$ are same-side interior angles on parallel lines. What is $m\\angle D$, in degrees?", type: "num", answer: 112, near: [{ v: 68, fb: "Same-side interior angles are supplementary." }], hint: "$180 - 68$.",
            m: "m\\angle D = 180° - 68° = 112°", say: "And $m\\angle C = 112°$ too." },
          { step: 3, ask: "What is $BD$?", type: "num", answer: 15, hint: "The diagonals of an isosceles trapezoid are congruent.",
            m: "BD = AC = 15", say: "The diagonals of an isosceles trapezoid are congruent." }],
        why: "Which, property, find. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$ABCD$ is a kite. Find $AB$.", art: FIG_KITED, answer: 13, skill: "Kites and trapezoids",
        near: [{ v: 17, fb: "The diagonals cross at right angles, so use the Pythagorean Theorem." }],
        hints: ["The diagonals of a kite are perpendicular.", "$\\triangle AEB$ is a right triangle with legs 5 and 12."], why: "$\\sqrt{5^2 + 12^2} = 13$." },
      { type: "num", prompt: "The **midsegment** of a trapezoid joins the midpoints of its legs. It is parallel to the bases, and its length is the average of theirs. Find it.", art: FIG_TM1, answer: 11, skill: "Trapezoid midsegment",
        near: [{ v: 22, fb: "That is the sum of the bases. Halve it." }],
        hints: ["$\\frac{1}{2}(14 + 8)$."], why: "$\\frac{1}{2}(22) = 11$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The Trapezoid Midsegment Theorem can also find a base. Find $x$.",
        scene: { type: "walk", how: [["Formula", "The midsegment is half the sum of the bases."], ["Double", "Multiply both sides by 2."], ["Solve", "Subtract the base you know."]], rows: [
          { step: 1, m: "16 = \\frac{1}{2}(21 + x)", say: "Midsegment, and the two bases.", fig: FIG_TM2 },
          { step: 2, m: "32 = 21 + x", say: "Multiply both sides by 2.",
            ask: { prompt: "What is $32 - 21$?", answer: 0,
                   options: [{ t: "11" }, { t: "53", fb: "Subtract 21, do not add it." }] } },
          { step: 3, m: "x = 11", say: "Check: the average of 21 and 11 is 16." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find $x$.", art: FIG_TM3, pre: "$x =$", answer: 9, skill: "Trapezoid midsegment",
        near: [{ v: 3, fb: "Double the midsegment first: $2x + 6 = 24$." }],
        hints: ["$12 = \\frac{1}{2}(x + 6 + x)$.", "$24 = 2x + 6$."], why: "$2x = 18$, so $x = 9$. The bases are 9 and 15." },
      { type: "choice", kicker: "Find the error",
        prompt: "The bases of a trapezoid are 10 and 16. Dan says its midsegment is 26. What is wrong?",
        options: [{ t: "He added but did not halve. The midsegment is the average: 13." },
                  { t: "He should have subtracted: 6.", fb: "The midsegment lies between the bases in length: more than 10 and less than 16." },
                  { t: "Nothing. $10 + 16 = 26$.", fb: "A midsegment of 26 would be longer than both bases." }],
        answer: 0, skill: "Trapezoid midsegment", hints: ["The midsegment's length lies between the lengths of the bases."], why: "$\\frac{1}{2}(10 + 16) = 13$." },
      { type: "num", kicker: "Use it", prompt: "One panel of a bridge truss is an isosceles trapezoid. Each angle on its lower, longer base is 62°. Find each angle on its upper base.", post: "°", answer: 118, skill: "Kites and trapezoids",
        near: [{ v: 62, fb: "Those are the lower base angles. An upper angle and a lower angle on the same leg are supplementary." }],
        hints: ["The bases are parallel, so angles along one leg are supplementary."], why: "$180 - 62 = 118$." }
    ]
  });
  /* ================================================================ Skills */
  var QNAMES = ["ABCD", "JKLM", "PQRS", "WXYZ", "EFGH"];
  var SKILLS = [
    { id: "hg6-anglesum", title: "Angles of polygons", lesson: 2,
      gen: function (R) {
        var k = R.int(0, 4), n = R.pick([5, 6, 8, 9, 10, 12]);
        if (k === 0) { var m = R.int(5, 12);
          return { type: "num", prompt: "Find the sum of the interior angles of a convex polygon with " + m + " sides.", post: "°", answer: (m - 2) * 180,
            near: near((m - 2) * 180, [{ v: m * 180, fb: "Use $n - 2$, not $n$." }, { v: (m - 1) * 180, fb: "Use $n - 2$: the diagonals from one vertex make $n - 2$ triangles." }]), hints: ["$(n - 2)180$."], why: "$(" + m + " - 2)180 = " + (m - 2) * 180 + "$." }; }
        if (k === 1) return { type: "num", prompt: "Find the measure of each interior angle of a regular " + NGON[n] + " (" + n + " sides).", post: "°", answer: (n - 2) * 180 / n,
          near: near((n - 2) * 180 / n, [{ v: 360 / n, fb: "That is each exterior angle." }, { v: (n - 2) * 180, fb: "That is the sum. Divide by " + n + "." }]), hints: ["The sum is $(" + n + " - 2)180 = " + (n - 2) * 180 + "$.", "Divide by " + n + "."], why: "$" + (n - 2) * 180 + " \\div " + n + " = " + (n - 2) * 180 / n + "$." };
        if (k === 2) { var e = R.pick([5, 6, 8, 9, 10, 12, 15, 18, 20]);
          return { type: "num", prompt: "Find the measure of each exterior angle of a regular polygon with " + e + " sides.", post: "°", answer: 360 / e,
            near: near(360 / e, [{ v: (e - 2) * 180 / e, fb: "That is each interior angle. The exterior angles add to 360°." }]), hints: ["$360 \\div " + e + "$."], why: "$360 \\div " + e + " = " + 360 / e + "$." }; }
        if (k === 3) { var s = R.pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24]);
          return { type: "num", prompt: "Each exterior angle of a regular polygon measures " + 360 / s + "°. How many sides does it have?", answer: s,
            near: near(s, [{ v: 180 - 360 / s, fb: "That is the interior angle. Divide 360 by the exterior angle." }]), hints: ["The exterior angles add to 360°."], why: "$360 \\div " + 360 / s + " = " + s + "$." }; }
        var a = R.int(70, 110), b = R.int(70, 110), c = R.int(60, 100), d = 360 - a - b - c;
        return { type: "num", prompt: "Three angles of a quadrilateral measure " + a + "°, " + b + "° and " + c + "°. Find the fourth angle.", post: "°", answer: d,
          near: near(d, [{ v: 180 - (a + b + c - 180), fb: "A quadrilateral's angles add to 360°." }, { v: a + b + c, fb: "That is the sum of the three. Subtract it from 360." }]), hints: ["$(4 - 2)180 = 360$."], why: "$360 - " + (a + b + c) + " = " + d + "$." };
      } },
    { id: "hg6-parallelogram", title: "Properties of parallelograms", lesson: 3,
      gen: function (R) {
        var k = R.int(0, 3), N = R.pick(QNAMES), a = R.int(48, 132);
        if (a === 90) a = 84;
        if (k === 0) return { type: "num", prompt: "In parallelogram $" + N + "$, $m\\angle " + N[0] + " = " + a + "°$. Find $m\\angle " + N[1] + "$.", post: "°", answer: 180 - a,
          near: near(180 - a, [{ v: a, fb: "$" + N[1] + "$ is next to $" + N[0] + "$, not opposite it. Consecutive angles are supplementary." }]), hints: ["Consecutive angles are supplementary."], why: "$180 - " + a + " = " + (180 - a) + "$." };
        if (k === 1) return { type: "num", prompt: "In parallelogram $" + N + "$, $m\\angle " + N[0] + " = " + a + "°$. Find $m\\angle " + N[2] + "$.", post: "°", answer: a,
          near: near(a, [{ v: 180 - a, fb: "$" + N[2] + "$ is opposite $" + N[0] + "$. Opposite angles are congruent." }]), hints: ["Opposite angles are congruent."], why: "$\\angle " + N[2] + " \\cong \\angle " + N[0] + "$." };
        var x = R.int(3, 9), p = R.int(1, 3), r = p + R.int(1, 2), q = R.int(2, 9), v = p * x + q, t = r * x - v;
        if (t <= 0) { x = 9; r = p + 2; v = p * x + q; t = r * x - v; }
        var L1 = poly([[p, "x"], [q, ""]]), L2 = poly([[r, "x"], [-t, ""]]);
        if (k === 2) return { type: "num", prompt: "The diagonals of parallelogram $" + N + "$ cross at $T$. $" + N[0] + "T = " + L1 + "$ and $T" + N[2] + " = " + L2 + "$. Find $" + N[0] + N[2] + "$.", answer: 2 * v,
          near: near(2 * v, [{ v: v, fb: "That is half the diagonal. Double it." }, { v: x, fb: "That is $x$. Find the half, then double it." }]), hints: ["The diagonals bisect each other: $" + L1 + " = " + L2 + "$.", "$x = " + x + "$, so each half is " + v + "."], why: "$x = " + x + "$, each half is " + v + ", and the diagonal is " + 2 * v + "." };
        return { type: "num", prompt: "In parallelogram $" + N + "$, $" + N[0] + N[1] + " = " + L1 + "$ and $" + N[2] + N[3] + " = " + L2 + "$. Find $x$.", pre: "$x =$", answer: x,
          near: near(x, [{ v: v, fb: "That is the length of the side. The question asks for $x$." }]), hints: ["Opposite sides are congruent: $" + L1 + " = " + L2 + "$."], why: "$" + (q + t) + " = " + (r - p) + "x$, so $x = " + x + "$." };
      } },
    { id: "hg6-fourth", title: "Find the fourth vertex", lesson: 3,
      gen: function (R) {
        var N = R.pick(QNAMES), A = [R.int(-4, 0), R.int(-3, 0)], u = [R.int(3, 5), R.int(0, 2)], w = [R.int(1, 3), R.int(2, 4)];
        var B = [A[0] + u[0], A[1] + u[1]], C = [B[0] + w[0], B[1] + w[1]], D = [A[0] + w[0], A[1] + w[1]];
        return { type: "pair", prompt: "Three vertices of parallelogram $" + N + "$ are $" + N[0] + pt(A) + "$, $" + N[1] + pt(B) + "$ and $" + N[2] + pt(C) + "$. Find $" + N[3] + "$. Type it as $(x, y)$.", answer: D,
          near: [{ v: [C[0] + u[0], C[1] + u[1]], fb: "That point is not joined to $" + N[0] + "$ in the right order. Make the move from $" + N[1] + "$ to $" + N[2] + "$, starting at $" + N[0] + "$." }],
          hints: ["From $" + N[1] + "$ to $" + N[2] + "$ is " + w[0] + " right and " + w[1] + " up.", "Make the same move from $" + N[0] + "$."], why: "$(" + A[0] + " + " + w[0] + ", " + A[1] + " + " + w[1] + ") = " + pt(D) + "$." };
      } },
    { id: "hg6-conditions", title: "Conditions for parallelograms", lesson: 4,
      gen: function (R) {
        if (R.chance(0.35)) { var x = R.int(3, 9), p = R.int(1, 3), r = p + R.int(1, 2), q = R.int(2, 9), v = p * x + q, t = r * x - v;
          if (t <= 0) { x = 9; r = p + 2; v = p * x + q; t = r * x - v; }
          return { type: "num", prompt: "One pair of opposite sides of a quadrilateral is parallel. Their lengths are $" + poly([[p, "x"], [q, ""]]) + "$ and $" + poly([[r, "x"], [-t, ""]]) + "$. For which value of $x$ must it be a parallelogram?", pre: "$x =$", answer: x,
            near: near(x, [{ v: v, fb: "That is the length of each side. The question asks for $x$." }]), hints: ["The parallel sides must also be congruent: set the lengths equal."], why: "$" + (q + t) + " = " + (r - p) + "x$, so $x = " + x + "$." }; }
        var Q = R.pick([["Both pairs of opposite sides are congruent.", 1, "That is one of the five conditions."], ["Both pairs of opposite sides are parallel.", 1, "That is the definition of a parallelogram."],
          ["Both pairs of opposite angles are congruent.", 1, "That is one of the five conditions."], ["The diagonals bisect each other.", 1, "That is one of the five conditions."],
          ["One pair of opposite sides is both parallel and congruent.", 1, "The same pair, parallel and congruent: enough."], ["One pair of opposite sides is parallel.", 0, "A trapezoid has one pair of parallel sides."],
          ["One pair of opposite sides is congruent.", 0, "Many quadrilaterals that are not parallelograms have that."], ["One pair of opposite sides is parallel, and the other pair is congruent.", 0, "An isosceles trapezoid fits, and it is not a parallelogram."],
          ["The diagonals are congruent.", 0, "An isosceles trapezoid has congruent diagonals."], ["The diagonals are perpendicular.", 0, "A kite has perpendicular diagonals."], ["One pair of opposite angles is congruent.", 0, "A kite has one pair of congruent opposite angles."]]);
        return mc(R, { prompt: "You know this about a quadrilateral: “" + Q[0] + "” Is that enough to be sure it is a parallelogram?", right: Q[1] ? "Enough" : "Not enough", keep: true,
          wrong: [{ t: Q[1] ? "Not enough" : "Enough", fb: Q[2] }], hints: ["Try to picture a quadrilateral that fits the fact and is not a parallelogram."], why: Q[2] });
      } },
    { id: "hg6-special", title: "Rectangles, rhombuses and squares", lesson: 5,
      gen: function (R) {
        var k = R.int(0, 4), N = R.pick(QNAMES);
        if (k === 0) { var h = R.int(4, 15);
          return { type: "num", prompt: "The diagonals of rectangle $" + N + "$ cross at $T$. $" + N[0] + N[2] + " = " + 2 * h + "$. Find $" + N[1] + "T$.", answer: h,
            near: near(h, [{ v: 2 * h, fb: "The diagonals are congruent **and** bisect each other: take half." }]), hints: ["$" + N[1] + N[3] + " = " + N[0] + N[2] + "$, and $T$ is its midpoint."], why: "$" + N[1] + N[3] + " = " + 2 * h + "$, and half of it is " + h + "." }; }
        if (k === 1) { var T = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
          return { type: "num", prompt: "The diagonals of a rhombus measure " + 2 * T[0] + " and " + 2 * T[1] + ". Find the length of a side.", answer: T[2],
            near: near(T[2], [{ v: 2 * T[2], fb: "Use half of each diagonal as the legs." }]), hints: ["The diagonals bisect each other at right angles.", "Legs of " + T[0] + " and " + T[1] + "."], why: "$\\sqrt{" + T[0] + "^2 + " + T[1] + "^2} = " + T[2] + "$." }; }
        if (k === 2) { var a = R.int(18, 40);
          return { type: "num", prompt: "In rhombus $" + N + "$, diagonal $\\overline{" + N[0] + N[2] + "}$ makes an angle of " + a + "° with side $\\overline{" + N[0] + N[1] + "}$. Find $m\\angle " + N[3] + N[0] + N[1] + "$.", post: "°", answer: 2 * a,
            near: near(2 * a, [{ v: a, fb: "That is half of the angle. The diagonal bisects it." }]), hints: ["Each diagonal of a rhombus bisects a pair of opposite angles."], why: "$2 \\cdot " + a + " = " + 2 * a + "$." }; }
        if (k === 3) { var Q = R.pick([["congruent diagonals", "Rectangle"], ["perpendicular diagonals", "Rhombus"], ["four right angles", "Rectangle"], ["four congruent sides", "Rhombus"], ["diagonals that bisect its angles", "Rhombus"]]);
          return mc(R, { prompt: "Which of these always has " + Q[0] + "?", right: Q[1], keep: true,
            wrong: [{ t: Q[1] === "Rectangle" ? "Rhombus" : "Rectangle", fb: Q[1] === "Rectangle" ? "A rhombus has four congruent sides and perpendicular diagonals." : "A rectangle has four right angles and congruent diagonals." }, { t: "Every parallelogram", fb: "A parallelogram has congruent opposite sides and diagonals that bisect each other, and no more." }],
            hints: ["Rectangle: right angles, congruent diagonals. Rhombus: congruent sides, perpendicular diagonals."], why: "That belongs to the " + Q[1].toLowerCase() + "." }); }
        var x = R.int(3, 9), p = R.int(2, 3), r = p + R.int(1, 2), q = R.int(2, 9), v = p * x + q, t = r * x - v;
        if (t <= 0) { x = 9; r = p + 2; v = p * x + q; t = r * x - v; }
        return { type: "num", prompt: "In rectangle $" + N + "$, $" + N[0] + N[2] + " = " + poly([[p, "x"], [q, ""]]) + "$ and $" + N[1] + N[3] + " = " + poly([[r, "x"], [-t, ""]]) + "$. Find the length of each diagonal.", answer: v,
          near: near(v, [{ v: x, fb: "That is $x$. Substitute it." }]), hints: ["The diagonals of a rectangle are congruent."], why: "$x = " + x + "$, so each diagonal is " + v + "." };
      } },
    { id: "hg6-identify", title: "Name the parallelogram", lesson: 6,
      gen: function (R) {
        var ALL = ["Rectangle", "Rhombus", "Square"], FB = { Rectangle: "A rectangle test: a right angle, or congruent diagonals.", Rhombus: "A rhombus test: congruent consecutive sides, perpendicular diagonals, or a diagonal that bisects opposite angles.", Square: "A square passes a rectangle test and a rhombus test." };
        var right, prompt, why;
        if (R.chance(0.5)) {
          var Q = R.pick([["one right angle", "Rectangle"], ["congruent diagonals", "Rectangle"], ["perpendicular diagonals", "Rhombus"], ["two consecutive sides congruent", "Rhombus"], ["a diagonal that bisects a pair of opposite angles", "Rhombus"],
            ["diagonals that are congruent and perpendicular", "Square"], ["one right angle and two consecutive sides congruent", "Square"]]);
          right = Q[1]; prompt = "A parallelogram has " + Q[0] + ". What must it be? Choose the most exact name."; why = FB[right];
        } else {
          var kind = R.pick(ALL), N = R.pick(QNAMES), P;
          if (kind === "Rhombus") { var T = R.pick([[5, 3, 4], [5, 4, 3], [10, 6, 8]]); P = [[0, 0], [T[0], 0], [T[0] + T[1], T[2]], [T[1], T[2]]]; why = "All four sides are " + T[0] + ", and its sides do not meet at right angles."; }
          else { var w = R.int(3, 8), h = kind === "Square" ? w : w + R.int(1, 3); P = [[0, 0], [w, 0], [w, h], [0, h]]; why = kind === "Square" ? "Right angles, and all four sides are " + w + "." : "Right angles, with sides of " + w + " and " + h + "."; }
          right = kind; prompt = "Parallelogram $" + N + "$ has $" + N[0] + pt(P[0]) + "$, $" + N[1] + pt(P[1]) + "$, $" + N[2] + pt(P[2]) + "$ and $" + N[3] + pt(P[3]) + "$. Choose its most exact name.";
        }
        return mc(R, { prompt: prompt, right: right, keep: true, wrong: ALL.filter(function (v) { return v !== right; }).map(function (v) { return { t: v, fb: FB[v] }; }),
          hints: ["Is there a right angle, or congruent diagonals? Are consecutive sides congruent, or the diagonals perpendicular?"], why: why });
      } },
    { id: "hg6-kite-trap", title: "Kites and trapezoids", lesson: 7,
      gen: function (R) {
        var k = R.int(0, 4);
        if (k === 0) { var m = R.int(8, 20), d = R.int(2, 6);
          return { type: "num", prompt: "The bases of a trapezoid measure " + (m - d) + " and " + (m + d) + ". Find the length of its midsegment.", answer: m,
            near: near(m, [{ v: 2 * m, fb: "That is the sum of the bases. Halve it." }]), hints: ["The midsegment is the average of the bases."], why: "$\\frac{1}{2}(" + (m - d) + " + " + (m + d) + ") = " + m + "$." }; }
        if (k === 1) { var m2 = R.int(10, 20), b = m2 + R.int(2, 7);
          return { type: "num", prompt: "The midsegment of a trapezoid is " + m2 + ", and one base is " + b + ". Find the other base.", answer: 2 * m2 - b,
            near: near(2 * m2 - b, [{ v: b - m2, fb: "Double the midsegment first, then subtract the base." }]), hints: ["$" + m2 + " = \\frac{1}{2}(" + b + " + x)$.", "$" + 2 * m2 + " = " + b + " + x$."], why: "$" + 2 * m2 + " - " + b + " = " + (2 * m2 - b) + "$." }; }
        if (k === 2) { var a = R.int(52, 78);
          return { type: "num", prompt: "Each angle on the longer base of an isosceles trapezoid measures " + a + "°. Find each angle on the shorter base.", post: "°", answer: 180 - a,
            near: near(180 - a, [{ v: a, fb: "Those are the angles on the longer base. Angles along one leg are supplementary." }]), hints: ["The bases are parallel, so the two angles on one leg are supplementary."], why: "$180 - " + a + " = " + (180 - a) + "$." }; }
        if (k === 3) { var T = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
          return { type: "num", prompt: "The diagonals of kite $ABCD$ cross at $E$. $AE = " + T[0] + "$ and $BE = " + T[1] + "$. Find $AB$.", answer: T[2],
            near: near(T[2], [{ v: T[0] + T[1], fb: "The diagonals are perpendicular: use the Pythagorean Theorem." }]), hints: ["The diagonals of a kite are perpendicular, so $\\triangle AEB$ is a right triangle."], why: "$\\sqrt{" + T[0] + "^2 + " + T[1] + "^2} = " + T[2] + "$." }; }
        var top = 2 * R.int(40, 60), bot = 2 * R.int(20, 35), x = (360 - top - bot) / 2;
        return { type: "num", prompt: "In a kite, the two angles between its congruent sides measure " + top + "° and " + bot + "°. The other two angles are congruent. Find each of them.", post: "°", answer: x,
          near: near(x, [{ v: 360 - top - bot, fb: "That is what the two share. Halve it." }]), hints: ["$x + x + " + top + " + " + bot + " = 360$."], why: "$360 - " + (top + bot) + " = " + (360 - top - bot) + "$, and half of that is " + x + "." };
      } }
  ];
  L.unit("geo", 6, {
    title: "Polygons and Quadrilaterals",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Angles of polygons, and the properties of parallelograms.",
        skills: ["hg6-anglesum", "hg6-parallelogram", "hg6-fourth"], per: 2 },
      { title: "Quiz 2", after: 5, blurb: "Conditions for parallelograms, and rectangles, rhombuses and squares.",
        skills: ["hg6-conditions", "hg6-special"], per: 3 },
      { title: "Quiz 3", after: 7, blurb: "Naming special parallelograms, and kites and trapezoids.",
        skills: ["hg6-identify", "hg6-kite-trap"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:6", {
    2: { name: "Polygons", frame: "The interior angles of a convex polygon with $n$ sides add to [[(n − 2)180°]]. Its exterior angles, one at each vertex, add to [[360°]]. A [[regular]] polygon has all sides and all angles congruent.",
         chips: ["n · 180°", "concave"] },
    3: { name: "Parallelograms", frame: "In a parallelogram, opposite sides are parallel and [[congruent]], opposite angles are congruent, consecutive angles are [[supplementary]], and the diagonals [[bisect]] each other.",
         chips: ["complementary", "are perpendicular to"] },
    4: { name: "Conditions for parallelograms", frame: "A quadrilateral is a parallelogram if both pairs of opposite sides are [[congruent]], if its diagonals [[bisect]] each other, or if [[one]] pair of opposite sides is both parallel and congruent.",
         chips: ["perpendicular", "no"] },
    5: { name: "Special parallelograms", frame: "A rectangle's diagonals are [[congruent]]. A rhombus's diagonals are [[perpendicular]]. A [[square]] is both a rectangle and a rhombus.",
         chips: ["parallel", "kite"] },
    6: { name: "Naming a parallelogram", frame: "Start with a [[parallelogram]]. One right angle or congruent diagonals make it a [[rectangle]]. Congruent consecutive sides or perpendicular diagonals make it a [[rhombus]].",
         chips: ["trapezoid", "kite"] },
    7: { name: "Kites and trapezoids", frame: "A kite's diagonals are [[perpendicular]]. A trapezoid has exactly [[one]] pair of parallel sides. Its midsegment is the [[average]] of the bases. An isosceles trapezoid has congruent [[diagonals]].",
         chips: ["two", "sum"] }
  });
})();
