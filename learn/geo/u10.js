/* ==========================================================================
   Geometry — Unit 10: Spatial Reasoning. See lab/core.js for the format and
   lab/geotools.js for the drawing kit (GT.solid, and the solid3 scene that
   turns a polyhedron and counts its faces, vertices and edges).

   Follows Holt Geometry, Chapter 10, section for section (10-1 to 10-8),
   after a readiness check. Only the order of topics is the book's: every
   sentence, example, figure and question here is OEdu's own.

   Solids, nets and cross sections (10-1), orthographic, isometric and
   perspective drawings (10-2), Euler's formula and distance in three
   dimensions (10-3), surface area of prisms and cylinders (10-4) and of
   pyramids and cones (10-5), volume of prisms and cylinders (10-6) and of
   pyramids and cones (10-7), and spheres (10-8).

   An answer with π in it is typed as the number in front of π.

   Lessons carry v: 4 (see Unit 1). Skills are hg10-….

   Nine lessons, eight skills, three quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  var PI_POST = "$\\pi$";
  // Unit squares at these grid places: a net, or a flat view of a stack of cubes. o.c: colour; o.cap, o.alt, o.u.
  function cells(list, o) {
    o = o || {};
    var xs = list.map(function (q) { return q[0]; }), ys = list.map(function (q) { return q[1]; });
    return plain([Math.min.apply(null, xs) - 0.3, Math.max.apply(null, xs) + 1.3], [Math.min.apply(null, ys) - 0.3, Math.max.apply(null, ys) + 1.3],
      list.map(function (q) { return { poly: [q, [q[0] + 1, q[1]], [q[0] + 1, q[1] + 1], [q[0], q[1] + 1]], c: o.c || "blue", fill: true }; }), { u: o.u || 28, cap: o.cap, alt: o.alt });
  }
  /* An isometric drawing of unit cubes. cubes: [[x, y, z], …], with x running to the front right, y to the front left
     and z up. The cubes are painted from the back to the front, each face solid, so a cube in front hides what is
     behind it. Faces towards the front left are orange (the front view); those towards the front right are green
     (the side view); tops are blue. o.front: false leaves out the two words. */
  function iso(cubes, o) {
    o = o || {};
    var c30 = 0.866, u = o.u || 30, has = {}, faces = [], xs = [], ys = [];
    function P(x, y, z) { var p = [(x - y) * c30, z - (x + y) * 0.5]; xs.push(p[0]); ys.push(p[1]); return p; }
    cubes.forEach(function (c) { has[c.join(",")] = 1; });
    cubes.slice().sort(function (a, b) { return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]); }).forEach(function (c) {
      var x = c[0], y = c[1], z = c[2];
      if (!has[[x, y, z + 1].join(",")]) faces.push(["blue", [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)]]);
      if (!has[[x + 1, y, z].join(",")]) faces.push(["green", [P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)]]);
      if (!has[[x, y + 1, z].join(",")]) faces.push(["orange", [P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)]]);
    });
    var x0 = Math.min.apply(null, xs) - 0.6, x1 = Math.max.apply(null, xs) + 0.6, y0 = Math.min.apply(null, ys) - (o.front === false ? 0.4 : 0.9), y1 = Math.max.apply(null, ys) + 0.4;
    var W = Math.round((x1 - x0) * u), H = Math.round((y1 - y0) * u);
    function X(v) { return ((v - x0) * u).toFixed(1); }
    function Y(v) { return ((y1 - v) * u).toFixed(1); }
    var body = faces.map(function (f) {
      var d = "M" + f[1].map(function (p) { return X(p[0]) + " " + Y(p[1]); }).join("L") + "Z";
      return '<path class="lf-bg" d="' + d + '"/><g class="lf-' + f[0] + '"><path class="gt-face base" d="' + d + '"/><path class="lf-stroke" d="' + d + '"/></g>';
    }).join("");
    if (o.front !== false) body += '<g class="lf-orange"><text class="lf-word" x="' + X(x0 + 0.9) + '" y="' + (H - 8) + '" text-anchor="middle">front</text></g>' +
      '<g class="lf-green"><text class="lf-word" x="' + X(x1 - 0.9) + '" y="' + (H - 8) + '" text-anchor="middle">side</text></g>';
    return '<figure class="lf" style="max-width:' + W + 'px"><svg class="lf-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + L.esc(o.alt || "A stack of cubes.") + '">' +
      '<rect class="lf-bg" width="' + W + '" height="' + H + '" rx="12"/>' + body + "</svg>" + (o.cap ? "<figcaption>" + o.cap + "</figcaption>" : "") + "</figure>";
  }
  // A cylinder, a cone or a sphere, with its measurements written on it. lab: { r, h, l }.
  function round(shape, lab, alt) {
    var o = { cylinder: { r: 1.2, h: 2.2 }, cone: { r: 1.3, h: 2.4 }, sphere: { r: 1.6 } }[shape];
    return GT.solid(Object.assign({ shape: shape, labels: lab, size: 220, scale: 52, alt: alt }, o));
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
    blurb: "Before Chapter 10 · Areas of flat figures, circles, and the Pythagorean Theorem.",
    mins: 6, v: 4,
    steps: [
      { type: "num", kicker: "Check 1 · Area", prompt: "Find the area of a rectangle 5 cm by 3 cm.", post: "cm²", answer: 15, skill: "Area formulas",
        near: [{ v: 16, fb: "That is the perimeter. Multiply the length by the width." }], hints: ["$5 \\cdot 3$."], why: "$5 \\cdot 3 = 15$." },
      { type: "num", prompt: "Find the area of a triangle with a base of 4 and a height of 3.", answer: 6, skill: "Area formulas",
        near: [{ v: 12, fb: "That is $4 \\cdot 3$. Take half." }], hints: ["$\\frac{1}{2}(4)(3)$."], why: "$\\frac{1}{2}(12) = 6$." },
      { type: "num", kicker: "Check 2 · Circles", prompt: "A circle has a radius of 3. Find its area. Type the number in front of $\\pi$.", post: PI_POST, answer: 9, skill: "Circles",
        near: [{ v: 6, fb: "That is the circumference, $2\\pi r$. The area is $\\pi r^2$." }], hints: ["$\\pi(3)^2$."], why: "$\\pi(3)^2 = 9\\pi$." },
      { type: "num", prompt: "The same circle: find its circumference. Type the number in front of $\\pi$.", post: PI_POST, answer: 6, skill: "Circles",
        near: [{ v: 9, fb: "That is the area. The circumference is $2\\pi r$." }], hints: ["$2\\pi(3)$."], why: "$2\\pi(3) = 6\\pi$." },
      { type: "num", kicker: "Check 3 · Pythagorean Theorem", prompt: "The legs of a right triangle are 6 and 8. Find the hypotenuse.", answer: 10, skill: "Pythagorean Theorem",
        near: [{ v: 14, fb: "Square each leg, add, then take the root." }], hints: ["$6^2 + 8^2 = c^2$."], why: "$\\sqrt{100} = 10$." },
      { type: "num", prompt: "Find $3^3$.", answer: 27, skill: "Powers",
        near: [{ v: 9, fb: "That is $3^2$. Multiply by 3 once more." }], hints: ["$3 \\cdot 3 \\cdot 3$."], why: "$3 \\cdot 3 \\cdot 3 = 27$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 10-1**. If **check 1 or 2** slipped, see lessons 9-1 and 9-2. If **check 3** slipped, see lesson 5-7.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });

  /* ============================================================== 10-1 · Solid geometry */
  var HOW_10_1 = [["Faces", "Are all the surfaces flat polygons, or is one of them curved?"],
                  ["Bases", "Two parallel, congruent bases: a prism or a cylinder. One base and a vertex: a pyramid or a cone."],
                  ["Name", "Name a prism or a pyramid by the shape of its base."]];
  var FIG_PYR6 = GT.solid({ shape: "pyramid", n: 6, r: 1.5, h: 2.4, size: 220, scale: 52, alt: "A solid with a six-sided base. Its other faces are triangles that meet at one point above the base." }),
      FIG_PRISM3 = GT.solid({ shape: "prism", n: 3, r: 1.3, h: 2.2, rot: 0.3, size: 220, scale: 52, alt: "A solid with two triangular ends joined by three rectangles." }),
      NET_CUBE = cells([[0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [1, 0]], { u: 24, alt: "Four squares in a row, with one square above the second and one below it." }),
      NET_BAD1 = cells([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], { u: 24, alt: "A block of squares, three wide and two high." }),
      NET_BAD2 = cells([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [1, 1]], { u: 24, alt: "Five squares in a row, with one square above the second." });
  LESSONS.push({
    title: "Solid geometry",
    blurb: "Book 10-1 · Prisms, cylinders, pyramids and cones, with their nets and cross sections.",
    mins: 13, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is a polygon with five sides called?",
        options: [{ t: "A pentagon" }, { t: "A hexagon", fb: "A hexagon has six sides." }, { t: "A quadrilateral", fb: "A quadrilateral has four sides." }],
        answer: 0, skill: "Name polygons", hints: ["Penta- means five."], why: "Five sides: a pentagon." },
      { type: "learn", kicker: "Explore",
        prompt: "A solid has **faces** (its flat surfaces), **edges** (where two faces meet) and **vertices** (where edges meet). **Drag** this one round and watch the counts.",
        scene: { type: "solid3", shape: "prism", n: 5, r: 1.35, h: 2.2, rot: 0.3, size: 340, sizeH: 290, scale: 66, counts: true, gate: true },
        gate: true, then: "This solid has two congruent pentagons, in parallel planes, joined by rectangles. That makes it a pentagonal **prism**." },
      { type: "learn", kicker: "The idea",
        prompt: "A **prism** has two parallel congruent bases joined by parallelograms. A **cylinder** is the same with circles. A **pyramid** has one base, and triangles that meet at a vertex. A **cone** is the same with a circle.",
        scene: { type: "method", how: HOW_10_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this solid classified.",
        scene: { type: "walk", how: HOW_10_1, rows: [
          { step: 1, m: "\\text{every face is a flat polygon}", say: "No curved surface, so it is not a cylinder or a cone.", fig: FIG_PYR6 },
          { step: 2, m: "\\text{one base, and triangles meeting at a vertex}", say: "The base is the six-sided face underneath.",
            ask: { prompt: "One base, and triangular faces that meet at a point. Which family is it?", answer: 0,
                   options: [{ t: "A pyramid" }, { t: "A prism", fb: "A prism has two bases, joined by rectangles." }] } },
          { step: 2, m: "\\text{pyramid}", say: "One base and a vertex." },
          { step: 3, m: "\\text{hexagonal pyramid}", say: "Its base has six sides." }] },
        gate: true, then: "Faces, bases, name." },
      { type: "guided", kicker: "Together",
        prompt: "Now you classify this solid.", art: FIG_PRISM3,
        how: HOW_10_1, skill: "Classify solids",
        steps: [
          { step: 1, ask: "Are all of its surfaces flat polygons?", type: "choice", answer: 0,
            options: [{ t: "Yes" }, { t: "No: one is curved", fb: "Its faces are triangles and rectangles: all flat." }],
            m: "\\text{every face is a flat polygon}", say: "Two triangles and three rectangles." },
          { step: 2, ask: "It has two parallel, congruent triangles joined by rectangles. Which family is it?", type: "choice", answer: 0,
            options: [{ t: "A prism" }, { t: "A pyramid", fb: "A pyramid has one base, and its other faces meet at a point." }],
            m: "\\text{prism}", say: "Two parallel congruent bases." },
          { step: 3, ask: "What is its full name?", type: "choice", answer: 0,
            options: [{ t: "Triangular prism" }, { t: "Rectangular prism", fb: "Name it by its bases, the two congruent parallel faces: they are triangles." }],
            m: "\\text{triangular prism}", say: "Named by the shape of its bases." },
          { step: 3, ask: "How many faces does it have altogether?", type: "num", answer: 5, near: [{ v: 3, fb: "Count the two triangular bases as well." }], hint: "Two bases and three rectangles.",
            m: "2 + 3 = 5 \\text{ faces}", say: "Two bases and three lateral faces." }],
        why: "Faces, bases, name. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "A **net** is a solid unfolded flat. Which of these nets folds up into a cube?",
        options: [{ t: NET_CUBE }, { t: NET_BAD1, fb: "Fold it: squares land on top of each other, and two faces are left open." }, { t: NET_BAD2, fb: "Five squares in a row wrap round and overlap. A cube has only four faces round its middle." }],
        answer: 0, skill: "Nets", hints: ["Four squares in a row wrap round the middle. You need one more square on each side to close the ends."], why: "Four in a row make the sides, and the other two fold over to close the top and the bottom." },
      { type: "choice", prompt: "A net is made of two congruent circles and one rectangle. Which solid does it fold into?",
        options: [{ t: "A cylinder" }, { t: "A cone", fb: "A cone has only one circle, and its curved surface unrolls into part of a circle." }, { t: "A prism", fb: "A prism's bases are polygons, not circles." }],
        answer: 0, skill: "Nets", hints: ["Two bases that are circles."], why: "The rectangle rolls up into the curved surface, and the circles close the ends." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **cross section** is the shape you see on the cut face when a plane slices a solid. Watch three slices.",
        scene: { type: "walk", how: [["Cut", "Picture the flat cut going through the solid."], ["Shape", "The cross section is the shape of the cut face."], ["Name", "Name that shape."]], rows: [
          { step: 1, m: "\\text{a cylinder, cut parallel to its bases}", say: "Like slicing a carrot straight across.", fig: round("cylinder", {}, "A cylinder.") },
          { step: 2, m: "\\text{the cut face matches the bases}", say: "Every level slice of a cylinder is the same." },
          { step: 3, m: "\\text{a circle}", say: "That cross section is a circle." },
          { step: 3, m: "\\text{cut straight down instead: a rectangle}", say: "Like splitting a log. The face is as wide as the cylinder and as tall as it.",
            ask: { prompt: "Now cut straight down through both bases. The cut face has two straight sides down the cylinder and two across its bases. What shape is it?", answer: 0,
                   options: [{ t: "A rectangle" }, { t: "A circle", fb: "A circle comes from a cut parallel to the bases." }] } }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A cube is sliced by a plane parallel to one of its faces. What shape is the cross section?",
        options: [{ t: "A square" }, { t: "A triangle", fb: "A triangle comes from slicing off a corner." }, { t: "A circle", fb: "A cube has no curved surface." }],
        answer: 0, skill: "Cross sections", hints: ["The cut face matches the face it is parallel to."], why: "Every slice parallel to a face is a square of the same size." },
      { type: "choice", kicker: "Find the error",
        prompt: "A solid has two triangular bases and three rectangular faces. Tia calls it a triangular pyramid. What is wrong?",
        options: [{ t: "Two parallel congruent bases make it a prism: a triangular prism." },
                  { t: "It is a rectangular prism.", fb: "A prism is named by its bases, and they are triangles." },
                  { t: "Nothing. Its base is a triangle.", fb: "A pyramid has one base, and its other faces are triangles that meet at a point." }],
        answer: 0, skill: "Classify solids", hints: ["How many bases does a pyramid have?"], why: "A pyramid has one base. This solid has two." },
      { type: "choice", kicker: "Use it", prompt: "A round of cheese is a cylinder. A cheesemonger cuts it straight down through the centre. What shape is the cut face?",
        options: [{ t: "A rectangle" }, { t: "A circle", fb: "A circle comes from a level cut, parallel to the top." }, { t: "A triangle", fb: "The wedge you lift out looks triangular from above, but the cut face itself is a rectangle." }],
        answer: 0, skill: "Cross sections", hints: ["The cut goes down through both circular bases."], why: "As wide as the cheese and as tall as it: a rectangle." }
    ]
  });

  /* ================================ 10-2 · Representations of three-dimensional figures */
  var HOW_10_2 = [["Top", "Look straight down: draw what you see from above."],
                  ["Front", "Look from the front: draw the widths and the heights."],
                  ["Side", "Look from the side: draw the depths and the heights."]];
  var ST_L = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1]], ST_2 = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1]], ST_T = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]];
  var FIG_L = FS([iso(ST_L, { alt: "Four cubes: three in a row, with one more on top of the cube at the back end of the row." }),
                  cells([[0, 0], [1, 0], [2, 0]], { c: "blue", cap: "Top", u: 22 }), cells([[0, 0], [1, 0], [2, 0], [0, 1]], { c: "orange", cap: "Front", u: 22 }), cells([[0, 0], [0, 1]], { c: "green", cap: "Side", u: 22 })]),
      FIG_S2 = iso(ST_2, { alt: "A block of cubes two wide and two deep, with one more cube on top of the cube in the back corner." }),
      FIG_T = iso(ST_T, { alt: "Four cubes: three in a row, with one more on top of the middle cube." }),
      FIG_PERSP = (function () {
        var V = [5.2, 3.2], F = [[0, 0], [2.2, 0], [2.2, 1.6], [0, 1.6]], B = F.map(function (p) { return [p[0] + 0.5 * (V[0] - p[0]), p[1] + 0.5 * (V[1] - p[1])]; });
        return plain([-0.6, 6.2], [-0.6, 3.9], [{ seg: [[-0.4, 3.2], [6, 3.2]], c: "soft" }, { word: "horizon", at: [0.5, 2.95], c: "soft" }, { pt: V, name: "vanishing point", at: "n", c: "orange" }]
          .concat(F.map(function (p) { return { seg: [p, V], dash: true, c: "soft" }; }), [{ poly: B, c: "blue" }], F.map(function (p, i) { return { seg: [p, B[i]], c: "blue" }; }), [{ poly: F, c: "blue", fill: true }]),
          { u: 34, alt: "A box drawn in perspective. Dashed lines run from the corners of its front face to a vanishing point on the horizon, and the back face is smaller than the front." });
      })();
  LESSONS.push({
    title: "Representations of three-dimensional figures",
    blurb: "Book 10-2 · Orthographic views, isometric drawings and perspective drawings.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "How many faces does a cube have?", answer: 6, skill: "Solids",
        near: [{ v: 8, fb: "8 is the number of vertices." }, { v: 12, fb: "12 is the number of edges." }], hints: ["Think of a dice."], why: "Top, bottom and four sides: 6." },
      { type: "learn", kicker: "The idea",
        prompt: "A page can show a solid three ways. An **orthographic drawing** shows flat views: top, front and side. An **isometric drawing** shows three faces at once, with parallel edges drawn parallel. A **perspective drawing** makes far things smaller: parallel edges meet at a **vanishing point** on the **horizon**.",
        scene: { type: "method", how: HOW_10_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the three flat views of this stack of cubes drawn. The orange faces are its front, and the green faces its side.",
        scene: { type: "walk", how: HOW_10_2, rows: [
          { step: 1, m: "\\text{top: three squares in a row}", say: "From above you cannot tell how tall each stack is.", fig: FIG_L },
          { step: 2, m: "\\text{front: three wide, and two high at one end}", say: "The front view shows the widths and the heights.",
            ask: { prompt: "How many cubes high is the tallest stack?", answer: 0,
                   options: [{ t: "2" }, { t: "3", fb: "Three is how many cubes are in the row. The tallest stack is two cubes high." }] } },
          { step: 3, m: "\\text{side: one wide, two high}", say: "From the side the three stacks line up behind each other. You see the tallest." },
          { step: 3, m: "\\text{three views, one solid}", say: "Together the three views fix the shape." }] },
        gate: true, then: "Top, front, side." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Picture the three flat views of this stack. The orange faces are its front, and the green faces its side.", art: FIG_S2,
        how: HOW_10_2, skill: "Orthographic views",
        steps: [
          { step: 1, ask: "From straight above, how many squares do you see?", type: "num", answer: 4, near: [{ v: 5, fb: "The cube on top hides the one under it: from above you see only 4 squares." }], hint: "The base is two wide and two deep.",
            m: "\\text{top: a 2 by 2 square}", say: "Four squares." },
          { step: 2, ask: "In the front view, how many squares high is the taller column?", type: "num", answer: 2, hint: "One stack is two cubes high.",
            m: "\\text{front: columns 2 high and 1 high}", say: "Three squares in all." },
          { step: 3, ask: "How many squares are there in the side view?", type: "num", answer: 3, near: [{ v: 5, fb: "A view shows each column once, however many cubes stand behind it." }], hint: "One column is 2 high and the other is 1 high.",
            m: "\\text{side: columns 2 high and 1 high}", say: "Three squares again." }],
        why: "Top, front, side. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Which is the front view of this stack? The orange faces are its front.", art: FIG_T,
        options: [{ t: cells([[0, 0], [1, 0], [2, 0], [1, 1]], { c: "orange", u: 22, alt: "Three squares in a row with one above the middle square." }) },
                  { t: cells([[0, 0], [1, 0], [2, 0], [0, 1]], { c: "orange", u: 22, alt: "Three squares in a row with one above the end square." }), fb: "The extra cube is on the middle of the row, not on the end." },
                  { t: cells([[0, 0], [1, 0], [2, 0]], { c: "orange", u: 22, alt: "Three squares in a row." }), fb: "That is the top view. The front view shows the heights." }],
        answer: 0, skill: "Orthographic views", hints: ["Which cube of the row has another on top of it?"], why: "Three wide, with the middle column two high." },
      { type: "sort", prompt: "Which kind of drawing is each description?",
        bins: ["Orthographic", "Isometric", "Perspective"],
        cards: [{ t: "Separate flat views: top, front and side", bin: 0, fb: "Each view looks straight at one side." }, { t: "Three faces at once, with parallel edges drawn parallel", bin: 1, fb: "Nothing gets smaller with distance." },
                { t: "Parallel edges meet at a vanishing point", bin: 2, fb: "That is how the eye sees depth." }, { t: "Things that are further away are drawn smaller", bin: 2, fb: "Perspective shrinks what is far away." }],
        skill: "Kinds of drawing", hints: ["Flat views, three faces at once, or far things smaller?"],
        why: "Orthographic: flat views. Isometric: three faces, nothing shrinks. Perspective: a vanishing point." },
      { type: "learn", kicker: "A harder case",
        prompt: "Watch a box drawn in **one-point perspective**.",
        scene: { type: "walk", how: [["Horizon", "Draw a horizon line, and mark a vanishing point on it."], ["Front", "Draw the front face."], ["Recede", "Join its corners to the vanishing point, then draw the back edges parallel to the front ones."]], rows: [
          { step: 1, m: "\\text{horizon and vanishing point}", say: "The horizon is at eye level.", fig: FIG_PERSP },
          { step: 2, m: "\\text{front face: a rectangle}", say: "The front face is drawn in its true shape." },
          { step: 3, m: "\\text{corners joined to the vanishing point}", say: "Edges that go back into the page run along these dashed lines.",
            ask: { prompt: "In the drawing, is the back face larger or smaller than the front face?", answer: 0,
                   options: [{ t: "Smaller" }, { t: "The same size", fb: "In perspective, what is further away is drawn smaller." }] } },
          { step: 3, m: "\\text{back edges parallel to the front edges}", say: "The back face is a smaller copy of the front one." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "How many cubes are in this stack? Remember the ones you cannot see.", art: FIG_S2, answer: 5, skill: "Isometric drawings",
        near: [{ v: 4, fb: "The cube on top must stand on another cube, hidden beneath it." }], hints: ["Four on the bottom layer, and one on top."], why: "Four on the bottom layer and one on top: 5." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam draws the **front** view of this stack as three squares in a row. What is wrong?", art: iso(ST_L, { alt: "Four cubes: three in a row, with one more on top of the cube at one end." }),
        options: [{ t: "That is the top view. The front view must show that one stack is two cubes high." },
                  { t: "The front view should have four squares in a row.", fb: "The stack is only three cubes wide." },
                  { t: "Nothing. There are three cubes in the row.", fb: "A front view shows heights too." }],
        answer: 0, skill: "Orthographic views", hints: ["What does a front view show that a top view cannot?"], why: "Heights appear in the front and side views, never in the top view." },
      { type: "choice", kicker: "Use it", prompt: "An architect's floor plan shows the rooms of a house as if the roof were lifted off. Which kind of drawing is it?",
        options: [{ t: "An orthographic drawing: the top view" }, { t: "An isometric drawing", fb: "An isometric drawing shows three faces at once." }, { t: "A perspective drawing", fb: "A floor plan has no vanishing point, and nothing in it shrinks with distance." }],
        answer: 0, skill: "Kinds of drawing", hints: ["It looks straight down."], why: "A flat view from directly above." }
    ]
  });

  /* ================================================== 10-3 · Formulas in three dimensions */
  var HOW_10_3 = [["Formula", "Pick the formula. Euler: $V - E + F = 2$. Diagonal of a box: $d = \\sqrt{ℓ^2 + w^2 + h^2}$. Distance and midpoint work as before, with a third coordinate $z$."],
                  ["Substitute", "Put in the numbers."],
                  ["Solve", "Work it out."]];
  LESSONS.push({
    title: "Formulas in three dimensions",
    blurb: "Book 10-3 · Euler's formula, the diagonal of a box, and distance and midpoint with three coordinates.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $\\sqrt{9 + 16 + 144}$.", answer: 13, skill: "Square roots",
        near: [{ v: 19, fb: "Add first, then take one square root: $\\sqrt{169}$." }], hints: ["$9 + 16 + 144 = 169$."], why: "$\\sqrt{169} = 13$." },
      { type: "learn", kicker: "Explore",
        prompt: "A **polyhedron** is a solid whose faces are all polygons. Count the vertices, edges and faces of this one. **Turn** it to check, and watch $V - E + F$.",
        scene: { type: "solid3", shape: "octa", size: 320, sizeH: 280, scale: 70, counts: true, euler: true, gate: true },
        gate: true, then: "Here $6 - 12 + 8 = 2$. A cube gives $8 - 12 + 6 = 2$. For every polyhedron like these, $V - E + F = 2$: **Euler's formula**." },
      { type: "learn", kicker: "The idea",
        prompt: "Three formulas for three dimensions. **Euler's formula** links the vertices, edges and faces of a polyhedron. The **diagonal** of a box uses the Pythagorean Theorem twice. And with a third coordinate, $z$, the distance and midpoint formulas just gain one more term.",
        scene: { type: "method", how: HOW_10_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the diagonal of a box found. The box is 12 long, 4 wide and 3 high.",
        scene: { type: "walk", how: HOW_10_3, rows: [
          { step: 1, m: "d = \\sqrt{ℓ^2 + w^2 + h^2}", say: "The diagonal runs from one corner to the opposite corner, through the inside of the box.", fig: boxDims(12, 3, 4, ["12", "3", "4"]) },
          { step: 2, m: "d = \\sqrt{12^2 + 4^2 + 3^2}", say: "Length, width and height." },
          { step: 3, m: "d = \\sqrt{169}", say: "$144 + 16 + 9$.",
            ask: { prompt: "What is $144 + 16 + 9$?", answer: 0,
                   options: [{ t: "169" }, { t: "19", fb: "Those are the squares already: add 144, 16 and 9." }] } },
          { step: 3, m: "d = 13", say: "Longer than any edge of the box." }] },
        gate: true, then: "Three squares under one root." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. A polyhedron has 12 vertices and 8 faces. How many edges does it have?",
        how: HOW_10_3, skill: "Euler's formula",
        steps: [
          { step: 1, ask: "Which formula links vertices, edges and faces?", type: "choice", answer: 0,
            options: [{ t: "$V - E + F = 2$" }, { t: "$V + E + F = 2$", fb: "The edges are subtracted." }],
            m: "V - E + F = 2", say: "Euler's formula." },
          { step: 2, ask: "Put in $V = 12$ and $F = 8$. What is $12 + 8$?", type: "num", answer: 20, hint: "$12 + 8$.",
            m: "12 - E + 8 = 2", say: "So $20 - E = 2$." },
          { step: 3, ask: "Solve $20 - E = 2$.", type: "num", answer: 18, near: [{ v: 22, fb: "Subtract 2 from 20, do not add it." }], hint: "$20 - 2$.",
            m: "E = 18", say: "It is a hexagonal prism: 12 vertices, 18 edges, 8 faces." }],
        why: "Formula, substitute, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the distance from $(0, 0, 0)$ to $(2, 3, 6)$.", answer: 7, skill: "Distance in three dimensions",
        near: [{ v: 11, fb: "Square each coordinate, add, then take the root." }, { v: 49, fb: "That is the sum of the squares. Take the square root." }],
        hints: ["$\\sqrt{2^2 + 3^2 + 6^2}$."], why: "$\\sqrt{4 + 9 + 36} = \\sqrt{49} = 7$." },
      { type: "choice", prompt: "Find the midpoint of the segment from $(2, 4, 6)$ to $(8, 0, 10)$.",
        options: [{ t: "$(5, 2, 8)$" }, { t: "$(10, 4, 16)$", fb: "Those are the sums. Halve each one." }, { t: "$(3, 2, 2)$", fb: "That halves the differences. Average the coordinates: add, then halve." }],
        answer: 0, skill: "Midpoint in three dimensions", hints: ["Average the $x$s, the $y$s and the $z$s."], why: "$\\left(\\frac{10}{2}, \\frac{4}{2}, \\frac{16}{2}\\right) = (5, 2, 8)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The distance between any two points in space. Find the distance from $(1, 2, 3)$ to $(4, 6, 15)$.",
        scene: { type: "walk", how: [["Differences", "Subtract the coordinates, pair by pair."], ["Squares", "Square each difference, and add."], ["Root", "Take the square root."]], rows: [
          { step: 1, m: "4 - 1 = 3 \\qquad 6 - 2 = 4 \\qquad 15 - 3 = 12", say: "The change in $x$, in $y$ and in $z$." },
          { step: 2, m: "3^2 + 4^2 + 12^2", say: "Square each change." },
          { step: 2, m: "9 + 16 + 144 = 169", say: "Add the squares.",
            ask: { prompt: "What is $12^2$?", answer: 0,
                   options: [{ t: "144" }, { t: "24", fb: "That is $12 \\cdot 2$. Squaring multiplies 12 by itself." }] } },
          { step: 3, m: "d = \\sqrt{169} = 13", say: "The distance is 13." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A box is 6 long, 3 wide and 2 high. Find the length of its diagonal.", answer: 7, skill: "Diagonal of a box",
        near: [{ v: 11, fb: "Square each dimension, add, then take the root." }], hints: ["$\\sqrt{6^2 + 3^2 + 2^2}$."], why: "$\\sqrt{36 + 9 + 4} = \\sqrt{49} = 7$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "A polyhedron has 6 vertices and 8 faces. Find the number of edges. Tap the line where the work **first** goes wrong.",
        lines: ["6 - E + 8 = 2", "14 - E = 2", "E = 16"], answer: 2, fix: "E = 12",
        fb: { 0: "Euler's formula is filled in correctly.", 1: "$6 + 8 = 14$ is right." }, skill: "Euler's formula",
        hints: ["Check the last step: what must be taken from 14 to leave 2?"],
        why: "$14 - E = 2$ means $E = 12$. Check: $6 - 12 + 8 = 2$." },
      { type: "num", kicker: "Use it", prompt: "A packing box is 12 in. long, 9 in. wide and 8 in. high. What is the longest straight rod that fits inside it?", post: "in.", answer: 17, skill: "Diagonal of a box",
        near: [{ v: 15, fb: "That is the diagonal of the bottom. The longest rod runs corner to opposite corner, through the box." }],
        hints: ["The longest rod lies along the diagonal of the box: $\\sqrt{12^2 + 9^2 + 8^2}$."], why: "$\\sqrt{144 + 81 + 64} = \\sqrt{289} = 17$." }
    ]
  });
  /* ============================================ 10-4 · Surface area of prisms and cylinders */
  var HOW_10_4 = [["Lateral", "Lateral area: the perimeter of the base times the height, $L = Ph$. For a cylinder, $L = 2\\pi rh$."],
                  ["Bases", "Find the area of one base, $B$."],
                  ["Total", "Surface area: $S = L + 2B$."]];
  var FIG_BOX534 = boxDims(5, 4, 3, ["5 cm", "4 cm", "3 cm"]),
      FIG_CYL35 = round("cylinder", { r: "3", h: "5" }, "A cylinder with a radius of 3 and a height of 5."),
      FIG_TP = triPrism(["4 cm", "3 cm", "10 cm"]),
      FIG_CYL410 = round("cylinder", { r: "4", h: "10" }, "A cylinder with a radius of 4 and a height of 10.");
  LESSONS.push({
    title: "Surface area of prisms and cylinders",
    blurb: "Book 10-4 · Lateral area is perimeter times height. Add the two bases for the surface area.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the perimeter of a rectangle 5 cm by 3 cm.", post: "cm", answer: 16, skill: "Perimeter",
        near: [{ v: 15, fb: "That is the area. Add all four sides." }, { v: 8, fb: "That is one length and one width. Go all the way round." }], hints: ["$2(5) + 2(3)$."], why: "$10 + 6 = 16$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **lateral faces** of a prism are the faces that are not bases. Unfold them and they make one rectangle, as long as the base's perimeter and as tall as the prism: the **lateral area** is $L = Ph$. The **surface area** adds the two bases: $S = L + 2B$.",
        scene: { type: "method", how: HOW_10_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the surface area of this box found. Its base is 5 cm by 3 cm, and its height is 4 cm.",
        scene: { type: "walk", how: HOW_10_4, rows: [
          { step: 1, m: "P = 2(5) + 2(3) = 16", say: "The perimeter of the base.", fig: FIG_BOX534 },
          { step: 1, m: "L = Ph = 16 \\cdot 4 = 64", say: "The four side faces together." },
          { step: 2, m: "B = 5 \\cdot 3 = 15", say: "The area of one base." },
          { step: 3, m: "S = 64 + 2(15)", say: "The lateral area, plus two bases.",
            ask: { prompt: "What is $64 + 30$?", answer: 0,
                   options: [{ t: "94" }, { t: "79", fb: "Add both bases: $2 \\cdot 15 = 30$." }] } },
          { step: 3, m: "S = 94", say: "94 cm²." }] },
        gate: true, then: "Sides first, then the two ends." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the surface area of this cylinder. Type each answer as the number in front of $\\pi$.", art: FIG_CYL35,
        how: HOW_10_4, skill: "Surface area",
        steps: [
          { step: 1, ask: "$L = 2\\pi rh = 2\\pi(3)(5)$. The lateral area is what number times $\\pi$?", type: "num", answer: 30, near: [{ v: 15, fb: "Do not forget the 2: $2 \\cdot 3 \\cdot 5$." }], hint: "$2 \\cdot 3 \\cdot 5$.",
            m: "L = 30\\pi", say: "The curved surface unrolls into a rectangle." },
          { step: 2, ask: "$B = \\pi r^2$. One base is what number times $\\pi$?", type: "num", answer: 9, near: [{ v: 6, fb: "Square the radius: $3 \\cdot 3$." }], hint: "$3^2$.",
            m: "B = 9\\pi", say: "A circle of radius 3." },
          { step: 3, ask: "$S = L + 2B$. The surface area is what number times $\\pi$?", type: "num", answer: 48, near: [{ v: 39, fb: "There are two bases: add $9\\pi$ twice." }], hint: "$30 + 18$.",
            m: "S = 30\\pi + 18\\pi = 48\\pi", say: "About 150.7 square units." }],
        why: "Lateral, bases, total. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the surface area of this triangular prism. Its bases are right triangles with legs of 3 cm and 4 cm, so the third side of each is 5 cm.", art: FIG_TP, post: "cm²", answer: 132, skill: "Surface area",
        near: [{ v: 126, fb: "Add both triangular bases: $2 \\cdot 6$." }, { v: 120, fb: "That is the lateral area. Add the two bases." }],
        hints: ["$P = 3 + 4 + 5 = 12$, so $L = 12 \\cdot 10$.", "$B = \\frac{1}{2}(3)(4) = 6$."], why: "$L = 120$ and $2B = 12$, so $S = 132$." },
      { type: "num", prompt: "Find the surface area of a cube with edges of 4.", answer: 96, skill: "Surface area",
        near: [{ v: 64, fb: "That is the volume. The surface is six squares." }, { v: 16, fb: "That is one face. A cube has six." }],
        hints: ["Six faces, each $4 \\cdot 4$."], why: "$6 \\cdot 16 = 96$." },
      { type: "learn", kicker: "A harder case",
        prompt: "What happens to the surface area when **every** dimension is doubled? Compare a 2 by 3 by 4 box with a 4 by 6 by 8 box.",
        scene: { type: "walk", how: [["Before", "Find the surface area of the first solid."], ["After", "Find the surface area of the second."], ["Compare", "Divide to find the factor."]], rows: [
          { step: 1, m: "S = 2(2 \\cdot 3 + 2 \\cdot 4 + 3 \\cdot 4) = 52", say: "Three pairs of faces: 6, 8 and 12." },
          { step: 2, m: "S = 2(4 \\cdot 6 + 4 \\cdot 8 + 6 \\cdot 8) = 208", say: "Three pairs of faces: 24, 32 and 48." },
          { step: 3, m: "208 \\div 52 = 4", say: "Doubling every dimension multiplies the surface area by 4.",
            ask: { prompt: "Every dimension was multiplied by 2. The surface area was multiplied by 4. How is 4 related to 2?", answer: 0,
                   options: [{ t: "$4 = 2^2$" }, { t: "$4 = 2 + 2$", fb: "Try tripling: the area is multiplied by 9, which is $3^2$, not $3 + 3$." }] } },
          { step: 3, m: "k^2 = 2^2 = 4", say: "Surface area is an area: it is multiplied by $k^2$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the surface area of this cylinder. Type the number in front of $\\pi$.", art: FIG_CYL410, post: PI_POST, answer: 112, skill: "Surface area",
        near: [{ v: 96, fb: "Add both bases: $2 \\cdot 16\\pi$." }, { v: 80, fb: "That is the lateral area. Add the two bases." }],
        hints: ["$L = 2\\pi(4)(10) = 80\\pi$.", "$B = \\pi(4)^2 = 16\\pi$."], why: "$80\\pi + 32\\pi = 112\\pi$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For a cylinder with radius 3 and height 5, Di finds the surface area as $30\\pi + 9\\pi = 39\\pi$. What is wrong?",
        options: [{ t: "A cylinder has two bases: $30\\pi + 2(9\\pi) = 48\\pi$." },
                  { t: "The lateral area should be $15\\pi$.", fb: "$2\\pi(3)(5) = 30\\pi$ is right." },
                  { t: "Nothing. Lateral area plus base.", fb: "That would be a cylinder with no lid." }],
        answer: 0, skill: "Surface area", hints: ["Count the circles."], why: "$S = L + 2B$." },
      { type: "num", kicker: "Use it", prompt: "A paper label wraps round a can, covering only the curved side. The can has a radius of 4 cm and a height of 10 cm. Find the area of the label to the nearest square centimetre. Use $\\pi \\approx 3.14$.", post: "cm²", answer: 251, tol: 1, skill: "Surface area",
        near: [{ v: 352, tol: 2, fb: "That includes the top and the bottom. The label covers only the side." }],
        hints: ["Only the lateral area: $2\\pi rh$."], why: "$2(3.14)(4)(10) = 251.2$, about 251." }
    ]
  });

  /* ============================================== 10-5 · Surface area of pyramids and cones */
  var HOW_10_5 = [["Slant", "Find the slant height $ℓ$: the distance along a face from the vertex down to the base."],
                  ["Lateral", "Regular pyramid: $L = \\frac{1}{2}Pℓ$. Right cone: $L = \\pi rℓ$."],
                  ["Total", "Add the base: $S = L + B$."]];
  var FIG_PYR65 = pyrDims({ s: "6", l: "5" }),
      FIG_CONE35 = round("cone", { r: "3", l: "5" }, "A cone with a radius of 3 and a slant height of 5."),
      FIG_PYR1013 = pyrDims({ s: "10", l: "13" }),
      FIG_CONE68 = round("cone", { r: "6", h: "8" }, "A cone with a radius of 6 and a height of 8."),
      FIG_PYR166 = pyrDims({ s: "16", h: "6" });
  LESSONS.push({
    title: "Surface area of pyramids and cones",
    blurb: "Book 10-5 · Lateral area uses the slant height. Add the one base for the surface area.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $\\sqrt{3^2 + 4^2}$.", answer: 5, skill: "Pythagorean Theorem",
        near: [{ v: 7, fb: "Square each, add, then take the root." }], hints: ["$\\sqrt{9 + 16}$."], why: "$\\sqrt{25} = 5$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **slant height** $ℓ$ of a regular pyramid is the height of one of its triangular faces. Each face has area $\\frac{1}{2}$ base times $ℓ$, so together $L = \\frac{1}{2}Pℓ$. A cone works the same way: $L = \\pi rℓ$. Each has only **one** base, so $S = L + B$.",
        scene: { type: "method", how: HOW_10_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the surface area of this square pyramid found. Its base has sides of 6, and its slant height is 5.",
        scene: { type: "walk", how: HOW_10_5, rows: [
          { step: 1, m: "ℓ = 5", say: "The slant height runs down the middle of a face.", fig: FIG_PYR65 },
          { step: 2, m: "P = 4 \\cdot 6 = 24", say: "The perimeter of the square base." },
          { step: 2, m: "L = \\frac{1}{2}(24)(5) = 60", say: "Four triangles, each $\\frac{1}{2}(6)(5) = 15$." },
          { step: 3, m: "B = 6^2 = 36", say: "The square base.",
            ask: { prompt: "What is $60 + 36$?", answer: 0,
                   options: [{ t: "96" }, { t: "132", fb: "A pyramid has one base: add 36 once." }] } },
          { step: 3, m: "S = 60 + 36 = 96", say: "96 square units." }] },
        gate: true, then: "Slant, lateral, total." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the surface area of this cone. Type each answer as the number in front of $\\pi$.", art: FIG_CONE35,
        how: HOW_10_5, skill: "Surface area",
        steps: [
          { step: 1, ask: "What is the slant height $ℓ$?", type: "num", answer: 5, hint: "It is marked along the side of the cone.",
            m: "ℓ = 5", say: "Measured along the surface." },
          { step: 2, ask: "$L = \\pi rℓ = \\pi(3)(5)$. The lateral area is what number times $\\pi$?", type: "num", answer: 15, hint: "$3 \\cdot 5$.",
            m: "L = 15\\pi", say: "The curved surface." },
          { step: 3, ask: "The base is $\\pi(3)^2 = 9\\pi$. The surface area is what number times $\\pi$?", type: "num", answer: 24, near: [{ v: 33, fb: "A cone has one base: add $9\\pi$ once." }], hint: "$15 + 9$.",
            m: "S = 15\\pi + 9\\pi = 24\\pi", say: "About 75.4 square units." }],
        why: "Slant, lateral, total. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the surface area of this square pyramid.", art: FIG_PYR1013, answer: 360, skill: "Surface area",
        near: [{ v: 260, fb: "That is the lateral area. Add the base, $10^2$." }, { v: 620, fb: "$L = \\frac{1}{2}Pℓ$: take half of $40 \\cdot 13$." }],
        hints: ["$P = 40$, so $L = \\frac{1}{2}(40)(13)$.", "$B = 10^2$."], why: "$260 + 100 = 360$." },
      { type: "num", prompt: "A cone has a radius of 5 and a slant height of 8. Find its **lateral** area. Type the number in front of $\\pi$.", post: PI_POST, answer: 40, skill: "Surface area",
        near: [{ v: 65, fb: "That is the whole surface area. The lateral area leaves out the base." }], hints: ["$L = \\pi rℓ$."], why: "$\\pi(5)(8) = 40\\pi$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes you are given the **height**, not the slant height. The radius, the height and the slant height make a right triangle. Find the surface area of this cone.",
        scene: { type: "walk", how: HOW_10_5, rows: [
          { step: 1, m: "ℓ^2 = 6^2 + 8^2 = 100", say: "The Pythagorean Theorem, with the radius and the height as legs.", fig: FIG_CONE68 },
          { step: 1, m: "ℓ = 10", say: "The slant height." },
          { step: 2, m: "L = \\pi(6)(10) = 60\\pi", say: "The lateral area." },
          { step: 3, m: "B = \\pi(6)^2 = 36\\pi", say: "The base.",
            ask: { prompt: "What is $60 + 36$?", answer: 0,
                   options: [{ t: "96" }, { t: "132", fb: "A cone has one base: add 36 once." }] } },
          { step: 3, m: "S = 60\\pi + 36\\pi = 96\\pi", say: "About 301.4 square units." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the surface area of this square pyramid. Its base has sides of 16, and its **height** is 6.", art: FIG_PYR166, answer: 576, skill: "Surface area",
        near: [{ v: 448, fb: "Use the slant height, 10, not the height, 6." }, { v: 320, fb: "That is the lateral area. Add the base, $16^2$." }],
        hints: ["Half the base is 8, so $ℓ = \\sqrt{8^2 + 6^2} = 10$.", "$L = \\frac{1}{2}(64)(10)$ and $B = 16^2$."], why: "$320 + 256 = 576$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A square pyramid has a base with sides of 6, a height of 4 and a slant height of 5. Jo finds its lateral area as $\\frac{1}{2}(24)(4) = 48$. What is wrong?",
        options: [{ t: "She used the height. The lateral area needs the slant height: $\\frac{1}{2}(24)(5) = 60$." },
                  { t: "The perimeter should be 36.", fb: "$4 \\cdot 6 = 24$ is right. 36 is the base's area." },
                  { t: "Nothing. Half the perimeter times the height.", fb: "The height goes through the inside. The faces are measured by the slant height." }],
        answer: 0, skill: "Surface area", hints: ["Which length lies along a face?"], why: "A triangular face is as tall as the slant height." },
      { type: "num", kicker: "Use it", prompt: "A paper party hat is a cone with no base. Its radius is 7 cm and its slant height is 20 cm. How much paper is in the hat, to the nearest square centimetre? Use $\\pi \\approx 3.14$.", post: "cm²", answer: 440, tol: 1, skill: "Surface area",
        near: [{ v: 594, tol: 2, fb: "The hat has no base. Use only the lateral area." }],
        hints: ["$L = \\pi rℓ$."], why: "$3.14(7)(20) = 439.6$, about 440." }
    ]
  });

  /* ================================================== 10-6 · Volume of prisms and cylinders */
  var HOW_10_6 = [["Base", "Find the area of the base, $B$."],
                  ["Height", "Find the height: the perpendicular distance between the bases."],
                  ["Volume", "$V = Bh$. For a cylinder, $V = \\pi r^2 h$."]];
  var FIG_CYL27 = round("cylinder", { r: "2", h: "7" }, "A cylinder with a radius of 2 and a height of 7.");
  LESSONS.push({
    title: "Volume of prisms and cylinders",
    blurb: "Book 10-6 · Volume is the area of the base times the height.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the area of a rectangle 5 cm by 3 cm.", post: "cm²", answer: 15, skill: "Area formulas",
        near: [{ v: 16, fb: "That is the perimeter. Multiply the length by the width." }], hints: ["$5 \\cdot 3$."], why: "$5 \\cdot 3 = 15$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Volume** is the number of unit cubes that fill a solid. One layer of a prism holds as many cubes as the area of its base, and there are as many layers as its height. So $V = Bh$, for every prism and every cylinder, leaning or upright.",
        scene: { type: "method", how: HOW_10_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the volume of this box found. Its base is 5 cm by 3 cm, and its height is 4 cm.",
        scene: { type: "walk", how: HOW_10_6, rows: [
          { step: 1, m: "B = 5 \\cdot 3 = 15", say: "One layer holds 15 cubes.", fig: FIG_BOX534 },
          { step: 2, m: "h = 4", say: "Four layers." },
          { step: 3, m: "V = Bh = 15 \\cdot 4", say: "Base area times height.",
            ask: { prompt: "What is $15 \\cdot 4$?", answer: 0,
                   options: [{ t: "60" }, { t: "19", fb: "Multiply, do not add." }] } },
          { step: 3, m: "V = 60", say: "60 cm³: cubic units." }] },
        gate: true, then: "Base, height, volume." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the volume of this cylinder. Type each answer as the number in front of $\\pi$.", art: FIG_CYL35,
        how: HOW_10_6, skill: "Volume",
        steps: [
          { step: 1, ask: "$B = \\pi r^2$. The base is what number times $\\pi$?", type: "num", answer: 9, near: [{ v: 6, fb: "Square the radius: $3 \\cdot 3$." }], hint: "$3^2$.",
            m: "B = 9\\pi", say: "A circle of radius 3." },
          { step: 2, ask: "What is the height?", type: "num", answer: 5, hint: "It is marked on the cylinder.",
            m: "h = 5", say: "The distance between the bases." },
          { step: 3, ask: "$V = Bh$. The volume is what number times $\\pi$?", type: "num", answer: 45, near: [{ v: 15, fb: "Square the radius first: $9 \\cdot 5$." }], hint: "$9 \\cdot 5$.",
            m: "V = 9\\pi \\cdot 5 = 45\\pi", say: "About 141.3 cubic units." }],
        why: "Base, height, volume. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the volume of this triangular prism. Its bases are right triangles with legs of 3 cm and 4 cm.", art: FIG_TP, post: "cm³", answer: 60, skill: "Volume",
        near: [{ v: 120, fb: "The base is a triangle: $\\frac{1}{2}(3)(4) = 6$, not 12." }],
        hints: ["$B = \\frac{1}{2}(3)(4) = 6$.", "The height of the prism is its length, 10."], why: "$6 \\cdot 10 = 60$." },
      { type: "num", prompt: "Find the volume of a cube with edges of 4.", answer: 64, skill: "Volume",
        near: [{ v: 96, fb: "That is the surface area. The volume is $4 \\cdot 4 \\cdot 4$." }, { v: 12, fb: "Multiply the three edges. Do not add them." }],
        hints: ["$4^3$."], why: "$4 \\cdot 4 \\cdot 4 = 64$." },
      { type: "learn", kicker: "A harder case",
        prompt: "What happens to the volume when **every** dimension is doubled? Compare a 2 by 3 by 4 box with a 4 by 6 by 8 box.",
        scene: { type: "walk", how: [["Before", "Find the volume of the first solid."], ["After", "Find the volume of the second."], ["Compare", "Divide to find the factor."]], rows: [
          { step: 1, m: "V = 2 \\cdot 3 \\cdot 4 = 24", say: "The small box." },
          { step: 2, m: "V = 4 \\cdot 6 \\cdot 8 = 192", say: "The large box." },
          { step: 3, m: "192 \\div 24 = 8", say: "Doubling every dimension multiplies the volume by 8.",
            ask: { prompt: "Every dimension was multiplied by 2. The volume was multiplied by 8. How is 8 related to 2?", answer: 0,
                   options: [{ t: "$8 = 2^3$" }, { t: "$8 = 2 \\cdot 4$, so it is always 4 times the factor", fb: "Try tripling: the volume is multiplied by 27, which is $3^3$." }] } },
          { step: 3, m: "k^3 = 2^3 = 8", say: "Volume multiplies three dimensions, so it is multiplied by $k^3$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the volume of this cylinder. Type the number in front of $\\pi$.", art: FIG_CYL27, post: PI_POST, answer: 28, skill: "Volume",
        near: [{ v: 14, fb: "Square the radius: $2^2 = 4$, then times 7." }, { v: 98, fb: "Square the radius, not the height: $2^2 \\cdot 7$." }],
        hints: ["$V = \\pi r^2 h = \\pi(2)^2(7)$."], why: "$4 \\cdot 7 = 28$, so $V = 28\\pi$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For a cylinder with radius 3 and height 5, Lu finds the volume as $\\pi(3)(5) = 15\\pi$. What is wrong?",
        options: [{ t: "The radius must be squared: $\\pi(3)^2(5) = 45\\pi$." },
                  { t: "The height must be squared: $\\pi(3)(5)^2 = 75\\pi$.", fb: "The base is $\\pi r^2$. It is the radius that is squared." },
                  { t: "Nothing. $\\pi$ times radius times height.", fb: "The base of a cylinder is a circle, with area $\\pi r^2$." }],
        answer: 0, skill: "Volume", hints: ["What is the area of the circular base?"], why: "$V = Bh = \\pi r^2 h$." },
      { type: "num", kicker: "Use it", prompt: "A fish tank is 60 cm long, 30 cm wide and 40 cm high. How many litres of water does it hold when full? (1 litre is 1000 cm³.)", post: "L", answer: 72, skill: "Volume",
        near: [{ v: 72000, fb: "That is in cubic centimetres. Divide by 1000 for litres." }],
        hints: ["$60 \\cdot 30 \\cdot 40 = 72\\,000$ cm³."], why: "$72\\,000 \\div 1000 = 72$." }
    ]
  });
  /* =================================================== 10-7 · Volume of pyramids and cones */
  var HOW_10_7 = [["Base", "Find the area of the base, $B$."],
                  ["Height", "Use the height, the altitude: straight up from the base to the vertex. Not the slant height."],
                  ["Third", "$V = \\frac{1}{3}Bh$. For a cone, $V = \\frac{1}{3}\\pi r^2 h$."]];
  var FIG_PYR64 = pyrDims({ s: "6", h: "4" }),
      FIG_CONE34 = round("cone", { r: "3", h: "4" }, "A cone with a radius of 3 and a height of 4."),
      FIG_CONE65 = round("cone", { r: "6", h: "5" }, "A cone with a radius of 6 and a height of 5."),
      FIG_CONE513 = round("cone", { r: "5", l: "13" }, "A cone with a radius of 5 and a slant height of 13."),
      FIG_PYR10S = pyrDims({ s: "10", l: "13" });
  LESSONS.push({
    title: "Volume of pyramids and cones",
    blurb: "Book 10-7 · A pyramid or a cone holds one third of the prism or cylinder with the same base and height.",
    mins: 13, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $\\frac{1}{3}$ of 36.", answer: 12, skill: "Fractions of a number",
        near: [{ v: 108, fb: "That is 3 times 36. Divide by 3." }], hints: ["$36 \\div 3$."], why: "$36 \\div 3 = 12$." },
      { type: "choice", kicker: "Explore", prompt: "A pyramid and a prism have the same base and the same height. You fill the pyramid with sand and tip it into the prism, again and again. How many pyramids fill the prism?",
        options: [{ t: "3" }, { t: "2", fb: "The pyramid narrows to a point, so it holds less than half of the prism." }, { t: "4", fb: "It takes exactly three." }],
        answer: 0, skill: "Volume", hints: ["The pyramid holds much less than half."],
        why: "Exactly three. So a pyramid's volume is one third of the prism's: $V = \\frac{1}{3}Bh$. A cone and a cylinder work the same way." },
      { type: "learn", kicker: "The idea",
        prompt: "A pyramid holds one third of the prism with the same base and height, and a cone holds one third of the cylinder. So $V = \\frac{1}{3}Bh$. The $h$ is the **height**, straight up through the inside, not the slant height along a face.",
        scene: { type: "method", how: HOW_10_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the volume of this square pyramid found. Its base has sides of 6, and its height is 4.",
        scene: { type: "walk", how: HOW_10_7, rows: [
          { step: 1, m: "B = 6^2 = 36", say: "The square base.", fig: FIG_PYR64 },
          { step: 2, m: "h = 4", say: "The dashed segment, from the vertex straight down to the base." },
          { step: 3, m: "V = \\frac{1}{3}(36)(4)", say: "One third of base times height.",
            ask: { prompt: "What is $\\frac{1}{3}$ of 36?", answer: 0,
                   options: [{ t: "12" }, { t: "108", fb: "That is 3 times 36. Divide by 3." }] } },
          { step: 3, m: "V = 12 \\cdot 4 = 48", say: "48 cubic units. The prism round it would hold 144." }] },
        gate: true, then: "Base, height, one third." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the volume of this cone. Type each answer as the number in front of $\\pi$.", art: FIG_CONE34,
        how: HOW_10_7, skill: "Volume",
        steps: [
          { step: 1, ask: "$B = \\pi r^2$. The base is what number times $\\pi$?", type: "num", answer: 9, near: [{ v: 6, fb: "Square the radius: $3 \\cdot 3$." }], hint: "$3^2$.",
            m: "B = 9\\pi", say: "A circle of radius 3." },
          { step: 2, ask: "What is the height?", type: "num", answer: 4, hint: "It is the dashed segment inside the cone.",
            m: "h = 4", say: "Straight up the middle." },
          { step: 3, ask: "$V = \\frac{1}{3}Bh = \\frac{1}{3}(9\\pi)(4)$. The volume is what number times $\\pi$?", type: "num", answer: 12, near: [{ v: 36, fb: "Take one third: $36 \\div 3$." }], hint: "$\\frac{1}{3} \\cdot 36$.",
            m: "V = 12\\pi", say: "About 37.7 cubic units." }],
        why: "Base, height, third. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A pyramid has a rectangular base 5 by 6 and a height of 7. Find its volume.", answer: 70, skill: "Volume",
        near: [{ v: 210, fb: "That is the prism. A pyramid is one third of it." }], hints: ["$B = 5 \\cdot 6 = 30$.", "$V = \\frac{1}{3}(30)(7)$."], why: "$\\frac{1}{3}(210) = 70$." },
      { type: "num", prompt: "Find the volume of this cone. Type the number in front of $\\pi$.", art: FIG_CONE65, post: PI_POST, answer: 60, skill: "Volume",
        near: [{ v: 180, fb: "That is the cylinder. A cone is one third of it." }, { v: 10, fb: "Square the radius: $\\frac{1}{3}(36)(5)$." }],
        hints: ["$\\frac{1}{3}\\pi(6)^2(5)$."], why: "$\\frac{1}{3}(36)(5) = 60$, so $V = 60\\pi$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes you are given the **slant height**, and must find the height first. Find the volume of this cone.",
        scene: { type: "walk", how: [["Height", "The radius, the height and the slant height make a right triangle: $h^2 = ℓ^2 - r^2$."], ["Base", "Find the area of the base."], ["Third", "Use $V = \\frac{1}{3}Bh$."]], rows: [
          { step: 1, m: "h^2 = 13^2 - 5^2 = 144", say: "The slant height is the hypotenuse.", fig: FIG_CONE513 },
          { step: 1, m: "h = 12", say: "The height." },
          { step: 2, m: "B = \\pi(5)^2 = 25\\pi", say: "The base." },
          { step: 3, m: "V = \\frac{1}{3}(25\\pi)(12)", say: "One third of base times height.",
            ask: { prompt: "What is $\\frac{1}{3}$ of 12?", answer: 0,
                   options: [{ t: "4" }, { t: "36", fb: "That is 3 times 12. Divide by 3." }] } },
          { step: 3, m: "V = 25\\pi \\cdot 4 = 100\\pi", say: "About 314 cubic units." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the volume of this square pyramid. Its base has sides of 10, and its **slant height** is 13.", art: FIG_PYR10S, answer: 400, skill: "Volume",
        near: [{ v: 433.33, tol: 0.5, fb: "13 is the slant height. Find the height first: $\\sqrt{13^2 - 5^2} = 12$." }, { v: 1200, fb: "That is the prism. A pyramid is one third of it." }],
        hints: ["Half the base is 5, so $h = \\sqrt{13^2 - 5^2} = 12$.", "$V = \\frac{1}{3}(100)(12)$."], why: "$\\frac{1}{3}(100)(12) = 400$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A pyramid has a base area of 36 and a height of 4. Al finds its volume as $36 \\cdot 4 = 144$. What is wrong?",
        options: [{ t: "He left out the one third: $V = \\frac{1}{3}(36)(4) = 48$." },
                  { t: "He should have halved: 72.", fb: "One half is for a triangle's area. A pyramid's volume takes one third." },
                  { t: "Nothing. Volume is base times height.", fb: "That is a prism. A pyramid narrows to a point." }],
        answer: 0, skill: "Volume", hints: ["Which solid has $V = Bh$?"], why: "A pyramid is one third of the prism." },
      { type: "num", kicker: "Use it", prompt: "A paper cup is a cone with a radius of 3 cm and a height of 8 cm. How much water does it hold, to the nearest cubic centimetre? Use $\\pi \\approx 3.14$.", post: "cm³", answer: 75, tol: 1, skill: "Volume",
        near: [{ v: 226, tol: 1, fb: "That is the cylinder. A cone is one third of it." }],
        hints: ["$V = \\frac{1}{3}\\pi(3)^2(8) = 24\\pi$."], why: "$24(3.14) = 75.36$, about 75." }
    ]
  });

  /* ====================================================================== 10-8 · Spheres */
  var HOW_10_8 = [["Radius", "Find the radius: half the diameter."],
                  ["Formula", "Volume: $V = \\frac{4}{3}\\pi r^3$. Surface area: $S = 4\\pi r^2$."],
                  ["Solve", "Cube or square the radius first, then multiply."]];
  var FIG_SPH6 = round("sphere", { r: "6" }, "A sphere with a radius of 6."),
      FIG_SPH3 = round("sphere", { r: "3" }, "A sphere with a radius of 3.");
  LESSONS.push({
    title: "Spheres",
    blurb: "Book 10-8 · The volume and the surface area of a sphere.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $3^3$.", answer: 27, skill: "Powers",
        near: [{ v: 9, fb: "That is $3^2$. Multiply by 3 once more." }], hints: ["$3 \\cdot 3 \\cdot 3$."], why: "$3 \\cdot 3 \\cdot 3 = 27$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **sphere** is every point in space at one distance, the radius, from its **center**. A plane through the center cuts it in a **great circle** and splits it into two **hemispheres**. Its volume is $V = \\frac{4}{3}\\pi r^3$, and its surface area is $S = 4\\pi r^2$: four great circles' worth.",
        scene: { type: "method", how: HOW_10_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the volume and the surface area of this sphere found.",
        scene: { type: "walk", how: HOW_10_8, rows: [
          { step: 1, m: "r = 6", say: "The radius is given.", fig: FIG_SPH6 },
          { step: 2, m: "V = \\frac{4}{3}\\pi(6)^3", say: "The volume formula." },
          { step: 3, m: "V = \\frac{4}{3}\\pi(216) = 288\\pi", say: "$6^3 = 216$, and $\\frac{4}{3}$ of 216 is 288.",
            ask: { prompt: "What is $6^2$, for the surface area?", answer: 0,
                   options: [{ t: "36" }, { t: "12", fb: "That is $6 \\cdot 2$. Squaring multiplies 6 by itself." }] } },
          { step: 3, m: "S = 4\\pi(6)^2 = 144\\pi", say: "Four times 36." }] },
        gate: true, then: "Volume cubes the radius. Surface area squares it." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find the volume and the surface area of this sphere. Type each answer as the number in front of $\\pi$.", art: FIG_SPH3,
        how: HOW_10_8, skill: "Spheres",
        steps: [
          { step: 1, ask: "What is $r^3$ when $r = 3$?", type: "num", answer: 27, near: [{ v: 9, fb: "That is $3^2$. Cube it: $3 \\cdot 3 \\cdot 3$." }], hint: "$3 \\cdot 3 \\cdot 3$.",
            m: "r = 3 \\qquad r^3 = 27", say: "Cube the radius first." },
          { step: 2, ask: "$V = \\frac{4}{3}\\pi(27)$. The volume is what number times $\\pi$?", type: "num", answer: 36, near: [{ v: 108, fb: "That is $4 \\cdot 27$. Divide by 3 as well." }], hint: "$27 \\div 3 = 9$, then times 4.",
            m: "V = 36\\pi", say: "$\\frac{4}{3}$ of 27." },
          { step: 3, ask: "$S = 4\\pi(3)^2$. The surface area is what number times $\\pi$?", type: "num", answer: 36, near: [{ v: 24, fb: "Square the radius first: $4 \\cdot 9$." }], hint: "$4 \\cdot 9$.",
            m: "S = 36\\pi", say: "At $r = 3$ the two numbers happen to match. Their units do not: one is cubic, the other square." }],
        why: "Radius, formula, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A sphere has a **diameter** of 10. Find its surface area. Type the number in front of $\\pi$.", post: PI_POST, answer: 100, skill: "Spheres",
        near: [{ v: 400, fb: "10 is the diameter. The radius is 5." }, { v: 25, fb: "That is one great circle. The surface is four of them." }],
        hints: ["$r = 5$.", "$S = 4\\pi(5)^2$."], why: "$4 \\cdot 25 = 100$, so $S = 100\\pi$." },
      { type: "num", prompt: "A sphere has a radius of 9. Find its volume. Type the number in front of $\\pi$.", post: PI_POST, answer: 972, skill: "Spheres",
        near: [{ v: 324, fb: "That is the surface area, $4\\pi(9)^2$. The volume uses $r^3$." }, { v: 2916, fb: "That is $4 \\cdot 729$. Divide by 3 as well." }],
        hints: ["$9^3 = 729$.", "$\\frac{4}{3}(729) = 4 \\cdot 243$."], why: "$\\frac{4}{3}(729) = 972$, so $V = 972\\pi$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **hemisphere** is half a sphere, with a flat circular face. Find the volume and the total surface area of a solid hemisphere of radius 6.",
        scene: { type: "walk", how: [["Half", "Halve the sphere's volume."], ["Curved", "The curved part is half the sphere's surface."], ["Flat", "Add the flat face: a great circle."]], rows: [
          { step: 1, m: "V = \\frac{1}{2}(288\\pi) = 144\\pi", say: "Half of the whole sphere of radius 6." },
          { step: 2, m: "\\frac{1}{2}(144\\pi) = 72\\pi", say: "The curved surface: half of $4\\pi r^2$." },
          { step: 3, m: "\\pi(6)^2 = 36\\pi", say: "The flat face is a circle of radius 6.",
            ask: { prompt: "What is $72 + 36$?", answer: 0,
                   options: [{ t: "108" }, { t: "72", fb: "Add the flat face as well." }] } },
          { step: 3, m: "S = 72\\pi + 36\\pi = 108\\pi", say: "Curved part plus flat face." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A sphere has a surface area of $64\\pi$. Find its radius.", answer: 4, skill: "Spheres",
        near: [{ v: 16, fb: "That is $r^2$. Take the square root." }, { v: 8, fb: "Divide by 4 first: $r^2 = 16$." }],
        hints: ["$4\\pi r^2 = 64\\pi$, so $r^2 = 16$."], why: "$r = \\sqrt{16} = 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For a sphere of radius 3, Mo writes $V = \\frac{4}{3}\\pi(3)^2 = 12\\pi$. What is wrong?",
        options: [{ t: "Volume uses the radius cubed: $\\frac{4}{3}\\pi(3)^3 = 36\\pi$." },
                  { t: "The fraction should be $\\frac{3}{4}$.", fb: "It is $\\frac{4}{3}$." },
                  { t: "Nothing. $\\frac{4}{3}\\pi r^2$ is the volume.", fb: "Volume is three-dimensional, so the radius is cubed." }],
        answer: 0, skill: "Spheres", hints: ["Squared or cubed?"], why: "$V = \\frac{4}{3}\\pi r^3$." },
      { type: "num", kicker: "Use it", prompt: "A beach ball is blown up until its radius is **twice** what it was. Its volume is multiplied by what number?", answer: 8, skill: "Spheres",
        near: [{ v: 4, fb: "That is what happens to its surface area. Volume is multiplied by $k^3$." }, { v: 2, fb: "The radius doubles, but the volume uses the radius cubed." }],
        hints: ["$(2r)^3 = 8r^3$."], why: "$2^3 = 8$." }
    ]
  });
  /* ================================================================ Skills */
  var VEF = [["triangular prism", 6, 9, 5], ["rectangular prism", 8, 12, 6], ["pentagonal prism", 10, 15, 7], ["hexagonal prism", 12, 18, 8], ["triangular pyramid", 4, 6, 4], ["square pyramid", 5, 8, 5], ["pentagonal pyramid", 6, 10, 6], ["octahedron", 6, 12, 8]];
  var SKILLS = [
    { id: "hg10-classify", title: "Name the solid", lesson: 2,
      gen: function (R) {
        if (R.chance(0.3)) { var Q = R.pick([["two congruent circles and one rectangle", "Cylinder"], ["one circle and a sector of a circle", "Cone"], ["six congruent squares", "Cube"], ["two congruent triangles and three rectangles", "Triangular prism"], ["one square and four congruent triangles", "Square pyramid"]]);
          var ALLN = ["Cylinder", "Cone", "Cube", "Triangular prism", "Square pyramid"];
          return mc(R, { prompt: "A net is made of " + Q[0] + ". Which solid does it fold into?", right: Q[1],
            wrong: R.shuffle(ALLN.filter(function (v) { return v !== Q[1]; })).slice(0, 2).map(function (v) { return { t: v, fb: "Count the bases, and look at their shape." }; }),
            hints: ["The bases tell you the name."], why: "Those faces fold up into a " + Q[1].toLowerCase() + "." }); }
        var S = R.pick(SOLIDS), same = SOLIDS.filter(function (T) { return T.k !== S.k && !!T.poly === !!S.poly; }), other = SOLIDS.filter(function (T) { return T.k !== S.k && !!T.poly !== !!S.poly; });
        var W = R.shuffle(same).slice(0, 2).concat(R.shuffle(other).slice(0, 1));
        function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
        return mc(R, { prompt: "Name this solid.", art: solidFig(S, { alt: "A solid to name." }), right: cap(S.name),
          wrong: W.map(function (T) { return { t: cap(T.name), fb: /prism/.test(T.name) ? "A prism has two parallel congruent bases, joined by rectangles. Name it by its bases." : /pyramid/.test(T.name) ? "A pyramid has one base, and triangles that meet at a vertex. Name it by its base." : "Look at whether its surfaces are flat or curved." }; }),
          hints: ["Are its faces all flat? How many bases are there, and what shape are they?"], why: "It is a " + S.name + "." });
      } },
    { id: "hg10-views", title: "Views of a stack of cubes", lesson: 3,
      gen: function (R) {
        var n = R.int(2, 4), h = [], cubes = [], k = R.int(0, 3);
        for (var q = 0; q < n; q++) h.push(R.int(1, 3));
        h.sort(function (a, b) { return b - a; });                      // tallest at the back, so nothing is hidden
        h.forEach(function (c, x) { for (var z = 0; z < c; z++) cubes.push([x, 0, z]); });
        var total = h.reduce(function (a, b) { return a + b; }, 0), fig = iso(cubes, { alt: "A row of " + n + " stacks of cubes: " + h.join(", ") + " cubes high." });
        if (k === 0) return { type: "num", prompt: "How many cubes are in this stack?", art: fig, answer: total,
          near: near(total, [{ v: n, fb: "That is the number of columns. Count every cube." }]), hints: ["Count each column: " + h.join(" + ") + "."], why: "$" + h.join(" + ") + " = " + total + "$." };
        if (k === 1) return { type: "num", prompt: "How many squares are in the **top** view of this stack?", art: fig, answer: n,
          near: near(n, [{ v: total, fb: "From above, each column shows as one square, however tall it is." }]), hints: ["Look straight down. Each column shows once."], why: n + " columns in a row: " + n + " squares." };
        if (k === 2) return { type: "num", prompt: "How many squares are in the **front** view of this stack? The orange faces are its front.", art: fig, answer: total,
          near: near(total, [{ v: n, fb: "That is the top view. The front view shows every cube in this row." }]), hints: ["From the front you see each column at its full height."], why: "$" + h.join(" + ") + " = " + total + "$ squares." };
        return { type: "num", prompt: "How many squares are in the **side** view of this stack? The green faces are its side.", art: fig, answer: h[0],
          near: near(h[0], [{ v: total, fb: "From the side the columns line up behind each other. You see only the tallest." }]), hints: ["From the side, the columns hide each other."], why: "The tallest column is " + h[0] + " high, and it is one cube wide: " + h[0] + " square" + (h[0] > 1 ? "s" : "") + "." };
      } },
    { id: "hg10-euler", title: "Formulas in three dimensions", lesson: 4,
      gen: function (R) {
        var k = R.int(0, 3);
        if (k === 0) { var S = R.pick(VEF), miss = R.int(0, 2), names = ["vertices", "edges", "faces"], sym = ["V", "E", "F"], given = [0, 1, 2].filter(function (q) { return q !== miss; });
          return { type: "num", prompt: "A polyhedron has " + S[given[0] + 1] + " " + names[given[0]] + " and " + S[given[1] + 1] + " " + names[given[1]] + ". How many " + names[miss] + " does it have?", answer: S[miss + 1],
            near: near(S[miss + 1], [{ v: miss === 1 ? S[1] + S[3] : 0, fb: "Use $V - E + F = 2$: the 2 matters." }]), hints: ["Euler's formula: $V - E + F = 2$.", "Put in the two numbers you know and solve for $" + sym[miss] + "$."], why: "$" + S[1] + " - " + S[2] + " + " + S[3] + " = 2$. It is a " + S[0] + "." }; }
        var T = R.pick([[2, 3, 6, 7], [1, 2, 2, 3], [2, 6, 9, 11], [3, 4, 12, 13], [4, 4, 7, 9], [1, 4, 8, 9], [2, 4, 4, 6], [6, 6, 7, 11], [4, 12, 3, 13]]);
        if (k === 1) return { type: "num", prompt: "A box is " + T[0] + " by " + T[1] + " by " + T[2] + ". Find the length of its diagonal.", answer: T[3],
          near: near(T[3], [{ v: T[0] + T[1] + T[2], fb: "Square each dimension, add, then take the root." }]), hints: ["$\\sqrt{" + T[0] + "^2 + " + T[1] + "^2 + " + T[2] + "^2}$."], why: "$\\sqrt{" + (T[0] * T[0] + T[1] * T[1] + T[2] * T[2]) + "} = " + T[3] + "$." };
        var A = [R.int(-3, 3), R.int(-3, 3), R.int(-3, 3)];
        if (k === 2) { var B = [A[0] + T[0], A[1] + T[1], A[2] + T[2]];
          return { type: "num", prompt: "Find the distance from $(" + A.join(", ") + ")$ to $(" + B.join(", ") + ")$.", answer: T[3],
            near: near(T[3], [{ v: T[0] + T[1] + T[2], fb: "Square each difference, add, then take the root." }]), hints: ["The differences are " + T[0] + ", " + T[1] + " and " + T[2] + "."], why: "$\\sqrt{" + T[0] + "^2 + " + T[1] + "^2 + " + T[2] + "^2} = " + T[3] + "$." }; }
        var D = [2 * R.int(1, 4), 2 * R.int(1, 4), 2 * R.int(1, 4)], Bm = [A[0] + D[0], A[1] + D[1], A[2] + D[2]], M = [A[0] + D[0] / 2, A[1] + D[1] / 2, A[2] + D[2] / 2];
        return mc(R, { prompt: "Find the midpoint of the segment from $(" + A.join(", ") + ")$ to $(" + Bm.join(", ") + ")$.", right: "$(" + M.join(", ") + ")$",
          wrong: [{ t: "$(" + [A[0] + Bm[0], A[1] + Bm[1], A[2] + Bm[2]].join(", ") + ")$", fb: "Those are the sums. Halve each one." }, { t: "$(" + [D[0] / 2, D[1] / 2, D[2] / 2].join(", ") + ")$", fb: "That halves the differences. Average the coordinates: add, then halve." }],
          hints: ["Average the $x$s, the $y$s and the $z$s."], why: "Add each pair of coordinates, then halve." });
      } },
    { id: "hg10-sa-prism", title: "Surface area of prisms and cylinders", lesson: 5,
      gen: function (R) {
        var k = R.int(0, 2);
        if (k === 0) { var a = R.int(2, 8), b = R.int(2, 6), c = R.int(2, 7), S = 2 * (a * b + a * c + b * c);
          return { type: "num", prompt: "Find the surface area of this box.", art: boxDims(a, c, b, [a + " cm", c + " cm", b + " cm"]), post: "cm²", answer: S,
            near: near(S, [{ v: a * b * c, fb: "That is the volume. Add the areas of the six faces." }, { v: S / 2, fb: "Each face has a twin opposite it: double that." }]),
            hints: ["Three pairs of faces: $" + a + " \\times " + b + "$, $" + a + " \\times " + c + "$ and $" + b + " \\times " + c + "$."], why: "$2(" + a * b + " + " + a * c + " + " + b * c + ") = " + S + "$." }; }
        if (k === 1) { var r = R.int(2, 6), h = R.int(3, 10), lat = R.chance(0.4), ans = lat ? 2 * r * h : 2 * r * h + 2 * r * r;
          return { type: "num", prompt: "Find the " + (lat ? "**lateral** area" : "surface area") + " of this cylinder. Type the number in front of $\\pi$.", art: round("cylinder", { r: String(r), h: String(h) }, "A cylinder with a radius of " + r + " and a height of " + h + "."), post: PI_POST, answer: ans,
            near: near(ans, [{ v: lat ? 2 * r * h + 2 * r * r : 2 * r * h, fb: lat ? "That is the whole surface. The lateral area leaves out the two bases." : "That is the lateral area. Add the two bases." }, { v: r * r * h, fb: "That is the volume." }]),
            hints: ["$L = 2\\pi rh = " + 2 * r * h + "\\pi$."].concat(lat ? [] : ["Each base is $\\pi(" + r + ")^2 = " + r * r + "\\pi$."]), why: lat ? "$2\\pi(" + r + ")(" + h + ") = " + ans + "\\pi$." : "$" + 2 * r * h + "\\pi + 2(" + r * r + "\\pi) = " + ans + "\\pi$." }; }
        var e = R.int(2, 9);
        return { type: "num", prompt: "Find the surface area of a cube with edges of " + e + ".", answer: 6 * e * e,
          near: near(6 * e * e, [{ v: e * e * e, fb: "That is the volume. The surface is six squares." }, { v: e * e, fb: "That is one face. A cube has six." }]), hints: ["Six faces, each $" + e + " \\cdot " + e + "$."], why: "$6 \\cdot " + e * e + " = " + 6 * e * e + "$." };
      } },
    { id: "hg10-sa-pyramid", title: "Surface area of pyramids and cones", lesson: 6,
      gen: function (R) {
        var k = R.int(0, 2), T = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]);
        if (k === 0) { var s = 2 * R.int(2, 7), l = R.int(4, 12), S = 2 * s * l + s * s;
          return { type: "num", prompt: "Find the surface area of this square pyramid.", art: pyrDims({ s: String(s), l: String(l) }), answer: S,
            near: near(S, [{ v: 2 * s * l, fb: "That is the lateral area. Add the base." }, { v: 4 * s * l + s * s, fb: "$L = \\frac{1}{2}Pℓ$: take half." }]),
            hints: ["$P = " + 4 * s + "$, so $L = \\frac{1}{2}(" + 4 * s + ")(" + l + ")$.", "$B = " + s + "^2$."], why: "$" + 2 * s * l + " + " + s * s + " = " + S + "$." }; }
        if (k === 1) { var r = R.int(2, 7), ll = r + R.int(2, 8), lat = R.chance(0.4), ans = lat ? r * ll : r * ll + r * r;
          return { type: "num", prompt: "Find the " + (lat ? "**lateral** area" : "surface area") + " of this cone. Type the number in front of $\\pi$.", art: round("cone", { r: String(r), l: String(ll) }, "A cone with a radius of " + r + " and a slant height of " + ll + "."), post: PI_POST, answer: ans,
            near: near(ans, [{ v: lat ? r * ll + r * r : r * ll, fb: lat ? "That is the whole surface. The lateral area leaves out the base." : "That is the lateral area. Add the base." }]),
            hints: ["$L = \\pi rℓ = " + r * ll + "\\pi$."].concat(lat ? [] : ["$B = \\pi(" + r + ")^2 = " + r * r + "\\pi$."]), why: lat ? "$\\pi(" + r + ")(" + ll + ") = " + ans + "\\pi$." : "$" + r * ll + "\\pi + " + r * r + "\\pi = " + ans + "\\pi$." }; }
        return { type: "num", prompt: "A cone has a radius of " + T[0] + " and a height of " + T[1] + ". Find its slant height.", art: round("cone", { r: String(T[0]), h: String(T[1]) }, "A cone with a radius of " + T[0] + " and a height of " + T[1] + "."), answer: T[2],
          near: near(T[2], [{ v: T[0] + T[1], fb: "The radius, the height and the slant height make a right triangle." }]), hints: ["$ℓ^2 = " + T[0] + "^2 + " + T[1] + "^2$."], why: "$\\sqrt{" + (T[0] * T[0] + T[1] * T[1]) + "} = " + T[2] + "$." };
      } },
    { id: "hg10-vol-prism", title: "Volume of prisms and cylinders", lesson: 7,
      gen: function (R) {
        var k = R.int(0, 2);
        if (k === 0) { var a = R.int(2, 9), b = R.int(2, 6), c = R.int(2, 8);
          return { type: "num", prompt: "Find the volume of this box.", art: boxDims(a, c, b, [a + " cm", c + " cm", b + " cm"]), post: "cm³", answer: a * b * c,
            near: near(a * b * c, [{ v: 2 * (a * b + a * c + b * c), fb: "That is the surface area. Multiply the three dimensions." }, { v: a + b + c, fb: "Multiply the three dimensions. Do not add them." }]), hints: ["$V = Bh$: $" + a + " \\cdot " + b + " \\cdot " + c + "$."], why: "$" + a * b + " \\cdot " + c + " = " + a * b * c + "$." }; }
        if (k === 1) { var r = R.int(2, 6), h = R.int(2, 10);
          return { type: "num", prompt: "Find the volume of this cylinder. Type the number in front of $\\pi$.", art: round("cylinder", { r: String(r), h: String(h) }, "A cylinder with a radius of " + r + " and a height of " + h + "."), post: PI_POST, answer: r * r * h,
            near: near(r * r * h, [{ v: r * h, fb: "Square the radius: the base is $\\pi r^2$." }, { v: 2 * r * h, fb: "That is the lateral area. Volume is $\\pi r^2 h$." }]), hints: ["$V = \\pi r^2 h = \\pi(" + r + ")^2(" + h + ")$."], why: "$" + r * r + " \\cdot " + h + " = " + r * r * h + "$, so $V = " + r * r * h + "\\pi$." }; }
        var p = 2 * R.int(1, 4), q = R.int(2, 6), len = R.int(4, 12);
        return { type: "num", prompt: "A triangular prism has bases that are right triangles with legs of " + p + " and " + q + ". The prism is " + len + " long. Find its volume.", answer: p * q / 2 * len,
          near: near(p * q / 2 * len, [{ v: p * q * len, fb: "The base is a triangle: take half of $" + p + " \\cdot " + q + "$." }]), hints: ["$B = \\frac{1}{2}(" + p + ")(" + q + ") = " + p * q / 2 + "$."], why: "$" + p * q / 2 + " \\cdot " + len + " = " + p * q / 2 * len + "$." };
      } },
    { id: "hg10-vol-pyramid", title: "Volume of pyramids and cones", lesson: 8,
      gen: function (R) {
        var k = R.int(0, 2);
        if (k === 0) { var s = R.int(2, 9), h = 3 * R.int(1, 5);
          return { type: "num", prompt: "Find the volume of this square pyramid.", art: pyrDims({ s: String(s), h: String(h) }), answer: s * s * h / 3,
            near: near(s * s * h / 3, [{ v: s * s * h, fb: "That is the prism. A pyramid is one third of it." }]), hints: ["$B = " + s + "^2 = " + s * s + "$.", "$V = \\frac{1}{3}(" + s * s + ")(" + h + ")$."], why: "$\\frac{1}{3}(" + s * s * h + ") = " + s * s * h / 3 + "$." }; }
        if (k === 1) { var r = R.int(2, 6), hh = 3 * R.int(1, 4);
          return { type: "num", prompt: "Find the volume of this cone. Type the number in front of $\\pi$.", art: round("cone", { r: String(r), h: String(hh) }, "A cone with a radius of " + r + " and a height of " + hh + "."), post: PI_POST, answer: r * r * hh / 3,
            near: near(r * r * hh / 3, [{ v: r * r * hh, fb: "That is the cylinder. A cone is one third of it." }]), hints: ["$V = \\frac{1}{3}\\pi(" + r + ")^2(" + hh + ")$."], why: "$\\frac{1}{3}(" + r * r * hh + ") = " + r * r * hh / 3 + "$, so $V = " + r * r * hh / 3 + "\\pi$." }; }
        var a = R.int(2, 6), b = R.int(2, 7), h3 = 3 * R.int(1, 4);
        return { type: "num", prompt: "A pyramid has a rectangular base " + a + " by " + b + " and a height of " + h3 + ". Find its volume.", answer: a * b * h3 / 3,
          near: near(a * b * h3 / 3, [{ v: a * b * h3, fb: "That is the prism. A pyramid is one third of it." }]), hints: ["$B = " + a * b + "$.", "$V = \\frac{1}{3}(" + a * b + ")(" + h3 + ")$."], why: "$\\frac{1}{3}(" + a * b * h3 + ") = " + a * b * h3 / 3 + "$." };
      } },
    { id: "hg10-sphere", title: "Spheres", lesson: 9,
      gen: function (R) {
        var k = R.int(0, 3), r = R.int(1, 9);
        if (k === 0) { var dia = R.chance(0.4);
          return { type: "num", prompt: "A sphere has a " + (dia ? "diameter of " + 2 * r : "radius of " + r) + ". Find its surface area. Type the number in front of $\\pi$.", post: PI_POST, answer: 4 * r * r,
            near: near(4 * r * r, [{ v: r * r, fb: "That is one great circle. The surface is four of them." }, { v: 16 * r * r, fb: "Use the radius, " + r + ", not the diameter." }]), hints: ["$S = 4\\pi r^2$, with $r = " + r + "$."], why: "$4 \\cdot " + r * r + " = " + 4 * r * r + "$, so $S = " + 4 * r * r + "\\pi$." }; }
        if (k === 1) { var r3 = 3 * R.int(1, 3);
          return { type: "num", prompt: "A sphere has a radius of " + r3 + ". Find its volume. Type the number in front of $\\pi$.", post: PI_POST, answer: 4 * r3 * r3 * r3 / 3,
            near: near(4 * r3 * r3 * r3 / 3, [{ v: 4 * r3 * r3, fb: "That is the surface area. The volume uses $r^3$." }, { v: 4 * r3 * r3 * r3, fb: "Divide by 3 as well: $\\frac{4}{3}$." }]), hints: ["$" + r3 + "^3 = " + r3 * r3 * r3 + "$.", "$\\frac{4}{3}(" + r3 * r3 * r3 + ")$."], why: "$\\frac{4}{3}(" + r3 * r3 * r3 + ") = " + 4 * r3 * r3 * r3 / 3 + "$, so $V = " + 4 * r3 * r3 * r3 / 3 + "\\pi$." }; }
        if (k === 2) return { type: "num", prompt: "A sphere has a surface area of $" + 4 * r * r + "\\pi$. Find its radius.", answer: r,
          near: near(r, [{ v: r * r, fb: "That is $r^2$. Take the square root." }]), hints: ["$4\\pi r^2 = " + 4 * r * r + "\\pi$, so $r^2 = " + r * r + "$."], why: "$r = \\sqrt{" + r * r + "} = " + r + "$." };
        var f = R.int(2, 4), vol = R.chance(0.5);
        return { type: "num", prompt: "The radius of a sphere is multiplied by " + f + ". Its " + (vol ? "volume" : "surface area") + " is multiplied by what number?", answer: vol ? f * f * f : f * f,
          near: near(vol ? f * f * f : f * f, [{ v: vol ? f * f : f * f * f, fb: vol ? "That is the change in surface area. Volume is multiplied by $k^3$." : "That is the change in volume. Surface area is multiplied by $k^2$." }, { v: f, fb: "The radius is multiplied by " + f + ", but it is " + (vol ? "cubed" : "squared") + " in the formula." }]),
          hints: [vol ? "$(kr)^3 = k^3 r^3$." : "$(kr)^2 = k^2 r^2$."], why: "$" + f + (vol ? "^3" : "^2") + " = " + (vol ? f * f * f : f * f) + "$." };
      } }
  ];
  L.unit("geo", 10, {
    title: "Spatial Reasoning",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Solids, their views, and formulas in three dimensions.",
        skills: ["hg10-classify", "hg10-views", "hg10-euler"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Surface area of prisms, cylinders, pyramids and cones.",
        skills: ["hg10-sa-prism", "hg10-sa-pyramid"], per: 3 },
      { title: "Quiz 3", after: 9, blurb: "Volume of prisms, cylinders, pyramids and cones, and spheres.",
        skills: ["hg10-vol-prism", "hg10-vol-pyramid", "hg10-sphere"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:10", {
    2: { name: "Solids", frame: "A [[prism]] has two parallel congruent bases. A [[pyramid]] has one base and a vertex. A [[net]] is a solid unfolded flat, and a [[cross section]] is the face left by a straight cut.",
         chips: ["sphere", "diagonal"] },
    3: { name: "Drawing solids", frame: "An [[orthographic]] drawing shows the top, front and side views. An [[isometric]] drawing shows three faces at once. In a [[perspective]] drawing, parallel edges meet at a vanishing point.",
         chips: ["oblique", "congruent"] },
    4: { name: "Formulas in three dimensions", frame: "For a polyhedron, $V - E + F = $ [[2]]. The diagonal of a box is the square root of the [[sum]] of the squares of its [[three]] dimensions.",
         chips: ["0", "two"] },
    5: { name: "Surface area: prisms and cylinders", frame: "The lateral area of a prism is the [[perimeter]] of the base times the [[height]]. The surface area adds [[two]] bases.",
         chips: ["one", "area"] },
    6: { name: "Surface area: pyramids and cones", frame: "The lateral area of a regular pyramid is half the perimeter times the [[slant]] height. A cone's is [[πrℓ]]. Each has only [[one]] base.",
         chips: ["two", "2πrh"] },
    7: { name: "Volume: prisms and cylinders", frame: "The volume of a prism or a cylinder is the area of the [[base]] times the [[height]]. Multiplying every dimension by $k$ multiplies the volume by [[k³]].",
         chips: ["k²", "perimeter"] },
    8: { name: "Volume: pyramids and cones", frame: "A pyramid or a cone holds one [[third]] of the prism or cylinder with the same base and height. Use the [[height]], not the [[slant]] height.",
         chips: ["half", "radius"] },
    9: { name: "Spheres", frame: "A sphere's volume is four thirds of π times the radius [[cubed]]. Its surface area is [[4πr²]]. Half a sphere is a [[hemisphere]].",
         chips: ["squared", "2πr"] }
  });
})();
