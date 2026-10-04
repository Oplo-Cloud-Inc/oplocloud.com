/* ==========================================================================
   Geometry — Unit 2: Geometric Reasoning. See lab/core.js for the format
   and lab/geotools.js for the drawing kit.

   Follows Holt Geometry, Chapter 2, section for section (2-1 to 2-7), after
   a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   Inductive reasoning and counterexamples (2-1), conditional statements
   (2-2), deductive reasoning (2-3), biconditionals and definitions (2-4),
   and proof: algebraic (2-5), two-column (2-6), flowchart and paragraph
   (2-7). In a worked proof each line is a statement, and the words beside
   it are its reason.

   Lessons carry v: 4 (see Unit 1). Skills are hg2-….

   Eight lessons, seven skills, three quizzes, and the unit test.
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
    blurb: "Before Chapter 2 · Angle pairs, solving equations, and number patterns.",
    mins: 6, v: 4,
    steps: [
      { type: "num", kicker: "Check 1 · Angle pairs", prompt: "Two angles are supplementary. One measures 65°. Find the other.", post: "°", answer: 115, skill: "Supplementary angles",
        near: [{ v: 25, fb: "That is the complement. Supplementary angles add to 180°." }], hints: ["$180 - 65$."], why: "$180 - 65 = 115$." },
      { type: "num", prompt: "Two lines cross. One of the four angles measures 48°. What is the measure of the angle vertical to it?", post: "°", answer: 48, skill: "Vertical angles",
        near: [{ v: 132, fb: "That is the angle beside it. Vertical angles are congruent." }], hints: ["Vertical angles are opposite each other."], why: "Vertical angles are congruent." },
      { type: "num", kicker: "Check 2 · Algebra", prompt: "Solve $4x - 7 = 21$.", pre: "$x =$", answer: 7, skill: "Solve an equation",
        near: [{ v: 3.5, tol: 1e-9, fb: "Add 7 to both sides first: $4x = 28$." }], hints: ["$4x = 28$."], why: "$4x = 28$, so $x = 7$." },
      { type: "choice", prompt: "Adding the same number to both sides of an equation keeps it true. What is that property called?",
        options: [{ t: "The Addition Property of Equality" }, { t: "The Distributive Property", fb: "That one removes parentheses." }, { t: "The Commutative Property", fb: "That one changes the order of an addition." }],
        answer: 0, skill: "Properties of equality", hints: ["Its name says what you did."], why: "If $a = b$, then $a + c = b + c$." },
      { type: "num", kicker: "Check 3 · Patterns", prompt: "Find the next number: 5, 9, 13, 17, …", answer: 21, skill: "Patterns",
        near: [{ v: 20, fb: "Each number is 4 more than the last." }], hints: ["What is added each time?"], why: "Add 4 each time: $17 + 4 = 21$." },
      { type: "num", prompt: "Find the next number: 2, 6, 18, 54, …", answer: 162, skill: "Patterns",
        near: [{ v: 90, fb: "The numbers are multiplied, not added to: each is 3 times the last." }], hints: ["What is each number multiplied by?"], why: "Multiply by 3 each time: $54 \\cdot 3 = 162$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 2-1**. If **check 1** slipped, see lesson 1-4. If **check 2** slipped, Algebra I Unit 1 has the practice.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* =============================== 2-1 · Inductive reasoning and conjectures */
  var HOW_2_1 = [["Look", "Look at several cases, and find what stays the same or how it changes."],
                 ["Conjecture", "State the pattern as a general rule you believe is true."],
                 ["Test", "Test more cases. One case that breaks the rule, a counterexample, proves it false."]];
  LESSONS.push({
    title: "Inductive reasoning and conjectures",
    blurb: "Book 2-1 · Finding patterns, making conjectures, and disproving one with a counterexample.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the next number: 3, 7, 11, 15, …", answer: 19, skill: "Patterns",
        near: [{ v: 18, fb: "Each number is 4 more than the last." }], hints: ["What is added each time?"], why: "Add 4 each time: $15 + 4 = 19$." },
      { type: "learn", kicker: "Explore", prompt: "Step through the figures. How many squares are added each time?",
        scene: { type: "pattern", a: 3, d: 2, n: 1, max: 6, gate: true, gateN: 5 }, gate: true,
        after: "Each figure has 2 more squares than the last. A rule you believe from examples like these is a conjecture." },
      { type: "learn", kicker: "The idea",
        prompt: "**Inductive reasoning** draws a general rule from particular cases. The rule is a **conjecture**: a statement you believe is true. Examples can support a conjecture, but they never prove it. A single **counterexample**, one case where it fails, proves it false.",
        scene: { type: "method", how: HOW_2_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a conjecture made about the sum of two odd numbers.",
        scene: { type: "walk", how: HOW_2_1, rows: [
          { step: 1, m: "3 + 5 = 8 \\qquad 7 + 3 = 10 \\qquad 11 + 1 = 12", say: "Three cases to look at." },
          { step: 2, m: "\\text{odd} + \\text{odd} = \\text{even}", say: "Every sum so far is even. That is the conjecture.",
            ask: { prompt: "What do 8, 10 and 12 have in common?", answer: 0,
                   options: [{ t: "They are all even" }, { t: "They are all multiples of 4", fb: "10 is not a multiple of 4." }] } },
          { step: 3, m: "13 + 21 = 34", say: "Another case agrees." },
          { step: 3, m: "9 + 9 = 18", say: "And another. No counterexample has turned up, so the conjecture stands for now." }] },
        gate: true, then: "It stands, but it is not yet proved. That takes deductive reasoning, later in this unit." },
      { type: "guided", kicker: "Together",
        prompt: "Now you test this conjecture: “For every number $x$, $x^2$ is greater than $x$.”",
        how: HOW_2_1, skill: "Counterexamples",
        steps: [
          { step: 1, ask: "Try $x = 3$. Is $3^2$ greater than 3?", type: "choice", answer: 0,
            options: [{ t: "Yes: $9 > 3$" }, { t: "No", fb: "$3^2 = 9$, and 9 is greater than 3." }],
            m: "3^2 = 9 > 3", say: "One case that agrees." },
          { step: 2, ask: "The conjecture claims this for…", type: "choice", answer: 0,
            options: [{ t: "every number" }, { t: "whole numbers only", fb: "It says “for every number”, so fractions count too." }],
            m: "x^2 > x \\text{ for every } x", say: "A claim about every number." },
          { step: 3, ask: "Test $x = \\frac{1}{2}$. What is $\\left(\\frac{1}{2}\\right)^2$? (Type a fraction like 2/3.)", type: "num", answer: 0.25, tol: 1e-9, shown: "1/4", near: [{ v: 1, fb: "Multiply $\\frac{1}{2}$ by itself. Do not double it." }], hint: "$\\frac{1}{2} \\cdot \\frac{1}{2}$.",
            m: "\\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4}", say: "A quarter." },
          { step: 3, ask: "Is $\\frac{1}{4}$ greater than $\\frac{1}{2}$?", type: "choice", answer: 0,
            options: [{ t: "No. This is a counterexample, so the conjecture is false" }, { t: "Yes", fb: "A quarter is less than a half." }],
            m: "\\frac{1}{4} < \\frac{1}{2}", say: "One counterexample is enough." }],
        why: "Look, conjecture, test. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Which number is a counterexample to “Every prime number is odd”?",
        options: [{ t: "2" }, { t: "9", fb: "9 is odd but not prime, so it says nothing about primes." }, { t: "7", fb: "7 is prime and odd: it agrees with the conjecture." }],
        answer: 0, skill: "Counterexamples", hints: ["Look for a prime number that is even."], why: "2 is prime and even." },
      { type: "num", prompt: "Figure 1 of a pattern has 3 dots, and each figure has 4 more dots than the one before. How many dots are in figure 6?", answer: 23, skill: "Patterns",
        near: [{ v: 27, fb: "Figure 6 is five steps after figure 1, not six." }, { v: 24, fb: "Start from 3, then add 4 five times." }], hints: ["3, 7, 11, …"], why: "$3 + 5 \\cdot 4 = 23$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A conjecture about angles: “The supplement of an angle is always obtuse.”",
        scene: { type: "walk", how: HOW_2_1, rows: [
          { step: 1, m: "30° \\to 150° \\qquad 80° \\to 100°", say: "Two angles and their supplements. Both supplements are obtuse." },
          { step: 2, m: "\\text{a supplement is always obtuse}", say: "It looks right so far." },
          { step: 3, m: "120° \\to 60°", say: "Try an obtuse angle. Its supplement is acute." },
          { step: 3, m: "\\text{false}", say: "120° is a counterexample. The first two cases were both acute angles: they were too alike." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Complete the conjecture: “The product of an even number and any whole number is …”",
        options: [{ t: "even" }, { t: "odd", fb: "Try $2 \\cdot 3 = 6$." }, { t: "prime", fb: "Try $4 \\cdot 3 = 12$." }],
        answer: 0, skill: "Conjectures", hints: ["Try $2 \\cdot 3$, $4 \\cdot 5$ and $6 \\cdot 6$."], why: "6, 20 and 36 are all even." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kim checks $2 + 2 = 4$, $4 + 6 = 10$ and $8 + 2 = 10$, and says: “I have proved that two even numbers always add to an even number.” What is wrong?",
        options: [{ t: "Examples support a conjecture but do not prove it. Three cases are not every case." },
                  { t: "The conjecture is false.", fb: "It happens to be true. The trouble is with the word “proved”." },
                  { t: "Nothing. It is proved.", fb: "No number of examples covers every case." }],
        answer: 0, skill: "Conjectures", hints: ["How many pairs of even numbers are there?"], why: "Inductive reasoning gives a conjecture, not a proof." },
      { type: "choice", kicker: "Use it", prompt: "It has rained on each of the last four Mondays. What does inductive reasoning let you say?",
        options: [{ t: "A conjecture: it may well rain next Monday" }, { t: "A proof that it rains every Monday", fb: "Four cases prove nothing about the next one." }],
        answer: 0, skill: "Conjectures", hints: ["Is a pattern the same as a proof?"], why: "A pattern suggests a rule. It does not guarantee it." }
    ]
  });

  /* ================================================ 2-2 · Conditional statements */
  var HOW_2_2 = [["Parts", "Find the hypothesis (after “if”) and the conclusion (after “then”)."],
                 ["Rearrange", "Converse: swap them. Inverse: negate both. Contrapositive: swap and negate."],
                 ["Truth", "Decide whether each statement is true. One counterexample makes it false."]];
  LESSONS.push({
    title: "Conditional statements",
    blurb: "Book 2-2 · Hypothesis and conclusion, truth value, and the converse, inverse and contrapositive.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In “If it is raining, then the ground is wet”, which part is the condition?",
        options: [{ t: "it is raining" }, { t: "the ground is wet", fb: "That is what follows from the condition." }],
        answer: 0, skill: "Hypothesis and conclusion", hints: ["It comes after “if”."], why: "The “if” part is the condition: the hypothesis." },
      { type: "learn", kicker: "The idea",
        prompt: "A **conditional** has the form “if $p$, then $q$”: $p$ is the **hypothesis** and $q$ the **conclusion**. It is false only when $p$ is true and $q$ is false. Swapping and negating the two parts gives three related statements.",
        scene: { type: "method", how: HOW_2_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the related statements of “If a figure is a square, then it has four sides.”",
        scene: { type: "walk", how: HOW_2_2, rows: [
          { step: 1, m: "p\\text{: a square} \\qquad q\\text{: four sides}", say: "The hypothesis and the conclusion." },
          { step: 2, m: "q \\to p", say: "The converse: if a figure has four sides, then it is a square.",
            ask: { prompt: "What does a converse do to the two parts?", answer: 0,
                   options: [{ t: "Swaps them" }, { t: "Negates them", fb: "Negating both gives the inverse." }] } },
          { step: 2, m: "\\text{not } p \\to \\text{not } q", say: "The inverse: if a figure is not a square, then it does not have four sides." },
          { step: 2, m: "\\text{not } q \\to \\text{not } p", say: "The contrapositive: if a figure does not have four sides, then it is not a square." },
          { step: 3, m: "p \\to q \\text{ and its contrapositive: true}", say: "A rectangle has four sides and need not be a square, so the converse and the inverse are false." }] },
        gate: true, then: "A conditional and its contrapositive are always true together or false together." },
      { type: "guided", kicker: "Together",
        prompt: "Now you work with “If two angles are vertical, then they are congruent.”",
        how: HOW_2_2, skill: "Converse, inverse, contrapositive",
        steps: [
          { step: 1, ask: "Which part is the hypothesis?", type: "choice", answer: 0,
            options: [{ t: "two angles are vertical" }, { t: "they are congruent", fb: "That is the conclusion: it follows “then”." }],
            m: "p\\text{: vertical} \\qquad q\\text{: congruent}", say: "Hypothesis, then conclusion." },
          { step: 2, ask: "Which is the converse?", type: "choice", answer: 0,
            options: [{ t: "If two angles are congruent, then they are vertical." }, { t: "If two angles are not vertical, then they are not congruent.", fb: "That negates both parts: the inverse." }, { t: "If two angles are not congruent, then they are not vertical.", fb: "That swaps and negates: the contrapositive." }],
            m: "q \\to p", say: "The converse swaps the parts." },
          { step: 3, ask: "Is the converse true?", type: "choice", answer: 0,
            options: [{ t: "No: two 40° angles in different places are congruent but not vertical" }, { t: "Yes", fb: "Congruent angles need not be made by the same two crossing lines." }],
            m: "q \\to p\\text{: false}", say: "One counterexample is enough." }],
        why: "Parts, rearrange, truth. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "Start from “If $p$, then $q$.” Match each related statement to its name.",
        slots: [{ id: "c", label: "Converse" }, { id: "i", label: "Inverse" }, { id: "k", label: "Contrapositive" }],
        cards: [{ t: nb("If $q$, then $p$."), slot: "c", fb: "The parts are swapped." },
                { t: nb("If not $p$, then not $q$."), slot: "i", fb: "Both parts are negated, in the same order." },
                { t: nb("If not $q$, then not $p$."), slot: "k", fb: "Swapped and negated." }],
        skill: "Converse, inverse, contrapositive", hints: ["Swapped? Negated? Both?"],
        why: "Converse swaps, inverse negates, contrapositive does both." },
      { type: "choice", prompt: "Write “All squares are rectangles” as a conditional.",
        options: [{ t: "If a figure is a square, then it is a rectangle." }, { t: "If a figure is a rectangle, then it is a square.", fb: "That says all rectangles are squares, which is a different claim." }],
        answer: 0, skill: "Write a conditional", hints: ["“All A are B” means: if something is an A, then it is a B."], why: "Being a square is the condition. Being a rectangle follows." },
      { type: "learn", kicker: "A harder case",
        prompt: "What is the truth value of “If $2 + 2 = 5$, then a triangle has four sides”?",
        scene: { type: "walk", how: [["Hypothesis", "Is the hypothesis true?"], ["Conclusion", "If it is, is the conclusion true as well?"], ["Value", "A conditional is false only when a true hypothesis leads to a false conclusion."]], rows: [
          { step: 1, m: "2 + 2 = 5", say: "The hypothesis is false." },
          { step: 2, m: "\\text{the conclusion is never tested}", say: "With a false hypothesis, the conditional's promise is never called on." },
          { step: 3, m: "\\text{true}", say: "Odd, but standard: a conditional with a false hypothesis counts as true, because it breaks no promise." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which related statement always has the same truth value as the conditional itself?",
        options: [{ t: "The contrapositive" }, { t: "The converse", fb: "A converse can be false when the conditional is true: squares and four sides." }, { t: "The inverse", fb: "The inverse goes with the converse, not with the conditional." }],
        answer: 0, skill: "Converse, inverse, contrapositive", hints: ["Which one both swaps and negates?"], why: "A conditional and its contrapositive are logically equivalent." },
      { type: "choice", kicker: "Find the error",
        prompt: "“If it is a dog, then it is a mammal.” Jo says the converse must be true as well. What is wrong?",
        options: [{ t: "The converse, “if it is a mammal, then it is a dog”, is false: a cat is a counterexample." },
                  { t: "The original conditional is false.", fb: "Every dog is a mammal: the conditional is true." },
                  { t: "Nothing. A converse is always true.", fb: "Swapping the parts makes a new claim, which has to be checked." }],
        answer: 0, skill: "Converse, inverse, contrapositive", hints: ["Say the converse aloud, then look for a counterexample."], why: "A true conditional can have a false converse." },
      { type: "choice", kicker: "Use it", prompt: "A sign says: “If you are under 12, then you ride free.” Ana is 15. What does the sign say about Ana?",
        options: [{ t: "Nothing: the hypothesis is false for her" }, { t: "She must pay", fb: "That is the inverse of the sign. The sign itself does not say it." }, { t: "She rides free", fb: "The promise is only made to people under 12." }],
        answer: 0, skill: "Truth value", hints: ["Is Ana under 12?"], why: "A conditional promises something only when its hypothesis is true." }
    ]
  });

  /* ====================== 2-3 · Using deductive reasoning to verify conjectures */
  var HOW_2_3 = [["Facts", "List what is given: the true conditional, and the true fact."],
                 ["Law", "Detachment: $p \\to q$ and $p$ give $q$. Syllogism: $p \\to q$ and $q \\to r$ give $p \\to r$."],
                 ["Conclude", "State the conclusion, or say that none follows."]];
  LESSONS.push({
    title: "Deductive reasoning",
    blurb: "Book 2-3 · Drawing conclusions with the Law of Detachment and the Law of Syllogism.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which kind of reasoning argues from facts and rules instead of from examples?",
        options: [{ t: "Deductive reasoning" }, { t: "Inductive reasoning", fb: "Inductive reasoning goes from examples to a conjecture." }],
        answer: 0, skill: "Kinds of reasoning", hints: ["Lesson 2-1 used examples."], why: "Deductive reasoning works from what is known to be true." },
      { type: "learn", kicker: "The idea",
        prompt: "**Deductive reasoning** draws conclusions from facts, definitions and properties by logic. If the given statements are true, the conclusion must be true. Two laws do the work: the **Law of Detachment** and the **Law of Syllogism**.",
        scene: { type: "method", how: HOW_2_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Given: “If a student passes the test, then the student gets a certificate.” Maya passed the test. Watch the conclusion drawn.",
        scene: { type: "walk", how: HOW_2_3, rows: [
          { step: 1, m: "p \\to q \\qquad p", say: "A true conditional, and a fact that matches its hypothesis." },
          { step: 2, m: "\\text{Law of Detachment}", say: "The hypothesis holds, so the conclusion can be detached.",
            ask: { prompt: "Which part of the conditional does the fact match?", answer: 0,
                   options: [{ t: "The hypothesis" }, { t: "The conclusion", fb: "“Maya passed the test” is the “if” part." }] } },
          { step: 3, m: "q", say: "Maya gets a certificate." },
          { step: 3, m: "q \\text{ alone gives nothing}", say: "Had we known only that Maya got a certificate, nothing would follow: she might have earned it another way." }] },
        gate: true, then: "The fact has to match the hypothesis, never the conclusion." },
      { type: "guided", kicker: "Together",
        prompt: "Given: “If a figure is a square, then it is a rectangle.” “If a figure is a rectangle, then it has four right angles.” Now you draw the conclusion.",
        how: HOW_2_3, skill: "Law of Syllogism",
        steps: [
          { step: 1, ask: "The first conclusion and the second hypothesis are…", type: "choice", answer: 0,
            options: [{ t: "the same: “it is a rectangle”" }, { t: "different", fb: "Both say the figure is a rectangle." }],
            m: "p \\to q \\qquad q \\to r", say: "The two conditionals link through $q$." },
          { step: 2, ask: "Which law joins them?", type: "choice", answer: 0,
            options: [{ t: "The Law of Syllogism" }, { t: "The Law of Detachment", fb: "Detachment needs a fact that matches a hypothesis. Here there are two conditionals." }],
            m: "\\text{Law of Syllogism}", say: "A chain of two conditionals." },
          { step: 3, ask: "What follows?", type: "choice", answer: 0,
            options: [{ t: "If a figure is a square, then it has four right angles." }, { t: "If a figure has four right angles, then it is a square.", fb: "That is the converse. The chain runs from the first hypothesis to the last conclusion." }],
            m: "p \\to r", say: "From the first hypothesis to the last conclusion." }],
        why: "Facts, law, conclude. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Given: “If two angles are a linear pair, then they are supplementary.” $\\angle A$ and $\\angle B$ are supplementary. Conclusion: they are a linear pair. Is that valid?",
        options: [{ t: "No: the fact matches the conclusion, not the hypothesis" }, { t: "Yes, by the Law of Detachment", fb: "Detachment needs the hypothesis to be true. Here it is the conclusion that is known." }, { t: "Yes, by the Law of Syllogism", fb: "There is only one conditional here." }],
        answer: 0, skill: "Law of Detachment", hints: ["Which part of the conditional is known to be true?"], why: "Two 90° angles in different places are supplementary without being a linear pair." },
      { type: "sort", prompt: "Inductive or deductive?",
        bins: ["Inductive", "Deductive"],
        cards: [{ t: "Every swan I have seen is white, so all swans are white.", bin: 0, fb: "A rule drawn from examples." },
                { t: "All squares have four sides. This is a square, so it has four sides.", bin: 1, fb: "A conclusion from a fact and a rule." },
                { t: "2, 4, 6 … so the next number is 8.", bin: 0, fb: "A pattern continued." },
                { t: "Vertical angles are congruent. These two are vertical, so they are congruent.", bin: 1, fb: "A theorem applied to a case." }],
        skill: "Kinds of reasoning", hints: ["From examples to a rule, or from a rule to a case?"],
        why: "Inductive: cases to a rule. Deductive: a rule to a case." },
      { type: "learn", kicker: "A harder case",
        prompt: "Both laws at once. “If it snows, then school closes.” “If school closes, then the game is cancelled.” It snows.",
        scene: { type: "walk", how: HOW_2_3, rows: [
          { step: 1, m: "p \\to q \\qquad q \\to r \\qquad p", say: "Two conditionals and one fact." },
          { step: 2, m: "p \\to r", say: "Syllogism joins the two conditionals: if it snows, then the game is cancelled." },
          { step: 2, m: "p \\to r \\text{ and } p", say: "Detachment: the fact matches the new hypothesis." },
          { step: 3, m: "r", say: "The game is cancelled." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Given: “If $x > 5$, then $x^2 > 25$.” Given: $x = 7$. What can you conclude?",
        options: [{ t: "$x^2 > 25$" }, { t: "Nothing", fb: "$7 > 5$, so the hypothesis is true and the conclusion follows." }, { t: "$x = 5$", fb: "$x$ is given as 7." }],
        answer: 0, skill: "Law of Detachment", hints: ["Is the hypothesis true for $x = 7$?"], why: "$7 > 5$, so by the Law of Detachment $x^2 > 25$." },
      { type: "choice", kicker: "Find the error",
        prompt: "“If I oversleep, then I miss the bus. I missed the bus. So I overslept.” What is wrong?",
        options: [{ t: "The fact matches the conclusion, not the hypothesis. Something else could have made me miss the bus." },
                  { t: "The conditional is false.", fb: "Nothing says so. The trouble is in how it is used." },
                  { t: "Nothing. It is valid.", fb: "The bus could have left early, for one." }],
        answer: 0, skill: "Law of Detachment", hints: ["Which part of the conditional is known?"], why: "Knowing $q$ tells you nothing about $p$." },
      { type: "choice", kicker: "Use it", prompt: "A phone plan says: “If you use more than 10 GB, then you pay a surcharge.” Lia used 12 GB. What follows?",
        options: [{ t: "Lia pays a surcharge, by the Law of Detachment" }, { t: "Nothing follows", fb: "$12 > 10$, so the hypothesis is true." }],
        answer: 0, skill: "Law of Detachment", hints: ["Is the hypothesis true for Lia?"], why: "The hypothesis holds, so the conclusion does." }
    ]
  });
  /* ================================= 2-4 · Biconditional statements and definitions */
  var HOW_2_4 = [["Split", "Write the two conditionals inside it: $p \\to q$ and its converse $q \\to p$."],
                 ["Test", "Decide whether each one is true."],
                 ["Decide", "The biconditional is true only if both are."]];
  LESSONS.push({
    title: "Biconditional statements and definitions",
    blurb: "Book 2-4 · “If and only if”, the two conditionals inside it, and why a good definition is a biconditional.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is the converse of “If a number is even, then it is divisible by 2”?",
        options: [{ t: "If a number is divisible by 2, then it is even." }, { t: "If a number is not even, then it is not divisible by 2.", fb: "That negates both parts: the inverse." }],
        answer: 0, skill: "Converse", hints: ["Swap the two parts."], why: "A converse swaps the hypothesis and the conclusion." },
      { type: "learn", kicker: "The idea",
        prompt: "When a conditional and its converse are both true, they join into one **biconditional**: “$p$ if and only if $q$”, written $p \\iff q$. Every good **definition** is a biconditional, because it has to work in both directions.",
        scene: { type: "method", how: HOW_2_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch “An angle is a right angle if and only if it measures 90°” tested.",
        scene: { type: "walk", how: HOW_2_4, rows: [
          { step: 1, m: "p \\to q", say: "If an angle is a right angle, then it measures 90°." },
          { step: 1, m: "q \\to p", say: "If an angle measures 90°, then it is a right angle.",
            ask: { prompt: "The second conditional is the first one's…", answer: 0,
                   options: [{ t: "converse" }, { t: "inverse", fb: "Nothing is negated. The two parts have swapped." }] } },
          { step: 2, m: "p \\to q\\text{: true} \\qquad q \\to p\\text{: true}", say: "Both hold." },
          { step: 3, m: "p \\iff q\\text{: true}", say: "It is the definition of a right angle." }] },
        gate: true, then: "“If and only if” is two promises in one sentence." },
      { type: "guided", kicker: "Together",
        prompt: "Now you test “A number is divisible by 6 if and only if it is divisible by 3.”",
        how: HOW_2_4, skill: "Biconditionals",
        steps: [
          { step: 1, ask: "Which two conditionals are inside it?", type: "choice", answer: 0,
            options: [{ t: "“If divisible by 6, then by 3” and “if divisible by 3, then by 6”" }, { t: "“If divisible by 6, then by 3” and “if not divisible by 6, then not by 3”", fb: "The second of those is the inverse. A biconditional holds the conditional and its converse." }],
            m: "p \\to q \\qquad q \\to p", say: "The conditional and its converse." },
          { step: 2, ask: "Is “if a number is divisible by 6, then it is divisible by 3” true?", type: "choice", answer: 0,
            options: [{ t: "Yes: $6 = 3 \\cdot 2$" }, { t: "No", fb: "Every multiple of 6 is $3 \\cdot 2 \\cdot k$, so 3 divides it." }],
            m: "p \\to q\\text{: true}", say: "A multiple of 6 is a multiple of 3." },
          { step: 2, ask: "Is “if a number is divisible by 3, then it is divisible by 6” true?", type: "choice", answer: 0,
            options: [{ t: "No: 9 is a counterexample" }, { t: "Yes", fb: "Try 9 or 15." }],
            m: "q \\to p\\text{: false}", say: "9 is divisible by 3 but not by 6." },
          { step: 3, ask: "So the biconditional is…", type: "choice", answer: 0,
            options: [{ t: "false" }, { t: "true", fb: "Both conditionals have to be true." }],
            m: "p \\iff q\\text{: false}", say: "One false conditional is enough." }],
        why: "Split, test, decide. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Which of these is a biconditional?",
        options: [{ t: "Two lines are perpendicular if and only if they meet at right angles." }, { t: "If two lines are perpendicular, then they meet at right angles.", fb: "That is a single conditional: one direction only." }, { t: "Perpendicular lines meet at right angles.", fb: "That is one direction only, without even an “if”." }],
        answer: 0, skill: "Biconditionals", hints: ["Look for “if and only if”."], why: "“If and only if” makes it work both ways." },
      { type: "choice", prompt: "“A triangle is a polygon with three sides.” Which biconditional says the same thing?",
        options: [{ t: "A figure is a triangle if and only if it is a polygon with three sides." }, { t: "If a figure is a triangle, then it is a polygon.", fb: "True, but it drops “three sides” and only goes one way." }],
        answer: 0, skill: "Definitions", hints: ["A definition must work in both directions."], why: "A triangle is such a polygon, and every such polygon is a triangle." },
      { type: "learn", kicker: "A harder case",
        prompt: "A true conditional and its true converse can be joined. Start from “If $2x + 5 = 11$, then $x = 3$.”",
        scene: { type: "walk", how: HOW_2_4, rows: [
          { step: 1, m: "2x + 5 = 11 \\to x = 3", say: "The conditional." },
          { step: 1, m: "x = 3 \\to 2x + 5 = 11", say: "Its converse." },
          { step: 2, m: "\\text{both true}", say: "Solving gives $x = 3$, and substituting 3 gives $6 + 5 = 11$." },
          { step: 3, m: "2x + 5 = 11 \\iff x = 3", say: "$2x + 5 = 11$ if and only if $x = 3$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "“A figure is a square if and only if it has four right angles.” True or false?",
        options: [{ t: "False: a rectangle that is not a square has four right angles" }, { t: "True", fb: "A square does have four right angles, but so does every rectangle." }],
        answer: 0, skill: "Biconditionals", hints: ["Test the converse: four right angles, so a square?"], why: "The converse fails, so the biconditional is false." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam writes: “A rectangle is a figure with four sides.” Why is that a poor definition?",
        options: [{ t: "It does not work backwards: a figure with four sides need not be a rectangle." },
                  { t: "A rectangle does not have four sides.", fb: "It does. The trouble is in the other direction." },
                  { t: "It is a good definition.", fb: "A kite has four sides too." }],
        answer: 0, skill: "Definitions", hints: ["Read it backwards. Is it still true?"], why: "A definition must be reversible." },
      { type: "choice", kicker: "Use it", prompt: "A club rule: “You may vote if and only if you have paid your dues.” Dana has paid. Eli has not. What does the rule say?",
        options: [{ t: "Dana may vote, and Eli may not" }, { t: "Dana may vote, and the rule says nothing about Eli", fb: "“Only if” rules Eli out: voting requires paid dues." }],
        answer: 0, skill: "Biconditionals", hints: ["“If” covers Dana. What does “only if” cover?"], why: "A biconditional works in both directions." }
    ]
  });

  /* ========================================================== 2-5 · Algebraic proof */
  var HOW_2_5 = [["Given", "Write the given equation as the first statement."],
                 ["Steps", "Change one thing at a time, and name the property that allows it."],
                 ["Prove", "Stop when you reach the statement to be proved."]];
  LESSONS.push({
    title: "Algebraic proof",
    blurb: "Book 2-5 · The properties of equality as reasons, and the reflexive, symmetric and transitive properties.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $3x - 4 = 11$.", pre: "$x =$", answer: 5, skill: "Solve an equation",
        near: [{ v: 7 / 3, tol: 1e-6, fb: "Add 4 to both sides first: $3x = 15$." }], hints: ["$3x = 15$."], why: "$3x = 15$, so $x = 5$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **proof** is an argument in which every step has a reason. In an algebraic proof the reasons are the properties of equality: what you do to one side you do to the other, and the name of the property says what you did.",
        scene: { type: "method", how: HOW_2_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $4(x - 2) = 20$ solved, with a reason for every step.",
        scene: { type: "walk", how: HOW_2_5, rows: [
          { step: 1, m: "4(x - 2) = 20", say: "Given." },
          { step: 2, m: "4x - 8 = 20", say: "Distributive Property.",
            ask: { prompt: "Which property removes the parentheses?", answer: 0,
                   options: [{ t: "The Distributive Property" }, { t: "The Addition Property of Equality", fb: "Nothing has been added to both sides yet." }] } },
          { step: 2, m: "4x = 28", say: "Addition Property of Equality: 8 is added to both sides." },
          { step: 3, m: "x = 7", say: "Division Property of Equality: both sides are divided by 4." }] },
        gate: true, then: "The algebra is not new. Writing down why each step is allowed is." },
      { type: "guided", kicker: "Together",
        prompt: "Now you give the reasons as $\\frac{x}{3} + 5 = 9$ is solved.",
        how: HOW_2_5, skill: "Algebraic proof",
        steps: [
          { step: 1, ask: "What reason goes beside the first statement, $\\frac{x}{3} + 5 = 9$?", type: "choice", answer: 0,
            options: [{ t: "Given" }, { t: "Addition Property of Equality", fb: "Nothing has been done yet. The first statement is what you start from." }],
            m: "\\frac{x}{3} + 5 = 9", say: "Given." },
          { step: 2, ask: "5 is subtracted from both sides. Which property is that?", type: "choice", answer: 0,
            options: [{ t: "Subtraction Property of Equality" }, { t: "Division Property of Equality", fb: "Nothing was divided." }],
            m: "\\frac{x}{3} = 4", say: "Subtraction Property of Equality." },
          { step: 2, ask: "Both sides are multiplied by 3. Which property?", type: "choice", answer: 0,
            options: [{ t: "Multiplication Property of Equality" }, { t: "Distributive Property", fb: "There are no parentheses to remove." }],
            m: "x = 12", say: "Multiplication Property of Equality." },
          { step: 3, ask: "Check the result: what is $\\frac{12}{3} + 5$?", type: "num", answer: 9, hint: "$4 + 5$.",
            m: "\\frac{12}{3} + 5 = 9", say: "It satisfies the given equation." }],
        why: "Given, steps, prove. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "Match each statement to the property it shows.",
        slots: [{ id: "r", label: "Reflexive" }, { id: "s", label: "Symmetric" }, { id: "t", label: "Transitive" }],
        cards: [{ t: "$AB = AB$", slot: "r", fb: "Anything equals itself." },
                { t: nb("If $x = 4$, then $4 = x$."), slot: "s", fb: "The two sides may change places." },
                { t: nb("If $a = b$ and $b = c$, then $a = c$."), slot: "t", fb: "Two things equal to the same thing are equal." }],
        skill: "Properties of equality", hints: ["Itself? Swapped? Passed along a chain?"],
        why: "Reflexive: itself. Symmetric: swapped. Transitive: a chain." },
      { type: "choice", prompt: "$m\\angle A = 30°$ and $m\\angle A + m\\angle B = 90°$, so $30° + m\\angle B = 90°$. Which property is the reason?",
        options: [{ t: "Substitution" }, { t: "Transitive", fb: "Transitive links two equations through a shared side. Here a value replaces a quantity." }, { t: "Reflexive", fb: "Reflexive says a quantity equals itself." }],
        answer: 0, skill: "Properties of equality", hints: ["$m\\angle A$ was replaced by its value."], why: "30° was substituted for $m\\angle A$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The same proof with a geometric start. $B$ is between $A$ and $C$, $AB = 2x + 1$, $BC = 3x - 4$ and $AC = 22$. Prove that $x = 5$.",
        scene: { type: "walk", how: HOW_2_5, rows: [
          { step: 1, m: "AB + BC = AC", say: "Segment Addition Postulate." },
          { step: 2, m: "(2x + 1) + (3x - 4) = 22", say: "Substitution." },
          { step: 2, m: "5x - 3 = 22", say: "Simplify." },
          { step: 2, m: "5x = 25", say: "Addition Property of Equality." },
          { step: 3, m: "x = 5", say: "Division Property of Equality." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Congruence has the same three properties. Which statement is the Symmetric Property of Congruence?",
        options: [{ t: "If $\\overline{AB} \\cong \\overline{CD}$, then $\\overline{CD} \\cong \\overline{AB}$." }, { t: "$\\overline{AB} \\cong \\overline{AB}$", fb: "A figure congruent to itself: Reflexive." }, { t: "If $\\overline{AB} \\cong \\overline{CD}$ and $\\overline{CD} \\cong \\overline{EF}$, then $\\overline{AB} \\cong \\overline{EF}$.", fb: "A chain of three: Transitive." }],
        answer: 0, skill: "Properties of congruence", hints: ["Symmetric means the two sides change places."], why: "The two segments swap sides of the $\\cong$ sign." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["3x + 6 = 21", "3x = 27", "x = 9"], answer: 1, fix: "3x = 15",
        fb: { 0: GIVEN, 2: LATER }, skill: "Algebraic proof",
        hints: ["Which property undoes “+ 6”?"],
        why: "Subtraction Property of Equality: $21 - 6 = 15$, so $x = 5$." },
      { type: "num", kicker: "Use it", prompt: "Use the Subtraction and then the Multiplication Property of Equality to solve $68 = \\frac{9}{5}C + 32$ for $C$.", pre: "$C =$", post: "°", answer: 20, skill: "Algebraic proof",
        near: [{ v: 64.8, tol: 1e-6, fb: "Multiply 36 by $\\frac{5}{9}$, the reciprocal, not by $\\frac{9}{5}$." }], hints: ["$36 = \\frac{9}{5}C$."], why: "$36 \\cdot \\frac{5}{9} = 20$." }
    ]
  });
  /* ========================================================== 2-6 · Geometric proof */
  var HOW_2_6 = [["Given", "List the given information, and mark it on the figure."],
                 ["Link", "Move one step at a time. Each statement needs a reason: a definition, a postulate, a property or a theorem."],
                 ["Prove", "End with the statement you were asked to prove."]];
  var FIG_LINPAIR = rayFig([0, 0], [{ d: 0, name: "A" }, { d: 125, name: "C" }, { d: 180, name: "B" }],
    { vname: "O", num: [{ i: 0, j: 1, t: "1" }, { i: 1, j: 2, t: "2" }], y: [-0.9, 3.2], alt: "A straight line AB with a ray OC rising from it. The ray makes angle 1 on the right and angle 2 on the left." });
  LESSONS.push({
    title: "Geometric proof",
    blurb: "Book 2-6 · Theorems and two-column proofs: a statement on the left, and its reason on the right.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "$\\angle 1$ and $\\angle 2$ form a linear pair. What must be true of them?", art: FIG_LINPAIR,
        options: [{ t: "They are supplementary" }, { t: "They are congruent", fb: "Only if each happens to be 90°." }, { t: "They are complementary", fb: "Together they make a straight angle: 180°, not 90°." }],
        answer: 0, skill: "Linear Pair Theorem", hints: ["Their outer sides form a straight line."], why: "A linear pair adds to 180°: the Linear Pair Theorem." },
      { type: "learn", kicker: "The idea",
        prompt: "A **theorem** is a statement that has been proved. A **two-column proof** lists the statements on the left and the reason for each on the right. A reason is a given fact, a definition, a postulate, a property, or a theorem already proved.",
        scene: { type: "method", how: HOW_2_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Given: $\\angle 1$ and $\\angle 2$ are supplementary, and $\\angle 2$ and $\\angle 3$ are supplementary. Prove: $\\angle 1 \\cong \\angle 3$. Each line is a statement, with its reason beside it.",
        scene: { type: "walk", how: HOW_2_6, rows: [
          { step: 1, m: "\\angle 1, \\angle 2 \\text{ suppl.} \\qquad \\angle 2, \\angle 3 \\text{ suppl.}", say: "Given." },
          { step: 2, m: "m\\angle 1 + m\\angle 2 = 180° \\qquad m\\angle 2 + m\\angle 3 = 180°", say: "Definition of supplementary angles." },
          { step: 2, m: "m\\angle 1 + m\\angle 2 = m\\angle 2 + m\\angle 3", say: "Substitution.",
            ask: { prompt: "Both sums equal 180°. Which property lets you set them equal to each other?", answer: 0,
                   options: [{ t: "Substitution" }, { t: "Reflexive", fb: "Reflexive says only that a quantity equals itself." }] } },
          { step: 2, m: "m\\angle 1 = m\\angle 3", say: "Subtraction Property of Equality." },
          { step: 3, m: "\\angle 1 \\cong \\angle 3", say: "Definition of congruent angles." }] },
        gate: true, then: "This is the Congruent Supplements Theorem: angles supplementary to the same angle are congruent." },
      { type: "guided", kicker: "Together",
        prompt: "Given: $B$ is the midpoint of $\\overline{AC}$, and $\\overline{AB} \\cong \\overline{EF}$. Prove: $\\overline{BC} \\cong \\overline{EF}$. Now you supply the steps.",
        how: HOW_2_6, skill: "Two-column proof",
        steps: [
          { step: 1, ask: "What is the reason for the statement “$B$ is the midpoint of $\\overline{AC}$”?", type: "choice", answer: 0,
            options: [{ t: "Given" }, { t: "Definition of midpoint", fb: "The definition is what you use next. This statement itself was handed to you." }],
            m: "B \\text{ is the midpoint of } \\overline{AC}", say: "Given." },
          { step: 2, ask: "A midpoint makes two congruent segments. Which statement follows?", type: "choice", answer: 0,
            options: [{ t: "$\\overline{AB} \\cong \\overline{BC}$" }, { t: "$\\overline{AB} \\cong \\overline{AC}$", fb: "$\\overline{AC}$ is the whole segment. The two halves are congruent to each other." }],
            m: "\\overline{AB} \\cong \\overline{BC}", say: "Definition of midpoint." },
          { step: 2, ask: "$\\overline{BC} \\cong \\overline{AB}$ and $\\overline{AB} \\cong \\overline{EF}$. Which property links $\\overline{BC}$ to $\\overline{EF}$?", type: "choice", answer: 0,
            options: [{ t: "Transitive Property of Congruence" }, { t: "Reflexive Property of Congruence", fb: "Reflexive says only that a segment is congruent to itself." }],
            m: "\\overline{BC} \\cong \\overline{EF}", say: "Transitive Property of Congruence." },
          { step: 3, ask: "Is that the statement you were asked to prove?", type: "choice", answer: 0,
            options: [{ t: "Yes: the proof is complete" }, { t: "No", fb: "The last statement is exactly the “Prove” line." }],
            m: "\\text{proved}", say: "The last statement matches the “Prove” line." }],
        why: "Given, link, prove. Now two on your own." },
      { type: "order", kicker: "On your own", prompt: "Given: $\\angle 1$ and $\\angle 2$ are a linear pair, and $m\\angle 1 = 115°$. Prove: $m\\angle 2 = 65°$. Put the statements in order.",
        items: [nb("$\\angle 1$ and $\\angle 2$ are a linear pair. (Given)"), nb("$\\angle 1$ and $\\angle 2$ are supplementary. (Linear Pair Theorem)"), nb("$m\\angle 1 + m\\angle 2 = 180°$ (Definition of supplementary angles)"), nb("$115° + m\\angle 2 = 180°$ (Substitution)"), nb("$m\\angle 2 = 65°$ (Subtraction Property of Equality)")],
        skill: "Two-column proof", hints: ["Start with what is given. End with what is to be proved.", "Each statement must come after the one it depends on."],
        why: "Given, then the theorem, then its definition, then the number put in, then the subtraction." },
      { type: "choice", prompt: "Which theorem says that all right angles are congruent?",
        options: [{ t: "The Right Angle Congruence Theorem" }, { t: "The Linear Pair Theorem", fb: "That one says a linear pair is supplementary." }, { t: "The Congruent Supplements Theorem", fb: "That one is about angles supplementary to the same angle." }],
        answer: 0, skill: "Theorems about angles", hints: ["Its name says what it is about."], why: "Every right angle measures 90°, so any two are congruent." },
      { type: "learn", kicker: "A harder case",
        prompt: "A theorem is proved in the same way. Given: $\\angle A$ and $\\angle B$ are right angles. Prove: $\\angle A \\cong \\angle B$.",
        scene: { type: "walk", how: HOW_2_6, rows: [
          { step: 1, m: "\\angle A \\text{ and } \\angle B \\text{ are right angles}", say: "Given." },
          { step: 2, m: "m\\angle A = 90° \\qquad m\\angle B = 90°", say: "Definition of a right angle." },
          { step: 2, m: "m\\angle A = m\\angle B", say: "Transitive Property of Equality." },
          { step: 3, m: "\\angle A \\cong \\angle B", say: "Definition of congruent angles." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "In a proof, the statement $m\\angle 1 + m\\angle 2 = 180°$ follows “$\\angle 1$ and $\\angle 2$ are supplementary”. What is its reason?",
        options: [{ t: "Definition of supplementary angles" }, { t: "Given", fb: "It was not given. It was worked out from the line before." }, { t: "Linear Pair Theorem", fb: "That theorem tells you a linear pair is supplementary. Here that is already known." }],
        answer: 0, skill: "Two-column proof", hints: ["What does “supplementary” mean?"], why: "Supplementary means the measures add to 180°." },
      { type: "choice", kicker: "Find the error",
        prompt: "A proof contains the line “$\\angle 1 \\cong \\angle 2$. Reason: they look equal in the figure.” What is wrong?",
        options: [{ t: "A figure is not a reason. A statement needs a given fact, a definition, a postulate, a property or a theorem." },
                  { t: "The statement should be $m\\angle 1 = m\\angle 2$.", fb: "Either form is fine. The trouble is the reason." },
                  { t: "Nothing. It is fine.", fb: "Drawings are not always to scale, so how things look proves nothing." }],
        answer: 0, skill: "Two-column proof", hints: ["What counts as a reason?"], why: "Appearance is never a reason in a proof." },
      { type: "choice", kicker: "Use it", prompt: "$\\angle X$ and $\\angle Y$ are each supplementary to $\\angle Z$. Which theorem gives $\\angle X \\cong \\angle Y$ in one step?",
        options: [{ t: "The Congruent Supplements Theorem" }, { t: "The Linear Pair Theorem", fb: "Nothing says they form linear pairs." }, { t: "The Right Angle Congruence Theorem", fb: "Nothing says they are right angles." }],
        answer: 0, skill: "Theorems about angles", hints: ["Both are supplements of the same angle."], why: "Supplements of the same angle are congruent." }
    ]
  });

  /* =============================================== 2-7 · Flowchart and paragraph proofs */
  var HOW_2_7 = [["Boxes", "Read each box: a statement, with its reason written under it."],
                 ["Arrows", "Follow the arrows: a box follows from the boxes that point to it."],
                 ["End", "The last box is the statement proved."]];
  var FLOW_VERT = flow([{ at: [2.6, 3.3], t: "∠1, ∠2: linear pair", r: "Given (figure)" }, { at: [2.6, 1.3], t: "∠2, ∠3: linear pair", r: "Given (figure)" },
    { at: [8.6, 3.3], t: "∠1, ∠2 supplementary", r: "Linear Pair Thm." }, { at: [8.6, 1.3], t: "∠2, ∠3 supplementary", r: "Linear Pair Thm." },
    { at: [14.4, 2.3], t: "∠1 ≅ ∠3", r: "Congruent Suppl. Thm.", w: 4.6 }],
    [[0, 2], [1, 3], [2, 4], [3, 4]], { x: [0, 16.8], y: [0.3, 4.3], u: 34, alt: "A flowchart proof. Two boxes on the left say that angles 1 and 2, and angles 2 and 3, are linear pairs. Each leads to a box saying the pair is supplementary, by the Linear Pair Theorem. Both of those lead to the last box: angle 1 is congruent to angle 3, by the Congruent Supplements Theorem." });
  LESSONS.push({
    title: "Flowchart and paragraph proofs",
    blurb: "Book 2-7 · The same proof in boxes and arrows, and in sentences.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In any proof, what must every statement have?",
        options: [{ t: "A reason" }, { t: "A number", fb: "Numbering helps, but it is not what makes a proof." }, { t: "A figure", fb: "A figure helps you see it. It proves nothing." }],
        answer: 0, skill: "Proof", hints: ["Think of the right-hand column."], why: "A statement without a reason is only a claim." },
      { type: "learn", kicker: "The idea",
        prompt: "A proof can be laid out in different ways. A **flowchart proof** puts each statement in a box, with its reason beneath, and arrows show which statements lead to which. A **paragraph proof** gives the same steps in sentences.",
        scene: { type: "method", how: HOW_2_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "$\\angle 1$ and $\\angle 3$ are vertical angles, with $\\angle 2$ between them. Watch this flowchart proof read.", art: FLOW_VERT,
        scene: { type: "walk", how: HOW_2_7, rows: [
          { step: 1, m: "\\angle 1, \\angle 2 \\qquad \\angle 2, \\angle 3", say: "The two boxes on the left: each pair is a linear pair, as the figure shows." },
          { step: 2, m: "\\text{each pair is supplementary}", say: "One arrow from each box: the Linear Pair Theorem.",
            ask: { prompt: "Which theorem turns “linear pair” into “supplementary”?", answer: 0,
                   options: [{ t: "The Linear Pair Theorem" }, { t: "The Congruent Supplements Theorem", fb: "That one comes next: it needs two supplementary pairs." }] } },
          { step: 2, m: "\\text{two arrows into one box}", say: "The last box needs both facts: $\\angle 1$ and $\\angle 3$ are both supplementary to $\\angle 2$." },
          { step: 3, m: "\\angle 1 \\cong \\angle 3", say: "Congruent Supplements Theorem. This proves the Vertical Angles Theorem." }] },
        gate: true, then: "Vertical angles are congruent: now it is a theorem, not just something you noticed." },
      { type: "guided", kicker: "Together",
        prompt: "$A$, $B$, $C$ and $D$ lie on a line in that order, and $\\overline{AB} \\cong \\overline{CD}$. Now you read the proof that $\\overline{AC} \\cong \\overline{BD}$.",
        art: segRow([["A", 0], ["B", 2], ["C", 4.6], ["D", 6.6]], { ticks: [[0, 1, 1], [2, 3, 1]], alt: "Points A, B, C and D on a segment, with AB and CD marked as equal." }),
        how: HOW_2_7, skill: "Read a proof",
        steps: [
          { step: 1, ask: "The first box says $AB = CD$. What is written under it?", type: "choice", answer: 0,
            options: [{ t: "Given" }, { t: "Segment Addition Postulate", fb: "That comes later. The first box is what you are told." }],
            m: "AB = CD", say: "Given." },
          { step: 2, ask: "The next box adds $BC$ to both sides. Which property is its reason?", type: "choice", answer: 0,
            options: [{ t: "Addition Property of Equality" }, { t: "Reflexive Property of Equality", fb: "Reflexive gives $BC = BC$. Adding it to both sides is the Addition Property." }],
            m: "AB + BC = BC + CD", say: "Addition Property of Equality." },
          { step: 2, ask: "$AB + BC$ is the whole of which segment?", type: "choice", answer: 0,
            options: [{ t: "$\\overline{AC}$" }, { t: "$\\overline{AD}$", fb: "$\\overline{AD}$ would need $CD$ as well." }],
            m: "AC = BD", say: "Segment Addition Postulate, then substitution." },
          { step: 3, ask: "The last box writes that as a congruence. Which one?", type: "choice", answer: 0,
            options: [{ t: "$\\overline{AC} \\cong \\overline{BD}$" }, { t: "$\\overline{AB} \\cong \\overline{BD}$", fb: "The equal lengths are $AC$ and $BD$." }],
            m: "\\overline{AC} \\cong \\overline{BD}", say: "Definition of congruent segments. This is the Common Segments Theorem." }],
        why: "Boxes, arrows, end. Now two on your own." },
      { type: "order", kicker: "On your own", prompt: "A paragraph proof that two congruent angles which are supplementary must both be right angles. Put its sentences in order.",
        items: [nb("It is given that $\\angle 1 \\cong \\angle 2$ and that they are supplementary."), nb("By the definitions, $m\\angle 1 = m\\angle 2$ and $m\\angle 1 + m\\angle 2 = 180°$."), nb("By substitution, $m\\angle 1 + m\\angle 1 = 180°$."), nb("So $m\\angle 1 = 90°$, and $m\\angle 2 = 90°$ as well."), "Both angles are right angles."],
        skill: "Paragraph proof", hints: ["A paragraph proof starts from what is given.", "Each sentence uses the one before it."],
        why: "Given, definitions, substitution, the arithmetic, and the conclusion." },
      { type: "sort", prompt: "Which kind of proof does each description fit?",
        bins: ["Two-column", "Flowchart", "Paragraph"],
        cards: [{ t: "Statements on the left, reasons on the right", bin: 0, fb: "Two columns." }, { t: "Boxes joined by arrows", bin: 1, fb: "A flowchart." },
                { t: "Sentences, with each reason woven in", bin: 2, fb: "A paragraph." }],
        skill: "Kinds of proof", hints: ["Picture each one on the page."],
        why: "Three layouts for the same argument." },
      { type: "learn", kicker: "A harder case",
        prompt: "Any flowchart proof can be rewritten in two columns.",
        scene: { type: "walk", how: [["Order", "Follow the arrows to list the statements in order."], ["Columns", "Write each box's statement on the left and its reason on the right."], ["Check", "Every statement must come after the ones it depends on."]], rows: [
          { step: 1, m: "\\text{given} \\to \\text{theorem} \\to \\text{conclusion}", say: "Read along the arrows, and the flowchart is already in order." },
          { step: 2, m: "\\text{statements} \\qquad \\text{reasons}", say: "Each box splits into two cells: what is claimed, and why." },
          { step: 3, m: "\\text{support first}", say: "Two boxes on the same level can go in either order. A box never goes before the ones that point to it." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "In this flowchart, which box depends on **two** earlier boxes?", art: FLOW_VERT,
        options: [{ t: "$\\angle 1 \\cong \\angle 3$" }, { t: "“$\\angle 1$, $\\angle 2$ supplementary”", fb: "Only one arrow points to it." }, { t: "“$\\angle 1$, $\\angle 2$: linear pair”", fb: "No arrow points to it: it is a starting box." }],
        answer: 0, skill: "Read a proof", hints: ["Count the arrows that point into each box."], why: "Two arrows point into the last box." },
      { type: "choice", kicker: "Find the error",
        prompt: "A paragraph proof says: “$\\angle 1$ and $\\angle 2$ are vertical angles, so they are supplementary.” What is wrong?",
        options: [{ t: "Vertical angles are congruent, not supplementary: the reason does not support the statement." },
                  { t: "A paragraph proof cannot use theorems.", fb: "It can. It just has to use them correctly." },
                  { t: "Nothing. It is right.", fb: "Two vertical angles of 40° add to 80°, not 180°." }],
        answer: 0, skill: "Paragraph proof", hints: ["What does the Vertical Angles Theorem actually say?"], why: "The Vertical Angles Theorem gives congruence." },
      { type: "choice", kicker: "Use it", prompt: "You want a reader to see at a glance how two separate facts combine into one conclusion. Which layout shows that best?",
        options: [{ t: "A flowchart proof" }, { t: "A paragraph proof", fb: "Sentences run in a single line. They cannot show two paths meeting." }],
        answer: 0, skill: "Kinds of proof", hints: ["Which one can draw two arrows into one box?"], why: "Arrows show which facts each statement depends on." }
    ]
  });
  /* ================================================================ Skills */
  // Conditionals, each with its converse, inverse and contrapositive written out in full.
  var CONDS = [
    { s: "If a figure is a square, then it is a rectangle.", cv: "If a figure is a rectangle, then it is a square.", inv: "If a figure is not a square, then it is not a rectangle.", ctr: "If a figure is not a rectangle, then it is not a square." },
    { s: "If two angles are vertical, then they are congruent.", cv: "If two angles are congruent, then they are vertical.", inv: "If two angles are not vertical, then they are not congruent.", ctr: "If two angles are not congruent, then they are not vertical." },
    { s: "If a number is divisible by 10, then it is divisible by 5.", cv: "If a number is divisible by 5, then it is divisible by 10.", inv: "If a number is not divisible by 10, then it is not divisible by 5.", ctr: "If a number is not divisible by 5, then it is not divisible by 10." },
    { s: "If an angle measures 30°, then it is acute.", cv: "If an angle is acute, then it measures 30°.", inv: "If an angle does not measure 30°, then it is not acute.", ctr: "If an angle is not acute, then it does not measure 30°." },
    { s: "If it is snowing, then it is cold.", cv: "If it is cold, then it is snowing.", inv: "If it is not snowing, then it is not cold.", ctr: "If it is not cold, then it is not snowing." },
    { s: "If two angles form a linear pair, then they are supplementary.", cv: "If two angles are supplementary, then they form a linear pair.", inv: "If two angles do not form a linear pair, then they are not supplementary.", ctr: "If two angles are not supplementary, then they do not form a linear pair." },
    { s: "If an animal is a dog, then it is a mammal.", cv: "If an animal is a mammal, then it is a dog.", inv: "If an animal is not a dog, then it is not a mammal.", ctr: "If an animal is not a mammal, then it is not a dog." }];
  // Two conditionals that chain, the facts that match the first one's two parts, and the chain's result and its converse.
  var CHAINS = [
    { c1: "If it rains, then the match is cancelled.", c2: "If the match is cancelled, then the team has the day off.", p: "It rains.", q: "The match is cancelled.", pr: "If it rains, then the team has the day off.", rp: "If the team has the day off, then it rains." },
    { c1: "If a shape is a square, then it is a rectangle.", c2: "If a shape is a rectangle, then it has four right angles.", p: "Shape $S$ is a square.", q: "Shape $S$ is a rectangle.", pr: "If a shape is a square, then it has four right angles.", rp: "If a shape has four right angles, then it is a square." },
    { c1: "If you finish your homework, then you may go out.", c2: "If you may go out, then you can see the film.", p: "You finish your homework.", q: "You may go out.", pr: "If you finish your homework, then you can see the film.", rp: "If you can see the film, then you finish your homework." },
    { c1: "If a number ends in 0, then it is divisible by 10.", c2: "If a number is divisible by 10, then it is divisible by 5.", p: "The number $n$ ends in 0.", q: "The number $n$ is divisible by 10.", pr: "If a number ends in 0, then it is divisible by 5.", rp: "If a number is divisible by 5, then it ends in 0." }];
  var SKILLS = [
    { id: "hg2-pattern", title: "Patterns and counterexamples", lesson: 2,
      gen: function (R) {
        if (R.chance(0.5)) {
          var a = R.int(1, 9), geo = R.chance(0.4), d = geo ? R.pick([2, 3]) : R.int(2, 9), seq = [a];
          for (var i = 1; i < 4; i++) seq.push(geo ? seq[i - 1] * d : seq[i - 1] + d);
          var next = geo ? seq[3] * d : seq[3] + d;
          return { type: "num", prompt: "Find the next number: " + seq.join(", ") + ", …", answer: next,
            near: near(next, [{ v: geo ? seq[3] + (seq[3] - seq[2]) : seq[3] * 2, fb: geo ? "The numbers are multiplied each time, not added to." : "The same number is added each time." }]),
            hints: [geo ? "What is each number multiplied by?" : "What is added each time?"], why: (geo ? "Multiply by " : "Add ") + d + " each time: $" + seq[3] + (geo ? " \\cdot " : " + ") + d + " = " + next + "$." };
        }
        var C = R.pick([
          { c: "Every prime number is odd.", right: "2", wrong: [["9", "9 is odd but not prime, so it says nothing about primes."], ["7", "7 is prime and odd: it agrees."]], why: "2 is prime and even." },
          { c: "The square of a number is always greater than the number.", right: "$\\frac{1}{2}$", wrong: [["$3$", "$3^2 = 9 > 3$: it agrees."], ["$-2$", "$(-2)^2 = 4 > -2$: it agrees."]], why: "$\\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4}$, which is less than $\\frac{1}{2}$." },
          { c: "The sum of two numbers is always greater than each of them.", right: "$5$ and $-2$", wrong: [["$5$ and $2$", "$7$ is greater than both: it agrees."], ["$1$ and $9$", "$10$ is greater than both: it agrees."]], why: "$5 + (-2) = 3$, which is less than 5." },
          { c: "Every number divisible by 3 is divisible by 6.", right: "9", wrong: [["12", "12 is divisible by both: it agrees."], ["10", "10 is not divisible by 3, so it says nothing."]], why: "9 is divisible by 3 but not by 6." },
          { c: "The supplement of an angle is always obtuse.", right: "an angle of 120°", wrong: [["an angle of 30°", "Its supplement is 150°, which is obtuse: it agrees."], ["an angle of 80°", "Its supplement is 100°, which is obtuse: it agrees."]], why: "The supplement of 120° is 60°, which is acute." },
          { c: "Two angles that are supplementary are never congruent.", right: "two angles of 90°", wrong: [["angles of 100° and 80°", "They are supplementary and not congruent: they agree."], ["two angles of 45°", "They are not supplementary, so they say nothing."]], why: "Two 90° angles are supplementary and congruent." }]);
        return mc(R, { prompt: "Which is a counterexample to this conjecture? “" + C.c + "”", right: C.right, wrong: C.wrong.map(function (w) { return { t: w[0], fb: w[1] }; }),
          hints: ["A counterexample fits the “if” part but breaks the claim."], why: C.why });
      } },
    { id: "hg2-conditional", title: "Converse, inverse and contrapositive", lesson: 3,
      gen: function (R) {
        var c = R.pick(CONDS), k = R.int(0, 2), names = ["converse", "inverse", "contrapositive"], forms = [c.cv, c.inv, c.ctr];
        return mc(R, { prompt: "“" + c.s + "” Which is its **" + names[k] + "**?", right: forms[k],
          wrong: [0, 1, 2].filter(function (j) { return j !== k; }).map(function (j) { return { t: forms[j], fb: "That is the " + names[j] + "." }; }),
          hints: ["Converse: swap. Inverse: negate both. Contrapositive: swap and negate."], why: ["The converse swaps the two parts.", "The inverse negates both parts.", "The contrapositive swaps and negates."][k] });
      } },
    { id: "hg2-deductive", title: "Detachment and syllogism", lesson: 4,
      gen: function (R) {
        var c = R.pick(CHAINS), kind = R.int(0, 2), bare = function (t) { return t.replace(/\.$/, ""); };
        if (kind === 0) return mc(R, { prompt: "Given: “" + c.c1 + "” Also given: " + c.p + " What follows?", right: bare(c.q) + ", by the Law of Detachment.",
          wrong: [{ t: "Nothing follows.", fb: "The fact matches the hypothesis, so the conclusion follows." }, { t: bare(c.q) + ", by the Law of Syllogism.", fb: "Syllogism joins two conditionals. Here there is one conditional and one fact." }],
          hints: ["Does the fact match the hypothesis or the conclusion?"], why: "The hypothesis is true, so the conclusion can be detached." });
        if (kind === 1) return mc(R, { prompt: "Given: “" + c.c1 + "” Also given: " + c.q + " What follows?", right: "Nothing follows.",
          wrong: [{ t: bare(c.p) + ", by the Law of Detachment.", fb: "The fact matches the conclusion, not the hypothesis." }, { t: bare(c.p) + ", by the Law of Syllogism.", fb: "Syllogism needs two conditionals. And this fact matches a conclusion." }],
          hints: ["Does the fact match the hypothesis or the conclusion?"], why: "Knowing the conclusion is true says nothing about the hypothesis." });
        return mc(R, { prompt: "Given: “" + c.c1 + "” and “" + c.c2 + "” What follows?", right: c.pr,
          wrong: [{ t: c.rp, fb: "That is the converse. The chain runs from the first hypothesis to the last conclusion." }, { t: "Nothing follows.", fb: "The first conclusion is the second hypothesis, so the two join." }],
          hints: ["The Law of Syllogism: $p \\to q$ and $q \\to r$ give $p \\to r$."], why: "By the Law of Syllogism, the first hypothesis leads to the last conclusion." });
      } },
    { id: "hg2-biconditional", title: "Biconditional statements", lesson: 5,
      gen: function (R) {
        var B = R.pick([
          ["A number is even if and only if it is divisible by 2.", true, "Both directions hold: this is the definition of an even number."],
          ["An angle is a right angle if and only if it measures 90°.", true, "Both directions hold: this is the definition of a right angle."],
          ["A figure is a rectangle if and only if it has four sides.", false, "A kite has four sides and is not a rectangle, so the converse fails."],
          ["A number is divisible by 4 if and only if it is even.", false, "6 is even but not divisible by 4, so the converse fails."],
          ["Two angles are supplementary if and only if their measures add to 180°.", true, "Both directions hold: this is the definition of supplementary angles."],
          ["Two angles are congruent if and only if they are vertical angles.", false, "Two 50° angles in different places are congruent but not vertical."],
          ["A point is the midpoint of a segment if and only if it divides the segment into two congruent segments.", true, "Both directions hold: this is the definition of a midpoint."],
          ["An angle is acute if and only if it measures 45°.", false, "A 30° angle is acute but does not measure 45°."],
          ["A triangle is equilateral if and only if all three of its sides are congruent.", true, "Both directions hold: this is the definition of an equilateral triangle."],
          ["A number is positive if and only if its square is positive.", false, "$(-3)^2 = 9$ is positive, but $-3$ is not: the converse fails."],
          ["Two lines are perpendicular if and only if they meet at right angles.", true, "Both directions hold: this is the definition of perpendicular lines."],
          ["A figure is a square if and only if it has four congruent sides.", false, "A rhombus has four congruent sides and need not be a square."],
          ["$x = 5$ if and only if $2x = 10$.", true, "Each equation leads to the other."],
          ["An angle is obtuse if and only if it measures more than 90°.", false, "A straight angle measures 180°, which is more than 90°, and it is not obtuse."],
          ["A whole number is a multiple of 10 if and only if its last digit is 0.", true, "Both directions hold."]]);
        return mc(R, { prompt: "True or false? “" + B[0] + "”", right: B[1] ? "True" : "False", wrong: [{ t: B[1] ? "False" : "True", fb: B[2] }], keep: true,
          hints: ["Test the conditional, and then test its converse."], why: B[2] });
      } },
    { id: "hg2-property", title: "Name the property", lesson: 6,
      gen: function (R) {
        var a = R.int(2, 9), b = R.int(2, 9), c = R.int(11, 40);
        var P = R.pick([
          ["If $x - " + a + " = " + c + "$, then $x = " + (c + a) + "$.", "Addition Property of Equality"],
          ["If $x + " + a + " = " + c + "$, then $x = " + (c - a) + "$.", "Subtraction Property of Equality"],
          ["If $\\frac{x}{" + a + "} = " + b + "$, then $x = " + a * b + "$.", "Multiplication Property of Equality"],
          ["If $" + a + "x = " + a * b + "$, then $x = " + b + "$.", "Division Property of Equality"],
          ["$m\\angle A = m\\angle A$", "Reflexive Property of Equality"],
          ["If $AB = " + c + "$, then $" + c + " = AB$.", "Symmetric Property of Equality"],
          ["If $AB = CD$ and $CD = " + c + "$, then $AB = " + c + "$.", "Transitive Property of Equality"],
          ["$" + a + "(x + " + b + ") = " + a + "x + " + a * b + "$", "Distributive Property"]]);
        var ALL = ["Addition Property of Equality", "Subtraction Property of Equality", "Multiplication Property of Equality", "Division Property of Equality", "Reflexive Property of Equality", "Symmetric Property of Equality", "Transitive Property of Equality", "Distributive Property"];
        return mc(R, { prompt: "Which property justifies this? " + P[0], right: P[1],
          wrong: R.shuffle(ALL.filter(function (t) { return t !== P[1]; })).slice(0, 3).map(function (t) { return { t: t, fb: "Look at what was done: " + { Addition: "something was added to both sides.", Subtraction: "something was subtracted from both sides.", Multiplication: "both sides were multiplied.", Division: "both sides were divided.", Reflexive: "a quantity is set equal to itself.", Symmetric: "the two sides changed places.", Transitive: "two equations were chained through a shared side.", Distributive: "parentheses were removed." }[P[1].split(" ")[0]] }; }),
          hints: ["Say in words what changed between the “if” and the “then”."], why: P[1] + "." });
      } },
    { id: "hg2-reason", title: "Give the reason for a step", lesson: 7,
      gen: function (R) {
        var S = R.pick([
          ["$\\angle 1$ and $\\angle 2$ are supplementary.", "$m\\angle 1 + m\\angle 2 = 180°$", "Definition of supplementary angles"],
          ["$\\angle 1$ and $\\angle 2$ form a linear pair.", "$\\angle 1$ and $\\angle 2$ are supplementary.", "Linear Pair Theorem"],
          ["$M$ is the midpoint of $\\overline{AB}$.", "$\\overline{AM} \\cong \\overline{MB}$", "Definition of midpoint"],
          ["$\\overrightarrow{BD}$ bisects $\\angle ABC$.", "$\\angle ABD \\cong \\angle DBC$", "Definition of angle bisector"],
          ["$\\angle A$ and $\\angle B$ are right angles.", "$\\angle A \\cong \\angle B$", "Right Angle Congruence Theorem"],
          ["$\\angle 1$ and $\\angle 2$ are both supplementary to $\\angle 3$.", "$\\angle 1 \\cong \\angle 2$", "Congruent Supplements Theorem"],
          ["$m\\angle 1 = m\\angle 2$", "$\\angle 1 \\cong \\angle 2$", "Definition of congruent angles"],
          ["$B$ is between $A$ and $C$.", "$AB + BC = AC$", "Segment Addition Postulate"]]);
        var ALL = ["Definition of supplementary angles", "Linear Pair Theorem", "Definition of midpoint", "Definition of angle bisector", "Right Angle Congruence Theorem", "Congruent Supplements Theorem", "Definition of congruent angles", "Segment Addition Postulate"];
        return mc(R, { prompt: "In a proof, “" + S[0] + "” is followed by the statement " + S[1] + ". What is the reason for that statement?", right: S[2],
          wrong: R.shuffle(ALL.filter(function (t) { return t !== S[2]; })).slice(0, 3).map(function (t) { return { t: t, fb: "That one does not turn the first statement into the second." }; }),
          hints: ["Which definition, postulate or theorem takes you from the first statement to the second?"], why: S[2] + "." });
      } },
    { id: "hg2-theorem", title: "Use the angle theorems", lesson: 8,
      gen: function (R) {
        var a = R.int(25, 155), kind = R.int(0, 2);
        if (kind === 0) return { type: "num", prompt: "$\\angle 1$ and $\\angle 2$ form a linear pair, and $m\\angle 1 = " + a + "°$. Find $m\\angle 2$.", post: "°", answer: 180 - a,
          near: near(180 - a, [{ v: a, fb: "A linear pair is supplementary. The angles are equal only when each is 90°." }]), hints: ["Linear Pair Theorem: the measures add to 180°."], why: "$180 - " + a + " = " + (180 - a) + "$." };
        if (kind === 1) return { type: "num", prompt: "$\\angle 1$ and $\\angle 3$ are vertical angles, and $m\\angle 1 = " + a + "°$. Find $m\\angle 3$.", post: "°", answer: a,
          near: near(a, [{ v: 180 - a, fb: "That is the angle beside it. Vertical angles are congruent." }]), hints: ["Vertical Angles Theorem."], why: "Vertical angles are congruent: $" + a + "°$." };
        return { type: "num", prompt: "$\\angle A$ and $\\angle B$ are both supplementary to $\\angle C$, and $m\\angle A = " + a + "°$. Find $m\\angle B$.", post: "°", answer: a,
          near: near(a, [{ v: 180 - a, fb: "That is $m\\angle C$. Supplements of the same angle are congruent to each other." }]), hints: ["Congruent Supplements Theorem."], why: "Supplements of the same angle are congruent: $" + a + "°$." };
      } }
  ];
  L.unit("geo", 2, {
    title: "Geometric Reasoning",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Patterns and counterexamples, conditional statements, and deductive reasoning.",
        skills: ["hg2-pattern", "hg2-conditional", "hg2-deductive"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Biconditionals, and the properties used in algebraic proof.",
        skills: ["hg2-biconditional", "hg2-property"], per: 3 },
      { title: "Quiz 3", after: 8, blurb: "Reasons in a proof, and the angle theorems.",
        skills: ["hg2-reason", "hg2-theorem"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:2", {
    2: { name: "Inductive reasoning", frame: "[[Inductive]] reasoning goes from examples to a rule. The rule is a [[conjecture]]. Examples can support it, but one [[counterexample]] proves it false.",
         chips: ["Deductive", "theorem"] },
    3: { name: "Conditional statements", frame: "In “if $p$, then $q$”, $p$ is the [[hypothesis]] and $q$ the [[conclusion]]. The [[converse]] swaps them. The [[contrapositive]] swaps and negates, and always has the same truth value as the conditional.",
         chips: ["inverse", "definition"] },
    4: { name: "Deductive reasoning", frame: "[[Deductive]] reasoning draws conclusions from facts and rules. The Law of [[Detachment]]: $p \\to q$ and $p$ give $q$. The Law of [[Syllogism]]: $p \\to q$ and $q \\to r$ give $p \\to r$.",
         chips: ["Inductive", "Converse"] },
    5: { name: "Biconditionals", frame: "“$p$ if and only if $q$” is true when the conditional and its [[converse]] are [[both]] true. Every good [[definition]] can be written this way.",
         chips: ["inverse", "either"] },
    6: { name: "Algebraic proof", frame: "In a proof every statement has a [[reason]]. The [[Reflexive]] Property says a quantity equals itself, the [[Symmetric]] Property swaps the two sides, and the [[Transitive]] Property links a chain.",
         chips: ["figure", "Distributive"] },
    7: { name: "Two-column proof", frame: "A [[theorem]] is a statement that has been proved. A two-column proof lists [[statements]] on the left and [[reasons]] on the right, from the given facts to what was to be proved.",
         chips: ["postulate", "figures"] },
    8: { name: "Flowchart and paragraph proofs", frame: "A [[flowchart]] proof puts statements in boxes joined by [[arrows]]. A [[paragraph]] proof gives the same steps in sentences. The Vertical Angles Theorem says vertical angles are [[congruent]].",
         chips: ["two-column", "supplementary"] }
  });
})();
