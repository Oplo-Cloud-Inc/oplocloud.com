/* ==========================================================================
   Geometry — Unit 2: Reasoning and Proof. See lab/core.js for the format and
   lab/geotools.js for the drawing kit.

   Follows CK-12 Geometry (CK-12 Foundation, CC BY-SA), Chapter 2, section
   for section (2.1 to 2.8), after a readiness check. The sentences,
   examples, figures and questions are OEdu's own; the order and the ideas are
   the book's. A short lab on logic puzzles sits after deductive reasoning.

   Inductive reasoning (2.1), conditional statements and the biconditional
   (2.2), deductive reasoning (2.3), algebraic properties (2.4), diagrams
   (2.5), two-column proofs (2.6), segment and angle congruence theorems
   (2.7), and proofs about angle pairs (2.8). In a worked proof each line is
   a statement, and the words beside it are its reason. Most lessons open on
   something to do with your hands before anything is named (kicker "Explore").

   Lessons carry v: 5, so a record kept from the Holt-based Unit 2 (v 4) does
   not mark these done. Skills are hg2-…

   Nine lessons and a lab, nine skills, three quizzes, and the unit test.
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
    blurb: "Before Chapter 2 · Angle pairs, solving equations, and number patterns.",
    mins: 6, v: 5,
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
  /* ============================================== 2.1 · Inductive reasoning */
  var HOW_2_1 = [["Look", "Look at several cases, and find what stays the same or how it changes."],
                 ["Conjecture", "State the pattern as a general rule you believe is true."],
                 ["Test", "Test more cases. One case that breaks the rule, a counterexample, proves it false."]];
  // Points round a circle, placed so that no three chords meet at one point: n points make 1 + C(n,2) + C(n,4) regions.
  var ANG21 = [10, 62, 119, 171, 223, 281, 332];
  function regions21(n) { var c2 = n * (n - 1) / 2, c4 = n < 4 ? 0 : n * (n - 1) * (n - 2) * (n - 3) / 24; return 1 + c2 + c4; }
  LESSONS.push({
    title: "Inductive reasoning", art: "ind",
    blurb: "Section 2.1 · Visual and number patterns, conjectures, and disproving one with a counterexample.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the next number: 3, 7, 11, 15, …", answer: 19, skill: "Patterns",
        near: [{ v: 18, fb: "Each number is 4 more than the last." }], hints: ["What is added each time?"], why: "Add 4 each time: $15 + 4 = 19$." },
      { type: "learn", kicker: "Explore", prompt: "Step through the figures. How many squares are added each time?",
        scene: { type: "pattern", a: 3, d: 2, n: 1, max: 6, gate: true, gateN: 5 }, gate: true,
        after: "Each figure has 2 more squares than the last. A rule you believe from examples like these is a conjecture." },
      { type: "learn", kicker: "Explore",
        prompt: "Put $n$ points on a circle and join **every** pair. How many regions does the circle split into? Slide $n$ up, and predict before you look.",
        scene: { type: "sketch", x: [-3.3, 3.3], y: [-3.0, 3.0], u: 46, grid: false, gate: true,
          params: { n: { min: 1, max: 7, step: 1, v: 3, label: "points $n$" } },
          track: function (s) { return "n" + s.p.n; },
          draw: function (s) {
            var O = [0, 0], n = s.p.n, P = ANG21.slice(0, n).map(function (a) { return GT.polar(O, 2.5, a); }), items = [{ circle: [O, 2.5], c: "blue" }], i, j;
            for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) items.push({ seg: [P[i], P[j]], c: "purple" });
            P.forEach(function (p) { items.push({ pt: p, c: "orange" }); });
            return items;
          },
          readout: function (s) {
            var rows = "", ks = Object.keys(s.tracked).map(function (k) { return +k.slice(1); }).sort(function (a, b) { return a - b; });
            ks.forEach(function (k) { var r = regions21(k), g = Math.pow(2, k - 1); rows += "<tr" + (r === g ? ' class="ok"' : "") + "><td>$" + k + "$</td><td>$" + r + "$</td><td>$" + g + "$</td></tr>"; });
            return "$n = " + s.p.n + "$ points: **" + regions21(s.p.n) + " regions**" +
              '<div class="gt-log"><table><thead><tr><th>$n$</th><th>regions</th><th>doubling guess</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
          },
          goal: function (s) { return !!s.tracked.n6; } },
        then: "Up to $n = 5$ the regions double: 1, 2, 4, 8, 16. Then $n = 6$ gives **31**, not 32. One counterexample breaks a conjecture, however many cases agree." },
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
  /* ============================================ 2.2 · Conditional statements */
  var HOW_2_2 = [["Parts", "Find the hypothesis (after “if”) and the conclusion (after “then”)."],
                 ["Rearrange", "Converse: swap them. Inverse: negate both. Contrapositive: swap and negate."],
                 ["Truth", "Decide whether each statement is true. One counterexample makes it false."]];
  // The dogs-and-mammals picture: where each animal has been dropped, and whether that is the right place.
  function venn22(s) {
    var inP = function (t) { return GT.dist(t, [-0.5, 0.1]) < 1.25; }, inQ = function (t) { return GT.dist(t, [0.4, 0.2]) < 2.5; };
    return { Pood: inP(s.Pood), Cat: inQ(s.Cat) && !inP(s.Cat), Trout: !inQ(s.Trout) };
  }
  var FORMS22 = {
    orig: { s: "If a number is divisible by 6, then it is divisible by 3.", t: true, why: "Every multiple of 6 is also a multiple of 3.", b: [{ t: "p", c: "blue" }, { t: "q", c: "green" }] },
    conv: { s: "If a number is divisible by 3, then it is divisible by 6.", t: false, why: "Counterexample: 9 is divisible by 3 but not by 6.", b: [{ t: "q", c: "green" }, { t: "p", c: "blue" }] },
    inv: { s: "If a number is not divisible by 6, then it is not divisible by 3.", t: false, why: "Counterexample: 9 is not divisible by 6 but is divisible by 3.", b: [{ t: "not p", c: "blue" }, { t: "not q", c: "green" }] },
    ctr: { s: "If a number is not divisible by 3, then it is not divisible by 6.", t: true, why: "A number that is not a multiple of 3 cannot be a multiple of 6.", b: [{ t: "not q", c: "green" }, { t: "not p", c: "blue" }] }
  };
  LESSONS.push({
    title: "Conditional statements", art: "cond",
    blurb: "Section 2.2 · If-then statements, hypothesis and conclusion, the converse, inverse and contrapositive, and the biconditional.",
    mins: 15, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In “If it is raining, then the ground is wet”, which part is the condition?",
        options: [{ t: "it is raining" }, { t: "the ground is wet", fb: "That is what follows from the condition." }],
        answer: 0, skill: "Hypothesis and conclusion", hints: ["It comes after “if”."], why: "The “if” part is the condition: the hypothesis." },
      { type: "learn", kicker: "Explore",
        prompt: "“If an animal is a **dog**, then it is a **mammal**.” Drag each animal to where it belongs in the picture.",
        scene: { type: "sketch", x: [-4.4, 4.4], y: [-3.1, 3.3], u: 48, grid: false, gate: true,
          pts: { Pood: { at: [-3.6, 2.4], drag: true, snap: 0.1, c: "orange", say: "poodle" }, Cat: { at: [3.6, 2.4], drag: true, snap: 0.1, c: "orange", say: "cat" }, Trout: { at: [-0.5, -0.2], drag: true, snap: 0.1, c: "orange", say: "trout" } },
          draw: function (s) {
            var ok = venn22(s), items = [{ ell: [[0.4, 0.2], 2.6, 2.6], fill: true, c: "blue" }, { ell: [[-0.5, 0.1], 1.35, 1.35], fill: true, c: "green" },
              { word: "mammals", at: [1.5, 1.85], c: "blue" }, { word: "dogs", at: [-0.5, 0.75], c: "green" }];
            [["Pood", "poodle"], ["Cat", "cat"], ["Trout", "trout"]].forEach(function (t) { items.push({ word: t[1], at: [s[t[0]][0], s[t[0]][1] + 0.55], c: ok[t[0]] ? "green" : "ink" }); });
            return items;
          },
          readout: function (s) {
            var ok = venn22(s), n = (ok.Pood ? 1 : 0) + (ok.Cat ? 1 : 0) + (ok.Trout ? 1 : 0);
            return n === 3 ? "Every dog sits **inside** the mammals circle. So the conditional is true, and the hypothesis circle fits inside the conclusion circle."
              : "In the right place: " + n + " of 3. A poodle is a dog; a cat is a mammal but not a dog; a trout is neither.";
          },
          goal: function (s) { var ok = venn22(s); return ok.Pood && ok.Cat && ok.Trout; } },
        then: "“If $p$, then $q$” is true when everything in the **hypothesis** circle is also in the **conclusion** circle. That is why the conditional goes one way only: not every mammal is a dog." },
      { type: "learn", kicker: "Explore",
        prompt: "“If it is raining, then the ground is wet.” Switch $p$ and $q$. When is the promise **broken**?",
        scene: { type: "ttable", gate: true, mode: "explore",
          vars: [{ id: "p", say: "It is raining." }, { id: "q", say: "The ground is wet." }],
          cols: [{ h: "p \\to q", f: function (v) { return !v.p || v.q; } }],
          say: function (v) { var t = !v.p || v.q; return (v.p ? "It is raining" : "It is not raining") + ", and the ground is " + (v.q ? "wet" : "dry") + ": the statement is <b class='" + (t ? "t" : "f") + "'>" + (t ? "true" : "false") + "</b>."; } },
        then: "A conditional is **false in exactly one case**: the hypothesis is true and the conclusion is false. If it is not raining, the promise is never tested, so it counts as true." },
      { type: "learn", kicker: "Explore",
        prompt: "Press each button to rearrange “If a number is divisible by 6, then it is divisible by 3.” Which versions are true?",
        scene: { type: "sketch", x: [-4.4, 4.4], y: [-0.4, 3.2], u: 48, grid: false, gate: true,
          chips: { form: { v: "orig", opts: [["orig", "Original"], ["conv", "Converse"], ["inv", "Inverse"], ["ctr", "Contrapositive"]] } },
          draw: function (s) {
            var f = FORMS22[s.c.form], items = [], xs = [-2.2, 2.2];
            [0, 1].forEach(function (i) {
              var x = xs[i], b = f.b[i];
              items.push({ path: [[x - 1.15, 1.0], [x + 1.15, 1.0], [x + 1.15, 2.2], [x - 1.15, 2.2]], closed: true, fill: true, c: b.c }, { word: b.t, at: [x, 1.6], name: true, c: "ink" });
            });
            items.push({ arrow: [[-0.95, 1.6], [0.95, 1.6]], c: "ink" });
            return items;
          },
          readout: function (s) {
            var f = FORMS22[s.c.form];
            return "“" + f.s + "”<br><b class='" + (f.t ? "t" : "f") + "'>" + (f.t ? "True" : "False") + "</b> · " + f.why + "<br><span class='gt-dim'>Tried " + Object.keys(s.seen.form).length + " of 4</span>";
          },
          goal: function (s) { return Object.keys(s.seen.form).length >= 4; } },
        then: "The original and its **contrapositive** are true together. The **converse** and the **inverse** are true together too: here both are false, and 9 is the counterexample." },
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
        prompt: "Sometimes the converse is true as well. Watch “An angle is a right angle if and only if it measures 90°” taken apart.",
        scene: { type: "walk", how: [["Split", "A biconditional hides two conditionals: $p \\to q$ and its converse $q \\to p$."], ["Test", "Decide whether each one is true."], ["Say", "A biconditional is true only when both are true."]], rows: [
          { step: 1, m: "p \\to q", say: "If an angle is a right angle, then it measures 90°: that is the definition.",
            ask: { prompt: "How many conditionals are hidden in “if and only if”?", answer: 0, options: [{ t: "Two: one each way" }, { t: "One", fb: "“Only if” adds the converse: the statement runs both ways." }] } },
          { step: 1, m: "q \\to p", say: "If an angle measures 90°, then it is a right angle." },
          { step: 2, m: "p \\to q \\text{ true} \\qquad q \\to p \\text{ true}", say: "No counterexample to either one." },
          { step: 3, m: "p \\leftrightarrow q", say: "Both ways are true, so the biconditional is true. It is written with a double arrow." }] },
        gate: true, then: "A good **definition** is always a biconditional: it works both ways." },
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
  /* =============================================== 2.3 · Deductive reasoning */
  var HOW_2_3 = [["Facts", "List what is given: the true conditional, and the true fact."],
                 ["Law", "Detachment: $p \\to q$ and $p$ give $q$. Syllogism: $p \\to q$ and $q \\to r$ give $p \\to r$."],
                 ["Conclude", "State the conclusion, or say that none follows."]];
  // The squares, rectangles and quadrilaterals picture: where F sits, and what follows.
  function where23(F) {
    var inSq = GT.dist(F, [0, -0.5]) < 0.9, inRect = GT.dist(F, [0, -0.1]) < 1.85, inQuad = GT.dist(F, [0, 0.2]) < 2.7;
    if (inSq) return { k: "sq", say: "$F$ is a **square**. Then it is a rectangle (Law of Detachment), and a quadrilateral (Law of Syllogism)." };
    if (inRect) return { k: "rect", say: "$F$ is a **rectangle**. Then it is a quadrilateral. But nothing says it is a square." };
    if (inQuad) return { k: "quad", say: "$F$ is a **quadrilateral**. Nothing more follows: it may or may not be a rectangle." };
    return { k: "out", say: "$F$ is **not** a quadrilateral. So it cannot be a rectangle or a square either." };
  }
  LESSONS.push({
    title: "Deductive reasoning", art: "ded",
    blurb: "Section 2.3 · Drawing conclusions with the Law of Detachment and the Law of Syllogism, and how it differs from inductive reasoning.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which kind of reasoning argues from facts and rules instead of from examples?",
        options: [{ t: "Deductive reasoning" }, { t: "Inductive reasoning", fb: "Inductive reasoning goes from examples to a conjecture." }],
        answer: 0, skill: "Kinds of reasoning", hints: ["Lesson 2-1 used examples."], why: "Deductive reasoning works from what is known to be true." },
      { type: "learn", kicker: "Explore",
        prompt: "“Every square is a rectangle. Every rectangle is a quadrilateral.” Drag the figure $F$ around the picture. What can you **conclude** about it?",
        scene: { type: "sketch", x: [-4.4, 4.4], y: [-3.1, 3.3], u: 48, grid: false, gate: true,
          pts: { F: { at: [3.6, -2.4], drag: true, snap: 0.1, c: "orange", say: "The figure F" } },
          track: function (s) { return where23(s.F).k; },
          draw: function (s) {
            return [{ ell: [[0, 0.2], 2.8, 2.8], fill: true, c: "blue" }, { ell: [[0, -0.1], 1.95, 1.95], fill: true, c: "purple" }, { ell: [[0, -0.5], 1.0, 1.0], fill: true, c: "green" },
              { word: "quadrilaterals", at: [0, 2.4], c: "blue" }, { word: "rectangles", at: [0, 1.4], c: "purple" }, { word: "squares", at: [0, -0.5], c: "green" }, { word: "F", at: [s.F[0], s.F[1] + 0.5], eq: true, c: "ink" }];
          },
          readout: function (s) {
            return where23(s.F).say + "<br>" + found([["sq", "Square"], ["rect", "Rectangle only"], ["quad", "Quadrilateral only"], ["out", "Neither"]], s.tracked);
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        then: "Where $F$ sits is the **fact**. The circles are the **conditionals**. A fact that matches a hypothesis lets you conclude; a fact that only matches a conclusion tells you nothing new about the hypothesis." },
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
  /* ================================================== Lab · Logic puzzles */
  LESSONS.push({
    title: "Logic puzzles", tag: "Lab", art: "ded",
    blurb: "Hands-on with deduction: a grid puzzle, then a river to cross. Every clue is a fact, and every step is a conclusion.",
    mins: 12, v: 5,
    steps: [
      { type: "learn", kicker: "The puzzle",
        prompt: "A **logic puzzle** is deductive reasoning in disguise. Each clue is a fact. You **cannot** guess, and you cannot use a hunch: every ✓ or × you place must follow from the clues. Press a box once for ×, twice for ✓, three times to clear it. Press a clue when you have used it.",
        after: "Nothing here is timed. A box you are not sure about can stay empty." },
      { type: "lgrid", kicker: "Puzzle 1", prompt: "Four friends each play a **different** instrument. Who plays what?",
        rows: ["Mei", "Noor", "Omar", "Pia"], cols: ["Cello", "Drums", "Flute", "Harp"], answer: [1, 2, 3, 0],
        clues: ["Neither Mei nor Noor plays a string instrument (the cello or the harp).", "Mei does not play the flute.", "Pia does not play the harp."],
        skill: "Logic grids", hints: ["Clue 1 puts Mei and Noor on the drums and the flute, in some order. So Omar and Pia have the two string instruments.", "Clue 2 tells you which of Mei and Noor has the drums."],
        why: "Clue 1: Mei and Noor have drums and flute. Clue 2: Mei has the drums, so Noor has the flute. Clue 3: Pia has the cello, so Omar has the harp." },
      { type: "choice", prompt: "Once you place a ✓ in a box, why can you put a × in **every other box** in its row and its column?",
        options: [{ t: "Each friend plays exactly one instrument, and each instrument belongs to exactly one friend" }, { t: "The clues say so", fb: "The clues do not say it. It comes from the way the puzzle is set up." }, { t: "To make the grid look tidy", fb: "It is a deduction, not decoration." }],
        answer: 0, skill: "Logic grids", hints: ["What would it mean to have two ✓ in the same row?"], why: "Two ✓ in one row would give one friend two instruments; two in a column would give one instrument two players." },
      { type: "lgrid", kicker: "Puzzle 2", prompt: "Four students each join a **different** club. Who joins which?",
        rows: ["Jo", "Kit", "Lee", "Max"], cols: ["Art", "Chess", "Choir", "Robotics"], answer: [1, 0, 3, 2],
        clues: ["Jo is not in Art, Choir or Robotics.", "Kit is in neither Robotics nor Choir.", "Max is not in Robotics."],
        skill: "Logic grids", hints: ["Clue 1 leaves one club for Jo.", "Once Jo has Chess, Kit's two choices become one."],
        why: "Jo has Chess. Kit is left with Art. Max is not in Robotics, so Max has Choir, and Lee has Robotics." },
      { type: "learn", kicker: "A puzzle with a map",
        prompt: "A farmer must take a **wolf**, a **goat** and a **cabbage** across a river in a boat that holds him and **one** of them. Left alone, the wolf eats the goat, and the goat eats the cabbage. Press a thing to take it across. Every place you reach is drawn in the network.",
        scene: { type: "crossing", gate: true }, gate: true,
        then: "Each vertex is one arrangement, written as the ordered pair (near bank, far bank). Each crossing is an edge. The dead ends are the arrangements where something gets eaten." },
      { type: "num", prompt: "Press “Show the whole network”. What is the **fewest** number of crossings that gets everyone across?",
        scene: { type: "crossing" }, answer: 7, skill: "Logic grids",
        near: [{ v: 6, fb: "Count the edges on a shortest path from the start to the finish, not the vertices." }, { v: 8, fb: "That is a path with a detour. Look for a shorter one." }],
        hints: ["Trace one of the two blue paths from the first vertex to the last."], why: "The shortest ways across take 7 crossings. There are two of them, one going the other way round the middle." },
      { type: "choice", prompt: "What is the advantage of drawing the **whole** network, instead of finding just one way across?",
        options: [{ t: "You can see every solution, and every dead end, at once" }, { t: "It is quicker to draw", fb: "Drawing the whole network takes longer." }, { t: "It makes the puzzle harder", fb: "It makes the structure of the puzzle visible." }],
        answer: 0, skill: "Logic grids", hints: ["Think about how many routes the network shows."], why: "The network shows all the routes, so you can compare them and see which ones are shortest." }
    ]
  });
  /* ============================================== 2.4 · Algebraic properties */
  var HOW_2_5 = [["Given", "Write the given equation as the first statement."],
                 ["Steps", "Change one thing at a time, and name the property that allows it."],
                 ["Prove", "Stop when you reach the statement to be proved."]];
  LESSONS.push({
    title: "Algebraic properties", art: "alg",
    blurb: "Section 2.4 · The properties of equality as reasons, and the same properties for congruence.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $3x - 4 = 11$.", pre: "$x =$", answer: 5, skill: "Solve an equation",
        near: [{ v: 7 / 3, tol: 1e-6, fb: "Add 4 to both sides first: $3x = 15$." }], hints: ["$3x = 15$."], why: "$3x = 15$, so $x = 5$." },
      { type: "learn", kicker: "Explore",
        prompt: "The scale is balanced: $2x + 3 = 9$. Do the **same thing to both sides** to get $x$ alone. Then try taking something from one side only.",
        scene: { type: "balance", L: { x: 2, c: 3 }, R: { x: 0, c: 9 }, x: 3, gate: "solve" }, gate: true,
        then: "Every move you made to **both** sides was a property of equality: the Subtraction Property (take the same from each side), then the Division Property (divide each side by the same number). Each is a reason you can write in a proof." },
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
  /* ======================================================== 2.5 · Diagrams */
  var HOW_2_5D = [["Read", "Read what the drawing **tells** you: points on lines, tick marks, arcs, little squares, and the given facts."],
                  ["Ignore", "Ignore what it only **looks** like: sizes, angle measures, parallel or perpendicular lines."],
                  ["Mark", "Add every given fact to the drawing, and use only those."]];
  var FIG_D25 = tri([[0, 0], [6, 0], [3, 3.6]], { names: "ABC", ticks: [0, 1, 1] }, "Triangle ABC. The sides BC and CA carry one tick mark each, so they are marked as congruent.");
  var FIG_D25B = shapes([[[[0, 0], [5, 0], [5, 3], [0, 3]], { names: "ABCD", right: [0] }]], { extra: [{ seg: [[0, 0], [5, 3]], c: "orange", dash: true }, { pt: [2.5, 1.5], name: "E", at: "n" }], alt: "Rectangle ABCD with a square marking the right angle at A, and a dashed diagonal from A to C with a point E on it." });
  LESSONS.push({
    title: "Diagrams", art: "diag",
    blurb: "Section 2.5 · Drawing the diagram for a problem, reading the marks, and what you may and may not assume.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In a diagram, what tells you that two sides are **congruent**?",
        options: [{ t: "Matching tick marks on the two sides" }, { t: "They look the same length", fb: "Drawings are not always to scale. Looks tell you nothing." }, { t: "They are drawn next to each other", fb: "Where they sit does not say how long they are." }],
        answer: 0, skill: "Read a diagram", hints: ["Think of the little marks across a side."], why: "Matching tick marks are the drawing's way of saying “congruent”." },
      { type: "learn", kicker: "Explore",
        prompt: "Do **not** trust your eyes. Turn the ray until the angle **looks** like a right angle. Then read the measure.",
        scene: { type: "sketch", x: [-3.7, 3.7], y: [-0.7, 3.5], u: 56, grid: false, gate: true,
          pts: { P: { at: GT.polar([0, 0], 2.7, 62), drag: true, c: "orange", on: { circle: [[0, 0], 2.7], snapDeg: 1, range: [30, 150] }, say: "The turning ray" } },
          track: function (s) { var a = Math.round(GT.dir([0, 0], s.P)); return a === 90 ? "exact" : Math.abs(a - 90) <= 6 ? "near" : null; },
          draw: function (s) {
            var O = [0, 0], a = Math.round(GT.dir(O, s.P));
            return [{ angle: [[1, 0], O, GT.polar(O, 1, a)], say: a + "°", r: 40, right: a === 90, c: a === 90 ? "green" : "orange" }, { dline: [O, [3.3, 0]], ray: true }, { dline: [O, GT.polar(O, 3.3, a)], ray: true, c: "orange" },
              { pt: O, name: "B", at: "s" }, { pt: [2.6, 0], name: "A", at: "s" }, { pt: GT.polar(O, 2.6, a), name: "C", at: "n" }];
          },
          readout: function (s) {
            var a = Math.round(GT.dir([0, 0], s.P));
            return (a === 90 ? "$m\\angle ABC = 90°$ exactly. But only a **little square**, or a given, would let you say so in a proof." :
              Math.abs(a - 90) <= 6 ? "$m\\angle ABC = " + a + "°$. It **looks** like a right angle, and it is not." : "$m\\angle ABC = " + a + "°$.") + "<br>" + found([["near", "Looks right but isn't"], ["exact", "Exactly 90°"]], s.tracked);
          },
          goal: function (s) { return s.tracked.near && s.tracked.exact; } },
        then: "A drawing can look like 90° and be 88°. In geometry you use only what is **marked** (a small square, tick marks, arcs) or **given**, never how a figure looks." },
      { type: "learn", kicker: "The idea",
        prompt: "A diagram helps you think, but it is **not to scale**. You may assume that points drawn on a line are on it. You may **not** assume sizes, right angles or parallel lines unless they are marked or given.",
        scene: { type: "method", how: HOW_2_5D } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch what can and cannot be taken from this diagram.",
        scene: { type: "walk", how: HOW_2_5D, rows: [
          { step: 1, m: "\\overline{BC} \\cong \\overline{CA}", say: "One tick mark on $\\overline{BC}$ and one on $\\overline{CA}$: they are marked as congruent.", fig: FIG_D25 },
          { step: 2, m: "AB \\text{ looks longer}", say: "It **looks** longer than the other two sides. That is not a fact: ignore it.",
            ask: { prompt: "Does $AB$ being drawn longer tell you anything?", answer: 0, options: [{ t: "No: only marks and givens count" }, { t: "Yes: it is longer", fb: "Drawings are not to scale, so how long a side looks proves nothing." }] } },
          { step: 2, m: "\\angle C \\text{ looks like } 90°?", say: "No square marks it, and nothing is given. Ignore it too." },
          { step: 3, m: "\\overline{BC} \\cong \\overline{CA}", say: "The one fact to carry into a proof: two congruent sides." }] },
        gate: true, then: "The marks said one thing. Everything else was just the way it was drawn." },
      { type: "guided", kicker: "Together",
        prompt: "Rectangle $ABCD$ has a diagonal from $A$ to $C$, with $E$ on it. Now you decide what the diagram lets you say.", art: FIG_D25B,
        how: HOW_2_5D, skill: "Read a diagram",
        steps: [
          { step: 1, ask: "The little square at $A$ means…", type: "choice", answer: 0,
            options: [{ t: "$\\angle DAB$ is a right angle" }, { t: "$A$ is the longest corner", fb: "A square marks a right angle, nothing about size." }],
            m: "m\\angle DAB = 90°", say: "A little square is the mark for a right angle." },
          { step: 2, ask: "$E$ looks like the middle of the diagonal. Can you say $AE = EC$?", type: "choice", answer: 0,
            options: [{ t: "No: nothing marks or gives it" }, { t: "Yes: it looks like the midpoint", fb: "Looking like a midpoint is not enough. It would need tick marks or a given." }],
            m: "AE = EC \\text{ ?}", say: "Not marked, so not allowed." },
          { step: 3, ask: "$E$ is drawn on the diagonal. Can you say $A$, $E$ and $C$ are collinear?", type: "choice", answer: 0,
            options: [{ t: "Yes: a point drawn on a line is on it" }, { t: "No", fb: "Points drawn on a line are on it: that part of a diagram you may trust." }],
            m: "A, E, C \\text{ collinear}", say: "Points on a drawn line are on the line." }],
        why: "Read, ignore, mark. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Looking at a diagram, can you **assume** each statement, or not?",
        bins: ["You may assume it", "You may not"],
        cards: [{ t: "Three points drawn on one line are collinear", bin: 0, fb: "Points on a drawn line are on it." }, { t: "Two sides with matching ticks are congruent", bin: 0, fb: "Tick marks are marked facts." },
                { t: "An angle that looks like 90° is a right angle", bin: 1, fb: "It needs a little square or a given." }, { t: "Two lines that look parallel are parallel", bin: 1, fb: "They need arrowheads or a given." },
                { t: "A point that looks like the midpoint is the midpoint", bin: 1, fb: "It needs tick marks or a given." }, { t: "Two lines that cross meet at one point", bin: 0, fb: "Two distinct lines meet in at most one point." }],
        skill: "Read a diagram", hints: ["Is it a mark or a given, or only how it looks?"], why: "Marks and givens count. Looks do not." },
      { type: "choice", prompt: "Which postulate says: “If two distinct lines intersect, then they meet in exactly one point”?",
        options: [{ t: "The Intersecting Lines Postulate" }, { t: "The Ruler Postulate", fb: "That one is about measuring distances." }, { t: "The Segment Addition Postulate", fb: "That one adds parts of a segment." }],
        answer: 0, skill: "Basic postulates", hints: ["It is named for what it is about."], why: "Two crossing lines share exactly one point." },
      { type: "learn", kicker: "A harder case",
        prompt: "Turning words into a diagram. “$M$ is the midpoint of $\\overline{AB}$, and $N$ is the midpoint of $\\overline{BC}$, where $B$ is between $A$ and $C$.” Watch the drawing built.",
        scene: { type: "walk", how: HOW_2_5D, rows: [
          { step: 1, m: "A, B, C \\text{ collinear}", say: "$B$ is between $A$ and $C$, so draw them on one line, in that order.", fig: segRow([["A", 0], ["B", 3.3], ["C", 6.6]], {}) },
          { step: 2, m: "M \\text{ and } N", say: "The midpoints go half-way along each part, wherever they happen to fall.", fig: segRow([["A", 0], ["M", 1.65], ["B", 3.3], ["N", 4.95], ["C", 6.6]], {}) },
          { step: 3, m: "AM = MB \\qquad BN = NC", say: "Mark each pair of halves with its own tick marks: one tick for the first pair, two for the second.",
            fig: segRow([["A", 0], ["M", 1.65], ["B", 3.3], ["N", 4.95], ["C", 6.6]], { ticks: [[0, 1, 1], [1, 2, 1], [2, 3, 2], [3, 4, 2]] }),
            ask: { prompt: "Why two ticks on the second pair?", answer: 0, options: [{ t: "They are a different pair: the halves of $BC$ need not equal the halves of $AB$" }, { t: "To show they are longer", fb: "Ticks say which sides match. They say nothing about size." }] } }] },
        gate: true, then: "A good diagram holds exactly the given facts, with a separate mark for each pair that matches." },
      { type: "choice", kicker: "Try it", prompt: "A problem says “$\\overrightarrow{BD}$ bisects $\\angle ABC$.” How should the diagram show it?",
        options: [{ t: "Matching arcs in the two angles $\\angle ABD$ and $\\angle DBC$" }, { t: "A little square at $B$", fb: "A square means a right angle, which is not given." }, { t: "Tick marks on $\\overline{AB}$ and $\\overline{BC}$", fb: "Ticks go on sides. A bisector makes angles equal." }],
        answer: 0, skill: "Mark a diagram", hints: ["Equal angles are marked with matching arcs."], why: "Matching arcs mark congruent angles." },
      { type: "choice", kicker: "Find the error",
        prompt: "Zoe looks at a drawing and writes: “$\\overline{AB} \\parallel \\overline{CD}$, because they look parallel.” What is wrong?",
        options: [{ t: "Looking parallel is not a reason. It needs matching arrowheads, or to be given." },
                  { t: "Nothing: parallel lines never meet, and these do not.", fb: "A drawing is too small to show whether two lines meet far away." },
                  { t: "She should have said they are perpendicular.", fb: "Nothing in the drawing says that either." }],
        answer: 0, skill: "Read a diagram", hints: ["What would the drawing have to show?"], why: "Only marks or givens can be used as reasons." },
      { type: "choice", kicker: "Use it", prompt: "A problem says: “In $\\triangle PQR$, $\\overline{PQ} \\cong \\overline{PR}$.” Which marks belong on your diagram?",
        options: [{ t: "One tick mark on $\\overline{PQ}$ and one on $\\overline{PR}$" }, { t: "A little square at $P$", fb: "No right angle is given." }, { t: "An arc at each of $Q$ and $R$", fb: "Nothing about the angles is given." }],
        answer: 0, skill: "Mark a diagram", hints: ["The given is about two sides being equal."], why: "Two congruent sides: matching tick marks on both." }
    ]
  });
  /* ================================================ 2.6 · Two-column proof */
  var HOW_2_6 = [["Given", "List the given information, and mark it on the figure."],
                 ["Link", "Move one step at a time. Each statement needs a reason: a definition, a postulate, a property or a theorem."],
                 ["Prove", "End with the statement you were asked to prove."]];
  var FIG_LINPAIR = rayFig([0, 0], [{ d: 0, name: "A" }, { d: 125, name: "C" }, { d: 180, name: "B" }],
    { vname: "O", num: [{ i: 0, j: 1, t: "1" }, { i: 1, j: 2, t: "2" }], y: [-0.9, 3.2], alt: "A straight line AB with a ray OC rising from it. The ray makes angle 1 on the right and angle 2 on the left." });
  LESSONS.push({
    title: "Two-column proof", art: "proof",
    blurb: "Section 2.6 · Draw the diagram, list the given and the prove, and write each statement with its reason beside it.",
    mins: 14, v: 5,
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
      { type: "slots", prompt: "Given: $\\angle 1$ and $\\angle 2$ are complementary, and $\\angle 2 \\cong \\angle 3$. Prove: $m\\angle 1 + m\\angle 3 = 90°$. Drop in the **reason** for each statement. The first and third are given.",
        slots: [{ id: "a", label: nb("$m\\angle 1 + m\\angle 2 = 90°$") }, { id: "b", label: nb("$m\\angle 2 = m\\angle 3$") }, { id: "c", label: nb("$m\\angle 1 + m\\angle 3 = 90°$") }],
        cards: [{ t: "Definition of complementary angles", slot: "a", fb: "Complementary means the measures add to 90°." }, { t: "Definition of congruent angles", slot: "b", fb: "Congruent angles have equal measures." },
                { t: "Substitution Property", slot: "c", fb: "$m\\angle 3$ takes the place of $m\\angle 2$." }, { t: "Reflexive Property", fb: "Reflexive gives a quantity equal to itself." }, { t: "Definition of a right angle", fb: "Nothing here is a right angle." }],
        skill: "Two-column proof", hints: ["Which fact turns a word into an equation? Which turns one equation into another?"],
        why: "The definition of complementary gives the sum, the definition of congruent gives equal measures, and substitution joins them." },
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
  /* ============================== 2.7 · Segment and angle congruence theorems */
  var HOW_2_7 = [["Given", "State what is given and what you are to prove."],
                 ["Equation", "Turn each congruence into an equation, using the definition of congruent."],
                 ["Back", "Use a property of equality, then turn the last equation back into a congruence."]];
  var HOW_2_7B = [["Halves", "A midpoint cuts a segment in two equal halves: write each half as half the whole."],
                  ["Equal", "The whole segments are equal, so their halves are equal."],
                  ["Back", "Turn the equal lengths back into congruent segments."]];
  var FIG_ANG27 = rayFig([0, 0], [{ d: 0, name: "A" }, { d: 40, name: "B" }, { d: 85, name: "C" }, { d: 140, name: "D" }],
    { vname: "O", wedges: [{ i: 0, j: 1, say: "1", r: 36 }, { i: 1, j: 2, say: "2", c: "green", r: 48 }, { i: 2, j: 3, say: "3", c: "purple", r: 36 }], alt: "Rays OA, OB, OC and OD from O. Angle AOB is marked 1, angle BOC is 2 and angle COD is 3." });
  LESSONS.push({
    title: "Segment and angle congruence theorems", art: "cong",
    blurb: "Section 2.7 · Congruence has the same three properties as equality, and they let you prove theorems about segments and angles.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "If $\\overline{AB} \\cong \\overline{CD}$, what is true of their **lengths**?",
        options: [{ t: "They are equal: $AB = CD$" }, { t: "They are congruent: $AB \\cong CD$", fb: "Lengths are numbers. Numbers are equal, not congruent." }, { t: "Nothing", fb: "That is exactly what congruent segments mean." }],
        answer: 0, skill: "Congruent or equal", hints: ["Congruent figures have equal measures."], why: "Congruent segments have equal lengths: that is the definition." },
      { type: "learn", kicker: "Explore",
        prompt: "$\\overline{AB}$ stays put. Drag $D$ and $F$ to change $\\overline{CD}$ and $\\overline{EF}$. Make **all three** segments congruent.",
        scene: { type: "sketch", x: [0, 11], y: [0, 4], u: 54, grid: false, gate: true,
          pts: { D: { at: [3.5, 2.2], drag: true, c: "orange", on: { fn: function (p) { return [Math.max(1.5, Math.min(10.5, Math.round(p[0] * 2) / 2)), 2.2]; } }, say: "Point D" },
                 F: { at: [7.5, 1.0], drag: true, c: "orange", on: { fn: function (p) { return [Math.max(1.5, Math.min(10.5, Math.round(p[0] * 2) / 2)), 1.0]; } }, say: "Point F" } },
          draw: function (s) {
            var ab = 4, cd = s.D[0] - 1, ef = s.F[0] - 1, c1 = cd === ab, c2 = ef === cd, c3 = ef === ab;
            return [{ seg: [[1, 3.4], [5, 3.4]], c: "blue", marks: c1 || c3 ? 1 : 0 }, { seg: [[1, 2.2], s.D], c: c1 ? "blue" : "ink", marks: c1 || c2 ? 1 : 0 }, { seg: [[1, 1.0], s.F], c: c3 ? "blue" : "ink", marks: c2 || c3 ? 1 : 0 },
              { pt: [1, 3.4], name: "A", at: "w" }, { pt: [5, 3.4], name: "B", at: "e" }, { pt: [1, 2.2], name: "C", at: "w" }, { pt: s.D, name: "D", at: "e", c: "orange" }, { pt: [1, 1.0], name: "E", at: "w" }, { pt: s.F, name: "F", at: "e", c: "orange" }];
          },
          readout: function (s) {
            var cd = s.D[0] - 1, ef = s.F[0] - 1, ab = 4, t = [];
            if (cd === ab) t.push("$\\overline{AB} \\cong \\overline{CD}$"); if (ef === cd) t.push("$\\overline{CD} \\cong \\overline{EF}$"); if (ef === ab) t.push("$\\overline{AB} \\cong \\overline{EF}$");
            return "$AB = 4$ · $CD = " + n1(cd) + "$ · $EF = " + n1(ef) + "$<br>" + (t.length ? t.join(" · ") : "No two are congruent yet.");
          },
          goal: function (s) { return s.D[0] - 1 === 4 && s.F[0] - 1 === 4; } },
        then: "When $\\overline{AB} \\cong \\overline{CD}$ and $\\overline{CD} \\cong \\overline{EF}$, the third, $\\overline{AB} \\cong \\overline{EF}$, comes free. That is the **Transitive Property of Congruence**." },
      { type: "learn", kicker: "The idea",
        prompt: "Congruence behaves like equality. It is **reflexive** ($\\overline{AB} \\cong \\overline{AB}$), **symmetric** (if $\\overline{AB} \\cong \\overline{CD}$ then $\\overline{CD} \\cong \\overline{AB}$) and **transitive**. To prove a theorem about congruent segments or angles, turn each congruence into an equation, work with the equations, and turn the answer back.",
        scene: { type: "method", how: HOW_2_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Given: $\\angle 1 \\cong \\angle 2$ and $\\angle 2 \\cong \\angle 3$. Prove: $\\angle 1 \\cong \\angle 3$. Watch each statement get its reason.", art: FIG_ANG27,
        scene: { type: "walk", how: HOW_2_7, rows: [
          { step: 1, m: "\\angle 1 \\cong \\angle 2 \\qquad \\angle 2 \\cong \\angle 3", say: "Given." },
          { step: 2, m: "m\\angle 1 = m\\angle 2 \\qquad m\\angle 2 = m\\angle 3", say: "Definition of congruent angles.",
            ask: { prompt: "What does the definition of congruent angles let you write?", answer: 0, options: [{ t: "Their measures are equal" }, { t: "Their measures add to 180°", fb: "That is supplementary. Congruent means equal." }] } },
          { step: 3, m: "m\\angle 1 = m\\angle 3", say: "Transitive Property of Equality." },
          { step: 3, m: "\\angle 1 \\cong \\angle 3", say: "Definition of congruent angles, read the other way." }] },
        gate: true, then: "This proves the **Transitive Property of Congruence** for angles: the three-line argument works for segments in the same way." },
      { type: "guided", kicker: "Together",
        prompt: "Given: $\\angle A \\cong \\angle B$. Prove the **Symmetric Property**: $\\angle B \\cong \\angle A$. Now you supply the reasons.",
        how: HOW_2_7, skill: "Congruence properties",
        steps: [
          { step: 1, ask: "What is the reason for the first statement, $\\angle A \\cong \\angle B$?", type: "choice", answer: 0,
            options: [{ t: "Given" }, { t: "Definition of congruent angles", fb: "That comes next. The first statement is what you are told." }],
            m: "\\angle A \\cong \\angle B", say: "Given." },
          { step: 2, ask: "Next, $m\\angle A = m\\angle B$. Which reason?", type: "choice", answer: 0,
            options: [{ t: "Definition of congruent angles" }, { t: "Symmetric Property of Equality", fb: "Not yet. First turn the congruence into an equation." }],
            m: "m\\angle A = m\\angle B", say: "Definition of congruent angles." },
          { step: 3, ask: "Swapping the two sides gives $m\\angle B = m\\angle A$. Which reason?", type: "choice", answer: 0,
            options: [{ t: "Symmetric Property of Equality" }, { t: "Reflexive Property of Equality", fb: "Reflexive says a measure equals itself, not that two sides can swap." }],
            m: "m\\angle B = m\\angle A", say: "Symmetric Property of Equality." },
          { step: 3, ask: "The last line turns it back. Which reason?", type: "choice", answer: 0,
            options: [{ t: "Definition of congruent angles" }, { t: "Given", fb: "It was not given: it has been proved." }],
            m: "\\angle B \\cong \\angle A", say: "Definition of congruent angles." }],
        why: "Given, equation, back. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "Match each statement to the property of congruence it shows.",
        slots: [{ id: "r", label: "Reflexive" }, { id: "s", label: "Symmetric" }, { id: "t", label: "Transitive" }],
        cards: [{ t: nb("$\\overline{PQ} \\cong \\overline{PQ}$"), slot: "r", fb: "A segment is congruent to itself." },
                { t: nb("If $\\angle X \\cong \\angle Y$, then $\\angle Y \\cong \\angle X$."), slot: "s", fb: "The two sides change places." },
                { t: nb("If $\\overline{AB} \\cong \\overline{CD}$ and $\\overline{CD} \\cong \\overline{EF}$, then $\\overline{AB} \\cong \\overline{EF}$."), slot: "t", fb: "A chain passes the congruence along." }],
        skill: "Congruence properties", hints: ["Itself? Swapped? Passed along a chain?"], why: "Reflexive: itself. Symmetric: swapped. Transitive: a chain." },
      { type: "num", prompt: "$\\angle A \\cong \\angle B$ and $\\angle B \\cong \\angle C$. $m\\angle A = 47°$. Find $m\\angle C$.", post: "°", answer: 47, skill: "Congruence properties",
        near: [{ v: 94, fb: "Congruent angles are equal, not added together." }, { v: 43, fb: "That is the complement of 47°. Congruent means equal." }],
        hints: ["$\\angle A \\cong \\angle C$ by the Transitive Property."], why: "$\\angle A \\cong \\angle C$, so $m\\angle C = 47°$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Given: $\\overline{AB} \\cong \\overline{CD}$, $M$ is the midpoint of $\\overline{AB}$ and $N$ is the midpoint of $\\overline{CD}$. Prove: $\\overline{AM} \\cong \\overline{CN}$.",
        scene: { type: "walk", how: HOW_2_7B, rows: [
          { step: 1, m: "AM = \\frac{1}{2}AB \\qquad CN = \\frac{1}{2}CD", say: "Definition of midpoint: each half is half the whole.",
            fig: segRow([["A", 0], ["M", 1.5], ["B", 3]], { ticks: [[0, 1, 1], [1, 2, 1]], alt: "Segment AB with midpoint M." }) },
          { step: 2, m: "AB = CD", say: "The segments are congruent, so their lengths are equal.",
            ask: { prompt: "Which definition turns $\\overline{AB} \\cong \\overline{CD}$ into $AB = CD$?", answer: 0, options: [{ t: "The definition of congruent segments" }, { t: "The definition of midpoint", fb: "That one halves a segment. Here we only turn a congruence into an equation." }] } },
          { step: 2, m: "\\frac{1}{2}AB = \\frac{1}{2}CD", say: "Multiplication Property of Equality." },
          { step: 3, m: "AM = CN", say: "Substitution." },
          { step: 3, m: "\\overline{AM} \\cong \\overline{CN}", say: "Definition of congruent segments." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "In a proof, you go from $\\overline{AB} \\cong \\overline{CD}$ to $AB = CD$. What is the reason?",
        options: [{ t: "Definition of congruent segments" }, { t: "Given", fb: "It is not a new fact: it is the same fact written another way." }, { t: "Reflexive Property", fb: "Reflexive gives a segment congruent to itself." }],
        answer: 0, skill: "Congruence properties", hints: ["Which definition turns a congruence into an equation?"], why: "The definition says congruent segments have equal lengths." },
      { type: "choice", kicker: "Find the error",
        prompt: "A proof says: $m\\angle 1 = m\\angle 2$ and $m\\angle 2 = m\\angle 3$, so $m\\angle 1 = m\\angle 3$. Reason: Reflexive Property of Equality. What is wrong?",
        options: [{ t: "The reason is the Transitive Property: the equal quantities are linked in a chain." }, { t: "The conclusion should be $m\\angle 1 = m\\angle 2$.", fb: "That was already given." }, { t: "Nothing. It is right.", fb: "Reflexive only says a measure equals itself." }],
        answer: 0, skill: "Congruence properties", hints: ["Two things equal to the same third thing…"], why: "Equal to the same thing, so equal to each other: Transitive." },
      { type: "num", kicker: "Use it", prompt: "Plank 1 is the same length as plank 2, and plank 2 is the same length as plank 3. Plank 3 is 2.4 m. How long is plank 1?", post: "m", answer: 2.4, tol: 1e-9, skill: "Congruence properties",
        near: [{ v: 4.8, fb: "The planks are the same length. They do not add." }], hints: ["Plank 1 is congruent to plank 3."], why: "Transitive: plank 1 is also 2.4 m." }
    ]
  });
  /* ================================================ 2.8 · Proofs about angle pairs */
  var HOW_2_8 = [["Mark", "Mark the figure with the given facts."],
                 ["Equations", "Turn each fact into an equation: a sum for supplementary or complementary, equal measures for congruent."],
                 ["Link", "Join the equations with substitution or a property, and end with the claim."]];
  var FLOW_VERT28 = flow([{ at: [2.6, 3.3], t: "∠1, ∠2: linear pair", r: "Given (figure)" }, { at: [2.6, 1.3], t: "∠2, ∠3: linear pair", r: "Given (figure)" },
    { at: [8.6, 3.3], t: "∠1, ∠2 supplementary", r: "Linear Pair Post." }, { at: [8.6, 1.3], t: "∠2, ∠3 supplementary", r: "Linear Pair Post." },
    { at: [14.4, 2.3], t: "∠1 ≅ ∠3", r: "Congruent Suppl. Thm.", w: 4.6 }],
    [[0, 2], [1, 3], [2, 4], [3, 4]], { x: [0, 16.8], y: [0.3, 4.3], u: 34, alt: "A flowchart proof. Two boxes on the left say that angles 1 and 2, and angles 2 and 3, are linear pairs. Each leads to a box saying the pair is supplementary, by the Linear Pair Postulate. Both of those lead to the last box: angle 1 is congruent to angle 3, by the Congruent Supplements Theorem." });
  var FIG_X28 = xFig(58, { alt: "Two lines crossing, making four angles numbered 1 to 4 in order round the crossing point." });
  function pair28(s) {
    if (s.selList.length < 2) return null;
    var a = +s.selList[0], b = +s.selList[1], d = Math.abs(a - b);
    return d === 2 ? { k: "vertical", say: "$\\angle " + a + " \\cong \\angle " + b + "$: **vertical angles**. Both are supplementary to the angle between them." }
      : { k: "linear", say: "$\\angle " + a + "$ and $\\angle " + b + "$: a **linear pair**, so they add up to 180°." };
  }
  LESSONS.push({
    title: "Proofs about angle pairs", art: "ap",
    blurb: "Section 2.8 · Theorems about right, complementary, supplementary and vertical angles, and how to prove them.",
    mins: 15, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$\\angle 1$ and $\\angle 2$ are supplementary. $m\\angle 1 = 70°$. Find $m\\angle 2$.", post: "°", answer: 110, skill: "Angle pairs",
        near: [{ v: 20, fb: "That is the complement. Supplementary angles add up to 180°." }], hints: ["$180 - 70$."], why: "$180 - 70 = 110$." },
      { type: "learn", kicker: "Explore",
        prompt: "Turn the orange line. Tap **any two** angles and read how they are related. Find a **linear pair** and a pair of **vertical angles**.",
        scene: { type: "sketch", x: [-3.7, 3.7], y: [-3.2, 3.2], u: 50, grid: false, gate: true,
          pts: { H: { at: GT.polar([0, 0], 2.7, 58), drag: true, c: "orange", on: { circle: [[0, 0], 2.7], snapDeg: 1, range: [25, 155] }, say: "The turning line" } },
          taps: { "1": { at: function (s) { var a = GT.dir([0, 0], s.H); return GT.polar([0, 0], 1.3, a / 2); }, label: "1", r: 16 },
                  "2": { at: function (s) { var a = GT.dir([0, 0], s.H); return GT.polar([0, 0], 1.3, (a + 180) / 2); }, label: "2", r: 16 },
                  "3": { at: function (s) { var a = GT.dir([0, 0], s.H); return GT.polar([0, 0], 1.3, 180 + a / 2); }, label: "3", r: 16 },
                  "4": { at: function (s) { var a = GT.dir([0, 0], s.H); return GT.polar([0, 0], 1.3, 180 + (a + 180) / 2); }, label: "4", r: 16 } }, maxSel: 2,
          track: function (s) { var p = pair28(s); return p ? p.k : null; },
          draw: function (s) {
            var O = [0, 0], a = Math.round(GT.dir(O, s.H)), R = { 1: [0, a], 2: [a, 180], 3: [180, 180 + a], 4: [180 + a, 360] }, items = [];
            s.selList.forEach(function (k, i) { items.push({ angle: [GT.polar(O, 1, R[k][0]), O, GT.polar(O, 1, R[k][1])], r: 62 + i * 6, c: i ? "green" : "orange" }); });
            items.push({ dline: [GT.polar(O, 3.2, 180), [3.2, 0]] }, { dline: [GT.polar(O, 2.9, a + 180), GT.polar(O, 2.9, a)], c: "orange" }, { pt: O });
            return items;
          },
          readout: function (s) {
            var a = Math.round(GT.dir([0, 0], s.H)), p = pair28(s), m = { 1: a, 2: 180 - a, 3: a, 4: 180 - a };
            return (p ? p.say + "<br>$m\\angle " + s.selList[0] + " = " + m[s.selList[0]] + "°$ and $m\\angle " + s.selList[1] + " = " + m[s.selList[1]] + "°$" : "Tap two angles.") + "<br>" + found([["vertical", "Vertical angles"], ["linear", "A linear pair"]], s.tracked);
          },
          goal: function (s) { return s.tracked.vertical && s.tracked.linear; } },
        then: "However the line turns, **vertical** angles stay equal, and a **linear pair** always adds up to 180°. The proofs in this lesson say **why**." },
      { type: "learn", kicker: "The idea",
        prompt: "Theorems about angle pairs are proved from definitions and postulates. The **Linear Pair Postulate** says a linear pair is supplementary. From it: supplements of the same angle are congruent, and so are vertical angles. So are complements of the same angle, and all right angles.",
        scene: { type: "method", how: HOW_2_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "$\\angle 1$ and $\\angle 3$ are vertical angles, with $\\angle 2$ between them. Watch a flowchart prove they are congruent.", art: FLOW_VERT28,
        scene: { type: "walk", how: HOW_2_8, rows: [
          { step: 1, m: "\\angle 1, \\angle 2 \\qquad \\angle 2, \\angle 3", say: "The two boxes on the left: each pair is a linear pair, as the figure shows." },
          { step: 2, m: "\\text{each pair is supplementary}", say: "One arrow from each box: the Linear Pair Postulate.",
            ask: { prompt: "What does the Linear Pair Postulate say about the two angles?", answer: 0, options: [{ t: "They are supplementary" }, { t: "They are congruent", fb: "Only if both happen to measure 90°." }] } },
          { step: 2, m: "\\text{two arrows into one box}", say: "The last box needs both facts: $\\angle 1$ and $\\angle 3$ are both supplementary to $\\angle 2$." },
          { step: 3, m: "\\angle 1 \\cong \\angle 3", say: "Congruent Supplements Theorem. This proves the Vertical Angles Theorem." }] },
        gate: true, then: "Vertical angles are congruent: now it is a theorem, not just something you noticed." },
      { type: "guided", kicker: "Together",
        prompt: "Given: $\\angle A$ and $\\angle B$ are right angles. Prove: $\\angle A \\cong \\angle B$. Now you supply the steps.",
        how: HOW_2_8, skill: "Angle pair proofs",
        steps: [
          { step: 1, ask: "What is the reason for “$\\angle A$ and $\\angle B$ are right angles”?", type: "choice", answer: 0,
            options: [{ t: "Given" }, { t: "Definition of a right angle", fb: "That is used next. These two statements are what you are told." }],
            m: "\\angle A \\text{ and } \\angle B \\text{ are right angles}", say: "Given." },
          { step: 2, ask: "What can you write from the definition of a right angle?", type: "choice", answer: 0,
            options: [{ t: "$m\\angle A = 90°$ and $m\\angle B = 90°$" }, { t: "$m\\angle A + m\\angle B = 90°$", fb: "Each right angle is 90° by itself. The sum would be 180°." }],
            m: "m\\angle A = 90° \\qquad m\\angle B = 90°", say: "Definition of a right angle." },
          { step: 3, ask: "Which property lets you say $m\\angle A = m\\angle B$?", type: "choice", answer: 0,
            options: [{ t: "Transitive (or Substitution) Property: both equal 90°" }, { t: "Symmetric Property", fb: "Symmetric only swaps the two sides of one equation." }],
            m: "m\\angle A = m\\angle B", say: "Both equal 90°." },
          { step: 3, ask: "The last step turns it back. What do you write?", type: "choice", answer: 0,
            options: [{ t: "$\\angle A \\cong \\angle B$, by the definition of congruent angles" }, { t: "$\\angle A \\cong \\angle B$, by the Given", fb: "It has been proved, not given." }],
            m: "\\angle A \\cong \\angle B", say: "Definition of congruent angles. This proves: all right angles are congruent." }],
        why: "Mark, equations, link. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "Prove that vertical angles are congruent. $\\angle 1$ and $\\angle 2$ are a linear pair, and so are $\\angle 2$ and $\\angle 3$, so each pair sums to 180°. Drop in the **reason** for each statement.", art: FIG_X28,
        slots: [{ id: "a", label: nb("$m\\angle 1 + m\\angle 2 = m\\angle 2 + m\\angle 3$") }, { id: "b", label: nb("$m\\angle 1 = m\\angle 3$") }, { id: "c", label: nb("$\\angle 1 \\cong \\angle 3$") }],
        cards: [{ t: "Substitution: both sums equal 180°", slot: "a", fb: "Both sums are 180°, so they are equal." }, { t: "Subtraction Property of Equality", slot: "b", fb: "Take $m\\angle 2$ from both sides." }, { t: "Definition of congruent angles", slot: "c", fb: "Equal measures mean congruent angles." },
                { t: "Reflexive Property", fb: "Reflexive gives a quantity equal to itself." }, { t: "Given", fb: "These statements were worked out, not given." }],
        skill: "Angle pair proofs", hints: ["Start from the two linear pairs: what do their sums equal?"], why: "Two sums that both equal 180° are equal; subtract the common angle; then turn the equation back into a congruence." },
      { type: "order", prompt: "A paragraph proof that two congruent angles which are supplementary must both be right angles. Put its sentences in order.",
        items: [nb("It is given that $\\angle 1 \\cong \\angle 2$ and that they are supplementary."), nb("By the definitions, $m\\angle 1 = m\\angle 2$ and $m\\angle 1 + m\\angle 2 = 180°$."), nb("By substitution, $m\\angle 1 + m\\angle 1 = 180°$."), nb("So $m\\angle 1 = 90°$, and $m\\angle 2 = 90°$ as well."), nb("Both are right angles.")],
        skill: "Paragraph proof", hints: ["A paragraph proof starts from what is given.", "Each sentence uses the one before it."],
        why: "Given, definitions, substitution, the arithmetic, and the conclusion." },
      { type: "learn", kicker: "A harder case",
        prompt: "The same idea with complements. Given: $\\angle X$ and $\\angle Z$ are complementary, and so are $\\angle Y$ and $\\angle Z$. Prove: $\\angle X \\cong \\angle Y$.",
        scene: { type: "walk", how: HOW_2_8, rows: [
          { step: 1, m: "\\angle X, \\angle Z \\text{ complementary} \\qquad \\angle Y, \\angle Z \\text{ complementary}", say: "Given." },
          { step: 2, m: "m\\angle X + m\\angle Z = 90° \\qquad m\\angle Y + m\\angle Z = 90°", say: "Definition of complementary angles.",
            ask: { prompt: "What do complementary angles add up to?", answer: 0, options: [{ t: "90°" }, { t: "180°", fb: "That is supplementary." }] } },
          { step: 2, m: "m\\angle X + m\\angle Z = m\\angle Y + m\\angle Z", say: "Substitution: both sums equal 90°." },
          { step: 3, m: "m\\angle X = m\\angle Y", say: "Subtraction Property of Equality: take $m\\angle Z$ from both sides." },
          { step: 3, m: "\\angle X \\cong \\angle Y", say: "Definition of congruent angles: the **Congruent Complements Theorem**." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "$\\angle P$ and $\\angle Q$ are each supplementary to $\\angle R$. Which theorem tells you $\\angle P \\cong \\angle Q$?",
        options: [{ t: "The Congruent Supplements Theorem" }, { t: "The Congruent Complements Theorem", fb: "The angles are supplementary, not complementary." }, { t: "The Right Angle Congruence Theorem", fb: "Nothing says they are right angles." }],
        answer: 0, skill: "Angle pair proofs", hints: ["Two angles supplementary to the same angle."], why: "Supplements of the same angle are congruent." },
      { type: "choice", kicker: "Find the error",
        prompt: "A proof says: “$\\angle 1$ and $\\angle 3$ are vertical angles, so they are supplementary.” What is wrong?",
        options: [{ t: "Vertical angles are congruent, not supplementary: the reason does not support the statement." },
                  { t: "Vertical angles cannot be named with numbers.", fb: "They can: that is how figures name them." },
                  { t: "Nothing. It is right.", fb: "Two vertical angles of 40° add to 80°, not 180°." }],
        answer: 0, skill: "Angle pair proofs", hints: ["What does the Vertical Angles Theorem say?"], why: "Vertical angles are congruent." },
      { type: "num", kicker: "Use it", prompt: "Two roads cross. One of the angles they make is 38°. What is the angle **directly opposite** it?", post: "°", answer: 38, skill: "Angle pair proofs",
        near: [{ v: 142, fb: "That is the angle next to it, which makes a linear pair. The opposite angle is a vertical angle." }], hints: ["Vertical angles are congruent."], why: "Vertical angles are congruent, so it is 38° too." }
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
    { id: "hg2-biconditional", title: "Biconditional statements", lesson: 3,
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
    { id: "hg2-reason", title: "Give the reason for a step", lesson: 8,
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
    { id: "hg2-theorem", title: "Use the angle theorems", lesson: 10,
      gen: function (R) {
        var a = R.int(25, 155), kind = R.int(0, 2);
        if (kind === 0) return { type: "num", prompt: "$\\angle 1$ and $\\angle 2$ form a linear pair, and $m\\angle 1 = " + a + "°$. Find $m\\angle 2$.", post: "°", answer: 180 - a,
          near: near(180 - a, [{ v: a, fb: "A linear pair is supplementary. The angles are equal only when each is 90°." }]), hints: ["Linear Pair Theorem: the measures add to 180°."], why: "$180 - " + a + " = " + (180 - a) + "$." };
        if (kind === 1) return { type: "num", prompt: "$\\angle 1$ and $\\angle 3$ are vertical angles, and $m\\angle 1 = " + a + "°$. Find $m\\angle 3$.", post: "°", answer: a,
          near: near(a, [{ v: 180 - a, fb: "That is the angle beside it. Vertical angles are congruent." }]), hints: ["Vertical Angles Theorem."], why: "Vertical angles are congruent: $" + a + "°$." };
        return { type: "num", prompt: "$\\angle A$ and $\\angle B$ are both supplementary to $\\angle C$, and $m\\angle A = " + a + "°$. Find $m\\angle B$.", post: "°", answer: a,
          near: near(a, [{ v: 180 - a, fb: "That is $m\\angle C$. Supplements of the same angle are congruent to each other." }]), hints: ["Congruent Supplements Theorem."], why: "Supplements of the same angle are congruent: $" + a + "°$." };
      } },
    { id: "hg2-diagram", title: "What a diagram tells you", lesson: 7,
      gen: function (R) {
        var C = R.pick([
          { s: "Three points are drawn on one straight line, so they are collinear.", yes: true, why: "Points drawn on a line are on it." },
          { s: "Two sides have matching tick marks, so they are congruent.", yes: true, why: "Matching tick marks are the mark for congruent sides." },
          { s: "A small square marks an angle, so it is a right angle.", yes: true, why: "A little square is the mark for a right angle." },
          { s: "Two angles carry matching arcs, so they are congruent.", yes: true, why: "Matching arcs mark congruent angles." },
          { s: "An angle looks like 90°, so it is a right angle.", yes: false, why: "It needs a little square or a given fact: looks prove nothing." },
          { s: "Two lines look parallel, so they are parallel.", yes: false, why: "It needs matching arrowheads or a given fact." },
          { s: "A point looks like the midpoint of a segment, so it is the midpoint.", yes: false, why: "It needs tick marks or a given fact." },
          { s: "One side looks longer than another, so it is longer.", yes: false, why: "A drawing is not to scale." },
          { s: "Two angles are shown side by side on a line, so they form a linear pair.", yes: true, why: "Adjacent angles whose outer sides lie on a line are a linear pair, and the line is drawn." },
          { s: "Two lines cross at a point, so the angles across from each other are vertical angles.", yes: true, why: "Crossing lines make vertical angles, and the crossing is drawn." },
          { s: "A line through the middle of a figure is marked with arrowheads, so it is a line, not a segment.", yes: true, why: "Arrowheads mean the line goes on forever." },
          { s: "Two segments carry the same number of tick marks, so they are congruent.", yes: true, why: "The same number of ticks is the mark for congruent segments." },
          { s: "Two angles look the same size, so they are congruent.", yes: false, why: "Equal-looking angles need matching arcs or a given fact." },
          { s: "A triangle looks isosceles, so it is isosceles.", yes: false, why: "It needs tick marks or a given fact." },
          { s: "Two segments look perpendicular, so they are perpendicular.", yes: false, why: "It needs a little square or a given fact." },
          { s: "Two angles look supplementary, so their measures add to 180°.", yes: false, why: "It needs a straight line drawn through them, or a given fact." }]);
        return mc(R, { prompt: "A diagram shows this: “" + C.s + "” Can you assume it?", right: C.yes ? "Yes: the diagram marks it" : "No: it only looks that way", keep: true,
          wrong: [{ t: C.yes ? "No: it only looks that way" : "Yes: the diagram marks it", fb: C.yes ? "That fact is marked or drawn in the diagram, so you can use it." : "Looking a certain way is not marked or given, so it cannot be used." }],
          hints: ["Is it marked or given, or does it just look that way?"], why: C.why });
      } },
    { id: "hg2-congruence", title: "Properties of congruence", lesson: 9,
      gen: function (R) {
        var n = letters(R, 6), k = R.int(0, 2), seg = R.chance(0.5), ov = seg ? function (a, b) { return "$\\overline{" + a + b + "}$"; } : function (a, b) { return "$\\angle " + a + b + "$"; };
        var ang = function (a, b) { return seg ? "\\overline{" + a + b + "}" : "\\angle " + a + b; };
        var stmt = [ "$" + ang(n[0], n[1]) + " \\cong " + ang(n[0], n[1]) + "$", "If $" + ang(n[0], n[1]) + " \\cong " + ang(n[2], n[3]) + "$, then $" + ang(n[2], n[3]) + " \\cong " + ang(n[0], n[1]) + "$.",
          "If $" + ang(n[0], n[1]) + " \\cong " + ang(n[2], n[3]) + "$ and $" + ang(n[2], n[3]) + " \\cong " + ang(n[4], n[5]) + "$, then $" + ang(n[0], n[1]) + " \\cong " + ang(n[4], n[5]) + "$." ][k];
        var names = ["Reflexive", "Symmetric", "Transitive"];
        return mc(R, { prompt: "Which property of congruence is this? " + stmt, right: names[k], keep: true,
          wrong: names.filter(function (x, j) { return j !== k; }).map(function (x) { return { t: x, fb: { Reflexive: "Reflexive: a figure is congruent to itself.", Symmetric: "Symmetric: the two sides change places.", Transitive: "Transitive: a chain, passed along." }[x] }; }),
          hints: ["Itself? Swapped? Passed along a chain?"], why: ["A figure is congruent to itself: Reflexive.", "The two sides swapped places: Symmetric.", "A chain of two congruences gives a third: Transitive."][k] });
      } }
  ];
  L.unit("geo", 2, {
    title: "Reasoning and Proof",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Patterns and counterexamples, conditional and biconditional statements, and deductive reasoning.",
        skills: ["hg2-pattern", "hg2-conditional", "hg2-biconditional", "hg2-deductive"], per: 2 },
      { title: "Quiz 2", after: 8, blurb: "Properties of equality, diagrams, and the reasons in a proof.",
        skills: ["hg2-property", "hg2-diagram", "hg2-reason"], per: 2 },
      { title: "Quiz 3", after: 10, blurb: "Properties of congruence and the angle theorems.",
        skills: ["hg2-congruence", "hg2-theorem"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:2", {
    2: { name: "Inductive reasoning", frame: "[[Inductive]] reasoning goes from examples to a rule. The rule is a [[conjecture]]. Examples can support it, but one [[counterexample]] proves it false.",
         chips: ["Deductive", "theorem"] },
    3: { name: "Conditional statements", frame: "In “if $p$, then $q$”, $p$ is the [[hypothesis]] and $q$ the [[conclusion]]. The [[converse]] swaps them. The [[contrapositive]] swaps and negates, and is true exactly when the conditional is. “If and only if” says both ways are true.",
         chips: ["inverse", "definition"] },
    4: { name: "Deductive reasoning", frame: "[[Deductive]] reasoning draws conclusions from facts and rules. The Law of [[Detachment]]: $p \\to q$ and $p$ give $q$. The Law of [[Syllogism]]: $p \\to q$ and $q \\to r$ give $p \\to r$.",
         chips: ["Inductive", "Converse"] },
    6: { name: "Algebraic properties", frame: "In a proof every statement has a [[reason]]. The [[Reflexive]] Property says a quantity equals itself, the [[Symmetric]] Property swaps the two sides, and the Transitive Property chains equal things.",
         chips: ["figure", "Distributive"] },
    7: { name: "Diagrams", frame: "A diagram is [[not to scale]]. Use what is marked or given: tick marks, arcs, little squares and points on lines. Never use how a figure [[looks]].",
         chips: ["measure", "guess"] },
    8: { name: "Two-column proof", frame: "A [[theorem]] is a statement that has been proved. A two-column proof lists [[statements]] on the left and [[reasons]] on the right, from the given facts to the claim.",
         chips: ["postulate", "figures"] },
    9: { name: "Congruence theorems", frame: "Congruence is [[reflexive]], [[symmetric]] and [[transitive]], like equality. To prove it, turn a congruence into an [[equation]], and back.",
         chips: ["diagram", "converse"] },
    10: { name: "Angle pair proofs", frame: "Angles [[supplementary]] to the same angle are congruent, and so are angles [[complementary]] to it. [[Vertical]] angles are congruent, and all right angles are congruent.",
         chips: ["adjacent", "acute"] }
  });
})();
