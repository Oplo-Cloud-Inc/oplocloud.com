/* ==========================================================================
   Precalculus — Unit 3: Polynomial and Rational Functions. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 3: complex numbers, quadratic
   functions, power and polynomial functions and their graphs, dividing
   polynomials, zeros, rational functions, radical functions and variation.
   Each section is split into lessons small enough to finish in one sitting;
   each teaches one method: the idea, an example to watch, one done together,
   then on your own, a harder case, find the error, use it, and the concept
   built at the end.

   Adapted from OpenStax, Precalculus 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.
   ========================================================================== */
(function () {
  "use strict";
  /* Shared by every Precalculus unit. */
  var L = window.OPLO_LAB;
  var poly = L.poly, frac = L.frac, num = L.num, mc = L.mc, signed = L.signed;
  var GT = L.GT, fig = GT ? GT.fig : L.fig;   // the geometry kit's figure adds path, ell and word

  // A worked calculation, one line per step.
  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  // Two equations set one above the other.
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
  // A number in brackets when it is negative: for substituting into a formula.
  function par(v) { return v < 0 ? "(" + v + ")" : String(v); }
  // Two things on one card ("… and …"): cards and options close up the spaces beside maths.
  function two(a, b) { return "$" + a + "$  and  $" + b + "$"; }
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
  var GIVEN = "That is the problem as it was given.", LATER = "This line follows correctly from the one above it. Look earlier.";

  // A coordinate grid beside a worked example: grid("what it shows", items, { x, y, u }).
  // The scale fits the window: about 240 px across the longer side.
  function grid(alt, items, o) {
    o = Object.assign({ x: [-6, 6], y: [-6, 6], alt: alt, items: items }, o || {});
    if (!o.u) o.u = Math.max(14, Math.min(26, Math.floor(240 / Math.max(o.x[1] - o.x[0], o.y[1] - o.y[0]))));
    return fig(o);
  }
  // A curve for a figure: curve(f, from, to, colour, [ylo, yhi], dash). It is drawn as paths, one for each
  // unbroken run, so it stops at the edge of the window and at a jump (an asymptote, a hole).
  function curve(f, a, b, c, yr, dash) {
    var out = [], run = [], n = 240, py = null, px = null, jump = yr ? (yr[1] - yr[0]) * 0.5 : Infinity;
    function ok(y) { return isFinite(y) && (!yr || (y >= yr[0] && y <= yr[1])); }
    function flush() { if (run.length > 1) out.push({ path: run, c: c || "blue", dash: dash }); run = []; }
    // Where a curve crosses the edge of the window between a good x and a bad one.
    function edge(g, w) { for (var k = 0; k < 16; k++) { var mid = (g + w) / 2; if (ok(f(mid))) g = mid; else w = mid; } return g; }
    for (var i = 0; i <= n; i++) {
      var x = a + (b - a) * i / n, y = f(x);
      if (!ok(y)) {
        if (py !== null && isFinite(y)) { var e = edge(px, x); run.push([e, f(e)]); }   // leaves through the top or bottom
        flush(); py = null; continue;
      }
      if (py === null && i > 0 && isFinite(f(x - (b - a) / n)) && !ok(f(x - (b - a) / n))) { var e2 = edge(x, x - (b - a) / n); run.push([e2, f(e2)]); }   // comes back in
      if (py !== null && Math.abs(y - py) > jump) flush();
      run.push([x, y]); py = y; px = x;
    }
    flush();
    return out;
  }
  // The same for a curve given as x = g(y): a parabola on its side.
  function curveY(g, a, b, c) {
    return curve(g, a, b, c).map(function (it) { return { path: it.path.map(function (p) { return [p[1], p[0]]; }), c: it.c }; });
  }
  // A curve given by a point that moves with t: curveT(function (t) { return [x, y]; }, t0, t1, colour).
  function curveT(g, a, b, c, n) {
    var N = n || 200, pts = [];
    for (var i = 0; i <= N; i++) pts.push(g(a + (b - a) * i / N));
    return [{ path: pts, c: c || "blue" }];
  }
  // A dot, a hollow dot and a labelled dot, for figures.
  function dot(x, y, c, name, at) { return { pt: [x, y], c: c || "blue", name: name, at: at }; }
  function hole(x, y, c, name, at) { return { pt: [x, y], c: c || "blue", name: name, at: at, open: true }; }
  // A graph of functions in one call: plot("alt", [{ f, a, b, c, yr }, …], extraItems, { x, y }).
  function plot(alt, fs, extra, o) {
    var items = [];
    fs.forEach(function (g) { items = items.concat(curve(g.f, g.a, g.b, g.c, g.yr, g.dash)); });
    return grid(alt, items.concat(extra || []), o);
  }
  // A matrix on the board beside a worked example: mat([[1, 2, 7], [3, -1, 7]]) is the augmented
  // matrix of x + 2y = 7, 3x − y = 7. { det: true } draws a determinant; { hot: i } colours the row
  // that has just changed; { plain: true } is no brackets, with a rule above the last row.
  function mat(rows, o) {
    o = o || {};
    var n = rows.length, k = rows[0].length, R = k + 0.2, items = [];
    rows.forEach(function (r, i) {
      r.forEach(function (v, j) { items.push({ text: String(v).replace(/-/g, "−"), at: [j + 0.6, n - i - 0.64], eq: true, c: o.hot === i ? "blue" : "ink" }); });
    });
    if (o.plain) items.push({ seg: [[0.1, 1], [R - 0.1, 1]], c: "soft" });
    else [[0.06, 1], [R - 0.06, -1]].forEach(function (b) {
      items.push({ seg: [[b[0], 0.08], [b[0], n - 0.08]] });
      if (!o.det) items.push({ seg: [[b[0], 0.08], [b[0] + 0.16 * b[1], 0.08]] }, { seg: [[b[0], n - 0.08], [b[0] + 0.16 * b[1], n - 0.08]] });
    });
    if (!o.det && !o.plain && !o.bare) items.push({ seg: [[k - 0.9, 0.2], [k - 0.9, n - 0.2]], c: "soft" });
    return fig({ grid: false, x: [0, R], y: [0, n], u: 42, pad: 8, alt: o.alt || (o.det ? "The determinant with rows " : "The matrix with rows ") + rows.map(function (r) { return r.join(", "); }).join("; ") + ".", items: items });
  }
  // The rows of an augmented matrix set in a line of maths: [1 2 | 7]  [3 −1 | 7].
  function rowsTex(rows) {
    return rows.map(function (r) { return "[\\," + r.slice(0, -1).join(" \\quad ") + " \\;|\\; " + r[r.length - 1] + "\\,]"; }).join(" \\qquad ");
  }

  // A mapping diagram: the inputs in a blue oval on the left, the outputs in an orange one on the right, and an
  // arrow for each pair. mapfig("alt", ["1","2"], ["3","4"], [[0,1],[1,0]], { outs: false, arrows: false, hot: [i] })
  // `outs: false` shows the inputs alone; `arrows: false` the two sets without arrows; `hot` colours those arrows red.
  function mapfig(alt, ins, outs, pairs, o) {
    o = o || {};
    var n = Math.max(ins.length, outs.length), gap = 1.12, H = (n - 1) * gap / 2, xl = -2.1, xr = 2.1, items = [];
    function y(k, m) { return ((m - 1) / 2 - k) * gap; }
    items.push({ ell: [[xl, 0], 0.85, H + 0.8], c: "blue" }, { word: o.inName || "inputs", at: [xl, H + 1.3], c: "blue" });
    ins.forEach(function (t, k) { items.push({ text: String(t), at: [xl, y(k, ins.length)], eq: true, c: "ink" }); });
    if (o.outs !== false) {
      items.push({ ell: [[xr, 0], 0.85, H + 0.8], c: "orange" }, { word: o.outName || "outputs", at: [xr, H + 1.3], c: "orange" });
      outs.forEach(function (t, k) { items.push({ text: String(t), at: [xr, y(k, outs.length)], eq: true, c: "ink" }); });
    }
    if (o.outs !== false && o.arrows !== false) (pairs || []).forEach(function (p, i) {
      items.push({ arrow: [[xl + 0.5, y(p[0], ins.length)], [xr - 0.5, y(p[1], outs.length)]], c: (o.hot || []).indexOf(i) > -1 ? "red" : "ink" });
    });
    return grid(alt, items, { grid: false, x: [-3.7, 3.7], y: [-(H + 1.7), H + 1.7], u: 30 });
  }

  // A function machine in a picture: machfig("alt", "3", "2x + 1", "7"). The input goes in, the rule works, the output comes out.
  function machfig(alt, inn, rule, out) {
    return grid(alt, [
      { arrow: [[-3.7, 0], [-1.7, 0]], c: "blue" }, { arrow: [[1.7, 0], [3.7, 0]], c: "orange" },
      { poly: [[-1.7, -1.1], [1.7, -1.1], [1.7, 1.1], [-1.7, 1.1]], c: "soft", fill: true },
      { text: rule, at: [0, 0], eq: true, c: "ink" },
      { text: inn, at: [-2.7, 0.6], eq: true, c: "blue" }, { text: out, at: [2.7, 0.6], eq: true, c: "orange" }
    ], { grid: false, x: [-4.2, 4.2], y: [-1.7, 1.7], u: 28 });
  }
  // A graph you read by sliding a point along it: slide(f, { x, y, from, snap, name, yr, read, track, goal }) is a sketch scene.
  // The point drops a dashed line to the axis (the input) and another across (the output).
  function slide(f, o) {
    var xr = o.x, snap = o.snap || 1, nme = o.name || "f", lim = o.xlim || [Math.ceil((xr[0] + 0.3) / snap) * snap, Math.floor((xr[1] - 0.3) / snap) * snap];
    // The figure stays about 300 px tall: on a laptop the whole card, its buttons and its readout must fit one screen.
    var u = o.u || Math.min(Math.floor(340 / (o.y[1] - o.y[0])), Math.floor(480 / (xr[1] - xr[0])));
    function fix(p) { var x = Math.round(p[0] / snap) * snap; x = Math.max(lim[0], Math.min(lim[1], x)); return [x, f(x)]; }
    var W0 = (xr[1] - xr[0]) * u + 48, H0 = (o.y[1] - o.y[0]) * u + 48;
    var sc = { type: "sketch", x: o.x, y: o.y, u: u, gate: true, w: o.w || Math.min(480, Math.round(360 * W0 / H0)),
      pts: { P: { at: fix([o.from == null ? 0 : o.from, 0]), drag: true, c: "orange", say: "The input", on: { fn: fix } } },
      draw: function (s) {
        var x = s.P[0], y = s.P[1];
        return curve(f, xr[0], xr[1], "blue", o.yr || o.y).concat(o.extra ? o.extra(s) : [], [{ seg: [[x, 0], [x, y]], c: "orange", dash: true }, { seg: [[0, y], [x, y]], c: "orange", dash: true }, { pt: [x, 0], c: "orange" }, { pt: [0, y], c: "orange" }]);
      },
      readout: function (s) { return o.read ? o.read(s.P[0], s.P[1], s) : "$" + nme + "(" + nm(s.P[0]) + ") = " + nm(r2(s.P[1])) + "$"; } };
    ["track", "goal", "check", "fb"].forEach(function (k) { if (o[k]) sc[k] = o[k]; });
    return sc;
  }

  // A number line in a picture: nline("alt", -5, 5, items). Items come from nline.rng(a, b, closedA, closedB, colour):
  // a heavy piece from a to b, filled or hollow at each end; null for an end that runs off the line (an arrow).
  function nline(alt, lo, hi, items) {
    var it = [{ seg: [[lo - 0.5, 0], [hi + 0.5, 0]], c: "soft" }];
    for (var v = lo; v <= hi; v++) { it.push({ seg: [[v, -0.12], [v, 0.12]], c: "soft" }); it.push({ text: String(v), at: [v, -0.55], eq: true, c: "soft" }); }
    (items || []).forEach(function (m) {
      if (m.inf) { var l = m.seg[0][0] === -99, r = m.seg[1][0] === 99; m = { seg: [[l ? lo - 0.5 : m.seg[0][0], 0], [r ? hi + 0.5 : m.seg[1][0], 0]], c: m.c }; it.push(m); if (l) it.push({ arrow: [[lo - 0.2, 0], [lo - 0.5, 0]], c: m.c }); if (r) it.push({ arrow: [[hi + 0.2, 0], [hi + 0.5, 0]], c: m.c }); }
      else it.push(m);
    });
    return grid(alt, it, { grid: false, x: [lo - 0.8, hi + 0.8], y: [-1, 1], u: Math.max(18, Math.min(34, Math.floor(330 / (hi - lo + 1.6)))) });
  }
  nline.rng = function (a, b, ca, cb, c) {
    var col = c || "blue", out = [{ seg: [[a === null ? -99 : a, 0], [b === null ? 99 : b, 0]], c: col, inf: a === null || b === null }];
    if (a !== null) out.push(ca ? { pt: [a, 0], c: col } : { pt: [a, 0], c: col, open: true });
    if (b !== null) out.push(cb ? { pt: [b, 0], c: col } : { pt: [b, 0], c: col, open: true });
    return out;
  };

  // Two machines in a row, for compositions: input → rule 1 → middle → rule 2 → output.
  function chainItems(inn, r1, mid, r2, out, hot) {
    return [
      { text: inn, at: [-4.2, 0.6], eq: true, c: "blue" }, { arrow: [[-3.4, 0.6], [-1.9, 0.6]], c: "blue" },
      { poly: [[-1.9, -0.4], [1.9, -0.4], [1.9, 1.6], [-1.9, 1.6]], c: "soft", fill: true }, { text: r1, at: [0, 0.6], eq: true, c: "ink" },
      { arrow: [[1.9, 0.6], [3.4, 0.6]], c: "purple" }, { text: mid, at: [4.3, 0.6], eq: true, c: "purple" }, { arrow: [[5.2, 0.6], [6.7, 0.6]], c: "purple" },
      { poly: [[6.7, -0.4], [10.5, -0.4], [10.5, 1.6], [6.7, 1.6]], c: "soft", fill: true }, { text: r2, at: [8.6, 0.6], eq: true, c: "ink" },
      { arrow: [[10.5, 0.6], [12, 0.6]], c: "orange" }, { text: out, at: [13, 0.6], eq: true, c: hot ? "red" : "orange" }
    ];
  }
  // The same chain standing up, for the column beside a worked example.
  function chainfig(alt, inn, r1, mid, r2, out, hot) {
    var m = function (y, t) { return [{ poly: [[-2.2, y], [2.2, y], [2.2, y - 1.5], [-2.2, y - 1.5]], c: "soft", fill: true }, { text: t, at: [0, y - 0.75], eq: true, c: "ink" }]; };
    return grid(alt, [{ text: inn, at: [0, 0.4], eq: true, c: "blue" }, { arrow: [[0, -0.1], [0, -1.1]], c: "blue" }].concat(m(-1.2, r1),
      [{ arrow: [[0, -2.8], [0, -3.7]], c: "purple" }, { text: mid, at: [0, -4.2], eq: true, c: "purple" }, { arrow: [[0, -4.7], [0, -5.6]], c: "purple" }], m(-5.7, r2),
      [{ arrow: [[0, -7.3], [0, -8.2]], c: "orange" }, { text: out, at: [0, -8.7], eq: true, c: hot ? "red" : "orange" }]), { grid: false, x: [-2.8, 2.8], y: [-9.3, 1], u: 24 });
  }
  // Two tables as three columns of numbers, for reading f(g(x)): chain3(alt, g, f, pick) where g, f map input → output.
  var CH3 = { xs: [-4.6, 0, 4.6], ys: [1.6, 0.55, -0.55, -1.6] };
  // pick: the input followed; upto: 0 nothing, 1 as far as g(x), 2 all the way; noLeft: leave the left numbers to taps.
  function chain3Items(g, f, pick, upto, noLeft) {
    var ks = Object.keys(g).map(Number), items = [{ ell: [[CH3.xs[0], 0], 0.8, 2.3], c: "blue" }, { ell: [[CH3.xs[1], 0], 0.8, 2.3], c: "purple" }, { ell: [[CH3.xs[2], 0], 0.8, 2.3], c: "orange" },
      { word: "x", at: [CH3.xs[0], 2.9], c: "blue" }, { word: "g(x)", at: [CH3.xs[1], 2.9], c: "purple" }, { word: "f(g(x))", at: [CH3.xs[2], 2.9], c: "orange" }];
    var Y = function (v) { return CH3.ys[ks.indexOf(v)]; };
    if (upto == null) upto = 2;
    ks.forEach(function (k) { [0, 1, 2].forEach(function (c) { if (!(noLeft && c === 0)) items.push({ text: String(k), at: [CH3.xs[c], Y(k)], eq: true, c: "ink" }); }); });
    ks.forEach(function (k) {
      items.push({ arrow: [[CH3.xs[0] + 0.5, Y(k)], [CH3.xs[1] - 0.5, Y(g[k])]], c: pick === k && upto >= 1 ? "orange" : "soft" });
      items.push({ arrow: [[CH3.xs[1] + 0.5, Y(k)], [CH3.xs[2] - 0.5, Y(f[k])]], c: pick != null && g[pick] === k && upto >= 2 ? "orange" : "soft" });
    });
    return items;
  }
  function chain3(alt, g, f, pick, upto) { return grid(alt, chain3Items(g, f, pick, upto), { grid: false, x: [-6, 6], y: [-2.4, 3.4], u: 24 }); }

  // Parent graphs with a few easy points, for moving about.
  var PARENTS = {
    sq: { f: function (x) { return x * x; }, lab: "$x^2$", pts: [[-2, 4], [-1, 1], [0, 0], [1, 1], [2, 4]] },
    ab: { f: Math.abs, lab: "$|x|$", pts: [[-2, 2], [-1, 1], [0, 0], [1, 1], [2, 2]] },
    rt: { f: function (x) { return x < 0 ? NaN : Math.sqrt(x); }, lab: "$\\sqrt{x}$", pts: [[0, 0], [1, 1], [4, 2]] },
    cb: { f: function (x) { return x * x * x; }, lab: "$x^3$", pts: [[-1, -1], [0, 0], [1, 1]] },
    lin: { f: function (x) { return x; }, lab: "$x$", pts: [[0, 0], [1, 1], [2, 2]] },
    rec: { f: function (x) { return x === 0 ? NaN : 1 / x; }, lab: "$\\frac{1}{x}$", pts: [[-2, -0.5], [-1, -1], [1, 1], [2, 0.5]] },
    hat: { f: pw([[-3, 0], [-1, 2], [1, 2], [3, 0]]), lab: "hat", pts: [[-3, 0], [-1, 2], [1, 2], [3, 0]] }
  };
  // A graph you move with sliders onto a dashed target:
  //   morph({ keys: ["sq", "ab"], params: { h: {...}, k: {...} }, tf: function (f, p) { return function (x) { return f(x - p.h) + p.k; }; },
  //           map: function (pt, p) { return [pt[0] + p.h, pt[1] + p.k]; }, target: { h: 3, k: -2 }, read: function (p) { return "$y = ...$"; } })
  // The grey graph is the parent, the blue one is yours, the dashed orange one is where it should land.
  function morph(o) {
    var chips = { fn: { label: "Start from", v: o.keys[0], opts: o.keys.map(function (k) { return [k, PARENTS[k].lab]; }) } };
    var xr = o.x || [-7, 7], yr = o.y || [-7, 7];
    function same(p) { return Object.keys(o.target).every(function (k) { return Math.abs(p[k] - o.target[k]) < 1e-9; }); }
    var u0 = o.u || 22, W0 = (xr[1] - xr[0]) * u0 + 48, H0 = (yr[1] - yr[0]) * u0 + 48;
    return { type: "sketch", x: xr, y: yr, u: u0, w: o.w || Math.min(480, Math.round(360 * W0 / H0)), gate: true, pts: {}, params: o.params, chips: o.keys.length > 1 ? chips : undefined, gx: o.gx, gy: o.gy, step: o.step, stepY: o.stepY,
      draw: function (s) {
        var P = PARENTS[o.keys.length > 1 ? s.c.fn : o.keys[0]], items = o.noGhost ? [] : curve(P.f, xr[0], xr[1], "soft", yr);
        items = items.concat(curve(o.tf(P.f, o.target), xr[0], xr[1], "orange", yr, true), curve(o.tf(P.f, s.p), xr[0], xr[1], "blue", yr));
        if (o.extra) items = items.concat(o.extra(s.p));
        if (!o.noPts) P.pts.forEach(function (pt) { if (!o.noGhost) items.push({ pt: pt, c: "soft" }); var q = o.map(pt, s.p); if (Math.abs(q[0]) <= xr[1] && Math.abs(q[1]) <= yr[1]) items.push({ pt: q, c: "blue" }); });
        return items;
      },
      readout: function (s) { return o.read(s.p) + (same(s.p) ? "<br>✓ on the target" : "<br>· not on the target yet"); },
      goal: function (s) { return same(s.p); } };
  }

  // Ticks and numbers for a number line drawn inside a sketch, at height y: nlItems(-2, 8, 0).
  function nlItems(lo, hi, y) {
    var it = [{ seg: [[lo, y], [hi, y]], c: "soft" }];
    for (var t = lo; t <= hi; t++) { it.push({ seg: [[t, y - 0.15], [t, y + 0.15]], c: "soft" }); it.push({ text: String(t), at: [t, y - 0.65], eq: true, c: "soft" }); }
    return it;
  }
  // A fraction as TeX, reduced: ratTex(6, -4) is "-\\frac{3}{2}"; whole numbers stay whole.
  function ratTex(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = L.gcd(Math.abs(n), d) || 1; n /= g; d /= g;
    return d === 1 ? String(n) : (n < 0 ? "-" : "") + "\\frac{" + Math.abs(n) + "}{" + d + "}";
  }
  // Do two dragged points both sit on y = mx + c (and differ)?
  function onLine(st, a, b, m, c) {
    var p = st.pt(a), q = st.pt(b);
    return (p.x !== q.x || p.y !== q.y) && Math.abs(p.y - (m * p.x + c)) < 1e-9 && Math.abs(q.y - (m * q.x + c)) < 1e-9;
  }
  // A complex number as TeX: cx(3, -1) is "3 - i"; cx(0, 2) is "2i".
  function cx(a, b) {
    var out = "";
    if (a !== 0 || b === 0) out += a;
    if (b !== 0) { var ab = Math.abs(b); out += (out ? (b < 0 ? " - " : " + ") : (b < 0 ? "-" : "")) + (ab === 1 ? "" : ab) + "i"; }
    return out;
  }
  // The labels of the complex plane: Re along the real axis, Im up the imaginary axis.
  function cplaneLabels(xr, yr) { return [{ text: "Re", at: [xr[1] - 0.6, 0.55], c: "soft" }, { text: "Im", at: [0.7, yr[1] - 0.4], c: "soft" }]; }
  function cplane(alt, items, o) { o = Object.assign({ x: [-6, 6], y: [-6, 6], u: 22 }, o || {}); return grid(alt, (items || []).concat(cplaneLabels(o.x, o.y)), o); }
  // Synthetic division as a picture: synfig(k, [1, -4, 1, 6], upto, hotColumn).
  // upto columns of the work are shown (0: only the set-up); the last number of the bottom row is the remainder.
  function synfig(k, co, upto, hot) {
    var n = co.length, prod = [null], sum = [co[0]], items = [], i, T = function (v) { return String(v).replace("-", "−"); };
    for (i = 1; i < n; i++) { prod[i] = sum[i - 1] * k; sum[i] = co[i] + prod[i]; }
    items.push({ text: T(k), at: [0.2, 2.1], eq: true, c: "orange" }, { seg: [[0.75, 0.1], [0.75, 2.6]], c: "soft" }, { seg: [[0.9, 0.95], [n + 1.45, 0.95]], c: "soft" });
    for (i = 0; i < n; i++) {
      var x = i + 1.5, c = hot === i ? "blue" : "ink";
      items.push({ text: T(co[i]), at: [x, 2.1], eq: true, c: "ink" });
      if (i < upto) { if (i > 0) items.push({ text: T(prod[i]), at: [x, 1.45], eq: true, c: "orange" }); items.push({ text: T(sum[i]), at: [x, 0.4], eq: true, c: i === n - 1 ? "green" : c }); }
    }
    return grid("Synthetic division of the coefficients " + co.join(", ") + " by " + k + ".", items, { grid: false, x: [-0.2, n + 1.7], y: [-0.2, 2.8], u: 34 });
  }
  function synvals(k, co) { var sum = [co[0]], i; for (i = 1; i < co.length; i++) sum.push(co[i] + sum[i - 1] * k); return sum; }

  // The keys under an expression answer.
  var KEYS_POLY = [["$x$", "x"], ["$x^2$", "x^2"], ["$x^3$", "x^3"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]];
  var LESSONS = [];
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Five quick checks", art: "ready",
    tag: "Ready?",
    blurb: "Before Chapter 3 · Multiply binomials, factor, solve $x^2 = k$, simplify a root, and use exponents.",
    mins: 6, v: 1,
    steps: [
      { type: "expr", kicker: "Check 1 · Multiply", prompt: "Multiply $(x + 2)(x - 3)$.", answer: "x^2-x-6", shown: "x^2 - x - 6", form: "simplified", skill: "Multiply binomials", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "x^2+x-6", fb: "$-3x + 2x = -x$, not $+x$." }], hints: ["First, outer, inner, last: $x^2 - 3x + 2x - 6$."], why: "$x^2 - x - 6$." },
      { type: "choice", kicker: "Check 2 · Factor", prompt: "Factor $x^2 - 5x + 6$.",
        options: [{ t: "$(x - 2)(x - 3)$" }, { t: "$(x + 2)(x + 3)$", fb: "The middle term is $-5x$: both numbers are negative." }, { t: "$(x - 1)(x - 6)$", fb: "$-1 - 6 = -7$, not $-5$." }],
        answer: 0, skill: "Factor a trinomial", hints: ["Two numbers that multiply to 6 and add to $-5$."], why: "$-2 \\cdot -3 = 6$ and $-2 + -3 = -5$." },
      { type: "choice", kicker: "Check 3 · Solve", prompt: "Solve $x^2 = 9$.",
        options: [{ t: "$x = 3$ or $x = -3$" }, { t: "$x = 3$", fb: "Both $3^2$ and $(-3)^2$ equal 9." }, { t: "$x = 4.5$", fb: "Squaring is not halving." }],
        answer: 0, skill: "Solve $x^2 = k$", hints: ["Which numbers square to 9?"], why: "$x = \\pm 3$." },
      { type: "choice", kicker: "Check 4 · Roots", prompt: "Simplify $\\sqrt{12}$.",
        options: [{ t: "$2\\sqrt{3}$" }, { t: "$3\\sqrt{2}$", fb: "$3^2 \\cdot 2 = 18$, not 12." }, { t: "$6$", fb: "$6^2 = 36$." }],
        answer: 0, skill: "Simplify a radical", hints: ["$12 = 4 \\cdot 3$."], why: "$\\sqrt{4 \\cdot 3} = 2\\sqrt{3}$." },
      { type: "num", kicker: "Check 5 · Powers", prompt: "Evaluate $(-2)^3$.", answer: -8, skill: "Evaluate an expression",
        near: [{ v: 8, fb: "An odd power keeps the minus sign." }], hints: ["$(-2)(-2)(-2)$."], why: "$-8$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 3.1**. If **check 1 or 2** slipped, Algebra I's factoring lessons help. If **check 4** slipped, start with lesson 3.1.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ============================================================ 1 · Imaginary numbers */
  var HOW_1 = [["Pull out −1", "Write $\\sqrt{-n}$ as $\\sqrt{n} \\cdot \\sqrt{-1}$."],
               ["Use i", "Replace $\\sqrt{-1}$ with $i$."],
               ["Simplify", "Simplify $\\sqrt{n}$ if you can, and write the answer as $a + bi$."]];
  LESSONS.push({
    title: "Imaginary numbers", art: "pcpoly",
    blurb: "Book 3.1 · A number whose square is $-1$, and how to write the root of any negative number.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which of these is a **real** number?",
        options: [{ t: "$\\sqrt{9}$" }, { t: "$\\sqrt{-9}$", fb: "No real number multiplied by itself gives $-9$: squares are never negative." }],
        answer: 0, skill: "Square roots", hints: ["Which number times itself gives 9? Which gives $-9$?"], why: "$\\sqrt{9} = 3$. Nothing real squares to $-9$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the point along $y = x^2$. The dashed line is $y = -4$. Can any real $x$ have $x^2 = -4$? Try **five** inputs.",
        scene: { type: "sketch", x: [-4, 4], y: [-5, 9], u: 24, w: 225, gate: true,
          pts: { P: { at: [0, 0], drag: true, c: "orange", snap: 0.5, say: "The input x", on: { fn: function (p) { var x = Math.max(-3, Math.min(3, Math.round(p[0] * 2) / 2)); return [x, x * x]; } } } },
          track: function (s) { return "x" + s.P[0]; },
          draw: function (s) { return curve(function (x) { return x * x; }, -3.2, 3.2, "blue", [-5, 9]).concat([{ seg: [[-4, -4], [4, -4]], c: "red", dash: true }, { seg: [[s.P[0], 0], [s.P[0], s.P[1]]], c: "orange", dash: true }]); },
          readout: function (s) { return "$x = " + nm(s.P[0]) + "$ gives $x^2 = " + nm(s.P[1]) + "$: never $-4$<br>Tried " + Math.min(Object.keys(s.tracked).length, 5) + " of 5"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 5; } },
        gate: true, then: "The parabola never goes below 0, so **no real number** squares to $-4$. So we invent one: **$i$**, with $i^2 = -1$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **imaginary unit** $i$ is defined by $i^2 = -1$, so $i = \\sqrt{-1}$. The square root of any negative number is a multiple of $i$: $\\sqrt{-9} = 3i$. A **complex number** is $a + bi$, with $a$ and $b$ real.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write $\\sqrt{-12}$ in standard form.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\sqrt{-12} = \\sqrt{12} \\cdot \\sqrt{-1}", say: "Split off the $-1$: it is the part that is not real." },
          { step: 2, m: "= \\sqrt{12} \\cdot i", say: "$\\sqrt{-1}$ is $i$.", ask: { prompt: "What is $\\sqrt{-1}$?", answer: 0, options: [{ t: "$i$" }, { t: "$-1$", fb: "$(-1)^2 = +1$, not $-1$. The number whose square is $-1$ is $i$." }] } },
          { step: 3, m: "\\sqrt{12} = 2\\sqrt{3}", say: "$12 = 4 \\cdot 3$, and $\\sqrt{4} = 2$." },
          { step: 3, m: "\\sqrt{-12} = 2\\sqrt{3}\\, i", say: "Standard form: $0 + 2\\sqrt{3}\\,i$." }] },
        gate: true, then: "$\\sqrt{-12} = 2\\sqrt{3}\\,i$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $\\sqrt{-20}$ in standard form.",
        how: HOW_1, skill: "Imaginary numbers",
        steps: [
          { step: 1, ask: "Split off the $-1$.", type: "choice", answer: 0, options: [{ t: "$\\sqrt{20} \\cdot \\sqrt{-1}$" }, { t: "$\\sqrt{-1} \\cdot 20$", fb: "The 20 stays under its own root: $\\sqrt{20}$." }], m: "\\sqrt{-20} = \\sqrt{20} \\cdot \\sqrt{-1}", say: "Two roots." },
          { step: 2, ask: "Replace $\\sqrt{-1}$.", type: "choice", answer: 0, options: [{ t: "$\\sqrt{20}\\, i$" }, { t: "$\\sqrt{20} - 1$", fb: "$\\sqrt{-1}$ is not $-1$: it is $i$." }], m: "= \\sqrt{20}\\, i", say: "The imaginary unit." },
          { step: 3, ask: "$\\sqrt{20} = \\sqrt{4 \\cdot 5}$. What is the whole answer?", type: "choice", answer: 0, options: [{ t: "$2\\sqrt{5}\\, i$" }, { t: "$4\\sqrt{5}\\, i$", fb: "$\\sqrt{4} = 2$, not 4." }, { t: "$5\\sqrt{2}\\, i$", fb: "$5^2 \\cdot 2 = 50$, not 20." }], m: "\\sqrt{-20} = 2\\sqrt{5}\\, i", say: "Done." }],
        why: "Pull out the minus, use $i$, simplify. Now try one." },
      { type: "choice", kicker: "On your own", prompt: "Write $\\sqrt{-49}$ in standard form.",
        options: [{ t: "$7i$" }, { t: "$-7$", fb: "$(-7)^2 = 49$, which is positive. The root of $-49$ needs $i$." }, { t: "$49i$", fb: "$\\sqrt{49} = 7$." }],
        answer: 0, skill: "Imaginary numbers", hints: ["$\\sqrt{49} \\cdot \\sqrt{-1}$."], why: "$\\sqrt{49} = 7$ and $\\sqrt{-1} = i$: $7i$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Inside a fraction. Write $\\dfrac{-3 + \\sqrt{-18}}{3}$ in standard form $a + bi$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\sqrt{-18} = \\sqrt{18} \\cdot \\sqrt{-1}", say: "Pull out the $-1$ from the root only." },
          { step: 2, m: "= \\sqrt{18}\\, i", say: "Replace $\\sqrt{-1}$." },
          { step: 3, m: "\\sqrt{18} = 3\\sqrt{2} \\quad\\Rightarrow\\quad \\frac{-3 + 3\\sqrt{2}\\, i}{3}", say: "$18 = 9 \\cdot 2$.", ask: { prompt: "What is $\\sqrt{18}$ simplified?", answer: 0, options: [{ t: "$3\\sqrt{2}$" }, { t: "$9\\sqrt{2}$", fb: "$\\sqrt{9} = 3$, not 9." }] } },
          { step: 3, m: "= -1 + \\sqrt{2}\\, i", say: "Divide **each** term on top by 3." }] },
        gate: true, then: "Divide both terms: $-1 + \\sqrt{2}\\,i$." },
      { type: "choice", kicker: "Try it", prompt: "Solve $x^2 = -16$.",
        options: [{ t: "$x = 4i$ or $x = -4i$" }, { t: "$x = 4$ or $x = -4$", fb: "$4^2 = +16$. To get $-16$ we need $i$." }, { t: "no solution at all", fb: "There is no **real** solution, but there are two complex ones: $(4i)^2 = 16i^2 = -16$." }],
        answer: 0, skill: "Imaginary numbers", hints: ["$(4i)^2 = 16 \\cdot i^2$."], why: "$x = \\pm\\sqrt{-16} = \\pm 4i$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kay says $\\sqrt{-4} \\cdot \\sqrt{-9} = \\sqrt{36} = 6$. What is wrong?",
        options: [{ t: "Turn each into $i$ first: $2i \\cdot 3i = 6i^2 = -6$." }, { t: "Nothing is wrong.", fb: "The rule $\\sqrt{a}\\sqrt{b} = \\sqrt{ab}$ needs positive $a$ and $b$. With negatives, use $i$ first." }, { t: "It should be $\\sqrt{-13}$.", fb: "Roots multiply, they do not add." }],
        answer: 0, skill: "Imaginary numbers", hints: ["$\\sqrt{-4} = 2i$ and $\\sqrt{-9} = 3i$."], why: "$2i \\cdot 3i = 6i^2 = -6$." },
      { type: "choice", kicker: "Use it", prompt: "Which equation has **no real** solution?",
        options: [{ t: "$x^2 + 9 = 0$" }, { t: "$x^2 - 9 = 0$", fb: "$x = \\pm 3$ works." }, { t: "$x^2 = 0$", fb: "$x = 0$ works." }],
        answer: 0, skill: "Imaginary numbers", hints: ["Is $x^2 = -9$ possible for a real $x$?"], why: "$x^2 = -9$ has only the complex solutions $x = \\pm 3i$." }
    ]
  });

  /* =============================================== 2 · The complex plane and adding */
  var HOW_2 = [["Real part", "The real part is the number without $i$. It goes across."],
               ["Imaginary part", "The imaginary part is the number multiplying $i$. It goes up."],
               ["Combine parts", "To add or subtract, combine the real parts, and combine the imaginary parts."]];
  LESSONS.push({
    title: "The complex plane, adding and subtracting", art: "pcpolar",
    blurb: "Book 3.1 · Plot $a + bi$ as the point $(a, b)$, and add numbers part by part.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The point $(3, 2)$ is…",
        options: [{ t: "3 across and 2 up" }, { t: "2 across and 3 up", fb: "The first number is across." }],
        answer: 0, skill: "Plot a point", hints: ["Across first, then up."], why: "$(x, y) = (3, 2)$." },
      { type: "learn", kicker: "Explore",
        prompt: "$z_1 = 2 + i$ is fixed (green). Drag $z_2$ (orange) so that the sum $z_1 + z_2$ (blue) lands on **$5 + 3i$**.",
        scene: { type: "sketch", x: [-6, 8], y: [-4, 6], u: 24, w: 360, gate: true,
          pts: { Z: { at: [-2, 3], drag: true, c: "orange", snap: 1, say: "The number z2" } },
          draw: function (s) { var z = s.Z, w = [2 + z[0], 1 + z[1]]; return [{ pt: [2, 1], c: "green" }, { seg: [[0, 0], [2, 1]], c: "green" }, { seg: [[0, 0], z], c: "orange" }, { seg: [[2, 1], w], c: "orange", dash: true }, { seg: [z, w], c: "green", dash: true }, { pt: w, c: "blue" }].concat(cplaneLabels([-6, 8], [-4, 6])); },
          readout: function (s) { var z = s.Z; return "$z_2 = " + cx(z[0], z[1]) + "$ &nbsp; $z_1 + z_2 = " + cx(2 + z[0], 1 + z[1]) + "$"; },
          goal: function (s) { return s.Z[0] === 3 && s.Z[1] === 2; } },
        gate: true, then: "$5 + 3i$: the real parts add ($2 + 3 = 5$) and the imaginary parts add ($1 + 2 = 3$). Adding complex numbers is **adding arrows**." },
      { type: "learn", kicker: "The idea",
        prompt: "A complex number $a + bi$ is the point $(a, b)$ on the **complex plane**: $a$ across (the **real** axis), $b$ up (the **imaginary** axis). To add or subtract, combine the real parts and the imaginary parts separately.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Add $(3 + 2i) + (1 - 5i)$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "3 \\ \\text{and} \\ 1", say: "The real parts: the numbers without $i$.", fig: cplane("The numbers 3 + 2i and 1 - 5i on the complex plane.", [dot(3, 2, "blue", "3 + 2i", "ne"), dot(1, -5, "orange", "1 − 5i", "se")]) },
          { step: 2, m: "2 \\ \\text{and} \\ -5", say: "The imaginary parts: the numbers multiplying $i$.", ask: { prompt: "What is the imaginary part of $1 - 5i$?", answer: 0, options: [{ t: "$-5$" }, { t: "$-5i$", fb: "The part is the number multiplying $i$, without the $i$." }] } },
          { step: 3, m: "(3 + 1) + (2 - 5)\\,i", say: "Add the real parts and the imaginary parts separately." },
          { step: 3, m: "= 4 - 3i", say: "The sum.", fig: cplane("The sum 4 - 3i drawn as the fourth corner of a parallelogram.", [dot(3, 2, "blue"), dot(1, -5, "orange"), dot(4, -3, "green", "4 − 3i", "se"), { seg: [[3, 2], [4, -3]], c: "soft", dash: true }, { seg: [[1, -5], [4, -3]], c: "soft", dash: true }]) }] },
        gate: true, then: "$(3 + 2i) + (1 - 5i) = 4 - 3i$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you subtract: $(4 - 3i) - (1 + 2i)$.",
        how: HOW_2, skill: "Add and subtract complex numbers",
        steps: [
          { step: 1, ask: "Real parts: $4 - 1$.", type: "num", pre: "real part =", answer: 3, near: [{ v: 5, fb: "It is a **subtraction**: $4 - 1$." }], hint: "$4 - 1$.", m: "4 - 1 = 3", say: "The real part." },
          { step: 2, ask: "Imaginary parts: $-3 - 2$.", type: "num", pre: "imaginary part =", answer: -5, near: [{ v: -1, fb: "$-3 - 2$: both are negative, so they add up in size." }], hint: "$-3 - 2$.", m: "-3 - 2 = -5", say: "The imaginary part." },
          { step: 3, ask: "So the answer is…", type: "choice", answer: 0, options: [{ t: "$3 - 5i$" }, { t: "$3 + 5i$", fb: "The imaginary part is $-5$." }], m: "3 - 5i", say: "Put the parts back together." }],
        why: "Real parts, imaginary parts, combine. Now plot one." },
      { type: "plane", kicker: "On your own", prompt: "Plot the complex number $2 - 3i$. Click its point.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [2, -3] }, skill: "Complex plane",
        clickFb: function (c) { return c && c[0] === -3 && c[1] === 2 ? "That is $-3 + 2i$. The **real** part goes across." : "Real part 2: across. Imaginary part $-3$: down."; },
        hints: ["Across 2, down 3."], why: "$2 - 3i$ is the point $(2, -3)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **minus** in front of brackets. Find $(5 + 2i) - (3 - 4i)$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "5 - 3 = 2", say: "Real parts: $5$ and $3$." },
          { step: 2, m: "2 - (-4) = 2 + 4 = 6", say: "Imaginary parts: $2$ and $-4$. Subtracting a negative adds.", ask: { prompt: "What is $2 - (-4)$?", answer: 0, options: [{ t: "$6$" }, { t: "$-2$", fb: "Subtracting a negative is the same as adding: $2 + 4$." }] } },
          { step: 3, m: "(5 + 2i) - (3 - 4i) = 2 + 6i", say: "The minus changes **both** signs in the second number." }] },
        gate: true, then: "$2 + 6i$." },
      { type: "choice", kicker: "Try it", prompt: "$(7 - i) + (-2 + 6i) =$",
        options: [{ t: "$5 + 5i$" }, { t: "$5 - 5i$", fb: "$-1 + 6 = +5$ for the imaginary part." }, { t: "$9 + 5i$", fb: "$7 + (-2) = 5$." }],
        answer: 0, skill: "Add and subtract complex numbers", hints: ["Real: $7 - 2$. Imaginary: $-1 + 6$."], why: "$(7 - 2) + (-1 + 6)i = 5 + 5i$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Ben subtracts $(6 + 3i) - (2 + 5i)$. Tap the line where the work **first** goes wrong.",
        lines: ["(6 + 3i) - (2 + 5i)", "= (6 - 2) + (3 - 5)i", "= 4 + 2i"], answer: 2, fix: "= 4 - 2i",
        fb: { 0: GIVEN, 1: "Subtracting the real parts and the imaginary parts separately is right." }, skill: "Add and subtract complex numbers", hints: ["$3 - 5$ is negative."], why: "$3 - 5 = -2$, so the answer is $4 - 2i$." },
      { type: "choice", kicker: "Use it", prompt: "A drone flies 3 km east and 2 km north, then 1 km east and 5 km south. Treating east as the real part and north as the imaginary part, where does it end?",
        options: [{ t: "$4 - 3i$: 4 km east and 3 km south" }, { t: "$4 + 7i$", fb: "South is **negative** imaginary: $2 - 5 = -3$." }, { t: "$2 - 3i$", fb: "$3 + 1 = 4$ east." }],
        answer: 0, skill: "Add and subtract complex numbers", hints: ["Add the east parts, add the north parts."], why: "$(3 + 1) + (2 - 5)i = 4 - 3i$." }
    ]
  });

  /* ============================================== 3 · Multiplying complex numbers */
  var HOW_3 = [["Distribute", "Multiply each part by each part (first, outer, inner, last)."],
               ["Use i² = −1", "Replace $i^2$ with $-1$."],
               ["Combine", "Collect the real parts and the imaginary parts: $a + bi$."]];
  LESSONS.push({
    title: "Multiplying complex numbers", art: "pcang",
    blurb: "Book 3.1 · Expand like binomials, then use $i^2 = -1$. Multiplying by $i$ turns a point a quarter turn.",
    mins: 12, v: 1,
    steps: [
      { type: "expr", kicker: "Warm up", prompt: "Expand $(x + 2)(x + 3)$.", answer: "x^2+5x+6", shown: "x^2 + 5x + 6", form: "simplified", skill: "Multiply binomials", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "x^2+6", fb: "Do not forget the middle terms: $3x + 2x = 5x$." }], hints: ["$x^2 + 3x + 2x + 6$."], why: "$x^2 + 5x + 6$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the point $z$. The orange point is $z$ multiplied by the number you choose. Try **all four** multipliers: $i$, $i^2$, $i^3$, $i^4$.",
        scene: { type: "sketch", x: [-5, 5], y: [-5, 5], u: 28, w: 320, gate: true,
          pts: { Z: { at: [3, 1], drag: true, c: "blue", snap: 1, say: "The number z" } },
          chips: { k: { label: "Multiply by", v: "1", opts: [["1", "$i$"], ["2", "$i^2$"], ["3", "$i^3$"], ["4", "$i^4$"]] } },
          draw: function (s) {
            var z = s.Z, k = +s.c.k, w = z, t; for (t = 0; t < k; t++) w = [-w[1], w[0]];
            return [{ seg: [[0, 0], z], c: "blue" }, { seg: [[0, 0], w], c: "orange" }, { pt: w, c: "orange" }].concat(cplaneLabels([-5, 5], [-5, 5]));
          },
          readout: function (s) { var z = s.Z, k = +s.c.k, w = z, t; for (t = 0; t < k; t++) w = [-w[1], w[0]]; return "$(" + cx(z[0], z[1]) + ") \\cdot i^{" + k + "} = " + cx(w[0], w[1]) + "$<br>Looked at " + Math.min(Object.keys(s.seen.k).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.seen.k).length >= 4; } },
        gate: true, then: "Multiplying by $i$ turns the arrow a **quarter turn** counter-clockwise. Twice ($i^2 = -1$) is a half turn; four times ($i^4 = 1$) is back where you started." },
      { type: "learn", kicker: "The idea",
        prompt: "Multiply complex numbers like binomials. The only new fact is $i^2 = -1$, which turns the $i^2$ term into a real number.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $(2 + 3i)(4 - i)$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "(2 + 3i)(4 - i) = 8 - 2i + 12i - 3i^2", say: "$2 \\cdot 4$, $2 \\cdot (-i)$, $3i \\cdot 4$, $3i \\cdot (-i)$. Note that $3i \\cdot (-i) = -3i^2$." },
          { step: 2, m: "-3i^2 = -3(-1) = 3", say: "$i^2$ becomes $-1$.", ask: { prompt: "What is $i^2$?", answer: 0, options: [{ t: "$-1$" }, { t: "$1$", fb: "$i^2 = -1$ by definition." }] } },
          { step: 3, m: "8 + 3 + (-2 + 12)\\,i", say: "Real parts: $8$ and $3$. Imaginary parts: $-2i$ and $12i$." },
          { step: 3, m: "= 11 + 10i", say: "The product." }] },
        gate: true, then: "$(2 + 3i)(4 - i) = 11 + 10i$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $(3 - 2i)(2 + 5i)$.",
        how: HOW_3, skill: "Multiply complex numbers",
        steps: [
          { step: 1, ask: "First, outer, inner, last: $6 + 15i - 4i - 10i^2$. What is the imaginary part so far, $15i - 4i$?", type: "num", pre: "imaginary =", answer: 11, near: [{ v: 19, fb: "$15 - 4 = 11$: subtract." }], hint: "$15 - 4$.", m: "6 + 15i - 4i - 10i^2", say: "Four products." },
          { step: 2, ask: "What is $-10i^2$?", type: "num", pre: "$-10i^2 =$", answer: 10, near: [{ v: -10, fb: "$i^2 = -1$, so $-10 \\cdot (-1) = +10$." }], hint: "$-10 \\cdot (-1)$.", m: "-10i^2 = 10", say: "A real number." },
          { step: 3, ask: "Real part: $6 + 10$.", type: "num", pre: "real =", answer: 16, near: [{ v: -4, fb: "Add: $6 + 10$." }], hint: "$6 + 10$.", m: "16 + 11i", say: "Real part 16, imaginary part 11." }],
        why: "Distribute, use $i^2 = -1$, combine. Now one on your own." },
      { type: "choice", kicker: "On your own", prompt: "$(1 + 2i)(3 - i) =$",
        options: [{ t: "$5 + 5i$" }, { t: "$1 + 5i$", fb: "$-2i^2 = +2$, so the real part is $3 + 2 = 5$." }, { t: "$3 - 2i$", fb: "Multiply each part by each part: there are four products." }],
        answer: 0, skill: "Multiply complex numbers", hints: ["$3 - i + 6i - 2i^2$."], why: "$3 + 5i + 2 = 5 + 5i$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Multiply a number by its **conjugate**: $(3 + 2i)(3 - 2i)$. Something special happens.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "(3 + 2i)(3 - 2i) = 9 - 6i + 6i - 4i^2", say: "The middle terms are opposites." },
          { step: 2, m: "-4i^2 = 4", say: "$i^2 = -1$.", ask: { prompt: "What happens to the two middle terms?", answer: 0, options: [{ t: "They cancel: $-6i + 6i = 0$" }, { t: "They add up to $12i$", fb: "$-6i$ and $+6i$ are opposites: they make 0." }] } },
          { step: 3, m: "9 + 4 = 13", say: "The imaginary part vanished: the product is a **real** number, $a^2 + b^2$." }] },
        gate: true, then: "$(a + bi)(a - bi) = a^2 + b^2$: always real. That is why conjugates are used to divide." },
      { type: "choice", kicker: "Try it", prompt: "$(4 + i)(4 - i) =$",
        options: [{ t: "$17$" }, { t: "$15$", fb: "$-i^2 = +1$, so it is $16 + 1$." }, { t: "$16 - i^2$ and nothing more", fb: "Finish: $i^2 = -1$." }],
        answer: 0, skill: "Multiply complex numbers", hints: ["$a^2 + b^2$ with $a = 4$, $b = 1$."], why: "$16 + 1 = 17$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia says $(2 + i)^2 = 4 + i^2 = 3$. What is wrong?",
        options: [{ t: "$(2 + i)^2 = 4 + 4i + i^2 = 3 + 4i$: she forgot the middle term." }, { t: "Nothing is wrong.", fb: "Squaring a binomial has three terms, $a^2 + 2ab + b^2$." }, { t: "It should be $5$.", fb: "$i^2 = -1$, not $+1$." }],
        answer: 0, skill: "Multiply complex numbers", hints: ["$(2 + i)(2 + i)$ has four products."], why: "$4 + 2i + 2i + i^2 = 3 + 4i$." },
      { type: "choice", kicker: "Use it", prompt: "Multiplying by $i$ turns a point a quarter turn. The point $3$ (that is, $3 + 0i$) is multiplied by $i^5$. Where does it end up?",
        options: [{ t: "At $3i$, the point $(0, 3)$" }, { t: "At $-3$", fb: "That would be $i^2$. $i^5 = i^4 \\cdot i = i$: one quarter turn." }, { t: "At $3$", fb: "That would be a whole number of full turns: $i^4$ or $i^8$." }],
        answer: 0, skill: "Multiply complex numbers", hints: ["$i^4 = 1$, so $i^5 = i$."], why: "$i^5 = i$: a quarter turn from $(3, 0)$ to $(0, 3)$." }
    ]
  });

  /* =============================================== 4 · Dividing complex numbers */
  var HOW_4 = [["Conjugate", "Find the conjugate of the bottom: change the sign of its $i$ part."],
               ["Multiply both", "Multiply the top **and** the bottom by that conjugate."],
               ["Simplify", "The bottom becomes a real number. Split the top over it."]];
  LESSONS.push({
    title: "Dividing complex numbers", art: "pcang",
    blurb: "Book 3.1 · Multiply top and bottom by the conjugate so the bottom is real.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is the **conjugate** of $3 + 2i$?",
        options: [{ t: "$3 - 2i$" }, { t: "$-3 + 2i$", fb: "Only the sign of the $i$ part changes." }, { t: "$-3 - 2i$", fb: "Changing both signs gives the opposite, not the conjugate." }],
        answer: 0, skill: "Complex conjugate", hints: ["Flip the sign in front of $i$."], why: "The conjugate of $a + bi$ is $a - bi$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag $z$. Its conjugate $\\bar{z}$ is its **mirror image** in the real axis. Look at what $z \\cdot \\bar{z}$ is for **three** different $z$.",
        scene: { type: "sketch", x: [-5, 5], y: [-5, 5], u: 28, w: 320, gate: true,
          pts: { Z: { at: [3, 2], drag: true, c: "blue", snap: 1, say: "The number z" } },
          track: function (s) { return s.Z[0] + "," + s.Z[1]; },
          draw: function (s) { var z = s.Z; return [{ seg: [[0, 0], z], c: "blue" }, { seg: [[0, 0], [z[0], -z[1]]], c: "orange" }, { seg: [z, [z[0], -z[1]]], c: "soft", dash: true }, { pt: [z[0], -z[1]], c: "orange" }].concat(cplaneLabels([-5, 5], [-5, 5])); },
          readout: function (s) { var a = s.Z[0], b = s.Z[1]; return "$z = " + cx(a, b) + "$, $\\bar{z} = " + cx(a, -b) + "$, and $z\\bar{z} = " + nm(a * a + b * b) + "$ (real!)<br>Tried " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "$z \\bar{z} = a^2 + b^2$ is **always real**. So multiplying a bottom by its conjugate gets rid of the $i$." },
      { type: "learn", kicker: "The idea",
        prompt: "To divide by a complex number, multiply the top and the bottom by the **conjugate of the bottom**. The bottom becomes the real number $a^2 + b^2$, and the quotient can be written $a + bi$.",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\dfrac{3 + 2i}{1 - i}$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "\\overline{1 - i} = 1 + i", say: "The bottom is $1 - i$: flip the sign of the $i$ part." },
          { step: 2, m: "\\frac{(3 + 2i)(1 + i)}{(1 - i)(1 + i)}", say: "Multiply top and bottom by $1 + i$: this is just multiplying by 1.", ask: { prompt: "Why multiply top **and** bottom?", answer: 0, options: [{ t: "So the value of the fraction does not change" }, { t: "To make the numbers bigger", fb: "Multiplying top and bottom by the same thing is multiplying by 1." }] } },
          { step: 3, m: "\\frac{3 + 3i + 2i + 2i^2}{1 + 1} = \\frac{1 + 5i}{2}", say: "Top: $3 + 5i - 2 = 1 + 5i$. Bottom: $1^2 + 1^2 = 2$." },
          { step: 3, m: "= \\frac{1}{2} + \\frac{5}{2}\\,i", say: "Split the top over the 2." }] },
        gate: true, then: "$\\dfrac{3 + 2i}{1 - i} = \\dfrac{1}{2} + \\dfrac{5}{2}i$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\dfrac{2 - i}{3 + 2i}$.",
        how: HOW_4, skill: "Divide complex numbers",
        steps: [
          { step: 1, ask: "What is the conjugate of the bottom?", type: "choice", answer: 0, options: [{ t: "$3 - 2i$" }, { t: "$2 + i$", fb: "The **bottom** is $3 + 2i$: use its conjugate." }], m: "\\overline{3 + 2i} = 3 - 2i", say: "Flip the $i$ sign." },
          { step: 2, ask: "The top becomes $(2 - i)(3 - 2i) = 6 - 4i - 3i + 2i^2$. What is the real part?", type: "num", pre: "real =", answer: 4, near: [{ v: 8, fb: "$2i^2 = -2$, so $6 - 2 = 4$." }], hint: "$6 + 2(-1)$.", m: "6 - 7i - 2 = 4 - 7i", say: "$-4i - 3i = -7i$." },
          { step: 3, ask: "The bottom is $3^2 + 2^2$.", type: "num", pre: "bottom =", answer: 13, near: [{ v: 5, fb: "Square each part, then add: $9 + 4$." }], hint: "$9 + 4$.", m: "\\frac{4 - 7i}{13} = \\frac{4}{13} - \\frac{7}{13}i", say: "Split the top over 13." }],
        why: "Conjugate, multiply, simplify. Now one yourself." },
      { type: "choice", kicker: "On your own", prompt: "$\\dfrac{5}{1 - 2i} =$",
        options: [{ t: "$1 + 2i$" }, { t: "$\\frac{5}{3}$", fb: "You cannot subtract the 2 from the 1: $i$ is not a number you can combine with 1." }, { t: "$5 + 10i$", fb: "Divide by the bottom, $1^2 + 2^2 = 5$." }],
        answer: 0, skill: "Divide complex numbers", hints: ["Multiply by $\\frac{1 + 2i}{1 + 2i}$: the bottom becomes 5."], why: "$\\frac{5(1 + 2i)}{5} = 1 + 2i$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A bottom that is **pure imaginary**: $\\dfrac{3}{2i}$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "\\overline{2i} = -2i", say: "The bottom is $0 + 2i$. Its conjugate flips the sign: $-2i$." },
          { step: 2, m: "\\frac{3 \\cdot (-2i)}{2i \\cdot (-2i)} = \\frac{-6i}{-4i^2}", say: "Multiply top and bottom by $-2i$.", ask: { prompt: "What is $2i \\cdot (-2i)$?", answer: 0, options: [{ t: "$-4i^2 = 4$" }, { t: "$4i^2 = -4$", fb: "The signs: $2 \\cdot (-2) = -4$, so $-4i^2 = +4$." }] } },
          { step: 3, m: "= \\frac{-6i}{4} = -\\frac{3}{2}\\,i", say: "The bottom is 4. The answer is purely imaginary." }] },
        gate: true, then: "$\\dfrac{3}{2i} = -\\dfrac{3}{2}i$. (Multiplying top and bottom by $i$ would work too.)" },
      { type: "choice", kicker: "Try it", prompt: "To divide by $4 - 3i$, multiply top and bottom by…",
        options: [{ t: "$4 + 3i$" }, { t: "$-4 + 3i$", fb: "Only the sign of the $i$ part changes." }, { t: "$4 - 3i$", fb: "That squares the bottom and keeps the $i$. Use the conjugate." }],
        answer: 0, skill: "Divide complex numbers", hints: ["Flip the sign of the $i$ part only."], why: "$(4 - 3i)(4 + 3i) = 25$: real." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ravi simplifies $\\dfrac{1}{i}$ by writing $\\dfrac{1}{i} = i$. What is wrong?",
        options: [{ t: "$\\frac{1}{i} \\cdot \\frac{i}{i} = \\frac{i}{i^2} = \\frac{i}{-1} = -i$." }, { t: "Nothing is wrong.", fb: "Check: $i \\cdot i = i^2 = -1$, not 1, so $\\frac{1}{i} \\ne i$." }, { t: "It equals $1$.", fb: "$i \\ne 1$." }],
        answer: 0, skill: "Divide complex numbers", hints: ["Multiply the top and bottom by $i$."], why: "$\\frac{1}{i} = -i$, because $i \\cdot (-i) = 1$." },
      { type: "choice", kicker: "Use it", prompt: "If $\\dfrac{a + bi}{c + di} = x$, then multiplying back, $x \\cdot (c + di)$, should give…",
        options: [{ t: "$a + bi$" }, { t: "$c + di$", fb: "Division undoes multiplication: multiplying by the bottom gives back the **top**." }, { t: "$1$", fb: "That would be $x \\cdot \\frac{1}{x}$." }],
        answer: 0, skill: "Divide complex numbers", hints: ["Division undoes multiplication."], why: "A quotient times the divisor gives back the dividend: a good way to check." }
    ]
  });
  /* ============================================================ 5 · Parabolas and vertex form */
  var HOW_5 = [["Vertex", "In $a(x - h)^2 + k$ the vertex, the turning point, is $(h, k)$."],
               ["Direction", "$a > 0$: opens up. $a < 0$: opens down. A big $|a|$ is narrow; a small one is wide."],
               ["Plot", "Plot the vertex. The axis $x = h$ is a mirror: mirror each point you find."]];
  var Q5 = function (a, h, k) { return function (x) { return a * (x - h) * (x - h) + k; }; };
  LESSONS.push({
    title: "Parabolas and vertex form", art: "pcpoly",
    blurb: "Book 3.2 · A quadratic function draws a parabola: its vertex, its direction and its mirror line.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $2(x - 1)^2 - 3$ at $x = 3$.", answer: 5, skill: "Evaluate an expression",
        near: [{ v: 9, fb: "Subtract 1 inside first: $(3 - 1)^2 = 4$." }, { v: 15, fb: "Square $(x - 1)$ first, then multiply by 2: $2 \\cdot 4 - 3$." }], hints: ["$2(2)^2 - 3$."], why: "$2 \\cdot 4 - 3 = 5$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $a$, $h$ and $k$ to land the blue parabola on the dashed one. Watch what each number does.",
        scene: morph({ keys: ["sq"], x: [-7, 7], y: [-7, 7], u: 22, params: { a: { min: -3, max: 3, step: 1, v: 1, label: "$a$" }, h: { min: -5, max: 5, step: 1, v: 0, label: "$h$" }, k: { min: -5, max: 5, step: 1, v: 0, label: "$k$" } },
          tf: function (f, p) { return Q5(p.a, p.h, p.k); }, map: function (pt, p) { return [pt[0] + p.h, p.a * pt[1] + p.k]; }, target: { a: -1, h: 2, k: 3 },
          extra: function (p) { return [{ seg: [[p.h, -7], [p.h, 7]], c: "purple", dash: true }, { pt: [p.h, p.k], c: "orange" }]; },
          read: function (p) { return p.a === 0 ? "$a = 0$: no longer a parabola, just a line" : "$y = " + (p.a === 1 ? "" : p.a === -1 ? "-" : nm(p.a)) + "(x " + (p.h < 0 ? "+ " + nm(-p.h) : "- " + nm(p.h)) + ")^2 " + (p.k < 0 ? "- " + nm(-p.k) : "+ " + nm(p.k)) + "$: vertex $(" + nm(p.h) + ",\\ " + nm(p.k) + ")$, opens " + (p.a > 0 ? "up" : "down"); } }),
        gate: true, then: "$y = -(x - 2)^2 + 3$: vertex $(2, 3)$, opening **down**. The purple dashed line, $x = 2$, is the **axis of symmetry**." },
      { type: "learn", kicker: "The idea",
        prompt: "A **quadratic function** $y = a(x - h)^2 + k$ draws a **parabola**. Its **vertex** is $(h, k)$. The vertical line $x = h$ is its **axis of symmetry**: one side is the mirror image of the other.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph $y = 2(x - 1)^2 - 3$.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "h = 1, \\quad k = -3", say: "Vertex $(1, -3)$.", fig: plot("The vertex at (1, -3).", [], [dot(1, -3, "orange", "(1, −3)", "s")], { x: [-3, 5], y: [-5, 7], u: 22 }) },
          { step: 2, m: "a = 2 > 0", say: "Opens **up**, and narrower than $y = x^2$.", ask: { prompt: "Which way does it open?", answer: 0, options: [{ t: "Up" }, { t: "Down", fb: "$a$ is positive: up." }] } },
          { step: 3, m: "x = 2: \\ y = 2(1)^2 - 3 = -1", say: "Find one point, say $x = 2$: $(2, -1)$. The mirror line $x = 1$ gives $(0, -1)$ for free.", fig: plot("The vertex (1, -3) with the points (2, -1) and (0, -1) on either side.", [], [dot(1, -3, "orange"), dot(2, -1, "blue", "(2, −1)", "e"), dot(0, -1, "blue", "(0, −1)", "w"), { seg: [[1, -5], [1, 7]], c: "purple", dash: true }], { x: [-3, 5], y: [-5, 7], u: 22 }) },
          { step: 3, m: "\\text{draw the U through them}", say: "Join the vertex and the pairs of points with a smooth U.", fig: plot("The parabola y = 2(x - 1)^2 - 3.", [{ f: Q5(2, 1, -3), a: -2, b: 4, c: "blue", yr: [-5, 7] }], [dot(1, -3, "orange"), dot(2, -1, "blue"), dot(0, -1, "blue"), dot(3, 5, "blue")], { x: [-3, 5], y: [-5, 7], u: 22 }) }] },
        gate: true, then: "Vertex $(1, -3)$, up, narrow, symmetric about $x = 1$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $y = -(x + 2)^2 + 4$.",
        how: HOW_5, skill: "Parabolas",
        steps: [
          { step: 1, ask: "What is the vertex?", type: "choice", answer: 0, options: [{ t: "$(-2,\\ 4)$" }, { t: "$(2,\\ 4)$", fb: "$x + 2 = x - (-2)$: $h = -2$." }, { t: "$(4,\\ -2)$", fb: "The vertex is $(h, k)$: $h$ first." }], m: "(h,\\ k) = (-2,\\ 4)", say: "The sign inside looks backwards, as with shifts." },
          { step: 2, ask: "$a = -1$. Which way does it open?", type: "choice", answer: 0, options: [{ t: "Down" }, { t: "Up", fb: "A negative $a$ flips it." }], m: "a = -1 \\ \\Rightarrow \\ \\text{down}", say: "So the vertex is the **highest** point." },
          { step: 3, ask: "At $x = -1$, $y = -(1)^2 + 4$. What is $y$?", type: "num", pre: "$y =$", answer: 3, near: [{ v: 5, fb: "$-(1)^2 = -1$: $-1 + 4 = 3$." }], hint: "$-1 + 4$.", m: "(-1,\\ 3) \\ \\text{and its mirror } (-3,\\ 3)", say: "The axis $x = -2$ gives the mirror point for free." }],
        why: "Vertex, direction, plot. Now another." },
      { type: "choice", kicker: "On your own", prompt: "What is the vertex of $y = 3(x - 4)^2 + 1$?",
        options: [{ t: "$(4,\\ 1)$" }, { t: "$(-4,\\ 1)$", fb: "$x - 4 = 0$ at $x = 4$." }, { t: "$(4,\\ 3)$", fb: "3 is $a$, the steepness. The number added is $k$." }],
        answer: 0, skill: "Parabolas", hints: ["$h$ from $(x - 4)$, $k$ is added."], why: "$h = 4$ and $k = 1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Go **backwards**. A parabola has vertex $(1, 2)$ and passes through $(3, 10)$. Write its equation.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "y = a(x - 1)^2 + 2", say: "The vertex gives $h = 1$ and $k = 2$. Only $a$ is unknown.", fig: plot("The vertex (1, 2) and the point (3, 10).", [], [dot(1, 2, "orange", "(1, 2)", "s"), dot(3, 10, "blue", "(3, 10)", "ne")], { x: [-3, 6], y: [-1, 12], u: 22 }) },
          { step: 2, m: "10 = a(3 - 1)^2 + 2", say: "Put the other point in: $x = 3$, $y = 10$.", ask: { prompt: "What is $(3 - 1)^2$?", answer: 0, options: [{ t: "$4$" }, { t: "$2$", fb: "Square it: $2^2 = 4$." }] } },
          { step: 3, m: "10 = 4a + 2 \\ \\Rightarrow \\ a = 2", say: "$4a = 8$." },
          { step: 3, m: "y = 2(x - 1)^2 + 2", say: "Opens up, as the point is above the vertex.", fig: plot("The parabola y = 2(x - 1)^2 + 2.", [{ f: Q5(2, 1, 2), a: -1, b: 3.2, c: "blue", yr: [-1, 12] }], [dot(1, 2, "orange"), dot(3, 10, "blue")], { x: [-3, 6], y: [-1, 12], u: 22 }) }] },
        gate: true, then: "Vertex plus one point is enough to write the equation." },
      { type: "choice", kicker: "Try it", prompt: "The parabola $y = (x - 5)^2 + 1$ has the axis of symmetry…",
        options: [{ t: "$x = 5$" }, { t: "$x = 1$", fb: "1 is $k$: the height of the vertex." }, { t: "$x = -5$", fb: "$x - 5 = 0$ at $x = 5$." }],
        answer: 0, skill: "Parabolas", hints: ["The mirror line passes through the vertex."], why: "$x = h = 5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dan says the vertex of $y = (x + 3)^2 - 2$ is $(3, -2)$. What is wrong?",
        options: [{ t: "$x + 3 = 0$ at $x = -3$: the vertex is $(-3, -2)$." }, { t: "Nothing is wrong.", fb: "Test $x = 3$: $y = 34$. The lowest value is at $x = -3$." }, { t: "The vertex is $(-3, 2)$.", fb: "$k$ is $-2$: the number added or subtracted outside." }],
        answer: 0, skill: "Parabolas", hints: ["Where is the inside equal to 0?"], why: "The vertex is where the inside is zero." },
      { type: "choice", kicker: "Use it", prompt: "A satellite dish is the parabola $y = 0.5(x - 2)^2$. Where is the **centre** of the dish, its lowest point?",
        options: [{ t: "At $x = 2$" }, { t: "At $x = 0.5$", fb: "0.5 is $a$: how wide the dish is." }, { t: "At $x = -2$", fb: "$x - 2 = 0$ at $x = 2$." }],
        answer: 0, skill: "Parabolas", hints: ["The vertex."], why: "The vertex $(2, 0)$ is the lowest point." }
    ]
  });

  /* ================================================== 6 · The vertex and the extreme value */
  var HOW_6 = [["Find h", "For $ax^2 + bx + c$ the vertex is at $h = -\\dfrac{b}{2a}$."],
               ["Find k", "Put $x = h$ into the function: $k = f(h)$."],
               ["Say it", "$a > 0$: the vertex is the **minimum**. $a < 0$: the **maximum**. The range starts or ends at $k$."]];
  var Q6 = function (x) { return x * x - 4 * x + 3; };
  LESSONS.push({
    title: "The vertex and the extreme value", art: "pcpoly",
    blurb: "Book 3.2 · Find the top or bottom of a parabola from $ax^2 + bx + c$, and its domain and range.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The points $(1, 5)$ and $(7, 5)$ are on a parabola. Where is its axis of symmetry? Give $x$.", pre: "$x =$", answer: 4, skill: "Midpoint",
        near: [{ v: 6, fb: "That is the distance between them. The axis is **halfway**." }, { v: 5, fb: "5 is the height. Find the middle of 1 and 7." }], hints: ["The middle of 1 and 7."], why: "$\\frac{1 + 7}{2} = 4$." },
      { type: "learn", kicker: "Explore",
        prompt: "$f(x) = x^2 - 4x + 3$. Slide the point. Its orange **mirror twin** is at the same height. Where is the vertex compared with the **two**? Try three positions.",
        scene: { type: "sketch", x: [-1, 5], y: [-2, 8], u: 34, w: 234, gate: true,
          pts: { P: { at: [0, 3], drag: true, c: "blue", snap: 1, say: "The point P", on: { fn: function (p) { var x = Math.max(0, Math.min(4, Math.round(p[0]))); return [x, Q6(x)]; } } } },
          track: function (s) { return s.P[0] === 2 ? null : "x" + s.P[0]; },
          draw: function (s) { var x = s.P[0], y = Q6(x), m = 4 - x; return curve(Q6, -1, 5, "soft", [-2, 8]).concat([{ seg: [[x, y], [m, y]], c: "orange", dash: true }, { pt: [m, y], c: "orange" }, { pt: [2, y], c: "green" }, { seg: [[2, -2], [2, 8]], c: "purple", dash: true }, { pt: [2, -1], c: "ink" }]); },
          readout: function (s) { var x = s.P[0], m = 4 - x; return x === 2 ? "$P$ is the vertex itself: its twin is itself." : "$x = " + nm(x) + "$ and its twin $x = " + nm(m) + "$ have the same height. Halfway: $\\frac{" + nm(x) + " + " + nm(m) + "}{2} = 2$<br>Tried " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "The vertex is always **halfway between two points of equal height**. That halfway $x$ comes out as $-\\dfrac{b}{2a}$, which is $-\\dfrac{-4}{2} = 2$ here." },
      { type: "learn", kicker: "The idea",
        prompt: "For $f(x) = ax^2 + bx + c$ the vertex is at $x = h = -\\dfrac{b}{2a}$, and its height is $k = f(h)$. If $a > 0$ it is the **lowest** point, the minimum; if $a < 0$ it is the **highest**, the maximum.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the vertex of $f(x) = 2x^2 - 8x + 5$ and say its domain and range.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "a = 2, \\ b = -8 \\quad h = -\\frac{-8}{2(2)} = 2", say: "Read $a$ and $b$. The minus signs cancel: $h = \\frac{8}{4}$." },
          { step: 2, m: "k = f(2) = 2(4) - 16 + 5 = -3", say: "Put $x = 2$ into $f$.", ask: { prompt: "What is $f(2) = 2(2)^2 - 8(2) + 5$?", answer: 0, options: [{ t: "$-3$" }, { t: "$13$", fb: "$2 \\cdot 4 = 8$, then $8 - 16 = -8$, then $-8 + 5 = -3$." }] } },
          { step: 3, m: "\\text{vertex } (2,\\ -3) \\quad a > 0 \\ \\Rightarrow \\ \\text{minimum}", say: "The parabola opens up, so $-3$ is the lowest value." },
          { step: 3, m: "\\text{domain } (-\\infty,\\ \\infty) \\quad \\text{range } [\\,-3,\\ \\infty)", say: "Every $x$ works. The outputs start at the minimum and rise." }] },
        gate: true, then: "Minimum $-3$ at $x = 2$. Range: $[-3, \\infty)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $f(x) = -x^2 + 6x - 5$.",
        how: HOW_6, skill: "Vertex of a quadratic",
        steps: [
          { step: 1, ask: "$a = -1$, $b = 6$. Find $h = -\\frac{b}{2a}$.", type: "num", pre: "$h =$", answer: 3, near: [{ v: -3, fb: "$-\\frac{6}{2(-1)} = -\\frac{6}{-2} = +3$." }], hint: "$-\\frac{6}{-2}$.", m: "h = -\\frac{6}{2(-1)} = 3", say: "A negative over a negative." },
          { step: 2, ask: "Find $k = f(3) = -9 + 18 - 5$.", type: "num", pre: "$k =$", answer: 4, near: [{ v: -14, fb: "$-9 + 18 = 9$, and $9 - 5 = 4$." }], hint: "$-9 + 18 - 5$.", m: "k = 4", say: "The height of the vertex." },
          { step: 3, ask: "$a < 0$: is $(3, 4)$ the highest or the lowest point?", type: "choice", answer: 0, options: [{ t: "The highest: a maximum" }, { t: "The lowest: a minimum", fb: "A negative $a$ opens it down: the vertex is the top." }], m: "\\text{max } 4 \\quad \\text{range } (-\\infty,\\ 4\\,]", say: "The range runs from $-\\infty$ up to 4." }],
        why: "Find $h$, find $k$, say it. Now one more." },
      { type: "num", kicker: "On your own", prompt: "What is the **minimum value** of $f(x) = x^2 - 6x + 4$?", answer: -5, skill: "Vertex of a quadratic",
        near: [{ v: 3, fb: "3 is where the minimum happens ($h$). The minimum **value** is $f(3)$." }, { v: 4, fb: "4 is $f(0)$, the intercept." }], hints: ["$h = 3$. Then $f(3)$."], why: "$f(3) = 9 - 18 + 4 = -5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A vertex with **fractions**. Find the vertex of $f(x) = 2x^2 + 6x + 1$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "h = -\\frac{6}{2(2)} = -\\frac{3}{2}", say: "$-\\frac{6}{4}$, which is $-\\frac{3}{2}$.", ask: { prompt: "Is $h$ a whole number here?", answer: 0, options: [{ t: "No: it is $-1.5$, and that is fine" }, { t: "Yes, $-3$", fb: "$\\frac{6}{4} = 1.5$." }] } },
          { step: 2, m: "k = 2\\left(\\tfrac{9}{4}\\right) - 9 + 1 = \\tfrac{9}{2} - 8 = -\\tfrac{7}{2}", say: "$\\left(-\\frac{3}{2}\\right)^2 = \\frac{9}{4}$, and $6 \\cdot (-\\frac{3}{2}) = -9$." },
          { step: 3, m: "\\text{vertex } \\left(-\\tfrac{3}{2},\\ -\\tfrac{7}{2}\\right)", say: "A minimum, since $a = 2 > 0$." }] },
        gate: true, then: "The vertex need not be on whole numbers." },
      { type: "choice", kicker: "Try it", prompt: "What is the range of $f(x) = -2x^2 + 8x$?",
        options: [{ t: "$(-\\infty,\\ 8]$" }, { t: "$[\\,8,\\ \\infty)$", fb: "A negative $a$ opens it down: it has a maximum, not a minimum." }, { t: "$(-\\infty,\\ 4]$", fb: "$h = 2$, but $k = f(2) = -8 + 16 = 8$. The range uses $k$." }],
        answer: 0, skill: "Vertex of a quadratic", hints: ["$h = 2$, $k = f(2)$."], why: "Vertex $(2, 8)$ is the maximum: range $(-\\infty, 8]$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana finds the vertex of $f(x) = x^2 + 4x + 1$ as $h = \\frac{4}{2} = 2$. What is wrong?",
        options: [{ t: "$h = -\\frac{b}{2a} = -\\frac{4}{2} = -2$: she forgot the minus sign." }, { t: "Nothing is wrong.", fb: "Check: $f(2) = 13$ but $f(-2) = -3$: the minimum is at $-2$." }, { t: "$h$ should be 4.", fb: "$2a = 2$, so $-\\frac{4}{2} = -2$." }],
        answer: 0, skill: "Vertex of a quadratic", hints: ["$h = -\\frac{b}{2a}$: the minus is part of the formula."], why: "$h = -2$." },
      { type: "num", kicker: "Use it", prompt: "A ball's height is $h(t) = -5t^2 + 20t$ metres. What is its **greatest height**?", post: "metres", answer: 20, skill: "Vertex of a quadratic",
        near: [{ v: 2, fb: "2 seconds is when it happens. The greatest **height** is $h(2)$." }], hints: ["$t = -\\frac{20}{2(-5)} = 2$. Then $h(2)$."], why: "$h(2) = -20 + 40 = 20$ metres." }
    ]
  });

  /* ===================================================== 7 · Zeros of a quadratic */
  var HOW_7 = [["Set to zero", "Set $f(x) = 0$ and write it as $ax^2 + bx + c = 0$."],
               ["Solve", "Factor if you can. Otherwise use $x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$."],
               ["Read them", "The solutions are the $x$-intercepts, where the parabola crosses the axis."]];
  LESSONS.push({
    title: "Zeros of a quadratic", art: "pcpoly",
    blurb: "Book 3.2 · Where a parabola meets the $x$-axis: factoring, the quadratic formula, and what the discriminant says.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Solve $(x - 2)(x - 3) = 0$.",
        options: [{ t: "$x = 2$ or $x = 3$" }, { t: "$x = -2$ or $x = -3$", fb: "$x - 2 = 0$ gives $x = 2$." }, { t: "$x = 6$", fb: "A product is zero when **a factor** is zero." }],
        answer: 0, skill: "Zero product", hints: ["Set each factor to 0."], why: "$x - 2 = 0$ or $x - 3 = 0$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $b$ and $c$ in $y = x^2 + bx + c$. Find a parabola that crosses the $x$-axis **twice**, one that **just touches** it, and one that **misses** it.",
        scene: { type: "sketch", x: [-7, 7], y: [-6, 10], u: 20, w: 320, gate: true, pts: {},
          params: { b: { min: -6, max: 6, step: 1, v: 0, label: "$b$" }, c: { min: -4, max: 9, step: 1, v: 0, label: "$c$" } },
          track: function (s) { var d = s.p.b * s.p.b - 4 * s.p.c; return d > 0 ? "two" : d === 0 ? "one" : "none"; },
          draw: function (s) {
            var b = s.p.b, c = s.p.c, d = b * b - 4 * c, items = curve(function (x) { return x * x + b * x + c; }, -7, 7, "blue", [-6, 10]);
            if (d >= 0) { var r = Math.sqrt(d); items.push({ pt: [(-b - r) / 2, 0], c: "green" }); if (d > 0) items.push({ pt: [(-b + r) / 2, 0], c: "green" }); }
            return items;
          },
          readout: function (s) { var b = s.p.b, c = s.p.c, d = b * b - 4 * c; return "$b^2 - 4c = " + nm(d) + "$: " + (d > 0 ? "**two** zeros" : d === 0 ? "**one** zero (it touches)" : "**no real** zeros") + "<br>" + (s.tracked.two ? "✓ " : "· ") + "two &nbsp; " + (s.tracked.one ? "✓ " : "· ") + "one &nbsp; " + (s.tracked.none ? "✓ " : "· ") + "none"; },
          goal: function (s) { return s.tracked.two && s.tracked.one && s.tracked.none; } },
        gate: true, then: "The number $b^2 - 4ac$, the **discriminant**, decides: positive: two real zeros; zero: one; negative: none." },
      { type: "learn", kicker: "The idea",
        prompt: "A **zero** of $f$ is an input where $f(x) = 0$: where the graph meets the $x$-axis. For a quadratic, **factor**, or use the **quadratic formula** $x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the zeros of $f(x) = x^2 - 5x + 6$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "x^2 - 5x + 6 = 0", say: "Set the function equal to 0.", fig: plot("The parabola x squared minus 5x plus 6 crossing the x-axis at 2 and 3.", [{ f: function (x) { return x * x - 5 * x + 6; }, a: 0.5, b: 4.5, c: "blue", yr: [-2, 8] }], [], { x: [-1, 6], y: [-2, 8], u: 24 }) },
          { step: 2, m: "(x - 2)(x - 3) = 0", say: "Two numbers that multiply to 6 and add to $-5$: $-2$ and $-3$.", ask: { prompt: "Which numbers multiply to 6 and add to $-5$?", answer: 0, options: [{ t: "$-2$ and $-3$" }, { t: "$2$ and $3$", fb: "They add to $+5$." }] } },
          { step: 2, m: "x - 2 = 0 \\quad\\text{or}\\quad x - 3 = 0", say: "A product is zero when a factor is zero." },
          { step: 3, m: "x = 2 \\quad\\text{or}\\quad x = 3", say: "The $x$-intercepts: $(2, 0)$ and $(3, 0)$.", fig: plot("The zeros at (2, 0) and (3, 0).", [{ f: function (x) { return x * x - 5 * x + 6; }, a: 0.5, b: 4.5, c: "blue", yr: [-2, 8] }], [dot(2, 0, "green", "2", "s"), dot(3, 0, "green", "3", "s")], { x: [-1, 6], y: [-2, 8], u: 24 }) }] },
        gate: true, then: "Zeros $x = 2$ and $x = 3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you use the formula on $x^2 - 4x - 1 = 0$. It does not factor.",
        how: HOW_7, skill: "Zeros of a quadratic",
        steps: [
          { step: 1, ask: "Read $a$, $b$ and $c$. What is $b$?", type: "num", pre: "$b =$", answer: -4, near: [{ v: 4, fb: "Keep the sign: $-4x$ means $b = -4$." }], hint: "The number in front of $x$, with its sign.", m: "a = 1, \\ b = -4, \\ c = -1", say: "Careful with signs." },
          { step: 2, ask: "The discriminant $b^2 - 4ac = 16 - 4(1)(-1)$.", type: "num", pre: "$b^2 - 4ac =$", answer: 20, near: [{ v: 12, fb: "$-4(1)(-1) = +4$: $16 + 4 = 20$." }], hint: "$16 + 4$.", m: "x = \\frac{4 \\pm \\sqrt{20}}{2}", say: "$-b = 4$." },
          { step: 3, ask: "$\\sqrt{20} = 2\\sqrt{5}$. Simplify $\\frac{4 \\pm 2\\sqrt{5}}{2}$.", type: "choice", answer: 0, options: [{ t: "$2 \\pm \\sqrt{5}$" }, { t: "$4 \\pm \\sqrt{5}$", fb: "Divide **both** terms on top by 2." }], m: "x = 2 \\pm \\sqrt{5}", say: "About $4.24$ and $-0.24$." }],
        why: "Set to zero, solve, read. Now one on your own." },
      { type: "choice", kicker: "On your own", prompt: "Solve $x^2 + 2x - 8 = 0$.",
        options: [{ t: "$x = 2$ or $x = -4$" }, { t: "$x = -2$ or $x = 4$", fb: "Check: $(-2)^2 + 2(-2) - 8 = -8$." }, { t: "$x = 8$ or $x = -1$", fb: "Two numbers that multiply to $-8$ and add to $2$: $4$ and $-2$." }],
        answer: 0, skill: "Zeros of a quadratic", hints: ["$(x + 4)(x - 2)$."], why: "$(x + 4)(x - 2) = 0$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A negative discriminant. Solve $x^2 + 2x + 5 = 0$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "a = 1, \\ b = 2, \\ c = 5", say: "Does it factor? Two numbers multiplying to 5 and adding to 2: none." },
          { step: 2, m: "b^2 - 4ac = 4 - 20 = -16", say: "The discriminant is **negative**.", ask: { prompt: "What does a negative discriminant mean?", answer: 0, options: [{ t: "The parabola misses the $x$-axis: no real zeros" }, { t: "Two real zeros", fb: "$\\sqrt{-16}$ is not real." }] } },
          { step: 2, m: "x = \\frac{-2 \\pm \\sqrt{-16}}{2} = \\frac{-2 \\pm 4i}{2}", say: "$\\sqrt{-16} = 4i$." },
          { step: 3, m: "x = -1 \\pm 2i", say: "Two **complex** zeros. The graph never meets the $x$-axis, but the equation still has solutions." }] },
        gate: true, then: "No real $x$-intercepts, but two complex solutions: $-1 + 2i$ and $-1 - 2i$." },
      { type: "choice", kicker: "Try it", prompt: "$x^2 - 6x + 9 = 0$ has how many real zeros?",
        options: [{ t: "One: $x = 3$ (the parabola just touches the axis)" }, { t: "Two", fb: "$(x - 3)(x - 3)$: both factors give the same zero." }, { t: "None", fb: "$b^2 - 4ac = 36 - 36 = 0$: one zero, not none." }],
        answer: 0, skill: "Zeros of a quadratic", hints: ["$b^2 - 4ac = 0$."], why: "$(x - 3)^2 = 0$: a double zero." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lia uses the formula for $x^2 - 3x - 4 = 0$ with $b = 3$. What is wrong?",
        options: [{ t: "$b = -3$: the sign belongs to the number. Then $-b = 3$." }, { t: "Nothing is wrong.", fb: "The term is $-3x$, so $b = -3$." }, { t: "$b = 4$.", fb: "4 is $c$ (with its sign: $-4$)." }],
        answer: 0, skill: "Zeros of a quadratic", hints: ["Read $b$ with its sign."], why: "$x = \\frac{3 \\pm 5}{2}$: $x = 4$ or $x = -1$." },
      { type: "choice", kicker: "Use it", prompt: "A ball's height is $h(t) = -5t^2 + 20t$. When does it hit the ground, $h = 0$, **after** being thrown?",
        options: [{ t: "At $t = 4$ seconds" }, { t: "At $t = 0$ seconds", fb: "That is when it is thrown: also a zero, but not the landing." }, { t: "At $t = 2$ seconds", fb: "2 s is the top of the flight, not the landing." }],
        answer: 0, skill: "Zeros of a quadratic", hints: ["$-5t(t - 4) = 0$."], why: "$t = 0$ (thrown) or $t = 4$ (lands)." }
    ]
  });

  /* ======================================================= 8 · Quadratic models */
  var HOW_8 = [["Write it", "Write the quantity as a quadratic function of one variable."],
               ["Vertex", "$h = -\\dfrac{b}{2a}$, then $k = f(h)$."],
               ["Answer", "$h$ is the input that gives the best output, $k$. Say both, with units."]];
  var H8 = function (t) { return 4 * t - t * t; };
  LESSONS.push({
    title: "Quadratic models", art: "pcpoly",
    blurb: "Book 3.2 · Greatest area, most profit, highest point: the vertex answers them all.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A rectangle has width $w$ and length $10 - w$. What is its area when $w = 3$?", answer: 21, skill: "Evaluate a function",
        near: [{ v: 7, fb: "That is the length. Area = width $\\times$ length: $3 \\cdot 7$." }], hints: ["$3 \\cdot 7$."], why: "$3 \\cdot 7 = 21$." },
      { type: "learn", kicker: "Explore",
        prompt: "A ball is tossed up: $h(t) = 4t - t^2$ metres after $t$ seconds. Slide the time to find the **highest point**.",
        scene: slide(H8, { x: [-1, 5], y: [-1, 6], from: 0, snap: 0.5, xlim: [0, 4], u: 40, name: "h",
          goal: function (s) { return s.P[1] === 4; },
          read: function (x, y) { return "$h(" + nm(x) + ") = " + nm(y) + "$ metres" + (y === 4 ? " ✓ the top!" : ""); } }),
        gate: true, then: "The top is $h(2) = 4$: the **vertex**. Time $t = 2$ s, height 4 m: that is the answer to “when” and “how high”." },
      { type: "learn", kicker: "The idea",
        prompt: "Many situations are quadratic: area, revenue, projectiles. Write the quantity as $f(x) = ax^2 + bx + c$. The **vertex** is the **best** value: the most area, the most revenue, the greatest height.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "A shop sells $100 - 2p$ items a month at price $p$ dollars. What price gives the most revenue?",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "R(p) = p(100 - 2p) = -2p^2 + 100p", say: "Revenue is price times number sold." },
          { step: 2, m: "p = -\\frac{100}{2(-2)} = 25", say: "$a = -2$, $b = 100$.", ask: { prompt: "Is the vertex a maximum or a minimum?", answer: 0, options: [{ t: "A maximum: $a < 0$" }, { t: "A minimum", fb: "A negative $a$ makes the parabola open down: the vertex is the top." }] } },
          { step: 2, m: "R(25) = -2(625) + 2500 = 1250", say: "The revenue at that price." },
          { step: 3, m: "\\text{price } 25 \\ \\text{dollars, revenue } 1250 \\ \\text{dollars}", say: "The best price, and what it earns." }] },
        gate: true, then: "Charge 25 dollars: the most revenue is 1250 dollars." },
      { type: "guided", kicker: "Together",
        prompt: "Now you fence a rectangle. You have 40 m of fence. If the width is $w$, the length is $20 - w$. Find the width with the greatest area.",
        how: HOW_8, skill: "Quadratic models",
        steps: [
          { step: 1, ask: "Which is the area function?", type: "choice", answer: 0, options: [{ t: "$A(w) = w(20 - w) = -w^2 + 20w$" }, { t: "$A(w) = 2w + 2(20 - w)$", fb: "That is the perimeter, always 40. Area is width times length." }], m: "A(w) = -w^2 + 20w", say: "Width times length." },
          { step: 2, ask: "Find $w = -\\frac{b}{2a}$ with $a = -1$, $b = 20$.", type: "num", pre: "$w =$", answer: 10, near: [{ v: -10, fb: "$-\\frac{20}{-2} = +10$." }], hint: "$-\\frac{20}{-2}$.", m: "w = 10", say: "A square." },
          { step: 3, ask: "The greatest area is $A(10) = -100 + 200$.", type: "num", pre: "area =", post: "m²", answer: 100, near: [{ v: 10, fb: "10 is the width. The area is $A(10)$." }], hint: "$-100 + 200$.", m: "A(10) = 100", say: "100 square metres." }],
        why: "Write it, find the vertex, answer. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "A ball's height in feet is $h(t) = -16t^2 + 64t$. How many seconds until it is at its highest?", post: "seconds", answer: 2, skill: "Quadratic models",
        near: [{ v: 64, fb: "64 feet is the **greatest height**, found with $h(2)$." }, { v: 4, fb: "4 seconds is when it lands. The top is halfway." }], hints: ["$t = -\\frac{64}{2(-16)}$."], why: "$t = 2$; the height there is 64 feet." },
      { type: "learn", kicker: "A harder case",
        prompt: "When does it **land**? Use $h(t) = -16t^2 + 64t$ again, but set $h = 0$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "-16t^2 + 64t = 0", say: "On the ground the height is 0." },
          { step: 2, m: "-16t(t - 4) = 0", say: "Factor out $-16t$.", ask: { prompt: "What is left in the bracket?", answer: 0, options: [{ t: "$t - 4$" }, { t: "$t + 4$", fb: "$-16t \\cdot (-4) = +64t$: so the bracket is $t - 4$." }] } },
          { step: 3, m: "t = 0 \\quad\\text{or}\\quad t = 4", say: "$t = 0$ is the throw. $t = 4$ is the landing: 4 seconds in the air. The top, at $t = 2$, is halfway." }] },
        gate: true, then: "The flight lasts 4 seconds, and the peak is at the **midpoint of the two zeros**." },
      { type: "choice", kicker: "Try it", prompt: "$R(x) = -5x^2 + 60x$ is the revenue in dollars when the price is $x$. Which price gives the maximum?",
        options: [{ t: "$x = 6$" }, { t: "$x = 180$", fb: "180 is the maximum **revenue** $R(6)$." }, { t: "$x = 12$", fb: "12 is where revenue falls back to 0." }],
        answer: 0, skill: "Quadratic models", hints: ["$x = -\\frac{60}{2(-5)}$."], why: "$x = 6$, and $R(6) = 180$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Pia says the answer to “how high does the ball go?” is the $t$-value of the vertex. What is wrong?",
        options: [{ t: "The $t$-value says **when**. How high is the output: $h$ at that time." }, { t: "Nothing is wrong.", fb: "The vertex $(t, h)$ has two numbers: time and height." }, { t: "It is the $y$-intercept.", fb: "The $y$-intercept is the height at $t = 0$." }],
        answer: 0, skill: "Quadratic models", hints: ["Which axis holds the height?"], why: "Height is the second coordinate, $k$." },
      { type: "num", kicker: "Use it", prompt: "A farmer has 60 m of fence for a rectangle against a long wall (so only 3 sides need fence): width $w$, length $60 - 2w$. The area is $A(w) = 60w - 2w^2$. What width gives the greatest area?", post: "metres", answer: 15, skill: "Quadratic models",
        near: [{ v: 450, fb: "450 is the greatest **area**, $A(15)$." }, { v: 30, fb: "That is the length at the best width." }], hints: ["$w = -\\frac{60}{2(-2)}$."], why: "$w = 15$, length 30, area $450$ m²." }
    ]
  });
  /* ======================================================= 9 · Power functions and end behavior */
  var HOW_9 = [["Even or odd", "Is the power even or odd?"],
               ["The sign", "Is the coefficient positive or negative?"],
               ["Read the ends", "Even, positive: both ends up. Even, negative: both down. Odd, positive: down at the left, up at the right. Odd, negative: the reverse."]];
  function ends(n, pos) {                                   // the end behaviour of a x^n
    var even = n % 2 === 0, l = even ? pos : !pos, r = pos;
    return { l: l ? "\\infty" : "-\\infty", r: r ? "\\infty" : "-\\infty" };
  }
  LESSONS.push({
    title: "Power functions and end behavior", art: "pcpoly",
    blurb: "Book 3.3 · $f(x) = ax^n$: what the two ends of the graph do.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $(-3)^4$ positive or negative?",
        options: [{ t: "positive: $81$" }, { t: "negative: $-81$", fb: "An even power of a negative number is positive: the minuses pair off." }],
        answer: 0, skill: "Evaluate an expression", hints: ["$(-3)(-3) = 9$, and again."], why: "$(-3)^4 = 81$." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick a **power** and a **sign** for $f(x) = ax^n$. Watch the two ends of the graph. Try all four powers and both signs.",
        scene: { type: "sketch", x: [-4, 4], y: [-6, 6], u: 26, w: 256, gate: true, pts: {},
          chips: { n: { label: "Power", v: "2", opts: [["1", "$x$"], ["2", "$x^2$"], ["3", "$x^3$"], ["4", "$x^4$"]] }, s: { label: "Sign", v: "p", opts: [["p", "$+$"], ["m", "$-$"]] } },
          draw: function (s) { var n = +s.c.n, a = s.c.s === "p" ? 1 : -1; return curve(function (x) { return a * Math.pow(x, n); }, -4, 4, "blue", [-6, 6]); },
          readout: function (s) { var n = +s.c.n, pos = s.c.s === "p", e = ends(n, pos); return "$f(x) = " + (pos ? "" : "-") + "x" + (n === 1 ? "" : "^{" + n + "}") + "$: as $x \\to -\\infty$, $f \\to " + e.l + "$ &nbsp; as $x \\to \\infty$, $f \\to " + e.r + "$"; },
          goal: function (s) { return Object.keys(s.seen.n).length >= 4 && Object.keys(s.seen.s).length >= 2; } },
        gate: true, then: "**Even** powers: both ends go the same way. **Odd** powers: the ends go opposite ways. A **minus** flips the whole graph over." },
      { type: "learn", kicker: "The idea",
        prompt: "A **power function** is $f(x) = ax^n$. Its **end behavior** depends only on whether $n$ is even or odd, and on the sign of $a$. $x \\to \\infty$ is read “$x$ grows without bound”.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Describe the ends of $f(x) = -2x^4$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "n = 4 \\ \\text{(even)}", say: "An even power: the two ends match." },
          { step: 2, m: "a = -2 < 0", say: "Negative: the graph is turned upside down.", ask: { prompt: "What does the negative coefficient do?", answer: 0, options: [{ t: "Flips the graph upside down" }, { t: "Shifts the graph left", fb: "A shift needs a number inside a bracket. A coefficient outside stretches or flips." }] }, fig: plot("The graph of y = -2x to the fourth, a hill shape with both ends pointing down.", [{ f: function (x) { return -2 * Math.pow(x, 4); }, a: -2, b: 2, c: "blue", yr: [-8, 4] }], [], { x: [-3, 3], y: [-8, 4], u: 24 }) },
          { step: 3, m: "x \\to \\pm\\infty: \\ f \\to -\\infty", say: "Even and negative: **both ends down**." }] },
        gate: true, then: "Both ends down, like an upside-down U." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $f(x) = 3x^5$.",
        how: HOW_9, skill: "End behavior",
        steps: [
          { step: 1, ask: "Is the power 5 even or odd?", type: "choice", answer: 0, options: [{ t: "Odd" }, { t: "Even", fb: "5 leaves a remainder when divided by 2." }], m: "n = 5 \\ \\text{odd}", say: "Odd: the ends go opposite ways." },
          { step: 2, ask: "Is the coefficient 3 positive or negative?", type: "choice", answer: 0, options: [{ t: "Positive" }, { t: "Negative", fb: "3 is positive." }], m: "a = 3 > 0", say: "Not flipped." },
          { step: 3, ask: "So what do the ends do?", type: "choice", answer: 0, options: [{ t: "Left end down, right end up" }, { t: "Left end up, right end down", fb: "That is an odd power with a **negative** coefficient." }, { t: "Both up", fb: "Both up needs an even power." }], m: "x \\to -\\infty: \\ f \\to -\\infty \\qquad x \\to \\infty: \\ f \\to \\infty", say: "Like $y = x^3$, but steeper." }],
        why: "Even or odd, sign, read the ends. Now sort some." },
      { type: "sort", kicker: "On your own", prompt: "Sort each function by what its ends do.",
        bins: ["Both ends up", "Both ends down", "Left down, right up", "Left up, right down"],
        cards: [{ t: "$3x^4$", bin: 0, fb: "Even, positive." }, { t: "$-x^2$", bin: 1, fb: "Even, negative." }, { t: "$x^5$", bin: 2, fb: "Odd, positive." }, { t: "$-2x^3$", bin: 3, fb: "Odd, negative." }, { t: "$-x^6$", bin: 1, fb: "Even, negative." }, { t: "$4x^7$", bin: 2, fb: "Odd, positive." }],
        skill: "End behavior", hints: ["Even or odd first, then the sign."], why: "Even: ends match. Odd: ends differ. The sign says up or down." },
      { type: "learn", kicker: "A harder case",
        prompt: "Write the ends in **arrow notation**. For $f(x) = -3x^3$:",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "n = 3 \\ \\text{odd}", say: "Odd: opposite ends." },
          { step: 2, m: "a = -3 < 0", say: "Negative: down at the right, up at the left." },
          { step: 3, m: "\\text{as } x \\to \\infty, \\ f(x) \\to -\\infty", say: "Read: as $x$ grows without bound, $f(x)$ decreases without bound.", ask: { prompt: "As $x \\to -\\infty$ what does $f(x)$ do?", answer: 0, options: [{ t: "$f(x) \\to \\infty$" }, { t: "$f(x) \\to -\\infty$", fb: "At the left of an odd, negative function the graph is **up**." }] } },
          { step: 3, m: "\\text{as } x \\to -\\infty, \\ f(x) \\to \\infty", say: "Left end up." }] },
        gate: true, then: "Two statements describe the two ends." },
      { type: "choice", kicker: "Try it", prompt: "$f(x) = -5x^2$: as $x \\to \\infty$, $f(x) \\to$…",
        options: [{ t: "$-\\infty$" }, { t: "$\\infty$", fb: "An even power with a negative coefficient: down at both ends." }, { t: "$0$", fb: "It does not level off: it falls without bound." }],
        answer: 0, skill: "End behavior", hints: ["Even, negative."], why: "Both ends down." },
      { type: "choice", kicker: "Find the error",
        prompt: "Tom says $f(x) = x^4$ goes down at the left and up at the right, “like $x^3$”. What is wrong?",
        options: [{ t: "4 is even: both ends go up. The left end of $x^3$ goes down because 3 is odd." }, { t: "Nothing is wrong.", fb: "Test $x = -2$: $(-2)^4 = 16$: positive, so the left end is up." }, { t: "Both ends go down.", fb: "A positive even power is never negative." }],
        answer: 0, skill: "End behavior", hints: ["Try a big negative input."], why: "$(-100)^4$ is positive." },
      { type: "choice", kicker: "Use it", prompt: "A cube's volume is $V = x^3$ and a square's area is $A = x^2$. For **negative** $x$ (just thinking about the formula), which one is negative?",
        options: [{ t: "$x^3$: an odd power keeps the sign" }, { t: "$x^2$", fb: "A square is never negative." }, { t: "Both", fb: "$x^2$ is always positive or zero." }],
        answer: 0, skill: "End behavior", hints: ["Odd power: the sign stays."], why: "$(-2)^3 = -8$ but $(-2)^2 = 4$." }
    ]
  });

  /* ============================================================ 10 · Polynomial functions */
  var HOW_10 = [["Standard form", "Write the terms in order of power, highest first."],
                ["Leading term", "The highest power is the **degree**. Its coefficient is the **leading coefficient**."],
                ["Read the ends", "The leading term alone decides the ends: use the power-function rule."]];
  LESSONS.push({
    title: "Polynomial functions: degree and ends", art: "pcpoly",
    blurb: "Book 3.3 · Which expressions are polynomials, and how the leading term rules the ends.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which is the highest power in $5x^2 - 3x^4 + x$?",
        options: [{ t: "4" }, { t: "5", fb: "5 is a coefficient. The highest **power** of $x$ is in $-3x^4$." }, { t: "2", fb: "2 is the first power written, not the highest." }],
        answer: 0, skill: "Degree", hints: ["Look at the exponents."], why: "The exponents are 2, 4 and 1: the highest is 4." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue graph is $f(x) = x^3 - 4x^2 - 4x + 16$, **redrawn on a bigger and bigger scale**. The dashed orange graph is just $y = x^3$. Zoom out through **all four** scales.",
        scene: { type: "sketch", x: [-1.5, 1.5], y: [-1.5, 1.5], u: 80, w: 300, gate: true, pts: {},
          chips: { r: { label: "Zoom out ×", v: "2", opts: [["2", "2"], ["5", "5"], ["10", "10"], ["50", "50"]] } },
          draw: function (s) { var r = +s.c.r; return curve(function (x) { return x * x * x; }, -1.5, 1.5, "orange", [-1.5, 1.5], true).concat(curve(function (x) { return x * x * x - (4 / r) * x * x - (4 / (r * r)) * x + 16 / (r * r * r); }, -1.5, 1.5, "blue", [-1.5, 1.5])); },
          readout: function (s) { return "Zoom ×" + s.c.r + ": the graph is " + (+s.c.r >= 50 ? "**almost exactly** $y = x^3$" : +s.c.r >= 10 ? "very close to $y = x^3$" : "still wiggly") + "<br>Looked at " + Math.min(Object.keys(s.seen.r).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.seen.r).length >= 4; } },
        gate: true, then: "Far enough away, the **leading term** $x^3$ swamps the rest. So the ends of a polynomial are the ends of its leading term." },
      { type: "learn", kicker: "The idea",
        prompt: "A **polynomial** is a sum of terms $ax^n$ with whole-number powers. Its **degree** is the highest power; the coefficient of that term is the **leading coefficient**. The **leading term** decides the end behavior.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the degree, leading coefficient and ends of $f(x) = 3x^2 - 2x^4 + 5 - x$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "f(x) = -2x^4 + 3x^2 - x + 5", say: "Reorder, highest power first." },
          { step: 2, m: "\\text{degree } 4 \\qquad \\text{leading coefficient } -2", say: "The leading term is $-2x^4$.", ask: { prompt: "Which term is the leading term?", answer: 0, options: [{ t: "$-2x^4$" }, { t: "$3x^2$", fb: "It was written first, but its power is smaller than 4." }] } },
          { step: 3, m: "\\text{even, negative: both ends down}", say: "The other terms do not change the ends." }] },
        gate: true, then: "Degree 4, leading coefficient $-2$: both ends **down**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $g(x) = 2x^3 - x^5 + 4x$.",
        how: HOW_10, skill: "Polynomial degree",
        steps: [
          { step: 1, ask: "In standard form, which term comes first?", type: "choice", answer: 0, options: [{ t: "$-x^5$" }, { t: "$2x^3$", fb: "$x^5$ has the highest power." }], m: "g(x) = -x^5 + 2x^3 + 4x", say: "Highest power first." },
          { step: 2, ask: "What is the leading coefficient?", type: "num", pre: "$a =$", answer: -1, near: [{ v: 1, fb: "$-x^5$ means the coefficient is $-1$." }], hint: "The number in front of $x^5$.", m: "\\text{degree } 5, \\ a = -1", say: "Odd degree, negative." },
          { step: 3, ask: "What do the ends do?", type: "choice", answer: 0, options: [{ t: "Left up, right down" }, { t: "Left down, right up", fb: "That is odd and **positive**." }], m: "x \\to -\\infty: \\ g \\to \\infty \\qquad x \\to \\infty: \\ g \\to -\\infty", say: "Odd and negative." }],
        why: "Standard form, leading term, ends. Now pick the polynomials." },
      { type: "multi", kicker: "On your own", prompt: "Which of these are **polynomials**?",
        options: [{ t: "$3x^2 - 5x + 1$", ok: true }, { t: "$x^4$", ok: true }, { t: "$x^{-1} + 2$", fb: "A negative power is not allowed in a polynomial." }, { t: "$\\sqrt{x}$", fb: "$\\sqrt{x} = x^{1/2}$: the power is not a whole number." }, { t: "$2^x$", fb: "The variable is in the exponent: not a polynomial." }],
        skill: "Polynomial degree", hints: ["Powers must be 0, 1, 2, 3… and the variable is never in an exponent or under a root."], why: "Only whole-number powers of $x$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **product**. Find the degree and ends of $f(x) = (x - 2)^2(x + 1)$ without multiplying it out.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "(x - 2)(x - 2)(x + 1)", say: "Three factors, each with an $x$." },
          { step: 2, m: "\\text{leading term} = x \\cdot x \\cdot x = x^3", say: "Multiply the leading terms only. Degree 3, leading coefficient 1.", ask: { prompt: "What is the degree?", answer: 0, options: [{ t: "$3$" }, { t: "$2$", fb: "There are three factors with $x$: $x \\cdot x \\cdot x$." }] } },
          { step: 3, m: "\\text{odd, positive: left down, right up}", say: "Ends of $y = x^3$." }] },
        gate: true, then: "You can read the degree and ends straight from the factors." },
      { type: "choice", kicker: "Try it", prompt: "$f(x) = -4x^3 + 7x - 2$. Which is correct?",
        options: [{ t: "degree 3, leading coefficient $-4$, left up and right down" }, { t: "degree 3, leading coefficient $7$", fb: "The leading coefficient is on the highest power: $-4x^3$." }, { t: "degree 4", fb: "4 is the coefficient. The degree is the power, 3." }],
        answer: 0, skill: "Polynomial degree", hints: ["Odd and negative."], why: "$-4x^3$: odd, negative." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lia says the leading coefficient of $f(x) = 5x - 2x^3$ is 5, “because it is first”. What is wrong?",
        options: [{ t: "The leading term has the **highest power**: $-2x^3$. The leading coefficient is $-2$." }, { t: "Nothing is wrong.", fb: "Order of writing does not matter: the highest power does." }, { t: "It is 3.", fb: "3 is the degree." }],
        answer: 0, skill: "Polynomial degree", hints: ["Put it in standard form first."], why: "$f(x) = -2x^3 + 5x$." },
      { type: "choice", kicker: "Use it", prompt: "A company's profit is $P(x) = -0.01x^2 + 5x - 100$ for $x$ items. What happens to profit when $x$ is very large?",
        options: [{ t: "It becomes very negative: the ends go down" }, { t: "It grows without bound", fb: "The leading coefficient is negative." }, { t: "It levels off at 5", fb: "Polynomials do not level off." }],
        answer: 0, skill: "Polynomial degree", hints: ["Even degree, negative leading coefficient."], why: "$-0.01x^2$ dominates: profit falls for large $x$." }
    ]
  });

  /* ================================================= 11 · Zeros of a polynomial by factoring */
  var HOW_11 = [["Factor", "Factor the polynomial completely."],
                ["Zero product", "Set each factor equal to 0 and solve."],
                ["Mark them", "Each solution is an $x$-intercept. The $y$-intercept is $f(0)$."]];
  var P11 = function (r) { return function (x) { return (x - r[0]) * (x - r[1]) * (x - r[2]) / 6; }; };
  LESSONS.push({
    title: "Zeros of a polynomial by factoring", art: "pcpoly",
    blurb: "Book 3.4 · The $x$-intercepts of a polynomial are the solutions of its factors.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Factor $x^2 - 2x - 8$.",
        options: [{ t: "$(x - 4)(x + 2)$" }, { t: "$(x + 4)(x - 2)$", fb: "The middle term is $-2x$: the larger number is negative." }, { t: "$(x - 8)(x + 1)$", fb: "$-8 + 1 = -7$." }],
        answer: 0, skill: "Factor a trinomial", hints: ["Multiply to $-8$, add to $-2$."], why: "$-4 \\cdot 2 = -8$ and $-4 + 2 = -2$." },
      { type: "learn", kicker: "Explore",
        prompt: "The three blue handles are the zeros of a cubic. The hollow orange dots are where it should cross: **$-2$, $1$ and $3$**. Drag the handles onto them.",
        scene: { type: "sketch", x: [-5, 5], y: [-5, 5], u: 30, w: 330, gate: true,
          pts: { A: { at: [-4, 0], drag: true, c: "blue", snap: 1, on: { y: 0 }, say: "First zero" }, B: { at: [0, 0], drag: true, c: "blue", snap: 1, on: { y: 0 }, say: "Second zero" }, C: { at: [4, 0], drag: true, c: "blue", snap: 1, on: { y: 0 }, say: "Third zero" } },
          draw: function (s) { return curve(P11([s.A[0], s.B[0], s.C[0]]), -5, 5, "blue", [-5, 5]).concat([{ pt: [-2, 0], c: "orange", open: true }, { pt: [1, 0], c: "orange", open: true }, { pt: [3, 0], c: "orange", open: true }]); },
          readout: function (s) { var r = [s.A[0], s.B[0], s.C[0]].sort(function (a, b) { return a - b; }); return "$f(x) \\propto " + r.map(function (z) { return "(x " + (z < 0 ? "+ " + (-z) : z === 0 ? "" : "- " + z) + ")"; }).map(function (t) { return t === "(x )" ? "x" : t; }).join("") + "$"; },
          goal: function (s) { var r = [s.A[0], s.B[0], s.C[0]].sort(function (a, b) { return a - b; }); return r[0] === -2 && r[1] === 1 && r[2] === 3; } },
        gate: true, then: "Zeros $-2$, $1$ and $3$ give the factors $(x + 2)$, $(x - 1)$, $(x - 3)$. **A factor $(x - r)$ means a zero at $x = r$.**" },
      { type: "learn", kicker: "The idea",
        prompt: "The **zeros** of a polynomial are the inputs where $f(x) = 0$: the $x$-intercepts. Factor the polynomial, set each factor to 0 (the **zero product** rule), and solve.",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the intercepts of $f(x) = x^3 - 2x^2 - 8x$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "x(x^2 - 2x - 8)", say: "Take out the common factor $x$ first." },
          { step: 1, m: "= x(x - 4)(x + 2)", say: "Then factor the trinomial.", ask: { prompt: "Why take out $x$ first?", answer: 0, options: [{ t: "Every term has an $x$: it is a common factor" }, { t: "It is a rule that $x$ goes first", fb: "It is only because each term contains $x$." }] } },
          { step: 2, m: "x = 0 \\quad x - 4 = 0 \\quad x + 2 = 0", say: "Set each factor to 0." },
          { step: 3, m: "x = 0, \\ 4, \\ -2 \\qquad f(0) = 0", say: "Three $x$-intercepts. The $y$-intercept is $f(0) = 0$.", fig: plot("The cubic crossing the x-axis at -2, 0 and 4.", [{ f: function (x) { return x * x * x - 2 * x * x - 8 * x; }, a: -3, b: 5, c: "blue", yr: [-12, 12] }], [dot(-2, 0, "green"), dot(0, 0, "green"), dot(4, 0, "green")], { x: [-4, 6], y: [-12, 12], u: 14 }) }] },
        gate: true, then: "$x$-intercepts $-2$, $0$ and $4$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the intercepts of $f(x) = x^3 + x^2 - 6x$.",
        how: HOW_11, skill: "Zeros of polynomials",
        steps: [
          { step: 1, ask: "Take out the common factor. What is left in the brackets?", type: "choice", answer: 0, options: [{ t: "$x(x^2 + x - 6)$" }, { t: "$x(x^2 + x - 6x)$", fb: "Divide each term by $x$: $x^3 \\to x^2$, $x^2 \\to x$, $-6x \\to -6$." }], m: "x(x^2 + x - 6)", say: "Each term divided by $x$." },
          { step: 1, ask: "Factor $x^2 + x - 6$.", type: "choice", answer: 0, options: [{ t: "$(x + 3)(x - 2)$" }, { t: "$(x - 3)(x + 2)$", fb: "That gives $-x$ in the middle." }], m: "x(x + 3)(x - 2)", say: "Multiply to $-6$, add to $1$." },
          { step: 2, ask: "What are the zeros?", type: "choice", answer: 0, options: [{ t: "$0$, $-3$ and $2$" }, { t: "$0$, $3$ and $-2$", fb: "$x + 3 = 0$ gives $x = -3$." }], m: "x = 0, \\ -3, \\ 2", say: "Each factor is 0." },
          { step: 3, ask: "What is the $y$-intercept, $f(0)$?", type: "num", pre: "$f(0) =$", answer: 0, near: [{ v: -6, fb: "Every term has an $x$: $f(0) = 0$." }], hint: "Put $x = 0$ in.", m: "f(0) = 0", say: "It passes through the origin." }],
        why: "Factor, zero product, mark them. Now find the zeros of a factored form." },
      { type: "choice", kicker: "On your own", prompt: "What are the zeros of $f(x) = (x + 1)(x - 5)(2x - 3)$?",
        options: [{ t: "$-1$, $5$ and $\\frac{3}{2}$" }, { t: "$1$, $-5$ and $-\\frac{3}{2}$", fb: "A factor $(x + 1)$ gives $x = -1$." }, { t: "$-1$, $5$ and $3$", fb: "$2x - 3 = 0$ gives $x = \\frac{3}{2}$: divide by 2." }],
        answer: 0, skill: "Zeros of polynomials", hints: ["Set each bracket to 0."], why: "$x = -1$, $x = 5$ and $x = \\frac{3}{2}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Factoring by grouping.** Find the zeros of $f(x) = x^3 - 3x^2 - 4x + 12$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "x^2(x - 3) - 4(x - 3)", say: "Group the first two terms and the last two. Both groups contain $(x - 3)$.", ask: { prompt: "What is $-4x + 12$ written as $-4(\\ldots)$?", answer: 0, options: [{ t: "$-4(x - 3)$" }, { t: "$-4(x + 3)$", fb: "$-4 \\cdot (-3) = +12$, so the bracket is $x - 3$." }] } },
          { step: 1, m: "(x - 3)(x^2 - 4) = (x - 3)(x - 2)(x + 2)", say: "Take out $(x - 3)$, then factor the difference of squares." },
          { step: 2, m: "x = 3, \\ 2, \\ -2", say: "Set each factor to 0." },
          { step: 3, m: "f(0) = 12", say: "The $y$-intercept: the constant term." }] },
        gate: true, then: "Zeros $3$, $2$ and $-2$; $y$-intercept 12." },
      { type: "num", kicker: "Try it", prompt: "$f(x) = (x - 2)(x + 3)(x - 1)$. What is the $y$-intercept?", pre: "$f(0) =$", answer: 6, skill: "Zeros of polynomials",
        near: [{ v: -6, fb: "$(-2)(3)(-1) = +6$: two negatives." }], hints: ["Put $x = 0$ in each bracket."], why: "$(-2)(3)(-1) = 6$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee solves $x(x - 4) = 0$ and says $x = 4$ only. What is wrong?",
        options: [{ t: "The factor $x$ gives a zero too: $x = 0$ or $x = 4$." }, { t: "Nothing is wrong.", fb: "$0 \\cdot (0 - 4) = 0$: $x = 0$ also works." }, { t: "$x = -4$.", fb: "$x - 4 = 0$ gives $x = 4$." }],
        answer: 0, skill: "Zeros of polynomials", hints: ["Each factor gives a zero, even a lone $x$."], why: "$x = 0$ and $x = 4$." },
      { type: "choice", kicker: "Use it", prompt: "A box's volume is $V(x) = x(10 - 2x)(8 - 2x)$ for a cut of $x$. At which cut sizes is the volume zero?",
        options: [{ t: "$x = 0$, $x = 4$ and $x = 5$" }, { t: "$x = 10$ and $x = 8$", fb: "Set each factor to 0: $10 - 2x = 0$ gives $x = 5$." }, { t: "$x = 0$ only", fb: "The other two brackets are also zero at some $x$." }],
        answer: 0, skill: "Zeros of polynomials", hints: ["$10 - 2x = 0$ and $8 - 2x = 0$."], why: "$x = 0$, $5$ and $4$." }
    ]
  });

  /* ============================================================== 12 · Multiplicity */
  var HOW_12 = [["Factor", "Write the polynomial in factored form."],
                ["Powers", "A factor $(x - r)^m$ gives the zero $r$ with **multiplicity** $m$."],
                ["Cross or touch", "Odd $m$: the graph **crosses** (for 3, 5… it flattens). Even $m$: it **touches** and bounces."]];
  var M12 = function (m) { return function (x) { return Math.pow(x - 1, m) * (x + 2) / 4; }; };
  LESSONS.push({
    title: "Multiplicity: cross or touch", art: "pcpoly",
    blurb: "Book 3.4 · A repeated factor changes what the graph does at that zero.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "How many times does the factor $(x - 3)$ appear in $(x - 3)^2(x + 1)$?",
        options: [{ t: "Twice" }, { t: "Once", fb: "The square means two copies: $(x - 3)(x - 3)$." }, { t: "Three times", fb: "Count only the copies of $(x - 3)$." }],
        answer: 0, skill: "Factors", hints: ["$(x-3)^2 = (x - 3)(x - 3)$."], why: "Twice." },
      { type: "learn", kicker: "Explore",
        prompt: "$f(x) = (x - 1)^m (x + 2)$ (scaled). Slide the **power** $m$ on the factor $(x - 1)$ and watch what the graph does at $x = 1$. Try all three.",
        scene: { type: "sketch", x: [-4, 4], y: [-4, 6], u: 30, w: 330, gate: true, pts: {},
          chips: { m: { label: "Power m", v: "1", opts: [["1", "1"], ["2", "2"], ["3", "3"]] } },
          draw: function (s) { return curve(M12(+s.c.m), -4, 4, "blue", [-4, 6]).concat([{ pt: [1, 0], c: "green" }, { pt: [-2, 0], c: "orange" }]); },
          readout: function (s) { var m = +s.c.m; return "$(x - 1)^{" + m + "}$: at $x = 1$ the graph " + (m === 1 ? "**crosses** straight through" : m === 2 ? "**touches** the axis and bounces back" : "**crosses**, but flattens out first") + "<br>Looked at " + Math.min(Object.keys(s.seen.m).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.seen.m).length >= 3; } },
        gate: true, then: "Power **1**: crosses. **2**: touches and turns back. **3**: crosses with a flat spot. Odd crosses, even touches." },
      { type: "learn", kicker: "The idea",
        prompt: "If $(x - r)$ appears $m$ times, $r$ is a zero of **multiplicity** $m$. At an **odd** multiplicity the graph crosses the axis; at an **even** one it touches the axis and turns.",
        scene: { type: "method", how: HOW_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Describe the zeros of $f(x) = (x + 1)^2(x - 2)$.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "f(x) = (x + 1)^2(x - 2)", say: "Already factored.", fig: plot("The cubic touching the axis at -1 and crossing at 2.", [{ f: function (x) { return (x + 1) * (x + 1) * (x - 2); }, a: -2.5, b: 3, c: "blue", yr: [-6, 6] }], [dot(-1, 0, "green"), dot(2, 0, "orange")], { x: [-3, 4], y: [-6, 6], u: 24 }) },
          { step: 2, m: "x = -1 \\ (m = 2)", say: "The squared factor gives $-1$ twice.", ask: { prompt: "What is the multiplicity of $x = -1$?", answer: 0, options: [{ t: "$2$" }, { t: "$1$", fb: "$(x + 1)^2$: the factor appears twice." }] } },
          { step: 2, m: "x = 2 \\ (m = 1)", say: "The single factor gives $2$ once." },
          { step: 3, m: "-1: \\text{touches} \\qquad 2: \\text{crosses}", say: "Even: bounces. Odd: crosses." },
          { step: 3, m: "f(0) = 1 \\cdot (-2) = -2", say: "The $y$-intercept." }] },
        gate: true, then: "Touches at $-1$, crosses at $2$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $f(x) = x^3(x - 4)^2$.",
        how: HOW_12, skill: "Multiplicity",
        steps: [
          { step: 1, ask: "It is already factored. How many factors does the degree count?", type: "num", pre: "degree =", answer: 5, near: [{ v: 2, fb: "Add the powers: $3 + 2$." }], hint: "$3 + 2$.", m: "x^3(x - 4)^2: \\ \\deg = 5", say: "$3 + 2 = 5$." },
          { step: 2, ask: "What is the multiplicity of the zero $x = 0$?", type: "num", pre: "$m =$", answer: 3, near: [{ v: 1, fb: "The factor $x$ appears 3 times: $x^3$." }], hint: "The power on $x$.", m: "x = 0: \\ m = 3 \\qquad x = 4: \\ m = 2", say: "Read the powers." },
          { step: 3, ask: "At $x = 0$, the graph…", type: "choice", answer: 0, options: [{ t: "crosses, flattened out" }, { t: "touches and bounces", fb: "3 is odd: it crosses." }], m: "0: \\text{crosses (flat)} \\quad 4: \\text{touches}", say: "Odd crosses, even touches." }],
        why: "Factor, read the powers, cross or touch. Now your turn." },
      { type: "choice", kicker: "On your own", prompt: "$f(x) = (x - 2)^3(x + 5)^2$. At which zeros does the graph **touch** the axis without crossing?",
        options: [{ t: "At $x = -5$ only" }, { t: "At $x = 2$ only", fb: "$(x - 2)^3$ has odd multiplicity: it crosses." }, { t: "At both", fb: "Only the **even** power touches." }],
        answer: 0, skill: "Multiplicity", hints: ["Even power touches."], why: "$(x + 5)^2$ has multiplicity 2." },
      { type: "learn", kicker: "A harder case",
        prompt: "From a **graph**. A polynomial touches the axis at $x = -2$ and crosses it at $x = 1$. Write a possible equation.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "x = -2 \\ \\text{touches}, \\quad x = 1 \\ \\text{crosses}", say: "Read the behaviour at each zero." },
          { step: 2, m: "(x + 2)^2 \\quad (x - 1)", say: "Touch means an even power, the smallest being 2. Cross: odd, the smallest being 1.", ask: { prompt: "Which factor has the squared power?", answer: 0, options: [{ t: "$(x + 2)$, where it touches" }, { t: "$(x - 1)$", fb: "It crosses there, so an odd power." }] } },
          { step: 3, m: "f(x) = a(x + 2)^2(x - 1)", say: "Any non-zero $a$ works: it only stretches or flips the graph. A point on it would fix $a$." }] },
        gate: true, then: "Touch: even power. Cross: odd power." },
      { type: "choice", kicker: "Try it", prompt: "Which polynomial has a zero at $x = 3$ that the graph **touches**?",
        options: [{ t: "$f(x) = (x - 3)^2(x + 1)$" }, { t: "$f(x) = (x - 3)(x + 1)^2$", fb: "There $x = 3$ has multiplicity 1: it crosses. The touching zero is $-1$." }, { t: "$f(x) = (x + 3)^2$", fb: "That touches at $x = -3$." }],
        answer: 0, skill: "Multiplicity", hints: ["Even power on $(x - 3)$."], why: "$(x - 3)^2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kim says $f(x) = (x - 1)^2(x + 2)$ has three **different** zeros, “because it has three factors”. What is wrong?",
        options: [{ t: "The zeros are $1$ and $-2$. The zero 1 is **repeated** (multiplicity 2)." }, { t: "Nothing is wrong.", fb: "The factor $(x - 1)$ appears twice, giving the same zero." }, { t: "There are no zeros.", fb: "Both $x = 1$ and $x = -2$ make $f = 0$." }],
        answer: 0, skill: "Multiplicity", hints: ["How many different $x$-values make $f = 0$?"], why: "Two different zeros; one counts twice." },
      { type: "choice", kicker: "Use it", prompt: "A polynomial's height touches the ground and bounces at one place and crosses at another. Which zero has the **even** multiplicity?",
        options: [{ t: "The place where it bounces" }, { t: "The place where it crosses", fb: "Crossing means an odd multiplicity." }, { t: "Neither", fb: "Touching is exactly what even multiplicity looks like." }],
        answer: 0, skill: "Multiplicity", hints: ["Touch means even."], why: "Even multiplicity: bounce." }
    ]
  });

  /* ================================================== 13 · Sketching a polynomial graph */
  var HOW_13 = [["Zeros", "Mark each zero, and decide whether the graph crosses or touches there."],
                ["Ends", "Use the degree and leading coefficient for the two ends."],
                ["Connect", "Draw a smooth curve through the zeros with those ends, through the $y$-intercept $f(0)$. It has at most degree $- 1$ turns."]];
  var IV13 = function (x) { return (x + 1.5) * (x - 0.5) * (x - 2.5) / 3; };
  LESSONS.push({
    title: "Sketching a polynomial graph", art: "pcpoly",
    blurb: "Book 3.4 · Zeros, ends, turns and the Intermediate Value Theorem.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A cubic has leading term $x^3$. Its ends are…",
        options: [{ t: "left down, right up" }, { t: "both up", fb: "Odd power: the ends go opposite ways." }, { t: "left up, right down", fb: "That is a negative leading coefficient." }],
        answer: 0, skill: "End behavior", hints: ["Odd, positive."], why: "Like $y = x^3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the two points along the graph. If one is **below** the axis and the other **above**, the curve **must cross** between them. Find **two** such pairs.",
        scene: { type: "sketch", x: [-4, 5], y: [-4, 4], u: 30, w: 330, gate: true,
          pts: { A: { at: [-2, IV13(-2)], drag: true, c: "blue", snap: 1, say: "First point", on: { fn: function (p) { var x = Math.max(-2, Math.min(3, Math.round(p[0]))); return [x, IV13(x)]; } } }, B: { at: [-1, IV13(-1)], drag: true, c: "orange", snap: 1, say: "Second point", on: { fn: function (p) { var x = Math.max(-2, Math.min(3, Math.round(p[0]))); return [x, IV13(x)]; } } } },
          track: function (s) { return (s.A[1] < 0) !== (s.B[1] < 0) ? Math.min(s.A[0], s.B[0]) + "," + Math.max(s.A[0], s.B[0]) : null; },
          draw: function (s) { var d = (s.A[1] < 0) !== (s.B[1] < 0), lo = Math.min(s.A[0], s.B[0]), hi = Math.max(s.A[0], s.B[0]); return curve(IV13, -3.2, 4.2, "blue", [-4, 4]).concat(d ? [{ poly: [[lo, -4], [hi, -4], [hi, 4], [lo, 4]], c: "green", fill: true }] : []); },
          readout: function (s) { var d = (s.A[1] < 0) !== (s.B[1] < 0); return "$f(" + nm(s.A[0]) + ") = " + nm(r2(s.A[1])) + "$ and $f(" + nm(s.B[0]) + ") = " + nm(r2(s.B[1])) + "$: " + (d ? "**opposite signs: a zero is between!**" : "same sign: nothing guaranteed") + "<br>Found " + Math.min(Object.keys(s.tracked).length, 2) + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "This is the **Intermediate Value Theorem**: a continuous curve that goes from below the axis to above it must cross the axis in between." },
      { type: "learn", kicker: "The idea",
        prompt: "To sketch a polynomial: mark the **zeros** (crossing or touching), take the **ends** from the leading term, and join them with a smooth curve through the $y$-intercept. A polynomial of degree $n$ turns at most $n - 1$ times.",
        scene: { type: "method", how: HOW_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch $f(x) = (x + 2)(x - 1)^2$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "x = -2 \\ \\text{crosses}", say: "$(x + 2)$ appears once: the graph crosses." },
          { step: 1, m: "x = 1 \\ \\text{touches}", say: "$(x - 1)$ appears twice: the graph touches.", fig: plot("The zeros -2 and 1 marked on the x-axis.", [], [dot(-2, 0, "green"), dot(1, 0, "orange")], { x: [-4, 3], y: [-3, 7], u: 24 }) },
          { step: 2, m: "\\text{left down, right up}", say: "Degree 3 ($x \\cdot x \\cdot x$) with $a = 1$: odd and positive.", ask: { prompt: "Where does the left end go?", answer: 0, options: [{ t: "Down" }, { t: "Up", fb: "Odd and positive: left down, right up." }] } },
          { step: 3, m: "f(0) = 2(1) = 2", say: "The $y$-intercept.", fig: plot("The zeros and the y-intercept (0, 2).", [], [dot(-2, 0, "green"), dot(1, 0, "orange"), dot(0, 2, "blue", "(0, 2)", "ne")], { x: [-4, 3], y: [-3, 7], u: 24 }) },
          { step: 3, m: "\\text{sketch}", say: "Start low at the left, cross at $-2$, rise past $(0, 2)$, turn, touch the axis at 1 and go up again.", fig: plot("The sketch: cross at -2, up through (0, 2), a peak, touch at 1, then up.", [{ f: function (x) { return (x + 2) * (x - 1) * (x - 1); }, a: -3, b: 2.2, c: "blue", yr: [-3, 7] }], [dot(-2, 0, "green"), dot(1, 0, "orange"), dot(0, 2, "blue")], { x: [-4, 3], y: [-3, 7], u: 24 }) }] },
        gate: true, then: "A cubic that crosses at $-2$, touches at $1$, with one peak between them." },
      { type: "guided", kicker: "Together",
        prompt: "Now you sketch $f(x) = -(x + 1)(x - 2)(x - 3)$.",
        how: HOW_13, skill: "Sketch a polynomial",
        steps: [
          { step: 1, ask: "How many zeros, and does it cross or touch?", type: "choice", answer: 0, options: [{ t: "Three, $-1$, $2$ and $3$: it crosses at each" }, { t: "Three, touching at each", fb: "Each factor appears once: odd multiplicity: it crosses." }], m: "x = -1, \\ 2, \\ 3 \\ \\text{(all cross)}", say: "Each factor appears once." },
          { step: 2, ask: "Degree 3 with a **negative** leading coefficient: the left end is…", type: "choice", answer: 0, options: [{ t: "up" }, { t: "down", fb: "Odd and negative: left up, right down." }], m: "x \\to -\\infty: \\ f \\to \\infty", say: "Left up, right down." },
          { step: 3, ask: "The $y$-intercept: $-(1)(-2)(-3)$.", type: "num", pre: "$f(0) =$", answer: -6, near: [{ v: 6, fb: "Three negatives: $-(1) \\cdot (-2) \\cdot (-3) = -6$." }], hint: "Multiply carefully.", m: "f(0) = -6", say: "Below the origin." }],
        why: "Zeros, ends, connect. Now another." },
      { type: "choice", kicker: "On your own", prompt: "A polynomial has zeros $-3$ (crosses) and $2$ (touches), leading term $x^3$. Which description of the graph is right?",
        options: [{ t: "Starts low, crosses at $-3$, rises, touches at $2$ and goes up" }, { t: "Starts high, crosses at $-3$, then touches at 2 and goes down", fb: "Positive odd leading term: the left end is **down**, the right end **up**." }, { t: "Starts low, touches at $-3$ and crosses at 2", fb: "It is the other way round: crosses at $-3$, touches at 2." }],
        answer: 0, skill: "Sketch a polynomial", hints: ["Ends first: odd, positive."], why: "$(x + 3)(x - 2)^2$ has leading term $x^3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Use the **Intermediate Value Theorem**. Show that $f(x) = x^3 - x - 1$ has a zero between 1 and 2.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "f(1) = 1 - 1 - 1 = -1", say: "At $x = 1$ the graph is below the axis." },
          { step: 2, m: "f(2) = 8 - 2 - 1 = 5", say: "At $x = 2$ it is above.", ask: { prompt: "What does the sign change tell us?", answer: 0, options: [{ t: "The curve crosses the axis between 1 and 2" }, { t: "The curve touches the axis at 1", fb: "$f(1) = -1$ is not zero." }] } },
          { step: 3, m: "\\text{a polynomial is continuous} \\ \\Rightarrow \\ \\text{a zero in } (1, 2)", say: "A polynomial has no breaks, so it must cross the axis." }] },
        gate: true, then: "Opposite signs at the two ends of an interval: at least one zero inside." },
      { type: "choice", kicker: "Try it", prompt: "$f(-1) = 3$ and $f(2) = -4$ for a polynomial $f$. What must be true?",
        options: [{ t: "$f$ has a zero between $-1$ and $2$" }, { t: "$f$ has no zeros", fb: "It goes from above to below the axis: it must cross." }, { t: "$f(0) = 0$", fb: "We only know a zero exists somewhere in between, not where." }],
        answer: 0, skill: "Sketch a polynomial", hints: ["Opposite signs."], why: "By the Intermediate Value Theorem." },
      { type: "choice", kicker: "Find the error",
        prompt: "Eli says a cubic can have 5 turning points “if it is wiggly enough”. What is wrong?",
        options: [{ t: "A cubic has degree 3, so at most $3 - 1 = 2$ turning points." }, { t: "Nothing is wrong.", fb: "Degree limits the number of turns: at most degree $- 1$." }, { t: "A cubic has no turns.", fb: "It can have up to 2." }],
        answer: 0, skill: "Sketch a polynomial", hints: ["Degree minus 1."], why: "At most 2 turning points." },
      { type: "choice", kicker: "Use it", prompt: "The height of a roller-coaster track is modeled by a polynomial that dips below ground level at one point and is above it at another. Is there a point where the track is exactly at ground level between them?",
        options: [{ t: "Yes: a continuous track must cross ground level" }, { t: "No: it could jump", fb: "A polynomial has no jumps: it is continuous." }, { t: "Only if it is a straight line", fb: "Any continuous curve must cross." }],
        answer: 0, skill: "Sketch a polynomial", hints: ["No breaks means it must pass through every height in between."], why: "The Intermediate Value Theorem." }
    ]
  });
  /* ======================================================= 14 · Long division of polynomials */
  var HOW_14 = [["Set up", "Write both polynomials in standard form, with $0x^n$ for any missing power."],
                ["Repeat", "Divide the leading terms, multiply back by the divisor, subtract, bring down. Repeat."],
                ["Remainder", "Stop when what is left has a smaller degree than the divisor. Answer: quotient + remainder ÷ divisor."]];
  LESSONS.push({
    title: "Long division of polynomials", art: "pcpoly",
    blurb: "Book 3.5 · The long division you know, with $x$s in it.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Divide 17 by 5. What is the **remainder**?", answer: 2, skill: "Long division",
        near: [{ v: 3, fb: "3 is the quotient: $5 \\cdot 3 = 15$. The remainder is what is left, $17 - 15$." }], hints: ["$17 - 5 \\cdot 3$."], why: "$17 = 5 \\cdot 3 + 2$." },
      { type: "learn", kicker: "Explore",
        prompt: "Dividing $x^2 + 5x + 7$ by $x + 2$ means finding $q$, $c$ and $r$ with $(x + 2)(qx + c) + r = x^2 + 5x + 7$. Slide them until the blue graph lands on the dashed one.",
        scene: morph({ keys: ["lin"], noGhost: true, noPts: true, x: [-7, 4], y: [-4, 14], u: 22, params: { q: { min: -3, max: 3, step: 1, v: 0, label: "$q$" }, c: { min: -5, max: 5, step: 1, v: 0, label: "$c$" }, r: { min: -4, max: 4, step: 1, v: 0, label: "$r$" } },
          tf: function (f, p) { return function (x) { return (x + 2) * (p.q * x + p.c) + p.r; }; }, map: function (pt) { return pt; }, target: { q: 1, c: 3, r: 1 },
          read: function (p) { return "$(x + 2)(" + (p.q === 1 ? "" : p.q === -1 ? "-" : nm(p.q)) + "x " + (p.c < 0 ? "- " + nm(-p.c) : "+ " + nm(p.c)) + ") " + (p.r < 0 ? "- " + nm(-p.r) : "+ " + nm(p.r)) + "$"; } }),
        gate: true, then: "$(x + 2)(x + 3) + 1 = x^2 + 5x + 7$. So $\\dfrac{x^2 + 5x + 7}{x + 2} = x + 3$ with **remainder 1**: dividend = divisor × quotient + remainder." },
      { type: "learn", kicker: "The idea",
        prompt: "**Polynomial long division** works like number long division. Each round: divide the **leading terms**, multiply the divisor by the result, **subtract**, and bring down. The answer is the **quotient** plus the **remainder** over the divisor.",
        scene: { type: "method", how: HOW_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "Divide $x^2 + 5x + 7$ by $x + 2$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "\\frac{x^2 + 5x + 7}{x + 2}", say: "Both are in standard form. Nothing is missing." },
          { step: 2, m: "x^2 \\div x = x \\qquad x(x + 2) = x^2 + 2x", say: "The first term of the quotient is $x$. Multiply it back.", ask: { prompt: "What is $x^2 \\div x$?", answer: 0, options: [{ t: "$x$" }, { t: "$x^2$", fb: "Divide the powers: $x^2 \\div x = x$." }] } },
          { step: 2, m: "(x^2 + 5x + 7) - (x^2 + 2x) = 3x + 7", say: "Subtract **every** term: the $x^2$ cancels, $5x - 2x = 3x$." },
          { step: 2, m: "3x \\div x = 3 \\qquad 3(x + 2) = 3x + 6", say: "Next term of the quotient: 3. Multiply it back." },
          { step: 2, m: "(3x + 7) - (3x + 6) = 1", say: "What is left is 1: smaller than the divisor, so stop." },
          { step: 3, m: "\\frac{x^2 + 5x + 7}{x + 2} = x + 3 + \\frac{1}{x + 2}", say: "Quotient $x + 3$, remainder 1 over the divisor." }] },
        gate: true, then: "$x + 3 + \\dfrac{1}{x + 2}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you divide $x^2 + 3x - 10$ by $x - 2$.",
        how: HOW_14, skill: "Polynomial long division",
        steps: [
          { step: 1, ask: "Is anything missing from $x^2 + 3x - 10$?", type: "choice", answer: 0, options: [{ t: "No: every power is there" }, { t: "Yes, an $x^3$", fb: "A polynomial of degree 2 has no $x^3$ term." }], m: "x^2 + 3x - 10", say: "Ready to divide." },
          { step: 2, ask: "$x^2 \\div x = x$. Then $x(x - 2) = x^2 - 2x$. Subtracting, what is left?", type: "choice", answer: 0, options: [{ t: "$5x - 10$" }, { t: "$x - 10$", fb: "$3x - (-2x) = 5x$: subtracting a negative adds." }], m: "(x^2 + 3x - 10) - (x^2 - 2x) = 5x - 10", say: "The next term is $5x \\div x = 5$." },
          { step: 2, ask: "$5(x - 2) = 5x - 10$. Subtract it. What remains?", type: "num", pre: "remainder =", answer: 0, near: [{ v: -20, fb: "$5x - 10$ minus $5x - 10$ is exactly 0." }], hint: "They are the same.", m: "(5x - 10) - (5x - 10) = 0", say: "A remainder of 0: it divides exactly." },
          { step: 3, ask: "So the quotient is…", type: "choice", answer: 0, options: [{ t: "$x + 5$" }, { t: "$x - 5$", fb: "The terms were $x$ and $+5$." }], m: "\\frac{x^2 + 3x - 10}{x - 2} = x + 5", say: "Check: $(x - 2)(x + 5) = x^2 + 3x - 10$." }],
        why: "Set up, repeat, remainder. Now another." },
      { type: "choice", kicker: "On your own", prompt: "$(6x^2 + x - 12) \\div (2x + 3) =$",
        options: [{ t: "$3x - 4$" }, { t: "$3x + 4$", fb: "Check: $(2x + 3)(3x + 4) = 6x^2 + 17x + 12$." }, { t: "$3x - 4$ remainder 1", fb: "It divides exactly: $(2x + 3)(3x - 4) = 6x^2 + x - 12$." }],
        answer: 0, skill: "Polynomial long division", hints: ["$6x^2 \\div 2x = 3x$."], why: "$3x(2x + 3) = 6x^2 + 9x$; $-8x - 12 = -4(2x + 3)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Missing powers.** Divide $x^3 - 8$ by $x - 2$. Write in the missing terms first.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "x^3 + 0x^2 + 0x - 8", say: "There is no $x^2$ and no $x$ term: write them with coefficient 0 so the columns line up.", ask: { prompt: "Why write $0x^2$?", answer: 0, options: [{ t: "To keep each power in its own place" }, { t: "It changes the answer", fb: "$0x^2 = 0$: it only holds the place." }] } },
          { step: 2, m: "x^2(x - 2) = x^3 - 2x^2", say: "$x^3 \\div x = x^2$. Multiply it back." },
          { step: 2, m: "2x^2 + 0x - 8", say: "Subtract and bring down." },
          { step: 2, m: "2x(x - 2) = 2x^2 - 4x", say: "$2x^2 \\div x = 2x$. Multiply it back." },
          { step: 2, m: "4x - 8", say: "Subtract and bring down." },
          { step: 2, m: "4(x - 2) = 4x - 8", say: "$4x \\div x = 4$. Multiply it back." },
          { step: 2, m: "0", say: "Nothing left." },
          { step: 3, m: "\\frac{x^3 - 8}{x - 2} = x^2 + 2x + 4", say: "The factoring of a difference of cubes." }] },
        gate: true, then: "$x^3 - 8 = (x - 2)(x^2 + 2x + 4)$." },
      { type: "num", kicker: "Try it", prompt: "$(x^2 - x + 3) \\div (x + 1)$ leaves what remainder?", answer: 5, skill: "Polynomial long division",
        near: [{ v: -2, fb: "Follow it through: the quotient is $x - 2$, and $(x + 1)(x - 2) = x^2 - x - 2$. The remainder makes up the rest: $3 - (-2)$." }], hints: ["$x - 2$ as the quotient: $(x + 1)(x - 2) = x^2 - x - 2$."], why: "$x^2 - x + 3 = (x + 1)(x - 2) + 5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Zoe subtracts $x^2 + 5x$ minus $x^2 + 2x$ and writes $3x$ — correct — but then subtracts $7 - 6$ as $-1$. What is wrong?",
        options: [{ t: "Later minus earlier: $7 - 6 = +1$. She flipped the order." }, { t: "Nothing is wrong.", fb: "Subtract the result of the multiplication **from** the current line: $7 - 6$." }, { t: "The remainder should be 13.", fb: "$7 + 6$ would add: we subtract." }],
        answer: 0, skill: "Polynomial long division", hints: ["Which line is on top?"], why: "$7 - 6 = 1$." },
      { type: "choice", kicker: "Use it", prompt: "A rectangle has area $x^2 + 5x + 6$ and width $x + 2$. What is its length?",
        options: [{ t: "$x + 3$" }, { t: "$x + 2$", fb: "$(x + 2)(x + 2) = x^2 + 4x + 4$." }, { t: "$x + 4$", fb: "$(x + 2)(x + 4) = x^2 + 6x + 8$." }],
        answer: 0, skill: "Polynomial long division", hints: ["Area ÷ width."], why: "$\\frac{x^2 + 5x + 6}{x + 2} = x + 3$." }
    ]
  });

  /* ============================================== 15 · Synthetic division and the remainder */
  var HOW_15 = [["Set up", "Write $k$ for the divisor $x - k$, then the coefficients, with a $0$ for any missing power."],
                ["Bring, ×, +", "Bring down the first coefficient. Multiply by $k$, add to the next coefficient. Repeat."],
                ["Read it", "The last number is the **remainder**. The others are the coefficients of the quotient."]];
  var F15 = function (x) { return x * x * x - 2 * x * x - 5 * x + 6; };
  LESSONS.push({
    title: "Synthetic division and the remainder", art: "pcpoly",
    blurb: "Book 3.5 · A shortcut for dividing by $x - k$, and why the remainder is $f(k)$.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Let $f(x) = x^2 - 3x + 1$. Find $f(4)$.", pre: "$f(4) =$", answer: 5, skill: "Evaluate a function",
        near: [{ v: -3, fb: "Square 4 first: $16 - 12 + 1$." }], hints: ["$16 - 12 + 1$."], why: "$16 - 12 + 1 = 5$." },
      { type: "learn", kicker: "Explore",
        prompt: "$f(x) = x^3 - 2x^2 - 5x + 6$. Slide the point. The remainder when you divide $f$ by $x - k$ is the **height** of the graph at $k$. Find **all three** inputs where the remainder is 0.",
        scene: { type: "sketch", x: [-3.5, 4], y: [-5, 9], u: 24, w: 214, gate: true,
          pts: { P: { at: [2, F15(2)], drag: true, c: "orange", snap: 1, say: "The input k", on: { fn: function (p) { var x = Math.max(-2, Math.min(3, Math.round(p[0]))); return [x, F15(x)]; } } } },
          track: function (s) { return s.P[1] === 0 ? "z" + s.P[0] : null; },
          draw: function (s) { return curve(F15, -2.4, 3.6, "blue", [-5, 9]).concat([{ seg: [[s.P[0], 0], [s.P[0], s.P[1]]], c: "orange", dash: true }]); },
          readout: function (s) { var k = s.P[0], v = s.P[1]; return "dividing by $(x " + (k < 0 ? "+ " + (-k) : k === 0 ? "" : "- " + k) + ")$ leaves remainder $f(" + nm(k) + ") = " + nm(v) + "$" + (v === 0 ? " — **zero: it divides exactly!**" : "") + "<br>Zeros found: " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "**Remainder Theorem**: dividing $f(x)$ by $x - k$ leaves remainder $f(k)$. Remainder 0 means $x - k$ is a **factor** and $k$ is a **zero**." },
      { type: "learn", kicker: "The idea",
        prompt: "To divide by $x - k$ there is a shortcut, **synthetic division**: use only the coefficients and the number $k$. Bring down, multiply by $k$, add: again and again. The last number is the remainder, $f(k)$.",
        scene: { type: "method", how: HOW_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "Divide $x^3 - 4x^2 + x + 6$ by $x - 3$.",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "k = 3 \\qquad 1,\\ -4,\\ 1,\\ 6", say: "The divisor $x - 3$ gives $k = 3$. Then the four coefficients.", fig: synfig(3, [1, -4, 1, 6], 0) },
          { step: 2, m: "\\text{bring down } 1", say: "The first coefficient comes straight down.", fig: synfig(3, [1, -4, 1, 6], 1, 0) },
          { step: 2, m: "3 \\cdot 1 = 3 \\qquad -4 + 3 = -1", say: "Multiply by $k$, then add to the next coefficient.", fig: synfig(3, [1, -4, 1, 6], 2, 1), ask: { prompt: "What is $-4 + 3$?", answer: 0, options: [{ t: "$-1$" }, { t: "$1$", fb: "$-4 + 3 = -1$: the negative is bigger." }] } },
          { step: 2, m: "3 \\cdot (-1) = -3 \\qquad 1 - 3 = -2", say: "Again.", fig: synfig(3, [1, -4, 1, 6], 3, 2) },
          { step: 2, m: "3 \\cdot (-2) = -6 \\qquad 6 - 6 = 0", say: "And once more.", fig: synfig(3, [1, -4, 1, 6], 4, 3) },
          { step: 3, m: "x^2 - x - 2 \\quad \\text{remainder } 0", say: "The bottom row: $1, -1, -2$ are the quotient's coefficients, and the last number, 0, is the remainder.", fig: synfig(3, [1, -4, 1, 6], 4) }] },
        gate: true, then: "$x^3 - 4x^2 + x + 6 = (x - 3)(x^2 - x - 2)$: remainder 0, so $x = 3$ is a zero." },
      { type: "guided", kicker: "Together",
        prompt: "Now you divide $2x^3 - 3x^2 - 8x + 12$ by $x - 2$.",
        how: HOW_15, skill: "Synthetic division",
        steps: [
          { step: 1, ask: "What is $k$?", type: "num", pre: "$k =$", answer: 2, near: [{ v: -2, fb: "$x - 2$ means $k = 2$. (For $x + 2$ it would be $-2$.)" }], hint: "The number after the minus.", m: "k = 2 \\qquad 2,\\ -3,\\ -8,\\ 12", say: "The coefficients: $2, -3, -8, 12$." },
          { step: 2, ask: "Bring down 2. Then $-3 + 2 \\cdot 2 = ?$", type: "num", pre: "$=$", answer: 1, near: [{ v: -1, fb: "$2 \\cdot 2 = 4$, and $-3 + 4 = 1$." }], hint: "$-3 + 4$.", m: "2,\\ 1", say: "Second number." },
          { step: 2, ask: "Next: $-8 + 2 \\cdot 1 = ?$", type: "num", pre: "$=$", answer: -6, near: [{ v: -10, fb: "$2 \\cdot 1 = +2$, so $-8 + 2 = -6$." }], hint: "$-8 + 2$.", m: "2,\\ 1,\\ -6", say: "Third number." },
          { step: 3, ask: "Last: $12 + 2 \\cdot (-6) = ?$ This is the remainder.", type: "num", pre: "remainder =", answer: 0, near: [{ v: 24, fb: "$2 \\cdot (-6) = -12$, so $12 - 12 = 0$." }], hint: "$12 - 12$.", m: "2x^2 + x - 6, \\ \\text{remainder } 0", say: "The quotient is $2x^2 + x - 6$." }],
        why: "Set up, bring, multiply, add, read. Now find a remainder." },
      { type: "num", kicker: "On your own", prompt: "Find the remainder when $x^3 + 2x - 5$ is divided by $x - 2$. (There is no $x^2$ term: write a 0.)", pre: "remainder =", answer: 7, skill: "Synthetic division",
        near: [{ v: -5, fb: "That is the last coefficient: carry the work through." }, { v: 15, fb: "Use the coefficients $1, 0, 2, -5$: $1 \\to 2 \\to 6 \\to 7$." }], hints: ["Coefficients $1, 0, 2, -5$ and $k = 2$."], why: "$1,\\ 2,\\ 6,\\ 7$: the remainder is 7, which is $f(2) = 8 + 4 - 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Dividing by $x + 3$: $k$ is **negative**. Divide $x^3 + 2x^2 - 5x - 6$ by $x + 3$.",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "x + 3 = x - (-3) \\ \\Rightarrow \\ k = -3", say: "Write $x + 3$ as $x - (-3)$.", ask: { prompt: "What is $k$ for $x + 3$?", answer: 0, options: [{ t: "$-3$" }, { t: "$3$", fb: "$x - k = x + 3$ means $k = -3$." }] }, fig: synfig(-3, [1, 2, -5, -6], 0) },
          { step: 2, m: "1 \\cdot (-3) = -3, \\ \\ 2 - 3 = -1", say: "Bring down 1; multiply by $-3$; add.", fig: synfig(-3, [1, 2, -5, -6], 2) },
          { step: 2, m: "(-1)(-3) = 3, \\ \\ -5 + 3 = -2", say: "Careful with the signs: two negatives make a positive.", fig: synfig(-3, [1, 2, -5, -6], 3) },
          { step: 2, m: "(-2)(-3) = 6, \\ \\ -6 + 6 = 0", say: "Once more.", fig: synfig(-3, [1, 2, -5, -6], 4) },
          { step: 3, m: "x^2 - x - 2 \\quad \\text{remainder } 0", say: "Quotient $x^2 - x - 2 = (x - 2)(x + 1)$." }] },
        gate: true, then: "So $x^3 + 2x^2 - 5x - 6 = (x + 3)(x - 2)(x + 1)$." },
      { type: "num", kicker: "Try it", prompt: "Use the Remainder Theorem. What is the remainder when $2x^3 - x + 4$ is divided by $x - 1$?", pre: "remainder =", answer: 5, skill: "Synthetic division",
        near: [{ v: 4, fb: "That is $f(0)$. We want $f(1)$." }], hints: ["The remainder is $f(1)$."], why: "$f(1) = 2 - 1 + 4 = 5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mo divides by $x + 4$ and uses $k = 4$. What is wrong?",
        options: [{ t: "$x + 4 = x - (-4)$, so $k = -4$." }, { t: "Nothing is wrong.", fb: "The remainder should be $f(-4)$, not $f(4)$." }, { t: "$k = 0$.", fb: "$k$ is the number that makes the divisor 0: $x = -4$." }],
        answer: 0, skill: "Synthetic division", hints: ["Which $x$ makes $x + 4 = 0$?"], why: "$k = -4$." },
      { type: "choice", kicker: "Use it", prompt: "$f(5) = 0$ for a polynomial $f$. Which must be true?",
        options: [{ t: "$x - 5$ is a factor of $f(x)$" }, { t: "$x + 5$ is a factor", fb: "A zero at 5 gives the factor $x - 5$." }, { t: "$f(0) = 5$", fb: "We only know the zero." }],
        answer: 0, skill: "Synthetic division", hints: ["Remainder 0 means it divides exactly."], why: "Remainder $f(5) = 0$: the **Factor Theorem**." }
    ]
  });

  /* ======================================================== 16 · Finding rational zeros */
  var HOW_16 = [["List p and q", "$p$: the factors of the constant term. $q$: the factors of the leading coefficient."],
                ["List p/q", "Every possible rational zero is $\\pm\\dfrac{p}{q}$."],
                ["Test", "Test candidates by synthetic division. When the remainder is 0, factor what is left."]];
  var F16 = function (x) { return x * x * x - 2 * x * x - 5 * x + 6; };
  var C16 = [-6, -3, -2, -1, 1, 2, 3, 6];
  LESSONS.push({
    title: "Finding rational zeros", art: "pcpoly",
    blurb: "Book 3.6 · A short list of candidates, then test them.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which numbers divide 6 exactly (positive factors)?",
        options: [{ t: "$1, 2, 3, 6$" }, { t: "$2, 3$", fb: "1 and 6 divide 6 as well." }, { t: "$1, 2, 3, 4, 5, 6$", fb: "4 and 5 do not divide 6." }],
        answer: 0, skill: "Factors", hints: ["$6 = 1 \\cdot 6 = 2 \\cdot 3$."], why: "$1, 2, 3, 6$." },
      { type: "learn", kicker: "Explore",
        prompt: "$f(x) = x^3 - 2x^2 - 5x + 6$. Any whole-number zero must divide the constant 6. Tap each candidate to **test** it. Find **all three** zeros.",
        scene: { type: "sketch", x: [-4.5, 4.5], y: [-1.2, 1.2], u: 52, w: 470, grid: false, gate: true, pts: {}, maxSel: 1,
          taps: C16.reduce(function (o, c, i) { o["c" + c] = { at: [i - 3.5, 0], label: String(c).replace("-", "−"), c: "blue", r: 18, say: "Candidate " + c }; return o; }, {}),
          track: function (s) { var c = s.selList.length ? +s.selList[0].slice(1) : null; return c !== null && F16(c) === 0 ? "z" + c : null; },
          draw: function (s) { return [{ seg: [[-4.2, 0], [4.2, 0]], c: "soft" }]; },
          readout: function (s) { if (!s.selList.length) return "Tap a candidate.<br>Zeros found: " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; var c = +s.selList[0].slice(1), v = F16(c); return "$f(" + nm(c) + ") = " + nm(v) + "$ — " + (v === 0 ? "**a zero!** ✓" : "not a zero ✗") + "<br>Zeros found: " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "$-2$, $1$ and $3$ all divide 6: the list of divisors **contained** every zero. That list is the **Rational Zero Theorem**." },
      { type: "learn", kicker: "The idea",
        prompt: "If a polynomial with whole-number coefficients has a rational zero $\\frac{p}{q}$, then $p$ divides the **constant term** and $q$ divides the **leading coefficient**. That gives a short list of candidates to test.",
        scene: { type: "method", how: HOW_16 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the zeros of $f(x) = 2x^3 - 3x^2 - 8x + 12$.",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "p: 1, 2, 3, 4, 6, 12 \\qquad q: 1, 2", say: "$p$ divides the constant 12; $q$ divides the leading coefficient 2." },
          { step: 2, m: "\\pm 1, \\pm 2, \\pm 3, \\pm 4, \\pm 6, \\pm 12", say: "Every $\\pm\\frac{p}{q}$ with $q = 1$: the factors of 12.", ask: { prompt: "Which number gives the $p$s?", answer: 0, options: [{ t: "The constant term, 12" }, { t: "The leading coefficient, 2", fb: "That gives the $q$s." }] } },
          { step: 2, m: "\\pm\\tfrac{1}{2}, \\ \\pm\\tfrac{3}{2}", say: "And with $q = 2$: $\\frac{1}{2}$ and $\\frac{3}{2}$. The other fractions reduce to whole numbers." },
          { step: 3, m: "\\text{test } 2: \\ 2,\\ 1,\\ -6,\\ 0", say: "Synthetic division by $x - 2$ leaves remainder 0, so 2 is a zero.", fig: synfig(2, [2, -3, -8, 12], 4) },
          { step: 3, m: "2x^2 + x - 6 = (2x - 3)(x + 2)", say: "Factor the quotient." },
          { step: 3, m: "x = 2, \\ \\tfrac{3}{2}, \\ -2", say: "All three zeros." }] },
        gate: true, then: "Zeros $2$, $\\frac{3}{2}$ and $-2$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the zeros of $f(x) = x^3 + 2x^2 - 5x - 6$.",
        how: HOW_16, skill: "Rational zeros",
        steps: [
          { step: 1, ask: "The leading coefficient is 1, so $q = 1$. The constant is $-6$. Which $p$ values?", type: "choice", answer: 0, options: [{ t: "$1, 2, 3, 6$" }, { t: "$1, 2$", fb: "Every factor of 6." }], m: "p: 1, 2, 3, 6 \\qquad q: 1", say: "So the candidates are the whole numbers $\\pm 1, \\pm 2, \\pm 3, \\pm 6$." },
          { step: 2, ask: "Test $x = 2$: $f(2) = 8 + 8 - 10 - 6$.", type: "num", pre: "$f(2) =$", answer: 0, near: [{ v: -2, fb: "$8 + 8 = 16$, and $16 - 10 - 6 = 0$." }], hint: "$16 - 16$.", m: "f(2) = 0", say: "A zero." },
          { step: 3, ask: "Dividing by $x - 2$ gives $x^2 + 4x + 3$. What are its zeros?", type: "choice", answer: 0, options: [{ t: "$-1$ and $-3$" }, { t: "$1$ and $3$", fb: "$(x + 1)(x + 3)$: the zeros have the opposite signs." }], m: "x = 2, \\ -1, \\ -3", say: "$x^2 + 4x + 3 = (x + 1)(x + 3)$." }],
        why: "List, test, factor. Now count some candidates." },
      { type: "choice", kicker: "On your own", prompt: "$f(x) = 3x^3 + 2x^2 - x + 4$. Which is the full list of $q$ values (positive factors of the leading coefficient)?",
        options: [{ t: "$1, 3$" }, { t: "$1, 2, 4$", fb: "Those divide the constant 4: they give the $p$s." }, { t: "$3$", fb: "1 divides 3 too." }],
        answer: 0, skill: "Rational zeros", hints: ["Leading coefficient 3."], why: "$q$ divides 3: $1$ or $3$. And $p$ divides 4: $1, 2, 4$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**No rational zero.** Does $f(x) = x^3 - 2$ have a rational zero?",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "p: 1, 2 \\qquad q: 1", say: "The constant is $-2$; the leading coefficient 1." },
          { step: 2, m: "\\pm 1, \\ \\pm 2", say: "Four candidates." },
          { step: 3, m: "f(1) = -1 \\quad f(-1) = -3 \\quad f(2) = 6 \\quad f(-2) = -10", say: "None gives 0.", ask: { prompt: "Is there a rational zero?", answer: 0, options: [{ t: "No: none of the candidates works" }, { t: "Yes, $f(1) = -1$ is close", fb: "Close is not zero." }] } },
          { step: 3, m: "x = \\sqrt[3]{2} \\approx 1.26", say: "The zero exists (the graph crosses between 1 and 2) but it is **irrational**." }] },
        gate: true, then: "The list only finds **rational** zeros. Irrational ones need other methods." },
      { type: "choice", kicker: "Try it", prompt: "Which is **not** a possible rational zero of $f(x) = 2x^2 + 7x + 3$?",
        options: [{ t: "$\\frac{3}{4}$" }, { t: "$-\\frac{1}{2}$", fb: "$p = 1$ divides 3 and $q = 2$ divides 2: allowed." }, { t: "$3$", fb: "$p = 3$, $q = 1$: allowed." }],
        answer: 0, skill: "Rational zeros", hints: ["$q$ must divide 2."], why: "$q = 4$ does not divide 2." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben lists the candidates for $x^3 - 5x + 6$ as the factors of the **leading** coefficient, 1, only. What is wrong?",
        options: [{ t: "$p$ comes from the **constant** term: factors of 6, divided by factors of 1." }, { t: "Nothing is wrong.", fb: "Then $\\pm 1$ would be the only candidates, missing $2$ and $-3$." }, { t: "It should use the middle coefficient.", fb: "Only the constant and leading coefficients matter." }],
        answer: 0, skill: "Rational zeros", hints: ["Numerator from the constant."], why: "$\\pm 1, \\pm 2, \\pm 3, \\pm 6$." },
      { type: "choice", kicker: "Use it", prompt: "A box's volume $V(x) = x^3 + 2x^2 - 5x - 6$ is 0 at $x = 2$. After dividing it out, what shape is left?",
        options: [{ t: "A quadratic: $x^2 + 4x + 3$" }, { t: "Another cubic", fb: "Dividing by a degree 1 factor lowers the degree by 1." }, { t: "A linear function", fb: "Degree 3 minus 1 is degree 2." }],
        answer: 0, skill: "Rational zeros", hints: ["Degree drops by one."], why: "A cubic divided by a linear factor leaves a quadratic." }
    ]
  });

  /* ======================================== 17 · All the zeros: the Fundamental Theorem */
  var HOW_17 = [["Count", "A polynomial of degree $n$ has exactly $n$ zeros, counting repeats and complex ones."],
                ["Real zeros", "Test candidates, divide each out, and keep going."],
                ["Finish", "Solve what is left. Complex zeros of a real polynomial come in pairs $a \\pm bi$."]];
  var CP17 = {
    a: { f: function (x) { return x * x + 1; }, n: 2, real: [], cx: "$\\pm i$" },
    b: { f: function (x) { return x * x - 1; }, n: 2, real: [-1, 1], cx: null },
    c: { f: function (x) { return x * x * x - x; }, n: 3, real: [-1, 0, 1], cx: null },
    d: { f: function (x) { return x * x * x - 1; }, n: 3, real: [1], cx: "$-\\frac{1}{2} \\pm \\frac{\\sqrt{3}}{2}i$" }
  };
  LESSONS.push({
    title: "All the zeros: complex ones too", art: "pcpoly",
    blurb: "Book 3.6 · A polynomial of degree $n$ has $n$ zeros; the ones the graph does not show are complex.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The zeros of $x^2 + 4$ are…",
        options: [{ t: "$2i$ and $-2i$" }, { t: "$2$ and $-2$", fb: "$2^2 + 4 = 8$. A zero needs $x^2 = -4$." }, { t: "there are none", fb: "There are no **real** zeros, but there are two complex ones." }],
        answer: 0, skill: "Imaginary numbers", hints: ["$x^2 = -4$."], why: "$x = \\pm 2i$." },
      { type: "learn", kicker: "Explore",
        prompt: "Choose a polynomial and count the zeros the **graph** shows. The degree says how many there really are. Look at **all four**.",
        scene: { type: "sketch", x: [-3, 3], y: [-4, 6], u: 32, w: 235, gate: true, pts: {},
          chips: { p: { label: "Polynomial", v: "a", opts: [["a", "$x^2 + 1$"], ["b", "$x^2 - 1$"], ["c", "$x^3 - x$"], ["d", "$x^3 - 1$"]] } },
          draw: function (s) { var P = CP17[s.c.p], it = curve(P.f, -3, 3, "blue", [-4, 6]); P.real.forEach(function (r) { it.push({ pt: [r, 0], c: "green" }); }); return it; },
          readout: function (s) { var P = CP17[s.c.p], nr = P.real.length; return "degree " + P.n + ": the graph shows **" + nr + "** real zero" + (nr === 1 ? "" : "s") + (P.n - nr > 0 ? ", so **" + (P.n - nr) + "** complex: " + (P.cx || "") : " — that is all " + P.n) + "<br>Looked at " + Math.min(Object.keys(s.seen.p).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.seen.p).length >= 4; } },
        gate: true, then: "Real zeros + complex zeros = the degree, **always**. $x^2 + 1$ never touches the axis, yet it has two zeros: $\\pm i$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Fundamental Theorem of Algebra:** a polynomial of degree $n$ has exactly $n$ zeros if you count repeats and complex numbers. If a polynomial with real coefficients has the zero $a + bi$, it also has its conjugate $a - bi$.",
        scene: { type: "method", how: HOW_17 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find **all** the zeros of $f(x) = x^3 - 3x^2 + 4x - 2$.",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "\\text{degree } 3 \\ \\Rightarrow \\ 3 \\ \\text{zeros}", say: "We must find three, real or complex: a cubic has **exactly** 3 zeros in all." },
          { step: 2, m: "f(1) = 1 - 3 + 4 - 2 = 0", say: "Candidates $\\pm 1, \\pm 2$: $x = 1$ works.", ask: { prompt: "Is $x = 1$ a zero? What is $1 - 3 + 4 - 2$?", answer: 0, options: [{ t: "$0$: yes, a zero" }, { t: "$2$: not a zero", fb: "$1 - 3 = -2$, then $-2 + 4 = 2$, then $2 - 2 = 0$." }] }, fig: synfig(1, [1, -3, 4, -2], 4) },
          { step: 2, m: "x^2 - 2x + 2", say: "Divide out $x - 1$: the quotient is $x^2 - 2x + 2$." },
          { step: 3, m: "x = \\frac{2 \\pm \\sqrt{4 - 8}}{2}", say: "The quadratic formula. $4 - 8 = -4$." },
          { step: 3, m: "x = \\frac{2 \\pm 2i}{2} = 1 \\pm i", say: "A negative discriminant: a complex pair." },
          { step: 3, m: "x = 1, \\ 1 + i, \\ 1 - i", say: "Three zeros, as promised." }] },
        gate: true, then: "One real zero and one complex conjugate pair." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find all zeros of $f(x) = x^3 - 2x^2 + x - 2$. One is $x = 2$.",
        how: HOW_17, skill: "Complex zeros",
        steps: [
          { step: 1, ask: "How many zeros will there be?", type: "num", pre: "zeros =", answer: 3, near: [{ v: 1, fb: "Degree 3 means 3 zeros, counting complex ones." }], hint: "The degree.", m: "\\deg = 3", say: "Three zeros." },
          { step: 2, ask: "Synthetic division of $1, -2, 1, -2$ by $x - 2$ ($k = 2$). The bottom row starts $1,\\ ?$. What is the second number, $-2 + 2 \\cdot 1$?", type: "num", pre: "$=$", answer: 0, near: [{ v: -2, fb: "$-2 + 2 \\cdot 1 = 0$." }], hint: "$-2 + 2$.", m: "1,\\ 0,\\ 1,\\ 0", say: "Quotient $x^2 + 0x + 1$.", },
          { step: 3, ask: "Solve $x^2 + 1 = 0$.", type: "choice", answer: 0, options: [{ t: "$x = i$ or $x = -i$" }, { t: "no solution", fb: "No **real** solution, but two complex ones." }], m: "x = 2, \\ i, \\ -i", say: "A conjugate pair." }],
        why: "Count, find the real ones, finish. Now a conjugate." },
      { type: "choice", kicker: "On your own", prompt: "A cubic with **real** coefficients has zeros $2$ and $3 + i$. The third zero is…",
        options: [{ t: "$3 - i$" }, { t: "$-3 - i$", fb: "The conjugate keeps the real part and flips only the sign of the $i$ part." }, { t: "$-2$", fb: "Complex zeros come in conjugate pairs." }],
        answer: 0, skill: "Complex zeros", hints: ["Complex zeros come in conjugate pairs."], why: "Conjugate of $3 + i$ is $3 - i$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Go **backwards**. Write a polynomial with zeros $2$, $1 + i$ and $1 - i$.",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "(x - 2)\\,(x - (1 + i))\\,(x - (1 - i))", say: "A zero $r$ gives the factor $(x - r)$." },
          { step: 2, m: "(x - 1 - i)(x - 1 + i) = (x - 1)^2 - i^2", say: "The conjugate pair multiplies to a real quadratic: $(a - b)(a + b)$ with $a = x - 1$ and $b = i$.", ask: { prompt: "What is $-i^2$?", answer: 0, options: [{ t: "$+1$" }, { t: "$-1$", fb: "$i^2 = -1$, so $-i^2 = +1$." }] } },
          { step: 2, m: "= x^2 - 2x + 1 + 1 = x^2 - 2x + 2", say: "Real coefficients, as promised." },
          { step: 3, m: "(x - 2)(x^2 - 2x + 2) = x^3 - 4x^2 + 6x - 4", say: "Multiply out." }] },
        gate: true, then: "$f(x) = x^3 - 4x^2 + 6x - 4$." },
      { type: "num", kicker: "Try it", prompt: "How many zeros does $f(x) = x^5 - 3x^2 + 1$ have, counting complex ones and repeats?", answer: 5, skill: "Complex zeros",
        near: [{ v: 2, fb: "The degree counts them all, real or not." }], hints: ["The degree."], why: "Exactly 5." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dev says $x^4 + 1$ has no zeros, because its graph never meets the $x$-axis. What is wrong?",
        options: [{ t: "It has **4 complex** zeros: none real, but 4 in all." }, { t: "Nothing is wrong.", fb: "A degree-4 polynomial always has 4 zeros in the complex numbers." }, { t: "It has 2 zeros.", fb: "Exactly 4, counting complex ones." }],
        answer: 0, skill: "Complex zeros", hints: ["The degree."], why: "The graph shows only real zeros." },
      { type: "choice", kicker: "Use it", prompt: "A quadratic with real coefficients has the zero $2i$. What is its other zero, and what is the quadratic?",
        options: [{ t: "$-2i$; $x^2 + 4$" }, { t: "$2i$ again; $(x - 2i)^2$", fb: "The conjugate $-2i$ is also a zero." }, { t: "$-2$; $x^2 - 4$", fb: "A zero of $2i$ means a factor $(x - 2i)$, with complex zeros in pairs." }],
        answer: 0, skill: "Complex zeros", hints: ["$(x - 2i)(x + 2i)$."], why: "$(x - 2i)(x + 2i) = x^2 - 4i^2 = x^2 + 4$." }
    ]
  });
  /* ============================================ 18 · Rational functions: domain and walls */
  var HOW_18 = [["Factor", "Factor the top and the bottom."],
                ["Bottom = 0", "Find the $x$ that make the bottom 0. They are not in the domain."],
                ["Wall or hole", "If the factor stays, it is a vertical asymptote. If it cancels, it is a hole."]];
  var R18 = function (x) { return 1 / (x - 2); };
  var G18 = plot("The graph of (x - 1) over (x - 3)(x + 2), with vertical asymptotes at x = -2 and x = 3.",
    [{ f: function (x) { return (x - 1) / ((x - 3) * (x + 2)); }, a: -6, b: 6, c: "blue", yr: [-5, 5] }],
    [{ seg: [[-2, -5], [-2, 5]], c: "orange", dash: true }, { seg: [[3, -5], [3, 5]], c: "orange", dash: true }], { x: [-6, 6], y: [-5, 5], u: 28 });
  var H18 = plot("The line y = x + 2 with a hole at (2, 4).",
    [{ f: function (x) { return x + 2; }, a: -4, b: 5, c: "blue" }], [hole(2, 4, "blue")], { x: [-4, 5], y: [-2, 7], u: 30 });
  LESSONS.push({
    title: "Rational functions: where they break", art: "pcpoly",
    blurb: "Book 3.7 · A fraction of polynomials cannot have a zero on the bottom. See what the graph does there.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $\\dfrac{1}{0.01}$?", answer: 100, skill: "Dividing by a small number",
        near: [{ v: 0.01, fb: "Dividing by 0.01 is the same as multiplying by 100." }], hints: ["How many hundredths fit in 1?"], why: "$1 \\div 0.01 = 100$. The smaller the bottom, the bigger the answer." },
      { type: "learn", kicker: "Explore",
        prompt: "$f(x) = \\dfrac{1}{x - 2}$. Drag the point along the $x$-axis and watch the output. Squeeze in on $x = 2$ from **both sides**.",
        scene: { type: "sketch", x: [-2, 6], y: [-6, 6], u: 28, w: 255, gate: true,
          pts: { P: { at: [4, 0], drag: true, c: "orange", snap: 0.05, say: "The input x", on: { fn: function (p) { return [Math.max(-1, Math.min(5, Math.round(p[0] * 20) / 20)), 0]; } } } },
          track: function (s) { var x = s.P[0]; return x >= 1.9 && x < 2 ? "l" : x > 2 && x <= 2.1 ? "r" : null; },
          draw: function (s) { var x = s.P[0], it = curve(R18, -2, 6, "blue", [-6, 6]); if (x !== 2) it.push({ seg: [[x, 0], [x, Math.max(-6, Math.min(6, R18(x)))]], c: "orange", dash: true }); return it; },
          readout: function (s) { var x = s.P[0]; return "$x = " + nm(x) + "$: " + (x === 2 ? "$f(x)$ is **undefined**: you cannot divide by 0" : "$f(x) = " + nm(Math.round(R18(x) * 10) / 10) + "$") + "<br>Squeezed in from the left: " + (s.tracked.l ? "✓" : "—") + " · from the right: " + (s.tracked.r ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.l && s.tracked.r); } },
        gate: true, then: "Close to 2 the outputs grow without bound: down on the left, **up** on the right. The graph hugs the line $x = 2$ and never touches it: a **vertical asymptote**." },
      { type: "learn", kicker: "The idea",
        prompt: "A **rational function** is a polynomial divided by a polynomial. It is not defined where the bottom is $0$. If that factor **stays** after you cancel, the graph has a **vertical asymptote** there. If it **cancels**, the graph just has a **hole**.",
        scene: { type: "method", how: HOW_18 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the domain and vertical asymptotes of $f(x) = \\dfrac{x - 1}{x^2 - x - 6}$.",
        scene: { type: "walk", how: HOW_18, rows: [
          { step: 1, m: "f(x) = \\frac{x - 1}{(x - 3)(x + 2)}", say: "Factor the bottom. The top, $x - 1$, stays as it is." },
          { step: 2, m: "(x - 3)(x + 2) = 0", say: "Set the bottom equal to 0." },
          { step: 2, m: "x = 3 \\ \\text{or} \\ x = -2", say: "These two inputs make the bottom 0, so $f$ is not defined there.", ask: { prompt: "What makes $(x - 3)$ equal 0?", answer: 0, options: [{ t: "$x = 3$" }, { t: "$x = -3$", fb: "$-3 - 3 = -6$. It is $3$ that gives $3 - 3 = 0$." }] } },
          { step: 3, m: "\\text{nothing cancels}", say: "The top, $x - 1$, matches neither $x - 3$ nor $x + 2$. Both factors stay, so both are vertical asymptotes.", fig: G18 },
          { step: 3, m: "\\text{domain: all } x \\text{ except } 3 \\text{ and } -2", say: "Every other input works." }] },
        gate: true, then: "Vertical asymptotes at $x = 3$ and $x = -2$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $f(x) = \\dfrac{2}{x^2 - 4x + 3}$.",
        how: HOW_18, skill: "Vertical asymptotes",
        steps: [
          { step: 1, ask: "Factor $x^2 - 4x + 3$.", type: "choice", answer: 0, options: [{ t: "$(x - 1)(x - 3)$" }, { t: "$(x + 1)(x + 3)$", fb: "The middle term is $-4x$: both numbers are negative." }], m: "f(x) = \\frac{2}{(x - 1)(x - 3)}", say: "The top is the number 2." },
          { step: 2, ask: "Which inputs make the bottom 0?", type: "choice", answer: 0, options: [{ t: "$x = 1$ and $x = 3$" }, { t: "$x = -1$ and $x = -3$", fb: "$x - 1 = 0$ gives $x = 1$." }], m: "x = 1 \\ \\text{or} \\ x = 3", say: "Not in the domain." },
          { step: 3, ask: "Can the top, 2, cancel either factor?", type: "choice", answer: 0, options: [{ t: "No: both are vertical asymptotes" }, { t: "Yes: it cancels one", fb: "A constant has no $x - 1$ or $x - 3$ in it to cancel." }], m: "x = 1 \\quad x = 3", say: "Two walls." }],
        why: "Factor, find the zeros of the bottom, then see if anything cancels." },
      { type: "multi", kicker: "On your own", prompt: "Which inputs are **not** in the domain of $g(x) = \\dfrac{x}{x^2 - 9}$?",
        options: [{ t: "$x = 3$", ok: true }, { t: "$x = -3$", ok: true }, { t: "$x = 0$", fb: "The **top** is 0 there, which is fine: $g(0) = 0$." }, { t: "$x = 9$", fb: "$x^2 = 9$ gives $x = \\pm 3$, not 9." }],
        skill: "Vertical asymptotes", hints: ["Set the bottom equal to 0."], why: "$x^2 - 9 = (x - 3)(x + 3) = 0$ at $\\pm 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A hole.** Look at $h(x) = \\dfrac{x^2 - 4}{x - 2}$. The bottom is 0 at $x = 2$. Is that a wall?",
        scene: { type: "walk", how: HOW_18, rows: [
          { step: 1, m: "h(x) = \\frac{(x - 2)(x + 2)}{x - 2}", say: "The top is a difference of squares." },
          { step: 2, m: "x - 2 = 0 \\ \\Rightarrow \\ x = 2", say: "So $2$ is not in the domain." },
          { step: 3, m: "= x + 2 \\quad (x \\neq 2)", say: "The factor $x - 2$ **cancels**.", ask: { prompt: "Is there a vertical asymptote at $x = 2$?", answer: 0, options: [{ t: "No: the factor cancels, so it is only a hole" }, { t: "Yes: the bottom is 0 there", fb: "The bottom is 0, but when the factor cancels the graph stays close to a finite height." }] } },
          { step: 3, m: "\\text{hole at } (2,\\ 4)", say: "Put $x = 2$ into the cancelled form $x + 2$ to find the missing height.", fig: H18 }] },
        gate: true, then: "The graph is the line $y = x + 2$ with one point missing." },
      { type: "choice", kicker: "Try it", prompt: "Which function has a **vertical asymptote** at $x = 1$?",
        options: [{ t: "$\\dfrac{x + 3}{x - 1}$" }, { t: "$\\dfrac{x^2 - 1}{x - 1}$", fb: "$x^2 - 1 = (x - 1)(x + 1)$: the $x - 1$ cancels, so it is a hole." }, { t: "$\\dfrac{x - 1}{x + 3}$", fb: "That one has its asymptote at $x = -3$. At $x = 1$ it equals 0." }],
        answer: 0, skill: "Vertical asymptotes", hints: ["The factor $x - 1$ must stay on the bottom."], why: "The factor $x - 1$ stays: a wall at $x = 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kai says $f(x) = \\dfrac{x + 3}{x^2 - 9}$ has vertical asymptotes at $x = 3$ and $x = -3$. What is wrong?",
        options: [{ t: "$x + 3$ cancels, so $x = -3$ is only a hole. Just $x = 3$ is a wall." }, { t: "Nothing is wrong.", fb: "Factor first: $x^2 - 9 = (x - 3)(x + 3)$, and the top is $x + 3$." }, { t: "There are no asymptotes at all.", fb: "The factor $x - 3$ stays on the bottom." }],
        answer: 0, skill: "Vertical asymptotes", hints: ["Factor the bottom, then cancel."], why: "$f(x) = \\frac{1}{x - 3}$ for $x \\neq -3$." },
      { type: "choice", kicker: "Use it", prompt: "$n$ students share a \\$500 bill: each pays $C(n) = \\dfrac{500}{n}$. What happens as $n$ gets close to 0?",
        options: [{ t: "$C$ grows without bound: a vertical asymptote at $n = 0$" }, { t: "$C$ gets close to 0", fb: "Fewer people share the same bill, so each pays **more**." }, { t: "$C$ stays at 500", fb: "At $n = 1$ it is 500, but with less than 1 person the share grows beyond that." }],
        answer: 0, skill: "Vertical asymptotes", hints: ["Fewer people, the same bill."], why: "$\\frac{500}{n}$ grows without bound as $n \\to 0$." }
    ]
  });

  /* ============================================ 19 · Horizontal asymptotes and end behavior */
  var HOW_19 = [["Degrees", "Find the degree of the top ($n$) and of the bottom ($m$)."],
                ["Which case", "$n < m$: the line $y = 0$. $n = m$: the ratio of leading coefficients. $n > m$: none."],
                ["Write it", "Write the horizontal asymptote, or say there is none."]];
  var CP19 = {
    a: { f: function (x) { return (2 * x + 1) / (x * x + 1); }, n: 1, m: 2, L: 0 },
    b: { f: function (x) { return (3 * x * x + 1) / (x * x + 1); }, n: 2, m: 2, L: 3 },
    c: { f: function (x) { return (4 * x - 2) / (2 * x + 1); }, n: 1, m: 1, L: 2 },
    d: { f: function (x) { return (x * x + 1) / (x - 1); }, n: 2, m: 1, L: null }
  };
  var G19 = plot("The graph of (6x^2 - 1) over (2x^2 + x), levelling off at the line y = 3.",
    [{ f: function (x) { return (6 * x * x - 1) / (2 * x * x + x); }, a: -12, b: 12, c: "blue", yr: [-2, 8] }],
    [{ seg: [[-12, 3], [12, 3]], c: "orange", dash: true }], { x: [-12, 12], y: [-2, 8], u: 14 });
  var S19 = plot("The graph of (x^2 + 1) over (x - 1), following the slanted line y = x + 1.",
    [{ f: function (x) { return (x * x + 1) / (x - 1); }, a: -6, b: 6, c: "blue", yr: [-7, 8] }],
    [{ seg: [[-6, -5], [6, 7]], c: "orange", dash: true }, { seg: [[1, -7], [1, 8]], c: "purple", dash: true }], { x: [-6, 6], y: [-7, 8], u: 22 });
  LESSONS.push({
    title: "Where the graph settles down", art: "pcpoly",
    blurb: "Book 3.7 · Far to the left and right, a rational function levels off. Compare the degrees to see where.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $\\dfrac{3x^2}{x^2}$ when $x \\neq 0$?", answer: 3, skill: "Simplify a fraction",
        hints: ["$x^2$ divided by $x^2$ is 1."], why: "$\\frac{3x^2}{x^2} = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick a function and look far to the left and right. Does the graph level off? At what height? Look at **all four**.",
        scene: { type: "sketch", x: [-10, 10], y: [-4, 8], u: 18, w: 380, gate: true, pts: {},
          chips: { p: { label: "Function", v: "a", opts: [["a", "$\\frac{2x + 1}{x^2 + 1}$"], ["b", "$\\frac{3x^2 + 1}{x^2 + 1}$"], ["c", "$\\frac{4x - 2}{2x + 1}$"], ["d", "$\\frac{x^2 + 1}{x - 1}$"]] } },
          draw: function (s) { var P = CP19[s.c.p], it = curve(P.f, -10, 10, "blue", [-4, 8]); if (P.L !== null) it.push({ seg: [[-10, P.L], [10, P.L]], c: "orange", dash: true }); return it; },
          readout: function (s) { var P = CP19[s.c.p]; return "top degree **" + P.n + "**, bottom degree **" + P.m + "**: " + (P.L === null ? "the top is bigger: the graph keeps climbing, **no** level" : "levels off at $y = " + P.L + "$") + "<br>Looked at " + Math.min(Object.keys(s.seen.p).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.seen.p).length >= 4; } },
        gate: true, then: "**Top smaller** than bottom: it flattens to $y = 0$. **Equal degrees**: it levels off at a height from the leading coefficients ($\\frac{3}{1}$, $\\frac{4}{2}$). **Top bigger**: no level at all." },
      { type: "learn", kicker: "The idea",
        prompt: "Far from the origin, only the **leading terms** matter. Compare the degree $n$ of the top with the degree $m$ of the bottom. That decides the **horizontal asymptote**: where the graph settles as $x \\to \\pm\\infty$.",
        scene: { type: "method", how: HOW_19 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the horizontal asymptote of $f(x) = \\dfrac{6x^2 - 1}{2x^2 + x}$.",
        scene: { type: "walk", how: HOW_19, rows: [
          { step: 1, m: "n = 2 \\qquad m = 2", say: "Both the top and the bottom have degree 2." },
          { step: 2, m: "x = 100: \\ \\frac{59999}{20100} \\approx 2.985", say: "Big inputs give a number close to 3: the $-1$ and the $x$ barely matter next to $6x^2$ and $2x^2$." },
          { step: 2, m: "n = m \\ \\Rightarrow \\ y = \\frac{6}{2}", say: "Equal degrees: divide the leading coefficients.", ask: { prompt: "What do we divide?", answer: 0, options: [{ t: "The leading coefficients, 6 and 2" }, { t: "The constants, $-1$ and $0$", fb: "Far out, the constants hardly matter. The leading terms decide." }] } },
          { step: 3, m: "y = 3", say: "The graph levels off at $y = 3$ on both sides.", fig: G19 }] },
        gate: true, then: "Horizontal asymptote $y = 3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $g(x) = \\dfrac{8x^3 - x}{2x^3 + 5}$.",
        how: HOW_19, skill: "Horizontal asymptotes",
        steps: [
          { step: 1, ask: "What are the degrees of the top and the bottom?", type: "choice", answer: 0, options: [{ t: "Both are 3" }, { t: "8 and 2", fb: "Those are the coefficients. The degree is the highest power." }], m: "n = 3 \\qquad m = 3", say: "Equal." },
          { step: 2, ask: "Which case is that?", type: "choice", answer: 0, options: [{ t: "Equal degrees: divide the leading coefficients" }, { t: "The line $y = 0$", fb: "That is for a bottom of higher degree." }], m: "y = \\frac{8}{2}", say: "Leading coefficients: 8 and 2." },
          { step: 3, ask: "So the horizontal asymptote is $y =$", type: "num", pre: "$y =$", answer: 4, near: [{ v: 0.25, fb: "Top over bottom: $8 \\div 2$." }], hint: "$8 \\div 2$.", m: "y = 4", say: "Levels off at 4." }],
        why: "Degrees, which case, write it. Now sort some." },
      { type: "sort", kicker: "On your own", prompt: "Sort each function by its horizontal asymptote.",
        bins: ["The line y = 0", "A level other than 0", "None"],
        cards: [{ t: "$\\dfrac{3x + 1}{x^2 + 4}$", bin: 0, fb: "Top degree 1 < bottom degree 2." }, { t: "$\\dfrac{5x^2 - 2}{x^2 + 1}$", bin: 1, fb: "Equal degrees: $y = 5$." }, { t: "$\\dfrac{x^3}{x^2 - 1}$", bin: 2, fb: "Top degree 3 > bottom degree 2." }, { t: "$\\dfrac{7}{x - 3}$", bin: 0, fb: "Top degree 0 < bottom degree 1." }, { t: "$\\dfrac{2x - 1}{4x + 3}$", bin: 1, fb: "Equal degrees: $y = \\frac{2}{4} = \\frac{1}{2}$." }, { t: "$\\dfrac{x^4}{x^2 + 9}$", bin: 2, fb: "Top degree 4 > bottom degree 2." }],
        skill: "Horizontal asymptotes", hints: ["Compare the two degrees first."], why: "Smaller top: 0. Equal: a ratio. Bigger top: none." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Top one bigger.** $f(x) = \\dfrac{x^2 + 1}{x - 1}$ has no horizontal asymptote, but it follows a **slanted line**. Find it by dividing.",
        scene: { type: "walk", how: HOW_19, rows: [
          { step: 1, m: "n = 2 > m = 1", say: "The top is bigger: no horizontal asymptote." },
          { step: 2, m: "1,\\ 0,\\ 1 \\ \\to \\ 1,\\ 1,\\ 2", say: "Synthetic division by $x - 1$ ($k = 1$): the quotient is $x + 1$, the remainder 2.", ask: { prompt: "What is the quotient?", answer: 0, options: [{ t: "$x + 1$" }, { t: "$x + 2$", fb: "The bottom row is $1, 1, 2$: the last number is the remainder." }] } },
          { step: 2, m: "f(x) = x + 1 + \\frac{2}{x - 1}", say: "For large $|x|$, the fraction $\\frac{2}{x - 1}$ is close to 0." },
          { step: 3, m: "y = x + 1", say: "The graph hugs this slanted line: a **slant asymptote**. The purple line is the vertical asymptote $x = 1$.", fig: S19 }] },
        gate: true, then: "Divide: the quotient (without the remainder) is the slant asymptote." },
      { type: "choice", kicker: "Try it", prompt: "What is the horizontal asymptote of $\\dfrac{9x^2 + x}{3x^2 - 2}$?",
        options: [{ t: "$y = 3$" }, { t: "$y = 9$", fb: "Divide by the bottom's leading coefficient as well: $\\frac{9}{3}$." }, { t: "$y = 0$", fb: "The degrees are equal, so the level is not 0." }],
        answer: 0, skill: "Horizontal asymptotes", hints: ["Equal degrees: $9 \\div 3$."], why: "$\\frac{9}{3} = 3$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Noor says $\\dfrac{2x + 1}{x^2 - 4}$ has the horizontal asymptote $y = 2$ \"because the top has a 2\". What is wrong?",
        options: [{ t: "The bottom has the higher degree (2 > 1), so the asymptote is $y = 0$." }, { t: "Nothing is wrong.", fb: "Compare the degrees, not the coefficients, first." }, { t: "It should be $y = 4$.", fb: "$x^2 - 4$ has leading coefficient 1, and the degrees are not equal anyway." }],
        answer: 0, skill: "Horizontal asymptotes", hints: ["Which degree is bigger?"], why: "Bottom bigger: the graph flattens to $y = 0$." },
      { type: "choice", kicker: "Use it", prompt: "A drug's concentration is $C(t) = \\dfrac{5t}{t^2 + 4}$ after $t$ hours. What happens to it in the long run?",
        options: [{ t: "It approaches 0" }, { t: "It approaches 5", fb: "5 is a coefficient on top. The bottom grows faster, $t^2$ against $t$." }, { t: "It grows without bound", fb: "The bottom has the higher degree, so the fraction shrinks." }],
        answer: 0, skill: "Horizontal asymptotes", hints: ["Top degree 1, bottom degree 2."], why: "Top degree < bottom degree: $y = 0$." }
    ]
  });

  /* ============================================ 20 · Graphing a rational function */
  var HOW_20 = [["Intercepts", "$y$-intercept: put in $x = 0$. $x$-intercepts: where the top is 0."],
                ["Asymptotes", "Vertical: where the bottom is 0. Horizontal: compare the degrees."],
                ["Sketch", "Draw the asymptotes, plot a test point in each region, and draw the pieces."]];
  var F20 = function (x) { return (x - 1) / (x + 2); };
  var G20 = function (k) {
    var it = [];
    if (k >= 1) it.push(dot(0, -0.5, "orange"), dot(1, 0, "orange"));
    if (k >= 2) it.push({ seg: [[-2, -6], [-2, 6]], c: "purple", dash: true }, { seg: [[-7, 1], [7, 1]], c: "purple", dash: true });
    if (k >= 3) it.push(dot(-3, 4, "green"), dot(-4, 2.5, "green"), dot(2, 0.25, "green"));
    if (k >= 4) it = it.concat(curve(F20, -7, 7, "blue", [-6, 6]));
    return grid("The graph of (x - 1) over (x + 2) with its intercepts, asymptotes and test points.", it, { x: [-7, 7], y: [-5, 5], u: 24 });
  };
  var HOLEF = function (x) { return (x + 1) / (x + 3); };
  var H20 = grid("The graph of (x^2 - 1) over (x - 1)(x + 3): a hole at (1, 1/2), asymptotes x = -3 and y = 1.",
    curve(HOLEF, -8, 6, "blue", [-5, 5]).concat([hole(1, 0.5, "blue"), dot(-1, 0, "orange"), dot(0, 1 / 3, "orange"), { seg: [[-3, -5], [-3, 5]], c: "purple", dash: true }, { seg: [[-8, 1], [6, 1]], c: "purple", dash: true }]),
    { x: [-8, 6], y: [-5, 5], u: 24 });
  LESSONS.push({
    title: "Graphing a rational function", art: "pcpoly",
    blurb: "Book 3.7 · Intercepts, asymptotes and a few test points make the sketch.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "For $f(x) = \\dfrac{x - 1}{x + 2}$, find $f(0)$. (A fraction like -1/2 is fine.)", pre: "$f(0) =$", answer: -0.5, tol: 1e-9, shown: "-1/2", skill: "Evaluate a function",
        near: [{ v: 0.5, tol: 1e-9, fb: "Watch the sign: $\\frac{0 - 1}{0 + 2}$ is negative." }], hints: ["$\\frac{0 - 1}{0 + 2}$."], why: "$\\frac{-1}{2} = -\\frac{1}{2}$." },
      { type: "learn", kicker: "Explore",
        prompt: "$y = \\frac{a}{x - h} + k$ is $\\frac{1}{x}$ moved and stretched. Slide $a$, $h$, $k$ onto the dashed graph. Watch the **purple lines**.",
        scene: morph({ keys: ["rec"], x: [-6, 6], y: [-6, 6], u: 22, params: { a: { min: -3, max: 3, step: 1, v: 1, label: "$a$" }, h: { min: -5, max: 5, step: 1, v: 0, label: "$h$" }, k: { min: -5, max: 5, step: 1, v: 0, label: "$k$" } },
          tf: function (f, p) { return function (x) { return p.a === 0 || x === p.h ? NaN : p.a / (x - p.h) + p.k; }; }, map: function (pt, p) { return [pt[0] + p.h, p.a * pt[1] + p.k]; }, target: { a: 2, h: -1, k: 1 },
          extra: function (p) { return [{ seg: [[p.h, -6], [p.h, 6]], c: "purple", dash: true }, { seg: [[-6, p.k], [6, p.k]], c: "purple", dash: true }]; },
          read: function (p) { return p.a === 0 ? "$a = 0$: no fraction left, just the line $y = " + nm(p.k) + "$" : "$y = \\dfrac{" + nm(p.a) + "}{x " + (p.h < 0 ? "+ " + nm(-p.h) : p.h === 0 ? "" : "- " + nm(p.h)) + "} " + (p.k < 0 ? "- " + nm(-p.k) : p.k === 0 ? "" : "+ " + nm(p.k)) + "$: asymptotes $x = " + nm(p.h) + "$ and $y = " + nm(p.k) + "$"; } }),
        gate: true, then: "$y = \\dfrac{2}{x + 1} + 1$. The purple lines are the asymptotes: $h$ moves the **vertical** one, $k$ the **horizontal** one." },
      { type: "learn", kicker: "The idea",
        prompt: "To sketch a rational function: plot the **intercepts**, draw the **asymptotes**, then add a **test point** in each region the asymptotes cut off. Finally draw each piece through them, hugging the lines.",
        scene: { type: "method", how: HOW_20 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch $f(x) = \\dfrac{x - 1}{x + 2}$.",
        scene: { type: "walk", how: HOW_20, rows: [
          { step: 1, m: "f(0) = \\frac{-1}{2}", say: "The $y$-intercept is $(0, -\\frac{1}{2})$." },
          { step: 1, m: "x - 1 = 0 \\ \\Rightarrow \\ x = 1", say: "The top is 0 at $x = 1$: the $x$-intercept is $(1, 0)$.", fig: G20(1) },
          { step: 2, m: "x + 2 = 0 \\ \\Rightarrow \\ x = -2", say: "The bottom is 0 at $x = -2$: a vertical asymptote." },
          { step: 2, m: "n = m = 1 \\ \\Rightarrow \\ y = \\frac{1}{1}", say: "Equal degrees: the horizontal asymptote is $y = 1$.", fig: G20(2), ask: { prompt: "Why is the horizontal asymptote $y = 1$?", answer: 0, options: [{ t: "Equal degrees: leading coefficients $\\frac{1}{1}$" }, { t: "Because the top is 0 at $x = 1$", fb: "That is the $x$-intercept. The asymptote comes from the degrees." }] } },
          { step: 3, m: "f(-3) = 4, \\ \\ f(-4) = 2.5", say: "Two test points left of the wall." },
          { step: 3, m: "f(2) = 0.25", say: "And one right of it.", fig: G20(3) },
          { step: 3, m: "x < -2: \\ f(x) > 1", say: "Left of the wall the graph is above the line $y = 1$." },
          { step: 3, m: "x > -2: \\ f(x) < 1", say: "Right of it, below. Draw each piece through its points.", fig: G20(4) }] },
        gate: true, then: "The intercepts, asymptotes and test points pin the graph down." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $g(x) = \\dfrac{2x + 4}{x - 1}$.",
        how: HOW_20, skill: "Graph a rational function",
        steps: [
          { step: 1, ask: "What is the $y$-intercept, $g(0)$?", type: "num", pre: "$g(0) =$", answer: -4, near: [{ v: 4, fb: "$\\frac{4}{-1} = -4$: the bottom is negative." }], hint: "$\\frac{0 + 4}{0 - 1}$.", m: "(0,\\ -4)", say: "The graph crosses the $y$-axis at $-4$." },
          { step: 2, ask: "Where is the vertical asymptote?", type: "num", pre: "$x =$", answer: 1, near: [{ v: -1, fb: "$x - 1 = 0$ gives $x = 1$." }], hint: "Set the bottom to 0.", m: "x = 1", say: "The wall." },
          { step: 2, ask: "What is the horizontal asymptote? (Equal degrees: $\\frac{2}{1}$.)", type: "num", pre: "$y =$", answer: 2, near: [{ v: 4, fb: "Use the leading coefficients: $\\frac{2}{1}$." }], hint: "$2 \\div 1$.", m: "y = 2", say: "The level." },
          { step: 3, ask: "$g(2) = 8$. So just right of $x = 1$ the graph is…", type: "choice", answer: 0, options: [{ t: "above the line $y = 2$" }, { t: "below the line $y = 2$", fb: "$g(2) = 8$ is higher than 2." }], m: "g(2) = \\frac{8}{1} = 8", say: "The right piece starts high and sinks to $y = 2$." }],
        why: "Intercepts, asymptotes, test points. Now match a formula." },
      { type: "choice", kicker: "On your own", prompt: "A rational function has vertical asymptote $x = 3$, horizontal asymptote $y = 2$ and $x$-intercept $1$. Which formula?",
        options: [{ t: "$\\dfrac{2x - 2}{x - 3}$" }, { t: "$\\dfrac{x - 1}{2x - 3}$", fb: "Its horizontal asymptote is $y = \\frac{1}{2}$ and its wall is at $x = \\frac{3}{2}$." }, { t: "$\\dfrac{2x - 3}{x - 1}$", fb: "The wall and the intercept are swapped: the wall is at $x = 1$." }],
        answer: 0, skill: "Graph a rational function", hints: ["Top zero = the intercept; bottom zero = the wall."], why: "Top $2x - 2 = 0$ at 1; bottom $x - 3$ is 0 at 3; $\\frac{2}{1} = 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A hole and a wall together.** Sketch $f(x) = \\dfrac{x^2 - 1}{(x - 1)(x + 3)}$.",
        scene: { type: "walk", how: HOW_20, rows: [
          { step: 1, m: "f(x) = \\frac{(x - 1)(x + 1)}{(x - 1)(x + 3)}", say: "Factor the top: a difference of squares." },
          { step: 1, m: "= \\frac{x + 1}{x + 3} \\quad (x \\neq 1)", say: "The factor $x - 1$ cancels: a hole, not a wall.", ask: { prompt: "What happens at $x = 1$?", answer: 0, options: [{ t: "A hole: the factor cancels" }, { t: "A vertical asymptote", fb: "A factor that cancels leaves a hole." }] } },
          { step: 2, m: "\\text{hole at } \\left(1,\\ \\tfrac{1 + 1}{1 + 3}\\right) = \\left(1,\\ \\tfrac{1}{2}\\right)", say: "Use the cancelled form to find the height of the hole." },
          { step: 2, m: "x = -3 \\qquad y = 1", say: "The wall and the level." },
          { step: 2, m: "(-1, 0) \\quad \\left(0, \\tfrac{1}{3}\\right)", say: "The intercepts of the cancelled form.", fig: H20 }] },
        gate: true, then: "Cancel first, mark the hole, then graph what is left." },
      { type: "choice", kicker: "Try it", prompt: "What are the intercepts of $f(x) = \\dfrac{2x - 6}{x + 3}$?",
        options: [{ t: "$x$-intercept $3$, $y$-intercept $-2$" }, { t: "$x$-intercept $-3$, $y$-intercept $-2$", fb: "$x = -3$ makes the bottom 0: that is the asymptote, not an intercept." }, { t: "$x$-intercept $3$, $y$-intercept $2$", fb: "$f(0) = \\frac{-6}{3} = -2$." }],
        answer: 0, skill: "Graph a rational function", hints: ["Top = 0 for $x$; put $x = 0$ for $y$."], why: "$2x - 6 = 0$ at $x = 3$; $f(0) = \\frac{-6}{3} = -2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lina says the $x$-intercepts of $f(x) = \\dfrac{x^2 - 9}{x - 3}$ are $3$ and $-3$. What is wrong?",
        options: [{ t: "$x = 3$ makes the bottom 0 too and its factor cancels: a hole, not an intercept." }, { t: "Nothing is wrong.", fb: "At $x = 3$ the function is not even defined." }, { t: "The intercepts are $9$ and $-9$.", fb: "$x^2 - 9 = 0$ gives $x = \\pm 3$." }],
        answer: 0, skill: "Graph a rational function", hints: ["Cancel before you read intercepts."], why: "$f(x) = x + 3$ for $x \\neq 3$: one intercept, $-3$." },
      { type: "choice", kicker: "Use it", prompt: "The average cost per item is $A(x) = \\dfrac{50x + 400}{x}$ dollars: \\$400 set-up cost, \\$50 per item. As $x$ gets large, $A$ levels off near…",
        options: [{ t: "\\$50 per item" }, { t: "\\$400", fb: "The set-up cost is spread over more and more items, so its share shrinks." }, { t: "\\$0", fb: "Each item still costs \\$50 to make." }],
        answer: 0, skill: "Graph a rational function", hints: ["Equal degrees: $\\frac{50}{1}$."], why: "$A(x) = 50 + \\frac{400}{x}$: horizontal asymptote $y = 50$." }
    ]
  });
  /* ======================================== 21 · Inverses of quadratics and radical functions */
  var HOW_21 = [["Restrict", "Cut the domain so the function is one-to-one."],
                ["Swap & solve", "Swap $x$ and $y$, then solve for $y$ with a square root."],
                ["Pick sign", "Choose $+$ or $-$ so the inverse's outputs match the half you kept."]];
  var Q21 = function (t) { return (t - 2) * (t - 2) + 1; };
  var DOM21 = { all: [-0.8, 4.8], right: [2, 4.8], left: [-0.8, 2] };
  var G21 = grid("The right half of y = (x - 2)^2 + 1 and its mirror image over the line y = x, which is y = 2 plus the square root of (x - 1).",
    curve(Q21, 2, 4.8, "blue", [-1, 9]).concat(curve(function (x) { return 2 + Math.sqrt(x - 1); }, 1, 9, "orange", [-1, 9]), [{ seg: [[-1, -1], [9, 9]], c: "soft", dash: true }]),
    { x: [-1, 9], y: [-1, 9], u: 26 });
  var G21b = grid("The graph of the square root of (x + 3) and its inverse, the right half of y = x^2 - 3, mirrored over y = x.",
    curve(function (x) { return Math.sqrt(x + 3); }, -3, 6, "blue", [-4, 7]).concat(curve(function (x) { return x * x - 3; }, 0, 3.2, "orange", [-4, 7]), [{ seg: [[-4, -4], [7, 7]], c: "soft", dash: true }]),
    { x: [-4, 7], y: [-4, 7], u: 26 });
  LESSONS.push({
    title: "Inverses of quadratics and radicals", art: "pcpoly",
    blurb: "Book 3.8 · A parabola has no inverse, until you cut it in half. Then the inverse is a square root.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which pair shows that $f(x) = x^2$ is **not** one-to-one?",
        options: [{ t: "$f(2) = f(-2) = 4$" }, { t: "$f(1) = 1$ and $f(2) = 4$", fb: "Different inputs with different outputs are fine for one-to-one." }, { t: "$f(0) = 0$", fb: "One input, one output: fine." }],
        answer: 0, skill: "One-to-one", hints: ["Look for two inputs with the same output."], why: "Two inputs, one output: no inverse for the whole parabola." },
      { type: "learn", kicker: "Explore",
        prompt: "$f(x) = (x - 2)^2 + 1$. The orange graph is its **mirror image** in the line $y = x$. Pick the whole parabola, then each half, and check whether the mirror is still a function. Try **all three**.",
        scene: { type: "sketch", x: [-1, 9], y: [-1, 9], u: 26, w: 308, gate: true, pts: {},
          chips: { d: { label: "Keep", v: "all", opts: [["all", "all of it"], ["right", "$x \\ge 2$"], ["left", "$x \\le 2$"]] } },
          params: { t: { min: -0.5, max: 4.5, step: 0.5, v: 3, label: "$x$" } },
          draw: function (s) {
            var D = DOM21[s.c.d], x = Math.max(D[0], Math.min(D[1], s.p.t)), y = Q21(x);
            return curve(Q21, D[0], D[1], "blue", [-1, 9]).concat(curveT(function (t) { return [Q21(t), t]; }, D[0], D[1], "orange"), [{ seg: [[-1, -1], [9, 9]], c: "soft", dash: true }, { seg: [[x, y], [y, x]], c: "soft", dash: true }, { pt: [x, y], c: "blue" }, { pt: [y, x], c: "orange" }]);
          },
          readout: function (s) {
            var D = DOM21[s.c.d], x = Math.max(D[0], Math.min(D[1], s.p.t)), y = Q21(x), seen = Math.min(Object.keys(s.seen.d).length, 3);
            var verdict = s.c.d === "all" ? "the mirror fails the **vertical line test**: not a function" : s.c.d === "right" ? "the mirror is a function: $f^{-1}(x) = 2 + \\sqrt{x - 1}$" : "the mirror is a function: $f^{-1}(x) = 2 - \\sqrt{x - 1}$";
            return "blue point $(" + nm(x) + ",\\ " + nm(y) + ")$ ↔ orange point $(" + nm(y) + ",\\ " + nm(x) + ")$<br>" + verdict + "<br>Tried " + seen + " of 3";
          },
          goal: function (s) { return Object.keys(s.seen.d).length >= 3; } },
        gate: true, then: "Mirroring swaps every point's coordinates. A whole parabola mirrors to a sideways parabola, which is **not a function**. Keep one half and the mirror is a **square root**." },
      { type: "learn", kicker: "The idea",
        prompt: "A parabola is not one-to-one, so cut it in half: **restrict the domain**. Each half has an inverse, found by swapping $x$ and $y$ and solving with a **square root**. The sign ($+$ or $-$) is decided by which half you kept.",
        scene: { type: "method", how: HOW_21 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the inverse of $f(x) = (x - 2)^2 + 1$ for $x \\ge 2$.",
        scene: { type: "walk", how: HOW_21, rows: [
          { step: 1, m: "f(x) = (x - 2)^2 + 1, \\quad x \\ge 2", say: "Keep the right half. It rises all the way, so it is one-to-one." },
          { step: 2, m: "x = (y - 2)^2 + 1", say: "Swap $x$ and $y$." },
          { step: 2, m: "x - 1 = (y - 2)^2", say: "Subtract 1 from both sides." },
          { step: 2, m: "y - 2 = \\pm\\sqrt{x - 1}", say: "Take the square root of both sides: two possible signs." },
          { step: 3, m: "y = 2 + \\sqrt{x - 1}", say: "The inverse's outputs are $y \\ge 2$, because those were the inputs we kept. So take the $+$.", ask: { prompt: "Which sign keeps $y \\ge 2$?", answer: 0, options: [{ t: "$+$" }, { t: "$-$", fb: "$2 - \\sqrt{x - 1}$ is at most 2, which is the left half." }] } },
          { step: 3, m: "f^{-1}: \\ x \\ge 1, \\ y \\ge 2", say: "The domain of $f$ ($x \\ge 2$) is the range of $f^{-1}$; the range of $f$ ($y \\ge 1$) is its domain.", fig: G21 }] },
        gate: true, then: "$f^{-1}(x) = 2 + \\sqrt{x - 1}$, for $x \\ge 1$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the inverse of $f(x) = (x - 3)^2 - 4$ for $x \\ge 3$.",
        how: HOW_21, skill: "Inverse of a quadratic",
        steps: [
          { step: 1, ask: "Why do we keep only $x \\ge 3$?", type: "choice", answer: 0, options: [{ t: "So the function is one-to-one" }, { t: "To make the graph bigger", fb: "A parabola fails the one-to-one test, but each half passes it." }], m: "x \\ge 3", say: "The right half rises all the way." },
          { step: 2, ask: "Swap: $x = (y - 3)^2 - 4$. Add 4 to both sides. What do you get?", type: "choice", answer: 0, options: [{ t: "$x + 4 = (y - 3)^2$" }, { t: "$x - 4 = (y - 3)^2$", fb: "To undo $-4$, add 4 to both sides." }], m: "x + 4 = (y - 3)^2", say: "Now take the square root." },
          { step: 3, ask: "$y - 3 = \\pm\\sqrt{x + 4}$. We kept $x \\ge 3$, so the inverse's outputs are $\\ge 3$. Which sign?", type: "choice", answer: 0, options: [{ t: "$+$" }, { t: "$-$", fb: "$3 - \\sqrt{x + 4}$ would be at most 3." }], m: "f^{-1}(x) = 3 + \\sqrt{x + 4}", say: "The plus sign." },
          { step: 3, ask: "What is the domain of $f^{-1}$?", type: "choice", answer: 0, options: [{ t: "$x \\ge -4$" }, { t: "$x \\ge 3$", fb: "That is the domain of $f$. The inverse's domain is $f$'s **range**: its lowest output is $-4$." }], m: "x \\ge -4", say: "The vertex of $f$ was $(3, -4)$." }],
        why: "Restrict, swap and solve, pick the sign." },
      { type: "num", kicker: "On your own", prompt: "$f(x) = x^2 + 1$ for $x \\ge 0$. Find $f^{-1}(10)$.", pre: "$f^{-1}(10) =$", answer: 3, skill: "Inverse of a quadratic",
        near: [{ v: 101, fb: "$101 = f(10)$. For $f^{-1}(10)$ ask: which $x \\ge 0$ has $f(x) = 10$?" }, { v: -3, fb: "The domain is $x \\ge 0$, so the answer cannot be negative." }], hints: ["Solve $x^2 + 1 = 10$."], why: "$x^2 = 9$ and $x \\ge 0$, so $x = 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Now go the other way: the inverse of a **radical** function. Find $f^{-1}$ for $f(x) = \\sqrt{x + 3}$.",
        scene: { type: "walk", how: HOW_21, rows: [
          { step: 1, m: "f(x) = \\sqrt{x + 3}", say: "Note the domain and range first: $x \\ge -3$, and $y \\ge 0$ because a root is never negative." },
          { step: 2, m: "x = \\sqrt{y + 3}", say: "Swap $x$ and $y$.", ask: { prompt: "How do you undo a square root?", answer: 0, options: [{ t: "Square both sides" }, { t: "Double both sides", fb: "Doubling undoes halving. Squaring undoes a square root." }] } },
          { step: 2, m: "x^2 = y + 3 \\ \\Rightarrow \\ y = x^2 - 3", say: "Square both sides, then subtract 3." },
          { step: 3, m: "f^{-1}(x) = x^2 - 3, \\quad x \\ge 0", say: "Only the right half of the parabola: the domain of $f^{-1}$ is the range of $f$, $y \\ge 0$.", fig: G21b }] },
        gate: true, then: "The inverse of a square root is half a parabola." },
      { type: "choice", kicker: "Try it", prompt: "What is the inverse of $g(x) = \\sqrt{x - 4}$?",
        options: [{ t: "$x^2 + 4$, for $x \\ge 0$" }, { t: "$x^2 - 4$", fb: "To undo the $-4$ inside, add 4." }, { t: "$\\sqrt{x} + 4$", fb: "Undo a square root by squaring, not by taking another root." }],
        answer: 0, skill: "Inverse of a radical", hints: ["Swap, square, add 4."], why: "$x = \\sqrt{y - 4}$ gives $y = x^2 + 4$, with $x \\ge 0$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Eli finds the inverse of $f(x) = x^2 + 3$ for $x \\ge 0$ and writes $y = \\pm\\sqrt{x - 3}$. What is wrong?",
        options: [{ t: "The inputs were $x \\ge 0$, so the outputs of the inverse are $\\ge 0$: only $+$." }, { t: "Nothing is wrong.", fb: "An inverse function gives one output for each input, so you must choose a sign." }, { t: "It should be $\\sqrt{x + 3}$.", fb: "Subtract 3 to undo the $+3$." }],
        answer: 0, skill: "Inverse of a quadratic", hints: ["How many outputs can a function give?"], why: "$f^{-1}(x) = \\sqrt{x - 3}$." },
      { type: "choice", kicker: "Use it", prompt: "An object falls $d$ metres in $t = \\sqrt{d / 5}$ seconds. Which formula gives the distance fallen after $t$ seconds?",
        options: [{ t: "$d = 5t^2$" }, { t: "$d = \\sqrt{5t}$", fb: "To undo a square root, **square** both sides." }, { t: "$d = 5t$", fb: "Squaring $\\sqrt{d / 5}$ gives $d / 5$, so $t^2 = d / 5$." }],
        answer: 0, skill: "Inverse of a radical", hints: ["Square both sides, then multiply by 5."], why: "$t^2 = d / 5$, so $d = 5t^2$ (for $t \\ge 0$)." }
    ]
  });

  /* ================================================== 22 · Direct and inverse variation */
  var HOW_22 = [["Spot it", "Direct: $y = kx$, both grow together. Inverse: $y = \\dfrac{k}{x}$, one grows as the other shrinks."],
                ["Find k", "Put one known pair into the equation and solve for $k$."],
                ["Use it", "Write the equation with its $k$ and put in the new value."]];
  var V22 = { d: function (x) { return 1.5 * x; }, i: function (x) { return 6 / x; } };
  LESSONS.push({
    title: "Direct and inverse variation", art: "pcpoly",
    blurb: "Book 3.9 · Two quantities that move together, or in opposite ways, by a fixed rule.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "3 notebooks cost \\$6. At the same price, how much do 5 notebooks cost?", post: "dollars", answer: 10, skill: "Unit rate",
        near: [{ v: 12, fb: "Each notebook costs \\$2, so 5 of them cost $5 \\cdot 2$." }], hints: ["Cost for one: $6 \\div 3$."], why: "\\$2 each: $5 \\cdot 2 = 10$ dollars." },
      { type: "learn", kicker: "Explore",
        prompt: "Move the blue point. The orange point shows what happens to the output when the input is **doubled**. Look at **both** relationships.",
        scene: { type: "sketch", x: [0, 6.5], y: [0, 9.5], u: 28, w: 230, gate: true, pts: {},
          chips: { k: { label: "Relationship", v: "d", opts: [["d", "$y = 1.5x$"], ["i", "$y = \\frac{6}{x}$"]] } },
          params: { t: { min: 1, max: 3, step: 1, v: 1, label: "$x$" } },
          draw: function (s) {
            var f = V22[s.c.k], t = s.p.t, it = curve(f, 0.4, 6.4, "blue", [0, 9.5]);
            [[t, "blue"], [2 * t, "orange"]].forEach(function (q) { it.push({ seg: [[q[0], 0], [q[0], f(q[0])]], c: q[1], dash: true }, { seg: [[0, f(q[0])], [q[0], f(q[0])]], c: q[1], dash: true }, { pt: [q[0], f(q[0])], c: q[1] }); });
            return it;
          },
          readout: function (s) {
            var f = V22[s.c.k], t = s.p.t, a = Math.round(f(t) * 100) / 100, b = Math.round(f(2 * t) * 100) / 100;
            return "$x$ goes from " + nm(t) + " to " + nm(2 * t) + " (doubled)<br>$y$ goes from " + nm(a) + " to " + nm(b) + (s.c.k === "d" ? " — **doubled** too" : " — **halved**") + "<br>Looked at " + Math.min(Object.keys(s.seen.k).length, 2) + " of 2";
          },
          goal: function (s) { return Object.keys(s.seen.k).length >= 2; } },
        gate: true, then: "In one, doubling $x$ **doubles** $y$: $y = kx$. In the other, doubling $x$ **halves** $y$: $y = \\frac{k}{x}$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Direct variation:** $y = kx$. The ratio $\\frac{y}{x}$ never changes. **Inverse variation:** $y = \\frac{k}{x}$. The product $xy$ never changes. The fixed number $k$ is the **constant of variation**.",
        scene: { type: "method", how: HOW_22 } },
      { type: "learn", kicker: "Watch",
        prompt: "$y$ varies **directly** as $x$, and $y = 12$ when $x = 4$. Find $y$ when $x = 7$.",
        scene: { type: "walk", how: HOW_22, rows: [
          { step: 1, m: "y = kx", say: "\"Varies directly\" means $y$ is a fixed number times $x$." },
          { step: 2, m: "12 = k \\cdot 4 \\ \\Rightarrow \\ k = 3", say: "Put in the known pair.", ask: { prompt: "What is $12 \\div 4$?", answer: 0, options: [{ t: "$3$" }, { t: "$8$", fb: "Divide: $12 \\div 4 = 3$." }] } },
          { step: 3, m: "y = 3x", say: "Put $k$ back in." },
          { step: 3, m: "y(7) = 3 \\cdot 7 = 21", say: "Now use the new input." }] },
        gate: true, then: "$y = 21$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do an **inverse** one. $y$ varies inversely as $x$, and $y = 6$ when $x = 4$. Find $y$ when $x = 3$.",
        how: HOW_22, skill: "Inverse variation",
        steps: [
          { step: 1, ask: "Which equation says \"$y$ varies inversely as $x$\"?", type: "choice", answer: 0, options: [{ t: "$y = \\dfrac{k}{x}$" }, { t: "$y = kx$", fb: "That is direct variation." }], m: "y = \\frac{k}{x}", say: "The input goes on the bottom." },
          { step: 2, ask: "$6 = \\dfrac{k}{4}$. What is $k$?", type: "num", pre: "$k =$", answer: 24, near: [{ v: 1.5, fb: "Multiply both sides by 4: $k = 6 \\cdot 4$." }], hint: "$k = xy = 4 \\cdot 6$.", m: "k = 24", say: "The product $xy$." },
          { step: 3, ask: "Now $y = \\dfrac{24}{3}$.", type: "num", pre: "$y =$", answer: 8, near: [{ v: 72, fb: "Divide 24 by 3." }], hint: "$24 \\div 3$.", m: "y = 8", say: "Smaller $x$, bigger $y$." }],
        why: "Find $k$ from the known pair, then use it." },
      { type: "sort", kicker: "On your own", prompt: "Is each relationship direct or inverse?",
        bins: ["Direct", "Inverse"],
        cards: [{ t: "Cost of apples at \\$2 each, and the number bought", bin: 0, fb: "More apples, more cost: $C = 2n$." }, { t: "Time to drive 120 km, and the speed", bin: 1, fb: "Faster means less time: $t = \\frac{120}{v}$." }, { t: "Circumference of a circle, and its radius", bin: 0, fb: "$C = 2\\pi r$." }, { t: "Days to finish a job, and the number of workers", bin: 1, fb: "More workers, fewer days." }, { t: "Pay at a fixed wage, and the hours worked", bin: 0, fb: "$P = wh$." }, { t: "Pages each person reads when 60 pages are shared equally, and the people", bin: 1, fb: "$p = \\frac{60}{n}$." }],
        skill: "Direct and inverse variation", hints: ["If one doubles, does the other double or halve?"], why: "Together: direct. Opposite: inverse." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Inverse square.** The brightness $B$ of a light varies inversely as the **square** of the distance $d$. $B = 9$ when $d = 2$. Find $B$ when $d = 3$.",
        scene: { type: "walk", how: HOW_22, rows: [
          { step: 1, m: "B = \\frac{k}{d^2}", say: "The distance is squared before it goes on the bottom." },
          { step: 2, m: "9 = \\frac{k}{4} \\ \\Rightarrow \\ k = 36", say: "$d^2 = 4$.", ask: { prompt: "What is $k$?", answer: 0, options: [{ t: "$36$" }, { t: "$18$", fb: "The distance squared is $2^2 = 4$, not $2$: $k = 9 \\cdot 4$." }] } },
          { step: 3, m: "B = \\frac{36}{3^2} = \\frac{36}{9} = 4", say: "Further away, dimmer." }] },
        gate: true, then: "Move out from 2 to 3 and the light fell from 9 to 4." },
      { type: "num", kicker: "Try it", prompt: "$y$ varies directly as $x$, and $y = 15$ when $x = 5$. Find $y$ when $x = 8$.", pre: "$y =$", answer: 24, skill: "Direct variation",
        near: [{ v: 3, fb: "That is $k$. Now find $y = kx$ at $x = 8$." }], hints: ["$k = 15 \\div 5$."], why: "$k = 3$, so $y = 3 \\cdot 8 = 24$." },
      { type: "choice", kicker: "Find the error",
        prompt: "$y$ varies inversely as $x$, and $y = 10$ when $x = 2$. Mia finds $k = 5$ and then $y = 5 \\cdot 5 = 25$ when $x = 5$. What is wrong?",
        options: [{ t: "Inverse means $y = \\frac{k}{x}$: $k = 20$ and $y = 4$." }, { t: "Nothing is wrong.", fb: "As $x$ goes up for inverse variation, $y$ must go down." }, { t: "She should add $k$.", fb: "Use the equation $y = \\frac{k}{x}$." }],
        answer: 0, skill: "Inverse variation", hints: ["Inverse: $y = \\frac{k}{x}$."], why: "$k = xy = 20$, so $y = \\frac{20}{5} = 4$." },
      { type: "num", kicker: "Use it", prompt: "12 painters finish a fence in 6 days. At the same pace, how many days would 9 painters take?", post: "days", answer: 8, skill: "Inverse variation",
        near: [{ v: 4.5, fb: "Fewer painters means **more** days, not fewer." }], hints: ["The total work $k = 12 \\cdot 6$."], why: "$k = 72$, and $\\frac{72}{9} = 8$." }
    ]
  });

  /* ============================================== 23 · Joint and combined variation */
  var HOW_23 = [["Write it", "\"Jointly\" means a product: $z = kxy$. Direct and inverse together: $z = \\dfrac{kx}{y}$."],
                ["Find k", "Put one set of values in and solve for $k$."],
                ["Use it", "Put in the new values."]];
  var RECT23 = { x: [4, 3], y: [2, 6], b: [4, 6] };
  LESSONS.push({
    title: "Joint and combined variation", art: "pcpoly",
    blurb: "Book 3.9 · More than one thing changes the output at once.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A rectangle is 4 wide and 5 tall. What is its area?", answer: 20, skill: "Area",
        near: [{ v: 9, fb: "Area is a product: multiply the two sides." }], hints: ["Width × height."], why: "$4 \\cdot 5 = 20$." },
      { type: "learn", kicker: "Explore",
        prompt: "The area $z = xy$ of the orange rectangle ($x = 2$ wide, $y = 3$ tall) is 6. See what happens to the area when you change one side, or **both**. Try **all three**.",
        scene: { type: "sketch", x: [0, 5], y: [0, 7], u: 40, w: 260, gate: true, pts: {},
          chips: { k: { label: "Double", v: "x", opts: [["x", "$x$"], ["y", "$y$"], ["b", "both"]] } },
          draw: function (s) { var R = RECT23[s.c.k]; return [{ poly: [[0, 0], [R[0], 0], [R[0], R[1]], [0, R[1]]], c: "blue", fill: true }, { poly: [[0, 0], [2, 0], [2, 3], [0, 3]], c: "orange", fill: true }]; },
          readout: function (s) { var R = RECT23[s.c.k], a = R[0] * R[1], f = a / 6; return "before: $x = 2,\\ y = 3$, area $6$<br>after: $x = " + R[0] + ",\\ y = " + R[1] + "$, area $" + a + "$ — **× " + f + "**<br>Looked at " + Math.min(Object.keys(s.seen.k).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.seen.k).length >= 3; } },
        gate: true, then: "Doubling one side doubles the area. Doubling **both** multiplies it by $2 \\cdot 2 = 4$. The area **varies jointly** as $x$ and $y$: $z = kxy$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Joint variation:** $z$ varies jointly as $x$ and $y$ when $z = kxy$. **Combined variation** mixes direct and inverse: \"directly as $x$ and inversely as $y$\" is $z = \\frac{kx}{y}$. Always find $k$ first.",
        scene: { type: "method", how: HOW_23 } },
      { type: "learn", kicker: "Watch",
        prompt: "$z$ varies **jointly** as $x$ and $y$, and $z = 24$ when $x = 2$ and $y = 3$. Find $z$ when $x = 5$ and $y = 4$.",
        scene: { type: "walk", how: HOW_23, rows: [
          { step: 1, m: "z = kxy", say: "\"Jointly\" means a product of the two." },
          { step: 2, m: "24 = k \\cdot 2 \\cdot 3 \\ \\Rightarrow \\ k = 4", say: "$2 \\cdot 3 = 6$, and $24 \\div 6 = 4$.", ask: { prompt: "What is $24 \\div 6$?", answer: 0, options: [{ t: "$4$" }, { t: "$18$", fb: "Divide, do not subtract." }] } },
          { step: 3, m: "z = 4xy", say: "Put $k$ back in." },
          { step: 3, m: "z = 4 \\cdot 5 \\cdot 4 = 80", say: "Use the new values." }] },
        gate: true, then: "$z = 80$." },
      { type: "guided", kicker: "Together",
        prompt: "Now a **combined** one. $z$ varies directly as $x$ and inversely as $y$. $z = 10$ when $x = 4$ and $y = 2$. Find $z$ when $x = 6$ and $y = 5$.",
        how: HOW_23, skill: "Combined variation",
        steps: [
          { step: 1, ask: "Which equation is right?", type: "choice", answer: 0, options: [{ t: "$z = \\dfrac{kx}{y}$" }, { t: "$z = kxy$", fb: "That is joint: both multiply. Here $y$ goes on the bottom." }, { t: "$z = \\dfrac{ky}{x}$", fb: "$x$ is the direct one, so it goes on top." }], m: "z = \\frac{kx}{y}", say: "Direct on top, inverse on the bottom." },
          { step: 2, ask: "$10 = \\dfrac{k \\cdot 4}{2}$. What is $k$?", type: "num", pre: "$k =$", answer: 5, near: [{ v: 20, fb: "$\\frac{4}{2} = 2$, so $10 = 2k$." }], hint: "$10 = 2k$.", m: "k = 5", say: "Half of 10." },
          { step: 3, ask: "Now $z = \\dfrac{5 \\cdot 6}{5}$.", type: "num", pre: "$z =$", answer: 6, near: [{ v: 30, fb: "Divide by $y = 5$ as well." }], hint: "$30 \\div 5$.", m: "z = 6", say: "Done." }],
        why: "Write it, find $k$, use it." },
      { type: "num", kicker: "On your own", prompt: "$F$ varies jointly as $m$ and $a$. $F = 12$ when $m = 3$ and $a = 2$. Find $F$ when $m = 4$ and $a = 5$.", pre: "$F =$", answer: 40, skill: "Joint variation",
        near: [{ v: 20, fb: "Do not forget $k$. Here $k = 12 \\div 6 = 2$." }], hints: ["$F = kma$."], why: "$k = 2$, so $F = 2 \\cdot 4 \\cdot 5 = 40$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A square in it.** $y$ varies directly as $x^2$ and inversely as $z$. $y = 6$ when $x = 3$ and $z = 9$. Find $y$ when $x = 2$ and $z = 8$.",
        scene: { type: "walk", how: HOW_23, rows: [
          { step: 1, m: "y = \\frac{kx^2}{z}", say: "The square goes on the $x$, in the top." },
          { step: 2, m: "6 = \\frac{k \\cdot 9}{9} \\ \\Rightarrow \\ k = 6", say: "The 9 on top cancels the 9 on the bottom.", ask: { prompt: "What is $k$?", answer: 0, options: [{ t: "$6$" }, { t: "$54$", fb: "$\\frac{9}{9} = 1$, so $6 = k$." }] } },
          { step: 3, m: "y = \\frac{6 \\cdot 2^2}{8} = \\frac{24}{8} = 3", say: "Use the new values." }] },
        gate: true, then: "$y = 3$." },
      { type: "choice", kicker: "Try it", prompt: "Which equation says \"$T$ varies directly as the square of $s$ and inversely as $r$\"?",
        options: [{ t: "$T = \\dfrac{ks^2}{r}$" }, { t: "$T = ksr^2$", fb: "The square is on $s$, and $r$ goes on the bottom." }, { t: "$T = \\dfrac{kr}{s^2}$", fb: "The roles are swapped: $s^2$ is the direct one." }],
        answer: 0, skill: "Combined variation", hints: ["Direct on top, inverse on the bottom."], why: "$s^2$ on top, $r$ on the bottom." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ava writes \"$z$ varies jointly as $x$ and $y$\" as $z = k(x + y)$. What is wrong?",
        options: [{ t: "Joint means a **product**: $z = kxy$." }, { t: "Nothing is wrong.", fb: "Doubling both $x$ and $y$ should make $z$ four times bigger, as you saw with the rectangle." }, { t: "It should be $z = \\frac{k}{xy}$.", fb: "That is inverse in both." }],
        answer: 0, skill: "Joint variation", hints: ["Think of the area of a rectangle."], why: "$z = kxy$." },
      { type: "num", kicker: "Use it", prompt: "The cost of a rectangular rug varies jointly as its length and width. A rug 2 by 3 costs \\$30. What does a 3 by 4 rug cost?", post: "dollars", answer: 60, skill: "Joint variation",
        near: [{ v: 12, fb: "That is the area. Multiply by $k = 5$ dollars per square unit." }], hints: ["$k = 30 \\div 6$."], why: "$k = 5$, and $5 \\cdot 12 = 60$ dollars." }
    ]
  });
  /* ================================================================ Skills */
  function divisors(n) { var d = []; n = Math.abs(n); for (var i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; }
  function pxn(n) { return n === 1 ? "x" : "x^" + n; }
  // x - r written the way a person writes it: (x - 2), (x + 3).
  function fac(r) { return r === 0 ? "x" : "(x " + (r < 0 ? "+ " + (-r) : "- " + r) + ")"; }
  var SKILLS = [
    { id: "pc3-imag", title: "Powers of i and roots of negatives", lesson: 2,
      gen: function (R) {
        if (R.chance(0.5)) {
          var n = R.int(5, 47), r = n % 4, all = ["1", "i", "-1", "-i"], ans = all[r];
          return mc(R, { prompt: "Simplify $i^{" + n + "}$.", right: "$" + ans + "$",
            wrong: all.filter(function (t) { return t !== ans; }).map(function (t) { return { t: "$" + t + "$", fb: "Divide the power by 4 and use the remainder: $" + n + " = 4 \\cdot " + Math.floor(n / 4) + " + " + r + "$, so $i^{" + n + "} = i^{" + r + "} = " + ans + "$." }; }), keep: true,
            hints: ["The powers of $i$ repeat every 4: $i, -1, -i, 1$."], why: "$i^{" + n + "} = i^{" + r + "} = " + ans + "$." });
        }
        var a = R.int(2, 12);
        return mc(R, { prompt: "Simplify $\\sqrt{-" + a * a + "}$.", right: "$" + a + "i$",
          wrong: [{ t: "$-" + a + "i$", fb: "The square root symbol means the positive root: $" + a + "i$." }, { t: "$" + a + "$", fb: "A negative number under the root gives an **imaginary** answer." }, { t: "$-" + a + "$", fb: "$(-" + a + ")^2 = " + a * a + "$, not $-" + a * a + "$." }], keep: true,
          hints: ["$\\sqrt{-1} = i$."], why: "$\\sqrt{-" + a * a + "} = \\sqrt{" + a * a + "}\\sqrt{-1} = " + a + "i$." });
      } },
    { id: "pc3-cadd", title: "Add or subtract complex numbers", lesson: 3,
      gen: function (R) {
        var a = R.int(-6, 8), b = R.nz(-6, 6), c = R.int(-6, 8), d = R.nz(-6, 6), sub = R.chance(0.5), re = sub ? a - c : a + c, im = sub ? b - d : b + d, ans = cx(re, im);
        return mc(R, { prompt: "Find $(" + cx(a, b) + ") " + (sub ? "-" : "+") + " (" + cx(c, d) + ")$.", right: "$" + ans + "$",
          wrong: [{ t: "$" + cx(re, -im) + "$", fb: "Check the sign of the imaginary part: $" + b + (sub ? " - " + par(d) : " + " + par(d)) + " = " + im + "$." },
                  { t: "$" + cx(-re, im) + "$", fb: "Check the sign of the real part: $" + a + (sub ? " - " + par(c) : " + " + par(c)) + " = " + re + "$." },
                  { t: "$" + (sub ? cx(a + c, b + d) : cx(a - c, b - d)) + "$", fb: "That " + (sub ? "adds" : "subtracts") + ". The problem " + (sub ? "subtracts" : "adds") + "." }], keep: true,
          hints: ["Combine the real parts, then the imaginary parts."], why: "Real: $" + a + (sub ? " - " : " + ") + par(c) + " = " + re + "$. Imaginary: $" + b + (sub ? " - " : " + ") + par(d) + " = " + im + "$." });
      } },
    { id: "pc3-cmul", title: "Multiply complex numbers", lesson: 4,
      gen: function (R) {
        var a = R.nz(-4, 5), b = R.nz(-4, 4), c = R.nz(-4, 5), d = R.nz(-4, 4), re = a * c - b * d, im = a * d + b * c, ans = cx(re, im);
        return mc(R, { prompt: "Multiply $(" + cx(a, b) + ")(" + cx(c, d) + ")$.", right: "$" + ans + "$",
          wrong: [{ t: "$" + cx(a * c + b * d, im) + "$", fb: "$i^2 = -1$, so the $bd$ term is **subtracted**: $" + a * c + " - " + par(b * d) + "$." },
                  { t: "$" + cx(a * c, b * d) + "$", fb: "Multiply every term by every term (first, outer, inner, last), then collect." },
                  { t: "$" + cx(re, a * d - b * c) + "$", fb: "The two middle terms add: $" + a * d + " + " + par(b * c) + "$." }], keep: true,
          hints: ["First, outer, inner, last, then use $i^2 = -1$."], why: "Real: $" + a * c + " - " + par(b * d) + " = " + re + "$. Imaginary: $" + a * d + " + " + par(b * c) + " = " + im + "$." });
      } },
    { id: "pc3-cdiv", title: "Divide complex numbers", lesson: 5,
      gen: function (R) {
        var p = R.nz(-4, 4), q = R.nz(-4, 4), c = R.nz(-3, 3), d = R.nz(-3, 3), nre = p * c - q * d, nim = p * d + q * c, den = c * c + d * d;
        return mc(R, { prompt: "Divide $\\dfrac{" + cx(nre, nim) + "}{" + cx(c, d) + "}$.", right: "$" + cx(p, q) + "$",
          wrong: [{ t: "$" + cx(p, -q) + "$", fb: "Check the sign of the imaginary part." }, { t: "$" + cx(-p, q) + "$", fb: "Check the sign of the real part." }, { t: "$" + cx(q, p) + "$", fb: "The real and imaginary parts are in the wrong places." }], keep: true,
          hints: ["Multiply the top and bottom by the conjugate $" + cx(c, -d) + "$."], why: "Multiply top and bottom by $" + cx(c, -d) + "$: the bottom becomes $" + c + "^2 + " + par(d) + "^2 = " + den + "$, and the quotient is $" + cx(p, q) + "$." });
      } },
    { id: "pc3-parab", title: "The vertex from vertex form", lesson: 6,
      gen: function (R) {
        var a = R.nz(-3, 3), h = R.nz(-6, 6), k = R.nz(-8, 8), aa = a === 1 ? "" : a === -1 ? "-" : String(a);
        return mc(R, { prompt: "What is the vertex of $y = " + aa + "(x " + signed(-h) + ")^2 " + signed(k) + "$?", right: "$(" + h + ",\\ " + k + ")$",
          wrong: [{ t: "$(" + (-h) + ",\\ " + k + ")$", fb: "The sign inside the bracket is the **opposite** of $h$: $(x " + signed(-h) + ")$ means $h = " + h + "$." }, { t: "$(" + h + ",\\ " + (-k) + ")$", fb: "$k$ is the number outside, with its own sign: $" + signed(k) + "$ means $k = " + k + "$." }, { t: "$(" + (-h) + ",\\ " + (-k) + ")$", fb: "Only the number inside the bracket changes sign." }], keep: true,
          hints: ["$y = a(x - h)^2 + k$ has vertex $(h, k)$."], why: "$(x " + signed(-h) + ") = (x - " + par(h) + ")$, so $h = " + h + "$ and $k = " + k + "$." });
      } },
    { id: "pc3-vtx", title: "The maximum or minimum value", lesson: 7,
      gen: function (R) {
        var a = R.pick([1, 2, -1, -2]), h = R.nz(-4, 4), k = R.int(-9, 9), b = -2 * a * h, c = a * h * h + k, f = poly([[a, "x^2"], [b, "x"], [c, ""]]);
        return { type: "num", prompt: "Find the **" + (a > 0 ? "minimum" : "maximum") + " value** of $f(x) = " + f + "$.", pre: "value =", answer: k,
          near: near(k, [{ v: h, fb: "$" + h + "$ is **where** the extreme value happens (the $x$-coordinate). The question asks for the value, $f(" + h + ")$." }, { v: c, fb: "$" + c + "$ is $f(0)$. Find the vertex first: $x = \\frac{-b}{2a} = " + h + "$." }]),
          hints: ["The vertex is at $x = \\frac{-b}{2a}$. Then put that into $f$."], why: "$x = \\frac{" + (-b) + "}{" + 2 * a + "} = " + h + "$, and $f(" + h + ") = " + k + "$." };
      } },
    { id: "pc3-qzero", title: "Zeros of a quadratic", lesson: 8,
      gen: function (R) {
        var r = R.int(-7, 6), s = r + R.int(1, 6), f = poly([[1, "x^2"], [-(r + s), "x"], [r * s, ""]]);
        return { type: "num", prompt: "Find the **larger** zero of $f(x) = " + f + "$.", pre: "$x =$", answer: s,
          near: near(s, [{ v: r, fb: "That is the smaller zero. The question asks for the larger one." }, { v: -s, fb: "Check the sign: the factor $(x - " + par(s) + ")$ gives the zero $x = " + s + "$." }]),
          hints: ["Factor: two numbers that multiply to $" + r * s + "$ and add to $" + (-(r + s)) + "$."], why: "$f(x) = " + fac(r) + fac(s) + "$, with zeros $" + r + "$ and $" + s + "$." };
      } },
    { id: "pc3-qmodel", title: "A quadratic model", lesson: 9,
      gen: function (R) {
        var a = R.pick([1, 2, 4, 5]), m = R.int(2, 7), c0 = R.pick([0, 0, 2, 3, 5]), eq = poly([[-a, "t^2"], [2 * a * m, "t"], [c0, ""]]);
        if (R.chance(0.5)) return { type: "num", prompt: "A ball is thrown up. Its height in metres after $t$ seconds is $h(t) = " + eq + "$. After how many seconds is it highest?", pre: "$t =$", post: "seconds", answer: m,
          near: near(m, [{ v: a * m * m + c0, fb: "That is the greatest **height**. The question asks for the **time**." }, { v: 2 * m, fb: "That is the time it comes back to the starting height. The highest point is halfway." }]),
          hints: ["The vertex: $t = \\frac{-b}{2a}$."], why: "$t = \\frac{-" + 2 * a * m + "}{" + (-2 * a) + "} = " + m + "$ seconds." };
        return { type: "num", prompt: "A ball is thrown up. Its height in metres after $t$ seconds is $h(t) = " + eq + "$. What is the greatest height it reaches?", pre: "height =", post: "metres", answer: a * m * m + c0,
          near: near(a * m * m + c0, [{ v: m, fb: "That is the **time** of the highest point. The question asks for the height at that time." }, { v: c0, fb: "That is the starting height, $h(0)$." }]),
          hints: ["Find the vertex time $t = \\frac{-b}{2a}$, then put it into $h$."], why: "The highest point is at $t = " + m + "$, and $h(" + m + ") = " + (a * m * m + c0) + "$ metres." };
      } },
    { id: "pc3-ends", title: "End behavior of a power function", lesson: 10,
      gen: function (R) {
        var n = R.int(2, 7), a = R.nz(-5, 5), even = n % 2 === 0, T = ["Both ends up", "Both ends down", "Left down, right up", "Left up, right down"], right = even ? (a > 0 ? T[0] : T[1]) : (a > 0 ? T[2] : T[3]);
        return mc(R, { prompt: "What do the ends of $f(x) = " + (a === 1 ? "" : a === -1 ? "-" : a) + "x^{" + n + "}$ do?", right: right,
          wrong: T.filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: "The power " + n + " is " + (even ? "even" : "odd") + " and the coefficient is " + (a > 0 ? "positive" : "negative") + ": " + right.toLowerCase() + "." }; }), keep: true,
          hints: ["Even power: both ends match. Odd: opposite. Then the sign."], why: "Power " + (even ? "even" : "odd") + ", coefficient " + (a > 0 ? "positive" : "negative") + ": " + right.toLowerCase() + "." });
      } },
    { id: "pc3-deg", title: "Degree and leading coefficient", lesson: 11,
      gen: function (R) {
        var p = R.int(1, 3), q = R.int(1, 3), c = R.int(2, 5), a = R.nz(-4, 4), b = R.nz(-4, 4), f = "(x " + signed(a) + ")" + (p > 1 ? "^" + p : "") + "(x " + signed(b) + ")" + (q > 1 ? "^" + q : "") + "(" + c + "x - 1)";
        if (R.chance(0.5)) return { type: "num", prompt: "What is the **degree** of $f(x) = " + f + "$? (Do not multiply it out.)", answer: p + q + 1,
          near: near(p + q + 1, [{ v: 3, fb: "Count the **powers**, not the factors: $" + p + " + " + q + " + 1$." }, { v: p * q, fb: "Add the powers: the factors multiply, so their powers add." }]),
          hints: ["Each factor contributes the power of its $x$."], why: "$" + p + " + " + q + " + 1 = " + (p + q + 1) + "$." };
        return { type: "num", prompt: "What is the **leading coefficient** of $f(x) = " + f + "$? (Do not multiply it out.)", answer: c,
          near: near(c, [{ v: p + q + 1, fb: "That is the degree. The leading coefficient multiplies the highest power." }]),
          hints: ["Multiply the leading coefficients of the factors: $1 \\cdot 1 \\cdot " + c + "$."], why: "Only $(" + c + "x - 1)$ has a coefficient other than 1: the leading coefficient is $" + c + "$." };
      } },
    { id: "pc3-pzero", title: "Zeros of a factored polynomial", lesson: 12,
      gen: function (R) {
        var rs = []; while (rs.length < 3) { var v = R.nz(-6, 6); if (rs.indexOf(v) < 0) rs.push(v); }
        var f = rs.map(fac).join(""), srt = function (arr) { return arr.slice().sort(function (x, y) { return x - y; }); }, L2 = function (arr) { return "$" + srt(arr).join(",\\ ") + "$"; };
        var flip = rs.map(function (v) { return -v; }), one = rs.slice(); one[0] = -one[0];
        return mc(R, { prompt: "Which list has all the zeros of $f(x) = " + f + "$?", right: L2(rs),
          wrong: [{ t: L2(flip), fb: "The factor $(x - 2)$ gives the zero $x = 2$: the sign changes from the bracket to the zero." }, { t: L2(one), fb: "Check every bracket: each zero has the opposite sign of the number in its bracket." }], keep: true,
          hints: ["Set each factor equal to 0."], why: "$" + rs.map(function (v) { return "x = " + v; }).join(",\\ ") + "$." });
      } },
    { id: "pc3-mult", title: "Cross or touch", lesson: 13,
      gen: function (R) {
        var r1 = R.nz(-5, 5), r2 = R.nz(-5, 5); if (r2 === r1) r2 = -r1;
        var e1 = R.pick([2, 4]), e2 = R.pick([1, 3]), swap = R.chance(0.5), pw1 = swap ? e2 : e1, pw2 = swap ? e1 : e2, touch = swap ? r2 : r1;
        var f = fac(r1) + (pw1 > 1 ? "^" + pw1 : "") + fac(r2) + (pw2 > 1 ? "^" + pw2 : "");
        return mc(R, { prompt: "At which zero does the graph of $f(x) = " + f + "$ **touch** the $x$-axis and turn back?", right: "$x = " + touch + "$",
          wrong: [{ t: "$x = " + (touch === r1 ? r2 : r1) + "$", fb: "That factor has an **odd** power: the graph crosses there." }, { t: "Both of them", fb: "Only the **even** power touches; the odd power crosses." }, { t: "Neither of them", fb: "An even power means the graph touches and turns." }], keep: true,
          hints: ["Even power: touch. Odd power: cross."], why: "The even power " + e1 + " sits on the factor for $x = " + touch + "$." });
      } },
    { id: "pc3-sign", title: "The sign of a polynomial", lesson: 14,
      gen: function (R) {
        var a = R.int(-5, -1), b = a + R.int(1, 3), c = b + R.int(1, 3), pts = [a - 1, (a + b) / 2, (b + c) / 2, c + 1], i = R.int(0, 3), m = pts[i];
        var negs = [3, 2, 1, 0][i], pos = negs % 2 === 0;
        return mc(R, { prompt: "$f(x) = " + [a, b, c].map(fac).join("") + "$. Without multiplying out, is $f(" + nm(m) + ")$ positive or negative?", right: pos ? "Positive" : "Negative",
          wrong: [{ t: pos ? "Negative" : "Positive", fb: "Count the factors that are negative at $x = " + nm(m) + "$: there are " + negs + ". " + (negs % 2 === 0 ? "An even number of negatives gives a positive." : "An odd number of negatives gives a negative.") }], keep: true,
          hints: ["Check each bracket: is it positive or negative at that $x$?"], why: negs + " negative factor" + (negs === 1 ? "" : "s") + ": the product is " + (pos ? "positive" : "negative") + "." });
      } },
    { id: "pc3-ldiv", title: "Divide polynomials", lesson: 15,
      gen: function (R) {
        var p = R.int(1, 3), m = R.nz(-5, 5), n = R.nz(-5, 5), dv = poly([[p, "x^2"], [p * n + m, "x"], [m * n, ""]]), q = poly([[p, "x"], [m, ""]]);
        return { type: "expr", prompt: "Divide $(" + dv + ") \\div (x " + signed(n) + ")$.", answer: clean(q), shown: q, form: "simplified", keys: KEYS_POLY, placeholder: "Use x",
          near: [{ v: clean("x" + signed(n).replace(" ", "")), fb: "That is the divisor. Divide the leading terms: $" + p + "x^2 \\div x$." }],
          hints: ["Divide the leading terms, multiply back, subtract."], why: "$(x " + signed(n) + ")(" + q + ") = " + dv + "$, so the quotient is $" + q + "$." };
      } },
    { id: "pc3-synth", title: "The remainder by synthetic division", lesson: 16,
      gen: function (R) {
        var a = R.pick([1, 1, 2]), b = R.int(-5, 5), c = R.int(-5, 5), d = R.int(-6, 6), k = R.nz(-3, 3), f = function (x) { return a * x * x * x + b * x * x + c * x + d; }, ans = f(k);
        return { type: "num", prompt: "Find the remainder when $" + poly([[a, "x^3"], [b, "x^2"], [c, "x"], [d, ""]]) + "$ is divided by $x " + signed(-k) + "$.", pre: "remainder =", answer: ans,
          near: near(ans, [{ v: f(-k), fb: "Check the sign of $k$: $x " + signed(-k) + "$ means $k = " + k + "$." }]),
          hints: ["The remainder is $f(" + k + ")$. Or use synthetic division with $k = " + k + "$."], why: "$f(" + k + ") = " + ans + "$." };
      } },
    { id: "pc3-rzt", title: "Possible rational zeros", lesson: 17,
      gen: function (R) {
        var A = R.pick([2, 3, 4, 6]), D = R.pick([4, 6, 8, 9, 10, 12]) * R.pick([1, -1]), ps = divisors(D), qs = divisors(A).filter(function (q) { return q > 1; });
        var ok = function (p, q) { return D % p === 0 && A % q === 0; }, rt = function (p, q) { return "$\\pm\\dfrac{" + p + "}{" + q + "}$"; };
        var good = [], bad = [];
        ps.forEach(function (p) { qs.forEach(function (q) { if (L.gcd(p, q) === 1) good.push([p, q]); }); });
        var g = R.pick(good);
        [[5, 2], [7, 3], [Math.abs(D) + 1, 2], [3, 8], [1, 5], [Math.abs(D) + 2, 3], [5, 4]].forEach(function (c) { if (!(D % c[0] === 0 && A % c[1] === 0) && L.gcd(c[0], c[1]) === 1 && bad.length < 3 && bad.every(function (b) { return b[0] !== c[0] || b[1] !== c[1]; })) bad.push(c); });
        return mc(R, { prompt: "A polynomial has leading coefficient $" + A + "$ and constant term $" + D + "$. Which could be a rational zero?", right: rt(g[0], g[1]),
          wrong: bad.map(function (c) { return { t: rt(c[0], c[1]), fb: D % c[0] !== 0 ? "$p = " + c[0] + "$ must divide the constant term $" + D + "$, and it does not." : "$q = " + c[1] + "$ must divide the leading coefficient $" + A + "$, and it does not." }; }), keep: true,
          hints: ["$p$ divides the constant term. $q$ divides the leading coefficient."], why: "$" + g[0] + "$ divides $" + D + "$ and $" + g[1] + "$ divides $" + A + "$." });
      } },
    { id: "pc3-czero", title: "A quadratic from complex zeros", lesson: 18,
      gen: function (R) {
        var a = R.int(-3, 3), b = R.int(1, 4), q = poly([[1, "x^2"], [-2 * a, "x"], [a * a + b * b, ""]]);
        return { type: "expr", prompt: "Write the quadratic $x^2 + px + q$ with real coefficients whose zeros are $" + cx(a, b) + "$ and $" + cx(a, -b) + "$.", answer: clean(q), shown: q, form: "simplified", keys: KEYS_POLY, placeholder: "Use x",
          near: [{ v: clean(poly([[1, "x^2"], [-2 * a, "x"], [a * a - b * b, ""]])), fb: "The product of the zeros is $a^2 + b^2$, because $i^2 = -1$ makes $-b^2i^2 = +b^2$." }],
          hints: ["Sum of the zeros $= " + 2 * a + "$; product $= " + (a * a + b * b) + "$. Then $x^2 - (\\text{sum})x + \\text{product}$."], why: "$(x - (" + cx(a, b) + "))(x - (" + cx(a, -b) + ")) = " + q + "$." };
      } },
    { id: "pc3-vasy", title: "Vertical asymptotes and holes", lesson: 19,
      gen: function (R) {
        var a = R.nz(-5, 5), b = R.nz(-5, 5); if (b === a) b = -a;
        if (R.chance(0.5)) return mc(R, { prompt: "Which is true of $f(x) = \\dfrac{x " + signed(-a) + "}{" + fac(a) + fac(b) + "}$?", right: "Hole at $x = " + a + "$, asymptote at $x = " + b + "$",
          wrong: [{ t: "Asymptotes at $x = " + a + "$ and $x = " + b + "$", fb: "The factor $" + fac(a) + "$ cancels with the top: only a hole." }, { t: "Hole at $x = " + b + "$, asymptote at $x = " + a + "$", fb: "It is the factor on the **top** that cancels: $" + fac(a) + "$." }, { t: "No asymptotes", fb: "$" + fac(b) + "$ does not cancel, so it leaves an asymptote." }], keep: true,
          hints: ["Cancel any factor that appears on the top and the bottom."], why: "$" + fac(a) + "$ cancels: a hole at $x = " + a + "$. $" + fac(b) + "$ stays: a wall at $x = " + b + "$." });
        var p = R.nz(-6, 6); while (p === -a || p === -b) p = R.nz(-6, 6);
        return mc(R, { prompt: "Which is true of $f(x) = \\dfrac{x " + signed(p) + "}{" + fac(a) + fac(b) + "}$?", right: "Vertical asymptotes at $x = " + a + "$ and $x = " + b + "$",
          wrong: [{ t: "A vertical asymptote at $x = " + (-p) + "$", fb: "$x = " + (-p) + "$ makes the **top** 0: that is an $x$-intercept." }, { t: "A hole at $x = " + a + "$", fb: "Nothing cancels: the top is $x " + signed(p) + "$." }, { t: "No vertical asymptotes", fb: "The bottom is 0 at $x = " + a + "$ and $x = " + b + "$, and nothing cancels." }], keep: true,
          hints: ["Where is the bottom 0? Does anything cancel?"], why: "The bottom is 0 at $" + a + "$ and $" + b + "$, and the top $x " + signed(p) + "$ cancels neither." });
      } },
    { id: "pc3-hasy", title: "Horizontal asymptotes", lesson: 20,
      gen: function (R) {
        var n = R.int(1, 3), m = R.int(1, 3), A = R.nz(-6, 6), B = R.nz(-6, 6);
        if (n === m && A === B) B = -B;
        var f = "\\dfrac{" + poly([[A, pxn(n)], [R.nz(-5, 5), ""]]) + "}{" + poly([[B, pxn(m)], [R.nz(-5, 5), ""]]) + "}";
        var right = n < m ? "$y = 0$" : n === m ? "$y = " + ratTex(A, B) + "$" : "No horizontal asymptote";
        return mc(R, { prompt: "What is the horizontal asymptote of $f(x) = " + f + "$?", right: right,
          wrong: [{ t: "$y = 0$", fb: "That is when the **bottom** has the higher degree." }, { t: "$y = " + ratTex(A, B) + "$", fb: "That is the answer only when the degrees are **equal**." }, { t: "$y = " + ratTex(B, A) + "$", fb: "Top over bottom, not bottom over top." }, { t: "No horizontal asymptote", fb: "That is when the **top** has the higher degree." }], keep: true,
          hints: ["Compare the degrees of the top and bottom."], why: "Top degree " + n + ", bottom degree " + m + ": " + (n < m ? "the line $y = 0$" : n === m ? "the ratio of leading coefficients, $\\frac{" + A + "}{" + B + "}$" : "no horizontal asymptote") + "." });
      } },
    { id: "pc3-ratint", title: "Intercepts of a rational function", lesson: 21,
      gen: function (R) {
        var a = R.pick([2, 3, 4]), p = R.nz(-5, 5), e = R.pick([1, 2, 3, 4, 6].filter(function (v) { return (a * p) % v === 0; })) * R.pick([1, -1]), ans = -a * p / e;
        return { type: "num", prompt: "Find the $y$-intercept of $f(x) = \\dfrac{" + poly([[a, "x"], [-a * p, ""]]) + "}{x " + signed(e) + "}$.", pre: "$f(0) =$", answer: ans,
          near: near(ans, [{ v: -ans, fb: "Check the signs in $\\frac{" + (-a * p) + "}{" + e + "}$." }, { v: p, fb: "$" + p + "$ is the $x$-intercept (the top is 0 there). For the $y$-intercept put $x = 0$." }]),
          hints: ["Put in $x = 0$."], why: "$f(0) = \\frac{" + (-a * p) + "}{" + e + "} = " + ans + "$." };
      } },
    { id: "pc3-invq", title: "Inverse of a restricted quadratic", lesson: 22,
      gen: function (R) {
        var h = R.nz(-5, 5), k = R.nz(-6, 6);
        return mc(R, { prompt: "$f(x) = (x " + signed(-h) + ")^2 " + signed(k) + "$ for $x \\ge " + h + "$. Find $f^{-1}(x)$.", right: "$" + h + " + \\sqrt{x " + signed(-k) + "}$",
          wrong: [{ t: "$" + h + " - \\sqrt{x " + signed(-k) + "}$", fb: "That is the inverse of the **left** half. We kept $x \\ge " + h + "$, so the plus sign." }, { t: "$" + (-h) + " + \\sqrt{x " + signed(-k) + "}$", fb: "The number added is $h = " + h + "$ itself." }, { t: "$" + h + " + \\sqrt{x " + signed(k) + "}$", fb: "To undo $" + signed(k) + "$, do the opposite: $x " + signed(-k) + "$." }], keep: true,
          hints: ["Swap $x$ and $y$, move the constant, take the root, then use the sign that keeps $y \\ge " + h + "$."], why: "$x - " + par(k) + " = (y - " + par(h) + ")^2$, so $y = " + h + " + \\sqrt{x " + signed(-k) + "}$." });
      } },
    { id: "pc3-var", title: "Direct and inverse variation", lesson: 23,
      gen: function (R) {
        if (R.chance(0.5)) {
          var k = R.int(2, 7), x1 = R.int(2, 6), x2 = x1 + R.int(1, 4), y1 = k * x1, y2 = k * x2;
          return { type: "num", prompt: "$y$ varies **directly** as $x$, and $y = " + y1 + "$ when $x = " + x1 + "$. Find $y$ when $x = " + x2 + "$.", pre: "$y =$", answer: y2,
            near: near(y2, [{ v: y1 + (x2 - x1), fb: "Direct variation multiplies by $k$; it does not add." }, { v: k, fb: "That is $k$. Now find $y = kx$ at $x = " + x2 + "$." }]),
            hints: ["First $k = y \\div x$."], why: "$k = " + k + "$, so $y = " + k + " \\cdot " + x2 + " = " + y2 + "$." };
        }
        var x1 = R.pick([2, 3, 4, 6]), y1 = R.int(2, 9), kk = x1 * y1, cands = divisors(kk).filter(function (d) { return d !== x1; }), x2 = R.pick(cands), y2 = kk / x2;
        return { type: "num", prompt: "$y$ varies **inversely** as $x$, and $y = " + y1 + "$ when $x = " + x1 + "$. Find $y$ when $x = " + x2 + "$.", pre: "$y =$", answer: y2,
          near: near(y2, [{ v: y1 * x2 / x1, fb: "That treats it as direct variation. For inverse variation, $xy$ stays the same." }, { v: kk, fb: "$" + kk + "$ is $k$. Now find $y = \\frac{k}{x}$ at $x = " + x2 + "$." }]),
          hints: ["First $k = xy$."], why: "$k = " + kk + "$, so $y = \\frac{" + kk + "}{" + x2 + "} = " + y2 + "$." };
      } },
    { id: "pc3-joint", title: "Joint and combined variation", lesson: 24,
      gen: function (R) {
        var k = R.int(2, 6);
        if (R.chance(0.5)) {
          var x1 = R.int(1, 4), y1 = R.int(1, 4), x2 = R.int(2, 6), y2 = R.int(2, 6), z1 = k * x1 * y1, z2 = k * x2 * y2;
          return { type: "num", prompt: "$z$ varies **jointly** as $x$ and $y$. $z = " + z1 + "$ when $x = " + x1 + "$ and $y = " + y1 + "$. Find $z$ when $x = " + x2 + "$ and $y = " + y2 + "$.", pre: "$z =$", answer: z2,
            near: near(z2, [{ v: x2 * y2, fb: "Do not forget $k = " + k + "$." }, { v: k * (x2 + y2), fb: "Joint means a **product**: $z = kxy$." }]),
            hints: ["$z = kxy$. Find $k$ first."], why: "$k = " + z1 + " \\div " + x1 * y1 + " = " + k + "$, and $z = " + k + " \\cdot " + x2 + " \\cdot " + y2 + " = " + z2 + "$." };
        }
        var yy1 = R.pick([2, 3, 4]), yy2 = R.pick([2, 3, 4, 5, 6]), t1 = R.int(1, 3), t2 = R.int(1, 4), xx1 = yy1 * t1, xx2 = yy2 * t2, zz1 = k * t1, zz2 = k * t2;
        return { type: "num", prompt: "$z$ varies directly as $x$ and inversely as $y$. $z = " + zz1 + "$ when $x = " + xx1 + "$ and $y = " + yy1 + "$. Find $z$ when $x = " + xx2 + "$ and $y = " + yy2 + "$.", pre: "$z =$", answer: zz2,
          near: near(zz2, [{ v: k * xx2 * yy2, fb: "$y$ is on the **bottom**: $z = \\frac{kx}{y}$." }]),
          hints: ["$z = \\frac{kx}{y}$. Find $k$ first."], why: "$k = " + k + "$, and $z = \\frac{" + k + " \\cdot " + xx2 + "}{" + yy2 + "} = " + zz2 + "$." };
      } }
  ];
  L.unit("precalc", 3, {
    title: "Polynomial and Rational Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Imaginary and complex numbers: adding, multiplying and dividing.", skills: ["pc3-imag", "pc3-cadd", "pc3-cmul", "pc3-cdiv"], per: 2 },
      { title: "Quiz 2", after: 9, blurb: "Quadratic functions: vertex, extreme values, zeros and models.", skills: ["pc3-parab", "pc3-vtx", "pc3-qzero", "pc3-qmodel"], per: 2 },
      { title: "Quiz 3", after: 14, blurb: "Polynomial graphs: ends, degree, zeros, multiplicity and signs.", skills: ["pc3-ends", "pc3-deg", "pc3-pzero", "pc3-mult", "pc3-sign"], per: 2 },
      { title: "Quiz 4", after: 18, blurb: "Dividing polynomials, the remainder and finding every zero.", skills: ["pc3-ldiv", "pc3-synth", "pc3-rzt", "pc3-czero"], per: 2 },
      { title: "Quiz 5", after: 21, blurb: "Rational functions: asymptotes, holes and intercepts.", skills: ["pc3-vasy", "pc3-hasy", "pc3-ratint"], per: 2 },
      { title: "Quiz 6", after: 24, blurb: "Inverses of radical functions, and variation.", skills: ["pc3-invq", "pc3-var", "pc3-joint"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:3", {
    2: { name: "Imaginary numbers", frame: "The imaginary unit $i$ is defined by $i^2 =$ [[$-1$]], so $\\sqrt{-1} =$ [[$i$]]. A complex number is [[$a + bi$]]. The powers of $i$ repeat every [[4]] steps: $i, -1, -i, 1$.",
         chips: ["$1$", "3"], fb: { "$1$": "$i^2 = -1$, not $+1$: that is what makes $i$ new.", "3": "The cycle is $i, -1, -i, 1$: four numbers, then it starts again." } },
    3: { name: "The complex plane", frame: "A complex number $a + bi$ is the point $(a, b)$: the [[real]] part goes along the horizontal axis and the [[imaginary]] part goes up the vertical axis. To add or subtract, combine the [[real]] parts and the [[imaginary]] parts [[separately]].",
         chips: ["slope", "together"], fb: { "slope": "A complex number is a point, not a line.", "together": "Real and imaginary parts never mix: $3 + 2i$ stays as it is." } },
    4: { name: "Multiplying complex numbers", frame: "Multiply like binomials: first, outer, inner, last. Then replace $i^2$ with [[$-1$]]. So $(a + bi)(c + di) = (ac -$ [[$bd$]]$) + (ad + bc)i$. The product of a number and its [[conjugate]] is always [[real]].",
         chips: ["$+1$", "imaginary"], fb: { "$+1$": "$i^2 = -1$: the $bd$ term is subtracted.", "imaginary": "$(a + bi)(a - bi) = a^2 + b^2$: no $i$ is left." } },
    5: { name: "Dividing complex numbers", frame: "To divide, multiply the top and bottom by the [[conjugate]] of the bottom. The bottom becomes the [[real]] number $c^2 + d^2$. Then split into a real part and an [[imaginary]] part.",
         chips: ["reciprocal", "square root"], fb: { "reciprocal": "The conjugate flips only the sign of the $i$ part: $c + di \\to c - di$.", "square root": "No square root is needed: multiplying by the conjugate does the job." } },
    6: { name: "Quadratic functions", frame: "A quadratic $y = a(x - h)^2 + k$ draws a [[parabola]] with vertex [[$(h, k)$]]. It opens [[up]] when $a > 0$ and [[down]] when $a < 0$. The line $x = h$ is the axis of [[symmetry]].",
         chips: ["$(-h, k)$", "circle"], fb: { "$(-h, k)$": "The bracket has $x - h$: the vertex is at $h$ itself, not $-h$.", "circle": "A quadratic is a parabola, a curve with one turn." } },
    7: { name: "Extreme value of a quadratic", frame: "The vertex of $y = ax^2 + bx + c$ is at $x =$ [[$\\frac{-b}{2a}$]]. Put that into the function to get the [[extreme]] value: a [[minimum]] if $a > 0$ and a [[maximum]] if $a < 0$.",
         chips: ["$\\frac{b}{2a}$", "$c$"], fb: { "$\\frac{b}{2a}$": "There is a minus sign: $x = \\frac{-b}{2a}$.", "$c$": "$c$ is where the graph meets the $y$-axis, not the vertex." } },
    8: { name: "Zeros of a quadratic", frame: "The zeros are where $f(x) =$ [[0]]: the $x$-intercepts. Factor and set each factor to [[0]], or use the [[quadratic formula]]. A negative discriminant means the zeros are [[complex]] and the graph never meets the $x$-axis.",
         chips: ["1", "linear"], fb: { "1": "A zero is where the output is 0.", "linear": "Quadratic means degree 2; a negative discriminant gives complex zeros." } },
    9: { name: "Quadratic models", frame: "In a model, the vertex is the [[highest]] or [[lowest]] point: the best value. The $x$-intercept is where the quantity [[returns to zero]]. A question about the best input asks for the [[vertex]], not the graph's $y$-intercept.",
         chips: ["first point", "slope"], fb: { "first point": "The vertex is the turning point.", "slope": "A parabola's steepness changes; the vertex is where it levels out." } },
    10: { name: "End behavior of power functions", frame: "For $y = ax^n$, an [[even]] power makes both ends go the [[same]] way and an [[odd]] power makes them go [[opposite]] ways. A [[negative]] coefficient flips the graph over.",
          chips: ["same", "prime"], fb: { "prime": "Whether the power is even or odd matters, not whether it is prime." } },
    11: { name: "Polynomial degree and ends", frame: "A polynomial's [[degree]] is its highest power and its [[leading]] term decides the ends. For a product of factors, add the [[powers]] to get the degree. Powers must be whole numbers: $x^{-1}$ and $\\sqrt{x}$ are [[not]] polynomials.",
          chips: ["constant", "$x^{-1}$"], fb: { "constant": "The leading term is the one with the highest power.", "$x^{-1}$": "A negative power is not allowed in a polynomial." } },
    12: { name: "Zeros by factoring", frame: "A zero of a polynomial is an input where $f(x) =$ [[0]]. Factor, then set each factor equal to [[0]]. The factor $(x - r)$ gives the zero $x =$ [[$r$]]. A degree-$n$ polynomial has [[at most]] $n$ real zeros.",
          chips: ["$-r$", "exactly"], fb: { "$-r$": "$(x - 3)$ is 0 when $x = 3$, the number itself.", "exactly": "Some zeros may be complex, so it can have fewer real ones." } },
    13: { name: "Multiplicity", frame: "The number of times a factor repeats is its [[multiplicity]]. At a zero of [[odd]] multiplicity the graph [[crosses]] the axis; at [[even]] multiplicity it [[touches]] and turns back.",
          chips: ["degree", "jumps"], fb: { "degree": "Multiplicity is about one factor, not the whole polynomial.", "jumps": "Polynomial graphs are smooth: no jumps." } },
    14: { name: "Sketching a polynomial", frame: "Find the [[zeros]] and the [[ends]], plot the $y$-intercept, and use multiplicity to cross or touch. Between two zeros the sign [[stays the same]]; if a graph goes from positive to negative it must cross [[zero]] in between.",
          chips: ["flips", "slope"], fb: { "flips": "The sign only changes at a zero, so it cannot flip between zeros.", "slope": "The Intermediate Value Theorem is about the sign, not the slope." } },
    15: { name: "Polynomial long division", frame: "Divide the [[leading terms]], multiply the divisor back, [[subtract]] and bring down. Write [[0]] for any missing power. Stop when the degree of what is left is [[smaller]] than the divisor's. Then dividend $=$ divisor $\\times$ [[quotient]] $+$ remainder.",
          chips: ["add", "bigger"], fb: { "add": "Subtract the line you wrote under the dividend.", "bigger": "If the leftover were bigger, you could divide again." } },
    16: { name: "Remainder and Factor Theorems", frame: "Dividing $f(x)$ by $x - k$ leaves a remainder of [[$f(k)$]]. If the remainder is [[0]], then $x - k$ is a [[factor]] and $k$ is a zero. Synthetic division does it with just the [[coefficients]].",
          chips: ["$f(-k)$", "slope"], fb: { "$f(-k)$": "The divisor $x - k$ goes with the input $k$, not $-k$.", "slope": "The remainder is a function value, not a slope." } },
    17: { name: "Rational zeros", frame: "If $\\frac{p}{q}$ is a rational zero, then $p$ divides the [[constant]] term and $q$ divides the [[leading]] coefficient. Test the candidates; when one works, [[divide]] it out and continue with what is left.",
          chips: ["middle", "sum"], fb: { "middle": "Only the constant term and the leading coefficient matter.", "sum": "We use factors of the numbers, not their sum." } },
    18: { name: "Complex zeros", frame: "A polynomial of degree $n$ has exactly [[$n$]] zeros, counting repeats and [[complex]] ones. If the coefficients are real, complex zeros come in [[conjugate]] pairs $a \\pm bi$.",
          chips: ["$n - 1$", "negative"], fb: { "$n - 1$": "A degree-$n$ polynomial has $n$ zeros in all.", "negative": "Complex zeros pair as $a + bi$ and $a - bi$: conjugates, not negatives." } },
    19: { name: "Vertical asymptotes", frame: "A rational function is a polynomial over a polynomial. It is not defined where the [[bottom]] is 0. If that factor stays after cancelling there is a vertical [[asymptote]]; if it cancels there is a [[hole]].",
          chips: ["top", "intercept"], fb: { "top": "The top being 0 gives an $x$-intercept; the bottom being 0 breaks the function.", "intercept": "A hole is a missing point; an intercept is where the graph meets an axis." } },
    20: { name: "Horizontal asymptotes", frame: "Compare the [[degrees]] of the top and bottom. Top smaller: the asymptote is $y =$ [[0]]. Equal degrees: $y =$ the [[ratio]] of the leading coefficients. Top bigger: there is [[no]] horizontal asymptote (maybe a slant one).",
          chips: ["constants", "always"], fb: { "constants": "Use the leading coefficients, not the constant terms.", "always": "Only when the degrees are equal does the ratio set the level." } },
    21: { name: "Graphing a rational function", frame: "Find the [[intercepts]], draw the vertical and horizontal [[asymptotes]], plot a [[test point]] in each region, then draw the pieces hugging the lines. A cancelled factor leaves a [[hole]] to mark with an open dot.",
          chips: ["roots", "slope"], fb: { "roots": "Zeros and intercepts come from the top.", "slope": "We use points and asymptotes to guide the sketch." } },
    22: { name: "Inverses of quadratics and roots", frame: "A parabola is not one-to-one, so [[restrict]] its domain to one half. Swap $x$ and $y$, solve with a [[square root]], and pick the [[sign]] that matches the half you kept. The domain of $f$ becomes the [[range]] of $f^{-1}$.",
          chips: ["double", "slope"], fb: { "double": "Restricting means cutting the domain in half, not doubling.", "slope": "The sign of the root decides which half; slope has nothing to do with it." } },
    23: { name: "Direct and inverse variation", frame: "Direct variation is $y =$ [[$kx$]]: the ratio $\\frac{y}{x}$ is fixed. Inverse variation is $y =$ [[$\\frac{k}{x}$]]: the [[product]] $xy$ is fixed. Find [[$k$]] from one known pair, then use it.",
          chips: ["$k + x$", "sum"], fb: { "$k + x$": "Variation is multiplying or dividing by $k$, never adding.", "sum": "For inverse variation the product $xy$ stays the same." } },
    24: { name: "Joint and combined variation", frame: "Joint variation is a [[product]]: $z = kxy$. Combined variation mixes direct and inverse: $z = \\frac{kx}{y}$, with the direct variable on [[top]] and the inverse variable on the [[bottom]]. Always solve for [[$k$]] first.",
          chips: ["sum", "$y$ on top"], fb: { "sum": "Joint means multiplied, not added.", "$y$ on top": "The variable it is *inversely* related to goes on the bottom." } }
  });
})();
