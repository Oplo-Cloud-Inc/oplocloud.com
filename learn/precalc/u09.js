/* ==========================================================================
   Precalculus — Unit 9: Systems of Equations and Inequalities. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 9: systems of linear equations in two
   and three unknowns (graphing, substitution, elimination, the special cases),
   nonlinear systems and inequalities, partial fractions, matrices and their
   operations, Gaussian elimination, inverse matrices and Cramer's rule. Each
   section is split into lessons small enough to finish in one sitting; each
   teaches one method: the idea, an example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at the end.

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
    blurb: "Before Chapter 9 · Solving an equation, evaluating a line, expanding, solving for a variable and factoring a quadratic.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Solve", prompt: "Solve $2x + 3 = 11$.", pre: "$x =$", answer: 4, skill: "Linear equations", near: [{ v: 7, fb: "Subtract 3 first: $2x = 8$, then divide by 2." }], hints: ["Subtract 3, then divide by 2."], why: "$x = 4$." },
      { type: "num", kicker: "Check 2 · Lines", prompt: "A line is $y = 2x - 1$. What is $y$ when $x = 3$?", pre: "$y =$", answer: 5, skill: "Evaluate a function", near: [{ v: 6, fb: "$2 \\cdot 3 = 6$, then subtract 1." }], hints: ["$2(3) - 1$."], why: "$y = 5$." },
      { type: "choice", kicker: "Check 3 · Expand", prompt: "Expand $3(x + 2) - 2x$.",
        options: [{ t: "$x + 6$" }, { t: "$5x + 6$", fb: "Subtract $2x$: $3x - 2x = x$." }, { t: "$x + 2$", fb: "Multiply the 2 by 3 as well: $3 \\cdot 2 = 6$." }],
        answer: 0, skill: "Distributive property", hints: ["$3x + 6 - 2x$."], why: "$x + 6$." },
      { type: "choice", kicker: "Check 4 · Rearrange", prompt: "Solve $3x + y = 7$ for $y$.",
        options: [{ t: "$y = 7 - 3x$" }, { t: "$y = 7 + 3x$", fb: "Subtract $3x$ from both sides: the sign changes." }, { t: "$y = \\dfrac{7}{3x}$", fb: "$3x$ is **added** to $y$, so subtract it; do not divide." }],
        answer: 0, skill: "Solve for a variable", hints: ["Subtract $3x$ from both sides."], why: "$y = 7 - 3x$." },
      { type: "choice", kicker: "Check 5 · Quadratics", prompt: "Solve $x^2 - 5x + 6 = 0$.",
        options: [{ t: "$x = 2$ or $x = 3$" }, { t: "$x = -2$ or $x = -3$", fb: "$(x - 2)(x - 3) = 0$: set each factor to 0." }, { t: "$x = 1$ or $x = 6$", fb: "$1 \\cdot 6 = 6$ but $1 + 6 \\ne 5$." }],
        answer: 0, skill: "Factoring", hints: ["Two numbers that multiply to 6 and add to 5."], why: "$(x - 2)(x - 3) = 0$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 9.1**. If **check 2** slipped, look again at lesson 2.2. If **check 5** slipped, revisit lesson 3.3.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= helpers for Chapter 9 */
  var f4 = function (v, d) { var k = Math.pow(10, d == null ? 2 : d); return Math.round(v * k) / k; };
  var LN = function (m, b) { return function (x) { return m * x + b; }; };
  var GEN9 = " (The box accepts expressions such as 3*sin(20°).)";

  /* ============================================ 1 · Systems of equations: where two lines meet */
  var HOW_1 = [["Rewrite", "Write each equation as $y = mx + b$."],
               ["Meet", "Find where the two lines are at the same height."],
               ["Check", "Substitute the pair into **both** equations."]];
  var G1 = function (k) {
    var yr = [-5, 4], it = curve(LN(-1, 2), -2, 6, "blue", yr).concat(curve(LN(2, -7), -2, 6, "orange", yr));
    if (k >= 2) it.push(dot(3, -1, "green", "(3, -1)", "ne"));
    return grid("The lines y = -x + 2 and y = 2x - 7" + (k >= 2 ? " crossing at the point (3, -1)" : "") + ".", it, { x: [-2, 6], y: [-5, 4], u: 24 });
  };
  LESSONS.push({
    title: "Systems of equations: where two lines meet", art: "pcsys",
    blurb: "Book 9.1 · A solution is a point on both graphs. Two lines meet once, never, or everywhere.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The point $(2, 3)$ lies on the line $y = x + 1$. Does it also lie on $y = 5 - x$?",
        options: [{ t: "Yes: $5 - 2 = 3$" }, { t: "No: the lines have different slopes", fb: "Different slopes mean the lines cross **once**. Check whether $(2, 3)$ is that crossing point: $5 - 2 = 3$." }, { t: "Only when $x = 0$", fb: "Test the point itself: put $x = 2$ into $y = 5 - x$." }],
        answer: 0, skill: "Points on a line", hints: ["Put $x = 2$ into $y = 5 - x$."], why: "$5 - 2 = 3$: it is on both lines." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue line is $y = x + 1$. Slide the slope $m$ and intercept $c$ of the orange line $y = mx + c$ and watch where the two lines meet. Find a case where they meet **once**, **never** and **everywhere**.",
        scene: { type: "sketch", x: [-6, 6], y: [-5, 7], u: 24, w: 336, gate: true, pts: {},
          params: { m: { min: -3, max: 3, step: 1, v: -1, label: "slope $m$" }, c: { min: -4, max: 5, step: 1, v: 3, label: "intercept $c$" } },
          track: function (s) { return s.p.m !== 1 ? "one" : s.p.c === 1 ? "inf" : "none"; },
          draw: function (s) { var it = curve(LN(1, 1), -6, 6, "blue", [-5, 7]).concat(curve(LN(s.p.m, s.p.c), -6, 6, "orange", [-5, 7])); if (s.p.m !== 1) { var x = (1 - s.p.c) / (s.p.m - 1), y = x + 1; if (Math.abs(x) <= 6 && y >= -5 && y <= 7) it.push(dot(x, y, "green")); } return it; },
          readout: function (s) { var m = s.p.m, c = s.p.c, what = m !== 1 ? "meet **once**, at $(" + nm(f4((1 - c) / (m - 1), 2)) + ", " + nm(f4((1 - c) / (m - 1) + 1, 2)) + ")$" : c === 1 ? "are the **same line**: they meet everywhere" : "are **parallel**: they never meet"; return "$y = x + 1$ and $y = " + (m === 1 ? "" : m === -1 ? "-" : m) + "x " + (c < 0 ? "-" : "+") + " " + Math.abs(c) + "$ " + what + "<br>Once: " + (s.tracked.one ? "✓" : "—") + " · never: " + (s.tracked.none ? "✓" : "—") + " · everywhere: " + (s.tracked.inf ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.one && s.tracked.none && s.tracked.inf); } },
        gate: true, then: "Two lines with **different slopes** meet at exactly **one** point: the **solution**. With the **same slope** but a different intercept ($m = 1$, $c \\ne 1$) they are **parallel**: no solution. With the same slope **and** the same intercept they are one line: **infinitely many** solutions." },
      { type: "learn", kicker: "The idea",
        prompt: "A **system of equations** is two or more equations that must be true **together**. Its **solution** is the point $(x, y)$ on **both** graphs, where the lines meet. To check a pair, substitute it into **both** equations: it has to make **both** true.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $x + y = 2$ and $2x - y = 7$ by graphing.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "x + y = 2 \\ \\Rightarrow \\ y = -x + 2", say: "Solve the first equation for $y$." },
          { step: 1, m: "2x - y = 7 \\ \\Rightarrow \\ y = 2x - 7", say: "And the second.", fig: G1(1) },
          { step: 2, m: "(3, -1)", say: "Draw both lines: they cross at $(3, -1)$.", fig: G1(2) },
          { step: 3, m: "3 + (-1) = 2", say: "Check the first equation.", ask: { prompt: "A pair is a solution only if it works in…", answer: 0, options: [{ t: "**both** equations" }, { t: "the first equation", fb: "It must be on **both** lines, so it must make **both** equations true." }] } },
          { step: 3, m: "2(3) - (-1) = 7", say: "And the second: both are true." }] },
        gate: true, then: "The solution is $(3, -1)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $y = 2x - 1$ and $y = -x + 5$ by finding where the two lines meet.",
        how: HOW_1, skill: "Systems by graphing",
        steps: [
          { step: 1, ask: "Both are already $y = \\dots$. The lines meet where their heights are equal. What do we set equal?", type: "choice", answer: 0, options: [{ t: "The two expressions for $y$: $2x - 1 = -x + 5$" }, { t: "The two slopes: $2 = -1$", fb: "Different slopes mean the lines cross once. To find **where**, set the heights equal." }], m: "2x - 1 = -x + 5", say: "Same height." },
          { step: 2, ask: "$2x - 1 = -x + 5$ gives $3x = 6$, so $x =$", type: "num", pre: "$x =$", answer: 2, near: [{ v: 4, fb: "Add $x$ to both sides and add 1: $3x = 6$. Then divide by 3." }], hint: "$6 \\div 3$.", m: "x = 2", say: "Where they meet across." },
          { step: 3, ask: "Then $y = 2x - 1 =$ (and it should also equal $-x + 5$)", type: "num", pre: "$y =$", answer: 3, near: [{ v: 4, fb: "$2(2) - 1 = 3$: not 4." }], hint: "$2(2) - 1$.", m: "(2, 3)", say: "Check: $-2 + 5 = 3$ as well." }],
        why: "Rewrite, meet, check." },
      { type: "choice", kicker: "On your own", prompt: "Is $(1, 4)$ a solution of the system $2x + y = 6$ and $x - y = -3$?",
        options: [{ t: "Yes: it works in both" }, { t: "No: it fails the first", fb: "$2(1) + 4 = 6$ ✓: the first works." }, { t: "No: it fails the second", fb: "$1 - 4 = -3$ ✓: the second works too." }],
        answer: 0, skill: "Systems by graphing", hints: ["Substitute $x = 1$, $y = 4$ into each."], why: "$2 + 4 = 6$ and $1 - 4 = -3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Equations not yet in $y = mx + b$ form.** Solve $x + 2y = 6$ and $x - y = 0$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "y = -\\tfrac{1}{2}x + 3", say: "From $x + 2y = 6$: $2y = -x + 6$." },
          { step: 1, m: "y = x", say: "From $x - y = 0$.", ask: { prompt: "Is the second line steeper or flatter than the first?", answer: 0, options: [{ t: "Steeper: slope 1 against $-\\frac{1}{2}$" }, { t: "Flatter", fb: "A slope of 1 is steeper in size than $\\frac{1}{2}$ in size." }] } },
          { step: 2, m: "x = -\\tfrac{1}{2}x + 3", say: "Equal heights: $\\frac{3}{2}x = 3$, so $x = 2$." },
          { step: 2, m: "(2, 2)", say: "On the line $y = x$: $y = 2$." },
          { step: 3, m: "2 + 2(2) = 6, \\ \\ 2 - 2 = 0", say: "Both equations check." }] },
        gate: true, then: "The solution is $(2, 2)$." },
      { type: "num", kicker: "Try it", prompt: "The lines $y = x + 2$ and $y = -x + 6$ meet at a point. What is its $y$-coordinate?", pre: "$y =$", answer: 4, skill: "Systems by graphing",
        near: [{ v: 2, fb: "That is the $x$-coordinate: $x + 2 = -x + 6$ gives $x = 2$. Then $y = 2 + 2$." }], hints: ["Set $x + 2 = -x + 6$."], why: "$x = 2$, $y = 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee says $(2, 0)$ solves $x + y = 2$ and $x - y = 4$, \"because it works in the first\". What is wrong?",
        options: [{ t: "It must work in **both**: $2 - 0 = 2$, not 4" }, { t: "Nothing: one equation is enough", fb: "A solution is a point on **both** lines." }, { t: "It fails the first too", fb: "$2 + 0 = 2$ works in the first: it is the second that fails." }],
        answer: 0, skill: "Systems by graphing", hints: ["Check the second equation."], why: "The solution is actually $(3, -1)$." },
      { type: "num", kicker: "Use it", prompt: "Cab A charges $\\$3$ plus $\\$2$ a mile: $3 + 2x$. Cab B charges $\\$1$ plus $\\$3$ a mile: $1 + 3x$. After how many miles do they cost the same?", pre: "miles =", answer: 2, skill: "Systems by graphing",
        near: [{ v: 7, fb: "That is the cost, $3 + 2(2)$, not the distance. Set $3 + 2x = 1 + 3x$." }], hints: ["$3 + 2x = 1 + 3x$."], why: "$x = 2$ miles (both cost $\\$7$)." }
    ]
  });

  /* ============================================ 2 · Substitution */
  var HOW_2 = [["Isolate", "Solve one equation for one variable."],
               ["Substitute", "Put it into the other equation and solve."],
               ["Go back", "Find the other variable, then check."]];
  LESSONS.push({
    title: "Substitution", art: "pcsys",
    blurb: "Book 9.1 · Solve one equation for $y$, replace $y$ in the other, and one variable is left.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $y = 2x - 1$, what is $x + y$ when $x = 3$?", pre: "$x + y =$", answer: 8, skill: "Substitution", near: [{ v: 5, fb: "That is $y$ alone. Add $x = 3$ as well." }], hints: ["$y = 5$."], why: "$3 + 5 = 8$." },
      { type: "learn", kicker: "Explore",
        prompt: "The system is $y = 2x - 1$ and $x + y = 8$. Slide $x$ and watch **both** heights: the blue point uses the first equation, the orange point uses the second. Find the $x$ where the two heights **agree**.",
        scene: { type: "sketch", x: [-2, 9], y: [-3, 10], u: 22, w: 290, gate: true, pts: {},
          params: { x: { min: 0, max: 8, step: 1, v: 1, label: "$x$" } },
          track: function (s) { return s.p.x === 3 ? "meet" : null; },
          draw: function (s) { var x = s.p.x, a = 2 * x - 1, b = 8 - x; return curve(LN(2, -1), -2, 9, "blue", [-3, 10]).concat(curve(LN(-1, 8), -2, 9, "orange", [-3, 10]), [{ seg: [[x, Math.max(-3, Math.min(10, a))], [x, Math.max(-3, Math.min(10, b))]], c: "soft", dash: true }, dot(x, a, "blue"), dot(x, b, "orange")]); },
          readout: function (s) { var x = s.p.x; return "$x = " + x + "$: first equation gives $y = " + nm(2 * x - 1) + "$, second gives $y = " + nm(8 - x) + "$ (gap $" + nm(3 * x - 9) + "$)<br>Heights agree: " + (s.tracked.meet ? "✓" : "—"); },
          goal: function (s) { return !!s.tracked.meet; } },
        gate: true, then: "The heights agree at $x = 3$, where both give $y = 5$. That is exactly what **substitution** does: replace $y$ in $x + y = 8$ by the first equation's $2x - 1$, which gives $x + (2x - 1) = 8$, so $3x = 9$ and $x = 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Substitution:** solve one equation for one variable (say $y = \\dots$), **substitute** that expression into the other equation, and solve the one-variable equation. Then **back-substitute** to find the other variable, and check in both equations.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $y = 3x - 2$ and $2x + y = 13$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "y = 3x - 2", say: "The first equation is already solved for $y$." },
          { step: 2, m: "2x + (3x - 2) = 13", say: "Put $3x - 2$ in place of $y$ in the second equation.", ask: { prompt: "Why put the whole $3x - 2$ in brackets?", answer: 0, options: [{ t: "It replaces $y$ **as a whole**" }, { t: "It makes the answer bigger", fb: "Brackets keep it as one piece: matter when there is a minus sign in front." }] } },
          { step: 2, m: "5x - 2 = 13 \\ \\Rightarrow \\ x = 3", say: "Add $2$, divide by $5$." },
          { step: 3, m: "y = 3(3) - 2 = 7", say: "Back-substitute." },
          { step: 3, m: "2(3) + 7 = 13", say: "Check in the **other** equation: it works." }] },
        gate: true, then: "The solution is $(3, 7)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $x - 2y = 4$ and $3x + y = 5$.",
        how: HOW_2, skill: "Substitution",
        steps: [
          { step: 1, ask: "Solve the first equation for $x$.", type: "choice", answer: 0, options: [{ t: "$x = 2y + 4$" }, { t: "$x = 2y - 4$", fb: "Add $2y$ to both sides: $x = 4 + 2y$." }], m: "x = 2y + 4", say: "Now $x$ is ready to be replaced." },
          { step: 2, ask: "$3(2y + 4) + y = 5$ gives $7y + 12 = 5$, so $y =$", type: "num", pre: "$y =$", answer: -1, near: [{ v: 1, fb: "$7y = 5 - 12 = -7$: the answer is negative." }, { v: -17, fb: "$7y = -7$, so divide by 7." }], hint: "$7y = -7$.", m: "y = -1", say: "One variable found." },
          { step: 3, ask: "Back-substitute: $x = 2(-1) + 4 =$", type: "num", pre: "$x =$", answer: 2, near: [{ v: 6, fb: "$2(-1) = -2$, then add 4." }], hint: "$-2 + 4$.", m: "(2, -1)", say: "Check: $3(2) + (-1) = 5$." }],
        why: "Isolate, substitute, back-substitute." },
      { type: "num", kicker: "On your own", prompt: "Solve $y = 2x + 1$ and $3x + y = 11$. What is $x$?", pre: "$x =$", answer: 2, skill: "Substitution", near: [{ v: 5, fb: "That is $y$. Substitute: $3x + 2x + 1 = 11$, so $5x = 10$." }, { v: 2.4, tol: 0.001, fb: "$5x + 1 = 11$ gives $5x = 10$: subtract 1, not add." }], hints: ["$3x + (2x + 1) = 11$."], why: "$5x = 10$, $x = 2$, $y = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Both equations need rearranging.** Solve $3x + 2y = 7$ and $x + 4y = -1$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "x = -1 - 4y", say: "The second equation is the easier one to solve: $x$ has coefficient 1." },
          { step: 2, m: "3(-1 - 4y) + 2y = 7", say: "Substitute into the first." },
          { step: 2, m: "-3 - 12y + 2y = 7", say: "Distribute the 3 to **both** terms.", ask: { prompt: "What is $-12y + 2y$?", answer: 0, options: [{ t: "$-10y$" }, { t: "$-14y$", fb: "$+2y$ **reduces** the $-12y$: $-10y$." }] } },
          { step: 2, m: "-10y = 10 \\ \\Rightarrow \\ y = -1", say: "Add 3, then divide by $-10$." },
          { step: 3, m: "x = -1 - 4(-1) = 3", say: "Back-substitute: $(3, -1)$. Check: $9 - 2 = 7$ and $3 - 4 = -1$." }] },
        gate: true, then: "The solution is $(3, -1)$. Choose the variable with coefficient 1 to isolate, and it stays free of fractions." },
      { type: "num", kicker: "Try it", prompt: "Solve $2x + y = 7$ and $x = y - 1$. What is $y$?", pre: "$y =$", answer: 3, skill: "Substitution", near: [{ v: 2, fb: "That is $x$. Substitute: $2(y - 1) + y = 7$, so $3y = 9$." }, { v: 5, fb: "$2(y - 1) = 2y - 2$: then $3y - 2 = 7$." }], hints: ["$2(y - 1) + y = 7$."], why: "$3y = 9$, $y = 3$, $x = 2$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kay solves $y = 2x + 1$ and $3x + y = 11$. Tap the line where the work **first** goes wrong.",
        lines: ["y = 2x + 1", "3x + (2x + 1) = 11", "5x = 11 + 1", "x = \\frac{12}{5}"], answer: 2, fix: "5x = 11 - 1 = 10",
        fb: { 0: GIVEN, 1: "Substituting $2x + 1$ for $y$ is right.", 3: LATER }, skill: "Substitution",
        hints: ["To undo $+1$, subtract it."], why: "$5x + 1 = 11$ gives $5x = 10$, so $x = 2$." },
      { type: "num", kicker: "Use it", prompt: "Two numbers add to $20$ and differ by $4$: $x + y = 20$ and $x - y = 4$. What is the **larger** number?", pre: "larger =", answer: 12, skill: "Substitution", near: [{ v: 8, fb: "That is the smaller. $x = y + 4$ and $y + 4 + y = 20$ give $y = 8$ and $x = 12$." }, { v: 16, fb: "$x = y + 4$: substitute: $2y + 4 = 20$, so $y = 8$." }], hints: ["$x = y + 4$."], why: "$y = 8$, $x = 12$." }
    ]
  });

  /* ============================================ 3 · Elimination */
  var HOW_3 = [["Match", "Multiply so one variable has **opposite** coefficients."],
               ["Add", "Add the equations: that variable disappears."],
               ["Solve", "Solve for the other variable, then back-substitute."]];
  LESSONS.push({
    title: "Elimination", art: "pcsys",
    blurb: "Book 9.1 · Add two equations to make a variable vanish. Every combination still passes through the solution.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Add the equations $x + y = 5$ and $x - y = 1$ (left sides together, right sides together). What do you get on the right?", pre: "$2x =$", answer: 6, skill: "Adding equations", near: [{ v: 4, fb: "That is $5 - 1$. **Add**: $5 + 1$." }], hints: ["$5 + 1$."], why: "$2x = 6$: the $y$'s cancelled." },
      { type: "learn", kicker: "Explore",
        prompt: "The system is $2x + 3y = 12$ and $4x - y = 10$. Choose multipliers $m_1$ and $m_2$: the orange line is $m_1(\\text{first}) + m_2(\\text{second})$. Find multipliers that make **$x$ vanish** and others that make **$y$ vanish**. Notice where the orange line goes.",
        scene: { type: "sketch", x: [-2, 8], y: [-3, 7], u: 28, w: 328, gate: true, pts: {},
          params: { a: { min: -4, max: 4, step: 1, v: 1, label: "$m_1$" }, b: { min: -4, max: 4, step: 1, v: 1, label: "$m_2$" } },
          track: function (s) { var A = 2 * s.p.a + 4 * s.p.b, B = 3 * s.p.a - s.p.b; return A === 0 && B !== 0 ? "xgone" : B === 0 && A !== 0 ? "ygone" : null; },
          draw: function (s) { var A = 2 * s.p.a + 4 * s.p.b, B = 3 * s.p.a - s.p.b, C = 12 * s.p.a + 10 * s.p.b, it = curve(function (x) { return (12 - 2 * x) / 3; }, -2, 8, "soft", [-3, 7]).concat(curve(LN(4, -10), -2, 8, "soft", [-3, 7])); if (B !== 0) it = it.concat(curve(function (x) { return (C - A * x) / B; }, -2, 8, "orange", [-3, 7])); else if (A !== 0) it.push({ seg: [[C / A, -3], [C / A, 7]], c: "orange" }); it.push(dot(3, 2, "green")); return it; },
          readout: function (s) { var A = 2 * s.p.a + 4 * s.p.b, B = 3 * s.p.a - s.p.b, C = 12 * s.p.a + 10 * s.p.b; return "$" + nm(s.p.a) + "(2x + 3y = 12) + " + (s.p.b < 0 ? "(" + nm(s.p.b) + ")" : nm(s.p.b)) + "(4x - y = 10)$ gives $" + nm(A) + "x " + (B < 0 ? "-" : "+") + " " + nm(Math.abs(B)) + "y = " + nm(C) + "$<br>$x$ vanishes: " + (s.tracked.xgone ? "✓" : "—") + " · $y$ vanishes: " + (s.tracked.ygone ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.xgone && s.tracked.ygone); } },
        gate: true, then: "With $m_1 = 2$, $m_2 = -1$ the $x$ terms cancel and $7y = 14$ remains: the orange line is horizontal at $y = 2$. With $m_1 = 1$, $m_2 = 3$ the $y$ terms cancel: $14x = 42$, a vertical line at $x = 3$. **Every** combination passes through the solution $(3, 2)$. Elimination picks the one that is easy to read." },
      { type: "learn", kicker: "The idea",
        prompt: "**Elimination (addition):** multiply one or both equations so that a variable has **opposite coefficients**, then **add** the equations: that variable disappears. Solve for the other, **back-substitute**, and check in both equations.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $3x + 2y = 16$ and $2x - 2y = 4$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "+2y \\ \\text{and} \\ -2y", say: "The $y$ terms are already opposites: no multiplying needed." },
          { step: 2, m: "(3x + 2y) + (2x - 2y) = 16 + 4", say: "Add the left sides and the right sides." },
          { step: 2, m: "5x = 20 \\ \\Rightarrow \\ x = 4", say: "The $y$'s cancel.", ask: { prompt: "What is $3x + 2x$?", answer: 0, options: [{ t: "$5x$" }, { t: "$6x$", fb: "$3x + 2x = 5x$: add the coefficients." }] } },
          { step: 3, m: "3(4) + 2y = 16 \\ \\Rightarrow \\ y = 2", say: "Back-substitute into either equation." },
          { step: 3, m: "2(4) - 2(2) = 4", say: "Check in the other: $(4, 2)$." }] },
        gate: true, then: "The solution is $(4, 2)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $2x + 3y = 12$ and $4x - y = 10$.",
        how: HOW_3, skill: "Elimination",
        steps: [
          { step: 1, ask: "To cancel $y$ we need $+3y$ and $-3y$. Multiply the **second** equation by…", type: "choice", answer: 0, options: [{ t: "$3$" }, { t: "$-3$", fb: "That would give $+3y$ next to the $+3y$: they would **add up**, not cancel." }], m: "12x - 3y = 30", say: "Every term is multiplied by 3." },
          { step: 2, ask: "Add: $(2x + 3y) + (12x - 3y) = 12 + 30$, so $14x = 42$ and $x =$", type: "num", pre: "$x =$", answer: 3, near: [{ v: 42, fb: "Divide by 14: $x = 3$." }], hint: "$42 \\div 14$.", m: "x = 3", say: "$y$ vanished." },
          { step: 3, ask: "Back-substitute into $4x - y = 10$: $12 - y = 10$, so $y =$", type: "num", pre: "$y =$", answer: 2, near: [{ v: -2, fb: "$12 - y = 10$ gives $y = 12 - 10 = 2$." }], hint: "$12 - 10$.", m: "(3, 2)", say: "The same point the explore showed." }],
        why: "Match, add, solve." },
      { type: "num", kicker: "On your own", prompt: "Solve $x + 2y = 7$ and $3x - 2y = 5$. What is $x$?", pre: "$x =$", answer: 3, skill: "Elimination", near: [{ v: 12, fb: "Adding gives $4x = 12$. Divide by 4." }, { v: 2, fb: "That is $y$. Add the equations: $4x = 12$." }], hints: ["Add: the $y$ terms cancel."], why: "$4x = 12$, $x = 3$, $y = 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Multiply both equations.** Solve $2x + 3y = 7$ and $3x + 5y = 12$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "3(2x + 3y) = 3(7)", say: "To cancel $x$, make the $x$ coefficients $6$ and $-6$: multiply the first by 3..." },
          { step: 1, m: "-2(3x + 5y) = -2(12)", say: "...and the second by $-2$.", ask: { prompt: "Why $-2$ and not $2$?", answer: 0, options: [{ t: "So the $x$ terms are opposites: $6x$ and $-6x$" }, { t: "To make the numbers smaller", fb: "We want $6x$ and $-6x$ so they **cancel** when added." }] } },
          { step: 2, m: "6x + 9y = 21", say: "The first, multiplied out." },
          { step: 2, m: "-6x - 10y = -24", say: "The second, multiplied out." },
          { step: 2, m: "-y = -3 \\ \\Rightarrow \\ y = 3", say: "Add: $9y - 10y = -y$ and $21 - 24 = -3$." },
          { step: 3, m: "2x + 9 = 7 \\ \\Rightarrow \\ x = -1", say: "Back-substitute: $(-1, 3)$. Check: $3(-1) + 15 = 12$." }] },
        gate: true, then: "The solution is $(-1, 3)$." },
      { type: "num", kicker: "Try it", prompt: "Solve $5x - y = 9$ and $3x + y = 7$. What is $y$?", pre: "$y =$", answer: 1, skill: "Elimination", near: [{ v: 2, fb: "That is $x$ ($8x = 16$). Back-substitute: $10 - y = 9$." }], hints: ["Add: $8x = 16$."], why: "$x = 2$, $y = 1$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Rio multiplies the second equation by 3 to eliminate $y$ in $2x + 3y = 12$, $4x - y = 10$. Tap the line where the work **first** goes wrong.",
        lines: ["2x + 3y = 12", "4x - y = 10", "12x - y = 30", "14x + 2y = 42"], answer: 2, fix: "12x - 3y = 30",
        fb: { 0: GIVEN, 1: GIVEN, 3: LATER }, skill: "Elimination",
        hints: ["Multiply **every** term by 3."], why: "$3(4x - y) = 12x - 3y$: the $y$ term must be multiplied too." },
      { type: "num", kicker: "Use it", prompt: "3 coffees and 2 muffins cost $\\$13$. 1 coffee and 2 muffins cost $\\$7$. How much is a coffee, in dollars?", pre: "coffee =", post: "dollars", answer: 3, skill: "Elimination", near: [{ v: 2, fb: "That is a muffin. Subtract the equations: $2c = 6$." }, { v: 6, fb: "Subtracting gives $2c = 6$: divide by 2." }], hints: ["Subtract: $(3c + 2m) - (c + 2m) = 13 - 7$."], why: "$2c = 6$, $c = 3$ (and a muffin is $\\$2$)." }
    ]
  });

  /* ============================================ 4 · No solution, or infinitely many */
  var HOW_4 = [["Eliminate", "Use elimination or substitution as usual."],
               ["Look", "Did **both** variables vanish?"],
               ["Decide", "$0 =$ a nonzero number: **no** solution. $0 = 0$: **infinitely many**."]];
  LESSONS.push({
    title: "No solution, or infinitely many", art: "pcsys",
    blurb: "Book 9.1 · When elimination makes both variables vanish, what is left tells the story.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Two lines have the same slope but different intercepts. How many points do they share?",
        options: [{ t: "None: they are parallel" }, { t: "Exactly one", fb: "Lines with different slopes cross once. Same slopes never meet (unless they are the same line)." }, { t: "Infinitely many", fb: "That would need the same intercept too: then they are the same line." }],
        answer: 0, skill: "Parallel lines", hints: ["Think of railway tracks."], why: "Parallel: none." },
      { type: "learn", kicker: "Explore",
        prompt: "The system is $x + y = 3$ and $2x + 2y = k$. Slide $k$ and watch the second line. Find the value of $k$ where the lines are the **same line** (infinitely many solutions), and notice what happens for **every other** $k$.",
        scene: { type: "sketch", x: [-3, 6], y: [-3, 8], u: 26, w: 282, gate: true, pts: {},
          params: { k: { min: 0, max: 10, step: 1, v: 2, label: "$k$" } },
          track: function (s) { return s.p.k === 6 ? "inf" : "none"; },
          draw: function (s) { return curve(LN(-1, 3), -3, 6, "blue", [-3, 8]).concat(curve(LN(-1, s.p.k / 2), -3, 6, "orange", [-3, 8], s.p.k === 6)); },
          readout: function (s) { return "$x + y = 3$ and $2x + 2y = " + s.p.k + "$ (that is $x + y = " + nm(s.p.k / 2) + "$): " + (s.p.k === 6 ? "the **same line**: infinitely many solutions" : "**parallel**: no solution") + "<br>Same line: " + (s.tracked.inf ? "✓" : "—") + " · parallel: " + (s.tracked.none ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.inf && s.tracked.none); } },
        gate: true, then: "Dividing the second equation by 2 gives $x + y = \\frac{k}{2}$. It is the **same line** as $x + y = 3$ only when $\\frac{k}{2} = 3$, that is $k = 6$. For any other $k$ the lines are **parallel**: $x + y$ cannot equal both 3 and $\\frac{k}{2}$, so there is **no solution**." },
      { type: "learn", kicker: "The idea",
        prompt: "Solve as usual. If **both** variables vanish and you get a false statement like $0 = 7$, the system is **inconsistent**: **no solution** (parallel lines). If you get a true statement like $0 = 0$, it is **dependent**: **infinitely many** solutions (the same line).",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $x - 2y = 3$ and $-2x + 4y = 1$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "2(x - 2y) = 2(3)", say: "Multiply the first equation by 2 to match the $x$ terms." },
          { step: 1, m: "2x - 4y = 6", say: "The first, multiplied out.", ask: { prompt: "Now we ADD it to $-2x + 4y = 1$. What happens to $2x$ and $-2x$?", answer: 0, options: [{ t: "They cancel" }, { t: "They make $4x$", fb: "$2x + (-2x) = 0$." }] } },
          { step: 2, m: "(2x - 4y) + (-2x + 4y) = 6 + 1", say: "Add." },
          { step: 2, m: "0 = 7", say: "**Both** variables vanished, and what is left is false." },
          { step: 3, m: "\\text{no solution}", say: "The lines are parallel: slope $\\frac{1}{2}$ for both, different intercepts." }] },
        gate: true, then: "**No solution**: the system is inconsistent." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $x + y = 4$ and $2x + 2y = 8$.",
        how: HOW_4, skill: "Special systems",
        steps: [
          { step: 1, ask: "To cancel $x$, multiply the first equation by…", type: "choice", answer: 0, options: [{ t: "$-2$" }, { t: "$2$", fb: "That gives $2x$ next to $2x$: they add up. We need $-2x$." }], m: "-2x - 2y = -8", say: "Every term times $-2$." },
          { step: 2, ask: "Add: $(-2x - 2y) + (2x + 2y) = -8 + 8$. The result is $0 =$", type: "num", pre: "$0 =$", answer: 0, near: [{ v: 16, fb: "$-8 + 8 = 0$." }], hint: "$-8 + 8$.", m: "0 = 0", say: "Both variables vanished, and it is **true**." },
          { step: 3, ask: "A true statement means the system has…", type: "choice", answer: 0, options: [{ t: "infinitely many solutions (the same line)" }, { t: "no solution", fb: "No solution would be a **false** statement like $0 = 8$." }], m: "\\text{infinitely many}", say: "Every point of $x + y = 4$ is a solution." }],
        why: "Eliminate, look, decide." },
      { type: "choice", kicker: "On your own", prompt: "What happens with $2x - y = 3$ and $4x - 2y = 7$?",
        options: [{ t: "No solution: elimination gives $0 = 1$" }, { t: "Infinitely many solutions", fb: "Doubling the first equation gives $4x - 2y = 6$, not 7: the right sides disagree." }, { t: "Exactly one solution", fb: "The left sides are multiples of each other: the lines are parallel, so there is never exactly one." }],
        answer: 0, skill: "Special systems", hints: ["Multiply the first by $-2$ and add."], why: "$-4x + 2y = -6$; adding gives $0 = 1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Infinitely many.** Write some solutions of $3x - y = 2$ and $6x - 2y = 4$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "-2(3x - y) = -2(2)", say: "Multiply the first equation by $-2$." },
          { step: 2, m: "(-6x + 2y) + (6x - 2y) = -4 + 4", say: "Add the second equation." },
          { step: 2, m: "0 = 0", say: "True: **dependent**.", ask: { prompt: "$0 = 0$ means…", answer: 0, options: [{ t: "the equations describe the same line" }, { t: "the only solution is $(0, 0)$", fb: "$0 = 0$ is always true, whatever $x$ and $y$ are." }] } },
          { step: 3, m: "y = 3x - 2", say: "Every solution lies on this line." },
          { step: 3, m: "(0, -2), \\ (1, 1), \\ (2, 4)", say: "Pick any $x$ and find $y$: all three work in both equations." }] },
        gate: true, then: "Infinitely many solutions: every point $(x, 3x - 2)$ on the line." },
      { type: "num", kicker: "Try it", prompt: "For which value of $k$ does $x + 2y = 4$, $3x + 6y = k$ have **infinitely many** solutions?", pre: "$k =$", answer: 12, skill: "Special systems", near: [{ v: 4, fb: "The second equation must be **3 times** the first: $3 \\cdot 4$." }, { v: 8, fb: "Multiply the first equation by 3: the right side becomes $3 \\times 4$." }], hints: ["$3(x + 2y) = 3(4)$."], why: "$k = 12$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben solves a system and reaches $0 = 0$. He says \"so $x = 0$ and $y = 0$\". What is wrong?",
        options: [{ t: "$0 = 0$ is always true: there are **infinitely many** solutions, not just $(0, 0)$" }, { t: "Nothing: the solution is $(0, 0)$", fb: "Check $(0, 0)$ in the original equations: it usually fails." }, { t: "It means no solution", fb: "No solution is a **false** statement like $0 = 5$." }],
        answer: 0, skill: "Special systems", hints: ["Is $0 = 0$ true for every $x$ and $y$?"], why: "Both equations describe the same line." },
      { type: "choice", kicker: "Use it", prompt: "Gym A charges $y = 5x + 20$ and gym B charges $y = 5x + 30$ after $x$ months. Will they ever cost the same?",
        options: [{ t: "Never: the same slope, different intercepts" }, { t: "After 2 months", fb: "$5x + 20 = 5x + 30$ gives $20 = 30$: impossible." }, { t: "Always", fb: "They differ by $\\$10$ every month." }],
        answer: 0, skill: "Special systems", hints: ["Set them equal and see what is left."], why: "$20 = 30$ is false: no solution; B is always $\\$10$ dearer." }
    ]
  });

  /* ============================================ 5 · Writing systems from stories */
  var HOW_5 = [["Name", "Let $x$ and $y$ stand for the two unknowns."],
               ["Write", "One equation for each fact in the story."],
               ["Solve", "Use substitution or elimination, then answer in words."]];
  LESSONS.push({
    title: "Writing systems from stories", art: "pcsys",
    blurb: "Book 9.1 · Tickets, mixtures, break-even and investments: two facts, two unknowns.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Adult tickets cost $\\$8$ and student tickets $\\$5$. How much do $4$ adult and $6$ student tickets cost?", pre: "total =", post: "dollars", answer: 62, skill: "Word problems", near: [{ v: 52, fb: "$4 \\times 8 = 32$ and $6 \\times 5 = 30$: add them." }], hints: ["$4(8) + 6(5)$."], why: "$32 + 30 = 62$." },
      { type: "learn", kicker: "Explore",
        prompt: "A hall sells **100** tickets: $x$ adults at $\\$8$ and the rest students at $\\$5$. Slide $x$ and watch the **income**. Find the number of adults that gives **exactly $\\$620$**, and the number that gives the **most**.",
        scene: { type: "sketch", x: [-10, 110], y: [450, 850], u: 3.2, uy: 0.72, gx: 20, step: 20, gy: 100, stepY: 100, w: 432, gate: true, pts: {},
          params: { x: { min: 0, max: 100, step: 10, v: 50, label: "adults $x$" } },
          track: function (s) { return s.p.x === 40 ? "t620" : s.p.x === 100 ? "max" : null; },
          draw: function (s) { var x = s.p.x, r = 500 + 3 * x; return [{ seg: [[0, 500], [100, 800]], c: "blue" }, { seg: [[-10, 620], [110, 620]], c: "orange", dash: true }, { seg: [[x, 450], [x, r]], c: "soft", dash: true }, dot(x, r, "green")]; },
          readout: function (s) { var x = s.p.x, r = 500 + 3 * x; return "$" + x + "$ adults, $" + (100 - x) + "$ students: income $\\$" + r + "$<br>$\\$620$: " + (s.tracked.t620 ? "✓" : "—") + " · the most: " + (s.tracked.max ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.t620 && s.tracked.max); } },
        gate: true, then: "Income $= 8x + 5(100 - x) = 500 + 3x$: each adult ticket instead of a student ticket adds $\\$3$. $\\$620$ needs $3x = 120$, so **40 adults** (and 60 students); the most is **100 adults**, $\\$800$. Two facts (100 tickets, $\\$620$) and two unknowns: a **system**." },
      { type: "learn", kicker: "The idea",
        prompt: "**Name** the two unknowns, **write** one equation for each fact in the story (a count, a total of money, a rate), then **solve** by substitution or elimination. **Answer in words**, with units, and check the answer against the story.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "$100$ tickets are sold: adults $\\$8$, students $\\$5$, $\\$620$ in all. How many of each?",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "x = \\text{adults}, \\ y = \\text{students}", say: "Two unknowns, two letters." },
          { step: 2, m: "x + y = 100", say: "Fact 1: the **number** of tickets." },
          { step: 2, m: "8x + 5y = 620", say: "Fact 2: the **money**.", ask: { prompt: "Why $8x$ and not $x + 8$?", answer: 0, options: [{ t: "$x$ adults each pay $\\$8$: that is $8$ **times** $x$" }, { t: "It does not matter", fb: "$x + 8$ would add 8 to a count of people: not money." }] } },
          { step: 3, m: "8x + 5(100 - x) = 620", say: "Substitute $y = 100 - x$." },
          { step: 3, m: "3x + 500 = 620 \\ \\Rightarrow \\ x = 40", say: "So $y = 60$." },
          { step: 3, m: "8(40) + 5(60) = 320 + 300 = 620", say: "Check against the story." }] },
        gate: true, then: "**40 adult** tickets and **60 student** tickets." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the **break-even** point. A factory has a cost $C = 2000 + 5x$ and an income $R = 25x$ for $x$ items. When do they cost the same as they earn?",
        how: HOW_5, skill: "Systems from stories",
        steps: [
          { step: 1, ask: "At break-even the cost equals…", type: "choice", answer: 0, options: [{ t: "the income: $2000 + 5x = 25x$" }, { t: "zero: $2000 + 5x = 0$", fb: "Break-even is where income **equals** cost, not where cost is zero." }], m: "2000 + 5x = 25x", say: "The two facts as one equation." },
          { step: 2, ask: "$2000 = 20x$, so $x =$", type: "num", pre: "$x =$", answer: 100, near: [{ v: 80, fb: "$25x - 5x = 20x$, and $2000 \\div 20 = 100$." }], hint: "$2000 \\div 20$.", m: "x = 100", say: "100 items." },
          { step: 3, ask: "The income at that point is $25(100) =$", type: "num", pre: "$R =$", post: "dollars", answer: 2500, near: [{ v: 2000, fb: "That is the fixed cost. The income is $25 \\times 100$." }], hint: "$25 \\times 100$.", m: "(100, 2500)", say: "Cost: $2000 + 500 = 2500$ too." }],
        why: "Name, write, solve." },
      { type: "num", kicker: "On your own", prompt: "A chemist mixes a $10\\%$ salt solution with a $30\\%$ salt solution to get $20$ litres of $22\\%$ solution. How many litres of the **30%** solution does she use?", pre: "litres =", post: "L", answer: 12, skill: "Systems from stories", near: [{ v: 8, fb: "That is the litres of the **10%** solution. $x + y = 20$ and $0.1x + 0.3y = 4.4$ give $y = 12$." }], hints: ["Salt: $0.10x + 0.30y = 0.22 \\times 20$."], why: "$0.1(20 - y) + 0.3y = 4.4$, so $0.2y = 2.4$, $y = 12$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Investments.** $\\$10{,}000$ is split between two accounts paying $4\\%$ and $6\\%$ a year. After a year the interest is $\\$520$. How much is at $6\\%$?",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "x = \\text{at } 4\\%, \\ y = \\text{at } 6\\%", say: "Name the two amounts." },
          { step: 2, m: "x + y = 10000", say: "Fact 1: the **total**." },
          { step: 2, m: "0.04x + 0.06y = 520", say: "Fact 2: the **interest**.", ask: { prompt: "$6\\%$ of $y$ is…", answer: 0, options: [{ t: "$0.06y$" }, { t: "$6y$", fb: "A percentage of $y$ is $y \\times \\frac{6}{100} = 0.06y$." }] } },
          { step: 3, m: "0.04(10000 - y) + 0.06y = 520", say: "Substitute $x = 10000 - y$." },
          { step: 3, m: "400 + 0.02y = 520 \\ \\Rightarrow \\ y = 6000", say: "$0.02y = 120$." },
          { step: 3, m: "x = 4000", say: "Check: $0.04(4000) + 0.06(6000) = 160 + 360 = 520$." }] },
        gate: true, then: "$\\$6000$ at $6\\%$ (and $\\$4000$ at $4\\%$)." },
      { type: "num", kicker: "Try it", prompt: "Two numbers add to $25$ and differ by $7$. What is the **larger** number?", pre: "larger =", answer: 16, skill: "Systems from stories", near: [{ v: 9, fb: "That is the smaller. $x + y = 25$ and $x - y = 7$ give $2x = 32$." }, { v: 18, fb: "$2x = 25 + 7 = 32$, so $x = 16$." }], hints: ["Add the equations: $2x = 32$."], why: "$x = 16$ and $y = 9$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For \"100 tickets, adult $\\$8$, student $\\$5$, income $\\$620$\", Mia writes $8x + 5y = 100$ and $x + y = 620$. What is wrong?",
        options: [{ t: "She swapped the totals: the **count** is 100 ($x + y = 100$) and the **money** is 620 ($8x + 5y = 620$)" }, { t: "Nothing: the order does not matter", fb: "$x + y = 620$ would say 620 people were counted." }, { t: "The prices should be added", fb: "Prices multiply the **number** of tickets." }],
        answer: 0, skill: "Systems from stories", hints: ["Which equation counts people, which counts dollars?"], why: "$x + y = 100$ and $8x + 5y = 620$." },
      { type: "num", kicker: "Use it", prompt: "A boat travels $30$ km downstream in $2$ h and returns in $3$ h. Its speed in still water is $b$ and the current $c$: $2(b + c) = 30$ and $3(b - c) = 30$. What is $b$ in km/h? (A decimal is fine.)", pre: "$b =$", post: "km/h", answer: 12.5, tol: 0.006, skill: "Systems from stories", near: [{ v: 2.5, tol: 0.006, fb: "That is the current $c$. $b + c = 15$ and $b - c = 10$ give $2b = 25$." }, { v: 15, fb: "That is $b + c$, the downstream speed. Add $b + c = 15$ and $b - c = 10$: $2b = 25$." }], hints: ["$b + c = 15$ and $b - c = 10$."], why: "$2b = 25$, $b = 12.5$ km/h and $c = 2.5$ km/h." }
    ]
  });
  /* ============================================ 6 · Three equations, three unknowns */
  var HOW_6 = [["Remove", "Eliminate the same variable from **two pairs** of equations."],
               ["Solve", "Solve the two-variable system that is left."],
               ["Go back", "Put the answers into an equation to find the third."]];
  LESSONS.push({
    title: "Three equations, three unknowns", art: "pcsys",
    blurb: "Book 9.2 · Remove one variable twice, solve the pair that remains, then climb back up.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find $2x - y + z$ when $x = 1$, $y = 2$ and $z = 3$.", pre: "value =", answer: 3, skill: "Three unknowns", near: [{ v: 7, fb: "Subtract $y$, do not add it: $2 - 2 + 3$." }], hints: ["$2(1) - 2 + 3$."], why: "$2 - 2 + 3 = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Three equations: (1) $x + y + z = 6$, (2) $2x - y + z = 3$ and (3) $x + 2y - z = 2$. Slide $x$, $y$ and $z$. Each bar shows how far an equation is from being true (its **gap**). Make **all three gaps zero** together.",
        scene: { type: "sketch", x: [-9, 13], y: [0, 4], u: 14, uy: 34, grid: false, w: 356, gate: true, pts: {},
          params: { x: { min: 0, max: 5, step: 1, v: 0, label: "$x$" }, y: { min: 0, max: 5, step: 1, v: 0, label: "$y$" }, z: { min: 0, max: 5, step: 1, v: 0, label: "$z$" } },
          draw: function (s) {
            var x = s.p.x, y = s.p.y, z = s.p.z, g = [x + y + z - 6, 2 * x - y + z - 3, x + 2 * y - z - 2], col = ["blue", "orange", "green"], it = [{ seg: [[0, 0.4], [0, 3.6]], c: "soft" }];
            g.forEach(function (v, i) { var yy = 3 - i; it.push({ seg: [[0, yy], [v, yy]], c: col[i] }, dot(v, yy, col[i]), { word: "eq " + (i + 1), at: [-8.6, yy + 0.35], c: col[i], anchor: "start" }); });
            return it;
          },
          readout: function (s) {
            var x = s.p.x, y = s.p.y, z = s.p.z, g = [x + y + z - 6, 2 * x - y + z - 3, x + 2 * y - z - 2], v = [x + y + z, 2 * x - y + z, x + 2 * y - z], t = [6, 3, 2];
            return [0, 1, 2].map(function (i) { return "(" + (i + 1) + ") $" + nm(v[i]) + "$ against $" + t[i] + "$: " + (g[i] === 0 ? "✓" : "gap $" + nm(g[i]) + "$"); }).join("<br>");
          },
          goal: function (s) { var x = s.p.x, y = s.p.y, z = s.p.z; return x + y + z === 6 && 2 * x - y + z === 3 && x + 2 * y - z === 2; } },
        gate: true, then: "$(x, y, z) = (1, 2, 3)$ is the only triple that closes all three gaps. Two equations still leave a whole **line** of triples; the third one picks a single point from it. That is why we need **three** equations for three unknowns." },
      { type: "learn", kicker: "The idea",
        prompt: "To solve three equations: **remove** the same variable from **two pairs** of equations, which leaves a two-variable system. **Solve** it as before, then **go back** and put the answers into any original equation to find the third unknown. Check the triple in all three.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $x + y + z = 6$, $2x - y + z = 3$ and $x + 2y - z = 2$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "(1)+(3):\\ 2x + 3y = 8", say: "Add the first and third equations: $z$ and $-z$ cancel." },
          { step: 1, m: "(1)-(2):\\ -x + 2y = 3", say: "Subtract the second from the first: $z$ cancels again.", ask: { prompt: "Why remove the **same** variable twice?", answer: 0, options: [{ t: "It leaves two equations in the same two unknowns" }, { t: "It makes the numbers bigger", fb: "We need **two** equations in the **same** two unknowns, so we can solve them together." }] } },
          { step: 2, m: "x = 2y - 3", say: "From the second: $-x + 2y = 3$." },
          { step: 2, m: "2(2y - 3) + 3y = 8", say: "Substitute into $2x + 3y = 8$." },
          { step: 2, m: "7y = 14 \\ \\Rightarrow \\ y = 2", say: "Then $x = 2(2) - 3 = 1$." },
          { step: 3, m: "z = 6 - 1 - 2 = 3", say: "Put $x = 1$, $y = 2$ into the first equation." },
          { step: 3, m: "2 - 2 + 3 = 3,\\ \\ 1 + 4 - 3 = 2", say: "Check the other two: both true." }] },
        gate: true, then: "The solution is $(1, 2, 3)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve (1) $x + y + z = 9$, (2) $x - y + 2z = 7$ and (3) $2x + y - z = 3$.",
        how: HOW_6, skill: "Three unknowns",
        steps: [
          { step: 1, ask: "$y$ has coefficients $+1, -1, +1$. Which two **adds** remove $y$?", type: "choice", answer: 0, options: [{ t: "(1)+(2) and (2)+(3)" }, { t: "(1)+(3) and (2)+(3)", fb: "(1)+(3) gives $+2y$: the $y$ terms are both **positive**, so they add up instead of cancelling." }], m: "(1)+(2):\\ 2x + 3z = 16", say: "The first pair." },
          { step: 1, ask: "(2)+(3) is $3x + z = 10$. So $z = 10 - 3x$. Putting it into $2x + 3z = 16$ gives $-7x = -14$. Then $x =$", type: "num", pre: "$x =$", answer: 2, near: [{ v: -2, fb: "$-7x = -14$: divide both sides by $-7$." }], hint: "$-14 \\div -7$.", m: "x = 2", say: "Solved the two-variable system." },
          { step: 2, ask: "$z = 10 - 3x = 10 - 6 =$", type: "num", pre: "$z =$", answer: 4, near: [{ v: 16, fb: "$3x = 6$: then $10 - 6$." }], hint: "$10 - 6$.", m: "z = 4", say: "Check in $2x + 3z = 16$: $4 + 12$." },
          { step: 3, ask: "Back in (1): $2 + y + 4 = 9$, so $y =$", type: "num", pre: "$y =$", answer: 3, near: [{ v: 15, fb: "$2 + 4 = 6$; then $9 - 6$." }], hint: "$9 - 6$.", m: "(2, 3, 4)", say: "Check (3): $4 + 3 - 4 = 3$." }],
        why: "Remove, solve, go back." },
      { type: "num", kicker: "On your own", prompt: "Solve $x + y + z = 6$, $x + y - z = 0$ and $x - y + z = 2$. What is $z$?", pre: "$z =$", answer: 3, skill: "Three unknowns", near: [{ v: 1, fb: "That is $x$. Subtract (2) from (1): $2z = 6$." }, { v: 2, fb: "That is $y$. Subtract (2) from (1): $2z = 6$." }], hints: ["Subtract (2) from (1): $2z = 6$."], why: "$2z = 6$, so $z = 3$ (then $y = 2$, $x = 1$)." },
      { type: "learn", kicker: "A harder case",
        prompt: "**One pair gives a single unknown at once.** Solve $x + 2y + 3z = 14$, $2x - y + z = 3$ and $3x + y - z = 2$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "(2)+(3):\\ 5x = 5", say: "Add the last two: $-y$ and $+y$ cancel, and $+z$ and $-z$ cancel too." },
          { step: 2, m: "x = 1", say: "One unknown at once.", ask: { prompt: "Why did two variables cancel at once?", answer: 0, options: [{ t: "In the last two equations $y$ and $z$ have opposite signs" }, { t: "It is a coincidence we cannot explain", fb: "Look at the coefficients: $-y, +y$ and $+z, -z$. They are opposites." }] } },
          { step: 2, m: "z = y + 1", say: "Put $x = 1$ in (2): $2 - y + z = 3$." },
          { step: 2, m: "1 + 2y + 3(y + 1) = 14", say: "Put both into (1)." },
          { step: 3, m: "5y + 4 = 14 \\ \\Rightarrow \\ y = 2", say: "Then $z = 3$." },
          { step: 3, m: "(1, 2, 3)", say: "Check (1): $1 + 4 + 9 = 14$." }] },
        gate: true, then: "The solution is $(1, 2, 3)$. Always scan the coefficients first: opposite signs make a shortcut." },
      { type: "num", kicker: "Try it", prompt: "Solve $x + y = 5$, $y + z = 7$ and $x + z = 6$. What is $x$?", pre: "$x =$", answer: 2, skill: "Three unknowns", near: [{ v: 3, fb: "That is $y$. Add all three: $2(x + y + z) = 18$, so $x + y + z = 9$." }, { v: 4, fb: "That is $z$. Add all three: $2(x + y + z) = 18$, so $x + y + z = 9$." }], hints: ["Add all three equations."], why: "$x + y + z = 9$, so $x = 9 - 7 = 2$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Nia adds (1) $x + y + z = 6$ and (3) $x + 2y - z = 2$. Tap the line where the work **first** goes wrong.",
        lines: ["x + y + z = 6", "x + 2y - z = 2", "2x + 3y = 4"], answer: 2, fix: "2x + 3y = 8",
        fb: { 0: GIVEN, 1: GIVEN }, skill: "Three unknowns",
        hints: ["Add the right sides too: $6 + 2$."], why: "$z$ cancels and $6 + 2 = 8$." },
      { type: "num", kicker: "Use it", prompt: "An apple, a bun and a cookie cost $\\$6$ together. Two apples and a bun cost $\\$4$. A bun and three cookies cost $\\$11$. How much is a cookie, in dollars?", pre: "cookie =", post: "dollars", answer: 3, skill: "Three unknowns", near: [{ v: 2, fb: "That is the bun. Write $b = 4 - 2a$ and $c = 2 + a$, then use the bun and three cookies." }, { v: 1, fb: "That is the apple. Solve for the cookie: $c = a + 2$." }], hints: ["$a + b + c = 6$, $2a + b = 4$, $b + 3c = 11$."], why: "$a = 1$, $b = 2$, $c = 3$." }
    ]
  });

  /* ============================================ 7 · Three unknowns: special cases */
  var HOW_7 = [["Reduce", "Eliminate until two unknowns remain."],
               ["Read", "A value, $0 = 0$, or $0 =$ a nonzero number?"],
               ["Describe", "One triple, a family with $t$, or none."]];
  LESSONS.push({
    title: "Three unknowns: special cases", art: "pcsys",
    blurb: "Book 9.2 · A row that collapses to $0 = 0$ means a whole family of solutions; $0 = 5$ means none.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Elimination in a two-variable system left $0 = 5$. How many solutions does it have?",
        options: [{ t: "None: $0 = 5$ can never be true" }, { t: "Infinitely many", fb: "That is the $0 = 0$ case, which is **always** true." }, { t: "Exactly one", fb: "A single solution leaves a value like $x = 3$, not $0 = 5$." }],
        answer: 0, skill: "Special three-unknown systems", hints: ["Is $0 = 5$ ever true?"], why: "False: no solution." },
      { type: "learn", kicker: "Explore",
        prompt: "Take (1) $x + y + z = 6$, (2) $x - y + z = 2$ and (3) $2x + 2z = c$. The first two force $y = 2$ and $x + z = 4$. Slide $c$ and watch the line (3) asks for. Find the $c$ with **infinitely many** solutions.",
        scene: { type: "sketch", x: [-2, 8], y: [-2, 8], u: 28, w: 328, gate: true, pts: {},
          params: { c: { min: 0, max: 12, step: 1, v: 2, label: "$c$" } },
          track: function (s) { return s.p.c === 8 ? "inf" : "none"; },
          draw: function (s) { return curve(LN(-1, 4), -2, 8, "blue", [-2, 8]).concat(curve(LN(-1, s.p.c / 2), -2, 8, "orange", [-2, 8], s.p.c === 8), [{ word: "z", at: [-1.7, 7.4], c: "soft" }, { word: "x", at: [7.3, -1.6], c: "soft" }]); },
          readout: function (s) { var c = s.p.c; return "(1) and (2): $x + z = 4$ (blue) · (3): $x + z = " + nm(c / 2) + "$ (orange)<br>" + (c === 8 ? "the **same line**: infinitely many solutions, $y = 2$" : "**parallel** lines: no solution") + "<br>Infinitely many: " + (s.tracked.inf ? "✓" : "—") + " · none: " + (s.tracked.none ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.inf && s.tracked.none); } },
        gate: true, then: "Once $y = 2$ is known, the three equations become two in $x$ and $z$: $x + z = 4$ and $x + z = \\frac{c}{2}$. The same line ($c = 8$) means **infinitely many** solutions; parallel lines mean **none**. Three-unknown systems break in the same two ways as two-unknown ones." },
      { type: "learn", kicker: "The idea",
        prompt: "**Reduce** the system as usual. If a row collapses to $0 = 0$, the equations are **dependent**: **infinitely many** solutions, written with a **parameter** $t$. If it collapses to $0 =$ a nonzero number, the system is **inconsistent**: **no** solution.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $x + y + z = 6$, $x - y + z = 2$ and $2x + 2z = 8$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "(1)+(2):\\ 2x + 2z = 8", say: "Add the first two: $y$ cancels." },
          { step: 1, m: "(3):\\ 2x + 2z = 8", say: "The third equation is exactly this one." },
          { step: 2, m: "0 = 0", say: "Subtract: nothing is left, and it is true.", ask: { prompt: "$0 = 0$ means…", answer: 0, options: [{ t: "(3) tells us nothing new: infinitely many solutions" }, { t: "the only solution is $(0, 0, 0)$", fb: "$0 = 0$ is true whatever $x$, $y$ and $z$ are." }] } },
          { step: 3, m: "y = 2", say: "Subtract (2) from (1): $2y = 4$." },
          { step: 3, m: "x = t,\\ z = 4 - t", say: "Let $x$ be any number $t$; then $x + z = 4$ gives $z = 4 - t$." },
          { step: 3, m: "(t, 2, 4 - t)", say: "One solution for each $t$. For $t = 1$: $(1, 2, 3)$." }] },
        gate: true, then: "Infinitely many solutions: $(t, 2, 4 - t)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve (1) $x + y + z = 4$, (2) $x - y + z = 0$ and (3) $3x + 3z = 6$.",
        how: HOW_7, skill: "Special three-unknown systems",
        steps: [
          { step: 1, ask: "Add (1) and (2). What do you get?", type: "choice", answer: 0, options: [{ t: "$2x + 2z = 4$" }, { t: "$2y = 4$", fb: "$y$ and $-y$ cancel when you **add**. $2y = 4$ would come from subtracting." }], m: "2x + 2z = 4", say: "$y$ cancelled." },
          { step: 2, ask: "Halve it: $x + z = 2$. Divide (3) by 3: $x + z = 2$. They are the same, so subtracting leaves $0 =$", type: "num", pre: "$0 =$", answer: 0, near: [{ v: 2, fb: "$x + z = 2$ on both: subtract and $2 - 2 = 0$." }], hint: "$2 - 2$.", m: "0 = 0", say: "Dependent." },
          { step: 3, ask: "Subtract (2) from (1): $2y = 4$. So $y =$", type: "num", pre: "$y =$", answer: 2, near: [{ v: 4, fb: "Divide by 2." }], hint: "$4 \\div 2$.", m: "y = 2", say: "Fixed for every solution." },
          { step: 3, ask: "If $x = t$, then $z =$", type: "choice", answer: 0, options: [{ t: "$2 - t$" }, { t: "$t - 2$", fb: "$x + z = 2$ gives $z = 2 - x$." }], m: "(t, 2, 2 - t)", say: "Infinitely many solutions." }],
        why: "Reduce, read, describe." },
      { type: "choice", kicker: "On your own", prompt: "A three-equation system reduces to $0 = 9$. What does that mean?",
        options: [{ t: "There is no solution" }, { t: "There are infinitely many solutions", fb: "That is $0 = 0$: always true. $0 = 9$ is never true." }, { t: "The solution is $(0, 0, 9)$", fb: "$0 = 9$ has no $x$, $y$ or $z$ left: it is a statement, not a point." }],
        answer: 0, skill: "Special three-unknown systems", hints: ["Is $0 = 9$ ever true?"], why: "False for every $x$, $y$, $z$: no solution." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Adding all three at once.** Three friends' ages: $x + y = 10$, $y + z = 12$ and $x + z = 14$. Find all three.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "2x + 2y + 2z = 36", say: "Add all three: each age appears twice." },
          { step: 2, m: "x + y + z = 18", say: "Halve it.", ask: { prompt: "Why is the total of the three ages 18, not 36?", answer: 0, options: [{ t: "Adding the equations counted every age twice" }, { t: "Two friends are not counted", fb: "Each of $x$, $y$, $z$ appeared in **two** equations, so the sum doubled." }] } },
          { step: 3, m: "z = 18 - 10 = 8", say: "Subtract the first equation, $x + y = 10$." },
          { step: 3, m: "x = 18 - 12 = 6", say: "Subtract the second." },
          { step: 3, m: "y = 18 - 14 = 4", say: "Subtract the third. Check: $6 + 4 = 10$." }] },
        gate: true, then: "The friends are $6$, $4$ and $8$ years old." },
      { type: "num", kicker: "Try it", prompt: "(1) $x + y + z = 5$, (2) $x - y + z = 1$ and (3) $2x + 2z = k$. For which $k$ does the system have infinitely many solutions?", pre: "$k =$", answer: 6, skill: "Special three-unknown systems", near: [{ v: 3, fb: "(1)+(2) gives $2x + 2z = 6$. (3) must be that same equation." }, { v: 4, fb: "That is $y$ times 2. (1)+(2) is $2x + 2z = 6$." }], hints: ["Add (1) and (2)."], why: "(1)+(2) is $2x + 2z = 6$, so $k = 6$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana reduces a system and reaches $0 = 5$. She says \"so there are infinitely many solutions\". What is wrong?",
        options: [{ t: "$0 = 5$ is false: there is **no** solution" }, { t: "Nothing: any collapse means infinitely many", fb: "Only a **true** collapse, $0 = 0$, gives infinitely many." }, { t: "She should add 5 to both sides", fb: "That does not change the meaning. $0 = 5$ is simply false." }],
        answer: 0, skill: "Special three-unknown systems", hints: ["Is $0 = 5$ ever true?"], why: "False statement: inconsistent." },
      { type: "num", kicker: "Use it", prompt: "Three groups share 28 pencils: group A has 4 more than group B, and group C has twice as many as group B has. How many pencils does group C get?", pre: "C =", answer: 12, skill: "Special three-unknown systems", near: [{ v: 6, fb: "That is group B. $a = b + 4$, $c = 2b$, and $4b + 4 = 28$." }, { v: 10, fb: "That is group A. Group C has twice as many as B." }], hints: ["$(b + 4) + b + 2b = 28$."], why: "$4b = 24$, $b = 6$, so $a = 10$ and $c = 12$." }
    ]
  });
  /* ============================================ 8 · A line meets a curve */
  var SQ = function (x) { return x * x; };
  var HOW_8 = [["Substitute", "Replace $y$ in the curve by the line's expression."],
               ["Solve", "Solve the quadratic you get for $x$."],
               ["Find y", "Use the line for each $y$, then check both equations."]];
  var G8 = function (k) {
    var it = curve(SQ, -3, 3, "blue", [-3, 8]).concat(curve(LN(1, 2), -4, 5, "orange", [-3, 8]));
    if (k >= 2) it.push(dot(2, 4, "green", "(2, 4)", "se"), dot(-1, 1, "green", "(-1, 1)", "nw"));
    return grid("The parabola y = x squared and the line y = x + 2" + (k >= 2 ? " meeting at (2, 4) and (-1, 1)" : "") + ".", it, { x: [-4, 5], y: [-3, 8], u: 21 });
  };
  var G8t = function (k) {
    var it = curve(SQ, -2, 3, "blue", [-2, 6]).concat(curve(LN(2, -1), -1, 3.5, "orange", [-2, 6]));
    if (k >= 2) it.push(dot(1, 1, "green", "(1, 1)", "se"));
    return grid("The parabola y = x squared and the line y = 2x - 1" + (k >= 2 ? " touching at (1, 1)" : "") + ".", it, { x: [-2, 4], y: [-2, 6], u: 28 });
  };
  LESSONS.push({
    title: "A line meets a curve", art: "pcsys",
    blurb: "Book 9.3 · Substitute the line into the curve and solve: two, one or no points of intersection.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $x^2 - x - 2 = 0$. What is the larger solution?", pre: "$x =$", answer: 2, skill: "Quadratic equations", near: [{ v: -1, fb: "That is the smaller solution: $(x - 2)(x + 1) = 0$ gives $2$ and $-1$." }], hints: ["Factor: two numbers that multiply to $-2$ and add to $-1$."], why: "$(x - 2)(x + 1) = 0$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue curve is $y = x^2$. Slide the slope $m$ and intercept $c$ of the orange line $y = mx + c$. Find a line that meets the parabola at **two** points, one that **just touches** it, and one that **misses** it.",
        scene: { type: "sketch", x: [-5, 5], y: [-4, 9], u: 22, w: 268, gate: true, pts: {},
          params: { m: { min: -3, max: 3, step: 1, v: 0, label: "slope $m$" }, c: { min: -4, max: 5, step: 1, v: -2, label: "intercept $c$" } },
          track: function (s) { var D = s.p.m * s.p.m + 4 * s.p.c; return D < 0 ? "none" : D === 0 ? "one" : "two"; },
          draw: function (s) {
            var m = s.p.m, c = s.p.c, D = m * m + 4 * c, it = curve(SQ, -5, 5, "blue", [-4, 9]).concat(curve(LN(m, c), -5, 5, "orange", [-4, 9]));
            if (D >= 0) [(m + Math.sqrt(D)) / 2, (m - Math.sqrt(D)) / 2].forEach(function (x, i) { if (i === 0 || D > 0) it.push(dot(x, x * x, "green")); });
            return it;
          },
          readout: function (s) {
            var m = s.p.m, c = s.p.c, D = m * m + 4 * c, n = D < 0 ? 0 : D === 0 ? 1 : 2;
            return "$y = " + (m === 0 ? "" : (m === 1 ? "" : m === -1 ? "-" : m) + "x " + (c < 0 ? "-" : "+") + " ") + (m === 0 ? nm(c) : Math.abs(c)) + "$ · $m^2 + 4c = " + nm(m * m) + " " + (c < 0 ? "-" : "+") + " " + Math.abs(4 * c) + " = " + nm(D) + "$<br>" + (n === 2 ? "**two** points" : n === 1 ? "**one** point: the line touches" : "**no** points") + "<br>Two: " + (s.tracked.two ? "✓" : "—") + " · one: " + (s.tracked.one ? "✓" : "—") + " · none: " + (s.tracked.none ? "✓" : "—");
          },
          goal: function (s) { return !!(s.tracked.two && s.tracked.one && s.tracked.none); } },
        gate: true, then: "Setting $x^2 = mx + c$ gives a quadratic, and a quadratic has **two**, **one** or **no** real solutions, depending on its discriminant $m^2 + 4c$. Positive: two points. Zero: the line is **tangent**. Negative: it misses." },
      { type: "learn", kicker: "The idea",
        prompt: "**Substitute** the line's $y$ into the curve, **solve** the quadratic for $x$ (one point for each solution), then use the line to find each $y$. **Check** both equations. A line can meet a parabola or a circle at **two**, **one** or **no** points.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Where do $y = x^2$ and $y = x + 2$ meet?",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "x^2 = x + 2", say: "Both give $y$, so set them equal.", fig: G8(1) },
          { step: 2, m: "x^2 - x - 2 = 0", say: "Move everything to one side." },
          { step: 2, m: "(x - 2)(x + 1) = 0", say: "Factor.", ask: { prompt: "Two solutions for $x$ mean…", answer: 0, options: [{ t: "the line meets the parabola at **two** points" }, { t: "the line misses the parabola", fb: "Each real solution of the quadratic is the $x$ of one meeting point." }] } },
          { step: 2, m: "x = 2 \\ \\text{or} \\ x = -1", say: "Set each factor to zero." },
          { step: 3, m: "y = 2 + 2 = 4", say: "Use the line for each $y$.", fig: G8(2) },
          { step: 3, m: "y = -1 + 2 = 1", say: "Check: $4 = 2^2$ and $1 = (-1)^2$." }] },
        gate: true, then: "The curves meet at $(2, 4)$ and $(-1, 1)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find where the circle $x^2 + y^2 = 25$ meets the line $y = x + 1$.",
        how: HOW_8, skill: "Line meets curve",
        steps: [
          { step: 1, ask: "Put $y = x + 1$ into the circle. What do you get?", type: "choice", answer: 0, options: [{ t: "$x^2 + (x + 1)^2 = 25$" }, { t: "$x^2 + x + 1 = 25$", fb: "$y$ is **squared**, so square the whole $x + 1$: $(x + 1)^2$." }], m: "x^2 + (x + 1)^2 = 25", say: "One unknown left." },
          { step: 2, ask: "Expanding gives $2x^2 + 2x - 24 = 0$, so $x^2 + x - 12 = 0$, which is $(x - 3)(x + 4) = 0$. So $x = 3$ or $x =$", type: "num", pre: "$x =$", answer: -4, near: [{ v: 4, fb: "$x + 4 = 0$ gives $x = -4$." }], hint: "Set $x + 4 = 0$.", m: "x = 3 \\text{ or } x = -4", say: "Two solutions." },
          { step: 3, ask: "For $x = 3$: $y = 3 + 1 =$", type: "num", pre: "$y =$", answer: 4, near: [{ v: 2, fb: "$y = x + 1$, so add 1." }], hint: "$3 + 1$.", m: "(3, 4)", say: "Check: $9 + 16 = 25$." },
          { step: 3, ask: "For $x = -4$: $y = -4 + 1 =$", type: "num", pre: "$y =$", answer: -3, near: [{ v: 3, fb: "$-4 + 1$ is negative." }], hint: "$-4 + 1$.", m: "(-4, -3)", say: "Check: $16 + 9 = 25$." }],
        why: "Substitute, solve, find $y$." },
      { type: "num", kicker: "On your own", prompt: "The line $y = x + 6$ meets the parabola $y = x^2$. What is the **positive** $x$-coordinate of a meeting point?", pre: "$x =$", answer: 3, skill: "Line meets curve", near: [{ v: -2, fb: "That is the negative one. $x^2 - x - 6 = (x - 3)(x + 2)$." }, { v: 9, fb: "That is the $y$-coordinate. The $x$ is 3." }], hints: ["$x^2 = x + 6$."], why: "$(x - 3)(x + 2) = 0$: the positive solution is $x = 3$ (so $y = 9$)." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Just one meeting point.** Where do $y = x^2$ and the line $y = 2x - 1$ meet?",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "x^2 = 2x - 1", say: "Set the heights equal.", fig: G8t(1) },
          { step: 2, m: "x^2 - 2x + 1 = 0", say: "One side zero." },
          { step: 2, m: "(x - 1)^2 = 0", say: "A perfect square.", ask: { prompt: "How many different $x$ solve $(x - 1)^2 = 0$?", answer: 0, options: [{ t: "One: $x = 1$" }, { t: "Two", fb: "Both factors are $x - 1$: the same solution twice." }] } },
          { step: 3, m: "y = 2(1) - 1 = 1", say: "Use the line.", fig: G8t(2) },
          { step: 3, m: "(1, 1)", say: "The line only **touches** the parabola there: it is a **tangent**." }] },
        gate: true, then: "One solution, $(1, 1)$: the line is tangent. A repeated root means a single meeting point." },
      { type: "num", kicker: "Try it", prompt: "How many points do the circle $x^2 + y^2 = 25$ and the line $y = x + 8$ share?", pre: "points =", answer: 0, skill: "Line meets curve", near: [{ v: 2, fb: "Substitute: $2x^2 + 16x + 39 = 0$. Its discriminant $16^2 - 4(2)(39)$ is negative." }, { v: 1, fb: "Substitute: $2x^2 + 16x + 39 = 0$. Its discriminant is negative, not zero." }], hints: ["Substitute $y = x + 8$ and look at the discriminant."], why: "Discriminant $256 - 312 < 0$: no real solutions." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kit solves $y = x^2$ and $y = x + 2$. Tap the line where the work **first** goes wrong.",
        lines: ["x^2 = x + 2", "x^2 - x - 2 = 0", "(x - 2)(x - 1) = 0", "x = 2 \\text{ or } x = 1"], answer: 2, fix: "(x - 2)(x + 1) = 0",
        fb: { 0: GIVEN, 1: "Subtracting $x + 2$ from both sides is right.", 3: LATER }, skill: "Line meets curve",
        hints: ["Multiply $(x - 2)(x - 1)$ back out."], why: "$(x - 2)(x - 1) = x^2 - 3x + 2$. We need $x^2 - x - 2 = (x - 2)(x + 1)$." },
      { type: "num", kicker: "Use it", prompt: "A ball follows $y = -x^2 + 6x$ and a ramp lies along $y = 2x$. Apart from the start at $x = 0$, at what $x$ do they meet?", pre: "$x =$", answer: 4, skill: "Line meets curve", near: [{ v: 8, fb: "That is the height $y = 2x$. We want the $x$." }, { v: 0, fb: "That is the start. The other meeting point is at the second solution." }], hints: ["$-x^2 + 6x = 2x$."], why: "$x^2 - 4x = 0$, so $x = 0$ or $x = 4$." }
    ]
  });

  /* ============================================ 9 · Nonlinear systems by elimination */
  var HOW_9 = [["Line up", "Write both equations with $x^2$ and $y^2$ (or solve for a square)."],
               ["Combine", "Remove one square and solve for the other."],
               ["Roots", "Take $\\pm$ square roots, pair them up and count."]];
  var G9 = function (k) {
    var it = [{ circle: [[0, 0], 5], c: "blue" }].concat(curve(function (x) { return x * x - 5; }, -3.7, 3.7, "orange", [-7, 7]));
    if (k >= 2) it.push(dot(3, 4, "green"), dot(-3, 4, "green"), dot(0, -5, "green"));
    return grid("The circle x squared plus y squared equals 25 and the parabola y = x squared minus 5" + (k >= 2 ? ", meeting at three points" : "") + ".", it, { x: [-7, 7], y: [-7, 7], u: 17 });
  };
  LESSONS.push({
    title: "Nonlinear systems by elimination", art: "pcsys",
    blurb: "Book 9.3 · When both equations only use $x^2$ and $y^2$, add and subtract them like a linear system.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $x^2 + y^2 = 25$ and $x^2 = 16$, what is $y^2$?", pre: "$y^2 =$", answer: 9, skill: "Squares", near: [{ v: 3, fb: "That is $y$. The question asks for $y^2$." }, { v: 41, fb: "Subtract $x^2$, do not add it: $25 - 16$." }], hints: ["$25 - 16$."], why: "$y^2 = 25 - 16 = 9$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue circle is $x^2 + y^2 = 25$. Slide $k$ to change the orange curve $x^2 - y^2 = k$ and watch how many **meeting points** there are. Find a $k$ with **four**, with **two** and with **none**.",
        scene: { type: "sketch", x: [-7, 7], y: [-7, 7], u: 21, w: 342, gate: true, pts: {},
          params: { k: { min: -30, max: 30, step: 5, v: 30, label: "$k$" } },
          track: function (s) { var k = s.p.k, n = Math.abs(k) > 25 ? 0 : Math.abs(k) === 25 ? 2 : 4; return "n" + n; },
          draw: function (s) {
            var k = s.p.k, it = [{ circle: [[0, 0], 5], c: "blue" }], t;
            if (k > 0) { t = Math.sqrt(49 - k); it = it.concat(curveT(function (u) { return [Math.sqrt(u * u + k), u]; }, -t, t, "orange", 120), curveT(function (u) { return [-Math.sqrt(u * u + k), u]; }, -t, t, "orange", 120)); }
            else if (k < 0) { t = Math.sqrt(49 + k); it = it.concat(curveT(function (u) { return [u, Math.sqrt(u * u - k)]; }, -t, t, "orange", 120), curveT(function (u) { return [u, -Math.sqrt(u * u - k)]; }, -t, t, "orange", 120)); }
            else it = it.concat(curve(LN(1, 0), -7, 7, "orange", [-7, 7]), curve(LN(-1, 0), -7, 7, "orange", [-7, 7]));
            if (Math.abs(k) <= 25) { var a = Math.sqrt((25 + k) / 2), b = Math.sqrt((25 - k) / 2); [[a, b], [a, -b], [-a, b], [-a, -b]].forEach(function (p, i, all) { if (!all.some(function (q, j) { return j < i && Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9; })) it.push(dot(p[0], p[1], "green")); }); }
            return it;
          },
          readout: function (s) {
            var k = s.p.k, X = (25 + k) / 2, Y = (25 - k) / 2, n = Math.abs(k) > 25 ? 0 : Math.abs(k) === 25 ? 2 : 4;
            return "Add: $2x^2 = " + nm(25 + k) + "$, so $x^2 = " + nm(X) + "$. Subtract: $2y^2 = " + nm(25 - k) + "$, so $y^2 = " + nm(Y) + "$<br>**" + (n === 0 ? "No" : n) + "** meeting point" + (n === 1 ? "" : "s") + "<br>Four: " + (s.tracked.n4 ? "✓" : "—") + " · two: " + (s.tracked.n2 ? "✓" : "—") + " · none: " + (s.tracked.n0 ? "✓" : "—");
          },
          goal: function (s) { return !!(s.tracked.n4 && s.tracked.n2 && s.tracked.n0); } },
        gate: true, then: "Adding the equations gives $x^2 = \\frac{25 + k}{2}$ and subtracting gives $y^2 = \\frac{25 - k}{2}$. Each square gives **two** values (±) when positive, **one** when zero, **none** when negative. Four points need both squares positive; at $k = \\pm 25$ one square is zero (two points); beyond that a square is negative (none)." },
      { type: "learn", kicker: "The idea",
        prompt: "When both equations hold only $x^2$ and $y^2$, treat the squares as unknowns: **add or subtract** to remove one, solve for the other, then take **$\\pm$ roots**. Pair every $x$ with every $y$ and **count**. A square of $0$ gives one value; a negative one, none.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $x^2 + y^2 = 25$ and $x^2 - y^2 = 7$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "x^2 + y^2 = 25", say: "Both equations use only $x^2$ and $y^2$." },
          { step: 2, m: "2x^2 = 32 \\ \\Rightarrow \\ x^2 = 16", say: "Add the equations: $y^2$ and $-y^2$ cancel." },
          { step: 2, m: "2y^2 = 18 \\ \\Rightarrow \\ y^2 = 9", say: "Subtract the second from the first: $x^2$ cancels.", ask: { prompt: "Why can we treat $x^2$ and $y^2$ like ordinary unknowns?", answer: 0, options: [{ t: "They only appear as squares, so the system is linear in $x^2$ and $y^2$" }, { t: "Because squares are always positive", fb: "The method works because each square appears only to the first power, as a block." }] } },
          { step: 3, m: "x = \\pm 4, \\ y = \\pm 3", say: "Each square root has two signs." },
          { step: 3, m: "(\\pm 4, \\pm 3)", say: "Any sign of $x$ goes with any sign of $y$: **four** points. Check: $16 + 9 = 25$ and $16 - 9 = 7$." }] },
        gate: true, then: "Four solutions: $(4, 3)$, $(4, -3)$, $(-4, 3)$ and $(-4, -3)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $x^2 + y^2 = 13$ and $x^2 - y^2 = 5$.",
        how: HOW_9, skill: "Nonlinear elimination",
        steps: [
          { step: 1, ask: "Adding the two equations eliminates…", type: "choice", answer: 0, options: [{ t: "$y^2$" }, { t: "$x^2$", fb: "$x^2$ and $x^2$ **add** to $2x^2$. It is $+y^2$ and $-y^2$ that cancel." }], m: "2x^2 = 18", say: "$y^2$ cancelled." },
          { step: 2, ask: "$2x^2 = 18$, so $x^2 =$", type: "num", pre: "$x^2 =$", answer: 9, near: [{ v: 3, fb: "That is $x$. We want $x^2$ first: $18 \\div 2$." }], hint: "$18 \\div 2$.", m: "x^2 = 9", say: "So $x = \\pm 3$." },
          { step: 2, ask: "Subtracting gives $2y^2 = 8$, so $y^2 =$", type: "num", pre: "$y^2 =$", answer: 4, near: [{ v: 2, fb: "That is $y$. We want $y^2$ first: $8 \\div 2$." }], hint: "$8 \\div 2$.", m: "y^2 = 4", say: "So $y = \\pm 2$." },
          { step: 3, ask: "$x = \\pm 3$ and $y = \\pm 2$. How many solutions $(x, y)$ in all?", type: "num", pre: "solutions =", answer: 4, near: [{ v: 2, fb: "Every sign of $x$ pairs with every sign of $y$: $2 \\times 2$." }, { v: 6, fb: "Pair them: $2 \\times 2$, not $2 + 2 + 2$." }], hint: "$2 \\times 2$.", m: "(\\pm 3, \\pm 2)", say: "Four points." }],
        why: "Line up, add or subtract, roots." },
      { type: "num", kicker: "On your own", prompt: "Solve $x^2 + y^2 = 25$ and $x^2 - y^2 = -7$. What is the **positive** $y$?", pre: "$y =$", answer: 4, skill: "Nonlinear elimination", near: [{ v: 3, fb: "That is the positive $x$ ($x^2 = 9$). Subtract the equations: $2y^2 = 32$." }, { v: 16, fb: "That is $y^2$. Take the square root." }], hints: ["Subtract the second equation from the first."], why: "$2y^2 = 32$, $y^2 = 16$, $y = 4$ (and $x^2 = 9$)." },
      { type: "learn", kicker: "A harder case",
        prompt: "**One equation already has a square on its own.** Solve $y = x^2 - 5$ and $x^2 + y^2 = 25$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "x^2 = y + 5", say: "Solve the first for $x^2$.", fig: G9(1) },
          { step: 2, m: "(y + 5) + y^2 = 25", say: "Replace $x^2$ in the circle." },
          { step: 2, m: "y^2 + y - 20 = 0", say: "Tidy up." },
          { step: 2, m: "(y + 5)(y - 4) = 0", say: "Factor: $y = -5$ or $y = 4$.", ask: { prompt: "We have both $y$ values. What is still missing?", answer: 0, options: [{ t: "The matching $x$ values: $x^2 = y + 5$" }, { t: "Nothing: we are done", fb: "A solution is a **pair** $(x, y)$. Use $x^2 = y + 5$ for each $y$." }] } },
          { step: 3, m: "y = 4:\\ x^2 = 9", say: "So $x = \\pm 3$: two points." },
          { step: 3, m: "y = -5:\\ x^2 = 0", say: "So $x = 0$ only: **one** point.", fig: G9(2) },
          { step: 3, m: "3\\ \\text{points}", say: "$(3, 4)$, $(-3, 4)$ and $(0, -5)$." }] },
        gate: true, then: "Three solutions. A square equal to zero gives only one $x$, so count carefully." },
      { type: "num", kicker: "Try it", prompt: "How many solutions do $x^2 + y^2 = 9$ and $x^2 - y^2 = 10$ have?", pre: "solutions =", answer: 0, skill: "Nonlinear elimination", near: [{ v: 4, fb: "Add and subtract: $y^2$ comes out negative, which is impossible." }, { v: 2, fb: "Add and subtract: $y^2$ comes out negative, which is impossible." }], hints: ["Subtract the second equation from the first."], why: "$2y^2 = -1$: $y^2$ cannot be negative." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam solves $x^2 + y^2 = 4$ and $x^2 - y^2 = 4$. He finds $x^2 = 4$ and $y^2 = 0$ and says \"four solutions, $(\\pm 2, \\pm 0)$\". What is wrong?",
        options: [{ t: "$y = 0$ has only one value: there are just **two** solutions, $(2, 0)$ and $(-2, 0)$" }, { t: "Nothing: ± always gives two values", fb: "$+0$ and $-0$ are the same number." }, { t: "$y^2 = 0$ means no solution", fb: "$y = 0$ is a real value: the solutions exist." }],
        answer: 0, skill: "Nonlinear elimination", hints: ["Is $-0$ different from $0$?"], why: "The circle and the hyperbola touch at $(2, 0)$ and $(-2, 0)$." },
      { type: "num", kicker: "Use it", prompt: "Two square gardens have areas adding to $130\\ \\text{m}^2$ and differing by $32\\ \\text{m}^2$: $x^2 + y^2 = 130$ and $x^2 - y^2 = 32$. What is the side of the **larger** garden, in metres?", pre: "side =", post: "m", answer: 9, skill: "Nonlinear elimination", near: [{ v: 7, fb: "That is the smaller garden: $y^2 = 49$." }, { v: 81, fb: "That is the area $x^2$. Take the square root." }], hints: ["Add the equations: $2x^2 = 162$."], why: "$x^2 = 81$, so $x = 9$ (the smaller side is $y = 7$)." }
    ]
  });

  /* ============================================ 10 · Systems of inequalities */
  var HOW_10 = [["Boundary", "Graph each edge: **solid** for $\\le$ $\\ge$, **dashed** for $<$ $>$."],
                ["Test", "Test a point such as $(0, 0)$ to choose the side to shade."],
                ["Overlap", "The solution is where **all** the shadings overlap."]];
  var CAP = (function () {
    var p = [], x;
    for (x = -3; x <= 2.0001; x += 0.25) p.push([x, x * x - 4]);
    p.push([2, 0], [-3, 5]);
    return p;
  })();
  var G10 = function (k) {
    var it = [];
    if (k >= 3) it.push({ poly: CAP, c: "blue", fill: true });
    it = it.concat(curve(function (x) { return x * x - 4; }, -3.2, 3.2, "blue", [-5, 7]));
    if (k >= 2) it = it.concat(curve(LN(-1, 2), -5, 5, "orange", [-5, 7]));
    if (k >= 2 && k < 3) it.push(dot(0, 0, "green", "(0, 0)", "ne"));
    if (k >= 3) it.push(dot(-3, 5, "green"), dot(2, 0, "green"));
    return grid("The parabola y = x squared minus 4" + (k >= 2 ? " and the line y = 2 - x" : "") + (k >= 3 ? ", with the region between them shaded" : "") + ".", it, { x: [-5, 5], y: [-5, 7], u: 20 });
  };
  var GT = function (k) {
    var it = [{ seg: [[0, -1], [0, 6]], c: "ink" }, { seg: [[-1, 0], [6, 0]], c: "ink" }];
    if (k >= 3) it.unshift({ poly: [[0, 0], [4, 0], [0, 4]], c: "blue", fill: true });
    if (k >= 2) it = it.concat(curve(LN(-1, 4), -1, 5.5, "orange", [-1, 6]));
    if (k >= 3) it.push(dot(0, 0, "green"), dot(4, 0, "green", "(4, 0)", "s"), dot(0, 4, "green", "(0, 4)", "ne"));
    return grid("The axes" + (k >= 2 ? " and the line x + y = 4" : "") + (k >= 3 ? " bound the triangle with corners (0, 0), (4, 0) and (0, 4)" : "") + ".", it, { x: [-1, 6], y: [-1, 6], u: 28 });
  };
  LESSONS.push({
    title: "Systems of inequalities", art: "pcsys",
    blurb: "Book 9.3 · Draw each boundary, test a point to shade, and keep where the shadings overlap.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $(0, 0)$ a solution of $y \\ge x - 2$?",
        options: [{ t: "Yes: $0 \\ge -2$" }, { t: "No: $0 < -2$", fb: "$0$ is greater than $-2$, so $0 \\ge -2$ is true." }, { t: "Only if $x > 0$", fb: "Just substitute $x = 0$ and $y = 0$: $0 \\ge 0 - 2$." }],
        answer: 0, skill: "Test points", hints: ["Put $x = 0$, $y = 0$ into the inequality."], why: "$0 \\ge -2$ is true." },
      { type: "learn", kicker: "Explore",
        prompt: "The two inequalities are $y \\ge x^2 - 4$ (above the blue parabola) and $y \\le 2 - x$ (below the orange line). Move the test point with $x$ and $y$. Find a point that satisfies **both**, one that satisfies **only one**, and one that satisfies **neither**.",
        scene: { type: "sketch", x: [-5, 5], y: [-5, 7], u: 24, w: 288, gate: true, pts: {},
          params: { x: { min: -4, max: 4, step: 1, v: 4, label: "$x$" }, y: { min: -5, max: 6, step: 1, v: 6, label: "$y$" } },
          track: function (s) { var a = s.p.y >= s.p.x * s.p.x - 4, b = s.p.y <= 2 - s.p.x; return a && b ? "both" : a || b ? "one" : "none"; },
          draw: function (s) { var a = s.p.y >= s.p.x * s.p.x - 4, b = s.p.y <= 2 - s.p.x; return curve(function (x) { return x * x - 4; }, -3.2, 3.2, "blue", [-5, 7]).concat(curve(LN(-1, 2), -5, 5, "orange", [-5, 7]), [dot(s.p.x, s.p.y, a && b ? "green" : a || b ? "orange" : "red")]); },
          readout: function (s) {
            var x = s.p.x, y = s.p.y, a = y >= x * x - 4, b = y <= 2 - x;
            return "$(" + nm(x) + ", " + nm(y) + ")$: $y \\ge x^2 - 4$ is " + (a ? "✓" : "✗") + " ($" + nm(y) + "$ against $" + nm(x * x - 4) + "$) · $y \\le 2 - x$ is " + (b ? "✓" : "✗") + " ($" + nm(y) + "$ against $" + nm(2 - x) + "$)<br>Both: " + (s.tracked.both ? "✓" : "—") + " · only one: " + (s.tracked.one ? "✓" : "—") + " · neither: " + (s.tracked.none ? "✓" : "—");
          },
          goal: function (s) { return !!(s.tracked.both && s.tracked.one && s.tracked.none); } },
        gate: true, then: "The points satisfying **both** lie in the region **above the parabola and below the line**, the cap between them. Points satisfying only one are on one side of just one boundary; points in neither are on the wrong side of both. A **system of inequalities** is the overlap of the individual regions." },
      { type: "learn", kicker: "The idea",
        prompt: "**Graph each boundary**: solid when the inequality includes equality ($\\le$, $\\ge$), dashed when it is strict ($<$, $>$). **Test a point** such as $(0, 0)$ to see which side to shade. The solution of the system is where **every** shading overlaps.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph the solution of $y \\ge x^2 - 4$ and $y \\le 2 - x$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "y = x^2 - 4", say: "First boundary: a parabola. $\\ge$ includes equality, so draw it **solid**.", fig: G10(1) },
          { step: 1, m: "y = 2 - x", say: "Second boundary: a line, also **solid**.", fig: G10(2) },
          { step: 2, m: "(0,0):\\ 0 \\ge -4", say: "Test the origin in the first.", ask: { prompt: "$(0, 0)$ satisfies $y \\ge x^2 - 4$, so we shade…", answer: 0, options: [{ t: "the side containing the origin: above the parabola" }, { t: "the other side", fb: "The test point is a solution, so shade its side." }] } },
          { step: 2, m: "(0,0):\\ 0 \\le 2", say: "And the second: shade below the line." },
          { step: 3, m: "\\text{overlap}", say: "Keep only where both shadings overlap: the cap between the curves.", fig: G10(3) },
          { step: 3, m: "x^2 - 4 = 2 - x", say: "The corners are where the boundaries meet: $x = -3$ and $x = 2$." }] },
        gate: true, then: "The solution is the shaded cap, including its boundary, with corners $(-3, 5)$ and $(2, 0)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you work with $y > x$ and $y \\le 4 - x$.",
        how: HOW_10, skill: "Systems of inequalities",
        steps: [
          { step: 1, ask: "The boundary of $y > x$ is drawn…", type: "choice", answer: 0, options: [{ t: "dashed: $>$ is strict" }, { t: "solid", fb: "Points **on** the line $y = x$ do not satisfy $y > x$, so draw it dashed." }], m: "y = x\\ \\text{(dashed)}", say: "Strict inequality." },
          { step: 2, ask: "Is $(1, 2)$ a solution of **both** $y > x$ and $y \\le 4 - x$?", type: "choice", answer: 0, options: [{ t: "Yes: $2 > 1$ and $2 \\le 3$" }, { t: "No: it fails $y > x$", fb: "$2 > 1$ is true." }, { t: "No: it fails $y \\le 4 - x$", fb: "$4 - 1 = 3$ and $2 \\le 3$ is true." }], m: "(1, 2)\\ \\checkmark", say: "It lies in the overlap." },
          { step: 3, ask: "The two boundaries meet where $x = 4 - x$, so $x =$", type: "num", pre: "$x =$", answer: 2, near: [{ v: 4, fb: "$2x = 4$: divide by 2." }], hint: "$2x = 4$.", m: "(2, 2)", say: "The corner: $y = x = 2$." }],
        why: "Boundary, test, overlap." },
      { type: "choice", kicker: "On your own", prompt: "Is $(2, 1)$ a solution of the system $y < x^2$ and $x + y \\ge 3$?",
        options: [{ t: "Yes: $1 < 4$ and $3 \\ge 3$" }, { t: "No: it fails $y < x^2$", fb: "$1 < 4$ is true." }, { t: "No: it fails $x + y \\ge 3$", fb: "$2 + 1 = 3$ and $3 \\ge 3$ is true: equality counts." }],
        answer: 0, skill: "Systems of inequalities", hints: ["Test each inequality separately."], why: "Both are true." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Three inequalities.** Graph $x \\ge 0$, $y \\ge 0$ and $x + y \\le 4$, and find the area of the region.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "x \\ge 0,\\ y \\ge 0", say: "Two boundaries are the axes: the region lies on the right and above.", fig: GT(1) },
          { step: 1, m: "x + y = 4", say: "Third boundary: a line through $(4, 0)$ and $(0, 4)$.", fig: GT(2) },
          { step: 2, m: "(1,1):\\ 2 \\le 4", say: "Test an inside point.", ask: { prompt: "$(1, 1)$ satisfies all three. Which side of the line $x + y = 4$ is shaded?", answer: 0, options: [{ t: "The side with the origin" }, { t: "The far side", fb: "The test point is a solution, and it is on the origin's side." }] } },
          { step: 3, m: "(0,0),(4,0),(0,4)", say: "The overlap is a triangle with these corners.", fig: GT(3) },
          { step: 3, m: "A = \\tfrac{1}{2}(4)(4) = 8", say: "Half base times height." }] },
        gate: true, then: "The region is a right triangle of area $8$." },
      { type: "num", kicker: "Try it", prompt: "What is the area of the region $x \\ge 0$, $y \\ge 0$, $2x + y \\le 6$?", pre: "area =", answer: 9, skill: "Systems of inequalities", near: [{ v: 18, fb: "That is base times height. It is a **triangle**: half of $3 \\times 6$." }, { v: 6, fb: "The corners are $(0, 0)$, $(3, 0)$ and $(0, 6)$." }], hints: ["The line meets the axes at $(3, 0)$ and $(0, 6)$."], why: "$\\frac{1}{2}(3)(6) = 9$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee graphs $y > x^2$ with a **solid** curve. What should it be?",
        options: [{ t: "Dashed: $>$ is strict, so points on the curve are not solutions" }, { t: "Nothing: curves are always solid", fb: "Dashed or solid depends on whether the inequality includes equality." }, { t: "Dotted and shaded below", fb: "Test $(0, 1)$: $1 > 0$ is true, so shade above." }],
        answer: 0, skill: "Systems of inequalities", hints: ["Is a point on the curve a solution of $y > x^2$?"], why: "Strict inequality: dashed." },
      { type: "num", kicker: "Use it", prompt: "You may buy $x$ pens at $\\$2$ and $y$ notebooks at $\\$3$ with at most $\\$12$: $2x + 3y \\le 12$. If you buy $3$ pens, what is the **most** notebooks you can buy?", pre: "notebooks =", answer: 2, skill: "Systems of inequalities", near: [{ v: 3, fb: "$6 + 3(3) = 15$ is more than $12$." }, { v: 6, fb: "That is the number of pens' dollars. $6 + 3y \\le 12$ gives $y \\le 2$." }], hints: ["$2(3) + 3y \\le 12$."], why: "$3y \\le 6$, so $y \\le 2$." }
    ]
  });
  /* ============================================ 11 · Partial fractions: distinct linear factors */
  var LINT = function (a, b) {
    var s = a === 0 ? "" : (a === 1 ? "" : a === -1 ? "-" : nm(a)) + "x";
    if (b !== 0 || a === 0) s += s ? (b < 0 ? " - " : " + ") + Math.abs(b) : nm(b);
    return s;
  };
  var HOW_11 = [["Split", "Write $\\frac{A}{x-a} + \\frac{B}{x-b}$: one fraction for each factor."],
                ["Clear", "Multiply both sides by the whole denominator."],
                ["Find A, B", "Put in $x = a$ and $x = b$: each one removes a term."]];
  LESSONS.push({
    title: "Partial fractions: distinct factors", art: "pcsys",
    blurb: "Book 9.4 · Break one fraction into simpler ones, one for each linear factor of the denominator.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Expand $3(x + 1) + 2(x - 2)$. What is the constant term?", pre: "constant =", answer: -1, skill: "Combining fractions", near: [{ v: 1, fb: "$3 \\cdot 1 = 3$ and $2 \\cdot (-2) = -4$: $3 - 4$." }, { v: 5, fb: "That is the coefficient of $x$. The constant is $3 - 4$." }], hints: ["$3x + 3 + 2x - 4$."], why: "$5x - 1$: the constant term is $-1$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange curve is $\\dfrac{3x + 5}{(x + 1)(x + 2)}$. Slide $A$ and $B$ so the blue curve $\\dfrac{A}{x + 1} + \\dfrac{B}{x + 2}$ lands **exactly on top** of it.",
        scene: { type: "sketch", x: [-6, 4], y: [-6, 6], u: 20, w: 248, gate: true, pts: {},
          params: { A: { min: -4, max: 4, step: 1, v: 1, label: "$A$" }, B: { min: -4, max: 4, step: 1, v: 1, label: "$B$" } },
          draw: function (s) { var A = s.p.A, B = s.p.B; return curve(function (x) { return (3 * x + 5) / ((x + 1) * (x + 2)); }, -6, 4, "orange", [-6, 6]).concat(curve(function (x) { return A / (x + 1) + B / (x + 2); }, -6, 4, "blue", [-6, 6])); },
          readout: function (s) { var A = s.p.A, B = s.p.B, ok = A + B === 3 && 2 * A + B === 5; return "Numerator of $\\frac{" + nm(A) + "}{x+1} + \\frac{" + nm(B) + "}{x+2}$: $" + LINT(A + B, 2 * A + B) + "$ against $3x + 5$<br>" + (ok ? "✓ they match" : "not yet: both the $x$ term and the constant must match"); },
          goal: function (s) { return s.p.A + s.p.B === 3 && 2 * s.p.A + s.p.B === 5; } },
        gate: true, then: "$A = 2$ and $B = 1$: $\\dfrac{3x + 5}{(x + 1)(x + 2)} = \\dfrac{2}{x + 1} + \\dfrac{1}{x + 2}$. Adding the right side gives numerator $(A + B)x + (2A + B)$, which has to be $3x + 5$. **Partial fractions** run that addition backwards." },
      { type: "learn", kicker: "The idea",
        prompt: "To split a fraction whose denominator has **distinct linear factors**, write one fraction for each factor: $\\frac{A}{x - a} + \\frac{B}{x - b}$. **Clear** the denominators, then put in $x = a$ and $x = b$: each choice removes one unknown. If the top is not **lower degree** than the bottom, divide first.",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Split $\\dfrac{x + 7}{(x - 1)(x + 3)}$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "\\frac{A}{x-1} + \\frac{B}{x+3}", say: "One fraction for each factor of the denominator." },
          { step: 2, m: "x + 7 = A(x+3) + B(x-1)", say: "Multiply through by $(x - 1)(x + 3)$.", ask: { prompt: "What happens to the denominators?", answer: 0, options: [{ t: "They cancel, leaving only numerators" }, { t: "They stay in the equation", fb: "Multiplying both sides by the full denominator removes it from every fraction." }] } },
          { step: 3, m: "x = 1:\\ 8 = 4A", say: "Put in $x = 1$: the $B$ term disappears." },
          { step: 3, m: "x = -3:\\ 4 = -4B", say: "Put in $x = -3$: the $A$ term disappears." },
          { step: 3, m: "A = 2,\\ B = -1", say: "Divide." },
          { step: 3, m: "\\frac{2}{x-1} - \\frac{1}{x+3}", say: "Check at $x = 2$: both sides are $\\frac{9}{5}$." }] },
        gate: true, then: "$\\dfrac{x + 7}{(x - 1)(x + 3)} = \\dfrac{2}{x - 1} - \\dfrac{1}{x + 3}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you split $\\dfrac{5x + 1}{(x - 1)(x + 2)}$.",
        how: HOW_11, skill: "Partial fractions",
        steps: [
          { step: 1, ask: "Each factor of the denominator gets its own fraction. The split is…", type: "choice", answer: 0, options: [{ t: "$\\dfrac{A}{x - 1} + \\dfrac{B}{x + 2}$" }, { t: "$\\dfrac{A + B}{(x - 1)(x + 2)}$", fb: "That is one fraction over the whole product: where we started. Split into **one fraction per factor**." }], m: "\\frac{A}{x-1} + \\frac{B}{x+2}", say: "The shape." },
          { step: 2, ask: "Multiplying both sides by $(x - 1)(x + 2)$ gives…", type: "choice", answer: 0, options: [{ t: "$5x + 1 = A(x + 2) + B(x - 1)$" }, { t: "$5x + 1 = A(x - 1) + B(x + 2)$", fb: "$A$ sits over $x - 1$, so that factor cancels and $A$ keeps the **other** factor, $x + 2$." }], m: "5x + 1 = A(x+2) + B(x-1)", say: "Denominators gone." },
          { step: 3, ask: "Put in $x = 1$: $6 = 3A$, so $A =$", type: "num", pre: "$A =$", answer: 2, near: [{ v: 6, fb: "$6 = 3A$: divide by 3." }], hint: "$6 \\div 3$.", m: "A = 2", say: "The $B$ term vanished." },
          { step: 3, ask: "Put in $x = -2$: $-9 = -3B$, so $B =$", type: "num", pre: "$B =$", answer: 3, near: [{ v: -3, fb: "$-9 \\div (-3)$ is positive." }], hint: "$-9 \\div (-3)$.", m: "\\frac{2}{x-1} + \\frac{3}{x+2}", say: "Check at $x = 0$: $-\\frac{1}{2}$ on both sides." }],
        why: "Split, clear, find $A$ and $B$." },
      { type: "num", kicker: "On your own", prompt: "Split $\\dfrac{5x - 1}{(x + 1)(x - 2)} = \\dfrac{A}{x + 1} + \\dfrac{B}{x - 2}$. What is $B$?", pre: "$B =$", answer: 3, skill: "Partial fractions", near: [{ v: 2, fb: "That is $A$. For $B$ put in $x = 2$: $9 = 3B$." }, { v: 9, fb: "$9 = 3B$ at $x = 2$: divide by 3." }], hints: ["$5x - 1 = A(x - 2) + B(x + 1)$; put in $x = 2$."], why: "$x = 2$: $9 = 3B$, so $B = 3$ (and $A = 2$)." },
      { type: "learn", kicker: "A harder case",
        prompt: "**The top is not lower degree.** Split $\\dfrac{x^2 + 3x - 2}{(x + 1)(x - 1)}$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "\\frac{x^2+3x-2}{x^2-1}", say: "Top and bottom both have degree 2: **divide first**." },
          { step: 1, m: "1 + \\frac{3x-1}{x^2-1}", say: "$x^2 + 3x - 2 = 1\\cdot(x^2 - 1) + (3x - 1)$.", ask: { prompt: "Why divide before splitting?", answer: 0, options: [{ t: "Partial fractions need a top of **lower degree** than the bottom" }, { t: "To make the numbers larger", fb: "A remainder of lower degree is what the $A$, $B$ form can match." }] } },
          { step: 2, m: "\\frac{A}{x+1} + \\frac{B}{x-1}", say: "Now split the fraction part." },
          { step: 2, m: "3x - 1 = A(x-1) + B(x+1)", say: "Clear the denominators." },
          { step: 3, m: "x = -1:\\ -4 = -2A", say: "So $A = 2$." },
          { step: 3, m: "x = 1:\\ 2 = 2B", say: "So $B = 1$." },
          { step: 3, m: "1 + \\frac{2}{x+1} + \\frac{1}{x-1}", say: "Put the whole part back. Check at $x = 2$: $\\frac{8}{3}$ both ways." }] },
        gate: true, then: "$1 + \\dfrac{2}{x + 1} + \\dfrac{1}{x - 1}$." },
      { type: "num", kicker: "Try it", prompt: "Split $\\dfrac{7x + 6}{x(x + 3)} = \\dfrac{A}{x} + \\dfrac{B}{x + 3}$. What is $B$?", pre: "$B =$", answer: 5, skill: "Partial fractions", near: [{ v: 2, fb: "That is $A$ ($x = 0$: $6 = 3A$). For $B$ put in $x = -3$." }, { v: -5, fb: "$-15 = -3B$: the negatives cancel." }], hints: ["$7x + 6 = A(x + 3) + Bx$; put in $x = -3$."], why: "$x = -3$: $-15 = -3B$, so $B = 5$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Rae splits $\\dfrac{2x + 10}{(x + 1)(x + 3)}$ and gets $2x + 10 = A(x + 3) + B(x + 1)$. Tap the line where the work **first** goes wrong.",
        lines: ["2x + 10 = A(x+3) + B(x+1)", "x = -1:\\ 8 = 2A", "A = 8", "x = -3:\\ 4 = -2B"], answer: 2, fix: "A = 4",
        fb: { 0: GIVEN, 1: "Putting $x = -1$ gives $2(-1) + 10 = 8$ and $A(2) = 2A$: correct.", 3: "Correct on its own: putting $x = -3$ gives $4 = -2B$." }, skill: "Partial fractions",
        hints: ["Divide $8$ by $2$."], why: "$8 = 2A$ gives $A = 4$." },
      { type: "num", kicker: "Use it", prompt: "Using $\\dfrac{1}{x(x + 1)} = \\dfrac{1}{x} - \\dfrac{1}{x + 1}$, work out $\\dfrac{1}{1\\cdot 2} + \\dfrac{1}{2\\cdot 3} + \\dfrac{1}{3\\cdot 4} + \\dfrac{1}{4\\cdot 5}$. Type a decimal.", pre: "sum =", answer: 0.8, tol: 0.0051, skill: "Partial fractions", near: [{ v: 1, tol: 0.0051, fb: "The middle terms cancel, leaving $1 - \\frac{1}{5}$." }, { v: 0.2, tol: 0.0051, fb: "That is $\\frac{1}{5}$. The sum is $1 - \\frac{1}{5}$." }], hints: ["Write each term as a difference: most of them cancel."], why: "$\\left(1 - \\frac{1}{2}\\right) + \\left(\\frac{1}{2} - \\frac{1}{3}\\right) + \\dots = 1 - \\frac{1}{5} = 0.8$." }
    ]
  });

  /* ============================================ 12 · Partial fractions: repeated and quadratic factors */
  var HOW_12 = [["Shape", "One fraction for **each power** of a repeated factor; $Ax + B$ over a quadratic that will not factor."],
                ["Clear", "Multiply both sides by the whole denominator."],
                ["Solve", "Use easy values of $x$, then compare coefficients."]];
  LESSONS.push({
    title: "Partial fractions: repeated and quadratic", art: "pcsys",
    blurb: "Book 9.4 · A squared factor needs two fractions; a quadratic that will not factor needs a linear top.",
    mins: 15, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Can $x^2 + 1$ be factored into real linear factors?",
        options: [{ t: "No: $x^2 + 1$ is never zero for real $x$" }, { t: "Yes: $(x + 1)(x + 1)$", fb: "$(x + 1)(x + 1) = x^2 + 2x + 1$, not $x^2 + 1$." }, { t: "Yes: $(x + 1)(x - 1)$", fb: "That is $x^2 - 1$. A **plus** makes the difference." }],
        answer: 0, skill: "Irreducible quadratics", hints: ["Is there a real $x$ with $x^2 = -1$?"], why: "No real roots, so it does not factor." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange curve is $\\dfrac{x^2 + 7x + 1}{(x - 1)^2(x + 2)}$. Slide $A$, $B$ and $C$ so the blue curve $\\dfrac{A}{x - 1} + \\dfrac{B}{(x - 1)^2} + \\dfrac{C}{x + 2}$ lands **exactly on top**.",
        scene: { type: "sketch", x: [-5, 4], y: [-6, 6], u: 20, w: 228, gate: true, pts: {},
          params: { A: { min: -4, max: 4, step: 1, v: 1, label: "$A$" }, B: { min: -4, max: 4, step: 1, v: 1, label: "$B$" }, C: { min: -4, max: 4, step: 1, v: 1, label: "$C$" } },
          draw: function (s) { var A = s.p.A, B = s.p.B, C = s.p.C; return curve(function (x) { return (x * x + 7 * x + 1) / ((x - 1) * (x - 1) * (x + 2)); }, -5, 4, "orange", [-6, 6]).concat(curve(function (x) { return A / (x - 1) + B / ((x - 1) * (x - 1)) + C / (x + 2); }, -5, 4, "blue", [-6, 6])); },
          readout: function (s) {
            var A = s.p.A, B = s.p.B, C = s.p.C, c2 = A + C, c1 = A + B - 2 * C, c0 = -2 * A + 2 * B + C;
            return "$x^2$: $A + C = " + nm(c2) + "$ against $1$ " + (c2 === 1 ? "✓" : "✗") + "<br>$x$: $A + B - 2C = " + nm(c1) + "$ against $7$ " + (c1 === 7 ? "✓" : "✗") + "<br>constant: $-2A + 2B + C = " + nm(c0) + "$ against $1$ " + (c0 === 1 ? "✓" : "✗");
          },
          goal: function (s) { var A = s.p.A, B = s.p.B, C = s.p.C; return A + C === 1 && A + B - 2 * C === 7 && -2 * A + 2 * B + C === 1; } },
        gate: true, then: "$A = 2$, $B = 3$, $C = -1$: $\\dfrac{2}{x - 1} + \\dfrac{3}{(x - 1)^2} - \\dfrac{1}{x + 2}$. The squared factor $(x - 1)^2$ needs **two** fractions, one over $x - 1$ and one over $(x - 1)^2$. Both numerators had to match for all three coefficients at once." },
      { type: "learn", kicker: "The idea",
        prompt: "A **repeated** factor $(x - a)^2$ needs a fraction for **each power**: $\\frac{A}{x - a} + \\frac{B}{(x - a)^2}$. A quadratic that **will not factor** needs a linear top: $\\frac{Bx + C}{x^2 + 1}$. Clear the denominators, use easy $x$ values, then **compare coefficients**.",
        scene: { type: "method", how: HOW_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Split $\\dfrac{2x + 3}{(x + 1)^2}$.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "\\frac{A}{x+1} + \\frac{B}{(x+1)^2}", say: "A repeated factor: one fraction for $(x + 1)$ and one for $(x + 1)^2$." },
          { step: 2, m: "2x + 3 = A(x+1) + B", say: "Multiply through by $(x + 1)^2$." },
          { step: 3, m: "x = -1:\\ 1 = B", say: "Put in $x = -1$: the $A$ term disappears." },
          { step: 3, m: "x\\text{ terms: } 2 = A", say: "Compare the coefficients of $x$: $2x$ on the left, $Ax$ on the right.", ask: { prompt: "Why may we compare coefficients?", answer: 0, options: [{ t: "The two sides are equal for **every** $x$, so each power of $x$ must match" }, { t: "It is just a trick that works", fb: "Two polynomials that agree everywhere have the same coefficient on each power of $x$." }] } },
          { step: 3, m: "\\frac{2}{x+1} + \\frac{1}{(x+1)^2}", say: "Check at $x = 0$: $3 = 2 + 1$." }] },
        gate: true, then: "$\\dfrac{2}{x + 1} + \\dfrac{1}{(x + 1)^2}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you split $\\dfrac{x^2 + 3}{(x + 1)(x^2 + 1)}$.",
        how: HOW_12, skill: "Repeated and quadratic factors",
        steps: [
          { step: 1, ask: "$x^2 + 1$ will not factor, so its fraction is…", type: "choice", answer: 0, options: [{ t: "$\\dfrac{Bx + C}{x^2 + 1}$" }, { t: "$\\dfrac{B}{x^2 + 1}$", fb: "A quadratic denominator needs a **linear** top, $Bx + C$." }], m: "\\frac{A}{x+1} + \\frac{Bx+C}{x^2+1}", say: "The shape." },
          { step: 2, ask: "Multiplying both sides by $(x + 1)(x^2 + 1)$ gives…", type: "choice", answer: 0, options: [{ t: "$x^2 + 3 = A(x^2 + 1) + (Bx + C)(x + 1)$" }, { t: "$x^2 + 3 = A(x + 1) + (Bx + C)(x^2 + 1)$", fb: "Each fraction keeps the **other** denominator: $A$ keeps $x^2 + 1$, and $Bx + C$ keeps $x + 1$." }], m: "x^2+3 = A(x^2+1) + (Bx+C)(x+1)", say: "Denominators gone." },
          { step: 3, ask: "Put in $x = -1$: $4 = 2A$, so $A =$", type: "num", pre: "$A =$", answer: 2, near: [{ v: 4, fb: "$4 = 2A$: divide by 2." }], hint: "$4 \\div 2$.", m: "A = 2", say: "The $(x + 1)$ term vanished." },
          { step: 3, ask: "Compare $x^2$ terms: $1 = A + B$, so $B =$", type: "num", pre: "$B =$", answer: -1, near: [{ v: 1, fb: "$1 = 2 + B$ gives $B = 1 - 2$." }], hint: "$1 - 2$.", m: "B = -1", say: "From the $x^2$ coefficients." },
          { step: 3, ask: "Compare constants: $3 = A + C$, so $C =$", type: "num", pre: "$C =$", answer: 1, near: [{ v: 5, fb: "$3 = 2 + C$ gives $C = 3 - 2$." }], hint: "$3 - 2$.", m: "\\frac{2}{x+1} + \\frac{-x+1}{x^2+1}", say: "Check at $x = 0$: $3 = 2 + 1$." }],
        why: "Shape, clear, solve." },
      { type: "num", kicker: "On your own", prompt: "Split $\\dfrac{3x + 5}{(x + 1)^2} = \\dfrac{A}{x + 1} + \\dfrac{B}{(x + 1)^2}$. What is $B$?", pre: "$B =$", answer: 2, skill: "Repeated and quadratic factors", near: [{ v: 3, fb: "That is $A$ (the coefficient of $x$). For $B$ put in $x = -1$." }, { v: 5, fb: "Put in $x = -1$: $3(-1) + 5$." }], hints: ["$3x + 5 = A(x + 1) + B$; put in $x = -1$."], why: "$x = -1$: $2 = B$ (and $A = 3$)." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Three terms.** Split $\\dfrac{5x^2 - 3x + 6}{x(x - 1)^2}$.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "\\frac{A}{x}+\\frac{B}{x-1}+\\frac{C}{(x-1)^2}", say: "One fraction for $x$, and two for the repeated $(x - 1)^2$." },
          { step: 2, m: "5x^2-3x+6 = A(x-1)^2 + Bx(x-1) + Cx", say: "Multiply through by $x(x - 1)^2$." },
          { step: 3, m: "x = 0:\\ 6 = A", say: "The $B$ and $C$ terms vanish." },
          { step: 3, m: "x = 1:\\ 8 = C", say: "The $A$ and $B$ terms vanish.", ask: { prompt: "At $x = 1$ which terms vanish?", answer: 0, options: [{ t: "Those with a factor $(x - 1)$: the $A$ and $B$ terms" }, { t: "Only the $C$ term", fb: "$(x - 1) = 0$ at $x = 1$, so every term with that factor is zero." }] } },
          { step: 3, m: "x^2:\\ 5 = A + B", say: "Compare $x^2$ coefficients: $A + B = 5$, so $B = -1$." },
          { step: 3, m: "\\frac{6}{x} - \\frac{1}{x-1} + \\frac{8}{(x-1)^2}", say: "Check at $x = 2$: $10$ both ways." }] },
        gate: true, then: "$\\dfrac{6}{x} - \\dfrac{1}{x - 1} + \\dfrac{8}{(x - 1)^2}$." },
      { type: "num", kicker: "Try it", prompt: "Split $\\dfrac{x^2 + x + 3}{x(x^2 + 1)} = \\dfrac{A}{x} + \\dfrac{Bx + C}{x^2 + 1}$. What is $B$?", pre: "$B =$", answer: -2, skill: "Repeated and quadratic factors", near: [{ v: 2, fb: "Compare $x^2$ terms: $1 = A + B$ with $A = 3$, so $B = 1 - 3$." }, { v: 3, fb: "That is $A$ ($x = 0$: $3 = A$). Compare $x^2$ terms: $1 = A + B$." }], hints: ["$x^2 + x + 3 = A(x^2 + 1) + (Bx + C)x$."], why: "$A = 3$; $x^2$: $1 = 3 + B$, so $B = -2$ (and $C = 1$)." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kim splits $\\dfrac{2x + 3}{(x + 1)^2}$ as $\\dfrac{A}{x + 1} + \\dfrac{B}{x + 1}$. What is wrong?",
        options: [{ t: "A repeated factor needs $\\frac{B}{(x + 1)^2}$ as well; two fractions over $x + 1$ are really one" }, { t: "Nothing: both fractions are allowed", fb: "$\\frac{A}{x + 1} + \\frac{B}{x + 1} = \\frac{A + B}{x + 1}$: one unknown in disguise, which can never match." }, { t: "The denominators should be $x + 2$", fb: "The factor is $(x + 1)$, so the denominators use $x + 1$ and $(x + 1)^2$." }],
        answer: 0, skill: "Repeated and quadratic factors", hints: ["Add the two fractions."], why: "Use $\\frac{A}{x+1} + \\frac{B}{(x+1)^2}$." },
      { type: "num", kicker: "Use it", prompt: "Check the split from the harder case: work out $\\dfrac{6}{x} - \\dfrac{1}{x - 1} + \\dfrac{8}{(x - 1)^2}$ when $x = 2$.", pre: "value =", answer: 10, skill: "Repeated and quadratic factors", near: [{ v: 20, fb: "That is the numerator $5x^2 - 3x + 6$ at $x = 2$. Work out the three fractions: $3 - 1 + 8$." }, { v: 12, fb: "$3 - 1 + 8 = 10$: do not add the minus term." }], hints: ["$\\frac{6}{2} - \\frac{1}{1} + \\frac{8}{1}$."], why: "$3 - 1 + 8 = 10$, and $\\frac{20}{2 \\cdot 1} = 10$ too." }
    ]
  });
  /* ============================================ 13 · Matrices: describe, add and scale */
  var mcell = function (v, x, y, c) { return { text: String(v).replace(/-/g, "−"), at: [x, y], eq: true, c: c || "ink" }; };
  var mbrk = function (xl, xr, y0, y1) {
    return [[xl, 1], [xr, -1]].reduce(function (a, b) { return a.concat([{ seg: [[b[0], y0], [b[0], y1]], c: "ink" }, { seg: [[b[0], y0], [b[0] + 0.15 * b[1], y0]], c: "ink" }, { seg: [[b[0], y1], [b[0] + 0.15 * b[1], y1]], c: "ink" }]); }, []);
  };
  var HOW_13 = [["Size", "Rows × columns. To add or subtract, the sizes must be the **same**."],
                ["Entrywise", "Add, subtract or scale each entry in its own position."],
                ["Check", "Test one entry by hand."]];
  LESSONS.push({
    title: "Matrices: add, subtract and scale", art: "pcsys",
    blurb: "Book 9.5 · A matrix is a table of numbers. Add and scale it one entry at a time.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "In $\\pmat{2 & 5 \\\\ 7 & 1}$, what is the entry in **row 2, column 1**?", pre: "entry =", answer: 7, skill: "Reading a matrix", near: [{ v: 5, fb: "That is row 1, column 2. Row first, then column." }, { v: 1, fb: "That is row 2, column 2." }], hints: ["Go down to row 2, then across to column 1."], why: "Row 2 is $7\\ \\ 1$; its first entry is 7." },
      { type: "learn", kicker: "Explore",
        prompt: "Take $A = \\pmat{2 & 1 \\\\ 0 & 3}$ and $B = \\pmat{1 & -1 \\\\ 2 & 0}$. Slide $s$ and $t$ to make $sA + tB$ equal the target $\\pmat{3 & 3 \\\\ -2 & 6}$. Every cell turns green when its entry matches.",
        scene: { type: "sketch", x: [0, 5.6], y: [0, 5.6], u: 40, w: 272, grid: false, gate: true, pts: {},
          params: { s: { min: -3, max: 3, step: 1, v: 1, label: "$s$" }, t: { min: -3, max: 3, step: 1, v: 1, label: "$t$" } },
          draw: function (s) {
            var A = [[2, 1], [0, 3]], B = [[1, -1], [2, 0]], T = [[3, 3], [-2, 6]], it = [];
            [0, 1].forEach(function (r) { [0, 1].forEach(function (c) {
              var v = s.p.s * A[r][c] + s.p.t * B[r][c], ok = v === T[r][c], cx = 1.7 + 2.2 * c, cy = 4.1 - 2.2 * r;
              it.push({ poly: [[cx - 1, cy - 1], [cx + 1, cy - 1], [cx + 1, cy + 1], [cx - 1, cy + 1]], c: ok ? "green" : "blue", fill: true }, mcell(v, cx, cy, ok ? "green" : "ink"));
            }); });
            return it;
          },
          readout: function (s) { var A = [[2, 1], [0, 3]], B = [[1, -1], [2, 0]], R = [[0, 0], [0, 0]]; [0, 1].forEach(function (r) { [0, 1].forEach(function (c) { R[r][c] = s.p.s * A[r][c] + s.p.t * B[r][c]; }); }); return "$" + (s.p.s === 1 ? "" : s.p.s === -1 ? "-" : nm(s.p.s)) + "A " + (s.p.t < 0 ? "- " : "+ ") + (Math.abs(s.p.t) === 1 ? "" : Math.abs(s.p.t)) + "B = \\pmat{" + nm(R[0][0]) + " & " + nm(R[0][1]) + " \\\\ " + nm(R[1][0]) + " & " + nm(R[1][1]) + "}$"; },
          goal: function (s) { return s.p.s * 2 + s.p.t * 1 === 3 && s.p.s * 1 + s.p.t * -1 === 3 && s.p.s * 0 + s.p.t * 2 === -2 && s.p.s * 3 + s.p.t * 0 === 6; } },
        gate: true, then: "$s = 2$ and $t = -1$. Each entry of $sA + tB$ depends only on the **two entries in the same position**: the bottom-left entry $0s + 2t = -2$ gives $t = -1$ at once, and the bottom-right $3s = 6$ gives $s = 2$. Matrices add and scale **entry by entry**." },
      { type: "learn", kicker: "The idea",
        prompt: "A **matrix** is a table of numbers, described by its rows and columns: $m \\times n$ means $m$ rows and $n$ columns. To **add or subtract**, the sizes must be the same: combine entries in the same position. To **scale**, multiply every entry.",
        scene: { type: "method", how: HOW_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "With $C = \\pmat{3 & -1 & 2 \\\\ 0 & 4 & 1}$ and $D = \\pmat{1 & 2 & -1 \\\\ 5 & 0 & 3}$, find $3C - D$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "2\\times 3\\ \\text{and}\\ 2\\times 3", say: "Both matrices have 2 rows and 3 columns, so we may subtract." },
          { step: 2, m: "3C", say: "Scale first: multiply **every** entry of $C$ by 3.", fig: mat([[9, -3, 6], [0, 12, 3]], { bare: true }), ask: { prompt: "What is $3 \\times (-1)$?", answer: 0, options: [{ t: "$-3$" }, { t: "$3$", fb: "A positive times a negative is negative." }] } },
          { step: 2, m: "3C - D", say: "Subtract $D$ from it, one entry at a time: $9 - 1 = 8$, $-3 - 2 = -5$, $6 - (-1) = 7$ and so on.", fig: mat([[8, -5, 7], [-5, 12, 0]], { bare: true }) },
          { step: 3, m: "(2,1):\\ 0 - 5 = -5", say: "Check the entry in row 2, column 1 by hand.", ask: { prompt: "Can you add a $2 \\times 3$ matrix to a $3 \\times 2$ matrix?", answer: 0, options: [{ t: "No: the sizes differ, so entries do not line up" }, { t: "Yes: just add the entries", fb: "A $3 \\times 2$ matrix has no entry in some positions of a $2 \\times 3$." }] } }] },
        gate: true, then: "$3C - D = \\pmat{8 & -5 & 7 \\\\ -5 & 12 & 0}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $A + 2B$ for $A = \\pmat{1 & 2 \\\\ 3 & 4}$ and $B = \\pmat{0 & 1 \\\\ -1 & 2}$.",
        how: HOW_13, skill: "Matrix operations",
        steps: [
          { step: 1, ask: "Both are $2 \\times 2$. Can we add $A$ and $2B$?", type: "choice", answer: 0, options: [{ t: "Yes: same size" }, { t: "No: $2B$ has twice as many rows", fb: "Scaling by 2 changes the entries, not the size." }], m: "2\\times 2", say: "Same size." },
          { step: 2, ask: "The bottom-right entry of $2B$ is $2 \\times 2 =$", type: "num", pre: "entry =", answer: 4, near: [{ v: 2, fb: "That is the entry of $B$. Multiply by 2." }], hint: "$2 \\times 2$.", m: "2B = \\pmat{0 & 2 \\\\ -2 & 4}", say: "Every entry doubled." },
          { step: 2, ask: "The bottom-left entry of $A + 2B$ is $3 + 2(-1) =$", type: "num", pre: "entry =", answer: 1, near: [{ v: 5, fb: "$2(-1) = -2$: it takes away." }], hint: "$3 - 2$.", m: "(2,1):\\ 3 - 2 = 1", say: "Position by position." },
          { step: 3, ask: "The top-right entry is $2 + 2(1) =$", type: "num", pre: "entry =", answer: 4, near: [{ v: 3, fb: "$2B$ has $2 \\times 1 = 2$ there: $2 + 2$." }], hint: "$2 + 2$.", m: "A + 2B = \\pmat{1 & 4 \\\\ 1 & 8}", say: "Check the bottom-right: $4 + 4 = 8$." }],
        why: "Size, entrywise, check." },
      { type: "num", kicker: "On your own", prompt: "With $E = \\pmat{2 & 5 \\\\ 1 & 0}$ and $F = \\pmat{4 & -1 \\\\ 3 & 2}$, what is the **top-right** entry of $3E - F$?", pre: "entry =", answer: 16, skill: "Matrix operations", near: [{ v: 14, fb: "$3 \\times 5 = 15$, then subtract $F$'s entry $-1$: that **adds** 1." }, { v: 4, fb: "Scale $E$'s entry first: $3 \\times 5$." }], hints: ["$3(5) - (-1)$."], why: "$15 + 1 = 16$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A matrix equation.** Find the matrix $X$ with $2X + A = B$, where $A = \\pmat{1 & 3 \\\\ -2 & 0}$ and $B = \\pmat{5 & 3 \\\\ 0 & 4}$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "2X + A = B", say: "All three are $2 \\times 2$, so adding, subtracting and scaling make sense. Solve as in algebra." },
          { step: 2, m: "2X = B - A", say: "Subtract $A$ from both sides, entry by entry: $5 - 1$, $3 - 3$, $0 - (-2)$, $4 - 0$.", fig: mat([[4, 0], [2, 4]], { bare: true }) },
          { step: 2, m: "X = \\tfrac{1}{2}(B - A)", say: "Multiply every entry by $\\frac{1}{2}$.", fig: mat([[2, 0], [1, 2]], { bare: true }), ask: { prompt: "Why multiply every entry by $\\frac{1}{2}$?", answer: 0, options: [{ t: "To undo the factor 2 in $2X$" }, { t: "To make the matrix smaller", fb: "It undoes the 2 that multiplies $X$, just as dividing both sides would." }] } },
          { step: 3, m: "2(2) + 1 = 5", say: "Check the top-left entry of $2X + A$." },
          { step: 3, m: "2(1) + (-2) = 0", say: "And the bottom-left: both match $B$." }] },
        gate: true, then: "$X = \\pmat{2 & 0 \\\\ 1 & 2}$." },
      { type: "num", kicker: "Try it", prompt: "If $\\pmat{x & 2 \\\\ 3 & y} + \\pmat{4 & -1 \\\\ 0 & 5} = \\pmat{7 & 1 \\\\ 3 & 9}$, what is $y$?", pre: "$y =$", answer: 4, skill: "Matrix operations", near: [{ v: 3, fb: "That is $x$ ($x + 4 = 7$). For $y$: $y + 5 = 9$." }, { v: 14, fb: "$y + 5 = 9$: subtract 5." }], hints: ["Equal matrices have equal entries: $y + 5 = 9$."], why: "$y + 5 = 9$, so $y = 4$ (and $x = 3$)." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia adds $A$ ($2 \\times 3$) and $B$ ($3 \\times 2$) by adding matching entries. What is wrong?",
        options: [{ t: "The sizes differ: $A + B$ is not defined" }, { t: "Nothing: she can add whatever entries exist", fb: "Some positions in the $2 \\times 3$ matrix have no partner in the $3 \\times 2$ one." }, { t: "She should multiply instead", fb: "Multiplying matrices is a different operation with its own rule." }],
        answer: 0, skill: "Matrix operations", hints: ["Do the entries line up?"], why: "Add or subtract only matrices of the same size." },
      { type: "num", kicker: "Use it", prompt: "March sales (rows: store 1, store 2; columns: shirts, hats) are $\\pmat{20 & 15 \\\\ 12 & 8}$ and April sales are $\\pmat{30 & 10 \\\\ 15 & 9}$. How many **hats** did store 2 sell in the two months?", pre: "hats =", answer: 17, skill: "Matrix operations", near: [{ v: 25, fb: "That is store 1's hats ($15 + 10$). Store 2 is row 2." }, { v: 27, fb: "That is store 2's shirts. Hats are column 2." }], hints: ["Add the entries in row 2, column 2."], why: "$8 + 9 = 17$." }
    ]
  });

  /* ============================================ 14 · Matrix multiplication */
  var HOW_14 = [["Sizes", "The columns of $A$ must equal the rows of $B$."],
                ["Multiply", "Row of $A$ times column of $B$: multiply matching entries, add."],
                ["Fill in", "Do it for every cell of the answer."]];
  LESSONS.push({
    title: "Matrix multiplication", art: "pcsys",
    blurb: "Book 9.5 · Each entry of a product is a row of one matrix times a column of the other.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $2 \\cdot 5 + 3 \\cdot 4$.", pre: "value =", answer: 22, skill: "Multiply and add", near: [{ v: 14, fb: "$2 \\cdot 5 = 10$ and $3 \\cdot 4 = 12$: add those." }, { v: 120, fb: "Multiply within each pair, then **add** the two products." }], hints: ["$10 + 12$."], why: "$10 + 12 = 22$." },
      { type: "learn", kicker: "Explore",
        prompt: "Here $A = \\pmat{1 & 2 \\\\ 3 & 4}$ and $B = \\pmat{2 & 0 \\\\ 1 & 3}$. Choose a **row** $i$ of $A$ and a **column** $j$ of $B$. The readout multiplies them. Visit all four cells of $AB$.",
        scene: { type: "sketch", x: [0, 11], y: [0.4, 3.6], u: 32, w: 400, grid: false, gate: true, pts: {},
          params: { i: { min: 1, max: 2, step: 1, v: 1, label: "row $i$ of $A$" }, j: { min: 1, max: 2, step: 1, v: 1, label: "column $j$ of $B$" } },
          track: function (s) { return "c" + s.p.i + s.p.j; },
          draw: function (s) {
            var A = [[1, 2], [3, 4]], B = [[2, 0], [1, 3]], i = s.p.i - 1, j = s.p.j - 1, ys = [2.6, 1.4], axs = [1.0, 2.3], bxs = [4.8, 6.1], cxs = [8.6, 9.9], it = [];
            it.push({ poly: [[0.3, ys[i] - 0.5], [3.0, ys[i] - 0.5], [3.0, ys[i] + 0.5], [0.3, ys[i] + 0.5]], c: "blue", fill: true });
            it.push({ poly: [[bxs[j] - 0.6, 0.8], [bxs[j] + 0.6, 0.8], [bxs[j] + 0.6, 3.2], [bxs[j] - 0.6, 3.2]], c: "orange", fill: true });
            it.push({ poly: [[cxs[j] - 0.6, ys[i] - 0.5], [cxs[j] + 0.6, ys[i] - 0.5], [cxs[j] + 0.6, ys[i] + 0.5], [cxs[j] - 0.6, ys[i] + 0.5]], c: "green", fill: true });
            it = it.concat(mbrk(0.3, 3.0, 0.8, 3.2), mbrk(4.1, 6.8, 0.8, 3.2), mbrk(7.9, 10.6, 0.8, 3.2), [mcell("×", 3.55, 2.0), mcell("=", 7.35, 2.0)]);
            [0, 1].forEach(function (r) { [0, 1].forEach(function (c) {
              it.push(mcell(A[r][c], axs[c], ys[r], r === i ? "blue" : "ink"), mcell(B[r][c], bxs[c], ys[r], c === j ? "orange" : "ink"));
              var v = A[r][0] * B[0][c] + A[r][1] * B[1][c], now = r === i && c === j;
              it.push(mcell(now || (s.tracked || {})["c" + (r + 1) + (c + 1)] ? v : "?", cxs[c], ys[r], now ? "green" : "ink"));
            }); });
            return it;
          },
          readout: function (s) {
            var A = [[1, 2], [3, 4]], B = [[2, 0], [1, 3]], i = s.p.i - 1, j = s.p.j - 1, a = A[i], b = [B[0][j], B[1][j]];
            return "Row " + s.p.i + " of $A$ times column " + s.p.j + " of $B$: $" + a[0] + " \\cdot " + b[0] + " + " + a[1] + " \\cdot " + b[1] + " = " + (a[0] * b[0] + a[1] * b[1]) + "$";
          },
          goal: function (s) { return !!(s.tracked.c11 && s.tracked.c12 && s.tracked.c21 && s.tracked.c22); } },
        gate: true, then: "$AB = \\pmat{4 & 6 \\\\ 10 & 12}$. The entry in row $i$, column $j$ of $AB$ is **row $i$ of $A$ times column $j$ of $B$**: multiply matching entries, then add. That is why $A$ needs as many columns as $B$ has rows." },
      { type: "learn", kicker: "The idea",
        prompt: "$AB$ exists only when the **columns of $A$ equal the rows of $B$**; an $m \\times n$ times an $n \\times p$ gives $m \\times p$. Entry $(i, j)$ is **row $i$ of $A$ times column $j$ of $B$**. Unlike numbers, $AB$ and $BA$ are usually **different**.",
        scene: { type: "method", how: HOW_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "Multiply $A = \\pmat{1 & 0 & 2 \\\\ -1 & 3 & 1}$ by $B = \\pmat{3 & 1 \\\\ 2 & 1 \\\\ 1 & 0}$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "2\\times 3\\ \\text{times}\\ 3\\times 2", say: "The inner numbers match (3 and 3), so the product exists. The outer numbers give its size: $2 \\times 2$." },
          { step: 2, m: "1(3)+0(2)+2(1) = 5", say: "Row 1 of $A$ with column 1 of $B$.", ask: { prompt: "Row 1 of $A$ has 3 entries. Column 1 of $B$ has…", answer: 0, options: [{ t: "3 entries: they pair up one for one" }, { t: "2 entries", fb: "$B$ is $3 \\times 2$: each column has 3 entries, matching the 3 entries of a row of $A$." }] } },
          { step: 2, m: "1(1)+0(1)+2(0) = 1", say: "Row 1 with column 2." },
          { step: 2, m: "-1(3)+3(2)+1(1) = 4", say: "Row 2 with column 1." },
          { step: 2, m: "-1(1)+3(1)+1(0) = 2", say: "Row 2 with column 2." },
          { step: 3, m: "AB", say: "Fill in the four cells.", fig: mat([[5, 1], [4, 2]], { bare: true }) }] },
        gate: true, then: "$AB = \\pmat{5 & 1 \\\\ 4 & 2}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you multiply $C = \\pmat{2 & 1 \\\\ 0 & 3}$ by $D = \\pmat{1 & 4 \\\\ 2 & 0}$.",
        how: HOW_14, skill: "Matrix multiplication",
        steps: [
          { step: 1, ask: "$2 \\times 2$ times $2 \\times 2$ gives a matrix of size…", type: "choice", answer: 0, options: [{ t: "$2 \\times 2$" }, { t: "$4 \\times 4$", fb: "The product keeps the **outer** numbers: rows of the first, columns of the second." }], m: "2\\times 2", say: "Four cells to fill." },
          { step: 2, ask: "Entry $(1, 1)$: row 1 of $C$ with column 1 of $D$: $2 \\cdot 1 + 1 \\cdot 2 =$", type: "num", pre: "entry =", answer: 4, near: [{ v: 3, fb: "$2 \\cdot 1 = 2$ and $1 \\cdot 2 = 2$: add." }], hint: "$2 + 2$.", m: "(1,1):\\ 2+2 = 4", say: "Row times column." },
          { step: 2, ask: "Entry $(2, 1)$: row 2 of $C$ with column 1 of $D$: $0 \\cdot 1 + 3 \\cdot 2 =$", type: "num", pre: "entry =", answer: 6, near: [{ v: 5, fb: "$0 \\cdot 1 = 0$ and $3 \\cdot 2 = 6$." }], hint: "$0 + 6$.", m: "(2,1):\\ 0+6 = 6", say: "Row 2, column 1." },
          { step: 3, ask: "Entry $(1, 2)$: row 1 with column 2: $2 \\cdot 4 + 1 \\cdot 0 =$", type: "num", pre: "entry =", answer: 8, near: [{ v: 9, fb: "$1 \\cdot 0 = 0$." }], hint: "$8 + 0$.", m: "CD = \\pmat{4 & 8 \\\\ 6 & 0}", say: "Entry $(2, 2)$: $0 \\cdot 4 + 3 \\cdot 0 = 0$." }],
        why: "Sizes, multiply, fill in." },
      { type: "num", kicker: "On your own", prompt: "With $A = \\pmat{2 & -1 \\\\ 1 & 3}$ and $B = \\pmat{4 & 1 \\\\ 2 & 5}$, what is the entry in **row 1, column 2** of $AB$?", pre: "entry =", answer: -3, skill: "Matrix multiplication", near: [{ v: 7, fb: "Row 1 of $A$ is $2, -1$ and column 2 of $B$ is $1, 5$: $2 \\cdot 1 + (-1) \\cdot 5$." }, { v: 10, fb: "That is the entry in row 2, column 1. We want row 1, column 2." }], hints: ["$2 \\cdot 1 + (-1) \\cdot 5$."], why: "$2 - 5 = -3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Order matters.** With $A = \\pmat{1 & 2 \\\\ 0 & 1}$ and $B = \\pmat{1 & 0 \\\\ 3 & 1}$, find $AB$ and $BA$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "AB\\ \\text{and}\\ BA", say: "Both are $2 \\times 2$ times $2 \\times 2$, so both exist." },
          { step: 2, m: "AB", say: "Rows of $A$ times columns of $B$: $1(1)+2(3) = 7$, $1(0)+2(1) = 2$, $0(1)+1(3) = 3$, $0(0)+1(1) = 1$.", fig: mat([[7, 2], [3, 1]], { bare: true }) },
          { step: 2, m: "BA", say: "Now rows of $B$ times columns of $A$: $1(1)+0(0) = 1$, $1(2)+0(1) = 2$, $3(1)+1(0) = 3$, $3(2)+1(1) = 7$.", fig: mat([[1, 2], [3, 7]], { bare: true }), ask: { prompt: "Is $AB = BA$?", answer: 0, options: [{ t: "No: the top-left entries already differ" }, { t: "Yes, as with numbers", fb: "Compare: $AB$ has 7 at the top left and $BA$ has 1." }] } },
          { step: 3, m: "AB \\ne BA", say: "Order matters: matrix multiplication is **not commutative**." }] },
        gate: true, then: "$AB = \\pmat{7 & 2 \\\\ 3 & 1}$ but $BA = \\pmat{1 & 2 \\\\ 3 & 7}$." },
      { type: "num", kicker: "Try it", prompt: "$A$ is $3 \\times 2$ and $B$ is $2 \\times 4$. How many entries does $AB$ have?", pre: "entries =", answer: 12, skill: "Matrix multiplication", near: [{ v: 6, fb: "$AB$ is $3 \\times 4$: rows of $A$, columns of $B$." }, { v: 8, fb: "$AB$ is $3 \\times 4$ (outer numbers), so it has $3 \\times 4$ entries." }], hints: ["The product is $3 \\times 4$."], why: "$3 \\times 4 = 12$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee multiplies $\\pmat{1 & 2 \\\\ 3 & 4}$ by $\\pmat{5 & 6 \\\\ 7 & 8}$ **entry by entry** and gets $\\pmat{5 & 12 \\\\ 21 & 32}$. What is wrong?",
        options: [{ t: "A product uses **row times column**: the top-left is $1 \\cdot 5 + 2 \\cdot 7 = 19$" }, { t: "Nothing: that is how matrices multiply", fb: "That rule is for adding. Multiplying uses a row of one matrix with a column of the other." }, { t: "He should have added instead", fb: "The question asked for the product; it just uses row times column." }],
        answer: 0, skill: "Matrix multiplication", hints: ["Which entries multiply into the top-left cell?"], why: "The correct product is $\\pmat{19 & 22 \\\\ 43 & 50}$." },
      { type: "num", kicker: "Use it", prompt: "Apples cost $\\$3$ and pears $\\$2$. Basket 1 has 4 apples and 1 pear; basket 2 has 2 apples and 5 pears. Multiplying the price row $[3\\ \\ 2]$ by the table of baskets gives both costs. What does **basket 2** cost, in dollars?", pre: "cost =", post: "dollars", answer: 16, skill: "Matrix multiplication", near: [{ v: 14, fb: "That is basket 1: $3 \\cdot 4 + 2 \\cdot 1$. Basket 2 has 2 apples and 5 pears." }], hints: ["$3 \\cdot 2 + 2 \\cdot 5$."], why: "$6 + 10 = 16$." }
    ]
  });
  /* ============================================ 15 · Gaussian elimination, two unknowns */
  var HOW_15 = [["Write", "Turn the system into an **augmented matrix**."],
                ["Row-reduce", "Use row operations to put zeros below each leading entry."],
                ["Climb back", "Read the bottom row first, then work upwards."]];
  LESSONS.push({
    title: "Gaussian elimination", art: "pcsys",
    blurb: "Book 9.6 · Write a system as a matrix and use three row operations that never change its solution.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Row 2 is $[\\,3\\ \\ -1\\ \\ 7\\,]$ and row 1 is $[\\,1\\ \\ 2\\ \\ 7\\,]$. In $R_2 - 3R_1$, what is the new **middle** entry?", pre: "entry =", answer: -7, skill: "Row operations", near: [{ v: -1, fb: "That is the old entry. Subtract $3 \\times 2 = 6$ from it." }, { v: 5, fb: "$-1 - 3 \\cdot 2$: subtract 6, do not add it." }], hints: ["$-1 - 3(2)$."], why: "$-1 - 6 = -7$." },
      { type: "learn", kicker: "Explore",
        prompt: "The system is $x + 2y = 7$ and $3x - y = 7$, written as rows $[\\,1\\ \\ 2\\ |\\ 7\\,]$ and $[\\,3\\ \\ -1\\ |\\ 7\\,]$. Slide $m$ to replace row 2 by $R_2 - mR_1$. Find the $m$ that makes the **left entry zero**, and watch where the new line goes.",
        scene: { type: "sketch", x: [-2, 8], y: [-3, 7], u: 28, w: 328, gate: true, pts: {},
          params: { m: { min: 0, max: 5, step: 1, v: 0, label: "$m$" } },
          track: function (s) { return s.p.m === 3 ? "zero" : null; },
          draw: function (s) { var m = s.p.m, A = 3 - m, B = -1 - 2 * m, C = 7 - 7 * m; return curve(LN(-0.5, 3.5), -2, 8, "blue", [-3, 7]).concat(curve(LN(3, -7), -2, 8, "soft", [-3, 7]), curve(function (x) { return (C - A * x) / B; }, -2, 8, "orange", [-3, 7]), [dot(3, 2, "green", "(3, 2)", "ne")]); },
          readout: function (s) { var m = s.p.m, A = 3 - m, B = -1 - 2 * m, C = 7 - 7 * m; return "$\\amat{1 & 2 & 7 \\\\ " + nm(A) + " & " + nm(B) + " & " + nm(C) + "}$<br>" + (A === 0 ? "**$x$ has vanished**: row 2 says $" + nm(B) + "y = " + nm(C) + "$, so $y = " + nm(C / B) + "$" : "row 2 is the orange line: it still passes through $(3, 2)$"); },
          goal: function (s) { return !!s.tracked.zero; } },
        gate: true, then: "At $m = 3$ the new row is $[\\,0\\ \\ -7\\ |\\ -14\\,]$, the horizontal line $y = 2$. Every new row still passes through $(3, 2)$: **row operations never change the solution**. They only change how easy it is to read." },
      { type: "learn", kicker: "The idea",
        prompt: "Write the system as an **augmented matrix**. Then use the three **row operations**: swap two rows; multiply a row by a nonzero number; add a multiple of one row to another. Aim for zeros below each leading entry, then **back-substitute** from the bottom row up.",
        scene: { type: "method", how: HOW_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $x + 2y = 7$ and $3x - y = 7$ by Gaussian elimination.",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "\\text{augmented matrix}", say: "Coefficients on the left of the rule, constants on the right.", fig: mat([[1, 2, 7], [3, -1, 7]]) },
          { step: 2, m: "R_2 \\to R_2 - 3R_1", say: "Make the 3 under the leading 1 into a zero.", fig: mat([[1, 2, 7], [0, -7, -14]], { hot: 1 }) },
          { step: 2, m: "R_2 \\to -\\tfrac{1}{7}R_2", say: "Scale row 2 so its leading entry is 1.", fig: mat([[1, 2, 7], [0, 1, 2]], { hot: 1 }), ask: { prompt: "Why multiply row 2 by $-\\frac{1}{7}$?", answer: 0, options: [{ t: "To turn the $-7$ into a 1" }, { t: "To make the right side smaller", fb: "We want a leading 1 so the row reads $y = \\text{number}$." }] } },
          { step: 3, m: "y = 2", say: "Row 2 reads $0x + 1y = 2$." },
          { step: 3, m: "x + 2(2) = 7 \\ \\Rightarrow \\ x = 3", say: "Row 1 reads $x + 2y = 7$: put $y = 2$ in." }] },
        gate: true, then: "The solution is $(3, 2)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $2x + y = 5$ and $x - y = 1$.",
        how: HOW_15, skill: "Gaussian elimination",
        steps: [
          { step: 1, ask: "The augmented matrix is $[\\,2\\ \\ 1\\ |\\ 5\\,]$, $[\\,1\\ \\ -1\\ |\\ 1\\,]$. To get a 1 in the top-left we can…", type: "choice", answer: 0, options: [{ t: "swap the rows: $R_1 \\leftrightarrow R_2$" }, { t: "add the rows", fb: "That would give $3$ in the top-left, not 1." }], m: "R_1 \\leftrightarrow R_2", say: "Rows now $[\\,1\\ \\ -1\\ |\\ 1\\,]$ and $[\\,2\\ \\ 1\\ |\\ 5\\,]$." },
          { step: 2, ask: "$R_2 \\to R_2 - 2R_1$ gives $[\\,0\\ \\ 3\\ |\\ k\\,]$ with $k = 5 - 2(1) =$", type: "num", pre: "$k =$", answer: 3, near: [{ v: 7, fb: "$R_2 - 2R_1$: **subtract** $2 \\cdot 1$ from 5." }], hint: "$5 - 2$.", m: "[\\,0\\ \\ 3\\ |\\ 3\\,]", say: "The 2 became 0." },
          { step: 3, ask: "Row 2 says $3y = 3$, so $y =$", type: "num", pre: "$y =$", answer: 1, near: [{ v: 3, fb: "Divide both sides by 3." }], hint: "$3 \\div 3$.", m: "y = 1", say: "Bottom row first." },
          { step: 3, ask: "Row 1 says $x - y = 1$, so $x =$", type: "num", pre: "$x =$", answer: 2, near: [{ v: 0, fb: "$x - 1 = 1$: add 1." }], hint: "$1 + 1$.", m: "(2, 1)", say: "Check: $2(2) + 1 = 5$." }],
        why: "Write, row-reduce, climb back." },
      { type: "num", kicker: "On your own", prompt: "Solve $x + y = 5$ and $2x - y = 4$ by row-reducing. What is $x$?", pre: "$x =$", answer: 3, skill: "Gaussian elimination", near: [{ v: 2, fb: "That is $y$. Back-substitute: $x + 2 = 5$." }, { v: 9, fb: "$R_2 - 2R_1$ gives $-3y = -6$, so $y = 2$; then use $x + y = 5$." }], hints: ["$R_2 \\to R_2 - 2R_1$."], why: "$-3y = -6$, $y = 2$, so $x = 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**No leading 1.** Solve $2x + 3y = 8$ and $4x - y = 2$.",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "\\text{augmented matrix}", say: "The top-left entry is 2, not 1. That is fine: a row operation can still clear below it.", fig: mat([[2, 3, 8], [4, -1, 2]]) },
          { step: 2, m: "R_2 \\to R_2 - 2R_1", say: "Subtract **twice** row 1: $4 - 4 = 0$, $-1 - 6 = -7$, $2 - 16 = -14$.", fig: mat([[2, 3, 8], [0, -7, -14]], { hot: 1 }), ask: { prompt: "Why subtract $2R_1$ and not $4R_1$?", answer: 0, options: [{ t: "$2 \\times 2 = 4$ cancels the 4 below it" }, { t: "No reason", fb: "We pick the multiple that makes the entry below the pivot zero: $4 - 2 \\cdot 2 = 0$." }] } },
          { step: 3, m: "-7y = -14 \\ \\Rightarrow \\ y = 2", say: "Read the bottom row." },
          { step: 3, m: "2x + 3(2) = 8 \\ \\Rightarrow \\ x = 1", say: "Climb back: $2x = 2$." },
          { step: 3, m: "(1, 2)", say: "Check: $4(1) - 2 = 2$." }] },
        gate: true, then: "The solution is $(1, 2)$. A leading 1 is a convenience, not a requirement." },
      { type: "num", kicker: "Try it", prompt: "Row-reduce $x + 3y = 10$ and $2x + 5y = 18$. What is $y$?", pre: "$y =$", answer: 2, skill: "Gaussian elimination", near: [{ v: 4, fb: "That is $x$. $R_2 - 2R_1$ gives $-y = -2$." }, { v: -2, fb: "$-y = -2$: multiply both sides by $-1$." }], hints: ["$R_2 \\to R_2 - 2R_1$."], why: "$-y = -2$, so $y = 2$ (and $x = 4$)." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kay applies $R_2 \\to R_2 - 3R_1$ to the system $x + 2y = 7$, $3x - y = 7$. Tap the line where the work **first** goes wrong.",
        lines: ["\\amat{1 & 2 & 7 \\\\ 3 & -1 & 7}", "R_2 \\to R_2 - 3R_1", "\\amat{1 & 2 & 7 \\\\ 0 & -5 & -14}", "y = \\tfrac{14}{5}"], answer: 2, fix: "\\amat{1 & 2 & 7 \\\\ 0 & -7 & -14}",
        fb: { 0: GIVEN, 1: "That is the operation she meant to do.", 3: LATER }, skill: "Row operations",
        hints: ["Middle entry: $-1 - 3(2)$."], why: "$-1 - 6 = -7$, not $-5$." },
      { type: "num", kicker: "Use it", prompt: "3 coffees and 1 bagel cost $\\$11$; 1 coffee and 2 bagels cost $\\$7$. Swap the rows, row-reduce, and find the price of a **coffee**, in dollars.", pre: "coffee =", post: "dollars", answer: 3, skill: "Gaussian elimination", near: [{ v: 2, fb: "That is a bagel. $R_2 - 3R_1$ gives $-5y = -10$, then $x + 2y = 7$." }], hints: ["Rows $[\\,1\\ \\ 2\\ |\\ 7\\,]$ and $[\\,3\\ \\ 1\\ |\\ 11\\,]$."], why: "$-5y = -10$, $y = 2$ (bagel), $x = 7 - 4 = 3$." }
    ]
  });

  /* ============================================ 16 · Gaussian elimination, three unknowns */
  var HOW_16 = [["Column 1", "Make zeros below the first leading entry."],
                ["Column 2", "Make a zero below the second leading entry."],
                ["Climb back", "Solve the bottom row, then each row above."]];
  var M3 = function (rows, hot) { return mat(rows, { hot: hot }); };
  LESSONS.push({
    title: "Gaussian elimination: three unknowns", art: "pcsys",
    blurb: "Book 9.6 · Staircase form, and what a row of zeros or a row like $0 = 5$ tells you.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Row 1 is $[\\,1\\ \\ 1\\ \\ 1\\ |\\ 6\\,]$ and row 2 is $[\\,2\\ \\ -1\\ \\ 1\\ |\\ 3\\,]$. In $R_2 - 2R_1$, what is the new **last** entry?", pre: "entry =", answer: -9, skill: "Row operations", near: [{ v: -3, fb: "Subtract $2 \\cdot 6 = 12$ from 3." }, { v: 15, fb: "$3 - 12$: subtract, do not add." }], hints: ["$3 - 2(6)$."], why: "$3 - 12 = -9$." },
      { type: "learn", kicker: "Explore",
        prompt: "The augmented matrix of $x + y + z = 6$, $2x - y + z = 3$, $x + 2y - z = 2$ is shown. Slide $a$ and $b$ to apply $R_2 \\to R_2 - aR_1$ and $R_3 \\to R_3 - bR_1$. Make **both entries below the leading 1 zero**.",
        scene: { type: "sketch", x: [0, 7], y: [0, 5], u: 40, w: 328, grid: false, gate: true, pts: {},
          params: { a: { min: 0, max: 4, step: 1, v: 0, label: "$a$ (for $R_2$)" }, b: { min: 0, max: 4, step: 1, v: 0, label: "$b$ (for $R_3$)" } },
          draw: function (s) {
            var R1 = [1, 1, 1, 6], R2 = [2, -1, 1, 3], R3 = [1, 2, -1, 2], N2 = R2.map(function (v, k) { return v - s.p.a * R1[k]; }), N3 = R3.map(function (v, k) { return v - s.p.b * R1[k]; }), rows = [R1, N2, N3], it = [], xs = [1.0, 2.4, 3.8, 5.8], ys = [4.0, 2.5, 1.0];
            it = it.concat(mbrk(0.35, 6.6, 0.3, 4.7), [{ seg: [[4.8, 0.4], [4.8, 4.6]], c: "soft" }]);
            rows.forEach(function (r, i) { r.forEach(function (v, k) { var z = k === 0 && i > 0 && v === 0; if (z) it.push({ poly: [[xs[k] - 0.6, ys[i] - 0.5], [xs[k] + 0.6, ys[i] - 0.5], [xs[k] + 0.6, ys[i] + 0.5], [xs[k] - 0.6, ys[i] + 0.5]], c: "green", fill: true }); it.push(mcell(v, xs[k], ys[i], z ? "green" : i === 0 ? "ink" : "blue")); }); });
            return it;
          },
          readout: function (s) { var n2 = 2 - s.p.a, n3 = 1 - s.p.b; return "$R_2 \\to R_2 - " + s.p.a + "R_1$ makes the first entry $" + nm(n2) + "$ " + (n2 === 0 ? "✓" : "") + "<br>$R_3 \\to R_3 - " + s.p.b + "R_1$ makes it $" + nm(n3) + "$ " + (n3 === 0 ? "✓" : ""); },
          goal: function (s) { return s.p.a === 2 && s.p.b === 1; } },
        gate: true, then: "$a = 2$ and $b = 1$: the first column becomes $1, 0, 0$. The multiple to subtract is the entry you want to remove divided by the leading entry. Next, repeat in the **second** column, below its leading entry." },
      { type: "learn", kicker: "The idea",
        prompt: "Clear column 1, then column 2, to reach a **staircase** (row-echelon) form, then back-substitute. Special rows: $[\\,0\\ 0\\ 0\\ |\\ 0\\,]$ means that equation added nothing (**infinitely many** solutions); $[\\,0\\ 0\\ 0\\ |\\ 5\\,]$ means **no** solution.",
        scene: { type: "method", how: HOW_16 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $x + y + z = 6$, $2x - y + z = 3$ and $x + 2y - z = 2$.",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "R_2-2R_1,\\ R_3-R_1", say: "Make zeros below the first leading 1.", fig: M3([[1, 1, 1, 6], [0, -3, -1, -9], [0, 1, -2, -4]], 1) },
          { step: 2, m: "R_2 \\leftrightarrow R_3", say: "Swap so the next leading entry is a 1.", fig: M3([[1, 1, 1, 6], [0, 1, -2, -4], [0, -3, -1, -9]], 1), ask: { prompt: "Why swap the rows?", answer: 0, options: [{ t: "A 1 in the second position makes clearing below it easy" }, { t: "To change the solution", fb: "Row operations never change the solution. A swap only reorders the equations." }] } },
          { step: 2, m: "R_3 \\to R_3 + 3R_2", say: "Make the $-3$ below it zero.", fig: M3([[1, 1, 1, 6], [0, 1, -2, -4], [0, 0, -7, -21]], 2) },
          { step: 3, m: "-7z = -21 \\ \\Rightarrow \\ z = 3", say: "Bottom row first." },
          { step: 3, m: "y - 2(3) = -4 \\ \\Rightarrow \\ y = 2", say: "Row 2 reads $y - 2z = -4$." },
          { step: 3, m: "x + 2 + 3 = 6 \\ \\Rightarrow \\ x = 1", say: "Row 1 reads $x + y + z = 6$." }] },
        gate: true, then: "The solution is $(1, 2, 3)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $x + y + z = 6$, $2x + y - z = 2$ and $x - y + 2z = 7$.",
        how: HOW_16, skill: "Gaussian elimination, three unknowns",
        steps: [
          { step: 1, ask: "$R_2 \\to R_2 - 2R_1$ gives $[\\,0\\ \\ -1\\ \\ -3\\ |\\ k\\,]$ with $k = 2 - 2(6) =$", type: "num", pre: "$k =$", answer: -10, near: [{ v: 10, fb: "$2 - 12$ is negative." }], hint: "$2 - 12$.", m: "[\\,0\\ \\ -1\\ \\ -3\\ |\\ -10\\,]", say: "Row 3 is cleared by $R_3 - R_1$: $[\\,0\\ \\ -2\\ \\ 1\\ |\\ 1\\,]$." },
          { step: 2, ask: "Now $R_3 \\to R_3 - 2R_2$ gives $[\\,0\\ \\ 0\\ \\ 7\\ |\\ m\\,]$ with $m = 1 - 2(-10) =$", type: "num", pre: "$m =$", answer: 21, near: [{ v: -19, fb: "Subtracting $2 \\times (-10)$ **adds** 20." }], hint: "$1 + 20$.", m: "7z = 21", say: "Staircase form reached." },
          { step: 3, ask: "$7z = 21$, so $z =$", type: "num", pre: "$z =$", answer: 3, near: [{ v: 21, fb: "Divide by 7." }], hint: "$21 \\div 7$.", m: "z = 3", say: "Bottom row." },
          { step: 3, ask: "Row 2 reads $-y - 3z = -10$, so $y =$", type: "num", pre: "$y =$", answer: 1, near: [{ v: -1, fb: "$-y - 9 = -10$ gives $-y = -1$, so $y = 1$." }], hint: "$-y = -10 + 9$.", m: "(2, 1, 3)", say: "Row 1 then gives $x = 6 - 1 - 3 = 2$." }],
        why: "Column 1, column 2, climb back." },
      { type: "choice", kicker: "On your own", prompt: "Row-reduction ends with the bottom row $[\\,0\\ \\ 0\\ \\ 0\\ |\\ 5\\,]$. What does that mean?",
        options: [{ t: "There is no solution: it says $0 = 5$" }, { t: "There are infinitely many solutions", fb: "That is a bottom row of $[\\,0\\ 0\\ 0\\ |\\ 0\\,]$, which says $0 = 0$." }, { t: "$z = 5$", fb: "There is no $z$ in a row of zeros: the row says $0 = 5$." }],
        answer: 0, skill: "Special rows", hints: ["Read the row as an equation."], why: "$0x + 0y + 0z = 5$ is false." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A row of zeros.** Solve $x + y + z = 5$, $x - y + z = 1$ and $2x + 2z = 6$.",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "R_2-R_1,\\ R_3-2R_1", say: "Clear column 1.", fig: M3([[1, 1, 1, 5], [0, -2, 0, -4], [0, -2, 0, -4]], 1) },
          { step: 2, m: "R_3 \\to R_3 - R_2", say: "Rows 2 and 3 are identical, so row 3 becomes zero.", fig: M3([[1, 1, 1, 5], [0, -2, 0, -4], [0, 0, 0, 0]], 2), ask: { prompt: "A bottom row $[\\,0\\ 0\\ 0\\ |\\ 0\\,]$ means…", answer: 0, options: [{ t: "that equation added nothing: infinitely many solutions" }, { t: "no solution", fb: "No solution would be a row like $[\\,0\\ 0\\ 0\\ |\\ 5\\,]$, a false statement." }] } },
          { step: 3, m: "-2y = -4 \\ \\Rightarrow \\ y = 2", say: "Row 2 gives $y$." },
          { step: 3, m: "z = t,\\ x = 3 - t", say: "Row 1: $x + 2 + z = 5$. Let $z$ be any number $t$." },
          { step: 3, m: "(3 - t, 2, t)", say: "One solution for each $t$." }] },
        gate: true, then: "Infinitely many solutions: $(3 - t, 2, t)$." },
      { type: "num", kicker: "Try it", prompt: "A system reduces to $[\\,1\\ 1\\ 1\\ |\\ 3\\,]$, $[\\,0\\ 1\\ 2\\ |\\ 5\\,]$ and $[\\,0\\ 0\\ 0\\ |\\ k\\,]$. For which $k$ does it have solutions?", pre: "$k =$", answer: 0, skill: "Special rows", near: [{ v: 5, fb: "Read the last row: $0 = k$. It is only true for one $k$." }], hints: ["The bottom row says $0 = k$."], why: "$0 = k$ is true only when $k = 0$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben reduces a system and gets the bottom row $[\\,0\\ \\ 0\\ \\ 0\\ |\\ 7\\,]$. He writes \"so $z = 7$\". What is wrong?",
        options: [{ t: "The row says $0 = 7$: false, so there is **no solution**" }, { t: "Nothing: the last number is $z$", fb: "The last column holds constants. There is no $z$ here: all coefficients are 0." }, { t: "It means infinitely many solutions", fb: "That would be a row of all zeros, including the constant." }],
        answer: 0, skill: "Special rows", hints: ["Write the row as an equation."], why: "$0 = 7$ is never true." },
      { type: "num", kicker: "Use it", prompt: "A farm has $x$ hens, $y$ cows and $z$ pigs. Row-reduction gives $x + y + z = 12$, $y - z = 2$ and $z = 3$. How many **cows** are there?", pre: "cows =", answer: 5, skill: "Gaussian elimination, three unknowns", near: [{ v: 4, fb: "That is the number of hens. $y - 3 = 2$ gives $y = 5$." }, { v: 3, fb: "That is the pigs. For cows use $y - z = 2$." }], hints: ["Climb back: $y - 3 = 2$."], why: "$y = 5$, and $x = 12 - 5 - 3 = 4$." }
    ]
  });
  /* ============================================ 17 · Inverse matrices */
  var HOW_17 = [["Inverse", "For $\\pmat{a & b \\\\ c & d}$: swap $a$ and $d$, negate $b$ and $c$, divide by $ad - bc$."],
                ["Multiply", "Write the system as $AX = B$. Then $X = A^{-1}B$."],
                ["Check", "Put the answer back into the system."]];
  LESSONS.push({
    title: "Inverse matrices", art: "pcsys",
    blurb: "Book 9.7 · The inverse undoes a matrix, so $AX = B$ is solved by $X = A^{-1}B$.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $2 \\cdot 1 + 1 \\cdot (-1)$.", pre: "value =", answer: 1, skill: "Multiply and add", near: [{ v: 3, fb: "$1 \\cdot (-1) = -1$: it takes away." }, { v: -1, fb: "$2 \\cdot 1 = 2$, then add $-1$." }], hints: ["$2 - 1$."], why: "$2 - 1 = 1$." },
      { type: "learn", kicker: "Explore",
        prompt: "Take $A = \\pmat{2 & 1 \\\\ 1 & 1}$ and a candidate $C = \\pmat{1 & p \\\\ q & 2}$. Slide $p$ and $q$ until $AC$ is the **identity** $\\pmat{1 & 0 \\\\ 0 & 1}$: every cell of the product turns green.",
        scene: { type: "sketch", x: [0, 5.6], y: [0, 5.6], u: 40, w: 272, grid: false, gate: true, pts: {},
          params: { p: { min: -2, max: 2, step: 1, v: 0, label: "$p$" }, q: { min: -2, max: 2, step: 1, v: 0, label: "$q$" } },
          draw: function (s) {
            var p = s.p.p, q = s.p.q, P = [[2 + q, 2 * p + 2], [1 + q, p + 2]], I = [[1, 0], [0, 1]], it = [];
            [0, 1].forEach(function (r) { [0, 1].forEach(function (c) {
              var ok = P[r][c] === I[r][c], cx = 1.7 + 2.2 * c, cy = 4.1 - 2.2 * r;
              it.push({ poly: [[cx - 1, cy - 1], [cx + 1, cy - 1], [cx + 1, cy + 1], [cx - 1, cy + 1]], c: ok ? "green" : "blue", fill: true }, mcell(P[r][c], cx, cy, ok ? "green" : "ink"));
            }); });
            return it;
          },
          readout: function (s) { var p = s.p.p, q = s.p.q; return "$AC = \\pmat{" + nm(2 + q) + " & " + nm(2 * p + 2) + " \\\\ " + nm(1 + q) + " & " + nm(p + 2) + "}$ for $C = \\pmat{1 & " + nm(p) + " \\\\ " + nm(q) + " & 2}$"; },
          goal: function (s) { return 2 + s.p.q === 1 && 2 * s.p.p + 2 === 0 && 1 + s.p.q === 0 && s.p.p + 2 === 1; } },
        gate: true, then: "$p = -1$ and $q = -1$: $C = \\pmat{1 & -1 \\\\ -1 & 2}$ is the **inverse** $A^{-1}$, because $AC = I$. The formula agrees: swap $2$ and $1$, negate the $1$s, and divide by $ad - bc = 2 - 1 = 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **inverse** $A^{-1}$ satisfies $AA^{-1} = I$. For a $2 \\times 2$ matrix, swap $a$ and $d$, negate $b$ and $c$, and divide by $ad - bc$. If $ad - bc = 0$ there is **no inverse**. A system $AX = B$ then has $X = A^{-1}B$.",
        scene: { type: "method", how: HOW_17 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $2x + y = 7$ and $x + y = 4$ with an inverse matrix.",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "ad - bc = 2 - 1 = 1", say: "The matrix of coefficients is $A = \\pmat{2 & 1 \\\\ 1 & 1}$. Its determinant is not zero, so $A^{-1}$ exists." },
          { step: 1, m: "A^{-1} = \\pmat{1 & -1 \\\\ -1 & 2}", say: "Swap $2$ and $1$, negate the off-diagonal entries, divide by 1.", ask: { prompt: "If $ad - bc$ were $0$, we would…", answer: 0, options: [{ t: "have no inverse: we cannot divide by 0" }, { t: "divide by 1 instead", fb: "The determinant is what we divide by. A zero determinant means no inverse." }] } },
          { step: 2, m: "X = A^{-1}B", say: "Multiply both sides of $AX = B$ by $A^{-1}$ on the left." },
          { step: 2, m: "X = \\pmat{3 \\\\ 1}", say: "Row by column: $1(7) - 1(4) = 3$ and $-1(7) + 2(4) = 1$." },
          { step: 3, m: "2(3) + 1 = 7,\\ 3 + 1 = 4", say: "Check both equations." }] },
        gate: true, then: "The solution is $(3, 1)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $3x + 2y = 8$ and $x + y = 3$ with $A = \\pmat{3 & 2 \\\\ 1 & 1}$.",
        how: HOW_17, skill: "Inverse matrices",
        steps: [
          { step: 1, ask: "The determinant $ad - bc = 3(1) - 2(1) =$", type: "num", pre: "$ad - bc =$", answer: 1, near: [{ v: 5, fb: "It is $ad$ **minus** $bc$: $3 - 2$." }], hint: "$3 - 2$.", m: "ad - bc = 1", say: "Not zero." },
          { step: 1, ask: "Swap $3$ and $1$, negate $2$ and $1$. The inverse is…", type: "choice", answer: 0, options: [{ t: "$\\pmat{1 & -2 \\\\ -1 & 3}$" }, { t: "$\\pmat{1 & 2 \\\\ 1 & 3}$", fb: "The off-diagonal entries ($b$ and $c$) change **sign**." }, { t: "$\\pmat{3 & -2 \\\\ -1 & 1}$", fb: "The diagonal entries **swap places**: $a \\leftrightarrow d$." }], m: "A^{-1} = \\pmat{1 & -2 \\\\ -1 & 3}", say: "Divide by 1: nothing changes." },
          { step: 2, ask: "$X = A^{-1}\\pmat{8 \\\\ 3}$: the first entry is $1(8) - 2(3) =$", type: "num", pre: "$x =$", answer: 2, near: [{ v: 14, fb: "$-2 \\cdot 3 = -6$: it takes away." }], hint: "$8 - 6$.", m: "x = 2", say: "Row 1 times the column." },
          { step: 3, ask: "The second entry is $-1(8) + 3(3) =$", type: "num", pre: "$y =$", answer: 1, near: [{ v: -17, fb: "$-8 + 9$." }], hint: "$-8 + 9$.", m: "(2, 1)", say: "Check: $3(2) + 2(1) = 8$." }],
        why: "Inverse, multiply, check." },
      { type: "num", kicker: "On your own", prompt: "Solve $5x + 2y = 19$ and $2x + y = 8$, using $A^{-1} = \\pmat{1 & -2 \\\\ -2 & 5}$. What is $x$?", pre: "$x =$", answer: 3, skill: "Inverse matrices", near: [{ v: 2, fb: "That is $y$. For $x$: $1(19) - 2(8)$." }, { v: 35, fb: "$-2 \\cdot 8 = -16$: subtract it." }], hints: ["First entry of $A^{-1}B$: $1(19) - 2(8)$."], why: "$x = 19 - 16 = 3$, $y = -38 + 40 = 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A determinant other than 1.** Solve $2x + y = 5$ and $4x + 3y = 13$.",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "ad - bc = 6 - 4 = 2", say: "$A = \\pmat{2 & 1 \\\\ 4 & 3}$. The determinant is 2, not 0, so an inverse exists." },
          { step: 1, m: "A^{-1} = \\tfrac{1}{2}\\pmat{3 & -1 \\\\ -4 & 2}", say: "Swap, negate, then divide **every** entry by the determinant.", ask: { prompt: "Why is there a $\\frac{1}{2}$ in front?", answer: 0, options: [{ t: "We divide by the determinant, which is 2" }, { t: "It is always $\\frac{1}{2}$", fb: "It is $\\frac{1}{ad - bc}$: here the determinant is 2." }] } },
          { step: 2, m: "X = \\tfrac{1}{2}\\pmat{2 \\\\ 6}", say: "Row by column: $3(5) - 1(13) = 2$ and $-4(5) + 2(13) = 6$." },
          { step: 2, m: "X = \\pmat{1 \\\\ 3}", say: "Halve each entry." },
          { step: 3, m: "2(1) + 3 = 5,\\ 4 + 9 = 13", say: "Check both equations." }] },
        gate: true, then: "The solution is $(1, 3)$." },
      { type: "num", kicker: "Try it", prompt: "For which value of $k$ does $\\pmat{k & 4 \\\\ 2 & 8}$ have **no inverse**?", pre: "$k =$", answer: 1, skill: "Inverse matrices", near: [{ v: 4, fb: "Set $ad - bc = 0$: $8k - 4 \\cdot 2 = 0$." }, { v: 0, fb: "Set the determinant to zero: $8k - 8 = 0$." }], hints: ["$ad - bc = 8k - 8$."], why: "$8k - 8 = 0$, so $k = 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee says the inverse of $\\pmat{2 & 1 \\\\ 1 & 1}$ is found by inverting each entry: $\\pmat{\\frac{1}{2} & 1 \\\\ 1 & 1}$. What is wrong?",
        options: [{ t: "Check: that matrix times $A$ is not $I$. The inverse uses the swap-and-negate rule" }, { t: "Nothing: that is the inverse", fb: "Multiply it by $A$: the top-left entry is $\\frac{1}{2} \\cdot 2 + 1 \\cdot 1 = 2$, not 1." }, { t: "It should be the negative of $A$", fb: "$-A$ is not an inverse either. $A \\cdot (-A) = -A^2$." }],
        answer: 0, skill: "Inverse matrices", hints: ["Test: does $AC = I$?"], why: "The inverse is $\\pmat{1 & -1 \\\\ -1 & 2}$." },
      { type: "num", kicker: "Use it", prompt: "Adults count 2 points and children 1 point: $2x + y = 140$ points. There are $x + y = 90$ people. Use $A^{-1} = \\pmat{1 & -1 \\\\ -1 & 2}$ to find the number of **children** $y$.", pre: "$y =$", answer: 40, skill: "Inverse matrices", near: [{ v: 50, fb: "That is $x$ (the adults). The second entry of $A^{-1}B$ is $y$." }], hints: ["Second entry: $-1(140) + 2(90)$."], why: "$y = -140 + 180 = 40$ (and $x = 50$)." }
    ]
  });

  /* ============================================ 18 · Determinants and Cramer's rule */
  var HOW_18 = [["Find D", "The determinant of the matrix of coefficients. If $D = 0$, stop."],
                ["Swap column", "Replace one column by the constants: $D_x$, $D_y$."],
                ["Divide", "$x = \\frac{D_x}{D}$ and $y = \\frac{D_y}{D}$."]];
  var HOW_DET = [["Pick a row", "Use the top row with signs plus, minus, plus."],
                 ["Cross out", "Each entry times the $2 \\times 2$ determinant that is left."],
                 ["Add up", "Add the three terms."]];
  LESSONS.push({
    title: "Determinants and Cramer's rule", art: "pcsys",
    blurb: "Book 9.8 · A determinant measures area; dividing two of them solves a system.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $3 \\cdot 4 - 2 \\cdot 5$.", pre: "value =", answer: 2, skill: "Determinants", near: [{ v: 22, fb: "It is a **difference** of the two products: $12 - 10$." }, { v: -2, fb: "$12 - 10$: the first product is bigger." }], hints: ["$12 - 10$."], why: "$12 - 10 = 2$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue arrow is $(2, 1)$. Slide the orange arrow $(p, q)$. The green **parallelogram** they span has area $|2q - p|$, the absolute value of the **determinant**. Find an orange arrow that makes the parallelogram **flat**, and one with area **6**.",
        scene: { type: "sketch", x: [-5, 6], y: [-5, 6], u: 24, w: 312, gate: true, pts: {},
          params: { p: { min: -4, max: 4, step: 1, v: 0, label: "$p$" }, q: { min: -4, max: 4, step: 1, v: 1, label: "$q$" } },
          track: function (s) { var d = 2 * s.p.q - s.p.p; return d === 0 && (s.p.p !== 0 || s.p.q !== 0) ? "flat" : Math.abs(d) === 6 ? "six" : null; },
          draw: function (s) { var p = s.p.p, q = s.p.q; return [{ poly: [[0, 0], [2, 1], [2 + p, 1 + q], [p, q]], c: "green", fill: true }, { arrow: [[0, 0], [2, 1]], c: "blue" }, { arrow: [[0, 0], [p, q]], c: "orange" }]; },
          readout: function (s) { var p = s.p.p, q = s.p.q, d = 2 * q - p; return "$\\vmat{2 & " + nm(p) + " \\\\ 1 & " + nm(q) + "} = 2 \\cdot " + (q < 0 ? "(" + nm(q) + ")" : nm(q)) + " - " + (p < 0 ? "(" + nm(p) + ")" : nm(p)) + " \\cdot 1 = " + nm(d) + "$ · area " + Math.abs(d) + "<br>Flat: " + (s.tracked.flat ? "✓" : "—") + " · area 6: " + (s.tracked.six ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.flat && s.tracked.six); } },
        gate: true, then: "The determinant $ad - bc$ is the signed **area** of the parallelogram. It is $0$ when the arrows point along the same line, such as $(4, 2)$ or $(-2, -1)$. A flat parallelogram means the matrix **squashes** everything onto a line, so it has no inverse and the system has no unique solution." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\vmat{a & b \\\\ c & d} = ad - bc$. **Cramer's rule:** with $D$ the determinant of the coefficients, replace the $x$ column by the constants to get $D_x$, the $y$ column to get $D_y$. Then $x = \\frac{D_x}{D}$ and $y = \\frac{D_y}{D}$, provided $D \\ne 0$.",
        scene: { type: "method", how: HOW_18 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $3x + 2y = 12$ and $x - y = -1$ with Cramer's rule.",
        scene: { type: "walk", how: HOW_18, rows: [
          { step: 1, m: "D = 3(-1) - 2(1) = -5", say: "The determinant of the coefficients $\\pmat{3 & 2 \\\\ 1 & -1}$. It is not zero, so Cramer's rule works." },
          { step: 2, m: "D_x = 12(-1) - 2(-1) = -10", say: "Replace the $x$ column by the constants $12, -1$." },
          { step: 2, m: "D_y = 3(-1) - 12(1) = -15", say: "Replace the $y$ column by the constants.", ask: { prompt: "In $D_y$, which column is replaced?", answer: 0, options: [{ t: "The second column, the $y$ column" }, { t: "The first column", fb: "$D_y$ replaces the column of $y$ coefficients, which is the second." }] } },
          { step: 3, m: "x = \\frac{-10}{-5} = 2", say: "Divide by $D$." },
          { step: 3, m: "y = \\frac{-15}{-5} = 3", say: "Check: $3(2) + 2(3) = 12$ and $2 - 3 = -1$." }] },
        gate: true, then: "The solution is $(2, 3)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $4x + 3y = 10$ and $x + 2y = 5$.",
        how: HOW_18, skill: "Cramer's rule",
        steps: [
          { step: 1, ask: "$D = 4(2) - 3(1) =$", type: "num", pre: "$D =$", answer: 5, near: [{ v: 11, fb: "It is $ad - bc$: $8 - 3$." }], hint: "$8 - 3$.", m: "D = 5", say: "Not zero." },
          { step: 2, ask: "Replace the $x$ column by $10, 5$: $D_x = 10(2) - 3(5) =$", type: "num", pre: "$D_x =$", answer: 5, near: [{ v: 35, fb: "$3 \\cdot 5 = 15$: subtract it." }], hint: "$20 - 15$.", m: "D_x = 5", say: "So $x = 1$." },
          { step: 2, ask: "Replace the $y$ column by $10, 5$: $D_y = 4(5) - 10(1) =$", type: "num", pre: "$D_y =$", answer: 10, near: [{ v: 30, fb: "$10 \\cdot 1 = 10$: subtract it." }], hint: "$20 - 10$.", m: "D_y = 10", say: "Now divide." },
          { step: 3, ask: "$y = \\dfrac{D_y}{D} =$", type: "num", pre: "$y =$", answer: 2, near: [{ v: 0.5, tol: 0.001, fb: "It is $D_y$ over $D$: $10 \\div 5$." }], hint: "$10 \\div 5$.", m: "(1, 2)", say: "Check: $4 + 6 = 10$ and $1 + 4 = 5$." }],
        why: "Find $D$, swap a column, divide." },
      { type: "num", kicker: "On your own", prompt: "Solve $5x + 2y = 16$ and $3x + y = 9$ with Cramer's rule. What is $x$?", pre: "$x =$", answer: 2, skill: "Cramer's rule", near: [{ v: 3, fb: "That is $y$. For $x$: $D_x = 16(1) - 2(9) = -2$ and $D = 5 - 6 = -1$." }, { v: -2, fb: "That is $D_x$. Divide by $D = -1$." }], hints: ["$D = 5(1) - 2(3)$."], why: "$D = -1$, $D_x = -2$, so $x = 2$ (and $y = 3$)." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A 3 × 3 determinant.** Find the determinant of $\\vmat{1 & 2 & 3 \\\\ 0 & 1 & 4 \\\\ 5 & 6 & 0}$.",
        scene: { type: "walk", how: HOW_DET, rows: [
          { step: 1, m: "\\text{expand along row 1}", say: "Use the entries of the top row with signs $+\\ -\\ +$.", fig: mat([[1, 2, 3], [0, 1, 4], [5, 6, 0]], { det: true }) },
          { step: 2, m: "+1(1\\cdot 0 - 4\\cdot 6) = -24", say: "The entry 1, times the $2 \\times 2$ determinant left when its row and column are crossed out." },
          { step: 2, m: "-2(0\\cdot 0 - 4\\cdot 5) = 40", say: "The entry 2, with a **minus** sign.", ask: { prompt: "Why a minus sign for the middle term?", answer: 0, options: [{ t: "The signs alternate: $+\\ -\\ +$" }, { t: "Because 2 is even", fb: "The signs alternate by position, whatever the entry is." }] } },
          { step: 2, m: "+3(0\\cdot 6 - 1\\cdot 5) = -15", say: "The entry 3, with a plus sign." },
          { step: 3, m: "-24 + 40 - 15 = 1", say: "Add the three terms." }] },
        gate: true, then: "The determinant is $1$." },
      { type: "num", kicker: "Try it", prompt: "Find the determinant of $\\vmat{2 & -1 \\\\ 3 & 4}$.", pre: "$D =$", answer: 11, skill: "Determinants", near: [{ v: 5, fb: "$bc = (-1)(3) = -3$, and subtracting $-3$ adds 3." }, { v: 8, fb: "$ad - bc = 8 - (-3)$." }], hints: ["$ad - bc = 2 \\cdot 4 - (-1)(3)$."], why: "$8 + 3 = 11$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Rin solves $3x + 2y = 12$, $x - y = -1$ with Cramer's rule. Tap the line where the work **first** goes wrong.",
        lines: ["D = 3(-1) - 2(1) = -5", "D_x = 12(-1) + 2(-1) = -14", "x = \\frac{-14}{-5}"], answer: 1, fix: "D_x = 12(-1) - 2(-1) = -10",
        fb: { 0: "$3(-1) - 2(1) = -5$ is correct.", 2: LATER }, skill: "Cramer's rule",
        hints: ["It is $ad - bc$: a minus."], why: "$12(-1) - 2(-1) = -12 + 2 = -10$." },
      { type: "num", kicker: "Use it", prompt: "For which value of $k$ do $2x + ky = 3$ and $x + 3y = 1$ fail to have a unique solution?", pre: "$k =$", answer: 6, skill: "Cramer's rule", near: [{ v: 1.5, tol: 0.001, fb: "Set $D = 0$: $2(3) - k(1) = 0$." }, { v: 3, fb: "Set $D = 0$: $2(3) - k(1) = 0$, so $k = 6$." }], hints: ["$D = 2 \\cdot 3 - k \\cdot 1$."], why: "$D = 6 - k = 0$ gives $k = 6$." }
    ]
  });
  /* ================================================================ Skills */
  // a linear combination in plain minus signs: LCF([2, -3], ["x", "y"]) is "2x - 3y".
  var LCF = function (cs, vs) {
    var s = "";
    cs.forEach(function (c, i) {
      if (c === 0) return;
      var a = Math.abs(c), body = (a === 1 ? "" : String(a)) + vs[i];
      s += s === "" ? (c < 0 ? "-" : "") + body : (c < 0 ? " - " : " + ") + body;
    });
    return s || "0";
  };
  var EQN = function (cs, vs, k) { return LCF(cs, vs) + " = " + k; };
  // a quadratic in x from [c2, c1, c0]
  var POLY = function (cs) {
    var s = "";
    [[cs[0], "x^2"], [cs[1], "x"], [cs[2], ""]].forEach(function (t) {
      var c = t[0], v = t[1];
      if (c === 0) return;
      var a = Math.abs(c), body = (a === 1 && v !== "" ? "" : String(a)) + v;
      s += s === "" ? (c < 0 ? "-" : "") + body : (c < 0 ? " - " : " + ") + body;
    });
    return s || "0";
  };
  var PMT = function (rows) { return "\\pmat{" + rows.map(function (r) { return r.join(" & "); }).join(" \\\\ ") + "}"; };
  var VMT = function (rows) { return "\\vmat{" + rows.map(function (r) { return r.join(" & "); }).join(" \\\\ ") + "}"; };
  var DET2 = function (a, b, c, d) { return a * d - b * c; };
  var DET3 = function (m) { return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); };
  var MUL = function (A, B) { return A.map(function (r) { return B[0].map(function (_, j) { return r.reduce(function (s, v, k) { return s + v * B[k][j]; }, 0); }); }); };
  var FX = function (a) { return a === 0 ? "x" : "(x " + (a < 0 ? "+ " + (-a) : "- " + a) + ")"; };
  // a random matrix with entries lo..hi
  var RMAT = function (R, r, c, lo, hi) { var M = [], i, j; for (i = 0; i < r; i++) { M.push([]); for (j = 0; j < c; j++) M[i].push(R.int(lo, hi)); } return M; };
  // 2 x 2 matrices of determinant 1 or -1 with no zero entry, for inverses with whole entries
  var UNI = (function () { var out = [], a, b, c, d; for (a = -3; a <= 4; a++) for (b = -3; b <= 4; b++) for (c = -3; c <= 4; c++) for (d = -3; d <= 4; d++) if (Math.abs(a * d - b * c) === 1 && a !== 0 && d !== 0 && b !== 0 && c !== 0) out.push([[a, b], [c, d]]); return out; })();
  var STRICT = function (R) { return R.pick(["<", "\\le", ">", "\\ge"]); };
  var HOLDS = function (l, op, r) { return op === "<" ? l < r : op === ">" ? l > r : op === "\\le" ? l <= r : l >= r; };
  // the verdict on a point and two conditions, as a choice
  var VERDICT = function (R, prompt, ok1, ok2, hints, why) {
    var right = ok1 && ok2 ? "Yes: it satisfies both" : ok1 ? "No: it fails only the second" : ok2 ? "No: it fails only the first" : "No: it fails both";
    var all = ["Yes: it satisfies both", "No: it fails only the first", "No: it fails only the second", "No: it fails both"];
    return mc(R, { prompt: prompt, right: right, wrong: all.filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: "Substitute the point into **each** condition on its own and compare the two sides." }; }), keep: true, hints: hints, why: why });
  };
  var SKILLS = [
    { id: "pc9-graph", title: "Where two lines meet", lesson: 2,
      gen: function (R) {
        var x0 = R.int(-5, 5), y0 = R.int(-5, 5), m1 = R.nz(-3, 3), m2, t = R.int(0, 2);
        do { m2 = R.nz(-3, 3); } while (m2 === m1);
        var b1 = y0 - m1 * x0, b2 = y0 - m2 * x0, e1 = "y = " + LINT(m1, b1), e2 = "y = " + LINT(m2, b2);
        if (t <= 1) {
          var X = t === 0, ans = X ? x0 : y0, other = X ? y0 : x0;
          return { type: "num", prompt: "The lines $" + e1 + "$ and $" + e2 + "$ meet at one point. What is its $" + (X ? "x" : "y") + "$-coordinate?", pre: "$" + (X ? "x" : "y") + " =$", answer: ans,
            near: near(ans, [{ v: other, fb: "That is the " + (X ? "$y$" : "$x$") + "-coordinate of the point." }]), hints: ["At the meeting point both lines have the same height: set the two expressions for $y$ equal."], why: "$" + LINT(m1, b1) + " = " + LINT(m2, b2) + "$ gives $x = " + x0 + "$, and then $y = " + y0 + "$." };
        }
        var d = R.nz(-3, 3), kind = R.int(0, 3), p, q;
        if (kind === 0) { p = x0; q = y0; }
        else if (kind === 1) { p = x0 + d; q = m1 * p + b1; }
        else if (kind === 2) { p = x0 + d; q = m2 * p + b2; }
        else { p = x0 + d; q = y0 + R.nz(-3, 3); }
        return VERDICT(R, "Does the point $(" + p + ", " + q + ")$ satisfy the system $" + e1 + "$ and $" + e2 + "$?", q === m1 * p + b1, q === m2 * p + b2, ["Put $x = " + p + "$ into each equation and compare with $y = " + q + "$."], "The point is on a line only if putting in $x$ gives $y$.");
      } },
    { id: "pc9-sub", title: "Substitution", lesson: 3,
      gen: function (R) {
        var x0 = R.int(-4, 5), y0 = R.int(-4, 5), m = R.pick([-3, -2, -1, 1, 2, 3]), A, B;
        do { A = R.nz(-4, 4); B = R.nz(-4, 4); } while (A + B * m === 0);
        var b = y0 - m * x0, C = A * x0 + B * y0, X = R.chance(0.5), ans = X ? x0 : y0, slip = (C + B * b) / (A + B * m);
        return { type: "num", prompt: "Solve $y = " + LINT(m, b) + "$ and $" + EQN([A, B], ["x", "y"], C) + "$ by substitution. What is $" + (X ? "x" : "y") + "$?", pre: "$" + (X ? "x" : "y") + " =$", answer: ans,
          near: near(ans, [{ v: X ? y0 : x0, fb: "That is the other unknown. Find $x$ first, then use $y = " + LINT(m, b) + "$." }].concat(X && b !== 0 ? [{ v: slip, tol: 0.001, fb: "Check the sign of the constant when you move it across." }] : [])),
          hints: ["Replace $y$ in the second equation by the expression from the first, and solve for $x$."], why: "$x = " + x0 + "$ and $y = " + y0 + "$." };
      } },
    { id: "pc9-elim", title: "Elimination", lesson: 4,
      gen: function (R) {
        var x0 = R.int(-5, 5), y0 = R.int(-5, 5), a1, b1, a2, b2;
        do { a1 = R.nz(-4, 4); b1 = R.nz(-4, 4); a2 = R.nz(-4, 4); b2 = R.nz(-4, 4); } while (DET2(a1, b1, a2, b2) === 0);
        var X = R.chance(0.5), ans = X ? x0 : y0;
        return { type: "num", prompt: "Solve $" + EQN([a1, b1], ["x", "y"], a1 * x0 + b1 * y0) + "$ and $" + EQN([a2, b2], ["x", "y"], a2 * x0 + b2 * y0) + "$ by elimination. What is $" + (X ? "x" : "y") + "$?", pre: "$" + (X ? "x" : "y") + " =$", answer: ans,
          near: near(ans, [{ v: X ? y0 : x0, fb: "That is the other unknown. Check which variable the question asks for." }, { v: x0 + y0, fb: "That is $x + y$. Give the one unknown asked for." }]),
          hints: ["Multiply the equations so one variable has opposite coefficients, then add."], why: "$x = " + x0 + "$ and $y = " + y0 + "$." };
      } },
    { id: "pc9-special", title: "No solution or infinitely many", lesson: 5,
      gen: function (R) {
        var t = R.int(0, 3), a = R.nz(-4, 4), b = R.nz(-4, 4), c = R.nz(-8, 8), k = R.pick([-3, -2, 2, 3]);
        if (t === 3) return { type: "num", prompt: "For which value of $K$ do $" + EQN([a, b], ["x", "y"], c) + "$ and $" + EQN([k * a, k * b], ["x", "y"], "K") + "$ have infinitely many solutions?", pre: "$K =$", answer: k * c,
          near: near(k * c, [{ v: c, fb: "The second equation is $" + k + "$ times the first, so its right side must be too." }]), hints: ["The second equation must be a multiple of the first."], why: "$K = " + k + " \\cdot " + c + " = " + k * c + "$." };
        var e1 = EQN([a, b], ["x", "y"], c), e2, right;
        if (t === 0) { var a2, b2; do { a2 = R.nz(-4, 4); b2 = R.nz(-4, 4); } while (DET2(a, b, a2, b2) === 0); e2 = EQN([a2, b2], ["x", "y"], R.int(-8, 8)); right = "Exactly one solution"; }
        else if (t === 1) { var e = R.nz(-5, 5); e2 = EQN([k * a, k * b], ["x", "y"], k * c + e); right = "No solution"; }
        else { e2 = EQN([k * a, k * b], ["x", "y"], k * c); right = "Infinitely many solutions"; }
        var all = ["No solution", "Exactly one solution", "Infinitely many solutions"];
        return mc(R, { prompt: "How many solutions does the system $" + e1 + "$ and $" + e2 + "$ have?", right: right, wrong: all.filter(function (x) { return x !== right; }).map(function (x) { return { t: x, fb: "Try to eliminate a variable: look at what is left, a value, $0 = 0$ or a false statement." }; }), keep: true, hints: ["Eliminate one variable and see what remains."], why: right + "." });
      } },
    { id: "pc9-story", title: "Systems from stories", lesson: 6,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 2) {
          var x0 = R.int(20, 200), v = R.int(2, 15), r = v + R.int(3, 15), F = x0 * (r - v);
          return { type: "num", prompt: "Making each item costs $\\$" + v + "$, and there is a fixed cost of $\\$" + F + "$. Each item sells for $\\$" + r + "$. How many items must be sold to break even?", pre: "items =", answer: x0,
            near: near(x0, [{ v: F / r, tol: 0.001, fb: "Each item also costs $\\$" + v + "$ to make. Set $" + F + " + " + v + "x = " + r + "x$." }]), hints: ["Cost equals income: the fixed cost plus the cost per item times $x$, against the price times $x$."], why: "$" + F + " = " + (r - v) + "x$, so $x = " + x0 + "$." };
        }
        var p1 = R.int(6, 12), p2 = R.int(2, p1 - 2), n = R.int(40, 120), a = R.int(10, n - 10), I = p1 * a + p2 * (n - a), adult = t === 0;
        return { type: "num", prompt: "A show sells $" + n + "$ tickets: adult tickets cost $\\$" + p1 + "$ and child tickets $\\$" + p2 + "$. The takings are $\\$" + I + "$. How many " + (adult ? "adult" : "child") + " tickets were sold?", pre: "tickets =", answer: adult ? a : n - a,
          near: near(adult ? a : n - a, [{ v: adult ? n - a : a, fb: "That is the other kind of ticket." }]), hints: ["Two facts: the tickets add to $" + n + "$, and the money adds to $\\$" + I + "$."], why: "$" + p1 + "x + " + p2 + "(" + n + " - x) = " + I + "$ gives $x = " + a + "$ adult and $" + (n - a) + "$ child." };
      } },
    { id: "pc9-three", title: "Three equations, three unknowns", lesson: 7,
      gen: function (R) {
        var x0 = R.int(-3, 5), y0 = R.int(-3, 5), z0 = R.int(-3, 5), M, ok;
        do { M = RMAT(R, 3, 3, -2, 2); ok = DET3(M) !== 0 && M.every(function (r) { return r.some(function (v) { return v !== 0; }); }); } while (!ok);
        var vars = ["x", "y", "z"], sol = [x0, y0, z0], eqs = M.map(function (r) { return "$" + EQN(r, vars, r[0] * x0 + r[1] * y0 + r[2] * z0) + "$"; }), ix = R.int(0, 2);
        return { type: "num", prompt: "Solve the system, then give $" + vars[ix] + "$:<br>" + eqs.join("<br>"), pre: "$" + vars[ix] + " =$", answer: sol[ix],
          near: near(sol[ix], sol.map(function (v, i) { return { v: v, fb: "That is $" + vars[i] + "$. Check which unknown the question asks for.", i: i }; }).filter(function (o) { return o.i !== ix; })),
          hints: ["Eliminate the same variable from two pairs of equations, then solve the two-variable system."], why: "$(x, y, z) = (" + x0 + ", " + y0 + ", " + z0 + ")$." };
      } },
    { id: "pc9-special3", title: "Three unknowns: special cases", lesson: 8,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 2) {
          var x0 = R.int(1, 9), y0 = R.int(1, 9), z0 = R.int(1, 9), q = R.int(0, 2), nm3 = ["x", "y", "z"], S = [x0, y0, z0];
          return { type: "num", prompt: "Solve $x + y = " + (x0 + y0) + "$, $y + z = " + (y0 + z0) + "$ and $x + z = " + (x0 + z0) + "$. What is $" + nm3[q] + "$?", pre: "$" + nm3[q] + " =$", answer: S[q],
            near: near(S[q], [{ v: x0 + y0 + z0, fb: "That is $x + y + z$. Subtract the equation without $" + nm3[q] + "$ from it." }]), hints: ["Add all three equations and halve the result."], why: "$x + y + z = " + (x0 + y0 + z0) + "$, so $" + nm3[q] + " = " + S[q] + "$." };
        }
        var a = R.int(-6, 8), b = R.int(-6, 8);
        if (t === 0) return { type: "num", prompt: "For which value of $k$ do $x + y + z = " + a + "$, $x - y + z = " + b + "$ and $2x + 2z = k$ have infinitely many solutions?", pre: "$k =$", answer: a + b,
          near: near(a + b, [{ v: a - b, fb: "Add the first two equations: $y$ cancels and $2x + 2z$ appears." }, { v: (a + b) / 2, tol: 0.001, fb: "The third equation is $2x + 2z = k$, not $x + z = k$." }]), hints: ["Add the first two equations."], why: "$(x + y + z) + (x - y + z) = 2x + 2z = " + (a + b) + "$." };
        var inf = R.chance(0.5), c3 = inf ? a + b : a + b + R.nz(-4, 4), right = inf ? "Infinitely many solutions" : "No solution", all = ["No solution", "Exactly one solution", "Infinitely many solutions"];
        return mc(R, { prompt: "How many solutions does $x + y + z = " + a + "$, $x - y + z = " + b + "$, $2x + 2z = " + c3 + "$ have?", right: right, wrong: all.filter(function (x) { return x !== right; }).map(function (x) { return { t: x, fb: "Add the first two equations and compare with the third." }; }), keep: true, hints: ["Add the first two equations, then compare with the third."], why: "The first two give $2x + 2z = " + (a + b) + "$, and the third says $" + c3 + "$." });
      } },
    { id: "pc9-linecurve", title: "A line meets a curve", lesson: 9,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0) {
          var r1 = R.int(-5, 5), r2;
          do { r2 = R.int(-5, 5); } while (r2 === r1);
          var big = Math.max(r1, r2), small = Math.min(r1, r2);
          return { type: "num", prompt: "The line $y = " + LINT(r1 + r2, -r1 * r2) + "$ meets the parabola $y = x^2$ at two points. What is the **larger** $x$-coordinate?", pre: "$x =$", answer: big,
            near: near(big, [{ v: small, fb: "That is the smaller $x$-coordinate." }, { v: big * big, fb: "That is the $y$-coordinate $x^2$." }]), hints: ["Set $x^2$ equal to the line and solve the quadratic."], why: "$x = " + r1 + "$ or $x = " + r2 + "$." };
        }
        if (t === 1) {
          var m = R.int(-4, 4), D = R.int(0, 2), c, base;
          if (D === 0) { m = 2 * R.nz(-2, 2); c = -m * m / 4; }
          else { base = -m * m / 4; c = D === 1 ? Math.floor(base) + R.int(1, 3) : Math.ceil(base) - R.int(1, 3); }
          var disc = m * m + 4 * c, n = disc < 0 ? 0 : disc === 0 ? 1 : 2;
          return { type: "num", prompt: "How many points do the parabola $y = x^2$ and the line $y = " + LINT(m, c) + "$ have in common?", pre: "points =", answer: n,
            near: near(n, [0, 1, 2].map(function (v) { return { v: v, fb: "Set $x^2$ equal to the line, bring everything to one side, and look at the discriminant $b^2 - 4ac$: positive gives two points, zero one, negative none." }; })), hints: ["Write the quadratic $x^2 - mx - c = 0$ and find its discriminant."], why: "The discriminant is $" + disc + "$: " + n + " point" + (n === 1 ? "" : "s") + "." };
        }
        if (t === 2) {
          var cc = R.pick([-7, -1, 1, 7]), xl = (-cc + Math.sqrt(50 - cc * cc)) / 2;
          return { type: "num", prompt: "The circle $x^2 + y^2 = 25$ meets the line $y = " + LINT(1, cc) + "$ at two points. What is the **larger** $x$-coordinate?", pre: "$x =$", answer: xl,
            near: near(xl, [{ v: xl + cc, fb: "That is the $y$-coordinate of that point. We want $x$." }, { v: (-cc - Math.sqrt(50 - cc * cc)) / 2, fb: "That is the smaller $x$-coordinate." }]), hints: ["Substitute $y = x + c$ into the circle and solve the quadratic."], why: "$x = " + xl + "$." };
        }
        var c4 = R.int(-10, 10), n4 = Math.abs(c4) <= 7 ? 2 : 0;
        return { type: "num", prompt: "How many points do the circle $x^2 + y^2 = 25$ and the line $y = " + LINT(1, c4) + "$ have in common?", pre: "points =", answer: n4,
          near: near(n4, [0, 1, 2].map(function (v) { return { v: v, fb: "Substitute the line into the circle and use the discriminant of the quadratic." }; })), hints: ["Substitute $y = x + c$ and find the discriminant of the quadratic in $x$."], why: "The discriminant is $" + (4 * c4 * c4 - 8 * (c4 * c4 - 25)) + "$, so there are " + n4 + " points." };
      } },
    { id: "pc9-nlelim", title: "Nonlinear systems by elimination", lesson: 10,
      gen: function (R) {
        var t = R.int(0, 2), a = R.int(1, 6), b = R.int(1, 6);
        if (t <= 1) {
          var X = a * a, Y = b * b, ask = t === 0;
          return { type: "num", prompt: "Solve $x^2 + y^2 = " + (X + Y) + "$ and $x^2 - y^2 = " + (X - Y) + "$. What is the **positive** value of $" + (ask ? "x" : "y") + "$?", pre: "$" + (ask ? "x" : "y") + " =$", answer: ask ? a : b,
            near: near(ask ? a : b, [{ v: ask ? b : a, fb: "That is the other unknown." }, { v: ask ? X : Y, fb: "That is the square. Take its square root." }]), hints: ["Add the equations to find $x^2$, subtract to find $y^2$."], why: "$x^2 = " + X + "$ and $y^2 = " + Y + "$." };
        }
        var Xs = R.chance(0.25) ? 0 : R.int(-3, 25), Ys = R.chance(0.25) ? 0 : R.int(-3, 25);
        var n = Xs < 0 || Ys < 0 ? 0 : (Xs > 0 ? 2 : 1) * (Ys > 0 ? 2 : 1);
        return { type: "num", prompt: "How many solutions $(x, y)$ do $x^2 + y^2 = " + (Xs + Ys) + "$ and $x^2 - y^2 = " + (Xs - Ys) + "$ have?", pre: "solutions =", answer: n,
          near: near(n, [0, 1, 2, 4].map(function (v) { return { v: v, fb: "Find $x^2$ and $y^2$. A negative square gives none; a square of 0 gives one value; a positive square gives two. Multiply the counts." }; })), hints: ["Add and subtract to find $x^2$ and $y^2$ first."], why: "$x^2 = " + Xs + "$ and $y^2 = " + Ys + "$: " + n + " solutions." };
      } },
    { id: "pc9-ineq", title: "Systems of inequalities", lesson: 11,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 2) {
          var u = R.int(2, 8), v = R.int(2, 8), ar = u * v / 2;
          return { type: "num", prompt: "Find the area of the region $x \\ge 0$, $y \\ge 0$, $" + LCF([v, u], ["x", "y"]) + " \\le " + u * v + "$.", pre: "area =", answer: ar, tol: 0.001,
            near: near(ar, [{ v: u * v, tol: 0.001, fb: "The region is a **triangle**: half of base times height." }]), hints: ["Find where the line meets each axis."], why: "A right triangle with legs $" + u + "$ and $" + v + "$." };
        }
        var kind = R.pick(["sq", "ln"]), a = R.int(-4, 4), m = R.nz(-2, 2), b = R.int(-3, 6), op1 = STRICT(R), op2 = STRICT(R), p = R.int(-4, 4), q = R.int(-4, 6);
        var f = function (x) { return kind === "sq" ? x * x + a : m * x + a; }, g = kind === "sq" ? "x^2" + (a === 0 ? "" : (a < 0 ? " - " : " + ") + Math.abs(a)) : LINT(m, a);
        if (R.chance(0.35)) q = f(p);
        else if (R.chance(0.35)) q = b - p;
        return VERDICT(R, "Does the point $(" + p + ", " + q + ")$ satisfy both $y " + op1 + " " + g + "$ and $x + y " + op2 + " " + b + "$?", HOLDS(q, op1, f(p)), HOLDS(p + q, op2, b), ["Substitute the point into each inequality separately. Is equality allowed?"], "Check each inequality: strict ones do not allow equality.");
      } },
    { id: "pc9-pf1", title: "Partial fractions: distinct factors", lesson: 12,
      gen: function (R) {
        var a = R.int(-4, 4), b, A = R.nz(-5, 5), B = R.nz(-5, 5), t = R.int(0, 2);
        do { b = R.int(-4, 4); } while (b === a);
        var den = FX(a) + FX(b), ask = R.chance(0.5), ans = ask ? A : B;
        if (t === 2) {
          var p = -a - b + A + B, q = a * b - A * b - B * a;
          return { type: "num", prompt: "$\\dfrac{" + POLY([1, p, q]) + "}{" + den + "} = 1 + \\dfrac{A}{" + FX(a) + "} + \\dfrac{B}{" + FX(b) + "}$. What is $" + (ask ? "A" : "B") + "$?", pre: "$" + (ask ? "A" : "B") + " =$", answer: ans,
            near: near(ans, [{ v: ask ? B : A, fb: "That is the other constant." }]), hints: ["Subtract the 1 from both sides first, then combine over the common denominator."], why: "$A = " + A + "$ and $B = " + B + "$." };
        }
        var pp = A + B, qq = -(A * b + B * a);
        return { type: "num", prompt: "$\\dfrac{" + LINT(pp, qq) + "}{" + den + "} = \\dfrac{A}{" + FX(a) + "} + \\dfrac{B}{" + FX(b) + "}$. What is $" + (ask ? "A" : "B") + "$?", pre: "$" + (ask ? "A" : "B") + " =$", answer: ans,
          near: near(ans, [{ v: ask ? B : A, fb: "That is the other constant: $A$ goes over $" + FX(a) + "$." }]), hints: ["Clear the denominators, then put in the $x$ that makes one factor zero."], why: "$A = " + A + "$ and $B = " + B + "$." };
      } },
    { id: "pc9-pf2", title: "Repeated and quadratic factors", lesson: 13,
      gen: function (R) {
        var t = R.int(0, 2), a = R.nz(-3, 3);
        if (t === 0) {
          var A = R.nz(-5, 5), B = R.nz(-5, 5);
          return { type: "num", prompt: "$\\dfrac{" + LINT(A, B - A * a) + "}{" + FX(a) + "^2} = \\dfrac{A}{" + FX(a) + "} + \\dfrac{B}{" + FX(a) + "^2}$. What is $B$?", pre: "$B =$", answer: B,
            near: near(B, [{ v: A, fb: "That is $A$, the coefficient of $x$ in the numerator." }]), hints: ["Clear the denominators and put in the $x$ that makes $" + FX(a) + "$ zero."], why: "Putting in $x = " + a + "$ gives $B = " + B + "$." };
        }
        if (t === 1) {
          var c = R.pick([1, 4, 9]), A1 = R.nz(-4, 4), B1 = R.nz(-3, 3), C1 = R.nz(-3, 3), which = R.int(0, 2), nmv = ["A", "B", "C"], vals = [A1, B1, C1];
          var top = POLY([A1 + B1, C1 - a * B1, c * A1 - a * C1]);
          return { type: "num", prompt: "$\\dfrac{" + top + "}{" + FX(a) + "(x^2 + " + c + ")} = \\dfrac{A}{" + FX(a) + "} + \\dfrac{Bx + C}{x^2 + " + c + "}$. What is $" + nmv[which] + "$?", pre: "$" + nmv[which] + " =$", answer: vals[which],
            near: near(vals[which], vals.map(function (v, i) { return { v: v, fb: "That is $" + nmv[i] + "$. Check which constant the question asks for.", i: i }; }).filter(function (o) { return o.i !== which; })),
            hints: ["Clear the denominators. Put in the $x$ that makes " + FX(a) + " zero for $A$; compare the $x^2$ coefficients for $B$ and the $x$ coefficients for $C$."], why: "$A = " + A1 + "$, $B = " + B1 + "$, $C = " + C1 + "$." };
        }
        var b2, A2 = R.nz(-4, 4), B2 = R.nz(-4, 4), C2 = R.nz(-4, 4);
        do { b2 = R.int(-3, 3); } while (b2 === a);
        var top3 = POLY([A2 + C2, -A2 * (a + b2) + B2 - 2 * a * C2, A2 * a * b2 - B2 * b2 + C2 * a * a]), askB = R.chance(0.5);
        return { type: "num", prompt: "$\\dfrac{" + top3 + "}{" + FX(a) + "^2" + FX(b2) + "} = \\dfrac{A}{" + FX(a) + "} + \\dfrac{B}{" + FX(a) + "^2} + \\dfrac{C}{" + FX(b2) + "}$. What is $" + (askB ? "B" : "C") + "$?", pre: "$" + (askB ? "B" : "C") + " =$", answer: askB ? B2 : C2,
          near: near(askB ? B2 : C2, [{ v: askB ? C2 : B2, fb: "That is the other constant." }, { v: A2, fb: "That is $A$." }]), hints: ["Clear the denominators, then put in the $x$ that makes the matching factor zero."], why: "$A = " + A2 + "$, $B = " + B2 + "$, $C = " + C2 + "$." };
      } },
    { id: "pc9-matops", title: "Matrix operations", lesson: 14,
      gen: function (R) {
        var t = R.int(0, 2), c = R.pick([2, 3]), A = RMAT(R, 2, c, -6, 6), B = RMAT(R, 2, c, -6, 6), i = R.int(0, 1), j = R.int(0, c - 1), pos = "row " + (i + 1) + ", column " + (j + 1);
        if (t === 2) return { type: "num", prompt: "If $A + X = B$ with $A = " + PMT(A) + "$ and $B = " + PMT(B) + "$, what is the entry of $X$ in " + pos + "?", pre: "entry =", answer: B[i][j] - A[i][j],
          near: near(B[i][j] - A[i][j], [{ v: A[i][j] - B[i][j], fb: "$X = B - A$, in that order." }, { v: A[i][j] + B[i][j], fb: "Subtract $A$ from both sides: $X = B - A$." }]), hints: ["$X = B - A$, entry by entry."], why: "$" + B[i][j] + " - (" + A[i][j] + ") = " + (B[i][j] - A[i][j]) + "$." };
        var k = R.nz(-3, 3), m = t === 0 ? 1 : R.nz(-3, 3), val = k * A[i][j] + m * B[i][j];
        return { type: "num", prompt: "With $A = " + PMT(A) + "$ and $B = " + PMT(B) + "$, what is the entry in " + pos + " of $" + (k === 1 ? "" : k === -1 ? "-" : k) + "A " + (m < 0 ? "- " : "+ ") + (Math.abs(m) === 1 ? "" : Math.abs(m)) + "B$?", pre: "entry =", answer: val,
          near: near(val, [{ v: k * A[i][j], fb: "Do not forget the $B$ part." }, { v: A[i][j] + B[i][j], fb: "Scale first: multiply by the numbers in front of $A$ and $B$." }]), hints: ["Multiply the entries in the same position, then combine them."], why: "$" + k + "(" + A[i][j] + ") + (" + m + ")(" + B[i][j] + ") = " + val + "$." };
      } },
    { id: "pc9-matmul", title: "Matrix multiplication", lesson: 15,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 2) {
          var mm = R.int(1, 4), nn = R.int(1, 4), pp = R.chance(0.6) ? nn : R.int(1, 4), qq = R.int(1, 4), ans = nn === pp ? mm * qq : 0;
          return { type: "num", prompt: "$A$ is $" + mm + " \\times " + nn + "$ and $B$ is $" + pp + " \\times " + qq + "$. How many entries does $AB$ have? (Type 0 if $AB$ is not defined.)", pre: "entries =", answer: ans,
            near: near(ans, [{ v: mm * qq, fb: "First check whether the product exists: the columns of $A$ must equal the rows of $B$." }, { v: nn * pp, fb: "The product has the rows of $A$ and the columns of $B$." }]), hints: ["The inner numbers must match; the outer numbers give the size."], why: ans === 0 ? "$" + nn + " \\ne " + pp + "$, so $AB$ is not defined." : "$AB$ is $" + mm + " \\times " + qq + "$." };
        }
        var n = t === 0 ? 2 : 3, A = RMAT(R, 2, n, -4, 4), B = RMAT(R, n, 2, -4, 4), P = MUL(A, B), i = R.int(0, 1), j = R.int(0, 1);
        return { type: "num", prompt: "With $A = " + PMT(A) + "$ and $B = " + PMT(B) + "$, what is the entry in row " + (i + 1) + ", column " + (j + 1) + " of $AB$?", pre: "entry =", answer: P[i][j],
          near: near(P[i][j], [{ v: P[j][i], fb: "That is the entry in the swapped position. Row " + (i + 1) + " of $A$ goes with column " + (j + 1) + " of $B$." }, { v: A[i][0] * B[0][j], fb: "Add all the products across the row and down the column." }]), hints: ["Row " + (i + 1) + " of $A$ times column " + (j + 1) + " of $B$: multiply matching entries and add."], why: "The entry is " + P[i][j] + "." };
      } },
    { id: "pc9-gauss2", title: "Gaussian elimination", lesson: 16,
      gen: function (R) {
        var t = R.int(0, 1);
        if (t === 0) {
          var R1 = [R.nz(-4, 4), R.nz(-4, 4), R.int(-8, 8)], R2 = [R.int(-5, 5), R.nz(-4, 4), R.int(-8, 8)], k = R.nz(-3, 3), j = R.int(0, 2), val = R2[j] - k * R1[j];
          return { type: "num", prompt: "Row 1 is $[\\," + R1[0] + "\\ \\ " + R1[1] + "\\ |\\ " + R1[2] + "\\,]$ and row 2 is $[\\," + R2[0] + "\\ \\ " + R2[1] + "\\ |\\ " + R2[2] + "\\,]$. After $R_2 \\to R_2 " + (k < 0 ? "+ " : "- ") + (Math.abs(k) === 1 ? "" : Math.abs(k)) + "R_1$, what is the " + ["first", "second", "last"][j] + " entry of row 2?", pre: "entry =", answer: val,
            near: near(val, [{ v: R2[j] + k * R1[j], fb: "Check the sign: " + (k < 0 ? "adding" : "subtracting") + " " + Math.abs(k) + " times row 1." }, { v: k * R1[j], fb: "Then take that away from (or add it to) the old entry of row 2." }]), hints: ["New entry = old row 2 entry " + (k < 0 ? "plus " : "minus ") + Math.abs(k) + " times the row 1 entry above it."], why: "$" + R2[j] + (k < 0 ? " + " : " - ") + Math.abs(k) + "(" + R1[j] + ") = " + val + "$." };
        }
        var x0 = R.int(-4, 5), y0 = R.int(-4, 5), b, d, e;
        do { b = R.int(-4, 4); d = R.nz(-4, 4); e = R.nz(-4, 4); } while (e - d * b === 0);
        return { type: "num", prompt: "Solve $" + EQN([1, b], ["x", "y"], x0 + b * y0) + "$ and $" + EQN([d, e], ["x", "y"], d * x0 + e * y0) + "$ by row-reducing. What is $y$?", pre: "$y =$", answer: y0,
          near: near(y0, [{ v: x0, fb: "That is $x$. Row 2 after clearing under the leading 1 gives $y$ first." }]), hints: ["Clear the entry under the leading 1, then read $y$ from the bottom row."], why: "$y = " + y0 + "$ and $x = " + x0 + "$." };
      } },
    { id: "pc9-gauss3", title: "Gaussian elimination, three unknowns", lesson: 17,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 0) {
          var kk = R.chance(0.5) ? 0 : R.nz(-6, 6), right = kk === 0 ? "Infinitely many solutions" : "No solution", all = ["No solution", "Exactly one solution", "Infinitely many solutions"], a = R.int(-3, 4), b = R.int(-3, 4);
          return mc(R, { prompt: "A system reduces to $[\\,1\\ \\ 1\\ \\ 1\\ |\\ " + a + "\\,]$, $[\\,0\\ \\ 1\\ \\ 2\\ |\\ " + b + "\\,]$ and $[\\,0\\ \\ 0\\ \\ 0\\ |\\ " + kk + "\\,]$. What does that say?", right: right, wrong: all.filter(function (x) { return x !== right; }).map(function (x) { return { t: x, fb: "Read the last row as an equation: $0 = " + kk + "$. Is it true?" }; }), keep: true, hints: ["Read the last row as an equation."], why: "$0 = " + kk + "$ " + (kk === 0 ? "is always true." : "is false.") });
        }
        if (t === 1) {
          var a2 = R.int(-3, 3), b2 = R.int(-3, 3), d = R.int(-3, 3), x0 = R.int(-3, 5), y0 = R.int(-3, 5), z0 = R.int(-3, 5), ix = R.chance(0.5);
          var c = x0 + a2 * y0 + b2 * z0, e = y0 + d * z0;
          return { type: "num", prompt: "The row-reduced matrix is $[\\,1\\ \\ " + a2 + "\\ \\ " + b2 + "\\ |\\ " + c + "\\,]$, $[\\,0\\ \\ 1\\ \\ " + d + "\\ |\\ " + e + "\\,]$, $[\\,0\\ \\ 0\\ \\ 1\\ |\\ " + z0 + "\\,]$. What is $" + (ix ? "x" : "y") + "$?", pre: "$" + (ix ? "x" : "y") + " =$", answer: ix ? x0 : y0,
            near: near(ix ? x0 : y0, [{ v: z0, fb: "That is $z$, from the bottom row. Climb up for the others." }, { v: ix ? c : e, fb: "That is the right-hand number of the row. Move the other terms across first." }]), hints: ["Bottom row first: it gives $z$. Then use the middle row for $y$."], why: "$z = " + z0 + "$, $y = " + y0 + "$, $x = " + x0 + "$." };
        }
        var M = RMAT(R, 3, 4, -3, 3), k3 = R.nz(-3, 3), j3 = R.int(1, 3), val3 = M[2][j3 - 1] - k3 * M[0][j3 - 1];
        return { type: "num", prompt: "Row 1 is $[\\," + M[0][0] + "\\ \\ " + M[0][1] + "\\ \\ " + M[0][2] + "\\ |\\ " + M[0][3] + "\\,]$ and row 3 is $[\\," + M[2][0] + "\\ \\ " + M[2][1] + "\\ \\ " + M[2][2] + "\\ |\\ " + M[2][3] + "\\,]$. After $R_3 \\to R_3 " + (k3 < 0 ? "+ " : "- ") + (Math.abs(k3) === 1 ? "" : Math.abs(k3)) + "R_1$, what is the " + ["first", "second", "third"][j3 - 1] + " entry of row 3?", pre: "entry =", answer: val3,
          near: near(val3, [{ v: M[2][j3 - 1] + k3 * M[0][j3 - 1], fb: "Check the sign of the operation." }, { v: M[2][j3 - 1], fb: "That is the old entry. Apply the row operation." }]), hints: ["New entry = old row 3 entry " + (k3 < 0 ? "plus " : "minus ") + Math.abs(k3) + " times the row 1 entry above it."], why: "$" + M[2][j3 - 1] + (k3 < 0 ? " + " : " - ") + Math.abs(k3) + "(" + M[0][j3 - 1] + ") = " + val3 + "$." };
      } },
    { id: "pc9-inverse", title: "Inverse matrices", lesson: 18,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0) {
          var a = R.int(-5, 6), b = R.int(-5, 6), c = R.int(-5, 6), d = R.int(-5, 6);
          return { type: "num", prompt: "Find $ad - bc$ for $" + PMT([[a, b], [c, d]]) + "$.", pre: "$ad - bc =$", answer: DET2(a, b, c, d),
            near: near(DET2(a, b, c, d), [{ v: a * d + b * c, fb: "It is $ad$ **minus** $bc$." }, { v: b * c - a * d, fb: "Order matters: $ad - bc$, not $bc - ad$." }]), hints: ["Multiply down the main diagonal, then subtract the other diagonal."], why: "$" + a * d + " - (" + b * c + ") = " + DET2(a, b, c, d) + "$." };
        }
        if (t === 3) {
          var bb = R.nz(-5, 5), cc = R.nz(-5, 5), prod = bb * cc, divs = [], q;
          for (q = -6; q <= 6; q++) if (q !== 0 && prod % q === 0) divs.push(q);
          var dd = R.pick(divs), kk = prod / dd;
          return { type: "num", prompt: "For which value of $k$ does $" + PMT([["k", bb], [cc, dd]]) + "$ have **no inverse**?", pre: "$k =$", answer: kk,
            near: near(kk, [{ v: prod, fb: "Set $ad - bc = 0$: $kd = bc$, so divide by $d$." }, { v: -kk, fb: "Check the sign when you divide." }]), hints: ["No inverse means $ad - bc = 0$."], why: "$" + dd + "k = " + prod + "$, so $k = " + kk + "$." };
        }
        var M = R.pick(UNI), dt = DET2(M[0][0], M[0][1], M[1][0], M[1][1]), inv = [[M[1][1] / dt, -M[0][1] / dt], [-M[1][0] / dt, M[0][0] / dt]];
        if (t === 1) {
          var i = R.int(0, 1), j = R.int(0, 1);
          return { type: "num", prompt: "Find the entry in row " + (i + 1) + ", column " + (j + 1) + " of the inverse of $" + PMT(M) + "$.", pre: "entry =", answer: inv[i][j],
            near: near(inv[i][j], [{ v: M[i][j], fb: "That is the entry of $A$ itself. The inverse swaps the diagonal, changes the sign of the other two, and divides by the determinant." }, { v: -inv[i][j], fb: "Check the signs: divide by the determinant $" + dt + "$." }]), hints: ["Swap $a$ and $d$, negate $b$ and $c$, divide by $ad - bc$."], why: "The inverse is $" + PMT(inv) + "$." };
        }
        var x0 = R.int(-5, 6), y0 = R.int(-5, 6), ix = R.chance(0.5);
        return { type: "num", prompt: "Solve $" + EQN([M[0][0], M[0][1]], ["x", "y"], M[0][0] * x0 + M[0][1] * y0) + "$ and $" + EQN([M[1][0], M[1][1]], ["x", "y"], M[1][0] * x0 + M[1][1] * y0) + "$ using the inverse of the matrix of coefficients. What is $" + (ix ? "x" : "y") + "$?", pre: "$" + (ix ? "x" : "y") + " =$", answer: ix ? x0 : y0,
          near: near(ix ? x0 : y0, [{ v: ix ? y0 : x0, fb: "That is the other unknown." }]), hints: ["$X = A^{-1}B$: multiply the inverse by the column of constants."], why: "$(x, y) = (" + x0 + ", " + y0 + ")$." };
      } },
    { id: "pc9-cramer", title: "Determinants and Cramer's rule", lesson: 19,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0) {
          var a = R.int(-5, 6), b = R.int(-5, 6), c = R.int(-5, 6), d = R.int(-5, 6);
          return { type: "num", prompt: "Find the determinant $" + VMT([[a, b], [c, d]]) + "$.", pre: "$D =$", answer: DET2(a, b, c, d),
            near: near(DET2(a, b, c, d), [{ v: a * d + b * c, fb: "It is $ad - bc$: subtract." }]), hints: ["$ad - bc$."], why: "$" + a * d + " - (" + b * c + ") = " + DET2(a, b, c, d) + "$." };
        }
        if (t === 1) {
          var M = RMAT(R, 3, 3, -3, 3);
          return { type: "num", prompt: "Find the determinant $" + VMT(M) + "$.", pre: "$D =$", answer: DET3(M),
            near: near(DET3(M), [{ v: M[0][0] * M[1][1] * M[2][2] - M[0][1] * M[1][2] * M[2][0] - M[0][2] * M[1][0] * M[2][1], fb: "Expand along row 1 with signs $+\\ -\\ +$ and use the $2 \\times 2$ determinants." }]), hints: ["Expand along the top row with signs plus, minus, plus."], why: "The determinant is " + DET3(M) + "." };
        }
        if (t === 3) {
          var aa = R.nz(-5, 5), dd = R.nz(-5, 5), prod = aa * dd, cs = [], q;
          for (q = -6; q <= 6; q++) if (q !== 0 && prod % q === 0) cs.push(q);
          var cc = R.pick(cs), kk = prod / cc;
          return { type: "num", prompt: "For which value of $k$ do $" + LCF([aa], ["x"]) + " + ky = 1$ and $" + EQN([cc, dd], ["x", "y"], 2) + "$ fail to have a unique solution?", pre: "$k =$", answer: kk,
            near: near(kk, [{ v: prod, fb: "Set $D = 0$ and divide by the coefficient of $x$ in the second equation." }, { v: -kk, fb: "Check the sign." }]), hints: ["Cramer's rule needs $D \\ne 0$. Find $k$ with $D = 0$."], why: "$D = " + prod + " - " + (cc < 0 ? "(" + cc + ")" : cc) + "k = 0$ gives $k = " + kk + "$." };
        }
        var x0 = R.int(-5, 6), y0 = R.int(-5, 6), a1, b1, a2, b2;
        do { a1 = R.nz(-4, 4); b1 = R.nz(-4, 4); a2 = R.nz(-4, 4); b2 = R.nz(-4, 4); } while (DET2(a1, b1, a2, b2) === 0);
        var ix = R.chance(0.5);
        return { type: "num", prompt: "Use Cramer's rule on $" + EQN([a1, b1], ["x", "y"], a1 * x0 + b1 * y0) + "$ and $" + EQN([a2, b2], ["x", "y"], a2 * x0 + b2 * y0) + "$. What is $" + (ix ? "x" : "y") + "$?", pre: "$" + (ix ? "x" : "y") + " =$", answer: ix ? x0 : y0,
          near: near(ix ? x0 : y0, [{ v: ix ? y0 : x0, fb: "That is the other unknown." }]), hints: ["Divide the determinant with the constants swapped in by the determinant of the coefficients."], why: "$(x, y) = (" + x0 + ", " + y0 + ")$." };
      } }
  ];
  L.unit("precalc", 9, {
    title: "Systems of Equations and Inequalities",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Graphing, substitution and elimination for two unknowns.", skills: ["pc9-graph", "pc9-sub", "pc9-elim"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "No solution, infinitely many solutions, and systems from stories.", skills: ["pc9-special", "pc9-story"], per: 3 },
      { title: "Quiz 3", after: 8, blurb: "Three equations in three unknowns, and their special cases.", skills: ["pc9-three", "pc9-special3"], per: 3 },
      { title: "Quiz 4", after: 11, blurb: "A line meeting a curve, nonlinear elimination and systems of inequalities.", skills: ["pc9-linecurve", "pc9-nlelim", "pc9-ineq"], per: 2 },
      { title: "Quiz 5", after: 13, blurb: "Partial fractions: distinct, repeated and quadratic factors.", skills: ["pc9-pf1", "pc9-pf2"], per: 3 },
      { title: "Quiz 6", after: 15, blurb: "Adding, scaling and multiplying matrices.", skills: ["pc9-matops", "pc9-matmul"], per: 3 },
      { title: "Quiz 7", after: 17, blurb: "Gaussian elimination with two and three unknowns.", skills: ["pc9-gauss2", "pc9-gauss3"], per: 3 },
      { title: "Quiz 8", after: 19, blurb: "Inverse matrices, determinants and Cramer's rule.", skills: ["pc9-inverse", "pc9-cramer"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:9", {
    2: { name: "Where two lines meet", frame: "A solution of a system is a point on [[both]] graphs. Two lines with different slopes meet [[once]]. The same slope with different intercepts never meet, so there is [[no]] solution.",
         chips: ["either", "twice"], fb: { "either": "A solution has to lie on **both** graphs, not just one.", "twice": "Two different lines can cross at most once." } },
    3: { name: "Substitution", frame: "Solve one equation for a variable, then [[substitute]] that expression into the other equation. Solve for the remaining unknown, [[back-substitute]] for the first, and check in [[both]] equations.",
         chips: ["add", "one"], fb: { "add": "Adding the equations is elimination. Substitution replaces a variable by an expression.", "one": "Check the pair in both equations, not just the one you used last." } },
    4: { name: "Elimination", frame: "Multiply so that one variable has [[opposite]] coefficients, then [[add]] the equations: that variable disappears. Every combination of the two equations still passes through the [[solution]].",
         chips: ["equal", "subtract"], fb: { "equal": "Equal coefficients are removed by subtracting; opposite ones by adding.", "subtract": "With opposite coefficients you add. You subtract when the coefficients are equal." } },
    5: { name: "No solution, or infinitely many", frame: "If both variables vanish and what is left is false, such as $0 = 7$, there is [[no]] solution: the lines are parallel. If it is true, such as [[$0 = 0$]], there are infinitely many: it is the [[same]] line.",
         chips: ["one", "$0 = 7$"], fb: { "one": "A single solution leaves a value like $x = 3$, not $0 = 0$.", "$0 = 7$": "That one is false, and a false statement means no solution." } },
    6: { name: "Systems from stories", frame: "Name the [[two]] unknowns, write one equation for each [[fact]] in the story, solve, and answer in [[words]], checking against the story.",
         chips: ["three", "guess"], fb: { "three": "Two unknowns need two equations.", "guess": "Write an equation for each fact in the story rather than guessing." } },
    7: { name: "Three equations, three unknowns", frame: "Remove the [[same]] variable from [[two pairs]] of equations to get a two-variable system. Solve it, then [[back-substitute]] to find the third unknown, and check all three equations.",
         chips: ["different", "one pair"], fb: { "different": "Removing the same variable is what makes the two new equations share the same two unknowns.", "one pair": "You need two new equations to solve for two unknowns." } },
    8: { name: "Three unknowns: special cases", frame: "A row that reduces to [[$0 = 0$]] means infinitely many solutions, written with a [[parameter]] $t$. A row such as $0 = 5$ means [[no]] solution.",
         chips: ["one", "$0 = 5$"], fb: { "one": "A single solution leaves values for all three unknowns.", "$0 = 5$": "That row is false, so it means no solution; $0 = 0$ is the true one." } },
    9: { name: "A line meets a curve", frame: "Substitute the line into the curve to get a [[quadratic]]. Its [[discriminant]] tells how many points: positive gives [[two]], zero gives one (a tangent), negative gives none.",
         chips: ["linear", "three"], fb: { "linear": "A line and a parabola give a quadratic equation, not a linear one.", "three": "A quadratic has at most two solutions, so at most two meeting points." } },
    10: { name: "Nonlinear systems by elimination", frame: "When both equations hold only $x^2$ and $y^2$, [[add or subtract]] to find each square. Take the [[$\\pm$]] roots and pair them. A square equal to [[0]] gives one value; a negative square gives none.",
         chips: ["multiply", "1"], fb: { "multiply": "Adding or subtracting removes one square; multiplying does not.", "1": "A square equal to 0 gives one value, since $+0$ and $-0$ are the same." } },
    11: { name: "Systems of inequalities", frame: "Draw each boundary: [[solid]] for $\\le$ and $\\ge$, [[dashed]] for $<$ and $>$. [[Test]] a point to choose the side to shade, and keep where all the shadings [[overlap]].",
         chips: ["thick", "add"], fb: { "thick": "Thickness does not matter: solid or dashed shows whether the boundary is included.", "add": "The solution is where the shadings overlap, not where they are added." } },
    12: { name: "Partial fractions: distinct factors", frame: "Write one fraction for each [[linear factor]]: $\\frac{A}{x - a} + \\frac{B}{x - b}$. Clear the denominators, then put in $x = a$ and $x = b$ so each choice [[removes]] a term. If the top is not lower degree, [[divide]] first.",
         chips: ["quadratic", "add"], fb: { "quadratic": "Distinct linear factors each get a fraction with a constant on top.", "add": "To split, divide first when the top is not lower degree." } },
    13: { name: "Repeated and quadratic factors", frame: "A repeated factor $(x - a)^2$ needs a fraction for [[each power]]. A quadratic that will not factor needs a [[linear]] top, $Bx + C$. Find the constants with easy values of $x$ and by comparing [[coefficients]].",
         chips: ["constant", "degrees"], fb: { "constant": "Over a quadratic the top must be linear, $Bx + C$.", "degrees": "We compare the **coefficients** of each power of $x$." } },
    14: { name: "Matrices", frame: "An $m \\times n$ matrix has $m$ [[rows]] and $n$ columns. To add or subtract, the sizes must be the [[same]]. Combine entries in the same position, and to scale, multiply [[every]] entry.",
         chips: ["columns", "different"], fb: { "columns": "An $m \\times n$ matrix has $m$ **rows**: rows come first.", "different": "Only matrices of the same size can be added or subtracted." } },
    15: { name: "Matrix multiplication", frame: "$AB$ exists when the [[columns]] of $A$ equal the rows of $B$, and an $m \\times n$ times an $n \\times p$ is $m \\times p$. Entry $(i, j)$ is row $i$ of $A$ times column $j$ of $B$: multiply and [[add]]. In general $AB \\ne$ [[$BA$]].",
         chips: ["rows", "$A^2$"], fb: { "rows": "The columns of the first matrix must equal the rows of the second.", "$A^2$": "$A^2$ means $AA$. The product to compare $AB$ with is $BA$." } },
    16: { name: "Gaussian elimination", frame: "Write the system as an [[augmented]] matrix. Use row operations (swap, scale, add a multiple of a row) to put [[zeros]] below each leading entry. They never change the [[solution]]; then back-substitute from the bottom row up.",
         chips: ["inverse", "determinant"], fb: { "inverse": "The inverse is a different method for solving a system.", "determinant": "The determinant belongs to Cramer's rule, not row operations." } },
    17: { name: "Three unknowns by rows", frame: "Clear column 1, then column 2, to reach a [[staircase]] form, then back-substitute. A bottom row of zeros with $0$ on the right means [[infinitely many]] solutions; zeros with a nonzero number means [[no]] solution.",
         chips: ["one", "circle"], fb: { "one": "A single solution needs a leading entry in every column.", "circle": "The word for the shape is a staircase of leading entries." } },
    18: { name: "Inverse matrices", frame: "$AA^{-1} =$ [[$I$]]. For a $2 \\times 2$ matrix, swap $a$ and $d$, [[negate]] $b$ and $c$, and divide by [[$ad - bc$]]. If that is zero there is no inverse; otherwise $X = A^{-1}B$.",
         chips: ["$ad + bc$", "double"], fb: { "$ad + bc$": "The determinant is $ad - bc$: subtract.", "double": "The off-diagonal entries are negated, not doubled." } },
    19: { name: "Determinants and Cramer's rule", frame: "A $2 \\times 2$ determinant is [[$ad - bc$]]. Cramer's rule: $x = \\frac{D_x}{D}$, where $D_x$ has the $x$ column replaced by the [[constants]]. It needs $D \\ne$ [[0]].",
         chips: ["coefficients", "$ad + bc$"], fb: { "coefficients": "The coefficients stay in the other columns. The $x$ column is replaced by the constants.", "$ad + bc$": "The determinant is $ad - bc$: subtract." } }
  });
})();
