/* ==========================================================================
   Geometry — Unit 11: Circles. See lab/core.js for the format and
   lab/geotools.js for the drawing kit.

   Follows Holt Geometry, Chapter 11, section for section (11-1 to 11-7),
   after a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   Tangents, secants and chords (11-1), arcs and chords (11-2), sector area
   and arc length (11-3), inscribed angles (11-4), angles made by chords,
   secants and tangents (11-5), their segment products (11-6), and the
   equation of a circle (11-7). An arc is written \overarc{AB}.

   An answer with π in it is typed as the number in front of π.

   Lessons carry v: 4 (see Unit 1). Skills are hg11-….

   Eight lessons, seven skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  var PI_POST = "$\\pi$", RC = 2.2, O = [0, 0];
  // The point of the circle (centre the origin, radius RC) in the direction deg; with r, at that distance instead.
  function on(deg, r) { return GT.polar(O, r == null ? RC : r, deg); }
  function compass(d) { d = ((d % 360) + 360) % 360; return ["e", "ne", "n", "nw", "w", "sw", "s", "se"][Math.round(d / 45) % 8]; }
  /* A circle with things drawn in it. items: figure items. names: { A: 40, B: 150 } puts named points on the circle
     at those directions. o.centre: false hides the centre O; o.cname, o.cat: its name and where the name goes;
     o.x, o.y: the window; o.arcs: { "70°": 55 } writes a measure just outside the circle in that direction. */
  function circle(items, names, alt, o) {
    o = o || {};
    var pts = Object.keys(names || {}).map(function (k) { return { pt: on(names[k]), name: k, at: compass(names[k]) }; });
    var arcs = Object.keys(o.arcs || {}).map(function (k) { return { word: k, at: on(o.arcs[k], RC + 0.5), c: "orange" }; });
    return plain(o.x || [-3.1, 3.1], o.y || [-3.1, 3.1], [{ circle: [O, RC], c: "blue" }].concat(items || [], arcs, o.centre === false ? [] : [{ pt: O, name: o.cname || "O", at: o.cat || "sw" }], pts), { u: o.u || 32, alt: alt });
  }
  function chord(a, b, c) { return { seg: [on(a), on(b)], c: c || "blue" }; }
  function radius(a, c) { return { seg: [O, on(a)], c: c || "orange" }; }
  // Where the lines p1p2 and p3p4 cross.
  function cross(p1, p2, p3, p4) {
    var d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]), t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
    return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
  }
  // A sector of the circle from direction a to direction b, shaded.
  function sector(a, b, c) {
    var P = [O];
    for (var d = a; d <= b; d += 5) P.push(on(d));
    return { path: P, closed: true, fill: true, c: c || "orange" };
  }
  // Two secants from a point P outside the circle, cutting off a near arc of `near` degrees and a far arc of `far`.
  // Returns { P, N: [near points], F: [far points] }: the secants are P–N[0]–F[0] and P–N[1]–F[1].
  function secants(near, far) {
    var n = on(near / 2), f = on(180 - far / 2), P = cross(n, f, O, [1, 0]);
    return { P: P, N: [n, [n[0], -n[1]]], F: [f, [f[0], -f[1]]] };
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
    blurb: "Before Chapter 11 · Circumference and area, the Pythagorean Theorem, and solving equations.",
    mins: 6, v: 4,
    steps: [
      { type: "num", kicker: "Check 1 · Circles", prompt: "A circle has a radius of 6. Find its circumference. Type the number in front of $\\pi$.", post: PI_POST, answer: 12, skill: "Circles",
        near: [{ v: 36, fb: "That is the area, $\\pi r^2$. The circumference is $2\\pi r$." }], hints: ["$2\\pi(6)$."], why: "$2\\pi(6) = 12\\pi$." },
      { type: "num", prompt: "The same circle: find its area. Type the number in front of $\\pi$.", post: PI_POST, answer: 36, skill: "Circles",
        near: [{ v: 12, fb: "That is the circumference. The area is $\\pi r^2$." }], hints: ["$\\pi(6)^2$."], why: "$\\pi(6)^2 = 36\\pi$." },
      { type: "num", kicker: "Check 2 · Pythagorean Theorem", prompt: "The legs of a right triangle are 5 and 12. Find the hypotenuse.", answer: 13, skill: "Pythagorean Theorem",
        near: [{ v: 17, fb: "Square each leg, add, then take the root." }], hints: ["$5^2 + 12^2 = c^2$."], why: "$\\sqrt{169} = 13$." },
      { type: "num", prompt: "A right triangle has a hypotenuse of 10 and a leg of 8. Find the other leg.", answer: 6, skill: "Pythagorean Theorem",
        near: [{ v: 2, fb: "Subtract the squares, not the lengths." }], hints: ["$10^2 - 8^2$."], why: "$\\sqrt{100 - 64} = 6$." },
      { type: "num", kicker: "Check 3 · Equations", prompt: "Solve $4 \\cdot 6 = 3x$.", pre: "$x =$", answer: 8, skill: "Solve an equation",
        near: [{ v: 21, fb: "Divide 24 by 3. Do not subtract." }], hints: ["$24 = 3x$."], why: "$24 \\div 3 = 8$." },
      { type: "num", prompt: "Solve $35 = \\frac{1}{2}(120 - x)$.", pre: "$x =$", answer: 50, skill: "Solve an equation",
        near: [{ v: 85, fb: "Double both sides first: $70 = 120 - x$." }], hints: ["Multiply both sides by 2: $70 = 120 - x$."], why: "$x = 120 - 70 = 50$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 11-1**. If **check 1** slipped, see lesson 9-2. If **check 2** slipped, see lesson 5-7.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });

  /* ================================================== 11-1 · Lines that intersect circles */
  var HOW_11_1 = [["Name", "A chord has both ends on the circle. A secant is a line through two points of it. A tangent touches it at exactly one point."],
                  ["Radius", "A tangent is perpendicular to the radius drawn to the point of tangency."],
                  ["Equal", "Two tangent segments from the same outside point are congruent."]];
  var TP = [4.4, 0], TA = on(60), TB = on(-60);
  function tanFig(pa, pb, oa, alt) {
    return circle([{ seg: [TP, TA] }, { seg: [TP, TB] }, radius(60), { angle: [O, TA, TP], right: true, c: "orange" }]
      .concat(lab(pa, TA, TP, 1), lab(pb, TP, TB, 1), lab(oa, O, TA, 1, 10), [{ pt: TP, name: "P", at: "e" }]), { A: 60, B: -60 }, alt, { x: [-3.1, 5.3] });
  }
  var FIG_T1 = tanFig("12", null, "5", "Circle O. From a point P outside it, two segments touch the circle at A and at B. Radius OA meets PA at a right angle. PA is 12 and OA is 5."),
      FIG_T2 = tanFig("3x + 2", "5x − 6", null, "Circle O. From a point P outside it, two segments touch the circle at A and at B. PA is 3x + 2 and PB is 5x − 6."),
      FIG_LINES = circle([chord(150, 60), { line: [on(200), on(-20)], c: "green" }, { line: [[-1, -RC], [1, -RC]], c: "orange" }, radius(-90, "soft"), { pt: [1.9, -RC], name: "P", at: "s", c: "orange" }],
        { A: 150, B: 60, C: 200, D: -20, T: -90 }, "Circle O. Segment AB joins two points of the circle. A line passes through the circle at C and at D. Another line touches the circle only at T, and passes through P. Segment OT joins the centre to T.", { cat: "n" }),
      FIG_T3 = tanFig("8", null, "6", "Circle O with a point P outside it. PA touches the circle at A, meeting radius OA at a right angle. PA is 8 and OA is 6.");
  LESSONS.push({
    title: "Lines that intersect circles",
    blurb: "Book 11-1 · Chords, secants and tangents, and two facts about tangents.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A circle has a radius of 5. What is its diameter?", answer: 10, skill: "Circles",
        near: [{ v: 2.5, fb: "The diameter is twice the radius, not half." }], hints: ["Twice the radius."], why: "$2 \\cdot 5 = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **chord** is a segment with both ends on the circle. A **secant** is a line that cuts the circle at two points. A **tangent** is a line that touches the circle at exactly one point, the **point of tangency**.",
        scene: { type: "method", how: HOW_11_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch both tangent facts used. $\\overline{PA}$ and $\\overline{PB}$ are tangent to circle $O$.",
        scene: { type: "walk", how: HOW_11_1, rows: [
          { step: 1, m: "\\overline{PA} \\text{ is tangent at } A", say: "It touches the circle at $A$ only.", fig: FIG_T1 },
          { step: 2, m: "\\overline{OA} \\perp \\overline{PA}", say: "A tangent is perpendicular to the radius at the point of tangency. So $\\triangle OAP$ is a right triangle." },
          { step: 2, m: "OP = \\sqrt{5^2 + 12^2} = 13", say: "The Pythagorean Theorem.",
            ask: { prompt: "What is $\\sqrt{25 + 144}$?", answer: 0,
                   options: [{ t: "13" }, { t: "17", fb: "Add under the root first: $\\sqrt{169}$." }] } },
          { step: 3, m: "PB = PA = 12", say: "Two tangent segments from the same point are congruent." }] },
        gate: true, then: "A right angle at the point of tangency, and two equal tangents." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. $\\overline{PA}$ and $\\overline{PB}$ are tangent to circle $O$. Find $PA$.", art: FIG_T2,
        how: HOW_11_1, skill: "Tangents",
        steps: [
          { step: 1, ask: "What are $\\overline{PA}$ and $\\overline{PB}$?", type: "choice", answer: 0,
            options: [{ t: "Tangent segments from the same point" }, { t: "Chords", fb: "A chord has both ends on the circle. $P$ is outside it." }],
            m: "\\overline{PA}, \\overline{PB} \\text{ are tangent segments}", say: "Each touches the circle once." },
          { step: 2, ask: "What angle does radius $\\overline{OA}$ make with $\\overline{PA}$, in degrees?", type: "num", answer: 90, hint: "A tangent and the radius to its point of tangency.",
            m: "\\overline{OA} \\perp \\overline{PA}", say: "Always a right angle." },
          { step: 3, ask: "The two tangent segments are congruent: $3x + 2 = 5x - 6$. What is $x$?", type: "num", answer: 4, near: [{ v: 2, fb: "Add 6 to both sides: $8 = 2x$." }], hint: "$8 = 2x$.",
            m: "x = 4", say: "$8 = 2x$." },
          { step: 3, ask: "So what is $PA$?", type: "num", answer: 14, near: [{ v: 4, fb: "That is $x$. Substitute it into $3x + 2$." }], hint: "$3(4) + 2$.",
            m: "PA = 3(4) + 2 = 14", say: "And $PB = 5(4) - 6 = 14$." }],
        why: "Name, radius, equal. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "Match each part of the figure to its name.", art: FIG_LINES,
        slots: [{ id: "ch", label: "Chord" }, { id: "se", label: "Secant" }, { id: "ta", label: "Tangent" }, { id: "ra", label: "Radius" }],
        cards: [{ t: nb("$\\overline{AB}$"), slot: "ch", fb: "A segment with both ends on the circle." }, { t: nb("$\\overleftrightarrow{CD}$"), slot: "se", fb: "A line through two points of the circle." },
                { t: nb("$\\overleftrightarrow{TP}$"), slot: "ta", fb: "A line that touches the circle only at $T$." }, { t: nb("$\\overline{OT}$"), slot: "ra", fb: "From the centre to the circle." }],
        skill: "Lines and circles", hints: ["How many points of the circle does each one meet? Is it a line or a segment?"],
        why: "Chord: two ends on the circle. Secant: a line through two points. Tangent: one point. Radius: centre to circle." },
      { type: "num", prompt: "$\\overline{PA}$ is tangent to circle $O$ at $A$. Find $OP$.", art: FIG_T3, answer: 10, skill: "Tangents",
        near: [{ v: 14, fb: "The tangent and the radius meet at a right angle: use the Pythagorean Theorem." }], hints: ["$\\triangle OAP$ is a right triangle with legs 6 and 8."], why: "$\\sqrt{6^2 + 8^2} = 10$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The converse works too: a line perpendicular to a radius at its outer end **is** a tangent. In circle $O$, $OT = 6$, $PT = 8$ and $OP = 10$. Is $\\overline{PT}$ tangent at $T$?",
        scene: { type: "walk", how: [["Squares", "Square the three lengths."], ["Compare", "Test the Pythagorean Theorem."], ["Decide", "A right angle at $T$ means the line is perpendicular to the radius: a tangent."]], rows: [
          { step: 1, m: "6^2 = 36 \\qquad 8^2 = 64 \\qquad 10^2 = 100", say: "The radius, the segment, and the distance to the centre." },
          { step: 2, m: "36 + 64 = 100", say: "The squares fit the Pythagorean Theorem.",
            ask: { prompt: "So where is the right angle of $\\triangle OTP$?", answer: 0,
                   options: [{ t: "At $T$, opposite the longest side $\\overline{OP}$" }, { t: "At $O$", fb: "The right angle is opposite the longest side, which is $\\overline{OP}$." }] } },
          { step: 3, m: "\\overline{OT} \\perp \\overline{PT}", say: "A right angle at $T$." },
          { step: 3, m: "\\overline{PT} \\text{ is tangent at } T", say: "Perpendicular to the radius at its outer end." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "In circle $O$, $OT = 5$, $PT = 11$ and $OP = 12$, where $T$ is on the circle. Is $\\overline{PT}$ tangent at $T$?",
        options: [{ t: "No: $25 + 121 = 146$, which is not $144$" }, { t: "Yes: $5 + 11 > 12$", fb: "That only shows the three lengths make a triangle. A tangent needs a right angle." }, { t: "Yes: it meets the circle at $T$", fb: "A secant meets the circle at $T$ too. Test for a right angle." }],
        answer: 0, skill: "Tangents", hints: ["Does $5^2 + 11^2$ equal $12^2$?"], why: "No right angle at $T$, so the line is not perpendicular to the radius." },
      { type: "choice", kicker: "Find the error",
        prompt: "A circle has a radius of 6, and a tangent segment from $P$ to the circle is 8 long. Sam finds the distance from $P$ to the centre as $6 + 8 = 14$. What is wrong?",
        options: [{ t: "The radius and the tangent meet at a right angle, so use the Pythagorean Theorem: 10." },
                  { t: "He should subtract: 2.", fb: "The three lengths make a right triangle, with the distance as its hypotenuse." },
                  { t: "Nothing. The two lengths add.", fb: "They would add only if they lay along one straight line." }],
        answer: 0, skill: "Tangents", hints: ["What angle is between the radius and the tangent?"], why: "$\\sqrt{6^2 + 8^2} = 10$." },
      { type: "num", kicker: "Use it", prompt: "A round water tank is held by two straight cables that run from one anchor point on the ground and touch the tank's side. One cable is 7.5 m long from the anchor to the tank. How long is the other?", post: "m", answer: 7.5, skill: "Tangents",
        hints: ["Both cables are tangent segments from the same point."], why: "Tangent segments from one point are congruent: 7.5 m." }
    ]
  });

  /* ================================================================ 11-2 · Arcs and chords */
  var HOW_11_2 = [["Central", "A central angle has its vertex at the centre. Its arc has the same measure."],
                  ["Add", "Arcs that share only an endpoint add. A whole circle is 360°, and a semicircle is 180°."],
                  ["Chords", "Congruent chords have congruent arcs. A radius perpendicular to a chord bisects the chord and its arc."]];
  var CM = [0, -0.846], CA = [-2.03, -0.846], CB = [2.03, -0.846];
  var FIG_ARC1 = circle([radius(20), radius(90), radius(140), { angle: [on(20), O, on(90)], say: "70°", c: "orange" }, { angle: [on(90), O, on(140)], say: "50°", c: "green", r: 30 }], { A: 20, B: 90, C: 140, D: 270 },
        "Circle O with points A, B and C on its upper part and D at the bottom. Angle AOB is 70 degrees and angle BOC is 50 degrees.", { cat: "s" }),
      FIG_ARC2 = circle([radius(160), radius(80), chord(160, 80), chord(-20, -100, "green"), { angle: [on(80), O, on(160)], say: "80°", c: "orange" }], { A: 160, B: 80, C: -20, D: -100 },
        "Circle O. Angle AOB is 80 degrees. Chords AB and CD are the same length.", { cat: "s" }),
      FIG_CHD = circle([{ seg: [CA, CB] }, { seg: [O, CM], c: "orange" }, { seg: [O, CA], c: "green" }, { angle: [CB, CM, O], right: true, c: "orange" }, { pt: CA, name: "A", at: "sw" }, { pt: CB, name: "B", at: "se" }, { pt: CM, name: "M", at: "s" }]
        .concat(lab("5", O, CM, -1, 10), lab("13", CA, O, 1, 11)), null, "Circle O with chord AB. A segment from O meets AB at M at a right angle. OM is 5 and radius OA is 13.", { cat: "n" });
  LESSONS.push({
    title: "Arcs and chords",
    blurb: "Book 11-2 · An arc measures the same as its central angle, and congruent chords have congruent arcs.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $360 - 110$.", answer: 250, skill: "Arithmetic",
        near: [{ v: 70, fb: "That is $180 - 110$. Subtract from 360." }], hints: ["$360 - 100 = 260$, then take 10 more."], why: "$360 - 110 = 250$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **central angle** has its vertex at the centre. An **arc** is a piece of the circle. A **minor arc** is less than a semicircle, and measures the same as its central angle. A **major arc** is the rest: 360° minus the minor arc.",
        scene: { type: "method", how: HOW_11_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch three arcs of circle $O$ measured.",
        scene: { type: "walk", how: HOW_11_2, rows: [
          { step: 1, m: "m\\overarc{AB} = m\\angle AOB = 70°", say: "A minor arc measures the same as its central angle.", fig: FIG_ARC1 },
          { step: 1, m: "m\\overarc{BC} = 50°", say: "The same, for $\\angle BOC$." },
          { step: 2, m: "m\\overarc{AC} = 70° + 50° = 120°", say: "Arc Addition: the two arcs share only the point $B$.",
            ask: { prompt: "The whole circle is 360°. What is $360 - 120$?", answer: 0,
                   options: [{ t: "240" }, { t: "60", fb: "That is $180 - 120$. A whole circle is 360°." }] } },
          { step: 2, m: "m\\overarc{ADC} = 360° - 120° = 240°", say: "The major arc: the long way round, through $D$." }] },
        gate: true, then: "Minor arc: the central angle. Major arc: 360° minus it." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. In circle $O$, $m\\angle AOB = 80°$, and chords $\\overline{AB}$ and $\\overline{CD}$ are congruent.", art: FIG_ARC2,
        how: HOW_11_2, skill: "Arcs and chords",
        steps: [
          { step: 1, ask: "What is $m\\overarc{AB}$, in degrees?", type: "num", answer: 80, hint: "The same as its central angle.",
            m: "m\\overarc{AB} = 80°", say: "The measure of its central angle." },
          { step: 2, ask: "What is the measure of the major arc from $A$ round to $B$, in degrees?", type: "num", answer: 280, near: [{ v: 100, fb: "That is $180 - 80$. A whole circle is 360°." }], hint: "$360 - 80$.",
            m: "360° - 80° = 280°", say: "The rest of the circle." },
          { step: 3, ask: "$\\overline{CD} \\cong \\overline{AB}$. What is $m\\overarc{CD}$, in degrees?", type: "num", answer: 80, hint: "Congruent chords have congruent arcs.",
            m: "m\\overarc{CD} = 80°", say: "Congruent chords have congruent arcs." }],
        why: "Central, add, chords. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "In circle $O$, $m\\angle POQ = 135°$. Find the measure of the **major** arc from $P$ to $Q$.", post: "°", answer: 225, skill: "Arcs and chords",
        near: [{ v: 135, fb: "That is the minor arc. The major arc is the rest of the circle." }, { v: 45, fb: "Subtract from 360, not from 180." }],
        hints: ["$360 - 135$."], why: "$360 - 135 = 225$." },
      { type: "num", prompt: "A radius of a circle is perpendicular to chord $\\overline{AB}$ and meets it at $M$. $AM = 9$. Find $AB$.", answer: 18, skill: "Arcs and chords",
        near: [{ v: 9, fb: "$M$ is the midpoint of the chord, so $AB$ is twice $AM$." }], hints: ["A radius perpendicular to a chord bisects it."], why: "$2 \\cdot 9 = 18$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A radius of 13, and a chord 5 from the centre. How long is the chord?",
        scene: { type: "walk", how: [["Bisect", "The perpendicular from the centre bisects the chord."], ["Triangle", "Draw a radius to one end of the chord: a right triangle."], ["Solve", "Use the Pythagorean Theorem, then double."]], rows: [
          { step: 1, m: "AM = MB", say: "$\\overline{OM}$ is perpendicular to the chord, so $M$ is its midpoint.", fig: FIG_CHD },
          { step: 2, m: "AM^2 + 5^2 = 13^2", say: "$\\triangle OMA$ is a right triangle, with the radius as its hypotenuse." },
          { step: 3, m: "AM^2 = 169 - 25 = 144", say: "Subtract 25.",
            ask: { prompt: "What is $\\sqrt{144}$?", answer: 0,
                   options: [{ t: "12" }, { t: "72", fb: "That is half of 144." }] } },
          { step: 3, m: "AM = 12", say: "Half of the chord." },
          { step: 3, m: "AB = 2 \\cdot 12 = 24", say: "The whole chord." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A circle has a radius of 10. A chord of the circle is 16 long. How far is the chord from the centre?", answer: 6, skill: "Arcs and chords",
        near: [{ v: 12.49, tol: 0.05, fb: "Use half the chord, 8, as the leg." }], hints: ["Half the chord is 8.", "$d^2 + 8^2 = 10^2$."], why: "$\\sqrt{100 - 64} = 6$." },
      { type: "choice", kicker: "Find the error",
        prompt: "$m\\overarc{AB} = 100°$. Mia says the major arc from $A$ to $B$ measures $180° - 100° = 80°$. What is wrong?",
        options: [{ t: "A whole circle is 360°, so the major arc is $360° - 100° = 260°$." },
                  { t: "The major arc is also 100°.", fb: "The two arcs together make the whole circle." },
                  { t: "Nothing. The arcs add to 180°.", fb: "180° is a semicircle. The two arcs make a whole circle." }],
        answer: 0, skill: "Arcs and chords", hints: ["How many degrees in a whole circle?"], why: "$360 - 100 = 260$." },
      { type: "num", kicker: "Use it", prompt: "In a circle graph, one sector stands for 25% of a budget. What is the measure of its central angle?", post: "°", answer: 90, skill: "Arcs and chords",
        near: [{ v: 25, fb: "25 is the percent. Take 25% of 360°." }], hints: ["$0.25 \\cdot 360$."], why: "$0.25 \\cdot 360 = 90$." }
    ]
  });

  /* ========================================================= 11-3 · Sector area and arc length */
  var HOW_11_3 = [["Fraction", "Find the fraction of the circle: $\\frac{m°}{360°}$."],
                  ["Whole", "Find the whole circle's area, $\\pi r^2$, or its circumference, $2\\pi r$."],
                  ["Multiply", "Multiply the whole by the fraction."]];
  function secFig(deg, r, alt, tri) {
    return circle([sector(0, deg)].concat(tri ? [{ seg: [on(0), on(deg)], c: "green" }] : [], [{ angle: [on(0), O, on(deg)], say: deg + "°", c: "orange" }], lab(r, O, on(0), -1, 11)), null, alt, { centre: false });
  }
  var FIG_S60 = secFig(60, "6", "A circle of radius 6 with a shaded sector of 60 degrees."),
      FIG_S120 = secFig(120, "9", "A circle of radius 9 with a shaded sector of 120 degrees."),
      FIG_S90 = secFig(90, "4", "A circle of radius 4 with a shaded sector of 90 degrees."),
      FIG_SEG = secFig(90, "6", "A circle of radius 6 with a shaded sector of 90 degrees. A chord joins the ends of its arc.", true);
  LESSONS.push({
    title: "Sector area and arc length",
    blurb: "Book 11-3 · A sector is a fraction of a circle's area, and an arc is the same fraction of its circumference.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Simplify $\\frac{90}{360}$.",
        options: [{ t: "$\\frac{1}{4}$" }, { t: "$\\frac{1}{3}$", fb: "$\\frac{1}{3}$ of 360 is 120." }, { t: "$4$", fb: "90 is on top: the fraction is less than 1." }],
        answer: 0, skill: "Simplify fractions", hints: ["$360 \\div 90 = 4$."], why: "$90 \\cdot 4 = 360$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **sector** is a slice of a circle, between two radii and their arc. A central angle of $m°$ takes $\\frac{m}{360}$ of the circle. So the sector's area is that fraction of $\\pi r^2$, and the **arc length** is the same fraction of $2\\pi r$.",
        scene: { type: "method", how: HOW_11_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the area of this sector found.",
        scene: { type: "walk", how: HOW_11_3, rows: [
          { step: 1, m: "\\frac{60}{360} = \\frac{1}{6}", say: "The sector is one sixth of the circle.", fig: FIG_S60 },
          { step: 2, m: "\\pi(6)^2 = 36\\pi", say: "The area of the whole circle." },
          { step: 3, m: "A = \\frac{1}{6}(36\\pi)", say: "The fraction of the whole.",
            ask: { prompt: "What is $\\frac{1}{6}$ of 36?", answer: 0,
                   options: [{ t: "6" }, { t: "216", fb: "That is 6 times 36. Divide by 6." }] } },
          { step: 3, m: "A = 6\\pi", say: "About 18.8 square units." }] },
        gate: true, then: "Fraction, whole, multiply." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the **length** of this sector's arc. Type each answer as asked.", art: FIG_S120,
        how: HOW_11_3, skill: "Arc length",
        steps: [
          { step: 1, ask: "What fraction of the circle is 120°?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{1}{3}$" }, { t: "$\\frac{1}{4}$", fb: "$\\frac{1}{4}$ of 360 is 90." }],
            m: "\\frac{120}{360} = \\frac{1}{3}", say: "One third of the circle." },
          { step: 2, ask: "$C = 2\\pi r$. The circumference is what number times $\\pi$?", type: "num", answer: 18, near: [{ v: 81, fb: "That is $r^2$, for the area. An arc is part of the circumference." }], hint: "$2 \\cdot 9$.",
            m: "2\\pi(9) = 18\\pi", say: "The whole circumference." },
          { step: 3, ask: "The arc length is what number times $\\pi$?", type: "num", answer: 6, hint: "One third of 18.",
            m: "L = \\frac{1}{3}(18\\pi) = 6\\pi", say: "About 18.8 units." }],
        why: "Fraction, whole, multiply. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the area of this sector. Type the number in front of $\\pi$.", art: FIG_S90, post: PI_POST, answer: 4, skill: "Sector area",
        near: [{ v: 16, fb: "That is the whole circle. The sector is one quarter of it." }, { v: 2, fb: "That is the arc length. The area uses $\\pi r^2$." }],
        hints: ["$\\frac{90}{360} = \\frac{1}{4}$.", "$\\frac{1}{4}(16\\pi)$."], why: "$\\frac{1}{4}(16\\pi) = 4\\pi$." },
      { type: "num", prompt: "A circle has a radius of 10. Find the length of an arc of 36°. Type the number in front of $\\pi$.", post: PI_POST, answer: 2, skill: "Arc length",
        near: [{ v: 10, fb: "That is the sector's area. An arc is part of the circumference, $20\\pi$." }], hints: ["$\\frac{36}{360} = \\frac{1}{10}$.", "$\\frac{1}{10}(20\\pi)$."], why: "$\\frac{1}{10}(20\\pi) = 2\\pi$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **segment** of a circle is the region between a chord and its arc. Find the area of the segment cut off by this chord. Use $\\pi \\approx 3.14$.",
        scene: { type: "walk", how: [["Sector", "Find the area of the sector."], ["Triangle", "Find the area of the triangle made by the two radii and the chord."], ["Subtract", "Segment = sector − triangle."]], rows: [
          { step: 1, m: "\\frac{90}{360}(36\\pi) = 9\\pi \\approx 28.26", say: "A quarter of the circle.", fig: FIG_SEG },
          { step: 2, m: "\\frac{1}{2}(6)(6) = 18", say: "The radii meet at a right angle, so they are the base and the height.",
            ask: { prompt: "What is $28.26 - 18$?", answer: 0,
                   options: [{ t: "10.26" }, { t: "46.26", fb: "Subtract the triangle. Do not add it." }] } },
          { step: 3, m: "28.26 - 18 = 10.26", say: "About 10.3 square units." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A circle has a radius of 12. Find the area of a sector of 30°. Type the number in front of $\\pi$.", post: PI_POST, answer: 12, skill: "Sector area",
        near: [{ v: 2, fb: "That is the arc length. The area uses $\\pi r^2 = 144\\pi$." }], hints: ["$\\frac{30}{360} = \\frac{1}{12}$.", "$\\frac{1}{12}(144\\pi)$."], why: "$\\frac{1}{12}(144\\pi) = 12\\pi$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To find the **arc length** for a radius of 6 and an angle of 60°, Ty works out $\\frac{60}{360} \\cdot \\pi(6)^2 = 6\\pi$. What is wrong?",
        options: [{ t: "That is the sector's area. Arc length uses the circumference: $\\frac{1}{6}(12\\pi) = 2\\pi$." },
                  { t: "The fraction should be $\\frac{360}{60}$.", fb: "The part goes over the whole: $\\frac{60}{360}$." },
                  { t: "Nothing. $6\\pi$ is the arc length.", fb: "$\\pi r^2$ is an area. A length comes from $2\\pi r$." }],
        answer: 0, skill: "Arc length", hints: ["Is an arc part of the area, or part of the circumference?"], why: "$\\frac{60}{360}(2\\pi \\cdot 6) = 2\\pi$." },
      { type: "num", kicker: "Use it", prompt: "A lawn sprinkler waters a sector with a radius of 10 m as it turns through 90°. What area does it water, to the nearest square metre? Use $\\pi \\approx 3.14$.", post: "m²", answer: 79, tol: 1, skill: "Sector area",
        near: [{ v: 314, tol: 1, fb: "That is the whole circle. The sprinkler covers one quarter of it." }], hints: ["$\\frac{1}{4}\\pi(10)^2 = 25\\pi$."], why: "$25(3.14) = 78.5$, about 79." }
    ]
  });
  /* ================================================================== 11-4 · Inscribed angles */
  var HOW_11_4 = [["Vertex", "An inscribed angle has its vertex on the circle. Find the arc it intercepts: the arc between its sides."],
                  ["Half", "An inscribed angle measures half its intercepted arc."],
                  ["Use", "Inscribed angles on the same arc are congruent. An angle in a semicircle is 90°. Opposite angles of an inscribed quadrilateral are supplementary."]];
  var FIG_INS = circle([chord(90, 215), chord(90, 325), chord(140, 215, "green"), chord(140, 325, "green"), { angle: [on(215), on(90), on(325)], say: "", c: "orange", r: 26 }], { A: 215, B: 90, C: 325, D: 140 },
        "Circle O. Angle ABC has its vertex B on the circle, and its sides meet the circle again at A and C. Angle ADC, with vertex D on the circle, has the same two points. Arc AC, the lower arc, is 110 degrees.", { arcs: { "110°": 270 }, cat: "n" }),
      FIG_INS2 = circle([chord(100, 200), chord(100, 340), chord(50, 200, "green"), chord(50, 340, "green"), { angle: [on(200), on(100), on(340)], say: "35°", c: "orange", r: 30 }], { P: 200, Q: 100, R: 340, S: 50 },
        "Circle O. Angle PQR has its vertex Q on the circle and measures 35 degrees. Angle PSR, with vertex S on the circle, meets the circle at the same two points P and R.", { cat: "s" }),
      FIG_SEMI = circle([chord(180, 0), chord(180, 62), chord(62, 0), { angle: [on(180), on(62), on(0)], right: true, c: "orange" }, { angle: [on(62), on(180), on(0)], say: "38°", c: "orange", r: 34 }], { A: 180, B: 0, C: 62 },
        "Circle O with diameter AB. C is on the circle, and triangle ABC is drawn. The angle at A is 38 degrees, and the angle at C is marked as a right angle.", { cat: "s" }),
      FIG_QUAD = circle([{ poly: [on(100), on(190), on(280), on(20)], c: "blue" }, { angle: [on(190), on(100), on(20)], say: "85°", c: "orange", r: 26 }], { A: 100, B: 190, C: 280, D: 20 },
        "Quadrilateral ABCD with all four vertices on circle O. The angle at A is 85 degrees.", { centre: false });
  LESSONS.push({
    title: "Inscribed angles",
    blurb: "Book 11-4 · An angle with its vertex on the circle is half the arc it intercepts.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find half of 110.", answer: 55, skill: "Arithmetic",
        near: [{ v: 220, fb: "Half, not double." }], hints: ["$110 \\div 2$."], why: "$110 \\div 2 = 55$." },
      { type: "learn", kicker: "The idea",
        prompt: "An **inscribed angle** has its vertex on the circle, and sides that are chords. The arc between its sides is its **intercepted arc**. **Inscribed Angle Theorem:** an inscribed angle measures half its intercepted arc.",
        scene: { type: "method", how: HOW_11_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch two inscribed angles found. $m\\overarc{AC} = 110°$.",
        scene: { type: "walk", how: HOW_11_4, rows: [
          { step: 1, m: "\\angle ABC \\text{ intercepts } \\overarc{AC}", say: "Its vertex $B$ is on the circle, and its sides reach $A$ and $C$.", fig: FIG_INS },
          { step: 2, m: "m\\angle ABC = \\frac{1}{2}(110°)", say: "Half the intercepted arc.",
            ask: { prompt: "What is half of 110°?", answer: 0,
                   options: [{ t: "$55°$" }, { t: "$220°$", fb: "Half, not double." }] } },
          { step: 2, m: "m\\angle ABC = 55°", say: "The Inscribed Angle Theorem." },
          { step: 3, m: "m\\angle ADC = 55°", say: "$\\angle ADC$ intercepts the same arc, so it is congruent to $\\angle ABC$." }] },
        gate: true, then: "Same arc, same inscribed angle." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find $m\\overarc{PR}$ and $m\\angle PSR$.", art: FIG_INS2,
        how: HOW_11_4, skill: "Inscribed angles",
        steps: [
          { step: 1, ask: "Where is the vertex of $\\angle PQR$?", type: "choice", answer: 0,
            options: [{ t: "On the circle: it is an inscribed angle" }, { t: "At the centre: it is a central angle", fb: "$Q$ is on the circle. The centre is $O$." }],
            m: "\\angle PQR \\text{ intercepts } \\overarc{PR}", say: "An inscribed angle." },
          { step: 2, ask: "The angle is half its arc. What is $m\\overarc{PR}$, in degrees?", type: "num", answer: 70, near: [{ v: 17.5, fb: "The arc is twice the angle, not half of it." }], hint: "$2 \\cdot 35$.",
            m: "m\\overarc{PR} = 2(35°) = 70°", say: "The arc is twice the inscribed angle." },
          { step: 3, ask: "$\\angle PSR$ intercepts the same arc. What is $m\\angle PSR$, in degrees?", type: "num", answer: 35, hint: "Inscribed angles on the same arc are congruent.",
            m: "m\\angle PSR = 35°", say: "Same arc, same angle." }],
        why: "Vertex, half, use. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$\\overline{AB}$ is a diameter, so $\\angle C$ is inscribed in a semicircle. Find $m\\angle B$.", art: FIG_SEMI, post: "°", answer: 52, skill: "Inscribed angles",
        near: [{ v: 142, fb: "$\\angle C$ is 90°, so the other two angles share the remaining 90°." }], hints: ["An angle inscribed in a semicircle is a right angle.", "$90 - 38$."], why: "$m\\angle C = 90°$, so $m\\angle B = 90 - 38 = 52°$." },
      { type: "num", prompt: "$ABCD$ is inscribed in the circle. Find $m\\angle C$.", art: FIG_QUAD, post: "°", answer: 95, skill: "Inscribed angles",
        near: [{ v: 85, fb: "Opposite angles of an inscribed quadrilateral are supplementary, not congruent." }], hints: ["$\\angle A$ and $\\angle C$ are opposite angles: they add to 180°."], why: "$180 - 85 = 95$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Quadrilateral $ABCD$ is inscribed in a circle, with $m\\angle A = (2x + 10)°$ and $m\\angle C = (3x + 20)°$. Find both angles.",
        scene: { type: "walk", how: [["Opposite", "Opposite angles of an inscribed quadrilateral are supplementary."], ["Equation", "Add the two expressions to 180."], ["Solve", "Solve for $x$, then find each angle."]], rows: [
          { step: 1, m: "m\\angle A + m\\angle C = 180°", say: "$A$ and $C$ are opposite vertices." },
          { step: 2, m: "(2x + 10) + (3x + 20) = 180", say: "Put in the expressions." },
          { step: 3, m: "5x + 30 = 180", say: "Collect like terms.",
            ask: { prompt: "What is $x$ when $5x = 150$?", answer: 0,
                   options: [{ t: "30" }, { t: "145", fb: "Divide by 5, do not subtract it." }] } },
          { step: 3, m: "x = 30", say: "$5x = 150$." },
          { step: 3, m: "m\\angle A = 70° \\qquad m\\angle C = 110°", say: "$2(30) + 10$ and $3(30) + 20$. They add to 180°." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "An inscribed angle measures $(3x)°$ and intercepts an arc of 96°. Find $x$.", pre: "$x =$", answer: 16, skill: "Inscribed angles",
        near: [{ v: 32, fb: "The angle is **half** the arc: $3x = 48$." }, { v: 64, fb: "The angle is half the arc, not double: $3x = 48$." }], hints: ["$3x = \\frac{1}{2}(96)$."], why: "$3x = 48$, so $x = 16$." },
      { type: "choice", kicker: "Find the error",
        prompt: "An inscribed angle intercepts an arc of 80°. Jay says the angle measures 160°. What is wrong?",
        options: [{ t: "An inscribed angle is half its arc: 40°." },
                  { t: "It equals its arc: 80°.", fb: "That is a central angle. An inscribed angle is half its arc." },
                  { t: "Nothing. The angle is twice the arc.", fb: "It is the arc that is twice the angle." }],
        answer: 0, skill: "Inscribed angles", hints: ["Half, or double?"], why: "$\\frac{1}{2}(80°) = 40°$." },
      { type: "choice", kicker: "Use it", prompt: "A carpenter lays the corner of a set square on the rim of a round table top, and marks where its two edges cross the rim. What is the segment between the two marks?",
        options: [{ t: "A diameter of the table" }, { t: "A radius of the table", fb: "A radius ends at the centre. Both marks are on the rim." }, { t: "A tangent to the table", fb: "A tangent touches the rim once. This segment joins two points of the rim." }],
        answer: 0, skill: "Inscribed angles", hints: ["A right angle with its vertex on the circle intercepts an arc of 180°."], why: "A right inscribed angle intercepts a semicircle, so its chord is a diameter." }
    ]
  });

  /* ======================================================= 11-5 · Angle relationships in circles */
  var HOW_11_5 = [["Where", "Find the angle's vertex: on the circle, inside it, or outside it."],
                  ["Rule", "On: half the arc. Inside: half the **sum** of the two arcs. Outside: half the **difference** of the two arcs."],
                  ["Solve", "Put in the arcs and work it out."]];
  function insideFig(a1, a2, lab1, lab2, alt) {
    // Chords AC and BD, with arc AB of a1 degrees at the top and arc CD of a2 degrees at the bottom.
    var A = 90 + a1 / 2, B = 90 - a1 / 2, C = 270 + a2 / 2, D = 270 - a2 / 2, arcs = {};
    arcs[lab1] = 90; arcs[lab2] = 270;
    return circle([chord(A, C), chord(B, D, "green"), { pt: cross(on(A), on(C), on(B), on(D)), name: "E", at: "e" }], { A: A, B: B, C: C, D: D }, alt, { arcs: arcs, centre: false, y: [-3.4, 3.4] });
  }
  function outsideFig(near, far, lab1, lab2, alt, ang) {
    var S = secants(near, far), arcs = {};
    arcs[lab2] = 180;                                            // the near arc's measure is written just inside the circle, clear of P
    return circle([{ seg: [S.P, S.F[0]] }, { seg: [S.P, S.F[1]], c: "green" }, { word: lab1, at: on(0, RC - 0.55), c: "orange" }, { pt: S.P, name: "P", at: "e" }, { pt: S.N[0] }, { pt: S.N[1] }, { pt: S.F[0] }, { pt: S.F[1] }]
      .concat(ang ? [{ angle: [S.F[1], S.P, S.F[0]], say: ang, c: "orange", r: 40 }] : []), null, alt, { arcs: arcs, centre: false, x: [-3.6, S.P[0] + 1] });
  }
  var FIG_IN1 = insideFig(100, 40, "100°", "40°", "Chords AC and BD of a circle cross at E inside it. Arc AB, at the top, is 100 degrees. Arc CD, at the bottom, is 40 degrees."),
      FIG_OUT1 = outsideFig(30, 110, "30°", "110°", "Two secants from a point P outside a circle. They cut off a near arc of 30 degrees and a far arc of 110 degrees."),
      FIG_IN2 = insideFig(85, 55, "85°", "55°", "Chords AC and BD of a circle cross at E inside it. Arc AB is 85 degrees and arc CD is 55 degrees."),
      FIG_OUT2 = outsideFig(50, 120, "x°", "120°", "Two secants from a point P outside a circle. The angle at P is 35 degrees. The far arc is 120 degrees and the near arc is x degrees.", "35°");
  LESSONS.push({
    title: "Angle relationships in circles",
    blurb: "Book 11-5 · Where the vertex is decides the rule: on, inside or outside the circle.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $\\frac{1}{2}(100 + 40)$.", answer: 70, skill: "Arithmetic",
        near: [{ v: 120, fb: "Add inside the brackets first, then halve." }], hints: ["$100 + 40 = 140$."], why: "$\\frac{1}{2}(140) = 70$." },
      { type: "learn", kicker: "The idea",
        prompt: "Lines that cross a circle make angles, and the rule depends on where the vertex is. **On** the circle, as with an inscribed angle or a tangent and a chord: half the arc. **Inside**: half the sum of the two arcs. **Outside**: half the difference.",
        scene: { type: "method", how: HOW_11_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $m\\angle AEB$ found.",
        scene: { type: "walk", how: HOW_11_5, rows: [
          { step: 1, m: "E \\text{ is inside the circle}", say: "Two chords cross there.", fig: FIG_IN1 },
          { step: 2, m: "m\\angle AEB = \\frac{1}{2}(m\\overarc{AB} + m\\overarc{CD})", say: "Half the sum of the arc in front of the angle and the arc behind it." },
          { step: 3, m: "m\\angle AEB = \\frac{1}{2}(100° + 40°)", say: "Put in the two arcs.",
            ask: { prompt: "What is half of 140°?", answer: 0,
                   options: [{ t: "$70°$" }, { t: "$280°$", fb: "Half, not double." }] } },
          { step: 3, m: "m\\angle AEB = 70°", say: "Between the two arcs in size, as an average should be." }] },
        gate: true, then: "Inside the circle: half the sum." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find $m\\angle P$.", art: FIG_OUT1,
        how: HOW_11_5, skill: "Angles in circles",
        steps: [
          { step: 1, ask: "Where is the vertex $P$?", type: "choice", answer: 0,
            options: [{ t: "Outside the circle" }, { t: "Inside the circle", fb: "$P$ is beyond the circle, where the two secants meet." }],
            m: "P \\text{ is outside the circle}", say: "Two secants meet there." },
          { step: 2, ask: "Which rule applies?", type: "choice", answer: 0,
            options: [{ t: "Half the difference of the two arcs" }, { t: "Half the sum of the two arcs", fb: "The sum is for a vertex inside the circle." }],
            m: "m\\angle P = \\frac{1}{2}(110° - 30°)", say: "Far arc minus near arc, then halve." },
          { step: 3, ask: "What is $110 - 30$?", type: "num", answer: 80, hint: "$110 - 30$.",
            m: "m\\angle P = \\frac{1}{2}(80°)", say: "The difference of the arcs." },
          { step: 3, ask: "So what is $m\\angle P$, in degrees?", type: "num", answer: 40, near: [{ v: 70, fb: "That is half the sum. Outside the circle, use the difference." }], hint: "Half of 80.",
            m: "m\\angle P = 40°", say: "Outside the circle: half the difference." }],
        why: "Where, rule, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A tangent and a chord meet at a point on a circle. The arc between them is 150°. Find the angle they form.", post: "°", answer: 75, skill: "Angles in circles",
        near: [{ v: 150, fb: "The vertex is on the circle: take half the arc." }, { v: 300, fb: "Half, not double." }], hints: ["Vertex on the circle: half the intercepted arc."], why: "$\\frac{1}{2}(150°) = 75°$." },
      { type: "num", prompt: "Find $m\\angle AEB$.", art: FIG_IN2, post: "°", answer: 70, skill: "Angles in circles",
        near: [{ v: 15, fb: "That is half the difference. Inside the circle, use the sum." }, { v: 140, fb: "That is the sum. Halve it." }], hints: ["$\\frac{1}{2}(85 + 55)$."], why: "$\\frac{1}{2}(140°) = 70°$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The rule can run backwards to find an **arc**. Find $x$.",
        scene: { type: "walk", how: [["Rule", "Write the rule for where the vertex is."], ["Double", "Multiply both sides by 2."], ["Solve", "Solve for the arc."]], rows: [
          { step: 1, m: "35 = \\frac{1}{2}(120 - x)", say: "$P$ is outside: half the difference of the arcs.", fig: FIG_OUT2 },
          { step: 2, m: "70 = 120 - x", say: "Multiply both sides by 2.",
            ask: { prompt: "What is $120 - 70$?", answer: 0,
                   options: [{ t: "50" }, { t: "190", fb: "Subtract, do not add." }] } },
          { step: 3, m: "x = 50", say: "The near arc is 50°. Check: $\\frac{1}{2}(120 - 50) = 35$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Two chords cross inside a circle and form an angle of 60°. The arc in front of the angle is 80°. Find the arc behind it.", post: "°", answer: 40, skill: "Angles in circles",
        near: [{ v: 20, fb: "Double the angle first: $120 = 80 + x$." }, { v: 200, fb: "Inside the circle the arcs are added, then halved: $60 = \\frac{1}{2}(80 + x)$." }], hints: ["$60 = \\frac{1}{2}(80 + x)$.", "$120 = 80 + x$."], why: "$x = 120 - 80 = 40$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Two secants meet **outside** a circle and cut off arcs of 130° and 50°. Lee works out $\\frac{1}{2}(130° + 50°) = 90°$. What is wrong?",
        options: [{ t: "Outside the circle you use the difference: $\\frac{1}{2}(130° - 50°) = 40°$." },
                  { t: "He should not halve: $180°$.", fb: "Every one of these rules halves." },
                  { t: "Nothing. Half the sum of the arcs.", fb: "The sum is for a vertex inside the circle." }],
        answer: 0, skill: "Angles in circles", hints: ["Where is the vertex?"], why: "Outside: half the difference." },
      { type: "num", kicker: "Use it", prompt: "From a spacecraft, the two tangent lines to a planet cut its equator into a near arc of 150° and a far arc of 210°. What angle do the two tangent lines form at the spacecraft?", post: "°", answer: 30, skill: "Angles in circles",
        near: [{ v: 180, fb: "The spacecraft is outside the circle: use the difference of the arcs." }, { v: 60, fb: "That is the difference. Halve it." }], hints: ["$\\frac{1}{2}(210 - 150)$."], why: "$\\frac{1}{2}(60°) = 30°$." }
    ]
  });

  /* ===================================================== 11-6 · Segment relationships in circles */
  var HOW_11_6 = [["Where", "Do the segments meet inside the circle, as two chords do, or outside it, as secants and tangents do?"],
                  ["Product", "Inside: the products of the two parts of each chord are equal. Outside: whole secant times its outside part is the same for both. For a tangent, use its length squared."],
                  ["Solve", "Write the equation and solve it."]];
  function chordsFig(L4, alt) {
    var A = on(150), B = on(-20), C = on(240), D = on(70), E = cross(A, B, C, D);
    return circle([{ seg: [A, B] }, { seg: [C, D], c: "green" }].concat(lab(L4[0], A, E, 1, 11), lab(L4[1], E, B, 1, 11), lab(L4[2], C, E, 1, 11), lab(L4[3], E, D, 1, 11), [{ pt: E, name: "E", at: "s" }]), { A: 150, B: -20, C: 240, D: 70 }, alt, { centre: false });
  }
  function secFig2(L4, alt) {
    var S = secants(50, 130);
    return circle([{ seg: [S.P, S.F[0]] }, { seg: [S.P, S.F[1]], c: "green" }].concat(lab(L4[0], S.N[0], S.P, 1, 11), lab(L4[1], S.F[0], S.N[0], 1, 11), lab(L4[2], S.P, S.N[1], 1, 11), lab(L4[3], S.N[1], S.F[1], 1, 11),
      [{ pt: S.P, name: "P", at: "e" }, { pt: S.N[0], name: "A", at: "ne" }, { pt: S.F[0], name: "B", at: "nw" }, { pt: S.N[1], name: "C", at: "se" }, { pt: S.F[1], name: "D", at: "sw" }]), null, alt, { centre: false, x: [-3.6, S.P[0] + 1] });
  }
  var FIG_CH1 = chordsFig(["4", "6", "3", "x"], "Chords AB and CD of a circle cross at E. AE is 4, EB is 6, CE is 3 and ED is x."),
      FIG_SC1 = secFig2(["4", "5", "3", "x"], "Two secants from a point P outside a circle. One passes through A then B: PA is 4 and AB is 5. The other passes through C then D: PC is 3 and CD is x."),
      FIG_CH2 = chordsFig(["2", "12", "3", "x"], "Chords AB and CD of a circle cross at E. AE is 2, EB is 12, CE is 3 and ED is x.");
  LESSONS.push({
    title: "Segment relationships in circles",
    blurb: "Book 11-6 · Products of the parts of chords, secants and tangents.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $6x = 24$.", pre: "$x =$", answer: 4, skill: "Solve an equation",
        near: [{ v: 18, fb: "Divide by 6, do not subtract it." }], hints: ["Divide both sides by 6."], why: "$24 \\div 6 = 4$." },
      { type: "learn", kicker: "The idea",
        prompt: "When two chords cross, the **products** of their parts are equal. From a point outside, each secant has an **outside part** and a **whole** length: whole times outside part is the same for both. A tangent counts as both at once: its length squared.",
        scene: { type: "method", how: HOW_11_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $x$ found.",
        scene: { type: "walk", how: HOW_11_6, rows: [
          { step: 1, m: "\\text{two chords cross at } E", say: "Inside the circle.", fig: FIG_CH1 },
          { step: 2, m: "AE \\cdot EB = CE \\cdot ED", say: "The Chord-Chord Product Theorem." },
          { step: 3, m: "4 \\cdot 6 = 3x", say: "Put in the parts.",
            ask: { prompt: "What is $x$ when $3x = 24$?", answer: 0,
                   options: [{ t: "8" }, { t: "21", fb: "Divide by 3, do not subtract it." }] } },
          { step: 3, m: "x = 8", say: "$24 = 3x$." }] },
        gate: true, then: "Part times part equals part times part." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find $x$.", art: FIG_SC1,
        how: HOW_11_6, skill: "Segment products",
        steps: [
          { step: 1, ask: "Where do the two secants meet?", type: "choice", answer: 0,
            options: [{ t: "Outside the circle, at $P$" }, { t: "Inside the circle", fb: "$P$ is beyond the circle." }],
            m: "\\text{two secants from } P", say: "Outside the circle." },
          { step: 2, ask: "The whole secant $\\overline{PB}$ is $4 + 5 = 9$. Which equation is right?", type: "choice", answer: 0,
            options: [{ t: "$9 \\cdot 4 = (3 + x) \\cdot 3$" }, { t: "$4 \\cdot 5 = 3x$", fb: "That is the rule for chords. For secants use whole times outside part." }],
            m: "9 \\cdot 4 = (3 + x) \\cdot 3", say: "Whole times outside part, for each secant." },
          { step: 3, ask: "$36 = 9 + 3x$. What is $x$?", type: "num", answer: 9, near: [{ v: 15, fb: "Subtract 9 from 36 before dividing by 3." }], hint: "$27 = 3x$.",
            m: "x = 9", say: "$27 = 3x$. The whole of $\\overline{PD}$ is 12, and $12 \\cdot 3 = 36$." }],
        why: "Where, product, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find $x$.", art: FIG_CH2, pre: "$x =$", answer: 8, skill: "Segment products",
        near: [{ v: 11, fb: "Multiply the parts of each chord: $2 \\cdot 12 = 3x$." }], hints: ["$2 \\cdot 12 = 3x$."], why: "$24 = 3x$, so $x = 8$." },
      { type: "num", prompt: "From a point outside a circle, a tangent and a secant are drawn. The secant's outside part is 4, and its whole length is 9. How long is the tangent segment?", answer: 6, skill: "Segment products",
        near: [{ v: 36, fb: "That is the tangent squared. Take the square root." }, { v: 13, fb: "Multiply whole by outside part: $9 \\cdot 4$. Do not add." }], hints: ["$t^2 = 9 \\cdot 4$."], why: "$t^2 = 36$, so $t = 6$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A tangent segment of 8 and a secant are drawn from the same point. The secant's outside part is 4, and the part inside the circle is $x$. Find $x$.",
        scene: { type: "walk", how: [["Whole", "Write the whole secant: outside part plus inside part."], ["Product", "Tangent squared equals whole times outside part."], ["Solve", "Solve the equation."]], rows: [
          { step: 1, m: "4 + x", say: "The whole secant." },
          { step: 2, m: "8^2 = (4 + x) \\cdot 4", say: "The Secant-Tangent Product Theorem." },
          { step: 3, m: "64 = 16 + 4x", say: "Distribute the 4.",
            ask: { prompt: "What is $64 - 16$?", answer: 0,
                   options: [{ t: "48" }, { t: "80", fb: "Subtract 16, do not add it." }] } },
          { step: 3, m: "48 = 4x", say: "Subtract 16." },
          { step: 3, m: "x = 12", say: "The whole secant is 16, and $16 \\cdot 4 = 64$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Two secants are drawn from a point outside a circle. One has an outside part of 2 and a whole length of 12. The other has an outside part of 3. Find the **whole** length of the second secant.", answer: 8, skill: "Segment products",
        near: [{ v: 5, fb: "That would be the part inside the circle. The question asks for the whole length." }], hints: ["$12 \\cdot 2 = w \\cdot 3$."], why: "$24 = 3w$, so $w = 8$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Two secants from $P$: one has outside part 3 and inside part 5. The other has outside part 4 and inside part $x$. Tap the line where the work **first** goes wrong.",
        lines: ["PA = 3 \\quad AB = 5 \\quad PC = 4 \\quad CD = x", "3 \\cdot 5 = 4x", "x = \\frac{15}{4}"], answer: 1, fix: "8 \\cdot 3 = (4 + x) \\cdot 4",
        fb: { 0: GIVEN, 2: LATER }, skill: "Segment products",
        hints: ["For secants: whole times outside part."],
        why: "Whole times outside part: $8 \\cdot 3 = (4 + x) \\cdot 4$, so $24 = 16 + 4x$ and $x = 2$." },
      { type: "num", kicker: "Use it", prompt: "A piece of a broken wheel shows a chord 12 cm long. The perpendicular from the middle of the chord out to the rim is 3 cm. That perpendicular lies along a diameter. Find the diameter of the wheel.", post: "cm", answer: 15, skill: "Segment products",
        near: [{ v: 12, fb: "That is the rest of the diameter. Add the 3 cm." }], hints: ["The two chords are the 12 cm chord, cut into 6 and 6, and the diameter, cut into 3 and $x$.", "$6 \\cdot 6 = 3x$."], why: "$x = 12$, so the diameter is $3 + 12 = 15$ cm." }
    ]
  });

  /* ====================================================== 11-7 · Circles in the coordinate plane */
  var HOW_11_7 = [["Centre", "Find the centre $(h, k)$."],
                  ["Radius", "Find the radius $r$: the distance from the centre to any point of the circle."],
                  ["Equation", "Write $(x - h)^2 + (y - k)^2 = r^2$."]];
  var FIG_EQ1 = grid([-3, 7], [-6, 4], [{ circle: [[2, -1], 3], c: "blue" }, { seg: [[2, -1], [5, -1]], c: "orange" }, { pt: [2, -1], name: "(2, −1)", at: "nw" }], { u: 26, alt: "A coordinate grid with a circle. Its centre is (2, −1) and its radius is 3." }),
      FIG_EQ2 = grid([-6, 6], [-6, 6], [{ circle: [[0, 0], 5], c: "blue" }, { seg: [[0, 0], [3, 4]], c: "orange" }, { pt: [3, 4], name: "(3, 4)", at: "ne" }], { u: 22, alt: "A coordinate grid with a circle centred at the origin that passes through (3, 4)." }),
      FIG_EQ3 = grid([-2, 10], [0, 12], [{ circle: [[4, 6], 5], c: "blue" }, { seg: [[1, 2], [7, 10]], c: "orange" }, { pt: [1, 2], name: "(1, 2)", at: "sw" }, { pt: [7, 10], name: "(7, 10)", at: "ne" }], { u: 20, alt: "A coordinate grid with a circle. The segment from (1, 2) to (7, 10) is a diameter." });
  LESSONS.push({
    title: "Circles in the coordinate plane",
    blurb: "Book 11-7 · The equation of a circle comes from the Distance Formula.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the distance from $(0, 0)$ to $(6, 8)$.", answer: 10, skill: "Distance Formula",
        near: [{ v: 14, fb: "Square each, add, then take the root." }], hints: ["$\\sqrt{6^2 + 8^2}$."], why: "$\\sqrt{100} = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "Every point $(x, y)$ of a circle is the same distance $r$ from the centre $(h, k)$. Write that with the Distance Formula and square both sides: $(x - h)^2 + (y - k)^2 = r^2$. That is the **equation of a circle**.",
        scene: { type: "method", how: HOW_11_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the equation of this circle written.",
        scene: { type: "walk", how: HOW_11_7, rows: [
          { step: 1, m: "h = 2 \\qquad k = -1", say: "The centre is $(2, -1)$.", fig: FIG_EQ1 },
          { step: 2, m: "r = 3", say: "From the centre across to the circle.",
            ask: { prompt: "What is $r^2$?", answer: 0,
                   options: [{ t: "9" }, { t: "6", fb: "That is $3 \\cdot 2$. Squaring multiplies 3 by itself." }] } },
          { step: 3, m: "(x - 2)^2 + (y - (-1))^2 = 3^2", say: "Put $h$, $k$ and $r$ into the equation." },
          { step: 3, m: "(x - 2)^2 + (y + 1)^2 = 9", say: "Subtracting $-1$ is adding 1." }] },
        gate: true, then: "The signs inside the brackets are the opposite of the centre's coordinates." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Write the equation of the circle with its centre at the origin that passes through $(3, 4)$.", art: FIG_EQ2,
        how: HOW_11_7, skill: "Equation of a circle",
        steps: [
          { step: 1, ask: "The centre is the origin. What are $h$ and $k$?", type: "choice", answer: 0,
            options: [{ t: "$h = 0$ and $k = 0$" }, { t: "$h = 3$ and $k = 4$", fb: "$(3, 4)$ is a point on the circle, not its centre." }],
            m: "h = 0 \\qquad k = 0", say: "The origin." },
          { step: 2, ask: "The radius is the distance from $(0, 0)$ to $(3, 4)$. What is it?", type: "num", answer: 5, near: [{ v: 7, fb: "Square each, add, then take the root." }], hint: "$\\sqrt{3^2 + 4^2}$.",
            m: "r = \\sqrt{3^2 + 4^2} = 5", say: "The Distance Formula." },
          { step: 3, ask: "Which equation is right?", type: "choice", answer: 0,
            options: [{ t: "$x^2 + y^2 = 25$" }, { t: "$x^2 + y^2 = 5$", fb: "The right side is $r^2$, not $r$." }],
            m: "x^2 + y^2 = 25", say: "$(x - 0)^2 + (y - 0)^2 = 5^2$." }],
        why: "Centre, radius, equation. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Which is the equation of the circle with centre $(-3, 2)$ and radius 4?",
        options: [{ t: "$(x + 3)^2 + (y - 2)^2 = 16$" }, { t: "$(x - 3)^2 + (y + 2)^2 = 16$", fb: "The signs inside the brackets are the opposite of the centre's coordinates." }, { t: "$(x + 3)^2 + (y - 2)^2 = 4$", fb: "The right side is $r^2 = 16$." }],
        answer: 0, skill: "Equation of a circle", hints: ["$x - (-3) = x + 3$."], why: "$(x - (-3))^2 + (y - 2)^2 = 4^2$." },
      { type: "pair", prompt: "Find the centre of the circle $(x - 5)^2 + (y + 2)^2 = 49$. Type it as $(x, y)$.", answer: [5, -2], skill: "Equation of a circle",
        near: [{ v: [-5, 2], fb: "The centre's coordinates have the opposite signs to the numbers in the brackets." }, { v: [5, 2], fb: "$y + 2$ is $y - (-2)$, so $k = -2$." }], hints: ["Compare with $(x - h)^2 + (y - k)^2 = r^2$."], why: "$h = 5$ and $k = -2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The ends of a diameter are $(1, 2)$ and $(7, 10)$. Write the equation of the circle.",
        scene: { type: "walk", how: HOW_11_7, rows: [
          { step: 1, m: "\\left(\\frac{1 + 7}{2}, \\frac{2 + 10}{2}\\right) = (4, 6)", say: "The centre is the midpoint of the diameter.", fig: FIG_EQ3 },
          { step: 2, m: "r = \\sqrt{(7 - 4)^2 + (10 - 6)^2}", say: "From the centre to one end of the diameter." },
          { step: 2, m: "r = \\sqrt{9 + 16} = 5", say: "The radius.",
            ask: { prompt: "What is $\\sqrt{25}$?", answer: 0,
                   options: [{ t: "5" }, { t: "12.5", fb: "That is half of 25." }] } },
          { step: 3, m: "(x - 4)^2 + (y - 6)^2 = 25", say: "Centre $(4, 6)$, radius 5." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the radius of the circle $(x + 1)^2 + (y - 4)^2 = 81$.", answer: 9, skill: "Equation of a circle",
        near: [{ v: 81, fb: "81 is $r^2$. Take the square root." }, { v: 40.5, fb: "Take the square root of 81. Do not halve it." }], hints: ["$r^2 = 81$."], why: "$\\sqrt{81} = 9$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For the circle $(x - 3)^2 + (y + 5)^2 = 16$, Ana says the centre is $(-3, 5)$ and the radius is 16. What is wrong?",
        options: [{ t: "Both. The centre is $(3, -5)$, and the radius is $\\sqrt{16} = 4$." },
                  { t: "Only the radius: it is 4.", fb: "The centre is wrong too: the signs flip, giving $(3, -5)$." },
                  { t: "Only the centre: it is $(3, -5)$.", fb: "The radius is wrong too: 16 is $r^2$." }],
        answer: 0, skill: "Equation of a circle", hints: ["Compare with $(x - h)^2 + (y - k)^2 = r^2$."], why: "$h = 3$, $k = -5$ and $r = 4$." },
      { type: "choice", kicker: "Use it", prompt: "On a map with a grid in kilometres, a phone mast at $(2, 3)$ has a range of 5 km. A phone is at $(5, 7)$. Is it in range?",
        options: [{ t: "Yes: it is exactly 5 km away, on the edge of the range" }, { t: "No: it is 7 km away", fb: "$\\sqrt{3^2 + 4^2} = 5$, not $3 + 4$." }, { t: "Yes: it is 1 km away", fb: "Square the differences 3 and 4, add, then take the root." }],
        answer: 0, skill: "Equation of a circle", hints: ["Find the distance from $(2, 3)$ to $(5, 7)$."], why: "$\\sqrt{3^2 + 4^2} = 5$: the phone is on the circle $(x - 2)^2 + (y - 3)^2 = 25$." }
    ]
  });
  /* ================================================================ Skills */
  var TR11 = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]];
  // (x − h)² + (y − k)² as TeX, with the signs tidied: (x + 3)^2 + (y − 2)^2, or x^2 when h is 0.
  function sqTerm(v, a) { return a === 0 ? v + "^2" : "(" + v + (a > 0 ? " - " + a : " + " + (-a)) + ")^2"; }
  function circEq(h, k, r2) { return sqTerm("x", h) + " + " + sqTerm("y", k) + " = " + r2; }
  var SKILLS = [
    { id: "hg11-tangent", title: "Tangents", lesson: 2,
      gen: function (R) {
        var k = R.int(0, 3), T = R.pick(TR11);
        if (k === 0) return { type: "num", prompt: "$\\overline{PA}$ is tangent to circle $O$ at $A$. The radius is " + T[0] + " and $PA = " + T[1] + "$. Find $OP$.", art: tanFig(String(T[1]), null, String(T[0]), "A circle with centre O. From a point P outside it, a tangent segment of " + T[1] + " meets a radius of " + T[0] + " at a right angle."), answer: T[2],
          near: near(T[2], [{ v: T[0] + T[1], fb: "The radius and the tangent meet at a right angle: use the Pythagorean Theorem." }]), hints: ["$\\triangle OAP$ is a right triangle with legs " + T[0] + " and " + T[1] + "."], why: "$\\sqrt{" + T[0] + "^2 + " + T[1] + "^2} = " + T[2] + "$." };
        if (k === 1) { var x = R.int(3, 9), p = R.int(2, 3), r = p + R.int(1, 2), q = R.int(2, 9), v = p * x + q, t = r * x - v;
          if (t <= 0) { x = 9; r = p + 2; v = p * x + q; t = r * x - v; }
          var L1 = poly([[p, "x"], [q, ""]]), L2 = poly([[r, "x"], [-t, ""]]);
          return { type: "num", prompt: "$\\overline{PA}$ and $\\overline{PB}$ are tangent to a circle from the same point $P$. $PA = " + L1 + "$ and $PB = " + L2 + "$. Find $PA$.", answer: v,
            near: near(v, [{ v: x, fb: "That is $x$. Substitute it to find $PA$." }]), hints: ["Tangent segments from one point are congruent: $" + L1 + " = " + L2 + "$.", "$x = " + x + "$."], why: "$x = " + x + "$, so $PA = " + v + "$." }; }
        if (k === 2) { var yes = R.chance(0.5), c = yes ? T[2] : T[2] + 1;
          return mc(R, { prompt: "$T$ is on circle $O$. $OT = " + T[0] + "$, $PT = " + T[1] + "$ and $OP = " + c + "$. Is $\\overline{PT}$ tangent to the circle at $T$?", right: yes ? "Yes" : "No", keep: true,
            wrong: [{ t: yes ? "No" : "Yes", fb: "Test for a right angle at $T$: compare $" + T[0] + "^2 + " + T[1] + "^2$ with $" + c + "^2$." }],
            hints: ["A tangent is perpendicular to the radius. Test the Pythagorean Theorem."], why: "$" + (T[0] * T[0] + T[1] * T[1]) + (yes ? " = " : " \\ne ") + c * c + "$, so there is " + (yes ? "a" : "no") + " right angle at $T$." }); }
        var Q = R.pick([["a segment with both endpoints on the circle", "Chord"], ["a line that crosses the circle at two points", "Secant"], ["a line that touches the circle at exactly one point", "Tangent"], ["a chord that passes through the centre", "Diameter"]]);
        return mc(R, { prompt: "What is the name for " + Q[0] + "?", right: Q[1], wrong: ["Chord", "Secant", "Tangent", "Diameter"].filter(function (n) { return n !== Q[1]; }).slice(0, 3).map(function (n) { return { t: n, fb: "Count the points it shares with the circle, and whether it is a line or a segment." }; }),
          hints: ["How many points of the circle does it meet?"], why: "That is the definition of a " + Q[1].toLowerCase() + "." });
      } },
    { id: "hg11-arcs", title: "Arcs and chords", lesson: 3,
      gen: function (R) {
        var k = R.int(0, 4), a = R.int(35, 160), T = R.pick(TR11);
        if (k === 0) return { type: "num", prompt: "A central angle of a circle measures " + a + "°. What is the measure of the minor arc it cuts off?", post: "°", answer: a,
          near: near(a, [{ v: a / 2, fb: "Halving is for an inscribed angle. A central angle equals its arc." }]), hints: ["A minor arc has the same measure as its central angle."], why: "The arc measures " + a + "°." };
        if (k === 1) return { type: "num", prompt: "$m\\overarc{AB} = " + a + "°$. Find the measure of the major arc from $A$ to $B$.", post: "°", answer: 360 - a,
          near: near(360 - a, [{ v: Math.abs(180 - a), fb: "A whole circle is 360°, not 180°." }]), hints: ["$360 - " + a + "$."], why: "$360 - " + a + " = " + (360 - a) + "$." };
        if (k === 2) { var b = R.int(30, 90), c = R.int(30, 80);
          return { type: "num", prompt: "$B$ is on $\\overarc{AC}$. $m\\overarc{AB} = " + b + "°$ and $m\\overarc{BC} = " + c + "°$. Find $m\\overarc{AC}$.", post: "°", answer: b + c,
            near: near(b + c, [{ v: Math.abs(b - c), fb: "Arcs that share only an endpoint add." }]), hints: ["Arc Addition Postulate."], why: "$" + b + " + " + c + " = " + (b + c) + "$." }; }
        if (k === 3) return { type: "num", prompt: "A circle has a radius of " + T[2] + ". A chord is " + T[0] + " from the centre. How long is the chord?", answer: 2 * T[1],
          near: near(2 * T[1], [{ v: T[1], fb: "That is half the chord. Double it." }]), hints: ["The perpendicular from the centre bisects the chord.", "Half the chord is $\\sqrt{" + T[2] + "^2 - " + T[0] + "^2}$."], why: "Half the chord is " + T[1] + ", so the chord is " + 2 * T[1] + "." };
        return { type: "num", prompt: "A circle has a radius of " + T[2] + ". A chord of the circle is " + 2 * T[1] + " long. How far is the chord from the centre?", answer: T[0],
          near: near(T[0], [{ v: T[2] - T[1], fb: "Subtract the squares, not the lengths." }]), hints: ["Half the chord is " + T[1] + ".", "$d^2 + " + T[1] + "^2 = " + T[2] + "^2$."], why: "$\\sqrt{" + T[2] * T[2] + " - " + T[1] * T[1] + "} = " + T[0] + "$." };
      } },
    { id: "hg11-sector", title: "Sector area and arc length", lesson: 4,
      gen: function (R) {
        var S = R.pick([[30, 12], [36, 10], [45, 8], [60, 6], [72, 5], [90, 4], [120, 3], [180, 2]]), area = R.chance(0.5), r = R.int(2, 12), guard = 0;
        while ((area ? r * r : 2 * r) % S[1] && guard++ < 40) r = R.int(2, 12);
        if ((area ? r * r : 2 * r) % S[1]) r = S[1];
        var ans = (area ? r * r : 2 * r) / S[1];
        return { type: "num", prompt: "A circle has a radius of " + r + ". Find the " + (area ? "area of a sector" : "length of an arc") + " of " + S[0] + "°. Type the number in front of $\\pi$.", post: PI_POST, answer: ans,
          near: near(ans, [{ v: (area ? 2 * r : r * r) / S[1], tol: 0.001, fb: area ? "That is the arc length. A sector's area is a fraction of $\\pi r^2$." : "That is the sector's area. An arc is a fraction of the circumference, $2\\pi r$." }, { v: area ? r * r : 2 * r, fb: "That is the whole circle. Take $\\frac{" + S[0] + "}{360}$ of it." }]),
          hints: ["$\\frac{" + S[0] + "}{360} = \\frac{1}{" + S[1] + "}$.", "The whole " + (area ? "area is $" + r * r + "\\pi$." : "circumference is $" + 2 * r + "\\pi$.")], why: "$\\frac{1}{" + S[1] + "}(" + (area ? r * r : 2 * r) + "\\pi) = " + ans + "\\pi$." };
      } },
    { id: "hg11-inscribed", title: "Inscribed angles", lesson: 5,
      gen: function (R) {
        var k = R.int(0, 3), a = R.int(20, 85);
        if (k === 0) return { type: "num", prompt: "An inscribed angle intercepts an arc of " + 2 * a + "°. Find the measure of the angle.", post: "°", answer: a,
          near: near(a, [{ v: 2 * a, fb: "That is a central angle. An inscribed angle is half its arc." }, { v: 4 * a, fb: "Half, not double." }]), hints: ["An inscribed angle is half its intercepted arc."], why: "$\\frac{1}{2}(" + 2 * a + "°) = " + a + "°$." };
        if (k === 1) return { type: "num", prompt: "An inscribed angle measures " + a + "°. Find the measure of its intercepted arc.", post: "°", answer: 2 * a,
          near: near(2 * a, [{ v: a / 2, fb: "The arc is twice the angle, not half of it." }]), hints: ["The arc is twice the inscribed angle."], why: "$2(" + a + "°) = " + 2 * a + "°$." };
        if (k === 2) { var b = R.int(55, 125);
          return { type: "num", prompt: "Quadrilateral $ABCD$ is inscribed in a circle, and $m\\angle A = " + b + "°$. Find $m\\angle C$.", post: "°", answer: 180 - b,
            near: near(180 - b, [{ v: b, fb: "Opposite angles of an inscribed quadrilateral are supplementary, not congruent." }]), hints: ["$\\angle A$ and $\\angle C$ are opposite: they add to 180°."], why: "$180 - " + b + " = " + (180 - b) + "$." }; }
        var c = R.int(20, 70);
        return { type: "num", prompt: "$\\triangle ABC$ is inscribed in a circle, and $\\overline{AB}$ is a diameter. $m\\angle A = " + c + "°$. Find $m\\angle B$.", post: "°", answer: 90 - c,
          near: near(90 - c, [{ v: 180 - c, fb: "$\\angle C$ is a right angle, so $\\angle A$ and $\\angle B$ share the other 90°." }]), hints: ["An angle inscribed in a semicircle is 90°: that is $\\angle C$."], why: "$90 - " + c + " = " + (90 - c) + "$." };
      } },
    { id: "hg11-angles", title: "Angles formed by chords, secants and tangents", lesson: 6,
      gen: function (R) {
        var k = R.int(0, 3);
        if (k === 0) { var a = 10 * R.int(6, 12), b = 10 * R.int(2, 5) + (R.chance(0.5) ? 0 : 10), s = (a + b) / 2;
          return { type: "num", prompt: "Find $m\\angle AEB$.", art: insideFig(a, b, a + "°", b + "°", "Two chords cross at E inside a circle. The arc in front of angle AEB is " + a + " degrees and the arc behind it is " + b + " degrees."), post: "°", answer: s,
            near: near(s, [{ v: (a - b) / 2, fb: "That is half the difference. Inside the circle, use the sum." }, { v: a + b, fb: "That is the sum. Halve it." }]), hints: ["Vertex inside the circle: $\\frac{1}{2}(" + a + " + " + b + ")$."], why: "$\\frac{1}{2}(" + (a + b) + "°) = " + s + "°$." }; }
        if (k === 1) { var near2 = 10 * R.int(2, 6), far = near2 + 20 * R.int(2, 4), d = (far - near2) / 2;
          return { type: "num", prompt: "Find $m\\angle P$.", art: outsideFig(near2, far, near2 + "°", far + "°", "Two secants from a point P outside a circle cut off a near arc of " + near2 + " degrees and a far arc of " + far + " degrees."), post: "°", answer: d,
            near: near(d, [{ v: (far + near2) / 2, fb: "That is half the sum. Outside the circle, use the difference." }, { v: far - near2, fb: "That is the difference. Halve it." }]), hints: ["Vertex outside the circle: $\\frac{1}{2}(" + far + " - " + near2 + ")$."], why: "$\\frac{1}{2}(" + (far - near2) + "°) = " + d + "°$." }; }
        if (k === 2) { var arc = 2 * R.int(25, 85);
          return { type: "num", prompt: "A tangent and a chord meet at a point on a circle. The arc between them is " + arc + "°. Find the angle they form.", post: "°", answer: arc / 2,
            near: near(arc / 2, [{ v: arc, fb: "The vertex is on the circle: take half the arc." }]), hints: ["Vertex on the circle: half the intercepted arc."], why: "$\\frac{1}{2}(" + arc + "°) = " + arc / 2 + "°$." }; }
        var ang = 5 * R.int(8, 16), one = 10 * R.int(5, 9), other = 2 * ang - one;
        if (other <= 0 || other >= 360 - one) { ang = 60; one = 80; other = 40; }
        return { type: "num", prompt: "Two chords cross inside a circle and form an angle of " + ang + "°. The arc in front of the angle is " + one + "°. Find the arc behind it.", post: "°", answer: other,
          near: near(other, [{ v: ang - one / 2, fb: "Double the angle first: $" + 2 * ang + " = " + one + " + x$." }]), hints: ["$" + ang + " = \\frac{1}{2}(" + one + " + x)$.", "$" + 2 * ang + " = " + one + " + x$."], why: "$x = " + 2 * ang + " - " + one + " = " + other + "$." };
      } },
    { id: "hg11-segments", title: "Segment products in circles", lesson: 7,
      gen: function (R) {
        var k = R.int(0, 2);
        if (k === 0) { var c = R.int(2, 6), x = R.int(2, 9), a = R.pick([2, 3, 4, 6]), b = c * x / a;
          if (b % 1) { a = c; b = x; c = R.pick([2, 3, 4].filter(function (n) { return (a * b) % n === 0; })) || 1; x = a * b / c; }
          return { type: "num", prompt: "Find $x$.", art: chordsFig([String(a), String(b), String(c), "x"], "Chords AB and CD of a circle cross at E. AE is " + a + ", EB is " + b + ", CE is " + c + " and ED is x."), pre: "$x =$", answer: x,
            near: near(x, [{ v: a + b - c, fb: "Multiply the parts of each chord. Do not add them." }]), hints: ["$" + a + " \\cdot " + b + " = " + c + "x$."], why: "$" + a * b + " = " + c + "x$, so $x = " + x + "$." }; }
        if (k === 1) { var S = R.pick([[2, 12, 3, 8], [3, 8, 4, 6], [2, 9, 3, 6], [4, 9, 3, 12], [2, 15, 5, 6], [3, 12, 4, 9], [2, 10, 4, 5], [4, 10, 5, 8]]);
          return { type: "num", prompt: "Two secants are drawn from a point outside a circle. The first has an outside part of " + S[0] + " and a whole length of " + S[1] + ". The second has an outside part of " + S[2] + ". Find the part of the second secant that is **inside** the circle.", answer: S[3] - S[2],
            near: near(S[3] - S[2], [{ v: S[3], fb: "That is the whole second secant. Take away its outside part." }]), hints: ["Whole times outside part: $" + S[1] + " \\cdot " + S[0] + " = w \\cdot " + S[2] + "$.", "$w = " + S[3] + "$."], why: "The whole is " + S[3] + ", so the inside part is $" + S[3] + " - " + S[2] + " = " + (S[3] - S[2]) + "$." }; }
        var Tn = R.pick([[4, 9, 6], [2, 8, 4], [3, 12, 6], [4, 16, 8], [5, 20, 10], [2, 18, 6], [9, 16, 12], [3, 27, 9]]);
        return { type: "num", prompt: "From a point outside a circle, a tangent and a secant are drawn. The secant's outside part is " + Tn[0] + ", and its whole length is " + Tn[1] + ". How long is the tangent segment?", answer: Tn[2],
          near: near(Tn[2], [{ v: Tn[0] * Tn[1], fb: "That is the tangent squared. Take the square root." }]), hints: ["$t^2 = " + Tn[1] + " \\cdot " + Tn[0] + "$."], why: "$t^2 = " + Tn[0] * Tn[1] + "$, so $t = " + Tn[2] + "$." };
      } },
    { id: "hg11-equation", title: "The equation of a circle", lesson: 8,
      gen: function (R) {
        var k = R.int(0, 3), h = R.int(-6, 6), kk = R.nz(-6, 6), r = R.int(2, 9);
        if (k === 0) return mc(R, { prompt: "Which is the equation of the circle with centre $" + pt([h, kk]) + "$ and radius " + r + "?", right: "$" + circEq(h, kk, r * r) + "$",
          wrong: [{ t: "$" + circEq(-h, -kk, r * r) + "$", fb: "The signs inside the brackets are the opposite of the centre's coordinates." }, { t: "$" + circEq(h, kk, r) + "$", fb: "The right side is $r^2 = " + r * r + "$." }].filter(function (w) { return w.t !== "$" + circEq(h, kk, r * r) + "$"; }),
          hints: ["$(x - h)^2 + (y - k)^2 = r^2$."], why: "$h = " + h + "$, $k = " + kk + "$ and $r^2 = " + r * r + "$." });
        if (k === 1) return { type: "pair", prompt: "Find the centre of the circle $" + circEq(h, kk, r * r) + "$. Type it as $(x, y)$.", answer: [h, kk],
          near: [{ v: [-h, -kk], fb: "The centre's coordinates have the opposite signs to the numbers in the brackets." }], hints: ["Compare with $(x - h)^2 + (y - k)^2 = r^2$."], why: "The centre is $" + pt([h, kk]) + "$." };
        if (k === 2) return { type: "num", prompt: "Find the radius of the circle $" + circEq(h, kk, r * r) + "$.", answer: r,
          near: near(r, [{ v: r * r, fb: "That is $r^2$. Take the square root." }]), hints: ["$r^2 = " + r * r + "$."], why: "$\\sqrt{" + r * r + "} = " + r + "$." };
        var T = R.pick(TR11), sx = R.pick([1, -1]), sy = R.pick([1, -1]);
        return { type: "num", prompt: "A circle has its centre at the origin and passes through $" + pt([sx * T[0], sy * T[1]]) + "$. Its equation is $x^2 + y^2 = c$. Find $c$.", pre: "$c =$", answer: T[2] * T[2],
          near: near(T[2] * T[2], [{ v: T[2], fb: "That is the radius. The equation has $r^2$ on the right." }]), hints: ["$r^2 = " + T[0] + "^2 + " + T[1] + "^2$."], why: "$" + T[0] * T[0] + " + " + T[1] * T[1] + " = " + T[2] * T[2] + "$." };
      } }
  ];
  L.unit("geo", 11, {
    title: "Circles",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Tangents, arcs and chords, sector area and arc length.",
        skills: ["hg11-tangent", "hg11-arcs", "hg11-sector"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Inscribed angles, and angles made by chords, secants and tangents.",
        skills: ["hg11-inscribed", "hg11-angles"], per: 3 },
      { title: "Quiz 3", after: 8, blurb: "Segment products, and the equation of a circle.",
        skills: ["hg11-segments", "hg11-equation"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:11", {
    2: { name: "Lines and circles", frame: "A [[chord]] has both ends on the circle. A [[tangent]] touches the circle at one point and is [[perpendicular]] to the radius there. Two tangent segments from one point are [[congruent]].",
         chips: ["secant", "parallel"] },
    3: { name: "Arcs and chords", frame: "A minor arc measures the same as its [[central]] angle. A major arc is [[360°]] minus the minor arc. A radius perpendicular to a chord [[bisects]] it.",
         chips: ["inscribed", "180°"] },
    4: { name: "Sectors and arcs", frame: "A central angle of m° takes [[m/360]] of the circle. A sector's area is that fraction of [[πr²]]. An arc's length is that fraction of [[2πr]].",
         chips: ["m/180", "πd²"] },
    5: { name: "Inscribed angles", frame: "An inscribed angle has its vertex [[on]] the circle and measures [[half]] its intercepted arc. An angle inscribed in a semicircle is a [[right]] angle.",
         chips: ["twice", "inside"] },
    6: { name: "Angles in circles", frame: "Vertex on the circle: half the arc. Vertex inside: half the [[sum]] of the two arcs. Vertex outside: half the [[difference]] of the two arcs.",
         chips: ["product", "quotient"] },
    7: { name: "Segments in circles", frame: "When two chords cross, the [[products]] of their parts are equal. For two secants from one point, [[whole]] times [[outside]] part is the same for both.",
         chips: ["sums", "inside"] },
    8: { name: "Equation of a circle", frame: "A circle with centre (h, k) and radius r has the equation (x − h)² + (y − k)² = [[r²]]. It comes from the [[Distance]] Formula. The radius is the square [[root]] of the right side.",
         chips: ["r", "Midpoint"] }
  });
})();
