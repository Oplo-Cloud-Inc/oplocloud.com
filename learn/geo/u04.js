/* ==========================================================================
   Geometry — Unit 4: Congruent Triangles. See lab/core.js for the format and
   lab/geotools.js for the drawing kit.

   Follows CK-12 Geometry (CK-12 Foundation, CC BY-SA), Chapter 4, section
   for section (4.1 to 4.8), after a readiness check. The sentences,
   examples, figures and questions are OEdu's own; the order and the ideas are
   the book's.

   Triangle sums and exterior angles (4.1), congruent figures (4.2), SSS
   (4.3), ASA and AAS (4.4), SAS and HL (4.5), using congruent triangles:
   CPCTC (4.6), isosceles and equilateral triangles (4.7), and congruence
   transformations (4.8). Figures mark congruent sides with ticks and
   congruent angles with arcs (shapes / polyItems). Classifying triangles is
   in Unit 1 (1.6), where the book puts it.

   Lessons carry v: 5, so a record kept from the Holt-based Unit 4 (v 4) does
   not mark these done. Skills are hg4-…

   Nine lessons, seven skills, three quizzes, and the unit test.
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

  /* ---- Hands-on helpers for the triangle lessons. */
  // The three angles of a triangle in whole degrees that add to exactly 180 (the largest remainders get the extra degree).
  function angles3(A, B, C) {
    var raw = [GT.angle(B, A, C), GT.angle(A, B, C), GT.angle(A, C, B)], fl = raw.map(Math.floor), left = 180 - fl[0] - fl[1] - fl[2];
    raw.map(function (v, i) { return [v - fl[i], i]; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, Math.max(0, left)).forEach(function (z) { fl[z[1]]++; });
    return fl;
  }
  function area3(A, B, C) { return Math.abs(crossOf(A, B, C)) / 2; }
  // A copy of a triangle you can slide (drag A′), turn (the slider) and flip (the button), and a ghost it has to cover.
  function fitMove(P, s) {
    var rot = s.p.rot * Math.PI / 180, c = Math.cos(rot), sn = Math.sin(rot), f = s.c.flip === "yes" ? -1 : 1;
    return P.map(function (p) { var x = f * (p[0] - P[0][0]), y = p[1] - P[0][1]; return [s.Q[0] + x * c - y * sn, s.Q[1] + x * sn + y * c]; });
  }
  function fitsOk(M, T) { return M.every(function (p, i) { return GT.dist(p, T[i]) < 0.2; }); }
  function fitScene(P, T, o) {
    o = o || {};
    return { type: "sketch", x: o.x || [-1, 11], y: o.y || [-1, 6.5], u: o.u || 44, grid: false, gate: true,
      pts: { Q: { at: o.start || [1, 4.5], drag: true, snap: 0.5, c: "orange", say: "Corner A′: drag to slide the copy" } },
      params: { rot: { min: -180, max: 180, step: 15, v: o.rot0 || 0, label: "turn", show: function (v) { return "$" + v + "°$"; } } },
      chips: { flip: { v: "no", opts: [["no", "Not flipped"], ["yes", "Flipped over"]] } },
      draw: function (s) {
        var M = fitMove(P, s), ok = fitsOk(M, T);
        return [{ poly: T, c: "soft", dash: true, names: o.tnames || ["D", "E", "F"] }, { poly: M, c: ok ? "green" : "blue", fill: true, names: ["A′", "B′", "C′"] }];
      },
      readout: function (s) { return fitsOk(fitMove(P, s), T) ? "**It fits.** Every corner lands on its partner, so the two triangles are **congruent**." : "Slide, turn or flip the blue copy until it covers the dashed triangle exactly."; },
      goal: function (s) { return fitsOk(fitMove(P, s), T); } };
  }
  var T_RT = [[0, 0], [3.6, 0], [0, 2.6]];
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
    blurb: "Before Chapter 4 · Kinds of angle, equations, and distance and midpoint.",
    mins: 6, v: 5,
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
  /* ================================================== 4.1 · Triangle sums */
  var HOW_4_1 = [["Sum", "The three angle measures of a triangle add to 180°."],
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
    title: "Triangle sums", art: "sum",
    blurb: "Section 4.1 · The angles of a triangle add up to 180°, and an exterior angle equals the sum of the two remote interior angles.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $x + 62 + 48 = 180$.", pre: "$x =$", answer: 70, skill: "Solve an equation",
        near: [{ v: 110, fb: "That is $62 + 48$. Subtract it from 180." }], hints: ["$x + 110 = 180$."], why: "$180 - 110 = 70$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the corners of $\\triangle ABC$ into **any** shape. Look at the three angles each time, and add them up. Try at least three different triangles.",
        scene: { type: "sketch", x: [-1, 11], y: [-0.5, 6.5], u: 46, grid: false, gate: true,
          pts: { A: { at: [1, 0.8], drag: true, snap: 0.1, say: "Corner A" }, B: { at: [9, 0.8], drag: true, snap: 0.1, say: "Corner B" }, C: { at: [4.5, 5], drag: true, snap: 0.1, c: "orange", say: "Corner C" } },
          draw: function (s) {
            var a = angles3(s.A, s.B, s.C), ok = area3(s.A, s.B, s.C) > 0.4;
            return ok ? [{ poly: [s.A, s.B, s.C], c: "blue", fill: true }, { angle: [s.B, s.A, s.C], say: a[0] + "°", r: 30, c: "orange" }, { angle: [s.C, s.B, s.A], say: a[1] + "°", r: 30, c: "green" }, { angle: [s.A, s.C, s.B], say: a[2] + "°", r: 30, c: "purple" },
              { pt: s.A, name: "A", at: "sw" }, { pt: s.B, name: "B", at: "se" }, { pt: s.C, name: "C", at: "n", c: "orange" }] : [{ pt: s.A, name: "A", at: "sw" }, { pt: s.B, name: "B", at: "se" }, { pt: s.C, name: "C", at: "n" }];
          },
          readout: function (s) { var a = angles3(s.A, s.B, s.C); return area3(s.A, s.B, s.C) > 0.4 ? "$" + a[0] + "° + " + a[1] + "° + " + a[2] + "° = 180°$" : "The three corners are almost in a line: pull one away."; },
          log: { need: 3, when: function (s) { return area3(s.A, s.B, s.C) > 0.4; }, cols: [{ h: "$\\angle A$", f: function (s) { return "$" + angles3(s.A, s.B, s.C)[0] + "°$"; } }, { h: "$\\angle B$", f: function (s) { return "$" + angles3(s.A, s.B, s.C)[1] + "°$"; } },
            { h: "$\\angle C$", f: function (s) { return "$" + angles3(s.A, s.B, s.C)[2] + "°$"; } }, { h: "sum", f: function () { return "$180°$"; } }] } },
        then: "However you stretch it, the three angles add up to **180°**: the **Triangle Sum Theorem**. A conjecture from examples becomes a theorem when it is proved." },
      { type: "learn", kicker: "Explore",
        prompt: "Side $\\overline{AB}$ is extended past $B$. Drag $C$ and compare the **exterior angle** with the two angles of the triangle that are **not** next to it.",
        scene: { type: "sketch", x: [-1, 12], y: [-0.5, 6.5], u: 44, grid: false, gate: true,
          pts: { C: { at: [7.5, 4.5], drag: true, snap: 0.1, c: "orange", on: { fn: function (p) { return [Math.round(p[0] * 10) / 10, Math.max(0.8, Math.round(p[1] * 10) / 10)]; } }, say: "Corner C" } },
          draw: function (s) {
            var A = [1, 0.5], B = [7, 0.5], D = [11, 0.5], C = s.C, a = angles3(A, B, C), ext = 180 - a[1];
            return [{ poly: [A, B, C], c: "blue", fill: true }, { dline: [B, D], ray: true }, { angle: [B, A, C], say: a[0] + "°", r: 30, c: "orange" }, { angle: [A, C, B], say: a[2] + "°", r: 28, c: "purple" },
              { angle: [D, B, C], say: ext + "°", r: 36, c: "green" }, { pt: A, name: "A", at: "sw" }, { pt: B, name: "B", at: "s" }, { pt: C, name: "C", at: "n", c: "orange" }];
          },
          readout: function (s) { var a = angles3([1, 0.5], [7, 0.5], s.C); return "exterior angle $= " + (180 - a[1]) + "°$ · remote angles $" + a[0] + "° + " + a[2] + "° = " + (a[0] + a[2]) + "°$"; },
          log: { need: 3, cols: [{ h: "$\\angle A$", f: function (s) { return "$" + angles3([1, 0.5], [7, 0.5], s.C)[0] + "°$"; } }, { h: "$\\angle C$", f: function (s) { return "$" + angles3([1, 0.5], [7, 0.5], s.C)[2] + "°$"; } },
            { h: "$\\angle A + \\angle C$", f: function (s) { var a = angles3([1, 0.5], [7, 0.5], s.C); return "$" + (a[0] + a[2]) + "°$"; } }, { h: "exterior", f: function (s) { return "$" + (180 - angles3([1, 0.5], [7, 0.5], s.C)[1]) + "°$"; } }] } },
        then: "The exterior angle always equals the sum of the two **remote interior** angles: the **Exterior Angle Theorem**. It is the triangle sum and a linear pair, working together." },
      { type: "learn", kicker: "The idea",
        prompt: "**Triangle Sum Theorem:** the angle measures of a triangle add to 180°. Why? Draw a line through one vertex, parallel to the opposite side. Alternate interior angles carry the other two angles up beside the third, and the three fill a straight line.",
        scene: { type: "method", how: HOW_4_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the third angle found.",
        scene: { type: "walk", how: HOW_4_1, rows: [
          { step: 1, m: "m\\angle A + m\\angle B + m\\angle C = 180°", say: "The Triangle Sum Theorem.", fig: FIG_SUM },
          { step: 2, m: "47 + 68 + x = 180", say: "Put in the two measures you know." },
          { step: 3, m: "115 + x = 180", say: "Add the two.",
            ask: { prompt: "What is $47 + 68$?", answer: 0,
                   options: [{ t: "115" }, { t: "105", fb: "$40 + 60 = 100$ and $7 + 8 = 15$." }] } },
          { step: 3, m: "x = 65", say: "Check: $47 + 68 + 65 = 180$." }] },
        gate: true, then: "Two angles always give you the third." },
      { type: "guided", kicker: "Together",
        prompt: "Now you. Find $x$, and then the angle at $E$.", art: FIG_SUMX,
        how: HOW_4_1, skill: "Triangle Sum Theorem",
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
  /* ============================================== 4.2 · Congruent figures */
  var HOW_4_2 = [["Order", "Read the congruence statement. The order of the letters tells you which vertices match."],
                 ["Angles", "Match the angles: first letter with first, second with second, third with third."],
                 ["Sides", "Match the sides the same way: the first two letters with the first two letters, and so on."]];
  var FIG_CONG = twoTris("ABC", "DEF", {}, {}, "Two triangles of the same size and shape, ABC and DEF."),
      FIG_PQR = twoTris("PQR", "XYZ", { sides: ["9"], angs: [null, "45°"] }, {}, "Two triangles of the same size and shape, PQR and XYZ. PQ is 9 and the angle at Q is 45 degrees."),
      FIG_KITE6 = kite([1.6, 1.9], { ticks: [0, 2, 1] }, null, "Kite ABCD with diagonal BD. AB and CB each carry one tick mark. AD and CD each carry two.", "BADC");
  var P42 = [[0, 0], [3, 0], [1, 2]], T42 = fitMove(P42, { Q: [8, 2.5], p: { rot: 90 }, c: { flip: "yes" } });
  LESSONS.push({
    title: "Congruent figures", art: "cfig",
    blurb: "Section 4.2 · Figures that match exactly, the congruence statement, and the corresponding parts.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$\\overline{AB} \\cong \\overline{CD}$ and $AB = 7$. What is $CD$?", answer: 7, skill: "Congruent segments",
        hints: ["Congruent segments have equal lengths."], why: "Congruent segments have the same length." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue triangle is a copy of $\\triangle ABC$. **Slide** it (drag $A′$), **turn** it (the slider) and **flip** it (the button) until it covers the dashed triangle $DEF$ exactly.",
        scene: fitScene(P42, T42, { start: [1, 4.5] }) },
      { type: "learn", kicker: "The idea",
        prompt: "Two triangles are **congruent** when all three pairs of **corresponding sides** and all three pairs of **corresponding angles** are congruent. The statement $\\triangle ABC \\cong \\triangle DEF$ lists the vertices in matching order: $A$ with $D$, $B$ with $E$, $C$ with $F$.",
        scene: { type: "method", how: HOW_4_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the six pairs of corresponding parts read from $\\triangle ABC \\cong \\triangle DEF$.",
        scene: { type: "walk", how: HOW_4_2, rows: [
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
        how: HOW_4_2, skill: "Corresponding parts",
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
  /* ============================================ 4.3 · Triangle congruence: SSS */
  var HOW_4_3 = [["Mark", "Mark the three pairs of congruent sides: the given ones, and any side the two triangles share."],
                 ["Match", "Check that all three pairs are **corresponding** sides."],
                 ["Say", "State SSS, and write the congruence with the corners in matching order."]];
  var HOW_4_3C = [["Label", "Name the corners of each triangle and find all three side lengths."],
                  ["Compare", "Put the lengths in order and compare them pair by pair."],
                  ["Say", "If all three match, state SSS and write the congruence."]];
  var FIG_SSS = kite([1.8, 2], { ticks: [0, 2, 1] }, null, "Triangles ABC and ADC share side AC. AB and AD carry one tick mark each, and CB and CD carry two.");
  var FIG_SSS2 = twoTris("ABC", "DEF", { ticks: [1, 2, 3] }, null, "Triangles ABC and DEF. Their three pairs of sides carry one, two and three tick marks.");
  var SQ43 = { A: [0, 0], B: [4, 0], C: [0, 3] }, SQ43b = { D: [1, 1], E: [5, 1], F: [1, 4] };
  var STICK43 = { ab: 5, ac: 4.5, bc: 3 };
  // The two places the corner C can be when AB = 5, AC = 4.5 and BC = 3: above or below the base.
  function apex43(A, B, up) {
    var d = GT.dist(A, B), x = (STICK43.ac * STICK43.ac - STICK43.bc * STICK43.bc + d * d) / (2 * d), h = Math.sqrt(STICK43.ac * STICK43.ac - x * x), ux = (B[0] - A[0]) / d, uy = (B[1] - A[1]) / d, k = up ? 1 : -1;
    return [A[0] + x * ux - k * h * uy, A[1] + x * uy + k * h * ux];
  }
  LESSONS.push({
    title: "Triangle congruence: SSS", art: "sss",
    blurb: "Section 4.3 · Three pairs of congruent sides are enough to make two triangles congruent: the SSS Postulate.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "You have three sticks, 3 cm, 4 cm and 5 cm, and join their ends to make a triangle. How many **different** triangles can you make?",
        options: [{ t: "Only one shape: any other is the same triangle turned or flipped" }, { t: "Many", fb: "Try bending it: the sticks are straight, and the ends are joined, so nothing can move." }, { t: "None", fb: "3 + 4 > 5, so the three sticks do reach round." }],
        answer: 0, skill: "SSS", hints: ["Could you change an angle without changing a side?"], why: "Three sides fix the triangle completely." },
      { type: "learn", kicker: "Explore",
        prompt: "$\\overline{AB}$ is fixed at 5. The two other sticks have lengths 4.5 and 3. Drag $C$, and try the other button too. Which can **change shape**?",
        scene: { type: "sketch", x: [-1, 11], y: [-4.2, 5], u: 42, grid: false, gate: true,
          pts: { C: { at: apex43([1, 0.5], [6, 0.5], true), drag: true, c: "orange", on: { fn: function (p, s) {
            var A = [1, 0.5], B = [6, 0.5];
            if (s.c.kind === "quad") { var a = Math.atan2(p[1] - B[1], p[0] - B[0]); return [B[0] + 3 * Math.cos(a), B[1] + 3 * Math.sin(a)]; }
            var up = apex43(A, B, true), dn = apex43(A, B, false); return GT.dist(p, up) < GT.dist(p, dn) ? up : dn;
          } }, say: "Corner C" } },
          chips: { kind: { v: "tri", opts: [["tri", "Three sticks (a triangle)"], ["quad", "Four sticks (a four-sided shape)"]] } },
          draw: function (s) {
            var A = [1, 0.5], B = [6, 0.5], C = s.C, items;
            if (s.c.kind === "tri") items = [{ poly: [A, B, C], c: "blue", fill: true }, { len: "5", seg: [A, B], side: 1, off: 16 }, { len: "3", seg: [B, C], side: -1, off: 14 }, { len: "4.5", seg: [C, A], side: -1, off: 14 }];
            else { var D = [C[0] + A[0] - B[0], C[1] + A[1] - B[1]]; items = [{ poly: [A, B, C, D], c: "purple", fill: true }, { len: "5", seg: [A, B], side: 1, off: 16 }, { len: "3", seg: [B, C], side: -1, off: 14 }, { len: "5", seg: [C, D], side: -1, off: 14 }, { len: "3", seg: [D, A], side: 1, off: 14 }, { pt: D, name: "D", at: "n" }]; }
            return items.concat([{ pt: A, name: "A", at: "sw" }, { pt: B, name: "B", at: "se" }, { pt: C, name: "C", at: "n", c: "orange" }]);
          },
          readout: function (s) { return s.c.kind === "tri" ? "**Three sticks: the triangle is rigid.** Drag as you like: the corner can only flip to the other side of $\\overline{AB}$." : "**Four sticks: the shape wobbles.** The side lengths stay the same, but the angles change."; },
          goal: function (s) { return Object.keys(s.seen.kind).length >= 2 && s.moved; } },
        then: "With sides fixed, a triangle cannot change its shape. That is why triangles brace bridges and gates, and why **three pairs of congruent sides** are enough: the **SSS Postulate**." },
      { type: "learn", kicker: "The idea",
        prompt: "**SSS:** if three sides of one triangle are congruent to three sides of another, the triangles are congruent. The sides must be **corresponding**: the shortest to the shortest, the longest to the longest. A side the two triangles share counts as one pair, by the **Reflexive Property**.",
        scene: { type: "method", how: HOW_4_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Given: $\\overline{AB} \\cong \\overline{AD}$ and $\\overline{CB} \\cong \\overline{CD}$. Prove: $\\triangle ABC \\cong \\triangle ADC$. Watch SSS used.",
        scene: { type: "walk", how: HOW_4_3, rows: [
          { step: 1, m: "\\overline{AB} \\cong \\overline{AD} \\qquad \\overline{CB} \\cong \\overline{CD}", say: "Two pairs are given: the tick marks show them.", fig: FIG_SSS },
          { step: 1, m: "\\overline{AC} \\cong \\overline{AC}", say: "The third pair is the side the two triangles **share**. Reflexive Property.",
            ask: { prompt: "Which side do the two triangles share?", answer: 0, options: [{ t: "$\\overline{AC}$" }, { t: "$\\overline{BD}$", fb: "$\\overline{BD}$ is not a side of either triangle." }] } },
          { step: 2, m: "AB \\leftrightarrow AD \\quad CB \\leftrightarrow CD \\quad AC \\leftrightarrow AC", say: "Each pair matches the same place in both triangles." },
          { step: 3, m: "\\triangle ABC \\cong \\triangle ADC", say: "SSS. The corners are written in matching order." }] },
        gate: true, then: "Three pairs of congruent sides: SSS." },
      { type: "guided", kicker: "Together",
        prompt: "In these two triangles the tick marks show congruent sides. Now you decide whether they must be congruent.", art: FIG_SSS2,
        how: HOW_4_3, skill: "SSS",
        steps: [
          { step: 1, ask: "How many pairs of congruent sides do the tick marks show?", type: "num", answer: 3, near: [{ v: 2, fb: "Count the three different tick patterns: one, two and three." }], hint: "One tick, two ticks, three ticks.",
            m: "3 \\text{ pairs}", say: "Three pairs: one, two and three ticks." },
          { step: 2, ask: "Are the sides matched in the same places in both triangles?", type: "choice", answer: 0,
            options: [{ t: "Yes: each tick pattern is in the same place in both" }, { t: "No", fb: "Each pair of ticks sits on the matching side of each triangle." }],
            m: "AB \\leftrightarrow DE \\quad BC \\leftrightarrow EF \\quad CA \\leftrightarrow FD", say: "Corresponding sides." },
          { step: 3, ask: "Which statement is right?", type: "choice", answer: 0,
            options: [{ t: "$\\triangle ABC \\cong \\triangle DEF$ by SSS" }, { t: "$\\triangle ABC \\cong \\triangle FED$ by SSS", fb: "The corners must be listed in matching order: $A$ with $D$, $B$ with $E$, $C$ with $F$." }],
            m: "\\triangle ABC \\cong \\triangle DEF", say: "SSS, with the corners in matching order." }],
        why: "Mark, match, say. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$\\triangle ABC \\cong \\triangle DEF$ by SSS. $AB = 2x + 3$ and $DE = 13$. Find $x$.", answer: 5, skill: "SSS",
        near: [{ v: 8, fb: "Subtract 3 first: $2x = 10$." }], hints: ["Corresponding sides are equal: $2x + 3 = 13$."], why: "$2x = 10$, so $x = 5$." },
      { type: "sort", prompt: "Each card says what is known about two triangles. Does it give **SSS**?",
        bins: ["SSS", "Not SSS"],
        cards: [{ t: "Three pairs of congruent sides", bin: 0, fb: "That is exactly SSS." }, { t: "Two pairs of sides and one pair of angles", bin: 1, fb: "That is a different test." }, { t: "Three pairs of congruent angles", bin: 1, fb: "Equal angles say nothing about size." },
                { t: "Two pairs of congruent sides and a shared third side", bin: 0, fb: "The shared side is the third pair." }, { t: "Sides 5, 7, 9 in one and 9, 5, 7 in the other", bin: 0, fb: "The same three lengths, in a different order: they still match up." }],
        skill: "SSS", hints: ["Count the pairs of congruent **sides**."], why: "SSS needs three pairs of congruent sides, and nothing else." },
      { type: "learn", kicker: "A harder case",
        prompt: "SSS can be checked with coordinates. $A(0, 0)$, $B(4, 0)$, $C(0, 3)$ and $D(1, 1)$, $E(5, 1)$, $F(1, 4)$. Are the triangles congruent?",
        scene: { type: "walk", how: HOW_4_3C, rows: [
          { step: 1, m: "AB = 4 \\quad BC = \\sqrt{16 + 9} = 5 \\quad CA = 3", say: "A horizontal side, a vertical side, and the slanted one by the distance formula.",
            fig: grid([-1, 7], [-1, 6], [{ poly: [[0, 0], [4, 0], [0, 3]], names: "ABC", c: "blue" }, { poly: [[1, 1], [5, 1], [1, 4]], names: "DEF", c: "green" }], { u: 28, alt: "Triangle ABC with corners (0, 0), (4, 0) and (0, 3), and triangle DEF with corners (1, 1), (5, 1) and (1, 4)." }) },
          { step: 1, m: "DE = 4 \\quad EF = \\sqrt{16 + 9} = 5 \\quad FD = 3", say: "The same three calculations for the second triangle.",
            ask: { prompt: "What is $EF$?", answer: 0, options: [{ t: "5" }, { t: "7", fb: "Square the differences, add, then take the root: $\\sqrt{16 + 9}$." }] } },
          { step: 2, m: "4 = 4 \\quad 5 = 5 \\quad 3 = 3", say: "The three lengths match pair by pair." },
          { step: 3, m: "\\triangle ABC \\cong \\triangle DEF", say: "SSS: the second triangle is the first one moved 1 right and 1 up." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A gate is a rectangle with a hinge on each side, so it can sag into a parallelogram. A diagonal brace is added. Why does the brace stop it?",
        options: [{ t: "The brace makes two triangles, and a triangle with fixed sides cannot change shape (SSS)" }, { t: "The brace is heavy", fb: "Weight is not the reason. The brace makes the shape rigid." }, { t: "The brace makes the sides longer", fb: "The sides stay the same length." }],
        answer: 0, skill: "SSS", hints: ["Think of the sticks in the Explore."], why: "Two triangles with fixed sides are rigid, so the gate cannot sag." },
      { type: "choice", kicker: "Find the error",
        prompt: "$\\triangle PQR$ has sides 3, 4 and 5. $\\triangle XYZ$ has sides 3, 4 and 6. Mia says they are congruent by SSS. What is wrong?",
        options: [{ t: "Only two pairs of sides match. SSS needs all three: 5 and 6 are different." }, { t: "The sides must be in order, but they are.", fb: "Order is fine. The third pair simply is not equal." }, { t: "Nothing. It is right.", fb: "5 is not 6, so the third pair does not match." }],
        answer: 0, skill: "SSS", hints: ["Compare the longest sides."], why: "Two matching pairs are not enough: the third pair fails." },
      { type: "num", kicker: "Use it", prompt: "Two roof trusses are triangles with sides of 6 m, 6 m and 8 m. The first has a vertical post 4.47 m tall at the middle. How tall is the post on the second truss, which is congruent to it?", post: "m", answer: 4.47, tol: 0.01, skill: "SSS",
        near: [{ v: 8, fb: "That is the base. The post is the height at the middle." }], hints: ["Congruent triangles have congruent heights."], why: "The two trusses are congruent by SSS, so the matching posts are the same height: 4.47 m." }
    ]
  });
  /* ======================================= 4.4 · Triangle congruence: ASA and AAS */
  var HOW_4_4 = [["Mark", "Mark the two pairs of congruent angles and the one pair of congruent sides."],
                 ["Place", "Is the side **between** the two angles (ASA), or **not** between them (AAS)?"],
                 ["Say", "State ASA or AAS, and write the congruence with the corners in matching order."]];
  var FIG_ASA = kite([1.8, 2], { arcs: [1, 2, 0] }, null, "Triangles ABC and ADC share side AC. The angles at A and C are each marked as equal in the two triangles, with one arc at A and two at C.");
  var FIG_ASA2 = twoTris("ABC", "DEF", { arcs: [1, 2, 0], ticks: [1, 0, 0] }, null, "Triangles ABC and DEF. The angles at A and B carry one and two arcs, and side AB carries one tick mark. In DEF, the same marks sit on D, E and DE.");
  var FIG_AAS = twoTris("ABC", "DEF", { arcs: [1, 2, 0], ticks: [0, 0, 1] }, null, "Triangles ABC and DEF. The angles at A and B carry one and two arcs, and side CA carries one tick mark. In DEF, the same marks sit on D, E and FD.");
  var G44 = { a: 50, b: 60, ab: 5 };
  function apex44(al, be) {
    var a = al * Math.PI / 180, b = be * Math.PI / 180, t = G44.ab * Math.sin(b) / Math.sin(a + b);
    return [t * Math.cos(a), t * Math.sin(a)];
  }
  LESSONS.push({
    title: "Triangle congruence: ASA and AAS", art: "asa",
    blurb: "Section 4.4 · Two angles and the side between them (ASA), or two angles and a side that is not between them (AAS).",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In $\\triangle ABC$, which side lies **between** $\\angle A$ and $\\angle B$?",
        options: [{ t: "$\\overline{AB}$" }, { t: "$\\overline{BC}$", fb: "$\\overline{BC}$ touches $\\angle B$ and $\\angle C$." }, { t: "$\\overline{CA}$", fb: "$\\overline{CA}$ touches $\\angle C$ and $\\angle A$." }],
        answer: 0, skill: "Included side", hints: ["It joins the two corners."], why: "$\\overline{AB}$ joins $A$ and $B$." },
      { type: "learn", kicker: "Explore",
        prompt: "$\\overline{AB}$ is fixed at 5. Slide the two angles, $\\alpha$ at $A$ and $\\beta$ at $B$, until your blue triangle covers the dashed one. How much freedom do you have?",
        scene: { type: "sketch", x: [-1.5, 8], y: [-0.8, 5], u: 54, grid: false, gate: true,
          params: { al: { min: 20, max: 100, step: 5, v: 75, label: "angle at $A$", show: function (v) { return "$" + v + "°$"; } }, be: { min: 20, max: 100, step: 5, v: 40, label: "angle at $B$", show: function (v) { return "$" + v + "°$"; } } },
          draw: function (s) {
            var A = [0, 0], B = [5, 0], C = apex44(s.p.al, s.p.be), fit = s.p.al === G44.a && s.p.be === G44.b, C0 = apex44(G44.a, G44.b);
            return [{ poly: [A, B, C0], c: "soft", dash: true }, { poly: [A, B, C], c: fit ? "green" : "blue", fill: true }, { angle: [B, A, C], say: s.p.al + "°", r: 34, c: "orange" }, { angle: [C, B, A], say: s.p.be + "°", r: 34, c: "purple" },
              { pt: A, name: "A", at: "sw" }, { pt: B, name: "B", at: "se" }, { pt: C, name: "C", at: "n" }];
          },
          readout: function (s) {
            var g = 180 - s.p.al - s.p.be;
            return "$\\angle A = " + s.p.al + "°$ · $\\angle B = " + s.p.be + "°$ · so $\\angle C = 180° - " + s.p.al + "° - " + s.p.be + "° = " + g + "°$" + (s.p.al === G44.a && s.p.be === G44.b ? "<br>**It fits.** Nothing else covers the dashed triangle." : "");
          },
          goal: function (s) { return s.p.al === G44.a && s.p.be === G44.b; } },
        then: "Two angles and the side **between** them fix the triangle: that is **ASA**. And the third angle is forced ($180°$ minus the other two), so two angles and **any** side do too: that is **AAS**." },
      { type: "learn", kicker: "The idea",
        prompt: "**ASA:** two angles and the **included side** (the side between them) of one triangle are congruent to those of another. **AAS:** two angles and a side that is **not** between them. Both prove the triangles congruent: the third angles must match too.",
        scene: { type: "method", how: HOW_4_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Given: $\\overline{AC}$ bisects $\\angle BAD$ and $\\angle BCD$. Prove: $\\triangle ABC \\cong \\triangle ADC$. Watch ASA used.",
        scene: { type: "walk", how: HOW_4_4, rows: [
          { step: 1, m: "\\angle BAC \\cong \\angle DAC \\qquad \\angle BCA \\cong \\angle DCA", say: "A bisector cuts an angle into two congruent angles: two pairs, marked with arcs.", fig: FIG_ASA },
          { step: 1, m: "\\overline{AC} \\cong \\overline{AC}", say: "The two triangles share $\\overline{AC}$. Reflexive Property." },
          { step: 2, m: "\\overline{AC} \\text{ is between } \\angle A \\text{ and } \\angle C", say: "The shared side joins the two marked corners.",
            ask: { prompt: "Is the shared side between the two marked angles?", answer: 0, options: [{ t: "Yes: it joins $A$ and $C$" }, { t: "No", fb: "The two marked corners are $A$ and $C$, and $\\overline{AC}$ runs between them." }] } },
          { step: 3, m: "\\triangle ABC \\cong \\triangle ADC", say: "ASA." }] },
        gate: true, then: "Angle, **side between**, angle: ASA." },
      { type: "guided", kicker: "Together",
        prompt: "In these two triangles the marks show congruent parts. Now you decide which rule proves them congruent.", art: FIG_AAS,
        how: HOW_4_4, skill: "ASA and AAS",
        steps: [
          { step: 1, ask: "Which parts are marked as congruent?", type: "choice", answer: 0,
            options: [{ t: "Two angles ($A$ and $B$) and the side $\\overline{CA}$" }, { t: "Two sides and an angle", fb: "Count the arcs and the ticks: two arcs and one tick." }],
            m: "\\angle A \\cong \\angle D \\quad \\angle B \\cong \\angle E \\quad \\overline{CA} \\cong \\overline{FD}", say: "Two angles and one side." },
          { step: 2, ask: "Is $\\overline{CA}$ between $\\angle A$ and $\\angle B$?", type: "choice", answer: 0,
            options: [{ t: "No: it joins $C$ and $A$" }, { t: "Yes", fb: "The side between $A$ and $B$ would be $\\overline{AB}$." }],
            m: "\\overline{CA} \\text{ is not between } A \\text{ and } B", say: "Not between the two marked corners." },
          { step: 3, ask: "So which rule is it?", type: "choice", answer: 0,
            options: [{ t: "AAS" }, { t: "ASA", fb: "ASA needs the side **between** the two angles." }],
            m: "\\triangle ABC \\cong \\triangle DEF \\text{ by AAS}", say: "Two angles and a side that is not between them: AAS." }],
        why: "Mark, place, say. Now two on your own." },
      { type: "slots", kicker: "On your own", prompt: "Match each description to its rule.",
        slots: [{ id: "asa", label: "ASA" }, { id: "aas", label: "AAS" }, { id: "no", label: "Not enough" }],
        cards: [{ t: nb("Two angles and the side **between** them"), slot: "asa", fb: "The included side." }, { t: nb("Two angles and a side **not** between them"), slot: "aas", fb: "A side that touches only one of the two angles." },
                { t: nb("Three angles and no side"), slot: "no", fb: "Equal angles can sit on triangles of different sizes." }],
        skill: "ASA and AAS", hints: ["Is the side between the angles?"], why: "Between: ASA. Not between: AAS. No side: not enough." },
      { type: "num", prompt: "In $\\triangle ABC$ and $\\triangle DEF$, $\\angle A \\cong \\angle D$ and $\\angle B \\cong \\angle E$. $m\\angle A = 50°$ and $m\\angle B = 64°$. Find $m\\angle F$.", post: "°", answer: 66, skill: "ASA and AAS",
        near: [{ v: 64, fb: "That is $m\\angle B$. Use the triangle sum: $\\angle C \\cong \\angle F$, and $\\angle C = 180 - 50 - 64$." }], hints: ["The third angles must match, too: $180 - 50 - 64$."], why: "$m\\angle C = 180 - 50 - 64 = 66$, and $\\angle F \\cong \\angle C$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Why is AAS as good as ASA? Given: $\\angle A \\cong \\angle D$, $\\angle B \\cong \\angle E$ and $\\overline{BC} \\cong \\overline{EF}$. Watch the AAS case turned into ASA.", art: FIG_AAS,
        scene: { type: "walk", how: [["Third", "Use the triangle sum to find the third pair of congruent angles."], ["Reshape", "Now two angles and the side between them are known."], ["Say", "Prove the triangles congruent."]], rows: [
          { step: 1, m: "\\angle C \\cong \\angle F", say: "Both are $180°$ minus two congruent angles: Third Angle Theorem." },
          { step: 2, m: "\\angle B, \\overline{BC}, \\angle C \\;\\text{ and }\\; \\angle E, \\overline{EF}, \\angle F", say: "$\\overline{BC}$ is between $\\angle B$ and $\\angle C$.",
            ask: { prompt: "Which pair of angles does $\\overline{BC}$ sit between?", answer: 0, options: [{ t: "$\\angle B$ and $\\angle C$" }, { t: "$\\angle A$ and $\\angle B$", fb: "$\\overline{AB}$ sits between those. $\\overline{BC}$ joins $B$ and $C$." }] } },
          { step: 3, m: "\\triangle ABC \\cong \\triangle DEF", say: "ASA. So AAS always works too." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which of these does **not** prove two triangles congruent?",
        options: [{ t: "Three pairs of congruent angles (AAA)" }, { t: "Two angles and an included side (ASA)", fb: "ASA does prove it." }, { t: "Two angles and a non-included side (AAS)", fb: "AAS does prove it." }],
        answer: 0, skill: "ASA and AAS", hints: ["Could one triangle be a bigger copy of the other?"], why: "AAA gives the same shape, but the size can differ." },
      { type: "choice", kicker: "Find the error",
        prompt: "Both triangles have a 50° angle, a 70° angle and a side of 6. Ben says they are congruent by ASA, but in one triangle the 6 is **opposite** the 50° angle, and in the other it is between the two angles. What is wrong?",
        options: [{ t: "The sides are not corresponding: the 6 is in a different place in each triangle." }, { t: "Nothing. ASA works.", fb: "ASA needs the side in the same place in both triangles." }, { t: "AAS would prove it.", fb: "AAS needs the side in the same place as well." }],
        answer: 0, skill: "ASA and AAS", hints: ["Are the equal sides corresponding?"], why: "The equal parts must be in matching positions. Here the 6 sits in a different place, so the triangles can differ." },
      { type: "choice", kicker: "Use it", prompt: "Two lookouts stand 100 m apart on a straight shore. Each measures the angle between the shore and the line of sight to a boat. Tia and Ravi stand at the same two places and measure the same two angles on another day. What can you say about the two boat positions?",
        options: [{ t: "They are the same place: the two triangles are congruent by ASA" }, { t: "They could be anywhere", fb: "Two angles and the side between them leave only one triangle." }, { t: "They are on the same line", fb: "Both are fixed by the two angles and the 100 m baseline." }],
        answer: 0, skill: "ASA and AAS", hints: ["Two angles and the side between them."], why: "ASA: the baseline and the two angles fix the triangle, so the boat can only be in one place." }
    ]
  });
  /* ========================================== 4.5 · Triangle congruence: SAS and HL */
  var HOW_4_5 = [["Mark", "Mark two pairs of congruent sides and the pair of congruent angles, or the hypotenuse and a leg of two right triangles."],
                 ["Place", "Is the angle **between** the two sides (SAS)? Are both triangles right triangles (HL)?"],
                 ["Say", "State SAS or HL, and write the congruence with the corners in matching order."]];
  var FIG_SAS5 = bowtie("ABECD", "Segments AD and BC cross at E. AE and DE carry one tick mark each, and BE and CE carry two.");
  var FIG_HL5 = twoTris("ABC", "DEF", { right: [1], ticks: [2, 0, 1] }, null, "Right triangles ABC and DEF, each with a right angle at its second corner. Leg AB carries two tick marks, and the hypotenuse CA carries one; the same in DEF.");
  var SSA5 = { A: [0, 0], C: [4.5 * Math.cos(40 * Math.PI / 180), 4.5 * Math.sin(40 * Math.PI / 180)] };
  var SSA5B = [[3.447 - 1.368, 0], [3.447 + 1.368, 0]];
  // "What fixes a triangle?": for each set of three parts, the triangles that can be built from them.
  function fix45(k) {
    var A = [0, 0], B = [5, 0], C = [2, 3], items = [], ok = true, say = "";
    function tri3(P, c, o) {
      o = o || {};
      items.push({ poly: P, c: c, fill: !o.dash, dash: o.dash });
      (o.ticks || []).forEach(function (t) { if (t[2]) items.push({ seg: [P[t[0]], P[t[1]]], marks: t[2], c: c }); });
      (o.arcs || []).forEach(function (a) { items.push({ amarks: [P[a[0]], P[a[1]], P[a[2]]], n: a[3], r: 22 }); });
    }
    var mv = function (P, dx) { return P.map(function (p) { return [p[0] + dx, p[1]]; }); };
    var flip = function (P, dx) { return P.map(function (p) { return [dx - p[0], p[1]]; }); };
    if (k === "sss") { tri3([A, B, C], "blue", { ticks: [[0, 1, 1], [1, 2, 2], [2, 0, 3]] }); tri3(flip([A, B, C], 12), "soft", { dash: true, ticks: [[0, 1, 1], [1, 2, 2], [2, 0, 3]] }); say = "**SSS.** Only one triangle has these three sides. Any other you build is the same one, flipped or turned."; }
    else if (k === "sas") { tri3([A, B, C], "blue", { ticks: [[0, 1, 1], [2, 0, 2]], arcs: [[1, 0, 2, 1]] }); tri3(flip([A, B, C], 12), "soft", { dash: true, ticks: [[0, 1, 1], [2, 0, 2]], arcs: [[2, 0, 1, 1]] }); say = "**SAS.** Two sides and the angle **between** them: the third side has no choice."; }
    else if (k === "asa") { tri3([A, B, C], "blue", { ticks: [[0, 1, 1]], arcs: [[1, 0, 2, 1], [0, 1, 2, 2]] }); tri3(flip([A, B, C], 12), "soft", { dash: true, ticks: [[0, 1, 1]], arcs: [[2, 0, 1, 1], [0, 1, 2, 2]] }); say = "**ASA.** Two angles and the side between them: the other two sides are forced."; }
    else if (k === "aas") { tri3([A, B, C], "blue", { ticks: [[1, 2, 1]], arcs: [[1, 0, 2, 1], [0, 1, 2, 2]] }); tri3(flip([A, B, C], 12), "soft", { dash: true, ticks: [[1, 2, 1]], arcs: [[2, 0, 1, 1], [0, 1, 2, 2]] }); say = "**AAS.** Two angles and a side that is not between them: the third angle is forced, and then it is ASA."; }
    else if (k === "aaa") { tri3([A, B, C], "blue", { arcs: [[1, 0, 2, 1], [0, 1, 2, 2], [0, 2, 1, 3]] }); tri3([A, [8, 0], [3.2, 4.8]], "orange", { dash: true, arcs: [[1, 0, 2, 1], [0, 1, 2, 2], [0, 2, 1, 3]] }); ok = false; say = "**AAA.** The same three angles fit a small triangle and a big one. **Not enough.**"; }
    else { // SSA: the two triangles share A, C and the angle at A, and BC = 3.2 in both
      var P1 = [SSA5.A, [SSA5B[0][0], 0], SSA5.C], P2 = [SSA5.A, [SSA5B[1][0], 0], SSA5.C];
      tri3(P2, "orange", { dash: true }); tri3(P1, "blue", { ticks: [[2, 0, 1], [1, 2, 2]], arcs: [[1, 0, 2, 1]] });
      items.push({ seg: [P2[1], P2[2]], marks: 2, c: "orange" }); ok = false; say = "**SSA.** Two sides and an angle **not** between them leave **two** triangles: the same three parts, but a different third side. **Not enough.**";
    }
    return { items: items, ok: ok, say: say };
  }
  LESSONS.push({
    title: "Triangle congruence: SAS and HL", art: "sas",
    blurb: "Section 4.5 · Two sides and the angle between them (SAS), the hypotenuse and a leg of right triangles (HL), and which sets of parts are not enough.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In $\\triangle ABC$, which angle is **between** the sides $\\overline{AB}$ and $\\overline{BC}$?",
        options: [{ t: "$\\angle B$" }, { t: "$\\angle A$", fb: "$\\angle A$ is between $\\overline{AB}$ and $\\overline{AC}$." }, { t: "$\\angle C$", fb: "$\\angle C$ is between $\\overline{CA}$ and $\\overline{CB}$." }],
        answer: 0, skill: "Included angle", hints: ["It sits where the two sides meet."], why: "$\\angle B$ is where $\\overline{AB}$ and $\\overline{BC}$ meet." },
      { type: "learn", kicker: "Explore",
        prompt: "Which sets of **three parts** are enough to fix a triangle? Press each button. Does the figure leave any other triangle possible?",
        scene: { type: "sketch", x: [-1.5, 13], y: [-0.8, 5.4], u: 38, grid: false, gate: true,
          chips: { kind: { v: "sss", opts: [["sss", "SSS"], ["sas", "SAS"], ["asa", "ASA"], ["aas", "AAS"], ["aaa", "AAA"], ["ssa", "SSA"]] } },
          draw: function (s) { return fix45(s.c.kind).items; },
          readout: function (s) { var f = fix45(s.c.kind); return f.say + "<br><b class='" + (f.ok ? "t" : "f") + "'>" + (f.ok ? "Enough: the triangles are congruent." : "Not enough: the triangles can differ.") + "</b><br><span class='gt-dim'>Tried " + Object.keys(s.seen.kind).length + " of 6</span>"; },
          goal: function (s) { return Object.keys(s.seen.kind).length >= 6; } },
        then: "**SSS, SAS, ASA** and **AAS** each fix the triangle. **AAA** and **SSA** do not. For right triangles there is one more, **HL**." },
      { type: "learn", kicker: "The idea",
        prompt: "**SAS:** two sides and the **included angle** of one triangle are congruent to those of another. **HL:** the hypotenuse and a leg of one right triangle are congruent to those of another right triangle. The angle must be **between** the sides: SSA does not work.",
        scene: { type: "method", how: HOW_4_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Segments $\\overline{AD}$ and $\\overline{BC}$ cross at $E$, and $E$ is the midpoint of both. Prove: $\\triangle AEB \\cong \\triangle DEC$. Watch SAS used.",
        scene: { type: "walk", how: HOW_4_5, rows: [
          { step: 1, m: "\\overline{AE} \\cong \\overline{DE} \\qquad \\overline{BE} \\cong \\overline{CE}", say: "$E$ is the midpoint of each segment: two pairs of congruent sides.", fig: FIG_SAS5 },
          { step: 1, m: "\\angle AEB \\cong \\angle DEC", say: "Vertical angles are congruent.",
            ask: { prompt: "Why are $\\angle AEB$ and $\\angle DEC$ congruent?", answer: 0, options: [{ t: "They are vertical angles" }, { t: "They are marked in the figure", fb: "No arcs are drawn. They are equal because two lines cross." }] } },
          { step: 2, m: "\\angle AEB \\text{ is between } \\overline{AE} \\text{ and } \\overline{BE}", say: "The angle sits between the two sides, in each triangle." },
          { step: 3, m: "\\triangle AEB \\cong \\triangle DEC", say: "SAS." }] },
        gate: true, then: "Side, **angle between**, side: SAS." },
      { type: "guided", kicker: "Together",
        prompt: "These are right triangles, with the marks shown. Now you decide which rule proves them congruent.", art: FIG_HL5,
        how: HOW_4_5, skill: "SAS and HL",
        steps: [
          { step: 1, ask: "What are the two marked sides?", type: "choice", answer: 0,
            options: [{ t: "A leg ($\\overline{AB}$) and the hypotenuse ($\\overline{CA}$)" }, { t: "Two legs", fb: "The hypotenuse is the side opposite the right angle, $\\overline{CA}$, and it is marked." }],
            m: "AB \\cong DE \\quad CA \\cong FD", say: "A leg and the hypotenuse." },
          { step: 2, ask: "Are both triangles right triangles?", type: "choice", answer: 0,
            options: [{ t: "Yes: both show a right angle" }, { t: "No", fb: "Both have the little square at $B$ and $E$." }],
            m: "\\angle B = \\angle E = 90°", say: "Two right triangles." },
          { step: 3, ask: "Which rule is it?", type: "choice", answer: 0,
            options: [{ t: "HL" }, { t: "SAS", fb: "The marked parts are two sides, but the angle between them is not marked." }],
            m: "\\triangle ABC \\cong \\triangle DEF \\text{ by HL}", say: "Hypotenuse and leg of two right triangles: HL." }],
        why: "Mark, place, say. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Each card says what is known about two triangles. Which rule gives congruence?",
        bins: ["SAS", "HL", "Neither"],
        cards: [{ t: nb("Two sides and the angle between them"), bin: 0, fb: "The included angle." }, { t: nb("The hypotenuse and a leg of two right triangles"), bin: 1, fb: "HL." },
                { t: nb("Two sides and an angle **not** between them"), bin: 2, fb: "SSA: the triangle can come out two ways." }, { t: nb("A leg and an acute angle"), bin: 2, fb: "That is not SAS, because the angle is not between two sides, and not HL." },
                { t: nb("The hypotenuse and a leg, but one triangle is not right-angled"), bin: 2, fb: "HL needs both triangles to be right triangles." }],
        skill: "SAS and HL", hints: ["Is the angle between the sides? Are both triangles right-angled?"], why: "SAS needs the angle between the two sides. HL needs two right triangles." },
      { type: "num", prompt: "$\\triangle ABC \\cong \\triangle DEF$ by SAS, with $\\angle B$ and $\\angle E$ the included angles. $m\\angle B = (3x + 5)°$ and $m\\angle E = 50°$. Find $x$.", answer: 15, skill: "SAS and HL",
        near: [{ v: 18.33, tol: 0.01, fb: "Subtract 5 first: $3x = 45$." }], hints: ["Corresponding angles are equal: $3x + 5 = 50$."], why: "$3x = 45$, so $x = 15$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Why does SSA fail? In both triangles, $m\\angle A = 40°$, $AC = 4.5$ and $BC = 3.2$. Watch two different triangles come out.",
        scene: { type: "walk", how: [["Fix", "Draw the angle and the side next to it."], ["Swing", "Swing the third side $BC$ round until it touches the base."], ["Count", "Count the places where it touches."]], rows: [
          { step: 1, m: "\\angle A = 40° \\qquad AC = 4.5", say: "Start with the angle and the side next to it. The side $BC = 3.2$ must reach from $C$ down to the base.",
            fig: plain([-0.6, 6], [-0.5, 3.6], [{ dline: [[0, 0], [5.8, 0]], ray: true }, { seg: [SSA5.A, SSA5.C], c: "blue" }, { pt: SSA5.A, name: "A", at: "sw" }, { pt: SSA5.C, name: "C", at: "n" }], { u: 42, alt: "A base ray from A, and segment AC of length 4.5 rising at 40 degrees." }) },
          { step: 2, m: "BC = 3.2", say: "A segment of length 3.2 from $C$ reaches the base at **two** places.",
            fig: plain([-0.6, 6], [-0.5, 3.6], [{ dline: [[0, 0], [5.8, 0]], ray: true }, { seg: [SSA5.A, SSA5.C], c: "blue" }, { seg: [SSA5B[0].concat([]), SSA5.C], c: "green" }, { seg: [SSA5B[1], SSA5.C], c: "orange" }, { pt: SSA5.A, name: "A", at: "sw" }, { pt: SSA5.C, name: "C", at: "n" }, { pt: SSA5B[0], name: "B", at: "s", c: "green" }, { pt: SSA5B[1], name: "B′", at: "s", c: "orange" }], { u: 42, alt: "From C, two segments of length 3.2 reach the base at two different points, B and B′." }),
            ask: { prompt: "How many places does $BC$ reach the base?", answer: 0, options: [{ t: "Two" }, { t: "One", fb: "Swing it: it touches the base on the way down and again further along." }] } },
          { step: 3, m: "\\triangle ABC \\not\\cong \\triangle AB′C", say: "Two different triangles with the same SSA parts: $AB$ is about 2.1 in one and 4.8 in the other. So SSA proves nothing." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "You know $\\overline{AB} \\cong \\overline{DE}$ and $\\angle B \\cong \\angle E$. Which extra fact lets you prove $\\triangle ABC \\cong \\triangle DEF$ by SAS?",
        options: [{ t: "$\\overline{BC} \\cong \\overline{EF}$" }, { t: "$\\overline{AC} \\cong \\overline{DF}$", fb: "That side is opposite the known angle. It makes SSA, which is not enough." }, { t: "$\\angle A \\cong \\angle D$", fb: "That gives ASA, not SAS." }],
        answer: 0, skill: "SAS and HL", hints: ["The angle must be between the two sides."], why: "$\\overline{AB}$ and $\\overline{BC}$ are the sides next to $\\angle B$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dev says these triangles are congruent by SAS: both have sides of 5 and 7, and a 40° angle, but in one the 40° is between the 5 and the 7, and in the other it is opposite the 7. What is wrong?",
        options: [{ t: "The angle must be between the two sides in **both** triangles. Here it is not." }, { t: "Nothing: sides and an angle are enough.", fb: "Only the included angle works. SSA can give two triangles." }, { t: "The sides must be equal.", fb: "They are: the problem is where the angle is." }],
        answer: 0, skill: "SAS and HL", hints: ["Is the angle in the same place in both?"], why: "Not between the sides in one triangle: that is SSA, which is not a test." },
      { type: "choice", kicker: "Use it", prompt: "Two pairs of scissor blades are each 8 cm long, hinged together, and opened to the **same** angle. How do the cut ends compare?",
        options: [{ t: "The triangles formed are congruent by SAS, so the tips are the same distance apart" }, { t: "The tips are not related", fb: "Two sides and the angle between them fix the triangle." }, { t: "The tips are always 8 cm apart", fb: "That only happens at one angle (60°)." }],
        answer: 0, skill: "SAS and HL", hints: ["Two sides and the angle between them."], why: "SAS: the third side, the tip-to-tip distance, is the same." }
    ]
  });
  /* ============================================ 4.6 · Using congruent triangles */
  var HOW_4_6 = [["Triangles", "Find two triangles that contain the parts you want."],
                 ["Congruent", "Prove the triangles congruent: SSS, SAS, ASA, AAS or HL."],
                 ["CPCTC", "Corresponding parts of congruent triangles are congruent."]];
  var FIG_KITE_S = kite([1.8, 2], { ticks: [0, 2, 1] }, null, "Triangles ABC and ADC share side AC. AB and AD each carry one tick mark. CB and CD each carry two."),
      FIG_PQRS = kite([1.8, 2], { ticks: [0, 0, 1], arcs: [1, 0, 0] }, null, "Triangles PQR and PSR share side PR. PQ and PS each carry one tick mark. The angles at P on each side of PR carry one arc.", "PQRS"),
      FIG_GRID6 = grid([-6, 6], [-5, 6], [{ poly: [[1, 1], [4, 1], [1, 5]], names: "ABC", c: "blue" }, { poly: [[-1, -1], [-1, -4], [-5, -1]], names: "DEF", c: "green" }],
        { u: 22, alt: "A coordinate grid. Triangle ABC has A at (1, 1), B at (4, 1) and C at (1, 5). Triangle DEF has D at (−1, −1), E at (−1, −4) and F at (−5, −1)." }),
      FIG_POND = bowtie("ABECD", "Segments AD and BC cross at E. AE and DE each carry one tick mark. BE and CE each carry two. AB is the width of the pond, and DC is 42 metres.",
        { extra: [{ len: "42 m", seg: [[2.6, -1.6], [2.6, 1.3]], side: -1, off: 16 }, { len: "pond", seg: [[-2.6, 1.6], [-2.6, -1.3]], side: -1, off: 20 }] });
  var FIG_BOW = bowtie("ABECD", "Segments AD and BC cross at E. AE and DE each carry one tick mark. BE and CE each carry two.");
  LESSONS.push({
    title: "Using congruent triangles", art: "cpctc",
    blurb: "Section 4.6 · Once two triangles are congruent, all their matching parts are congruent: CPCTC, used to prove more.",
    mins: 14, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "$\\triangle ABC \\cong \\triangle DEF$. Which angle is congruent to $\\angle B$?",
        options: [{ t: "$\\angle E$" }, { t: "$\\angle D$", fb: "$\\angle D$ matches $\\angle A$." }, { t: "$\\angle F$", fb: "$\\angle F$ matches $\\angle C$." }],
        answer: 0, skill: "Corresponding parts", hints: ["$B$ is the second letter."], why: "Second letter with second letter." },
      { type: "learn", kicker: "Explore",
        prompt: "$\\triangle ABC$ and $\\triangle ADC$ are mirror images over $\\overline{AC}$. Drag $B$ and watch the **matching parts**. Do they ever stop matching?",
        scene: { type: "sketch", x: [-1.2, 6.2], y: [-3.6, 3.6], u: 44, grid: false, gate: true,
          pts: { B: { at: [2, 2.4], drag: true, snap: 0.1, c: "orange", on: { fn: function (p) { return [Math.round(p[0] * 10) / 10, Math.max(0.6, Math.round(p[1] * 10) / 10)]; } }, say: "Corner B" } },
          draw: function (s) {
            var A = [0, 0], C = [5, 0], B = s.B, D = [B[0], -B[1]], a = angles3(A, C, B), eq = 1;
            return [{ poly: [A, C, B], c: "blue", fill: true }, { poly: [A, C, D], c: "green", fill: true }, { seg: [A, B], marks: 1, c: "blue" }, { seg: [A, D], marks: 1, c: "green" }, { seg: [C, B], marks: 2, c: "blue" }, { seg: [C, D], marks: 2, c: "green" },
              { amarks: [A, B, C], n: 1, r: 20 }, { amarks: [A, D, C], n: 1, r: 20 }, { pt: A, name: "A", at: "w" }, { pt: C, name: "C", at: "e" }, { pt: B, name: "B", at: "n", c: "orange" }, { pt: D, name: "D", at: "s" }];
          },
          readout: function (s) {
            var A = [0, 0], C = [5, 0], a = angles3(A, C, s.B), ab = GT.dist(A, s.B);
            return "$AB = AD = " + n1(ab) + "$ · $CB = CD = " + n1(GT.dist(C, s.B)) + "$ · $\\angle B = \\angle D = " + a[2] + "°$";
          },
          log: { need: 3, cols: [{ h: "$AB$", f: function (s) { return "$" + n1(GT.dist([0, 0], s.B)) + "$"; } }, { h: "$AD$", f: function (s) { return "$" + n1(GT.dist([0, 0], [s.B[0], -s.B[1]])) + "$"; } },
            { h: "$\\angle B$", f: function (s) { return "$" + angles3([0, 0], [5, 0], s.B)[2] + "°$"; } }, { h: "$\\angle D$", f: function (s) { return "$" + angles3([0, 0], [5, 0], [s.B[0], -s.B[1]])[2] + "°$"; } }] } },
        then: "Once two triangles are congruent, **every** pair of matching parts is congruent, however the figure is stretched. That is **CPCTC**: corresponding parts of congruent triangles are congruent." },
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
  /* ============================================ 4.7 · Isosceles and equilateral triangles */
  var HOW_4_7 = [["Sides", "Find the congruent sides: the legs. The angles opposite them are the base angles."],
                 ["Equal", "Base angles are congruent. And if two angles are congruent, the sides opposite them are congruent."],
                 ["Solve", "Use the 180° sum, or set the equal parts equal, to find what is missing."]];
  var FIG_I40 = tri([[0, 0], [3, 0], [1.5, 4.1]], { names: "ABC", ticks: [0, 1, 1], angs: ["x°", "x°", "40°"] }, "Isosceles triangle ABC. Sides BC and CA each carry one tick mark. The angle at C is 40 degrees, and the angles at A and B are each x degrees."),
      FIG_I52 = tri([[0, 0], [4, 0], [2, 2.56]], { names: "DEF", ticks: [0, 1, 1], angs: ["52°", null, "?"] }, "Isosceles triangle DEF. Sides EF and FD each carry one tick mark. The angle at D is 52 degrees, and the angle at F is marked with a question mark."),
      FIG_IX = tri([[0, 0], [4.4, 0], [2.2, 2.62]], { names: "GHJ", ticks: [0, 1, 1], angs: ["(3x + 5)°", "(5x − 25)°", null] }, "Isosceles triangle GHJ. Sides HJ and JG each carry one tick mark. The angle at G is 3x + 5 degrees and the angle at H is 5x − 25 degrees.", { u: 34 }),
      FIG_E60 = tri([[0, 0], [4, 0], [2, 3.46]], { names: "RST", ticks: [1, 1, 1], angs: ["(2x + 10)°", null, null] }, "Equilateral triangle RST, with one tick mark on every side. The angle at R is 2x + 10 degrees.", { u: 34 }),
      FIG_EA = tri([[0, 0], [4, 0], [2, 3.46]], { names: "UVW", arcs: [1, 1, 1], sides: ["4y − 3", "2y + 9", null] }, "Triangle UVW, with one arc in every angle. UV is 4y − 3 and VW is 2y + 9.");
  LESSONS.push({
    title: "Isosceles and equilateral triangles", art: "iso",
    blurb: "Section 4.7 · Congruent sides make congruent base angles, and the other way round; equilateral means equiangular.",
    mins: 14, v: 5,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $2x + 40 = 180$.", pre: "$x =$", answer: 70, skill: "Solve an equation",
        near: [{ v: 110, fb: "Subtract 40, then divide by 2." }], hints: ["$2x = 140$."], why: "$2x = 140$, so $x = 70$." },
      { type: "learn", kicker: "Explore",
        prompt: "The base $\\overline{AB}$ stays put. Drag the top corner $C$. Watch the two **base angles**. Then try the other button.",
        scene: { type: "sketch", x: [-1, 7], y: [-0.5, 6], u: 54, grid: false, gate: true,
          pts: { C: { at: [3, 4], drag: true, snap: 0.1, c: "orange", on: { fn: function (p, s) { var y = Math.max(0.8, Math.round(p[1] * 10) / 10); return [s.c.apex === "line" ? 3 : Math.round(p[0] * 10) / 10, y]; } }, say: "Top corner C" } },
          chips: { apex: { v: "line", opts: [["line", "Keep $C$ above the middle"], ["free", "Move $C$ anywhere"]] } },
          track: function (s) { var A = [0, 0], B = [6, 0], ca = GT.dist(s.C, A), cb = GT.dist(s.C, B); return Math.abs(ca - cb) < 0.06 ? "equal" : "unequal"; },
          draw: function (s) {
            var A = [0, 0], B = [6, 0], C = s.C, ca = GT.dist(C, A), cb = GT.dist(C, B), iso = Math.abs(ca - cb) < 0.06, a = angles3(A, B, C), col = iso ? "green" : "blue";
            return [{ poly: [A, B, C], c: col, fill: true }, { seg: [A, C], marks: iso ? 1 : 0, c: col }, { seg: [B, C], marks: iso ? 1 : 0, c: col }, { angle: [B, A, C], say: a[0] + "°", r: 34, c: "orange" }, { angle: [C, B, A], say: a[1] + "°", r: 34, c: "orange" },
              { pt: A, name: "A", at: "sw" }, { pt: B, name: "B", at: "se" }, { pt: C, name: "C", at: "n", c: "orange" }];
          },
          readout: function (s) {
            var A = [0, 0], B = [6, 0], ca = GT.dist(s.C, A), cb = GT.dist(s.C, B), a = angles3(A, B, s.C), iso = Math.abs(ca - cb) < 0.06;
            return "$CA = " + n1(ca) + "$ · $CB = " + n1(cb) + "$ · $\\angle A = " + a[0] + "°$ · $\\angle B = " + a[1] + "°$<br>" + (iso ? "**Two equal sides, two equal base angles.**" : "Unequal sides: unequal base angles.");
          },
          goal: function (s) { return s.tracked.equal && s.tracked.unequal; } },
        then: "When two sides are congruent, the angles **opposite** them are congruent: the **Isosceles Triangle Theorem**. And it works backwards: equal base angles mean equal sides." },
      { type: "learn", kicker: "The idea",
        prompt: "In an isosceles triangle, the two congruent sides are the **legs**. They meet at the **vertex angle**. The third side is the **base**, and the two **base angles** lie on it. **Isosceles Triangle Theorem:** the base angles are congruent. Its converse is true as well.",
        scene: { type: "method", how: HOW_4_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the base angles found from the vertex angle.",
        scene: { type: "walk", how: HOW_4_7, rows: [
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
        how: HOW_4_7, skill: "Isosceles triangles",
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
  /* ========================================== 4.8 · Congruence transformations */
  var HOW_4_8 = [["Move", "Describe the move: a slide (translation), a flip (reflection) or a turn (rotation)."],
                 ["Match", "Say where each corner goes: $A$ to $A′$, $B$ to $B′$, $C$ to $C′$."],
                 ["Say", "A slide, flip or turn keeps size and shape, so the triangles are congruent."]];
  var P48 = [[0, 0], [3, 0], [1, 2]];
  var T48a = fitMove(P48, { Q: [7, 2], p: { rot: 0 }, c: { flip: "no" } }), T48b = fitMove(P48, { Q: [7.5, 1.5], p: { rot: -60 }, c: { flip: "yes" } });
  LESSONS.push({
    title: "Congruence transformations", art: "ctr",
    blurb: "Section 4.8 · Sliding, flipping and turning a figure keeps its size and shape: the moves that make congruent figures.",
    mins: 15, v: 5,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "You move a triangle on a table. Which moves do **not** change its size or its shape?",
        options: [{ t: "Slide it, flip it over, or turn it" }, { t: "Stretch it", fb: "Stretching changes the size or the shape." }, { t: "Squash one corner", fb: "That changes the shape." }],
        answer: 0, skill: "Rigid motions", hints: ["Think of a cut-out of the triangle."], why: "A cut-out triangle slid, flipped or turned is still the same triangle." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the blue copy of $\\triangle ABC$ (drag $A′$) until it covers the dashed triangle. Only a **slide** is needed.",
        scene: fitScene(P48, T48a, { start: [1, 4.5] }) },
      { type: "learn", kicker: "Explore",
        prompt: "This time the dashed triangle is **flipped** and **turned**. Use all three controls to cover it.",
        scene: fitScene(P48, T48b, { start: [1, 1] }) },
      { type: "learn", kicker: "Explore",
        prompt: "Slide, turn and flip the copy as you like. Do its **side lengths** or **angles** ever change? Try at least three different moves.",
        scene: { type: "sketch", x: [-1, 11], y: [-1, 7], u: 44, grid: false, gate: true,
          pts: { Q: { at: [6, 3], drag: true, snap: 0.5, c: "orange", say: "Corner A′" } },
          params: { rot: { min: -180, max: 180, step: 15, v: 0, label: "turn", show: function (v) { return "$" + v + "°$"; } } },
          chips: { flip: { v: "no", opts: [["no", "Not flipped"], ["yes", "Flipped over"]] } },
          draw: function (s) {
            var M = fitMove(P48, s), O = P48.map(function (p) { return [p[0] + 0.5, p[1] + 3]; });
            return [{ poly: O, c: "ink", names: ["A", "B", "C"] }, { poly: M, c: "blue", fill: true, names: ["A′", "B′", "C′"] }];
          },
          readout: function (s) { var M = fitMove(P48, s); return "$AB = " + n1(GT.dist(P48[0], P48[1])) + "$ and $A′B′ = " + n1(GT.dist(M[0], M[1])) + "$ · $\\angle A = " + angAt(P48[1], P48[0], P48[2]) + "°$ and $\\angle A′ = " + angAt(M[1], M[0], M[2]) + "°$"; },
          log: { need: 3, cols: [{ h: "the move", f: function (s) { return "$A′$ at " + "$(" + num(s.Q[0]) + ", " + num(s.Q[1]) + ")$" + (s.p.rot ? ", turned $" + s.p.rot + "°$" : "") + (s.c.flip === "yes" ? ", flipped" : ""); } }, { h: "$AB$", f: function (s) { return "$" + n1(GT.dist(P48[0], P48[1])) + "$"; } }, { h: "$A′B′$", f: function (s) { var M = fitMove(P48, s); return "$" + n1(GT.dist(M[0], M[1])) + "$"; } },
            { h: "$\\angle A$", f: function () { return "$" + angAt(P48[1], P48[0], P48[2]) + "°$"; } }, { h: "$\\angle A′$", f: function (s) { var M = fitMove(P48, s); return "$" + angAt(M[1], M[0], M[2]) + "°$"; } }] } },
        then: "However you move it, every length and every angle stays the same. A slide, a flip and a turn are called **rigid motions**, and the copy is always **congruent** to the original." },
      { type: "learn", kicker: "The idea",
        prompt: "A **translation** slides every point the same distance the same way. A **reflection** flips a figure over a line. A **rotation** turns it about a point. These **rigid motions** keep lengths and angles, so a figure and its image are congruent. And congruent figures can always be matched by a rigid motion.",
        scene: { type: "method", how: HOW_4_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Reflect $\\triangle ABC$ over the $y$-axis: $A(1, 1)$, $B(4, 1)$, $C(2, 3)$. Watch the image found and the congruence stated.",
        scene: { type: "walk", how: HOW_4_8, rows: [
          { step: 1, m: "(x, y) \\to (-x, y)", say: "Flipping over the $y$-axis changes the sign of $x$ and keeps $y$.",
            fig: grid([-6, 6], [-1, 5], [{ poly: [[1, 1], [4, 1], [2, 3]], names: "ABC", c: "blue" }, { mirror: "y" }], { u: 26, alt: "Triangle ABC on the right of the y-axis, with corners A(1, 1), B(4, 1) and C(2, 3)." }) },
          { step: 2, m: "A′(-1, 1) \\quad B′(-4, 1) \\quad C′(-2, 3)", say: "Each corner goes to the mirror place on the other side.",
            fig: grid([-6, 6], [-1, 5], [{ poly: [[1, 1], [4, 1], [2, 3]], names: "ABC", c: "blue" }, { poly: [[-1, 1], [-4, 1], [-2, 3]], names: ["A′", "B′", "C′"], c: "green" }, { mirror: "y" }], { u: 26, alt: "Triangle ABC and its mirror image A′B′C′ on the other side of the y-axis." }),
            ask: { prompt: "Where does $B(4, 1)$ go?", answer: 0, options: [{ t: "$(-4, 1)$" }, { t: "$(4, -1)$", fb: "That is the reflection over the $x$-axis. Over the $y$-axis, $x$ changes sign." }] } },
          { step: 3, m: "AB = A′B′ = 3", say: "Every length is unchanged: for instance $AB = 3$ and $A′B′ = 3$." },
          { step: 3, m: "\\triangle ABC \\cong \\triangle A′B′C′", say: "A reflection is a rigid motion, so the triangles are congruent." }] },
        gate: true, then: "The corners are listed in matching order: $A$ with $A′$, $B$ with $B′$, $C$ with $C′$." },
      { type: "guided", kicker: "Together",
        prompt: "Slide $\\triangle ABC$ with the rule $(x, y) \\to (x + 5, y - 2)$. $A(-3, 1)$, $B(0, 4)$ and $C(-2, -1)$. Now you find the image.",
        how: HOW_4_8, skill: "Rigid motions",
        steps: [
          { step: 1, ask: "What kind of move is $(x, y) \\to (x + 5, y - 2)$?", type: "choice", answer: 0,
            options: [{ t: "A translation (a slide)" }, { t: "A reflection", fb: "A reflection changes a sign. Here every point moves the same way." }],
            m: "\\text{translation: 5 right, 2 down}", say: "Every point moves 5 right and 2 down." },
          { step: 2, ask: "Where does $A(-3, 1)$ go? Type the $x$-coordinate of $A′$.", type: "num", answer: 2, near: [{ v: -8, fb: "Add 5, do not subtract." }], hint: "$-3 + 5$.",
            m: "A′(2, -1)", say: "$(-3 + 5, 1 - 2) = (2, -1)$." },
          { step: 2, ask: "Where does $B(0, 4)$ go? Type the $y$-coordinate of $B′$.", type: "num", answer: 2, near: [{ v: 6, fb: "Subtract 2, do not add." }], hint: "$4 - 2$.",
            m: "B′(5, 2)", say: "$(0 + 5, 4 - 2) = (5, 2)$." },
          { step: 3, ask: "Is $\\triangle A′B′C′$ congruent to $\\triangle ABC$?", type: "choice", answer: 0,
            options: [{ t: "Yes: a translation is a rigid motion" }, { t: "No: it has moved", fb: "Moving without stretching keeps size and shape." }],
            m: "\\triangle ABC \\cong \\triangle A′B′C′", say: "A rigid motion makes congruent figures." }],
        why: "Move, match, say. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Name the rigid motion.",
        bins: ["Translation", "Reflection", "Rotation"],
        cards: [{ t: nb("A figure slides 4 units right"), bin: 0, fb: "Every point moves the same way." }, { t: nb("A figure is flipped over a line"), bin: 1, fb: "A mirror image." },
                { t: nb("A figure turns 90° about a point"), bin: 2, fb: "A turn about a centre." }, { t: nb("$(x, y) \\to (x, -y)$"), bin: 1, fb: "The sign of $y$ changes: a flip over the $x$-axis." },
                { t: nb("$(x, y) \\to (x - 3, y + 1)$"), bin: 0, fb: "The same shift for every point." }, { t: nb("A figure rotates 180° about the origin"), bin: 2, fb: "A half turn." }],
        skill: "Rigid motions", hints: ["Slide, flip, or turn?"], why: "Translation slides, reflection flips, rotation turns." },
      { type: "pair", prompt: "Rotate the point $(3, 1)$ by $90°$ **counterclockwise** about the origin, with the rule $(x, y) \\to (-y, x)$. Type the image as $(x, y)$.", answer: [-1, 3], skill: "Rigid motions",
        near: [{ v: [1, -3], fb: "That is a clockwise turn. Use $(-y, x)$." }, { v: [-3, 1], fb: "That is a half turn about the $y$-axis. Use $(-y, x)$." }], hints: ["$x$ becomes $-y$ and $y$ becomes $x$."], why: "$(-1, 3)$: the point was to the right of the origin, and is now above it." },
      { type: "learn", kicker: "A harder case",
        prompt: "A rotation of $180°$ about the origin sends $(x, y)$ to $(-x, -y)$. Is the image congruent to the original? Watch the sides compared.",
        scene: { type: "walk", how: HOW_4_8, rows: [
          { step: 1, m: "(x, y) \\to (-x, -y)", say: "A half turn about the origin.",
            fig: grid([-5, 5], [-4, 4], [{ poly: [[1, 1], [4, 1], [2, 3]], names: "ABC", c: "blue" }, { poly: [[-1, -1], [-4, -1], [-2, -3]], names: ["A′", "B′", "C′"], c: "green" }], { u: 28, alt: "Triangle ABC in the upper right, and its half-turn image A′B′C′ in the lower left." }) },
          { step: 2, m: "A′(-1, -1) \\quad B′(-4, -1) \\quad C′(-2, -3)", say: "Every coordinate changes sign.",
            ask: { prompt: "Where does $C(2, 3)$ go?", answer: 0, options: [{ t: "$(-2, -3)$" }, { t: "$(-2, 3)$", fb: "That flips over the $y$-axis. A half turn changes both signs." }] } },
          { step: 3, m: "AB = 3 \\quad A′B′ = 3", say: "$|4 - 1| = 3$ and $|-4 - (-1)| = 3$. The other sides match as well." },
          { step: 3, m: "\\triangle ABC \\cong \\triangle A′B′C′", say: "SSS, or simply: a rotation is a rigid motion." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A triangle is **dilated** with scale factor 2: each side is doubled. Is the image congruent to the original?",
        options: [{ t: "No: the size changed, so a dilation is not a rigid motion" }, { t: "Yes: it is the same shape", fb: "Congruent means the same size **and** shape." }, { t: "Yes, by AAA", fb: "AAA does not prove congruence. The sides are twice as long." }],
        answer: 0, skill: "Rigid motions", hints: ["Does a dilation keep lengths?"], why: "The sides are doubled, so the images are similar, not congruent." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam reflects $\\triangle ABC$ and writes: “$\\triangle ABC \\cong \\triangle B′A′C′$.” What is wrong?",
        options: [{ t: "The corners must be listed in matching order: $A$ with $A′$, so it is $\\triangle ABC \\cong \\triangle A′B′C′$." }, { t: "A reflection does not give congruent triangles.", fb: "It does. A reflection is a rigid motion." }, { t: "Nothing. It is right.", fb: "$B′$ is the image of $B$, so it cannot stand in $A$'s place." }],
        answer: 0, skill: "Rigid motions", hints: ["Which corner is the image of $A$?"], why: "A congruence statement lists corresponding corners in order." },
      { type: "choice", kicker: "Use it", prompt: "A rubber stamp is pressed on paper, printing a mirror image of its letters. Which rigid motion relates the stamp to its print?",
        options: [{ t: "A reflection: the print is flipped" }, { t: "A translation", fb: "A slide would keep the letters facing the same way." }, { t: "A rotation", fb: "A turn would not reverse the letters." }],
        answer: 0, skill: "Rigid motions", hints: ["Is the print a mirror image?"], why: "A mirror image is a reflection." }
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
    { id: "hg4-sum", title: "Angles of a triangle", lesson: 2,
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
    { id: "hg4-corresponding", title: "Corresponding parts", lesson: 3,
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
    { id: "hg4-sss-sas", title: "SSS, SAS, or not enough", lesson: 6,
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
    { id: "hg4-isosceles", title: "Isosceles and equilateral triangles", lesson: 8,
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
      } },
    { id: "hg4-transform", title: "Slide, flip and turn", lesson: 9,
      gen: function (R) {
        var P = [R.int(-5, 5), R.int(-5, 5)], k = R.int(0, 3), x = P[0], y = P[1], dx = R.int(1, 6) * R.pick([1, -1]), dy = R.int(1, 6) * R.pick([1, -1]), Q, say, rule, why;
        if (k === 0) { Q = [x + dx, y + dy]; rule = "the translation $(x, y) \\to (x " + (dx < 0 ? "- " + (-dx) : "+ " + dx) + ", y " + (dy < 0 ? "- " + (-dy) : "+ " + dy) + ")$"; why = "Add " + dx + " to $x$ and " + dy + " to $y$."; }
        else if (k === 1) { Q = [-x, y]; rule = "a reflection over the $y$-axis, $(x, y) \\to (-x, y)$"; why = "The sign of $x$ changes."; }
        else if (k === 2) { Q = [x, -y]; rule = "a reflection over the $x$-axis, $(x, y) \\to (x, -y)$"; why = "The sign of $y$ changes."; }
        else { Q = [-y, x]; rule = "a rotation of 90° counterclockwise about the origin, $(x, y) \\to (-y, x)$"; why = "$x$ becomes $-y$ and $y$ becomes $x$."; }
        var cand = [[-Q[0], Q[1]], [Q[0], -Q[1]], [Q[1], Q[0]]].filter(function (c) { return c[0] !== Q[0] || c[1] !== Q[1]; });
        return { type: "pair", prompt: "Find the image of $" + pt(P) + "$ under " + rule + ". Type it as $(x, y)$.", answer: Q,
          near: cand.slice(0, 2).map(function (c) { return { v: c, fb: "Check the rule again: apply it to each coordinate in turn." }; }), hints: ["Use the rule on $x$ and on $y$ separately."], why: why + " The image is $" + pt(Q) + "$." };
      } }
  ];
  L.unit("geo", 4, {
    title: "Congruent Triangles",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "The angles of a triangle, and corresponding parts of congruent figures.",
        skills: ["hg4-sum", "hg4-corresponding"], per: 3 },
      { title: "Quiz 2", after: 6, blurb: "SSS, SAS, ASA, AAS and HL: which rule proves a pair of triangles congruent.",
        skills: ["hg4-sss-sas", "hg4-asa-aas-hl"], per: 3 },
      { title: "Quiz 3", after: 9, blurb: "CPCTC, isosceles and equilateral triangles, and congruence transformations.",
        skills: ["hg4-cpctc", "hg4-isosceles", "hg4-transform"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("geo:4", {
    2: { name: "Triangle sums", frame: "The three angles of a triangle add up to [[180]]°. An exterior angle equals the sum of the two [[remote]] interior angles.",
         chips: ["360", "adjacent"] },
    3: { name: "Congruent figures", frame: "Congruent figures have the same [[size]] and [[shape]]. Their corresponding sides and angles are congruent, and the corners are written in matching [[order]].",
         chips: ["scale", "random"] },
    4: { name: "SSS", frame: "If three sides of one triangle are congruent to three sides of another, the triangles are [[congruent]]: SSS. A [[shared]] side counts, by the Reflexive Property.",
         chips: ["similar", "equal angles"] },
    5: { name: "ASA and AAS", frame: "Two angles and the side [[between]] them (ASA), or a side [[not]] between them (AAS), make the triangle. AAA does not: it only fixes the [[shape]].",
         chips: ["size", "SSA"] },
    6: { name: "SAS and HL", frame: "Two sides and the [[included]] angle (SAS), or the hypotenuse and a leg of right triangles (HL), prove triangles congruent. SSA does [[not]].",
         chips: ["AAA", "any angle"] },
    7: { name: "Using congruent triangles", frame: "Once two triangles are shown congruent, [[CPCTC]]: every pair of corresponding parts is congruent. Prove the triangles first, then use it.",
         chips: ["before", "similar"] },
    8: { name: "Isosceles triangles", frame: "Angles opposite congruent sides are [[congruent]], and the other way round. An equilateral triangle is [[equiangular]], with three 60° angles.",
         chips: ["90", "scalene"] },
    9: { name: "Congruence transformations", frame: "A [[translation]], a reflection and a rotation keep lengths and angles, so the image is [[congruent]] to the figure. A dilation does not.",
         chips: ["dilation", "stretch"] }
  });
})();
