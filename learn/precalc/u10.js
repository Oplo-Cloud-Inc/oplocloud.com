/* ==========================================================================
   Precalculus — Unit 10: Analytic Geometry. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 10: the ellipse, the hyperbola and the
   parabola (standard form, centred anywhere, general form), rotating the axes,
   and conic sections in polar coordinates. Each section is split into lessons
   small enough to finish in one sitting; each teaches one method: the idea, an
   example to watch, one done together, then on your own, a harder case, find the
   error, use it, and the concept built at the end.

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

  // The widest a sketch may be drawn so it stays about 340 px tall: wcap([0, 7], [0, 64], 30, 5) (uy: the scale up the page).
  function wcap(x, y, u, uy) { var W = (x[1] - x[0]) * u + 48, H = (y[1] - y[0]) * (uy || u) + 48; return Math.round(Math.min(W, 340 * W / H)); }

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
    ex: { f: function (x) { return Math.pow(2, x); }, lab: "$2^x$", pts: [[-1, 0.5], [0, 1], [1, 2], [2, 4]] },
    lg: { f: function (x) { return x > 0 ? Math.log(x) / Math.LN2 : NaN; }, lab: "$\\log_2 x$", pts: [[0.5, -1], [1, 0], [2, 1], [4, 2]] },
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
    var u0 = o.u || 22, uy0 = o.uy || u0, W0 = (xr[1] - xr[0]) * u0 + 48, H0 = (yr[1] - yr[0]) * uy0 + 48;
    return { type: "sketch", x: xr, y: yr, u: u0, uy: o.uy, w: o.w || Math.min(480, Math.round(360 * W0 / H0)), gate: true, pts: {}, params: o.params, chips: o.keys.length > 1 ? chips : undefined, gx: o.gx, gy: o.gy, step: o.step, stepY: o.stepY,
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
    blurb: "Before Chapter 10 · Distance, completing the square, intercepts, shifting a graph and a square root.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Distance", prompt: "One point is 3 units to the right of and 4 units above another. How far apart are the two points?", pre: "distance =", answer: 5, skill: "Distance", near: [{ v: 7, fb: "The distance is the long side of a right triangle with legs 3 and 4: $\\sqrt{3^2 + 4^2}$." }], hints: ["Pythagoras: $\\sqrt{3^2 + 4^2}$."], why: "$\\sqrt{9 + 16} = 5$." },
      { type: "num", kicker: "Check 2 · Square", prompt: "$x^2 + 6x + \\square$ is a perfect square. What number goes in the box?", pre: "$\\square =$", answer: 9, skill: "Completing the square", near: [{ v: 6, fb: "Take half of the 6, then square it." }, { v: 36, fb: "Half of 6 is 3, and $3^2 = 9$: do not square the 6." }], hints: ["Half of 6, squared."], why: "$(x + 3)^2 = x^2 + 6x + 9$." },
      { type: "choice", kicker: "Check 3 · Intercepts", prompt: "If $\\dfrac{x^2}{16} + \\dfrac{y^2}{9} = 1$ and $y = 0$, what is $x$?",
        options: [{ t: "$x = 4$ or $x = -4$" }, { t: "$x = 16$ or $x = -16$", fb: "$\\frac{x^2}{16} = 1$ gives $x^2 = 16$, so $x = \\pm 4$." }, { t: "$x = 4$ only", fb: "A square root has two signs: $x = 4$ and $x = -4$ both work." }],
        answer: 0, skill: "Intercepts", hints: ["$\\frac{x^2}{16} = 1$."], why: "$x^2 = 16$, so $x = \\pm 4$." },
      { type: "choice", kicker: "Check 4 · Shift", prompt: "The graph of $y = x^2$ is moved 3 units right and 2 units up. Its new equation is…",
        options: [{ t: "$y = (x - 3)^2 + 2$" }, { t: "$y = (x + 3)^2 + 2$", fb: "Moving **right** by 3 means $x - 3$ inside the bracket." }, { t: "$y = (x - 3)^2 - 2$", fb: "Moving **up** by 2 means $+ 2$ outside." }],
        answer: 0, skill: "Shifting graphs", hints: ["Right goes inside as $x - 3$; up goes outside as $+ 2$."], why: "$y = (x - 3)^2 + 2$." },
      { type: "num", kicker: "Check 5 · Roots", prompt: "Work out $\\sqrt{13^2 - 5^2}$.", pre: "value =", answer: 12, skill: "Square roots", near: [{ v: 8, fb: "Square first: $13^2 = 169$ and $5^2 = 25$, then subtract and take the root." }], hints: ["$169 - 25 = 144$."], why: "$\\sqrt{144} = 12$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 10.1**. If **check 2** slipped, look again at lesson 3.5. If **check 4** slipped, revisit lesson 1.17.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= helpers for Chapter 10 */
  var PI = Math.PI, DEG = PI / 180;
  var f4 = function (v, d) { var k = Math.pow(10, d == null ? 2 : d); return Math.round(v * k) / k; };
  var LN = function (m, b) { return function (x) { return m * x + b; }; };
  // The points of a parametric curve that lie inside the window, in unbroken runs: PARAM(t => [x, y], t0, t1, n, [x0, x1], [y0, y1], colour, dash).
  var PARAM = function (g, t0, t1, n, xr, yr, c, dash) {
    var out = [], run = [], i, p;
    for (i = 0; i <= n; i++) {
      p = g(t0 + (t1 - t0) * i / n);
      if (p && isFinite(p[0]) && isFinite(p[1]) && p[0] >= xr[0] && p[0] <= xr[1] && p[1] >= yr[0] && p[1] <= yr[1]) run.push(p);
      else { if (run.length > 1) out.push({ path: run, c: c || "blue", dash: dash }); run = []; }
    }
    if (run.length > 1) out.push({ path: run, c: c || "blue", dash: dash });
    return out;
  };
  // A curve f(x, y) = 0 drawn by marching squares inside the window.
  var IMPL = function (f, xr, yr, n, c) {
    var out = [], v = [], dx = (xr[1] - xr[0]) / n, dy = (yr[1] - yr[0]) / n, i, j, k;
    for (j = 0; j <= n; j++) { v.push([]); for (i = 0; i <= n; i++) v[j].push(f(xr[0] + i * dx, yr[0] + j * dy)); }
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
      var xa = xr[0] + i * dx, ya = yr[0] + j * dy, P = [[xa, ya], [xa + dx, ya], [xa + dx, ya + dy], [xa, ya + dy]], F = [v[j][i], v[j][i + 1], v[j + 1][i + 1], v[j + 1][i]], pts = [];
      for (k = 0; k < 4; k++) {
        var k2 = (k + 1) % 4;
        if ((F[k] > 0) !== (F[k2] > 0)) { var t = F[k] / (F[k] - F[k2]); pts.push([P[k][0] + (P[k2][0] - P[k][0]) * t, P[k][1] + (P[k2][1] - P[k][1]) * t]); }
      }
      if (pts.length === 2) out.push({ path: pts, c: c || "blue" });
      else if (pts.length === 4) out.push({ path: [pts[0], pts[1]], c: c || "blue" }, { path: [pts[2], pts[3]], c: c || "blue" });
    }
    return out;
  };
  var ELL = function (h, k, rx, ry, c, dash) { return { ell: [[h, k], rx, ry], c: c || "blue", dash: dash }; };
  // A bracket (x - h)^2 written with the sign handled: SQB("x", -3) is "(x + 3)^2".
  var SQB = function (n, v) { return v === 0 ? n + "^2" : "(" + n + (v < 0 ? " + " + (-v) : " - " + v) + ")^2"; };
  var FRC = function (a, b) { return "\\frac{" + a + "}{" + b + "}"; };
  var ELLEQ = function (h, k, A, B) { return FRC(SQB("x", h), A) + " + " + FRC(SQB("y", k), B) + " = 1"; };

  /* ============================================ 1 · The ellipse at the origin */
  var HOW_1 = [["Compare", "The larger denominator is $a^2$; its variable names the **major axis**."],
               ["Read", "$a^2$ is the larger, $b^2$ the smaller, and $c^2 = a^2 - b^2$."],
               ["Mark", "Vertices $\\pm a$ and foci $\\pm c$ on the major axis; co-vertices $\\pm b$."]];
  var G1 = function (k) {
    var it = [ELL(0, 0, 4, 5, "blue")];
    if (k >= 2) it.push(dot(0, 5, "blue", "(0, 5)", "ne"), dot(0, -5, "blue", "(0, -5)", "se"), dot(4, 0, "orange", "(4, 0)", "ne"), dot(-4, 0, "orange", "(-4, 0)", "nw"));
    if (k >= 3) it.push(dot(0, 3, "green", "(0, 3)", "e"), dot(0, -3, "green", "(0, -3)", "e"));
    return grid("The ellipse x squared over 16 plus y squared over 25 equals 1" + (k >= 2 ? ", with its vertices and co-vertices marked" : "") + (k >= 3 ? ", and its foci at (0, 3) and (0, -3)" : "") + ".", it, { x: [-6, 6], y: [-7, 7], u: 17 });
  };
  LESSONS.push({
    title: "The ellipse at the origin", art: "pcconic",
    blurb: "Book 10.1 · All the points whose distances to two foci add to a constant; $a$, $b$ and $c$ are tied by $c^2 = a^2 - b^2$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "How far is the point $(0, 3)$ from the point $(4, 0)$?", pre: "distance =", answer: 5, skill: "Distance", near: [{ v: 7, fb: "Use Pythagoras: $\\sqrt{4^2 + 3^2}$, not $4 + 3$." }, { v: 1, fb: "Square the differences and add: $\\sqrt{16 + 9}$." }], hints: ["The legs of the right triangle are 4 and 3."], why: "$\\sqrt{16 + 9} = 5$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange point $P$ goes round an ellipse with two **foci** $F_1$ and $F_2$ (green). Slide $P$ and watch the two distances from $P$ to the foci. Visit a **vertex** (end of the long axis) and a **co-vertex** (end of the short axis).",
        scene: { type: "sketch", x: [-6.5, 6.5], y: [-4.5, 4.5], u: 26, w: 386, gate: true, pts: {},
          params: { t: { min: 0, max: 360, step: 15, v: 45, label: "$P$ (°)" } },
          track: function (s) { return s.p.t % 180 === 0 ? "vertex" : s.p.t % 180 === 90 ? "cov" : null; },
          draw: function (s) { var x = 5 * Math.cos(s.p.t * DEG), y = 3 * Math.sin(s.p.t * DEG); return [ELL(0, 0, 5, 3, "blue"), { seg: [[x, y], [-4, 0]], c: "blue" }, { seg: [[x, y], [4, 0]], c: "orange" }, dot(-4, 0, "green", "F1", "sw"), dot(4, 0, "green", "F2", "se"), dot(x, y, "orange")]; },
          readout: function (s) { var x = 5 * Math.cos(s.p.t * DEG), y = 3 * Math.sin(s.p.t * DEG), d1 = Math.hypot(x + 4, y), d2 = Math.hypot(x - 4, y); return "$PF_1 = " + nm(f4(d1, 2)) + "$ · $PF_2 = " + nm(f4(d2, 2)) + "$ · together $" + nm(f4(d1 + d2, 2)) + "$<br>Vertex: " + (s.tracked.vertex ? "✓" : "—") + " · co-vertex: " + (s.tracked.cov ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.vertex && s.tracked.cov); } },
        gate: true, then: "However $P$ moves, the two distances **add to 10**. At the right-hand vertex they are $1$ and $9$; at the top co-vertex they are $5$ and $5$. That is what an **ellipse** is: all points whose distances to two fixed points (the foci) add to a constant, here $2a = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "An ellipse with centre $(0, 0)$ is $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ or $\\frac{x^2}{b^2} + \\frac{y^2}{a^2} = 1$, with $a > b$. The larger denominator is $a^2$ and its variable gives the **major axis**. The foci are $c$ from the centre, where $c^2 = a^2 - b^2$.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the vertices, co-vertices and foci of $\\dfrac{x^2}{16} + \\dfrac{y^2}{25} = 1$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\frac{x^2}{16} + \\frac{y^2}{25} = 1", say: "25 is the larger denominator and sits under $y^2$: the major axis is **vertical**.", fig: G1(1) },
          { step: 2, m: "a^2 = 25,\\ b^2 = 16", say: "The larger one is $a^2$." },
          { step: 2, m: "c^2 = 25 - 16 = 9", say: "$c^2 = a^2 - b^2$, so $c = 3$.", ask: { prompt: "Which of $a$, $b$, $c$ is always the largest?", answer: 0, options: [{ t: "$a$: the foci lie inside the ellipse, so $c < a$" }, { t: "$c$", fb: "$c^2 = a^2 - b^2$ is **smaller** than $a^2$, so $c < a$." }] } },
          { step: 3, m: "(0, \\pm 5),\\ (\\pm 4, 0)", say: "Vertices $\\pm a$ on the major axis; co-vertices $\\pm b$ on the other.", fig: G1(2) },
          { step: 3, m: "(0, \\pm 3)", say: "Foci: $c$ from the centre along the major axis.", fig: G1(3) }] },
        gate: true, then: "Vertices $(0, \\pm 5)$, co-vertices $(\\pm 4, 0)$, foci $(0, \\pm 3)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the foci of $\\dfrac{x^2}{100} + \\dfrac{y^2}{36} = 1$.",
        how: HOW_1, skill: "Reading an ellipse",
        steps: [
          { step: 1, ask: "100 is the larger denominator and sits under $x^2$. The major axis is…", type: "choice", answer: 0, options: [{ t: "horizontal, along the $x$-axis" }, { t: "vertical, along the $y$-axis", fb: "The larger denominator is under $x^2$, so the long direction is $x$." }], m: "a^2 = 100,\\ b^2 = 36", say: "Major axis along $x$." },
          { step: 2, ask: "$c^2 = a^2 - b^2 = 100 - 36 =$", type: "num", pre: "$c^2 =$", answer: 64, near: [{ v: 136, fb: "Subtract: $c^2 = a^2 - b^2$." }], hint: "$100 - 36$.", m: "c^2 = 64", say: "Now take the root." },
          { step: 2, ask: "So $c =$", type: "num", pre: "$c =$", answer: 8, near: [{ v: 64, fb: "That is $c^2$. Take the square root." }], hint: "$\\sqrt{64}$.", m: "c = 8", say: "The foci are $(\\pm 8, 0)$." },
          { step: 3, ask: "The distances from any point on the ellipse to the two foci always add to $2a =$", type: "num", pre: "$2a =$", answer: 20, near: [{ v: 10, fb: "$a = 10$, so $2a = 20$." }], hint: "$a^2 = 100$.", m: "2a = 20", say: "Check at the vertex $(10, 0)$: distances $2$ and $18$." }],
        why: "Compare, read, mark." },
      { type: "num", kicker: "On your own", prompt: "Find the distance $c$ from the centre to each focus of $\\dfrac{x^2}{25} + \\dfrac{y^2}{16} = 1$.", pre: "$c =$", answer: 3, skill: "Reading an ellipse", near: [{ v: 9, fb: "That is $c^2 = 25 - 16$. Take the square root." }, { v: 5, fb: "That is $a$. The foci are $c = \\sqrt{a^2 - b^2}$ from the centre." }], hints: ["$c^2 = 25 - 16$."], why: "$c^2 = 9$, so $c = 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Not in standard form.** Find the foci of $25x^2 + 9y^2 = 225$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\frac{x^2}{9} + \\frac{y^2}{25} = 1", say: "Divide both sides by 225 so the right side is 1." },
          { step: 1, m: "a^2 = 25", say: "25 is under $y^2$: the major axis is vertical.", ask: { prompt: "Why must the right side be 1?", answer: 0, options: [{ t: "The standard form has 1 on the right, so we can read $a^2$ and $b^2$" }, { t: "To make the numbers smaller", fb: "Only with 1 on the right are the denominators $a^2$ and $b^2$." }] } },
          { step: 2, m: "c^2 = 25 - 9 = 16", say: "So $c = 4$." },
          { step: 3, m: "(0, \\pm 4)", say: "The foci are on the vertical major axis, 4 from the centre." }] },
        gate: true, then: "Foci $(0, \\pm 4)$." },
      { type: "num", kicker: "Try it", prompt: "How far apart are the two foci of $\\dfrac{x^2}{64} + \\dfrac{y^2}{100} = 1$?", pre: "distance =", answer: 12, skill: "Reading an ellipse", near: [{ v: 6, fb: "That is $c$, the distance from the centre to **one** focus. The foci are $2c$ apart." }, { v: 20, fb: "That is the length of the major axis, $2a$." }], hints: ["$c^2 = 100 - 64$, then double it."], why: "$c = 6$, so the foci are $12$ apart." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee says the foci of $\\dfrac{x^2}{9} + \\dfrac{y^2}{25} = 1$ are on the $x$-axis because $x^2$ comes first. What is wrong?",
        options: [{ t: "The larger denominator, 25, is under $y^2$: the foci are on the **$y$-axis**" }, { t: "Nothing: the first variable decides", fb: "Order does not matter. The **larger denominator** decides the major axis." }, { t: "The foci are on both axes", fb: "An ellipse has two foci, on its major axis only." }],
        answer: 0, skill: "Reading an ellipse", hints: ["Which denominator is larger?"], why: "The major axis is vertical: foci $(0, \\pm 4)$." },
      { type: "num", kicker: "Use it", prompt: "A running track is the ellipse $\\dfrac{x^2}{400} + \\dfrac{y^2}{144} = 1$ (units in metres). How far apart are its two foci?", pre: "distance =", post: "m", answer: 32, skill: "Reading an ellipse", near: [{ v: 16, fb: "That is $c$. The foci are $2c$ apart." }, { v: 40, fb: "That is the length $2a$ of the track." }], hints: ["$c^2 = 400 - 144$."], why: "$c = 16$, so the foci are $32$ m apart." }
    ]
  });

  /* ============================================ 2 · Writing the equation of an ellipse */
  var HOW_2 = [["Axis", "Do the vertices and foci lie on the $x$-axis or the $y$-axis?"],
               ["Find a, b", "$a$ from a vertex, $c$ from a focus, then $b^2 = a^2 - c^2$."],
               ["Write", "Put $a^2$ under the major-axis variable and $b^2$ under the other."]];
  LESSONS.push({
    title: "Writing the equation of an ellipse", art: "pcconic",
    blurb: "Book 10.1 · From vertices and foci to the equation: $a$ from the vertex, $c$ from the focus, $b^2 = a^2 - c^2$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $a^2 = 25$ and $c = 3$, what is $b^2 = a^2 - c^2$?", pre: "$b^2 =$", answer: 16, skill: "Ellipse constants", near: [{ v: 22, fb: "$c^2 = 9$, not $c$: $25 - 9$." }, { v: 34, fb: "Subtract: $b^2 = a^2 - c^2$." }], hints: ["$c^2 = 9$."], why: "$25 - 9 = 16$." },
      { type: "learn", kicker: "Explore",
        prompt: "An ellipse has vertices $(\\pm a, 0)$ and foci $(\\pm c, 0)$. Slide $a$ and $c$ and watch the shape. Find the pair that makes $b = 3$, and see what happens when the foci come together at $c = 0$.",
        scene: { type: "sketch", x: [-7.5, 7.5], y: [-6, 6], u: 22, w: 378, gate: true, pts: {},
          params: { a: { min: 3, max: 6, step: 1, v: 4, label: "$a$" }, c: { min: 0, max: 5, step: 1, v: 2, label: "$c$" } },
          track: function (s) { var a = s.p.a, c = s.p.c, q = a * a - c * c; return c === 0 ? "circle" : q === 9 ? "b3" : null; },
          draw: function (s) { var a = s.p.a, c = s.p.c, q = a * a - c * c; if (q <= 0) return []; var b = Math.sqrt(q); return [ELL(0, 0, a, b, "blue"), dot(a, 0, "blue"), dot(-a, 0, "blue"), dot(0, b, "orange"), dot(0, -b, "orange"), dot(c, 0, "green"), dot(-c, 0, "green")]; },
          readout: function (s) { var a = s.p.a, c = s.p.c, q = a * a - c * c; return q <= 0 ? "$c$ must be smaller than $a$: no ellipse" : "$b^2 = a^2 - c^2 = " + a * a + " - " + c * c + " = " + q + "$" + (c === 0 ? " · the foci meet: a **circle**" : "") + "<br>$b = " + nm(f4(Math.sqrt(q), 2)) + "$<br>$b = 3$: " + (s.tracked.b3 ? "✓" : "—") + " · circle: " + (s.tracked.circle ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.b3 && s.tracked.circle); } },
        gate: true, then: "$a = 5$ and $c = 4$ give $b^2 = 25 - 16 = 9$, so $b = 3$. When $c = 0$ the two foci meet at the centre and the ellipse is a **circle**, with $b = a$. The rule $b^2 = a^2 - c^2$ turns a vertex and a focus into the whole equation." },
      { type: "learn", kicker: "The idea",
        prompt: "From the vertices and foci: decide the **axis** (the coordinate that changes), find $a$ from a vertex and $c$ from a focus, then $b^2 = a^2 - c^2$. Write $a^2$ under the variable of the **major axis** and $b^2$ under the other.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write the equation of the ellipse with vertices $(\\pm 5, 0)$ and foci $(\\pm 2, 0)$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "(\\pm 5, 0),\\ (\\pm 2, 0)", say: "The $x$-coordinates change: the major axis is the **$x$-axis**." },
          { step: 2, m: "a = 5,\\ c = 2", say: "A vertex is $a$ from the centre; a focus is $c$ from it." },
          { step: 2, m: "b^2 = 25 - 4 = 21", say: "$b^2 = a^2 - c^2$. It need not be a perfect square.", ask: { prompt: "Why $25 - 4$ and not $25 - 2$?", answer: 0, options: [{ t: "The formula uses $c^2$, and $c^2 = 4$" }, { t: "Because 2 is small", fb: "$b^2 = a^2 - c^2$: square $c$ first." }] } },
          { step: 3, m: "\\frac{x^2}{25} + \\frac{y^2}{21} = 1", say: "$a^2 = 25$ goes under $x^2$, the major-axis variable." }] },
        gate: true, then: "$\\dfrac{x^2}{25} + \\dfrac{y^2}{21} = 1$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write the equation with vertices $(0, \\pm 6)$ and foci $(0, \\pm 4)$.",
        how: HOW_2, skill: "Writing an ellipse",
        steps: [
          { step: 1, ask: "The $y$-coordinates change, so the major axis is…", type: "choice", answer: 0, options: [{ t: "the $y$-axis: $a^2$ goes under $y^2$" }, { t: "the $x$-axis: $a^2$ goes under $x^2$", fb: "The vertices $(0, \\pm 6)$ are on the $y$-axis." }], m: "a = 6,\\ c = 4", say: "Vertical major axis." },
          { step: 2, ask: "$a^2 =$", type: "num", pre: "$a^2 =$", answer: 36, near: [{ v: 6, fb: "That is $a$. Square it." }], hint: "$6^2$.", m: "a^2 = 36", say: "Goes under $y^2$." },
          { step: 2, ask: "$b^2 = a^2 - c^2 = 36 - 16 =$", type: "num", pre: "$b^2 =$", answer: 20, near: [{ v: 52, fb: "Subtract: $b^2 = a^2 - c^2$." }, { v: 32, fb: "$c^2 = 16$, not $c^2 = 4$." }], hint: "$36 - 16$.", m: "b^2 = 20", say: "Goes under $x^2$." },
          { step: 3, ask: "The equation is…", type: "choice", answer: 0, options: [{ t: "$\\dfrac{x^2}{20} + \\dfrac{y^2}{36} = 1$" }, { t: "$\\dfrac{x^2}{36} + \\dfrac{y^2}{20} = 1$", fb: "The larger denominator goes under the major-axis variable, $y^2$." }], m: "\\frac{x^2}{20} + \\frac{y^2}{36} = 1", say: "Check: the vertex $(0, 6)$ gives $\\frac{36}{36} = 1$." }],
        why: "Axis, find $a$ and $b$, write." },
      { type: "num", kicker: "On your own", prompt: "An ellipse has vertices $(\\pm 15, 0)$ and foci $(\\pm 9, 0)$. What is $b^2$?", pre: "$b^2 =$", answer: 144, skill: "Writing an ellipse", near: [{ v: 12, fb: "That is $b$. The question asks for $b^2$." }, { v: 306, fb: "Subtract: $b^2 = a^2 - c^2 = 225 - 81$." }], hints: ["$a = 15$, $c = 9$."], why: "$225 - 81 = 144$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Co-vertices instead of vertices.** An ellipse has co-vertices $(0, \\pm 8)$ and foci $(\\pm 6, 0)$. Write its equation.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "\\text{foci on the } x\\text{-axis}", say: "The major axis is the $x$-axis, so the co-vertices $(0, \\pm 8)$ give $b = 8$." },
          { step: 2, m: "b = 8,\\ c = 6", say: "Now we need $a$.", ask: { prompt: "Which relation links $a$, $b$ and $c$?", answer: 0, options: [{ t: "$a^2 = b^2 + c^2$" }, { t: "$c^2 = a^2 + b^2$", fb: "That is the hyperbola. For an ellipse $c^2 = a^2 - b^2$, so $a^2 = b^2 + c^2$." }] } },
          { step: 2, m: "a^2 = 64 + 36 = 100", say: "So $a = 10$." },
          { step: 3, m: "\\frac{x^2}{100} + \\frac{y^2}{64} = 1", say: "$a^2$ under $x^2$, the major-axis variable." }] },
        gate: true, then: "$\\dfrac{x^2}{100} + \\dfrac{y^2}{64} = 1$." },
      { type: "num", kicker: "Try it", prompt: "A whispering chamber is an ellipse whose long axis is 40 ft ($2a = 40$) and whose foci are 24 ft apart ($2c = 24$). What is $b$?", pre: "$b =$", post: "ft", answer: 16, skill: "Writing an ellipse", near: [{ v: 256, fb: "That is $b^2$. Take the square root." }, { v: 20, fb: "That is $a$. Find $b$ from $b^2 = a^2 - c^2$." }], hints: ["$a = 20$ and $c = 12$."], why: "$b^2 = 400 - 144 = 256$, so $b = 16$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kay writes the equation with vertices $(0, \\pm 5)$ and foci $(0, \\pm 3)$. Tap the line where the work **first** goes wrong.",
        lines: ["a = 5,\\ c = 3", "b^2 = 25 + 9 = 34", "\\frac{x^2}{34} + \\frac{y^2}{25} = 1"], answer: 1, fix: "b^2 = 25 - 9 = 16",
        fb: { 0: "The vertex gives $a = 5$ and the focus gives $c = 3$.", 2: LATER }, skill: "Writing an ellipse",
        hints: ["For an ellipse $c < a$, so $b^2 = a^2 - c^2$."], why: "$b^2 = 25 - 9 = 16$: the denominator under $x^2$ is smaller than 25." },
      { type: "num", kicker: "Use it", prompt: "The floor of a whispering gallery is an ellipse 100 ft long and 60 ft wide. Two people stand at the foci. How far apart are they?", pre: "distance =", post: "ft", answer: 80, skill: "Writing an ellipse", near: [{ v: 40, fb: "That is $c$. The people stand at **both** foci, $2c$ apart." }, { v: 100, fb: "That is the length $2a$ of the floor." }], hints: ["$a = 50$ and $b = 30$, so $c^2 = a^2 - b^2$."], why: "$c^2 = 2500 - 900 = 1600$, $c = 40$: the foci are 80 ft apart." }
    ]
  });

  /* ============================================ 3 · Ellipses centred at (h, k) */
  var HOW_3 = [["Centre", "Read $(h, k)$ from $(x - h)^2$ and $(y - k)^2$."],
               ["Axis", "The larger denominator is $a^2$: that direction is the major axis."],
               ["Shift", "Vertices, co-vertices and foci are measured from the centre."]];
  var G3 = function (k) {
    var it = [ELL(2, -1, 3, 5, "blue")];
    if (k >= 2) it.push(dot(2, -1, "ink", "(2, -1)", "e"), dot(2, 4, "blue", "(2, 4)", "e"), dot(2, -6, "blue", "(2, -6)", "e"), dot(5, -1, "orange"), dot(-1, -1, "orange"));
    if (k >= 3) it.push(dot(2, 3, "green", "(2, 3)", "e"), dot(2, -5, "green", "(2, -5)", "e"));
    return grid("An ellipse centred at (2, -1)" + (k >= 3 ? " with vertices (2, 4) and (2, -6) and foci (2, 3) and (2, -5)" : "") + ".", it, { x: [-3, 7], y: [-8, 6], u: 17 });
  };
  LESSONS.push({
    title: "Ellipses centred anywhere", art: "pcconic",
    blurb: "Book 10.1 · Slide the ellipse: replace $x$ by $x - h$ and $y$ by $y - k$, and measure everything from the new centre.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "In $(x - 3)^2$, which value of $x$ makes the bracket zero?", pre: "$x =$", answer: 3, skill: "Reading a shift", near: [{ v: -3, fb: "$x - 3 = 0$ gives $x = 3$." }], hints: ["Solve $x - 3 = 0$."], why: "$x = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "The ellipse $\\frac{x^2}{25} + \\frac{y^2}{9} = 1$ is moved so its centre is $(h, k)$. Slide $h$ and $k$ and read the new equation. Put the centre at $(-2, 1)$ and notice how the signs in the equation come out.",
        scene: { type: "sketch", x: [-9, 9], y: [-7, 7], u: 18, w: 372, gate: true, pts: {},
          params: { h: { min: -3, max: 3, step: 1, v: 0, label: "$h$" }, k: { min: -3, max: 3, step: 1, v: 0, label: "$k$" } },
          draw: function (s) { var h = s.p.h, k = s.p.k; return [ELL(h, k, 5, 3, "blue"), dot(h, k, "ink"), dot(h + 4, k, "green"), dot(h - 4, k, "green")]; },
          readout: function (s) { return "$" + ELLEQ(s.p.h, s.p.k, 25, 9) + "$<br>centre $(" + nm(s.p.h) + ", " + nm(s.p.k) + ")$ · foci $(" + nm(s.p.h - 4) + ", " + nm(s.p.k) + ")$ and $(" + nm(s.p.h + 4) + ", " + nm(s.p.k) + ")$"; },
          goal: function (s) { return s.p.h === -2 && s.p.k === 1; } },
        gate: true, then: "With centre $(-2, 1)$ the equation is $\\frac{(x + 2)^2}{25} + \\frac{(y - 1)^2}{9} = 1$: moving **left** by 2 gives $x + 2$. The signs in the brackets are **opposite** to the centre's coordinates. The shape, and the distances $a = 5$, $b = 3$, $c = 4$, do not change." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\frac{(x - h)^2}{a^2} + \\frac{(y - k)^2}{b^2} = 1$ (or with $a^2$ under $y$) is an ellipse with centre $(h, k)$. Read the centre with the **opposite sign**, find the major axis from the larger denominator, and mark vertices, co-vertices and foci by measuring from the centre.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Describe the ellipse $\\dfrac{(x - 2)^2}{9} + \\dfrac{(y + 1)^2}{25} = 1$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "(h, k) = (2, -1)", say: "$x - 2$ gives $h = 2$; $y + 1$ is $y - (-1)$, so $k = -1$.", fig: G3(1) },
          { step: 2, m: "a^2 = 25,\\ b^2 = 9", say: "25 is under the $y$ bracket: the major axis is **vertical**.", ask: { prompt: "In $(y + 1)^2$, what is $k$?", answer: 0, options: [{ t: "$-1$, because $y + 1 = y - (-1)$" }, { t: "$1$", fb: "$y + 1 = y - (-1)$, so $k$ is the opposite sign." }] } },
          { step: 3, m: "(2, -1 \\pm 5)", say: "Vertices: $a = 5$ above and below the centre.", fig: G3(2) },
          { step: 3, m: "c^2 = 25 - 9,\\ c = 4", say: "Foci: 4 above and below the centre, $(2, 3)$ and $(2, -5)$.", fig: G3(3) }] },
        gate: true, then: "Centre $(2, -1)$, vertices $(2, 4)$ and $(2, -6)$, co-vertices $(5, -1)$ and $(-1, -1)$, foci $(2, 3)$ and $(2, -5)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $\\dfrac{(x + 3)^2}{25} + \\dfrac{(y - 2)^2}{9} = 1$.",
        how: HOW_3, skill: "Ellipses centred at (h, k)",
        steps: [
          { step: 1, ask: "$x + 3 = x - (-3)$. So the centre has $h =$", type: "num", pre: "$h =$", answer: -3, near: [{ v: 3, fb: "The bracket $x + 3$ means $h = -3$." }], hint: "Opposite sign.", m: "(h, k) = (-3, 2)", say: "The $y$ bracket gives $k = 2$." },
          { step: 2, ask: "25 is under the $x$ bracket: horizontal major axis. $c^2 = 25 - 9 = 16$, so the right-hand focus has $x =$ $h + c =$", type: "num", pre: "$x =$", answer: 1, near: [{ v: 7, fb: "Start from the centre $h = -3$, not from 3: $-3 + 4$." }, { v: 4, fb: "That is $c$. Add it to $h = -3$." }], hint: "$-3 + 4$.", m: "(1, 2)", say: "The left focus is $(-7, 2)$." },
          { step: 3, ask: "The left vertex has $x = h - a = -3 - 5 =$", type: "num", pre: "$x =$", answer: -8, near: [{ v: 2, fb: "That is the right vertex, $h + a$." }], hint: "$-3 - 5$.", m: "(-8, 2)", say: "The right vertex is $(2, 2)$." },
          { step: 3, ask: "The top co-vertex has $y = k + b = 2 + 3 =$", type: "num", pre: "$y =$", answer: 5, near: [{ v: -1, fb: "That is the bottom co-vertex, $k - b$." }], hint: "$2 + 3$.", m: "(-3, 5)", say: "The bottom co-vertex is $(-3, -1)$." }],
        why: "Centre, axis, shift." },
      { type: "num", kicker: "On your own", prompt: "For $\\dfrac{(x - 1)^2}{49} + \\dfrac{(y - 4)^2}{25} = 1$, what is the $x$-coordinate of the **right-hand vertex**?", pre: "$x =$", answer: 8, skill: "Ellipses centred at (h, k)", near: [{ v: 7, fb: "That is $a$. Add it to the centre's $x$: $1 + 7$." }, { v: -6, fb: "That is the left vertex, $1 - 7$." }], hints: ["The major axis is horizontal: $h + a$."], why: "$1 + 7 = 8$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Writing the equation.** An ellipse has vertices $(-2, -8)$ and $(-2, 2)$ and foci $(-2, -7)$ and $(-2, 1)$. Write its equation.",
        scene: { type: "walk", how: [["Centre", "The midpoint of the vertices (or of the foci)."], ["Find a, b", "$a$ and $c$ are distances from the centre; $b^2 = a^2 - c^2$."], ["Write", "$a^2$ under the major-axis bracket, $b^2$ under the other."]], rows: [
          { step: 1, m: "\\left(-2, \\frac{-8 + 2}{2}\\right) = (-2, -3)", say: "The $x$-coordinates match: the major axis is **vertical**. The centre is the midpoint." },
          { step: 2, m: "a = 5,\\ c = 4", say: "From the centre $(-2, -3)$: a vertex is 5 away, a focus 4 away.", ask: { prompt: "How far is the vertex $(-2, 2)$ from the centre $(-2, -3)$?", answer: 0, options: [{ t: "5" }, { t: "10", fb: "That is the whole major axis. From the centre it is 5." }] } },
          { step: 2, m: "b^2 = 25 - 16 = 9", say: "$b^2 = a^2 - c^2$." },
          { step: 3, m: "\\frac{(x + 2)^2}{9} + \\frac{(y + 3)^2}{25} = 1", say: "Centre $(-2, -3)$ gives the brackets $x + 2$ and $y + 3$; $a^2 = 25$ goes under the vertical one." }] },
        gate: true, then: "$\\dfrac{(x + 2)^2}{9} + \\dfrac{(y + 3)^2}{25} = 1$." },
      { type: "num", kicker: "Try it", prompt: "What is the $x$-coordinate of the **leftmost** point of $\\dfrac{(x - 4)^2}{36} + \\dfrac{(y + 2)^2}{16} = 1$?", pre: "$x =$", answer: -2, skill: "Ellipses centred at (h, k)", near: [{ v: 10, fb: "That is the rightmost point, $4 + 6$." }, { v: -6, fb: "Measure from the centre: $4 - 6$." }], hints: ["$h - a$."], why: "$4 - 6 = -2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam says the centre of $\\dfrac{(x - 3)^2}{9} + \\dfrac{(y + 2)^2}{4} = 1$ is $(3, 2)$. What is wrong?",
        options: [{ t: "$y + 2 = y - (-2)$, so $k = -2$: the centre is $(3, -2)$" }, { t: "Nothing: the signs match the brackets", fb: "A plus in the bracket means a **negative** coordinate." }, { t: "The centre is $(-3, 2)$", fb: "$x - 3$ gives $h = 3$, so only the $y$ sign flips." }],
        answer: 0, skill: "Ellipses centred at (h, k)", hints: ["Write $y + 2$ as $y - (\\ldots)$."], why: "The centre is $(3, -2)$." },
      { type: "num", kicker: "Use it", prompt: "A flower bed is the ellipse $\\dfrac{(x - 10)^2}{64} + \\dfrac{(y - 4)^2}{16} = 1$ (metres), with the $y$-axis along a wall. How close does the bed come to the wall?", pre: "distance =", post: "m", answer: 2, skill: "Ellipses centred at (h, k)", near: [{ v: 10, fb: "That is the distance from the wall to the **centre**. The bed reaches $a = 8$ closer." }, { v: 18, fb: "That is the farthest point. We want the nearest edge, $10 - 8$." }], hints: ["The nearest point is $a$ to the left of the centre."], why: "$10 - 8 = 2$ m." }
    ]
  });

  /* ============================================ 4 · The general form of an ellipse */
  var HOW_4 = [["Group", "Group the $x$ terms and the $y$ terms and move the constant to the right."],
               ["Complete", "Factor out each leading coefficient, complete both squares, and add the same amounts on the right."],
               ["Divide", "Divide by the right side so it is 1: that is the standard form."]];
  LESSONS.push({
    title: "The general form of an ellipse", art: "pcconic",
    blurb: "Book 10.1 · $Ax^2 + Cy^2 + Dx + Ey + F = 0$: complete the square in both variables to find the centre.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$x^2 - 8x + \\square$ is a perfect square. What number goes in the box?", pre: "$\\square =$", answer: 16, skill: "Completing the square", near: [{ v: -4, fb: "Half of $-8$ is $-4$, and then you **square** it: $16$." }, { v: 64, fb: "Square half the coefficient: $(-4)^2$, not $(-8)^2$." }], hints: ["Half of 8, squared."], why: "$(x - 4)^2 = x^2 - 8x + 16$." },
      { type: "learn", kicker: "Explore",
        prompt: "The equation $4x^2 + 9y^2 - 16x + 18y - 11 = 0$ is an ellipse $\\frac{(x - h)^2}{9} + \\frac{(y - k)^2}{4} = 1$ in disguise. Slide $h$ and $k$ until the expanded form of your ellipse matches **all three** numbers of the given equation.",
        scene: { type: "sketch", x: [-7, 7], y: [-6, 6], u: 24, w: 384, gate: true, pts: {},
          params: { h: { min: -4, max: 4, step: 1, v: 0, label: "$h$" }, k: { min: -4, max: 4, step: 1, v: 0, label: "$k$" } },
          draw: function (s) { return [ELL(s.p.h, s.p.k, 3, 2, "blue"), dot(s.p.h, s.p.k, "ink")]; },
          readout: function (s) { var h = s.p.h, k = s.p.k, a = -8 * h, b = -18 * k, c = 4 * h * h + 9 * k * k - 36; return "$x$ term: $" + nm(a) + "x$ against $-16x$ " + (a === -16 ? "✓" : "✗") + "<br>$y$ term: $" + nm(b) + "y$ against $18y$ " + (b === 18 ? "✓" : "✗") + "<br>constant: $" + nm(c) + "$ against $-11$ " + (c === -11 ? "✓" : "✗"); },
          goal: function (s) { var h = s.p.h, k = s.p.k; return -8 * h === -16 && -18 * k === 18 && 4 * h * h + 9 * k * k - 36 === -11; } },
        gate: true, then: "$h = 2$ and $k = -1$: the ellipse is $\\frac{(x - 2)^2}{9} + \\frac{(y + 1)^2}{4} = 1$. Expanding $4(x - h)^2 + 9(y - k)^2 = 36$ gives the $x$ term $-8hx$ and the $y$ term $-18ky$, so the **linear terms** reveal the centre. **Completing the square** does that in the other direction." },
      { type: "learn", kicker: "The idea",
        prompt: "**Group** the $x$ terms and the $y$ terms and move the constant right. **Complete the square** in each, adding to the right whatever you add inside (times any factor outside). Then **divide** so the right side is 1.",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write $x^2 + 4y^2 + 6x - 8y - 3 = 0$ in standard form.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "(x^2 + 6x) + 4(y^2 - 2y) = 3", say: "Group, move the constant, and factor 4 out of the $y$ terms." },
          { step: 2, m: "(x^2 + 6x + 9) + 4(y^2 - 2y + 1)", say: "Half of 6 squared is 9; half of $-2$ squared is 1." },
          { step: 2, m: "= 3 + 9 + 4", say: "Add to the right what was added on the left. The 1 sits inside $4(\\ldots)$, so it adds **4**.", ask: { prompt: "Why do we add $4$ on the right, not $1$?", answer: 0, options: [{ t: "The 1 is inside the bracket multiplied by 4" }, { t: "Because 4 is the number of terms", fb: "$4(y^2 - 2y + 1)$ adds $4 \\times 1 = 4$ to the left side." }] } },
          { step: 2, m: "(x + 3)^2 + 4(y - 1)^2 = 16", say: "Factor both squares." },
          { step: 3, m: "\\frac{(x + 3)^2}{16} + \\frac{(y - 1)^2}{4} = 1", say: "Divide by 16: centre $(-3, 1)$, $a = 4$, $b = 2$." }] },
        gate: true, then: "$\\dfrac{(x + 3)^2}{16} + \\dfrac{(y - 1)^2}{4} = 1$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $9x^2 + 4y^2 - 36x + 24y + 36 = 0$ in standard form.",
        how: HOW_4, skill: "General form of an ellipse",
        steps: [
          { step: 1, ask: "Group and factor out the leading coefficients. Which is right?", type: "choice", answer: 0, options: [{ t: "$9(x^2 - 4x) + 4(y^2 + 6y) = -36$" }, { t: "$(x^2 - 4x) + (y^2 + 6y) = -36$", fb: "Factor 9 out of the $x$ terms and 4 out of the $y$ terms so each bracket starts with $x^2$ or $y^2$." }], m: "9(x^2 - 4x) + 4(y^2 + 6y) = -36", say: "Constant moved right." },
          { step: 2, ask: "Add $4$ inside the first bracket (that adds $9 \\cdot 4 = 36$) and $9$ inside the second ($4 \\cdot 9 = 36$). The right side becomes $-36 + 36 + 36 =$", type: "num", pre: "right side =", answer: 36, near: [{ v: -36, fb: "Add both 36s: $-36 + 36 + 36$." }], hint: "$-36 + 72$.", m: "9(x-2)^2 + 4(y+3)^2 = 36", say: "Divide by 36 next." },
          { step: 3, ask: "The centre has $h =$", type: "num", pre: "$h =$", answer: 2, near: [{ v: -2, fb: "The bracket $(x - 2)$ gives $h = 2$." }], hint: "$x - 2$.", m: "\\frac{(x-2)^2}{4} + \\frac{(y+3)^2}{9} = 1", say: "Divided by 36." },
          { step: 3, ask: "and $k =$", type: "num", pre: "$k =$", answer: -3, near: [{ v: 3, fb: "The bracket $(y + 3)$ gives $k = -3$." }], hint: "$y + 3 = y - (-3)$.", m: "(h, k) = (2, -3)", say: "Vertical major axis: 9 is under $y$." }],
        why: "Group, complete, divide." },
      { type: "num", kicker: "On your own", prompt: "Complete the square on $x^2 + 4y^2 + 10x - 8y + 13 = 0$. What is the $x$-coordinate $h$ of the centre?", pre: "$h =$", answer: -5, skill: "General form of an ellipse", near: [{ v: 5, fb: "$x^2 + 10x + 25 = (x + 5)^2$, so $h = -5$." }, { v: 25, fb: "That is the number added. $(x + 5)^2$ gives $h = -5$." }], hints: ["$x^2 + 10x + 25 = (x + 5)^2$."], why: "$(x + 5)^2 + 4(y - 1)^2 = 16$: centre $(-5, 1)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Find the foci.** The ellipse $9x^2 + 25y^2 - 18x + 100y - 116 = 0$. Complete the squares and locate its foci.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "9(x^2 - 2x) + 25(y^2 + 4y) = 116", say: "Group and factor out 9 and 25." },
          { step: 2, m: "9(x^2 - 2x + 1) + 25(y^2 + 4y + 4)", say: "Add 1 and 4 inside the brackets." },
          { step: 2, m: "= 116 + 9 + 100 = 225", say: "On the right add $9 \\cdot 1 = 9$ and $25 \\cdot 4 = 100$.", ask: { prompt: "Where does the 100 come from?", answer: 0, options: [{ t: "$25 \\times 4$: the 4 sits inside the bracket multiplied by 25" }, { t: "$10 \\times 10$", fb: "It is the amount added on the left: $25(y^2 + 4y + 4)$ adds $25 \\times 4$." }] } },
          { step: 3, m: "\\frac{(x - 1)^2}{25} + \\frac{(y + 2)^2}{9} = 1", say: "Divide by 225: centre $(1, -2)$, horizontal, $a = 5$, $b = 3$." },
          { step: 3, m: "c = 4:\\ (-3, -2),\\ (5, -2)", say: "$c^2 = 25 - 9 = 16$. The foci are 4 either side of the centre." }] },
        gate: true, then: "Centre $(1, -2)$, foci $(-3, -2)$ and $(5, -2)$." },
      { type: "num", kicker: "Try it", prompt: "Complete the squares on $x^2 + 4y^2 - 2x + 16y + 13 = 0$. What is the $y$-coordinate $k$ of the centre?", pre: "$k =$", answer: -2, skill: "General form of an ellipse", near: [{ v: 2, fb: "$y^2 + 4y + 4 = (y + 2)^2$, so $k = -2$." }, { v: 1, fb: "That is $h$. We want $k$, from the $y$ terms." }], hints: ["$4(y^2 + 4y + 4)$."], why: "$(x - 1)^2 + 4(y + 2)^2 = 4$: centre $(1, -2)$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Rio completes the squares on $4x^2 + y^2 - 8x + 2y + 1 = 0$. Tap the line where the work **first** goes wrong.",
        lines: ["4(x^2 - 2x) + (y^2 + 2y) = -1", "4(x^2 - 2x + 1) + (y^2 + 2y + 1) = -1 + 1 + 1", "4(x - 1)^2 + (y + 1)^2 = 1"], answer: 1, fix: "= -1 + 4 + 1",
        fb: { 0: "Grouping and moving the constant is right.", 2: LATER }, skill: "General form of an ellipse",
        hints: ["The 1 inside $4(\\ldots)$ adds 4."], why: "$4(x^2 - 2x + 1)$ adds $4$ to the left, so the right side gets $+4$: $4(x - 1)^2 + (y + 1)^2 = 4$." },
      { type: "num", kicker: "Use it", prompt: "A planet's orbit is $4x^2 + 25y^2 - 24x + 50y - 39 = 0$. Complete the squares. How long is the major axis?", pre: "length =", answer: 10, skill: "General form of an ellipse", near: [{ v: 5, fb: "That is $a$. The major axis has length $2a$." }, { v: 4, fb: "That is $b$, the shorter half-axis." }], hints: ["$4(x - 3)^2 + 25(y + 1)^2 = 100$."], why: "$\\frac{(x - 3)^2}{25} + \\frac{(y + 1)^2}{4} = 1$, so $a = 5$ and $2a = 10$." }
    ]
  });
  /* ========================================================= hyperbola helpers */
  // A hyperbola x^2/a^2 - y^2/b^2 = 1 (vert: y^2/a^2 - x^2/b^2 = 1) centred at (h, k), as two branches clipped to the window.
  var HYP = function (h, k, a, b, vert, xr, yr, c) {
    var g = function (sg) { return function (t) { return vert ? [h + b * Math.sinh(t), k + sg * a * Math.cosh(t)] : [h + sg * a * Math.cosh(t), k + b * Math.sinh(t)]; }; };
    return PARAM(g(1), -4, 4, 400, xr, yr, c).concat(PARAM(g(-1), -4, 4, 400, xr, yr, c));
  };
  // The two asymptotes through (h, k) with slopes +m and -m, dashed.
  var ASY = function (h, k, m, xr, yr, c) {
    return curve(function (x) { return k + m * (x - h); }, xr[0], xr[1], c || "soft", yr, true).concat(curve(function (x) { return k - m * (x - h); }, xr[0], xr[1], c || "soft", yr, true));
  };
  var HYPEQ = function (h, k, A, B, vert) { return vert ? FRC(SQB("y", k), A) + " - " + FRC(SQB("x", h), B) + " = 1" : FRC(SQB("x", h), A) + " - " + FRC(SQB("y", k), B) + " = 1"; };

  /* ============================================ 5 · The hyperbola at the origin */
  var HOW_5 = [["Which axis", "The variable with the **positive** term is the axis it opens along."],
               ["Read", "$a^2$ is under the positive term, $b^2$ under the other, and $c^2 = a^2 + b^2$."],
               ["Mark", "Vertices $\\pm a$, foci $\\pm c$, asymptotes $y = \\pm\\frac{b}{a}x$ (or $\\pm\\frac{a}{b}x$ when it opens up and down)."]];
  var G5 = function (k) {
    var xr = [-8, 8], yr = [-7, 7], it = HYP(0, 0, 3, 4, true, xr, yr, "blue");
    if (k >= 2) it.push(dot(0, 3, "blue", "(0, 3)", "ne"), dot(0, -3, "blue", "(0, -3)", "se"), dot(0, 5, "green", "(0, 5)", "ne"), dot(0, -5, "green", "(0, -5)", "se"));
    if (k >= 3) it = it.concat(ASY(0, 0, 3 / 4, xr, yr));
    return grid("The hyperbola y squared over 9 minus x squared over 16 equals 1" + (k >= 2 ? ", with vertices (0, 3) and (0, -3) and foci (0, 5) and (0, -5)" : "") + (k >= 3 ? ", and its asymptotes" : "") + ".", it, { x: xr, y: yr, u: 15 });
  };
  LESSONS.push({
    title: "The hyperbola at the origin", art: "pcconic",
    blurb: "Book 10.2 · All the points whose distances to two foci differ by a constant; $c^2 = a^2 + b^2$, and two asymptotes guide the branches.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $a^2 = 9$ and $b^2 = 16$, what is $\\sqrt{a^2 + b^2}$?", pre: "value =", answer: 5, skill: "Sums of squares", near: [{ v: 7, fb: "Add the squares first: $9 + 16 = 25$, then take the root." }], hints: ["$9 + 16 = 25$."], why: "$\\sqrt{25} = 5$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange point $P$ is on one branch of a hyperbola with foci $F_1$ and $F_2$ (green). Slide $P$ along the branch and watch **how much farther** it is from one focus than from the other. Visit the vertex, then go far out.",
        scene: { type: "sketch", x: [-9, 9], y: [-7, 7], u: 16, w: 336, gate: true, pts: {},
          params: { u: { min: -6, max: 6, step: 1, v: 3, label: "$P$" } },
          track: function (s) { return s.p.u === 0 ? "vertex" : Math.abs(s.p.u) === 6 ? "far" : null; },
          draw: function (s) { var t = s.p.u * 0.2, x = 3 * Math.cosh(t), y = 4 * Math.sinh(t), xr = [-9, 9], yr = [-7, 7]; return HYP(0, 0, 3, 4, false, xr, yr, "blue").concat(ASY(0, 0, 4 / 3, xr, yr), [{ seg: [[x, y], [-5, 0]], c: "blue" }, { seg: [[x, y], [5, 0]], c: "orange" }, dot(-5, 0, "green", "F1", "sw"), dot(5, 0, "green", "F2", "se"), dot(x, y, "orange")]); },
          readout: function (s) { var t = s.p.u * 0.2, x = 3 * Math.cosh(t), y = 4 * Math.sinh(t), d1 = Math.hypot(x + 5, y), d2 = Math.hypot(x - 5, y); return "$PF_1 = " + nm(f4(d1, 2)) + "$ · $PF_2 = " + nm(f4(d2, 2)) + "$ · difference $" + nm(f4(d1 - d2, 2)) + "$<br>Vertex: " + (s.tracked.vertex ? "✓" : "—") + " · far out: " + (s.tracked.far ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.vertex && s.tracked.far); } },
        gate: true, then: "The **difference** of the two distances is always $6 = 2a$: at the vertex they are $2$ and $8$. That is what a **hyperbola** is: all points whose distances to two foci differ by a constant. Far out, the branch hugs the dashed **asymptotes** $y = \\pm\\frac{4}{3}x$." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$ opens left and right; $\\frac{y^2}{a^2} - \\frac{x^2}{b^2} = 1$ opens up and down. The positive term gives $a^2$. For a hyperbola $c^2 = a^2 + b^2$, so the foci are **farther** than the vertices.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the vertices, foci and asymptotes of $\\dfrac{y^2}{9} - \\dfrac{x^2}{16} = 1$.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "\\frac{y^2}{9} - \\frac{x^2}{16} = 1", say: "The positive term is $y^2$: the hyperbola opens **up and down**.", fig: G5(1) },
          { step: 2, m: "a^2 = 9,\\ b^2 = 16", say: "$a^2$ is under the positive term, which here is the **smaller** number." },
          { step: 2, m: "c^2 = 9 + 16 = 25", say: "For a hyperbola $c^2 = a^2 + b^2$: **add**. So $c = 5$.", ask: { prompt: "Which of $a$, $b$, $c$ is the largest here?", answer: 0, options: [{ t: "$c$: the foci lie beyond the vertices" }, { t: "$a$", fb: "$c^2 = a^2 + b^2$ is bigger than $a^2$, so $c > a$." }] } },
          { step: 3, m: "(0, \\pm 3),\\ (0, \\pm 5)", say: "Vertices $\\pm a$ and foci $\\pm c$, on the $y$-axis.", fig: G5(2) },
          { step: 3, m: "y = \\pm\\tfrac{3}{4}x", say: "Opening up and down, the asymptotes have slope $\\frac{a}{b}$.", fig: G5(3) }] },
        gate: true, then: "Vertices $(0, \\pm 3)$, foci $(0, \\pm 5)$, asymptotes $y = \\pm\\frac{3}{4}x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $\\dfrac{x^2}{64} - \\dfrac{y^2}{36} = 1$.",
        how: HOW_5, skill: "Reading a hyperbola",
        steps: [
          { step: 1, ask: "The positive term is $x^2$, so the hyperbola opens…", type: "choice", answer: 0, options: [{ t: "left and right" }, { t: "up and down", fb: "It opens along the axis of the **positive** term, $x$." }], m: "a^2 = 64,\\ b^2 = 36", say: "$a = 8$, $b = 6$." },
          { step: 2, ask: "$c^2 = a^2 + b^2 = 64 + 36 =$", type: "num", pre: "$c^2 =$", answer: 100, near: [{ v: 28, fb: "For a hyperbola you **add**: $a^2 + b^2$." }], hint: "$64 + 36$.", m: "c^2 = 100", say: "So $c = 10$ and the foci are $(\\pm 10, 0)$." },
          { step: 3, ask: "The asymptotes are $y = \\pm\\frac{b}{a}x$. The slope $\\frac{b}{a}$ is (a fraction is fine)", type: "num", pre: "slope =", answer: 0.75, tol: 0.001, calc: true, near: [{ v: 1.3333, tol: 0.001, fb: "Opening left and right the slope is $\\frac{b}{a} = \\frac{6}{8}$, not $\\frac{a}{b}$." }], hint: "$\\frac{6}{8}$.", m: "y = \\pm\\tfrac{3}{4}x", say: "The vertices are $(\\pm 8, 0)$." }],
        why: "Which axis, read, mark." },
      { type: "num", kicker: "On your own", prompt: "Find $c$ for the hyperbola $\\dfrac{x^2}{144} - \\dfrac{y^2}{25} = 1$.", pre: "$c =$", answer: 13, skill: "Reading a hyperbola", near: [{ v: 169, fb: "That is $c^2 = 144 + 25$. Take the square root." }, { v: 119, fb: "For a hyperbola $c^2 = a^2 + b^2$: add." }], hints: ["$c^2 = 144 + 25$."], why: "$c = \\sqrt{169} = 13$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Not in standard form.** Find the foci and asymptotes of $9x^2 - 16y^2 = 144$.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "\\frac{x^2}{16} - \\frac{y^2}{9} = 1", say: "Divide by 144. The positive term is $x^2$: it opens left and right." },
          { step: 2, m: "a^2 = 16,\\ b^2 = 9", say: "So $a = 4$ and $b = 3$.", ask: { prompt: "Which sign shows it is a hyperbola, not an ellipse?", answer: 0, options: [{ t: "The **minus** between the two terms" }, { t: "The 1 on the right", fb: "Both ellipses and hyperbolas have 1 on the right. The minus sign is the difference." }] } },
          { step: 2, m: "c^2 = 16 + 9 = 25", say: "$c = 5$." },
          { step: 3, m: "(\\pm 5, 0),\\ y = \\pm\\tfrac{3}{4}x", say: "Foci $(\\pm 5, 0)$; asymptote slope $\\frac{b}{a} = \\frac{3}{4}$." }] },
        gate: true, then: "Foci $(\\pm 5, 0)$, vertices $(\\pm 4, 0)$, asymptotes $y = \\pm\\frac{3}{4}x$." },
      { type: "num", kicker: "Try it", prompt: "What is the slope of the positive asymptote of $\\dfrac{x^2}{25} - \\dfrac{y^2}{144} = 1$? (A decimal is fine.)", pre: "slope =", answer: 2.4, tol: 0.001, calc: true, skill: "Reading a hyperbola", near: [{ v: 0.4167, tol: 0.001, fb: "Opening left and right the slope is $\\frac{b}{a}$, with $b$ from the **second** denominator." }], hints: ["$b = 12$ and $a = 5$."], why: "$\\frac{12}{5} = 2.4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rae says $\\dfrac{y^2}{9} - \\dfrac{x^2}{16} = 1$ opens left and right because 16 is the larger denominator. What is wrong?",
        options: [{ t: "The positive term is $y^2$, so it opens **up and down**" }, { t: "Nothing: the larger denominator decides", fb: "For a hyperbola the **positive term** decides, not the size of the denominator." }, { t: "It opens in all four directions", fb: "A hyperbola has two branches, along one axis." }],
        answer: 0, skill: "Reading a hyperbola", hints: ["Which term has the plus sign?"], why: "$y^2$ is positive: vertices $(0, \\pm 3)$." },
      { type: "num", kicker: "Use it", prompt: "Two radio stations are at $(\\pm 10, 0)$ in km. A ship is on the hyperbola where its distances to the stations differ by 12 km ($2a = 12$). What is $b$ for that hyperbola?", pre: "$b =$", post: "km", answer: 8, skill: "Reading a hyperbola", near: [{ v: 64, fb: "That is $b^2$. Take the square root." }, { v: 6, fb: "That is $a$. Use $b^2 = c^2 - a^2$." }], hints: ["$c = 10$ and $a = 6$."], why: "$b^2 = 100 - 36 = 64$, so $b = 8$." }
    ]
  });

  /* ============================================ 6 · Writing the equation of a hyperbola */
  var HOW_6 = [["Axis", "Do the vertices and foci lie on the $x$-axis or the $y$-axis?"],
               ["Find a, b", "$a$ from a vertex, $c$ from a focus, then $b^2 = c^2 - a^2$."],
               ["Write", "Put $a^2$ under the **positive** term."]];
  LESSONS.push({
    title: "Writing the equation of a hyperbola", art: "pcconic",
    blurb: "Book 10.2 · From vertices and foci (or asymptotes) to the equation: $b^2 = c^2 - a^2$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $c = 5$ and $a = 3$, what is $b^2 = c^2 - a^2$?", pre: "$b^2 =$", answer: 16, skill: "Hyperbola constants", near: [{ v: 34, fb: "Subtract: $b^2 = c^2 - a^2$." }, { v: 4, fb: "Square first: $25 - 9$." }], hints: ["$25 - 9$."], why: "$16$." },
      { type: "learn", kicker: "Explore",
        prompt: "A hyperbola has vertices $(\\pm a, 0)$ and foci $(\\pm c, 0)$. Slide $a$ and $c$. Find the pair that makes $b = 3$, and see what happens when $c$ is **not larger** than $a$.",
        scene: { type: "sketch", x: [-9, 9], y: [-7, 7], u: 16, w: 336, gate: true, pts: {},
          params: { a: { min: 1, max: 6, step: 1, v: 3, label: "$a$" }, c: { min: 1, max: 7, step: 1, v: 5, label: "$c$" } },
          track: function (s) { var a = s.p.a, c = s.p.c, q = c * c - a * a; return q <= 0 ? "none" : q === 9 ? "b3" : null; },
          draw: function (s) { var a = s.p.a, c = s.p.c, q = c * c - a * a, xr = [-9, 9], yr = [-7, 7]; if (q <= 0) return []; var b = Math.sqrt(q); return HYP(0, 0, a, b, false, xr, yr, "blue").concat(ASY(0, 0, b / a, xr, yr), [dot(a, 0, "blue"), dot(-a, 0, "blue"), dot(c, 0, "green"), dot(-c, 0, "green")]); },
          readout: function (s) { var a = s.p.a, c = s.p.c, q = c * c - a * a; return q <= 0 ? "$c$ must be larger than $a$: no hyperbola" : "$b^2 = c^2 - a^2 = " + c * c + " - " + a * a + " = " + q + "$ · $b = " + nm(f4(Math.sqrt(q), 2)) + "$<br>$b = 3$: " + (s.tracked.b3 ? "✓" : "—") + " · no hyperbola: " + (s.tracked.none ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.b3 && s.tracked.none); } },
        gate: true, then: "$a = 4$ and $c = 5$ give $b^2 = 25 - 16 = 9$, so $b = 3$. If $c \\le a$ there is no hyperbola: the foci of a hyperbola are **beyond** the vertices, since $c^2 = a^2 + b^2$. For an ellipse it is the other way round." },
      { type: "learn", kicker: "The idea",
        prompt: "From the vertices and foci: decide the **axis**, find $a$ from a vertex and $c$ from a focus, then $b^2 = c^2 - a^2$. Write $a^2$ under the **positive** term (the variable along the axis) and $b^2$ under the other, joined by a minus sign.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write the equation of the hyperbola with vertices $(0, \\pm 8)$ and foci $(0, \\pm 10)$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "(0, \\pm 8),\\ (0, \\pm 10)", say: "The $y$-coordinates change: the hyperbola opens up and down, so $y^2$ is the positive term." },
          { step: 2, m: "a = 8,\\ c = 10", say: "A vertex is $a$ from the centre; a focus is $c$." },
          { step: 2, m: "b^2 = 100 - 64 = 36", say: "$b^2 = c^2 - a^2$.", ask: { prompt: "Why $c^2 - a^2$ here, but $a^2 - c^2$ for an ellipse?", answer: 0, options: [{ t: "Here $c > a$; for an ellipse $c < a$" }, { t: "It does not matter", fb: "For a hyperbola $c^2 = a^2 + b^2$, so $b^2 = c^2 - a^2$ is positive." }] } },
          { step: 3, m: "\\frac{y^2}{64} - \\frac{x^2}{36} = 1", say: "$a^2 = 64$ under $y^2$, the positive term." }] },
        gate: true, then: "$\\dfrac{y^2}{64} - \\dfrac{x^2}{36} = 1$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write the equation with vertices $(0, \\pm 12)$ and foci $(0, \\pm 13)$.",
        how: HOW_6, skill: "Writing a hyperbola",
        steps: [
          { step: 1, ask: "The $y$-coordinates change, so the positive term is…", type: "choice", answer: 0, options: [{ t: "$y^2$" }, { t: "$x^2$", fb: "The vertices $(0, \\pm 12)$ are on the $y$-axis: the hyperbola opens up and down." }], m: "a = 12,\\ c = 13", say: "Vertical axis." },
          { step: 2, ask: "$a^2 =$", type: "num", pre: "$a^2 =$", answer: 144, near: [{ v: 12, fb: "That is $a$. Square it." }], hint: "$12^2$.", m: "a^2 = 144", say: "Under $y^2$." },
          { step: 2, ask: "$b^2 = c^2 - a^2 = 169 - 144 =$", type: "num", pre: "$b^2 =$", answer: 25, near: [{ v: 313, fb: "Subtract: $b^2 = c^2 - a^2$." }, { v: -25, fb: "A hyperbola has $c > a$, so $c^2 - a^2$ is positive." }], hint: "$169 - 144$.", m: "b^2 = 25", say: "Under $x^2$." },
          { step: 3, ask: "The equation is…", type: "choice", answer: 0, options: [{ t: "$\\dfrac{y^2}{144} - \\dfrac{x^2}{25} = 1$" }, { t: "$\\dfrac{x^2}{144} - \\dfrac{y^2}{25} = 1$", fb: "$a^2 = 144$ goes under the **positive** term, $y^2$." }], m: "\\frac{y^2}{144} - \\frac{x^2}{25} = 1", say: "Check: $(0, 12)$ gives $\\frac{144}{144} = 1$." }],
        why: "Axis, find $a$ and $b$, write." },
      { type: "num", kicker: "On your own", prompt: "A hyperbola has vertices $(\\pm 9, 0)$ and foci $(\\pm 15, 0)$. What is $b^2$?", pre: "$b^2 =$", answer: 144, skill: "Writing a hyperbola", near: [{ v: 12, fb: "That is $b$. The question asks for $b^2$." }, { v: 306, fb: "Subtract: $b^2 = c^2 - a^2 = 225 - 81$." }], hints: ["$c^2 - a^2$."], why: "$225 - 81 = 144$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**From the asymptotes.** A hyperbola opens left and right, with vertices $(\\pm 3, 0)$ and asymptotes $y = \\pm 2x$. Write its equation.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "a = 3", say: "The vertices $(\\pm 3, 0)$ are on the $x$-axis: opens left and right." },
          { step: 2, m: "\\frac{b}{a} = 2", say: "Opening left and right, the asymptotes are $y = \\pm\\frac{b}{a}x$.", ask: { prompt: "So $b$ equals…", answer: 0, options: [{ t: "$2a = 6$" }, { t: "$a \\div 2 = 1.5$", fb: "$\\frac{b}{a} = 2$ means $b = 2a$." }] } },
          { step: 2, m: "b = 6,\\ b^2 = 36", say: "$a^2 = 9$." },
          { step: 3, m: "\\frac{x^2}{9} - \\frac{y^2}{36} = 1", say: "Positive term $x^2$ with $a^2 = 9$." }] },
        gate: true, then: "$\\dfrac{x^2}{9} - \\dfrac{y^2}{36} = 1$." },
      { type: "num", kicker: "Try it", prompt: "A hyperbola has foci $(\\pm 17, 0)$ and vertices $(\\pm 8, 0)$. What is $b^2$?", pre: "$b^2 =$", answer: 225, skill: "Writing a hyperbola", near: [{ v: 15, fb: "That is $b$. We want $b^2$." }, { v: 353, fb: "Subtract: $289 - 64$." }], hints: ["$c^2 - a^2 = 289 - 64$."], why: "$225$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kay writes the hyperbola with vertices $(\\pm 3, 0)$ and foci $(\\pm 5, 0)$. Tap the line where the work **first** goes wrong.",
        lines: ["a = 3,\\ c = 5", "b^2 = a^2 - c^2 = -16", "\\frac{x^2}{9} - \\frac{y^2}{-16} = 1"], answer: 1, fix: "b^2 = c^2 - a^2 = 16",
        fb: { 0: "The vertex gives $a = 3$ and the focus gives $c = 5$.", 2: LATER }, skill: "Writing a hyperbola",
        hints: ["For a hyperbola $c > a$, so $b^2$ must be positive."], why: "$b^2 = 25 - 9 = 16$ (never negative)." },
      { type: "num", kicker: "Use it", prompt: "A cooling tower's side is a hyperbola with vertices $(\\pm 30, 0)$ (the narrowest width is 60 m) and foci $(\\pm 50, 0)$. What is $b$?", pre: "$b =$", post: "m", answer: 40, skill: "Writing a hyperbola", near: [{ v: 1600, fb: "That is $b^2$. Take the square root." }, { v: 20, fb: "That is $c - a$. Use $b^2 = c^2 - a^2$." }], hints: ["$c^2 - a^2 = 2500 - 900$."], why: "$b^2 = 1600$, so $b = 40$." }
    ]
  });

  /* ============================================ 7 · Hyperbolas centred at (h, k) */
  var HOW_7 = [["Centre", "Read $(h, k)$ from the brackets, with the opposite sign."],
               ["Opens", "The positive term shows the direction it opens."],
               ["Shift", "Vertices and foci are $\\pm a$ and $\\pm c$ from the centre; the asymptotes pass through it."]];
  var G7 = function (k) {
    var xr = [-5, 9], yr = [-8, 6], it = HYP(2, -1, 3, 4, false, xr, yr, "blue");
    if (k >= 2) it.push(dot(2, -1, "ink", "(2, -1)", "n"), dot(5, -1, "blue", "(5, -1)", "se"), dot(-1, -1, "blue", "(-1, -1)", "sw"), dot(7, -1, "green"), dot(-3, -1, "green"));
    if (k >= 3) it = it.concat(ASY(2, -1, 4 / 3, xr, yr));
    return grid("A hyperbola centred at (2, -1)" + (k >= 3 ? " with its asymptotes" : "") + ".", it, { x: xr, y: yr, u: 17 });
  };
  LESSONS.push({
    title: "Hyperbolas centred anywhere", art: "pcconic",
    blurb: "Book 10.2 · Slide the hyperbola to $(h, k)$; the general form needs completing the square, as for the ellipse.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "In $\\dfrac{(x - 4)^2}{9} - \\dfrac{(y + 2)^2}{16} = 1$, what is $k$?", pre: "$k =$", answer: -2, skill: "Reading a shift", near: [{ v: 2, fb: "$y + 2 = y - (-2)$, so $k = -2$." }, { v: 4, fb: "That is $h$. $k$ comes from the $y$ bracket." }], hints: ["Write $y + 2$ as $y - (\\ldots)$."], why: "$k = -2$." },
      { type: "learn", kicker: "Explore",
        prompt: "The hyperbola $\\frac{x^2}{9} - \\frac{y^2}{16} = 1$ is moved so its centre is $(h, k)$. Slide $h$ and $k$ and read the equation. Put the centre at $(2, -3)$.",
        scene: { type: "sketch", x: [-9, 9], y: [-8, 8], u: 16, w: 336, gate: true, pts: {},
          params: { h: { min: -3, max: 3, step: 1, v: 0, label: "$h$" }, k: { min: -3, max: 3, step: 1, v: 0, label: "$k$" } },
          draw: function (s) { var h = s.p.h, k = s.p.k, xr = [-9, 9], yr = [-8, 8]; return HYP(h, k, 3, 4, false, xr, yr, "blue").concat(ASY(h, k, 4 / 3, xr, yr), [dot(h, k, "ink"), dot(h + 5, k, "green"), dot(h - 5, k, "green")]); },
          readout: function (s) { return "$" + HYPEQ(s.p.h, s.p.k, 9, 16, false) + "$<br>centre $(" + nm(s.p.h) + ", " + nm(s.p.k) + ")$ · foci $(" + nm(s.p.h - 5) + ", " + nm(s.p.k) + ")$ and $(" + nm(s.p.h + 5) + ", " + nm(s.p.k) + ")$"; },
          goal: function (s) { return s.p.h === 2 && s.p.k === -3; } },
        gate: true, then: "With centre $(2, -3)$ the equation is $\\frac{(x - 2)^2}{9} - \\frac{(y + 3)^2}{16} = 1$. As for the ellipse the brackets carry the **opposite signs**, and the asymptotes still pass through the centre. The distances $a = 3$, $b = 4$, $c = 5$ do not change." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\frac{(x - h)^2}{a^2} - \\frac{(y - k)^2}{b^2} = 1$ opens left and right; with $(y - k)^2$ first, up and down. The centre is $(h, k)$. Vertices and foci are $a$ and $c$ from the centre along the axis, and the asymptotes pass through the centre.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Describe $\\dfrac{(x - 2)^2}{9} - \\dfrac{(y + 1)^2}{16} = 1$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "(h, k) = (2, -1)", say: "$x - 2$ gives $h = 2$; $y + 1$ gives $k = -1$.", fig: G7(1) },
          { step: 2, m: "a = 3,\\ b = 4,\\ c = 5", say: "The positive term is $x$: it opens **left and right**. $c^2 = 9 + 16 = 25$.", ask: { prompt: "In $(y + 1)^2$, what is $k$?", answer: 0, options: [{ t: "$-1$" }, { t: "$1$", fb: "$y + 1 = y - (-1)$, so $k = -1$." }] } },
          { step: 3, m: "(5, -1),\\ (-1, -1)", say: "Vertices: $a = 3$ either side of the centre. Foci: $(7, -1)$ and $(-3, -1)$.", fig: G7(2) },
          { step: 3, m: "y + 1 = \\pm\\tfrac{4}{3}(x - 2)", say: "Asymptotes through the centre with slope $\\pm\\frac{b}{a}$.", fig: G7(3) }] },
        gate: true, then: "Centre $(2, -1)$, vertices $(5, -1)$ and $(-1, -1)$, foci $(7, -1)$ and $(-3, -1)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $\\dfrac{(y - 3)^2}{25} - \\dfrac{(x + 4)^2}{144} = 1$.",
        how: HOW_7, skill: "Hyperbolas centred at (h, k)",
        steps: [
          { step: 1, ask: "The positive term is $y$, so the hyperbola opens…", type: "choice", answer: 0, options: [{ t: "up and down" }, { t: "left and right", fb: "It opens along the axis of the positive term, $y$." }], m: "(h, k) = (-4, 3)", say: "$a = 5$, $b = 12$, $c = 13$." },
          { step: 2, ask: "The upper vertex is $a = 5$ above the centre: $y = 3 + 5 =$", type: "num", pre: "$y =$", answer: 8, near: [{ v: -2, fb: "That is the lower vertex, $3 - 5$." }], hint: "$3 + 5$.", m: "(-4, 8)", say: "The lower vertex is $(-4, -2)$." },
          { step: 2, ask: "The upper focus is $c = 13$ above the centre: $y = 3 + 13 =$", type: "num", pre: "$y =$", answer: 16, near: [{ v: 13, fb: "Add $c$ to the centre's $y$-coordinate, 3." }], hint: "$3 + 13$.", m: "(-4, 16)", say: "The lower focus is $(-4, -10)$." },
          { step: 3, ask: "Opening up and down, the asymptote slope is $\\frac{a}{b} = \\frac{5}{12}$. As a decimal to 3 places:", type: "num", pre: "slope =", answer: 0.417, tol: 0.001, calc: true, near: [{ v: 2.4, tol: 0.001, fb: "Opening up and down the slope is $\\frac{a}{b}$, not $\\frac{b}{a}$." }], hint: "$5 \\div 12$.", m: "y - 3 = \\pm\\tfrac{5}{12}(x + 4)", say: "Through the centre." }],
        why: "Centre, opens, shift." },
      { type: "num", kicker: "On your own", prompt: "For $\\dfrac{(x + 1)^2}{16} - \\dfrac{(y - 5)^2}{9} = 1$, what is the $x$-coordinate of the **right-hand focus**?", pre: "$x =$", answer: 4, skill: "Hyperbolas centred at (h, k)", near: [{ v: 5, fb: "That is $c$. Add it to the centre's $x$: $-1 + 5$." }, { v: 3, fb: "That is the right vertex, $-1 + 4$. The focus is $c = 5$ away." }], hints: ["$c^2 = 16 + 9$, then $h + c$."], why: "$c = 5$ and $h = -1$: $-1 + 5 = 4$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**General form.** Write $16x^2 - 9y^2 + 64x + 54y - 161 = 0$ in standard form.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "16(x^2 + 4x) - 9(y^2 - 6y) = 161", say: "Group; factor out 16 and $-9$." },
          { step: 2, m: "16(x^2 + 4x + 4) - 9(y^2 - 6y + 9)", say: "Add 4 and 9 inside the brackets." },
          { step: 2, m: "= 161 + 64 - 81 = 144", say: "On the right: $16 \\cdot 4 = 64$ and $-9 \\cdot 9 = -81$.", ask: { prompt: "Why is the second amount $-81$?", answer: 0, options: [{ t: "The 9 is inside $-9(\\ldots)$, so it adds $-9 \\times 9$" }, { t: "A mistake: it should be $+81$", fb: "The bracket is multiplied by $-9$, so adding 9 inside adds $-81$." }] } },
          { step: 3, m: "\\frac{(x + 2)^2}{9} - \\frac{(y - 3)^2}{16} = 1", say: "Divide by 144: centre $(-2, 3)$, opens left and right." }] },
        gate: true, then: "$\\dfrac{(x + 2)^2}{9} - \\dfrac{(y - 3)^2}{16} = 1$." },
      { type: "num", kicker: "Try it", prompt: "Complete the squares on $9x^2 - 4y^2 - 36x - 8y - 4 = 0$. What is the $y$-coordinate $k$ of the centre?", pre: "$k =$", answer: -1, skill: "Hyperbolas centred at (h, k)", near: [{ v: 1, fb: "$y^2 + 2y + 1 = (y + 1)^2$, so $k = -1$." }, { v: 2, fb: "That is $h$. We want $k$, from the $y$ terms." }], hints: ["$-4(y^2 + 2y + 1)$."], why: "$9(x - 2)^2 - 4(y + 1)^2 = 36$: centre $(2, -1)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Pia says the foci of $\\dfrac{(x - 1)^2}{9} - \\dfrac{(y - 2)^2}{16} = 1$ are $(5, 0)$ and $(-5, 0)$. What is wrong?",
        options: [{ t: "She forgot the shift: the foci are $c = 5$ from the **centre** $(1, 2)$, at $(6, 2)$ and $(-4, 2)$" }, { t: "Nothing: the foci are always on the axes", fb: "Only when the centre is at the origin." }, { t: "$c$ should be 7", fb: "$c^2 = 9 + 16 = 25$, so $c = 5$." }],
        answer: 0, skill: "Hyperbolas centred at (h, k)", hints: ["Measure $c$ from the centre."], why: "Foci $(6, 2)$ and $(-4, 2)$." },
      { type: "num", kicker: "Use it", prompt: "The hyperbola $\\dfrac{(x - 8)^2}{9} - \\dfrac{(y - 1)^2}{16} = 1$ has a left branch. How close to the $y$-axis does that branch come?", pre: "distance =", answer: 5, skill: "Hyperbolas centred at (h, k)", near: [{ v: 3, fb: "That is $a$. The vertex is $a$ to the **left of the centre** at $x = 8$." }, { v: 11, fb: "That is the right vertex, $8 + 3$." }], hints: ["The left vertex is at $h - a$."], why: "$8 - 3 = 5$." }
    ]
  });
  /* ========================================================= parabola helpers */
  // (x - h)^2 = 4p(y - k), or with horiz: (y - k)^2 = 4p(x - h), clipped to the window.
  var PARC = function (h, k, p, horiz, xr, yr, c) {
    return PARAM(function (s) { return horiz ? [h + s * s / (4 * p), k + s] : [h + s, k + s * s / (4 * p)]; }, -14, 14, 560, xr, yr, c);
  };
  var PAREQ = function (h, k, p, horiz) { var f4p = 4 * p; return horiz ? SQB("y", k) + " = " + f4p + (h === 0 ? "x" : "(x " + (h < 0 ? "+ " + (-h) : "- " + h) + ")") : SQB("x", h) + " = " + f4p + (k === 0 ? "y" : "(y " + (k < 0 ? "+ " + (-k) : "- " + k) + ")"); };

  /* ============================================ 8 · The parabola: focus and directrix */
  var HOW_8 = [["Which axis", "$y^2 = \\dots x$ opens sideways; $x^2 = \\dots y$ opens up or down."],
               ["Find p", "The number in front of the other variable is $4p$."],
               ["Mark", "The focus is $p$ from the vertex, inside the curve; the directrix is $p$ on the other side."]];
  var G8 = function (k) {
    var xr = [-6, 8], yr = [-8, 8], it = PARC(0, 0, 3, true, xr, yr, "blue");
    if (k >= 2) it.push(dot(0, 0, "ink", "(0, 0)", "sw"), dot(3, 0, "green", "(3, 0)", "se"));
    if (k >= 3) it.push({ seg: [[-3, -8], [-3, 8]], c: "orange", dash: true }, { word: "x = -3", at: [-3.1, 6.5], c: "orange", anchor: "end" });
    return grid("The parabola y squared equals 12x" + (k >= 2 ? " with its vertex and focus (3, 0)" : "") + (k >= 3 ? " and the directrix x = -3" : "") + ".", it, { x: xr, y: yr, u: 17 });
  };
  LESSONS.push({
    title: "The parabola: focus and directrix", art: "pcconic",
    blurb: "Book 10.3 · Every point is as far from the focus as from the directrix; $y^2 = 4px$ and $x^2 = 4py$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $4p = 20$, what is $p$?", pre: "$p =$", answer: 5, skill: "Solving for p", near: [{ v: 80, fb: "Divide: $p = 20 \\div 4$." }], hints: ["Divide both sides by 4."], why: "$p = 5$." },
      { type: "learn", kicker: "Explore",
        prompt: "The parabola $x^2 = 4py$ has its focus $F = (0, p)$ (green) and its directrix $y = -p$ (dashed). Slide $p$ and the point $P$'s $x$. The two distances from $P$ are shown. Put $P$ **level with the focus**.",
        scene: { type: "sketch", x: [-9, 9], y: [-3, 9], u: 18, w: 372, gate: true, pts: {},
          params: { p: { min: 1, max: 4, step: 1, v: 2, label: "$p$" }, x: { min: -8, max: 8, step: 1, v: 3, label: "$P$'s $x$" } },
          track: function (s) { return Math.abs(s.p.x) === 2 * s.p.p ? "level" : null; },
          draw: function (s) { var p = s.p.p, x = s.p.x, y = x * x / (4 * p), xr = [-9, 9], yr = [-3, 9]; return PARC(0, 0, p, false, xr, yr, "blue").concat([{ seg: [[-9, -p], [9, -p]], c: "orange", dash: true }, dot(0, p, "green", "F", "ne")], y <= 9 ? [{ seg: [[x, y], [0, p]], c: "blue" }, { seg: [[x, y], [x, -p]], c: "orange" }, dot(x, y, "orange")] : []); },
          readout: function (s) { var p = s.p.p, x = s.p.x, y = x * x / (4 * p); if (y > 9) return "$P$ is above the window: try a smaller $|x|$ or a larger $p$"; var d1 = Math.hypot(x, y - p), d2 = y + p; return "$x^2 = " + 4 * p + "y$: to the focus $" + nm(f4(d1, 2)) + "$ · to the directrix $" + nm(f4(d2, 2)) + "$" + (s.tracked.level ? " · level with the focus ✓" : ""); },
          goal: function (s) { return !!s.tracked.level; } },
        gate: true, then: "The two distances are **equal** for every $P$: that is what a parabola is, all points equally far from the focus and the directrix. Level with the focus, $|x| = 2p$, so the parabola is exactly $4p$ wide there. The number $4p$ in $x^2 = 4py$ is that width." },
      { type: "learn", kicker: "The idea",
        prompt: "$y^2 = 4px$ opens sideways: right if $p > 0$, left if $p < 0$. $x^2 = 4py$ opens up if $p > 0$, down if $p < 0$. The vertex is $(0, 0)$, the **focus** is $p$ from it inside the curve, and the **directrix** is the line $p$ away on the other side.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the focus and directrix of $y^2 = 12x$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "y^2 = 12x", say: "$y$ is squared: it opens **sideways**, to the right because 12 is positive.", fig: G8(1) },
          { step: 2, m: "4p = 12 \\ \\Rightarrow \\ p = 3", say: "Compare with $y^2 = 4px$.", ask: { prompt: "If it were $y^2 = -12x$, it would open…", answer: 0, options: [{ t: "to the left, with $p = -3$" }, { t: "upwards", fb: "$y^2$ means it opens sideways. A negative $4p$ means left." }] } },
          { step: 3, m: "(0,0),\\ (3, 0)", say: "The focus is $p = 3$ from the vertex, inside the curve.", fig: G8(2) },
          { step: 3, m: "x = -3", say: "The directrix is 3 on the other side of the vertex.", fig: G8(3) }] },
        gate: true, then: "Vertex $(0, 0)$, focus $(3, 0)$, directrix $x = -3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the focus and directrix of $x^2 = -20y$.",
        how: HOW_8, skill: "Reading a parabola",
        steps: [
          { step: 1, ask: "$x$ is squared and $-20$ is negative, so it opens…", type: "choice", answer: 0, options: [{ t: "downwards" }, { t: "to the left", fb: "$x^2 = \\dots y$ opens up or down. The minus sign means down." }], m: "x^2 = 4py", say: "Vertical axis." },
          { step: 2, ask: "$4p = -20$, so $p =$", type: "num", pre: "$p =$", answer: -5, near: [{ v: 5, fb: "$p$ is negative here: the parabola opens down." }, { v: -80, fb: "Divide: $p = -20 \\div 4$." }], hint: "$-20 \\div 4$.", m: "p = -5", say: "Negative: down." },
          { step: 3, ask: "The focus is $p$ from the vertex along the axis: $(0, \\square)$ with $\\square =$", type: "num", pre: "$y =$", answer: -5, near: [{ v: 5, fb: "The focus is on the side the parabola opens towards: down." }], hint: "Use $p = -5$.", m: "(0, -5)", say: "Inside the curve." },
          { step: 3, ask: "The directrix is the line $y =$", type: "num", pre: "$y =$", answer: 5, near: [{ v: -5, fb: "That is the focus. The directrix is on the **other** side." }], hint: "Opposite the focus.", m: "y = 5", say: "Check: the vertex is halfway between focus and directrix." }],
        why: "Which axis, find $p$, mark." },
      { type: "num", kicker: "On your own", prompt: "Find the $x$-coordinate of the focus of $y^2 = -16x$.", pre: "$x =$", answer: -4, skill: "Reading a parabola", near: [{ v: 4, fb: "$4p = -16$ gives $p = -4$: it opens left." }, { v: -16, fb: "That is $4p$. Divide by 4 to get $p$." }], hints: ["$4p = -16$."], why: "$p = -4$, so the focus is $(-4, 0)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Writing the equation.** A parabola has vertex $(0, 0)$, focus $(-6, 0)$ and directrix $x = 6$. Write its equation.",
        scene: { type: "walk", how: [["Axis", "Focus on the $x$-axis: $y^2 = 4px$. On the $y$-axis: $x^2 = 4py$."], ["Find p", "$p$ is the focus's coordinate: negative if it is left or below."], ["Write", "Put $4p$ in the equation."]], rows: [
          { step: 1, m: "\\text{focus on the } x\\text{-axis}", say: "So the equation has the form $y^2 = 4px$." },
          { step: 2, m: "p = -6", say: "The focus is 6 to the **left** of the vertex.", ask: { prompt: "Is the directrix $x = 6$ consistent?", answer: 0, options: [{ t: "Yes: it is $p$ on the other side of the vertex" }, { t: "No: it should be $x = -6$", fb: "The directrix is on the opposite side from the focus: right." }] } },
          { step: 3, m: "4p = -24", say: "$4 \\times (-6)$." },
          { step: 3, m: "y^2 = -24x", say: "A parabola opening to the left." }] },
        gate: true, then: "$y^2 = -24x$." },
      { type: "num", kicker: "Try it", prompt: "A parabola $x^2 = k\\,y$ has its vertex at the origin and its focus at $(0, 5)$. What is $k$?", pre: "$k =$", answer: 20, skill: "Writing a parabola", near: [{ v: 5, fb: "That is $p$. The coefficient is $4p$." }], hints: ["$k = 4p$ with $p = 5$."], why: "$x^2 = 20y$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee says $y^2 = 16x$ opens upward because 16 is positive. What is wrong?",
        options: [{ t: "$y$ is squared, so it opens **sideways**: to the right" }, { t: "Nothing: positive means up", fb: "Up and down belong to $x^2 = 4py$, where $x$ is squared." }, { t: "It opens to the left", fb: "A positive $4p$ opens to the right." }],
        answer: 0, skill: "Reading a parabola", hints: ["Which variable is squared?"], why: "$p = 4$: it opens right with focus $(4, 0)$." },
      { type: "num", kicker: "Use it", prompt: "A flashlight's mirror is the parabola $y^2 = 36x$ (cm), with the bulb at the focus. How far is the bulb from the vertex?", pre: "distance =", post: "cm", answer: 9, skill: "Reading a parabola", near: [{ v: 36, fb: "That is $4p$. The bulb is $p$ from the vertex." }, { v: 18, fb: "$4p = 36$, so $p = 9$." }], hints: ["$4p = 36$."], why: "$p = 9$ cm." }
    ]
  });

  /* ============================================ 9 · Parabolas with vertex (h, k) */
  var HOW_9 = [["Vertex", "Read $(h, k)$ from the brackets, with the opposite signs."],
               ["Find p", "Compare the number in front with $4p$."],
               ["Mark", "The focus is $p$ from the vertex along the axis; the directrix is $p$ the other way."]];
  var G9p = function (k) {
    var xr = [-3, 9], yr = [-8, 6], it = PARC(2, -1, 3, true, xr, yr, "blue");
    if (k >= 2) it.push(dot(2, -1, "ink", "(2, -1)", "sw"), dot(5, -1, "green", "(5, -1)", "se"));
    if (k >= 3) it.push({ seg: [[-1, -8], [-1, 6]], c: "orange", dash: true }, { word: "x = -1", at: [-1.2, 4.5], c: "orange", anchor: "end" });
    return grid("The parabola (y + 1) squared equals 12(x - 2)" + (k >= 2 ? " with vertex (2, -1) and focus (5, -1)" : "") + (k >= 3 ? " and directrix x = -1" : "") + ".", it, { x: xr, y: yr, u: 17 });
  };
  LESSONS.push({
    title: "Parabolas with the vertex anywhere", art: "pcconic",
    blurb: "Book 10.3 · $(x - h)^2 = 4p(y - k)$: slide the vertex, then complete the square for the general form.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "In $(y - 3)^2$, which value of $y$ makes the bracket zero?", pre: "$y =$", answer: 3, skill: "Reading a shift", near: [{ v: -3, fb: "$y - 3 = 0$ gives $y = 3$." }], hints: ["Solve $y - 3 = 0$."], why: "$y = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "The parabola $x^2 = 8y$ has its vertex at the origin. Slide $h$ and $k$ to move the vertex to $(h, k)$ and read the new equation. Put the vertex at $(-3, 2)$.",
        scene: { type: "sketch", x: [-9, 9], y: [-6, 11], u: 16, w: 336, gate: true, pts: {},
          params: { h: { min: -4, max: 4, step: 1, v: 0, label: "$h$" }, k: { min: -3, max: 3, step: 1, v: 0, label: "$k$" } },
          draw: function (s) { var h = s.p.h, k = s.p.k, xr = [-9, 9], yr = [-6, 11]; return PARC(h, k, 2, false, xr, yr, "blue").concat([{ seg: [[-9, k - 2], [9, k - 2]], c: "orange", dash: true }, dot(h, k, "ink"), dot(h, k + 2, "green")]); },
          readout: function (s) { return "$" + PAREQ(s.p.h, s.p.k, 2, false) + "$<br>vertex $(" + nm(s.p.h) + ", " + nm(s.p.k) + ")$ · focus $(" + nm(s.p.h) + ", " + nm(s.p.k + 2) + ")$ · directrix $y = " + nm(s.p.k - 2) + "$"; },
          goal: function (s) { return s.p.h === -3 && s.p.k === 2; } },
        gate: true, then: "With the vertex at $(-3, 2)$ the equation is $(x + 3)^2 = 8(y - 2)$. The brackets carry the **opposite signs**, and the shape ($4p = 8$, so $p = 2$) is unchanged. The focus and directrix move with the vertex." },
      { type: "learn", kicker: "The idea",
        prompt: "$(x - h)^2 = 4p(y - k)$ opens up ($p > 0$) or down; $(y - k)^2 = 4p(x - h)$ opens right or left. The vertex is $(h, k)$. The focus is $p$ from the vertex along the axis, and the directrix is the line $p$ away on the other side.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the vertex, focus and directrix of $(y + 1)^2 = 12(x - 2)$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "(h, k) = (2, -1)", say: "$x - 2$ gives $h = 2$; $y + 1 = y - (-1)$ gives $k = -1$.", fig: G9p(1) },
          { step: 2, m: "4p = 12 \\ \\Rightarrow \\ p = 3", say: "$y$ is squared: it opens sideways, to the right.", ask: { prompt: "Which way does it open?", answer: 0, options: [{ t: "Right: $y$ is squared and $p > 0$" }, { t: "Up", fb: "A squared $y$ means a sideways parabola." }] } },
          { step: 3, m: "\\text{focus } (2 + 3, -1)", say: "$p = 3$ to the right of the vertex: $(5, -1)$.", fig: G9p(2) },
          { step: 3, m: "x = 2 - 3 = -1", say: "The directrix is 3 to the left.", fig: G9p(3) }] },
        gate: true, then: "Vertex $(2, -1)$, focus $(5, -1)$, directrix $x = -1$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $(x - 4)^2 = -16(y + 2)$.",
        how: HOW_9, skill: "Parabolas with vertex (h, k)",
        steps: [
          { step: 1, ask: "The vertex has $k =$", type: "num", pre: "$k =$", answer: -2, near: [{ v: 2, fb: "$y + 2 = y - (-2)$ gives $k = -2$." }], hint: "Opposite sign.", m: "(h, k) = (4, -2)", say: "$x - 4$ gives $h = 4$." },
          { step: 2, ask: "$4p = -16$, so $p =$", type: "num", pre: "$p =$", answer: -4, near: [{ v: 4, fb: "$p$ is negative: the parabola opens downward." }], hint: "$-16 \\div 4$.", m: "p = -4", say: "$x$ is squared and $p < 0$: it opens down." },
          { step: 3, ask: "The focus is $p$ below the vertex: its $y$-coordinate is $k + p = -2 + (-4) =$", type: "num", pre: "$y =$", answer: -6, near: [{ v: 2, fb: "That is the directrix. The focus is on the side it opens towards." }], hint: "$-2 - 4$.", m: "(4, -6)", say: "The focus is inside the curve." },
          { step: 3, ask: "The directrix is $y = k - p = -2 - (-4) =$", type: "num", pre: "$y =$", answer: 2, near: [{ v: -6, fb: "That is the focus's $y$-coordinate. The directrix is on the other side." }], hint: "$-2 + 4$.", m: "y = 2", say: "The vertex is halfway between them." }],
        why: "Vertex, find $p$, mark." },
      { type: "num", kicker: "On your own", prompt: "For $(y - 5)^2 = 8(x + 3)$, what is the $x$-coordinate of the focus?", pre: "$x =$", answer: -1, skill: "Parabolas with vertex (h, k)", near: [{ v: 2, fb: "That is $p$. Add it to the vertex's $x$, which is $-3$." }, { v: 3, fb: "$x + 3$ gives $h = -3$, not 3." }], hints: ["$4p = 8$, so $p = 2$."], why: "$h + p = -3 + 2 = -1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**General form.** Write $y^2 - 8y - 12x + 40 = 0$ in standard form and find its focus.",
        scene: { type: "walk", how: [["Isolate", "Keep the squared variable's terms on the left."], ["Complete", "Complete the square and add the same to the right."], ["Factor", "Factor the right side as $4p(\\ldots)$."]], rows: [
          { step: 1, m: "y^2 - 8y = 12x - 40", say: "Move the $x$ terms and the constant to the right." },
          { step: 2, m: "y^2 - 8y + 16 = 12x - 24", say: "Half of $-8$ squared is 16: add it to both sides.", ask: { prompt: "Why add 16 to the right side too?", answer: 0, options: [{ t: "To keep the equation balanced" }, { t: "To make the right side bigger", fb: "Adding the same amount to both sides keeps the equation true." }] } },
          { step: 3, m: "(y - 4)^2 = 12(x - 2)", say: "Factor 12 out of the right side: vertex $(2, 4)$, $4p = 12$." },
          { step: 3, m: "p = 3,\\ \\text{focus } (5, 4)", say: "It opens right, so the focus is 3 to the right of the vertex." }] },
        gate: true, then: "$(y - 4)^2 = 12(x - 2)$ with focus $(5, 4)$." },
      { type: "num", kicker: "Try it", prompt: "Complete the square on $x^2 + 6x - 8y + 1 = 0$. What is the $y$-coordinate $k$ of the vertex?", pre: "$k =$", answer: -1, skill: "Parabolas with vertex (h, k)", near: [{ v: 1, fb: "$(x + 3)^2 = 8y + 8 = 8(y + 1)$, so $k = -1$." }, { v: -3, fb: "That is $h$. We want $k$ from the $y$ bracket." }], hints: ["$x^2 + 6x + 9 = 8y - 1 + 9$."], why: "$(x + 3)^2 = 8(y + 1)$: vertex $(-3, -1)$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Rio completes the square on $x^2 - 4x - 12y + 28 = 0$. Tap the line where the work **first** goes wrong.",
        lines: ["x^2 - 4x = 12y - 28", "x^2 - 4x + 4 = 12y - 28 - 4", "(x - 2)^2 = 12y - 32"], answer: 1, fix: "x^2 - 4x + 4 = 12y - 28 + 4",
        fb: { 0: "Moving $-12y + 28$ to the right is correct.", 2: LATER }, skill: "Parabolas with vertex (h, k)",
        hints: ["Add 4 to **both** sides."], why: "Adding 4 on the left means adding 4 on the right: $12y - 24 = 12(y - 2)$." },
      { type: "num", kicker: "Use it", prompt: "Water from a fountain follows $(x - 2)^2 = -2(y - 6)$ (metres). How high is the highest point of the water?", pre: "height =", post: "m", answer: 6, skill: "Parabolas with vertex (h, k)", near: [{ v: 2, fb: "That is the $x$-coordinate of the vertex. The height is its $y$-coordinate." }], hints: ["The highest point is the vertex: $(h, k)$."], why: "The vertex is $(2, 6)$." }
    ]
  });
  /* ========================================================= rotation helpers */
  // The general second-degree expression as text: GENP([A, B, C, D, E, F]) is "x^2 + 3xy - 2y^2 + x - 4".
  var GENP = function (cs) {
    var s = "";
    [[cs[0], "x^2"], [cs[1], "xy"], [cs[2], "y^2"], [cs[3], "x"], [cs[4], "y"], [cs[5], ""]].forEach(function (t) {
      var c = t[0], v = t[1];
      if (c === 0) return;
      var a = Math.abs(c), body = (a === 1 && v !== "" ? "" : String(a)) + v;
      s += s === "" ? (c < 0 ? "-" : "") + body : (c < 0 ? " - " : " + ") + body;
    });
    return s || "0";
  };
  var G10 = function (k) {
    var f = function (x, y) { return 2 * x * x + 3 * x * y - 2 * y * y + x - 4; };
    return grid("The curve 2x squared plus 3xy minus 2y squared plus x minus 4 equals 0, a hyperbola.", IMPL(f, [-6, 6], [-6, 6], 90, "blue"), { x: [-6, 6], y: [-6, 6], u: 20 });
  };

  /* ============================================ 10 · Which conic is it? */
  var HOW_10 = [["Read", "Find $A$, $B$ and $C$ in $Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0$."],
                ["Discriminant", "Work out $B^2 - 4AC$."],
                ["Decide", "Negative: ellipse. Zero: parabola. Positive: hyperbola."]];
  LESSONS.push({
    title: "Which conic is it?", art: "pcconic",
    blurb: "Book 10.4 · An $xy$ term tilts the conic; the discriminant $B^2 - 4AC$ still names it.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $B^2 - 4AC$ when $A = 1$, $B = 4$ and $C = 3$.", pre: "value =", answer: 4, skill: "Discriminant", near: [{ v: 28, fb: "$4AC = 12$, and you **subtract**: $16 - 12$." }, { v: 16, fb: "Do not forget the $-4AC$ part." }], hints: ["$16 - 4(1)(3)$."], why: "$16 - 12 = 4$." },
      { type: "learn", kicker: "Explore",
        prompt: "The curve is $x^2 + Bxy + Cy^2 + x - 3 = 0$, with $A = 1$. Slide $B$ and $C$ and watch the shape change. Find an **ellipse**, a **parabola** and a **hyperbola**, and watch $B^2 - 4AC$.",
        scene: { type: "sketch", x: [-6, 6], y: [-6, 6], u: 26, w: 360, gate: true, pts: {},
          params: { B: { min: -4, max: 4, step: 1, v: 0, label: "$B$" }, C: { min: 1, max: 4, step: 1, v: 2, label: "$C$" } },
          track: function (s) { var d = s.p.B * s.p.B - 4 * s.p.C; return d < 0 ? "ell" : d === 0 ? "par" : "hyp"; },
          draw: function (s) { var B = s.p.B, C = s.p.C; return IMPL(function (x, y) { return x * x + B * x * y + C * y * y + x - 3; }, [-6, 6], [-6, 6], 90, "blue"); },
          readout: function (s) { var B = s.p.B, C = s.p.C, d = B * B - 4 * C; return "$B^2 - 4AC = " + B * B + " - " + 4 * C + " = " + nm(d) + "$: " + (d < 0 ? "**ellipse**" : d === 0 ? "**parabola**" : "**hyperbola**") + "<br>Ellipse: " + (s.tracked.ell ? "✓" : "—") + " · parabola: " + (s.tracked.par ? "✓" : "—") + " · hyperbola: " + (s.tracked.hyp ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.ell && s.tracked.par && s.tracked.hyp); } },
        gate: true, then: "$B^2 - 4AC < 0$ gives an **ellipse**, $= 0$ a **parabola** and $> 0$ a **hyperbola**. For example $B = 2$, $C = 1$ gives $0$, and $B = 3$, $C = 1$ gives $5$. The test works however tilted the curve is, because it only looks at the $x^2$, $xy$ and $y^2$ terms." },
      { type: "learn", kicker: "The idea",
        prompt: "Any conic is $Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0$. A nonzero $B$ tilts it. Its type depends on the **discriminant** $B^2 - 4AC$: **negative** is an ellipse (a circle if $A = C$ and $B = 0$), **zero** a parabola, **positive** a hyperbola.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Which conic is $2x^2 + 3xy - 2y^2 + x - 4 = 0$?",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "A = 2,\\ B = 3,\\ C = -2", say: "The coefficients of $x^2$, $xy$ and $y^2$.", fig: G10(1) },
          { step: 2, m: "B^2 = 3^2 = 9", say: "Square the middle coefficient." },
          { step: 2, m: "-4AC = -4(2)(-2) = 16", say: "$A$ and $C$ have opposite signs, so $AC < 0$ and $-4AC > 0$.", ask: { prompt: "Why is $-4AC$ positive here?", answer: 0, options: [{ t: "$A$ and $C$ have opposite signs, so $AC$ is negative" }, { t: "Because $B$ is positive", fb: "$B$ does not enter $-4AC$. It is the signs of $A$ and $C$." }] } },
          { step: 2, m: "B^2 - 4AC = 9 + 16 = 25", say: "Add them." },
          { step: 3, m: "25 > 0:\\ \\text{hyperbola}", say: "A positive discriminant: a hyperbola. The graph agrees." }] },
        gate: true, then: "It is a **hyperbola**: $B^2 - 4AC = 25 > 0$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you classify $9x^2 - 12xy + 4y^2 + 3x - 2 = 0$.",
        how: HOW_10, skill: "Which conic",
        steps: [
          { step: 1, ask: "Here $A = 9$, $B = -12$, $C = 4$. $B^2 =$", type: "num", pre: "$B^2 =$", answer: 144, near: [{ v: -144, fb: "A square is never negative: $(-12)^2 = 144$." }], hint: "$12 \\times 12$.", m: "B^2 = 144", say: "Squared, so positive." },
          { step: 2, ask: "$4AC = 4 \\cdot 9 \\cdot 4 =$", type: "num", pre: "$4AC =$", answer: 144, near: [{ v: 36, fb: "Multiply all of $4 \\cdot 9 \\cdot 4$." }], hint: "$36 \\times 4$.", m: "B^2 - 4AC = 0", say: "$144 - 144$." },
          { step: 3, ask: "A discriminant of zero means…", type: "choice", answer: 0, options: [{ t: "a parabola" }, { t: "an ellipse", fb: "An ellipse needs a **negative** discriminant." }, { t: "a hyperbola", fb: "A hyperbola needs a **positive** discriminant." }], m: "\\text{parabola}", say: "The quadratic part is a perfect square, $(3x - 2y)^2$." }],
        why: "Read, discriminant, decide." },
      { type: "choice", kicker: "On your own", prompt: "Which conic is $x^2 + xy + y^2 - 4 = 0$?",
        options: [{ t: "An ellipse: $1 - 4 = -3 < 0$" }, { t: "A parabola", fb: "A parabola needs $B^2 - 4AC = 0$. Here it is $1 - 4$." }, { t: "A hyperbola", fb: "A hyperbola needs a positive discriminant, but $1 - 4$ is negative." }],
        answer: 0, skill: "Which conic", hints: ["$B^2 - 4AC = 1 - 4(1)(1)$."], why: "$-3 < 0$: an ellipse." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Is it a circle?** Identify $3x^2 + 3y^2 - 12x + 6y - 9 = 0$ and find its centre and radius.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "A = 3,\\ B = 0,\\ C = 3", say: "No $xy$ term, and $A = C$." },
          { step: 2, m: "B^2 - 4AC = -36", say: "Negative: an ellipse. With $A = C$ and $B = 0$ it is a **circle**.", ask: { prompt: "What makes an ellipse a circle?", answer: 0, options: [{ t: "$A = C$ and $B = 0$" }, { t: "$B = 0$ alone", fb: "$x^2 + 4y^2 = 4$ has $B = 0$ but is a stretched ellipse. We also need $A = C$." }] } },
          { step: 3, m: "x^2 + y^2 - 4x + 2y = 3", say: "Divide by 3 and move the constant." },
          { step: 3, m: "(x - 2)^2 + (y + 1)^2 = 8", say: "Complete both squares: add 4 and 1, so $3 + 4 + 1 = 8$." },
          { step: 3, m: "\\text{centre } (2, -1),\\ r = 2\\sqrt{2}", say: "$r^2 = 8$." }] },
        gate: true, then: "A circle with centre $(2, -1)$ and radius $2\\sqrt{2}$." },
      { type: "num", kicker: "Try it", prompt: "Work out $B^2 - 4AC$ for $4x^2 + 12xy + 9y^2 - 5x = 0$.", pre: "value =", answer: 0, skill: "Which conic", near: [{ v: 288, fb: "Subtract: $B^2 - 4AC = 144 - 4(4)(9)$." }, { v: 144, fb: "Do not forget $-4AC = -144$." }], hints: ["$B^2 = 144$ and $4AC = 144$."], why: "$144 - 144 = 0$: a parabola." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rin says $x^2 - 3xy + 2y^2 = 1$ is an ellipse because every squared term has a positive coefficient. What is wrong?",
        options: [{ t: "The test is $B^2 - 4AC = 9 - 8 = 1 > 0$: it is a hyperbola" }, { t: "Nothing: positive coefficients mean an ellipse", fb: "The $xy$ term also matters. Use the discriminant." }, { t: "It is a parabola", fb: "A parabola needs $B^2 - 4AC = 0$. Here it is $1$." }],
        answer: 0, skill: "Which conic", hints: ["Work out $B^2 - 4AC$."], why: "Positive discriminant: a hyperbola." },
      { type: "num", kicker: "Use it", prompt: "For which positive value of $B$ is $x^2 + Bxy + 9y^2 - x = 0$ a **parabola**?", pre: "$B =$", answer: 6, skill: "Which conic", near: [{ v: 36, fb: "That is $B^2$. Take the square root." }, { v: 3, fb: "Set $B^2 - 4(1)(9) = 0$: $B^2 = 36$." }], hints: ["Set the discriminant to zero."], why: "$B^2 = 36$, so $B = 6$." }
    ]
  });

  /* ============================================ 11 · Rotating the axes */
  var HOW_11 = [["Angle", "Find $\\theta$ from $\\cot 2\\theta = \\frac{A - C}{B}$."],
                ["Substitute", "Replace $x$ and $y$ by $x'\\cos\\theta - y'\\sin\\theta$ and $x'\\sin\\theta + y'\\cos\\theta$."],
                ["Simplify", "The $x'y'$ term disappears: read the standard form."]];
  LESSONS.push({
    title: "Rotating the axes", art: "pcconic",
    blurb: "Book 10.4 · Turn the axes by the right angle and the $xy$ term vanishes, leaving a standard conic.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $\\cos^2 45^\\circ - \\sin^2 45^\\circ$. (The box accepts expressions such as 3*sin(20°).)", pre: "value =", answer: 0, tol: 0.001, calc: true, skill: "Double angle", near: [{ v: 1, tol: 0.001, fb: "$\\cos 45^\\circ = \\sin 45^\\circ$, so they cancel: this is $\\cos 90^\\circ$." }], hints: ["$\\cos^2\\theta - \\sin^2\\theta = \\cos 2\\theta$."], why: "$\\cos 90^\\circ = 0$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue curve is the hyperbola $xy = 8$. Turn the new axes $x'$ (orange) and $y'$ (green) by the angle $\\theta$. The readout is the equation of the curve in the new axes. Find the angle where the **$x'y'$ term vanishes**.",
        scene: { type: "sketch", x: [-8, 8], y: [-8, 8], u: 18, w: 336, gate: true, pts: {},
          params: { t: { min: 0, max: 90, step: 15, v: 0, label: "$\\theta$ (°)" } },
          draw: function (s) {
            var t = s.p.t * DEG, c = Math.cos(t), sn = Math.sin(t), L1 = 8 / Math.max(Math.abs(c), Math.abs(sn)), L2 = 8 / Math.max(Math.abs(sn), Math.abs(c));
            return curve(function (x) { return 8 / x; }, 0.95, 8, "blue", [-8, 8]).concat(curve(function (x) { return 8 / x; }, -8, -0.95, "blue", [-8, 8]), [{ seg: [[-L1 * c, -L1 * sn], [L1 * c, L1 * sn]], c: "orange" }, { seg: [[L2 * sn, -L2 * c], [-L2 * sn, L2 * c]], c: "green" }, { word: "x'", at: [7 * c + 0.5 * sn, 7 * sn - 0.5 * c], c: "orange" }, { word: "y'", at: [-7 * sn - 0.5 * c, 7 * c - 0.5 * sn], c: "green" }]);
          },
          readout: function (s) { var t = s.p.t * DEG, a = 0.5 * Math.sin(2 * t), b = Math.cos(2 * t); return "$" + nm(f4(a, 2)) + "x'^2 " + (b < -1e-9 ? "-" : "+") + " " + nm(f4(Math.abs(b), 2)) + "x'y' - " + nm(f4(a, 2)) + "y'^2 = 8$" + (Math.abs(b) < 1e-9 ? "<br>**no $x'y'$ term**" : ""); },
          goal: function (s) { return s.p.t === 45; } },
        gate: true, then: "At $\\theta = 45^\\circ$ the equation is $0.5x'^2 - 0.5y'^2 = 8$: no $x'y'$ term. The new axes run along the hyperbola's own axes, so it reads as a standard hyperbola, $\\frac{x'^2}{16} - \\frac{y'^2}{16} = 1$. The angle comes from $\\cot 2\\theta = \\frac{A - C}{B} = 0$." },
      { type: "learn", kicker: "The idea",
        prompt: "To remove the $xy$ term, rotate the axes by $\\theta$ with $\\cot 2\\theta = \\frac{A - C}{B}$. Then $x = x'\\cos\\theta - y'\\sin\\theta$ and $y = x'\\sin\\theta + y'\\cos\\theta$. Substitute and simplify: the $x'y'$ terms cancel and a standard form is left.",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Rotate the axes to write $xy = 8$ in standard form.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "\\cot 2\\theta = \\frac{0 - 0}{1} = 0", say: "Here $A = C = 0$ and $B = 1$. So $2\\theta = 90^\\circ$ and $\\theta = 45^\\circ$." },
          { step: 2, m: "x = \\frac{x' - y'}{\\sqrt{2}}", say: "$\\cos 45^\\circ = \\sin 45^\\circ = \\frac{1}{\\sqrt 2}$ in $x = x'\\cos\\theta - y'\\sin\\theta$." },
          { step: 2, m: "y = \\frac{x' + y'}{\\sqrt{2}}", say: "And $y = x'\\sin\\theta + y'\\cos\\theta$." },
          { step: 3, m: "xy = \\frac{x'^2 - y'^2}{2} = 8", say: "Multiply: $(x' - y')(x' + y') = x'^2 - y'^2$, over $\\sqrt 2 \\cdot \\sqrt 2 = 2$.", ask: { prompt: "What happened to the $x'y'$ terms?", answer: 0, options: [{ t: "They cancelled: $-x'y' + x'y' = 0$" }, { t: "They doubled", fb: "$(x' - y')(x' + y')$ has $+x'y'$ and $-x'y'$, which add to zero." }] } },
          { step: 3, m: "\\frac{x'^2}{16} - \\frac{y'^2}{16} = 1", say: "Multiply by 2 and divide by 16: a hyperbola with $a = 4$ along the $x'$-axis." }] },
        gate: true, then: "$\\dfrac{x'^2}{16} - \\dfrac{y'^2}{16} = 1$, a hyperbola with $a = b = 4$ on the rotated axes." },
      { type: "guided", kicker: "Together",
        prompt: "Now you rotate $5x^2 - 6xy + 5y^2 = 32$.",
        how: HOW_11, skill: "Rotating the axes",
        steps: [
          { step: 1, ask: "$A = C = 5$, so $\\cot 2\\theta = 0$ and $2\\theta = 90^\\circ$. So $\\theta =$", type: "num", pre: "$\\theta =$", answer: 45, near: [{ v: 90, fb: "That is $2\\theta$. Halve it." }], hint: "$90 \\div 2$.", m: "\\theta = 45^\\circ", say: "Same rotation formulas as before." },
          { step: 2, ask: "$5x^2 + 5y^2 = 5(x'^2 + y'^2)$ and $-6xy = -3(x'^2 - y'^2)$. The coefficient of $x'^2$ is $5 - 3 =$", type: "num", pre: "coefficient =", answer: 2, near: [{ v: 8, fb: "That is the coefficient of $y'^2$, $5 + 3$." }], hint: "$5 - 3$.", m: "2x'^2 + \\dots", say: "The $x'y'$ terms cancel." },
          { step: 2, ask: "The coefficient of $y'^2$ is $5 + 3 =$", type: "num", pre: "coefficient =", answer: 8, near: [{ v: 2, fb: "$-3 \\cdot (-y'^2)$ is $+3y'^2$, so add." }], hint: "$5 + 3$.", m: "2x'^2 + 8y'^2 = 32", say: "Divide by 32." },
          { step: 3, ask: "$\\frac{x'^2}{16} + \\frac{y'^2}{4} = 1$ is an ellipse. Its semi-major axis is $a =$", type: "num", pre: "$a =$", answer: 4, near: [{ v: 16, fb: "That is $a^2$. Take the square root." }], hint: "$\\sqrt{16}$.", m: "a = 4,\\ b = 2", say: "Along the rotated $x'$-axis." }],
        why: "Angle, substitute, simplify." },
      { type: "num", kicker: "On your own", prompt: "After rotating by $45^\\circ$, the hyperbola $xy = 2$ becomes $\\dfrac{x'^2}{n} - \\dfrac{y'^2}{n} = 1$. What is $n$?", pre: "$n =$", answer: 4, skill: "Rotating the axes", near: [{ v: 2, fb: "$xy = \\frac{x'^2 - y'^2}{2} = 2$, so $x'^2 - y'^2 = 4$." }, { v: 1, fb: "Multiply both sides by 2 first: $x'^2 - y'^2 = 4$." }], hints: ["$xy = \\frac{x'^2 - y'^2}{2}$."], why: "$x'^2 - y'^2 = 4$, so $n = 4$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**An angle that is not nice.** Rotate $8x^2 - 12xy + 17y^2 = 20$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "\\cot 2\\theta = \\frac{8 - 17}{-12} = \\frac{3}{4}", say: "A 3-4-5 triangle: $\\cos 2\\theta = \\frac{3}{5}$." },
          { step: 1, m: "\\cos\\theta = \\tfrac{2}{\\sqrt 5},\\ \\sin\\theta = \\tfrac{1}{\\sqrt 5}", say: "Half-angle formulas: $\\cos\\theta = \\sqrt{\\frac{1 + 3/5}{2}}$ and $\\sin\\theta = \\sqrt{\\frac{1 - 3/5}{2}}$.", ask: { prompt: "So $\\theta$ is about…", answer: 0, options: [{ t: "$26.6^\\circ$, since $\\tan\\theta = \\frac{1}{2}$" }, { t: "$45^\\circ$", fb: "$45^\\circ$ happens only when $\\cot 2\\theta = 0$." }] } },
          { step: 2, m: "x = \\frac{2x' - y'}{\\sqrt 5}", say: "From $x = x'\\cos\\theta - y'\\sin\\theta$." },
          { step: 2, m: "y = \\frac{x' + 2y'}{\\sqrt 5}", say: "From $y = x'\\sin\\theta + y'\\cos\\theta$." },
          { step: 3, m: "5x'^2 + 20y'^2 = 20", say: "Substitute and simplify: the $x'y'$ terms cancel." },
          { step: 3, m: "\\frac{x'^2}{4} + \\frac{y'^2}{1} = 1", say: "An ellipse with $a = 2$ along the new $x'$-axis and $b = 1$." }] },
        gate: true, then: "$\\dfrac{x'^2}{4} + y'^2 = 1$, an ellipse tilted at $\\theta \\approx 26.6^\\circ$." },
      { type: "num", kicker: "Try it", prompt: "If $\\cot 2\\theta = \\dfrac{3}{4}$ and $2\\theta$ is acute, what is $\\cos 2\\theta$? (A decimal is fine.)", pre: "$\\cos 2\\theta =$", answer: 0.6, tol: 0.001, calc: true, skill: "Rotating the axes", near: [{ v: 0.8, tol: 0.001, fb: "That is $\\sin 2\\theta$. $\\cot = \\frac{\\cos}{\\sin} = \\frac{3}{4}$, so $\\cos$ is the 3 side of the 3-4-5 triangle." }], hints: ["Draw a right triangle with legs 3 and 4 and hypotenuse 5."], why: "$\\cos 2\\theta = \\frac{3}{5} = 0.6$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia rotates $x^2 + 4xy + y^2 = 8$ using $\\cot 2\\theta = \\dfrac{A + C}{B}$. What is wrong?",
        options: [{ t: "The formula is $\\cot 2\\theta = \\frac{A - C}{B}$ (a **difference**)" }, { t: "Nothing: it is $A + C$", fb: "It is the difference $A - C$. Here $A = C$, so $\\cot 2\\theta = 0$ and $\\theta = 45^\\circ$." }, { t: "She should use $\\tan 2\\theta$ with $B$ on top", fb: "$\\tan 2\\theta = \\frac{B}{A - C}$ is the same rule inverted, but with $A - C$." }],
        answer: 0, skill: "Rotating the axes", hints: ["Which sign is between $A$ and $C$?"], why: "$\\cot 2\\theta = \\frac{A - C}{B} = 0$, so $\\theta = 45^\\circ$." },
      { type: "num", kicker: "Use it", prompt: "The curve $xy = 18$ is a hyperbola. After rotating by $45^\\circ$ it is $\\dfrac{x'^2}{36} - \\dfrac{y'^2}{36} = 1$. How far apart are its two vertices?", pre: "distance =", answer: 12, skill: "Rotating the axes", near: [{ v: 6, fb: "That is $a$. The vertices are $a$ either side of the centre: $2a$ apart." }, { v: 36, fb: "That is $a^2$. Take the root, then double it." }], hints: ["$a^2 = 36$."], why: "$a = 6$, so the vertices are $12$ apart." }
    ]
  });
  /* ========================================================= polar conic helper */
  // r = ep / (1 + sg * e * trig(theta)), trig "cos" or "sin", drawn inside the window. A negative r is plotted the usual way, so a hyperbola gets both branches.
  var POLC = function (e, p, trig, sg, xr, yr, c) {
    return PARAM(function (t) {
      var d = 1 + sg * e * (trig === "cos" ? Math.cos(t) : Math.sin(t));
      if (Math.abs(d) < 1e-3) return null;
      var r = e * p / d;
      return [r * Math.cos(t), r * Math.sin(t)];
    }, 0, 2 * PI, 1440, xr, yr, c);
  };

  /* ============================================ 12 · Conics in polar form */
  var HOW_12 = [["Make 1", "Divide so the constant in the denominator is 1."],
                ["Read", "$e$ is the coefficient of $\\cos\\theta$ or $\\sin\\theta$; the numerator is $ep$."],
                ["Decide", "$e < 1$ ellipse, $e = 1$ parabola, $e > 1$ hyperbola."]];
  var G12 = function (k) {
    var xr = [-7, 8], yr = [-5, 5], it = POLC(0.5, 6, "cos", -1, xr, yr, "blue").concat(k >= 2 ? [{ seg: [[-6, -5], [-6, 5]], c: "orange", dash: true }] : [], [dot(0, 0, "ink", "focus", "s")]);
    if (k >= 3) it.push(dot(6, 0, "green", "(6, 0)", "ne"), dot(-2, 0, "green", "(-2, 0)", "nw"));
    return grid("The ellipse r = 6 over (2 minus cos theta), with the focus at the origin" + (k >= 2 ? " and the directrix x = -6" : "") + (k >= 3 ? ", and its vertices (6, 0) and (-2, 0)" : "") + ".", it, { x: xr, y: yr, u: 16 });
  };
  LESSONS.push({
    title: "Conics in polar form", art: "pcconic",
    blurb: "Book 10.5 · With the focus at the origin, one equation $r = \\frac{ep}{1 \\pm e\\cos\\theta}$ covers every conic; $e$ decides which.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Divide the top and bottom of $r = \\dfrac{6}{2 - \\cos\\theta}$ by 2 so the denominator starts with 1. What is the new numerator?", pre: "numerator =", answer: 3, skill: "Standard polar form", near: [{ v: 6, fb: "Divide the top by 2 as well: $\\frac{6}{2} = 3$." }, { v: 12, fb: "Divide, do not multiply: $6 \\div 2$." }], hints: ["Whatever you do to the bottom, do to the top."], why: "$r = \\frac{3}{1 - 0.5\\cos\\theta}$." },
      { type: "learn", kicker: "Explore",
        prompt: "With the focus at the origin and the directrix $x = -2$ (dashed), the conic is $r = \\dfrac{2e}{1 - e\\cos\\theta}$. Slide the **eccentricity** $e$. Find an **ellipse**, a **parabola** and a **hyperbola**.",
        scene: { type: "sketch", x: [-9, 10], y: [-8, 8], u: 17, w: 371, gate: true, pts: {},
          params: { e: { min: 0.25, max: 2, step: 0.25, v: 0.5, label: "$e$" } },
          track: function (s) { return s.p.e < 1 ? "ell" : s.p.e === 1 ? "par" : "hyp"; },
          draw: function (s) { return POLC(s.p.e, 2, "cos", -1, [-9, 10], [-8, 8], "blue").concat([{ seg: [[-2, -8], [-2, 8]], c: "orange", dash: true }, dot(0, 0, "ink")]); },
          readout: function (s) { var e = s.p.e; return "$e = " + nm(e) + "$: " + (e < 1 ? "an **ellipse**" : e === 1 ? "a **parabola**" : "a **hyperbola**") + "<br>Ellipse: " + (s.tracked.ell ? "✓" : "—") + " · parabola: " + (s.tracked.par ? "✓" : "—") + " · hyperbola: " + (s.tracked.hyp ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.ell && s.tracked.par && s.tracked.hyp); } },
        gate: true, then: "$e < 1$ gives a closed **ellipse** (the smaller $e$, the rounder), $e = 1$ a **parabola**, and $e > 1$ a **hyperbola** with two branches. $e$ is the ratio of a point's distance from the focus to its distance from the directrix: less than 1 pulls the curve in, more than 1 stretches it out." },
      { type: "learn", kicker: "The idea",
        prompt: "$r = \\dfrac{ep}{1 \\pm e\\cos\\theta}$ (vertical directrix) or $\\dfrac{ep}{1 \\pm e\\sin\\theta}$ (horizontal) has its focus at the origin. First make the denominator start with **1**. Then $e$ is the coefficient and $ep$ the numerator. $e < 1$: ellipse; $e = 1$: parabola; $e > 1$: hyperbola.",
        scene: { type: "method", how: HOW_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Identify $r = \\dfrac{6}{2 - \\cos\\theta}$ and find its vertices.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "r = \\frac{6}{2 - \\cos\\theta}", say: "The denominator starts with 2, not 1: not yet in standard form." },
          { step: 1, m: "r = \\frac{3}{1 - 0.5\\cos\\theta}", say: "Divide top and bottom by 2.", fig: G12(1) },
          { step: 2, m: "e = 0.5,\\ ep = 3", say: "$e$ is the coefficient of $\\cos\\theta$; the numerator is $ep$. So $p = 6$.", ask: { prompt: "$e = 0.5 < 1$ means…", answer: 0, options: [{ t: "an ellipse" }, { t: "a hyperbola", fb: "A hyperbola needs $e > 1$." }] } },
          { step: 2, m: "\\text{directrix } x = -6", say: "The minus sign puts the directrix to the left of the focus.", fig: G12(2) },
          { step: 3, m: "\\theta = 0:\\ r = 6", say: "Where $\\cos\\theta = 1$: the vertex $(6, 0)$.", fig: G12(3) },
          { step: 3, m: "\\theta = \\pi:\\ r = 2", say: "Where $\\cos\\theta = -1$: the point $2$ units at angle $\\pi$, which is $(-2, 0)$." }] },
        gate: true, then: "An **ellipse** with $e = 0.5$, directrix $x = -6$, and vertices $(6, 0)$ and $(-2, 0)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you identify $r = \\dfrac{8}{4 + 4\\sin\\theta}$.",
        how: HOW_12, skill: "Conics in polar form",
        steps: [
          { step: 1, ask: "Divide top and bottom by 4. The new numerator is", type: "num", pre: "numerator =", answer: 2, near: [{ v: 8, fb: "Divide the top by 4 too: $8 \\div 4$." }], hint: "$8 \\div 4$.", m: "r = \\frac{2}{1 + \\sin\\theta}", say: "Denominator now starts with 1." },
          { step: 2, ask: "The coefficient of $\\sin\\theta$ is $e =$", type: "num", pre: "$e =$", answer: 1, near: [{ v: 4, fb: "That was before dividing by 4. The coefficient is now 1." }], hint: "$\\frac{4}{4}$.", m: "e = 1", say: "So $ep = 2$ gives $p = 2$." },
          { step: 3, ask: "$e = 1$ means a…", type: "choice", answer: 0, options: [{ t: "parabola" }, { t: "ellipse", fb: "An ellipse has $e < 1$." }, { t: "hyperbola", fb: "A hyperbola has $e > 1$." }], m: "\\text{parabola}", say: "The $+\\sin\\theta$ puts the directrix above the focus." },
          { step: 3, ask: "The directrix is…", type: "choice", answer: 0, options: [{ t: "$y = 2$" }, { t: "$y = -2$", fb: "A plus sign with $\\sin\\theta$ puts the directrix **above** the focus." }], m: "y = 2", say: "Check: at $\\theta = \\frac{\\pi}{2}$, $r = 1$: the vertex is $(0, 1)$, halfway." }],
        why: "Make 1, read, decide." },
      { type: "num", kicker: "On your own", prompt: "Divide through and find the eccentricity $e$ of $r = \\dfrac{12}{3 - 6\\cos\\theta}$.", pre: "$e =$", answer: 2, skill: "Conics in polar form", near: [{ v: 6, fb: "Divide by 3 first: $\\frac{6}{3}$." }, { v: 0.5, tol: 0.001, fb: "$e$ is the coefficient of $\\cos\\theta$ after the denominator starts with 1: $\\frac{6}{3}$." }], hints: ["Divide top and bottom by 3."], why: "$r = \\frac{4}{1 - 2\\cos\\theta}$: $e = 2$, a hyperbola." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A hyperbola.** Identify $r = \\dfrac{5}{2 + 3\\sin\\theta}$ and find its vertices.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "r = \\frac{2.5}{1 + 1.5\\sin\\theta}", say: "Divide top and bottom by 2." },
          { step: 2, m: "e = 1.5 > 1", say: "A **hyperbola**. $ep = 2.5$, so $p = \\frac{5}{3}$ and the directrix is $y = \\frac{5}{3}$ (above the focus)." },
          { step: 3, m: "\\theta = \\tfrac{\\pi}{2}:\\ r = 1", say: "Where $\\sin\\theta = 1$: the vertex $(0, 1)$." },
          { step: 3, m: "\\theta = \\tfrac{3\\pi}{2}:\\ r = -5", say: "Here $\\sin\\theta = -1$, so $r = \\frac{5}{2 - 3} = -5$.", ask: { prompt: "A negative $r$ means plotting…", answer: 0, options: [{ t: "in the opposite direction: the point is $(0, 5)$" }, { t: "nothing: there is no point", fb: "A negative $r$ goes backwards: 5 units opposite to $\\frac{3\\pi}{2}$, which is straight up." }] } },
          { step: 3, m: "(0, 1),\\ (0, 5)", say: "The two vertices, one on each branch." }] },
        gate: true, then: "A hyperbola with vertices $(0, 1)$ and $(0, 5)$." },
      { type: "num", kicker: "Try it", prompt: "Find the eccentricity of $r = \\dfrac{10}{5 + 4\\cos\\theta}$. (A decimal is fine.)", pre: "$e =$", answer: 0.8, tol: 0.001, calc: true, skill: "Conics in polar form", near: [{ v: 4, tol: 0.001, fb: "That is the coefficient before dividing by 5." }, { v: 1.25, tol: 0.001, fb: "Divide the 4 by the 5, not the other way round." }], hints: ["Divide top and bottom by 5."], why: "$r = \\frac{2}{1 + 0.8\\cos\\theta}$: $e = 0.8$, an ellipse." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee reads $r = \\dfrac{6}{2 - \\cos\\theta}$ as having $e = 1$ (the coefficient of $\\cos\\theta$), so a parabola. What is wrong?",
        options: [{ t: "She must divide by 2 first: $e = 0.5$, an ellipse" }, { t: "Nothing: $e$ is the coefficient", fb: "Only when the denominator starts with 1. Here it starts with 2." }, { t: "$e$ is the numerator, 6", fb: "The numerator is $ep$, not $e$." }],
        answer: 0, skill: "Conics in polar form", hints: ["Does the denominator start with 1?"], why: "$r = \\frac{3}{1 - 0.5\\cos\\theta}$." },
      { type: "num", kicker: "Use it", prompt: "A satellite's orbit is $r = \\dfrac{4000}{1 - 0.6\\cos\\theta}$ (km from the planet's centre). How far is it at its **farthest** point?", pre: "distance =", post: "km", answer: 10000, skill: "Conics in polar form", near: [{ v: 2500, fb: "That is the closest point ($\\theta = \\pi$). The farthest is where the denominator is smallest." }, { v: 4000, fb: "That is $ep$. At $\\theta = 0$ divide by $1 - 0.6$." }], hints: ["The denominator is smallest at $\\theta = 0$."], why: "$\\frac{4000}{0.4} = 10000$ km." }
    ]
  });

  /* ============================================ 13 · Writing and graphing polar conics */
  var HOW_13 = [["Directrix", "Vertical directrix: use $\\cos\\theta$. Horizontal: use $\\sin\\theta$."],
                ["Sign", "Directrix right or above the focus: **plus**. Left or below: **minus**."],
                ["Write", "$r = \\frac{ep}{1 \\pm e\\cos\\theta}$ or $\\frac{ep}{1 \\pm e\\sin\\theta}$, with $p$ the distance to the directrix."]];
  var G13 = function (k) {
    var xr = [-6, 6], yr = [-5, 5], it = [{ seg: [[-6, -4], [6, -4]], c: "orange", dash: true }, dot(0, 0, "ink", "focus", "ne")];
    if (k >= 2) it = it.concat(POLC(0.5, 4, "sin", -1, xr, yr, "blue"));
    return grid("The directrix y = -4" + (k >= 2 ? " and the ellipse with eccentricity one half and its focus at the origin" : "") + ".", it, { x: xr, y: yr, u: 20 });
  };
  var OPT13 = [["r = 3/(1 - cos θ)", "cos", -1, "r = \\frac{3}{1 - \\cos\\theta}"], ["r = 3/(1 + cos θ)", "cos", 1, "r = \\frac{3}{1 + \\cos\\theta}"], ["r = 3/(1 - sin θ)", "sin", -1, "r = \\frac{3}{1 - \\sin\\theta}"], ["r = 3/(1 + sin θ)", "sin", 1, "r = \\frac{3}{1 + \\sin\\theta}"]];
  LESSONS.push({
    title: "Writing polar conics", art: "pcconic",
    blurb: "Book 10.5 · From the eccentricity and the directrix to the equation, and back to the vertices.",
    mins: 15, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The directrix is the vertical line $x = -4$. Which function appears in the denominator of the polar equation?",
        options: [{ t: "$\\cos\\theta$" }, { t: "$\\sin\\theta$", fb: "$\\sin\\theta$ goes with a **horizontal** directrix, $y = \\pm p$." }, { t: "$\\tan\\theta$", fb: "The standard forms use $\\cos\\theta$ or $\\sin\\theta$." }],
        answer: 0, skill: "Choosing cos or sin", hints: ["Vertical lines are $x = \\text{constant}$."], why: "A vertical directrix uses $\\cos\\theta$." },
      { type: "learn", kicker: "Explore",
        prompt: "The focus is the origin; the dashed line is the directrix $x = 3$. Each button is a parabola ($e = 1$, $p = 3$) with a different sign and function. Pick the one whose vertex sits **halfway** between the focus and the line.",
        scene: { type: "sketch", x: [-9, 9], y: [-8, 8], u: 18, w: 336, gate: true, pts: {},
          chips: { f: { label: "Equation", v: "0", opts: OPT13.map(function (o, i) { return ["" + i, o[0]]; }) } },
          track: function (s) { return s.c.f === "1" ? "ok" : null; },
          draw: function (s) { var o = OPT13[+s.c.f]; return POLC(1, 3, o[1], o[2], [-9, 9], [-8, 8], "blue").concat([{ seg: [[3, -8], [3, 8]], c: "orange", dash: true }, dot(0, 0, "ink", "focus", "sw")]); },
          readout: function (s) { var o = OPT13[+s.c.f], v = o[1] === "cos" ? [o[2] * 1.5, 0] : [0, o[2] * 1.5], ok = s.c.f === "1"; return "$" + o[3] + "$: vertex at $(" + nm(v[0]) + ", " + nm(v[1]) + ")$ " + (ok ? "· halfway to the line ✓" : "· not halfway to the dashed line"); },
          goal: function (s) { return s.c.f === "1"; } },
        gate: true, then: "$r = \\dfrac{3}{1 + \\cos\\theta}$: a **vertical** directrix needs $\\cos\\theta$, and a directrix **to the right** of the focus needs a **plus** sign. The vertex $(1.5, 0)$ is halfway between the focus $(0, 0)$ and the line $x = 3$, as it must be for $e = 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "Given $e$ and the directrix: a **vertical** directrix uses $\\cos\\theta$, a **horizontal** one $\\sin\\theta$. Right or above the focus: **plus**; left or below: **minus**. The numerator is $ep$, where $p$ is the distance from the focus to the directrix.",
        scene: { type: "method", how: HOW_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write the polar equation of the conic with $e = \\frac{1}{2}$ and directrix $y = -4$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "y = -4", say: "A horizontal directrix: the equation uses $\\sin\\theta$.", fig: G13(1) },
          { step: 2, m: "1 - e\\sin\\theta", say: "The directrix is **below** the focus: a minus sign.", ask: { prompt: "A directrix above the focus would give…", answer: 0, options: [{ t: "a plus sign: $1 + e\\sin\\theta$" }, { t: "the same minus sign", fb: "Above the focus the sign is plus." }] } },
          { step: 3, m: "ep = \\tfrac{1}{2}(4) = 2", say: "$p$ is the distance 4 from the focus to the directrix." },
          { step: 3, m: "r = \\frac{2}{1 - 0.5\\sin\\theta}", say: "Put it together: an ellipse, as $e < 1$.", fig: G13(2) },
          { step: 3, m: "r = \\frac{4}{2 - \\sin\\theta}", say: "The same thing with the fractions cleared: multiply top and bottom by 2." }] },
        gate: true, then: "$r = \\dfrac{2}{1 - 0.5\\sin\\theta}$, or $r = \\dfrac{4}{2 - \\sin\\theta}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write the conic with $e = 2$ and directrix $x = 3$.",
        how: HOW_13, skill: "Writing polar conics",
        steps: [
          { step: 1, ask: "The directrix is vertical, so the denominator has…", type: "choice", answer: 0, options: [{ t: "$\\cos\\theta$" }, { t: "$\\sin\\theta$", fb: "A vertical line $x = 3$ goes with $\\cos\\theta$." }], m: "1 \\pm e\\cos\\theta", say: "Vertical directrix." },
          { step: 2, ask: "$x = 3$ is to the right of the focus, so the sign is…", type: "choice", answer: 0, options: [{ t: "plus" }, { t: "minus", fb: "Right or above the focus means plus." }], m: "1 + e\\cos\\theta", say: "Plus." },
          { step: 3, ask: "$ep = 2 \\cdot 3 =$", type: "num", pre: "$ep =$", answer: 6, near: [{ v: 5, fb: "Multiply: $e \\cdot p$." }], hint: "$e = 2$, $p = 3$.", m: "ep = 6", say: "The numerator." },
          { step: 3, ask: "The equation is…", type: "choice", answer: 0, options: [{ t: "$r = \\dfrac{6}{1 + 2\\cos\\theta}$" }, { t: "$r = \\dfrac{6}{1 - 2\\cos\\theta}$", fb: "The directrix is to the **right**: plus." }, { t: "$r = \\dfrac{3}{1 + 2\\cos\\theta}$", fb: "The numerator is $ep = 6$, not $p$." }], m: "r = \\frac{6}{1 + 2\\cos\\theta}", say: "$e = 2 > 1$: a hyperbola." }],
        why: "Directrix, sign, write." },
      { type: "num", kicker: "On your own", prompt: "A conic has $e = \\frac{3}{4}$ and directrix $x = -8$. Its equation is $r = \\dfrac{N}{1 - 0.75\\cos\\theta}$. What is $N$?", pre: "$N =$", answer: 6, skill: "Writing polar conics", near: [{ v: 8, fb: "That is $p$. The numerator is $ep = \\frac{3}{4} \\cdot 8$." }, { v: 10.6667, tol: 0.001, fb: "Multiply, do not divide: $e \\cdot p$." }], hints: ["$N = ep$."], why: "$\\frac{3}{4} \\cdot 8 = 6$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Back to rectangular form.** The ellipse $r = \\dfrac{12}{4 - 2\\cos\\theta}$: find its centre, $a$ and $b$.",
        scene: { type: "walk", how: [["Standard", "Divide so the denominator starts with 1."], ["Vertices", "Find $r$ at $\\theta = 0$ and $\\theta = \\pi$."], ["Centre, a, b", "Midpoint, half the distance between vertices, then $b^2 = a^2 - c^2$."]], rows: [
          { step: 1, m: "r = \\frac{3}{1 - 0.5\\cos\\theta}", say: "Divide by 4: $e = 0.5$, an ellipse." },
          { step: 2, m: "r(0) = 6,\\ r(\\pi) = 2", say: "The vertices are $(6, 0)$ and $(-2, 0)$." },
          { step: 3, m: "\\text{centre } (2, 0),\\ a = 4", say: "The centre is the midpoint of the vertices; $a$ is half of $6 + 2 = 8$.", ask: { prompt: "What is the midpoint's $x$-coordinate?", answer: 0, options: [{ t: "$\\frac{6 + (-2)}{2} = 2$" }, { t: "$\\frac{6 + 2}{2} = 4$", fb: "The second vertex is at $x = -2$, not $+2$." }] } },
          { step: 3, m: "c = 2,\\ b^2 = 16 - 4 = 12", say: "The focus (the origin) is 2 from the centre." },
          { step: 3, m: "\\frac{(x - 2)^2}{16} + \\frac{y^2}{12} = 1", say: "The same ellipse in rectangular form." }] },
        gate: true, then: "Centre $(2, 0)$, $a = 4$, $b^2 = 12$: $\\dfrac{(x - 2)^2}{16} + \\dfrac{y^2}{12} = 1$." },
      { type: "num", kicker: "Try it", prompt: "How far is the vertex of $r = \\dfrac{8}{1 + \\sin\\theta}$ from the focus (the origin)?", pre: "distance =", answer: 4, skill: "Writing polar conics", near: [{ v: 8, fb: "That is $ep$. The vertex is at $\\theta = \\frac{\\pi}{2}$, where $r = \\frac{8}{2}$." }], hints: ["$\\sin\\theta = 1$ at $\\theta = \\frac{\\pi}{2}$."], why: "$r = \\frac{8}{1 + 1} = 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Pia writes the conic with $e = \\frac{1}{2}$ and directrix $y = 5$ as $r = \\dfrac{2.5}{1 - 0.5\\sin\\theta}$. What is wrong?",
        options: [{ t: "The directrix is **above** the focus, so the sign should be plus: $1 + 0.5\\sin\\theta$" }, { t: "Nothing: it uses $\\sin\\theta$, which is right", fb: "The function is right but the sign is wrong: above means plus." }, { t: "She should use $\\cos\\theta$", fb: "A horizontal directrix uses $\\sin\\theta$." }],
        answer: 0, skill: "Writing polar conics", hints: ["Where is the line $y = 5$ relative to the origin?"], why: "$r = \\frac{2.5}{1 + 0.5\\sin\\theta}$." },
      { type: "num", kicker: "Use it", prompt: "A comet's path is $r = \\dfrac{ep}{1 - e\\cos\\theta}$. Its closest point to the Sun is 1 AU (at $\\theta = \\pi$) and its farthest is 3 AU (at $\\theta = 0$). What is $e$? (A decimal is fine.)", pre: "$e =$", answer: 0.5, tol: 0.001, calc: true, skill: "Writing polar conics", near: [{ v: 2, tol: 0.001, fb: "Divide the two equations: $\\frac{1 + e}{1 - e} = 3$." }, { v: 1.5, tol: 0.001, fb: "That is $ep$. Solve $\\frac{1 + e}{1 - e} = 3$ for $e$." }], hints: ["$\\frac{ep}{1 - e} = 3$ and $\\frac{ep}{1 + e} = 1$."], why: "Dividing, $1 + e = 3(1 - e)$, so $e = 0.5$." }
    ]
  });
  /* ================================================================ Skills */
  var GCD = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; };
  var LCM = function (a, b) { return a / GCD(a, b) * b; };
  var RD = function (v) { return Math.round(v * 1e9) / 1e9; };
  var CF = function (m) { return m === 1 ? "" : m === -1 ? "-" : String(m); };
  var GENX = " (A decimal to 2 places is fine; the box also accepts a fraction.)";
  // the bracket in (x - 3) or x: PBR("x", 3), PBR("y", -2)
  var PBR = function (n, v) { return v === 0 ? n : "(" + n + (v < 0 ? " + " + (-v) : " - " + v) + ")"; };
  // a, b, c with a^2 = b^2 + c^2 (the hypotenuse first): ellipses use (a, b, c), hyperbolas (c, a, b)
  var TRP = [[5, 3, 4], [5, 4, 3], [10, 8, 6], [10, 6, 8], [13, 12, 5], [13, 5, 12], [17, 15, 8], [17, 8, 15], [15, 12, 9], [15, 9, 12], [25, 24, 7], [25, 7, 24], [20, 16, 12], [20, 12, 16], [26, 24, 10], [26, 10, 24], [25, 20, 15], [25, 15, 20], [29, 21, 20], [29, 20, 21]];
  // the triples whose cleared-denominator forms (9x^2 + 25y^2 = 225) stay small
  var ELLSM = TRP.filter(function (T) { return LCM(T[0] * T[0], T[1] * T[1]) <= 1700; }), HYPSM = TRP.filter(function (T) { return LCM(T[1] * T[1], T[2] * T[2]) <= 1700; });
  var SKILLS = [
    { id: "pc10-ellread", title: "Reading an ellipse at the origin", lesson: 2,
      gen: function (R) {
        var t = R.int(0, 3), T = R.pick(t === 3 ? ELLSM : TRP), a = T[0], b = T[1], c = T[2], vert = R.chance(0.5), A = a * a, B = b * b, L = LCM(A, B), eq;
        if (t === 3) eq = vert ? CF(L / B) + "x^2 + " + CF(L / A) + "y^2 = " + L : CF(L / A) + "x^2 + " + CF(L / B) + "y^2 = " + L;
        else eq = vert ? FRC("x^2", B) + " + " + FRC("y^2", A) + " = 1" : FRC("x^2", A) + " + " + FRC("y^2", B) + " = 1";
        var ask = t === 1 ? ["the length of the major axis", 2 * a, "length =", [{ v: a, fb: "That is $a$, the distance from the centre. The major axis is $2a$ long." }, { v: 2 * b, fb: "That is the minor axis, $2b$." }]]
          : t === 2 ? ["the distance between the two foci", 2 * c, "distance =", [{ v: c, fb: "That is $c$, the distance from the centre to **one** focus. The foci are $2c$ apart." }, { v: 2 * a, fb: "That is the length of the major axis." }]]
          : ["the distance $c$ from the centre to each focus", c, "$c =$", [{ v: c * c, fb: "That is $c^2 = a^2 - b^2$. Take the square root." }, { v: a, fb: "That is $a$. The foci are $c = \\sqrt{a^2 - b^2}$ from the centre." }]];
        return { type: "num", prompt: "For the ellipse $" + eq + "$, find " + ask[0] + ".", pre: ask[2], answer: ask[1], near: near(ask[1], ask[3]), hints: ["Write it as $\\frac{x^2}{\\cdot} + \\frac{y^2}{\\cdot} = 1$: the larger denominator is $a^2$, and $c^2 = a^2 - b^2$."], why: "$a = " + a + "$, $b = " + b + "$, $c = " + c + "$." };
      } },
    { id: "pc10-ellwrite", title: "Writing the equation of an ellipse", lesson: 3,
      gen: function (R) {
        var T = R.pick(TRP), a = T[0], b = T[1], c = T[2], vert = R.chance(0.5), t = R.int(0, 2), P = function (v) { return vert ? "(0, \\pm " + v + ")" : "(\\pm " + v + ", 0)"; }, Q = function (v) { return vert ? "(\\pm " + v + ", 0)" : "(0, \\pm " + v + ")"; };
        if (t === 0) return { type: "num", prompt: "An ellipse has vertices $" + P(a) + "$ and foci $" + P(c) + "$. What is $b^2$?", pre: "$b^2 =$", answer: b * b,
          near: near(b * b, [{ v: b, fb: "That is $b$. The question asks for $b^2$." }, { v: a * a + c * c, fb: "For an ellipse $b^2 = a^2 - c^2$: subtract." }]), hints: ["$b^2 = a^2 - c^2$."], why: "$" + a * a + " - " + c * c + " = " + b * b + "$." };
        if (t === 1) return { type: "num", prompt: "An ellipse has co-vertices $" + Q(b) + "$ and foci $" + P(c) + "$. What is $a^2$?", pre: "$a^2 =$", answer: a * a,
          near: near(a * a, [{ v: a, fb: "That is $a$. The question asks for $a^2$." }, { v: b * b - c * c, fb: "For an ellipse $a^2 = b^2 + c^2$: add." }]), hints: ["$c^2 = a^2 - b^2$, so $a^2 = b^2 + c^2$."], why: "$" + b * b + " + " + c * c + " = " + a * a + "$." };
        return { type: "num", prompt: "The major axis of an ellipse is " + 2 * a + " long and its foci are " + 2 * c + " apart. What is $b$?", pre: "$b =$", answer: b,
          near: near(b, [{ v: b * b, fb: "That is $b^2$. Take the square root." }, { v: a, fb: "That is $a$. Use $b^2 = a^2 - c^2$." }]), hints: ["$a$ is half of the major axis and $c$ is half of the distance between the foci."], why: "$a = " + a + "$, $c = " + c + "$, so $b^2 = " + b * b + "$ and $b = " + b + "$." };
      } },
    { id: "pc10-ellhk", title: "Ellipses centred at (h, k)", lesson: 4,
      gen: function (R) {
        var T = R.pick(TRP), a = T[0], b = T[1], c = T[2], vert = R.chance(0.5), h = R.int(-6, 6), k = R.int(-6, 6), t = R.int(0, 2), sg = R.chance(0.5) ? 1 : -1;
        var A = a * a, B = b * b, eq = vert ? FRC(SQB("x", h), B) + " + " + FRC(SQB("y", k), A) + " = 1" : FRC(SQB("x", h), A) + " + " + FRC(SQB("y", k), B) + " = 1";
        if (t === 0) { var ix = R.chance(0.5); return { type: "num", prompt: "What is the " + (ix ? "$x$" : "$y$") + "-coordinate of the centre of $" + eq + "$?", pre: "$" + (ix ? "x" : "y") + " =$", answer: ix ? h : k,
          near: near(ix ? h : k, [{ v: -(ix ? h : k), fb: "Read the centre with the **opposite sign** of what is in the bracket." }, { v: ix ? k : h, fb: "That is the other coordinate." }]), hints: ["$(x - h)^2$ and $(y - k)^2$: read $h$ and $k$."], why: "The centre is $(" + h + ", " + k + ")$." }; }
        var end = t === 1 ? a : c, pos = vert ? (sg > 0 ? "top" : "bottom") : (sg > 0 ? "right-hand" : "left-hand"), what = t === 1 ? "vertex" : "focus", val = (vert ? k : h) + sg * end;
        return { type: "num", prompt: "What is the " + (vert ? "$y$" : "$x$") + "-coordinate of the " + pos + " " + what + " of $" + eq + "$?", pre: "$" + (vert ? "y" : "x") + " =$", answer: val,
          near: near(val, [{ v: (vert ? k : h) - sg * end, fb: "That is the " + what + " on the other side of the centre." }, { v: sg * end, fb: "That is the distance from the centre. Add it to the centre's coordinate." }]),
          hints: ["Find the centre and the major axis, then go " + (t === 1 ? "$a$" : "$c$") + " from the centre."], why: "$" + (vert ? k : h) + (sg > 0 ? " + " : " - ") + end + " = " + val + "$." };
      } },
    { id: "pc10-ellgen", title: "The general form of an ellipse", lesson: 5,
      gen: function (R) {
        var d1 = R.int(2, 6), d2, h = R.int(-5, 5), k = R.int(-5, 5), t = R.int(0, 2);
        do { d2 = R.int(2, 6); } while (d2 === d1);
        var D1 = d1 * d1, D2 = d2 * d2, L = LCM(D1, D2), m1 = L / D1, m2 = L / D2, eq = GENP([m1, 0, m2, -2 * m1 * h, -2 * m2 * k, m1 * h * h + m2 * k * k - L]);
        if (t === 2) return { type: "num", prompt: "Complete the squares on $" + eq + " = 0$. How long is the major axis?", pre: "length =", answer: 2 * Math.max(d1, d2),
          near: near(2 * Math.max(d1, d2), [{ v: Math.max(d1, d2), fb: "That is $a$. The major axis has length $2a$." }, { v: 2 * Math.min(d1, d2), fb: "That is the minor axis, $2b$." }]), hints: ["Write it as $\\frac{(x - h)^2}{\\cdot} + \\frac{(y - k)^2}{\\cdot} = 1$."], why: "The denominators are $" + D1 + "$ and $" + D2 + "$: $a = " + Math.max(d1, d2) + "$." };
        var ix = t === 0;
        return { type: "num", prompt: "Complete the squares on $" + eq + " = 0$. What is the " + (ix ? "$x$" : "$y$") + "-coordinate of the centre?", pre: "$" + (ix ? "x" : "y") + " =$", answer: ix ? h : k,
          near: near(ix ? h : k, [{ v: -(ix ? h : k), fb: "Check the sign: $x^2 - 2hx + h^2 = (x - h)^2$." }, { v: ix ? k : h, fb: "That is the other coordinate." }]), hints: ["Group the " + (ix ? "$x$" : "$y$") + " terms, factor out the leading coefficient and complete the square."], why: "The centre is $(" + h + ", " + k + ")$." };
      } },
    { id: "pc10-hypread", title: "Reading a hyperbola at the origin", lesson: 6,
      gen: function (R) {
        var t = R.int(0, 3), T = R.pick(t === 3 ? HYPSM : TRP), c = T[0], a = T[1], b = T[2], vert = R.chance(0.5), A = a * a, B = b * b, L = LCM(A, B), eq;
        if (t === 3) eq = vert ? "-" + CF(L / B) + "x^2 + " + CF(L / A) + "y^2 = " + L : CF(L / A) + "x^2 - " + CF(L / B) + "y^2 = " + L;
        else eq = vert ? FRC("y^2", A) + " - " + FRC("x^2", B) + " = 1" : FRC("x^2", A) + " - " + FRC("y^2", B) + " = 1";
        if (t === 2) { var sl = vert ? a / b : b / a; return { type: "num", prompt: "What is the slope of the positive asymptote of $" + eq + "$?" + GENX, pre: "slope =", answer: RD(sl), tol: 0.006, calc: true,
          near: near(RD(sl), [{ v: RD(1 / sl), tol: 0.006, fb: "That is the reciprocal. Opening " + (vert ? "up and down the slope is $\\frac{a}{b}$" : "left and right the slope is $\\frac{b}{a}$") + "." }]), hints: ["The positive term gives $a^2$; the slope is $\\frac{b}{a}$ for left-right, $\\frac{a}{b}$ for up-down."], why: "The slope is " + (vert ? a + "/" + b : b + "/" + a) + "." }; }
        var ask = t === 1 ? ["the distance between the two vertices", 2 * a, [{ v: a, fb: "That is $a$. The vertices are $2a$ apart." }, { v: 2 * c, fb: "That is the distance between the foci." }]]
          : ["the distance $c$ from the centre to each focus", c, [{ v: c * c, fb: "That is $c^2 = a^2 + b^2$. Take the square root." }, { v: a, fb: "That is $a$. For a hyperbola $c^2 = a^2 + b^2$." }]];
        return { type: "num", prompt: "For the hyperbola $" + eq + "$, find " + ask[0] + ".", pre: t === 1 ? "distance =" : "$c =$", answer: ask[1], near: near(ask[1], ask[2]), hints: ["The positive term gives $a^2$; for a hyperbola $c^2 = a^2 + b^2$."], why: "$a = " + a + "$, $b = " + b + "$, $c = " + c + "$." };
      } },
    { id: "pc10-hypwrite", title: "Writing the equation of a hyperbola", lesson: 7,
      gen: function (R) {
        var T = R.pick(TRP), c = T[0], a = T[1], b = T[2], vert = R.chance(0.5), t = R.int(0, 2), P = function (v) { return vert ? "(0, \\pm " + v + ")" : "(\\pm " + v + ", 0)"; };
        if (t === 0) return { type: "num", prompt: "A hyperbola has vertices $" + P(a) + "$ and foci $" + P(c) + "$. What is $b^2$?", pre: "$b^2 =$", answer: b * b,
          near: near(b * b, [{ v: b, fb: "That is $b$. The question asks for $b^2$." }, { v: c * c + a * a, fb: "For a hyperbola $b^2 = c^2 - a^2$: subtract." }]), hints: ["$c^2 = a^2 + b^2$."], why: "$" + c * c + " - " + a * a + " = " + b * b + "$." };
        if (t === 1) { var m = R.pick([2, 3, 4]), a2 = R.int(1, 5), bb = m * a2; return { type: "num", prompt: "A hyperbola opens left and right with vertices $(\\pm " + a2 + ", 0)$ and asymptotes $y = \\pm " + m + "x$. What is $b^2$?", pre: "$b^2 =$", answer: bb * bb,
          near: near(bb * bb, [{ v: bb, fb: "That is $b$. The question asks for $b^2$." }, { v: m * m, fb: "The slope is $\\frac{b}{a}$, so $b = m a$." }]), hints: ["Opening left and right, the asymptote slope is $\\frac{b}{a}$."], why: "$b = " + m + " \\cdot " + a2 + " = " + bb + "$." }; }
        return { type: "num", prompt: "A hyperbola has foci $" + P(c) + "$ and its vertices are " + 2 * a + " apart. What is $b$?", pre: "$b =$", answer: b,
          near: near(b, [{ v: b * b, fb: "That is $b^2$. Take the square root." }, { v: c - a, fb: "Use $b^2 = c^2 - a^2$." }]), hints: ["The vertices are $2a$ apart, so $a$ is half of that."], why: "$a = " + a + "$ and $c = " + c + "$, so $b^2 = " + b * b + "$." };
      } },
    { id: "pc10-hyphk", title: "Hyperbolas centred at (h, k)", lesson: 8,
      gen: function (R) {
        var t = R.int(0, 3), T = R.pick(t === 3 ? HYPSM : TRP), c = T[0], a = T[1], b = T[2], vert = R.chance(0.5), h = R.int(-6, 6), k = R.int(-6, 6), sg = R.chance(0.5) ? 1 : -1, A = a * a, B = b * b;
        var eq = vert ? FRC(SQB("y", k), A) + " - " + FRC(SQB("x", h), B) + " = 1" : FRC(SQB("x", h), A) + " - " + FRC(SQB("y", k), B) + " = 1";
        if (t === 0) { var ix = R.chance(0.5); return { type: "num", prompt: "What is the " + (ix ? "$x$" : "$y$") + "-coordinate of the centre of $" + eq + "$?", pre: "$" + (ix ? "x" : "y") + " =$", answer: ix ? h : k,
          near: near(ix ? h : k, [{ v: -(ix ? h : k), fb: "Read the centre with the **opposite sign** of what is in the bracket." }, { v: ix ? k : h, fb: "That is the other coordinate." }]), hints: ["$(x - h)^2$ and $(y - k)^2$: read $h$ and $k$."], why: "The centre is $(" + h + ", " + k + ")$." }; }
        if (t === 3) {
          var L = LCM(A, B), mx = L / A, my = L / B, ix2 = R.chance(0.5), cs = vert ? [-my, 0, mx, 2 * my * h, -2 * mx * k, -my * h * h + mx * k * k - L] : [mx, 0, -my, -2 * mx * h, 2 * my * k, mx * h * h - my * k * k - L];
          return { type: "num", prompt: "Complete the squares on $" + GENP(cs) + " = 0$. What is the " + (ix2 ? "$x$" : "$y$") + "-coordinate of the centre?", pre: "$" + (ix2 ? "x" : "y") + " =$", answer: ix2 ? h : k,
            near: near(ix2 ? h : k, [{ v: -(ix2 ? h : k), fb: "Check the sign: $x^2 - 2hx + h^2 = (x - h)^2$." }, { v: ix2 ? k : h, fb: "That is the other coordinate." }]), hints: ["Group the " + (ix2 ? "$x$" : "$y$") + " terms, factor out the leading coefficient and complete the square."], why: "The centre is $(" + h + ", " + k + ")$." };
        }
        var end = t === 1 ? a : c, pos = vert ? (sg > 0 ? "upper" : "lower") : (sg > 0 ? "right-hand" : "left-hand"), what = t === 1 ? "vertex" : "focus", val = (vert ? k : h) + sg * end;
        return { type: "num", prompt: "What is the " + (vert ? "$y$" : "$x$") + "-coordinate of the " + pos + " " + what + " of $" + eq + "$?", pre: "$" + (vert ? "y" : "x") + " =$", answer: val,
          near: near(val, [{ v: (vert ? k : h) - sg * end, fb: "That is the " + what + " on the other side of the centre." }, { v: sg * end, fb: "That is the distance from the centre. Add it to the centre's coordinate." }]),
          hints: ["Find the centre and which way it opens, then go " + (t === 1 ? "$a$" : "$c$") + " from the centre."], why: "$" + (vert ? k : h) + (sg > 0 ? " + " : " - ") + end + " = " + val + "$." };
      } },
    { id: "pc10-parread", title: "The parabola at the origin", lesson: 9,
      gen: function (R) {
        var p = R.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]), horiz = R.chance(0.5), t = R.int(0, 3), eq = horiz ? "y^2 = " + 4 * p + "x" : "x^2 = " + 4 * p + "y";
        if (t === 3) return { type: "num", prompt: "A parabola has its vertex at the origin and its focus at $" + (horiz ? "(" + p + ", 0)" : "(0, " + p + ")") + "$. Its equation is $" + (horiz ? "y^2" : "x^2") + " = k\\," + (horiz ? "x" : "y") + "$. What is $k$?", pre: "$k =$", answer: 4 * p,
          near: near(4 * p, [{ v: p, fb: "That is $p$. The coefficient is $4p$." }, { v: -4 * p, fb: "Check the sign: it matches the sign of the focus's coordinate." }]), hints: ["$k = 4p$."], why: "$4p = " + 4 * p + "$." };
        if (t === 2) return { type: "num", prompt: "The directrix of $" + eq + "$ is $" + (horiz ? "x" : "y") + " = d$. What is $d$?", pre: "$d =$", answer: -p,
          near: near(-p, [{ v: p, fb: "That is the focus's coordinate. The directrix is on the **other** side of the vertex." }, { v: 4 * p, fb: "That is $4p$. The directrix is $p$ away from the vertex, on the other side from the focus." }]), hints: ["$4p$ is the coefficient; the directrix is $p$ from the vertex."], why: "$p = " + p + "$, so $d = " + -p + "$." };
        var asked = t === 0 ? ["the value of $p$", p, "$p =$"] : ["the " + (horiz ? "$x$" : "$y$") + "-coordinate of the focus", p, "$" + (horiz ? "x" : "y") + " =$"];
        return { type: "num", prompt: "For the parabola $" + eq + "$, what is " + asked[0] + "?", pre: asked[2], answer: asked[1],
          near: near(asked[1], [{ v: 4 * p, fb: "That is $4p$. Divide by 4." }, { v: -p, fb: "Check the sign: a positive coefficient opens right or up." }]), hints: ["Compare with $y^2 = 4px$ or $x^2 = 4py$."], why: "$4p = " + 4 * p + "$, so $p = " + p + "$." };
      } },
    { id: "pc10-parhk", title: "Parabolas with the vertex anywhere", lesson: 10,
      gen: function (R) {
        var p = R.pick([-8, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8]), horiz = R.chance(0.5), h = R.int(-6, 6), k = R.int(-6, 6), t = R.int(0, 3);
        var eq = horiz ? SQB("y", k) + " = " + 4 * p + PBR("x", h) : SQB("x", h) + " = " + 4 * p + PBR("y", k);
        if (t === 3) {
          var gen = horiz ? GENP([0, 0, 1, -4 * p, -2 * k, k * k + 4 * p * h]) : GENP([1, 0, 0, -2 * h, -4 * p, h * h + 4 * p * k]), askK = R.chance(0.5), nmv = horiz ? (askK ? "y" : "x") : (askK ? "y" : "x"), val = askK ? k : h;
          return { type: "num", prompt: "Complete the square on $" + gen + " = 0$. What is the $" + nmv + "$-coordinate of the vertex?", pre: "$" + nmv + " =$", answer: val,
            near: near(val, [{ v: -val, fb: "Check the sign: $y^2 - 2ky + k^2 = (y - k)^2$." }, { v: askK ? h : k, fb: "That is the other coordinate." }]), hints: ["Isolate the squared variable's terms, complete the square, and factor the other side."], why: "The vertex is $(" + h + ", " + k + ")$." };
        }
        if (t === 0) { var ix = R.chance(0.5); return { type: "num", prompt: "What is the " + (ix ? "$x$" : "$y$") + "-coordinate of the vertex of $" + eq + "$?", pre: "$" + (ix ? "x" : "y") + " =$", answer: ix ? h : k,
          near: near(ix ? h : k, [{ v: -(ix ? h : k), fb: "Read the vertex with the **opposite sign** of what is in the bracket." }, { v: ix ? k : h, fb: "That is the other coordinate." }]), hints: ["$(x - h)^2 = 4p(y - k)$: read $h$ and $k$."], why: "The vertex is $(" + h + ", " + k + ")$." }; }
        var focus = t === 1, val2 = focus ? (horiz ? h + p : k + p) : (horiz ? h - p : k - p);
        return { type: "num", prompt: "For $" + eq + "$, what is the " + (focus ? (horiz ? "$x$-coordinate of the focus" : "$y$-coordinate of the focus") : (horiz ? "number $d$ in the directrix $x = d$" : "number $d$ in the directrix $y = d$")) + "?", pre: focus ? "$" + (horiz ? "x" : "y") + " =$" : "$d =$", answer: val2,
          near: near(val2, [{ v: focus ? (horiz ? h - p : k - p) : (horiz ? h + p : k + p), fb: focus ? "That is the directrix's value. The focus is on the side the parabola opens towards." : "That is the focus's coordinate. The directrix is on the other side." }, { v: p, fb: "That is $p$. Measure from the vertex." }]),
          hints: ["Find the vertex and $p$ (the coefficient divided by 4), then go $p$ from the vertex along the axis."], why: "$p = " + p + "$, vertex $(" + h + ", " + k + ")$: " + val2 + "." };
      } },
    { id: "pc10-disc", title: "Which conic is it?", lesson: 11,
      gen: function (R) {
        var kind = R.pick(["ell", "par", "hyp"]), t = R.int(0, 1), A, B, C, D = 0, E = 0, F = 0;
        if (kind === "ell") { do { A = R.int(1, 6); C = R.int(1, 6); B = R.int(-6, 6); } while (B * B >= 4 * A * C); F = -R.int(2, 12); }
        else if (kind === "par") { var a1 = R.int(1, 3), c1 = R.int(1, 3), k1 = R.pick([1, 2]), sB = R.chance(0.5) ? 1 : -1; A = k1 * a1 * a1; C = k1 * c1 * c1; B = sB * 2 * k1 * a1 * c1; D = R.nz(-5, 5); F = R.int(-6, 6); }
        else { do { A = R.nz(-5, 5); C = R.nz(-5, 5); B = R.int(-6, 6); } while (B * B <= 4 * A * C); F = R.nz(-9, 9); }
        var eq = GENP([A, B, C, D, E, F]), disc = B * B - 4 * A * C;
        if (t === 1) return { type: "num", prompt: "Work out $B^2 - 4AC$ for $" + eq + " = 0$.", pre: "value =", answer: disc,
          near: near(disc, [{ v: B * B + 4 * A * C, fb: "It is $B^2$ **minus** $4AC$." }, { v: -disc, fb: "The order is $B^2 - 4AC$." }, { v: B * B, fb: "Do not forget $-4AC$." }]), hints: ["$A$, $B$, $C$ are the coefficients of $x^2$, $xy$, $y^2$."], why: "$B^2 - 4AC = " + disc + "$." };
        var names = { ell: "An ellipse", par: "A parabola", hyp: "A hyperbola" };
        return mc(R, { prompt: "Which conic is $" + eq + " = 0$?", right: names[kind], wrong: ["ell", "par", "hyp"].filter(function (x) { return x !== kind; }).map(function (x) { return { t: names[x], fb: "Work out $B^2 - 4AC$: negative is an ellipse, zero a parabola, positive a hyperbola. Here it is $" + disc + "$." }; }), keep: true, hints: ["Find $B^2 - 4AC$."], why: "$B^2 - 4AC = " + disc + "$: " + names[kind].toLowerCase() + "." });
      } },
    { id: "pc10-rotate", title: "Rotating the axes", lesson: 12,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0) { var A = R.int(2, 9), m = R.int(1, A - 1), N = R.int(2, 6) * 4, ix = R.chance(0.5); return { type: "num", prompt: "Rotating the axes by $45^\\circ$ turns $" + GENP([A, 2 * m, A, 0, 0, -N]) + " = 0$ into $px'^2 + qy'^2 = " + N + "$. What is $" + (ix ? "p" : "q") + "$?", pre: "$" + (ix ? "p" : "q") + " =$", answer: ix ? A + m : A - m,
          near: near(ix ? A + m : A - m, [{ v: ix ? A - m : A + m, fb: "That is the other coefficient. $xy = \\frac{x'^2 - y'^2}{2}$, so $x'^2$ gets $+\\frac{B}{2}$ and $y'^2$ gets $-\\frac{B}{2}$." }, { v: A, fb: "Add the contribution of the $xy$ term: $\\pm\\frac{B}{2}$." }]), hints: ["$x^2 + y^2 = x'^2 + y'^2$ and $xy = \\frac{x'^2 - y'^2}{2}$."], why: "$x'^2$: $" + A + " + " + m + "$; $y'^2$: $" + A + " - " + m + "$." }; }
        if (t === 1) { var kk = R.int(1, 12); return { type: "num", prompt: "After rotating by $45^\\circ$, the hyperbola $xy = " + kk + "$ becomes $\\dfrac{x'^2}{n} - \\dfrac{y'^2}{n} = 1$. What is $n$?", pre: "$n =$", answer: 2 * kk,
          near: near(2 * kk, [{ v: kk, fb: "$xy = \\frac{x'^2 - y'^2}{2}$, so $x'^2 - y'^2 = 2 \\cdot " + kk + "$." }, { v: kk / 2, tol: 0.001, fb: "Multiply by 2, do not divide." }]), hints: ["$xy = \\frac{x'^2 - y'^2}{2}$."], why: "$x'^2 - y'^2 = " + 2 * kk + "$, so $n = " + 2 * kk + "$." }; }
        if (t === 2) { var Tt = R.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]), sw = R.chance(0.5), u = sw ? Tt[1] : Tt[0], v = sw ? Tt[0] : Tt[1], cs = RD(u / Tt[2]);
          return { type: "num", prompt: "If $\\cot 2\\theta = \\dfrac{" + u + "}{" + v + "}$ and $2\\theta$ is acute, what is $\\cos 2\\theta$?" + GENX, pre: "$\\cos 2\\theta =$", answer: cs, tol: 0.006, calc: true,
            near: near(cs, [{ v: RD(v / Tt[2]), tol: 0.006, fb: "That is $\\sin 2\\theta$. $\\cot = \\frac{\\cos}{\\sin}$, so $\\cos$ goes with the " + u + " side." }, { v: RD(u / v), tol: 0.006, fb: "That is the cotangent itself. $\\cos 2\\theta = \\frac{" + u + "}{\\sqrt{" + u + "^2 + " + v + "^2}}$." }]), hints: ["Draw a right triangle with legs $" + u + "$ and $" + v + "$; find the hypotenuse."], why: "The hypotenuse is $" + Tt[2] + "$, so $\\cos 2\\theta = \\frac{" + u + "}{" + Tt[2] + "}$." }; }
        var same = R.chance(0.5), Aa = R.int(2, 8), Bb = R.int(1, 6), Cc = same ? Aa : Aa - Bb, ang = same ? 45 : 22.5;
        return { type: "num", prompt: "To remove the $xy$ term from $" + GENP([Aa, Bb, Cc, 0, 0, -10]) + " = 0$, rotate the axes by the acute angle $\\theta$ with $\\cot 2\\theta = \\dfrac{A - C}{B}$. What is $\\theta$, in degrees?", pre: "$\\theta =$", post: "degrees", answer: ang, tol: 0.01,
          near: near(ang, [{ v: 2 * ang, tol: 0.01, fb: "That is $2\\theta$. Halve it." }, { v: 90 - ang, tol: 0.01, fb: "Check the angle: $\\cot 2\\theta = \\frac{A - C}{B}$ with $2\\theta$ acute." }]), hints: ["Work out $\\frac{A - C}{B}$: which angle has that cotangent?"], why: "$\\frac{A - C}{B} = " + (same ? 0 : 1) + "$, so $2\\theta = " + 2 * ang + "^\\circ$ and $\\theta = " + ang + "^\\circ$." };
      } },
    { id: "pc10-polconic", title: "Conics in polar form", lesson: 13,
      gen: function (R) {
        var ES = [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [4, 5], [1, 1], [3, 2], [2, 1], [3, 1], [5, 4], [5, 2]], ef = R.pick(ES), u = ef[0], v = ef[1], e = u / v, p = R.int(1, 8), mult = R.int(1, 2), D = v * mult, Ec = u * mult, N = u * p * mult, sg = R.chance(0.5) ? 1 : -1, trig = R.chance(0.5) ? "cos" : "sin";
        var den = D + (sg > 0 ? " + " : " - ") + (Ec === 1 ? "" : Ec) + "\\" + trig + "\\theta", eq = "r = \\dfrac{" + N + "}{" + den + "}", t = R.int(0, 3), kind = e < 1 ? "An ellipse" : e === 1 ? "A parabola" : "A hyperbola";
        if (t === 0) return { type: "num", prompt: "Find the eccentricity $e$ of $" + eq + "$." + GENX, pre: "$e =$", answer: RD(e), tol: 0.006, calc: true,
          near: near(RD(e), [{ v: RD(Ec), tol: 0.006, fb: "That is the coefficient before dividing so the denominator starts with 1." }, { v: RD(v / u), tol: 0.006, fb: "Divide the coefficient by the constant, not the other way round." }]), hints: ["Divide top and bottom so the first term of the denominator is 1."], why: "Dividing by " + D + ": $e = \\frac{" + Ec + "}{" + D + "}$." };
        if (t === 1) return mc(R, { prompt: "What kind of conic is $" + eq + "$?", right: kind, wrong: ["An ellipse", "A parabola", "A hyperbola"].filter(function (x) { return x !== kind; }).map(function (x) { return { t: x, fb: "Make the denominator start with 1, read $e$: below 1 is an ellipse, 1 a parabola, above 1 a hyperbola." }; }), keep: true, hints: ["Find $e$ after dividing so the denominator starts with 1."], why: "$e = " + RD(e) + "$: " + kind.toLowerCase() + "." });
        if (t === 2) { var pp = N / Ec; return { type: "num", prompt: "The conic $" + eq + "$ has a " + (trig === "cos" ? "vertical" : "horizontal") + " directrix. How far is the directrix from the focus (the origin)?" + GENX, pre: "distance =", answer: RD(pp), tol: 0.006, calc: true,
          near: near(RD(pp), [{ v: N, tol: 0.006, fb: "That is the numerator, which is $ep$ only after the denominator starts with 1." }, { v: RD(N / D), tol: 0.006, fb: "That is $ep$. Divide by $e$ to get $p$." }]), hints: ["$ep$ is the numerator once the denominator starts with 1; then $p = \\frac{ep}{e}$."], why: "$p = " + RD(pp) + "$." }; }
        var th = sg > 0 ? (trig === "cos" ? 0 : 90) : (trig === "cos" ? 180 : 270), dv = D + Ec, alt = D - Ec;
        return { type: "num", prompt: "For $" + eq + "$, what is $r$ when $\\theta = " + th + "^\\circ$?" + GENX, pre: "$r =$", answer: RD(N / dv), tol: 0.006, calc: true,
          near: near(RD(N / dv), alt !== 0 ? [{ v: RD(N / alt), tol: 0.006, fb: "Check the sign of the $" + trig + "$ term at this angle." }] : []), hints: ["Put the value of $\\" + trig + "\\theta$ into the denominator."], why: "$r = \\frac{" + N + "}{" + dv + "}$." };
      } },
    { id: "pc10-polwrite", title: "Writing polar conics", lesson: 14,
      gen: function (R) {
        var ES = [[1, 2], [1, 3], [2, 3], [3, 4], [1, 1], [3, 2], [2, 1], [3, 1], [5, 4]], ef = R.pick(ES), u = ef[0], v = ef[1], p = v * R.int(1, 4), e = u / v, ep = u * p / v, sg = R.chance(0.5) ? 1 : -1, trig = R.chance(0.5) ? "cos" : "sin", t = R.int(0, 2);
        var dir = trig === "cos" ? (sg > 0 ? "$x = " + p + "$" : "$x = -" + p + "$") : (sg > 0 ? "$y = " + p + "$" : "$y = -" + p + "$"), eTex = u === v ? "1" : "\\frac{" + u + "}{" + v + "}", eCo = u === v ? "" : "\\frac{" + u + "}{" + v + "}";
        if (t === 2 && u >= v) t = 0;
        if (t === 0) return { type: "num", prompt: "A conic has focus at the origin, eccentricity $e = " + eTex + "$ and directrix " + dir + ". Its equation is $r = \\dfrac{N}{1 " + (sg > 0 ? "+" : "-") + " " + eCo + "\\" + trig + "\\theta}$. What is $N$?" + GENX, pre: "$N =$", answer: RD(ep), tol: 0.006, calc: true,
          near: near(RD(ep), [{ v: p, tol: 0.006, fb: "That is $p$. The numerator is $ep$." }, { v: RD(p / e), tol: 0.006, fb: "Multiply: $N = e \\cdot p$." }]), hints: ["$N = ep$, where $p$ is the distance from the focus to the directrix."], why: "$ep = " + RD(ep) + "$." };
        if (t === 1) {
          var mk = function (n, s, tr) { return "r = \\dfrac{" + n + "}{1 " + (s > 0 ? "+" : "-") + " " + eCo + "\\" + tr + "\\theta}"; }, other = trig === "cos" ? "sin" : "cos";
          return mc(R, { prompt: "Which equation describes the conic with focus at the origin, $e = " + eTex + "$ and directrix " + dir + "?", right: "$" + mk(RD(ep), sg, trig) + "$", wrong: [{ t: "$" + mk(RD(ep), -sg, trig) + "$", fb: "Check the sign: the directrix is " + (sg > 0 ? "to the right of or above" : "to the left of or below") + " the focus, so it is " + (sg > 0 ? "plus" : "minus") + "." }, { t: "$" + mk(RD(ep), sg, other) + "$", fb: "A " + (trig === "cos" ? "vertical" : "horizontal") + " directrix goes with $\\" + trig + "\\theta$." }, { t: "$" + mk(p, sg, trig) + "$", fb: "The numerator is $ep$, not $p$." }], keep: true, hints: ["Function from the direction of the directrix, sign from which side it is on, numerator $ep$."], why: "$ep = " + RD(ep) + "$." });
        }
        var far = R.chance(0.5), rr = far ? ep / (1 - e) : ep / (1 + e);
        return { type: "num", prompt: "The ellipse $r = \\dfrac{" + RD(ep) + "}{1 - " + eCo + "\\cos\\theta}$ has its focus at the origin. How far is its " + (far ? "farthest" : "nearest") + " point from the focus?" + GENX, pre: "distance =", answer: RD(rr), tol: 0.006, calc: true,
          near: near(RD(rr), [{ v: RD(far ? ep / (1 + e) : ep / (1 - e)), tol: 0.006, fb: "That is the " + (far ? "nearest" : "farthest") + " point." }, { v: RD(ep), tol: 0.006, fb: "That is the numerator. Divide by $1 \\mp e$." }]), hints: ["The distance is largest where the denominator is smallest."], why: "$r = \\frac{" + RD(ep) + "}{1 " + (far ? "-" : "+") + " " + RD(e) + "} = " + RD(rr) + "$." };
      } }
  ];
  L.unit("precalc", 10, {
    title: "Analytic Geometry",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Reading and writing the equation of an ellipse centred at the origin.", skills: ["pc10-ellread", "pc10-ellwrite"], per: 3 },
      { title: "Quiz 2", after: 5, blurb: "Ellipses centred anywhere, and the general form.", skills: ["pc10-ellhk", "pc10-ellgen"], per: 3 },
      { title: "Quiz 3", after: 8, blurb: "Hyperbolas: reading, writing and centred anywhere.", skills: ["pc10-hypread", "pc10-hypwrite", "pc10-hyphk"], per: 2 },
      { title: "Quiz 4", after: 10, blurb: "Parabolas: focus, directrix and vertex.", skills: ["pc10-parread", "pc10-parhk"], per: 3 },
      { title: "Quiz 5", after: 12, blurb: "Naming a conic and rotating the axes.", skills: ["pc10-disc", "pc10-rotate"], per: 3 },
      { title: "Quiz 6", after: 14, blurb: "Conics in polar form.", skills: ["pc10-polconic", "pc10-polwrite"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:10", {
    2: { name: "The ellipse at the origin", frame: "In $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ the larger denominator is [[$a^2$]], and its variable names the [[major axis]]. The foci are $c$ from the centre, where $c^2 =$ [[$a^2 - b^2$]].",
         chips: ["$a^2 + b^2$", "minor axis"], fb: { "$a^2 + b^2$": "That is the hyperbola's rule. For an ellipse $c^2 = a^2 - b^2$, so the foci are inside the vertices.", "minor axis": "The larger denominator names the **major** (long) axis." } },
    3: { name: "Writing an ellipse", frame: "Find $a$ from a [[vertex]] and $c$ from a [[focus]], then $b^2 =$ [[$a^2 - c^2$]]. Put $a^2$ under the variable of the major axis.",
         chips: ["co-vertex", "$a^2 + c^2$"], fb: { "co-vertex": "A co-vertex gives $b$. The vertex gives $a$.", "$a^2 + c^2$": "For an ellipse $b^2 = a^2 - c^2$: subtract." } },
    4: { name: "Ellipses centred at (h, k)", frame: "$\\frac{(x - h)^2}{a^2} + \\frac{(y - k)^2}{b^2} = 1$ has centre [[$(h, k)$]]: read the signs [[opposite]] to the brackets. Vertices and foci are measured from the [[centre]].",
         chips: ["$(-h, -k)$", "origin"], fb: { "$(-h, -k)$": "$(x - h)$ already has the minus sign: the centre is $(h, k)$.", "origin": "After the shift the vertices and foci move with the centre, so measure from it." } },
    5: { name: "The general form of an ellipse", frame: "[[Group]] the $x$ terms and the $y$ terms, [[complete the square]] in each (adding the same to the right, times any factor outside), then [[divide]] so the right side is 1.",
         chips: ["expand", "subtract"], fb: { "expand": "We go the other way: from the expanded general form back to the standard form.", "subtract": "We divide both sides so the right side becomes 1." } },
    6: { name: "Reading a hyperbola", frame: "In $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$ the [[positive]] term gives $a^2$ and sets the direction it opens. For a hyperbola $c^2 =$ [[$a^2 + b^2$]], and the asymptotes are $y = \\pm\\frac{b}{a}x$, or $\\pm$ [[$\\frac{a}{b}$]] when it opens up and down.",
         chips: ["$a^2 - b^2$", "larger"], fb: { "$a^2 - b^2$": "That is the ellipse's rule. For a hyperbola the foci are **beyond** the vertices: $c^2 = a^2 + b^2$.", "larger": "For a hyperbola the sign decides, not the size of the denominator." } },
    7: { name: "Writing a hyperbola", frame: "$b^2 =$ [[$c^2 - a^2$]], because the foci of a hyperbola are [[beyond]] the vertices. Put $a^2$ under the [[positive]] term, joined to the other by a minus sign.",
         chips: ["$a^2 - c^2$", "inside"], fb: { "$a^2 - c^2$": "That would be negative: for a hyperbola $c > a$, so $b^2 = c^2 - a^2$.", "inside": "The foci of a hyperbola lie beyond the vertices, since $c^2 = a^2 + b^2$." } },
    8: { name: "Hyperbolas centred at (h, k)", frame: "The centre is [[$(h, k)$]]. Vertices and foci are $a$ and $c$ from it along the axis, and the asymptotes pass through the [[centre]]. For the general form, [[complete the square]] first.",
         chips: ["origin", "factor"], fb: { "origin": "After a shift the asymptotes cross at the new centre.", "factor": "Complete the square in $x$ and in $y$, as for the ellipse." } },
    9: { name: "The parabola", frame: "Every point of a parabola is as far from the [[focus]] as from the [[directrix]]. $y^2 = 4px$ opens sideways and $x^2 = 4py$ [[up or down]]; the focus is $p$ from the vertex.",
         chips: ["vertex", "asymptote"], fb: { "vertex": "Distances are measured to the focus and the directrix, not the vertex.", "asymptote": "A parabola has no asymptotes: that is the hyperbola." } },
    10: { name: "Parabolas with the vertex anywhere", frame: "$(x - h)^2 = 4p(y - k)$ has vertex [[$(h, k)$]]. The focus is $p$ from the vertex along the axis, and the directrix is [[$p$]] away on the other side. For the general form, [[complete the square]] on the squared variable.",
         chips: ["$4p$", "factor"], fb: { "$4p$": "The directrix is $p$ from the vertex, not $4p$.", "factor": "Complete the square on the squared variable, then factor the other side." } },
    11: { name: "Which conic is it?", frame: "For $Ax^2 + Bxy + Cy^2 + \\dots = 0$ look at $B^2 - 4AC$: [[negative]] is an ellipse, [[zero]] a parabola and [[positive]] a hyperbola.",
         chips: ["$A + C$", "one"], fb: { "$A + C$": "The test uses $B^2 - 4AC$ only.", "one": "The sign of $B^2 - 4AC$ decides: negative, zero or positive." } },
    12: { name: "Rotating the axes", frame: "Rotate by $\\theta$ with $\\cot 2\\theta =$ [[$\\frac{A - C}{B}$]]. Then $x = x'\\cos\\theta - y'\\sin\\theta$ and $y = x'\\sin\\theta + y'\\cos\\theta$, and the [[$x'y'$]] term disappears.",
         chips: ["$\\frac{A + C}{B}$", "$x'^2$"], fb: { "$\\frac{A + C}{B}$": "It is the difference $A - C$.", "$x'^2$": "The rotation removes the cross term $x'y'$." } },
    13: { name: "Conics in polar form", frame: "In $r = \\frac{ep}{1 \\pm e\\cos\\theta}$ first make the denominator start with [[1]]. Then $e < 1$ is an [[ellipse]], $e = 1$ a [[parabola]] and $e > 1$ a hyperbola.",
         chips: ["circle", "0"], fb: { "circle": "A circle has $e = 0$; here we compare with 1.", "0": "The denominator should start with 1, so $e$ can be read." } },
    14: { name: "Writing polar conics", frame: "A vertical directrix uses [[$\\cos\\theta$]] and a horizontal one [[$\\sin\\theta$]]. A directrix right of or above the focus gives a [[plus]]; left of or below, a minus. The numerator is [[$ep$]].",
         chips: ["$p$", "$\\tan\\theta$"], fb: { "$p$": "The numerator is $ep$: the eccentricity times the distance.", "$\\tan\\theta$": "The standard forms use $\\cos\\theta$ or $\\sin\\theta$." } }
  });
})();
