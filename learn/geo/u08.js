/* ==========================================================================
   Geometry — Unit 8: Right Triangles and Trigonometry. See lab/core.js for
   the format and lab/geotools.js for the drawing kit.

   Follows Holt Geometry, Chapter 8, section for section (8-1 to 8-6), after
   a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   The geometric mean and the altitude to the hypotenuse (8-1), sine, cosine
   and tangent (8-2), inverse ratios and solving right triangles (8-3),
   angles of elevation and depression (8-4), the Law of Sines and the Law of
   Cosines (8-5), and vectors (8-6).

   A question that needs a trigonometric value gives it, rounded to three
   places, so no calculator is needed for the ratios. Answers rounded to a
   tenth or a degree are marked with a tolerance.

   Lessons carry v: 4 (see Unit 1). Skills are hg8-….

   Seven lessons, six skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  // sin, cos or tan of an angle in degrees, to three places: what the questions quote.
  function T3(fn, deg) { return Math.round(Math[fn](deg * Math.PI / 180) * 1000) / 1000; }
  // Right triangle ABC on its hypotenuse AB, right angle at C, with the altitude CD.
  // o.x, o.y: labels for AD and DB; o.h for CD; o.a for AC; o.b for CB.
  function altFig(o) {
    var A = [0, 0], B = [5, 0], D = [1.8, 0], C = [1.8, 2.4];
    return plain([-0.9, 5.9], [-1, 3.3], [{ poly: [A, B, C], c: "blue" }, { seg: [C, D], c: "orange" }, { angle: [B, D, C], right: true, c: "orange" }, { angle: [B, C, A], right: true, c: "blue" }]
      .concat(lab(o.x, A, D, -1), lab(o.y, D, B, -1), lab(o.h, D, C, -1, 10), lab(o.a, A, C, 1), lab(o.b, C, B, 1),
      [{ pt: A, name: "A", at: "sw" }, { pt: B, name: "B", at: "se" }, { pt: C, name: "C", at: "n" }, { pt: D, name: "D", at: "s", c: "orange" }]), { u: 34, alt: o.alt });
  }
  // Right triangle ACB: angle A at the lower left, the right angle C at the lower right, B above C. w, h: its drawn size.
  // o.A, o.B: what to write in those angles; o.adj, o.opp, o.hyp: labels for AC, CB and AB (as seen from A). o.names "ACB" (false: none).
  function trig(w, h, o, alt) {
    o = o || {};
    function v(t) { return t == null ? null : t; }
    return tri([[0, 0], [w, 0], [w, h]], { names: o.names === false ? "" : o.names || "ACB", right: [1], angs: [v(o.A), null, v(o.B)], sides: [v(o.adj), v(o.opp), v(o.hyp)] }, alt, { u: o.u });
  }
  // An angle of depression: from the top T of a height, looking down to a point G on the level ground.
  // ang: written in the angle between the horizontal at T and the line of sight; hgt, dist: labels for the height and the ground distance.
  function depFig(ang, hgt, dist, alt) {
    var Tp = [0, 2.6], F = [0, 0], G = [5.2, 0], H = [5.2, 2.6];
    return plain([-1.5, 6.5], [-0.9, 3.5], [{ seg: [F, Tp], c: "blue" }, { seg: [F, G] }, { seg: [Tp, G], c: "orange" }, { seg: [Tp, H], dash: true, c: "soft" }, { angle: [G, F, Tp], right: true },
      { angle: [G, Tp, H], say: ang, c: "orange", r: 50 }].concat(lab(hgt, Tp, F, -1, 6 + 3.6 * String(hgt).length), lab(dist, F, G, -1), [{ pt: Tp }, { pt: G }]), { u: 32, alt: alt });
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
    blurb: "Before Chapter 8 · The Pythagorean Theorem, proportions, and special right triangles.",
    mins: 6, v: 4,
    steps: [
      { type: "num", kicker: "Check 1 · Pythagorean Theorem", prompt: "The legs of a right triangle are 7 and 24. Find the hypotenuse.", answer: 25, skill: "Pythagorean Theorem",
        near: [{ v: 31, fb: "Square each leg, add, then take the root." }], hints: ["$7^2 + 24^2 = c^2$."], why: "$49 + 576 = 625$, and $\\sqrt{625} = 25$." },
      { type: "choice", prompt: "Simplify $\\sqrt{52}$.",
        options: [{ t: "$2\\sqrt{13}$" }, { t: "$4\\sqrt{13}$", fb: "$52 = 4 \\cdot 13$, and $\\sqrt{4}$ is 2, not 4." }, { t: "$26$", fb: "That is half of 52." }],
        answer: 0, skill: "Simplify radicals", hints: ["$52 = 4 \\cdot 13$."], why: "$\\sqrt{4 \\cdot 13} = 2\\sqrt{13}$." },
      { type: "num", kicker: "Check 2 · Proportions", prompt: "Solve $\\frac{x}{20} = 0.6$.", pre: "$x =$", answer: 12, skill: "Solve an equation",
        near: [{ v: 100 / 3, tol: 0.01, fb: "Multiply both sides by 20. Do not divide." }], hints: ["Multiply both sides by 20."], why: "$20 \\cdot 0.6 = 12$." },
      { type: "num", prompt: "Solve $\\frac{12}{x} = 0.4$.", pre: "$x =$", answer: 30, skill: "Solve an equation",
        near: [{ v: 4.8, fb: "$x$ is in the denominator: $12 = 0.4x$, so divide 12 by 0.4." }], hints: ["$12 = 0.4x$."], why: "$12 \\div 0.4 = 30$." },
      { type: "num", kicker: "Check 3 · Special right triangles", prompt: "The short leg of a 30°-60°-90° triangle is 5. Find the hypotenuse.", answer: 10, skill: "Special right triangles",
        near: [{ v: 2.5, fb: "The hypotenuse is the longest side: twice the short leg." }], hints: ["Sides $x$, $x\\sqrt{3}$, $2x$."], why: "$2 \\cdot 5 = 10$." },
      { type: "num", prompt: "One acute angle of a right triangle is 37°. Find the other.", post: "°", answer: 53, skill: "Triangle Sum Theorem",
        near: [{ v: 143, fb: "The acute angles of a right triangle add to 90°." }], hints: ["They are complementary."], why: "$90 - 37 = 53$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 8-1**. If **check 1** slipped, see lesson 5-7. If **check 3** slipped, see lesson 5-8.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });

  /* ================================================ 8-1 · Similarity in right triangles */
  var HOW_8_1 = [["Altitude", "The altitude to the hypotenuse of a right triangle makes two smaller triangles, both similar to the whole one."],
                 ["Mean", "The altitude is the geometric mean of the two segments of the hypotenuse: $h^2 = xy$."],
                 ["Leg", "Each leg is the geometric mean of the whole hypotenuse and the segment next to that leg."]];
  var FIG_ALT1 = altFig({ x: "4", y: "9", h: "h", a: "a", alt: "Right triangle ABC with the right angle at C, standing on its hypotenuse AB. The altitude from C meets AB at D. AD is 4, DB is 9, CD is h and AC is a." }),
      FIG_ALT2 = altFig({ x: "2", y: "8", h: "h", b: "b", alt: "Right triangle ABC with the right angle at C, standing on its hypotenuse AB. The altitude from C meets AB at D. AD is 2, DB is 8, CD is h and CB is b." }),
      FIG_ALT3 = altFig({ x: "5", y: "20", h: "h", alt: "Right triangle ABC with the right angle at C, standing on its hypotenuse AB. The altitude from C meets AB at D. AD is 5, DB is 20 and CD is h." }),
      FIG_ALT4 = altFig({ x: "3", y: "y", h: "6", alt: "Right triangle ABC with the right angle at C, standing on its hypotenuse AB. The altitude from C meets AB at D. AD is 3, DB is y and CD is 6." }),
      FIG_ALT5 = altFig({ x: "9", y: "16", a: "a", alt: "Right triangle ABC with the right angle at C, standing on its hypotenuse AB. The altitude from C meets AB at D. AD is 9, DB is 16 and AC is a." });
  LESSONS.push({
    title: "Similarity in right triangles",
    blurb: "Book 8-1 · The geometric mean, and the altitude to the hypotenuse of a right triangle.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $\\frac{4}{x} = \\frac{x}{9}$ for the positive value of $x$.", pre: "$x =$", answer: 6, skill: "Geometric mean",
        near: [{ v: 6.5, fb: "That is the average. Cross-multiply: $x^2 = 36$." }, { v: 36, fb: "That is $x^2$. Take the square root." }], hints: ["Cross-multiply: $x^2 = 4 \\cdot 9$."], why: "$x^2 = 36$, so $x = 6$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **geometric mean** of two positive numbers $a$ and $b$ is the positive $x$ with $\\frac{a}{x} = \\frac{x}{b}$, so $x = \\sqrt{ab}$. It appears whenever you draw the altitude to the hypotenuse of a right triangle, because that altitude makes three similar triangles.",
        scene: { type: "method", how: HOW_8_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the altitude $h$ and the leg $a$ found.",
        scene: { type: "walk", how: HOW_8_1, rows: [
          { step: 1, m: "\\triangle ACD \\sim \\triangle CBD \\sim \\triangle ABC", say: "Each small triangle shares an acute angle with the whole one: AA.", fig: FIG_ALT1 },
          { step: 2, m: "h^2 = 4 \\cdot 9 = 36", say: "The altitude is the geometric mean of the two segments." },
          { step: 2, m: "h = 6", say: "The positive square root.",
            ask: { prompt: "What is $\\sqrt{36}$?", answer: 0,
                   options: [{ t: "6" }, { t: "18", fb: "That is half of 36." }] } },
          { step: 3, m: "a^2 = 4 \\cdot 13 = 52", say: "The segment next to $a$ is 4, and the whole hypotenuse is $4 + 9 = 13$." },
          { step: 3, m: "a = \\sqrt{52} = 2\\sqrt{13}", say: "Simplify the root." }] },
        gate: true, then: "Altitude: the two segments. Leg: its own segment and the whole hypotenuse." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find $h$ and $b$.", art: FIG_ALT2,
        how: HOW_8_1, skill: "Geometric mean",
        steps: [
          { step: 1, ask: "The altitude $\\overline{CD}$ makes two small triangles. How are they related to $\\triangle ABC$?", type: "choice", answer: 0,
            options: [{ t: "Both are similar to it" }, { t: "Both are congruent to it", fb: "They are smaller than $\\triangle ABC$: the same shape, not the same size." }],
            m: "\\triangle ACD \\sim \\triangle CBD \\sim \\triangle ABC", say: "Three similar right triangles." },
          { step: 2, ask: "What is $h^2$?", type: "num", answer: 16, near: [{ v: 10, fb: "Multiply the two segments. Do not add them." }], hint: "$2 \\cdot 8$.",
            m: "h^2 = 2 \\cdot 8 = 16", say: "The product of the two segments." },
          { step: 2, ask: "So what is $h$?", type: "num", answer: 4, hint: "$\\sqrt{16}$.",
            m: "h = 4", say: "$\\sqrt{16}$." },
          { step: 3, ask: "$b$ is next to the segment of 8, and the hypotenuse is 10. What is $b^2$?", type: "num", answer: 80, near: [{ v: 16, fb: "Use the segment next to $b$ and the **whole** hypotenuse: $8 \\cdot 10$." }], hint: "$8 \\cdot 10$.",
            m: "b^2 = 8 \\cdot 10 = 80", say: "Its own segment, times the whole hypotenuse." },
          { step: 3, ask: "Simplify $b = \\sqrt{80}$.", type: "choice", answer: 0,
            options: [{ t: "$4\\sqrt{5}$" }, { t: "$8\\sqrt{10}$", fb: "$80 = 16 \\cdot 5$, and $\\sqrt{16} = 4$." }],
            m: "b = 4\\sqrt{5}", say: "$80 = 16 \\cdot 5$." }],
        why: "Altitude, mean, leg. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the geometric mean of 3 and 12.", answer: 6, skill: "Geometric mean",
        near: [{ v: 7.5, fb: "That is the average. The geometric mean is $\\sqrt{3 \\cdot 12}$." }, { v: 36, fb: "That is the product. Take its square root." }],
        hints: ["$\\sqrt{3 \\cdot 12}$."], why: "$\\sqrt{36} = 6$." },
      { type: "num", prompt: "Find $h$.", art: FIG_ALT3, pre: "$h =$", answer: 10, skill: "Geometric mean",
        near: [{ v: 12.5, fb: "That is the average of 5 and 20. Use $h^2 = 5 \\cdot 20$." }, { v: 100, fb: "That is $h^2$. Take the square root." }],
        hints: ["$h^2 = 5 \\cdot 20$."], why: "$h^2 = 100$, so $h = 10$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The same equation can find a **segment**. Find $y$, and then the hypotenuse.",
        scene: { type: "walk", how: [["Equation", "Write $h^2 = xy$ with what you know."], ["Solve", "Solve for the missing segment."], ["Add", "The hypotenuse is the two segments together."]], rows: [
          { step: 1, m: "6^2 = 3y", say: "The altitude is 6, and one segment is 3.", fig: FIG_ALT4 },
          { step: 2, m: "36 = 3y", say: "Square the altitude.",
            ask: { prompt: "What is $y$ when $3y = 36$?", answer: 0,
                   options: [{ t: "12" }, { t: "33", fb: "Divide by 3, do not subtract it." }] } },
          { step: 2, m: "y = 12", say: "Divide by 3." },
          { step: 3, m: "AB = 3 + 12 = 15", say: "The whole hypotenuse." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find $a$.", art: FIG_ALT5, pre: "$a =$", answer: 15, skill: "Geometric mean",
        near: [{ v: 12, fb: "That is the altitude, $\\sqrt{9 \\cdot 16}$. For a leg, use the whole hypotenuse: $9 \\cdot 25$." }],
        hints: ["The hypotenuse is $9 + 16 = 25$.", "$a^2 = 9 \\cdot 25$."], why: "$a^2 = 225$, so $a = 15$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Find the geometric mean of 4 and 16. Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{4}{x} = \\frac{x}{16}", "x = \\frac{4 + 16}{2}", "x = 10"], answer: 1, fix: "x^2 = 64",
        fb: { 0: "The proportion is set up correctly.", 2: LATER }, skill: "Geometric mean",
        hints: ["What does cross-multiplying give?"],
        why: "Cross-multiply: $x^2 = 64$, so $x = 8$. Adding and halving gives the ordinary average." },
      { type: "num", kicker: "Use it", prompt: "The two sides of a tent roof meet at a right angle at the peak. The peak is straight above a point that splits the 10 m floor into parts of 2 m and 8 m. How high is the peak?", post: "m", answer: 4, skill: "Geometric mean",
        near: [{ v: 5, fb: "That is the average of 2 and 8. Use $h^2 = 2 \\cdot 8$." }], hints: ["The height is the altitude to the hypotenuse: $h^2 = 2 \\cdot 8$."], why: "$h^2 = 16$, so $h = 4$." }
    ]
  });

  /* ======================================================= 8-2 · Trigonometric ratios */
  var HOW_8_2 = [["Label", "From the angle, name the sides: opposite, adjacent, hypotenuse."],
                 ["Ratio", "$\\sin = \\frac{\\text{opposite}}{\\text{hypotenuse}}$, $\\cos = \\frac{\\text{adjacent}}{\\text{hypotenuse}}$, $\\tan = \\frac{\\text{opposite}}{\\text{adjacent}}$."],
                 ["Solve", "Write the equation with that ratio, and solve for the unknown side."]];
  var FIG_345 = trig(4, 3, { adj: "4", opp: "3", hyp: "5" }, "Right triangle ACB with the right angle at C. AC is 4, CB is 3 and AB is 5."),
      FIG_S35 = trig(4.4, 3.1, { A: "35°", opp: "x", hyp: "20" }, "Right triangle ACB with the right angle at C. The angle at A is 35 degrees, the hypotenuse AB is 20 and the side CB, opposite A, is x."),
      FIG_T40 = trig(4.2, 3.5, { A: "40°", adj: "15", opp: "x" }, "Right triangle ACB with the right angle at C. The angle at A is 40 degrees, AC is 15 and CB is x."),
      FIG_51213 = trig(4.8, 2, { adj: "12", opp: "5", hyp: "13" }, "Right triangle ACB with the right angle at C. AC is 12, CB is 5 and AB is 13."),
      FIG_C28 = trig(4.6, 2.45, { A: "28°", adj: "x", hyp: "40" }, "Right triangle ACB with the right angle at C. The angle at A is 28 degrees, the hypotenuse AB is 40 and AC is x."),
      FIG_S25 = trig(4.7, 2.2, { A: "25°", opp: "12", hyp: "x" }, "Right triangle ACB with the right angle at C. The angle at A is 25 degrees, CB is 12 and the hypotenuse AB is x."),
      FIG_T50 = trig(3, 3.58, { A: "50°", opp: "30", adj: "x" }, "Right triangle ACB with the right angle at C. The angle at A is 50 degrees, CB is 30 and AC is x.");
  LESSONS.push({
    title: "Trigonometric ratios",
    blurb: "Book 8-2 · Sine, cosine and tangent, and how they find a side of a right triangle.",
    mins: 13, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which side of a right triangle is the hypotenuse?",
        options: [{ t: "The side opposite the right angle" }, { t: "The shortest side", fb: "The hypotenuse is the longest side." }, { t: "Either side that touches the right angle", fb: "Those are the legs." }],
        answer: 0, skill: "Right triangles", hints: ["It is the longest side."], why: "The hypotenuse is opposite the right angle." },
      { type: "choice", kicker: "Explore", prompt: "Stand at angle $A$. The side across from you, $\\overline{CB}$, is the **opposite** side. The **sine** of $A$ is opposite over hypotenuse. What is $\\sin A$?", art: FIG_345,
        options: [{ t: "$\\frac{3}{5}$" }, { t: "$\\frac{4}{5}$", fb: "4 is the side next to $A$: the adjacent side." }, { t: "$\\frac{3}{4}$", fb: "That is opposite over adjacent: the tangent." }],
        answer: 0, skill: "Trigonometric ratios", hints: ["Opposite is 3. Hypotenuse is 5."],
        why: "$\\sin A = \\frac{3}{5}$. Every right triangle with this angle is similar to this one, so the ratio depends only on the angle." },
      { type: "learn", kicker: "The idea",
        prompt: "A **trigonometric ratio** is a ratio of two sides of a right triangle. For an acute angle $A$: the **sine** is opposite over hypotenuse, the **cosine** is adjacent over hypotenuse, and the **tangent** is opposite over adjacent. The values depend only on the angle.",
        scene: { type: "method", how: HOW_8_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a side found with a ratio. Use $\\sin 35° \\approx 0.574$.",
        scene: { type: "walk", how: HOW_8_2, rows: [
          { step: 1, m: "x \\text{ is opposite} \\qquad 20 \\text{ is the hypotenuse}", say: "Seen from the 35° angle.", fig: FIG_S35 },
          { step: 2, m: "\\sin 35° = \\frac{x}{20}", say: "Opposite and hypotenuse: the sine.",
            ask: { prompt: "Which ratio uses the opposite side and the hypotenuse?", answer: 0,
                   options: [{ t: "Sine" }, { t: "Tangent", fb: "Tangent is opposite over adjacent." }] } },
          { step: 3, m: "x = 20 \\sin 35°", say: "Multiply both sides by 20." },
          { step: 3, m: "x \\approx 20(0.574) \\approx 11.5", say: "To the nearest tenth." }] },
        gate: true, then: "Label, choose the ratio, solve." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find $x$ to the nearest tenth. Use $\\tan 40° \\approx 0.839$.", art: FIG_T40,
        how: HOW_8_2, skill: "Trigonometric ratios",
        steps: [
          { step: 1, ask: "Seen from the 40° angle, what are $x$ and the side of 15?", type: "choice", answer: 0,
            options: [{ t: "$x$ is opposite, and 15 is adjacent" }, { t: "$x$ is adjacent, and 15 is the hypotenuse", fb: "The hypotenuse is opposite the right angle. 15 touches the right angle and the 40° angle: it is adjacent." }],
            m: "x \\text{ is opposite} \\qquad 15 \\text{ is adjacent}", say: "No hypotenuse is involved." },
          { step: 2, ask: "Which ratio uses opposite and adjacent?", type: "choice", answer: 0,
            options: [{ t: "Tangent" }, { t: "Sine", fb: "Sine uses the hypotenuse." }, { t: "Cosine", fb: "Cosine uses the hypotenuse." }],
            m: "\\tan 40° = \\frac{x}{15}", say: "Opposite over adjacent." },
          { step: 3, ask: "$x = 15(0.839)$. What is $x$, to the nearest tenth?", type: "num", answer: 12.6, tol: 0.06, hint: "$15 \\cdot 0.839 = 12.585$.",
            m: "x \\approx 12.6", say: "$15 \\cdot 0.839 = 12.585$." }],
        why: "Label, ratio, solve. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "Match each ratio for angle $A$ to its value.", art: FIG_51213,
        slots: [{ id: "s", label: "sin A" }, { id: "c", label: "cos A" }, { id: "t", label: "tan A" }],
        cards: [{ t: nb("$\\frac{5}{13}$"), slot: "s", fb: "Opposite 5, over hypotenuse 13." }, { t: nb("$\\frac{12}{13}$"), slot: "c", fb: "Adjacent 12, over hypotenuse 13." }, { t: nb("$\\frac{5}{12}$"), slot: "t", fb: "Opposite 5, over adjacent 12." }],
        skill: "Trigonometric ratios", hints: ["From $A$: opposite is 5, adjacent is 12, hypotenuse is 13."],
        why: "Sine: opposite over hypotenuse. Cosine: adjacent over hypotenuse. Tangent: opposite over adjacent." },
      { type: "num", prompt: "Find $x$ to the nearest tenth. Use $\\cos 28° \\approx 0.883$.", art: FIG_C28, pre: "$x \\approx$", answer: 35.3, tol: 0.06, skill: "Trigonometric ratios",
        near: [{ v: 45.3, tol: 0.1, fb: "$x$ is a leg, so it is shorter than the hypotenuse. Multiply 40 by the cosine." }],
        hints: ["$x$ is adjacent and 40 is the hypotenuse: $\\cos 28° = \\frac{x}{40}$."], why: "$x = 40(0.883) \\approx 35.3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the unknown is in the **denominator**, you divide. Find the hypotenuse $x$. Use $\\sin 25° \\approx 0.423$.",
        scene: { type: "walk", how: [["Ratio", "Choose the ratio for the two sides."], ["Equation", "Write it. Here the unknown is in the denominator."], ["Divide", "Multiply both sides by $x$, then divide by the ratio."]], rows: [
          { step: 1, m: "12 \\text{ is opposite} \\qquad x \\text{ is the hypotenuse}", say: "Opposite and hypotenuse: the sine.", fig: FIG_S25 },
          { step: 2, m: "\\sin 25° = \\frac{12}{x}", say: "The unknown is underneath." },
          { step: 3, m: "x \\sin 25° = 12", say: "Multiply both sides by $x$." },
          { step: 3, m: "x = \\frac{12}{\\sin 25°}", say: "Divide both sides by $\\sin 25°$.",
            ask: { prompt: "Should $x$ come out longer or shorter than 12?", answer: 0,
                   options: [{ t: "Longer: it is the hypotenuse" }, { t: "Shorter", fb: "The hypotenuse is the longest side." }] } },
          { step: 3, m: "x \\approx \\frac{12}{0.423} \\approx 28.4", say: "Longer than 12, as a hypotenuse should be." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find $x$ to the nearest tenth. Use $\\tan 50° \\approx 1.192$.", art: FIG_T50, pre: "$x \\approx$", answer: 25.2, tol: 0.1, skill: "Trigonometric ratios",
        near: [{ v: 35.8, tol: 0.1, fb: "$x$ is in the denominator: $\\tan 50° = \\frac{30}{x}$, so divide 30 by the tangent." }],
        hints: ["30 is opposite and $x$ is adjacent: $\\tan 50° = \\frac{30}{x}$.", "$x = \\frac{30}{1.192}$."], why: "$30 \\div 1.192 \\approx 25.2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "In this triangle, Zoe writes $\\cos A = \\frac{3}{5}$. What is wrong?", art: FIG_345,
        options: [{ t: "That is $\\sin A$. Cosine is adjacent over hypotenuse: $\\frac{4}{5}$." },
                  { t: "Cosine is opposite over adjacent: $\\frac{3}{4}$.", fb: "That is the tangent." },
                  { t: "Nothing. $\\cos A = \\frac{3}{5}$.", fb: "3 is the side opposite $A$, and cosine uses the adjacent side." }],
        answer: 0, skill: "Trigonometric ratios", hints: ["Which side is next to $A$?"], why: "Adjacent is 4, hypotenuse is 5." },
      { type: "num", kicker: "Use it", prompt: "A 5 m ladder leans against a wall and makes a 70° angle with the ground. How high up the wall does it reach, to the nearest tenth? Use $\\sin 70° \\approx 0.940$.", post: "m", answer: 4.7, tol: 0.06, skill: "Trigonometric ratios",
        near: [{ v: 5.3, tol: 0.1, fb: "The height is a leg, shorter than the ladder. Multiply 5 by the sine." }],
        hints: ["The height is opposite the 70° angle, and the ladder is the hypotenuse."], why: "$5(0.940) = 4.7$." }
    ]
  });

  /* ======================================================= 8-3 · Solving right triangles */
  var HOW_8_3 = [["Ratio", "Choose the ratio that uses the two sides you know."],
                 ["Inverse", "Undo the ratio: if $\\sin A = x$, then $m\\angle A = \\sin^{-1}(x)$. A calculator gives the angle."],
                 ["Finish", "The other acute angle is 90° minus the first. The third side comes from the Pythagorean Theorem."]];
  var FIG_725 = trig(4.8, 1.4, { opp: "7", hyp: "25" }, "Right triangle ACB with the right angle at C. CB is 7 and the hypotenuse AB is 25."),
      FIG_912 = trig(4, 3, { adj: "12", opp: "9" }, "Right triangle ACB with the right angle at C. AC is 12 and CB is 9."),
      FIG_PQR = grid([-1, 7], [-1, 6], [{ poly: [[1, 1], [5, 1], [5, 4]], names: "PQR" }, { angle: [[1, 1], [5, 1], [5, 4]], right: true, c: "orange" }],
        { u: 30, alt: "A coordinate grid. Triangle PQR has P at (1, 1), Q at (5, 1) and R at (5, 4), with a right angle at Q." });
  LESSONS.push({
    title: "Solving right triangles",
    blurb: "Book 8-3 · Use inverse ratios to find angles, then every side and angle of a right triangle.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "One acute angle of a right triangle is 37°. Find the other.", post: "°", answer: 53, skill: "Triangle Sum Theorem",
        near: [{ v: 143, fb: "The acute angles of a right triangle add to 90°." }], hints: ["They are complementary."], why: "$90 - 37 = 53$." },
      { type: "learn", kicker: "The idea",
        prompt: "A ratio turns an angle into a number. Its **inverse** turns the number back into the angle: if $\\tan A = 0.75$, then $m\\angle A = \\tan^{-1}(0.75) \\approx 37°$. To **solve a right triangle** means to find all its sides and all its angles.",
        scene: { type: "method", how: HOW_8_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this triangle solved.",
        scene: { type: "walk", how: HOW_8_3, rows: [
          { step: 1, m: "\\sin A = \\frac{7}{25} = 0.28", say: "Opposite and hypotenuse are known, so use the sine.", fig: FIG_725 },
          { step: 2, m: "m\\angle A = \\sin^{-1}(0.28) \\approx 16°", say: "The inverse sine, on a calculator." },
          { step: 3, m: "m\\angle B = 90° - 16° = 74°", say: "The acute angles are complementary.",
            ask: { prompt: "What is $90 - 16$?", answer: 0,
                   options: [{ t: "74" }, { t: "164", fb: "That is $180 - 16$. The two acute angles of a right triangle add to 90°." }] } },
          { step: 3, m: "AC = \\sqrt{25^2 - 7^2} = 24", say: "The Pythagorean Theorem gives the third side." }] },
        gate: true, then: "Two sides were enough to find everything else." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve this triangle.", art: FIG_912,
        how: HOW_8_3, skill: "Solve right triangles",
        steps: [
          { step: 1, ask: "From $A$, the sides you know are opposite and adjacent. Which ratio uses them?", type: "choice", answer: 0,
            options: [{ t: "Tangent" }, { t: "Sine", fb: "Sine needs the hypotenuse." }, { t: "Cosine", fb: "Cosine needs the hypotenuse." }],
            m: "\\tan A = \\frac{9}{12} = 0.75", say: "Opposite over adjacent." },
          { step: 2, ask: "A calculator gives $\\tan^{-1}(0.75) \\approx 36.9°$. What is $m\\angle A$ to the nearest degree?", type: "num", answer: 37, hint: "Round 36.9.",
            m: "m\\angle A \\approx 37°", say: "The inverse tangent." },
          { step: 3, ask: "What is $m\\angle B$, in degrees?", type: "num", answer: 53, near: [{ v: 143, fb: "The acute angles add to 90°." }], hint: "$90 - 37$.",
            m: "m\\angle B \\approx 53°", say: "$90 - 37$." },
          { step: 3, ask: "What is the hypotenuse $AB$?", type: "num", answer: 15, near: [{ v: 21, fb: "Square each leg, add, then take the root." }], hint: "$\\sqrt{9^2 + 12^2}$.",
            m: "AB = \\sqrt{81 + 144} = 15", say: "The triangle is solved." }],
        why: "Ratio, inverse, finish. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "In a right triangle, $\\cos A = \\frac{1}{2}$. Think of a special right triangle. What is $m\\angle A$?",
        options: [{ t: "$60°$" }, { t: "$30°$", fb: "In a 30°-60°-90° triangle the side next to the 30° angle is the long leg: $\\cos 30° = \\frac{\\sqrt{3}}{2}$." }, { t: "$45°$", fb: "$\\cos 45° = \\frac{\\sqrt{2}}{2}$." }],
        answer: 0, skill: "Inverse ratios", hints: ["Sides $x$, $x\\sqrt{3}$, $2x$: which angle has the short leg $x$ beside it?"], why: "The short leg is adjacent to the 60° angle: $\\frac{x}{2x} = \\frac{1}{2}$." },
      { type: "num", prompt: "In a right triangle, $\\sin A = 0.8$. A calculator gives $\\sin^{-1}(0.8) \\approx 53.13°$. Find $m\\angle A$ to the nearest degree.", post: "°", answer: 53, skill: "Inverse ratios",
        near: [{ v: 37, fb: "That is the other acute angle." }], hints: ["Round 53.13."], why: "$\\sin^{-1}(0.8) \\approx 53°$." },
      { type: "learn", kicker: "A harder case",
        prompt: "On the coordinate plane you find the sides first. Solve $\\triangle PQR$.",
        scene: { type: "walk", how: [["Sides", "Find the side lengths: count, or use the Distance Formula."], ["Angle", "Use an inverse ratio for one acute angle."], ["Other", "Subtract from 90° for the other."]], rows: [
          { step: 1, m: "PQ = 4 \\qquad QR = 3", say: "Count along the grid lines.", fig: FIG_PQR },
          { step: 1, m: "PR = \\sqrt{4^2 + 3^2} = 5", say: "The hypotenuse." },
          { step: 2, m: "m\\angle P = \\tan^{-1}\\left(\\frac{3}{4}\\right) \\approx 37°", say: "Opposite $\\overline{QR}$ over adjacent $\\overline{PQ}$.",
            ask: { prompt: "From $P$, which side is opposite?", answer: 0,
                   options: [{ t: "$\\overline{QR}$" }, { t: "$\\overline{PQ}$", fb: "$\\overline{PQ}$ touches $P$: it is adjacent." }] } },
          { step: 3, m: "m\\angle R \\approx 90° - 37° = 53°", say: "The triangle is solved." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A ramp 13 m long rises 5 m. A calculator gives $\\sin^{-1}\\left(\\frac{5}{13}\\right) \\approx 22.6°$. To the nearest degree, what angle does the ramp make with the ground?", post: "°", answer: 23, skill: "Inverse ratios",
        near: [{ v: 67, fb: "That is the angle at the top of the ramp." }, { v: 22, fb: "22.6 rounds up." }], hints: ["Round 22.6 to the nearest whole number."], why: "$22.6°$ rounds to $23°$." },
      { type: "choice", kicker: "Find the error",
        prompt: "$\\sin A = 0.5$. Ali writes $m\\angle A = \\sin(0.5)$. What is wrong?",
        options: [{ t: "He needs the inverse: $m\\angle A = \\sin^{-1}(0.5) = 30°$." },
                  { t: "He should use the cosine: $\\cos(0.5)$.", fb: "The ratio given is a sine, so undo it with the inverse sine." },
                  { t: "Nothing. $\\sin(0.5)$ gives the angle.", fb: "$\\sin$ turns an angle into a ratio. To go from the ratio to the angle, use $\\sin^{-1}$." }],
        answer: 0, skill: "Inverse ratios", hints: ["Which way does $\\sin$ go: angle to ratio, or ratio to angle?"], why: "The inverse sine turns a ratio back into an angle." },
      { type: "num", kicker: "Use it", prompt: "A road rises 8 m for every 100 m it runs along the level. A calculator gives $\\tan^{-1}(0.08) \\approx 4.6°$. To the nearest degree, what angle does the road make with the level?", post: "°", answer: 5, skill: "Inverse ratios",
        near: [{ v: 4, fb: "4.6 rounds up." }, { v: 8, fb: "8 is the rise in metres, not the angle." }], hints: ["Rise over run is the tangent: $\\frac{8}{100} = 0.08$."], why: "$4.6°$ rounds to $5°$." }
    ]
  });
  /* ============================================ 8-4 · Angles of elevation and depression */
  var HOW_8_4 = [["Sketch", "Draw the right triangle. An angle of elevation or depression is measured from a horizontal line."],
                 ["Ratio", "Label what you know, and choose the ratio."],
                 ["Solve", "Solve, and check that the answer is sensible."]];
  var FIG_EL32 = trig(4.6, 2.87, { A: "32°", adj: "40 m", opp: "h", names: false }, "A right triangle. Its level side is 40 metres, its upright side is h, and the angle between the level side and the sloping side is 32 degrees."),
      FIG_DEP20 = depFig("20°", "60 m", "d", "A cliff 60 metres high. A dashed level line runs out from its top. The line of sight slopes down from the top to a boat on the water, at a distance d from the foot of the cliff. The angle between the level line and the line of sight is 20 degrees."),
      FIG_KITE8 = trig(3.9, 3.27, { A: "40°", hyp: "80 m", opp: "h", names: false }, "A right triangle. Its sloping side, the kite string, is 80 metres. The angle between the string and the level ground is 40 degrees, and the upright side is h."),
      FIG_EYE = plain([-1.6, 6.6], [-0.8, 4.4], [{ seg: [[-1, 0], [6, 0]] }, { seg: [[0, 0], [0, 0.5]], c: "blue" }, { seg: [[5, 0], [5, 4]], c: "green" }, { seg: [[0, 0.5], [5, 0.5]], dash: true, c: "soft" }, { seg: [[0, 0.5], [5, 4]], c: "orange" },
        { angle: [[5, 0.5], [0, 0.5], [5, 4]], say: "35°", c: "orange", r: 44 }, { angle: [[0, 0.5], [5, 0.5], [5, 4]], right: true, c: "soft" }, { pt: [0, 0.5] }]
        .concat(lab("1.6 m", [0, 0.5], [0, 0], 1, 22), lab("20 m", [0, 0], [5, 0], -1), lab("?", [5, 0], [5, 4], -1, 12)),
        { u: 34, alt: "A person stands 20 metres from a tree. Their eyes are 1.6 metres above the ground. A dashed level line runs from their eyes to the tree, and the line of sight to the top of the tree makes a 35 degree angle with it." }),
      FIG_PLANE = depFig("15°", "1200 m", "d", "A plane 1200 metres above the ground. A dashed level line runs forward from the plane. The line of sight slopes down to a runway at a ground distance d. The angle between the level line and the line of sight is 15 degrees."),
      FIG_LIGHT = depFig("12°", "30 m", "d", "A lighthouse 30 metres high. A dashed level line runs out from its top. The line of sight slopes down to a boat at a distance d from its foot. The angle between the level line and the line of sight is 12 degrees.");
  LESSONS.push({
    title: "Angles of elevation and depression",
    blurb: "Book 8-4 · Angles measured up or down from the horizontal, and the distances they give.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Two parallel lines are cut by a transversal. What is true of alternate interior angles?",
        options: [{ t: "They are congruent" }, { t: "They are supplementary", fb: "That is true of same-side interior angles." }, { t: "They are complementary", fb: "Complementary angles add to 90°." }],
        answer: 0, skill: "Angles on parallel lines", hints: ["Alternate Interior Angles Theorem."], why: "Alternate interior angles on parallel lines are congruent." },
      { type: "learn", kicker: "The idea",
        prompt: "An **angle of elevation** is measured from a horizontal line **up** to a line of sight. An **angle of depression** is measured from a horizontal line **down** to it. The two horizontals are parallel, so the depression from the top equals the elevation from the bottom.",
        scene: { type: "method", how: HOW_8_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "From 40 m away, the angle of elevation to the top of a tower is 32°. Watch its height found. Use $\\tan 32° \\approx 0.625$.",
        scene: { type: "walk", how: HOW_8_4, rows: [
          { step: 1, m: "\\text{level } 40 \\text{ m} \\qquad \\text{upright } h", say: "The ground, the tower and the line of sight make a right triangle.", fig: FIG_EL32 },
          { step: 2, m: "\\tan 32° = \\frac{h}{40}", say: "$h$ is opposite the angle, and 40 is adjacent." },
          { step: 3, m: "h = 40 \\tan 32°", say: "Multiply both sides by 40.",
            ask: { prompt: "What is $40(0.625)$?", answer: 0,
                   options: [{ t: "25" }, { t: "64", fb: "That is $40 \\div 0.625$. Multiply." }] } },
          { step: 3, m: "h \\approx 40(0.625) = 25", say: "The tower is about 25 m high: sensible, for a 32° angle from 40 m away." }] },
        gate: true, then: "Elevation looks up from the horizontal." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. From the top of a 60 m cliff, the angle of depression to a boat is 20°. How far is the boat from the foot of the cliff? Use $\\tan 20° \\approx 0.364$.", art: FIG_DEP20,
        how: HOW_8_4, skill: "Elevation and depression",
        steps: [
          { step: 1, ask: "The angle of depression at the top is 20°. What is the angle of elevation from the boat?", type: "choice", answer: 0,
            options: [{ t: "20°: they are alternate interior angles" }, { t: "70°", fb: "70° is the angle between the cliff and the line of sight. The level lines are parallel, so the angles match." }],
            m: "\\text{angle at the boat} = 20°", say: "The dashed line and the water are parallel." },
          { step: 2, ask: "From the boat, 60 is opposite and $d$ is adjacent. Which equation is right?", type: "choice", answer: 0,
            options: [{ t: "$\\tan 20° = \\frac{60}{d}$" }, { t: "$\\tan 20° = \\frac{d}{60}$", fb: "Opposite over adjacent: the cliff's height goes on top." }],
            m: "\\tan 20° = \\frac{60}{d}", say: "Opposite over adjacent." },
          { step: 3, ask: "$d = \\frac{60}{0.364}$. What is $d$, to the nearest metre?", type: "num", answer: 165, tol: 1, hint: "$60 \\div 0.364 \\approx 164.8$.",
            m: "d \\approx 165", say: "About 165 m: much more than 60 m, as a small angle suggests." }],
        why: "Sketch, ratio, solve. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Elevation or depression?",
        bins: ["Angle of elevation", "Angle of depression"],
        cards: [{ t: "Looking up from the ground at a kite", bin: 0, fb: "Up from the horizontal." }, { t: "A pilot looking down at a runway", bin: 1, fb: "Down from the horizontal." },
                { t: "A lighthouse keeper watching a ship", bin: 1, fb: "The keeper looks down from the horizontal." }, { t: "A hiker looking at the top of a mountain", bin: 0, fb: "Up from the horizontal." }],
        skill: "Elevation and depression", hints: ["Does the line of sight go up or down from the level?"],
        why: "Up: elevation. Down: depression." },
      { type: "num", prompt: "A kite string 80 m long makes a 40° angle of elevation with the ground. How high is the kite, to the nearest tenth? Use $\\sin 40° \\approx 0.643$.", art: FIG_KITE8, post: "m", answer: 51.4, tol: 0.1, skill: "Elevation and depression",
        near: [{ v: 124.4, tol: 0.2, fb: "The height is a leg, so it is shorter than the string. Multiply 80 by the sine." }],
        hints: ["The height is opposite, and the string is the hypotenuse: $\\sin 40° = \\frac{h}{80}$."], why: "$80(0.643) \\approx 51.4$." },
      { type: "learn", kicker: "A harder case",
        prompt: "An angle of elevation is measured from **eye level**, not from the ground. Find the height of the tree. Use $\\tan 35° \\approx 0.700$.",
        scene: { type: "walk", how: [["Triangle", "Find the height above eye level, with the right triangle."], ["Add", "Add the height of the eyes."], ["Check", "Is the answer sensible?"]], rows: [
          { step: 1, m: "\\tan 35° = \\frac{x}{20}", say: "$x$ is the part of the tree above eye level.", fig: FIG_EYE },
          { step: 1, m: "x \\approx 20(0.700) = 14", say: "Multiply both sides by 20." },
          { step: 2, m: "14 + 1.6 = 15.6", say: "Add the 1.6 m below eye level.",
            ask: { prompt: "Why add 1.6?", answer: 0,
                   options: [{ t: "The triangle starts at eye level, 1.6 m above the ground" }, { t: "To round the answer", fb: "The triangle's level side is at eye height, so it misses the bottom 1.6 m of the tree." }] } },
          { step: 3, m: "\\text{about } 15.6 \\text{ m}", say: "A tall tree, seen at 35° from 20 m away: sensible." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A plane flies at 1200 m. The angle of depression to the runway is 15°. Find the ground distance $d$ to the nearest hundred metres. Use $\\tan 15° \\approx 0.268$.", art: FIG_PLANE, post: "m", answer: 4500, tol: 60, skill: "Elevation and depression",
        near: [{ v: 300, tol: 30, fb: "$d$ is in the denominator: $\\tan 15° = \\frac{1200}{d}$, so divide 1200 by the tangent." }],
        hints: ["The angle at the runway is 15° too.", "$\\tan 15° = \\frac{1200}{d}$, so $d = \\frac{1200}{0.268}$."], why: "$1200 \\div 0.268 \\approx 4478$, which is 4500 to the nearest hundred." },
      { type: "choice", kicker: "Find the error",
        prompt: "From the top of a cliff, Jo measures the angle between the **cliff face** and her line of sight to a boat, and calls it the angle of depression. What is wrong?",
        options: [{ t: "An angle of depression is measured from the horizontal, not from the vertical cliff." },
                  { t: "It should be called an angle of elevation.", fb: "She is looking down, so it is a depression. But it must be measured from the horizontal." },
                  { t: "Nothing. Any angle at the top will do.", fb: "The angle with the cliff and the angle with the horizontal are complementary, not equal." }],
        answer: 0, skill: "Elevation and depression", hints: ["Which line is the angle measured from?"], why: "Elevation and depression both start from a horizontal line." },
      { type: "num", kicker: "Use it", prompt: "From the top of a 30 m lighthouse, the angle of depression to a boat is 12°. How far is the boat from the foot of the lighthouse, to the nearest metre? Use $\\tan 12° \\approx 0.213$.", art: FIG_LIGHT, post: "m", answer: 141, tol: 1, skill: "Elevation and depression",
        near: [{ v: 6, tol: 1, fb: "$d$ is in the denominator: divide 30 by the tangent." }],
        hints: ["$\\tan 12° = \\frac{30}{d}$."], why: "$30 \\div 0.213 \\approx 141$." }
    ]
  });

  /* =========================================== 8-5 · Law of Sines and Law of Cosines */
  var HOW_8_5 = [["Which", "A side and its opposite angle known, plus one more part: the Law of Sines. Two sides and the included angle, or three sides: the Law of Cosines."],
                 ["Substitute", "Write the law, and put in what you know."],
                 ["Solve", "Solve for the unknown."]];
  var FIG_LS = tri([[0, 0], [5.1, 0], [3.44, 2.89]], { names: "ABC", angs: ["40°", "60°", null], sides: [null, "10", "b"] }, "Triangle ABC. The angle at A is 40 degrees and the angle at B is 60 degrees. BC is 10 and CA is b."),
      FIG_LC = tri([[0, 0], [4, 0], [1.4, 2.42]], { names: "CAB", angs: ["60°", null, null], sides: ["10", "c", "7"] }, "Triangle ABC. The angle at C is 60 degrees. CA is 10, CB is 7 and AB is c."),
      FIG_LS2 = tri([[0, 0], [5.8, 0], [3.68, 2.12]], { names: "ABC", angs: ["30°", "45°", null], sides: [null, "6", "b"] }, "Triangle ABC. The angle at A is 30 degrees and the angle at B is 45 degrees. BC is 6 and CA is b."),
      FIG_567 = tri([[0, 0], [3.6, 0], [0.6, 2.94]], { names: "CAB", angs: ["?", null, null], sides: ["6", "7", "5"] }, "Triangle ABC. CA is 6, AB is 7 and BC is 5. The angle at C is marked with a question mark."),
      FIG_58 = tri([[0, 0], [4, 0], [1.25, 2.17]], { names: "CAB", angs: ["60°", null, null], sides: ["8", "c", "5"] }, "Triangle ABC. The angle at C is 60 degrees. CA is 8, CB is 5 and AB is c.");
  LESSONS.push({
    title: "Law of Sines and Law of Cosines",
    blurb: "Book 8-5 · Two laws that solve triangles with no right angle.",
    mins: 13, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $\\frac{x}{0.5} = 20$.", pre: "$x =$", answer: 10, skill: "Solve an equation",
        near: [{ v: 40, fb: "Multiply both sides by 0.5. Do not divide." }], hints: ["Multiply both sides by 0.5."], why: "$20 \\cdot 0.5 = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "In any $\\triangle ABC$, with side $a$ opposite $\\angle A$ and so on: **Law of Sines:** $\\frac{\\sin A}{a} = \\frac{\\sin B}{b} = \\frac{\\sin C}{c}$. **Law of Cosines:** $c^2 = a^2 + b^2 - 2ab \\cos C$. With $C = 90°$, $\\cos C = 0$ and it becomes the Pythagorean Theorem.",
        scene: { type: "method", how: HOW_8_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the Law of Sines find $b$. Use $\\sin 40° \\approx 0.643$ and $\\sin 60° \\approx 0.866$.",
        scene: { type: "walk", how: HOW_8_5, rows: [
          { step: 1, m: "a = 10 \\text{ is opposite } \\angle A = 40°", say: "A side and its opposite angle are known: the Law of Sines.", fig: FIG_LS },
          { step: 2, m: "\\frac{\\sin 40°}{10} = \\frac{\\sin 60°}{b}", say: "Each sine over the side opposite it." },
          { step: 3, m: "b \\sin 40° = 10 \\sin 60°", say: "Cross-multiply.",
            ask: { prompt: "What is $10(0.866)$?", answer: 0,
                   options: [{ t: "8.66" }, { t: "86.6", fb: "Multiplying by 10 moves the decimal point one place." }] } },
          { step: 3, m: "b = \\frac{8.66}{0.643} \\approx 13.5", say: "Divide by $\\sin 40°$. The larger angle has the longer side opposite it." }] },
        gate: true, then: "Each angle is paired with the side opposite it." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find $c$. Use $\\cos 60° = 0.5$.", art: FIG_LC,
        how: HOW_8_5, skill: "Law of Cosines",
        steps: [
          { step: 1, ask: "Two sides and the angle between them are known. Which law fits?", type: "choice", answer: 0,
            options: [{ t: "The Law of Cosines" }, { t: "The Law of Sines", fb: "No side is known together with its opposite angle." }],
            m: "c^2 = a^2 + b^2 - 2ab \\cos C", say: "Two sides and the included angle." },
          { step: 2, ask: "$c^2 = 7^2 + 10^2 - 2(7)(10)(0.5)$. What is $2(7)(10)(0.5)$?", type: "num", answer: 70, near: [{ v: 140, fb: "Multiply by 0.5 as well: half of 140." }], hint: "Half of 140.",
            m: "c^2 = 49 + 100 - 70", say: "Put in the sides and the cosine." },
          { step: 3, ask: "What is $c^2$?", type: "num", answer: 79, hint: "$149 - 70$.",
            m: "c^2 = 79", say: "$149 - 70$." },
          { step: 3, ask: "So what is $c$, to the nearest tenth?", type: "choice", answer: 0,
            options: [{ t: "8.9" }, { t: "39.5", fb: "That is half of 79. Take the square root." }],
            m: "c = \\sqrt{79} \\approx 8.9", say: "$8.9^2 = 79.21$." }],
        why: "Which, substitute, solve. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Which law would you start with?",
        bins: ["Law of Sines", "Law of Cosines"],
        cards: [{ t: "Two angles and a side", bin: 0, fb: "A third angle follows, so a side and its opposite angle are known." }, { t: "Two sides and the included angle", bin: 1, fb: "No side has its opposite angle known." },
                { t: "Three sides", bin: 1, fb: "No angle is known at all." }, { t: "Two sides and the angle opposite one of them", bin: 0, fb: "A side and its opposite angle are known." }],
        skill: "Choose the law", hints: ["Is there a side whose opposite angle you know?"],
        why: "A side with its opposite angle: Sines. Otherwise: Cosines." },
      { type: "num", prompt: "Find $b$ to the nearest tenth. Use $\\sin 30° = 0.5$ and $\\sin 45° \\approx 0.707$.", art: FIG_LS2, pre: "$b \\approx$", answer: 8.5, tol: 0.06, skill: "Law of Sines",
        near: [{ v: 4.2, tol: 0.1, fb: "45° is the larger angle, so $b$ is longer than 6: $b = \\frac{6(0.707)}{0.5}$." }],
        hints: ["$\\frac{\\sin 30°}{6} = \\frac{\\sin 45°}{b}$.", "$0.5b = 6(0.707)$."], why: "$b = \\frac{4.242}{0.5} \\approx 8.5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "With three sides, the Law of Cosines finds an **angle**. Find $m\\angle C$.",
        scene: { type: "walk", how: [["Law", "Write the law with the side opposite the angle on its own."], ["Cosine", "Solve for the cosine."], ["Inverse", "Use the inverse cosine."]], rows: [
          { step: 1, m: "7^2 = 5^2 + 6^2 - 2(5)(6)\\cos C", say: "The side opposite $\\angle C$ is 7.", fig: FIG_567 },
          { step: 2, m: "49 = 61 - 60 \\cos C", say: "Square and multiply." },
          { step: 2, m: "\\cos C = \\frac{12}{60} = 0.2", say: "Subtract 61, then divide by $-60$.",
            ask: { prompt: "What is $61 - 49$?", answer: 0,
                   options: [{ t: "12" }, { t: "110", fb: "Subtract, do not add." }] } },
          { step: 3, m: "m\\angle C = \\cos^{-1}(0.2) \\approx 78°", say: "The inverse cosine, on a calculator." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find $c$. Use $\\cos 60° = 0.5$.", art: FIG_58, pre: "$c =$", answer: 7, skill: "Law of Cosines",
        near: [{ v: 49, fb: "That is $c^2$. Take the square root." }, { v: 9.43, tol: 0.05, fb: "Subtract $2(5)(8)(0.5) = 40$ as well." }],
        hints: ["$c^2 = 5^2 + 8^2 - 2(5)(8)(0.5)$.", "$c^2 = 89 - 40$."], why: "$c^2 = 49$, so $c = 7$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Find $c$ when $a = 3$, $b = 4$ and $C = 60°$, where $\\cos 60° = 0.5$. Tap the line where the work **first** goes wrong.",
        lines: ["c^2 = 3^2 + 4^2 - 2(3)(4)\\cos 60°", "c^2 = 25 - 24", "c = 1"], answer: 1, fix: "c^2 = 25 - 12",
        fb: { 0: "The law is filled in correctly.", 2: LATER }, skill: "Law of Cosines",
        hints: ["What happened to $\\cos 60°$?"],
        why: "$2(3)(4)(0.5) = 12$, so $c^2 = 13$ and $c = \\sqrt{13}$." },
      { type: "num", kicker: "Use it", prompt: "Two ships leave a port on straight courses 60° apart. One sails 12 km and the other 16 km. How far apart are they, to the nearest tenth? Use $\\cos 60° = 0.5$.", post: "km", answer: 14.4, tol: 0.06, skill: "Law of Cosines",
        near: [{ v: 20, tol: 0.05, fb: "That is the Pythagorean Theorem, for a right angle. Subtract $2(12)(16)(0.5)$ as well." }],
        hints: ["$c^2 = 12^2 + 16^2 - 2(12)(16)(0.5)$.", "$c^2 = 400 - 192 = 208$."], why: "$\\sqrt{208} \\approx 14.4$." }
    ]
  });

  /* ===================================================================== 8-6 · Vectors */
  var HOW_8_6 = [["Components", "Component form: from the initial point to the terminal point, write ⟨change in $x$, change in $y$⟩."],
                 ["Magnitude", "The magnitude is the vector's length: $\\sqrt{x^2 + y^2}$."],
                 ["Direction", "The direction is its angle with the horizontal: $\\tan^{-1}\\left(\\frac{y}{x}\\right)$."]];
  var FIG_V1 = grid([-1, 7], [-1, 6], [{ seg: [[1, 1], [5, 1]], dash: true, c: "soft" }, { seg: [[5, 1], [5, 4]], dash: true, c: "soft" }, { arrow: [[1, 1], [5, 4]], c: "blue" }, { pt: [1, 1], name: "A", at: "sw" }, { pt: [5, 4], name: "B", at: "ne" }],
        { u: 30, alt: "A coordinate grid. An arrow runs from A at (1, 1) to B at (5, 4). Dashed segments show 4 across and 3 up." }),
      FIG_V2 = grid([-1, 8], [-1, 14], [{ seg: [[1, 1], [6, 1]], dash: true, c: "soft" }, { seg: [[6, 1], [6, 13]], dash: true, c: "soft" }, { arrow: [[1, 1], [6, 13]], c: "blue" }, { pt: [1, 1], name: "P", at: "sw" }, { pt: [6, 13], name: "Q", at: "ne" }],
        { u: 17, alt: "A coordinate grid. An arrow runs from P at (1, 1) to Q at (6, 13)." }),
      FIG_VSUM = grid([-1, 7], [-1, 7], [{ arrow: [[0, 0], [3, 1]], c: "blue" }, { arrow: [[3, 1], [5, 5]], c: "green" }, { arrow: [[0, 0], [5, 5]], c: "orange", dash: true }],
        { u: 28, alt: "A coordinate grid. A blue arrow runs from the origin to (3, 1). A green arrow continues from (3, 1) to (5, 5). A dashed orange arrow runs from the origin straight to (5, 5)." });
  LESSONS.push({
    title: "Vectors",
    blurb: "Book 8-6 · Component form, magnitude and direction, and adding vectors.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the distance from $(0, 0)$ to $(3, 4)$.", answer: 5, skill: "Distance Formula",
        near: [{ v: 7, fb: "Square each, add, then take the root." }], hints: ["$\\sqrt{3^2 + 4^2}$."], why: "$\\sqrt{25} = 5$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **vector** has both a length and a direction. It is drawn as an arrow from an **initial point** to a **terminal point**. Its **component form** ⟨$x$, $y$⟩ lists the change across and the change up. Its length is its **magnitude**.",
        scene: { type: "method", how: HOW_8_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\overrightarrow{AB}$ described three ways.",
        scene: { type: "walk", how: HOW_8_6, rows: [
          { step: 1, m: "A(1, 1) \\to B(5, 4)", say: "$A$ is the initial point, and $B$ is the terminal point.", fig: FIG_V1 },
          { step: 1, m: "⟨5 - 1, \\; 4 - 1⟩ = ⟨4, 3⟩", say: "Terminal point minus initial point: 4 across and 3 up." },
          { step: 2, m: "\\sqrt{4^2 + 3^2} = 5", say: "The magnitude: the length of the arrow.",
            ask: { prompt: "What is $\\sqrt{16 + 9}$?", answer: 0,
                   options: [{ t: "5" }, { t: "7", fb: "Add under the root first: $\\sqrt{25}$." }] } },
          { step: 3, m: "\\tan^{-1}\\left(\\frac{3}{4}\\right) \\approx 37°", say: "The direction: about 37° above the horizontal." }] },
        gate: true, then: "Components, magnitude, direction." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $\\overrightarrow{PQ}$, from $P(1, 1)$ to $Q(6, 13)$.", art: FIG_V2,
        how: HOW_8_6, skill: "Vectors",
        steps: [
          { step: 1, ask: "What is the horizontal component, $6 - 1$?", type: "num", answer: 5, hint: "Terminal $x$ minus initial $x$.",
            m: "x = 5", say: "5 across." },
          { step: 1, ask: "What is the vertical component, $13 - 1$?", type: "num", answer: 12, hint: "Terminal $y$ minus initial $y$.",
            m: "⟨5, 12⟩", say: "5 across and 12 up." },
          { step: 2, ask: "What is the magnitude, $\\sqrt{5^2 + 12^2}$?", type: "num", answer: 13, near: [{ v: 17, fb: "Square each, add, then take the root." }], hint: "$\\sqrt{25 + 144}$.",
            m: "\\sqrt{169} = 13", say: "The length of the arrow." },
          { step: 3, ask: "A calculator gives $\\tan^{-1}\\left(\\frac{12}{5}\\right) \\approx 67.4°$. What is the direction, to the nearest degree?", type: "num", answer: 67, hint: "Round 67.4.",
            m: "\\tan^{-1}\\left(\\frac{12}{5}\\right) \\approx 67°", say: "Steeper than 45°, because it goes up more than across." }],
        why: "Components, magnitude, direction. Now two on your own." },
      { type: "pair", kicker: "On your own", prompt: "Write the vector from $(3, -2)$ to $(7, 1)$ in component form. Type its components as $(x, y)$.", answer: [4, 3], skill: "Vectors",
        near: [{ v: [-4, -3], fb: "Terminal minus initial: $7 - 3$ and $1 - (-2)$." }, { v: [4, -1], fb: "$1 - (-2) = 3$: subtracting a negative adds." }],
        hints: ["$7 - 3$ and $1 - (-2)$."], why: "⟨4, 3⟩." },
      { type: "num", prompt: "Find the magnitude of the vector ⟨8, 15⟩.", answer: 17, skill: "Vectors",
        near: [{ v: 23, fb: "Square each component, add, then take the root." }], hints: ["$\\sqrt{8^2 + 15^2}$."], why: "$\\sqrt{64 + 225} = \\sqrt{289} = 17$." },
      { type: "learn", kicker: "A harder case",
        prompt: "To **add** vectors, place them head to tail. The **resultant** runs from the first tail to the last head. Add ⟨3, 1⟩ and ⟨2, 4⟩.",
        scene: { type: "walk", how: [["Add", "Add the horizontal components, and add the vertical components."], ["Magnitude", "Find the length of the resultant."], ["Direction", "Find its angle with the horizontal."]], rows: [
          { step: 1, m: "⟨3 + 2, \\; 1 + 4⟩ = ⟨5, 5⟩", say: "Across with across, up with up.", fig: FIG_VSUM },
          { step: 2, m: "\\sqrt{5^2 + 5^2} = \\sqrt{50} \\approx 7.1", say: "The magnitude of the resultant." },
          { step: 3, m: "\\tan^{-1}\\left(\\frac{5}{5}\\right) = 45°", say: "Equal components point half-way between across and up.",
            ask: { prompt: "What is $\\frac{5}{5}$?", answer: 0,
                   options: [{ t: "1" }, { t: "0", fb: "A number divided by itself is 1." }] } }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "**Parallel vectors** point the same way, or exactly opposite ways. Which vector is parallel to ⟨2, 3⟩?",
        options: [{ t: "⟨4, 6⟩" }, { t: "⟨3, 2⟩", fb: "Its slope is $\\frac{2}{3}$, but ⟨2, 3⟩ has slope $\\frac{3}{2}$." }, { t: "⟨2, −3⟩", fb: "Its slope is $-\\frac{3}{2}$: it points down, not up." }],
        answer: 0, skill: "Vectors", hints: ["Parallel vectors have the same slope: $\\frac{y}{x}$."], why: "⟨4, 6⟩ is twice ⟨2, 3⟩: the same direction, twice the magnitude." },
      { type: "choice", kicker: "Find the error",
        prompt: "For the vector from $(2, 7)$ to $(6, 4)$, Jay writes ⟨4, 3⟩. What is wrong?",
        options: [{ t: "The vertical component is $4 - 7 = -3$: the vector is ⟨4, −3⟩." },
                  { t: "The components are the wrong way round: ⟨3, 4⟩.", fb: "The horizontal change comes first, and it is $6 - 2 = 4$." },
                  { t: "Nothing. ⟨4, 3⟩ is right.", fb: "The arrow goes down, from $y = 7$ to $y = 4$." }],
        answer: 0, skill: "Vectors", hints: ["Terminal minus initial, in that order."], why: "$4 - 7 = -3$: the arrow points down." },
      { type: "num", kicker: "Use it", prompt: "A kayaker paddles east at 3 km/h, as the vector ⟨3, 0⟩. A current pushes north at 4 km/h, as ⟨0, 4⟩. Find the kayak's actual speed: the magnitude of the resultant.", post: "km/h", answer: 5, skill: "Vectors",
        near: [{ v: 7, fb: "Speeds at right angles do not simply add. Find the magnitude of ⟨3, 4⟩." }], hints: ["The resultant is ⟨3, 4⟩."], why: "$\\sqrt{3^2 + 4^2} = 5$." }
    ]
  });
  /* ================================================================ Skills */
  var TRIP = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [20, 21, 29], [9, 12, 15]];
  var FN = { sin: "\\sin", cos: "\\cos", tan: "\\tan" };
  // A right triangle drawn with its angle A of deg degrees.
  function trigAt(deg, o, alt) { return trig(4.6 * Math.cos(deg * Math.PI / 180), 4.6 * Math.sin(deg * Math.PI / 180), o, alt); }
  var SKILLS = [
    { id: "hg8-geomean", title: "Geometric mean in right triangles", lesson: 2,
      gen: function (R) {
        var k = R.int(0, 3);
        if (k === 0) { var P = R.pick([[2, 8], [3, 12], [4, 9], [4, 16], [5, 20], [2, 18], [3, 27], [9, 16], [4, 25], [8, 18]]), g = Math.sqrt(P[0] * P[1]);
          return { type: "num", prompt: "Find the geometric mean of " + P[0] + " and " + P[1] + ".", answer: g,
            near: near(g, [{ v: (P[0] + P[1]) / 2, fb: "That is the ordinary average. The geometric mean is $\\sqrt{" + P[0] + " \\cdot " + P[1] + "}$." }, { v: P[0] * P[1], fb: "That is the product. Take its square root." }]), hints: ["$x^2 = " + P[0] + " \\cdot " + P[1] + "$."], why: "$\\sqrt{" + P[0] * P[1] + "} = " + g + "$." }; }
        if (k === 1) { var Q = R.pick([[2, 8], [3, 12], [4, 9], [4, 16], [5, 20], [9, 16], [8, 18]]), h = Math.sqrt(Q[0] * Q[1]);
          return { type: "num", prompt: "Find $h$.", art: altFig({ x: String(Q[0]), y: String(Q[1]), h: "h", alt: "A right triangle on its hypotenuse, with the altitude h to the hypotenuse. The altitude splits the hypotenuse into parts of " + Q[0] + " and " + Q[1] + "." }), pre: "$h =$", answer: h,
            near: near(h, [{ v: (Q[0] + Q[1]) / 2, fb: "That is the average of the two segments. Use $h^2 = " + Q[0] + " \\cdot " + Q[1] + "$." }]), hints: ["$h^2 = " + Q[0] + " \\cdot " + Q[1] + "$."], why: "$h^2 = " + Q[0] * Q[1] + "$, so $h = " + h + "$." }; }
        if (k === 2) { var S = R.pick([[9, 16], [4, 12], [2, 6], [5, 15], [3, 9], [8, 10], [1, 3]]), a = Math.sqrt(S[0] * (S[0] + S[1]));
          return { type: "num", prompt: "Find $a$.", art: altFig({ x: String(S[0]), y: String(S[1]), a: "a", alt: "A right triangle on its hypotenuse, with the altitude to the hypotenuse. The altitude splits the hypotenuse into parts of " + S[0] + " and " + S[1] + ". The leg next to the part of " + S[0] + " is a." }), pre: "$a =$", answer: a,
            near: near(a, [{ v: Math.sqrt(S[0] * S[1]), tol: 0.01, fb: "That is the altitude. For a leg, use the **whole** hypotenuse: $" + S[0] + " \\cdot " + (S[0] + S[1]) + "$." }]), hints: ["The hypotenuse is $" + S[0] + " + " + S[1] + " = " + (S[0] + S[1]) + "$.", "$a^2 = " + S[0] + " \\cdot " + (S[0] + S[1]) + "$."], why: "$a^2 = " + S[0] * (S[0] + S[1]) + "$, so $a = " + a + "$." }; }
        var U = R.pick([[6, 4], [8, 4], [6, 2], [10, 5], [12, 8], [4, 2], [6, 3]]), y = U[0] * U[0] / U[1];
        return { type: "num", prompt: "Find $y$.", art: altFig({ x: String(U[1]), y: "y", h: String(U[0]), alt: "A right triangle on its hypotenuse, with the altitude to the hypotenuse. The altitude is " + U[0] + ". It splits the hypotenuse into parts of " + U[1] + " and y." }), pre: "$y =$", answer: y,
          near: near(y, [{ v: U[0] * U[0], fb: "That is $h^2$. Divide it by " + U[1] + "." }]), hints: ["$" + U[0] + "^2 = " + U[1] + "y$."], why: "$" + U[0] * U[0] + " = " + U[1] + "y$, so $y = " + y + "$." };
      } },
    { id: "hg8-trig", title: "Sine, cosine and tangent", lesson: 3,
      gen: function (R) {
        var k = R.int(0, 2), fn = R.pick(["sin", "cos", "tan"]), deg = 5 * R.int(4, 14), v = T3(fn, deg);
        if (k === 0) { var T = R.pick(TRIP), val = { sin: [T[0], T[2]], cos: [T[1], T[2]], tan: [T[0], T[1]] };
          return mc(R, { prompt: "Find $" + FN[fn] + " A$.", art: trig(4.6 * T[1] / T[2], 4.6 * T[0] / T[2], { adj: String(T[1]), opp: String(T[0]), hyp: String(T[2]) }, "A right triangle ACB with the right angle at C. AC is " + T[1] + ", CB is " + T[0] + " and AB is " + T[2] + "."), right: "$\\frac{" + val[fn][0] + "}{" + val[fn][1] + "}$",
            wrong: ["sin", "cos", "tan"].filter(function (f) { return f !== fn; }).map(function (f) { return { t: "$\\frac{" + val[f][0] + "}{" + val[f][1] + "}$", fb: "That is $" + FN[f] + " A$." }; }),
            hints: ["From $A$: opposite is " + T[0] + ", adjacent is " + T[1] + ", hypotenuse is " + T[2] + "."], why: { sin: "Opposite over hypotenuse.", cos: "Adjacent over hypotenuse.", tan: "Opposite over adjacent." }[fn] }); }
        var len = 2 * R.int(5, 25), o = { A: deg + "°" }, name = { sin: ["hyp", "opp"], cos: ["hyp", "adj"], tan: ["adj", "opp"] }[fn];
        if (k === 1) { o[name[0]] = String(len); o[name[1]] = "x";
          return { type: "num", prompt: "Find $x$ to the nearest tenth. Use $" + FN[fn] + " " + deg + "° \\approx " + v + "$.", art: trigAt(deg, o, "A right triangle with an angle of " + deg + " degrees. One side is " + len + " and another is x."), pre: "$x \\approx$", answer: r1(len * v), tol: 0.11,
            near: [{ v: r1(len / v), tol: 0.11, fb: "$x$ is on top of the ratio, so multiply: $" + len + "(" + v + ")$." }], hints: ["$" + FN[fn] + " " + deg + "° = \\frac{x}{" + len + "}$."], why: "$" + len + "(" + v + ") \\approx " + r1(len * v) + "$." }; }
        o[name[1]] = String(len); o[name[0]] = "x";
        return { type: "num", prompt: "Find $x$ to the nearest tenth. Use $" + FN[fn] + " " + deg + "° \\approx " + v + "$.", art: trigAt(deg, o, "A right triangle with an angle of " + deg + " degrees. One side is " + len + " and another is x."), pre: "$x \\approx$", answer: r1(len / v), tol: 0.11,
          near: [{ v: r1(len * v), tol: 0.11, fb: "$x$ is underneath in the ratio, so divide: $\\frac{" + len + "}{" + v + "}$." }], hints: ["$" + FN[fn] + " " + deg + "° = \\frac{" + len + "}{x}$."], why: "$" + len + " \\div " + v + " \\approx " + r1(len / v) + "$." };
      } },
    { id: "hg8-inverse", title: "Inverse ratios and solving right triangles", lesson: 4,
      gen: function (R) {
        var k = R.int(0, 2), T = R.pick(TRIP);
        if (k === 0) { var fn = R.pick(["sin", "cos", "tan"]), val = { sin: [T[0], T[2]], cos: [T[1], T[2]], tan: [T[0], T[1]] }, words = { sin: "opposite $\\angle A$ is " + T[0] + " and the hypotenuse is " + T[2], cos: "adjacent to $\\angle A$ is " + T[1] + " and the hypotenuse is " + T[2], tan: "opposite $\\angle A$ is " + T[0] + " and the side adjacent to it is " + T[1] };
          return mc(R, { prompt: "In a right triangle, the side " + words[fn] + ". Which expression gives $m\\angle A$?", right: "$" + FN[fn] + "^{-1}\\left(\\frac{" + val[fn][0] + "}{" + val[fn][1] + "}\\right)$",
            wrong: ["sin", "cos", "tan"].filter(function (f) { return f !== fn; }).map(function (f) { return { t: "$" + FN[f] + "^{-1}\\left(\\frac{" + val[fn][0] + "}{" + val[fn][1] + "}\\right)$", fb: { sin: "Sine is opposite over hypotenuse.", cos: "Cosine is adjacent over hypotenuse.", tan: "Tangent is opposite over adjacent." }[f] }; }),
            hints: ["Which ratio uses those two sides?"], why: { sin: "Opposite over hypotenuse is the sine.", cos: "Adjacent over hypotenuse is the cosine.", tan: "Opposite over adjacent is the tangent." }[fn] }); }
        if (k === 1) { var a = R.int(12, 78);
          if (R.chance(0.5)) return { type: "num", prompt: "In right triangle $ABC$ with the right angle at $C$, $m\\angle A \\approx " + a + "°$. Find $m\\angle B$.", post: "°", answer: 90 - a,
            near: near(90 - a, [{ v: 180 - a, fb: "The two acute angles of a right triangle add to 90°." }]), hints: ["The acute angles are complementary."], why: "$90 - " + a + " = " + (90 - a) + "$." };
          var g = R.chance(0.5);
          return { type: "num", prompt: "A right triangle has a hypotenuse of " + T[2] + " and a leg of " + T[g ? 0 : 1] + ". Find the third side.", answer: T[g ? 1 : 0],
            near: near(T[g ? 1 : 0], [{ v: T[2] - T[g ? 0 : 1], fb: "Subtract the squares, not the lengths." }]), hints: ["$" + T[2] + "^2 - " + T[g ? 0 : 1] + "^2$."], why: "$\\sqrt{" + (T[2] * T[2] - T[g ? 0 : 1] * T[g ? 0 : 1]) + "} = " + T[g ? 1 : 0] + "$." }; }
        var S = R.pick([["\\sin A = \\frac{1}{2}", 30], ["\\cos A = \\frac{1}{2}", 60], ["\\tan A = 1", 45], ["\\sin A = \\frac{\\sqrt{2}}{2}", 45], ["\\sin A = \\frac{\\sqrt{3}}{2}", 60], ["\\cos A = \\frac{\\sqrt{3}}{2}", 30], ["\\tan A = \\sqrt{3}", 60], ["\\cos A = \\frac{\\sqrt{2}}{2}", 45]]);
        return mc(R, { prompt: "In a right triangle, $" + S[0] + "$. Use a special right triangle to find $m\\angle A$.", right: "$" + S[1] + "°$", keep: true,
          wrong: [30, 45, 60].filter(function (d) { return d !== S[1]; }).map(function (d) { return { t: "$" + d + "°$", fb: "Check the sides of the special triangles: $x$, $x$, $x\\sqrt{2}$ and $x$, $x\\sqrt{3}$, $2x$." }; }),
          hints: ["45°-45°-90°: sides $x$, $x$, $x\\sqrt{2}$. 30°-60°-90°: sides $x$, $x\\sqrt{3}$, $2x$, with $x$ opposite the 30° angle."], why: "That ratio belongs to the " + S[1] + "° angle." });
      } },
    { id: "hg8-elevation", title: "Angles of elevation and depression", lesson: 5,
      gen: function (R) {
        var k = R.int(0, 3), deg = 5 * R.int(3, 12), t = T3("tan", deg), s = T3("sin", deg);
        if (k === 0) { var d = 10 * R.int(2, 9);
          return { type: "num", prompt: "From " + d + " m away, the angle of elevation to the top of a mast is " + deg + "°. How high is the mast, to the nearest tenth? Use $\\tan " + deg + "° \\approx " + t + "$.", post: "m", answer: r1(d * t), tol: 0.11,
            near: [{ v: r1(d / t), tol: 0.11, fb: "The height is on top of the ratio: multiply " + d + " by the tangent." }], hints: ["$\\tan " + deg + "° = \\frac{h}{" + d + "}$."], why: "$" + d + "(" + t + ") \\approx " + r1(d * t) + "$." }; }
        if (k === 1) { var h = 10 * R.int(3, 12);
          return { type: "num", prompt: "From the top of a " + h + " m cliff, the angle of depression to a boat is " + deg + "°. How far is the boat from the foot of the cliff, to the nearest metre? Use $\\tan " + deg + "° \\approx " + t + "$.", art: depFig(deg + "°", h + " m", "d", "A cliff " + h + " metres high, with a line of sight sloping down to a boat at an angle of depression of " + deg + " degrees."), post: "m", answer: Math.round(h / t), tol: 1,
            near: [{ v: Math.round(h * t), tol: 1, fb: "The distance is underneath in the ratio: divide " + h + " by the tangent." }], hints: ["The angle at the boat is " + deg + "° too.", "$\\tan " + deg + "° = \\frac{" + h + "}{d}$."], why: "$" + h + " \\div " + t + " \\approx " + Math.round(h / t) + "$." }; }
        if (k === 2) { var Ls = 10 * R.int(3, 12);
          return { type: "num", prompt: "A kite string " + Ls + " m long makes a " + deg + "° angle of elevation with the ground. How high is the kite, to the nearest tenth? Use $\\sin " + deg + "° \\approx " + s + "$.", post: "m", answer: r1(Ls * s), tol: 0.11,
            near: [{ v: r1(Ls / s), tol: 0.11, fb: "The height is shorter than the string: multiply " + Ls + " by the sine." }], hints: ["$\\sin " + deg + "° = \\frac{h}{" + Ls + "}$."], why: "$" + Ls + "(" + s + ") \\approx " + r1(Ls * s) + "$." }; }
        return { type: "num", prompt: "From the top of a tower, the angle of depression to a car is " + deg + "°. What is the angle of elevation from the car to the top of the tower?", post: "°", answer: deg,
          near: near(deg, [{ v: 90 - deg, fb: "That is the angle between the tower and the line of sight. The two level lines are parallel, so the angles are equal." }]), hints: ["They are alternate interior angles on parallel horizontal lines."], why: "Alternate interior angles are congruent: " + deg + "°." };
      } },
    { id: "hg8-laws", title: "Law of Sines and Law of Cosines", lesson: 6,
      gen: function (R) {
        var k = R.int(0, 2);
        if (k === 0) { var Q = R.pick([["two angles and a side", "Law of Sines", "A third angle follows, so a side and its opposite angle are known."], ["two sides and the included angle", "Law of Cosines", "No side has its opposite angle known."], ["three sides", "Law of Cosines", "No angle is known at all."],
            ["two sides and the angle opposite one of them", "Law of Sines", "A side and its opposite angle are known."]]);
          return mc(R, { prompt: "You know " + Q[0] + " of a triangle. Which law do you start with?", right: Q[1], keep: true,
            wrong: [{ t: Q[1] === "Law of Sines" ? "Law of Cosines" : "Law of Sines", fb: Q[2] }], hints: ["Is there a side whose opposite angle you know?"], why: Q[2] }); }
        if (k === 1) { var obt = R.chance(0.4), S = obt ? R.pick([[3, 5, 7], [7, 8, 13], [5, 16, 19]]) : R.pick([[5, 8, 7], [3, 8, 7], [7, 15, 13], [8, 15, 13], [5, 21, 19], [16, 21, 19]]), c = obt ? "-0.5" : "0.5", ang = obt ? 120 : 60;
          return { type: "num", prompt: "In $\\triangle ABC$, $a = " + S[0] + "$, $b = " + S[1] + "$ and $m\\angle C = " + ang + "°$. Find $c$. Use $\\cos " + ang + "° = " + c + "$.", pre: "$c =$", answer: S[2],
            near: near(S[2], [{ v: S[2] * S[2], fb: "That is $c^2$. Take the square root." }]), hints: ["$c^2 = " + S[0] + "^2 + " + S[1] + "^2 - 2(" + S[0] + ")(" + S[1] + ")(" + c + ")$.", "$c^2 = " + (S[0] * S[0] + S[1] * S[1]) + (obt ? " + " : " - ") + S[0] * S[1] + "$."], why: "$c^2 = " + S[2] * S[2] + "$, so $c = " + S[2] + "$." }; }
        var A = 5 * R.int(6, 10), B = A + 5 * R.int(2, 6), a = 2 * R.int(3, 10), sa = T3("sin", A), sb = T3("sin", B), b = r1(a * sb / sa);
        return { type: "num", prompt: "In $\\triangle ABC$, $m\\angle A = " + A + "°$, $m\\angle B = " + B + "°$ and $a = " + a + "$. Find $b$ to the nearest tenth. Use $\\sin " + A + "° \\approx " + sa + "$ and $\\sin " + B + "° \\approx " + sb + "$.", pre: "$b \\approx$", answer: b, tol: 0.11,
          near: [{ v: r1(a * sa / sb), tol: 0.11, fb: "$\\angle B$ is the larger angle, so $b$ is longer than $a$: $b = \\frac{" + a + "(" + sb + ")}{" + sa + "}$." }], hints: ["$\\frac{\\sin " + A + "°}{" + a + "} = \\frac{\\sin " + B + "°}{b}$."], why: "$b = \\frac{" + a + "(" + sb + ")}{" + sa + "} \\approx " + b + "$." };
      } },
    { id: "hg8-vector", title: "Vectors", lesson: 7,
      gen: function (R) {
        var k = R.int(0, 3), T = R.pick(TRIP);
        if (k === 0) { var P = [R.int(-5, 3), R.int(-5, 3)], c = [R.nz(-6, 6), R.nz(-6, 6)], Q = [P[0] + c[0], P[1] + c[1]];
          return { type: "pair", prompt: "Write the vector from $" + pt(P) + "$ to $" + pt(Q) + "$ in component form. Type its components as $(x, y)$.", answer: c,
            near: [{ v: [-c[0], -c[1]], fb: "Terminal minus initial, in that order." }], hints: ["$" + minus(String(Q[0]), P[0]) + "$ and $" + minus(String(Q[1]), P[1]) + "$."], why: "⟨" + nm(c[0]) + ", " + nm(c[1]) + "⟩." }; }
        if (k === 1) { var sx = R.pick([1, -1]), sy = R.pick([1, -1]);
          return { type: "num", prompt: "Find the magnitude of the vector ⟨" + nm(sx * T[0]) + ", " + nm(sy * T[1]) + "⟩.", answer: T[2],
            near: near(T[2], [{ v: T[0] + T[1], fb: "Square each component, add, then take the root." }]), hints: ["$\\sqrt{" + T[0] + "^2 + " + T[1] + "^2}$."], why: "$\\sqrt{" + (T[0] * T[0] + T[1] * T[1]) + "} = " + T[2] + "$." }; }
        if (k === 2) { var u = [R.nz(-5, 5), R.nz(-5, 5)], w = [R.nz(-5, 5), R.nz(-5, 5)];
          return { type: "pair", prompt: "Add the vectors ⟨" + nm(u[0]) + ", " + nm(u[1]) + "⟩ and ⟨" + nm(w[0]) + ", " + nm(w[1]) + "⟩. Type the components of the resultant as $(x, y)$.", answer: [u[0] + w[0], u[1] + w[1]],
            near: [{ v: [u[0] - w[0], u[1] - w[1]], fb: "Add the components. Do not subtract." }], hints: ["Add the horizontal components, then the vertical ones."], why: "⟨" + nm(u[0] + w[0]) + ", " + nm(u[1] + w[1]) + "⟩." }; }
        var a = R.int(1, 4), b = R.int(1, 5), m = R.int(2, 3);
        if (a === b) b = a + 1;
        return mc(R, { prompt: "Which vector is parallel to ⟨" + a + ", " + b + "⟩?", right: "⟨" + a * m + ", " + b * m + "⟩",
          wrong: [{ t: "⟨" + b + ", " + a + "⟩", fb: "Swapping the components changes the slope." }, { t: "⟨" + (a + m) + ", " + (b + m) + "⟩", fb: "Adding the same number to each component changes the slope. Multiply instead." }],
          hints: ["Parallel vectors have the same slope: $\\frac{y}{x}$."], why: "It is " + m + " times the vector: the same direction." });
      } }
  ];
  L.unit("geo", 8, {
    title: "Right Triangles and Trigonometry",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "The geometric mean, and sine, cosine and tangent.",
        skills: ["hg8-geomean", "hg8-trig"], per: 3 },
      { title: "Quiz 2", after: 5, blurb: "Solving right triangles, and angles of elevation and depression.",
        skills: ["hg8-inverse", "hg8-elevation"], per: 3 },
      { title: "Quiz 3", after: 7, blurb: "The Law of Sines, the Law of Cosines, and vectors.",
        skills: ["hg8-laws", "hg8-vector"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:8", {
    2: { name: "Similarity in right triangles", frame: "The geometric mean of $a$ and $b$ is [[√(ab)]]. The altitude to the hypotenuse is the geometric mean of the two [[segments]] of the hypotenuse, and it makes three [[similar]] triangles.",
         chips: ["(a + b) ÷ 2", "congruent"] },
    3: { name: "Trigonometric ratios", frame: "Sine is [[opposite]] over hypotenuse. Cosine is [[adjacent]] over hypotenuse. Tangent is opposite over [[adjacent]].",
         chips: ["hypotenuse", "inverse"] },
    4: { name: "Solving right triangles", frame: "An [[inverse]] ratio turns a ratio back into an angle. The two acute angles of a right triangle add to [[90°]]. The third side comes from the [[Pythagorean]] Theorem.",
         chips: ["180°", "Hinge"] },
    5: { name: "Elevation and depression", frame: "An angle of elevation is measured [[up]] from a horizontal line. An angle of depression is measured [[down]] from a [[horizontal]] line. The two are congruent.",
         chips: ["vertical", "across"] },
    6: { name: "Laws of Sines and Cosines", frame: "Use the Law of [[Sines]] when a side and its opposite angle are known. Use the Law of [[Cosines]] with two sides and the [[included]] angle, or with three sides.",
         chips: ["Tangents", "opposite"] },
    7: { name: "Vectors", frame: "A vector has [[magnitude]] and direction. Its component form lists the change in $x$ and the change in $y$, [[terminal]] point minus initial point. Vectors are added by adding their [[components]].",
         chips: ["slope", "midpoints"] }
  });
})();
