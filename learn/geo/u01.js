/* ==========================================================================
   Geometry — Unit 1: Tools of Geometry. See lab/core.js and lab/geotools.js.

   The course follows its textbook, Glencoe Geometry, a chapter to a unit;
   this is chapter 1: the words everything else is built from (point, line,
   plane), then the tools that measure — a ruler for segments, the
   coordinate plane for distance and midpoints, a protractor for angles, a
   compass for constructions — then the pairs angles come in, and the
   flat and solid figures those tools measure. The text, examples and
   problems are our own; only the order of topics is the book's.

   Built for a student working alone: every idea is met by doing something
   (dragging a point along a ruler, turning a line, opening a protractor,
   turning a solid over), then shown a step at a time, then practised with
   hints that walk the steps, then said back. Pictures keep one colour code:
   blue is what the lesson is about, orange marks an angle or a move, grey
   is scenery, and a compass arc is drawn thin, in pencil.

   Fifteen lessons: points, lines and planes, and where they meet; measuring
   segments and adding them; distance and midpoints; angles, measuring them,
   and bisecting them; angle pairs, complements and supplements; polygons
   and their perimeter and area; solids, and their surface area and volume;
   and a review. Twenty-three skills practise it, four quizzes check it,
   and the unit test draws from every skill.

   The lessons carry v: 3 because Unit 1 was the transformations unit until
   2026-09-26 (its lessons were v 1 and 2): a record from those lessons
   must not mark these ones done. Skills are geo1-…; the transformations
   skills kept their geo-… ids and moved with their unit to Unit 9.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB, GT = L.GT;
  var num = L.num, mc = L.mc, F = GT.fig, FS = GT.figs;

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
  function r2(v) { return Math.round(v * 100) / 100; }
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
  function signed(v) { return v < 0 ? "- " + Math.abs(v) : "+ " + v; }
  // (x − a): with a negative a, a subtraction of a negative, in brackets.
  function minus(x, a) { return a < 0 ? x + " - (" + a + ")" : x + " - " + a; }
  // A fraction of an inch as TeX, reduced: 1.375 → 1\frac{3}{8}.
  function inch(v) {
    var w = Math.floor(v + 1e-9), f = v - w, d = 16, n = Math.round(f * 16);
    while (n && n % 2 === 0 && d > 1) { n /= 2; d /= 2; }
    if (!n) return String(w);
    return (w ? w : "") + "\\frac{" + n + "}{" + d + "}";
  }
  function recap(rows, art) {
    return { type: "learn", kicker: "Recap", prompt: "What this lesson gave you — come back to this card whenever you need it.",
      art: art, scene: { type: "walk", rows: rows, start: rows.length } };
  }
  function lookup(id) { return SKILLS.filter(function (x) { return x.id === id; })[0]; }
  // A problem drawn from a skill, fixed for a lesson ("Remember?", review).
  function drawn(id, seed, o) {
    var sk = lookup(id), st = sk.gen(L.rng("geo1:" + id + ":" + seed), seed);
    st.skill = sk.title;
    return Object.assign(st, o || {});
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
  function onLine(names, o) {
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
  var SKILLS = [
    { id: "geo1-name", title: "Points, lines and planes", lesson: 1,
      gen: function (R) {
        var form = R.pick(["line", "line", "plane", "collinear", "coplanar", "howmany", "count"]);
        if (form === "line") {
          var n = letters(R, 4), on = n.slice(0, 3), off = n[3], low = R.pick(["m", "n", "p", "q"]);
          var two = R.shuffle(on).slice(0, 2);
          var art = onLine(on, { n: low, extra: [{ pt: [2.6, 3.1], name: off, at: "n" }],
            alt: "A line named " + low + " through " + on.join(", ") + ". Point " + off + " is above the line, off it." });
          return mc(R, { prompt: "Which is another name for line $" + low + "$?", art: art,
            right: "$\\overleftrightarrow{" + two[0] + two[1] + "}$",
            wrong: [{ t: "$\\overleftrightarrow{" + on[0] + off + "}$", fb: "$" + off + "$ isn't on line $" + low + "$. A line is named by two points **on** it." },
                    { t: "line $" + on[1] + "$", fb: "One capital letter names a point. A line needs two of its points, or its own lowercase letter." },
                    { t: "plane $" + on.join("") + "$", fb: "Those three points all lie on one line, so they can't pick out a plane — and the question asks for a line." }],
            hints: ["A line is named by any two points on it, in either order, with a two-way arrow on top.", "Which points sit on line $" + low + "$? $" + on.join("$, $") + "$."],
            why: "$" + two[0] + "$ and $" + two[1] + "$ are both on line $" + low + "$, so $\\overleftrightarrow{" + two[0] + two[1] + "}$ names it." });
        }
        if (form === "plane") {
          var p = letters(R, 4), X = p[0], W = p[1], Y = p[2], Z = p[3], nm = R.pick(["M", "N", "P", "Q", "R"]);
          var art2 = plain([0, 8], [0, 3.8], [{ plane: sheet(0.5, 0.5, 5.4, 2.8, 1.8), name: SCRIPT[nm] }, { dline: [[1.1, 1.2], [6.2, 1.2]] },
            { pt: [1.6, 1.2], name: X, at: "s" }, { pt: [3.2, 1.2], name: W, at: "s" }, { pt: [4.8, 1.2], name: Y, at: "s" }, { pt: [4.5, 2.8], name: Z, at: "n" }],
            { u: 40, alt: "Plane " + nm + " holds points " + X + ", " + W + " and " + Y + " on one line, and point " + Z + " off that line." });
          var good = R.shuffle([X + Y + Z, Z + W + X, Y + Z + W, Z + X + Y]).slice(0, 2);
          return mc(R, { prompt: "Which is **not** a name for plane " + PN(nm) + "?", art: art2,
            right: "plane $" + R.shuffle([X, W, Y]).join("") + "$",
            wrong: [{ t: "plane $" + good[0] + "$", fb: "That one works: $" + good[0].split("").join("$, $") + "$ are three points of the plane that aren't on one line." },
                    { t: "plane $" + good[1] + "$", fb: "That one works: its three points are in the plane and not on one line." },
                    { t: "plane " + PN(nm), fb: "That's the plane's own name, the script letter." }],
            hints: ["Three points name a plane only if they are **not** on one line.", "Look for three points that are collinear."],
            why: "$" + X + "$, $" + W + "$ and $" + Y + "$ are collinear. Endlessly many planes hold that line, so those three can't name one plane." });
        }
        if (form === "collinear") {
          var T = R.pick([
            { on: [[1, 3.2], [3, 2.2], [5, 1.2]], off: [[4.4, 3.2], [2.1, 1]] },
            { on: [[1, 1], [3, 2], [5, 3]], off: [[2, 3.1], [4.6, 1]] },
            { on: [[0.9, 2], [3, 2], [5.1, 2]], off: [[2.1, 3.4], [4, 0.7]] }]);
          var c = letters(R, 5);
          var items = [{ line: [T.on[0], T.on[2]], c: "soft" }].concat(T.on.concat(T.off).map(function (q, i) { return { pt: q, name: c[i], at: i >= 3 ? "n" : "nw" }; }));
          function set(i, j, k) { return "$" + c[i] + "$, $" + c[j] + "$ and $" + c[k] + "$"; }
          return mc(R, { prompt: "Which three points are **collinear**?", art: plain([0, 6], [0, 4], items, { u: 44, alt: "Five points and a line through three of them." }),
            right: set(0, 1, 2),
            wrong: [{ t: set(0, 1, 3), fb: "The line through $" + c[0] + "$ and $" + c[1] + "$ misses $" + c[3] + "$." },
                    { t: set(1, 2, 4), fb: "The line through $" + c[1] + "$ and $" + c[2] + "$ misses $" + c[4] + "$." },
                    { t: set(0, 3, 4), fb: "No straight line runs through all three of those." }],
            hints: ["Collinear means on the same line. Which three points does the drawn line pass through?"],
            why: set(0, 1, 2) + " all lie on the one line drawn." });
        }
        if (form === "coplanar") {
          var q = letters(R, 5), nm2 = R.pick(["M", "N", "P", "R", "T"]);
          var art3 = plain([0, 8], [0, 5], [{ plane: sheet(0.5, 0.4, 5.2, 2.6, 1.9), name: SCRIPT[nm2] },
            { pt: [1.8, 1.2], name: q[0], at: "s" }, { pt: [4.6, 1.1], name: q[1], at: "s" }, { pt: [3.6, 2.4], name: q[2], at: "n" }, { pt: [5.6, 2.2], name: q[3], at: "n" },
            { pt: [2.4, 4.3], name: q[4], at: "n", c: "orange" }], { u: 38, alt: "Plane " + nm2 + " holds four points; a fifth point is above the plane." });
          return mc(R, { prompt: "Which point is **not** coplanar with $" + q[0] + "$, $" + q[1] + "$ and $" + q[2] + "$?", art: art3,
            right: "$" + q[4] + "$",
            wrong: [{ t: "$" + q[3] + "$", fb: "$" + q[3] + "$ is drawn on the sheet, so it's in plane " + PN(nm2) + " with the other three." },
                    { t: "All of them are coplanar", fb: "Look for a point that is off the sheet." }],
            hints: ["Coplanar means in the same plane. $" + q[0] + "$, $" + q[1] + "$ and $" + q[2] + "$ lie in plane " + PN(nm2) + ".", "Which point is not on the sheet?"],
            why: "$" + q[0] + "$, $" + q[1] + "$ and $" + q[2] + "$ fix plane " + PN(nm2) + ", and $" + q[4] + "$ is off it, above the sheet." });
        }
        if (form === "howmany") {
          var S = R.pick([
            { w: "three points that are **not** on one line", a: 0, why: "Exactly one plane passes through any three noncollinear points." },
            { w: "three points that **are** on one line", a: 1, why: "Every plane that holds their line holds all three — like pages turning on a book's spine — so there are infinitely many." },
            { w: "a line and a point that is **not** on it", a: 0, why: "Pick two points on the line: with the third point that makes three noncollinear points, and exactly one plane holds them." },
            { w: "two points", a: 1, why: "Two points fix a line, and endlessly many planes turn around that line." },
            { w: "two lines that cross at one point", a: 0, why: "Take the crossing point and one more point on each line: three noncollinear points, so exactly one plane." }]);
          var opts = ["Exactly one", "Infinitely many", "None"];
          var fbs = [S.a === 1 ? "One plane holds them — but turn it around their line and it still does." : "", S.a === 0 ? "Try it with a sheet of card: once it touches all of them, it can't turn any more." : "",
                     "There's always at least one plane that holds them."];
          return { type: "choice", prompt: "How many planes contain " + S.w + "?", keep: true,
            options: opts.map(function (t, i) { return i === S.a ? { t: t } : { t: t, fb: fbs[i] || "Picture a flat sheet of card resting on them." }; }),
            answer: S.a,
            hints: ["Imagine a sheet of card touching all of them. Can it still swing around, or is it stuck?"],
            why: S.why };
        }
        var k = R.int(3, 5), nm3 = letters(R, k), low2 = R.pick(["m", "n", "p"]);
        return { type: "num", prompt: "Line $" + low2 + "$ passes through " + k + " named points. How many different names like $\\overleftrightarrow{" + nm3[0] + nm3[1] + "}$ does it have? (Two points, in either order, count as two names.)",
          art: onLine(nm3, { n: low2 }), answer: k * (k - 1), label: "Names",
          near: [{ v: k * (k - 1) / 2, fb: "That counts each pair once. $\\overleftrightarrow{" + nm3[0] + nm3[1] + "}$ and $\\overleftrightarrow{" + nm3[1] + nm3[0] + "}$ are two different names." }],
          hints: ["Choose the first letter: " + k + " ways. Then the second: any of the other " + (k - 1) + ".", k + " × " + (k - 1) + " = ?"],
          why: "Any of the " + k + " points can go first and any of the other " + (k - 1) + " second: $" + k + " \\times " + (k - 1) + " = " + k * (k - 1) + "$ names." };
      } },
    { id: "geo1-space", title: "Lines and planes in space", lesson: 2,
      gen: function (R) {
        var form = R.pick(["meet", "meet", "parallel", "coplanar", "kind", "most", "model", "describe"]);
        function nm(f) { return "plane $" + f.c.slice(0, 3).map(function (i) { return BOX[i]; }).join("") + "$"; }
        if (form === "meet") {
          // Two faces that share an edge: their planes meet in that edge's line.
          var pairs = [];
          FACES.forEach(function (a) { FACES.forEach(function (b) {
            if (a.k >= b.k || OPP[a.k] === b.k) return;
            var common = a.c.filter(function (i) { return b.c.indexOf(i) >= 0; });
            if (common.length === 2) pairs.push([a, b, common]);
          }); });
          var P = R.pick(pairs), e = P[2].map(function (i) { return BOX[i]; });
          var other = R.pick(FACES.filter(function (f) { return f !== P[0] && f !== P[1]; }).map(function (f) {
            for (var k = 0; k < 4; k++) { var a = f.c[k], b = f.c[(k + 1) % 4]; if (!(P[2].indexOf(a) >= 0 && P[2].indexOf(b) >= 0)) return [BOX[a], BOX[b]]; }
            return null;
          }).filter(Boolean));
          return mc(R, { prompt: "Name the intersection of " + nm(P[0]) + " and " + nm(P[1]) + ".", art: boxFig(),
            right: "$\\overleftrightarrow{" + e[0] + e[1] + "}$",
            wrong: [{ t: "point $" + e[0] + "$", fb: "Two planes that meet share a whole **line**, not a single point." },
                    { t: "$\\overleftrightarrow{" + other[0] + other[1] + "}$", fb: "That edge isn't in both faces. Find the edge the two faces share." },
                    { t: "They don't intersect", fb: "These two faces touch along an edge, so their planes cross there." }],
            hints: ["Find each face on the box. Which edge do they share?"],
            why: "The two faces share the edge from $" + e[0] + "$ to $" + e[1] + "$; their planes meet in the line through it, $\\overleftrightarrow{" + e[0] + e[1] + "}$." });
        }
        if (form === "parallel") {
          var f = R.pick(FACES), g = FACES.filter(function (x) { return x.k === OPP[f.k]; })[0];
          return mc(R, { prompt: "Do " + nm(f) + " and " + nm(g) + " intersect?", art: boxFig(),
            right: "No — they are opposite faces, and their planes never meet",
            wrong: [{ t: "Yes, in a line", fb: "Opposite faces of a box never touch, however far you extend them: those planes are parallel." },
                    { t: "Yes, at one point", fb: "Two planes never meet at just one point — they meet in a line or not at all." }],
            hints: ["Find both faces. Do they share an edge — or are they opposite each other?"],
            why: "They are opposite faces of the box. Their planes are parallel, so they have no intersection." });
        }
        if (form === "coplanar") {
          var face = R.pick(FACES), yes = R.chance(0.5), four, off;
          if (yes) four = face.c.slice();
          else {
            off = R.pick([0, 1, 2, 3, 4, 5, 6, 7].filter(function (i) { return face.c.indexOf(i) < 0; }));
            four = R.shuffle(face.c).slice(0, 3).concat([off]);
          }
          var names = R.shuffle(four).map(function (i) { return "$" + BOX[i] + "$"; });
          return { type: "choice", prompt: "Are " + names.slice(0, 3).join(", ") + " and " + names[3] + " coplanar?", art: boxFig(), keep: true,
            options: [{ t: "Yes", fb: yes ? null : "Three of them fix one face's plane, and $" + BOX[off] + "$ isn't in that face." },
                      { t: "No", fb: yes ? "All four are corners of one face, so they're in that face's plane." : null }],
            answer: yes ? 0 : 1,
            hints: ["Is there one face of the box that has all four as corners?"],
            why: yes ? "All four are corners of the " + face.k + " face, so they lie in its plane." :
              "Any three of them that are corners of the " + face.k + " face fix its plane, and $" + BOX[off] + "$ is not in that face." };
        }
        if (form === "kind") {
          var K = R.pick([
            { q: "two planes that meet", a: "A line", why: "Two planes that cross share a whole line — like two walls meeting at a corner." },
            { q: "two lines that cross", a: "A point", why: "Two different lines can share at most one point." },
            { q: "a line that crosses a plane but doesn't lie in it", a: "A point", why: "If it shared two points with the plane, the whole line would lie in the plane. So it passes through at one point." }]);
          var all = ["A point", "A line", "A plane"];
          return { type: "choice", prompt: "What is the intersection of " + K.q + "?", keep: true,
            options: all.map(function (t) { return t === K.a ? { t: t } : { t: t, fb: t === "A plane" ? "Two different figures like these can't share a whole plane." : t === "A line" ? "Picture it: they only share one spot." : "They share more than one spot — think of two walls meeting." }; }),
            answer: all.indexOf(K.a), hints: ["Picture it with real things: pencils, sheets of card, a wall and the floor."], why: K.why };
        }
        if (form === "most") {
          var k = R.int(3, 6);
          return { type: "num", prompt: k + " lines lie in one plane. What is the **greatest** number of points where they can cross each other?", answer: k * (k - 1) / 2, label: "Crossing points",
            near: [{ v: k * (k - 1), fb: "That counts each crossing twice — line 1 meeting line 2 is the same point as line 2 meeting line 1." }, { v: k, fb: "Each line can cross every other line, not just one." }],
            hints: ["The most crossings happen when every pair of lines crosses, and no three meet at one point.", "How many pairs can you make from " + k + " lines?"],
            why: "Every pair of lines can cross once: " + k + " × " + (k - 1) + " ordered pairs, halved because each pair was counted twice, is $" + k * (k - 1) / 2 + "$." };
        }
        if (form === "model") {
          var M = R.pick([
            { o: "the tip of a pencil", a: 0 }, { o: "a knot in a string", a: 0 }, { o: "a star seen in the night sky", a: 0 }, { o: "a city on a map of the country", a: 0 },
            { o: "a tightly stretched wire", a: 1 }, { o: "the crease in a folded sheet of paper", a: 1 }, { o: "the beam of a laser", a: 1 }, { o: "a road on a map, seen as a thin path", a: 1 },
            { o: "a ceiling", a: 2 }, { o: "a tabletop", a: 2 }, { o: "the surface of a still pond", a: 2 }, { o: "a sheet of paper", a: 2 }]);
          var T3 = ["A point", "A line", "A plane"];
          return { type: "choice", prompt: "Which geometric term does " + M.o + " model best?", keep: true,
            options: T3.map(function (t, i) { return i === M.a ? { t: t } : { t: t, fb: ["A point is a single location, with no length at all.", "A line is a straight path, long in one direction and thin in every other.", "A plane is a flat surface, spreading out in every direction."][i] }; }),
            answer: M.a, hints: ["Is it more like a spot, a thin straight path, or a flat surface?"],
            why: "It's most like " + T3[M.a].toLowerCase() + ": " + ["one location, with (almost) no size.", "long and straight, with (almost) no thickness.", "flat, spreading out in every direction."][M.a] };
        }
        var D = R.pick([
          { art: twoPlanesFig({ names: ["A", "B"] }), right: "Planes " + PN("P") + " and " + PN("Q") + " intersect in $\\overleftrightarrow{AB}$",
            wrong: [{ t: "Planes " + PN("P") + " and " + PN("Q") + " do not intersect", fb: "Look where the two sheets cross." },
                    { t: "$\\overleftrightarrow{AB}$ meets " + PN("P") + " only at $A$", fb: "The whole of $\\overleftrightarrow{AB}$ lies in both planes." }] },
          { art: pierceFig({ plane: "ℛ", at: "R", line: "m" }), right: "Line $m$ intersects plane " + PN("R") + " at $R$",
            wrong: [{ t: "Line $m$ lies in plane " + PN("R"), fb: "Most of line $m$ is off the sheet: it only passes through it." },
                    { t: "Line $m$ does not meet plane " + PN("R"), fb: "It goes through the sheet at $R$ — the part below is dashed because it's hidden." }] },
          { art: crossFig({ at: "T", a: "ℓ", b: "m" }), right: "Lines ℓ and $m$ intersect at $T$",
            wrong: [{ t: "Lines ℓ and $m$ are the same line", fb: "They cross, so they point different ways: two lines." },
                    { t: "Point $T$ is on line $m$ only", fb: "$T$ is where they cross, so it's on both lines." }] }]);
        return mc(R, { prompt: "Which sentence describes the figure?", art: D.art, right: D.right, wrong: D.wrong,
          hints: ["Say what you see: what crosses what, and where."], why: D.right + "." });
      } },
    { id: "geo1-ruler", title: "Measuring segments", lesson: 3,
      gen: function (R) {
        var form = R.pick(["mm", "mm", "cm", "inch", "inch", "worn"]);
        var nm = letters(R, 2);
        var seg = "$\\overline{" + nm[0] + nm[1] + "}$";
        if (form === "mm") {
          var L10 = R.int(12, 54);
          if (L10 % 10 === 0) L10 += 3;
          var inMM = R.chance(0.5);
          return { type: "num", prompt: "How long is " + seg + "? Give your answer in **" + (inMM ? "millimetres" : "centimetres") + "**.",
            art: GT.ruler({ unit: "cm", div: 10, len: 6, seg: [0, L10 / 10], names: nm, alt: "A centimetre ruler with millimetre marks; the segment runs from 0 to " + (L10 / 10) + " cm." }),
            answer: inMM ? L10 : L10 / 10, post: inMM ? "mm" : "cm", label: "Length",
            near: [{ v: inMM ? L10 / 10 : L10, fb: inMM ? "That's the length in centimetres. There are 10 millimetres in every centimetre." : "That's the length in millimetres. Divide by 10 for centimetres." }],
            hints: ["The long marks with numbers are centimetres. The small marks between them are millimetres — 10 to a centimetre.",
                    "The segment ends " + (L10 % 10) + " small marks after the " + Math.floor(L10 / 10) + " cm mark."],
            why: Math.floor(L10 / 10) + " cm and " + (L10 % 10) + " mm: $" + num(L10 / 10) + "$ cm, which is $" + L10 + "$ mm." };
        }
        if (form === "cm") {
          var w = R.int(2, 5), f = R.pick([0.1, 0.2, 0.3, 0.7, 0.8, 0.9]), Lc = w + f, near = Math.round(Lc);
          return { type: "num", prompt: "This ruler has only centimetre marks. To the nearest centimetre, how long is " + seg + "?",
            art: GT.ruler({ unit: "cm", div: 1, len: 6, seg: [0, Lc], names: nm, alt: "A ruler marked only in whole centimetres; the segment ends between two marks." }),
            answer: near, post: "cm", label: "Length",
            near: [{ v: near === w ? w + 1 : w, fb: "Which mark is the end **closer** to? That's the nearest centimetre." }],
            hints: ["The end falls between two marks. Which one is it closer to?"],
            why: "The end is between " + w + " and " + (w + 1) + " cm, nearer to " + near + ": about $" + near + "$ cm." };
        }
        if (form === "inch") {
          var div = R.pick([2, 4, 8, 8, 16, 16]), k, whole = R.int(1, 2);
          do { k = R.int(1, div - 1); } while (div > 2 && k % 2 === 0);
          var Li = whole + k / div;
          var cands = [];
          function add(v, fb) { if (v > 0 && v < 4 && Math.abs(v - Li) > 1e-9 && !cands.some(function (c) { return Math.abs(c.v - v) < 1e-9; })) cands.push({ v: v, fb: fb }); }
          if (div < 16) add(whole + k / (div * 2), "Look at how many parts each inch is cut into: count the spaces between the whole-inch marks.");
          add(whole + (k + 1) / div, "Count again, one mark at a time: the end is one mark short of that.");
          add(whole + (k - 1) / div, "Count again, one mark at a time: the end is one mark past that.");
          if (div > 2) add(whole + k / (div / 2), "Each inch here is cut into " + div + " parts, not " + div / 2 + ".");
          var wrong = cands.slice(0, 3).map(function (c) { return { t: "$" + inch(c.v) + "$ in.", fb: c.fb }; });
          var part = { 2: "halves", 4: "quarters", 8: "eighths", 16: "sixteenths" }[div];
          return mc(R, { prompt: "How long is " + seg + "?",
            art: GT.ruler({ unit: "in", div: div, len: 3, seg: [0, Li], names: nm, alt: "An inch ruler cut into " + part + "; the segment ends between " + whole + " and " + (whole + 1) + " inches." }),
            right: "$" + inch(Li) + "$ in.", wrong: wrong,
            hints: ["First: into how many parts is each inch cut? Count the spaces between 0 and 1.", "Each inch is cut into " + part + ". Count the marks after the " + whole + "-inch mark."],
            why: "Each inch is cut into " + part + ", and the end is " + k + " of them past " + whole + " in.: $" + inch(Li) + "$ in." });
        }
        var a = R.int(1, 2), Lw = R.int(12, 38) / 10;
        if (Math.abs(Lw * 10 % 10) < 1e-9) Lw += 0.4;
        var b = a + Lw;
        return { type: "num", prompt: "The end of this ruler is worn away, so " + seg + " is laid from the $" + a + "$ cm mark. How long is " + seg + "?",
          art: GT.ruler({ unit: "cm", div: 10, len: 6, seg: [a, b], names: nm, alt: "A centimetre ruler; the segment starts at the " + a + " cm mark and ends at " + num(b) + " cm." }),
          answer: r1(Lw), post: "cm", label: "Length",
          near: [{ v: r1(b), fb: "That's where the end is on the ruler. The segment starts at " + a + ", not 0 — subtract." }],
          hints: ["Read both ends: where does it start, and where does it stop?", "Length = end − start."],
          why: "It runs from $" + a + "$ to $" + num(r1(b)) + "$: $" + num(r1(b)) + " - " + a + " = " + num(r1(Lw)) + "$ cm." };
      } },
    { id: "geo1-precision", title: "Precision and error", lesson: 3,
      gen: function (R) {
        var form = R.pick(["metric", "metric", "inch", "perim", "relative"]);
        if (form === "metric") {
          var M = R.pick([
            { v: R.int(12, 95), u: "m", d: 0 }, { v: R.int(12, 95), u: "mm", d: 0 }, { v: R.int(105, 480), u: "cm", d: 0 },
            { v: R.int(21, 98) / 10, u: "cm", d: 1 }, { v: R.int(21, 98) / 10, u: "m", d: 1 }]);
          if (M.d && Math.round(M.v * 10) % 10 === 0) M.v += 0.3;
          var h = M.d ? 0.05 : 0.5, lo = r2(M.v - h), hi = r2(M.v + h), sm = M.d ? "tenth of a " + (M.u === "m" ? "metre" : "centimetre") : M.u === "m" ? "metre" : M.u === "mm" ? "millimetre" : "centimetre";
          function rng2(a, b) { return "between $" + num(a) + "$ and $" + num(b) + "$ " + M.u; }
          return mc(R, { prompt: "A length is measured as **" + num(M.v) + " " + M.u + "**. What could its actual length be?",
            right: rng2(lo, hi),
            wrong: [{ t: rng2(r2(M.v - 2 * h), r2(M.v + 2 * h)), fb: "That's a whole smallest unit either side. A measurement is precise to within **half** of its smallest unit." },
                    { t: rng2(M.v, r2(M.v + 2 * h)), fb: "The real length could be a little under the reading as well as a little over." },
                    { t: "exactly $" + num(M.v) + "$ " + M.u, fb: "No measurement is exact: it's only as fine as the smallest mark on the tool." }],
            hints: ["The last digit tells you the smallest unit used: here a " + sm + ".", "The measurement is precise to within half of that: $" + num(h) + "$ " + M.u + " either way."],
            why: "It was measured to the nearest " + sm + ", so it's precise to within $" + num(h) + "$ " + M.u + ": " + rng2(lo, hi) + "." });
        }
        if (form === "inch") {
          var d = R.pick([2, 4, 8]), w = R.int(2, 15), k;
          do { k = R.int(1, d - 1); } while (d === 8 && k % 2 === 0);
          var v = w + k / d, hh = 1 / (2 * d);
          var fr = "$" + w + "\\frac{" + k + "}{" + d + "}$";
          function rngI(a, b) { return "between $" + inch(a) + "$ in. and $" + inch(b) + "$ in."; }
          return mc(R, { prompt: "A length is measured as " + fr + " in. on a ruler marked in " + { 2: "halves", 4: "quarters", 8: "eighths" }[d] + " of an inch. What could its actual length be?",
            right: rngI(v - hh, v + hh),
            wrong: [{ t: rngI(v - 2 * hh, v + 2 * hh), fb: "That's a whole mark either side. The precision is **half** of the smallest mark: half of $\\frac{1}{" + d + "}$." },
                    { t: rngI(v - hh / 2, v + hh / 2), fb: "That's half of too small a unit. The smallest mark here is $\\frac{1}{" + d + "}$ in., and half of it is $\\frac{1}{" + 2 * d + "}$ in." }],
            hints: ["The smallest mark on this ruler is $\\frac{1}{" + d + "}$ in.", "Half of $\\frac{1}{" + d + "}$ is $\\frac{1}{" + 2 * d + "}$. Go that far either way."],
            why: "Half of $\\frac{1}{" + d + "}$ in. is $\\frac{1}{" + 2 * d + "}$ in., so it's " + rngI(v - hh, v + hh) + "." });
        }
        if (form === "perim") {
          var s = R.distinct ? R.distinct(3, 3, 11) : [R.int(3, 5), R.int(6, 8), R.int(9, 11)];
          s.sort(function (a, b) { return a - b; });
          if (s[0] + s[1] <= s[2]) s[2] = s[0] + s[1] - 1;
          var sum = s[0] + s[1] + s[2], least = R.chance(0.5);
          return { type: "num", prompt: "The sides of a triangle were measured with a centimetre ruler as $" + s[0] + "$ cm, $" + s[1] + "$ cm and $" + s[2] + "$ cm. What is the **" + (least ? "least" : "greatest") + "** its perimeter could really be?",
            answer: least ? sum - 1.5 : sum + 1.5, post: "cm", label: "Perimeter",
            near: [{ v: sum, fb: "That's the perimeter of the measurements. Each side could really be up to half a centimetre " + (least ? "shorter" : "longer") + "." },
                   { v: least ? sum - 0.5 : sum + 0.5, fb: "Each of the **three** sides could be half a centimetre " + (least ? "shorter" : "longer") + " — that's 1.5 cm in all." }],
            hints: ["Each side is precise to within $0.5$ cm.", "Take every side at its " + (least ? "shortest" : "longest") + ": " + s.map(function (x) { return num(least ? x - 0.5 : x + 0.5); }).join(", ") + "."],
            why: "$" + s.map(function (x) { return num(least ? x - 0.5 : x + 0.5); }).join(" + ") + " = " + num(least ? sum - 1.5 : sum + 1.5) + "$ cm." };
        }
        var mv = R.pick([8, 10, 12, 16, 20, 25, 40, 50]) * R.pick([1, 1, 2]), u = R.pick(["ft", "in.", "cm", "m"]);
        var pct = 0.5 / mv * 100;
        return { type: "num", prompt: "A length is measured as $" + mv + "$ " + u + ", so it could be off by up to $0.5$ " + u + ". What is its **relative error**, as a percent? Round to the nearest tenth of a percent.",
          answer: r1(pct), tol: 0.051, post: "%", label: "Relative error", shown: String(r1(pct)),
          near: [{ v: 0.5, fb: "That's the absolute error. The relative error compares it with the whole length: divide by $" + mv + "$." }, { v: r1(0.5 / mv), tol: 0.02, fb: "That's the ratio as a decimal. Multiply by 100 for a percent." }],
          hints: ["Relative error = absolute error ÷ measurement.", "$0.5 \\div " + mv + " = " + num(0.5 / mv) + "$. Now make it a percent."],
          why: "$\\frac{0.5}{" + mv + "} = " + num(0.5 / mv) + "$, which is about $" + num(r1(pct)) + "\\%$." };
      } },
    { id: "geo1-segadd", title: "Adding segments", lesson: 4,
      gen: function (R) {
        var form = R.pick(["whole", "part", "alg", "alg", "alg2", "between"]);
        var n = letters(R, 3), A = n[0], B = n[1], C = n[2];
        if (form === "whole" || form === "part") {
          var tenth = R.chance(0.5);
          var a = tenth ? R.int(12, 69) / 10 : R.int(3, 16), b = tenth ? R.int(12, 69) / 10 : R.int(3, 16), u = R.pick(["cm", "in.", "mm", "m"]);
          var whole = r1(a + b);
          if (form === "whole") {
            return { type: "num", prompt: "$" + B + "$ is between $" + A + "$ and $" + C + "$. Find $" + A + C + "$.",
              art: segRow([[A, 0], [B, 2.4 * a / (a + b) * 2.2], [C, 5.2]], { over: [[0, 1, num(a) + " " + u], [1, 2, num(b) + " " + u]] }),
              answer: whole, post: u, label: A + C,
              near: [{ v: r1(Math.abs(a - b)), fb: "The parts **add** up to the whole." }],
              hints: ["The two parts add up to the whole: $" + A + B + " + " + B + C + " = " + A + C + "$."],
              why: "$" + A + C + " = " + A + B + " + " + B + C + " = " + num(a) + " + " + num(b) + " = " + num(whole) + "$ " + u + "." };
          }
          return { type: "num", prompt: "$" + B + "$ is between $" + A + "$ and $" + C + "$. Find $" + A + B + "$.",
            art: segRow([[A, 0], [B, 2.4 * a / (a + b) * 2.2], [C, 5.2]], { over: [[0, 1, "?"], [1, 2, num(b) + " " + u]], under: [[0, 2, num(whole) + " " + u]] }),
            answer: r1(a), post: u, label: A + B,
            near: [{ v: r1(whole + b), fb: "That adds the whole and a part. The part you want is the whole **minus** the other part." }],
            hints: ["$" + A + B + " + " + B + C + " = " + A + C + "$, so $" + A + B + " = " + A + C + " - " + B + C + "$."],
            why: "$" + A + B + " = " + num(whole) + " - " + num(b) + " = " + num(r1(a)) + "$ " + u + "." };
        }
        if (form === "alg" || form === "alg2") {
          // B between A and C; AB = px + q, BC = rx + t; AC either a number or sx + u.
          var x, p, q, r, t, ab, bc, tries = 0;
          do {
            x = R.int(2, 12); p = R.int(1, 5); r = R.int(1, 5); q = R.int(-9, 9); t = R.int(-9, 9);
            ab = p * x + q; bc = r * x + t; tries++;
          } while ((ab <= 0 || bc <= 0) && tries < 50);
          if (ab <= 0 || bc <= 0) { x = 5; p = 2; q = 1; r = 3; t = -4; ab = 11; bc = 11; }
          function ex(k, c) { return (k === 1 ? "" : k) + "x" + (c ? " " + signed(c) : ""); }
          var acTex, eq, s = 0, uu;
          if (form === "alg") { acTex = String(ab + bc); eq = "(" + ex(p, q) + ") + (" + ex(r, t) + ") = " + (ab + bc); }
          else {
            do { s = R.int(1, p + r + 3); } while (s === p + r);
            uu = (p + r - s) * x + q + t;
            acTex = ex(s, uu);
            if (s * x + uu <= 0) { acTex = String(ab + bc); form = "alg"; }
            eq = "(" + ex(p, q) + ") + (" + ex(r, t) + ") = " + acTex;
          }
          var ask = R.pick(["x", "AB", "BC"]), ans = ask === "x" ? x : ask === "AB" ? ab : bc;
          var lab = ask === "x" ? "x" : ask === "AB" ? A + B : B + C;
          return { type: "num", prompt: "$" + B + "$ is between $" + A + "$ and $" + C + "$, with $" + A + B + " = " + ex(p, q) + "$, $" + B + C + " = " + ex(r, t) + "$ and $" + A + C + " = " + acTex + "$. Find $" + lab + "$.",
            art: segRow([[A, 0], [B, 2.6], [C, 5.2]], { over: [[0, 1, ex(p, q)], [1, 2, ex(r, t)]], under: [[0, 2, acTex]] }),
            answer: ans, label: lab,
            near: ask === "x" ? [{ v: ab, fb: "That's $" + A + B + "$. The question asks for $x$." }, { v: bc, fb: "That's $" + B + C + "$. The question asks for $x$." }].filter(function (z) { return z.v !== x; })
                              : [{ v: x, fb: "That's $x$. Put it back into $" + lab + " = " + (ask === "AB" ? ex(p, q) : ex(r, t)) + "$." }].filter(function (z) { return z.v !== ans; }),
            hints: ["The parts add up to the whole: $" + A + B + " + " + B + C + " = " + A + C + "$.", "So $" + eq + "$. Solve for $x$.",
                    ask === "x" ? "Collect the $x$ terms on one side and the numbers on the other." : "Then put $x = " + x + "$ into the expression for $" + lab + "$."],
            why: "$" + eq + "$ gives $x = " + x + "$" + (ask === "x" ? "." : ", so $" + lab + " = " + ans + "$.") };
        }
        // Not between: then the three points make a triangle, so AC is less than AB + BC.
        var d1 = R.int(3, 14), d2 = R.int(3, 14), yes = R.chance(0.5), d3 = yes ? d1 + d2 : d1 + d2 - R.int(1, 3);
        return mc(R, { prompt: "$" + A + B + " = " + d1 + "$, $" + B + C + " = " + d2 + "$ and $" + A + C + " = " + d3 + "$. Is $" + B + "$ between $" + A + "$ and $" + C + "$?", keep: true,
          right: yes ? "Yes: $" + d1 + " + " + d2 + " = " + d3 + "$" : "No: $" + d1 + " + " + d2 + " \\ne " + d3 + "$",
          wrong: [{ t: yes ? "No: $" + d1 + " + " + d2 + " \\ne " + d3 + "$" : "Yes: $" + d1 + " + " + d2 + " = " + d3 + "$", fb: "Add them again: $" + d1 + " + " + d2 + " = " + (d1 + d2) + "$." },
                  { t: "You can't tell without a picture", fb: "You can: $" + B + "$ is between exactly when the two parts add up to the whole." }],
          hints: ["$" + B + "$ is between $" + A + "$ and $" + C + "$ exactly when $" + A + B + " + " + B + C + " = " + A + C + "$."],
          why: "$" + d1 + " + " + d2 + " = " + (d1 + d2) + "$" + (yes ? ", which is $" + A + C + "$: $" + B + "$ is between them." : ", not $" + d3 + "$. So $" + B + "$ is off segment $\\overline{" + A + C + "}$ — the three points make a triangle — and it isn't between them.") });
      } },
    { id: "geo1-congseg", title: "Congruent segments", lesson: 4,
      gen: function (R) {
        var form = R.pick(["kite", "kite", "star", "expr"]);
        if (form === "kite") {
          var k = letters(R, 4), P = { A: [3, 4.2], B: [4.7, 2.9], C: [3, -0.4], D: [1.3, 2.9] }, N = { A: k[0], B: k[1], C: k[2], D: k[3] };
          var art = plain([0, 6], [-1, 5], [{ seg: [P.A, P.B], marks: 1 }, { seg: [P.A, P.D], marks: 1 }, { seg: [P.C, P.B], marks: 2 }, { seg: [P.C, P.D], marks: 2 },
            { seg: [P.A, P.C], c: "soft", dash: "4 4" }, { seg: [P.B, P.D], c: "soft", dash: "4 4" },
            { pt: P.A, name: N.A, at: "n" }, { pt: P.B, name: N.B, at: "e" }, { pt: P.C, name: N.C, at: "s" }, { pt: P.D, name: N.D, at: "w" }],
            { u: 36, alt: "A kite: the two top sides carry one tick each and the two bottom sides two ticks each." });
          var q = R.pick([["A", "B", "A", "D"], ["C", "B", "C", "D"], ["A", "D", "A", "B"], ["C", "D", "C", "B"]]);
          function s2(a, b) { return "$\\overline{" + N[a] + N[b] + "}$"; }
          var one = q[0] === "A";
          return mc(R, { prompt: "Which segment is congruent to " + s2(q[0], q[1]) + "?", art: art,
            right: s2(q[2], q[3]),
            wrong: [{ t: one ? s2("C", "B") : s2("A", "B"), fb: "Count the tick marks: " + s2(q[0], q[1]) + " has " + (one ? "one" : "two") + ", and that one has " + (one ? "two" : "one") + "." },
                    { t: s2("A", "C"), fb: "That dashed diagonal has no tick marks, so nothing says it's congruent to anything." }],
            hints: ["Segments with the **same number** of tick marks are congruent."],
            why: s2(q[0], q[1]) + " and " + s2(q[2], q[3]) + " carry the same number of tick marks, so they're congruent." });
        }
        if (form === "star") {
          var m = letters(R, 5);
          var pts = [[0.4, 1], [2.2, 1], [4, 1], [5.8, 1]];
          var art2 = plain([-0.2, 6.4], [0, 2.2], [{ seg: [pts[0], pts[1]], marks: 1 }, { seg: [pts[1], pts[2]], marks: 1 }, { seg: [pts[2], pts[3]], marks: 1 },
            { pt: pts[0], name: m[0], at: "s" }, { pt: pts[1], name: m[1], at: "s" }, { pt: pts[2], name: m[2], at: "s" }, { pt: pts[3], name: m[3], at: "s" }],
            { u: 44, alt: "Four points on a segment; the three pieces each carry one tick mark." });
          var tot = R.int(4, 15) * 3;
          return { type: "num", prompt: "The three marked pieces are congruent, and $" + m[0] + m[3] + " = " + tot + "$. Find $" + m[0] + m[2] + "$.", art: art2,
            answer: tot / 3 * 2, label: m[0] + m[2],
            near: [{ v: tot / 3, fb: "That's one piece. $\\overline{" + m[0] + m[2] + "}$ is made of two." }, { v: tot / 2, fb: "The segment is cut into **three** equal pieces, not two." }],
            hints: ["The tick marks say all three pieces have the same length.", "One piece is $" + tot + " \\div 3 = " + tot / 3 + "$."],
            why: "Each piece is $" + tot + " \\div 3 = " + tot / 3 + "$, and $\\overline{" + m[0] + m[2] + "}$ is two pieces: $" + tot / 3 * 2 + "$." };
        }
        var E = R.pick([
          { a: "3(a + b)", b: "3a + 3b", same: true, why: "$3(a + b) = 3a + 3b$ for every $a$ and $b$ — the same length." },
          { a: "2(x + 4)", b: "2x + 4", same: false, why: "$2(x + 4) = 2x + 8$, which is 4 more than $2x + 4$." },
          { a: "5x - 5", b: "5(x - 1)", same: true, why: "$5(x - 1) = 5x - 5$: the same length." },
          { a: "4(y + 3)", b: "4y + 7", same: false, why: "$4(y + 3) = 4y + 12$, not $4y + 7$." },
          { a: "6(n - 2)", b: "6n - 12", same: true, why: "$6(n - 2) = 6n - 12$: the same length." }]);
        var p2 = letters(R, 4);
        return mc(R, { prompt: "$" + p2[0] + p2[1] + " = " + E.a + "$ and $" + p2[2] + p2[3] + " = " + E.b + "$. Are $\\overline{" + p2[0] + p2[1] + "}$ and $\\overline{" + p2[2] + p2[3] + "}$ congruent?", keep: true,
          right: E.same ? "Yes — they always have the same length" : "No — their lengths are different",
          wrong: [{ t: E.same ? "No — their lengths are different" : "Yes — they always have the same length", fb: "Multiply out the brackets and compare." }],
          hints: ["Congruent segments have equal lengths. Multiply out the brackets."], why: E.why });
      } },
    { id: "geo1-dist1", title: "Distance on a number line", lesson: 5,
      gen: function (R) {
        var form = R.pick(["read", "read", "coords", "temp"]);
        if (form === "read") {
          var lo = R.pick([-8, -6, -5, -4]), hi = lo + R.pick([12, 14, 16]), v = R.distinct(2, lo + 1, hi - 1).sort(function (a, b) { return a - b; }), n = letters(R, 2);
          if (R.chance(0.5)) v.reverse(), n.reverse();
          return { type: "num", prompt: "Find $" + n[0] + n[1] + "$.", art: numLine(lo, hi, [{ v: v[0], name: n[0] }, { v: v[1], name: n[1] }]),
            answer: Math.abs(v[0] - v[1]), label: n[0] + n[1],
            near: [{ v: Math.abs(v[0] + v[1]), fb: "Distance is the **difference** of the coordinates: $|" + v[0] + " - (" + v[1] + ")|$." }].filter(function (z) { return z.v !== Math.abs(v[0] - v[1]); }),
            hints: ["Read the two coordinates, then subtract and make the answer positive.", "$" + n[0] + "$ is at $" + v[0] + "$ and $" + n[1] + "$ is at $" + v[1] + "$."],
            why: "$" + n[0] + n[1] + " = |" + v[0] + " - (" + v[1] + ")| = " + Math.abs(v[0] - v[1]) + "$ — count the units between them to check." };
        }
        if (form === "coords") {
          var a = R.int(-30, 10) / (R.chance(0.3) ? 2 : 1), b = a + R.int(4, 25) / (R.chance(0.3) ? 2 : 1), m = letters(R, 2);
          return { type: "num", prompt: "On a number line, $" + m[0] + "$ is at $" + num(a) + "$ and $" + m[1] + "$ is at $" + num(b) + "$. Find $" + m[0] + m[1] + "$.",
            answer: r1(b - a), label: m[0] + m[1],
            near: [{ v: r1(Math.abs(a + b)), fb: "Subtract the coordinates — don't add them." }].filter(function (z) { return Math.abs(z.v - r1(b - a)) > 1e-9; }),
            hints: ["$" + m[0] + m[1] + " = |" + num(b) + " - (" + num(a) + ")|$."],
            why: "$|" + num(b) + " - (" + num(a) + ")| = " + num(r1(b - a)) + "$." };
        }
        var t1 = R.int(-15, 5), t2 = t1 + R.int(12, 40);
        return { type: "num", prompt: "Overnight the temperature fell from $" + t2 + "°$ to $" + t1 + "°$. By how many degrees did it fall?",
          answer: t2 - t1, post: "°", label: "Fall",
          near: [{ v: Math.abs(t2 + t1), fb: "Below zero counts too: the gap is $" + t2 + " - (" + t1 + ")$." }].filter(function (z) { return z.v !== t2 - t1; }),
          hints: ["Think of a thermometer as a number line. The fall is the distance between the two readings."],
          why: "$|" + t2 + " - (" + t1 + ")| = " + (t2 - t1) + "°$." };
      } },
    { id: "geo1-dist", title: "Distance in the coordinate plane", lesson: 5,
      gen: function (R) {
        var form = R.pick(["tenth", "tenth", "exact", "triple", "legs", "error"]);
        var n = letters(R, 2), A, B, dx, dy;
        function pickPts(nice) {
          var tries = 0;
          do {
            A = [R.int(-6, 5), R.int(-5, 5)];
            dx = R.nz(-8, 8); dy = R.nz(-7, 7);
            B = [A[0] + dx, A[1] + dy]; tries++;
          } while ((Math.abs(B[0]) > 7 || Math.abs(B[1]) > 6 || (nice === true && !isSquare(dx * dx + dy * dy)) || (nice === false && isSquare(dx * dx + dy * dy))) && tries < 400);
        }
        if (form === "triple") {
          var T = R.pick([[3, 4], [6, 8], [5, 12], [4, 3], [8, 6], [12, 5]]), sx = R.sign(), sy = R.sign();
          A = [R.int(-5, 0), R.int(-5, 0)]; dx = sx * T[0]; dy = sy * T[1];
          if (sx < 0) A[0] += T[0]; if (sy < 0) A[1] += T[1];
          B = [A[0] + dx, A[1] + dy];
          var d = Math.sqrt(dx * dx + dy * dy);
          return { type: "num", prompt: "Find the distance between $" + n[0] + pt(A) + "$ and $" + n[1] + pt(B) + "$.",
            art: grid([Math.min(A[0], B[0]) - 1, Math.max(A[0], B[0]) + 1], [Math.min(A[1], B[1]) - 1, Math.max(A[1], B[1]) + 1],
              [{ seg: [A, B], c: "blue" }, { pt: A, name: n[0] }, { pt: B, name: n[1] }], { u: 22, alt: "Two points on a grid joined by a segment." }),
            answer: d, label: n[0] + n[1],
            near: [{ v: Math.abs(dx) + Math.abs(dy), fb: "Walking across and then up is longer than going straight. Use the Pythagorean theorem on those two legs." }],
            hints: ["Across: $" + Math.abs(dx) + "$. Up or down: $" + Math.abs(dy) + "$.", "$d = \\sqrt{" + Math.abs(dx) + "^2 + " + Math.abs(dy) + "^2}$."],
            why: "$\\sqrt{" + dx * dx + " + " + dy * dy + "} = \\sqrt{" + (dx * dx + dy * dy) + "} = " + d + "$." };
        }
        if (form === "legs") {
          pickPts(false);
          var s2 = dx * dx + dy * dy;
          return mc(R, { prompt: "To find the distance from $" + n[0] + pt(A) + "$ to $" + n[1] + pt(B) + "$, which right triangle's hypotenuse do you need?",
            art: grid([Math.min(A[0], B[0]) - 1, Math.max(A[0], B[0]) + 1], [Math.min(A[1], B[1]) - 1, Math.max(A[1], B[1]) + 1],
              [{ seg: [A, B], c: "blue" }].concat(legs(A, B)).concat([{ pt: A, name: n[0] }, { pt: B, name: n[1] }]), { u: 22, alt: "The segment and a right triangle under it." }),
            right: "Legs $" + Math.abs(dx) + "$ and $" + Math.abs(dy) + "$, so $" + n[0] + n[1] + " = \\sqrt{" + s2 + "}$",
            wrong: [{ t: "Legs $" + Math.abs(dx) + "$ and $" + Math.abs(dy) + "$, so $" + n[0] + n[1] + " = " + (Math.abs(dx) + Math.abs(dy)) + "$", fb: "The hypotenuse isn't the sum of the legs — it's the square root of the sum of their **squares**." },
                    { t: "Legs $" + Math.abs(A[0] + B[0]) + "$ and $" + Math.abs(A[1] + B[1]) + "$, so $" + n[0] + n[1] + " = \\sqrt{" + (sq(A[0] + B[0]) + sq(A[1] + B[1])) + "}$", fb: "A leg is the **difference** of the coordinates: how far across, how far up." }],
            hints: ["The legs run across and up or down, from one point to the other. Count them on the grid."],
            why: "Across $" + Math.abs(dx) + "$, up or down $" + Math.abs(dy) + "$: $\\sqrt{" + Math.abs(dx) + "^2 + " + Math.abs(dy) + "^2} = \\sqrt{" + s2 + "}$." });
        }
        if (form === "error") {
          pickPts(false);
          if (A[0] >= 0) { A[0] = -R.int(1, 5); B = [A[0] + dx, A[1] + dy]; }
          if (B[0] <= 0) { dx = R.int(2, 6) - A[0]; B[0] = A[0] + dx; }
          var badDx = B[0] - (-A[0]);
          return mc(R, { prompt: "Kai finds the distance from $" + pt(A) + "$ to $" + pt(B) + "$ like this: $\\sqrt{(" + B[0] + " - " + (-A[0]) + ")^2 + (" + minus(B[1], A[1]) + ")^2}$. What went wrong?",
            right: "Subtracting $" + A[0] + "$ means $" + B[0] + " - (" + A[0] + ") = " + (B[0] - A[0]) + "$; he took away $" + (-A[0]) + "$ instead",
            wrong: [{ t: "He should add the coordinates, not subtract them", fb: "Subtracting is right — it's how far apart they are. The slip is with the negative sign." },
                    { t: "Nothing — it's right", fb: "Check the first bracket: the first point's $x$ is $" + A[0] + "$, and subtracting a negative adds." }],
            hints: ["Look at the first bracket. What is $x_1$?", "$" + B[0] + " - (" + A[0] + ")$ is not $" + badDx + "$."],
            why: "$" + B[0] + " - (" + A[0] + ") = " + B[0] + " + " + (-A[0]) + " = " + (B[0] - A[0]) + "$. The distance is $\\sqrt{" + sq(B[0] - A[0]) + " + " + sq(B[1] - A[1]) + "} = " + root(sq(B[0] - A[0]) + sq(B[1] - A[1])) + "$." });
        }
        pickPts(form === "exact" ? null : false);
        var s = dx * dx + dy * dy, exact = root(s);
        if (form === "exact") {
          var wrongs = [{ t: "$" + (Math.abs(dx) + Math.abs(dy)) + "$", fb: "That walks across and then up. The straight distance is $\\sqrt{" + Math.abs(dx) + "^2 + " + Math.abs(dy) + "^2}$." },
                        { t: "$\\sqrt{" + (Math.abs(dx) + Math.abs(dy)) + "}$", fb: "Square each leg **before** adding: $" + dx * dx + " + " + dy * dy + "$." },
                        { t: "$" + root(Math.abs(dx * dx - dy * dy) || 2) + "$", fb: "The squares are **added**, not subtracted." }];
          return mc(R, { prompt: "Find the exact distance between $" + n[0] + pt(A) + "$ and $" + n[1] + pt(B) + "$.", right: "$" + exact + "$", wrong: wrongs,
            hints: ["$x_2 - x_1 = " + dx + "$ and $y_2 - y_1 = " + dy + "$.", "$d = \\sqrt{(" + dx + ")^2 + (" + dy + ")^2} = \\sqrt{" + s + "}$." + (exact.indexOf("\\sqrt") > 0 ? " Now simplify the root." : "")],
            why: "$d = \\sqrt{(" + dx + ")^2 + (" + dy + ")^2} = \\sqrt{" + s + "}" + (exact !== "\\sqrt{" + s + "}" ? " = " + exact : "") + "$." });
        }
        return { type: "num", prompt: "Find the distance between $" + n[0] + pt(A) + "$ and $" + n[1] + pt(B) + "$. Round to the nearest tenth.",
          answer: r1(Math.sqrt(s)), tol: 0.051, label: n[0] + n[1],
          near: [{ v: Math.abs(dx) + Math.abs(dy), fb: "That's across plus up. Square them, add, then take the square root." }, { v: s, fb: "That's $d^2$. Take its square root." }],
          hints: ["$x_2 - x_1 = " + minus(B[0], A[0]) + " = " + dx + "$ and $y_2 - y_1 = " + minus(B[1], A[1]) + " = " + dy + "$.", "$d = \\sqrt{(" + dx + ")^2 + (" + dy + ")^2} = \\sqrt{" + s + "}$."],
          why: "$d = \\sqrt{(" + dx + ")^2 + (" + dy + ")^2} = \\sqrt{" + s + "} \\approx " + num(r1(Math.sqrt(s))) + "$." };
      } },
    { id: "geo1-mid", title: "Midpoints", lesson: 6,
      gen: function (R) {
        var form = R.pick(["plane", "plane", "plane", "line", "line"]);
        var n = letters(R, 3);
        if (form === "line") {
          var a = R.int(-20, 8), b = a + 2 * R.int(3, 14);
          if (R.chance(0.3)) b = a + R.int(5, 25);
          var m = (a + b) / 2;
          return { type: "num", prompt: "On a number line, $" + n[0] + "$ is at $" + a + "$ and $" + n[1] + "$ is at $" + b + "$. What is the coordinate of the midpoint of $\\overline{" + n[0] + n[1] + "}$?",
            answer: m, label: "Midpoint",
            near: [{ v: a + b, fb: "Add the coordinates, then **halve** the sum." }, { v: (b - a) / 2, fb: "That's half the **length** of the segment. The midpoint is the average of the two ends: $\\frac{a + b}{2}$." }].filter(function (z) { return z.v !== m; }),
            hints: ["The midpoint is the average of the ends: $\\frac{a + b}{2}$."],
            why: "$\\frac{" + a + " + " + (b < 0 ? "(" + b + ")" : b) + "}{2} = \\frac{" + (a + b) + "}{2} = " + num(m) + "$." };
        }
        var A = [R.int(-8, 6), R.int(-7, 7)], B, tries = 0;
        do { B = [R.int(-8, 8), R.int(-7, 8)]; tries++; } while ((B[0] === A[0] && B[1] === A[1]) || (R.chance(0.7) && ((A[0] + B[0]) % 2 || (A[1] + B[1]) % 2)) && tries < 60);
        var M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        return { type: "pair", prompt: "Find the midpoint of $\\overline{" + n[0] + n[1] + "}$ for $" + n[0] + pt(A) + "$ and $" + n[1] + pt(B) + "$.",
          answer: M,
          near: [{ v: [A[0] + B[0], A[1] + B[1]], fb: "You added the coordinates — now halve each sum." }, { v: [(B[0] - A[0]) / 2, (B[1] - A[1]) / 2], fb: "That's half of how far it goes. The midpoint **averages** the ends: add, then halve." }],
          hints: ["Average the $x$'s, and average the $y$'s.", "$x = \\frac{" + A[0] + " + " + (B[0] < 0 ? "(" + B[0] + ")" : B[0]) + "}{2}$, $y = \\frac{" + A[1] + " + " + (B[1] < 0 ? "(" + B[1] + ")" : B[1]) + "}{2}$."],
          why: "$\\left(\\frac{" + (A[0] + B[0]) + "}{2}, \\frac{" + (A[1] + B[1]) + "}{2}\\right) = " + pt(M) + "$." };
      } },
    { id: "geo1-endpt", title: "Finding an endpoint", lesson: 6,
      gen: function (R) {
        var n = letters(R, 3), A, M, B, tries = 0;
        do { A = [R.int(-7, 6), R.int(-7, 6)]; M = [R.int(-5, 5), R.int(-5, 5)]; B = [2 * M[0] - A[0], 2 * M[1] - A[1]]; tries++; }
        while ((Math.abs(B[0]) > 12 || Math.abs(B[1]) > 12 || (A[0] === M[0] && A[1] === M[1])) && tries < 80);
        if (R.chance(0.3)) {
          var a = R.int(-12, 10), m = a + R.int(2, 9), b = 2 * m - a;
          return { type: "num", prompt: "On a number line, $" + n[1] + "$ is the midpoint of $\\overline{" + n[0] + n[2] + "}$. $" + n[0] + "$ is at $" + a + "$ and $" + n[1] + "$ is at $" + m + "$. Where is $" + n[2] + "$?",
            answer: b, label: n[2],
            near: [{ v: (a + m) / 2, fb: "That's the midpoint of $\\overline{" + n[0] + n[1] + "}$. $" + n[2] + "$ is as far past the midpoint as $" + n[0] + "$ is before it." }],
            hints: ["From $" + n[0] + "$ to the midpoint is $" + (m - a) + "$. Go the same distance again."],
            why: "$" + m + " + " + (m - a) + " = " + b + "$." };
        }
        return { type: "pair", prompt: "$" + n[1] + pt(M) + "$ is the midpoint of $\\overline{" + n[0] + n[2] + "}$, and $" + n[0] + pt(A) + "$. Find $" + n[2] + "$.",
          art: grid(win([A, M], 0), win([A, M], 1),
            [{ steps: [A, M] }, { pt: A, name: n[0] }, { pt: M, name: n[1], c: "orange" }], { u: 28, alt: "Point " + n[0] + " and the midpoint " + n[1] + ", with the move from one to the other." }),
          answer: B,
          near: [{ v: [(A[0] + M[0]) / 2, (A[1] + M[1]) / 2], fb: "That's halfway to the midpoint. $" + n[2] + "$ is as far **beyond** $" + n[1] + "$ as $" + n[0] + "$ is before it." },
                 { v: [M[0] - A[0], M[1] - A[1]], fb: "That's the move from $" + n[0] + "$ to $" + n[1] + "$. Do the same move again, starting at $" + n[1] + "$." }],
          hints: ["From $" + n[0] + "$ to $" + n[1] + "$ is " + move(M[0] - A[0], M[1] - A[1]) + ".",
                  "Make the same move again from $" + n[1] + "$. (Or: each coordinate of $" + n[2] + "$ is twice the midpoint's minus $" + n[0] + "$'s.)"],
          why: "$" + n[2] + " = (2 \\cdot " + (M[0] < 0 ? "(" + M[0] + ")" : M[0]) + " - " + (A[0] < 0 ? "(" + A[0] + ")" : A[0]) + ", 2 \\cdot " + (M[1] < 0 ? "(" + M[1] + ")" : M[1]) + " - " + (A[1] < 0 ? "(" + A[1] + ")" : A[1]) + ") = " + pt(B) + "$." };
      } },
    { id: "geo1-midalg", title: "Midpoints and bisectors with algebra", lesson: 6,
      gen: function (R) {
        var form = R.pick(["eq", "eq", "whole", "quarter", "bisector"]);
        var n = letters(R, 3), A = n[0], B = n[1], C = n[2];
        function ex(k, c) { return (k === 1 ? "" : k) + "x" + (c ? " " + signed(c) : ""); }
        if (form === "eq" || form === "whole") {
          var x, p, q, r, t, tries = 0;
          do { x = R.int(2, 12); p = R.int(2, 7); r = R.int(1, 6); q = R.int(-12, 12); t = (p - r) * x + q; tries++; }
          while ((p === r || p * x + q <= 0 || Math.abs(t) > 30) && tries < 80);
          var len = p * x + q, ask = form === "whole" ? "whole" : R.pick(["x", "part"]);
          var ans = ask === "x" ? x : ask === "part" ? len : 2 * len, lab = ask === "x" ? "x" : ask === "part" ? B + C : A + C;
          return { type: "num", prompt: "$" + B + "$ is the midpoint of $\\overline{" + A + C + "}$, with $" + A + B + " = " + ex(p, q) + "$ and $" + B + C + " = " + ex(r, t) + "$. Find $" + lab + "$.",
            art: segRow([[A, 0], [B, 2.6], [C, 5.2]], { over: [[0, 1, ex(p, q)], [1, 2, ex(r, t)]], ticks: [[0, 1, 1], [1, 2, 1]] }),
            answer: ans, label: lab,
            near: [{ v: x, fb: "That's $x$. Put it back into the expression for the length." }, { v: len, fb: "That's one half. $" + A + C + "$ is both halves together." }, { v: 2 * len, fb: "That's the whole segment. The question asks for one half." }].filter(function (z) { return z.v !== ans; }),
            hints: ["A midpoint cuts a segment into two equal halves: $" + A + B + " = " + B + C + "$.", "$" + ex(p, q) + " = " + ex(r, t) + "$. Solve for $x$.",
                    ask === "x" ? "Get the $x$ terms on one side." : "Then put $x = " + x + "$ back in" + (ask === "whole" ? " — and remember the whole is two halves." : ".")],
            why: "$" + ex(p, q) + " = " + ex(r, t) + "$ gives $x = " + x + "$" + (ask === "x" ? "." : ", so each half is $" + len + "$" + (ask === "whole" ? " and $" + A + C + " = " + 2 * len + "$." : ".")) };
        }
        if (form === "quarter") {
          var W = [R.int(-6, 0) * 2, R.int(-6, 0) * 2], d = [4 * R.int(1, 3) * R.sign(), 4 * R.int(1, 3) * R.sign()], Z = [W[0] + d[0], W[1] + d[1]], X = [W[0] + d[0] / 4, W[1] + d[1] / 4];
          return { type: "pair", kicker: "One step harder", prompt: "$" + A + "$ is at " + pt(W) + " and $" + C + "$ is at " + pt(Z) + ". Point $" + B + "$ is on $\\overline{" + A + C + "}$ with $" + A + B + " = \\frac{1}{4}" + A + C + "$. Find $" + B + "$.",
            answer: X,
            near: [{ v: [(W[0] + Z[0]) / 2, (W[1] + Z[1]) / 2], fb: "That's the midpoint — halfway. $" + B + "$ is only a quarter of the way." }],
            hints: ["The whole trip from $" + A + "$ to $" + C + "$ is " + d[0] + " across and " + d[1] + " up.", "A quarter of the trip is " + d[0] / 4 + " across and " + d[1] / 4 + " up. Start at $" + A + "$."],
            why: "A quarter of $(" + d[0] + ", " + d[1] + ")$ is $(" + d[0] / 4 + ", " + d[1] / 4 + ")$; from " + pt(W) + " that lands at " + pt(X) + "." };
        }
        return mc(R, { prompt: "Line ℓ passes through the midpoint $" + B + "$ of $\\overline{" + A + C + "}$. Which is true?",
          art: plain([0, 6.4], [-0.6, 3.6], [{ seg: [[0.5, 1], [5.9, 1]], c: "blue" }, { seg: [[0.5, 1], [3.2, 1]], marks: 1, c: "blue" }, { seg: [[3.2, 1], [5.9, 1]], marks: 1, c: "blue" },
            { dline: [[2.2, -0.4], [4.2, 3.3]] }, { pt: [0.5, 1], name: A, at: "s" }, { pt: [3.2, 1], name: B, at: "se" }, { pt: [5.9, 1], name: C, at: "s" }, { word: "ℓ", at: [4.35, 3.0], name: true }],
            { u: 40, alt: "A segment with its midpoint marked; a slanted line passes through the midpoint." }),
          right: "ℓ bisects $\\overline{" + A + C + "}$",
          wrong: [{ t: "ℓ is perpendicular to $\\overline{" + A + C + "}$", fb: "Nothing says the angle is $90^\\circ$ — there's no right-angle mark. A bisector only has to pass through the midpoint." },
                  { t: "$" + A + B + " = 2 \\cdot " + B + C + "$", fb: "A midpoint makes the two halves **equal**: $" + A + B + " = " + B + C + "$." }],
          hints: ["Any segment, ray, line or plane through a segment's midpoint **bisects** it."],
          why: "ℓ passes through the midpoint, so it's a segment bisector of $\\overline{" + A + C + "}$ — at any angle." });
      } },
    { id: "geo1-angname", title: "Naming angles", lesson: 7,
      gen: function (R) {
        var form = R.pick(["vertex", "sides", "other", "other", "interior", "opposite"]);
        var n = letters(R, 4), W = n[0], X = n[1], Y = n[2], Z = n[3];
        var d0 = R.int(0, 20), d1 = d0 + R.int(40, 60), d2 = d1 + R.int(45, 70);
        var V = [0, 0];
        function fig3() {
          return rayFig(V, [{ d: d0, name: X }, { d: d1, name: Y }, { d: d2, name: Z }], { vname: W, num: [{ i: 0, j: 1, t: "1" }, { i: 1, j: 2, t: "2" }],
            x: [-3.2, 3.6], y: [-1, 3.4], alt: "Three rays from " + W + ", through " + X + ", " + Y + " and " + Z + "; angle 1 is between the first two, angle 2 between the last two." });
        }
        function ang(a, b, c) { return "$\\angle " + a + b + c + "$"; }
        if (form === "vertex") {
          return mc(R, { prompt: "Which point is the vertex of $\\angle 2$?", art: fig3(), right: "$" + W + "$",
            wrong: [{ t: "$" + Y + "$", fb: "$" + Y + "$ is on a side of $\\angle 2$. The vertex is where the sides start." },
                    { t: "$" + Z + "$", fb: "$" + Z + "$ is on a side. The vertex is the corner." },
                    { t: "$" + X + "$", fb: "$" + X + "$ isn't even on $\\angle 2$ — it's on $\\angle 1$." }],
            hints: ["The vertex is the common endpoint of the two rays."], why: "Both sides of $\\angle 2$ start at $" + W + "$." });
        }
        if (form === "sides") {
          return mc(R, { prompt: "Name the sides of " + ang(X, W, Y) + ".", art: fig3(),
            right: "$\\overrightarrow{" + W + X + "}$ and $\\overrightarrow{" + W + Y + "}$",
            wrong: [{ t: "$\\overrightarrow{" + X + W + "}$ and $\\overrightarrow{" + Y + W + "}$", fb: "A ray is named from its **endpoint**, and both sides start at $" + W + "$." },
                    { t: "$\\overline{" + W + X + "}$ and $\\overline{" + W + Y + "}$", fb: "The sides of an angle are **rays** — they go on forever, past the points." },
                    { t: "$\\overrightarrow{" + W + Y + "}$ and $\\overrightarrow{" + W + Z + "}$", fb: "Those are the sides of $\\angle 2$. " + ang(X, W, Y) + " is $\\angle 1$." }],
            hints: ["The sides are the two rays that start at the vertex, the middle letter."], why: "The rays from $" + W + "$ through $" + X + "$ and through $" + Y + "$." });
        }
        if (form === "other") {
          var one = R.chance(0.5);
          return mc(R, { prompt: "Which is another name for $\\angle " + (one ? 1 : 2) + "$?", art: fig3(),
            right: one ? ang(Y, W, X) : ang(Z, W, Y),
            wrong: [{ t: "$\\angle " + W + "$", fb: "Three angles share the vertex $" + W + "$, so one letter doesn't say which one you mean." },
                    { t: one ? ang(W, X, Y) : ang(W, Y, Z), fb: "The vertex must be the **middle** letter." },
                    { t: ang(X, W, Z), fb: "That's the big angle made of $\\angle 1$ and $\\angle 2$ together." }],
            hints: ["Three letters, with the vertex in the middle and a point from each side on the outside."],
            why: (one ? ang(Y, W, X) + " has its vertex $" + W + "$ in the middle and a point on each side of $\\angle 1$." : ang(Z, W, Y) + " has $" + W + "$ in the middle and a point on each side of $\\angle 2$.") });
        }
        if (form === "interior") {
          var a1 = R.int(10, 30), a2 = a1 + R.int(70, 110), mid = (a1 + a2) / 2, p = letters(R, 6, n.join(""));
          var inside = GT.polar(V, 1.9, mid), onSide = GT.polar(V, 2.2, a1), out1 = GT.polar(V, 1.8, a2 + 60), out2 = GT.polar(V, 1.8, a1 - 50);
          var art = rayFig(V, [{ d: a1, name: X }, { d: a2, name: Y }], { vname: W, x: [-3.2, 3.6], y: [-1.6, 3.4],
            pts: [{ pt: inside, name: p[0], at: "n", c: "orange" }, { pt: onSide, name: p[1], at: "s", c: "orange" }, { pt: out1, name: p[2], at: "n", c: "orange" }, { pt: out2, name: p[3], at: "e", c: "orange" }],
            alt: "An angle with four orange points: one inside it, one on a side, two outside." });
          return mc(R, { prompt: "Which point is in the **interior** of " + ang(X, W, Y) + "?", art: art, right: "$" + p[0] + "$",
            wrong: [{ t: "$" + p[1] + "$", fb: "$" + p[1] + "$ is **on** the angle — on one of its sides." },
                    { t: "$" + p[2] + "$", fb: "$" + p[2] + "$ is outside the opening: it's in the exterior." },
                    { t: "$" + p[3] + "$", fb: "$" + p[3] + "$ is outside the opening: it's in the exterior." }],
            hints: ["The interior is the region between the two sides, inside the opening."], why: "$" + p[0] + "$ is between the sides, inside the opening of the angle." });
        }
        var q = letters(R, 4), dd = R.int(-15, 15);
        var art2 = rayFig([0, 0], [{ d: dd, name: q[1], name2: q[2], line: true, r: 3 }, { d: dd + R.int(60, 120), name: q[3], r: 2.6 }], { vname: q[0], vlab: "s", x: [-3.4, 3.4], y: [-1.4, 3], alt: "A line through " + q[0] + " with points on each side, and another ray from " + q[0] + "." });
        return mc(R, { prompt: "Which two rays are **opposite rays**?", art: art2,
          right: "$\\overrightarrow{" + q[0] + q[1] + "}$ and $\\overrightarrow{" + q[0] + q[2] + "}$",
          wrong: [{ t: "$\\overrightarrow{" + q[0] + q[1] + "}$ and $\\overrightarrow{" + q[0] + q[3] + "}$", fb: "Those two share an endpoint but point in different directions that aren't opposite: they make an angle." },
                  { t: "$\\overrightarrow{" + q[1] + q[0] + "}$ and $\\overrightarrow{" + q[2] + q[0] + "}$", fb: "Opposite rays share an endpoint — here $" + q[0] + "$ — so both names must start with it." }],
          hints: ["Opposite rays start at the same point and together make a line."],
          why: "$\\overrightarrow{" + q[0] + q[1] + "}$ and $\\overrightarrow{" + q[0] + q[2] + "}$ start at $" + q[0] + "$ and point opposite ways along one line." });
      } },
    { id: "geo1-protractor", title: "Measuring and classifying angles", lesson: 7,
      gen: function (R) {
        var form = R.pick(["outer", "inner", "inner", "classify", "classfig", "make"]);
        var n = letters(R, 3);
        if (form === "outer" || form === "inner") {
          var t = R.int(2, 34) * 5;
          if (t === 90) t = 115;
          var base = form === "outer" ? 0 : 180, m = form === "outer" ? t : 180 - t;
          return { type: "num", prompt: "Find $m\\angle " + n[0] + n[1] + n[2] + "$.",
            art: GT.protractor({ a: base, b: t, names: n, w: 420, alt: "A protractor on angle " + n.join("") + "; one side lies along the " + (base ? "left" : "right") + " end of the straight edge." }),
            answer: m, post: "°", label: "m∠" + n.join(""),
            near: [{ v: 180 - m, fb: "That's the other scale. Start from the 0 that side $\\overrightarrow{" + n[1] + n[0] + "}$ passes through — on the " + (base ? "left" : "right") + " — and read that scale." }],
            hints: ["One side lies along the " + (base ? "left" : "right") + " end, at 0 on the " + (base ? "inner" : "outer") + " scale. Use that scale.", "Read where the other side crosses the " + (base ? "inner" : "outer") + " numbers."],
            why: "Starting from 0 on the " + (base ? "inner" : "outer") + " scale, the other side crosses at $" + m + "$: $m\\angle " + n.join("") + " = " + m + "°$." + (m > 90 ? " (It's wider than a right angle, so it must be more than 90 — a quick check.)" : " (It's narrower than a right angle, so it must be less than 90.)") };
        }
        var TYPES = ["Acute", "Right", "Obtuse", "Straight"];
        function kind(v) { return v < 90 ? 0 : v === 90 ? 1 : v < 180 ? 2 : 3; }
        var FB = ["Acute means less than $90°$.", "Right means exactly $90°$.", "Obtuse means between $90°$ and $180°$.", "Straight means exactly $180°$: opposite rays."];
        if (form === "classify") {
          var v = R.pick([R.int(3, 88), R.int(3, 88), 90, R.int(92, 178), R.int(92, 178), 89, 91, 180]), k = kind(v);
          return { type: "choice", prompt: "Classify an angle that measures $" + v + "°$.", keep: true,
            options: TYPES.map(function (t, i) { return i === k ? { t: t } : { t: t, fb: FB[i] }; }), answer: k,
            hints: ["Compare it with $90°$ and with $180°$."],
            why: "$" + v + "°$ is " + ["less than $90°$: acute.", "exactly $90°$: right.", "between $90°$ and $180°$: obtuse.", "exactly $180°$: a straight angle."][k] };
        }
        if (form === "classfig") {
          var v2 = R.pick([R.int(25, 75), 90, R.int(105, 160)]), k2 = kind(v2), d = R.int(0, 25);
          var art = rayFig([0, 0], [{ d: d, name: n[0] }, { d: d + v2, name: n[2] }], { vname: n[1], wedges: [{ i: 0, j: 1, right: v2 === 90 }], x: [-3.4, 3.6], y: [-1.2, 3.4], alt: "An angle" + (v2 === 90 ? " marked with a right-angle square." : ".") });
          return { type: "choice", prompt: "Classify $\\angle " + n.join("") + "$.", art: art, keep: true,
            options: TYPES.slice(0, 3).map(function (t, i) { return i === k2 ? { t: t } : { t: t, fb: i === 1 ? "A right angle is marked with a small square." : FB[i] }; }), answer: k2,
            hints: ["Is it narrower than a square corner, exactly square (marked), or wider?"],
            why: v2 === 90 ? "The small square marks a right angle: exactly $90°$." : v2 < 90 ? "It's narrower than a square corner: acute." : "It's wider than a square corner but not a straight line: obtuse." };
        }
        var goal = R.pick([35, 50, 65, 110, 125, 140, 155]);
        return { type: "sketch", prompt: "Drag the orange point to turn side $\\overrightarrow{" + n[1] + n[2] + "}$ until $m\\angle " + n.join("") + " = " + goal + "°$.",
          protractor: true, names: n,
          pts: { B: { at: GT.polar([0, 0], 158, goal > 90 ? 40 : 150), drag: true, c: "orange", say: "The end of side " + n[1] + n[2] } },
          draw: function (s) { return [{ pray: 0 }, { pray: GT.dir([0, 0], s.B) }]; },
          readout: function (s) { return "$m\\angle " + n.join("") + " = " + Math.round(GT.dir([0, 0], s.B)) + "°$"; },
          goal: function (s) { return Math.round(GT.dir([0, 0], s.B)) === goal; },
          fb: function (s) { var v3 = Math.round(GT.dir([0, 0], s.B)); return v3 === 180 - goal ? "That's " + goal + " on the **inner** scale. Side $\\overrightarrow{" + n[1] + n[0] + "}$ lies on 0 of the outer scale, so use the outer numbers." : "Not yet: it's " + v3 + "°. Keep turning."; },
          answer: { B: GT.polar([0, 0], 158, goal) },
          hints: ["Side $\\overrightarrow{" + n[1] + n[0] + "}$ is on the right, at 0 of the **outer** scale.", "Turn until the orange side crosses " + goal + " on the outer scale."],
          why: "Counting from the outer 0 on the right, the side crosses $" + goal + "$." };
      } },
    { id: "geo1-angalg", title: "Congruent angles and bisectors", lesson: 8,
      gen: function (R) {
        var form = R.pick(["cong", "add", "add", "bisect", "bisect", "half"]);
        var n = letters(R, 4), P = n[0], Q = n[1], S = n[2], T = n[3];
        function ex(k, c) { return (k === 1 ? "" : k) + "x" + (c ? " " + signed(c) : ""); }
        function solve() {
          var x, p, q, r, t, tries = 0;
          do { x = R.int(3, 16); p = R.int(2, 9); r = R.int(1, 8); q = R.int(-15, 20); t = (p - r) * x + q; tries++; }
          while ((p === r || p * x + q < 12 || p * x + q > 85 || Math.abs(t) > 40) && tries < 100);
          return { x: x, p: p, q: q, r: r, t: t, m: p * x + q };
        }
        if (form === "cong") {
          var z = solve(), ask = R.pick(["x", "m"]), k = letters(R, 6), A1 = k[0] + k[1] + k[2], A2 = k[3] + k[4] + k[5];
          return { type: "num", prompt: "$\\angle " + A1 + " \\cong \\angle " + A2 + "$, with $m\\angle " + A1 + " = (" + ex(z.p, z.q) + ")°$ and $m\\angle " + A2 + " = (" + ex(z.r, z.t) + ")°$. Find " + (ask === "x" ? "$x$" : "$m\\angle " + A1 + "$") + ".",
            answer: ask === "x" ? z.x : z.m, post: ask === "x" ? "" : "°", label: ask === "x" ? "x" : "m∠" + A1,
            near: [{ v: ask === "x" ? z.m : z.x, fb: ask === "x" ? "That's the angle's measure. The question asks for $x$." : "That's $x$. Put it back in to get the measure." }].filter(function (w) { return w.v !== (ask === "x" ? z.x : z.m); }),
            hints: ["Congruent angles have equal measures: $" + ex(z.p, z.q) + " = " + ex(z.r, z.t) + "$.", "Solve for $x$" + (ask === "x" ? "." : ", then put it back into $" + ex(z.p, z.q) + "$.")],
            why: "$" + ex(z.p, z.q) + " = " + ex(z.r, z.t) + "$ gives $x = " + z.x + "$" + (ask === "x" ? "." : ", so $m\\angle " + A1 + " = " + z.m + "°$ — and the other angle is too.") };
        }
        if (form === "add") {
          var a = R.int(15, 70), b = R.int(15, 70), whole = R.chance(0.5), d0 = R.int(0, 20);
          var art = rayFig([0, 0], [{ d: d0, name: P }, { d: d0 + a, name: Q }, { d: d0 + a + b, name: S }], { vname: T,
            wedges: [{ i: 0, j: 1, say: whole ? a + "°" : "?", r: 24 }, { i: 1, j: 2, say: b + "°", r: 30, c: "blue" }], x: [-3.4, 3.6], y: [-1.2, 3.4], alt: "Three rays from " + T + ": two angles side by side." });
          if (whole) return { type: "num", prompt: "$" + Q + "$ is in the interior of $\\angle " + P + T + S + "$. Find $m\\angle " + P + T + S + "$.", art: art,
            answer: a + b, post: "°", label: "m∠" + P + T + S,
            near: [{ v: Math.abs(a - b), fb: "The two smaller angles **add** up to the whole." }].filter(function (w) { return w.v !== a + b; }),
            hints: ["Angle addition: $m\\angle " + P + T + Q + " + m\\angle " + Q + T + S + " = m\\angle " + P + T + S + "$."],
            why: "$" + a + "° + " + b + "° = " + (a + b) + "°$." };
          return { type: "num", prompt: "$m\\angle " + P + T + S + " = " + (a + b) + "°$ and $" + Q + "$ is in its interior. Find $m\\angle " + P + T + Q + "$.", art: art,
            answer: a, post: "°", label: "m∠" + P + T + Q,
            near: [{ v: a + 2 * b, fb: "The part is the whole **minus** the other part." }],
            hints: ["$m\\angle " + P + T + Q + " = m\\angle " + P + T + S + " - m\\angle " + Q + T + S + "$."],
            why: "$" + (a + b) + "° - " + b + "° = " + a + "°$." };
        }
        if (form === "bisect") {
          var y = solve(), ask2 = R.pick(["x", "m", "whole"]);
          var ans = ask2 === "x" ? y.x : ask2 === "m" ? y.m : 2 * y.m;
          return { type: "num", prompt: "$\\overrightarrow{" + T + Q + "}$ bisects $\\angle " + P + T + S + "$. $m\\angle " + P + T + Q + " = (" + ex(y.p, y.q) + ")°$ and $m\\angle " + Q + T + S + " = (" + ex(y.r, y.t) + ")°$. Find " +
              (ask2 === "x" ? "$x$" : ask2 === "m" ? "$m\\angle " + P + T + Q + "$" : "$m\\angle " + P + T + S + "$") + ".",
            art: rayFig([0, 0], [{ d: 10, name: P }, { d: 60, name: Q }, { d: 110, name: S }], { vname: T, marks: [{ i: 0, j: 1, n: 1, r: 26 }, { i: 1, j: 2, n: 1, r: 26 }], x: [-3.2, 3.6], y: [-1, 3.4], alt: "A ray bisecting an angle; the two halves are marked equal." }),
            answer: ans, post: ask2 === "x" ? "" : "°", label: ask2 === "x" ? "x" : ask2 === "m" ? "m∠" + P + T + Q : "m∠" + P + T + S,
            near: [{ v: y.x, fb: "That's $x$. Put it back in." }, { v: y.m, fb: "That's one half. The whole angle is both halves." }, { v: 2 * y.m, fb: "That's the whole angle; the question asks for one half." }].filter(function (w) { return w.v !== ans; }),
            hints: ["A bisector makes two congruent angles: $" + ex(y.p, y.q) + " = " + ex(y.r, y.t) + "$.", "Solve for $x$" + (ask2 === "x" ? "." : ", then put it back in" + (ask2 === "whole" ? " and double it." : "."))],
            why: "$" + ex(y.p, y.q) + " = " + ex(y.r, y.t) + "$ gives $x = " + y.x + "$; each half is $" + y.m + "°$" + (ask2 === "whole" ? ", so the whole angle is $" + 2 * y.m + "°$." : ".") };
        }
        var xh, ph, qh, wk, wc, tries = 0;
        do { xh = R.int(3, 14); ph = R.int(2, 6); qh = R.int(-6, 12); wk = R.int(1, 2 * ph - 1); wc = 2 * (ph * xh + qh) - wk * xh; tries++; }
        while ((ph * xh + qh < 10 || ph * xh + qh > 85 || wk === 2 * ph || Math.abs(wc) > 60) && tries < 100);
        var halfm = ph * xh + qh;
        return { type: "num", kicker: "One step harder", prompt: "$\\overrightarrow{" + T + Q + "}$ bisects $\\angle " + P + T + S + "$, with $m\\angle " + P + T + Q + " = (" + ex(ph, qh) + ")°$ and $m\\angle " + P + T + S + " = (" + ex(wk, wc) + ")°$. Find $m\\angle " + P + T + S + "$.",
          answer: 2 * halfm, post: "°", label: "m∠" + P + T + S,
          near: [{ v: halfm, fb: "That's one half. The whole angle is twice as big." }, { v: xh, fb: "That's $x$. Put it back into the expression for the whole angle." }].filter(function (w) { return w.v !== 2 * halfm; }),
          hints: ["The whole angle is **twice** each half: $2(" + ex(ph, qh) + ") = " + ex(wk, wc) + "$.", "$" + ex(2 * ph, 2 * qh) + " = " + ex(wk, wc) + "$. Solve for $x$."],
          why: "$2(" + ex(ph, qh) + ") = " + ex(wk, wc) + "$ gives $x = " + xh + "$, so $m\\angle " + P + T + S + " = " + 2 * halfm + "°$." };
      } },
    { id: "geo1-construct", title: "Constructions", lesson: 10,
      gen: function (R) {
        var form = R.pick(["which", "which", "order", "order", "why"]);
        var C = [
          { k: "copyseg", name: "Copying a segment", fig: consCopySeg(3, { u: 34 }),
            steps: ["Draw a line and mark a point P on it", "Put the compass point on X and open it to Y", "Keeping that opening, put the compass point on P", "Swing an arc across the line and call the crossing Q"] },
          { k: "bisectseg", name: "Bisecting a segment", fig: consBisectSeg(3, { u: 34 }),
            steps: ["Open the compass to more than half of XY", "From X, draw arcs above and below the segment", "With the same opening, draw arcs from Y that cross them at P and Q", "Draw line PQ: it crosses XY at the midpoint"] },
          { k: "bisectang", name: "Bisecting an angle", fig: consBisectAngle(4, { u: 34 }),
            steps: ["From the vertex A, draw an arc that crosses both sides, at B and C", "From B, draw an arc inside the angle", "With the same opening, draw an arc from C that crosses it at D", "Draw ray AD: it bisects angle A"] },
          { k: "copyang", name: "Copying an angle", fig: consCopyAngle(6, { u: 34 }),
            steps: ["Draw a ray from a new point T", "From P, draw an arc crossing both sides of angle P, at R and Q", "With the same opening, draw an arc from T crossing its ray at S", "Open the compass from R to Q", "With that opening, draw an arc from S crossing the first arc at U", "Draw ray TU"] },
          { k: "perpon", name: "A perpendicular through a point on a line", fig: consPerpOn(4, { u: 38 }),
            steps: ["From C, draw arcs that cross the line on both sides, at A and B", "Open the compass wider, and draw an arc above the line from A", "With the same opening, draw an arc from B that crosses it at D", "Draw line CD"] },
          { k: "perpoff", name: "A perpendicular through a point not on a line", fig: consPerpOff(4, { u: 38 }),
            steps: ["From Z, draw an arc that crosses the line twice, at X and Y", "Open the compass to more than half of XY, and draw an arc below the line from X", "With the same opening, draw an arc from Y that crosses it at A", "Draw line ZA"] }];
        var c = R.pick(C);
        if (form === "which") {
          var others = R.shuffle(C.filter(function (x) { return x !== c; })).slice(0, 3);
          return mc(R, { prompt: "Which construction does this figure show? (Thin arcs are compass marks; the orange line or ray is the result.)", art: c.fig,
            right: c.name, wrong: others.map(function (o) { return { t: o.name, fb: "Look at what the finished orange part does. " + { copyseg: "A copied segment lies along another line.", bisectseg: "A segment bisector crosses a segment at its middle.", bisectang: "An angle bisector splits an angle down the middle.", copyang: "A copied angle is a second angle, built on a new ray.", perpon: "That one starts from a point on the line.", perpoff: "That one starts from a point off the line." }[o.k] }; }),
            hints: ["Find the result — the orange line or ray. What does it do to the figure it's drawn on?"],
            why: "It's " + c.name.toLowerCase() + ": " + { copyseg: "the compass carried the length of $\\overline{XY}$ along the line from $P$ to $Q$.", bisectseg: "arcs of one opening from both ends meet at $P$ and $Q$, and $\\overleftrightarrow{PQ}$ passes through the midpoint.", bisectang: "arcs from $B$ and $C$ meet at $D$ inside the angle, and $\\overrightarrow{AD}$ splits it in two.", copyang: "the same arcs at $P$ and at $T$, and the same chord $RQ = SU$, build a matching angle.", perpon: "$D$ is the same distance from $A$ and $B$, so $\\overleftrightarrow{CD}$ meets the line at a right angle at $C$.", perpoff: "$Z$ and $A$ are each the same distance from $X$ and $Y$, so $\\overleftrightarrow{ZA}$ is perpendicular to the line." }[c.k] });
        }
        if (form === "order") {
          return { type: "order", prompt: "Put the steps for **" + c.name.toLowerCase() + "** in order.", art: c.fig, items: c.steps,
            nudge: "What has to exist before each step can happen? The last step is always drawing the result.",
            why: c.steps.map(function (t, i) { return (i + 1) + ") " + t; }).join(" &nbsp;") };
        }
        var Y = R.pick([
          { q: "When you copy a segment, what does the compass do?", r: "It holds the segment's length, so the arc from $P$ marks off the same length", w: [{ t: "It measures the segment in centimetres", fb: "A construction never reads numbers. The compass just keeps its opening." }, { t: "It makes the new segment longer", fb: "The opening isn't changed between the two arcs, so the length stays the same." }] },
          { q: "To bisect a segment, why must the compass be opened to **more than half** of it?", r: "Otherwise the arcs from the two ends never reach each other, so they can't cross", w: [{ t: "So the arcs are easier to see", fb: "It's not about neatness: with less than half, the two sets of arcs never meet." }, { t: "Any opening works", fb: "Try less than half: the arcs from the two ends stop short of each other." }] },
          { q: "When you bisect an angle, why must the arcs from $B$ and $C$ use the **same** opening?", r: "So $D$ is the same distance from $B$ as from $C$ — which puts it on the line down the middle", w: [{ t: "To save time", fb: "Change the opening and $D$ slides off the middle: the two halves wouldn't match." }, { t: "It doesn't matter", fb: "With different openings, $D$ lands off-centre and the two angles aren't congruent." }] }]);
        return mc(R, { prompt: Y.q, right: Y.r, wrong: Y.w, hints: ["A compass keeps a distance. What distance must be the same?"], why: Y.r + "." });
      } },
    { id: "geo1-pairs", title: "Angle pairs", lesson: 9,
      gen: function (R) {
        var form = R.pick(["cross", "cross", "fan", "fan", "true"]);
        var KIND = ["Vertical angles", "A linear pair", "Adjacent, but not a linear pair", "Not adjacent, and not vertical"];
        if (form === "cross") {
          var a = R.int(35, 75), pairs = [[1, 3, 0], [2, 4, 0], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 1, 1]], p = R.pick(pairs);
          var FB = ["Vertical angles sit opposite each other across the crossing point, sharing only the vertex.", "A linear pair sits side by side, and together they make a straight line."];
          return { type: "choice", prompt: "What are $\\angle " + p[0] + "$ and $\\angle " + p[1] + "$?", art: xFig(a, { rot: R.int(-10, 10) }), keep: true,
            options: KIND.slice(0, 2).map(function (t, i) { return i === p[2] ? { t: t } : { t: t, fb: FB[i] + (p[2] === 0 ? " These two don't share a side." : " These two share a side.") }; }),
            answer: p[2],
            hints: ["Do the two angles share a side? If yes, they're next to each other; if not, they're opposite."],
            why: p[2] === 0 ? "They're opposite each other across the crossing, sharing only the vertex: vertical angles." : "They share a side, and their other sides are opposite rays along one line: a linear pair." };
        }
        if (form === "fan") {
          var n = letters(R, 5), V = n[0], d1 = R.int(35, 70), d2 = d1 + R.int(35, 60);
          // A line through V (A on the right, C on the left) and two rays above it, through B and D.
          var art = rayFig([0, 0], [{ d: 0, name: n[1] }, { d: d1, name: n[2] }, { d: d2, name: n[3] }, { d: 180, name: n[4] }], { vname: V, vlab: "s", x: [-3.4, 3.4], y: [-1, 3.4],
            alt: "A line through " + V + " with two more rays from " + V + " above it." });
          function ang(i, j) { return "$\\angle " + n[i] + V + n[j] + "$"; }
          var Q = R.pick([
            { a: ang(1, 2), b: ang(2, 4), k: 1, why: "They share side $\\overrightarrow{" + V + n[2] + "}$, and their other sides point opposite ways along the line: a linear pair." },
            { a: ang(1, 3), b: ang(3, 4), k: 1, why: "They share side $\\overrightarrow{" + V + n[3] + "}$, and their other sides are opposite rays: a linear pair." },
            { a: ang(1, 2), b: ang(2, 3), k: 2, why: "They share a vertex and a side and don't overlap — adjacent — but $\\overrightarrow{" + V + n[1] + "}$ and $\\overrightarrow{" + V + n[3] + "}$ aren't opposite rays, so not a linear pair." },
            { a: ang(2, 3), b: ang(3, 4), k: 2, why: "They're adjacent, sharing $\\overrightarrow{" + V + n[3] + "}$ — but $\\overrightarrow{" + V + n[2] + "}$ and $\\overrightarrow{" + V + n[4] + "}$ aren't opposite rays." },
            { a: ang(1, 2), b: ang(3, 4), k: 3, why: "They share the vertex but no side, and they aren't made by two crossing lines: neither adjacent nor vertical." }]);
          return { type: "choice", prompt: "What are " + Q.a + " and " + Q.b + "?", art: art, keep: true,
            options: KIND.map(function (t, i) { return i === Q.k ? { t: t } : { t: t, fb: ["Vertical angles come from two crossing lines, opposite each other. Only one line crosses here.",
              "A linear pair must share a side **and** have its other two sides along one straight line.", "Adjacent angles share a vertex **and a side**.", "Look again: they do share a side."][i] }; }),
            answer: Q.k,
            hints: ["First: do they share a side? Then: do their other two sides make one straight line?"], why: Q.why };
        }
        var T = R.pick([
          { s: "Vertical angles are always congruent.", ok: true, why: "Each one makes a linear pair with the same angle between them, so they must be equal." },
          { s: "Vertical angles are always adjacent.", ok: false, why: "Vertical angles share only a vertex — never a side — so they're never adjacent." },
          { s: "The two angles of a linear pair are always congruent.", ok: false, why: "They add up to $180°$; they're only equal when both are $90°$." },
          { s: "The two angles of a linear pair always add up to $180°$.", ok: true, why: "Their outer sides make a straight line: a straight angle, $180°$." },
          { s: "Any two angles that share a vertex are adjacent.", ok: false, why: "Adjacent angles also need a common side, and no overlap." }]);
        return { type: "choice", prompt: "True or false: " + T.s, keep: true,
          options: [{ t: "True", fb: T.ok ? null : "Picture two crossing lines, or a line with a ray on it, and test it." }, { t: "False", fb: T.ok ? "It's always true — picture two crossing lines." : null }],
          answer: T.ok ? 0 : 1, hints: ["Draw two crossing lines and check the statement against them."], why: T.why };
      } },
    { id: "geo1-vertlin", title: "Vertical angles and linear pairs", lesson: 9,
      gen: function (R) {
        var form = R.pick(["find", "find", "vert", "lin", "ratio"]);
        function ex(k, c) { return (k === 1 ? "" : k) + "x" + (c ? " " + signed(c) : ""); }
        if (form === "find") {
          var a = R.int(22, 78), given = R.int(1, 4), ask, meas = [a, 180 - a, a, 180 - a];
          do { ask = R.int(1, 4); } while (ask === given);
          var gm = meas[given - 1], am = meas[ask - 1], vert = Math.abs(ask - given) === 2;
          return { type: "num", prompt: "$m\\angle " + given + " = " + gm + "°$. Find $m\\angle " + ask + "$.", art: xFig(a),
            answer: am, post: "°", label: "m∠" + ask,
            near: [{ v: vert ? 180 - gm : gm, fb: vert ? "$\\angle " + given + "$ and $\\angle " + ask + "$ are **vertical** angles, so they're equal." : "$\\angle " + given + "$ and $\\angle " + ask + "$ form a **linear pair**: they add up to $180°$." }].filter(function (z) { return z.v !== am; }),
            hints: ["Are $\\angle " + given + "$ and $\\angle " + ask + "$ opposite each other, or side by side?"],
            why: vert ? "They're vertical angles, so they're congruent: $" + am + "°$." : "They form a linear pair: $180° - " + gm + "° = " + am + "°$." };
        }
        if (form === "vert") {
          var x, p, q, r, t, tries = 0;
          do { x = R.int(4, 20); p = R.int(2, 8); r = R.int(1, 7); q = R.int(-20, 20); t = (p - r) * x + q; tries++; } while ((p === r || p * x + q < 15 || p * x + q > 160 || p * x + q === 90 || Math.abs(t) > 60) && tries < 100);
          var m1 = p * x + q, ask2 = R.pick(["x", "m", "other"]);
          var ans = ask2 === "x" ? x : ask2 === "m" ? m1 : 180 - m1;
          return { type: "num", prompt: "In the figure, $m\\angle 1 = (" + ex(p, q) + ")°$ and $m\\angle 3 = (" + ex(r, t) + ")°$. Find " + (ask2 === "x" ? "$x$" : ask2 === "m" ? "$m\\angle 1$" : "$m\\angle 2$") + ".",
            art: xFig(m1 > 150 || m1 < 20 ? 60 : m1), answer: ans, post: ask2 === "x" ? "" : "°", label: ask2 === "x" ? "x" : ask2 === "m" ? "m∠1" : "m∠2",
            near: [{ v: x, fb: "That's $x$. Put it back in." }, { v: m1, fb: ask2 === "other" ? "That's $m\\angle 1$. $\\angle 2$ makes a linear pair with it." : "That's $m\\angle 1$." }, { v: 180 - m1, fb: "That's $\\angle 2$, the angle next to $\\angle 1$." }].filter(function (z) { return z.v !== ans; }),
            hints: ["$\\angle 1$ and $\\angle 3$ are vertical angles, so they're equal: $" + ex(p, q) + " = " + ex(r, t) + "$.", "Solve for $x$" + (ask2 === "x" ? "." : ask2 === "m" ? ", then put it back in." : ", find $m\\angle 1$, then use the linear pair: $m\\angle 2 = 180° - m\\angle 1$.")],
            why: "$" + ex(p, q) + " = " + ex(r, t) + "$ gives $x = " + x + "$, so $m\\angle 1 = " + m1 + "°$" + (ask2 === "other" ? " and $m\\angle 2 = 180° - " + m1 + "° = " + (180 - m1) + "°$." : ".") };
        }
        if (form === "lin") {
          var y, a1, b1, a2, b2, tries2 = 0;
          do { y = R.int(5, 30); a1 = R.int(1, 6); a2 = R.int(1, 6); b1 = R.int(-20, 30); b2 = 180 - (a1 + a2) * y - b1; tries2++; } while ((a1 * y + b1 < 20 || a2 * y + b2 < 20 || Math.abs(b2) > 60 || a1 * y + b1 === 90) && tries2 < 150);
          var ma = a1 * y + b1, mb = a2 * y + b2, big = R.chance(0.5);
          return { type: "num", prompt: "$\\angle 1$ and $\\angle 2$ form a linear pair, with $m\\angle 1 = (" + ex(a1, b1) + ")°$ and $m\\angle 2 = (" + ex(a2, b2) + ")°$. Find $m\\angle " + (big ? 1 : 2) + "$.",
            art: xFig(ma > 20 && ma < 160 ? ma : 70, { nums: true }), answer: big ? ma : mb, post: "°", label: "m∠" + (big ? 1 : 2),
            near: [{ v: y, fb: "That's $x$. Put it back in." }, { v: big ? mb : ma, fb: "That's the other angle." }].filter(function (z) { return z.v !== (big ? ma : mb); }),
            hints: ["A linear pair adds up to $180°$: $(" + ex(a1, b1) + ") + (" + ex(a2, b2) + ") = 180$.", "$" + ex(a1 + a2, b1 + b2) + " = 180$, so $x = " + y + "$."],
            why: "$" + ex(a1 + a2, b1 + b2) + " = 180$ gives $x = " + y + "$: $m\\angle 1 = " + ma + "°$ and $m\\angle 2 = " + mb + "°$ (together $180°$)." };
        }
        var ra = R.int(1, 5), rb, tries3 = 0;
        do { rb = R.int(ra + 1, 11); tries3++; } while (180 % (ra + rb) && tries3 < 50);
        if (180 % (ra + rb)) { ra = 1; rb = 2; }
        var unit = 180 / (ra + rb);
        return { type: "num", kicker: "One step harder", prompt: "The two angles of a linear pair are in the ratio $" + ra + " : " + rb + "$. Find the larger angle.",
          answer: rb * unit, post: "°", label: "Larger angle",
          near: [{ v: ra * unit, fb: "That's the smaller one." }, { v: unit, fb: "That's one part. The larger angle is " + rb + " parts." }].filter(function (z) { return z.v !== rb * unit; }),
          hints: ["Call them $" + ra + "k$ and $" + rb + "k$. A linear pair adds up to $180°$.", "$" + (ra + rb) + "k = 180$, so $k = " + unit + "$."],
          why: "$" + ra + "k + " + rb + "k = 180$ gives $k = " + unit + "$, so the angles are $" + ra * unit + "°$ and $" + rb * unit + "°$." };
      } },
    { id: "geo1-compsupp", title: "Complementary and supplementary angles", lesson: 10,
      gen: function (R) {
        var form = R.pick(["plain", "plain", "diff", "times", "expr", "mixed"]);
        function ex(k, c) { return (k === 1 ? "" : k) + "x" + (c ? " " + signed(c) : ""); }
        var comp = R.chance(0.5), T = comp ? 90 : 180, word = comp ? "complement" : "supplement", words2 = comp ? "complementary" : "supplementary";
        if (form === "plain") {
          var a = R.int(3, T - 3);
          if (a === T / 2) a += 7;
          return { type: "num", prompt: "Find the " + word + " of a $" + a + "°$ angle.", answer: T - a, post: "°", label: word,
            near: [{ v: (comp ? 180 : 90) - a, fb: comp ? "Complementary angles add up to $90°$, not $180°$." : "Supplementary angles add up to $180°$, not $90°$." }].filter(function (z) { return z.v > 0 && z.v !== T - a; }),
            hints: [comp ? "Complementary: the two add up to $90°$." : "Supplementary: the two add up to $180°$."],
            why: "$" + T + "° - " + a + "° = " + (T - a) + "°$." };
        }
        if (form === "diff") {
          var d = 2 * R.int(2, comp ? 20 : 40), small = (T - d) / 2, big = R.chance(0.5);
          return { type: "num", prompt: "Two " + words2 + " angles differ by $" + d + "°$. Find the " + (big ? "larger" : "smaller") + " angle.",
            answer: big ? small + d : small, post: "°", label: big ? "Larger" : "Smaller",
            near: [{ v: big ? small : small + d, fb: "That's the other one." }, { v: T - d, fb: "Two angles share that; split it evenly, then add the difference back to one of them." }].filter(function (z) { return z.v !== (big ? small + d : small); }),
            hints: ["Call the smaller one $x$; the larger is $x + " + d + "$.", "$x + (x + " + d + ") = " + T + "$, so $2x = " + (T - d) + "$."],
            why: "$2x + " + d + " = " + T + "$ gives $x = " + small + "$: the angles are $" + small + "°$ and $" + (small + d) + "°$." };
        }
        if (form === "times") {
          var k = R.pick(comp ? [2, 4, 5, 8, 9] : [2, 3, 4, 5, 8, 9]), ang = T / (k + 1);
          return { type: "num", prompt: "The " + word + " of an angle is " + k + " times the angle. Find the angle.", answer: ang, post: "°", label: "Angle",
            near: [{ v: T - ang, fb: "That's the " + word + ". The question asks for the angle itself." }],
            hints: ["Call the angle $x$. Its " + word + " is $" + k + "x$.", "$x + " + k + "x = " + T + "$."],
            why: "$x + " + k + "x = " + T + "$, so $" + (k + 1) + "x = " + T + "$ and $x = " + num(ang) + "°$." };
        }
        if (form === "expr") {
          var x, p, q, r, t, tries = 0;
          do { x = R.int(3, 15); p = R.int(1, 7); r = R.int(1, 7); q = R.int(-15, 20); t = T - (p + r) * x - q; tries++; } while ((p * x + q < 8 || r * x + t < 8 || Math.abs(t) > 60) && tries < 150);
          var m1 = p * x + q, m2 = r * x + t, first = R.chance(0.5);
          return { type: "num", prompt: "Two angles are " + words2 + ", with measures $(" + ex(p, q) + ")°$ and $(" + ex(r, t) + ")°$. Find the measure of the " + (first ? "first" : "second") + " angle.",
            answer: first ? m1 : m2, post: "°", label: "Measure",
            near: [{ v: x, fb: "That's $x$. Put it back in." }, { v: first ? m2 : m1, fb: "That's the other angle." }].filter(function (z) { return z.v !== (first ? m1 : m2); }),
            hints: ["They add up to $" + T + "°$: $(" + ex(p, q) + ") + (" + ex(r, t) + ") = " + T + "$.", "$" + ex(p + r, q + t) + " = " + T + "$, so $x = " + x + "$."],
            why: "$" + ex(p + r, q + t) + " = " + T + "$ gives $x = " + x + "$: the angles are $" + m1 + "°$ and $" + m2 + "°$." };
        }
        // The supplement is k times the complement, less c.
        var xa, kk, cc, tries2 = 0;
        do { xa = R.int(10, 80); kk = R.pick([2, 3, 4]); cc = kk * (90 - xa) - (180 - xa); tries2++; } while ((cc <= 0 || cc > 120) && tries2 < 80);
        return { type: "num", kicker: "One step harder", prompt: "The supplement of an angle is $" + cc + "°$ less than " + ["", "", "twice", "three times", "four times"][kk] + " its complement. Find the angle.",
          answer: xa, post: "°", label: "Angle",
          near: [{ v: 90 - xa, fb: "That's the complement." }, { v: 180 - xa, fb: "That's the supplement." }],
          hints: ["Call the angle $x$: its supplement is $180 - x$ and its complement is $90 - x$.", "$180 - x = " + kk + "(90 - x) - " + cc + "$."],
          why: "$180 - x = " + kk + "(90 - x) - " + cc + " = " + (kk * 90 - cc) + " - " + kk + "x$, so $" + (kk - 1) + "x = " + (kk * 90 - cc - 180) + "$ and $x = " + xa + "°$." };
      } },
    { id: "geo1-perp", title: "Perpendicular lines and reading figures", lesson: 10,
      gen: function (R) {
        var form = R.pick(["x", "x", "split", "assume", "assume", "asn", "asn"]);
        function ex(k, c) { return (k === 1 ? "" : k) + "x" + (c ? " " + signed(c) : ""); }
        var n = letters(R, 5);
        if (form === "x") {
          var x, p, q, tries = 0;
          do { x = R.int(4, 30); p = R.int(2, 9); q = 90 - p * x; tries++; } while ((Math.abs(q) > 40 || q === 0) && tries < 60);
          return { type: "num", prompt: "$\\overleftrightarrow{" + n[0] + n[1] + "} \\;\\perp\\; \\overleftrightarrow{" + n[2] + n[3] + "}$, and they meet at $" + n[4] + "$. If $m\\angle " + n[0] + n[4] + n[2] + " = (" + ex(p, q) + ")°$, find $x$.",
            art: xFig(90, { names: [n[0], n[2], n[1], n[3]], v: n[4], vlab: "sw", nums: false, wedges: [{ i: 0, j: 1, right: true }] }),
            answer: x, label: "x",
            near: [{ v: (180 - q) / p, fb: "Perpendicular lines meet at $90°$, not $180°$." }].filter(function (z) { return Number.isInteger(z.v) && z.v !== x; }),
            hints: ["Perpendicular lines form right angles: $" + ex(p, q) + " = 90$."],
            why: "$" + ex(p, q) + " = 90$, so $" + p + "x = " + (90 - q) + "$ and $x = " + x + "$." };
        }
        if (form === "split") {
          var y, a, b, c, tries2 = 0;
          do { y = R.int(3, 12); a = R.int(1, 6); b = R.int(1, 6); c = 90 - (a + b) * y; tries2++; } while ((Math.abs(c) > 30 || a * y < 10 || b * y + c < 10) && tries2 < 100);
          return { type: "num", prompt: "$\\overrightarrow{" + n[4] + n[0] + "} \\;\\perp\\; \\overrightarrow{" + n[4] + n[2] + "}$, and $\\overrightarrow{" + n[4] + n[1] + "}$ is between them. $m\\angle " + n[0] + n[4] + n[1] + " = (" + ex(a, 0) + ")°$ and $m\\angle " + n[1] + n[4] + n[2] + " = (" + ex(b, c) + ")°$. Find $x$.",
            art: rayFig([0, 0], [{ d: 0, name: n[0] }, { d: Math.max(20, Math.min(70, a * y)), name: n[1] }, { d: 90, name: n[2] }], { vname: n[4], wedges: [{ i: 0, j: 2, right: true, r: 16 }], x: [-1.4, 3.6], y: [-1, 3.6], alt: "A right angle split by a ray." }),
            answer: y, label: "x",
            near: [{ v: (180 - c) / (a + b), fb: "The two parts make a **right** angle: $90°$." }].filter(function (z) { return Number.isInteger(z.v) && z.v !== y; }),
            hints: ["The two parts add up to the right angle: $" + ex(a, 0) + " + " + ex(b, c) + " = 90$."],
            why: "$" + ex(a + b, c) + " = 90$ gives $x = " + y + "$." };
        }
        if (form === "assume") {
          var S = R.pick([
            { s: "$\\overleftrightarrow{AB} \\;\\perp\\; \\overleftrightarrow{CD}$", ok: false, why: "There's no right-angle mark. Lines that *look* perpendicular can't be assumed to be." },
            { s: "$A$, $E$ and $B$ are collinear", ok: true, why: "They're drawn on one line — that you may assume." },
            { s: "$\\angle AEC$ and $\\angle CEB$ are a linear pair", ok: true, why: "They're adjacent, and $\\overrightarrow{EA}$ and $\\overrightarrow{EB}$ are drawn as opposite rays." },
            { s: "$\\angle AEC \\cong \\angle DEB$", ok: true, why: "They're vertical angles — and vertical angles are always congruent. That follows from the lines, not from how it looks." },
            { s: "$\\overline{AE} \\cong \\overline{EB}$", ok: false, why: "There are no tick marks. Equal-looking lengths can't be assumed equal." },
            { s: "$m\\angle AEC = 90°$", ok: false, why: "No right-angle mark, and no measure given — it can't be assumed." }]);
          return { type: "choice", prompt: "From this figure alone, can you assume that " + S.s + "?", keep: true,
            art: xFig(88, { names: ["B", "C", "A", "D"], v: "E", vlab: "sw", nums: false, alt: "Two lines crossing at E, at what looks like a right angle — but nothing is marked." }),
            options: [{ t: "Yes", fb: S.ok ? null : "Only what's drawn or marked counts. How it *looks* doesn't." }, { t: "No", fb: S.ok ? "This one follows from what's drawn: " + S.why : null }],
            answer: S.ok ? 0 : 1, hints: ["You may assume what's drawn (lines, points on them, which angles sit next to which) — not sizes, unless they're marked."], why: S.why };
        }
        var A = R.pick([
          { s: "If two angles are supplementary and one is acute, the other is obtuse.", k: 0, why: "Acute is under $90°$, so the other is over $90°$ (and under $180°$): obtuse, every time." },
          { s: "If two angles are complementary, they are both acute.", k: 0, why: "Two positive angles adding to $90°$ must each be under $90°$." },
          { s: "Two angles that form a linear pair are supplementary.", k: 0, why: "Their outer sides make a straight line, so they add up to $180°$." },
          { s: "If two angles are supplementary, they form a linear pair.", k: 1, why: "They might — but two supplementary angles can sit far apart, with no common side." },
          { s: "Vertical angles are adjacent.", k: 2, why: "Vertical angles share only a vertex, never a side." },
          { s: "Two obtuse angles are supplementary.", k: 2, why: "Each is over $90°$, so together they're over $180°$." },
          { s: "If two angles are supplementary, one of them is obtuse.", k: 1, why: "Usually — but $90° + 90°$ is supplementary with no obtuse angle." },
          { s: "Two acute angles are complementary.", k: 1, why: "Only when they happen to add up to $90°$: $30°$ and $60°$ are, $30°$ and $40°$ aren't." },
          { s: "Perpendicular lines form four right angles.", k: 0, why: "One right angle forces the rest: its vertical angle is $90°$, and each linear pair is $180° - 90° = 90°$." }]);
        var AS = ["Always", "Sometimes", "Never"];
        return { type: "choice", prompt: "Always, sometimes or never? " + A.s, keep: true,
          options: AS.map(function (t, i) { return i === A.k ? { t: t } : { t: t, fb: ["Look for a case where it fails.", "Try to find one example where it's true and one where it isn't.", "Look for one case where it does happen."][i] }; }),
          answer: A.k, hints: ["Try a few examples with real numbers — including extreme ones like $90°$."], why: A.why };
      } },
    { id: "geo1-polygon", title: "Polygons", lesson: 11,
      gen: function (R) {
        var form = R.pick(["name", "name", "classify", "classify", "is", "side"]);
        var NS = [3, 4, 5, 6, 7, 8, 9, 10, 12];
        if (form === "name") {
          var n = R.pick(NS.slice(2)), P, tries = 0;
          if (R.chance(0.5) || n > 8) P = reg(n, 2);
          else do { P = wobbly(n, R); tries++; } while (!convex(P) && tries < 20);
          if (!convex(P)) P = reg(n, 2);
          var near = [n - 1, n + 1, n === 8 ? 6 : n + 2].filter(function (k) { return NGON[k] && k !== n; });
          return mc(R, { prompt: "What is this polygon called?", art: polyFig(P, { alt: "A polygon — count its sides." }),
            right: NGON[n][0].toUpperCase() + NGON[n].slice(1),
            wrong: near.slice(0, 3).map(function (k) { return { t: NGON[k][0].toUpperCase() + NGON[k].slice(1), fb: "That has " + k + " sides. Count again, touching each side once." }; }),
            hints: ["Count the sides — start at one corner and go round."],
            why: "It has " + n + " sides: a " + NGON[n] + "." });
        }
        if (form === "classify") {
          var K = R.pick([
            { P: reg(R.pick([5, 6, 8]), 2), conv: true, reg: true },
            { P: ARROW, conv: false, reg: false }, { P: ELL, conv: false, reg: false },
            { P: [[0, 0], [4, 0], [4, 2.4], [0, 2.4]], conv: true, reg: false, note: "its sides aren't all the same length" },
            { P: [[0, 0], [2.4, 0], [3.6, 2.078], [1.2, 2.078]], conv: true, reg: false, note: "its sides all match, but its angles don't" },
            { P: [[0, 1.6], [1.2, 1.2], [1.6, 0], [2, 1.2], [3.2, 1.6], [2, 2], [1.6, 3.2], [1.2, 2]], conv: false, reg: false }]);
          var nn = K.P.length, nm = NGON[nn][0].toUpperCase() + NGON[nn].slice(1);
          var right = nm + ", " + (K.conv ? "convex" : "concave") + ", " + (K.reg ? "regular" : "irregular");
          var opts = [[true, true], [true, false], [false, false], [false, true]].map(function (c) { return nm + ", " + (c[0] ? "convex" : "concave") + ", " + (c[1] ? "regular" : "irregular"); });
          return mc(R, { prompt: "Classify this polygon.", art: polyFig(K.P, { u: K.P === ELL ? 34 : 30, alt: "A polygon with " + nn + " sides." }), right: right, keep: true,
            wrong: opts.filter(function (t) { return t !== right; }).map(function (t) {
              return { t: t, fb: /concave, regular/.test(t) ? "A concave polygon can never be regular: regular polygons are convex by definition." :
                K.conv && /concave/.test(t) ? "Extend each side into a line: none of those lines passes through the inside, so it's convex." :
                !K.conv && /convex/.test(t) ? "Extend the sides into lines: at least one passes through the inside. That makes it concave." :
                "Regular needs **all** sides congruent **and** all angles congruent" + (K.note ? " — " + K.note + "." : ".") };
            }),
            hints: ["Count the sides. Then imagine each side extended into a line: does any pass through the inside?", "Regular means convex, with every side and every angle the same."],
            why: "It has " + nn + " sides. " + (K.conv ? "No side's line passes through the inside, so it's convex" : "A line along one of its sides passes through the inside, so it's concave") + "; " +
              (K.reg ? "every side and every angle match, so it's regular." : "it isn't regular" + (K.note ? ": " + K.note + "." : ".")) });
        }
        if (form === "is") {
          var Q = R.pick([
            { art: plain([-0.5, 4.5], [-0.5, 3.2], [{ path: [[0, 0], [4, 0], [3, 2.6], [0.4, 2.2]], c: "blue" }], { u: 30 }), ok: false, why: "It isn't closed: there's a gap between two ends." },
            { art: plain([-0.5, 4.5], [-0.5, 3.2], [{ path: [[0, 0], [4, 2.6], [4, 0], [0, 2.6], [0, 0]], c: "blue" }], { u: 30 }), ok: false, why: "Two sides cross each other, and sides may only meet at their endpoints." },
            { art: plain([-2.4, 2.4], [-2.4, 2.4], [{ path: [[-2, -1.4], [2, -1.4]], c: "blue" }, { path: [[-2, -1.4], [-2, 0.4]], c: "blue" }, { path: [[2, -1.4], [2, 0.4]], c: "blue" }, { ell: [[0, 0.4], 2, 1.6], part: "back", c: "blue" }], { u: 30 }), ok: false, why: "One side is curved, and every side of a polygon is a segment." },
            { art: polyFig(ARROW, { u: 30 }), ok: true, why: "It's closed, every side is a segment, and sides meet only at their ends — a (concave) polygon." },
            { art: polyFig(reg(7, 2), { u: 30 }), ok: true, why: "Closed, made of segments meeting only at their endpoints: a heptagon." }]);
          return { type: "choice", prompt: "Is this figure a polygon?", art: Q.art, keep: true,
            options: [{ t: "Yes", fb: Q.ok ? null : Q.why }, { t: "No", fb: Q.ok ? "Check the rules: closed, all segments, sides meeting only at endpoints. This one passes." : null }],
            answer: Q.ok ? 0 : 1, hints: ["A polygon is closed, every side is a straight segment, and the sides meet only at their endpoints."], why: Q.why };
        }
        var sides = R.pick([5, 6, 8, 10, 12]), s = R.int(3, 25), P2 = sides * s;
        return { type: "num", prompt: "A regular " + NGON[sides] + " has a perimeter of $" + P2 + "$ cm. How long is each side?", answer: s, post: "cm", label: "Side",
          near: [{ v: P2 / (sides - 1), fb: "A " + NGON[sides] + " has " + sides + " sides." }].filter(function (z) { return Number.isInteger(z.v); }),
          hints: ["Regular: every side is the same length. How many sides does a " + NGON[sides] + " have?"],
          why: "$" + P2 + " \\div " + sides + " = " + s + "$ cm." };
      } },
    { id: "geo1-perim", title: "Perimeter, circumference and area", lesson: 12,
      gen: function (R) {
        var form = R.pick(["rect", "tri", "circle", "circle", "coord", "coord", "back", "scale"]);
        if (form === "rect") {
          var l = R.int(12, 95) / 10, w = R.int(8, 60) / 10, isSq = R.chance(0.25), u = R.pick(["cm", "m", "in.", "ft"]);
          if (isSq) w = l;
          if (Math.abs(l - w) < 1e-9 && !isSq) l += 1.3;
          l = r1(l); w = r1(w);
          var askP = R.chance(0.5), P = r2(2 * l + 2 * w), A = r2(l * w);
          var X2 = isSq ? 2.8 : 4.5, Y2 = isSq ? 2.8 : 2.6;
          var art = plain([-0.9, X2 + 0.9], [-0.8, Y2 + 0.8], [{ poly: [[0, 0], [X2, 0], [X2, Y2], [0, Y2]], c: "blue" },
            { len: num(l) + " " + u, seg: [[0, 0], [X2, 0]], side: -1, off: 15 }].concat(isSq ? [{ seg: [[0, 0], [X2, 0]], marks: 1, c: "blue" }, { seg: [[X2, 0], [X2, Y2]], marks: 1, c: "blue" }, { seg: [[X2, Y2], [0, Y2]], marks: 1, c: "blue" }, { seg: [[0, Y2], [0, 0]], marks: 1, c: "blue" }]
              : [{ len: num(w) + " " + u, seg: [[X2, 0], [X2, Y2]], side: -1, off: 16 }]),
            { u: 40, alt: "A " + (isSq ? "square with side " + l : "rectangle " + l + " by " + w) + ". Not to scale." });
          return { type: "num", prompt: "Find the **" + (askP ? "perimeter" : "area") + "** of this " + (isSq ? "square" : "rectangle") + ". (Not drawn to scale.)", art: art,
            answer: askP ? P : A, post: askP ? u : u + "²", label: askP ? "Perimeter" : "Area", tol: 0.001,
            near: [{ v: askP ? A : P, fb: askP ? "That's the area. Perimeter is the distance **around**: add all four sides." : "That's the perimeter. Area is length × width." }, { v: r2(l + w), fb: "That's only two of the four sides." }].filter(function (z) { return Math.abs(z.v - (askP ? P : A)) > 1e-9; }),
            hints: [askP ? "$P = 2ℓ + 2w$: two lengths and two widths." : "$A = ℓ w$."],
            why: askP ? "$P = 2(" + num(l) + ") + 2(" + num(w) + ") = " + num(P) + "$ " + u + "." : "$A = " + num(l) + " \\times " + num(w) + " = " + num(A) + "$ " + u + "²." };
        }
        if (form === "tri") {
          var b = R.int(4, 16), h = R.int(3, 12);
          return { type: "num", prompt: "A triangle has a base of $" + b + "$ m and a height of $" + h + "$ m. Find its area.",
            art: plain([-0.6, 5.6], [-0.9, 3.6], [{ poly: [[0, 0], [5, 0], [1.6, 2.8]], c: "blue" }, { seg: [[1.6, 2.8], [1.6, 0]], dash: "4 4", c: "orange" }, { angle: [[5, 0], [1.6, 0], [1.6, 2.8]], right: true, c: "orange" },
              { len: b + " m", seg: [[0, 0], [5, 0]], side: -1, off: 15 }, { word: h + " m", at: [2.1, 1.3], anchor: "start", c: "orange" }], { u: 40, alt: "A triangle with its base and height marked." }),
            answer: b * h / 2, post: "m²", label: "Area",
            near: [{ v: b * h, fb: "A triangle is **half** of a rectangle with the same base and height: $\\frac{1}{2}bh$." }],
            hints: ["$A = \\frac{1}{2}bh$."], why: "$\\frac{1}{2}(" + b + ")(" + h + ") = " + num(b * h / 2) + "$ m²." };
        }
        if (form === "circle") {
          var r = R.int(2, 15), useD = R.chance(0.4), askC = R.chance(0.5), C = 2 * Math.PI * r, Ar = Math.PI * r * r;
          return { type: "num", prompt: "A circle has a " + (useD ? "diameter of $" + 2 * r + "$" : "radius of $" + r + "$") + " in. Find its **" + (askC ? "circumference" : "area") + "**, to the nearest tenth.",
            art: plain([-2.6, 2.6], [-2.6, 2.6], [{ circle: [[0, 0], 2] }, { seg: useD ? [[-2, 0], [2, 0]] : [[0, 0], [2, 0]], c: "orange" }, { pt: [0, 0] },
              { len: (useD ? 2 * r : r) + " in.", seg: useD ? [[-2, 0], [2, 0]] : [[0, 0], [2, 0]], side: 1, off: 12, c: "orange" }], { u: 34, alt: "A circle with its " + (useD ? "diameter" : "radius") + " marked." }),
            answer: r1(askC ? C : Ar), tol: 0.051, post: askC ? "in." : "in.²", label: askC ? "Circumference" : "Area",
            near: [{ v: r1(askC ? Ar : C), tol: 0.06, fb: askC ? "That's the area. Circumference is $2\\pi r$." : "That's the circumference. Area is $\\pi r^2$." }].concat(useD ? [{ v: r1(askC ? 4 * Math.PI * r : 4 * Math.PI * r * r), tol: 0.06, fb: "The diameter is twice the radius. Halve it first: $r = " + r + "$." }] : []),
            hints: [useD ? "The radius is half the diameter: $r = " + r + "$." : "Use $r = " + r + "$.", askC ? "$C = 2\\pi r$." : "$A = \\pi r^2$."],
            why: askC ? "$C = 2\\pi(" + r + ") = " + 2 * r + "\\pi \\approx " + num(r1(C)) + "$ in." : "$A = \\pi(" + r + ")^2 = " + r * r + "\\pi \\approx " + num(r1(Ar)) + "$ in.²" };
        }
        if (form === "coord") {
          // A triangle with a flat base: base and height by counting, the slanted sides by the distance formula.
          var y0 = R.int(-4, 0), x1 = R.int(-5, -1), x2 = x1 + R.int(4, 9), hx = R.int(x1, x2), hh = R.int(3, 6), askA = R.chance(0.5);
          var A1 = [x1, y0], B1 = [x2, y0], C1 = [hx, y0 + hh];
          var s1 = Math.sqrt(sq(hx - x1) + hh * hh), s2 = Math.sqrt(sq(x2 - hx) + hh * hh), per = (x2 - x1) + s1 + s2, ar = (x2 - x1) * hh / 2;
          var nm = letters(R, 3);
          return { type: "num", prompt: "Find the **" + (askA ? "area" : "perimeter") + "** of $\\triangle " + nm.join("") + "$ with $" + nm[0] + pt(A1) + "$, $" + nm[1] + pt(B1) + "$ and $" + nm[2] + pt(C1) + "$" + (askA ? "." : ", to the nearest tenth."),
            art: grid(win([A1, B1, C1], 0), win([A1, B1, C1], 1), [{ poly: [A1, B1, C1], names: nm, c: "blue" }], { u: 26, alt: "A triangle on a grid with a flat base." }),
            answer: askA ? ar : r1(per), tol: askA ? 1e-9 : 0.051, label: askA ? "Area" : "Perimeter",
            near: askA ? [{ v: (x2 - x1) * hh, fb: "Area of a triangle is **half** base times height." }] : [{ v: r1((x2 - x1) + Math.abs(hx - x1) + Math.abs(x2 - hx) + 2 * hh), tol: 0.06, fb: "The slanted sides aren't across-plus-up: use the distance formula for each." }],
            hints: askA ? ["The base is flat: count it. The height is how far $" + nm[2] + "$ is above the base.", "$A = \\frac{1}{2}bh = \\frac{1}{2}(" + (x2 - x1) + ")(" + hh + ")$."]
                        : ["The base is flat: $" + (x2 - x1) + "$ units. The other two sides need the distance formula.", "$" + nm[0] + nm[2] + " = \\sqrt{" + sq(hx - x1) + " + " + hh * hh + "}$ and $" + nm[1] + nm[2] + " = \\sqrt{" + sq(x2 - hx) + " + " + hh * hh + "}$."],
            why: askA ? "Base $" + (x2 - x1) + "$, height $" + hh + "$: $\\frac{1}{2}(" + (x2 - x1) + ")(" + hh + ") = " + num(ar) + "$ square units."
                      : "$" + (x2 - x1) + " + " + (isSquare(sq(hx - x1) + hh * hh) ? Math.sqrt(sq(hx - x1) + hh * hh) : "\\sqrt{" + (sq(hx - x1) + hh * hh) + "}") + " + " + (isSquare(sq(x2 - hx) + hh * hh) ? Math.sqrt(sq(x2 - hx) + hh * hh) : "\\sqrt{" + (sq(x2 - hx) + hh * hh) + "}") + " \\approx " + num(r1(per)) + "$ units." };
        }
        if (form === "back") {
          var K = R.pick(["sq", "circ"]);
          if (K === "sq") {
            var sd = R.int(3, 15);
            return { type: "num", prompt: "A square has an area of $" + sd * sd + "$ square inches. Find its perimeter.", answer: 4 * sd, post: "in.", label: "Perimeter",
              near: [{ v: sd, fb: "That's one side. The perimeter is all four." }, { v: sd * sd / 4, fb: "Area isn't four times the side: find the side first, $\\sqrt{" + sd * sd + "}$." }].filter(function (z) { return z.v !== 4 * sd; }),
              hints: ["The side is the square root of the area: $s = \\sqrt{" + sd * sd + "}$.", "Then $P = 4s$."], why: "$s = \\sqrt{" + sd * sd + "} = " + sd + "$, so $P = 4(" + sd + ") = " + 4 * sd + "$ in." };
          }
          var rr = R.int(2, 12);
          return mc(R, { prompt: "A circle has an area of $" + rr * rr + "\\pi$ square units. What is its circumference?", right: "$" + 2 * rr + "\\pi$",
            wrong: [{ t: "$" + rr + "\\pi$", fb: "That uses the radius once. $C = 2\\pi r$." }, { t: "$" + rr * rr * 2 + "\\pi$", fb: "Find the radius first: $r^2 = " + rr * rr + "$." }, { t: "$" + 4 * rr + "\\pi$", fb: "That doubles the diameter. $C = 2\\pi r = \\pi d$." }],
            hints: ["$\\pi r^2 = " + rr * rr + "\\pi$, so $r^2 = " + rr * rr + "$.", "$r = " + rr + "$; now $C = 2\\pi r$."], why: "$r = " + rr + "$, so $C = 2\\pi(" + rr + ") = " + 2 * rr + "\\pi$." });
        }
        var L0 = R.int(3, 9), W0 = R.int(2, 6), k = R.pick([2, 3, 2]), what = R.pick(["perimeter", "area"]);
        return { type: "num", prompt: "A rectangle is $" + L0 + "$ by $" + W0 + "$. Both its length and width are multiplied by " + k + ". What is the new " + what + "?",
          answer: what === "area" ? k * k * L0 * W0 : k * (2 * L0 + 2 * W0), label: "New " + what,
          near: what === "area" ? [{ v: k * L0 * W0, fb: "Both the length **and** the width grew: the area grows " + k + " × " + k + " = " + k * k + " times." }] : [{ v: k * k * (2 * L0 + 2 * W0), fb: "Perimeter is a length, so it's multiplied by " + k + ", not " + k * k + "." }],
          hints: ["Work out the new length and width: $" + k * L0 + "$ by $" + k * W0 + "$."],
          why: what === "area" ? "$" + k * L0 + " \\times " + k * W0 + " = " + k * k * L0 * W0 + "$: " + k * k + " times the old area of $" + L0 * W0 + "$." : "$2(" + k * L0 + ") + 2(" + k * W0 + ") = " + k * (2 * L0 + 2 * W0) + "$: " + k + " times the old perimeter of $" + (2 * L0 + 2 * W0) + "$." };
      } },
    { id: "geo1-solids", title: "Three-dimensional figures", lesson: 13,
      gen: function (R) {
        var form = R.pick(["name", "name", "count", "count", "euler", "poly", "platonic"]);
        function cap(s) { return s[0].toUpperCase() + s.slice(1); }
        if (form === "name") {
          var S = R.pick(SOLIDS);
          var near = SOLIDS.filter(function (x) { return x !== S; }).sort(function (a, b) {
            function score(x) { return (x.name.split(" ")[0] === S.name.split(" ")[0] ? -2 : 0) + (x.name.split(" ")[1] === S.name.split(" ")[1] ? -1 : 0) + (x.poly === S.poly ? -1 : 0); }
            return score(a) - score(b);
          }).slice(0, 3);
          return mc(R, { prompt: "Identify this solid.", art: solidFig(S), right: cap(S.name),
            wrong: near.map(function (x) { return { t: cap(x.name), fb: S.poly ? (/prism/.test(S.name) ? "It has **two** congruent bases joined by rectangles — a prism — named by the shape of its bases." : "It has **one** base, and every other face is a triangle meeting at the top — a pyramid, named by its base.")
              : S.k === "cyl" ? "Two circular bases, one curved side: a cylinder." : S.k === "cone" ? "One circular base and a point on top: a cone." : "Every point of its surface is the same distance from the centre: a sphere." }; }),
            hints: ["Does it have flat faces only? Then count its bases: two (a prism) or one (a pyramid), and look at their shape."],
            why: "It's a " + S.name + "." + (S.poly ? " It's named by its base, which is " + { prism3: "a triangle", box: "a rectangle", prism5: "a pentagon", prism6: "a hexagon", pyr3: "a triangle", pyr4: "a square", pyr5: "a pentagon" }[S.k] + "." : "") });
        }
        if (form === "count") {
          var n = R.pick([3, 4, 5, 6, 8]), prism = R.chance(0.5), what = R.pick(["faces", "edges", "vertices"]);
          var base = n === 4 ? (prism ? "rectangular" : "square") : { 3: "triangular", 5: "pentagonal", 6: "hexagonal", 8: "octagonal" }[n];
          var F = prism ? n + 2 : n + 1, E = prism ? 3 * n : 2 * n, V = prism ? 2 * n : n + 1, ans = { faces: F, edges: E, vertices: V }[what];
          return { type: "num", prompt: "How many **" + what + "** does a " + base + " " + (prism ? "prism" : "pyramid") + " have?",
            art: GT.solid({ shape: prism ? "prism" : "pyramid", n: n, r: 1.35, h: 2.3, rot: prism ? 0.3 : undefined, size: 200, scale: 50, alt: "A " + base + " " + (prism ? "prism" : "pyramid") + "." }),
            answer: ans, label: cap(what),
            near: [{ v: { faces: F, edges: E, vertices: V }[what === "faces" ? "vertices" : "faces"], fb: "That's the number of " + (what === "faces" ? "vertices" : "faces") + "." }].filter(function (z) { return z.v !== ans; }),
            hints: [prism ? "A prism has two " + NGON[n] + " bases, and one rectangle joining each pair of matching sides." : "A pyramid has one " + NGON[n] + " base, and one triangle on each of its sides.",
                    what === "faces" ? (prism ? n + " side faces plus 2 bases." : n + " triangles plus 1 base.") : what === "vertices" ? (prism ? n + " corners on each base." : n + " corners on the base, plus the top.") : (prism ? n + " edges round each base, plus " + n + " joining them." : n + " round the base, plus " + n + " up to the top.")],
            why: "A " + base + " " + (prism ? "prism" : "pyramid") + " has $F = " + F + "$, $E = " + E + "$, $V = " + V + "$. (Check: $" + F + " + " + V + " = " + E + " + 2$.)" };
        }
        if (form === "euler") {
          var T = R.pick([[4, 6, 4], [6, 12, 8], [8, 12, 6], [12, 30, 20], [20, 30, 12], [5, 8, 5], [7, 15, 10], [9, 16, 9], [8, 18, 12], [7, 12, 7]]), miss = R.int(0, 2);
          var nm = ["faces", "edges", "vertices"], given = [0, 1, 2].filter(function (i) { return i !== miss; });
          return { type: "num", prompt: "A polyhedron has " + given.map(function (i) { return "$" + T[i] + "$ " + nm[i]; }).join(" and ") + ". How many **" + nm[miss] + "** does it have?",
            answer: T[miss], label: cap(nm[miss]),
            near: [{ v: miss === 1 ? T[0] + T[2] + 2 : Math.abs(T[1] + 2 - T[miss === 0 ? 2 : 0]) + 4, fb: "Check Euler's formula: $F + V = E + 2$ — the 2 goes with the edges." }].filter(function (z) { return z.v !== T[miss]; }),
            hints: ["Euler's formula: $F + V = E + 2$."],
            why: "$F + V = E + 2$: " + (miss === 0 ? "$F + " + T[2] + " = " + T[1] + " + 2$, so $F = " + T[0] + "$." : miss === 1 ? "$" + T[0] + " + " + T[2] + " = E + 2$, so $E = " + T[1] + "$." : "$" + T[0] + " + V = " + T[1] + " + 2$, so $V = " + T[2] + "$.") };
        }
        if (form === "poly") {
          var P = R.pick([{ n: "a cube", ok: true }, { n: "a cone", ok: false, why: "a cone has a curved surface and a circular base, not polygons" }, { n: "a square pyramid", ok: true },
            { n: "a cylinder", ok: false, why: "a cylinder's bases are circles and its side is curved" }, { n: "a triangular prism", ok: true }, { n: "a sphere", ok: false, why: "a sphere has no flat faces at all" }, { n: "an octahedron", ok: true }]);
          return { type: "choice", prompt: "Is " + P.n + " a polyhedron?", keep: true,
            options: [{ t: "Yes", fb: P.ok ? null : "No: " + P.why + "." }, { t: "No", fb: P.ok ? "Every face is a flat polygon, so it is a polyhedron." : null }],
            answer: P.ok ? 0 : 1, hints: ["A polyhedron's surfaces are all flat polygons."],
            why: P.ok ? "All of its faces are flat polygons, so it's a polyhedron." : "Not a polyhedron: " + P.why + "." };
        }
        var PL = [{ n: "tetrahedron", f: 4, s: "equilateral triangles" }, { n: "cube (hexahedron)", f: 6, s: "squares" }, { n: "octahedron", f: 8, s: "equilateral triangles" },
                  { n: "dodecahedron", f: 12, s: "regular pentagons" }, { n: "icosahedron", f: 20, s: "equilateral triangles" }], p = R.pick(PL);
        var shp = { "tetrahedron": "tetra", "cube (hexahedron)": "cube", "octahedron": "octa", "dodecahedron": "dodeca", "icosahedron": "icosa" }[p.n];
        return mc(R, { prompt: "This Platonic solid is a" + (p.n[0] === "i" || p.n[0] === "o" ? "n " : " ") + p.n.replace(" (hexahedron)", "") + ". What are its faces?",
          art: GT.solid({ shape: shp, s: 2, size: 200, scale: 55, alt: "A " + p.n + "." }), right: p.f + " " + p.s,
          wrong: PL.filter(function (x) { return x !== p; }).slice(0, 3).map(function (x) { return { t: x.f + " " + x.s, fb: "That's the " + x.n + "." }; }),
          hints: ["The name counts the faces: tetra = 4, hexa = 6, octa = 8, dodeca = 12, icosa = 20."],
          why: "A " + p.n + " has " + p.f + " faces, all " + p.s + "." });
      } },
    { id: "geo1-sav", title: "Surface area and volume", lesson: 14,
      gen: function (R) {
        var form = R.pick(["box", "box", "cube", "cyl", "cone", "pyr", "tri"]);
        var askV = R.chance(0.5), u = R.pick(["cm", "in.", "m", "ft"]);
        if (form === "box") {
          var a = R.int(2, 12), b = R.int(2, 9), c = R.int(2, 10), T = 2 * (a * b + b * c + a * c), V = a * b * c;
          return { type: "num", prompt: "Find the **" + (askV ? "volume" : "surface area") + "** of the box.", art: boxDims(a, c, b, [a + " " + u, c + " " + u, b + " " + u]),
            answer: askV ? V : T, post: u + (askV ? "³" : "²"), label: askV ? "Volume" : "Surface area",
            near: [{ v: askV ? T : V, fb: askV ? "That's the surface area — the wrapping. Volume is what fits inside: $ℓ wh$." : "That's the volume. Surface area adds the six faces." }, { v: a * b + b * c + a * c, fb: "Each face has a matching one opposite: double it." }].filter(function (z) { return z.v !== (askV ? V : T); }),
            hints: askV ? ["$V = Bh$: the base's area times the height.", "$" + a + " \\times " + b + " \\times " + c + "$."] : ["Six faces, in three matching pairs: $" + a + " \\times " + b + "$, $" + b + " \\times " + c + "$ and $" + a + " \\times " + c + "$.", "$2(" + a * b + " + " + b * c + " + " + a * c + ")$."],
            why: askV ? "$V = " + a + " \\times " + b + " \\times " + c + " = " + V + "$ " + u + "³." : "$T = 2(" + a * b + " + " + b * c + " + " + a * c + ") = " + T + "$ " + u + "²." };
        }
        if (form === "cube") {
          var e = R.int(2, 12), byV = R.chance(0.5);
          return { type: "num", prompt: "A cube has a " + (byV ? "volume of $" + e * e * e + "$ cubic centimeters" : "surface area of $" + 6 * e * e + "$ square centimeters") + ". How long is each edge?",
            answer: e, post: "cm", label: "Edge",
            near: byV ? [{ v: r1(e * e * e / 3), tol: 0.1, fb: "Volume isn't 3 × the edge — it's the edge **cubed**. Find the number that, cubed, makes $" + e * e * e + "$." }] : [{ v: e * e, fb: "That's the area of one face. The edge is its square root." }],
            hints: byV ? ["$V = e^3$, so $e^3 = " + e * e * e + "$."] : ["Six square faces: one face is $" + 6 * e * e + " \\div 6 = " + e * e + "$.", "The edge is $\\sqrt{" + e * e + "}$."],
            why: byV ? "$" + e + "^3 = " + e * e * e + "$, so the edge is $" + e + "$ cm." : "One face is $" + e * e + "$ cm², so the edge is $\\sqrt{" + e * e + "} = " + e + "$ cm." };
        }
        if (form === "cyl") {
          var r = R.int(2, 9), h = R.int(3, 14), V2 = Math.PI * r * r * h, T2 = 2 * Math.PI * r * h + 2 * Math.PI * r * r;
          return { type: "num", prompt: "Find the **" + (askV ? "volume" : "surface area") + "** of the cylinder, to the nearest tenth.",
            art: GT.solid({ shape: "cylinder", r: 1.2, h: 2.2, labels: { r: r + " " + u, h: h + " " + u }, size: 220, scale: 52, alt: "A cylinder with radius " + r + " and height " + h + "." }),
            answer: r1(askV ? V2 : T2), tol: 0.051, post: u + (askV ? "³" : "²"), label: askV ? "Volume" : "Surface area",
            near: askV ? [{ v: r1(2 * Math.PI * r * h), tol: 0.06, fb: "That's the curved side's area. Volume is the base's area times the height: $\\pi r^2 h$." }] : [{ v: r1(2 * Math.PI * r * h), tol: 0.06, fb: "That's only the curved side. Add the two circular bases, $2\\pi r^2$." }],
            hints: askV ? ["$V = \\pi r^2 h$."] : ["$T = 2\\pi rh + 2\\pi r^2$: the side, unrolled into a rectangle, plus two circles."],
            why: askV ? "$V = \\pi(" + r + ")^2(" + h + ") = " + r * r * h + "\\pi \\approx " + num(r1(V2)) + "$ " + u + "³." : "$T = 2\\pi(" + r + ")(" + h + ") + 2\\pi(" + r + ")^2 = " + (2 * r * h + 2 * r * r) + "\\pi \\approx " + num(r1(T2)) + "$ " + u + "²." };
        }
        if (form === "cone") {
          var tr = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 6, 10]]), cr = tr[0], ch = tr[1], cl = tr[2];
          var V3 = Math.PI * cr * cr * ch / 3, T3 = Math.PI * cr * cl + Math.PI * cr * cr;
          return { type: "num", prompt: "Find the **" + (askV ? "volume" : "surface area") + "** of the cone, to the nearest tenth.",
            art: GT.solid({ shape: "cone", r: 1.3, h: 2.4, labels: askV ? { r: cr + " " + u, h: ch + " " + u } : { r: cr + " " + u, l: cl + " " + u }, size: 220, scale: 52, alt: "A cone with its measurements marked." }),
            answer: r1(askV ? V3 : T3), tol: 0.051, post: u + (askV ? "³" : "²"), label: askV ? "Volume" : "Surface area",
            near: askV ? [{ v: r1(3 * V3), tol: 0.06, fb: "That's a cylinder's volume. A cone holds a **third** of that: $\\frac{1}{3}\\pi r^2 h$." }] : [{ v: r1(Math.PI * cr * cl), tol: 0.06, fb: "That's only the slanted side. Add the circular base, $\\pi r^2$." }],
            hints: askV ? ["$V = \\frac{1}{3}\\pi r^2 h$."] : ["$T = \\pi rℓ + \\pi r^2$, with $ℓ$ the slant height."],
            why: askV ? "$V = \\frac{1}{3}\\pi(" + cr + ")^2(" + ch + ") = " + cr * cr * ch / 3 + "\\pi \\approx " + num(r1(V3)) + "$ " + u + "³." : "$T = \\pi(" + cr + ")(" + cl + ") + \\pi(" + cr + ")^2 = " + (cr * cl + cr * cr) + "\\pi \\approx " + num(r1(T3)) + "$ " + u + "²." };
        }
        if (form === "pyr") {
          var py = R.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [8, 6, 10], [6, 8, 10]]), s = 2 * py[0], ph = py[1], pl = py[2];
          var V4 = s * s * ph / 3, T4 = 2 * s * pl + s * s;
          return { type: "num", prompt: "Find the **" + (askV ? "volume" : "surface area") + "** of the square pyramid.", art: pyrDims(askV ? { s: s + " " + u, h: ph + " " + u } : { s: s + " " + u, l: pl + " " + u }),
            answer: askV ? V4 : T4, post: u + (askV ? "³" : "²"), label: askV ? "Volume" : "Surface area",
            near: askV ? [{ v: s * s * ph, fb: "That's a prism's volume. A pyramid holds a **third**: $\\frac{1}{3}Bh$." }] : [{ v: 2 * s * pl, fb: "That's only the four triangles. Add the square base." }, { v: 4 * s * pl + s * s, fb: "Each triangle is **half** base times slant height: $\\frac{1}{2}Pℓ$." }],
            hints: askV ? ["$V = \\frac{1}{3}Bh$, where $B = " + s + "^2$."] : ["$T = \\frac{1}{2}Pℓ + B$: the perimeter of the base is $" + 4 * s + "$, and $B = " + s * s + "$."],
            why: askV ? "$V = \\frac{1}{3}(" + s * s + ")(" + ph + ") = " + num(V4) + "$ " + u + "³." : "$T = \\frac{1}{2}(" + 4 * s + ")(" + pl + ") + " + s * s + " = " + T4 + "$ " + u + "²." };
        }
        var k = R.pick([1, 2]), ta = 3 * k, tb = 4 * k, tc = 5 * k, len = R.int(4, 12), V5 = ta * tb / 2 * len, T5 = (ta + tb + tc) * len + ta * tb;
        return { type: "num", prompt: "The bases of this prism are right triangles with legs $" + ta + "$ and $" + tb + "$ " + u + " (hypotenuse $" + tc + "$ " + u + "). Find its **" + (askV ? "volume" : "surface area") + "**.",
          art: triPrism([tb + " " + u, ta + " " + u, len + " " + u]), answer: askV ? V5 : T5, post: u + (askV ? "³" : "²"), label: askV ? "Volume" : "Surface area",
          near: askV ? [{ v: ta * tb * len, fb: "The base is a triangle: its area is **half** of $" + ta + " \\times " + tb + "$." }] : [{ v: (ta + tb + tc) * len, fb: "That's the three rectangles. Add the two triangle bases." }],
          hints: askV ? ["$V = Bh$: the base is a triangle, $B = \\frac{1}{2}(" + ta + ")(" + tb + ") = " + ta * tb / 2 + "$."] : ["$T = Ph + 2B$: $P = " + (ta + tb + tc) + "$, $B = " + ta * tb / 2 + "$."],
          why: askV ? "$V = " + ta * tb / 2 + " \\times " + len + " = " + V5 + "$ " + u + "³." : "$T = " + (ta + tb + tc) + "(" + len + ") + 2(" + ta * tb / 2 + ") = " + T5 + "$ " + u + "²." };
      } },
  ];

  var QUIZZES = [
    { title: "Quiz 1", after: 4, blurb: "Points, lines and planes, measuring segments, precision, and adding segments.",
      skills: ["geo1-name", "geo1-space", "geo1-ruler", "geo1-precision", "geo1-segadd", "geo1-congseg"], per: 2 },
    { title: "Quiz 2", after: 8, blurb: "Halfway through: distance, midpoints, and measuring, naming and bisecting angles.",
      skills: ["geo1-dist1", "geo1-dist", "geo1-mid", "geo1-endpt", "geo1-midalg", "geo1-angname", "geo1-protractor", "geo1-angalg"], per: 2 },
    { title: "Quiz 3", after: 10, blurb: "Angle pairs, complements and supplements, perpendicular lines, and constructions.",
      skills: ["geo1-pairs", "geo1-vertlin", "geo1-compsupp", "geo1-perp", "geo1-construct"], per: 2 },
    { title: "Quiz 4", after: 14, blurb: "Polygons, perimeter and area, solids, and surface area and volume.",
      skills: ["geo1-polygon", "geo1-perim", "geo1-solids", "geo1-sav"], per: 2 }
  ];

  L.unit("geo", 1, {
    title: "Tools of Geometry",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Points, lines and planes", v: 3,
        blurb: "The three words geometry never defines, how to name them, and the two facts that explain why a stool never wobbles.",
        mins: 11,
        steps: [
          { type: "learn", kicker: "Puzzle",
            prompt: "A three-legged stool never wobbles. A four-legged chair sometimes does, however carefully it was made. <br><br>Why should the number of legs matter? Keep the question in mind — by the end of this lesson you'll be able to say exactly why.",
            art: FS([
              plain([0, 7], [0, 5], [{ plane: sheet(0.3, 0.4, 5, 2.2, 1.5) },
                { path: [[2.1, 3.9], [4.8, 3.9], [3.7, 4.6], [2.1, 3.9]], c: "orange" },
                { seg: [[1.7, 1.1], [2.1, 3.9]], c: "orange" }, { seg: [[4.9, 1.2], [4.8, 3.9]], c: "orange" }, { seg: [[3.5, 2.2], [3.7, 4.6]], c: "orange" },
                { pt: [1.7, 1.1], c: "orange" }, { pt: [4.9, 1.2], c: "orange" }, { pt: [3.5, 2.2], c: "orange" }],
                { u: 34, cap: "Three feet: it always sits firm.", alt: "A stool with three legs standing on a floor; all three feet touch it." }),
              plain([0, 7], [0, 5], [{ plane: sheet(0.3, 0.4, 5, 2.2, 1.5) },
                { path: [[1.9, 3.8], [4.6, 3.8], [5.5, 4.6], [2.8, 4.6], [1.9, 3.8]], c: "orange" },
                { seg: [[1.8, 1.1], [1.9, 3.8]], c: "orange" }, { seg: [[4.6, 1.1], [4.6, 3.8]], c: "orange" }, { seg: [[5.5, 2.4], [5.5, 4.6]], c: "orange" }, { seg: [[2.8, 2.2], [2.8, 4.6]], c: "orange" },
                { pt: [1.8, 1.1], c: "orange" }, { pt: [4.6, 1.1], c: "orange" }, { pt: [2.8, 2.2], c: "orange" }, { pt: [5.5, 2.4], c: "red", open: true }],
                { u: 34, cap: "Four feet: one can end up in the air.", alt: "A chair with four legs; three feet touch the floor and the fourth is lifted a little." })]) },
          { type: "learn", kicker: "Three words",
            prompt: "Everything in geometry is built out of three things. Meet them one at a time.",
            scene: { type: "walk", rows: [
              { m: "P", fig: plain([0, 6], [0, 2.4], [{ pt: [3, 1.1], name: "P", at: "n" }], { u: 40, alt: "A single dot labelled P." }),
                say: "A **point** is a location. It has no size at all — the dot only shows you where it is. Name it with a capital letter: point $P$." },
              { m: "\\overleftrightarrow{AB}", fig: onLine(["A", "B"], { n: "n", alt: "A line through A and B, named n, with arrows at both ends." }),
                say: "A **line** is a straight path of points with no thickness, going on forever both ways. Name it by two of its points, $\\overleftrightarrow{AB}$, or by one lowercase letter: line $n$." },
              { fig: plain([0, 8], [0, 3.8], [{ plane: sheet(0.5, 0.5, 5.2, 2.8, 1.8), name: "𝒩" }, { pt: [1.8, 1.2], name: "X", at: "s" }, { pt: [4.9, 1.3], name: "Y", at: "s" }, { pt: [3.9, 2.8], name: "Z", at: "n" }],
                  { u: 40, alt: "A plane drawn as a slanted four-sided sheet, named N, with points X, Y and Z on it." }),
                say: "A **plane** is a flat surface of points, with no thickness, going on forever in every direction. We draw a piece of it as a slanted sheet. Name it with a script capital, plane " + PN("N") + ", or by three of its points not on one line: plane $XYZ$." },
              { say: "These three are the **undefined terms**. We describe them with pictures and examples, but they aren't defined from anything simpler — everything else in geometry is defined from **them**." }] },
            gate: true,
            then: "A real dot, a pencil line or a sheet of paper only *models* them: the real thing has no size, no thickness, no edges." },
          { type: "choice", prompt: "Why are point, line and plane called **undefined** terms?", skill: "Points, lines and planes",
            options: [{ t: "They're explained by pictures and examples, and every other term is defined from them" },
                      { t: "Nobody is sure what they mean", fb: "We know exactly what they are — we just can't define them in simpler words, because there's nothing simpler to use." },
                      { t: "They are too advanced for a first course", fb: "They're the most basic words of all: every definition in the course is built on them." }],
            answer: 0,
            why: "A definition explains a word using simpler words. Point, line and plane are where that stops: they're described, and everything else is defined from them." },
          { type: "learn", kicker: "Naming a line",
            prompt: "A line has as many names as you like: any two points on it, in either order, or its own lowercase letter.",
            art: onLine(["A", "B", "C"], { n: "m", extra: [{ pt: [2.3, 3.2], name: "D", at: "n" }], alt: "Line m through A, B and C. Point D is above the line, off it." }),
            after: "Line $m$ is $\\overleftrightarrow{AB}$, $\\overleftrightarrow{BA}$, $\\overleftrightarrow{AC}$, $\\overleftrightarrow{CB}$… — but never $\\overleftrightarrow{AD}$, because $D$ isn't on it." },
          { type: "multi", prompt: "Which of these are names for line $m$? Choose every one that works.", skill: "Points, lines and planes",
            art: onLine(["P", "Q", "R"], { n: "m", extra: [{ pt: [4.6, 3.3], name: "S", at: "n" }], alt: "Line m through P, Q and R. Point S is above the line." }),
            options: [{ t: "$\\overleftrightarrow{PQ}$", ok: true }, { t: "$\\overleftrightarrow{RP}$", ok: true }, { t: "line $m$", ok: true },
                      { t: "line $Q$", ok: false, fb: "One capital letter names a point, not a line." },
                      { t: "$\\overleftrightarrow{QS}$", ok: false, fb: "$S$ isn't on line $m$." }],
            hints: ["Any two points **on** the line, in either order — or the line's own letter."],
            why: "$P$, $Q$ and $R$ are all on line $m$, so any two of them name it; so does $m$ itself. $S$ is off the line, and one capital letter is a point." },
          { type: "learn", kicker: "Two more words",
            prompt: "Points on the same line are **collinear**. Points in the same plane are **coplanar**.",
            art: plain([0, 8], [0, 5], [{ plane: sheet(0.6, 0.5, 5.2, 2.7, 1.8), name: "𝒫" }, { dline: [[1.1, 1.1], [6.4, 2.9]] },
              { pt: [1.9, 1.37], name: "A", at: "s" }, { pt: [3.4, 1.88], name: "B", at: "s" }, { pt: [4.9, 2.39], name: "C", at: "s" }, { pt: [3.1, 2.8], name: "D", at: "n" },
              { pt: [2.2, 4.4], name: "E", at: "n", c: "orange" }], { u: 40, alt: "Plane P with a line through A, B and C, and point D on the plane but off the line. Point E is above the plane." }),
            after: "$A$, $B$ and $C$ are collinear; $D$ is not on their line, but all four are coplanar — they're in plane " + PN("P") + ". $E$ is off the plane. Points that are not collinear are **noncollinear**." },
          { type: "choice", prompt: "Look at the same picture. Are $A$, $B$, $D$ and $E$ coplanar?", skill: "Points, lines and planes",
            art: plain([0, 8], [0, 5], [{ plane: sheet(0.6, 0.5, 5.2, 2.7, 1.8), name: "𝒫" }, { dline: [[1.1, 1.1], [6.4, 2.9]] },
              { pt: [1.9, 1.37], name: "A", at: "s" }, { pt: [3.4, 1.88], name: "B", at: "s" }, { pt: [4.9, 2.39], name: "C", at: "s" }, { pt: [3.1, 2.8], name: "D", at: "n" },
              { pt: [2.2, 4.4], name: "E", at: "n", c: "orange" }], { u: 40, alt: "The same plane and points." }),
            options: [{ t: "No — $A$, $B$ and $D$ fix plane " + PN("P") + ", and $E$ isn't in it" },
                      { t: "Yes — any four points are coplanar", fb: "Three noncollinear points already fix one plane. A fourth point has to lie in **that** plane, and $E$ doesn't." },
                      { t: "Yes — they can all be seen in one picture", fb: "A drawing is flat, but it shows space. $E$ is drawn above the sheet, off plane " + PN("P") + "." }],
            answer: 0,
            hints: ["Which plane holds $A$, $B$ and $D$? Is $E$ in it?"],
            why: "$A$, $B$ and $D$ are noncollinear, so they fix exactly one plane, " + PN("P") + ". $E$ is not in " + PN("P") + ", so the four are not coplanar." },
          { type: "learn", kicker: "Two facts",
            prompt: "Everything you've met so far rests on two facts about these words.",
            scene: { type: "walk", rows: [
              { fig: onLine(["A", "B"], { alt: "Two points and the one line through them." }),
                say: "**Through any two points there is exactly one line.** Pull a string tight between two nails: it can only go one way." },
              { fig: plain([0, 8], [0, 3.8], [{ plane: sheet(0.5, 0.5, 5.2, 2.8, 1.8) }, { pt: [1.8, 1.2], name: "X", at: "s" }, { pt: [4.9, 1.3], name: "Y", at: "s" }, { pt: [3.9, 2.8], name: "Z", at: "n" }],
                  { u: 40, alt: "Three points not on one line, and the one plane through them." }),
                say: "**Through any three noncollinear points there is exactly one plane.** Rest a sheet of card on three fingertips: it can't tip any way." },
              { fig: pagesFig({ pts: [{ pt: [2, 1.2], name: "A", at: "s" }, { pt: [3.4, 1.2], name: "B", at: "s" }, { pt: [4.8, 1.2], name: "C", at: "s" }] }),
                say: "But put the three points on **one line** and the card can turn round that line, like the pages of a book on its spine: infinitely many planes hold them." }] },
            gate: true },
          { type: "choice", prompt: "Back to the puzzle. Why does a three-legged stool never wobble?", skill: "Points, lines and planes",
            options: [{ t: "Its three feet are three noncollinear points, and exactly one plane passes through them — the floor always fits" },
                      { t: "Three legs hold less weight, so they bend less", fb: "It isn't about strength. Even a wobbly chair is strong enough — it just doesn't sit flat." },
                      { t: "Its three feet are collinear", fb: "If they were on one line, the stool would fall over — it could turn round that line, like a page." }],
            answer: 0,
            hints: ["How many planes pass through three points that aren't on one line?"],
            why: "Three feet not on one line fix exactly one plane, so the floor meets all three. A fourth foot is a fourth point, and it need not lie in that plane — so a chair can rock." },
          { type: "choice", prompt: "$W$ lies on $\\overleftrightarrow{XY}$. Which is **not** a name for plane " + PN("N") + "?", skill: "Points, lines and planes",
            art: plain([0, 8], [0, 3.8], [{ plane: sheet(0.5, 0.5, 5.4, 2.8, 1.8), name: "𝒩" }, { dline: [[1.1, 1.2], [6.2, 1.2]] },
              { pt: [1.6, 1.2], name: "X", at: "s" }, { pt: [3.2, 1.2], name: "W", at: "s" }, { pt: [4.8, 1.2], name: "Y", at: "s" }, { pt: [4.5, 2.8], name: "Z", at: "n" }],
              { u: 40, alt: "Plane N with X, W and Y on one line and Z off it." }),
            options: [{ t: "plane $XWY$" },
                      { t: "plane $XYZ$", fb: "That works: $X$, $Y$ and $Z$ are in the plane and not on one line." },
                      { t: "plane $ZWX$", fb: "That works too: $Z$ is off line $XY$, so $Z$, $W$ and $X$ are noncollinear." },
                      { t: "plane " + PN("N") + "", fb: "That's its own script name." }],
            answer: 0,
            hints: ["Three points name a plane only when they are **not** on one line."],
            why: "$X$, $W$ and $Y$ are collinear, so infinitely many planes hold them. They can't name one plane." },
          { type: "explain", kicker: "In your own words", skill: "Points, lines and planes",
            prompt: "Why can three points name a plane only if they are **not** on one line? Two or three sentences is plenty.",
            model: "Three points on one line lie in infinitely many planes — every plane that holds the line, turning round it like the pages of a book — so they don't pick out one plane. Three points not on one line lie in exactly one plane, so naming them names that plane." },
          recap([
            { say: "**Point**, **line** and **plane** are the undefined terms: described, never defined, and everything else is built from them." },
            { m: "\\overleftrightarrow{AB}", say: "A line: any two of its points, in either order, or one lowercase letter. A plane: a script capital, or three of its points not on one line." },
            { say: "**Collinear**: on one line. **Coplanar**: in one plane." },
            { say: "Exactly one line through two points. Exactly one plane through three noncollinear points — that's why a stool stands firm." }])
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Where lines and planes meet", v: 3,
        blurb: "Space, and how flat drawings show it; what lines and planes share when they meet; and how to say what a figure shows.",
        mins: 11,
        steps: [
          drawn("geo1-name", 3, { kicker: "Remember?" }),
          { type: "learn", kicker: "Space",
            prompt: "**Space** is every point there is: it goes on forever in all three directions, and it holds every line and every plane.",
            art: boxFig(null, { cap: "A flat drawing of a solid in space: edges you couldn't see from here are **dashed**." }),
            after: "A page is flat, so a drawing of space cheats a little: a plane is a slanted sheet, and anything hidden behind or under something is drawn with dashes." },
          { type: "learn", kicker: "Where things meet",
            prompt: "When two of these figures meet, what they share — their **intersection** — is always a point or a line.",
            scene: { type: "walk", rows: [
              { fig: crossFig({ at: "T", a: "ℓ", b: "m" }), say: "Two lines cross at **one point**. They can't share two, because two points fix a single line." },
              { fig: pierceFig({ plane: "ℛ", at: "R", line: "m" }), say: "A line that isn't in a plane can pass through it at **one point**. The part under the sheet is dashed: it's hidden." },
              { fig: twoPlanesFig({ names: ["A", "B"] }), say: "Two planes that meet share a whole **line** — like a wall meeting the floor." }] },
            gate: true,
            then: "Point, point, line. And if two planes never meet, like a floor and a ceiling, they're **parallel**." },
          { type: "choice", prompt: "A wall of your room meets the ceiling. What is the intersection of their planes?", skill: "Lines and planes in space",
            options: [{ t: "A line" }, { t: "A point", fb: "They meet all along the top of the wall, not at one spot." },
                      { t: "They don't intersect", fb: "A wall touches the ceiling. It's the floor and the ceiling that never meet." }],
            answer: 0,
            why: "Two planes that meet share a line: here, the edge where the wall meets the ceiling." },
          { type: "learn", kicker: "Turn it",
            prompt: "Here's a box, with its corners named. Each face lies in a plane. **Drag** it round and watch which edges come into view — the dashed ones are the edges you can't see.",
            scene: { type: "solid3", shape: "box", bases: false, w: 3.4, h: 1.9, d: 2.2, names: BOX, size: 340, sizeH: 280, scale: 62, gate: true, counts: true },
            gate: true,
            then: "Every edge is where two faces meet — so it's where two planes intersect. Each corner is where three planes meet." },
          { type: "choice", prompt: "Name the intersection of plane $ABF$ and plane $BCG$.", skill: "Lines and planes in space", art: boxFig(),
            options: [{ t: "$\\overleftrightarrow{BF}$" }, { t: "point $B$", fb: "They share more than $B$: the whole edge from $B$ to $F$ is in both faces." },
                      { t: "$\\overleftrightarrow{BC}$", fb: "$C$ isn't a corner of the bottom face $ABFE$." },
                      { t: "They don't intersect", fb: "The bottom face and the right face touch along an edge." }],
            answer: 0,
            hints: ["Plane $ABF$ is the bottom face; plane $BCG$ is the right-hand face. Which edge do they share?"],
            why: "The bottom face $ABFE$ and the right face $BCGF$ share the edge $BF$, so their planes meet in $\\overleftrightarrow{BF}$." },
          { type: "choice", prompt: "Are $A$, $B$, $C$ and $G$ coplanar?", skill: "Lines and planes in space", art: boxFig(),
            options: [{ t: "No" }, { t: "Yes", fb: "$A$, $B$ and $C$ fix the front face's plane. Is $G$ in the front face?" }],
            answer: 0, keep: true,
            hints: ["$A$, $B$ and $C$ are noncollinear, so they fix one plane. Which one?"],
            why: "$A$, $B$ and $C$ fix the plane of the front face, and $G$ is at the back, so it isn't in that plane." },
          { type: "choice", kicker: "Puzzle", prompt: "Harder: are $A$, $B$, $G$ and $H$ coplanar? No face has all four — but that isn't the question.", skill: "Lines and planes in space", art: boxFig(),
            options: [{ t: "Yes — a plane can slice through the box from edge $AB$ to edge $HG$" },
                      { t: "No — they aren't the corners of one face", fb: "A plane doesn't have to be a face. $\\overline{AB}$ and $\\overline{HG}$ run the same way, so a sheet can rest on both, cutting the box diagonally." }],
            answer: 0, keep: true,
            hints: ["$\\overline{AB}$ (bottom front) and $\\overline{HG}$ (top back) point the same way. Could one flat sheet touch both?"],
            why: "$A$, $B$ and $H$ fix a plane — a slanted one, cutting the box corner to corner — and since $\\overline{HG}$ runs the same way as $\\overline{AB}$, $G$ lies in it too." },
          { type: "learn", kicker: "Say what you see",
            prompt: "Geometry has its own way of saying what a figure shows — and one picture can be said several ways.",
            scene: { type: "walk", rows: [
              { fig: twoPlanesFig({ names: ["A", "B"] }), say: "Planes " + PN("P") + " and " + PN("Q") + " **intersect in** $\\overleftrightarrow{AB}$." },
              { say: "$\\overleftrightarrow{AB}$ **is the intersection of** " + PN("P") + " and " + PN("Q") + "." },
              { say: "Points $A$ and $B$ **lie in both** " + PN("P") + " and " + PN("Q") + "." },
              { say: "Planes " + PN("P") + " and " + PN("Q") + " both **contain** $\\overleftrightarrow{AB}$." }] },
            gate: true },
          { type: "choice", prompt: "Which picture shows line $m$ intersecting plane " + PN("R") + " at point $R$?", skill: "Lines and planes in space",
            options: [{ t: pierceFig({ u: 22, plane: "ℛ", at: "R", line: "m" }) },
                      { t: plain([0, 7.6], [-0.9, 5], [{ plane: sheet(0.5, 0.5, 5.2, 2.5, 1.8), name: "ℛ" }, { dline: [[1.1, 1.3], [6.4, 2.3]] }, { pt: [3.4, 1.74], name: "R", at: "s" }, { word: "m", at: [6.2, 2.75], name: true }], { u: 22, alt: "A line lying in the plane, through R." }),
                        fb: "That line lies **in** the plane: it shares every one of its points with it, not just $R$." },
                      { t: plain([0, 7.6], [-0.9, 5], [{ plane: sheet(0.5, 0.5, 5.2, 2.5, 1.8), name: "ℛ" }, { dline: [[1.0, 4.1], [6.6, 4.3]] }, { pt: [3.4, 1.8], name: "R", at: "e" }, { word: "m", at: [6.4, 4.7], name: true }], { u: 22, alt: "A line above the plane, not touching it, and a point R in the plane." }),
                        fb: "That line passes above the plane and never meets it." }],
            answer: 0,
            why: "Line $m$ passes through the plane, and $R$ is the one point they share." },
          { type: "sort", prompt: "Real things **model** points, lines and planes. Sort each one by what it models best.",
            bins: ["A point", "A line", "A plane"],
            cards: [{ t: "The tip of a pencil", bin: 0, fb: "A tip marks one spot." }, { t: "A knot in a string", bin: 0, fb: "A knot is one spot along the string." },
                    { t: "A tightly stretched wire", bin: 1, fb: "Long, straight and thin." }, { t: "The crease in a folded page", bin: 1, fb: "A straight crease: long and thin." },
                    { t: "A tabletop", bin: 2, fb: "Flat, spreading out both ways." }, { t: "A ceiling", bin: 2, fb: "A flat surface." }],
            skill: "Lines and planes in space",
            why: "Spots are points, long thin straight things are lines, flat surfaces are planes — each only a model, since the real ones have no size or thickness." },
          { type: "num", kicker: "Puzzle", prompt: "Four lines lie in one plane. What is the **greatest** number of points where they can cross?", skill: "Lines and planes in space",
            answer: 6, label: "Crossing points",
            near: [{ v: 4, fb: "Draw it: four lines in general position cross more than four times. Each line can cross each of the other three." },
                   { v: 12, fb: "That counts every crossing twice — line 1 meeting line 2 is the same point as line 2 meeting line 1." }],
            hints: ["The most crossings come when every pair of lines crosses, and no three meet at the same point.", "How many pairs can you make from four lines? List them: 1&2, 1&3, …"],
            why: "Every pair of lines crosses once: 1&2, 1&3, 1&4, 2&3, 2&4, 3&4 — six points. " +
              plain([0, 6], [0, 4], [{ dline: [[0.3, 0.6], [5.7, 1.5]] }, { dline: [[0.4, 3.5], [5.6, 2.4]] }, { dline: [[1.2, 0.2], [2.9, 3.9]] }, { dline: [[4.8, 0.2], [3.1, 3.9]] }], { u: 30, w: 220, alt: "Four lines crossing in six different points." }) },
          recap([
            { say: "**Space** holds every point, line and plane. In drawings, planes are slanted sheets and hidden parts are dashed." },
            { say: "Two lines meet in a **point**. A line meets a plane it isn't in at a **point**. Two planes meet in a **line** — or, if parallel, never." },
            { say: "Four points are coplanar when one plane holds them all — it doesn't have to be a face you can see." }],
            FS([crossFig({ u: 22 }), pierceFig({ u: 20 }), twoPlanesFig({ u: 20 })]))
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Measuring segments", v: 3,
        blurb: "A segment has a length you can measure. Reading a ruler in centimetres and in inches — and why no measurement is exact.",
        mins: 12,
        steps: [
          { type: "learn", kicker: "Picture it",
            prompt: "Egyptian builders measured in **cubits**: the length of a forearm, elbow to fingertips. <br><br>But whose forearm? A tall builder's cubit and a short one's would give the same wall two different lengths. So they cut one standard cubit rod and copied it. Every ruler since is a copy of an agreed length.",
            art: GT.ruler({ unit: "cm", div: 10, len: 7, alt: "A centimetre ruler with millimetre marks." }) },
          { type: "learn", kicker: "A piece of a line",
            prompt: "A line goes on forever, so it has no length. A piece of one does.",
            scene: { type: "walk", rows: [
              { m: "\\overline{AB}", fig: plain([0, 6], [0, 2], [{ seg: [[1, 1], [5, 1]], c: "blue" }, { pt: [1, 1], name: "A", at: "s", c: "blue" }, { pt: [5, 1], name: "B", at: "s", c: "blue" }], { u: 40, alt: "A segment from A to B." }),
                say: "A **segment** is two points on a line — its **endpoints** — and every point between them. Name it $\\overline{AB}$ or $\\overline{BA}$: the bar is a tiny picture of it." },
              { m: "AB = 4 \\text{ cm}", say: "Its length is its **measure**, written $AB$ with **no bar**. $\\overline{AB}$ is the segment itself; $AB$ is a number." },
              { say: "A measure always has a unit: 4 cm, 4 in., 4 m. Four what? The unit answers that." }] },
            gate: true },
          { type: "choice", prompt: "What does $AB$ — with no bar — stand for?", skill: "Measuring segments",
            options: [{ t: "The length of segment $\\overline{AB}$, a number" },
                      { t: "The segment from $A$ to $B$", fb: "The segment itself is written with a bar, $\\overline{AB}$. Without the bar it's the segment's length." },
                      { t: "The line through $A$ and $B$", fb: "A line is $\\overleftrightarrow{AB}$, with arrows. And a line has no length." }],
            answer: 0,
            why: "$\\overline{AB}$ is the segment; $AB$ is its length, like $AB = 4$ cm." },
          { type: "learn", kicker: "Try it",
            prompt: "This ruler has only **centimetre** marks. **Drag** $B$ along it and read $AB$.",
            scene: { type: "sketch", ruler: { unit: "cm", div: 1, len: 6 }, gate: true,
              pts: { B: { at: [3.3, 0], drag: true, snap: 0.1, on: { seg: [[0.6, 0], [5.9, 0]] }, say: "Point B" } },
              draw: function (s) { return [{ rseg: [0, s.B[0]], names: ["A", "B"] }]; },
              readout: function (s) { return "To the nearest centimetre, $AB \\approx " + Math.round(s.B[0]) + "$ cm"; } },
            gate: true,
            then: "With only centimetre marks, all you can say is which centimetre the end is nearest to." },
          { type: "learn", kicker: "Finer marks",
            prompt: "Now the same ruler with **millimetre** marks: 10 to every centimetre. **Drag** $B$ again.",
            scene: { type: "sketch", ruler: { unit: "cm", div: 10, len: 6 }, gate: true,
              pts: { B: { at: [3.3, 0], drag: true, snap: 0.1, on: { seg: [[0.6, 0], [5.9, 0]] }, say: "Point B" } },
              draw: function (s) { return [{ rseg: [0, s.B[0]], names: ["A", "B"] }]; },
              readout: function (s) { var v = Math.round(s.B[0] * 10); return "$AB \\approx " + num(v / 10) + "$ cm, or $" + v + "$ mm"; } },
            gate: true,
            then: "Finer marks, a finer answer: to the nearest millimetre now." },
          { type: "num", prompt: "How long is $\\overline{CD}$? Give your answer in millimetres.", skill: "Measuring segments",
            art: GT.ruler({ unit: "cm", div: 10, len: 5, seg: [0, 2.7], names: ["C", "D"], alt: "A centimetre ruler; the segment ends 7 small marks past 2." }),
            answer: 27, post: "mm", label: "CD",
            near: [{ v: 2.7, fb: "That's the length in centimetres. Each centimetre is 10 millimetres." }, { v: 3, fb: "That's the nearest centimetre. With millimetre marks you can do better: count the small marks past 2." }],
            hints: ["The end is past the 2 cm mark. Count the small marks after it.", "2 cm is 20 mm, and then 7 more millimetres."],
            why: "2 cm and 7 mm: $20 + 7 = 27$ mm." },
          { type: "learn", kicker: "Inches",
            prompt: "An inch ruler cuts each inch in half, then in half again, and again. The longer the mark, the bigger the piece it marks.",
            scene: { type: "walk", rows: [
              { m: "1\\frac{3}{4} \\text{ in.}", fig: GT.ruler({ unit: "in", div: 4, len: 3, seg: [0, 1.75], names: ["A", "B"], w: 400, alt: "An inch ruler in quarters; the segment ends at one and three quarters." }),
                say: "Here each inch is cut into **quarters**. The end is 3 quarter-marks past 1: $1\\frac{3}{4}$ in." },
              { m: "1\\frac{5}{8} \\text{ in.}", fig: GT.ruler({ unit: "in", div: 8, len: 3, seg: [0, 1.625], names: ["A", "B"], w: 400, alt: "An inch ruler in eighths; the segment ends at one and five eighths." }),
                say: "Now in **eighths**: count the spaces from 1 — five of them. $1\\frac{5}{8}$ in." },
              { m: "1\\frac{9}{16} \\text{ in.}", fig: GT.ruler({ unit: "in", div: 16, len: 3, seg: [0, 1.5625], names: ["A", "B"], w: 400, alt: "An inch ruler in sixteenths; the segment ends at one and nine sixteenths." }),
                say: "In **sixteenths**, the shortest marks: nine spaces past 1. $1\\frac{9}{16}$ in." }] },
            gate: true,
            then: "Always count **spaces** from the last whole inch, and check what each space is worth first." },
          { type: "choice", prompt: "How long is $\\overline{PQ}$?", skill: "Measuring segments",
            art: GT.ruler({ unit: "in", div: 8, len: 3, seg: [0, 2.375], names: ["P", "Q"], alt: "An inch ruler in eighths; the segment ends three eighths past 2." }),
            options: [{ t: "$2\\frac{3}{8}$ in." }, { t: "$2\\frac{3}{16}$ in.", fb: "This ruler is cut into eighths, not sixteenths: count the spaces between 0 and 1." },
                      { t: "$2\\frac{1}{2}$ in.", fb: "Close — but the end is one mark short of the half-inch mark." }, { t: "$3\\frac{3}{8}$ in.", fb: "The end is past 2, not past 3." }],
            answer: 0,
            hints: ["How many spaces are there between 0 and 1? That tells you what each one is worth.", "Count the spaces past 2."],
            why: "Each inch is cut into eighths, and the end is 3 of them past 2: $2\\frac{3}{8}$ in." },
          { type: "learn", kicker: "No measurement is exact",
            prompt: "A ruler can only say which mark an end is **nearest** to. So a measurement is precise to within **half** of the smallest mark.",
            scene: { type: "walk", rows: [
              { m: "3 \\text{ cm}", say: "Read to the nearest centimetre, **3 cm** really means somewhere from $2.5$ to $3.5$ cm — within half a centimetre." },
              { m: "28 \\text{ mm}", say: "Read to the nearest millimetre, **28 mm** means from $27.5$ to $28.5$ mm." },
              { m: "28.0 \\text{ cm}", say: "So **28 cm** and **28.0 cm** are different claims. The $.0$ says the ruler had millimetre marks: within $0.05$ cm, not $0.5$." },
              { m: "2\\frac{2}{4} \\text{ in.}", say: "Inches the same way, but read the fraction **before** you simplify it: $2\\frac{2}{4}$ in. came from a ruler in quarters, so it's precise to within half a quarter, $\\frac{1}{8}$ in." }] },
            gate: true },
          { type: "choice", prompt: "Leah measures a pencil as **14.3 cm**. What could its actual length be?", skill: "Precision and error",
            options: [{ t: "Between $14.25$ and $14.35$ cm" },
                      { t: "Between $13.8$ and $14.8$ cm", fb: "The $.3$ means she read it to the nearest **tenth** of a centimetre (a millimetre). Half of that is $0.05$ cm." },
                      { t: "Between $14.2$ and $14.4$ cm", fb: "That's a whole millimetre either side. Precision is **half** the smallest unit: $0.05$ cm." },
                      { t: "Exactly $14.3$ cm", fb: "No ruler gives an exact length — only the nearest mark." }],
            answer: 0,
            hints: ["The smallest unit in $14.3$ is a tenth of a centimetre.", "Go half of $0.1$ either way."],
            why: "It was read to the nearest $0.1$ cm, so it's within $0.05$ cm: from $14.25$ to $14.35$ cm." },
          { type: "learn", kicker: "How much does it matter?",
            prompt: "Being off by half a centimetre matters a lot on a short pencil and hardly at all on a long table.",
            scene: { type: "walk", rows: [
              { m: "0.5 \\text{ cm}", say: "The most a centimetre reading can be off is its **absolute error**: $0.5$ cm, whatever you measure." },
              { m: "\\frac{0.5}{4} = 0.125 = 12.5\\%", say: "On a 4 cm pencil stub, that's $\\frac{0.5}{4}$ of the whole: a **relative error** of $12.5\\%$." },
              { m: "\\frac{0.5}{200} = 0.0025 = 0.25\\%", say: "On a 200 cm table it's $\\frac{0.5}{200}$: only $0.25\\%$. Same slip, far less trouble." }] },
            gate: true,
            then: "**Relative error** = absolute error ÷ measurement, usually written as a percent." },
          { type: "num", prompt: "A board is measured as $25$ cm, to the nearest centimetre. What is the relative error, as a percent?", skill: "Precision and error",
            answer: 2, post: "%", label: "Relative error",
            near: [{ v: 0.5, fb: "That's the absolute error. Divide it by the length, 25 cm." }, { v: 0.02, fb: "That's right as a decimal. Multiply by 100 for a percent." }],
            hints: ["The absolute error is half a centimetre: $0.5$ cm.", "$0.5 \\div 25 = 0.02$. Now make it a percent."],
            why: "$\\frac{0.5}{25} = 0.02 = 2\\%$." },
          recap([
            { m: "\\overline{AB}", say: "A **segment**: two endpoints and every point between. $\\overline{AB}$ is the segment; $AB$ is its length." },
            { say: "To read a ruler, find what each space is worth, then count spaces from the last whole unit." },
            { say: "A measurement is precise to within **half** its smallest unit: 3 cm means 2.5 to 3.5 cm." },
            { m: "\\text{relative error} = \\frac{\\text{absolute error}}{\\text{measurement}}", say: "Relative error says how much that slip matters." }],
            GT.ruler({ unit: "in", div: 8, len: 3, seg: [0, 1.625], names: ["A", "B"], w: 360, alt: "An inch ruler in eighths." }))
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Adding segments, and congruent segments", v: 3,
        blurb: "The parts of a segment add up to the whole — even in algebra. Segments that match, the marks that say so, and copying one with a compass.",
        mins: 12,
        steps: [
          drawn("geo1-precision", 1, { kicker: "Remember?" }),
          { type: "learn", kicker: "Try it",
            prompt: "$P$ and $Q$ are fixed. **Drag** $M$ anywhere — on the segment and off it — and compare $PM + MQ$ with $PQ$.",
            scene: { type: "sketch", x: [-0.8, 8.8], y: [-1.6, 3.6], grid: false, u: 50, gate: true,
              pts: { M: { at: [3, 2.5], drag: true, snap: 0.5, say: "Point M" } },
              draw: function (s) {
                var P = [0, 0], Q = [8, 0], M = s.M, pm = GT.dist(P, M), mq = GT.dist(M, Q);
                return [{ seg: [P, Q], c: "soft" }, { seg: [P, M], c: "blue" }, { seg: [M, Q], c: "orange" },
                  { len: (Math.abs(pm - Math.round(pm)) < 1e-9 ? "" : "≈ ") + num(r1(pm)), seg: [P, M], side: M[1] >= 0 ? 1 : -1, c: "blue" },
                  { len: (Math.abs(mq - Math.round(mq)) < 1e-9 ? "" : "≈ ") + num(r1(mq)), seg: [M, Q], side: M[1] >= 0 ? 1 : -1, c: "orange" },
                  { word: "PQ = 8", at: [4, -0.9], eq: true, c: "soft" },
                  { pt: P, name: "P", at: "w" }, { pt: Q, name: "Q", at: "e" }, { pt: M, name: "M", at: M[1] >= 0 ? "n" : "s" }];
              },
              readout: function (s) {
                var pm = GT.dist([0, 0], s.M), mq = GT.dist(s.M, [8, 0]), sum = pm + mq, on = Math.abs(s.M[1]) < 1e-9 && s.M[0] >= 0 && s.M[0] <= 8;
                return "$PM + MQ " + (on ? "=" : "\\approx") + " " + num(r1(sum)) + "$" + (on ? " — exactly $PQ$: $M$ is **between** $P$ and $Q$" : " — more than $PQ = 8$");
              } },
            gate: true,
            then: "Only when $M$ is **on** the segment do the two parts add up to the whole. Anywhere else, the trip through $M$ is a detour." },
          { type: "learn", kicker: "Between",
            prompt: "Point $M$ is **between** $P$ and $Q$ exactly when all three are collinear **and** $PM + MQ = PQ$.",
            art: segRow([["P", 0], ["M", 2.2], ["Q", 5.2]], { over: [[0, 1, "PM"], [1, 2, "MQ"]], under: [[0, 2, "PQ"]], alt: "P, M and Q on a segment; the two parts add to the whole." }),
            after: "That's how you find a missing length: the parts add up to the whole, so the whole minus one part is the other." },
          { type: "num", prompt: "$B$ is between $A$ and $C$. Find $BC$.", skill: "Adding segments",
            art: segRow([["A", 0], ["B", 3.6], ["C", 5.2]], { over: [[0, 1, "9.4 cm"], [1, 2, "?"]], under: [[0, 2, "13.1 cm"]], alt: "AB is 9.4 cm and AC is 13.1 cm." }),
            answer: 3.7, post: "cm", label: "BC",
            near: [{ v: 22.5, fb: "That adds the whole to a part. $BC$ is the whole **minus** the other part." }],
            hints: ["$AB + BC = AC$, so $BC = AC - AB$."],
            why: "$BC = 13.1 - 9.4 = 3.7$ cm." },
          { type: "learn", kicker: "Watch",
            prompt: "The same rule works when the lengths are written with a variable.",
            scene: { type: "walk", rows: [
              { m: "QP + PR = QR", fig: segRow([["Q", 0], ["P", 2.8], ["R", 5.2]], { over: [[0, 1, "3y"], [1, 2, "20"]], under: [[0, 2, "5y - 4"]], alt: "P is between Q and R: QP is 3y, PR is 20, QR is 5y minus 4." }),
                say: "$P$ is between $Q$ and $R$, with $QP = 3y$, $PR = 20$ and $QR = 5y - 4$. Draw it, write each length on its piece — the parts add up to the whole." },
              { m: "3y + 20 = 5y - 4", say: "Put in the expressions." },
              { m: "24 = 2y", say: "Take $3y$ from both sides, and add 4 to both." },
              { m: "y = 12", say: "Divide by 2." },
              { m: "QP = 3(12) = 36", say: "The question wanted $QP$, not $y$: put $y = 12$ back in. Check: $36 + 20 = 56$, and $5(12) - 4 = 56$. ✓" }] },
            gate: true },
          { type: "num", prompt: "$L$ is between $K$ and $M$. $KL = 2x + 3$, $LM = 4x - 1$ and $KM = 38$. Find $LM$.", skill: "Adding segments",
            art: segRow([["K", 0], ["L", 2.2], ["M", 5.2]], { over: [[0, 1, "2x + 3"], [1, 2, "4x - 1"]], under: [[0, 2, "38"]], alt: "KL is 2x + 3, LM is 4x − 1, KM is 38." }),
            answer: 23, label: "LM",
            near: [{ v: 6, fb: "That's $x$. The question asks for $LM = 4x - 1$." }, { v: 15, fb: "That's $KL$. The question asks for $LM$." }],
            hints: ["$KL + LM = KM$: $(2x + 3) + (4x - 1) = 38$.", "$6x + 2 = 38$, so $x = 6$.", "Now $LM = 4(6) - 1$."],
            why: "$6x + 2 = 38$ gives $x = 6$, so $LM = 4(6) - 1 = 23$." },
          { type: "learn", kicker: "Same length",
            prompt: "Segments with the same length are **congruent**. The sign is $\\cong$, read \"is congruent to.\"",
            art: plain([0, 6], [-1, 5], [{ seg: [[3, 4.2], [4.7, 2.9]], marks: 1 }, { seg: [[3, 4.2], [1.3, 2.9]], marks: 1 }, { seg: [[3, -0.4], [4.7, 2.9]], marks: 2 }, { seg: [[3, -0.4], [1.3, 2.9]], marks: 2 },
              { pt: [3, 4.2], name: "A", at: "n" }, { pt: [4.7, 2.9], name: "B", at: "e" }, { pt: [3, -0.4], name: "C", at: "s" }, { pt: [1.3, 2.9], name: "D", at: "w" }],
              { u: 38, cap: "$\\overline{AB} \\cong \\overline{AD}$ (one tick each) and $\\overline{CB} \\cong \\overline{CD}$ (two ticks each)", alt: "A kite with tick marks: AB and AD one tick each, CB and CD two ticks each." }),
            after: "In a drawing, **tick marks** say it: sides with the same number of ticks are congruent. Lengths are equal ($AB = AD$); the segments are congruent ($\\overline{AB} \\cong \\overline{AD}$)." },
          { type: "multi", prompt: "In this figure, which statements are true? Choose every one.", skill: "Congruent segments",
            art: segRow([["W", 0], ["X", 1.75], ["Y", 3.5], ["Z", 5.2]], { ticks: [[0, 1, 1], [1, 2, 1], [2, 3, 2]], alt: "W, X, Y and Z on a segment: WX and XY carry one tick each; YZ carries two." }),
            options: [{ t: "$\\overline{WX} \\cong \\overline{XY}$", ok: true },
                      { t: "$X$ is between $W$ and $Y$", ok: true },
                      { t: "$\\overline{XY} \\cong \\overline{YZ}$", ok: false, fb: "$\\overline{XY}$ has one tick and $\\overline{YZ}$ has two: nothing says they match." },
                      { t: "$\\overline{WX} = \\overline{XY}$", ok: false, fb: "Careful with the symbols: **lengths** are equal ($WX = XY$), **segments** are congruent ($\\overline{WX} \\cong \\overline{XY}$)." }],
            hints: ["Match tick marks. And remember: $=$ goes between numbers, $\\cong$ between figures."],
            why: "One tick each on $\\overline{WX}$ and $\\overline{XY}$: congruent. $X$ lies on the segment between $W$ and $Y$. $\\overline{YZ}$ has different marks, and segments are congruent, not equal." },
          { type: "learn", kicker: "Copy a segment",
            prompt: "A **construction** draws a figure with only a straightedge and a compass — no ruler numbers. Here's how to copy a segment.",
            scene: { type: "walk", rows: [
              { fig: plain([0, 8], [-1, 3.4], [{ seg: [[0.6, 2.4], [3.4, 2.4]], c: "blue" }, { pt: [0.6, 2.4], name: "X", at: "n", c: "blue" }, { pt: [3.4, 2.4], name: "Y", at: "n", c: "blue" },
                  { dline: [[0.6, 0.2], [7.4, 0.2]] }, { pt: [1.4, 0.2], name: "P", at: "s" }], { u: 40, alt: "Segment XY above, and below it a line with point P." }),
                say: "Here's $\\overline{XY}$. Draw a line somewhere else, and mark a point $P$ on it." },
              { fig: plain([0, 8], [-1, 3.4], [{ seg: [[0.6, 2.4], [3.4, 2.4]], c: "blue" }, { arc: [[0.6, 2.4], 2.8, -18, 18] }, { pt: [0.6, 2.4], name: "X", at: "n", c: "blue" }, { pt: [3.4, 2.4], name: "Y", at: "n", c: "blue" },
                  { dline: [[0.6, 0.2], [7.4, 0.2]] }, { pt: [1.4, 0.2], name: "P", at: "s" }], { u: 40, alt: "The compass point on X, opened so the pencil touches Y." }),
                say: "Put the compass point on $X$ and open it until the pencil touches $Y$. The compass now **holds** the length $XY$." },
              { fig: plain([0, 8], [-1, 3.4], [{ seg: [[0.6, 2.4], [3.4, 2.4]], c: "blue" }, { pt: [0.6, 2.4], name: "X", at: "n", c: "blue" }, { pt: [3.4, 2.4], name: "Y", at: "n", c: "blue" },
                  { dline: [[0.6, 0.2], [7.4, 0.2]] }, { arc: [[1.4, 0.2], 2.8, -20, 20] }, { pt: [1.4, 0.2], name: "P", at: "s" }, { pt: [4.2, 0.2], name: "Q", at: "s", c: "blue" }], { u: 40, alt: "With the same opening, an arc from P crosses the line at Q." }),
                say: "Without changing it, put the point on $P$ and swing an arc across the line. Call the crossing $Q$." },
              { m: "\\overline{PQ} \\cong \\overline{XY}", fig: plain([0, 8], [-1, 3.4], [{ seg: [[0.6, 2.4], [3.4, 2.4]], c: "blue", marks: 1 }, { pt: [0.6, 2.4], name: "X", at: "n", c: "blue" }, { pt: [3.4, 2.4], name: "Y", at: "n", c: "blue" },
                  { dline: [[0.6, 0.2], [7.4, 0.2]] }, { seg: [[1.4, 0.2], [4.2, 0.2]], c: "blue", marks: 1 }, { pt: [1.4, 0.2], name: "P", at: "s" }, { pt: [4.2, 0.2], name: "Q", at: "s", c: "blue" }], { u: 40, alt: "PQ is the same length as XY, marked with one tick each." }),
                say: "$\\overline{PQ} \\cong \\overline{XY}$ — the compass carried the length across without anyone reading a number." }] },
            gate: true },
          { type: "order", prompt: "Put the steps for copying $\\overline{XY}$ onto a line at point $P$ in order.", skill: "Congruent segments",
            items: ["Draw a line and mark a point P on it", "Put the compass point on X and open it to Y", "Keeping that opening, put the compass point on P", "Swing an arc to cross the line, and call the crossing Q"],
            nudge: "What must the compass hold before you can carry it anywhere?",
            why: "Set up the line, take the length $XY$ into the compass, carry it to $P$, and mark it off. $\\overline{PQ} \\cong \\overline{XY}$." },
          recap([
            { m: "PM + MQ = PQ", say: "$M$ is **between** $P$ and $Q$ when they're collinear and the parts add up to the whole — numbers or algebra." },
            { m: "\\overline{AB} \\cong \\overline{CD}", say: "**Congruent** segments have equal lengths, $AB = CD$. Matching tick marks say so in a figure." },
            { say: "A compass carries a length from one place to another: that's how to copy a segment." }],
            segRow([["P", 0], ["M", 2.2], ["Q", 5.2]], { over: [[0, 1, "PM"], [1, 2, "MQ"]], under: [[0, 2, "PQ"]], w: 320 }))
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Distance", v: 3,
        blurb: "How far apart two points are: on a number line by subtracting, in the plane with the Pythagorean theorem — which is all the distance formula is.",
        mins: 12,
        steps: [
          drawn("geo1-segadd", 2, { kicker: "Remember?" }),
          { type: "learn", kicker: "Try it",
            prompt: "On a number line, how far apart are two points? **Drag** them and watch.",
            scene: { type: "numberline", min: -8, max: 8, points: [{ v: -5, drag: true, label: "C" }, { v: 1, drag: true, label: "D" }], distance: [0, 1] },
            gate: true,
            then: "The distance is the gap between the coordinates: subtract, and ignore any minus sign. $CD = |a - b|$, and $|b - a|$ is the same." },
          { type: "num", prompt: "Find $JM$.", skill: "Distance on a number line",
            art: numLine(-6, 8, [{ v: -4, name: "J" }, { v: 7, name: "M" }]),
            answer: 11, label: "JM",
            near: [{ v: 3, fb: "$-4$ is below zero, so the gap crosses zero: $7 - (-4) = 7 + 4$." }],
            hints: ["$JM = |7 - (-4)|$.", "Subtracting a negative adds: $7 + 4$."],
            why: "$|7 - (-4)| = |11| = 11$ — count the units from $-4$ to $7$ to check." },
          { type: "learn", kicker: "Remember Pythagoras?",
            prompt: "Off the number line, points aren't lined up — but a right triangle gets you there. First, the fact it rests on.",
            scene: { type: "walk", rows: [
              { fig: grid([-3.5, 7.5], [-4.5, 7.5], [{ poly: [[0, 0], [4, 0], [0, 3]], c: "blue" }, { angle: [[4, 0], [0, 0], [0, 3]], right: true }, { len: "4", seg: [[0, 0], [4, 0]], side: 1, off: 12 }, { len: "3", seg: [[0, 0], [0, 3]], side: -1, off: 12 }],
                  { u: 22, axes: false, alt: "A right triangle with legs 4 and 3." }),
                say: "A right triangle with legs 3 and 4." },
              { fig: grid([-3.5, 7.5], [-4.5, 7.5], [{ poly: [[0, 0], [4, 0], [4, -4], [0, -4]], c: "orange" }, { poly: [[0, 0], [0, 3], [-3, 3], [-3, 0]], c: "orange" }, { poly: [[0, 0], [4, 0], [0, 3]], c: "blue" },
                  { word: "16", at: [2, -2] }, { word: "9", at: [-1.5, 1.5] }], { u: 22, axes: false, alt: "Squares on the two legs, of 9 and 16 grid squares." }),
                say: "Build a square on each leg. They cover $3^2 = 9$ and $4^2 = 16$ grid squares." },
              { m: "3^2 + 4^2 = 5^2", fig: grid([-3.5, 7.5], [-4.5, 7.5], [{ poly: [[0, 0], [4, 0], [4, -4], [0, -4]], c: "orange" }, { poly: [[0, 0], [0, 3], [-3, 3], [-3, 0]], c: "orange" }, { poly: [[4, 0], [0, 3], [3, 7], [7, 4]], c: "green" },
                  { poly: [[0, 0], [4, 0], [0, 3]], c: "blue" }, { word: "16", at: [2, -2] }, { word: "9", at: [-1.5, 1.5] }, { word: "25", at: [3.5, 3.5] }], { u: 22, axes: false, alt: "A third square, on the long side, covers 25 grid squares: 9 + 16." }),
                say: "The square on the longest side, the **hypotenuse**, covers exactly $9 + 16 = 25$ — so that side is $\\sqrt{25} = 5$." },
              { m: "a^2 + b^2 = c^2", say: "Always, in every right triangle: the squares on the legs add up to the square on the hypotenuse. That's the **Pythagorean theorem** (you'll prove it later in the course)." }] },
            gate: true },
          { type: "learn", kicker: "Watch",
            prompt: "Now use it to find a distance on the coordinate plane.",
            scene: { type: "walk", rows: [
              { m: "A(-2, 1),\\; B(4, 5)", fig: grid([-3, 5], [0, 6], [{ seg: [[-2, 1], [4, 5]], c: "blue" }, { pt: [-2, 1], name: "A", at: "w" }, { pt: [4, 5], name: "B" }], { u: 26, alt: "A at (−2, 1) and B at (4, 5), joined." }),
                say: "How long is $\\overline{AB}$? It's slanted, so you can't just count squares." },
              { m: "6 \\text{ across},\\; 4 \\text{ up}", fig: grid([-3, 5], [0, 6], [{ seg: [[-2, 1], [4, 5]], c: "blue" }].concat(legs([-2, 1], [4, 5])).concat([{ pt: [-2, 1], name: "A", at: "w" }, { pt: [4, 5], name: "B" }]), { u: 26, alt: "A right triangle under AB: 6 across and 4 up." }),
                say: "Draw a right triangle under it. Its legs run along the grid: $4 - (-2) = 6$ across, $5 - 1 = 4$ up." },
              { m: "AB^2 = 6^2 + 4^2 = 52", say: "$\\overline{AB}$ is the hypotenuse." },
              { m: "AB = \\sqrt{52} \\approx 7.2", say: "Take the square root. Exactly $\\sqrt{52}$, about $7.2$ units." }] },
            gate: true },
          { type: "learn", kicker: "Try it",
            prompt: "**Drag** $A$ and $B$ anywhere. The legs of the triangle, and the distance, follow.",
            scene: { type: "plane", x: [-6, 6], y: [-5, 5], gate: true,
              points: [{ id: "A", x: -3, y: -2, drag: true, label: "A" }, { id: "B", x: 3, y: 2, drag: true, label: "B" }],
              lines: [{ through: ["A", "B"], slope: true, extend: false }],
              readout: function (st) {
                var a = st.pt("A"), b = st.pt("B"), dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y), s = dx * dx + dy * dy;
                return "$AB = \\sqrt{" + dx + "^2 + " + dy + "^2} = \\sqrt{" + s + "}" + (isSquare(s) ? " = " + Math.sqrt(s) : " \\approx " + num(r1(Math.sqrt(s)))) + "$";
              } },
            gate: true,
            then: "The legs are always the **differences** of the coordinates: across is $x_2 - x_1$, up is $y_2 - y_1$." },
          { type: "learn", kicker: "The formula",
            prompt: "Put the differences straight into the Pythagorean theorem and you have the **distance formula**.",
            art: grid([-1.5, 9], [-1, 5], [{ seg: [[0, 0], [6, 4]], c: "blue" }].concat(legs([0, 0], [6, 4]).slice(0, 2)).concat([
              { len: "x₂ − x₁", seg: [[0, 0], [6, 0]], side: 1, off: 14, c: "orange" }, { word: "y₂ − y₁", at: [6.3, 2], anchor: "start", c: "orange" },
              { pt: [0, 0], name: "(x₁, y₁)", at: "nw" }, { pt: [6, 4], name: "(x₂, y₂)", at: "nw" }]), { u: 30, axes: false, alt: "A segment from (x1, y1) to (x2, y2) with its legs marked as the differences." }),
            after: "$d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$ <br><br>Either point can be first: squaring makes any negative difference positive." },
          { type: "num", prompt: "Find the distance between $D(-3, 5)$ and $E(5, -1)$.", skill: "Distance in the coordinate plane",
            answer: 10, label: "DE",
            near: [{ v: 14, fb: "That's across plus up. Square each, add, then take the square root." }, { v: 100, fb: "That's $d^2$. Take its square root." }, { v: 2.8, tol: 0.1, fb: "Check $5 - (-3)$: subtracting a negative adds, so it's 8." }],
            hints: ["$x_2 - x_1 = 5 - (-3) = 8$ and $y_2 - y_1 = -1 - 5 = -6$.", "$d = \\sqrt{8^2 + (-6)^2} = \\sqrt{64 + 36}$."],
            why: "$d = \\sqrt{8^2 + (-6)^2} = \\sqrt{100} = 10$." },
          { type: "num", prompt: "Find the distance between $P(1, -2)$ and $Q(-4, 3)$. Round to the nearest tenth.", skill: "Distance in the coordinate plane",
            answer: 7.1, tol: 0.051, label: "PQ",
            near: [{ v: 10, fb: "Across plus up is 10, but the straight path is shorter. Square, add, square root." }, { v: 50, fb: "That's $d^2$. Take its square root." }],
            hints: ["Across: $-4 - 1 = -5$. Up: $3 - (-2) = 5$.", "$d = \\sqrt{25 + 25} = \\sqrt{50}$."],
            why: "$d = \\sqrt{(-5)^2 + 5^2} = \\sqrt{50} \\approx 7.1$." },
          { type: "choice", kicker: "Watch out", prompt: "Kai finds the distance from $(-3, 2)$ to $(5, 4)$ as $\\sqrt{(5 - 3)^2 + (4 - 2)^2} = \\sqrt{8}$. What went wrong?", skill: "Distance in the coordinate plane",
            options: [{ t: "$5 - (-3)$ is $8$, not $2$: he dropped the negative sign" },
                      { t: "He should have added the coordinates", fb: "Subtracting is right — the legs are differences. The slip is the sign of $-3$." },
                      { t: "Nothing — it's right", fb: "Check the first bracket: $x_1$ is $-3$, and $5 - (-3) = 8$." }],
            answer: 0,
            why: "The legs are $5 - (-3) = 8$ and $4 - 2 = 2$, so the distance is $\\sqrt{64 + 4} = \\sqrt{68} \\approx 8.2$." },
          recap([
            { m: "|a - b|", say: "On a number line: subtract the coordinates and drop the sign." },
            { m: "a^2 + b^2 = c^2", say: "In a right triangle, the squares on the legs add up to the square on the hypotenuse." },
            { m: "d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}", say: "In the plane: the legs are the differences of the coordinates, so the distance is the hypotenuse." }],
            grid([-3, 5], [0, 6], [{ seg: [[-2, 1], [4, 5]], c: "blue" }].concat(legs([-2, 1], [4, 5])).concat([{ pt: [-2, 1], name: "A", at: "w" }, { pt: [4, 5], name: "B" }]), { u: 22, w: 240, alt: "A segment and its right triangle." }))
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Midpoints and bisectors", v: 3,
        blurb: "The point halfway along a segment: average the ends, work backwards to a missing end, solve for it with algebra — and find it with only a compass.",
        mins: 13,
        steps: [
          drawn("geo1-dist", 1, { kicker: "Remember?" }),
          { type: "learn", kicker: "Try it",
            prompt: "The **midpoint** of a segment cuts it into two congruent halves. **Drag** $A$ and $B$ and watch where the midpoint $M$ sits.",
            scene: { type: "sketch", x: [-6, 6], y: [-5, 5], u: 30, gate: true,
              pts: { A: { at: [-4, -3], drag: true, snap: 1, say: "Point A" }, B: { at: [4, 3], drag: true, snap: 1, say: "Point B" } },
              draw: function (s) {
                var M = [(s.A[0] + s.B[0]) / 2, (s.A[1] + s.B[1]) / 2];
                return [{ seg: [s.A, M], marks: 1, c: "blue" }, { seg: [M, s.B], marks: 1, c: "blue" }, { pt: s.A, name: "A" }, { pt: s.B, name: "B" }, { pt: M, name: "M", c: "orange", at: "se" }];
              },
              readout: function (s) {
                function f(a, b) { return "\\frac{" + a + " + " + (b < 0 ? "(" + b + ")" : b) + "}{2}"; }
                return "$M = \\left(" + f(s.A[0], s.B[0]) + ", " + f(s.A[1], s.B[1]) + "\\right) = (" + num((s.A[0] + s.B[0]) / 2) + ", " + num((s.A[1] + s.B[1]) / 2) + ")$";
              } },
            gate: true,
            then: "The midpoint's $x$ is the **average** of the two $x$'s, and its $y$ is the average of the two $y$'s." },
          { type: "learn", kicker: "On a number line",
            prompt: "On a number line the midpoint is the average of the two coordinates: $\\frac{a + b}{2}$.",
            art: numLine(-8, 16, [{ v: -6, name: "P" }, { v: 14, name: "Q" }, { v: 4, name: "M", c: "orange" }], { every: 2, alt: "P at −6, Q at 14 and their midpoint M at 4." }),
            after: "$\\frac{-6 + 14}{2} = \\frac{8}{2} = 4$. Check: from $-6$ to $4$ is 10, and from $4$ to $14$ is 10." },
          { type: "num", prompt: "Overnight the temperature fell from $17°$ to $-9°$. What temperature is halfway between?", skill: "Midpoints",
            answer: 4, post: "°", label: "Halfway",
            near: [{ v: 13, fb: "That's half the **drop**. Halfway **between** the readings is their average: $\\frac{17 + (-9)}{2}$." }, { v: 8, fb: "That's the sum. Halve it." }],
            hints: ["Average the two readings: add them and halve."],
            why: "$\\frac{17 + (-9)}{2} = \\frac{8}{2} = 4°$ — 13 degrees below 17, and 13 above $-9$." },
          { type: "learn", kicker: "Watch",
            prompt: "In the plane, average the $x$'s and average the $y$'s: the **midpoint formula**.",
            scene: { type: "walk", rows: [
              { m: "J(-3, 4),\\; K(5, -2)", fig: grid([-4, 6], [-3, 5], [{ seg: [[-3, 4], [5, -2]], c: "blue" }, { pt: [-3, 4], name: "J" }, { pt: [5, -2], name: "K" }], { u: 24, alt: "J at (−3, 4) and K at (5, −2)." }),
                say: "Find the midpoint of $\\overline{JK}$." },
              { m: "x = \\frac{-3 + 5}{2} = 1", say: "Average the $x$'s." },
              { m: "y = \\frac{4 + (-2)}{2} = 1", say: "Average the $y$'s." },
              { m: "M(1, 1)", fig: grid([-4, 6], [-3, 5], [{ seg: [[-3, 4], [1, 1]], c: "blue", marks: 1 }, { seg: [[1, 1], [5, -2]], c: "blue", marks: 1 }, { pt: [-3, 4], name: "J" }, { pt: [5, -2], name: "K" }, { pt: [1, 1], name: "M", c: "orange" }], { u: 24, alt: "The midpoint M at (1, 1), halfway along JK." }),
                say: "$M(1, 1)$ — 4 across and 3 down from $J$, and the same again to $K$." },
              { m: "M\\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)", say: "The formula, for any two endpoints." }] },
            gate: true },
          { type: "pair", prompt: "Find the midpoint of $\\overline{AB}$ for $A(-7, 3)$ and $B(1, 9)$.", skill: "Midpoints",
            answer: [-3, 6],
            near: [{ v: [-6, 12], fb: "That's the sums. Halve each one." }, { v: [4, 3], fb: "That's half of how far it goes. The midpoint is the **average** of the ends." }],
            hints: ["$x = \\frac{-7 + 1}{2}$ and $y = \\frac{3 + 9}{2}$."],
            why: "$\\left(\\frac{-6}{2}, \\frac{12}{2}\\right) = (-3, 6)$." },
          { type: "learn", kicker: "Backwards",
            prompt: "If you know one endpoint and the midpoint, you can find the other end: the midpoint is halfway, so go the same way again.",
            scene: { type: "walk", rows: [
              { m: "A(-3, 4),\\; M(2, -1)", fig: grid([-4, 8], [-7, 5], [{ pt: [-3, 4], name: "A" }, { pt: [2, -1], name: "M", c: "orange" }], { u: 20, alt: "A at (−3, 4) and the midpoint M at (2, −1)." }),
                say: "$M$ is the midpoint of $\\overline{AB}$. Where is $B$?" },
              { m: "5 \\text{ right},\\; 5 \\text{ down}", fig: grid([-4, 8], [-7, 5], [{ steps: [[-3, 4], [2, -1]] }, { pt: [-3, 4], name: "A" }, { pt: [2, -1], name: "M", c: "orange" }], { u: 20, alt: "From A to M: 5 right and 5 down." }),
                say: "From $A$ to $M$ is 5 right and 5 down." },
              { m: "B(7, -6)", fig: grid([-4, 8], [-7, 5], [{ steps: [[-3, 4], [2, -1]] }, { steps: [[2, -1], [7, -6]] }, { pt: [-3, 4], name: "A" }, { pt: [2, -1], name: "M", c: "orange" }, { pt: [7, -6], name: "B", c: "blue" }], { u: 20, alt: "The same move again from M lands on B at (7, −6)." }),
                say: "Do the same move again from $M$: $B(7, -6)$." },
              { m: "x_B = 2 \\cdot 2 - (-3) = 7", say: "Or with the formula: each coordinate of $B$ is twice the midpoint's minus $A$'s." }] },
            gate: true },
          { type: "pair", prompt: "$M(3, -2)$ is the midpoint of $\\overline{PQ}$, and $P(-1, 5)$. Find $Q$.", skill: "Finding an endpoint",
            answer: [7, -9],
            near: [{ v: [1, 1.5], fb: "That's the midpoint of $P$ and $M$. $Q$ is on the **far** side of $M$." }, { v: [4, -7], fb: "That's the move from $P$ to $M$. Now make that move again, starting at $M$." }],
            hints: ["From $P$ to $M$: 4 right and 7 down.", "Do it again from $M(3, -2)$."],
            why: "4 right and 7 down from $M(3, -2)$ is $Q(7, -9)$. Check: $\\frac{-1 + 7}{2} = 3$ and $\\frac{5 + (-9)}{2} = -2$. ✓" },
          { type: "learn", kicker: "With algebra",
            prompt: "A midpoint makes two equal halves, so two expressions for the halves must be equal.",
            scene: { type: "walk", rows: [
              { m: "AB = BC", fig: segRow([["A", 0], ["B", 2.6], ["C", 5.2]], { over: [[0, 1, "4x - 5"], [1, 2, "2x + 13"]], ticks: [[0, 1, 1], [1, 2, 1]] }),
                say: "$B$ is the midpoint of $\\overline{AC}$, with $AB = 4x - 5$ and $BC = 2x + 13$." },
              { m: "4x - 5 = 2x + 13", say: "The halves are equal." },
              { m: "2x = 18,\\; x = 9", say: "Take $2x$ from both sides and add 5; then divide by 2." },
              { m: "BC = 2(9) + 13 = 31", say: "Put $x$ back in. Check: $AB = 4(9) - 5 = 31$ too. ✓" }] },
            gate: true },
          { type: "num", prompt: "$Y$ is the midpoint of $\\overline{XZ}$, with $XY = 3x + 7$ and $YZ = 5x - 11$. Find $XZ$.", skill: "Midpoints and bisectors with algebra",
            art: segRow([["X", 0], ["Y", 2.6], ["Z", 5.2]], { over: [[0, 1, "3x + 7"], [1, 2, "5x - 11"]], ticks: [[0, 1, 1], [1, 2, 1]] }),
            answer: 68, label: "XZ",
            near: [{ v: 9, fb: "That's $x$. Put it back in to get a length." }, { v: 34, fb: "That's one half. $XZ$ is both halves." }],
            hints: ["$3x + 7 = 5x - 11$.", "$x = 9$, so each half is $3(9) + 7 = 34$."],
            why: "$3x + 7 = 5x - 11$ gives $x = 9$; each half is $34$, so $XZ = 68$." },
          { type: "learn", kicker: "Bisect it with a compass",
            prompt: "Anything that passes through a segment's midpoint — a point, segment, ray, line or plane — is a **segment bisector**. Here's how to draw one with no ruler at all.",
            scene: { type: "walk", rows: [
              { fig: plain([0, 7], [-1.6, 4.6], [{ seg: [[1, 1.5], [6, 1.5]], c: "blue" }, { pt: [1, 1.5], name: "X", at: "w", c: "blue" }, { pt: [6, 1.5], name: "Y", at: "e", c: "blue" },
                  { arc: [[1, 1.5], 3.2, 22, 56] }, { arc: [[1, 1.5], 3.2, -56, -22] }], { u: 38, alt: "Segment XY, with two arcs drawn from X, above and below." }),
                say: "Open the compass to **more than half** of $XY$. With the point on $X$, draw arcs above and below the segment." },
              { fig: plain([0, 7], [-1.6, 4.6], [{ seg: [[1, 1.5], [6, 1.5]], c: "blue" }, { pt: [1, 1.5], name: "X", at: "w", c: "blue" }, { pt: [6, 1.5], name: "Y", at: "e", c: "blue" },
                  { arc: [[1, 1.5], 3.2, 22, 56] }, { arc: [[1, 1.5], 3.2, -56, -22] }, { arc: [[6, 1.5], 3.2, 124, 158] }, { arc: [[6, 1.5], 3.2, 202, 236] },
                  { pt: [3.5, 3.5], name: "P", at: "n" }, { pt: [3.5, -0.5], name: "Q", at: "s" }], { u: 38, alt: "Two more arcs from Y cross the first ones at P above and Q below." }),
                say: "Keep the same opening. From $Y$, draw arcs that cross the first two. Call the crossings $P$ and $Q$." },
              { m: "XM = MY", fig: plain([0, 7], [-1.6, 4.6], [{ seg: [[1, 1.5], [3.5, 1.5]], c: "blue", marks: 1 }, { seg: [[3.5, 1.5], [6, 1.5]], c: "blue", marks: 1 }, { pt: [1, 1.5], name: "X", at: "w", c: "blue" }, { pt: [6, 1.5], name: "Y", at: "e", c: "blue" },
                  { arc: [[1, 1.5], 3.2, 22, 56] }, { arc: [[1, 1.5], 3.2, -56, -22] }, { arc: [[6, 1.5], 3.2, 124, 158] }, { arc: [[6, 1.5], 3.2, 202, 236] },
                  { dline: [[3.5, 4.3], [3.5, -1.3]], c: "orange" }, { pt: [3.5, 3.5], name: "P", at: "e" }, { pt: [3.5, -0.5], name: "Q", at: "e" }, { pt: [3.5, 1.5], name: "M", at: "se", c: "orange" }], { u: 38, alt: "The line PQ crosses XY at its midpoint M." }),
                say: "Draw $\\overleftrightarrow{PQ}$. Where it crosses the segment is the midpoint $M$: $\\overleftrightarrow{PQ}$ bisects $\\overline{XY}$." },
              { say: "Why it works: $P$ is the same distance from $X$ as from $Y$ (both arcs had the same opening), and so is $Q$. Points like that all lie on the line through the middle." }] },
            gate: true },
          { type: "choice", prompt: "To bisect $\\overline{AB}$ with a compass, what should the first step be?", skill: "Midpoints and bisectors with algebra",
            options: [{ t: "From $A$, draw arcs above and below $\\overline{AB}$ with the compass open to more than half of $AB$" },
                      { t: "From $A$, draw arcs with the compass open to less than half of $AB$", fb: "Then the arcs from $A$ and from $B$ never reach each other, so they can't cross." },
                      { t: "Measure $AB$ with a ruler and mark half", fb: "That works, but it isn't a construction: a construction uses only a compass and a straightedge." }],
            answer: 0,
            why: "Wider than half, so the arcs from the two ends overlap and cross above and below the segment." },
          recap([
            { m: "\\frac{a + b}{2}", say: "On a number line, the midpoint is the average of the ends." },
            { m: "M\\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)", say: "In the plane, average the $x$'s and the $y$'s." },
            { say: "Missing end: make the move from the known end to the midpoint once more. With algebra: the two halves are equal." },
            { say: "A **segment bisector** passes through the midpoint. Arcs of the same opening from both ends find it." }],
            grid([-4, 6], [-3, 5], [{ seg: [[-3, 4], [1, 1]], c: "blue", marks: 1 }, { seg: [[1, 1], [5, -2]], c: "blue", marks: 1 }, { pt: [-3, 4], name: "J" }, { pt: [5, -2], name: "K" }, { pt: [1, 1], name: "M", c: "orange" }], { u: 20, w: 240, alt: "A segment and its midpoint." }))
        ]
      },
      /* ============================================================== 7 */
      {
        title: "Angles and their measure", v: 3,
        blurb: "Rays, opposite rays and the angles they make; naming an angle; measuring it in degrees with a protractor; acute, right, obtuse.",
        mins: 13,
        steps: [
          drawn("geo1-mid", 3, { kicker: "Remember?" }),
          { type: "learn", kicker: "Rays",
            prompt: "Before angles, the pieces they're made of.",
            scene: { type: "walk", rows: [
              { m: "\\overrightarrow{EF}", fig: plain([0, 7], [0, 2], [{ dline: [[1, 1], [6.6, 1]], ray: true }, { pt: [1, 1], name: "E", at: "s" }, { pt: [3.2, 1], name: "F", at: "s" }, { pt: [5, 1], name: "G", at: "s" }], { u: 40, alt: "A ray starting at E, through F and G." }),
                say: "A **ray** is part of a line: one endpoint, then on forever one way. Name it by its endpoint **first**: $\\overrightarrow{EF}$ — or $\\overrightarrow{EG}$, the same ray. Never $\\overrightarrow{FE}$: that one starts at $F$." },
              { m: "\\overrightarrow{PQ},\\; \\overrightarrow{PR}", fig: plain([0, 7], [0, 2], [{ dline: [[3.5, 1], [0.4, 1]], ray: true, c: "blue" }, { dline: [[3.5, 1], [6.6, 1]], ray: true, c: "orange" }, { pt: [1.6, 1], name: "Q", at: "s" }, { pt: [3.5, 1], name: "P", at: "s" }, { pt: [5.4, 1], name: "R", at: "s" }], { u: 40, alt: "Point P splits a line into ray PQ going left and ray PR going right." }),
                say: "Any point on a line splits it into two rays pointing opposite ways: **opposite rays**, $\\overrightarrow{PQ}$ and $\\overrightarrow{PR}$." }] },
            gate: true },
          { type: "choice", prompt: "Which names this ray?", skill: "Naming angles",
            art: plain([0, 7], [0, 2], [{ dline: [[6, 1], [0.4, 1]], ray: true }, { pt: [6, 1], name: "K", at: "s" }, { pt: [4, 1], name: "L", at: "s" }, { pt: [2, 1], name: "M", at: "s" }], { u: 40, alt: "A ray starting at K on the right, through L and M, going left." }),
            options: [{ t: "$\\overrightarrow{KM}$" }, { t: "$\\overrightarrow{MK}$", fb: "That ray would start at $M$. This one starts at $K$ — the end without an arrow." },
                      { t: "$\\overrightarrow{LK}$", fb: "That one starts at $L$ and heads through $K$: it's a different ray." }],
            answer: 0,
            hints: ["Find the endpoint — the end with no arrow. Its letter goes first."],
            why: "The ray starts at $K$ and goes on through $L$ and $M$: $\\overrightarrow{KM}$ (or $\\overrightarrow{KL}$)." },
          { type: "learn", kicker: "Angles",
            prompt: "An **angle** is two rays with the same endpoint that don't lie on one line.",
            scene: { type: "walk", rows: [
              { fig: rayFig([0, 0], [{ d: 8, name: "C" }, { d: 70, name: "B" }], { vname: "A", wedges: [{ i: 0, j: 1 }], x: [-2.2, 3.6], y: [-1, 3.2], alt: "Angle A: rays from A through B and C." }),
                say: "The rays are its **sides**; their shared endpoint is its **vertex**. Name it $\\angle BAC$ or $\\angle CAB$ — vertex in the middle — or just $\\angle A$." },
              { fig: rayFig([0, 0], [{ d: 8, name: "X" }, { d: 62, name: "Y" }, { d: 130, name: "Z" }], { vname: "W", num: [{ i: 0, j: 1, t: "1" }, { i: 1, j: 2, t: "2" }], x: [-3, 3.6], y: [-1, 3.2], alt: "Three rays from W: angle 1 between X and Y, angle 2 between Y and Z." }),
                say: "An angle can also be named by a number written inside it: $\\angle 1$, $\\angle 2$. When several angles share a vertex, $\\angle W$ is no good — which one?" },
              { fig: rayFig([0, 0], [{ d: 15, name: "C" }, { d: 95, name: "B" }], { vname: "A", x: [-2.6, 3.6], y: [-1.4, 3.2],
                  pts: [{ pt: GT.polar([0, 0], 1.7, 55), name: "I", at: "n", c: "green" }, { pt: GT.polar([0, 0], 1.7, 210), name: "E", at: "n", c: "red" }, { pt: GT.polar([0, 0], 2.2, 15), name: "", c: "blue" }], alt: "An angle with a point I inside it and a point E outside." }),
                say: "An angle splits the plane into three parts: the **interior** (inside the opening, like $I$), the **exterior** (like $E$), and the angle itself." },
              { say: "Two opposite rays make a **straight angle**, $180°$. When this course says \"angle\", it means one that isn't straight." }] },
            gate: true },
          { type: "choice", prompt: "Which is **not** a name for $\\angle 1$?", skill: "Naming angles",
            art: rayFig([0, 0], [{ d: 8, name: "X" }, { d: 62, name: "Y" }, { d: 130, name: "Z" }], { vname: "W", num: [{ i: 0, j: 1, t: "1" }, { i: 1, j: 2, t: "2" }], x: [-3, 3.6], y: [-1, 3.2], alt: "Three rays from W: angle 1 between X and Y, angle 2 between Y and Z." }),
            options: [{ t: "$\\angle W$" }, { t: "$\\angle XWY$", fb: "That works: vertex $W$ in the middle, a point from each side of $\\angle 1$." },
                      { t: "$\\angle YWX$", fb: "That works too — either order, as long as the vertex is in the middle." }],
            answer: 0,
            hints: ["How many angles have their vertex at $W$?"],
            why: "Three angles meet at $W$ ($\\angle 1$, $\\angle 2$ and the big one), so $\\angle W$ doesn't say which." },
          { type: "learn", kicker: "Try it",
            prompt: "Angles are measured in **degrees**: a full turn is $360°$, so $1°$ is $\\frac{1}{360}$ of a turn. A protractor measures them. **Drag** the orange point and read the angle.",
            scene: { type: "sketch", protractor: true, names: ["P", "Q", "R"], gate: true,
              pts: { B: { at: GT.polar([0, 0], 158, 65), drag: true, c: "orange", say: "The end of side QR" } },
              draw: function (s) { return [{ pray: 0 }, { pray: GT.dir([0, 0], s.B) }]; },
              readout: function (s) {
                var v = Math.round(GT.dir([0, 0], s.B));
                return "$m\\angle PQR = " + v + "°$ <span class='lw-sep'>·</span> " + (v < 90 ? "acute" : v === 90 ? "**right**" : v < 180 ? "obtuse" : "straight");
              } },
            gate: true,
            then: "The measure is written $m\\angle PQR = 65°$: the $m$ says \"the measure of\"." },
          { type: "learn", kicker: "Two scales",
            prompt: "A protractor has two scales, counting in opposite directions. Use the one that starts at **0** on the side you lined up.",
            scene: { type: "walk", rows: [
              { m: "m\\angle PQR = 65°", fig: GT.protractor({ a: 0, b: 65, names: ["P", "Q", "R"], w: 340, alt: "A 65 degree angle with its first side on the right-hand 0." }),
                say: "Put the centre mark on the vertex and line one side up with a 0. Here $\\overrightarrow{QP}$ is on the right-hand 0, so read the **outer** scale: 65." },
              { m: "m\\angle PQR = 50°", fig: GT.protractor({ a: 180, b: 130, names: ["P", "Q", "R"], w: 340, alt: "A 50 degree angle with its first side on the left-hand 0." }),
                say: "Here $\\overrightarrow{QP}$ is on the **left**, at 0 of the **inner** scale. Read that one: 50. (The outer scale says 130 there — the wrong one.)" },
              { say: "A quick check: is the angle narrower than a square corner? Then its measure is under 90." }] },
            gate: true },
          { type: "num", prompt: "Find $m\\angle JKL$.", skill: "Measuring and classifying angles",
            art: GT.protractor({ a: 180, b: 140, names: ["J", "K", "L"], w: 420, alt: "An angle on a protractor, its first side along the left-hand 0." }),
            answer: 40, post: "°", label: "m∠JKL",
            near: [{ v: 140, fb: "That's the outer scale. $\\overrightarrow{KJ}$ lies along the **left** 0, which starts the inner scale. And the angle is clearly narrower than $90°$." }],
            hints: ["Which 0 does $\\overrightarrow{KJ}$ lie on? Use the scale that starts there.", "Is the angle narrower or wider than a right angle?"],
            why: "$\\overrightarrow{KJ}$ is on the inner scale's 0, and $\\overrightarrow{KL}$ crosses that scale at $40$: $m\\angle JKL = 40°$." },
          { type: "learn", kicker: "Kinds of angles",
            prompt: "Angles are classified by their measure.",
            art: FS([rayFig([0, 0], [{ d: 0 }, { d: 50 }], { wedges: [{ i: 0, j: 1, say: "less than 90°" }], x: [-0.8, 3.4], y: [-0.6, 3.2], u: 30, cap: "**Acute**: less than $90°$" }),
                     rayFig([0, 0], [{ d: 0 }, { d: 90 }], { wedges: [{ i: 0, j: 1, right: true }], x: [-0.8, 3.4], y: [-0.6, 3.2], u: 30, cap: "**Right**: exactly $90°$ — the square says so" }),
                     rayFig([0, 0], [{ d: 0 }, { d: 135 }], { wedges: [{ i: 0, j: 1, say: "more than 90°" }], x: [-2.6, 3], y: [-0.6, 3.2], u: 30, cap: "**Obtuse**: between $90°$ and $180°$" })]) },
          { type: "sort", prompt: "Sort each angle by its measure.",
            bins: ["Acute", "Right", "Obtuse"],
            cards: [{ t: "$35°$", bin: 0, fb: "Less than $90°$." }, { t: "$89°$", bin: 0, fb: "Just under $90°$ is still acute." }, { t: "$90°$", bin: 1, fb: "Exactly $90°$ is right." },
                    { t: "$91°$", bin: 2, fb: "Just over $90°$ is obtuse." }, { t: "$127°$", bin: 2, fb: "Between $90°$ and $180°$." }, { t: "$4°$", bin: 0, fb: "Tiny, but still an angle: acute." }],
            skill: "Measuring and classifying angles",
            why: "Under $90°$ is acute, exactly $90°$ is right, and from just over $90°$ up to (not including) $180°$ is obtuse." },
          { type: "sketch", kicker: "Your turn", prompt: "Drag the orange point to turn side $\\overrightarrow{QR}$ until $m\\angle PQR = 125°$.", skill: "Measuring and classifying angles",
            protractor: true, names: ["P", "Q", "R"],
            pts: { B: { at: GT.polar([0, 0], 158, 40), drag: true, c: "orange", say: "The end of side QR" } },
            draw: function (s) { return [{ pray: 0 }, { pray: GT.dir([0, 0], s.B) }]; },
            readout: function (s) { return "$m\\angle PQR = " + Math.round(GT.dir([0, 0], s.B)) + "°$"; },
            goal: function (s) { return Math.round(GT.dir([0, 0], s.B)) === 125; },
            fb: function (s) { var v = Math.round(GT.dir([0, 0], s.B)); return v === 55 ? "That's 125 on the **inner** scale. $\\overrightarrow{QP}$ is on the right-hand 0, which starts the outer scale." : "It's " + v + "° now. 125° is wider than a right angle."; },
            answer: { B: GT.polar([0, 0], 158, 125) },
            hints: ["$\\overrightarrow{QP}$ lies on the right-hand 0: read the **outer** scale.", "125° is obtuse: past the 90 at the top."],
            why: "From the right-hand 0 on the outer scale, the side crosses 125: an obtuse angle." },
          recap([
            { m: "\\overrightarrow{EF}", say: "A **ray**: endpoint first. A point on a line splits it into two **opposite rays**." },
            { m: "\\angle BAC", say: "An **angle**: two noncollinear rays (the sides) from one endpoint (the vertex). Vertex in the middle of the name." },
            { m: "m\\angle A", say: "Measure it in **degrees** with a protractor — read the scale whose 0 your first side is on." },
            { say: "**Acute** under $90°$ · **right** $90°$ · **obtuse** between $90°$ and $180°$ · **straight** $180°$." }])
        ]
      },
      /* ============================================================== 8 */
      {
        title: "Congruent angles and angle bisectors", v: 3,
        blurb: "Angles that match, and the arcs that say so; angle measures that add; the ray that splits an angle in half — and copying and bisecting angles with a compass.",
        mins: 13,
        steps: [
          drawn("geo1-protractor", 1, { kicker: "Remember?" }),
          { type: "learn", kicker: "Same measure",
            prompt: "Angles with the same measure are **congruent**, just like segments with the same length.",
            art: rayFig([0, 0], [{ d: 20, name: "N" }, { d: 45, name: "P" }, { d: 110, name: "Q" }, { d: 135, name: "R" }], { vname: "M",
              marks: [{ i: 0, j: 1, n: 1, r: 44 }, { i: 2, j: 3, n: 1, r: 44 }], x: [-3.2, 3.6], y: [-1, 3.4], u: 50, cap: "$\\angle NMP \\cong \\angle QMR$", alt: "Two angles at M, each marked with one arc." }),
            after: "In a figure, **arcs** say it: angles marked with the same number of arcs are congruent. Their measures are equal: $m\\angle NMP = m\\angle QMR$." },
          { type: "learn", kicker: "Watch",
            prompt: "Congruent angles have equal measures, so their expressions can be set equal.",
            scene: { type: "walk", rows: [
              { m: "\\angle ABC \\cong \\angle DEF", say: "$m\\angle ABC = (4x + 11)°$ and $m\\angle DEF = (7x - 16)°$." },
              { m: "4x + 11 = 7x - 16", say: "Congruent means equal measures." },
              { m: "27 = 3x,\\; x = 9", say: "Take $4x$ from both sides and add 16; then divide by 3." },
              { m: "m\\angle ABC = 4(9) + 11 = 47°", say: "Put $x$ back in. Check the other: $7(9) - 16 = 47$. ✓" }] },
            gate: true },
          { type: "num", prompt: "$\\angle JKL \\cong \\angle MKN$, with $m\\angle JKL = (5x + 4)°$ and $m\\angle MKN = (3x + 12)°$. Find $m\\angle JKL$.", skill: "Congruent angles and bisectors",
            answer: 24, post: "°", label: "m∠JKL",
            near: [{ v: 4, fb: "That's $x$. Put it back into $5x + 4$." }],
            hints: ["$5x + 4 = 3x + 12$.", "$2x = 8$, so $x = 4$."],
            why: "$5x + 4 = 3x + 12$ gives $x = 4$, so $m\\angle JKL = 5(4) + 4 = 24°$." },
          { type: "learn", kicker: "Try it",
            prompt: "Angles add like segments do. **Drag** $Q$ round between the sides of $\\angle RPS$.",
            scene: { type: "sketch", x: [-2.6, 5.8], y: [-0.6, 5], grid: false, u: 44, gate: true,
              pts: { Q: { at: GT.polar([0.3, 0.3], 3.6, 44), drag: true, c: "orange", on: { circle: [[0.3, 0.3], 3.6], snapDeg: 1, range: [16, 114] }, say: "Point Q" } },
              draw: function (s) {
                var V = [0.3, 0.3], dq = GT.dir(V, s.Q), a = Math.round(dq - 10), b = Math.round(120 - dq), Rp = GT.polar(V, 3.6, 10), Sp = GT.polar(V, 3.6, 120);
                return [{ angle: [Rp, V, s.Q], say: a + "°", r: 34 }, { angle: [s.Q, V, Sp], say: b + "°", r: 44, c: "blue" },
                  { dline: [V, GT.polar(V, 4.9, 10)], ray: true }, { dline: [V, GT.polar(V, 4.9, 120)], ray: true }, { dline: [V, GT.polar(V, 4.9, dq)], ray: true, c: "orange" },
                  { pt: V, name: "P", at: "s" }, { pt: Rp, name: "R", at: "s" }, { pt: Sp, name: "S", at: "w" }, { pt: s.Q, name: "Q", at: side8(dq + 90) }];
              },
              readout: function (s) {
                var dq = GT.dir([0.3, 0.3], s.Q), a = Math.round(dq - 10), b = Math.round(120 - dq);
                return "$m\\angle RPQ + m\\angle QPS = " + a + " + " + b + " = 110 = m\\angle RPS$" + (a === b ? " — the halves match: $\\overrightarrow{PQ}$ **bisects** $\\angle RPS$" : "");
              } },
            gate: true,
            then: "The parts always add up to the whole angle. And when the two parts are equal, the middle ray is the angle's **bisector**." },
          { type: "learn", kicker: "Angle bisector",
            prompt: "A ray that splits an angle into two congruent angles is its **angle bisector**.",
            art: rayFig([0, 0], [{ d: 10, name: "R" }, { d: 55, name: "Q" }, { d: 100, name: "S" }], { vname: "P", marks: [{ i: 0, j: 1, n: 1, r: 30 }, { i: 1, j: 2, n: 1, r: 30 }], x: [-2.4, 3.6], y: [-1, 3.4],
              cap: "$\\overrightarrow{PQ}$ bisects $\\angle RPS$: $\\angle RPQ \\cong \\angle QPS$", alt: "Ray PQ splits angle RPS into two angles marked equal." }),
            after: "Then each half is exactly half the whole: $m\\angle RPQ = m\\angle QPS = \\frac{1}{2}m\\angle RPS$." },
          { type: "num", prompt: "$\\overrightarrow{PQ}$ bisects $\\angle RPS$. $m\\angle RPQ = (5x + 8)°$ and $m\\angle QPS = (7x - 6)°$. Find $m\\angle RPQ$.", skill: "Congruent angles and bisectors",
            art: rayFig([0, 0], [{ d: 10, name: "R" }, { d: 55, name: "Q" }, { d: 100, name: "S" }], { vname: "P", marks: [{ i: 0, j: 1, n: 1, r: 30 }, { i: 1, j: 2, n: 1, r: 30 }], x: [-2.4, 3.6], y: [-1, 3.4], alt: "Ray PQ bisects angle RPS." }),
            answer: 43, post: "°", label: "m∠RPQ",
            near: [{ v: 7, fb: "That's $x$. Put it back into $5x + 8$." }, { v: 86, fb: "That's the whole angle. The question asks for one half." }],
            hints: ["A bisector makes the halves equal: $5x + 8 = 7x - 6$.", "$14 = 2x$, so $x = 7$."],
            why: "$5x + 8 = 7x - 6$ gives $x = 7$, so $m\\angle RPQ = 5(7) + 8 = 43°$." },
          { type: "num", kicker: "One step harder", prompt: "$\\overrightarrow{PQ}$ bisects $\\angle RPS$, with $m\\angle RPQ = (3x + 5)°$ and $m\\angle RPS = (8x - 2)°$. Find $m\\angle RPS$.", skill: "Congruent angles and bisectors",
            answer: 46, post: "°", label: "m∠RPS",
            near: [{ v: 23, fb: "That's one half. The question asks for the whole angle." }, { v: 6, fb: "That's $x$. Put it into $8x - 2$." }],
            hints: ["This time one expression is a half and the other is the whole. The whole is **twice** the half: $2(3x + 5) = 8x - 2$.", "$6x + 10 = 8x - 2$, so $x = 6$."],
            why: "$2(3x + 5) = 8x - 2$ gives $x = 6$, so $m\\angle RPS = 8(6) - 2 = 46°$ (and each half is $23°$)." },
          { type: "learn", kicker: "Bisect it with a compass",
            prompt: "No protractor needed. Four steps:",
            scene: { type: "walk", rows: [
              { fig: consBisectAngle(1), say: "Compass point on the vertex $A$: draw an arc that crosses both sides. Call the crossings $B$ and $C$." },
              { fig: consBisectAngle(2), say: "From $B$, draw an arc inside the angle." },
              { fig: consBisectAngle(3), say: "**Same opening**, from $C$: draw an arc that crosses the last one. Call the crossing $D$." },
              { fig: consBisectAngle(4), say: "Draw $\\overrightarrow{AD}$. It bisects $\\angle A$: $\\angle BAD \\cong \\angle DAC$. ($D$ is the same distance from $B$ and from $C$, so it sits right down the middle.)" }] },
            gate: true },
          { type: "order", prompt: "Put the steps for bisecting an angle in order.", skill: "Constructions",
            items: ["From the vertex A, draw an arc that crosses both sides, at B and C", "From B, draw an arc inside the angle", "With the same opening, draw an arc from C that crosses it at D", "Draw ray AD"],
            nudge: "You can't draw from $B$ until $B$ exists. What makes it?",
            why: "First make $B$ and $C$, then two arcs of one opening from them meet at $D$, then draw $\\overrightarrow{AD}$." },
          { type: "learn", kicker: "Copy an angle",
            prompt: "And to copy an angle onto a new ray — the compass carries the angle's opening across.",
            scene: { type: "walk", rows: [
              { fig: consCopyAngle(1), say: "Here's $\\angle P$. Draw a ray from a new point $T$." },
              { fig: consCopyAngle(2), say: "From $P$, draw an arc crossing both sides, at $R$ and $Q$." },
              { fig: consCopyAngle(3), say: "Same opening, from $T$: an arc crossing the new ray at $S$." },
              { fig: consCopyAngle(4), say: "Now set the compass to the gap from $R$ to $Q$." },
              { fig: consCopyAngle(5), say: "With that opening, from $S$: an arc crossing the big arc at $U$." },
              { fig: consCopyAngle(6), say: "Draw $\\overrightarrow{TU}$. Then $\\angle STU \\cong \\angle RPQ$: the same arcs and the same gap build the same opening." }] },
            gate: true },
          recap([
            { m: "\\angle A \\cong \\angle B", say: "**Congruent angles** have equal measures. Matching arcs say so in a figure." },
            { m: "m\\angle RPQ + m\\angle QPS = m\\angle RPS", say: "Angle measures add, when $Q$ is inside $\\angle RPS$." },
            { say: "An **angle bisector** splits an angle into two congruent halves, each half the whole." },
            { say: "With a compass: arcs from the vertex, then two arcs of one opening — they meet on the bisector." }],
            consBisectAngle(4, { u: 26, w: 240 }))
        ]
      },
      /* ============================================================== 9 */
      {
        title: "Angle pairs", v: 3,
        blurb: "Angles that sit side by side, and the pairs two crossing lines always make: vertical angles are equal, and a linear pair adds up to 180°.",
        mins: 12,
        steps: [
          drawn("geo1-angalg", 2, { kicker: "Remember?" }),
          { type: "learn", kicker: "Side by side",
            prompt: "Two angles are **adjacent** when they share a vertex **and** a side, and don't overlap.",
            scene: { type: "walk", rows: [
              { fig: rayFig([0, 0], [{ d: 5, name: "A" }, { d: 55, name: "C" }, { d: 110, name: "D" }], { vname: "B", wedges: [{ i: 0, j: 1, r: 26 }, { i: 1, j: 2, r: 34, c: "blue" }], x: [-2.2, 3.6], y: [-1, 3.2], u: 34, alt: "Angles ABC and CBD side by side, sharing ray BC." }),
                say: "$\\angle ABC$ and $\\angle CBD$ **are** adjacent: common vertex $B$, common side $\\overrightarrow{BC}$, no overlap." },
              { fig: rayFig([0, 0], [{ d: 5, name: "A" }, { d: 55, name: "C" }, { d: 110, name: "D" }], { vname: "B", wedges: [{ i: 0, j: 1, r: 26 }, { i: 0, j: 2, r: 38, c: "blue" }], x: [-2.2, 3.6], y: [-1, 3.2], u: 34, alt: "Angle ABC sits inside angle ABD." }),
                say: "$\\angle ABC$ and $\\angle ABD$ are **not**: they share side $\\overrightarrow{BA}$, but one sits inside the other." },
              { fig: plain([0, 6], [0, 3.4], [{ angle: [[2.4, 0.6], [0.6, 0.6], [1.6, 2.4]], r: 22 }, { angle: [[0.6, 0.6], [2.4, 0.6], [4.8, 2.8]], r: 22, c: "blue" },
                  { dline: [[0.6, 0.6], [1.6, 2.4]], ray: true }, { seg: [[0.6, 0.6], [2.4, 0.6]] }, { dline: [[2.4, 0.6], [4.8, 2.8]], ray: true }, { dline: [[0.6, 0.6], [5.6, 0.6]], ray: true },
                  { pt: [0.6, 0.6], name: "B", at: "sw" }, { pt: [2.4, 0.6], name: "C", at: "s" }, { pt: [1.6, 2.4], name: "A", at: "w" }, { pt: [4.8, 2.8], name: "D", at: "e" }], { u: 36, alt: "Angle ABC at B and angle BCD at C: no common vertex." }),
                say: "$\\angle ABC$ and $\\angle BCD$ are **not**: they have no common vertex." }] },
            gate: true },
          { type: "learn", kicker: "Two crossing lines",
            prompt: "Two lines that cross make four angles, and two special kinds of pair.",
            art: xFig(58, { cap: "Number the angles 1 to 4 going round." }),
            after: "**Vertical angles** are opposite each other across the crossing: $\\angle 1$ and $\\angle 3$, or $\\angle 2$ and $\\angle 4$. They share only the vertex. <br><br>A **linear pair** is two adjacent angles whose other sides make a straight line: $\\angle 1$ and $\\angle 2$, say." },
          { type: "sort", prompt: "Sort each pair from the figure above: vertical angles, or a linear pair?",
            art: xFig(58),
            bins: ["Vertical angles", "A linear pair"],
            cards: [{ t: nb("$\\angle 1$ and $\\angle 3$"), bin: 0, fb: "They're opposite each other, sharing only the vertex." }, { t: nb("$\\angle 2$ and $\\angle 4$"), bin: 0, fb: "Opposite each other across the crossing." },
                    { t: nb("$\\angle 1$ and $\\angle 2$"), bin: 1, fb: "Side by side, and their outer sides make a straight line." }, { t: nb("$\\angle 2$ and $\\angle 3$"), bin: 1, fb: "Side by side along a line." },
                    { t: nb("$\\angle 3$ and $\\angle 4$"), bin: 1, fb: "Side by side along a line." }, { t: nb("$\\angle 4$ and $\\angle 1$"), bin: 1, fb: "Side by side along a line." }],
            skill: "Angle pairs",
            why: "Opposite across the crossing: vertical. Next to each other on a line: a linear pair." },
          { type: "learn", kicker: "Try it",
            prompt: "**Drag** the orange point to turn one line. Watch all four angles.",
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
                return "$m\\angle 1 = m\\angle 3 = " + a + "°$ <span class='lw-sep'>·</span> $m\\angle 2 = m\\angle 4 = " + (180 - a) + "°$ <span class='lw-sep'>·</span> $m\\angle 1 + m\\angle 2 = 180°$";
              } },
            gate: true,
            then: "However you turn it: **vertical angles are congruent**, and **the angles of a linear pair add up to** $180°$." },
          { type: "learn", kicker: "Why it works",
            prompt: "The second fact explains the first.",
            scene: { type: "walk", rows: [
              { m: "m\\angle 1 + m\\angle 2 = 180°", fig: xFig(58, { u: 30 }), say: "$\\angle 1$ and $\\angle 2$ are a linear pair." },
              { m: "m\\angle 2 + m\\angle 3 = 180°", say: "So are $\\angle 2$ and $\\angle 3$." },
              { m: "m\\angle 1 = m\\angle 3", say: "Both add $\\angle 2$ to make $180°$ — so $\\angle 1$ and $\\angle 3$ must be the same size. Vertical angles are always congruent." }] },
            gate: true },
          { type: "num", prompt: "$m\\angle 1 = 62°$. Find $m\\angle 2$.", skill: "Vertical angles and linear pairs", art: xFig(62),
            answer: 118, post: "°", label: "m∠2",
            near: [{ v: 62, fb: "$\\angle 2$ is next to $\\angle 1$, not opposite: they're a linear pair, adding up to $180°$." }, { v: 28, fb: "A linear pair adds up to $180°$, not $90°$." }],
            hints: ["$\\angle 1$ and $\\angle 2$ make a straight line together."],
            why: "They're a linear pair: $180° - 62° = 118°$." },
          { type: "choice", prompt: "Two skis cross, and one of the four angles they make is $60°$. What are all four?", skill: "Vertical angles and linear pairs",
            art: xFig(60, { rot: -30, nums: false, wedges: [{ i: 0, j: 1, say: "60°" }], alt: "Two crossing lines; one angle is marked 60 degrees." }),
            options: [{ t: "$60°$, $120°$, $60°$, $120°$" }, { t: "$60°$, $60°$, $60°$, $60°$", fb: "Only the angle opposite the $60°$ one matches it. The ones beside it make straight lines with it." },
                      { t: "$60°$, $30°$, $60°$, $30°$", fb: "The angles beside it make $180°$ with it, not $90°$." }],
            answer: 0,
            hints: ["The angle opposite is equal. Each angle beside it adds up with it to $180°$."],
            why: "The vertical angle is $60°$; each neighbour is $180° - 60° = 120°$. Check: $60 + 120 + 60 + 120 = 360$, a full turn." },
          { type: "learn", kicker: "Watch",
            prompt: "The same facts, with algebra.",
            scene: { type: "walk", rows: [
              { m: "(5x - 12)° \\text{ and } (3x + 20)°", fig: xFig(68, { nums: false, wedges: [{ i: 0, j: 1, say: "(5x − 12)°", r: 40 }, { i: 2, j: 3, say: "(3x + 20)°", r: 40 }], u: 40, alt: "Two vertical angles marked with expressions." }),
                say: "These two are vertical angles." },
              { m: "5x - 12 = 3x + 20", say: "Vertical angles are congruent, so their measures are equal." },
              { m: "2x = 32,\\; x = 16", say: "Solve." },
              { m: "5(16) - 12 = 68°", say: "Each is $68°$ — and each angle beside them is $180° - 68° = 112°$." }] },
            gate: true },
          { type: "num", prompt: "$\\angle 1$ and $\\angle 2$ form a linear pair, with $m\\angle 1 = (2x + 10)°$ and $m\\angle 2 = (3x - 5)°$. Find $m\\angle 2$.", skill: "Vertical angles and linear pairs",
            art: xFig(80), answer: 100, post: "°", label: "m∠2",
            near: [{ v: 35, fb: "That's $x$. Put it into $3x - 5$." }, { v: 80, fb: "That's $\\angle 1$." }],
            hints: ["A linear pair adds up to $180°$: $(2x + 10) + (3x - 5) = 180$.", "$5x + 5 = 180$, so $x = 35$."],
            why: "$5x + 5 = 180$ gives $x = 35$, so $m\\angle 2 = 3(35) - 5 = 100°$ (and $m\\angle 1 = 80°$)." },
          recap([
            { say: "**Adjacent** angles share a vertex and a side, and don't overlap." },
            { m: "\\angle 1 \\cong \\angle 3", say: "**Vertical angles** — opposite each other where two lines cross — are always congruent." },
            { m: "m\\angle 1 + m\\angle 2 = 180°", say: "The two angles of a **linear pair** always add up to $180°$." }],
            xFig(58, { u: 26, w: 220 }))
        ]
      },
      /* ============================================================== 10 */
      {
        title: "Complementary, supplementary and perpendicular", v: 3,
        blurb: "Angles that add to 90° or 180°, wherever they are; perpendicular lines; what a figure lets you assume — and constructing a perpendicular.",
        mins: 14,
        steps: [
          drawn("geo1-vertlin", 1, { kicker: "Remember?" }),
          { type: "learn", kicker: "Two sums",
            prompt: "Two angle sums have names of their own.",
            scene: { type: "walk", rows: [
              { m: "m\\angle 1 + m\\angle 2 = 90°", fig: rayFig([0, 0], [{ d: 0 }, { d: 35 }, { d: 90 }], { num: [{ i: 0, j: 1, t: "1", r: 1.1 }, { i: 1, j: 2, t: "2", r: 1.1 }], wedges: [{ i: 0, j: 2, right: true, r: 14 }], x: [-0.6, 3.4], y: [-0.6, 3.4], u: 40, alt: "A right angle split into angles 1 and 2." }),
                say: "**Complementary** angles add up to $90°$, like $\\angle 1$ and $\\angle 2$ here. Each is the other's **complement**." },
              { m: "35° + 55° = 90°", fig: plain([0, 7], [0, 3], [{ angle: [[2.6, 0.5], [0.4, 0.5], GT.polar([0.4, 0.5], 2, 35)], say: "35°", r: 26 }, { dline: [[0.4, 0.5], [2.8, 0.5]], ray: true }, { dline: [[0.4, 0.5], GT.polar([0.4, 0.5], 2.6, 35)], ray: true },
                    { angle: [[6.6, 0.5], [4.2, 0.5], GT.polar([4.2, 0.5], 2, 55)], say: "55°", r: 26, c: "blue" }, { dline: [[4.2, 0.5], [6.6, 0.5]], ray: true }, { dline: [[4.2, 0.5], GT.polar([4.2, 0.5], 2.6, 55)], ray: true }], { u: 40, alt: "A 35 degree angle and a separate 55 degree angle." }),
                say: "They don't have to touch: a $35°$ angle here and a $55°$ angle over there are complementary too." },
              { m: "130° + 50° = 180°", fig: plain([0, 7], [0, 3], [{ angle: [[2.6, 0.5], [0.4, 0.5], GT.polar([0.4, 0.5], 2, 130)], say: "130°", r: 20 }, { dline: [[0.4, 0.5], [2.8, 0.5]], ray: true }, { dline: [[0.4, 0.5], GT.polar([0.4, 0.5], 2.2, 130)], ray: true },
                  { angle: [[6.6, 0.5], [4.6, 0.5], GT.polar([4.6, 0.5], 2, 50)], say: "50°", r: 22, c: "blue" }, { dline: [[4.6, 0.5], [6.6, 0.5]], ray: true }, { dline: [[4.6, 0.5], GT.polar([4.6, 0.5], 2.4, 50)], ray: true }], { u: 40, alt: "A 130 degree angle and a 50 degree angle." }),
                say: "**Supplementary** angles add up to $180°$ — the two angles of a linear pair are one example. Each is the other's **supplement**." },
              { say: "A way to remember: **c** comes before **s**, and 90 comes before 180." }] },
            gate: true },
          { type: "num", prompt: "Find the complement of a $34°$ angle.", skill: "Complementary and supplementary angles",
            answer: 56, post: "°", label: "Complement",
            near: [{ v: 146, fb: "That's the supplement (it adds up to $180°$). A complement adds up to $90°$." }],
            hints: ["Complementary angles add up to $90°$."], why: "$90° - 34° = 56°$." },
          { type: "num", prompt: "Find the supplement of a $34°$ angle.", skill: "Complementary and supplementary angles",
            answer: 146, post: "°", label: "Supplement",
            near: [{ v: 56, fb: "That's the complement. A supplement adds up to $180°$." }],
            hints: ["Supplementary angles add up to $180°$."], why: "$180° - 34° = 146°$." },
          { type: "learn", kicker: "Watch",
            prompt: "Two complementary angles differ by $18°$. What are they?",
            scene: { type: "walk", rows: [
              { m: "x \\text{ and } x + 18", say: "Call the smaller one $x$. The larger is $18°$ more." },
              { m: "x + (x + 18) = 90", say: "Complementary: they add up to $90°$." },
              { m: "2x = 72,\\; x = 36", say: "Take 18 from both sides, then halve." },
              { m: "36° \\text{ and } 54°", say: "Check: $36 + 54 = 90$, and $54 - 36 = 18$. ✓" }] },
            gate: true },
          { type: "num", prompt: "The supplement of an angle is 3 times the angle. Find the angle.", skill: "Complementary and supplementary angles",
            answer: 45, post: "°", label: "Angle",
            near: [{ v: 135, fb: "That's the supplement. The question asks for the angle." }, { v: 60, fb: "That would make the supplement only twice the angle. Solve $x + 3x = 180$." }],
            hints: ["Call the angle $x$; its supplement is $3x$.", "$x + 3x = 180$."],
            why: "$4x = 180$, so $x = 45°$ (and its supplement is $135° = 3 \\times 45°$)." },
          { type: "learn", kicker: "Perpendicular",
            prompt: "Lines, segments or rays that meet at a right angle are **perpendicular**: $\\perp$.",
            art: xFig(90, { names: ["Y", "X", "W", "Z"], v: "O", vlab: "sw", nums: false, wedges: [{ i: 0, j: 1, right: true }], cap: "$\\overleftrightarrow{XZ} \\;\\perp\\; \\overleftrightarrow{WY}$", alt: "Two lines meeting at a right angle at O, marked with a square." }),
            after: "One right angle is enough: its vertical angle is $90°$ too, and each angle beside it is $180° - 90° = 90°$. **Perpendicular lines form four right angles.**" },
          { type: "num", prompt: "$\\overrightarrow{FB} \\;\\perp\\; \\overrightarrow{FD}$, and $\\overrightarrow{FC}$ lies between them. $m\\angle BFC = (5x)°$ and $m\\angle CFD = (4x)°$. Find $x$.", skill: "Perpendicular lines and reading figures",
            art: rayFig([0, 0], [{ d: 0, name: "D" }, { d: 40, name: "C" }, { d: 90, name: "B" }], { vname: "F", wedges: [{ i: 0, j: 2, right: true, r: 16 }], x: [-1.4, 3.6], y: [-1, 3.6], alt: "A right angle at F split by ray FC." }),
            answer: 10, label: "x",
            near: [{ v: 20, fb: "The two parts make a **right** angle, $90°$, not a straight one." }],
            hints: ["The parts add up to the right angle: $5x + 4x = 90$."],
            why: "$9x = 90$, so $x = 10$: the angles are $50°$ and $40°$." },
          { type: "learn", kicker: "Reading a figure",
            prompt: "A figure shows how things are **arranged**, not how big they are. Here's what you may and may not take from one.",
            art: xFig(86, { names: ["B", "C", "A", "D"], v: "E", vlab: "sw", nums: false, alt: "Two lines crossing at E at nearly a right angle, with nothing marked." }),
            after: "**You may assume**: points drawn on a line are collinear; the lines meet at $E$; which angles are adjacent, vertical, or a linear pair. <br><br>**You may not assume**: right angles, equal lengths or equal angles — unless they're **marked** (a square, ticks, arcs) or **stated**. These lines look perpendicular, but nothing says so." },
          { type: "sort", prompt: "For the figure above: which can you assume, and which not?",
            art: xFig(86, { names: ["B", "C", "A", "D"], v: "E", vlab: "sw", nums: false }),
            bins: ["Can assume", "Can't assume"],
            cards: [{ t: nb("$A$, $E$ and $B$ are collinear"), bin: 0, fb: "They're drawn on one line." }, { t: nb("$\\angle AEC$ and $\\angle CEB$ are a linear pair"), bin: 0, fb: "Adjacent, with outer sides along one line: that's arrangement." },
                    { t: nb("$\\angle AEC \\cong \\angle BED$"), bin: 0, fb: "They're vertical angles, and vertical angles are always congruent." },
                    { t: nb("$\\overleftrightarrow{AB} \\;\\perp\\; \\overleftrightarrow{CD}$"), bin: 1, fb: "No right-angle mark. Looking square isn't enough." },
                    { t: nb("$\\overline{AE} \\cong \\overline{EB}$"), bin: 1, fb: "No tick marks: lengths can't be assumed." }],
            skill: "Perpendicular lines and reading figures",
            why: "Arrangement — collinear points, which angles sit where, and facts that follow from it — can be assumed. Sizes can't, unless marked or stated." },
          { type: "learn", kicker: "Construct it",
            prompt: "A compass can draw a perpendicular, too — through a point **off** a line:",
            scene: { type: "walk", rows: [
              { fig: consPerpOff(1), say: "From $Z$, draw an arc that crosses line $m$ twice, at $X$ and $Y$." },
              { fig: consPerpOff(2), say: "Open the compass to more than half of $XY$. From $X$, draw an arc below the line." },
              { fig: consPerpOff(3), say: "Same opening, from $Y$: an arc crossing the last one at $A$." },
              { fig: consPerpOff(4), say: "Draw $\\overleftrightarrow{ZA}$: it's perpendicular to $m$. ($Z$ and $A$ are each the same distance from $X$ and $Y$, so they sit on the line through the middle of $\\overline{XY}$, square to it.)" }] },
            gate: true },
          { type: "learn", kicker: "And through a point on it",
            prompt: "Through a point **on** a line, it's nearly the same:",
            scene: { type: "walk", rows: [
              { fig: consPerpOn(1), say: "From $C$, draw arcs crossing the line on both sides, at $A$ and $B$ — so $C$ is the midpoint of $\\overline{AB}$." },
              { fig: consPerpOn(2), say: "Open the compass wider. From $A$, draw an arc above the line." },
              { fig: consPerpOn(3), say: "Same opening, from $B$: an arc crossing it at $D$." },
              { fig: consPerpOn(4), say: "Draw $\\overleftrightarrow{CD}$: perpendicular to $n$ at $C$." }] },
            gate: true },
          { type: "choice", kicker: "Always, sometimes, never", prompt: "If two angles are supplementary, do they form a linear pair?", skill: "Perpendicular lines and reading figures", keep: true,
            options: [{ t: "Always", fb: "Try two supplementary angles in different places — a $130°$ angle here and a $50°$ one over there. Supplementary, but not a pair of any kind." },
                      { t: "Sometimes" }, { t: "Never", fb: "A linear pair **is** supplementary — so sometimes they do." }],
            answer: 1,
            hints: ["A linear pair is always supplementary. But must supplementary angles sit next to each other?"],
            why: "Sometimes: every linear pair is supplementary, but two supplementary angles can be far apart, with no common side." },
          recap([
            { m: "a + b = 90°", say: "**Complementary**: the two add up to $90°$." },
            { m: "a + b = 180°", say: "**Supplementary**: the two add up to $180°$. A linear pair is always supplementary." },
            { m: "\\perp", say: "**Perpendicular** lines meet at right angles — all four of them." },
            { say: "From a figure, assume the arrangement, never the sizes — unless they're marked or stated." }],
            consPerpOff(4, { u: 26, w: 240 }))
        ]
      },
      /* ============================================================== 11 */
      {
        title: "Polygons", v: 3,
        blurb: "What makes a figure a polygon, the names by number of sides, and the two ways to sort them: convex or concave, regular or not.",
        mins: 11,
        steps: [
          drawn("geo1-compsupp", 1, { kicker: "Remember?" }),
          { type: "learn", kicker: "Look around",
            prompt: "A stop sign, a tile, a cell of a honeycomb: flat shapes made of straight sides. They're **polygons** — Greek for \"many angles\".",
            art: FS([polyFig(reg(8, 1.6, [0, 0], 22.5), { u: 30, cap: "A stop sign: 8 sides" }), polyFig(reg(6, 1.6, [0, 0], 0), { u: 30, cap: "A honeycomb cell: 6 sides" }), polyFig(reg(3, 1.7), { u: 30, cap: "A warning sign: 3 sides" })]) },
          { type: "learn", kicker: "What counts",
            prompt: "A **polygon** is a closed figure in a plane made of segments, called **sides**, where:",
            scene: { type: "walk", rows: [
              { fig: polyFig([[0, 0], [3, 0], [3.8, 1.8], [1.6, 3], [-0.4, 1.6]], { names: ["A", "B", "C", "D", "E"], u: 32, alt: "Pentagon ABCDE." }),
                say: "Each side meets exactly two others, only at their endpoints — the **vertices**. Name it by its vertices in order round it: pentagon $ABCDE$." },
              { fig: plain([-0.5, 4.5], [-0.5, 3.2], [{ path: [[0, 0], [4, 0], [3, 2.6], [0.4, 2.2]], c: "blue" }], { u: 30, alt: "An open figure with a gap." }),
                say: "**Not** a polygon: it isn't closed." },
              { fig: plain([-0.5, 4.5], [-0.5, 3.2], [{ path: [[0, 0], [4, 2.6], [4, 0], [0, 2.6], [0, 0]], c: "blue" }], { u: 30, alt: "A bow-tie whose sides cross." }),
                say: "**Not** a polygon: two sides cross in the middle, not at their endpoints." },
              { fig: plain([-2.4, 2.4], [-1.9, 2.4], [{ path: [[-2, -1.4], [2, -1.4]], c: "blue" }, { path: [[-2, -1.4], [-2, 0.4]], c: "blue" }, { path: [[2, -1.4], [2, 0.4]], c: "blue" }, { ell: [[0, 0.4], 2, 1.6], part: "back", c: "blue" }], { u: 30, alt: "A shape with a curved top." }),
                say: "**Not** a polygon: one side is curved." }] },
            gate: true },
          { type: "learn", kicker: "Names",
            prompt: "Polygons are named by how many sides they have. One with $n$ sides is an $n$-gon.",
            art: FS([3, 4, 5, 6, 7, 8, 9, 10, 12].map(function (n) { return polyFig(reg(n, 1.5, [0, 0], n === 4 ? 45 : 90), { u: 22, cap: n + ": " + NGON[n] }); })) },
          { type: "choice", prompt: "What is this polygon called?", skill: "Polygons", art: polyFig(reg(7, 2), { u: 30, alt: "A seven-sided polygon." }),
            options: [{ t: "Heptagon" }, { t: "Hexagon", fb: "A hexagon has 6 sides. Count again." }, { t: "Octagon", fb: "An octagon has 8 sides. Count again." }],
            answer: 0, hints: ["Count the sides: start at the top and go round."], why: "Seven sides: a heptagon." },
          { type: "learn", kicker: "Try it",
            prompt: "Extend every side into a line (dashed). **Drag** the orange corner inwards and watch what happens to those lines.",
            scene: { type: "sketch", x: [-3.4, 3.4], y: [-2.8, 3], grid: false, u: 44, gate: true,
              pts: { V: { at: [0, 2.2], drag: true, snap: 0.2, c: "orange", say: "The top corner" } },
              draw: function (s) {
                var P = [[-2, -1.6], [2, -1.6], [2.3, 0.8], s.V, [-2.3, 0.8]], it = [], cv = convex(P);
                P.forEach(function (a, i) {
                  var b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
                  it.push({ dline: [[a[0] - dx / L * 9, a[1] - dy / L * 9], [b[0] + dx / L * 9, b[1] + dy / L * 9]], bare: true, dash: "3 5", c: "soft" });
                });
                it.push({ poly: P, c: cv ? "blue" : "red" });
                return it;
              },
              readout: function (s) { return convex([[-2, -1.6], [2, -1.6], [2.3, 0.8], s.V, [-2.3, 0.8]]) ? "**Convex**: no side's line passes through the inside" : "**Concave**: some side's line cuts through the inside"; } },
            gate: true,
            then: "A polygon is **convex** if no line along a side passes through its inside; otherwise it's **concave** — it has a dent." },
          { type: "learn", kicker: "Regular",
            prompt: "A **regular** polygon is convex, with all its sides congruent **and** all its angles congruent.",
            scene: { type: "walk", rows: [
              { fig: polyFig(reg(6, 1.8, [0, 0], 0), { u: 30, extra: reg(6, 1.8, [0, 0], 0).map(function (p, i, A) { return { seg: [p, A[(i + 1) % 6]], marks: 1, c: "blue" }; }), alt: "A regular hexagon with equal tick marks on every side." }),
                say: "A regular hexagon: six equal sides, six equal angles." },
              { fig: polyFig([[0, 0], [2.4, 0], [3.6, 2.078], [1.2, 2.078]], { u: 34, alt: "A rhombus that isn't a square." }),
                say: "**Not** regular: this rhombus has four equal sides, but its angles don't match." },
              { fig: polyFig([[0, 0], [4, 0], [4, 2.2], [0, 2.2]], { u: 34, alt: "A rectangle that isn't a square." }),
                say: "**Not** regular: a rectangle has four equal angles, but its sides don't match." },
              { fig: polyFig([[0, 1.6], [1.2, 1.2], [1.6, 0], [2, 1.2], [3.2, 1.6], [2, 2], [1.6, 3.2], [1.2, 2]], { u: 34, alt: "A star-shaped octagon with equal sides." }),
                say: "**Not** regular: every side of this star is the same length, but it's concave — and a regular polygon must be convex." }] },
            gate: true },
          { type: "choice", prompt: "Classify this polygon.", skill: "Polygons", art: polyFig(ELL, { u: 34, alt: "An L-shaped six-sided polygon." }),
            options: [{ t: "Hexagon, concave, irregular" }, { t: "Hexagon, convex, irregular", fb: "Extend the two sides at the inside corner of the L: those lines pass through the shape. It's concave." },
                      { t: "Octagon, concave, irregular", fb: "Count the sides again: six." }, { t: "Hexagon, concave, regular", fb: "A concave polygon can never be regular — and these sides aren't equal anyway." }],
            answer: 0, hints: ["Count the sides. Then look for a dent."],
            why: "Six sides: a hexagon. The inside corner of the L is a dent, so it's concave — and so it can't be regular." },
          { type: "choice", prompt: "Can a concave polygon be regular?", skill: "Polygons",
            options: [{ t: "No — a regular polygon must be convex" }, { t: "Yes, if all its sides are equal", fb: "The star above has all its sides equal, and it still isn't regular: regular also means convex, with equal angles." }],
            answer: 0, keep: true,
            why: "Regular means convex **and** equal sides **and** equal angles, so a concave polygon never qualifies." },
          recap([
            { say: "A **polygon**: closed, made of segments, each meeting exactly two others at its endpoints. Name it by its vertices in order." },
            { say: "Named by sides: triangle 3, quadrilateral 4, pentagon 5, hexagon 6, heptagon 7, octagon 8, nonagon 9, decagon 10, dodecagon 12 — an $n$-gon in general." },
            { say: "**Convex**: no side's line goes inside. **Concave**: it has a dent." },
            { say: "**Regular**: convex, all sides congruent, all angles congruent." }],
            FS([polyFig(reg(6, 1.4, [0, 0], 0), { u: 22, cap: "regular" }), polyFig(ARROW, { u: 22, cap: "concave" })]))
        ]
      },
      /* ============================================================== 12 */
      {
        title: "Perimeter, circumference and area", v: 3,
        blurb: "How far round a figure is and how much it covers: the formulas for rectangles, squares, triangles and circles, on the coordinate plane too — and what happens when every length doubles.",
        mins: 14,
        steps: [
          drawn("geo1-polygon", 1, { kicker: "Remember?" }),
          { type: "learn", kicker: "Try it",
            prompt: "The **perimeter** of a polygon is the total length of its sides — the distance round it. Its **area** is the number of unit squares that cover it. **Drag** the sliders.",
            scene: { type: "rectangle", l: { v: 5, min: 1, max: 9 }, w: { v: 3, min: 1, max: 5 }, gate: true },
            gate: true,
            then: "Perimeter is a length (cm, in.). Area counts squares (cm², in.²). Try a 6 × 2 and a 4 × 4: the same perimeter, different areas." },
          { type: "learn", kicker: "The formulas",
            prompt: "Every formula here is a shortcut for adding up sides or counting squares.",
            scene: { type: "walk", rows: [
              { m: "P = 2ℓ + 2w,\\;\\; A = ℓ w", fig: plain([-0.6, 5], [-0.7, 3], [{ poly: [[0, 0], [4.2, 0], [4.2, 2.2], [0, 2.2]], c: "blue" }, { len: "ℓ", seg: [[0, 0], [4.2, 0]], side: -1, off: 13 }, { len: "w", seg: [[4.2, 0], [4.2, 2.2]], side: -1, off: 12 }], { u: 34, alt: "A rectangle with length l and width w." }),
                say: "**Rectangle**: two lengths and two widths round it; length × width squares inside." },
              { m: "P = 4s,\\;\\; A = s^2", fig: plain([-0.6, 3.3], [-0.7, 3.2], [{ poly: [[0, 0], [2.6, 0], [2.6, 2.6], [0, 2.6]], c: "blue" }, { len: "s", seg: [[0, 0], [2.6, 0]], side: -1, off: 13 }], { u: 34, alt: "A square with side s." }),
                say: "**Square**: four equal sides." },
              { m: "P = a + b + c,\\;\\; A = \\frac{1}{2}bh", fig: plain([-0.6, 5], [-0.7, 3], [{ poly: [[0, 0], [4.2, 0], [1.4, 2.4]], c: "blue" }, { seg: [[1.4, 2.4], [1.4, 0]], dash: "4 4", c: "orange" }, { angle: [[4.2, 0], [1.4, 0], [1.4, 2.4]], right: true, c: "orange" },
                  { len: "b", seg: [[0, 0], [4.2, 0]], side: -1, off: 13 }, { word: "h", at: [1.7, 1.1], anchor: "start", name: true, c: "orange" }], { u: 34, alt: "A triangle with base b and height h." }),
                say: "**Triangle**: add the three sides; the area is **half** of the rectangle with the same base and height." },
              { m: "C = 2\\pi r,\\;\\; A = \\pi r^2", fig: plain([-2.2, 2.2], [-2.1, 2.1], [{ circle: [[0, 0], 1.7] }, { seg: [[0, 0], [1.7, 0]], c: "orange" }, { pt: [0, 0] }, { len: "r", seg: [[0, 0], [1.7, 0]], side: 1, off: 11, c: "orange" }], { u: 34, alt: "A circle with radius r." }),
                say: "**Circle**: the distance round is its **circumference**. $\\pi \\approx 3.14$; use your calculator's $\\pi$ key." }] },
            gate: true },
          { type: "num", prompt: "A rectangle is $4.5$ cm long and $2.8$ cm wide. Find its perimeter.", skill: "Perimeter, circumference and area",
            answer: 14.6, post: "cm", label: "Perimeter",
            near: [{ v: 12.6, fb: "That's the area ($ℓ \\times w$). Perimeter adds the sides." }, { v: 7.3, fb: "That's one length and one width — half the way round." }],
            hints: ["$P = 2ℓ + 2w$."], why: "$P = 2(4.5) + 2(2.8) = 9 + 5.6 = 14.6$ cm." },
          { type: "num", prompt: "A circle has a radius of $4$ in. Find its area, to the nearest tenth.", skill: "Perimeter, circumference and area",
            art: plain([-2.2, 2.2], [-2.1, 2.1], [{ circle: [[0, 0], 1.7] }, { seg: [[0, 0], [1.7, 0]], c: "orange" }, { pt: [0, 0] }, { len: "4 in.", seg: [[0, 0], [1.7, 0]], side: 1, off: 11, c: "orange" }], { u: 34, alt: "A circle with radius 4 inches." }),
            answer: 50.3, tol: 0.051, post: "in.²", label: "Area",
            near: [{ v: 25.1, tol: 0.06, fb: "That's the circumference, $2\\pi r$. Area is $\\pi r^2$." }, { v: 16, fb: "That's $r^2$. Multiply by $\\pi$." }],
            hints: ["$A = \\pi r^2 = \\pi(4)^2$."], why: "$A = \\pi(4)^2 = 16\\pi \\approx 50.3$ in.²" },
          { type: "learn", kicker: "Watch",
            prompt: "On the coordinate plane, flat sides can be counted; slanted ones need the distance formula.",
            scene: { type: "walk", rows: [
              { m: "\\triangle ABC", fig: grid([-3, 5], [-2, 5], [{ poly: [[-2, 4], [-2, -1], [4, -1]], names: ["A", "B", "C"], c: "blue" }], { u: 24, alt: "Triangle ABC on a grid." }),
                say: "Find the perimeter and area of $\\triangle ABC$, with $A(-2, 4)$, $B(-2, -1)$ and $C(4, -1)$." },
              { m: "AB = 5,\\;\\; BC = 6", say: "$\\overline{AB}$ is straight up and down, $\\overline{BC}$ straight across: count the squares." },
              { m: "AC = \\sqrt{6^2 + 5^2} = \\sqrt{61} \\approx 7.8", say: "$\\overline{AC}$ is slanted: distance formula." },
              { m: "P \\approx 5 + 6 + 7.8 = 18.8", say: "Add the three sides." },
              { m: "A = \\frac{1}{2}(6)(5) = 15", say: "Base $BC = 6$, and the height is $AB = 5$, since $\\overline{AB}$ stands square on the base." }] },
            gate: true },
          { type: "num", prompt: "Find the perimeter of $\\triangle DEF$ with $D(0, 4)$, $E(-3, 0)$ and $F(5, 0)$, to the nearest tenth.", skill: "Perimeter, circumference and area",
            art: grid([-4, 6], [-1, 5], [{ poly: [[0, 4], [-3, 0], [5, 0]], names: ["D", "E", "F"], c: "blue" }], { u: 24, alt: "Triangle DEF on a grid." }),
            answer: 19.4, tol: 0.051, label: "Perimeter",
            near: [{ v: 16, fb: "That's the area. The perimeter adds the three sides." }, { v: 21, tol: 0.1, fb: "The slanted sides aren't across-plus-up. $DE = \\sqrt{3^2 + 4^2}$." }],
            hints: ["$EF = 8$ by counting. $DE = \\sqrt{3^2 + 4^2}$ and $DF = \\sqrt{5^2 + 4^2}$."],
            why: "$DE = 5$, $EF = 8$, $DF = \\sqrt{41} \\approx 6.4$: $P \\approx 19.4$." },
          { type: "choice", kicker: "Put it together", prompt: "You have $30$ m of fence. Which of these pens uses no more than that and encloses the **most** area?", skill: "Perimeter, circumference and area",
            options: [{ t: "A circle with radius $4.7$ m" }, { t: "A square with sides of $7.5$ m", fb: "That uses 30 m and encloses $56.25$ m². The circle, using $29.5$ m, holds about $69.4$ m²." },
                      { t: "A rectangle $12$ m by $3$ m", fb: "30 m of fence, but only $36$ m² inside — long thin shapes waste fence." },
                      { t: "A right triangle with legs $8$ m and $6$ m", fb: "Its perimeter is $8 + 6 + 10 = 24$ m, but its area is only $24$ m²." }],
            answer: 0,
            hints: ["Work out each perimeter (it must be at most 30) and each area.", "Circle: $C = 2\\pi(4.7) \\approx 29.5$, $A = \\pi(4.7)^2 \\approx 69.4$."],
            why: "Circle: about $29.5$ m of fence for $69.4$ m². Square: $56.25$ m². Rectangle: $36$ m². Triangle: $24$ m². For a given length of fence, a circle always encloses the most." },
          { type: "learn", kicker: "Double it",
            prompt: "What happens when every length of a figure is doubled?",
            scene: { type: "walk", rows: [
              { m: "4 \\times 2.5:\\;\\; P = 13,\\; A = 10", fig: plain([-0.4, 8.4], [-0.4, 5.4], [{ poly: [[0, 0], [4, 0], [4, 2.5], [0, 2.5]], c: "soft" }], { u: 26, alt: "A 4 by 2.5 rectangle." }),
                say: "A rectangle 4 ft by 2.5 ft." },
              { m: "8 \\times 5:\\;\\; P = 26,\\; A = 40", fig: plain([-0.4, 8.4], [-0.4, 5.4], [{ poly: [[0, 0], [8, 0], [8, 5], [0, 5]], c: "blue" }, { poly: [[0, 0], [4, 0], [4, 2.5], [0, 2.5]], c: "soft" }], { u: 26, alt: "The rectangle doubled to 8 by 5, with the original inside it." }),
                say: "Double both: the perimeter doubles, but the area is **4 times** as big — four copies of the old rectangle fit inside." },
              { say: "Multiply every length by $k$: the perimeter is multiplied by $k$, the area by $k^2$." }] },
            gate: true },
          { type: "num", prompt: "A square has an area of $49$ square inches. What is its perimeter?", skill: "Perimeter, circumference and area",
            answer: 28, post: "in.", label: "Perimeter",
            near: [{ v: 7, fb: "That's one side. The perimeter is all four." }, { v: 12.25, fb: "Find the side first: which number squared makes 49?" }],
            hints: ["The side is $\\sqrt{49}$.", "Then $P = 4s$."], why: "$s = \\sqrt{49} = 7$, so $P = 4(7) = 28$ in." },
          recap([
            { say: "**Perimeter**: the sum of the sides. **Circumference**: the distance round a circle. **Area**: the unit squares that cover it." },
            { m: "P = 2ℓ + 2w,\\; A = ℓ w", say: "Rectangle — and square: $P = 4s$, $A = s^2$." },
            { m: "A = \\frac{1}{2}bh", say: "Triangle. **Circle**: $C = 2\\pi r$, $A = \\pi r^2$." },
            { say: "On a grid: count flat sides, use the distance formula for slanted ones. Scale lengths by $k$: perimeter ×$k$, area ×$k^2$." }])
        ]
      },
      /* ============================================================== 13 */
      {
        title: "Three-dimensional figures", v: 3,
        blurb: "Solids with flat faces — prisms, pyramids and the five Platonic solids — and the round ones; faces, edges and vertices, Euler's formula, and nets.",
        mins: 13,
        steps: [
          drawn("geo1-perim", 1, { kicker: "Remember?" }),
          { type: "learn", kicker: "Turn it",
            prompt: "A **polyhedron** is a solid whose surfaces are all flat polygons. **Drag** this one round.",
            scene: { type: "solid3", shape: "prism", n: 5, r: 1.35, h: 2.2, rot: 0.3, size: 340, sizeH: 290, scale: 66, counts: true, gate: true },
            gate: true,
            then: "Each flat surface is a **face**. Two faces meet in an **edge**, and edges meet at a **vertex** (plural: vertices)." },
          { type: "learn", kicker: "Prisms and pyramids",
            prompt: "Two families of polyhedra, each named by the shape of its **base** (orange).",
            art: FS([GT.solid({ shape: "prism", n: 3, r: 1.3, h: 2.2, rot: 0.3, size: 150, scale: 38, cap: "Triangular prism" }), GT.solid({ shape: "box", w: 2.8, h: 1.8, d: 1.8, size: 150, scale: 38, cap: "Rectangular prism" }),
                     GT.solid({ shape: "prism", n: 5, r: 1.3, h: 2.2, rot: 0.3, size: 150, scale: 38, cap: "Pentagonal prism" }), GT.solid({ shape: "pyramid", n: 3, r: 1.5, h: 2.4, size: 150, scale: 38, cap: "Triangular pyramid" }),
                     GT.solid({ shape: "pyramid", n: 4, r: 1.5, h: 2.4, size: 150, scale: 38, cap: "Square pyramid" }), GT.solid({ shape: "pyramid", n: 6, r: 1.5, h: 2.4, size: 150, scale: 38, cap: "Hexagonal pyramid" })]),
            after: "A **prism** has two bases that are congruent polygons in parallel planes, joined by rectangles. (A cube is a **regular prism**: its bases are regular polygons.) A **pyramid** has one base; every other face is a triangle, and they all meet at one vertex. <br><br>A prism can lie on its side — its bases are still the two congruent parallel faces, wherever they are." },
          { type: "choice", prompt: "Identify this solid.", skill: "Three-dimensional figures",
            art: GT.solid({ shape: "pyramid", n: 6, r: 1.5, h: 2.4, size: 200, scale: 50, alt: "A pyramid with a six-sided base." }),
            options: [{ t: "Hexagonal pyramid" }, { t: "Hexagonal prism", fb: "A prism has **two** bases. This has one, with triangles meeting at the top." },
                      { t: "Pentagonal pyramid", fb: "Count the base's sides: six." }],
            answer: 0, hints: ["One base or two? And how many sides does it have?"], why: "One six-sided base, triangles meeting at a point: a hexagonal pyramid." },
          { type: "learn", kicker: "Five perfect solids",
            prompt: "A **regular polyhedron** has faces that are all the same regular polygon, meeting the same way at every vertex. There are exactly **five** — the **Platonic solids**, after the Greek philosopher Plato.",
            art: FS([["tetra", "Tetrahedron: 4 triangles"], ["cube", "Cube (hexahedron): 6 squares"], ["octa", "Octahedron: 8 triangles"], ["dodeca", "Dodecahedron: 12 pentagons"], ["icosa", "Icosahedron: 20 triangles"]].map(function (p) {
              return GT.solid({ shape: p[0], s: 2, size: 150, scale: 40, cap: p[1], alt: "A " + p[1] + "." }); })) },
          { type: "learn", kicker: "Round solids",
            prompt: "Some solids have curved surfaces, so they're **not** polyhedra.",
            art: FS([GT.solid({ shape: "cylinder", r: 1.1, h: 2, size: 150, scale: 42, cap: "**Cylinder**: two congruent circular bases in parallel planes" }),
                     GT.solid({ shape: "cone", r: 1.2, h: 2.2, size: 150, scale: 42, cap: "**Cone**: one circular base and a vertex" }),
                     GT.solid({ shape: "sphere", r: 1.4, size: 150, scale: 42, cap: "**Sphere**: every point the same distance from the centre" })]) },
          { type: "sort", prompt: "Sort each solid.",
            bins: ["Polyhedron", "Not a polyhedron"],
            cards: [{ t: "Cube", bin: 0, fb: "Six flat square faces." }, { t: "Square pyramid", bin: 0, fb: "All flat faces: a square and four triangles." }, { t: "Triangular prism", bin: 0, fb: "All flat faces." },
                    { t: "Cone", bin: 1, fb: "Its side is curved." }, { t: "Cylinder", bin: 1, fb: "Its side is curved and its bases are circles." }, { t: "Sphere", bin: 1, fb: "No flat faces at all." }],
            skill: "Three-dimensional figures", why: "Flat polygon faces only: polyhedron. Any curved surface: not." },
          { type: "learn", kicker: "A pattern",
            prompt: "Count faces, vertices and edges for a few polyhedra. Something always happens. **Turn** this one to check it.",
            scene: { type: "solid3", shape: "octa", size: 320, sizeH: 280, scale: 70, counts: true, euler: true, gate: true },
            gate: true,
            then: "Cube: $6 + 8 = 12 + 2$. Tetrahedron: $4 + 4 = 6 + 2$. Every polyhedron like these obeys **Euler's formula**: $F + V = E + 2$." },
          { type: "num", prompt: "A polyhedron has 12 vertices and 30 edges. How many faces does it have?", skill: "Three-dimensional figures",
            answer: 20, label: "Faces",
            near: [{ v: 16, fb: "Check the formula: $F + V = E + 2$, so $F = E + 2 - V$." }, { v: 44, fb: "The 2 goes with the edges: $F + 12 = 30 + 2$." }],
            hints: ["$F + V = E + 2$: $F + 12 = 30 + 2$."], why: "$F = 32 - 12 = 20$ — an icosahedron." },
          { type: "learn", kicker: "Flat patterns",
            prompt: "Cut a cardboard box along some edges and lay it flat: you get its **net**. Fold a net up and you get the solid back.",
            art: FS([plain([-0.3, 4.3], [-0.3, 3.3], [[0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [1, 0]].map(function (q) { return { poly: [q, [q[0] + 1, q[1]], [q[0] + 1, q[1] + 1], [q[0], q[1] + 1]], c: "blue" }; }), { u: 34, cap: "A net of a cube: six squares" }),
                     plain([-0.3, 5.1], [-0.7, 3.7], [{ poly: [[0, 1], [4.8, 1], [4.8, 2], [0, 2]], c: "blue" }, { seg: [[1.6, 1], [1.6, 2]], c: "blue" }, { seg: [[3.2, 1], [3.2, 2]], c: "blue" },
                       { poly: [[1.6, 2], [3.2, 2], [2.4, 3.386]], c: "orange" }, { poly: [[1.6, 1], [3.2, 1], [2.4, -0.386]], c: "orange" }], { u: 34, cap: "A net of a triangular prism" })]),
            after: "A drawing can also show a solid as flat **views** — from the top, the front and the side. Architects call that an orthographic drawing." },
          { type: "choice", prompt: "Which of these nets folds up into a cube?", skill: "Three-dimensional figures",
            options: [{ t: plain([-0.3, 4.3], [-0.3, 3.3], [[0, 1], [1, 1], [2, 1], [3, 1], [2, 2], [0, 0]].map(function (q) { return { poly: [q, [q[0] + 1, q[1]], [q[0] + 1, q[1] + 1], [q[0], q[1] + 1]], c: "blue" }; }), { u: 26, alt: "Four squares in a row, one above the third and one below the first." }) },
                      { t: plain([-0.3, 3.3], [-0.3, 2.3], [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]].map(function (q) { return { poly: [q, [q[0] + 1, q[1]], [q[0] + 1, q[1] + 1], [q[0], q[1] + 1]], c: "blue" }; }), { u: 26, alt: "A 2 by 3 block of squares." }),
                        fb: "Fold it: the middle column's squares land on top of each other and two faces are left open." },
                      { t: plain([-0.3, 5.3], [-0.3, 2.3], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [1, 1]].map(function (q) { return { poly: [q, [q[0] + 1, q[1]], [q[0] + 1, q[1] + 1], [q[0], q[1] + 1]], c: "blue" }; }), { u: 26, alt: "Five squares in a row and one above the second." }),
                        fb: "Five in a row wrap round and the fifth lands on the first — a cube only has four faces round its middle." }],
            answer: 0,
            hints: ["Picture folding: four squares in a row wrap round the middle of a cube; you need one square on each end to close the top and bottom."],
            why: "Four in a row wrap round the sides, and the other two fold up and down to make the top and bottom." },
          recap([
            { say: "A **polyhedron** has flat polygon **faces**, meeting in **edges**, which meet at **vertices**." },
            { say: "**Prism**: two congruent parallel bases. **Pyramid**: one base and a top vertex. Named by the base." },
            { say: "Five **Platonic solids**: tetrahedron, cube, octahedron, dodecahedron, icosahedron. Cylinders, cones and spheres aren't polyhedra." },
            { m: "F + V = E + 2", say: "Euler's formula. And a **net** is a solid unfolded flat." }],
            FS([GT.solid({ shape: "prism", n: 5, r: 1.3, h: 2.2, rot: 0.3, size: 130, scale: 34 }), GT.solid({ shape: "pyramid", n: 4, r: 1.5, h: 2.4, size: 130, scale: 34 }), GT.solid({ shape: "icosa", size: 130, scale: 36 })]))
        ]
      },
      /* ============================================================== 14 */
      {
        title: "Surface area and volume", v: 3,
        blurb: "How much wrapping a solid needs and how much it holds: prisms, pyramids, cylinders and cones — and why a pyramid holds a third of a prism.",
        mins: 14,
        steps: [
          drawn("geo1-solids", 2, { kicker: "Remember?" }),
          { type: "learn", kicker: "Two measures",
            prompt: "The **surface area** of a solid is the total area of all its surfaces — the wrapping paper. Unfold a box into its net and add the faces:",
            art: FS([boxDims(5, 4, 3, ["5 cm", "4 cm", "3 cm"], { u: 34 }),
                     plain([-0.3, 11.3], [-0.3, 14.3], [[[3, 0], 5, 3], [[3, 3], 5, 4], [[3, 7], 5, 3], [[3, 10], 5, 4], [[0, 3], 3, 4], [[8, 3], 3, 4]].map(function (f) {
                       return { poly: [f[0], [f[0][0] + f[1], f[0][1]], [f[0][0] + f[1], f[0][1] + f[2]], [f[0][0], f[0][1] + f[2]]], c: "blue" }; })
                       .concat([{ word: "15", at: [5.5, 1.5] }, { word: "20", at: [5.5, 5] }, { word: "15", at: [5.5, 8.5] }, { word: "20", at: [5.5, 12] }, { word: "12", at: [1.5, 5] }, { word: "12", at: [9.5, 5] }]), { u: 16, alt: "The box unfolded into its net: faces of 15, 20, 15, 12, 12 and 20 square centimetres." })]),
            after: "Six faces in three matching pairs: $2(20 + 15 + 12) = 94$ cm². Its **volume** is the space inside, counted in unit cubes: $5 \\times 3 \\times 4 = 60$ cm³." },
          { type: "learn", kicker: "Try it",
            prompt: "Volume counts cubes. **Drag** the slider to build a bigger cube and watch the count.",
            scene: { type: "solid", edge: 2, max: 5, gate: true },
            gate: true,
            then: "Each layer is the base's area in cubes, and there are as many layers as the height: **volume = base area × height**." },
          { type: "learn", kicker: "The formulas",
            prompt: "$B$ is the area of a base, $P$ its perimeter, $h$ the height, $ℓ$ the **slant height** (up the middle of a sloping face), $r$ the radius.",
            scene: { type: "walk", rows: [
              { m: "T = Ph + 2B,\\;\\; V = Bh", fig: boxDims(5, 4, 3, ["", "h", ""], { u: 22 }), say: "**Prism**: the sides unroll into one rectangle $P$ wide and $h$ tall, plus two bases. Volume: base × height." },
              { m: "T = \\frac{1}{2}Pℓ + B,\\;\\; V = \\frac{1}{3}Bh", fig: pyrDims({ h: "h", l: "ℓ" }, { u: 30 }), say: "**Pyramid**: triangles $\\frac{1}{2} \\times$ base × $ℓ$ each, plus one base. It holds exactly **a third** of the prism with the same base and height — three of them fill it." },
              { m: "T = 2\\pi rh + 2\\pi r^2,\\;\\; V = \\pi r^2 h", fig: GT.solid({ shape: "cylinder", r: 1, h: 1.9, labels: { r: "r", h: "h" }, size: 160, scale: 44 }), say: "**Cylinder**: the side unrolls into a rectangle $2\\pi r$ long; two circles on the ends. Volume: base × height, like a prism." },
              { m: "T = \\pi rℓ + \\pi r^2,\\;\\; V = \\frac{1}{3}\\pi r^2 h", fig: GT.solid({ shape: "cone", r: 1.1, h: 2, labels: { h: "h", r: "r", l: "ℓ" }, size: 160, scale: 44 }), say: "**Cone**: a third of the cylinder, just as a pyramid is a third of a prism." }] },
            gate: true },
          { type: "num", prompt: "Find the surface area of the box.", skill: "Surface area and volume", art: boxDims(6, 3, 4, ["6 in.", "3 in.", "4 in."]),
            answer: 108, post: "in.²", label: "Surface area",
            near: [{ v: 72, fb: "That's the volume. Surface area adds the six faces." }, { v: 54, fb: "That's only three faces. Each has a matching one opposite." }],
            hints: ["Pairs of faces: $6 \\times 4$, $4 \\times 3$ and $6 \\times 3$.", "$2(24 + 12 + 18)$."], why: "$T = 2(24 + 12 + 18) = 108$ in.²" },
          { type: "learn", kicker: "Watch",
            prompt: "A square pyramid with base edge 8 cm, height 3 cm and slant height 5 cm.",
            scene: { type: "walk", rows: [
              { m: "B = 64,\\; P = 32", fig: pyrDims({ s: "8 cm", h: "3 cm", l: "5 cm" }, { u: 34 }), say: "The base first: its area $8^2 = 64$ and its perimeter $4 \\times 8 = 32$." },
              { m: "T = \\frac{1}{2}(32)(5) + 64 = 144 \\text{ cm}^2", say: "Four triangles, each $\\frac{1}{2} \\times 8 \\times 5 = 20$, make $80$; add the base." },
              { m: "V = \\frac{1}{3}(64)(3) = 64 \\text{ cm}^3", say: "Volume uses the **height** (straight up), not the slant height." }] },
            gate: true },
          { type: "num", prompt: "A square pyramid has a base edge of $16$ m, a height of $6$ m and a slant height of $10$ m. Find its volume.", skill: "Surface area and volume",
            art: pyrDims({ s: "16 m", h: "6 m", l: "10 m" }), answer: 512, post: "m³", label: "Volume",
            near: [{ v: 1536, fb: "That's the prism with the same base and height. A pyramid holds a **third** of it." }, { v: 853.3, tol: 0.1, fb: "Volume uses the height, $6$ m — not the slant height." }],
            hints: ["$B = 16^2 = 256$.", "$V = \\frac{1}{3}Bh = \\frac{1}{3}(256)(6)$."], why: "$V = \\frac{1}{3}(256)(6) = 512$ m³." },
          { type: "num", prompt: "A cone-shaped paper cup is $8$ cm deep, and its rim has a radius of $3$ cm. How much does it hold, to the nearest tenth of a cubic centimetre?", skill: "Surface area and volume",
            art: GT.solid({ shape: "cone", r: 1.2, h: 2.2, labels: { r: "3 cm", h: "8 cm" }, size: 200, scale: 48, alt: "A cone with radius 3 and height 8." }),
            answer: 75.4, tol: 0.051, post: "cm³", label: "Volume",
            near: [{ v: 226.2, tol: 0.1, fb: "That's a cylinder. A cone holds a third: $\\frac{1}{3}\\pi r^2 h$." }, { v: 25.1, tol: 0.1, fb: "Square the radius: $r^2 = 9$." }],
            hints: ["$V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi(3)^2(8)$."], why: "$V = \\frac{1}{3}\\pi(9)(8) = 24\\pi \\approx 75.4$ cm³." },
          { type: "num", kicker: "Put it together", prompt: "A round water tank is $6$ ft across. It's filled to a depth of $2$ ft. How many cubic feet of water are in it, to the nearest tenth?", skill: "Surface area and volume",
            art: GT.solid({ shape: "cylinder", r: 1.3, h: 1.4, labels: { r: "3 ft", h: "2 ft" }, size: 220, scale: 50, alt: "The water in the tank: a cylinder of radius 3 and height 2." }),
            answer: 56.5, tol: 0.051, post: "ft³", label: "Water",
            near: [{ v: 226.2, tol: 0.1, fb: "6 ft is the **diameter**: the radius is 3." }, { v: 37.7, tol: 0.1, fb: "That's $2\\pi rh$, the side's area. Volume is $\\pi r^2 h$." }],
            hints: ["The water is a cylinder: radius $6 \\div 2 = 3$, height $2$.", "$V = \\pi(3)^2(2)$."], why: "$V = \\pi(3)^2(2) = 18\\pi \\approx 56.5$ ft³." },
          { type: "learn", kicker: "Double it",
            prompt: "Double every length of a box: $2 \\times 2 \\times 2$ — the volume is **8 times** as big, while the surface area is 4 times. Lengths ×2, areas ×4, volumes ×8.",
            art: FS([boxDims(2, 1, 1, ["2", "1", "1"], { u: 30, sc: 1 }), boxDims(4, 2, 2, ["4", "2", "2"], { u: 30, sc: 1 })]) },
          recap([
            { say: "**Surface area**: the area of every face added up — unfold it into a net. **Volume**: the unit cubes inside." },
            { m: "V = Bh", say: "Prisms and cylinders. Pyramids and cones hold a third: $V = \\frac{1}{3}Bh$." },
            { m: "T = Ph + 2B", say: "Prism; cylinder $2\\pi rh + 2\\pi r^2$. Pyramid $\\frac{1}{2}Pℓ + B$; cone $\\pi rℓ + \\pi r^2$." },
            { say: "Volume uses the height straight up; surface area of a pyramid or cone uses the slant height $ℓ$." }])
        ]
      },
      /* ============================================================== 15 */
      {
        title: "Unit review", v: 3,
        blurb: "Every tool of the unit on one card, then a mixed set where you choose the tool yourself.",
        mins: 16,
        steps: [
          { type: "learn", kicker: "Your toolkit",
            prompt: "The whole unit, on one card.",
            art: FS([
              plain([0, 8], [0, 3.8], [{ plane: sheet(0.5, 0.5, 5.2, 2.8, 1.8), name: "𝒫" }, { dline: [[1.1, 1.2], [6.2, 1.2]] }, { pt: [1.8, 1.2], name: "A", at: "s" }, { pt: [4.4, 1.2], name: "B", at: "s" }, { pt: [4.1, 2.8], name: "C", at: "n" }],
                { u: 24, cap: "**Point, line, plane**: the undefined terms. One line through 2 points, one plane through 3 noncollinear ones." }),
              segRow([["P", 0], ["M", 2.2], ["Q", 5.2]], { over: [[0, 1, "PM"], [1, 2, "MQ"]], under: [[0, 2, "PQ"]], u: 30, cap: "**Segments add**: $PM + MQ = PQ$. Precision: half the smallest unit." }),
              grid([-1, 7], [-1, 5], [{ seg: [[0, 0], [6, 4]], c: "blue" }].concat(legs([0, 0], [6, 4]).slice(0, 2)).concat([{ pt: [0, 0] }, { pt: [6, 4] }, { pt: [3, 2], c: "orange" }]), { u: 20, axes: false,
                cap: "**Distance** $\\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$; **midpoint** $\\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)$." }),
              GT.protractor({ a: 0, b: 65, names: ["", "", ""], w: 220, cap: "**Angles** in degrees: acute, right, obtuse. Read the scale that starts at your 0." }),
              xFig(58, { u: 24, cap: "**Vertical angles** are congruent; a **linear pair** adds to $180°$. Complementary $90°$, supplementary $180°$." }),
              GT.solid({ shape: "prism", n: 5, r: 1.3, h: 2.2, rot: 0.3, size: 150, scale: 36, cap: "**Solids**: $F + V = E + 2$; prism $V = Bh$, pyramid $V = \\frac{1}{3}Bh$." })]),
            after: "The next problems are mixed up, the way a test is: before you start each one, decide which tool it needs." }
        ].concat(["geo1-name", "geo1-ruler", "geo1-precision", "geo1-segadd", "geo1-dist", "geo1-mid", "geo1-midalg", "geo1-protractor", "geo1-angalg",
                  "geo1-pairs", "geo1-vertlin", "geo1-compsupp", "geo1-polygon", "geo1-perim", "geo1-solids", "geo1-sav"].map(function (id, i) { return drawn(id, 100 + i); }))
      },
    ],

    quizzes: QUIZZES,
    skills: SKILLS
  });
})();
