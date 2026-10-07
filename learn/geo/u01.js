/* ==========================================================================
   Geometry — Unit 1: Basics of Geometry. See lab/core.js for the format and
   lab/geotools.js for the drawing kit.

   Units 1 to 4 follow CK-12 Geometry (CK-12 Foundation, CC BY-SA), a
   chapter to a unit and a section to a lesson. This is Chapter 1, sections
   1.1 to 1.8, after a readiness check. The sentences, examples, figures and
   questions are OEdu's own; the order and the ideas are the book's.

   Each lesson is taught in the same order as Algebra I and II: warm up, the
   idea (a method with named steps), a worked example to watch, one done
   together, on your own, a harder case, try it, find the error, use it,
   and the concept built at the end. Most of them also open on one or two
   things to do with your hands — drag a point, slide a slider, press a
   button — before anything is named (kicker "Explore").

   Points, lines and planes (1.1), segments and distance (1.2), rays and
   angles (1.3), segments and angles: midpoints and bisectors (1.4), angle
   pairs (1.5), classifying triangles (1.6), classifying polygons (1.7) and
   problem solving in geometry (1.8).

   Lessons carry v: 5, so a record kept from the Holt-based Unit 1 (v 4) or
   the older ones (v 1–3) does not mark these done. Skills are hg1-…

   Nine lessons, eight skills, three quizzes, and the unit test.
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
    blurb: "Before Chapter 1 · Reading a ruler, a little algebra, and the coordinate plane.",
    mins: 6, v: 5,
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
        prompt: "All right first time? Go straight to **Lesson 1.1**. If **check 2** slipped, Algebra I Unit 1 has the practice. If **check 3** slipped, lesson 1.2 includes the plane and takes it slowly.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ============================================ 1.1 · Points, lines and planes */
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
    title: "Points, lines and planes", art: "pla",
    blurb: "Section 1.1 · The three undefined terms, collinear and coplanar points, segments and rays, and where figures meet.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "An arrowhead means “this goes on for ever”. Which figure has exactly **one** endpoint?", art: FIG_KINDS,
        options: [{ t: "The one through $E$ and $F$" }, { t: "The one through $A$ and $B$", fb: "It has an arrowhead at each end: no endpoints at all." }, { t: "The one from $C$ to $D$", fb: "It stops at both ends: two endpoints." }],
        answer: 0, skill: "Lines, segments and rays", hints: ["Count the ends that stop at a dot with no arrowhead beyond it."], why: "It starts at $E$ and never stops: a ray." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag $A$, $B$ and $C$. Can you get all three onto **one line**?",
        scene: { type: "sketch", x: [0, 10], y: [0, 4.6], u: 58, axes: false, nums: false, gate: true,
          pts: { A: { at: [1.5, 1], drag: true, snap: 0.5, say: "Point A" }, B: { at: [4, 2.5], drag: true, snap: 0.5, say: "Point B" }, C: { at: [7, 1], drag: true, snap: 0.5, c: "orange", say: "Point C" } },
          draw: function (s) {
            var ok = !samePt(s.A, s.B) && Math.abs(crossOf(s.A, s.B, s.C)) < 1e-6;
            return (samePt(s.A, s.B) ? [] : [lineThru(s.A, s.B, ok ? "green" : "blue")]).concat([
              { pt: s.A, name: "A", at: "nw", c: ok ? "green" : "blue" }, { pt: s.B, name: "B", at: "nw", c: ok ? "green" : "blue" }, { pt: s.C, name: "C", at: "ne", c: ok ? "green" : "orange" }]);
          },
          readout: function (s) {
            if (samePt(s.A, s.B)) return "$A$ and $B$ are on top of each other. Pull them apart: two points are needed for a line.";
            return Math.abs(crossOf(s.A, s.B, s.C)) < 1e-6 ? "$A$, $B$ and $C$ are **collinear**: one line holds all three."
              : "$\\overleftrightarrow{AB}$ is the only line through $A$ and $B$. $C$ is **not** on it.";
          },
          goal: function (s) { return !samePt(s.A, s.B) && Math.abs(crossOf(s.A, s.B, s.C)) < 1e-6; } },
        then: "Two points always make one line. A third point is on it only when the three line up: that is what **collinear** means." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag $A$ and $B$, and press each button. The **name** changes with the figure.",
        scene: { type: "sketch", x: [0, 10], y: [0, 4.2], u: 58, grid: false, gate: true,
          pts: { A: { at: [2.5, 1.4], drag: true, snap: 0.5, say: "Point A" }, B: { at: [6.5, 2.8], drag: true, snap: 0.5, c: "orange", say: "Point B" } },
          chips: { kind: { v: "line", opts: [["line", "Line"], ["seg", "Segment"], ["rayA", "Ray from $A$"], ["rayB", "Ray from $B$"]] } },
          draw: function (s) {
            var k = s.c.kind, fig = k === "line" ? lineThru(s.A, s.B, "blue") : k === "seg" ? { seg: [s.A, s.B], c: "blue" } : k === "rayA" ? rayThru(s.A, s.B, "blue") : rayThru(s.B, s.A, "blue");
            return (samePt(s.A, s.B) ? [] : [fig]).concat([{ pt: s.A, name: "A", at: "n", c: "ink" }, { pt: s.B, name: "B", at: "n", c: "ink" }]);
          },
          readout: function (s) {
            var t = { line: "$\\overleftrightarrow{AB}$ · a **line**: it goes on both ways, so it has no endpoints.", seg: "$\\overline{AB}$ · a **segment**: it stops at $A$ and at $B$, its two endpoints.",
                      rayA: "$\\overrightarrow{AB}$ · a **ray**: it starts at $A$ and goes on through $B$.", rayB: "$\\overrightarrow{BA}$ · a **ray**: it starts at $B$ and goes on through $A$." }[s.c.kind];
            return t + "<br><span class='gt-dim'>Tried " + Object.keys(s.seen.kind).length + " of 4</span>";
          },
          goal: function (s) { return Object.keys(s.seen.kind).length >= 4; } },
        then: "The bar or the arrows over the letters say what the figure is. A ray is named from its endpoint, so $\\overrightarrow{AB}$ and $\\overrightarrow{BA}$ are different rays." },
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
  /* ============================================ 1.2 · Segments and distance */
  var HOW_1_2 = [["Draw", "Sketch the segment and mark the lengths you know."],
                 ["Equation", "Write how the lengths are related: the parts add up to the whole."],
                 ["Solve", "Solve, then answer what was asked."]];
  var HOW_1_2G = [["Read", "Read the two coordinates that change."],
                  ["Subtract", "Subtract one from the other, and drop any minus sign."],
                  ["Say", "Write the distance with its units."]];
  var G12A = [-3, 2], G12B = [4, 2];
  LESSONS.push({
    title: "Segments and distance", art: "seg",
    blurb: "Section 1.2 · Measuring with a ruler, the Ruler Postulate, the Segment Addition Postulate, and distance on a grid.",
    mins: 14, v: 5,
    steps: [
      { type: "sketch", kicker: "Warm up", prompt: "The length of a segment is the distance between its endpoints. Drag $B$ until $AB = 4.5$ cm.",
        ruler: { unit: "cm", div: 10, len: 6 },
        pts: { B: { at: [2, 0], drag: true, snap: 0.1, on: { seg: [[0.6, 0], [5.9, 0]] }, say: "Point B" } },
        draw: function (s) { return [{ rseg: [0, s.B[0]], names: ["A", "B"] }]; },
        readout: function (s) { return "$AB = " + n1(s.B[0]) + "$ cm"; },
        goal: function (s) { return Math.abs(s.B[0] - 4.5) < 1e-6; },
        answer: { B: [4.5, 0] }, skill: "Measure a segment",
        hints: ["Each small mark is one tenth of a centimetre.", "4.5 is half-way between the 4 and the 5."], why: "$A$ is at 0 and $B$ at 4.5, so $AB = 4.5$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide **both** ends along the ruler. The segment does not have to start at 0. Try three different places.",
        scene: { type: "sketch", ruler: { unit: "cm", div: 2, len: 10 }, gate: true,
          pts: { A: { at: [2, 0], drag: true, snap: 0.5, on: { seg: [[0.4, 0], [9.8, 0]] }, say: "Point A" }, B: { at: [7, 0], drag: true, snap: 0.5, c: "orange", on: { seg: [[0.4, 0], [9.8, 0]] }, say: "Point B" } },
          draw: function (s) { return [{ rseg: [Math.min(s.A[0], s.B[0]), Math.max(s.A[0], s.B[0])], names: ["A", "B"] }]; },
          readout: function (s) { return "$A$ reads $" + n1(s.A[0]) + "$ and $B$ reads $" + n1(s.B[0]) + "$ · $AB = |" + n1(s.B[0]) + " - " + n1(s.A[0]) + "| = " + n1(Math.abs(s.B[0] - s.A[0])) + "$ cm"; },
          log: { need: 3, cols: [{ h: "$A$ reads", f: function (s) { return "$" + n1(s.A[0]) + "$"; } }, { h: "$B$ reads", f: function (s) { return "$" + n1(s.B[0]) + "$"; } }, { h: "$AB$", f: function (s) { return "$" + n1(Math.abs(s.B[0] - s.A[0])) + "$ cm"; } }] } },
        then: "That is the **Ruler Postulate**: the distance between two points is the absolute value of the difference of their readings. Where you start does not matter." },
      { type: "learn", kicker: "Explore",
        prompt: "$B$ is between $A$ and $C$. Drag $B$, and then drag $A$ or $C$. Watch the parts and the whole.",
        scene: { type: "sketch", x: [0, 12], y: [0, 2.6], u: 48, grid: false, gate: true,
          pts: { A: { at: [1, 1.2], drag: true, snap: 0.5, on: { fn: function (p, s) { return [Math.max(0.5, Math.min(Math.round(p[0] * 2) / 2, s.B[0] - 0.5)), 1.2]; } }, say: "Point A" },
                 C: { at: [11, 1.2], drag: true, snap: 0.5, on: { fn: function (p, s) { return [Math.min(11.5, Math.max(Math.round(p[0] * 2) / 2, s.B[0] + 0.5)), 1.2]; } }, say: "Point C" },
                 B: { at: [4, 1.2], drag: true, snap: 0.5, c: "orange", on: { seg: ["A", "C"], inset: 0.02 }, say: "Point B" } },
          draw: function (s) {
            var ab = Math.abs(s.B[0] - s.A[0]), bc = Math.abs(s.C[0] - s.B[0]);
            return [{ seg: [s.A, s.B], c: "blue" }, { seg: [s.B, s.C], c: "green" }, { len: n1(ab), seg: [s.A, s.B], side: 1, off: 18, c: "blue" }, { len: n1(bc), seg: [s.B, s.C], side: 1, off: 18, c: "green" },
              { pt: s.A, name: "A", at: "s" }, { pt: s.B, name: "B", at: "s", c: "orange" }, { pt: s.C, name: "C", at: "s" }];
          },
          readout: function (s) { var ab = Math.abs(s.B[0] - s.A[0]), bc = Math.abs(s.C[0] - s.B[0]); return "$AB + BC = " + n1(ab) + " + " + n1(bc) + " = " + n1(ab + bc) + "$ · $AC = " + n1(Math.abs(s.C[0] - s.A[0])) + "$"; },
          log: { need: 3, cols: [{ h: "$AB$", f: function (s) { return "$" + n1(Math.abs(s.B[0] - s.A[0])) + "$"; } }, { h: "$BC$", f: function (s) { return "$" + n1(Math.abs(s.C[0] - s.B[0])) + "$"; } },
                  { h: "$AB + BC$", f: function (s) { return "$" + n1(Math.abs(s.C[0] - s.A[0])) + "$"; } }, { h: "$AC$", f: function (s) { return "$" + n1(Math.abs(s.C[0] - s.A[0])) + "$"; } }] } },
        then: "The two columns match every time. That is the **Segment Addition Postulate**: if $B$ is between $A$ and $C$, then $AB + BC = AC$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **length** of $\\overline{AB}$ is written $AB$. The **Ruler Postulate** says you find it by subtracting the readings and dropping any minus sign. The **Segment Addition Postulate** says that if $B$ is between $A$ and $C$, the parts add up to the whole: $AB + BC = AC$.",
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
        prompt: "$B$ is between $A$ and $C$. $AB = 2x + 3$, $BC = 3x - 2$ and $AC = 31$. Now you find $BC$.",
        art: segRow([["A", 0], ["B", 3.3], ["C", 6.6]], { over: [[0, 1, "2x + 3"], [1, 2, "3x - 2"]], under: [[0, 2, "31"]] }),
        how: HOW_1_2, skill: "Segment Addition",
        steps: [
          { step: 1, ask: "Which segment is the **whole**?", type: "choice", answer: 0,
            options: [{ t: "$\\overline{AC}$: it runs from end to end" }, { t: "$\\overline{AB}$", fb: "$\\overline{AB}$ is only the first part." }],
            m: "AC = 31", say: "The whole is the segment from $A$ to $C$." },
          { step: 2, ask: "Which equation says the parts add to the whole?", type: "choice", answer: 0,
            options: [{ t: "$(2x + 3) + (3x - 2) = 31$" }, { t: "$2x + 3 = 3x - 2$", fb: "That would make the two parts equal, which only a midpoint does." }],
            m: "(2x + 3) + (3x - 2) = 31", say: "$AB + BC = AC$." },
          { step: 3, ask: "Solve it. What is $x$?", type: "num", answer: 6, near: [{ v: 5.6, tol: 0.01, fb: "Combine first: $5x + 1 = 31$." }], hint: "$5x + 1 = 31$, so $5x = 30$.",
            m: "x = 6", say: "$5x + 1 = 31$, so $5x = 30$." },
          { step: 3, ask: "The question asked for $BC = 3x - 2$. What is $BC$?", type: "num", answer: 16, near: [{ v: 6, fb: "That is $x$. Put it back into $3x - 2$." }], hint: "$3(6) - 2$.",
            m: "BC = 3(6) - 2 = 16", say: "$BC = 16$. Check: $AB = 15$ and $15 + 16 = 31$." }],
        why: "Draw, equation, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$B$ is between $A$ and $C$. $AB = 7$ and $AC = 19$. Find $BC$.",
        art: segRow([["A", 0], ["B", 2.4], ["C", 6.6]], { over: [[0, 1, "7"], [1, 2, "?"]], under: [[0, 2, "19"]] }),
        answer: 12, skill: "Segment Addition",
        near: [{ v: 26, fb: "$AC$ is the whole. Subtract the part you know." }], hints: ["$7 + BC = 19$."], why: "$19 - 7 = 12$." },
      { type: "sketch", kicker: "On your own", prompt: "$A$ is at $(-2, 1)$. Drag $B$ up or down the line $x = -2$ until $AB = 6$.",
        x: [-5, 5], y: [-6, 8], u: 32,
        pts: { B: { at: [-2, 4], drag: true, snap: 1, on: { x: -2 }, c: "orange", say: "Point B" } },
        draw: function (s) { return [{ seg: [[-2, 1], s.B], c: "blue" }, { pt: [-2, 1], name: "A", at: "e" }, { pt: s.B, name: "B", at: "e", c: "orange" }]; },
        readout: function (s) { return "$B = (-2, " + num(s.B[1]) + ")$ · $AB = |" + num(s.B[1]) + " - 1| = " + num(Math.abs(s.B[1] - 1)) + "$"; },
        goal: function (s) { return Math.abs(s.B[1] - 1) === 6; },
        fb: function (s) { return Math.abs(s.B[1] - 1) < 6 ? "Too short. Move $B$ further from $A$." : "Too long. Move $B$ closer to $A$."; },
        answer: { B: [-2, 7] }, skill: "Distance on a grid",
        hints: ["The points line up vertically, so only the $y$-values change.", "$|y - 1| = 6$ has two answers: $y = 7$ or $y = -5$."], why: "$|7 - 1| = 6$. $B$ at $(-2, -5)$ also works: $|-5 - 1| = 6$." },
      { type: "learn", kicker: "A harder case",
        prompt: "On a grid, two points that line up side to side differ only in $x$. Watch the distance from $(-3, 2)$ to $(4, 2)$ found.",
        scene: { type: "walk", how: HOW_1_2G, rows: [
          { step: 1, m: "(-3, 2) \\quad (4, 2)", say: "Same $y$-value: the points line up side to side, so only $x$ changes.",
            fig: grid([-5, 6], [-1, 5], [{ seg: [G12A, G12B], c: "blue" }, { pt: G12A, name: "A", at: "n" }, { pt: G12B, name: "B", at: "n" }], { u: 30, alt: "The points A(−3, 2) and B(4, 2) joined by a horizontal segment on a grid." }) },
          { step: 2, m: "|4 - (-3)| = 7", say: "Subtract the $x$-values, then drop any minus sign.",
            ask: { prompt: "Which numbers do you subtract?", answer: 0,
                   options: [{ t: "The $x$-values: they are the ones that change" }, { t: "The $y$-values", fb: "Both are 2. Nothing changes up and down." }] } },
          { step: 3, m: "AB = 7 \\text{ units}", say: "The distance is 7 units." }] },
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
  /* ================================================ 1.3 · Rays and angles */
  var HOW_1_3 = [["Parts", "Name the whole angle and the parts a ray cuts it into."],
                 ["Equation", "Write how they are related: the parts add up to the whole."],
                 ["Solve", "Solve, then answer what was asked."]];
  var HOW_1_3P = [["Read", "Read where each side crosses the same scale."],
                  ["Subtract", "Subtract one reading from the other, and drop any minus sign."],
                  ["Say", "Write the measure with its degree sign."]];
  var FIG_AOC = rayFig([0, 0], [{ d: 0, name: "A" }, { d: 40, name: "B" }, { d: 105, name: "C" }],
    { vname: "O", wedges: [{ i: 0, j: 1, say: "40°" }, { i: 1, j: 2, say: "x", c: "green", r: 30 }], alt: "Rays OA, OB and OC from O. Angle AOB is 40 degrees, and angle BOC is marked x." });
  var O13 = [0, 0];
  LESSONS.push({
    title: "Rays and angles", art: "ang",
    blurb: "Section 1.3 · Rays, naming and classifying angles, the protractor, and the Angle Addition Postulate.",
    mins: 14, v: 5,
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
      { type: "learn", kicker: "Explore",
        prompt: "Open and close the angle. There are **four** kinds. Can you find them all?",
        scene: { type: "sketch", x: [-3.7, 3.7], y: [-0.7, 3.5], u: 56, grid: false, gate: true,
          pts: { P: { at: GT.polar(O13, 2.7, 40), drag: true, c: "orange", on: { circle: [O13, 2.7], snapDeg: 1, range: [4, 180] }, say: "The turning ray" } },
          track: function (s) { var a = Math.round(GT.dir(O13, s.P)); return a >= 180 ? "straight" : a === 90 ? "right" : a > 90 ? "obtuse" : "acute"; },
          draw: function (s) {
            var a = Math.min(180, Math.round(GT.dir(O13, s.P))), kind = a >= 180 ? "straight" : a === 90 ? "right" : a > 90 ? "obtuse" : "acute";
            var col = { acute: "blue", right: "green", obtuse: "purple", straight: "orange" }[kind];
            return [{ angle: [[1, 0], O13, GT.polar(O13, 1, a)], say: a + "°", r: 38, c: col, right: a === 90 },
              { dline: [O13, [3.3, 0]], ray: true }, { dline: [O13, GT.polar(O13, 3.3, a)], ray: true, c: "orange" },
              { pt: O13, name: "B", at: "s" }, { pt: [2.6, 0], name: "A", at: "s" }, { pt: GT.polar(O13, 2.6, a), name: "C", at: a > 150 ? "s" : "n" }];
          },
          readout: function (s) {
            var a = Math.min(180, Math.round(GT.dir(O13, s.P))), kind = a >= 180 ? "straight" : a === 90 ? "right" : a > 90 ? "obtuse" : "acute";
            return "$m\\angle ABC = " + a + "°$ · **" + kind + "**<br>" + found([["acute", "Acute"], ["right", "Right"], ["obtuse", "Obtuse"], ["straight", "Straight"]], s.tracked);
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        then: "**Acute** is less than 90°, **right** is exactly 90°, **obtuse** is between 90° and 180°, and **straight** is exactly 180°: its sides make a line." },
      { type: "learn", kicker: "Explore",
        prompt: "$\\overrightarrow{OA}$ and $\\overrightarrow{OC}$ stay put. Drag $\\overrightarrow{OB}$ **between** them, and a few times outside.",
        scene: { type: "sketch", x: [-3.7, 3.7], y: [-0.7, 3.5], u: 56, grid: false, gate: true,
          pts: { B: { at: GT.polar(O13, 2.7, 45), drag: true, c: "orange", on: { circle: [O13, 2.7], snapDeg: 1, range: [0, 180] }, say: "Ray OB" } },
          draw: function (s) {
            var b = Math.round(GT.dir(O13, s.B)), inside = b > 0 && b < 120;
            var items = [{ dline: [O13, [3.3, 0]], ray: true }, { dline: [O13, GT.polar(O13, 3.3, 120)], ray: true }, { dline: [O13, GT.polar(O13, 3.3, b)], ray: true, c: "orange" },
              { pt: O13, name: "O", at: "s" }, { pt: [2.6, 0], name: "A", at: "s" }, { pt: GT.polar(O13, 2.6, 120), name: "C", at: "n" }, { pt: GT.polar(O13, 2.6, b), name: "B", at: b > 140 ? "w" : "n", c: "orange" }];
            if (inside) items.unshift({ angle: [[1, 0], O13, GT.polar(O13, 1, b)], say: b + "°", r: 34, c: "blue" }, { angle: [GT.polar(O13, 1, b), O13, GT.polar(O13, 1, 120)], say: (120 - b) + "°", r: 56, c: "green" });
            return items;
          },
          readout: function (s) {
            var b = Math.round(GT.dir(O13, s.B));
            return b > 0 && b < 120 ? "$m\\angle AOB + m\\angle BOC = " + b + "° + " + (120 - b) + "° = 120° = m\\angle AOC$"
              : "$\\overrightarrow{OB}$ is **outside** $\\angle AOC$: the parts do not add up to $m\\angle AOC$.";
          },
          log: { need: 3, when: function (s) { var b = Math.round(GT.dir(O13, s.B)); return b > 0 && b < 120; },
                 cols: [{ h: "$m\\angle AOB$", f: function (s) { return "$" + Math.round(GT.dir(O13, s.B)) + "°$"; } }, { h: "$m\\angle BOC$", f: function (s) { return "$" + (120 - Math.round(GT.dir(O13, s.B))) + "°$"; } },
                         { h: "sum", f: function () { return "$120°$"; } }, { h: "$m\\angle AOC$", f: function () { return "$120°$"; } }] } },
        then: "When $\\overrightarrow{OB}$ is inside the angle, the parts always add up to the whole: the **Angle Addition Postulate**." },
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
        prompt: "$\\overrightarrow{QS}$ lies inside $\\angle PQR$. $m\\angle PQR = 118°$, $m\\angle PQS = (4x - 6)°$ and $m\\angle SQR = (2x + 4)°$. Now you find $m\\angle SQR$.",
        art: rayFig([0, 0], [{ d: 0, name: "R" }, { d: 44, name: "S" }, { d: 118, name: "P" }], { vname: "Q", wedges: [{ i: 0, j: 1, say: "(2x + 4)°", c: "green", r: 34 }, { i: 1, j: 2, say: "(4x − 6)°", r: 48 }], alt: "Ray QS between rays QR and QP. Angle PQR is 118 degrees. The two parts are marked (2x + 4) and (4x − 6) degrees." }),
        how: HOW_1_3, skill: "Angle Addition",
        steps: [
          { step: 1, ask: "Which angle is the whole?", type: "choice", answer: 0,
            options: [{ t: "$\\angle PQR$, the big one" }, { t: "$\\angle SQR$", fb: "$\\angle SQR$ is one of the two parts." }],
            m: "m\\angle PQR = 118°", say: "$\\overrightarrow{QS}$ is inside it, so the other two are its parts." },
          { step: 2, ask: "Which equation says the parts add to the whole?", type: "choice", answer: 0,
            options: [{ t: "$(4x - 6) + (2x + 4) = 118$" }, { t: "$4x - 6 = 2x + 4$", fb: "That would make the parts equal. Nothing says $\\overrightarrow{QS}$ is a bisector." }],
            m: "(4x - 6) + (2x + 4) = 118", say: "The parts add up to the whole." },
          { step: 3, ask: "Solve it. What is $x$?", type: "num", answer: 20, near: [{ v: 19.67, tol: 0.01, fb: "Combine first: $6x - 2 = 118$." }], hint: "$6x - 2 = 118$, so $6x = 120$.",
            m: "x = 20", say: "$6x - 2 = 118$, so $6x = 120$." },
          { step: 3, ask: "The question asked for $m\\angle SQR = 2x + 4$. What is it?", type: "num", answer: 44, near: [{ v: 20, fb: "That is $x$. Put it back into $2x + 4$." }], hint: "$2(20) + 4$.",
            m: "m\\angle SQR = 2(20) + 4 = 44°", say: "Check: $m\\angle PQS = 4(20) - 6 = 74°$ and $74 + 44 = 118$." }],
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
        prompt: "A protractor works like a ruler: you do not have to start at 0. Watch an angle read from two marks.",
        scene: { type: "walk", how: HOW_1_3P, rows: [
          { step: 1, m: "25° \\quad 110°", say: "Side $\\overrightarrow{OA}$ crosses 25 and side $\\overrightarrow{OB}$ crosses 110, on the **same** scale.",
            fig: GT.protractor({ a: 25, b: 110, names: ["A", "O", "B"], w: 360, alt: "A protractor with an angle whose sides cross 25 and 110 on the outer scale." }) },
          { step: 2, m: "|110 - 25| = 85", say: "Subtract the readings, then drop any minus sign.",
            ask: { prompt: "Why do we subtract?", answer: 0,
                   options: [{ t: "The angle is the gap between the two marks" }, { t: "To find the bigger mark", fb: "We want the size of the opening between them." }] } },
          { step: 3, m: "m\\angle AOB = 85°", say: "The angle measures 85°: acute." }] },
        gate: true, then: "This is the **Protractor Postulate**: the measure of an angle is the absolute value of the difference of its readings." },
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
  /* =========================================== 1.4 · Segments and angles */
  var HOW_1_4 = [["Mark", "Mark what is equal: the two halves of a segment, or the two parts of an angle."],
                 ["Equation", "Set the two equal halves equal to each other."],
                 ["Solve", "Solve, then answer what was asked."]];
  var HOW_1_4G = [["Set up", "Call the unknown end $(x, y)$ and write the midpoint rule for each coordinate."],
                  ["Solve $x$", "The $x$ of the midpoint is the average of the two $x$-values."],
                  ["Solve $y$", "The $y$ of the midpoint is the average of the two $y$-values."]];
  var M14A = [-3, 4], M14B = [5, 0], M14M = [1, 2];
  LESSONS.push({
    title: "Segments and angles", art: "sega",
    blurb: "Section 1.4 · Congruent segments and angles, midpoints and bisectors, and finding a midpoint on a grid.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "On a number line, which number is half-way between 2 and 10?", answer: 6, skill: "Midpoint",
        near: [{ v: 4, fb: "That is half the distance between them. The half-way point is $2 + 4$." }, { v: 12, fb: "Add them, then halve: the average." }], hints: ["The average of 2 and 10."], why: "$\\frac{2 + 10}{2} = 6$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $M$ along $\\overline{AB}$. Find the spot that cuts it into two **equal** halves.",
        scene: { type: "sketch", x: [0, 12], y: [0, 2.6], u: 48, grid: false, gate: true,
          pts: { M: { at: [3, 1.2], drag: true, snap: 0.5, c: "orange", on: { seg: [[1, 1.2], [11, 1.2]], inset: 0.02 }, say: "Point M" } },
          draw: function (s) {
            var am = s.M[0] - 1, mb = 11 - s.M[0], eq = am === mb, c = eq ? "green" : "blue";
            return [{ seg: [[1, 1.2], s.M], c: c, marks: eq ? 1 : 0 }, { seg: [s.M, [11, 1.2]], c: c, marks: eq ? 1 : 0 },
              { len: n1(am), seg: [[1, 1.2], s.M], side: 1, off: 18, c: c }, { len: n1(mb), seg: [s.M, [11, 1.2]], side: 1, off: 18, c: c },
              { pt: [1, 1.2], name: "A", at: "s" }, { pt: [11, 1.2], name: "B", at: "s" }, { pt: s.M, name: "M", at: "s", c: eq ? "green" : "orange" }];
          },
          readout: function (s) {
            var am = s.M[0] - 1, mb = 11 - s.M[0];
            return am === mb ? "$AM = MB = " + n1(am) + "$ · $M$ is the **midpoint**, and $\\overline{AM} \\cong \\overline{MB}$." : "$AM = " + n1(am) + "$ and $MB = " + n1(mb) + "$: not equal yet.";
          },
          goal: function (s) { return s.M[0] - 1 === 11 - s.M[0]; } },
        then: "A **midpoint** cuts a segment into two **congruent** parts. Any point, line or ray that does this is a **bisector** of the segment." },
      { type: "learn", kicker: "Explore",
        prompt: "$\\overrightarrow{OA}$ and $\\overrightarrow{OC}$ stay put. Turn $\\overrightarrow{OB}$ until it cuts $\\angle AOC$ into two **equal** angles.",
        scene: { type: "sketch", x: [-3.7, 3.7], y: [-0.7, 3.5], u: 56, grid: false, gate: true,
          pts: { B: { at: GT.polar([0, 0], 2.7, 28), drag: true, c: "orange", on: { circle: [[0, 0], 2.7], snapDeg: 1, range: [0, 100] }, say: "Ray OB" } },
          draw: function (s) {
            var O = [0, 0], b = Math.round(GT.dir(O, s.B)), eq = b === 50, c = eq ? "green" : "blue";
            var items = [{ dline: [O, [3.3, 0]], ray: true }, { dline: [O, GT.polar(O, 3.3, 100)], ray: true }, { dline: [O, GT.polar(O, 3.3, b)], ray: true, c: eq ? "green" : "orange" },
              { pt: O, name: "O", at: "s" }, { pt: [2.6, 0], name: "A", at: "s" }, { pt: GT.polar(O, 2.6, 100), name: "C", at: "n" }, { pt: GT.polar(O, 2.6, b), name: "B", at: "e", c: eq ? "green" : "orange" }];
            if (b > 0 && b < 100) items.unshift({ angle: [[1, 0], O, GT.polar(O, 1, b)], say: b + "°", r: 36, c: c }, { angle: [GT.polar(O, 1, b), O, GT.polar(O, 1, 100)], say: (100 - b) + "°", r: 58, c: c });
            if (eq) items.push({ amarks: [[1, 0], O, GT.polar(O, 1, 50)], n: 1, r: 26 }, { amarks: [GT.polar(O, 1, 50), O, GT.polar(O, 1, 100)], n: 1, r: 26 });
            return items;
          },
          readout: function (s) {
            var b = Math.round(GT.dir([0, 0], s.B));
            return b === 50 ? "$m\\angle AOB = m\\angle BOC = 50°$ · $\\overrightarrow{OB}$ **bisects** $\\angle AOC$, and the two angles are congruent." : "$m\\angle AOB = " + b + "°$ and $m\\angle BOC = " + (100 - b) + "°$: not equal yet.";
          },
          goal: function (s) { return Math.round(GT.dir([0, 0], s.B)) === 50; } },
        then: "An **angle bisector** cuts an angle into two **congruent** angles. The matching arcs in the picture say they are equal." },
      { type: "learn", kicker: "The idea",
        prompt: "Segments with equal lengths are **congruent**, written $\\overline{AB} \\cong \\overline{CD}$. A **midpoint** cuts a segment into two congruent parts, and an **angle bisector** cuts an angle into two congruent angles. Either way, the two parts are **equal**: that gives an equation.",
        scene: { type: "method", how: HOW_1_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "$M$ is the midpoint of $\\overline{PQ}$. $PM = 5x - 2$ and $MQ = 3x + 10$. Watch $PQ$ found.",
        scene: { type: "walk", how: HOW_1_4, rows: [
          { step: 1, m: "PM = 5x - 2 \\quad MQ = 3x + 10", say: "The tick marks show the two halves are congruent.",
            fig: segRow([["P", 0], ["M", 3.3], ["Q", 6.6]], { over: [[0, 1, "5x - 2"], [1, 2, "3x + 10"]], ticks: [[0, 1, 1], [1, 2, 1]] }) },
          { step: 2, m: "5x - 2 = 3x + 10", say: "Equal halves: set the two expressions equal.",
            ask: { prompt: "Why are they equal?", answer: 0,
                   options: [{ t: "$M$ is the midpoint" }, { t: "$M$ is between $P$ and $Q$", fb: "Between is not enough. Only a midpoint makes the parts equal." }] } },
          { step: 3, m: "2x = 12", say: "Subtract $3x$ and add 2." },
          { step: 3, m: "x = 6", say: "Divide by 2." },
          { step: 3, m: "PQ = 28 + 28 = 56", say: "$PM = 5(6) - 2 = 28$, and the other half is 28 too: $PQ = 56$." }] },
        gate: true, then: "Check: $MQ = 3(6) + 10 = 28$. Equal, as a midpoint needs." },
      { type: "guided", kicker: "Together",
        prompt: "$\\overrightarrow{QS}$ **bisects** $\\angle PQR$. $m\\angle PQS = (5x - 4)°$ and $m\\angle SQR = (3x + 10)°$. Now you find $m\\angle PQR$.",
        art: rayFig([0, 0], [{ d: 0, name: "R" }, { d: 31, name: "S" }, { d: 62, name: "P" }], { vname: "Q", marks: [{ i: 0, j: 1 }, { i: 1, j: 2 }], alt: "Ray QS between rays QR and QP, with the two angles it makes marked as equal." }),
        how: HOW_1_4, skill: "Angle bisectors",
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
        why: "Mark, equation, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$M$ is the midpoint of $\\overline{RS}$, and $RS = 26$. Find $RM$.", answer: 13, skill: "Midpoints",
        near: [{ v: 52, fb: "A midpoint halves the segment. It does not double it." }], hints: ["Half of 26."], why: "$26 \\div 2 = 13$." },
      { type: "plane", kicker: "On your own", prompt: "$A(-3, 4)$ and $B(5, 0)$ are the ends of a segment. Click its **midpoint**.",
        x: [-6, 6], y: [-3, 6], click: "point", marks: [{ x: -3, y: 4, label: "A" }, { x: 5, y: 0, label: "B" }], segs: [[-3, 4, 5, 0, "blue"]],
        answer: { point: M14M }, skill: "Midpoint on a grid",
        clickFb: function (c) { return c && c[0] === 2 && c[1] === 2 ? "That is $(2, 2)$: close, but check the $x$: half-way between $-3$ and $5$ is $1$." : "Average the $x$-values, then average the $y$-values."; },
        hints: ["Half-way between $-3$ and $5$ across: $\\frac{-3 + 5}{2}$.", "Half-way between 4 and 0 up: $\\frac{4 + 0}{2}$."], why: "$\\left(\\frac{-3 + 5}{2}, \\frac{4 + 0}{2}\\right) = (1, 2)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "$M(1, 2)$ is the midpoint of $\\overline{AB}$, and $A$ is $(-3, 4)$. Watch the other end, $B$, found.",
        scene: { type: "walk", how: HOW_1_4G, rows: [
          { step: 1, m: "A(-3, 4) \\quad M(1, 2) \\quad B(x, y)", say: "$M$ is half-way, so each of its coordinates is the average of the ends'.",
            fig: grid([-5, 7], [-1, 6], [{ seg: [M14A, M14B], c: "blue", dash: true }, { pt: M14A, name: "A", at: "n" }, { pt: M14M, name: "M", at: "n", c: "orange" }, { pt: M14B, name: "B?", at: "n", open: true }], { u: 28, alt: "A on the left, M half-way along, and the other end B still to be found." }) },
          { step: 2, m: "\\frac{-3 + x}{2} = 1", say: "Average the $x$-values and set it equal to $M$'s $x$.",
            ask: { prompt: "What is $x$?", answer: 0, options: [{ t: "5" }, { t: "2", fb: "Multiply both sides by 2: $-3 + x = 2$, so $x = 5$." }] } },
          { step: 2, m: "x = 5", say: "$-3 + x = 2$, so $x = 5$." },
          { step: 3, m: "\\frac{4 + y}{2} = 2", say: "Do the same for the $y$-values." },
          { step: 3, m: "y = 0", say: "$4 + y = 4$, so $y = 0$: $B = (5, 0)$." }] },
        gate: true, then: "Check: the average of $-3$ and $5$ is 1, and the average of 4 and 0 is 2. That is $M$." },
      { type: "choice", kicker: "Try it", prompt: "$AB = 8$ cm and $CD = 8$ cm. Which statement is written correctly?",
        options: [{ t: "$\\overline{AB} \\cong \\overline{CD}$ and $AB = CD$" }, { t: "$\\overline{AB} = \\overline{CD}$", fb: "Segments are congruent, not equal. It is their **lengths** that are equal." }, { t: "$AB \\cong CD$", fb: "A length is a number, and numbers are equal, not congruent." }],
        answer: 0, skill: "Congruent or equal", hints: ["Congruent goes with figures. Equal goes with numbers."], why: "Figures are congruent ($\\cong$); their measures are equal ($=$)." },
      { type: "choice", kicker: "Find the error",
        prompt: "A ray bisects a 70° angle. Max says the two angles measure 140° each. What is wrong?",
        options: [{ t: "To bisect is to cut in half, so each part is 35°." }, { t: "Each part should be 70°.", fb: "Two 70° angles would make 140°, not 70°." }, { t: "Nothing. It is right.", fb: "The parts must add up to the whole, 70°, not 280°." }],
        answer: 0, skill: "Angle bisectors", hints: ["The two parts must add up to the whole angle."], why: "$70 \\div 2 = 35$, and $35 + 35 = 70$." },
      { type: "num", kicker: "Use it", prompt: "A zipline cable from tower $A$ to tower $B$ is 84 m long. A platform stands at its midpoint. How far is the platform from tower $B$?",
        post: "m", answer: 42, skill: "Midpoints",
        near: [{ v: 168, fb: "A midpoint halves the cable. It does not double it." }], hints: ["Half of 84."], why: "$84 \\div 2 = 42$." }
    ]
  });
  /* ======================================================= 1.5 · Angle pairs */
  var HOW_1_5 = [["Pair", "Decide how the angles are related: complementary (sum 90°), supplementary (sum 180°) or vertical (equal)."],
                 ["Equation", "Write that relation as an equation."],
                 ["Solve", "Solve, then find the measure that was asked for."]];
  // What two tapped angles (1–5 round a point) are to each other: sectors of 0–50, 50–120, 120–180, 180–230, 230–360 degrees.
  var SECT15 = { 1: [0, 50], 2: [50, 120], 3: [120, 180], 4: [180, 230], 5: [230, 360] };
  function pairKind(s) {
    if (s.selList.length < 2) return "";
    var a = SECT15[s.selList[0]], b = SECT15[s.selList[1]], share = a[1] === b[0] || b[1] === a[0] || (a[0] === 0 && b[1] === 360) || (b[0] === 0 && a[1] === 360);
    var opp = Math.abs(a[0] - b[0]) === 180 && Math.abs(a[1] - b[1]) === 180;
    if (opp) return "vertical angles";
    if (share) return (a[1] - a[0]) + (b[1] - b[0]) === 180 ? "a linear pair" : "adjacent, but not a linear pair";
    return "not a special pair";
  }
  LESSONS.push({
    title: "Angle pairs", art: "pair",
    blurb: "Section 1.5 · Complementary and supplementary angles, the Linear Pair Postulate, adjacent angles and vertical angles.",
    mins: 15, v: 5,
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
      { type: "learn", kicker: "Explore",
        prompt: "$\\overrightarrow{OA}$ and $\\overrightarrow{OC}$ stay put. Drag $\\overrightarrow{OB}$, then press the other button. How do the two angles change?",
        scene: { type: "sketch", x: [-3.7, 3.7], y: [-0.7, 3.5], u: 56, grid: false, gate: true,
          pts: { Bc: { at: GT.polar([0, 0], 2.7, 35), drag: true, c: "orange", on: { circle: [[0, 0], 2.7], snapDeg: 1, range: [1, 89] }, hide: function (s) { return s.c.kind !== "comp"; }, say: "Ray OB" },
                 Bs: { at: GT.polar([0, 0], 2.7, 70), drag: true, c: "orange", on: { circle: [[0, 0], 2.7], snapDeg: 1, range: [1, 179] }, hide: function (s) { return s.c.kind !== "supp"; }, say: "Ray OB" } },
          chips: { kind: { v: "comp", opts: [["comp", "Complementary pair"], ["supp", "Supplementary pair"]] } },
          draw: function (s) {
            var O = [0, 0], comp = s.c.kind === "comp", tot = comp ? 90 : 180, b = Math.round(GT.dir(O, comp ? s.Bc : s.Bs));
            return [{ angle: [[1, 0], O, GT.polar(O, 1, b)], say: b + "°", r: 34, c: "blue" }, { angle: [GT.polar(O, 1, b), O, GT.polar(O, 1, tot)], say: (tot - b) + "°", r: 56, c: "green", right: false },
              { dline: [O, [3.3, 0]], ray: true }, { dline: [O, GT.polar(O, 3.3, tot)], ray: true }, { dline: [O, GT.polar(O, 3.3, b)], ray: true, c: "orange" },
              { pt: O, name: "O", at: "s" }, { pt: [2.6, 0], name: "A", at: "s" }, { pt: GT.polar(O, 2.6, tot), name: "C", at: comp ? "n" : "w" }, { pt: GT.polar(O, 2.6, b), name: "B", at: "e", c: "orange" }].concat(comp ? [{ angle: [[1, 0], O, [0, 1]], right: true, r: 14, c: "ink" }] : []);
          },
          readout: function (s) {
            var O = [0, 0], comp = s.c.kind === "comp", tot = comp ? 90 : 180, b = Math.round(GT.dir(O, comp ? s.Bc : s.Bs));
            return "$" + b + "° + " + (tot - b) + "° = " + tot + "°$ · " + (comp ? "**complementary**: they add up to 90°" : "**supplementary**: they add up to 180°");
          },
          goal: function (s) { return Object.keys(s.seen.kind).length >= 2; } },
        then: "**Complementary** angles add up to 90° (a right angle). **Supplementary** angles add up to 180° (a straight angle). Each one is the other's missing piece." },
      { type: "learn", kicker: "Explore",
        prompt: "Tap **any two** angles. The picture says how they are related. Can you find a **linear pair** and a pair of **vertical angles**?",
        scene: { type: "sketch", x: [-3.7, 3.7], y: [-3.4, 3.4], u: 50, grid: false, gate: true,
          taps: { "1": { at: GT.polar([0, 0], 1.55, 25), label: "1", r: 17 }, "2": { at: GT.polar([0, 0], 1.55, 82), label: "2", r: 17 }, "3": { at: GT.polar([0, 0], 1.55, 150), label: "3", r: 17 },
                  "4": { at: GT.polar([0, 0], 1.55, 205), label: "4", r: 17 }, "5": { at: GT.polar([0, 0], 1.55, 295), label: "5", r: 17 } }, maxSel: 2,
          track: function (s) { return pairKind(s); },
          draw: function (s) {
            var O = [0, 0], R = { 1: [0, 50], 2: [50, 120], 3: [120, 180], 4: [180, 230], 5: [230, 360] }, items = [];
            s.selList.forEach(function (k, i) { items.push({ angle: [GT.polar(O, 1, R[k][0]), O, GT.polar(O, 1, R[k][1])], r: 70 + i * 6, c: i ? "green" : "orange" }); });
            [0, 50, 120, 180, 230].forEach(function (d) { items.push({ dline: [O, GT.polar(O, 3.2, d)], ray: true, c: d === 120 ? "purple" : "ink" }); });
            items.push({ dline: [O, GT.polar(O, 3.2, 0)], ray: true }, { pt: O });
            return items;
          },
          readout: function (s) {
            return (s.selList.length < 2 ? "Tap two angles." : "$\\angle " + s.selList[0] + "$ and $\\angle " + s.selList[1] + "$: **" + pairKind(s) + "**") + "<br>" +
              found([["vertical angles", "Vertical angles"], ["a linear pair", "A linear pair"]], s.tracked);
          },
          goal: function (s) { return s.tracked["vertical angles"] && s.tracked["a linear pair"]; } },
        then: "**Adjacent** angles share a vertex and a side. A **linear pair** is adjacent with its outer sides in a line, so it adds up to 180°. **Vertical angles** sit opposite each other and are congruent." },
      { type: "learn", kicker: "The idea",
        prompt: "**Adjacent** angles share a vertex and a side. A **linear pair** is adjacent with its outer sides in a line, so it adds to 180°. **Complementary** angles add to 90° and **supplementary** angles to 180°. **Vertical** angles, opposite each other where two lines cross, are congruent.",
        scene: { type: "method", how: HOW_1_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Two supplementary angles measure $(3x + 10)°$ and $(2x + 20)°$. Watch both found.",
        scene: { type: "walk", how: HOW_1_5, rows: [
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
        how: HOW_1_5, skill: "Vertical angles",
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
        scene: { type: "walk", how: HOW_1_5, rows: [
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
  /* ============================================== 1.6 · Classifying triangles */
  var HOW_1_6 = [["Angles", "Look at the angles. All three acute: acute. One right angle: right. One obtuse angle: obtuse. All three congruent: equiangular."],
                 ["Sides", "Count the congruent sides. Three: equilateral. At least two: isosceles. None: scalene."],
                 ["Name", "Put the two names together, such as a right scalene triangle."]];
  var FIG_OBT = tri([[0, 0], [5, 0], [2.5, 1.45]], { names: "ABC", ticks: [0, 1, 1], angs: [null, null, "120°"] }, "Triangle ABC. Sides BC and CA each carry one tick mark. The angle at C is 120 degrees."),
      FIG_345 = tri([[0, 0], [4, 0], [0, 3]], { names: "PQR", right: [0], sides: ["4", "5", "3"] }, "Triangle PQR with a right angle at P. PQ is 4, QR is 5 and RP is 3."),
      FIG_LEGS = tri([[0, 0], [3, 0], [1.5, 4.1]], { names: "ABC", ticks: [0, 1, 1], sides: ["x + 4", "2x + 3", "4x − 7"] }, "Triangle ABC. Sides BC and CA each carry one tick mark. AB is x + 4, BC is 2x + 3 and CA is 4x − 7."),
      FIG_EQ = tri([[0, 0], [4, 0], [2, 3.46]], { names: "JKL", ticks: [1, 1, 1], sides: ["3x − 2", "x + 8", null] }, "Triangle JKL with one tick mark on every side. JK is 3x − 2 and KL is x + 8.");
  // A triangle on A(−2, 0) and B(2, 0), with its third corner at C: what it is called by its sides, and by its angles.
  function sideKind16(C) {
    var A = [-2, 0], B = [2, 0], ab = 4, bc = GT.dist(B, C), ca = GT.dist(C, A), eq = function (u, v) { return Math.abs(u - v) < 0.08; };
    return eq(ab, bc) && eq(bc, ca) ? "equilateral" : eq(ab, bc) || eq(bc, ca) || eq(ab, ca) ? "isosceles" : "scalene";
  }
  function angleKind16(C) {
    var A = [-2, 0], B = [2, 0], m = Math.max(GT.angle(B, A, C), GT.angle(A, B, C), GT.angle(A, C, B));
    return Math.abs(m - 90) < 0.6 ? "right" : m > 90 ? "obtuse" : "acute";
  }
  LESSONS.push({
    title: "Classifying triangles", art: "tri",
    blurb: "Section 1.6 · Name a triangle by its angles and by its sides, and use the name to find lengths.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which of these is an obtuse angle?",
        options: [{ t: "$115°$" }, { t: "$90°$", fb: "Exactly 90° is a right angle." }, { t: "$75°$", fb: "Less than 90° is acute." }],
        answer: 0, skill: "Classify angles", hints: ["Obtuse: more than 90° and less than 180°."], why: "115° is between 90° and 180°." },
      { type: "learn", kicker: "Explore",
        prompt: "$A$ and $B$ stay put. Drag $C$ anywhere. What do you notice about the **sides**? Find all three kinds of triangle.",
        scene: { type: "sketch", x: [-4, 4], y: [-0.4, 4.4], u: 54, grid: false, gate: true,
          pts: { C: { at: [1.4, 2.6], drag: true, c: "orange", on: { fn: function (p) { return [Math.round(p[0] * 10) / 10, Math.max(0.4, Math.round(p[1] * 10) / 10)]; } }, say: "Corner C" } },
          track: function (s) { return sideKind16(s.C); },
          draw: function (s) {
            var A = [-2, 0], B = [2, 0], C = s.C, k = sideKind16(C), eq = function (u, v) { return Math.abs(u - v) < 0.08; };
            var ab = 4, bc = GT.dist(B, C), ca = GT.dist(C, A), col = { scalene: "blue", isosceles: "purple", equilateral: "green" }[k];
            return [{ poly: [A, B, C], c: col }, { seg: [A, B], c: col, marks: eq(ab, bc) && eq(ab, ca) ? 1 : eq(ab, bc) || eq(ab, ca) ? 1 : 0 }, { seg: [B, C], c: col, marks: eq(bc, ab) || eq(bc, ca) ? 1 : 0 }, { seg: [C, A], c: col, marks: eq(ca, ab) || eq(ca, bc) ? 1 : 0 },
              { pt: A, name: "A", at: "s" }, { pt: B, name: "B", at: "s" }, { pt: C, name: "C", at: "n", c: "orange" }];
          },
          readout: function (s) {
            var A = [-2, 0], B = [2, 0];
            return "$AB = 4$ · $BC = " + n1(GT.dist(B, s.C)) + "$ · $CA = " + n1(GT.dist(s.C, A)) + "$ → **" + sideKind16(s.C) + "**<br>" + found([["scalene", "Scalene"], ["isosceles", "Isosceles"], ["equilateral", "Equilateral"]], s.tracked);
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        then: "**Scalene**: no two sides congruent. **Isosceles**: at least two congruent sides. **Equilateral**: all three congruent. Matching tick marks show which sides are congruent." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag $C$ again, and watch the **angles**. Find an acute triangle, a right triangle and an obtuse triangle.",
        scene: { type: "sketch", x: [-4, 4], y: [-0.4, 4.4], u: 54, grid: false, gate: true,
          pts: { C: { at: [0.6, 2.6], drag: true, c: "orange", on: { fn: function (p) { return [Math.round(p[0] * 10) / 10, Math.max(0.4, Math.round(p[1] * 10) / 10)]; } }, say: "Corner C" } },
          track: function (s) { return angleKind16(s.C); },
          draw: function (s) {
            var A = [-2, 0], B = [2, 0], C = s.C, k = angleKind16(C), col = { acute: "blue", right: "green", obtuse: "purple" }[k], a = angAt(B, A, C), b = angAt(A, B, C), c = angAt(A, C, B);
            var items = [{ poly: [A, B, C], c: col }, { pt: A, name: "A", at: "s" }, { pt: B, name: "B", at: "s" }, { pt: C, name: "C", at: "n", c: "orange" },
              { angle: [B, A, C], say: a + "°", r: 30, right: a === 90, c: "orange" }, { angle: [C, B, A], say: b + "°", r: 30, right: b === 90, c: "orange" }, { angle: [A, C, B], say: c + "°", r: 26, right: c === 90, c: "orange" }];
            return items;
          },
          readout: function (s) {
            var A = [-2, 0], B = [2, 0];
            return "$" + angAt(B, A, s.C) + "° + " + angAt(A, B, s.C) + "° + " + angAt(A, s.C, B) + "°$ → **" + angleKind16(s.C) + "**<br>" + found([["acute", "Acute"], ["right", "Right"], ["obtuse", "Obtuse"]], s.tracked);
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        then: "**Acute**: all three angles less than 90°. **Right**: one angle exactly 90°. **Obtuse**: one angle greater than 90°. The largest angle decides." },
      { type: "learn", kicker: "The idea",
        prompt: "A triangle gets two names. One comes from its **angles**: acute, right, obtuse or equiangular. The other comes from its **sides**: equilateral, isosceles or scalene. Matching tick marks show congruent sides.",
        scene: { type: "method", how: HOW_1_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this triangle get both of its names.",
        scene: { type: "walk", how: HOW_1_6, rows: [
          { step: 1, m: "m\\angle C = 120°", say: "One angle is more than 90°.", fig: FIG_OBT },
          { step: 1, m: "\\text{obtuse}", say: "One obtuse angle makes an obtuse triangle." },
          { step: 2, m: "\\overline{BC} \\cong \\overline{CA}", say: "The matching tick marks show two congruent sides.",
            ask: { prompt: "A triangle with at least two congruent sides is…", answer: 0,
                   options: [{ t: "isosceles" }, { t: "scalene", fb: "Scalene means no congruent sides." }] } },
          { step: 2, m: "\\text{isosceles}", say: "At least two congruent sides." },
          { step: 3, m: "\\text{obtuse isosceles triangle}", say: "The angle name, then the side name." }] },
        gate: true, then: "Angles give one name and sides give the other." },
      { type: "guided", kicker: "Together",
        prompt: "Now you classify $\\triangle PQR$.", art: FIG_345,
        how: HOW_1_6, skill: "Classify triangles",
        steps: [
          { step: 1, ask: "The small square marks a right angle. What is the triangle called by its angles?", type: "choice", answer: 0,
            options: [{ t: "Right" }, { t: "Acute", fb: "An acute triangle has three acute angles. This one has a 90° angle." }, { t: "Obtuse", fb: "An obtuse triangle has an angle greater than 90°." }],
            m: "\\text{right}", say: "One right angle." },
          { step: 2, ask: "The sides are 3, 4 and 5. Are any two of them congruent?", type: "choice", answer: 0,
            options: [{ t: "No: it is scalene" }, { t: "Yes: it is isosceles", fb: "3, 4 and 5 are all different." }],
            m: "\\text{scalene}", say: "No two sides have the same length." },
          { step: 3, ask: "What is its full name?", type: "choice", answer: 0,
            options: [{ t: "Right scalene triangle" }, { t: "Right isosceles triangle", fb: "Isosceles needs at least two congruent sides." }, { t: "Acute scalene triangle", fb: "It has a right angle." }],
            m: "\\text{right scalene triangle}", say: "The angle name, then the side name." }],
        why: "Angles, sides, name. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Each card lists the three angles of a triangle. Classify each triangle.",
        bins: ["Acute", "Right", "Obtuse"],
        cards: [{ t: nb("$70°, 60°, 50°$"), bin: 0, fb: "All three are less than 90°." }, { t: nb("$90°, 45°, 45°$"), bin: 1, fb: "One angle is exactly 90°." },
                { t: nb("$110°, 40°, 30°$"), bin: 2, fb: "110° is an obtuse angle." }, { t: nb("$60°, 60°, 60°$"), bin: 0, fb: "Equiangular, and every angle is acute." },
                { t: nb("$100°, 50°, 30°$"), bin: 2, fb: "100° is an obtuse angle." }, { t: nb("$90°, 62°, 28°$"), bin: 1, fb: "One angle is exactly 90°." }],
        skill: "Classify triangles", hints: ["Look at the largest angle of each."],
        why: "The largest angle decides: less than, equal to, or more than 90°." },
      { type: "choice", prompt: "A triangle has sides of 6 cm, 6 cm and 9 cm. Classify it by its sides.",
        options: [{ t: "Isosceles" }, { t: "Equilateral", fb: "All three sides would have to be congruent." }, { t: "Scalene", fb: "Two of the sides are both 6 cm." }],
        answer: 0, skill: "Classify triangles", hints: ["How many sides have the same length?"], why: "Two congruent sides: isosceles." },
      { type: "learn", kicker: "A harder case",
        prompt: "The name can find lengths. $\\triangle ABC$ is isosceles, with $\\overline{BC} \\cong \\overline{CA}$. Find all three sides.",
        scene: { type: "walk", how: [["Equal", "Congruent sides have equal lengths: write an equation."], ["Solve", "Solve for $x$."], ["Substitute", "Put $x$ back in to find each length."]], rows: [
          { step: 1, m: "2x + 3 = 4x - 7", say: "Congruent sides have equal lengths.", fig: FIG_LEGS },
          { step: 2, m: "10 = 2x", say: "Subtract $2x$ and add 7 on both sides." },
          { step: 2, m: "x = 5", say: "Divide by 2." },
          { step: 3, m: "BC = 2(5) + 3 = 13", say: "Substitute 5.",
            ask: { prompt: "What is $BC = 2x + 3$ when $x = 5$?", answer: 0,
                   options: [{ t: "13" }, { t: "10", fb: "$2(5) = 10$, then add 3." }] } },
          { step: 3, m: "CA = 4(5) - 7 = 13", say: "The same, as it must be." },
          { step: 3, m: "AB = 5 + 4 = 9", say: "The third side." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "$\\triangle JKL$ is equilateral. Find the length of each side.", art: FIG_EQ, answer: 13, skill: "Classify triangles",
        near: [{ v: 5, fb: "That is $x$. Substitute it to get the length." }],
        hints: ["All sides are equal: $3x - 2 = x + 8$.", "$x = 5$. Now substitute."], why: "$2x = 10$, so $x = 5$ and each side is $3(5) - 2 = 13$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A triangle has angles of 90°, 50° and 40°. Omar calls it obtuse, because 90° is its biggest angle. What is wrong?",
        options: [{ t: "It is a right triangle. An obtuse triangle needs an angle greater than 90°." },
                  { t: "It is acute, because two of its angles are acute.", fb: "Every triangle has at least two acute angles. The largest angle decides." },
                  { t: "Nothing. Omar is correct.", fb: "90° is a right angle, not an obtuse one." }],
        answer: 0, skill: "Classify triangles", hints: ["What kind of angle is exactly 90°?"], why: "One right angle makes a right triangle." },
      { type: "num", kicker: "Use it", prompt: "A jeweller bends wire into equilateral triangles with sides of 2 cm. How many triangles can she make from 30 cm of wire?", answer: 5, skill: "Classify triangles",
        near: [{ v: 15, fb: "Each triangle has three sides, so it uses 6 cm of wire." }],
        hints: ["One triangle uses $3 \\cdot 2$ cm."], why: "$30 \\div 6 = 5$." }
    ]
  });
  /* ============================================== 1.7 · Classifying polygons */
  var HOW_1_7 = [["Look", "Is it a polygon? It must be closed, with straight sides that meet only at their endpoints."],
                 ["Shape", "Convex or concave? Join two corners: does the segment stay inside?"],
                 ["Count", "Count the sides and give it its name: triangle, quadrilateral, pentagon…"]];
  var HOW_1_7D = [["Label", "Call the ends $(x_1, y_1)$ and $(x_2, y_2)$."],
                  ["Subtract", "Subtract the $x$-values, and subtract the $y$-values."],
                  ["Square", "Square each difference and add."],
                  ["Root", "Take the square root."]];
  var PG17 = [[0, 0], [4, 0], [4.7, 2.7], [2.3, 1.3], [0.4, 2.9]];
  var NAMES17 = { 3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon", 7: "heptagon", 8: "octagon", 9: "nonagon", 10: "decagon", 12: "dodecagon" };
  function segsCross17(a, b, c, d) {
    var o1 = crossOf(a, b, c), o2 = crossOf(a, b, d), o3 = crossOf(c, d, a), o4 = crossOf(c, d, b);
    return o1 * o2 < -1e-9 && o3 * o4 < -1e-9;
  }
  function inside17(P, q) {
    var c = false;
    for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
      if ((P[i][1] > q[1]) !== (P[j][1] > q[1]) && q[0] < (P[j][0] - P[i][0]) * (q[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
    }
    return c;
  }
  // The quadrilateral A B C D with D free: convex, concave, or not a polygon at all (two sides cross).
  var Q17 = { A: [-3, 0.4], B: [3, 0.4], C: [2.2, 3.6] };
  function shape17(D) {
    var A = Q17.A, B = Q17.B, C = Q17.C;
    if (segsCross17(A, B, C, D) || segsCross17(B, C, D, A)) return "crossed";
    var s = [crossOf(A, B, C), crossOf(B, C, D), crossOf(C, D, A), crossOf(D, A, B)];
    return s.every(function (v) { return v > 1e-9; }) || s.every(function (v) { return v < -1e-9; }) ? "convex" : "concave";
  }
  LESSONS.push({
    title: "Classifying polygons", art: "poly",
    blurb: "Section 1.7 · What makes a polygon, convex and concave polygons, naming a polygon by its sides, and side lengths on a grid.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which of these shapes is a **polygon**?",
        art: FS([plain([0, 5], [0, 4], [{ poly: [[0.6, 0.6], [4.4, 0.6], [2.5, 3.4]], c: "blue" }, { word: "A", at: [0.5, 3.5], c: "ink" }], { u: 26, w: 140, alt: "Shape A: a triangle." }),
                 plain([0, 5], [0, 4], [{ circle: [[2.5, 2], 1.5], c: "blue" }, { word: "B", at: [0.5, 3.5], c: "ink" }], { u: 26, w: 140, alt: "Shape B: a circle." }),
                 plain([0, 5], [0, 4], [{ seg: [[0.8, 0.8], [2.4, 3.2]], c: "blue" }, { seg: [[2.4, 3.2], [4.2, 0.8]], c: "blue" }, { word: "C", at: [0.5, 3.5], c: "ink" }], { u: 26, w: 140, alt: "Shape C: two segments in a V, not closed." })]),
        options: [{ t: "A, the triangle" }, { t: "B, the circle", fb: "A circle has no straight sides at all." }, { t: "C, the V", fb: "It is not closed: its ends do not meet." }],
        answer: 0, skill: "What is a polygon", hints: ["A polygon is closed and has only straight sides."], why: "Only the triangle is closed and made entirely of line segments." },
      { type: "learn", kicker: "Explore",
        prompt: "$A$, $B$ and $C$ stay put. Drag corner $D$ anywhere. Find all **three** things that can happen.",
        scene: { type: "sketch", x: [-4, 4], y: [-0.3, 4.4], u: 54, grid: false, gate: true,
          pts: { D: { at: [-2.2, 3.2], drag: true, c: "orange", on: { fn: function (p) { return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]; } }, say: "Corner D" } },
          track: function (s) { return shape17(s.D); },
          draw: function (s) {
            var A = Q17.A, B = Q17.B, C = Q17.C, D = s.D, k = shape17(D), col = { convex: "green", concave: "purple", crossed: "red" }[k], P = [A, B, C, D];
            var items = [{ poly: P, c: col, names: "ABCD", fill: k !== "crossed" }];
            if (k !== "crossed") [[A, C], [B, D]].forEach(function (d) { items.push({ seg: d, c: inside17(P, [(d[0][0] + d[1][0]) / 2, (d[0][1] + d[1][1]) / 2]) ? "blue" : "red", dash: true }); });
            items.push({ pt: D, name: "", c: "orange" });
            return items;
          },
          readout: function (s) {
            var k = shape17(s.D);
            return (k === "convex" ? "**Convex**: both diagonals stay inside the shape." : k === "concave" ? "**Concave**: a diagonal (in red) leaves the shape; a corner points inward."
              : "**Not a polygon**: two sides cross each other.") + "<br>" + found([["convex", "Convex"], ["concave", "Concave"], ["crossed", "Not a polygon"]], s.tracked);
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        then: "A polygon's sides meet only at their endpoints. If every segment joining two corners stays inside, it is **convex**. If one leaves the shape, it is **concave**." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide to add sides to a regular polygon. Each number of sides has its own **name**. Can you meet six of them?",
        scene: { type: "sketch", x: [-3.2, 3.2], y: [-2.8, 2.8], u: 50, grid: false, gate: true,
          params: { n: { min: 3, max: 12, step: 1, v: 3, label: "sides $n$" } },
          track: function (s) { return NAMES17[s.p.n] || null; },
          draw: function (s) { return [{ poly: reg(s.p.n, 2.4, [0, 0], 90), c: "purple", fill: true }]; },
          readout: function (s) {
            var nm = NAMES17[s.p.n];
            return "$n = " + s.p.n + "$ · " + (nm ? "a **" + nm + "**" : "an **$" + s.p.n + "$-gon**") + "<br>" + found([["triangle", "triangle"], ["quadrilateral", "quadrilateral"], ["pentagon", "pentagon"], ["hexagon", "hexagon"], ["heptagon", "heptagon"], ["octagon", "octagon"], ["nonagon", "nonagon"], ["decagon", "decagon"], ["dodecagon", "dodecagon"]], s.tracked);
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 6; } },
        then: "The prefix tells the number of sides: *tri* 3, *quad* 4, *penta* 5, *hexa* 6, *hepta* 7, *octa* 8, *nona* 9, *deca* 10. With $n$ sides, it is an **$n$-gon**." },
      { type: "learn", kicker: "The idea",
        prompt: "A **polygon** is a closed figure made only of line segments, its **sides**, that meet at their endpoints, its **vertices**. A polygon is **convex** if every segment joining two corners stays inside it, and **concave** if one leaves. It is named by its number of sides.",
        scene: { type: "method", how: HOW_1_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this figure get its full name.",
        scene: { type: "walk", how: HOW_1_7, rows: [
          { step: 1, m: "\\text{closed, straight sides}", say: "Every side is a straight segment, and the corners meet end to end: it is a polygon.",
            fig: plain([-0.6, 5.4], [-0.5, 3.5], [{ poly: PG17, names: "ABCDE", c: "blue" }], { u: 44, alt: "A five-sided figure ABCDE with one corner, D, pointing inward." }) },
          { step: 2, m: "\\overline{CE}", say: "Join two corners, $C$ and $E$.",
            fig: plain([-0.6, 5.4], [-0.5, 3.5], [{ poly: PG17, names: "ABCDE", c: "blue" }, { seg: [PG17[2], PG17[4]], c: "red", dash: true }], { u: 44, alt: "The same figure with a dashed segment from C to E, which passes outside the figure." }),
            ask: { prompt: "Does the dashed segment stay inside the figure?", answer: 0,
                   options: [{ t: "No, it leaves it" }, { t: "Yes, all of it", fb: "Look at the dent at $D$: the segment passes above the figure there." }] } },
          { step: 2, m: "\\text{concave}", say: "One segment between corners leaves the shape, so it is concave." },
          { step: 3, m: "5 \\text{ sides}", say: "Count: $AB$, $BC$, $CD$, $DE$, $EA$." },
          { step: 3, m: "\\text{concave pentagon}", say: "The shape word first, then the name for five sides." }] },
        gate: true, then: "Full name: a **concave pentagon**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you name this figure.",
        art: plain([-0.4, 5.4], [-0.3, 4.2], [{ poly: [[1.4, 0], [3.6, 0], [4.9, 1.9], [3.6, 3.8], [1.4, 3.8], [0.1, 1.9]], names: "ABCDEF", c: "blue" }], { u: 44, alt: "A six-sided figure ABCDEF whose corners all point outward." }),
        how: HOW_1_7, skill: "Classify polygons",
        steps: [
          { step: 1, ask: "Is it a polygon?", type: "choice", answer: 0,
            options: [{ t: "Yes: closed, with straight sides" }, { t: "No", fb: "It is closed, and every side is straight." }],
            m: "\\text{polygon}", say: "Closed, straight sides, meeting at the corners." },
          { step: 2, ask: "Does a segment joining two corners ever leave the figure?", type: "choice", answer: 0,
            options: [{ t: "No: all stay inside" }, { t: "Yes", fb: "Every corner points outward, so none leaves it." }],
            m: "\\text{convex}", say: "Every corner points outward: convex." },
          { step: 3, ask: "How many sides does it have?", type: "num", answer: 6, near: [{ v: 5, fb: "Count again: $AB$, $BC$, $CD$, $DE$, $EF$, $FA$." }], hint: "Count the corners: one for each side.",
            m: "6 \\text{ sides}", say: "Six sides." },
          { step: 3, ask: "What is its full name?", type: "choice", answer: 0,
            options: [{ t: "Convex hexagon" }, { t: "Concave hexagon", fb: "Nothing points inward, so it is convex." }, { t: "Convex pentagon", fb: "A pentagon has five sides. Count again." }],
            m: "\\text{convex hexagon}", say: "Convex, with six sides." }],
        why: "Look, shape, count. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Is it a polygon, or not?",
        bins: ["Polygon", "Not a polygon"],
        cards: [{ t: "A triangle", bin: 0, fb: "Three straight sides, closed." }, { t: "A circle", bin: 1, fb: "A circle has no straight sides." }, { t: "A stop sign's outline", bin: 0, fb: "Eight straight sides, closed." },
                { t: "A letter V", bin: 1, fb: "It is not closed." }, { t: "A star with five points", bin: 0, fb: "Straight sides, closed, meeting at corners: a concave polygon." }, { t: "A cube", bin: 1, fb: "A cube is not flat: a polygon lies in one plane." }],
        skill: "What is a polygon", hints: ["Closed? Only straight sides? All in one flat plane?"],
        why: "A polygon is flat, closed, and made only of straight segments." },
      { type: "num", prompt: "Find the length of the side from $A(1, 2)$ to $B(7, 10)$.",
        art: grid([-1, 9], [0, 12], [{ seg: [[1, 2], [7, 10]], c: "blue" }, { pt: [1, 2], name: "A", at: "w" }, { pt: [7, 10], name: "B", at: "e" }], { u: 22, alt: "A segment from A(1, 2) to B(7, 10) on a grid." }),
        answer: 10, skill: "Distance formula",
        near: [{ v: 14, fb: "That is $6 + 8$. Square the differences, add, then take the square root." }, { v: 100, fb: "That is $d^2$. Take the square root." }],
        hints: ["$(7 - 1)^2 + (10 - 2)^2 = 36 + 64$."], why: "$\\sqrt{6^2 + 8^2} = \\sqrt{100} = 10$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The perimeter is the sum of the sides. Watch the perimeter of the triangle with corners $(0, 0)$, $(6, 0)$ and $(6, 8)$.",
        scene: { type: "walk", how: HOW_1_7D, rows: [
          { step: 1, m: "(0, 0) \\to (6, 8)", say: "Two sides are horizontal and vertical. The slanted one needs the distance formula.",
            fig: grid([-1, 8], [-1, 10], [{ poly: [[0, 0], [6, 0], [6, 8]], names: "ABC", c: "blue" }], { u: 24, alt: "A right triangle with corners A(0, 0), B(6, 0) and C(6, 8)." }) },
          { step: 2, m: "6 - 0 = 6 \\qquad 8 - 0 = 8", say: "The differences in $x$ and in $y$." },
          { step: 3, m: "6^2 + 8^2 = 100", say: "$36 + 64$.",
            ask: { prompt: "What is $6^2 + 8^2$?", answer: 0, options: [{ t: "100" }, { t: "14", fb: "Square first: $36 + 64$." }] } },
          { step: 4, m: "AC = \\sqrt{100} = 10", say: "The slanted side is 10." },
          { step: 4, m: "6 + 8 + 10 = 24", say: "Add the three sides: the perimeter is 24 units." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A polygon has 12 sides. What is it called?",
        options: [{ t: "A dodecagon" }, { t: "A decagon", fb: "A decagon has 10 sides." }, { t: "A nonagon", fb: "A nonagon has 9 sides." }],
        answer: 0, skill: "Name a polygon", hints: ["*Dodeca* means twelve."], why: "Twelve sides: a dodecagon." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rob says a star-shaped figure cannot be a polygon, because its corners point inward. What is wrong?",
        options: [{ t: "A polygon only needs straight sides that meet at their ends. Corners pointing inward make it concave." },
                  { t: "Nothing. A polygon must be convex.", fb: "Convex polygons are one kind. Concave polygons are polygons too." },
                  { t: "A star has curved sides.", fb: "A five-pointed star is drawn with straight segments." }],
        answer: 0, skill: "Convex or concave", hints: ["Is being convex part of the definition of a polygon?"], why: "Convex or concave, it is still a polygon." },
      { type: "num", kicker: "Use it", prompt: "A stop sign is a regular octagon with sides of 12 inches. How far is it round the edge?",
        post: "in", answer: 96, skill: "Name a polygon",
        near: [{ v: 8, fb: "That is the number of sides. Multiply by the length of each." }], hints: ["8 sides of 12 inches."], why: "$8 \\times 12 = 96$ inches." }
    ]
  });
  /* ===================================== 1.8 · Problem solving in geometry */
  var HOW_1_8 = [["Ask", "What is it asking for? What do I need to know to find it?"],
                 ["Draw", "Sketch it, and label the sketch with what you are told."],
                 ["Plan", "Pick the tool that fits: a formula, a postulate, a theorem."],
                 ["Check", "Calculate, then ask: did I answer the question, and does it make sense?"]];
  var GR18 = [[0, 0], [9, 0], [9, 12], [0, 12]];
  LESSONS.push({
    title: "Problem solving in geometry", art: "solve",
    blurb: "Section 1.8 · Understand the problem, draw it, choose a tool, and check the answer.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A rectangle is 8 cm long and 6 cm wide. What is its perimeter?", post: "cm", answer: 28, skill: "Perimeter",
        near: [{ v: 48, fb: "That is the area, $8 \\times 6$. The perimeter is the distance **round** the edge." }, { v: 14, fb: "That is one length plus one width. Go all the way round." }],
        hints: ["Two lengths and two widths."], why: "$8 + 6 + 8 + 6 = 28$." },
      { type: "learn", kicker: "Explore",
        prompt: "Make a rectangle by dragging $C$. Its diagonal is $\\overline{AC}$. Find **three** rectangles whose diagonal is a **whole number**.",
        scene: { type: "sketch", x: [-1, 14], y: [-1, 11], u: 34, gate: true,
          pts: { C: { at: [6, 4], drag: true, snap: 1, c: "orange", on: { fn: function (p) { return [Math.max(1, Math.min(13, Math.round(p[0]))), Math.max(1, Math.min(10, Math.round(p[1])))]; } }, say: "Corner C" } },
          draw: function (s) {
            var w = s.C[0], h = s.C[1], d = Math.sqrt(w * w + h * h), whole = Math.abs(d - Math.round(d)) < 1e-9, c = whole ? "green" : "blue";
            return [{ poly: [[0, 0], [w, 0], [w, h], [0, h]], c: c }, { seg: [[0, 0], [w, h]], c: whole ? "green" : "orange", dash: true },
              { len: String(w), seg: [[0, 0], [w, 0]], side: -1, off: 16 }, { len: String(h), seg: [[w, 0], [w, h]], side: -1, off: 16 },
              { pt: [0, 0], name: "A", at: "sw" }, { pt: [w, h], name: "C", at: "ne", c: "orange" }];
          },
          readout: function (s) {
            var w = s.C[0], h = s.C[1], d = Math.sqrt(w * w + h * h), whole = Math.abs(d - Math.round(d)) < 1e-9;
            return "$" + w + "^2 + " + h + "^2 = " + (w * w + h * h) + "$ · $AC = \\sqrt{" + (w * w + h * h) + "} " + (whole ? "= " + Math.round(d) + "$ ✓" : "\\approx " + n1(d) + "$");
          },
          log: { need: 3, when: function (s) { var d = Math.sqrt(s.C[0] * s.C[0] + s.C[1] * s.C[1]); return Math.abs(d - Math.round(d)) < 1e-9; },
                 cols: [{ h: "width", f: function (s) { return "$" + s.C[0] + "$"; } }, { h: "height", f: function (s) { return "$" + s.C[1] + "$"; } }, { h: "diagonal", f: function (s) { return "$" + Math.round(Math.sqrt(s.C[0] * s.C[0] + s.C[1] * s.C[1])) + "$"; } }] } },
        then: "The diagonal comes from the **distance formula**, $\\sqrt{w^2 + h^2}$, and most rectangles give a number that goes on for ever. A few give a whole number, such as 3, 4, 5." },
      { type: "learn", kicker: "Explore",
        prompt: "A rectangle is 8 cm by 6 cm. How long is its diagonal? Look at the same problem **three ways**, and ask which one gives you a tool.",
        scene: { type: "sketch", x: [-1.7, 10.4], y: [-1.3, 7.6], u: 40, grid: false, gate: true,
          chips: { rep: { v: "plain", opts: [["plain", "Just the shape"], ["blocks", "In square blocks"], ["grid", "On a grid"]] } },
          draw: function (s) {
            var k = s.c.rep, items = [], i;
            if (k !== "plain") { for (i = 0; i <= 8; i++) items.push({ seg: [[i, 0], [i, 6]], c: "soft" }); for (i = 0; i <= 6; i++) items.push({ seg: [[0, i], [8, i]], c: "soft" }); }
            if (k === "grid") items.push({ seg: [[-1.2, 0], [9.6, 0]] }, { seg: [[0, -0.9], [0, 7]] });
            items.push({ poly: [[0, 0], [8, 0], [8, 6], [0, 6]], c: "blue" }, { seg: [[0, 0], [8, 6]], c: "orange", dash: true }, { len: "8 cm", seg: [[0, 0], [8, 0]], side: -1, off: 16 }, { len: "6 cm", seg: [[8, 0], [8, 6]], side: -1, off: 16 });
            if (k === "grid") items.push({ word: "(0, 0)", at: [-0.9, -0.55], c: "orange" }, { word: "(8, 6)", at: [9.1, 6.6], c: "orange" }, { pt: [0, 0], c: "orange" }, { pt: [8, 6], c: "orange" });
            return items;
          },
          readout: function (s) {
            return { plain: "**Just the shape.** Easy to see, but nothing here tells you how to find the diagonal.", blocks: "**In blocks.** The diagonal cuts through the blocks. Still no tool for it.", grid: "**On a grid.** The ends are $(0, 0)$ and $(8, 6)$, so the **distance formula** is the tool."}[s.c.rep] + "<br><span class='gt-dim'>Tried " + Object.keys(s.seen.rep).length + " of 3</span>";
          },
          goal: function (s) { return Object.keys(s.seen.rep).length >= 3; } },
        then: "The same problem can be drawn many ways. Choose the drawing that **gives you a tool**: here, the grid." },
      { type: "learn", kicker: "The idea",
        prompt: "A problem is easier in four moves. **Ask** what it wants and what you need. **Draw** it and label the drawing. **Plan** by choosing the right tool from your toolbox. Then calculate, and **check** that you answered the question and that the answer makes sense.",
        scene: { type: "method", how: HOW_1_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "A rectangular garden bed has corners at $(0, 0)$, $(9, 0)$, $(9, 12)$ and $(0, 12)$, in metres. A hose runs corner to corner along $\\overline{AC}$. Watch its length found.",
        scene: { type: "walk", how: HOW_1_8, rows: [
          { step: 1, m: "AC = ?", say: "It asks for the length of the diagonal. I need the coordinates of its two ends." },
          { step: 2, m: "A(0, 0) \\quad C(9, 12)", say: "Draw the bed on a grid, and label its corners.",
            fig: grid([-1, 11], [-1, 14], [{ poly: GR18, names: "ABCD", c: "blue" }, { seg: [[0, 0], [9, 12]], c: "orange", dash: true }], { u: 20, alt: "A rectangle on a grid with corners (0, 0), (9, 0), (9, 12) and (0, 12), and a dashed diagonal from (0, 0) to (9, 12)." }) },
          { step: 3, m: "d = \\sqrt{(9 - 0)^2 + (12 - 0)^2}", say: "Both ends have coordinates: the distance formula is the tool.",
            ask: { prompt: "Which tool fits?", answer: 0,
                   options: [{ t: "The distance formula" }, { t: "The Segment Addition Postulate", fb: "That one adds parts of a segment. Here we are given the two ends." }] } },
          { step: 4, m: "\\sqrt{81 + 144} = \\sqrt{225} = 15", say: "The hose is 15 m long." },
          { step: 4, m: "15 > 12 \\quad 15 > 9", say: "Sensible: a diagonal is longer than either side." }] },
        gate: true, then: "Ask, draw, plan, check. The check is a habit: a diagonal shorter than a side would have been a warning." },
      { type: "guided", kicker: "Together",
        prompt: "A drone flies in a straight line from $P(2, 3)$ to $Q(14, 8)$ on a map, in blocks. How far does it fly? Now you solve it.",
        art: grid([0, 16], [0, 11], [{ seg: [[2, 3], [14, 8]], c: "blue" }, { pt: [2, 3], name: "P", at: "nw" }, { pt: [14, 8], name: "Q", at: "ne" }], { u: 22, alt: "A segment from P(2, 3) to Q(14, 8) on a grid." }),
        how: HOW_1_8, skill: "Problem solving",
        steps: [
          { step: 1, ask: "What is the problem asking for?", type: "choice", answer: 0,
            options: [{ t: "The distance from $P$ to $Q$" }, { t: "The area of a shape", fb: "No area is asked for. It is a straight-line distance." }],
            m: "PQ = ?", say: "The length of the flight." },
          { step: 2, ask: "The map is already a grid. How far across is it from $P$ to $Q$?", type: "num", answer: 12, near: [{ v: 14, fb: "That is $Q$'s $x$. Subtract: $14 - 2$." }], hint: "$14 - 2$.",
            m: "14 - 2 = 12", say: "12 blocks across." },
          { step: 3, ask: "How far up is it? Then the tool is the distance formula.", type: "num", answer: 5, near: [{ v: 8, fb: "That is $Q$'s $y$. Subtract: $8 - 3$." }], hint: "$8 - 3$.",
            m: "8 - 3 = 5", say: "5 blocks up. Across and up make the legs of a right triangle." },
          { step: 4, ask: "Now calculate $\\sqrt{12^2 + 5^2}$. How far does it fly?", type: "num", answer: 13, near: [{ v: 17, fb: "That is $12 + 5$. Square, add, then take the root." }, { v: 169, fb: "That is $d^2$. Take the square root." }], hint: "$144 + 25 = 169$.",
            m: "\\sqrt{144 + 25} = \\sqrt{169} = 13", say: "13 blocks. It is longer than 12 and longer than 5: it makes sense." }],
        why: "Ask, draw, plan, check. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "A problem gives you the coordinates of two points and asks how far apart they are. Which tool do you pick?",
        options: [{ t: "The distance formula" }, { t: "The Angle Addition Postulate", fb: "That is for angles that share a vertex." }, { t: "The perimeter formula", fb: "No shape is given: just two points." }],
        answer: 0, skill: "Choose a tool", hints: ["Two points with coordinates: how do you find the distance?"], why: "Two coordinates, one distance: the distance formula." },
      { type: "num", prompt: "A rectangular field is 20 m long and 15 m wide. A path runs corner to corner. How long is the path?",
        art: grid([-1, 22], [-1, 17], [{ poly: [[0, 0], [20, 0], [20, 15], [0, 15]], c: "blue" }, { seg: [[0, 0], [20, 15]], c: "orange", dash: true }], { u: 14, alt: "A rectangle 20 wide and 15 high on a grid with a dashed diagonal." }),
        post: "m", answer: 25, skill: "Problem solving",
        near: [{ v: 35, fb: "That is $20 + 15$, the way round two sides. The diagonal is shorter than that." }, { v: 625, fb: "That is $d^2$. Take the square root." }],
        hints: ["Put the corners at $(0, 0)$ and $(20, 15)$.", "$\\sqrt{400 + 225}$."], why: "$\\sqrt{20^2 + 15^2} = \\sqrt{625} = 25$ m." },
      { type: "learn", kicker: "A harder case",
        prompt: "A plan can use more than one tool. Mia walks 12 m east and then 5 m north. How much shorter is the straight way?",
        scene: { type: "walk", how: HOW_1_8, rows: [
          { step: 1, m: "(12 + 5) - d = ?", say: "It asks for the **difference** between the two routes: the walk round, and the straight line." },
          { step: 2, m: "A(0, 0) \\quad B(12, 0) \\quad C(12, 5)", say: "A right triangle: the walk is two sides, and the straight way is the third.",
            fig: grid([-1, 14], [-1, 7], [{ poly: [[0, 0], [12, 0], [12, 5]], names: "ABC", c: "blue" }, { seg: [[0, 0], [12, 5]], c: "orange", dash: true }], { u: 24, alt: "A right triangle with corners A(0, 0), B(12, 0) and C(12, 5). The walk goes along AB and BC; the straight way is AC." }) },
          { step: 3, m: "12 + 5 = 17 \\qquad d = \\sqrt{12^2 + 5^2}", say: "Two tools: add the two legs, and use the distance formula for the third side.",
            ask: { prompt: "What is $12 + 5$?", answer: 0, options: [{ t: "17 m: the walk" }, { t: "13 m", fb: "13 is the straight line. $12 + 5$ is the walk round." }] } },
          { step: 4, m: "17 - 13 = 4", say: "The straight way is 13 m, so it saves 4 m. It is shorter than 17 m, as it must be." }] },
        gate: true },
      { type: "order", kicker: "Try it", prompt: "Put the four moves of problem solving in order.",
        items: ["Ask: what is it asking for, and what do I need?", "Draw and label a sketch.", "Plan: choose the tool that fits.", "Check: did I answer it, and does it make sense?"],
        skill: "Problem solving", hints: ["Understand the question before you choose a tool."], why: "Ask, draw, plan, check." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dan finds the diagonal of an 8 cm by 6 cm rectangle and gets 3 cm. Which question would have caught the mistake?",
        options: [{ t: "“Does my answer make sense?” A diagonal cannot be shorter than a side." },
                  { t: "“Did I use a pencil?”", fb: "A pencil helps, but it does not tell you the answer is wrong." },
                  { t: "“Is the rectangle drawn neatly?”", fb: "A neat drawing does not check the number." }],
        answer: 0, skill: "Problem solving", hints: ["Compare 3 cm with the sides, 8 cm and 6 cm."], why: "The diagonal is longer than both sides, so 3 cm cannot be right: it is 10 cm." },
      { type: "num", kicker: "Use it", prompt: "A screen is 16 inches wide and 12 inches tall. A scratch runs from one corner to the opposite corner. How long is the scratch?",
        post: "in", answer: 20, skill: "Problem solving",
        near: [{ v: 28, fb: "That is $16 + 12$. A diagonal is shorter than the two sides added." }], hints: ["$\\sqrt{16^2 + 12^2}$."], why: "$\\sqrt{256 + 144} = \\sqrt{400} = 20$ inches." }
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
    { id: "hg1-midpoint", title: "Find a midpoint", lesson: 5,
      gen: function (R) {
        var mx = R.int(-4, 4), my = R.int(-4, 4), dx = R.int(1, 4), dy = R.int(1, 4) * R.pick([1, -1]), P = [mx - dx, my - dy], Q = [mx + dx, my + dy];
        return { type: "pair", prompt: "Find the midpoint of the segment from $" + pt(P) + "$ to $" + pt(Q) + "$. Type it as $(x, y)$.", answer: [mx, my],
          near: [{ v: [2 * mx, 2 * my], fb: "Those are the sums. Divide each by 2." }, { v: [dx, dy], fb: "Add the coordinates, then halve. Do not subtract them." }],
          hints: ["$\\frac{" + P[0] + " + " + (Q[0] < 0 ? "(" + Q[0] + ")" : Q[0]) + "}{2}$ and $\\frac{" + P[1] + " + " + (Q[1] < 0 ? "(" + Q[1] + ")" : Q[1]) + "}{2}$."],
          why: "$\\left(\\frac{" + 2 * mx + "}{2}, \\frac{" + 2 * my + "}{2}\\right) = " + pt([mx, my]) + "$." };
      } },
    { id: "hg1-pairs", title: "Complementary, supplementary and vertical angles", lesson: 6,
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
    { id: "hg1-triangle", title: "Classify triangles", lesson: 7,
      gen: function (R) {
        var byAngles = R.chance(0.5);
        if (byAngles) {
          var t = R.pick(["acute", "right", "obtuse"]), a, b, c;
          if (t === "right") { a = 90; b = R.int(20, 70); c = 90 - b; }
          else if (t === "obtuse") { a = R.int(95, 140); b = R.int(12, 180 - a - 12); c = 180 - a - b; }
          else { do { a = R.int(40, 85); b = R.int(40, 85); c = 180 - a - b; } while (c >= 89 || c < 25); }
          var ang = R.shuffle([a, b, c]);
          return mc(R, { prompt: "A triangle has angles of $" + ang[0] + "°$, $" + ang[1] + "°$ and $" + ang[2] + "°$. How is it classified by its angles?", right: t[0].toUpperCase() + t.slice(1), keep: true,
            wrong: ["Acute", "Right", "Obtuse"].filter(function (x) { return x.toLowerCase() !== t; }).map(function (x) { return { t: x, fb: { Acute: "Acute needs all three angles under 90°.", Right: "Right needs an angle of exactly 90°.", Obtuse: "Obtuse needs an angle over 90°." }[x] }; }),
            hints: ["Look at the largest angle: under, equal to, or over 90°."], why: "The largest angle is " + Math.max(a, b, c) + "°, which is " + (t === "acute" ? "under 90°" : t === "right" ? "exactly 90°" : "over 90°") + "." });
        }
        var s = R.pick(["scalene", "isosceles", "equilateral"]), x = R.int(3, 11), y, z;
        if (s === "equilateral") { y = x; z = x; }
        else if (s === "isosceles") { y = x; do { z = R.int(2, 2 * x - 1); } while (z === x); }
        else { do { y = R.int(3, 12); z = R.int(3, 12); } while (x === y || y === z || x === z || x + y <= z || x + z <= y || y + z <= x); }
        var sd = R.shuffle([x, y, z]);
        return mc(R, { prompt: "A triangle has sides of " + sd[0] + " cm, " + sd[1] + " cm and " + sd[2] + " cm. How is it classified by its sides?", right: s[0].toUpperCase() + s.slice(1), keep: true,
          wrong: ["Scalene", "Isosceles", "Equilateral"].filter(function (w) { return w.toLowerCase() !== s; }).map(function (w) { return { t: w, fb: { Scalene: "Scalene means no two sides are equal.", Isosceles: "Isosceles means at least two sides are equal.", Equilateral: "Equilateral means all three sides are equal." }[w] }; }),
          hints: ["How many of the sides have the same length?"], why: { scalene: "No two sides are equal.", isosceles: "Two sides are equal.", equilateral: "All three sides are equal." }[s] });
      } },
    { id: "hg1-polygon", title: "Name a polygon", lesson: 8,
      gen: function (R) {
        var N = { 3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon", 7: "heptagon", 8: "octagon", 9: "nonagon", 10: "decagon", 12: "dodecagon" }, ks = Object.keys(N).map(Number), n = R.pick(ks);
        if (R.chance(0.5)) {
          var wrong = R.shuffle(ks.filter(function (k) { return k !== n; })).slice(0, 2).map(function (k) { return { t: N[k], fb: "A " + N[k] + " has " + k + " sides." }; });
          return mc(R, { prompt: "A polygon has " + n + " sides. What is it called?", right: N[n], wrong: wrong, hints: ["Match the number of sides to its prefix."], why: "A polygon with " + n + " sides is a " + N[n] + "." });
        }
        var others = R.shuffle(ks.filter(function (k) { return k !== n; })).slice(0, 2);
        return mc(R, { prompt: "How many sides does a " + N[n] + " have?", right: String(n), wrong: others.map(function (k) { return { t: String(k), fb: "A " + N[k] + " has " + k + " sides." }; }), keep: true, hints: ["Think of the prefix: it counts the sides."], why: "A " + N[n] + " has " + n + " sides." });
      } },
    { id: "hg1-distance", title: "Find a distance", lesson: 8,
      gen: function (R) {
        var T = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]]), sw = R.chance(0.5), dx = (sw ? T[1] : T[0]) * R.pick([1, -1]), dy = (sw ? T[0] : T[1]) * R.pick([1, -1]);
        var P = [R.int(-5, 5), R.int(-5, 5)], Q = [P[0] + dx, P[1] + dy];
        return { type: "num", prompt: "Find the distance between $" + pt(P) + "$ and $" + pt(Q) + "$.", answer: T[2],
          near: [{ v: Math.abs(dx) + Math.abs(dy), fb: "That goes round the corner. Square each difference, add, then take the root." }, { v: T[2] * T[2], fb: "That is $d^2$. Take the square root." }],
          hints: ["The differences are " + Math.abs(dx) + " and " + Math.abs(dy) + ".", "$" + Math.abs(dx) + "^2 + " + Math.abs(dy) + "^2 = " + T[2] * T[2] + "$."], why: "$\\sqrt{" + dx * dx + " + " + dy * dy + "} = \\sqrt{" + T[2] * T[2] + "} = " + T[2] + "$." };
      } }
  ];
  L.unit("geo", 1, {
    title: "Basics of Geometry",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Naming figures, segment addition, and angles.",
        skills: ["hg1-name", "hg1-segment", "hg1-angle"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Midpoints on a grid, and pairs of angles.",
        skills: ["hg1-midpoint", "hg1-pairs"], per: 3 },
      { title: "Quiz 3", after: 9, blurb: "Classifying triangles and polygons, and distance on a grid.",
        skills: ["hg1-triangle", "hg1-polygon", "hg1-distance"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:1", {
    2: { name: "Points, lines and planes", frame: "A point, a line and a plane are the [[undefined]] terms. A [[segment]] has two endpoints, and a [[ray]] has one. Points on the same line are [[collinear]].",
         chips: ["coplanar", "angle"] },
    3: { name: "Segments and distance", frame: "The distance between two points is the absolute value of the difference of their readings: the [[Ruler]] Postulate. If $B$ is between $A$ and $C$, then $AB + BC = $ [[AC]].",
         chips: ["BC", "parallel"] },
    4: { name: "Rays and angles", frame: "An angle is two rays with a common endpoint, the [[vertex]]. An [[acute]] angle is less than 90°, and an [[obtuse]] angle is more. The parts of an angle add up to the whole: the Angle [[Addition]] Postulate.",
         chips: ["right", "midpoint"] },
    5: { name: "Segments and angles", frame: "A [[midpoint]] cuts a segment into two congruent segments, and an angle [[bisector]] cuts an angle into two congruent angles. Congruent figures have equal [[measures]].",
         chips: ["vertex", "straight"] },
    6: { name: "Angle pairs", frame: "[[Complementary]] angles add to 90° and [[supplementary]] angles add to 180°. A linear pair is supplementary. [[Vertical]] angles are congruent.",
         chips: ["Adjacent", "Acute"] },
    7: { name: "Classifying triangles", frame: "A triangle is named by its angles (acute, right, obtuse) and by its sides: [[scalene]] has no congruent sides, isosceles at least two, and [[equilateral]] all three.",
         chips: ["quadrilateral", "obtuse"] },
    8: { name: "Classifying polygons", frame: "A polygon is a closed figure made of segments. It is [[convex]] if every segment joining two corners stays inside, and concave if one leaves. A polygon with $n$ sides is an [[n-gon]].",
         chips: ["circle", "ray"] },
    9: { name: "Problem solving", frame: "Ask what is wanted, [[draw]] it, plan with the right tool, and [[check]] that the answer makes sense.",
         chips: ["guess", "skip"] }
  });
})();
