/* ==========================================================================
   Geometry — Unit 4: Triangle Congruence. See lab/core.js for the format
   and lab/geotools.js for the drawing kit.

   Follows Holt Geometry, Chapter 4, section for section (4-1 to 4-8), after
   a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   Classifying triangles (4-1), the angle sum and exterior angles (4-2),
   congruent triangles and corresponding parts (4-3), SSS and SAS (4-4),
   ASA, AAS and HL (4-5), CPCTC (4-6), coordinate proof (4-7), and isosceles
   and equilateral triangles (4-8). Figures mark congruent sides with ticks
   and congruent angles with arcs (shapes / polyItems).

   Lessons carry v: 4 (see Unit 1). Skills are hg4-….

   Nine lessons, eight skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  // Two triangles on a shared side: n[0] n[1] n[2] above it and n[0] n[3] n[2] below. Marks are listed for
  // the vertices in the order n[0], n[2], then the far vertex (sides: shared, n[2]–far, far–n[0]).
  function kite(B, m1, m2, alt, n) {
    n = n || "ABCD";
    var A = [0, 0], C = [5, 0], D = [B[0], -B[1]];
    return shapes([[[A, C, B], Object.assign({ names: [n[0], n[2], n[1]] }, m1)], [[A, C, D], Object.assign({ names: [null, null, n[3]], c: "green" }, m2 || m1)]], { alt: alt });
  }
  // Two triangles meeting at a point: n[0] n[2] n[1] and n[4] n[2] n[3], with n[0]–n[2]–n[4] and n[1]–n[2]–n[3] straight.
  function bowtie(n, alt, o) {
    o = o || {};
    var E = [0, 0], A = [-2.6, 1.6], D = [2.6, -1.6], B = [-2.6, -1.3], C = [2.6, 1.3], t = o.ticks === false ? [0, 0] : [1, 2];
    return plain([-3.6, 3.6], [-2.5, 2.5], [
      { seg: [A, E], marks: t[0], c: "blue" }, { seg: [E, D], marks: t[0], c: "green" }, { seg: [B, E], marks: t[1], c: "blue" }, { seg: [E, C], marks: t[1], c: "green" },
      { seg: [A, B], c: "blue" }, { seg: [D, C], c: "green" }].concat(o.extra || [],
      [{ pt: A, name: n[0], at: "nw" }, { pt: B, name: n[1], at: "sw" }, { pt: E, name: n[2], at: "n" }, { pt: C, name: n[3], at: "ne" }, { pt: D, name: n[4], at: "se" }]), { u: 30, alt: alt });
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
    blurb: "Before Chapter 4 · Kinds of angle, equations, and distance and midpoint.",
    mins: 6, v: 4,
    steps: [
      { type: "choice", kicker: "Check 1 · Angles", prompt: "An angle measures 124°. What kind of angle is it?",
        options: [{ t: "Obtuse" }, { t: "Acute", fb: "Acute angles are less than 90°." }, { t: "Right", fb: "A right angle is exactly 90°." }],
        answer: 0, skill: "Classify angles", hints: ["Compare it with 90°."], why: "Between 90° and 180°: obtuse." },
      { type: "num", prompt: "Two angles measure 35° and 65°. What third angle brings the total to 180°?", post: "°", answer: 80, skill: "Angle sums",
        near: [{ v: 100, fb: "That is the sum of the two. Subtract it from 180." }], hints: ["$180 - 35 - 65$."], why: "$180 - 100 = 80$." },
      { type: "num", kicker: "Check 2 · Equations", prompt: "Solve $x + 2x + 3x = 180$.", pre: "$x =$", answer: 30, skill: "Solve an equation",
        near: [{ v: 60, fb: "$x + 2x + 3x = 6x$." }], hints: ["$6x = 180$."], why: "$6x = 180$, so $x = 30$." },
      { type: "num", prompt: "Solve $2x + 5 = x + 12$.", pre: "$x =$", answer: 7, skill: "Solve an equation",
        near: [{ v: 17, fb: "Subtract 5 from both sides, not add." }], hints: ["Subtract $x$ and subtract 5."], why: "$x = 7$." },
      { type: "num", kicker: "Check 3 · Distance and midpoint", prompt: "Find the distance between $(0, 0)$ and $(3, 4)$.", answer: 5, skill: "Distance Formula",
        near: [{ v: 7, fb: "Square each difference, add, then take the root." }], hints: ["$\\sqrt{3^2 + 4^2}$."], why: "$\\sqrt{25} = 5$." },
      { type: "pair", prompt: "Find the midpoint of the segment from $(2, 6)$ to $(8, 2)$. Type it as $(x, y)$.", answer: [5, 4], skill: "Midpoint Formula",
        near: [{ v: [10, 8], fb: "Those are the sums. Divide each by 2." }], hints: ["Average the $x$s and average the $y$s."], why: "$\\left(\\frac{10}{2}, \\frac{8}{2}\\right) = (5, 4)$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 4-1**. If **check 1** slipped, see lesson 1-3. If **check 3** slipped, see lesson 1-6.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ================================================= 4-1 · Classifying triangles */
  var HOW_4_1 = [["Angles", "Look at the angles. All three acute: acute. One right angle: right. One obtuse angle: obtuse. All three congruent: equiangular."],
                 ["Sides", "Count the congruent sides. Three: equilateral. At least two: isosceles. None: scalene."],
                 ["Name", "Put the two names together, such as a right scalene triangle."]];
  var FIG_OBT = tri([[0, 0], [5, 0], [2.5, 1.45]], { names: "ABC", ticks: [0, 1, 1], angs: [null, null, "120°"] }, "Triangle ABC. Sides BC and CA each carry one tick mark. The angle at C is 120 degrees."),
      FIG_345 = tri([[0, 0], [4, 0], [0, 3]], { names: "PQR", right: [0], sides: ["4", "5", "3"] }, "Triangle PQR with a right angle at P. PQ is 4, QR is 5 and RP is 3."),
      FIG_LEGS = tri([[0, 0], [3, 0], [1.5, 4.1]], { names: "ABC", ticks: [0, 1, 1], sides: ["x + 4", "2x + 3", "4x − 7"] }, "Triangle ABC. Sides BC and CA each carry one tick mark. AB is x + 4, BC is 2x + 3 and CA is 4x − 7."),
      FIG_EQ = tri([[0, 0], [4, 0], [2, 3.46]], { names: "JKL", ticks: [1, 1, 1], sides: ["3x − 2", "x + 8", null] }, "Triangle JKL with one tick mark on every side. JK is 3x − 2 and KL is x + 8.");
  LESSONS.push({
    title: "Classifying triangles",
    blurb: "Book 4-1 · Name a triangle by its angles and by its sides, and use the name to find lengths.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which of these is an obtuse angle?",
        options: [{ t: "$115°$" }, { t: "$90°$", fb: "Exactly 90° is a right angle." }, { t: "$75°$", fb: "Less than 90° is acute." }],
        answer: 0, skill: "Classify angles", hints: ["Obtuse: more than 90° and less than 180°."], why: "115° is between 90° and 180°." },
      { type: "learn", kicker: "The idea",
        prompt: "A triangle gets two names. One comes from its **angles**: acute, right, obtuse or equiangular. The other comes from its **sides**: equilateral, isosceles or scalene. Matching tick marks show congruent sides.",
        scene: { type: "method", how: HOW_4_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this triangle get both of its names.",
        scene: { type: "walk", how: HOW_4_1, rows: [
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
        how: HOW_4_1, skill: "Classify triangles",
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

  /* ===================================== 4-2 · Angle relationships in triangles */
  var HOW_4_2 = [["Sum", "The three angle measures of a triangle add to 180°."],
                 ["Equation", "Write the sum as an equation, with a letter for what is missing."],
                 ["Solve", "Solve it, then check that the three measures add to 180°."]];
  var FIG_SUM = tri([[0, 0], [5, 0], [3.49, 3.74]], { names: "ABC", angs: ["47°", "68°", "x°"] }, "Triangle ABC. The angle at A is 47 degrees, the angle at B is 68 degrees and the angle at C is x degrees."),
      FIG_SUMX = tri([[0, 0], [5, 0], [2.7, 4.2]], { names: "DEF", angs: ["(2x + 10)°", "(3x − 5)°", "60°"] }, "Triangle DEF. The angle at D is 2x + 10 degrees, the angle at E is 3x − 5 degrees and the angle at F is 60 degrees.", { u: 34 });
  function extFig(P, angs, say, alt) {
    var D = [P[1][0] + 2.4, 0];
    return shapes([[P, { names: "ABC", angs: angs }]], { alt: alt, pts: [D], extra: [{ seg: [P[1], D] }, { angle: [D, P[1], P[2]], say: say, c: "green" }, { pt: D, name: "D", at: "s" }] });
  }
  var FIG_EXT = extFig([[0, 0], [4, 0], [2, 2.86]], ["55°", null, "70°"], "?", "Triangle ABC with side AB extended past B to D. The angle at A is 55 degrees and the angle at C is 70 degrees. The exterior angle CBD is marked with a question mark."),
      FIG_EXTX = extFig([[0, 0], [4, 0], [3.31, 3.94]], ["50°", null, "(2x + 10)°"], "(5x)°", "Triangle ABC with side AB extended past B to D. The angle at A is 50 degrees, the angle at C is 2x + 10 degrees, and the exterior angle CBD is 5x degrees.");
  LESSONS.push({
    title: "Angle relationships in triangles",
    blurb: "Book 4-2 · The angles of a triangle add to 180°, and an exterior angle equals its two remote interior angles.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $x + 62 + 48 = 180$.", pre: "$x =$", answer: 70, skill: "Solve an equation",
        near: [{ v: 110, fb: "That is $62 + 48$. Subtract it from 180." }], hints: ["$x + 110 = 180$."], why: "$180 - 110 = 70$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Triangle Sum Theorem:** the angle measures of a triangle add to 180°. Why? Draw a line through one vertex, parallel to the opposite side. Alternate interior angles carry the other two angles up beside the third, and the three fill a straight line.",
        scene: { type: "method", how: HOW_4_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the third angle found.",
        scene: { type: "walk", how: HOW_4_2, rows: [
          { step: 1, m: "m\\angle A + m\\angle B + m\\angle C = 180°", say: "The Triangle Sum Theorem.", fig: FIG_SUM },
          { step: 2, m: "47 + 68 + x = 180", say: "Put in the two measures you know." },
          { step: 3, m: "115 + x = 180", say: "Add the two.",
            ask: { prompt: "What is $47 + 68$?", answer: 0,
                   options: [{ t: "115" }, { t: "105", fb: "$40 + 60 = 100$ and $7 + 8 = 15$." }] } },
          { step: 3, m: "x = 65", say: "Check: $47 + 68 + 65 = 180$." }] },
        gate: true, then: "Two angles always give you the third." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find $x$, and then the angle at $E$.", art: FIG_SUMX,
        how: HOW_4_2, skill: "Triangle Sum Theorem",
        steps: [
          { step: 1, ask: "What do the three measures add to?", type: "num", answer: 180, hint: "The Triangle Sum Theorem.",
            m: "(2x + 10) + (3x - 5) + 60 = 180", say: "The Triangle Sum Theorem." },
          { step: 2, ask: "Collect like terms. Which equation do you get?", type: "choice", answer: 0,
            options: [{ t: "$5x + 65 = 180$" }, { t: "$5x + 75 = 180$", fb: "$10 - 5 + 60 = 65$." }, { t: "$6x + 65 = 180$", fb: "$2x + 3x = 5x$." }],
            m: "5x + 65 = 180", say: "$2x + 3x = 5x$ and $10 - 5 + 60 = 65$." },
          { step: 3, ask: "Solve for $x$.", type: "num", answer: 23, near: [{ v: 49, fb: "Subtract 65, do not add it: $5x = 115$." }], hint: "$5x = 115$.",
            m: "x = 23", say: "$5x = 115$." },
          { step: 3, ask: "Find the angle at $E$: $(3x - 5)°$.", type: "num", answer: 64, near: [{ v: 56, fb: "That is $2x + 10$, the angle at $D$." }], hint: "$3(23) - 5$.",
            m: "3(23) - 5 = 64", say: "The angle at $D$ is 56°, and $56 + 64 + 60 = 180$." }],
        why: "Sum, equation, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "In a right triangle, one acute angle measures 37°. Find the other acute angle.", post: "°", answer: 53, skill: "Triangle Sum Theorem",
        near: [{ v: 143, fb: "The right angle uses 90° of the 180°. The two acute angles share the other 90°." }],
        hints: ["The acute angles of a right triangle are complementary."], why: "$90 - 37 = 53$." },
      { type: "num", prompt: "In $\\triangle ABC$ and $\\triangle DEF$, $\\angle A \\cong \\angle D$ and $\\angle B \\cong \\angle E$. $m\\angle A = 50°$ and $m\\angle B = 70°$. Find $m\\angle F$.", post: "°", answer: 60, skill: "Third Angles Theorem",
        near: [{ v: 120, fb: "That is $50 + 70$. The third angle is what is left of 180°." }],
        hints: ["Third Angles Theorem: if two pairs of angles are congruent, the third pair is congruent as well."], why: "$\\angle F \\cong \\angle C$, and $m\\angle C = 180 - 50 - 70 = 60°$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Extend a side and you make an **exterior angle**. Its two **remote interior angles** are the angles of the triangle that are not next to it. Find $m\\angle CBD$.",
        scene: { type: "walk", how: [["Remote", "Find the two remote interior angles: the ones not next to the exterior angle."], ["Add", "The exterior angle equals their sum."], ["Solve", "Work out the sum, or solve for the unknown."]], rows: [
          { step: 1, m: "\\angle A \\text{ and } \\angle C", say: "The remote interior angles: the two that do not touch $B$.", fig: FIG_EXT },
          { step: 2, m: "m\\angle CBD = m\\angle A + m\\angle C", say: "The Exterior Angle Theorem." },
          { step: 3, m: "m\\angle CBD = 55° + 70° = 125°", say: "Add the remote interior angles.",
            ask: { prompt: "Check it another way. The angle inside the triangle at $B$ is $180 - 55 - 70 = 55°$. What is the angle beside it on the line?", answer: 0,
                   options: [{ t: "$125°$" }, { t: "$55°$", fb: "A linear pair adds to 180°: $180 - 55$." }] } },
          { step: 3, m: "180° - 55° = 125°", say: "The same answer, from the linear pair." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find $x$.", art: FIG_EXTX, pre: "$x =$", answer: 20, skill: "Exterior Angle Theorem",
        near: [{ v: 120 / 7, tol: 0.01, fb: "The exterior angle **equals** the sum of the remote interior angles. It does not add with them to 180°." }],
        hints: ["$5x = 50 + (2x + 10)$."], why: "$5x = 2x + 60$, so $3x = 60$ and $x = 20$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "The remote interior angles of an exterior angle measure 40° and 65°. Find the exterior angle. Tap the line where the work **first** goes wrong.",
        lines: ["\\text{remote interior angles } 40° \\text{ and } 65°", "\\text{exterior angle} = 180° - (40° + 65°)", "\\text{exterior angle} = 75°"], answer: 1, fix: "\\text{exterior angle} = 40° + 65°",
        fb: { 0: GIVEN, 2: LATER }, skill: "Exterior Angle Theorem",
        hints: ["Which angle does $180 - (40 + 65)$ find?"],
        why: "That finds the third angle inside the triangle. The exterior angle is the sum: $40 + 65 = 105°$." },
      { type: "num", kicker: "Use it", prompt: "A ladder leans against a vertical wall and makes a 72° angle with the level ground. What angle does the ladder make with the wall?", post: "°", answer: 18, skill: "Triangle Sum Theorem",
        near: [{ v: 108, fb: "The wall and the ground make a right angle, so the other two angles add to 90°." }],
        hints: ["Wall, ground and ladder make a right triangle."], why: "$90 - 72 = 18$." }
    ]
  });

  /* ====================================================== 4-3 · Congruent triangles */
  var HOW_4_3 = [["Order", "Read the congruence statement. The order of the letters tells you which vertices match."],
                 ["Angles", "Match the angles: first letter with first, second with second, third with third."],
                 ["Sides", "Match the sides the same way: the first two letters with the first two letters, and so on."]];
  var FIG_CONG = twoTris("ABC", "DEF", {}, {}, "Two triangles of the same size and shape, ABC and DEF."),
      FIG_PQR = twoTris("PQR", "XYZ", { sides: ["9"], angs: [null, "45°"] }, {}, "Two triangles of the same size and shape, PQR and XYZ. PQ is 9 and the angle at Q is 45 degrees."),
      FIG_KITE6 = kite([1.6, 1.9], { ticks: [0, 2, 1] }, null, "Kite ABCD with diagonal BD. AB and CB each carry one tick mark. AD and CD each carry two.", "BADC");
  LESSONS.push({
    title: "Congruent triangles",
    blurb: "Book 4-3 · Corresponding sides and angles, and what a congruence statement tells you.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$\\overline{AB} \\cong \\overline{CD}$ and $AB = 7$. What is $CD$?", answer: 7, skill: "Congruent segments",
        hints: ["Congruent segments have equal lengths."], why: "Congruent segments have the same length." },
      { type: "learn", kicker: "The idea",
        prompt: "Two triangles are **congruent** when all three pairs of **corresponding sides** and all three pairs of **corresponding angles** are congruent. The statement $\\triangle ABC \\cong \\triangle DEF$ lists the vertices in matching order: $A$ with $D$, $B$ with $E$, $C$ with $F$.",
        scene: { type: "method", how: HOW_4_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the six pairs of corresponding parts read from $\\triangle ABC \\cong \\triangle DEF$.",
        scene: { type: "walk", how: HOW_4_3, rows: [
          { step: 1, m: "\\triangle ABC \\cong \\triangle DEF", say: "$A$ matches $D$, $B$ matches $E$, $C$ matches $F$.", fig: FIG_CONG },
          { step: 2, m: "\\angle A \\cong \\angle D", say: "First letter with first letter.",
            ask: { prompt: "Which angle matches $\\angle A$?", answer: 0,
                   options: [{ t: "$\\angle D$" }, { t: "$\\angle F$", fb: "$A$ is the first letter, so its partner is the first letter of $DEF$." }] } },
          { step: 2, m: "\\angle B \\cong \\angle E \\qquad \\angle C \\cong \\angle F", say: "Second with second, third with third." },
          { step: 3, m: "\\overline{AB} \\cong \\overline{DE}", say: "The first two letters of each name." },
          { step: 3, m: "\\overline{BC} \\cong \\overline{EF} \\qquad \\overline{AC} \\cong \\overline{DF}", say: "The last two letters, then the first and last." }] },
        gate: true, then: "Six pairs in all: three of angles and three of sides." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $\\triangle PQR \\cong \\triangle XYZ$. Find $m\\angle Y$ and $XY$.", art: FIG_PQR,
        how: HOW_4_3, skill: "Corresponding parts",
        steps: [
          { step: 1, ask: "Which vertex of $\\triangle XYZ$ matches $Q$?", type: "choice", answer: 0,
            options: [{ t: "$Y$" }, { t: "$X$", fb: "$Q$ is the second letter of $PQR$." }, { t: "$Z$", fb: "$Q$ is the second letter of $PQR$." }],
            m: "Q \\to Y", say: "Second letter with second letter." },
          { step: 2, ask: "So what is $m\\angle Y$, in degrees?", type: "num", answer: 45, hint: "$\\angle Y$ matches $\\angle Q$.",
            m: "m\\angle Y = 45°", say: "$\\angle Q \\cong \\angle Y$." },
          { step: 3, ask: "Which side matches $\\overline{PQ}$?", type: "choice", answer: 0,
            options: [{ t: "$\\overline{XY}$" }, { t: "$\\overline{YZ}$", fb: "$P$ and $Q$ are the first two letters." }],
            m: "\\overline{PQ} \\cong \\overline{XY}", say: "First two letters with first two letters." },
          { step: 3, ask: "So what is $XY$?", type: "num", answer: 9, hint: "$\\overline{XY}$ matches $\\overline{PQ}$.",
            m: "XY = 9", say: "Congruent sides have equal lengths." }],
        why: "Order, angles, sides. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "$\\triangle JKL \\cong \\triangle MNP$. Match each part of $\\triangle JKL$ with its corresponding part.",
        slots: [{ id: "a", label: "Angle M" }, { id: "b", label: "Angle P" }, { id: "c", label: "Side MN" }, { id: "d", label: "Side NP" }],
        cards: [{ t: nb("$\\angle J$"), slot: "a", fb: "$J$ and $M$ are the first letters." }, { t: nb("$\\angle L$"), slot: "b", fb: "$L$ and $P$ are the third letters." },
                { t: nb("$\\overline{JK}$"), slot: "c", fb: "The first two letters of each name." }, { t: nb("$\\overline{KL}$"), slot: "d", fb: "The last two letters of each name." }],
        skill: "Corresponding parts", hints: ["$J$ matches $M$, $K$ matches $N$, $L$ matches $P$."],
        why: "The order of the letters does the matching." },
      { type: "num", prompt: "$\\triangle ABC \\cong \\triangle DEF$. $AB = 2x + 1$ and $DE = 15$. Find $x$.", pre: "$x =$", answer: 7, skill: "Corresponding parts",
        near: [{ v: 8, fb: "Subtract 1 before dividing: $2x = 14$." }], hints: ["$\\overline{AB}$ matches $\\overline{DE}$, so $2x + 1 = 15$."], why: "$2x = 14$, so $x = 7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "To **prove** triangles congruent from the definition, show all six pairs. Given: the tick marks, $\\angle A \\cong \\angle C$, and $\\overline{BD}$ bisects $\\angle ABC$ and $\\angle ADC$. Prove: $\\triangle ABD \\cong \\triangle CBD$.",
        scene: { type: "walk", how: [["Sides", "Show all three pairs of sides congruent."], ["Angles", "Show all three pairs of angles congruent."], ["Conclude", "Six pairs of congruent parts: the triangles are congruent, by definition."]], rows: [
          { step: 1, m: "\\overline{AB} \\cong \\overline{CB} \\qquad \\overline{AD} \\cong \\overline{CD}", say: "Given.", fig: FIG_KITE6 },
          { step: 1, m: "\\overline{BD} \\cong \\overline{BD}", say: "Reflexive Property: the two triangles share this side.",
            ask: { prompt: "Both triangles use side $\\overline{BD}$. Which property says a segment is congruent to itself?", answer: 0,
                   options: [{ t: "Reflexive" }, { t: "Symmetric", fb: "Symmetric swaps the two sides of a statement." }] } },
          { step: 2, m: "\\angle A \\cong \\angle C", say: "Given." },
          { step: 2, m: "\\angle ABD \\cong \\angle CBD \\qquad \\angle ADB \\cong \\angle CDB", say: "Definition of angle bisector." },
          { step: 3, m: "\\triangle ABD \\cong \\triangle CBD", say: "Definition of congruent triangles: all six pairs are congruent." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "$\\triangle RST \\cong \\triangle UVW$. Which statement must be true?",
        options: [{ t: "$\\overline{ST} \\cong \\overline{VW}$" }, { t: "$\\overline{RS} \\cong \\overline{VW}$", fb: "$\\overline{RS}$ matches $\\overline{UV}$: the first two letters." }, { t: "$\\angle R \\cong \\angle W$", fb: "$\\angle R$ matches $\\angle U$: the first letters." }],
        answer: 0, skill: "Corresponding parts", hints: ["$R$ matches $U$, $S$ matches $V$, $T$ matches $W$."], why: "$S$, $T$ and $V$, $W$ are the last two letters of each name." },
      { type: "choice", kicker: "Find the error",
        prompt: "In two triangles, $\\angle A \\cong \\angle X$, $\\angle B \\cong \\angle Z$ and $\\angle C \\cong \\angle Y$, and the matching sides are congruent. Maya writes $\\triangle ABC \\cong \\triangle XYZ$. What is wrong?",
        options: [{ t: "The order. $B$ matches $Z$ and $C$ matches $Y$, so it is $\\triangle ABC \\cong \\triangle XZY$." },
                  { t: "The triangles are not congruent.", fb: "All six pairs are congruent, so they are. Only the statement is wrong." },
                  { t: "Nothing. Any order will do.", fb: "The order of the letters says which vertices match." }],
        answer: 0, skill: "Corresponding parts", hints: ["Which vertex matches $B$?"], why: "The letters must be listed in matching order." },
      { type: "num", kicker: "Use it", prompt: "Two roof trusses are cut as congruent triangles: $\\triangle ABC \\cong \\triangle DEF$. $m\\angle A = 48°$ and $m\\angle E = 67°$. Find $m\\angle C$.", post: "°", answer: 65, skill: "Corresponding parts",
        near: [{ v: 67, fb: "$\\angle E$ matches $\\angle B$, not $\\angle C$." }],
        hints: ["$\\angle B \\cong \\angle E$, so $m\\angle B = 67°$.", "Then use the Triangle Sum Theorem."], why: "$180 - 48 - 67 = 65$." }
    ]
  });
  /* ============================================ 4-4 · Triangle congruence: SSS and SAS */
  var HOW_4_4 = [["Mark", "Mark what is given, and add any shared side or vertical angles."],
                 ["Count", "Three pairs of sides: SSS. Two pairs of sides and the angle between them: SAS."],
                 ["State", "Write the congruence, with the vertices in matching order."]];
  var PAR_A = [0, 0], PAR_B = [1.5, 2.6], PAR_C = [6, 2.6], PAR_D = [4.5, 0];
  var FIG_PAR = shapes([[[PAR_A, PAR_B, PAR_C, PAR_D], { names: "ABCD", ticks: [1, 2, 1, 2] }]], { extra: [{ seg: [PAR_A, PAR_C], c: "green" }],
        alt: "Quadrilateral ABCD with diagonal AC. AB and CD each carry one tick mark. BC and DA each carry two." }),
      FIG_BOW = bowtie("ABECD", "Segments AD and BC cross at E. AE and DE each carry one tick mark. BE and CE each carry two. A is joined to B, and D to C."),
      FIG_SAS = twoTris("ABC", "DEF", { ticks: [1, 0, 2], arcs: [1, 0, 0] }, null, "Triangles ABC and DEF. AB and DE carry one tick mark, CA and FD carry two, and the angles at A and D carry one arc."),
      FIG_SSA = twoTris("ABC", "DEF", { ticks: [1, 2, 0], arcs: [1, 0, 0] }, null, "Triangles ABC and DEF. AB and DE carry one tick mark, BC and EF carry two, and the angles at A and D carry one arc."),
      T_7810 = [[0, 0], [3.5, 0], [3.04, 3.97]],
      FIG_ALG = twoTris("ABC", "DEF", { sides: ["x + 3", "2x", "3x − 2"] }, { sides: ["7", "8", "10"] }, "Triangles ABC and DEF. AB is x + 3, BC is 2x and CA is 3x − 2. DE is 7, EF is 8 and FD is 10.", T_7810);
  LESSONS.push({
    title: "Triangle congruence: SSS and SAS",
    blurb: "Book 4-4 · Three pairs of sides, or two pairs of sides and the included angle, prove triangles congruent.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In $\\triangle ABC$, which angle is formed by sides $\\overline{AB}$ and $\\overline{BC}$?",
        options: [{ t: "$\\angle B$" }, { t: "$\\angle A$", fb: "$\\overline{BC}$ does not reach $A$." }, { t: "$\\angle C$", fb: "$\\overline{AB}$ does not reach $C$." }],
        answer: 0, skill: "Included angle", hints: ["Which point is on both sides?"], why: "Both sides end at $B$. $\\angle B$ is the **included angle** of those two sides." },
      { type: "learn", kicker: "The idea",
        prompt: "You do not need all six pairs. **SSS:** three pairs of congruent sides make triangles congruent, because three side lengths fix a triangle's shape. **SAS:** two pairs of sides and the **included angle**, the angle between them, are enough as well.",
        scene: { type: "method", how: HOW_4_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch SSS used. Given: $\\overline{AB} \\cong \\overline{CD}$ and $\\overline{BC} \\cong \\overline{DA}$.",
        scene: { type: "walk", how: HOW_4_4, rows: [
          { step: 1, m: "\\overline{AB} \\cong \\overline{CD} \\qquad \\overline{BC} \\cong \\overline{DA}", say: "Given, and marked with ticks.", fig: FIG_PAR },
          { step: 1, m: "\\overline{AC} \\cong \\overline{CA}", say: "Reflexive Property: both triangles use the diagonal.",
            ask: { prompt: "The two triangles share one side. Which?", answer: 0,
                   options: [{ t: "$\\overline{AC}$" }, { t: "$\\overline{BD}$", fb: "$\\overline{BD}$ is not drawn. The diagonal drawn is $\\overline{AC}$." }] } },
          { step: 2, m: "\\text{three pairs of sides: SSS}", say: "Side, side, side." },
          { step: 3, m: "\\triangle ABC \\cong \\triangle CDA", say: "$A$ matches $C$, $B$ matches $D$, and $C$ matches $A$." }] },
        gate: true, then: "A shared side counts: it is congruent to itself." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $\\overline{AD}$ and $\\overline{BC}$ cross at $E$. Use the tick marks to show $\\triangle AEB \\cong \\triangle DEC$.", art: FIG_BOW,
        how: HOW_4_4, skill: "SSS and SAS",
        steps: [
          { step: 1, ask: "Which angles are congruent without being given?", type: "choice", answer: 0,
            options: [{ t: "$\\angle AEB$ and $\\angle DEC$: they are vertical angles" }, { t: "$\\angle A$ and $\\angle D$", fb: "Nothing says so yet." }],
            m: "\\angle AEB \\cong \\angle DEC", say: "Vertical Angles Theorem." },
          { step: 2, ask: "Is $\\angle AEB$ between sides $\\overline{AE}$ and $\\overline{BE}$?", type: "choice", answer: 0,
            options: [{ t: "Yes: it is the included angle" }, { t: "No", fb: "Both sides end at $E$, the vertex of the angle." }],
            m: "\\text{side, included angle, side}", say: "The angle is between the two marked sides." },
          { step: 2, ask: "Which postulate fits?", type: "choice", answer: 0,
            options: [{ t: "SAS" }, { t: "SSS", fb: "Only two pairs of sides are known." }],
            m: "\\text{SAS}", say: "Side, angle, side." },
          { step: 3, ask: "Which statement has the vertices in matching order?", type: "choice", answer: 0,
            options: [{ t: "$\\triangle AEB \\cong \\triangle DEC$" }, { t: "$\\triangle AEB \\cong \\triangle CED$", fb: "$A$ matches $D$, because $\\overline{AE} \\cong \\overline{DE}$." }],
            m: "\\triangle AEB \\cong \\triangle DEC", say: "$A$ with $D$, $E$ with $E$, $B$ with $C$." }],
        why: "Mark, count, state. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Each card says what is known to be congruent in two triangles. Which postulate proves them congruent?",
        bins: ["SSS", "SAS", "Not enough"],
        cards: [{ t: "Three pairs of sides", bin: 0, fb: "Side, side, side." }, { t: "Two pairs of sides and the angle between them", bin: 1, fb: "The included angle: side, angle, side." },
                { t: "Two pairs of sides and an angle not between them", bin: 2, fb: "The angle must be the included one." }, { t: "Two pairs of sides and a shared third side", bin: 0, fb: "The shared side is congruent to itself." },
                { t: "Two pairs of sides that meet at vertical angles", bin: 1, fb: "The vertical angles are congruent, and they are included." }, { t: "Three pairs of angles", bin: 2, fb: "Angles fix the shape but not the size." }],
        skill: "SSS and SAS", hints: ["For SAS, the angle has to be between the two sides."],
        why: "SSS needs three sides. SAS needs the included angle." },
      { type: "choice", prompt: "Which postulate proves these triangles congruent?", art: FIG_SAS,
        options: [{ t: "SAS" }, { t: "SSS", fb: "Only two pairs of sides are marked." }, { t: "Neither", fb: "The marked angle is between the two marked sides." }],
        answer: 0, skill: "SSS and SAS", hints: ["Where is the marked angle?"], why: "The angle at $A$ is between $\\overline{AB}$ and $\\overline{CA}$: side, angle, side." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes the lengths are expressions. Show that $\\triangle ABC \\cong \\triangle DEF$ when $x = 4$.",
        scene: { type: "walk", how: [["Substitute", "Put the value in for each side."], ["Compare", "Compare the three pairs of sides."], ["Decide", "Name the postulate."]], rows: [
          { step: 1, m: "AB = 4 + 3 = 7", say: "Substitute $x = 4$.", fig: FIG_ALG },
          { step: 1, m: "BC = 2(4) = 8", say: "And again." },
          { step: 1, m: "CA = 3(4) - 2 = 10", say: "The third side.",
            ask: { prompt: "What is $3x - 2$ when $x = 4$?", answer: 0,
                   options: [{ t: "10" }, { t: "6", fb: "Multiply first: $12 - 2$." }] } },
          { step: 2, m: "AB = DE \\qquad BC = EF \\qquad CA = FD", say: "7 and 7, 8 and 8, 10 and 10." },
          { step: 3, m: "\\triangle ABC \\cong \\triangle DEF \\text{ by SSS}", say: "Three pairs of congruent sides." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "You know $\\overline{AB} \\cong \\overline{DE}$ and $\\angle B \\cong \\angle E$. Which other pair lets you use SAS?",
        options: [{ t: "$\\overline{BC} \\cong \\overline{EF}$" }, { t: "$\\overline{AC} \\cong \\overline{DF}$", fb: "Then $\\angle B$ would not be between the two sides." }, { t: "$\\angle A \\cong \\angle D$", fb: "SAS needs two pairs of sides." }],
        answer: 0, skill: "SSS and SAS", hints: ["$\\angle B$ must be between the two sides. Which sides meet at $B$?"], why: "$\\overline{AB}$ and $\\overline{BC}$ meet at $B$, so $\\angle B$ is included." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dev says these triangles are congruent by SAS. What is wrong?", art: FIG_SSA,
        options: [{ t: "The marked angle is not between the two marked sides, so SAS does not apply." },
                  { t: "He should have said SSS.", fb: "Only two pairs of sides are marked." },
                  { t: "Nothing. Two sides and an angle are marked.", fb: "For SAS the angle must be the included one." }],
        answer: 0, skill: "SSS and SAS", hints: ["Which angle is between $\\overline{AB}$ and $\\overline{BC}$?"], why: "The included angle of $\\overline{AB}$ and $\\overline{BC}$ is $\\angle B$, but $\\angle A$ is marked." },
      { type: "choice", kicker: "Use it", prompt: "A rectangular gate sags until a diagonal brace is nailed across it. Why does the brace hold it in shape?",
        options: [{ t: "It makes triangles, and three fixed side lengths allow only one triangle" }, { t: "It makes the gate heavier", fb: "Weight does not stop the corners from turning." }, { t: "It makes the angles of the gate add to 180°", fb: "A rectangle's angles add to 360°, with or without a brace." }],
        answer: 0, skill: "SSS and SAS", hints: ["Think of SSS."], why: "SSS: a triangle with fixed sides cannot change shape." }
    ]
  });

  /* ======================================= 4-5 · Triangle congruence: ASA, AAS and HL */
  var HOW_4_5 = [["Mark", "Mark what is given, and add any shared side or vertical angles."],
                 ["Pattern", "Read round the triangle. ASA: the side is between the two angles. AAS: it is not between them. HL: a right triangle's hypotenuse and a leg."],
                 ["State", "Name the rule and write the congruence in matching order."]];
  var T_RT = [[0, 0], [3.6, 0], [0, 2.6]];
  var FIG_ASA = kite([1.8, 2], { arcs: [1, 2, 0] }, null, "Triangles ABC and ADC share side AC. The angles at A on each side of AC carry one arc. The angles at C on each side of AC carry two."),
      FIG_AAS = twoTris("ABC", "DEF", { arcs: [1, 2, 0], ticks: [0, 1, 0] }, null, "Triangles ABC and DEF. The angles at A and D carry one arc, the angles at B and E carry two, and sides BC and EF carry one tick mark."),
      FIG_HL = twoTris("ABC", "DEF", { right: [0], ticks: [1, 2, 0] }, null, "Right triangles ABC and DEF, with right angles at A and D. Legs AB and DE carry one tick mark. Sides BC and EF, opposite the right angles, carry two.", T_RT),
      FIG_HLK = kite([0.893, 1.915], { right: [2], ticks: [0, 0, 1] }, null, "Triangles ABC and ADC share side AC. The angles at B and D are right angles. AB and AD each carry one tick mark.");
  LESSONS.push({
    title: "Triangle congruence: ASA, AAS and HL",
    blurb: "Book 4-5 · Two angles and a side, or a right triangle's hypotenuse and leg, prove triangles congruent.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In $\\triangle ABC$, which side lies between $\\angle A$ and $\\angle B$?",
        options: [{ t: "$\\overline{AB}$" }, { t: "$\\overline{BC}$", fb: "$\\overline{BC}$ is opposite $\\angle A$." }, { t: "$\\overline{AC}$", fb: "$\\overline{AC}$ is opposite $\\angle B$." }],
        answer: 0, skill: "Included side", hints: ["Which side joins the two vertices?"], why: "$\\overline{AB}$ joins $A$ and $B$. It is the **included side** of those two angles." },
      { type: "learn", kicker: "The idea",
        prompt: "Three more ways. **ASA:** two angles and the **included side**, the side between them. **AAS:** two angles and a side that is not between them. **HL:** in right triangles, the hypotenuse and one leg. The parts must be in the same positions in both triangles.",
        scene: { type: "method", how: HOW_4_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch ASA used. Given: $\\overline{AC}$ bisects $\\angle BAD$ and $\\angle BCD$.",
        scene: { type: "walk", how: HOW_4_5, rows: [
          { step: 1, m: "\\angle BAC \\cong \\angle DAC \\qquad \\angle BCA \\cong \\angle DCA", say: "A bisector makes two congruent angles.", fig: FIG_ASA },
          { step: 1, m: "\\overline{AC} \\cong \\overline{AC}", say: "Reflexive Property: the shared side." },
          { step: 2, m: "\\text{angle, included side, angle}", say: "$\\overline{AC}$ joins the vertices of the two marked angles.",
            ask: { prompt: "Where is side $\\overline{AC}$?", answer: 0,
                   options: [{ t: "Between the two marked angles" }, { t: "Opposite one of them", fb: "Its endpoints $A$ and $C$ are the vertices of the marked angles." }] } },
          { step: 3, m: "\\triangle ABC \\cong \\triangle ADC \\text{ by ASA}", say: "$B$ matches $D$." }] },
        gate: true, then: "Angle, side between, angle: ASA." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Which rule proves these triangles congruent?", art: FIG_AAS,
        how: HOW_4_5, skill: "ASA, AAS and HL",
        steps: [
          { step: 1, ask: "Which pair of sides is marked congruent?", type: "choice", answer: 0,
            options: [{ t: "$\\overline{BC}$ and $\\overline{EF}$" }, { t: "$\\overline{AB}$ and $\\overline{DE}$", fb: "Those sides have no tick marks." }],
            m: "\\overline{BC} \\cong \\overline{EF}", say: "One pair of sides, with two pairs of angles." },
          { step: 2, ask: "Is $\\overline{BC}$ between $\\angle A$ and $\\angle B$?", type: "choice", answer: 0,
            options: [{ t: "No: it is opposite $\\angle A$" }, { t: "Yes", fb: "The side between $\\angle A$ and $\\angle B$ is $\\overline{AB}$." }],
            m: "\\text{angle, angle, side}", say: "The side is not the included one." },
          { step: 2, ask: "Which rule fits?", type: "choice", answer: 0,
            options: [{ t: "AAS" }, { t: "ASA", fb: "ASA needs the side between the two angles." }],
            m: "\\text{AAS}", say: "Angle, angle, side." },
          { step: 3, ask: "Which statement is in matching order?", type: "choice", answer: 0,
            options: [{ t: "$\\triangle ABC \\cong \\triangle DEF$" }, { t: "$\\triangle ABC \\cong \\triangle EDF$", fb: "$\\angle A$ matches $\\angle D$: both have one arc." }],
            m: "\\triangle ABC \\cong \\triangle DEF", say: "$A$ with $D$, $B$ with $E$, $C$ with $F$." }],
        why: "Mark, pattern, state. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "Match each description to its rule.",
        slots: [{ id: "asa", label: "ASA" }, { id: "aas", label: "AAS" }, { id: "hl", label: "HL" }, { id: "sas", label: "SAS" }],
        cards: [{ t: "Two angles and the side between them", slot: "asa", fb: "The included side." }, { t: "Two angles and a side not between them", slot: "aas", fb: "Angle, angle, then a side outside them." },
                { t: "Right triangles: the hypotenuse and a leg", slot: "hl", fb: "Only for right triangles." }, { t: "Two sides and the angle between them", slot: "sas", fb: "The included angle." }],
        skill: "ASA, AAS and HL", hints: ["Read the letters in order round the triangle."],
        why: "The middle letter is the part in the middle." },
      { type: "choice", prompt: "Both of these are right triangles. Which rule proves them congruent?", art: FIG_HL,
        options: [{ t: "HL" }, { t: "SSS", fb: "Only two pairs of sides are marked." }, { t: "ASA", fb: "Only one pair of angles, the right angles, is known." }],
        answer: 0, skill: "ASA, AAS and HL", hints: ["The side opposite the right angle is the hypotenuse."], why: "A pair of hypotenuses and a pair of legs: HL." },
      { type: "learn", kicker: "A harder case",
        prompt: "**HL** in a proof. Given: $\\angle B$ and $\\angle D$ are right angles, and $\\overline{AB} \\cong \\overline{AD}$. Prove: $\\triangle ABC \\cong \\triangle ADC$.",
        scene: { type: "walk", how: [["Right", "Check that both are right triangles."], ["Hyp, leg", "Find a pair of congruent hypotenuses and a pair of congruent legs."], ["State", "Conclude by HL."]], rows: [
          { step: 1, m: "\\angle B \\text{ and } \\angle D \\text{ are right angles}", say: "So both triangles are right triangles.", fig: FIG_HLK },
          { step: 2, m: "\\overline{AC} \\cong \\overline{AC}", say: "The shared side is opposite each right angle: it is the hypotenuse of both.",
            ask: { prompt: "The hypotenuse is opposite the right angle. Which side is the hypotenuse of $\\triangle ABC$?", answer: 0,
                   options: [{ t: "$\\overline{AC}$" }, { t: "$\\overline{AB}$", fb: "$\\overline{AB}$ touches the right angle at $B$: it is a leg." }] } },
          { step: 2, m: "\\overline{AB} \\cong \\overline{AD}", say: "Given: a pair of legs." },
          { step: 3, m: "\\triangle ABC \\cong \\triangle ADC \\text{ by HL}", say: "Hypotenuse and leg." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which of these does **not** prove two triangles congruent?",
        options: [{ t: "AAA" }, { t: "AAS", fb: "Two angles and a side not between them do prove it." }, { t: "HL", fb: "It does, for right triangles." }],
        answer: 0, skill: "ASA, AAS and HL", hints: ["Can two triangles have the same angles and different sizes?"], why: "Three pairs of angles give the same shape, but not the same size." },
      { type: "choice", kicker: "Find the error",
        prompt: "Two right triangles have both pairs of legs congruent. Kim writes “congruent by HL”. What is wrong?",
        options: [{ t: "HL needs the hypotenuse. Two legs with the right angle between them is SAS." },
                  { t: "The triangles are not congruent.", fb: "They are congruent: by SAS." },
                  { t: "Nothing. They are right triangles.", fb: "HL means hypotenuse and leg. No hypotenuse is known here." }],
        answer: 0, skill: "ASA, AAS and HL", hints: ["What does the H stand for?"], why: "Leg, right angle, leg is side, included angle, side: SAS." },
      { type: "choice", kicker: "Use it", prompt: "Two lookouts stand 100 m apart on a straight shore. Each measures the angle between the shore and a boat. Why is that enough to fix where the boat is?",
        options: [{ t: "ASA: two angles and the side between them allow only one triangle" }, { t: "SSS: all three sides are known", fb: "Only one length, the 100 m, is measured." }, { t: "It is not enough", fb: "Two angles and the included side fix the triangle." }],
        answer: 0, skill: "ASA, AAS and HL", hints: ["What is measured: one side and…?"], why: "The 100 m of shore is the included side of the two measured angles." }
    ]
  });

  /* ================================================ 4-6 · Triangle congruence: CPCTC */
  var HOW_4_6 = [["Triangles", "Find two triangles that contain the parts you want."],
                 ["Congruent", "Prove the triangles congruent: SSS, SAS, ASA, AAS or HL."],
                 ["CPCTC", "Corresponding parts of congruent triangles are congruent."]];
  var FIG_KITE_S = kite([1.8, 2], { ticks: [0, 2, 1] }, null, "Triangles ABC and ADC share side AC. AB and AD each carry one tick mark. CB and CD each carry two."),
      FIG_PQRS = kite([1.8, 2], { ticks: [0, 0, 1], arcs: [1, 0, 0] }, null, "Triangles PQR and PSR share side PR. PQ and PS each carry one tick mark. The angles at P on each side of PR carry one arc.", "PQRS"),
      FIG_GRID6 = grid([-6, 6], [-5, 6], [{ poly: [[1, 1], [4, 1], [1, 5]], names: "ABC", c: "blue" }, { poly: [[-1, -1], [-1, -4], [-5, -1]], names: "DEF", c: "green" }],
        { u: 22, alt: "A coordinate grid. Triangle ABC has A at (1, 1), B at (4, 1) and C at (1, 5). Triangle DEF has D at (−1, −1), E at (−1, −4) and F at (−5, −1)." }),
      FIG_POND = bowtie("ABECD", "Segments AD and BC cross at E. AE and DE each carry one tick mark. BE and CE each carry two. AB is the width of the pond, and DC is 42 metres.",
        { extra: [{ len: "42 m", seg: [[2.6, -1.6], [2.6, 1.3]], side: -1, off: 16 }, { len: "pond", seg: [[-2.6, 1.6], [-2.6, -1.3]], side: -1, off: 20 }] });
  LESSONS.push({
    title: "Triangle congruence: CPCTC",
    blurb: "Book 4-6 · Once triangles are congruent, all their corresponding parts are congruent.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "$\\triangle ABC \\cong \\triangle DEF$. Which angle is congruent to $\\angle B$?",
        options: [{ t: "$\\angle E$" }, { t: "$\\angle D$", fb: "$\\angle D$ matches $\\angle A$." }, { t: "$\\angle F$", fb: "$\\angle F$ matches $\\angle C$." }],
        answer: 0, skill: "Corresponding parts", hints: ["$B$ is the second letter."], why: "Second letter with second letter." },
      { type: "learn", kicker: "The idea",
        prompt: "**CPCTC** means “corresponding parts of congruent triangles are congruent.” Once two triangles are proved congruent, every other pair of matching sides and angles is congruent too. So to prove two segments or two angles congruent, find triangles that contain them.",
        scene: { type: "method", how: HOW_4_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch CPCTC used. Given: $E$ is the midpoint of $\\overline{AD}$ and of $\\overline{BC}$. Prove: $\\overline{AB} \\cong \\overline{DC}$.",
        scene: { type: "walk", how: HOW_4_6, rows: [
          { step: 1, m: "\\triangle AEB \\text{ and } \\triangle DEC", say: "$\\overline{AB}$ and $\\overline{DC}$ are sides of these two triangles.", fig: FIG_BOW },
          { step: 2, m: "\\overline{AE} \\cong \\overline{DE} \\qquad \\overline{BE} \\cong \\overline{CE}", say: "Definition of midpoint." },
          { step: 2, m: "\\angle AEB \\cong \\angle DEC", say: "Vertical Angles Theorem.",
            ask: { prompt: "Why are $\\angle AEB$ and $\\angle DEC$ congruent?", answer: 0,
                   options: [{ t: "They are vertical angles" }, { t: "They are a linear pair", fb: "A linear pair is side by side. These are opposite each other." }] } },
          { step: 2, m: "\\triangle AEB \\cong \\triangle DEC", say: "SAS." },
          { step: 3, m: "\\overline{AB} \\cong \\overline{DC}", say: "CPCTC." }] },
        gate: true, then: "Congruent triangles first. CPCTC last." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Given: $\\overline{AB} \\cong \\overline{AD}$ and $\\overline{CB} \\cong \\overline{CD}$. Prove: $\\angle B \\cong \\angle D$.", art: FIG_KITE_S,
        how: HOW_4_6, skill: "CPCTC",
        steps: [
          { step: 1, ask: "Which two triangles contain $\\angle B$ and $\\angle D$?", type: "choice", answer: 0,
            options: [{ t: "$\\triangle ABC$ and $\\triangle ADC$" }, { t: "$\\triangle ABD$ and $\\triangle CBD$", fb: "$\\overline{BD}$ is not drawn. Use the triangles on each side of $\\overline{AC}$." }],
            m: "\\triangle ABC \\text{ and } \\triangle ADC", say: "One on each side of $\\overline{AC}$." },
          { step: 2, ask: "Two pairs of sides are given. What is the third pair?", type: "choice", answer: 0,
            options: [{ t: "$\\overline{AC} \\cong \\overline{AC}$" }, { t: "$\\overline{AB} \\cong \\overline{CB}$", fb: "That is not given. The shared side is congruent to itself." }],
            m: "\\overline{AC} \\cong \\overline{AC}", say: "Reflexive Property." },
          { step: 2, ask: "Which rule proves $\\triangle ABC \\cong \\triangle ADC$?", type: "choice", answer: 0,
            options: [{ t: "SSS" }, { t: "SAS", fb: "No pair of angles is known yet." }],
            m: "\\triangle ABC \\cong \\triangle ADC", say: "SSS." },
          { step: 3, ask: "What is the reason for $\\angle B \\cong \\angle D$?", type: "choice", answer: 0,
            options: [{ t: "CPCTC" }, { t: "Given", fb: "It is what you have to prove." }],
            m: "\\angle B \\cong \\angle D", say: "CPCTC." }],
        why: "Triangles, congruent, CPCTC. Now two on your own." },
      { type: "order", kicker: "On your own", prompt: "Given: $\\overline{PQ} \\cong \\overline{PS}$, and $\\overline{PR}$ bisects $\\angle QPS$. Prove: $\\overline{QR} \\cong \\overline{SR}$. Put the proof in order.", art: FIG_PQRS,
        items: [nb("$\\overline{PQ} \\cong \\overline{PS}$, and $\\overline{PR}$ bisects $\\angle QPS$. (Given)"), nb("$\\angle QPR \\cong \\angle SPR$ (Definition of angle bisector)"),
                nb("$\\triangle QPR \\cong \\triangle SPR$ (SAS, with the shared side $\\overline{PR}$)"), nb("$\\overline{QR} \\cong \\overline{SR}$ (CPCTC)")],
        skill: "CPCTC", hints: ["Start with what is given. End with what is to be proved.", "CPCTC comes after the triangles are congruent."],
        why: "Given, the bisector's angles, the triangles by SAS, then CPCTC." },
      { type: "choice", prompt: "Can you use CPCTC as a reason **before** the triangles are proved congruent?",
        options: [{ t: "No. CPCTC works only after the triangles are known to be congruent." }, { t: "Yes, when the parts look congruent.", fb: "How a drawing looks is not a reason." }],
        answer: 0, skill: "CPCTC", hints: ["Read what the letters stand for."], why: "“…of **congruent triangles**”: the congruence has to come first." },
      { type: "learn", kicker: "A harder case",
        prompt: "CPCTC works on the coordinate plane as well. Show that $\\angle B \\cong \\angle E$.",
        scene: { type: "walk", how: [["Lengths", "Find all six side lengths: count, or use the Distance Formula."], ["SSS", "Three pairs of equal lengths: the triangles are congruent."], ["CPCTC", "So their corresponding angles are congruent."]], rows: [
          { step: 1, m: "AB = 3 \\qquad AC = 4", say: "Count along the grid lines.", fig: FIG_GRID6 },
          { step: 1, m: "BC = \\sqrt{3^2 + 4^2} = 5", say: "The Distance Formula, from $(4, 1)$ to $(1, 5)$." },
          { step: 1, m: "DE = 3 \\qquad DF = 4 \\qquad EF = 5", say: "The same way for the second triangle.",
            ask: { prompt: "$E$ is $(-1, -4)$ and $F$ is $(-5, -1)$. What is $EF$?", answer: 0,
                   options: [{ t: "5" }, { t: "7", fb: "$\\sqrt{4^2 + 3^2} = \\sqrt{25}$, not $4 + 3$." }] } },
          { step: 2, m: "\\triangle ABC \\cong \\triangle DEF", say: "SSS: 3 and 3, 4 and 4, 5 and 5." },
          { step: 3, m: "\\angle B \\cong \\angle E", say: "CPCTC." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "$\\triangle PQS \\cong \\triangle RQS$. Which statement follows by CPCTC?",
        options: [{ t: "$\\overline{PS} \\cong \\overline{RS}$" }, { t: "$\\overline{PQ} \\cong \\overline{QS}$", fb: "Those are two sides of the same triangle, not corresponding parts." }, { t: "$\\angle P \\cong \\angle Q$", fb: "$\\angle P$ matches $\\angle R$." }],
        answer: 0, skill: "CPCTC", hints: ["$P$ matches $R$, $Q$ matches $Q$, $S$ matches $S$."], why: "First and third letters: $\\overline{PS}$ and $\\overline{RS}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A proof reads: (1) $\\overline{AB} \\cong \\overline{DE}$, given. (2) $\\angle A \\cong \\angle D$, by CPCTC. (3) $\\triangle ABC \\cong \\triangle DEF$, by SAS. What is wrong?",
        options: [{ t: "CPCTC is used before the triangles are proved congruent." },
                  { t: "SAS is not a valid rule.", fb: "SAS is valid. Look at the order of the steps." },
                  { t: "Nothing. Every step has a reason.", fb: "Step 2 depends on step 3, which comes after it." }],
        answer: 0, skill: "CPCTC", hints: ["What must be true before CPCTC can be used?"], why: "The reasoning goes in a circle: step 2 needs step 3." },
      { type: "num", kicker: "Use it", prompt: "To find the width $AB$ of a pond, a surveyor sets $E$ as the midpoint of both $\\overline{AD}$ and $\\overline{BC}$, then measures $DC$. How wide is the pond?", art: FIG_POND, post: "m", answer: 42, skill: "CPCTC",
        hints: ["$\\triangle AEB \\cong \\triangle DEC$ by SAS."], why: "By CPCTC, $AB = DC = 42$ m." }
    ]
  });
  /* ========================================== 4-7 · Introduction to coordinate proof */
  var HOW_4_7 = [["Place", "Put the figure on the plane: a vertex at the origin and a side along an axis."],
                 ["Label", "Give every vertex its coordinates. For a general figure, use variables."],
                 ["Calculate", "Use the midpoint, distance or slope formula to prove the statement."]];
  var FIG_RT64 = grid([-1, 8], [-1, 6], [{ poly: [[0, 0], [6, 0], [0, 4]], names: "OAB" }, { seg: [[0, 0], [3, 2]], dash: true, c: "orange" }, { pt: [3, 2], name: "M", at: "ne", c: "orange" }],
        { u: 28, alt: "A coordinate grid. Right triangle OAB has O at the origin, A at (6, 0) and B at (0, 4). M, at (3, 2), is the midpoint of AB, and a dashed segment joins M to O." }),
      FIG_RECT = grid([-1, 10], [-1, 8], [{ poly: [[0, 0], [8, 0], [8, 6], [0, 6]], names: "OABC" }, { seg: [[0, 0], [8, 6]], c: "orange" }, { seg: [[8, 0], [0, 6]], c: "green" }],
        { u: 24, alt: "A coordinate grid. Rectangle OABC has O at the origin, A at (8, 0), B at (8, 6) and C at (0, 6). Both diagonals are drawn." }),
      FIG_GEN = grid([-1, 7], [-1, 5], [{ poly: [[0, 0], [5.4, 0], [0, 3.4]], c: "blue" }, { seg: [[0, 0], [2.7, 1.7]], dash: true, c: "orange" },
        { pt: [0, 0], name: "O(0, 0)", at: "sw" }, { pt: [5.4, 0], name: "A(2a, 0)", at: "s" }, { pt: [0, 3.4], name: "B(0, 2b)", at: "ne" }, { pt: [2.7, 1.7], name: "M(a, b)", at: "ne", c: "orange" }],
        { u: 34, nums: false, alt: "Axes without numbers. Right triangle OAB has O at the origin, A at (2a, 0) on the x-axis and B at (0, 2b) on the y-axis. M, at (a, b), is the midpoint of AB." }),
      FIG_ISO = grid([-6, 6], [-1, 5], [{ poly: [[-4, 0], [4, 0], [0, 3]], names: "PQR" }],
        { u: 24, alt: "A coordinate grid. Triangle PQR has P at (−4, 0), Q at (4, 0) and R at (0, 3)." });
  LESSONS.push({
    title: "Introduction to coordinate proof",
    blurb: "Book 4-7 · Place a figure on the coordinate plane and prove facts about it with formulas.",
    mins: 12, v: 4,
    steps: [
      { type: "pair", kicker: "Warm up", prompt: "Find the midpoint of the segment from $(0, 0)$ to $(6, 8)$. Type it as $(x, y)$.", answer: [3, 4], skill: "Midpoint Formula",
        near: [{ v: [6, 8], fb: "That is the endpoint. Halve each coordinate." }], hints: ["Average the $x$s and average the $y$s."], why: "$\\left(\\frac{6}{2}, \\frac{8}{2}\\right) = (3, 4)$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **coordinate proof** puts a figure on the coordinate plane and proves a statement with the midpoint, distance and slope formulas. Place the figure so the arithmetic is easy: a vertex at the origin, and a side along an axis.",
        scene: { type: "method", how: HOW_4_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a right triangle with legs of 6 and 4 placed, and a fact about its hypotenuse proved.",
        scene: { type: "walk", how: HOW_4_7, rows: [
          { step: 1, m: "O(0, 0) \\qquad A(6, 0) \\qquad B(0, 4)", say: "The right angle at the origin, and a leg along each axis.", fig: FIG_RT64 },
          { step: 2, m: "M = \\left(\\frac{6 + 0}{2}, \\frac{0 + 4}{2}\\right) = (3, 2)", say: "The midpoint of the hypotenuse $\\overline{AB}$." },
          { step: 3, m: "MA = \\sqrt{3^2 + 2^2} = \\sqrt{13}", say: "From $(3, 2)$ to $(6, 0)$." },
          { step: 3, m: "MB = \\sqrt{3^2 + 2^2} = \\sqrt{13}", say: "From $(3, 2)$ to $(0, 4)$.",
            ask: { prompt: "Now from $M(3, 2)$ to the origin. What is $MO$?", answer: 0,
                   options: [{ t: "$\\sqrt{13}$" }, { t: "$5$", fb: "$\\sqrt{3^2 + 2^2} = \\sqrt{9 + 4}$." }] } },
          { step: 3, m: "MO = \\sqrt{13}", say: "The midpoint of the hypotenuse is the same distance from all three vertices." }] },
        gate: true, then: "Place, label, calculate." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Prove that a rectangle 8 wide and 6 high has congruent diagonals.", art: FIG_RECT,
        how: HOW_4_7, skill: "Coordinate proof",
        steps: [
          { step: 1, ask: "Where is the best place for the rectangle?", type: "choice", answer: 0,
            options: [{ t: "A vertex at the origin, with sides along the axes" }, { t: "Anywhere, tilted", fb: "A tilted figure makes every calculation harder." }],
            m: "O(0, 0) \\qquad A(8, 0)", say: "One side along the $x$-axis." },
          { step: 2, ask: "The vertex opposite $O$ is $B(8, y)$. What is $y$?", type: "num", answer: 6, near: [{ v: 8, fb: "8 is the width, already used for $x$. How high is the rectangle?" }], hint: "The rectangle is 6 high.",
            m: "B(8, 6) \\qquad C(0, 6)", say: "8 across and 6 up." },
          { step: 3, ask: "Find $OB$, from $(0, 0)$ to $(8, 6)$.", type: "num", answer: 10, near: [{ v: 14, fb: "Square each, add, then take the root." }], hint: "$\\sqrt{8^2 + 6^2}$.",
            m: "OB = \\sqrt{8^2 + 6^2} = 10", say: "$\\sqrt{64 + 36} = \\sqrt{100}$." },
          { step: 3, ask: "Find $AC$, from $(8, 0)$ to $(0, 6)$.", type: "num", answer: 10, near: [{ v: 14, fb: "Square each, add, then take the root." }], hint: "$\\sqrt{8^2 + 6^2}$.",
            m: "AC = \\sqrt{8^2 + 6^2} = 10", say: "$OB = AC$: the diagonals are congruent." }],
        why: "Place, label, calculate. Now two on your own." },
      { type: "plane", kicker: "On your own", prompt: "Place a right triangle with a leg of 5 along the $x$-axis and a leg of 3 along the $y$-axis. The right angle is at the origin $O$. Drag $A$ and $B$ to the other two vertices.",
        x: [-2, 8], y: [-2, 6],
        points: [{ id: "O", x: 0, y: 0, drag: false, label: "O", coords: false }, { id: "A", x: 3, y: 2, drag: true, label: "A" }, { id: "B", x: 2, y: 4, drag: true, label: "B" }],
        check: function (st) {
          var p = st.pt("A"), q = st.pt("B");
          function is(u, x, y) { return u.x === x && u.y === y; }
          if ((is(p, 5, 0) && is(q, 0, 3)) || (is(q, 5, 0) && is(p, 0, 3))) return { ok: true };
          if ((is(p, 3, 0) && is(q, 0, 5)) || (is(q, 3, 0) && is(p, 0, 5))) return { ok: false, say: "The other way round: the leg of 5 lies along the $x$-axis." };
          return { ok: false, say: "One vertex is 5 units along the $x$-axis. The other is 3 units up the $y$-axis." };
        },
        answer: { points: { A: [5, 0], B: [0, 3] } }, skill: "Coordinate proof",
        hints: ["A point on the $x$-axis has $y = 0$. A point on the $y$-axis has $x = 0$."], why: "$A(5, 0)$ and $B(0, 3)$: a leg on each axis." },
      { type: "choice", prompt: "A rectangle of width $2a$ and height $2b$ has a vertex at the origin and sides along the positive axes. What are the coordinates of the opposite vertex?",
        options: [{ t: "$(2a, 2b)$" }, { t: "$(2b, 2a)$", fb: "The width goes across: it is the $x$-coordinate." }, { t: "$(a, b)$", fb: "That is the centre of the rectangle." }],
        answer: 0, skill: "Coordinate proof", hints: ["Across by the width, up by the height."], why: "$2a$ across and $2b$ up." },
      { type: "learn", kicker: "A harder case",
        prompt: "With **variables**, one proof covers every size. Prove it for any right triangle, with legs $2a$ and $2b$.",
        scene: { type: "walk", how: HOW_4_7, rows: [
          { step: 1, m: "O(0, 0) \\qquad A(2a, 0) \\qquad B(0, 2b)", say: "Using $2a$ and $2b$ keeps the midpoint free of fractions.", fig: FIG_GEN },
          { step: 2, m: "M = \\left(\\frac{2a + 0}{2}, \\frac{0 + 2b}{2}\\right) = (a, b)", say: "The midpoint of the hypotenuse." },
          { step: 3, m: "MO = \\sqrt{a^2 + b^2}", say: "From $(a, b)$ to the origin." },
          { step: 3, m: "MA = \\sqrt{(2a - a)^2 + (0 - b)^2} = \\sqrt{a^2 + b^2}", say: "From $(a, b)$ to $(2a, 0)$.",
            ask: { prompt: "What is $(2a - a)^2$?", answer: 0,
                   options: [{ t: "$a^2$" }, { t: "$4a^2$", fb: "Subtract first: $2a - a = a$." }] } },
          { step: 3, m: "MB = \\sqrt{(a - 0)^2 + (b - 2b)^2} = \\sqrt{a^2 + b^2}", say: "All three distances are equal, in every right triangle." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "An isosceles triangle is placed with its base along the $x$-axis and its top vertex on the $y$-axis. Find the length of side $\\overline{PR}$.", art: FIG_ISO, answer: 5, skill: "Coordinate proof",
        near: [{ v: 7, fb: "Square each difference, add, then take the root." }], hints: ["From $(-4, 0)$ to $(0, 3)$: $\\sqrt{4^2 + 3^2}$."], why: "$\\sqrt{16 + 9} = 5$. $QR$ is 5 as well, so the triangle is isosceles." },
      { type: "choice", kicker: "Find the error",
        prompt: "For a proof about **every** right triangle, Sam labels the vertices $(0, 0)$, $(a, 0)$ and $(0, a)$. What is wrong?",
        options: [{ t: "Both legs are $a$, so the proof covers only isosceles right triangles. The legs need different letters." },
                  { t: "The right angle must not be at the origin.", fb: "The origin is the best place for it." },
                  { t: "Nothing. It is a right triangle.", fb: "It is, but one with two equal legs. What about the others?" }],
        answer: 0, skill: "Coordinate proof", hints: ["How long is each leg?"], why: "Use $(a, 0)$ and $(0, b)$, so the legs can differ." },
      { type: "num", kicker: "Use it", prompt: "A rectangular garden is 12 m long and 5 m wide. Place it with a corner at the origin. How long is a straight path from that corner to the opposite corner?", post: "m", answer: 13, skill: "Coordinate proof",
        near: [{ v: 17, fb: "The path is the diagonal, not two sides." }], hints: ["From $(0, 0)$ to $(12, 5)$."], why: "$\\sqrt{12^2 + 5^2} = \\sqrt{169} = 13$." }
    ]
  });

  /* ========================================== 4-8 · Isosceles and equilateral triangles */
  var HOW_4_8 = [["Sides", "Find the congruent sides: the legs. The angles opposite them are the base angles."],
                 ["Equal", "Base angles are congruent. And if two angles are congruent, the sides opposite them are congruent."],
                 ["Solve", "Use the 180° sum, or set the equal parts equal, to find what is missing."]];
  var FIG_I40 = tri([[0, 0], [3, 0], [1.5, 4.1]], { names: "ABC", ticks: [0, 1, 1], angs: ["x°", "x°", "40°"] }, "Isosceles triangle ABC. Sides BC and CA each carry one tick mark. The angle at C is 40 degrees, and the angles at A and B are each x degrees."),
      FIG_I52 = tri([[0, 0], [4, 0], [2, 2.56]], { names: "DEF", ticks: [0, 1, 1], angs: ["52°", null, "?"] }, "Isosceles triangle DEF. Sides EF and FD each carry one tick mark. The angle at D is 52 degrees, and the angle at F is marked with a question mark."),
      FIG_IX = tri([[0, 0], [4.4, 0], [2.2, 2.62]], { names: "GHJ", ticks: [0, 1, 1], angs: ["(3x + 5)°", "(5x − 25)°", null] }, "Isosceles triangle GHJ. Sides HJ and JG each carry one tick mark. The angle at G is 3x + 5 degrees and the angle at H is 5x − 25 degrees.", { u: 34 }),
      FIG_E60 = tri([[0, 0], [4, 0], [2, 3.46]], { names: "RST", ticks: [1, 1, 1], angs: ["(2x + 10)°", null, null] }, "Equilateral triangle RST, with one tick mark on every side. The angle at R is 2x + 10 degrees.", { u: 34 }),
      FIG_EA = tri([[0, 0], [4, 0], [2, 3.46]], { names: "UVW", arcs: [1, 1, 1], sides: ["4y − 3", "2y + 9", null] }, "Triangle UVW, with one arc in every angle. UV is 4y − 3 and VW is 2y + 9.");
  LESSONS.push({
    title: "Isosceles and equilateral triangles",
    blurb: "Book 4-8 · Base angles of an isosceles triangle are congruent, and every angle of an equilateral triangle is 60°.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $2x + 40 = 180$.", pre: "$x =$", answer: 70, skill: "Solve an equation",
        near: [{ v: 110, fb: "Subtract 40, then divide by 2." }], hints: ["$2x = 140$."], why: "$2x = 140$, so $x = 70$." },
      { type: "learn", kicker: "The idea",
        prompt: "In an isosceles triangle, the two congruent sides are the **legs**. They meet at the **vertex angle**. The third side is the **base**, and the two **base angles** lie on it. **Isosceles Triangle Theorem:** the base angles are congruent. Its converse is true as well.",
        scene: { type: "method", how: HOW_4_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the base angles found from the vertex angle.",
        scene: { type: "walk", how: HOW_4_8, rows: [
          { step: 1, m: "\\overline{BC} \\cong \\overline{CA}", say: "The legs. The base angles are at $A$ and $B$.", fig: FIG_I40 },
          { step: 2, m: "m\\angle A = m\\angle B = x°", say: "Isosceles Triangle Theorem." },
          { step: 3, m: "x + x + 40 = 180", say: "The Triangle Sum Theorem." },
          { step: 3, m: "2x = 140", say: "Subtract 40.",
            ask: { prompt: "What is $x$ when $2x = 140$?", answer: 0,
                   options: [{ t: "70" }, { t: "280", fb: "Divide by 2. Do not multiply." }] } },
          { step: 3, m: "x = 70", say: "Each base angle is 70°. Check: $70 + 70 + 40 = 180$." }] },
        gate: true, then: "The vertex angle gives the base angles, and the other way round." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the vertex angle of $\\triangle DEF$.", art: FIG_I52,
        how: HOW_4_8, skill: "Isosceles triangles",
        steps: [
          { step: 1, ask: "The legs are $\\overline{EF}$ and $\\overline{FD}$. Which two angles are the base angles?", type: "choice", answer: 0,
            options: [{ t: "$\\angle D$ and $\\angle E$" }, { t: "$\\angle D$ and $\\angle F$", fb: "$\\angle F$ is where the legs meet: the vertex angle." }],
            m: "\\angle D \\text{ and } \\angle E", say: "The angles opposite the legs." },
          { step: 2, ask: "What is $m\\angle E$, in degrees?", type: "num", answer: 52, near: [{ v: 76, fb: "That is the vertex angle. $\\angle E$ is a base angle, like $\\angle D$." }], hint: "Base angles are congruent.",
            m: "m\\angle E = 52°", say: "Base angles are congruent." },
          { step: 3, ask: "What is $52 + 52$?", type: "num", answer: 104, hint: "The two base angles together.",
            m: "52 + 52 + m\\angle F = 180", say: "The Triangle Sum Theorem." },
          { step: 3, ask: "So what is $m\\angle F$, in degrees?", type: "num", answer: 76, near: [{ v: 128, fb: "Subtract both base angles: $180 - 104$." }], hint: "$180 - 104$.",
            m: "m\\angle F = 76°", say: "$180 - 104 = 76$." }],
        why: "Sides, equal, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find $x$.", art: FIG_IX, pre: "$x =$", answer: 15, skill: "Isosceles triangles",
        near: [{ v: 25, fb: "The base angles are congruent, not supplementary: set them **equal**." }],
        hints: ["Base angles are congruent: $3x + 5 = 5x - 25$."], why: "$30 = 2x$, so $x = 15$. Each base angle is 50°." },
      { type: "num", prompt: "In $\\triangle PQR$, $\\angle P \\cong \\angle Q$. $PR = 2x + 1$ and $QR = 13$. Find $x$.", pre: "$x =$", answer: 6, skill: "Isosceles triangles",
        near: [{ v: 7, fb: "Subtract 1 before dividing: $2x = 12$." }],
        hints: ["Converse: the sides opposite congruent angles are congruent.", "$\\overline{QR}$ is opposite $\\angle P$, and $\\overline{PR}$ is opposite $\\angle Q$."], why: "$2x + 1 = 13$, so $x = 6$." },
      { type: "learn", kicker: "A harder case",
        prompt: "An **equilateral** triangle is isosceles three ways round, so all three angles are congruent: it is **equiangular**. Find $x$ in $\\triangle RST$.",
        scene: { type: "walk", how: [["Equilateral", "Three congruent sides give three congruent angles, and the other way round."], ["60°", "Each angle of an equilateral triangle measures 60°."], ["Solve", "Set the expression equal, and solve."]], rows: [
          { step: 1, m: "\\angle R \\cong \\angle S \\cong \\angle T", say: "Equilateral, so equiangular.", fig: FIG_E60 },
          { step: 2, m: "3 \\cdot m\\angle R = 180°", say: "Three equal angles share 180°." },
          { step: 2, m: "m\\angle R = 60°", say: "Each angle is 60°.",
            ask: { prompt: "What is $180 \\div 3$?", answer: 0,
                   options: [{ t: "60" }, { t: "90", fb: "That is $180 \\div 2$." }] } },
          { step: 3, m: "2x + 10 = 60", say: "The angle at $R$ is $(2x + 10)°$." },
          { step: 3, m: "x = 25", say: "$2x = 50$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "$\\triangle UVW$ is equiangular. Find $y$.", art: FIG_EA, pre: "$y =$", answer: 6, skill: "Equilateral triangles",
        near: [{ v: 2, fb: "Collect the $y$s on one side: $2y = 12$." }],
        hints: ["Equiangular, so equilateral: $4y - 3 = 2y + 9$."], why: "$2y = 12$, so $y = 6$. Each side is 21." },
      { type: "spotline", kicker: "Find the error",
        prompt: "The vertex angle of an isosceles triangle is 50°. Find each base angle. Tap the line where the work **first** goes wrong.",
        lines: ["x + x + 50 = 180", "2x = 230", "x = 115"], answer: 1, fix: "2x = 130",
        fb: { 0: "The base angles are equal, and the three add to 180°. This line is right.", 2: LATER }, skill: "Isosceles triangles",
        hints: ["Which way does the 50 move?"],
        why: "Subtract 50 from both sides: $2x = 130$, so $x = 65$." },
      { type: "num", kicker: "Use it", prompt: "The two sloping sides of a roof truss are the same length, and they meet at 110° at the peak. What angle does each sloping side make with the level beam across the bottom?", post: "°", answer: 35, skill: "Isosceles triangles",
        near: [{ v: 70, fb: "70° is what the two base angles share. Halve it." }],
        hints: ["An isosceles triangle with a vertex angle of 110°."], why: "$180 - 110 = 70$, and $70 \\div 2 = 35$." }
    ]
  });
  /* ================================================================ Skills */
  var TRI_NAMES = [["ABC", "DEF"], ["JKL", "MNP"], ["PQR", "XYZ"], ["RST", "UVW"], ["GHJ", "KLM"]];
  var RULE_FB = { SSS: "SSS needs three pairs of sides.", SAS: "SAS needs two pairs of sides and the angle between them.", ASA: "ASA needs two pairs of angles and the side between them.",
                  AAS: "AAS needs two pairs of angles and a side that is not between them.", HL: "HL needs right triangles, with the hypotenuse and a leg.", "Not enough": "Check the marks again: they do fit one of the rules." };
  // Marks for a pair of triangles that fit this rule, turned to start at vertex v (0, 1 or 2).
  function ruleMarks(rule, v) {
    var t = [0, 0, 0], a = [0, 0, 0], w = (v + 1) % 3, u = (v + 2) % 3;
    if (rule === "SSS") t = [1, 2, 3];
    else if (rule === "SAS") { t[v] = 1; t[u] = 2; a[v] = 1; }            // sides v–w and u–v meet at v
    else if (rule === "SSA") { t[v] = 1; t[w] = 2; a[v] = 1; }            // the angle at v is not between sides v–w and w–u
    else if (rule === "ASA") { a[v] = 1; a[w] = 2; t[v] = 1; }            // side v–w joins the two angles
    else if (rule === "AAS") { a[v] = 1; a[w] = 2; t[w] = 1; }            // side w–u is opposite the angle at v
    else if (rule === "AAA") a = [1, 2, 3];
    return { ticks: t, arcs: a };
  }
  function ruleQ(R, rule, shown, all) {
    var N = R.pick(TRI_NAMES), fig = rule === "HL"
      ? twoTris(N[0], N[1], { right: [0], ticks: R.chance(0.5) ? [1, 2, 0] : [0, 2, 1] }, null, "Two right triangles with a pair of legs and the pair of sides opposite the right angles marked congruent.", T_RT)
      : twoTris(N[0], N[1], ruleMarks(rule, R.int(0, 2)), null, "Two triangles with tick marks on congruent sides and arcs in congruent angles.");
    return mc(R, { prompt: "Which rule proves $\\triangle " + N[0] + " \\cong \\triangle " + N[1] + "$?", art: fig, right: shown,
      wrong: all.filter(function (k) { return k !== shown; }).map(function (k) { return { t: k, fb: RULE_FB[k] + (shown === "Not enough" ? " These marks do not fit that." : "") }; }),
      hints: ["Count the marked sides and the marked angles.", "Then look at where they are: is the angle between the sides? Is the side between the angles?"],
      why: { SSS: "Three pairs of sides.", SAS: "Two pairs of sides and the included angle.", SSA: "The marked angle is not between the two marked sides, and there is no SSA rule.", ASA: "Two pairs of angles and the included side.",
             AAS: "Two pairs of angles and a side that is not between them.", HL: "Right triangles, with the hypotenuse and a leg.", AAA: "Three pairs of angles fix the shape but not the size." }[rule] });
  }
  var SKILLS = [
    { id: "hg4-classify", title: "Classify triangles", lesson: 2,
      gen: function (R) {
        var k = R.int(0, 2);
        if (k === 0) {
          var kind = R.pick(["Acute", "Right", "Obtuse"]), big = kind === "Acute" ? R.int(61, 88) : kind === "Right" ? 90 : R.int(95, 130), rest = 180 - big;
          var a = kind === "Acute" ? R.int(Math.max(rest - 88, 30), Math.min(88, rest - 30)) : R.int(15, rest - 15), b = rest - a, T = R.shuffle([big, a, b]);
          var FB = { Acute: "An acute triangle has three acute angles.", Right: "A right triangle has one angle of exactly 90°.", Obtuse: "An obtuse triangle has one angle greater than 90°." };
          return mc(R, { prompt: "A triangle has angles of " + T[0] + "°, " + T[1] + "° and " + T[2] + "°. Classify it by its angles.", right: kind,
            wrong: ["Acute", "Right", "Obtuse"].filter(function (x) { return x !== kind; }).map(function (x) { return { t: x, fb: FB[x] }; }),
            hints: ["Look at the largest angle: " + Math.max(big, a, b) + "°."], why: FB[kind] });
        }
        if (k === 1) {
          var s = R.int(4, 12), kind2 = R.pick(["Equilateral", "Isosceles", "Scalene"]), S = kind2 === "Equilateral" ? [s, s, s] : kind2 === "Isosceles" ? R.shuffle([s, s, s + R.int(1, 4)]) : R.shuffle([s, s + 1, s + R.int(2, 3)]);
          var FB2 = { Equilateral: "Equilateral means all three sides are congruent.", Isosceles: "Isosceles means two sides are congruent.", Scalene: "Scalene means no two sides are congruent." };
          return mc(R, { prompt: "A triangle has sides of " + S[0] + " cm, " + S[1] + " cm and " + S[2] + " cm. Which name fits it best?", right: kind2,
            wrong: ["Equilateral", "Isosceles", "Scalene"].filter(function (x) { return x !== kind2; }).map(function (x) { return { t: x, fb: FB2[x] }; }),
            hints: ["How many of the sides have the same length?"], why: FB2[kind2] });
        }
        // Isosceles: p x + q = r x − t on the legs.
        var x = R.int(3, 9), p = R.int(1, 3), r = p + R.int(1, 2), leg = p * x + R.int(1, 9), q = leg - p * x, t = r * x - leg;
        if (t <= 0) { r = p + 2; x = Math.max(x, 6); leg = p * x + 3; q = 3; t = r * x - leg; }
        return { type: "num", prompt: "The legs of an isosceles triangle measure $" + poly([[p, "x"], [q, ""]]) + "$ and $" + poly([[r, "x"], [-t, ""]]) + "$. Find the length of each leg.", answer: leg,
          near: near(leg, [{ v: x, fb: "That is $x$. Substitute it to get the length." }]),
          hints: ["The legs are congruent: $" + poly([[p, "x"], [q, ""]]) + " = " + poly([[r, "x"], [-t, ""]]) + "$.", "$x = " + x + "$. Now substitute."], why: "$x = " + x + "$, so each leg is $" + leg + "$." };
      } },
    { id: "hg4-sum", title: "Angles of a triangle", lesson: 3,
      gen: function (R) {
        var k = R.int(0, 3), a = R.int(28, 75), b = R.int(30, 70);
        if (a + b > 150) b = 150 - a;
        if (k === 0) return { type: "num", prompt: "Two angles of a triangle measure " + a + "° and " + b + "°. Find the third angle.", post: "°", answer: 180 - a - b,
          near: near(180 - a - b, [{ v: a + b, fb: "That is the sum of the two. Subtract it from 180." }]), hints: ["The three angles add to 180°."], why: "$180 - " + a + " - " + b + " = " + (180 - a - b) + "$." };
        if (k === 1) return { type: "num", prompt: "The remote interior angles of an exterior angle of a triangle measure " + a + "° and " + b + "°. Find the exterior angle.", post: "°", answer: a + b,
          near: near(a + b, [{ v: 180 - a - b, fb: "That is the third angle inside the triangle. The exterior angle is the sum of the two remote interior angles." }]), hints: ["Exterior Angle Theorem: add the two remote interior angles."], why: "$" + a + " + " + b + " = " + (a + b) + "$." };
        if (k === 2) { var c = R.int(25, 65); return { type: "num", prompt: "One acute angle of a right triangle measures " + c + "°. Find the other acute angle.", post: "°", answer: 90 - c,
          near: near(90 - c, [{ v: 180 - c, fb: "The right angle already uses 90°. The acute angles share the other 90°." }]), hints: ["The acute angles of a right triangle are complementary."], why: "$90 - " + c + " = " + (90 - c) + "$." }; }
        // Exterior angle m x = remote n x + k and a number.
        var x = R.int(8, 20), n = R.int(1, 3), m = n + R.int(2, 3), d = R.pick([10, 20, 30, 40]), e = (m - n) * x - d;
        if (e <= 0) { d = 10; x = Math.max(x, 12); e = (m - n) * x - d; }
        return { type: "num", prompt: "An exterior angle of a triangle measures $(" + m + "x)°$. Its remote interior angles measure $" + d + "°$ and $(" + poly([[n, "x"], [e, ""]]) + ")°$. Find $x$.", pre: "$x =$", answer: x,
          near: near(x, [{ v: (180 - d - e) / (m + n), tol: 0.01, fb: "The exterior angle **equals** the sum of the remote interior angles." }]),
          hints: ["$" + m + "x = " + d + " + " + poly([[n, "x"], [e, ""]]) + "$."], why: "$" + (m - n) + "x = " + (d + e) + "$, so $x = " + x + "$." };
      } },
    { id: "hg4-corresponding", title: "Corresponding parts", lesson: 4,
      gen: function (R) {
        var N = R.pick(TRI_NAMES), A = N[0], B = N[1], i = R.int(0, 2), j = (i + 1) % 3, k = R.int(0, 2);
        if (k === 0) return mc(R, { prompt: "$\\triangle " + A + " \\cong \\triangle " + B + "$. Which angle corresponds to $\\angle " + A[i] + "$?", right: "$\\angle " + B[i] + "$",
          wrong: [0, 1, 2].filter(function (q) { return q !== i; }).map(function (q) { return { t: "$\\angle " + B[q] + "$", fb: "$" + A[i] + "$ is letter " + (i + 1) + " of $" + A + "$, so its partner is letter " + (i + 1) + " of $" + B + "$." }; }),
          hints: ["Match the letters by their position in the names."], why: "Both are letter " + (i + 1) + " of their names." });
        var lo = Math.min(i, j), hi = Math.max(i, j), side = function (S) { return "$\\overline{" + S[lo] + S[hi] + "}$"; };
        if (k === 1) return mc(R, { prompt: "$\\triangle " + A + " \\cong \\triangle " + B + "$. Which side corresponds to " + side(A) + "?", right: side(B),
          wrong: [[0, 1], [1, 2], [0, 2]].filter(function (q) { return q[0] !== lo || q[1] !== hi; }).map(function (q) { return { t: "$\\overline{" + B[q[0]] + B[q[1]] + "}$", fb: "Take the letters of $" + B + "$ in the same positions as $" + A[lo] + "$ and $" + A[hi] + "$ in $" + A + "$." }; }),
          hints: ["Match each endpoint by its position in the name."], why: "$" + A[lo] + "$ matches $" + B[lo] + "$, and $" + A[hi] + "$ matches $" + B[hi] + "$." });
        var x = R.int(3, 12), c = R.int(2, 5), d = R.int(1, 9), len = c * x + d;
        return { type: "num", prompt: "$\\triangle " + A + " \\cong \\triangle " + B + "$. $" + A[lo] + A[hi] + " = " + c + "x + " + d + "$ and $" + B[lo] + B[hi] + " = " + len + "$. Find $x$.", pre: "$x =$", answer: x,
          near: near(x, [{ v: len / c, tol: 0.01, fb: "Subtract " + d + " before you divide." }]),
          hints: ["Corresponding sides are congruent: $" + c + "x + " + d + " = " + len + "$."], why: "$" + c + "x = " + (len - d) + "$, so $x = " + x + "$." };
      } },
    { id: "hg4-sss-sas", title: "SSS, SAS, or not enough", lesson: 5,
      gen: function (R) {
        var rule = R.pick(["SSS", "SAS", "SSA", "SAS", "SSS"]);
        return ruleQ(R, rule, rule === "SSA" ? "Not enough" : rule, ["SSS", "SAS", "Not enough"]);
      } },
    { id: "hg4-asa-aas-hl", title: "ASA, AAS, HL, or not enough", lesson: 6,
      gen: function (R) {
        var rule = R.pick(["ASA", "AAS", "HL", "AAA", "ASA", "AAS", "HL"]);
        return ruleQ(R, rule, rule === "AAA" ? "Not enough" : rule, ["ASA", "AAS", "HL", "Not enough"]);
      } },
    { id: "hg4-cpctc", title: "Use CPCTC", lesson: 7,
      gen: function (R) {
        var N = R.pick(TRI_NAMES), A = N[0], B = N[1], rule = R.pick(["SSS", "SAS", "ASA", "AAS"]), i = R.int(0, 2), k = R.int(0, 2);
        if (k === 0) { var x = R.int(5, 20), c = R.int(2, 4), m = R.int(35, 80), d = m - c * x;
          if (d <= 0) { c = 2; x = 10; d = m - 20; }
          return { type: "num", prompt: "$\\triangle " + A + " \\cong \\triangle " + B + "$ by " + rule + ". $m\\angle " + A[i] + " = (" + c + "x + " + d + ")°$ and $m\\angle " + B[i] + " = " + m + "°$. Find $x$.", pre: "$x =$", answer: x,
            near: near(x, [{ v: m / c, tol: 0.01, fb: "Subtract " + d + " before you divide." }]),
            hints: ["By CPCTC, $\\angle " + A[i] + " \\cong \\angle " + B[i] + "$: $" + c + "x + " + d + " = " + m + "$."], why: "$" + c + "x = " + (m - d) + "$, so $x = " + x + "$." }; }
        if (k === 1) { var j = (i + 1) % 3, lo = Math.min(i, j), hi = Math.max(i, j), o = 3 - lo - hi;
          return mc(R, { prompt: "$\\triangle " + A + " \\cong \\triangle " + B + "$ by " + rule + ". Which statement follows by CPCTC?", right: "$\\overline{" + A[lo] + A[hi] + "} \\cong \\overline{" + B[lo] + B[hi] + "}$",
            wrong: [{ t: "$\\overline{" + A[lo] + A[hi] + "} \\cong \\overline{" + B[Math.min(hi, o)] + B[Math.max(hi, o)] + "}$", fb: "Match each endpoint by its position in the names." },
                    { t: "$\\overline{" + A[lo] + A[hi] + "} \\cong \\overline{" + A[Math.min(lo, o)] + A[Math.max(lo, o)] + "}$", fb: "Those are two sides of the same triangle, not corresponding parts." }],
            hints: ["Corresponding parts sit in the same positions in the two names."], why: "$" + A[lo] + "$ matches $" + B[lo] + "$, and $" + A[hi] + "$ matches $" + B[hi] + "$." }); }
        return mc(R, { prompt: "You want to prove $\\angle " + A[i] + " \\cong \\angle " + B[i] + "$ with CPCTC. What must you prove first?", right: "$\\triangle " + A + " \\cong \\triangle " + B + "$",
          wrong: [{ t: "Nothing: CPCTC needs no other step", fb: "CPCTC is about parts of **congruent triangles**, so the triangles come first." }, { t: "That the angles look the same in the drawing", fb: "How a drawing looks is not a reason." }],
          hints: ["Read what CPCTC stands for."], why: "First the triangles, by SSS, SAS, ASA, AAS or HL. Then CPCTC." });
      } },
    { id: "hg4-coordinate", title: "Coordinate proof", lesson: 8,
      gen: function (R) {
        var k = R.int(0, 2), T = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
        if (k === 0) { var a = R.int(2, 7), b = R.int(2, 6);
          return { type: "pair", prompt: "A right triangle has vertices $(0, 0)$, $(" + 2 * a + ", 0)$ and $(0, " + 2 * b + ")$. Find the midpoint of its hypotenuse. Type it as $(x, y)$.", answer: [a, b],
            near: [{ v: [2 * a, 2 * b], fb: "Halve each sum: the midpoint is half-way along." }], hints: ["The hypotenuse joins $(" + 2 * a + ", 0)$ and $(0, " + 2 * b + ")$.", "Average the $x$s and average the $y$s."],
            why: "$\\left(\\frac{" + 2 * a + " + 0}{2}, \\frac{0 + " + 2 * b + "}{2}\\right) = (" + a + ", " + b + ")$." }; }
        if (k === 1) return { type: "num", prompt: "A rectangle has vertices $(0, 0)$, $(" + T[1] + ", 0)$, $(" + T[1] + ", " + T[0] + ")$ and $(0, " + T[0] + ")$. Find the length of a diagonal.", answer: T[2],
          near: near(T[2], [{ v: T[0] + T[1], fb: "Square each side, add, then take the root." }]), hints: ["From $(0, 0)$ to $(" + T[1] + ", " + T[0] + ")$: $\\sqrt{" + T[1] + "^2 + " + T[0] + "^2}$."], why: "$\\sqrt{" + (T[1] * T[1]) + " + " + (T[0] * T[0]) + "} = " + T[2] + "$." };
        return { type: "num", prompt: "An isosceles triangle has its base from $(-" + T[0] + ", 0)$ to $(" + T[0] + ", 0)$ and its top vertex at $(0, " + T[1] + ")$. Find the length of each of the two congruent sides.", answer: T[2],
          near: near(T[2], [{ v: 2 * T[0], fb: "That is the base. Find the distance from an end of the base to the top vertex." }]), hints: ["From $(" + T[0] + ", 0)$ to $(0, " + T[1] + ")$: $\\sqrt{" + T[0] + "^2 + " + T[1] + "^2}$."], why: "$\\sqrt{" + (T[0] * T[0]) + " + " + (T[1] * T[1]) + "} = " + T[2] + "$." };
      } },
    { id: "hg4-isosceles", title: "Isosceles and equilateral triangles", lesson: 9,
      gen: function (R) {
        var k = R.int(0, 3);
        if (k === 0) { var v = 2 * R.int(10, 60), base = (180 - v) / 2;
          return { type: "num", prompt: "The vertex angle of an isosceles triangle measures " + v + "°. Find each base angle.", post: "°", answer: base,
            near: near(base, [{ v: 180 - v, fb: "That is what the two base angles share. Halve it." }]), hints: ["$x + x + " + v + " = 180$."], why: "$180 - " + v + " = " + (180 - v) + "$, and half of that is $" + base + "$." }; }
        if (k === 1) { var b = R.int(25, 80);
          return { type: "num", prompt: "A base angle of an isosceles triangle measures " + b + "°. Find the vertex angle.", post: "°", answer: 180 - 2 * b,
            near: near(180 - 2 * b, [{ v: 180 - b, fb: "There are two base angles, and they are congruent. Subtract both." }]), hints: ["The other base angle is " + b + "° as well."], why: "$180 - " + b + " - " + b + " = " + (180 - 2 * b) + "$." }; }
        if (k === 2) { var x = R.int(6, 18), p = R.int(2, 3), r = p + R.int(1, 2), ang = p * x + R.int(4, 20), q = ang - p * x, t = r * x - ang;
          if (t <= 0 || ang >= 90) { p = 2; r = 3; x = 15; q = 10; t = 5; ang = 40; }
          return { type: "num", prompt: "The base angles of an isosceles triangle measure $(" + poly([[p, "x"], [q, ""]]) + ")°$ and $(" + poly([[r, "x"], [-t, ""]]) + ")°$. Find $x$.", pre: "$x =$", answer: x,
            near: near(x, [{ v: (180 - q + t) / (p + r), tol: 0.01, fb: "Base angles are congruent, not supplementary: set them **equal**." }]),
            hints: ["$" + poly([[p, "x"], [q, ""]]) + " = " + poly([[r, "x"], [-t, ""]]) + "$."], why: "$" + (q + t) + " = " + (r - p) + "x$, so $x = " + x + "$." }; }
        var c = R.int(2, 6), x2 = R.int(3, 9), d = 60 - c * x2;
        return { type: "num", prompt: "An angle of an equilateral triangle measures $(" + poly([[c, "x"], [d, ""]]) + ")°$. Find $x$.", pre: "$x =$", answer: x2,
          near: near(x2, [{ v: (180 - d) / c, tol: 0.01, fb: "One angle of an equilateral triangle is 60°, not 180°." }]),
          hints: ["Every angle of an equilateral triangle is 60°."], why: "$" + poly([[c, "x"], [d, ""]]) + " = 60$, so $x = " + x2 + "$." };
      } }
  ];
  L.unit("geo", 4, {
    title: "Triangle Congruence",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Classifying triangles, the angles of a triangle, and corresponding parts.",
        skills: ["hg4-classify", "hg4-sum", "hg4-corresponding"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "SSS, SAS, ASA, AAS and HL, and CPCTC.",
        skills: ["hg4-sss-sas", "hg4-asa-aas-hl", "hg4-cpctc"], per: 2 },
      { title: "Quiz 3", after: 9, blurb: "Coordinate proof, and isosceles and equilateral triangles.",
        skills: ["hg4-coordinate", "hg4-isosceles"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:4", {
    2: { name: "Classifying triangles", frame: "By its angles a triangle is acute, [[right]], obtuse or equiangular. By its sides it is equilateral, [[isosceles]] or [[scalene]]. Congruent sides have [[equal]] lengths.",
         chips: ["parallel", "supplementary"] },
    3: { name: "Angles of a triangle", frame: "The angle measures of a triangle add to [[180°]]. The acute angles of a right triangle are [[complementary]]. An exterior angle equals the [[sum]] of its two [[remote]] interior angles.",
         chips: ["360°", "difference"] },
    4: { name: "Congruent triangles", frame: "Congruent triangles have three pairs of congruent [[corresponding]] sides and three pairs of congruent corresponding [[angles]]. In a congruence statement, the [[order]] of the letters shows which vertices match.",
         chips: ["parallel", "length"] },
    5: { name: "SSS and SAS", frame: "[[SSS]]: three pairs of congruent sides. [[SAS]]: two pairs of sides and the [[included]] angle, the one between them. A shared side is congruent to [[itself]].",
         chips: ["AAA", "opposite"] },
    6: { name: "ASA, AAS and HL", frame: "[[ASA]]: two angles and the included side. [[AAS]]: two angles and a side not between them. [[HL]]: in right triangles, the hypotenuse and a [[leg]].",
         chips: ["AAA", "SSA"] },
    7: { name: "CPCTC", frame: "Corresponding parts of [[congruent]] triangles are congruent. First prove the [[triangles]] congruent. Then CPCTC gives any other pair of matching [[sides]] or angles.",
         chips: ["similar", "lines"] },
    8: { name: "Coordinate proof", frame: "Place the figure with a vertex at the [[origin]] and a side along an [[axis]]. Label the vertices, using [[variables]] for a general figure. Then use the midpoint, [[distance]] or slope formula.",
         chips: ["protractor", "ruler"] },
    9: { name: "Isosceles and equilateral", frame: "The [[base]] angles of an isosceles triangle are congruent. If two angles are congruent, the sides [[opposite]] them are congruent. Every angle of an equilateral triangle measures [[60°]].",
         chips: ["90°", "vertex"] }
  });
})();
