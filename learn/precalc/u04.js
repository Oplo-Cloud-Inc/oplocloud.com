/* ==========================================================================
   Precalculus — Unit 4: Exponential and Logarithmic Functions. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 4: exponential functions and
   their graphs, compound interest and the number e, logarithms with their
   graphs and properties, solving exponential and logarithmic equations,
   models of growth and decay, and fitting models to data. Each section is
   split into lessons small enough to finish in one sitting; each teaches
   one method: the idea, an example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built
   at the end.

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
    blurb: "Before Chapter 4 · Add exponents, use negative exponents, turn a percent into a multiplier, solve a linear equation, and follow the order of operations.",
    mins: 6, v: 1,
    steps: [
      { type: "choice", kicker: "Check 1 · Add exponents", prompt: "Simplify $x^3 \\cdot x^4$.",
        options: [{ t: "$x^7$" }, { t: "$x^{12}$", fb: "When you multiply powers of one base, you **add** the exponents: $3 + 4$." }, { t: "$2x^7$", fb: "There is no 2: the base $x$ appears seven times in all." }],
        answer: 0, skill: "Exponent rules", hints: ["$x \\cdot x \\cdot x$ times $x \\cdot x \\cdot x \\cdot x$."], why: "$x^{3+4} = x^7$." },
      { type: "choice", kicker: "Check 2 · Negative exponents", prompt: "Evaluate $5^{-2}$.",
        options: [{ t: "$\\frac{1}{25}$" }, { t: "$-25$", fb: "A negative exponent does not make the number negative: it flips the power to the bottom." }, { t: "$-10$", fb: "$5^{-2}$ is not $5 \\cdot (-2)$." }],
        answer: 0, skill: "Negative exponents", hints: ["$5^{-2} = \\frac{1}{5^2}$."], why: "$\\frac{1}{5^2} = \\frac{1}{25}$." },
      { type: "num", kicker: "Check 3 · Percent as a multiplier", prompt: "A price rises by 6%. By what number do you multiply the old price to get the new price?", answer: 1.06, skill: "Percent change",
        near: [{ v: 0.06, fb: "0.06 is only the increase. The new price is the old price **plus** 6% of it: $1 + 0.06$." }], hints: ["New = old + 0.06 × old."], why: "$1 + 0.06 = 1.06$." },
      { type: "num", kicker: "Check 4 · Solve", prompt: "Solve $3x - 5 = 16$.", pre: "$x =$", answer: 7, skill: "Linear equations",
        near: [{ v: 3.67, tol: 0.01, fb: "Add 5 first: $3x = 21$." }], hints: ["Add 5 to both sides, then divide by 3."], why: "$3x = 21$, so $x = 7$." },
      { type: "num", kicker: "Check 5 · Order of operations", prompt: "Evaluate $3 \\cdot 2^3$.", answer: 24, skill: "Order of operations",
        near: [{ v: 216, fb: "The power applies to the 2 only: $2^3 = 8$ first, then $3 \\cdot 8$." }], hints: ["Powers come before multiplying."], why: "$3 \\cdot 8 = 24$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 4.1**. If **check 1 or 2** slipped, look again at the exponent rules in Algebra I. If **check 3** slipped, lesson 4.1 starts with it.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= helpers for Chapter 4 */
  var KEYS_EXP = [["$x$", "x"], ["^", "^"], ["$($", "("], ["$)$", ")"], ["$\\cdot$", "*"], ["$+$", "+"], ["$-$", "-"]];
  var EXPF = function (a, b) { return function (x) { return a * Math.pow(b, x); }; };
  var LOGF = function (b) { return function (x) { return x > 0 ? Math.log(x) / Math.log(b) : NaN; }; };
  var f4 = function (v, d) { var k = Math.pow(10, d == null ? 2 : d); return Math.round(v * k) / k; };

  /* ============================================ 1 · Exponential growth: multiplying again and again */
  var HOW_1 = [["Divide", "Divide each output by the one before it."],
               ["Same ratio?", "If the ratios match, the output is multiplied by a fixed factor each step."],
               ["Write it", "The start is $a$, the ratio is $b$: $f(x) = a \\cdot b^x$."]];
  var A1 = function (n) { return 1 + 3 * n; }, B1 = function (n) { return Math.pow(2, n); };
  var G1 = grid("The graph of 3 times 2 to the x, through (0, 3), (1, 6), (2, 12) and (3, 24).",
    curve(EXPF(3, 2), 0, 3.4, "blue", [0, 28]).concat([dot(0, 3, "orange"), dot(1, 6, "blue"), dot(2, 12, "blue"), dot(3, 24, "blue")]),
    { x: [-1, 4], y: [0, 28], u: 34, uy: 8, gy: 4, stepY: 4 });
  var G1b = grid("The graph of 80 times one half to the x, falling through (0, 80), (1, 40), (2, 20) and (3, 10).",
    curve(EXPF(80, 0.5), -0.5, 4.4, "blue", [0, 100]).concat([dot(0, 80, "orange"), dot(1, 40, "blue"), dot(2, 20, "blue"), dot(3, 10, "blue")]),
    { x: [-1, 5], y: [0, 100], u: 34, uy: 3.2, gy: 10 });
  LESSONS.push({
    title: "Exponential growth: multiplying again and again", art: "pcexp",
    blurb: "Book 4.1 · Some things grow by adding the same amount. Others grow by multiplying by the same factor.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Start at 3 and **double** it three times. Where do you finish?", answer: 24, skill: "Repeated multiplication",
        near: [{ v: 9, fb: "That adds 2 three times. Doubling is multiplying: $3 \\cdot 2 \\cdot 2 \\cdot 2$." }], hints: ["3, then 6, then 12, then…"], why: "$3 \\to 6 \\to 12 \\to 24$." },
      { type: "learn", kicker: "Explore",
        prompt: "Plan A (green) **adds 3** each step. Plan B (blue) **doubles** each step. Both start at 1. Slide $n$ to find the step where B first **overtakes** A, then slide on to step 6.",
        scene: { type: "sketch", x: [0, 7], y: [0, 40], u: 30, uy: 7, gy: 5, stepY: 5, gate: true, pts: {},
          params: { n: { min: 0, max: 6, step: 1, v: 0, label: "$n$" } },
          track: function (s) { return s.p.n === 4 ? "catch" : s.p.n === 6 ? "far" : null; },
          draw: function (s) {
            var n = s.p.n, it = [{ seg: [[0, 1], [7, 22]], c: "green" }].concat(curve(B1, 0, 7, "blue", [0, 40]));
            it.push({ seg: [[n, 0], [n, Math.min(40, Math.max(A1(n), B1(n)))]], c: "soft", dash: true }, { pt: [n, A1(n)], c: "green" });
            if (B1(n) <= 40) it.push({ pt: [n, B1(n)], c: "blue" });
            return it;
          },
          readout: function (s) { var n = s.p.n; return "step $n = " + n + "$: A $= " + A1(n) + "$ &nbsp; B $= " + B1(n) + "$" + (B1(n) > A1(n) ? " — **B is ahead**" : B1(n) === A1(n) ? "" : " — A is ahead") + "<br>Found the overtake: " + (s.tracked.catch ? "✓" : "—") + " · pushed on to step 6: " + (s.tracked.far ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.catch && s.tracked.far); } },
        gate: true, then: "At step 4 the doubling plan pulls ahead, and then it **runs away**. Adding the same amount each step is **linear**. **Multiplying** by the same factor each step is **exponential**." },
      { type: "learn", kicker: "The idea",
        prompt: "An **exponential function** multiplies by the same factor each time $x$ goes up by 1: $f(x) = a \\cdot b^x$. The start $a$ is the output at $x = 0$. The **growth factor** $b$ is positive: $b > 1$ grows, $0 < b < 1$ **decays**. To test a table, divide each output by the one before.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Is this table exponential? If so, write $f(x)$.", art: tbl(["$x$", "$f(x)$"], [[0, 3], [1, 6], [2, 12], [3, 24]]),
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\frac{6}{3} = 2", say: "Divide each output by the one before it. The first ratio is 2." },
          { step: 1, m: "\\frac{12}{6} = 2 \\quad \\frac{24}{12} = 2", say: "And the next two: always 2. Each step **multiplies** by 2.", ask: { prompt: "What is the growth factor $b$?", answer: 0, options: [{ t: "$2$" }, { t: "$3$", fb: "3 is where the table starts. The ratio is 2." }] } },
          { step: 2, m: "b = 2 \\qquad a = f(0) = 3", say: "The ratio is $b$. The output at $x = 0$ is the start $a$." },
          { step: 3, m: "f(x) = 3 \\cdot 2^x", say: "Check: $f(3) = 3 \\cdot 8 = 24$.", fig: G1 }] },
        gate: true, then: "$f(x) = 3 \\cdot 2^x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do this table.", art: tbl(["$x$", "$f(x)$"], [[0, 5], [1, 15], [2, 45], [3, 135]]),
        how: HOW_1, skill: "Exponential functions",
        steps: [
          { step: 1, ask: "$15 \\div 5 =$", type: "num", answer: 3, near: [{ v: 10, fb: "That subtracts. Divide: 15 ÷ 5." }], hint: "How many 5s in 15?", m: "\\frac{15}{5} = 3", say: "The first ratio." },
          { step: 2, ask: "$\\frac{45}{15}$ and $\\frac{135}{45}$ are…", type: "choice", answer: 0, options: [{ t: "also 3: the same each time" }, { t: "different from 3", fb: "$45 \\div 15 = 3$ and $135 \\div 45 = 3$." }], m: "3,\\ 3,\\ 3", say: "A constant ratio: it is exponential." },
          { step: 3, ask: "The start is $f(0) = 5$ and $b = 3$. Which is $f(x)$?", type: "choice", answer: 0, options: [{ t: "$5 \\cdot 3^x$" }, { t: "$3 \\cdot 5^x$", fb: "The start $5$ is the number in front. The ratio $3$ is the base of the power." }, { t: "$5 \\cdot x^3$", fb: "$x$ must be in the exponent for an exponential function." }], m: "f(x) = 5 \\cdot 3^x", say: "Start 5, ratio 3." }],
        why: "Divide, check the ratio, write $a \\cdot b^x$." },
      { type: "sort", kicker: "On your own", prompt: "Each row of numbers goes up by one step at a time. Is it linear, exponential or neither?",
        bins: ["Linear (adds)", "Exponential (multiplies)", "Neither"],
        cards: [{ t: "$2,\\ 4,\\ 6,\\ 8,\\ 10$", bin: 0, fb: "It adds 2 each time." }, { t: "$2,\\ 6,\\ 18,\\ 54$", bin: 1, fb: "It multiplies by 3 each time." }, { t: "$64,\\ 32,\\ 16,\\ 8$", bin: 1, fb: "It multiplies by $\\frac{1}{2}$ each time." }, { t: "$1,\\ 4,\\ 9,\\ 16$", bin: 2, fb: "Neither the differences (3, 5, 7) nor the ratios stay the same." }, { t: "$10,\\ 7,\\ 4,\\ 1$", bin: 0, fb: "It subtracts 3 each time." }, { t: "$1,\\ 2,\\ 4,\\ 7$", bin: 2, fb: "The differences are 1, 2, 3 and the ratios are 2, 2, 1.75." }],
        skill: "Exponential functions", hints: ["Subtract neighbours, then divide neighbours."], why: "Constant differences: linear. Constant ratios: exponential." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Decay.** When the ratio is **less than 1**, the outputs shrink. Write $f(x)$ for the table $80,\\ 40,\\ 20,\\ 10$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\frac{40}{80} = \\frac{1}{2}", say: "The first ratio is less than 1." },
          { step: 1, m: "\\frac{20}{40} = \\frac{10}{20} = \\frac{1}{2}", say: "The same every time.", ask: { prompt: "Growth or decay?", answer: 0, options: [{ t: "Decay: each step keeps half" }, { t: "Growth", fb: "The outputs are getting smaller." }] } },
          { step: 2, m: "b = \\tfrac{1}{2} \\qquad a = 80", say: "The ratio is $b$, and the output at $x = 0$ is $a$." },
          { step: 3, m: "f(x) = 80\\left(\\tfrac{1}{2}\\right)^x", say: "A decay curve: it falls towards 0 but never reaches it.", fig: G1b }] },
        gate: true, then: "$0 < b < 1$ means **decay**." },
      { type: "num", kicker: "Try it", prompt: "$f(x) = 4 \\cdot 3^x$. Find $f(3)$.", pre: "$f(3) =$", answer: 108, skill: "Exponential functions",
        near: [{ v: 1728, fb: "The power applies to the 3 only: $3^3 = 27$ first, then $4 \\cdot 27$." }], hints: ["Power first, then multiply."], why: "$4 \\cdot 27 = 108$." },
      { type: "choice", kicker: "Find the error",
        prompt: "$f(x) = 3 \\cdot 2^x$. Lee says $f(2) = 6^2 = 36$. What went wrong?",
        options: [{ t: "The power belongs to the 2 only: $3 \\cdot 2^2 = 3 \\cdot 4 = 12$." }, { t: "Nothing is wrong.", fb: "Check with the table: $f(2) = 12$." }, { t: "It should be $3 + 4 = 7$.", fb: "The start is multiplied by the power, not added to it." }],
        answer: 0, skill: "Exponential functions", hints: ["Powers come before multiplying."], why: "$3 \\cdot 4 = 12$." },
      { type: "num", kicker: "Use it", prompt: "A pond has 500 bacteria, and the number **doubles** every hour. How many are there after 3 hours?", post: "bacteria", answer: 4000, skill: "Exponential functions",
        near: [{ v: 1500, fb: "That adds 500 three times. Doubling multiplies: $500 \\cdot 2^3$." }, { v: 3000, fb: "$2^3$ is 8, not 6." }], hints: ["$500 \\cdot 2^3$."], why: "$500 \\cdot 8 = 4000$." }
    ]
  });

  /* ============================================ 2 · Writing an exponential function from two points */
  var HOW_2 = [["Find a", "If a point is $(0, a)$, that is $a$. If not, divide the two equations."],
               ["Find b", "Put the other point in $y = a \\cdot b^x$ and solve for $b$."],
               ["Write it", "$f(x) = a \\cdot b^x$."]];
  var G2 = grid("The graph of 2 times 3 to the x, through (0, 2) and (3, 54).",
    curve(EXPF(2, 3), 0, 3.1, "blue", [0, 60]).concat([dot(0, 2, "orange"), dot(3, 54, "orange")]), { x: [-1, 4], y: [0, 60], u: 34, uy: 4, gy: 10, stepY: 10 });
  LESSONS.push({
    title: "Writing an exponential function from two points", art: "pcexp",
    blurb: "Book 4.1 · Two points are enough to pin down $a$ and $b$.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $\\sqrt[3]{27}$? (Which number multiplied by itself three times makes 27?)", answer: 3, skill: "Cube roots",
        near: [{ v: 9, fb: "$9 \\cdot 3 = 27$, but a cube root needs the number used **three** times: $3 \\cdot 3 \\cdot 3$." }], hints: ["$3 \\cdot 3 \\cdot 3$."], why: "$3^3 = 27$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dots are $(0, 3)$ and $(2, 12)$. Slide $a$ and $b$ so the blue graph $f(x) = a \\cdot b^x$ goes through **both**.",
        scene: { type: "sketch", x: [-1, 4], y: [0, 28], u: 34, uy: 9, gy: 4, stepY: 4, gate: true, pts: {},
          params: { a: { min: 1, max: 6, step: 1, v: 1, label: "$a$" }, b: { min: 0.5, max: 4, step: 0.5, v: 1, label: "$b$" } },
          draw: function (s) { return curve(EXPF(s.p.a, s.p.b), -1, 4, "blue", [0, 28]).concat([dot(0, 3, "orange"), dot(2, 12, "orange")]); },
          readout: function (s) { var a = s.p.a, b = s.p.b; return "$f(x) = " + nm(a) + " \\cdot " + nm(b) + "^x$<br>$f(0) = " + nm(a) + "$ " + (a === 3 ? "✓" : "✗") + " &nbsp; $f(2) = " + nm(f4(a * b * b)) + "$ " + (a * b * b === 12 ? "✓" : "✗"); },
          goal: function (s) { return s.p.a === 3 && s.p.b === 2; } },
        gate: true, then: "$a = 3$ came from the point $(0, 3)$: at $x = 0$ the power is $b^0 = 1$, so $f(0) = a$. Then $f(2) = 3b^2 = 12$ gives $b^2 = 4$, so $b = 2$." },
      { type: "learn", kicker: "The idea",
        prompt: "Two points give two equations in $a$ and $b$. If one point is $(0, a)$, the first is free: $a$ is its output. Substitute the other point and solve for $b$ with a **root**. Otherwise **divide** the two equations so $a$ cancels.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the exponential function through $(0, 2)$ and $(3, 54)$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "a = 2", say: "The point $(0, 2)$ is the start: $b^0 = 1$, so $f(0) = a$." },
          { step: 2, m: "54 = 2b^3", say: "Put in the point $(3, 54)$." },
          { step: 2, m: "b^3 = 27", say: "Divide both sides by 2.", ask: { prompt: "What is $54 \\div 2$?", answer: 0, options: [{ t: "$27$" }, { t: "$52$", fb: "Divide, do not subtract." }] } },
          { step: 2, m: "b = \\sqrt[3]{27} = 3", say: "The cube root, since $3 \\cdot 3 \\cdot 3 = 27$." },
          { step: 3, m: "f(x) = 2 \\cdot 3^x", say: "Check: $f(3) = 2 \\cdot 27 = 54$.", fig: G2 }] },
        gate: true, then: "$f(x) = 2 \\cdot 3^x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $(0, 5)$ and $(2, 45)$.",
        how: HOW_2, skill: "Exponential from two points",
        steps: [
          { step: 1, ask: "What is $a$?", type: "num", pre: "$a =$", answer: 5, near: [{ v: 45, fb: "$(0, 5)$ is the point at $x = 0$: its output is $a$." }], hint: "The output at $x = 0$.", m: "a = 5", say: "From $(0, 5)$." },
          { step: 2, ask: "$45 = 5b^2$. Divide by 5: $b^2 =$", type: "num", pre: "$b^2 =$", answer: 9, near: [{ v: 40, fb: "Divide: $45 \\div 5$." }], hint: "$45 \\div 5$.", m: "b^2 = 9", say: "Now the square root." },
          { step: 2, ask: "$b$ is positive. What is $b$?", type: "num", pre: "$b =$", answer: 3, near: [{ v: -3, fb: "The base of an exponential function is positive." }, { v: 4.5, fb: "$b^2 = 9$, so $b = \\sqrt{9}$." }], hint: "$3 \\cdot 3 = 9$.", m: "b = 3", say: "The positive root." },
          { step: 3, ask: "Which is $f(x) = a \\cdot b^x$?", type: "choice", answer: 0, options: [{ t: "$5 \\cdot 3^x$" }, { t: "$3 \\cdot 5^x$", fb: "$a = 5$ is the number in front, and $b = 3$ is the base." }], m: "f(x) = 5 \\cdot 3^x", say: "Check $f(2) = 5 \\cdot 9 = 45$." }],
        why: "Find $a$, then solve for $b$, then write it." },
      { type: "num", kicker: "On your own", prompt: "An exponential function goes through $(0, 100)$ and $(2, 25)$. Find $b$. (A decimal like 0.5 is fine.)", pre: "$b =$", answer: 0.5, tol: 1e-9, shown: "1/2", skill: "Exponential from two points",
        near: [{ v: 0.25, fb: "That is $b^2 = \\frac{25}{100}$. Take the square root to get $b$." }, { v: 2, fb: "The outputs fall from 100 to 25, so $b$ is less than 1." }], hints: ["$25 = 100b^2$, so $b^2 = 0.25$."], why: "$b^2 = \\frac{1}{4}$, so $b = \\frac{1}{2}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**No point at $x = 0$.** Find the exponential function through $(1, 6)$ and $(3, 24)$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "6 = ab \\qquad 24 = ab^3", say: "Put each point into $y = ab^x$." },
          { step: 1, m: "\\frac{24}{6} = \\frac{ab^3}{ab} = b^2", say: "Divide the second equation by the first. Something cancels.", ask: { prompt: "What cancels?", answer: 0, options: [{ t: "$a$, and one $b$" }, { t: "$b$ only", fb: "$a$ cancels too: it is in both." }] } },
          { step: 2, m: "b^2 = 4 \\ \\Rightarrow \\ b = 2", say: "The positive root." },
          { step: 2, m: "6 = a \\cdot 2 \\ \\Rightarrow \\ a = 3", say: "Put $b$ back into the first equation." },
          { step: 3, m: "f(x) = 3 \\cdot 2^x", say: "Check: $f(3) = 3 \\cdot 8 = 24$." }] },
        gate: true, then: "Dividing the two equations makes $a$ disappear." },
      { type: "choice", kicker: "Try it", prompt: "Which exponential function goes through $(0, 4)$ and $(1, 12)$?",
        options: [{ t: "$f(x) = 4 \\cdot 3^x$" }, { t: "$f(x) = 4 \\cdot 12^x$", fb: "$b$ is the ratio $12 \\div 4 = 3$, not 12." }, { t: "$f(x) = 3 \\cdot 4^x$", fb: "$a$ is the output at $x = 0$: it is 4." }],
        answer: 0, skill: "Exponential from two points", hints: ["$a = 4$, then $12 = 4b$."], why: "$a = 4$ and $b = 3$." },
      { type: "choice", kicker: "Find the error",
        prompt: "An exponential function goes through $(0, 2)$ and $(2, 18)$. Pat writes $18 = 2b^2$, so $b^2 = 36$ and $b = 6$. What is wrong?",
        options: [{ t: "Divide by 2, do not multiply: $b^2 = 9$, so $b = 3$." }, { t: "Nothing is wrong.", fb: "Check: $2 \\cdot 6^2 = 72$, not 18." }, { t: "$b$ should be $18 \\div 2 = 9$.", fb: "$9$ is $b^2$. Take the square root." }],
        answer: 0, skill: "Exponential from two points", hints: ["To undo $2b^2 = 18$, divide by 2."], why: "$b^2 = 9$, so $b = 3$." },
      { type: "num", kicker: "Use it", prompt: "A car costs \\$20,000 new and is worth \\$14,450 after 2 years. Each year it keeps the same **fraction** $b$ of its value. Find $b$. (Hint: $b^2 = \\frac{14450}{20000}$.)", pre: "$b =$", answer: 0.85, skill: "Exponential from two points",
        near: [{ v: 0.7225, fb: "That is $b^2$, the fraction kept over **two** years. Take its square root." }], hints: ["$b^2 = 0.7225$."], why: "$b = \\sqrt{0.7225} = 0.85$: the car loses 15% each year." }
    ]
  });

  /* ================================================ 3 · Compound interest and the number e */
  var HOW_3 = [["Read", "Find $P$ (the start), $r$ (the rate as a decimal), $n$ (times a year) and $t$ (years)."],
               ["Substitute", "Put them into $A = P\\left(1 + \\dfrac{r}{n}\\right)^{nt}$."],
               ["Compute", "Work the bracket, then the power, then multiply by $P$."]];
  var CMP3 = [["1", "yearly", 1], ["2", "twice", 2], ["4", "quarterly", 4], ["12", "monthly", 12], ["365", "daily", 365], ["inf", "always", Infinity]];
  var V3 = function (n) { return n === Infinity ? Math.E : Math.pow(1 + 1 / n, n); };
  LESSONS.push({
    title: "Compound interest and the number e", art: "pcexp",
    blurb: "Book 4.1 · Interest that earns interest, and where the number $e$ comes from.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "\\$100 earns 10% interest in a year. How much is there after the year?", post: "dollars", answer: 110, skill: "Percent change",
        near: [{ v: 10, fb: "That is only the interest. Add it to the \\$100." }], hints: ["$100 \\cdot 1.1$."], why: "$100 \\cdot 1.10 = 110$." },
      { type: "learn", kicker: "Explore",
        prompt: "Put \\$1 in a bank paying **100%** a year. If the interest is added more often (in smaller pieces), the total after a year is $\\left(1 + \\frac{1}{n}\\right)^n$. Pick each way of compounding and look at the total.",
        scene: { type: "sketch", x: [0, 7], y: [-0.6, 3], u: 56, uy: 84, gate: true, pts: {},
          chips: { n: { label: "Added", v: "1", opts: CMP3.map(function (c) { return [c[0], c[1]]; }) } },
          draw: function (s) {
            var it = [{ seg: [[0.4, Math.E], [6.6, Math.E]], c: "orange", dash: true }, { text: "e ≈ 2.718", at: [1.2, 2.86], c: "orange" }];
            CMP3.forEach(function (c, i) { it.push({ pt: [i + 1, V3(c[2])], c: c[0] === s.c.n ? "blue" : "soft", r: c[0] === s.c.n ? 6 : 4 }, { text: c[1], at: [i + 1, -0.32], c: c[0] === s.c.n ? "blue" : "soft" }); });
            return it;
          },
          readout: function (s) { var c = CMP3.filter(function (x) { return x[0] === s.c.n; })[0]; return c[2] === Infinity ? "added all the time: the total is $e = 2.71828\\ldots$" : "added " + c[1] + " ($n = " + c[2] + "$): $\\left(1 + \\frac{1}{" + c[2] + "}\\right)^{" + c[2] + "} = " + f4(V3(c[2]), 4) + "$<br>Looked at " + Math.min(Object.keys(s.seen.n).length, 6) + " of 6"; },
          goal: function (s) { return Object.keys(s.seen.n).length >= 6; } },
        gate: true, then: "More often is better, but the gain **runs out**: the total creeps up towards one number, $e \\approx 2.71828$. That number is the base of **continuous** growth." },
      { type: "learn", kicker: "The idea",
        prompt: "Money earning interest at rate $r$, added $n$ times a year for $t$ years: $A = P\\left(1 + \\frac{r}{n}\\right)^{nt}$. If it is added **continuously**: $A = Pe^{rt}$. Always write the rate as a decimal.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "\\$1000 earns 6% a year, compounded **quarterly**, for 5 years. How much is there?",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "P = 1000, \\ \\ r = 0.06", say: "The rate 6% is $0.06$ as a decimal." },
          { step: 1, m: "n = 4, \\ \\ t = 5", say: "Quarterly means 4 times a year.", ask: { prompt: "What is the total number of times interest is added, $nt$?", answer: 0, options: [{ t: "$20$" }, { t: "$9$", fb: "$nt$ is a product: $4 \\cdot 5$." }] } },
          { step: 2, m: "A = 1000\\left(1 + \\frac{0.06}{4}\\right)^{20}", say: "Each quarter earns $\\frac{0.06}{4} = 0.015$." },
          { step: 3, m: "A = 1000(1.015)^{20}", say: "Work the bracket first." },
          { step: 3, m: "A \\approx 1346.86", say: "To the nearest cent: \\$1346.86." }] },
        gate: true, then: "About \\$1346.86." },
      { type: "guided", kicker: "Together",
        prompt: "Now \\$500 at 4% a year, compounded **continuously**, for 3 years.",
        how: HOW_3, skill: "Compound interest",
        steps: [
          { step: 1, ask: "Which formula is for continuous compounding?", type: "choice", answer: 0, options: [{ t: "$A = Pe^{rt}$" }, { t: "$A = P\\left(1 + \\frac{r}{n}\\right)^{nt}$", fb: "That is for a fixed number $n$ of times a year." }], m: "A = Pe^{rt}", say: "Continuous: use $e$." },
          { step: 2, ask: "$r = 0.04$ and $t = 3$. What is $rt$?", type: "num", pre: "$rt =$", answer: 0.12, near: [{ v: 12, fb: "Use the decimal rate: $0.04 \\cdot 3$." }], hint: "$0.04 \\cdot 3$.", m: "A = 500e^{0.12}", say: "The exponent is $rt$." },
          { step: 3, ask: "Find $A$ to the nearest cent. (Type e^0.12 for $e^{0.12}$, or use $e \\approx 2.71828$.)", type: "num", pre: "$A =$", post: "dollars", answer: 563.75, tol: 0.0051, calc: true, near: [{ v: 500.12, tol: 1e-5, fb: "$e^{0.12}$ is multiplied by 500." }], hint: "$e^{0.12} \\approx 1.1275$.", m: "A \\approx 563.75", say: "About \\$563.75." }],
        why: "Read, substitute, compute." },
      { type: "num", kicker: "On your own", prompt: "\\$2000 earns 5% a year, compounded **monthly**, for 2 years. How much is there, to the nearest cent? (You can type the sum, for example 2000*(1+0.05/12)^24.)", pre: "$A =$", post: "dollars", answer: 2209.88, tol: 0.0051, calc: true, skill: "Compound interest",
        near: [{ v: 2200, fb: "That is yearly simple interest. Use $n = 12$ and $nt = 24$." }], hints: ["$A = 2000\\left(1 + \\frac{0.05}{12}\\right)^{24}$."], why: "$2000(1.00417)^{24} \\approx 2209.88$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Find the starting amount.** How much must be invested now at 6% a year, compounded **monthly**, to have \\$10,000 in 10 years?",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "A = 10000 \\quad r = 0.06 \\quad n = 12", say: "Now $A$ is known and $P$ is not." },
          { step: 2, m: "10000 = P(1.005)^{120}", say: "$\\frac{0.06}{12} = 0.005$ and $nt = 12 \\cdot 10 = 120$.", ask: { prompt: "What is $\\frac{0.06}{12}$?", answer: 0, options: [{ t: "$0.005$" }, { t: "$0.05$", fb: "$0.06 \\div 12 = 0.005$." }] } },
          { step: 3, m: "P = \\frac{10000}{(1.005)^{120}}", say: "Divide both sides by the power." },
          { step: 3, m: "P \\approx 5496.33", say: "About \\$5496.33 invested now grows to \\$10,000." }] },
        gate: true, then: "To go **back** in time, divide by the growth." },
      { type: "choice", kicker: "Try it", prompt: "Money grows **continuously** at 3% a year. Which formula gives the amount after $t$ years?",
        options: [{ t: "$A = Pe^{0.03t}$" }, { t: "$A = P(1.03)^t$", fb: "That adds the interest once a year, not continuously." }, { t: "$A = P(0.03)^t$", fb: "Growth multiplies by more than 1: $0.03^t$ would shrink to almost nothing." }],
        answer: 0, skill: "Compound interest", hints: ["Continuous: $Pe^{rt}$."], why: "$r = 0.03$, so $Pe^{0.03t}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana invests $P$ at 8% a year compounded **quarterly** and writes $A = P(1 + 0.08)^{4t}$. What is wrong?",
        options: [{ t: "The rate must be split into quarters: $1 + \\frac{0.08}{4} = 1.02$." }, { t: "Nothing is wrong.", fb: "She added the full 8% four times a year, which is far too much." }, { t: "The exponent should be $t$.", fb: "Four times a year for $t$ years is $4t$ times: that part is right." }],
        answer: 0, skill: "Compound interest", hints: ["Each quarter earns a quarter of the yearly rate."], why: "$A = P(1.02)^{4t}$." },
      { type: "choice", kicker: "Use it", prompt: "Which pays more on \\$1000 for one year: **5% compounded monthly**, or **5.1% compounded once** a year?",
        options: [{ t: "5% monthly: \\$1051.16, a little more" }, { t: "5.1% yearly: \\$1051.00, a little more", fb: "$1000(1 + \\frac{0.05}{12})^{12} \\approx 1051.16$, which beats $1000(1.051) = 1051.00$." }, { t: "They are exactly equal.", fb: "They are very close, but monthly compounding gives \\$1051.16." }],
        answer: 0, skill: "Compound interest", hints: ["Work out both totals."], why: "Compounding more often can beat a slightly higher rate." }
    ]
  });
  /* ============================================ 4 · The graph of an exponential function */
  var HOW_4 = [["Table", "Make a table of points, always including $x = 0$."],
               ["Plot", "Plot the points and draw the asymptote $y = 0$."],
               ["Draw", "Draw a smooth curve, then state the domain and range."]];
  var TB4 = function (n) {
    var pts = [[-2, 0.25], [-1, 0.5], [0, 1], [1, 2], [2, 4], [3, 8]].slice(0, n).map(function (p) { return dot(p[0], p[1], p[0] === 0 ? "orange" : "blue"); });
    return pts;
  };
  var G4a = grid("Points on y = 2 to the x, with the horizontal asymptote y = 0.", TB4(6).concat([{ seg: [[-3, 0], [4, 0]], c: "orange", dash: true }]), { x: [-3, 4], y: [-1, 9], u: 30, uy: 24 });
  var G4b = grid("The graph of y = 2 to the x: it rises quickly to the right and flattens against the x-axis on the left.", curve(EXPF(1, 2), -3, 3.2, "blue", [-1, 9]).concat(TB4(6)), { x: [-3, 4], y: [-1, 9], u: 30, uy: 24 });
  var G4c = grid("The graph of y = 2 to the minus x, which is one half to the x: it falls from left to right.", curve(function (x) { return Math.pow(2, -x); }, -3.2, 3, "blue", [-1, 9]).concat([dot(0, 1, "orange"), dot(1, 0.5, "blue"), dot(-1, 2, "blue"), dot(-2, 4, "blue")]), { x: [-4, 4], y: [-1, 9], u: 30, uy: 24 });
  LESSONS.push({
    title: "The graph of an exponential function", art: "pcexp",
    blurb: "Book 4.2 · Every $y = b^x$ passes through $(0, 1)$ and hugs the $x$-axis.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $2^{-3}$. (A decimal such as 0.25 is fine.)", answer: 0.125, tol: 1e-9, shown: "1/8", skill: "Negative exponents",
        near: [{ v: -8, fb: "A negative exponent does not make the answer negative: $2^{-3} = \\frac{1}{2^3}$." }, { v: -6, fb: "$2^{-3}$ is not $2 \\cdot (-3)$." }], hints: ["$2^{-3} = \\frac{1}{8}$."], why: "$\\frac{1}{2^3} = \\frac{1}{8} = 0.125$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the base $b$ in $y = b^x$ and watch the blue graph. Find a base for which it **climbs**, one for which it **falls**, and the one that goes **flat**.",
        scene: { type: "sketch", x: [-3, 3], y: [-1, 8], u: 36, uy: 30, gate: true, pts: {},
          params: { b: { min: 0.25, max: 3, step: 0.25, v: 2, label: "$b$" } },
          track: function (s) { return s.p.b > 1 ? "up" : s.p.b < 1 ? "down" : "flat"; },
          draw: function (s) { var b = s.p.b; return curve(EXPF(1, b), -3, 3, "blue", [-1, 8]).concat([dot(0, 1, "orange"), dot(1, b, "orange")]); },
          readout: function (s) { var b = s.p.b; return "$y = " + nm(b) + "^x$: " + (b > 1 ? "it **climbs**" : b < 1 ? "it **falls**" : "a **flat** line at height 1") + ", through $(0, 1)$ and $(1, " + nm(b) + ")$<br>Climbing " + (s.tracked.up ? "✓" : "—") + " · falling " + (s.tracked.down ? "✓" : "—") + " · flat " + (s.tracked.flat ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.up && s.tracked.down && s.tracked.flat); } },
        gate: true, then: "Every graph passes through $(0, 1)$ and never touches the $x$-axis. A base **above 1** climbs, a base **between 0 and 1** falls, and the base 1 is just a flat line, so it is not counted." },
      { type: "learn", kicker: "The idea",
        prompt: "The graph of $f(x) = b^x$ has **domain** all real numbers and **range** $y > 0$. It passes through $(0, 1)$ and has the **horizontal asymptote** $y = 0$. If $b > 1$ it is increasing; if $0 < b < 1$ it is decreasing.",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch $f(x) = 2^x$ and state its domain and range.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "2^{-2} = \\tfrac{1}{4}, \\ \\ 2^{-1} = \\tfrac{1}{2}", say: "Negative powers are fractions, still positive." },
          { step: 1, m: "2^0 = 1, \\ \\ 2^1 = 2, \\ \\ 2^2 = 4", say: "Then the whole numbers. $(0, 1)$ is on every graph of $b^x$.", ask: { prompt: "What is $2^3$?", answer: 0, options: [{ t: "$8$" }, { t: "$6$", fb: "$2 \\cdot 2 \\cdot 2$, not $2 \\cdot 3$." }] } },
          { step: 2, m: "y = 0", say: "Plot the points and draw the asymptote: on the left the graph gets closer to the $x$-axis but never touches it.", fig: G4a },
          { step: 3, m: "\\text{domain: all real } x", say: "Any number can be an exponent.", fig: G4b },
          { step: 3, m: "\\text{range: } y > 0", say: "A power of 2 is never 0 or negative." }] },
        gate: true, then: "Domain $(-\\infty, \\infty)$. Range $(0, \\infty)$. Asymptote $y = 0$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $g(x) = \\left(\\frac{1}{2}\\right)^x$.",
        how: HOW_4, skill: "Graph of an exponential",
        steps: [
          { step: 1, ask: "$g(2) = \\left(\\frac{1}{2}\\right)^2$. (A decimal is fine.)", type: "num", pre: "$g(2) =$", answer: 0.25, tol: 1e-9, shown: "1/4", near: [{ v: 1, fb: "Square both the 1 and the 2: $\\frac{1}{2} \\cdot \\frac{1}{2}$." }], hint: "$\\frac{1}{2} \\cdot \\frac{1}{2}$.", m: "g(2) = \\tfrac{1}{4}", say: "A quarter." },
          { step: 1, ask: "$g(-1) = \\left(\\frac{1}{2}\\right)^{-1}$ flips the fraction. What is it?", type: "num", pre: "$g(-1) =$", answer: 2, near: [{ v: 0.5, fb: "A negative exponent flips: $\\left(\\frac{1}{2}\\right)^{-1} = \\frac{2}{1}$." }], hint: "Flip $\\frac{1}{2}$.", m: "g(-1) = 2", say: "On the left the graph is high." },
          { step: 2, ask: "Does the graph rise or fall as $x$ increases?", type: "choice", answer: 0, options: [{ t: "Falls: $0 < b < 1$" }, { t: "Rises", fb: "$g(-1) = 2$ is higher than $g(2) = \\frac{1}{4}$." }], m: "\\text{falls}", say: "A decreasing function." },
          { step: 3, ask: "What is the range of $g$?", type: "choice", answer: 0, options: [{ t: "$y > 0$" }, { t: "all real numbers", fb: "A power of $\\frac{1}{2}$ is never 0 or negative." }], m: "y > 0", say: "Same as for every $b^x$." }],
        why: "Table, asymptote, curve, domain and range." },
      { type: "multi", kicker: "On your own", prompt: "Select **all** the true statements about $f(x) = 4^x$.",
        options: [{ t: "It passes through $(0, 1)$", ok: true }, { t: "It is increasing", ok: true }, { t: "Its range is all positive numbers", ok: true }, { t: "It crosses the $x$-axis", fb: "It never does: the outputs are always positive." }, { t: "It has a vertical asymptote", fb: "The asymptote is **horizontal**, $y = 0$." }],
        skill: "Graph of an exponential", hints: ["$4^0 = 1$, and $4 > 1$."], why: "Through $(0, 1)$, increasing, range $y > 0$, asymptote $y = 0$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **negative** exponent in $x$. Is $f(x) = 2^{-x}$ growth or decay?",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "2^{-x} = \\left(2^{-1}\\right)^x", say: "A power of a power: multiply the exponents." },
          { step: 1, m: "2^{-x} = \\left(\\tfrac{1}{2}\\right)^x", say: "$2^{-1} = \\frac{1}{2}$. So the base is $b = \\frac{1}{2}$.", ask: { prompt: "Is $b = \\frac{1}{2}$ above or below 1?", answer: 0, options: [{ t: "Below 1" }, { t: "Above 1", fb: "$\\frac{1}{2}$ is less than 1." }] } },
          { step: 2, m: "0 < b < 1 \\ \\Rightarrow \\ \\text{decay}", say: "The graph falls: the mirror image of $2^x$ in the $y$-axis.", fig: G4c },
          { step: 3, m: "\\text{range: } y > 0", say: "Still the same domain and range." }] },
        gate: true, then: "$b^{-x}$ is the same as $\\left(\\frac{1}{b}\\right)^x$: a reflection in the $y$-axis." },
      { type: "choice", kicker: "Try it", prompt: "Which of these is a **decay** function?",
        options: [{ t: "$f(x) = 0.8^x$" }, { t: "$f(x) = 1.8^x$", fb: "A base above 1 grows." }, { t: "$f(x) = 8^x$", fb: "A base above 1 grows." }],
        answer: 0, skill: "Graph of an exponential", hints: ["Decay needs a base between 0 and 1."], why: "$0 < 0.8 < 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia says the **range** of $f(x) = 5^x$ is all real numbers. What is wrong?",
        options: [{ t: "A power of 5 is never zero or negative: the range is $y > 0$." }, { t: "Nothing is wrong.", fb: "Try $5^x = -1$: no $x$ makes a positive base negative." }, { t: "The range is $x > 0$.", fb: "The range is about the outputs $y$, not the inputs $x$." }],
        answer: 0, skill: "Graph of an exponential", hints: ["Can $5^x$ ever be negative?"], why: "Range $(0, \\infty)$." },
      { type: "choice", kicker: "Use it", prompt: "A town's population is $P(t) = 300 \\cdot 1.5^t$ after $t$ years. What does the point $(0, 300)$ on its graph tell you?",
        options: [{ t: "The population at the start was 300." }, { t: "The population grows by 300 a year.", fb: "It grows by a factor of 1.5, not by 300." }, { t: "The population is 300 after 1 year.", fb: "$P(1) = 450$. At $t = 0$ no time has passed." }],
        answer: 0, skill: "Graph of an exponential", hints: ["$t = 0$ is the start."], why: "$P(0) = 300 \\cdot 1 = 300$." }
    ]
  });

  /* ======================================= 5 · Shifting, stretching and flipping an exponential graph */
  var HOW_5 = [["Asymptote", "The horizontal asymptote is $y = k$."],
               ["Shift", "Move each key point $h$ right and $k$ up (and flip first if $a < 0$)."],
               ["Draw", "Draw the curve towards the asymptote."]];
  var KP5 = [[0, 1], [1, 2], [2, 4]];
  var G5 = function (k) {
    var it = [];
    if (k >= 1) it.push({ seg: [[-5, -3], [4, -3]], c: "orange", dash: true });
    if (k >= 2) KP5.forEach(function (p) { it.push(dot(p[0] - 1, p[1] - 3, "blue")); });
    if (k >= 3) it = it.concat(curve(function (x) { return Math.pow(2, x + 1) - 3; }, -5, 2.2, "blue", [-5, 6]));
    return grid("The graph of 2 to the (x + 1), minus 3, with the asymptote y = -3 and the points (-1, -2), (0, -1) and (1, 1).", it, { x: [-5, 4], y: [-5, 6], u: 26 });
  };
  var P5 = function (x) { return Math.pow(2, x); };
  LESSONS.push({
    title: "Shifting, stretching and flipping an exponential graph", art: "pcexp",
    blurb: "Book 4.2 · The same moves as every other graph, with a horizontal asymptote that travels along.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The graph of $y = f(x - 3)$ is the graph of $y = f(x)$…",
        options: [{ t: "shifted 3 to the **right**" }, { t: "shifted 3 to the left", fb: "$x - 3$ needs a bigger $x$ to do the same job: the graph moves right." }, { t: "shifted 3 up", fb: "A number inside the bracket moves the graph sideways." }],
        answer: 0, skill: "Shifts", hints: ["$f(x - 3)$ at $x = 5$ gives $f(2)$."], why: "$f(x - h)$ moves right by $h$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $a$, $h$ and $k$ so the blue graph lands on the dashed one. Its formula is $y = a \\cdot 2^{x - h} + k$. Watch the **purple line**.",
        scene: morph({ keys: ["ex"], x: [-5, 5], y: [-5, 6], u: 22, params: { a: { min: -2, max: 2, step: 1, v: 1, label: "$a$" }, h: { min: -4, max: 4, step: 1, v: 0, label: "$h$" }, k: { min: -4, max: 4, step: 1, v: 0, label: "$k$" } },
          tf: function (f, p) { return function (x) { return p.a * Math.pow(2, x - p.h) + p.k; }; }, map: function (pt, p) { return [pt[0] + p.h, p.a * pt[1] + p.k]; }, target: { a: -1, h: 1, k: 3 },
          extra: function (p) { return [{ seg: [[-5, p.k], [5, p.k]], c: "purple", dash: true }]; },
          read: function (p) { var ex = p.h === 0 ? "x" : "x " + (p.h < 0 ? "+ " + nm(-p.h) : "- " + nm(p.h)), lead = p.a === 1 ? "" : p.a === -1 ? "-" : nm(p.a) + " \\cdot ", c = p.k === 0 ? "" : p.k < 0 ? " - " + nm(-p.k) : " + " + nm(p.k); return p.a === 0 ? "$a = 0$: no exponential left, just the line $y = " + nm(p.k) + "$" : "$y = " + lead + "2^{" + ex + "}" + c + "$: asymptote $y = " + nm(p.k) + "$"; } }),
        gate: true, then: "$y = -2^{x - 1} + 3$. The purple line is the **horizontal asymptote**: it moves with $k$, and the graph flips over when $a$ is negative." },
      { type: "learn", kicker: "The idea",
        prompt: "In $f(x) = a \\cdot b^{x - h} + k$: $h$ shifts the graph sideways, $k$ shifts it up and **moves the asymptote to $y = k$**, and a negative $a$ flips it over the $x$-axis. Move the key points $(0, 1)$ and $(1, b)$, then draw.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch $g(x) = 2^{x + 1} - 3$.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "y = -3", say: "The $-3$ is $k$: the asymptote moves down to $y = -3$.", fig: G5(1) },
          { step: 2, m: "x + 1 = x - (-1)", say: "So $h = -1$: the graph moves **left** 1.", ask: { prompt: "Which way does $2^{x+1}$ move the graph?", answer: 0, options: [{ t: "Left 1" }, { t: "Right 1", fb: "$x + 1 = x - (-1)$, so $h = -1$: left." }] } },
          { step: 2, m: "(0, 1) \\to (-1, -2)", say: "Left 1, down 3.", fig: G5(2) },
          { step: 2, m: "(1, 2) \\to (0, -1)", say: "The same move." },
          { step: 3, m: "\\text{towards } y = -3", say: "Draw the curve through the points, flattening against the dashed line on the left.", fig: G5(3) }] },
        gate: true, then: "Asymptote $y = -3$; points $(-1, -2)$, $(0, -1)$, $(1, 1)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $h(x) = -2^x + 4$.",
        how: HOW_5, skill: "Transformations of an exponential",
        steps: [
          { step: 1, ask: "What is the horizontal asymptote? $y =$", type: "num", pre: "$y =$", answer: 4, near: [{ v: 0, fb: "$k = 4$ moves the asymptote up from 0." }, { v: -4, fb: "The $+4$ moves it **up**." }], hint: "It is $k$.", m: "y = 4", say: "Up by 4." },
          { step: 2, ask: "The minus sign in front means the graph is…", type: "choice", answer: 0, options: [{ t: "flipped over the $x$-axis" }, { t: "shifted left", fb: "A shift sideways is a number inside the exponent." }], m: "a = -1", say: "Flipped over, then lifted by 4." },
          { step: 3, ask: "Find $h(0) = -2^0 + 4$.", type: "num", pre: "$h(0) =$", answer: 3, near: [{ v: 5, fb: "$-2^0 = -1$: the minus stays. $-1 + 4$." }], hint: "$2^0 = 1$.", m: "(0, 3)", say: "The graph crosses the $y$-axis at 3." }],
        why: "Asymptote, flips and shifts, then draw." },
      { type: "choice", kicker: "On your own", prompt: "Which function has the horizontal asymptote $y = -2$?",
        options: [{ t: "$f(x) = 2^x - 2$" }, { t: "$f(x) = 2^{x - 2}$", fb: "A number inside the exponent shifts the graph sideways. The asymptote stays at $y = 0$." }, { t: "$f(x) = -2 \\cdot 2^x$", fb: "That flips and stretches, but the asymptote is still $y = 0$." }],
        answer: 0, skill: "Transformations of an exponential", hints: ["The asymptote is the number added outside."], why: "$k = -2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Write the function.** The graph of $2^x$ is reflected over the $x$-axis, shifted 3 units left and 1 unit down. Write its formula.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "-2^x", say: "Reflect over the $x$-axis: put a minus in front." },
          { step: 2, m: "-2^{x + 3}", say: "Shift left 3: replace $x$ with $x + 3$.", ask: { prompt: "To move the graph **left** 3, you write $x$…", answer: 0, options: [{ t: "$+ 3$ inside" }, { t: "$- 3$ inside", fb: "That moves it right." }] } },
          { step: 3, m: "-2^{x + 3} - 1", say: "Shift down 1: subtract 1 at the end. The asymptote is $y = -1$." }] },
        gate: true, then: "$f(x) = -2^{x + 3} - 1$." },
      { type: "num", kicker: "Try it", prompt: "What is the horizontal asymptote of $f(x) = 5 \\cdot 2^x - 7$?", pre: "$y =$", answer: -7, skill: "Transformations of an exponential",
        near: [{ v: 7, fb: "The $-7$ moves the asymptote **down** to $-7$." }, { v: 0, fb: "That is the asymptote of $2^x$. The $-7$ moves it." }], hints: ["The number added outside is $k$."], why: "$y = k = -7$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kay says $y = 2^{x - 3}$ is the graph of $2^x$ shifted 3 units to the **left**. What is wrong?",
        options: [{ t: "$x - 3$ shifts it to the **right** 3." }, { t: "Nothing is wrong.", fb: "At $x = 3$ the exponent is 0 and the graph has the height 1 that $2^x$ had at $x = 0$: it moved right." }, { t: "It is shifted 3 up.", fb: "An up-shift is a number added outside." }],
        answer: 0, skill: "Transformations of an exponential", hints: ["When is $x - 3 = 0$?"], why: "$h = 3$: right 3." },
      { type: "num", kicker: "Use it", prompt: "A cup of coffee cools: $T(t) = 70 \\cdot 0.9^t + 20$ degrees after $t$ minutes. What temperature does the graph level off at (its horizontal asymptote)?", post: "degrees", answer: 20, skill: "Transformations of an exponential",
        near: [{ v: 90, fb: "That is the starting temperature, $T(0)$. The coffee ends up much cooler." }, { v: 0, fb: "The $+20$ lifts the asymptote from 0 to 20: the room temperature." }], hints: ["$0.9^t \\to 0$ as $t$ grows."], why: "$70 \\cdot 0 + 20 = 20$: room temperature." }
    ]
  });
  /* ======================================== 6 · Logarithms: the exponent question */
  var HOW_6 = [["Name parts", "In $\\log_b x = y$: $b$ is the base, $x$ the number, $y$ the exponent."],
               ["Rewrite", "$\\log_b x = y$ means $b^y = x$. Convert in either direction."],
               ["Solve", "Ask: what power of $b$ gives $x$?"]];
  var Q6 = { a: { b: 2, N: 8 }, b: { b: 3, N: 81 }, c: { b: 10, N: 1000 } };
  LESSONS.push({
    title: "Logarithms: the exponent question", art: "pcexp",
    blurb: "Book 4.3 · A logarithm answers one question: what exponent?",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$2^{?} = 16$. What is the missing exponent?", answer: 4, skill: "Powers",
        near: [{ v: 8, fb: "$2 \\cdot 8 = 16$, but an exponent counts how many 2s are multiplied: $2 \\cdot 2 \\cdot 2 \\cdot 2$." }], hints: ["2, 4, 8, 16: how many doublings?"], why: "$2^4 = 16$." },
      { type: "learn", kicker: "Explore",
        prompt: "Each question asks for an **exponent**. Slide the exponent until the highlighted box equals the target. Answer **all three** questions.",
        scene: { type: "sketch", x: [-0.6, 5.6], y: [-1.1, 1.3], u: 64, grid: false, gate: true, pts: {},
          chips: { q: { label: "Question", v: "a", opts: [["a", "$2^{?} = 8$"], ["b", "$3^{?} = 81$"], ["c", "$10^{?} = 1000$"]] } },
          params: { t: { min: 0, max: 5, step: 1, v: 0, label: "exponent" } },
          track: function (s) { var q = Q6[s.c.q]; return Math.pow(q.b, s.p.t) === q.N ? s.c.q : null; },
          draw: function (s) {
            var q = Q6[s.c.q], t = s.p.t, it = [];
            for (var i = 0; i <= 5; i++) { var v = Math.pow(q.b, i), on = i === t;
              it.push({ poly: [[i - 0.42, -0.4], [i + 0.42, -0.4], [i + 0.42, 0.4], [i - 0.42, 0.4]], c: on ? (v === q.N ? "green" : "blue") : "soft", fill: on }, { text: String(v), at: [i, -0.12], c: on ? "ink" : "soft" }, { text: String(i), at: [i, -0.75], c: "soft" }); }
            return it;
          },
          readout: function (s) { var q = Q6[s.c.q], v = Math.pow(q.b, s.p.t), n = Object.keys(s.tracked).length; return "$" + q.b + "^{" + s.p.t + "} = " + v + "$" + (v === q.N ? " — **the target!** ✓" : " (the target is " + q.N + ")") + "<br>Questions answered: " + n + " of 3"; },
          goal: function (s) { return !!(s.tracked.a && s.tracked.b && s.tracked.c); } },
        gate: true, then: "You answered three **logarithm** questions. \"What exponent turns 2 into 8?\" is written $\\log_2 8 = 3$. A logarithm **is** an exponent." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\log_b x = y$ means $b^y = x$, with $b > 0$, $b \\neq 1$ and $x > 0$. Read it: \"the logarithm of $x$ to the base $b$ is the exponent you put on $b$ to get $x$.\" The two forms say the same thing, so you can switch between them.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Convert $\\log_5 125 = 3$ to exponential form. Then turn $3^4 = 81$ into a log.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "\\log_5 125 = 3", say: "Name the parts: the base is 5, the number is 125, and the exponent (the answer) is 3." },
          { step: 2, m: "5^3 = 125", say: "The base 5 carries the exponent 3 and gives 125.", ask: { prompt: "Which number is the base?", answer: 0, options: [{ t: "$5$" }, { t: "$125$", fb: "125 is what you get. The base is the small number written below \"log\": 5." }] } },
          { step: 3, m: "5 \\cdot 5 \\cdot 5 = 125", say: "Check: it is true, so the conversion is right." },
          { step: 3, m: "3^4 = 81 \\ \\Rightarrow \\ \\log_3 81 = 4", say: "And the other way: the log gives the **exponent**, 4, and the base moves down.", ask: { prompt: "What does the logarithm equal?", answer: 0, options: [{ t: "The exponent, $4$" }, { t: "The result, $81$", fb: "A log is the exponent, not the result." }] } }] },
        gate: true, then: "$\\log_b x = y \\ \\iff \\ b^y = x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $\\log_2 32 = 5$ and $4^3 = 64$.",
        how: HOW_6, skill: "Log and exponential form",
        steps: [
          { step: 1, ask: "In $\\log_2 32 = 5$, what is the base?", type: "num", pre: "base =", answer: 2, near: [{ v: 32, fb: "The base is the little number below \"log\"." }, { v: 5, fb: "5 is the exponent (the answer of the log)." }], hint: "Below the log.", m: "b = 2", say: "Base 2." },
          { step: 2, ask: "Write $\\log_2 32 = 5$ in exponential form.", type: "choice", answer: 0, options: [{ t: "$2^5 = 32$" }, { t: "$5^2 = 32$", fb: "The base stays 2; the log's answer, 5, is the exponent." }, { t: "$32^2 = 5$", fb: "The base is 2, not 32." }], m: "2^5 = 32", say: "$2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 = 32$." },
          { step: 3, ask: "Write $4^3 = 64$ in logarithmic form.", type: "choice", answer: 0, options: [{ t: "$\\log_4 64 = 3$" }, { t: "$\\log_3 64 = 4$", fb: "The base of the power, 4, is the base of the log." }, { t: "$\\log_{64} 4 = 3$", fb: "The base is the number that carries the exponent: 4." }], m: "\\log_4 64 = 3", say: "Base 4, exponent 3." }],
        why: "Name the parts, rewrite, solve." },
      { type: "choice", kicker: "On your own", prompt: "Which equation is the same as $\\log_7 49 = 2$?",
        options: [{ t: "$7^2 = 49$" }, { t: "$2^7 = 49$", fb: "The base stays 7. The log's answer 2 is the exponent." }, { t: "$49^2 = 7$", fb: "The base is 7, and 49 is the result." }],
        answer: 0, skill: "Log and exponential form", hints: ["Base 7, exponent 2."], why: "$7^2 = 49$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A fraction.** Evaluate $\\log_2 \\frac{1}{8}$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "\\log_2 \\tfrac{1}{8} = y", say: "Call the answer $y$." },
          { step: 2, m: "2^y = \\tfrac{1}{8}", say: "Rewrite in exponential form." },
          { step: 3, m: "\\tfrac{1}{8} = 2^{-3}", say: "A negative exponent flips: $2^{-3} = \\frac{1}{2^3}$.", ask: { prompt: "What is $2^{-3}$?", answer: 0, options: [{ t: "$\\frac{1}{8}$" }, { t: "$-8$", fb: "A negative exponent gives a fraction, not a negative number." }] } },
          { step: 3, m: "y = -3", say: "So $\\log_2 \\frac{1}{8} = -3$: logs can be negative." }] },
        gate: true, then: "The **number** must be positive, but the **log** can be negative." },
      { type: "num", kicker: "Try it", prompt: "Evaluate $\\log_4 64$.", pre: "$\\log_4 64 =$", answer: 3, skill: "Evaluate a logarithm",
        near: [{ v: 16, fb: "$4 \\cdot 16 = 64$, but we want the exponent: $4^? = 64$." }], hints: ["$4^2 = 16$, $4^3 = ?$"], why: "$4^3 = 64$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam says $\\log_2 8 = 4$ \"because $2 \\cdot 4 = 8$\". What is wrong?",
        options: [{ t: "A log is an exponent: $2^3 = 8$, so $\\log_2 8 = 3$." }, { t: "Nothing is wrong.", fb: "Check: $2^4 = 16$, not 8." }, { t: "It should be $8 \\div 2 = 4$.", fb: "A log is not a division. It counts how many 2s are multiplied." }],
        answer: 0, skill: "Evaluate a logarithm", hints: ["$2 \\cdot 2 \\cdot 2$."], why: "$\\log_2 8 = 3$." },
      { type: "num", kicker: "Use it", prompt: "A cell divides into two every hour. How many hours until there are 1024 cells? That is $\\log_2 1024$.", post: "hours", answer: 10, skill: "Evaluate a logarithm",
        near: [{ v: 512, fb: "That is half of 1024. The question asks how many doublings: the exponent." }], hints: ["$2^{10}$."], why: "$2^{10} = 1024$." }
    ]
  });

  /* ========================================== 7 · Common and natural logarithms */
  var HOW_7 = [["Name it", "$\\log x$ means base 10. $\\ln x$ means base $e$."],
               ["Power form", "Ask: $10^{?} = x$ or $e^{?} = x$."],
               ["Answer", "Powers of the base give whole answers. Otherwise use a calculator."]];
  var N7 = [0.1, 1, 2, 5, 10, 20, 50, 100, 500];
  var G7 = grid("The graph of 10 to the x passes through (0, 1), and the line y = 70 meets it between x = 1 and x = 2.",
    curve(EXPF(1, 10), -0.5, 2.1, "blue", [0, 120]).concat([{ seg: [[-0.5, 70], [1.845, 70]], c: "orange", dash: true }, { seg: [[1.845, 0], [1.845, 70]], c: "orange", dash: true }, dot(1.845, 70, "orange")]),
    { x: [-0.5, 2.5], y: [0, 120], u: 70, uy: 2.6, gy: 20 });
  LESSONS.push({
    title: "Common and natural logarithms", art: "pcexp",
    blurb: "Book 4.3 · The two logs on your calculator: base 10 and base $e$.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$10^{?} = 100000$. What is the exponent?", answer: 5, skill: "Powers of ten",
        near: [{ v: 6, fb: "Count the zeros in 100000: there are 5." }, { v: 100000, fb: "That is the number. We want its exponent." }], hints: ["Count the zeros."], why: "$10^5 = 100000$." },
      { type: "learn", kicker: "Explore",
        prompt: "Tap numbers to find their **common logarithm**, $\\log x$ (the power of 10 that gives $x$). Each tap drops a dot on the number line at its log. Tap **at least four** numbers, including **5** and **50**.",
        scene: { type: "sketch", x: [-1.4, 3.4], y: [-0.9, 1.6], u: 90, w: 440, gate: true, pts: {}, grid: false,
          taps: N7.reduce(function (o, n, i) { o["n" + n] = { at: [-1 + i * 0.5, 1.05], label: String(n), c: "blue", r: 19, say: "The number " + n }; return o; }, {}),
          draw: function (s) {
            var it = [{ seg: [[-1.3, 0], [3.3, 0]], c: "soft" }];
            for (var k = -1; k <= 3; k++) it.push({ seg: [[k, -0.08], [k, 0.08]], c: "soft" }, { text: String(k).replace("-", "−"), at: [k, -0.4], c: "soft" });
            s.selList.forEach(function (id) { var n = +id.slice(1), l = Math.log(n) / Math.LN10; it.push({ pt: [l, 0], c: "orange" }, { text: String(f4(l, 2)).replace("-", "−"), at: [l, 0.34], c: "orange" }); });
            return it;
          },
          readout: function (s) { var l = s.selList.slice(-3).map(function (id) { var n = +id.slice(1); return "$\\log " + n + " \\approx " + f4(Math.log(n) / Math.LN10, 2) + "$"; }); return (l.length ? l.join(" &nbsp; ") : "Tap a number.") + "<br>Tapped " + s.selList.length + (s.sel.n5 && s.sel.n50 ? " · 5 and 50 ✓" : ""); },
          goal: function (s) { return !!(s.sel.n5 && s.sel.n50 && s.selList.length >= 4); } },
        gate: true, then: "Compare $\\log 5 \\approx 0.70$ with $\\log 50 \\approx 1.70$. **Ten times** the number adds exactly **1** to the log: a common log counts the tens." },
      { type: "learn", kicker: "The idea",
        prompt: "A log with **no base written** is base 10: the **common logarithm**, $\\log x$. The **natural logarithm** is base $e$, written $\\ln x$. Powers of the base give whole-number answers ($\\log 1000 = 3$, $\\ln e^2 = 2$). For other numbers, press LOG or LN on a calculator.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Evaluate $\\log 0.001$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "\\log 0.001 = \\log_{10} 0.001", say: "No base written means base 10." },
          { step: 2, m: "10^{?} = 0.001", say: "What power of 10 is one thousandth?", ask: { prompt: "$0.001 = \\frac{1}{1000}$. As a power of 10 that is…", answer: 0, options: [{ t: "$10^{-3}$" }, { t: "$10^{3}$", fb: "$10^3 = 1000$. A fraction needs a negative exponent." }] } },
          { step: 3, m: "\\log 0.001 = -3", say: "Because $10^{-3} = 0.001$." }] },
        gate: true, then: "$\\log 0.001 = -3$: the logs of numbers below 1 are negative." },
      { type: "guided", kicker: "Together",
        prompt: "Now you evaluate $\\ln \\frac{1}{e}$ and $\\log 100000$.",
        how: HOW_7, skill: "Common and natural logs",
        steps: [
          { step: 1, ask: "$\\ln$ is a log with which base?", type: "choice", answer: 0, options: [{ t: "base $e$" }, { t: "base 10", fb: "Base 10 is the common log, written $\\log$." }], m: "\\ln = \\log_e", say: "The natural log." },
          { step: 2, ask: "$e^{?} = \\frac{1}{e}$. What is the exponent?", type: "num", pre: "$? =$", answer: -1, near: [{ v: 1, fb: "$e^1 = e$. For $\\frac{1}{e}$ the exponent is negative." }], hint: "$e^{-1} = \\frac{1}{e}$.", m: "\\ln \\tfrac{1}{e} = -1", say: "A negative exponent flips." },
          { step: 3, ask: "Now $\\log 100000$: how many zeros does 100000 have?", type: "num", pre: "$\\log 100000 =$", answer: 5, near: [{ v: 6, fb: "Count the zeros, not the digits." }], hint: "$10^? = 100000$.", m: "\\log 100000 = 5", say: "Done." }],
        why: "Name it, ask the power question, answer." },
      { type: "num", kicker: "On your own", prompt: "Use a calculator (the box accepts log(...) and ln(...)) to find $\\log 500$ to two decimal places.", pre: "$\\log 500 \\approx$", answer: 2.699, tol: 0.003, calc: true, skill: "Common and natural logs",
        near: [{ v: 6.21, tol: 0.003, fb: "That is $\\ln 500$, the natural log. LOG is base 10." }, { v: 500, fb: "That is the number. Press LOG first." }], hints: ["$100 < 500 < 1000$, so the answer is between 2 and 3."], why: "$\\log 500 \\approx 2.70$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**An equation.** Solve $10^x = 70$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "10^x = 70", say: "Here $x$ is the exponent that makes 70, so it is a common log." },
          { step: 2, m: "10 < 70 < 100", say: "That is $10^1 < 70 < 10^2$: $x$ is between 1 and 2.", fig: G7, ask: { prompt: "Between which two whole numbers is $x$?", answer: 0, options: [{ t: "1 and 2" }, { t: "7 and 8", fb: "70 is between $10^1$ and $10^2$: the exponent is between 1 and 2." }] } },
          { step: 3, m: "x = \\log 70 \\approx 1.845", say: "The LOG key finds it. In general, $\\ln e^x = x$ and $10^{\\log x} = x$: a log and its power undo each other." }] },
        gate: true, then: "$x = \\log 70 \\approx 1.845$." },
      { type: "num", kicker: "Try it", prompt: "Evaluate $\\ln e^4$.", pre: "$\\ln e^4 =$", answer: 4, skill: "Common and natural logs",
        near: [{ v: 1, fb: "$\\ln e = 1$, but here the exponent 4 comes out: $\\ln e^4 = 4$." }], hints: ["$e^? = e^4$."], why: "$\\ln e^4 = 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Someone writes $\\log(-10) = -1$. What is wrong?",
        options: [{ t: "You cannot take the log of a negative number: no power of 10 is negative." }, { t: "Nothing is wrong.", fb: "$10^{-1} = 0.1$, not $-10$." }, { t: "It should be $\\log(-10) = 1$.", fb: "$10^1 = 10$, not $-10$." }],
        answer: 0, skill: "Common and natural logs", hints: ["Can $10^y$ ever be negative?"], why: "$\\log$ is only defined for positive numbers." },
      { type: "choice", kicker: "Use it", prompt: "A number $N$ has $\\log N = 5.3$. Between which two powers of 10 does $N$ lie?",
        options: [{ t: "$10^5$ and $10^6$" }, { t: "$10^3$ and $10^4$", fb: "$\\log N = 5.3$ means $N = 10^{5.3}$, bigger than $10^5$." }, { t: "$10^{53}$ and $10^{54}$", fb: "The log is the exponent: 5.3, not 53." }],
        answer: 0, skill: "Common and natural logs", hints: ["$N = 10^{5.3}$."], why: "$10^5 < 10^{5.3} < 10^6$: a number of about 200,000." }
    ]
  });

  /* ============================================== 8 · The graph of a logarithm */
  var HOW_8 = [["Asymptote", "The vertical asymptote is $x = 0$."],
               ["Key points", "Plot $(1, 0)$ and $(b, 1)$, and a few more powers of $b$."],
               ["Draw", "Draw the curve hugging the asymptote; state the domain and range."]];
  var G8 = function (k) {
    var it = [];
    if (k >= 1) it.push({ seg: [[0, -3.4], [0, 4.4]], c: "orange", dash: true });
    if (k >= 2) it.push(dot(1, 0, "orange"), dot(2, 1, "blue"));
    if (k >= 3) it.push(dot(0.5, -1, "blue"), dot(4, 2, "blue"), dot(8, 3, "blue"));
    if (k >= 4) it = it.concat(curve(LOGF(2), 0.04, 9.5, "blue", [-3.4, 4.4]));
    return grid("The graph of the logarithm to base 2, through (1/2, -1), (1, 0), (2, 1), (4, 2) and (8, 3), hugging the y-axis.", it, { x: [-1, 10], y: [-4, 5], u: 26 });
  };
  var G8b = grid("The graphs of 2 to the x and the logarithm to base 2 are mirror images in the line y = x.",
    curve(EXPF(1, 2), -3, 3.2, "blue", [-3, 9]).concat(curve(LOGF(2), 0.04, 9, "orange", [-3, 9]), [{ seg: [[-3, -3], [9, 9]], c: "soft", dash: true }, dot(3, 8, "blue"), dot(8, 3, "orange")]),
    { x: [-3, 9], y: [-3, 9], u: 24 });
  LESSONS.push({
    title: "The graph of a logarithm", art: "pcexp",
    blurb: "Book 4.4 · The mirror image of an exponential graph.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $\\log_3 9$.", answer: 2, skill: "Evaluate a logarithm",
        near: [{ v: 3, fb: "$3^2 = 9$: the exponent is 2." }], hints: ["$3^? = 9$."], why: "$3^2 = 9$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the base $b$ so the graph of $y = \\log_b x$ passes through **both** orange dots, $(3, 1)$ and $(9, 2)$.",
        scene: { type: "sketch", x: [-1, 10], y: [-3, 4], u: 30, gate: true, pts: {},
          params: { b: { min: 1.5, max: 5, step: 0.5, v: 2, label: "$b$" } },
          draw: function (s) { return curve(LOGF(s.p.b), 0.04, 10, "blue", [-3, 4]).concat([dot(3, 1, "orange"), dot(9, 2, "orange"), { seg: [[0, -3], [0, 4]], c: "purple", dash: true }]); },
          readout: function (s) { var b = s.p.b, l3 = Math.log(3) / Math.log(b), l9 = Math.log(9) / Math.log(b); return "$y = \\log_{" + nm(b) + "} x$: $\\log_{" + nm(b) + "} 3 = " + f4(l3) + "$ " + (Math.abs(l3 - 1) < 1e-9 ? "✓" : "✗") + " &nbsp; $\\log_{" + nm(b) + "} 9 = " + f4(l9) + "$ " + (Math.abs(l9 - 2) < 1e-9 ? "✓" : "✗"); },
          goal: function (s) { return s.p.b === 3; } },
        gate: true, then: "$b = 3$: $\\log_3 3 = 1$ and $\\log_3 9 = 2$. Every log graph passes through $(1, 0)$ and $(b, 1)$ and hugs the **$y$-axis**, which it never touches." },
      { type: "learn", kicker: "The idea",
        prompt: "The graph of $f(x) = \\log_b x$ has **domain** $x > 0$ and **range** all real numbers. It has the **vertical asymptote** $x = 0$ and passes through $(1, 0)$ and $(b, 1)$. It climbs (slowly) when $b > 1$.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch $f(x) = \\log_2 x$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "x = 0", say: "You cannot take the log of 0 or a negative number: the $y$-axis is a vertical asymptote.", fig: G8(1) },
          { step: 2, m: "(1, 0) \\qquad (2, 1)", say: "$2^0 = 1$ and $2^1 = 2$, so $\\log_2 1 = 0$ and $\\log_2 2 = 1$.", fig: G8(2), ask: { prompt: "What is $\\log_2 1$?", answer: 0, options: [{ t: "$0$" }, { t: "$1$", fb: "$2^1 = 2$. To get 1 you need the exponent 0." }] } },
          { step: 2, m: "(\\tfrac{1}{2}, -1) \\quad (4, 2) \\quad (8, 3)", say: "More powers of 2: $2^{-1}$, $2^2$, $2^3$.", fig: G8(3) },
          { step: 3, m: "\\text{domain: } x > 0", say: "Draw the curve: it hugs the $y$-axis on the left.", fig: G8(4) },
          { step: 3, m: "\\text{range: all real } y", say: "It rises slowly, but without a limit." }] },
        gate: true, then: "Domain $(0, \\infty)$. Range $(-\\infty, \\infty)$. Asymptote $x = 0$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $g(x) = \\log_3 x$.",
        how: HOW_8, skill: "Graph of a logarithm",
        steps: [
          { step: 1, ask: "Which line does the graph hug?", type: "choice", answer: 0, options: [{ t: "the vertical line $x = 0$" }, { t: "the horizontal line $y = 0$", fb: "That is for an exponential graph. A log graph hugs the $y$-axis." }], m: "x = 0", say: "The $y$-axis." },
          { step: 2, ask: "$g(9) = \\log_3 9$.", type: "num", pre: "$g(9) =$", answer: 2, near: [{ v: 3, fb: "$3^2 = 9$." }], hint: "$3^? = 9$.", m: "(9, 2)", say: "Also $(1, 0)$ and $(3, 1)$." },
          { step: 2, ask: "$g\\left(\\tfrac{1}{3}\\right) = \\log_3 \\tfrac{1}{3}$.", type: "num", pre: "$g(\\frac{1}{3}) =$", answer: -1, near: [{ v: 1, fb: "$3^{-1} = \\frac{1}{3}$: the exponent is negative." }], hint: "$3^{-1}$.", m: "(\\tfrac{1}{3}, -1)", say: "Below the axis for $x < 1$." },
          { step: 3, ask: "What is the domain of $g$?", type: "choice", answer: 0, options: [{ t: "$x > 0$" }, { t: "all real numbers", fb: "You cannot take the log of 0 or a negative number." }], m: "x > 0", say: "Positive inputs only." }],
        why: "Asymptote, key points, curve." },
      { type: "multi", kicker: "On your own", prompt: "Select **all** the true statements about $y = \\log_5 x$.",
        options: [{ t: "It passes through $(1, 0)$", ok: true }, { t: "It passes through $(5, 1)$", ok: true }, { t: "Its domain is $x > 0$", ok: true }, { t: "It has a horizontal asymptote", fb: "The asymptote is **vertical**: $x = 0$." }, { t: "Its range is $y > 0$", fb: "The range is **all** real numbers: the outputs can be negative." }],
        skill: "Graph of a logarithm", hints: ["$\\log_5 1 = 0$ and $\\log_5 5 = 1$."], why: "Through $(1, 0)$ and $(5, 1)$; domain $x > 0$; asymptote $x = 0$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Mirror images.** The point $(3, 8)$ is on $y = 2^x$. Where is the matching point on $y = \\log_2 x$?",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "2^3 = 8", say: "The point $(3, 8)$ is on the graph of $2^x$." },
          { step: 2, m: "\\log_2 8 = 3", say: "The same fact in log form.", ask: { prompt: "So the point on the log graph is…", answer: 0, options: [{ t: "$(8, 3)$" }, { t: "$(3, 8)$", fb: "A log takes 8 to 3: input 8, output 3." }] } },
          { step: 3, m: "(3, 8) \\leftrightarrow (8, 3)", say: "Swap the coordinates. The two graphs are mirror images in the line $y = x$: **inverse functions**.", fig: G8b }] },
        gate: true, then: "$y = \\log_b x$ is the **inverse** of $y = b^x$." },
      { type: "choice", kicker: "Try it", prompt: "Which point is on the graph of $y = \\log_4 x$?",
        options: [{ t: "$(16, 2)$" }, { t: "$(2, 16)$", fb: "$(2, 16)$ is on $y = 4^x$, since $4^2 = 16$. On the log graph the coordinates are swapped." }, { t: "$(4, 16)$", fb: "$\\log_4 4 = 1$, so $(4, 1)$ is on the graph." }],
        answer: 0, skill: "Graph of a logarithm", hints: ["$4^2 = 16$ means $\\log_4 16 = 2$."], why: "$\\log_4 16 = 2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee says the domain of $f(x) = \\log_2 x$ is all real numbers. What is wrong?",
        options: [{ t: "Only positive inputs work: the domain is $x > 0$." }, { t: "Nothing is wrong.", fb: "Try $x = -4$: no power of 2 gives $-4$." }, { t: "The range is $x > 0$.", fb: "The inputs are $x$: that is the domain. The range is all real numbers." }],
        answer: 0, skill: "Graph of a logarithm", hints: ["What is $\\log_2(-4)$?"], why: "Domain $(0, \\infty)$." },
      { type: "num", kicker: "Use it", prompt: "A cell doubles every hour. After how many doublings are there 64 cells? On the graph of $y = \\log_2 x$ this is the height of the point with $x = 64$.", post: "doublings", answer: 6, skill: "Graph of a logarithm",
        near: [{ v: 32, fb: "That is half of 64. Count doublings: the exponent." }], hints: ["$2^? = 64$."], why: "$2^6 = 64$, so $\\log_2 64 = 6$." }
    ]
  });

  /* ============================================== 9 · Transformations of a logarithm graph */
  var HOW_9 = [["Domain", "The inside of a log must be positive: $x - h > 0$."],
               ["Asymptote", "The vertical asymptote is $x = h$."],
               ["Draw", "Move the key points and draw the curve towards the asymptote."]];
  var G9 = function (k) {
    var it = [];
    if (k >= 1) it.push({ seg: [[-3, -4], [-3, 4]], c: "orange", dash: true });
    if (k >= 2) [[1, 0], [2, 1], [4, 2]].forEach(function (p) { it.push(dot(p[0] - 3, p[1] - 1, "blue")); });
    if (k >= 3) it = it.concat(curve(function (x) { return x + 3 > 0 ? Math.log(x + 3) / Math.LN2 - 1 : NaN; }, -2.97, 7, "blue", [-4, 4]));
    return grid("The graph of the logarithm to base 2 of (x + 3), minus 1, with the asymptote x = -3 and the points (-2, -1), (-1, 0) and (1, 1).", it, { x: [-4, 7], y: [-4, 4], u: 28 });
  };
  LESSONS.push({
    title: "Shifting and flipping a logarithm graph", art: "pcexp",
    blurb: "Book 4.4 · The domain moves with the shift, because the inside of a log must be positive.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "For which values of $x$ is $x - 4 > 0$?",
        options: [{ t: "$x > 4$" }, { t: "$x < 4$", fb: "Add 4 to both sides: $x > 4$." }, { t: "$x > -4$", fb: "Add 4, do not subtract it." }],
        answer: 0, skill: "Inequalities", hints: ["Add 4 to both sides."], why: "$x > 4$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $a$, $h$ and $k$ so the blue graph lands on the dashed one. The formula is $y = a\\log_2(x - h) + k$. Watch the **purple line**.",
        scene: morph({ keys: ["lg"], x: [-3, 9], y: [-5, 5], u: 28, params: { a: { min: -2, max: 2, step: 1, v: 1, label: "$a$" }, h: { min: -3, max: 4, step: 1, v: 0, label: "$h$" }, k: { min: -3, max: 3, step: 1, v: 0, label: "$k$" } },
          tf: function (f, p) { return function (x) { return x - p.h > 0 ? p.a * Math.log(x - p.h) / Math.LN2 + p.k : NaN; }; }, map: function (pt, p) { return [pt[0] + p.h, p.a * pt[1] + p.k]; }, target: { a: -1, h: 1, k: 2 },
          extra: function (p) { return [{ seg: [[p.h, -5], [p.h, 5]], c: "purple", dash: true }]; },
          read: function (p) { var ins = p.h === 0 ? "x" : "x " + (p.h < 0 ? "+ " + nm(-p.h) : "- " + nm(p.h)), lead = p.a === 1 ? "" : p.a === -1 ? "-" : nm(p.a) + " ", c = p.k === 0 ? "" : p.k < 0 ? " - " + nm(-p.k) : " + " + nm(p.k); return p.a === 0 ? "$a = 0$: no log left, just the line $y = " + nm(p.k) + "$" : "$y = " + lead + "\\log_2(" + ins + ")" + c + "$: asymptote $x = " + nm(p.h) + "$, domain $x > " + nm(p.h) + "$"; } }),
        gate: true, then: "$y = -\\log_2(x - 1) + 2$. The purple line is the **vertical asymptote** $x = h$, and the graph lives to its right: the domain is $x > h$." },
      { type: "learn", kicker: "The idea",
        prompt: "In $f(x) = a\\log_b(x - h) + k$: the inside $x - h$ must be **positive**, so the **domain** is $x > h$ and the **vertical asymptote** is $x = h$. $k$ lifts the graph, and a negative $a$ flips it over the $x$-axis.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch $f(x) = \\log_2(x + 3) - 1$ and state its domain.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "x + 3 > 0", say: "The inside of a log must be positive." },
          { step: 1, m: "x > -3", say: "Subtract 3: this is the domain.", ask: { prompt: "What is the domain?", answer: 0, options: [{ t: "$x > -3$" }, { t: "$x > 3$", fb: "Subtract 3 from both sides: $x > -3$." }] } },
          { step: 2, m: "x = -3", say: "The vertical asymptote sits at the edge of the domain.", fig: G9(1) },
          { step: 3, m: "(1, 0) \\to (-2, -1)", say: "Left 3 (from $x + 3$), down 1.", fig: G9(2) },
          { step: 3, m: "(2, 1) \\to (-1, 0)", say: "Move the other key points the same way." },
          { step: 3, m: "(4, 2) \\to (1, 1)", say: "And the last one." },
          { step: 3, m: "\\text{draw towards } x = -3", say: "Hug the dashed line on the left and rise slowly on the right.", fig: G9(3) }] },
        gate: true, then: "Domain $(-3, \\infty)$. Asymptote $x = -3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now find the domain of $g(x) = \\log_3(5 - x)$. A flip is hiding in it.",
        how: HOW_9, skill: "Domain of a logarithm",
        steps: [
          { step: 1, ask: "The inside must be positive. Which inequality is that?", type: "choice", answer: 0, options: [{ t: "$5 - x > 0$" }, { t: "$x - 5 > 0$", fb: "The inside is written $5 - x$." }], m: "5 - x > 0", say: "Inside $> 0$." },
          { step: 1, ask: "Solve $5 - x > 0$. Add $x$ to both sides: $5 > x$. So…", type: "choice", answer: 0, options: [{ t: "$x < 5$" }, { t: "$x > 5$", fb: "$5 > x$ says $x$ is **smaller** than 5." }], m: "x < 5", say: "The domain is to the **left** of 5." },
          { step: 2, ask: "Where is the vertical asymptote? $x =$", type: "num", pre: "$x =$", answer: 5, near: [{ v: -5, fb: "The inside is zero at $x = 5$." }], hint: "Set $5 - x = 0$.", m: "x = 5", say: "At the edge of the domain." },
          { step: 3, ask: "On which side of the asymptote $x = 5$ is the graph drawn?", type: "choice", answer: 0, options: [{ t: "to the left, where $x < 5$" }, { t: "to the right, where $x > 5$", fb: "The domain is $x < 5$: the left side." }], m: "\\text{graph to the left of } x = 5", say: "Hugging the asymptote from the left." }],
        why: "Inside positive, solve, asymptote, draw." },
      { type: "choice", kicker: "On your own", prompt: "What is the domain of $f(x) = \\ln(2x - 6)$?",
        options: [{ t: "$x > 3$" }, { t: "$x > -3$", fb: "Solve $2x - 6 > 0$: add 6, then divide by 2." }, { t: "$x > 6$", fb: "$2x > 6$ gives $x > 3$ after dividing by 2." }],
        answer: 0, skill: "Domain of a logarithm", hints: ["$2x - 6 > 0$."], why: "$2x > 6$, so $x > 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A stretch.** Find the asymptote and two points of $f(x) = 2\\log_2(x - 1) + 3$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "x - 1 > 0 \\ \\Rightarrow \\ x > 1", say: "Domain: $x > 1$." },
          { step: 2, m: "x = 1", say: "The vertical asymptote." },
          { step: 3, m: "f(2) = 2\\log_2(1) + 3 = 3", say: "$\\log_2 1 = 0$, so the point is $(2, 3)$.", ask: { prompt: "What is $\\log_2 1$?", answer: 0, options: [{ t: "$0$" }, { t: "$1$", fb: "$2^0 = 1$, so $\\log_2 1 = 0$." }] } },
          { step: 3, m: "f(3) = 2\\log_2(2) + 3 = 5", say: "$\\log_2 2 = 1$, so $(3, 5)$. The factor 2 stretches the graph upward." }] },
        gate: true, then: "Asymptote $x = 1$; points $(2, 3)$ and $(3, 5)$." },
      { type: "num", kicker: "Try it", prompt: "What is the vertical asymptote of $f(x) = \\log_5(x + 4)$?", pre: "$x =$", answer: -4, skill: "Domain of a logarithm",
        near: [{ v: 4, fb: "Set $x + 4 = 0$: $x = -4$." }], hints: ["Where is the inside zero?"], why: "$x + 4 = 0$ at $x = -4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rae says the domain of $f(x) = \\log_2(x - 3)$ is $x \\ge 3$. What is wrong?",
        options: [{ t: "At $x = 3$ the inside is 0, and $\\log_2 0$ does not exist: the domain is $x > 3$." }, { t: "Nothing is wrong.", fb: "$2^? = 0$ has no answer, so $x = 3$ is not allowed." }, { t: "The domain is $x < 3$.", fb: "The inside $x - 3$ must be **positive**, so $x$ is larger than 3." }],
        answer: 0, skill: "Domain of a logarithm", hints: ["What is $\\log_2 0$?"], why: "Domain $(3, \\infty)$." },
      { type: "num", kicker: "Use it", prompt: "A skill score after $t$ weeks of practice is $S(t) = 40 + 10\\log_2 t$, for $t \\geq 1$. What is the score after 8 weeks?", post: "points", answer: 70, skill: "Evaluate a logarithm",
        near: [{ v: 120, fb: "$\\log_2 8 = 3$, not 8. Then $40 + 10 \\cdot 3$." }], hints: ["$\\log_2 8 = 3$."], why: "$40 + 10 \\cdot 3 = 70$." }
    ]
  });
  /* ============================================ 10 · The laws of logarithms */
  var HOW_10 = [["Spot the rule", "Product inside: add. Quotient inside: subtract. Power inside: multiply."],
                ["Apply it", "Expand one log into several, or condense several into one."],
                ["Check", "The base stays the same and every inside stays positive."]];
  LESSONS.push({
    title: "The laws of logarithms", art: "pcexp",
    blurb: "Book 4.5 · Because a log is an exponent, multiplying inside becomes adding outside.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Simplify $2^3 \\cdot 2^4$ as one power of 2. What is the exponent?", answer: 7, skill: "Exponent rules",
        near: [{ v: 12, fb: "When you multiply powers of one base, you **add** the exponents: $3 + 4$." }], hints: ["$2^3 \\cdot 2^4 = 2^{3+4}$."], why: "$2^7$." },
      { type: "learn", kicker: "Explore",
        prompt: "Numbers are powers of 2, so each log is an exponent on the number line. Slide $p$ and $q$ for the numbers $2^p$ and $2^q$. See what **multiplying**, **dividing** and **raising to a power** do to the logs. Try **all three**.",
        scene: { type: "sketch", x: [-4, 17], y: [-0.9, 1.5], u: 21, uy: 40, w: 470, grid: false, gate: true, pts: {},
          chips: { o: { label: "Do", v: "x", opts: [["x", "multiply"], ["d", "divide"], ["p", "power"]] } },
          params: { p: { min: 1, max: 4, step: 1, v: 2, label: "$p$" }, q: { min: 1, max: 4, step: 1, v: 3, label: "$q$" } },
          draw: function (s) {
            var p = s.p.p, q = s.p.q, o = s.c.o, it = [{ seg: [[-3.5, 0], [16.5, 0]], c: "soft" }], k, j;
            for (k = -3; k <= 16; k++) { it.push({ seg: [[k, -0.08], [k, 0.08]], c: "soft" }); if (k % 2 === 0) it.push({ text: String(k).replace("-", "−"), at: [k, -0.4], c: "soft" }); }
            if (o === "x") it.push({ seg: [[0, 0.5], [p, 0.5]], c: "blue" }, { seg: [[p, 0.5], [p + q, 0.5]], c: "orange" }, { pt: [p + q, 0], c: "green" });
            else if (o === "d") it.push({ seg: [[0, 0.5], [p, 0.5]], c: "blue" }, { seg: [[p - q, 0.9], [p, 0.9]], c: "orange" }, { pt: [p - q, 0], c: "green" });
            else { for (j = 0; j < q; j++) it.push({ seg: [[j * p, 0.5], [(j + 1) * p, 0.5]], c: j % 2 ? "orange" : "blue" }); it.push({ pt: [p * q, 0], c: "green" }); }
            return it;
          },
          readout: function (s) {
            var p = s.p.p, q = s.p.q, o = s.c.o, n = Math.min(Object.keys(s.seen.o).length, 3);
            var t = o === "x" ? "$2^{" + p + "} \\cdot 2^{" + q + "} = 2^{" + (p + q) + "}$: the logs $" + p + "$ and $" + q + "$ **add**, to $" + (p + q) + "$"
              : o === "d" ? "$2^{" + p + "} \\div 2^{" + q + "} = 2^{" + nm(p - q) + "}$: the logs **subtract**, $" + p + " - " + q + " = " + nm(p - q) + "$"
              : "$\\left(2^{" + p + "}\\right)^{" + q + "} = 2^{" + (p * q) + "}$: $" + q + "$ copies of $" + p + "$ **multiply**, to $" + (p * q) + "$";
            return t + "<br>Tried " + n + " of 3";
          },
          goal: function (s) { return Object.keys(s.seen.o).length >= 3; } },
        gate: true, then: "A log is an exponent: multiplying numbers **adds** their logs, dividing **subtracts** them, and a power **multiplies** the log. These are the **laws of logarithms**." },
      { type: "learn", kicker: "The idea",
        prompt: "**Product:** $\\log_b(MN) = \\log_b M + \\log_b N$. **Quotient:** $\\log_b \\frac{M}{N} = \\log_b M - \\log_b N$. **Power:** $\\log_b M^n = n\\log_b M$. Use them left to right to **expand**, right to left to **condense**.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Expand $\\log_2(8x^3)$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "\\log_2 (8 \\cdot x^3)", say: "A product inside: split it into a sum." },
          { step: 2, m: "= \\log_2 8 + \\log_2 x^3", say: "Product law: add the logs." },
          { step: 2, m: "= \\log_2 8 + 3\\log_2 x", say: "Power law: the exponent 3 comes down in front.", ask: { prompt: "Where does the exponent go?", answer: 0, options: [{ t: "In front, as a multiplier" }, { t: "Inside, unchanged", fb: "The power law moves it **out**: $\\log_2 x^3 = 3\\log_2 x$." }] } },
          { step: 3, m: "= 3 + 3\\log_2 x", say: "$\\log_2 8 = 3$ since $2^3 = 8$. The base is still 2 and $x > 0$." }] },
        gate: true, then: "$\\log_2(8x^3) = 3 + 3\\log_2 x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now **condense** $2\\log_3 x + \\log_3 5$ into one log.",
        how: HOW_10, skill: "Laws of logarithms",
        steps: [
          { step: 1, ask: "Which law turns $2\\log_3 x$ into $\\log_3 x^2$?", type: "choice", answer: 0, options: [{ t: "the power law, backwards" }, { t: "the product law", fb: "There is no product here: just a number multiplying a log." }], m: "\\log_3 x^2 + \\log_3 5", say: "Move the 2 up as an exponent." },
          { step: 2, ask: "Adding two logs of the same base means…", type: "choice", answer: 0, options: [{ t: "multiplying what is inside: $\\log_3(5x^2)$" }, { t: "adding what is inside: $\\log_3(x^2 + 5)$", fb: "The product law: a **sum** of logs is the log of a **product**." }], m: "\\log_3 (5x^2)", say: "One log." },
          { step: 3, ask: "Check by expanding $\\log_3(5x^2) = \\log_3 5 + ?\\log_3 x$. What is $?$", type: "num", pre: "$? =$", answer: 2, near: [{ v: 5, fb: "5 stays inside its own log. The exponent on $x$ is 2." }], hint: "The exponent on $x$.", m: "\\log_3 5 + 2\\log_3 x", say: "We are back where we began." }],
        why: "Spot the law, apply it, check." },
      { type: "num", kicker: "On your own", prompt: "Evaluate $\\log_5 50 - \\log_5 2$. (Condense first.)", pre: "value =", answer: 2, skill: "Laws of logarithms",
        near: [{ v: 48, fb: "$\\log_5 50 - \\log_5 2$ is a difference of **logs**, not of numbers: it is $\\log_5 \\frac{50}{2}$." }, { v: 25, fb: "That is $\\frac{50}{2}$. The answer is the **log** of it." }], hints: ["$\\log_5 \\frac{50}{2} = \\log_5 25$."], why: "$\\log_5 25 = 2$ because $5^2 = 25$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A root and a quotient.** Expand $\\ln \\dfrac{\\sqrt{x}}{y^2}$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "\\ln \\frac{\\sqrt{x}}{y^2}", say: "Take it one law at a time. First the root." },
          { step: 1, m: "= \\ln \\frac{x^{1/2}}{y^2}", say: "A root is a power: $\\sqrt{x} = x^{1/2}$.", ask: { prompt: "What is $\\sqrt{x}$ as a power?", answer: 0, options: [{ t: "$x^{1/2}$" }, { t: "$x^{2}$", fb: "Squaring is not the same as the square root. The root is the power $\\frac{1}{2}$." }] } },
          { step: 2, m: "= \\ln x^{1/2} - \\ln y^2", say: "A quotient inside: subtract." },
          { step: 2, m: "= \\tfrac{1}{2}\\ln x - 2\\ln y", say: "Power law on each." },
          { step: 3, m: "x > 0, \\ y > 0", say: "Every inside must be positive for the logs to exist." }] },
        gate: true, then: "$\\ln \\frac{\\sqrt{x}}{y^2} = \\frac{1}{2}\\ln x - 2\\ln y$." },
      { type: "choice", kicker: "Try it", prompt: "Which expression equals $\\log(x^2 y)$?",
        options: [{ t: "$2\\log x + \\log y$" }, { t: "$2\\log x \\cdot \\log y$", fb: "A product inside becomes a **sum** outside." }, { t: "$\\log 2x + \\log y$", fb: "The 2 is an exponent on $x$ only: it comes out in front of $\\log x$." }],
        answer: 0, skill: "Laws of logarithms", hints: ["Product law, then power law."], why: "$\\log x^2 + \\log y = 2\\log x + \\log y$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben writes $\\log(a + b) = \\log a + \\log b$. What is wrong?",
        options: [{ t: "The product law splits $\\log(ab)$, not $\\log(a + b)$. There is no law for a sum." }, { t: "Nothing is wrong.", fb: "Try $a = b = 10$: $\\log 20 \\approx 1.30$ but $\\log 10 + \\log 10 = 2$." }, { t: "It should be $\\log a \\cdot \\log b$.", fb: "A product of logs is not the log of anything simple." }],
        answer: 0, skill: "Laws of logarithms", hints: ["Test it with $a = b = 10$."], why: "$\\log(ab) = \\log a + \\log b$ only for products." },
      { type: "num", kicker: "Use it", prompt: "Evaluate $\\log 4 + \\log 25$.", pre: "value =", answer: 2, skill: "Laws of logarithms",
        near: [{ v: 29, fb: "Add the logs, not the numbers. $\\log 4 + \\log 25 = \\log(4 \\cdot 25)$." }], hints: ["Condense: $\\log(4 \\cdot 25) = \\log 100$."], why: "$\\log 100 = 2$." }
    ]
  });

  /* ============================================ 11 · Change of base */
  var HOW_11 = [["Pick a key", "Choose LOG or LN: either works."],
                ["Divide", "$\\log_b M = \\dfrac{\\log M}{\\log b}$: the log of the number over the log of the base."],
                ["Check", "Raise the base to your answer: do you get the number back?"]];
  var G11 = grid("The graph of 5 to the x, with the point (1.544, 12) marked: the exponent that gives 12.",
    curve(EXPF(1, 5), 0, 2.4, "blue", [0, 30]).concat([{ seg: [[0, 12], [1.544, 12]], c: "orange", dash: true }, { seg: [[1.544, 0], [1.544, 12]], c: "orange", dash: true }, dot(1.544, 12, "orange")]),
    { x: [0, 3], y: [0, 30], u: 70, uy: 8, gy: 5, stepY: 5 });
  LESSONS.push({
    title: "Change of base", art: "pcexp",
    blurb: "Book 4.5 · Your calculator only has LOG and LN. One formula reaches every other base.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Use a calculator: $\\ln 10 \\div \\ln 2$. Round to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", answer: 3.3219, tol: 0.0051, calc: true, skill: "Calculator logs",
        near: [{ v: 0.3, tol: 0.01, fb: "That is $\\ln 2 \\div \\ln 10$. Divide in the other order." }], hints: ["$\\ln 10 \\approx 2.303$ and $\\ln 2 \\approx 0.693$."], why: "$2.3026 \\div 0.6931 \\approx 3.32$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue graph is $y = b^x$. The orange dot marks the exponent $x = \\log_b N$ that gives $N$. Pick a base and a number, and compare the ratio of **logs** with the ratio of **natural logs**. Try at least **three bases** and **two numbers**.",
        scene: { type: "sketch", x: [0, 6], y: [0, 50], u: 44, uy: 6, gy: 10, stepY: 10, w: 300, gate: true, pts: {},
          chips: { b: { label: "Base", v: "2", opts: [["2", "2"], ["3", "3"], ["5", "5"], ["7", "7"]] }, n: { label: "Number", v: "20", opts: [["10", "10"], ["20", "20"], ["50", "50"]] } },
          draw: function (s) { var b = +s.c.b, N = +s.c.n, L = Math.log(N) / Math.log(b); return curve(EXPF(1, b), 0, 6, "blue", [0, 50]).concat([{ seg: [[0, N], [L, N]], c: "orange", dash: true }, { seg: [[L, 0], [L, N]], c: "orange", dash: true }, dot(L, N, "orange")]); },
          readout: function (s) { var b = +s.c.b, N = +s.c.n, L = Math.log(N) / Math.log(b); return "$\\log_{" + b + "} " + N + " = \\dfrac{\\log " + N + "}{\\log " + b + "} = \\dfrac{" + f4(Math.log10(N), 3) + "}{" + f4(Math.log10(b), 3) + "} = " + f4(L, 3) + "$<br>$\\dfrac{\\ln " + N + "}{\\ln " + b + "} = \\dfrac{" + f4(Math.log(N), 3) + "}{" + f4(Math.log(b), 3) + "} = " + f4(L, 3) + "$ — the same<br>Bases " + Math.min(Object.keys(s.seen.b).length, 3) + " of 3 · numbers " + Math.min(Object.keys(s.seen.n).length, 2) + " of 2"; },
          goal: function (s) { return Object.keys(s.seen.b).length >= 3 && Object.keys(s.seen.n).length >= 2; } },
        gate: true, then: "Whether you use LOG or LN, the ratio is the same: $\\log_b N = \\dfrac{\\log N}{\\log b} = \\dfrac{\\ln N}{\\ln b}$. Now **any** base is a calculator away." },
      { type: "learn", kicker: "The idea",
        prompt: "**Change of base:** $\\log_b M = \\dfrac{\\ln M}{\\ln b} = \\dfrac{\\log M}{\\log b}$. The **number** goes on top and the **base** on the bottom. Check by raising the base to the answer.",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\log_5 12$ to 4 decimal places.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "\\log_5 12", say: "We want the exponent that turns 5 into 12." },
          { step: 1, m: "= \\frac{\\ln 12}{\\ln 5}", say: "Use LN on the number and on the base.", ask: { prompt: "Which log goes on top?", answer: 0, options: [{ t: "The log of the number, 12" }, { t: "The log of the base, 5", fb: "The number goes on top, the base on the bottom." }] } },
          { step: 2, m: "= \\frac{2.4849}{1.6094}", say: "Two calculator values." },
          { step: 2, m: "\\approx 1.5440", say: "Divide." },
          { step: 3, m: "5^{1.544} \\approx 12", say: "Check: raise the base to the answer and get the number back.", fig: G11 }] },
        gate: true, then: "$\\log_5 12 \\approx 1.5440$." },
      { type: "guided", kicker: "Together",
        prompt: "Now find $\\log_4 30$ to 3 decimal places.",
        how: HOW_11, skill: "Change of base",
        steps: [
          { step: 1, ask: "Which is the correct set-up?", type: "choice", answer: 0, options: [{ t: "$\\dfrac{\\ln 30}{\\ln 4}$" }, { t: "$\\dfrac{\\ln 4}{\\ln 30}$", fb: "The number, 30, goes on top." }, { t: "$\\dfrac{30}{4}$", fb: "A log is not a quotient of the numbers. Take the log of each." }], m: "\\frac{\\ln 30}{\\ln 4}", say: "Number over base." },
          { step: 2, ask: "Calculate it. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", type: "num", pre: "$\\approx$", answer: 2.4534, tol: 0.00051, calc: true, near: [{ v: 7.5, fb: "That is $\\frac{30}{4}$. Take the logs first." }], hint: "$3.4012 \\div 1.3863$.", m: "\\approx 2.453", say: "About 2.453." },
          { step: 3, ask: "Is that sensible? $4^2 = 16$ and $4^3 = 64$, and 30 is between them. So $\\log_4 30$ is between…", type: "choice", answer: 0, options: [{ t: "2 and 3" }, { t: "3 and 4", fb: "$4^3 = 64$ is already bigger than 30." }], m: "2 < 2.453 < 3", say: "It passes the check." }],
        why: "Pick a key, divide, check." },
      { type: "num", kicker: "On your own", prompt: "Find $\\log_2 100$ to 3 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$\\log_2 100 \\approx$", answer: 6.6439, tol: 0.00051, calc: true, skill: "Change of base",
        near: [{ v: 50, fb: "That is $100 \\div 2$. Take the logs first." }, { v: 0.1505, tol: 0.001, fb: "That is $\\ln 2 \\div \\ln 100$: upside down." }], hints: ["$\\frac{\\ln 100}{\\ln 2}$."], why: "$4.6052 \\div 0.6931 \\approx 6.644$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**An exponent to find.** Solve $2^x = 20$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "2^x = 20", say: "$x$ is the exponent that turns 2 into 20: a log, base 2." },
          { step: 1, m: "x = \\log_2 20", say: "Write it as a log.", ask: { prompt: "So $x$ equals…", answer: 0, options: [{ t: "$\\log_2 20$" }, { t: "$\\log_{20} 2$", fb: "The base is 2 and the number is 20." }] } },
          { step: 2, m: "x = \\frac{\\ln 20}{\\ln 2}", say: "Change of base." },
          { step: 3, m: "x \\approx 4.3219", say: "Check: $2^4 = 16$ and $2^5 = 32$, and 20 is between." }] },
        gate: true, then: "$x = \\log_2 20 \\approx 4.3219$." },
      { type: "choice", kicker: "Try it", prompt: "Which expression equals $\\log_7 3$?",
        options: [{ t: "$\\dfrac{\\ln 3}{\\ln 7}$" }, { t: "$\\dfrac{\\ln 7}{\\ln 3}$", fb: "The number, 3, goes on top." }, { t: "$\\dfrac{3}{7}$", fb: "Take the logs of the numbers; do not just divide them." }],
        answer: 0, skill: "Change of base", hints: ["Number on top, base underneath."], why: "$\\log_7 3 = \\frac{\\ln 3}{\\ln 7}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee computes $\\log_5 12$ as $\\dfrac{\\log 5}{\\log 12} \\approx 0.648$. What is wrong?",
        options: [{ t: "It is upside down: $\\log_5 12 = \\dfrac{\\log 12}{\\log 5} \\approx 1.544$." }, { t: "Nothing is wrong.", fb: "Check: $5^{0.648} \\approx 2.8$, not 12." }, { t: "She should use LN, not LOG.", fb: "Either works, as long as the number is on top." }],
        answer: 0, skill: "Change of base", hints: ["Check: $5^{0.648}$."], why: "Number over base." },
      { type: "num", kicker: "Use it", prompt: "Money grows 7% a year, so it multiplies by 1.07 each year. After $t$ years it has doubled when $1.07^t = 2$. Find $t$ to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$t \\approx$", post: "years", answer: 10.2448, tol: 0.005, calc: true, skill: "Change of base",
        near: [{ v: 0.07, tol: 0.01, fb: "Take the log of both numbers: $t = \\log_{1.07} 2$." }, { v: 14.29, tol: 0.01, fb: "That is $1 \\div 0.07$, which is not right: use $\\log_{1.07} 2$." }], hints: ["$t = \\log_{1.07} 2 = \\frac{\\ln 2}{\\ln 1.07}$."], why: "$0.6931 \\div 0.06766 \\approx 10.24$ years." }
    ]
  });
  /* ============================================ 12 · Solving exponential equations: same base */
  var HOW_12 = [["Same base", "Rewrite both sides as powers of the same base."],
                ["Equate", "If $b^m = b^n$ then $m = n$."],
                ["Solve", "Solve for the variable, then check."]];
  LESSONS.push({
    title: "Exponential equations: the same base", art: "pcexp",
    blurb: "Book 4.6 · If two powers of the same base are equal, their exponents are equal.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Write 64 as a power of 2. What is the exponent?", pre: "$2^{?} = 64$", answer: 6, skill: "Powers",
        near: [{ v: 32, fb: "$2^5 = 32$. One more doubling makes 64." }], hints: ["2, 4, 8, 16, 32, 64: count them."], why: "$2^6 = 64$." },
      { type: "learn", kicker: "Explore",
        prompt: "Solve $4^x = 8$ by sliding $x$ until the point on the blue graph reaches the orange line $y = 8$. The answer is not a whole number!",
        scene: { type: "sketch", x: [0, 3], y: [0, 70], u: 80, uy: 4.2, gy: 10, stepY: 10, gate: true, pts: {},
          params: { x: { min: 0, max: 3, step: 0.25, v: 0, label: "$x$" } },
          draw: function (s) { var x = s.p.x; return curve(EXPF(1, 4), 0, 3, "blue", [0, 70]).concat([{ seg: [[0, 8], [3, 8]], c: "orange", dash: true }, { seg: [[x, 0], [x, Math.pow(4, x)]], c: "soft", dash: true }, dot(x, Math.pow(4, x), Math.pow(4, x) === 8 ? "green" : "blue")]); },
          readout: function (s) { var x = s.p.x, v = Math.pow(4, x); return "$4^{" + nm(x) + "} = " + nm(f4(v, 2)) + "$" + (v === 8 ? " — **equal to 8** ✓" : " (the target is 8)"); },
          goal: function (s) { return s.p.x === 1.5; } },
        gate: true, then: "$x = 1.5$. Why? $4 = 2^2$ and $8 = 2^3$, so $4^x = 2^{2x}$ and $2^{2x} = 2^3$. **Same base**, so the exponents match: $2x = 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "An exponential function is **one-to-one**: if $b^m = b^n$ then $m = n$. So rewrite both sides as powers of the **same base** (often a small number such as 2, 3, 5 or 10), then set the exponents equal and solve.",
        scene: { type: "method", how: HOW_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $8^{x+2} = 16^x$.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "8 = 2^3, \\ \\ 16 = 2^4", say: "Both are powers of 2." },
          { step: 1, m: "\\left(2^3\\right)^{x+2} = \\left(2^4\\right)^x", say: "Replace 8 and 16." },
          { step: 2, m: "2^{3(x+2)} = 2^{4x}", say: "A power of a power: multiply the exponents. Now both sides are powers of 2.", ask: { prompt: "What next, if $2^m = 2^n$?", answer: 0, options: [{ t: "Set the exponents equal: $m = n$" }, { t: "Set the bases equal", fb: "The bases are already the same. The exponents must match." }] } },
          { step: 2, m: "3x + 6 = 4x", say: "$3(x + 2) = 3x + 6$." },
          { step: 3, m: "x = 6", say: "Check: $8^8 = 2^{24}$ and $16^6 = 2^{24}$." }] },
        gate: true, then: "$x = 6$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $25^x = 125$.",
        how: HOW_12, skill: "Exponential equations",
        steps: [
          { step: 1, ask: "$25 = 5^2$ and $125 = 5^3$. Which number is the common base?", type: "num", pre: "base =", answer: 5, near: [{ v: 25, fb: "25 is a power of 5; the base that both share is 5." }], hint: "$5 \\cdot 5 = 25$.", m: "\\left(5^2\\right)^x = 5^3", say: "Same base 5." },
          { step: 2, ask: "$5^{2x} = 5^3$. The exponents are equal: $2x =$", type: "num", pre: "$2x =$", answer: 3, near: [{ v: 5, fb: "Set the exponents equal: $2x = 3$." }], hint: "The exponent on the right.", m: "2x = 3", say: "Exponents match." },
          { step: 3, ask: "Solve $2x = 3$. (A decimal is fine.)", type: "num", pre: "$x =$", answer: 1.5, tol: 1e-9, shown: "3/2", near: [{ v: 6, fb: "Divide by 2, do not multiply." }], hint: "Divide by 2.", m: "x = \\tfrac{3}{2}", say: "$25^{1.5} = 5^3 = 125$." }],
        why: "Same base, equate, solve." },
      { type: "num", kicker: "On your own", prompt: "Solve $3^{2x-1} = 81$.", pre: "$x =$", answer: 2.5, tol: 1e-9, skill: "Exponential equations",
        near: [{ v: 4, fb: "$81 = 3^4$, so $2x - 1 = 4$. That is not yet $x$: add 1 and divide by 2." }, { v: 2, fb: "$2x - 1 = 4$ gives $2x = 5$." }], hints: ["$81 = 3^4$."], why: "$2x - 1 = 4$, so $x = 2.5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A fraction as the base.** Solve $\\left(\\dfrac{1}{2}\\right)^x = 16$.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "\\tfrac{1}{2} = 2^{-1}, \\ \\ 16 = 2^4", say: "A fraction is a negative power." },
          { step: 1, m: "\\left(2^{-1}\\right)^x = 2^4", say: "Both sides are powers of 2: $\\left(2^{-1}\\right)^x = 2^{-x}$.", ask: { prompt: "What is $\\left(2^{-1}\\right)^x$?", answer: 0, options: [{ t: "$2^{-x}$" }, { t: "$2^{x-1}$", fb: "A power of a power multiplies the exponents: $-1 \\cdot x$." }] } },
          { step: 2, m: "-x = 4", say: "Exponents equal." },
          { step: 3, m: "x = -4", say: "Check: $\\left(\\frac{1}{2}\\right)^{-4} = 2^4 = 16$." }] },
        gate: true, then: "$x = -4$: a decaying function reaches 16 at a negative $x$." },
      { type: "num", kicker: "Try it", prompt: "Solve $5^x = \\dfrac{1}{125}$.", pre: "$x =$", answer: -3, skill: "Exponential equations",
        near: [{ v: 3, fb: "$5^3 = 125$. To get $\\frac{1}{125}$ you need a **negative** exponent." }], hints: ["$\\frac{1}{125} = 5^{-3}$."], why: "$5^{-3} = \\frac{1}{125}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To solve $9^x = 27$, Ned writes $3^{2x} = 3^3$ and then $x = 3 - 2 = 1$. What is wrong?",
        options: [{ t: "The exponents are equal: $2x = 3$, so divide by 2: $x = 1.5$." }, { t: "Nothing is wrong.", fb: "Check: $9^1 = 9$, not 27." }, { t: "$x$ should be $3 + 2 = 5$.", fb: "The $2$ multiplies $x$: it is $2x = 3$." }],
        answer: 0, skill: "Exponential equations", hints: ["Check $9^1$."], why: "$x = \\frac{3}{2}$." },
      { type: "num", kicker: "Use it", prompt: "An investment doubles every year. After $t$ years it has grown 64 times: $2^t = 64$. How many years is that?", post: "years", answer: 6, skill: "Exponential equations",
        near: [{ v: 32, fb: "That is half of 64. Match exponents: $2^t = 2^6$." }], hints: ["$64 = 2^6$."], why: "$2^6 = 64$." }
    ]
  });

  /* ============================================ 13 · Exponential equations: using logarithms */
  var HOW_13 = [["Isolate", "Get the exponential term alone on one side."],
                ["Take the log", "Take $\\ln$ (or $\\log$) of both sides and bring the exponent down."],
                ["Solve", "Divide to find the variable. Round only at the end."]];
  LESSONS.push({
    title: "Exponential equations: using logarithms", art: "pcexp",
    blurb: "Book 4.6 · When the bases will not match, take a log of both sides.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Use the power law: $\\ln 2^x = x \\ln 2$. If $x = 3$, what is $\\ln 2^3 \\div \\ln 2$?", answer: 3, skill: "Laws of logarithms",
        near: [{ v: 8, fb: "$2^3 = 8$, but the question divides the **logs**: $\\frac{3\\ln 2}{\\ln 2}$." }], hints: ["$\\ln 2^3 = 3\\ln 2$."], why: "$\\frac{3\\ln 2}{\\ln 2} = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Try to solve $2^x = 10$ by sliding $x$. How close can you get? Land within about **0.3** of the orange line.",
        scene: { type: "sketch", x: [0, 5], y: [0, 32], u: 62, uy: 9, gy: 4, stepY: 4, gate: true, pts: {},
          params: { x: { min: 0, max: 5, step: 0.1, v: 0, label: "$x$" } },
          draw: function (s) { var x = s.p.x, v = Math.pow(2, x); return curve(EXPF(1, 2), 0, 5, "blue", [0, 32]).concat([{ seg: [[0, 10], [5, 10]], c: "orange", dash: true }, { seg: [[x, 0], [x, v]], c: "soft", dash: true }, dot(x, v, Math.abs(v - 10) < 0.3 ? "green" : "blue")]); },
          readout: function (s) { var x = s.p.x, v = Math.pow(2, x); return "$2^{" + nm(f4(x, 1)) + "} = " + nm(f4(v, 2)) + "$" + (Math.abs(v - 10) < 0.3 ? " — very close to 10 ✓" : " (the target is 10)"); },
          goal: function (s) { return Math.abs(Math.pow(2, s.p.x) - 10) < 0.3; } },
        gate: true, then: "About $x = 3.3$, but no whole number or simple fraction gives exactly 10. The exact answer is a **logarithm**: $x = \\log_2 10 \\approx 3.32$." },
      { type: "learn", kicker: "The idea",
        prompt: "To solve $ab^x = c$: **isolate** the exponential, then take $\\ln$ of both sides. The **power law** brings the exponent down, $\\ln b^x = x\\ln b$, so you can divide. Keep exact values until the last step.",
        scene: { type: "method", how: HOW_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $3 \\cdot 2^x = 30$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "2^x = 10", say: "Divide both sides by 3: the exponential is alone." },
          { step: 2, m: "\\ln 2^x = \\ln 10", say: "Take $\\ln$ of both sides." },
          { step: 2, m: "x\\ln 2 = \\ln 10", say: "The power law brings the exponent $x$ down in front.", ask: { prompt: "What does the power law do with $x$?", answer: 0, options: [{ t: "Moves it in front: $x \\ln 2$" }, { t: "Cancels it", fb: "It does not cancel: it becomes a multiplier." }] } },
          { step: 3, m: "x = \\frac{\\ln 10}{\\ln 2}", say: "Divide by $\\ln 2$." },
          { step: 3, m: "x \\approx 3.3219", say: "Check: $2^{3.3219} \\approx 10$, and $3 \\cdot 10 = 30$." }] },
        gate: true, then: "$x = \\dfrac{\\ln 10}{\\ln 2} \\approx 3.3219$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $e^{0.5x} = 20$.",
        how: HOW_13, skill: "Exponential equations with logs",
        steps: [
          { step: 1, ask: "Is the exponential already alone?", type: "choice", answer: 0, options: [{ t: "Yes: $e^{0.5x} = 20$" }, { t: "No: divide by $e$", fb: "$e^{0.5x}$ is a single term. Nothing is multiplying it." }], m: "e^{0.5x} = 20", say: "Ready to take the log." },
          { step: 2, ask: "Take $\\ln$ of both sides. The left becomes…", type: "choice", answer: 0, options: [{ t: "$0.5x$, because $\\ln e^u = u$" }, { t: "$e \\cdot 0.5x$", fb: "$\\ln$ and $e^{\\ ?}$ undo each other: $\\ln e^u = u$." }], m: "0.5x = \\ln 20", say: "The natural log undoes $e$." },
          { step: 3, ask: "$x = 2\\ln 20$. Calculate it (type it as an expression).", type: "num", pre: "$x \\approx$", answer: 5.9915, tol: 0.0006, calc: true, near: [{ v: 2.9957, tol: 0.0003, fb: "That is $\\ln 20$. Multiply by 2: $x = \\frac{\\ln 20}{0.5}$." }], hint: "$\\ln 20 \\approx 2.9957$.", m: "x \\approx 5.9915", say: "Check: $e^{2.9957} = 20$." }],
        why: "Isolate, take the log, solve." },
      { type: "num", kicker: "On your own", prompt: "Solve $7^x = 100$ to 3 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$x \\approx$", answer: 2.3666, tol: 0.00051, calc: true, skill: "Exponential equations with logs",
        near: [{ v: 14.29, tol: 0.001, fb: "That is $100 \\div 7$. Take the logs first." }, { v: 0.4225, tol: 0.001, fb: "That is $\\frac{\\ln 7}{\\ln 100}$: upside down." }], hints: ["$x = \\frac{\\ln 100}{\\ln 7}$."], why: "$4.6052 \\div 1.9459 \\approx 2.3666$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**The variable on both sides.** Solve $5^{x-1} = 3^x$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "5^{x-1} = 3^x", say: "Different bases and the unknown in both exponents: no way to match the bases. Take $\\ln$." },
          { step: 2, m: "(x - 1)\\ln 5 = x \\ln 3", say: "The power law on both sides." },
          { step: 2, m: "x\\ln 5 - \\ln 5 = x\\ln 3", say: "Multiply out the bracket.", ask: { prompt: "Gather the $x$ terms on the left. What do we subtract from both sides?", answer: 0, options: [{ t: "$x \\ln 3$" }, { t: "$\\ln 3$", fb: "The $x$ term on the right is $x\\ln 3$: subtract that." }] } },
          { step: 3, m: "x(\\ln 5 - \\ln 3) = \\ln 5", say: "Factor out $x$ and move $\\ln 5$ across." },
          { step: 3, m: "x = \\frac{\\ln 5}{\\ln 5 - \\ln 3} \\approx 3.1507", say: "Divide." }] },
        gate: true, then: "Take $\\ln$, bring the exponents down, gather the $x$ terms and factor." },
      { type: "choice", kicker: "Try it", prompt: "To solve $4e^{2x} = 20$, which is the best **first** step?",
        options: [{ t: "Divide both sides by 4, to leave $e^{2x} = 5$" }, { t: "Take $\\ln$ of the whole of both sides straight away", fb: "That works but is messy: $\\ln(4e^{2x})$ needs the product law. Isolate the exponential first." }, { t: "Divide both sides by $e$", fb: "$e^{2x}$ is one term; you cannot divide the $e$ away." }],
        answer: 0, skill: "Exponential equations with logs", hints: ["Isolate the exponential."], why: "$e^{2x} = 5$, then $2x = \\ln 5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Solving $2^x = 7$, Jo writes $x = \\frac{7}{2}$. What is wrong?",
        options: [{ t: "The $x$ is in the exponent: divide only after taking logs, $x = \\frac{\\ln 7}{\\ln 2}$." }, { t: "Nothing is wrong.", fb: "Check: $2^{3.5} \\approx 11.3$, not 7." }, { t: "It should be $x = 7 - 2$.", fb: "Subtracting does not undo an exponent." }],
        answer: 0, skill: "Exponential equations with logs", hints: ["Check $2^{3.5}$."], why: "$x = \\frac{\\ln 7}{\\ln 2} \\approx 2.807$." },
      { type: "num", kicker: "Use it", prompt: "Money grows 5% a year, so $1.05^t = 2$ when it has doubled. Find $t$ to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$t \\approx$", post: "years", answer: 14.2067, tol: 0.005, calc: true, skill: "Exponential equations with logs",
        near: [{ v: 20, fb: "That is $1 \\div 0.05$. Use the logarithm." }], hints: ["$t = \\frac{\\ln 2}{\\ln 1.05}$."], why: "$0.6931 \\div 0.04879 \\approx 14.21$ years." }
    ]
  });

  /* ============================================ 14 · Solving logarithmic equations */
  var HOW_14 = [["Isolate", "Get a single logarithm on one side."],
                ["Convert", "Rewrite in exponential form (or set the insides equal)."],
                ["Check", "Reject any answer that makes an inside zero or negative."]];
  LESSONS.push({
    title: "Solving logarithmic equations", art: "pcexp",
    blurb: "Book 4.6 · Turn the log into a power, solve, then check that the inside stays positive.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Write $\\log_2 8 = 3$ in exponential form.",
        options: [{ t: "$2^3 = 8$" }, { t: "$3^2 = 8$", fb: "The base is 2, and the log's answer is the exponent." }, { t: "$8^2 = 3$", fb: "The base of the log is the base of the power." }],
        answer: 0, skill: "Log and exponential form", hints: ["Base 2, exponent 3."], why: "$2^3 = 8$." },
      { type: "learn", kicker: "Explore",
        prompt: "Solve $\\log_2(x + 1) = 3$. Slide $x$ until the dot on the blue graph reaches the orange line $y = 3$.",
        scene: { type: "sketch", x: [-1, 13], y: [-1, 5], u: 26, gate: true, pts: {},
          params: { x: { min: 0, max: 12, step: 1, v: 0, label: "$x$" } },
          draw: function (s) { var x = s.p.x, v = Math.log(x + 1) / Math.LN2; return curve(function (t) { return t + 1 > 0 ? Math.log(t + 1) / Math.LN2 : NaN; }, -0.97, 13, "blue", [-1, 5]).concat([{ seg: [[-1, 3], [13, 3]], c: "orange", dash: true }, { seg: [[x, 0], [x, v]], c: "soft", dash: true }, dot(x, v, v === 3 ? "green" : "blue")]); },
          readout: function (s) { var x = s.p.x, v = Math.log(x + 1) / Math.LN2; return "$\\log_2(" + x + " + 1) = " + nm(f4(v, 2)) + "$" + (v === 3 ? " — **equals 3** ✓" : " (the target is 3)"); },
          goal: function (s) { return s.p.x === 7; } },
        gate: true, then: "$x = 7$: $\\log_2 8 = 3$. In exponential form: $\\log_2(x + 1) = 3$ means $2^3 = x + 1$, so $x + 1 = 8$." },
      { type: "learn", kicker: "The idea",
        prompt: "**One log on each side with the same base:** the insides must be equal. **A single log equal to a number:** rewrite in exponential form. Either way, **check**: the inside of every log in the original must be positive.",
        scene: { type: "method", how: HOW_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $\\log_3(2x - 1) = 2$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "\\log_3(2x - 1) = 2", say: "A single log, already alone." },
          { step: 2, m: "3^2 = 2x - 1", say: "Exponential form: base 3, exponent 2.", ask: { prompt: "Which number is the base?", answer: 0, options: [{ t: "$3$" }, { t: "$2$", fb: "2 is the answer of the log: the exponent." }] } },
          { step: 2, m: "9 = 2x - 1", say: "$3^2 = 9$." },
          { step: 2, m: "x = 5", say: "Add 1, then divide by 2." },
          { step: 3, m: "2(5) - 1 = 9 > 0", say: "Check: the inside is positive, so $x = 5$ works." }] },
        gate: true, then: "$x = 5$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $2\\log_5 x = 4$.",
        how: HOW_14, skill: "Logarithmic equations",
        steps: [
          { step: 1, ask: "Divide both sides by 2: $\\log_5 x =$", type: "num", pre: "$\\log_5 x =$", answer: 2, near: [{ v: 8, fb: "Divide, do not multiply: $4 \\div 2$." }], hint: "$4 \\div 2$.", m: "\\log_5 x = 2", say: "A single log." },
          { step: 2, ask: "Exponential form: $x = 5^2 =$", type: "num", pre: "$x =$", answer: 25, near: [{ v: 10, fb: "$5^2$ means $5 \\cdot 5$, not $5 \\cdot 2$." }], hint: "$5 \\cdot 5$.", m: "x = 25", say: "Base 5, exponent 2." },
          { step: 3, ask: "Check: the inside of the log in the original is $x = 25$. Is it positive?", type: "choice", answer: 0, options: [{ t: "Yes, so $x = 25$ works" }, { t: "No, so it is rejected", fb: "$25 > 0$." }], m: "25 > 0", say: "A valid solution." }],
        why: "Isolate, convert, check." },
      { type: "num", kicker: "On your own", prompt: "Solve $\\log_4(x + 5) = 2$.", pre: "$x =$", answer: 11, skill: "Logarithmic equations",
        near: [{ v: 3, fb: "$4^2 = 16$, so $x + 5 = 16$." }, { v: 16, fb: "That is $x + 5$. Subtract the 5." }], hints: ["$4^2 = x + 5$."], why: "$x + 5 = 16$, so $x = 11$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Two logs, and a trap.** Solve $\\log_2 x + \\log_2(x - 2) = 3$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "\\log_2\\big(x(x - 2)\\big) = 3", say: "Product law: combine the two logs into one." },
          { step: 2, m: "x(x - 2) = 2^3 = 8", say: "Exponential form." },
          { step: 2, m: "x^2 - 2x - 8 = 0", say: "Move everything to one side." },
          { step: 2, m: "(x - 4)(x + 2) = 0", say: "Factor: two numbers that multiply to $-8$ and add to $-2$: $-4$ and $2$." },
          { step: 3, m: "x = -2 \\ \\text{fails}", say: "$\\log_2 x$ at $x = -2$ is the log of a negative number.", ask: { prompt: "Is $x = -2$ a solution?", answer: 0, options: [{ t: "No: the inside would be negative" }, { t: "Yes, it solves the quadratic", fb: "It solves the quadratic, but not the original: $\\log_2(-2)$ does not exist." }] } },
          { step: 3, m: "x = 4 \\ \\text{works}", say: "$\\log_2 4 + \\log_2 2 = 2 + 1 = 3$." }] },
        gate: true, then: "$x = 4$. The check removed the **extraneous** root $x = -2$." },
      { type: "num", kicker: "Try it", prompt: "Solve $\\ln x = \\ln(5x - 8)$.", pre: "$x =$", answer: 2, skill: "Logarithmic equations",
        near: [{ v: -2, fb: "Set the insides equal: $x = 5x - 8$, so $4x = 8$." }, { v: 8, fb: "$x = 5x - 8$ gives $8 = 4x$." }], hints: ["Same base: set the insides equal."], why: "$x = 5x - 8$, so $x = 2$; check: $\\ln 2 = \\ln 2$ ✓." },
      { type: "choice", kicker: "Find the error",
        prompt: "Zed solves $\\log(x - 4) = \\log(2x + 1)$ and gets $x = -5$. Is it a solution?",
        options: [{ t: "No: at $x = -5$ both insides are negative, so there is no solution." }, { t: "Yes: $x - 4 = 2x + 1$ gives $x = -5$.", fb: "That is the equation for the insides, but the insides are $-9$ and $-9$: not allowed." }, { t: "Yes, because both sides are equal.", fb: "Equal is not enough: $\\log(-9)$ does not exist." }],
        answer: 0, skill: "Logarithmic equations", hints: ["Put $x = -5$ into the original."], why: "No real solution." },
      { type: "num", kicker: "Use it", prompt: "Sound level in decibels is $L = 10\\log\\dfrac{I}{10^{-12}}$. For $L = 60$ we get $\\log\\dfrac{I}{10^{-12}} = 6$. So $\\dfrac{I}{10^{-12}} = 10^6$. What is the exponent of 10 in $I$?", pre: "$I = 10^{?}$", answer: -6, skill: "Logarithmic equations",
        near: [{ v: 6, fb: "$I = 10^6 \\cdot 10^{-12}$: add the exponents, $6 + (-12)$." }, { v: -12, fb: "Multiply by $10^{-12}$: $10^{6} \\cdot 10^{-12} = 10^{6 + (-12)}$." }], hints: ["$I = 10^6 \\cdot 10^{-12}$."], why: "$I = 10^{-6}$ watts per square metre." }
    ]
  });
  /* ============================================ 15 · Models of growth and decay */
  var HOW_15 = [["Read", "Find the start $A_0$ and the growth or decay factor $b$."],
                ["Write", "Write $A(t) = A_0 \\cdot b^t$, with $t$ in the right time unit."],
                ["Use it", "Put in $t$ to predict, or take logs to find $t$."]];
  var HL15 = function (t) { return 100 * Math.pow(0.5, t / 5); };
  LESSONS.push({
    title: "Models of growth and decay", art: "pcexp",
    blurb: "Book 4.7 · Populations, loans, medicine and radioactivity all follow $A_0 b^t$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A quantity of 80 is **halved** twice. What is left?", answer: 20, skill: "Percent change",
        near: [{ v: 40, fb: "That is one halving. Halve it again." }, { v: 0, fb: "Halving never reaches 0: $80 \\to 40 \\to 20$." }], hints: ["80, then 40, then…"], why: "$80 \\to 40 \\to 20$." },
      { type: "learn", kicker: "Explore",
        prompt: "A substance loses **half** its mass every 5 days. There are 100 g to start. Slide $t$ to find the first time that **less than 10 g** is left (below the orange line).",
        scene: { type: "sketch", x: [0, 40], y: [0, 100], u: 8, uy: 3, gx: 5, step: 5, gy: 10, stepY: 10, gate: true, pts: {},
          params: { t: { min: 0, max: 40, step: 5, v: 0, label: "$t$ (days)" } },
          draw: function (s) { var t = s.p.t, A = HL15(t); return curve(HL15, 0, 40, "blue", [0, 100]).concat([{ seg: [[0, 10], [40, 10]], c: "orange", dash: true }, { seg: [[t, 0], [t, A]], c: "soft", dash: true }, dot(t, A, A < 10 ? "green" : "blue")]); },
          readout: function (s) { var t = s.p.t, A = HL15(t); return "after $" + t + "$ days: $" + nm(f4(A, 2)) + "$ g" + (A < 10 ? " — **under 10 g** ✓" : "") + "<br>$" + t / 5 + "$ halvings: $100 \\cdot \\left(\\frac{1}{2}\\right)^{" + t / 5 + "}$"; },
          goal: function (s) { return s.p.t === 20; } },
        gate: true, then: "After 4 halvings (20 days) there are $100 \\cdot \\left(\\frac{1}{2}\\right)^4 = 6.25$ g. Each 5 days the amount is **multiplied by $\\frac{1}{2}$**: $A(t) = 100\\left(\\frac{1}{2}\\right)^{t/5}$. The 5 days is the **half-life**." },
      { type: "learn", kicker: "The idea",
        prompt: "Growth or decay by a fixed percentage each period is exponential: $A(t) = A_0 b^t$ with $b = 1 + r$ (growth by $r$) or $b = 1 - r$ (decay by $r$). With a **half-life** $h$: $A(t) = A_0\\left(\\frac{1}{2}\\right)^{t/h}$. Match $t$ to the period.",
        scene: { type: "method", how: HOW_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "A town of 12,000 people grows by 3% a year. How many people are there after 10 years?",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "A_0 = 12000", say: "The start." },
          { step: 1, m: "b = 1 + 0.03 = 1.03", say: "Growth of 3% multiplies by 1.03 each year.", ask: { prompt: "A **decrease** of 3% would use $b =$", answer: 0, options: [{ t: "$0.97$" }, { t: "$0.03$", fb: "$0.03$ is only the change. Keep the 97% that is left: $1 - 0.03$." }] } },
          { step: 2, m: "A(t) = 12000(1.03)^t", say: "$t$ is in years." },
          { step: 3, m: "A(10) = 12000(1.03)^{10}", say: "Put in $t = 10$." },
          { step: 3, m: "A(10) \\approx 16127", say: "$1.03^{10} \\approx 1.3439$, and $12000 \\cdot 1.3439 \\approx 16127$ people." }] },
        gate: true, then: "About 16,127 people." },
      { type: "guided", kicker: "Together",
        prompt: "Now a **half-life**. A drug has a half-life of 6 hours. There are 80 mg to start. How much is left after 18 hours?",
        how: HOW_15, skill: "Growth and decay models",
        steps: [
          { step: 1, ask: "How many half-lives fit in 18 hours?", type: "num", pre: "half-lives =", answer: 3, near: [{ v: 6, fb: "That is the length of one half-life. Divide: $18 \\div 6$." }], hint: "$18 \\div 6$.", m: "\\tfrac{18}{6} = 3", say: "Three halvings." },
          { step: 2, ask: "What is $\\left(\\frac{1}{2}\\right)^3$? (A decimal is fine.)", type: "num", pre: "$=$", answer: 0.125, tol: 1e-9, shown: "1/8", near: [{ v: 0.5, fb: "Three halvings: $\\frac{1}{2} \\cdot \\frac{1}{2} \\cdot \\frac{1}{2}$." }], hint: "$\\frac{1}{8}$.", m: "A = 80\\left(\\tfrac{1}{2}\\right)^3", say: "The decay factor." },
          { step: 3, ask: "$80 \\cdot 0.125 =$", type: "num", pre: "$A =$", post: "mg", answer: 10, near: [{ v: 40, fb: "That is after one half-life. Use $\\frac{1}{8}$ of 80." }], hint: "$80 \\div 8$.", m: "A = 10", say: "10 mg are left." }],
        why: "Read, write, use it." },
      { type: "num", kicker: "On your own", prompt: "A \\$25,000 car loses 12% of its value each year. What is it worth after 4 years, to the nearest cent? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "value =", post: "dollars", answer: 14992.38, tol: 0.0051, calc: true, skill: "Growth and decay models",
        near: [{ v: 13000, fb: "That subtracts 12% of \\$25,000 once... and for only one year. Use $b = 0.88$ four times." }, { v: 25000, fb: "That is the starting value." }], hints: ["$b = 1 - 0.12 = 0.88$."], why: "$25000 \\cdot 0.88^4 \\approx 14992.38$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Find the growth factor from data.** A population grew from 50,000 in 2000 to 62,000 in 2010. What is the yearly growth factor?",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "50000\\,b^{10} = 62000", say: "10 years from start to end. $A_0 = 50000$." },
          { step: 2, m: "b^{10} = 1.24", say: "Divide both sides by 50000: $\\frac{62000}{50000} = 1.24$." },
          { step: 3, m: "b = 1.24^{1/10}", say: "Undo the 10th power with the 10th root: the exponent $\\frac{1}{10}$.", ask: { prompt: "How do you undo $b^{10}$?", answer: 0, options: [{ t: "Raise both sides to the power $\\frac{1}{10}$" }, { t: "Divide both sides by 10", fb: "A power is undone by a root, not by dividing." }] } },
          { step: 3, m: "b \\approx 1.0217", say: "About 2.2% growth per year." }] },
        gate: true, then: "$b = 1.24^{1/10} \\approx 1.0217$." },
      { type: "choice", kicker: "Try it", prompt: "A quantity **triples every 2 hours**. Which model gives its size after $t$ hours?",
        options: [{ t: "$A_0 \\cdot 3^{t/2}$" }, { t: "$A_0 \\cdot 3^{2t}$", fb: "That triples twice **every** hour." }, { t: "$3 \\cdot A_0^t$", fb: "The growth factor 3 is the **base** of the power, not the multiplier at the front." }],
        answer: 0, skill: "Growth and decay models", hints: ["Every 2 hours means $\\frac{t}{2}$ periods."], why: "$\\frac{t}{2}$ tripling periods." },
      { type: "choice", kicker: "Find the error",
        prompt: "A population grows 8% a year. Pat writes the model $A_0 \\cdot 0.08^t$. What is wrong?",
        options: [{ t: "The factor must be $1 + 0.08 = 1.08$." }, { t: "Nothing is wrong.", fb: "$0.08^t$ shrinks to almost nothing: that is not 8% growth." }, { t: "It should be $0.92^t$.", fb: "$0.92$ would be an 8% decrease." }],
        answer: 0, skill: "Growth and decay models", hints: ["Growth keeps 100% and adds 8%."], why: "$b = 1.08$." },
      { type: "num", kicker: "Use it", prompt: "Carbon-14 has a half-life of 5730 years. What fraction of it is left after 3 half-lives? (A decimal is fine.)", pre: "fraction =", answer: 0.125, tol: 1e-9, shown: "1/8", skill: "Growth and decay models",
        near: [{ v: 0.5, fb: "That is after 1 half-life. Halve three times." }, { v: 0.375, fb: "Multiply by $\\frac{1}{2}$ three times: $\\left(\\frac{1}{2}\\right)^3$." }], hints: ["$\\left(\\frac{1}{2}\\right)^3$."], why: "$\\frac{1}{8} = 0.125$." }
    ]
  });

  /* ============================================ 16 · Doubling time and continuous growth */
  var HOW_16 = [["Set up", "Write $A_0 b^t = A$ and divide by $A_0$."],
                ["Take ln", "$t \\ln b = \\ln\\frac{A}{A_0}$."],
                ["Divide", "$t = \\dfrac{\\ln(A / A_0)}{\\ln b}$."]];
  var DB16 = function (r) { return Math.log(2) / Math.log(1 + r / 100); };
  LESSONS.push({
    title: "How long does it take?", art: "pcexp",
    blurb: "Book 4.7 · Doubling time, half-life and continuous growth, with logarithms.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $1.1^t = 1.1^3$ for $t$.", pre: "$t =$", answer: 3, skill: "Exponential equations",
        near: [{ v: 1.1, fb: "Same base: the exponents are equal." }], hints: ["Same base, so the exponents match."], why: "$t = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Money grows by $r\\%$ a year. Slide $r$ and watch **when it doubles** (where the curve meets the orange line at 2). Find a rate that doubles it in **about 9 years**.",
        scene: { type: "sketch", x: [0, 50], y: [0, 4], u: 8, uy: 60, gx: 5, step: 5, gate: true, pts: {},
          params: { r: { min: 1, max: 12, step: 1, v: 1, label: "$r$ (%)" } },
          draw: function (s) { var r = s.p.r, T = DB16(r), it = curve(EXPF(1, 1 + r / 100), 0, 50, "blue", [0, 4]).concat([{ seg: [[0, 2], [50, 2]], c: "orange", dash: true }]); if (T <= 50) it.push({ seg: [[T, 0], [T, 2]], c: "green", dash: true }, dot(T, 2, "green")); return it; },
          readout: function (s) { var r = s.p.r, T = DB16(r); return "growth $" + r + "\\%$: doubles in $\\frac{\\ln 2}{\\ln " + nm(f4(1 + r / 100, 2)) + "} \\approx " + nm(f4(T, 1)) + "$ years" + (Math.abs(T - 9) < 0.5 ? " ✓" : "") + "<br>rule of 72: $72 \\div " + r + " = " + nm(f4(72 / r, 1)) + "$"; },
          goal: function (s) { return Math.abs(DB16(s.p.r) - 9) < 0.5; } },
        gate: true, then: "At 8% it doubles in about 9 years. Notice $72 \\div 8 = 9$: the **rule of 72**. The exact time is a **logarithm**: $t = \\dfrac{\\ln 2}{\\ln 1.08}$." },
      { type: "learn", kicker: "The idea",
        prompt: "To find **when** a quantity reaches a value, solve $A_0 b^t = A$ with logarithms: $t = \\dfrac{\\ln(A / A_0)}{\\ln b}$. For continuous growth $A_0 e^{kt}$, the same idea gives $t = \\dfrac{\\ln(A / A_0)}{k}$. **Doubling time** is $\\dfrac{\\ln 2}{\\ln b}$ or $\\dfrac{\\ln 2}{k}$.",
        scene: { type: "method", how: HOW_16 } },
      { type: "learn", kicker: "Watch",
        prompt: "Money grows 6% a year. How long until it **triples**?",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "1.06^t = 3", say: "Tripling means $A = 3A_0$, and dividing by $A_0$ leaves 3." },
          { step: 2, m: "t\\ln 1.06 = \\ln 3", say: "Take $\\ln$ of both sides and use the power law.", ask: { prompt: "The power law brings $t$…", answer: 0, options: [{ t: "down in front of $\\ln 1.06$" }, { t: "up into the base", fb: "It comes out of the exponent as a multiplier." }] } },
          { step: 3, m: "t = \\frac{\\ln 3}{\\ln 1.06}", say: "Divide." },
          { step: 3, m: "t \\approx 18.85 \\text{ years}", say: "$1.0986 \\div 0.05827 \\approx 18.85$." }] },
        gate: true, then: "About 18.85 years." },
      { type: "guided", kicker: "Together",
        prompt: "A culture grows **continuously** at 5% per hour: $N = N_0 e^{0.05t}$. How long does it take to **double**?",
        how: HOW_16, skill: "Doubling time",
        steps: [
          { step: 1, ask: "Doubling means $N = 2N_0$. Divide by $N_0$: $e^{0.05t} =$", type: "num", pre: "$e^{0.05t} =$", answer: 2, near: [{ v: 0.05, fb: "Doubling means the ratio $\\frac{N}{N_0}$ is 2." }], hint: "$\\frac{2N_0}{N_0}$.", m: "e^{0.05t} = 2", say: "The equation to solve." },
          { step: 2, ask: "Take $\\ln$ of both sides. The left side becomes…", type: "choice", answer: 0, options: [{ t: "$0.05t$" }, { t: "$e \\cdot 0.05t$", fb: "$\\ln e^u = u$: they undo each other." }], m: "0.05t = \\ln 2", say: "The natural log undoes $e$." },
          { step: 3, ask: "$t = \\dfrac{\\ln 2}{0.05}$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", type: "num", pre: "$t \\approx$", post: "hours", answer: 13.8629, tol: 0.0006, calc: true, near: [{ v: 0.6931, tol: 0.001, fb: "That is $\\ln 2$. Divide it by 0.05." }], hint: "$0.6931 \\div 0.05$.", m: "t \\approx 13.86", say: "About 13.9 hours." }],
        why: "Set up, take ln, divide." },
      { type: "num", kicker: "On your own", prompt: "A substance has a half-life of 10 days. How many days until only **20%** is left? Solve $\\left(\\frac{1}{2}\\right)^{t/10} = 0.2$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$t \\approx$", post: "days", answer: 23.2193, tol: 0.006, calc: true, skill: "Doubling time",
        near: [{ v: 10, fb: "That is one half-life, which leaves 50%." }, { v: 20, fb: "Not a straight line: use logs." }], hints: ["$\\frac{t}{10}\\ln 0.5 = \\ln 0.2$."], why: "$t = 10 \\cdot \\frac{\\ln 0.2}{\\ln 0.5} \\approx 23.22$ days." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Find the rate first.** A population is 400 at $t = 0$ and 600 at $t = 3$ (years), growing continuously: $N = 400e^{kt}$. Find $k$.",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "600 = 400e^{3k}", say: "Put in the second point." },
          { step: 1, m: "e^{3k} = 1.5", say: "Divide by 400.", ask: { prompt: "What is $600 \\div 400$?", answer: 0, options: [{ t: "$1.5$" }, { t: "$0.67$", fb: "That is $400 \\div 600$, upside down." }] } },
          { step: 2, m: "3k = \\ln 1.5", say: "Take $\\ln$ of both sides." },
          { step: 3, m: "k = \\frac{\\ln 1.5}{3} \\approx 0.1352", say: "About 13.5% per year, continuously." }] },
        gate: true, then: "$k \\approx 0.1352$." },
      { type: "num", kicker: "Try it", prompt: "How long does it take to double at 4% per year, **continuously**? Solve $e^{0.04t} = 2$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$t \\approx$", post: "years", answer: 17.3287, tol: 0.006, calc: true, skill: "Doubling time",
        near: [{ v: 18, fb: "That is the rule-of-72 estimate $72 \\div 4$. The exact answer is $\\frac{\\ln 2}{0.04}$." }], hints: ["$t = \\frac{\\ln 2}{0.04}$."], why: "$0.6931 \\div 0.04 \\approx 17.33$ years." },
      { type: "choice", kicker: "Find the error",
        prompt: "To solve $1.08^t = 2$, Lee writes $t = \\frac{2}{1.08} \\approx 1.85$. What is wrong?",
        options: [{ t: "Dividing does not undo an exponent: $t = \\frac{\\ln 2}{\\ln 1.08} \\approx 9.01$." }, { t: "Nothing is wrong.", fb: "Check: $1.08^{1.85} \\approx 1.15$, not 2." }, { t: "It should be $t = 2 - 1.08$.", fb: "Subtracting does not undo a power either." }],
        answer: 0, skill: "Doubling time", hints: ["Check $1.08^{1.85}$."], why: "$t \\approx 9.01$ years." },
      { type: "num", kicker: "Use it", prompt: "Use the **rule of 72** to estimate how many years it takes money to double at 9% a year.", post: "years", answer: 8, skill: "Doubling time",
        near: [{ v: 648, fb: "Divide, do not multiply: $72 \\div 9$." }], hints: ["$72 \\div 9$."], why: "About 8 years (the exact value is 8.04)." }
    ]
  });

  /* ============================================ 17 · Logarithmic scales */
  var HOW_17 = [["Read", "Which scale is it, and what do $x$, $I$, $A$ stand for?"],
                ["Convert", "Use $\\log x = y \\iff x = 10^y$ to move between the scale and the amount."],
                ["Compare", "A difference of $d$ on the scale is a factor of $10^d$ in the amount."]];
  LESSONS.push({
    title: "Logarithmic scales", art: "pcexp",
    blurb: "Book 4.7 · Earthquakes, sound and acid: each step on the scale means ten times as much.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $10^3 \\cdot 10^2$ as a single power of 10. What is the exponent?", answer: 5, skill: "Exponent rules",
        near: [{ v: 6, fb: "Add the exponents: $3 + 2$." }], hints: ["Same base: add the exponents."], why: "$10^5$." },
      { type: "learn", kicker: "Explore",
        prompt: "Earthquake **magnitude** is a logarithm. Slide the magnitudes $A$ (blue) and $B$ (orange) and read how many times stronger one shake is. Find a pair where B is **1000 times** A, and a pair where B is **10 times** A.",
        scene: { type: "sketch", x: [2.5, 8.5], y: [-0.9, 1.5], u: 62, w: 420, grid: false, gate: true, pts: {},
          params: { a: { min: 3, max: 8, step: 1, v: 4, label: "$A$" }, b: { min: 3, max: 8, step: 1, v: 4, label: "$B$" } },
          track: function (s) { var d = s.p.b - s.p.a; return d === 3 ? "k" : d === 1 ? "t" : null; },
          draw: function (s) {
            var a = s.p.a, b = s.p.b, it = [{ seg: [[2.7, 0], [8.3, 0]], c: "soft" }], k;
            for (k = 3; k <= 8; k++) it.push({ seg: [[k, -0.07], [k, 0.07]], c: "soft" }, { text: String(k), at: [k, -0.42], c: "soft" });
            it.push({ pt: [a, 0], c: "blue", r: 6 }, { pt: [b, 0], c: "orange", r: 6 });
            if (a !== b) it.push({ seg: [[a, 0.45], [b, 0.45]], c: "green" }, { text: (b > a ? "× " : "÷ ") + Math.pow(10, Math.abs(b - a)), at: [(a + b) / 2, 0.85], c: "green" });
            return it;
          },
          readout: function (s) { var d = s.p.b - s.p.a; return "magnitude $" + s.p.b + "$ against $" + s.p.a + "$: difference $" + nm(d) + "$, so " + (d === 0 ? "the same shake" : d > 0 ? "B is **" + Math.pow(10, d) + " times** as strong" : "B is $\\frac{1}{" + Math.pow(10, -d) + "}$ as strong") + "<br>1000 times: " + (s.tracked.k ? "✓" : "—") + " · 10 times: " + (s.tracked.t ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.k && s.tracked.t); } },
        gate: true, then: "A difference of **1** on the scale means **10 times** the shaking; a difference of 3 means $10^3 = 1000$ times. On a **logarithmic scale**, equal steps are equal **factors**." },
      { type: "learn", kicker: "The idea",
        prompt: "Some scales are logarithms so that huge ranges fit on small numbers. **Richter:** $M = \\log\\frac{A}{A_0}$. **pH:** $\\text{pH} = -\\log[H^+]$. **Decibels:** $L = 10\\log\\frac{I}{I_0}$. A difference of $d$ on the Richter or pH scale is a factor of $10^d$.",
        scene: { type: "method", how: HOW_17 } },
      { type: "learn", kicker: "Watch",
        prompt: "How many times stronger is a magnitude 7 earthquake than a magnitude 5?",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "M_B = 7, \\ \\ M_A = 5", say: "Two magnitudes on the Richter scale." },
          { step: 2, m: "M_B - M_A = 2", say: "The difference on the scale.", ask: { prompt: "What is $7 - 5$?", answer: 0, options: [{ t: "$2$" }, { t: "$12$", fb: "Subtract: how far apart are 5 and 7?" }] } },
          { step: 3, m: "10^2 = 100", say: "Each step of 1 is a factor of 10, so a step of 2 is $10^2$." },
          { step: 3, m: "100 \\text{ times as strong}", say: "The amplitude is 100 times larger." }] },
        gate: true, then: "100 times." },
      { type: "guided", kicker: "Together",
        prompt: "Lemon juice has a hydrogen concentration $[H^+] = 0.01$ moles per litre. What is its pH? ($\\text{pH} = -\\log[H^+]$.)",
        how: HOW_17, skill: "Logarithmic scales",
        steps: [
          { step: 1, ask: "$0.01 = 10^{?}$. What is the exponent?", type: "num", pre: "$? =$", answer: -2, near: [{ v: 2, fb: "$10^2 = 100$. A value below 1 needs a negative exponent." }], hint: "$0.01 = \\frac{1}{100}$.", m: "0.01 = 10^{-2}", say: "A power of ten." },
          { step: 2, ask: "$\\log 0.01 = -2$. So $\\text{pH} = -(-2) =$", type: "num", pre: "pH =", answer: 2, near: [{ v: -2, fb: "The minus in the definition flips the sign: $-(-2)$." }], hint: "Two minuses make a plus.", m: "\\text{pH} = 2", say: "The definition has a minus sign." },
          { step: 3, ask: "A pH below 7 is acidic. Is lemon juice acidic?", type: "choice", answer: 0, options: [{ t: "Yes: pH 2 is strongly acidic" }, { t: "No", fb: "pH 2 is much lower than 7." }], m: "\\text{acidic}", say: "Yes." }],
        why: "Read, convert, compare." },
      { type: "num", kicker: "On your own", prompt: "Solution X has pH 5 and solution Y has pH 3. How many times larger is the hydrogen concentration of Y than of X?", answer: 100, skill: "Logarithmic scales",
        near: [{ v: 2, fb: "2 is the difference on the scale. The concentration changes by $10^2$." }, { v: 0.01, fb: "Lower pH means **more** acid: Y has the larger concentration." }], hints: ["The difference is 2 pH steps."], why: "$10^{5-3} = 100$ times." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Decibels.** Sound level is $L = 10\\log\\dfrac{I}{I_0}$ with $I_0 = 10^{-12}$. Find $L$ when the intensity is $I = 10^{-5}$.",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "\\frac{I}{I_0} = \\frac{10^{-5}}{10^{-12}}", say: "Substitute the intensities." },
          { step: 2, m: "= 10^{-5 - (-12)} = 10^{7}", say: "Divide powers: subtract the exponents.", ask: { prompt: "What is $-5 - (-12)$?", answer: 0, options: [{ t: "$7$" }, { t: "$-17$", fb: "Subtracting a negative adds: $-5 + 12$." }] } },
          { step: 3, m: "L = 10\\log 10^7 = 10 \\cdot 7", say: "$\\log 10^7 = 7$." },
          { step: 3, m: "L = 70 \\text{ decibels}", say: "About the loudness of a busy street." }] },
        gate: true, then: "70 dB." },
      { type: "num", kicker: "Try it", prompt: "A liquid has $[H^+] = 10^{-8}$ moles per litre. What is its pH?", pre: "pH =", answer: 8, skill: "Logarithmic scales",
        near: [{ v: -8, fb: "$\\text{pH} = -\\log[H^+] = -(-8)$." }], hints: ["$\\text{pH} = -\\log 10^{-8}$."], why: "$-(-8) = 8$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mo says a magnitude 8 earthquake is twice as strong as a magnitude 4. What is wrong?",
        options: [{ t: "Each magnitude is a factor of 10: it is $10^4 = 10{,}000$ times as strong." }, { t: "Nothing is wrong.", fb: "That would be a linear scale. The Richter scale is logarithmic." }, { t: "It is 4 times as strong.", fb: "The difference of 4 is the **exponent**: $10^4$." }],
        answer: 0, skill: "Logarithmic scales", hints: ["Difference of 4: $10^4$."], why: "$10^{8-4} = 10{,}000$." },
      { type: "num", kicker: "Use it", prompt: "A jet engine is 130 dB and a whisper is 30 dB. Every 10 dB is a factor of 10 in intensity. The jet engine is $10^{?}$ times more intense. What is the exponent?", pre: "$10^{?}$, ? =", answer: 10, skill: "Logarithmic scales",
        near: [{ v: 100, fb: "100 is the difference in dB, not the number of tens." }, { v: 4.333, tol: 0.001, fb: "That is $\\frac{130}{30}$. Decibels are logarithmic: 100 dB more means 10 steps of ten." }], hints: ["The difference is 100 dB: ten steps of 10 dB."], why: "$10^{100/10} = 10^{10}$: ten billion times." }
    ]
  });

  /* ============================================ 18 · Building an exponential model from data */
  var HOW_18 = [["Look", "Divide neighbouring outputs: roughly constant ratios mean exponential."],
                ["Fit", "Use two points, or a calculator's exponential regression."],
                ["Test", "Compare the model's outputs with the data."]];
  var D18 = [[0, 5], [1, 7], [2, 10], [3, 14], [4, 19]];
  var SSE18 = function (a, b) { return D18.reduce(function (t, p) { var e = a * Math.pow(b, p[0]) - p[1]; return t + e * e; }, 0); };
  LESSONS.push({
    title: "Building an exponential model from data", art: "pcexp",
    blurb: "Book 4.8 · Real data is never exact. Look for a steady ratio and fit a curve.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$\\dfrac{19}{14} \\approx$ ? Round to one decimal place. (A decimal like 1.3 is fine.)", answer: 1.4, tol: 0.02, skill: "Ratios",
        near: [{ v: 5, tol: 0.02, fb: "That is $19 - 14$. We want the **ratio**: divide." }], hints: ["$19 \\div 14$."], why: "$19 \\div 14 \\approx 1.36 \\approx 1.4$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dots are measurements. Slide $a$ and $b$ so the blue curve $f(x) = a \\cdot b^x$ passes **close to all the dots**. The readout shows the total miss.",
        scene: { type: "sketch", x: [0, 5], y: [0, 26], u: 52, uy: 11, gy: 5, stepY: 5, gate: true, pts: {},
          params: { a: { min: 1, max: 9, step: 1, v: 1, label: "$a$" }, b: { min: 1.1, max: 1.8, step: 0.1, v: 1.1, label: "$b$" } },
          draw: function (s) { var f = EXPF(s.p.a, s.p.b), it = curve(f, 0, 5, "blue", [0, 26]); D18.forEach(function (p) { var y = f(p[0]); it.push({ seg: [[p[0], p[1]], [p[0], Math.min(26, y)]], c: "soft", dash: true }, dot(p[0], p[1], "orange")); }); return it; },
          readout: function (s) { var e = SSE18(s.p.a, s.p.b); return "$f(x) = " + nm(s.p.a) + " \\cdot " + nm(f4(s.p.b, 1)) + "^x$ — total miss (squares): $" + nm(f4(e, 1)) + "$" + (e < 1 ? " — **a close fit** ✓" : ""); },
          goal: function (s) { return SSE18(s.p.a, s.p.b) < 1; } },
        gate: true, then: "$f(x) = 5 \\cdot 1.4^x$ hugs the data: it misses each dot by less than 0.3. Real measurements are **noisy**, so we look for a curve that is **close**, not exact." },
      { type: "learn", kicker: "The idea",
        prompt: "To build an exponential model from data: **divide** neighbouring outputs. If the ratios are about the same, the data is **exponential**. Fit $a \\cdot b^x$ through two points (far apart), or use a calculator's **ExpReg**, then **test** the model against all the data.",
        scene: { type: "method", how: HOW_18 } },
      { type: "learn", kicker: "Watch",
        prompt: "Users of an app: 100, 144, 207, 299 at years $0, 2, 4, 6$. Fit an exponential model.", art: tbl(["year $t$", "users"], [[0, 100], [2, 144], [4, 207], [6, 299]]),
        scene: { type: "walk", how: HOW_18, rows: [
          { step: 1, m: "\\frac{144}{100} = 1.44", say: "Divide neighbouring outputs." },
          { step: 1, m: "\\frac{207}{144} \\approx 1.44, \\ \\ \\frac{299}{207} \\approx 1.44", say: "The ratios are all about 1.44: the data is exponential.", ask: { prompt: "What do equal ratios tell us?", answer: 0, options: [{ t: "It is exponential" }, { t: "It is linear", fb: "Linear data has equal **differences**." }] } },
          { step: 2, m: "100\\,b^6 = 299", say: "Use the first and last points (far apart, so less error). $a = 100$." },
          { step: 2, m: "b = 2.99^{1/6} \\approx 1.2", say: "The 6th root." },
          { step: 3, m: "f(t) = 100(1.2)^t", say: "Test: $f(4) = 100 \\cdot 2.0736 = 207.4$, close to 207." }] },
        gate: true, then: "$f(t) = 100(1.2)^t$: the app grows about 20% a year." },
      { type: "guided", kicker: "Together",
        prompt: "Now you fit $(0, 12)$ and $(3, 96)$.",
        how: HOW_18, skill: "Fitting exponential models",
        steps: [
          { step: 1, ask: "$a$ is the output at $t = 0$. $a =$", type: "num", pre: "$a =$", answer: 12, near: [{ v: 96, fb: "$(0, 12)$: the output at $t = 0$ is 12." }], hint: "The point at $t = 0$.", m: "a = 12", say: "The start." },
          { step: 2, ask: "$12 b^3 = 96$, so $b^3 =$", type: "num", pre: "$b^3 =$", answer: 8, near: [{ v: 84, fb: "Divide: $96 \\div 12$." }], hint: "$96 \\div 12$.", m: "b^3 = 8", say: "Now the cube root." },
          { step: 2, ask: "$b =$", type: "num", pre: "$b =$", answer: 2, near: [{ v: 4, fb: "$4^3 = 64$. Which number cubed is 8?" }], hint: "$2 \\cdot 2 \\cdot 2$.", m: "b = 2", say: "Doubling each period." },
          { step: 3, ask: "Test by predicting: $f(5) = 12 \\cdot 2^5 =$", type: "num", pre: "$f(5) =$", answer: 384, near: [{ v: 60, fb: "The power first: $2^5 = 32$." }], hint: "$12 \\cdot 32$.", m: "f(5) = 384", say: "A prediction." }],
        why: "Look, fit, test." },
      { type: "num", kicker: "On your own", prompt: "A model is $f(t) = 250(0.9)^t$. What does it predict at $t = 6$? Round to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$f(6) \\approx$", answer: 132.86, tol: 0.0051, calc: true, skill: "Fitting exponential models",
        near: [{ v: 1350, fb: "That multiplies $0.9$ by 6. Use the **power** $0.9^6$." }], hints: ["$0.9^6 \\approx 0.5314$."], why: "$250 \\cdot 0.531441 \\approx 132.86$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Which model fits better?** Data at $x = 0, 1, 2, 3$: $3,\\ 5,\\ 9,\\ 17$. Model A is $3 \\cdot 1.8^x$ and model B is $3 \\cdot 2^x$.",
        scene: { type: "walk", how: HOW_18, rows: [
          { step: 1, m: "\\text{data: } 3,\\ 5,\\ 9,\\ 17", say: "Ratios: 1.67, 1.8, 1.89: roughly 1.8 to 2." },
          { step: 2, m: "\\text{A: } 3,\\ 5.4,\\ 9.7,\\ 17.5", say: "$3 \\cdot 1.8^x$ at $x = 0, 1, 2, 3$." },
          { step: 2, m: "\\text{B: } 3,\\ 6,\\ 12,\\ 24", say: "$3 \\cdot 2^x$ at the same inputs." },
          { step: 3, m: "\\text{A misses by } 0,\\ 0.4,\\ 0.7,\\ 0.5", say: "Compare each model's outputs with the data.", ask: { prompt: "B misses by $0, 1, 3, 7$. Which model is closer?", answer: 0, options: [{ t: "Model A" }, { t: "Model B", fb: "B is off by 7 at the last point; A is off by 0.5." }] } }] },
        gate: true, then: "Model A fits better. The test is to **compare the model with the data**." },
      { type: "choice", kicker: "Try it", prompt: "Which is the exponential model through $(0, 3)$ and $(2, 27)$?",
        options: [{ t: "$f(x) = 3 \\cdot 3^x$" }, { t: "$f(x) = 3 \\cdot 9^x$", fb: "$9$ is $b^2$. Take the square root: $b = 3$." }, { t: "$f(x) = 27 \\cdot 3^x$", fb: "$a$ is the output at $x = 0$, which is 3." }],
        answer: 0, skill: "Fitting exponential models", hints: ["$a = 3$, then $27 = 3b^2$."], why: "$b^2 = 9$, so $b = 3$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A model passes through $(0, 2)$ and $(1, 6)$. Ava writes $f(x) = 2 \\cdot 6^x$. What is wrong?",
        options: [{ t: "$b$ is the ratio $6 \\div 2 = 3$, so $f(x) = 2 \\cdot 3^x$." }, { t: "Nothing is wrong.", fb: "Check: $2 \\cdot 6^1 = 12$, not 6." }, { t: "$a$ should be 6.", fb: "$a$ is the output at $x = 0$: 2." }],
        answer: 0, skill: "Fitting exponential models", hints: ["Check $f(1)$."], why: "$f(1) = 2 \\cdot 3 = 6$." },
      { type: "num", kicker: "Use it", prompt: "A town's population is modelled by $P(t) = 1200 \\cdot 1.04^t$. What is the population after 10 years, to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$P(10) \\approx$", answer: 1776.29, tol: 0.0051, calc: true, skill: "Fitting exponential models",
        near: [{ v: 1680, fb: "That adds 4% ten times to the start, without compounding. The power $1.04^{10}$ does the compounding." }], hints: ["$1.04^{10} \\approx 1.4802$."], why: "$1200 \\cdot 1.480244 \\approx 1776.29$." }
    ]
  });

  /* ============================================ 19 · Which model? Linear, exponential or logarithmic */
  var HOW_19 = [["Differences", "Subtract neighbours: constant differences mean linear."],
                ["Ratios", "Divide neighbours: constant ratios mean exponential."],
                ["Shape", "Inputs multiply while outputs add: logarithmic."]];
  var DS19 = { A: [[0, 2], [1, 3], [2, 4.5], [3, 6.8], [4, 10]], B: [[0, 1], [1, 3], [2, 5.1], [3, 6.9], [4, 9]], C: [[1, 2], [2, 3.4], [3, 4.2], [4, 4.8], [5, 5.2]] };
  var MD19 = {
    lin: { A: function (x) { return 2 + 2 * x; }, B: function (x) { return 1 + 2 * x; }, C: function (x) { return 1.6 + 0.8 * x; } },
    exp: { A: function (x) { return 2 * Math.pow(1.5, x); }, B: function (x) { return 1.2 * Math.pow(1.6, x); }, C: function (x) { return 1.5 * Math.pow(1.3, x); } },
    log: { A: function (x) { return 2 + 4 * Math.log(x + 1); }, B: function (x) { return 1 + 4.3 * Math.log(x + 1); }, C: function (x) { return 2 + 2 * Math.log(x); } }
  };
  var SSE19 = function (d, m) { return DS19[d].reduce(function (t, p) { var e = MD19[m][d](p[0]) - p[1]; return t + e * e; }, 0); };
  LESSONS.push({
    title: "Which model? Linear, exponential or logarithmic", art: "pcexp",
    blurb: "Book 4.8 · Differences, ratios and shape tell the models apart.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The outputs $5,\\ 8,\\ 11,\\ 14$ go up by the same **amount** each step. Which kind of function is that?",
        options: [{ t: "Linear" }, { t: "Exponential", fb: "Exponential outputs go up by the same **ratio**, not the same amount." }, { t: "Neither", fb: "Adding 3 each step is exactly linear." }],
        answer: 0, skill: "Linear or exponential", hints: ["It adds 3 each time."], why: "Constant differences: linear." },
      { type: "learn", kicker: "Explore",
        prompt: "Three sets of data (orange dots) and three models. Pick a **data set** and a **model**; the readout adds up how far the curve misses the dots. For **each data set**, find the model that fits (a total miss under **0.2**).",
        scene: { type: "sketch", x: [-0.5, 5.5], y: [0, 11], u: 52, uy: 26, gate: true, pts: {},
          chips: { d: { label: "Data", v: "A", opts: [["A", "A"], ["B", "B"], ["C", "C"]] }, m: { label: "Model", v: "lin", opts: [["lin", "linear"], ["exp", "exponential"], ["log", "logarithmic"]] } },
          track: function (s) { return SSE19(s.c.d, s.c.m) < 0.2 ? s.c.d : null; },
          draw: function (s) { var f = MD19[s.c.m][s.c.d], D = DS19[s.c.d], x0 = s.c.d === "C" ? 0.7 : 0; var it = curve(f, x0, 5.3, "blue", [0, 11]); D.forEach(function (p) { it.push({ seg: [[p[0], p[1]], [p[0], Math.max(0, Math.min(11, f(p[0])))]], c: "soft", dash: true }, dot(p[0], p[1], "orange")); }); return it; },
          readout: function (s) { var e = SSE19(s.c.d, s.c.m), n = Object.keys(s.tracked).length; return "data " + s.c.d + ", " + ({ lin: "linear", exp: "exponential", log: "logarithmic" })[s.c.m] + " model: total miss $" + nm(f4(e, 2)) + "$" + (e < 0.2 ? " — **a good fit** ✓" : " — a poor fit") + "<br>Data sets matched: " + n + " of 3"; },
          goal: function (s) { return !!(s.tracked.A && s.tracked.B && s.tracked.C); } },
        gate: true, then: "Data A is **exponential**, data B is **linear** and data C is **logarithmic**. Choosing the right family matters far more than the exact numbers." },
      { type: "learn", kicker: "The idea",
        prompt: "Test the data. **Linear:** constant differences. **Exponential:** constant ratios. **Logarithmic:** each time the input is **multiplied**, the output **adds** the same amount (it climbs fast, then slows). Fit that family, then check against the data.",
        scene: { type: "method", how: HOW_19 } },
      { type: "learn", kicker: "Watch",
        prompt: "Which family does each table belong to?",
        scene: { type: "walk", how: HOW_19, rows: [
          { step: 1, m: "4,\\ 7,\\ 10,\\ 13", say: "Table A: subtract neighbours: 3, 3, 3. Constant differences: **linear**." },
          { step: 2, m: "4,\\ 8,\\ 16,\\ 32", say: "Table B: the differences 4, 8, 16 change, but the ratios are 2, 2, 2. Constant ratios: **exponential**.", ask: { prompt: "What is $\\frac{16}{8}$?", answer: 0, options: [{ t: "$2$" }, { t: "$8$", fb: "That is the difference. Divide: $16 \\div 8$." }] } },
          { step: 3, m: "x:\\ 1,\\ 2,\\ 4,\\ 8", say: "Table C: the inputs **double** each time." },
          { step: 3, m: "y:\\ 0,\\ 3,\\ 6,\\ 9", say: "The outputs **add** 3 each time: **logarithmic**, $y = 3\\log_2 x$." }] },
        gate: true, then: "Differences, ratios, shape." },
      { type: "guided", kicker: "Together",
        prompt: "The outputs for $x = 0, 1, 2, 3$ are $100,\\ 80,\\ 64,\\ 51.2$. Find the model.",
        how: HOW_19, skill: "Choosing a model",
        steps: [
          { step: 1, ask: "The differences are $-20, -16, -12.8$. Are they constant?", type: "choice", answer: 0, options: [{ t: "No, so it is not linear" }, { t: "Yes, so it is linear", fb: "$-20$, $-16$ and $-12.8$ are all different." }], m: "\\text{not linear}", say: "Not a straight line." },
          { step: 2, ask: "The first ratio: $\\frac{80}{100} =$", type: "num", pre: "$=$", answer: 0.8, tol: 1e-9, near: [{ v: -20, fb: "Divide, do not subtract." }], hint: "$80 \\div 100$.", m: "\\frac{80}{100} = 0.8", say: "Also $\\frac{64}{80} = 0.8$ and $\\frac{51.2}{64} = 0.8$." },
          { step: 3, ask: "So the model is…", type: "choice", answer: 0, options: [{ t: "exponential decay: $100(0.8)^x$" }, { t: "exponential growth: $100(1.25)^x$", fb: "The outputs fall, so $b < 1$: $b = 0.8$." }], m: "f(x) = 100(0.8)^x", say: "Decay by 20% each step." }],
        why: "Differences, ratios, then name the model." },
      { type: "sort", kicker: "On your own", prompt: "Which family does each set of data belong to?",
        bins: ["Linear", "Exponential", "Logarithmic"],
        cards: [{ t: "$x = 0,1,2,3$: $\\ 5,\\ 9,\\ 13,\\ 17$", bin: 0, fb: "It adds 4 each time." }, { t: "$x = 0,1,2,3$: $\\ 5,\\ 10,\\ 20,\\ 40$", bin: 1, fb: "It doubles each time." }, { t: "$x = 1,2,4,8$: $\\ 2,\\ 5,\\ 8,\\ 11$", bin: 2, fb: "The input doubles and the output adds 3." }, { t: "$x = 0,1,2,3$: $\\ 81,\\ 27,\\ 9,\\ 3$", bin: 1, fb: "It is multiplied by $\\frac{1}{3}$ each time." }, { t: "$x = 0,1,2,3$: $\\ 50,\\ 40,\\ 30,\\ 20$", bin: 0, fb: "It subtracts 10 each time." }, { t: "$x = 1,10,100$: $\\ 1,\\ 2,\\ 3$", bin: 2, fb: "The input is multiplied by 10 and the output adds 1." }],
        skill: "Choosing a model", hints: ["Differences, ratios, or inputs multiplying."], why: "Add: linear. Multiply: exponential. Input multiplies and output adds: logarithmic." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A shifted exponential.** A cup of coffee in a 20° room cools: $T = 70,\\ 65,\\ 60.5,\\ 56.45$ at minutes $0, 1, 2, 3$.",
        scene: { type: "walk", how: HOW_19, rows: [
          { step: 1, m: "-5,\\ -4.5,\\ -3.95", say: "Differences of $T$: not constant, so not linear." },
          { step: 2, m: "\\frac{65}{70} \\approx 0.929, \\ \\frac{60.5}{65} \\approx 0.931", say: "The ratios of $T$ itself creep upward (the next is 0.933): not constant." },
          { step: 2, m: "T - 20:\\ 50,\\ 45,\\ 40.5,\\ 36.45", say: "Subtract the room temperature first.", ask: { prompt: "What is the ratio $\\frac{45}{50}$?", answer: 0, options: [{ t: "$0.9$" }, { t: "$0.5$", fb: "$45 \\div 50 = 0.9$." }] } },
          { step: 3, m: "T(t) = 20 + 50(0.9)^t", say: "The ratios of $T - 20$ are all 0.9: exponential decay **towards** 20." }] },
        gate: true, then: "When data levels off, subtract the level and then test the **ratios**." },
      { type: "choice", kicker: "Try it", prompt: "The outputs $2,\\ 6,\\ 18,\\ 54$ are best modelled by…",
        options: [{ t: "an exponential function" }, { t: "a linear function", fb: "The differences 4, 12, 36 are not constant." }, { t: "a logarithmic function", fb: "It grows faster and faster, not slower and slower." }],
        answer: 0, skill: "Choosing a model", hints: ["Divide neighbours."], why: "Ratios are all 3." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ava sees the outputs $1,\\ 4,\\ 9,\\ 16$ and says \"it grows fast, so it is exponential\". What is wrong?",
        options: [{ t: "The ratios $4, 2.25, 1.78$ are not constant. These are squares: neither linear nor exponential." }, { t: "Nothing is wrong.", fb: "Test it: constant ratios are what make a function exponential, not fast growth." }, { t: "It is linear.", fb: "The differences 3, 5, 7 are not constant." }],
        answer: 0, skill: "Choosing a model", hints: ["Divide neighbours and subtract neighbours."], why: "Growing fast does not make a function exponential." },
      { type: "choice", kicker: "Use it", prompt: "A city's population was 100,000, then 110,000, then 121,000 in three years in a row. Which model fits?",
        options: [{ t: "Exponential: the ratio is 1.1 each year" }, { t: "Linear: it grows by about 10,000 a year", fb: "The increases are 10,000 and 11,000: not constant, but the ratios are both 1.1." }, { t: "Logarithmic", fb: "The growth is speeding up, not slowing down." }],
        answer: 0, skill: "Choosing a model", hints: ["$\\frac{110}{100}$ and $\\frac{121}{110}$."], why: "$100000 \\cdot 1.1^t$." }
    ]
  });
  /* ================================================================ Skills */
  var NAMES4 = { 1: "once a year", 2: "twice a year", 4: "quarterly", 12: "monthly" };
  var SKILLS = [
    { id: "pc4-expfn", title: "Evaluate an exponential function", lesson: 2,
      gen: function (R) {
        var a, b, x = R.int(2, 4), tex;
        if (R.chance(0.25)) { a = R.int(1, 5) * Math.pow(2, x); b = 0.5; tex = "\\left(\\tfrac{1}{2}\\right)"; }
        else { a = R.int(2, 9); b = R.pick([2, 3, 4, 5, 10]); tex = String(b); }
        var ans = a * Math.pow(b, x);
        return { type: "num", prompt: "$f(x) = " + a + " \\cdot " + tex + "^x$. Find $f(" + x + ")$.", pre: "$f(" + x + ") =$", answer: ans,
          near: near(ans, [{ v: Math.pow(a * b, x), fb: "The power applies to the base only: work out $" + (b === 0.5 ? "\\left(\\frac{1}{2}\\right)" : b) + "^" + x + "$ first, then multiply by $" + a + "$." }, { v: a * b * x, fb: "The exponent $" + x + "$ means $" + x + "$ factors of the base, not multiplying by $" + x + "$." }]),
          hints: ["Power first, then multiply."], why: "$" + a + " \\cdot " + (b === 0.5 ? "\\frac{1}{" + Math.pow(2, x) + "}" : Math.pow(b, x)) + " = " + ans + "$." };
      } },
    { id: "pc4-ratio", title: "The growth factor from a table", lesson: 2,
      gen: function (R) {
        var b = R.pick([2, 3, 4, 5, 0.5, 1.5, 10]), a = (b === 0.5 || b === 1.5) ? 8 * R.int(1, 3) : R.int(2, 7), rows = [0, 1, 2, 3].map(function (i) { return [i, a * Math.pow(b, i)]; });
        return { type: "num", prompt: "This table is exponential. What is the growth factor $b$?" + tbl(["$x$", "$f(x)$"], rows), pre: "$b =$", answer: b, tol: 1e-9, shown: String(b),
          near: near(b, [{ v: rows[1][1] - rows[0][1], fb: "That is the difference. The growth factor is a **ratio**: divide $" + rows[1][1] + "$ by $" + rows[0][1] + "$." }, { v: rows[0][1], fb: "That is the start $a$. The factor is $\\frac{" + rows[1][1] + "}{" + rows[0][1] + "}$." }]),
          hints: ["Divide each output by the one before it."], why: "$\\frac{" + rows[1][1] + "}{" + rows[0][1] + "} = " + b + "$." };
      } },
    { id: "pc4-twopts", title: "Exponential function through two points", lesson: 3,
      gen: function (R) {
        var n = R.pick([2, 3]), b = R.pick([2, 3, 4, 5, 0.5]), a = b === 0.5 ? Math.pow(2, n) * R.int(1, 4) : R.int(2, 8), y = a * Math.pow(b, n);
        return { type: "num", prompt: "An exponential function $f(x) = a \\cdot b^x$ passes through $(0, " + a + ")$ and $(" + n + ", " + y + ")$. Find $b$.", pre: "$b =$", answer: b, tol: 1e-9, shown: String(b),
          near: near(b, [{ v: Math.pow(b, n), fb: "That is $b^" + n + " = \\frac{" + y + "}{" + a + "}$. Take the " + (n === 2 ? "square root" : "cube root") + " to get $b$." }, { v: y / a / n, fb: "Do not divide by the exponent: the power " + n + " is undone with a root." }]),
          hints: ["$a = " + a + "$, then $" + y + " = " + a + "b^" + n + "$."], why: "$b^" + n + " = \\frac{" + y + "}{" + a + "} = " + Math.pow(b, n) + "$, so $b = " + b + "$." };
      } },
    { id: "pc4-compound", title: "Compound interest", lesson: 4,
      gen: function (R) {
        var P = R.pick([1000, 2000, 5000]), r = R.pick([3, 4, 5, 6, 8]), t = R.pick([2, 3, 5, 10]);
        if (R.chance(0.4)) {
          var ans = Math.round(P * Math.exp(r / 100 * t) * 100) / 100;
          return { type: "num", prompt: "\\$" + P + " earns " + r + "% a year, compounded **continuously**, for " + t + " years. How much is there, to the nearest cent? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$A =$", post: "dollars", answer: ans, tol: 0.0051, calc: true,
            near: near(ans, [{ v: Math.round(P * Math.pow(1 + r / 100, t) * 100) / 100, tol: 0.0051, fb: "That compounds once a year. Continuous compounding uses $Pe^{rt}$." }]),
            hints: ["$A = Pe^{rt}$ with $r = " + r / 100 + "$."], why: "$" + P + "e^{" + parseFloat((r * t / 100).toFixed(2)) + "} \\approx " + ans + "$." };
        }
        var n = R.pick([1, 2, 4, 12]), ans2 = Math.round(P * Math.pow(1 + r / 100 / n, n * t) * 100) / 100;
        return { type: "num", prompt: "\\$" + P + " earns " + r + "% a year, compounded " + NAMES4[n] + ", for " + t + " years. How much is there, to the nearest cent? (You may type the sum, for example " + P + "*(1+" + r / 100 + "/" + n + ")^" + (n * t) + ".)", pre: "$A =$", post: "dollars", answer: ans2, tol: 0.0051, calc: true,
          near: near(ans2, [{ v: P * (1 + r / 100 * t), tol: 0.0051, fb: "That is simple interest. Compounding means the interest earns interest: use the power." }, { v: Math.round(P * Math.pow(1 + r / 100, n * t) * 100) / 100, tol: 0.0051, fb: "Split the rate: use $\\frac{r}{n}$ inside the bracket, not the whole $r$." }]),
          hints: ["$A = P\\left(1 + \\frac{r}{n}\\right)^{nt}$ with $r = " + r / 100 + "$, $n = " + n + "$."], why: "$" + P + "\\left(1 + \\frac{" + r / 100 + "}{" + n + "}\\right)^{" + n * t + "} \\approx " + ans2 + "$." };
      } },
    { id: "pc4-expgraph", title: "Growth or decay?", lesson: 5,
      gen: function (R) {
        var L = [["0.7^x", 0], ["\\left(\\tfrac{3}{2}\\right)^x", 1], ["\\left(\\tfrac{1}{4}\\right)^x", 0], ["2^{-x}", 0], ["e^x", 1], ["\\left(\\tfrac{1}{2}\\right)^{-x}", 1], ["1.05^x", 1], ["0.99^x", 0], ["3^{-x}", 0], ["5^x", 1]], c = R.pick(L), right = c[1] ? "Increasing" : "Decreasing";
        var why = c[1] ? "The base, written with a positive exponent, is above 1: it grows." : "The base, written with a positive exponent, is between 0 and 1: it decays.";
        return mc(R, { prompt: "Is $f(x) = " + c[0] + "$ increasing or decreasing?", right: right,
          wrong: ["Increasing", "Decreasing", "Constant"].filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: why + (c[0].indexOf("-x") >= 0 ? " Rewrite $b^{-x}$ as $\\left(\\frac{1}{b}\\right)^x$ first." : "") }; }), keep: true,
          hints: ["Above 1 grows; between 0 and 1 decays."], why: why });
      } },
    { id: "pc4-expshift", title: "The asymptote of a shifted exponential", lesson: 6,
      gen: function (R) {
        var a = R.pick([1, -1, 2, 3, -2, 5]), b = R.pick([2, 3, 4]), h = R.int(-3, 3), k = R.nz(-6, 6), lead = a === 1 ? "" : a === -1 ? "-" : a + " \\cdot ", ex = h === 0 ? "x" : "x " + signed(-h);
        return { type: "num", prompt: "What is the horizontal asymptote of $f(x) = " + lead + b + "^{" + ex + "} " + signed(k) + "$?", pre: "$y =$", answer: k,
          near: near(k, [{ v: -k, fb: "The asymptote is the number added at the end, with its own sign: $" + signed(k) + "$ means $y = " + k + "$." }, { v: h === 0 ? 99 : -h, fb: "The number inside the exponent shifts the graph sideways; it does not change the asymptote." }, { v: 0, fb: "$y = 0$ is the asymptote of $b^x$ itself. The shift moves it." }]),
          hints: ["The asymptote is $y = k$, the number added outside."], why: "$y = " + k + "$." };
      } },
    { id: "pc4-logform", title: "Logarithmic and exponential form", lesson: 7,
      gen: function (R) {
        var b = R.pick([2, 3, 5, 10]), n = R.int(2, 4), N = Math.pow(b, n);
        if (R.chance(0.5)) return mc(R, { prompt: "Write $\\log_{" + b + "} " + N + " = " + n + "$ in exponential form.", right: "$" + b + "^{" + n + "} = " + N + "$",
          wrong: [{ t: "$" + n + "^{" + b + "} = " + N + "$", fb: "The base of the log is the base of the power: $" + b + "$." }, { t: "$" + N + "^{" + n + "} = " + b + "$", fb: "$" + N + "$ is the **result** of the power, not its base." }], keep: true,
          hints: ["Base $" + b + "$, exponent $" + n + "$."], why: "$" + b + "^{" + n + "} = " + N + "$." });
        return mc(R, { prompt: "Write $" + b + "^{" + n + "} = " + N + "$ in logarithmic form.", right: "$\\log_{" + b + "} " + N + " = " + n + "$",
          wrong: [{ t: "$\\log_{" + n + "} " + N + " = " + b + "$", fb: "The base of the power, $" + b + "$, is the base of the log." }, { t: "$\\log_{" + b + "} " + n + " = " + N + "$", fb: "A log gives the **exponent** $" + n + "$, not the result $" + N + "$." }], keep: true,
          hints: ["Base $" + b + "$; the log is the exponent."], why: "$\\log_{" + b + "} " + N + " = " + n + "$." });
      } },
    { id: "pc4-evallog", title: "Evaluate a logarithm", lesson: 8,
      gen: function (R) {
        var t = R.int(0, 3), b = R.pick([2, 3, 5, 7]), n = R.int(2, 5), k = R.nz(-4, 4);
        if (t === 0) return { type: "num", prompt: "Evaluate $\\log_{" + b + "} " + Math.pow(b, n) + "$.", pre: "value =", answer: n, near: near(n, [{ v: Math.pow(b, n) / b, fb: "That divides by the base. A log is the **exponent**: $" + b + "^? = " + Math.pow(b, n) + "$." }]), hints: ["$" + b + "^? = " + Math.pow(b, n) + "$."], why: "$" + b + "^{" + n + "} = " + Math.pow(b, n) + "$." };
        if (t === 1) return { type: "num", prompt: "Evaluate $\\log_{" + b + "} \\dfrac{1}{" + Math.pow(b, n) + "}$.", pre: "value =", answer: -n, near: near(-n, [{ v: n, fb: "A fraction below 1 needs a **negative** exponent: $" + b + "^{-" + n + "} = \\frac{1}{" + Math.pow(b, n) + "}$." }]), hints: ["$\\frac{1}{" + Math.pow(b, n) + "} = " + b + "^{-" + n + "}$."], why: "$" + b + "^{-" + n + "} = \\frac{1}{" + Math.pow(b, n) + "}$." };
        if (t === 2) { var k2 = R.nz(-3, 4), val = k2 >= 0 ? Math.pow(10, k2) : "0." + "0".repeat(-k2 - 1) + "1"; return { type: "num", prompt: "Evaluate $\\log " + val + "$.", pre: "value =", answer: k2, near: near(k2, [{ v: -k2, fb: "Check the sign: " + (k2 >= 0 ? "a number above 1 has a positive log." : "a number between 0 and 1 has a negative log.") }]), hints: ["$\\log$ is base 10: $10^? = " + val + "$."], why: "$10^{" + k2 + "} = " + val + "$." }; }
        return { type: "num", prompt: "Evaluate $\\ln e^{" + (k < 0 ? "(" + k + ")" : k) + "}$.", pre: "value =", answer: k, near: near(k, [{ v: -k, fb: "$\\ln e^x = x$: the exponent comes out unchanged, sign and all." }]), hints: ["$\\ln$ and $e^x$ undo each other."], why: "$\\ln e^{" + k + "} = " + k + "$." };
      } },
    { id: "pc4-loggraph", title: "A point on a logarithm graph", lesson: 9,
      gen: function (R) {
        var b = R.pick([2, 3, 4, 5, 6, 7, 10]), n = R.int(2, 3), N = Math.pow(b, n), neg = R.chance(0.35);
        var fr = neg ? "\\frac{1}{" + N + "}" : String(N), y = neg ? -n : n;
        return mc(R, { prompt: "Which point is on the graph of $y = \\log_{" + b + "} x$?", right: "$(" + fr + ",\\ " + y + ")$",
          wrong: [{ t: "$(" + y + ",\\ " + fr + ")$", fb: "That has the coordinates swapped: it is on $y = " + b + "^x$. For the log, the input is $" + fr + "$ and the output is the exponent $" + y + "$." }, { t: "$(" + b + ",\\ " + y + ")$", fb: "$\\log_{" + b + "} " + b + " = 1$, not $" + y + "$." }, { t: "$(" + n + ",\\ " + b * n + ")$", fb: "A log graph passes through $(1, 0)$ and $(" + b + ", 1)$, not through multiples." }], keep: true,
          hints: ["$" + b + "^{" + y + "} = " + fr + "$."], why: "$" + b + "^{" + y + "} = " + fr + "$, so $\\log_{" + b + "} " + fr + " = " + y + "$." });
      } },
    { id: "pc4-logdomain", title: "The domain of a logarithm", lesson: 10,
      gen: function (R) {
        var form = R.int(0, 3), p, f, right;
        if (form === 0) { p = R.nz(-6, 6); f = "x " + signed(-p); right = [">", p]; }
        else if (form === 1) { p = R.nz(-6, 6); f = "x " + signed(p); right = [">", -p]; }
        else if (form === 2) { p = R.nz(-6, 6); f = p + " - x"; right = ["<", p]; }
        else { var m = R.pick([2, 3, 4]); p = R.nz(-4, 5); f = m + "x " + signed(-m * p); right = [">", p]; }
        var fmt2 = function (o, v) { return "$x " + o + " " + v + "$"; }, rt = fmt2(right[0], right[1]);
        var opts = [[">", p], ["<", p], [">", -p], ["<", -p]].map(function (o) { return fmt2(o[0], o[1]); }).filter(function (t, i, a) { return a.indexOf(t) === i && t !== rt; }).slice(0, 3);
        return mc(R, { prompt: "What is the domain of $f(x) = \\log_2(" + f + ")$?", right: rt,
          wrong: opts.map(function (t) { return { t: t, fb: "The inside $" + f + "$ must be **positive**: solve $" + f + " > 0$." }; }), keep: true,
          hints: ["Set the inside greater than 0 and solve."], why: "$" + f + " > 0$ gives " + rt + "." });
      } },
    { id: "pc4-loglaws", title: "Use the laws of logarithms", lesson: 11,
      gen: function (R) {
        if (R.chance(0.5)) {
          var c = R.pick([[4, 25, 2], [2, 50, 2], [8, 125, 3], [5, 20, 2], [25, 40, 3], [50, 20, 3], [4, 250, 3], [2, 500, 3]]);
          return { type: "num", prompt: "Evaluate $\\log " + c[0] + " + \\log " + c[1] + "$.", pre: "value =", answer: c[2], near: near(c[2], [{ v: c[0] + c[1], fb: "Add the **logs**, not the numbers: $\\log " + c[0] + " + \\log " + c[1] + " = \\log(" + c[0] + " \\cdot " + c[1] + ")$." }]), hints: ["Product law: $\\log(" + c[0] + " \\cdot " + c[1] + ")$."], why: "$\\log " + c[0] * c[1] + " = " + c[2] + "$." };
        }
        var b = R.pick([2, 3, 5]), n = R.int(2, 3), d = R.pick([2, 3, 4]), M = d * Math.pow(b, n);
        return { type: "num", prompt: "Evaluate $\\log_{" + b + "} " + M + " - \\log_{" + b + "} " + d + "$.", pre: "value =", answer: n, near: near(n, [{ v: M - d, fb: "Subtract the **logs**, not the numbers: it is $\\log_{" + b + "}\\frac{" + M + "}{" + d + "}$." }, { v: M / d, fb: "That is the quotient $\\frac{" + M + "}{" + d + "}$. The answer is the **log** of it." }]), hints: ["Quotient law: $\\log_{" + b + "} \\frac{" + M + "}{" + d + "}$."], why: "$\\log_{" + b + "} " + Math.pow(b, n) + " = " + n + "$." };
      } },
    { id: "pc4-changebase", title: "Change of base", lesson: 12,
      gen: function (R) {
        var b = R.pick([2, 3, 4, 5, 6, 7]), N = R.pick([10, 20, 30, 50, 100]), ans = Math.log(N) / Math.log(b);
        return { type: "num", prompt: "Find $\\log_{" + b + "} " + N + "$ to 3 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$\\approx$", answer: Math.round(ans * 10000) / 10000, tol: 0.00051, calc: true,
          near: near(ans, [{ v: Math.log(b) / Math.log(N), tol: 0.00051, fb: "That is upside down. The **number** goes on top: $\\frac{\\ln " + N + "}{\\ln " + b + "}$." }, { v: N / b, tol: 0.00051, fb: "Do not divide the numbers: take the log of each first." }]),
          hints: ["$\\frac{\\ln " + N + "}{\\ln " + b + "}$."], why: "$\\frac{" + f4(Math.log(N), 4) + "}{" + f4(Math.log(b), 4) + "} \\approx " + f4(ans, 3) + "$." };
      } },
    { id: "pc4-samebase", title: "Solve with a common base", lesson: 13,
      gen: function (R) {
        var a = R.pick([2, 3, 5]), top = a === 2 ? 6 : a === 3 ? 4 : 3, m, c, xs, k, tries = 0;
        do { m = R.pick([1, 2, 3]); c = R.int(-2, 3); xs = R.pick([-1, 1, 2, 3, 0.5, 1.5, 2.5, 4]); k = m * xs + c; tries++; } while ((k !== Math.round(k) || k < 1 || k > top || (m === 1 && c === 0)) && tries < 200);
        if (tries >= 200) { m = 2; c = -1; xs = 2.5; k = 4; a = 3; }
        var lhs = a + "^{" + (m === 1 ? "x" : m + "x") + (c === 0 ? "" : " " + signed(c)) + "}";
        return { type: "num", prompt: "Solve $" + lhs + " = " + Math.pow(a, k) + "$.", pre: "$x =$", answer: xs, tol: 1e-9, shown: String(xs),
          near: near(xs, [{ v: k, fb: "$" + k + "$ is the exponent on the right. Set $" + (m === 1 ? "x" : m + "x") + (c === 0 ? "" : " " + signed(c)) + " = " + k + "$ and solve." }, { v: k - c, fb: "That is $" + (m === 1 ? "x" : m + "x") + "$. Divide by " + m + " to get $x$." }]),
          hints: ["$" + Math.pow(a, k) + " = " + a + "^{" + k + "}$, then set the exponents equal."], why: "$" + (m === 1 ? "x" : m + "x") + (c === 0 ? "" : " " + signed(c)) + " = " + k + "$, so $x = " + xs + "$." };
      } },
    { id: "pc4-explogs", title: "Solve with logarithms", lesson: 14,
      gen: function (R) {
        var a = R.pick([1, 2, 3, 5]), b = R.pick([2, 3, 5, 7]), cc = R.pick([20, 50, 100, 200]), ans = Math.log(cc / a) / Math.log(b), lead = a === 1 ? "" : a + " \\cdot ";
        return { type: "num", prompt: "Solve $" + lead + b + "^x = " + cc + "$ to 3 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$x \\approx$", answer: Math.round(ans * 10000) / 10000, tol: 0.00051, calc: true,
          near: near(ans, [{ v: cc / a / b, tol: 0.00051, fb: "Dividing does not undo an exponent: take the log of both sides." }].concat(a === 1 ? [] : [{ v: Math.log(cc) / Math.log(b), tol: 0.00051, fb: "Divide by " + a + " **first** so the exponential is alone: $" + b + "^x = \\frac{" + cc + "}{" + a + "}$." }])),
          hints: ["Isolate the power, then $x = \\frac{\\ln(\\text{right side})}{\\ln " + b + "}$."], why: "$x = \\frac{\\ln " + (cc / a) + "}{\\ln " + b + "} \\approx " + f4(ans, 3) + "$." };
      } },
    { id: "pc4-logeq", title: "Solve a logarithmic equation", lesson: 15,
      gen: function (R) {
        var b = R.pick([2, 3, 4, 5]), n = R.pick([2, 3]), m = R.pick([1, 1, 2]), c, v = Math.pow(b, n), tries = 0;
        do { c = R.nz(-6, 7); tries++; } while (((v - c) % m !== 0) && tries < 100);
        if ((v - c) % m !== 0) { c = v % 2 === 0 ? 2 : 1; m = 1; }
        var ans = (v - c) / m, ins = (m === 1 ? "x" : m + "x") + " " + signed(c);
        return { type: "num", prompt: "Solve $\\log_{" + b + "}(" + ins + ") = " + n + "$.", pre: "$x =$", answer: ans,
          near: near(ans, [{ v: n - c, fb: "Convert to exponential form first: $" + b + "^{" + n + "} = " + ins + "$." }].concat(m === 1 ? [] : [{ v: v - c, fb: "That is $" + m + "x$. Divide by " + m + " to get $x$." }])),
          hints: ["$" + b + "^{" + n + "} = " + ins + "$."], why: "$" + v + " = " + ins + "$, so $x = " + ans + "$." };
      } },
    { id: "pc4-growth", title: "Predict with a growth or decay model", lesson: 16,
      gen: function (R) {
        if (R.chance(0.4)) {
          var h = R.pick([3, 5, 6, 10]), k = R.int(2, 4), A0 = R.int(1, 5) * 80, t = h * k, ans = A0 / Math.pow(2, k);
          return { type: "num", prompt: "A substance has a half-life of " + h + " days. There are " + A0 + " grams to start. How many grams are left after " + t + " days?", pre: "$A =$", post: "grams", answer: ans,
            near: near(ans, [{ v: A0 / 2, fb: "That is after one half-life. " + t + " days is " + k + " half-lives." }, { v: A0 - k * A0 / 2, fb: "Halving is repeated multiplying by $\\frac{1}{2}$, not subtracting." }].filter(function (o) { return o.v >= 0; })),
            hints: ["$" + t + " \\div " + h + " = " + k + "$ half-lives."], why: "$" + A0 + " \\cdot \\left(\\frac{1}{2}\\right)^{" + k + "} = " + ans + "$." };
        }
        var grow = R.chance(0.6), r = R.pick([2, 3, 4, 5, 6, 8]), A1 = R.pick([1000, 5000, 12000, 25000]), t2 = R.int(3, 8), b = grow ? 1 + r / 100 : 1 - r / 100, ans2 = Math.round(A1 * Math.pow(b, t2) * 100) / 100;
        return { type: "num", prompt: (grow ? "A population of " + A1 + " grows" : "A machine worth \\$" + A1 + " loses") + " " + r + "% every year. What is the " + (grow ? "population" : "value") + " after " + t2 + " years, to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$A \\approx$", answer: ans2, tol: 0.0051, calc: true,
          near: near(ans2, [{ v: A1 * (1 + (grow ? 1 : -1) * r / 100 * t2), tol: 0.0051, fb: "That adds the percentage once for each year, without compounding. Use $b^t$." }, { v: Math.round(A1 * Math.pow(r / 100, t2) * 100) / 100, tol: 0.0051, fb: "The factor is $" + (grow ? "1 + " : "1 - ") + (r / 100) + " = " + f4(b, 2) + "$, not just the percentage." }]),
          hints: ["$b = " + (grow ? "1 + " : "1 - ") + r / 100 + " = " + f4(b, 2) + "$."], why: "$" + A1 + " \\cdot " + f4(b, 2) + "^{" + t2 + "} \\approx " + ans2 + "$." };
      } },
    { id: "pc4-doubling", title: "Doubling time and time to reach a target", lesson: 17,
      gen: function (R) {
        if (R.chance(0.5)) {
          var r = R.pick([3, 4, 5, 6, 7, 8, 9]), ans = Math.log(2) / Math.log(1 + r / 100);
          return { type: "num", prompt: "Money grows " + r + "% a year. How many years until it doubles? Answer to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$t \\approx$", post: "years", answer: Math.round(ans * 10000) / 10000, tol: 0.0051, calc: true,
            near: near(ans, [{ v: 72 / r, tol: 0.0051, fb: "That is the rule-of-72 estimate. The exact value uses the logarithm: $\\frac{\\ln 2}{\\ln " + f4(1 + r / 100, 2) + "}$." }, { v: 100 / r, tol: 0.0051, fb: "That is how long it takes to earn 100% *without* compounding. Use the logarithm." }]),
            hints: ["$t = \\frac{\\ln 2}{\\ln " + f4(1 + r / 100, 2) + "}$."], why: "$t = \\frac{\\ln 2}{\\ln " + f4(1 + r / 100, 2) + "} \\approx " + f4(ans, 2) + "$ years." };
        }
        var k = R.pick([2, 3, 5, 10]) / 100, mult = R.pick([2, 3, 5]), ans2 = Math.log(mult) / k;
        return { type: "num", prompt: "A quantity grows continuously at " + k * 100 + "% per hour, $N = N_0e^{" + k + "t}$. How many hours until it is " + (mult === 2 ? "doubled" : mult + " times as big") + ", to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$t \\approx$", post: "hours", answer: Math.round(ans2 * 10000) / 10000, tol: 0.0051, calc: true,
          near: near(ans2, [{ v: mult / k, tol: 0.0051, fb: "Take $\\ln$ of both sides: $kt = \\ln " + mult + "$, so $t = \\frac{\\ln " + mult + "}{" + k + "}$." }]),
          hints: ["$e^{" + k + "t} = " + mult + "$, so $" + k + "t = \\ln " + mult + "$."], why: "$t = \\frac{\\ln " + mult + "}{" + k + "} \\approx " + f4(ans2, 2) + "$." };
      } },
    { id: "pc4-logscale", title: "Logarithmic scales", lesson: 18,
      gen: function (R) {
        var d = R.int(2, 5), m1 = R.int(2, 8 - d), kind = R.int(0, 1);
        if (kind === 0) return { type: "num", prompt: "How many times stronger (in amplitude) is a magnitude " + (m1 + d) + " earthquake than a magnitude " + m1 + " earthquake? (Each whole number on the scale is a factor of 10.)", answer: Math.pow(10, d),
          near: near(Math.pow(10, d), [big(Math.pow(10, d)), { v: d, fb: "$" + d + "$ is the difference on the scale. The amplitude changes by $10^{" + d + "}$." }, { v: (m1 + d) / m1, tol: 0.001, fb: "The scale is logarithmic: compare the **difference**, not the ratio." }].filter(function (o) { return o.v !== Math.pow(10, d); })),
          hints: ["$10^{" + (m1 + d) + " - " + m1 + "}$."], why: "$10^{" + d + "} = " + Math.pow(10, d) + "$." };
        var p1 = R.int(2, 6), p2 = Math.min(13, p1 + d);
        return { type: "num", prompt: "Solution A has pH " + p2 + " and solution B has pH " + p1 + ". How many times larger is the hydrogen concentration of B than of A? (pH $= -\\log[H^+]$.)", answer: Math.pow(10, p2 - p1),
          near: near(Math.pow(10, p2 - p1), [{ v: p2 - p1, fb: "That is the difference in pH. Each pH step is a factor of 10." }, { v: Math.pow(10, p1 - p2), tol: 1e-9, fb: "Lower pH means **more** hydrogen: B has the larger concentration." }]),
          hints: ["The difference in pH is " + (p2 - p1) + "."], why: "$10^{" + (p2 - p1) + "} = " + Math.pow(10, p2 - p1) + "$." };
      } },
    { id: "pc4-predict", title: "Predict from an exponential table", lesson: 19,
      gen: function (R) {
        var b = R.pick([2, 3, 2, 0.5]), a = b === 0.5 ? 16 * R.int(1, 4) : R.int(2, 7), rows = [0, 1, 2, 3].map(function (i) { return [i, a * Math.pow(b, i)]; }), k = R.int(4, 6), ans = a * Math.pow(b, k);
        return { type: "num", prompt: "This table is exponential. Predict $f(" + k + ")$." + tbl(["$x$", "$f(x)$"], rows), pre: "$f(" + k + ") =$", answer: ans,
          near: near(ans, [{ v: rows[3][1] + (rows[1][1] - rows[0][1]) * (k - 3), fb: "That keeps adding the same amount, which would be linear. Keep **multiplying** by the ratio." }]),
          hints: ["Find $b$ first: divide neighbours. Then $f(x) = " + a + " \\cdot b^x$."], why: "$f(x) = " + a + " \\cdot " + b + "^x$, so $f(" + k + ") = " + ans + "$." };
      } },
    { id: "pc4-whichmodel", title: "Which model fits?", lesson: 20,
      gen: function (R) {
        var kind = R.int(0, 2), s = R.int(2, 6), vals, right, why;
        if (kind === 0) { var d = R.pick([2, 3, 4, 5, -3]); vals = [0, 1, 2, 3].map(function (i) { return s + d * i + (d < 0 ? 20 : 0); }); right = "Linear"; why = "The differences are all " + d + "."; }
        else if (kind === 1) { var r = R.pick([2, 3, 0.5]), s2 = r === 0.5 ? 8 * R.int(1, 3) : s; vals = [0, 1, 2, 3].map(function (i) { return s2 * Math.pow(r, i); }); right = "Exponential"; why = "The ratios are all " + r + "."; }
        else { var o = R.pick([0, 1, 2]); vals = [1, 2, 3, 4].map(function (i) { return i * i + o; }); right = "Neither"; why = "The differences are not constant and the ratios are not constant: these are squares."; }
        return mc(R, { prompt: "The outputs for $x = 0, 1, 2, 3$ are $" + vals.join(",\\ ") + "$. Which model fits best?", right: right,
          wrong: ["Linear", "Exponential", "Neither"].filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: why }; }), keep: true,
          hints: ["Subtract neighbours; divide neighbours."], why: why });
      } }
  ];
  L.unit("precalc", 4, {
    title: "Exponential and Logarithmic Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Exponential functions, finding a and b, and compound interest.", skills: ["pc4-expfn", "pc4-ratio", "pc4-twopts", "pc4-compound"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Graphs of exponential functions and their transformations.", skills: ["pc4-expgraph", "pc4-expshift"], per: 2 },
      { title: "Quiz 3", after: 10, blurb: "Logarithms: forms, values, graphs and domains.", skills: ["pc4-logform", "pc4-evallog", "pc4-loggraph", "pc4-logdomain"], per: 2 },
      { title: "Quiz 4", after: 12, blurb: "The laws of logarithms and change of base.", skills: ["pc4-loglaws", "pc4-changebase"], per: 2 },
      { title: "Quiz 5", after: 15, blurb: "Solving exponential and logarithmic equations.", skills: ["pc4-samebase", "pc4-explogs", "pc4-logeq"], per: 2 },
      { title: "Quiz 6", after: 20, blurb: "Models: growth and decay, doubling time, scales and choosing a model.", skills: ["pc4-growth", "pc4-doubling", "pc4-logscale", "pc4-predict", "pc4-whichmodel"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:4", {
    2: { name: "Exponential functions", frame: "An exponential function multiplies by the same [[factor]] each time $x$ goes up by 1: $f(x) =$ [[$a \\cdot b^x$]]. Here $a$ is the [[start]] and $b$ is the growth factor. Divide each output by the one before it: a constant [[ratio]] means exponential.",
         chips: ["difference", "sum"], fb: { "difference": "A constant difference means linear. Exponential has a constant ratio.", "sum": "We divide neighbouring outputs, not add them." } },
    3: { name: "Two points", frame: "If one point is $(0, a)$, then $a$ is its [[output]]. Substitute the other point and solve for $b$ with a [[root]]. If neither point is at $x = 0$, [[divide]] the two equations so $a$ cancels.",
         chips: ["square", "add"], fb: { "square": "A root undoes the power on $b$; squaring would make it worse.", "add": "Dividing the equations is what cancels $a$." } },
    4: { name: "Compound interest", frame: "Interest added $n$ times a year: $A =$ [[$P\\left(1 + \\frac{r}{n}\\right)^{nt}$]]. The rate $r$ is a [[decimal]]. Added continuously: $A =$ [[$Pe^{rt}$]], where $e \\approx$ [[2.718]].",
         chips: ["$Pe^{n}$", "percent"], fb: { "$Pe^{n}$": "Continuous compounding uses $Pe^{rt}$.", "percent": "Use the rate as a decimal: 6% is $0.06$." } },
    5: { name: "Graph of $b^x$", frame: "The graph of $y = b^x$ passes through [[$(0, 1)$]] and never touches the $x$-axis: the horizontal asymptote is $y =$ [[0]]. If $b > 1$ it [[grows]]; if $0 < b < 1$ it [[decays]]. The range is $y >$ [[0]].",
         chips: ["$(1, 0)$", "all reals"], fb: { "$(1, 0)$": "$b^0 = 1$, so the graph passes through $(0, 1)$.", "all reals": "A power of a positive base is always positive: the range is $y > 0$." } },
    6: { name: "Shifting exponential graphs", frame: "In $y = a \\cdot b^{x - h} + k$, the horizontal asymptote moves to $y =$ [[$k$]]. The number $h$ shifts the graph [[sideways]], and a negative $a$ [[flips]] it over the $x$-axis.",
         chips: ["$h$", "up"], fb: { "$h$": "$h$ shifts the graph sideways. The asymptote is $y = k$.", "up": "A shift up changes $k$, which moves the asymptote: it is not what $h$ does." } },
    7: { name: "Logarithms", frame: "$\\log_b x = y$ means [[$b^y = x$]]. A logarithm is an [[exponent]]. The base $b$ is positive and not [[1]], and the number $x$ must be [[positive]].",
         chips: ["$y^b = x$", "negative"], fb: { "$y^b = x$": "The base of the log stays the base of the power: $b^y = x$.", "negative": "You cannot take the log of zero or a negative number." } },
    8: { name: "Common and natural logs", frame: "$\\log x$ means base [[10]]; $\\ln x$ means base [[$e$]]. A power of the base gives a whole answer: $\\log 1000 =$ [[3]]. $\\ln e^x =$ [[$x$]]. A log of a number between 0 and 1 is [[negative]].",
         chips: ["2", "positive"], fb: { "2": "Without a base written, $\\log$ is base 10.", "positive": "Numbers below 1 have negative logs: $\\log 0.01 = -2$." } },
    9: { name: "Graph of a logarithm", frame: "The graph of $y = \\log_b x$ passes through [[$(1, 0)$]] and [[$(b, 1)$]]. The vertical asymptote is $x =$ [[0]], the domain is $x >$ [[0]] and the range is all [[real]] numbers. It is the mirror image of $b^x$ in the line [[$y = x$]].",
         chips: ["$(0, 1)$", "$y > 0$"], fb: { "$(0, 1)$": "That point is on $b^x$. On the log graph the coordinates are swapped: $(1, 0)$.", "$y > 0$": "The range of a log is **all** real numbers; the domain is $x > 0$." } },
    10: { name: "Shifting log graphs", frame: "For $y = a\\log_b(x - h) + k$, the inside $x - h$ must be [[positive]], so the domain is $x >$ [[$h$]] and the vertical asymptote is $x =$ [[$h$]]. A [[negative]] $a$ flips the graph over the $x$-axis.",
          chips: ["$y = h$", "zero"], fb: { "$y = h$": "The asymptote of a log graph is vertical: $x = h$.", "zero": "The inside can approach 0 but must stay positive." } },
    11: { name: "Laws of logarithms", frame: "Product: $\\log_b(MN) =$ [[$\\log_b M + \\log_b N$]]. Quotient: $\\log_b\\frac{M}{N} =$ [[$\\log_b M - \\log_b N$]]. Power: $\\log_b M^n =$ [[$n\\log_b M$]]. There is no law for the log of a [[sum]].",
          chips: ["$\\log_b M \\cdot \\log_b N$", "product"], fb: { "$\\log_b M \\cdot \\log_b N$": "A product inside becomes a **sum** of logs.", "product": "There is a law for a product, but not for a sum." } },
    12: { name: "Change of base", frame: "$\\log_b M =$ [[$\\frac{\\ln M}{\\ln b}$]]. The [[number]] goes on top and the [[base]] on the bottom. LOG or LN gives the same [[ratio]].",
          chips: ["$\\frac{\\ln b}{\\ln M}$", "difference"], fb: { "$\\frac{\\ln b}{\\ln M}$": "That is upside down: the number goes on top.", "difference": "It is a quotient of logs, not a difference." } },
    13: { name: "Same base", frame: "If $b^m = b^n$ then [[$m = n$]]. Rewrite both sides as powers of the [[same base]], set the [[exponents]] equal and solve.",
          chips: ["$b = n$", "add"], fb: { "$b = n$": "The bases are already equal. It is the exponents that must match.", "add": "We set the exponents equal; no adding is needed." } },
    14: { name: "Solving with logs", frame: "To solve $ab^x = c$: [[isolate]] the exponential, take [[$\\ln$]] of both sides and use the power law to bring the [[exponent]] down, then divide: $x = \\frac{\\ln(c/a)}{\\ln b}$.",
          chips: ["subtract", "root"], fb: { "subtract": "Subtracting does not undo an exponent: take a log.", "root": "A root undoes a power with a fixed exponent, not a variable one." } },
    15: { name: "Log equations", frame: "A single log equal to a number: rewrite in [[exponential]] form. Two logs of the same base: set the [[insides]] equal. Then [[check]]: reject any answer that makes an inside zero or [[negative]].",
          chips: ["ignore", "positive"], fb: { "ignore": "You cannot skip the check: extra roots can appear.", "positive": "The inside must stay positive: a negative inside is the one to reject." } },
    16: { name: "Growth and decay", frame: "$A(t) = A_0 b^t$ with $b = 1 +$ [[$r$]] for growth and $b = 1 -$ [[$r$]] for decay. With half-life $h$: $A(t) = A_0\\left(\\frac{1}{2}\\right)^{t/h}$. The time $t$ must match the [[period]].",
          chips: ["$r$ alone", "sum"], fb: { "$r$ alone": "The factor is $1 + r$ or $1 - r$, not just $r$.", "sum": "We use a product of growth factors, not a sum." } },
    17: { name: "Time to reach a goal", frame: "To find when $A_0 b^t = A$, take logs: $t =$ [[$\\frac{\\ln(A/A_0)}{\\ln b}$]]. Doubling time is $\\frac{\\ln 2}{\\ln b}$, or $\\frac{\\ln 2}{k}$ for continuous growth. The rule of [[72]] estimates it as $72 \\div r$.",
          chips: ["$\\frac{A}{A_0}$", "100"], fb: { "$\\frac{A}{A_0}$": "That is the ratio. The time is its **log** over $\\ln b$.", "100": "The rule of 72 uses 72, not 100." } },
    18: { name: "Logarithmic scales", frame: "On a log scale each whole step is a factor of [[10]]. A difference of $d$ means $10^{d}$ times as much. pH $= -$ [[$\\log[H^+]$]]. A lower pH means [[more]] acid.",
          chips: ["2", "less"], fb: { "2": "Each step on the Richter or pH scale is a factor of 10.", "less": "pH $= -\\log[H^+]$: a lower pH means a larger concentration, so more acid." } },
    19: { name: "Fitting exponentials", frame: "Look at the [[ratios]] of neighbouring outputs: about constant means exponential. Fit $a \\cdot b^x$ through [[two points]] (far apart) or use a calculator's [[ExpReg]], then [[test]] the model against all the data.",
          chips: ["differences", "guess"], fb: { "differences": "Constant differences suggest a linear model, not an exponential one.", "guess": "Fitting is calculated; testing is how you know it is good." } },
    20: { name: "Choosing a model", frame: "Constant [[differences]]: linear. Constant [[ratios]]: exponential. Each time the input is [[multiplied]], the output adds a fixed amount: logarithmic. If data levels off, subtract the [[level]] first.",
          chips: ["curve", "fast"], fb: { "curve": "A curved graph could be many things: test differences and ratios.", "fast": "Growing fast does not make a function exponential: $x^2$ grows fast too." } }
  });
})();
